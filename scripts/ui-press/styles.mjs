// ui-press, step 2: the computed style of EVERY element of the page in the states of the sheets, in two builds, and the
// difference — «the winners of the rules stay the same» checked directly, not only by eye. Also a frame of each state.
// node scripts/ui-press/styles.mjs LABEL [--root DIR] [--reuse]      → tmp/ui-press/styles-LABEL.json + frames
// node scripts/ui-press/styles.mjs --compare BEFORE AFTER            → docs/screenshots/ui-press/styles-BEFORE-AFTER.json
// Custom properties (--*) are left out: step 2 moves them to the elements that read them; what they produce is compared.
// prefers-reduced-motion and every animation paused at 0: the same instant in both builds.
import {build, preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {PNG} from 'pngjs';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const OUT = 'docs/screenshots/ui-press/styles';
mkdirSync(OUT, {recursive: true});
mkdirSync('tmp/ui-press/styles', {recursive: true});

if (flag('--compare')) {
  const [, before, after] = args;
  const a = JSON.parse(readFileSync(`tmp/ui-press/styles-${before}.json`, 'utf8')), b = JSON.parse(readFileSync(`tmp/ui-press/styles-${after}.json`, 'utf8'));
  const report = {};
  for (const state of Object.keys(a)) {
    if (!b[state]) { report[state] = 'нет в «после»'; continue; }
    const x = a[state].els, y = b[state].els, rows = [];
    for (const path of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (!(path in x) || !(path in y)) { rows.push({path, only: path in x ? 'before' : 'after'}); continue; }
      const p = Object.fromEntries(x[path].split('\n').map((l) => l.split('\t'))), q = Object.fromEntries(y[path].split('\n').map((l) => l.split('\t')));
      const diff = Object.keys({...p, ...q}).filter((k) => k !== 'contain' && p[k] !== q[k]).map((k) => `${k}: ${p[k]} → ${q[k]}`);
      if (diff.length) rows.push({path, diff});
    }
    // the frames of the state
    let pixels = null;
    try {
      const fa = PNG.sync.read(readFileSync(`tmp/ui-press/styles/${before}-${state}.png`)), fb = PNG.sync.read(readFileSync(`tmp/ui-press/styles/${after}-${state}.png`));
      pixels = 0;
      const side = new PNG({width: fa.width * 2 + 8, height: fa.height});
      side.data.fill(255);
      for (let yy = 0; yy < fa.height; yy++) for (let xx = 0; xx < fa.width; xx++) {
        const i = (yy * fa.width + xx) * 4, j = (yy * side.width + xx) * 4, k = (yy * side.width + xx + fa.width + 8) * 4;
        if (Math.max(...[0, 1, 2].map((c) => Math.abs(fa.data[i + c] - fb.data[i + c]))) > 6) pixels++;
        for (let c = 0; c < 4; c++) { side.data[j + c] = fa.data[i + c]; side.data[k + c] = fb.data[i + c]; }
      }
      writeFileSync(`${OUT}/${state}-comparison.png`, PNG.sync.write(side));
    } catch { /* no frame */ }
    report[state] = {elements: Object.keys(x).length, differ: rows.length, pixels, rows: rows.slice(0, 40)};
    console.log(`${state}: ${Object.keys(x).length} elements, ${rows.length} differ, ${pixels} pixels`);
  }
  writeFileSync(`docs/screenshots/ui-press/styles-${before}-${after}.json`, JSON.stringify(report, null, 1) + '\n');
  process.exit(0);
}

const label = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--root')) ?? 'after';
const root = resolve(opt('--root') ?? '.');
const outDir = resolve(`tmp/ui-press/st-${label}-dist`);
if (!flag('--reuse')) await build({root, configFile: resolve(root, 'vite.config.ts'), mode: 'e2e', logLevel: 'warn', build: {outDir, emptyOutDir: true}});
const server = await preview({root, configFile: resolve(root, 'vite.config.ts'), build: {outDir}, preview: {host: '127.0.0.1', port: 5194, strictPort: true}});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'});
const result = {};
try {
  for (const [w, h, name] of [[430, 932, 'phone'], [375, 667, 'small'], [1366, 660, 'laptop']]) {
    for (const chain of ['volley', 'alarm']) await run(w, h, name, chain);
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
writeFileSync(`tmp/ui-press/styles-${label}.json`, JSON.stringify(result));
console.log(Object.keys(result).join(' '));

async function run(w, h, name, chain) {
  const phone = w <= 700;
  const context = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone, reducedMotion: 'reduce'});
  await context.addInitScript(() => {
    let seed = 19427;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  });
  const page = await context.newPage();
  const tap = async (el) => {
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
  const id = (x) => page.getByTestId(x).filter({visible: true}).first();
  const myTurn = () => page.evaluate(() => { const b = [...document.querySelectorAll('[data-testid="end-turn"]')].find((e) => e.getClientRects().length); return !!b && b.getAttribute('aria-disabled') !== 'true'; });
  const dump = async (state) => {
    await page.waitForTimeout(600);
    await page.evaluate(() => document.fonts.ready);
    const els = await page.evaluate(() => {
      for (const a of document.getAnimations()) { try { a.pause(); a.currentTime = 0; } catch { /* finished */ } }
      const out = {};
      const pathOf = (e) => { const parts = []; for (let n = e; n && n !== document.body; n = n.parentElement) parts.unshift(`${n.tagName.toLowerCase()}${n.classList.length ? '.' + [...n.classList].filter((c) => !/^(alarm-open|alarm-folded|charge-open|has-sheet|has-dock|has-info|under-window|decision-open|alarm-dock|with-strip|with-memo|with-foot)$/.test(c)).join('.') : ''}:${[...(n.parentElement?.children ?? [])].indexOf(n)}`); return parts.join('>'); };
      for (const e of document.body.querySelectorAll('*')) {
        if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
        for (const pseudo of [null, '::before', '::after']) {
          const cs = getComputedStyle(e, pseudo);
          if (pseudo && cs.content === 'none') continue;
          out[pathOf(e) + (pseudo ?? '')] = [...cs].filter((k) => !k.startsWith('--')).map((k) => `${k}\t${cs.getPropertyValue(k)}`).join('\n');
        }
      }
      return out;
    });
    await page.screenshot({path: `tmp/ui-press/styles/${label}-${name}-${chain}-${state}.png`});
    result[`${name}-${chain}-${state}`] = {els};
  };
  if (chain === 'volley') {
    await page.goto('http://127.0.0.1:5194/bortom-k-bortu/?seed=1&speed=instant&hints=0');
    for (const x of ['quick-bots', 'pick-pirates', 'prep-start', 'placement-done']) await tap(id(x));
    await expect.poll(myTurn, {timeout: 60000}).toBe(true);
    await dump('rest');
    await tap(id('volley-Ж'));
    await expect(page.locator('.charge-sheet')).toBeVisible();
    await dump('charge');
    // a window over the sheet: the ship of «Месть» (its head; the targets are plates while aiming)
    await page.getByTestId('plank-М').locator('.plank-head').click({position: {x: 8, y: 8}});
    await expect(page.locator('.sheet-backdrop')).toBeVisible();
    await dump('charge-window');
    await page.locator('.sheet .close').first().click();
    await tap(id('cancel-volley'));
    // a decision sheet: «Право на переговоры» — the card's own panel
    if (phone) { await tap(page.locator('[data-fx-hand] [data-fx-card="Ж-14"]').first()); await page.waitForTimeout(400); await tap(id('lift-play')); }
    else { await tap(page.locator('[data-fx-hand] [data-fx-card="Ж-14"]').first()); await tap(id('detail-play')); }
    await expect(page.locator('.decision-dock')).toBeVisible();
    await dump('decision');
  } else {
    await page.goto('http://127.0.0.1:5194/bortom-k-bortu/?seed=8&speed=instant&hints=0');
    for (const x of ['quick-bots', 'pick-company', 'prep-start', 'placement-done']) await tap(id(x));
    await expect(page.getByTestId('reaction-panel').filter({visible: true})).toHaveCount(1, {timeout: 60000});
    await dump('alarm');
    // (375×667: the head of the sheet has no room for «Свернуть» — the same in main; that state is left out there)
    if (await page.getByTestId('alarm-collapse').evaluate((e) => { const r = e.getBoundingClientRect(); return r.right <= innerWidth && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }).catch(() => false)) {
      await tap(id('alarm-collapse'));
      await expect(id('alarm-expand')).toBeVisible();
      await dump('alarm-folded');
    }
  }
  await context.close();
}
