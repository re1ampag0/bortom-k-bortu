// Seeded randomness: a game is reproduced from its seed and its list of actions (docs/TZ.md, «Архитектура»).
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { act, data, newGame } from './helpers';
import { createGame } from '../src/engine/engine';

describe('rng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(new Set(xs).size).toBe(20);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('continues the same sequence from a saved state', () => {
    const a = createRng(7);
    a.next();
    a.next();
    const b = createRng(a.state);
    expect(b.next()).toBe(a.next());
  });

  it('shuffle is a permutation', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const shuffled = createRng(3).shuffle([...items]);
    expect(shuffled).not.toEqual(items);
    expect([...shuffled].sort((x, y) => x - y)).toEqual(items);
  });

  it('int stays in range', () => {
    const r = createRng(5);
    for (let i = 0; i < 1000; i++) {
      const x = r.int(6);
      expect(Number.isInteger(x) && x >= 0 && x < 6).toBe(true);
    }
  });
});

describe('replay', () => {
  it('the same seed and actions give the same game', () => {
    const play = () => {
      let s = createGame(data, { seed: 99 }).state;
      for (let i = 0; i < 12; i++) s = act(s, { type: 'endTurn', side: s.active }).state;
      return s;
    };
    expect(play()).toEqual(play());
  });

  it('a different seed gives a different deal', () => {
    expect(newGame({ seed: 1 }).ships['Ж'].hand).not.toEqual(newGame({ seed: 2 }).ships['Ж'].hand);
  });

  it('applyAction does not change the given state', () => {
    const s = newGame();
    const copy = structuredClone(s);
    act(s, { type: 'endTurn', side: 'ПИРАТЫ' });
    expect(s).toEqual(copy);
  });
});
