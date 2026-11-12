// 03 — the four ship boards, one landscape A4 each (docs/tasks/print-kit.md 3.5, summary 0а.8; PnP 0.3 pp. 6–9).
// Two layouts for the user to choose from: 'top' — the ship picture in a header across the sheet, 'side' — the picture
// in the right column above the abilities (it shrinks when the text needs the room, the text never does).
// Everything is vector: the sheet's line art is one SVG in millimetres, prose is HTML in mm and pt.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { HERE, ROOT, data, esc, rich, RICH_CSS, type Ctx, type PageSpec, type Part } from '../kit';
import { BOARD, priceOf, trackCells, type Ship } from '../layout';
import { BRASS, BRASS_DARK, DECK_KEY, INK, PARCHMENT, SEA, TYPE, contrast, darken, lighten } from '../colors';
import { iconImg } from '../icons';

const require = createRequire(import.meta.url);
/** The ships of the art kit (tools/card-art/scenes/kit/ship.cjs): the same ships as on the card backs. */
const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship(u: string, L: unknown, o: Record<string, unknown>): string; makeLight(l: unknown, cam: { horizon: number }): unknown;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number }; LIGHTS: Record<string, unknown>;
};
/** A board's ship: a transparent picture in plain daylight (the sheet is paper, not a night scene), its bottom edge is the waterline. */
interface ShipPic { url: string; w: number; h: number }
async function kitShip(ctx: Ctx, key: string): Promise<ShipPic> {
  const kind = key === 'dutchman' ? 'dutch' : key, at = { x: 100, y: 180, scale: 1 }, b = K.shipBox(kind, at), m = 3, w = b.w + 2 * m, h = b.h + m, px = 320;
  const body = K.ship('bo' + kind, K.makeLight(K.LIGHTS.endeavour, { horizon: 170 }), { kind, ...at });
  const url = await ctx.raster('board-ship-' + kind, `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${Math.round(px * h / w)}" viewBox="${r(b.x0 - m)} ${r(b.top - m)} ${r(w)} ${r(h)}">${body}</svg>`, px, Math.round(px * h / w), 4);
  return { url, w, h };
}
/** The picture fitted into maxW × maxH, centred on cx, standing on the waterline wy (sunk a hair so the wave in front covers the cut). */
const shipImage = (pic: ShipPic, cx: number, wy: number, maxW: number, maxH: number) => {
  const k = Math.min(maxW / pic.w, maxH / pic.h), w = pic.w * k, h = pic.h * k;
  return `<image href="${pic.url}" x="${r(cx - w / 2)}" y="${r(wy - h + k)}" width="${r(w)}" height="${r(h)}"/>`;
};

export type BoardVariant = 'top' | 'side';
/** The layout of 03-planshety.pdf. 'side': the picture is 55 mm high on all four boards (39 mm in 'top'), the sheet is
 * filled evenly, and a longer text would shrink the picture instead of running out of the column. */
export const BOARD_DEFAULT: BoardVariant = 'side';

interface TrackText { name: string; note?: string; zero?: string; start?: string; max?: string }
interface BoardText {
  title: string;
  tracks: Record<'hull' | 'sails' | 'guns' | 'crew' | 'souls', TrackText>;
  abilities: string; legend: string; legendNote: string; tips: string;
  plans: { title: string; note: string }; fires: { title: string; note: string }; underwater: { title: string };
  footer: string[];
}
const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/boards.json'), 'utf8')) as BoardText;
const RULES = data.rules as Record<string, number>;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
/** No line break between a number and its unit, or before a number that ends a phrase: «1 Порох», «максимум 5)». */
const nb = (s: string) => s.replace(/(\d) (?=[«А-Яа-яЁё])/g, '$1\u00a0').replace(/([А-Яа-яЁё]) (?=\d+[).,;:])/g, '$1\u00a0');
/** rich() of the data's text with those spaces; the digit, the flask and the word «Души» stay on one line. */
const richNb = (s: string) => rich(nb(s)).replace(/\d+ <img class="s-i"[^>]*><span class="s-w"[^>]*>[^<]*<\/span>/g, m => `<span class="bo-nb">${m}</span>`);

// ---- geometry, mm ----
const PAGE = { w: 297, h: 210 };
/** Content inset. The frame's outer edge is 8 mm from the sheet's edge (printers' margins), its brass hairline at 9.6. */
const EDGE = 11.2;
/** The text column, 84 mm (≈ BOARD.textCol): inside the 8 mm frame 274.6 mm are left for the 187 mm track and the column. */
const COL = { x: PAGE.w - EDGE - (BOARD.textCol - 1), w: BOARD.textCol - 1 };
/** The track zone: the longest track (13 cells, 187 mm) fills it exactly. */
const LEFT = { x: EDGE, r: COL.x - 3.6 };
const HEAD_H: Record<BoardVariant, number> = { top: 42, side: 22 };
const BODY_GAP = 4, BODY_END = 188.6, FOOT_LINE = 191.2;
/** One track from its top: the label's baseline, the small numbers' baseline, the cells' centre, the height. */
const TR = { label: 4.3, small: 8.9, cy: 9.8 + BOARD.cell / 2, h: 9.8 + BOARD.cell, soulsExtra: 3.6 };
const SLOT_HEAD = 6.6, SLOT_PAD = 3;

const pt = (n: number) => n * 25.4 / 72;
const r = (n: number) => Math.round(n * 100) / 100;

// ---- colours ----
const PAPER = '#fdf9ec', CREAM = '#fff8e6', SOFT = '#5a4630', CELL = '#fffdf6', FLOOR = '#ebe2cf';
const SINK = { fill: '#f6d8cc', line: '#a8442f', text: '#8a2c1a' };
const FIRE = { fill: '#fdf0e4', line: TYPE['ЗАРЯД'].t, text: TYPE['ЗАРЯД'].td, soft: '#f3c9a8' };
const WATER = { fill: '#eaf4f3', line: SEA.t, text: SEA.td, soft: '#bfdfe0' };
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
interface Pal { ship: string; deep: string; solid: string; tint: string; line: string; sky: string; sea: [string, string, string] }
/** The ship colour of the data and what is derived from it: deep — readable as text on parchment, solid — under cream text. */
function palette(color: string): Pal {
  let deep = color, solid = color;
  for (let k = 0.05; contrast(deep, PARCHMENT) < 5.5 && k < 0.7; k += 0.05) deep = darken(color, k);
  for (let k = 0.05; contrast(solid, CREAM) < 4.5 && k < 0.7; k += 0.05) solid = darken(color, k);
  const sea = mix(color, '#6f9aa6', 0.6);
  return { ship: color, deep, solid, tint: lighten(color, 0.93), line: lighten(color, 0.45), sky: lighten(sea, 0.88), sea: [lighten(sea, 0.76), lighten(sea, 0.64), lighten(sea, 0.5)] };
}

// ---- SVG pieces ----
let UID = 0;
/** A five-point star: the fonts have no ★ (README rule 3). */
function star(cx: number, cy: number, R: number, color: string): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.42 : R; p.push(`${r(cx + q * Math.cos(a))},${r(cy + q * Math.sin(a))}`); }
  return `<polygon points="${p.join(' ')}" fill="${color}"/>`;
}
/** A band of sea from a wavy crest at y down to bottom. */
function waves(x0: number, x1: number, y: number, amp: number, len: number, shift: number, bottom: number): string {
  let d = `M${r(x0 - shift)} ${r(bottom)}V${r(y)}`;
  for (let x = x0 - shift, i = 0; x < x1; x += len, i++) d += `q${r(len / 4)} ${r(i % 2 ? amp : -amp)} ${r(len / 2)} 0t${r(len / 2)} 0`;
  return d + `V${r(bottom)}Z`;
}
interface TextOpt { font?: string; w?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; ls?: string; italic?: boolean }
const text = (x: number, y: number, s: string, size: number, o: TextOpt = {}) =>
  `<text x="${r(x)}" y="${r(y)}" font-family="${o.font ?? 'Alegreya Sans'}" font-weight="${o.w ?? 500}"${o.italic ? ' font-style="italic"' : ''} font-size="${r(pt(size))}" fill="${o.color ?? INK}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;

interface Track { key: keyof BoardText['tracks']; cells: number[]; start: number }
const trackHeight = (t: Track) => TR.h + (t.key === 'souls' ? TR.soulsExtra : 0);
/** Cells 0 … start (repairs never pass the start); Crew never drops below 1 (PnP p. 6–9), so its track begins at 1. */
function tracksOf(ship: Ship): Track[] {
  const list: Track[] = [
    { key: 'hull', cells: trackCells(ship.hull), start: ship.hull },
    { key: 'sails', cells: trackCells(ship.sails), start: ship.sails },
    { key: 'guns', cells: trackCells(ship.guns), start: ship.guns },
    { key: 'crew', cells: trackCells(ship.crew).filter(n => n >= 1), start: ship.crew }
  ];
  if (ship.souls != null) list.push({ key: 'souls', cells: trackCells(ship.souls), start: ship.start_souls ?? 0 });
  return list;
}
function trackSvg(x: number, y: number, t: Track, pal: Pal): string {
  const T = TXT.tracks[t.key], R = BOARD.cell / 2, cy = y + TR.cy, souls = t.key === 'souls';
  const cx = (i: number) => x + R + i * BOARD.pitch, last = t.cells.length - 1;
  const out: string[] = [];
  out.push(`<text x="${r(x)}" y="${r(y + TR.label)}"><tspan font-family="Alegreya SC" font-weight="800" font-size="${r(pt(13.5))}" fill="${pal.deep}" letter-spacing=".03em">${esc(T.name)}</tspan>${T.note ? `<tspan dx="2.4" font-family="Alegreya Sans" font-weight="500" font-size="${r(pt(9))}" fill="${SOFT}">${esc(T.note)}</tspan>` : ''}</text>`);
  out.push(`<line x1="${r(cx(0))}" y1="${r(cy)}" x2="${r(cx(last))}" y2="${r(cy)}" stroke="${BRASS}" stroke-width=".5"/>`);
  t.cells.forEach((n, i) => {
    const x0 = cx(i), isStart = n === t.start, sink = t.key === 'hull' && n === 0;
    const bg = sink ? SINK.fill : i === 0 ? FLOOR : souls && n > t.start ? lighten(pal.ship, 0.9 - 0.07 * (n - t.start - 1)) : CELL;
    out.push(`<circle cx="${r(x0)}" cy="${r(cy)}" r="${r(isStart ? R - 0.45 : R - 0.2)}" fill="${bg}" stroke="${isStart ? pal.ship : sink ? SINK.line : BRASS_DARK}" stroke-width="${isStart ? 0.9 : 0.4}"/>`);
    // the same number above the cell, 9 pt: the only one in sight under an 11 mm marker
    out.push(text(x0, y + TR.small, String(n), 9, { w: 700, color: SOFT, anchor: 'middle' }));
    out.push(text(x0, cy + (sink ? 0.1 : pt(9) * 0.33), String(n), 9, { w: isStart ? 800 : 700, color: sink ? SINK.text : INK, anchor: 'middle' }));
    if (sink && T.zero) out.push(text(x0, cy + 3.6, T.zero.toUpperCase(), 6.5, { w: 800, color: SINK.text, anchor: 'middle', ls: '.04em' }));
    if (isStart && !souls) out.push(`<circle cx="${r(x0 + 5.1)}" cy="${r(cy - 4.5)}" r="2.5" fill="${PAPER}" stroke="${pal.ship}" stroke-width=".35"/>` + star(x0 + 5.1, cy - 4.45, 1.85, pal.deep));
    if (isStart && souls && T.start) out.push(text(x0, cy + R + 2.9, T.start, 8, { w: 700, color: pal.deep, anchor: 'middle' }));
  });
  if (souls && T.max) out.push(text(cx(last) + R + 3, cy + pt(9) * 0.33, fill(T.max, { n: t.cells[last] }), 9, { w: 700, color: SOFT }));
  return out.join('');
}

/** The middle column, to the right of the short tracks: places for tokens (and the tips in 'side'). */
const MID = { x: LEFT.r - 80, w: 80, gap: 4 };
interface Slot { h: number; c: { fill: string; line: string; text: string }; title: string; note?: string; art: string }
/** A titled box of the middle column: its lines are SVG in mm, its lettering HTML. */
const slotHtml = (s: Slot) => `<div class="bo-slot" style="height:${r(s.h)}mm;color:${s.c.text}"><svg viewBox="0 0 ${MID.w} ${r(s.h)}"><rect x=".2" y=".2" width="${MID.w - 0.4}" height="${r(s.h - 0.4)}" rx="2.2" fill="${s.c.fill}" stroke="${s.c.line}" stroke-width=".4"/>${s.art}</svg><div class="bo-st">${esc(s.title)}</div>${s.note ? `<div class="bo-sn">${esc(nb(s.note))}</div>` : ''}</div>`;
const dashed = (x: number, y: number, w: number, h: number, color: string) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="2" fill="${PAPER}" stroke="${color}" stroke-width=".35" stroke-dasharray="1.4 1"/>`;
const FLAME = 'M0 -5.2C2.3 -2.6 4 -0.8 4 1.6a4 4 0 0 1 -8 0c0 -1.7 0.9 -3 2 -4.2c0.3 1.3 0.9 2 1.7 2.1c0.9 -1.4 0.9 -3 0.3 -4.7z';
/** Three Fire tokens of 20 × 20 mm (PnP p. 8–9) under a two-line reminder of the Fire rule (review-player 3.2). */
function firesSlot(): Slot {
  const s = BOARD.fireSlot, n = RULES.maxFires, gap = 5, x0 = (MID.w - n * s - (n - 1) * gap) / 2, top = SLOT_HEAD + 8.4;
  const art = Array.from({ length: n }, (_, i) => { const sx = x0 + i * (s + gap); return dashed(sx, top, s, s, FIRE.line) + `<path transform="translate(${r(sx + s / 2)} ${r(top + s / 2 + 0.6)}) scale(1.25)" d="${FLAME}" fill="${FIRE.soft}"/>`; }).join('');
  return { h: top + s + SLOT_PAD, c: FIRE, title: fill(TXT.fires.title, { n }), note: TXT.fires.note, art };
}
/** The «Под водой» token, 52 × 27 mm. */
function underwaterSlot(): Slot {
  const s = BOARD.underwaterSlot, sx = (MID.w - s.w) / 2;
  const ripples = [0.36, 0.54, 0.72].map((k, i) => `<path d="M${r(sx + 11 + (i % 2) * 4)} ${r(SLOT_HEAD + s.h * k)}${'q2.2 -1.6 4.4 0t4.4 0'.repeat(3)}" fill="none" stroke="${WATER.soft}" stroke-width=".6" stroke-linecap="round"/>`).join('');
  return { h: SLOT_HEAD + s.h + SLOT_PAD, c: WATER, title: TXT.underwater.title, art: dashed(sx, SLOT_HEAD, s.w, s.h, WATER.line) + ripples };
}
/** Plans lie beside the board (PnP p. 6): a caption only — nothing that looks like a place for the cards. */
function plansSlot(pal: Pal): Slot {
  return { h: 13.4, c: { fill: lighten(pal.ship, 0.94), line: pal.line, text: pal.deep }, title: fill(TXT.plans.title, { n: RULES.plansMax }), note: TXT.plans.note, art: '' };
}
/** A pale wind rose for the empty sea of the middle column. */
function rose(cx: number, cy: number, R: number): string {
  const c1 = mix(PAPER, BRASS, 0.24), c2 = mix(PAPER, BRASS, 0.12), out: string[] = [];
  const at = (a: number, d: number) => `${r(cx + d * Math.cos(a))},${r(cy + d * Math.sin(a))}`;
  out.push(`<circle cx="${cx}" cy="${r(cy)}" r="${r(R * 0.74)}" fill="none" stroke="${c1}" stroke-width=".3"/><circle cx="${cx}" cy="${r(cy)}" r="${r(R * 0.8)}" fill="none" stroke="${c1}" stroke-width=".3"/><circle cx="${cx}" cy="${r(cy)}" r="${r(R * 0.42)}" fill="none" stroke="${c2}" stroke-width=".3"/>`);
  for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16; out.push(`<line x1="${at(a, R * 0.74).replace(',', '" y1="')}" x2="${at(a, R * 0.8).replace(',', '" y2="')}" stroke="${c1}" stroke-width=".25"/>`); }
  for (const [off, len, wid] of [[Math.PI / 8, 0.56, 0.1], [Math.PI / 4, 0.74, 0.14], [0, 1, 0.17]] as const) for (let i = 0; i < (off === Math.PI / 8 ? 8 : 4); i++) {
    const a = off + i * (off === Math.PI / 8 ? Math.PI / 4 : Math.PI / 2) - Math.PI / 2, w = R * wid * Math.SQRT2;
    out.push(`<polygon points="${at(a, 0)} ${at(a - Math.PI / 4, w)} ${at(a, R * len)}" fill="${c1}"/><polygon points="${at(a, 0)} ${at(a + Math.PI / 4, w)} ${at(a, R * len)}" fill="${PAPER}" stroke="${c1}" stroke-width=".25" stroke-linejoin="round"/>`);
  }
  return out.join('');
}

/** The ship's letter on its colour: the same sign as on its track markers. */
const medallion = (cx: number, cy: number, R: number, ship: Ship, pal: Pal) =>
  `<circle cx="${r(cx)}" cy="${r(cy)}" r="${R}" fill="${pal.solid}" stroke="${BRASS}" stroke-width=".6"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R - 1.3)}" fill="none" stroke="${CREAM}" stroke-width=".2"/>` +
  text(cx, cy + pt(21) * 0.31, ship.code, 21, { font: 'Alegreya SC', w: 800, color: CREAM, anchor: 'middle' });

/** 'top': a light sky and a strip of sea across the sheet, the ship on it at the right. */
function headerTop(ship: Ship, pal: Pal, pic: ShipPic): string {
  const x = EDGE, y = EDGE, w = PAGE.w - 2 * EDGE, h = HEAD_H.top, id = `bo-h${++UID}`, wy = y + h - 4.6, sx = x + w - 8 - 30;
  return `<defs><clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="${PAPER}"/><stop offset="1" stop-color="${pal.sky}"/></linearGradient></defs>
<g clip-path="url(#${id}c)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}g)"/>
<rect x="${x}" y="${r(wy - 3.6)}" width="${w}" height="12" fill="${pal.sea[0]}"/><path d="${waves(x, x + w, wy - 1.7, 0.5, 9, 3, y + h)}" fill="${pal.sea[1]}"/>
${shipImage(pic, sx, wy, 62, h - 6.6)}
<path d="${waves(x, x + w, wy + 1.1, 0.55, 12, 7, y + h)}" fill="${pal.sea[2]}"/><rect x="${x}" y="${r(y + h - 1.2)}" width="${w}" height="1.2" fill="${pal.ship}"/></g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="none" stroke="${BRASS}" stroke-width=".3"/>${medallion(x + 12, y + 14, 8.4, ship, pal)}`;
}
/** 'side': a slim header — the medallion, the name, a rule of the ship colour. */
function headerSide(ship: Ship, pal: Pal): string {
  const x = EDGE, y = EDGE, w = PAGE.w - 2 * EDGE, h = HEAD_H.side;
  return `${medallion(x + 9.4, y + 9.6, 8.4, ship, pal)}<rect x="${x}" y="${r(y + h - 1.6)}" width="${w}" height="1.1" fill="${pal.ship}"/><line x1="${x}" y1="${r(y + h)}" x2="${x + w}" y2="${r(y + h)}" stroke="${BRASS}" stroke-width=".25"/>`;
}
function headerHtml(ship: Ship, pal: Pal, variant: BoardVariant): string {
  const name = `<span class="bo-name" style="color:${pal.deep}">${esc(ship.name)}</span>`, side = `<span class="bo-side" style="background:${pal.solid}">${esc(ship.side)}</span>`;
  const cap = `<div class="bo-cap">${esc(ship.captain)}</div>`, motto = `<div class="bo-motto">${esc(ship.motto)}</div>`;
  if (variant === 'top') return `<div class="bo-abs bo-title" style="left:${EDGE + 24}mm;top:${EDGE + 4.2}mm"><div class="bo-nl">${name}${side}</div>${cap}${motto}</div>`;
  return `<div class="bo-abs bo-title" style="left:${EDGE + 21}mm;top:${EDGE + 0.6}mm"><div class="bo-nl">${name}</div>${cap}</div>
<div class="bo-abs bo-title bo-tr" style="right:${EDGE}mm;top:${EDGE + 2.2}mm">${side}${motto}</div>`;
}
/** 'side': the picture in the column; the sea stretches to the box, the ship keeps its shape and stands on the same waterline. */
function shipPicture(ship: Ship, pal: Pal, pic: ShipPic): string {
  const id = `bo-p${++UID}`;
  return `<div class="bo-pic" style="border-color:${BRASS}">
<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="${PAPER}"/><stop offset=".85" stop-color="${pal.sky}"/></linearGradient></defs><rect width="100" height="100" fill="url(#${id})"/><rect y="82" width="100" height="18" fill="${pal.sea[0]}"/><path d="${waves(0, 100, 85.4, 0.8, 9, 2, 100)}" fill="${pal.sea[1]}"/></svg>
<svg viewBox="0 0 130 84" preserveAspectRatio="xMidYMax meet">${shipImage(pic, 65, 74, 122, 70)}</svg>
<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${waves(0, 100, 90.4, 0.9, 12, 5, 100)}" fill="${pal.sea[2]}"/><rect y="97.6" width="100" height="2.4" fill="${pal.ship}"/></svg>
</div>`;
}

const tipsBox = (ship: Ship) => `<div class="bo-box bo-how"><div class="bo-h">${esc(fill(TXT.tips, { ship: ship.name }))}</div><ul class="bo-tips">${ship.tips.map(t => `<li>${richNb(t)}</li>`).join('')}</ul></div>`;

/** The right column: (the picture,) the abilities, the Legend, the tips — in the data's words. */
function column(ctx: Ctx, ship: Ship, pal: Pal, top: number, variant: BoardVariant, pic: ShipPic): string {
  const legend = data.legends[ship.code], price = priceOf(legend);
  const icons = [price.powder ? `coin-${price.powder}` : '', price.soul ? `flask-${price.soul}` : ''].filter(Boolean);
  const d = 8.2, iconHtml = icons.map((n, i) => iconImg(ctx, n, COL.w - 3 - d - i * (d + 1.4), 2.2, d)).join('');
  return `<div class="bo-col bo-txt" style="left:${COL.x}mm;top:${r(top)}mm;width:${COL.w}mm;height:${r(BODY_END - top)}mm;--c:${pal.deep}">
${variant === 'side' ? shipPicture(ship, pal, pic) : ''}
<div class="bo-box" style="background:${pal.tint};border-color:${pal.line}"><div class="bo-h">${esc(TXT.abilities)}</div>${ship.abilities.map(a => `<div class="bo-an">${esc(a.name)}</div><div class="bo-p">${richNb(a.text)}</div>`).join('')}</div>
<div class="bo-box bo-legend">${iconHtml}<div class="bo-lh" style="padding-right:${r(icons.length * (d + 1.4) + 1)}mm"><div class="bo-h">${esc(TXT.legend)}</div><div class="bo-ln">${esc(legend.name)}</div></div><div class="bo-p">${richNb(legend.text)}</div><div class="bo-note">${esc(TXT.legendNote)}</div></div>
${variant === 'top' ? tipsBox(ship) : ''}
</div>`;
}

function footer(ship: Ship, pal: Pal): string {
  const diag = (ship.diagDamage as { offset: number } | undefined)?.offset ?? 0;
  const parts = TXT.footer.map(s => esc(fill(s, { cost: Number(ship.volleyCost), diag: `${diag < 0 ? '−' : '+'}${Math.abs(diag)}`, joint: RULES.jointBonus })));
  return `<div class="bo-abs bo-foot" style="left:${EDGE}mm;top:${r(FOOT_LINE + 1.5)}mm;width:${PAGE.w - 2 * EDGE}mm"><svg viewBox="-2 -2 4 4">${star(0, 0.1, 2, pal.deep)}</svg>${parts.map(p => `<span>${p}</span>`).join('<i>·</i>')}</div>`;
}

export async function boardPage(ctx: Ctx, ship: Ship, variant: BoardVariant): Promise<PageSpec> {
  const pal = palette(ship.color), bodyTop = EDGE + HEAD_H[variant] + BODY_GAP, id = `bo-b${++UID}`, pic = await kitShip(ctx, DECK_KEY[ship.code]);
  const svg: string[] = [], html: string[] = [];
  // the sheet: parchment inside a frame of the ship colour with a brass hairline
  svg.push(`<defs><radialGradient id="${id}" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="${PAPER}"/><stop offset="1" stop-color="${PARCHMENT}"/></radialGradient></defs>
<rect x="8.5" y="8.5" width="${PAGE.w - 17}" height="${PAGE.h - 17}" rx="3.4" fill="url(#${id})" stroke="${pal.ship}" stroke-width="1"/><rect x="9.6" y="9.6" width="${r(PAGE.w - 19.2)}" height="${r(PAGE.h - 19.2)}" rx="2.4" fill="none" stroke="${BRASS}" stroke-width=".25"/>`);
  svg.push(variant === 'top' ? headerTop(ship, pal, pic) : headerSide(ship, pal));
  html.push(headerHtml(ship, pal, variant));

  // tracks: spread evenly over the height of the body
  const tracks = tracksOf(ship), heights = tracks.map(trackHeight), sum = heights.reduce((a, b) => a + b, 0);
  const gap = Math.min(22, (BODY_END - bodyTop - sum) / (tracks.length - 1));
  const tops: number[] = []; let y = bodyTop;
  tracks.forEach((t, i) => { tops.push(y); svg.push(trackSvg(LEFT.x, y, t, pal)); y += heights[i] + gap; });

  // the middle column, beside the short tracks: token places; in 'side' the tips move here and leave the column to the picture
  const slots: Slot[] = [];
  if (ship.code === 'Ж') slots.push(plansSlot(pal));
  if (ship.side === 'КОМПАНИЯ') slots.push(firesSlot());
  if (ship.souls != null) slots.push(underwaterSlot());
  const midTop = tops[1] - 1, midH = BODY_END - midTop;
  if (slots.reduce((a, s) => a + s.h, 0) < 40 && variant === 'top') svg.splice(1, 0, rose(MID.x + MID.w / 2, midTop + midH / 2, 34));
  html.push(`<div class="bo-mid bo-txt" style="left:${MID.x}mm;top:${r(midTop)}mm;width:${MID.w}mm;height:${r(midH)}mm;--c:${pal.deep}">${slots.map(slotHtml).join('')}${variant === 'side' ? tipsBox(ship) : ''}</div>`);

  html.push(column(ctx, ship, pal, bodyTop, variant, pic));
  svg.push(`<line x1="${EDGE}" y1="${FOOT_LINE}" x2="${PAGE.w - EDGE}" y2="${FOOT_LINE}" stroke="${BRASS}" stroke-width=".25"/>`);
  html.push(footer(ship, pal));
  return { html: `<svg class="bo-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${svg.join('\n')}</svg>\n${html.join('\n')}`, land: true };
}

export const BOARD_CSS = `${RICH_CSS}
.bo-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.bo-abs{position:absolute}
.bo-nl{display:flex;align-items:center;gap:4.5mm;white-space:nowrap}
.bo-name{font:800 27pt/1 Alegreya,serif}
.bo-side{display:inline-block;font:800 9pt/1 'Alegreya Sans',sans-serif;letter-spacing:.16em;color:${CREAM};border-radius:1.1mm;padding:1.35mm 2.4mm 1.2mm 2.8mm}
.bo-cap{font:italic 500 12.5pt/1.15 Alegreya,serif;margin-top:1.1mm;white-space:nowrap}
.bo-motto{font:italic 400 11pt/1.2 Alegreya,serif;color:${SOFT};margin-top:.7mm;white-space:nowrap}
.bo-tr{text-align:right}
.bo-tr .bo-motto{margin-top:2.4mm}
.bo-txt{font:500 9.5pt/1.2 'Alegreya Sans',sans-serif;color:${INK}}
.bo-mid{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:${MID.gap}mm}
.bo-slot{position:relative;flex:none;box-sizing:border-box;padding:1.5mm ${SLOT_PAD}mm 0}
.bo-slot svg{position:absolute;left:0;top:0;width:100%;height:100%}
.bo-slot div{position:relative}
.bo-slot .bo-st{font:800 10pt/1.1 'Alegreya SC',serif;letter-spacing:.05em;white-space:nowrap}
.bo-nb{white-space:nowrap}
.bo-slot .bo-sn{font:500 9pt/1.15 'Alegreya Sans',sans-serif;color:${SOFT};margin-top:1.2mm}
.bo-col{position:absolute;display:flex;flex-direction:column;gap:2.4mm;overflow:hidden}
.bo-pic{position:relative;flex:0 1 55mm;min-height:0;box-sizing:border-box;border:.3mm solid;border-radius:1.6mm;overflow:hidden}
.bo-pic svg{position:absolute;left:0;top:0;width:100%;height:100%}
.bo-box{position:relative;flex:none;box-sizing:border-box;border:.3mm solid ${lighten(BRASS, 0.35)};border-radius:1.6mm;padding:2.2mm 3mm 2.5mm;background:${CELL}}
.bo-h{font:800 10.5pt/1.1 'Alegreya SC',serif;letter-spacing:.05em;color:var(--c);text-wrap:balance}
.bo-an{font:800 9.5pt/1.2 'Alegreya Sans',sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--c);margin-top:1.5mm}
.bo-legend{background:#fcf1d2;border-color:${BRASS}}
.bo-legend .bo-h{color:${darken(BRASS, 0.35)}}
.bo-lh{min-height:9.6mm;box-sizing:border-box}
.bo-ln{font:800 12.5pt/1.1 Alegreya,serif;margin-top:1.1mm}
.bo-legend .bo-p{margin-top:.9mm}
.bo-note{font:italic 400 9pt/1.2 Alegreya,serif;color:${SOFT};margin-top:1.1mm}
.bo-tips{margin:.6mm 0 0;padding:0;list-style:none}
.bo-tips li{position:relative;padding-left:3.2mm;margin-top:.9mm}
.bo-tips li::before{content:'•';position:absolute;left:.4mm;color:var(--c);font-weight:800}
.bo-foot{display:flex;justify-content:center;align-items:center;gap:2.2mm;font:500 9pt/1.2 'Alegreya Sans',sans-serif;color:${SOFT};white-space:nowrap}
.bo-foot svg{width:3mm;height:3mm;flex:none;margin-right:-.6mm}
.bo-foot i{font-style:normal;font-weight:800;color:${BRASS}}
`;

export async function build(ctx: Ctx): Promise<Part[]> {
  return [{ file: '03-planshety', title: TXT.title, css: BOARD_CSS, pages: await Promise.all(data.ships.map(ship => boardPage(ctx, ship, BOARD_DEFAULT))) }];
}
