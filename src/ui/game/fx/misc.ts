// The clips of the ships in motion: a change of places (FLIP), diving and surfacing, sinking, the abilities of the
// ships. A port of docs/mockups/anim/level1/play-misc.js (see PORTING.md): the code is the reference's, what changed is
// how an element is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. The rest of
// play-misc.js (the turn, the card, repairs, Powder, Souls, statuses …) comes in A4.
// Changes against the reference («game:»):
//  - renderWith draws the table through React (the queue keeps a preview of D and draws it at once); the planks keep
//    their DOM nodes (key — the code of the ship), so the FLIP animates the same element from its old place;
//  - the reference draws the table anew after each clip, so the animations of a plank with fill 'forwards' go with
//    its old node; in the game the node stays, so the queue cancels the finished animations of the planks after the
//    clip (FxLayer.tsx). The steady look («Под водой», sunk) is the class of the plank from the displayed state.
import { shipData, type GameEvent } from '../../../engine/state';
import { SIDE_LABEL } from '../text';
import type { ClipPlayer } from './FxLayer';
import type { DiveClip, SinkClip, SurfaceClip, SwapClip } from './planFx';
import { A, allPlanks, bubbles, bx, dirOf, facingY, gapBox, hint, mk, payKegs, plank, sideOf, splash, steam, tag, wait, whirlpool, type FxCtx } from './primitives';

/** FLIP: remember where the planks stood, draw the table with the events and carry them over with an arc. */
export async function flipTo(ctx: FxCtx, evs: readonly GameEvent[], d = 650, filter: (e: GameEvent) => boolean = () => true): Promise<void> {
  const before: Record<string, ReturnType<typeof bx>> = {};
  for (const el of allPlanks(ctx)) before[el.dataset.fxShip!] = bx(ctx, el);
  ctx.renderWith(evs.filter(filter));
  for (const el of allPlanks(ctx)) {
    const code = el.dataset.fxShip!, b0 = before[code]; if (!b0) continue;
    const b1 = bx(ctx, el), dx = b0.x - b1.x, dy = b0.y - b1.y;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
    const lift = dx > 0 ? 1 : -1;
    A(ctx, el, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${dx / 2}px,${dy / 2 + dirOf(ctx, code) * -16 * lift}px) rotate(${lift * 1.5}deg)`, offset: 0.5 }, { transform: 'none' }], d, 0, 'cubic-bezier(.45,0,.3,1)', 'none');
    if (ctx.rich) { const m = bx(ctx, el); for (let q = 0; q < 3; q++) splash(ctx, m.x + m.w * (0.25 + q * 0.25), facingY(ctx, code), d * 0.85 + q * 60); }
  }
  await wait(ctx, d + 80);
}
export const SWAP_LABEL: Record<string, string> = { regroup: 'Перестроение', maelstrom: 'Мальстрём', current: 'Течение', jack: 'Джек ускользает', sword: 'Меч Тритона', card: 'Смена мест', sink: 'Капитан уходит к союзнику' };
export function banner(ctx: FxCtx, text: string, cls = 'small', d = 1200, y?: number): HTMLElement {
  const g = gapBox(ctx);
  const bn = mk(ctx, 'banner ' + cls, ctx.board.clientWidth / 2, y ?? g.cy, text);
  A(ctx, bn, [{ opacity: 0, scale: '0.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0, scale: '1.04' }], d, 0);
  return bn;
}

const nick = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nick}»`;
const gen = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickGenitive}»`;

export const PLAY_MISC: Record<'swap' | 'sink' | 'dive' | 'surface', ClipPlayer> = {} as never;
const PLAY = PLAY_MISC as unknown as {
  swap: (c: SwapClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
  sink: (c: SinkClip, ctx: FxCtx) => Promise<void>;
  dive: (c: DiveClip, ctx: FxCtx) => Promise<void>;
  surface: (c: SurfaceClip, ctx: FxCtx) => Promise<void>;
};

PLAY.swap = async (c, ctx) => {
  hint(ctx, `${SIDE_LABEL[c.side].name}: ${SWAP_LABEL[c.reason] || 'смена мест'}`);
  if (c.cost) payKegs(ctx, c.side, c.cost, 0);
  const a = plank(ctx, c.ships[0]);
  banner(ctx, SWAP_LABEL[c.reason] || 'Смена мест', 'small', 1200, (bx(ctx, a).y + bx(ctx, a).b) / 2);
  await wait(ctx, 250);
  await flipTo(ctx, c.events, 650);
  await wait(ctx, 150);
};

/** Sinking: the plank heels over and goes down, water, a whirlpool, the stamp «Затонул»; the captain goes to the ally. */
PLAY.sink = async (c, ctx) => {
  const el = plank(ctx, c.ship), b = bx(ctx, el);
  hint(ctx, `${nick(ctx, c.ship)} тонет`);
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(ctx, fb); steam(ctx, sb.cx, sb.cy, 300); }
  A(ctx, el, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-2.5deg) translateY(3px)', offset: 0.25 }, { transform: 'rotate(-3.5deg) translateY(30px)', opacity: 0.15 }], 1500, 0, 'ease-in', 'forwards');
  const water = mk(ctx, 'tint', 0, 0); water.style.width = b.w + 'px'; water.style.height = b.h + 'px'; water.style.background = 'linear-gradient(rgba(36,70,92,0), rgba(36,70,92,.55))'; water.style.borderRadius = '12px';
  A(ctx, water, [{ opacity: 0, transform: `translate(${b.x}px,${b.y + b.h * 0.6}px) scaleY(.2)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], 1300, 200, 'ease-in', 'forwards');
  bubbles(ctx, b.x + 10, b.b - 6, b.w - 20, 400, ctx.rich ? 22 : 0, 60);
  whirlpool(ctx, b.cx, b.cy + 10, 500, Math.min(200, b.w * 0.7), 1400);
  const st = mk(ctx, 'stamp-fx', b.cx, b.cy, 'Затонул');
  A(ctx, st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1', offset: 0.3 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1400, 900, 'cubic-bezier(.3,1.6,.5,1)');
  const ally = Object.keys(ctx.display.ships).find((x) => sideOf(ctx, x) === sideOf(ctx, c.ship) && x !== c.ship && !ctx.display.ships[x].sunk);
  if (ally) { const ab = bx(ctx, plank(ctx, ally)); tag(ctx, ab.cx, ab.y - 12, `Капитан ${gen(ctx, c.ship)} — на борту ${gen(ctx, ally)}`, 1500, '', 1600); }
  await wait(ctx, ally ? 2100 : 1700);
};

/** Diving: the water rises over the plank from below, bubbles, the Fires go out. */
export function diveFx(ctx: FxCtx, code: string, delay: number): number {
  const el = plank(ctx, code), b = bx(ctx, el);
  const w = mk(ctx, 'underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(ctx, w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], 700, delay, 'ease-in-out', 'forwards');
  A(ctx, el, [{ transform: 'none' }, { transform: 'translateY(6px) scale(.985)' }, { transform: 'none' }], 1300, delay, 'ease-in-out', 'none');
  bubbles(ctx, b.x + 8, b.b - 4, b.w - 16, delay + 100, 16, 60);
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(ctx, fb); steam(ctx, sb.cx, sb.cy, delay + 450); A(ctx, fb, [{ opacity: 1 }, { opacity: 0 }], 300, delay + 500, 'ease-in', 'forwards'); tag(ctx, sb.cx, sb.y - 10, 'Пожары гаснут', delay + 550, 'good', 1200); }
  tag(ctx, b.cx, b.y - 12, 'Под водой', delay + 500, '', 1400);
  return delay + 1400;
}
/** Surfacing: the water goes down, splashes along the top edge. */
export function surfaceFx(ctx: FxCtx, code: string, delay: number): number {
  const el = plank(ctx, code), b = bx(ctx, el);
  const w = mk(ctx, 'underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(ctx, w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }], 600, delay, 'ease-in', 'forwards');
  A(ctx, el, [{ transform: 'translateY(6px) scale(.985)' }, { transform: 'translateY(-3px)', offset: 0.7 }, { transform: 'none' }], 700, delay, 'ease-out', 'none');
  for (let k = 0; k < 3; k++) splash(ctx, b.x + b.w * (0.2 + 0.3 * k), b.y + 2, delay + 380 + k * 90);
  if (ctx.rich) for (let k = 0; k < 10; k++) { const d = mk(ctx, 'bubble', 0, 0); const x0 = b.x + Math.random() * b.w; A(ctx, d, [{ opacity: 1, transform: `translate(${x0}px,${b.y}px) scale(.6)` }, { opacity: 0, transform: `translate(${x0 + (Math.random() - 0.5) * 30}px,${b.y - 20 - Math.random() * 25}px) scale(.9)` }], 600, delay + 400 + Math.random() * 200); }
  tag(ctx, b.cx, b.y - 14, 'Всплытие: первый Залп +1 и без Реакций', delay + 500, 'plus', 1600);
  return delay + 1400;
}
PLAY.dive = async (c, ctx) => { hint(ctx, `${nick(ctx, c.ship)} уходит под воду`); await wait(ctx, diveFx(ctx, c.ship, 0) + 100); };
PLAY.surface = async (c, ctx) => { hint(ctx, `${nick(ctx, c.ship)} всплывает`); await wait(ctx, surfaceFx(ctx, c.ship, 0) + 100); };
