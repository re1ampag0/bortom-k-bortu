// The animation planner (src/ui/game/fx/planFx.ts) and the displayed state (display.ts) on real bot games,
// and the port against the reference docs/mockups/anim/level1/planfx.js on its scenes.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { deckCards, legendCards, seaCards } from '../src/engine/data';
import type { Action, GameEvent } from '../src/engine/state';
import { applyVisible, displayFrom, displayRules } from '../src/ui/game/fx/display';
import { createPlanner, type FxCards, type FxClip } from '../src/ui/game/fx/planFx';
import { playGame, SIDES } from './fx-games';
import { data } from './helpers';

const cards: FxCards = Object.fromEntries([...deckCards(data), ...legendCards(data)].map((c) => [c.code, c]));
const seaKeyOf = Object.fromEntries(seaCards(data).map((c) => [c.code, c.key]));
const seaKey = (code: string) => seaKeyOf[code];
const ships = Object.fromEntries(data.ships.map((s) => [s.code, { side: s.side }]));
const rules = displayRules(data);

const units = (c: Extract<FxClip, { kind: 'shot' }>, f: (b: NonNullable<typeof c.shots>[number]) => boolean) =>
  (c.shots ?? []).filter(f).reduce((n, b) => n + b.units, 0);

describe('animation planner on bot games', () => {
  it('covers every event once, lays out shots by damage, keeps the displayed state equal to the real one', () => {
    const games = [
      ...Array.from({ length: 30 }, (_, k) => ({ seed: 1001 + k, net: false })),
      ...Array.from({ length: 30 }, (_, k) => ({ seed: 2001 + k, net: true })),
    ];
    const counts: Record<string, number> = {};
    const problems: string[] = [];
    let actions = 0, shots = 0;
    for (const g of games) {
      const { start, steps } = playGame(g.seed, g.net);
      for (const side of ['P', 'C'] as const) {
        const planner = createPlanner({ cards, ships, viewer: SIDES[side], sea: start.sea?.current ?? null, seaKey });
        const d = displayFrom(start);
        for (const st of steps) {
          const ev = st.events[side];
          const where = `seed ${g.seed}${g.net ? ' net' : ''}, ${side}, действие ${st.n}`;
          actions++;
          const clips = planner.feed(ev, st.action);
          const seen = new Array(ev.length).fill(0);
          for (const c of clips) {
            for (const i of c.ev) seen[i]++;
            counts[c.kind] = (counts[c.kind] ?? 0) + 1;
            if (c.kind === 'fallback') problems.push(`${where}: fallback ${c.type}${c.key ? ` ${c.key}` : ''}; клипы: ${clips.map((x) => x.kind).join(', ')}`);
            if (c.kind === 'shot') {
              shots++;
              const arrived = units(c, (b) => b.out === 'hit' || b.out === 'overkill' || b.out === 'moon');
              const track = units(c, (b) => b.out === 'hit' && b.to === 'track');
              const hull = units(c, (b) => b.out === 'hit' && b.to === 'hull');
              if (arrived !== c.damage || track !== c.amount || hull !== c.toHull) {
                problems.push(`${where}: ядра ${arrived}/${track}/${hull} ≠ урон ${c.damage}/${c.amount}/${c.toHull}`);
              }
            }
          }
          for (const i of clips.quiet) seen[i]++;
          for (const e of ev) {
            if ((e.type === 'hit' || e.type === 'volley') && e.terms.some((t) => !t.src)) problems.push(`${where}: слагаемое ${e.type} без src`);
          }
          if (seen.some((x) => x !== 1)) problems.push(`${where}: события в клипах ${ev.map((e, i) => `${e.type}×${seen[i]}`).join(', ')}`);
          for (const e of ev) applyVisible(d, e, rules);
          if (JSON.stringify(d) !== JSON.stringify(displayFrom(st.after))) {
            problems.push(`${where}: отображаемое состояние ≠ настоящему`);
            Object.assign(d, displayFrom(st.after));
          }
        }
      }
    }
    const sorted = Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
    console.log(`fx-plan: 60 партий, ${actions} действий (обе стороны), ${shots} выстрелов; клипы по видам: ${JSON.stringify(sorted)}`);
    expect(problems.slice(0, 20)).toEqual([]);
    expect(shots).toBeGreaterThan(0);
  });
});

/** The reference scripts run in their own context: they are browser scripts that set window.FX and window.SCENES. */
function loadReference() {
  const dir = new URL('../docs/mockups/anim/level1/', import.meta.url);
  const sandbox: Record<string, unknown> = {};
  sandbox.window = sandbox;
  runInNewContext(readFileSync(new URL('planfx.js', dir), 'utf8'), sandbox);
  runInNewContext(readFileSync(new URL('scenes.js', dir), 'utf8'), sandbox);
  return sandbox as {
    FX: { createPlanner: (opts: unknown) => { feed: (events: unknown[], action: unknown) => unknown[] & { quiet: number[] } } };
    SCENES: { id: string; viewer: string[]; start: { sea: string | null } | null; actions: { a: Action; ev: GameEvent[] }[] }[];
  };
}

describe('animation planner against the reference planfx.js', () => {
  const ref = loadReference();
  const json = (x: unknown) => JSON.parse(JSON.stringify(x));

  for (const id of ['plain', 'wind', 'kraken']) {
    it(`gives the same clips as the reference in the scene «${id}»`, () => {
      const scene = ref.SCENES.find((s) => s.id === id)!;
      expect(scene.start).not.toBeNull();
      const opts = { cards, ships, viewer: scene.viewer, sea: scene.start!.sea, seaKey };
      const theirs = ref.FX.createPlanner(opts);
      const ours = createPlanner(opts);
      for (const a of scene.actions) {
        const want = theirs.feed(json(a.ev), json(a.a));
        const got = ours.feed(json(a.ev), json(a.a));
        expect(got.map((c) => c.kind)).toEqual(json(want).map((c: FxClip) => c.kind));
        expect(json(got)).toEqual(json(want));
        expect(got.quiet).toEqual([...want.quiet]);
      }
    });
  }
});
