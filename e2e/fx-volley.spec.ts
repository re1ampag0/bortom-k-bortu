// A2: the Volley on the table (the animation layer) through «?fxScene=<id>» — scenes of the reference
// (docs/mockups/anim/level1/scenes.js) played on the table of the game. The layer never takes a press, a card of the
// hand opens during the show, the numbers after the show are the result of the scene; in a bot match a Volley of the
// bots is shown by the layer. Frames go to docs/screenshots/a2/, next to the frames of the reference
// (capture.mjs → docs/screenshots/a2/ref/), at the same milliseconds from the load of the page.
import { expect, test } from '@playwright/test';
import { clickMisses, expectResult, open, playing } from './fx-scene';

const SHOTS = 'docs/screenshots/a2';

test.describe('the Volley on the table through ?fxScene (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  for (const id of ['plain', 'storm', 'joint', 'both']) {
    test(`${id}: the layer takes no press, a hand card opens during the show, the numbers are the result`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, id);
      await playing(page);

      // elementFromPoint over the planks and the cards of the hand gives the element itself (clickthrough of the reference).
      const misses = await clickMisses(page);
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
      await expectResult(page, id);
      expect(errors).toEqual([]);
    });
  }

  // FX-D: the A5 broadside (gunFire, ballFly, hitBlast, missSplash) keeps to the budget of the layer: at most ~200
  // animations at once (TASKS.md, «Как переносить из прототипа», 5), in the heaviest scene — two broadsides.
  test('both: the A5 shots keep to the budget of the layer, no error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 'both');
    await page.evaluate(() => {
      const w = window as unknown as { __peak: number };
      w.__peak = 0;
      const tick = () => {
        const n = document.querySelector('.fx-layer')!.getAnimations({ subtree: true }).length + (document.querySelector('.fx-scars')?.getAnimations({ subtree: true }).length ?? 0);
        w.__peak = Math.max(w.__peak, n);
        if (!document.body.dataset.fxDone) requestAnimationFrame(tick);
      };
      tick();
    });
    await expectResult(page, 'both');
    const peak = await page.evaluate(() => (window as unknown as { __peak: number }).__peak);
    expect(peak).toBeGreaterThan(20);
    expect(peak).toBeLessThanOrEqual(210);
    expect(errors).toEqual([]);
  });

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
    // FX-A: the traces of the effects (.fx-scars) lie between the weather and the layer (ANIMATIONS.md §1)
    expect(dom).toEqual({ last: 'fx-layer', before: 'fx-scars', gap: true, hand: true, events: 'none' });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.board > .fx-scars')!.previousElementSibling!).zIndex + ' ' + document.querySelector('.board > .fx-scars')!.previousElementSibling!.className)).toBe('1 fx-weather');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.board > .fx-scars')!).pointerEvents)).toBe('none');
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
