// The game through the interface (docs/TZ.md, stage 7): bots play a match to the victory screen, people play
// against bots and against each other to the end; the table fits the window without page scrolling on a laptop
// (1366×660), the target phone iPhone 15 Pro Max (430×740) and a 390×664 phone; smaller phones may scroll. Screenshots of the key states go to docs/screenshots/stage7/ (replaced on every run).
import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1366, height: 660 },
  { name: 'iphone', width: 430, height: 740 },
  { name: 'phone', width: 390, height: 664 },
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
      await byId(page, 'skip-reaction').click();
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
      const options = panel.locator('.choice-cards > *, .tia-opts > .sopt');
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
  // Printed at once: a test that times out never reaches its final check, and CI shows the cause in the log.
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.log(`[pageerror] ${name}: ${e.message}\n${e.stack ?? ''}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') console.log(`[console.error] ${name}: ${m.text()}`);
  });
  await page.goto('?seed=1&speed=instant');
  await shot(page, name, '1-setup');
  // Two people on one screen, seed 1: the Pearl's Volley at the Endeavour opens a Reaction window.
  await page.getByTestId('quick-duo').click();
  await shot(page, name, '1b-prep');
  await page.getByTestId('prep-start').click();
  await shot(page, name, '2-placement');
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.getByTestId('placement-done').click();
  await shot(page, name, '3-curtain');
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('game')).toBeVisible();
  // Б1: the hint is in the top plaque; the line along the bottom of the sea has «Последнее» only (nothing played yet — no line)
  await expect(page.locator('[data-fx-instruction]')).toContainText('выберите карту или действие');
  await expect(page.getByTestId('middle-info')).toHaveCount(0);
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
  // Behind the curtain the animation layer is off: no plate and no cannonball of the Volley over the Reaction window.
  await expect(page.locator('.fx-layer .plate')).toHaveCount(0);
  await expect(page.locator('.fx-layer .ball')).toHaveCount(0);
  const reactionCard = name === 'laptop' ? page.locator('.hand .hcard.reaction:not(.off)').first() : page.locator('.as-card .hcard:not(.off)').first();
  const clickable = await reactionCard.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit === node || !!hit?.closest('.hcard');
  });
  expect(clickable).toBe(true);
  const skip = page.locator('[data-testid="skip-reaction"]:visible').first();
  const skipBox = await skip.boundingBox();
  expect(skipBox).not.toBeNull();
  if (skipBox) {
    const skipHit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-testid="skip-reaction"]') !== null, { x: skipBox.x + skipBox.width / 2, y: skipBox.y + skipBox.height / 2 });
    expect(skipHit).toBe(true);
  }
  // «Подсказки» are off by default: the incoming damage is shown, and (P8) the window still says what a Reaction
  // does now and gives its full text.
  await expect(page.getByTestId('alarm-pill')).toContainText('по Корпусу');
  if (name === 'laptop') {
    // The Reaction is chosen in the hand, the buttons under the log play it and say what happens now.
    await reactionCard.click();
    await expect(page.getByTestId('reaction-now')).toContainText('Залп');
    await expect(byId(page, 'play-reaction')).toContainText('Сыграть «');
  } else {
    // Phone: the Reactions are the cards of the sheet; a press chooses, the button of the sheet plays.
    await expect(page.locator('.as-card .ro-effect').first()).toContainText('Залп');
    await reactionCard.click();
    await expect(byId(page, 'play-reaction')).toContainText('Сыграть «');
  }
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

/** Two people on one screen: placement of both teams, then the Pirates at the table. */
async function startDuo(page: Page, query: string) {
  await page.goto(query);
  await page.getByTestId('quick-duo').click();
  await page.getByTestId('prep-start').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
}

for (const size of SIZES) {
  test.describe(`${size.name} ${size.width}×${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('key states fit the window', async ({ page }) => keyStates(page, size.name));
  });
}

test.describe('«Подсказки»', () => {
  for (const size of [SIZES[0], SIZES[1]]) {
    test(`${size.name}: off by default — no damage before the choice, the total before «Огонь», no «Залп не дан»`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await startDuo(page, '?seed=1&speed=instant');
      await page.getByTestId('volley-М').click();
      // The whole plank is the target: a frame, no damage on it without «Подсказок».
      const target = page.getByTestId('plate-Г');
      await expect(target).toHaveClass(/aimable/);
      await expect(target).toHaveAttribute('aria-label', 'Цель: «Голландец»');
      await expect(page.getByTestId('aim-tip-Г')).toHaveCount(0);
      // A press on the head chooses the target and does not open the ship card.
      await target.locator('.plank-head').click({ position: { x: 8, y: 8 } });
      await expect(target).toHaveClass(/chosen/);
      // A5: the wax seal «Под огнём» in the head of the target (in place of the reticle)
      await expect(page.getByTestId('target-seal-Г')).toBeVisible();
      await expect(page.getByTestId('ship-sheet')).toHaveCount(0);
      const panel = page.getByTestId('volley-panel');
      await expect(panel.locator('.panel-head')).toContainText('по Корпусу «Голландец»');
      // rig (а): «Огонь!» is the whole oak board (≥ 260 × 56) with its word and the price readable, not a square with a medallion
      const fire = page.getByTestId('fire');
      await expect(fire).toContainText('Огонь');
      await expect(fire.locator('.oak-pan b')).toBeVisible();
      const fb = (await fire.boundingBox())!;
      expect(fb.width).toBeGreaterThanOrEqual(size.name === 'laptop' ? 259 : 150);
      expect(fb.height).toBeGreaterThanOrEqual(55);
      const wb = (await fire.locator('.oak-pan b').evaluate((e) => ({ w: e.getBoundingClientRect().width, sw: e.scrollWidth, cw: e.clientWidth })));
      expect(wb.w).toBeGreaterThan(40);
      expect(wb.sw).toBeLessThanOrEqual(wb.cw + 1); // the word is not cut with «…»
      // «i» opens the ship card; closing it keeps the target and the Volley panel.
      await page.getByTestId('ship-info-Г').click();
      await expect(page.getByTestId('ship-sheet')).toBeVisible();
      await page.locator('.sheet .close').first().click();
      await expect(page.getByTestId('ship-sheet')).toHaveCount(0);
      await expect(target).toHaveClass(/chosen/);
      await expect(panel.locator('.panel-head')).toContainText('по Корпусу «Голландец»');
      if (size.name === 'laptop') await expect(panel.locator('.choices.wide-block .choice')).toHaveCount(1);
      // The Charge is chosen in the hand; the other cards are pale; no damage on the Charges.
      await expect(page.locator('.hand .hcard.order').first()).toHaveClass(/off/);
      await page.locator('.hand .hcard.charge').first().click();
      await expect(page.locator('.hand .hcard.charge').first()).toHaveClass(/chosen/);
      await expect(page.locator('.hand .hcard.charge').first()).not.toContainText('итог');
      await expectFits(page);
      await shot(page, size.name, '10-volley-no-hints');
      await panel.getByRole('button', { name: 'Отмена' }).click();
      await page.locator('[data-testid="end-turn"]:visible').click();
      await expect(page.getByTestId('confirm-end')).toHaveCount(0);
    });

    test(`${size.name}: on — damage on the targets and of each Charge, «Залп не дан»`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await startDuo(page, '?seed=1&speed=instant&hints=1');
      await page.getByTestId('volley-М').click();
      await expect(page.getByTestId('aim-tip-Г')).toContainText(/\d напротив/);
      await page.getByTestId('plate-Г').click();
      await expect(page.getByTestId('plate-Г')).toHaveClass(/chosen/);
      const panel = page.getByTestId('volley-panel');
      if (size.name === 'laptop') await expect(panel.locator('.choices.wide-block .choice b').first()).toHaveText(/^\d/);
      await expect(page.locator('.hand .hcard.charge').first()).toContainText('итог');
      await shot(page, size.name, '11-volley-hints');
      await panel.getByRole('button', { name: 'Отмена' }).click();
      await page.locator('[data-testid="end-turn"]:visible').click();
      await expect(page.getByTestId('confirm-end')).toBeVisible();
    });
  }
});

test.describe('«Ход окончен» in 3 s; «4 → 2» with «Подсказки»', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('«Отменить» keeps the turn; otherwise the device goes to the other team', async ({ page }) => {
    await startDuo(page, '?seed=1&speed=normal');
    await page.locator('[data-testid="end-turn"]:visible').click();
    if (await page.getByTestId('plans-panel').isVisible()) await page.getByTestId('no-plans').click();
    await expect(page.getByTestId('ending')).toBeVisible();
    await page.getByTestId('ending-cancel').click();
    await page.waitForTimeout(3500);
    await expect(page.getByTestId('game')).toBeVisible();
    await expect(page.getByTestId('status')).toContainText('Ход Пиратов');
    await page.locator('[data-testid="end-turn"]:visible').click();
    if (await page.getByTestId('plans-panel').isVisible()) await page.getByTestId('no-plans').click();
    await expect(page.getByTestId('curtain')).toContainText('ход Компании', { timeout: 5000 });
  });

  test('with «Подсказки» a Reaction shows «4 → 2»', async ({ page }) => {
    await startDuo(page, '?seed=1&speed=instant&hints=1');
    await page.getByTestId('volley-Ж').click();
    await page.getByTestId('plate-И').click();
    await page.getByTestId('fire').click();
    await page.getByTestId('curtain-ready').click();
    await expect(page.locator('.hcard-strip.ok').first()).toContainText('→');
  });
});

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
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await playToEnd(page);
    await expect(page.getByTestId('end-screen')).toContainText(/Победа|Ничья/);
  });

  test('two people on one screen play to the end', async ({ page }) => {
    await page.goto('?seed=9&speed=instant');
    await page.getByTestId('quick-duo').click();
    await page.getByTestId('prep-start').click();
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
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await playToEnd(page);
    await expect(page.getByTestId('end-screen')).toContainText(/Победа|Ничья/);
  });
});

// V7: the victory sheet. Four bots play to the end (the seeds give a victory of the Pirates and of the Company); frames at
// 1366×660 and 430×932 go to docs/screenshots/a5-windows/ next to the reference (c-victory-ref-*).
const VICTORIES = [
  { seed: 4, who: 'pirates', ribbon: 'Победа Пиратов', side: 'ПИРАТЫ' },
  { seed: 6, who: 'company', ribbon: 'Победа Компании', side: 'КОМПАНИЯ' },
] as const;

async function toVictory(page: Page, seed: number) {
  await page.goto(`?seed=${seed}&speed=instant`);
  await page.getByTestId('quick-match').click();
  await expect(page.getByTestId('end-screen')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('victory-title')).toHaveCount(4, { timeout: 10_000 });
}

/** The sheet has shown itself: no animation of it runs but the endless ones (the panorama). */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    document
      .querySelector('.victory-backdrop')!
      .getAnimations({ subtree: true })
      .every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity),
  );
}

for (const size of [
  { width: 1366, height: 660 },
  { width: 430, height: 932 },
]) {
  test.describe(`V7: the victory sheet ${size.width}×${size.height}`, () => {
    test.use({ viewport: size });
    for (const v of VICTORIES) {
      test(`${v.who}: the ribbon, the panorama of this end, the best captain, a title for each ship, the buttons`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await toVictory(page, v.seed);
        const sheet = page.getByTestId('end-screen');
        await expect(page.getByTestId('victory-ribbon')).toHaveText(v.ribbon);
        await expect(page.getByTestId('victory-line')).toContainText(/На дне: «.+»/);
        await expect(page.getByTestId('victory-line')).toContainText(/\d+ ход/);
        // the panorama: the ships afloat of the winners, every sunk ship at the places of the sinking
        const cast = await page.getByTestId('victory-pano').evaluate((el) => ({
          afloat: Array.from(el.querySelectorAll('[data-pano-afloat]')).map((e) => e.getAttribute('data-pano-afloat')!),
          sunk: Array.from(el.querySelectorAll('[data-pano-sunk]')).map((e) => e.getAttribute('data-pano-sunk')!),
        }));
        const rows = page.getByTestId('victory-row');
        const gone = await rows.evaluateAll((els) => els.filter((e) => e.classList.contains('gone')).map((e) => e.getAttribute('data-ship')!));
        expect(cast.sunk.slice().sort()).toEqual(gone.slice().sort());
        expect(cast.afloat.length).toBeGreaterThan(0);
        const pirates = ['Ж', 'М'];
        for (const c of cast.afloat) expect(pirates.includes(c)).toBe(v.side === 'ПИРАТЫ');
        await expect(page.getByTestId('best-captain')).toContainText('Лучший капитан');
        await expect(rows).toHaveCount(4);
        for (const b of ['Новая партия', 'Скачать партию', 'Посмотреть стол', 'Скачать журнал']) await expect(sheet.getByRole('button', { name: b, exact: true })).toBeInViewport();
        await expect(page.getByTestId('rematch')).toContainText('те же корабли, новая партия');
        await expect(page.getByTestId('rematch')).toBeInViewport();
        await expectFits(page);
        await settled(page);
        await page.screenshot({ path: `docs/screenshots/a5-windows/c-victory-${v.who}-${size.width}x${size.height}.png` });
        await sheet.getByRole('button', { name: 'Посмотреть стол' }).click();
        await expect(sheet).toHaveCount(0);
        expect(errors).toEqual([]);
      });
    }
  });
}

test.describe('V7: a small phone 390×664', () => {
  test.use({ viewport: { width: 390, height: 664 } });
  test('the list scrolls inside the sheet; the buttons stay at its foot', async ({ page }) => {
    await toVictory(page, 4);
    await expectFits(page);
    const scroll = await page.locator('.v-scroll').evaluate((e) => ({ sh: e.scrollHeight, ch: e.clientHeight }));
    expect(scroll.sh).toBeGreaterThan(scroll.ch);
    await expect(page.getByTestId('rematch')).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Посмотреть стол' })).toBeInViewport();
  });
});

test.describe('V7: reduced motion', () => {
  test.use({ viewport: { width: 1366, height: 660 } });
  test('the sheet is there at once: nothing of it moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await toVictory(page, 6);
    const running = await page.evaluate(() => document.querySelector('.victory-backdrop')!.getAnimations({ subtree: true }).length);
    expect(running).toBe(0);
  });
});

// Safari on an iPhone (WebKit with the iPhone 15 Pro Max profile): run by the e2e job on GitHub Actions.
test('iPhone 15 Pro Max: key states fit the window @iphone', async ({ page }) => keyStates(page, 'iphone15promax'));

// Б6 (a5-art3): the line «Последнее», the played card, «Колода · Сброс», the Hold, the hourglass and the cards of the hand
// do not run into each other (getBoundingClientRect), at three sizes. The scene «card» plays a card of «Голландец»; «&strip=1»
// puts the line of the game on its table.
for (const v of [
  { w: 1366, h: 660 },
  { w: 1920, h: 1080 },
  { w: 430, h: 932 },
]) {
  test(`${v.w}×${v.h}: the line «Последнее», the played card, the deck, the Hold, the hourglass and the hand do not overlap`, async ({ page }) => {
    await page.setViewportSize({ width: v.w, height: v.h });
    await page.goto('?fxScene=card&speed=normal&strip=1');
    await page.waitForFunction(() => !!document.querySelector('.fx-layer .fcard'), null, { timeout: 40_000, polling: 'raf' });
    await page.waitForTimeout(900); // the card has landed
    const r = await page.evaluate(() => {
      const box = (e: Element) => {
        const b = e.getBoundingClientRect();
        return { l: b.left, r: b.right, t: b.top, b: b.bottom };
      };
      const one = (q: string) => {
        const e = document.querySelector(q);
        return e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 ? box(e) : null;
      };
      const many = (q: string) => Array.from(document.querySelectorAll(q)).map(box);
      return {
        info: one('[data-testid="middle-info"]'),
        card: one('.fx-layer .flyc'),
        deck: one('[data-fx-deck]'),
        hold: one('.board-bottom > .team-row:not(.table-edge)'),
        label: one('.board-bottom > .team-row:not(.table-edge) .hold-label .wide'),
        glass: one('.board-bottom > .team-row .hold-glass'),
        kegs: one('.board-bottom > .team-row .powder-dots'),
        cards: many('.hand-cards .hcard'),
        handRow: one('.hand-row'),
        sea: one('.sea-table'),
        wheel: one('[data-thing="wheel"]'),
      };
    });
    type R = { l: number; r: number; t: number; b: number };
    const meet = (a: R, b: R, m = 0) => a.l < b.r + m && b.l < a.r + m && a.t < b.b + m && b.t < a.b + m;
    const named: [string, R | null][] = [['«Последнее»', r.info], ['the played card', r.card], ['the deck line', r.deck], ['the Hold', r.hold], ['the hourglass', r.glass], ...r.cards.map((c, i): [string, R] => [`hand card ${i}`, c])];
    expect(r.info, 'the line «Последнее»').not.toBeNull();
    expect(r.card, 'the played card').not.toBeNull();
    expect(r.deck, 'the deck line').not.toBeNull();
    expect(r.hold, 'the Hold').not.toBeNull();
    const bad: string[] = [];
    for (let i = 0; i < named.length; i++)
      for (let j = i + 1; j < named.length; j++) {
        const [na, a] = named[i], [nb, b] = named[j];
        if (a && b && !(na.startsWith('hand card') && nb.startsWith('hand card')) && !(na === 'the Hold' && nb === 'the hourglass') && meet(a, b)) bad.push(`${na} ∩ ${nb}`);
      }
    expect(bad).toEqual([]);
    if (r.wheel) {
      // «Вещи на столе»: the wheel (bottom left) keeps clear of the Hold and of «Перестроение», which sits right under the Hold
      // (a 194 × 34 plank, 7 px below; the scene has no button, so its place is reckoned from the Hold)
      const zone = { l: r.hold!.l, r: r.hold!.l + 194, t: r.hold!.b + 7, b: r.hold!.b + 41 };
      expect(meet(r.wheel, r.hold!), 'the wheel and the Hold').toBe(false);
      expect(meet(r.wheel, zone), 'the wheel and «Перестроение»').toBe(false);
    }
    if (r.glass) {
      expect(r.glass.l, 'the hourglass stands right of the kegs').toBeGreaterThanOrEqual(r.kegs!.r - 1);
      // the hourglass is to the right of the kegs and keeps ≥ 12 px clear of every card of the hand
      for (const c of r.cards) if (c.t < r.glass.b && c.b > r.glass.t) expect(c.l - r.glass.r, 'the hourglass and the first cards').toBeGreaterThanOrEqual(12);
    }
    if (v.w > 700) {
      // Б4: the caption of the Hold is right under the frame of the sea, level with the row of the hand
      expect(r.label!.t - r.sea!.b, 'the caption right under the sea').toBeLessThanOrEqual(24);
      expect(Math.abs(r.label!.t - r.handRow!.t), 'the caption level with the row of the hand').toBeLessThanOrEqual(16);
    }
  });
}

// rig, г: «Фон под рукой» — the deck (or the captain's table) fills the whole window; its props lie only in free places
for (const look of ['deck', 'table'] as const) {
  for (const v of [{ w: 1366, h: 660 }, { w: 1920, h: 1080 }]) {
    test(`the background «${look}» on ${v.w}×${v.h}: the props keep clear of the hand, the Hold, the buttons and the log`, async ({ page }) => {
      await page.addInitScript((l) => localStorage.setItem('bortom-k-bortu.settings', JSON.stringify({ view: { hand: l } })), look);
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto('?seed=5&speed=instant');
      await page.getByTestId('quick-bots').click();
      await page.getByTestId('prep-start').click();
      await page.getByTestId('placement-done').click();
      await expect(page.getByTestId('game')).toBeVisible();
      await expect(page.getByTestId('backdrop')).toHaveClass(new RegExp(`look-${look}`));
      if (look === 'deck') {
        // no «Вещи на столе» (compass, coins, wheel…) on the deck; the planks are a repeating tile, not one stretched picture;
        // the scene of A5Rig lies under the hand, its lantern flare is drawn
        await expect(page.locator('[data-thing]')).toHaveCount(0);
        const bg = await page.locator('.deck-bg').evaluate((e) => getComputedStyle(e).backgroundRepeat);
        expect(bg).toContain('repeat');
        await expect(page.getByTestId('deck-scene')).toBeVisible();
        await expect(page.getByTestId('lantern-light')).toHaveCount(1);
      } else {
        await expect(page.locator('.table-things')).toHaveCount(1);
      }
      const r = await page.evaluate(() => {
        const box = (e: Element) => {
          const b = e.getBoundingClientRect();
          return { l: b.left, r: b.right, t: b.top, b: b.bottom };
        };
        const panels: [string, ReturnType<typeof box>][] = [];
        for (const q of ['.hand-cards .hcard', '.board-bottom > .team-row:not(.table-edge)', '.board-bottom > .team-row:not(.table-edge) *', '.log-col', '.log-col *', '.sea-table', '.status-text', '.end-turn', '.round-btn', '.tool'])
          document.querySelectorAll(q).forEach((e) => {
            const b = e.getBoundingClientRect();
            if (b.width > 0 && b.height > 0 && getComputedStyle(e).display !== 'contents') panels.push([q, box(e)]);
          });
        const props = Array.from(document.querySelectorAll('.prop, .deck-scene')).map((e) => [e.getAttribute('data-prop'), box(e)] as const);
        return { panels, props, iw: innerWidth, ih: innerHeight };
      });
      expect(r.props.length, 'the scene or the props found a free place').toBeGreaterThan(0);
      const meet = (a: { l: number; r: number; t: number; b: number }, b: { l: number; r: number; t: number; b: number }) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const bad: string[] = [];
      for (const [name, p] of r.props) {
        if (p.l < 0 || p.t < 0 || p.r > r.iw || p.b > r.ih) bad.push(`${name} outside the window`);
        // the scene lies under the cards of the hand (they are on it, as in the reference); nothing lies under the rest
        for (const [q, b] of r.panels) if (meet(p, b) && !(name === null && q === '.hand-cards .hcard')) bad.push(`${name} ∩ ${q}`);
      }
      expect(bad).toEqual([]);
      await page.screenshot({ path: `docs/screenshots/rig/g-e2e-${look}-${v.w}x${v.h}.png` });
    });
  }
}
