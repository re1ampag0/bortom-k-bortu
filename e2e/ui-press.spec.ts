// ui-press: a plank draws again only when what it shows changes, but its buttons and «можно ли» follow the REAL state —
// the action that makes «Залп» impossible turns the button grey at once, while the show of that action still plays.
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('phone: «Залп» of a plank turns grey as soon as the Volley is fired, not after its show', async ({ page }) => {
  await page.goto('?seed=1&speed=normal&hints=0');
  for (const id of ['quick-bots', 'pick-pirates', 'prep-start', 'placement-done']) await page.getByTestId(id).click();
  const volley = page.getByTestId('volley-Ж');
  const game = page.getByTestId('game');
  // the player's turn, the start of the game shown
  await expect(volley).toHaveAttribute('aria-disabled', 'false', { timeout: 120_000 });
  await expect(game).not.toHaveAttribute('data-fx-busy', /.*/, { timeout: 60_000 });
  await volley.click();
  await page.getByTestId('plate-И').click();
  // the same plank, another render of the table: the button is primary now (the aim), and the target is framed
  await expect(page.locator('.charge-sheet')).toBeVisible();
  await page.getByTestId('fire').click();
  // during the show of the Volley (busy) the button already says the Volley was given
  await expect(game).toHaveAttribute('data-fx-busy', '');
  await expect(volley).toHaveAttribute('aria-disabled', 'true', { timeout: 1000 });
  await expect(game).toHaveAttribute('data-fx-busy', '');
});
