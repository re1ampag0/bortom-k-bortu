// L1, FX-B: the Legends through «?fxScene=<id>» — «Армада Компании», «Кракен», «Корабль в бутылке», «Джек ускользает»
// (the scenes armada, kraken, bottle, jack). The look is the A5 prototype's (docs/mockups/a5/fx/prototype.html,
// ANIMATIONS.md §3.1–3.5): for each Legend two frames of the game — «the seal» (the wax seal has landed on the card) and
// «the effect» (the broadside flies / the arms lie across the plank and it cracks / the little ship is in the bottle /
// the compass points) — at 1366×660 and 430×932 go to docs/screenshots/a5-legends-sea/ (e2e-*). The frames of the
// prototype next to them are taken by hand at each stage (docs/progress/a5-legends-sea.md), not here.
import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { clickMisses, expectResult, open, playing, readCover, watchCover } from './fx-scene';

const SHOTS = 'docs/screenshots/a5-legends-sea';
/** The longest a label may cover a part of a plank: the short mark at a number lasts 700 ms (MARK_MS). */
const FLASH_MS = 800;
/** The shouts of the effects stay as in the reference (the decision of the user): not explanations. */
const SHOUTS = ['Бортовой залп!', 'Чпок!'];

const shown = (sel: string, op = 0.98) => `Array.from(document.querySelectorAll('.fx-layer ${sel}')).some((e) => Number(getComputedStyle(e).opacity) > ${op})`;
/** The seal has landed on the card (its fall lasts 360 ms; at 70 % it is opaque). */
const SEAL = shown('> .lg-seal');
interface Legend {
  scene: string;
  /** The ship that plays the Legend: the strip of its card. */
  owner: string;
  /** The moment of its own effect. */
  effect: string;
  after: number;
  /** jack: the Volley that sinks «Жемчужина» comes first (A2, its pill «−2» is not changed by S1): the labels are
   *  measured from the moment the ship starts to sink — the clip of the Legend. */
  from?: string;
}
const LEGENDS: Legend[] = [
  // the line of the Company fires: a flash of a gun
  { scene: 'armada', owner: 'И', effect: `!!document.querySelector('.fx-layer .gun-fire')`, after: 300 },
  // the three arms lie across «Месть» and the wood has cracked under each
  { scene: 'kraken', owner: 'Г', effect: `document.querySelectorAll('[data-fx-ship="М"] .fx-cracks .rv').length === 3`, after: 700 },
  // the little ship is in the bottle, the cork comes
  { scene: 'bottle', owner: 'М', effect: `!!document.querySelector('.fx-layer .lg-rock')`, after: 300 },
  // the compass over «Жемчужина», its needle spins
  { scene: 'jack', owner: 'Ж', effect: `!!document.querySelector('.fx-layer svg .nd')`, after: 600, from: `!!document.querySelector('[data-fx-instruction]')?.textContent?.includes('тонет')` },
];
const SIZES: [number, number][] = [[1366, 660], [430, 932]];

async function shot(page: Page, ready: string, after: number, file: string): Promise<void> {
  await page.waitForFunction(ready, null, { timeout: 30_000, polling: 'raf' });
  if (after) await page.waitForTimeout(after);
  await page.screenshot({ path: file });
}

/**
 * From the load the page notes the moments of the entrance: the last frame the card, the seal or the scroll is seen,
 * the first frame the caption «ЛЕГЕНДА …» of the top bar is full; and, while the caption is up (the effect plays on the
 * open table), every part of a plank the thin bars or the caption cover.
 */
const WATCH = () => {
  const w = window as unknown as { __lg: { lastIntro: number; capFull: number; under: string[] } };
  w.__lg = { lastIntro: 0, capFull: 0, under: [] };
  const meet = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  const op = (e: Element) => Number(getComputedStyle(e).opacity);
  const tick = () => {
    const now = performance.now();
    if (Array.from(document.querySelectorAll('.fx-layer > .lg-card, .fx-layer > .lg-seal, .fx-layer > .lg-title')).some((e) => op(e) > 0.05)) w.__lg.lastIntro = now;
    const cap = document.querySelector('.fx-layer > .lg-cap');
    if (cap && op(cap) > 0.95) {
      if (!w.__lg.capFull) w.__lg.capFull = now;
      const parts = Array.from(document.querySelectorAll('.plank-head, [data-fx-statuses], [data-fx-track], .badges > *')).map((e) => ({ e, r: e.getBoundingClientRect() })).filter((x) => x.r.width > 0);
      for (const el of Array.from(document.querySelectorAll('.fx-layer > .lg-bar, .fx-layer > .lg-cap'))) {
        const r = el.getBoundingClientRect();
        for (const x of parts) {
          if (!meet(r, x.r)) continue;
          const what = `${el.className} over ${x.e.closest('[data-fx-ship]')?.getAttribute('data-fx-ship')} ${x.e.getAttribute('data-fx-track') ?? x.e.className}`;
          if (!w.__lg.under.includes(what)) w.__lg.under.push(what);
        }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

test.describe('the Legends through ?fxScene', () => {
  test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

  for (const l of LEGENDS) {
    for (const [width, height] of SIZES) {
      test(`${l.scene} ${width}×${height}: the seal, the card, the effect, no label over the planks, the result`, async ({ browser }) => {
        const page = await browser.newPage({ viewport: { width, height } });
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.addInitScript(WATCH);
        await open(page, l.scene);
        if (l.from) await page.waitForFunction(l.from, null, { timeout: 30_000, polling: 'raf' });
        await watchCover(page);
        const size = `${width}x${height}`;
        await shot(page, SEAL, 200, `${SHOTS}/e2e-${l.scene}-seal-${size}.png`);

        // The seal (SEAL_HTML of the prototype): «ЛЕГЕНДА» once along its upper arc (r 26.5 around 0,0, from −105° to
        // 105° clockwise from the top); the letters do not run into each other and stay on the arc.
        const ring = await page.evaluate(() => {
          const texts = document.querySelectorAll<SVGTextContentElement>('.fx-layer > .lg-seal text');
          const tp = texts[texts.length - 1];
          const ang = (p: DOMPoint) => Math.atan2(p.x, -p.y);
          const n = tp.getNumberOfChars();
          const chars = Array.from({ length: n }, (_, i) => ({ s: ang(tp.getStartPositionOfChar(i)), e: ang(tp.getEndPositionOfChar(i)) }));
          let overlap = 0;
          for (let i = 0; i + 1 < n; i++) overlap = Math.max(overlap, chars[i].e - chars[i + 1].s);
          const lim = (105 * Math.PI) / 180;
          return { text: tp.textContent, overlap: overlap * 26.5, onArc: chars[0].s >= -lim && chars[n - 1].e <= lim };
        });
        expect(ring.text).toBe('ЛЕГЕНДА');
        expect(ring.overlap, 'the letters of the seal overlap').toBeLessThanOrEqual(0.05);
        expect(ring.onArc, 'the word stays on the arc').toBe(true);

        // The card: the bottom strip — only the name of its ship, in the colour of its ship, not under 10 px on screen.
        const foot = await page.evaluate(() => {
          const card = document.querySelector<HTMLElement>('.fx-layer > .lg-card')!, f = card.querySelector<HTMLElement>('.lc-foot')!;
          const scale = card.getBoundingClientRect().width / card.offsetWidth;
          return { text: f.textContent, bg: getComputedStyle(f).backgroundColor, px: parseFloat(getComputedStyle(f).fontSize) * scale };
        });
        const ships: Record<string, { nick: string; color: string }> = JSON.parse(readFileSync('data/game-data.json', 'utf8')).ships.reduce((m: Record<string, unknown>, s: { code: string }) => ({ ...m, [s.code]: s }), {});
        const hex = ships[l.owner].color;
        const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
        expect(foot.text).toBe(ships[l.owner].nick);
        expect(foot.bg).toBe(rgb);
        expect(foot.px).toBeGreaterThanOrEqual(10);

        await shot(page, l.effect, l.after, `${SHOTS}/e2e-${l.scene}-effect-${size}.png`);
        if (l.scene === 'kraken') {
          // Three arms lie across «Месть»: the base of each at the edge of the target at 30/55/78 % of its width, and
          // the crack of the wood was born right under it (its circle of reveal starts there).
          const grip = await page.evaluate(() => {
            const lay = document.querySelector('.fx-layer')!.getBoundingClientRect();
            const pr = document.querySelector('[data-fx-ship="М"]')!.getBoundingClientRect();
            const bases = Array.from(document.querySelectorAll<SVGGElement>('.fx-layer [data-grip]')).map((g) => { const m = new DOMMatrix(getComputedStyle(g).transform); return { x: m.e + lay.left, y: m.f + lay.top }; });
            const cracks = Array.from(document.querySelectorAll<SVGElement>('[data-fx-ship="М"] .fx-cracks .rv')).map((c) => new DOMMatrix(getComputedStyle(c).transform).e + pr.left);
            return { at: bases.map((b) => Math.round(((b.x - pr.left) / pr.width) * 100) / 100), edge: bases.map((b) => Math.abs(b.y - pr.top)), under: bases.map((b, i) => Math.abs(b.x - cracks[i])) };
          });
          expect(grip.at.length).toBe(3);
          grip.at.forEach((f, i) => expect(Math.abs(f - [0.3, 0.55, 0.78][i]), `arm ${i} at ${f}`).toBeLessThanOrEqual(0.02));
          for (const d of grip.edge) expect(d, 'the base of an arm at the edge of the target').toBeLessThanOrEqual(6);
          for (const d of grip.under) expect(d, 'the crack under its arm').toBeLessThanOrEqual(2);
        }

        await expectResult(page, l.scene);
        const seen = await readCover(page);
        for (const [what, t] of Object.entries(seen.cover)) if (!SHOUTS.some((x) => what.startsWith(`«${x}»`))) expect(t, what).toBeLessThanOrEqual(FLASH_MS);
        expect(seen.touch, 'explanations in the middle on a plank').toEqual([]);
        const lg = await page.evaluate(() => (window as unknown as { __lg: { lastIntro: number; capFull: number; under: string[] } }).__lg);
        // the card, the seal and the scroll are gone when the entrance ends (the caption of the top bar is up)
        expect(lg.capFull).toBeGreaterThan(0);
        expect(lg.lastIntro).toBeLessThanOrEqual(lg.capFull);
        expect(lg.under, 'the thin bars and the caption over the planks').toEqual([]);
        expect(errors).toEqual([]);
        await page.close();
      });
    }
  }

  test('a press on the table during the entrance shows the result at once', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'kraken');
    await page.waitForFunction(SEAL, null, { polling: 'raf' });
    const g = (await page.locator('[data-fx-gap]').boundingBox())!;
    await page.mouse.click(g.x + g.width / 2, g.y + g.height / 2);
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 2_000 });
    await expectResult(page, 'kraken');
  });

  test('simple effects: no rays, no particles, no sparks in the four Legends', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await page.addInitScript(() => {
      const w = window as unknown as { __rich: string[] };
      w.__rich = [];
      const RICH = ['lg-sun', 'lg-mote', 'gold-dust', 'sparkle', 'spark', 'splinter', 'shred', 'dust', 'ring', 'puff'];
      new MutationObserver((ms) => {
        for (const m of ms) for (const n of Array.from(m.addedNodes)) if (n instanceof HTMLElement && n.parentElement?.matches('.fx-layer')) for (const c of RICH) if (n.classList.contains(c) && !w.__rich.includes(c)) w.__rich.push(c);
      }).observe(document, { subtree: true, childList: true });
    });
    for (const l of LEGENDS) {
      await open(page, l.scene, 'fast', '&rich=0');
      await playing(page);
      await expectResult(page, l.scene);
      expect(await page.evaluate(() => (window as unknown as { __rich: string[] }).__rich), l.scene).toEqual([]);
    }
  });

  test('reduced motion and «мгновенно»: the layer draws nothing, the table is the result', async ({ browser }) => {
    for (const [opts, speed] of [[{ reducedMotion: 'reduce' as const }, 'normal'], [{}, 'instant']] as const) {
      const page = await browser.newPage({ viewport: { width: 1366, height: 660 }, ...opts });
      await page.addInitScript(() => {
        const w = window as unknown as { __drawn: number };
        w.__drawn = 0;
        new MutationObserver(() => { w.__drawn += document.querySelectorAll('.fx-layer > *').length; }).observe(document, { subtree: true, childList: true });
      });
      await open(page, 'kraken', speed);
      await expectResult(page, 'kraken');
      expect(await page.evaluate(() => (window as unknown as { __drawn: number }).__drawn), speed).toBe(0);
      await page.close();
    }
  });

  test('kraken: the entrance takes no press — the planks and the hand under the bars and the darkening; a card of the hand opens during the show', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'kraken');
    await page.waitForFunction(SEAL, null, { polling: 'raf' });
    expect(await page.locator('.fx-layer > .lg-veil').count()).toBe(1);
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
    await page.locator('[data-fx-hand] [data-fx-card]').first().click();
    await expect(page.getByTestId('card-detail')).toBeVisible();
    // the show goes on: the Legend is still in the layer, the scene has not ended
    expect(await page.evaluate(() => !document.body.dataset.fxDone && !!document.querySelector('.fx-layer > .lg-bar'))).toBe(true);
  });
});

test('the four Legends play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  let scene = '';
  const note = (text: string) => {
    errors.push(text);
    console.log(`[iphone ${scene}] ${text}`);
  };
  page.on('pageerror', (e) => note(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
  await page.addInitScript(() => {
    const w = window as unknown as { __sawSeal: boolean };
    w.__sawSeal = false;
    new MutationObserver(() => {
      if (document.querySelector('.fx-layer > .lg-seal')) w.__sawSeal = true;
    }).observe(document, { subtree: true, childList: true });
  });
  for (const l of LEGENDS) {
    scene = l.scene;
    await open(page, scene, 'fast');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(errors, scene).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sawSeal: boolean }).__sawSeal), `${scene}: the layer showed the entrance`).toBe(true);
    expect(await page.locator('.fx-layer > *').count(), scene).toBe(0);
  }
});
