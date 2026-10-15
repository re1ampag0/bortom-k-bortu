// A2: the Volley on the table (the animation layer) through «?fxScene=<id>» — scenes of the reference
// (docs/mockups/anim/level1/scenes.js) played on the table of the game. The layer never takes a press, a card of the
// hand opens during the show, the numbers after the show are the result of the scene; in a bot match a Volley of the
// bots is shown by the layer. Frames go to docs/screenshots/a2/, next to the frames of the reference
// (capture.mjs → docs/screenshots/a2/ref/), at the same milliseconds from the load of the page.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test, type Page } from '@playwright/test';
import { loadGameData } from '../src/engine/data';
import type { GameEvent } from '../src/engine/state';
import type { Track } from '../src/engine/types';
import { applyVisible, displayRules, type Display } from '../src/ui/game/fx/display';

const SHOTS = 'docs/screenshots/a2';
const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const data = loadGameData(JSON.parse(readFileSync('data/game-data.json', 'utf8')));

interface Scene {
  id: string;
  start: Display;
  actions: { ev: GameEvent[] }[];
}
const win: { SCENES?: Scene[] } = {};
runInNewContext(readFileSync('docs/mockups/anim/level1/scenes.js', 'utf8'), { window: win });
const SCENES = win.SCENES!;

/** finalState of page.js: the start of the scene and every event of it. */
function finalOf(id: string): Display {
  const sc = SCENES.find((s) => s.id === id)!;
  const d = structuredClone(sc.start);
  const rules = displayRules(data);
  for (const a of sc.actions) for (const e of a.ev) applyVisible(d, e, rules);
  return d;
}

async function open(page: Page, id: string) {
  await page.goto(`?fxScene=${id}&speed=normal`);
  await expect(page.locator(`[data-fx-scene="${id}"]`)).toBeVisible();
}

/** The show is on: something is in the layer and the scene has not ended. */
async function playing(page: Page) {
  await page.waitForFunction(() => document.body.dataset.fxStart === '1' && document.querySelectorAll('.fx-layer > *').length > 0 && !document.body.dataset.fxDone);
}

test.describe('the Volley on the table through ?fxScene (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  for (const id of ['plain', 'storm', 'joint', 'both']) {
    test(`${id}: the layer takes no press, a hand card opens during the show, the numbers are the result`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, id);
      await playing(page);

      // elementFromPoint over the planks and the cards of the hand gives the element itself (clickthrough of the reference).
      const misses = await page.evaluate(() => {
        const out: string[] = [];
        const check = (el: Element, sel: string, name: string) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || getComputedStyle(el).visibility === 'hidden') return;
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (hit?.closest(sel) !== el) out.push(`${name}: ${hit ? hit.className : 'nothing'}`);
        };
        document.querySelectorAll('[data-fx-ship]').forEach((el) => check(el, '[data-fx-ship]', `plank ${el.getAttribute('data-fx-ship')}`));
        document.querySelectorAll('[data-fx-hand] [data-fx-card]').forEach((el) => check(el, '[data-fx-card]', `card ${el.getAttribute('data-fx-card')}`));
        return { out, planks: document.querySelectorAll('[data-fx-ship]').length, layer: document.querySelectorAll('.fx-layer > *').length };
      });
      expect(misses.planks).toBe(4);
      expect(misses.layer).toBeGreaterThan(0);
      expect(misses.out).toEqual([]);

      // A card of the hand opens during the show and does not stop it.
      const card = page.locator('[data-fx-hand] [data-fx-card]:visible').last();
      await card.click();
      await expect(page.getByTestId('card-detail')).toBeVisible();
      expect(await page.evaluate(() => document.body.dataset.fxDone)).toBeUndefined();
      await page.getByTestId('card-detail').getByRole('button', { name: 'Закрыть' }).click();

      // After the show the numbers of the tracks are the result of the scene.
      await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
      const want = finalOf(id);
      const shown = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-fx-ship]')).map((p) => ({
          code: p.getAttribute('data-fx-ship')!,
          values: Object.fromEntries(Array.from(p.querySelectorAll('[data-fx-track]')).map((t) => [t.getAttribute('data-fx-track'), t.querySelector('[data-fx-value]')!.textContent!.split('/')[0]])),
        })),
      );
      for (const { code, values } of shown) {
        for (const t of TRACKS) expect(`${code} ${t} ${values[t]}`).toBe(`${code} ${t} ${want.ships[code].tracks[t]}`);
      }
      expect(await page.locator('.fx-layer > *').count()).toBe(0);
      expect(errors).toEqual([]);
    });
  }

  test('a press on the table shows the result at once', async ({ page }) => {
    await open(page, 'storm');
    await playing(page);
    await page.mouse.click(5, 300); // the table, beside the planks: not the hand, not a panel
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 3000 });
    expect(await page.locator('.fx-layer > *').count()).toBe(0);
  });
});

test.describe('a bot match (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('the layer is the last child of the table, a Volley of the bots shows its plate', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('?seed=3&speed=fast');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('pick-company').click();
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await expect(page.getByTestId('game')).toBeVisible();
    const dom = await page.evaluate(() => {
      const board = document.querySelector('.board')!;
      const last = board.lastElementChild!;
      return { last: last.className, before: last.previousElementSibling?.className, gap: !!board.querySelector('[data-fx-gap]'), hand: !!board.querySelector('[data-fx-hand]'), events: getComputedStyle(last).pointerEvents };
    });
    expect(dom).toEqual({ last: 'fx-layer', before: 'fx-weather', gap: true, hand: true, events: 'none' });
    await expect(page.locator('.fx-layer .plate')).toBeVisible({ timeout: 60_000 });
    expect(errors).toEqual([]);
  });
});

/** The frames of the game at the moments of the reference frames (capture.mjs: from the load of the page). */
const FRAMES: { id: string; times: number[]; width: number; height: number }[] = [
  { id: 'plain', times: [1200, 2400], width: 1366, height: 660 },
  { id: 'storm', times: [2000, 3000], width: 1366, height: 660 },
  { id: 'joint', times: [1000, 2000], width: 1366, height: 660 },
  { id: 'both', times: [3000, 4000], width: 1366, height: 660 },
  { id: 'plain', times: [1200, 2400], width: 430, height: 932 },
];
test.describe('frames for the comparison with the reference', () => {
  for (const f of FRAMES) {
    test(`${f.id} ${f.width}×${f.height}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width: f.width, height: f.height } });
      await page.goto(`?fxScene=${f.id}&speed=normal`);
      let last = 0;
      for (const t of f.times) {
        await page.waitForTimeout(t - last);
        last = t;
        await page.screenshot({ path: `${SHOTS}/game-${f.id}-${f.width}x${f.height}-${t}.png` });
      }
      await page.close();
    });
  }
});
