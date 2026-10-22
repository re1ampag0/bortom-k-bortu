// ?perf=1: the numbers of one show (from busy to idle) — its clips, frames, long tasks, the renders of Game and the native
// animations whose target lies inside a board-wide SVG (fxSvg). Off (no ?perf=1): every entry returns at once.
import {getPerf} from './state';
import {worstFrames, frameText, type ClipProfile, type PhaseSample, type PressSample, type WorstFrame} from './frames';

export interface ClipStats {
  scene: string;
  worstFrames: WorstFrame[];
  dropped: number;
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

interface Run { phases: PhaseSample[]; presses: PressSample[]; prepared: PhaseSample[]; dropped: number; start: number; clips: string[]; frames: number[]; tasks: number[]; renders: number[]; svg: Map<string, number>; raf: number; observer: PerformanceObserver | null }
let run: Run | null = null;
let last: ClipStats | null = null;
let current = '';
const listeners = new Set<() => void>();

/** The A() hook: set only while a show is measured, so A() pays one null check otherwise. */
export let perfAnimHook: ((el: Element) => void) | null = null;

/** Null while diagnostics is disabled: producers do not read clocks or allocate samples. */
export let perfWorkHook: ((name: string) => (() => void)) | null = null;
export let perfPhaseHook: ((name: string, duration: number, delay?: number) => void) | null = null;
let profile: ClipProfile | null = null;
let recentWork: PhaseSample[] = [], lastPress: PressSample | null = null;
let listening = false, pausedAt: number | null = null;
const CAP = 4096;
function work(name: string): () => void {
  const r=run, list=r?.phases??recentWork;
  if(list.length>=CAP){if(r)r.dropped++;else list.shift();if(r)return ()=>{};}
  const row:PhaseSample={at:performance.now(),end:Infinity,clip:current,name,kind:'work'};
  list.push(row);
  return ()=>{row.end=performance.now();};
}
function visual(name: string,duration: number,delay=0): void {
  if(!run)return;
  if(run.phases.length>=CAP){run.dropped++;return;}
  const at=performance.now()+delay;
  run.phases.push({at,end:at+duration,clip:current,name,kind:'visual'});
}
function press(e: Event): void {
  if(e instanceof KeyboardEvent&&!['Enter',' '].includes(e.key))return;
  const target=e.target instanceof Element?e.target.closest('[data-testid],button'):null;
  lastPress={at:performance.now(),name:`${e.type} ${target?.getAttribute('data-testid')??target?.getAttribute('aria-label')??target?.textContent?.trim().slice(0,48)??'стол'}`};
  if(run&&run.presses.length<CAP)run.presses.push(lastPress);
}
function configure(enabled=getPerf().enabled): void {
  perfWorkHook=enabled?work:null;perfPhaseHook=enabled?visual:null;
  if(typeof document==='undefined'||enabled===listening)return;
  listening=enabled;
  for(const name of ['pointerdown','click','keydown']){
    if(enabled)document.addEventListener(name,press,{capture:true,passive:true});
    else document.removeEventListener(name,press,true);
  }
  if(!enabled){if(run){cancelAnimationFrame(run.raf);run.observer?.disconnect();}run=null;perfAnimHook=null;recentWork=[];lastPress=null;pausedAt=null;current='';}
}
export function watchClipDiagnostics(): () => void {configure();return ()=>configure(false);}
/** Pause uses the same state change as the native animation/particle clocks. */
export function clipPause(held: boolean): void {
  if(!run)return;
  const now=performance.now();
  if(held&&pausedAt===null){pausedAt=now;run.phases.push({at:now,end:Infinity,clip:current,name:'Пауза',kind:'work'});}
  else if(!held&&pausedAt!==null){
    const dt=now-pausedAt;
    for(const p of run.phases)if(p.kind==='visual'){if(p.at>=pausedAt)p.at+=dt;if(p.end>=pausedAt)p.end+=dt;}
    const pause=run.phases.filter(p=>p.name==='Пауза').at(-1);if(pause)pause.end=now;pausedAt=null;
  }
}
export const lastClipProfile = () => profile;

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
  configure();
  const r: Run = {phases: [], presses: [], prepared:recentWork.filter(p=>p.name.startsWith('prepare')&&Number.isFinite(p.end)).map(p=>({...p})), dropped:0, start: performance.now(), clips: [], frames: [], tasks: [], renders: [], svg: new Map(), raf: 0, observer: null};
  const tick = (t: number) => { r.frames.push(t); r.raf = requestAnimationFrame(tick); };
  r.raf = requestAnimationFrame(tick);
  if (longTaskOk()) {
    r.observer = new PerformanceObserver((list) => { for (const e of list.getEntries()) r.tasks.push(e.duration); });
    r.observer.observe({type: 'longtask', buffered: false});
  }
  if(lastPress&&r.start-lastPress.at<1000)r.presses.push({...lastPress,trigger:true});
  run = r;
  pausedAt=null;
  perfAnimHook = countSvg;
}

export function clipKind(kind: string): void {
  if (!run) return;
  const now=performance.now();
  const previous=run.phases.filter(p=>p.kind==='clip').at(-1);if(previous)previous.end=now;
  current = kind;
  if(run.phases.length<CAP)run.phases.push({at:now,end:Infinity,clip:kind,name:kind,kind:'clip'});else run.dropped++;
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
  profile={start:r.start,end,frames:r.frames.slice(),phases:r.phases.map(p=>({...p,end:Math.min(p.end,end)})),presses:r.presses.slice(),prepared:recentWork.filter(p=>p.name.startsWith('prepare')).map(p=>({...p})),dropped:r.dropped};
  const worst=worstFrames(profile);
  const gaps = r.frames.slice(1).map((t, i) => t - r.frames[i]);
  // frames per second of each second of the show; a last piece shorter than half a second is left out
  const seconds: number[] = [];
  for (let s = r.start; s < end; s += 1000) {
    const e = Math.min(end, s + 1000);
    if (e - s < 500 && seconds.length) break;
    seconds.push(r.frames.filter((t) => t > s && t <= e).length * 1000 / (e - s));
  }
  last = {
    scene: r.clips.join(' + ') || '—', ms, worstFrames:worst,dropped:r.dropped,
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
    '5 худших интервалов rAF (≥ — неполный край показа):',
    ...c.worstFrames.map((f,i)=>`${i+1}. ${frameText(f)}`),
    ...(c.dropped?[`меток потеряно: ${c.dropped}`]:[]),
  ].join('\n');
}
