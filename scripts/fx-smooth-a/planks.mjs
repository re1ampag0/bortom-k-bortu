// The planks of all four ships on a phone, with their buttons (each side in its own turn against the bots), still:
// every CSS animation stands at its start. node scripts/fx-smooth-a/planks.mjs DIST LABEL [WIDTHxHEIGHT]
// With two labels already shot, --compare A B writes the pixel differences and side-by-side pictures.
import {preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {PNG} from 'pngjs';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';

const OUT = 'docs/screenshots/fx-smooth-a';
mkdirSync(OUT, {recursive: true});
const SHIPS = {'pick-pirates': ['Ж', 'М'], 'pick-company': ['И', 'Г']};

if (process.argv[2] === '--compare') {
  const [, , , a, b] = process.argv, report = {};
  for (const code of Object.values(SHIPS).flat()) {
    const pa = PNG.sync.read(readFileSync(`${OUT}/plank-${code}-${a}.png`)), pb = PNG.sync.read(readFileSync(`${OUT}/plank-${code}-${b}.png`));
    const w = Math.max(pa.width, pb.width), h = Math.max(pa.height, pb.height), side = new PNG({width: w, height: h * 2 + 12});
    let diff = pa.width === pb.width && pa.height === pb.height ? 0 : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = (p, xx, yy) => (xx < p.width && yy < p.height ? [...p.data.slice((yy * p.width + xx) * 4, (yy * p.width + xx) * 4 + 4)] : [0, 0, 0, 255]);
      const ca = px(pa, x, y), cb = px(pb, x, y);
      if (diff !== null && Math.max(...[0, 1, 2].map((c) => Math.abs(ca[c] - cb[c]))) > 6) diff++;
      side.data.set(ca, (y * w + x) * 4);
      side.data.set(cb, ((y + h + 12) * w + x) * 4);
    }
    writeFileSync(`${OUT}/plank-${code}-${a}-vs-${b}.png`, PNG.sync.write(side));
    report[code] = diff === null ? `size ${pa.width}×${pa.height} → ${pb.width}×${pb.height}` : diff;
  }
  writeFileSync(`${OUT}/planks-${a}-vs-${b}.json`, JSON.stringify(report, null, 1) + '\n');
  console.log(report);
  process.exit(0);
}

const [, , dist, label, size = '430x740'] = process.argv;
const [width, height] = size.split('x').map(Number);
const server = await preview({build: {outDir: dist}, preview: {host: '127.0.0.1', port: 5198, strictPort: true}});
const browser = await chromium.launch();
try {
  for (const [pick, ships] of Object.entries(SHIPS)) {
    const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => { let seed = 19427; Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); });
    await page.goto('http://127.0.0.1:5198/bortom-k-bortu/?seed=1&speed=fast&hints=0&perf=0');
    for (const id of ['quick-bots', pick, 'prep-start', 'placement-done']) await page.getByTestId(id).filter({visible: true}).first().click();
    const ready = () => page.evaluate(() => {
      const g = document.querySelector('.game'), end = [...document.querySelectorAll('[data-testid="end-turn"]')].find((e) => e.getClientRects().length);
      return !!g && !g.classList.contains('fx-busy') && !g.hasAttribute('data-fx-busy') && !!end && end.getAttribute('aria-disabled') !== 'true';
    });
    await expect.poll(ready, {timeout: 120000, intervals: [300]}).toBe(true);
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; } });
    for (const code of ships) {
      const plank = page.locator(`[data-fx-ship="${code}"]`);
      await plank.evaluate((e) => e.querySelector('.plank-buttons')?.scrollTo({left: 0, behavior: 'instant'}));
      await plank.screenshot({path: `${OUT}/plank-${code}-${label}.png`, animations: 'disabled'});
    }
    if (errors.length) console.log(pick, errors);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
