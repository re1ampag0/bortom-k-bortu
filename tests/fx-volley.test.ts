// A2: the clips of the Volley (src/ui/game/fx/volley.ts). The flights themselves are DOM: e2e/fx-volley.spec.ts.
import { describe, expect, it } from 'vitest';
import { PLAY, SCENES } from '../src/ui/game/fx/FxLayer';
import { displayFrom } from '../src/ui/game/fx/display';
import type { FxKind } from '../src/ui/game/fx/planFx';
import type { FxCtx } from '../src/ui/game/fx/primitives';
import { planItem, plannerFor } from '../src/ui/game/fx/queue';
import { plateHTML, VOLLEY_SCENE } from '../src/ui/game/fx/volley';
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
          const item = planItem(planner, st.n, st.events[side], st.action, (kind) => !!PLAY[kind]);
          if (!item.clips.some((c) => c.kind === 'announce' || c.kind === 'shot')) continue;
          if (item.route === 'fx') fx++;
          else {
            show++;
            for (const c of item.clips) if (!PLAY[c.kind] && !left.includes(c.kind)) left.push(c.kind);
          }
        }
      }
    }
    // The rest goes to ShowLayer until A4 ports its clips (a card, the end of the game …); a sinking goes through the
    // layer since A3.
    expect(fx).toBeGreaterThan(show);
    expect(left.every((k) => !VOLLEY_KINDS.includes(k as FxKind))).toBe(true);
    expect(left).not.toContain('sink');
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

  it('window: with a panel of the game in the middle the window of the reference is not drawn, the hint stays', async () => {
    for (const dock of [true, false]) {
      const hints: string[] = [];
      const f = fakeBoard(dock);
      const ctx = ctxOf(f.board, f.layer, hints);
      const clip = { kind: 'window', ev: [], events: [], side: 'КОМПАНИЯ', phase: 'before', mine: true, forCard: false, seats: ['И'] } as never;
      if (dock) {
        await PLAY.window!(clip, ctx);
        expect(f.added).toHaveLength(0);
        expect(hints).toEqual(['Реакция?']);
      } else {
        // Without a panel the clip draws its window (it measures the gap: the fake board has none).
        await expect(PLAY.window!(clip, ctx)).rejects.toThrow();
        expect(hints).toEqual(['Реакция?']);
      }
    }
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
