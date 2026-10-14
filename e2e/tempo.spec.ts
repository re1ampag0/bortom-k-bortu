// P4, the tempo of the show: «Пауза / Дальше» holds the bots, «Подробнее» of the turn summary lists the enemy's turn,
// and on the phone «Пауза» leaves room for «Журнал» and «Правила». Screenshots go to docs/screenshots/p4/.
import { expect, test, type Page } from '@playwright/test';

const SHOTS = 'docs/screenshots/p4';

/** The Company against the Pirate bots: the Pirates move first. */
async function againstBots(page: Page, speed: string) {
  await page.goto(`?seed=3&speed=${speed}`);
  await page.getByTestId('quick-bots').click();
  await page.getByTestId('pick-company').click();
  await page.getByTestId('prep-start').click();
  await page.getByTestId('placement-done').click();
  await expect(page.getByTestId('game')).toBeVisible();
}

test.describe('laptop 1366×660', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('«Пауза» stops the bots, «Дальше» lets them go on', async ({ page }) => {
    await againstBots(page, 'fast');
    const lines = page.locator('.log-col [data-testid="log"] li');
    const pause = page.locator('[data-testid="pause-show"]:visible');
    // Let the bots make a move first: the pause then stops a turn under way.
    const start = await lines.count();
    await expect.poll(() => lines.count(), { timeout: 30_000 }).toBeGreaterThan(start);
    await pause.click();
    await expect(pause.locator('.wide')).toHaveText('▶ Дальше');
    const held = await lines.count();
    await page.waitForTimeout(4000);
    expect(await lines.count()).toBe(held);
    await page.screenshot({ path: `${SHOTS}/laptop-paused.png` });
    await pause.click();
    await expect.poll(() => lines.count(), { timeout: 30_000 }).toBeGreaterThan(held);
  });

  test('«Подробнее» of the turn summary opens the enemy turn; a card in it opens and returns', async ({ page }) => {
    await againstBots(page, 'fast');
    const more = page.getByTestId('summary-more');
    await expect(more).toBeVisible({ timeout: 120_000 });
    await page.screenshot({ path: `${SHOTS}/laptop-summary.png` });
    await more.click();
    const sheet = page.getByTestId('last-turn');
    await expect(sheet).toContainText('Что было за ход Пиратов');
    await expect(sheet.locator('li').first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/laptop-last-turn.png` });
    const card = sheet.locator('.cref[data-card]').first();
    if ((await card.count()) > 0) {
      await card.click();
      await expect(sheet).toHaveCount(0);
      await page.getByRole('button', { name: 'Закрыть' }).first().click();
      await expect(page.getByTestId('last-turn')).toBeVisible();
    }
  });
});

test.describe('phone 430×932', () => {
  test.use({ viewport: { width: 430, height: 932 } });

  test('«Пауза» in the bottom bar leaves «Журнал» and «Правила» in place', async ({ page }) => {
    await againstBots(page, 'slow');
    const bar = page.locator('.bottom-bar');
    const pause = bar.getByTestId('pause-show');
    await expect(pause).toBeVisible();
    for (const name of ['Журнал', 'Правила']) {
      const b = await bar.getByRole('button', { name, exact: true }).boundingBox();
      expect(b, name).not.toBeNull();
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.x + b!.width).toBeLessThanOrEqual(430);
      expect(b!.width).toBeGreaterThan(40);
    }
    const p = (await pause.boundingBox())!;
    expect(p.x + p.width).toBeLessThanOrEqual(430);
    // Every button of the bar is whole on the screen.
    for (const b of await bar.locator('.btn:visible').all()) {
      const r = (await b.boundingBox())!;
      expect(r.x + r.width).toBeLessThanOrEqual(430);
    }
    const sw = await page.evaluate(() => document.scrollingElement!.scrollWidth);
    expect(sw).toBeLessThanOrEqual(430);
    await pause.click();
    await expect(pause.locator('.narrow')).toHaveText('▶');
    await page.screenshot({ path: `${SHOTS}/phone-paused.png` });
  });
});
