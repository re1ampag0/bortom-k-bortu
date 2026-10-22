// Main-thread costs from a CDP trace: union per category, so nested records are never counted twice.
import {phaseCost} from '../fx-sprites/trace-costs.mjs';

const SCRIPT = new Set(['FunctionCall', 'EvaluateScript', 'TimerFire', 'EventDispatch', 'FireAnimationFrame', 'RunMicrotasks', 'v8.compile', 'v8.callFunction', 'V8.Execute', 'MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'FireIdleCallback', 'XHRReadyStateChange', 'ParseHTML']);
const STYLE = new Set(['UpdateLayoutTree', 'RecalculateStyles']);

function union(list) {
  list.sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const r of list) {
    const last = out.at(-1);
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}
const total = (u) => u.reduce((s, [a, b]) => s + (b - a) / 1000, 0);
const inside = (u, t) => u.some(([a, b]) => t >= a && t < b);

/** The renderer main thread of the page: the CrRendererMain with the most work inside the window. */
function mainThread(events, a, b) {
  const names = new Map();
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name' && e.args?.name === 'CrRendererMain') names.set(`${e.pid}:${e.tid}`, 0);
  for (const e of events) {
    const key = `${e.pid}:${e.tid}`;
    if (names.has(key) && e.ph === 'X' && e.ts >= a && e.ts < b) names.set(key, names.get(key) + 1);
  }
  return [...names.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
}

export function mainCosts(events, a, b) {
  const main = mainThread(events, a, b);
  const rows = events.filter((e) => e.ph === 'X' && `${e.pid}:${e.tid}` === main && e.ts >= a && e.ts < b);
  const span = (e) => [e.ts, Math.min(b, e.ts + (e.dur ?? 0))];
  const script = union(rows.filter((e) => SCRIPT.has(e.name)).map(span));
  const styleRows = rows.filter((e) => STYLE.has(e.name)), layoutRows = rows.filter((e) => e.name === 'Layout');
  const forcedStyle = styleRows.filter((e) => inside(script, e.ts)), forcedLayout = layoutRows.filter((e) => inside(script, e.ts));
  const tasks = rows.filter((e) => (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') && (e.dur ?? 0) > 50000);
  const taskSpans = union(tasks.map(span));
  return {
    scriptingMs: total(script),
    recalcStyleMs: total(union(styleRows.map(span))),
    recalcStyleCount: styleRows.length,
    layoutMs: total(union(layoutRows.map(span))),
    layoutCount: layoutRows.length,
    forcedStyle: {count: forcedStyle.length, ms: total(union(forcedStyle.map(span)))},
    forcedLayout: {count: forcedLayout.length, ms: total(union(forcedLayout.map(span)))},
    longTasks: taskSpans.length,
    longestTaskMs: Math.max(0, ...taskSpans.map(([x, y]) => (y - x) / 1000)),
    paint: phaseCost(events, a, b),
  };
}
