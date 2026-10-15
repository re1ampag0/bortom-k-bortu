// A2: the pure part of the show queue — which layer shows an action, the displayed state D catching up with it, the
// table drawn from D (src/ui/game/fx/queue.ts).
import { describe, expect, it } from 'vitest';
import { displayFrom, displayRules } from '../src/ui/game/fx/display';
import type { FxClip, FxKind } from '../src/ui/game/fx/planFx';
import { applyAll, applyClip, applyQuiet, planItem, plannerFor, routeAction, withDisplay } from '../src/ui/game/fx/queue';
import { playGame, SIDES } from './fx-games';
import { data, turnOf } from './helpers';

const rules = displayRules(data);
const clip = (kind: FxKind) => ({ kind }) as FxClip;
// The clips ported so far: the Volley (A2), the ships in motion (A3).
const PORTED = new Set<FxKind>(['announce', 'window', 'reaction', 'shot', 'cancel', 'counter', 'heart', 'swap', 'sink', 'dive', 'surface']);

describe('the route of an action', () => {
  it('fx only when every clip has a player', () => {
    const has = (k: FxKind) => PORTED.has(k);
    expect(routeAction([clip('announce'), clip('window')], has)).toBe('fx');
    expect(routeAction([clip('reaction'), clip('shot')], has)).toBe('fx');
    expect(routeAction([clip('card'), clip('announce'), clip('shot')], has)).toBe('show');
    expect(routeAction([clip('shot'), clip('sink')], has)).toBe('fx');
    expect(routeAction([clip('card'), clip('sink')], has)).toBe('show');
    // Only quiet events: nothing to play.
    expect(routeAction([], has)).toBe('show');
  });

  it('with no players (A2, part 1) every action goes to ShowLayer', () => {
    const { start, steps } = playGame(1001, false);
    const planner = plannerFor(data, SIDES.P, start.sea?.current ?? null);
    for (const st of steps) expect(planItem(planner, st.n, st.events.P, st.action, () => false).route).toBe('show');
  });
});

describe('the displayed state in the queue', () => {
  it('D = the real state after every action, whichever layer shows it (20 bot games, both sides)', () => {
    const problems: string[] = [];
    for (let k = 0; k < 20; k++) {
      const { start, steps } = playGame(3001 + k, k % 2 === 1);
      for (const side of ['P', 'C'] as const) {
        const planner = plannerFor(data, SIDES[side], start.sea?.current ?? null);
        const d = displayFrom(start);
        for (const st of steps) {
          // Volley actions are «fx», the rest «show» — as in the transition.
          const item = planItem(planner, st.n, st.events[side], st.action, (kind) => PORTED.has(kind));
          if (item.route === 'show') applyAll(d, item, rules);
          else {
            for (const c of item.clips) applyClip(d, item, c, rules);
            applyQuiet(d, item, rules);
          }
          const want = displayFrom(st.after);
          if (JSON.stringify(d) !== JSON.stringify(want)) problems.push(`seed ${3001 + k} ${side} #${st.n} ${item.route}`);
        }
      }
    }
    expect(problems.slice(0, 5)).toEqual([]);
  });
});

describe('the table drawn from D', () => {
  it('takes the displayed fields from D and the rest from the real state', () => {
    const s = turnOf('ПИРАТЫ');
    const d = displayFrom(s);
    d.ships['Г'].tracks.hull = 1;
    d.ships['Г'].fires = 2;
    d.ships['Ж'].pos = 1 - d.ships['Ж'].pos;
    d.powder['КОМПАНИЯ'] = 0;
    d.round = 7;
    const t = withDisplay(s, d);
    expect(t.ships['Г'].tracks.hull).toBe(1);
    expect(t.ships['Г'].fires).toBe(2);
    expect(t.ships['Ж'].pos).toBe(d.ships['Ж'].pos);
    expect(t.teams['КОМПАНИЯ'].powder).toBe(0);
    expect(t.round).toBe(7);
    // Hands, Plans, decisions and the turn are the real ones; the real state is not touched.
    expect(t.ships['Г'].hand).toBe(s.ships['Г'].hand);
    expect(t.ships['Ж'].plans).toBe(s.ships['Ж'].plans);
    expect(t.pending).toBe(s.pending);
    expect(t.turn).toBe(s.turn);
    expect(s.ships['Г'].tracks.hull).not.toBe(1);
    expect(s.round).not.toBe(7);
  });
});
