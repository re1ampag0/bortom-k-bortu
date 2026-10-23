// ui-press, step 3: the hand of a phone with a lifted card, the same moments in two builds, and the pixel difference.
// node scripts/ui-press/lift.mjs LABEL [--root DIR] [--reuse] [--dist LABEL] [--reduce]   (--reduce: prefers-reduced-motion)
//   builds tmp/ui-press/LABEL-dist (vite mode e2e) from DIR (default: this copy) and shoots 430×932 and 375×667:
//   rest — the hand without a lifted card; more — a lifted card with «Продать»/«Передать»; plain — a lifted card without them.
// node scripts/ui-press/lift.mjs --compare BEFORE AFTER — side by side and the differing pixels of each pair.
import {build, preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {PNG} from 'pngjs';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const OUT = 'docs/screenshots/ui-press';
mkdirSync(OUT, {recursive: true});
const SIZES = [[430, 932], [375, 667]];
const SHOTS = ['rest', 'more', 'plain'];

if (flag('--compare')) {
  const [, before, after] = args;
  const rows = [];
  for (const [w, h] of SIZES) for (const shot of SHOTS) {
    const name = (label) => `${OUT}/lift-${w}x${h}-${shot}-${label}.png`;
    let a, b;
    try { a = PNG.sync.read(readFileSync(name(before))); b = PNG.sync.read(readFileSync(name(after))); } catch { continue; }
    let differ = 0;
    const out = new PNG({width: a.width * 2 + 8, height: Math.max(a.height, b.height)});
    out.data.fill(255);
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4, o = (y * out.width + x) * 4, p = (y * out.width + x + a.width + 8) * 4;
      for (let c = 0; c < 4; c++) { out.data[o + c] = a.data[i + c]; out.data[p + c] = b.data[i + c]; }
      if (Math.max(...[0, 1, 2].map((c) => Math.abs(a.data[i + c] - b.data[i + c]))) > 6) differ++;
    }
    writeFileSync(`${OUT}/lift-${w}x${h}-${shot}-comparison.png`, PNG.sync.write(out));
    rows.push({size: `${w}×${h}`, shot, differ, of: a.width * a.height});
  }
  writeFileSync(`${OUT}/lift-differences.json`, JSON.stringify(rows, null, 1) + '\n');
  console.table(rows);
  process.exit(0);
}

const label = args.find((a, i) => !a.startsWith('--') && !(i > 0 && ['--root', '--dist'].includes(args[i - 1]))) ?? 'after';
const root = resolve(opt('--root') ?? '.');
const outDir = resolve(`tmp/ui-press/${opt('--dist') ?? label}-dist`);
if (!flag('--reuse')) await build({root, configFile: resolve(root, 'vite.config.ts'), mode: 'e2e', logLevel: 'warn', build: {outDir, emptyOutDir: true}});
const server = await preview({root, configFile: resolve(root, 'vite.config.ts'), build: {outDir}, preview: {host: '127.0.0.1', port: 5191, strictPort: true}});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'});
try {
  for (const [w, h] of SIZES) {
    const context = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: flag('--reduce') ? 'reduce' : 'no-preference'});
    await context.addInitScript(() => {
      let seed = 19427;
      Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const tap = async (el) => {
      await expect(el).toBeVisible();
      const position = await el.evaluate((e) => {
        const r = e.getBoundingClientRect();
        for (const fy of [0.5, 0.25, 0.75, 0.1]) for (const fx of [0.5, 0.25, 0.75]) {
          const x = r.x + r.width * fx, y = r.y + r.height * fy, t = document.elementFromPoint(x, y);
          if (t && (e === t || e.contains(t))) return {x: r.width * fx, y: r.height * fy};
        }
        throw new Error('No reachable point');
      });
      await el.click({position});
    };
    await page.goto('http://127.0.0.1:5191/bortom-k-bortu/?seed=1&speed=instant&hints=0');
    for (const id of ['quick-bots', 'pick-pirates', 'prep-start', 'placement-done']) await tap(page.getByTestId(id).filter({visible: true}).first());
    await expect.poll(() => page.evaluate(() => {
      const b = [...document.querySelectorAll('[data-testid="end-turn"]')].find((e) => e.getClientRects().length);
      return !!b && b.getAttribute('aria-disabled') !== 'true';
    }), {timeout: 60000}).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const cards = page.locator('[data-fx-hand] .hand-cards > .hcard[data-fx-card]');
    const codes = await cards.evaluateAll((list) => list.map((e) => e.getAttribute('data-fx-card')));
    const probes = {};
    const shot = async (name) => {
      await page.screenshot({path: `${OUT}/lift-${w}x${h}-${name}-${label}.png`});
      // the cards of the strip and the lifted card: where they stand and how they look (computed style), to compare builds
      probes[name] = await page.evaluate(() => {
        const keys = ['width', 'height', 'rotate', 'translate', 'scale', 'opacity', 'margin-top', 'margin-left', 'z-index', 'box-shadow', 'font-size', 'visibility'];
        const row = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return {card: e.getAttribute('data-card') ?? e.className, rect: [r.left, r.top, r.width, r.height].map((x) => +x.toFixed(1)), style: Object.fromEntries(keys.map((k) => [k, cs.getPropertyValue(k)]))}; };
        const strip = document.querySelector('[data-fx-hand] .hand-cards');
        const lifted = document.querySelector('.hcard.lifted');
        const all = (e) => [e, ...e.querySelectorAll('*')].map((x) => { const cs = getComputedStyle(x); return [x.className, [...cs].filter((k) => !/^(transition|animation|inset|top|left|right|bottom|position|transform)/.test(k)).map((k) => `${k}:${cs.getPropertyValue(k)}`).join(';')]; });
        return {scroll: strip.scrollLeft, strip: [...strip.children].map(row), lifted: lifted && {...row(lifted), all: all(lifted)}};
      });
    };
    await shot('rest');
    const found = {};
    const lift = async (code) => { await tap(page.locator(`[data-fx-hand] [data-fx-card="${code}"]`).first()); await page.waitForTimeout(800); };
    // more: the first card of the hand (on the first turn every card can be sold and passed)
    found.more = codes[0];
    await lift(found.more);
    await expect(page.locator('[data-testid="lift-sell"], [data-testid="lift-pass"]')).toHaveCount(2);
    await shot('more');
    // plain: once a card is sold and another passed this turn, the next lifted card has no extra actions
    // before the fix the button can lie under the edge of the strip (375×667): pressed by script, not by a finger
    await page.getByTestId('lift-sell').evaluate((e) => e.click());
    await page.waitForTimeout(300);
    const left = await cards.evaluateAll((list) => list.map((e) => e.getAttribute('data-fx-card')));
    await lift(left[0]);
    await page.getByTestId('lift-pass').evaluate((e) => e.click());
    await page.waitForTimeout(300);
    found.plain = (await cards.evaluateAll((list) => list.map((e) => e.getAttribute('data-fx-card'))))[0];
    await lift(found.plain);
    await expect(page.locator('[data-testid="lift-sell"], [data-testid="lift-pass"]')).toHaveCount(0);
    await shot('plain');
    writeFileSync(`${OUT}/lift-${w}x${h}-${label}-probe.json`, JSON.stringify(probes, null, 1) + '\n');
    console.log(`${w}×${h}: more=${found.more ?? '—'} plain=${found.plain ?? '—'}${errors.length ? ' errors=' + errors.join(' | ') : ''}`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
