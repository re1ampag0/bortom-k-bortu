// Cards of the Black Pearl deck (RULES.md 9, 14.1, 18.4–18.6, 18.9, 18.15, 18.18, Q43, Q43а, Q45).
// Charges and most Reactions are tested in charges, reactions, both-sides and plans.
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '../src/engine/state';
import { act, cardIn, codesOf, give, namesOf, nextSea, passTo, turnOf } from './helpers';

const play = (s: GameState, seat: string, name: string, extra: Partial<Extract<Action, { type: 'playCard' }>> = {}) =>
  act(s, { type: 'playCard', seat, card: cardIn(s, seat, name), ...extra });
const choose = (s: GameState, seat: string, cards: string[]) => act(s, { type: 'choose', seat, cards }).state;
const react = (s: GameState, seat: string, name: string) => act(s, { type: 'react', seat, card: cardIn(s, seat, name) }).state;
const decline = (s: GameState, seat: string) => act(s, { type: 'noReaction', seat }).state;

describe('Orders of the Black Pearl', () => {
  it('«Бочки с порохом»: 2 Powder, 4 Hull damage to any enemy ship; not a Volley — no diagonal, no Volley Reactions (9.6)', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Бочки с порохом'], Г: ['Уйти на глубину'] });
    expect(() => play(s, 'Ж', 'Бочки с порохом')).toThrow('Выберите вражеский корабль');
    const r = play(s, 'Ж', 'Бочки с порохом', { target: 'Г' });
    // Г is on the diagonal of Ж: still 4. «Уйти на глубину» answers only a Volley: no window.
    expect(r.state.pending).toBeNull();
    expect(r.state.ships['Г'].tracks.hull).toBe(11 - 4);
    expect(r.state.teams['ПИРАТЫ'].powder).toBe(6);
    expect(r.state.ships['Ж'].discard).toContain(codesOf('Ж', 'Бочки с порохом')[0]);
  });

  it('a ship under water cannot be chosen by a card (14.8)', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Бочки с порохом'] });
    s.ships['Г'].submerged = true;
    expect(() => play(s, 'Ж', 'Бочки с порохом', { target: 'Г' })).toThrow('под водой');
  });

  it('«Компас Джека»: of the 3 top cards one goes to the hand, one to a Plan, the third to the discard (18.5)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Компас Джека'] });
    const [a, b, c] = s.ships['Ж'].deck;
    s = play(s, 'Ж', 'Компас Джека').state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'compass', waiting: ['Ж'], options: [a, b, c] });
    expect(() => choose(s, 'Ж', [a])).toThrow('Выберите 2');
    s = choose(s, 'Ж', [b, a]);
    expect(s.ships['Ж'].hand).toEqual([b]);
    expect(s.ships['Ж'].plans).toEqual([a]);
    expect(s.ships['Ж'].discard).toContain(c);
    expect(s.ships['Ж'].deck).not.toContain(a);
  });

  it('«Компас Джека» with 2 Plans: the Plan card goes to the hand (9.8)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Компас Джека'] });
    s.ships['Ж'].plans = s.ships['Ж'].deck.splice(5, 2);
    const [a, b] = s.ships['Ж'].deck;
    s = choose(play(s, 'Ж', 'Компас Джека').state, 'Ж', [a, b]);
    expect(s.ships['Ж'].hand).toEqual([a, b]);
    expect(s.ships['Ж'].plans).toHaveLength(2);
  });

  it('«Компас Джека» played by another ship: no Plans, the Plan card goes to the hand (Q43а)', () => {
    let s = turnOf('ПИРАТЫ', { М: [] });
    const compass = give(s, 'М', 'Компас Джека', 'Ж');
    const [a, b, c] = s.ships['М'].deck;
    s = act(s, { type: 'playCard', seat: 'М', card: compass }).state;
    expect(s.pending).toMatchObject({ options: [a, b, c] });
    s = choose(s, 'М', [a, b]);
    expect(s.ships['М'].hand).toEqual([a, b]);
    expect(s.ships['Ж'].plans).toEqual([]);
    expect(s.ships['М'].discard).toContain(c);
  });

  it('«Компас Джека» of the captain of the sunk Pearl: the Plan card goes to the hand (Q43а, 17.3)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Компас Джека'] });
    s.ships['Ж'].sunk = true;
    s.ships['Ж'].tracks.hull = 0;
    const [a, b] = s.ships['Ж'].deck;
    s = choose(play(s, 'Ж', 'Компас Джека').state, 'Ж', [a, b]);
    expect(s.ships['Ж'].hand).toEqual([a, b]);
    expect(s.ships['Ж'].plans).toEqual([]);
    expect(s.turn.captainPlayed).toEqual(['Ж']);
  });

  it('«Право на переговоры»: the chosen ship gives no Volleys in the next enemy turn, extra ones too (18.15)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Право на переговоры'] });
    s = play(s, 'Ж', 'Право на переговоры', { target: 'Г' }).state;
    expect(s.ships['Г'].parley).toBe(true);
    s = passTo(s, 'КОМПАНИЯ');
    s.teams['КОМПАНИЯ'].powder = 8;
    expect(() => act(s, { type: 'volley', ship: 'Г', target: 'М' })).toThrow('Право на переговоры');
    // «Сердце Дейви Джонса» is a Volley too.
    expect(() => act(s, { type: 'volley', ship: 'Г', target: 'М', heart: true })).toThrow('Право на переговоры');
    expect(() => act(s, { type: 'volley', ship: 'И', target: 'Ж' })).not.toThrow();
    // Diving is not a Volley (14.8, Q15).
    expect(() => act(s, { type: 'dive', ship: 'Г' })).not.toThrow();
    s = passTo(s, 'ПИРАТЫ');
    expect(s.ships['Г'].parley).toBe(false);
  });

  it('«Гиббс за штурвалом»: draw 2 cards', () => {
    const s = play(turnOf('ПИРАТЫ', { Ж: ['Гиббс за штурвалом'] }), 'Ж', 'Гиббс за штурвалом').state;
    expect(s.ships['Ж'].hand).toHaveLength(2);
  });

  it('«Обезьянка Джек»: a random card from the hand of the chosen enemy player, never a Plan (Q45, Q36)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Обезьянка Джек'], И: ['Плотник'] });
    expect(() => play(s, 'Ж', 'Обезьянка Джек')).toThrow('Выберите игрока-противника');
    expect(() => play(s, 'Ж', 'Обезьянка Джек', { target: 'М' })).toThrow('игрока-противника');
    s = play(s, 'Ж', 'Обезьянка Джек', { target: 'И' }).state;
    expect(namesOf(s.ships['Ж'].hand)).toEqual(['Плотник']);
    expect(s.ships['И'].hand).toEqual([]);
    // Played, the stolen card goes to its owner's discard (9.4).
    s.ships['Ж'].tracks.hull = 5;
    const stolen = s.ships['Ж'].hand[0];
    s = act(s, { type: 'playCard', seat: 'Ж', card: stolen }).state;
    expect(s.ships['И'].discard).toContain(stolen);
  });

  it('«Обезьянка Джек»: the captain of a sunk ship is a player too (Q45)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Обезьянка Джек'], И: ['Плотник'] });
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    s = play(s, 'Ж', 'Обезьянка Джек', { target: 'И' }).state;
    expect(namesOf(s.ships['Ж'].hand)).toEqual(['Плотник']);
  });

  it('«Безумный план»: draw 2, then put 1 card from the hand into a Plan (18.6)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Безумный план'] });
    const [a, b] = s.ships['Ж'].deck;
    s = play(s, 'Ж', 'Безумный план').state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'toPlan', waiting: ['Ж'] });
    s = choose(s, 'Ж', [b]);
    expect(s.ships['Ж'].hand).toEqual([a]);
    expect(s.ships['Ж'].plans).toEqual([b]);
  });

  it('«Безумный план» played by another ship: only the draw (Q43а)', () => {
    let s = turnOf('ПИРАТЫ', { М: [] });
    const card = give(s, 'М', 'Безумный план', 'Ж');
    s = act(s, { type: 'playCard', seat: 'М', card }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['М'].hand).toHaveLength(2);
    expect(s.ships['Ж'].plans).toEqual([]);
  });

  it('«Тиа Дальма»: 1 Powder, the 3 top sea cards go back in any order, then draw 2 (16.3)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Тиа Дальма'] }, { sea: true });
    const [a, b, c, d] = s.sea!.deck;
    s = play(s, 'Ж', 'Тиа Дальма').state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'tia', options: [a, b, c] });
    expect(() => choose(s, 'Ж', [c, a])).toThrow('Выберите 3');
    s = choose(s, 'Ж', [c, a, b]);
    expect(s.sea!.deck.slice(0, 4)).toEqual([c, a, b, d]);
    expect(s.ships['Ж'].hand).toHaveLength(2);
    expect(s.teams['ПИРАТЫ'].powder).toBe(7);
  });

  it('«Тиа Дальма» without the sea deck: only the draw (9.9)', () => {
    const s = play(turnOf('ПИРАТЫ', { Ж: ['Тиа Дальма'] }), 'Ж', 'Тиа Дальма').state;
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].hand).toHaveLength(2);
  });

  it('«Тиа Дальма»: the next round opens the card put on top', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Тиа Дальма'] }, { sea: true });
    nextSea(s, 'calm');
    const [, b, c] = s.sea!.deck;
    s = choose(play(s, 'Ж', 'Тиа Дальма').state, 'Ж', [c, b, s.sea!.deck[0]]);
    s = passTo(s, 'КОМПАНИЯ');
    s = passTo(s, 'ПИРАТЫ');
    expect(s.sea!.current).toBe(c);
  });

  it('«Ограбление банка»: 1 Powder from the enemy Hold into yours; with an empty enemy Hold it does nothing', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ограбление банка'] });
    s.teams['КОМПАНИЯ'].powder = 3;
    s.teams['ПИРАТЫ'].powder = 4;
    const after = play(s, 'Ж', 'Ограбление банка').state;
    expect(after.teams).toEqual({ ПИРАТЫ: { powder: 5 }, КОМПАНИЯ: { powder: 2 } });
    s.teams['КОМПАНИЯ'].powder = 0;
    expect(() => play(s, 'Ж', 'Ограбление банка')).toThrow('ничего не сделает');
  });

  it('«Тёрнер и Суонн»: the ally draws 1 card and his ship restores 1 cell of any track', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Тёрнер и Суонн'], М: [] });
    s.ships['М'].tracks.sails = 0;
    s = play(s, 'Ж', 'Тёрнер и Суонн', { repair: { sails: 1 } }).state;
    expect(s.ships['М'].hand).toHaveLength(1);
    expect(s.ships['М'].tracks.sails).toBe(1);
    expect(s.ships['Ж'].hand).toEqual([]);
  });

  it('«Тёрнер и Суонн» when the ally sank: the ally draws, nobody to repair (9.9)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Тёрнер и Суонн'], М: [] });
    s.ships['М'].sunk = true;
    s.ships['М'].tracks.hull = 0;
    s = play(s, 'Ж', 'Тёрнер и Суонн').state;
    expect(s.ships['М'].hand).toHaveLength(1);
  });

  it('«Поднять флаги!»: 1 Powder, this turn both ships’ Volleys deal +1; not cards «Это не Залп» (9.6)', () => {
    let s = turnOf('ПИРАТЫ', { Ж: ['Поднять флаги!', 'Бочки с порохом'] });
    s = play(s, 'Ж', 'Поднять флаги!').state;
    expect(s.teams['ПИРАТЫ'].powder).toBe(7);
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.ships['И'].tracks.hull).toBe(12 - 3);
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    expect(s.ships['Г'].tracks.hull).toBe(11 - 4);
    s = play(s, 'Ж', 'Бочки с порохом', { target: 'Г' }).state;
    expect(s.ships['Г'].tracks.hull).toBe(7 - 4);
  });
});

describe('Repairs of the Black Pearl', () => {
  it('«Плотник»: 2 cells on any tracks of your ship, split as you like, never above the start (11.3, 11.4)', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Плотник'] });
    s.ships['Ж'].tracks = { hull: 5, sails: 1, guns: 2, crew: 3 };
    expect(() => play(s, 'Ж', 'Плотник', { repair: { hull: 2, sails: 1 } })).toThrow('не больше 2');
    expect(play(s, 'Ж', 'Плотник', { repair: { hull: 1, sails: 1 } }).state.ships['Ж'].tracks).toMatchObject({ hull: 6, sails: 2 });
    // Guns are whole: the cells would be lost, so the split is refused (P1).
    expect(() => play(s, 'Ж', 'Плотник', { repair: { guns: 2 } })).toThrow('на шкале «Пушки» можно восстановить не больше: 0');
    s.ships['Ж'].tracks = { hull: 9, sails: 3, guns: 2, crew: 3 };
    expect(() => play(s, 'Ж', 'Плотник')).toThrow('ничего не сделает');
  });

  it('«Ром для всех»: 1 Crew to your ship and 1 Crew to the ally’s ship', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ром для всех'] });
    s.ships['Ж'].tracks.crew = 1;
    s.ships['М'].tracks.crew = 2;
    const after = play(s, 'Ж', 'Ром для всех').state;
    expect(after.ships['Ж'].tracks.crew).toBe(2);
    expect(after.ships['М'].tracks.crew).toBe(3);
  });

  it('«Латаем паруса»: 2 Sails; from a Plan 1 Hull more (18.9)', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Латаем паруса'] });
    s.ships['Ж'].tracks = { hull: 5, sails: 0, guns: 2, crew: 3 };
    expect(play(s, 'Ж', 'Латаем паруса').state.ships['Ж'].tracks).toMatchObject({ hull: 5, sails: 2 });
    s.ships['Ж'].plans = s.ships['Ж'].hand.splice(0);
    expect(play(s, 'Ж', 'Латаем паруса').state.ships['Ж'].tracks).toMatchObject({ hull: 6, sails: 2 });
  });

  it('«Латаем паруса» played by another ship: no «План:» bonus, it is not a Plan (Q43а)', () => {
    const s = turnOf('ПИРАТЫ', { М: [] });
    const card = give(s, 'М', 'Латаем паруса', 'Ж');
    s.ships['М'].tracks = { hull: 5, sails: 0, guns: 3, crew: 3 };
    expect(act(s, { type: 'playCard', seat: 'М', card }).state.ships['М'].tracks).toMatchObject({ hull: 5, sails: 2 });
  });
});

describe('Reactions of the Black Pearl', () => {
  it('«Ловкость рук»: the enemy card is played in full, then goes to the hand of the player who reacted (18.4)', () => {
    let s = turnOf('КОМПАНИЯ', { Ж: ['Ловкость рук'], И: ['Ничего личного'] });
    const card = cardIn(s, 'И', 'Ничего личного');
    s = play(s, 'И', 'Ничего личного', { target: 'М' }).state;
    // A card against the team opens the window; «Ловкость рук» may be played by any Pirate.
    expect(s.pending).toMatchObject({ kind: 'reactions', subject: 'card', waiting: ['Ж'] });
    s = react(s, 'Ж', 'Ловкость рук');
    expect(s.ships['М'].tracks.hull).toBe(11 - 3);
    expect(s.ships['Ж'].hand).toEqual([card]);
    expect(s.ships['И'].discard).not.toContain(card);
    // In her turn the Pearl plays it for her Powder and limit; then it goes to the owner's discard (9.4).
    s = passTo(s, 'ПИРАТЫ');
    s.teams['ПИРАТЫ'].powder = 3;
    s = act(s, { type: 'playCard', seat: 'Ж', card, target: 'И' }).state;
    expect(s.teams['ПИРАТЫ'].powder).toBe(2);
    expect(s.ships['И'].discard).toContain(card);
  });

  it('«Ловкость рук» does not answer a Volley or a Legend (12.7, 15.1)', () => {
    let s = turnOf('КОМПАНИЯ', { Ж: ['Ловкость рук'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toBeNull();
    s = act(s, { type: 'playLegend', seat: 'И' }).state;
    expect(s.pending).toBeNull();
  });

  it('«Банка с землёй»: cancels a card of the Flying Dutchman against the Pearl, not against her ally (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', { Ж: ['Банка с землёй'], Г: ['Чёрная метка', 'Абордаж рыболюдей'] });
    s = play(s, 'Г', 'Абордаж рыболюдей').state;
    expect(s.pending).toBeNull();
    expect(s.ships['М'].tracks.crew).toBe(1);
    s = play(s, 'Г', 'Чёрная метка', { target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions', subject: 'card', waiting: ['Ж'] });
    s = react(s, 'Ж', 'Банка с землёй');
    expect(s.turn.marks).toEqual({});
    expect(s.ships['Ж'].hand).toEqual([]);
  });

  it('«Банка с землёй» held by the ally still guards the Pearl (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Чёрная метка'] });
    give(s, 'М', 'Банка с землёй', 'Ж');
    s = play(s, 'Г', 'Чёрная метка', { target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ waiting: ['М'] });
    s = react(s, 'М', 'Банка с землёй');
    expect(s.turn.marks).toEqual({});
  });

  it('«Уйти по ветру» passed to the ally still works for the Pearl only (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', {});
    give(s, 'М', 'Уйти по ветру', 'Ж');
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    // A Volley at «Месть»: the card names the Pearl, nothing to play.
    expect(s.pending).toBeNull();
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ waiting: ['М'] });
    s = react(s, 'М', 'Уйти по ветру');
    expect(s.ships['Ж'].tracks.hull).toBe(9);
    // The limit is the Sails of the ship that played it: «Месть».
    expect(s.turn.reactions).toEqual({ М: 1 });
  });

  it('«Уйти по ветру» in an enemy hand means the ship that plays it (Q43)', () => {
    let s = turnOf('ПИРАТЫ', {});
    give(s, 'И', 'Уйти по ветру', 'Ж');
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending).toMatchObject({ waiting: ['И'] });
    s = react(s, 'И', 'Уйти по ветру');
    expect(s.ships['И'].tracks.hull).toBe(12);
  });

  it('«Чёрные паруса в ночи» held by the ally: a diagonal Volley at the Pearl is cancelled (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', {});
    give(s, 'М', 'Чёрные паруса в ночи', 'Ж');
    s = act(s, { type: 'volley', ship: 'Г', target: 'Ж' }).state;
    s = react(s, 'М', 'Чёрные паруса в ночи');
    expect(s.ships['Ж'].tracks.hull).toBe(9);
  });

  it('a stolen card is still on the table while the enemy decides: no card is lost (9.3)', () => {
    let s = turnOf('КОМПАНИЯ', { Ж: ['Ловкость рук'], И: ['Ничего личного'] });
    const card = cardIn(s, 'И', 'Ничего личного');
    s = play(s, 'И', 'Ничего личного', { target: 'Ж' }).state;
    expect(s.card?.card).toBe(card);
    s = decline(s, 'Ж');
    expect(s.card).toBeNull();
    expect(s.ships['И'].discard).toContain(card);
  });
});
