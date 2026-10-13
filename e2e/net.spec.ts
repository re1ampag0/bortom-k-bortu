// A network game in two browser tabs against a local game server (stage 8): create a room, enter it by the code,
// take the seats, place the ships, play turns with a Volley and a Reaction, reload one tab — the player comes back to
// the seat. Screenshots go to docs/screenshots/stage8/ (replaced on every run).
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { loadGameData } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/engine';

const SERVER = 'http://localhost:8090/bortom-k-bortu/';
const SHOTS = 'docs/screenshots/stage8';
const data = loadGameData(JSON.parse(readFileSync('data/game-data.json', 'utf8')));

/**
 * A seed where the first Volley of «Жемчужина» at «Индевор» (the ships placed as listed) gives the Company a
 * Reaction to play: the test then plays it.
 */
function seedWithReaction(): number {
  for (let seed = 1; seed < 2000; seed++) {
    const s = createGame(data, { seed, positions: { ПИРАТЫ: ['Ж', 'М'], КОМПАНИЯ: ['И', 'Г'] }, pauseEmptyWindows: true }).state;
    try {
      const r = applyAction(s, { type: 'volley', ship: 'Ж', target: 'И' }, data).state;
      if (r.pending?.kind === 'reactions' && r.pending.waiting.length > 0) return seed;
    } catch {
      // Not this seed.
    }
  }
  throw new Error('no seed');
}

/** The defender skips every Reaction window until the attacker no longer waits. */
async function skipWindows(defender: Page, attacker: Page) {
  for (let i = 0; i < 100; i++) {
    const skip = defender.locator('[data-testid="skip-reaction"]:visible');
    if (await skip.isVisible().catch(() => false)) {
      // The panel may close under the click (the window closed): then just look again.
      await skip.click({ timeout: 3000 }).catch(() => {});
      continue;
    }
    if (!(await attacker.locator('.status').textContent())?.includes('Противник может ответить')) return;
    await attacker.waitForTimeout(100);
  }
  throw new Error('the Reaction window did not close');
}

/** «Ход окончен» (the Pearl puts nothing into Plans). */
async function endTurn(page: Page) {
  await page.locator('[data-testid="end-turn"]:visible').click();
  const noPlans = page.getByTestId('no-plans');
  if (await noPlans.isVisible({ timeout: 1000 }).catch(() => false)) await noPlans.click();
}

async function tab(browser: Browser, url: string, width = 1366, height = 660): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(url);
  return page;
}

test('two tabs: a room by its code, a Volley and a Reaction, a reload brings the player back', async ({ browser }) => {
  const seed = seedWithReaction();

  // Аня creates the room.
  const a = await tab(browser, `${SERVER}?speed=instant`);
  await a.getByTestId('quick-net').click();
  await a.getByTestId('net-name').fill('Аня');
  await a.getByTestId('net-create').click();
  await expect(a.getByTestId('room')).toBeVisible();
  const code = (await a.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-Z2-9]{5}$/);
  await expect(a.getByTestId('room-qr')).toBeVisible();
  await a.getByTestId('room-seed').fill(String(seed));

  // Боря opens the link of the room on a phone and enters his name.
  const b = await tab(browser, `${SERVER}?room=${code}&speed=instant`, 430, 740);
  await b.getByTestId('net-name').fill('Боря');
  await b.getByTestId('net-join').click();
  await expect(b.getByTestId('room')).toBeVisible();

  await a.getByTestId('sit-Ж').click();
  await a.getByTestId('sit-М').click();
  await b.getByTestId('sit-И').click();
  await b.getByTestId('sit-Г').click();
  await expect(a.getByTestId('seat-Г')).toContainText('Боря');
  await expect(a.getByTestId('room-seed')).toHaveValue(String(seed));
  await a.screenshot({ path: `${SHOTS}/laptop-1-room.png` });
  await a.getByTestId('room-start').click();

  // The secret placement of each team, as listed.
  await a.getByTestId('placement-done').click();
  await b.getByTestId('placement-done').click();
  await expect(a.getByTestId('game')).toBeVisible();
  await expect(b.getByTestId('game')).toBeVisible();
  await expect(a.getByTestId('game')).toHaveAttribute('data-bottom', 'ПИРАТЫ');
  await expect(b.getByTestId('game')).toHaveAttribute('data-bottom', 'КОМПАНИЯ');
  await expect(a).toHaveTitle(/● Ваш ход/);
  await expect(b).not.toHaveTitle(/● Ваш ход/);

  // Аня fires at «Индевор»; Боря answers with a Reaction (chosen in the hand on his phone).
  await a.locator('[data-testid="volley-Ж"]:visible').click();
  await a.getByTestId('plate-И').click();
  await a.getByTestId('fire').click();
  await expect(a.locator('.status')).toContainText('Противник может ответить');
  await expect(b.getByTestId('reaction-panel')).toBeVisible();
  await expect(b).toHaveTitle(/● Ваш ход/);
  await b.screenshot({ path: `${SHOTS}/iphone-2-reaction.png` });
  await b.locator('.hand .hcard.reaction:not(.off)').first().click();
  await b.locator('[data-testid="play-reaction"]:visible').click();
  await expect(a.locator('.log-col')).toContainText('Реакция');
  // The window is offered again after a Reaction (RULES.md 12.5): Боря has nothing more to play.
  await skipWindows(b, a);
  await a.screenshot({ path: `${SHOTS}/laptop-3-after-reaction.png` });

  // «Напомнить» from the waiting player… and the end of the Pirates' turn.
  await expect(b.locator('[data-testid="remind"]:visible')).toBeVisible();
  await endTurn(a);
  await expect(b.locator('.status')).toContainText('Ход Компании', { timeout: 15_000 });
  await expect(b).toHaveTitle(/● Ваш ход/);

  // Боря reloads the page: he is back at his seats, his turn.
  await b.reload();
  await expect(b.getByTestId('game')).toBeVisible();
  await expect(b.getByTestId('game')).toHaveAttribute('data-bottom', 'КОМПАНИЯ');
  await expect(b).toHaveTitle(/● Ваш ход/);
  await b.screenshot({ path: `${SHOTS}/iphone-4-after-reload.png` });

  // The phone loses the network (Safari in the background, the screen locked) and gets it back: the client
  // reconnects by itself, without a reload.
  await b.context().setOffline(true);
  await expect(b.getByTestId('net-offline')).toBeVisible({ timeout: 30_000 });
  await b.screenshot({ path: `${SHOTS}/iphone-5-offline.png` });
  await b.context().setOffline(false);
  await expect(b.getByTestId('net-offline')).toBeHidden({ timeout: 15_000 });

  // Боря fires back and ends the turn; the turn returns to Аня.
  const volley = b.locator('.plank-buttons [data-testid^="volley-"]:not([aria-disabled="true"]):visible');
  if ((await volley.count()) > 0) {
    await volley.first().click();
    await b.locator('[data-testid^="plate-"]').first().click();
    await b.getByTestId('fire').click();
  }
  // Аня may have a Reaction now: she skips it.
  await skipWindows(a, b);
  await endTurn(b);
  await expect(a.locator('.status')).toContainText('Раунд 2', { timeout: 15_000 });
  await expect(a).toHaveTitle(/● Ваш ход/);
  await a.screenshot({ path: `${SHOTS}/laptop-6-round-2.png` });
});
