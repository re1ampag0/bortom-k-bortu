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

/** Everything an effect needs: the reference's globals, for one run of the queue. */
export interface FxCtx {
  /** The table (.board, position: relative): positions are relative to it. */
  board: HTMLElement;
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
export function wait(ctx: FxCtx, t: number): Promise<void> {
  return new Promise((res, rej) => setTimeout(() => (ctx.run === ctx.live() ? res() : rej(ABORT)), ms(ctx, t)));
}
export function at(ctx: FxCtx, t: number, fn: () => void): void {
  setTimeout(() => {
    if (ctx.run === ctx.live()) fn();
  }, ms(ctx, t));
}
export function A(ctx: FxCtx, el: Element, kf: Keyframe[], d: number, delay = 0, easing = 'ease-out', fill: FillMode = 'both'): Animation {
  return el.animate(kf, { duration: Math.max(1, ms(ctx, d)), delay: ms(ctx, delay), easing, fill });
}
export function bx(ctx: FxCtx, el: Element): Box {
  const r = el.getBoundingClientRect(), b = ctx.board.getBoundingClientRect();
  return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height, cx: r.left - b.left + r.width / 2, cy: r.top - b.top + r.height / 2, r: r.right - b.left, b: r.bottom - b.top };
}
export function mk(ctx: FxCtx, cls: string, x: number, y: number, html = ''): HTMLElement {
  const d = document.createElement('div');
  d.className = cls;
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
    if (flashColor && on !== was) A(ctx, c, [{ background: flashColor, boxShadow: `0 0 0 2px ${flashColor}55` }, { background: on ? '#2a241d' : '#e2d8c7', boxShadow: 'none' }], 900, 0, 'linear', 'none');
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
  if (!ctx.rich) return;
  const p = mk(ctx, 'puff', 0, 0);
  A(ctx, p, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }, { opacity: 0.95, offset: 0.15 }, { opacity: 0, transform: `translate(${x - 6}px,${y - 10}px) scale(2.4)` }], 1500, delay);
}
export function burst(ctx: FxCtx, cls: string, x: number, y: number, delay: number, n: number, r0: number, r1: number, dur = 600, angle0 = 0, spread = 2 * Math.PI): void {
  if (!ctx.rich) return;
  for (let k = 0; k < n; k++) {
    const e = mk(ctx, cls, 0, 0);
    const a = angle0 + (k / n - 0.5) * spread + (Math.random() - 0.5) * 0.4, r = r0 + Math.random() * (r1 - r0);
    A(ctx, e, [{ opacity: 1, transform: `translate(${x}px,${y}px) rotate(${a}rad)` }, { opacity: 0, transform: `translate(${x + Math.cos(a) * r}px,${y + Math.sin(a) * r}px) rotate(${a + (cls === 'spark' ? 0 : 3)}rad)` }], dur, delay, 'cubic-bezier(.2,.7,.3,1)');
  }
}
export function splash(ctx: FxCtx, x: number, y: number, delay: number): void {
  const s = mk(ctx, 'splash', 0, 0, '<svg viewBox="0 0 44 30" width="44" height="30"><g fill="#9CC3DA"><path d="M22 30 C18 18 14 10 10 4 C16 10 19 16 22 22 C25 16 28 10 34 4 C30 10 26 18 22 30Z"/><circle cx="8" cy="14" r="2.5"/><circle cx="36" cy="12" r="2.5"/><circle cx="22" cy="4" r="2"/></g></svg>');
  A(ctx, s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.3)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.25 }, { opacity: 0, transform: `translate(${x}px,${y - 6}px) scale(1.2)` }], 700, delay);
  const r = mk(ctx, 'ripple', 0, 0);
  A(ctx, r, [{ opacity: 0.9, transform: `translate(${x}px,${y}px) scale(.3)` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1.8)` }], 900, delay);
  if (ctx.rich) {
    const r2 = mk(ctx, 'ripple', 0, 0);
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
  t.style.left = inside(x - w / 2, w, ctx.board.clientWidth) + w / 2 + 'px';
  t.style.top = inside(y - h / 2, h + 4, ctx.board.clientHeight) + h / 2 + 'px';
  A(ctx, t, [{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0', offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], dur, delay);
  return t;
}
export function bubbles(ctx: FxCtx, x: number, y: number, w: number, delay: number, n = 10, rise = 40): void {
  if (!ctx.rich) return;
  for (let k = 0; k < n; k++) {
    const b = mk(ctx, 'bubble', 0, 0);
    const bx0 = x + Math.random() * w, by = y - Math.random() * 8;
    A(ctx, b, [{ opacity: 0, transform: `translate(${bx0}px,${by}px) scale(.5)` }, { opacity: 0.9, offset: 0.2 }, { opacity: 0, transform: `translate(${bx0 + (Math.random() - 0.5) * 12}px,${by - rise - Math.random() * 20}px) scale(1.1)` }], 900 + Math.random() * 400, delay + Math.random() * 500);
  }
}
export function steam(ctx: FxCtx, x: number, y: number, delay: number): void {
  for (let k = 0; k < (ctx.rich ? 5 : 1); k++) {
    const p = mk(ctx, 'puff', 0, 0);
    A(ctx, p, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 0.8, offset: 0.2 }, { opacity: 0, transform: `translate(${x + (k - 2) * 6}px,${y - 26}px) scale(1.1)` }], 900, delay + k * 70);
  }
}
/** A shake: a weak hit 2–3 px, a strong one 8–10 px, 50–100 ms per phase (see «ощущение удара»). */
export function shake(ctx: FxCtx, el: Element, delay: number, amp = 3, d = 260): void {
  A(ctx, el, [{ transform: 'none' }, { transform: `translate(${-amp}px,1px)` }, { transform: `translate(${amp}px,-1px)` }, { transform: `translate(${-amp * 0.6}px,0)` }, { transform: `translate(${amp * 0.3}px,0)` }, { transform: 'none' }], d, delay, 'linear', 'none');
}
export function ring(ctx: FxCtx, x: number, y: number, delay: number, size = 1, color?: string): void {
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
  if (ctx.rich) w.querySelector('svg')!.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: ms(ctx, 1800), iterations: dur ? Math.ceil(dur / 1800) : 6, delay: ms(ctx, delay) });
  return w;
}
export function wisp(ctx: FxCtx, from: Pt, to: Pt, delay: number, d = 800): void {
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
  const t = tag(ctx, label ? bx(ctx, label).cx : kb.x - 30, kb.cy, text, delay, cls, dur);
  const w = t.offsetWidth;
  t.style.left = Math.max(w / 2, Math.min(parseFloat(t.style.left), kb.x - 4 - w / 2)) + 'px';
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
    setTimeout(() => {
      slot.classList.add('on');
      A(ctx, slot, [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], 250, 0);
    }, ms(ctx, delay + 520 + k * 130));
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
  return `<button class="hcard ${cardClass(c)}" tabindex="-1" data-fx-card="${esc(code)}"><span class="hcard-head"><span class="hcard-type">${esc(c.type)}</span><span class="cost">${esc(cost)}</span></span><span class="hcard-name">${esc(c.name)}</span><span class="hcard-big">${esc(c.big)}</span><span class="hcard-text">${esc(c.text.replace(/<[^>]+>/g, ' '))}</span></button>`;
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
/** Where a card flies from: an own one — from the hand (the card in the hand hides), another's — from beyond the edge over its ship. */
export function cardOrigin(ctx: FxCtx, code: string, ship: string): CardPos {
  const h = handCardEl(ctx, code);
  if (h && sideOf(ctx, ship) === ctx.bottom) {
    const b = bx(ctx, h);
    h.style.visibility = 'hidden';
    return { x: b.x, y: b.y, s: 1 };
  }
  // game: the hand is the real one — an own card just played is out of it already: it flies from the hand row.
  const row = ctx.board.querySelector('[data-fx-hand] .hand-cards');
  if (sideOf(ctx, ship) === ctx.bottom && visible(row)) {
    const b = bx(ctx, row);
    return { x: b.cx - 55, y: b.y, s: 1 };
  }
  const s = bx(ctx, plank(ctx, ship));
  return isTop(ctx, ship) ? { x: s.cx - 55, y: -150, r: -8, s: 1 } : { x: s.cx - 55, y: ctx.board.clientHeight + 20, r: 8, s: 1 };
}
export function hint(ctx: FxCtx, text: string): void {
  ctx.hint(text);
}
export function pill(ctx: FxCtx, x: number, y: number, text: string, delay: number, cls = ''): HTMLElement {
  const pl = mk(ctx, 'pill ' + cls, 0, 0, text);
  // game: inside the table (see tag); it moves from +8 px to −12 px and grows to ×1.12
  const w0 = pl.offsetWidth, h0 = pl.offsetHeight, gw = w0 * 0.06, gh = h0 * 0.06; // ×1.12 around its centre
  x = inside(x - gw, w0 + 2 * gw, ctx.board.clientWidth) + gw;
  y = Math.max(EDGE + 12 + gh, Math.min(ctx.board.clientHeight - EDGE - h0 - gh - 8, y));
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
  const rr = range.getBoundingClientRect(), b = ctx.board.getBoundingClientRect();
  const tx = rr.width > 0 ? rr.left - b.left : bx(ctx, num).x, ty = rr.height > 0 ? rr.top - b.top + rr.height / 2 : bx(ctx, num).cy;
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
 * Souls: wisps from the enemy's Crew into the Souls of «Голландец» (play-volley.js; the card and the Souls clips use it
 * too). `mark` (L1, the rule of S1): a short mark «+N» at the badge instead of the label over the plank.
 */
export function soulsFly(ctx: FxCtx, fromShip: string, n: number, delay: number, mark = false) {
  const keeper = ctx.data.ships.map((s) => s.code).find((x) => shipData(ctx.data, x).souls != null && !ctx.display.ships[x].sunk);
  if (!keeper) return;
  const badge = plank(ctx, keeper).querySelector('[data-fx-souls]');
  const to = badge && visible(badge) ? (() => { const b = bx(ctx, badge); return { x: b.cx, y: b.cy }; })() : (() => { const b = bx(ctx, plank(ctx, keeper)); return { x: b.r - 30, y: b.y + 30 }; })();
  const from = fxPoint(ctx, fromShip, 'crew', 0);
  for (let k = 0; k < n; k++) wisp(ctx, from, to, delay + k * 160);
  setTimeout(() => { if (badge && ctx.run === ctx.live()) { A(ctx, badge, [{ transform: 'scale(1.3)', boxShadow: '0 0 12px #6fd3b4' }, { transform: 'scale(1)', boxShadow: 'none' }], 500, 0, 'ease-out', 'none'); } }, ms(ctx, delay + 800));
  if (mark) { if (badge && visible(badge)) badgeMark(ctx, badge, `+${n}`, delay + 700, true); }
  else tag(ctx, to.x, to.y - 16, `+${n} ${n === 1 ? 'Душа' : 'Души'}`, delay + 700, 'good', 1200);
}
export const FLAME_SVG = '<svg width="18" height="22" viewBox="0 0 14 17"><path d="M7 1 C9 5 13 7 12 11 C11.5 14.5 9 16 7 16 C4 16 2 14 2 11 C2 8.5 4 7.5 4.5 5 C5.5 7 6.5 7 7 6 C7.5 4.5 7 3 7 1Z" fill="#F2913D" stroke="#B23A2E" stroke-width="1"/><path d="M7 9 C8 10.5 9.5 11.5 9 13 C8.6 14.4 7.6 15 7 15 C5.8 15 5 14 5 12.8 C5 11.6 6.2 11 7 9Z" fill="#FFE08A"/></svg>';
