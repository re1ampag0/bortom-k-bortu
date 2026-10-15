// A3: the ships in motion (src/ui/game/fx/misc.ts) — a change of places, diving and surfacing, sinking, the abilities.
// The actions of the reference scenes go through the FX layer. The flights are DOM: e2e/fx-motion.spec.ts.
import { describe, expect, it } from 'vitest';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { clipsOf, play } from './fx-scenes';

const route = (id: string) => play(id).map((x) => x.route);
const all = (id: string, r: 'fx' | 'show') => play(id).map(() => r);

describe('the ships in motion', () => {
  it('the clips of A3 are in PLAY', () => {
    for (const k of ['swap'] as FxKind[]) expect(typeof PLAY[k], k).toBe('function');
  });

  it('regroup: the change of places goes through the layer, with its price', () => {
    expect(route('regroup')).toEqual(all('regroup', 'fx'));
    const swap = clipsOf('regroup').find((c) => c.kind === 'swap')!;
    expect(swap).toMatchObject({ reason: 'regroup', cost: 1 });
    expect(swap.events.map((e) => e.type)).toEqual(['regrouped', 'powderSpent', 'swapped']);
  });
});
