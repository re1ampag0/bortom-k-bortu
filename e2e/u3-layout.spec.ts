// U3: the table is tidy — the tags of the plank head stand centred with the name, the summary of the turn never
// covers the banner «Ваш ход» nor «Последнее: …», the middle of the table (banners, the summary, the hint, the panels)
// stands at the centre of the gap between the rows, the badges are a column at one right edge, the numbers of the
// tracks one column, «Чёрная метка» stays on the marked plank as a small stamp that covers nothing. Chromium only. Screenshots of the same states
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
    const sum = r('[data-testid="turn-summary"]');
    const info = r('[data-testid="middle-info"]');
    const water = r('.sea-water');
    const dock = r('.dock');
    return {
      gap: (top.bottom + bottom.top) / 2,
      // the summary stands at the centre of the gap; «Последнее» (Б1) is a line along the bottom of the open sea
      group: sum ? (sum.top + sum.bottom) / 2 : null,
      info: info && water ? { height: info.height, toPlanks: bottom.top - info.bottom, left: info.left - water.left, right: water.right - info.right } : null,
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
      // A5: every number stands right after the icons of its own track (the gap), and no number meets another part
      const tracks = Array.from(p.querySelectorAll<HTMLElement>('[data-fx-track]')).map((t) => ({
        cells: t.querySelector('.cells')!.getBoundingClientRect(),
        num: t.querySelector('.track-num')!.getBoundingClientRect(),
      }));
      const meet = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const others = Array.from(p.querySelectorAll('.cells, .track-label, .badges > *, .status-chip')).map((e) => e.getBoundingClientRect());
      return {
        ship: p.dataset.ship,
        heights: badges.map((b) => b.height),
        gaps: tracks.map((t) => t.num.left - t.cells.right),
        numsMeet: nums.filter((n) => others.some((o) => o.width > 0 && meet(n, o))).length,
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
    // A5 (V1a): the Hull is the first row, Паруса / Пушки / Команда the second — the numbers no longer stand in one
    // column; each stands right after the icons of its track and covers nothing
    for (const g of p.gaps) expect(g, `${p.ship}: the number right after its icons`).toBeGreaterThanOrEqual(0);
    for (const g of p.gaps) expect(g, `${p.ship}: the number right after its icons`).toBeLessThanOrEqual(12);
    expect(p.numsMeet, `${p.ship}: a number meets no icon, label, badge or chip`).toBe(0);
  }
}

for (const size of SIZES) {
  const laptop = size.width > 700;
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('a game against the bots: the summary waits for «Ваш ход», the middle at the centre of the gap, the heads and the columns', async ({ page }) => {
      // seed 3 has «Буря» in the first round: «&wxStill=1» keeps the planks from pitching while they are measured and
      // their buttons pressed (the pitch itself — e2e/fx-sea.spec.ts)
      await page.goto('?seed=3&speed=normal&wxStill=1');
      await page.getByTestId('quick-bots').click();
      await page.getByTestId('pick-company').click();
      await page.getByTestId('prep-start').click();
      await page.getByTestId('placement-done').click();
      await expect(page.getByTestId('game')).toBeVisible();
      // the pointer left where «Готово» was would rest on a plank (a hover opens the rule of a track icon) — off the table
      await page.mouse.move(2, 2);
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
      expect(Math.abs(withSummary.group! - withSummary.gap), 'the summary at the centre of the gap').toBeLessThanOrEqual(TOL);
      // Б1: «Последнее» — a line of ≈ 22 px along the bottom of the gap, the width of the water, never over a plank
      expect(withSummary.info, '«Последнее» is on the table').not.toBeNull();
      expect(Math.abs(withSummary.info!.height - 22)).toBeLessThanOrEqual(2);
      expect(withSummary.info!.toPlanks).toBeGreaterThanOrEqual(-1);
      expect(withSummary.info!.toPlanks).toBeLessThanOrEqual(8);
      expect(Math.abs(withSummary.info!.left) + Math.abs(withSummary.info!.right)).toBeLessThanOrEqual(2 * 8);
      await expect(page.getByTestId('turn-summary')).toHaveCount(0, { timeout: 10_000 });
      const u3 = await page.evaluate(() => (window as unknown as { u3: { frames: number; summary: number; bad: string[] } }).u3);
      expect(u3.summary, 'the summary was seen').toBeGreaterThan(0);
      expect(u3.bad).toEqual([]);

      // The own turn at rest.
      // the hint «выберите карту или действие» is in the top plaque; the line at the bottom holds «Последнее» only
      await expect(page.locator('[data-fx-instruction]')).toContainText('выберите карту или действие');
      await expect(page.getByTestId('middle-info')).toContainText('Последнее:');
      await expect(page.getByTestId('middle-info')).not.toContainText('Нажмите карту');
      await expectHeads(page);
      await expectColumns(page, laptop);
      if (!laptop) {
        // a phone: the buttons of a plank in one row; the planks of a row of one height, their rows of buttons at the
        // bottom, on one line
        const rows = await page.evaluate(() => ({
          tops: Array.from(document.querySelectorAll('[data-testid="plank-Г"] .plank-buttons .btn')).map((b) => Math.round(b.getBoundingClientRect().top)),
          planks: Array.from(document.querySelectorAll('.planks.bottom > .plank')).map((p) => {
            const r = p.getBoundingClientRect();
            const row = p.querySelector('.plank-buttons')?.getBoundingClientRect();
            return { h: r.height, bottom: r.bottom, rowBottom: row ? row.bottom : null };
          }),
        }));
        expect(new Set(rows.tops).size, 'the buttons of «Голландец» in one row').toBe(1);
        // every button of every plank of one height, its text whole; a5-phone (A5Phone, frame 1): one or two buttons fill the
        // row of their plank, three and more are a third of it each (of one width)
        const btns = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>('.planks .plank-buttons .btn')).map((b) => ({ ship: b.closest<HTMLElement>('.plank')!.dataset.ship!, n: b.parentElement!.children.length, w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height, whole: ((e) => { const r = document.createRange(); r.selectNodeContents(e); const t = r.getBoundingClientRect(), b = e.getBoundingClientRect(); return t.left >= b.left && t.right <= b.right && t.top >= b.top && t.bottom <= b.bottom; })(b) })),
        );
        expect(btns.length).toBeGreaterThanOrEqual(6);
        const fill = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>('.planks .plank-buttons'))
            .filter((row) => row.children.length <= 2)
            .map((row) => {
              const r = row.getBoundingClientRect(), cs = getComputedStyle(row), bs = Array.from(row.children).map((b) => b.getBoundingClientRect());
              return r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - bs.reduce((w, b) => w + b.width, 0) - parseFloat(cs.columnGap || '0') * (bs.length - 1);
            }),
        );
        for (const left of fill) expect(Math.abs(left), 'one or two buttons fill the row').toBeLessThanOrEqual(1);
        for (const ship of new Set(btns.filter((b) => b.n >= 3).map((b) => b.ship))) {
          expect(spread(btns.filter((b) => b.ship === ship).map((b) => b.w)), `${ship}: the buttons of one width`).toBeLessThanOrEqual(1);
        }
        expect(spread(btns.map((b) => b.h)), 'the buttons of one height').toBeLessThanOrEqual(1);
        expect(Math.abs(btns[0].h - 34), 'seen 34 px high').toBeLessThanOrEqual(TOL);
        expect(btns.every((b) => b.whole), 'no text cut').toBe(true);
        const sight = await page.evaluate(() => {
          const row = document.querySelector<HTMLElement>('[data-testid="plank-Г"] .plank-buttons')!;
          const r = row.getBoundingClientRect();
          return Array.from(row.querySelectorAll('.btn')).filter((b) => { const x = b.getBoundingClientRect(); return x.left >= r.left - 1 && x.right <= r.right + 1; }).length;
        });
        expect(sight, 'three buttons of «Голландец» in sight').toBe(3);
        // the press zone: 44 px high (21.5 px above and below the centre), and the gap between neighbours presses one
        // of them — no miss
        const zones = await page.evaluate(() => {
          const out: string[] = [];
          for (const row of Array.from(document.querySelectorAll<HTMLElement>('.planks .plank-buttons'))) {
            const r = row.getBoundingClientRect();
            const bs = Array.from(row.querySelectorAll<HTMLElement>('.btn')).filter((b) => { const x = b.getBoundingClientRect(); return x.left >= r.left - 1 && x.right <= r.right + 1; });
            bs.forEach((b, i) => {
              const x = b.getBoundingClientRect(), cx = x.left + x.width / 2, cy = x.top + x.height / 2;
              for (const y of [cy - 21.5, cy + 21.5]) if (document.elementFromPoint(cx, y)?.closest('.btn') !== b) out.push(`${b.textContent} at ${Math.round(y - cy)}`);
              const next = bs[i + 1];
              if (next) {
                const gx = (x.right + next.getBoundingClientRect().left) / 2;
                const hit = document.elementFromPoint(gx, cy)?.closest('.btn');
                if (hit !== b && hit !== next) out.push(`the gap after ${b.textContent}`);
              }
            });
          }
          return out;
        });
        expect(zones, 'every button pressed in its 44 px zone, no gap missed').toEqual([]);
        expect(rows.planks.length).toBe(2);
        expect(spread(rows.planks.map((p) => p.h)), 'the planks of a row of one height').toBeLessThanOrEqual(1);
        const rowBottoms = rows.planks.map((p) => p.rowBottom).filter((b): b is number => b !== null);
        expect(rowBottoms.length, 'both ships have buttons').toBe(2);
        expect(spread(rowBottoms), 'the rows of buttons on one line').toBeLessThanOrEqual(1);
        rows.planks.forEach((p, i) => expect(p.bottom - p.rowBottom!, `plank ${i}: the buttons at its bottom`).toBeLessThanOrEqual(10));
      }
      await shot(page, 'own-turn', size.width);

      // The Volley: a5-log — the sheet «Заряд» stands in the place of the hand, the sea stays open (no panel in the gap).
      await page.locator('[data-testid^="volley-"]:visible:not([aria-disabled="true"])').first().click();
      await expect(page.getByTestId('volley-panel')).toBeVisible();
      await expect(page.locator('.dock')).toHaveCount(0);
      await shot(page, 'volley-aim', size.width);
      await page.locator('[data-testid^="plate-"]').first().click();
      const sheet = (await page.getByTestId('volley-panel').boundingBox())!;
      const gapBox = (await page.locator('[data-fx-gap]').boundingBox())!;
      expect(sheet.y, 'the sheet «Заряд» lies below the sea').toBeGreaterThanOrEqual(gapBox.y + gapBox.height - 1);
      await expectHeads(page);
      await shot(page, 'volley-target', size.width);
      await page.getByTestId('cancel-volley').click();

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

    test('«Чёрная метка»: a small sharp stamp stays on the marked plank and covers nothing', async ({ page }) => {
      await page.goto('?fxScene=mark&speed=normal');
      await page.waitForFunction(() => !!document.querySelector('.fx-layer .blot'), null, { timeout: 30_000, polling: 20 });
      // the blot of the clip still flies: the stamp waits hidden, as the chip does (a5-phone: one stamp — the pin on a laptop,
      // the blot on a phone, both on the drawing of the ship)
      expect(await page.evaluate(() => Array.from(document.querySelectorAll('[data-fx-mark-stamp]')).map((e) => getComputedStyle(e).visibility))).toEqual(['hidden']);
      await shot(page, 'mark-flight', size.width);
      await page.waitForFunction(() => {
        const c = document.querySelector('[data-fx-mark]');
        return !!c && getComputedStyle(c).visibility !== 'hidden' && !document.querySelector('.fx-layer .blot');
      }, null, { timeout: 30_000, polling: 20 });
      await page.waitForTimeout(700);
      const st = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll<HTMLElement>('[data-fx-mark-stamp]')).find((e) => e.offsetWidth > 0)!;
        const plank = el.closest<HTMLElement>('[data-fx-ship]')!;
        const svg = el.querySelector('svg')!;
        const r = el.getBoundingClientRect(), s = svg.getBoundingClientRect();
        const meet = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        // A5 (V1a): on a laptop the stamp lies on the drawing of the ship in the head — the head itself is its place, the
        // name, the tags and the coin of the head must stay clear
        const parts = Array.from(
          plank.querySelectorAll('.track-num, .cells i, .bar, .track-label, .badges > *, .plank-buttons .btn, .status-chip, .plank-name, .plank-role > *, .captain' + (el.closest('.plank-head') ? '' : ', .plank-head')),
        ).filter((e) => (e as HTMLElement).offsetWidth > 0);
        const nums = Array.from(plank.querySelectorAll('.track-num')).map((e) => e.getBoundingClientRect());
        const badges = Array.from(plank.querySelectorAll<HTMLElement>('.badges > *')).filter((e) => e.offsetWidth > 0).map((e) => e.getBoundingClientRect());
        const body = plank.querySelector('.plank-body')!.getBoundingClientRect();
        return {
          ship: plank.dataset.fxShip,
          inStatuses: !!el.closest('.plank-statuses'),
          onShip: !!el.closest('.ship-art'),
          visibility: getComputedStyle(el).visibility,
          opacity: Number(getComputedStyle(svg).opacity),
          rotated: getComputedStyle(svg).transform !== 'none',
          width: r.width,
          covers: parts.filter((p) => meet(s, p.getBoundingClientRect())).map((p) => `${p.className}: ${p.textContent}`),
          numsRight: Math.max(...nums.map((n) => n.right)),
          badgesLeft: badges.length ? Math.min(...badges.map((b) => b.left)) : null,
          left: s.left,
          right: s.right,
          top: r.top,
          bodyTop: body.top,
          plankRight: plank.getBoundingClientRect().right,
          chip: plank.querySelector('[data-fx-mark]')?.textContent ?? '',
        };
      });
      expect(st.ship).toBe('М');
      expect(st.visibility).toBe('visible');
      expect(st.opacity).toBeGreaterThanOrEqual(0.85);
      expect(st.opacity).toBeLessThanOrEqual(0.95);
      expect(st.rotated, 'set at a slant, as a stamp').toBe(true);
      expect(st.covers, 'the stamp covers no number, scale, badge, button, chip or head').toEqual([]);
      if (laptop) {
        // A5: the torn leaf pinned with a dagger, on the drawing of the ship in the head (was: 40 px between the numbers
        // and the badges of the body)
        expect(st.inStatuses).toBe(false);
        expect(st.onShip, 'on the drawing of the ship').toBe(true);
        expect(Math.abs(st.width - 30), 'about 30 px').toBeLessThanOrEqual(TOL);
      } else {
        // a5-phone (A5Phone, frame 1): a black blot on the picture of the ship in the head
        expect(st.inStatuses).toBe(false);
        expect(st.onShip, 'on the drawing of the ship').toBe(true);
        expect(Math.abs(st.width - 15), 'about 15 px').toBeLessThanOrEqual(TOL);
        expect(st.top, 'in the head, above the body').toBeLessThan(st.bodyTop);
      }
      expect(st.chip).toContain('Чёрная метка +2');
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
