// The Legends: the common grand entrance of a Legend and the effect of each. A port of
// docs/mockups/anim/level1/play-legends.js (see PORTING.md): the code is the reference's, what changed is how an
// element is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. The pictures (a galleon,
// a tentacle, an eye, a bottle, a compass rose, a seal) are our own SVG, as in the reference.
// Timing at «обычно» (×1): the entrance 0–2.2 s → the effect 1.6–2.4 s → the leave 0.35 s; all × the speed factor.
// Changes against the reference («game:»):
//  - the card of the Legend has the bottom strip of the ship that played it («ЛЕГЕНДА · МЕСТЬ», footHTML — A4);
//  - S1: no label explaining the effect lies on a plank longer than a flash: the Souls paid — a mark at the badge.
import { legendCards } from '../../../engine/data';
import { shipData, type GameEvent } from '../../../engine/state';
import type { CardInstance, GameData, Track } from '../../../engine/types';
import type { ClipPlayer } from './FxLayer';
import type { LegendClip } from './planFx';
import {
  A, at, badgeMark, burst, bx, fxPoint, flash, footHTML, hint, mk, ms, overlayAt, payKegs, plank, ring, setTrack, shake, shownTrack, sideOf, trackMark, visible,
  wait, wisp, type FxCtx, type Pt,
} from './primitives';

let LG_UID = 0;
const LG_T = { bars: 120, card: 280, land: 780, seal: 820, title: 900, leave: 1900, effect: 2230 };

const esc = (s: string) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
const nick = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nick}»`;
const legendsOf = new WeakMap<GameData, Record<string, CardInstance>>();
function legendCard(data: GameData, code: string): CardInstance {
  let m = legendsOf.get(data);
  if (!m) legendsOf.set(data, (m = Object.fromEntries(legendCards(data).map((c) => [c.code, c]))));
  return m[code];
}
const inner = (svg: string) => svg.replace(/^<svg[^>]*>|<\/svg>$/g, '');

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
/** The wax seal: «ЛЕГЕНДА • ЛЕГЕНДА •» around it — two words with dots, stretched over the circle (textLength 162). */
export function sealSVG(uid: string | number): string {
  return `<svg viewBox="0 0 92 92" width="92" height="92"><defs><path id="arc${uid}" d="M46 19 a27 27 0 1 1 0 54 a27 27 0 1 1 0 -54"/></defs>
<path d="M46 3 C58 2 66 9 75 12 C84 18 86 28 89 38 C92 50 86 58 84 68 C78 80 68 84 56 88 C44 92 34 88 24 84 C12 78 8 68 4 58 C0 46 4 36 8 26 C14 14 24 8 34 5 C38 4 42 3 46 3Z" fill="#9e2b25"/>
<circle cx="46" cy="46" r="36" fill="none" stroke="#6e1a12" stroke-width="2"/><circle cx="46" cy="46" r="19" fill="#b23a2e" stroke="#6e1a12" stroke-width="1.5"/>
<text font-size="9.4" font-weight="800" fill="#ffe0c8" font-family="Alegreya Sans, system-ui, sans-serif"><textPath href="#arc${uid}" textLength="162" lengthAdjust="spacing">ЛЕГЕНДА • ЛЕГЕНДА •</textPath></text>
<path d="M46 32 l4 9.5 10 .8 -7.6 6.6 2.4 9.8 -8.8 -5.4 -8.8 5.4 2.4 -9.8 -7.6 -6.6 10 -.8z" fill="#ffe0c8"/></svg>`;
}
/** The pictures of the Legend cards and «out of the frame» (an element over the top edge of the card). */
const LG_ART: Record<string, { bg: string; svg: string; pop: string }> = {
  'Ж-Л': {
    bg: 'linear-gradient(#1b2b3a, #3b6280 62%, #8fb7cc)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g opacity=".35" transform="translate(94 64) scale(.42)">${inner(compassSVG())}</g><path d="M0 108 Q30 94 60 106 T120 104 T188 100 V128 H0Z" fill="#24465c"/><g transform="translate(70 52) rotate(-12)"><path d="M0 40 h56 l-9 11 h-38z" fill="#1e1a17"/><path d="M28 38 v-36 l17 31z" fill="#2a241d"/><path d="M25 38 v-28 l-14 25z" fill="#2a241d"/><path d="M28 2 l10 3 l-10 3z" fill="#a3341f"/></g><path d="M40 112 q14 -18 30 -8" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/></svg>`,
    pop: `<svg viewBox="-30 -30 60 60" width="62" height="62"><polygon points="0,-28 6,-6 0,0" fill="#f6d77a"/><polygon points="0,-28 -6,-6 0,0" fill="#a27419"/><polygon points="28,0 6,6 0,0" fill="#f6d77a"/><polygon points="28,0 6,-6 0,0" fill="#a27419"/><polygon points="0,28 -6,6 0,0" fill="#f6d77a"/><polygon points="0,28 6,6 0,0" fill="#a27419"/><polygon points="-28,0 -6,-6 0,0" fill="#f6d77a"/><polygon points="-28,0 -6,6 0,0" fill="#a27419"/><circle r="4" fill="#2a1c0e" stroke="#e0b44c"/></svg>`,
  },
  'М-Л': {
    bg: 'linear-gradient(#20312a, #3e6152 60%, #7fa99a)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g transform="translate(94 66) rotate(-68) translate(-34 -56) scale(.56)">${inner(bottleSVG())}</g><path d="M0 112 Q40 102 94 110 T188 106 V128 H0Z" fill="#24465c" opacity=".8"/></svg>`,
    pop: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M10 4 h20 l-3 22 h-14z" fill="#9a6a3a" stroke="#5a3a1c" stroke-width="2"/><path d="M13 10 h14" stroke="#5a3a1c" stroke-width="1.5"/><circle cx="34" cy="8" r="2" fill="#fff3c4"/><circle cx="6" cy="14" r="1.6" fill="#fff3c4"/></svg>`,
  },
  'И-Л': {
    bg: 'linear-gradient(#3a2a12, #8a6a2a 55%, #d8b25a)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g transform="translate(-6 40) scale(.62)">${inner(galleonSVG())}</g><g transform="translate(56 26) scale(.8)">${inner(galleonSVG())}</g><g transform="translate(120 40) scale(.62)">${inner(galleonSVG())}</g><path d="M0 110 Q47 100 94 108 T188 104 V128 H0Z" fill="#24465c"/></svg>`,
    pop: `<svg viewBox="0 0 60 40" width="60" height="40"><path d="M8 38 V4" stroke="#4a3220" stroke-width="3"/><path d="M8 4 l44 6 l-10 7 l10 7 l-44 -4z" fill="#9C7A2C" stroke="#5a4210" stroke-width="1.5"/><path d="M16 12 h20" stroke="#fff3c4" stroke-width="2"/></svg>`,
  },
  'Г-Л': {
    bg: 'linear-gradient(#0e1c1c, #1f3c3a 55%, #3d6a62)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g transform="translate(64 20) scale(.38)">${inner(eyeSVG('a')).replace(/iris\w+/g, 'irisArt')}</g><g transform="translate(12 18) scale(.56)">${tentacleInner('a1')}</g><g transform="translate(176 26) scale(-.5 .5)">${tentacleInner('a2')}</g><path d="M0 108 Q47 96 94 106 T188 100 V128 H0Z" fill="#0b1a1a"/></svg>`,
    pop: `<svg viewBox="0 0 60 70" width="54" height="64"><path d="M14 70 C6 52 30 40 28 26 C26 14 14 12 18 6 C22 0 36 2 38 12 C40 20 32 22 30 18 C34 30 46 38 44 54 C43 62 46 66 46 70Z" fill="#3d5a50" stroke="#16211e" stroke-width="2"/><g fill="#cfe3d8"><circle cx="36" cy="52" r="2.6"/><circle cx="34" cy="40" r="2.2"/><circle cx="31" cy="30" r="1.8"/></g></svg>`,
  },
};

/** The card of the Legend: the back, the face with its picture, the shine and the element «out of the frame».
 *  game: the bottom strip of the ship that played it («ЛЕГЕНДА · МЕСТЬ»), its text never under 10 px at the scale `s`. */
export function lgCardHTML(data: GameData, code: string, owner: string, s = 1): string {
  const c = legendCard(data, code), art = LG_ART[code] || { bg: 'linear-gradient(#3a2a12,#d8b25a)', svg: '', pop: '' };
  const cost = [c.cost ? `${c.cost} П` : '', c.soul ? `${c.soul} Д` : ''].filter(Boolean).join(' + ');
  return `<div class="back"><svg viewBox="-30 -30 60 60" width="70" height="70"><circle r="26" fill="none" stroke="#e0b44c" stroke-width="2"/><path d="M0 -20 v34 M-12 -8 h24 M-16 6 q16 18 32 0" stroke="#e0b44c" stroke-width="3" fill="none" stroke-linecap="round"/><circle cy="-22" r="4" fill="none" stroke="#e0b44c" stroke-width="2"/></svg></div>` +
    `<div class="frame"><div class="inner"><div class="art" style="background:${art.bg}">${art.svg}<span class="kind">ЛЕГЕНДА · ${esc(c.type)}</span>${cost ? `<span class="cost">${cost}</span>` : ''}</div>` +
    `<div class="body"><div class="name">${esc(c.name)}</div><div class="big">${esc(c.big)}</div></div>${footHTML(data, { ship: owner, legend: true }, s)}<div class="shine"></div></div><div class="lg-pop">${art.pop}</div></div>`;
}

/** Where the Legend comes from: the badge «Легенда» on the plank of the owner (on a phone — the star in the head). */
function legendOrigin(ctx: FxCtx, ship: string): Pt {
  const p = plank(ctx, ship);
  const el = [p.querySelector('[data-fx-legend]'), p.querySelector('.star'), p.querySelector('.plank-head')].find(visible);
  const b = bx(ctx, el || p);
  return { x: b.cx, y: b.cy };
}

/**
 * The common entrance of a Legend. Returns the function of the leave (takes the bars and the caption away).
 * 0       — the price: kegs / Souls; a gold glow around the owner;
 * 120     — the film bars at the top and the bottom with a gold edge, the table darkens;
 * 280–780 — the card flies out of the badge «Легенда», turns (back → face), grows past its size;
 * 780     — the hit: a freeze of 80 ms, a flash, gold dust (26 bits), a ring, the table shakes 6 px;
 * 820     — the wax seal «ЛЕГЕНДА» falls on the card, the card quivers; the character goes «out of the frame»;
 * 900     — a shine runs over the card; two sparks circle its frame; gold motes rise from below;
 * 900     — the scroll unrolls: the name and the captain;
 * 1900    — the card, the seal and the scroll fly into the top bar and turn into the caption «ЛЕГЕНДА · …»,
 *           the bars get thinner, the darkening goes — the effect plays on the open table.
 */
export async function legendIntro(ctx: FxCtx, code: string, owner: string, { cost = 0, soulCost = 0 }: { cost?: number; soulCost?: number } = {}): Promise<() => Promise<void>> {
  const board = ctx.board;
  const W = board.clientWidth, H = board.clientHeight, k = Math.min(1, W / 640), uid = ++LG_UID;
  const c = legendCard(ctx.data, code), sh = shipData(ctx.data, owner);
  const cx = W / 2, cy = H * 0.42;
  hint(ctx, `${nick(ctx, owner)}: ЛЕГЕНДА «${c.name}»`);
  // the price
  if (cost) payKegs(ctx, sideOf(ctx, owner), cost, 0);
  // the glow around the owner
  const ob = bx(ctx, plank(ctx, owner));
  const aura = overlayAt(ctx, 'lg-aura', ob, 6);
  A(ctx, aura, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.8, offset: 0.7 }, { opacity: 0 }], 900, 0, 'ease-in-out');
  // the bars and the darkening
  const barH = Math.round(H * (W < 701 ? 0.075 : 0.11));
  const top = mk(ctx, 'lg-bar top', 0, 0), bot = mk(ctx, 'lg-bar bottom', 0, H - barH);
  for (const b of [top, bot]) { b.style.width = W + 'px'; b.style.height = barH + 'px'; }
  A(ctx, top, [{ opacity: 1, transform: 'translateY(-100%)' }, { opacity: 1, transform: 'none' }], 300, LG_T.bars, 'cubic-bezier(.2,.8,.3,1)');
  A(ctx, bot, [{ opacity: 1, transform: 'translateY(100%)' }, { opacity: 1, transform: 'none' }], 300, LG_T.bars, 'cubic-bezier(.2,.8,.3,1)');
  const veil = mk(ctx, 'lg-veil', 0, 0); veil.style.width = W + 'px'; veil.style.height = H + 'px';
  A(ctx, veil, [{ opacity: 0 }, { opacity: 1 }], 350, LG_T.bars);
  // the rays and the glow behind the card
  let sun: HTMLElement | null = null;
  if (ctx.rich) {
    sun = mk(ctx, 'lg-sun', cx, cy);
    A(ctx, sun, [{ opacity: 0, transform: 'scale(.5) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(25deg)', offset: 0.25 }, { opacity: 1, transform: 'scale(1.05) rotate(60deg)' }], 1700, LG_T.card + 200, 'linear');
  }
  const glow = mk(ctx, 'lg-glow', cx, cy);
  A(ctx, glow, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.45 }, { opacity: 0.85, transform: 'scale(1)' }], 900, LG_T.land - 250, 'ease-out');
  // the card
  const from = legendOrigin(ctx, owner);
  const S = W >= 900 ? 1.3 : W >= 640 ? 1.1 : Math.max(0.82, k);
  const card = mk(ctx, 'lg-card', 0, 0, lgCardHTML(ctx.data, code, owner, S));
  const pose = (x: number, y: number, ry: number, s: number, r = 0) => `translate(${x}px,${y}px) translate(-50%,-50%) perspective(900px) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`;
  const flight = A(ctx, card, [
    { opacity: 0, transform: pose(from.x, from.y, 180, 0.12, -10) },
    { opacity: 1, transform: pose(from.x, from.y, 180, 0.2, -10), offset: 0.08 },
    { opacity: 1, transform: pose((from.x + cx) / 2, Math.min(from.y, cy) - 60, 90, S * 0.75, -4), offset: 0.55 },
    { opacity: 1, transform: pose(cx, cy, 0, S * 1.12, 0), offset: 0.86 },
    { opacity: 1, transform: pose(cx, cy, 0, S, 0) },
  ], LG_T.land - LG_T.card + 80, LG_T.card, 'cubic-bezier(.3,0,.25,1)');
  // the hit: a freeze — the card stops in its overshoot for 80 ms («hit-stop»), a flash, dust, a ring, a shake
  at(ctx, LG_T.land, () => { flight.pause(); setTimeout(() => flight.play(), ms(ctx, 80)); });
  flash(ctx, cx, cy, LG_T.land, 3.2);
  ring(ctx, cx, cy, LG_T.land, 3, '#e0b44c');
  ring(ctx, cx, cy, LG_T.land + 120, 4.2, '#fff0b8');
  burst(ctx, 'gold-dust', cx, cy, LG_T.land, 26, 70 * k, 190 * k, 900);
  at(ctx, LG_T.land, () => shake(ctx, board, 0, 6, 200));
  // «the character goes out of the frame»
  const popEl = card.querySelector('.lg-pop')!;
  A(ctx, popEl, [{ opacity: 0, transform: 'translateY(26px) scale(.6)' }, { opacity: 1, transform: 'translateY(-4px) scale(1.12)', offset: 0.7 }, { opacity: 1, transform: 'translateY(0) scale(1)' }], 420, LG_T.land + 60, 'cubic-bezier(.2,.8,.3,1.3)');
  // the seal
  const cardH = 230 * S;
  const sealPos = { x: cx + 100 * S, y: cy - cardH / 2 + 92 * S }; // the right edge, at the picture — it does not cover the name
  const seal = mk(ctx, 'lg-seal', 0, 0, sealSVG(uid));
  A(ctx, seal, [{ opacity: 0, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${2.8 * S}) rotate(-35deg)` }, { opacity: 1, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${0.82 * S}) rotate(-10deg)`, offset: 0.8 }, { opacity: 1, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${0.9 * S}) rotate(-12deg)` }], 260, LG_T.seal, 'cubic-bezier(.6,0,.9,.6)');
  burst(ctx, 'dust', sealPos.x, sealPos.y, LG_T.seal + 210, 10, 14 * k, 40 * k, 500);
  at(ctx, LG_T.seal + 210, () => A(ctx, card, [{ translate: '0 0' }, { translate: '-3px 2px' }, { translate: '3px -1px' }, { translate: '0 0' }], 160, 0, 'linear', 'none'));
  // the shine, the sparks over the frame, the motes
  const shine = card.querySelector('.shine')!;
  A(ctx, shine, [{ transform: 'translateX(-60%)' }, { transform: 'translateX(60%)' }], 650, LG_T.seal - 40, 'ease-in-out', 'forwards');
  A(ctx, shine, [{ transform: 'translateX(-60%)' }, { transform: 'translateX(60%)' }], 650, LG_T.leave - 450, 'ease-in-out', 'forwards');
  if (ctx.rich) {
    const hw = 103 * S, hh = cardH / 2;
    const corners: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]];
    for (const [ph, d] of [[0, 1], [2, -1]]) {
      const sp = mk(ctx, 'sparkle lg-orbit', 0, 0);
      const seq = [...corners.slice(ph), ...corners.slice(1, ph + 1)];
      if (d < 0) seq.reverse();
      A(ctx, sp, seq.map(([x, y], i) => ({ offset: i / (seq.length - 1), opacity: 1, transform: `translate(${cx + x}px,${cy + y}px) scale(1.4)` })), 1100, LG_T.land + 100, 'linear');
      A(ctx, sp, seq.map(([x, y], i) => ({ offset: i / (seq.length - 1), opacity: i === seq.length - 1 ? 0 : 1, transform: `translate(${cx + x}px,${cy + y}px) scale(1.4)` })), 1100, LG_T.land + 1200, 'linear', 'forwards');
    }
    for (let q = 0; q < 16; q++) {
      const m = mk(ctx, 'gold-dust', 0, 0);
      const x = cx + (Math.random() - 0.5) * 300 * k, y = cy + cardH / 2 + 20;
      A(ctx, m, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.6)` }, { opacity: 1, offset: 0.25 }, { opacity: 0, transform: `translate(${x + (Math.random() - 0.5) * 40}px,${y - 140 - Math.random() * 90}px) scale(1.2)` }], 1300 + Math.random() * 500, LG_T.land + q * 55, 'ease-out');
    }
  }
  // the scroll with the name
  const ty = Math.min(H - barH - 34, cy + cardH / 2 + 30);
  const title = mk(ctx, 'lg-title', cx, ty, `<div class="scroll"><div class="t">${esc(c.name)}</div><div class="s">${esc(sh.name)} · ${esc(sh.captain)}</div></div>`);
  title.style.transform = `translate(-50%,-50%) scale(${k < 0.8 ? 0.82 : 1})`;
  A(ctx, title, [{ opacity: 0 }, { opacity: 1 }], 150, LG_T.title);
  A(ctx, title.querySelector('.scroll')!, [{ transform: 'scaleX(0.04)' }, { transform: 'scaleX(1.04)', offset: 0.8 }, { transform: 'scaleX(1)' }], 380, LG_T.title, 'cubic-bezier(.2,.8,.3,1)');
  A(ctx, title.querySelector('.t')!, [{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 1, transform: 'scale(1)' }], 300, LG_T.title + 150, 'ease-out');
  A(ctx, title.querySelector('.s')!, [{ opacity: 0 }, { opacity: 1 }], 250, LG_T.title + 300);
  // the Souls of «Кракен» feed the card
  if (soulCost) {
    const badge = plank(ctx, owner).querySelector('[data-fx-souls]');
    const sb = badge && visible(badge) ? bx(ctx, badge) : ob;
    for (let q = 0; q < soulCost; q++) wisp(ctx, { x: sb.cx, y: sb.cy }, { x: cx, y: cy }, LG_T.card + q * 140, 700);
    // game (S1): a short mark at the badge, not the label «−N Души» over the plank
    if (badge && visible(badge)) badgeMark(ctx, badge, `−${soulCost}`, LG_T.card);
  }
  // the leave into the top bar
  const capY = barH / 2;
  A(ctx, card, [{ opacity: 1, transform: pose(cx, cy, 0, S) }, { opacity: 0, transform: pose(cx, capY, 0, 0.16) }], 380, LG_T.leave, 'cubic-bezier(.5,0,.75,0)', 'forwards');
  A(ctx, seal, [{ opacity: 1, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${0.9 * S}) rotate(-12deg)` }, { opacity: 0, transform: `translate(${cx + 20}px,${capY}px) scale(.2) rotate(-12deg)` }], 380, LG_T.leave, 'cubic-bezier(.5,0,.75,0)', 'forwards');
  A(ctx, title, [{ opacity: 1, transform: `translate(-50%,-50%) scale(${k < 0.8 ? 0.82 : 1})` }, { opacity: 0, transform: `translate(-50%,-50%) translateY(${capY - ty}px) scale(.3)` }], 380, LG_T.leave, 'cubic-bezier(.5,0,.75,0)', 'forwards');
  A(ctx, veil, [{ opacity: 1 }, { opacity: 0 }], 350, LG_T.leave + 80, 'ease-in', 'forwards');
  A(ctx, glow, [{ opacity: 0.85 }, { opacity: 0 }], 350, LG_T.leave, 'ease-in', 'forwards');
  if (sun) A(ctx, sun, [{ opacity: 1, transform: 'scale(1.05) rotate(60deg)' }, { opacity: 0, transform: 'scale(1.2) rotate(75deg)' }], 380, LG_T.leave, 'ease-in', 'forwards');
  // the bars thinner, the caption in the top bar
  const thin = 0.55;
  A(ctx, top, [{ transform: 'none' }, { transform: `scaleY(${thin})` }], 300, LG_T.leave + 150, 'ease-in-out', 'forwards');
  A(ctx, bot, [{ transform: 'none' }, { transform: `scaleY(${thin})` }], 300, LG_T.leave + 150, 'ease-in-out', 'forwards');
  const cap = mk(ctx, 'lg-cap', cx, (barH * thin) / 2, `<span>ЛЕГЕНДА</span> <b>${esc(c.name)}</b>`);
  A(ctx, cap, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.7)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], 300, LG_T.leave + 260, 'ease-out');
  await wait(ctx, LG_T.effect);
  return async () => {
    A(ctx, top, [{ transform: `scaleY(${thin})` }, { transform: 'translateY(-100%)' }], 320, 0, 'ease-in', 'forwards');
    A(ctx, bot, [{ transform: `scaleY(${thin})` }, { transform: 'translateY(100%)' }], 320, 0, 'ease-in', 'forwards');
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

/** The common effect of a Legend with no effect of its own: hits on the tracks by the events. */
export async function legendGeneric(c: LegendClip, ctx: FxCtx): Promise<void> {
  const units = damageUnits(ctx, c.effects || []);
  units.forEach((u, i) => { const p = fxPoint(ctx, u.ship, u.track, u.idx), t0 = i * 120; at(ctx, t0, () => setTrack(ctx, u.ship, u.track, u.v, '#c0392b')); flash(ctx, p.x, p.y, t0, 1.2); burst(ctx, 'splinter', p.x, p.y, t0, 8, 12, 36, 600); });
  damageMarks(ctx, units, units.length * 120 + 80);
  await wait(ctx, units.length * 120 + 1000);
}

/** The effects of the Legends by the code of the card. */
export const LG: Record<string, (c: LegendClip, ctx: FxCtx) => Promise<void>> = {};

const playLegend = async (c: LegendClip, ctx: FxCtx) => {
  const outro = await legendIntro(ctx, c.card, c.seat, { cost: c.cost, soulCost: c.soulCost });
  await (LG[c.card] || legendGeneric)(c, ctx);
  await outro();
};

export const PLAY_LEGENDS = { legend: playLegend as unknown as ClipPlayer };
