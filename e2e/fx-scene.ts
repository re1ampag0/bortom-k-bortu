// The helpers of the e2e checks on «?fxScene=<id>» (A2, A2b): the scenes of the reference (docs/mockups/anim/level1/
// scenes.js) played on the table of the game.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, type Page } from '@playwright/test';
import { loadGameData } from '../src/engine/data';
import type { GameEvent } from '../src/engine/state';
import type { Track } from '../src/engine/types';
import { applyVisible, displayRules, type Display } from '../src/ui/game/fx/display';

export const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const data = loadGameData(JSON.parse(readFileSync('data/game-data.json', 'utf8')));

interface Scene {
  id: string;
  start: Display;
  actions: { ev: GameEvent[] }[];
}
const win: { SCENES?: Scene[] } = {};
runInNewContext(readFileSync('docs/mockups/anim/level1/scenes.js', 'utf8'), { window: win });
const SCENES = win.SCENES!;

/** finalState of page.js: the start of the scene and every event of it. */
export function finalOf(id: string): Display {
  const sc = SCENES.find((s) => s.id === id)!;
  const d = structuredClone(sc.start);
  const rules = displayRules(data);
  for (const a of sc.actions) for (const e of a.ev) applyVisible(d, e, rules);
  return d;
}

/** `extra` — more of the address, e.g. «&only=surfaced» (FxScene.tsx). */
export async function open(page: Page, id: string, speed = 'normal', extra = '') {
  await page.goto(`?fxScene=${id}&speed=${speed}${extra}`);
  await expect(page.locator(`[data-fx-scene="${id}"]`)).toBeVisible();
}

/** The show is on: something is in the layer and the scene has not ended. */
export async function playing(page: Page) {
  await page.waitForFunction(() => document.body.dataset.fxStart === '1' && document.querySelectorAll('.fx-layer > *').length > 0 && !document.body.dataset.fxDone);
}

/** elementFromPoint over the planks and the cards of the hand: what does not give the element itself. */
export async function clickMisses(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const check = (el: Element, sel: string, name: string) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || getComputedStyle(el).visibility === 'hidden') return;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (hit?.closest(sel) !== el) out.push(`${name}: ${hit ? hit.className : 'nothing'}`);
    };
    document.querySelectorAll('[data-fx-ship]').forEach((el) => check(el, '[data-fx-ship]', `plank ${el.getAttribute('data-fx-ship')}`));
    document.querySelectorAll('[data-fx-hand] [data-fx-card]').forEach((el) => check(el, '[data-fx-card]', `card ${el.getAttribute('data-fx-card')}`));
    return { out, planks: document.querySelectorAll('[data-fx-ship]').length, layer: document.querySelectorAll('.fx-layer > *').length };
  });
}

/** After the show: the numbers of the tracks are the result of the scene, the layer is empty. `keep` — what stays in the
 *  layer by design: the whirlpool of «Водоворот» lives till the end of the turn (PERSIST.whirl; the reference clears it
 *  only because its scene ends). */
export async function expectResult(page: Page, id: string, keep?: string) {
  await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
  const want = finalOf(id);
  const shown = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-fx-ship]')).map((p) => ({
      code: p.getAttribute('data-fx-ship')!,
      values: Object.fromEntries(Array.from(p.querySelectorAll('[data-fx-track]')).map((t) => [t.getAttribute('data-fx-track'), t.querySelector('[data-fx-value]')!.textContent!.split('/')[0]])),
    })),
  );
  for (const { code, values } of shown) {
    for (const t of TRACKS) expect(`${code} ${t} ${values[t]}`).toBe(`${code} ${t} ${want.ships[code].tracks[t]}`);
  }
  expect(await page.locator('.fx-layer > *').count()).toBe(keep ? 1 : 0);
  if (keep) expect(await page.locator(`.fx-layer > ${keep}`).count()).toBe(1);
}

/**
 * S1: from now on the page measures, frame by frame, how long each label of the layer (.tag, .pill, .tmark) covers a
 * part of a plank — its head (★, the name), the status chips, a track, a badge — and which rules of a sea card in the
 * middle (.tag.rule) touch a plank at all. Read with readCover.
 */
export async function watchCover(page: Page) {
  await page.evaluate(() => {
    const cover: Record<string, number> = {};
    const touch: string[] = [];
    const since = new Map<Element, number>();
    const parts = '.plank-head, [data-fx-statuses], [data-fx-track], .badges > *';
    const meet = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    const name = (e: Element) => `${e.closest('[data-fx-ship]')?.getAttribute('data-fx-ship')} ${e.getAttribute('data-fx-track') ?? (e.matches('[data-fx-statuses]') ? 'statuses' : e.matches('.plank-head') ? 'head' : e.textContent)}`;
    const tick = () => {
      const now = performance.now();
      const ps = Array.from(document.querySelectorAll(parts)).map((e) => ({ e, r: e.getBoundingClientRect() })).filter((x) => x.r.width > 0);
      const planks = Array.from(document.querySelectorAll('.plank')).map((e) => e.getBoundingClientRect());
      for (const el of Array.from(document.querySelectorAll('.fx-layer > .tag, .fx-layer > .pill, .fx-layer > .tmark'))) {
        const on = Number(getComputedStyle(el).opacity) > 0.05;
        const r = el.getBoundingClientRect();
        const hit = on ? ps.find((x) => meet(r, x.r)) : undefined;
        if (on && el.matches('.tag.rule') && planks.some((q) => meet(r, q)) && !touch.includes(el.textContent!)) touch.push(el.textContent!);
        if (!hit) { since.delete(el); continue; }
        if (!since.has(el)) since.set(el, now);
        const key = `«${el.textContent}» over ${name(hit.e)}`;
        cover[key] = Math.max(cover[key] ?? 0, Math.round(now - since.get(el)!));
      }
      requestAnimationFrame(tick);
    };
    tick();
    (window as unknown as { __cover: unknown }).__cover = { cover, touch };
  });
}
/** What watchCover saw: the longest time each label covered a part of a plank (ms), the labels that touched a plank. */
export async function readCover(page: Page): Promise<{ cover: Record<string, number>; touch: string[] }> {
  return page.evaluate(() => (window as unknown as { __cover: { cover: Record<string, number>; touch: string[] } }).__cover);
}
