// Cards of the Queen Anne's Revenge deck (RULES.md 9, 11.6, 12, 13, 18.7, 18.12, 18.14, 18.15, 18.18, 18.19, Q43, Q44).
// Charges and most Reactions are tested in charges, reactions and abilities.
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '../src/engine/state';
import { act, cardIn, give, namesOf, passTo, setHand, turnOf } from './helpers';

const play = (s: GameState, seat: string, name: string, extra: Partial<Extract<Action, { type: 'playCard' }>> = {}) =>
  act(s, { type: 'playCard', seat, card: cardIn(s, seat, name), ...extra });
const choose = (s: GameState, seat: string, cards: string[]) => act(s, { type: 'choose', seat, cards }).state;
const react = (s: GameState, seat: string, name: string) => act(s, { type: 'react', seat, card: cardIn(s, seat, name) }).state;

describe('Orders of the Revenge', () => {
  it('«На абордаж!»: only the ship opposite; 2 Crew and 1 Hull damage; not a Volley', () => {
    const s = turnOf('ПИРАТЫ', { М: ['На абордаж!'], Ж: [] });
    const r = play(s, 'М', 'На абордаж!').state;
    expect(r.ships['Г'].tracks).toMatchObject({ crew: 1, hull: 10 });
    expect(r.teams['ПИРАТЫ'].powder).toBe(7);
    // No ship opposite — the card cannot be played: nothing of it can be done (9.9).
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    const card = s.ships['М'].hand.pop()!;
    s.ships['Ж'].hand.push(card);
    expect(() => act(s, { type: 'playCard', seat: 'Ж', card })).toThrow('ничего не сделает');
  });

  it('«На абордаж!»: the Crew damage carries over to the Hull and gives no Souls to the Pirates (11.1)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['На абордаж!'] });
    s.ships['Г'].tracks.crew = 1;
    expect(play(s, 'М', 'На абордаж!').state.ships['Г'].tracks).toMatchObject({ crew: 1, hull: 11 - 2 - 1 });
  });

  it('«Ужас Карибского моря»: 2 Powder, the enemy ship loses 2 Crew and plays no Reactions this turn (12.8)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Ужас Карибского моря'], И: ['Двойная обшивка'], Г: ['Водоворот'] });
    s = play(s, 'М', 'Ужас Карибского моря', { target: 'И' }).state;
    expect(s.ships['И'].tracks.crew).toBe(1);
    expect(s.turn.noReact).toEqual(['И']);
    expect(s.teams['ПИРАТЫ'].powder).toBe(6);
    // «Двойная обшивка» of the Endeavour cannot be played; «Водоворот» of the Dutchman can.
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions', waiting: ['Г'] });
  });

  it('«Жестокая дисциплина»: draw 2, 2 more cards this turn, lose 1 Crew (7.5, 11.5)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Жестокая дисциплина'] });
    s = play(s, 'М', 'Жестокая дисциплина').state;
    expect(s.ships['М'].hand).toHaveLength(2);
    expect(s.turn.limit['М']).toBe(3 + 2);
    expect(s.turn.played['М']).toBe(1);
    expect(s.ships['М'].tracks.crew).toBe(2);
  });

  it('«Жестокая дисциплина» with Crew 1: the lost Crew is 1 Hull damage (11.5)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Жестокая дисциплина'] });
    s.ships['М'].tracks.crew = 1;
    expect(play(s, 'М', 'Жестокая дисциплина').state.ships['М'].tracks).toMatchObject({ crew: 1, hull: 10 });
  });

  it('«Анжелика»: draw 2, then give 1 card to the ally; the free «Передать карту» stays (18.7)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Анжелика'], Ж: [] });
    const [a, b] = s.ships['М'].deck;
    s = play(s, 'М', 'Анжелика').state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'pass', waiting: ['М'] });
    s = choose(s, 'М', [b]);
    expect(s.ships['М'].hand).toEqual([a]);
    expect(s.ships['Ж'].hand).toEqual([b]);
    s = act(s, { type: 'pass', seat: 'М', card: a }).state;
    expect(s.ships['Ж'].hand).toEqual([b, a]);
  });

  it('«Выкуп за пленников»: 2 Powder into the Hold, never above 8 (6.2)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Выкуп за пленников'] });
    s.teams['ПИРАТЫ'].powder = 3;
    expect(play(s, 'М', 'Выкуп за пленников').state.teams['ПИРАТЫ'].powder).toBe(5);
    s.teams['ПИРАТЫ'].powder = 7;
    expect(play(s, 'М', 'Выкуп за пленников').state.teams['ПИРАТЫ'].powder).toBe(8);
  });

  it('«Брандер»: 1 Powder, 2 Fires on any enemy ship, no more than 3 (13.1)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Брандер'] });
    expect(play(s, 'М', 'Брандер', { target: 'И' }).state.ships['И'].fires).toBe(2);
    s.ships['И'].fires = 2;
    expect(play(s, 'М', 'Брандер', { target: 'И' }).state.ships['И'].fires).toBe(3);
  });

  it('«Кукла вуду»: in its next turn the ship loses 1 Crew for every card played for it, Charges too (Q44)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Кукла вуду'] });
    s = play(s, 'М', 'Кукла вуду', { target: 'И' }).state;
    expect(s.ships['И'].voodoo).toBe('М');
    s = passTo(s, 'КОМПАНИЯ');
    s.teams['КОМПАНИЯ'].powder = 8;
    setHand(s, 'И', ['Каперский патент', 'Ядра']);
    setHand(s, 'Ж', []);
    setHand(s, 'М', []);
    const crew = s.ships['И'].tracks.crew;
    s = play(s, 'И', 'Каперский патент').state;
    expect(s.ships['И'].tracks.crew).toBe(crew - 1);
    // A Charge is a card too; Crew 1 is the minimum, so the damage goes to the Hull (11.1).
    const hull = s.ships['И'].tracks.hull;
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж', charge: cardIn(s, 'И', 'Ядра') }).state;
    expect(s.ships['И'].tracks).toMatchObject({ crew: 1, hull: hull - 1 });
    // The ally is not touched; after the Company's turn the doll is gone.
    expect(s.ships['Г'].tracks.crew).toBe(3);
    s = passTo(s, 'ПИРАТЫ');
    expect(s.ships['И'].voodoo).toBeNull();
  });

  it('«Кукла вуду»: the captain’s card for the cursed ship counts too (Q44)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Кукла вуду'] });
    s = play(s, 'М', 'Кукла вуду', { target: 'Г' }).state;
    s = passTo(s, 'КОМПАНИЯ');
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    setHand(s, 'И', ['Выгодная сделка']);
    s = play(s, 'И', 'Выгодная сделка').state;
    expect(s.ships['Г'].tracks.crew).toBe(2);
  });

  it('«Пленная русалка»: the enemy ship opposite loses 1 Crew; draw 1. Nobody opposite — only the draw (9.9)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Пленная русалка'] });
    const r = play(s, 'М', 'Пленная русалка').state;
    expect(r.ships['Г'].tracks.crew).toBe(2);
    expect(r.ships['М'].hand).toHaveLength(1);
    s.ships['Г'].submerged = true;
    const under = play(s, 'М', 'Пленная русалка').state;
    expect(under.ships['Г'].tracks.crew).toBe(3);
    expect(under.ships['М'].hand).toHaveLength(1);
  });

  it('«Зомби у пушек»: 1 Powder, the Revenge gives one more Volley at once, without Powder and Charge (10.2)', () => {
    let s = turnOf('ПИРАТЫ', { М: ['Зомби у пушек'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    expect(() => act(s, { type: 'volley', ship: 'М', target: 'Г' })).toThrow('уже дал Залп');
    expect(() => play(s, 'М', 'Зомби у пушек')).toThrow('Выберите вражеский корабль');
    s = play(s, 'М', 'Зомби у пушек', { target: 'Г' }).state;
    expect(s.ships['Г'].tracks.hull).toBe(11 - 3 - 3);
    // 8 − 1 (Volley) − 1 (card); the extra Volley is free.
    expect(s.teams['ПИРАТЫ'].powder).toBe(6);
  });

  it('«Зомби у пушек» played by the Pearl: the Revenge fires (Q43)', () => {
    let s = turnOf('ПИРАТЫ', {});
    const card = give(s, 'Ж', 'Зомби у пушек', 'М');
    s = act(s, { type: 'playCard', seat: 'Ж', card, target: 'Г' }).state;
    // «Месть» has Guns 3: opposite Г, 3 damage; the Pearl would deal 2 − 1.
    expect(s.ships['Г'].tracks.hull).toBe(11 - 3);
  });

  it('«Зомби у пушек» in an enemy hand: the ship that plays it fires (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', {});
    const card = give(s, 'Г', 'Зомби у пушек', 'М');
    s = act(s, { type: 'playCard', seat: 'Г', card, target: 'М' }).state;
    expect(s.ships['М'].tracks.hull).toBe(11 - 2);
  });

  it('«Зомби у пушек»: no extra Volley under «Право на переговоры» (18.15)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Зомби у пушек'] });
    s.ships['М'].parley = true;
    expect(() => play(s, 'М', 'Зомби у пушек', { target: 'Г' })).toThrow('Право на переговоры');
  });
});

describe('Repairs of the Revenge', () => {
  it('«Плотник»: 2 cells on any tracks of your ship (11.4)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Плотник'] });
    s.ships['М'].tracks = { hull: 8, sails: 2, guns: 1, crew: 3 };
    // Without a split: Guns first, as sim.py repairs.
    expect(play(s, 'М', 'Плотник').state.ships['М'].tracks).toMatchObject({ hull: 8, guns: 3 });
    expect(play(s, 'М', 'Плотник', { repair: { hull: 2 } }).state.ships['М'].tracks).toMatchObject({ hull: 10, guns: 1 });
  });

  it('«Живые снасти»: 2 Sails to your ship or the ally’s', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Живые снасти'] });
    s.ships['Ж'].tracks.sails = 0;
    s.ships['М'].tracks.sails = 1;
    expect(play(s, 'М', 'Живые снасти', { ship: 'Ж' }).state.ships['Ж'].tracks.sails).toBe(2);
    expect(play(s, 'М', 'Живые снасти').state.ships['М'].tracks.sails).toBe(2);
    expect(() => play(s, 'М', 'Живые снасти', { ship: 'Г' })).toThrow('свой корабль или корабль союзника');
  });

  it('«Фонтан молодости»: 2 Powder, 4 Hull to your ship or the ally’s, not above the start (11.3)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Фонтан молодости'] });
    s.ships['Ж'].tracks.hull = 3;
    const r = play(s, 'М', 'Фонтан молодости', { ship: 'Ж' }).state;
    expect(r.ships['Ж'].tracks.hull).toBe(7);
    expect(r.teams['ПИРАТЫ'].powder).toBe(6);
    s.ships['Ж'].tracks.hull = 7;
    expect(play(s, 'М', 'Фонтан молодости', { ship: 'Ж' }).state.ships['Ж'].tracks.hull).toBe(9);
  });

  it('a Repair under «Блокада» cannot be played by the ship itself (18.10, Q21)', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Живые снасти'] });
    s.ships['М'].blockaded = true;
    s.ships['М'].tracks.sails = 0;
    expect(() => play(s, 'М', 'Живые снасти')).toThrow('Блокадой');
  });
});

describe('Reactions of the Revenge', () => {
  it('«Зомби-офицеры» cancel the Crew damage of a card; the rest of it stays (11.6)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Сто лет службы'] });
    give(s, 'Ж', 'Зомби-офицеры', 'М');
    s.ships['Г'].souls = 2;
    s.ships['Г'].tracks.crew = 1;
    s = play(s, 'Г', 'Сто лет службы', { target: 'М' }).state;
    // Any Pirate may answer a card against the team (21.18).
    expect(s.pending).toMatchObject({ subject: 'card', waiting: ['Ж'] });
    s = react(s, 'Ж', 'Зомби-офицеры');
    expect(s.ships['М'].tracks.crew).toBe(3);
    // «"Голландец" восстанавливает 2 Команды» still happens; no Soul without Crew damage.
    expect(s.ships['Г'].tracks.crew).toBe(3);
    expect(s.ships['Г'].souls).toBe(0);
  });

  it('«Тяжёлый борт» passed to the Pearl still guards the Revenge (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', {});
    give(s, 'Ж', 'Тяжёлый борт', 'М');
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toBeNull();
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    s = react(s, 'Ж', 'Тяжёлый борт');
    expect(s.ships['М'].tracks.hull).toBe(11 - 1);
    expect(s.ships['Г'].tracks.hull).toBe(11 - 1);
  });

  it('«Ответный залп» passed to the Pearl: the Revenge’s Guns hit back (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', {});
    give(s, 'Ж', 'Ответный залп', 'М');
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(s.pending).toMatchObject({ window: 'after', waiting: ['Ж'] });
    s = react(s, 'Ж', 'Ответный залп');
    expect(s.ships['Г'].tracks.hull).toBe(11 - 3);
    expect(namesOf(s.ships['М'].discard)).toContain('Ответный залп');
  });
});
