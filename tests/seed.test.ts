// «Жребий» on the preparation screen: without a given seed each toss is a new seed and a new coin; with a seed in
// the field or the address every toss is the same (the game can be repeated).
import { describe, expect, it } from 'vitest';
import { coinOf } from '../src/ui/start/Prep';
import { isFixedSeed, seedFrom, tossSeed } from '../src/ui/seed';

describe('the coin toss seed', () => {
  it('without a seed: 20 tosses give both sides', () => {
    let seed = seedFrom('');
    const sides = new Set<string>();
    for (let i = 0; i < 20; i++) {
      seed = tossSeed('', seed);
      sides.add(coinOf(seed));
    }
    expect([...sides].sort()).toEqual(['КОМПАНИЯ', 'ПИРАТЫ']);
  });

  it('with a seed: every toss is the same seed and the same side', () => {
    const seed = seedFrom('5');
    const tosses = Array.from({ length: 20 }, () => tossSeed('5', seed));
    expect(new Set(tosses)).toEqual(new Set([5]));
    expect(new Set(tosses.map(coinOf)).size).toBe(1);
  });

  it('a seed is fixed only when it is a positive integer', () => {
    expect([isFixedSeed('1'), isFixedSeed(' 42 '), isFixedSeed(''), isFixedSeed('0'), isFixedSeed('abc'), isFixedSeed('1.5'), isFixedSeed(null)]).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('new seeds differ even in the same millisecond', () => {
    expect(new Set(Array.from({ length: 50 }, () => tossSeed('', 1))).size).toBe(50);
  });
});
