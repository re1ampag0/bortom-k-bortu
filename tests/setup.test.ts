// Setting up a game (RULES.md 2, 20.1).
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/engine';
import { data, newGame } from './helpers';

describe('setup', () => {
  const s = newGame();

  it('puts the track markers on the starting values; the Dutchman has 1 Soul (2.3, 3.1)', () => {
    expect(s.ships['Ж'].tracks).toEqual({ hull: 9, sails: 3, guns: 2, crew: 3 });
    expect(s.ships['М'].tracks).toEqual({ hull: 11, sails: 2, guns: 3, crew: 3 });
    expect(s.ships['И'].tracks).toEqual({ hull: 12, sails: 1, guns: 3, crew: 2 });
    expect(s.ships['Г'].tracks).toEqual({ hull: 11, sails: 3, guns: 2, crew: 3 });
    expect(s.ships['Г'].souls).toBe(1);
    expect(s.ships['Ж'].souls).toBe(0);
  });

  it('every seat takes 5 cards from its own shuffled deck of 24 (2.7)', () => {
    for (const ship of Object.values(s.ships)) {
      expect(ship.hand).toHaveLength(5);
      expect(ship.deck).toHaveLength(19);
      expect(ship.discard).toHaveLength(0);
      expect([...ship.hand, ...ship.deck].every((c) => c.startsWith(`${ship.code}-`))).toBe(true);
      expect(new Set([...ship.hand, ...ship.deck]).size).toBe(24);
    }
  });

  it('Legends lie open next to the boards (2.4)', () => {
    for (const ship of Object.values(s.ships)) expect(ship.legend).toBe(true);
  });

  it('places the ships as the teams chose (2.1, 2.2)', () => {
    expect([s.ships['Ж'].pos, s.ships['М'].pos, s.ships['И'].pos, s.ships['Г'].pos]).toEqual([0, 1, 0, 1]);
    const other = newGame({ positions: { ПИРАТЫ: ['М', 'Ж'], КОМПАНИЯ: ['Г', 'И'] } });
    expect([other.ships['Ж'].pos, other.ships['М'].pos, other.ships['И'].pos, other.ships['Г'].pos]).toEqual([1, 0, 1, 0]);
  });

  it('places the ships at random without a choice, one ship per place (2.2)', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      const g = createGame(data, { seed }).state;
      expect(g.ships['Ж'].pos + g.ships['М'].pos).toBe(1);
      expect(g.ships['И'].pos + g.ships['Г'].pos).toBe(1);
      seen.add(g.ships['Ж'].pos);
    }
    expect(seen.size).toBe(2);
  });

  it('the Pirates go first; their Hold was empty and gets 2 in the first turn; the Company has 4 (2.6, 2.8, 5.2)', () => {
    expect(s.round).toBe(1);
    expect(s.active).toBe('ПИРАТЫ');
    expect(s.teams['ПИРАТЫ'].powder).toBe(2);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(4);
  });

  it('the sea deck of 17 is shuffled and the first card is open in round 1 (2.5, 4.2)', () => {
    expect(s.sea).not.toBeNull();
    expect(s.sea!.current).not.toBeNull();
    expect(s.sea!.deck).toHaveLength(16);
    expect(new Set([s.sea!.current, ...s.sea!.deck]).size).toBe(17);
    const orders = new Set([1, 2, 3, 4, 5].map((seed) => createGame(data, { seed }).state.sea!.current));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('«Первая партия»: no sea deck and no Legends, the Company starts with 3 Powder (20.1)', () => {
    const g = newGame({ variant: 'first' });
    expect(g.sea).toBeNull();
    for (const ship of Object.values(g.ships)) expect(ship.legend).toBe(false);
    expect(g.teams['КОМПАНИЯ'].powder).toBe(3);
    expect(g.teams['ПИРАТЫ'].powder).toBe(2);
  });
});
