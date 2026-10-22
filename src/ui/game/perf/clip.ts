// ?perf=1: the numbers of one show (from busy to idle) — its clips, frames, long tasks, the renders of Game and the native
// animations whose target lies inside a board-wide SVG (fxSvg). Off (no ?perf=1): every entry returns at once.
import {getPerf} from './state';

export interface ClipStats {
  scene: string;
  ms: number;
  fpsMin: number;
  fpsAvg: number;
  /** Long tasks (> 50 ms); null where the browser has no PerformanceObserver «longtask» (Safari). */
  longTasks: number | null;
  longestMs: number;
  framesOver50: number;
  worstFrameMs: number;
  renders: number;
  renderMs: number;
  renderMaxMs: number;
  /** «clip · element» → native animations in a board-wide SVG, the most first. */
  svg: [string, number][];
}

interface Run { start: number; clips: string[]; frames: number[]; tasks: number[]; renders: number[]; svg: Map<string, number>; raf: number; observer: PerformanceObserver | null }
let run: Run | null = null;
let last: ClipStats | null = null;
let current = '';
const listeners = new Set<() => void>();

/** The A() hook: set only while a show is measured, so A() pays one null check otherwise. */
export let perfAnimHook: ((el: Element) => void) | null = null;

const longTaskOk = () => typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes ?? []).includes('longtask');

/** The look of an element for the table: «circle[fxSmk]», «path.trail». */
function signature(el: Element): string {
  const fill = el.getAttribute('fill') ?? el.getAttribute('stroke') ?? '';
  const ref = /url\(#(\w+)/.exec(fill)?.[1];
  const cls = el.getAttribute('class')?.split(' ')[0];
  return el.tagName.toLowerCase() + (ref ? `[${ref}]` : cls ? `.${cls}` : '');
}

function countSvg(el: Element): void {
  if (!run || !el.closest('svg.fx-svg')) return;
  const key = `${current || '?'} · ${signature(el)}`;
  run.svg.set(key, (run.svg.get(key) ?? 0) + 1);
}

export function clipShowStart(): void {
  if (!getPerf().enabled || run) return;
  const r: Run = {start: performance.now(), clips: [], frames: [], tasks: [], renders: [], svg: new Map(), raf: 0, observer: null};
  const tick = (t: number) => { r.frames.push(t); r.raf = requestAnimationFrame(tick); };
  r.raf = requestAnimationFrame(tick);
  if (longTaskOk()) {
    r.observer = new PerformanceObserver((list) => { for (const e of list.getEntries()) r.tasks.push(e.duration); });
    r.observer.observe({type: 'longtask', buffered: false});
  }
  run = r;
  perfAnimHook = countSvg;
}

export function clipKind(kind: string): void {
  if (!run) return;
  current = kind;
  if (run.clips.at(-1) !== kind) run.clips.push(kind);
}

/** A render of Game took so long (render + commit, up to its layout effect). */
export function clipRender(ms: number): void {
  run?.renders.push(ms);
}

export function clipShowEnd(): void {
  const r = run;
  if (!r) return;
  run = null;
  perfAnimHook = null;
  current = '';
  cancelAnimationFrame(r.raf);
  r.observer?.disconnect();
  // a show without a clip (an action with nothing to play) keeps the numbers of the last real one
  if (r.clips.length === 0) return;
  const end = performance.now(), ms = end - r.start;
  const gaps = r.frames.slice(1).map((t, i) => t - r.frames[i]);
  // frames per second of each second of the show; a last piece shorter than half a second is left out
  const seconds: number[] = [];
  for (let s = r.start; s < end; s += 1000) {
    const e = Math.min(end, s + 1000);
    if (e - s < 500 && seconds.length) break;
    seconds.push(r.frames.filter((t) => t > s && t <= e).length * 1000 / (e - s));
  }
  last = {
    scene: r.clips.join(' + ') || '—', ms,
    fpsMin: seconds.length ? Math.min(...seconds) : 0, fpsAvg: gaps.length * 1000 / Math.max(1, ms),
    longTasks: r.observer ? r.tasks.length : null, longestMs: Math.max(0, ...r.tasks),
    framesOver50: gaps.filter((g) => g > 50).length, worstFrameMs: Math.max(0, ...gaps),
    renders: r.renders.length, renderMs: r.renders.reduce((a, b) => a + b, 0), renderMaxMs: Math.max(0, ...r.renders),
    svg: [...r.svg.entries()].sort((a, b) => b[1] - a[1]),
  };
  listeners.forEach((fn) => fn());
}

export const lastClip = () => last;
export const subscribeClip = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** The numbers as one text to paste into a message. */
export function clipText(c: ClipStats): string {
  const tasks = c.longTasks === null ? `длинные задачи: нет в этом браузере; кадров >50 мс ${c.framesOver50}` : `длинные задачи ${c.longTasks} (самая ${c.longestMs.toFixed(0)} мс); кадров >50 мс ${c.framesOver50}`;
  const svg = c.svg.length ? c.svg.slice(0, 5).map(([k, n]) => `${k} ×${n}`).join(', ') + (c.svg.length > 5 ? ` … всего ${c.svg.reduce((s, [, n]) => s + n, 0)}` : '') : 'нет';
  return [
    `сцена: ${c.scene}, ${(c.ms / 1000).toFixed(1)} с`,
    `кадров/с мин ${c.fpsMin.toFixed(0)} / ср ${c.fpsAvg.toFixed(1)}; худший кадр ${c.worstFrameMs.toFixed(0)} мс`,
    tasks,
    `рендеры Game: ${c.renders}, сумма ${c.renderMs.toFixed(0)} мс, макс ${c.renderMaxMs.toFixed(1)} мс`,
    `анимации в SVG на весь стол: ${svg}`,
  ].join('\n');
}
