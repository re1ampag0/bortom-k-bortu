import { describe, expect, it } from 'vitest';
import { planFx } from '../src/ui/game/fxPlan';
import { createGame } from '../src/engine/engine';
import type { GameEvent } from '../src/engine/state';
import { data } from './helpers';

const initial = createGame(data, { seed: 1, variant: 'standard', sea: false, legends: false }).state;

const options = { data, mode: 'rich' as const };

describe('planFx', () => {
  it('plans one projectile per unit of visible volley damage', () => {
    const events: GameEvent[] = [
      { type: 'volley', ship: 'Ж', target: 'Г', charge: null, chargeFrom: null, diagonal: false, joint: false, damage: 2, track: 'hull' },
      { type: 'hit', ship: 'Ж', target: 'Г', damage: 2, track: 'hull', terms: [{ what: 'Пушки', n: 2 }] },
    ];
    const after = structuredClone(initial);
    const scenario = planFx(events, initial, after, options);
    const volley = scenario.clips.find((clip) => clip.kind === 'volley');
    expect(volley?.kind).toBe('volley');
    if (volley?.kind === 'volley') expect(volley.projectiles.filter((p) => p.outcome === 'hit').reduce((n, p) => n + p.units, 0)).toBe(2);
  });

  it('uses a fallback for visible events without a renderer', () => {
    const scenario = planFx([{ type: 'seaEffect', key: 'new-effect' }], initial, initial, options);
    expect(scenario.clips).toEqual([{ kind: 'fallback', duration: 500, label: 'Действие' }]);
  });
});
