// «Чёрная жемчужина» — the material of its board: tarred dark wood, rope, a worn sea chart, Jack's compass.
// A («у борта»): a close-up of the Pearl's own side by moonlight, baked from the kit ship; the rows lie on her parts —
// Sails on the main course, Crew on the rail, Guns over open ports (a port under every Guns cell and under «Залп дан»),
// Hull on the planking. The ship stays open round the rows: the frame lays only tight plates under the words and the
// numbers, the cells are set into her side. Right column: a worn chart on
// tarred planks and the compass that does not point north. The back: the Pearl on the sea floor by night.
// The interface is at the top of frame.ts; the shared helpers are in paint.ts.
import type { Geo, Kit, Layers, Rect, ShipMaterial, WreckGeo } from './frame';
import { compass, planks, rng, sheet, simpleMaterial } from './paint';

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
  const guns = g.rows.find(rw => rw.key === 'guns')!, vol = g.slots.find(s => s.kind === 'volley')!;
  // mm per ship unit: the port row (h 9.4 of the Pearl) on the Guns cells; the rail lands at the foot of the Crew cells
  const sMM = 6.5, H = 9.4, WL = guns.cy + H * sMM, mainAt = 158, focus = 10 - (mainAt - (P.x + P.w / 2)) / sMM;
  const X = (mm: number) => focus + (mm - (P.x + P.w / 2)) / sMM;
  const pitchA = (guns.cells[1].cx - guns.cells[0].cx) / sMM, wPort = 13.9 / sMM;
  // the second row: the port under «Залп дан», then on along the side at a wider pitch (the free middle column shows two)
  const vx = vol.x + vol.w / 2, pitchB = 36.5;
  const rowA: PortRow = { h: H, n: guns.cells.length, x0: X(guns.cells[0].cx), x1: X(guns.cells[0].cx) + pitchA * (guns.cells.length - 1), w: wPort, off: 0, hk: 0.96 };
  const rowB: PortRow = { h: H, n: 4, x0: X(vx), x1: X(vx + 3 * pitchB), w: wPort, off: 0, hk: 0.96 };
  const L = K.makeLight({ time: 'night', haze: 0.3, key: { type: 'moon', az: 118, el: 30, color: '#c6d8f6', power: 0.95 }, fill: { color: '#3d5680', power: 0.5 }, rim: { az: 40, color: '#bfe0ff', power: 0.55 } }, { horizon: uy(WL) - 30 });
  const spec = (K.SHIP_SPECS as unknown as Record<string, { ports: PortRow[] }>).pearl, saved = spec.ports;
  let body: string;
  try {
    spec.ports = [rowA, saved[1], rowB];
    body = K.ship('bo2pa', L, { kind: 'pearl', x: ux(P.x + P.w / 2 - focus * sMM), y: uy(WL), scale: sMM / k, sails: 'full', heel: 0, seed: 11, detail: 'near' });
  } finally { spec.ports = saved; }
  const W = 200 + 2 * b, Hh = 280 + 2 * b, R = rng(41);
  let stars = '';
  for (let i = 0; i < 70; i++) { const sx = -b + R() * W, sy = -b + R() * (uy(WL) - 60 + b), sr = 0.12 + R() * R() * 0.45; stars += `<circle cx="${r(sx)}" cy="${r(sy)}" r="${r(sr)}" fill="#e8f0ff" fill-opacity="${r(0.35 + R() * 0.55)}"/>`; }
  // the moon behind the middle column: its halo lights the sky through the holes of the black sails
  const mx = ux(186), my = uy(44);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${Hh}"><defs>` +
    `<linearGradient id="pksky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1322"/><stop offset=".45" stop-color="#18294a"/><stop offset="1" stop-color="#3a5878"/></linearGradient>` +
    `<filter id="pklift" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" exponent=".58"/><feFuncG type="gamma" exponent=".58"/><feFuncB type="gamma" exponent=".6"/></feComponentTransfer></filter>` +
    `<radialGradient id="pkmoon" cx="${r(mx)}" cy="${r(my)}" r="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#dce8ff" stop-opacity=".75"/><stop offset=".12" stop-color="#9fb8dc" stop-opacity=".45"/><stop offset=".5" stop-color="#4c6890" stop-opacity=".18"/><stop offset="1" stop-color="#4c6890" stop-opacity="0"/></radialGradient></defs>` +
    `<g filter="url(#pklift)"><rect x="${-b}" y="${-b}" width="${W}" height="${Hh}" fill="url(#pksky)"/>${stars}<rect x="${-b}" y="${-b}" width="${W}" height="${Hh}" fill="url(#pkmoon)"/>` +
    `<circle cx="${r(mx)}" cy="${r(my)}" r="9" fill="#f2f5ff"/><circle cx="${r(mx + 2.5)}" cy="${r(my - 1.5)}" r="2.2" fill="#c9d3e6" fill-opacity=".6"/><circle cx="${r(mx - 3)}" cy="${r(my + 2.6)}" r="1.5" fill="#c9d3e6" fill-opacity=".5"/>` +
    body + `</g></svg>`;
  const url = await g.art('board-pearl-side', svg, b), id = `${g.uid}pc`, vg = `${g.uid}pv`;
  // a soft vignette over the JPEG (an SVG layer, no CSS): the eye stays on the rows and the open ports
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath>` +
    `<radialGradient id="${vg}" cx=".55" cy=".55" r=".75"><stop offset=".55" stop-color="#05070c" stop-opacity="0"/><stop offset="1" stop-color="#05070c" stop-opacity=".55"/></radialGradient></defs>` +
    `<g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(Hh * k)}" preserveAspectRatio="none"/>` +
    `<rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" fill="url(#${vg})"/></g>`;
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
  parts.push(await sideArt(g));
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

// B («стол капитана»): the shared simple material in the Pearl's colours (this file paints A and the back)
const simple = simpleMaterial({
  wood: TAR, band: '#26221F', hair: '#b8893a',
  sky: ['#c9cfd2', '#eef0ea'], sea: ['#5d7880', '#2f444c'], focus: 4,
  chart: { paper: '#efe2c4', line: '#c7b48a', coast: '#e0cfa2' }, brass: BRASS,
  note: '#fffaf0', noteLine: '#c9b27a', pin: '#3a3a40',
  extraB: g => cord(`M${r(g.zones.col.x - 1.8)} 30V172`, 1.6, { color: '#c4a676', dark: '#5a4630' }),
  wreck: { water: ['#4f6b70', '#1d2c31'], sand: '#a99a7a', sandDark: '#6e6250' }
});

export const material: ShipMaterial = { a: faceA, b: simple.b, wreck: wreckPearl };
