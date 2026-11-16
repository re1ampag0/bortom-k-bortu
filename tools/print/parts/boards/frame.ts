// 03 — the shared FRAME (каркас) of the ship boards in the concepts 'a' («у борта») and 'b' («стол капитана»), and the
// back «Затонул» (docs/tasks/print-kit-boards.md, «КАРКАС ПЛАНШЕТА», «ОБОРОТ ПЛАНШЕТА «ЗАТОНУЛ»»).
//
// ─── THE MATERIAL INTERFACE ──────────────────────────────────────────────────────────────────────────────────────────
// Every ship has one material module, tools/print/parts/boards/<pearl|revenge|endeavour|dutch>.ts, exporting
//     export const material: ShipMaterial = { palette?(base) → Pal, a(g) → Layers, b(g) → Layers, wreck(w) → Layers }
// (each function may be async). The frame owns everything that is read during play: cells, numbers, labels, slots,
// the light text fields, the HTML text. A material only paints around and under it, and gets all the geometry in g:
//   g.zones   — header, tracks, mid (middle column), col (right column), strip (counters), footer, picture (A: the
//               close-up's area), midFree (the empty rest of the middle column, null if none), engraving (B: where the
//               frame puts Layers.engraving — the free middle column; null: at the bottom of the right column) — mm;
//   g.rows    — every track row: key, top, label baseline, number baseline, cy, x0…x1 and band (the rect that holds
//               label, numbers, cells, thresholds and extra cells), cells[] (n, cx, cy, x, y, w, h, start);
//   g.slots   — every slot rect: 'fire' ×3, 'underwater', 'surfaced', 'volley' (+ 'volley2' on the Dutchman),
//               'cards' / 'reactions' (strip cells, n on each) — mm;
//   g.boxes   — the light text fields of the frame (header, mid boxes, strip, footer) — paint nothing opaque over them;
//   g.plates  — A only: the tight light plates the frame lays over the picture under its words and numbers on the rows
//               (one slim plate per label line, a chip per number and per short note; measured on the real fonts) —
//               the frame draws them itself (fill-opacity over the JPEG), a material must not dim the rows any more;
//               rw.lineEnd — where the words of a row's label line end (mm);
//   g.pal     — the colours (palette() may change them; text contrast is checked against pal.field and warned);
//   g.kit     — the art kit (tools/card-art/scenes/kit: ship, shipBox, shipGeom, makeLight, sky, water, …);
//   g.art(key, svg, bleed) — a 200 × 280 scene (+ bleed units round it) → a JPEG through the print profile → its URL;
//   g.uid     — a prefix for ids in your <defs>.
// Layers (all optional): under — SVG in page mm painted first (background, the ship picture, the parts of the ship the
// cells are set into — ports, planks, flasks; never CSS opacity/filter on images; the frame's plates come after it); over — SVG painted after the frame's lines, under
// the HTML text (pins, rivets, knots — never over a number or a word); css — extra CSS for the HTML boxes (.bo2-box,
// .bo2-col, …, every rule scoped with g.scope; no filter, no blurred shadows); engraving — B only: SVG inside the picture box at the bottom of the right
// column, in the viewBox 0 0 ENGRAVING.w ENGRAVING.h (it is scaled down to the room that is left).
// Shared painting helpers (the close-up of the ship, the engraving, wood, rope, brass, the chart) are in paint.ts.
// The back «Затонул»: wreck(w) gets WreckGeo (zones: title, text, side, art; slots: the two «за союзника» cells).
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { HERE, ROOT, data, esc, fontCss, rich, type Ctx } from '../../kit';
import { BOARD, priceOf, trackCells, type Ship } from '../../layout';
import { BRASS, BRASS_DARK, DECK_KEY, INK, PARCHMENT, TYPE, SEA, contrast, darken, lighten } from '../../colors';
import { iconImg } from '../../icons';
import { makeArt } from '../../art';

export type Concept = 'a' | 'b';
export type ShipKey = 'pearl' | 'revenge' | 'endeavour' | 'dutch';
export type TrackKey = 'hull' | 'sails' | 'guns' | 'crew' | 'souls';
export interface Rect { x: number; y: number; w: number; h: number }
export interface CellGeo extends Rect { n: number; cx: number; cy: number; start: boolean }
export interface RowGeo { key: TrackKey; top: number; labelY: number; numY: number; cy: number; x0: number; x1: number; band: Rect; cells: CellGeo[]; start: number; lineEnd: number }
export type SlotKind = 'fire' | 'underwater' | 'surfaced' | 'volley' | 'volley2' | 'cards' | 'reactions';
export interface SlotGeo extends Rect { kind: SlotKind; n?: number }
export interface Pal {
  ship: string; deep: string; solid: string; tint: string; line: string;
  /** the light field under text, its line, body text, soft text, the cell fill */
  field: string; fieldLine: string; ink: string; soft: string; cell: string;
}
/** the kit of tools/card-art/scenes/kit (CommonJS): typed loosely, see its README */
export interface Kit {
  ship(u: string, L: unknown, o: Record<string, unknown>): string;
  shipBox(kind: string, o: Record<string, unknown>): { x0: number; x1: number; top: number; y: number; w: number; h: number };
  shipGeom(kind: string, o: Record<string, unknown>): { nearRail(X: number): [number, number]; masts: { x: number; H: number }[] };
  makeLight(l: unknown, cam: Record<string, number>): unknown;
  LIGHTS: Record<string, unknown>; SHIP_SPECS: Record<string, { len: number; ports?: { h: number }[] }>;
  [k: string]: unknown;
}
interface GeoBase { ship: Ship; key: ShipKey; kind: string; pal: Pal; uid: string; /** the CSS class round the page: scope every rule of Layers.css with it */ scope: string; page: { w: number; h: number }; kit: Kit; art(key: string, svg: string, bleed?: number): Promise<string> }
export interface Geo extends GeoBase {
  concept: Concept;
  zones: { header: Rect; tracks: Rect; mid: Rect; col: Rect; strip: Rect; footer: Rect; picture: Rect; midFree: Rect | null; engraving: Rect | null };
  rows: RowGeo[]; slots: SlotGeo[]; boxes: Rect[]; plates: Rect[];
}
export interface WreckGeo extends GeoBase { zones: { title: Rect; text: Rect; side: Rect; art: Rect }; slots: Rect[]; boxes: Rect[] }
export interface Layers { under?: string; over?: string; css?: string; engraving?: string }
type Maybe<T> = T | Promise<T>;
export interface ShipMaterial { palette?(base: Pal): Pal; a(g: Geo): Maybe<Layers>; b(g: Geo): Maybe<Layers>; wreck(w: WreckGeo): Maybe<Layers> }
/** The picture box of B's engraving (the material's viewBox). */
export const ENGRAVING = { w: 84, h: 52 };

const require = createRequire(import.meta.url);
export const KIT = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as Kit;

// ---- texts ----
interface FrameText {
  tracks: Record<TrackKey, { name: string; note: string; zero?: string; flip?: string; start?: string; max?: string; kraken?: string; spend?: string }>;
  start: string; volley: string[]; effects: string;
  fires: { title: string; note: string }; underwater: { title: string; note: string }; surfaced: { title: string; note: string };
  abilities: string; once: string; heart: Record<string, string>; plans: string;
  legend: { title: string; note: string }; powder: string;
  cards: { title: string; start: string; down: string }; reactions: { title: string; note: string };
  footer: string[];
  wreck: { title: string; section: string; captainLine: string; ally: string[]; clear: Record<string, string>; jones: string; free: string };
}
const TXT = (JSON.parse(fs.readFileSync(path.join(HERE, 'text/boards.json'), 'utf8')) as { frame: FrameText }).frame;
const RULES = data.rules as Record<string, number>;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
const nb = (s: string) => s.replace(/(\d) (?=[«А-Яа-яЁё])/g, '$1 ').replace(/([А-Яа-яЁё]) (?=\d+[).,;:])/g, '$1 ');
const richNb = (s: string) => rich(nb(s)).replace(/\d+ <img class="s-i"[^>]*><span class="s-w"[^>]*>[^<]*<\/span>/g, m => `<span class="bo2-nb">${m}</span>`);
/** **bold** of the md texts → HTML */
const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// ---- geometry, mm ----
export const PAGE = { w: 297, h: 210 };
const FRAME_AT = 8.5, EDGE = 11.2, RIGHT = PAGE.w - EDGE, BOTTOM = 197;
const Z = {
  header: { x: EDGE, y: EDGE, w: RIGHT - EDGE, h: 18 },
  tracks: { x: EDGE, y: 33, w: 187, h: 137 },
  col: { x: 201.8, y: 33, w: RIGHT - 201.8, h: 137 },
  strip: { x: EDGE, y: 172, w: RIGHT - EDGE, h: 17 },
  footer: { x: EDGE, y: 191, w: RIGHT - EDGE, h: 5 },
  picture: { x: EDGE, y: 31, w: 188.4, h: 140 }
};
const MIDX = 118, MIDW = 80;
/** one row from its top: label baseline, number baseline, cell top; the cells are BOARD.cell squares at BOARD.pitch */
const ROW = { label: 3.7, num: 7.7, cellTop: 8.4, h: 8.4 + BOARD.cell, under: 3.6, rx: 2.2 };
const pt = (n: number) => n * 25.4 / 72;
const r = (n: number) => Math.round(n * 100) / 100;
/** rough text widths (mm) for placing SVG lettering; checked on the renders */
const tw = (s: string, size: number, k = 0.5) => s.length * pt(size) * k;
const ORDER: TrackKey[] = ['sails', 'souls', 'crew', 'guns', 'hull'];

// ---- colours ----
const PAPER = '#fdf9ec', CELL = '#fffdf6', SOFT = '#4f3d28';
const SINK = { fill: '#f6d8cc', line: '#a8442f', text: '#7e2614' };
// the flame in an empty Fire slot: mid-dark, so it stays visible on a greyscale print (≈ 57 % grey on a 94 % field)
const FIRE = { fill: '#fdf0e4', line: TYPE['ЗАРЯД'].t, text: darken(TYPE['ЗАРЯД'].td, 0.1), flame: '#d07a45' };
const WATER = { fill: '#e8f3f2', line: SEA.t, text: SEA.td, soft: '#bfdfe0' };
export function basePalette(color: string): Pal {
  let deep = color, solid = color;
  for (let k = 0.05; contrast(deep, PARCHMENT) < 6.2 && k < 0.8; k += 0.05) deep = darken(color, k);
  for (let k = 0.05; contrast(solid, '#fff8e6') < 4.5 && k < 0.8; k += 0.05) solid = darken(color, k);
  return { ship: color, deep, solid, tint: lighten(color, 0.93), line: lighten(color, 0.45), field: PAPER, fieldLine: lighten(BRASS, 0.3), ink: INK, soft: SOFT, cell: CELL };
}

// ---- layout ----
interface TrackDef { key: TrackKey; cells: number[]; start: number }
function trackDefs(ship: Ship): TrackDef[] {
  const t: Partial<Record<TrackKey, TrackDef>> = {
    hull: { key: 'hull', cells: trackCells(ship.hull), start: ship.hull },
    sails: { key: 'sails', cells: trackCells(ship.sails), start: ship.sails },
    guns: { key: 'guns', cells: trackCells(ship.guns), start: ship.guns },
    crew: { key: 'crew', cells: trackCells(ship.crew).filter(n => n >= 1), start: ship.crew }
  };
  if (ship.souls != null) t.souls = { key: 'souls', cells: trackCells(ship.souls), start: ship.start_souls ?? 0 };
  return ORDER.map(k => t[k]).filter((x): x is TrackDef => !!x);
}
// every row carries a caption line under its cells (thresholds, notes, «Кракен», «переверните планшет»): the gaps are
// spread between whole bands, so the caption under one row never crowds the label of the next (review of 16.11)
const rowH = (d: TrackDef) => ROW.h + ROW.under + (d.key === 'souls' ? 0.6 : 0);
const volleyCount = (ship: Ship) => ship.souls != null ? 2 : 1;

export function layout(ship: Ship, concept: Concept, pal: Pal, uid: string): Omit<Geo, 'kit' | 'art'> {
  const defs = trackDefs(ship), tz = Z.tracks, sum = defs.reduce((a, d) => a + rowH(d), 0), gap = (tz.h - sum) / (defs.length - 1);
  const rows: RowGeo[] = [], slots: SlotGeo[] = [], boxes: Rect[] = [];
  let y = tz.y;
  for (const d of defs) {
    const x0 = tz.x, cells: CellGeo[] = d.cells.map((n, i) => { const x = x0 + i * BOARD.pitch, yy = y + ROW.cellTop; return { n, x, y: yy, w: BOARD.cell, h: BOARD.cell, cx: x + BOARD.cell / 2, cy: yy + BOARD.cell / 2, start: n === d.start }; });
    let x1 = cells[cells.length - 1].x + BOARD.cell;
    // the two Volley cells of the Dutchman stand apart: «Залп дан · 1 Порох» and «по Сердцу» over them must not touch
    if (d.key === 'guns') for (let i = 0; i < volleyCount(ship); i++) { const sx = x1 + (i ? 10 : 5); slots.push({ kind: i ? 'volley2' : 'volley', x: sx, y: y + ROW.cellTop, w: BOARD.cell, h: BOARD.cell }); x1 = sx + BOARD.cell; }
    const under = ROW.under;
    // the band holds the label line, the notes and the start label too: up to the middle column (the Hull: its own row)
    const bandR = d.key === 'hull' ? x1 : MIDX - 2.5;
    rows.push({ key: d.key, top: y, labelY: y + ROW.label, numY: y + ROW.num, cy: y + ROW.cellTop + BOARD.cell / 2, x0, x1, cells, start: d.start, lineEnd: x0, band: { x: x0, y, w: bandR - x0, h: ROW.h + under } });
    y += rowH(d) + gap;
  }
  const hullTop = rows.find(rw => rw.key === 'hull')!.top;
  // the middle column: the pointer to the edge, the Fires, the Dutchman's two slots
  const mid: Rect = { x: MIDX, y: tz.y, w: MIDW, h: hullTop - 3 - tz.y };
  let my = mid.y + 6.5;
  const fireBox = { x: MIDX, y: my, w: MIDW, h: 38 }; boxes.push(fireBox);
  const fs3 = BOARD.fireSlot, fgap = (MIDW - 3 * fs3 - 3) / 2;
  for (let i = 0; i < RULES.maxFires; i++) slots.push({ kind: 'fire', x: MIDX + 1.5 + i * (fs3 + fgap), y: my + 38 - 1.5 - fs3, w: fs3, h: fs3 });
  my += 38 + 2.5;
  if (ship.souls != null) {
    const u = BOARD.underwaterSlot;
    slots.push({ kind: 'underwater', x: MIDX, y: my, w: u.w, h: u.h }); boxes.push({ x: MIDX + u.w, y: my, w: MIDW - u.w, h: u.h });
    my += u.h + 4;
    slots.push({ kind: 'surfaced', x: MIDX, y: my, w: u.w, h: u.h }); boxes.push({ x: MIDX + u.w, y: my, w: MIDW - u.w, h: u.h });
    my += u.h;
  }
  let midFree: Rect | null = mid.y + mid.h - my > 12 ? { x: MIDX, y: my + 2, w: MIDW, h: mid.y + mid.h - my - 2 } : null, engraving: Rect | null = null;
  // B: the engraving takes the free middle column when it is big enough, else the rest of the right column
  if (concept === 'b' && midFree && midFree.h >= 40) { engraving = midFree; midFree = null; }
  // the bottom strip: «Осталось карт» 6…0 and «Реакций» 0…3, pitch 14 (an 11 mm marker in a 13 mm cell)
  const st = Z.strip, cy0 = st.y + st.h - BOARD.cell, CP = 14;
  const cardsX = st.x + 45;
  for (let i = 0; i <= 6; i++) slots.push({ kind: 'cards', n: 6 - i, x: cardsX + i * CP, y: cy0, w: BOARD.cell, h: BOARD.cell });
  const reX = RIGHT - 3 * CP - BOARD.cell;
  for (let i = 0; i <= 3; i++) slots.push({ kind: 'reactions', n: i, x: reX + i * CP, y: cy0, w: BOARD.cell, h: BOARD.cell });
  boxes.push(Z.header, st, Z.footer);
  return { ship, key: DECK_KEY[ship.code], kind: DECK_KEY[ship.code], scope: `.bo2-${DECK_KEY[ship.code]}`, concept, pal, uid, page: PAGE, zones: { ...Z, mid, midFree, engraving }, rows, slots, boxes, plates: [] };
}

// ---- SVG pieces of the skeleton ----
interface TO { font?: string; w?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; ls?: string; italic?: boolean; deco?: string }
const text = (x: number, y: number, s: string, size: number, o: TO = {}) =>
  `<text x="${r(x)}" y="${r(y)}" font-family="${o.font ?? 'Alegreya Sans'}" font-weight="${o.w ?? 500}"${o.italic ? ' font-style="italic"' : ''} font-size="${r(pt(size))}" fill="${o.color ?? INK}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.deco ? ` text-decoration="${o.deco}"` : ''}>${esc(s)}</text>`;
const cellRect = (c: Rect, fillC: string, line: string, sw = 0.4) => `<rect x="${r(c.x + sw / 2)}" y="${r(c.y + sw / 2)}" width="${r(c.w - sw)}" height="${r(c.h - sw)}" rx="2" fill="${fillC}" stroke="${line}" stroke-width="${sw}"/>`;
/** a number above a cell: 6 and 9 underlined (the board is read upside down from across the table) */
const num = (cx: number, y: number, n: number, color: string, bold = 700) => text(cx, y, String(n), 9, { w: bold, color, anchor: 'middle', deco: n === 6 || n === 9 ? 'underline' : undefined });
export const ICON = {
  /** the fonts have no ★, ↑, ⚓: every sign is a path */
  arrow: (x: number, y: number, dir: 'up' | 'right' | 'down', len: number, color: string, w = 0.5) => {
    const [dx, dy] = dir === 'up' ? [0, -1] : dir === 'down' ? [0, 1] : [1, 0], x2 = x + dx * len, y2 = y + dy * len, h = 1.6;
    const px = -dy, py = dx;
    return `<path d="M${r(x)} ${r(y)}L${r(x2 - dx * h * 0.6)} ${r(y2 - dy * h * 0.6)}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="M${r(x2)} ${r(y2)}L${r(x2 - dx * h * 1.6 + px * h)} ${r(y2 - dy * h * 1.6 + py * h)}L${r(x2 - dx * h * 1.6 - px * h)} ${r(y2 - dy * h * 1.6 - py * h)}Z" fill="${color}"/>`;
  },
  flame: (cx: number, cy: number, k: number, color: string) => `<path transform="translate(${r(cx)} ${r(cy)}) scale(${k})" d="M0 -5.2C2.3 -2.6 4 -0.8 4 1.6a4 4 0 0 1 -8 0c0 -1.7 0.9 -3 2 -4.2c0.3 1.3 0.9 2 1.7 2.1c0.9 -1.4 0.9 -3 0.3 -4.7z" fill="${color}"/>`,
  ball: (cx: number, cy: number, R: number, color: string) => `<circle cx="${r(cx)}" cy="${r(cy)}" r="${R}" fill="${color}"/><circle cx="${r(cx - R * 0.35)}" cy="${r(cy - R * 0.35)}" r="${r(R * 0.28)}" fill="#fff" fill-opacity=".35"/>`,
  card: (x: number, y: number, w: number, color: string) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(w * 1.4)}" rx="${r(w * 0.12)}" fill="none" stroke="${color}" stroke-width=".45"/><rect x="${r(x + w * 0.18)}" y="${r(y + w * 0.18)}" width="${r(w * 0.64)}" height="${r(w * 1.04)}" rx="${r(w * 0.06)}" fill="${color}" fill-opacity=".25"/>`,
  waves: (x: number, y: number, w: number, color: string) => [0, 1.6].map(d => `<path d="M${r(x)} ${r(y + d)}${'q1 -.8 2 0t2 0'.repeat(Math.max(1, Math.round(w / 4)))}" fill="none" stroke="${color}" stroke-width=".45" stroke-linecap="round"/>`).join('')
};

// ---- measured words: A's plates hug them. Widths come from the browser on the real fonts (measureMissing), the
// rough estimate stands in only until then ----
const WID = new Map<string, number>(), MISS = new Set<string>();
function widthOf(s: string, size: number, o: TO = {}): number {
  const k = JSON.stringify([o.font ?? 'Alegreya Sans', o.w ?? 500, size, o.ls ?? '', o.italic ? 1 : 0, s]), v = WID.get(k);
  if (v != null) return v;
  MISS.add(k);
  return tw(s, size, /SC/.test(o.font ?? '') ? 0.72 : 0.5);
}
async function measureMissing(ctx: Ctx): Promise<void> {
  const keys = [...MISS].filter(k => !WID.has(k));
  MISS.clear();
  if (!keys.length) return;
  const spans = keys.map((k, i) => {
    const [font, w, size, ls, it, s] = JSON.parse(k) as [string, number, number, string, number, string];
    return `<span id="m${i}" style="position:absolute;white-space:pre;font-family:'${font}';font-weight:${w};font-size:${size}pt;letter-spacing:${ls || 'normal'};font-style:${it ? 'italic' : 'normal'}">${esc(s)}</span>`;
  }).join('');
  const page = await ctx.browser.newPage();
  try {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}body{font-variant-numeric:lining-nums}</style></head><body>${spans}</body></html>`);
    await page.evaluate(async () => { await document.fonts.ready; });
    const px = await page.evaluate((n: number) => Array.from({ length: n }, (_, i) => document.getElementById('m' + i)!.getBoundingClientRect().width), keys.length);
    keys.forEach((k, i) => WID.set(k, px[i] * 25.4 / 96));
  } finally { await page.close(); }
}
/** the ink box of a line of SVG text: from a little over the capitals to under the descenders */
function textBox(x: number, y: number, s: string, size: number, o: TO = {}): Rect {
  const w = widthOf(s, size, o), em = pt(size), x0 = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x;
  return { x: x0, y: y - 0.74 * em, w, h: 0.97 * em };
}
const grow = (b: Rect, px: number, py: number, minW = 0): Rect => { const w = Math.max(b.w + 2 * px, minW); return { x: b.x + b.w / 2 - w / 2, y: b.y - py, w, h: b.h + 2 * py }; };
/** the words of one line become one slim plate where they stand close (a gap under 3 mm) */
function mergeLine(boxes: Rect[]): Rect[] {
  const s = [...boxes].sort((a, b) => a.x - b.x), out: Rect[] = [];
  for (const b of s) {
    const l = out[out.length - 1];
    if (l && b.x - (l.x + l.w) < 3) { const x1 = Math.max(l.x + l.w, b.x + b.w), y0 = Math.min(l.y, b.y), y1 = Math.max(l.y + l.h, b.y + b.h); Object.assign(l, { w: x1 - l.x, y: y0, h: y1 - y0 }); }
    else out.push({ ...b });
  }
  return out;
}

/** The track labels: large enough to be read upside down from the other end of the table. */
const NAME = 14;
interface RowOut { svg: string; plates: Rect[]; lineEnd: number }
function rowParts(row: RowGeo, pal: Pal): RowOut {
  const T = TXT.tracks[row.key], out: string[] = [], line: Rect[] = [], chips: Rect[] = [], nums: Rect[] = [], souls = row.key === 'souls';
  const put = (list: Rect[], x: number, y: number, s: string, size: number, o: TO) => { out.push(text(x, y, s, size, o)); list.push(textBox(x, y, s, size, o)); };
  const nameO: TO = { font: 'Alegreya SC', w: 800, color: pal.deep, ls: '.03em' }, nameEnd = row.x0 + widthOf(T.name, NAME, nameO);
  put(line, row.x0, row.labelY, T.name, NAME, nameO);
  // «старт · выше не восстанавливать» on the label line over the start cell; on the Souls track only «старт» (no ceiling)
  const sc = row.cells.find(c => c.start)!, startText = souls ? T.start ?? '' : TXT.start, startO: TO = { w: 800, color: pal.deep }, sw = widthOf(startText, 8, startO);
  let sx = Math.max(sc.x, nameEnd + 3), anchor: 'start' | 'end' = 'start';
  if (sx + sw > (row.key === 'hull' ? Z.tracks.x + Z.tracks.w : MIDX - 2)) { sx = sc.x + sc.w; anchor = 'end'; }
  put(line, sx, row.labelY, startText, 8, { ...startO, anchor });
  const noteO: TO = { color: pal.soft }, noteX = nameEnd + 2.5, noteW = widthOf(T.note, 9, noteO), startLeft = anchor === 'end' ? sx - sw : sx;
  // the Souls: how they are spent, on the label line after «старт»
  if (souls && T.spend) put(line, sx + sw + 4, row.labelY, T.spend, 8, { w: 700, color: pal.soft });
  // a note that does not fit between the name and «старт…» goes on the lower caption line (after the threshold under the
  // first cell), never to the right of the last cell: there it would read as the caption of the cell next to it
  const c0 = row.cells[0], underY = c0.y + BOARD.cell + 3.1, zeroText = row.key === 'hull' ? T.flip : souls ? undefined : T.zero;
  if (T.note && noteX + noteW < startLeft - 2.5) put(line, noteX, row.labelY, T.note, 9, noteO);
  else if (T.note) {
    const zx = c0.x + 0.3 + (zeroText ? widthOf(zeroText, 8, { w: 800 }) + 3 : 0), right = row.key === 'hull' ? Z.tracks.x + Z.tracks.w : MIDX - 2;
    if (zx + noteW < right) put(chips, zx, underY, T.note, 9, noteO);
    else console.warn(`warning: board row ${row.key}: the note «${T.note}» does not fit`);
  }
  for (const c of row.cells) {
    const sink = row.key === 'hull' && c.n === 0, floor = !souls && c === row.cells[0];
    const bg = sink ? SINK.fill : souls && c.n > row.start ? lighten(pal.ship, 0.9 - 0.06 * (c.n - row.start - 1)) : pal.cell;
    out.push(cellRect(c, bg, c.start ? pal.ship : sink ? SINK.line : floor ? darken(BRASS, 0.2) : BRASS_DARK, c.start ? 0.9 : 0.4));
    out.push(num(c.cx, row.numY, c.n, c.start ? pal.deep : pal.ink, c.start ? 800 : 700));
    nums.push(grow(textBox(c.cx, row.numY, String(c.n), 9, { w: 800, anchor: 'middle' }), 0.9, 0.35, 4.4));
    if (sink && T.zero) out.push(text(c.cx, c.cy + 1.2, T.zero, 8, { w: 800, color: SINK.text, anchor: 'middle' }));
  }
  // the threshold under the lowest cell (Crew: «не ниже 1» under its first cell); the Hull: what to do at 0
  if (!souls && row.key !== 'hull' && T.zero) put(chips, c0.x + 0.3, underY, T.zero, 8, { w: 800, color: pal.deep });
  if (row.key === 'hull' && T.flip) put(chips, c0.x + 0.3, underY, T.flip, 8, { w: 800, color: SINK.text });
  if (souls) {
    const last = row.cells[row.cells.length - 1], k = row.cells.find(c => c.n === 3);
    if (T.max) put(chips, last.x + last.w + 2.5, row.cy + pt(9) * 0.33, fill(T.max, { n: last.n }), 9, { w: 700, color: pal.soft });
    if (k && T.kraken) put(chips, k.x + 0.3, underY, fill(T.kraken, { n: 3 }), 8, { w: 800, color: pal.deep });
  }
  const lp = mergeLine(line.map(b => grow(b, 1.2, 0.45)));
  return { svg: out.join(''), plates: [...lp, ...nums, ...chips.map(b => grow(b, 1, 0.45))], lineEnd: Math.max(...line.map(b => b.x + b.w)) };
}

/** «Залп дан · 1 Порох» with the Powder coin of the cards ({coin}) between the number and the word */
const COIN_D = 3.1;
function volleyCaption(cx: number, y: number, s: string, coin: string, color: string): { svg: string; box: Rect } {
  const o: TO = { w: 800, color }, size = 8, [a, b = ''] = s.split('{coin}').map(x => x.trim());
  if (!b) { const box = textBox(cx, y, a, size, { ...o, anchor: 'middle' }); return { svg: text(cx, y, a, size, { ...o, anchor: 'middle' }), box }; }
  const wa = widthOf(a, size, o), wb = widthOf(b, size, o), gap = 0.7, total = wa + gap + COIN_D + gap + wb, x0 = cx - total / 2, ix = x0 + wa + gap, top = y - COIN_D * 0.86, k = COIN_D / 44;
  const img = coin ? `<image href="${coin}" x="${r(ix - 6 * k)}" y="${r(top - 5 * k)}" width="${r(56 * k)}" height="${r(58 * k)}" preserveAspectRatio="none"/>` : '';
  const tb = textBox(x0, y, a, size, o), y0 = Math.min(tb.y, top - 0.15), y1 = Math.max(tb.y + tb.h, top + COIN_D + 0.15);
  return { svg: text(x0, y, a, size, o) + img + text(ix + COIN_D + gap, y, b, size, o), box: { x: x0, y: y0, w: total, h: y1 - y0 } };
}

function slotsParts(g: Omit<Geo, 'kit' | 'art'>, coin: string): { svg: string; plates: Rect[] } {
  const out: string[] = [], plates: Rect[] = [], pal = g.pal;
  for (const s of g.slots) {
    if (s.kind === 'volley' || s.kind === 'volley2') {
      // an empty cell: a mark is put on it when the Volley is fired (no picture in it that could pass for a marker)
      const cap = volleyCaption(s.x + s.w / 2, s.y - 0.9, fill(TXT.volley[s.kind === 'volley' ? 0 : 1], { cost: Number(g.ship.volleyCost), coin: '{coin}' }), coin, pal.deep);
      out.push(cellRect(s, pal.cell, BRASS_DARK, 0.4), cap.svg);
      plates.push(grow(cap.box, 1, 0.4));
    } else if (s.kind === 'fire') {
      out.push(`<rect x="${r(s.x)}" y="${r(s.y)}" width="${s.w}" height="${s.h}" rx="2" fill="${FIRE.fill}" stroke="${FIRE.line}" stroke-width=".4" stroke-dasharray="1.4 1"/>` + ICON.flame(s.x + s.w / 2, s.y + s.h / 2 + 0.6, 1.3, FIRE.flame));
    } else if (s.kind === 'underwater' || s.kind === 'surfaced') {
      out.push(`<rect x="${r(s.x)}" y="${r(s.y)}" width="${s.w}" height="${s.h}" rx="2" fill="${WATER.fill}" stroke="${WATER.line}" stroke-width=".4" stroke-dasharray="1.4 1"/>`);
      out.push(ICON.waves(s.x + 14, s.y + s.h * (s.kind === 'underwater' ? 0.42 : 0.62), 24, WATER.soft));
      if (s.kind === 'surfaced') out.push(ICON.arrow(s.x + s.w / 2, s.y + s.h * 0.55, 'up', 7, WATER.soft, 0.7));
    } else {
      out.push(cellRect(s, pal.cell, BRASS_DARK, 0.4) + num(s.x + s.w / 2, s.y - 0.9, s.n ?? 0, pal.ink));
    }
  }
  // the token is moved from «Под водой» to «Всплыл»
  const u = g.slots.find(s => s.kind === 'underwater'), v = g.slots.find(s => s.kind === 'surfaced');
  if (u && v) out.push(ICON.arrow(u.x + u.w / 2, u.y + u.h + 0.3, 'down', 3.4, WATER.line, 0.5));
  return { svg: out.join(''), plates };
}

/** A: the plates under the words on the picture — one path (overlaps are filled once), fill-opacity over the JPEG */
const rrPath = (b: Rect, q = 1) => `M${r(b.x + q)} ${r(b.y)}H${r(b.x + b.w - q)}A${q} ${q} 0 0 1 ${r(b.x + b.w)} ${r(b.y + q)}V${r(b.y + b.h - q)}A${q} ${q} 0 0 1 ${r(b.x + b.w - q)} ${r(b.y + b.h)}H${r(b.x + q)}A${q} ${q} 0 0 1 ${r(b.x)} ${r(b.y + b.h - q)}V${r(b.y + q)}A${q} ${q} 0 0 1 ${r(b.x + q)} ${r(b.y)}Z`;
const platesSvg = (plates: Rect[], pal: Pal, k: number) => plates.length ? `<path d="${plates.map(b => rrPath(b)).join('')}" fill="${pal.field}" fill-opacity="${r(k)}" fill-rule="nonzero"/>` : '';
/** the plates' opacity: the least that keeps every word at its contrast over the darkest picture (black) */
function plateOpacity(pal: Pal): number {
  for (let k = 0.88; k < 1; k += 0.01) { const bg = darken(pal.field, 1 - k); if (contrast(pal.ink, bg) >= 7 && contrast(pal.soft, bg) >= 7 && contrast(pal.deep, bg) >= 4.5 && contrast(SINK.text, bg) >= 4.5) return k; }
  return 1;
}

/** the light fields of the frame: everything read during play stands on them (the right column's boxes are HTML) */
function fieldsSvg(g: Omit<Geo, 'kit' | 'art'>): string {
  const pal = g.pal, f = (b: Rect, pad = 1.2) => `<rect x="${r(b.x - pad)}" y="${r(b.y - pad)}" width="${r(b.w + 2 * pad)}" height="${r(b.h + 2 * pad)}" rx="2" fill="${pal.field}" stroke="${pal.fieldLine}" stroke-width=".3"/>`;
  const [fire, ...rest] = g.boxes, z = g.zones, m = z.mid;
  return [f(fire, 0), ...rest.filter(b => b.w < 60).map(b => f(b, 0)), f(z.header, 0.4), f({ x: z.strip.x, y: z.strip.y - 0.6, w: z.strip.w, h: z.strip.h + 1.2 }, 0.6),
    f({ x: z.footer.x + 30, y: z.footer.y - 0.2, w: z.footer.w - 60, h: z.footer.h + 0.4 }, 0.6), f({ x: m.x, y: m.y - 0.6, w: m.w, h: 5.6 }, 0.4)].join('');
}

const medallion = (cx: number, cy: number, R: number, ship: Ship, pal: Pal) =>
  `<circle cx="${r(cx)}" cy="${r(cy)}" r="${R}" fill="${pal.solid}" stroke="${BRASS}" stroke-width=".6"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R - 1.3)}" fill="none" stroke="#fff8e6" stroke-width=".25"/>` +
  text(cx, cy + pt(21) * 0.31, ship.code, 21, { font: 'Alegreya SC', w: 800, color: '#fff8e6', anchor: 'middle' });

// ---- HTML pieces ----
const at = (b: Rect) => `left:${r(b.x)}mm;top:${r(b.y)}mm;width:${r(b.w)}mm;height:${r(b.h)}mm`;
const TICK = `<svg class="bo2-tick" viewBox="0 0 13 13"><rect x=".2" y=".2" width="12.6" height="12.6" rx="2" fill="${CELL}" stroke="${BRASS_DARK}" stroke-width=".4"/></svg>`;
function headerHtml(ship: Ship, pal: Pal): string {
  return `<div class="bo2-abs bo2-title" style="left:${EDGE + 20.5}mm;top:${EDGE + 0.2}mm"><div class="bo2-name" style="color:${pal.deep}">${esc(ship.name)}</div><div class="bo2-cap">${esc(ship.captain)}</div></div>
<div class="bo2-abs bo2-title bo2-tr" style="right:${r(PAGE.w - RIGHT)}mm;top:${EDGE + 1.6}mm"><span class="bo2-side" style="background:${pal.solid}">${esc(ship.side)}</span><div class="bo2-motto">${esc(ship.motto)}</div></div>`;
}
function midHtml(g: Omit<Geo, 'kit' | 'art'>): string {
  const out: string[] = [], m = g.zones.mid, fire = g.boxes[0];
  out.push(`<div class="bo2-abs bo2-eff" style="left:${r(m.x + 6)}mm;top:${r(m.y - 0.2)}mm;width:${r(m.w - 7)}mm">${esc(TXT.effects)}</div>`);
  out.push(`<div class="bo2-abs bo2-mbox" style="${at({ x: fire.x + 1.5, y: fire.y + 0.6, w: fire.w - 3, h: 12 })};color:${FIRE.text}"><div class="bo2-st">${esc(fill(TXT.fires.title, { n: RULES.maxFires }))}</div><div class="bo2-sn">${esc(nb(TXT.fires.note))}</div></div>`);
  const side = g.boxes.filter(b => b.w < 60 && b.h === BOARD.underwaterSlot.h);
  [TXT.underwater, TXT.surfaced].forEach((t, i) => { const b = side[i]; if (b) out.push(`<div class="bo2-abs bo2-mbox" style="${at({ x: b.x + 1.8, y: b.y + 0.6, w: b.w - 2.4, h: b.h - 1 })};color:${WATER.text}"><div class="bo2-st">${esc(t.title)}</div><div class="bo2-sn">${esc(nb(t.note))}</div></div>`); });
  return out.join('');
}
function columnHtml(ctx: Ctx, g: Omit<Geo, 'kit' | 'art'>, engraving: string | undefined): string {
  const ship = g.ship, pal = g.pal, c = g.zones.col, legend = data.legends[ship.code], price = priceOf(legend);
  const ab = ship.abilities.map(a => { const once = /раз в ход/i.test(a.text); return `<div class="bo2-an${once ? ' bo2-once' : ''}"><span>${esc(a.name)}</span>${once ? `<i>${esc(TXT.once)}</i>${TICK}` : ''}</div><div class="bo2-p">${richNb(a.text)}</div>`; }).join('');
  const heart = TXT.heart[ship.code] ? `<div class="bo2-p bo2-heart">${richNb(TXT.heart[ship.code])}</div>` : '';
  const plans = ship.code === 'Ж' ? `<div class="bo2-box bo2-ptr"><span>${esc(fill(TXT.plans, { n: RULES.plansMax }))}</span><svg viewBox="0 0 10 4">${ICON.arrow(0.5, 2, 'right', 9, pal.deep, 0.5)}</svg></div>` : '';
  const icons = [price.powder ? `coin-${price.powder}` : '', price.soul ? `flask-${price.soul}` : ''].filter(Boolean), d = 7.4;
  const iconHtml = icons.map((n, i) => iconImg(ctx, n, c.w - 3 - d - i * (d + 1.2) - 9, 1.8, d)).join('');
  const leg = `<div class="bo2-box bo2-legend">${iconHtml}<div class="bo2-lh" style="padding-right:${r(icons.length * (d + 1.2) + 10)}mm"><div class="bo2-h">${esc(TXT.legend.title)} · ${esc(legend.name)}</div><div class="bo2-p">${esc(legend.big)}</div></div><div class="bo2-note">${esc(TXT.legend.note)}</div><svg class="bo2-legarrow" viewBox="0 0 10 4">${ICON.arrow(0.5, 2, 'right', 9, darken(BRASS, 0.35), 0.5)}</svg></div>`;
  const powder = `<div class="bo2-box bo2-powder">${iconImg(ctx, 'coin', 2.6, 1.2, 5.2)}<span>${esc(TXT.powder)}</span></div>`;
  const pic = engraving != null && !g.zones.engraving ? `<div class="bo2-pic"><svg viewBox="0 0 ${ENGRAVING.w} ${ENGRAVING.h}" preserveAspectRatio="xMidYMid meet">${engraving}</svg></div>` : '';
  return `<div class="bo2-col bo2-txt" style="${at(c)};--c:${pal.deep};--f:${pal.field};--fl:${pal.fieldLine};--ink:${pal.ink};--soft:${pal.soft}">
<div class="bo2-box bo2-ab"><div class="bo2-h">${esc(TXT.abilities)}</div>${ab}${heart}</div>${plans}${leg}${powder}${pic}</div>`;
}
function stripHtml(g: Omit<Geo, 'kit' | 'art'>): string {
  const st = g.zones.strip, cards = g.slots.filter(s => s.kind === 'cards'), re = g.slots.filter(s => s.kind === 'reactions'), c0 = cards[0], c6 = cards[cards.length - 1];
  return `<div class="bo2-abs bo2-strip" style="left:${r(st.x + 0.6)}mm;top:${r(st.y)}mm;width:${r(c0.x - st.x - 2)}mm"><b>${esc(TXT.cards.title)}</b> ${esc(nb(TXT.cards.start))}</div>
<div class="bo2-abs bo2-strip" style="left:${r(c6.x + c6.w + 2)}mm;top:${r(st.y + 3.4)}mm;width:${r(re[0].x - 42 - c6.x - c6.w - 4)}mm">${esc(nb(TXT.cards.down))}</div>
<div class="bo2-abs bo2-strip" style="left:${r(re[0].x - 40)}mm;top:${r(st.y)}mm;width:38.5mm"><b>${esc(TXT.reactions.title)}</b> ${esc(nb(TXT.reactions.note))}</div>`;
}
function footerHtml(ship: Ship): string {
  const diag = (ship.diagDamage as { offset: number } | undefined)?.offset ?? 0;
  const parts = TXT.footer.map(s => esc(fill(s, { cost: Number(ship.volleyCost), diag: `${diag < 0 ? '−' : '+'}${Math.abs(diag)}`, joint: RULES.jointBonus })));
  return `<div class="bo2-abs bo2-foot" style="left:${EDGE}mm;top:${Z.footer.y}mm;width:${Z.footer.w}mm"><svg viewBox="-2 -2 4 4">${ICON.ball(0, 0, 1.7, BRASS_DARK)}</svg>${parts.map(p => `<span>${p}</span>`).join('<i>·</i>')}</div>`;
}

/** the frame's contrast rules (≥ 7 : 1 body text, ≥ 4.5 : 1 headings) against the worst background behind the words:
 *  the field the material chose, and in A the plate over the darkest picture (black) */
function checkPal(pal: Pal, who: string, plate?: number) {
  const bad: string[] = [], bgs = [pal.field, ...(plate != null ? [darken(pal.field, 1 - plate)] : [])];
  for (const bg of bgs) {
    if (contrast(pal.ink, bg) < 7) bad.push(`ink ${contrast(pal.ink, bg).toFixed(1)} on ${bg}`);
    if (contrast(pal.soft, bg) < 7) bad.push(`soft ${contrast(pal.soft, bg).toFixed(1)} on ${bg}`);
    if (contrast(pal.deep, bg) < 4.5) bad.push(`deep ${contrast(pal.deep, bg).toFixed(1)} on ${bg}`);
  }
  if (bad.length) console.warn(`warning: board ${who}: text contrast below the rule: ${bad.join(', ')}`);
}

let UID = 0;
const artOf = (ctx: Ctx) => async (key: string, svg: string, bleed = 0) => (await makeArt(ctx, key, svg, null, bleed)).url;

/** One face of a board in concept a or b. */
export async function framePage(ctx: Ctx, ship: Ship, concept: Concept, mat: ShipMaterial): Promise<{ html: string; css: string }> {
  const key = DECK_KEY[ship.code], base = basePalette(ship.color), pal = mat.palette ? mat.palette(base) : base, plateK = plateOpacity(pal);
  checkPal(pal, `${key} ${concept}`, concept === 'a' ? plateK : undefined);
  const g: Geo = { ...layout(ship, concept, pal, `b${concept}${++UID}`), kit: KIT, art: artOf(ctx) };
  // the words of the rows: a dry run collects the strings, the browser measures them, then the real run
  let coin = '';
  try { coin = ctx.icon('coin'); } catch { /* icons not rasterised (a scheme): the caption without the coin */ }
  g.rows.forEach(rw => rowParts(rw, pal)); slotsParts(g, coin);
  await measureMissing(ctx);
  const rows = g.rows.map(rw => rowParts(rw, pal)), slots = slotsParts(g, coin);
  rows.forEach((o, i) => { g.rows[i].lineEnd = o.lineEnd; });
  if (concept === 'a') g.plates = [...rows.flatMap(o => o.plates), ...slots.plates];
  const L = await (concept === 'a' ? mat.a(g) : mat.b(g));
  const svg = [L.under ?? '', platesSvg(g.plates, pal, plateK), fieldsSvg(g), medallion(EDGE + 9.4, EDGE + 9, 8.4, ship, pal), ...rows.map(o => o.svg), slots.svg];
  // the pointers to the sheet's edge: effects — up across the header, the Legend — to the right
  const m = g.zones.mid;
  svg.push(ICON.arrow(m.x + 2.8, m.y + 4.6, 'up', 4.6, pal.deep, 0.5));
  const E = g.zones.engraving;
  if (E && L.engraving) svg.push(`<svg x="${r(E.x)}" y="${r(E.y)}" width="${r(E.w)}" height="${r(E.h)}" viewBox="0 0 ${ENGRAVING.w} ${ENGRAVING.h}" preserveAspectRatio="xMidYMid meet">${L.engraving}</svg>`);
  svg.push(L.over ?? '');
  const html = [headerHtml(ship, pal), midHtml(g), columnHtml(ctx, g, concept === 'b' ? L.engraving ?? '' : undefined), stripHtml(g), footerHtml(ship)];
  return { html: `<div class="bo2 bo2-${key}"><svg class="bo2-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${svg.join('\n')}</svg>\n${html.join('\n')}</div>`, css: L.css ?? '' };
}

// ---- the back «Затонул» ----
/** a section of rules.md by its heading, as paragraphs and bullets (word for word) */
export function rulesSection(title: string): { p: string[]; li: string[] } {
  const md0 = fs.readFileSync(path.join(HERE, 'text/rules.md'), 'utf8').split('\n'), i = md0.findIndex(l => l.trim() === `## ${title}`);
  if (i < 0) throw new Error(`rules.md: no section «${title}»`);
  const p: string[] = [], li: string[] = [];
  for (const l of md0.slice(i + 1)) { if (/^## /.test(l)) break; if (l.startsWith('- ')) li.push(l.slice(2)); else if (l.trim() && !l.startsWith(':::')) p.push(l.trim()); }
  return { p, li };
}
/** a line of the «::: add Уточнения» block that starts with the given words */
export function rulesLine(prefix: string): string {
  const l = fs.readFileSync(path.join(HERE, 'text/rules.md'), 'utf8').split('\n').find(x => x.startsWith('- ' + prefix));
  if (!l) throw new Error(`rules.md: no line «${prefix}…»`);
  return l.slice(2);
}
const W = { m: 12, text: 104, side: 72 };
/** the reference marks of rules.md («(Q6)») are for the rule book only: the board keeps the words */
const noRef = (s: string) => s.replace(/\s*\((?:Q\d+(?:,\s*)?)+\)/g, '');
/** «Сердце Дейви Джонса»: the data's own sentence about the sunk Endeavour */
const jonesLine = (ship: Ship) => ship.abilities.map(a => a.text.match(/Если «Индевор» утонул[^<]*?до старта\./)?.[0]).find(Boolean);
export function wreckLayout(ship: Ship, pal: Pal, uid: string): Omit<WreckGeo, 'kit' | 'art'> {
  // the text in 13 pt over the upper two thirds of the sheet; the wreck shows under it and round it (margins ≥ 10 mm)
  const title = { x: W.m + 4, y: W.m + 4, w: 150, h: 19 }, text = { x: W.m + 4, y: 41, w: 162, h: W.text }, side = { x: 186, y: 41, w: PAGE.w - W.m - 4 - 186, h: jonesLine(ship) ? W.text : W.side };
  const slots = [0, 1].map(i => ({ x: side.x + 1, y: side.y + 13 + i * 19, w: BOARD.cell, h: BOARD.cell }));
  return { ship, key: DECK_KEY[ship.code], kind: DECK_KEY[ship.code], scope: `.bo2-${DECK_KEY[ship.code]}`, pal, uid, page: PAGE, zones: { title, text, side, art: { x: W.m, y: W.m, w: PAGE.w - 2 * W.m, h: PAGE.h - 2 * W.m } }, slots, boxes: [title, text, side] };
}
export async function wreckPage(ctx: Ctx, ship: Ship, mat: ShipMaterial): Promise<{ html: string; css: string }> {
  const base = basePalette(ship.color), pal = mat.palette ? mat.palette(base) : base;
  const w: WreckGeo = { ...wreckLayout(ship, pal, `bw${++UID}`), kit: KIT, art: artOf(ctx) };
  const L = await mat.wreck(w), sec = rulesSection(TXT.wreck.section), z = w.zones;
  const svg = [L.under ?? '', ...w.boxes.map(b => `<rect x="${r(b.x - 2)}" y="${r(b.y - 2)}" width="${r(b.w + 4)}" height="${r(b.h + 4)}" rx="2.4" fill="${pal.field}" stroke="${pal.fieldLine}" stroke-width=".3"/>`),
    ...w.slots.map(s => cellRect(s, pal.cell, BRASS_DARK, 0.45)), medallion(z.title.x + 9, z.title.y + 10, 8.4, ship, pal), L.over ?? ''];
  // what to clear — per ship (rules.md
  // «::: add Уточнения»: «Корабль утонул: его Планы уходят в руку капитана (Q37), Пожары и жетон «Под водой» с него
  // снимают» — Plans only the Pearl has, «Под водой» only the Dutchman)
  const jones = jonesLine(ship);
  const side = [`<div class="bo2-al" style="top:${r(w.slots[0].y - z.side.y)}mm">${esc(TXT.wreck.ally[0])}</div>`, `<div class="bo2-al" style="top:${r(w.slots[1].y - z.side.y)}mm">${esc(TXT.wreck.ally[1])}</div>`].join('');
  const html = `<div class="bo2-abs bo2-wt" style="left:${r(z.title.x + 21)}mm;top:${r(z.title.y + 1)}mm"><div class="bo2-wn" style="color:${pal.deep}">${esc(TXT.wreck.title)}</div><div class="bo2-cap">${esc(ship.name)} · ${esc(ship.captain)}</div></div>
<div class="bo2-abs bo2-wtext bo2-txt" style="${at(z.text)}"><div class="bo2-h" style="color:${pal.deep}">${esc(TXT.wreck.section)}</div>${sec.p.map(p => `<p>${md(noRef(p))}</p>`).join('')}<ul>${sec.li.map(l => `<li>${md(noRef(l))}</li>`).join('')}</ul><p class="bo2-wq">${md(noRef(rulesLine(TXT.wreck.captainLine)))}</p></div>
<div class="bo2-abs bo2-wside bo2-txt" style="${at(z.side)}"><div class="bo2-h" style="color:${pal.deep}">${esc(TXT.wreck.free)}</div>${side}<div class="bo2-wl" style="top:${r(w.slots[1].y + 21 - z.side.y)}mm"><p>${esc(TXT.wreck.clear[ship.code] ?? TXT.wreck.clear._)}</p>${jones ? `<p><b>${esc(TXT.wreck.jones)}</b> ${esc(noRef(jones))}</p>` : ''}</div></div>`;
  return { html: `<div class="bo2 bo2-${w.key}"><svg class="bo2-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${svg.join('\n')}</svg>\n${html}</div>`, css: L.css ?? '' };
}

export const FRAME_CSS = `
.bo2{position:absolute;inset:0}
.bo2-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.bo2-abs{position:absolute}
.bo2-name{font:800 27pt/1 Alegreya,serif;white-space:nowrap}
.bo2-cap{font:italic 500 12.5pt/1.15 Alegreya,serif;margin-top:.9mm;white-space:nowrap;color:${INK}}
.bo2-tr{text-align:right}
.bo2-side{display:inline-block;font:800 9pt/1 'Alegreya Sans',sans-serif;letter-spacing:.16em;color:#fff8e6;border-radius:1.1mm;padding:1.35mm 2.4mm 1.2mm 2.8mm}
.bo2-motto{font:italic 400 11pt/1.2 Alegreya,serif;color:${SOFT};margin-top:2.2mm;white-space:nowrap}
.bo2-txt{font:500 9.5pt/1.2 'Alegreya Sans',sans-serif;color:var(--ink,${INK})}
.bo2-nb{white-space:nowrap}
.bo2-eff{font:800 9pt/1.2 'Alegreya Sans',sans-serif;color:${INK};white-space:nowrap}
.bo2-mbox{box-sizing:border-box;overflow:hidden}
.bo2-st{font:800 10pt/1.1 'Alegreya SC',serif;letter-spacing:.04em}
.bo2-sn{font:500 9pt/1.15 'Alegreya Sans',sans-serif;color:${SOFT};margin-top:.8mm}
.bo2-col{position:absolute;display:flex;flex-direction:column;gap:2mm;overflow:hidden}
.bo2-box{position:relative;flex:none;box-sizing:border-box;border:.3mm solid var(--fl);border-radius:1.6mm;padding:2mm 2.8mm 2.2mm;background:var(--f)}
.bo2-h{font:800 10.5pt/1.1 'Alegreya SC',serif;letter-spacing:.05em;color:var(--c)}
.bo2-an{display:flex;align-items:center;gap:1.6mm;font:800 9.5pt/1.2 'Alegreya Sans',sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--c);margin-top:1.5mm}
.bo2-an span{flex:1}
.bo2-an i{font:italic 500 9pt/1 Alegreya,serif;text-transform:none;letter-spacing:0;color:var(--soft)}
.bo2-tick{width:13mm;height:13mm;flex:none}
.bo2-once{margin-top:.6mm;margin-bottom:-.6mm}
.bo2-heart{margin-top:1.4mm;padding-top:1.2mm;border-top:.25mm solid var(--fl)}
.bo2-ptr{display:flex;align-items:center;gap:2mm;font:800 9.5pt/1.2 'Alegreya Sans',sans-serif;color:var(--c);padding:1.6mm 2.8mm}
.bo2-ptr span{flex:1}
.bo2-ptr svg,.bo2-legarrow{width:10mm;height:4mm;flex:none}
.bo2-legend{background:#fcf1d2;border-color:${BRASS}}
.bo2-legend .bo2-h{color:${darken(BRASS, 0.42)}}
.bo2-lh{min-height:8mm;box-sizing:border-box}
.bo2-note{font:italic 500 9pt/1.2 Alegreya,serif;color:${SOFT};margin-top:.8mm;padding-right:11mm}
.bo2-legarrow{position:absolute;right:2.4mm;bottom:2.4mm}
.bo2-powder{display:flex;align-items:center;font:700 9.5pt/1.2 'Alegreya Sans',sans-serif;padding:1.6mm 2.8mm 1.6mm 9.6mm}
.bo2-pic{position:relative;flex:1 1 0;min-height:0}
.bo2-pic svg{position:absolute;left:0;top:0;width:100%;height:100%}
.bo2-strip{font:500 8pt/1.12 'Alegreya Sans',sans-serif;color:${INK}}
.bo2-strip b{font:800 9.5pt/1.1 'Alegreya SC',serif;letter-spacing:.04em;display:block;margin-bottom:.4mm}
.bo2-foot{display:flex;justify-content:center;align-items:center;gap:2.2mm;font:500 9pt/1.2 'Alegreya Sans',sans-serif;color:${SOFT};white-space:nowrap}
.bo2-foot svg{width:3mm;height:3mm;flex:none;margin-right:-.6mm}
.bo2-foot i{font-style:normal;font-weight:800;color:${BRASS}}
.bo2-wn{font:800 30pt/1 'Alegreya SC',serif;letter-spacing:.06em}
.bo2-wtext{font-size:13pt;line-height:1.3;display:flex;flex-direction:column;justify-content:space-between}
.bo2-wtext .bo2-h,.bo2-wside .bo2-h{font-size:13.5pt}
.bo2-wtext p{margin:0}
.bo2-wtext ul{margin:0;padding-left:5.4mm}
.bo2-wtext li{margin-top:2.2mm}
.bo2-wq{font-size:11.5pt;color:${SOFT}}
.bo2-wside .bo2-al{position:absolute;left:18.5mm;right:0;font:800 12.5pt/1.15 'Alegreya Sans',sans-serif;color:${INK};padding-top:3.6mm}
.bo2-wl{position:absolute;left:0;right:0;font-size:12.5pt;line-height:1.3}
.bo2-wl p{margin:0 0 2.6mm}
`;
