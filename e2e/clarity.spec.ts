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
async function duoReactionWindow(page: Page) {
  await page.goto('?seed=1&speed=instant&hints=0');
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
    // «Пауза» holds the bot: the plate stays for the check and the screenshot.
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

  test('without «Подсказки» the Reaction window gives the full text, «what happens now» and the note', async ({ page }) => {
    await duoReactionWindow(page);
    const panel = page.getByTestId('reaction-panel');
    await expect(panel.getByTestId('reaction-memo')).toContainText('Реакция — карта, которую играют в ход противника в ответ на его Залп. Можно пропустить.');
    const row = panel.locator('.reaction-opt').first();
    const code = (await row.getAttribute('data-card'))!;
    await expect(row.locator('.ro-text')).toHaveText(plain(cardByCode(data, code).text));
    await expect(row.locator('.ro-effect')).toHaveText(/^Залп \d+ → \d+$/);
    await page.screenshot({ path: `${SHOTS}/laptop-reaction-window.png` });
  });

  test('«✓ готов» after «Ход окончен»; «Быстрый конец хода» makes the countdown 1 s', async ({ page }) => {
    await piratesAgainstBots(page, '?seed=1&speed=normal');
    await expect(page.locator('[data-testid="end-turn"]:visible')).toHaveAttribute('aria-disabled', 'false');
    await endTurn(page);
    const ending = page.getByTestId('ending');
    await expect(ending).toContainText('через 3 с');
    await expect(page.getByTestId('ready-Ж')).toHaveText('✓ готов');
    await expect(page.getByTestId('ready-М')).toHaveText('✓ готов');
    await expect(page.locator('[data-testid^="ready-"]')).toHaveCount(2);
    await page.screenshot({ path: `${SHOTS}/laptop-ready.png` });
    await page.getByTestId('ending-cancel').click();
    await expect(page.locator('[data-testid^="ready-"]')).toHaveCount(0);

    // ⚙ → «Быстрый конец хода»: the turn passes in 1 s.
    await page.getByTestId('settings-btn').click();
    await page.getByTestId('fast-end').check();
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await endTurn(page);
    await expect(ending).toContainText('через 1 с');
    const shown = Date.now();
    await expect(ending).toBeHidden({ timeout: 5000 });
    expect(Date.now() - shown).toBeLessThan(2500);
    await expect(page.getByTestId('instruction')).toContainText('Бот');
  });
});

test.describe('phone 430×932', () => {
  test.use({ viewport: { width: 430, height: 932 } });

  test('the Reaction window: text folded to 2 lines with «Ещё», «i» opens the card and keeps the choice, «Сыграть» from it plays', async ({ page }) => {
    await duoReactionWindow(page);
    const panel = page.getByTestId('reaction-panel');
    await expect(panel.getByTestId('reaction-memo')).toBeVisible();
    const row = panel.locator('.reaction-opt').first();
    const code = (await row.getAttribute('data-card'))!;
    const name = cardByCode(data, code).name;
    await expect(row.locator('.ro-effect')).toContainText('Залп');
    // «Ещё» unfolds the text, «Свернуть» folds it back.
    await row.locator('.ro-more').click();
    await expect(row).toHaveClass(/open/);
    await row.locator('.ro-more').click();
    await expect(row).not.toHaveClass(/open/);
    // A press on the row chooses the Reaction.
    await row.click();
    await expect(page.locator('[data-testid="play-reaction"]:visible')).toHaveText(`Сыграть «${name}»`);
    await page.screenshot({ path: `${SHOTS}/phone-reaction-window.png` });
    // «i» — the card in full; closing it brings back the window with the choice kept.
    await row.getByTestId('reaction-info').click();
    await expect(page.getByTestId('card-detail')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/phone-reaction-card.png` });
    await page.getByTestId('card-detail').getByRole('button', { name: 'Закрыть' }).click();
    await expect(page.getByTestId('card-detail')).toBeHidden();
    await expect(page.locator('[data-testid="play-reaction"]:visible')).toHaveText(`Сыграть «${name}»`);
    // «Сыграть» in the card plays the Reaction, as the button of the window does.
    await row.getByTestId('reaction-info').click();
    await page.getByTestId('detail-play').click();
    await expect(page.locator(`.reaction-opt[data-card="${code}"]`)).toHaveCount(0);
    // Seed 1: the window «после Залпа» opens next (another Reaction) — still the first window: the note stays.
    if (await page.getByTestId('reaction-panel').isVisible()) {
      await expect(page.getByTestId('reaction-memo')).toBeVisible();
      await page.locator('[data-testid="skip-reaction"]:visible').click();
    }
    await expect(page.getByTestId('curtain')).toBeVisible();
    await page.getByTestId('curtain-ready').click();
    await page.getByRole('button', { name: 'Журнал', exact: true }).last().click();
    await expect(page.getByTestId('log-sheet')).toContainText(`«${name}»`);
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
