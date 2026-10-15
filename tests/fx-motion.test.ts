// A3: the ships in motion (src/ui/game/fx/misc.ts) — a change of places, diving and surfacing, sinking, the abilities.
// The actions of the reference scenes go through the FX layer. The flights are DOM: e2e/fx-motion.spec.ts.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { displayFrom } from '../src/ui/game/fx/display';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { planItem, plannerFor, withDisplay } from '../src/ui/game/fx/queue';
import { Plank } from '../src/ui/game/Table';
import { playGame, SIDES } from './fx-games';
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
const all = (id: string, r: 'fx') => play(id).map(() => r);

describe('the ships in motion', () => {
  it('the clips of A3 are in PLAY', () => {
    for (const k of ['swap', 'sink', 'dive', 'surface', 'ability'] as FxKind[]) expect(typeof PLAY[k], k).toBe('function');
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

  it('sink: a ship sunk by a played card — the clip «card» (A4), then the sinking, through the layer', () => {
    expect(play('sink')[0].clips.map((c) => c.kind)).toEqual(['card', 'sink']);
    expect(route('sink')).toEqual(all('sink', 'fx'));
  });

  it('sword: the stamp and the change of places of the enemy in one clip', () => {
    expect(route('sword')).toEqual(all('sword', 'fx'));
    const ab = clipsOf('sword').find((c) => c.kind === 'ability')!;
    expect(ab).toMatchObject({ what: 'sword', cost: 1 });
    expect(ab.effects!.map((e) => e.type)).toEqual(['swapped']);
  });

  it('the abilities of the bots: their effects are changes of places and the repair of «Джонс свободен» (20 games, both sides)', () => {
    const what = new Set<string>();
    let n = 0;
    for (let k = 0; k < 20; k++) {
      const { start, steps } = playGame(3001 + k, k % 2 === 1);
      for (const side of ['P', 'C'] as const) {
        const planner = plannerFor(data, SIDES[side], start.sea?.current ?? null);
        for (const st of steps) {
          const item = planItem(planner, st.n, st.events[side], st.action);
          for (const c of item.clips) {
            if (c.kind !== 'ability') continue;
            n++;
            what.add(c.what);
            for (const e of c.effects || []) expect(e.type === 'swapped' || (e.type === 'restored' && c.what === 'jonesFree'), `${c.what}: ${e.type}`).toBe(true);
          }
        }
      }
    }
    expect(n).toBeGreaterThan(0);
    expect([...what].sort()).toEqual(['jonesFree', 'sword', 'treasury']);
  });
});
