// FX-A: the traces of the effects (src/ui/game/fx/scars.ts; docs/mockups/a5/fx/ANIMATIONS.md, §2) on the table of the
// game through «?fxScene=<id>»: a hit leaves soot on the plank after the clip, it dissolves by itself; a seventh trace
// pushes the oldest out; «Сразу итог» does not wipe them; they take no press; a trace on a ship rides with the ship when
// the places change. Frames go to e2e-shots/a5-fight/.
import { expect, test } from '@playwright/test';
import { open, playing } from './fx-scene';

const SHOTS = 'e2e-shots/a5-fight';

test.describe('the traces of the effects (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('a hit leaves soot on the plank: it is there after the clip and dissolves by itself', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 'plain');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    // after the clip: the soot is on the target's plank, the layer is empty
    const marks = page.locator('[data-fx-ship] > .plank-scars > .fx-hitmark[data-scar="short"]');
    expect(await marks.count()).toBeGreaterThan(0);
    expect(await page.locator('.fx-layer > *').count()).toBe(0);
    // a short trace: 3 s + 9 s at the normal speed
    await expect(marks).toHaveCount(0, { timeout: 16_000 });
    expect(errors).toEqual([]);
  });

  test('a seventh trace pushes the oldest out; all of them go by the clock of the show (faster clock)', async ({ page }) => {
    await open(page, 'plain', 'normal', '&scarRate=10');
    await page.evaluate(() => (window as unknown as { __fxScars: { lay: (n: number) => void } }).__fxScars.lay(7));
    const t = page.locator('.fx-scars > [data-test]');
    await expect(t).toHaveCount(7);
    // the oldest fades out quickly (marked gone), the six newer hold
    expect(await page.locator('.fx-scars > [data-test="0"][data-gone]').count()).toBe(1);
    expect(await page.locator('.fx-scars > [data-test]:not([data-gone])').count()).toBe(6);
    await expect(page.locator('.fx-scars > [data-test="0"]')).toHaveCount(0, { timeout: 3000 });
    // 12 s of the show at ×10 — about 1.2 s
    await expect(t).toHaveCount(0, { timeout: 4000 });
  });

  test('«Сразу итог» does not wipe the traces, and they take no press', async ({ page }) => {
    await open(page, 'plain');
    await playing(page);
    const marks = page.locator('[data-fx-ship] > .plank-scars > .fx-hitmark');
    await expect(marks.first()).toBeAttached({ timeout: 10_000 });
    await page.screenshot({ path: `${SHOTS}/fxa-hit-soot-1366x660.png` });
    await page.mouse.click(5, 300); // the table beside the planks: the result at once
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 3000 });
    expect(await page.locator('.fx-layer > *').count()).toBe(0);
    expect(await marks.count()).toBeGreaterThan(0);
    const through = await marks.first().evaluate((m) => {
      const r = m.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { events: getComputedStyle(m).pointerEvents, hitIsMark: hit === m, onPlank: !!hit?.closest('[data-fx-ship]') };
    });
    expect(through).toEqual({ events: 'none', hitIsMark: false, onPlank: true });
  });

  test('a trace on a ship rides with the ship when the places change (Перестроение)', async ({ page }) => {
    await open(page, 'regroup');
    const codes = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[data-fx-ship]')).map((p) => p.getAttribute('data-fx-ship')!);
      for (const c of ids) (window as unknown as { __fxScars: { layOn: (c: string) => void } }).__fxScars.layOn(c);
      return ids;
    });
    const where = () =>
      page.evaluate(() =>
        Object.fromEntries(
          Array.from(document.querySelectorAll<HTMLElement>('.plank-scars > [data-test]')).map((m) => {
            const p = m.closest('[data-fx-ship]')!, r = m.getBoundingClientRect(), b = p.getBoundingClientRect();
            return [m.dataset.test!, { ship: p.getAttribute('data-fx-ship'), x: Math.round(r.left), inside: r.left >= b.left && r.right <= b.right && r.top >= b.top && r.bottom <= b.bottom }];
          }),
        ),
      );
    const before = await where();
    await page.screenshot({ path: `${SHOTS}/fxa-swap-before-1366x660.png` });
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    await page.screenshot({ path: `${SHOTS}/fxa-swap-after-1366x660.png` });
    const after = await where();
    let moved = 0;
    for (const c of codes) {
      expect(after[c].ship).toBe(c);
      expect(after[c].inside).toBe(true);
      if (after[c].x !== before[c].x) moved++;
    }
    // two ships changed places, their soot went with them
    expect(moved).toBe(2);
  });
});
