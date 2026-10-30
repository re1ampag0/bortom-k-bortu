// The data of the site (data/game-data.json) may be changed by the admin page; the rules are tested on the frozen
// copy of version 0.3 (helpers.ts). Here only what any good data must do: pass the loader and let bots play.
import { describe, expect, it } from 'vitest';
import raw from '../data/game-data.json';
import { loadGameData } from '../src/engine/data';
import { runSims } from '../src/engine/sim/sim';

describe('data/game-data.json', () => {
  it('passes the data loader', () => {
    expect(() => loadGameData(raw)).not.toThrow();
  });

  it('100 bot games end without exceptions', () => {
    const result = runSims(loadGameData(raw), { games: 100, seed: 1 });
    expect(result.wins.ПИРАТЫ + result.wins.КОМПАНИЯ + result.wins.НИЧЬЯ).toBe(100);
  }, 60_000);
});
