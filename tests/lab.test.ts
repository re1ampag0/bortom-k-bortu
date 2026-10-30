// The balance lab's core (docs/tasks/E9b-balance-lab.md): the reference of sim:check, and the same numbers whatever
// the number of Web Workers that play the blocks of games.
import { describe, expect, it } from 'vitest';
import { blockRange, labSeeds, runBlock, runBlocks, runLab, type LabSettings } from '../src/engine/sim/lab';
import { data } from './helpers';

describe('balance lab', () => {
  it('v0.3, seed 1, 3000 games: the Pirates win 46.5 %, as npm run sim:check', () => {
    const r = runLab(data, { games: 3000, seed: 1, variant: 'standard', first: 'ПИРАТЫ', off: [] });
    expect(r.games).toBe(3000);
    expect(Math.round((r.wins.ПИРАТЫ / r.games) * 1000) / 10).toBe(46.5);
  }, 180_000);

  it('gives the same result with 1 and 4 workers', async () => {
    const settings: LabSettings = { games: 210, seed: 5, variant: 'standard', first: 'КОМПАНИЯ', off: ['sword', 'souls'] };
    const seeds = labSeeds(settings.seed, settings.games);
    const play = (workers: number) =>
      runBlocks(settings.games, workers, async (_w, b) => {
        // Workers finish in any order: a later block may come back first.
        await new Promise((ok) => setTimeout(ok, (b * 7) % 5));
        return runBlock(data, settings, seeds, ...blockRange(settings.games, b));
      });
    const one = await play(1);
    const four = await play(4);
    expect(four).toEqual(one);
    expect(one).toEqual(runLab(data, settings));
  }, 120_000);
});
