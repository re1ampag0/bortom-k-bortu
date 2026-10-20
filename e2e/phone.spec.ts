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
  // The book slides in by 30 px (PH5). Measure its resting bounds, not a random opening frame.
  await el.evaluate(async (node) => {
    await Promise.all(node.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)));
  });
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
  // a5-log: «Журнал» is the ship's book (.lbook), the other windows are sheets
  await page.locator('.sheet .close, .lbook .close').first().click();
  await expect(page.locator('.sheet, .lbook')).toHaveCount(0);
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
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect((await target.locator('.plank-head').boundingBox())!.height).toBe(28);
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
    await page.getByTestId('cancel-volley').click();
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
  // a5-phone: the icons of the tracks open their rules, so the tap lands on the number of the Hull (a plain part of the plank)
  for (const code of ['И', 'Г']) {
    await page.getByTestId(`plank-${code}`).locator('.t-hull [data-fx-value]').click();
    await expect(page.getByTestId(`plank-${code}`)).toHaveClass(/selected/);
  }
  await expect(page.getByTestId('ship-info-Г')).toHaveCount(0);

  // The buttons of the Dutchman's plank (U3): one row, each 34 px high to the eye with a press zone of at least 44 px,
  // its text whole; when the row is
  // wider than the plank the arrow «›» shows and scrolls it; after it the last button is whole inside the plank and the
  // window and works. The page itself never scrolls sideways.
  const dutchman = page.getByTestId('plank-Г');
  const row = dutchman.locator('.plank-buttons');
  const buttons = row.locator('.btn');
  expect(await buttons.count()).toBeGreaterThanOrEqual(4);
  const plankBox = (await dutchman.boundingBox())!;
  const win = page.viewportSize()!;
  const tops = new Set<number>();
  for (const b of await buttons.all()) {
    const box = (await b.boundingBox())!;
    expect(Math.abs(box.height - 34), 'seen 34 px high').toBeLessThanOrEqual(3);
    expect(box.y + box.height).toBeLessThanOrEqual(Math.min(plankBox.y + plankBox.height, win.height) + 1);
    // the text is whole inside the button (scrollWidth would count the invisible press zone ::before)
    expect(await b.evaluate((e) => { const r = document.createRange(); r.selectNodeContents(e); const t = r.getBoundingClientRect(), b = e.getBoundingClientRect(); return t.left >= b.left && t.right <= b.right && t.top >= b.top && t.bottom <= b.bottom; }), 'the text is whole').toBe(true);
    tops.add(Math.round(box.y));
  }
  expect(tops.size, 'all the buttons in one row').toBe(1);
  const first = buttons.first();
  await expect(first).toBeVisible();
  const fb = (await first.boundingBox())!;
  expect(fb.x).toBeGreaterThanOrEqual(plankBox.x - 1);
  const more = dutchman.locator('.buttons-more');
  const overflows = await row.evaluate((e) => e.scrollWidth > e.clientWidth + 1);
  if (overflows) {
    await expect(more).toBeVisible();
    for (let i = 0; i < 6 && (await more.isVisible()); i++) {
      await more.click();
      await page.waitForTimeout(400);
    }
    await expect(more).toBeHidden();
  } else {
    await expect(more).toBeHidden();
  }
  const last = buttons.last();
  await expect(last).toHaveText(/Душа/);
  const lb = (await last.boundingBox())!;
  expect(lb.x).toBeGreaterThanOrEqual(plankBox.x - 1);
  expect(lb.x + lb.width).toBeLessThanOrEqual(Math.min(plankBox.x + plankBox.width, win.width) + 1);
  expect(await page.evaluate(() => [document.scrollingElement!.scrollLeft, document.scrollingElement!.scrollWidth <= innerWidth])).toEqual([0, true]);
  // every button, scrolled to, is whole inside the plank and the window, and its press zone is at least 44 px high:
  // 21 px above and below its centre still press it
  for (const b of await buttons.all()) {
    await b.scrollIntoViewIfNeeded();
    await expect(b).toBeVisible();
    const box = (await b.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(plankBox.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(Math.min(plankBox.x + plankBox.width, win.width) + 1);
    const zone = await b.evaluate((el) => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return [cy - 21.5, cy + 21.5].map((y) => document.elementFromPoint(cx, y)?.closest('.btn') === el);
    });
    expect(zone, 'a press zone of 44 px').toEqual([true, true]);
  }
  expect(await page.evaluate(() => document.scrollingElement!.scrollLeft)).toBe(0);
  await dutchman.screenshot({ path: `${SHOTS}/${name}-4-dutchman.png` });
  // the last button, scrolled into sight, works: a Soul goes to the Hull
  const souls = page.getByTestId('souls-Г');
  const before = await souls.textContent();
  await last.click();
  await expect(souls).not.toHaveText(before!, { timeout: 15_000 });

  // The invisible 44×44 zone grows upwards from the star, leaving the Hull below untouched.
  const star = page.getByTestId('star-И');
  await expect(star).toBeVisible();
  const sb = (await star.boundingBox())!;
  const cx = sb.x + sb.width / 2;
  const hits = await page.evaluate(
    ({ x, y }) =>
      [
        [x - 21, y - 21],
        [x + 21, y - 21],
        [x, y],
        [x - 21, y + 21],
        [x + 21, y + 21],
      ].map(([px, py]) => document.elementFromPoint(px, py)?.closest('[data-testid="star-И"]') !== null),
    { x: cx, y: sb.y + sb.height - 22 },
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
  // a5-log: «Весь журнал» is the ship's book, 760 px wide; the other windows stay 900
  const wide = async (sheet: Locator, shot: string, width = 900) => {
    const box = await expectInWindow(page, sheet);
    expect(Math.round(box.width)).toBe(width);
    await page.screenshot({ path: `${SHOTS}/laptop-${shot}.png` });
    await closeSheet(page);
  };
  await page.locator('.log-actions').getByRole('button', { name: 'Весь журнал' }).click();
  await wide(page.getByTestId('log-sheet'), '1-log', 760);
  await page.getByRole('button', { name: 'Правила' }).first().click();
  await wide(page.getByTestId('rules'), '2-rules');
  await page.getByTestId('plank-Ж').locator('.plank-head').click({ position: { x: 8, y: 8 } });
  await page.getByTestId('ship-sheet').getByRole('button', { name: /^Сброс:/ }).click();
  await wide(page.getByTestId('discard'), '3-discard');
});
