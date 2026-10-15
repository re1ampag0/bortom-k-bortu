// S1: the sea cards of the reference (docs/mockups/anim/level1/scenes.js, sea-*) go through the FX layer: the clip
// «sea» has its player, every sea card of the data has its weather (SEAFX), and the pairs «opposite / diagonal» of the
// weather go by the places of the ships (pos), not by their codes. The pictures are DOM: e2e/fx-sea.spec.ts.
import { describe, expect, it } from 'vitest';
import { seaCards } from '../src/engine/data';
import type { Display } from '../src/ui/game/fx/display';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import { SEAFX, seaPairs } from '../src/ui/game/fx/sea';
import { clipsOf, play } from './fx-scenes';
import { data } from './helpers';

const SEA_SCENES = ['calm', 'wind', 'fog', 'storm', 'wave', 'maelstrom', 'clear', 'mermaids', 'tortuga', 'rum', 'caravan', 'wet', 'reefs', 'thunder', 'fleet', 'moon', 'current'];

describe('the sea cards', () => {
  it('the clips «sea» and «round» have their players (not the temporary ones of A4)', () => {
    expect(PLAY.sea).toBeTypeOf('function');
    expect(PLAY.round).toBeTypeOf('function');
    expect(PLAY.sea!.toString()).not.toMatch(/^async \(\) => \{\s*\}$/);
  });

  it('every sea card of the data has its weather', () => {
    const keys = [...new Set(seaCards(data).map((c) => c.key))].sort();
    expect(keys).toEqual([...SEA_SCENES].sort());
    for (const k of keys) expect(SEAFX[k], k).toBeDefined();
  });

  for (const key of SEA_SCENES) {
    it(`sea-${key}: every action goes through the layer, the clip «sea» shows «${key}»`, () => {
      const id = `sea-${key}`;
      expect(play(id).map((x) => x.route)).toEqual(play(id).map(() => 'fx'));
      const sea = clipsOf(id).filter((c) => c.kind === 'sea');
      expect(sea).toHaveLength(1);
      expect((sea[0] as { key: string }).key).toBe(key);
    });
  }

  describe('the pairs go by places', () => {
    const ship = (pos: number, sunk = false) => ({ pos, tracks: { hull: 1, sails: 1, guns: 1, crew: 1 }, fires: 0, sunk, submerged: false, souls: 0, legend: true });
    const display = (pos: Record<string, number>, sunk: string[] = []): Display => ({
      round: 1,
      active: 'ПИРАТЫ',
      sea: null,
      powder: { ПИРАТЫ: 0, КОМПАНИЯ: 0 },
      ships: Object.fromEntries(Object.entries(pos).map(([c, p]) => [c, ship(p, sunk.includes(c))])),
    });
    const ctx = (d: Display) => ({ display: d, data, bottom: 'ПИРАТЫ' as const });

    it('opposite — the same place, diagonal — the other one', () => {
      const d = display({ Ж: 0, М: 1, И: 1, Г: 0 });
      expect(seaPairs(ctx(d), 'opposite')).toEqual([['Г', 'Ж'], ['И', 'М']]);
      expect(seaPairs(ctx(d), 'diagonal')).toEqual([['Г', 'М'], ['И', 'Ж']]);
    });
    it('after a change of places the pairs follow the places, not the codes', () => {
      const d = display({ Ж: 1, М: 0, И: 0, Г: 1 });
      expect(seaPairs(ctx(d), 'opposite')).toEqual([['И', 'М'], ['Г', 'Ж']]);
      expect(seaPairs(ctx(d), 'diagonal')).toEqual([['И', 'Ж'], ['Г', 'М']]);
    });
    it('a sunk ship has no pair', () => {
      const d = display({ Ж: 0, М: 1, И: 1, Г: 0 }, ['М']);
      expect(seaPairs(ctx(d), 'opposite')).toEqual([['Г', 'Ж']]);
      expect(seaPairs(ctx(d), 'diagonal')).toEqual([['И', 'Ж']]);
    });
  });
});
