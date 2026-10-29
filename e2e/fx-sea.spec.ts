// S1: the sea cards through «?fxScene=sea-<key>» — the 17 cards of the reference. For each card a frame of the game at
// the moment «the effect on the planks» (the card has flown into the sea chip, +600 ms) goes to e2e-shots/s1/,
// and a frame of the reference (docs/mockups/anim/level1/anim-demo.html) at the same moment of its own clip goes to
// e2e-shots/s1/ref/: the moment is found by the same condition on both pages, not by the milliseconds from the
// load (they are in e2e-shots/s1/times.json, for capture.mjs). On the planks no label covers the head, the
// chips, a track or a badge for longer than a short flash; the rules in the middle never touch a plank.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { clickMisses, expectResult, open, playing, readCover, watchCover } from './fx-scene';

const SHOTS = 'e2e-shots/s1';
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

  // A5 (A6): the merchantman of «Торговый караван» sails along the middle of the gap between the two rows of the planks (the real ones),
  // not along the lower planks, and touches no plank on its way.
  for (const [width, height] of [[1366, 660], [1920, 1080], [430, 932]] as const) {
    test(`sea-caravan ${width}×${height}: the merchantman sails along the middle of the gap`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await open(page, 'sea-caravan');
      await page.waitForFunction(() => { const s = document.querySelector('.lg-pitch'); return !!s && s.getBoundingClientRect().right > 0 && s.getBoundingClientRect().left < innerWidth; }, null, { timeout: 40_000, polling: 'raf' });
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => {
        const box = (e: Element) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
        const ship = box(document.querySelector('.lg-pitch')!), gap = box(document.querySelector('[data-fx-gap]')!);
        return { ship, gap, planks: Array.from(document.querySelectorAll('[data-fx-ship]')).map(box) };
      });
      const cy = (r.ship.t + r.ship.b) / 2, gy = (r.gap.t + r.gap.b) / 2;
      expect(Math.abs(cy - gy), 'the ship at the middle of the gap').toBeLessThanOrEqual(r.gap.b - r.gap.t > 0 ? (r.gap.b - r.gap.t) * 0.15 : 20);
      for (const p of r.planks) expect(r.ship.t >= p.b || r.ship.b <= p.t || r.ship.r <= p.l || r.ship.l >= p.r, 'the ship touches a plank').toBe(true);
    });
  }

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

  // A5 (B5): «Ясное небо» — a warm glow (a radial gradient, no disc, no rings) and 34 glints, only over the water: no glint and none of the
  // glow (a mask) lies on a plank; in simple effects the glow stands alone and still.
  for (const [width, height] of [[1366, 660], [430, 932]] as const) {
    test(`sea-clear ${width}×${height}: the glow and 34 glints over the water only; still glow in simple effects`, async ({ browser }) => {
      const look = async (extra: string) => {
        const page = await browser.newPage({ viewport: { width, height } });
        await open(page, 'sea-clear', 'normal', extra);
        await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 40_000 });
        await page.waitForTimeout(2400); // the glow has settled (1 → .8)
        const r = await page.evaluate(() => {
          const svg = document.querySelector('.fx-weather svg.wx-clear')!;
          const planks = Array.from(document.querySelectorAll('[data-fx-ship]')).map((p) => p.getBoundingClientRect());
          const glints = Array.from(svg.querySelectorAll('.sk')).map((g) => g.getBoundingClientRect());
          const mask = svg.querySelector('mask')!;
          return {
            glints: glints.length,
            onPlanks: glints.filter((g) => planks.some((p) => g.left < p.right && g.right > p.left && g.top < p.bottom && g.bottom > p.top)).length,
            masked: mask.querySelectorAll('rect[fill="#000"]').length,
            discs: svg.querySelectorAll('circle, ellipse').length,
            sun: !!svg.querySelector('radialGradient#wxSun'),
            opacity: Number(getComputedStyle(svg).opacity),
            moving: svg.getAnimations({ subtree: true }).length,
          };
        });
        await page.close();
        return r;
      };
      const rich = await look('');
      expect(rich.glints).toBeGreaterThanOrEqual(30);
      expect(rich.onPlanks, 'glints on a plank').toBe(0);
      expect(rich.masked, 'the planks are cut out of the glow').toBe(4);
      expect(rich.discs, 'no disc, no rings').toBe(0);
      expect(rich.sun).toBe(true);
      expect(rich.opacity, 'settled').toBeCloseTo(0.8, 1);
      expect(rich.moving).toBeGreaterThan(0);
      const simple = await look('&rich=0');
      expect(simple.glints, 'no glints standing still').toBe(0);
      expect(simple.moving).toBe(0);
      expect(simple.opacity).toBeCloseTo(0.8, 1);
    });
  }

  test('the planks pitch in «Буря» and stand still in simple effects and with «&wxStill=1»', async ({ browser }) => {
    const pitch = async (extra: string) => {
      const page = await browser.newPage({ viewport: { width: 1366, height: 660 } });
      await open(page, 'sea-storm', 'normal', extra);
      await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
      const r = await page.evaluate(() => Array.from(document.querySelectorAll('.planks > .plank')).map((p) => getComputedStyle(p).animationName));
      await page.close();
      return r;
    };
    expect(await pitch('')).toEqual(['wx-pitch', 'wx-pitch', 'wx-pitch', 'wx-pitch']);
    expect(await pitch('&rich=0'), 'simple effects').toEqual(['none', 'none', 'none', 'none']);
    expect(await pitch('&wxStill=1'), 'the switch of the tests').toEqual(['none', 'none', 'none', 'none']);
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

// ui-4: compare computed SVG paint and real geometry, not the number of registered animations.
test('maelstrom weather: the arms and wreckage keep moving @iphone', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 740 });
  await open(page, 'sea-maelstrom', 'normal', '&rich=1');
  await page.waitForFunction(() => document.body.dataset.fxDone === '1');
  const sample = () => page.locator('.fx-weather .wx-maelstrom').evaluate(svg => ({
    arms: Array.from(svg.querySelectorAll('.arm')).map(e => getComputedStyle(e).strokeDashoffset),
    debris: Array.from(svg.querySelectorAll('.db')).map(e => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y };
    }),
  }));
  const before = await sample();
  expect(before.arms).toHaveLength(6);
  expect(before.debris).toHaveLength(5);
  await page.waitForTimeout(2000);
  const after = await sample();
  for (let i = 0; i < before.arms.length; i++) expect(after.arms[i]).not.toBe(before.arms[i]);
  for (let i = 0; i < before.debris.length; i++) {
    expect(Math.hypot(after.debris[i].x - before.debris[i].x, after.debris[i].y - before.debris[i].y)).toBeGreaterThan(1);
  }
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
    // The visible chip stays 21 px high. Its invisible extension grows into the free space below;
    // the upper edge stops at the midpoint to the neighbouring track row.
    const zone = await fire.evaluate((el) => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2;
      const hit = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('[data-info]') === el;
      const above = el.closest('.plank')!.querySelector('.track:not(.t-hull) .info-hit')!;
      const t = above.getBoundingClientRect();
      return { height: r.height, hits: [hit(cx, r.top - 1), hit(cx, r.bottom + 20), hit(r.left - 1, r.top + 10), hit(r.right + 1, r.top + 10)],
        track: document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2)?.closest('[data-info]') === above };
    });
    expect(zone).toEqual({ height: 21, hits: [true, true, true, true], track: true });
    await fire.tap();
    await expect(page.getByTestId('info-pop')).toBeVisible();
    await expect(page.getByTestId('info-pop')).toContainText('теряется 1 Корпус за каждый Пожар');
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
