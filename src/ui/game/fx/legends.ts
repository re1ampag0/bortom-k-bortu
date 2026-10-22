import {canvasMote} from './particles';
import {perfOff} from '../perf/state';
// The Legends: the common grand entrance of a Legend and the effect of each. FX-B (package 3): the look and the timings
// of the A5 prototype (docs/mockups/a5/fx/src/fx3.js, ANIMATIONS.md §3.1–3.5) on the primitives of the game; the
// pictures are in ../art/legendArt.ts and ../art/bigShips.ts, the durations in timing.ts (T.legend, T.kraken, …).
// Earlier (L1) a port of docs/mockups/anim/level1/play-legends.js: the element is found by the data-fx-* DOM contract.
// Changes against the reference («game:»):
//  - the card of the Legend has the bottom strip of the ship that played it («ЛЕГЕНДА · МЕСТЬ», footHTML — A4);
//  - S1: no label explaining the effect lies on a plank longer than a flash: the damage and the repair — short marks
//    «−N» / «+N» at the number of the track (trackMark), the Souls — a mark at the badge, the
//    Powder paid — a mark at the Hold; «время замерло…» and «Джонс
//    свободен» — in the middle of the table (ruleTag). The shouts of the effect («Бортовой залп!», «Чпок!»,
//    «Ускользнул!»), the scroll and the seal stay as in the reference (the decision of the user), not longer than it;
//  - the thin top bar of the effect ends above the top row of planks (on a phone the reference's lay 2 px on the heads);
//  - «Кракен» takes its frame of the hit off the plank at its end (the plank keeps its node, React would not).
import { legendCards } from '../../../engine/data';
import { shipData, startValue, type GameEvent } from '../../../engine/state';
import type { CardInstance, GameData, Track } from '../../../engine/types';
import type { ClipPlayer } from './FxLayer';
import { flipTo } from './misc';
import type { JackClip, LegendClip } from './planFx';
import {
  particleShape, A, at, badgeMark, ballFly, boom, facingY, filters, flashBoard, fxSvg, missSplash, seaTemp, sparksSvg, splintersSvg, waterColumn, gunFire, hitBlast, burst, bx, clamp, flash, fxPoint, gapBox, hint, holdEl, inkOn, isPhone, isTop, mk, payKegs, plank,
  qpts, rnd, room, setTrack, shake, shownTrack, sideOf, soulsFly, sv, trackMark, visible, wait, wisp, type FxCtx, type Pt,
} from './primitives';
import { CELLS } from '../art/cells';
import { ART_FRAME, bottleArt, compassArt, CORK, COST_ICON, COST_WORD, crackArt, EMBLEM, SEAL_HTML, TENT } from '../art/legendArt';
import { ruleTag } from './sea';
import { plankScars, scar, seaScars } from './scars';
import { T } from './timing';
import { bigShip, type BigShipKind } from '../art/bigShips';
import {spriteReady, takeSprite} from './sprites';
import {armadaGeometry, armadaA, armadaBall, armadaRecoil, armadaSmoke, armadaSmokeHost} from './armadaSprites';

let LG_UID = 0;
const R1 = (n: number) => Math.round(n * 10) / 10;

const esc = (s: string) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
const nick = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nick}»`;
const legendsOf = new WeakMap<GameData, Record<string, CardInstance>>();
function legendCard(data: GameData, code: string): CardInstance {
  let m = legendsOf.get(data);
  if (!m) legendsOf.set(data, (m = Object.fromEntries(legendCards(data).map((c) => [c.code, c]))));
  return m[code];
}

/* ——— our own pictures (no frames or images from the films) ——— */
/** The pictures of the Legend cards by the code of the card (EMBLEM of the prototype). */
const EMBLEM_OF: Record<string, keyof typeof EMBLEM> = { 'Г-Л': 'kraken', 'И-Л': 'armada', 'М-Л': 'bottle', 'Ж-Л': 'jack' };
/** Russian typesetting (legendCardHTML of fx3.js): a number stays with its word, a short word stays with the next one. */
export const nbspText = (t: string) => t.replace(/ (<b>)?(\d)/g, '&nbsp;$1$2').replace(/(\d) /g, '$1&nbsp;').replace(/(^|[\s>(«])(и|в|с|к|о|а|по|не|Не|на|за|из|её|их|это|Это) /g, '$1$2&nbsp;');

/**
 * The card of a Legend 248×372 (legendCardHTML of fx3.js): the back (a compass rose, «Легенда») and the face — the price
 * «digit + icon» in one line (the full «3 Пороха» in title/aria-label), «Легенда · приказ», the picture, the name, the
 * main thing, the text of the rule, the bottom strip with the name of the ship that played it in the colour of the ship.
 * game: the texts are of data/game-data.json; the strip is never under 10 px on screen at the scale `s`.
 */
export function lgCardHTML(data: GameData, code: string, owner: string, s = 1): string {
  const c = legendCard(data, code), sh = shipData(data, owner), key = EMBLEM_OF[code];
  const kind = c.soul ? 'souls' : 'powder', n = c.soul || c.cost;
  const word = COST_WORD(n, kind);
  const foot = Math.max(11, Math.ceil((10 / s) * 10) / 10);
  const rose = Array.from({ length: 16 }, (_, i) => { const a = (i * Math.PI) / 8 - Math.PI / 2, r = i % 4 === 0 ? 17 : i % 2 === 0 ? 11 : 6; return `<path d="M0 0 L${R1(Math.cos(a - 0.14) * 3)} ${R1(Math.sin(a - 0.14) * 3)} L${R1(Math.cos(a) * r)} ${R1(Math.sin(a) * r)} Z" fill="${i % 2 ? '#c9a048' : '#f2d98a'}"/>`; }).join('');
  return `<div class="lc-back"><svg width="130" height="130" viewBox="-20 -20 40 40" aria-hidden="true">${rose}<circle r="18.6" fill="none" stroke="#c9a048" stroke-width=".6"/></svg><b>Легенда</b></div>` +
    `<div class="lc-face"><div class="lc-top">${n ? `<span class="lc-cost lc-${kind}" title="Цена: ${word}" aria-label="Цена: ${word}"><b>${n}</b>${COST_ICON[kind]}</span>` : '<span></span>'}<span class="lc-type">Легенда · ${esc(c.type.toLowerCase())}</span></div>` +
    `<div class="lc-art"><svg width="212" height="140" viewBox="0 0 150 99" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${key ? EMBLEM[key]() : ''}${ART_FRAME()}</svg></div>` +
    `<div class="lc-name">${esc(c.name)}</div><div class="lc-big">${esc(c.big)}</div><div class="lc-text"><p>${nbspText(c.text)}</p></div>` +
    `<div class="lc-foot" style="background:${sh.color};color:${inkOn(sh.color)};font-size:${foot}px"><span>${esc(sh.nick)}</span></div>` +
    `<i class="lc-shine"></i><svg class="lc-glint" width="248" height="372" viewBox="0 0 248 372" aria-hidden="true"><rect x="3" y="3" width="242" height="366" rx="12" fill="none" stroke="#fff6d8" stroke-width="3" stroke-dasharray="80 1136" stroke-linecap="round"/></svg></div>`;
}

/** game: a long rule (the data may be longer than the prototype's) — the text gets smaller, 0.5 px a step down to 11 px,
 *  until it fits between the main thing and the strip (never over them). */
export function fitCardText(card: Element): void {
  const box = card.querySelector<HTMLElement>('.lc-text'), p = card.querySelector<HTMLElement>('.lc-text p');
  if (!box || !p) return;
  for (let f = 13; f > 11 && p.offsetHeight > box.clientHeight - 12; f -= 0.5) p.style.fontSize = f - 0.5 + 'px';
}

/** Where the Legend comes from: the medallion «Легенда» on the plank of the owner (on a phone — the star in the head). */
function legendMedal(ctx: FxCtx, ship: string): Element {
  const p = plank(ctx, ship);
  return [p.querySelector('[data-fx-legend]'), p.querySelector('.star'), p.querySelector('.plank-head')].find(visible) || p;
}

/** A gold ring that spreads and fades (circRing of fx3.js). */
function circRing(ctx: FxCtx, svg: Element, x: number, y: number, r0: number, r1: number, color: string, d: number, delay = 0, w = 2): void {
  // drawn when its time comes (a delayed ring would show its first frame before it)
  if (delay > 0) { at(ctx, delay, () => circRing(ctx, svg, x, y, r0, r1, color, d, 0, w)); return; }
  const c = sv(svg, `<circle cx="0" cy="0" r="${R1(r1)}" fill="none" stroke="${color}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`);
  A(ctx, c, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(${R1((r0 / r1) * 100) / 100})`, opacity: 1 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 0 }], d, delay, 'cubic-bezier(.2,.7,.3,1)');
}
/** Gold dust and four-point sparks from a point (goldBurst of fx3.js), within the budget of the layer. */
export function goldBurst(ctx: FxCtx, svg: Element, x: number, y: number, n = 40, r0 = 30, r1 = 140, delay = 0): void {
  const m = room(ctx, n);
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2 + rnd(-0.1, 0.1), r = rnd(r0, r1);
    const p = particleShape(ctx, svg, i % 3 ? `<circle r="${R1(rnd(1.2, 2.8))}" fill="${['#fff6d8', '#ffd27a', '#e0bd62'][i % 3]}"/>` : '<path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#fff6d8"/>');
    A(ctx, p, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 1 }, { transform: `translate(${R1(x + Math.cos(a) * r)}px,${R1(y + Math.sin(a) * r)}px) scale(.4)`, opacity: 0 }], rnd(700, 1300), delay, 'cubic-bezier(.1,.8,.3,1)');
  }
}
/** Gold motes rising from below (motes of fx3.js). */
function motes(ctx: FxCtx, n: number, x0: number, x1: number, y0: number, y1: number, delay = 0): void {
  const colors = ['#ffe9a8', '#ffd27a', '#fff6d8'], m = room(ctx, n);
  for (let i = 0; i < m; i++) {
    const s = rnd(2, 5), el = canvasMote(ctx,s/2,colors[i%3]) ?? mk(ctx, 'lg-mote', 0, 0);
    if(el instanceof HTMLElement){el.style.width = el.style.height = s + 'px'; el.style.background = colors[i % 3];}
    const x = rnd(x0, x1), y = rnd(y0, y1);
    A(ctx, el, [{ transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${R1(x + rnd(-30, 30))}px,${R1(y - rnd(60, 160))}px)`, opacity: 0 }], rnd(1600, 3000), delay + rnd(0, 1600));
  }
}

/**
 * The common entrance of a Legend (legendIntro of fx3.js, ANIMATIONS.md §3.1; T.legend). Returns the function of the
 * leave (takes the thin top bar and its caption away).
 * 1. the medallion of the Legend on the plank of the owner flares (×2.2, glow), three rings, gold sparks; the price;
 * 2. the table dims (a vignette), the cinema bars with a gold line slide in, gold rays turn behind the middle, motes rise;
 * 3. the card flies out of the medallion along an arc with a gold tail, grows and turns over (back → face);
 * 4. it lands in the middle of the sea: a shockwave, gold sparks, a soft gold flash, the table shakes;
 * 5. the wax seal «ЛЕГЕНДА» stamps its bottom right corner (×3.2 → ×1), a ring, sparks, the card quivers;
 * 6. under the card the red ribbon with the name unrolls letter by letter, a shine and a spark run over the card;
 * 7. the card collapses into a golden orb that flies with a tail to the target; the dim, the rays and the bottom bar go.
 * game: the top bar stays thin over the top row with the caption «ЛЕГЕНДА · …» while the effect plays (it ends above
 * the planks); «простые спецэффекты» — only the card in the middle for 1 s, no particles.
 */
export async function legendIntro(ctx: FxCtx, code: string, owner: string, { cost = 0, soulCost = 0, target = null }: { cost?: number; soulCost?: number; target?: string | null } = {}): Promise<() => Promise<void>> {
  const board = ctx.board, L = T.legend;
  const W = board.clientWidth, H = board.clientHeight;
  const c = legendCard(ctx.data, code);
  // the middle of the sea between the rows of planks; the card, the seal and the ribbon fit into the board
  const rows = board.querySelectorAll(':scope .planks');
  const g = gapBox(ctx);
  const S = Math.min(1, (W - 24) / 248, (H - 16) / 470);
  const cx = W / 2, cy = clamp(g.cy, 186 * S + 8, H - 270 * S - 8);
  hint(ctx, `${nick(ctx, owner)}: ЛЕГЕНДА «${c.name}»`);
  // the price. game (S1): a short mark «−N» at the Hold / at the badge of the Souls, not a label over a plank
  if (cost) { payKegs(ctx, sideOf(ctx, owner), cost, 0, false); badgeMark(ctx, holdEl(ctx, sideOf(ctx, owner)), `−${cost}`, 0); }
  const medal = legendMedal(ctx, owner), mb = bx(ctx, medal);
  const card = mk(ctx, 'lg-card', 0, 0, lgCardHTML(ctx.data, code, owner, S));
  card.style.zIndex = '39';
  fitCardText(card);
  const pose = (x: number, y: number, s: number, r = 0) => `translate(${R1(x - 124)}px,${R1(y - 186)}px) scale(${R1(s * 1000) / 1000}) rotate(${R1(r)}deg)`;
  if (soulCost) {
    const badge = plank(ctx, owner).querySelector('[data-fx-souls]');
    if (badge && visible(badge)) { const sb = bx(ctx, badge); for (let q = 0; q < soulCost; q++) wisp(ctx, { x: sb.cx, y: sb.cy }, { x: cx, y: cy }, q * 140, 700); badgeMark(ctx, badge, `−${soulCost}`, 0); }
  }
  if (!ctx.rich) {
    // «простые спецэффекты»: the card of the Legend in the middle for 1 s, then the result
    A(ctx, card, [{ opacity: 0, transform: pose(cx, cy, S) }, { opacity: 1, transform: pose(cx, cy, S), offset: 0.15 }, { opacity: 1, transform: pose(cx, cy, S), offset: 0.85 }, { opacity: 0, transform: pose(cx, cy, S) }], L.simple, 0, 'linear');
    await wait(ctx, L.simple);
    return async () => {};
  }
  const hi = fxSvg(ctx); hi.style.zIndex = '38';
  // 1. the medallion flares and calls
  A(ctx, medal, [{ transform: 'scale(1)', filter: 'none' }, { transform: 'scale(2.2)', filter: 'drop-shadow(0 0 12px #ffd27a) brightness(1.8)', offset: 0.45 }, { transform: 'scale(1.3)', filter: 'drop-shadow(0 0 6px #ffd27a) brightness(1.3)', offset: 0.9 }, { transform: 'scale(1)', filter: 'none' }], L.medal, 0, 'ease-out', 'none');
  for (let i = 0; i < 3; i++) circRing(ctx, hi, mb.cx, mb.cy, 4, 70, '#ffd27a', L.medal, i * 160, 3 - i);
  goldBurst(ctx, hi, mb.cx, mb.cy, 24, 10, 60);
  // 2. the stage: the dim with a vignette, the cinema bars with gold lines, slow rays behind the middle, motes
  const back = mk(ctx, 'lg-veil', 0, 0);
  Object.assign(back.style, { width: W + 'px', height: H + 'px', zIndex: '33', background: `radial-gradient(ellipse ${R1(W * 0.6)}px ${R1(H * 0.7)}px at ${R1(cx)}px ${R1(cy)}px, rgba(30,20,8,.35), rgba(6,8,12,.82) 70%), radial-gradient(circle at ${R1(cx)}px ${R1(cy)}px, transparent ${R1(H * 0.36)}px, rgba(201,160,72,.25) ${R1(H * 0.37)}px, transparent ${R1(H * 0.46)}px)` });
  A(ctx, back, [{ opacity: 0 }, { opacity: 1 }], L.back, L.backAt);
  const barH = 46;
  const top = mk(ctx, 'lg-bar top', 0, 0), bot = mk(ctx, 'lg-bar bottom', 0, H - barH);
  for (const b of [top, bot]) Object.assign(b.style, { width: W + 'px', height: barH + 'px', zIndex: '37' });
  A(ctx, top, [{ opacity: 1, transform: 'translateY(-100%)' }, { opacity: 1, transform: 'none' }], L.bars, L.barsAt, 'cubic-bezier(.2,.8,.3,1)');
  A(ctx, bot, [{ opacity: 1, transform: 'translateY(100%)' }, { opacity: 1, transform: 'none' }], L.bars, L.barsAt, 'cubic-bezier(.2,.8,.3,1)');
  const D = Math.round(Math.max(W, H) * 0.95);
  const rays = mk(ctx, 'lg-sun', cx, cy); Object.assign(rays.style, { width: D + 'px', height: D + 'px', margin: `${-D / 2}px 0 0 ${-D / 2}px`, zIndex: '34' });
  // the rays turn 18 s a turn (the CSS loop of the prototype, here by the clock of the show)
  const tOut = L.cardAt + L.land + L.hit + L.sealHit + L.hold, tOrb = tOut + L.orbAt;
  A(ctx, rays, [{ opacity: 0, transform: 'scale(.6) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(18deg)', offset: L.rays / (tOrb + 600 - L.raysAt) }, { opacity: 1, transform: `scale(1) rotate(${R1(((tOrb - L.raysAt) / 18000) * 360)}deg)`, offset: (tOrb - L.raysAt) / (tOrb + 600 - L.raysAt) }, { opacity: 0, transform: `scale(1) rotate(${R1(((tOrb + 600 - L.raysAt) / 18000) * 360)}deg)` }], tOrb + 600 - L.raysAt, L.raysAt, 'linear', 'forwards');
  motes(ctx, isPhone(ctx) ? 24 : 46, W * 0.1, W * 0.9, H * 0.62, H * 0.92);
  // 3. the card bursts out of the medallion along an arc, grows, turns over
  const path = qpts(mb.cx, mb.cy, (mb.cx + cx) / 2 + (mb.cx < cx ? -60 : 60), Math.max(Math.min(190, cy), Math.min(mb.cy, cy) - 140), cx, cy, 24);
  A(ctx, card, path.map((p, i) => ({ opacity: i ? 1 : 0, transform: pose(p.x, p.y, (0.08 + 0.92 * Math.pow(i / 24, 1.6)) * S, (1 - i / 24) * -24) })), L.fly, L.cardAt, 'cubic-bezier(.3,.1,.2,1)');
  for (let i = 0; i < 6; i++) {
    const t = particleShape(ctx, hi, `<circle r="${R1(6 - i * 0.8)}" fill="#ffd27a" opacity="${R1(0.7 - i * 0.1)}"/>`);
    A(ctx, t, [...path.map((p) => ({ transform: `translate(${R1(p.x)}px,${R1(p.y)}px)`, opacity: 1 })), { transform: `translate(${R1(cx)}px,${R1(cy)}px)`, opacity: 0 }], L.fly, L.cardAt + i * 40, 'cubic-bezier(.3,.1,.2,1)');
  }
  A(ctx, card.querySelector('.lc-back')!, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(0)', offset: 0.6 }, { transform: 'rotateY(180deg)' }], L.flip, L.cardAt, 'ease-in-out');
  A(ctx, card.querySelector('.lc-face')!, [{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(-180deg)', offset: 0.6 }, { transform: 'rotateY(0)' }], L.flip, L.cardAt, 'ease-in-out');
  // 4. the landing: a shockwave, a gold burst, the table shakes, a soft gold flash
  const tLand = L.cardAt + L.land;
  flashBoard(ctx, '#ffe7a4', 0.28, 380, tLand);
  boom(ctx, 5, 420, tLand);
  circRing(ctx, hi, cx, cy, 40, 420 * S, '#ffe7a4', 900, tLand, 5); circRing(ctx, hi, cx, cy, 30, 300 * S, '#fff6d8', 700, tLand + 120, 2);
  at(ctx, tLand, () => goldBurst(ctx, hi, cx, cy, 60, 120 * S, 320 * S));
  // 5. the wax seal «ЛЕГЕНДА» stamps the card in its bottom right corner
  const tSeal = tLand + L.hit, sp = { x: cx + 110 * S, y: cy + 172 * S };
  const seal = mk(ctx, 'lg-seal', sp.x, sp.y, SEAL_HTML); seal.style.zIndex = '40';
  A(ctx, seal, [{ transform: `translate(-50%,-50%) scale(${R1(3.2 * S * 100) / 100}) rotate(-40deg)`, opacity: 0 }, { transform: `translate(-50%,-50%) scale(${R1(0.86 * S * 100) / 100}) rotate(6deg)`, opacity: 1, offset: 0.7 }, { transform: `translate(-50%,-50%) scale(${R1(S * 100) / 100}) rotate(0deg)`, opacity: 1 }], L.seal, tSeal, 'cubic-bezier(.6,0,.9,.5)');
  const tHit = tSeal + L.sealHit;
  A(ctx, card, [{ translate: '0 0' }, { translate: '-6px 2.4px' }, { translate: '6px -1.8px' }, { translate: '-3.6px 0' }, { translate: '2.4px 1.2px' }, { translate: '0 0' }], 300, tHit, 'linear', 'none');
  circRing(ctx, hi, sp.x, sp.y, 10, 90 * S, '#f6d9c8', 600, tHit, 3);
  at(ctx, tHit, () => goldBurst(ctx, hi, sp.x, sp.y, 20, 20 * S, 80 * S));
  // 6. the name unfurls under the card, letter by letter; the shine and the spark run over the card
  const ban = mk(ctx, 'lg-title', cx, Math.min(cy + 224 * S, H - 30), [...c.name.toUpperCase()].map((ch) => `<span>${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join(''));
  ban.style.zIndex = '40';
  const bs = Math.min(S, (W - 16) / Math.max(1, ban.offsetWidth));
  A(ctx, ban, [{ transform: `translate(-50%,-50%) scale(${R1(bs * 100) / 100}) scaleX(.1)`, opacity: 0 }, { transform: `translate(-50%,-50%) scale(${R1(bs * 100) / 100}) scaleX(1.04)`, opacity: 1, offset: 0.6 }, { transform: `translate(-50%,-50%) scale(${R1(bs * 100) / 100})`, opacity: 1 }], L.ribbon, tHit, 'cubic-bezier(.2,.8,.3,1)');
  ban.querySelectorAll('span').forEach((s, i) => A(ctx, s, [{ opacity: 0, transform: 'translateY(12px) scale(1.6)' }, { opacity: 1, transform: 'none' }], 400, tHit + i * L.letter, 'cubic-bezier(.2,1.4,.5,1)'));
  const shine = card.querySelector('.lc-shine')!, glint = card.querySelector('.lc-glint rect')!;
  for (let k = 0; k * 1600 < L.hold; k++) A(ctx, shine, [{ transform: 'translateX(-120%)' }, { transform: 'translateX(120%)' }], 960, tHit + 100 + k * 1600, 'ease-in-out', 'none');
  A(ctx, glint, [{ strokeDashoffset: 0, opacity: 1 }, { strokeDashoffset: -1216 * (L.hold / 2200), opacity: 1 }], L.hold, tHit, 'linear', 'none');
  // 7. the card collapses into a golden orb that flies to the target
  A(ctx, ban, [{ opacity: 1 }, { opacity: 0 }], L.fade, tOut, 'ease-in', 'forwards');
  A(ctx, seal, [{ opacity: 1, transform: `translate(-50%,-50%) scale(${R1(S * 100) / 100})` }, { opacity: 0, transform: `translate(-50%,-50%) scale(${R1(0.4 * S * 100) / 100})` }], L.fade, tOut, 'ease-in', 'forwards');
  A(ctx, card, [{ opacity: 1, transform: pose(cx, cy, S), filter: 'brightness(1)' }, { opacity: 1, transform: pose(cx, cy, S * 1.06), filter: 'brightness(1.4)', offset: 0.3 }, { opacity: 0, transform: pose(cx, cy, S * 0.04, 25), filter: 'brightness(3)' }], L.collapse, tOut, 'cubic-bezier(.6,0,.9,.4)', 'forwards');
  const tb = target ? bx(ctx, plank(ctx, target)) : g;
  const to = { x: tb.cx, y: tb.cy };
  const op = qpts(cx, cy, (cx + to.x) / 2, Math.min(cy, to.y) - 80, to.x, to.y, 20);
  for (let i = 0; i <= 6; i++) {
    const o = particleShape(ctx, hi, i ? `<circle r="${R1(8 - i)}" fill="#ffd27a" opacity="${R1(0.6 - i * 0.08)}"/>` : '<g><circle r="22" fill="#ffd27a" opacity=".35"/><circle r="11" fill="#fff1c0"/><circle r="5" fill="#fff"/></g>');
    A(ctx, o, [{ transform: `translate(${R1(cx)}px,${R1(cy)}px)`, opacity: 0 }, ...op.map((p) => ({ transform: `translate(${R1(p.x)}px,${R1(p.y)}px)`, opacity: 1 })), { transform: `translate(${R1(to.x)}px,${R1(to.y)}px)`, opacity: 0 }], L.orb, tOrb + i * 30, 'cubic-bezier(.5,0,.7,1)');
  }
  A(ctx, back, [{ opacity: 1 }, { opacity: 0 }], 700, tOrb, 'linear', 'forwards');
  A(ctx, bot, [{ transform: 'none' }, { transform: 'translateY(100%)' }], 500, tOrb + 300, 'ease-in', 'forwards');
  // game: the top bar stays, thin — it ends 2 px above the top row of planks — with the caption of the Legend
  const row = rows[0];
  const thin = row ? clamp((bx(ctx, row).y - 2) / barH, 0, 1) : 0.6;
  A(ctx, top, [{ transform: 'none' }, { transform: `scaleY(${R1(thin * 100) / 100})` }], 300, tOrb + 300, 'ease-in-out', 'forwards');
  const cap = mk(ctx, 'lg-cap', cx, Math.max(9, (barH * thin) / 2), `<span>ЛЕГЕНДА</span> <b>${esc(c.name)}</b>`); cap.style.zIndex = '41';
  if (barH * thin < 14) cap.style.display = 'none';
  A(ctx, cap, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.7)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], 300, tOrb + 400, 'ease-out');
  const tEnd = tOrb + L.orbEnd;
  circRing(ctx, hi, to.x, to.y, 8, 120, '#ffe7a4', 700, tEnd, 4);
  at(ctx, tEnd, () => goldBurst(ctx, hi, to.x, to.y, 30, 20, 110));
  await wait(ctx, tEnd);
  return async () => {
    A(ctx, top, [{ transform: `scaleY(${R1(thin * 100) / 100})` }, { transform: 'translateY(-100%)' }], 320, 0, 'ease-in', 'forwards');
    A(ctx, cap, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
    await wait(ctx, 340);
  };
}


/** The units of damage by the events damage: each is a projectile / a hit into its own cell (as the balls of a Volley). */
export function damageUnits(ctx: FxCtx, effects: readonly GameEvent[]): { ship: string; track: Track; idx: number; v: number }[] {
  const shown: Record<string, number> = {};
  const now = (s: string, t: Track) => { const key = s + t; if (shown[key] == null) shown[key] = shownTrack(ctx, s, t); return key; };
  const units: { ship: string; track: Track; idx: number; v: number }[] = [];
  for (const e of effects) {
    if (e.type !== 'damage') continue;
    for (const [tr, n] of [[e.track, e.amount], ['hull', e.toHull]] as [Track, number][]) {
      const key = now(e.ship, tr);
      for (let j = 0; j < n; j++) { shown[key] -= 1; units.push({ ship: e.ship, track: tr, idx: shown[key], v: Math.max(0, shown[key]) }); }
    }
  }
  return units;
}
/**
 * After a series of hits: «−N» by each track. game (S1): a short mark at the number of the track (trackMark), not the
 * pill of the reference over the plank.
 */
export function damageMarks(ctx: FxCtx, units: readonly { ship: string; track: Track }[], delay: number): void {
  const tot: Record<string, number> = {};
  for (const u of units) { const key = u.ship + '|' + u.track; tot[key] = (tot[key] || 0) + 1; }
  Object.entries(tot).forEach(([key, n], i) => { const [s, t] = key.split('|'); trackMark(ctx, s, t as Track, n, delay + i * 70); });
}


/**
 * The effects of the Legends by the code of the card. The one exception to «the animation by the events and fx, not by
 * the card»: the Legends have no common fx (each is its own op), so each Legend's own effect is chosen by its code; a
 * Legend with no effect here plays legendGeneric (by its events).
 */
export const LG: Record<string, (c: LegendClip, ctx: FxCtx) => Promise<void>> = {};

/**
 * «Армада Компании» (fxArmada of fx3.js, ANIMATIONS.md §3.3; T.armada). The haze of the horizon on the right; a line of
 * six detailed ships of the Company (bigShip, ×0.86) comes in from the right along the middle of the gap, under the
 * planks, rocking, with wakes and bow waves; a broadside ripples down the line at each target — three guns a ship
 * (gunFire ×0.62, ballFly), the balls of the events hit the cells they break, the rest fall short with spouts; a flash,
 * the target shakes, the boards break, «−N»; the smoke of the broadside stays over the sea (short), the fleet sails
 * away to the left into it. game: the targets, the hits and the marks are those of the events of the clip
 * (damageUnits/damageMarks); on a phone four ships.
 */
LG['И-Л'] = async (c, ctx) => {
  ctx = Object.create(ctx) as typeof ctx;
  ctx.canvasParticles = true;
  const K = T.armada, W = ctx.board.clientWidth, g = gapBox(ctx), phone = isPhone(ctx);
  const n = phone ? 4 : 6;
  const k = R1(Math.min(0.86, (W / (n * 1.4)) / 120, (g.h * 0.5) / 78) * 100) / 100;
  const y = g.cy + g.h * 0.08;
  const xs = Array.from({ length: n }, (_, i) => W * (0.117 + (i * 0.76) / (n - 1)));
  const sea = seaTemp(ctx), top = fxSvg(ctx);
  const key = armadaGeometry(ctx).key, stickers = spriteReady(ctx.board,key);
  if(import.meta.env.DEV||import.meta.env.MODE==='e2e')ctx.layer.dataset.armadaRenderer=stickers?'stickers':'legacy';
  const seaHost = sea.parentElement!;
  // the haze of the horizon on the right
  const hazeSprite = stickers ? takeSprite(ctx,'armada-haze',seaHost) : null;
  const haze = hazeSprite ? hazeSprite.root : sv(sea, `<g><ellipse cx="${R1(W - 22)}" cy="${R1(y - 10)}" rx="160" ry="70" fill="#e6eaec" opacity=".7"/><ellipse cx="${R1(W - 62)}" cy="${R1(y + 20)}" rx="120" ry="40" fill="#f2f4f5" opacity=".6"/></g>`);
  if(hazeSprite){haze.classList.add('fx-temp');hazeSprite.root.style.transform=`translate(${R1(W-22)}px,${R1(y-10)}px)`;}
  armadaA(ctx, haze, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], K.haze);
  // the line comes in, each ship with its wake and bow wave, rocking
  const total = K.line + 4 * K.next + 2 * n * K.ship + K.leave + 1000;
  const ships = xs.map((x, i) => {
    const yy = y - (i % 2) * 6 * k;
    const sprite = stickers ? takeSprite(ctx,key,seaHost) : null;
    const g0 = sprite ? sprite.root : sv(sea, `<g><g class="lg-pitch"><path d="M${R1(40 * k)} 2 C${R1(70 * k)} 4 ${R1(110 * k)} 10 ${R1(160 * k)} 6 M${R1(40 * k)} 6 C${R1(70 * k)} 10 ${R1(110 * k)} 18 ${R1(160 * k)} 16" fill="none" stroke="#eef6f8" stroke-width="2" stroke-linecap="round" opacity=".75"/><path d="M${R1(-46 * k)} 1 q-8 2 -12 6 M${R1(-46 * k)} 4 q-6 3 -9 8" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><g class="lg-recoil">${bigShip('company', 0, 0, k)}</g></g></g>`);
    if(sprite)g0.classList.add('fx-temp');
    armadaA(ctx, g0, [{ transform: `translate(${R1(W + 100 + i * 90)}px,${R1(yy)}px)`, opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: `translate(${R1(x)}px,${R1(yy)}px)`, opacity: 1 }], K.enter, i * K.enterStep, 'cubic-bezier(.2,.6,.3,1)');
    if (ctx.rich) { const p = g0.querySelector('.lg-pitch')!; const m = Math.ceil(total / 1600); armadaA(ctx, p, Array.from({ length: m * 2 + 1 }, (_, j) => ({ transform: `rotate(${j % 2 ? 1.6 : -1.2}deg)` })), m * 1600, i * 310, 'ease-in-out', 'none'); }
    return { g: g0, x, y: yy, sprite };
  });
  await wait(ctx, K.line);
  // the broadside ripples down the line at each target; the balls of the events hit their cells
  const units = damageUnits(ctx, c.effects || []);
  const targets = [...new Set(units.map((u) => u.ship))];
  const smoke = ctx.rich && !perfOff('particles') ? scar(stickers&&!filters(ctx)?armadaSmokeHost(ctx,seaScars(ctx)??ctx.layer):fxSvg(ctx, seaScars(ctx) ?? ctx.layer), 'short') : null;
  let fired = 0;
  for (const tgt of targets) {
    const tb = bx(ctx, plank(ctx, tgt)), edge = facingY(ctx, tgt), dir = isTop(ctx, tgt) ? -1 : 1; // 1 — the target is below
    const hits = units.filter((u) => u.ship === tgt), shots = n * 3;
    // the hits go to shots spread along the line; the other shots fall short into the water
    const hitAt = new Map(hits.map((u, j) => [Math.round(((j + 0.5) * shots) / hits.length - 0.5), u]));
    for (let j = 0; j < n; j++) {
      const sp = ships[j], t0 = j * K.ship;
      // A7: the ship heels from the recoil (away from the target), her side lit by the flashes, and a ring of smoke rolls off the
      // water (the lean of the prototype: bottom-row target → −1)
      at(ctx, t0, () => {
        const rc = sp.g.querySelector('.lg-recoil'), rd = -dir;
        if(sp.sprite)armadaRecoil(ctx,sp.sprite,rd,K.recoil);
        else if (rc) A(ctx, rc, [{ transform: 'rotate(0deg) translate(0,0)', filter: 'brightness(1)' }, { transform: `rotate(${rd * 2.6}deg) translate(${-rd * 3}px,0)`, filter: 'brightness(1.45) saturate(1.2)', offset: 0.12 }, { transform: `rotate(${-rd * 0.8}deg) translate(0,0)`, filter: 'brightness(1)', offset: 0.55 }, { transform: 'rotate(0deg) translate(0,0)', filter: 'brightness(1)' }], K.recoil, 0, 'ease-out', 'none');
        circRing(ctx, sea, sp.x, sp.y + 2, 20 * (k / 0.86), 70 * (k / 0.86), '#eef3f4', K.ring, 60, 1.6);
      });
      for (let q = 0; q < 3; q++) {
        const shot = j * 3 + q, u = hitAt.get(shot), px = sp.x + (-26 + q * 22) * k, gy = sp.y - dir * 16 * k, t = t0 + q * K.gun;
        const p = u ? fxPoint(ctx, u.ship, u.track, u.idx) : { x: tb.x + rnd(30, tb.w - 30) + rnd(-30, 30), y: edge - dir * rnd(14, 34) };
        const sm = q === 0 && fired++ < 8 ? smoke : null;
        // each shot is drawn when its time comes (a delayed ball would wait at the muzzle, seen)
        at(ctx, t, () => {
          gunFire(ctx, top, sm, px, gy, Math.atan2(p.y - gy, p.x - px), 0.62, 0, { grains: 5, puffs: 5, wads: 1, life: 4800, smokeJet: stickers ? armadaSmoke : undefined });
          if (q === 1) boom(ctx, 2.4, 220);
          (stickers ? armadaBall : ballFly)(ctx, top, { x: px, y: gy }, p, K.fly, 0, 12);
          at(ctx, K.fly, () => {
            if (u) hitBlast(ctx, top, p.x, p.y, 0.55, 0, 520, true);
            else if (shot % 3 === 0) missSplash(ctx, top, p.x, p.y, 0.8);
            else waterColumn(ctx, top, p.x, p.y, 30, 0, 1200);
          });
        });
      }
    }
    await wait(ctx, n * K.ship + 2 * K.gun + K.fly + K.land);
    // the flash, the target shakes, the boards break
    flashBoard(ctx, '#fff6d8', 0.22, 300);
    shake(ctx, plank(ctx, tgt), 0, 7, 520);
    hits.forEach((u) => { const p = fxPoint(ctx, u.ship, u.track, u.idx); if (u.track === 'sails') sparksSvg(ctx, top, p.x, p.y, 10); else splintersSvg(ctx, top, p.x, p.y, 5); setTrack(ctx, u.ship, u.track, u.v, '#c0392b'); });
    damageMarks(ctx, hits, 80);
    await wait(ctx, K.next);
  }
  // the smoke of the broadside stays over the sea and drifts; the fleet sails away into it
  const host = seaScars(ctx);
  if (host && ctx.canvasParticles && !perfOff('particles')) {
    const group=scar(armadaSmokeHost(ctx,host),'short');
    for(let i=0;i<(phone?7:14);i++){
      const cx=R1(W*(.1+(i*.85)/(phone?6:13))),cy=R1(y+rnd(-26,26)),rx=R1(rnd(50,80)*Math.max(.6,k)),ry=R1(rnd(20,32));
      const fog=particleShape(ctx,group,'<circle r="32" fill="url(#lgArmS)"/>','fog');
      A(ctx,fog,[{transform:`translate(${cx}px,${cy}px) scale(${rx/32},${ry/32})`,opacity:1},{transform:`translate(${cx+(filters(ctx)?60:0)}px,${cy}px) scale(${rx/32},${ry/32})`,opacity:1}],22000,0,'linear');
    }
    armadaA(ctx,group,[{opacity:0},{opacity:1}],K.smoke,0,'ease-out','none');
  } else if (host && stickers && !filters(ctx) && !perfOff('particles')) {
    const group=scar(armadaSmokeHost(ctx,host),'short');
    for(let i=0;i<(phone?7:14);i++){
      const cx=R1(W*(.1+(i*.85)/(phone?6:13))),cy=R1(y+rnd(-26,26)),rx=R1(rnd(50,80)*Math.max(.6,k)),ry=R1(rnd(20,32));
      const fog=takeSprite(ctx,'armada-fog',group);fog.root.dataset.perfParticle='';fog.root.style.transform=`translate(${cx}px,${cy}px) scale(${rx},${ry})`;
    }
    armadaA(ctx,group,[{opacity:0},{opacity:1}],K.smoke,0,'ease-out','none');
  } else if(host && !perfOff('particles')) {
    const sm = scar(fxSvg(ctx, host), 'short'), drift = filters(ctx);
    sm.innerHTML += `<defs><radialGradient id="lgArmS"><stop offset="0" stop-color="#eeebe4" stop-opacity=".8"/><stop offset="1" stop-color="#eeebe4" stop-opacity="0"/></radialGradient></defs>${Array.from({ length: phone ? 7 : 14 }, (_, i) => { const cx = R1(W * (0.1 + (i * 0.85) / (phone ? 6 : 13))); return `<ellipse cx="${cx}" cy="${R1(y + rnd(-26, 26))}" rx="${R1(rnd(50, 80) * Math.max(0.6, k))}" ry="${R1(rnd(20, 32))}" fill="url(#lgArmS)">${drift ? `<animate attributeName="cx" values="${cx};${R1(cx + 60)}" dur="22s" fill="freeze"/>` : ''}</ellipse>`; }).join('')}`;
    A(ctx, sm, [{ opacity: 0 }, { opacity: 1 }], K.smoke, 0, 'ease-out', 'none');
  }
  ships.forEach((s, i) => armadaA(ctx, s.g, [{ transform: `translate(${R1(s.x)}px,${R1(s.y)}px)`, opacity: 1 }, { transform: `translate(${R1(s.x - 1000)}px,${R1(s.y)}px)`, opacity: 0 }], K.leave, i * K.leaveStep, 'cubic-bezier(.5,0,.8,.6)'));
  await wait(ctx, K.end);
};


/** A piece flying off a plank: a cell of a track (its A5 icon) in the layer. */
function cellFly(ctx: FxCtx, icon: string, p: Pt): HTMLElement {
  const el = mk(ctx, 'lg-fly', 0, 0, icon);
  el.style.transform = `translate(${R1(p.x)}px,${R1(p.y)}px)`;
  return el;
}

/**
 * «Кракен» (fxKraken of fx3.js, ANIMATIONS.md §3.2; T.kraken). The sea around the target turns dark, the shadow of the
 * beast glides under it, bubbles boil; the eye opens in the water by it, looks, blinks; six arms burst out of the
 * water with spouts — three around it and three at its edge in 30/55/78 % of its width; those three fall across the
 * plank and squeeze it in turn, and right under each the wood splits (crackArt, a medium trace on the plank), with the
 * sucker rings along the cracks (short); the boards of the Hull break off and the sailors are dragged into the sea by
 * the side arms — as many as the events of the clip say; the ink cloud stays on the sea (short), the arms slide down.
 * game: the target may be in the top row — then the arms hang from its lower edge (the picture mirrored).
 */
LG['Г-Л'] = async (c, ctx) => {
  const K = T.kraken, tgt = c.target!, tp = plank(ctx, tgt), b = bx(ctx, tp), W = ctx.board.clientWidth, uid = ++LG_UID;
  const v = isTop(ctx, tgt) ? -1 : 1; // 1 — the arms grow up from the top edge (a ship of the bottom row)
  const edge = v > 0 ? b.y : b.b;     // the edge of the target to the sea
  const rich = filters(ctx);
  // 1. the sea around the target turns dark and green; the shadow of the beast glides under it; bubbles boil
  const sea = seaScars(ctx), deep = seaTemp(ctx), top = fxSvg(ctx);
  sv(deep, `<defs><radialGradient id="lgKrDeep${uid}"><stop offset="0" stop-color="#05140f" stop-opacity=".85"/><stop offset=".6" stop-color="#0c2a22" stop-opacity=".55"/><stop offset="1" stop-color="#0c2a22" stop-opacity="0"/></radialGradient>${rich ? `<filter id="lgKrBlur${uid}"><feGaussianBlur stdDeviation="8"/></filter>` : ''}</defs>`);
  const dark = sv(deep, `<ellipse cx="${R1(b.cx)}" cy="${R1(edge - v * 30)}" rx="${R1(Math.min(330, b.w * 0.75))}" ry="110" fill="url(#lgKrDeep${uid})"/>`);
  A(ctx, dark, [{ opacity: 0 }, { opacity: 1 }], K.deep);
  const shadow = sv(deep, `<g ${rich ? `filter="url(#lgKrBlur${uid})"` : ''} opacity=".75"><ellipse cx="0" cy="0" rx="130" ry="42" fill="#020806"/>${[-1, 1].map((s) => [0, 1, 2].map((i) => `<path d="M${s * 90} ${-10 + i * 12} q${s * 60} ${-20 + i * 20} ${s * 120} ${10 + i * 6}" stroke="#020806" stroke-width="${14 - i * 3}" fill="none" stroke-linecap="round"/>`).join('')).join('')}</g>`);
  const ks = clamp(b.w / 480, 0.5, 1);
  A(ctx, shadow, [{ transform: `translate(${R1(b.cx - 520 * ks)}px,${R1(edge - v * 40)}px) scale(${R1(0.8 * ks * 100) / 100})` }, { transform: `translate(${R1(b.cx)}px,${R1(edge - v * 30)}px) scale(${R1(1.1 * ks * 100) / 100})` }], K.glide, 0, 'cubic-bezier(.3,.1,.3,1)');
  for (let i = 0, n = room(ctx, 46); i < n; i++) {
    const x = b.cx + rnd(-0.55, 0.55) * b.w, y = edge - v * rnd(4, 80);
    const o = sv(deep, `<circle r="${R1(rnd(1.4, 4.6))}" fill="rgba(210,240,236,.15)" stroke="#d9f2ec" stroke-width=".9"/>`);
    A(ctx, o, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(.4)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${R1(x + rnd(-6, 6))}px,${R1(y - rnd(14, 34))}px) scale(1.1)`, opacity: 0 }], rnd(700, 1300), rnd(400, 2600));
  }
  await wait(ctx, K.eyeAt);
  // 2. the eye opens in the water by the target, looks, blinks
  const eye = sv(deep, '<g><ellipse rx="40" ry="20" fill="#06100c" opacity=".8"/><ellipse rx="34" ry="16" fill="#0a1a14"/><ellipse rx="26" ry="11" fill="#f2c94c" stroke="#3a2a0c" stroke-width="1.4"/><ellipse rx="3.4" ry="10" fill="#060606"/><circle cx="-8" cy="-4" r="2.4" fill="#fff" opacity=".8"/></g>');
  const ex = b.cx + 40 * ks, ey = edge - v * 56, et = (sy: number) => `translate(${R1(ex)}px,${R1(ey)}px) scale(${ks},${sy * ks})`;
  A(ctx, eye, [{ transform: et(0) }, { transform: et(1), offset: 0.2 }, { transform: et(1), offset: 0.45 }, { transform: et(0.08), offset: 0.5 }, { transform: et(1), offset: 0.56 }, { transform: et(1), offset: 0.92 }, { transform: et(0) }], K.eye);
  await wait(ctx, K.armsAt);
  // 3. the arms burst out of the water: three around the target, three right at its edge — those will grip
  const right = b.cx > W / 2; // the side arm goes into the gap between the columns
  const flip = (k: number) => `scale(1,${R1(k * v * 1000) / 1000})`;
  const spots: [number, number, boolean, number, number][] = [[b.x + 40, edge + v * 8, false, 1.3, -14], [b.r - 36, edge + v * 8, true, 1.3, 14], [right ? b.x - 18 : b.r + 18, b.cy + v * b.h * 0.05, !right, 1.15, right ? -26 : 26]];
  const arms = spots.map(([x, y, fl, k, rot], i) => {
    waterColumn(ctx, top, x, y, 44, i * 160);
    const g = sv(top, `<g><g transform="scale(${fl ? -1 : 1} 1)">${TENT(`a${uid}${i}`, k * ks, 1.5)}</g></g>`);
    const r = rot * v;
    A(ctx, g, [{ transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${r}deg) ${flip(0)}` }, { transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${r}deg) ${flip(1.15)}`, offset: 0.6 }, { transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${r}deg) ${flip(1)}` }], K.rise, i * K.riseStep, 'cubic-bezier(.2,1.3,.5,1)');
    return { g, x, y, r };
  });
  const gripX = [0.3, 0.55, 0.78].map((f) => b.w * f); // where the arms grip — and where the plank splits
  const grips = gripX.map((x0, i) => {
    const x = b.x + x0, y = edge + v * 3;
    waterColumn(ctx, top, x, y - v * 2, 50, K.gripAt + i * K.gripStep);
    const g = sv(top, `<g><g class="gin">${TENT(`g${uid}${i}`, 0.92, 1.35 * Math.max(0.6, ks))}</g></g>`);
    A(ctx, g, [{ transform: `translate(${R1(x)}px,${R1(y)}px) rotate(0deg) ${flip(0)}` }, { transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${i % 2 ? 6 : -6}deg) ${flip(1.15)}`, offset: 0.6 }, { transform: `translate(${R1(x)}px,${R1(y)}px) rotate(0deg) ${flip(1)}` }], K.rise, K.gripAt + i * K.gripStep, 'cubic-bezier(.2,1.3,.5,1)');
    g.dataset.grip = String(i);
    return { g, x, y, s: i % 2 ? 1 : -1 };
  });
  await wait(ctx, K.sway);
  // 4. the three arms fall over the plank and lie across it (the length — the height of the plank); each squeezes in
  //    turn — and right under it the wood splits
  const kY = R1(((b.h - 6) / 146 / 0.92) * 100) / 100;
  grips.forEach((a, i) => A(ctx, a.g, [{ transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(0deg) ${flip(1)}` }, { transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 95}deg) ${flip(0.9)}`, offset: 0.55 }, { transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 180}deg) ${flip(kY)}` }], K.fall, i * K.fallStep, 'cubic-bezier(.6,0,.9,.5)'));
  await wait(ctx, K.land);
  grips.forEach((a) => { splintersSvg(ctx, top, a.x, edge + v * 6, 5); sparksSvg(ctx, top, a.x, edge + v * 4, 4, 0, ['#e9d29a', '#a8703a', '#fff']); });
  const host = plankScars(ctx, tgt);
  const local = (cls: string, life: 'short' | 'medium', blend = '') => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', String(R1(b.w))); s.setAttribute('height', String(R1(b.h))); s.setAttribute('class', cls);
    s.setAttribute('style', `position:absolute;left:0;top:0;overflow:visible;pointer-events:none${blend}`);
    (host || tp).appendChild(s);
    return scar(s, life, tgt);
  };
  const cracks = local('fx-cracks', 'medium'), marks = local('fx-suckers', 'short', ';mix-blend-mode:multiply');
  const y0 = v > 0 ? 0 : b.h;
  for (let k = 0; k < 3; k++) {
    const a = grips[k], x0 = gripX[k];
    const g = sv(cracks, crackArt(`k${uid}${k}`, x0, y0, b.h * rnd(0.82, 0.98), (v * Math.PI) / 2 + rnd(-0.14, 0.14), rnd(2.8, 3.6)));
    A(ctx, g.querySelector('.rv')!, [{ transform: `translate(${R1(x0)}px,${R1(y0)}px) scale(0)` }, { transform: `translate(${R1(x0)}px,${R1(y0)}px) scale(1)` }], K.crack, 60, 'cubic-bezier(.2,.9,.3,1)');
    A(ctx, a.g.querySelector('.gin')!, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.22,.96)', offset: 0.4 }, { transform: 'scale(1.08,1)' }], K.squeeze, 0, 'ease-in-out');
    A(ctx, tp, [{ scale: '1 1' }, { scale: '.97 .92', offset: 0.4 }, { scale: '1 1' }], K.squeeze, 0, 'ease-in-out', 'none');
    boom(ctx, 4, 300); flashBoard(ctx, '#0b1f18', 0.16, 300);
    splintersSvg(ctx, top, a.x, b.cy, 4);
    await wait(ctx, K.squeezeStep);
  }
  // the sucker rings stay along each crack where the arm lay
  sv(marks, `<g>${gripX.map((x0) => Array.from({ length: Math.max(0, Math.floor((b.h - 14) / 11)) }, (_, k) => `<ellipse cx="${R1(x0 + (k % 2 ? 6 : -6))}" cy="${R1(v > 0 ? 10 + k * 11 : b.h - 10 - k * 11)}" rx="${R1(Math.max(1.2, 4.2 - k * 0.3))}" ry="${R1(Math.max(1, 3.6 - k * 0.26))}" fill="rgba(120,40,56,.14)" stroke="#6e2a34" stroke-width="1" opacity=".6"/>`).join('')).join('')}</g>`);
  // 5. the boards of the Hull break off, the sailors are dragged into the sea — by the events of the clip
  const units = damageUnits(ctx, c.effects || []);
  let t = 0, crew = 0;
  for (const u of units) {
    const p = fxPoint(ctx, u.ship, u.track, u.idx);
    if (u.track === 'crew') {
      const a = arms[crew++ % arms.length], fl = cellFly(ctx, CELLS.CREW.replace('width="14" height="17"', 'width="20" height="24"'), p);
      A(ctx, fl, [{ opacity: 1, transform: `translate(${R1(p.x - 10)}px,${R1(p.y - 12)}px) rotate(0deg)` }, { opacity: 1, transform: `translate(${R1(a.x)}px,${R1(a.y - v * 120)}px) rotate(-200deg)`, offset: 0.6 }, { opacity: 0, transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(-360deg) scale(.5)` }], K.drag, t, 'cubic-bezier(.4,0,.6,1)');
      waterColumn(ctx, top, a.x, a.y, 36, t + K.drag);
      at(ctx, t, () => setTrack(ctx, u.ship, u.track, u.v, '#7a1f12'));
      t += K.dragStep;
    } else {
      const fl = cellFly(ctx, u.track === 'hull' ? CELLS.HULL : CELLS.SAIL, p);
      splintersSvg(ctx, top, p.x, p.y, 6, t);
      A(ctx, fl, [{ opacity: 1, transform: `translate(${R1(p.x - 6)}px,${R1(p.y - 8)}px) rotate(0deg)` }, { opacity: 1, transform: `translate(${R1(p.x + rnd(-60, 60))}px,${R1(p.y - 70)}px) rotate(${R1(rnd(-300, 300))}deg)`, offset: 0.45 }, { opacity: 0, transform: `translate(${R1(p.x + rnd(-90, 90))}px,${R1(edge - v * 20)}px) rotate(${R1(rnd(-600, 600))}deg)` }], K.board, t, 'cubic-bezier(.3,.1,.7,1)');
      at(ctx, t, () => setTrack(ctx, u.ship, u.track, u.v, '#7a1f12'));
      t += K.boardStep;
    }
  }
  damageMarks(ctx, units, t + 80);
  const soulsEnd = c.souls ? soulsFly(ctx, tgt, c.souls, t + 200, true) : 0;
  await wait(ctx, t + K.after);
  // 6. the beast lets go: an ink cloud bursts and stays on the sea (short), the arms slide down into it
  const ink = sea ? scar(fxSvg(ctx, sea), 'short') : fxSvg(ctx);
  const ty = edge - v * 28;
  ink.innerHTML += `${rich ? `<defs><filter id="lgInk${uid}" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="26"/><feGaussianBlur stdDeviation="2"/></filter></defs>` : ''}<g class="lg-ink" ${rich ? `filter="url(#lgInk${uid})"` : ''}>${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${R1(b.cx + (i - 3) * 62 * ks)}" cy="${R1(ty + (i % 2) * 14 * v)}" rx="${R1(rnd(46, 70) * ks)}" ry="${R1(rnd(18, 28))}" fill="#08100e" opacity=".7"/>`).join('')}</g>`;
  const blot = ink.querySelector('.lg-ink')!;
  (blot as SVGElement).style.transformOrigin = `${R1(b.cx)}px ${R1(ty)}px`;
  A(ctx, blot, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], K.ink, 0, 'cubic-bezier(.2,.8,.3,1)');
  arms.forEach((a, i) => {
    A(ctx, a.g, [{ opacity: 1, transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.r}deg) ${flip(1)}` }, { opacity: 0, transform: `translate(${R1(a.x)}px,${R1(a.y + v * 30)}px) rotate(${a.r}deg) ${flip(0)}` }], K.sink, i * K.sinkStep, 'ease-in');
    waterColumn(ctx, top, a.x, a.y, 28, 500 + i * K.sinkStep);
  });
  grips.forEach((a, i) => {
    A(ctx, a.g, [{ transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 180}deg) ${flip(kY)}` }, { transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 20}deg) ${flip(0.9)}`, offset: 0.5 }, { transform: `translate(${R1(a.x)}px,${R1(a.y + v * 20)}px) rotate(0deg) ${flip(0)}`, opacity: 0.6 }], K.release, 150 + i * 100, 'ease-in-out');
    waterColumn(ctx, top, a.x, a.y, 32, 700 + i * 100);
  });
  A(ctx, eye, [{ opacity: 1 }, { opacity: 0 }], 400, 0, 'ease-in', 'forwards');
  if (sea) { deep.classList.remove('fx-temp'); scar(deep, 'short'); } // the dark of the deep stays a while and dissolves
  await wait(ctx, Math.max(K.end, soulsEnd - (t + K.after) + 100));
};


/** The detailed ship of A5 of a code (SHIP_KIND of fx3.js): the target of «Корабль в бутылке» sits in the bottle as itself. */
const bigKind = (code: string): BigShipKind => (code === 'Ж' ? 'pearl' : code === 'М' ? 'revenge' : code === 'И' ? 'endeavour' : code === 'Г' ? 'dutch' : 'company');

/**
 * «Корабль в бутылке» (fxBottle of fx3.js, ANIMATIONS.md §3.4; T.bottle). «Корпус N — можно»; the target glows green,
 * sparks orbit it; a bottle on its side (bottleArt, the neck to the right) draws itself in glass in the gap, fills with
 * light and its painted sea, glints; a vortex — the plank spirals and shrinks into the mouth with a funnel of sparks;
 * a tiny ship rocks inside; the cork flies spinning from the medallion of the owner and pops into the neck — «чпок!»,
 * a ring, a flash; the bottle lifts and drops onto the sea (spouts, rings) and stays afloat with the ship inside (a long
 * trace); the plank comes back grey (the table drawn with the events of the clip) and the stamp «Затонул» falls.
 * «Джонс свободен» and the repair of the Crew of «Голландец» — events of the same Legend — come after.
 */
LG['М-Л'] = async (c, ctx) => {
  const K = T.bottle, tgt = c.target!, tp = plank(ctx, tgt), b = bx(ctx, tp), W = ctx.board.clientWidth, g = gapBox(ctx);
  const events = (c as LegendClip & { events?: GameEvent[] }).events ?? c.effects ?? [];
  const top = fxSvg(ctx), BS = R1(Math.min(0.82, (W - 24) / 236, g.h / 110) * 100) / 100;
  const bx0 = clamp(b.cx - 10, 100 * BS + 8, W - 130 * BS - 8), by0 = g.cy;
  const mouth = { x: bx0 + 112 * BS, y: by0 };
  ruleTag(ctx, W / 2, g.cy - 60 * BS, `Корпус ${shownTrack(ctx, tgt, 'hull')} — можно`, 0, 'plus', 1200);
  // 1. the target glows; sparks orbit it
  A(ctx, tp, [{ boxShadow: '0 0 0 0 rgba(127,240,176,0)' }, { boxShadow: '0 0 0 3px rgba(127,240,176,.9), 0 0 30px rgba(127,240,176,.7)', offset: 0.5 }, { boxShadow: '0 0 0 2px rgba(127,240,176,.6), 0 0 18px rgba(127,240,176,.5)' }], K.glow, 0, 'ease-out', 'none');
  for (let i = 0, m = room(ctx, 24); i < m; i++) {
    const s = sv(top, `<path d="M0 -3 L.8 -.8 L3 0 L.8 .8 L0 3 L-.8 .8 L-3 0 L-.8 -.8 Z" fill="${i % 2 ? '#bfffd8' : '#ffe7a4'}"/>`);
    A(ctx, s, Array.from({ length: 13 }, (_, k) => { const a = (k / 12 + i / 24) * Math.PI * 2; return { transform: `translate(${R1(b.cx + Math.cos(a) * (b.w * 0.58))}px,${R1(b.cy + Math.sin(a) * (b.h * 0.7))}px)`, opacity: k === 12 ? 0 : 1 }; }), K.orbit, i * K.orbitStep, 'linear');
  }
  // 2. the bottle draws itself in glass, then fills with light, the painted sea, the glints
  const bot = sv(top, `<g transform="translate(${R1(bx0)} ${R1(by0)}) scale(${BS})">${bottleArt()}</g>`);
  const glass = bot.querySelector<SVGPathElement>('.glass')!, L = R1(glass.getTotalLength());
  glass.style.strokeDasharray = String(L);
  A(ctx, glass, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], K.glass, K.glassAt, 'ease-in-out');
  [bot.querySelector('.gfill'), bot.querySelector('.hl'), ...bot.querySelectorAll('g[clip-path], ellipse')].forEach((e) => e && A(ctx, e, [{ opacity: 0 }, { opacity: 1 }], K.fill, K.fillAt));
  for (let i = 0, m = room(ctx, 10); i < m; i++) {
    const gl = sv(top, '<path d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z" fill="#fff"/>'), x = bx0 + rnd(-90, 100) * BS, y = by0 + rnd(-44, 44) * BS;
    A(ctx, gl, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(0)` }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1.2) rotate(45deg)`, offset: 0.5 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(0) rotate(90deg)` }], K.glint, K.glintAt + i * K.glintStep);
  }
  await wait(ctx, K.vortexAt);
  // 3. the vortex: the plank spirals and shrinks into the mouth; a funnel of sparks goes with it
  const dx = mouth.x - b.cx, dy = mouth.y - b.cy;
  const sucked = A(ctx, tp, Array.from({ length: 21 }, (_, k) => { const t = k / 20, sw = (1 - t) * 60 * Math.sin(t * Math.PI * 3); return { transform: `translate(${R1(dx * t + sw)}px,${R1(dy * t - sw * 0.4)}px) rotate(${R1(t * 540)}deg) scale(${R1((1 - 0.97 * Math.pow(t, 0.8)) * 1000) / 1000})`, opacity: k === 20 ? 0 : 1 }; }), K.vortex, 0, 'cubic-bezier(.5,0,.6,1)', 'forwards');
  for (let i = 0, m = room(ctx, 46); i < m; i++) {
    const s = sv(top, `<circle r="${R1(rnd(1.2, 2.8))}" fill="${i % 2 ? '#bfffd8' : '#ffe7a4'}"/>`), r0 = rnd(80, 210), a0 = rnd(0, 6.28);
    A(ctx, s, Array.from({ length: 11 }, (_, k) => { const t = k / 10, a = a0 + t * 9, r = r0 * (1 - t); return { transform: `translate(${R1(mouth.x + 40 * (1 - t) + Math.cos(a) * r)}px,${R1(mouth.y + Math.sin(a) * r * 0.6)}px)`, opacity: t < 0.9 ? 1 : 0 }; }), 1300, rnd(0, 400), 'ease-in');
  }
  await wait(ctx, K.miniAt);
  // 4. inside: a tiny ship rocks on the painted waves
  const mini = sv(top, `<g><g class="lg-rock">${bigShip(bigKind(tgt), 0, 0, 0.62, false, `data-kind="${bigKind(tgt)}"`)}</g></g>`);
  A(ctx, mini, [{ transform: `translate(${R1(mouth.x)}px,${R1(mouth.y)}px) scale(.05)`, opacity: 0 }, { transform: `translate(${R1(bx0 - 24 * BS)}px,${R1(by0 + 27 * BS)}px) scale(${BS})`, opacity: 1 }], K.mini, 0, 'cubic-bezier(.3,1.2,.6,1)');
  if (ctx.rich) A(ctx, mini.querySelector('.lg-rock')!, Array.from({ length: 9 }, (_, j) => ({ transform: `rotate(${j % 2 ? 3 : -3}deg)` })), 4 * 1400, 0, 'ease-in-out', 'none');
  goldBurst(ctx, top, mouth.x, mouth.y, 24, 10, 70); circRing(ctx, top, mouth.x, mouth.y, 4, 40, '#bfffd8', 500, 0, 2);
  await wait(ctx, K.corkAt);
  // 5. the cork flies from the medallion of the owner, spinning, and pops into the mouth
  const rb = bx(ctx, legendMedal(ctx, c.seat)), cx = bx0 + 118 * BS;
  const cork = sv(top, CORK);
  A(ctx, cork, qpts(rb.cx, rb.cy, (rb.cx + cx) / 2 + 60, Math.min(rb.cy, by0) - 150, cx + 14, by0, 20).map((p, k) => ({ transform: `translate(${R1(p.x)}px,${R1(p.y)}px) rotate(${k * 36}deg) scale(${R1(BS * (0.6 + k / 50) * 100) / 100})` })), K.cork, 0, 'cubic-bezier(.4,0,.7,1)');
  await wait(ctx, K.cork);
  A(ctx, cork, [{ transform: `translate(${R1(cx + 14)}px,${R1(by0)}px) scale(${BS})` }, { transform: `translate(${R1(cx - 3)}px,${R1(by0)}px) scale(${R1(BS * 1.08 * 100) / 100},${R1(BS * 0.9 * 100) / 100})`, offset: 0.5 }, { transform: `translate(${R1(cx)}px,${R1(by0)}px) scale(${BS})` }], K.pop, 0, 'cubic-bezier(.6,0,.4,1)');
  await wait(ctx, K.popAt);
  const pop = mk(ctx, 'lg-pop', cx + 30, by0 - 54, 'чпок!');
  A(ctx, pop, [{ transform: 'scale(.3) rotate(-14deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(-8deg)', opacity: 1, offset: 0.25 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: 0.8 }, { transform: 'translateY(-14px) scale(1) rotate(-8deg)', opacity: 0 }], K.word);
  circRing(ctx, top, cx, by0, 6, 80, '#fff6d8', 500, 0, 4); goldBurst(ctx, top, cx, by0, 30, 10, 90); flashBoard(ctx, '#ffffff', 0.18, 260);
  await wait(ctx, K.dropAt);
  // 6. the bottle lifts a little and drops onto the sea with a splash
  const all = sv(top, '<g/>');
  [bot, mini, cork].forEach((e) => all.appendChild(e));
  (all as SVGElement).style.transformOrigin = `${R1(bx0)}px ${R1(by0)}px`;
  A(ctx, all, [{ transform: 'translate(0,0) rotate(0) scale(1)' }, { transform: 'translate(0,-34px) rotate(-6deg) scale(1.04)', offset: 0.45 }, { transform: 'translate(0,6px) rotate(3deg) scale(.72)' }], K.drop, 0, 'cubic-bezier(.4,0,.6,1)');
  await wait(ctx, K.splashAt);
  waterColumn(ctx, top, bx0 - 50 * BS, by0 + 30 * BS, 40); waterColumn(ctx, top, bx0 + 50 * BS, by0 + 30 * BS, 34);
  for (let i = 0; i < 3; i++) circRing(ctx, top, bx0, by0 + 24 * BS, 10, (120 - i * 26) * BS, '#eef6f8', 1000, i * 150, 2);
  // 7. the plank comes back sunk (the table drawn with the events of the clip), the stamp falls; the bottle stays
  //    afloat with the ship inside — a long trace of the sea
  ctx.renderWith(events.filter((e) => e.type === 'legendPlayed' || e.type === 'powderSpent' || e.type === 'sunk'));
  sucked.cancel();
  A(ctx, tp, [{ opacity: 0 }, { opacity: 1 }], K.back, 0, 'ease-out', 'none');
  const st = mk(ctx, 'stamp-fx sunk', b.cx, b.cy, 'Затонул');
  A(ctx, st, [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-7deg) scale(2.8)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(.94)', offset: 0.7 }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(1)' }], K.stamp, K.back * 0.5, 'cubic-bezier(.5,0,.8,.4)');
  const host = seaScars(ctx);
  if (host) {
    const keep = scar(fxSvg(ctx, host), 'long', tgt), rock = filters(ctx), k2 = R1(BS * 0.72 * 100) / 100;
    keep.innerHTML += `<g transform="translate(${R1(bx0)} ${R1(by0 + 4)})"><ellipse cx="0" cy="${R1(40 * k2)}" rx="${R1(110 * k2)}" ry="7" fill="#0b2a36" opacity=".28"/><g>${rock ? '<animateTransform attributeName="transform" type="rotate" values="-3;3;-3" dur="3.6s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 3;0 0" dur="2.6s" additive="sum" repeatCount="indefinite"/>' : ''}<g transform="scale(${k2})">${bottleArt({ ship: true, cork: true, kind: bigKind(tgt) })}</g></g><ellipse cx="0" cy="${R1(40 * k2)}" rx="${R1(120 * k2)}" ry="6" fill="none" stroke="#e6f2f4" stroke-width="1.4" opacity=".7">${rock ? `<animate attributeName="rx" values="${R1(110 * k2)};${R1(140 * k2)};${R1(110 * k2)}" dur="2.6s" repeatCount="indefinite"/>` : ''}</ellipse></g>`;
    A(ctx, keep, [{ opacity: 0 }, { opacity: 1 }], 300, 0, 'ease-out', 'none');
  }
  A(ctx, all, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-out', 'forwards');
  let tEnd = K.end;
  // «Джонс свободен» and the repair of the Crew of «Голландец» — events of the same Legend
  const jf = (c.effects || []).find((e) => e.type === 'jonesFree');
  const rs = (c.effects || []).filter((e): e is Extract<GameEvent, { type: 'restored' }> => e.type === 'restored');
  if (jf && jf.type === 'jonesFree') {
    const jb = bx(ctx, plank(ctx, jf.ship));
    // game (S1): the explanation is in the middle of the table, not over the plank
    ruleTag(ctx, jb.cx, g.cy, 'Джонс свободен', 600, 'gold', 1700);
    circRing(ctx, top, jb.cx, jb.cy, 10, Math.max(jb.w, jb.h) * 0.6, '#e0b44c', 800, 600, 3);
    tEnd = Math.max(tEnd, 2300);
  }
  rs.forEach((e) => {
    const now = shownTrack(ctx, e.ship, e.track);
    for (let j = 0; j < e.amount; j++) {
      const t0 = 800 + j * 180, p = fxPoint(ctx, e.ship, e.track, now + j);
      at(ctx, t0, () => setTrack(ctx, e.ship, e.track, now + j + 1, '#2f7d4a'));
      circRing(ctx, top, p.x, p.y, 4, 22, '#2f7d4a', 500, t0, 2); at(ctx, t0, () => goldBurst(ctx, top, p.x, p.y, 6, 6, 18));
    }
    trackMark(ctx, e.ship, e.track, e.amount, 900 + e.amount * 180, true); // game (S1): a mark, not a pill
    tEnd = Math.max(tEnd, 1500 + e.amount * 180);
  });
  await wait(ctx, tEnd);
};


/** The common effect of a Legend with no effect of its own: hits on the tracks by the events. */
export async function legendGeneric(c: LegendClip, ctx: FxCtx): Promise<void> {
  const units = damageUnits(ctx, c.effects || []);
  units.forEach((u, i) => { const p = fxPoint(ctx, u.ship, u.track, u.idx), t0 = i * 120; at(ctx, t0, () => setTrack(ctx, u.ship, u.track, u.v, '#c0392b')); flash(ctx, p.x, p.y, t0, 1.2); burst(ctx, 'splinter', p.x, p.y, t0, 8, 12, 36, 600); });
  damageMarks(ctx, units, units.length * 120 + 80);
  await wait(ctx, units.length * 120 + 1000);
}

const playLegend = async (c: LegendClip, ctx: FxCtx) => {
  if(c.card === 'И-Л'){ctx=Object.create(ctx) as typeof ctx;ctx.canvasParticles=true;}
  const outro = await legendIntro(ctx, c.card, c.seat, { cost: c.cost, soulCost: c.soulCost, target: c.target });
  await (LG[c.card] || legendGeneric)(c, ctx);
  await outro();
};

/**
 * «Джек ускользает» (fxJack of fx3.js, ANIMATIONS.md §3.5; T.jack; a Legend that is a Reaction — the clip «jack» comes by
 * the event jackEscaped). She should sink: the last boards break, the water rises over the plank, she lists, bubbles;
 * time freezes — everything around goes grey (a filter on her neighbours in the DOM, not on her plank), she keeps her
 * colour and glows, rings of stopped time, droplets hang; the entrance of the Legend; a great compass (compassArt) over
 * her — the needle spins wildly and points to the ally, a golden course is drawn; the water runs off, the colour comes
 * back with a gold flash, she slips along the course with golden ghosts, the ally the other way (the change of places
 * of the events); the Hull 2 shines, coins scatter. game: the Hull and the places are those of the events of the clip.
 */
const playJack = async (c: JackClip & { events: GameEvent[] }, ctx: FxCtx) => {
  const K = T.jack, code = `${c.ship}-Л`, el = plank(ctx, c.ship), b = bx(ctx, el), uid = ++LG_UID;
  const hi = fxSvg(ctx);
  // 1. she should sink: the last boards break, the water rises over the plank, she lists
  const h0 = shownTrack(ctx, c.ship, 'hull');
  for (let i = h0 - 1, t = 0; i >= 0; i--, t += K.board) {
    const p = fxPoint(ctx, c.ship, 'hull', i);
    if (i >= h0 - 3) { splintersSvg(ctx, hi, p.x, p.y, 5, t); sparksSvg(ctx, hi, p.x, p.y, 6, t); }
    at(ctx, t, () => setTrack(ctx, c.ship, 'hull', i, '#7a1f12'));
  }
  if (h0) await wait(ctx, Math.min(3, h0) * K.board);
  shake(ctx, el, 0, 6, 500);
  const host = plankScars(ctx, c.ship) || el;
  const water = document.createElement('div'); water.className = 'lg-jack-water'; host.appendChild(water);
  A(ctx, water, [{ height: '0%' }, { height: '72%' }], K.sink, 0, 'ease-in', 'forwards');
  const list = A(ctx, el, [{ translate: '0 0', rotate: '0deg' }, { translate: '0 8px', rotate: '1.8deg' }], K.sink, 0, 'ease-in', 'forwards');
  for (let i = 0, m = room(ctx, 18); i < m; i++) {
    const x = b.x + rnd(10, b.w - 10), o = sv(hi, `<circle r="${R1(rnd(2, 4))}" fill="none" stroke="#dff4f8" stroke-width="1"/>`);
    A(ctx, o, [{ transform: `translate(${R1(x)}px,${R1(b.b)}px)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${R1(x)}px,${R1(b.y + rnd(0, 40))}px)`, opacity: 0 }], rnd(800, 1300), rnd(0, 1100));
  }
  hint(ctx, `${nick(ctx, c.ship)} тонет…`);
  await wait(ctx, K.sink);
  // 2. time freezes: the world goes grey, only she keeps her colour
  const frozen: Element[] = [];
  for (let e: Element | null = el; e && e !== ctx.board && e.parentElement; e = e.parentElement) for (const x of e.parentElement.children) if (x !== e && !x.matches('.fx-layer, style, script')) frozen.push(x);
  const FZ = 'grayscale(1) brightness(.82) contrast(1.15)';
  const frz = frozen.map((x) => A(ctx, x, [{ filter: 'none' }, { filter: FZ }], K.freeze, 0, 'linear', 'forwards'));
  frz.push(A(ctx, el, [{ filter: 'none' }, { filter: 'saturate(1.3) drop-shadow(0 0 10px rgba(255,214,120,.7))' }], K.freeze, 0, 'linear', 'forwards'));
  // the world gets its colour back however the clip ends (an abort included)
  const thaw = () => frz.forEach((a) => a.cancel());
  let outro: () => Promise<void> = async () => {};
  let sw: Extract<GameEvent, { type: 'swapped' }> | undefined, ob: ReturnType<typeof bx> | null = null;
  try {
    for (let i = 0; i < 3; i++) circRing(ctx, hi, b.cx, b.cy, 20, 360, '#e6dcc4', K.ring, i * K.ringStep, 2);
    const drops = sv(hi, `<g>${Array.from({ length: 14 }, () => `<ellipse cx="${R1(b.x + rnd(0, b.w))}" cy="${R1(b.y - rnd(4, 40))}" rx="1.6" ry="2.6" fill="#dff4f8" opacity=".9"/>`).join('')}</g>`);
    A(ctx, drops, [{ opacity: 0 }, { opacity: 1 }], 200, 0, 'linear', 'forwards');
    // game (S1): the explanation is in the middle of the table, not over the plank
    ruleTag(ctx, b.cx, gapBox(ctx).cy, 'время замерло…', 60, '', 1100);
    await wait(ctx, K.freeze);
    outro = await legendIntro(ctx, code, c.ship, { cost: c.cost, target: c.ship });
    // 3. the great compass over her: the needle spins wildly, then points to the ally; a golden course is drawn
    sw = (c.events || []).find((e): e is Extract<GameEvent, { type: 'swapped' }> => e.type === 'swapped');
    // the ally — the other ship of her team on the table (the event names only the ships that move: a sunk ally stays)
    const ally = sw ? sw.ships.find((s) => s !== c.ship) ?? Object.keys(ctx.display.ships).find((s) => s !== c.ship && sideOf(ctx, s) === sideOf(ctx, c.ship)) : undefined;
    ob = ally ? bx(ctx, plank(ctx, ally)) : null;
    const r = R1(clamp(Math.min(b.h * 0.9, b.w * 0.35), 56, 80));
    // A10: a golden glow with slowly turning soft rays behind the compass (pgJkA, pgJkR of fx3.js), s — the size of this compass to the prototype's
    const gs = r / 80;
    const aura = sv(hi, `<g><defs><radialGradient id="lgJkA${uid}"><stop offset="0" stop-color="#ffe7a4" stop-opacity=".75"/><stop offset=".55" stop-color="#ffd27a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="lgJkR${uid}"><stop offset=".35" stop-color="#fff2c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient></defs><circle r="${R1(150 * gs)}" fill="url(#lgJkA${uid})"/><g class="ry" fill="url(#lgJkR${uid})">${Array.from({ length: 12 }, (_, i) => { const a1 = (i * Math.PI) / 6, a2 = a1 + 0.09; return `<path d="M0 0 L${R1(Math.cos(a1) * 170 * gs)} ${R1(Math.sin(a1) * 170 * gs)} L${R1(Math.cos(a2) * 170 * gs)} ${R1(Math.sin(a2) * 170 * gs)} Z"/>`; }).join('')}</g></g>`);
    A(ctx, aura, [{ transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(.2)`, opacity: 0 }, { transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(1)`, opacity: 1 }], K.compass, 0, 'ease-out', 'forwards');
    const ry = aura.querySelector<SVGGElement>('.ry')!;
    ry.style.transformBox = 'view-box'; ry.style.transformOrigin = '0 0';
    A(ctx, ry, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(60deg)' }], K.rays, 0, 'linear', 'forwards');
    const comp = sv(hi, compassArt(`jk${uid}`, r));
    A(ctx, comp, [{ transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(.1) rotate(-90deg)`, opacity: 0 }, { transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(1.1) rotate(8deg)`, opacity: 1, offset: 0.7 }, { transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(1) rotate(0deg)`, opacity: 1 }], K.compass, 0, 'cubic-bezier(.3,1.3,.6,1)');
    const nd = comp.querySelector<SVGGElement>('.nd')!;
    nd.style.transformBox = 'view-box'; nd.style.transformOrigin = '0 0';
    const toAlly = ob ? (Math.atan2(ob.cy - b.cy, ob.cx - b.cx) * 180) / Math.PI + 90 : 90;
    const end = 1080 + ((toAlly % 360) + 360) % 360;
    A(ctx, nd, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${R1(end - 270)}deg)`, offset: 0.55 }, { transform: `rotate(${R1(end - 20)}deg)`, offset: 0.8 }, { transform: `rotate(${R1(end)}deg)` }], K.needle, K.needleAt, 'cubic-bezier(.2,.6,.3,1)');
    await wait(ctx, K.point);
    // the needle has stopped: a golden ring and sparks over the north
    circRing(ctx, hi, b.cx, b.cy, 70 * gs, 150 * gs, '#ffe7a4', 700, 0, 3); goldBurst(ctx, hi, b.cx, b.cy - 64 * gs, 14, 8, 40);
    if (ob) {
      const ey = isTop(ctx, c.ship) ? b.b + 6 : b.y - 6, oy = isTop(ctx, ally!) ? ob.b + 6 : ob.y - 6, lift = isTop(ctx, c.ship) ? 90 : -90;
      const course = sv(hi, `<path d="M${R1(b.cx)} ${R1(ey)} C${R1(b.cx + Math.sign(ob.cx - b.cx) * 120)} ${R1(ey + lift)} ${R1(ob.cx - Math.sign(ob.cx - b.cx) * 120)} ${R1(oy + lift)} ${R1(ob.cx)} ${R1(oy)}" fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="10 8"/>`);
      A(ctx, course, [{ opacity: 0 }, { opacity: 1 }], K.course, 0, 'linear', 'forwards');
      goldBurst(ctx, hi, ob.cx, oy, 20, 10, 60);
    }
    await wait(ctx, K.go);
    // 4. the water runs off, the colour comes back with a flash, she slips along the course with ghosts; the ally the
    //    other way (the change of places of the events)
    A(ctx, water, [{ height: '72%' }, { height: '0%' }], K.drain, 0, 'ease-out', 'forwards');
    A(ctx, comp, [{ opacity: 1, transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(1)` }, { opacity: 0, transform: `translate(${R1(b.cx)}px,${R1(b.cy)}px) scale(1.4)` }], 400, 0, 'ease-in', 'forwards');
    A(ctx, aura, [{ opacity: 1 }, { opacity: 0 }], 400, 0, 'ease-in', 'forwards');
    A(ctx, drops, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'linear', 'forwards');
    frozen.forEach((x) => A(ctx, x, [{ filter: FZ }, { filter: 'none' }], K.unfreeze, 0, 'linear', 'none'));
    flashBoard(ctx, '#ffe7a4', 0.4, 400);
    await wait(ctx, K.drain);
  } finally { thaw(); }
  list.cancel(); water.remove();
  if (sw && ob) {
    const dx = ob.cx - b.cx;
    for (let i = 0; i < 4; i++) {
      const gh = mk(ctx, 'lg-ghost', b.x, b.y);
      gh.style.width = b.w + 'px'; gh.style.height = b.h + 'px';
      A(ctx, gh, [{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 0.5 - i * 0.1, offset: 0.2 }, { transform: `translate(${R1(dx * (0.5 - i * 0.1))}px,${isTop(ctx, c.ship) ? 60 : -60}px)`, opacity: 0 }], K.slip, i * K.ghost, 'cubic-bezier(.6,0,.3,1)');
    }
    // all the events of the clip: the display moves the ships only with jackEscaped (the Hull 2) applied
    await flipTo(ctx, c.events, K.slip, () => true, { arc: (s) => (s === c.ship ? 70 : -30) });
  }
  // 5. the Hull becomes 2 with a shine; gold coins scatter
  const nb = bx(ctx, plank(ctx, c.ship));
  const hullNew = Math.min(ctx.data.rules.jackHull, startValue(ctx.data, c.ship, 'hull'));
  setTrack(ctx, c.ship, 'hull', 0); // the table may already show the Hull 2 (drawn with the events): it lights up anew
  setTrack(ctx, c.ship, 'hull', hullNew, '#e0b44c');
  for (let i = 0, m = room(ctx, 18); i < m; i++) {
    const coin = sv(hi, '<g><ellipse rx="5" ry="2.2" fill="#9a7020"/><ellipse rx="5" ry="2.2" cy="-1" fill="#f2c94c" stroke="#8a6420" stroke-width=".5"/></g>'), a = rnd(-Math.PI, 0), rr = rnd(40, 120);
    A(ctx, coin, [{ transform: `translate(${R1(nb.cx)}px,${R1(nb.y)}px) rotate(0deg)` }, { transform: `translate(${R1(nb.cx + Math.cos(a) * rr)}px,${R1(nb.y + Math.sin(a) * rr)}px) rotate(${R1(rnd(-400, 400))}deg)`, offset: 0.5 }, { transform: `translate(${R1(nb.cx + Math.cos(a) * rr * 1.3)}px,${R1(nb.y + 30)}px) rotate(${R1(rnd(-800, 800))}deg)`, opacity: 0 }], rnd(900, 1300), 0, 'cubic-bezier(.2,.6,.6,1)');
  }
  trackMark(ctx, c.ship, 'hull', hullNew, 200, true); // game (S1): a mark, not a pill
  await wait(ctx, K.end);
  await outro();
};

export const PLAY_LEGENDS = { legend: playLegend as unknown as ClipPlayer, jack: playJack as unknown as ClipPlayer };
