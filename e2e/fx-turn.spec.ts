// A4: the start of a turn, the played card, repairs, «Чёрная метка», a ship sunk by a card — through «?fxScene=<id>».
// For each moment a frame of the game goes to docs/screenshots/a4/, its milliseconds from the load of the page to
// docs/screenshots/a4/times.json; the frames of the reference are taken by capture.mjs into docs/screenshots/a4/ref/
// at the same milliseconds. After the show the numbers are the result of the scene and the layer is empty.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import type { Track } from '../src/engine/types';
import { clickMisses, expectResult, finalOf, open, playing } from './fx-scene';

const SHOTS = 'docs/screenshots/a4';
const TIMES = `${SHOTS}/times.json`;

interface Frame {
  name: string;
  scene: string;
  ready: string;
  after: number;
  width?: number;
  height?: number;
  /** The numbers only go down in the scene: none is ever below the result. */
  down: boolean;
}
const layerHas = (sel: string) => `!!document.querySelector('.fx-layer ${sel}')`;
const stampShown = (text: string) => `Array.from(document.querySelectorAll('.fx-layer .stamp-fx')).some((t) => t.textContent === ${JSON.stringify(text)} && Number(getComputedStyle(t).opacity) > 0.8)`;
const FRAMES: Frame[] = [
  { name: 'turn-fire', scene: 'turn', ready: layerHas('.ember'), after: 250, down: true },
  // the drawing: the backs fly to «Голландец» and the label «+2 карты» (not the Plan before it)
  { name: 'turn-draw', scene: 'turn', ready: `Array.from(document.querySelectorAll('.fx-layer .tag.plus')).some((t) => /^\\+\\d+ карт/.test(t.textContent))`, after: 150, down: true },
  { name: 'card', scene: 'card', ready: layerHas('.flyc'), after: 700, down: true },
  { name: 'card-hit', scene: 'card', ready: layerHas('.pill'), after: 100, down: true },
  { name: 'repair', scene: 'repair', ready: layerHas('.lg-aura'), after: 500, down: false },
  { name: 'mark', scene: 'mark', ready: layerHas('.blot'), after: 250, down: true },
  { name: 'mark-volley', scene: 'mark', ready: layerHas('.ball'), after: 250, down: true },
  { name: 'sink', scene: 'sink', ready: stampShown('Затонул'), after: 0, down: true },
  { name: 'turn-fire', scene: 'turn', ready: layerHas('.ember'), after: 250, width: 430, height: 932, down: true },
  { name: 'card', scene: 'card', ready: layerHas('.flyc'), after: 700, width: 430, height: 932, down: true },
];

function saveTime(key: string, scene: string, ms: number) {
  const all: Record<string, { scene: string; ms: number }> = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')) : {};
  all[key] = { scene, ms };
  writeFileSync(TIMES, JSON.stringify(all, null, 2) + '\n');
}

/** From now on the page remembers the lowest number each track showed. */
async function watchLows(page: Page) {
  await page.evaluate(() => {
    const low: Record<string, number> = {};
    const read = () => {
      for (const t of Array.from(document.querySelectorAll('[data-fx-ship] [data-fx-track]'))) {
        const key = `${t.closest('[data-fx-ship]')!.getAttribute('data-fx-ship')} ${t.getAttribute('data-fx-track')}`;
        const v = Number(t.querySelector('[data-fx-value]')!.textContent!.split('/')[0]);
        low[key] = Math.min(low[key] ?? v, v);
      }
    };
    read();
    new MutationObserver(read).observe(document.body, { subtree: true, childList: true, characterData: true });
    (window as unknown as { __lows: Record<string, number> }).__lows = low;
  });
}

/** The status chips of the planks: «code: label» with «(hidden)» while it waits for its clip. */
const chips = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-fx-ship] [data-fx-status]')).map(
      (c) => `${c.closest('[data-fx-ship]')!.getAttribute('data-fx-ship')}: ${c.dataset.fxStatus}${getComputedStyle(c).visibility === 'hidden' ? ' (hidden)' : ''}`,
    ),
  );

test.describe('the turn, the card, repairs and statuses through ?fxScene', () => {
  test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

  for (const f of FRAMES) {
    const width = f.width ?? 1366, height = f.height ?? 660;
    test(`${f.name} ${width}×${height}: the effect on the table, the frame, the result`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, f.scene);
      await watchLows(page);
      await page.waitForFunction(f.ready, null, { timeout: 20_000, polling: 'raf' });
      await page.waitForTimeout(f.after);
      const ms = await page.evaluate(() => Math.round(performance.now()));
      const during = await chips(page);
      // the labels of the effects are inside the table, 8 px from its edge (a pill grows ×1.12, a tag rises 4 px)
      const out = await page.evaluate(() => {
        const b = document.querySelector('.board')!.getBoundingClientRect();
        return Array.from(document.querySelectorAll<HTMLElement>('.fx-layer .tag, .fx-layer .pill'))
          .filter((e) => Number(getComputedStyle(e).opacity) > 0.05)
          .map((e) => ({ t: e.textContent, r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.left < b.left + 7 || r.right > b.right - 7 || r.top < b.top + 7 || r.bottom > b.bottom - 7)
          .map(({ t, r }) => `${t}: ${Math.round(r.left - b.left)}…${Math.round(b.right - r.right)}`);
      });
      expect(out).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/game-${f.name}-${width}x${height}.png` });
      saveTime(`${f.name}-${width}x${height}`, f.scene, ms);

      if (f.name === 'mark') expect(during).toContain('М: Чёрная метка +2 (hidden)'); // the blot is still flying
      if (f.name === 'mark-volley') expect(during).toContain('М: Чёрная метка +2'); // it landed: the cannonballs hit it
      if (f.name === 'repair') {
        // P1: the green frame is on the ship mended — «Индевор», not «Голландец» that played the card
        const on = await page.evaluate(() => {
          const a = document.querySelector('.fx-layer .lg-aura')!.getBoundingClientRect();
          const x = a.left + a.width / 2, y = a.top + a.height / 2;
          return Array.from(document.querySelectorAll('[data-fx-ship]')).find((p) => { const r = p.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; })?.getAttribute('data-fx-ship');
        });
        expect(on).toBe('И');
      }
      if (f.name === 'card') {
        // the card lies at the middle; the ribbon says who played it
        await expect(page.locator('.fx-layer .flyc .rib')).toHaveCount(0);
        await expect(page.locator('.fx-layer .flyc .fcard-foot')).toHaveText('ГОЛЛАНДЕЦ');
        // the strip is a part of the card: nothing outside the frame, its text at least 10 px on screen
        const box = await page.evaluate(() => { const f = document.querySelector('.fx-layer .fcard')!.getBoundingClientRect(), t = document.querySelector('.fx-layer .fcard-foot')!; const b = t.getBoundingClientRect(); return { inside: b.left >= f.left - 0.5 && b.right <= f.right + 0.5 && b.bottom <= f.bottom + 0.5, px: parseFloat(getComputedStyle(t).fontSize) * (f.width / (t.closest('.fcard') as HTMLElement).offsetWidth), h: b.height * ((t.closest('.fcard') as HTMLElement).offsetWidth / f.width) }; });
        expect(box.inside).toBe(true);
        expect(box.px).toBeGreaterThanOrEqual(10);
        expect(box.h).toBeGreaterThanOrEqual(18);
      }

      await expectResult(page, f.scene);
      if (f.down) {
        const want = finalOf(f.scene);
        const low = await page.evaluate(() => (window as unknown as { __lows: Record<string, number> }).__lows);
        for (const [key, v] of Object.entries(low)) {
          const [code, t] = key.split(' ') as [string, Track];
          expect(v, `${key}: the lowest number during the show`).toBeGreaterThanOrEqual(want.ships[code].tracks[t]);
        }
      }
      // After the show no chip is hidden: «Всплыл» after surfacing; «Месть» of the scene «mark» sinks — only «Утонул».
      const end = await chips(page);
      expect(end.filter((c) => c.endsWith('(hidden)'))).toEqual([]);
      if (f.scene === 'mark') expect(end).toContain('М: Утонул');
      if (f.scene === 'turn') expect(end).toContain('Г: Всплыл');
      expect(errors).toEqual([]);
      await page.close();
    });
  }

  test('card: the layer takes no press while the card lies at the middle', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'card');
    await playing(page);
    await page.waitForFunction(() => !!document.querySelector('.fx-layer .flyc'), null, { polling: 'raf' });
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
    // the middle of the table under the card: the press goes to the board, not to the layer
    const hit = await page.evaluate(() => {
      const c = document.querySelector('.fx-layer .flyc')!.getBoundingClientRect();
      return document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2)?.closest('.fx-layer') ? 'layer' : 'table';
    });
    expect(hit).toBe('table');
  });
});

test('the scenes of A4 play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  let scene = '';
  const note = (text: string) => {
    errors.push(text);
    console.log(`[iphone ${scene}] ${text}`);
  };
  page.on('pageerror', (e) => note(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
  // Whether the layer showed something is recorded from the load of the page, not caught by polling.
  await page.addInitScript(() => {
    const w = window as unknown as { __sawLayer: boolean };
    w.__sawLayer = false;
    new MutationObserver(() => {
      if (document.querySelector('.fx-layer > *')) w.__sawLayer = true;
    }).observe(document, { subtree: true, childList: true });
  });
  for (const id of ['turn', 'card', 'repair', 'mark', 'sink']) {
    scene = id;
    await open(page, id, 'fast');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(errors, id).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sawLayer: boolean }).__sawLayer), `${id}: the layer showed the clips`).toBe(true);
    expect(await page.locator('.fx-layer > *').count(), id).toBe(0);
  }
});

test.describe('the log follows the clips (a game against the bots, 1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('the lines of the action playing wait for its clips; a press on the table shows them and every status chip at once; a card in the log opens during the show', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('?seed=3&speed=normal');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('pick-company').click();
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await expect(page.getByTestId('game')).toBeVisible();
    const lines = page.locator('.log-col [data-testid="log"] li');

    // A Volley of the Pirates is on the table: its lines are not in the log yet.
    await expect(page.locator('.fx-layer .plate')).toBeVisible({ timeout: 60_000 });
    const during = await lines.allTextContents();
    expect(during.some((t) => /Залп по/.test(t) && /Корпус \d+ → \d+|Паруса \d+ → \d+|Пушки \d+ → \d+|Команда \d+ → \d+/.test(t))).toBe(false);

    // A card named in the log opens while the show goes on (P3).
    const cref = page.locator('.log-col .cref[data-card]').first();
    if ((await cref.count()) > 0) {
      await cref.click();
      await expect(page.getByTestId('card-detail')).toBeVisible();
      await page.getByTestId('card-detail').getByRole('button', { name: 'Закрыть' }).first().click();
    }

    // «Сразу итог»: a press on the table — the rest of the action in the log at once, no chip waits hidden.
    await page.mouse.click(5, 300);
    await expect.poll(async () => (await lines.allTextContents()).length).toBeGreaterThan(during.length);
    const after = await lines.allTextContents();
    expect(after.some((t) => /Залп по/.test(t))).toBe(true);
    const hidden = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-fx-status]')).filter((c) => getComputedStyle(c).visibility === 'hidden').length);
    expect(hidden).toBe(0);
    // the newest lines are highlighted
    await expect(page.locator('.log-col [data-testid="log"] li.fresh').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test('the result of a new action never flashes on the planks before its clips (card 1366×660)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 660 });
  // Every number each track shows, in order, from the load of the page (a flash of one frame included).
  await page.addInitScript(() => {
    const seen: Record<string, number[]> = {};
    const read = () => {
      for (const t of Array.from(document.querySelectorAll('[data-fx-ship] [data-fx-track]'))) {
        const key = `${t.closest('[data-fx-ship]')!.getAttribute('data-fx-ship')} ${t.getAttribute('data-fx-track')}`;
        const v = Number(t.querySelector('[data-fx-value]')!.textContent!.split('/')[0]);
        const list = (seen[key] ??= []);
        if (list.at(-1) !== v) list.push(v);
      }
    };
    new MutationObserver(read).observe(document, { subtree: true, childList: true, characterData: true });
    (window as unknown as { __seen: Record<string, number[]> }).__seen = seen;
  });
  await open(page, 'card');
  await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
  const seen = await page.evaluate(() => (window as unknown as { __seen: Record<string, number[]> }).__seen);
  // «Жатва» only takes: every track goes down step by step, never to the result and back up
  for (const [key, list] of Object.entries(seen)) {
    for (let i = 1; i < list.length; i++) expect(list[i], `${key}: ${list.join(' → ')}`).toBeLessThanOrEqual(list[i - 1]);
  }
  expect(Object.values(seen).some((l) => l.length > 1)).toBe(true);
});

test.describe('the turn with the layer: «До конца хода», «Ход окончен», «Пауза» (a game against the bots, 1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  async function againstBots(page: Page) {
    await page.goto('?seed=3&speed=normal');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('pick-company').click();
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await expect(page.getByTestId('game')).toBeVisible();
  }

  test('«До конца хода»: the clip on screen goes at once, the rest of the bots\' turn shows no card and no Volley; the turn comes to the person', async ({ page }) => {
    await againstBots(page);
    // a clip of a card or a Volley of the bots is on screen
    await page.waitForFunction(() => /^«[^»]+»: «|Залп/.test(document.querySelector('[data-fx-instruction]')?.textContent ?? ''), null, { timeout: 60_000, polling: 50 });
    const before = await page.locator('[data-fx-instruction]').textContent();
    await page.locator('[data-testid="skip-turn"]:visible').first().click();
    // What the status bar says from now on, every 50 ms, until the person's turn: only the end of the bots' turn
    // (their Plans) and the start of the person's turn may play — the action that passes the turn is a new turn.
    const said = await page.evaluate(
      () =>
        new Promise<string[]>((done) => {
          const out: string[] = [];
          const t = setInterval(() => {
            const text = document.querySelector('[data-fx-instruction]')?.textContent ?? '';
            if (out.at(-1) !== text) out.push(text);
            const b = document.querySelector('[data-testid="end-turn"]');
            if (out.length > 200 || (b && b.textContent === 'Ход окончен' && b.getAttribute('aria-disabled') !== 'true')) { clearInterval(t); done(out); }
          }, 50);
        }),
    );
    expect(said.filter((x) => x !== before && /^«[^»]+»: «|Залп по/.test(x)), said.join(' / ')).toEqual([]);
    await expect(page.locator('[data-testid="end-turn"]:visible').first()).toHaveText('Ход окончен', { timeout: 60_000 });
    const hidden = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-fx-status]')).filter((c) => getComputedStyle(c).visibility === 'hidden').length);
    expect(hidden).toBe(0);
  });

  test('«Ход окончен»: the end of the turn and the start of the bots\' turn are clips of the layer (the banner «Ход Пиратов»)', async ({ page }) => {
    await againstBots(page);
    const end = page.locator('[data-testid="end-turn"]:visible').first();
    await expect(end).toHaveText('Ход окончен', { timeout: 90_000 });
    await expect(end).not.toHaveAttribute('aria-disabled', 'true', { timeout: 60_000 });
    await end.click();
    // «Ход окончен · Отменить» passes the turn in 3 s; then the clip «turn» draws its banner in the layer
    await expect(page.locator('.fx-layer .banner')).toHaveText('Ход Пиратов', { timeout: 15_000 });
    await expect(page.locator('[data-fx-instruction]')).toHaveText('Ход Пиратов');
    // the old banner of Banners.tsx is not drawn twice
    await expect(page.getByTestId('turn-banner')).toHaveCount(0);
  });

  test('«Пауза» stops the clip on screen in the middle, «Дальше» goes on from where it stood (P4)', async ({ page }) => {
    await againstBots(page);
    const pause = page.locator('[data-testid="pause-show"]:visible');
    /** The animations of the layer: how many go, how many stand, where each stands. */
    const look = () =>
      page.evaluate(() => {
        const as = document.querySelector('.fx-layer')!.getAnimations({ subtree: true });
        return {
          running: as.filter((a) => a.playState === 'running').length,
          paused: as.filter((a) => a.playState === 'paused').length,
          times: as.map((a) => Math.round(Number(a.currentTime))),
          hint: document.querySelector('[data-fx-instruction]')?.textContent ?? '',
        };
      });
    // «Пауза» pressed while a clip plays (a press that came between two clips is let go and tried again)
    let held = { running: 0, paused: 0, times: [] as number[], hint: '' };
    for (let k = 0; k < 5 && held.paused === 0; k++) {
      await page.waitForFunction(() => document.querySelector('.fx-layer')!.getAnimations({ subtree: true }).some((a) => a.playState === 'running'), null, { timeout: 60_000, polling: 20 });
      await pause.click();
      await expect(pause.locator('.wide')).toHaveText('▶ Дальше');
      held = await look();
      if (held.paused === 0) await pause.click();
    }
    expect(held.paused, 'the clip stopped in the middle').toBeGreaterThan(0);
    expect(held.running, 'nothing of the clip goes on').toBe(0);
    await page.waitForTimeout(3000);
    expect(await look(), 'the frame stands still').toEqual(held);
    // «Дальше»: the same animations go on from where they stood, then the show goes on
    await pause.click();
    await expect(pause.locator('.wide')).toHaveText('⏸ Пауза');
    expect((await look()).paused, 'nothing stays paused').toBe(0);
    await expect.poll(async () => (await look()).times.join(), { timeout: 10_000 }).not.toBe(held.times.join());
  });
});
