// ui-press: the presses of a phone in the real Game, an isolated e2e build with measurement-only counters (a Vite plugin;
// the site has none). 390×844, DPR 3, CPU ×4, one person against the bots, presses hit-tested.
// node scripts/ui-press/measure.mjs LABEL [--root DIR] [--reuse] [--dist LABEL] [--profile] [--only volley|alarm]
// Each window: 1.5 s from the press (the event's own time) or, for «Тревога!» opening, from the insertion of its sheet.
//   volley chain (seed 1, the Pirates): charge-open («Залп» of «Жемчужина» → the sheet «Заряд»), charge-cancel («Отмена»),
//     lift-play (Ж-04 lifted in the hand → «Сыграть» → the sheet with it), fire («Огонь!» at «Индевор» → the card flies);
//   alarm chain (seed 8, the Company): alarm-open (the bots' Volley → «Тревога!»), alarm-fold («Свернуть»),
//     alarm-unfold («Вернуться»), react-play (a Reaction chosen in the sheet → «Сыграть» → the card flies).
// --profile: a second kind of run with the CPU profiler on (component times by function name; its trace numbers are not
// used for the table — the profiler adds its own work).
import {build, preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {gzipSync} from 'node:zlib';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {mainCosts} from '../fx-smooth-c/trace-metrics.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const label = args.find((a, i) => !a.startsWith('--') && !(i > 0 && ['--root', '--dist', '--only'].includes(args[i - 1]))) ?? 'before';
const root = resolve(opt('--root') ?? '.');
const outDir = resolve(`tmp/ui-press/m-${opt('--dist') ?? label}-dist`);
const OUT = 'docs/screenshots/ui-press/measure';
mkdirSync(OUT, {recursive: true});
mkdirSync('tmp/ui-press', {recursive: true});
const WINDOW = 1500;

// counters: renders of the big parts of the table (memo'd Plank and the hand by a line inside them; the others by a wrapper
// over the exported function — a function declaration is a live binding, the importers get the wrapper)
const count = (name) => `{const m=window.fxCpu;if(m?.active)m.count[${JSON.stringify(name)}]=(m.count[${JSON.stringify(name)}]??0)+1;}`;
// (a memo'd component — `export const X = memo(...)`, an object — gets the wrapper on its inner function instead)
const wrap = (names, code) => '\n' + names.map((n) => new RegExp(`export const ${n} = `).test(code)
  ? `{const t=${n}.type;${n}.type=function(p){${count(n)}return t(p);};}`
  : `{const o=${n};${n}=function(p){${count(n)}return o(p);};}`).join('\n');
const inject = {
  name: 'ui-press-counters', enforce: 'post',
  transform(code, id) {
    const must = (out, what) => { if (out === code) throw new Error(`[measure] no hook for ${what} in ${id}`); return out; };
    if (id.endsWith('/src/ui/game/Game.tsx')) return must(code.replace(/(const version = useSyncExternalStore\()/,
      `const __t0 = performance.now(); useLayoutEffect(() => { const m = window.fxCpu; if (m?.active) m.renders.push({at: __t0 - m.start, ms: performance.now() - __t0}); });\n  $1`), 'Game renders');
    if (id.endsWith('/src/ui/game/Table.tsx')) return must(code.replace('const d = shipData(data, ship.code);', count('Plank') + 'const d = shipData(data, ship.code);'), 'Plank') + wrap(['StatusBar', 'TeamRow', 'TopHold', 'SeaChip'], code);
    if (id.endsWith('/src/ui/game/Hand.tsx')) return must(must(code.replace('const holder = s.ships[seat];', count('Hand') + 'const holder = s.ships[seat];'), 'Hand')
      .replace(/(const textRef = useWholeLines\()/, count('HandCard') + '$1'), 'HandCard');
    if (id.endsWith('/src/ui/game/Overlays.tsx')) return code + wrap(['LogList'], code);
    if (id.endsWith('/src/ui/game/Panels.tsx')) return code + wrap(['ChargeSheet', 'ChargeButtons'], code);
    if (id.endsWith('/src/ui/game/Alarm.tsx')) return code + wrap(['ReactionSheet'], code);
    if (id.endsWith('/src/ui/game/TableThings.tsx')) return code + wrap(['TableThings', 'TableBackdrop'], code);
  },
};
if (!flag('--reuse')) await build({root, configFile: resolve(root, 'vite.config.ts'), mode: 'e2e', logLevel: 'warn', plugins: [inject], build: {outDir, emptyOutDir: true, minify: false}});
const server = await preview({root, configFile: resolve(root, 'vite.config.ts'), build: {outDir}, preview: {host: '127.0.0.1', port: 5188, strictPort: true}});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'});
const results = [];
try {
  if (opt('--only') !== 'alarm') results.push(...await chain('volley'));
  if (opt('--only') !== 'volley') results.push(...await chain('alarm'));
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
const tag = `${label}${flag('--profile') ? '-profile' : ''}${flag('--why') ? '-why' : ''}`;
writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(results, null, 1) + '\n');
console.log(`\n| Сцена | До кадра, мс | Худший кадр, мс | Game (число / макс, мс) | Компоненты | Style, мс (элементов, раз) | Layout, мс (узлов dirty/всего, раз) | Paint, мс (раз) | Принуд. Style/Layout, мс |`);
console.log('|---|---:|---:|---|---|---|---|---|---|');
for (const r of results) console.log(`| ${r.scene} | ${r.firstFrameMs.toFixed(0)} | ${r.worstFrameMs.toFixed(0)} | ${r.renders.length} / ${Math.max(0, ...r.renders.map((x) => x.ms)).toFixed(0)} | ${Object.entries(r.count).map(([k, v]) => `${k} ${v}`).join(', ')} | ${r.style.ms.toFixed(1)} (${r.style.elements}, ${r.style.count}) | ${r.layout.ms.toFixed(1)} (${r.layout.dirty}/${r.layout.total}, ${r.layout.count}) | ${r.paint.ms.toFixed(1)} (${r.paint.count}) | ${r.forced.style.toFixed(1)} / ${r.forced.layout.toFixed(1)} |`);

async function chain(kind) {
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
  await context.addInitScript(() => {
    let seed = 19427;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    window.fxCpu = {active: false, start: 0, renders: [], count: {}, frames: [], press: null, alarmAt: null};
    const tick = (t) => { if (window.fxCpu.active) window.fxCpu.frames.push(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    // the press: the event's own time (as the window «нажатие» of ?perf=1 takes it)
    for (const type of ['click']) addEventListener(type, (e) => { if (window.fxCpu.active) window.fxCpu.press ??= e.timeStamp; }, {capture: true, passive: true});
    // «Тревога!» opens without a press: the moment its sheet is in the document
    new MutationObserver(() => { const m = window.fxCpu; if (m.alarmAt === null && document.querySelector('.alarm-sheet')) m.alarmAt = performance.now(); })
      .observe(document, {childList: true, subtree: true});
  });
  const page = await context.newPage(), cdp = await context.newCDPSession(page), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const busy = () => page.evaluate(() => document.querySelector('.game')?.hasAttribute('data-fx-busy') ?? false);
  const myTurn = () => page.evaluate(() => { const b = [...document.querySelectorAll('[data-testid="end-turn"]')].find((e) => e.getClientRects().length); return !!b && b.getAttribute('aria-disabled') !== 'true'; });
  const tap = (id) => tapEl(page.getByTestId(id).filter({visible: true}).first());
  const tapEl = async (el) => {
    await expect(el).toBeVisible();
    const position = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      for (const fy of [0.5, 0.25, 0.75, 0.15]) for (const fx of [0.5, 0.25, 0.75]) {
        const x = r.x + r.width * fx, y = r.y + r.height * fy, t = document.elementFromPoint(x, y);
        if (t && (e === t || e.contains(t))) return {x: r.width * fx, y: r.height * fy};
      }
      throw new Error('No reachable point');
    });
    await el.click({position});
  };
  const quiet = async () => {
    let since = 0;
    await expect.poll(async () => {
      if ((await busy()) || !(await myTurn())) { since = 0; return false; }
      since ||= Date.now();
      return Date.now() - since >= 1500;
    }, {timeout: 120000, intervals: [200]}).toBe(true);
  };
  const traceOptions = {categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,v8.execute' + (flag('--why') ? ',disabled-by-default-devtools.timeline.invalidationTracking,disabled-by-default-devtools.timeline.stack' : ''), transferMode: 'ReturnAsStream'};
  /** Trace one window: act() presses (or waits for the alarm), the window is 1.5 s from the press. */
  const measure = async (scene, act, from = 'press') => {
    await page.evaluate(() => { const m = window.fxCpu; m.renders = []; m.count = {}; m.frames = []; m.press = null; });
    await cdp.send('Tracing.start', traceOptions);
    if (flag('--profile')) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 200}); await cdp.send('Profiler.start'); }
    await page.evaluate(() => { performance.mark('cpu-start'); const m = window.fxCpu; m.start = performance.now(); m.anchor = performance.getEntriesByName('cpu-start').at(-1).startTime; m.active = true; });
    await act();
    const t0 = await page.evaluate((f) => f === 'alarm' ? window.fxCpu.alarmAt : window.fxCpu.press, from);
    if (t0 == null) throw new Error(`${scene}: no ${from}`);
    await page.waitForFunction((t) => performance.now() >= t + 1500 + 100, t0);
    await page.evaluate(() => { window.fxCpu.active = false; performance.mark('cpu-end'); });
    let profile = null;
    if (flag('--profile')) { profile = (await cdp.send('Profiler.stop')).profile; await cdp.send('Profiler.disable'); }
    const ended = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.end');
    const {stream} = await ended;
    const chunks = [];
    for (;;) { const c = await cdp.send('IO.read', {handle: stream}); chunks.push(c.base64Encoded ? Buffer.from(c.data, 'base64') : Buffer.from(c.data)); if (c.eof) break; }
    await cdp.send('IO.close', {handle: stream});
    const raw = Buffer.concat(chunks);
    writeFileSync(`tmp/ui-press/${scene}-${label}${flag('--profile') ? '-profile' : ''}-trace.json.gz`, gzipSync(raw));
    const events = JSON.parse(raw.toString()).traceEvents;
    const m = await page.evaluate(() => window.fxCpu);
    const mark = events.find((e) => e.name === 'cpu-start');
    const at = (perf) => mark.ts + (perf - m.anchor) * 1000;
    const a = at(t0), b = at(t0 + WINDOW);
    const costs = mainCosts(events, a, b);
    const rows = events.filter((e) => e.ph === 'X' && e.pid === mark.pid && e.tid === mark.tid && e.ts >= a && e.ts < b);
    const style = rows.filter((e) => e.name === 'UpdateLayoutTree' || e.name === 'RecalculateStyles');
    const layout = rows.filter((e) => e.name === 'Layout');
    const paint = rows.filter((e) => e.name === 'Paint');
    const frames = m.frames.filter((t) => t > t0 && t <= t0 + WINDOW);
    const gaps = [frames[0] - t0, ...frames.slice(1).map((t, i) => t - frames[i])];
    const r = {
      scene, label, viewport: '390×844 DPR3 CPU×4', errors: errors.splice(0),
      firstFrameMs: frames[0] - t0, worstFrameMs: Math.max(...gaps), framesOver50: gaps.filter((g) => g > 50).length,
      renders: m.renders.filter((x) => x.at + m.start >= t0 - 1).map((x) => ({at: +(x.at + m.start - t0).toFixed(1), ms: +x.ms.toFixed(1)})),
      count: m.count,
      style: {ms: costs.recalcStyleMs, count: style.length, elements: style.reduce((n, e) => n + (e.args?.elementCount ?? e.args?.data?.elementCount ?? 0), 0)},
      layout: {ms: costs.layoutMs, count: layout.length, dirty: layout.reduce((n, e) => n + (e.args?.beginData?.dirtyObjects ?? 0), 0), total: Math.max(0, ...layout.map((e) => e.args?.beginData?.totalObjects ?? 0))},
      paint: {ms: costs.paint.paint.totalMs, count: paint.length},
      forced: {style: costs.forcedStyle.ms, layout: costs.forcedLayout.ms, styleCount: costs.forcedStyle.count, layoutCount: costs.forcedLayout.count},
      scriptingMs: costs.scriptingMs, longTasks: costs.longTasks, longestTaskMs: costs.longestTaskMs,
      // the biggest single records of the window, with the JS that forced them
      top: rows.filter((e) => ['UpdateLayoutTree', 'Layout', 'Paint', 'FunctionCall', 'EventDispatch', 'FireAnimationFrame', 'TimerFire'].includes(e.name)).sort((x, y) => (y.dur ?? 0) - (x.dur ?? 0)).slice(0, 8)
        .map((e) => ({name: e.name, t: +((e.ts - a) / 1000).toFixed(1), ms: +((e.dur ?? 0) / 1000).toFixed(1), elements: e.args?.elementCount, dirty: e.args?.beginData?.dirtyObjects, stack: (e.args?.beginData?.stackTrace ?? e.args?.data?.stackTrace ?? []).slice(0, 3).map((s) => `${s.functionName}:${s.lineNumber}`)})),
    };
    // the profile and the trace share one clock (microseconds)
    // --why: what invalidated the style, by reason and node (the trace's invalidation tracking; it adds work — not for the table)
    if (flag('--why')) {
      const why = new Map();
      for (const e of events) if (e.ts >= a && e.ts < b && /InvalidationTracking/.test(e.name)) {
        const d = e.args?.data ?? {};
        const k = `${e.name.replace('InvalidationTracking', '')} | ${d.reason ?? d.changedClass ?? d.changedAttribute ?? d.changedId ?? d.changedPseudo ?? ''} | ${d.nodeName ?? ''} | ${(d.invalidationList ?? []).map((x) => x.classes?.join('.') ?? x.id ?? '').join(',').slice(0, 80)}`;
        why.set(k, (why.get(k) ?? 0) + 1);
      }
      r.why = [...why].sort((x, y) => y[1] - x[1]).slice(0, 40);
      r.stacks = rows.filter((e) => (e.name === 'UpdateLayoutTree' || e.name === 'Layout') && (e.dur ?? 0) > 20000).map((e) => ({name: e.name, t: +((e.ts - a) / 1000).toFixed(1), ms: +((e.dur ?? 0) / 1000).toFixed(1), stack: (e.args?.beginData?.stackTrace ?? []).slice(0, 4).map((x) => `${x.functionName}@${x.url?.split('/').pop()}:${x.lineNumber}`)}));
    }
    if (profile) r.components = inclusive(profile, [a, b]);
    console.log(`${scene}: first ${r.firstFrameMs.toFixed(0)} worst ${r.worstFrameMs.toFixed(0)} renders ${r.renders.map((x) => x.ms).join('/')} style ${r.style.ms.toFixed(0)} layout ${r.layout.ms.toFixed(0)} paint ${r.paint.ms.toFixed(0)}${r.errors.length ? ' errors=' + r.errors.join(' | ') : ''}`);
    return r;
  };
  const out = [];
  if (kind === 'volley') {
    await page.goto('http://127.0.0.1:5188/bortom-k-bortu/?seed=1&speed=normal&hints=0&perf=0&particleProbe=0');
    for (const id of ['quick-bots', 'pick-pirates', 'prep-start', 'placement-done']) await tap(id);
    await quiet();
    out.push(await measure('charge-open', () => tap('volley-Ж')));
    out.push(await measure('charge-cancel', () => tap('cancel-volley')));
    await expect(page.locator('.charge-sheet')).toHaveCount(0);
    await tapEl(page.locator('[data-fx-hand] [data-fx-card="Ж-04"]').first());
    await page.waitForTimeout(800);
    out.push(await measure('lift-play', () => tap('lift-play')));
    await expect(page.locator('.charge-sheet .cs-card.on')).toHaveCount(1);
    await tap('plate-И');
    await page.waitForTimeout(500);
    out.push(await measure('fire', () => tap('fire')));
  } else {
    await page.goto('http://127.0.0.1:5188/bortom-k-bortu/?seed=8&speed=normal&hints=0&perf=0&particleProbe=0');
    for (const id of ['quick-bots', 'pick-company', 'prep-start', 'placement-done']) await tap(id);
    // the window opens when the sheet is inserted (the bots' turn and its show come first)
    out.push(await measure('alarm-open', () => expect(page.locator('.alarm-sheet')).toHaveCount(1, {timeout: 120000}), 'alarm'));
    await page.waitForTimeout(500);
    out.push(await measure('alarm-fold', () => tap('alarm-collapse')));
    await page.waitForTimeout(500);
    out.push(await measure('alarm-unfold', () => tap('alarm-expand')));
    await page.waitForTimeout(500);
    await tapEl(page.locator('.alarm-sheet .as-card:not(.off) .hcard').first());
    await page.waitForTimeout(500);
    out.push(await measure('react-play', () => tap('play-reaction')));
  }
  await context.close();
  return out;
}

/** Inclusive CPU time by function name inside [from, to] (microseconds of the profile clock). */
function inclusive(profile, [from, to]) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n])), parent = new Map();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const incl = new Map();
  let t = profile.startTime;
  profile.samples.forEach((id, i) => {
    t += profile.timeDeltas[i] ?? 0;
    if (t < from || t > to) return;
    const dt = (profile.timeDeltas[i + 1] ?? 0) / 1000, seen = new Set();
    for (let x = id; x != null; x = parent.get(x)) {
      const f = byId.get(x).callFrame, k = f.functionName || '(anon)';
      if (seen.has(k)) continue;
      seen.add(k);
      incl.set(k, (incl.get(k) ?? 0) + dt);
    }
  });
  const wanted = ['Game', 'PlankView', 'PlankRow', 'Hand', 'HandCard', 'StatusBar', 'TeamRow', 'TopHold', 'LogList', 'ChargeSheet', 'ChargeButtons', 'ReactionSheet', 'TableThings', 'TableBackdrop', 'FxLayer', 'Shown', 'ShownLog', 'performWorkUntilDeadline', 'commitRoot', 'renderRootSync'];
  return Object.fromEntries(wanted.filter((k) => incl.has(k)).map((k) => [k, +incl.get(k).toFixed(1)]));
}
