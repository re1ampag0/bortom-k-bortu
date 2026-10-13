// The game through the interface (docs/TZ.md, stage 7): bots play a match to the victory screen, people play
// against bots and against each other to the end; the table fits the window without page scrolling at the three
// sizes of the task. Screenshots of the key states go to docs/screenshots/stage7/ (replaced on every run).
import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1366, height: 660 },
  { name: 'phone', width: 390, height: 664 },
  { name: 'small', width: 375, height: 548 },
] as const;

const SHOTS = 'docs/screenshots/stage7';

async function shot(page: Page, size: string, name: string) {
  await page.screenshot({ path: `${SHOTS}/${size}-${name}.png` });
}

/** The page does not scroll, and the parts of the table do not run into each other or out of the window. */
async function expectFits(page: Page) {
  const r = await page.evaluate(() => {
    const box = (q: string) => {
      const e = document.querySelector(q);
      if (!e || getComputedStyle(e).display === 'none') return null;
      const b = e.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
    };
    return {
      sh: document.scrollingElement!.scrollHeight,
      sw: document.scrollingElement!.scrollWidth,
      ih: innerHeight,
      iw: innerWidth,
      hand: box('.hand-cards'),
      bottomBar: box('.bottom-bar'),
      ownPlanks: box('.planks.bottom'),
      handRow: box('.hand-row'),
      board: box('.board'),
      endTurn: box('.hand-actions .end-turn') ?? box('.bottom-bar .end-turn'),
    };
  });
  expect(r.sh).toBeLessThanOrEqual(r.ih);
  expect(r.sw).toBeLessThanOrEqual(r.iw);
  if (r.hand) {
    expect(r.hand.bottom).toBeLessThanOrEqual((r.bottomBar?.top ?? r.ih) + 1);
    expect(r.ownPlanks!.bottom).toBeLessThanOrEqual(r.handRow!.top + 1);
    expect(r.board!.right).toBeLessThanOrEqual(r.iw + 1);
  }
  if (r.endTurn) {
    expect(r.endTurn.bottom).toBeLessThanOrEqual(r.ih + 1);
    expect(r.endTurn.right).toBeLessThanOrEqual(r.iw + 1);
  }
}

/** The first visible element with the test id (a phone and a laptop have some buttons twice, one of them hidden). */
const byId = (page: Page, id: string) => page.locator(`[data-testid="${id}"]:visible`).first();
const visible = (page: Page, id: string) => byId(page, id).isVisible();
const enabled = async (page: Page, id: string) => (await visible(page, id)) && (await byId(page, id).getAttribute('aria-disabled')) !== 'true';

/**
 * Plays the human side(s) to the end: fires a Volley when it can, skips Reactions, declines «Джек» and «Тортуга»,
 * picks the first cards of a choice, ends the turn. Bots and the engine do the rest.
 */
async function playToEnd(page: Page) {
  for (let i = 0; i < 4000; i++) {
    if (await visible(page, 'end-screen')) return;
    if (await visible(page, 'curtain-ready')) {
      await page.getByTestId('curtain-ready').click();
      continue;
    }
    if (await visible(page, 'skip-reaction')) {
      await page.getByTestId('skip-reaction').click();
      continue;
    }
    if (await visible(page, 'jack-panel')) {
      await page.getByTestId('jack-panel').getByRole('button', { name: /Нет/ }).click();
      continue;
    }
    if (await visible(page, 'tortuga-panel')) {
      await page.getByTestId('tortuga-panel').getByRole('button', { name: 'Не брать' }).click();
      continue;
    }
    if (await visible(page, 'choice-panel')) {
      const panel = page.getByTestId('choice-panel');
      const done = panel.getByRole('button', { name: /Готово/ });
      const need = Number((await done.textContent())!.match(/из (\d+)/)![1]);
      const options = panel.locator('.choice-cards > *');
      for (let k = 0; k < need; k++) await options.nth(k).click();
      await done.click();
      continue;
    }
    if (await visible(page, 'plans-panel')) {
      await page.getByTestId('no-plans').click();
      continue;
    }
    if (await visible(page, 'confirm-end')) {
      await page.getByTestId('confirm-yes').click();
      continue;
    }
    if (await visible(page, 'volley-panel')) {
      const fire = page.getByTestId('fire');
      if ((await fire.getAttribute('aria-disabled')) !== 'true') await fire.click();
      else await page.getByTestId('volley-panel').getByRole('button', { name: 'Отмена' }).click();
      continue;
    }
    if (await enabled(page, 'end-turn')) {
      const volley = page.locator('.plank-buttons [data-testid^="volley-"]:not([aria-disabled="true"]):visible');
      if ((await volley.count()) > 0) {
        await volley.first().click();
        const plate = page.locator('[data-testid^="plate-"]');
        if ((await plate.count()) > 0) {
          await plate.first().click();
          continue;
        }
      }
      await byId(page, 'end-turn').click();
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('the game did not end');
}

async function keyStates(page: Page, name: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('?seed=1&speed=instant');
  await shot(page, name, '1-setup');
  // Two people on one screen, seed 1: the Pearl's Volley at the Endeavour opens a Reaction window.
  await page.getByTestId('quick-duo').click();
  await shot(page, name, '2-placement');
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.getByTestId('placement-done').click();
  await shot(page, name, '3-curtain');
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('game')).toBeVisible();
  await expectFits(page);
  await shot(page, name, '4-turn');
  await page.getByTestId('volley-Ж').click();
  await page.getByTestId('plate-И').click();
  await expect(page.getByTestId('volley-panel')).toBeVisible();
  await expectFits(page);
  await shot(page, name, '5-volley-preview');
  await page.getByTestId('fire').click();
  await expect(page.getByTestId('curtain')).toContainText('Реакция на Залп по «Индевору»');
  await shot(page, name, '6-curtain-reaction');
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('reaction-panel')).toBeVisible();
  await expectFits(page);
  await shot(page, name, '7-reaction');
  // Four bots to the victory screen.
  await page.goto('?speed=instant');
  await page.getByTestId('quick-match').click();
  await expect(page.getByTestId('game')).toBeVisible();
  await expectFits(page);
  await expect(page.getByTestId('end-screen')).toBeVisible({ timeout: 120_000 });
  await shot(page, name, '8-end');
  await page.getByRole('button', { name: 'Посмотреть стол' }).click();
  await expectFits(page);
  await shot(page, name, '9-table-after');
  expect(errors).toEqual([]);
}

for (const size of SIZES) {
  test.describe(`${size.name} ${size.width}×${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('key states fit the window', async ({ page }) => keyStates(page, size.name));
  });
}

test.describe('whole games through the interface', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('four bots play a match to the victory screen', async ({ page }) => {
    await page.goto('?speed=instant');
    await page.getByTestId('quick-match').click();
    await expect(page.getByTestId('end-screen')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId('end-screen')).toContainText(/Победа|Ничья/);
  });

  test('a person against bots plays to the end', async ({ page }) => {
    await page.goto('?seed=5&speed=instant');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('placement-done').click();
    await playToEnd(page);
    await expect(page.getByTestId('end-screen')).toContainText(/Победа|Ничья/);
  });

  test('two people on one screen play to the end', async ({ page }) => {
    await page.goto('?seed=9&speed=instant');
    await page.getByTestId('quick-duo').click();
    await page.getByTestId('placement-done').click();
    await page.getByTestId('curtain-ready').click();
    await page.getByTestId('placement-done').click();
    await playToEnd(page);
    await expect(page.getByTestId('end-screen')).toContainText(/Победа|Ничья/);
  });

  test('a phone person against bots plays to the end', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto('?seed=11&speed=instant');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('placement-done').click();
    await playToEnd(page);
    await expect(page.getByTestId('end-screen')).toContainText(/Победа|Ничья/);
  });
});

// Safari on an iPhone (WebKit with the iPhone 15 Pro Max profile): run by the e2e job on GitHub Actions.
test('iPhone 15 Pro Max: key states fit the window @iphone', async ({ page }) => keyStates(page, 'iphone15promax'));
