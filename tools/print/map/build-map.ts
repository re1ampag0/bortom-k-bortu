// The coastlines of the Caribbean for the printed boards (docs/tasks — boards v2, «КАРТА — ГЛАВНОЕ»):
//   npx vite-node tools/print/map/build-map.ts [-- --src <dir with ne_10m_land.geojson>]
// Downloads Natural Earth 1:10m land + minor islands (public domain, github.com/nvkelso/natural-earth-vector) into
// report/print-kit/refs/ne/ (git-ignored, ≈ 11 MB), clips them to the Caribbean frame, simplifies, projects (Mercator)
// and writes the small tools/print/map/caribbean.json that the print kit reads. The source never goes to git.
//
// Units of caribbean.json: x = (lon − LON0) × 10, y = (Ymerc(LAT1) − Ymerc(lat)) × 10, Ymerc in degrees — so one degree of
// longitude is 10 units everywhere, north is up, (0, 0) is the north-west corner of the frame.
// After the projection the «cinematic» bends of the scale are applied (BENDS): Tortuga larger and a little off the coast,
// so the channel reads at the size of a board. They are explicit and listed below.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRAME, project } from './proj';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const args = process.argv.slice(2);
const SRC = args.includes('--src') ? args[args.indexOf('--src') + 1] : path.join(ROOT, 'report/print-kit/refs/ne');
const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const FILES = ['ne_10m_land.geojson', 'ne_10m_minor_islands.geojson'];

/** Douglas–Peucker tolerance in units (0.1 unit = 0.01° ≈ 1.1 km) and the smallest island kept (units²) */
const TOL = 0.04, MIN_AREA = 0.015;


type Pt = [number, number];
/** Sutherland–Hodgman against the frame (a margin of 0.3° keeps the clipped edges off the visible chart) */
function clip(ring: Pt[]): Pt[] {
  const m = 0.3, edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [];
  const atX = (x: number) => (a: Pt, b: Pt): Pt => [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])];
  const atY = (y: number) => (a: Pt, b: Pt): Pt => [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y];
  const x0 = FRAME.lon0 - m, x1 = FRAME.lon1 + m, y0 = FRAME.lat0 - m, y1 = FRAME.lat1 + m;
  edges.push([p => p[0] >= x0, atX(x0)], [p => p[0] <= x1, atX(x1)], [p => p[1] >= y0, atY(y0)], [p => p[1] <= y1, atY(y1)]);
  let out = ring;
  for (const [inside, cut] of edges) {
    const src = out; out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i], b = src[(i + 1) % src.length];
      if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); } else if (inside(a)) out.push(cut(a, b));
    }
    if (!out.length) break;
  }
  return out;
}
function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!, [ax, ay] = pts[i], [bx, by] = pts[j], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    let best = -1, bd = tol;
    for (let k = i + 1; k < j; k++) { const d = Math.abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / L; if (d > bd) { bd = d; best = k; } }
    if (best > 0) { keep[best] = 1; stack.push([i, best], [best, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
const area = (p: Pt[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const centroid = (p: Pt[]): Pt => { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; };

/** The cinematic bends, applied after the projection: an island chosen by the point (lon, lat) it contains is scaled about
 *  its centre and moved (units). Tortuga is 37 km long; ×1.9 and 1.2 units north it reads as an island of its own. */
const BENDS: { name: string; at: [number, number]; scale: number; move: Pt }[] = [
  { name: 'Tortuga', at: [-72.8, 20.04], scale: 1.9, move: [0, -1.2] },
  { name: 'Île-à-Vache', at: [-73.6, 18.07], scale: 1.4, move: [0, 0] },
  { name: 'Gonâve', at: [-73.05, 18.85], scale: 1.1, move: [0, 0] }
];
function inside(p: Pt[], q: Pt): boolean {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > q[1]) !== (p[j][1] > q[1]) && q[0] < (p[j][0] - p[i][0]) * (q[1] - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  return c;
}

async function source(file: string): Promise<{ features: { geometry: { type: string; coordinates: unknown } }[] }> {
  const full = path.join(SRC, file);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(SRC, { recursive: true });
    console.log(`downloading ${file}…`);
    const res = await fetch(URL + file);
    if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
    fs.writeFileSync(full, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const rings: Pt[][] = [];
for (const file of FILES) {
  for (const f of (await source(file)).features) {
    const g = f.geometry, polys = (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []) as Pt[][][];
    for (const poly of polys) {
      const outer = poly[0];
      // a fast reject by the ring's box
      let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
      for (const [x, y] of outer) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }
      if (b < FRAME.lon0 - 1 || a > FRAME.lon1 + 1 || d < FRAME.lat0 - 1 || c > FRAME.lat1 + 1) continue;
      const cl = clip(outer);
      if (cl.length < 3) continue;
      const pr = simplify(cl.map(([x, y]) => project(x, y)), TOL);
      if (pr.length >= 3 && Math.abs(area(pr)) >= MIN_AREA) rings.push(pr);
    }
  }
}
// minor islands repeat some of the land polygons: drop a ring whose centre lies in a bigger ring
rings.sort((p, q) => Math.abs(area(q)) - Math.abs(area(p)));
const kept: Pt[][] = [];
for (const p of rings) if (!kept.some(k => Math.abs(area(k)) > Math.abs(area(p)) && inside(k, centroid(p)))) kept.push(p);

for (const b of BENDS) {
  const q = project(b.at[0], b.at[1]), ring = kept.find(p => inside(p, q));
  if (!ring) { console.warn(`warning: bend ${b.name}: no island at ${b.at}`); continue; }
  const [cx, cy] = centroid(ring);
  for (const p of ring) { p[0] = cx + (p[0] - cx) * b.scale + b.move[0]; p[1] = cy + (p[1] - cy) * b.scale + b.move[1]; }
}

const [W, H] = project(FRAME.lon1, FRAME.lat0);
const out = {
  _: 'Natural Earth 1:10m land + minor islands (public domain), clipped, simplified, Mercator; built by tools/print/map/build-map.ts — do not edit by hand',
  frame: FRAME, w: Math.round(W * 100) / 100, h: Math.round(H * 100) / 100, bends: BENDS.map(b => b.name),
  /** each ring: x0 y0 x1 y1 … in units, rounded to 0.01 */
  land: kept.map(p => p.flatMap(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]))
};
const file = path.join(HERE, 'caribbean.json');
fs.writeFileSync(file, JSON.stringify(out));
console.log(`caribbean.json: ${kept.length} rings, ${kept.reduce((n, p) => n + p.length, 0)} points, ${(fs.statSync(file).size / 1024).toFixed(0)} KB, ${out.w} × ${out.h} units`);
