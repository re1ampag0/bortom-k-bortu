// A2, A4: the pure part of the show queue — the actions as the queue gets them, the displayed state D catching up with
// them, the table drawn from D (src/ui/game/fx/queue.ts).
import { describe, expect, it } from 'vitest';
import { displayFrom, displayRules } from '../src/ui/game/fx/display';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import { applyClip, applyQuiet, planItem, plannerFor, withDisplay } from '../src/ui/game/fx/queue';
import { playGame, SIDES } from './fx-games';
import { data, turnOf } from './helpers';

const rules = displayRules(data);

describe('the actions in the queue', () => {
  it('a clip with no player of its own plays PLAY.fallback (page.js); every event of an action is in one clip or quiet', () => {
    expect(typeof PLAY.fallback).toBe('function');
    const { start, steps } = playGame(1001, false);
    const planner = plannerFor(data, SIDES.P, start.sea?.current ?? null);
    for (const st of steps) {
      const item = planItem(planner, st.n, st.events.P, st.action);
      // every event of the action is in one clip or in quiet
      const seen = [...item.clips.flatMap((c) => c.ev), ...item.quiet].sort((x, y) => x - y);
      expect(seen).toEqual(item.events.map((_, i) => i));
    }
  });
});

describe('the displayed state in the queue', () => {
  it('D = the real state after every action, its clips and its quiet events applied (20 bot games, both sides)', () => {
    const problems: string[] = [];
    for (let k = 0; k < 20; k++) {
      const { start, steps } = playGame(3001 + k, k % 2 === 1);
      for (const side of ['P', 'C'] as const) {
        const planner = plannerFor(data, SIDES[side], start.sea?.current ?? null);
        const d = displayFrom(start);
        for (const st of steps) {
          const item = planItem(planner, st.n, st.events[side], st.action);
          for (const c of item.clips) applyClip(d, item, c, rules);
          applyQuiet(d, item, rules);
          const want = displayFrom(st.after);
          if (JSON.stringify(d) !== JSON.stringify(want)) problems.push(`seed ${3001 + k} ${side} #${st.n}`);
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
