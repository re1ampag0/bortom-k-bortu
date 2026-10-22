import {animateParticle, canvasRing, canvasHTML, canvasShape, canvasSmoke, canvasCircle, particleCount, pauseParticles, rememberParticleHost, type ParticleAnimation, type ParticleTarget} from './particles';
import {getPerf, perfOff} from '../perf/state';
import {perfAnimHook} from '../perf/clip';
// Effect primitives of the animation layer: a port of docs/mockups/anim/level1/effects.js (see PORTING.md).
// The code is the reference's; what changed is how an element is found (the data-fx-* DOM contract, from the board of
// the context) and the types. The globals of the reference (board, fx, D, SPEED, RICH, RUN, G) are the context `ctx`,
// the first argument of every primitive.
// Rules: only transform and opacity move (WAAPI element.animate); positions come from the real elements of the table
// (getBoundingClientRect relative to the board); every duration × the speed factor. Effects live in .fx-layer
// (pointer-events: none) and never stop a press on a card or a button.
import { cardByCode, shipData, startValue, type GameEvent } from '../../../engine/state';
import type { GameData, Side, Track } from '../../../engine/types';
import { HIDDEN } from '../../../engine/view';
import { cardClass } from '../Hand';
import type { BallKind } from './planFx';
import type { Display } from './display';
import { scar } from './scars';
import { FLAME } from '../art/fire';
import { T } from './timing';
import { stageK } from '../../stage';
import {shotArt,shotSprite,shotA,floatBoardSprite} from './volleySprites';
import { plainText } from '../text';

/** Everything an effect needs: the reference's globals, for one run of the queue. */
export interface FxCtx {
  /** The table (.board, position: relative): positions are relative to it. */
  board: HTMLElement;
  /** Explicit opt-in: only Volley, Armada, sinking and fire producers. */
  canvasParticles?: boolean;
  legendParticles?: boolean;
  svgParticleOpacity?: boolean;
  /** Only Volley/Counter opt into prepared object wrappers. */
  volleySprites?: boolean;
  /** .fx-layer, the last child of the board: effects are added here. */
  layer: HTMLElement;
  /** The displayed state D (what the planks show before the clip's events are applied). */
  display: Display;
  /** The speed factor (speedFactor of P4): 1.6 / 1 / 0.6. */
  speed: number;
  /** «Спецэффекты: богатые» — particles; «простые» — without them. */
  rich: boolean;
  /** The run this clip belongs to. */
  run: number;
  /** The current run: when it is not `run` any more, the clip was cut off («Сразу итог», a press on the table). */
  live: () => number;
  data: GameData;
  /** The side at the bottom of the screen (the viewer's). */
  bottom: Side;
  /** The team at the bottom is played from this device: «Ваш ход» (a match of bots — «Ход Пиратов»). */
  own: boolean;
  /** The line of the status bar while the clip plays (React state, not textContent of a node React owns). */
  hint: (text: string) => void;
  /**
   * renderWith of the reference: the table is drawn at once as if these events were applied to D (D itself does not
   * change; after the clip D takes them in anyway). The FLIP of the planks measures before and after it.
   */
  renderWith: (evs: readonly GameEvent[]) => void;
  /** The phone layout (max-width: 700px), read once for the clip, not by matchMedia at every animation. */
  narrow?: boolean;
}

export interface Pt {
  x: number;
  y: number;
}
/** A box relative to the board. */
export interface Box extends Pt {
  w: number;
  h: number;
  cx: number;
  cy: number;
  r: number;
  b: number;
}
/** A position of a flying card. */
export interface CardPos extends Pt {
  r?: number;
  s?: number;
}
export type FlyCard = HTMLElement & { _pos?: CardPos };

export const ABORT = Symbol('abort');

export const ms = (ctx: FxCtx, t: number) => t * ctx.speed;

/**
 * The clock of the clips: every at() and wait() goes through it, so «Пауза» stops a clip in the middle — the timers
 * stand still with the animations of the layer (pauseClock) and go on from where they were (resumeClock).
 */
interface Timer {
  fn: () => void;
  left: number;
  start: number;
  id: ReturnType<typeof setTimeout> | null;
}
const timers = new Set<Timer>();
let clockPaused = false;
function arm(tm: Timer): void {
  tm.start = performance.now();
  tm.id = setTimeout(() => {
    timers.delete(tm);
    tm.fn();
  }, tm.left);
}
function later(fn: () => void, delay: number): void {
  const tm: Timer = { fn, left: delay, start: 0, id: null };
  timers.add(tm);
  if (!clockPaused) arm(tm);
}
export function pauseClock(): void {
  if (clockPaused) return;
  clockPaused = true;
  pauseParticles(true);
  for (const tm of timers) {
    if (tm.id === null) continue;
    clearTimeout(tm.id);
    tm.id = null;
    tm.left = Math.max(0, tm.left - (performance.now() - tm.start));
  }
}
export function resumeClock(): void {
  if (!clockPaused) return;
  clockPaused = false;
  pauseParticles(false);
  for (const tm of timers) arm(tm);
}
/** The run was cut off: every timer fires now — at() of the old run does nothing, its wait() ends with ABORT. */
export function flushClock(): void {
  for (const tm of [...timers]) {
    if (tm.id !== null) clearTimeout(tm.id);
    timers.delete(tm);
    tm.fn();
  }
}

export function wait(ctx: FxCtx, t: number): Promise<void> {
  return new Promise((res, rej) => later(() => (ctx.run === ctx.live() ? res() : rej(ABORT)), ms(ctx, t)));
}
export function at(ctx: FxCtx, t: number, fn: () => void): void {
  later(() => {
    if (ctx.run === ctx.live()) fn();
  }, ms(ctx, t));
}
export function A(ctx: FxCtx, el: Element, kf: Keyframe[], d: number, delay?: number, easing?: string, fill?: FillMode): Animation;
export function A(ctx: FxCtx, el: Element | ParticleTarget, kf: Keyframe[], d: number, delay?: number, easing?: string, fill?: FillMode): Animation | ParticleAnimation;
export function A(ctx: FxCtx, el: Element | ParticleTarget, kf: Keyframe[], d: number, delay = 0, easing = 'ease-out', fill: FillMode = 'both'): Animation | ParticleAnimation {
  if ('particle' in el) return animateParticle(el, kf, ms(ctx,d), ms(ctx,delay), easing);
  if (perfAnimHook) perfAnimHook(el);
  // Backwards fill also positions SVG children during their delay; unlike direct HTML
  // children of .fx-layer they need not have opacity:0 in their base style.
  const phone = ctx.narrow ?? ctx.board.ownerDocument.defaultView?.matchMedia('(max-width: 700px)').matches;
  const frames = phone || perfOff('filters') ? kf.map(({ filter: _filter, ...frame }) => frame) : kf;
  if ((perfOff('planks') && el.closest('.plank')) || (perfOff('labels') && el.closest('.flyc,.seacard,.plate,.tag,.pill,.wait-pill,.tmark,.hold-tag'))) return el.animate([], {duration: 0});
  const animation = el.animate(frames, { duration: Math.max(1, ms(ctx, d)), delay: ms(ctx, delay), easing, fill });
  if (animation) trackBudgetAnimation(ctx, el, animation);
  if (frames.some(f => f.transform !== undefined) && el.matches?.('[data-fx-ship], .hcard, [data-fx-hand]')) invalidateGeometry(ctx.board);
  if (ctx.canvasParticles) rememberParticleHost(el, animation, frames, easing);
  // These single-use decorations have already become invisible. Freeze opacity before cancelling
  // their forwards fill, so an SVG's normally-visible base style can never flash at the origin.
  // Do not touch cannonballs, planks, cards that persist between clips, or reusable sprite bodies.
  if (ctx.canvasParticles && Number(frames.at(-1)?.opacity) === 0 &&
      el.matches('.gun-fire,.lg-title,.lg-card,.lg-seal,.lg-sun,.lg-veil,circle[fill^="url(#fx"],circle[fill="none"]')) {
    void animation.finished.then(() => {
      if (!el.isConnected || ctx.run !== ctx.live()) return;
      (el as HTMLElement | SVGElement).style.opacity = '0';
      (el as HTMLElement | SVGElement).style.willChange = 'auto';
      // An earlier forwards entrance may still override the inline opacity after the exit
      // is cancelled (the veil has both). Retire every own animation, and descendants of
      // the finished title/card/seal, so that no underlying fill can make them visible again.
      const targets = el.matches('.lg-title,.lg-card,.lg-seal') ? [el,...el.querySelectorAll('*')] : [el];
      // These are precisely the WAAPI handles created by A, including finished forwards
      // entrances. No subtree getAnimations/style flush for each finished spark/flash.
      for (const target of targets) for (const own of elementAnimations.get(target) ?? []) if (own.playState !== 'idle') own.cancel();
    }, () => {});
  }
  // An opacity-zero plate can otherwise leave its explicitly interactive card links over the table.
  if (el.matches?.('.plate') && frames[0]?.opacity !== undefined && frames.at(-1)?.opacity !== undefined) {
    const rising = Number(frames.at(-1)!.opacity) > Number(frames[0].opacity);
    el.setAttribute('inert', '');
    if (rising) void animation.finished.then(() => {
      if (ctx.run === ctx.live() && el.isConnected) el.removeAttribute('inert');
    }, () => {});
  }
  return animation;
}
interface GeometryStep { board: DOMRect; k: number; boxes: WeakMap<Element, Box>; w: number; h: number }
const geometrySteps = new WeakMap<HTMLElement, GeometryStep>();
/** A render/FLIP can change anchor positions inside the same synchronous clip step. */
export function invalidateGeometry(board: HTMLElement): void { geometrySteps.delete(board); }
function stepOf(ctx: FxCtx): GeometryStep {
  let step = geometrySteps.get(ctx.board);
  if (!step) {
    step = {board: ctx.board.getBoundingClientRect(), k: stageK(), boxes: new WeakMap(), w: ctx.board.clientWidth, h: ctx.board.clientHeight};
    geometrySteps.set(ctx.board, step);
    const current = step;
    queueMicrotask(() => { if (geometrySteps.get(ctx.board) === current) geometrySteps.delete(ctx.board); });
  }
  return step;
}
/** The size of the board for this synchronous step: read once, not again after each element a clip adds. */
export const boardW = (ctx: FxCtx) => stepOf(ctx).w;
export const boardH = (ctx: FxCtx) => stepOf(ctx).h;
export function bx(ctx: FxCtx, el: Element): Box {
  const step = stepOf(ctx);
  // Cache only stable table anchors. Newly written labels/effects still measure their actual size.
  const anchor = el.matches('[data-fx-ship], [data-fx-track], [data-fx-value], [data-fx-hold], [data-fx-gap], .cells i, .bar');
  const cached = anchor && step.boxes.get(el);
  if (cached) return cached;
  const r = el.getBoundingClientRect(), b = step.board, k = step.k;
  const box = {x:(r.left-b.left)/k,y:(r.top-b.top)/k,w:r.width/k,h:r.height/k,cx:(r.left-b.left+r.width/2)/k,cy:(r.top-b.top+r.height/2)/k,r:(r.right-b.left)/k,b:(r.bottom-b.top)/k};
  if (anchor) step.boxes.set(el,box);
  return box;
}
export function particleHTML(ctx: FxCtx,cls: string): HTMLElement | ParticleTarget {
  return canvasHTML(ctx,cls) ?? mk(ctx,cls,0,0);
}
export function mk(ctx: FxCtx, cls: string, x: number, y: number, html = ''): HTMLElement {
  const d = document.createElement('div');
  d.className = cls;
  if (getPerf().enabled && /^(puff|spark|splinter|splash|ripple|ember|gold-dust|dust|bubble|wisp|shred|streak|sparkle)( |$)/.test(cls)) d.dataset.perfParticle = '';
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  d.innerHTML = html;
  ctx.layer.appendChild(d);
  return d;
}
export const visible = (el: Element | null | undefined): el is HTMLElement => !!el && el.getClientRects().length > 0 && (el as HTMLElement).offsetWidth > 0;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* ——— DOM contract: how to find the elements of the table ——— */
export const sideOf = (ctx: FxCtx, code: string): Side => shipData(ctx.data, code).side;
export const plank = (ctx: FxCtx, code: string) => ctx.board.querySelector<HTMLElement>(`[data-fx-ship="${code}"]`)!;
export const allPlanks = (ctx: FxCtx) => [...ctx.board.querySelectorAll<HTMLElement>('[data-fx-ship]')];
export const trackEl = (ctx: FxCtx, code: string, t: Track) => plank(ctx, code).querySelector<HTMLElement>(`[data-fx-track="${t}"]`)!;
export const valueEl = (ctx: FxCtx, code: string, t: Track) => trackEl(ctx, code, t).querySelector<HTMLElement>('[data-fx-value]')!;
export const gapBox = (ctx: FxCtx) => bx(ctx, ctx.board.querySelector('[data-fx-gap]')!);
export const holdEl = (ctx: FxCtx, side: Side) => ctx.board.querySelector<HTMLElement>(`[data-fx-hold="${side}"]`)!;
export const handCardEl = (ctx: FxCtx, code: string) => ctx.board.querySelector<HTMLElement>(`[data-fx-hand] [data-fx-card="${code}"]`);
export const isTop = (ctx: FxCtx, code: string) => sideOf(ctx, code) !== ctx.bottom;
/** The edge of the plank facing the enemy: cannonballs fly out of it and hit it. */
export const facingY = (ctx: FxCtx, code: string) => {
  const b = bx(ctx, plank(ctx, code));
  return isTop(ctx, code) ? b.b : b.y;
};
export const dirOf = (ctx: FxCtx, code: string) => (isTop(ctx, code) ? 1 : -1); // +1 — fires downwards

/**
 * The point of a cell of a track. On a laptop — the cell itself (.cells i), on a phone the Hull — a part of the bar
 * (.bar), the other tracks — the window with the number. So cannonballs fly to the place the player sees.
 */
export function fxPoint(ctx: FxCtx, code: string, t: Track, idx: number): Pt {
  const tr = trackEl(ctx, code, t), max = startValue(ctx.data, code, t);
  const i = clamp(idx, 0, max - 1);
  const cells = tr.querySelector('.cells');
  if (visible(cells) && cells.children[i]) {
    const c = bx(ctx, cells.children[i]);
    return { x: c.cx, y: c.cy };
  }
  const bar = tr.querySelector('.bar');
  if (visible(bar)) {
    const b = bx(ctx, bar);
    return { x: b.x + (b.w * (i + 0.5)) / max, y: b.cy };
  }
  const v = bx(ctx, tr.querySelector('[data-fx-value]')!);
  return { x: v.cx, y: v.cy };
}
/** Shows a new value of a track on the plank in the middle of an animation (a cell goes out/lights up, the bar, the number). */
export function setTrack(ctx: FxCtx, code: string, t: Track, v: number, flashColor?: string): void {
  const tr = trackEl(ctx, code, t), max = startValue(ctx.data, code, t);
  const cells = tr.querySelector<HTMLElement>('.cells')!;
  [...cells.children].forEach((c, i) => {
    const on = i < v, was = c.classList.contains('on');
    c.classList.toggle('on', on);
    // FX-A: the icon itself flashes (swapIcon of fx3.js): it swells and glows in the colour, then settles; a mended
    // one glows longer and golden. (The background of the A5 icons is the picture: a coloured background is gone.)
    if (flashColor && on !== was) {
      if (on) A(ctx, c, [{ transform: 'scale(1.6)', filter: `brightness(1.8) drop-shadow(0 0 5px #ffd27a) drop-shadow(0 0 3px ${flashColor})` }, { transform: 'scale(1)', filter: 'none' }], 1100, 0, 'ease-out', 'none');
      else A(ctx, c, [{ transform: 'scale(1.6)', filter: `brightness(1.6) drop-shadow(0 0 4px ${flashColor})` }, { transform: 'scale(1)', filter: 'none' }], 420, 0, 'ease-out', 'none');
    }
  });
  const bar = tr.querySelector<HTMLElement>('.bar i');
  if (bar) bar.style.width = `${(100 * v) / max}%`;
  const num = tr.querySelector<HTMLElement>('[data-fx-value]')!;
  num.textContent = `${v}/${max}`;
  if (flashColor) A(ctx, num, [{ color: flashColor }, { color: '#2a241d' }], 800, 0);
  if (flashColor && !visible(cells)) {
    const barEl = tr.querySelector('.bar');
    A(ctx, visible(barEl) ? barEl : tr, [{ boxShadow: `0 0 0 2px ${flashColor}` }, { boxShadow: 'none' }], 700, 0, 'ease-out', 'none');
  }
}
/** The number of the displayed value of a track (as on the plank now). */
export const shownTrack = (ctx: FxCtx, code: string, t: Track) => Number(valueEl(ctx, code, t).textContent!.split('/')[0]);

/* ——— movement ——— */
export function curve(p0: Pt, p1: Pt, bend: number, n = 18): Pt[] {
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const c = { x: (p0.x + p1.x) / 2 - dy * bend, y: (p0.y + p1.y) / 2 + dx * bend };
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x, y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y };
  });
}
/** A flight along points. lift — the «height» of the ball (scale in the middle of the path): a view from above, the ball flies in an arc. */
export function fly(ctx: FxCtx, el: Element, pts: Pt[], d: number, delay: number, { lift = 0.3, fadeEnd = true, spin = 0 } = {}): Animation {
  const n = pts.length - 1;
  return A(ctx, el, pts.map((p, i) => ({ offset: i / n, opacity: fadeEnd && i === n ? 0 : 1, transform: `translate(${p.x}px,${p.y}px) scale(${1 + lift * Math.sin((Math.PI * i) / n)}) rotate(${(spin * i) / n}deg)` })), d, delay, 'cubic-bezier(.3,0,.75,1)', 'forwards');
}
export function pop(ctx: FxCtx, el: Element, x: number, y: number, d: number, delay: number, from = 0.3, to = 1.6): void {
  A(ctx, el, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(${from})` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.25 }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(${to})` }], d, delay);
}
export function flash(ctx: FxCtx, x: number, y: number, delay: number, size = 1): void {
  const f = mk(ctx, 'flash', 0, 0);
  pop(ctx, f, x, y, 350, delay, 0.3 * size, 1.6 * size);
}
export function puff(ctx: FxCtx, x: number, y: number, delay: number): void {
  if (perfOff('particles')) return;
  if (!ctx.rich) return;
  const p = particleHTML(ctx, 'puff');
  A(ctx, p, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }, { opacity: 0.95, offset: 0.15 }, { opacity: 0, transform: `translate(${x - 6}px,${y - 10}px) scale(2.4)` }], 1500, delay);
}
export function burst(ctx: FxCtx, cls: string, x: number, y: number, delay: number, n: number, r0: number, r1: number, dur = 600, angle0 = 0, spread = 2 * Math.PI): void {
  if (perfOff('particles')) return;
  if (!ctx.rich) return;
  for (let k = 0; k < n; k++) {
    const e = particleHTML(ctx, cls);
    const a = angle0 + (k / n - 0.5) * spread + (Math.random() - 0.5) * 0.4, r = r0 + Math.random() * (r1 - r0);
    A(ctx, e, [{ opacity: 1, transform: `translate(${x}px,${y}px) rotate(${a}rad)` }, { opacity: 0, transform: `translate(${x + Math.cos(a) * r}px,${y + Math.sin(a) * r}px) rotate(${a + (cls === 'spark' ? 0 : 3)}rad)` }], dur, delay, 'cubic-bezier(.2,.7,.3,1)');
  }
}
export function splash(ctx: FxCtx, x: number, y: number, delay: number): void {
  if (perfOff('particles')) return;
  const s = mk(ctx, 'splash', 0, 0, '<svg viewBox="0 0 44 30" width="44" height="30"><g fill="#9CC3DA"><path d="M22 30 C18 18 14 10 10 4 C16 10 19 16 22 22 C25 16 28 10 34 4 C30 10 26 18 22 30Z"/><circle cx="8" cy="14" r="2.5"/><circle cx="36" cy="12" r="2.5"/><circle cx="22" cy="4" r="2"/></g></svg>');
  A(ctx, s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.3)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.25 }, { opacity: 0, transform: `translate(${x}px,${y - 6}px) scale(1.2)` }], 700, delay);
  const r = particleHTML(ctx, 'ripple');
  A(ctx, r, [{ opacity: 0.9, transform: `translate(${x}px,${y}px) scale(.3)` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1.8)` }], 900, delay);
  if (ctx.rich) {
    const r2 = particleHTML(ctx, 'ripple');
    A(ctx, r2, [{ opacity: 0.6, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1.3)` }], 900, delay + 160);
  }
}
/** game: a label never goes past the edge of the table — it moves in, 8 px from it (the reference lets it go out). */
const EDGE = 8;
export function inside(v: number, size: number, max: number): number {
  return Math.max(EDGE, Math.min(max - EDGE - size, v));
}
/** «диагональ −1» → «Диагональ −1»: the terms of the engine are lower-case, the marks on the table start with a capital. */
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function tag(ctx: FxCtx, x: number, y: number, text: string, delay: number, cls = '', dur = 1500): HTMLElement {
  const t = mk(ctx, 'tag ' + cls, x, y);
  t.textContent = capFirst(text);
  // .tag is centred on its point (translate(-50%, -50%)); it rises 4 px at the start
  const w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = inside(x - w / 2, w, boardW(ctx)) + w / 2 + 'px';
  t.style.top = inside(y - h / 2, h + 4, boardH(ctx)) + h / 2 + 'px';
  A(ctx, t, [{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0', offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], dur, delay);
  return t;
}
export function bubbles(ctx: FxCtx, x: number, y: number, w: number, delay: number, n = 10, rise = 40): void {
  if (perfOff('particles')) return;
  if (!ctx.rich) return;
  for (let k = 0; k < n; k++) {
    const b = particleHTML(ctx, 'bubble');
    const bx0 = x + Math.random() * w, by = y - Math.random() * 8;
    A(ctx, b, [{ opacity: 0, transform: `translate(${bx0}px,${by}px) scale(.5)` }, { opacity: 0.9, offset: 0.2 }, { opacity: 0, transform: `translate(${bx0 + (Math.random() - 0.5) * 12}px,${by - rise - Math.random() * 20}px) scale(1.1)` }], 900 + Math.random() * 400, delay + Math.random() * 500);
  }
}
export function steam(ctx: FxCtx, x: number, y: number, delay: number): void {
  if (perfOff('particles')) return;
  for (let k = 0; k < (ctx.rich ? 5 : 1); k++) {
    const p = particleHTML(ctx, 'puff');
    A(ctx, p, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 0.8, offset: 0.2 }, { opacity: 0, transform: `translate(${x + (k - 2) * 6}px,${y - 26}px) scale(1.1)` }], 900, delay + k * 70);
  }
}
/** A shake: a weak hit 2–3 px, a strong one 8–10 px, 50–100 ms per phase (see «ощущение удара»). */
export function shake(ctx: FxCtx, el: Element, delay: number, amp = 3, d = 260): void {
  A(ctx, el, [{ transform: 'none' }, { transform: `translate(${-amp}px,1px)` }, { transform: `translate(${amp}px,-1px)` }, { transform: `translate(${-amp * 0.6}px,0)` }, { transform: `translate(${amp * 0.3}px,0)` }, { transform: 'none' }], d, delay, 'linear', 'none');
}
export function ring(ctx: FxCtx, x: number, y: number, delay: number, size = 1, color?: string): void {
  if (perfOff('particles')) return;
  if (!ctx.rich) return;
  const r = mk(ctx, 'ring', 0, 0);
  if (color) r.style.borderColor = color;
  A(ctx, r, [{ opacity: 0.9, transform: `translate(${x}px,${y}px) scale(${0.2 * size})` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(${1.6 * size})` }], 500, delay);
}
export function overlayAt(ctx: FxCtx, cls: string, b: Pick<Box, 'x' | 'y' | 'w' | 'h'>, pad = 0): HTMLElement {
  const o = mk(ctx, cls, 0, 0);
  o.style.width = b.w + pad * 2 + 'px';
  o.style.height = b.h + pad * 2 + 'px';
  o.style.transform = `translate(${b.x - pad}px,${b.y - pad}px)`;
  return o;
}
export function whirlpool(ctx: FxCtx, x: number, y: number, delay: number, size = 90, dur = 0): HTMLElement {
  const w = mk(ctx, 'whirl', 0, 0, `<svg viewBox="-50 -50 100 100" width="${size}" height="${size * 0.55}"><g fill="none" stroke="#5E86A0" stroke-width="3" stroke-linecap="round"><path d="M0 0 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0 a22 22 0 1 1 -44 0 a28 28 0 1 1 56 0"/></g><circle r="5" fill="#24465C"/></svg>`);
  w.style.width = size + 'px';
  w.style.height = size * 0.55 + 'px';
  w.style.margin = `-${size * 0.275}px 0 0 -${size / 2}px`;
  A(ctx, w, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)` }], 500, delay, 'ease-out', 'forwards');
  if (ctx.rich) { const target=w.querySelector('svg')!; const animation=target.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: ms(ctx, 1800), iterations: dur ? Math.ceil(dur / 1800) : 6, delay: ms(ctx, delay) }); trackBudgetAnimation(ctx,target,animation); }
  return w;
}
export function wisp(ctx: FxCtx, from: Pt, to: Pt, delay: number, d = 800): void {
  if (perfOff('particles')) return;
  const w = mk(ctx, 'wisp', 0, 0);
  fly(ctx, w, curve(from, to, 0.25, 14), d, delay, { lift: 0.4 });
  if (ctx.rich) {
    for (let k = 1; k <= 3; k++) {
      const t = mk(ctx, 'wisp', 0, 0);
      t.style.transform = 'scale(.6)';
      A(ctx, t, curve(from, to, 0.25, 14).map((p, i, a) => ({ offset: i / (a.length - 1), opacity: i === a.length - 1 ? 0 : 0.35 / k, transform: `translate(${p.x}px,${p.y}px) scale(${0.7 - k * 0.12})` })), d, delay + k * 40, 'cubic-bezier(.3,0,.75,1)', 'forwards');
    }
  }
}

/** A projectile by its kind (planFx chooses the kind by the track, the source and the card's fx). */
export function projectile(ctx: FxCtx, kind: BallKind, big?: boolean): HTMLElement {
  if (kind === 'chain') return mk(ctx, 'chainshot', 0, 0, '<svg viewBox="0 0 30 14" width="30" height="14"><path d="M7 7 Q15 1 23 7" fill="none" stroke="#5a524b" stroke-width="1.6" stroke-dasharray="2 1.5"/><circle cx="6" cy="7" r="5" fill="#1E1A17"/><circle cx="24" cy="7" r="5" fill="#1E1A17"/></svg>');
  if (kind === 'grape') return mk(ctx, 'grape', 0, 0, '<svg viewBox="0 0 18 18" width="18" height="18"><g fill="#3a332d"><circle cx="5" cy="6" r="2.2"/><circle cx="11" cy="4" r="2"/><circle cx="14" cy="10" r="2.2"/><circle cx="8" cy="12" r="2.3"/><circle cx="4" cy="13" r="1.6"/><circle cx="10" cy="8" r="1.8"/></g></svg>');
  if (kind === 'keg') return mk(ctx, 'keg', 0, 0);
  const cls = ({ fire: ' fire', hot: ' hot', gold: ' gold', ghost: ' ghost', under: ' wet', flag: ' gold' } as Partial<Record<BallKind, string>>)[kind] || '';
  return mk(ctx, 'ball' + cls + (big ? ' big' : ''), 0, 0);
}
/** Powder leaves the Hold: the last n kegs flash and go empty. */
export function payKegs(ctx: FxCtx, side: Side, n: number, delay: number, label = true): void {
  if (!n) return;
  const kg = holdEl(ctx, side), kids = kg.querySelectorAll('[data-fx-keg]');
  const have = ctx.display.powder[side];
  for (let k = 0; k < n; k++) {
    const keg = kids[have - 1 - k];
    if (keg) A(ctx, keg, [{ transform: 'scale(1)', background: '#2a241d' }, { transform: 'scale(1.5)', background: '#F2913D', offset: 0.35 }, { transform: 'scale(1)', background: 'rgba(0,0,0,0)' }], 450, delay + 80 * k, 'ease-in', 'forwards');
  }
  if (label) holdTag(ctx, kg, `−${n} Порох`, delay, '', 1000);
}
/**
 * The mark of the Powder in the row of the team, to the LEFT of the kegs (on the label «Трюм»): above them it lay on
 * the planks of the bottom team, to the right of them is the text «· в руках …». Its right edge never reaches the kegs.
 */
export function holdTag(ctx: FxCtx, kg: Element, text: string, delay: number, cls = '', dur = 1500): HTMLElement {
  const kb = bx(ctx, kg), label = kg.parentElement?.querySelector('.hold-label');
  // A5 (V1c): the caption «Трюм … · N из 8» stands over the tray of kegs — the mark lies on the caption (tag keeps it inside)
  if (visible(label) && bx(ctx, label).b <= kb.y + 2) {
    const lb = bx(ctx, label);
    return clearOfRound(ctx, tag(ctx, lb.cx, lb.cy, text, delay, cls, dur));
  }
  const t = tag(ctx, label ? bx(ctx, label).cx : kb.x - 30, kb.cy, text, delay, cls, dur);
  const w = t.offsetWidth;
  t.style.left = Math.max(w / 2, Math.min(parseFloat(t.style.left), kb.x - 4 - w / 2)) + 'px';
  return clearOfRound(ctx, t);
}
/**
 * The tail of package 1: a mark of the top Hold never lies on the brass plate «Пираты · раунд» (on a phone the Hold is a
 * small keg right by it) — it moves to the right of the plate. `.tag` is centred on its left/top.
 */
function clearOfRound(ctx: FxCtx, t: HTMLElement): HTMLElement {
  const plate = ctx.board.querySelector('.status-turn');
  if (!visible(plate)) return t;
  const pb = bx(ctx, plate), w = t.offsetWidth, h = t.offsetHeight, x = parseFloat(t.style.left), y = parseFloat(t.style.top);
  const meets = y - h / 2 < pb.b && y + h / 2 > pb.y && x - w / 2 < pb.r + 4 && x + w / 2 > pb.x;
  if (meets) t.style.left = Math.min(boardW(ctx) - 8 - w / 2, pb.r + 6 + w / 2) + 'px';
  return t;
}
/** Kegs fly into the Hold. */
export function gainKegs(ctx: FxCtx, side: Side, n: number, from: Pt, delay: number, label = true): number {
  const kg = holdEl(ctx, side), kids = kg.querySelectorAll('[data-fx-keg]');
  const have = ctx.display.powder[side];
  for (let k = 0; k < n; k++) {
    const slot = kids[Math.min(kids.length - 1, have + k)], sb = bx(ctx, slot);
    const keg = mk(ctx, 'keg', 0, 0);
    fly(ctx, keg, curve({ x: from.x + (k - (n - 1) / 2) * 18, y: from.y }, { x: sb.cx, y: sb.cy }, 0.12), 520, delay + k * 130, { lift: 0.25 });
    at(ctx, delay + 520 + k * 130, () => {
      slot.classList.add('on');
      A(ctx, slot, [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], 250, 0);
    });
  }
  if (label && n) holdTag(ctx, kg, `+${n} Пороха`, delay + 300, 'plus', 1300);
  return delay + 520 + n * 130;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
/** The markup of a card as HandCard draws it in the hand (game: instead of the reference's hcardHTML). */
export function cardHTML(data: GameData, code: string): string {
  if (!code || code === HIDDEN) return `<div class="hcard back" data-fx-card="${HIDDEN}"></div>`;
  const c = cardByCode(data, code);
  const cost = c.soul > 0 ? `${c.soul} Д` : `${c.cost}`;
  return `<button class="hcard ${cardClass(c)}" tabindex="-1" data-fx-card="${esc(code)}"><span class="hcard-head"><span class="hcard-type">${esc(c.type)}</span><span class="cost">${esc(cost)}</span></span><span class="hcard-name">${esc(c.name)}</span><span class="hcard-big">${esc(c.big)}</span><span class="hcard-text">${esc(plainText(c.text))}</span></button>`;
}
/** The relative luminance of a colour «#rrggbb» (WCAG). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const INK_DARK = '#0f0d0b';
/** White or dark text on a colour: the one with the higher contrast. */
export const inkOn = (color: string) => (contrast(color, '#ffffff') >= contrast(color, INK_DARK) ? '#ffffff' : INK_DARK);

/** Who played the card: the bottom strip of the flying card («ГОЛЛАНДЕЦ», «ЛЕГЕНДА · МЕСТЬ»). */
export interface CardBy {
  ship: string;
  legend?: boolean;
}
/**
 * game: instead of the reference's ribbon under the card (its type — the card shows it already) the card has a bottom
 * strip of the colour of the ship that played it, with the ship's name, and a frame of 2 px of that colour (a Legend
 * keeps its gold frame). The strip's text is never under 10 px on screen: its size is set against the card's scale.
 */
export function footHTML(data: GameData, by: CardBy, scale: number): string {
  const sh = shipData(data, by.ship);
  const text = (by.legend ? `Легенда · ${sh.nick}` : sh.nick).toUpperCase();
  const font = Math.max(10.5, 10 / scale);
  return `<span class="fcard-foot" style="background:${sh.color};color:${inkOn(sh.color)};font-size:${(Math.ceil(font * 10) / 10).toFixed(1)}px">${esc(text)}</span>`;
}
/** A card flies (from the hand, from beyond the edge of the table, from the deck); `by` — the strip of who played it. */
export function flyCard(ctx: FxCtx, code: string, from: CardPos, to: CardPos, delay: number, d = 450, by?: CardBy): FlyCard {
  const inner = by
    ? `<div class="fcard${by.legend ? ' legend' : ''}" style="--by:${shipData(ctx.data, by.ship).color}">${cardHTML(ctx.data, code)}${footHTML(ctx.data, by, to.s || 0.72)}</div>`
    : `<div style="position:relative">${cardHTML(ctx.data, code)}</div>`;
  const el: FlyCard = mk(ctx, 'flyc', 0, 0, inner);
  A(ctx, el, [{ opacity: 1, transform: `translate(${from.x}px,${from.y}px) rotate(${from.r || 0}deg) scale(${from.s || 1})` }, { opacity: 1, transform: `translate(${to.x}px,${to.y}px) rotate(${to.r || 0}deg) scale(${to.s || 0.72})` }], d, delay, 'cubic-bezier(.2,.8,.3,1.1)', 'forwards');
  el._pos = to;
  return el;
}
export function moveTo(ctx: FxCtx, el: FlyCard, to: CardPos, d = 400): void {
  const f = el._pos || to;
  A(ctx, el, [{ transform: `translate(${f.x}px,${f.y}px) rotate(${f.r || 0}deg) scale(${f.s || 0.72})` }, { transform: `translate(${to.x}px,${to.y}px) rotate(${to.r || 0}deg) scale(${to.s || 0.72})` }], d, 0, 'cubic-bezier(.3,0,.2,1)', 'forwards');
  el._pos = to;
}
/**
 * V2: how a card lies in the fan of the hand — its unturned top left corner, its tilt and its scale — so a flying copy
 * starts (or lands) exactly as the card lies: the centre is the centre of its box, the size its own (offsetWidth/Height).
 */
export function handCardPos(ctx: FxCtx, el: HTMLElement): CardPos {
  const b = bx(ctx, el), cs = getComputedStyle(el);
  const r = parseFloat(cs.rotate) || 0, s = parseFloat(cs.scale) || 1;
  return { x: b.cx - el.offsetWidth / 2, y: b.cy - el.offsetHeight / 2, r, s };
}
/** Where a card flies from: an own one — from the hand (the card in the hand hides), another's — from beyond the edge over its ship. */
export function cardOrigin(ctx: FxCtx, code: string, ship: string): CardPos {
  const h = handCardEl(ctx, code);
  if (h && sideOf(ctx, ship) === ctx.bottom) {
    const pos = handCardPos(ctx, h);
    h.style.visibility = 'hidden';
    return pos;
  }
  // game: the hand is the real one — an own card just played is out of it already: it flies from the hand row.
  const row = ctx.board.querySelector('[data-fx-hand] .hand-cards');
  if (sideOf(ctx, ship) === ctx.bottom && visible(row)) {
    const b = bx(ctx, row);
    return { x: b.cx - 55, y: b.y, s: 1 };
  }
  const s = bx(ctx, plank(ctx, ship));
  return isTop(ctx, ship) ? { x: s.cx - 55, y: -150, r: -8, s: 1 } : { x: s.cx - 55, y: boardH(ctx) + 20, r: 8, s: 1 };
}
export function hint(ctx: FxCtx, text: string): void {
  ctx.hint(text);
}
export function pill(ctx: FxCtx, x: number, y: number, text: string, delay: number, cls = ''): HTMLElement {
  const pl = mk(ctx, 'pill ' + cls, 0, 0, text);
  // game: inside the table (see tag); it moves from +8 px to −12 px and grows to ×1.12
  const w0 = pl.offsetWidth, h0 = pl.offsetHeight, gw = w0 * 0.06, gh = h0 * 0.06; // ×1.12 around its centre
  x = inside(x - gw, w0 + 2 * gw, boardW(ctx)) + gw;
  y = Math.max(EDGE + 12 + gh, Math.min(boardH(ctx) - EDGE - h0 - gh - 8, y));
  A(ctx, pl, [{ opacity: 0, transform: `translate(${x}px,${y + 8}px) scale(.4)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1.12)`, offset: 0.18 }, { transform: `translate(${x}px,${y + 2}px) scale(1)`, offset: 0.32 }, { opacity: 1, offset: 0.82 }, { opacity: 0, transform: `translate(${x}px,${y - 12}px) scale(1)` }], 1500, delay);
  return pl;
}
/** A pill «−N» at the number of a track. */
export function pillAt(ctx: FxCtx, code: string, t: Track, n: number, delay: number, good = false): HTMLElement {
  const vb = bx(ctx, valueEl(ctx, code, t));
  return pill(ctx, Math.max(4, vb.x - 58), vb.cy - 20, `${good ? '+' : '−'}${n}`, delay, (good ? 'good' : '') + (n >= 4 ? ' huge' : ''));
}
/**
 * game (S1): a short mark at the number of a track («−1», «+2») and a blink of the track — instead of a label on or above
 * the plank in the clips of the start of a turn and of the sea. Short (0.7 s): it covers nothing for longer than a flash.
 */
export const MARK_MS = 700;
export function trackMark(ctx: FxCtx, code: string, t: Track, n: number, delay: number, good = false): HTMLElement {
  const num = valueEl(ctx, code, t);
  // the text of the number (the cell of the number is wider and its text is on the right)
  const range = document.createRange();
  range.selectNodeContents(num);
  const rr = range.getBoundingClientRect(), b = ctx.board.getBoundingClientRect(), k = stageK();
  const tx = rr.width > 0 ? (rr.left - b.left) / k : bx(ctx, num).x, ty = rr.height > 0 ? (rr.top - b.top + rr.height / 2) / k : bx(ctx, num).cy;
  return markAt(ctx, trackEl(ctx, code, t), tx, ty, `${good ? '+' : '−'}${n}`, delay, good);
}
/** The same mark at a badge (Souls): on its left. */
export function badgeMark(ctx: FxCtx, badge: Element, text: string, delay: number, good = false): HTMLElement {
  const bb = bx(ctx, badge);
  return markAt(ctx, badge, bb.x, bb.cy, text, delay, good);
}
function markAt(ctx: FxCtx, blink: Element, right: number, cy: number, text: string, delay: number, good: boolean): HTMLElement {
  const m = mk(ctx, 'tmark' + (good ? ' good' : ''), 0, 0, text);
  const w = m.offsetWidth, h = m.offsetHeight;
  const x = Math.max(EDGE, right - w - 3), y = cy - h / 2;
  A(ctx, m, [{ opacity: 0, transform: `translate(${x}px,${y + 4}px)` }, { opacity: 1, transform: `translate(${x}px,${y}px)`, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0, transform: `translate(${x}px,${y - 4}px)` }], MARK_MS, delay);
  const c = good ? 'rgba(47, 125, 74, 0.22)' : 'rgba(163, 52, 31, 0.2)';
  A(ctx, blink, [{ backgroundColor: 'transparent' }, { backgroundColor: c }, { backgroundColor: 'transparent' }, { backgroundColor: c }, { backgroundColor: 'transparent' }], MARK_MS, delay, 'linear', 'none');
  return m;
}
/**
 * Souls: a soul leaves the sailor of the enemy's Crew as a green wisp with a tail of sparks, curls over the sea and goes
 * into the skull of «Голландец»: a ring, sparks, the skull glows (the «souls» branch of runFx, template.html; T.soul). The
 * card and the Souls clips use it too. `mark` (L1, the rule of S1): a short mark «+N» at the badge instead of the label
 * over the plank. Gives the time it is over (the callers wait for it: the clip must not end with a soul in the air).
 */
export function soulsFly(ctx: FxCtx, fromShip: string, n: number, delay: number, mark = false): number {
  const keeper = ctx.data.ships.map((s) => s.code).find((x) => shipData(ctx.data, x).souls != null && !ctx.display.ships[x].sunk);
  if (!keeper) return delay;
  const badge = plank(ctx, keeper).querySelector<HTMLElement>('[data-fx-souls]');
  const to = badge && visible(badge) ? (() => { const b = bx(ctx, badge); return { x: b.cx, y: b.cy }; })() : (() => { const b = bx(ctx, plank(ctx, keeper)); return { x: b.r - 30, y: b.y + 30 }; })();
  const from = fxPoint(ctx, fromShip, 'crew', 0), F = T.soul, svg = fxSvg(ctx);
  const cells = trackEl(ctx, fromShip, 'crew').querySelector('.cells'), cell = visible(cells) ? cells.children[Math.max(0, shownTrack(ctx, fromShip, 'crew') - 1)] : null;
  if (cell) A(ctx, cell, [{ filter: 'none' }, { filter: 'drop-shadow(0 0 6px #7ff0b0) brightness(1.5)', offset: 0.3 }, { filter: 'none' }], 900, delay, 'ease-out', 'none');
  const swing = Math.min(160, boardW(ctx) * 0.14) * (from.x < to.x ? 1 : -1);
  const N = 40, path = qpts(from.x, from.y, (from.x + to.x) / 2 - swing, Math.min(from.y, to.y) + 60, to.x, to.y, N);
  for (let k = 0; k < n; k++) {
    const d0 = delay + k * 200;
    const glow = sv(svg, '<g><circle r="18" fill="#7ff0b0" opacity=".22"/><circle r="9" fill="#a8ffcc" opacity=".6"/><circle r="4.4" fill="#effff4"/><circle cx="-3" cy="-2" r="1.2" fill="#0f3a24"/><circle cx="3" cy="-2" r="1.2" fill="#0f3a24"/></g>');
    A(ctx, glow, path.map((p, i) => ({ transform: `translate(${R1(p.x)}px,${R1(p.y)}px)`, opacity: i === N ? 0 : 1 })), F.fly, d0, 'ease-in-out');
    for (let q = 1, m = room(ctx, 8); q <= m; q++) {
      const t = sv(svg, `<circle r="${R1(4 - q * 0.35)}" fill="#a8ffcc"/>`);
      A(ctx, t, path.map((p, i) => ({ transform: `translate(${R1(p.x)}px,${R1(p.y)}px)`, opacity: i === N ? 0 : R1(0.8 - q * 0.08) })), F.fly, d0 + q * 45, 'ease-in-out');
    }
  }
  const t1 = delay + (n - 1) * 200 + F.fly;
  ringSvg(ctx, svg, to.x, to.y, 3, 30, '#7ff0b0', 700, t1, 2.4);
  sparksSvg(ctx, svg, to.x, to.y, 14, t1, ['#effff4', '#a8ffcc', '#7ff0b0']);
  if (badge && visible(badge)) A(ctx, badge, [{ transform: 'scale(1)', filter: 'none' }, { transform: 'scale(1.5)', filter: 'drop-shadow(0 0 8px #7ff0b0) brightness(1.4)', offset: 0.4 }, { transform: 'scale(1)', filter: 'none' }], F.arrive, t1, 'ease-out', 'none');
  if (mark) { if (badge && visible(badge)) badgeMark(ctx, badge, `+${n}`, t1 - 100, true); }
  else tag(ctx, to.x, to.y - 16, `+${n} ${n === 1 ? 'Душа' : 'Души'}`, t1 - 100, 'good', 1200);
  return t1 + F.arrive;
}
export const FLAME_SVG = '<svg width="18" height="22" viewBox="0 0 14 17"><path d="M7 1 C9 5 13 7 12 11 C11.5 14.5 9 16 7 16 C4 16 2 14 2 11 C2 8.5 4 7.5 4.5 5 C5.5 7 6.5 7 7 6 C7.5 4.5 7 3 7 1Z" fill="#F2913D" stroke="#B23A2E" stroke-width="1"/><path d="M7 9 C8 10.5 9.5 11.5 9 13 C8.6 14.4 7.6 15 7 15 C5.8 15 5 14 5 12.8 C5 11.6 6.2 11 7 9Z" fill="#FFE08A"/></svg>';

/* ——— FX-D: the shot of A5 (ANIMATIONS.md §3.9; gunFire, smokeJet, ballFly, hitBlast, missSplash, waterColumn of
   docs/mockups/a5/fx/src/fx3.js and template.html). The pictures and the timings are the prototype's; what changed: they
   draw into an svg of the layer (the coordinates of the board), every time goes through A/at (the speed of the show,
   «Пауза», «До конца хода»), the particles are counted against the budget of the layer (room), «простые спецэффекты» draw
   no particles and no smoke. fx-phone restores the historical lighter phone particle counts; geometry follows the screen. ——— */
const NS = 'http://www.w3.org/2000/svg';
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const R1 = (v: number) => Math.round(v * 10) / 10;
/** Phone geometry and the historical lighter particle budget (fx-phone). */
export const isPhone = (ctx: FxCtx) => (geometrySteps.get(ctx.board)?.w ?? ctx.board.clientWidth) <= 700;
/** Heavy SVG filters are rich-laptop only; the phone retains gradients without blur/turbulence. */
// The phone keeps the particles and gradients, without SVG blur/filter surfaces.
export const filters = (ctx: FxCtx) => ctx.rich && !(ctx.narrow ?? ctx.board.ownerDocument.defaultView?.matchMedia('(max-width: 700px)').matches);

/** At most so many animations at once in the layer and the traces of the sea (TASKS.md: ~200; a margin for the ones
 *  every effect draws whatever the budget — a flash, a ball). */
export const FX_BUDGET = 190;
const budgetExempt = new WeakSet<Animation>();
interface Budget { animations: Map<Animation, Element>; seeded: WeakSet<FxCtx> }
const budgets = new WeakMap<HTMLElement, Budget>();
const elementAnimations = new WeakMap<Element, Set<Animation>>();
function budgetFor(ctx: FxCtx): Budget {
  let bank = budgets.get(ctx.board);
  if (!bank) { bank = {animations:new Map(),seeded:new WeakSet()}; budgets.set(ctx.board,bank); }
  return bank;
}
function trackBudgetAnimation(ctx: FxCtx, target: Element, animation: Animation): void {
  // A is also used by effects outside the canvas scope. Keep its native handles so that
  // an overlapping trace participates without another subtree traversal at every emission.
  const own = elementAnimations.get(target) ?? new Set<Animation>();
  for (const previous of own) if (previous.playState === 'idle') own.delete(previous);
  own.add(animation);
  elementAnimations.set(target,own);
  const bank = budgetFor(ctx);
  bank.animations.set(animation,target);
  void animation.finished.then(() => bank.animations.delete(animation), () => bank.animations.delete(animation));
}

/** This replaces brightness on an existing animation without taking another particle slot. */
export function ignoreFxBudget(animation:Animation):void { budgetExempt.add(animation); }
/** How many of `want` particles still fit into the budget (none with «простые спецэффекты»). */
export function room(ctx: FxCtx, want: number): number {
  if (!ctx.rich || perfOff('particles')) return 0;
  const scars = ctx.board.querySelector('.fx-scars');
  // the animations that run (or wait for their delay): a finished one only holds its last frame
  const running = (el: Element) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && !budgetExempt.has(a)).length;
  let native = 0;
  if (ctx.canvasParticles) {
    const bank = budgetFor(ctx);
    // Import CSS/direct WAAPI already present once per clip, rather than once per particle burst.
    if (!bank.seeded.has(ctx)) {
      bank.seeded.add(ctx);
      for (const root of [ctx.layer, scars]) if (root) for (const a of root.getAnimations({subtree:true})) {
        const target = (a.effect as KeyframeEffect | null)?.target;
        if (target) bank.animations.set(a,target);
      }
    }
    for (const [a,target] of bank.animations) {
      if (!target.isConnected || a.playState === 'finished' || a.playState === 'idle') { bank.animations.delete(a); continue; }
      if (a.playState === 'running' && !budgetExempt.has(a) && (ctx.layer.contains(target) || scars?.contains(target))) native++;
    }
  } else native = running(ctx.layer) + (scars ? running(scars) : 0);
  const busy = native + particleCount(ctx.board);
  const n = Math.max(0, Math.min(want, FX_BUDGET - busy));
  return isPhone(ctx) ? Math.ceil(n / 2) : n;
}

export const particleDefs = (rich: boolean) => `<defs>
<radialGradient id="fxSmk" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e9e5dc" stop-opacity=".92"/><stop offset=".8" stop-color="#c8c1b4" stop-opacity=".55"/><stop offset="1" stop-color="#a59d90" stop-opacity="0"/></radialGradient>
<radialGradient id="fxSmkD" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#8a847a"/><stop offset=".55" stop-color="#5e5850" stop-opacity=".85"/><stop offset="1" stop-color="#36322c" stop-opacity="0"/></radialGradient>
<radialGradient id="fxFire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff2b0"/><stop offset=".55" stop-color="#ffb347"/><stop offset=".8" stop-color="#e2561e" stop-opacity=".7"/><stop offset="1" stop-color="#8a2a0c" stop-opacity="0"/></radialGradient>
<linearGradient id="fxCone" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff0a8"/><stop offset=".6" stop-color="#ffa53c" stop-opacity=".85"/><stop offset="1" stop-color="#d9481a" stop-opacity="0"/></linearGradient>
<radialGradient id="fxGlow"><stop offset="0" stop-color="#ffc66a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc66a" stop-opacity="0"/></radialGradient>
${rich ? '<filter id="fxSmkF" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="22" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="2.8"/></filter>' : ''}</defs>`;

/** An svg over the whole board (its coordinates) in the layer — or in another host (the traces of the sea, .fx-scars). */
export function fxSvg(ctx: FxCtx, host: Element = ctx.layer): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('width', String(boardW(ctx)));
  s.setAttribute('height', String(boardH(ctx)));
  s.setAttribute('class', 'fx-svg');
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;opacity:1';
  s.innerHTML = particleDefs(filters(ctx));
  host.appendChild(s);
  return s;
}
/** FX-B: an svg on the sea under the planks (in .fx-scars) for the time of a clip — the line of the Armada, the dark of
 *  the deep. Not a trace: the layer takes it away at the end of the clip and on «Сразу итог» (FxLayer.tsx); a clip
 *  that wants it to stay as a trace takes the class off and calls scar(). */
export function seaTemp(ctx: FxCtx): SVGSVGElement {
  const s = fxSvg(ctx, ctx.board.querySelector('.fx-scars') ?? ctx.layer);
  s.classList.add('fx-temp');
  return s;
}
/** Adds svg markup to a parent and gives its first element. */
export function sv(parent: Element, markup: string): SVGElement {
  const g = document.createElementNS(NS, 'g');
  g.innerHTML = markup;
  parent.appendChild(g);
  return (g.firstElementChild as SVGElement | null) ?? g;
}
function particleSvg(parent: Element, markup: string): SVGElement {
  const el = sv(parent, markup);
  if (getPerf().enabled) el.setAttribute('data-perf-particle', '');
  return el;
}

/** Static small SVG leaf -> one reusable offscreen raster, no native animation. */
export function particleShape(ctx: FxCtx,host: Element,markup: string,kind='particle'): SVGElement | ParticleTarget {
  return canvasShape(ctx,host,markup,kind) ?? particleSvg(host,markup);
}

/** Same solid-circle art; other producers retain their original DOM circles. */
export function particleCircle(ctx: FxCtx, host: Element, r: number, color: string, kind = 'spark', alpha = 1): SVGElement | ParticleTarget {
  return canvasCircle(ctx, host, r, color, kind, alpha) ?? particleSvg(host, `<circle${kind === 'ember' ? ' class="ember"' : ''} r="${r}" fill="${color}" opacity="${alpha}"/>`);
}

/** The points of a quadratic curve (qpts of the prototype). */
export function qpts(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n = 24): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
  });
}

/** A ring on the water that spreads and fades. */
export function ringSvg(ctx: FxCtx, svg: Element, x: number, y: number, r0: number, r1: number, color = '#eef6f8', d = 700, delay = 0, w = 2): SVGElement | null {
  if (perfOff('particles')) return null;
  // a size, never a direction: a radius computed as «base − i·step» on a narrow plank must not go negative
  r1 = Math.max(1, Math.abs(r1));
  const canvas = canvasRing(ctx, svg, R1(r1), R1((r0 / r1) * 100) / 100, color, w);
  if (canvas) {
    A(ctx, canvas, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(${R1((r0 / r1) * 100) / 100})`, opacity: 1 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 0 }], d, delay, 'ease-out');
    return null;
  }
  const g = particleSvg(svg, `<g><ellipse cx="0" cy="0" rx="${R1(r1)}" ry="${R1(r1 * 0.4)}" fill="none" stroke="${color}" stroke-width="${w}" vector-effect="non-scaling-stroke"/></g>`);
  A(ctx, g, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(${R1((r0 / r1) * 100) / 100})`, opacity: 1 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 0 }], d, delay, 'ease-out');
  return g;
}
export function sparksSvg(ctx: FxCtx, svg: Element, x: number, y: number, n = 12, delay = 0, colors = ['#fff3c4', '#ffd27a', '#ff9a3c']): void {
  for (let i = 0, m = room(ctx, n); i < m; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(14, 38);
    const c = particleCircle(ctx, svg, R1(rnd(1, 2.2)), colors[i % colors.length]);
    A(ctx, c, [{ transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 1 }, { transform: `translate(${R1(x + Math.cos(a) * r)}px,${R1(y + Math.sin(a) * r + 10)}px)`, opacity: 0 }], rnd(380, 700), delay, 'cubic-bezier(.2,.7,.4,1)');
  }
}
export function splintersSvg(ctx: FxCtx, svg: Element, x: number, y: number, n = 8, delay = 0): void {
  for (let i = 0, m = room(ctx, n); i < m; i++) {
    const a = rnd(-Math.PI, 0), r = rnd(18, 46), rot = rnd(-400, 400);
    const c = particleShape(ctx, svg, `<rect x="-3.4" y="-1.1" width="${R1(rnd(4, 8))}" height="2.2" rx=".6" fill="${i % 2 ? '#a8703a' : '#7a4f24'}" stroke="#3a2412" stroke-width=".4"/>`);
    A(ctx, c, [{ transform: `translate(${R1(x)}px,${R1(y)}px) rotate(0deg)`, opacity: 1 }, { transform: `translate(${R1(x + Math.cos(a) * r)}px,${R1(y + Math.sin(a) * r)}px) rotate(${R1(rot * 0.5)}deg)`, opacity: 1, offset: 0.4 }, { transform: `translate(${R1(x + Math.cos(a) * r * 1.3)}px,${R1(y + 60)}px) rotate(${R1(rot)}deg)`, opacity: 0 }], rnd(800, 1200), delay, 'cubic-bezier(.3,.1,.7,1)');
  }
}

/** A jet of powder smoke: puffs fly out along the shot, slow down, grow and drift downwind (smokeJet). */
export function smokeJet(ctx: FxCtx, svg: Element, x: number, y: number, ang: number, k = 1, n = 9, life = 5600, delay = 0, darkAll = false): void {
  const m = room(ctx, n);
  if (!m) return;
  const wind = [26, -10], host = particleSvg(svg, '<g/>');
  if (filters(ctx)) host.setAttribute('filter', 'url(#fxSmkF)');
  for (let i = 0; i < m; i++) {
    const t = i / m, dist = (18 + t * 70) * k, a = ang + rnd(-0.35, 0.35), r0 = (5 + t * 4) * k, r1 = (16 + t * 22 + rnd(0, 10)) * k;
    const ex = x + Math.cos(a) * dist, ey = y + Math.sin(a) * dist, dark = darkAll ? i % 3 !== 2 : i % 4 === 3;
    const c = canvasSmoke(ctx, host, R1(r1), dark, filters(ctx), life<=1000?'powder-smoke':'smoke') ?? sv(host, `<circle r="${R1(r1)}" fill="url(#${dark ? 'fxSmkD' : 'fxSmk'})"/>`);
    A(ctx, c, [
      { transform: `translate(${R1(x)}px,${R1(y)}px) scale(${R1((r0 / r1) * 100) / 100})`, opacity: 0 },
      { transform: `translate(${R1(x + (ex - x) * 0.7)}px,${R1(y + (ey - y) * 0.7)}px) scale(.7)`, opacity: dark ? 0.5 : 0.85, offset: 0.04 },
      { transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1)`, opacity: dark ? 0.5 : 0.9, offset: 0.14 },
      { transform: `translate(${R1(ex + wind[0] * 0.5 * k)}px,${R1(ey + wind[1] * 0.5 * k)}px) scale(1.25)`, opacity: dark ? 0.35 : 0.7, offset: 0.5 },
      { transform: `translate(${R1(ex + wind[0] * 1.6 * k)}px,${R1(ey + wind[1] * 1.6 * k)}px) scale(1.7)`, opacity: 0 },
    ], life * rnd(0.8, 1.15), delay + 90 + i * 18, 'cubic-bezier(.1,.8,.3,1)');
  }
}

/**
 * The flash of a gun: the light on the sea, a cone of fire with a white core and side tongues, a shockwave, burning grains,
 * a jet of powder smoke (into `smoke` — a trace of the sea, it outlives the clip), the ripple under the muzzle, scraps of
 * wadding; a beat later a second, smaller puff. `ang` — the direction of the shot (radians); `flash` — its length.
 */
export function gunFire(ctx: FxCtx, svg: Element, smoke: Element | null, x: number, y: number, ang: number, k = 1, delay = 0, opt: { grains?: number; puffs?: number; wads?: number; life?: number; flash?: number; smokeJet?: typeof smokeJet } = {}): void {
  const deg = (ang * 180) / Math.PI, fl = opt.flash ?? 420;
  const glow = shotSprite(ctx,svg,'glow',k) ?? sv(svg,shotArt('glow',k));
  shotA(ctx, glow, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(.4)`, opacity: 1 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1.2)`, opacity: 0 }], fl * 1.25, delay);
  const cone = shotSprite(ctx,svg,'cone',k) ?? sv(svg,shotArt('cone',k));
  const at0 = `translate(${R1(x)}px,${R1(y)}px) rotate(${R1(deg)}deg)`;
  shotA(ctx, cone, [{ transform: `${at0} scale(.15,.4)`, opacity: 1 }, { transform: `${at0} scale(1.15,1)`, opacity: 1, offset: 0.22 }, { transform: `${at0} scale(1.3,.7)`, opacity: 0.6, offset: 0.5 }, { transform: `${at0} scale(1.4,.3)`, opacity: 0 }], fl, delay, 'cubic-bezier(.1,.9,.3,1)');
  if (!perfOff('particles')) {
  const sw = particleShape(ctx, svg, `<circle r="${R1(60 * k)}" fill="none" stroke="#fff6e0" stroke-width="${R1(2.4 * k)}"/>`);
  A(ctx, sw, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(.05)`, opacity: 0.9 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 0 }], fl * 0.86, delay, 'cubic-bezier(.1,.8,.3,1)');
  }
  for (let i = 0, m = room(ctx, opt.grains ?? 9); i < m; i++) {
    const a = ang + rnd(-0.5, 0.5), v = rnd(30, 80) * k;
    const g = particleCircle(ctx, svg, R1(rnd(0.8, 1.8) * k), ['#fff3c4', '#ffd27a', '#ff9a3c'][i % 3]);
    A(ctx, g, [{ transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 1 }, { transform: `translate(${R1(x + Math.cos(a) * v * 0.6)}px,${R1(y + Math.sin(a) * v * 0.6)}px)`, opacity: 1, offset: 0.5 }, { transform: `translate(${R1(x + Math.cos(a) * v)}px,${R1(y + Math.sin(a) * v + 14 * k)}px)`, opacity: 0 }], rnd(400, 700), delay, 'ease-out');
  }
  if (smoke) {
    (opt.smokeJet ?? smokeJet)(ctx, smoke, x, y, ang, k, opt.puffs ?? 9, opt.life ?? 5600, delay);
    (opt.smokeJet ?? smokeJet)(ctx, smoke, x, y, ang, k * 0.6, 3, (opt.life ?? 5600) * 0.8, delay + 260);
  }
  if (!perfOff('particles')) {
  const rp = particleShape(ctx, svg, `<ellipse rx="${R1(40 * k)}" ry="${R1(12 * k)}" fill="none" stroke="#eef6f8" stroke-width="${R1(1.6 * k)}"/>`);
  A(ctx, rp, [{ transform: `translate(${R1(x)}px,${R1(y + 6 * k)}px) scale(.1)`, opacity: 0.9 }, { transform: `translate(${R1(x)}px,${R1(y + 6 * k)}px) scale(1)`, opacity: 0 }], 700, delay + 40, 'cubic-bezier(.1,.8,.3,1)');
  }
  for (let i = 0, m = room(ctx, opt.wads ?? 4); i < m; i++) {
    const a = ang + rnd(-0.4, 0.4), v = rnd(24, 60) * k;
    const wd = particleShape(ctx, svg, '<path d="M-1.4 -1 L1.6 -.6 L1 1.2 L-1.2 .8 Z" fill="#ffb347" stroke="#7a2a0c" stroke-width=".3"/>');
    A(ctx, wd, [{ transform: `translate(${R1(x)}px,${R1(y)}px) rotate(0deg)`, opacity: 1, fill: '#ffe08a' }, { transform: `translate(${R1(x + Math.cos(a) * v)}px,${R1(y + Math.sin(a) * v)}px) rotate(${R1(rnd(-200, 200))}deg)`, opacity: 1, fill: '#ff8a2a', offset: 0.4 }, { transform: `translate(${R1(x + Math.cos(a) * v * 1.2 + rnd(-10, 10))}px,${R1(y + Math.sin(a) * v + 26 * k)}px) rotate(${R1(rnd(-500, 500))}deg)`, opacity: 0, fill: '#3a2a1c' }], rnd(1400, 2200), delay + 60, 'ease-out');
  }
}

/** The fuses: sparks spit at each gun a moment before the broadside. */
export function fuseSparks(ctx: FxCtx, svg: Element, x: number, y: number, up: number, delay = 0, d = 260): void {
  for (let k = 0, m = room(ctx, 5); k < m; k++) {
    const sp = particleCircle(ctx, svg, 1.3, '#ffe08a');
    A(ctx, sp, [{ transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 1 }, { transform: `translate(${R1(x + rnd(-8, 8))}px,${R1(y + up * rnd(6, 14))}px)`, opacity: 0 }], d, delay + k * 50);
  }
}

/**
 * The cannonball: a dark iron ball with a highlight, a thin smoke trail, its shadow on the sea; it flies almost straight
 * (a light arc, `lift` px up on the screen). It goes out at the end. The ball is `.ball` (e2e waits for one in the layer).
 */
export function ballFly(ctx: FxCtx, svg: Element, p0: Pt, p1: Pt, d = 700, delay = 0, lift = 20): void {
  const N = 28, pts = qpts(p0.x, p0.y, (p0.x + p1.x) / 2, Math.min(p0.y, p1.y) - lift, p1.x, p1.y, N);
  const path = (sc: (i: number) => string) => pts.map((p, i) => ({ transform: `translate(${R1(p.x)}px,${R1(p.y)}px)${sc(i)}`, opacity: i === N ? 0 : 1 }));
  for (let i = 1, m = room(ctx, 7); i <= m; i++) {
    const t = particleCircle(ctx, svg, R1(3.6 - i * 0.35), '#cfc8bc', 'trail', R1(0.5 - i * 0.06));
    A(ctx, t, path(() => ''), d, delay + i * 22, 'linear');
  }
  const shadow = shotSprite(ctx,svg,'shadow') ?? sv(svg,shotArt('shadow'));
  shotA(ctx, shadow, pts.map((_, i) => { const t = i / N; return { transform: `translate(${R1(p0.x + (p1.x - p0.x) * t)}px,${R1(p0.y + (p1.y - p0.y) * t + 8)}px) scale(${R1(1 - Math.sin(Math.PI * t) * 0.5)})`, opacity: i === N ? 0 : 1 }; }), d, delay, 'linear');
  const ball = shotSprite(ctx,svg,'ball') ?? sv(svg,shotArt('ball'));
  shotA(ctx, ball, path((i) => ` scale(${R1(1 + Math.sin((Math.PI * i) / N) * 0.15)})`), d, delay, 'linear');
}

/** A real splash: a hole in the water, a heavy column with a torn top, a crown of jets with drops, mist, foam, rings. */
export function waterColumn(ctx: FxCtx, svg: Element, x: number, y: number, h = 46, delay = 0, d = 1700): void {
  if (perfOff('particles')) return;
  const k = h / 46, root = particleSvg(svg, '<g/>'), P = (a: number, b: number) => `${R1(a)} ${R1(b)}`, X = R1(x), Y = R1(y);
  const hole = particleShape(ctx, root, `<ellipse rx="${R1(12 * k)}" ry="${R1(3.6 * k)}" fill="#0c2a36" opacity=".55"/>`);
  A(ctx, hole, [{ transform: `translate(${X}px,${Y}px) scale(.2)`, opacity: 0.6 }, { transform: `translate(${X}px,${Y}px) scale(1.2)`, opacity: 0.4, offset: 0.3 }, { transform: `translate(${X}px,${Y}px) scale(1.6)`, opacity: 0 }], d * 0.76, delay);
  const bw = 9 * k, bh = h * 0.7;
  const body = particleShape(ctx, root, `<g><path d="M${P(-bw, 0)} C${P(-bw * 1.1, -bh * 0.5)} ${P(-bw * 0.7, -bh * 0.9)} ${P(-bw * 0.3, -bh)} Q${P(-bw * 0.1, -bh * 1.08)} ${P(0, -bh * 0.98)} Q${P(bw * 0.2, -bh * 1.1)} ${P(bw * 0.4, -bh * 0.96)} C${P(bw * 0.8, -bh * 0.85)} ${P(bw * 1.1, -bh * 0.5)} ${P(bw, 0)} Z" fill="#d6ebf0"/><path d="M${P(-bw * 0.5, -2)} C${P(-bw * 0.6, -bh * 0.4)} ${P(-bw * 0.4, -bh * 0.7)} ${P(-bw * 0.2, -bh * 0.9)}" fill="none" stroke="#fff" stroke-width="${R1(1.6 * k)}" stroke-linecap="round" opacity=".9"/></g>`);
  A(ctx, body, [{ transform: `translate(${X}px,${Y}px) scale(.5,.05)`, opacity: 1 }, { transform: `translate(${X}px,${Y}px) scale(1,1)`, opacity: 1, offset: 0.25 }, { transform: `translate(${X}px,${Y}px) scale(1.1,.95)`, opacity: 0.95, offset: 0.5 }, { transform: `translate(${X}px,${R1(y + 2)}px) scale(1.5,.05)`, opacity: 0 }], d, delay, 'cubic-bezier(.15,.7,.4,1)');
  // the crown: the middle jets tall, the outer ones low and wide (9 in the prototype; fewer when the budget is short)
  const JETS: [number, number, number][] = [[0, 1, 6.4], [-0.14, 0.88, 5.2], [0.14, 0.92, 5.2], [-0.36, 0.62, 4.6], [0.36, 0.64, 4.6], [-0.68, 0.4, 3.8], [0.68, 0.42, 3.8], [-1, 0.24, 3], [1, 0.26, 3]];
  const nj = ctx.rich ? Math.max(3, room(ctx, isPhone(ctx) ? 5 : 9)) : 0;
  JETS.slice(0, nj).forEach(([a, hh, w], i) => {
    const L = h * hh * rnd(0.85, 1.1), tx = Math.sin(a) * L, ty = -Math.cos(a) * L, ww = w * k, bend = rnd(-3, 3) * k;
    const dd = `M${P(-ww, 0)} C${P(-ww * 0.8 + tx * 0.3 + bend, ty * 0.35)} ${P(tx * 0.8 - ww * 0.3, ty * 0.8)} ${P(tx, ty)} C${P(tx * 0.8 + ww * 0.3, ty * 0.8)} ${P(ww * 0.8 + tx * 0.3 + bend, ty * 0.35)} ${P(ww, 0)} Z`;
    const j = particleShape(ctx, root, `<g><path d="${dd}" fill="#e8f4f6" opacity=".92"/><path d="${dd}" fill="none" stroke="#9cc4cc" stroke-width=".7" opacity=".7"/><circle cx="${R1(tx)}" cy="${R1(ty - ww * 0.6)}" r="${R1(0.3 * ww)}" fill="#eef7f9"/></g>`);
    A(ctx, j, [{ transform: `translate(${X}px,${Y}px) scale(.6,.05)`, opacity: 1 }, { transform: `translate(${X}px,${Y}px) scale(1,1.05)`, opacity: 1, offset: 0.24 }, { transform: `translate(${X}px,${Y}px) scale(1.08,1)`, opacity: 0.95, offset: 0.48 }, { transform: `translate(${X}px,${Y}px) scale(1.25,.55)`, opacity: 0.8, offset: 0.75 }, { transform: `translate(${X}px,${R1(y + 2)}px) scale(1.45,.06)`, opacity: 0 }], d * 0.97 + i * 30, delay + i * 18, 'cubic-bezier(.15,.7,.4,1)');
    // the tip breaks into a drop that arcs out and falls back with a ring
    if (room(ctx, 1)) {
      const dx = tx * rnd(1, 1.6) + rnd(-6, 6) * k, peak = y + ty * rnd(1.02, 1.2), r = R1(rnd(1, 2.2) * k), ex = x + dx * 1.5;
      const dr = particleShape(ctx, root, `<ellipse rx="${r}" ry="${R1(r * 1.3)}" fill="#eef6f8" stroke="#9cc4cc" stroke-width=".3"/>`);
      A(ctx, dr, [{ transform: `translate(${R1(x + tx * 0.9)}px,${R1(y + ty * 0.9)}px)`, opacity: 0 }, { transform: `translate(${R1(x + dx)}px,${R1(peak)}px)`, opacity: 1, offset: 0.35 }, { transform: `translate(${R1(ex)}px,${R1(y + 2)}px)`, opacity: 0.9, offset: 0.97 }, { transform: `translate(${R1(ex)}px,${R1(y + 2)}px)`, opacity: 0 }], rnd(900, 1250), delay + 260 + i * 20, 'cubic-bezier(.3,0,.7,1)');
      ringSvg(ctx, root, ex, y + 3, 1, 7 * k, '#eef6f8', 500, delay + 1150 + i * 20, 0.8);
    }
  });
  // mist hangs over the column and drifts (blurred only where the filters are)
  for (let i = 0, m = room(ctx, 4); i < m; i++) {
    const mm = particleShape(ctx, root, `<circle r="${R1(rnd(8, 13) * k)}" fill="#f4fafb" opacity=".5"${filters(ctx) ? ` style="filter:blur(${R1(3 * k)}px)"` : ''}/>`);
    A(ctx, mm, [{ transform: `translate(${X}px,${R1(y - h * 0.6)}px) scale(.3)`, opacity: 0 }, { transform: `translate(${R1(x + rnd(-8, 8) * k)}px,${R1(y - h * rnd(0.75, 1))}px) scale(1)`, opacity: 0.55, offset: 0.3 }, { transform: `translate(${R1(x + rnd(10, 22) * k)}px,${R1(y - h * rnd(0.6, 0.9))}px) scale(1.5)`, opacity: 0 }], d, delay + 200 + i * 60, 'ease-out');
  }
  const foam = particleShape(ctx, root, `<g><ellipse rx="${R1(16 * k)}" ry="${R1(4.4 * k)}" fill="#f4fafb" opacity=".85"/><ellipse rx="${R1(22 * k)}" ry="${R1(6 * k)}" fill="none" stroke="#f4fafb" stroke-width="${R1(1.2 * k)}" stroke-dasharray="${R1(3 * k)} ${R1(2 * k)}" opacity=".8"/></g>`);
  A(ctx, foam, [{ transform: `translate(${X}px,${R1(y + 1)}px) scale(.2)`, opacity: 0.9 }, { transform: `translate(${X}px,${R1(y + 1)}px) scale(1)`, opacity: 0.9, offset: 0.35 }, { transform: `translate(${X}px,${R1(y + 1)}px) scale(1.35)`, opacity: 0 }], d * 1.3, delay + 120, 'ease-out');
  ringSvg(ctx, svg, x, y + 2, 4, 30 * k, '#eef6f8', 900, delay + 120, 1.6);
  ringSvg(ctx, svg, x, y + 2, 4, 52 * k, '#cfe4ea', 1400, delay + 380, 1);
}
/** The miss: two spouts of water and a ring of foam. */
export function missSplash(ctx: FxCtx, svg: Element, x: number, y: number, k = 1, delay = 0, d = 1700): void {
  if (perfOff('particles')) return;
  waterColumn(ctx, svg, x, y, 70 * k, delay, d);
  if (ctx.rich) waterColumn(ctx, svg, x + 9 * k, y + 2, 40 * k, delay, d);
  const f = particleShape(ctx, svg, `<ellipse rx="${R1(24 * k)}" ry="${R1(7 * k)}" fill="#f4f9fa" opacity=".85"/>`);
  A(ctx, f, [{ transform: `translate(${R1(x)}px,${R1(y + 2)}px) scale(.2)`, opacity: 0.9 }, { transform: `translate(${R1(x)}px,${R1(y + 2)}px) scale(1.4)`, opacity: 0 }], d * 0.82, delay + 100, 'ease-out');
}
/** The hit: a fireball, a shockwave, splinters and sparks, black smoke rolling up (a lighter one for the later hits). */
export function hitBlast(ctx: FxCtx, svg: Element, x: number, y: number, k = 1, delay = 0, d = 520, light = false): void {
  const fb = shotSprite(ctx,svg,'blast',k) ?? sv(svg,shotArt('blast',k));
  shotA(ctx, fb, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(.1)`, opacity: 1 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 1, offset: 0.25 }, { transform: `translate(${R1(x)}px,${R1(y - 6 * k)}px) scale(1.25)`, opacity: 0 }], d, delay, 'cubic-bezier(.1,.8,.3,1)');
  const sw = shotSprite(ctx,svg,'shock',k) ?? sv(svg,shotArt('shock',k));
  shotA(ctx, sw, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(.05)`, opacity: 1 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 0 }], d * 0.8, delay, 'cubic-bezier(.1,.8,.3,1)');
  splintersSvg(ctx, svg, x, y, Math.round((light ? 5 : 12) * k), delay);
  sparksSvg(ctx, svg, x, y, Math.round((light ? 6 : 16) * k), delay);
  for (let i = 0, m = room(ctx, light ? 2 : 6); i < m; i++) {
    const c = particleShape(ctx, svg, `<circle r="${R1(rnd(10, 18) * k)}" fill="url(#fxSmkD)"/>`, 'smoke'), dx = rnd(-14, 14) * k;
    A(ctx, c, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(.2)`, opacity: 0 }, { transform: `translate(${R1(x + dx)}px,${R1(y - 10 * k)}px) scale(1)`, opacity: 0.8, offset: 0.15 }, { transform: `translate(${R1(x + dx + 24 * k)}px,${R1(y - rnd(50, 80) * k)}px) scale(1.8)`, opacity: 0 }], rnd(2400, 3400), delay + 120 + i * 60, 'ease-out');
  }
}
/** The whole table feels the broadside: the sea in its frame shakes (the hand and the log stay still). */
export function boom(ctx: FxCtx, amp = 4, d = 320, delay = 0): void {
  const el = ctx.board.querySelector('.sea-table') ?? ctx.board;
  A(ctx, el, [{ translate: '0 0' }, { translate: `${-amp}px ${amp * 0.4}px` }, { translate: `${amp}px ${-amp * 0.3}px` }, { translate: `${-amp * 0.6}px 0` }, { translate: `${amp * 0.4}px ${amp * 0.2}px` }, { translate: '0 0' }], d, delay, 'linear', 'none');
}
/** A flash of the whole table (warm after a gun, white after a hit). */
export function flashBoard(ctx: FxCtx, color = '#fff', peak = 0.55, d = 520, delay = 0): void {
  const f = mk(ctx, 'fx-flash-board', 0, 0);
  f.style.cssText += `;width:100%;height:100%;background:${color}`;
  A(ctx, f, [{ opacity: 0 }, { opacity: peak, offset: 0.08 }, { opacity: 0, offset: 0.3 }, { opacity: peak * 0.6, offset: 0.42 }, { opacity: 0 }], d, delay, 'linear');
}
/**
 * A board of the Hull broken off by a hit falls into the sea by the target (on the side of the gap), splashes and stays
 * afloat a while, rocking (a long trace of the sea; it rocks — SMIL — only where the filters are).
 */
export function fallBoard(ctx: FxCtx, svg: Element, code: string, p: Pt, delay = 0, d = 1000): void {
  if (perfOff('particles')) return;
  const to = { x: clamp(p.x + 40, 20, boardW(ctx) - 20), y: clamp(facingY(ctx, code) + dirOf(ctx, code) * 34, 20, boardH(ctx) - 20) };
  const bd = particleShape(ctx, svg, '<g><rect x="-9" y="-2.6" width="18" height="5.2" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.6 V2.6 M3 -2.6 V2.6" stroke="#6b4422" stroke-width=".6"/></g>');
  A(ctx, bd, [{ transform: `translate(${R1(p.x)}px,${R1(p.y)}px) rotate(0deg)` }, { transform: `translate(${R1(p.x + 12)}px,${R1(p.y - 16)}px) rotate(40deg)`, offset: 0.2 }, { transform: `translate(${R1(to.x)}px,${R1(to.y)}px) rotate(170deg)`, opacity: 1, offset: 0.98 }, { transform: `translate(${R1(to.x)}px,${R1(to.y)}px) rotate(170deg)`, opacity: 0 }], d, delay, 'cubic-bezier(.3,.1,.7,1)');
  at(ctx, delay + d, () => {
    waterColumn(ctx, svg, to.x, to.y, 22);
    const host = ctx.board.querySelector('.fx-scars');
    if (!host) return;
    if(floatBoardSprite(ctx,host,code,to,filters(ctx)))return;
    const deb = fxSvg(ctx, host);
    const rock = filters(ctx) ? '<animateTransform attributeName="transform" type="rotate" values="-8;8;-8" dur="3.2s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 2;0 0" dur="2.4s" additive="sum" repeatCount="indefinite"/>' : '';
    sv(deb, `<g transform="translate(${R1(to.x)} ${R1(to.y)}) scale(1.4)"><g>${rock}<ellipse cx="0" cy="3" rx="13" ry="3" fill="none" stroke="#e6f2f4" stroke-width="1" opacity=".7"/><rect x="-9" y="-2.6" width="18" height="5.2" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.6 V2.6 M3 -2.6 V2.6" stroke="#6b4422" stroke-width=".6"/><path d="M9 -2.6 l2 1 l-2 1.2 l2 1.4" fill="none" stroke="#3a2412" stroke-width=".6"/></g></g>`);
    scar(deb, 'long', code);
  });
}

/* ——— FX-D: the fire of A5 (fireWall, flameAt, smokeColumn of the prototype; ANIMATIONS.md §3.6, §4) ——— */
/** A flame element `h` px tall standing at (x, y) of its host (the layer, or a trace inside a plank). */
export function flameEl(ctx: FxCtx, x: number, y: number, h = 22, cls = 'fx-flame'): HTMLElement {
  const f = document.createElement('div');
  f.className = cls;
  f.style.left = `${R1(x - h * 0.35)}px`;
  f.style.top = `${R1(y - h)}px`;
  f.innerHTML = FLAME(h, filters(ctx));
  return f;
}
/**
 * A wall of fire along a line: a bed of embers that breathes, clumps of strong flames with lower ones between them, low
 * tongues in the gaps, embers flying up (`.ember`). «Простые»: the clumps only, no gaps, no embers. Gives the flames.
 */
export function fireWall(ctx: FxCtx, svg: Element, x0: number, x1: number, y: number, h = 34, opt: { delay?: number; spread?: number; clump?: number; embers?: number; life?: number; host?: Element } = {}): HTMLElement[] {
  const out: HTMLElement[] = [], delay = opt.delay ?? 0, spread = opt.spread ?? 40, life = opt.life ?? 3000;
  const bed = sv(svg, `<g><ellipse cx="${R1((x0 + x1) / 2)}" cy="${R1(y)}" rx="${R1((x1 - x0) / 2 + 10)}" ry="${R1(h * 0.32)}" fill="url(#fxGlow)"/><path d="M${R1(x0)} ${R1(y + 1)} H${R1(x1)}" stroke="#ffb347" stroke-width="${R1(h * 0.1)}" stroke-linecap="round" opacity=".55"${filters(ctx) ? ' style="filter:blur(2px)"' : ''}/></g>`);
  A(ctx, bed, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.75, offset: 0.45 }, { opacity: 1, offset: 0.7 }, { opacity: 0.85 }], life, delay);
  const span = Math.max(1, x1 - x0), nC = Math.max(1, Math.round(span / (opt.clump ?? 70)));
  const add = (x: number, yy: number, hh: number, op: number, tilt: number, at0: number) => {
    const fl = flameEl(ctx, x, yy, hh);
    fl.style.rotate = `${R1(tilt)}deg`;
    (opt.host ?? ctx.layer).appendChild(fl);
    A(ctx, fl, [{ transform: 'scaleY(.05)', opacity: 0 }, { transform: 'scaleY(1.2)', opacity: op, offset: 0.35 }, { transform: 'scaleY(1)', opacity: op }], 420, at0);
    out.push(fl);
  };
  for (let c = 0; c < nC; c++) {
    const cx = x0 + (span * (c + 0.5)) / nC + rnd(-10, 10), big = rnd(0.85, 1.25);
    const parts: [number, number, number][] = [[0, 2.1 * big, 0.78], [-9, 1.4 * big, 0.85], [9, 1.5 * big, 0.85], [-17, 0.8, 0.9], [17, 0.9, 0.9], [-4, 0.7, 1], [5, 0.6, 1]];
    parts.slice(0, ctx.rich ? 1 + Math.floor(room(ctx, 12) / 2) : 3).forEach(([dx, hk, op], k) => add(cx + dx + rnd(-3, 3), y + 2 + (k > 4 ? 1 : 0), h * hk * rnd(0.85, 1.1), op, rnd(4, 11), delay + c * spread * 2 + k * 30));
  }
  if (ctx.rich) for (let x = x0; x <= x1; x += 9) { if (Math.random() < 0.4 || room(ctx, 2) < 2) continue; add(x, y + 3, h * rnd(0.3, 0.55), 0.9, rnd(6, 14), delay + ((x - x0) / span) * spread * nC * 2); }
  for (let i = 0, m = room(ctx, opt.embers ?? 30); i < m; i++) {
    const e = particleCircle(ctx, svg, R1(rnd(0.8, 1.9)), ['#fff3c4', '#ffd27a', '#ff8a2a'][i % 3], 'ember'), x = rnd(x0, x1);
    A(ctx, e, [{ transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 0 }, { opacity: 1, offset: 0.1 }, { transform: `translate(${R1(x + rnd(5, 30))}px,${R1(y - h * rnd(1.4, 3))}px)`, opacity: 1, offset: 0.6 }, { transform: `translate(${R1(x + rnd(20, 60))}px,${R1(y - h * rnd(2.6, 4.4))}px)`, opacity: 0 }], rnd(1200, 2400), delay + rnd(0, life * 0.8));
  }
  return out;
}
/** A group of flames in the layer: they die down together with one animation (the budget of the layer). */
export function fireGroup(ctx: FxCtx): HTMLElement {
  const g = mk(ctx, 'fx-fire-group', 0, 0);
  g.style.opacity = '1';
  return g;
}
/** A column of thick smoke over a fire: dark clouds keep rising and leaning downwind. */
export function smokeColumn(ctx: FxCtx, svg: Element, x: number, y: number, k = 1, waves = 4, every = 700, delay = 0): void {
  for (let w = 0; w < waves; w++) smokeJet(ctx, svg, x + rnd(-8, 8) * k, y, -Math.PI / 2 - 0.25, k, 5, 5200, delay + w * every, true);
}
/** A soft column of smoke over something smouldering (a trace on a plank): CSS puffs, still with «простые». */
export function smolderEl(x: number, y: number, n = 3): HTMLElement {
  const s = document.createElement('div');
  s.className = 'fx-smolder';
  s.style.left = `${R1(x)}px`;
  s.style.top = `${R1(y)}px`;
  s.innerHTML = Array.from({ length: n }, (_, i) => `<i style="animation-delay:${(i * 0.9).toFixed(1)}s"></i>`).join('');
  return s;
}
