// P8, clear the first time: the attacker's plate while the enemy decides on a Reaction, the Reaction window with the
// full card text and «what happens now» without «Подсказки», «✓ готов» after «Ход окончен», the 1 s end of the turn.
// Screenshots go to docs/screenshots/p8/ (replaced on every run).
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { loadGameData } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/engine';
import { createRng } from '../src/engine/rng';
import { cardByCode } from '../src/engine/state';

const SHOTS = 'docs/screenshots/p8';
const data = loadGameData(JSON.parse(readFileSync('data/game-data.json', 'utf8')));
const plain = (html: string) => html.replace(/<[^>]+>/g, '');

/**
 * A seed of «Против ботов» (the person plays the Pirates, placed as listed) where the first Volley of «Жемчужина»
 * gives the Company bot a Reaction to think about, and the target of that Volley.
 */
function seedWithBotReaction(): { seed: number; target: string } {
  for (let seed = 1; seed < 2000; seed++) {
    const s = createGame(data, { seed, variant: 'standard', sea: true, legends: true, positions: { ПИРАТЫ: ['Ж', 'М'] } }).state;
    for (const target of ['И', 'Г']) {
      try {
        const r = applyAction(s, { type: 'volley', ship: 'Ж', target }, data).state;
        if (r.pending?.kind === 'reactions' && r.pending.waiting.length > 0) return { seed, target };
      } catch {
        // Not this target.
      }
    }
  }
  throw new Error('no seed');
}

/** The person plays the Pirates against the Company bots. */
async function piratesAgainstBots(page: Page, query: string) {
  await page.goto(query);
  await page.getByTestId('quick-bots').click();
  await page.getByTestId('pick-pirates').click();
  await page.getByTestId('prep-start').click();
  await page.getByTestId('placement-done').click();
  await expect(page.getByTestId('game')).toBeVisible();
  // The first sea card and «Ваш ход» go by (they do not block the input, but would cover the screenshots).
  await expect(page.getByTestId('sea-banner')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByTestId('turn-banner')).toHaveCount(0, { timeout: 10_000 });
}

/** Two people on one screen, seed 1: the Pearl's Volley at the Endeavour opens the Company's Reaction window. */
async function duoReactionWindow(page: Page, hints = false) {
  await page.goto(`?seed=1&speed=instant&hints=${Number(hints)}`);
  await page.getByTestId('quick-duo').click();
  await page.getByTestId('prep-start').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.locator('[data-testid="volley-Ж"]:visible').click();
  await page.getByTestId('plate-И').click();
  await page.getByTestId('fire').click();
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('reaction-panel')).toBeVisible();
}

/** «Ход окончен» (the Pearl puts nothing into Plans). */
async function endTurn(page: Page) {
  await page.locator('[data-testid="end-turn"]:visible').click();
  const noPlans = page.getByTestId('no-plans');
  if (await noPlans.isVisible({ timeout: 1000 }).catch(() => false)) await noPlans.click();
}

test.describe('laptop 1366×660', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('the attacker sees the Volley and «бот думает» while the Company decides on a Reaction', async ({ page }) => {
    const { seed, target } = seedWithBotReaction();
    await piratesAgainstBots(page, `?seed=${seed}&speed=slow`);
    await page.locator('[data-testid="volley-Ж"]:visible').click();
    await page.getByTestId(`plate-${target}`).click();
    await page.getByTestId('fire').click();
    const plate = page.getByTestId('reaction-wait');
    await expect(plate).toBeVisible();
    // The clip of the Volley is on screen first, and the status bar describes the clip; «Пауза» stops a clip in the
    // middle. So the clip goes by (the bar then names the team that decides), and only then «Пауза» holds the bot: the
    // plate stays for the check and the screenshot.
    await expect(page.getByTestId('instruction')).toContainText('Компания (бот) решает', { timeout: 30_000 });
    await page.locator('[data-testid="pause-show"]:visible').click();
    const nick = data.ships.find((x) => x.code === target)!.nick;
    await expect(plate).toContainText(new RegExp(`Залп «Жемчужина» → «${nick}»: \\d+ по Корпусу\\. Компания решает, ответить ли Реакцией…`));
    await expect(plate).toContainText('Бот думает…');
    // The enemy's Reactions are not named anywhere; the status bar names the team, not the ship.
    await expect(page.getByTestId('instruction')).toContainText('Компания (бот) решает');
    await expect(page.locator('.reaction-opt')).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/laptop-reaction-wait.png` });
    await page.locator('[data-testid="pause-show"]:visible').click();
    await expect(plate).toBeHidden({ timeout: 30_000 });
  });

  test('without «Подсказки» the Reaction window: «Тревога!», the Reaction chosen in the hand says what happens now, «i» gives the full card', async ({ page }) => {
    await duoReactionWindow(page);
    const panel = page.getByTestId('reaction-panel');
    await expect(page.getByTestId('alarm')).toContainText('ТРЕВОГА!');
    await expect(page.getByTestId('alarm')).toContainText('даёт Залп по «Индевору» — ответите Реакцией?');
    // The phone-only explanatory note (Б2) is covered with both hint settings below.
    // The arrow and the pill are on the table; the strip of the outcome is under «Подсказки» only.
    await expect(page.getByTestId('alarm-pill')).toContainText('по Корпусу');
    await expect(page.locator('.hcard-strip.ok')).toHaveCount(0);
    // The cards that are not Reactions are faded and lowered (A5Alarm.png).
    const dim = page.locator('.hand .hcard.al-dim');
    expect(await dim.count()).toBeGreaterThan(0);
    expect(Number(await dim.first().evaluate((e) => getComputedStyle(e).opacity))).toBeLessThan(0.7);
    const card = page.locator('.hand .hcard.al-ok').first();
    const code = (await card.getAttribute('data-card'))!;
    await card.click();
    await expect(panel.getByTestId('reaction-now')).toHaveText(/^Залп \d+ → \d+$/);
    await expect(panel.getByTestId('play-reaction')).toHaveText(`Сыграть «${cardByCode(data, code).name}»`);
    await page.screenshot({ path: `${SHOTS}/laptop-reaction-window.png` });
    await panel.getByTestId('reaction-info').click();
    await expect(page.getByTestId('card-detail')).toContainText(plain(cardByCode(data, code).text));
    await page.getByTestId('card-detail').getByRole('button', { name: 'Закрыть' }).click();
  });

  test('«Свернуть, посмотреть стол» lowers the hand and hides «Пропустить»; «Тревога!», the arrow and the frame stay; «Вернуться» brings them back', async ({ page }) => {
    await duoReactionWindow(page);
    await expect(page.getByTestId('skip-reaction')).toBeVisible();
    await page.getByTestId('alarm-collapse').click();
    await expect(page.getByTestId('skip-reaction')).toHaveCount(0);
    await expect(page.getByTestId('alarm')).toBeVisible();
    await expect(page.getByTestId('alarm-arrow')).toBeVisible();
    await expect(page.getByTestId('alarm-sabres-И')).toBeVisible();
    await page.getByTestId('alarm-expand').click();
    await expect(page.getByTestId('skip-reaction')).toBeVisible();
    await expect(page.getByTestId('alarm-collapse')).toBeVisible();
  });

  test('«✓ готов» after «Ход окончен»; «Быстрый конец хода» makes the countdown 1 s', async ({ page }) => {
    await piratesAgainstBots(page, '?seed=1&speed=normal');
    await expect(page.locator('[data-testid="end-turn"]:visible')).toHaveAttribute('aria-disabled', 'false');
    await endTurn(page);
    const ending = page.locator('[data-testid="end-turn"]:visible').first();
    await expect(ending).toContainText('Ход окончен · 3');
    // «✓ готов»: the tick is an SVG icon now (A5), the word stays text.
    for (const code of ['Ж', 'М']) {
      const ready = page.getByTestId(`ready-${code}`);
      await expect(ready).toHaveText('готов');
      await expect(ready.locator('.tick svg')).toBeVisible();
    }
    await expect(page.locator('[data-testid^="ready-"]')).toHaveCount(2);
    await page.screenshot({ path: `${SHOTS}/laptop-ready.png` });
    await page.locator('[data-testid="undo"]:visible').first().click();
    await expect(ending).not.toContainText('Ход окончен ·');
    await expect(page.locator('[data-testid^="ready-"]')).toHaveCount(0);

    // ⚙ → «Быстрый конец хода»: the turn passes in 1 s.
    await page.getByTestId('settings-btn').click();
    await page.getByTestId('fast-end').check();
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await endTurn(page);
    await expect(ending).toContainText('Ход окончен · 1');
    const shown = Date.now();
    await expect(ending).not.toContainText('Ход окончен ·', { timeout: 5000 });
    expect(Date.now() - shown).toBeLessThan(2500);
    await expect(page.getByTestId('instruction')).toContainText('Бот');
  });
});

test.describe('phone 430×740', () => {
  test.use({ viewport: { width: 430, height: 740 } });

  test('the Reaction window: a sheet with the Reactions as cards, a press chooses, «i» opens the card and keeps the choice, «Сыграть» from it plays', async ({ page }) => {
    await duoReactionWindow(page, true);
    await expect(page.getByTestId('reaction-memo')).toContainText('Реакция — карта, которую играют в ход противника в ответ на его Залп. Можно пропустить.');
    await duoReactionWindow(page, false);
    const panel = page.getByTestId('reaction-panel');
    await expect(page.getByTestId('alarm')).toContainText('ТРЕВОГА!');
    await expect(panel.getByTestId('reaction-memo')).toHaveCount(0);
    const row = panel.locator('.as-card').first();
    const code = (await row.getAttribute('data-card'))!;
    const name = cardByCode(data, code).name;
    await expect(row.getByTestId('hcard-strip')).toContainText('Залп');
    // A press on the card chooses the Reaction.
    await row.locator('.hcard').click();
    await expect(panel.getByTestId('play-reaction').locator('.oak-pan b')).toHaveText(`Сыграть «${name}»`);
    await expect(row).toHaveClass(/on/);
    await page.screenshot({ path: `${SHOTS}/phone-reaction-window.png` });
    // «i» — the card in full; closing it brings back the window with the choice kept.
    await row.getByTestId('reaction-info').click();
    await expect(page.getByTestId('card-detail')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/phone-reaction-card.png` });
    await page.getByTestId('card-detail').getByRole('button', { name: 'Закрыть' }).click();
    await expect(page.getByTestId('card-detail')).toBeHidden();
    await expect(panel.getByTestId('play-reaction').locator('.oak-pan b')).toHaveText(`Сыграть «${name}»`);
    await expect(row).toHaveClass(/on/);
    // «Сыграть» in the card plays the Reaction, as the button of the window does.
    await row.getByTestId('reaction-info').click();
    await page.getByTestId('detail-play').click();
    await expect(page.locator(`.as-card[data-card="${code}"]`)).toHaveCount(0);
    // Seed 1: a second Reaction window may open; without hints it has no explanatory note either.
    if (await page.getByTestId('reaction-panel').isVisible()) {
      await expect(page.getByTestId('reaction-memo')).toHaveCount(0);
      await page.locator('[data-testid="skip-reaction"]:visible').click();
    }
    await expect(page.getByTestId('curtain')).toBeVisible();
    await page.getByTestId('curtain-ready').click();
    await page.getByRole('button', { name: 'Журнал', exact: true }).last().click();
    await expect(page.getByTestId('log-sheet')).toContainText(`«${name}»`);
  });

  test('the sheet goes down by «Свернуть» (the table is whole, no sideways scroll) and comes back', async ({ page }) => {
    await duoReactionWindow(page);
    const wide = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(await wide()).toBe(false);
    await page.getByTestId('alarm-collapse').click();
    await expect(page.getByTestId('skip-reaction')).toHaveCount(0);
    await expect(page.getByTestId('alarm-expand')).toBeVisible();
    expect(await wide()).toBe(false);
    await page.getByTestId('alarm-expand').click();
    await expect(page.getByTestId('skip-reaction')).toBeVisible();
  });
});

test.describe('«Жребий» on the preparation screen', () => {
  /** The verdicts of 20 tosses. */
  async function tosses(page: Page, query: string): Promise<string[]> {
    await page.goto(query);
    await page.getByTestId('quick-bots').click();
    const out: string[] = [];
    for (let i = 0; i < 20; i++) {
      await page.getByTestId('pick-coin').click();
      out.push((await page.getByTestId('coin-verdict').textContent())!);
    }
    return out;
  }

  test('without a seed each toss is new: both sides come up in 20 tosses', async ({ page }) => {
    const verdicts = await tosses(page, '?speed=instant');
    expect(verdicts.some((v) => v.includes('Пираты'))).toBe(true);
    expect(verdicts.some((v) => v.includes('Компания'))).toBe(true);
    // The game starts on the side the coin showed last.
    const last = verdicts.at(-1)!.includes('Пираты') ? 'Пиратов' : 'Компанию';
    await page.getByTestId('prep-start').click();
    await expect(page.getByTestId('placement')).toContainText(`Жребий: вы играете за ${last}`);
    // …and with the seed the coin fell by (the autosave keeps it; the coin of a seed — coinOf in Prep.tsx).
    await page.getByTestId('placement-done').click();
    await expect(page.getByTestId('game')).toBeVisible();
    const seed = await page.evaluate(() => JSON.parse(localStorage.getItem('bortom-k-bortu.save')!).setup.game.seed as number);
    const coin = createRng(seed ^ 0x5bd1e995).int(2) === 0 ? 'Пиратов' : 'Компанию';
    expect(coin).toBe(last);
  });

  test('with ?seed every toss is the same', async ({ page }) => {
    const verdicts = await tosses(page, '?seed=1&speed=instant');
    expect(new Set(verdicts).size).toBe(1);
  });
});
