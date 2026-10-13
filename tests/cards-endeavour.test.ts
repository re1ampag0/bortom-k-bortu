// Cards of the Endeavour deck (RULES.md 7.5, 8.3, 9, 12.8, 14.8, 18.10, 18.14, 18.16, 18.18, Q14, Q21, Q34, Q43, Q45, Q46).
// Charges and most Reactions are tested in charges, reactions and abilities.
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '../src/engine/state';
import { act, cardIn, give, namesOf, passTo, setHand, setSea, turnOf } from './helpers';

const play = (s: GameState, seat: string, name: string, extra: Partial<Extract<Action, { type: 'playCard' }>> = {}) =>
  act(s, { type: 'playCard', seat, card: cardIn(s, seat, name), ...extra });
const choose = (s: GameState, seat: string, cards: string[]) => act(s, { type: 'choose', seat, cards }).state;
const react = (s: GameState, seat: string, name: string) => act(s, { type: 'react', seat, card: cardIn(s, seat, name) }).state;

describe('Orders of the Endeavour', () => {
  it('«Шпион Мерсер»: look at the hand of the chosen enemy player; he discards a Reaction of your choice (Q45)', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Шпион Мерсер'], Ж: ['Уйти по ветру', 'Ловкость рук', 'Гиббс за штурвалом'] });
    s.ships['Ж'].plans = s.ships['Ж'].deck.splice(0, 1);
    s = play(s, 'И', 'Шпион Мерсер', { target: 'Ж' }).state;
    // Against the team: «Ловкость рук» may answer it first; the Pirates decline.
    expect(s.pending).toMatchObject({ kind: 'reactions', subject: 'card' });
    s = act(s, { type: 'noReaction', seat: 'Ж' }).state;
    const reactions = [cardIn(s, 'Ж', 'Уйти по ветру'), cardIn(s, 'Ж', 'Ловкость рук')];
    // Plans are not the hand (Q36): only the two Reactions of the hand are offered.
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'spy', waiting: ['И'], options: reactions });
    expect(() => choose(s, 'И', [cardIn(s, 'Ж', 'Гиббс за штурвалом')])).toThrow('нельзя');
    s = choose(s, 'И', [reactions[1]]);
    expect(namesOf(s.ships['Ж'].hand)).toEqual(['Уйти по ветру', 'Гиббс за штурвалом']);
    expect(s.ships['Ж'].discard).toContain(reactions[1]);
    expect(s.ships['И'].hand).toEqual([]);
  });

  it('«Шпион Мерсер»: no Reactions in that hand — draw 1 card', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Шпион Мерсер'], М: ['Брандер'] });
    s = play(s, 'И', 'Шпион Мерсер', { target: 'М' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['И'].hand).toHaveLength(1);
    expect(namesOf(s.ships['М'].hand)).toEqual(['Брандер']);
  });

  it('«Бизнес есть бизнес»: 2 Powder into the Hold', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Бизнес есть бизнес'] });
    s.teams['КОМПАНИЯ'].powder = 2;
    expect(play(s, 'И', 'Бизнес есть бизнес').state.teams['КОМПАНИЯ'].powder).toBe(4);
  });

  it('«Каперский патент»: draw 1 card and 1 Powder into the Hold', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Каперский патент'] });
    s.teams['КОМПАНИЯ'].powder = 2;
    const r = play(s, 'И', 'Каперский патент').state;
    expect(r.teams['КОМПАНИЯ'].powder).toBe(3);
    expect(r.ships['И'].hand).toHaveLength(1);
  });

  it('«Выгодная сделка»: 1 Powder, draw 3 cards', () => {
    const r = play(turnOf('КОМПАНИЯ', { И: ['Выгодная сделка'] }), 'И', 'Выгодная сделка').state;
    expect(r.ships['И'].hand).toHaveLength(3);
    expect(r.teams['КОМПАНИЯ'].powder).toBe(7);
  });

  it('«Приказ лорда Беккета»: the ally may play 2 more cards this turn (7.5)', () => {
    const r = play(turnOf('КОМПАНИЯ', { И: ['Приказ лорда Беккета'] }), 'И', 'Приказ лорда Беккета').state;
    expect(r.turn.limit['Г']).toBe(3 + 2);
    expect(r.turn.limit['И']).toBe(2);
  });

  it('«Приказ лорда Беккета» when the ally sank: nothing to do, cannot be played (9.9)', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Приказ лорда Беккета'] });
    s.ships['Г'].sunk = true;
    s.ships['Г'].tracks.hull = 0;
    expect(() => play(s, 'И', 'Приказ лорда Беккета')).toThrow('ничего не сделает');
  });

  it('«Строй линии»: a free Regroup if wanted; the team’s diagonal Volleys this turn have no penalty (18.16, Q46)', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Строй линии'] });
    s = play(s, 'И', 'Строй линии', { regroup: true }).state;
    expect(s.ships['И'].pos).toBe(1);
    expect(s.ships['Г'].pos).toBe(0);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(8);
    // It was the team's Regroup of this turn (Q34).
    expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('один раз за ход');
    // И now stands opposite М: a Volley at Ж is diagonal, but without the penalty.
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 3);
  });

  it('«Строй линии» without the Regroup: the ships stay, the Volleys still have no penalty (Q46)', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Строй линии'] });
    s = play(s, 'И', 'Строй линии').state;
    expect(s.ships['И'].pos).toBe(0);
    s = act(s, { type: 'volley', ship: 'Г', target: 'Ж' }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 2);
  });

  it('«Строй линии» in «Штиль» or after a Regroup: no Regroup, but the card can be played (9.9, Q34, Q38)', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Строй линии'] }, { sea: true });
    setSea(s, 'calm');
    expect(() => play(s, 'И', 'Строй линии', { regroup: true })).toThrow('Штиль');
    expect(play(s, 'И', 'Строй линии').state.turn.noDiag).toBe(true);
  });

  it('«Блокада»: until the end of its next turn the ship plays no Repair and does not change places; draw 1 (18.10)', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Блокада'] });
    s = play(s, 'И', 'Блокада', { target: 'Ж' }).state;
    expect(s.ships['Ж'].blockaded).toBe(true);
    expect(s.ships['И'].hand).toHaveLength(1);
    s = passTo(s, 'ПИРАТЫ');
    s.teams['ПИРАТЫ'].powder = 8;
    s.ships['Ж'].tracks.hull = 5;
    s.ships['М'].tracks.hull = 5;
    setHand(s, 'Ж', ['Плотник']);
    setHand(s, 'М', ['Плотник']);
    expect(() => play(s, 'Ж', 'Плотник')).toThrow('Блокадой');
    expect(() => act(s, { type: 'regroup', side: 'ПИРАТЫ' })).toThrow('Блокадой');
    // The ally may repair it with his own cards (Q21).
    const fixed = play(s, 'М', 'Плотник').state;
    expect(fixed.ships['М'].tracks.hull).toBe(7);
    s = passTo(s, 'КОМПАНИЯ');
    expect(s.ships['Ж'].blockaded).toBe(false);
  });

  it('«Блокада» on one ship: its ally cannot swap with it either (18.10, Q20)', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Блокада'] });
    s = play(s, 'И', 'Блокада', { target: 'М' }).state;
    s = passTo(s, 'ПИРАТЫ');
    s.teams['ПИРАТЫ'].powder = 8;
    expect(() => act(s, { type: 'regroup', side: 'ПИРАТЫ' })).toThrow('Блокадой');
  });

  it('«Ничего личного»: 1 Powder, 3 Hull damage to any enemy ship; not a Volley', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Ничего личного'], М: ['Тяжёлый борт'] });
    const r = play(s, 'И', 'Ничего личного', { target: 'М' }).state;
    expect(r.pending).toBeNull();
    expect(r.ships['М'].tracks.hull).toBe(8);
    expect(r.teams['КОМПАНИЯ'].powder).toBe(7);
  });

  it('«Указ о казнях»: each enemy ship loses 1 Crew; draw 1', () => {
    const r = play(turnOf('КОМПАНИЯ', { И: ['Указ о казнях'] }), 'И', 'Указ о казнях').state;
    expect(r.ships['Ж'].tracks.crew).toBe(2);
    expect(r.ships['М'].tracks.crew).toBe(2);
    expect(r.ships['И'].hand).toHaveLength(1);
  });

  it('«Указ о казнях» in the Pirates’ hands does not touch the Dutchman under water (Q14)', () => {
    const s = turnOf('ПИРАТЫ', {});
    const card = give(s, 'Ж', 'Указ о казнях', 'И');
    s.ships['Г'].submerged = true;
    const r = act(s, { type: 'playCard', seat: 'Ж', card }).state;
    expect(r.ships['И'].tracks.crew).toBe(1);
    expect(r.ships['Г'].tracks.crew).toBe(3);
  });

  it('«Подкуп»: until the end of this turn the enemy team plays no Reactions, from Plans too (12.8)', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Подкуп'], Ж: ['Уйти по ветру'], М: ['Тяжёлый борт'] });
    s.ships['Ж'].plans = [s.ships['Ж'].hand.pop()!];
    s = play(s, 'И', 'Подкуп').state;
    expect(s.turn.noReactTeam).toBe(true);
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toBeNull();
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].tracks.hull).toBe(6);
  });

  it('«Сделка с Сяо Фэном»: 2 Powder, 3 Hull and 1 Sails damage to any enemy ship', () => {
    const r = play(turnOf('КОМПАНИЯ', { И: ['Сделка с Сяо Фэном'] }), 'И', 'Сделка с Сяо Фэном', { target: 'Ж' }).state;
    expect(r.ships['Ж'].tracks).toMatchObject({ hull: 6, sails: 2 });
    expect(r.teams['КОМПАНИЯ'].powder).toBe(6);
  });
});

describe('Repairs of the Endeavour', () => {
  it('«Подкрепление флота»: 2 Crew to your ship or the ally’s', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Подкрепление флота'] });
    s.ships['Г'].tracks.crew = 1;
    expect(play(s, 'И', 'Подкрепление флота', { ship: 'Г' }).state.ships['Г'].tracks.crew).toBe(3);
    s.ships['И'].tracks.crew = 1;
    expect(play(s, 'И', 'Подкрепление флота').state.ships['И'].tracks.crew).toBe(2);
  });

  it('«Плотник»: 2 cells on any tracks of your ship', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Плотник'] });
    s.ships['И'].tracks = { hull: 10, sails: 0, guns: 3, crew: 2 };
    expect(play(s, 'И', 'Плотник', { repair: { hull: 1, sails: 1 } }).state.ships['И'].tracks).toMatchObject({ hull: 11, sails: 1 });
  });

  it('«Верфь Компании»: 2 Powder, 4 cells on any tracks of your ship', () => {
    const s = turnOf('КОМПАНИЯ', { И: ['Верфь Компании'] });
    s.ships['И'].tracks = { hull: 6, sails: 0, guns: 1, crew: 1 };
    const r = play(s, 'И', 'Верфь Компании', { repair: { hull: 2, guns: 1, crew: 1 } }).state;
    expect(r.ships['И'].tracks).toEqual({ hull: 8, sails: 0, guns: 2, crew: 2 });
    expect(r.teams['КОМПАНИЯ'].powder).toBe(6);
  });
});

describe('Reactions of the Endeavour', () => {
  it('«Морская пехота»: a boarding beaten off — no Crew damage, the boarding ship loses 1 Crew (18.14)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['На абордаж!'], И: ['Морская пехота'] });
    s = play(s, 'М', 'На абордаж!').state;
    // Any Company ship may answer: the card hits «Голландец», «Индевор» plays it (21.18).
    expect(s.pending).toMatchObject({ subject: 'card', waiting: ['И'] });
    s = react(s, 'И', 'Морская пехота');
    expect(s.ships['Г'].tracks).toMatchObject({ crew: 3, hull: 10 });
    expect(s.ships['М'].tracks.crew).toBe(2);
  });

  it('«Морская пехота» against a card that is not a boarding: only the Crew damage is cancelled', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Ужас Карибского моря'], И: ['Морская пехота'] });
    s = play(s, 'М', 'Ужас Карибского моря', { target: 'Г' }).state;
    s = react(s, 'И', 'Морская пехота');
    expect(s.ships['Г'].tracks.crew).toBe(3);
    expect(s.ships['М'].tracks.crew).toBe(3);
    expect(s.turn.noReact).toEqual(['Г']);
  });

  it('«Двойная обшивка» passed to the Dutchman still guards the Endeavour (Q43)', () => {
    let s = turnOf('ПИРАТЫ', {});
    give(s, 'Г', 'Двойная обшивка', 'И');
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    expect(s.pending).toBeNull();
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    s = react(s, 'Г', 'Двойная обшивка');
    expect(s.ships['И'].tracks.hull).toBe(12);
  });
});
