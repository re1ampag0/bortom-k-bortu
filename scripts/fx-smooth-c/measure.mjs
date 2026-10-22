// fx-smooth-c: the real Game in an isolated e2e build with measurement-only counters (a Vite plugin; the site has none).
// node scripts/fx-smooth-c/measure.mjs LABEL [scene ...] [--reuse] [--dist LABEL] [--root DIR]
// Scenes: volley (Volley without a Charge), hit (Volley with the Charge «Залп с обоих бортов»), card (the order «Право на
// переговоры» at «Индевор»),
// armada (the Legend of «Индевор»; its entrance is reported as the scene «legend»), idle (the table at rest, 10 s).
// 390×844, DPR 3, CPU ×4, seed 1, one person against the bots (Pirates; Company for the Armada); presses are hit-tested.
import {build, preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {gzipSync} from 'node:zlib';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {mainCosts} from './trace-metrics.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--root', '--dist'].includes(args[i - 1])));
const label = positional[0] ?? 'before';
const ALL = ['volley', 'hit', 'card', 'armada', 'idle'];
const scenes = positional.length > 1 ? positional.slice(1) : ALL;
const root = resolve(opt('--root') ?? '.');
const outDir = resolve(`tmp/fx-smooth-c/${opt('--dist') ?? label}-dist`);
const OUT = 'docs/screenshots/fx-smooth-c';
mkdirSync(OUT, {recursive: true});

const counter = (field) => `if(window.fxCpu?.active)window.fxCpu.${field}++;`;
const inject = {
  name: 'fx-smooth-c-counters', enforce: 'pre',
  transform(code, id) {
    const must = (out, what) => { if (out === code) console.warn(`[measure] no hook for ${what} in ${id}`); return out; };
    if (id.endsWith('/src/ui/game/Game.tsx')) return must(`import {useLayoutEffect as __fxULE} from 'react';\n` + code.replace('  const version = useSyncExternalStore(',
      `  const __fxT0 = performance.now();\n  __fxULE(() => { const m = window.fxCpu; if (m?.active) m.renders.push({at: __fxT0 - m.start, ms: performance.now() - __fxT0}); });\n  const version = useSyncExternalStore(`), 'Game renders');
    if (id.endsWith('/src/ui/game/Table.tsx')) return must(code.replace('  const d = shipData(data, ship.code);', counter('planks') + '\n  const d = shipData(data, ship.code);'), 'Plank renders');
    if (id.endsWith('/src/ui/game/Hand.tsx')) return must(code.replace('  const holder = s.ships[seat];', counter('hands') + '\n  const holder = s.ships[seat];'), 'Hand renders');
    if (id.endsWith('/src/ui/game/fx/legends.ts')) return must(code.replace(/(\n\s*const outro = await legendIntro\(ctx, c\.card, c\.seat[^\n]*;)/, `$1\n  if (window.fxCpu?.active) window.fxCpu.introEnd = performance.now() - window.fxCpu.start;`), 'the end of the Legend entrance');
    if (id.endsWith('/src/ui/game/fx/primitives.ts')) {
      // Native animations whose target lies inside a board-wide SVG (fxSvg), by the function that called A().
      return must(code.replace(/(export function A\(ctx: FxCtx, el: Element \| ParticleTarget, kf: Keyframe\[\], d: number, delay = 0[^\n]*\{\n)/,
        `$1  { const m = window.fxCpu; if (m?.active && !('particle' in el) && el.closest?.('svg.fx-svg')) { const f = (new Error().stack ?? '').split('\\n').slice(2).map((l) => l.trim().replace(/^at /, '').split(' ')[0]).find((n) => n && n !== 'A') ?? '?'; m.svg.push([performance.now() - m.start, f]); } }\n`), 'svg animations');
    }
  },
};
if (!flag('--reuse')) await build({root, configFile: resolve(root, 'vite.config.ts'), mode: 'e2e', logLevel: 'warn', plugins: [inject], build: {outDir, emptyOutDir: true, minify: false}});
if(flag('--build-only'))process.exit(0);
const server = await preview({root, configFile: resolve(root, 'vite.config.ts'), build: {outDir}, preview: {host: '127.0.0.1', port: 5187, strictPort: true}});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium'});
const summary = [];
try {
  for (const scene of scenes) summary.push(...await run(scene));
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
writeFileSync(`${OUT}/${label}-summary.json`, JSON.stringify(summary, null, 1) + '\n');
console.log('\n| Сцена | Длинные задачи | Самая длинная, мс | Худший кадр, мс | Recalculate Style, мс | Scripting, мс | Рендеры Game (сумма / макс, мс) |');
console.log('|---|---:|---:|---:|---:|---:|---|');
for (const r of summary) console.log(`| ${r.scene} | ${r.longTasks} | ${r.longestTaskMs.toFixed(0)} | ${r.worstFrameMs.toFixed(0)} | ${r.recalcStyleMs.toFixed(0)} | ${r.scriptingMs.toFixed(0)} | ${r.renders} (${r.renderMs.toFixed(0)} / ${r.renderMaxMs.toFixed(1)}) |`);

async function run(scene) {
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
  await context.addInitScript(() => {
    let seed = 19427;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    window.fxCpu = {active: false, harness: false, start: 0, end: 0, renders: [], planks: 0, hands: 0, svg: [], frames: [], tasks: [], introEnd: null};
    const tick = (t) => { if (window.fxCpu.active) window.fxCpu.frames.push(t - window.fxCpu.start); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    new PerformanceObserver((list) => {
      const m = window.fxCpu;
      for (const e of list.getEntries()) if (m.active && e.startTime >= m.start) m.tasks.push({start: e.startTime - m.start, duration: e.duration});
    }).observe({type: 'longtask', buffered: false});
  });
  const page = await context.newPage(), cdp = await context.newCDPSession(page), errors = [], layers = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const busy = () => page.evaluate(() => { const g = document.querySelector('.game'); return !!g && (g.classList.contains('fx-busy') || g.hasAttribute('data-fx-busy')); });
  const settle = async (ms = 60000) => { await expect.poll(busy, {timeout: ms, intervals: [100]}).toBe(false); };
  const tap = async (id) => tapEl(page.getByTestId(id).filter({visible: true}).first(), id);
  const tapEl = async (el, name) => {
    await expect(el).toBeVisible();
    const position = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      for (const fy of [0.5, 0.25, 0.75]) for (const fx of [0.5, 0.25, 0.75]) {
        const x = r.x + r.width * fx, y = r.y + r.height * fy, t = document.elementFromPoint(x, y);
        if (t && (e === t || e.contains(t))) return {x: r.width * fx, y: r.height * fy};
      }
      throw new Error('No reachable point');
    });
    await el.click({position});
    return name;
  };
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  await cdp.send('LayerTree.enable');
  let latestLayers;
  cdp.on('LayerTree.layerTreeDidChange', (e) => { latestLayers={all:e.layers?.length??0,drawing:e.layers?.filter(l=>l.drawsContent).length??0};if(recording)layers.push(latestLayers); });
  let recording = false;
  await page.goto('http://127.0.0.1:5187/bortom-k-bortu/?seed=1&speed=normal&hints=0&perf=0&particleProbe=0');
  // one person against the bots: the whole show plays (two people on one device hand it over behind the curtain)
  const mine = scene === 'armada' ? 'pick-company' : 'pick-pirates';
  for (const id of ['quick-bots', mine, 'prep-start', 'placement-done']) await tap(id);
  const myTurn = () => page.evaluate(() => { const b = [...document.querySelectorAll('[data-testid="end-turn"]')].find((e) => e.getClientRects().length); return !!b && b.getAttribute('aria-disabled') !== 'true'; });
  // the player's turn and no show for 1.5 s on end (between two shows of the bots «busy» drops for a moment)
  let quietSince = 0;
  await expect.poll(async () => {
    if ((await busy()) || !(await myTurn())) { quietSince = 0; return false; }
    quietSince ||= Date.now();
    return Date.now() - quietSince >= 1500;
  }, {timeout: 120000, intervals: [200]}).toBe(true);

  const sum = (code) => page.evaluate((c) => [...document.querySelectorAll(`[data-fx-ship="${c}"] [data-fx-value]`)].reduce((n, v) => n + parseInt(v.textContent), 0), code);
  let check = async () => true, act;
  if (scene === 'volley') {
    await tap('volley-Ж'); await tap('plate-И');
    const before = await sum('И');
    act = () => tap('fire');
    check = async () => (await sum('И')) < before;
  } else if (scene === 'hit') {
    await tap('volley-Ж'); await tap('plate-И');
    await tapEl(page.locator('.charge-sheet [data-fx-card="Ж-04"]').filter({visible: true}).first(), 'charge Ж-04');
    await expect(page.locator('.charge-sheet .cs-card.on')).toHaveCount(1);
    const before = (await sum('И')) + (await sum('Г'));
    act = () => tap('fire');
    check = async () => (await sum('И')) + (await sum('Г')) < before;
  } else if (scene === 'card') {
    await tapEl(page.locator('[data-fx-hand] [data-fx-card="Ж-14"]').first(), 'card Ж-14');
    await tap('lift-play');
    await tap('plate-И');
    act = () => tap('play-card');
    check = async () => (await page.locator('[data-fx-hand] [data-fx-card="Ж-14"]').count()) === 0;
  } else if (scene === 'armada') {
    await tap('star-И');
    await page.getByRole('button', {name: 'Разыграть Легенду', exact: true}).click();
    await expect(page.getByTestId('legend-confirm')).toBeVisible();
    const before = await sum('Ж');
    act = () => tapEl(page.getByTestId('legend-confirm').getByRole('button', {name: /^Сыграть/}), 'legend-confirm');
    check = async () => (await sum('Ж')) < before;
  }

  if(scene==='idle')writeFileSync(`${OUT}/idle-${label}-animations.json`,JSON.stringify(await page.evaluate(()=>document.getAnimations().map(a=>({name:a.animationName??'',target:a.effect?.target?.outerHTML?.slice(0,200),frames:a.effect?.getKeyframes()}))),null,1));
  await cdp.send('Tracing.start', {categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,v8.execute,cc', transferMode: 'ReturnAsStream'});
  recording = true;if(latestLayers)layers.push(latestLayers);
  await page.evaluate(() => { performance.mark('cpu-start'); window.fxCpu.start = performance.now(); window.fxCpu.active = true; });
  let finished = scene === 'idle';
  if (scene === 'idle') await page.waitForTimeout(10000);
  else {
    if (flag('--profile')) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 200}); await cdp.send('Profiler.start'); }
    await act();
    if (flag('--profile')) {
      await page.waitForTimeout(1500);
      const {profile} = await cdp.send('Profiler.stop');
      const self = new Map(), byId = new Map(profile.nodes.map((n) => [n.id, n])), dt = profile.timeDeltas;
      const hits = new Map();
      profile.samples.forEach((id, i) => hits.set(id, (hits.get(id) ?? 0) + (dt[i] ?? 0)));
      for (const [id, us] of hits) { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) ?? 0) + us / 1000); }
      // inclusive time by function name
      const parent = new Map(); for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
      const incl = new Map();
      for (const [id, us] of hits) { const seen = new Set(); for (let x = id; x != null; x = parent.get(x)) { const n = byId.get(x); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`; if (seen.has(k)) continue; seen.add(k); incl.set(k, (incl.get(k) ?? 0) + us / 1000); } }
      writeFileSync(`tmp/fx-smooth-c/${scene}-${label}-profile.json`, JSON.stringify({self: [...self].sort((a, b) => b[1] - a[1]).slice(0, 60), incl: [...incl].sort((a, b) => b[1] - a[1]).slice(0, 120)}, null, 1));
    }
    const limit = Date.now() + 90000;
    while (Date.now() < limit) {
      // done: the show is over, the result is on the table and the turn is the player's again
      if (!(await busy()) && (await check()) && (await myTurn())) { finished = true; break; }
      await page.waitForTimeout(100);
    }
  }
  await page.evaluate(() => { window.fxCpu.end = performance.now(); window.fxCpu.active = false; performance.mark('cpu-end'); });
  recording = false;
  await page.waitForTimeout(200);
  const ended = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end');
  const {stream} = await ended;
  const chunks = [];
  for (;;) { const c = await cdp.send('IO.read', {handle: stream}); chunks.push(c.base64Encoded ? Buffer.from(c.data, 'base64') : Buffer.from(c.data)); if (c.eof) break; }
  await cdp.send('IO.close', {handle: stream});
  const raw = Buffer.concat(chunks);
  const events = JSON.parse(raw.toString()).traceEvents;
  const start = events.find((e) => e.name === 'cpu-start').ts, end = events.find((e) => e.name === 'cpu-end').ts;
  const m = await page.evaluate(() => window.fxCpu);
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem('bortom-fx-trace') ?? '[]').slice(0, 20).reverse());
  await context.close();
  writeFileSync(`tmp/fx-smooth-c/${scene}-${label}-trace.json.gz`, gzipSync(raw));

  const result = (name, a, b, from, to) => {
    const costs = mainCosts(events, a, b);
    const paint = {ms: costs.paint.paint.totalMs, rasterMs: costs.paint.raster.totalMs};
    delete costs.paint;
    const frames = m.frames.filter((t) => t >= from && t <= to), gaps = frames.slice(1).map((t, i) => t - frames[i]);
    const renders = m.renders.filter((r) => r.at >= from && r.at <= to);
    const byFn = {};
    for (const [at, f] of m.svg) if (at >= from && at <= to) byFn[f] = (byFn[f] ?? 0) + 1;
    const svg = Object.entries(byFn).sort((x, y) => y[1] - x[1]);
    const r = {scene: name, label, viewport: '390×844 DPR3 CPU×4', valid: finished && errors.length === 0, errors, journal, elapsedMs: to - from,
      ...costs, paint, worstFrameMs: Math.max(0, ...gaps), framesOver50: gaps.filter((g) => g > 50).length,
      fps: gaps.length ? (1000 * gaps.length) / (to - from) : 0,
      renders: renders.length, renderMs: renders.reduce((s, x) => s + x.ms, 0), renderMaxMs: Math.max(0, ...renders.map((x) => x.ms)),
      renderList: renders.map((x) => [Math.round(x.at), +x.ms.toFixed(1)]), planks: m.planks, hands: m.hands,
      layers: {all: Math.max(0, ...layers.map((l) => l.all)), drawing: Math.max(0, ...layers.map((l) => l.drawing))},
      observerLongTasks: m.tasks.filter((t) => t.start >= from && t.start <= to).length,
      svgAnimations: svg.reduce((s, [, n]) => s + n, 0), svgByFunction: Object.fromEntries(svg)};
    writeFileSync(`${OUT}/${name}-${label}.json`, JSON.stringify(r, null, 1) + '\n');
    console.log(`${name}: valid=${r.valid} renders=${r.renders} longTasks=${r.longTasks} longest=${r.longestTaskMs.toFixed(0)} worst=${r.worstFrameMs.toFixed(0)} style=${r.recalcStyleMs.toFixed(0)} script=${r.scriptingMs.toFixed(0)}${errors.length ? ' errors=' + errors.join(' | ') : ''}`);
    return r;
  };
  const out = [result(scene, start, end, 0, m.end - m.start)];
  if (scene === 'armada' && m.introEnd != null) out.unshift(result('legend', start, start + m.introEnd * 1000, 0, m.introEnd));
  return out;
}
