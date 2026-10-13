// Reactions: the Sails limit, the two windows, single cards (RULES.md 7.2–7.5, 12, 17.3, 18.1–18.3, 18.12, 18.13).
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import { deckCards, legendCards } from '../src/engine/data';
import type { GameState } from '../src/engine/state';
import type { Side } from '../src/engine/types';
import { act, data, give, newGame, passTo, setHand } from './helpers';

const DEFENDERS: Record<Side, string[]> = { ПИРАТЫ: ['Ж', 'М'], КОМПАНИЯ: ['И', 'Г'] };

/**
 * The turn of `attacker` with 8 Powder in both Holds. The defending seats hold exactly the given cards
 * (nothing if not given), so no other Reaction window opens.
 */
function battle(attacker: Side, hands: Record<string, string[]> = {}): GameState {
  const s = passTo(newGame(), attacker);
  s.teams['ПИРАТЫ'].powder = 8;
  s.teams['КОМПАНИЯ'].powder = 8;
  const defending: Side = attacker === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ';
  for (const seat of DEFENDERS[defending]) setHand(s, seat, hands[seat] ?? []);
  for (const [seat, names] of Object.entries(hands)) if (!DEFENDERS[defending].includes(seat)) setHand(s, seat, names);
  return s;
}

const card = (s: GameState, seat: string, name: string) => {
  const ship = s.ships[seat];
  const code = [...ship.hand, ...ship.plans].find((c) => cardName(c) === name);
  if (!code) throw new Error(`${seat} has no «${name}»`);
  return code;
};
const names = new Map<string, string>();
for (const c of [...deckCards(data), ...legendCards(data)]) names.set(c.code, c.name);
const cardName = (code: string) => names.get(code)!;

const react = (s: GameState, seat: string, name: string) => act(s, { type: 'react', seat, card: card(s, seat, name) }).state;
const decline = (s: GameState, seat: string) => act(s, { type: 'noReaction', seat }).state;

describe('the Sails limit (7.2, 7.3, 7.5)', () => {
  it('a ship plays no more Reactions than its Sails in the enemy turn', () => {
    // «Индевор» has Sails 1 and two «Двойная обшивка».
    let s = battle('ПИРАТЫ', { И: ['Двойная обшивка', 'Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions', window: 'before', waiting: ['И'] });
    s = react(s, 'И', 'Двойная обшивка');
    // The second copy cannot be played: the window closes, the Volley deals 2 − 2 = 0.
    expect(s.pending).toBeNull();
    expect(s.ships['И'].tracks.hull).toBe(12);
    expect(s.ships['И'].hand).toHaveLength(1);
    // The next Volley of the turn gets no window at all: М on the diagonal, 3 − 1 + 1 (joint volley).
    s = act(s, { type: 'volley', ship: 'М', target: 'И' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['И'].tracks.hull).toBe(9);
  });

  it('the limit is the current Sails: after they fall, no more Reactions than the new value (7.3)', () => {
    // «Голландец» with Sails 2 plays «Водоворот», then «Книппели» take the Sails to 0.
    let s = battle('ПИРАТЫ', { Г: ['Водоворот', 'Ответ из пучины'] });
    give(s, 'М', 'Книппели', 'Ж');
    s.ships['Г'].tracks.sails = 2;
    s = act(s, { type: 'volley', ship: 'М', target: 'Г', charge: card(s, 'М', 'Книппели') }).state;
    s = react(s, 'Г', 'Водоворот');
    // 3 − 1 = 2 to the Sails: 2 → 0. One Reaction played, Sails 0: «Ответ из пучины» may not be played.
    expect(s.ships['Г'].tracks.sails).toBe(0);
    expect(s.pending).toBeNull();
    expect(s.ships['Г'].hand.map(cardName)).toEqual(['Ответ из пучины']);
  });

  it('a Reaction from a Plan of the Black Pearl goes beyond the Sails limit (14.1)', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Уйти по ветру', 'Уйти по ветру'] });
    s.ships['Ж'].tracks.sails = 0;
    const [inHand, inPlan] = s.ships['Ж'].hand;
    s.ships['Ж'].hand = [inHand];
    s.ships['Ж'].plans = [inPlan];
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ waiting: ['Ж'] });
    expect(() => act(s, { type: 'react', seat: 'Ж', card: inHand })).toThrow('нельзя');
    s = act(s, { type: 'react', seat: 'Ж', card: inPlan }).state;
    // 3 − 3 = 0.
    expect(s.ships['Ж'].tracks.hull).toBe(9);
    expect(s.ships['Ж'].plans).toEqual([]);
    expect(s.teams['ПИРАТЫ'].powder).toBe(7);
  });

  it('the captain of a sunk ship plays 1 Reaction for the ally beyond its Sails (17.3)', () => {
    let s = battle('КОМПАНИЯ', { М: ['Зомби-офицеры', 'Тяжёлый борт'], И: ['Картечь'] });
    s.ships['М'].sunk = true;
    s.ships['М'].tracks.hull = 0;
    s.ships['Ж'].tracks.sails = 0;
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж', charge: card(s, 'И', 'Картечь') }).state;
    expect(s.pending).toMatchObject({ waiting: ['М'] });
    s = react(s, 'М', 'Зомби-офицеры');
    // Only one Reaction for the captain: the window closes; the Crew damage is cancelled.
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].tracks).toMatchObject({ crew: 3, hull: 9 });
    expect(s.ships['М'].hand.map(cardName)).toEqual(['Тяжёлый борт']);
  });
});

describe('bans on Reactions (12.8, Q17)', () => {
  it('a team under «Подкуп» plays no Reactions this turn, from Plans too', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Уйти по ветру'], М: ['Огненная стена'] });
    s.ships['Ж'].plans = s.ships['Ж'].hand.splice(0);
    s.turn.noReactTeam = true;
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].tracks.hull).toBe(6);
  });

  it('a ship under «Ужас Карибского моря» plays no Reactions this turn, from Plans too; its ally may', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Уйти по ветру'], М: ['Огненная стена'] });
    s.ships['Ж'].plans = s.ships['Ж'].hand.splice(0);
    s.turn.noReact = ['Ж'];
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(6);
    expect(s.pending).toMatchObject({ window: 'after', waiting: ['М'] });
  });
});

describe('two windows (12.2, 12.3)', () => {
  it('a Reaction «до урона» changes the damage of the Volley', () => {
    let s = battle('ПИРАТЫ', { И: ['Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'И' }).state;
    expect(s.ships['И'].tracks.hull).toBe(12);
    s = react(s, 'И', 'Двойная обшивка');
    // 3 − 1 (diagonal) − 2.
    expect(s.ships['И'].tracks.hull).toBe(12);
    expect(s.volley).toBeNull();
  });

  it('cards «после Залпа» are played only after the damage, the others only before it', () => {
    let s = battle('КОМПАНИЯ', { М: ['Ответный залп', 'Тяжёлый борт'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'М' }).state;
    expect(s.pending).toMatchObject({ window: 'before' });
    expect(() => react(s, 'М', 'Ответный залп')).toThrow('нельзя');
    s = decline(s, 'М');
    // The damage is dealt, then the window «после Залпа» opens.
    expect(s.ships['М'].tracks.hull).toBe(11 - 2);
    expect(s.pending).toMatchObject({ window: 'after', waiting: ['М'] });
    expect(() => react(s, 'М', 'Тяжёлый борт')).toThrow('нельзя');
    s = react(s, 'М', 'Ответный залп');
    // «Ответный залп»: Hull damage equal to the Guns of «Месть» — not a Volley, no diagonal penalty.
    expect(s.ships['И'].tracks.hull).toBe(12 - 3);
    expect(s.pending).toBeNull();
  });

  it('no window «после Залпа» after a cancelled Volley', () => {
    let s = battle('ПИРАТЫ', { Г: ['Уйти на глубину', 'Ответ из пучины'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    s = react(s, 'Г', 'Уйти на глубину');
    expect(s.pending).toBeNull();
    expect(s.ships['Г'].tracks.hull).toBe(11);
    expect(s.ships['Г'].hand.map(cardName)).toEqual(['Ответ из пучины']);
    expect(s.ships['М'].tracks.crew).toBe(3);
  });

  it('no window «после Залпа» when the shooter sank; the Volley still deals damage (Q18, 18.12, Q31)', () => {
    let s = battle('КОМПАНИЯ', { М: ['Тяжёлый борт', 'Ответный залп'] });
    s.ships['И'].tracks.hull = 1;
    s = act(s, { type: 'volley', ship: 'И', target: 'М' }).state;
    s = react(s, 'М', 'Тяжёлый борт');
    // «Тяжёлый борт» hits the shooter at once, before the damage.
    expect(s.ships['И'].sunk).toBe(true);
    // 3 − 1 (diagonal) − 1.
    expect(s.ships['М'].tracks.hull).toBe(11 - 1);
    expect(s.pending).toBeNull();
    expect(s.ships['М'].hand.map(cardName)).toEqual(['Ответный залп']);
  });

  it('a window opens only when a Reaction can be played in it', () => {
    // «Ответ из пучины» is played only after the Volley and «Уйти на глубину» only on a Volley at the Dutchman.
    let s = battle('ПИРАТЫ', { Г: ['Уйти на глубину'] });
    give(s, 'И', 'Ответ из пучины', 'Г');
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    // No window «до урона»: the damage is dealt at once. Only the window «после Залпа» opens, for «Ответ из пучины».
    expect(s.ships['И'].tracks.hull).toBe(10);
    expect(s.pending).toMatchObject({ window: 'after', waiting: ['И'] });
  });

  it('Reactions are paid from the defending team’s Hold: no Powder — no Reaction (6.4)', () => {
    let s = battle('ПИРАТЫ', { Г: ['Уйти на глубину'] });
    s.teams['КОМПАНИЯ'].powder = 0;
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    // «Уйти на глубину» costs 1 Powder: without it there is no Reaction and no window.
    expect(s.pending).toBeNull();
    expect(s.ships['Г'].tracks.hull).toBe(11 - 3);
  });

  it('only answers are accepted while a window is open', () => {
    let s = battle('ПИРАТЫ', { И: ['Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(() => act(s, { type: 'endTurn', side: 'ПИРАТЫ' })).toThrow('Ждём решения');
    expect(() => act(s, { type: 'noReaction', seat: 'Г' })).toThrow('уже ответил');
  });
});

describe('single Reaction cards', () => {
  it('«Прикрыть бортом»: the Volley hits the covering ship, −1; the new target reacts on its own (18.1)', () => {
    let s = battle('ПИРАТЫ', { Г: ['Прикрыть бортом', 'Уйти на глубину'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    s = react(s, 'Г', 'Прикрыть бортом');
    expect(s.volley?.target).toBe('Г');
    // Now it is a Volley at the Dutchman: «Уйти на глубину» may cancel it.
    expect(s.pending).toMatchObject({ waiting: ['Г'] });
    s = decline(s, 'Г');
    // 2 (not diagonal for the first target) − 1.
    expect(s.ships['И'].tracks.hull).toBe(12);
    expect(s.ships['Г'].tracks.hull).toBe(10);
    expect(s.turn.firstTarget).toBe('Г');
  });

  it('«Прикрыть бортом»: the Fire of «Греческий огонь» goes on the covering ship (18.13)', () => {
    let s = battle('ПИРАТЫ', { Г: ['Прикрыть бортом'], М: ['Греческий огонь'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'И', charge: card(s, 'М', 'Греческий огонь') }).state;
    s = react(s, 'Г', 'Прикрыть бортом');
    // 3 − 1 (diagonal for «Индевор») + 1 − 1.
    expect(s.ships['Г']).toMatchObject({ fires: 1, tracks: expect.objectContaining({ hull: 11 - 2 }) });
    expect(s.ships['И'].fires).toBe(0);
  });

  it('«Чёрные паруса в ночи»: cancel a diagonal Volley at the Black Pearl, not one opposite (18.2)', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Чёрные паруса в ночи'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 3);
    s = act(s, { type: 'volley', ship: 'Г', target: 'Ж' }).state;
    s = react(s, 'Ж', 'Чёрные паруса в ночи');
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 3);
  });

  it('«Чёрные паруса в ночи» from a Plan: any Volley at the Black Pearl (18.2)', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Чёрные паруса в ночи'] });
    s.ships['Ж'].plans = s.ships['Ж'].hand.splice(0);
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    s = react(s, 'Ж', 'Чёрные паруса в ночи');
    expect(s.ships['Ж'].tracks.hull).toBe(9);
  });

  it('«Чёрные паруса в ночи» after «Прикрыть бортом»: the Volley is diagonal as for the first target (Q40)', () => {
    // Г fires at «Месть» opposite; «Жемчужина» covers her with a «Прикрыть бортом» passed by her ally.
    let s = battle('КОМПАНИЯ', { Ж: ['Чёрные паруса в ночи'] });
    give(s, 'Ж', 'Прикрыть бортом', 'М');
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    s = react(s, 'Ж', 'Прикрыть бортом');
    // Г and Ж are on different places, but the Volley stays «opposite»: no «Чёрные паруса».
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].tracks.hull).toBe(9 - (2 - 1));
    expect(s.ships['Ж'].hand.map(cardName)).toEqual(['Чёрные паруса в ночи']);
  });

  it('«Всё по плану»: the Charge is cancelled, the Volley hits the Hull; its cost is not returned (18.3)', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Всё по плану'], И: ['Залп всей батареей'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж', charge: card(s, 'И', 'Залп всей батареей') }).state;
    expect(s.teams['КОМПАНИЯ'].powder).toBe(8 - 1 - 2);
    s = react(s, 'Ж', 'Всё по плану');
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 3);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(5);
  });

  it('«Всё по плану»: a Charge on another Track — the Volley hits the Hull; «no diagonal penalty» is gone too (18.3)', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Всё по плану'], И: ['Прицельный огонь'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'М', charge: card(s, 'И', 'Прицельный огонь') }).state;
    s = react(s, 'Ж', 'Всё по плану');
    // 3 − 1 (diagonal), on the Hull.
    expect(s.ships['М'].tracks).toMatchObject({ guns: 3, hull: 11 - 2 });
  });

  it('«Тяжёлый борт»: −1, and the shooter takes 1 Hull damage at once (18.12)', () => {
    let s = battle('КОМПАНИЯ', { М: ['Тяжёлый борт'] });
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    s = react(s, 'М', 'Тяжёлый борт');
    expect(s.ships['Г'].tracks.hull).toBe(10);
    expect(s.ships['М'].tracks.hull).toBe(11 - 1);
  });

  it('«Водоворот»: every Volley till the end of the turn deals 1 less', () => {
    let s = battle('ПИРАТЫ', { Г: ['Водоворот'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    s = react(s, 'Г', 'Водоворот');
    expect(s.ships['Г'].tracks.hull).toBe(11 - 2);
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.ships['И'].tracks.hull).toBe(12 - 1);
  });

  it('«Огненная стена» after a Volley at the team: a Fire and 1 Hull damage to the shooter', () => {
    let s = battle('КОМПАНИЯ', { М: ['Огненная стена'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    s = react(s, 'М', 'Огненная стена');
    expect(s.ships['И']).toMatchObject({ fires: 1, tracks: expect.objectContaining({ hull: 11 }) });
  });

  it('«Ответный огонь»: 1 Hull and 1 Sails damage to the shooter', () => {
    let s = battle('ПИРАТЫ', { И: ['Ответный огонь'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    s = react(s, 'И', 'Ответный огонь');
    expect(s.ships['М'].tracks).toMatchObject({ hull: 10, sails: 1 });
  });
});

describe('the Volley without Reactions (12.6)', () => {
  it('«Из пучины»: no Reaction windows, before or after', () => {
    let s = battle('КОМПАНИЯ', { Г: ['Из пучины'], Ж: ['Уйти по ветру', 'Ловкость рук'], М: ['Огненная стена'] });
    s = act(s, { type: 'volley', ship: 'Г', target: 'Ж', charge: card(s, 'Г', 'Из пучины') }).state;
    expect(s.pending).toBeNull();
    // 2 + 1, no diagonal penalty.
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 3);
  });

  it('«Один выстрел» from a Plan: +3 and no Reactions', () => {
    let s = battle('ПИРАТЫ', { И: ['Двойная обшивка', 'Ответный огонь'] });
    give(s, 'Ж', 'Один выстрел');
    const shot = card(s, 'Ж', 'Один выстрел');
    s.ships['Ж'].hand = s.ships['Ж'].hand.filter((c) => c !== shot);
    s.ships['Ж'].plans = [shot];
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И', charge: shot }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['И'].tracks.hull).toBe(12 - 5);
  });

  it('«Один выстрел» from the hand: +1, Reactions allowed', () => {
    let s = battle('ПИРАТЫ', { И: ['Двойная обшивка'] });
    give(s, 'Ж', 'Один выстрел');
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И', charge: card(s, 'Ж', 'Один выстрел') }).state;
    expect(s.pending).toMatchObject({ waiting: ['И'] });
  });
});

describe('«Греческий огонь» (18.13)', () => {
  it('the Fire is put even when the damage is lowered to 0', () => {
    let s = battle('ПИРАТЫ', { И: ['Двойная обшивка'], М: ['Греческий огонь'] });
    s.ships['М'].tracks.guns = 1;
    s = act(s, { type: 'volley', ship: 'М', target: 'И', charge: card(s, 'М', 'Греческий огонь') }).state;
    s = react(s, 'И', 'Двойная обшивка');
    // 1 − 1 (diagonal) + 1 − 2 → 0.
    expect(s.ships['И']).toMatchObject({ fires: 1, tracks: expect.objectContaining({ hull: 12 }) });
  });

  it('no Fire when the Charge is cancelled by «Всё по плану» or the Volley is cancelled', () => {
    let s = battle('КОМПАНИЯ', { Ж: ['Всё по плану'] });
    give(s, 'Г', 'Греческий огонь', 'М');
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: card(s, 'Г', 'Греческий огонь') }).state;
    s = react(s, 'Ж', 'Всё по плану');
    expect(s.ships['М']).toMatchObject({ fires: 0, tracks: expect.objectContaining({ hull: 11 - 2 }) });

    let t = battle('ПИРАТЫ', { Г: ['Уйти на глубину'], М: ['Греческий огонь'] });
    t = act(t, { type: 'volley', ship: 'М', target: 'Г', charge: card(t, 'М', 'Греческий огонь') }).state;
    t = react(t, 'Г', 'Уйти на глубину');
    expect(t.ships['Г'].fires).toBe(0);
  });
});
