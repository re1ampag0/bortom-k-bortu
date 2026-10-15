// L1: the Legends through «?fxScene=<id>» — «Армада Компании», «Кракен», «Корабль в бутылке», «Джек ускользает»
// (the scenes armada, kraken, bottle, jack of the reference). For each Legend two frames of the game — «the seal»
// (the seal has landed on the card) and «the effect» (the galleons fire / the tentacles hold the ship / the little ship
// is in the bottle / the compass rose and «Ускользнул!») — at 1366×660 and 430×932 go to docs/screenshots/l1/, the
// frames of the reference (docs/mockups/anim/level1/anim-demo.html) at the same moments of its clips to
// docs/screenshots/l1/ref/: a moment is found by the same condition on both pages (the milliseconds from the load are in
// docs/screenshots/l1/times.json, for capture.mjs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { clickMisses, expectResult, open, playing, readCover, watchCover } from './fx-scene';

const SHOTS = 'docs/screenshots/l1';
const TIMES = `${SHOTS}/times.json`;
const REF = pathToFileURL(resolve('docs/mockups/anim/level1/anim-demo.html')).href;
/** The longest a label may cover a part of a plank: the short mark at a number lasts 700 ms (MARK_MS). */
const FLASH_MS = 800;
/** The shouts of the effects stay as in the reference (the decision of the user): not explanations. */
const SHOUTS = ['Бортовой залп!', 'Чпок!'];

const shown = (sel: string, op = 0.98) => `Array.from(document.querySelectorAll('.fx-layer ${sel}')).some((e) => Number(getComputedStyle(e).opacity) > ${op})`;
/** The seal has landed on the card (its fall lasts 260 ms; at 80 % it is opaque). */
const SEAL = shown('> .lg-seal');
interface Legend {
  scene: string;
  /** The ship that plays the Legend: the strip of its card. */
  owner: string;
  /** The moment of its own effect. */
  effect: string;
  after: number;
  /** jack: the Volley that sinks «Жемчужина» comes first (A2, its pill «−2» is not changed by S1): the labels are
   *  measured from the moment the ship starts to sink — the clip of the Legend. */
  from?: string;
}
const LEGENDS: Legend[] = [
  // the galleons have risen, the first broadside flies
  { scene: 'armada', owner: 'И', effect: shown('> .galleon'), after: 700 },
  // the fourth tentacle holds the ship, the squeeze, the cells crack
  { scene: 'kraken', owner: 'Г', effect: `Array.from(document.querySelectorAll('.fx-layer > .tentacle')).filter((e) => Number(getComputedStyle(e).opacity) > 0.98).length === 4`, after: 400 },
  // the little ship is in the bottle, the cork comes
  { scene: 'bottle', owner: 'М', effect: shown('> .bottle .mini'), after: 150 },
  // the compass rose and «Ускользнул!»
  { scene: 'jack', owner: 'Ж', effect: shown('> .lg-shout'), after: 150, from: `!!document.querySelector('[data-fx-instruction]')?.textContent?.includes('тонет')` },
];
const SIZES: [number, number][] = [[1366, 660], [430, 932]];

function saveTime(key: string, scene: string, ms: number, ref: number) {
  const all: Record<string, { scene: string; ms: number; ref: number }> = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')) : {};
  all[key] = { scene, ms, ref };
  writeFileSync(TIMES, JSON.stringify(all, null, 2) + '\n');
}
async function shot(page: Page, ready: string, after: number, file: string): Promise<number> {
  await page.waitForFunction(ready, null, { timeout: 30_000, polling: 'raf' });
  if (after) await page.waitForTimeout(after);
  const ms = await page.evaluate(() => Math.round(performance.now()));
  await page.screenshot({ path: file });
  return ms;
}
/** The frames of the reference at the same moments of its clips: anim-demo.html?cap=<scene>, the same conditions. */
async function refFrames(browser: Browser, l: Legend, width: number, height: number): Promise<number[]> {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${REF}?cap=${l.scene}&speed=1`);
  const size = `${width}x${height}`;
  const a = await shot(page, SEAL, 200, `${SHOTS}/ref/ref-${l.scene}-seal-${size}.png`);
  const b = await shot(page, l.effect, l.after, `${SHOTS}/ref/ref-${l.scene}-effect-${size}.png`);
  await page.close();
  return [a, b];
}

/**
 * From the load the page notes the moments of the entrance: the last frame the card, the seal or the scroll is seen,
 * the first frame the caption «ЛЕГЕНДА …» of the top bar is full; and, while the caption is up (the effect plays on the
 * open table), every part of a plank the thin bars or the caption cover.
 */
const WATCH = () => {
  const w = window as unknown as { __lg: { lastIntro: number; capFull: number; under: string[] } };
  w.__lg = { lastIntro: 0, capFull: 0, under: [] };
  const meet = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  const op = (e: Element) => Number(getComputedStyle(e).opacity);
  const tick = () => {
    const now = performance.now();
    if (Array.from(document.querySelectorAll('.fx-layer > .lg-card, .fx-layer > .lg-seal, .fx-layer > .lg-title')).some((e) => op(e) > 0.05)) w.__lg.lastIntro = now;
    const cap = document.querySelector('.fx-layer > .lg-cap');
    if (cap && op(cap) > 0.95) {
      if (!w.__lg.capFull) w.__lg.capFull = now;
      const parts = Array.from(document.querySelectorAll('.plank-head, [data-fx-statuses], [data-fx-track], .badges > *')).map((e) => ({ e, r: e.getBoundingClientRect() })).filter((x) => x.r.width > 0);
      for (const el of Array.from(document.querySelectorAll('.fx-layer > .lg-bar, .fx-layer > .lg-cap'))) {
        const r = el.getBoundingClientRect();
        for (const x of parts) {
          if (!meet(r, x.r)) continue;
          const what = `${el.className} over ${x.e.closest('[data-fx-ship]')?.getAttribute('data-fx-ship')} ${x.e.getAttribute('data-fx-track') ?? x.e.className}`;
          if (!w.__lg.under.includes(what)) w.__lg.under.push(what);
        }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

test.describe('the Legends through ?fxScene', () => {
  test.beforeAll(() => mkdirSync(`${SHOTS}/ref`, { recursive: true }));

  for (const l of LEGENDS) {
    for (const [width, height] of SIZES) {
      test(`${l.scene} ${width}×${height}: the seal and the effect next to the reference, the card, no label over the planks, the result`, async ({ browser }) => {
        const page = await browser.newPage({ viewport: { width, height } });
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.addInitScript(WATCH);
        await open(page, l.scene);
        if (l.from) await page.waitForFunction(l.from, null, { timeout: 30_000, polling: 'raf' });
        await watchCover(page);
        const size = `${width}x${height}`;
        const seal = await shot(page, SEAL, 200, `${SHOTS}/game-${l.scene}-seal-${size}.png`);

        // The seal: «ЛЕГЕНДА • ЛЕГЕНДА •» around the circle, the letters do not run into each other and the end does not
        // meet the start (the angle along the arc from its top, clockwise, as the path goes).
        const ring = await page.evaluate(() => {
          const tp = document.querySelector<SVGTextContentElement>('.fx-layer > .lg-seal text')!;
          const ang = (p: DOMPoint) => { const a = Math.atan2(p.x - 46, -(p.y - 46)); return a < -1e-6 ? a + 2 * Math.PI : a; };
          const n = tp.getNumberOfChars();
          const chars = Array.from({ length: n }, (_, i) => ({ s: ang(tp.getStartPositionOfChar(i)), e: ang(tp.getEndPositionOfChar(i)) }));
          let overlap = 0;
          for (let i = 0; i + 1 < n; i++) overlap = Math.max(overlap, chars[i].e - chars[i + 1].s);
          // the gap from the end of the last «•» to the start of the first «Л», in user units along the arc (r = 27)
          const wrap = (2 * Math.PI - chars[n - 1].e + chars[0].s) * 27;
          return { text: tp.textContent, n, length: Math.round(tp.getComputedTextLength()), overlap: overlap * 27, wrap };
        });
        expect(ring.text).toBe('ЛЕГЕНДА • ЛЕГЕНДА •');
        expect(ring.overlap, 'the letters of the seal overlap').toBeLessThanOrEqual(0.05);
        expect(ring.wrap, 'the end of the seal meets its start').toBeGreaterThanOrEqual(2);

        // The card: the strip «ЛЕГЕНДА · <ship>» of the colour of its ship, its text not under 10 px on screen.
        const foot = await page.evaluate(() => {
          const card = document.querySelector<HTMLElement>('.fx-layer > .lg-card')!, f = card.querySelector<HTMLElement>('.fcard-foot')!;
          const scale = card.getBoundingClientRect().width / card.offsetWidth;
          return { text: f.textContent, bg: getComputedStyle(f).backgroundColor, px: parseFloat(getComputedStyle(f).fontSize) * scale };
        });
        const ships: Record<string, { nick: string; color: string }> = JSON.parse(readFileSync('data/game-data.json', 'utf8')).ships.reduce((m: Record<string, unknown>, s: { code: string }) => ({ ...m, [s.code]: s }), {});
        const hex = ships[l.owner].color;
        const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
        expect(foot.text).toBe(`ЛЕГЕНДА · ${ships[l.owner].nick.toUpperCase()}`);
        expect(foot.bg).toBe(rgb);
        expect(foot.px).toBeGreaterThanOrEqual(10);

        const effect = await shot(page, l.effect, l.after, `${SHOTS}/game-${l.scene}-effect-${size}.png`);
        if (l.scene === 'kraken') {
          // The tentacles hold «Месть»: the hooked tip of each is turned to the middle of the plank (from its base).
          const tips = await page.evaluate(() => {
            const lay = document.querySelector('.fx-layer')!.getBoundingClientRect();
            const pr = document.querySelector('[data-fx-ship="М"]')!.getBoundingClientRect(), mid = pr.left + pr.width / 2;
            return Array.from(document.querySelectorAll<HTMLElement>('.fx-layer > .tentacle')).map((t) => {
              const side = Number(t.dataset.side), w = t.offsetWidth, L = t.offsetHeight;
              const m = new DOMMatrix().translate(w / 2, L).multiply(new DOMMatrix(getComputedStyle(t).transform)).translate(-w / 2, -L);
              // the hook of the picture: (48, 12) of 60×200, mirrored for the tentacles of the right side
              const tip = m.transformPoint(new DOMPoint(((side > 0 ? 12 : 48) / 60) * w, (12 / 200) * L));
              const base = m.transformPoint(new DOMPoint(w / 2, L));
              return { side, toMiddle: Math.sign(tip.x - base.x) === Math.sign(mid - (base.x + lay.left)) };
            });
          });
          expect(tips.map((x) => x.toMiddle)).toEqual([true, true, true, true]);
        }
        const refs = await refFrames(browser, l, width, height);
        saveTime(`${l.scene}-seal-${size}`, l.scene, seal, refs[0]);
        saveTime(`${l.scene}-effect-${size}`, l.scene, effect, refs[1]);

        await expectResult(page, l.scene);
        const seen = await readCover(page);
        for (const [what, t] of Object.entries(seen.cover)) if (!SHOUTS.some((x) => what.startsWith(`«${x}»`))) expect(t, what).toBeLessThanOrEqual(FLASH_MS);
        expect(seen.touch, 'explanations in the middle on a plank').toEqual([]);
        const lg = await page.evaluate(() => (window as unknown as { __lg: { lastIntro: number; capFull: number; under: string[] } }).__lg);
        // the card, the seal and the scroll are gone when the entrance ends (the caption of the top bar is up)
        expect(lg.capFull).toBeGreaterThan(0);
        expect(lg.lastIntro).toBeLessThanOrEqual(lg.capFull);
        expect(lg.under, 'the thin bars and the caption over the planks').toEqual([]);
        expect(errors).toEqual([]);
        await page.close();
      });
    }
  }

  test('a press on the table during the entrance shows the result at once', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'kraken');
    await page.waitForFunction(SEAL, null, { polling: 'raf' });
    const g = (await page.locator('[data-fx-gap]').boundingBox())!;
    await page.mouse.click(g.x + g.width / 2, g.y + g.height / 2);
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 2_000 });
    await expectResult(page, 'kraken');
  });

  test('simple effects: no rays, no particles, no sparks in the four Legends', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await page.addInitScript(() => {
      const w = window as unknown as { __rich: string[] };
      w.__rich = [];
      const RICH = ['lg-sun', 'lg-orbit', 'gold-dust', 'sparkle', 'spark', 'splinter', 'shred', 'dust', 'ring', 'puff'];
      new MutationObserver((ms) => {
        for (const m of ms) for (const n of Array.from(m.addedNodes)) if (n instanceof HTMLElement && n.parentElement?.matches('.fx-layer')) for (const c of RICH) if (n.classList.contains(c) && !w.__rich.includes(c)) w.__rich.push(c);
      }).observe(document, { subtree: true, childList: true });
    });
    for (const l of LEGENDS) {
      await open(page, l.scene, 'fast', '&rich=0');
      await playing(page);
      await expectResult(page, l.scene);
      expect(await page.evaluate(() => (window as unknown as { __rich: string[] }).__rich), l.scene).toEqual([]);
    }
  });

  test('reduced motion and «мгновенно»: the layer draws nothing, the table is the result', async ({ browser }) => {
    for (const [opts, speed] of [[{ reducedMotion: 'reduce' as const }, 'normal'], [{}, 'instant']] as const) {
      const page = await browser.newPage({ viewport: { width: 1366, height: 660 }, ...opts });
      await page.addInitScript(() => {
        const w = window as unknown as { __drawn: number };
        w.__drawn = 0;
        new MutationObserver(() => { w.__drawn += document.querySelectorAll('.fx-layer > *').length; }).observe(document, { subtree: true, childList: true });
      });
      await open(page, 'kraken', speed);
      await expectResult(page, 'kraken');
      expect(await page.evaluate(() => (window as unknown as { __drawn: number }).__drawn), speed).toBe(0);
      await page.close();
    }
  });

  test('kraken: the entrance takes no press — the planks and the hand under the bars and the darkening; a card of the hand opens during the show', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'kraken');
    await page.waitForFunction(SEAL, null, { polling: 'raf' });
    expect(await page.locator('.fx-layer > .lg-veil').count()).toBe(1);
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
    await page.locator('[data-fx-hand] [data-fx-card]').first().click();
    await expect(page.getByTestId('card-detail')).toBeVisible();
    // the show goes on: the Legend is still in the layer, the scene has not ended
    expect(await page.evaluate(() => !document.body.dataset.fxDone && !!document.querySelector('.fx-layer > .lg-bar'))).toBe(true);
  });
});

test('the four Legends play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  let scene = '';
  const note = (text: string) => {
    errors.push(text);
    console.log(`[iphone ${scene}] ${text}`);
  };
  page.on('pageerror', (e) => note(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
  await page.addInitScript(() => {
    const w = window as unknown as { __sawSeal: boolean };
    w.__sawSeal = false;
    new MutationObserver(() => {
      if (document.querySelector('.fx-layer > .lg-seal')) w.__sawSeal = true;
    }).observe(document, { subtree: true, childList: true });
  });
  for (const l of LEGENDS) {
    scene = l.scene;
    await open(page, scene, 'fast');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(errors, scene).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sawSeal: boolean }).__sawSeal), `${scene}: the layer showed the entrance`).toBe(true);
    expect(await page.locator('.fx-layer > *').count(), scene).toBe(0);
  }
});
