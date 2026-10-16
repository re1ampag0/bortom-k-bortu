// U3: the table is tidy — the tags of the plank head stand centred with the name, the summary of the turn never
// covers the banner «Ваш ход» nor «Последнее: …», the middle of the table (banners, the summary, the hint, the panels)
// stands at the centre of the gap between the rows, the badges are a column of one width, the numbers of the tracks
// one column, «Чёрная метка» stays on the marked plank as a faint blot. Chromium only. Screenshots of the same states
// as docs/screenshots/u3/before/ go to docs/screenshots/u3/after/ (replaced on every run).
import { expect, test, type Page } from '@playwright/test';

const SHOTS = 'docs/screenshots/u3/after';
const SIZES = [
  { width: 1366, height: 660 },
  { width: 1920, height: 1080 },
  { width: 430, height: 932 },
] as const;
/** Pixels: the tolerance of «at the centre», «in one column». */
const TOL = 3;

const shot = (page: Page, name: string, width: number) => page.screenshot({ path: `${SHOTS}/${name}-${width}.png` });

/** The vertical centre of the gap between the rows of planks and of the middle group (the summary, the hint). */
async function middle(page: Page) {
  return page.evaluate(() => {
    const r = (q: string) => document.querySelector(q)?.getBoundingClientRect() ?? null;
    const top = r('.planks.top')!, bottom = r('.planks.bottom')!;
    const items = ['[data-testid="turn-summary"]', '[data-testid="middle-info"]'].map(r).filter((b): b is DOMRect => !!b);
    const dock = r('.dock');
    return {
      gap: (top.bottom + bottom.top) / 2,
      group: items.length ? (Math.min(...items.map((b) => b.top)) + Math.max(...items.map((b) => b.bottom))) / 2 : null,
      dock: dock ? (dock.top + dock.bottom) / 2 : null,
    };
  });
}

/** The tags of the plank heads (ВЫБРАН, «✓ готов», the role, the number of cards): the offset of their centre from the name's, and their transform. */
async function headTags(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.plank-head')).flatMap((h) => {
      const name = Array.from(h.querySelectorAll<HTMLElement>('.plank-name > span')).find((e) => e.offsetWidth > 0)!;
      const n = name.getBoundingClientRect();
      return Array.from(h.querySelectorAll<HTMLElement>('.head-tag, .hand-count'))
        .filter((e) => e.offsetWidth > 0)
        .map((e) => {
          const b = e.getBoundingClientRect();
          return { text: e.textContent, dy: Math.abs((b.top + b.bottom) / 2 - (n.top + n.bottom) / 2), transform: getComputedStyle(e).transform, nameWhole: name.scrollWidth <= name.clientWidth + 1 };
        });
    }),
  );
}

/** Per plank: the badges (width, height, left edge) and the right edges of the numbers of its tracks. */
async function columns(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.plank')).map((p) => {
      const badges = Array.from(p.querySelectorAll<HTMLElement>('.badges > *')).filter((e) => e.offsetWidth > 0).map((e) => e.getBoundingClientRect());
      const nums = Array.from(p.querySelectorAll('.track-num')).map((e) => e.getBoundingClientRect());
      return {
        ship: p.dataset.ship,
        widths: badges.map((b) => b.width),
        heights: badges.map((b) => b.height),
        lefts: badges.map((b) => b.left),
        rights: nums.map((b) => b.right),
      };
    }),
  );
}

const spread = (xs: number[]) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0);

async function expectHeads(page: Page) {
  for (const t of await headTags(page)) {
    expect(t.transform, `${t.text}`).toBe('none');
    expect(t.dy, `${t.text}: centre against the name`).toBeLessThanOrEqual(TOL);
    expect(t.nameWhole, `${t.text}: the name of the ship is whole`).toBe(true);
  }
}

async function expectColumns(page: Page, laptop: boolean) {
  for (const p of await columns(page)) {
    expect(spread(p.heights), `${p.ship}: the badges of one height`).toBeLessThanOrEqual(1);
    if (!laptop) continue;
    expect(spread(p.widths), `${p.ship}: the badges of one width`).toBeLessThanOrEqual(1);
    expect(spread(p.lefts), `${p.ship}: the badges in one column`).toBeLessThanOrEqual(1);
    expect(spread(p.rights), `${p.ship}: the numbers of the tracks in one column`).toBeLessThanOrEqual(1);
  }
}

for (const size of SIZES) {
  const laptop = size.width > 700;
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('a game against the bots: the summary waits for «Ваш ход», the middle at the centre of the gap, the heads and the columns', async ({ page }) => {
      await page.goto('?seed=3&speed=normal');
      await page.getByTestId('quick-bots').click();
      await page.getByTestId('pick-company').click();
      await page.getByTestId('prep-start').click();
      await page.getByTestId('placement-done').click();
      await expect(page.getByTestId('game')).toBeVisible();
      // Every frame from now on: the summary never meets a banner (8 px apart at least) nor «Последнее: …»; the banner
      // «Ваш ход» of the layer stands at the centre of the gap.
      await page.evaluate((tol) => {
        const w = window as unknown as { u3: { frames: number; summary: number; bad: string[] } };
        w.u3 = { frames: 0, summary: 0, bad: [] };
        const box = (e: Element) => e.getBoundingClientRect();
        const meet = (a: DOMRect, b: DOMRect, m: number) => a.left < b.right + m && b.left < a.right + m && a.top < b.bottom + m && b.top < a.bottom + m;
        const tick = () => {
          w.u3.frames++;
          const sum = document.querySelector('[data-testid="turn-summary"]');
          const info = document.querySelector('[data-testid="middle-info"]');
          const banners = Array.from(document.querySelectorAll('.fx-layer > .banner, .table-banner')).filter((e) => Number(getComputedStyle(e).opacity) > 0.05);
          if (sum) {
            w.u3.summary++;
            for (const b of banners) if (meet(box(sum), box(b), 8)) w.u3.bad.push(`the summary meets «${b.textContent}»`);
            if (info && meet(box(sum), box(info), 0)) w.u3.bad.push('the summary covers «Последнее»');
          }
          for (const b of banners.filter((e) => e.textContent === 'Ваш ход' && Number(getComputedStyle(e).opacity) > 0.9)) {
            const top = box(document.querySelector('.planks.top')!), bottom = box(document.querySelector('.planks.bottom')!);
            const dy = Math.abs((box(b).top + box(b).bottom) / 2 - (top.bottom + bottom.top) / 2);
            if (dy > tol) w.u3.bad.push(`«Ваш ход» ${Math.round(dy)} px off the centre of the gap`);
          }
          if (w.u3.bad.length < 20) requestAnimationFrame(tick);
        };
        tick();
      }, TOL);

      await page.waitForFunction(() => /^«[^»]+»: «|Залп/.test(document.querySelector('[data-fx-instruction]')?.textContent ?? ''), null, { timeout: 90_000, polling: 50 });
      await shot(page, 'bots-turn', size.width);
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.fx-layer > .banner')).some((b) => b.textContent === 'Ваш ход' && Number(getComputedStyle(b).opacity) > 0.9), null, { timeout: 120_000, polling: 30 });
      await shot(page, 'your-turn', size.width);
      await expect(page.getByTestId('turn-summary')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('summary-more')).toHaveClass(/btn/);
      await shot(page, 'summary', size.width);
      const withSummary = await middle(page);
      expect(Math.abs(withSummary.group! - withSummary.gap), 'the summary and «Последнее» at the centre of the gap').toBeLessThanOrEqual(TOL);
      await expect(page.getByTestId('turn-summary')).toHaveCount(0, { timeout: 10_000 });
      const u3 = await page.evaluate(() => (window as unknown as { u3: { frames: number; summary: number; bad: string[] } }).u3);
      expect(u3.summary, 'the summary was seen').toBeGreaterThan(0);
      expect(u3.bad).toEqual([]);

      // The own turn at rest.
      await expect(page.getByTestId('middle-info')).toContainText('Нажмите карту или «Залп»');
      const rest = await middle(page);
      expect(Math.abs(rest.group! - rest.gap), '«Последнее» and the hint at the centre of the gap').toBeLessThanOrEqual(TOL);
      await expectHeads(page);
      await expectColumns(page, laptop);
      await shot(page, 'own-turn', size.width);

      // The Volley: the panel at the centre of the gap.
      await page.locator('[data-testid^="volley-"]:visible:not([aria-disabled="true"])').first().click();
      await expect(page.locator('.dock')).toBeVisible();
      await shot(page, 'volley-aim', size.width);
      await page.locator('[data-testid^="plate-"]').first().click();
      const aim = await middle(page);
      expect(Math.abs(aim.dock! - aim.gap), 'the Volley panel at the centre of the gap').toBeLessThanOrEqual(TOL);
      await expectHeads(page);
      await shot(page, 'volley-target', size.width);
      await page.locator('.dock button', { hasText: 'Отмена' }).first().click();

      // «Ход окончен»: «✓ готов» in the heads, the panel at the centre.
      await page.locator('[data-testid="end-turn"]:visible').first().click();
      const noPlans = page.getByTestId('no-plans');
      if (await noPlans.isVisible({ timeout: 1000 }).catch(() => false)) await noPlans.click();
      await expect(page.getByTestId('ending')).toBeVisible();
      await expect(page.locator('[data-testid^="ready-"]')).toHaveCount(2);
      const ending = await middle(page);
      expect(Math.abs(ending.dock! - ending.gap), 'the panel «Ход окончен» at the centre of the gap').toBeLessThanOrEqual(TOL);
      await expectHeads(page);
      await shot(page, 'turn-ending', size.width);
    });

    test('«Чёрная метка»: the blot stays on the marked plank, faint, behind the readable numbers', async ({ page }) => {
      await page.goto('?fxScene=mark&speed=normal');
      await page.waitForFunction(() => !!document.querySelector('.fx-layer .blot'), null, { timeout: 30_000, polling: 20 });
      // the blot of the clip still flies: the watermark waits hidden, as the chip does
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-fx-mark-wm]')!).visibility)).toBe('hidden');
      await shot(page, 'mark-flight', size.width);
      await page.waitForFunction(() => {
        const c = document.querySelector('[data-fx-mark]');
        return !!c && getComputedStyle(c).visibility !== 'hidden' && !document.querySelector('.fx-layer .blot');
      }, null, { timeout: 30_000, polling: 20 });
      await page.waitForTimeout(700);
      const wm = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('[data-fx-mark-wm]')!;
        const plank = el.closest<HTMLElement>('[data-fx-ship]')!;
        const body = plank.querySelector('.plank-body')!.getBoundingClientRect();
        const b = el.querySelector('svg')!.getBoundingClientRect();
        // the numbers of the tracks are on top: a press at their centre finds them, not the blot
        const readable = Array.from(plank.querySelectorAll('.track-num')).every((n) => {
          const r = n.getBoundingClientRect();
          return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.track-num') === n;
        });
        return {
          ship: plank.dataset.fxShip,
          visibility: getComputedStyle(el).visibility,
          opacity: Number(getComputedStyle(el.querySelector('svg')!).opacity),
          big: b.height / body.height,
          readable,
          chip: plank.querySelector('[data-fx-mark]')?.textContent ?? '',
        };
      });
      expect(wm.ship).toBe('М');
      expect(wm.visibility).toBe('visible');
      expect(wm.opacity).toBeGreaterThanOrEqual(0.15);
      expect(wm.opacity).toBeLessThanOrEqual(0.2);
      expect(wm.big, 'a large blot: most of the height of the body').toBeGreaterThan(0.7);
      expect(wm.readable).toBe(true);
      expect(wm.chip).toContain('Чёрная метка +2');
      await shot(page, 'mark-landed', size.width);
    });

    test('the window of Reactions (a screenshot next to «before»; the window itself is U2)', async ({ page }) => {
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
      await expectHeads(page);
      await shot(page, 'reactions', size.width);
    });
  });
}
