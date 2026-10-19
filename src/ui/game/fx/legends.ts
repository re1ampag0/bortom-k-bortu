// The Legends: the common grand entrance of a Legend and the effect of each. A port of
// docs/mockups/anim/level1/play-legends.js (see PORTING.md): the code is the reference's, what changed is how an
// element is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. The pictures (a galleon,
// a tentacle, an eye, a bottle, a compass rose, a seal) are our own SVG, as in the reference.
// Timing at «обычно» (×1): the entrance 0–2.2 s → the effect 1.6–2.4 s → the leave 0.35 s; all × the speed factor.
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
import { KIND_BY_TRACK, type JackClip, type LegendClip } from './planFx';
import {
  A, at, badgeMark, boom, filters, flashBoard, fxSvg, sparksSvg, splintersSvg, waterColumn, gunFire, hitBlast, burst, bx, clamp, curve, flash, fly, fxPoint, gapBox, hint, holdEl, inkOn, isPhone, isTop, mk, payKegs, plank,
  projectile, puff, qpts, ring, rnd, room, setTrack, shake, shownTrack, sideOf, soulsFly, splash, sv, tag, trackMark, visible, wait, whirlpool, wisp, type FxCtx, type Pt,
} from './primitives';
import { CELLS } from '../art/cells';
import { ART_FRAME, COST_ICON, COST_WORD, crackArt, EMBLEM, SEAL_HTML, TENT } from '../art/legendArt';
import { ruleTag } from './sea';
import { plankScars, scar, seaScars } from './scars';
import { SMOKE_LIFE, T } from './timing';

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
export function galleonSVG(flag = '#9C7A2C'): string {
  return `<svg viewBox="0 0 120 96" width="120" height="96"><g stroke="#3d2614" stroke-width="2">
<path d="M34 22 V70 M60 6 V70 M86 18 V70" stroke="#4a3220" stroke-width="2.6"/>
<path d="M22 22 Q34 18 46 22 Q48 36 46 48 Q34 45 22 48 Q20 36 22 22Z" fill="#fff6e0" stroke="#c9b48c"/>
<path d="M44 12 Q60 8 76 12 Q79 30 76 46 Q60 42 44 46 Q41 30 44 12Z" fill="#fffaf0" stroke="#c9b48c"/>
<path d="M74 20 Q86 16 98 20 Q100 34 98 46 Q86 43 74 46 Q72 34 74 20Z" fill="#fff6e0" stroke="#c9b48c"/>
<path d="M44 50 Q60 47 76 50 Q77 58 76 64 Q60 62 44 64 Q43 58 44 50Z" fill="#fff6e0" stroke="#c9b48c"/>
<path d="M60 6 l16 4 l-16 4z M34 22 l11 3 l-11 3z M86 18 l11 3 l-11 3z" fill="${flag}" stroke="none"/>
<path d="M6 64 H114 L104 86 Q60 96 16 86 Z" fill="#6b4423"/></g>
<path d="M10 71 H110" stroke="#d8b25a" stroke-width="2.4"/>
<g fill="#1e1a17">${[22, 36, 50, 64, 78, 92].map((x) => `<rect x="${x}" y="75" width="7" height="6" rx="1.5"/>`).join('')}</g></svg>`;
}
export function tentacleInner(uid: string | number): string {
  return `<defs><linearGradient id="tg${uid}" x1="0" x2="1"><stop offset="0" stop-color="#2b3f3a"/><stop offset=".55" stop-color="#4f6e62"/><stop offset="1" stop-color="#22322e"/></linearGradient></defs>
<path d="M14 200 C6 150 36 128 30 92 C25 62 6 48 16 24 C22 8 40 2 48 12 C54 20 46 30 38 26 C34 34 42 44 40 60 C38 86 52 108 48 142 C45 172 52 188 50 200Z" fill="url(#tg${uid})" stroke="#16211e" stroke-width="2"/>
<g fill="#cfe3d8" opacity=".9">${[[42, 150, 4], [41, 128, 3.6], [40, 106, 3.2], [36, 84, 2.8], [33, 64, 2.4], [32, 46, 2], [36, 32, 1.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}"/>`).join('')}</g>`;
}
export function tentacleSVG(h: number, flip: boolean, uid: string | number): string {
  const w = Math.round(h * 0.3);
  return `<svg viewBox="0 0 60 200" width="${w}" height="${h}" preserveAspectRatio="none" style="display:block"><g ${flip ? 'transform="translate(60 0) scale(-1 1)"' : ''}>${tentacleInner(uid)}</g></svg>`;
}
export function eyeSVG(uid: string | number): string {
  return `<svg viewBox="0 0 160 70" width="160" height="70"><defs><radialGradient id="iris${uid}"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#e8b830"/><stop offset="1" stop-color="#7a4a08"/></radialGradient></defs>
<path d="M4 35 Q80 -16 156 35 Q80 86 4 35Z" fill="#14201c" stroke="#0a110f" stroke-width="3"/>
<ellipse cx="80" cy="35" rx="25" ry="25" fill="url(#iris${uid})"/><ellipse class="pupil" cx="80" cy="35" rx="5" ry="21" fill="#0b0a08" style="transform-box:fill-box;transform-origin:center"/>
<circle cx="71" cy="26" r="4" fill="#fff" opacity=".85"/></svg>`;
}
export function bottleSVG(): string {
  return `<svg viewBox="0 0 120 200" width="100%" height="100%">
<path d="M46 12 h28 v36 q0 10 14 22 q22 18 22 46 v66 q0 12 -12 12 h-76 q-12 0 -12 -12 v-66 q0 -28 22 -46 q14 -12 14 -22z" fill="rgba(150,210,180,.22)" stroke="#5d8a74" stroke-width="3"/>
<path d="M10 160 q25 -8 50 0 t50 0 v22 q0 12 -12 12 h-76 q-12 0 -12 -12z" fill="#5e9cc0" opacity=".5"/>
<g class="mini" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M34 158 h52 l-8 11 h-36z" fill="#3a2a1e"/><path d="M60 156 v-42 l19 36z" fill="#fff6e0" stroke="#c9b48c"/><path d="M57 156 v-32 l-15 28z" fill="#fff6e0" stroke="#c9b48c"/><path d="M60 114 l9 3 l-9 3z" fill="#2c6658"/></g>
<path d="M22 100 q0 -18 12 -28" stroke="#fff" stroke-width="5" opacity=".55" fill="none" stroke-linecap="round"/>
<path d="M98 120 v40" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>
<g class="cork" style="transform-box:fill-box;transform-origin:center"><path d="M47 0 h26 l-2 16 h-22z" fill="#9a6a3a" stroke="#5a3a1c" stroke-width="2"/><path d="M50 6 h20" stroke="#5a3a1c" stroke-width="1.5"/></g></svg>`;
}
export function compassSVG(): string {
  const pts: string[] = [];
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8, len = k % 4 === 0 ? 132 : k % 2 === 0 ? 92 : 62, wd = k % 4 === 0 ? 14 : 9;
    const tip = [Math.sin(a) * len, -Math.cos(a) * len], l = [Math.sin(a - Math.PI / 2) * wd, -Math.cos(a - Math.PI / 2) * wd], r = [-l[0], -l[1]];
    pts.push(`<polygon points="${tip} ${l} 0,0" fill="${k % 4 === 0 ? '#f6d77a' : '#e0c27a'}"/><polygon points="${tip} ${r} 0,0" fill="${k % 4 === 0 ? '#a27419' : '#8a6416'}"/>`);
  }
  const letters = ([['С', 0], ['В', 90], ['Ю', 180], ['З', 270]] as [string, number][]).map(([t, d]) => { const a = (d * Math.PI) / 180; return `<text x="${Math.sin(a) * 112}" y="${-Math.cos(a) * 112 + 6}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-weight="800" font-size="18" fill="#fff3c4">${t}</text>`; }).join('');
  return `<svg viewBox="-150 -150 300 300" width="100%" height="100%"><circle r="143" fill="rgba(20,16,12,.35)" stroke="#e0b44c" stroke-width="3"/><circle r="128" fill="none" stroke="#e0b44c" stroke-width="1.2" stroke-dasharray="2 7"/><circle r="100" fill="none" stroke="#e0b44c" stroke-width="1" opacity=".6"/>${pts.reverse().join('')}${letters}<circle r="9" fill="#2a1c0e" stroke="#e0b44c" stroke-width="2"/></svg>`;
}
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
    const p = sv(svg, i % 3 ? `<circle r="${R1(rnd(1.2, 2.8))}" fill="${['#fff6d8', '#ffd27a', '#e0bd62'][i % 3]}"/>` : '<path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#fff6d8"/>');
    A(ctx, p, [{ transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 1 }, { transform: `translate(${R1(x + Math.cos(a) * r)}px,${R1(y + Math.sin(a) * r)}px) scale(.4)`, opacity: 0 }], rnd(700, 1300), delay, 'cubic-bezier(.1,.8,.3,1)');
  }
}
/** Gold motes rising from below (motes of fx3.js). */
function motes(ctx: FxCtx, n: number, x0: number, x1: number, y0: number, y1: number, delay = 0): void {
  const colors = ['#ffe9a8', '#ffd27a', '#fff6d8'], m = room(ctx, n);
  for (let i = 0; i < m; i++) {
    const el = mk(ctx, 'lg-mote', 0, 0), s = rnd(2, 5);
    el.style.width = el.style.height = s + 'px'; el.style.background = colors[i % 3];
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
    const t = sv(hi, `<circle r="${R1(6 - i * 0.8)}" fill="#ffd27a" opacity="${R1(0.7 - i * 0.1)}"/>`);
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
    const o = sv(hi, i ? `<circle r="${R1(8 - i)}" fill="#ffd27a" opacity="${R1(0.6 - i * 0.08)}"/>` : '<g><circle r="22" fill="#ffd27a" opacity=".35"/><circle r="11" fill="#fff1c0"/><circle r="5" fill="#fff"/></g>');
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

/** «Армада Компании»: galleons rise from the sea along the Company's edge, a broadside in a wave, hits on every enemy. */
LG['И-Л'] = async (c, ctx) => {
  const board = ctx.board, own = sideOf(ctx, c.seat), W = board.clientWidth, g = gapBox(ctx);
  const topOwn = own !== ctx.bottom;
  const n = W < 701 ? 4 : 6;
  const s = clamp((g.h - 8) / 96, 0.5, 0.95);
  const base = topOwn ? g.y + 96 * s + 2 : g.b - 2; // the waterline of the galleons
  const units = damageUnits(ctx, c.effects || []);
  const ships: { el: HTMLElement; x: number }[] = [];
  for (let q = 0; q < n; q++) {
    const x = W * (0.5 / n + q / n);
    const gl = mk(ctx, 'galleon', 0, 0, galleonSVG());
    const order = Math.abs(q - (n - 1) / 2);
    A(ctx, gl, [{ opacity: 0, transform: `translate(${x}px,${base + 40 * s}px) scale(${s}) rotate(-6deg)` }, { opacity: 1, transform: `translate(${x}px,${base - 4}px) scale(${s}) rotate(2deg)`, offset: 0.7 }, { opacity: 1, transform: `translate(${x}px,${base}px) scale(${s}) rotate(0deg)` }], 520, order * 90, 'cubic-bezier(.2,.8,.3,1.2)');
    splash(ctx, x, base - 4, order * 90 + 200);
    ships.push({ el: gl, x });
  }
  tag(ctx, W / 2, topOwn ? base + 18 : base - 96 * s - 16, 'Бортовой залп!', 560, 'gold shout', 1400);
  const FIRE0 = 700, STEP = 120, FLY = 520;
  let lastHit = FIRE0;
  const fired = new Set<{ el: HTMLElement; x: number }>();
  // FX-D: the galleons fire with the guns of the Volley (×0.6), their smoke lies over the sea a while (a short trace)
  const svg = fxSvg(ctx), sea = seaScars(ctx), smoke = ctx.rich && sea ? scar(fxSvg(ctx, sea), 'short') : null;
  units.forEach((u, i) => {
    const sp = ships[i % ships.length], t0 = FIRE0 + i * STEP;
    const muzzle = { x: sp.x + (i % 2 ? 12 : -12) * s, y: base - 16 * s };
    const p1 = fxPoint(ctx, u.ship, u.track, u.idx);
    gunFire(ctx, svg, i < 6 ? smoke : null, muzzle.x, muzzle.y, Math.atan2(p1.y - muzzle.y, p1.x - muzzle.x), 0.6, t0, { grains: 4, puffs: 5, wads: 1, life: SMOKE_LIFE });
    if (!fired.has(sp)) { fired.add(sp); A(ctx, sp.el, [{ transform: `translate(${sp.x}px,${base}px) scale(${s})` }, { transform: `translate(${sp.x}px,${base + (topOwn ? -5 : 5)}px) scale(${s}) rotate(${topOwn ? -2 : 2}deg)`, offset: 0.25 }, { transform: `translate(${sp.x}px,${base}px) scale(${s})` }], 420, t0, 'ease-out', 'none'); }
    const ball = projectile(ctx, KIND_BY_TRACK[u.track], false);
    fly(ctx, ball, curve(muzzle, p1, i % 2 ? 0.1 : -0.1), FLY, t0, { lift: 0.35, spin: u.track === 'sails' ? 720 : 0 });
    const th = t0 + FLY;
    at(ctx, th, () => setTrack(ctx, u.ship, u.track, u.v, '#c0392b'));
    hitBlast(ctx, svg, p1.x, p1.y, 0.6, th, 520, i > 0);
    if (u.track === 'sails') burst(ctx, 'shred', p1.x, p1.y, th, 10, 16, 44, 650);
    shake(ctx, plank(ctx, u.ship), th, 3);
    if (i === 2) at(ctx, th, () => shake(ctx, board, 0, 9, 320)); // a strong hit — one shake of the table for the series
    lastHit = th;
  });
  damageMarks(ctx, units, lastHit + 80);
  for (const sp of ships) {
    A(ctx, sp.el, [{ opacity: 1, transform: `translate(${sp.x}px,${base}px) scale(${s})` }, { opacity: 0, transform: `translate(${sp.x}px,${base + 36 * s}px) scale(${s}) rotate(4deg)` }], 600, lastHit + 500, 'ease-in', 'forwards');
    puff(ctx, sp.x, base - 30 * s, lastHit + 450);
  }
  await wait(ctx, lastHit + 1150);
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
  const sea = seaScars(ctx), deep = fxSvg(ctx, sea || ctx.layer), top = fxSvg(ctx);
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
  if (sea) scar(deep, 'short'); // the dark of the deep stays a while and dissolves
  await wait(ctx, Math.max(K.end, soulsEnd - (t + K.after) + 100));
};


/** «Корабль в бутылке»: a glass bottle over the ship, the ship shrinks into it, the cork, the bottle floats away. */
LG['М-Л'] = async (c, ctx) => {
  const tgt = c.target!, tp = plank(ctx, tgt), tb = bx(ctx, tp), W = ctx.board.clientWidth;
  const h = clamp(tb.h * 1.45, 150, 250), w = h * 0.6;
  const bc = { x: tb.cx, y: tb.cy };
  const bottle = mk(ctx, 'bottle', 0, 0, bottleSVG());
  bottle.style.width = w + 'px'; bottle.style.height = h + 'px'; bottle.style.margin = `${-h / 2}px 0 0 ${-w / 2}px`;
  const mini = bottle.querySelector<SVGElement>('.mini')!, cork = bottle.querySelector<SVGElement>('.cork')!;
  mini.style.opacity = '0'; cork.style.opacity = '0';
  A(ctx, bottle, [{ opacity: 0, transform: `translate(${bc.x}px,${bc.y}px) scale(.4) rotate(-12deg)` }, { opacity: 1, transform: `translate(${bc.x}px,${bc.y}px) scale(1.06) rotate(3deg)`, offset: 0.7 }, { opacity: 1, transform: `translate(${bc.x}px,${bc.y}px) scale(1) rotate(0deg)` }], 520, 0, 'cubic-bezier(.2,.8,.3,1.2)');
  if (ctx.rich) for (let q = 0; q < 6; q++) { const sp = mk(ctx, 'sparkle', 0, 0); const x = bc.x + (Math.random() - 0.5) * w, y = bc.y + (Math.random() - 0.5) * h; A(ctx, sp, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1.3)`, offset: 0.5 }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }], 600, 250 + q * 90); }
  // the ship shrinks into the bottle, gold dust swirls around it
  const inside = { x: bc.x, y: bc.y + h * 0.22 };
  A(ctx, tp, [{ transform: 'none', opacity: 1 }, { transform: `translate(${inside.x - tb.cx}px,${inside.y - tb.cy}px) scale(.5) rotate(-6deg)`, opacity: 0.9, offset: 0.6 }, { transform: `translate(${inside.x - tb.cx}px,${inside.y - tb.cy}px) scale(.08) rotate(-14deg)`, opacity: 0 }], 750, 520, 'cubic-bezier(.6,0,.8,.6)', 'forwards');
  if (ctx.rich) for (let q = 0; q < 18; q++) {
    const d = mk(ctx, 'gold-dust', 0, 0), a0 = (q / 18) * Math.PI * 2;
    const pts = Array.from({ length: 9 }, (_, j) => { const r = (1 - j / 8) * Math.max(tb.w, tb.h) * 0.55, a = a0 + j * 0.55; return { x: inside.x + Math.cos(a) * r, y: inside.y + Math.sin(a) * r * 0.6 }; });
    A(ctx, d, pts.map((p, j) => ({ offset: j / 8, opacity: j === 8 ? 0 : 1, transform: `translate(${p.x}px,${p.y}px)` })), 700, 560 + q * 12, 'ease-in');
  }
  A(ctx, mini, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }], 380, 1180, 'ease-out', 'forwards');
  // the cork
  A(ctx, cork, [{ opacity: 1, transform: 'translateY(-46px) rotate(-20deg)' }, { opacity: 1, transform: 'translateY(2px) rotate(0deg)', offset: 0.75 }, { opacity: 1, transform: 'translateY(0)' }], 300, 1420, 'cubic-bezier(.6,0,.9,.6)', 'forwards');
  const neck = { x: bc.x, y: bc.y - h / 2 + h * 0.04 };
  flash(ctx, neck.x, neck.y, 1650, 0.9); ring(ctx, neck.x, neck.y, 1650, 0.9, '#e0b44c');
  tag(ctx, neck.x, neck.y - 22, 'Чпок!', 1650, 'gold shout', 900);
  // the bottle lies on the water and floats away to the nearer edge
  const dir = bc.x > W / 2 ? 1 : -1;
  const g = gapBox(ctx);
  const water = { x: bc.x + dir * 30, y: g.cy };
  const endX = dir > 0 ? W + w : -w;
  const path = Array.from({ length: 13 }, (_, j) => { const t = j / 12; return { x: water.x + (endX - water.x) * t * t, y: water.y + Math.sin(t * Math.PI * 3) * 6, r: dir * (80 + Math.sin(t * Math.PI * 3) * 8) }; });
  A(ctx, bottle, [{ opacity: 1, transform: `translate(${bc.x}px,${bc.y}px) scale(1) rotate(0deg)` }, { opacity: 1, transform: `translate(${water.x}px,${water.y}px) scale(.7) rotate(${dir * 80}deg)` }], 520, 1900, 'cubic-bezier(.4,0,.3,1)', 'forwards');
  A(ctx, bottle, path.map((p, j) => ({ offset: j / 12, opacity: j === 12 ? 0 : 1, transform: `translate(${p.x}px,${p.y}px) scale(.7) rotate(${p.r}deg)` })), 1500, 2420, 'ease-in', 'forwards');
  splash(ctx, water.x, water.y + 10, 2380);
  for (let q = 1; q < 5; q++) { const p = path[q * 3]; const r = mk(ctx, 'ripple', 0, 0); A(ctx, r, [{ opacity: 0.8, transform: `translate(${p.x}px,${p.y + 8}px) scale(.3)` }, { opacity: 0, transform: `translate(${p.x}px,${p.y + 8}px) scale(1.4)` }], 800, 2420 + q * 260); }
  let tEnd = 3500;
  // «Джонс свободен» and the repair of the Crew of «Голландец» — events of the same Legend
  const jf = (c.effects || []).find((e) => e.type === 'jonesFree');
  const rs = (c.effects || []).filter((e): e is Extract<GameEvent, { type: 'restored' }> => e.type === 'restored');
  if (jf && jf.type === 'jonesFree') {
    const jb = bx(ctx, plank(ctx, jf.ship));
    // game (S1): the explanation is in the middle of the table, not over the plank
    ruleTag(ctx, jb.cx, gapBox(ctx).cy, 'Джонс свободен', 2500, 'gold', 1700);
    ring(ctx, jb.cx, jb.cy, 2500, 2.4, '#e0b44c');
  }
  rs.forEach((e) => {
    const now = shownTrack(ctx, e.ship, e.track);
    for (let j = 0; j < e.amount; j++) {
      const t0 = 2700 + j * 180, p = fxPoint(ctx, e.ship, e.track, now + j);
      at(ctx, t0, () => setTrack(ctx, e.ship, e.track, now + j + 1, '#2f7d4a'));
      ring(ctx, p.x, p.y, t0, 0.8, '#2f7d4a'); burst(ctx, 'sparkle', p.x, p.y, t0, 5, 6, 18, 500);
    }
    trackMark(ctx, e.ship, e.track, e.amount, 2800 + e.amount * 180, true); // game (S1): a mark, not a pill
    tEnd = Math.max(tEnd, 3400 + e.amount * 180);
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
  const outro = await legendIntro(ctx, c.card, c.seat, { cost: c.cost, soulCost: c.soulCost, target: c.target });
  await (LG[c.card] || legendGeneric)(c, ctx);
  await outro();
};

/**
 * «Джек ускользает» (a Legend that is a Reaction; the clip «jack» comes by the event jackEscaped): the ship starts to
 * sink — time stops (the bubbles freeze, the table goes grey) — the entrance of the Legend — the compass rose spins —
 * «Ускользнул!» — the Hull 2 in gold — the jump out of the water and the change of places.
 */
const playJack = async (c: JackClip & { events: GameEvent[] }, ctx: FxCtx) => {
  const code = `${c.ship}-Л`, el = plank(ctx, c.ship), b = bx(ctx, el), W = ctx.board.clientWidth, H = ctx.board.clientHeight;
  // it starts to sink
  A(ctx, el, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-3deg) translateY(12px)', opacity: 0.8 }], 700, 0, 'ease-in', 'forwards');
  const frozen: Animation[] = [];
  for (let q = 0; q < (ctx.rich ? 16 : 4); q++) {
    const bb = mk(ctx, 'bubble', 0, 0), x = b.x + 10 + Math.random() * (b.w - 20), y = b.b - 6;
    frozen.push(A(ctx, bb, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.5)` }, { opacity: 1, offset: 0.2 }, { opacity: 0, transform: `translate(${x + (Math.random() - 0.5) * 16}px,${y - 50 - Math.random() * 40}px) scale(1.2)` }], 1400, q * 40, 'linear'));
  }
  const wp = whirlpool(ctx, b.cx, b.b - 10, 200, Math.min(180, b.w * 0.6), 0);
  hint(ctx, `${nick(ctx, c.ship)} тонет…`);
  await wait(ctx, 520);
  // time stops
  frozen.forEach((a) => a.pause());
  wp.getAnimations({ subtree: true }).forEach((a) => a.pause());
  const gray = mk(ctx, 'tint', 0, 0); gray.style.width = W + 'px'; gray.style.height = H + 'px'; gray.style.background = 'rgba(120,128,132,.38)';
  A(ctx, gray, [{ opacity: 0 }, { opacity: 1 }], 160, 0, 'linear', 'forwards');
  ring(ctx, b.cx, b.cy, 0, 3, '#e8eef2');
  // game (S1): the explanation is in the middle of the table, not over the plank
  ruleTag(ctx, b.cx, gapBox(ctx).cy, 'время замерло…', 60, '', 1100);
  await wait(ctx, 220);
  const outro = await legendIntro(ctx, code, c.ship, { cost: c.cost, target: c.ship });
  // the compass rose
  const cs = clamp(Math.min(b.w, b.h * 1.6), 200, 300);
  const rose = mk(ctx, 'compass', 0, 0, compassSVG());
  rose.style.width = rose.style.height = cs + 'px'; rose.style.margin = `${-cs / 2}px 0 0 ${-cs / 2}px`;
  A(ctx, rose, [{ opacity: 0, transform: `translate(${b.cx}px,${b.cy}px) scale(.3) rotate(-200deg)` }, { opacity: 1, transform: `translate(${b.cx}px,${b.cy}px) scale(1.05) rotate(540deg)`, offset: 0.8 }, { opacity: 1, transform: `translate(${b.cx}px,${b.cy}px) scale(1) rotate(720deg)` }], 1000, 0, 'cubic-bezier(.15,.7,.3,1)', 'forwards');
  burst(ctx, 'gold-dust', b.cx, b.cy, 650, 22, 40, cs * 0.6, 800);
  // «Ускользнул!»
  const shout = mk(ctx, 'lg-shout', b.cx, b.cy, 'Ускользнул!');
  const ks = Math.min(1, W / 600);
  A(ctx, shout, [{ opacity: 0, transform: `translate(-50%,-50%) rotate(-4deg) scale(${2.2 * ks})` }, { opacity: 1, transform: `translate(-50%,-50%) rotate(-4deg) scale(${0.95 * ks})`, offset: 0.7 }, { opacity: 1, transform: `translate(-50%,-50%) rotate(-4deg) scale(${ks})` }], 280, 760, 'cubic-bezier(.6,0,.9,.6)');
  at(ctx, 1000, () => shake(ctx, ctx.board, 0, 7, 260));
  // the Hull 2 in gold
  const hullNow = shownTrack(ctx, c.ship, 'hull'), hullNew = Math.min(ctx.data.rules.jackHull, startValue(ctx.data, c.ship, 'hull'));
  for (let j = hullNow; j < hullNew; j++) { const p = fxPoint(ctx, c.ship, 'hull', j); burst(ctx, 'gold-dust', p.x, p.y, 1150 + j * 120, 8, 6, 24, 600); ring(ctx, p.x, p.y, 1150 + j * 120, 0.8, '#e0b44c'); }
  at(ctx, 1150, () => setTrack(ctx, c.ship, 'hull', hullNew, '#e0b44c'));
  trackMark(ctx, c.ship, 'hull', hullNew - hullNow, 1300, true); // game (S1): a mark, not a pill
  await wait(ctx, 1500);
  // time goes on: the bubbles burst, the jump out of the water, the change of places
  frozen.forEach((a) => { a.playbackRate = 3; a.play(); });
  wp.remove();
  A(ctx, gray, [{ opacity: 1 }, { opacity: 0 }], 250, 0, 'ease-out', 'forwards');
  A(ctx, shout, [{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%,-50%) rotate(-4deg) scale(1.3)' }], 300, 0, 'ease-in', 'forwards');
  A(ctx, rose, [{ opacity: 1, transform: `translate(${b.cx}px,${b.cy}px) scale(1) rotate(720deg)` }, { opacity: 0, transform: `translate(${b.cx}px,${b.cy}px) scale(1.4) rotate(760deg)` }], 400, 0, 'ease-in', 'forwards');
  A(ctx, plank(ctx, c.ship), [{ transform: 'rotate(-3deg) translateY(12px)', opacity: 0.8 }, { transform: 'translateY(-22px) scale(1.04)', opacity: 1 }], 280, 0, 'cubic-bezier(.2,.8,.3,1)', 'forwards');
  for (let q = 0; q < 3; q++) splash(ctx, b.x + b.w * (0.2 + 0.3 * q), b.b - 4, 80 + q * 60);
  await wait(ctx, 300);
  const swapEv = (c.events || []).filter((e) => e.type === 'swapped');
  if (swapEv.length) await flipTo(ctx, c.events, 700); // all the events of the clip: the Hull 2, the Legend played, the change of places
  await outro();
};

export const PLAY_LEGENDS = { legend: playLegend as unknown as ClipPlayer, jack: playJack as unknown as ClipPlayer };
