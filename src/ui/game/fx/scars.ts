// FX-A: the traces the effects leave on the table (docs/mockups/a5/fx/ANIMATIONS.md, §2; scar/clearScars of
// docs/mockups/a5/fx/src/fx3.js). Not to be confused with trace.ts — the journal of the layer.
// The user's decision: every trace dissolves by itself — it holds, then fades out slowly and goes; at most SCAR_MAX on
// the table (when a new one comes, the oldest fade in 2 s); a repair of the Hull takes the traces of its ship away.
// game: the time is the clock of the show — «Пауза» stops it, the speed of the show runs it faster or slower (the
// reference uses the wall clock); with «простые спецэффекты» the traces live half as long. The traces are not WAAPI
// animations: «Сразу итог» (resetFx) cancels those, the traces live on and dissolve as they would.
// Where they live: on the sea (.fx-scars — over the weather of the round, under the planks) or on a ship
// (.plank-scars inside its plank — it moves and shakes with the plank). Nothing of them takes a press.
import type { FxCtx } from './primitives';

export type ScarLife = 'short' | 'medium' | 'long';
/** [holds, fades] in ms: short — smoke, ink, marks of a hit; medium — cracks, scorch; long — a wreck, the bottle. */
export const SCAR_LIFE: Record<ScarLife, [number, number]> = { short: [3000, 9000], medium: [9000, 12000], long: [14000, 14000] };
export const SCAR_MAX = 6;
/** The quick fade of a trace pushed out by a newer one, or taken away by a repair. */
export const SCAR_GONE = 2000;

/** How long a trace holds and fades: half as long with «простые спецэффекты». */
export function scarSpan(life: ScarLife, rich: boolean): [number, number] {
  const [hold, fade] = SCAR_LIFE[life];
  return rich ? [hold, fade] : [hold / 2, fade / 2];
}
/** The opacity of a trace of this age: 1 while it holds, then down to 0 over its fade; null — it is over. */
export function scarOpacity(age: number, hold: number, fade: number): number | null {
  if (age >= hold + fade) return null;
  return age <= hold ? 1 : 1 - (age - hold) / fade;
}
/** Which traces go when there are too many: the oldest beyond `max` (the list is from the oldest). */
export function overflowScars<T>(alive: readonly T[], max = SCAR_MAX): T[] {
  return alive.slice(0, Math.max(0, alive.length - max));
}

interface Scar {
  el: HTMLElement | SVGElement;
  owner: string;
  age: number;
  hold: number;
  fade: number;
  /** Fading out quickly (pushed out or repaired): from this opacity, for so long already. */
  gone: { from: number; t: number } | null;
}

/** The clock of the show: how fast it runs (1 / the speed factor), whether it stands, the look of the effects. */
export interface ScarClock {
  rate: number;
  paused: boolean;
  rich: boolean;
}
let clock: () => ScarClock = () => ({ rate: 1, paused: false, rich: true });
/** The test page (?fxScene, FxScene.tsx) runs the traces faster: e2e does not wait 12 s for one to dissolve. */
let testRate = 1;
let scars: Scar[] = [];
let raf = 0;
let last = 0;

/** useFxQueue gives its clock (speed, «Пауза», «простые спецэффекты»). */
export function setScarClock(fn: () => ScarClock): void {
  clock = fn;
}
export function setScarTestRate(k: number): void {
  testRate = k > 0 ? k : 1;
}

const opacityOf = (s: Scar) => (s.gone ? s.gone.from * Math.max(0, 1 - s.gone.t / SCAR_GONE) : scarOpacity(s.age, s.hold, s.fade) ?? 0);

function tick(now: number): void {
  raf = 0;
  const c = clock();
  const dt = c.paused ? 0 : Math.min(250, now - last) * c.rate * testRate;
  last = now;
  scars = scars.filter((s) => {
    if (!s.el.isConnected) return false;
    if (s.gone) s.gone.t += dt;
    else s.age += dt;
    const o = s.gone ? (s.gone.t >= SCAR_GONE ? null : opacityOf(s)) : scarOpacity(s.age, s.hold, s.fade);
    if (o == null) {
      s.el.remove();
      return false;
    }
    s.el.style.opacity = o.toFixed(3);
    return true;
  });
  if (scars.length > 0) raf = requestAnimationFrame(tick);
}
function run(): void {
  if (raf || typeof requestAnimationFrame === 'undefined') return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}
function fadeOut(s: Scar): void {
  if (s.gone) return;
  s.gone = { from: opacityOf(s), t: 0 };
  s.el.dataset.gone = '1';
}

/** Marks an element as a trace: it holds, dissolves and goes. `owner` — the ship it belongs to (a repair takes it away). */
export function scar<T extends HTMLElement | SVGElement>(el: T, life: ScarLife = 'short', owner = ''): T {
  const [hold, fade] = scarSpan(life, clock().rich);
  el.dataset.scar = life;
  if (owner) el.dataset.owner = owner;
  el.style.pointerEvents = 'none';
  scars.push({ el, owner, age: 0, hold, fade, gone: null });
  overflowScars(scars.filter((s) => !s.gone)).forEach(fadeOut);
  run();
  return el;
}
/** The traces of a ship (or all of them) fade out in 2 s: a repair of the Hull. */
export function clearScars(owner?: string): void {
  scars.filter((s) => !owner || s.owner === owner).forEach(fadeOut);
  run();
}

/** The host of the traces on the sea: over the weather of the round, under the planks (FxLayer.tsx). */
export const seaScars = (ctx: FxCtx) => ctx.board.querySelector<HTMLElement>('.fx-scars');
/** The host of the traces on a ship: inside its plank (Table.tsx). */
export const plankScars = (ctx: FxCtx, code: string) => ctx.board.querySelector<HTMLElement>(`[data-fx-ship="${code}"] > .plank-scars`);

/**
 * The mark of a hit on the plank (pg-hitmark of hitBlast in fx3.js): a soot spot where the ball struck, a short trace.
 * `x`, `y` — the point on the board.
 */
export function hitMark(ctx: FxCtx, code: string, x: number, y: number, k = 1): void {
  const host = plankScars(ctx, code);
  if (!host) return;
  const hb = host.getBoundingClientRect(), b = ctx.board.getBoundingClientRect();
  const m = document.createElement('i');
  m.className = 'fx-hitmark';
  const w = 32 * k, h = 24 * k;
  Object.assign(m.style, { left: `${x - (hb.left - b.left) - w / 2}px`, top: `${y - (hb.top - b.top) - h / 2}px`, width: `${w}px`, height: `${h}px` });
  host.appendChild(m);
  scar(m, 'short', code);
}
