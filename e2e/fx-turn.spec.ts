// A4: the start of a turn, the played card, repairs, «Чёрная метка», a ship sunk by a card — through «?fxScene=<id>».
// For each moment a frame of the game goes to docs/screenshots/a4/, its milliseconds from the load of the page to
// docs/screenshots/a4/times.json; the frames of the reference are taken by capture.mjs into docs/screenshots/a4/ref/
// at the same milliseconds. After the show the numbers are the result of the scene and the layer is empty.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import type { Track } from '../src/engine/types';
import { clickMisses, expectResult, finalOf, open, playing } from './fx-scene';

const SHOTS = 'docs/screenshots/a4';
const TIMES = `${SHOTS}/times.json`;

interface Frame {
  name: string;
  scene: string;
  ready: string;
  after: number;
  width?: number;
  height?: number;
  /** The numbers only go down in the scene: none is ever below the result. */
  down: boolean;
}
const layerHas = (sel: string) => `!!document.querySelector('.fx-layer ${sel}')`;
const stampShown = (text: string) => `Array.from(document.querySelectorAll('.fx-layer .stamp-fx')).some((t) => t.textContent === ${JSON.stringify(text)} && Number(getComputedStyle(t).opacity) > 0.8)`;
const FRAMES: Frame[] = [
  { name: 'turn-fire', scene: 'turn', ready: layerHas('.ember'), after: 250, down: true },
  // the drawing: the backs fly to «Голландец» and the label «+2 карты» (not the Plan before it)
  { name: 'turn-draw', scene: 'turn', ready: `Array.from(document.querySelectorAll('.fx-layer .tag.plus')).some((t) => /^\\+\\d+ карт/.test(t.textContent))`, after: 150, down: true },
  { name: 'card', scene: 'card', ready: layerHas('.flyc'), after: 700, down: true },
  { name: 'card-hit', scene: 'card', ready: layerHas('.pill'), after: 100, down: true },
  { name: 'repair', scene: 'repair', ready: layerHas('.lg-aura'), after: 500, down: false },
  { name: 'mark', scene: 'mark', ready: layerHas('.blot'), after: 250, down: true },
  { name: 'mark-volley', scene: 'mark', ready: layerHas('.ball'), after: 250, down: true },
  { name: 'sink', scene: 'sink', ready: stampShown('Затонул'), after: 0, down: true },
  { name: 'turn-fire', scene: 'turn', ready: layerHas('.ember'), after: 250, width: 430, height: 932, down: true },
  { name: 'card', scene: 'card', ready: layerHas('.flyc'), after: 700, width: 430, height: 932, down: true },
];

function saveTime(key: string, scene: string, ms: number) {
  const all: Record<string, { scene: string; ms: number }> = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')) : {};
  all[key] = { scene, ms };
  writeFileSync(TIMES, JSON.stringify(all, null, 2) + '\n');
}

/** From now on the page remembers the lowest number each track showed. */
async function watchLows(page: Page) {
  await page.evaluate(() => {
    const low: Record<string, number> = {};
    const read = () => {
      for (const t of Array.from(document.querySelectorAll('[data-fx-ship] [data-fx-track]'))) {
        const key = `${t.closest('[data-fx-ship]')!.getAttribute('data-fx-ship')} ${t.getAttribute('data-fx-track')}`;
        const v = Number(t.querySelector('[data-fx-value]')!.textContent!.split('/')[0]);
        low[key] = Math.min(low[key] ?? v, v);
      }
    };
    read();
    new MutationObserver(read).observe(document.body, { subtree: true, childList: true, characterData: true });
    (window as unknown as { __lows: Record<string, number> }).__lows = low;
  });
}

/** The status chips of the planks: «code: label» with «(hidden)» while it waits for its clip. */
const chips = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-fx-ship] [data-fx-status]')).map(
      (c) => `${c.closest('[data-fx-ship]')!.getAttribute('data-fx-ship')}: ${c.dataset.fxStatus}${getComputedStyle(c).visibility === 'hidden' ? ' (hidden)' : ''}`,
    ),
  );

test.describe('the turn, the card, repairs and statuses through ?fxScene', () => {
  test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

  for (const f of FRAMES) {
    const width = f.width ?? 1366, height = f.height ?? 660;
    test(`${f.name} ${width}×${height}: the effect on the table, the frame, the result`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, f.scene);
      await watchLows(page);
      await page.waitForFunction(f.ready, null, { timeout: 20_000, polling: 'raf' });
      await page.waitForTimeout(f.after);
      const ms = await page.evaluate(() => Math.round(performance.now()));
      const during = await chips(page);
      await page.screenshot({ path: `${SHOTS}/game-${f.name}-${width}x${height}.png` });
      saveTime(`${f.name}-${width}x${height}`, f.scene, ms);

      if (f.name === 'mark') expect(during).toContain('М: Чёрная метка +2 (hidden)'); // the blot is still flying
      if (f.name === 'mark-volley') expect(during).toContain('М: Чёрная метка +2'); // it landed: the cannonballs hit it
      if (f.name === 'repair') {
        // P1: the green frame is on the ship mended — «Индевор», not «Голландец» that played the card
        const on = await page.evaluate(() => {
          const a = document.querySelector('.fx-layer .lg-aura')!.getBoundingClientRect();
          const x = a.left + a.width / 2, y = a.top + a.height / 2;
          return Array.from(document.querySelectorAll('[data-fx-ship]')).find((p) => { const r = p.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; })?.getAttribute('data-fx-ship');
        });
        expect(on).toBe('И');
      }
      if (f.name === 'card') {
        // the card lies at the middle; the ribbon says who played it
        await expect(page.locator('.fx-layer .flyc .rib')).toHaveCount(0);
        await expect(page.locator('.fx-layer .flyc .fcard-foot')).toHaveText('ГОЛЛАНДЕЦ');
        // the strip is a part of the card: nothing outside the frame, its text at least 10 px on screen
        const box = await page.evaluate(() => { const f = document.querySelector('.fx-layer .fcard')!.getBoundingClientRect(), t = document.querySelector('.fx-layer .fcard-foot')!; const b = t.getBoundingClientRect(); return { inside: b.left >= f.left - 0.5 && b.right <= f.right + 0.5 && b.bottom <= f.bottom + 0.5, px: parseFloat(getComputedStyle(t).fontSize) * (f.width / (t.closest('.fcard') as HTMLElement).offsetWidth), h: b.height * ((t.closest('.fcard') as HTMLElement).offsetWidth / f.width) }; });
        expect(box.inside).toBe(true);
        expect(box.px).toBeGreaterThanOrEqual(10);
        expect(box.h).toBeGreaterThanOrEqual(18);
      }

      await expectResult(page, f.scene);
      if (f.down) {
        const want = finalOf(f.scene);
        const low = await page.evaluate(() => (window as unknown as { __lows: Record<string, number> }).__lows);
        for (const [key, v] of Object.entries(low)) {
          const [code, t] = key.split(' ') as [string, Track];
          expect(v, `${key}: the lowest number during the show`).toBeGreaterThanOrEqual(want.ships[code].tracks[t]);
        }
      }
      // After the show no chip is hidden: «Всплыл» after surfacing; «Месть» of the scene «mark» sinks — only «Утонул».
      const end = await chips(page);
      expect(end.filter((c) => c.endsWith('(hidden)'))).toEqual([]);
      if (f.scene === 'mark') expect(end).toContain('М: Утонул');
      if (f.scene === 'turn') expect(end).toContain('Г: Всплыл');
      expect(errors).toEqual([]);
      await page.close();
    });
  }

  test('card: the layer takes no press while the card lies at the middle', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'card');
    await playing(page);
    await page.waitForFunction(() => !!document.querySelector('.fx-layer .flyc'), null, { polling: 'raf' });
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
    // the middle of the table under the card: the press goes to the board, not to the layer
    const hit = await page.evaluate(() => {
      const c = document.querySelector('.fx-layer .flyc')!.getBoundingClientRect();
      return document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2)?.closest('.fx-layer') ? 'layer' : 'table';
    });
    expect(hit).toBe('table');
  });
});

test('the scenes of A4 play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  let scene = '';
  const note = (text: string) => {
    errors.push(text);
    console.log(`[iphone ${scene}] ${text}`);
  };
  page.on('pageerror', (e) => note(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
  // Whether the layer showed something is recorded from the load of the page, not caught by polling.
  await page.addInitScript(() => {
    const w = window as unknown as { __sawLayer: boolean };
    w.__sawLayer = false;
    new MutationObserver(() => {
      if (document.querySelector('.fx-layer > *')) w.__sawLayer = true;
    }).observe(document, { subtree: true, childList: true });
  });
  for (const id of ['turn', 'card', 'repair', 'mark', 'sink']) {
    scene = id;
    await open(page, id, 'fast');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(errors, id).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sawLayer: boolean }).__sawLayer), `${id}: the layer showed the clips`).toBe(true);
    expect(await page.locator('.fx-layer > *').count(), id).toBe(0);
  }
});
