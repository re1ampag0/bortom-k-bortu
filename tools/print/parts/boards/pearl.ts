// «Чёрная жемчужина» — the material of its board: tarred dark wood, rope, a worn sea chart, Jack's compass.
// A («у борта»): a close-up of the Pearl's own side by moonlight, baked from the kit ship; the rows lie on her parts —
// Sails on the main course, Crew on the rail, Guns in painted open ports wider than the cells (every Guns cell and «Залп дан»),
// Hull on the planking. The ship stays open round the rows: the frame lays only tight plates under the words and the
// numbers, the cells are set into her side. Right column: a worn chart on
// tarred planks and the compass that does not point north. The back: the Pearl on the sea floor by night.
// B («стол капитана»): a worn chart over tarred planks, the rows as knotted log-lines, the Pearl as a pinned print.
// The interface is at the top of frame.ts; the shared helpers are in paint.ts.
import { ENGRAVING, type Geo, type Kit, type Layers, type Rect, type ShipMaterial, type WreckGeo } from './frame';
import { compass, engraving, planks, rng, sheet } from './paint';

const r = (n: number) => Math.round(n * 100) / 100;
type KFn = (u: string, L: unknown, o: Record<string, unknown>) => string;
const kf = (K: Kit, name: string) => K[name] as KFn;

// ---- the Pearl's colours ----
const TAR = { base: '#221c18', seam: '#0b0807', grain: '#362d27', nails: '#5f5244' };
const BAND = '#120e0c', HAIR = '#a8813f';
const BRASS = { light: '#f3d68c', mid: '#bf9241', dark: '#5e4214' };
const PAPER = { light: '#eadbb6', dark: '#d2ba88', line: '#9c8556', edge: '#6b4a22', ink: '#4a3520' };
const ROPE = { color: '#a88a5c', dark: '#3e3020' };

/** a laid rope along a path (any SVG path in mm): body, twist, a dark under-edge */
function cord(d: string, w: number, c = ROPE): string {
  return `<path d="${d}" fill="none" stroke="${c.dark}" stroke-width="${r(w + 0.45)}" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${c.color}" stroke-width="${w}" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${c.dark}" stroke-width="${r(w * 0.8)}" stroke-dasharray="${r(w * 0.22)} ${r(w * 0.62)}" stroke-opacity=".55"/>` +
    `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${r(w * 0.18)}" stroke-opacity=".18" transform="translate(0 ${r(-w * 0.22)})"/>`;
}
/** a whipping: a few turns of tarred twine round a rope end or a joint */
const whip = (x: number, y: number, w: number, vertical: boolean) => {
  let s = '';
  for (let i = -1; i <= 1; i++) s += vertical
    ? `<line x1="${r(x - w * 0.75)}" y1="${r(y + i * 0.55)}" x2="${r(x + w * 0.75)}" y2="${r(y + i * 0.55 - 0.2)}" stroke="#1a120c" stroke-width=".38"/>`
    : `<line x1="${r(x + i * 0.55)}" y1="${r(y - w * 0.75)}" x2="${r(x + i * 0.55 + 0.2)}" y2="${r(y + w * 0.75)}" stroke="#1a120c" stroke-width=".38"/>`;
  return s;
};

// ---- A: the close-up of the side ----
/** port rows of the kit spec, set for the board only while the picture is drawn */
interface PortRow { h: number; n: number; x0: number; x1: number; w: number; off?: number; hk?: number }
async function sideArt(g: Geo): Promise<string> {
  const P = g.zones.picture, K = g.kit, k = 0.7, b = Math.ceil(Math.max(0, (P.w / k - 200) / 2, (P.h / k - 280) / 2)) + 2;
  const ux = (x: number) => (x - P.x) / k - b, uy = (y: number) => (y - P.y) / k - b;
  const guns = g.rows.find(rw => rw.key === 'guns')!;
  // mm per ship unit: the port row (h 9.4 of the Pearl) on the Guns cells; the rail lands at the foot of the Crew cells
  const sMM = 6.5, H = 9.4, WL = guns.cy + H * sMM, mainAt = 158, focus = 10 - (mainAt - (P.x + P.w / 2)) / sMM;
  const X = (mm: number) => focus + (mm - (P.x + P.w / 2)) / sMM;
  // the ports are painted over the picture (pearlPorts): wider than the cells, they would overlap at the cells' pitch
  // in the kit; the kit draws no port of the row (n: 0), only the small ones of the quarterdeck
  const none: PortRow = { h: H, n: 0, x0: 0, x1: 1, w: 2.6, off: 0 };
  // a brighter moon and a lifted night: the course reads as pale canvas behind the Sails row, the planking under the Hull
  const L = K.makeLight({ time: 'night', haze: 0.25, key: { type: 'moon', az: 118, el: 30, color: '#d4e2fa', power: 1.2 }, fill: { color: '#5a7298', power: 0.7 }, rim: { az: 40, color: '#cfe6ff', power: 0.6 } }, { horizon: uy(WL) - 30 });
  const spec = (K.SHIP_SPECS as unknown as Record<string, { ports: PortRow[]; sail: string }>).pearl, saved = spec.ports, sail = spec.sail;
  let body: string;
  try {
    // this picture only: the moonlit course a lighter weathered black than her coal sails, so the canvas reads
    spec.ports = [none, saved[1], none]; spec.sail = 'ship-sail-black';
    body = K.ship('bo2pa', L, { kind: 'pearl', x: ux(P.x + P.w / 2 - focus * sMM), y: uy(WL), scale: sMM / k, sails: 'full', heel: 0, seed: 11, detail: 'near' });
  } finally { spec.ports = saved; spec.sail = sail; }
  const W = 200 + 2 * b, Hh = 280 + 2 * b, R = rng(41);
  let stars = '';
  for (let i = 0; i < 70; i++) { const sx = -b + R() * W, sy = -b + R() * (uy(WL) - 60 + b), sr = 0.12 + R() * R() * 0.45; stars += `<circle cx="${r(sx)}" cy="${r(sy)}" r="${r(sr)}" fill="#e8f0ff" fill-opacity="${r(0.35 + R() * 0.55)}"/>`; }
  // the moon behind the middle column: its halo lights the sky through the holes of the black sails
  const mx = ux(186), my = uy(44);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${Hh}"><defs>` +
    `<linearGradient id="pksky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1322"/><stop offset=".45" stop-color="#18294a"/><stop offset="1" stop-color="#3a5878"/></linearGradient>` +
    `<filter id="pklift" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" exponent=".44"/><feFuncG type="gamma" exponent=".44"/><feFuncB type="gamma" exponent=".47"/></feComponentTransfer></filter>` +
    `<radialGradient id="pkmoon" cx="${r(mx)}" cy="${r(my)}" r="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#dce8ff" stop-opacity=".75"/><stop offset=".12" stop-color="#9fb8dc" stop-opacity=".45"/><stop offset=".5" stop-color="#4c6890" stop-opacity=".18"/><stop offset="1" stop-color="#4c6890" stop-opacity="0"/></radialGradient></defs>` +
    `<g filter="url(#pklift)"><rect x="${-b}" y="${-b}" width="${W}" height="${Hh}" fill="url(#pksky)"/>${stars}<rect x="${-b}" y="${-b}" width="${W}" height="${Hh}" fill="url(#pkmoon)"/>` +
    `<circle cx="${r(mx)}" cy="${r(my)}" r="9" fill="#f2f5ff"/><circle cx="${r(mx + 2.5)}" cy="${r(my - 1.5)}" r="2.2" fill="#c9d3e6" fill-opacity=".6"/><circle cx="${r(mx - 3)}" cy="${r(my + 2.6)}" r="1.5" fill="#c9d3e6" fill-opacity=".5"/>` +
    body + `</g></svg>`;
  const url = await g.art('board-pearl-side', svg, b), id = `${g.uid}pc`, vg = `${g.uid}pv`;
  // a soft vignette over the JPEG (an SVG layer, no CSS): the eye stays on the rows and the open ports
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath>` +
    `<radialGradient id="${vg}" cx=".55" cy=".55" r=".75"><stop offset=".55" stop-color="#05070c" stop-opacity="0"/><stop offset="1" stop-color="#05070c" stop-opacity=".4"/></radialGradient></defs>` +
    `<g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(Hh * k)}" preserveAspectRatio="none"/>` +
    `<rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" fill="url(#${vg})"/></g>`;
}

/** the open ports (mm): hole and frame round a 13 mm cell; the lid hauled up over it */
const PORT = { w: 19.6, h: 19.2, hole: 16.4, holeH: 16.2 };
const TIMBER = { face: '#3d3833', lit: '#9eabc0', dark: '#0a0908', lid: '#2a2522', iron: '#14161a' };
/** every Guns cell and «Залп дан» sits in an open port of the Pearl, clearly larger than the cell: a dark ring round the
 *  cell, the tarred frame round that, the lid hauled up above (neighbouring cells share one opening — the cells' pitch
 *  is less than a port) */
function pearlPorts(g: Geo): string {
  const guns = g.rows.find(rw => rw.key === 'guns')!, vol = g.slots.filter(s => s.kind === 'volley'), R = rng(5);
  // past «Залп дан» the row goes on along the side at a wider pitch, the guns run out (no cell in them)
  const P = g.zones.picture, extra: Rect[] = [], v = vol[vol.length - 1], pitchB = 36.5;
  for (let x = v.x + v.w / 2 + pitchB; x + PORT.w / 2 < P.x + P.w - 1; x += pitchB) extra.push({ x: x - v.w / 2, y: v.y, w: v.w, h: v.h });
  const cs: Rect[] = [...guns.cells, ...vol, ...extra], cy = guns.cy, frames: string[] = [], holes: string[] = [], lids: string[] = [], lit: string[] = [];
  for (const c of cs) {
    const cx = c.x + c.w / 2, fx = cx - PORT.w / 2, fy = cy - PORT.h / 2, hx = cx - PORT.hole / 2, hy = cy - PORT.holeH / 2;
    frames.push(`<rect x="${r(fx + 0.5)}" y="${r(fy + 0.7)}" width="${PORT.w}" height="${PORT.h}" rx=".9" fill="#000" fill-opacity=".5"/><rect x="${r(fx)}" y="${r(fy)}" width="${PORT.w}" height="${PORT.h}" rx=".9" fill="${TIMBER.face}" stroke="${TIMBER.dark}" stroke-width=".35"/>`);
    lit.push(`M${r(fx + 0.6)} ${r(fy + 0.45)}H${r(fx + PORT.w - 0.6)}M${r(fx + 0.45)} ${r(fy + 0.8)}V${r(fy + PORT.h - 0.8)}`);
    holes.push(`<rect x="${r(hx)}" y="${r(hy)}" width="${PORT.hole}" height="${PORT.holeH}" rx=".7" fill="#040506"/>`);
    // a gun run out in the ports with no cell: the muzzle's swell, the bore, a moonlit rim
    if (extra.includes(c)) holes.push(`<circle cx="${r(cx)}" cy="${r(cy + 1)}" r="4.6" fill="#1b1d21" stroke="#000" stroke-width=".4"/><circle cx="${r(cx)}" cy="${r(cy + 1)}" r="2.1" fill="#020203"/><path d="M${r(cx - 3.6)} ${r(cy - 1.2)}a4.2 4.2 0 0 1 3.4 -2.6" fill="none" stroke="${TIMBER.lit}" stroke-width=".45" stroke-linecap="round" stroke-opacity=".8"/>`);
    // the lid: its inner face up, a little askew, its lit edge, the lanyard to the bulwark
    const lw = Math.min(PORT.hole, 13.8), up = 6.2 + R() * 1.4, lean = (R() - 0.5) * 1.6, x0 = cx - lw / 2, x1 = cx + lw / 2, y0 = fy + 0.2;
    lids.push(`<path d="M${r(x0)} ${r(y0)}L${r(x0 + lean + 0.5)} ${r(y0 - up)}H${r(x1 + lean - 0.5)}L${r(x1)} ${r(y0)}Z" fill="${TIMBER.lid}" stroke="${TIMBER.dark}" stroke-width=".35"/>` +
      `<path d="M${r(x0 + lean + 0.7)} ${r(y0 - up + 0.35)}H${r(x1 + lean - 0.7)}" stroke="${TIMBER.lit}" stroke-width=".35" stroke-opacity=".75"/>` +
      `<path d="M${r(x0 + lean + 2)} ${r(y0 - up)}l-.6 -3M${r(x1 + lean - 2)} ${r(y0 - up)}l.6 -3" stroke="${ROPE.dark}" stroke-width=".3"/>` +
      [x0 + 2.4, x1 - 2.4].map(hx2 => `<rect x="${r(hx2 - 0.5)}" y="${r(y0 - 1.6)}" width="1" height="2.2" fill="${TIMBER.iron}"/>`).join(''));
  }
  return frames.join('') + `<path d="${lit.join('')}" stroke="${TIMBER.lit}" stroke-width=".3" stroke-opacity=".55" fill="none"/>` + holes.join('') + lids.join('');
}
/** the ship between the Fires and the Guns (mm, over the picture): the cap rail along the foot of the Crew cells, the main
 *  channel under it with its deadeyes, the shrouds going up to the mast, the chain plates down the side */
function pearlRigging(g: Geo): string {
  const P = g.zones.picture, crew = g.rows.find(rw => rw.key === 'crew')!, rail = crew.cells[0].y + crew.cells[0].h, out: string[] = [];
  const x0 = crew.cells[crew.cells.length - 1].x + 2, x1 = P.x + P.w;
  // the cap rail and the sheer strake under it
  out.push(`<rect x="${r(x0)}" y="${r(rail - 1.4)}" width="${r(x1 - x0)}" height="2.6" fill="${TIMBER.face}"/><path d="M${r(x0)} ${r(rail - 1.2)}H${r(x1)}" stroke="${TIMBER.lit}" stroke-width=".45" stroke-opacity=".8"/><path d="M${r(x0)} ${r(rail + 1.3)}H${r(x1)}" stroke="${TIMBER.dark}" stroke-width=".6"/>`);
  out.push(`<path d="M${r(x0)} ${r(rail + 4.6)}H${r(x1)}M${r(x0)} ${r(rail + 9)}H${r(x1)}" stroke="${TIMBER.lit}" stroke-width=".25" stroke-opacity=".35"/>`);
  // stanchions of the open rail above the cap (the Pearl's waist): short posts and a hand rail
  for (let x = x0 + 3; x < x1; x += 7.5) out.push(`<rect x="${r(x - 0.45)}" y="${r(rail - 6.8)}" width=".9" height="5.6" fill="${TIMBER.face}"/><path d="M${r(x - 0.3)} ${r(rail - 6.6)}v5.2" stroke="${TIMBER.lit}" stroke-width=".2" stroke-opacity=".6"/>`);
  out.push(`<rect x="${r(x0)}" y="${r(rail - 7.6)}" width="${r(x1 - x0)}" height="1.3" fill="${TIMBER.face}"/><path d="M${r(x0)} ${r(rail - 7.4)}H${r(x1)}" stroke="${TIMBER.lit}" stroke-width=".3" stroke-opacity=".7"/>`);
  // the main channel: a ledge out from the side under the rail, deadeyes on it, shrouds up, chain plates down
  const c0 = Math.max(x0 + 8, g.zones.mid.x + 6), c1 = x1 - 4, cy = rail + 3.4, n = Math.max(3, Math.floor((c1 - c0) / 7.2)), mastX = g.zones.mid.x + 40;
  out.push(`<rect x="${r(c0 - 2)}" y="${r(cy)}" width="${r(c1 - c0 + 4)}" height="2" fill="#000" fill-opacity=".45" transform="translate(.4 .9)"/><rect x="${r(c0 - 2)}" y="${r(cy)}" width="${r(c1 - c0 + 4)}" height="2" fill="${TIMBER.face}" stroke="${TIMBER.dark}" stroke-width=".3"/><path d="M${r(c0 - 1.6)} ${r(cy + 0.3)}H${r(c1 + 1.6)}" stroke="${TIMBER.lit}" stroke-width=".35" stroke-opacity=".8"/>`);
  for (let i = 0; i < n; i++) {
    const x = c0 + (c1 - c0) * (i + 0.5) / n, dy = cy - 1.7, dl = cy - 6.2;
    // the shroud: from the upper deadeye up toward the masthead (out of the picture under the Fires box)
    out.push(`<path d="M${r(x)} ${r(dl - 1.3)}L${r(x + (mastX - x) * 0.16)} ${r(g.zones.mid.y)}" stroke="#08090b" stroke-width=".75"/><path d="M${r(x - 0.2)} ${r(dl - 1.3)}L${r(x - 0.2 + (mastX - x) * 0.16)} ${r(g.zones.mid.y)}" stroke="${TIMBER.lit}" stroke-width=".18" stroke-opacity=".5"/>`);
    // the lanyard between the two deadeyes, the deadeyes
    out.push(`<path d="M${r(x - 0.8)} ${r(dl)}V${r(dy)}M${r(x)} ${r(dl)}V${r(dy)}M${r(x + 0.8)} ${r(dl)}V${r(dy)}" stroke="${ROPE.color}" stroke-width=".25" stroke-opacity=".8"/>`);
    for (const yy of [dl, dy]) out.push(`<circle cx="${r(x)}" cy="${r(yy)}" r="1.25" fill="#1e1a17" stroke="${TIMBER.dark}" stroke-width=".25"/><circle cx="${r(x - 0.3)}" cy="${r(yy - 0.3)}" r=".75" fill="none" stroke="${TIMBER.lit}" stroke-width=".2" stroke-opacity=".6"/>`);
    // the chain plate: an iron strap from the channel down the side, bolted
    out.push(`<path d="M${r(x)} ${r(cy + 2)}L${r(x - 0.4)} ${r(cy + 11.5)}" stroke="${TIMBER.iron}" stroke-width=".7"/><path d="M${r(x + 0.25)} ${r(cy + 2.2)}L${r(x - 0.15)} ${r(cy + 11.3)}" stroke="${TIMBER.lit}" stroke-width=".16" stroke-opacity=".5"/><circle cx="${r(x - 0.4)}" cy="${r(cy + 11.5)}" r=".55" fill="${TIMBER.iron}"/>`);
  }
  return out.join('');
}

// ---- the right column: a worn chart and Jack's compass ----
function wornChart(b: Rect, uid: string, seed: number): string {
  const R = rng(seed), pts: [number, number][] = [], step = 2.6;
  const torn = (t: number, a: number, w: number) => Math.abs(t - a) < w ? (1 - Math.abs(t - a) / w) * 2.6 : 0;
  // round the sheet clockwise; the edge frays in and out, two tears and a lost corner
  const per = 2 * (b.w + b.h);
  for (let s = 0; s < per; s += step) {
    let x: number, y: number, nx: number, ny: number;
    if (s < b.w) { x = b.x + s; y = b.y; nx = 0; ny = 1; }
    else if (s < b.w + b.h) { x = b.x + b.w; y = b.y + s - b.w; nx = -1; ny = 0; }
    else if (s < 2 * b.w + b.h) { x = b.x + b.w - (s - b.w - b.h); y = b.y + b.h; nx = 0; ny = -1; }
    else { x = b.x; y = b.y + b.h - (s - 2 * b.w - b.h); nx = 1; ny = 0; }
    const t = s / per, d = R() * 0.7 + torn(t, 0.36, 0.025) + torn(t, 0.83, 0.02) * 1.4;
    pts.push([x + nx * d, y + ny * d]);
  }
  // the lost corner (lower right)
  const cx = b.x + b.w, cy = b.y + b.h;
  const poly = pts.filter(([x, y]) => !(x > cx - 9 && y > cy - 7 && (cx - x) / 9 + (cy - y) / 7 < 1)).map(p => `${r(p[0])},${r(p[1])}`).join(' ');
  const id = `${uid}ch`, gid = `${uid}chg`, out: string[] = [];
  out.push(`<defs><clipPath id="${id}"><polygon points="${poly}"/></clipPath><linearGradient id="${gid}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${PAPER.light}"/><stop offset="1" stop-color="${PAPER.dark}"/></linearGradient></defs>`);
  out.push(`<polygon points="${poly}" fill="#000" fill-opacity=".38" transform="translate(.7 .9)"/><polygon points="${poly}" fill="url(#${gid})"/>`);
  const inner: string[] = [];
  for (let x = b.x + 9; x < b.x + b.w; x += 19) inner.push(`<line x1="${r(x)}" y1="${r(b.y)}" x2="${r(x)}" y2="${r(b.y + b.h)}" stroke="${PAPER.line}" stroke-width=".2"/>`);
  for (let y = b.y + 12; y < b.y + b.h; y += 19) inner.push(`<line x1="${r(b.x)}" y1="${r(y)}" x2="${r(b.x + b.w)}" y2="${r(y)}" stroke="${PAPER.line}" stroke-width=".2"/>`);
  // rhumb lines from a hidden rose and from a second one low on the sheet
  for (const [rx, ry] of [[b.x + b.w * 0.45, b.y + b.h * 0.42], [b.x + b.w * 0.82, b.y + b.h * 0.9]]) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; inner.push(`<line x1="${r(rx)}" y1="${r(ry)}" x2="${r(rx + Math.cos(a) * 200)}" y2="${r(ry + Math.sin(a) * 200)}" stroke="${PAPER.line}" stroke-width=".16" stroke-opacity=".8"${i % 2 ? ' stroke-dasharray="1.1 1.2"' : ''}/>`); }
  // a coast along the lower right: the land hatched, two lines of the shore, soundings off it
  let d = `M${r(b.x + b.w + 2)} ${r(b.y + b.h * 0.6)}`, shore: [number, number][] = [];
  for (let y = b.y + b.h * 0.6; y <= b.y + b.h + 2; y += 3) { const x = b.x + b.w - 6 - Math.sin(y / 5.5) * 2.4 - R() * 2.2 - (y - b.y - b.h * 0.6) * 0.22; shore.push([x, y]); }
  d += shore.map(([x, y]) => `L${r(x)} ${r(y)}`).join('') + `L${r(b.x + b.w + 2)} ${r(b.y + b.h + 2)}Z`;
  inner.push(`<path d="${d}" fill="#c9ad74" fill-opacity=".55"/>`);
  for (const off of [0, -1.3, -2.8]) inner.push(`<path d="M${shore.map(([x, y]) => `${r(x + off)} ${r(y)}`).join('L')}" fill="none" stroke="${PAPER.ink}" stroke-width="${off ? 0.15 : 0.3}" stroke-opacity="${off ? 0.5 : 0.85}"/>`);
  for (let i = 0; i < 26; i++) { const y = b.y + b.h * 0.62 + R() * b.h * 0.38, x = b.x + b.w - 14 - R() * 26; inner.push(`<circle cx="${r(x)}" cy="${r(y)}" r=".22" fill="${PAPER.ink}" fill-opacity=".55"/>`); }
  // foxing, a ring of a mug, a tar blot, the fold lines, the worn edge
  for (let i = 0; i < 34; i++) inner.push(`<circle cx="${r(b.x + R() * b.w)}" cy="${r(b.y + R() * b.h)}" r="${r(0.25 + R() * R() * 1.6)}" fill="#8a6634" fill-opacity="${r(0.06 + R() * 0.14)}"/>`);
  inner.push(`<circle cx="${r(b.x + b.w * 0.2)}" cy="${r(b.y + b.h * 0.93)}" r="6.4" fill="none" stroke="#7a5226" stroke-width=".7" stroke-opacity=".2"/><circle cx="${r(b.x + b.w * 0.2 + 0.6)}" cy="${r(b.y + b.h * 0.93 - 0.3)}" r="6.1" fill="none" stroke="#7a5226" stroke-width=".25" stroke-opacity=".25"/>`);
  inner.push(`<ellipse cx="${r(b.x + b.w * 0.9)}" cy="${r(b.y + b.h * 0.08)}" rx="5" ry="3.4" fill="#3a2a1a" fill-opacity=".14"/>`);
  const fx = b.x + b.w * 0.5, fy = b.y + b.h * 0.5;
  inner.push(`<line x1="${r(fx)}" y1="${r(b.y)}" x2="${r(fx)}" y2="${r(b.y + b.h)}" stroke="#fff8e4" stroke-width=".6" stroke-opacity=".5"/><line x1="${r(fx + 0.5)}" y1="${r(b.y)}" x2="${r(fx + 0.5)}" y2="${r(b.y + b.h)}" stroke="#7a5a30" stroke-width=".35" stroke-opacity=".35"/>`);
  inner.push(`<line x1="${r(b.x)}" y1="${r(fy)}" x2="${r(b.x + b.w)}" y2="${r(fy)}" stroke="#fff8e4" stroke-width=".6" stroke-opacity=".5"/><line x1="${r(b.x)}" y1="${r(fy + 0.5)}" x2="${r(b.x + b.w)}" y2="${r(fy + 0.5)}" stroke="#7a5a30" stroke-width=".35" stroke-opacity=".35"/>`);
  inner.push(`<polygon points="${poly}" fill="none" stroke="${PAPER.edge}" stroke-width="4.5" stroke-opacity=".28"/><polygon points="${poly}" fill="none" stroke="${PAPER.edge}" stroke-width="1.4" stroke-opacity=".35"/>`);
  out.push(`<g clip-path="url(#${id})">${inner.join('')}</g><polygon points="${poly}" fill="none" stroke="#3e2a14" stroke-width=".25" stroke-opacity=".7"/>`);
  return out.join('');
}
/** a brass tack */
const tack = (x: number, y: number, id: string) => `<defs><radialGradient id="${id}" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff3c8"/><stop offset=".4" stop-color="${BRASS.mid}"/><stop offset="1" stop-color="${BRASS.dark}"/></radialGradient></defs>` +
  `<circle cx="${r(x + 0.35)}" cy="${r(y + 0.45)}" r="1.3" fill="#000" fill-opacity=".4"/><circle cx="${r(x)}" cy="${r(y)}" r="1.3" fill="url(#${id})" stroke="${BRASS.dark}" stroke-width=".15"/>`;

/** Jack's compass: a brass pocket case open on the chart, its lid laid back, the needle anywhere but north. */
function jackCompass(cx: number, cy: number, R: number, uid: string): string {
  const g1 = `${uid}cb`, g2 = `${uid}cl`, lx = cx + 2 * R + 1.6, out: string[] = [];
  out.push(`<defs><radialGradient id="${g1}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${BRASS.light}"/><stop offset=".5" stop-color="${BRASS.mid}"/><stop offset="1" stop-color="${BRASS.dark}"/></radialGradient>` +
    `<radialGradient id="${g2}" cx=".6" cy=".35" r=".8"><stop offset="0" stop-color="#d9b35e"/><stop offset=".6" stop-color="#9c7330"/><stop offset="1" stop-color="#4e3510"/></radialGradient></defs>`);
  // the lanyard, off to the left and out under the edge of the chart
  out.push(cord(`M${r(cx - R * 0.72)} ${r(cy - R * 0.72)}C${r(cx - R * 1.6)} ${r(cy - R * 1.6)} ${r(cx - R * 2.2)} ${r(cy + R * 0.2)} ${r(cx - R * 2.7)} ${r(cy - R * 0.6)}`, 0.9));
  // shadows
  out.push(`<circle cx="${r(cx + 0.9)}" cy="${r(cy + 1.2)}" r="${R}" fill="#000" fill-opacity=".42"/><circle cx="${r(lx + 0.9)}" cy="${r(cy + 1.2)}" r="${R}" fill="#000" fill-opacity=".38"/>`);
  // the lid laid back: its inside engraved with a sun of sixteen rays
  out.push(`<circle cx="${r(lx)}" cy="${r(cy)}" r="${R}" fill="url(#${g2})" stroke="${BRASS.dark}" stroke-width=".4"/><circle cx="${r(lx)}" cy="${r(cy)}" r="${r(R * 0.86)}" fill="none" stroke="#5e4214" stroke-width=".3"/><circle cx="${r(lx)}" cy="${r(cy)}" r="${r(R * 0.8)}" fill="none" stroke="#f3d68c" stroke-width=".2" stroke-opacity=".6"/>`);
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, l = i % 2 ? 0.45 : 0.68; out.push(`<line x1="${r(lx + Math.cos(a) * R * 0.14)}" y1="${r(cy + Math.sin(a) * R * 0.14)}" x2="${r(lx + Math.cos(a) * R * l)}" y2="${r(cy + Math.sin(a) * R * l)}" stroke="#5e4214" stroke-width="${i % 2 ? 0.2 : 0.32}"/>`); }
  out.push(`<circle cx="${r(lx)}" cy="${r(cy)}" r="${r(R * 0.13)}" fill="none" stroke="#5e4214" stroke-width=".3"/>`);
  // the hinge
  out.push(`<rect x="${r(cx + R - 0.4)}" y="${r(cy - 2.6)}" width="${r(lx - cx - 2 * R + 0.8)}" height="5.2" rx=".5" fill="${BRASS.mid}" stroke="${BRASS.dark}" stroke-width=".3"/><line x1="${r(cx + R - 0.4)}" y1="${r(cy)}" x2="${r(lx - R + 0.4)}" y2="${r(cy)}" stroke="${BRASS.dark}" stroke-width=".25"/>`);
  // the case, the bezel, the card, the needle, the glass
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${R}" fill="url(#${g1})" stroke="${BRASS.dark}" stroke-width=".45"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.86)}" fill="#3a2a12"/>`);
  out.push(compass(cx, cy, r(R * 0.82), { line: '#3a2a18', fill: '#efe3c4', accent: '#7a2a1a' }));
  const a = 118 * Math.PI / 180, nl = R * 0.7, nw = R * 0.1, p = (d: number, s: number) => `${r(cx + Math.cos(a) * d - Math.sin(a) * s)},${r(cy + Math.sin(a) * d + Math.cos(a) * s)}`;
  out.push(`<polygon points="${p(0, nw)} ${p(nl, 0)} ${p(0, -nw)}" fill="#8c2216" stroke="#3a0e08" stroke-width=".15"/><polygon points="${p(0, nw)} ${p(-nl, 0)} ${p(0, -nw)}" fill="#22262e" stroke="#0a0b0e" stroke-width=".15"/>`);
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.08)}" fill="${BRASS.light}" stroke="${BRASS.dark}" stroke-width=".15"/>`);
  out.push(`<path d="M${r(cx - R * 0.62)} ${r(cy - R * 0.35)}A${r(R * 0.72)} ${r(R * 0.72)} 0 0 1 ${r(cx + R * 0.1)} ${r(cy - R * 0.7)}" fill="none" stroke="#ffffff" stroke-width="${r(R * 0.07)}" stroke-opacity=".55" stroke-linecap="round"/>`);
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.84)}" fill="none" stroke="#1e1408" stroke-width=".5" stroke-opacity=".5"/>`);
  // the bow (ring) of the case
  out.push(`<circle cx="${r(cx - R * 0.72 - 0.9)}" cy="${r(cy - R * 0.72 - 0.9)}" r="1.4" fill="none" stroke="${BRASS.mid}" stroke-width=".7"/><circle cx="${r(cx - R * 0.72 - 0.9)}" cy="${r(cy - R * 0.72 - 0.9)}" r="1.4" fill="none" stroke="${BRASS.dark}" stroke-width=".15"/>`);
  return out.join('');
}

async function faceA(g: Geo): Promise<Layers> {
  const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 }, P = g.zones.picture, c = g.zones.col;
  const parts: string[] = [];
  parts.push(sheet(g, { band: BAND, line: HAIR, ground: TAR.base, w: 1.2 }));
  parts.push(planks(F, { ...TAR, h: 10.5, seed: 29 }));
  // the right column: the worn chart on the planks, pinned; the compass in the free foot of the column
  const chartBox = { x: c.x + 1.2, y: c.y - 0.6, w: c.w - 2.2, h: c.h + 0.4 };
  parts.push(wornChart(chartBox, g.uid, 17));
  parts.push(tack(chartBox.x + 3, chartBox.y + chartBox.h - 3.2, `${g.uid}t1`) + tack(chartBox.x + chartBox.w - 13, chartBox.y + chartBox.h - 2.6, `${g.uid}t2`));
  parts.push(jackCompass(c.x + 27, c.y + c.h - 18.5, 11.5, g.uid));
  // the picture (the frame's plates go over it, under the words only)
  parts.push(await sideArt(g), pearlRigging(g), pearlPorts(g));
  // a tarred rope round the picture's top and right edge, whipped at the corner and the ends
  const ty = P.y - 0.75, rx = P.x + P.w + 1.05;
  parts.push(cord(`M${r(P.x + 1)} ${r(ty)}H${r(rx)}`, 1.15) + cord(`M${r(rx)} ${r(ty)}V${r(P.y + P.h - 0.4)}`, 1.15));
  parts.push(whip(P.x + 2.4, ty, 1.15, false) + whip(rx, P.y + P.h - 1.8, 1.15, true) + `<circle cx="${r(rx)}" cy="${r(ty)}" r="1.25" fill="${ROPE.color}" stroke="${ROPE.dark}" stroke-width=".45"/>` + whip(rx, ty + 2.2, 1.15, true) + whip(rx - 2.2, ty, 1.15, false));
  // iron nails in the corners of the sheet's band
  const nails = [[10.1, 10.1], [g.page.w - 10.1, 10.1], [10.1, g.page.h - 10.1], [g.page.w - 10.1, g.page.h - 10.1]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".75" fill="#4a4038" stroke="#0a0806" stroke-width=".2"/><circle cx="${r(x - 0.2)}" cy="${r(y - 0.2)}" r=".25" fill="#8a7a68"/>`).join('');
  const s = g.scope;
  return {
    under: parts.join(''), over: nails,
    css: `${s} .bo2-box{box-shadow:.5mm .7mm 0 rgba(0,0,0,.45);border-color:#8f7448}`
  };
}

// ---- the back: the Pearl on the sea floor ----
async function wreckPearl(w: WreckGeo): Promise<Layers> {
  const A = w.zones.art, K = w.kit, k = 0.9, b = Math.ceil(Math.max(0, (A.w / k - 200) / 2)) + 1, W = 200 + 2 * b, H = 280 + 2 * b;
  const ux = (x: number) => (x - A.x) / k - b, uy = (y: number) => (y - A.y) / k - b, R = rng(77);
  const sand = (x: number) => 170 + Math.sin(x / 23) * 2.2 + Math.sin(x / 9 + 1) * 0.8 - Math.max(0, 1 - Math.abs(x - 70) / 45) * 7;   // page mm; a mound over the bow
  const L = K.makeLight({ time: 'night', haze: 0.55, key: { type: 'moon', az: 120, el: 62, color: '#a9d2e2', power: 0.8 }, fill: { color: '#2d4f6a', power: 0.55 }, rim: { az: 60, color: '#9fd6e6', power: 0.35 } }, { horizon: uy(40) });
  const u = 'bo2pw', out: string[] = [];
  const P2 = (x: number, y: number) => `${r(ux(x))} ${r(uy(y))}`;
  out.push(`<defs><linearGradient id="pwwat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a6a7c"/><stop offset=".35" stop-color="#1d3d50"/><stop offset=".75" stop-color="#0f2232"/><stop offset="1" stop-color="#08131c"/></linearGradient>` +
    `<linearGradient id="pwray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeff5" stop-opacity=".55"/><stop offset=".7" stop-color="#9fd0dc" stop-opacity=".12"/><stop offset="1" stop-color="#9fd0dc" stop-opacity="0"/></linearGradient>` +
    `<filter id="pwblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="pwsoft"><feGaussianBlur stdDeviation="1.1"/></filter>` +
    `<linearGradient id="pwsand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f8173"/><stop offset=".35" stop-color="#5d6158"/><stop offset="1" stop-color="#2c302c"/></linearGradient>` +
    `<linearGradient id="pwmurk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3d50" stop-opacity=".6"/><stop offset=".6" stop-color="#132c3c" stop-opacity=".22"/><stop offset="1" stop-color="#0f2232" stop-opacity=".05"/></linearGradient>` +
    `<radialGradient id="pwvig" cx=".55" cy=".45" r=".75"><stop offset=".5" stop-color="#03080c" stop-opacity="0"/><stop offset="1" stop-color="#03080c" stop-opacity=".6"/></radialGradient></defs>`);
  out.push(`<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#pwwat)"/>`);
  // far reef: hazy silhouettes on the horizon of the floor
  let reef = `M${P2(A.x - 5, 175)}`;
  for (let x = A.x - 5; x <= A.x + A.w + 5; x += 6) reef += `L${P2(x, 158 - Math.abs(Math.sin(x / 17)) * 10 - R() * 4 - (x > 200 ? (x - 200) * 0.25 : 0))}`;
  reef += `L${P2(A.x + A.w + 5, 175)}Z`;
  out.push(`<path d="${reef}" fill="#16303d" fill-opacity=".85" filter="url(#pwsoft)"/>`);
  // shafts of light from the surface, from the upper right
  let rays = '';
  for (let i = 0; i < 7; i++) { const x0 = 120 + i * 28 + R() * 12, wd = 5 + R() * 10, dx = -48 - R() * 14; rays += `<path d="M${P2(x0, A.y - 6)}L${P2(x0 + wd, A.y - 6)}L${P2(x0 + wd * 2.4 + dx, 196)}L${P2(x0 + dx, 196)}Z" fill="url(#pwray)" fill-opacity="${r(0.55 + R() * 0.45)}"/>`; }
  out.push(`<g filter="url(#pwblur)">${rays}</g>`);
  // the wreck: listing away (the fouled bottom up), down by the head, the hull cut by the sand
  const s = 1.9;   // scene units per ship unit: the hull ~178 mm long
  out.push(K.ship(u, L, { kind: 'pearl', x: ux(158), y: uy(172), scale: s, sails: 'furled', heel: 7, roll: -15, seed: 31, detail: 'near' }));
  out.push(`<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#pwmurk)"/>`);
  // the floor: the sand, its ripples, the mound over the bow; light dappled on it
  let floor = `M${P2(A.x - 5, sand(A.x - 5))}`;
  for (let x = A.x - 5; x <= A.x + A.w + 5; x += 3) floor += `L${P2(x, sand(x))}`;
  floor += `L${P2(A.x + A.w + 5, 205)}L${P2(A.x - 5, 205)}Z`;
  out.push(`<path d="${floor}" fill="url(#pwsand)"/>`);
  let rip = '';
  for (let i = 0; i < 46; i++) { const y = 174 + R() * 24, x = A.x + R() * A.w, l = 6 + R() * 16; if (y < sand(x) + 2) continue; rip += `<path d="M${P2(x, y)}q${r(l / 2 / k)} ${r(-1.1 / k)} ${r(l / k)} 0" fill="none" stroke="${R() < 0.5 ? '#9a9c8c' : '#262a26'}" stroke-width="${r(0.35 + R() * 0.4)}" stroke-opacity="${r(0.25 + R() * 0.3)}"/>`; }
  let caus = '';
  for (let i = 0; i < 40; i++) { const x = 90 + R() * 190, y = 176 + R() * 20; caus += `<path d="M${P2(x, y)}c${r(2 / k)} ${r(-1 / k)} ${r(4 / k)} ${r(1 / k)} ${r(6 / k)} 0s${r(3 / k)} ${r(1 / k)} ${r(5 / k)} ${r(-0.5 / k)}" fill="none" stroke="#bfe6ee" stroke-width=".5" stroke-opacity="${r(0.12 + R() * 0.2)}"/>`; }
  out.push(rip + caus);
  // the things she lost: a gun off its carriage, shot, a chest burst open, the anchor, a coil, a bottle
  const prop = (name: string, o: Record<string, unknown>) => kf(K, name)(u, L, o);
  out.push(prop('anchor', { x: ux(34), y: uy(186), s: 0.68, rot: 104, seed: 3 }));
  out.push(prop('cannon', { x: ux(78), y: uy(188), s: 0.62, rot: -7, carriage: false, seed: 5, contact: true }));
  for (const [x, y] of [[101, 191], [107, 193], [96, 194.5], [232, 192]]) out.push(prop('shot', { x: ux(x), y: uy(y), s: 0.85, seed: Math.round(x) }));
  out.push(prop('coil', { x: ux(214), y: uy(187), s: 0.7, seed: 7 }));
  out.push(prop('chest', { x: ux(254), y: uy(191), s: 0.78, open: 0.55, gold: true, seed: 9 }));
  out.push(prop('bottle', { x: ux(132), y: uy(193), s: 0.75, lying: true, kind: 'empty', rot: 12, seed: 2 }));
  out.push(prop('rock', { x: ux(20), y: uy(197), w: 26, h: 12, seed: 4 }) + prop('rock', { x: ux(283), y: uy(196), w: 22, h: 14, seed: 8 }));
  // weed off the rail and the floor, swaying the same way
  let weed = '';
  const strand = (x: number, y: number, h: number, c: string, wd: number) => { let d = `M${P2(x, y)}`, cx = x; for (let t = 1; t <= 4; t++) { const ny = y - h * t / 4, nx = x + Math.sin(t * 1.3 + x) * 2.2 + t * 0.9; d += `Q${P2(cx + (t % 2 ? 2.4 : -2.4), y - h * (t - 0.5) / 4)} ${P2(nx, ny)}`; cx = nx; } return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${r(wd / k)}" stroke-linecap="round" stroke-opacity=".85"/>`; };
  for (let i = 0; i < 22; i++) { const x = A.x + 6 + R() * (A.w - 12); weed += strand(x, sand(x) + 1 + R() * 3, 6 + R() * 14, R() < 0.5 ? '#2f4a2c' : '#435a30', 0.5 + R() * 0.6); }
  out.push(weed);
  // the water between us and the floor: the things lie in it, not on the glass
  out.push(`<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="#13293a" fill-opacity=".2"/>`);
  // bubbles from the stern windows, rising out of the picture
  let bub = '';
  for (let i = 0; i < 26; i++) { const t = R(), x = 236 + Math.sin(t * 9) * 4 + R() * 8, y = 140 - t * 128, rr = 0.25 + R() * 0.9; bub += `<circle cx="${r(ux(x))}" cy="${r(uy(y))}" r="${r(rr / k)}" fill="#cfeef5" fill-opacity=".12" stroke="#e4f7fb" stroke-width=".3" stroke-opacity=".55"/>`; }
  out.push(bub);
  // a small shoal in the open water at the upper right
  let fish = '';
  for (let i = 0; i < 9; i++) { const x = 205 + R() * 70, y = 18 + R() * 18, l = 3 + R() * 2.4; const p = (dx: number, dy: number) => P2(x + dx, y + dy);
    fish += `<path d="M${p(0, 0)}Q${p(l * 0.5, -l * 0.32)} ${p(l, 0)}L${p(l * 1.35, -l * 0.25)}L${p(l * 1.3, l * 0.25)}L${p(l, 0)}Q${p(l * 0.5, l * 0.32)} ${p(0, 0)}Z" fill="#0d1d28" fill-opacity=".75"/>`; }
  out.push(fish);
  out.push(`<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#pwvig)"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}">${out.join('')}</svg>`;
  const url = await w.art('board-pearl-wreck', svg, b), id = `${w.uid}wa`;
  // the compass lies in the sand in the foreground, open — painted crisp over the JPEG
  const under = `<defs><clipPath id="${id}"><rect x="${r(A.x)}" y="${r(A.y)}" width="${r(A.w)}" height="${r(A.h)}" rx="2.4"/></clipPath></defs>` +
    `<rect x="${r(A.x - 1.2)}" y="${r(A.y - 1.2)}" width="${r(A.w + 2.4)}" height="${r(A.h + 2.4)}" rx="3" fill="${BAND}"/>` +
    `<g clip-path="url(#${id})"><image href="${url}" x="${r(A.x)}" y="${r(A.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/>` +
    `<g opacity=".92">${jackCompass(166, 189.5, 4.6, `${w.uid}j`)}</g>` +
    `</g>` +
    `<rect x="${r(A.x + 0.6)}" y="${r(A.y + 0.6)}" width="${r(A.w - 1.2)}" height="${r(A.h - 1.2)}" rx="2" fill="none" stroke="${HAIR}" stroke-width=".25" stroke-opacity=".8"/>`;
  return { under };
}

// ---- B («стол капитана»): Jack's table — tarred planks at the edge, a worn chart over all of it, the rows as tarred
// log-lines with a knot between every two cells, the Pearl as an engraving pinned on the chart, brass dividers on a
// printed rose, the compass in the foot of the right column, the abilities as notes tacked to the chart ----
const TARRED = { color: '#76603f', dark: '#261c12' };
const CHART = { paper: '#f4ebd2', line: '#cdb98e', rhumb: '#d3c29b', ink: '#8a6c40', land: '#ecdcb4', fox: '#b08a50' };
const NOTE = { paper: '#fbf4e2', line: '#bfa772', shadow: 'rgba(38,28,18,.42)' };

/** the chart sheet: a frayed edge just inside the frame band, two corners lost to the tarred wood at the bottom */
function chartSheet(g: Geo): string {
  const W = g.page.w, H = g.page.h, R = rng(53), b = { x: 10.3, y: 10.3, w: W - 20.6, h: H - 20.6 }, pts: [number, number][] = [], per = 2 * (b.w + b.h);
  for (let s = 0; s < per; s += 2.2) {
    let x: number, y: number, nx: number, ny: number;
    if (s < b.w) { x = b.x + s; y = b.y; nx = 0; ny = 1; }
    else if (s < b.w + b.h) { x = b.x + b.w; y = b.y + s - b.w; nx = -1; ny = 0; }
    else if (s < 2 * b.w + b.h) { x = b.x + b.w - (s - b.w - b.h); y = b.y + b.h; nx = 0; ny = -1; }
    else { x = b.x; y = b.y + b.h - (s - 2 * b.w - b.h); nx = 1; ny = 0; }
    const d = R() * 0.55;
    pts.push([x + nx * d, y + ny * d]);
  }
  // the lost corners (bottom left, bottom right): only where no word or cell of the frame stands
  const lost = (x: number, y: number) => (x < 36 && y > 190 && (x - 10) / 26 + (198 - y) / 7.5 < 1) || (x > 263 && y > 191 && (W - 10 - x) / 22 + (198 - y) / 6.5 < 1);
  const poly = pts.filter(([x, y]) => !lost(x, y));
  // close the cuts with a ragged tear
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    out.push(poly[i]);
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 4) {
      const n = Math.floor(Math.hypot(q[0] - p[0], q[1] - p[1]) / 1.6);
      for (let k = 1; k < n; k++) { const t = k / n; out.push([p[0] + (q[0] - p[0]) * t + (R() - 0.5) * 0.9, p[1] + (q[1] - p[1]) * t + (R() - 0.5) * 0.9]); }
    }
  }
  const P = out.map(p => `${r(p[0])},${r(p[1])}`).join(' '), id = `${g.uid}bk`, inner: string[] = [];
  // the grid of degrees and the rhumb lines of two roses (one printed, one off the sheet)
  for (let x = 22; x < W - 10; x += 24) inner.push(`<line x1="${x}" y1="10" x2="${x}" y2="${H - 10}" stroke="${CHART.line}" stroke-width=".2"/>`);
  for (let y = 21; y < H - 10; y += 24) inner.push(`<line x1="10" y1="${y}" x2="${W - 10}" y2="${y}" stroke="${CHART.line}" stroke-width=".2"/>`);
  for (const [rx, ry] of [[102, 104], [252, 152]]) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; inner.push(`<line x1="${rx}" y1="${ry}" x2="${r(rx + Math.cos(a) * 320)}" y2="${r(ry + Math.sin(a) * 320)}" stroke="${CHART.rhumb}" stroke-width=".16"${i % 2 ? ' stroke-dasharray="1.1 1.3"' : ''}/>`); }
  // a coast round the foot of the tracks, right of the Hull's cells: land tint, the shore twice, soundings
  const shore: [number, number][] = [];
  for (let y = 137; y <= 171; y += 2.4) shore.push([168 + Math.sin(y / 4.3) * 2.6 + R() * 1.6 - (y - 137) * 0.42, y]);
  inner.push(`<path d="M200 137L${shore.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}L200 171Z" fill="${CHART.land}"/>`);
  for (const off of [0, -1.2, -2.6]) inner.push(`<path d="M${shore.map(([x, y]) => `${r(x + off)} ${r(y)}`).join('L')}" fill="none" stroke="${CHART.ink}" stroke-width="${off ? 0.14 : 0.28}" stroke-opacity="${off ? 0.45 : 0.75}"/>`);
  for (let i = 0; i < 18; i++) { const y = 140 + R() * 28, x = 160 - (y - 137) * 0.42 - 4 - R() * 10; inner.push(`<circle cx="${r(x)}" cy="${r(y)}" r=".2" fill="${CHART.ink}" fill-opacity=".5"/>`); }
  // foxing, a mug ring, the folds
  for (let i = 0; i < 40; i++) inner.push(`<circle cx="${r(12 + R() * (W - 24))}" cy="${r(30 + R() * 140)}" r="${r(0.25 + R() * R() * 1.4)}" fill="${CHART.fox}" fill-opacity="${r(0.05 + R() * 0.1)}"/>`);
  inner.push(`<circle cx="268" cy="132" r="7" fill="none" stroke="#8a6232" stroke-width=".7" stroke-opacity=".18"/><circle cx="268.6" cy="131.7" r="6.7" fill="none" stroke="#8a6232" stroke-width=".25" stroke-opacity=".22"/>`);
  inner.push(`<line x1="148.5" y1="10" x2="148.5" y2="${H - 10}" stroke="#fffaf0" stroke-width=".6" stroke-opacity=".6"/><line x1="149" y1="10" x2="149" y2="${H - 10}" stroke="#9c7c4c" stroke-width=".3" stroke-opacity=".3"/>`);
  inner.push(`<line x1="10" y1="101.5" x2="${W - 10}" y2="101.5" stroke="#fffaf0" stroke-width=".6" stroke-opacity=".6"/><line x1="10" y1="102" x2="${W - 10}" y2="102" stroke="#9c7c4c" stroke-width=".3" stroke-opacity=".3"/>`);
  // the worn edge: a brown burn that stays in the frame band (the words of the rows start at x 11.2)
  inner.push(`<polygon points="${P}" fill="none" stroke="#7a5426" stroke-width="1.6" stroke-opacity=".35"/>`);
  // the printed rose under the dividers
  inner.push(`<g opacity=".8">${compass(102, 104, 12.5, { line: '#b29a6a', fill: CHART.paper, accent: '#8c3a24' })}</g>`);
  return `<defs><clipPath id="${id}"><polygon points="${P}"/></clipPath></defs>` +
    `<polygon points="${P}" fill="#000" fill-opacity=".45" transform="translate(.5 .6)"/><polygon points="${P}" fill="${CHART.paper}"/>` +
    `<g clip-path="url(#${id})">${inner.join('')}</g><polygon points="${P}" fill="none" stroke="#3e2a14" stroke-width=".22" stroke-opacity=".7"/>`;
}

/** a knot on a log-line: a bead of tarred rope, its turns crossing */
function knot(x: number, y: number, w: number): string {
  const rx = w * 0.66, ry = w * 1.08;
  return `<ellipse cx="${r(x + 0.2)}" cy="${r(y + 0.35)}" rx="${r(rx)}" ry="${r(ry)}" fill="#000" fill-opacity=".35"/>` +
    `<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(rx)}" ry="${r(ry)}" fill="${TARRED.color}" stroke="${TARRED.dark}" stroke-width=".35"/>` +
    `<path d="M${r(x - rx * 0.8)} ${r(y - ry * 0.7)}Q${r(x + rx * 0.9)} ${r(y)} ${r(x - rx * 0.8)} ${r(y + ry * 0.7)}M${r(x + rx * 0.8)} ${r(y - ry * 0.7)}Q${r(x - rx * 0.9)} ${r(y)} ${r(x + rx * 0.8)} ${r(y + ry * 0.7)}" fill="none" stroke="${TARRED.dark}" stroke-width=".3"/>` +
    `<path d="M${r(x - rx * 0.35)} ${r(y - ry * 0.8)}Q${r(x + rx * 0.2)} ${r(y - ry * 0.3)} ${r(x - rx * 0.1)} ${r(y + ry * 0.1)}" fill="none" stroke="#ffffff" stroke-width=".25" stroke-opacity=".3"/>`;
}
/** a flat (Flemish) coil: the rope comes in at the top moving right and turns clockwise inwards */
function flemish(cx: number, cy: number, R0: number, w: number): string {
  const step = w + 0.25, pts: string[] = [];
  for (let t = 0; R0 - step * t / (2 * Math.PI) > w * 0.7; t += 0.12) { const rr = R0 - step * t / (2 * Math.PI), a = -Math.PI / 2 + t; pts.push(`${r(cx + Math.cos(a) * rr)} ${r(cy + Math.sin(a) * rr)}`); }
  return `<circle cx="${r(cx + 0.4)}" cy="${r(cy + 0.6)}" r="${r(R0 + w / 2)}" fill="#000" fill-opacity=".28"/>` + cord(`M${pts.join('L')}`, w, TARRED);
}
/** the rows: a tarred log-line runs in over the table edge, under the cells, a knot showing between every two cells */
function logLines(g: Geo): string {
  const out: string[] = [], w = 2.1;
  for (const rw of g.rows) {
    const cy = rw.cy, last = rw.cells[rw.cells.length - 1], end = last.x + last.w;
    const vol = rw.key === 'guns' ? g.slots.filter(s => s.kind === 'volley' || s.kind === 'volley2') : [];
    let x1 = (vol.length ? vol[vol.length - 1] : last).x + 6.5, tail = '';
    if (rw.key === 'hull') {
      // the Hull's line runs out to the right and lies there in a coil on the coast
      const cx = 177, R0 = 7.4, ty = cy + 2.2 - R0;
      tail = cord(`M${r(end - 3)} ${r(cy)}C${r(end + 8)} ${r(cy)} ${r(cx - 9)} ${r(ty)} ${r(cx)} ${r(ty)}`, w, TARRED) + flemish(cx, cy + 2.2, R0, 1.9);
      x1 = end - 3;
    }
    out.push(cord(`M8.4 ${r(cy)}H${r(x1)}`, w, TARRED) + whip(9.4, cy, w, false) + tail);
    // a knot in every gap, one past the last cell (a stopper) and one between the Guns and «Залп дан»
    const xs = rw.cells.slice(1).map((c, i) => (rw.cells[i].x + rw.cells[i].w + c.x) / 2);
    let prev = end;
    for (const s of vol) { xs.push((prev + s.x) / 2); prev = s.x + s.w; }
    if (rw.key !== 'hull') xs.push(prev + 0.55);
    for (const x of xs) out.push(knot(x, cy, w));
  }
  return out.join('');
}
/** brass dividers lying open on the chart: hinge (hx, hy), legs at angles a1, a2 from straight down (degrees) */
function dividers(hx: number, hy: number, a1: number, a2: number, L: number, uid: string): string {
  const id = `${uid}dv`, out: string[] = [`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${BRASS.dark}"/><stop offset=".35" stop-color="${BRASS.light}"/><stop offset=".6" stop-color="${BRASS.mid}"/><stop offset="1" stop-color="${BRASS.dark}"/></linearGradient></defs>`];
  const leg = (a: number, sh: boolean) => {
    const t = a * Math.PI / 180, dx = Math.sin(t), dy = Math.cos(t), px = dy, py = -dx, P = (d: number, s: number) => `${r(hx + dx * d + px * s + (sh ? 0.7 : 0))},${r(hy + dy * d + py * s + (sh ? 0.9 : 0))}`;
    if (sh) return `<polygon points="${P(0, 1.05)} ${P(L * 0.86, 0.45)} ${P(L, 0)} ${P(L * 0.86, -0.45)} ${P(0, -1.05)}" fill="#000" fill-opacity=".35"/>`;
    return `<polygon points="${P(0, 1.05)} ${P(L * 0.86, 0.5)} ${P(L * 0.86, -0.5)} ${P(0, -1.05)}" fill="url(#${id})" stroke="${BRASS.dark}" stroke-width=".22"/>` +
      `<polygon points="${P(L * 0.86, 0.5)} ${P(L, 0)} ${P(L * 0.86, -0.5)}" fill="#a9b0b4" stroke="#3c4246" stroke-width=".18"/>` +
      `<line x1="${P(2, 0).split(',')[0]}" y1="${P(2, 0).split(',')[1]}" x2="${P(L * 0.8, 0).split(',')[0]}" y2="${P(L * 0.8, 0).split(',')[1]}" stroke="#fff3c8" stroke-width=".18" stroke-opacity=".7"/>`;
  };
  out.push(leg(a1, true), leg(a2, true), leg(a1, false), leg(a2, false));
  out.push(`<circle cx="${r(hx + 0.6)}" cy="${r(hy + 0.8)}" r="2.3" fill="#000" fill-opacity=".35"/><circle cx="${r(hx)}" cy="${r(hy)}" r="2.3" fill="${BRASS.mid}" stroke="${BRASS.dark}" stroke-width=".3"/><circle cx="${r(hx)}" cy="${r(hy)}" r="1.5" fill="none" stroke="${BRASS.light}" stroke-width=".25"/><line x1="${r(hx - 0.8)}" y1="${r(hy)}" x2="${r(hx + 0.8)}" y2="${r(hy)}" stroke="${BRASS.dark}" stroke-width=".35"/>`);
  // the knob above the hinge
  out.push(`<rect x="${r(hx - 0.7)}" y="${r(hy - 5)}" width="1.4" height="3" rx=".5" fill="${BRASS.mid}" stroke="${BRASS.dark}" stroke-width=".2"/>`);
  return out.join('');
}
/** the engraving's rect on the page (the frame scales ENGRAVING into its zone, centred) */
function engravingRect(E: Rect): Rect {
  const k = Math.min(E.w / ENGRAVING.w, E.h / ENGRAVING.h), w = ENGRAVING.w * k, h = ENGRAVING.h * k;
  return { x: E.x + (E.w - w) / 2, y: E.y + (E.h - h) / 2, w, h };
}
/** the Pearl as a print: the kit ship baked to sepia by paint.engraving, a plate mark, a sky ruled like a line engraving */
async function pearlPrint(g: Geo): Promise<string> {
  const ink = '#33241a', paper = '#f6eedb';
  const base = await engraving(g, { paper, ink, frame: paper, frameDark: '#4a3622', light: g.kit.LIGHTS.endeavour as Record<string, unknown>, sails: 'full', seed: 5 });
  // where engraving() put its picture and its waterline (its own arithmetic)
  const box = g.kit.shipBox(g.kind, { x: 0, y: 0, scale: 1 }), s = Math.min(176 / box.w, 150 / box.h), h = s * box.h + 24;
  const kk = Math.min((ENGRAVING.w - 8) / 200, (ENGRAVING.h - 8) / h), iy = (ENGRAVING.h - h * kk) / 2, wlE = iy + (s * box.h + 6) * kk;
  let sky = '';
  for (let y = 3.6, i = 0; y < wlE - 0.6; y += 0.7, i++) sky += `<line x1="3.4" y1="${r(y)}" x2="${ENGRAVING.w - 3.4}" y2="${r(y)}" stroke="${ink}" stroke-width=".12" stroke-opacity="${r(0.42 - 0.3 * (y - 3.6) / (wlE - 4.2))}"/>`;
  const E = ENGRAVING;
  return base + sky +
    `<rect x="4.2" y="4.2" width="${E.w - 8.4}" height="${E.h - 8.4}" fill="none" stroke="#a48a5c" stroke-width=".3"/><rect x="4.6" y="4.6" width="${E.w - 9.2}" height="${E.h - 9.2}" fill="none" stroke="#fffaf0" stroke-width=".25"/>`;
}

async function faceB(g: Geo): Promise<Layers> {
  const W = g.page.w, H = g.page.h, c = g.zones.col, parts: string[] = [];
  // the table: tarred planks inside the frame band; only a strip of it shows round the chart and at its lost corners
  parts.push(sheet(g, { band: BAND, line: HAIR, ground: TAR.base, w: 1.2 }));
  parts.push(planks({ x: 9, y: 9, w: W - 18, h: H - 18 }, { ...TAR, h: 10.5, seed: 61 }));
  parts.push(chartSheet(g));
  // the dividers on the printed rose, left of the print
  parts.push(dividers(104, 89, -12, 15, 34, g.uid));
  // a rope down between the middle and the right column, whipped at its ends
  const vx = c.x - 1.9;
  parts.push(cord(`M${r(vx)} 29V171.5`, 1.5, TARRED) + whip(vx, 34, 1.5, true) + whip(vx, 168, 1.5, true));
  // the rows as log-lines
  parts.push(logLines(g));
  // the print's shadow on the chart
  const E = g.zones.engraving, pr = E ? engravingRect(E) : null;
  if (pr) parts.push(`<rect x="${r(pr.x + 0.9)}" y="${r(pr.y + 1.1)}" width="${r(pr.w - 1)}" height="${r(pr.h - 1)}" rx="1" fill="#000" fill-opacity=".35"/>`);
  // Jack's compass, open in the foot of the right column (under the notes if they ever grow down to it)
  parts.push(jackCompass(c.x + 26, c.y + c.h - 15, 11, `${g.uid}bj`));
  const engr = await pearlPrint(g);
  // over: iron nails in the band's corners, brass tacks in the print's top corners
  const nails = [[10.1, 10.1], [W - 10.1, 10.1], [10.1, H - 10.1], [W - 10.1, H - 10.1]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".75" fill="#4a4038" stroke="#0a0806" stroke-width=".2"/><circle cx="${r(x - 0.2)}" cy="${r(y - 0.2)}" r=".25" fill="#8a7a68"/>`).join('');
  const k = pr ? pr.w / ENGRAVING.w : 1, tacks = pr ? tack(pr.x + 2 * k, pr.y + 2 * k, `${g.uid}bt1`) + tack(pr.x + pr.w - 2 * k, pr.y + 2 * k, `${g.uid}bt2`) : '';
  // the column clips what stands above its top: the abilities' tack sits inside its note, right of the heading
  const s = g.scope, pin = (x: string, y = '-1.15mm') => `content:'';position:absolute;left:${x};top:${y};width:2.5mm;height:2.5mm;margin-left:-1.25mm;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3c8 0,${BRASS.mid} 42%,${BRASS.dark} 100%);box-shadow:.35mm .45mm 0 rgba(0,0,0,.4)`;
  const css = `${s} .bo2-box{background:${NOTE.paper};border:.25mm solid ${NOTE.line};border-radius:.5mm;box-shadow:.6mm .9mm 0 ${NOTE.shadow}}` +
    `${s} .bo2-ab{transform:rotate(-.4deg)}${s} .bo2-ptr{transform:rotate(.45deg)}${s} .bo2-legend{transform:rotate(-.3deg)}${s} .bo2-powder{transform:rotate(.35deg)}` +
    `${s} .bo2-box::before{${pin('50%')}}${s} .bo2-ab::before{${pin('calc(100% - 3.4mm)', '.5mm')}}`;
  return { under: parts.join(''), over: nails + tacks, css, engraving: engr };
}

export const material: ShipMaterial = { a: faceA, b: faceB, wreck: wreckPearl };
