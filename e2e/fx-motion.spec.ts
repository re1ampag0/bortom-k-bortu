// A3: the ships in motion on the table through «?fxScene=<id>» — a change of places (FLIP), diving, surfacing, sinking,
// the abilities. For each scene a frame of the game at the moment of the effect goes to docs/screenshots/a3/, its
// milliseconds from the load of the page to docs/screenshots/a3/times.json; the frames of the reference are taken by
// capture.mjs into docs/screenshots/a3/ref/. After the show the numbers are the result of the scene, the planks are the
// same DOM nodes in their new places, the steady look («Под водой», sunk) is a class, no animation hangs on a plank.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import type { Track } from '../src/engine/types';
import { clickMisses, expectResult, finalOf, open, playing } from './fx-scene';

const SHOTS = 'docs/screenshots/a3';
const TIMES = `${SHOTS}/times.json`;

/** A frame: the scene (and more of the address), the moment (a check in the page), how long after it the frame is taken. */
interface Frame {
  name: string;
  scene: string;
  extra?: string;
  ready: string;
  after: number;
  width?: number;
  height?: number;
}
const layerHas = (sel: string) => `!!document.querySelector('.fx-layer ${sel}')`;
/** A plank is moving: a running animation of the layer (not a CSS one) on it. */
const planksMoving = `Array.from(document.querySelectorAll('[data-fx-ship]')).some((p) => p.getAnimations().some((a) => a.playState === 'running' && !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)))`;
const stamp = (text: string) => `Array.from(document.querySelectorAll('.fx-layer .stamp-fx')).some((t) => t.textContent === ${JSON.stringify(text)})`;
/** The stamp is seen: its springy easing (the reference's) shows it for about a third of a second. */
const stampShown = (text: string) => `Array.from(document.querySelectorAll('.fx-layer .stamp-fx')).some((t) => t.textContent === ${JSON.stringify(text)} && Number(getComputedStyle(t).opacity) > 0.8)`;
const FRAMES: Frame[] = [
  { name: 'regroup', scene: 'regroup', ready: planksMoving, after: 300 },
  { name: 'sword', scene: 'sword', ready: `${stamp('Меч Тритона')} && ${planksMoving}`, after: 300 },
  { name: 'dive', scene: 'dive', ready: layerHas('.underwater'), after: 600 },
  // In the reference the surfacing is a part of the start of the turn (the clip «turn», A4): only «surfaced» is shown.
  { name: 'surface', scene: 'surface', extra: '&only=surfaced', ready: layerHas('.underwater'), after: 350 },
  // A ship sunk by a Volley (the scene «sink» sinks it by a card — the clip «card» is A4).
  { name: 'sink', scene: 'guns', ready: stampShown('Затонул'), after: 0 },
  { name: 'heart', scene: 'heart', ready: layerHas('.heart'), after: 1500 },
  { name: 'sink', scene: 'guns', ready: stampShown('Затонул'), after: 0, width: 430, height: 932 },
];

function saveTime(key: string, scene: string, ms: number) {
  const all: Record<string, { scene: string; ms: number }> = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')) : {};
  all[key] = { scene, ms };
  writeFileSync(TIMES, JSON.stringify(all, null, 2) + '\n');
}

/** The planks of each row, left to right: «code» with «(sunk)» / «(under)». */
const rows = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.planks')).map((r) =>
      Array.from(r.querySelectorAll<HTMLElement>('[data-fx-ship]')).map((p) => p.dataset.fxShip + (p.classList.contains('sunk') ? '(sunk)' : '') + (p.classList.contains('submerged') ? '(under)' : '')),
    ),
  );

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
const lows = (page: Page) => page.evaluate(() => (window as unknown as { __lows: Record<string, number> }).__lows);

/** What the scene ends with besides the numbers. */
async function expectLook(page: Page, scene: string, before: string[][]) {
  const after = await rows(page);
  const want = finalOf(scene);
  // The places: by pos of the result (a sunk ship on the free place), the same nodes as before the show.
  expect(await page.evaluate(() => (window as unknown as { __planks: Element[] }).__planks.every((p) => p.isConnected))).toBe(true);
  for (const row of after) {
    const codes = row.map((x) => x.replace(/\(.*$/, ''));
    const alive = codes.filter((c) => !want.ships[c].sunk);
    for (const c of alive) if (codes.length === 2) expect(`${c} at ${codes.indexOf(c)}`).toBe(`${c} at ${want.ships[c].pos}`);
  }
  for (const row of after) for (const x of row) {
    const c = x.replace(/\(.*$/, '');
    expect(x.includes('(sunk)'), `${c} sunk`).toBe(want.ships[c].sunk);
    expect(x.includes('(under)'), `${c} under water`).toBe(want.ships[c].submerged);
  }
  // Nothing the clips put on a plank hangs on it: the look is the class.
  const hanging = await page.evaluate(() => Array.from(document.querySelectorAll('[data-fx-ship]')).flatMap((p) => p.getAnimations({ subtree: true }).filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition))).length);
  expect(hanging).toBe(0);
  return { before, after };
}

test.describe('the ships in motion through ?fxScene', () => {
  test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

  for (const f of FRAMES) {
    const width = f.width ?? 1366, height = f.height ?? 660;
    test(`${f.name} ${width}×${height}: the effect on the table, the frame, the result`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, f.scene, 'normal', f.extra);
      const before = await rows(page);
      await page.evaluate(() => ((window as unknown as { __planks: Element[] }).__planks = Array.from(document.querySelectorAll('[data-fx-ship]'))));
      await watchLows(page);
      await page.waitForFunction(f.ready, null, { timeout: 20_000, polling: 'raf' });
      await page.waitForTimeout(f.after);
      const ms = await page.evaluate(() => Math.round(performance.now()));
      await page.screenshot({ path: `${SHOTS}/game-${f.name}-${width}x${height}.png` });
      saveTime(`${f.name}-${width}x${height}`, f.scene, ms);
      await expectResult(page, f.scene);
      // In these scenes the numbers only go down or stay: none is ever below the result (a clip that read the table
      // before it was drawn from D took a number too low — the heart set «Команда» 1/3 instead of 2/3).
      const want = finalOf(f.scene);
      for (const [key, low] of Object.entries(await lows(page))) {
        const [code, t] = key.split(' ') as [string, Track];
        expect(low, `${key}: the lowest number during the show`).toBeGreaterThanOrEqual(want.ships[code].tracks[t]);
      }
      const { after } = await expectLook(page, f.scene, before);
      if (f.name === 'regroup' || f.name === 'sword') expect(after).not.toEqual(before);
      expect(errors).toEqual([]);
      await page.close();
    });
  }

  test('regroup: the layer takes no press while the planks move', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await open(page, 'regroup');
    await playing(page);
    await page.waitForFunction(planksMoving, null, { polling: 'raf' });
    const misses = await clickMisses(page);
    expect(misses.planks).toBe(4);
    expect(misses.layer).toBeGreaterThan(0);
    expect(misses.out).toEqual([]);
  });
});

test('the scenes of the ships in motion play in Safari without errors @iphone', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  let scene = '';
  const note = (text: string) => {
    errors.push(text);
    console.log(`[iphone ${scene}] ${text}`);
  };
  page.on('pageerror', (e) => note(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
  // The scenes of A3 are short (under a second at «fast»): whether the layer showed something is recorded from the
  // load of the page, not caught by polling.
  await page.addInitScript(() => {
    const w = window as unknown as { __sawLayer: boolean };
    w.__sawLayer = false;
    new MutationObserver(() => {
      if (document.querySelector('.fx-layer > *')) w.__sawLayer = true;
    }).observe(document, { subtree: true, childList: true });
  });
  for (const [id, extra] of [['regroup', ''], ['sword', ''], ['dive', ''], ['surface', '&only=surfaced'], ['guns', ''], ['heart', '']]) {
    scene = id;
    await open(page, id, 'fast', extra);
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(errors, id).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sawLayer: boolean }).__sawLayer), `${id}: the layer showed the clips`).toBe(true);
    expect(await page.locator('.fx-layer > *').count(), id).toBe(0);
  }
});

// A5 (A8): the captain's longboat of «Гибель» is the new clinker-built one — a shadow and a reflection on the water, the planking in
// strakes (a clip path of its own), the oars on oarlocks; its ids are its own (no id twice in the document).
test('sink: the captain rows across in the new clinker longboat', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 660 });
  await open(page, 'sink');
  await page.waitForFunction(() => !!document.querySelector('.fx-layer .oar'), null, { timeout: 40_000, polling: 'raf' });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const boat = document.querySelector('.fx-layer .oar')!.closest('svg > g')!;
    const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id);
    return {
      oars: boat.querySelectorAll('.oar').length,
      clip: boat.querySelectorAll('clipPath').length,
      reflection: boat.querySelectorAll('g[transform^="matrix(1 0 0 -.35"]').length,
      strakes: boat.querySelectorAll('g[clip-path] path').length,
      dup: ids.filter((id, i) => ids.indexOf(id) !== i),
    };
  });
  expect(r.oars).toBe(2);
  expect(r.clip, 'the planking clip').toBe(1);
  expect(r.reflection, 'the reflection').toBe(1);
  expect(r.strakes, 'the strakes').toBeGreaterThanOrEqual(3);
  expect(r.dup, 'ids twice').toEqual([]);
});
