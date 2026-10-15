// A3: the ships in motion (src/ui/game/fx/misc.ts) — a change of places, diving and surfacing, sinking, the abilities.
// The actions of the reference scenes go through the FX layer. The flights are DOM: e2e/fx-motion.spec.ts.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { displayFrom } from '../src/ui/game/fx/display';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { withDisplay } from '../src/ui/game/fx/queue';
import { Plank } from '../src/ui/game/Table';
import { clipsOf, play } from './fx-scenes';
import { data, turnOf } from './helpers';

const noop = () => {};
/** The class list of the plank of a ship as the table draws it from a state. */
function plankClass(s: GameState, code: string): string[] {
  const html = renderToStaticMarkup(
    createElement(Plank, {
      s, data, ship: s.ships[code], own: s.ships[code].side === 'ПИРАТЫ', selected: false, awaiting: false, targeted: false, shooter: false,
      plate: null, buttons: [], role: null, onSelect: noop, onDetails: noop, onLegend: noop,
    }),
  );
  return html.match(/^<section class="([^"]*)"/)![1].split(/\s+/).filter(Boolean);
}

const route = (id: string) => play(id).map((x) => x.route);
const all = (id: string, r: 'fx' | 'show') => play(id).map(() => r);

describe('the ships in motion', () => {
  it('the clips of A3 are in PLAY', () => {
    for (const k of ['swap', 'dive', 'surface'] as FxKind[]) expect(typeof PLAY[k], k).toBe('function');
  });

  it('regroup: the change of places goes through the layer, with its price', () => {
    expect(route('regroup')).toEqual(all('regroup', 'fx'));
    const swap = clipsOf('regroup').find((c) => c.kind === 'swap')!;
    expect(swap).toMatchObject({ reason: 'regroup', cost: 1 });
    expect(swap.events.map((e) => e.type)).toEqual(['regrouped', 'powderSpent', 'swapped']);
  });

  it('dive: through the layer; «Под водой» is the class of the plank from the displayed state', () => {
    expect(route('dive')).toEqual(all('dive', 'fx'));
    expect(clipsOf('dive').map((c) => c.kind)).toEqual(['dive']);
    const s = turnOf('КОМПАНИЯ');
    const code = Object.values(s.ships).find((x) => x.side === 'КОМПАНИЯ')!.code;
    expect(plankClass(s, code)).not.toContain('submerged');
    // The real state is under water, D is not yet (the clip has not played): the plank is drawn from D.
    const real: GameState = { ...s, ships: { ...s.ships, [code]: { ...s.ships[code], submerged: true } } };
    expect(plankClass(real, code)).toContain('submerged');
    expect(plankClass(withDisplay(real, displayFrom(s)), code)).not.toContain('submerged');
  });
});
