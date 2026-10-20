// A2: the clips of the Volley (src/ui/game/fx/volley.ts). The flights themselves are DOM: e2e/fx-volley.spec.ts.
import { describe, expect, it } from 'vitest';
import { PLAY, SCENES } from '../src/ui/game/fx/FxLayer';
import { displayFrom } from '../src/ui/game/fx/display';
import type { FxKind } from '../src/ui/game/fx/planFx';
import type { FxCtx } from '../src/ui/game/fx/primitives';
import { planItem, plannerFor } from '../src/ui/game/fx/queue';
import { dropPlates, scar, scarSpan } from '../src/ui/game/fx/scars';
import { plateHTML, termRows, VOLLEY_SCENE } from '../src/ui/game/fx/volley';
import { playGame, SIDES } from './fx-games';
import { data, turnOf } from './helpers';

const VOLLEY_KINDS: FxKind[] = ['announce', 'window', 'reaction', 'shot', 'cancel', 'counter', 'heart'];

/** A board of a few fake elements: enough for the parts of the clips that do not measure the table. */
function fakeBoard(dock: boolean) {
  const added: unknown[] = [];
  const classes = (list: string[]) => {
    const set = new Set(list);
    return { set, classList: { add: (...c: string[]) => c.forEach((x) => set.add(x)), remove: (...c: string[]) => c.forEach((x) => set.delete(x)), contains: (c: string) => set.has(c) } };
  };
  const planks = [classes(['plank', 'shooter', 'fx-shooter']), classes(['plank', 'targeted', 'fx-targeted', 'hitframe'])];
  const board = {
    querySelector: (sel: string) => (sel === '[data-fx-gap] .dock' && dock ? {} : null),
    querySelectorAll: (sel: string) => (sel.includes('.plank.') ? planks : []),
  };
  const layer = { appendChild: (el: unknown) => added.push(el) };
  return { board, layer, added, planks };
}

function ctxOf(board: unknown, layer: unknown, hints: string[]): FxCtx {
  return {
    board, layer, display: displayFrom(turnOf('ПИРАТЫ')), speed: 0.001, rich: false, run: 1, live: () => 1, data, bottom: 'КОМПАНИЯ',
    hint: (t: string) => hints.push(t),
  } as unknown as FxCtx;
}

describe('the clips of the Volley', () => {
  it('are all in PLAY, and the scene of the Volley is registered once', () => {
    for (const k of VOLLEY_KINDS) expect(typeof PLAY[k], k).toBe('function');
    expect(SCENES.filter((x) => x === VOLLEY_SCENE)).toHaveLength(1);
  });

  it('the declaration and the shot of a Volley of the bots are shown by the layer (20 games, both sides)', () => {
    let fx = 0, show = 0;
    const left: string[] = [];
    for (let k = 0; k < 20; k++) {
      const { start, steps } = playGame(3001 + k, k % 2 === 1);
      for (const side of ['P', 'C'] as const) {
        const planner = plannerFor(data, SIDES[side], start.sea?.current ?? null);
        for (const st of steps) {
          const item = planItem(planner, st.n, st.events[side], st.action);
          if (!item.clips.some((c) => c.kind === 'announce' || c.kind === 'shot')) continue;
          if (item.clips.every((c) => !!PLAY[c.kind])) fx++;
          else {
            show++;
            for (const c of item.clips) if (!PLAY[c.kind] && !left.includes(c.kind)) left.push(c.kind);
          }
        }
      }
    }
    // A4: every clip of every Volley action has its player (ShowLayer is gone).
    expect(fx).toBeGreaterThan(500);
    expect(show).toBe(0);
    expect(left).toEqual([]);
  });

  it('the breakdown plate: who → whom, the damage by the track, the terms, a target changed', () => {
    const ctx = ctxOf(null, null, []);
    const html = plateHTML(ctx, { shooter: 'И', target: 'М', track: 'hull', damage: 3, terms: [{ what: 'Пушки', n: 3 }, { what: 'Буря', n: -1 }] });
    expect(html).toContain('<b>«Индевор»</b> → <b>«Месть»</b>');
    expect(html).toContain('3 по Корпусу');
    expect(html).toContain('<span class="">Пушки</span><span class=" ">3</span>');
    expect(html).toContain('<span class="neg ">−1</span>');
    const moved = plateHTML(ctx, { shooter: 'Ж', declared: 'И', target: 'Г', track: 'sails', damage: 1, was: 2, terms: null });
    expect(moved).toContain('<s>«Индевор»</s> <b>«Голландец»</b>');
    expect(moved).toContain('<s>2</s>1 по Парусам');
  });

  it('V5: the line says «напротив» or «по диагонали»; the pluses and the minuses carry their own classes, the Guns are a plain number', () => {
    const ctx = ctxOf(null, null, []);
    const base = { shooter: 'Ж', target: 'Г', track: 'hull' as const, damage: 1 };
    expect(plateHTML(ctx, { ...base, diagonal: false })).toContain(', напротив');
    expect(plateHTML(ctx, { ...base, diagonal: true })).toContain(', по диагонали');
    const rows = termRows(ctx, [
      { what: 'Пушки', n: 2, src: { kind: 'guns' } },
      { what: 'Ядра', n: 1, src: { kind: 'charge', card: null } },
      { what: 'диагональ', n: -1, src: { kind: 'diag' } },
      { what: 'Буря', n: -1, src: { kind: 'sea', card: 'x' } },
    ]);
    expect(rows).toContain('<span class=" ">2</span>');
    expect(rows).toContain('<span class="pos ">+1</span>');
    expect(rows).toContain('<span class="">Диагональ</span><span class="neg ">−1</span>');
    expect(rows).toContain('<span class="">Буря</span><span class="neg ">−1</span>');
  });

  it('V5: the plate stays ≈ 2 s after the clip (half of it in «простые»), a press drops it at once, and it is not a trace of the six', () => {
    expect(scarSpan('plate', true)).toEqual([2000, 450]);
    expect(scarSpan('plate', false)).toEqual([1000, 225]);
    const plates = Array.from({ length: 8 }, () => ({ dataset: {} as Record<string, string>, style: {} as Record<string, string>, isConnected: true, removed: false, remove() { this.removed = true; } }));
    for (const p of plates) scar(p as never, 'plate');
    // eight plates do not push each other out (SCAR_MAX is for the traces)
    expect(plates.every((p) => !p.dataset.gone)).toBe(true);
    dropPlates();
    expect(plates.every((p) => p.removed)).toBe(true);
  });

  it('window: this device decides — no window in the sea, with a panel or without (fix-ui); the enemy without a panel — a pill', async () => {
    for (const dock of [true, false]) {
      const hints: string[] = [];
      const f = fakeBoard(dock);
      const ctx = ctxOf(f.board, f.layer, hints);
      const clip = { kind: 'window', ev: [], events: [], side: 'КОМПАНИЯ', phase: 'before', mine: true, forCard: false, seats: ['И'] } as never;
      await PLAY.window!(clip, ctx);
      expect(f.added).toHaveLength(0);
      expect(hints).toEqual(['Реакция?']);
    }
    // the enemy decides and no panel stands in the middle: the paper pill is drawn (it measures the gap: the fake board has none)
    const hints: string[] = [];
    const f = fakeBoard(false);
    const ctx = ctxOf(f.board, f.layer, hints);
    const enemy = { kind: 'window', ev: [], events: [], side: 'КОМПАНИЯ', phase: 'before', mine: false, forCard: false, seats: ['И'] } as never;
    await expect(PLAY.window!(enemy, ctx)).rejects.toThrow();
    expect(hints).toEqual(['Противник может ответить Реакцией…']);
  });

  it('«Сразу итог»: only the frames of the scene go, shooter / targeted of React stay', () => {
    const f = fakeBoard(false);
    VOLLEY_SCENE.reset(f.board as unknown as HTMLElement);
    expect([...f.planks[0].set]).toEqual(['plank', 'shooter']);
    expect([...f.planks[1].set]).toEqual(['plank', 'targeted']);
    expect(VOLLEY_SCENE.alive()).toBe(false);
    expect(VOLLEY_SCENE.keep()).toEqual([]);
  });
});
