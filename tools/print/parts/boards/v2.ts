// 03 — the ship boards, concept B v2 «стол капитана» (boards v2 task): the whole sheet is one engraved sea chart of the
// Caribbean (tools/print/map/chart.ts) with the ship drawn on it; what is read during play lies on plates over the chart:
// paper slips for the tracks, a brass ruler for the counters, a pinned log-book note for the abilities, a nest for the Legend
// card (63 × 88 + 1.5 mm round it). The chart is calmed under every plate. The cells, numbers and words are vector.
// counters 'board' — «Осталось карт» and «Реакций сыграно» on a brass ruler on the board; 'strip' — on a separate strip
// per player (counterStripsPage, sheet 04), the room goes to the ship.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { HERE, ROOT, data, esc, rich, type Ctx, type PageSpec } from '../../kit';
import { BOARD, trackCells, type Ship } from '../../layout';
import { DECK_KEY } from '../../colors';
import { chartPoint, chartSvg, type ChartOpts, type ChartStyle, type Rect } from '../../map/chart';
import { rasterJpeg } from '../../map/raster';
import { icon, iconSvg, TONE, type IconName, type IconTone } from '../icons';
import { basePalette, type Pal, type ShipKey, type TrackKey } from './frame';

export type Counters = 'board' | 'strip';
const require = createRequire(import.meta.url);
const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship(u: string, L: unknown, o: Record<string, unknown>): string; makeLight(l: unknown, cam: { horizon: number }): unknown;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number }; LIGHTS: Record<string, unknown>;
};

// ---- texts (boards.json: frame — the words of concept B, v2 — what is new) ----
interface FrameText {
  tracks: Record<TrackKey, { name: string; note: string; zero?: string; flip?: string; start?: string; max?: string; kraken?: string; spend?: string }>;
  start: string; volley: string[]; effects: string; fires: { title: string; note: string }; underwater: { title: string; note: string }; surfaced: { title: string; note: string };
  abilities: string; once: string; heart: Record<string, string>; plans: string; legend: { title: string; note: string; played: string };
  cards: { title: string }; reactions: { title: string }; strips: { lead: string };
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
/** a rough width of a line of text (mm): the plates are sized with it, so it errs wide */
const tw = (s: string, size: number, k = 0.5) => s.length * pt(size) * k;
const ORDER: TrackKey[] = ['sails', 'souls', 'crew', 'guns', 'hull'];
/** one row from the top of its plate: label baseline, ruler (numbers) baseline, cell top, caption baseline, plate height */
const ROW = { label: 6.4, num: 11.2, cell: 12.8, cap: 29, h: 31 };
const X0 = 13.5, PAD = 2.6;
const LEGEND_NEST = { x: 217, y: 12, w: 66, h: 91 };
const NOTE = { x: 212.5, y: 110.5, w: 74, h: 87.5 };
const ICON_TRACK: Record<TrackKey, IconName> = { sails: 'sails', souls: 'souls', crew: 'crew', guns: 'guns', hull: 'hull' };

// ---- the look of each ship: which part of the chart, how it is kept, the plates and the inks ----
interface Look {
  chart: ChartStyle; center: [number, number]; mmPerDeg: number; tone: IconTone;
  paper: string; paperLine: string; ink: string; soft: string; cell: string; cellDeep: string;
  brass: [string, string, string]; note: string; noteLine: string; pin: string;
  /** the ship on the chart: centre x, waterline y (mm) in 'board' and in 'strip' and its biggest width */
  ship: { board: [number, number, number, number]; strip: [number, number, number, number] };
  extra?: (o: ChartOpts, at: (lon: number, lat: number) => { x: number; y: number }) => Partial<ChartOpts>;
}
const LOOKS: Record<ShipKey, Look> = {
  pearl: {
    chart: 'pearl', center: [-73.55, 21.7], mmPerDeg: 50, tone: TONE.sepia,
    paper: '#f1e4c2', paperLine: '#5a4024', ink: '#2a1c0c', soft: '#4f3d28', cell: '#f7eed6', cellDeep: '#e3d1a6',
    brass: ['#f3d68c', '#c4954a', '#5e4214'], note: '#f4ead0', noteLine: '#b9a47a', pin: '#7a1c14',
    ship: { board: [153, 99, 104, 70], strip: [153, 150, 110, 118] },
    extra: (o, at) => {
      const t = at(-72.8, 20.12);
      return { cross: { x: t.x - 6, y: t.y - 1 }, course: [{ x: 120, y: 111 }, { x: 160, y: 108 }, { x: 205, y: 112 }], note: [{ x: 128, y: 107.5, text: 'здесь Пороху не жалеть', rot: -3, size: 4.2 }] };
    }
  },
  revenge: {
    chart: 'revenge', center: [-75.6, 18.6], mmPerDeg: 40, tone: TONE.red,
    paper: '#f2e2c0', paperLine: '#5a2416', ink: '#2e1a10', soft: '#4f3326', cell: '#f8ecd2', cellDeep: '#e6cca0',
    brass: ['#f3d68c', '#c4954a', '#5e4214'], note: '#f5e8cc', noteLine: '#c4a07a', pin: '#1a1a1a',
    ship: { board: [152, 103, 108, 76], strip: [152, 150, 110, 120] }
  },
  endeavour: {
    chart: 'endeavour', center: [-77.0, 18.1], mmPerDeg: 52, tone: TONE.navy,
    paper: '#f8f1de', paperLine: '#1f2a3a', ink: '#1a2232', soft: '#33405a', cell: '#fbf6e8', cellDeep: '#e6dcc0',
    brass: ['#f6dc94', '#c99a46', '#5e4214'], note: '#fbf6e6', noteLine: '#a8b8cc', pin: '#a8812e',
    ship: { board: [152, 103, 108, 76], strip: [152, 150, 110, 120] }
  },
  dutch: {
    chart: 'dutch', center: [-70.6, 18.2], mmPerDeg: 44, tone: TONE.verdigris,
    paper: '#e9e4c8', paperLine: '#22322a', ink: '#1c2620', soft: '#33443a', cell: '#f0ecd6', cellDeep: '#d4d0b0',
    brass: ['#d8cf98', '#8f8a52', '#3a3a22'], note: '#ecebd4', noteLine: '#9aa890', pin: '#2a3a32',
    ship: { board: [152, 103, 108, 76], strip: [152, 150, 110, 120] }
  }
};

// ---- the layout ----
interface Cell { n: number; x: number; y: number; start: boolean }
interface Row { key: TrackKey; x: number; y: number; w: number; cells: Cell[]; start: number; volley: { x: number; y: number }[] }
interface Plan { rows: Row[]; header: Rect; effects: Rect; fires: Rect; plans: Rect | null; cards: Rect | null; reactions: Rect | null; ship: [number, number, number, number] }
function trackDefs(ship: Ship): { key: TrackKey; cells: number[]; start: number }[] {
  const t: Partial<Record<TrackKey, { key: TrackKey; cells: number[]; start: number }>> = {
    hull: { key: 'hull', cells: trackCells(ship.hull), start: ship.hull },
    sails: { key: 'sails', cells: trackCells(ship.sails), start: ship.sails },
    guns: { key: 'guns', cells: trackCells(ship.guns), start: ship.guns },
    crew: { key: 'crew', cells: trackCells(ship.crew).filter(n => n >= 1), start: ship.crew }
  };
  if (ship.souls != null) t.souls = { key: 'souls', cells: trackCells(ship.souls), start: ship.start_souls ?? 0 };
  return ORDER.map(k => t[k]).filter((x): x is { key: TrackKey; cells: number[]; start: number } => !!x);
}
function layoutV2(ship: Ship, counters: Counters, look: Look): Plan {
  const defs = trackDefs(ship), short = defs.filter(d => d.key !== 'hull'), hull = defs.find(d => d.key === 'hull')!;
  const rows: Row[] = [];
  const mk = (d: { key: TrackKey; cells: number[]; start: number }, y: number): Row => {
    const cells = d.cells.map((n, i) => ({ n, x: X0 + PAD + i * BOARD.pitch, y: y + ROW.cell, start: n === d.start }));
    const volley: { x: number; y: number }[] = [];
    let x1 = cells[cells.length - 1].x + BOARD.cell;
    if (d.key === 'guns') for (let i = 0; i < (ship.souls != null ? 2 : 1); i++) { const vx = x1 + (i ? 9 : 6); volley.push({ x: vx, y: y + ROW.cell }); x1 = vx + BOARD.cell; }
    const T = TXT.tracks[d.key], label = 9 + tw(T.name, 14, 0.66) + (T.note ? 3 + tw(T.note, 9, 0.46) : 0);
    return { key: d.key, x: X0, y, w: Math.max(x1 - X0 + PAD, label + PAD), cells, start: d.start, volley };
  };
  const top = 36, hullY = 166.5, gap = short.length > 3 ? 0 : 1;
  short.forEach((d, i) => rows.push(mk(d, top + i * (ROW.h + gap))));
  rows.push(mk(hull, hullY));
  const lastShort = rows[short.length - 1], firesY = lastShort.y + ROW.h + 2;
  return {
    rows,
    header: { x: 12, y: 11.5, w: 140, h: 22 },
    effects: { x: 154, y: 12.5, w: Math.min(60, 22 + tw(TXT.effects, 8.5, 0.5)), h: 12 },
    fires: { x: X0, y: firesY, w: 3 * BOARD.fireSlot + 2 * 3 + 2 * PAD, h: 8.8 + BOARD.fireSlot + 2.2 },
    plans: ship.code === 'Ж' ? { x: NOTE.x + 2, y: NOTE.y + NOTE.h - 14, w: NOTE.w - 4, h: 11 } : null,
    cards: counters === 'board' ? { x: 99, y: 116.5, w: 110, h: 27.5 } : null,
    reactions: counters === 'board' ? { x: 99, y: 146, w: 110, h: 18.5 } : null,
    ship: counters === 'board' ? look.ship.board : look.ship.strip
  };
}

// ---- SVG pieces ----
let UID = 0;
interface TO { font?: string; w?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; ls?: string; italic?: boolean; deco?: string; op?: number }
const text = (x: number, y: number, s: string, size: number, o: TO = {}) =>
  `<text x="${r(x)}" y="${r(y)}" font-family="${o.font ?? 'Alegreya Sans'}" font-weight="${o.w ?? 500}"${o.italic ? ' font-style="italic"' : ''} font-size="${r(pt(size))}" fill="${o.color ?? '#2a1c0c'}"${o.op != null ? ` fill-opacity="${o.op}"` : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.deco ? ` text-decoration="${o.deco}"` : ''}>${esc(s)}</text>`;
const under69 = (n: number) => n === 6 || n === 9 ? 'underline' : undefined;

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
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');

/** a slip of paper pasted on the chart: a soft shadow, a double ink rule, corners a little worn */
function slip(b: Rect, id: string, L: Look, o: { rule?: boolean } = {}): string {
  return `<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.7)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="#1a0e04" fill-opacity=".28"/>` +
    `<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="url(#${id}paper)" stroke="${L.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    (o.rule === false ? '' : `<rect x="${r(b.x + 1.1)}" y="${r(b.y + 1.1)}" width="${r(b.w - 2.2)}" height="${r(b.h - 2.2)}" rx=".8" fill="none" stroke="${L.paperLine}" stroke-opacity=".7" stroke-width=".18"/>`);
}
/** a cell: a brass rim round a recessed well of paper, its number large and pale inside (an 11 mm marker covers it; the
 *  number on the ruler above stays in sight) */
function cellSvg(x: number, y: number, n: number | null, id: string, L: Look, o: { start?: boolean; startColor?: string; icon?: IconName; tint?: string } = {}): string {
  const c = BOARD.cell, out = [`<rect x="${r(x + 0.35)}" y="${r(y + 0.5)}" width="${c}" height="${c}" rx="1.8" fill="#1a0e04" fill-opacity=".3"/>`,
    `<rect x="${r(x)}" y="${r(y)}" width="${c}" height="${c}" rx="1.8" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".22"/>`,
    `<rect x="${r(x + 0.85)}" y="${r(y + 0.85)}" width="${r(c - 1.7)}" height="${r(c - 1.7)}" rx="1.1" fill="${o.tint ?? `url(#${id}well)`}" stroke="${L.brass[2]}" stroke-width=".2"/>`];
  if (o.start) out.push(`<rect x="${r(x + 0.3)}" y="${r(y + 0.3)}" width="${r(c - 0.6)}" height="${r(c - 0.6)}" rx="1.6" fill="none" stroke="${o.startColor ?? L.ink}" stroke-width=".7"/>`);
  if (o.icon) out.push(`<g opacity=".32">${icon(o.icon, x + c / 2, y + c / 2, 8.4, L.tone)}</g>`);
  if (n != null) out.push(text(x + c / 2 + 0.22, y + c / 2 + 2.85 + 0.22, String(n), 22, { font: 'Alegreya', w: 800, color: '#ffffff', anchor: 'middle', op: 0.55 }) + text(x + c / 2, y + c / 2 + 2.85, String(n), 22, { font: 'Alegreya', w: 800, color: L.ink, anchor: 'middle', op: 0.2 }));
  return out.join('');
}
/** Hull 0: a hole torn through the chart — dark water under ragged paper — and «тонет» on it */
function holeSvg(x: number, y: number, id: string, word: string): string {
  const c = BOARD.cell, cx = x + c / 2, cy = y + c / 2, pts: string[] = [];
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, R = 5.5 + (i % 3 === 0 ? 0.9 : i % 2 ? -0.5 : 0.3); pts.push(`${r(cx + R * Math.cos(a) * 1.06)} ${r(cy + R * Math.sin(a))}`); }
  return `<path d="M${pts.join('L')}Z" fill="#d9c49a" stroke="#6b4a22" stroke-width=".35" transform="translate(.4 .4)" opacity=".7"/><path d="M${pts.join('L')}Z" fill="url(#${id}hole)" stroke="#f3e6c4" stroke-width=".55" stroke-linejoin="round"/>` +
    `<path d="M${r(cx - 3.6)} ${r(cy + 2.6)}q1.2 -.8 2.4 0t2.4 0t2.4 0" fill="none" stroke="#6f9aa6" stroke-width=".3" stroke-opacity=".7"/>` +
    text(cx, cy + 1.1, word, 8.5, { w: 800, color: '#f6ead0', anchor: 'middle' });
}

/** a row: the slip, the icon and the name, the ruler with the numbers (the start one with a star), the cells, the caption */
function rowSvg(rw: Row, id: string, L: Look, pal: Pal, ship: Ship, powderIcon: boolean): string {
  const T = TXT.tracks[rw.key], out: string[] = [], c = BOARD.cell, souls = rw.key === 'souls';
  out.push(slip({ x: rw.x, y: rw.y, w: rw.w, h: ROW.h }, id, L));
  out.push(icon(ICON_TRACK[rw.key], rw.x + PAD + 3.6, rw.y + ROW.label - 1.9, 7.4, L.tone));
  out.push(text(rw.x + PAD + 8.6, rw.y + ROW.label, T.name, 14, { font: 'Alegreya SC', w: 800, color: pal.deep, ls: '.03em' }));
  if (T.note) out.push(text(rw.x + PAD + 8.6 + tw(T.name, 14, 0.66) + 2.4, rw.y + ROW.label, T.note, 9, { font: 'Alegreya', italic: true, color: L.soft }));
  // the ruler: a hairline over the cells, a tick and the number at each cell; the start: a star before its number
  const first = rw.cells[0], last = rw.cells[rw.cells.length - 1], ry = rw.y + ROW.num + 0.9;
  out.push(`<path d="M${r(first.x + c / 2)} ${r(ry)}H${r(last.x + c / 2)}" stroke="${L.ink}" stroke-width=".2" stroke-opacity=".6"/>`);
  for (const cl of rw.cells) {
    out.push(`<path d="M${r(cl.x + c / 2)} ${r(ry - 0.7)}V${r(ry + 0.7)}" stroke="${L.ink}" stroke-width=".25"/>`);
    out.push(text(cl.x + c / 2, rw.y + ROW.num - 0.2, String(cl.n), 9, { w: 800, color: cl.start ? pal.deep : L.ink, anchor: 'middle', deco: under69(cl.n) }));
    if (cl.start && !souls) out.push(star(cl.x + c / 2 - 3.6, rw.y + ROW.num - 1.25, 1.35, pal.deep));
    const sink = rw.key === 'hull' && cl.n === 0;
    out.push(sink ? cellSvg(cl.x, cl.y, null, id, L) + holeSvg(cl.x, cl.y, id, T.zero ?? '') : cellSvg(cl.x, cl.y, cl.n, id, L, { start: cl.start, startColor: pal.deep, tint: souls && cl.n > rw.start ? mix(L.cell, pal.ship, 0.08 + 0.05 * (cl.n - rw.start)) : undefined }));
  }
  // the Volley cells: «Залп дан · 1 [keg] Порох» above, the keg faint inside
  rw.volley.forEach((v, i) => {
    const cap = fill(TXT.volley[i], { cost: Number(ship.volleyCost), coin: '' }).replace(/\s+/g, ' ').trim();
    const [a, b = ''] = cap.split(/(?<=\d)\s/);
    if (i === 0 && powderIcon) {
      const wa = tw(a, 8.5, 0.5), wb = tw(b, 8.5, 0.5), tot = wa + 4 + wb, x0 = v.x + c / 2 - tot / 2;
      out.push(text(x0, rw.y + ROW.num - 0.2, a, 8.5, { w: 800, color: pal.deep }) + icon('powder', x0 + wa + 2, rw.y + ROW.num - 1.4, 3.6, L.tone) + text(x0 + wa + 4, rw.y + ROW.num - 0.2, b, 8.5, { w: 800, color: pal.deep }));
    } else out.push(text(v.x + c / 2, rw.y + ROW.num - 0.2, cap, 8.5, { w: 800, color: pal.deep, anchor: 'middle' }));
    out.push(cellSvg(v.x, v.y, null, id, L, { icon: 'powder' }));
  });
  // the caption line: the threshold under the lowest cell (the Hull: «переверните планшет»)
  const capY = rw.y + ROW.cap, zero = rw.key === 'hull' ? T.flip : souls ? undefined : T.zero;
  if (zero) out.push(text(first.x + 0.3, capY, zero, 8, { w: 800, italic: false, color: rw.key === 'hull' ? '#7e2614' : pal.deep }));
  if (souls && T.max) out.push(text(last.x + c + 2.4, rw.y + ROW.cell + c / 2 + 1, fill(T.max, { n: last.n }), 9, { w: 700, color: L.soft }));
  // the key of the star, once: on the Hull's caption line under its start cell
  if (rw.key === 'hull') { const s = rw.cells.find(cl => cl.start)!; out.push(star(s.x + c - tw(TXT.start, 7.5, 0.47) - 3.2, capY - 1.05, 1.2, pal.deep) + text(s.x + c, capY, TXT.start, 7.5, { italic: true, font: 'Alegreya', color: L.soft, anchor: 'end' })); }
  return out.join('');
}
function star(cx: number, cy: number, R: number, color: string): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.42 : R; p.push(`${r(cx + q * Math.cos(a))},${r(cy + q * Math.sin(a))}`); }
  return `<polygon points="${p.join(' ')}" fill="${color}"/>`;
}

/** the header: a cartouche with the medallion, the name, the captain, the motto and the side */
function headerSvg(b: Rect, ship: Ship, pal: Pal, L: Look): string {
  const { x, y, w, h } = b, out: string[] = [];
  out.push(`<path d="M${x + 5} ${y}H${x + w - 5}C${x + w - 1.5} ${y} ${x + w} ${y + 2.4} ${x + w + 2.6} ${y + 1.6}C${x + w + 0.8} ${y + h / 2} ${x + w + 0.8} ${y + h / 2} ${x + w + 2.6} ${y + h - 1.6}C${x + w} ${y + h - 2.4} ${x + w - 1.5} ${y + h} ${x + w - 5} ${y + h}H${x + 5}C${x + 1.5} ${y + h} ${x} ${y + h - 2.4} ${x - 2.6} ${y + h - 1.6}C${x - 0.8} ${y + h / 2} ${x - 0.8} ${y + h / 2} ${x - 2.6} ${y + 1.6}C${x} ${y + 2.4} ${x + 1.5} ${y} ${x + 5} ${y}Z" fill="#1a0e04" fill-opacity=".28" transform="translate(.5 .7)"/>`);
  out.push(`<path d="M${x + 5} ${y}H${x + w - 5}C${x + w - 1.5} ${y} ${x + w} ${y + 2.4} ${x + w + 2.6} ${y + 1.6}C${x + w + 0.8} ${y + h / 2} ${x + w + 0.8} ${y + h / 2} ${x + w + 2.6} ${y + h - 1.6}C${x + w} ${y + h - 2.4} ${x + w - 1.5} ${y + h} ${x + w - 5} ${y + h}H${x + 5}C${x + 1.5} ${y + h} ${x} ${y + h - 2.4} ${x - 2.6} ${y + h - 1.6}C${x - 0.8} ${y + h / 2} ${x - 0.8} ${y + h / 2} ${x - 2.6} ${y + 1.6}C${x} ${y + 2.4} ${x + 1.5} ${y} ${x + 5} ${y}Z" fill="${L.paper}" stroke="${L.paperLine}" stroke-width=".4"/>`);
  out.push(`<rect x="${x + 2}" y="${y + 1.8}" width="${w - 4}" height="${h - 3.6}" rx="1" fill="none" stroke="${L.paperLine}" stroke-width=".18" stroke-opacity=".8"/>`);
  const mx = x + 11, my = y + h / 2;
  out.push(`<circle cx="${mx}" cy="${my}" r="8.6" fill="url(#${UIDS.cur}brh)" stroke="${L.brass[2]}" stroke-width=".3"/><circle cx="${mx}" cy="${my}" r="7.2" fill="${pal.solid}"/><circle cx="${mx}" cy="${my}" r="6.4" fill="none" stroke="#fff8e6" stroke-width=".22" stroke-opacity=".7"/>`);
  out.push(text(mx, my + pt(20) * 0.33, ship.code, 20, { font: 'Alegreya SC', w: 800, color: '#fff8e6', anchor: 'middle' }));
  out.push(text(x + 22.5, y + 9.4, ship.name, 25, { font: 'Alegreya', w: 800, color: pal.deep }));
  out.push(text(x + 22.5, y + 15, ship.captain, 11.5, { font: 'Alegreya', w: 500, italic: true, color: L.ink }));
  out.push(text(x + 22.5, y + 19.6, ship.motto, 9.5, { font: 'Alegreya', w: 400, italic: true, color: L.soft }));
  const sw = tw(ship.side, 8, 0.72) + 4, sx = x + w - 3 - sw;
  out.push(`<path d="M${r(sx)} ${y + 3.4}h${r(sw)}l-1.4 2.3l1.4 2.3h${r(-sw)}l1.4 -2.3z" fill="${pal.solid}"/>` + text(sx + sw / 2, y + 7.1, ship.side, 8, { w: 800, color: '#fff8e6', anchor: 'middle', ls: '.14em' }));
  return out.join('');
}
const UIDS = { cur: '' };

/** a pointer to the sheet's edge, written in ink: an icon, the words, an arrow */
function pointerSvg(b: Rect, words: string, ic: IconName, dir: 'up' | 'down' | 'right', id: string, L: Look, pal: Pal): string {
  const out = [slip(b, id, L, { rule: false })], ax = dir === 'right' ? b.x + b.w - 6 : b.x + 4.6, ay = b.y + b.h / 2;
  out.push(icon(ic, b.x + (dir === 'right' ? 4.4 : 11.2), ay, 6.8, L.tone));
  out.push(text(b.x + (dir === 'right' ? 9 : 15.8), ay + 1.2, words, 8.5, { w: 800, color: pal.deep }));
  const A = (x1: number, y1: number, x2: number, y2: number) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 1.8; return `<path d="M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}" stroke="${pal.deep}" stroke-width=".55" stroke-linecap="round"/><path d="M${r(x2)} ${r(y2)}L${r(x2 - h * Math.cos(a - 0.45))} ${r(y2 - h * Math.sin(a - 0.45))}M${r(x2)} ${r(y2)}L${r(x2 - h * Math.cos(a + 0.45))} ${r(y2 - h * Math.sin(a + 0.45))}" stroke="${pal.deep}" stroke-width=".55" stroke-linecap="round"/>`; };
  out.push(dir === 'up' ? A(ax, b.y + b.h - 2.4, ax, b.y + 1.8) : dir === 'down' ? A(ax, b.y + 2.4, ax, b.y + b.h - 1.8) : A(b.x + b.w - 10, ay, b.x + b.w - 2, ay));
  return out.join('');
}
/** the Fires: three 23 mm places, each a scorched recess with a faint flame */
function firesSvg(b: Rect, id: string, L: Look, pal: Pal): string {
  const out = [slip(b, id, L)], s = BOARD.fireSlot, y0 = b.y + 8.8;
  out.push(icon('fire', b.x + PAD + 3.6, b.y + 4.2, 6.4, L.tone) + text(b.x + PAD + 8.6, b.y + 6, fill(TXT.fires.title, { n: RULES.maxFires }), 11, { font: 'Alegreya SC', w: 800, color: pal.deep, ls: '.03em' }));
  for (let i = 0; i < RULES.maxFires; i++) {
    const x = b.x + PAD + i * (s + 3);
    out.push(`<rect x="${r(x + 0.4)}" y="${r(y0 + 0.5)}" width="${s}" height="${s}" rx="2.2" fill="#1a0e04" fill-opacity=".3"/><rect x="${r(x)}" y="${r(y0)}" width="${s}" height="${s}" rx="2.2" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".22"/>`);
    out.push(`<rect x="${r(x + 1)}" y="${r(y0 + 1)}" width="${r(s - 2)}" height="${r(s - 2)}" rx="1.4" fill="${mix(L.cell, '#c4602f', 0.1)}" stroke="${L.brass[2]}" stroke-width=".2"/>`);
    out.push(`<g opacity=".38">${icon('fire', x + s / 2, y0 + s / 2, 15, L.tone)}</g>`);
  }
  return out.join('');
}
/** the counters on a brass ruler: windows cut through the brass, the number engraved over each */
function rulerSvg(b: Rect, title: string, ic: IconName, nums: number[], labelLeft: boolean, id: string, L: Look): string {
  const [bl, bm, bd] = L.brass, out: string[] = [], CP = 14, c = BOARD.cell;
  out.push(`<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.7)}" width="${b.w}" height="${b.h}" rx="1.6" fill="#1a0e04" fill-opacity=".35"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="1.6" fill="url(#${id}br)" stroke="${bd}" stroke-width=".3"/>`);
  out.push(`<rect x="${r(b.x + 1)}" y="${r(b.y + 1)}" width="${r(b.w - 2)}" height="${r(b.h - 2)}" rx="1" fill="none" stroke="${bd}" stroke-width=".2" stroke-opacity=".8"/><rect x="${r(b.x + 1.25)}" y="${r(b.y + 1.25)}" width="${r(b.w - 2.5)}" height="${r(b.h - 2.5)}" rx=".9" fill="none" stroke="${bl}" stroke-width=".15" stroke-opacity=".9"/>`);
  for (const sx of [b.x + 2.6, b.x + b.w - 2.6]) out.push(`<circle cx="${r(sx)}" cy="${r(b.y + b.h / 2)}" r=".9" fill="${bl}" stroke="${bd}" stroke-width=".2"/><path d="M${r(sx - 0.6)} ${r(b.y + b.h / 2 - 0.3)}l1.2 .6" stroke="${bd}" stroke-width=".22"/>`);
  const n = nums.length, x0 = b.x + b.w - 5 - (n - 1) * CP - c, cy = b.y + b.h - 2.6 - c, ink = '#2a1a08';
  const ty = labelLeft ? b.y + b.h / 2 + 1.4 : b.y + 6.2, tx = b.x + 5.6 + 6.6;
  out.push(icon(ic, b.x + 5.6 + 2.4, ty - 1.6, 6.2, { ...L.tone, ink, paper: bm }));
  if (labelLeft) { const [a, bb = ''] = title.split(' '); out.push(text(tx, ty - 2.4, a, 11, { font: 'Alegreya SC', w: 800, color: ink }) + text(tx, ty + 2, bb, 11, { font: 'Alegreya SC', w: 800, color: ink })); }
  else out.push(text(tx, ty, title, 11, { font: 'Alegreya SC', w: 800, color: ink }));
  nums.forEach((v, i) => {
    const x = x0 + i * CP;
    out.push(text(x + c / 2 + 0.15, cy - 1.15 + 0.15, String(v), 9.5, { w: 800, color: bl, anchor: 'middle', deco: under69(v) }) + text(x + c / 2, cy - 1.15, String(v), 9.5, { w: 800, color: ink, anchor: 'middle', deco: under69(v) }));
    // a window: dark bevel above-left, light below-right, the paper of the chart inside
    out.push(`<rect x="${r(x)}" y="${r(cy)}" width="${c}" height="${c}" rx="1.3" fill="${bd}"/><rect x="${r(x + 0.5)}" y="${r(cy + 0.5)}" width="${r(c - 0.5)}" height="${r(c - 0.5)}" rx="1.1" fill="${bl}"/><rect x="${r(x + 0.5)}" y="${r(cy + 0.5)}" width="${r(c - 1)}" height="${r(c - 1)}" rx="1" fill="url(#${id}well)"/>`);
    out.push(text(x + c / 2, cy + c / 2 + 2.6, String(v), 20, { font: 'Alegreya', w: 800, color: L.ink, anchor: 'middle', op: 0.18 }));
  });
  return out.join('');
}
/** the nest of the Legend card: brass photo-corners in the 1.5 mm margin; under the card, what shows once it is played */
function nestSvg(b: Rect, id: string, L: Look, pal: Pal, legendName: string): string {
  const out: string[] = [], m = 1.5, cw = b.w - 2 * m, ch = b.h - 2 * m, cx = b.x + b.w / 2;
  out.push(`<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.7)}" width="${b.w}" height="${b.h}" rx="2.6" fill="#1a0e04" fill-opacity=".3"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2.6" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".3"/>`);
  out.push(`<rect x="${r(b.x + m)}" y="${r(b.y + m)}" width="${r(cw)}" height="${r(ch)}" rx="2.4" fill="${mix(L.paper, '#5a4024', 0.1)}" stroke="${L.brass[2]}" stroke-width=".3"/>`);
  out.push(`<rect x="${r(b.x + m + 3)}" y="${r(b.y + m + 3)}" width="${r(cw - 6)}" height="${r(ch - 6)}" rx="1.4" fill="none" stroke="${L.paperLine}" stroke-width=".3" stroke-dasharray="1.6 1.1" stroke-opacity=".7"/>`);
  out.push(`<g opacity=".45">${icon('legend', cx, b.y + b.h * 0.4, 26, L.tone)}</g>`);
  out.push(text(cx, b.y + b.h * 0.64, TXT.legend.played, 13, { font: 'Alegreya SC', w: 800, color: pal.deep, anchor: 'middle', ls: '.03em' }));
  out.push(text(cx, b.y + b.h * 0.64 + 5.4, `«${legendName}»`, 10, { font: 'Alegreya', w: 500, italic: true, color: L.soft, anchor: 'middle' }));
  // the photo-corners: in the margin and 4 mm over the card's corners
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
    const X = sx ? b.x + b.w : b.x, Y = sy ? b.y + b.h : b.y, dx = sx ? -1 : 1, dy = sy ? -1 : 1, a = 7.5;
    out.push(`<path d="M${r(X)} ${r(Y)}h${r(dx * a)}L${r(X)} ${r(Y + dy * a)}Z" fill="url(#${id}br)" stroke="${L.brass[2]}" stroke-width=".25"/>`);
  }
  return out.join('');
}
/** the tag over the nest: «Легенда · один раз за игру» */
const nestTag = (b: Rect, pal: Pal, L: Look) => {
  const s = `${TXT.legend.title} · ${TXT.legend.note.split('·').pop()!.trim()}`, w = tw(s, 8, 0.48) + 6, x = b.x + b.w / 2 - w / 2, y = b.y + b.h + 1.2;
  return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="4.6" rx="1" fill="${L.paper}" stroke="${L.paperLine}" stroke-width=".2"/>` + text(b.x + b.w / 2, y + 3.3, s, 8, { w: 800, color: pal.deep, anchor: 'middle' });
};
/** the abilities: a page of the ship's log pinned to the chart (the paper — SVG; the words — HTML) */
function noteSvg(b: Rect, L: Look): string {
  const { x, y, w, h } = b, pts: string[] = [];
  for (let i = 0; i <= 24; i++) { const xx = x + w - (w * i) / 24; pts.push(`${r(xx)} ${r(y + h - (i % 2 ? 0.7 : 0) - (i % 5 === 0 ? 0.4 : 0))}`); }
  const paper = `M${x} ${y}H${x + w}V${y + h}L${pts.join('L')}Z`;
  let lines = '';
  for (let yy = y + 11.4; yy < y + h - 2; yy += 3.95) lines += `M${x + 3} ${r(yy)}H${x + w - 3}`;
  return `<path d="${paper}" fill="#1a0e04" fill-opacity=".3" transform="translate(.7 .9)"/><path d="${paper}" fill="${L.note}" stroke="${L.paperLine}" stroke-opacity=".5" stroke-width=".2"/>` +
    `<path d="${lines}" stroke="${L.noteLine}" stroke-width=".15" stroke-opacity=".7"/><path d="M${x + 9} ${y}V${y + h}" stroke="#b0503a" stroke-width=".2" stroke-opacity=".55"/>` +
    `<circle cx="${r(x + w / 2)}" cy="${r(y + 2.2)}" r="1.5" fill="${L.pin}"/><circle cx="${r(x + w / 2 - 0.45)}" cy="${r(y + 1.8)}" r=".45" fill="#fff" fill-opacity=".5"/>`;
}

// ---- the chart under it all ----
/** the ship on the chart: the kit ship, a pool of calm paper under it, engraved swell along its waterline */
function shipOnChart(kind: string, cx: number, wy: number, maxW: number, maxH: number, L: Look): string {
  const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), s = Math.min(maxW / b.w, maxH / b.h);
  const body = K.ship('v2' + kind, K.makeLight(K.LIGHTS.endeavour, { horizon: wy - 4 }), { kind, x: cx - s * (b.x0 + b.x1) / 2, y: wy, scale: s });
  const w = b.w * s, h = b.h * s, ink = L.ink;
  let swell = '';
  for (let i = 0; i < 4; i++) { const y = wy + 0.8 + i * 1.5, x0 = cx - w * (0.62 - i * 0.07), x1 = cx + w * (0.62 - i * 0.07); let d = `M${r(x0)} ${r(y)}`; for (let x = x0; x < x1; x += 3) d += `q.75 -.55 1.5 0t1.5 0`; swell += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${r(0.28 - i * 0.04)}" stroke-opacity="${r(0.8 - i * 0.16)}"/>`; }
  return `<defs><filter id="v2pool${kind}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter></defs><ellipse cx="${r(cx)}" cy="${r(wy - h * 0.4)}" rx="${r(w * 0.62)}" ry="${r(h * 0.62)}" fill="#f6ecd0" opacity=".42" filter="url(#v2pool${kind})"/>${body}${swell}`;
}

/** One face of a board, concept B v2. */
export async function boardV2(ctx: Ctx, ship: Ship, counters: Counters): Promise<{ html: string; css: string }> {
  const key = DECK_KEY[ship.code] as ShipKey, L = LOOKS[key], pal = basePalette(ship.color), id = `v2${++UID}`, plan = layoutV2(ship, counters, L);
  UIDS.cur = id;
  const legend = data.legends[ship.code];
  // the plates the chart is calmed under
  const calm: Rect[] = [plan.header, LEGEND_NEST, NOTE, plan.effects, plan.fires, ...plan.rows.map(rw => ({ x: rw.x, y: rw.y, w: rw.w, h: ROW.h })), ...[plan.plans, plan.cards, plan.reactions].filter((b): b is Rect => !!b)];
  const view = { w: PAGE.w, h: PAGE.h, center: L.center, mmPerDeg: L.mmPerDeg }, at = (lon: number, lat: number) => chartPoint(view, lon, lat);
  const [sx, sy, sw, sh] = plan.ship, kind = key === 'dutch' ? 'dutch' : key;
  const base: ChartOpts = { style: L.chart, ...view, inset: 3.2, seed: 5 + ship.code.charCodeAt(0) % 17, calm, roses: [{ x: 108, y: 44, r: 11 }], folds: { x: [PAGE.w / 2 + 12], y: [PAGE.h / 2 + 6] } };
  const opts: ChartOpts = { ...base, ...(L.extra ? L.extra(base, at) : {}) };
  let svgChart = chartSvg(opts);
  svgChart = svgChart.replace(/<\/svg>$/, shipOnChart(kind, sx, sy, sw, sh, L) + '</svg>');
  const jpg = await rasterJpeg(ctx.browser, `board2-${key}-${counters}`, svgChart, PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);

  const svg: string[] = [defsOf(id, L)];
  svg.push(`<image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>`);
  svg.push(headerSvg(plan.header, ship, pal, L));
  svg.push(pointerSvg(plan.effects, TXT.effects, 'effects', 'up', id, L, pal));

  for (const rw of plan.rows) svg.push(rowSvg(rw, id, L, pal, ship, true));
  svg.push(firesSvg(plan.fires, id, L, pal));
  if (plan.cards) svg.push(rulerSvg(plan.cards, TXT.cards.title, 'cards', [6, 5, 4, 3, 2, 1, 0], false, id, L));
  if (plan.reactions) svg.push(rulerSvg(plan.reactions, TXT.reactions.title, 'reaction', [0, 1, 2, 3], true, id, L));
  svg.push(nestSvg(LEGEND_NEST, id, L, pal, legend.name), nestTag(LEGEND_NEST, pal, L));
  svg.push(noteSvg(NOTE, L));
  if (plan.plans) svg.push(pointerSvg(plan.plans, fill(TXT.plans, { n: RULES.plansMax }), 'plan', 'right', id, L, pal));

  // the abilities in the log: the words in HTML
  const ab = ship.abilities.map(a => { const once = /раз в ход/i.test(a.text); return `<div class="v2-an"><span>${esc(a.name)}</span>${once ? `<i>${iconSvg('once', 5, L.tone)}${esc(TXT.once)}</i>` : ''}</div><div class="v2-p">${richNb(a.text)}</div>${once ? `<div class="v2-tick">${onceCell(L)}</div>` : ''}`; }).join('');
  const heart = TXT.heart[ship.code] ? `<div class="v2-p v2-heart">${richNb(TXT.heart[ship.code])}</div>` : '';
  const html = `<div class="v2-abs v2-log" style="left:${NOTE.x + 10.4}mm;top:${NOTE.y + 4.6}mm;width:${NOTE.w - 13}mm;height:${NOTE.h - 7 - (plan.plans ? 15 : 0)}mm;--c:${pal.deep};--ink:${L.ink};--soft:${L.soft}"><div class="v2-h">${esc(TXT.abilities)}</div>${ab}${heart}</div>`;
  return { html: `<div class="v2 v2-${key}"><svg class="v2-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${svg.join('\n')}</svg>\n${html}</div>`, css: '' };
}
/** the «раз в ход» cell beside an ability: a 13 mm cell like the tracks' */
const onceCell = (L: Look) => `<svg viewBox="0 0 13 13" style="width:13mm;height:13mm"><rect x=".2" y=".2" width="12.6" height="12.6" rx="1.8" fill="${L.brass[1]}" stroke="${L.brass[2]}" stroke-width=".25"/><rect x="1" y="1" width="11" height="11" rx="1.1" fill="${L.cell}" stroke="${L.brass[2]}" stroke-width=".2"/></svg>`;

export const V2_CSS = `
.v2{position:absolute;inset:0}
.v2-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.v2-abs{position:absolute}
.v2-log{font:500 9.4pt/3.95mm Alegreya,serif;color:var(--ink);overflow:hidden}
.v2-h{font:italic 800 12pt/1.1 Alegreya,serif;color:var(--c);margin-bottom:1.4mm}
.v2-an{display:flex;align-items:center;gap:1.4mm;font:800 10pt/3.95mm 'Alegreya SC',serif;letter-spacing:.04em;color:var(--c)}
.v2-an span{flex:1}
.v2-an i{display:flex;align-items:center;gap:.8mm;font:italic 500 9pt/1 Alegreya,serif;letter-spacing:0;color:var(--soft)}
.v2-p{margin:0 0 2.6mm}
.v2-p b{font-weight:800}
.v2-tick{margin:-3mm 0 1mm}
.v2-heart{border-top:.2mm solid var(--soft);padding-top:1mm}
`;

/** Sheet 04 with counters 'strip' (portrait like the rest of 04): four strips, one per ship, cut along the dashed lines
 *  (a runner of the same size can replace one later): the letter, «Осталось карт» 6…0, «Реакций сыграно» 0…3. */
export const STRIP = { w: 190, h: 32, gap: 8 };
export function counterStripsPage(): PageSpec {
  const W = 210, H = 297, x0 = (W - STRIP.w) / 2, y0 = 40, out: string[] = [];
  out.push(text(x0, 22, `${TXT.cards.title} · ${TXT.reactions.title}`, 20, { font: 'Alegreya SC', w: 800 }) + text(x0, 30, TXT.strips.lead, 10, { font: 'Alegreya', italic: true, color: '#4a3a26' }));
  data.ships.forEach((ship, i) => {
    const key = DECK_KEY[ship.code] as ShipKey, L = LOOKS[key], pal = basePalette(ship.color), id = `v2s${i}`, y = y0 + i * (STRIP.h + STRIP.gap);
    out.push(defsOf(id, L));
    out.push(`<rect x="${x0}" y="${y}" width="${STRIP.w}" height="${STRIP.h}" fill="${L.paper}" stroke="#8c8c8c" stroke-width=".25" stroke-dasharray="2 1.4"/>`);
    out.push(`<circle cx="${x0 + 9}" cy="${y + STRIP.h / 2}" r="6.8" fill="url(#${id}brh)"/><circle cx="${x0 + 9}" cy="${y + STRIP.h / 2}" r="5.6" fill="${pal.solid}"/>` + text(x0 + 9, y + STRIP.h / 2 + pt(16) * 0.33, ship.code, 16, { font: 'Alegreya SC', w: 800, color: '#fff8e6', anchor: 'middle' }));
    out.push(rulerSvg({ x: x0 + 18, y: y + 1.5, w: 105, h: STRIP.h - 3 }, TXT.cards.title, 'cards', [6, 5, 4, 3, 2, 1, 0], false, id, L));
    out.push(rulerSvg({ x: x0 + 125, y: y + 1.5, w: 63.5, h: STRIP.h - 3 }, TXT.reactions.title, 'reaction', [0, 1, 2, 3], false, id, L));
  });
  return { html: `<style>${V2_CSS}</style><svg class="v2-svg" style="width:210mm;height:297mm" viewBox="0 0 ${W} ${H}">${out.join('\n')}</svg>` };
}
