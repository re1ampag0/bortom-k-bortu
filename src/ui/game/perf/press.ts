// ?perf=1, ui-press: the window «нажатие» — 1.5 s after a press of a button of the table (or the opening of «Тревога!»):
// the frames, the renders of Game, the stages of a show that began in it, and what opened or closed. Off (no ?perf=1):
// clip.ts never calls pressStart (its listeners are not attached), Game never calls pressOpen — no clock, no rAF.
import {worstFrames, frameText, type PhaseSample, type WorstFrame} from './frames';

export const PRESS_MS = 1500;
const KEEP = 8;

export interface PressStats {
  /** The button (data-testid, aria-label or text) or the event («Тревога! открылась»). */
  name: string;
  /** What opened and closed in the window, by the DOM at its start and end. */
  opened: string[];
  closed: string[];
  /** The clips of a show that began in the window («показ: announce + shot»). */
  clips: string[];
  /** From the press to the first frame after it (the start of that rAF). */
  firstFrameMs: number;
  worstFrameMs: number;
  framesOver50: number;
  renders: number;
  renderMaxMs: number;
  renderMs: number;
  worstFrames: WorstFrame[];
}

/** What the press can open: a sheet, a window, the layer of the lifted card. Read once at the start and once at the end. */
const STATES: [string, string][] = [
  ['лист «Заряд»', '.charge-sheet'],
  ['«Тревога!» развёрнута', '.alarm-sheet:not(.folded)'],
  ['«Тревога!» свёрнута', '.alarm-sheet.folded'],
  ['окно решения', '.decision-dock'],
  ['панель в море', '.middle > .dock:not(.sheet-dock)'],
  ['карта', '[data-testid="card-detail"]'],
  ['окно', '.sheet-backdrop, .ship-window-backdrop'],
  ['журнал', '.book-backdrop'],
  ['поднятая карта', '.hand-lift'],
];
const statesNow = () => typeof document === 'undefined' ? [] : STATES.filter(([, q]) => {
  try { return !!document.querySelector(q); } catch { return false; }
}).map(([name]) => name);

interface Win { name: string; start: number; frames: number[]; renders: number[]; before: string[]; raf: number }
let win: Win | null = null;
let phasesOf: ((from: number, to: number) => PhaseSample[]) | null = null;
let list: PressStats[] = [];
const listeners = new Set<() => void>();

/** clip.ts gives the stages of the show it measures (and of the last one), to name the clips of a window. */
export function pressPhases(fn: ((from: number, to: number) => PhaseSample[]) | null): void { phasesOf = fn; }

/** A press opens a window (a press inside a window closes it first: one window per press). `at` — the performance clock. */
export function pressOpen(name: string, at: number): void {
  if (typeof requestAnimationFrame === 'undefined') return;
  if (win) pressClose();
  const w: Win = {name, start: at, frames: [], renders: [], before: statesNow(), raf: 0};
  const tick = (t: number) => {
    if (win !== w) return;
    if (t > w.start) w.frames.push(t);
    if (t - w.start >= PRESS_MS) { pressClose(); return; }
    w.raf = requestAnimationFrame(tick);
  };
  w.raf = requestAnimationFrame(tick);
  win = w;
}

/** A render of Game (render + commit) inside the window. */
export function pressRender(ms: number): void { win?.renders.push(ms); }

/** Off: drop the window without a result. */
export function pressStop(): void {
  if (win) cancelAnimationFrame(win.raf);
  win = null;
  list = [];
  listeners.forEach((fn) => fn());
}

function pressClose(): void {
  const w = win;
  if (!w) return;
  win = null;
  cancelAnimationFrame(w.raf);
  const end = w.frames.at(-1) ?? w.start;
  const phases = (phasesOf?.(w.start, end) ?? []).map((p) => ({...p, end: Math.min(p.end, end)}));
  const profile = {start: w.start, end, frames: w.frames, phases, presses: [{at: w.start, name: w.name, trigger: true}], prepared: [], dropped: 0};
  const gaps = [w.frames[0] - w.start, ...w.frames.slice(1).map((t, i) => t - w.frames[i])].filter((g) => g > 0);
  const after = statesNow();
  list = [{
    name: w.name,
    opened: after.filter((s) => !w.before.includes(s)),
    closed: w.before.filter((s) => !after.includes(s)),
    clips: [...new Set(phases.filter((p) => p.kind === 'clip').map((p) => p.clip))],
    firstFrameMs: w.frames.length ? w.frames[0] - w.start : 0,
    worstFrameMs: Math.max(0, ...gaps),
    framesOver50: gaps.filter((g) => g > 50).length,
    renders: w.renders.length,
    renderMs: w.renders.reduce((a, b) => a + b, 0),
    renderMaxMs: Math.max(0, ...w.renders),
    worstFrames: w.frames.length ? worstFrames(profile) : [],
  }, ...list].slice(0, KEEP);
  listeners.forEach((fn) => fn());
}

export const lastPresses = () => list;
export const subscribePress = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** «Сыграть → лист «Заряд»», «fire → показ: announce + shot». */
export function pressTitle(p: PressStats): string {
  const what = [...p.opened.map((s) => `открыт ${s}`), ...p.closed.map((s) => `закрыт ${s}`), ...(p.clips.length ? [`показ: ${p.clips.join(' + ')}`] : [])];
  return `${p.name} → ${what.join(', ') || 'без смены листов'}`;
}

/** One window as lines to paste into a message (the newest first in «Скопировать числа»). */
export function pressText(p: PressStats): string {
  return [
    pressTitle(p),
    `  до первого кадра ${p.firstFrameMs.toFixed(0)} мс; худший кадр ${p.worstFrameMs.toFixed(0)} мс; >50 мс: ${p.framesOver50}; рендеры Game ${p.renders} (сумма ${p.renderMs.toFixed(0)}, макс ${p.renderMaxMs.toFixed(1)} мс)`,
    ...p.worstFrames.map((f, i) => `  ${i + 1}. ${frameText(f)}`),
  ].join('\n');
}
