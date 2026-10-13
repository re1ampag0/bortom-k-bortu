// Bots (docs/TZ.md, «Проверки»): invariants on 1000 bot games, the same seed gives the same game,
// and a loose guard of the balance reference (PDF page 26: Pirates about 47%, about 4.6 rounds).
import { describe, expect, it } from 'vitest';
import { playGame, runSims, summarize } from '../src/engine/sim/sim';
import { brokenInvariants, data } from './helpers';

describe('bot games', () => {
  it('1000 games keep the invariants, raise no exceptions and end by round 30', () => {
    const broken: string[] = [];
    let states = 0;
    const result = runSims(data, {
      games: 1000,
      seed: 7,
      onState: (s) => {
        states++;
        if (broken.length < 10) broken.push(...brokenInvariants(s).map((x) => `раунд ${s.round}: ${x}`));
      },
    });
    expect(broken).toEqual([]);
    expect(states).toBeGreaterThan(1000);
    expect(Math.max(...result.rounds)).toBeLessThanOrEqual(data.rules.maxRounds);
    expect(result.wins.ПИРАТЫ + result.wins.КОМПАНИЯ + result.wins.НИЧЬЯ).toBe(1000);

    // The reference is checked on 3000 games by `npm run sim`; 1000 games give a standard error of 1.6 points.
    const sum = summarize(result);
    expect(sum.pirates).toBeGreaterThan(42);
    expect(sum.pirates).toBeLessThan(52);
    expect(sum.roundsMean).toBeGreaterThan(4.1);
    expect(sum.roundsMean).toBeLessThan(5.1);
  }, 120_000);

  it('the same seed gives the same game and the same statistics', () => {
    for (const seed of [1, 2, 3, 12345]) {
      expect(playGame(data, seed)).toEqual(playGame(data, seed));
    }
    expect(runSims(data, { games: 30, seed: 5 })).toEqual(runSims(data, { games: 30, seed: 5 }));
    expect(runSims(data, { games: 30, seed: 5 })).not.toEqual(runSims(data, { games: 30, seed: 6 }));
  });

  it('bots play the variants «Первая партия» and «Быстрый бой» to the end', () => {
    for (const variant of ['first', 'quick'] as const) {
      const broken: string[] = [];
      const r = runSims(data, { games: 100, seed: 3, variant, onState: (s) => broken.push(...brokenInvariants(s)) });
      expect(broken).toEqual([]);
      expect(r.wins.ПИРАТЫ + r.wins.КОМПАНИЯ + r.wins.НИЧЬЯ).toBe(100);
    }
  }, 60_000);
});
