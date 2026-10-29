// A2b: the Reactions and the special Volleys on the table through «?fxScene=<id>». For each scene a frame of the game at
// the moment of the effect (the element of the effect is in the layer) goes to docs/screenshots/a2b/, its milliseconds from
// the load of the page to docs/screenshots/a2b/times.json; the frames of the reference at the same milliseconds are taken
// by capture.mjs into docs/screenshots/a2b/ref/. After the show the numbers are the result of the scene and the layer is empty.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { clickMisses, expectResult, open, playing } from './fx-scene';

const SHOTS = 'docs/screenshots/a2b';
const TIMES = `${SHOTS}/times.json`;

/** A frame: the scene, the moment (a check in the page: the effect is there), and how long after it the frame is taken. */
interface Frame {
  name: string;
  scene: string;
  ready: string;
  after: number;
}
const layerHas = (sel: string) => `!!document.querySelector('.fx-layer ${sel}')`;
const tagWith = (text: string) => `Array.from(document.querySelectorAll('.fx-layer .tag')).some((t) => t.textContent.includes(${JSON.stringify(text)}))`;
const FRAMES: Frame[] = [
  { name: 'dbl', scene: 'dbl', ready: layerHas('.armor'), after: 250 },
  { name: 'wind', scene: 'wind', ready: layerHas('.streak'), after: 250 },
  { name: 'cover', scene: 'cover', ready: `!!document.querySelector('[data-fx-ship][style*="translate"]')`, after: 500 },
  { name: 'whirl', scene: 'whirl', ready: layerHas('.whirl'), after: 400 },
  { name: 'night', scene: 'night', ready: layerHas('.night'), after: 500 },
  { name: 'deepcancel', scene: 'deepcancel', ready: layerHas('.underwater'), after: 500 },
  { name: 'zombie', scene: 'zombie', ready: layerHas('.barrier'), after: 400 },
  { name: 'heavy', scene: 'heavy', ready: tagWith('Ответ:'), after: 600 },
  { name: 'counter', scene: 'counter', ready: tagWith('Ответ:'), after: 500 },
  { name: 'firewall', scene: 'firewall', ready: tagWith('Ответ:'), after: 600 },
  { name: 'abyss', scene: 'abyss', ready: tagWith('Ответ:'), after: 600 },
  { name: 'both', scene: 'both', ready: `Array.from(document.querySelectorAll('.fx-layer .plate .stamp')).some((t) => t.textContent.includes('второй борт'))`, after: 500 },
  // «Сердце Дейви Джонса»: the scene «heart» ends with the clip «sink» (A3), so the first action of «wind» shows it.
  { name: 'heart', scene: 'wind', ready: layerHas('.heart'), after: 1300 },
  { name: 'deep', scene: 'deep', ready: `Array.from(document.querySelectorAll('.fx-layer .plate .stamp')).some((t) => t.textContent.includes('Без Реакций'))`, after: 600 },
  { name: 'ghost', scene: 'ghost', ready: layerHas('.ball.ghost'), after: 200 },
];

function saveTime(name: string, scene: string, ms: number) {
  const all: Record<string, { scene: string; ms: number }> = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')) : {};
  all[name] = { scene, ms };
  writeFileSync(TIMES, JSON.stringify(all, null, 2) + '\n');
}

test.describe('the Reactions and the special Volleys through ?fxScene (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });
  test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

  for (const f of FRAMES) {
    test(`${f.name}: the effect on the table, the frame, the result`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, f.scene);
      await page.waitForFunction(f.ready, null, { timeout: 20_000, polling: 'raf' });
      await page.waitForTimeout(f.after);
      const ms = await page.evaluate(() => Math.round(performance.now()));
      await page.screenshot({ path: `${SHOTS}/game-${f.name}-1366x660.png` });
      saveTime(f.name, f.scene, ms);
      await expectResult(page, f.scene, f.scene === 'whirl' ? '.whirl' : undefined);
      expect(errors).toEqual([]);
    });
  }

  test('whirl: the layer takes no press during the effect', async ({ page }) => {
    await open(page, 'whirl');
    await playing(page);
    await page.waitForFunction(() => !!document.querySelector('.fx-layer .whirl'));
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
  });
});

test('the Reaction scenes play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(300_000);
  // A short fast clip may finish before WebKit returns from goto/load. Observe
  // its real visible interval from document creation, not only after open().
  await page.addInitScript(() => {
    const playback = { observed: false };
    Object.defineProperty(window, '__reactionPlayback', { value: playback });
    const observer = new MutationObserver(() => {
      if (document.body?.dataset.fxStart === '1' &&
          document.querySelector('.fx-layer > *') && !document.body.dataset.fxDone) {
        playback.observed = true;
        observer.disconnect();
      }
    });
    observer.observe(document, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ['data-fx-start', 'data-fx-done'],
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const id of ['dbl', 'wind', 'cover', 'whirl', 'night', 'deepcancel', 'plan', 'zombie', 'firewall', 'both', 'deep', 'ghost']) {
    await open(page, id, 'fast');
    await page.waitForFunction(() =>
      (window as Window & { __reactionPlayback?: { observed: boolean } }).__reactionPlayback?.observed === true);
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(await page.locator('.fx-layer > *:not(.whirl)').count(), id).toBe(0);
    expect(errors, id).toEqual([]);
  }
});
