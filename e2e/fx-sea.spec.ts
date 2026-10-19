// S1: the sea cards through «?fxScene=sea-<key>» — the 17 cards of the reference. For each card a frame of the game at
// the moment «the effect on the planks» (the card has flown into the sea chip, +600 ms) goes to docs/screenshots/s1/,
// and a frame of the reference (docs/mockups/anim/level1/anim-demo.html) at the same moment of its own clip goes to
// docs/screenshots/s1/ref/: the moment is found by the same condition on both pages, not by the milliseconds from the
// load (they are in docs/screenshots/s1/times.json, for capture.mjs). On the planks no label covers the head, the
// chips, a track or a badge for longer than a short flash; the rules in the middle never touch a plank.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { clickMisses, expectResult, open, playing, readCover, watchCover } from './fx-scene';

const SHOTS = 'docs/screenshots/s1';
const TIMES = `${SHOTS}/times.json`;
const REF = pathToFileURL(resolve('docs/mockups/anim/level1/anim-demo.html')).href;
const KEYS = ['calm', 'wind', 'fog', 'storm', 'wave', 'maelstrom', 'clear', 'mermaids', 'tortuga', 'rum', 'caravan', 'wet', 'reefs', 'thunder', 'fleet', 'moon', 'current'];
/** The longest a label may cover a part of a plank: the short mark at a number lasts 700 ms (MARK_MS). */
const FLASH_MS = 800;

/** The sea card has flown into the chip (it is there, faded out) — the changes on the planks begin. */
const CARD_GONE = `(() => { const c = document.querySelector('.fx-layer > .seacard'); return !!c && Number(getComputedStyle(c).opacity) < 0.02 && !!window.__seaSeen; })()`;
/** The sea card stands in the middle. */
const CARD_UP = `(() => { const c = document.querySelector('.fx-layer > .seacard'); return !!c && Number(getComputedStyle(c).opacity) > 0.98; })()`;
/** Both pages remember that the card has been seen (CARD_GONE before the card came is not the moment). */
const SEEN = () => {
  const w = window as unknown as { __seaSeen: boolean };
  w.__seaSeen = false;
  const look = () => {
    const c = document.querySelector('.fx-layer > .seacard');
    if (c && Number(getComputedStyle(c).opacity) > 0.9) w.__seaSeen = true;
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
};

function saveTime(key: string, scene: string, ms: number, ref: number) {
  const all: Record<string, { scene: string; ms: number; ref: number }> = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')) : {};
  all[key] = { scene, ms, ref };
  writeFileSync(TIMES, JSON.stringify(all, null, 2) + '\n');
}

/** The frame of the reference at the same moment of its clip: anim-demo.html?cap=<scene>, the same condition. */
async function refFrame(browser: Browser, scene: string, ready: string, after: number, width: number, height: number, file: string): Promise<number> {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(SEEN);
  await page.goto(`${REF}?cap=${scene}&speed=1`);
  await page.waitForFunction(ready, null, { timeout: 30_000, polling: 'raf' });
  await page.waitForTimeout(after);
  const ms = await page.evaluate(() => Math.round(performance.now()));
  await page.screenshot({ path: file });
  await page.close();
  return ms;
}

async function gameFrame(page: Page, scene: string, ready: string, after: number, file: string): Promise<number> {
  await page.waitForFunction(ready, null, { timeout: 30_000, polling: 'raf' });
  await page.waitForTimeout(after);
  const ms = await page.evaluate(() => Math.round(performance.now()));
  await page.screenshot({ path: file });
  return ms;
}

interface Frame {
  name: string;
  scene: string;
  ready: string;
  after: number;
  width: number;
  height: number;
  /** The same moment on the page of the reference, when it is found otherwise (the reference has a pill, not a mark). */
  refReady?: string;
}
const FRAMES: Frame[] = [
  ...KEYS.map((k) => ({ name: `sea-${k}`, scene: `sea-${k}`, ready: CARD_GONE, after: 600, width: 1366, height: 660 })),
  { name: 'sea-storm', scene: 'sea-storm', ready: CARD_GONE, after: 600, width: 430, height: 932 },
  // a card with the table darkened: «Лунный свет» darkens it most (0.4)
  { name: 'sea-moon-card', scene: 'sea-moon', ready: CARD_UP, after: 300, width: 430, height: 932 },
  // the start of a turn: the Fire of «Индевор», «Голландец» under water with its Souls next to it — the mark «−1» at the Hull
  { name: 'turn-fire', scene: 'turn', ready: `Array.from(document.querySelectorAll('.fx-layer > .tmark')).some((e) => Number(getComputedStyle(e).opacity) > 0.95)`, after: 0, width: 430, height: 932, refReady: `Array.from(document.querySelectorAll('.fx-layer > .pill')).some((e) => Number(getComputedStyle(e).opacity) > 0.95)` },
];

test.describe('the sea cards through ?fxScene', () => {
  test.beforeAll(() => mkdirSync(`${SHOTS}/ref`, { recursive: true }));

  for (const f of FRAMES) {
    test(`${f.name} ${f.width}×${f.height}: the frame next to the reference, no label over the planks, the result`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width: f.width, height: f.height } });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(SEEN);
      await open(page, f.scene);
      await watchCover(page);
      const file = `${f.name}-${f.width}x${f.height}.png`;
      const ms = await gameFrame(page, f.scene, f.ready, f.after, `${SHOTS}/game-${file}`);
      if (f.scene === 'turn') {
        // the mark «−1» is at the Hull of «Индевор» (its Fire), «Голландец» is under water with its Souls
        const at = await page.evaluate(() => {
          const m = Array.from(document.querySelectorAll('.fx-layer > .tmark')).find((e) => Number(getComputedStyle(e).opacity) > 0.95)!;
          const r = m.getBoundingClientRect(), y = r.top + r.height / 2;
          const hull = document.querySelector('[data-fx-ship="И"] [data-fx-track="hull"]')!.getBoundingClientRect();
          return { text: m.textContent, inHull: y > hull.top && y < hull.bottom && r.right <= hull.right + 1 };
        });
        expect(at).toEqual({ text: '−1', inHull: true });
        await expect(page.locator('[data-fx-ship="Г"].submerged [data-fx-souls]')).toBeVisible();
        // no «Пожар жжёт Корпус»: no label is on screen
        expect(await page.evaluate(() => Array.from(document.querySelectorAll('.fx-layer > .tag')).filter((e) => Number(getComputedStyle(e).opacity) > 0.05).map((e) => e.textContent))).toEqual([]);
      }
      const ref = await refFrame(browser, f.scene, f.refReady ?? f.ready, f.after, f.width, f.height, `${SHOTS}/ref/ref-${file}`);
      saveTime(`${f.name}-${f.width}x${f.height}`, f.scene, ms, ref);

      await expectResult(page, f.scene);
      const seen = await readCover(page);
      for (const [what, t] of Object.entries(seen.cover)) expect(t, what).toBeLessThanOrEqual(FLASH_MS);
      expect(seen.touch, 'labels on a plank').toEqual([]);
      expect(errors).toEqual([]);
      await page.close();
    });
  }

  test('the rules in the middle never touch a plank on a phone (430×932, all 17 cards)', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 430, height: 932 });
    for (const k of KEYS) {
      await open(page, `sea-${k}`, 'fast');
      await watchCover(page);
      await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
      const seen = await readCover(page);
      expect(seen.touch, `sea-${k}: labels on a plank`).toEqual([]);
      for (const [what, t] of Object.entries(seen.cover)) expect(t, `sea-${k}: ${what}`).toBeLessThanOrEqual(FLASH_MS);
    }
  });

  test('the weather of the round: drawn with rich effects, standing still in simple ones, empty with reduced motion and at «мгновенно»', async ({ browser }) => {
    // FX-C (TASKS.md: «простые спецэффекты» — неподвижная погода): the picture is there, nothing in it moves
    const look = async (extra: string, opts: { reducedMotion?: 'reduce' } = {}, speed = 'normal') => {
      const page = await browser.newPage({ viewport: { width: 1366, height: 660 }, ...opts });
      await open(page, 'sea-fog', speed, extra);
      await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
      const r = await page.evaluate(() => ({ n: document.querySelectorAll('.fx-weather > *').length, moving: document.querySelector('.fx-weather')!.getAnimations({ subtree: true }).length }));
      await page.close();
      return r;
    };
    const rich = await look('');
    expect(rich.n).toBeGreaterThan(0); // «Туман»: the fog banks and the crossed diagonals
    expect(rich.moving).toBeGreaterThan(0);
    const simple = await look('&rich=0');
    expect(simple.n).toBeGreaterThan(0);
    expect(simple.moving, 'the weather stands still in simple effects').toBe(0);
    expect((await look('', { reducedMotion: 'reduce' })).n).toBe(0);
    expect((await look('', {}, 'instant')).n).toBe(0);
  });

  test('sea-storm: the darkening takes no press, the hand and the buttons are not under it; a card of the hand opens during the show', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'sea-storm');
    await playing(page);
    await page.waitForFunction(CARD_UP, null, { polling: 'raf' });
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
    // the darkening ends above the hand row
    const dim = await page.evaluate(() => {
      const d = document.querySelector('.fx-layer > .dim')!.getBoundingClientRect(), h = document.querySelector('[data-fx-hand]')!.getBoundingClientRect();
      return { dimBottom: Math.round(d.bottom), handTop: Math.round(h.top) };
    });
    expect(dim.dimBottom).toBeLessThanOrEqual(dim.handTop);
    await page.locator('[data-fx-hand] [data-fx-card]').first().click();
    await expect(page.getByTestId('card-detail')).toBeVisible();
    // the show goes on: the card of the sea is still in the layer, the scene has not ended
    expect(await page.evaluate(() => !document.body.dataset.fxDone && !!document.querySelector('.fx-layer > .seacard'))).toBe(true);
  });
});

test('the 17 sea cards play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(400_000);
  const errors: string[] = [];
  let scene = '';
  const note = (text: string) => {
    errors.push(text);
    console.log(`[iphone ${scene}] ${text}`);
  };
  page.on('pageerror', (e) => note(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
  await page.addInitScript(() => {
    const w = window as unknown as { __sawSea: boolean };
    w.__sawSea = false;
    new MutationObserver(() => {
      if (document.querySelector('.fx-layer > .seacard')) w.__sawSea = true;
    }).observe(document, { subtree: true, childList: true });
  });
  for (const k of KEYS) {
    scene = `sea-${k}`;
    await open(page, scene, 'fast');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(errors, scene).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sawSea: boolean }).__sawSea), `${scene}: the layer showed the card`).toBe(true);
    expect(await page.locator('.fx-layer > *').count(), scene).toBe(0);
  }
});

/** The show goes on: the scene has not ended and the layer draws. A press on the table would end it at once. */
const showOn = (page: Page) => page.evaluate(() => !document.body.dataset.fxDone && document.querySelectorAll('.fx-layer > *').length > 0);

test.describe('the badges explain themselves (phone 430×932)', () => {
  test.use({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });

  test('a press on «Пожар» opens its rule during the show and does not end it; a press outside closes the window', async ({ page }) => {
    await open(page, 'turn', 'slow');
    await playing(page);
    // the chip «Под водой» first («Голландец» surfaces later in the scene): its window, «×» closes it
    await page.locator('[data-fx-ship="Г"] [data-fx-status="Под водой"]').tap();
    await expect(page.getByTestId('info-pop')).toContainText('нельзя выбрать целью');
    expect(await showOn(page)).toBe(true);
    await page.getByTestId('info-close').tap();
    await expect(page.getByTestId('info-pop')).toHaveCount(0);
    expect(await showOn(page)).toBe(true);
    const fire = page.getByTestId('fire-И');
    // the zone of the press is at least 44 × 44 px: the points 21 px around the middle of the badge give the badge
    const zone = await fire.evaluate((el) => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.max(21, r.width / 2 - 1), h = Math.max(21, r.height / 2 - 1);
      return [[cx, cy - h], [cx, cy + h], [cx - d, cy], [cx + d, cy]].map(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-info]') === el);
    });
    expect(zone).toEqual([true, true, true, true]);
    await fire.tap();
    await expect(page.getByTestId('info-pop')).toBeVisible();
    await expect(page.getByTestId('info-pop')).toContainText('−1 Корпус за каждый Пожар');
    expect(await showOn(page)).toBe(true);
    // the window is inside the screen
    const box = (await page.getByTestId('info-pop').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(8);
    expect(box.x + box.width).toBeLessThanOrEqual(430 - 8);
    // a press outside closes the window and nothing else: the show goes on
    await page.touchscreen.tap(215, 380);
    await expect(page.getByTestId('info-pop')).toHaveCount(0);
    expect(await showOn(page)).toBe(true);
  });
});

test('on a laptop the window of a badge opens on hover (Souls, 1366×660)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 660 });
  await open(page, 'turn', 'slow');
  await page.getByTestId('souls-Г').hover();
  await expect(page.getByTestId('info-pop')).toContainText('Только у «Голландца»');
  await page.mouse.move(5, 5);
  await expect(page.getByTestId('info-pop')).toHaveCount(0);
});

test('a press on «Пожар» opens its rule in Safari and keeps the show @iphone', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'turn', 'slow');
  await playing(page);
  await page.getByTestId('fire-И').tap();
  await expect(page.getByTestId('info-pop')).toBeVisible();
  expect(await showOn(page)).toBe(true);
  expect(errors).toEqual([]);
});
