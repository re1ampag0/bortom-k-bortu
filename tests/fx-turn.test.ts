// A4: the start and the end of a turn, the card, repairs, Powder, Souls, statuses, drawing (src/ui/game/fx/misc.ts).
// The actions of the reference scenes go through the FX layer; the flights are DOM: e2e/fx-turn.spec.ts.
import { describe, expect, it } from 'vitest';
import { displayFrom, displayRules } from '../src/ui/game/fx/display';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { applyClip, applyQuiet, pendingFlags, planItem, plannerFor } from '../src/ui/game/fx/queue';
import { contrast, inkOn } from '../src/ui/game/fx/primitives';
import { playGame, SIDES } from './fx-games';
import { clipsOf, play } from './fx-scenes';
import { data } from './helpers';

const route = (id: string) => play(id).map((x) => x.route);
const all = (id: string, r: 'fx' | 'show') => play(id).map(() => r);

describe('the start and the end of a turn', () => {
  it('the clips are in PLAY', () => {
    for (const k of ['turn', 'turnEnd', 'draw', 'round', 'sea'] as FxKind[]) expect(typeof PLAY[k], k).toBe('function');
  });

  it('turn: through the layer; the Plan, then the start of the turn with its effects in the order of the events', () => {
    expect(route('turn')).toEqual(all('turn', 'fx'));
    const clips = clipsOf('turn');
    expect(clips.map((c) => c.kind)).toEqual(['turnEnd', 'turn']);
    expect(clips[0]).toMatchObject({ kind: 'turnEnd', plans: { count: 1 } });
    const turn = clips[1];
    if (turn.kind !== 'turn') throw new Error('turn');
    // income → Fire (its damage right after it) → surfacing → drawing
    expect(turn.effects.map((e) => e.type)).toEqual(['powderGained', 'fireDamage', 'damage', 'surfaced', 'drew']);
    // the scene draws for «Голландец», the hand at the device is «Индевор»'s: the backs fly to the ship
    expect(turn.effects.at(-1)).toMatchObject({ type: 'drew', seat: 'Г', count: 2 });
  });
});

describe('the played card', () => {
  it('the clips are in PLAY', () => {
    for (const k of ['card', 'impact', 'fire'] as FxKind[]) expect(typeof PLAY[k], k).toBe('function');
  });

  it('card: through the layer; the price, the damage from the card, resolved at once (to the discard)', () => {
    expect(route('card')).toEqual(all('card', 'fx'));
    const [card] = clipsOf('card');
    if (card.kind !== 'card') throw new Error('card');
    expect(card).toMatchObject({ cost: 1, resolvedTo: 'discard' });
    expect(card.effects.map((e) => e.type)).toEqual(['damage', 'damage']);
    expect(play('card')[0].cardOpen).toBe(false);
  });

  it('mark: «Чёрная метка» is an effect of the card, then the Volley «в метку»', () => {
    expect(route('mark')).toEqual(all('mark', 'fx'));
    const [card] = clipsOf('mark');
    expect(card.kind === 'card' && card.effects).toEqual([expect.objectContaining({ type: 'flagSet', flag: 'mark' })]);
  });
});

describe('a card waiting (20 bot games, both sides)', () => {
  it('the action of the card ends with a window or a choice: the card stays at the middle until a later action resolves it', () => {
    let waiting = 0;
    const seen = new Set<string>();
    for (let k = 0; k < 20; k++) {
      const { start, steps } = playGame(4001 + k, k % 2 === 1);
      for (const side of ['P', 'C'] as const) {
        const planner = plannerFor(data, SIDES[side], start.sea?.current ?? null);
        let open = false;
        for (const st of steps) {
          const item = planItem(planner, st.n, st.events[side], st.action, (kind) => !!PLAY[kind]);
          const card = item.clips.find((c) => c.kind === 'card');
          if (card && item.cardOpen) {
            waiting++;
            expect(card.kind === 'card' && card.resolvedTo).toBeFalsy();
            // it waits for a Reaction window, a choice of its player (pending «choice») or the game ends with it
            const why = item.clips.some((c) => c.kind === 'window') ? 'window' : st.after.pending?.kind === 'choice' ? 'choice' : item.clips.some((c) => c.kind === 'end') ? 'end' : 'none';
            expect(why, item.clips.map((c) => c.kind).join(',')).not.toBe('none');
            seen.add(why);
          }
          // a card open after an action is resolved or cancelled by a later one, never left open at a new turn
          if (open && item.clips.some((c) => c.kind === 'turn')) expect(item.events.some((e) => e.type === 'cardResolved' || e.type === 'cardCancelled' || e.type === 'cardLost')).toBe(true);
          open = item.cardOpen;
        }
      }
    }
    expect(waiting).toBeGreaterThan(0);
    expect([...seen].sort()).toEqual(['choice', 'end', 'window']);
  });
});

describe('repairs', () => {
  it('the clip is in PLAY', () => expect(typeof PLAY.repair).toBe('function'));

  it('repair: «Норрингтон» of «Голландец» mends the ally — the frame and the cells are on «Индевор» (P1)', () => {
    expect(route('repair')).toEqual(all('repair', 'fx'));
    const [card] = clipsOf('repair');
    expect(card).toMatchObject({ kind: 'card', ship: 'Г', resolvedTo: 'discard' });
    // repairFx takes the ship of the event: the target, not the one who played the card
    expect(card.kind === 'card' && card.effects).toEqual([{ type: 'restored', ship: 'И', track: 'hull', amount: 2 }]);
  });

  it('a repair outside a card (a Soul into the Hull) is the clip «repair» from the Souls (20 bot games)', () => {
    let souls = 0;
    for (let k = 0; k < 20; k++) {
      const { start, steps } = playGame(5001 + k, k % 2 === 1);
      const planner = plannerFor(data, SIDES.C, start.sea?.current ?? null);
      for (const st of steps) {
        for (const c of planItem(planner, st.n, st.events.C, st.action, (kind) => !!PLAY[kind]).clips) if (c.kind === 'repair' && c.cause === 'souls') souls++;
      }
    }
    expect(souls).toBeGreaterThan(0);
  });
});

describe('every action goes through the layer (A4)', () => {
  it('the rest of the clips are in PLAY', () => {
    for (const k of ['powder', 'souls', 'status', 'sell', 'pass', 'steal', 'discard', 'peek', 'dice', 'fireOut', 'end', 'fallback', 'legend', 'jack'] as FxKind[]) {
      expect(typeof PLAY[k], k).toBe('function');
    }
  });

  it('24 bot games, both sides, with and without the pause of empty windows: no action goes to «show»; D = the real state after each', () => {
    const rules = displayRules(data);
    const shows: string[] = [];
    const problems: string[] = [];
    const kinds = new Set<string>();
    let actions = 0;
    for (let k = 0; k < 24; k++) {
      const seed = 6001 + k;
      const { start, steps } = playGame(seed, k % 2 === 1);
      for (const side of ['P', 'C'] as const) {
        const planner = plannerFor(data, SIDES[side], start.sea?.current ?? null);
        const d = displayFrom(start);
        for (const st of steps) {
          const item = planItem(planner, st.n, st.events[side], st.action, (kind) => !!PLAY[kind]);
          actions++;
          item.clips.forEach((c) => kinds.add(c.kind));
          if (item.route !== 'fx') shows.push(`seed ${seed} ${side} #${st.n}: ${item.clips.map((c) => c.kind).join(',')}`);
          for (const c of item.clips) applyClip(d, item, c, rules);
          applyQuiet(d, item, rules);
          if (JSON.stringify(d) !== JSON.stringify(displayFrom(st.after))) problems.push(`seed ${seed} ${side} #${st.n}`);
        }
      }
    }
    expect(shows.slice(0, 5)).toEqual([]);
    expect(problems.slice(0, 5)).toEqual([]);
    expect(actions).toBeGreaterThan(3000);
    // the clips of A4 really come in bot games
    for (const k of ['turn', 'turnEnd', 'card', 'repair', 'powder', 'souls', 'status', 'sell', 'end', 'sea', 'legend']) expect(kinds.has(k), k).toBe(true);
  });
});

describe('statuses wait for their clip (pendingFlags)', () => {
  const items = () => play('mark').map((x) => ({ ...x, done: 0, applied: false }));

  it('«Чёрная метка» is hidden on «Месть» until the clip of the card has played', () => {
    const q = items();
    expect(pendingFlags(q)).toEqual({ М: ['mark'] });
    q[0].done = 1; // the clip «card» played
    expect(pendingFlags(q)).toEqual({});
  });

  it('an empty queue hides nothing: «Сразу итог», the layer off, Undo, a jump over many actions empty it', () => {
    expect(pendingFlags([])).toEqual({});
    expect(pendingFlags(items().map((x) => ({ ...x, applied: true })))).toEqual({});
  });

  it('surfacing at the start of a turn: «Всплыл» waits for the clip «turn»', () => {
    expect(pendingFlags(play('turn').map((x) => ({ ...x, done: 0, applied: false })))).toEqual({ Г: ['surfaced'] });
  });
});

describe('the strip of the ship under the flying card (game: instead of the ribbon)', () => {
  it('the text on the colour of each ship: white or dark, whichever contrasts more — at least 4.5:1 for all four', () => {
    const out = data.ships.map((s) => [s.code, s.color, inkOn(s.color), contrast(s.color, inkOn(s.color))]);
    for (const [code, , , c] of out) expect(c as number, `${code}`).toBeGreaterThanOrEqual(4.5);
    // «Индевор» is gold: dark text on it, the others white
    expect(Object.fromEntries(out.map(([code, , ink]) => [code, ink]))).toEqual({ Ж: '#ffffff', М: '#ffffff', И: '#0f0d0b', Г: '#ffffff' });
  });
});
