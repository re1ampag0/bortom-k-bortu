// 03 — the ship boards, concept B v2 «стол капитана» (boards v2 task): the whole sheet is one engraved sea chart of the
// Caribbean (tools/print/map/chart.ts) with the ship drawn on it; what is read during play lies on plates over the chart:
// paper slips for the tracks, brass rulers for the counters, a pinned log-book page for the abilities, a nest for the Legend
// card (63 × 88 + 1.5 mm round it). The chart is calmed only under the plates; the cells, numbers and words are vector.
// counters 'board' — «Осталось карт» and «Реакций сыграно» on brass rulers on the board; 'strip' — on a strip per player
// (counterStripsPage, sheet 04) and the room goes to the chart and the ship.
// Every plate is marked data-plate, every word data-in="<its plate>": tools/print/check-layout.ts checks that each word lies
// inside its plate with 1.5 mm to spare and touches no other word and no other plate (cells, icons, slots).
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { HERE, ROOT, data, esc, fontCss, rich, RICH_CSS, type Ctx, type PageSpec } from '../../kit';
import { BOARD, trackCells, type Ship } from '../../layout';
import { DECK_KEY } from '../../colors';
import { CHART_NOTES, chartPoint, chartSvg, landGrid, landIn, type ChartOpts, type ChartReport, type ChartStyle, type Rect } from '../../map/chart';
import { rasterJpeg } from '../../map/raster';
import { centerFor } from '../../map/proj';
import { icon, iconSvg, TONE, type IconName, type IconTone } from '../icons';
import { CREAM, brassCell, capWord, deepOf } from '../tokens-art';
import { basePalette, measureMissing, widthOf, type Pal, type ShipKey, type TO, type TrackKey } from './frame';

export type Counters = 'board' | 'strip';
const require = createRequire(import.meta.url);
const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship(u: string, L: unknown, o: Record<string, unknown>): string; makeLight(l: unknown, cam: { horizon: number }): unknown;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number }; LIGHTS: Record<string, unknown>;
};

// ---- texts (boards.json → frame) ----
interface FrameText {
  tracks: Record<TrackKey, { name: string; note: string; zero?: string; flip?: string; start?: string; max?: string; kraken?: string; spend?: string }>;
  start: string; volley: string[]; volleyCost: string; effects: string; fires: { title: string; note: string }; underwater: { title: string; note: string }; surfaced: { title: string; note: string };
  abilities: string; once: string; heart: Record<string, string>; plans: string; legend: { title: string; note: string; played: string };
  cards: { title: string }; reactions: { title: string };
}
const TXT = (JSON.parse(fs.readFileSync(path.join(HERE, 'text/boards.json'), 'utf8')) as { frame: FrameText }).frame;
const RULES = data.rules as Record<string, number>;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
const nb = (s: string) => s.replace(/(\d) (?=[«А-Яа-яЁё])/g, '$1 ').replace(/([А-Яа-яЁё]) (?=\d+[).,;:])/g, '$1 ');
const richNb = (s: string) => rich(nb(s));

// ---- geometry, mm ----
const PAGE = { w: 297, h: 210 };
const r = (n: number) => Math.round(n * 100) / 100;
const pt = (n: number) => n * 25.4 / 72;
const C = BOARD.cell;
const ORDER: TrackKey[] = ['sails', 'souls', 'crew', 'guns', 'hull'];
/** one row from the top of its slip: label baseline, number baseline, cell top, caption baseline, height (the words' boxes
 *  — ascent to descent — keep 1.5 mm from the slip's edge and clear of each other) */
const ROW = { label: 6.3, num: 11.6, cell: 12.6, cap: 28.7, h: 31.25 };
/** the name of a track (13 pt small capitals) */
const LABEL_PT = 13;
/** the plates keep GAP of the chart between them (check-layout: PLATE_GAP) and EDGE from the sheet's edge (EDGE_GAP) */
const GAP = 3, EDGE = 5;
/** the header's top (its rolls stand 0.5 mm over it), the first row under the header (its rolls + GAP) */
const HEAD_Y = EDGE + 0.5, TOP = HEAD_Y + 26.4 + 0.5 + GAP;
const X0 = 13.5, PAD = 2.6, ROW_GAP = GAP, BOTTOM = 210 - EDGE, MID_R = 211.5 - GAP;
const NEST = { x: 217.5, y: HEAD_Y, w: 66, h: 91 };
/** the header (a cartouche of an old chart): its height, the medallion's centre from the left, the text column's start */
const HEAD = { y: 11.1, h: 26.4, med: 12.4, col: 27 };
/** the log under the Legend's nest (the Dutchman's — in the middle, see layoutV2: its right column holds the dive nest) */
const LOG = { x: 211.5, y: NEST.y + NEST.h + GAP, w: 75.5, h: BOTTOM - (NEST.y + NEST.h + GAP) };
const LOG_DUTCH = { x: MID_R - 75.5, y: HEAD_Y + 11 + GAP, w: 75.5, h: 95.5 };
const logBox = (ship: Ship) => ship.souls != null ? LOG_DUTCH : LOG;
/** the log's ruled lines: line height, the body size, the pad over the first line (baseline = top + LH/2 + 0.33 em) */
const LOGT = { lh: 4.1, size: 9.3, top: 3.4, side: 7.2 };
/** the log's type, measured in the browser: the largest size (9.3 pt down to 7.6 pt, line height 1.25 em) at which the
 *  ship's words fit the page; the page as tall as its words (at least 50 mm), the chart shows under the rest */
const LOGFIT = new Map<string, { size: number; lh: number; h: number }>();
async function fitLog(ctx: Ctx, ship: Ship, inner: (lt: { size: number; lh: number }) => string): Promise<void> {
  if (LOGFIT.has(ship.code)) return;
  const LB = logBox(ship), page = await ctx.browser.newPage(), width = LB.w - 2 * LOGT.side, room = LB.h - LOGT.top - 4;
  try {
    for (let size = 9.3; size >= 7.6; size = Math.round((size - 0.1) * 10) / 10) {
      const lh = Math.round(pt(size) * 1.25 * 100) / 100, lt = { size, lh };
      await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}${RICH_CSS}${V2_CSS}</style><div class="v2-log" style="position:absolute;left:0;top:0;width:${width}mm;--lh:${lh}mm;--fs:${size}pt;--lift-h:0mm;--lift-n:0mm">${inner(lt)}</div>`);
      await page.evaluate(async () => { await document.fonts.ready; });
      const hpx = await page.evaluate(() => (document.querySelector('.v2-log') as HTMLElement).scrollHeight), hmm = hpx * 25.4 / 96;
      if (hmm <= room - 3 || size <= 7.6) { LOGFIT.set(ship.code, { size, lh, h: Math.min(LB.h, Math.max(50, LOGT.top + hmm + 4 + lh)) }); return; }
    }
  } finally { await page.close(); }
}
const logType = (ship: Ship) => LOGFIT.get(ship.code) ?? { size: LOGT.size, lh: LOGT.lh, h: logBox(ship).h };
/** the story icons: one by each ability in the log, one under each Legend card (seen once it is played) */
const ABILITY_ICON: Record<string, IconName> = {
  'Безумный план': 'madPlan', 'Быстрее ветра': 'swiftWind', 'Греческий огонь': 'greekFire', 'Меч Тритона': 'tritonSword',
  'Казна Компании': 'treasury', 'Сердце Дейви Джонса': 'heartChest', 'Вечная служба': 'soulService', 'Погружение': 'dive'
};
const LEGEND_ICON: Record<string, IconName> = { 'Джек ускользает': 'legendJack', 'Корабль в бутылке': 'legendBottle', 'Армада Компании': 'legendArmada', 'Кракен': 'legendKraken' };
const ICON_TRACK: Record<TrackKey, IconName> = { sails: 'sails', souls: 'souls', crew: 'crew', guns: 'guns', hull: 'hull' };

// ---- the look of each ship: which part of the chart, how it is kept, the plates and the inks ----
type ShipPlace = { anchor: { lon: number; lat: number; x: number; y: number }; ship: [number, number, number, number]; rose: [number, number, number]; labels?: Record<string, { x: number; y: number }>; note?: [number, number] };
interface Look {
  chart: ChartStyle; mmPerDeg: number; tone: IconTone; board: ShipPlace; strip: ShipPlace;
  paper: string; paperLine: string; ink: string; soft: string; cell: string; cellDeep: string;
  brass: [string, string, string]; note: string; noteLine: string; margin: string; pin: string;
  notes?: (at: (lon: number, lat: number) => { x: number; y: number }, p: ShipPlace) => Partial<ChartOpts>;
}
const LOOKS: Record<ShipKey, Look> = {
  pearl: {
    chart: 'pearl', mmPerDeg: 42, tone: TONE.sepia,
    board: { anchor: { lon: -72.78, lat: 20.12, x: 186, y: 60 }, ship: [133, 72, 60, 36], rose: [113, 104, 8], labels: { 'Isla Española': { x: 176, y: 97 } }, note: [111, 89] },
    strip: { anchor: { lon: -72.78, lat: 20.12, x: 186, y: 58 }, ship: [133, 74, 66, 40], rose: [116, 150, 12], labels: { 'Isla Española': { x: 176, y: 110 }, Tortuga: { x: 186, y: 47 } }, note: [111, 92] },
    paper: '#f1e4c2', paperLine: '#5a4024', ink: '#2a1c0c', soft: '#4f3d28', cell: '#f7eed6', cellDeep: '#e3d1a6',
    brass: ['#f3d68c', '#c4954a', '#5e4214'], note: '#f4ead0', noteLine: '#b9a47a', margin: '#b0503a', pin: '#7a1c14',
    notes: (at, p) => { const t = at(-72.78, 20.12); return { cross: { x: t.x + 2, y: t.y + 1 }, note: p.note ? [{ x: p.note[0], y: p.note[1], text: CHART_NOTES.pearl[0], rot: -6, size: 4 }] : [] }; }
  },
  revenge: {
    chart: 'revenge', mmPerDeg: 36, tone: TONE.red,
    board: { anchor: { lon: -77.35, lat: 25.04, x: 172, y: 84 }, ship: [132, 70, 58, 32], rose: [113, 104, 8], labels: { 'Islas Lucayas': { x: 176, y: 106 } }, note: [106, 90] },
    strip: { anchor: { lon: -77.35, lat: 25.04, x: 172, y: 96 }, ship: [140, 72, 70, 40], rose: [118, 150, 11], labels: { 'Islas Lucayas': { x: 186, y: 128 } }, note: [104, 118] },
    paper: '#f2e2c0', paperLine: '#5a2416', ink: '#2e1a10', soft: '#4f3326', cell: '#f8ecd2', cellDeep: '#e6cca0',
    brass: ['#f3d68c', '#c4954a', '#5e4214'], note: '#f5e8cc', noteLine: '#c4a07a', margin: '#9a1f14', pin: '#1a1a1a',
    notes: (at, p) => { const t = at(-77.34, 25.06); return { cross: { x: t.x + 1, y: t.y + 1 }, course: [{ x: p.ship[0] + 30, y: p.ship[1] + 4 }, { x: (p.ship[0] + t.x) / 2 + 10, y: t.y + 14 }, { x: t.x - 6, y: t.y + 5 }], note: p.note ? [{ x: p.note[0], y: p.note[1], text: CHART_NOTES.revenge[0], rot: -4, size: 4 }] : [] }; }
  },
  endeavour: {
    chart: 'endeavour', mmPerDeg: 40, tone: TONE.navy,
    board: { anchor: { lon: -76.84, lat: 17.94, x: 176, y: 96 }, ship: [140, 66, 64, 36], rose: [198, 46, 9], labels: { 'Iamaica': { x: 170, y: 82 } } },
    strip: { anchor: { lon: -76.84, lat: 17.94, x: 176, y: 120 }, ship: [148, 80, 76, 44], rose: [120, 154, 12] },
    paper: '#f8f1de', paperLine: '#1f2a3a', ink: '#1a2232', soft: '#33405a', cell: '#fbf6e8', cellDeep: '#e6dcc0',
    brass: ['#f6dc94', '#c99a46', '#5e4214'], note: '#fbf6e6', noteLine: '#a8b8cc', margin: '#a03a2a', pin: '#a8812e'
  },
  dutch: {
    chart: 'dutch', mmPerDeg: 36, tone: TONE.verdigris,
    board: { anchor: { lon: -68.0, lat: 18.4, x: 190, y: 100 }, ship: [0, 0, 0, 0], rose: [200, 50, 8] },
    strip: { anchor: { lon: -68.0, lat: 18.4, x: 186, y: 64 }, ship: [152, 154, 70, 34], rose: [200, 128, 7] },
    paper: '#e9e4c8', paperLine: '#22322a', ink: '#1c2620', soft: '#33443a', cell: '#f0ecd6', cellDeep: '#d4d0b0',
    brass: ['#d8cf98', '#8f8a52', '#3a3a22'], note: '#ecebd4', noteLine: '#9aa890', margin: '#4a6a58', pin: '#2a3a32'
  }
};

// ---- measured words ----
const W = (s: string, size: number, o: TO = {}) => widthOf(s, size, o);
const LABEL: TO = { font: 'Alegreya SC', w: 800, ls: '.03em' }, NOTE_O: TO = { font: 'Alegreya', italic: true, w: 500 }, NUM: TO = { w: 800 }, CAP_O: TO = { font: 'Alegreya', italic: true, w: 500 };
const PTR: TO = { w: 800 };
const SINK_O: TO = { font: 'Alegreya', italic: true, w: 500, ls: '.02em' }; // italic 500: the heaviest embedded italic (800 would be synthesised → Type 3)

// ---- the layout ----
interface Cell { n: number; x: number; y: number; start: boolean }
interface Row { key: TrackKey; x: number; y: number; w: number; cells: Cell[]; start: number; volley: { x: number; y: number }[] }
interface Plan {
  rows: Row[]; header: Rect; effects: Rect; plans: Rect | null; fires: Rect; dutch: Rect | null; cards: Rect | null; reactions: Rect | null; log: Rect;
  /** the free part of the middle where the chart shows and the ship sails (null: no room) */
  window: Rect | null;
}
const volleyCap = (ship: Ship, i: number) => fill(TXT.volley[i], { cost: Number(ship.volleyCost) }).replace(/\s+/g, ' ').trim();
const volleyCost = (ship: Ship) => fill(TXT.volleyCost, { cost: Number(ship.volleyCost) });
function trackDefs(ship: Ship) {
  const t: Partial<Record<TrackKey, { key: TrackKey; cells: number[]; start: number }>> = {
    hull: { key: 'hull', cells: trackCells(ship.hull), start: ship.hull },
    sails: { key: 'sails', cells: trackCells(ship.sails), start: ship.sails },
    guns: { key: 'guns', cells: trackCells(ship.guns), start: ship.guns },
    crew: { key: 'crew', cells: trackCells(ship.crew).filter(n => n >= 1), start: ship.crew }
  };
  if (ship.souls != null) t.souls = { key: 'souls', cells: trackCells(ship.souls), start: ship.start_souls ?? 0 };
  return ORDER.map(k => t[k]).filter((x): x is { key: TrackKey; cells: number[]; start: number } => !!x);
}
/** the header's width from its words: the medallion, the name and the side tag, the captain, the motto */
const NAME_O: TO = { font: 'Alegreya', w: 800, ls: '.01em' }, CAPT_O: TO = { font: 'Alegreya SC', w: 700, ls: '.1em' }, MOTTO_O: TO = { font: 'Alegreya', italic: true, w: 500 }, SIDE_O: TO = { w: 800, ls: '.16em' };
function headerW(ship: Ship): number {
  return HEAD.col + Math.max(W(ship.name, 24, NAME_O), W(ship.captain, 10, CAPT_O), W(ship.motto, 8.5, MOTTO_O)) + 4.5;
}
const ptrW = (s: string) => 13.2 + W(s, 8.5, PTR) + PAD;
/** the Fires plate: the title's baseline, the slots' top, the height */
const FIRE = { title: 5.2, slot: 6.8, h: 6.8 + BOARD.fireSlot + 1.3 };
/** the Dutchman's dive plate (one nest for the two-sided token «Под водой» / «Всплыл»), in the right column under the nest */
const DIVE_H = 60;
function layoutV2(ship: Ship, counters: Counters): Plan {
  const dutchShip = ship.souls != null, pitch = dutchShip ? 13.6 : 14, defs = trackDefs(ship);
  const short = defs.filter(d => d.key !== 'hull' && d.key !== 'souls'), hull = defs.find(d => d.key === 'hull')!, souls = defs.find(d => d.key === 'souls');
  const mk = (d: { key: TrackKey; cells: number[]; start: number }, y: number, x0 = X0): Row => {
    const cells = d.cells.map((n, i) => ({ n, x: x0 + PAD + i * pitch, y: y + ROW.cell, start: n === d.start }));
    const volley: { x: number; y: number }[] = [];
    let x1 = cells[cells.length - 1].x + C;
    if (d.key === 'guns') for (let i = 0; i < (dutchShip ? 2 : 1); i++) {
      const vx = x1 + (i ? 9 : 6); volley.push({ x: vx, y: y + ROW.cell });
      // the caption over a Volley cell may stand wider than the cell: the slip takes it in
      x1 = Math.max(vx + C, vx + C / 2 + W(volleyCap(ship, i), 8.5, NUM) / 2, i ? 0 : vx + C / 2 + W(volleyCost(ship), 8, CAP_O) / 2);
    }
    const T = TXT.tracks[d.key], label = PAD + 9.6 + W(T.name, LABEL_PT, LABEL) + (T.note ? 2.4 + W(T.note, 9, NOTE_O) : 0);
    let cap = 0;
    if (d.key === 'souls') cap = PAD + (T.kraken ? W(fill(T.kraken, { n: 3 }), 8, NUM) : 0) + 4 + (T.max ? W(fill(T.max, { n: d.cells[d.cells.length - 1] }), 8, CAP_O) : 0) + PAD;
    return { key: d.key, x: x0, y, w: Math.max(x1 - x0 + PAD, label + PAD, cap), cells, start: d.start, volley };
  };
  const rows: Row[] = [];
  short.forEach((d, i) => rows.push(mk(d, TOP + i * (ROW.h + ROW_GAP))));
  const hullRow = mk(hull, BOTTOM - ROW.h); rows.push(hullRow);
  // the Dutchman's Souls: at the very bottom, right of the Hull (drawn as flasks — not to be taken for the other tracks)
  if (souls) rows.push(mk(souls, BOTTOM - ROW.h, hullRow.x + hullRow.w + 2 * GAP));
  const fires = { x: X0, y: 0, w: 3 * BOARD.fireSlot + 2 * 3 + 2 * PAD, h: FIRE.h };
  const shortEnd = TOP + short.length * (ROW.h + ROW_GAP), firesLeft = shortEnd + fires.h <= hullRow.y - GAP;
  if (firesLeft) fires.y = shortEnd;
  const leftR = Math.max(...rows.filter(rw => rw.key !== 'hull' && rw.key !== 'souls').map(rw => rw.x + rw.w), firesLeft ? fires.x + fires.w : 0);
  const header: Rect = { x: 12, y: HEAD_Y, w: headerW(ship), h: HEAD.h };
  // «Эффекты на корабле» and «Планы» — two pointer slips right of the header (its rolls stand 3.2 mm out), the arrow up to the
  // sheet's top edge; the effects level with the header's top, the Plans level with its bottom
  const px = header.x + header.w + 3.2 + GAP, pw = Math.min(NEST.x - GAP - px, Math.max(ptrW(TXT.effects), ship.code === 'Ж' ? ptrW(fill(TXT.plans, { n: RULES.plansMax })) : 0));
  const effects: Rect = { x: px, y: HEAD_Y, w: pw, h: 11 };
  const plans: Rect | null = ship.code === 'Ж' ? { x: px, y: HEAD_Y + HEAD.h - 11, w: pw, h: 11 } : null;
  // the middle, between the left column and the right one, above the Hull
  const mx = leftR + GAP, mw = MID_R - mx, midBottom = hullRow.y - GAP;
  let y = TOP;
  if (!firesLeft) { fires.x = MID_R - fires.w; fires.y = y; y += fires.h + GAP; }
  const lt = logType(ship);
  const log: Rect = dutchShip ? { ...LOG_DUTCH, y: Math.max(TOP, y), h: lt.h } : { ...LOG, h: lt.h };
  if (dutchShip) y = log.y + log.h + GAP;
  const dutch: Rect | null = dutchShip ? { x: LOG.x, y: NEST.y + NEST.h + GAP, w: LOG.w, h: DIVE_H } : null;
  const cards = counters === 'board' ? { x: MID_R - (2 * PAD + 6 * 14 + C), y: midBottom - 26.5, w: 2 * PAD + 6 * 14 + C, h: 26.5 } : null;
  const reW = 2 * PAD + 7.4 + Math.max(...TXT.reactions.title.split(' ').map(t => W(t, 11, LABEL))) + 3 + 3 * 14 + C;
  const reactions = counters === 'board' ? { x: MID_R - reW, y: cards!.y - GAP - 20.5, w: reW, h: 20.5 } : null;
  const winBottom = reactions ? reactions.y - GAP : midBottom;
  const window = winBottom - y >= 30 ? { x: mx, y, w: mw, h: winBottom - y } : null;
  return { rows, header, effects, plans, fires, dutch, cards, reactions, window, log };
}

// ---- SVG pieces ----
let UID = 0;
interface TO2 extends TO { color?: string; op?: number; in?: string; name?: string }
const text = (x: number, y: number, s: string, size: number, o: TO2 = {}) =>
  `<text${o.in ? ` data-in="${o.in}"` : ''}${o.name ? ` data-name="${esc(o.name)}"` : ''} x="${r(x)}" y="${r(y)}" font-family="${o.font ?? 'Alegreya Sans'}" font-weight="${o.w ?? 500}"${o.italic ? ' font-style="italic"' : ''} font-size="${r(pt(size))}" fill="${o.color ?? '#2a1c0c'}"${o.op != null ? ` fill-opacity="${o.op}"` : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.deco ? ` text-decoration="${o.deco}"` : ''}>${esc(s)}</text>`;
const under69 = (n: number) => n === 6 || n === 9 ? 'underline' : undefined;
const plateRect = (id: string, b: Rect, extra = '') => `<rect data-plate="${id}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="none" stroke="none"${extra}/>`;
/** an icon that the words must keep clear of */
const ico = (name: IconName, cx: number, cy: number, s: number, tone: IconTone, id: string) => `<rect data-plate="${id}" x="${r(cx - s / 2)}" y="${r(cy - s / 2)}" width="${s}" height="${s}" fill="none"/>${icon(name, cx, cy, s, tone)}`;
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');

/** shared gradients of a page */
function defsOf(id: string, L: Look): string {
  const [bl, bm, bd] = L.brass;
  return `<defs>
<linearGradient id="${id}br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".42" stop-color="${bm}"/><stop offset=".55" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${id}brh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".5" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${id}well" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.cellDeep}"/><stop offset=".35" stop-color="${L.cell}"/><stop offset="1" stop-color="${L.cell}"/></linearGradient>
<radialGradient id="${id}hole" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#2a3a44"/><stop offset=".55" stop-color="#101a20"/><stop offset="1" stop-color="#050708"/></radialGradient>
<linearGradient id="${id}paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.paper}"/><stop offset="1" stop-color="${mix(L.paper, '#8a6a3a', 0.08)}"/></linearGradient>
</defs>`;
}
/** a slip of parchment pasted on the chart, a little translucent (the chart under it is calmed): a soft shadow, a double rule */
function slip(pid: string, b: Rect, id: string, L: Look, rule = true, op = 0.9): string {
  return `<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.7)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="#1a0e04" fill-opacity=".24"/>` +
    `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="url(#${id}paper)" fill-opacity="${op}" stroke="${L.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    (rule ? `<rect x="${r(b.x + 1)}" y="${r(b.y + 1)}" width="${r(b.w - 2)}" height="${r(b.h - 2)}" rx=".8" fill="none" stroke="${L.paperLine}" stroke-opacity=".6" stroke-width=".18"/>` : '');
}
/** a cell: a brass rim round a clean recessed well (an 11 mm marker lies in it; its number stands above) */
function cellSvg(pid: string, x: number, y: number, id: string, L: Look, o: { start?: boolean; startColor?: string; icon?: IconName; tint?: string } = {}): string {
  const out = [`<rect x="${r(x + 0.35)}" y="${r(y + 0.5)}" width="${C}" height="${C}" rx="1.8" fill="#1a0e04" fill-opacity=".3"/>`,
    `<rect data-plate="${pid}" x="${r(x)}" y="${r(y)}" width="${C}" height="${C}" rx="1.8" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".22"/>`,
    `<rect x="${r(x + 0.85)}" y="${r(y + 0.85)}" width="${r(C - 1.7)}" height="${r(C - 1.7)}" rx="1.1" fill="${o.tint ?? `url(#${id}well)`}" stroke="${L.brass[2]}" stroke-width=".2"/>`];
  if (o.start) out.push(`<rect x="${r(x + 0.3)}" y="${r(y + 0.3)}" width="${r(C - 0.6)}" height="${r(C - 0.6)}" rx="1.6" fill="none" stroke="${o.startColor ?? L.ink}" stroke-width=".7"/>`);
  if (o.icon) out.push(`<g opacity=".3">${icon(o.icon, x + C / 2, y + C / 2, 8.6, L.tone)}</g>`);
  return out.join('');
}
/** Hull 0: the well tinted like shallow water, the engraved «sinking» stern in it at full strength (the word «тонет» is
 *  the caption under the cell) */
function sinkSvg(pid: string, x: number, y: number, id: string, L: Look): string {
  return cellSvg(pid, x, y, id, L, { tint: mix(L.cell, '#4f8a9a', 0.22) }) + icon('sinking', x + C / 2, y + C / 2, 10.6, L.tone);
}
function star(cx: number, cy: number, R: number, color: string): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.42 : R; p.push(`${r(cx + q * Math.cos(a))},${r(cy + q * Math.sin(a))}`); }
  return `<polygon points="${p.join(' ')}" fill="${color}"/>`;
}

/** a row: the slip, the icon and the name (and its note), the numbers over the cells (the start one after a star), the
 *  cells, the caption line */
function rowSvg(rw: Row, id: string, L: Look, pal: Pal, ship: Ship): string {
  const T = TXT.tracks[rw.key], pid = `row-${rw.key}`, out: string[] = [], souls = rw.key === 'souls';
  out.push(slip(pid, { x: rw.x, y: rw.y, w: rw.w, h: ROW.h }, id, L));
  out.push(ico(ICON_TRACK[rw.key], rw.x + PAD + 3.4, rw.y + 4.4, 6.4, L.tone, `${pid}-icon`));
  const nx = rw.x + PAD + 9.6;
  out.push(text(nx, rw.y + ROW.label, T.name, LABEL_PT, { ...LABEL, color: pal.deep, in: pid }));
  if (T.note) out.push(text(nx + W(T.name, LABEL_PT, LABEL) + 2.4, rw.y + ROW.label, T.note, 9, { ...NOTE_O, color: L.soft, in: pid }));
  for (const cl of rw.cells) {
    const cid = `${pid}-c${cl.n}`, cx = cl.x + C / 2;
    out.push(text(cx, rw.y + ROW.num, String(cl.n), 11, { ...NUM, color: cl.start ? pal.deep : L.ink, anchor: 'middle', deco: under69(cl.n), in: pid }));
    if (cl.start) out.push(star(cx - W(String(cl.n), 11, NUM) / 2 - 2.1, rw.y + ROW.num - 1.35, 1.35, pal.deep));
    const sink = rw.key === 'hull' && cl.n === 0;
    out.push(sink ? sinkSvg(cid, cl.x, cl.y, id, L) : cellSvg(cid, cl.x, cl.y, id, L, { start: cl.start, startColor: pal.deep, tint: souls && cl.n > rw.start ? mix(L.cell, pal.ship, 0.08 + 0.05 * (cl.n - rw.start)) : undefined }));
  }
  // the Volley cells: «Залп дан» over the first (its cost, «1 Порох», in words under it), «по Сердцу» over the second; the
  // engraved volley (smoke and flash from the bore) faint inside
  rw.volley.forEach((v, i) => {
    const cx = v.x + C / 2;
    out.push(text(cx, rw.y + ROW.num - 0.3, volleyCap(ship, i), 8.5, { ...NUM, color: pal.deep, anchor: 'middle', in: pid }));
    if (i === 0) out.push(text(cx, rw.y + ROW.cap, volleyCost(ship), 8, { ...CAP_O, color: L.soft, anchor: 'middle', in: pid }));
    out.push(cellSvg(`${pid}-v${i}`, v.x, v.y, id, L) + `<g opacity=".42">${icon('volley', cx, v.y + C / 2, 9.4, L.tone)}</g>`);
  });
  // the caption line: the threshold under the lowest cell; the Souls: «Кракен» under 3, «максимум» under the last
  const capY = rw.y + ROW.cap, first = rw.cells[0], last = rw.cells[rw.cells.length - 1], zero = rw.key === 'hull' ? T.flip : souls ? undefined : T.zero;
  if (rw.key === 'hull') {
    // «тонет» in a red italic under the sinking stern, then what to do
    const sw = W(T.zero ?? '', 8.3, SINK_O);
    out.push(text(first.x + 0.3, capY, T.zero ?? '', 8.3, { ...SINK_O, color: '#8a2414', in: pid }));
    out.push(text(first.x + 0.3 + sw + 1.6, capY, `— ${T.flip ?? ''}`, 8, { w: 800, color: '#7e2614', in: pid }));
  } else if (zero) out.push(text(first.x + 0.3, capY, zero, 8, { w: 800, color: pal.deep, in: pid }));
  if (souls) {
    const k = rw.cells.find(c => c.n === 3);
    if (k && T.kraken) out.push(text(k.x + C / 2, capY, fill(T.kraken, { n: 3 }), 8, { w: 800, color: pal.deep, anchor: 'middle', in: pid }));
    if (T.max) out.push(text(last.x + C, capY, fill(T.max, { n: last.n }), 8, { ...CAP_O, color: L.soft, anchor: 'end', in: pid }));
  }
  // the key of the star, once: on the Hull's caption line, right
  if (rw.key === 'hull') { const s = rw.cells.find(c => c.start)!, wk = W(TXT.start, 8, CAP_O); out.push(star(s.x + C - wk - 2.2, capY - 1.1, 1.25, pal.deep) + text(s.x + C, capY, TXT.start, 8, { ...CAP_O, color: L.soft, anchor: 'end', in: pid })); }
  return out.join('');
}

/** the header — a cartouche of an old chart (composition 1 of 2: «картуш»; 2 — «резная доска», a carved and gilt
 *  transom board, was heavier on the chart): parchment rolled up at both ends, a double engraved frame with hollow
 *  corners; a brass medallion with the ship's letter, the side on a ribbon under it; the name centred in the column,
 *  an ornamental rule (tapered rules, dots, a lozenge), the captain in letter-spaced small capitals, the motto in italic */
function headerSvg(b: Rect, ship: Ship, pal: Pal, L: Look, id: string): string {
  const { x, y, w, h } = b, out: string[] = [], line = L.paperLine, dark = mix(L.paper, '#5a4024', 0.32), mid = mix(L.paper, '#5a4024', 0.14);
  // the shadow, the sheet, the rolls at the ends (a cylinder each, its spiral showing at the top and the bottom)
  out.push(`<rect x="${r(x - 1.4)}" y="${r(y + 0.9)}" width="${r(w + 2.8)}" height="${r(h)}" rx="1.6" fill="#1a0e04" fill-opacity=".26"/>`);
  out.push(`<defs><linearGradient id="${id}roll" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dark}"/><stop offset=".38" stop-color="${L.paper}"/><stop offset=".62" stop-color="${mix(L.paper, '#fff8e6', 0.35)}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>`);
  out.push(`<rect data-plate="header" x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="url(#${id}paper)" stroke="${line}" stroke-width=".3"/>`);
  for (const side of [-1, 1]) {
    const rx = side < 0 ? x - 3.2 : x + w - 0.8, rw = 4, top = y - 0.5, bot = y + h + 0.5, cx = rx + rw / 2;
    out.push(`<rect x="${r(rx)}" y="${r(top)}" width="${rw}" height="${r(bot - top)}" rx="1.2" fill="url(#${id}roll)" stroke="${line}" stroke-width=".28"/>`);
    out.push(`<path d="M${r(rx + 1.1)} ${r(top + 1.6)}V${r(bot - 1.6)}M${r(rx + 2.9)} ${r(top + 1.6)}V${r(bot - 1.6)}" stroke="${line}" stroke-width=".14" stroke-opacity=".5"/>`);
    for (const [ey, dir] of [[top + 0.9, 1], [bot - 0.9, -1]] as const) {
      out.push(`<ellipse cx="${r(cx)}" cy="${r(ey)}" rx="2" ry=".85" fill="${mid}" stroke="${line}" stroke-width=".25"/>`);
      out.push(`<path d="M${r(cx + 1.2)} ${r(ey)}C${r(cx + 1.2)} ${r(ey - 0.55 * dir)} ${r(cx - 1.1)} ${r(ey - 0.55 * dir)} ${r(cx - 1.1)} ${r(ey)}C${r(cx - 1.1)} ${r(ey + 0.4 * dir)} ${r(cx + 0.6)} ${r(ey + 0.4 * dir)} ${r(cx + 0.5)} ${r(ey)}C${r(cx + 0.4)} ${r(ey - 0.25 * dir)} ${r(cx - 0.3)} ${r(ey - 0.2 * dir)} ${r(cx - 0.2)} ${r(ey)}" fill="none" stroke="${line}" stroke-width=".18"/>`);
    }
  }
  // the double frame with hollow corners and a dot in each
  const fr = (d: number, k: number) => `M${r(x + d + k)} ${r(y + d)}H${r(x + w - d - k)}A${k} ${k} 0 0 0 ${r(x + w - d)} ${r(y + d + k)}V${r(y + h - d - k)}A${k} ${k} 0 0 0 ${r(x + w - d - k)} ${r(y + h - d)}H${r(x + d + k)}A${k} ${k} 0 0 0 ${r(x + d)} ${r(y + h - d - k)}V${r(y + d + k)}A${k} ${k} 0 0 0 ${r(x + d + k)} ${r(y + d)}Z`;
  out.push(`<path d="${fr(1.3, 1.8)}" fill="none" stroke="${line}" stroke-width=".32" stroke-opacity=".85"/><path d="${fr(1.9, 1.2)}" fill="none" stroke="${line}" stroke-width=".14" stroke-opacity=".7"/>`);
  for (const [qx, qy] of [[x + 1.3, y + 1.3], [x + w - 1.3, y + 1.3], [x + 1.3, y + h - 1.3], [x + w - 1.3, y + h - 1.3]]) out.push(`<circle cx="${r(qx)}" cy="${r(qy)}" r=".42" fill="${pal.deep}"/>`);
  // the medallion: a brass ring with a beaded edge, the field in the ship's colour, the letter; the side on a ribbon under it
  const mx = x + HEAD.med, my = y + 10;
  out.push(`<circle cx="${r(mx + 0.35)}" cy="${r(my + 0.55)}" r="8.2" fill="#1a0e04" fill-opacity=".3"/>`);
  out.push(`<g data-plate="header-medal"><circle cx="${r(mx)}" cy="${r(my)}" r="8.2" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".3"/></g>`);
  out.push(`<circle cx="${r(mx)}" cy="${r(my)}" r="7.55" fill="none" stroke="${L.brass[2]}" stroke-width=".5" stroke-dasharray=".01 .78" stroke-linecap="round"/>`);
  out.push(`<defs><radialGradient id="${id}fld" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="${mix(pal.solid, '#ffffff', 0.18)}"/><stop offset=".7" stop-color="${pal.solid}"/><stop offset="1" stop-color="${mix(pal.solid, '#000000', 0.3)}"/></radialGradient></defs>`);
  out.push(`<circle cx="${r(mx)}" cy="${r(my)}" r="6.75" fill="url(#${id}fld)" stroke="${L.brass[2]}" stroke-width=".3"/><circle cx="${r(mx)}" cy="${r(my)}" r="6.05" fill="none" stroke="#fff8e6" stroke-width=".2" stroke-opacity=".7"/>`);
  out.push(`<path d="M${r(mx - 5.6)} ${r(my - 3.4)}A6.6 6.6 0 0 1 ${r(mx + 1.2)} ${r(my - 6.5)}" fill="none" stroke="#fff6d8" stroke-opacity=".55" stroke-width=".35" stroke-linecap="round"/>`);
  out.push(text(mx, my + pt(19) * 0.33, ship.code, 19, { font: 'Alegreya SC', w: 800, color: '#fff8e6', anchor: 'middle', in: 'header-medal' }));
  const sw = W(ship.side, 7.2, SIDE_O), bw = sw + 4.2, by = y + 18.7, bh = 6.6, bx = mx - bw / 2, tail = 2.4, td = 1.1;
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? bx : bx + bw, ox = ex + sd * tail;
    out.push(`<path d="M${r(ex - sd * 1.6)} ${r(by + td)}H${r(ox)}L${r(ox - sd * 1.3)} ${r(by + td + bh / 2)}L${r(ox)} ${r(by + td + bh)}H${r(ex - sd * 1.6)}Z" fill="${mix(pal.solid, '#000000', 0.35)}" stroke="${L.brass[2]}" stroke-width=".22"/>`);
    out.push(`<path d="M${r(ex)} ${r(by + bh)}L${r(ex + sd * 0.01)} ${r(by + bh + td)}L${r(ex - sd * 1.6)} ${r(by + bh + td)}Z" fill="${mix(pal.solid, '#000000', 0.55)}"/>`);
  }
  out.push(`<rect data-plate="header-side" x="${r(bx)}" y="${r(by)}" width="${r(bw)}" height="${bh}" fill="${pal.solid}" stroke="${L.brass[2]}" stroke-width=".22"/><path d="M${r(bx + 0.6)} ${r(by + 0.7)}H${r(bx + bw - 0.6)}M${r(bx + 0.6)} ${r(by + bh - 0.7)}H${r(bx + bw - 0.6)}" stroke="#fff8e6" stroke-opacity=".45" stroke-width=".15"/>`);
  out.push(text(mx + 0.4, by + bh / 2 + pt(7.2) * 0.33, ship.side, 7.2, { ...SIDE_O, color: '#fff8e6', anchor: 'middle', in: 'header-side' }));
  // the column: the name, the rule, the captain, the motto — centred
  const c0 = x + HEAD.col - 1, c1 = x + w - 3.5, tc = (c0 + c1) / 2;
  out.push(text(tc, y + 10.4, ship.name, 24, { ...NAME_O, color: pal.deep, anchor: 'middle', in: 'header' }));
  const dw = Math.min(W(ship.name, 24, NAME_O) * 0.86, c1 - c0 - 4), ry = y + 14.35, spindle = (a: number, bb: number) => { const m = (a + bb) / 2; return `M${r(a)} ${r(ry)}Q${r(m)} ${r(ry - 0.34)} ${r(bb)} ${r(ry)}Q${r(m)} ${r(ry + 0.34)} ${r(a)} ${r(ry)}Z`; };
  out.push(`<path d="${spindle(tc - dw / 2, tc - 3.6)}${spindle(tc + 3.6, tc + dw / 2)}" fill="${pal.deep}" fill-opacity=".85"/>`);
  out.push(`<path d="M${r(tc)} ${r(ry - 1)}L${r(tc + 1.5)} ${r(ry)}L${r(tc)} ${r(ry + 1)}L${r(tc - 1.5)} ${r(ry)}Z" fill="${pal.deep}"/><path d="M${r(tc)} ${r(ry - 0.45)}L${r(tc + 0.65)} ${r(ry)}L${r(tc)} ${r(ry + 0.45)}L${r(tc - 0.65)} ${r(ry)}Z" fill="${L.paper}"/>`);
  for (const sd of [-1, 1]) out.push(`<circle cx="${r(tc + sd * 2.55)}" cy="${r(ry)}" r=".36" fill="${pal.deep}"/><circle cx="${r(tc + sd * (dw / 2 + 0.9))}" cy="${r(ry)}" r=".3" fill="${pal.deep}" fill-opacity=".8"/>`);
  out.push(text(tc, y + 18.85, ship.captain, 10, { ...CAPT_O, color: L.ink, anchor: 'middle', in: 'header' }));
  out.push(text(tc, y + 23.75, ship.motto, 8.5, { ...MOTTO_O, color: L.soft, anchor: 'middle', in: 'header' }));
  return out.join('');
}

/** a pointer to the sheet's edge, written in ink: the arrow, the icon, the words (in two lines when the slip is short) */
function pointerSvg(pid: string, b: Rect, words: string, ic: IconName, id: string, L: Look, pal: Pal): string {
  const out = [slip(pid, b, id, L, false)], ax = b.x + 3.4, ay = b.y + b.h / 2, tx = b.x + 13.2;
  out.push(`<path d="M${r(ax)} ${r(b.y + b.h - 2.2)}V${r(b.y + 2)}M${r(ax - 1.3)} ${r(b.y + 3.8)}L${r(ax)} ${r(b.y + 2)}L${r(ax + 1.3)} ${r(b.y + 3.8)}" stroke="${pal.deep}" stroke-width=".55" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  out.push(ico(ic, b.x + 8.6, ay, 5.4, L.tone, `${pid}-icon`));
  if (tx + W(words, 8.5, PTR) <= b.x + b.w - PAD) out.push(text(tx, ay + 1.25, words, 8.5, { ...PTR, color: pal.deep, in: pid }));
  else { const cut = words.lastIndexOf(' ', Math.ceil(words.length / 2) + 4), [l1, l2] = [words.slice(0, cut), words.slice(cut + 1)]; out.push(text(tx, ay - 0.6, l1, 8.5, { ...PTR, color: pal.deep, in: pid }) + text(tx, ay + 3.05, l2, 8.5, { ...PTR, color: pal.deep, in: pid })); }
  return out.join('');
}
/** the Fires: three 23 mm places, brass-rimmed, a faint fire on deck inside */
function firesSvg(b: Rect, id: string, L: Look, pal: Pal): string {
  const out = [slip('fires', b, id, L)], s = BOARD.fireSlot, y0 = b.y + FIRE.slot;
  out.push(ico('fire', b.x + PAD + 2.4, b.y + 3.5, 4.4, L.tone, 'fires-icon') + text(b.x + PAD + 6.2, b.y + FIRE.title, fill(TXT.fires.title, { n: RULES.maxFires }), 10, { ...LABEL, color: pal.deep, in: 'fires' }));
  for (let i = 0; i < RULES.maxFires; i++) {
    const x = b.x + PAD + i * (s + 3);
    out.push(`<rect x="${r(x + 0.4)}" y="${r(y0 + 0.5)}" width="${s}" height="${s}" rx="2.2" fill="#1a0e04" fill-opacity=".3"/><rect data-plate="fires-${i}" x="${r(x)}" y="${r(y0)}" width="${s}" height="${s}" rx="2.2" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".22"/>`);
    out.push(`<rect x="${r(x + 1)}" y="${r(y0 + 1)}" width="${r(s - 2)}" height="${r(s - 2)}" rx="1.4" fill="${mix(L.cell, '#c4602f', 0.1)}" stroke="${L.brass[2]}" stroke-width=".2"/>`);
    out.push(`<g opacity=".55">${icon('fire', x + s / 2, y0 + s / 2, 15.5, L.tone)}</g>`);
  }
  return out.join('');
}
/** the Dutchman's dive plate: one nest for the two-sided token (face «Под водой», back «Всплыл»: diving — laid face up;
 *  surfacing — turned over; at the end of the turn — taken off), and under it what each side means */
function dutchSvg(b: Rect, id: string, L: Look, pal: Pal): string {
  const out = [slip('dutch', b, id, L)], u = BOARD.underwaterSlot, nx = b.x + (b.w - u.w) / 2, ny = b.y + 3;
  out.push(`<rect data-plate="dutch-nest" x="${r(nx)}" y="${r(ny)}" width="${u.w}" height="${u.h}" rx="2" fill="${mix(L.cell, '#2f8a96', 0.14)}" stroke="${L.brass[2]}" stroke-width=".35"/>`);
  out.push(`<g opacity=".3">${icon('underwater', nx + u.w / 2, ny + u.h / 2, 18, L.tone)}</g>`);
  let y = ny + u.h + 2;
  [TXT.underwater, TXT.surfaced].forEach((t, i) => {
    const pid = `dutch-${i}`;
    out.push(ico(i ? 'surfaced' : 'underwater', b.x + PAD + 2.4, y + 2.6, 4.4, L.tone, `${pid}-icon`) + text(b.x + PAD + 6.2, y + 4.2, t.title, 10, { ...LABEL, color: pal.deep, in: 'dutch' }));
    const words = nb(t.note).split(' '), lines: string[] = [''], wmax = b.w - 2 * PAD - 3;
    for (const wd of words) { const tryL = (lines[lines.length - 1] + ' ' + wd).trim(); if (W(tryL, 8, CAP_O) > wmax && lines[lines.length - 1]) lines.push(wd); else lines[lines.length - 1] = tryL; }
    lines.forEach((l, j) => out.push(text(b.x + PAD + 1, y + 8.4 + j * 4, l, 8, { ...CAP_O, color: L.ink, in: 'dutch' })));
    y += 8.4 + (lines.length - 1) * 4 + 2.2;
  });
  return out.join('');
}
/** counters on a brass ruler: windows cut through the brass, the number engraved over each; the title on top or left */
function rulerSvg(pid: string, b: Rect, title: string, ic: IconName, nums: number[], labelLeft: boolean, id: string, L: Look): string {
  const [bl, bm, bd] = L.brass, out: string[] = [], CP = 14, ink = '#2a1a08';
  out.push(`<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.7)}" width="${r(b.w)}" height="${b.h}" rx="1.6" fill="#1a0e04" fill-opacity=".35"/><rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${b.h}" rx="1.6" fill="url(#${id}br)" stroke="${bd}" stroke-width=".3"/>`);
  out.push(`<rect x="${r(b.x + 0.9)}" y="${r(b.y + 0.9)}" width="${r(b.w - 1.8)}" height="${r(b.h - 1.8)}" rx="1" fill="none" stroke="${bd}" stroke-width=".2" stroke-opacity=".8"/>`);
  const n = nums.length, x0 = b.x + b.w - PAD - (n - 1) * CP - C, cy = b.y + b.h - 1.5 - C;
  const ty = labelLeft ? b.y + b.h / 2 : b.y + 5.8, tx = b.x + PAD + 6.6;
  out.push(ico(ic, b.x + PAD + 2.4, labelLeft ? ty : b.y + 3.9, 4.8, { ...L.tone, ink, paper: bm }, `${pid}-icon`));
  if (labelLeft) { const [a, bb = ''] = title.split(' '); out.push(text(tx, ty - 1.3, a, 11, { ...LABEL, color: ink, in: pid }) + text(tx, ty + 4.1, bb, 11, { ...LABEL, color: ink, in: pid })); }
  else out.push(text(tx, ty, title, 11, { ...LABEL, color: ink, in: pid }));
  nums.forEach((v, i) => {
    const x = x0 + i * CP;
    out.push(text(x + C / 2, cy - 0.9, String(v), 11, { ...NUM, color: ink, anchor: 'middle', deco: under69(v), in: pid }));
    out.push(`<rect x="${r(x)}" y="${r(cy)}" width="${C}" height="${C}" rx="1.3" fill="${bd}"/><rect x="${r(x + 0.5)}" y="${r(cy + 0.5)}" width="${r(C - 0.5)}" height="${r(C - 0.5)}" rx="1.1" fill="${bl}"/><rect data-plate="${pid}-w${v}" x="${r(x + 0.5)}" y="${r(cy + 0.5)}" width="${r(C - 1)}" height="${r(C - 1)}" rx="1" fill="url(#${id}well)"/>`);
  });
  return out.join('');
}
/** the nest of the Legend card: brass photo-corners in the 1.5 mm margin; under the card, what shows once it is played */
function nestSvg(b: Rect, id: string, L: Look, pal: Pal, legendName: string): string {
  const out: string[] = [], m = 1.5, cx = b.x + b.w / 2;
  out.push(`<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.7)}" width="${b.w}" height="${b.h}" rx="2.6" fill="#1a0e04" fill-opacity=".3"/><rect data-plate="nest" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2.6" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".3"/>`);
  out.push(`<rect data-plate="nest" x="${r(b.x + m)}" y="${r(b.y + m)}" width="${r(b.w - 2 * m)}" height="${r(b.h - 2 * m)}" rx="2.4" fill="${mix(L.paper, '#5a4024', 0.1)}" stroke="${L.brass[2]}" stroke-width=".3"/>`);
  out.push(`<rect x="${r(b.x + m + 3)}" y="${r(b.y + m + 3)}" width="${r(b.w - 2 * m - 6)}" height="${r(b.h - 2 * m - 6)}" rx="1.4" fill="none" stroke="${L.paperLine}" stroke-width=".3" stroke-dasharray="1.6 1.1" stroke-opacity=".7"/>`);
  out.push(`<g opacity=".85">${icon(LEGEND_ICON[legendName] ?? 'legend', cx, b.y + b.h * 0.36, 32, L.tone)}</g>`);
  out.push(text(cx, b.y + b.h * 0.64, TXT.legend.played, 13, { ...LABEL, color: pal.deep, anchor: 'middle', in: 'nest' }));
  out.push(text(cx, b.y + b.h * 0.64 + 5.6, `«${legendName}»`, 10, { font: 'Alegreya', w: 500, italic: true, color: L.soft, anchor: 'middle', in: 'nest' }));
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
    const X = sx ? b.x + b.w : b.x, Y = sy ? b.y + b.h : b.y, dx = sx ? -1 : 1, dy = sy ? -1 : 1, a = 7.5;
    out.push(`<path d="M${r(X)} ${r(Y)}h${r(dx * a)}L${r(X)} ${r(Y + dy * a)}Z" fill="url(#${id}br)" stroke="${L.brass[2]}" stroke-width=".25"/>`);
  }
  return out.join('');
}
/** the abilities: a page of the ship's log pinned to the chart; the ruled lines lie exactly under the baselines of the HTML */
function logSvg(b: Rect, L: Look, lt: { size: number; lh: number }): string {
  const { x, y, w, h } = b, pts: string[] = [];
  for (let i = 0; i <= 24; i++) pts.push(`${r(x + w - (w * i) / 24)} ${r(y + h - (i % 2 ? 0.7 : 0) - (i % 5 === 0 ? 0.4 : 0))}`);
  const paper = `M${x} ${y}H${x + w}V${y + h}L${pts.join('L')}Z`, base = y + LOGT.top + lt.lh / 2 + 0.33 * pt(lt.size) + 0.35;
  let lines = '';
  for (let yy = base; yy < y + h - 1.6; yy += lt.lh) lines += `M${x + 2.5} ${r(yy)}H${x + w - 2.5}`;
  return `<path d="${paper}" fill="#1a0e04" fill-opacity=".3" transform="translate(.7 .9)"/><path data-plate="log" d="${paper}" fill="${L.note}" stroke="${L.paperLine}" stroke-opacity=".5" stroke-width=".2"/>` +
    `<path d="${lines}" stroke="${L.noteLine}" stroke-width=".16" stroke-opacity=".8"/><path d="M${x + LOGT.side - 1.4} ${y}V${y + h}" stroke="${L.margin}" stroke-width=".22" stroke-opacity=".6"/>` +
    `<circle cx="${r(x + w / 2)}" cy="${r(y + 1.7)}" r="1.3" fill="${L.pin}"/><circle cx="${r(x + w / 2 - 0.4)}" cy="${r(y + 1.35)}" r=".4" fill="#fff" fill-opacity=".5"/>`;
}

// ---- the chart under it all ----
/** the ship on the chart: the kit ship, a faint pool of paper under it, engraved swell along its waterline */
function shipOnChart(kind: string, cx: number, wy: number, maxW: number, maxH: number, L: Look): string {
  if (maxW <= 0) return '';
  const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), s = Math.min(maxW / b.w, maxH / b.h);
  const body = K.ship('v2' + kind, K.makeLight(K.LIGHTS.endeavour, { horizon: wy - 4 }), { kind, x: cx - s * (b.x0 + b.x1) / 2, y: wy, scale: s });
  const w = b.w * s, h = b.h * s;
  let swell = '';
  for (let i = 0; i < 4; i++) { const y = wy + 0.8 + i * 1.4, x0 = cx - w * (0.5 - i * 0.07), x1 = cx + w * (0.5 - i * 0.07); let d = `M${r(x0)} ${r(y)}`; for (let x = x0; x < x1 - 2.9; x += 3) d += `q.75 -.55 1.5 0t1.5 0`; swell += `<path d="${d}" fill="none" stroke="${L.ink}" stroke-width="${r(0.28 - i * 0.04)}" stroke-opacity="${r(0.8 - i * 0.16)}"/>`; }
  return `<defs><filter id="v2pool${kind}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><ellipse cx="${r(cx)}" cy="${r(wy - h * 0.42)}" rx="${r(w * 0.56)}" ry="${r(h * 0.56)}" fill="${L.paper}" opacity=".28" filter="url(#v2pool${kind})"/>${body}${swell}`;
}
/** the whole ship on the chart: from the masthead pennant to the last line of the swell, the swell's full width */
function shipRect(kind: string, ship: ShipPlace['ship']): Rect | null {
  const [cx, wy, mw, mh] = ship; if (mw <= 0) return null;
  const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), s = Math.min(mw / b.w, mh / b.h), w = b.w * s;
  return { x: cx - 0.54 * w, y: wy - b.h * s, w: 1.08 * w, h: b.h * s + 5.4 };
}
const grow = (b: Rect, d: number): Rect => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });
const meets = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inside = (a: Rect, b: Rect) => a.x >= b.x - 0.01 && a.y >= b.y - 0.01 && a.x + a.w <= b.x + b.w + 0.01 && a.y + a.h <= b.y + b.h + 0.01;
/** the gap round the ship: no land, no lettering, no mark, no plate comes closer */
const SHIP_GAP = 2;
/** the ship's place: the largest ship — up to ¾ of the look's size, at most 50 mm long — whose rect with SHIP_GAP round it
 *  lies in open water inside the free window between the plates, clear of the rose, the cross and the notes; of the
 *  places for that size, the nearest to the look's spot */
function placeShip(kind: string, want: ShipPlace['ship'], win: Rect, chart: ChartOpts, marks: Rect[]): ShipPlace['ship'] | null {
  const [wx, wy0, mw0, mh0] = want; if (mw0 <= 0) return null;
  const land = landGrid(chart, win), b = K.shipBox(kind, { x: 0, y: 0, scale: 1 });
  for (let mw = Math.min(mw0 * 0.75, 50); mw >= 28; mw -= 1.5) {
    const mh = Math.min(mh0, mw * b.h / b.w);
    let best: ShipPlace['ship'] | null = null, bd = 1e9;
    for (let cx = win.x; cx <= win.x + win.w; cx += 1.5) for (let wy = win.y; wy <= win.y + win.h; wy += 1.5) {
      const rc = shipRect(kind, [cx, wy, mw, mh])!, g = grow(rc, SHIP_GAP);
      if (!inside(g, win) || land(g) || marks.some(m => meets(m, g))) continue;
      const d = Math.hypot(cx - wx, wy - wy0); if (d < bd) { bd = d; best = [cx, wy, mw, mh]; }
    }
    if (best) return best;
  }
  return null;
}
/** the ship check of every board built (check.ts, --check): its rect + SHIP_GAP has no land of caribbean.json under it,
 *  meets no lettering of the chart, no rose, cross or note, and lies inside the free window between the plates */
export const SHIP_CHECK: { board: string; issues: string[] }[] = [];

/** One face of a board, concept B v2. */
export async function boardV2(ctx: Ctx, ship: Ship, counters: Counters): Promise<{ html: string; css: string }> {
  const key = DECK_KEY[ship.code] as ShipKey, L = LOOKS[key], pal = basePalette(ship.color), id = `v2${++UID}`;
  // the widths come from the browser: a dry run collects the strings, then the real layout
  await fitLog(ctx, ship, () => logInner(ship, L, id));
  layoutV2(ship, counters); faceSvg(ctx, ship, counters, layoutV2(ship, counters), id, L, pal);
  await measureMissing(ctx);
  const plan = layoutV2(ship, counters), place = counters === 'board' ? L.board : L.strip, kind = key;
  const calm: Rect[] = [plan.header, NEST, plan.effects, plan.log, plan.fires, ...plan.rows.map(rw => ({ x: rw.x, y: rw.y, w: rw.w, h: ROW.h })),
    ...[plan.plans, plan.cards, plan.reactions, plan.dutch].filter((b): b is Rect => !!b)];
  const view = { w: PAGE.w, h: PAGE.h, mmPerDeg: L.mmPerDeg, center: [0, 0] as [number, number], anchor: place.anchor };
  const base: ChartOpts = { style: L.chart, ...view, inset: 3.2, seed: 5 + ship.code.charCodeAt(0) % 17, calm, roses: [{ x: place.rose[0], y: place.rose[1], r: place.rose[2] }], folds: { x: [PAGE.w / 2 + 12], y: [PAGE.h / 2 + 6] } };
  const at = (lon: number, lat: number) => chartPoint({ ...view, center: centerOf(view) }, lon, lat);
  const notes = L.notes ? L.notes(at, place) : {};
  // the marks the ship keeps clear of: the rose, the cross, the notes (as the chart lays them)
  const marks: Rect[] = [{ x: place.rose[0] - place.rose[2], y: place.rose[1] - place.rose[2], w: 2 * place.rose[2], h: 2 * place.rose[2] }];
  if (notes.cross) marks.push({ x: notes.cross.x - 5.5, y: notes.cross.y - 5.5, w: 11, h: 11 });
  for (const nt of notes.note ?? []) marks.push({ x: nt.x - 1, y: nt.y - (nt.size ?? 4.2), w: nt.text.length * (nt.size ?? 4.2) * 0.42 + 2, h: (nt.size ?? 4.2) * 1.5 });
  const at0 = plan.window ? placeShip(kind, place.ship, plan.window, base, marks) : null, sr = at0 ? shipRect(kind, at0) : null;
  const report: ChartReport = { labels: [], marks: [] };
  const opts: ChartOpts = { ...base, avoid: sr ? [grow(sr, SHIP_GAP)] : [], labelsAt: place.labels, ...notes, report };
  let svgChart = chartSvg(opts);
  if (at0 && sr) {
    svgChart = svgChart.replace(/<\/svg>$/, shipOnChart(kind, ...at0, L) + '</svg>');
    const g = grow(sr, SHIP_GAP - 0.5), issues: string[] = [], nLand = landIn(base, g);
    if (nLand) issues.push(`land under the ship (${nLand} points)`);
    for (const lb of report.labels) if (meets(lb.box, g)) issues.push(`the label «${lb.text}» meets the ship`);
    for (const m of report.marks) if (meets(m.box, g)) issues.push(`the ${m.kind} meets the ship`);
    if (!inside(g, plan.window!)) issues.push('the ship runs under a plate');
    SHIP_CHECK.push({ board: `${ship.name} (${counters})`, issues });
  } else if (place.ship[2] > 0) SHIP_CHECK.push({ board: `${ship.name} (${counters})`, issues: plan.window ? ['no open water for the ship in the window'] : [] });
  const jpg = await rasterJpeg(ctx.browser, `board2-${key}-${counters}`, svgChart, PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);
  const face = faceSvg(ctx, ship, counters, plan, id, L, pal);
  return { html: `<div class="v2 v2-${key}"><svg class="v2-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${defsOf(id, L)}<image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>${face.svg}</svg>\n${face.html}</div>`, css: '' };
}
const centerOf = (v: { w: number; h: number; mmPerDeg: number; anchor: { lon: number; lat: number; x: number; y: number } }) => centerFor(v.anchor.lon, v.anchor.lat, v.anchor.x, v.anchor.y, v.w, v.h, v.mmPerDeg);

function faceSvg(ctx: Ctx, ship: Ship, counters: Counters, plan: Plan, id: string, L: Look, pal: Pal): { svg: string; html: string } {
  void ctx; void counters;
  const legend = data.legends[ship.code], svg: string[] = [];
  svg.push(headerSvg(plan.header, ship, pal, L, id));
  // the header with its rolls is one plate for the gaps (check-layout)
  svg.push(plateRect('header', { x: plan.header.x - 3.2, y: plan.header.y - 0.5, w: plan.header.w + 6.4, h: plan.header.h + 1 }));
  svg.push(pointerSvg('effects', plan.effects, TXT.effects, 'effects', id, L, pal));
  if (plan.plans) svg.push(pointerSvg('plans', plan.plans, fill(TXT.plans, { n: RULES.plansMax }), 'plan', id, L, pal));
  for (const rw of plan.rows) svg.push(rowSvg(rw, id, L, pal, ship));
  svg.push(firesSvg(plan.fires, id, L, pal));
  if (plan.dutch) svg.push(dutchSvg(plan.dutch, id, L, pal));
  if (plan.cards) svg.push(rulerSvg('cards', plan.cards, TXT.cards.title, 'cards', [6, 5, 4, 3, 2, 1, 0], false, id, L));
  if (plan.reactions) svg.push(rulerSvg('reactions', plan.reactions, TXT.reactions.title, 'reaction', [0, 1, 2, 3], true, id, L));
  svg.push(nestSvg(NEST, id, L, pal, legend.name));
  // the abilities in the log: one line height for every line (headings too), so the baselines stay on the ruled lines
  const lt = logType(ship), log = plan.log;
  svg.push(logSvg(log, L, lt));
  const html = `<div class="v2-abs v2-log" data-in="log" data-name="журнал особенностей" style="left:${log.x + LOGT.side}mm;top:${log.y + LOGT.top}mm;width:${log.w - 2 * LOGT.side}mm;height:${r(lt.h - LOGT.top - 4)}mm;--c:${pal.deep};--ink:${L.ink};--soft:${L.soft};--lh:${lt.lh}mm;--fs:${lt.size}pt;--lift-h:${r(-0.33 * (pt(11.5) - pt(lt.size)))}mm;--lift-n:${r(-0.33 * (pt(10) - pt(lt.size)))}mm">${logInner(ship, L, id)}</div>`;
  return { svg: svg.join('\n'), html };
}
function logInner(ship: Ship, L: Look, id: string): string {
  // each ability: its engraved icon two lines tall at the left, the name — an initial in the ship's colour, the rest in
  // small capitals, an ornamental rule running out to the margin — then the text
  const ab = ship.abilities.map(a => {
    const once = /раз в ход/i.test(a.text), ic = ABILITY_ICON[a.name], [c0, rest] = [a.name.slice(0, 1), a.name.slice(1)];
    return `${once ? `<div class="v2-tick">${onceCell(L, id)}<i>${esc(TXT.once)}</i></div>` : ''}${ic ? `<div class="v2-ic">${iconSvg(ic, 7.6, L.tone)}</div>` : ''}<div class="v2-an"><span class="v2-nm"><b>${esc(c0)}</b>${esc(rest)}</span><span class="v2-orn"></span></div><div class="v2-p">${richNb(a.text)}</div>`;
  }).join('');
  // «Души: в свой ход 1 Душа = 1 Корпус или 1 Команда» is not repeated here: «Вечная служба» already says it
  const extra = [TXT.heart[ship.code] ?? ''].filter(Boolean).map(t => `<div class="v2-p">${richNb(t)}</div>`).join('');
  return `<div class="v2-h">${esc(TXT.abilities)}</div>${ab}${extra}`;
}
/** the «раз в ход» cell beside an ability: a 13 mm cell like the tracks', floated right in the log */
const onceCell = (L: Look, id: string) => `<svg viewBox="0 0 13 13" style="width:13mm;height:13mm;display:block"><rect x=".2" y=".2" width="12.6" height="12.6" rx="1.8" fill="${L.brass[1]}" stroke="${L.brass[2]}" stroke-width=".25"/><rect x="1" y="1" width="11" height="11" rx="1.1" fill="${L.cell}" stroke="${L.brass[2]}" stroke-width=".2"/></svg>`.replace('url(#' + id, 'url(#' + id);

/** every line of the log has one line height (--lh), so the baselines stay on the ruled lines; a heading's larger size sits
 *  its baseline 0.33·Δem lower in the same line box and is lifted back (--lift-h, --lift-n) */
export const V2_CSS = `
.v2{position:absolute;inset:0}
.v2-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.v2-abs{position:absolute}
.v2-log{font:500 var(--fs) Alegreya,serif;line-height:var(--lh);color:var(--ink);overflow:hidden}
.v2-log *{line-height:var(--lh)}
.v2-h{font:italic 500 11.5pt Alegreya,serif;color:var(--c);position:relative;top:var(--lift-h)}
.v2-an{display:flex;align-items:baseline;gap:1.4mm;font:800 10pt 'Alegreya SC',serif;letter-spacing:.04em;color:var(--c);position:relative;top:var(--lift-n)}
.v2-an .v2-nm{flex:0 1 auto;min-width:0}
.v2-an .v2-nm b{font:800 13pt Alegreya,serif;letter-spacing:0;margin-right:.1mm}
.v2-an .v2-orn{flex:1;align-self:center;height:1.4mm;margin-top:-.6mm;min-width:0;background:radial-gradient(circle,var(--c) 0 .32mm,transparent .36mm) 0 50%/1.4mm 1.4mm no-repeat,linear-gradient(to right,var(--c),transparent) 1.9mm 50%/100% .28mm no-repeat;opacity:.75}
.v2-ic{float:left;width:8.2mm;height:calc(var(--lh) * 2);margin:0 1.6mm 0 -.4mm;display:flex;align-items:center;justify-content:center}
.v2-ic svg{display:block}
.v2-an i{display:inline-flex;align-items:center;gap:.8mm;font:italic 500 var(--fs) Alegreya,serif;letter-spacing:0;color:var(--soft)}
.v2-an i svg{width:3.4mm;height:3.4mm}
.v2-p{margin:0 0 var(--lh)}
.v2-p:last-child{margin-bottom:0}
.v2-p b{font-weight:800}
.v2-tick{float:right;width:13.4mm;height:calc(13mm + var(--lh) + .6mm);margin:0 0 0 2mm;display:flex;flex-direction:column;align-items:center}
.v2-tick i{display:block;font:italic 500 var(--fs) Alegreya,serif;letter-spacing:0;color:var(--soft);white-space:nowrap;margin-top:.6mm}
`;

/** Sheet 04 with counters 'strip' (portrait like the rest of 04): four strips, one per ship, cut along the dashed lines
 *  (a runner of the same size can replace one later): the letter, «Осталось карт» 6…0, «Реакций сыграно» 0…3. */
export const STRIP = { w: 190, h: 31.5, gap: 9 };
/** sheet 04, page 3: a strip per player, cut along the dashed line. A light parchment ground (as the holds of page 1); the
 *  ship's letter in a brass-rimmed medallion like the track markers; two parchment panels of one height with brass edges
 *  and a 2.5 mm gap, «Осталось карт» (6 … 0) and «Реакций сыграно» (0 … 3), the cells centred under their title. Nothing,
 *  shadows included, comes closer than 3 mm to the dashed line. The words are HTML boxes from parts/tokens-art.ts. */
export function counterStripsPage(head: string, foot: string): PageSpec {
  const Wp = 210, Hp = 297, x0 = (Wp - STRIP.w) / 2, y0 = 34, out: string[] = [], html: string[] = [], SAFE = 3, CP = 14, GAP = 2.5;
  const medal = { x: x0 + SAFE, s: 14 }, px0 = medal.x + medal.s + 2.5, px1 = x0 + STRIP.w - SAFE - 0.5, ph = 24.4, pt0 = 3.2;
  const need = (n: number) => (n - 1) * CP + C + 2 * PAD, room = px1 - px0 - GAP, extra = room - need(7) - need(4);
  const panels = [
    { key: 'cards', title: TXT.cards.title, ic: 'cards' as IconName, nums: [6, 5, 4, 3, 2, 1, 0], w: need(7) + extra * 0.6 },
    { key: 're', title: TXT.reactions.title, ic: 'reaction' as IconName, nums: [0, 1, 2, 3], w: need(4) + extra * 0.4 }
  ];
  const TCAP = 2.45, tem = TCAP / 0.655, tpt = tem * 72 / 25.4;
  data.ships.forEach((ship, i) => {
    const key = DECK_KEY[ship.code] as ShipKey, L = LOOKS[key], pal = basePalette(ship.color), id = `v2s${i}`, y = y0 + i * (STRIP.h + STRIP.gap);
    out.push(defsOf(id, L));
    out.push(`<rect data-plate="strip-${i}" x="${x0}" y="${y}" width="${STRIP.w}" height="${STRIP.h}" fill="${GROUND_LIGHT}" stroke="#8c8c8c" stroke-width=".25" stroke-dasharray="2 1.4"/>`);
    // the medallion: a brass rim round a field of the ship's colour, the letter large and light
    const my = y + (STRIP.h - medal.s) / 2, mid = `strip-${i}-medal`, deep = deepOf(ship.color);
    out.push(brassCell(mid, medal.x, my, medal.s, id, { tint: deep, rx: 1.8, shadow: false }));
    html.push(capWord(mid, medal.x + medal.s / 2, my + medal.s / 2, ship.code, 6.6, { color: CREAM, maxW: 8.4 }));
    let x = px0;
    for (const p of panels) {
      const pid = `strip-${i}-${p.key}`, b = { x, y: y + pt0, w: p.w, h: ph }, cx = x + p.w / 2;
      out.push(`<rect x="${r(b.x + 0.45)}" y="${r(b.y + 0.6)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.6" fill="#1a0e04" fill-opacity=".2"/>` +
        `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.6" fill="${L.paper}" stroke="${L.brass[1]}" stroke-width=".7"/>` +
        `<rect x="${r(b.x + 0.9)}" y="${r(b.y + 0.9)}" width="${r(b.w - 1.8)}" height="${r(b.h - 1.8)}" rx="1" fill="none" stroke="${L.brass[2]}" stroke-opacity=".55" stroke-width=".18"/>`);
      // the title with its icon, centred over the cells
      const tw = W(p.title, tpt, { font: 'Alegreya SC', w: 800 }), iw = 4.6, gw = iw + 1.6 + tw, gx = cx - gw / 2, ty = b.y + 1.7 + (TCAP + 0.6) / 2;
      out.push(ico(p.ic, gx + iw / 2, ty, iw, L.tone, `${pid}-icon`));
      html.push(capWord(pid, gx + iw + 1.6 + tw / 2, ty, p.title, TCAP, { color: pal.deep }));
      // the cells, the number over each (6 and 9 underlined: the strip is read from across the table too)
      const n = p.nums.length, c0 = cx - ((n - 1) * CP + C) / 2, cy = b.y + 9.6, ny = b.y + 7.7;
      p.nums.forEach((v, k) => {
        const xx = c0 + k * CP;
        out.push(brassCell(`${pid}-w${v}`, xx, cy, C, id, {}));
        html.push(capWord(pid, xx + C / 2, ny, String(v), TCAP, { color: L.ink }));
        if (v === 6 || v === 9) out.push(`<path d="M${r(xx + C / 2 - 0.9)} ${r(ny + 1.75)}H${r(xx + C / 2 + 0.9)}" stroke="${L.ink}" stroke-width=".3"/>`);
      });
      x += p.w + GAP;
    }
  });
  return { html: `<style>${V2_CSS}</style>${head}<svg class="v2-svg" style="width:210mm;height:297mm" viewBox="0 0 ${Wp} ${Hp}">${out.join('\n')}</svg>${html.join('')}${foot}` };
}
/** the light parchment of the strips: the ground of the holds on sheet 04, page 1 */
const GROUND_LIGHT = '#f8f0dc';

// used by the back «Затонул» v3 (wreck.ts)
export { LOOKS, cellSvg, defsOf, ico, text, type Look };
