// The engraved sea chart of the Caribbean under the boards and the centre of the table (boards v2, «КАРТА — ГЛАВНОЕ»).
// chartSvg() draws a part of tools/print/map/caribbean.json into a box of w × h mm as one SVG (mm units) in the manner of
// an 18th-century copper-plate chart: water-lines along the coasts fading out to sea, hills with hatched shade, stippled
// shoals, soundings, rhumb lines from wind roses, period lettering with the big Russian names, a scale of leagues, little
// ships and a sea monster, the captain's ink notes, and the life of the sheet (torn edges, folds, stains, wear, vignette).
// It is rasterised once (chartJpeg → a JPEG in out/print/cache/art) and the board's plates, cells and words are vector over it.
// Style per ship — one chart, different keeping: pearl (old, worn, charcoal notes), revenge (burnt edges, red ink),
// endeavour (a clean Admiralty engraving, blue waters, gilt rule), dutch (long in the sea: tide marks, green, barnacles).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { centerFor, project } from './proj';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(fs.readFileSync(path.join(HERE, 'caribbean.json'), 'utf8')) as { w: number; h: number; land: number[][] };
interface Label { kind: 'old' | 'sea' | 'town' | 'small'; text: string; lon: number; lat: number; to?: [number, number]; dx?: number; dy?: number }
const TXT = JSON.parse(fs.readFileSync(path.join(HERE, '../text/map.json'), 'utf8')) as { labels: Label[]; title: string; scale: string; notes: Record<string, string[]> };

export type ChartStyle = 'pearl' | 'revenge' | 'endeavour' | 'dutch' | 'plain';
export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export interface ChartOpts {
  style: ChartStyle;
  /** the box, mm */
  w: number; h: number;
  /** the part of the chart: its centre (lon, lat) and how many mm one degree of longitude takes */
  center: [number, number]; mmPerDeg: number;
  /** instead of centre: put the place (lon, lat) at the point (x, y) mm of the box */
  anchor?: { lon: number; lat: number; x: number; y: number };
  /** a label moved to a point of the box (mm) where it shows between the plates */
  labelsAt?: Record<string, Pt>;
  /** more rects the lettering keeps clear of (the ship drawn over the chart) */
  avoid?: Rect[];
  seed?: number;
  /** where the board lays its plates: the chart is calmed under them (paler, fewer lines) */
  calm?: Rect[];
  /** the sheet lies on a table: its torn edge this far inside the box (0 — the chart fills the box, no edge) */
  inset?: number;
  /** the wind roses (mm); the first is large, the others small */
  roses?: { x: number; y: number; r: number }[];
  /** little ships and a monster (mm, scale 1 ≈ 10 mm long) */
  ships?: { x: number; y: number; s: number; flip?: boolean }[];
  serpent?: { x: number; y: number; s: number; flip?: boolean };
  whale?: { x: number; y: number; s: number; flip?: boolean };
  /** the captain's notes: a course (mm points), a cross, words along the course */
  course?: Pt[]; cross?: Pt; note?: { x: number; y: number; text: string; rot?: number; size?: number }[];
  /** a cartouche with the title (the stand-alone chart) and a scale of leagues */
  cartouche?: Rect; scale?: { x: number; y: number };
  /** labels to leave out (their text) */
  skip?: string[];
  /** folds of the sheet: x positions of vertical folds and y of horizontal ones (mm) */
  folds?: { x?: number[]; y?: number[] };
}

interface Look { paper: string; paper2: string; land: string; ink: string; coast: string; wash: string; sea: string; seaK: number; rhumb: [string, string, string]; note: string; table: string; wear: number; stains: number; vignette: number }
const LOOK: Record<ChartStyle, Look> = {
  pearl: { paper: '#d8c296', paper2: '#c2a674', land: '#e2cfa3', ink: '#2c2016', coast: '#2c2016', wash: '#b08a4a', sea: '#9f9a7c', seaK: 0.1, rhumb: ['#3a2c1e', '#6c5a3a', '#6c5a3a'], note: '#262321', table: '#1c130c', wear: 1, stains: 1, vignette: 0.55 },
  revenge: { paper: '#dcc49a', paper2: '#c4a272', land: '#e6d1a6', ink: '#2e1a10', coast: '#2e1a10', wash: '#a8553a', sea: '#a99272', seaK: 0.08, rhumb: ['#3a2216', '#9a2f1e', '#6e4a30'], note: '#9a1f14', table: '#1a0d08', wear: 0.8, stains: 0.8, vignette: 0.5 },
  endeavour: { paper: '#f1e7cf', paper2: '#e2d3b0', land: '#f5edd9', ink: '#1f2a3a', coast: '#1a2232', wash: '#7a9a5c', sea: '#6f9cc0', seaK: 0.3, rhumb: ['#1f2a3a', '#a03a2a', '#3d7a4a'], note: '#1f2a3a', table: '#2a1a10', wear: 0.25, stains: 0.2, vignette: 0.25 },
  dutch: { paper: '#ccc4a0', paper2: '#a4a586', land: '#d9d0ab', ink: '#151b14', coast: '#121a14', wash: '#4f6a4a', sea: '#5f7a6c', seaK: 0.2, rhumb: ['#1f281e', '#3a4e38', '#3a4e38'], note: '#1f3a35', table: '#0f1714', wear: 0.7, stains: 1, vignette: 0.5 },
  plain: { paper: '#e9dcbc', paper2: '#d6c39a', land: '#efe3c6', ink: '#2c2016', coast: '#2c2016', wash: '#a88a52', sea: '#8fa0a0', seaK: 0.12, rhumb: ['#3a2c1e', '#8a3a2a', '#4a6a44'], note: '#2a2420', table: '#1c130c', wear: 0.6, stains: 0.6, vignette: 0.4 }
};
export const chartLook = (s: ChartStyle) => LOOK[s];

const r = (n: number) => Math.round(n * 100) / 100;
/** a small seeded generator (mulberry32): the same chart every build */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** mountain ranges (lon, lat polylines): the hills stand along them, bigger in the middle */
const RANGES: [number, number][][] = [
  [[-72.3, 19.62], [-71.6, 19.25], [-70.9, 19.05], [-70.3, 18.75]],
  [[-71.3, 19.62], [-70.6, 19.5], [-70.0, 19.42]],
  [[-74.1, 18.38], [-73.5, 18.35], [-72.9, 18.3], [-72.2, 18.33], [-71.7, 18.28]],
  [[-72.65, 19.05], [-72.1, 18.98], [-71.6, 18.85]],
  [[-77.6, 19.95], [-77.0, 20.02], [-76.3, 20.05]],
  [[-75.4, 20.45], [-74.8, 20.35]],
  [[-80.25, 21.95], [-79.8, 21.92]],
  [[-83.6, 22.72], [-83.1, 22.82]],
  [[-76.85, 18.07], [-76.45, 18.06]],
  [[-77.9, 18.22], [-77.4, 18.2], [-77.1, 18.17]],
  [[-67.0, 18.18], [-66.5, 18.16], [-66.0, 18.14]]
];

/** the Douglas–Peucker'd rings of caribbean.json in mm of the box */
function landRings(o: ChartOpts): Pt[][] {
  const k = o.mmPerDeg / 10, [cx, cy] = project(o.center[0], o.center[1]), out: Pt[][] = [];
  for (const flat of MAP.land) {
    const p: Pt[] = [];
    for (let i = 0; i < flat.length; i += 2) p.push({ x: o.w / 2 + (flat[i] - cx) * k, y: o.h / 2 + (flat[i + 1] - cy) * k });
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const q of p) { a = Math.min(a, q.x); b = Math.max(b, q.x); c = Math.min(c, q.y); d = Math.max(d, q.y); }
    if (b < -20 || a > o.w + 20 || d < -20 || c > o.h + 20) continue;
    out.push(p);
  }
  return out;
}
const toMm = (o: ChartOpts) => { const k = o.mmPerDeg / 10, [cx, cy] = project(o.center[0], o.center[1]); return (lon: number, lat: number): Pt => { const [x, y] = project(lon, lat); return { x: o.w / 2 + (x - cx) * k, y: o.h / 2 + (y - cy) * k }; }; };
const ringPath = (rings: Pt[][]) => rings.map(p => 'M' + p.map(q => `${r(q.x)} ${r(q.y)}`).join('L') + 'Z').join('');

/** distance to the coast and «on land» for points of the box (a grid of segments) */
function coastField(rings: Pt[][]) {
  const G = 6, cells = new Map<string, [Pt, Pt][]>(), boxes = rings.map(p => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const q of p) { a = Math.min(a, q.x); b = Math.max(b, q.x); c = Math.min(c, q.y); d = Math.max(d, q.y); } return [a, b, c, d]; });
  for (const p of rings) for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    for (let gx = Math.floor(Math.min(a.x, b.x) / G); gx <= Math.floor(Math.max(a.x, b.x) / G); gx++) for (let gy = Math.floor(Math.min(a.y, b.y) / G); gy <= Math.floor(Math.max(a.y, b.y) / G); gy++) {
      const key = gx + ',' + gy; if (!cells.has(key)) cells.set(key, []); cells.get(key)!.push([a, b]);
    }
  }
  const segD = (q: Pt, a: Pt, b: Pt) => { const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L)); return Math.hypot(q.x - a.x - t * dx, q.y - a.y - t * dy); };
  return {
    dist(q: Pt, max: number): number {
      let best = max; const R = Math.ceil(max / G);
      for (let gx = Math.floor(q.x / G) - R; gx <= Math.floor(q.x / G) + R; gx++) for (let gy = Math.floor(q.y / G) - R; gy <= Math.floor(q.y / G) + R; gy++) for (const [a, b] of cells.get(gx + ',' + gy) ?? []) best = Math.min(best, segD(q, a, b));
      return best;
    },
    land(q: Pt): boolean {
      let c = false;
      rings.forEach((p, n) => {
        const [a, b, cc, d] = boxes[n]; if (q.x < a || q.x > b || q.y < cc || q.y > d) return;
        for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i].y > q.y) !== (p[j].y > q.y) && q.x < (p[j].x - p[i].x) * (q.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) c = !c;
      });
      return c;
    }
  };
}
const grow = (b: Rect, d: number): Rect => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });
const inRects = (q: Pt, rs: Rect[], pad = 0) => rs.some(b => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad);

// ---- engraved pieces ----
/** a mountain of an engraved range: two or three sharp peaks of different height on one ragged profile; every peak has its
 *  ridge running down to the foot, left of it the lit face (bare paper, a few short strokes), right of it the shaded face
 *  hatched down the slope (light from the upper left) */
let MNT = 0;
function mountain(x: number, y: number, b: number, h: number, ink: string, paper: string, rnd: () => number): string {
  const n = b > 7 ? 3 : b > 4.2 ? 2 : 1, peaks: { t: number; h: number }[] = [];
  for (let i = 0; i < n; i++) peaks.push({ t: n === 1 ? (rnd() - 0.5) * 0.3 : -0.5 + (i + 0.5) / n + (rnd() - 0.5) * 0.18, h: i === 0 && n > 1 ? 0.55 + rnd() * 0.25 : 0.62 + rnd() * 0.38 });
  const top = peaks.reduce((a, q) => (q.h > a.h ? q : a)); top.h = 1;
  // the key points: the feet, the peaks, the saddles between; then two levels of jag between them
  let key: [number, number][] = [[-1, 0]];
  peaks.forEach((q, i) => {
    if (i) { const a = peaks[i - 1]; key.push([(a.t + q.t) / 2 + (rnd() - 0.5) * 0.08, Math.min(a.h, q.h) * (0.6 + rnd() * 0.18)]); }
    else key.push([q.t - (q.t + 1) * 0.55, q.h * (0.36 + rnd() * 0.18)]);
    // a blunt summit: two shoulders just under the peak
    const sp = 0.07 + rnd() * 0.05;
    key.push([q.t - sp, q.h * (0.86 + rnd() * 0.06)], [q.t, q.h], [q.t + sp * 0.8, q.h * (0.84 + rnd() * 0.06)]);
  });
  const last = peaks[peaks.length - 1]; key.push([last.t + (1 - last.t) * 0.5, last.h * (0.32 + rnd() * 0.18)], [1, 0]);
  for (let lev = 0; lev < 1; lev++) {
    const nk: [number, number][] = [key[0]];
    for (let i = 1; i < key.length; i++) { const [a, c] = [key[i - 1], key[i]]; nk.push([(a[0] + c[0]) / 2 + (rnd() - 0.5) * 0.04, (a[1] + c[1]) / 2 + (rnd() - 0.5) * 0.05 * Math.abs(c[1] - a[1] + 0.3)], c); }
    key = nk;
  }
  const P = key.map(([t, v]) => [x + t * b / 2, y - Math.max(0, v) * h] as [number, number]);
  const prof = (xx: number) => { for (let i = 1; i < P.length; i++) if (xx <= P[i][0]) { const [a, c] = [P[i - 1], P[i]], k = (xx - a[0]) / Math.max(1e-6, c[0] - a[0]); return a[1] + (c[1] - a[1]) * k; } return y; };
  const sw = r(0.11 + b * 0.011), hw = r(0.05 + b * 0.0055);
  const out = [`<path d="M${P.map(p => `${r(p[0])} ${r(p[1])}`).join('L')}Z" fill="${paper}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="miter"/>`];
  let hatch = '', ridges = '', lit = '';
  peaks.forEach((q, i) => {
    const px = x + q.t * b / 2, py = y - q.h * h, foot = px + b * (0.06 + rnd() * 0.06), bend = px + (foot - px) * 0.35 + b * 0.03;
    const end = i < peaks.length - 1 ? x + ((q.t + peaks[i + 1].t) / 2) * b / 2 : x + b / 2;
    const id = `mnt${++MNT}`;
    // the shaded face: the ridge down to the foot, along the foot, up the profile back to the peak
    let face = `M${r(px)} ${r(py)}Q${r(bend)} ${r(py + (y - py) * 0.5)} ${r(foot)} ${r(y)}L${r(end)} ${r(y)}`;
    for (const p of P.slice().reverse()) if (p[0] < end && p[0] > px) face += `L${r(p[0])} ${r(p[1])}`;
    face += 'Z';
    out.push(`<clipPath id="${id}"><path d="${face}"/></clipPath><path d="${face}" fill="${ink}" fill-opacity=".14"/>`);
    let d = '';
    const step = Math.max(0.3, b * 0.045);
    for (let xx = px + step * 0.5; xx < end; xx += step) { const t0 = prof(xx); d += `M${r(xx)} ${r(t0)}L${r(xx + b * 0.025)} ${r(t0 + (y - t0) * (0.75 + rnd() * 0.25))}`; }
    hatch += `<path d="${d}" clip-path="url(#${id})" stroke="${ink}" stroke-width="${hw}" fill="none" stroke-linecap="round"/>`;
    ridges += `M${r(px)} ${r(py)}Q${r(bend)} ${r(py + (y - py) * 0.5)} ${r(foot)} ${r(y - (y - py) * 0.12)}`;
    // the lit face: two or three short strokes under the ridge's left side
    for (let k = 1; k <= 2; k++) { const xx = px - b * 0.06 * k - b * 0.03, t0 = prof(xx); if (y - t0 > h * 0.25) lit += `M${r(xx)} ${r(t0 + 0.15)}l${r(-b * 0.015)} ${r((y - t0) * 0.28)}`; }
  });
  out.push(hatch, `<path d="${ridges}" stroke="${ink}" stroke-width="${r(0.08 + b * 0.008)}" fill="none" stroke-linecap="round"/>`, `<path d="${lit}" stroke="${ink}" stroke-width="${hw}" stroke-opacity=".7" fill="none" stroke-linecap="round"/>`);
  out.push(`<path d="M${r(x - b * 0.55)} ${r(y + 0.1)}h${r(b * 1.1)}" stroke="${ink}" stroke-width="${r(0.05 + b * 0.005)}" stroke-opacity=".5"/>`);
  return out.join('');
}
/** a hill: a rounded hump with its peak a little off-centre, hachures down the shaded right flank (light from the upper left) */
function hill(x: number, y: number, b: number, h: number, ink: string, paper: string, rnd: () => number): string {
  const pk = (rnd() - 0.5) * 0.3, prof = (t: number) => { const u = t < pk ? (t - pk) / (1 + pk) : (t - pk) / (1 - pk); return y - h * Math.pow(Math.max(0, 1 - u * u), 0.85); };
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) { const t = -1 + i / 10; pts.push(`${r(x + t * b / 2)} ${r(prof(t))}`); }
  const out = [`<path d="M${pts.join('L')}Z" fill="${paper}" stroke="${ink}" stroke-width="${r(0.12 + b * 0.012)}" stroke-linejoin="round"/>`];
  // the shaded flank: a light wash of ink right of the ridge under the hachures
  const sh: string[] = [];
  for (let i = 0; i <= 10; i++) { const t = pk + (i / 10) * (1 - pk); sh.push(`${r(x + t * b / 2)} ${r(prof(t))}`); }
  out.push(`<path d="M${r(x + pk * b / 2)} ${r(y)}L${sh.join('L')}Z" fill="${ink}" fill-opacity=".16"/>`);
  let d = '';
  const n = Math.max(5, Math.round(b * 2.2));
  for (let i = 0; i < n; i++) {
    const t = pk + 0.04 + (i / n) * (0.96 - pk), top = prof(t), len = (y - top) * (0.55 + 0.4 * (1 - i / n)), xx = x + t * b / 2;
    d += `M${r(xx)} ${r(top + 0.12)}Q${r(xx + b * 0.02)} ${r(top + len * 0.5)} ${r(xx + b * 0.05)} ${r(top + len)}`;
  }
  for (let i = 1; i <= 3; i++) { const t = pk - 0.2 - i * 0.18, top = prof(t), xx = x + t * b / 2; d += `M${r(xx)} ${r(top + 0.2)}l${r(-b * 0.02)} ${r((y - top) * 0.3)}`; }
  out.push(`<path d="${d}" stroke="${ink}" stroke-width="${r(0.06 + b * 0.007)}" fill="none" stroke-linecap="round"/>`);
  out.push(`<path d="M${r(x - b * 0.55)} ${r(y + 0.1)}h${r(b * 1.1)}" stroke="${ink}" stroke-width="${r(0.05 + b * 0.005)}" stroke-opacity=".5"/>`);
  return out.join('');
}
/** a little tree of the old charts: a round crown with a shaded right half and a stem */
const tree = (x: number, y: number, s: number, ink: string, paper: string) =>
  `<path d="M${r(x)} ${r(y)}v${r(-s * 0.5)}" stroke="${ink}" stroke-width="${r(s * 0.09)}"/><circle cx="${r(x)}" cy="${r(y - s * 0.85)}" r="${r(s * 0.42)}" fill="${paper}" stroke="${ink}" stroke-width="${r(s * 0.08)}"/><path d="M${r(x + s * 0.05)} ${r(y - s * 1.2)}a${r(s * 0.36)} ${r(s * 0.36)} 0 0 1 0 ${r(s * 0.72)}z" fill="${ink}" fill-opacity=".55"/>`;
/** a town: three houses and a church tower on a little ground line */
function town(x: number, y: number, s: number, ink: string, paper: string): string {
  const h = (dx: number, w: number, hh: number) => `<path d="M${r(x + dx)} ${r(y)}v${r(-hh)}l${r(w / 2)} ${r(-w * 0.5)}l${r(w / 2)} ${r(w * 0.5)}v${r(hh)}z" fill="${paper}" stroke="${ink}" stroke-width="${r(s * 0.06)}"/><path d="M${r(x + dx + w * 0.55)} ${r(y)}v${r(-hh)}" stroke="${ink}" stroke-width="${r(s * 0.04)}"/>`;
  return h(-s * 0.9, s * 0.6, s * 0.4) + `<path d="M${r(x - s * 0.15)} ${r(y)}v${r(-s * 0.95)}l${r(s * 0.15)} ${r(-s * 0.35)}l${r(s * 0.15)} ${r(s * 0.35)}v${r(s * 0.95)}z" fill="${paper}" stroke="${ink}" stroke-width="${r(s * 0.06)}"/><path d="M${r(x)} ${r(y - s * 1.3)}v${r(-s * 0.3)}M${r(x - s * 0.1)} ${r(y - s * 1.48)}h${r(s * 0.2)}" stroke="${ink}" stroke-width="${r(s * 0.05)}"/>` + h(s * 0.25, s * 0.55, s * 0.32) + `<path d="M${r(x - s * 1.1)} ${r(y)}h${r(s * 2.1)}" stroke="${ink}" stroke-width="${r(s * 0.06)}"/>`;
}
/** a wind rose: 32 points, the cardinal ones long and split dark/light, a fleur-de-lis at the north, rings of degrees */
function rose(cx: number, cy: number, R: number, L: Look): string {
  const at = (a: number, d: number) => `${r(cx + d * Math.sin(a))} ${r(cy - d * Math.cos(a))}`, out: string[] = [], ink = L.ink;
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.86)}" fill="${L.paper}" fill-opacity=".55" stroke="${ink}" stroke-width="${r(R * 0.012)}"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.8)}" fill="none" stroke="${ink}" stroke-width="${r(R * 0.006)}"/>`);
  let ticks = '';
  for (let i = 0; i < 128; i++) { const a = i * Math.PI / 64; ticks += `M${at(a, R * 0.8)}L${at(a, R * (i % 4 ? 0.83 : 0.86))}`; }
  out.push(`<path d="${ticks}" stroke="${ink}" stroke-width="${r(R * 0.005)}"/>`);
  const ray = (a: number, len: number, wid: number, dark: string, light: string) =>
    `<path d="M${at(a, 0)}L${at(a - Math.PI / 2, wid)}L${at(a, len)}Z" fill="${dark}" stroke="${ink}" stroke-width="${r(R * 0.006)}" stroke-linejoin="round"/><path d="M${at(a, 0)}L${at(a + Math.PI / 2, wid)}L${at(a, len)}Z" fill="${light}" stroke="${ink}" stroke-width="${r(R * 0.006)}" stroke-linejoin="round"/>`;
  for (let i = 0; i < 16; i++) out.push(ray(Math.PI / 16 + i * Math.PI / 8, R * 0.5, R * 0.035, L.rhumb[2], L.paper));
  for (let i = 0; i < 8; i++) out.push(ray(Math.PI / 8 + i * Math.PI / 4, R * 0.62, R * 0.055, L.rhumb[1], L.paper));
  for (let i = 0; i < 4; i++) out.push(ray(Math.PI / 4 + i * Math.PI / 2, R * 0.7, R * 0.08, ink, L.paper));
  for (let i = 0; i < 4; i++) out.push(ray(i * Math.PI / 2, i ? R * 0.84 : R * 0.72, R * 0.11, ink, L.paper));
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.07)}" fill="${L.paper}" stroke="${ink}" stroke-width="${r(R * 0.012)}"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.025)}" fill="${ink}"/>`);
  // the fleur-de-lis over the north point
  const s = R * 0.2, fx = cx, fy = cy - R * 0.78;
  out.push(`<path transform="translate(${r(fx)} ${r(fy)}) scale(${r(s / 10)})" d="M0 -12C3 -8 3.4 -4 1.4 0C4 -2 7 -3 8.6 -1C10 1 8 3.6 6 2.6C7 1.4 6.2 0 4.6 0.4C3 0.8 2 2.6 1.6 4H-1.6C-2 2.6 -3 0.8 -4.6 0.4C-6.2 0 -7 1.4 -6 2.6C-8 3.6 -10 1 -8.6 -1C-7 -3 -4 -2 -1.4 0C-3.4 -4 -3 -8 0 -12ZM-3.4 4.6H3.4V6H-3.4Z" fill="${ink}"/>`);
  // the east is marked with a small cross (the way to the Holy Land, as on the old charts)
  const ex = cx + R * 0.93, ey = cy;
  out.push(`<path d="M${r(ex)} ${r(ey - R * 0.05)}v${r(R * 0.1)}M${r(ex - R * 0.035)} ${r(ey - R * 0.015)}h${r(R * 0.07)}" stroke="${ink}" stroke-width="${r(R * 0.014)}"/>`);
  return out.join('');
}
/** a small ship under sail, engraved (about 10 mm long at s = 1) */
function shipGlyph(x: number, y: number, s: number, flip: boolean, L: Look): string {
  const ink = L.ink, p = L.paper, k = s;
  const g = `<g transform="translate(${r(x)} ${r(y)}) scale(${flip ? -k : k} ${k})">
<path d="M-5 0C-3 1.6 3 1.6 5.2 -0.4L5.6 -1.4H-5.6Z" fill="${ink}" fill-opacity=".85"/>
<path d="M-5.6 -1.4H5.6" stroke="${ink}" stroke-width=".18"/>
<path d="M-2.6 -1.4V-8.6M0.8 -1.4V-10M3.6 -1.4V-7.4M5.6 -1.4L8.4 -3.6" stroke="${ink}" stroke-width=".18"/>
${[[-2.6, 8.6, 1.9], [0.8, 10, 2.2], [3.6, 7.4, 1.6]].map(([mx, H, w]) => `<path d="M${mx - w} ${-H + 0.6}Q${mx} ${-H - 0.2} ${mx + w} ${-H + 0.6}Q${mx + w + 0.5} ${-H / 2 - 1} ${mx + w} ${-H * 0.45}Q${mx} ${-H * 0.45 - 0.6} ${mx - w} ${-H * 0.45}Q${mx - w + 0.4} ${-H / 2 - 1} ${mx - w} ${-H + 0.6}Z" fill="${p}" stroke="${ink}" stroke-width=".16"/><path d="M${mx - w} ${-H * 0.45 - 0.5}Q${mx} ${-H * 0.45 - 1.1} ${mx + w} ${-H * 0.45 - 0.5}Q${mx + w + 0.4} ${-H * 0.25} ${mx + w} ${-2}Q${mx} ${-2.6} ${mx - w} ${-2}Q${mx - w + 0.4} ${-H * 0.25} ${mx - w} ${-H * 0.45 - 0.5}Z" fill="${p}" stroke="${ink}" stroke-width=".16"/><path d="M${mx + w * 0.3} ${-H + 0.5}V-2.3M${mx + w * 0.7} ${-H + 0.6}V-2.2" stroke="${ink}" stroke-width=".08" stroke-opacity=".7"/>`).join('')}
<path d="M0.8 -10L2.6 -10.4L0.8 -10.8Z" fill="${ink}"/>
<path d="M-7 0.6Q-5 0 -3 0.6T1 0.6T5 0.6T8 0.4" fill="none" stroke="${ink}" stroke-width=".14"/></g>`;
  return g;
}
/** a sea serpent: three coils out of the water, scales hatched, a crested head */
function serpent(x: number, y: number, s: number, flip: boolean, L: Look): string {
  const ink = L.ink, p = L.paper, sw = 0.22;
  const coil = (cx: number, w: number, h: number) => `<path d="M${cx - w / 2} 0C${cx - w / 2} ${-h * 1.3} ${cx + w / 2} ${-h * 1.3} ${cx + w / 2} 0L${cx + w / 2 - 1.4} 0C${cx + w / 2 - 1.4} ${-h * 0.9} ${cx - w / 2 + 1.4} ${-h * 0.9} ${cx - w / 2 + 1.4} 0Z" fill="${p}" stroke="${ink}" stroke-width="${sw}"/>` +
    Array.from({ length: 6 }, (_, i) => { const t = 0.15 + i * 0.13, a = Math.PI * (1 - t); return `<path d="M${r(cx + Math.cos(a) * (w / 2 - 0.7))} ${r(-Math.sin(a) * h * 0.98)}l${r(Math.cos(a) * 0.6)} ${r(-Math.sin(a) * 0.5)}" stroke="${ink}" stroke-width=".12"/>`; }).join('') +
    `<path d="M${cx - w * 0.15} ${-h * 0.95}l0.5 -1.1l0.5 1M${cx + w * 0.05} ${-h * 0.97}l0.5 -1.2l0.5 1.1" fill="${p}" stroke="${ink}" stroke-width=".14"/>`;
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${flip ? -s : s} ${s})">
${coil(-8, 6, 4)}${coil(-1, 6.5, 4.6)}
<path d="M5 0C5 -4 6 -7.4 8.6 -8.4C10.6 -9.2 12.6 -8.4 13.6 -7.2L11.6 -6.6L13.4 -5.8C12.4 -5 11 -5 10.2 -5.4C9 -4.4 8.6 -2.4 8.6 0Z" fill="${p}" stroke="${ink}" stroke-width="${sw}"/>
<path d="M8.4 -8.4L7.6 -10.6L9.2 -9.2L9.4 -11.2L10.4 -9.2L11.2 -10.6L11.2 -8.8" fill="${p}" stroke="${ink}" stroke-width=".16"/><circle cx="11" cy="-7.4" r=".35" fill="${ink}"/>
<path d="M6 -1.4h1.6M6.2 -3h1.8M6.6 -4.6h1.8" stroke="${ink}" stroke-width=".12"/>
<path d="M-12.5 0.2Q-10 -0.6 -7.5 0.2T-2.5 0.2T2.5 0.2T7.5 0.2T12.5 0.2M-10.5 1.1Q-8 0.4 -5.5 1.1T-0.5 1.1T4.5 1.1T9.5 1.1" fill="none" stroke="${ink}" stroke-width=".14"/></g>`;
}
/** a whale blowing, its back out of the water */
function whale(x: number, y: number, s: number, flip: boolean, L: Look): string {
  const ink = L.ink, p = L.paper;
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${flip ? -s : s} ${s})">
<path d="M-9 0C-8 -3.4 -3 -5 2 -4.6C6 -4.2 8.4 -2.6 9 0Z" fill="${p}" stroke="${ink}" stroke-width=".22"/>
<path d="M-2 -4.4C0 -3.2 4 -2.8 8 -1.2M-6 -2.6C-3 -1.8 2 -1.2 7 -0.6" stroke="${ink}" stroke-width=".11" fill="none"/>
${Array.from({ length: 9 }, (_, i) => `<path d="M${r(-1 + i * 1.1)} ${r(-4.1 + i * 0.36)}l0.2 ${r(1.2 + i * 0.1)}" stroke="${ink}" stroke-width=".1"/>`).join('')}
<circle cx="6.2" cy="-1.9" r=".3" fill="${ink}"/><path d="M-9 -0.2L-12 -3L-11.4 -0.6L-13.2 0.6Z" fill="${p}" stroke="${ink}" stroke-width=".2"/>
<path d="M4.6 -4.6C4 -7 2.6 -8 1.6 -8.6M4.8 -4.6C5 -7.2 6 -8.4 7.2 -8.8M4.7 -4.6C4.7 -7 4.6 -8.8 4.4 -9.6" stroke="${ink}" stroke-width=".14" fill="none"/>
<path d="M-14 0.3Q-11.5 -0.5 -9 0.3T-4 0.3T1 0.3T6 0.3T11 0.3" fill="none" stroke="${ink}" stroke-width=".14"/></g>`;
}

/** the torn outline of the sheet: a rectangle with a ragged, slightly wavering edge */
function tornPath(x: number, y: number, w: number, h: number, rnd: () => number, amp: number): string {
  const pts: string[] = [], step = 1.6;
  const side = (x0: number, y0: number, x1: number, y1: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / step), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    let drift = 0;
    for (let i = 0; i < n; i++) { const t = i / n; drift = drift * 0.8 + (rnd() - 0.5) * amp * 0.9; const j = drift + (rnd() < 0.08 ? (rnd() - 0.2) * amp * 2.2 : 0); pts.push(`${r(x0 + (x1 - x0) * t + nx * j)} ${r(y0 + (y1 - y0) * t + ny * j)}`); }
  };
  side(x, y, x + w, y); side(x + w, y, x + w, y + h); side(x + w, y + h, x, y + h); side(x, y + h, x, y);
  return 'M' + pts.join('L') + 'Z';
}

/** The chart as one SVG in mm (viewBox 0 0 w h). */
export function chartSvg(o0: ChartOpts): string {
  const o: ChartOpts = o0.anchor ? { ...o0, center: centerFor(o0.anchor.lon, o0.anchor.lat, o0.anchor.x, o0.anchor.y, o0.w, o0.h, o0.mmPerDeg) } : o0;
  const L = LOOK[o.style], rnd = rng(o.seed ?? 7), W = o.w, H = o.h, id = `ch${o.style}${o.seed ?? 7}`, calm = o.calm ?? [], inset = o.inset ?? 0;
  const rings = landRings(o), land = ringPath(rings), field = coastField(rings), mm = toMm(o), k = o.mmPerDeg / 26; // k ≈ 1 at a whole-sheet chart
  const out: string[] = [], defs: string[] = [];
  const sheet = inset > 0 ? tornPath(inset, inset, W - 2 * inset, H - 2 * inset, rnd, o.style === 'revenge' ? 1.6 : 1.1) : `M0 0H${W}V${H}H0Z`;
  defs.push(`<clipPath id="${id}sh"><path d="${sheet}"/></clipPath><clipPath id="${id}ld"><path d="${land}"/></clipPath>`);
  // paper: grain, mottling, a darker rim; the table round the sheet
  defs.push(`<filter id="${id}grain" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="${(o.seed ?? 7) + 1}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 .55"/></filter>`);
  const [mr, mg, mb] = [1, 3, 5].map(i => (parseInt(L.paper2.slice(i, i + 2), 16) / 255).toFixed(3));
  defs.push(`<filter id="${id}mott" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="4" seed="${(o.seed ?? 7) + 2}"/><feColorMatrix values="0 0 0 0 ${mr}  0 0 0 0 ${mg}  0 0 0 0 ${mb}  0 0 0 -2.2 1.25"/></filter>`);
  defs.push(`<filter id="${id}wave" x="-5%" y="-5%" width="110%" height="110%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency=".16" numOctaves="2" seed="${(o.seed ?? 7) + 3}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${r(0.9 * Math.max(0.7, k))}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
  defs.push(`<filter id="${id}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="${id}soft2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.5"/></filter>`);
  defs.push(`<filter id="${id}blot" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="${(o.seed ?? 7) + 4}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".6"/></filter>`);
  defs.push(`<radialGradient id="${id}vig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1606" stop-opacity="${L.vignette}"/></radialGradient>`);
  if (inset > 0) out.push(`<rect width="${W}" height="${H}" fill="${L.table}"/><path d="${sheet}" transform="translate(.8 1.2)" fill="#000" opacity=".55" filter="url(#${id}soft2)"/>`);
  out.push(`<g clip-path="url(#${id}sh)">`);
  out.push(`<rect width="${W}" height="${H}" fill="${L.paper}"/>`);
  // a pale sea wash near the coasts (Endeavour: a clear blue; the others: a faded tone)
  out.push(`<path d="${land}" fill="none" stroke="${L.sea}" stroke-opacity="${L.seaK}" stroke-width="${r(14 * k)}" stroke-linejoin="round" filter="url(#${id}soft)"/>`);
  out.push(`<rect width="${W}" height="${H}" fill="${L.paper2}" filter="url(#${id}mott)" opacity="${r(0.45 * L.wear + 0.2)}"/>`);
  // rhumb lines from the roses
  const roses = o.roses ?? [];
  let rh = ['', '', ''];
  roses.forEach((ro, n) => { for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, kind = i % 4 === 0 ? 0 : i % 2 === 0 ? 1 : 2; if (n > 0 && kind === 2) continue; const len = Math.hypot(W, H) * 1.1; rh[kind] += `M${r(ro.x + ro.r * 0.86 * Math.sin(a))} ${r(ro.y - ro.r * 0.86 * Math.cos(a))}L${r(ro.x + len * Math.sin(a))} ${r(ro.y - len * Math.cos(a))}`; } });
  rh.forEach((d, i) => { if (d) out.push(`<path d="${d}" stroke="${L.rhumb[i]}" stroke-width="${i ? 0.13 : 0.18}" stroke-opacity="${i ? 0.45 : 0.55}" fill="none"/>`); });
  // the water-lines along the coasts: rings of the coast at growing offsets, fading out to sea, slightly wavering
  const offs = [0.55, 1.15, 1.8, 2.5, 3.3, 4.2, 5.2, 6.4].map(v => v * Math.max(0.75, Math.min(1.5, k))), lw = 0.16;
  let mask = `<rect width="${W}" height="${H}" fill="#000"/>`;
  for (let i = offs.length - 1; i >= 0; i--) {
    const g = Math.round(255 * (1 - i / offs.length) ** 1.15);
    mask += `<path d="${land}" fill="none" stroke="rgb(${g},${g},${g})" stroke-width="${r(2 * offs[i])}" stroke-linejoin="round"/><path d="${land}" fill="none" stroke="#000" stroke-width="${r(2 * offs[i] - 2 * lw)}" stroke-linejoin="round"/>`;
  }
  defs.push(`<mask id="${id}wl" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><g filter="url(#${id}wave)">${mask}</g></mask>`);
  out.push(`<rect width="${W}" height="${H}" fill="${L.coast}" mask="url(#${id}wl)" opacity=".85"/>`);
  // shoals: stippled dots close to the coasts; the Bahama banks wide
  const bah = (q: Pt) => { const a = mm(-80.2, 27.2), b = mm(-72.6, 21.2); return q.x > a.x && q.x < b.x && q.y > a.y && q.y < b.y; };
  let dots = '';
  const nDots = Math.round(W * H * 1.1);
  for (let i = 0; i < nDots; i++) {
    const q = { x: rnd() * W, y: rnd() * H }, D = (bah(q) ? 9 : 3.2) * Math.max(0.8, k), d = field.dist(q, D);
    if (d >= D || d < 0.35 || inRects(q, calm, 2) || rnd() > (1 - d / D) ** 1.4 || field.land(q)) continue;
    dots += `M${r(q.x)} ${r(q.y)}h.01`;
  }
  out.push(`<path d="${dots}" stroke="${L.ink}" stroke-width=".38" stroke-linecap="round" stroke-opacity=".75"/>`);
  // soundings: small numbers in fathoms, shallow near the coast
  const taken: Pt[] = [];
  let snd = '';
  for (let i = 0; i < W * H * 0.02; i++) {
    const q = { x: 4 + rnd() * (W - 8), y: 4 + rnd() * (H - 8) }, d = field.dist(q, 30);
    if (d < 1.4 || d > 26 || inRects(q, calm, 3) || field.land(q) || taken.some(t => Math.hypot(t.x - q.x, t.y - q.y) < 7)) continue;
    taken.push(q);
    const depth = Math.round(3 + d * (bah(q) ? 0.6 : 2.6) + rnd() * 6);
    snd += `<text x="${r(q.x)}" y="${r(q.y)}">${depth}</text>`;
  }
  out.push(`<g font-family="Old Standard TT" font-style="italic" font-size="1.55" fill="${L.ink}" fill-opacity=".75" text-anchor="middle">${snd}</g>`);
  // land: the paper a little lighter, a hand-coloured wash along the coast inside, fine hatching
  out.push(`<path data-land="1" d="${land}" fill="${L.land}"/>`);
  out.push(`<g clip-path="url(#${id}ld)"><path d="${land}" fill="none" stroke="${L.wash}" stroke-opacity=".55" stroke-width="${r(3.2 * Math.max(0.7, k))}" stroke-linejoin="round" filter="url(#${id}soft2)"/>`);
  out.push(`<path d="${land}" fill="none" stroke="${L.ink}" stroke-opacity=".5" stroke-width="${r(1.2 * Math.max(0.7, k))}" stroke-dasharray=".08 .42" stroke-linejoin="round"/></g>`);
  // the coast: a fine line and a heavier shadow line to the lower right
  out.push(`<path d="${land}" transform="translate(.16 .2)" fill="none" stroke="${L.coast}" stroke-width=".34" stroke-linejoin="round"/><path d="${land}" fill="none" stroke="${L.coast}" stroke-width=".2" stroke-linejoin="round"/>`);
  // hills: along the ranges, then a few on the high ground of every island; trees on the low ground
  const hills: { x: number; y: number; b: number; h: number; m?: boolean }[] = [];
  for (const rg of RANGES) {
    const P = rg.map(([lo, la]) => mm(lo, la));
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y), step = 2.6 * Math.max(0.85, Math.min(1.5, k));
      for (let t = 0; t < len; t += step * (0.7 + rnd() * 0.6)) {
        const q = { x: a.x + (b.x - a.x) * t / len + (rnd() - 0.5) * 2.2 * k, y: a.y + (b.y - a.y) * t / len + (rnd() - 0.5) * 2 * k };
        if (!field.land(q)) continue;
        // the ranges: engraved mountains, the height varies a lot (a crest in the middle of a range, foothills at its ends)
        const mid = 1 - Math.abs((i + t / len) / (P.length - 1) - 0.5) * 1.3, big = rnd(), sz = (3 + big * big * 6 + mid * 2.2) * Math.max(0.85, Math.min(1.5, k));
        hills.push({ x: q.x, y: q.y, b: sz, h: sz * (0.3 + mid * 0.14 + rnd() * 0.26), m: true });
      }
    }
  }
  const trees: Pt[] = [];
  for (let i = 0; i < W * H * 0.05; i++) {
    const q = { x: rnd() * W, y: rnd() * H };
    if (!field.land(q) || inRects(q, calm, 1)) continue;
    const d = field.dist(q, 12);
    if (d > 2.6 * Math.max(0.7, Math.min(2, k)) && rnd() < 0.16 && !hills.some(hh => Math.hypot(hh.x - q.x, (hh.y - q.y) * 1.6) < hh.b * 1.1)) { const sz = (2 + rnd() * 2.6) * Math.max(0.85, Math.min(1.6, k)); hills.push({ x: q.x, y: q.y, b: sz, h: sz * (0.3 + rnd() * 0.25) }); }
    else if (d > 1.2 && rnd() < 0.22 && !trees.some(t => Math.hypot(t.x - q.x, t.y - q.y) < 2)) trees.push(q);
  }
  hills.sort((a, b) => a.y - b.y);
  out.push(hills.filter(hh => !inRects(hh, calm, 1)).map(hh => (hh.m ? mountain : hill)(hh.x, hh.y, hh.b, hh.h, L.ink, L.land, rnd)).join(''));
  out.push(trees.filter(q => !hills.some(hh => Math.abs(hh.x - q.x) < hh.b * 0.6 && q.y < hh.y + 1 && q.y > hh.y - hh.h - 1)).map(q => tree(q.x, q.y, 1.5 * Math.max(0.7, Math.min(1.7, k)), L.ink, L.land)).join(''));
  // lettering: each label takes the first free place near its spot (clear of the roses, the ships, the cartouche, the scale,
  // the notes, the plates and the other labels; a label in the sea keeps off the land); a label with no free place is left out
  const skip = new Set(o.skip ?? []), placed: Rect[] = [], obst: Rect[] = [...calm.map(b => grow(b, 3)), ...(o.avoid ?? [])];
  roses.forEach(ro => obst.push({ x: ro.x - ro.r, y: ro.y - ro.r, w: 2 * ro.r, h: 2 * ro.r }));
  if (o.cross) obst.push({ x: o.cross.x - 5.5, y: o.cross.y - 5.5, w: 11, h: 11 });
  for (const sp of o.ships ?? []) obst.push({ x: sp.x - 8.6 * sp.s, y: sp.y - 11 * sp.s, w: 17.2 * sp.s, h: 12.6 * sp.s });
  if (o.serpent) obst.push({ x: o.serpent.x - 13 * o.serpent.s, y: o.serpent.y - 12 * o.serpent.s, w: 27 * o.serpent.s, h: 13.6 * o.serpent.s });
  if (o.whale) obst.push({ x: o.whale.x - 14.5 * o.whale.s, y: o.whale.y - 10 * o.whale.s, w: 24 * o.whale.s, h: 11.6 * o.whale.s });
  if (o.cartouche) obst.push(grow(o.cartouche, 3.5));
  if (o.scale) obst.push({ x: o.scale.x - 3, y: o.scale.y - 4, w: (o.mmPerDeg / Math.cos(o.center[1] * Math.PI / 180)) * 2 + 6, h: 9.5 });
  for (const nt of o.note ?? []) obst.push({ x: nt.x - 1, y: nt.y - (nt.size ?? 4.2), w: nt.text.length * (nt.size ?? 4.2) * 0.42 + 2, h: (nt.size ?? 4.2) * 1.5 });
  const hit = (b: Rect, list: Rect[]) => list.some(q => b.x < q.x + q.w && b.x + b.w > q.x && b.y < q.y + q.h && b.y + b.h > q.y);
  const onLand = (b: Rect) => { for (let i = 0; i <= 14; i++) for (let j = 0; j <= 4; j++) if (field.land({ x: b.x + b.w * i / 14, y: b.y + b.h * j / 4 })) return true; return false; };
  for (const lb of TXT.labels) {
    if (skip.has(lb.text)) continue;
    const p0 = o.labelsAt?.[lb.text] ?? mm(lb.lon + (lb.dx ?? 0), lb.lat + (lb.dy ?? 0));
    if (p0.x < -10 || p0.x > W + 10 || p0.y < -5 || p0.y > H + 5) continue;
    const ang = lb.to ? (() => { const q = mm(lb.to[0], lb.to[1]); return Math.atan2(q.y - p0.y, q.x - p0.x) * 180 / Math.PI; })() : 0;
    const kz = Math.max(0.85, Math.min(2.4, k));
    const st = {
      old: { f: 'Old Standard TT', w: 400, it: true, s: 4.6 * Math.min(kz, 1.2), ls: 0.4 * Math.min(kz, 1.2), op: 0.9 },
      sea: { f: 'Old Standard TT', w: 400, it: true, s: 6 * Math.max(0.85, Math.min(1.4, k)), ls: 2.2, op: 0.7 },
      town: { f: 'Old Standard TT', w: 400, it: true, s: 2.6 * Math.max(0.9, Math.min(1.8, k)), ls: 0.1, op: 0.9 },
      small: { f: 'Old Standard TT', w: 400, it: true, s: 2.2 * Math.max(0.9, Math.min(1.8, k)), ls: 0.25, op: 0.8 }
    }[lb.kind];
    if (lb.kind === 'town') { const t = mm(lb.lon, lb.lat); out.push(town(t.x, t.y, 1.6 * Math.max(0.8, Math.min(1.8, k)), L.ink, L.land)); obst.push({ x: t.x - 2.2 * k, y: t.y - 3 * k, w: 4.4 * k, h: 3.4 * k }); }
    const wide = lb.text.length * st.s * 0.53 + (lb.text.length - 1) * st.ls + 1, sea = !o.labelsAt?.[lb.text] && !field.land(mm(lb.lon, lb.lat));
    const boxAt = (p: Pt): Rect => { const a = ang * Math.PI / 180, c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a)), hw = wide / 2, hh = st.s * 0.62, cy = p.y - st.s * 0.3; return { x: p.x - hw * c - hh * sn - 0.6, y: cy - hw * sn - hh * c - 0.6, w: 2 * (hw * c + hh * sn) + 1.2, h: 2 * (hw * sn + hh * c) + 1.2 }; };
    let p: Pt | null = null;
    const tries: [number, number][] = [[0, 0]]; for (const d of [1, 2, 3, 4, 5]) for (const dx of [0, -0.3, 0.3, -0.6, 0.6]) tries.push([dx, -d], [dx, d]); for (const dx of [-0.3, 0.3, -0.6, 0.6]) tries.splice(1, 0, [dx, 0]);
    for (const [dx, dy] of tries) {
      const q = { x: p0.x + dx * wide, y: p0.y + dy * st.s * 1.2 }, b = boxAt(q);
      if (hit(b, obst) || hit(b, placed) || (sea && onLand(b)) || b.x < 3 || b.x + b.w > W - 3 || b.y < 3 || b.y + b.h > H - 3) continue;
      p = q; placed.push(b); break;
    }
    if (!p) { if (o.labelsAt?.[lb.text]) console.warn(`warning: chart label «${lb.text}» found no free place near ${JSON.stringify(p0)}`); continue; }
    // a halo of paper under the words keeps them clear of the hatching
    const t = `<text data-lbl="${lb.text}"${sea ? ' data-sea="1"' : ''} x="${r(p.x)}" y="${r(p.y)}" transform="rotate(${r(ang)} ${r(p.x)} ${r(p.y)})" text-anchor="middle" font-family="${st.f}" font-weight="${st.w}"${st.it ? ' font-style="italic"' : ''} font-size="${r(st.s)}" letter-spacing="${r(st.ls)}"`;
    out.push(`${t.replace(/ data-lbl="[^"]*"| data-sea="1"/g, '')} fill="none" stroke="${L.land}" stroke-opacity=".8" stroke-width="${r(st.s * 0.22)}" stroke-linejoin="round">${lb.text}</text>${t} fill="${L.ink}" fill-opacity="${st.op}">${lb.text}</text>`);
  }
  // roses, ships, the monster
  roses.forEach((ro, i) => out.push(`<g data-obst="rose">${rose(ro.x, ro.y, ro.r, { ...L, rhumb: i ? [L.ink, L.ink, L.ink] : L.rhumb })}</g>`));
  for (const s of o.ships ?? []) out.push(`<g data-obst="ship">${shipGlyph(s.x, s.y, s.s, !!s.flip, { ...L, paper: L.paper })}</g>`);
  if (o.serpent) out.push(`<g data-obst="serpent">${serpent(o.serpent.x, o.serpent.y, o.serpent.s, !!o.serpent.flip, L)}</g>`);
  if (o.whale) out.push(`<g data-obst="whale">${whale(o.whale.x, o.whale.y, o.whale.s, !!o.whale.flip, L)}</g>`);
  // a scale of leagues: 20 leagues to a degree of latitude
  if (o.scale) {
    const lat = o.center[1], per = (o.mmPerDeg / Math.cos(lat * Math.PI / 180)) / 20, n = 40, len = per * n;
    // the scale takes the first place near its spot that is all sea
    let x0 = o.scale.x, y0 = o.scale.y;
    const cand: [number, number][] = []; for (let dy = 0; dy > -H * 0.6; dy -= 8) for (let dx = 0; dx > -W * 0.7; dx -= 12) cand.push([dx, dy]);
    for (const [dx, dy] of cand) { const b = { x: o.scale.x + dx - 3, y: o.scale.y + dy - 4, w: len + 6, h: 9.5 }; if (!onLand(b) && !hit(b, placed) && !hit(b, obst.filter(q => q.h !== 9.5))) { x0 = o.scale.x + dx; y0 = o.scale.y + dy; break; } }
    let seg = '';
    for (let i = 0; i < n / 5; i++) seg += `<rect x="${r(x0 + i * per * 5)}" y="${r(y0)}" width="${r(per * 5)}" height="1.1" fill="${i % 2 ? L.paper : L.ink}" stroke="${L.ink}" stroke-width=".15"/>`;
    const nums = [0, 10, 20, 30, 40].map(v => `<text x="${r(x0 + v * per)}" y="${r(y0 - 0.9)}">${v}</text>`).join('');
    out.push(`<g data-obst="scale" data-sea="1">${seg}<g font-family="Old Standard TT" font-size="2" fill="${L.ink}" text-anchor="middle">${nums}</g><text x="${r(x0 + len / 2)}" y="${r(y0 + 4)}" font-family="Old Standard TT" font-style="italic" font-size="2.6" fill="${L.ink}" text-anchor="middle" letter-spacing=".4">${TXT.scale}</text></g>`);
  }
  if (o.cartouche) out.push(`<g data-obst="cartouche">${cartouche(o.cartouche, L, id)}</g>`);
  // the captain's notes: a course in ink, a cross, words in a quick hand
  if (o.course && o.course.length > 1) {
    const c = o.course; let d = `M${r(c[0].x)} ${r(c[0].y)}`;
    for (let i = 1; i < c.length; i++) { const a = c[i - 1], b = c[i]; d += `Q${r((a.x + b.x) / 2 + (b.y - a.y) * 0.12)} ${r((a.y + b.y) / 2 - (b.x - a.x) * 0.12)} ${r(b.x)} ${r(b.y)}`; }
    const z = c[c.length - 1], y = c[c.length - 2], ang = Math.atan2(z.y - y.y, z.x - y.x);
    const head = `M${r(z.x - 3 * Math.cos(ang - 0.4))} ${r(z.y - 3 * Math.sin(ang - 0.4))}L${r(z.x)} ${r(z.y)}L${r(z.x - 3 * Math.cos(ang + 0.4))} ${r(z.y - 3 * Math.sin(ang + 0.4))}`;
    out.push(`<g filter="url(#${id}soft2)" opacity=".85"><path d="${d}" fill="none" stroke="${L.note}" stroke-width=".55" stroke-dasharray="2.6 1.6" stroke-linecap="round"/><path d="${head}" fill="none" stroke="${L.note}" stroke-width=".6" stroke-linecap="round"/></g>`);
  }
  if (o.cross) { const { x, y } = o.cross; out.push(`<g data-obst="cross" opacity=".9"><path d="M${x - 2.6} ${y - 2.6}L${x + 2.6} ${y + 2.6}M${x + 2.6} ${y - 2.4}L${x - 2.4} ${y + 2.6}" stroke="${L.note}" stroke-width=".8" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="4.4" fill="none" stroke="${L.note}" stroke-width=".35" stroke-dasharray="1.4 .8"/></g>`); }
  for (const nt of o.note ?? []) out.push(`<text x="${r(nt.x)}" y="${r(nt.y)}" transform="rotate(${nt.rot ?? -4} ${r(nt.x)} ${r(nt.y)})" font-family="Alegreya" font-style="italic" font-weight="500" font-size="${r(nt.size ?? 4.2)}" fill="none" stroke="${L.paper}" stroke-width=".9" stroke-opacity=".85" stroke-linejoin="round">${nt.text}</text><text x="${r(nt.x)}" y="${r(nt.y)}" transform="rotate(${nt.rot ?? -4} ${r(nt.x)} ${r(nt.y)})" font-family="Alegreya" font-style="italic" font-weight="500" font-size="${r(nt.size ?? 4.2)}" fill="${L.note}" fill-opacity=".88">${nt.text}</text>`);
  // the calm under the board's plates: paper laid softly over the busy chart
  for (const b of calm) out.push(`<rect x="${r(b.x - 0.6)}" y="${r(b.y - 0.6)}" width="${r(b.w + 1.2)}" height="${r(b.h + 1.2)}" rx="2" fill="${L.paper}" opacity=".5" filter="url(#${id}soft2)"/>`);
  // the life of the sheet
  out.push(sheetLife(o, L, id, rnd));
  out.push(`<rect width="${W}" height="${H}" fill="#000" filter="url(#${id}grain)" opacity="${r(0.12 + 0.08 * L.wear)}"/>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#${id}vig)"/>`);
  out.push(`</g>`);
  if (inset > 0) out.push(edgeOf(o, sheet, L, id, rnd));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(W)} ${r(H)}" width="${r(W)}mm" height="${r(H)}mm"><defs>${defs.join('')}</defs>${out.join('\n')}</svg>`;
}

/** stains, scuffs, folds; per style: charcoal smudges (pearl), scorch (revenge), tide marks and weed (dutch) */
function sheetLife(o: ChartOpts, L: Look, id: string, rnd: () => number): string {
  const W = o.w, H = o.h, out: string[] = [];
  // folds: a light ridge and a shadow beside it
  const fx = o.folds?.x ?? [W / 2], fy = o.folds?.y ?? [H / 2];
  for (const x of fx) out.push(`<rect x="${r(x - 0.4)}" y="0" width=".5" height="${H}" fill="#fff" opacity=".28"/><rect x="${r(x + 0.1)}" y="0" width="2.4" height="${H}" fill="#3a2410" opacity=".1" filter="url(#${id}soft2)"/>`);
  for (const y of fy) out.push(`<rect x="0" y="${r(y - 0.4)}" width="${W}" height=".5" fill="#fff" opacity=".25"/><rect x="0" y="${r(y + 0.1)}" width="${W}" height="2.4" fill="#3a2410" opacity=".09" filter="url(#${id}soft2)"/>`);
  // stains: irregular blots with a darker tide line
  const n = Math.round(3 * L.stains + 1);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = rnd() * H, R = 8 + rnd() * 18, c = o.style === 'dutch' ? '#3f5a3a' : '#7a4a1c';
    out.push(`<g filter="url(#${id}blot)"><circle cx="${r(x)}" cy="${r(y)}" r="${r(R)}" fill="${c}" opacity="${r(0.05 + rnd() * 0.05)}"/><circle cx="${r(x)}" cy="${r(y)}" r="${r(R)}" fill="none" stroke="${c}" stroke-width=".9" opacity="${r(0.14 + rnd() * 0.08)}"/></g>`);
  }
  // a ring of a mug (pearl, revenge)
  if (o.style === 'pearl' || o.style === 'revenge' || o.style === 'plain') { const x = W * (0.12 + rnd() * 0.2), y = H * (0.6 + rnd() * 0.25); out.push(`<g filter="url(#${id}blot)"><circle cx="${r(x)}" cy="${r(y)}" r="11" fill="none" stroke="#6a3c14" stroke-width="1.1" opacity=".18"/><circle cx="${r(x + 1)}" cy="${r(y + 0.6)}" r="10.4" fill="none" stroke="#6a3c14" stroke-width=".4" opacity=".14"/></g>`); }
  // scuffs: pale worn patches
  for (let i = 0; i < Math.round(6 * L.wear); i++) out.push(`<ellipse cx="${r(rnd() * W)}" cy="${r(rnd() * H)}" rx="${r(6 + rnd() * 16)}" ry="${r(3 + rnd() * 7)}" fill="#fff8e8" opacity="${r(0.07 + rnd() * 0.08)}" filter="url(#${id}blot)"/>`);
  if (o.style === 'pearl') for (let i = 0; i < 3; i++) out.push(`<ellipse cx="${r(rnd() * W)}" cy="${r(rnd() * H)}" rx="${r(5 + rnd() * 9)}" ry="${r(2 + rnd() * 3)}" fill="#1a1a1a" opacity=".07" filter="url(#${id}blot)" transform="rotate(${r(rnd() * 60 - 30)})"/>`);
  if (o.style === 'dutch') {
    // tide marks: irregular blooms of salt and weed, not bands
    for (let i = 0; i < 7; i++) { const x = rnd() * W, y = rnd() * H, R = 6 + rnd() * 14; out.push(`<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(R * (1 + rnd()))}" ry="${r(R * 0.7)}" fill="none" stroke="${i % 2 ? '#e8f0dc' : '#3e6a45'}" stroke-width="${r(0.6 + rnd())}" opacity="${r(0.2 + rnd() * 0.15)}" filter="url(#${id}blot)"/>`); }
    for (let i = 0; i < 5; i++) out.push(`<ellipse cx="${r(rnd() * W)}" cy="${r(H * (0.75 + rnd() * 0.3))}" rx="${r(20 + rnd() * 40)}" ry="${r(8 + rnd() * 14)}" fill="#3e6a45" opacity="${r(0.07 + rnd() * 0.07)}" filter="url(#${id}blot)"/>`);
  }
  return out.join('');
}
/** the edge of the sheet over the table: darker worn rim; scorched (revenge); barnacles (dutch); a gilt rule (endeavour) */
function edgeOf(o: ChartOpts, sheet: string, L: Look, id: string, rnd: () => number): string {
  const out: string[] = [], W = o.w, H = o.h;
  out.push(`<path d="${sheet}" fill="none" stroke="#3a2410" stroke-opacity=".35" stroke-width="2.4" filter="url(#${id}soft2)" clip-path="url(#${id}sh)"/>`);
  if (o.style === 'revenge') out.push(`<g clip-path="url(#${id}sh)"><path d="${sheet}" fill="none" stroke="#1a0a04" stroke-width="5" opacity=".75" filter="url(#${id}blot)"/><path d="${sheet}" fill="none" stroke="#6a2a0c" stroke-width="10" opacity=".35" filter="url(#${id}blot)"/></g>`);
  if (o.style === 'endeavour') { const m = (o.inset ?? 0) + 3.5; out.push(`<rect x="${m}" y="${m}" width="${r(W - 2 * m)}" height="${r(H - 2 * m)}" fill="none" stroke="#a8812e" stroke-width=".9"/><rect x="${m + 1.4}" y="${m + 1.4}" width="${r(W - 2 * m - 2.8)}" height="${r(H - 2 * m - 2.8)}" fill="none" stroke="#1f2a3a" stroke-width=".25"/>`); }
  if (o.style === 'dutch') {
    let b = '';
    for (let i = 0; i < 70; i++) {
      const side = Math.floor(rnd() * 4), t = rnd(), m = (o.inset ?? 0) + 1.2 + rnd() * 3, x = side === 0 ? t * W : side === 1 ? W - m : side === 2 ? t * W : m, y = side === 0 ? m : side === 1 ? t * H : side === 2 ? H - m : t * H, R = 0.6 + rnd() * 1.4;
      b += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(R)}" fill="#cfcbb4" stroke="#2a2f28" stroke-width=".2"/><circle cx="${r(x)}" cy="${r(y)}" r="${r(R * 0.4)}" fill="#3a4038"/>`;
    }
    out.push(`<g clip-path="url(#${id}sh)">${b}</g>`);
  }
  return out.join('');
}
/** the title in a scrolled cartouche */
function cartouche(b: Rect, L: Look, id: string): string {
  const { x, y, w, h } = b;
  return `<g><path d="M${x + 6} ${y}H${x + w - 6}C${x + w - 2} ${y} ${x + w} ${y + 3} ${x + w + 3} ${y + 2}C${x + w + 1} ${y + h / 2} ${x + w + 1} ${y + h / 2} ${x + w + 3} ${y + h - 2}C${x + w} ${y + h - 3} ${x + w - 2} ${y + h} ${x + w - 6} ${y + h}H${x + 6}C${x + 2} ${y + h} ${x} ${y + h - 3} ${x - 3} ${y + h - 2}C${x - 1} ${y + h / 2} ${x - 1} ${y + h / 2} ${x - 3} ${y + 2}C${x} ${y + 3} ${x + 2} ${y} ${x + 6} ${y}Z" fill="${L.paper}" stroke="${L.ink}" stroke-width=".5"/>
<rect x="${x + 3}" y="${y + 2.4}" width="${w - 6}" height="${h - 4.8}" rx="1.2" fill="none" stroke="${L.ink}" stroke-width=".2"/>
${TXT.title.split(' y ').map((t, i, a) => `<text x="${x + w / 2}" y="${r(y + h * (a.length > 1 ? 0.45 + i * 0.3 : 0.6))}" text-anchor="middle" font-family="Old Standard TT" font-style="italic" font-size="${r(h * 0.2)}" fill="${L.ink}">${i ? 'y ' : ''}${t}</text>`).join('')}</g>`;
}

export const CHART_NOTES = TXT.notes;
/** where a place (lon, lat) falls in the box of a chart, mm */
export const chartPoint = (o: Pick<ChartOpts, 'w' | 'h' | 'center' | 'mmPerDeg'>, lon: number, lat: number): Pt => toMm(o as ChartOpts)(lon, lat);
