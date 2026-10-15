// P7: the phone (≤ 700 px) opens the log, the rules and a discard, plays a Legend by the star and shows every
// button of the Dutchman's plank. The same scenario runs on an iPhone 15 Pro Max in WebKit (@iphone, GitHub Actions).
// The laptop keeps the wide sheets. Screenshots go to docs/screenshots/p7/ (replaced on every run).
import { expect, test, type Locator, type Page } from '@playwright/test';

const SHOTS = 'docs/screenshots/p7';

/** Two people on one screen, seed 1: placement of both teams, then the Pirates at the table. */
async function startDuo(page: Page) {
  await page.goto('?seed=1&speed=instant');
  await page.getByTestId('quick-duo').click();
  await page.getByTestId('prep-start').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('game')).toHaveAttribute('data-bottom', 'ПИРАТЫ');
}

/** The element is shown and lies inside the window. */
async function expectInWindow(page: Page, el: Locator) {
  await expect(el).toBeVisible();
  const box = (await el.boundingBox())!;
  const win = page.viewportSize()!;
  expect(box.width).toBeGreaterThan(100);
  expect(box.height).toBeGreaterThan(40);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(win.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(win.height + 1);
  return box;
}

async function closeSheet(page: Page) {
  await page.locator('.sheet .close').first().click();
  await expect(page.locator('.sheet')).toHaveCount(0);
}

/**
 * P2: the whole plank is the target — big enough for a finger, and every point of it (the corners of the head, the
 * star, the middle, the bottom corners) lands on the target, not on the star or the ship card.
 */
async function expectWholePlankTarget(page: Page, code: string) {
  const target = page.getByTestId(`plate-${code}`);
  await expect(target).toHaveClass(/aimable/);
  const box = (await target.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(150);
  expect(box.height).toBeGreaterThanOrEqual(80);
  const star = page.getByTestId(`star-${code}`);
  const sb = (await star.count()) > 0 ? await star.boundingBox() : null;
  const head = (await target.locator('.plank-head').boundingBox())!;
  const points = [
    [box.x + 6, head.y + 4],
    [box.x + box.width / 2, head.y + head.height / 2],
    [box.x + box.width / 2, box.y + box.height / 2],
    [box.x + 6, box.y + box.height - 6],
    [box.x + box.width - 6, box.y + box.height - 6],
    ...(sb ? [[sb.x + sb.width / 2, sb.y + sb.height / 2]] : []),
  ];
  const hits = await page.evaluate(
    ({ pts, id }) => pts.map(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-testid]')?.getAttribute('data-testid') ?? null).map((t) => t === id),
    { pts: points, id: `plate-${code}` },
  );
  expect(hits).toEqual(points.map(() => true));
}

/**
 * The Pearl or the Revenge fires at the Dutchman (so its Souls can restore the Hull: more buttons on its plank), the Company
 * skips the Reactions, the Pirates end their turn without plans; the device goes to the Company.
 */
async function toCompany(page: Page) {
  for (const shooter of ['Ж', 'М']) {
    await page.getByTestId(`volley-${shooter}`).click();
    await expect(page.getByTestId('volley-panel')).toBeVisible();
    if ((await page.getByTestId('plate-Г').count()) > 0) break;
    await page.getByTestId('volley-panel').getByRole('button', { name: 'Отмена' }).click();
  }
  await expectWholePlankTarget(page, 'Г');
  // A tap on the head chooses the target, not the ship card.
  await page.getByTestId('plate-Г').locator('.plank-head').click({ position: { x: 8, y: 8 }, timeout: 5000 });
  await expect(page.getByTestId('plate-Г')).toHaveClass(/chosen/);
  await expect(page.getByTestId('ship-sheet')).toHaveCount(0);
  await page.getByTestId('fire').click();
  for (let i = 0; i < 200; i++) {
    const skip = page.locator('[data-testid="skip-reaction"]:visible');
    if (await page.getByTestId('curtain-ready').isVisible()) await page.getByTestId('curtain-ready').click();
    else if ((await skip.count()) > 0) await skip.first().click();
    else if ((await page.locator('[data-testid="end-turn"]:visible:not([aria-disabled="true"])').count()) > 0) break;
    else await page.waitForTimeout(50);
  }
  await expect(page.getByTestId('game')).toHaveAttribute('data-bottom', 'ПИРАТЫ');
  await page.locator('[data-testid="end-turn"]:visible').first().click();
  for (let i = 0; i < 200; i++) {
    if (await page.getByTestId('curtain-ready').isVisible()) break;
    if (await page.getByTestId('confirm-end').isVisible()) await page.getByTestId('confirm-yes').click();
    else if (await page.getByTestId('plans-panel').isVisible()) await page.getByTestId('no-plans').click();
    else await page.waitForTimeout(50);
  }
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('game')).toHaveAttribute('data-bottom', 'КОМПАНИЯ');
}

async function phone(page: Page, name: string) {
  const errors: string[] = [];
  // Printed at once: a test that times out never reaches its final check, and CI shows the cause in the log.
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.log(`[pageerror] ${name}: ${e.message}\n${e.stack ?? ''}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') console.log(`[console.error] ${name}: ${m.text()}`);
  });
  await startDuo(page);

  // The log, the rules and a discard open as bottom sheets inside the window.
  await page.locator('.bottom-bar').getByRole('button', { name: 'Журнал' }).click();
  await expectInWindow(page, page.getByTestId('log-sheet'));
  await page.screenshot({ path: `${SHOTS}/${name}-1-log.png` });
  await closeSheet(page);
  await page.locator('.bottom-bar').getByRole('button', { name: 'Правила' }).click();
  await expectInWindow(page, page.getByTestId('rules'));
  await page.screenshot({ path: `${SHOTS}/${name}-2-rules.png` });
  await closeSheet(page);
  await page.getByTestId('plank-Ж').locator('.plank-head').click({ position: { x: 8, y: 8 } });
  await expect(page.getByTestId('ship-sheet')).toBeVisible();
  await page.getByTestId('ship-sheet').getByRole('button', { name: /^Сброс:/ }).click();
  await expectInWindow(page, page.getByTestId('discard'));
  await page.screenshot({ path: `${SHOTS}/${name}-3-discard.png` });
  await closeSheet(page);

  await toCompany(page);

  // Outside aiming the own planks are as before (P7): a tap on a plank picks the ship, the head opens its card.
  for (const code of ['И', 'Г']) {
    await page.getByTestId(`plank-${code}`).locator('.tracks').click();
    await expect(page.getByTestId(`plank-${code}`)).toHaveClass(/selected/);
  }
  await expect(page.getByTestId('ship-info-Г')).toHaveCount(0);

  // Every button of the Dutchman's plank is seen whole, inside the plank and the window, at least 44 px high.
  const dutchman = page.getByTestId('plank-Г');
  const row = dutchman.locator('.plank-buttons');
  const buttons = row.locator('.btn');
  expect(await buttons.count()).toBeGreaterThanOrEqual(4);
  const plankBox = (await dutchman.boundingBox())!;
  const win = page.viewportSize()!;
  for (const b of await buttons.all()) {
    await expect(b).toBeVisible();
    const box = (await b.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(plankBox.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(Math.min(plankBox.x + plankBox.width, win.width) + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(Math.min(plankBox.y + plankBox.height, win.height) + 1);
    expect(await b.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  }
  expect(await row.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await dutchman.screenshot({ path: `${SHOTS}/${name}-4-dutchman.png` });

  // The star is a 44×44 tap zone of its own: its corners hit the star, not the ship card.
  const star = page.getByTestId('star-И');
  await expect(star).toBeVisible();
  const sb = (await star.boundingBox())!;
  const cx = sb.x + sb.width / 2;
  const hits = await page.evaluate(
    ({ x, y }) =>
      [
        [x - 21, y + 0],
        [x + 21, y + 0],
        [x, y - 4],
        [x - 21, y + 30],
        [x + 21, y + 30],
      ].map(([px, py]) => document.elementFromPoint(px, py)?.closest('[data-testid="star-И"]') !== null),
    { x: cx, y: sb.y + sb.height / 2 },
  );
  expect(hits).toEqual([true, true, true, true, true]);
  await star.click();
  await expect(page.getByTestId('ship-sheet')).toHaveCount(0);
  const play = page.getByRole('button', { name: 'Разыграть Легенду' });
  await expect(play).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${name}-5-legend-card.png` });
  await play.click();
  await expect(page.getByTestId('legend-confirm')).toBeVisible();
  await page.getByTestId('legend-confirm').getByRole('button', { name: /^Сыграть/ }).click();
  await expect(star).toHaveCount(0);
  await page.locator('.bottom-bar').getByRole('button', { name: 'Журнал' }).click();
  await expect(page.getByTestId('log-sheet')).toContainText('Армада Компании');
  await page.screenshot({ path: `${SHOTS}/${name}-6-legend-played.png` });
  expect(errors).toEqual([]);
}

test('phone 430×932: the log, the rules, a discard, a Legend by the star, the Dutchman buttons', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await phone(page, 'phone');
});

// Safari on an iPhone (WebKit with the iPhone 15 Pro Max profile): run by the e2e job on GitHub Actions.
test('iPhone 15 Pro Max: the log, the rules, a discard, a Legend by the star, the Dutchman buttons @iphone', async ({ page }) => phone(page, 'iphone'));

test('laptop 1366×660: the log, the rules and a discard stay wide', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 660 });
  await startDuo(page);
  const wide = async (sheet: Locator, shot: string) => {
    const box = await expectInWindow(page, sheet);
    expect(Math.round(box.width)).toBe(900);
    await page.screenshot({ path: `${SHOTS}/laptop-${shot}.png` });
    await closeSheet(page);
  };
  await page.locator('.log-actions').getByRole('button', { name: 'Весь журнал' }).click();
  await wide(page.getByTestId('log-sheet'), '1-log');
  await page.getByRole('button', { name: 'Правила' }).first().click();
  await wide(page.getByTestId('rules'), '2-rules');
  await page.getByTestId('plank-Ж').locator('.plank-head').click({ position: { x: 8, y: 8 } });
  await page.getByTestId('ship-sheet').getByRole('button', { name: /^Сброс:/ }).click();
  await wide(page.getByTestId('discard'), '3-discard');
});
