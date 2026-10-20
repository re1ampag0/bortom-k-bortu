// P4, the tempo of the show: «Пауза / Дальше» holds the bots, «Последнее» opens the journal with the enemy's turn,
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

  test('«Последнее» of the turn summary opens the journal; an enemy card opens and returns', async ({ page }) => {
    await againstBots(page, 'fast');
    await expect(page.locator('[data-fx-instruction]')).toContainText('выберите карту или действие', { timeout: 120_000 });
    const summary = page.getByTestId('middle-info');
    await expect(summary).toContainText('Последнее: Ход Компании:');
    await page.screenshot({ path: 'docs/screenshots/fix-ci/tempo-summary-line.png' });
    await summary.click();
    const journal = page.getByTestId('log-sheet');
    await expect(journal).toBeVisible();
    await expect(journal).toContainText('Ход Пиратов');
    await expect(journal.locator('li').first()).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/fix-ci/tempo-journal.png' });
    // The seeded Pirates play cards: navigation is required, rather than skipped when no link was found.
    const card = journal.locator('.cref[data-card]').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(journal).toHaveCount(0);
    const detail = page.getByTestId('card-detail');
    await expect(detail).toBeVisible();
    await detail.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(journal).toBeVisible();
    await expect(journal).toContainText('Ход Пиратов');
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
