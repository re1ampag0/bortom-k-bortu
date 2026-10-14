// Stage 7, second part: the start screen, the preparation, a turn, the show of the enemy's move and the sea banner on
// a laptop (1366×660) and the target phone iPhone 15 Pro Max (430×740), without page scrolling. Screenshots go to
// docs/screenshots/stage7b/ (replaced on every run).
import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1366, height: 660 },
  { name: 'iphone', width: 430, height: 740 },
] as const;
const SHOTS = 'docs/screenshots/stage7b';

async function expectNoScroll(page: Page) {
  const r = await page.evaluate(() => ({ sh: document.scrollingElement!.scrollHeight, sw: document.scrollingElement!.scrollWidth, ih: innerHeight, iw: innerWidth }));
  expect(r.sh).toBeLessThanOrEqual(r.ih);
  expect(r.sw).toBeLessThanOrEqual(r.iw);
}

async function shot(page: Page, size: string, name: string) {
  await expectNoScroll(page);
  await page.screenshot({ path: `${SHOTS}/${size}-${name}.png` });
}

for (const size of SIZES) {
  test.describe(`${size.name} ${size.width}×${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('start, preparation, the show of a move, the sea banner, a turn', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      // An autosave and a remembered room: both plaques on the start screen.
      await page.goto('?seed=3&speed=instant');
      await page.getByTestId('quick-bots').click();
      await page.getByTestId('prep-start').click();
      await page.getByTestId('placement-done').click();
      await expect(page.getByTestId('game')).toBeVisible();
      await page.evaluate(() =>
        localStorage.setItem('bortom-k-bortu.net', JSON.stringify({ url: 'ws://localhost:1/ws', token: 't', code: 'ABCDE', name: 'Аня', seen: 0 })),
      );
      await page.goto('?seed=3&speed=fast');
      await expect(page.getByTestId('resume')).toContainText('Раунд 1');
      await expect(page.getByTestId('net-resume')).toContainText('ABCDE');
      await page.waitForTimeout(300);
      await shot(page, size.name, '1-start');

      // The preparation: the coin decides.
      await page.getByTestId('quick-bots').click();
      await page.getByTestId('pick-coin').click();
      await expect(page.getByTestId('coin-verdict')).toContainText('Жребий', { timeout: 4000 });
      await shot(page, size.name, '2-prep');

      // The Company against the Pirate bots: the Pirates move first, their moves are shown one at a time.
      await page.getByTestId('pick-company').click();
      await page.getByTestId('prep-start').click();
      await page.getByTestId('placement-done').click();
      await expect(page.getByTestId('sea-banner')).toBeVisible();
      await page.waitForTimeout(500);
      await shot(page, size.name, '5-sea-banner');
      // A Volley of the Pirates: cores fly after the Reaction window; the breakdown stays at the side.
      await expect(page.getByTestId('show-projectile').first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('show-arrow')).toHaveCount(0);
      await expect(page.getByTestId('show-plate')).toBeVisible();
      await page.waitForTimeout(400);
      await shot(page, size.name, '4-enemy-move');

      // The show ends, the turn comes to the person.
      await expect(page.locator('[data-testid="end-turn"]:visible').first()).toHaveText('Ход окончен', { timeout: 90_000 });
      await expect(page.locator('[data-testid="end-turn"]:visible').first()).not.toHaveAttribute('aria-disabled', 'true', { timeout: 60_000 });
      await page.waitForTimeout(2500);
      await shot(page, size.name, '3-turn');
      expect(errors).toEqual([]);
    });
  });
}

test.describe('prefers-reduced-motion', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('the coin shows its side at once, the card of a move does not fly in', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('?seed=3&speed=fast');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('pick-coin').click();
    await expect(page.getByTestId('coin-verdict')).toContainText('Жребий', { timeout: 300 });
    await page.getByTestId('pick-company').click();
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    const shown = page.locator('[data-testid="show-card"], [data-testid="show-arrow"]').first();
    await expect(shown).toBeVisible({ timeout: 60_000 });
    const animation = await page.evaluate(() => {
      const e = document.querySelector('.show-card, .show-arrow line');
      return e ? getComputedStyle(e).animationName : 'none';
    });
    expect(animation).toBe('none');
  });
});

test.describe('two people on one screen', () => {
  test.use({ viewport: { width: 430, height: 740 } });

  test('the banners wait until the curtain «Передайте устройство» is closed', async ({ page }) => {
    await page.goto('?seed=3&speed=fast');
    await page.getByTestId('quick-duo').click();
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await page.getByTestId('curtain-ready').click();
    await page.getByTestId('placement-done').click();
    // The curtain before the Pirates' first turn: longer than any banner lasts.
    await expect(page.getByTestId('curtain')).toBeVisible();
    await page.waitForTimeout(3000);
    await page.getByTestId('curtain-ready').click();
    await expect(page.getByTestId('sea-banner')).toBeVisible();
    await expect(page.getByTestId('turn-banner')).toHaveText('Ваш ход', { timeout: 5000 });
    await expectNoScroll(page);
  });
});
