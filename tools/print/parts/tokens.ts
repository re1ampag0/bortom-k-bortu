// 04 — the two holds, the «Схема боя» and the tokens (docs/tasks/print-kit.md 3.6 with review-print 13–14 and
// review-player 3.1, 3.5, 3.7, 3.9; docs/tasks/print-kit-boards.md step 5). Portrait A4, one side.
//   sheet 1: «Трюм Пиратов», «Трюм Компании» (8 cells Ø 22 mm each and the cells «Перестроение», «Совместный залп +1»),
//            Powder × 24, Fire × 9, track markers × 17, «Под водой»
//   sheet 2: the «Схема боя» — the centre of the table: the phase path, the 2 × 2 field with nests for the ship tokens,
//            the places of the sea deck, the sea card and «Эффекты этого хода», where the lasting effects lie
//   sheet 3: four ship tokens 30 × 30 mm and the identical marks 11 × 11 mm (TABLE.marks and TABLE.spareMarks)
// Tokens are squares in grids without gaps: the cut lines are shared and run a few millimetres past the grid.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, mm, type Ctx, type PageSpec, type Part } from '../kit';
import { A4, COUNTS, DECKS, HOLD, TABLE, TOKEN, type Ship } from '../layout';
import { BRASS, BRASS_DARK, BRASS_LIGHT, DECK_KEY, INK, PARCHMENT, darken, lighten } from '../colors';
import { iconImg } from '../icons';
import { bigShip } from '../../../src/ui/game/art/bigShips';
import { createRequire } from 'node:module';
import { ROOT } from '../kit';
import { rasterJpeg } from '../map/raster';
import { counterStripsPage } from './boards/v2';

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
  scheme: {
    title: string; tag: string; lead: string; phase: { title: string; sub: string; steps: string[] }; company: string; pirates: string;
    front: string[]; diag: string; joint: string[]; seaDeck: { title: string; lines: string[] }; seaCard: { title: string; lines: string[] };
    effects: { title: string; cards: string[] }; long: { title: string; cards: string[]; text: string };
  };
  marksPage: { title: string; lead: string; ships: string; marks: string; uses: string[]; sweep: string };
  strips: { title: string; lead: string };
};
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

// ---- colours of this part
const PAPER = '#fbf6ea';        // the light ground of tokens and holds
const CELL = '#fffdf7';
const PIRATES = '#2b2420';
const COMPANY = '#8a6520';
const CUT = '#8c8c8c';          // cut lines on light grounds
const CUT_ON_DARK = '#e6e1d6';  // the same lines between two dark tokens
const CUT_W = 0.25;
/** Numbers and icons inside empty cells: decoration, seen until a token covers them. */
const FAINT = '#a08c62';
/** Team colours for words on parchment: darkened to a contrast of 7:1 and more. */
const COMPANY_INK = darken(COMPANY, 0.4);
/** The ground of the identical marks: a deep blue none of the four ships has. */
const MARK_BG = '#1d3f73';
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
const PHASE = { x: 10, y: 27.5 };
const FIELD = { x: (A4.w - TABLE.field.w) / 2, y: 45, ...TABLE.field };
/** The nests: columns and rows inside the field (Company on top, Pirates below, as in the rules' diagram). */
const NEST = { cols: [30, TABLE.field.w - 30 - TABLE.nest], rows: [8, TABLE.field.h - 8 - TABLE.nest] };
const TRAY = { x: FIELD.x, y: FIELD.y + FIELD.h + 16.5, h: TABLE.seaCard.h };
const LONG = { y: TRAY.y + TRAY.h + 3 };
// sheet 3
const SHIPS = { x: (A4.w - 4 * TOKEN.shipToken) / 2, y: 42 };
const MARKS = { cols: TABLE.marksPerRow, rows: (TABLE.marks + TABLE.spareMarks) / TABLE.marksPerRow, x: (A4.w - TABLE.marksPerRow * TOKEN.marker) / 2, y: SHIPS.y + TOKEN.shipToken + GAP + 4 + CAP };

const ships = (): Ship[] => DECKS.map(code => data.ships.find(s => s.code === code)!);
const R = (n: number) => Math.round(n * 1000) / 1000;

/** Cut lines of a grid cols × rows of cells w × h at (x, y): every line is shared and runs tick mm past the grid. */
const gridCuts = (x: number, y: number, cols: number, rows: number, w: number, h: number, tick = TICK): string => {
  let d = '';
  for (let c = 0; c <= cols; c++) d += `M${R(x + c * w)} ${R(y - tick)}V${R(y + rows * h + tick)}`;
  for (let r = 0; r <= rows; r++) d += `M${R(x - tick)} ${R(y + r * h)}H${R(x + cols * w + tick)}`;
  return `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/>`;
};
const cutLayer = (inner: string) => `<svg class="tk-cut" viewBox="0 0 ${A4.w} ${A4.h}" style="position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm">${inner}</svg>`;
const box = (x: number, y: number, w: number, h: number, inner = '', cls = '', style = '') =>
  `<div class="${cls}" style="position:absolute;left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)};${style}">${inner}</div>`;
const cap = (x: number, y: number, text: string) => `<div class="tk-cap" style="left:${mm(x)};top:${mm(y)}">${esc(text)}</div>`;

const head = (title: string, lead: string, tag: string) =>
  `<div class="tk-title">${esc(title)}</div><div class="tk-tag">${esc(tag)}</div><div class="tk-lead">${esc(lead)}</div>`
  + `<svg style="position:absolute;left:10mm;top:23mm;width:190mm;height:1mm" viewBox="0 0 190 1"><path d="M0 .5H190" stroke="${BRASS}" stroke-width=".45"/><path d="M0 .5H38" stroke="${BRASS_DARK}" stroke-width=".9"/></svg>`;
const foot = (n: number, of: number) => `<div class="tk-foot">${esc(fill(TXT.footer, { n, of }))}</div>`;

// ---- line icons (own SVG, 24 × 24 units): an icon stands next to its word (docs/ui/RULES.md: icon + word)
const ICONS: Record<string, string> = {
  // Перестроение: the two ships change places
  regroup: '<path d="M4 8.5H18.5M15 5L18.5 8.5L15 12M20 15.5H5.5M9 12L5.5 15.5L9 19"/>',
  // Совместный залп: two shots meet in one target
  joint: '<circle cx="18" cy="12" r="4.2"/><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M2.5 4.5Q9 5 13 10M2.5 19.5Q9 19 13 14M9.9 9.2L13 10L12.7 6.9M9.9 14.8L13 14L12.7 17.1"/>',
  sea: '<path d="M2.5 8.5q2.4-2.2 4.8 0t4.8 0t4.8 0t4.8 0M2.5 13.5q2.4-2.2 4.8 0t4.8 0t4.8 0t4.8 0M2.5 18.5q2.4-2.2 4.8 0t4.8 0t4.8 0t4.8 0"/>',
  pirates: '<path d="M5 3.5Q11 9 18 19.5M19 3.5Q13 9 6 19.5M14.6 20.6L19.8 16.8M9.4 20.6L4.2 16.8"/>',
  company: '<path d="M6 21.5V2.5"/><path d="M6 4H19V13H6"/><path d="M6 7H19M6 10H19"/><path d="M6 4H11V8.5H6" fill="currentColor"/>',
  deck: '<rect x="5" y="3" width="11.5" height="15.5" rx="1.6"/><path d="M8 21.2H18a1.6 1.6 0 0 0 1.6-1.6V6.5"/><path d="M8 7.2L13.5 14.3M13.5 7.2L8 14.3"/>',
  card: '<rect x="6" y="3" width="12" height="18" rx="1.6"/><path d="M12 7.5L13.4 11.6L17.5 12L13.4 12.4L12 16.5L10.6 12.4L6.5 12L10.6 11.6Z"/>',
  hourglass: '<path d="M6.5 3H17.5M6.5 21H17.5M8 3C8 8.5 16 8.5 16 12S8 15.5 8 21M16 3C16 8.5 8 8.5 8 12S16 15.5 16 21"/><path d="M10 19.5H14L12 17Z" fill="currentColor"/>',
  lasting: '<rect x="3" y="5" width="9.5" height="13.5" rx="1.4"/><path d="M14.5 11.8H20.5M17.6 8.8L20.6 11.8L17.6 14.8"/><path d="M7.75 8.5V11.8L9.8 13.2"/>'
};
/** An inline icon of d mm; as an SVG child when x and y are given. */
const ico = (name: string, d: number, color: string, sw = 1.6, at?: { x: number; y: number }) =>
  `<svg ${at ? `x="${R(at.x)}" y="${R(at.y)}" width="${d}" height="${d}"` : `style="display:inline-block;width:${mm(d)};height:${mm(d)};flex:none;vertical-align:middle"`} viewBox="0 0 24 24" color="${color}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
/** An empty cell of TABLE.cell mm for one mark, the icon of what it counts drawn faintly inside. */
const markCell = (icon: string, accent: string) => {
  const c = TABLE.cell;
  return `<svg viewBox="0 0 ${c} ${c}" style="width:${mm(c)};height:${mm(c)};flex:none;display:block"><rect x=".2" y=".2" width="${c - 0.4}" height="${c - 0.4}" rx="1.5" fill="${CELL}" stroke="${lighten(accent, 0.3)}" stroke-width=".35" stroke-dasharray="1.3 .9"/>${ico(icon, 8.4, FAINT, 1.5, { x: (c - 8.4) / 2, y: (c - 8.4) / 2 })}</svg>`;
};

// ---- holds
function holdHtml(t: HoldText, y: number, rule: string): string {
  const accent = t.side === 'pirates' ? PIRATES : COMPANY, { w, h, cy, pad, sep, cellY } = HOLD_BOX, r = HOLD.cell / 2;
  const cells = Array.from({ length: HOLD.cells }, (_, i) => {
    const cx = pad + r + i * (HOLD.cell + HOLD.gap);
    return `<circle cx="${cx}" cy="${cy}" r="${r - 0.175}" fill="${CELL}" stroke="${lighten(accent, 0.3)}" stroke-width=".35" stroke-dasharray="1.3 .9"/>`
      + `<text x="${cx}" y="${cy + 2.35}" text-anchor="middle" font-family="Alegreya SC" font-weight="400" font-size="7" fill="${FAINT}">${i + 1}</text>`;
  }).join('');
  const group = (lines: string[], icon: string) => `<div class="tk-hc"><div class="tk-hc-l"><b>${esc(lines[0])}</b>${lines.slice(1).map(l => `<span>${esc(l)}</span>`).join('')}</div>${markCell(icon, accent)}</div>`;
  return box(HOLD_BOX.x, y, w, h,
    `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">`
    + `<rect x="1" y="1.6" width="${w - 2}" height="${h - 3.2}" rx="2.2" fill="${PAPER}" stroke="${accent}" stroke-width=".6"/>`
    + `<path d="M3.6 ${sep}H${w - 3.6}" stroke="${lighten(accent, 0.45)}" stroke-width=".25"/>${cells}</svg>`
    + `<div class="tk-hold-name" style="color:${accent}">${esc(t.name)}</div><div class="tk-hold-rule">${esc(rule)}</div>`
    + `<div class="tk-hcs" style="top:${mm(cellY)}">${group(TXT.holdCells.regroup, 'regroup')}${group(TXT.holdCells.joint, 'joint')}</div>`,
    'tk-hold');
}

// ---- Fire: an own drawing. Light, glow and shadow are gradients (no filters), so the picture stays vector in the PDF;
// it is one SVG picture placed nine times by the same URL.
const FLAME_OUT = 'M52 14C53 26 66 33 69 48C72 62 63 79 50 79C37 79 28 68 30 54C31 46 35 41 37 33C39 38 42 41 45 41C44 31 47 21 52 14Z';
const FLAME_MID = 'M51 32C52 41 61 46 62 57C63 68 57 76.5 50 76.5C43 76.5 37 69 38 60C38.5 54 41 51 42.5 46C44 50 46 52 48 51C47.5 44 49 37 51 32Z';
const FLAME_IN = 'M50.5 50C51 56 56 59 56 65C56 71 53.5 74.5 50 74.5C46.5 74.5 44 71 44 66C44 62 46 60 47 57C48 59 49 60 50 59.5C49.8 56 50 53 50.5 50Z';
const FIRE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>`
  + `<radialGradient id="fSh"><stop offset="0" stop-color="#2a1408" stop-opacity=".5"/><stop offset=".84" stop-color="#2a1408" stop-opacity=".46"/><stop offset="1" stop-color="#2a1408" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="fBg" cx=".5" cy=".64" r=".62"><stop offset="0" stop-color="#96300f"/><stop offset=".5" stop-color="#55160b"/><stop offset="1" stop-color="#210806"/></radialGradient>`
  + `<linearGradient id="fRing" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#f8e19a"/><stop offset=".45" stop-color="${BRASS_LIGHT}"/><stop offset="1" stop-color="#a87a2c"/></linearGradient>`
  + `<linearGradient id="fOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c01c0e"/><stop offset=".5" stop-color="#ec4a14"/><stop offset="1" stop-color="#ff8f1c"/></linearGradient>`
  + `<linearGradient id="fMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8410"/><stop offset="1" stop-color="#ffd140"/></linearGradient>`
  + `<linearGradient id="fIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#fffdf2"/></linearGradient>`
  + `<radialGradient id="fGlow"><stop offset="0" stop-color="#ffb040" stop-opacity=".9"/><stop offset=".55" stop-color="#ff6a10" stop-opacity=".42"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="fEmb"><stop offset="0" stop-color="#ffc45a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a20" stop-opacity="0"/></radialGradient>`
  + `<clipPath id="fClip"><circle cx="50" cy="50" r="33.4"/></clipPath></defs>`
  + `<circle cx="50" cy="52.8" r="45" fill="url(#fSh)"/>`
  + `<circle cx="50" cy="50" r="40" fill="${BRASS_DARK}"/><circle cx="50" cy="50" r="38.1" fill="url(#fRing)"/>`
  + `<path d="M17.5 37A35.6 35.6 0 0 1 45 14.2" stroke="#fffbe6" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".7"/>`
  + `<circle cx="50" cy="50" r="34.7" fill="${BRASS_DARK}"/><circle cx="50" cy="50" r="33.4" fill="url(#fBg)"/>`
  + `<g clip-path="url(#fClip)"><ellipse cx="50" cy="56" rx="31" ry="34" fill="url(#fGlow)"/><ellipse cx="50" cy="80" rx="24" ry="7" fill="url(#fEmb)"/></g>`
  + `<g transform="translate(50 79) scale(.93) translate(-50 -79)">`
  + `<path d="${FLAME_OUT}" fill="none" stroke="#ff7a1a" stroke-width="4.5" stroke-linejoin="round" opacity=".28"/>`
  + `<path d="${FLAME_OUT}" fill="url(#fOut)" stroke="#7c1508" stroke-width="1.1" stroke-linejoin="round"/>`
  + `<path d="M34.5 50C33 58 36 68 43 73.5" stroke="#ffa257" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".6"/>`
  + `<path d="${FLAME_MID}" fill="url(#fMid)"/><path d="${FLAME_IN}" fill="url(#fIn)"/>`
  + `<path d="M41.6 59.5C41.2 64 43 69 46 72" stroke="#fff6c4" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".75"/></g>`
  + `<circle cx="34.5" cy="33" r="1.5" fill="#ffc650"/><circle cx="66" cy="31.5" r="1.2" fill="#ffb040"/><circle cx="62.5" cy="23.5" r=".9" fill="#ffd77a"/><circle cx="29" cy="43" r=".8" fill="#ff9a30"/>`
  + `</svg>`;
const FIRE_URI = 'data:image/svg+xml;base64,' + Buffer.from(FIRE_SVG).toString('base64');

// ---- track markers: a square of the ship's colour, the deck letter on a darker disc
function markersHtml(ctx: Ctx): { html: string; cuts: string } {
  const m = TOKEN.marker, list = ships().flatMap(s => Array.from({ length: 4 }, () => s)), n = MARK.perRow;
  if (list.length + 1 !== COUNTS.markers) throw new Error(`markers: ${list.length + 1}, expected ${COUNTS.markers}`);
  const pos = (i: number) => ({ x: (i < n ? i : i - n) * m, y: i < n ? 0 : m });
  const w = (list.length + 1 - n) * m, h = 2 * m, soul = pos(list.length);
  const svg = list.map((s, i) => {
    const p = pos(i), cx = p.x + m / 2, cy = p.y + m / 2;
    return `<rect x="${R(p.x)}" y="${R(p.y)}" width="${m}" height="${m}" fill="${s.color}"/>`
      + `<circle cx="${R(cx)}" cy="${R(cy)}" r="4.2" fill="${darken(s.color, 0.32)}" stroke="${lighten(s.color, 0.45)}" stroke-width=".25"/>`
      + `<text x="${R(cx)}" y="${R(cy + 1.95)}" text-anchor="middle" font-family="Alegreya SC" font-weight="800" font-size="6.2" fill="#fff4d8">${esc(s.code)}</text>`;
  }).join('')
    + `<rect x="${R(soul.x)}" y="${R(soul.y)}" width="${m}" height="${m}" fill="#e2f3ee"/>`
    + `<circle cx="${R(soul.x + m / 2)}" cy="${R(soul.y + m / 2)}" r="4.6" fill="#f6fcfa" stroke="#58a898" stroke-width=".25"/>`;
  const fd = 5, fh = fd * 54 / 44;
  const html = box(MARK.x, MARK.y, w, h, `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">${svg}</svg>`
    + iconImg(ctx, 'flask', soul.x + (m - fd) / 2, soul.y + (m - fh) / 2 - 0.1, fd));
  // the outline with its ticks: grey; the lines between two dark markers: light
  const x = MARK.x, y = MARK.y, w1 = n * m;
  let d = '', light = '';
  for (let c = 0; c <= n + 1; c++) d += `M${R(x + c * m)} ${R((c > n ? y + m : y) - TICK)}V${R(y + h + TICK)}`;
  d += `M${R(x - TICK)} ${y}H${R(x + w1 + TICK)}M${R(x - TICK)} ${R(y + m)}H${R(x + w + TICK)}M${R(x - TICK)} ${R(y + h)}H${R(x + w + TICK)}`;
  for (let c = 1; c < n; c++) light += `M${R(x + c * m)} ${y}V${R(y + h)}`;
  light += `M${x} ${R(y + m)}H${R(x + w1)}`;
  return { html, cuts: `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/><path d="${light}" stroke="${CUT_ON_DARK}" stroke-width="${CUT_W}" fill="none"/>` };
}

// ---- «Под водой»
function underwaterHtml(): string {
  const g = data.ships.find(s => s.code === 'Г')!, { w, h } = TOKEN.underwater, rules = data.rules as Record<string, number>;
  const wave = (y: number, o: number, sw: number) => `<path d="M-2 ${y}q3.25 -1.5 6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0" stroke="#bfe6dc" stroke-width="${sw}" fill="none" opacity="${o}"/>`;
  return box(UNDER.x, UNDER.y, w, h,
    `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%"><defs><linearGradient id="tkSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${darken(g.color, 0.08)}"/><stop offset="1" stop-color="${darken(g.color, 0.3)}"/></linearGradient></defs>`
    + `<rect width="${w}" height="${h}" fill="url(#tkSea)"/>${wave(1.5, 0.4, 0.3)}${wave(23.6, 0.4, 0.3)}`
    + `<path d="${[3.6, 41.4].map(x => [4.1, 5.9].map(y => `M${x} ${y}q1.25 -1.1 2.5 0t2.5 0`).join('')).join('')}" stroke="#bfe6dc" stroke-width=".4" fill="none" stroke-linecap="round"/></svg>`
    + `<div class="tk-uw-t">${esc(TXT.underwater.title)}</div>`
    + `<div class="tk-uw-l">${TXT.underwater.lines.map(l => `<div>${esc(fill(l, { surface: rules.surfaceBonus }))}</div>`).join('')}</div>`,
    'tk-uw');
}

// ---- «Схема боя»
/** A straight double-headed arrow. */
function arrow(x1: number, y1: number, x2: number, y2: number, color: string, w: number, dash = '', hd = 1.7): string {
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, hw = hd * 0.42;
  const tip = (x: number, y: number, s: number) => `<path d="M${R(x)} ${R(y)}L${R(x + s * ux * hd - uy * hw)} ${R(y + s * uy * hd + ux * hw)}L${R(x + s * ux * hd + uy * hw)} ${R(y + s * uy * hd - ux * hw)}Z" fill="${color}"/>`;
  return `<path d="M${R(x1 + ux * hd * 0.8)} ${R(y1 + uy * hd * 0.8)}L${R(x2 - ux * hd * 0.8)} ${R(y2 - uy * hd * 0.8)}" stroke="${color}" stroke-width="${w}" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${tip(x1, y1, 1)}${tip(x2, y2, -1)}`;
}
/** A card of the data by its name: the printed names must be exactly the data's. */
const cardName = (name: string): string => {
  const all = [...Object.values(data.decks).flat(), ...Object.values(data.legends)];
  if (!all.some(c => c.name === name)) throw new Error(`tokens.json: no card «${name}» in data/game-data.json`);
  return `«${name}»`;
};
/** The phase path: «Море → Ходят Пираты → Ходят Компания», one mark moves along it. */
function phaseHtml(): string {
  const p = TXT.scheme.phase, icons = ['sea', 'pirates', 'company'], colors = [INK, PIRATES, COMPANY_INK];
  const step = (i: number) => `<div class="tk-ph-s">${markCell(icons[i], BRASS)}<span style="color:${colors[i]}">${esc(p.steps[i])}</span></div>`;
  const arr = `<svg viewBox="0 0 10 4" style="width:10mm;height:4mm;flex:none;display:block"><path d="M.5 2H8.6" stroke="${INK}" stroke-width=".5"/><path d="M9.6 2L7.6 .9V3.1Z" fill="${INK}"/></svg>`;
  return `<div class="tk-ph" style="left:${mm(PHASE.x)};top:${mm(PHASE.y)};width:${mm(TABLE.field.w)};height:${mm(TABLE.cell)}">`
    + `<div class="tk-ph-c"><b>${esc(p.title)}</b><span>${esc(p.sub)}</span></div>${p.steps.map((_, i) => step(i)).join(arr)}</div>`;
}
/** The 2 × 2 field: Company on top, Pirates below; arrows «напротив» and «по диагонали», the legend on the left, the joint volley's mark on the right. */
function fieldHtml(): string {
  const { w, h } = FIELD, s = TXT.scheme, n = TABLE.nest, t = TOKEN.shipToken, mid = w / 2;
  const diag = Math.abs((data.ships[0].diagDamage as { offset: number }).offset);
  const team = [{ c: COMPANY, ink: COMPANY_INK, icon: 'company', name: s.company }, { c: PIRATES, ink: PIRATES, icon: 'pirates', name: s.pirates }];
  const nest = (x: number, y: number, k: number) => {
    const c = team[k].c, g = (n - t) / 2;
    return `<rect x="${x}" y="${y}" width="${n}" height="${n}" rx="2" fill="${lighten(c, 0.9)}" stroke="${lighten(c, 0.15)}" stroke-width=".45"/>`
      + `<rect x="${x + g}" y="${y + g}" width="${t}" height="${t}" rx="1.2" fill="${CELL}" stroke="${lighten(c, 0.45)}" stroke-width=".3" stroke-dasharray="1.3 .9"/>`
      + ico(team[k].icon, 13, lighten(c, 0.62), 1.3, { x: x + (n - 13) / 2, y: y + (n - 13) / 2 });
  };
  const plate = (y: number, k: number) => {
    const pw = 38, ph = 8, x = mid - pw / 2;
    return `<rect x="${x}" y="${y - ph / 2}" width="${pw}" height="${ph}" rx="1.4" fill="${team[k].ink}"/>`
      + ico(team[k].icon, 5, '#fff4d8', 1.8, { x: x + 2.4, y: y - 2.5 })
      + `<text x="${mid + 2.6}" y="${y + 1.45}" text-anchor="middle" font-family="Alegreya SC" font-weight="700" font-size="4.1" letter-spacing=".35" fill="#fff4d8">${esc(team[k].name.toUpperCase())}</text>`;
  };
  const txt = (x: number, y: number, t: string, size = 3.1, weight = 500) => `<text x="${R(x)}" y="${R(y)}" text-anchor="middle" font-family="Alegreya Sans" font-weight="${weight}" font-size="${size}" fill="${INK}">${esc(t)}</text>`;
  const line = '#3a2c1c', dline = '#5a4a34', [c0, c1] = NEST.cols, [r0, r1] = NEST.rows;
  let svg = `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="2.6" fill="${PAPER}" stroke="${BRASS}" stroke-width=".6"/>`
    + `<rect x="1.7" y="1.7" width="${w - 3.4}" height="${h - 3.4}" rx="1.8" fill="none" stroke="${BRASS}" stroke-width=".22"/>`;
  for (const [k, y] of [r0, r1].entries()) for (const x of [c0, c1]) svg += nest(x, y, k);
  for (const x of [c0, c1]) svg += arrow(x + n / 2, r0 + n + 0.7, x + n / 2, r1 - 0.7, line, 0.6);
  svg += arrow(c0 + n + 1, r0 + n + 1, c1 - 1, r1 - 1, dline, 0.5, '1.5 1') + arrow(c1 - 1, r0 + n + 1, c0 + n + 1, r1 - 1, dline, 0.5, '1.5 1');
  svg += plate(r0 + n / 2, 0) + plate(r1 + n / 2, 1);
  // the legend: on the left, between the rows
  const lx = c0 / 2;
  svg += arrow(lx, 29, lx, 40, line, 0.6) + txt(lx, 45, s.front[0]) + txt(lx, 48.8, s.front[1])
    + arrow(lx - 5, 55, lx + 5, 63, dline, 0.5, '1.5 1') + txt(lx, 68.6, fill(s.diag, { diag }));
  // the joint volley: on the right
  const rx = c1 + n + (w - c1 - n) / 2;
  svg += ico('joint', 9, INK, 1.5, { x: rx - 4.5, y: 30 }) + s.joint.map((l, i) => txt(rx, 44.5 + i * 3.7, l, 3, i < 2 ? 700 : 500)).join('');
  return box(FIELD.x, FIELD.y, w, h, `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">${svg}</svg>`);
}
/** The three places under the field, sharing their borders: the sea deck, the sea card, «Эффекты этого хода». */
function trayHtml(): string {
  const s = TXT.scheme, ws = [TABLE.seaDeck.w, TABLE.seaCard.w, TABLE.effects.w], h = TRAY.h, w = ws.reduce((a, b) => a + b, 0);
  const xs = ws.map((_, i) => ws.slice(0, i).reduce((a, b) => a + b, 0)), icons = ['deck', 'card', 'hourglass'];
  const eff = s.effects.cards.map(cardName), effLines = [eff.slice(0, 2).join(', ') + ',', eff.slice(2).join(', ')];
  const caps = [{ title: s.seaDeck.title, lines: s.seaDeck.lines }, { title: s.seaCard.title, lines: s.seaCard.lines }, { title: s.effects.title, lines: effLines }];
  let svg = `<rect x=".3" y=".3" width="${w - 0.6}" height="${h - 0.6}" rx="2.4" fill="${PAPER}" stroke="${BRASS}" stroke-width=".6"/>`;
  svg += xs.slice(1).map(x => `<path d="M${x} .6V${h - 0.6}" stroke="${BRASS}" stroke-width=".45"/>`).join('');
  svg += ws.map((cw, i) => {
    const gw = Math.min(cw - 4, 59), gx = xs[i] + (cw - gw) / 2, gh = 85, gy = (h - gh) / 2;
    return `<rect x="${R(gx)}" y="${gy}" width="${gw}" height="${gh}" rx="3" fill="${CELL}" stroke="${lighten(BRASS, 0.35)}" stroke-width=".3" stroke-dasharray="1.3 .9"/>`
      + ico(icons[i], 22, lighten(FAINT, 0.35), 1.1, { x: xs[i] + (cw - 22) / 2, y: (h - 22) / 2 });
  }).join('');
  const capHtml = caps.map((c, i) => `<div class="tk-pl" style="left:${mm(TRAY.x + xs[i] + 1.2)};top:${mm(FIELD.y + FIELD.h + 2.6)};width:${mm(ws[i] - 2.4)}">${ico(icons[i], 6, INK, 1.7)}<div><b>${esc(c.title)}</b>${c.lines.map(l => `<span>${esc(l)}</span>`).join('')}</div></div>`).join('');
  return capHtml + box(TRAY.x, TRAY.y, w, h, `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">${svg}</svg>`);
}
/** Where the lasting effects lie. */
function longHtml(): string {
  const l = TXT.scheme.long;
  return `<div class="tk-long" style="left:${mm(FIELD.x)};top:${mm(LONG.y)};width:${mm(TABLE.field.w)}">${ico('lasting', 7, INK, 1.6)}<div><b>${esc(l.title)}.</b> ${esc(fill(l.text, { cards: l.cards.map(cardName).join(', ') }))}</div></div>`;
}
function shipTokensHtml(pics: Record<string, string> | null): string {
  const t = TOKEN.shipToken, list = ships();
  const one = (s: Ship, i: number) => {
    const x = i * t;
    // new: the kit ship fills the picture; the letter moves into the band, left of the name, off the sails
    if (pics) return `<rect x="${x}" y="0" width="${t}" height="${t}" fill="${PAPER}"/><image href="${pics[s.code]}" x="${x}" y="0" width="${PIC.w}" height="${PIC.h}" preserveAspectRatio="none"/><rect x="${x}" y="21.4" width="${t}" height="${t - 21.4}" fill="${s.color}"/>`
      + `<path d="M${x} 21.4H${x + t}" stroke="${BRASS_LIGHT}" stroke-width=".35"/>`
      + `<circle cx="${x + 3.9}" cy="25.7" r="2.9" fill="${darken(s.color, 0.25)}" stroke="${BRASS_LIGHT}" stroke-width=".3"/>`
      + `<text x="${x + 3.9}" y="27.1" text-anchor="middle" font-family="Alegreya SC" font-weight="800" font-size="3.9" fill="#fff4d8">${esc(s.code)}</text>`
      + `<text x="${x + 18.3}" y="26.85" text-anchor="middle" font-family="Alegreya SC" font-weight="700" font-size="${Math.min(3.4, 19 / (s.nick.length * 0.62))}" letter-spacing=".08" fill="#fff4d8">${esc(s.nick)}</text>`;
    return `<rect x="${x}" y="0" width="${t}" height="${t}" fill="${PAPER}"/><rect x="${x}" y="21.4" width="${t}" height="${t - 21.4}" fill="${s.color}"/>`
      + `<path d="M${x} 21.4H${x + t}" stroke="${BRASS_LIGHT}" stroke-width=".35"/>`
      + bigShip(DECK_KEY[s.code], x + 16.2, 20.2, 0.172)
      + `<circle cx="${x + 5.6}" cy="5.6" r="3.3" fill="${s.color}" stroke="${BRASS_LIGHT}" stroke-width=".3"/>`
      + `<text x="${x + 5.6}" y="7.05" text-anchor="middle" font-family="Alegreya SC" font-weight="800" font-size="4.3" fill="#fff4d8">${esc(s.code)}</text>`
      + `<text x="${x + t / 2}" y="26.85" text-anchor="middle" font-family="Alegreya SC" font-weight="700" font-size="3.5" letter-spacing=".12" fill="#fff4d8">${esc(s.nick)}</text>`;
  };
  return box(SHIPS.x, SHIPS.y, list.length * t, t, `<svg viewBox="0 0 ${list.length * t} ${t}" style="position:absolute;left:0;top:0;width:100%;height:100%">${list.map(one).join('')}</svg>`);
}

// ---- the identical marks: a blue square, a brass ring and a light star
const markSvg = (x: number, y: number) => {
  const m = TOKEN.marker, cx = x + m / 2, cy = y + m / 2;
  return `<rect x="${R(x)}" y="${R(y)}" width="${m}" height="${m}" fill="${MARK_BG}"/>`
    + `<circle cx="${R(cx)}" cy="${R(cy)}" r="4.1" fill="${darken(MARK_BG, 0.3)}" stroke="${BRASS_LIGHT}" stroke-width=".45"/>`
    + `<path d="M${R(cx)} ${R(cy - 3.2)}L${R(cx + 0.8)} ${R(cy - 0.8)}L${R(cx + 3.2)} ${R(cy)}L${R(cx + 0.8)} ${R(cy + 0.8)}L${R(cx)} ${R(cy + 3.2)}L${R(cx - 0.8)} ${R(cy + 0.8)}L${R(cx - 3.2)} ${R(cy)}L${R(cx - 0.8)} ${R(cy - 0.8)}Z" fill="#fff4d8"/>`;
};
function marksHtml(): { html: string; cuts: string } {
  const m = TOKEN.marker, { cols, rows, x, y } = MARKS, w = cols * m, h = rows * m;
  let svg = '';
  for (let i = 0; i < cols * rows; i++) svg += markSvg((i % cols) * m, Math.floor(i / cols) * m);
  // the outline with its ticks: grey; the lines between two dark marks: light
  let d = '', light = '';
  for (let c = 0; c <= cols; c++) { d += `M${R(x + c * m)} ${R(y - TICK)}V${R(y)}M${R(x + c * m)} ${R(y + h)}V${R(y + h + TICK)}`; if (c > 0 && c < cols) light += `M${R(x + c * m)} ${R(y)}V${R(y + h)}`; }
  for (let r = 0; r <= rows; r++) { d += `M${R(x - TICK)} ${R(y + r * m)}H${R(x)}M${R(x + w)} ${R(y + r * m)}H${R(x + w + TICK)}`; if (r > 0 && r < rows) light += `M${R(x)} ${R(y + r * m)}H${R(x + w)}`; }
  d += `M${R(x)} ${R(y)}H${R(x + w)}V${R(y + h)}H${R(x)}Z`;
  return {
    html: box(x, y, w, h, `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">${svg}</svg>`),
    cuts: `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/><path d="${light}" stroke="${CUT_ON_DARK}" stroke-width="${CUT_W}" fill="none"/>`
  };
}
const markIcon = (d: number) => `<svg viewBox="0 0 ${TOKEN.marker} ${TOKEN.marker}" style="width:${mm(d)};height:${mm(d)};flex:none;display:inline-block;vertical-align:middle">${markSvg(0, 0)}</svg>`;

// ---- pages
export function tokenPages(ctx: Ctx, pics: Record<string, string> | null = null, strips = false): PageSpec[] {
  const econ = data.econ as { income: number; first_income: number; cap: number; second_start: number }, rules = data.rules as Record<string, number>;
  const nums = { income: econ.income, first: econ.first_income, cap: econ.cap, start: econ.second_start, firstGame: rules.firstGameSecondStart };
  const pd = TOKEN.powder, fr = TOKEN.fire, coinD = 15, of = strips ? 4 : 3, page = (n: number) => fill(TXT.page, { n, of });
  const cells = (g: { cols: number; rows: number; x: number; y: number }, size: number, count: number, inner: (i: number) => string) => {
    if (g.cols * g.rows !== count) throw new Error(`token grid ${g.cols} × ${g.rows}, expected ${count}`);
    return box(g.x, g.y, g.cols * size, g.rows * size, Array.from({ length: count }, (_, i) => box((i % g.cols) * size, Math.floor(i / g.cols) * size, size, size, inner(i), 'tk-tok')).join(''), '', `background:${PAPER}`);
  };
  const markers = markersHtml(ctx);
  const page1 = head(TXT.title, TXT.lead, page(1))
    + TXT.holds.map((h, i) => holdHtml(h, HOLD_BOX.y + i * HOLD_BOX.h, fill(h.rule, nums))).join('')
    + cap(POWDER.x, POWDER.y - CAP, fill(TXT.powder, { n: COUNTS.powder }))
    + cells(POWDER, pd, COUNTS.powder, () => iconImg(ctx, 'coin', (pd - coinD) / 2, (pd - coinD) / 2, coinD))
    + cap(FIRE.x, FIRE.y - CAP, fill(TXT.fire, { n: COUNTS.fire }))
    + cells(FIRE, fr, COUNTS.fire, () => `<img src="${FIRE_URI}" style="position:absolute;left:0;top:0;width:${fr}mm;height:${fr}mm" alt="">`)
    + cap(MARK.x, MARK.y - CAP, TXT.markers) + markers.html
    + cap(UNDER.x, UNDER.y - CAP, TXT.underwaterCaption) + underwaterHtml()
    + `<div class="tk-hint">${esc(TXT.hint)}</div>` + foot(1, of)
    + cutLayer(gridCuts(HOLD_BOX.x, HOLD_BOX.y, 1, TXT.holds.length, HOLD_BOX.w, HOLD_BOX.h, HOLD_BOX.tick)
      + gridCuts(POWDER.x, POWDER.y, POWDER.cols, POWDER.rows, pd, pd) + gridCuts(FIRE.x, FIRE.y, FIRE.cols, FIRE.rows, fr, fr)
      + markers.cuts + gridCuts(UNDER.x, UNDER.y, 1, 1, TOKEN.underwater.w, TOKEN.underwater.h));
  const s = TXT.scheme;
  const page2 = head(s.title, s.lead, `${s.tag} · ${page(2)}`) + phaseHtml() + fieldHtml() + trayHtml() + longHtml() + foot(2, of);
  const mp = TXT.marksPage, st = TOKEN.shipToken, marks = marksHtml();
  const uses = `<div class="tk-uses" style="left:${mm(MARKS.x)};top:${mm(MARKS.y + MARKS.rows * TOKEN.marker + TICK + 3)};width:${mm(MARKS.cols * TOKEN.marker)}">`
    + `<div class="tk-uses-r">${mp.uses.map(u => `<span>${markIcon(4.4)}${esc(u)}</span>`).join('')}</div><div>${esc(mp.sweep)}</div></div>`;
  const page3 = head(mp.title, mp.lead, page(3))
    + cap(SHIPS.x, SHIPS.y - CAP, fill(mp.ships, { n: ships().length })) + shipTokensHtml(pics)
    + cap(MARKS.x, MARKS.y - CAP, fill(mp.marks, { n: TABLE.marks, spare: TABLE.spareMarks })) + marks.html + uses + foot(3, of)
    + cutLayer(gridCuts(SHIPS.x, SHIPS.y, ships().length, 1, st, st) + marks.cuts);
  const pages: PageSpec[] = [{ html: page1 }, { html: page2 }, { html: page3 }];
  // concept B with the counters off the board: the four strips «Осталось карт» / «Реакций сыграно» (cut along the lines)
  if (strips) pages.push(counterStripsPage(head(TXT.strips.title, TXT.strips.lead, page(4)), foot(4, of)));
  return pages;
}

export const TOKENS_CSS = `
.tk-title{position:absolute;left:10mm;top:8mm;font:800 22pt/1 'Alegreya SC',serif;color:${INK};letter-spacing:.01em}
.tk-tag{position:absolute;right:10mm;top:11.5mm;font:500 8.5pt/1 'Alegreya Sans',sans-serif;color:#7a6a52;letter-spacing:.09em;text-transform:uppercase}
.tk-lead{position:absolute;left:10mm;top:17.4mm;font:italic 400 10pt/1.2 Alegreya,serif;color:#4a3a26}
.tk-cap{position:absolute;font:700 10pt/1.2 Alegreya,serif;color:${INK};white-space:nowrap}
.tk-foot{position:absolute;left:10mm;top:285mm;font:500 7pt/1 'Alegreya Sans',sans-serif;color:#8a7a62;letter-spacing:.09em;text-transform:uppercase}
.tk-hint{position:absolute;left:10mm;right:10mm;top:273mm;font:italic 400 9.5pt/1.2 Alegreya,serif;color:#4a3a26;text-align:center}
.tk-hold{background:${PARCHMENT}}
.tk-hold-name{position:absolute;left:3.8mm;top:4.2mm;font:800 15pt/1 'Alegreya SC',serif;letter-spacing:.03em;white-space:nowrap}
.tk-hold-rule{position:absolute;left:3.8mm;top:10.1mm;width:88mm;font:500 9pt/1.08 'Alegreya Sans',sans-serif;color:${INK};text-wrap:balance}
.tk-hcs{position:absolute;right:3.6mm;display:flex;gap:4.5mm}
.tk-hc{display:flex;align-items:center;gap:1.8mm}
.tk-hc-l{display:flex;flex-direction:column;align-items:flex-end;text-align:right;font:500 7.5pt/1.12 'Alegreya Sans',sans-serif;color:${INK};white-space:nowrap}
.tk-hc-l b{font:700 9pt/1.12 'Alegreya Sans',sans-serif}
.tk-ph{position:absolute;display:flex;align-items:center;gap:2.4mm}
.tk-ph-c{display:flex;flex-direction:column;margin-right:3mm;font:500 8.5pt/1.15 'Alegreya Sans',sans-serif;color:${INK};white-space:nowrap}
.tk-ph-c b{font:700 10pt/1.15 Alegreya,serif}
.tk-ph-s{display:flex;align-items:center;gap:1.8mm;font:700 10.5pt/1 Alegreya,serif;white-space:nowrap}
.tk-pl{position:absolute;display:flex;gap:1.6mm;align-items:flex-start;font:500 8.5pt/1.18 'Alegreya Sans',sans-serif;color:${INK};white-space:nowrap}
.tk-pl div{display:flex;flex-direction:column}
.tk-pl b{font:700 10pt/1.15 Alegreya,serif}
.tk-long{position:absolute;display:flex;gap:2mm;align-items:flex-start;font:500 9pt/1.22 'Alegreya Sans',sans-serif;color:${INK}}
.tk-long b{font:700 10pt/1.2 Alegreya,serif}
.tk-uses{position:absolute;font:500 9pt/1.3 'Alegreya Sans',sans-serif;color:${INK};text-align:center}
.tk-uses-r{display:flex;justify-content:center;gap:5mm;margin-bottom:1mm}
.tk-uses-r span{display:inline-flex;align-items:center;gap:1.4mm;white-space:nowrap}
.tk-tok{overflow:hidden}
.tk-uw{color:#fff}
.tk-uw-t{position:absolute;left:0;right:0;top:2.7mm;text-align:center;font:800 12pt/1 'Alegreya SC',serif;letter-spacing:.05em;color:#fff}
.tk-uw-l{position:absolute;left:2mm;right:2mm;top:7.9mm;text-align:center;font:700 8pt/1.2 'Alegreya Sans',sans-serif;color:#fff;white-space:nowrap}
`;

export async function build(ctx: Ctx): Promise<Part[]> {
  const pics = (ctx.opts.tokens ?? 'new') === 'new' ? await kitTokenPics(ctx) : null;
  const pages = tokenPages(ctx, pics, (ctx.opts.board ?? 'b') === 'b' && ctx.opts.counters === 'strip');
  return [{ file: '04-tryumy-zhetony', title: TXT.partTitle, css: TOKENS_CSS, pages }];
}
