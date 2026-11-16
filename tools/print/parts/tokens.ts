// 04 — the two holds and the tokens (docs/tasks/print-kit.md 3.6 with review-print 13–14 and review-player 3.1, 3.5,
// 3.7, 3.9; docs/tasks/print-kit-boards.md step 5). Portrait A4, one side.
//   sheet 1: «Трюм Пиратов», «Трюм Компании» (8 cells Ø 22 mm each and the cells «Перестроение», «Совместный залп +1»),
//            Powder × 24, Fire × 9, track markers × 17, «Под водой»
//   sheet 2: four ship tokens 30 × 30 mm and the identical marks 11 × 11 mm (TABLE.marks and TABLE.spareMarks)
//   sheet 3 (--counters strip): the four counter strips (parts/boards/v2.ts counterStripsPage)
// The «Схема боя» is a landscape sheet of its own: parts/scheme.ts → 04b-skhema-boya.pdf.
// The look is the world of the boards v2 and the battle scheme (parts/tokens-art.ts): parchment slips, brass rims and
// coins, the engraved icons of parts/icons.ts. Tokens are squares in grids without gaps: the cut lines are shared and
// run a few millimetres past the grid; nothing that matters is closer than 2 mm to a cut.
// Every plate is marked data-plate, every block of words data-in="<its plate>" (tools/print/check-layout.ts).
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, type Ctx, type PageSpec, type Part } from '../kit';
import { A4, COUNTS, DECKS, HOLD, TABLE, TOKEN, type Ship } from '../layout';
import { DECK_KEY, darken } from '../colors';
import { bigShip } from '../../../src/ui/game/art/bigShips';
import { createRequire } from 'node:module';
import { ROOT } from '../kit';
import { rasterJpeg } from '../map/raster';
import { counterStripsPage } from './boards/v2';
import { measureMissing, widthOf, type TO } from './boards/frame';
import { icon, TONE, type IconTone } from './icons';
import { schemePart } from './scheme';
import {
  ART_CSS, CREAM, LOOK, WELL, brassCell, brassDisc, brassRing, capWord, cartouche, deepOf, defs, flag, ico, mix, plaque, plateRect, pt, r, rivet,
  word, wordAt, type Rect, type WO
} from './tokens-art';

const require = createRequire(import.meta.url);
/** the kit ships (tools/card-art/scenes/kit): the same ships as on the card backs and the boards (--tokens new) */
const KIT = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship(u: string, L: unknown, o: Record<string, unknown>): string; makeLight(l: unknown, cam: { horizon: number }): unknown;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number }; LIGHTS: Record<string, unknown>;
};
/** the picture part of a ship token (above its band), mm */
const PIC = { w: 30, h: 21.4 };
/** a kit ship on the token's paper, a JPEG of PIC (no CSS filters in the PDF) */
async function kitTokenPics(ctx: Ctx): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const s of ships()) {
    const kind = DECK_KEY[s.code], b = KIT.shipBox(kind, { x: 0, y: 0, scale: 1 }), m = 1.2, wl = PIC.h - 1.4, k = Math.min((PIC.w - 2 * m) / b.w, (wl - m) / b.h);
    const body = KIT.ship('tk' + kind, KIT.makeLight(KIT.LIGHTS.endeavour, { horizon: wl - 2 }), { kind, x: PIC.w / 2 - k * (b.x0 + b.x1) / 2, y: wl, scale: k });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIC.w} ${PIC.h}"><rect width="${PIC.w}" height="${PIC.h}" fill="${PAPER}"/>${body}<path d="M1 ${wl + 0.5}q1.2 -.6 2.4 0${'t2.4 0'.repeat(11)}" fill="none" stroke="#6f8a96" stroke-width=".25"/></svg>`;
    out[s.code] = (await rasterJpeg(ctx.browser, 'token-ship-' + kind, svg, PIC.w, PIC.h, ctx.opts.draft ? 300 : 600, 0.92)).url;
  }
  return out;
}

interface HoldText { side: 'pirates' | 'company'; name: string; rule: string }
const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/tokens.json'), 'utf8')) as {
  partTitle: string; title: string; lead: string; hint: string; footer: string; holds: HoldText[];
  powder: string; fire: string; markers: string; underwaterCaption: string; underwater: { title: string; lines: string[] };
  page: string; holdCells: { regroup: string[]; joint: string[] };
  marksPage: { title: string; lead: string; ships: string; marks: string; uses: string[]; sweep: string };
  strips: { title: string; lead: string };
};
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

// ---- colours of this part
const PAPER = '#fbf6ea';        // the light ground of the token pictures (the kit ships)
const GROUND = '#f8f0dc';       // the light ground of the Powder, Fire and mark grids and of the holds
const SIDE_INK = { pirates: '#2b2420', company: darken('#8a6520', 0.4) };
const CUT = '#8c8c8c';          // cut lines on light grounds
const CUT_ON_DARK = '#e6e1d6';  // the same lines between two dark tokens
const CUT_W = 0.25;
/** numbers in empty hold cells: decoration, seen until a token covers them */
const FAINT = '#9a8458';
/** the field of the Fire coin: warm red-orange, so Fire and the cream Powder coins differ from across the table */
const FIRE_FIELD = '#ec8a52';
/** the engraved icons: sepia on parchment, the fire in red, the Souls in teal */
const SOUL_TONE: IconTone = { ink: '#0f3a33', mid: '#3f9a88', light: '#e6f6f1', paper: '#cfeee6' };
/** How far a cut line runs past its grid into the margin. */
const TICK = 4;

// ---- geometry of the sheets, mm
const HOLD_ROW = HOLD.cells * HOLD.cell + (HOLD.cells - 1) * HOLD.gap;            // 190
/** The cut line is 8 mm from the sheet edge; the cells start 2 mm inside it. The head of a hold (above sep) carries the
 * name, the rule and the two cells «Перестроение», «Совместный залп +1» (TABLE.cell) at cellY. */
const HOLD_BOX = { x: (A4.w - HOLD_ROW) / 2 - 2, y: 28, w: HOLD_ROW + 4, h: 46, cy: 30.6, pad: 2, tick: 3, sep: 18.1, cellY: 3.5 };
/** Captions stand CAP mm above their grid (clear of the grid's cut ticks); GAP — from the ticks of one grid to the next caption. */
const CAP = 8.8, GAP = 5;
const POWDER = { cols: 8, rows: 3, x: (A4.w - 8 * TOKEN.powder) / 2, y: HOLD_BOX.y + 2 * HOLD_BOX.h + GAP + CAP };
const FIRE = { cols: 9, rows: 1, x: (A4.w - 9 * TOKEN.fire) / 2, y: POWDER.y + 3 * TOKEN.powder + GAP + CAP };
/** Markers: 8 in the first row (Ж, М), 9 in the second (И, Г and the Soul marker). */
const MARK = { x: 11, y: FIRE.y + TOKEN.fire + GAP + CAP, perRow: 8 };
const UNDER = { x: 124, y: MARK.y };
// sheet 2
const SHIPS = { x: (A4.w - 4 * TOKEN.shipToken) / 2, y: 42 };
const MARKS = { cols: TABLE.marksPerRow, rows: (TABLE.marks + TABLE.spareMarks) / TABLE.marksPerRow, x: (A4.w - TABLE.marksPerRow * TOKEN.marker) / 2, y: SHIPS.y + TOKEN.shipToken + GAP + 4 + CAP };
/** the page header (a cartouche) and the footer line */
const HEAD = { x: 10, y: 5, w: 190, h: 19 };
const FOOT_Y = 286.2;

const ships = (): Ship[] => DECKS.map(code => data.ships.find(s => s.code === code)!);
const R = (n: number) => Math.round(n * 1000) / 1000;
const W = (s: string, size: number, o: TO = {}) => widthOf(s, size, o);

/** Cut lines of a grid cols × rows of cells w × h at (x, y): every line is shared and runs tick mm past the grid. */
const gridCuts = (x: number, y: number, cols: number, rows: number, w: number, h: number, tick = TICK): string => {
  let d = '';
  for (let c = 0; c <= cols; c++) d += `M${R(x + c * w)} ${R(y - tick)}V${R(y + rows * h + tick)}`;
  for (let rr = 0; rr <= rows; rr++) d += `M${R(x - tick)} ${R(y + rr * h)}H${R(x + cols * w + tick)}`;
  return `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/>`;
};
const cutLayer = (inner: string) => `<svg class="tk-cut" viewBox="0 0 ${A4.w} ${A4.h}" style="position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm">${inner}</svg>`;
const pageSvg = (inner: string) => `<svg class="tk-svg" viewBox="0 0 ${A4.w} ${A4.h}">${inner}</svg>`;

// ---- the page header and footer (also on the strips page of v2) ----
const TITLE_O: WO = { font: 'Alegreya SC', w: 800, size: 22, lh: 9.85, color: LOOK.ink };
const LEAD_O: WO = { font: 'Alegreya', italic: true, w: 400, size: 9.5, lh: 4.1, color: '#3f2f1c' };
const TAG_O: WO = { w: 700, size: 8, lh: 3, ls: '.1em', upper: true, color: LOOK.engrave };
const FOOT_O: WO = { w: 500, size: 7, lh: 2.8, ls: '.09em', upper: true, color: '#6b5a42' };
function head(id: string, title: string, lead: string, tag: string): string {
  const b = HEAD, cy = b.y + 6.5, tw = W(tag.toUpperCase(), TAG_O.size, { w: TAG_O.w, ls: TAG_O.ls }), pw = tw + 7.4;
  const pb = { x: b.x + b.w - 3.4 - pw, y: cy - 3.2, w: pw, h: 6.4 };
  const svg = defs(id) + cartouche('head', b, id) + plaque('head-tag', pb, id)
    // a brass rule under the title, a lozenge at its end
    + `<path d="M${r(b.x + 4)} ${r(b.y + 10.95)}H${r(b.x + 4 + W(title, TITLE_O.size, { font: TITLE_O.font, w: 800 }))}" stroke="${LOOK.brass[1]}" stroke-width=".45"/>`;
  return pageSvg(svg)
    + wordAt('head', b.x + 4, cy, title, TITLE_O)
    + wordAt('head-tag', pb.x + pw / 2, cy, tag, { ...TAG_O, anchor: 'middle' })
    + word('head', b.x + 4.2, b.y + 11.5, lead, LEAD_O);
}
function foot(n: number, of: number): string {
  const s = fill(TXT.footer, { n, of }), tw = W(s.toUpperCase(), FOOT_O.size, { w: FOOT_O.w, ls: FOOT_O.ls }), x = 12, x1 = x + tw + 3;
  const svg = plateRect('foot', { x: 9, y: FOOT_Y - 3, w: 192, h: 6 })
    + `<path d="M${r(x1)} ${FOOT_Y}H196" stroke="${LOOK.brass[1]}" stroke-width=".3"/><path d="M196 ${r(FOOT_Y - 1)}L197.2 ${FOOT_Y}L196 ${r(FOOT_Y + 1)}L194.8 ${FOOT_Y}Z" fill="${LOOK.brass[1]}"/>`;
  return pageSvg(svg) + wordAt('foot', x, FOOT_Y, s, FOOT_O);
}

// ---- captions over the grids: a small sign and the words ----
const CAP_O: WO = { font: 'Alegreya', w: 700, size: 10, lh: 4.2, color: LOOK.ink };
function caption(pid: string, x: number, gridY: number, s: string, sign: string): { svg: string; html: string } {
  const cy = gridY - 6.7, tx = x + 6.2, tw = W(s, CAP_O.size, { font: CAP_O.font, w: 700 });
  return {
    svg: plateRect(pid, { x: x - 1.6, y: cy - 3.7, w: tx - x + tw + 3.2, h: 7.4 }) + `<g data-plate="${pid}-sign">${sign}</g>`,
    html: wordAt(pid, tx, cy, s, CAP_O)
  };
}
const capSign = (x: number, gridY: number) => ({ cx: x + 2.3, cy: gridY - 6.7 });

// ---- holds ----
/** Перестроение: the two ships change places (own engraved line drawing, 24 units) */
const REGROUP = '<path d="M4 8.5H18.5M15 5L18.5 8.5L15 12M20 15.5H5.5M9 12L5.5 15.5L9 19"/>';
const lineIcon = (body: string, cx: number, cy: number, s: number, color: string, sw = 1.7) =>
  `<g transform="translate(${r(cx - s / 2)} ${r(cy - s / 2)}) scale(${r(s / 24)})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
/** a cell for one mark (TABLE.cell), the sign of what it counts engraved faintly inside: an inline SVG (its own plate) */
function markCell(pid: string, id: string, inner: (c: number) => string): string {
  const c = TABLE.cell;
  return `<svg data-plate="${pid}" viewBox="-.2 -.2 ${c + 0.8} ${c + 0.8}" style="width:${r(c + 0.8)}mm;height:${r(c + 0.8)}mm;margin:-.2mm -.6mm -.6mm -.2mm;flex:none;display:block">${brassCell(pid + '-r', 0, 0, c, id, { inner: inner(c) })}</svg>`;
}
const HC_B: WO = { w: 700, size: 9, lh: 3.6, color: LOOK.ink, align: 'right' };
function holdHtml(t: HoldText, i: number, rule: string, id: string): { svg: string; html: string } {
  const { x, w, h, cy, pad, sep, cellY } = HOLD_BOX, y = HOLD_BOX.y + i * h, side = t.side, ink = SIDE_INK[side], pid = `hold-${i}`, cr = HOLD.cell / 2;
  const svg: string[] = [];
  // the parchment, its double rule; the plate is the outer rule (1.2 mm inside the cut)
  svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${GROUND}"/>`);
  svg.push(`<rect data-plate="${pid}" x="${r(x + 1.2)}" y="${r(y + 1.2)}" width="${r(w - 2.4)}" height="${r(h - 2.4)}" rx="1.2" fill="url(#${id}paper)" fill-opacity=".55" stroke="${LOOK.paperLine}" stroke-opacity=".6" stroke-width=".25"/>`);
  svg.push(`<rect x="${r(x + 2)}" y="${r(y + 2)}" width="${r(w - 4)}" height="${r(h - 4)}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".5" stroke-width=".16"/>`);
  svg.push(`<path d="M${r(x + 3.6)} ${r(y + sep)}H${r(x + w - 3.6)}" stroke="${ink}" stroke-opacity=".5" stroke-width=".25"/>`);
  // the name and the side's flag after it
  const nameO: WO = { font: 'Alegreya SC', w: 800, size: 15, lh: 6, color: ink, ls: '.03em' }, nw = W(t.name, 15, { font: 'Alegreya SC', w: 800, ls: '.03em' });
  const fx = x + 4.2 + nw + 3.2;
  svg.push(flag(side, fx, y + 10.4, 1, 7.8, `${id}fl${i}`, `${pid}-flag`));
  // the eight cells: a brass ring round a recessed well, the number engraved faintly
  const html: string[] = [];
  for (let k = 0; k < HOLD.cells; k++) {
    const cx = x + pad + cr + k * (HOLD.cell + HOLD.gap), cyy = y + cy;
    svg.push(`<circle cx="${r(cx + 0.35)}" cy="${r(cyy + 0.5)}" r="${cr}" fill="#1a0e04" fill-opacity=".22"/>` + brassRing(`${pid}-c${k}`, cx, cyy, cr, 0.95, id, WELL));
    svg.push(`<circle cx="${r(cx)}" cy="${r(cyy)}" r="${r(cr - 2.4)}" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".35" stroke-width=".2" stroke-dasharray="1.2 .9"/>`);
    html.push(capWord(`${pid}-c${k}`, cx, cyy, String(k + 1), 4.8, { color: FAINT }));
  }
  html.push(wordAt(pid, x + 4.2, y + 7.3, t.name, nameO));
  html.push(word(pid, x + 4.2, y + 10.7, rule, { w: 500, size: 9, lh: 3.45, color: LOOK.ink, width: 88, style: 'text-wrap:balance' }));
  // the two cells of the head, the words right of each
  const group = (key: string, lines: string[], inner: (c: number) => string) => `<div class="tk-hc">`
    + `<div data-in="${pid}" class="tk-hc-l"><b>${esc(lines[0])}</b>${lines.slice(1).map(l => `<span>${esc(l)}</span>`).join('')}</div>${markCell(`${pid}-${key}`, id, inner)}</div>`;
  html.push(`<div class="tk-hcs" style="right:${r(A4.w - (x + w) + 4)}mm;top:${r(y + cellY)}mm">`
    + group('regroup', TXT.holdCells.regroup, c => `<g opacity=".5">${lineIcon(REGROUP, c / 2, c / 2, 8.4, LOOK.ink)}</g>`)
    + group('joint', TXT.holdCells.joint, c => ico('guns', c / 2, c / 2, 9, TONE.sepia, undefined, 0.42)) + `</div>`);
  return { svg: svg.join(''), html: html.join('') };
}

// ---- Powder and Fire: a brass coin with the engraved keg / the fire on deck in its well ----
function coinToken(id: string, k: string, x: number, y: number, s: number, well: string, inner: string): string {
  const cx = x + s / 2, cy = y + s / 2, R0 = s / 2 - 1.5, rim = 1.25;
  return `<defs><clipPath id="${id}${k}"><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0 - rim)}"/></clipPath></defs>`
    + `<circle cx="${r(cx + 0.3)}" cy="${r(cy + 0.45)}" r="${r(R0)}" fill="#1a0e04" fill-opacity=".22"/>`
    + brassRing(null, cx, cy, R0, rim, id, well)
    + `<g clip-path="url(#${id}${k})">${inner}</g>`
    + `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0 - rim - 0.55)}" fill="none" stroke="${LOOK.brass[2]}" stroke-opacity=".35" stroke-width=".18"/>`;
}
function tokenGrid(id: string, g: { cols: number; rows: number; x: number; y: number }, size: number, count: number, one: (i: number, x: number, y: number) => string): string {
  if (g.cols * g.rows !== count) throw new Error(`token grid ${g.cols} × ${g.rows}, expected ${count}`);
  let s = `<rect x="${g.x}" y="${g.y}" width="${g.cols * size}" height="${g.rows * size}" fill="${GROUND}"/>`;
  for (let i = 0; i < count; i++) s += one(i, g.x + (i % g.cols) * size, g.y + Math.floor(i / g.cols) * size);
  return s;
}

// ---- track markers: the ship's colour, a brass rim, the deck letter large (cap 6.6 mm); the Soul marker beside them ----
const LETTER = { cap: 6.6, maxW: 6.9 };
function markerArt(x: number, y: number, color: string, field: string): string {
  const m = TOKEN.marker, [bl, bm, bd] = LOOK.brass, a = 0.6, b = m - 0.6, k = 1.4;
  return `<rect x="${R(x)}" y="${R(y)}" width="${m}" height="${m}" fill="${color}"/>`
    + `<rect x="${R(x + a)}" y="${R(y + a)}" width="${R(b - a)}" height="${R(b - a)}" rx="${k}" fill="${bm}" stroke="${bd}" stroke-width=".2"/>`
    // light along the top and the left edge, shade along the bottom and the right
    + `<path d="M${R(x + a + 0.35)} ${R(y + b - k)}V${R(y + a + k)}Q${R(x + a + 0.35)} ${R(y + a + 0.35)} ${R(x + a + k)} ${R(y + a + 0.35)}H${R(x + b - k)}" fill="none" stroke="${bl}" stroke-width=".42" stroke-linecap="round"/>`
    + `<path d="M${R(x + a + k)} ${R(y + b - 0.32)}H${R(x + b - k)}Q${R(x + b - 0.32)} ${R(y + b - 0.32)} ${R(x + b - 0.32)} ${R(y + b - k)}V${R(y + a + k)}" fill="none" stroke="${bd}" stroke-opacity=".4" stroke-width=".36" stroke-linecap="round"/>`
    + `<rect x="${R(x + 1.3)}" y="${R(y + 1.3)}" width="${R(m - 2.6)}" height="${R(m - 2.6)}" rx=".8" fill="${field}" stroke="${bd}" stroke-width=".2"/>`
    + `<path d="M${R(x + 1.75)} ${R(y + m - 2.2)}V${R(y + 2.1)}Q${R(x + 1.75)} ${R(y + 1.75)} ${R(x + 2.1)} ${R(y + 1.75)}H${R(x + m - 2.2)}" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width=".25" stroke-linecap="round"/>`;
}
function markersHtml(): { svg: string; html: string; cuts: string } {
  const m = TOKEN.marker, list = ships().flatMap(s => Array.from({ length: 4 }, () => s)), n = MARK.perRow;
  if (list.length + 1 !== COUNTS.markers) throw new Error(`markers: ${list.length + 1}, expected ${COUNTS.markers}`);
  const pos = (i: number) => ({ x: MARK.x + (i < n ? i : i - n) * m, y: MARK.y + (i < n ? 0 : m) });
  let svg = '';
  const html: string[] = [];
  list.forEach((s, i) => {
    const p = pos(i), pid = `marker-${i}`;
    svg += markerArt(p.x, p.y, s.color, deepOf(s.color)) + `<rect data-plate="${pid}" x="${R(p.x)}" y="${R(p.y)}" width="${m}" height="${m}" fill="none"/>`;
    html.push(capWord(pid, p.x + m / 2, p.y + m / 2, s.code, LETTER.cap, { color: CREAM, maxW: LETTER.maxW }));
  });
  const soul = pos(list.length);
  svg += markerArt(soul.x, soul.y, '#d9efe8', '#eef8f4') + ico('souls', soul.x + m / 2, soul.y + m / 2 + 0.1, 7.4, SOUL_TONE, 'marker-soul');
  // the outline with its ticks: grey; the lines between two dark markers: light
  const x = MARK.x, y = MARK.y, w = (list.length + 1 - n) * m, h = 2 * m, w1 = n * m;
  let d = '', light = '';
  for (let c = 0; c <= n + 1; c++) d += `M${R(x + c * m)} ${R((c > n ? y + m : y) - TICK)}V${R(y + h + TICK)}`;
  d += `M${R(x - TICK)} ${y}H${R(x + w1 + TICK)}M${R(x - TICK)} ${R(y + m)}H${R(x + w + TICK)}M${R(x - TICK)} ${R(y + h)}H${R(x + w + TICK)}`;
  for (let c = 1; c < n; c++) light += `M${R(x + c * m)} ${y}V${R(y + h)}`;
  light += `M${x} ${R(y + m)}H${R(x + w1)}`;
  return { svg, html: html.join(''), cuts: `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/><path d="${light}" stroke="${CUT_ON_DARK}" stroke-width="${CUT_W}" fill="none"/>` };
}

// ---- «Под водой»: the Dutchman's sea, a brass frame, the icon in a parchment roundel ----
function underwaterHtml(id: string): { svg: string; html: string } {
  const g = data.ships.find(s => s.code === 'Г')!, { w, h } = TOKEN.underwater, { x, y } = UNDER, rules = data.rules as Record<string, number>;
  const wave = (yy: number, sw: number) => `<path d="M${x + 1.5} ${R(yy)}q2.95 -1.3 5.9 0${'t5.9 0'.repeat(7)}" stroke="#bfe6dc" stroke-width="${sw}" stroke-opacity=".4" fill="none"/>`;
  const sea = `<linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${deepOf(darken(g.color, 0.05))}"/><stop offset="1" stop-color="${darken(g.color, 0.38)}"/></linearGradient>`;
  const tO: WO = { font: 'Alegreya SC', w: 800, size: 12, lh: 5, ls: '.05em', color: CREAM };
  const tw = W(TXT.underwater.title, 12, { font: 'Alegreya SC', w: 800, ls: '.05em' }), rd = 2.6, gw = 2 * rd + 1.8 + tw, gx = x + (w - gw) / 2, ty = y + 5;
  const icx = gx + rd;
  const svg = `<defs>${sea}<clipPath id="${id}uwc"><circle cx="${r(icx)}" cy="${r(ty)}" r="${r(rd - 0.5)}"/></clipPath></defs>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}sea)"/>${wave(y + 22.9, 0.3)}`
    + `<rect data-plate="uw" x="${r(x + 0.9)}" y="${r(y + 0.9)}" width="${r(w - 1.8)}" height="${r(h - 1.8)}" rx="1" fill="none" stroke="${LOOK.brass[1]}" stroke-width=".45"/>`
    + `<rect x="${r(x + 1.45)}" y="${r(y + 1.45)}" width="${r(w - 2.9)}" height="${r(h - 2.9)}" rx=".7" fill="none" stroke="${LOOK.brass[0]}" stroke-opacity=".55" stroke-width=".16"/>`
    + [[2.6, 2.6], [w - 2.6, 2.6], [2.6, h - 2.6], [w - 2.6, h - 2.6]].map(([dx, dy]) => rivet(x + dx, y + dy, 0.5)).join('')
    + `<g>${brassRing('uw-icon', icx, ty, rd, 0.5, id, '#e5eee7')}<g clip-path="url(#${id}uwc)">${icon('underwater', icx, ty + 0.4, 5.4, TONE.verdigris)}</g></g>`;
  const lines = TXT.underwater.lines.map(l => esc(fill(l, { surface: rules.surfaceBonus }))).join('<br>');
  const html = wordAt('uw', gx + 2 * rd + 1.8, ty, TXT.underwater.title, tO)
    + word('uw', x + w / 2, y + 8, lines, { w: 700, size: 8, lh: 3.35, color: CREAM, anchor: 'middle', align: 'center', name: 'под водой: правила' });
  return { svg, html };
}

// ---- ship tokens ----
function shipTokensHtml(id: string, pics: Record<string, string> | null): { svg: string; html: string } {
  const t = TOKEN.shipToken, list = ships(), y = SHIPS.y, band = 21.4, svg: string[] = [], html: string[] = [];
  list.forEach((s, i) => {
    const x = SHIPS.x + i * t, deep = deepOf(s.color), pid = `ship-${i}`;
    svg.push(`<rect x="${x}" y="${y}" width="${t}" height="${t}" fill="${PAPER}"/>`);
    if (pics) svg.push(`<image href="${pics[s.code]}" x="${x}" y="${y}" width="${PIC.w}" height="${PIC.h}" preserveAspectRatio="none"/>`);
    else svg.push(`<g transform="translate(0 ${y})">${bigShip(DECK_KEY[s.code], x + 16.2, 20.2, 0.172)}</g>`);
    svg.push(`<rect x="${x}" y="${y + band}" width="${t}" height="${r(t - band)}" fill="${deep}"/>`);
    svg.push(`<rect x="${x}" y="${r(y + band - 0.3)}" width="${t}" height=".7" fill="url(#${id}br)"/>`);
    svg.push(`<rect data-plate="${pid}-band" x="${r(x + 0.5)}" y="${r(y + band + 0.4)}" width="${r(t - 1)}" height="${r(t - band - 0.9)}" fill="none"/>`);
    // new: the letter in the band, left of the name, off the sails; old: the letter over the sky, the name centred in the band
    const m = pics ? { cx: x + 4.4, cy: y + 25.75, R: 3.15 } : { cx: x + 5.6, cy: y + 5.6, R: 3.5 };
    svg.push(brassRing(`${pid}-medal`, m.cx, m.cy, m.R, 0.6, id, deep));
    html.push(capWord(`${pid}-medal`, m.cx, m.cy, s.code, m.R * 0.92, { color: CREAM, maxW: m.R * 1.2, inset: 1.2, name: `${s.code} (жетон)` }));
    const nx = pics ? x + 18.5 : x + t / 2, room = pics ? 18.6 : 25, nO: TO = { font: 'Alegreya SC', w: 700, ls: '.06em' };
    let size = 9.6; while (size > 7 && W(s.nick, size, nO) > room) size = Math.round((size - 0.2) * 10) / 10;
    html.push(wordAt(`${pid}-band`, nx, y + 25.75, s.nick, { font: 'Alegreya SC', w: 700, size, lh: pt(size) * 1.2, ls: '.06em', color: CREAM, anchor: 'middle' }));
  });
  return { svg: svg.join(''), html: html.join('') };
}

// ---- the identical marks: a brass coin on parchment with an engraved compass star (round and brass — unlike the
// coloured square markers with a letter) ----
function markArt(cx: number, cy: number, id: string): string {
  const ink = LOOK.engrave, star = (R0: number, R1: number, rot: number) => {
    const p: string[] = [];
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, q = i % 2 ? R1 : R0; p.push(`${R(cx + q * Math.cos(a))} ${R(cy + q * Math.sin(a))}`); }
    return `M${p.join('L')}Z`;
  };
  return `<circle cx="${R(cx + 0.25)}" cy="${R(cy + 0.35)}" r="4.25" fill="#1a0e04" fill-opacity=".22"/>`
    + brassDisc(cx, cy, 4.25, 0.8)
    + `<circle cx="${R(cx)}" cy="${R(cy)}" r="3.45" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width=".2"/>`
    + `<path d="${star(3.05, 0.75, -Math.PI / 2)}" fill="${ink}"/><path d="${star(2.1, 0.6, -Math.PI / 4)}" fill="${ink}" fill-opacity=".6"/>`
    + `<circle cx="${R(cx)}" cy="${R(cy)}" r=".45" fill="${LOOK.brass[0]}"/>`;
}
function marksHtml(id: string): { svg: string; cuts: string } {
  const m = TOKEN.marker, { cols, rows, x, y } = MARKS;
  let svg = `<rect x="${x}" y="${y}" width="${cols * m}" height="${rows * m}" fill="${GROUND}"/>`;
  for (let i = 0; i < cols * rows; i++) svg += markArt(x + (i % cols) * m + m / 2, y + Math.floor(i / cols) * m + m / 2, id);
  return { svg, cuts: gridCuts(x, y, cols, rows, m, m) };
}
/** a mark drawn small, inline in HTML (its own plate) */
const markIcon = (pid: string, d: number, id: string) => `<svg data-plate="${pid}" viewBox="0 0 ${TOKEN.marker} ${TOKEN.marker}" style="width:${d}mm;height:${d}mm;flex:none;display:block">${markArt(TOKEN.marker / 2, TOKEN.marker / 2, id)}</svg>`;

// ---- pages
function pages(ctx: Ctx, pics: Record<string, string> | null, strips: boolean): PageSpec[] {
  const econ = data.econ as { income: number; first_income: number; cap: number; second_start: number }, rules = data.rules as Record<string, number>;
  const nums = { income: econ.income, first: econ.first_income, cap: econ.cap, start: econ.second_start, firstGame: rules.firstGameSecondStart };
  const pd = TOKEN.powder, fr = TOKEN.fire, of = strips ? 3 : 2, page = (n: number) => fill(TXT.page, { n, of });
  void ctx;

  // sheet 1
  const id1 = 'tk1', s1: string[] = [defs(id1)], h1: string[] = [];
  TXT.holds.forEach((t, i) => { const hd = holdHtml(t, i, fill(t.rule, nums), id1); s1.push(hd.svg); h1.push(hd.html); });
  const cPow = caption('cap-powder', POWDER.x, POWDER.y, fill(TXT.powder, { n: COUNTS.powder }), ico('powder', capSign(POWDER.x, POWDER.y).cx, capSign(POWDER.x, POWDER.y).cy, 4.8, TONE.sepia));
  s1.push(cPow.svg, tokenGrid(id1, POWDER, pd, COUNTS.powder, (i, x, y) => coinToken(id1, `pw${i}`, x, y, pd, WELL, icon('powder', x + pd / 2 + 0.2, y + pd / 2 + 0.1, 11.6, TONE.sepia))));
  h1.push(cPow.html);
  const cFire = caption('cap-fire', FIRE.x, FIRE.y, fill(TXT.fire, { n: COUNTS.fire }), ico('fire', capSign(FIRE.x, FIRE.y).cx, capSign(FIRE.x, FIRE.y).cy, 4.8, TONE.red));
  s1.push(cFire.svg, tokenGrid(id1, FIRE, fr, COUNTS.fire, (i, x, y) => coinToken(id1, `fr${i}`, x, y, fr, FIRE_FIELD, icon('fire', x + fr / 2, y + fr / 2 + 0.3, 13.2, TONE.red))));
  h1.push(cFire.html);
  const mk = markersHtml(), sg = capSign(MARK.x, MARK.y);
  const cMark = caption('cap-markers', MARK.x, MARK.y, TXT.markers,
    `<rect x="${r(sg.cx - 2.3)}" y="${r(sg.cy - 2.3)}" width="4.6" height="4.6" rx=".8" fill="url(#${id1}brh)" stroke="${LOOK.brass[2]}" stroke-width=".2"/><rect x="${r(sg.cx - 1.6)}" y="${r(sg.cy - 1.6)}" width="3.2" height="3.2" rx=".4" fill="${deepOf(data.ships.find(s => s.code === 'М')!.color)}"/>`);
  s1.push(cMark.svg, mk.svg); h1.push(cMark.html, mk.html);
  const uw = underwaterHtml(id1), su = capSign(UNDER.x - 6.6, UNDER.y);
  const cUw = caption('cap-underwater', UNDER.x - 6.6, UNDER.y, TXT.underwaterCaption, ico('underwater', su.cx, su.cy, 4.8, TONE.verdigris));
  s1.push(cUw.svg, uw.svg); h1.push(cUw.html, uw.html);
  s1.push(plateRect('hint', { x: 10, y: 272, w: 190, h: 7.4 }));
  h1.push(wordAt('hint', A4.w / 2, 275.7, TXT.hint, { font: 'Alegreya', italic: true, w: 400, size: 9.5, lh: 4, color: '#3f2f1c', anchor: 'middle' }));
  const page1 = head(id1 + 'h', TXT.title, TXT.lead, page(1)) + pageSvg(s1.join('\n')) + h1.join('\n') + foot(1, of)
    + cutLayer(gridCuts(HOLD_BOX.x, HOLD_BOX.y, 1, TXT.holds.length, HOLD_BOX.w, HOLD_BOX.h, HOLD_BOX.tick)
      + gridCuts(POWDER.x, POWDER.y, POWDER.cols, POWDER.rows, pd, pd) + gridCuts(FIRE.x, FIRE.y, FIRE.cols, FIRE.rows, fr, fr)
      + mk.cuts + gridCuts(UNDER.x, UNDER.y, 1, 1, TOKEN.underwater.w, TOKEN.underwater.h));

  // sheet 2
  const id2 = 'tk2', mp = TXT.marksPage, st = TOKEN.shipToken, s2: string[] = [defs(id2)], h2: string[] = [];
  const ss = capSign(SHIPS.x, SHIPS.y), cShips = caption('cap-ships', SHIPS.x, SHIPS.y, fill(mp.ships, { n: ships().length }), ico('sails', ss.cx, ss.cy, 4.8, TONE.sepia));
  const tok = shipTokensHtml(id2, pics);
  s2.push(cShips.svg, tok.svg); h2.push(cShips.html, tok.html);
  const ms = capSign(MARKS.x, MARKS.y), cMarks = caption('cap-marks', MARKS.x, MARKS.y, fill(mp.marks, { n: TABLE.marks, spare: TABLE.spareMarks }),
    `<g transform="translate(${r(ms.cx - 2.4)} ${r(ms.cy - 2.4)}) scale(${r(4.8 / TOKEN.marker)})">${markArt(TOKEN.marker / 2, TOKEN.marker / 2, id2)}</g>`);
  const marks = marksHtml(id2);
  s2.push(cMarks.svg, marks.svg); h2.push(cMarks.html);
  // how the marks are used: a parchment slip under the grid
  const ub: Rect = { x: 10, y: MARKS.y + MARKS.rows * TOKEN.marker + TICK + 3, w: 190, h: 15.2 };
  s2.push(cartouche('uses', ub, id2));
  h2.push(`<div class="tk-uses-r" style="left:${r(ub.x)}mm;top:${r(ub.y + 2.6)}mm;width:${r(ub.w)}mm">`
    + mp.uses.map((u, i) => `<span>${markIcon(`use-${i}`, 4.6, id2)}<span data-in="uses" class="tk-use">${esc(u)}</span></span>`).join('') + `</div>`);
  h2.push(wordAt('uses', A4.w / 2, ub.y + 11.1, mp.sweep, { font: 'Alegreya', italic: true, w: 500, size: 9.5, lh: 4, color: LOOK.ink, anchor: 'middle' }));
  const page2 = head(id2 + 'h', mp.title, mp.lead, page(2)) + pageSvg(s2.join('\n')) + h2.join('\n') + foot(2, of)
    + cutLayer(gridCuts(SHIPS.x, SHIPS.y, ships().length, 1, st, st) + marks.cuts);

  const out: PageSpec[] = [{ html: page1 }, { html: page2 }];
  // concept B with the counters off the board: the four strips «Осталось карт» / «Реакций сыграно» (cut along the lines)
  if (strips) out.push(counterStripsPage(head('tk3h', TXT.strips.title, TXT.strips.lead, page(3)), foot(3, of)));
  return out;
}
/** the sheets of part 04: a dry run collects the words to measure, the browser measures them, then the real run */
export async function tokenPages(ctx: Ctx, pics: Record<string, string> | null = null, strips = false): Promise<PageSpec[]> {
  pages(ctx, pics, strips);
  await measureMissing(ctx);
  return pages(ctx, pics, strips);
}

export const TOKENS_CSS = `${ART_CSS}
.tk-svg{position:absolute;left:0;top:0;width:210mm;height:297mm}
.tk-hcs{position:absolute;display:flex;gap:4.5mm}
.tk-hc{display:flex;align-items:center;gap:1.8mm}
.tk-hc-l{display:flex;flex-direction:column;align-items:flex-end;text-align:right;font:500 7.5pt/3.05mm 'Alegreya Sans',sans-serif;color:${LOOK.ink};white-space:nowrap}
.tk-hc-l b{font:700 9pt/3.6mm 'Alegreya Sans',sans-serif}
.tk-uses-r{position:absolute;display:flex;justify-content:center;gap:5mm}
.tk-uses-r>span{display:inline-flex;align-items:center;gap:1.4mm;white-space:nowrap}
.tk-use{font:500 9pt/3.8mm 'Alegreya Sans',sans-serif;color:${LOOK.ink};display:block}
`;

export async function build(ctx: Ctx): Promise<Part[]> {
  const pics = (ctx.opts.tokens ?? 'new') === 'new' ? await kitTokenPics(ctx) : null;
  const pages = await tokenPages(ctx, pics, (ctx.opts.board ?? 'b') === 'b' && ctx.opts.counters === 'strip');
  return [{ file: '04-tryumy-zhetony', title: TXT.partTitle, css: TOKENS_CSS, pages }, await schemePart(ctx)];
}
