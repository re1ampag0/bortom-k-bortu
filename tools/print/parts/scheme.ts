// 04b — the «Схема боя», the centre of the table (A4 landscape, one side). The whole sheet is the engraved chart of the
// Caribbean (tools/print/map/chart.ts, the plain keeping of the stand-alone preview, moved a little east and north so
// the battle lies in the open sea of the Mar del Norte and Tortuga with Hispaniola shows between the plates):
//   - top right: the battle — 2 brass nests of the Company (the far row) facing 2 nests of the Pirates (the near row),
//     each with an opening of 33 mm for the ship token 30 × 30 mm (the side's flag faint in it, under the token) and, on
//     its outer side, a wing of the same brass plate with a niche where the side's flag stands (nothing of a nest's drawing
//     leaves its plate: data-frame / data-deco, check-layout), the side's name plate
//     between its two nests; engraved course lines with a dart at both ends: one straight down between the nests opposite
//     in each pair (no words on it), the two diagonals dashed, the captain's ink note «по диагонали −1» once, on a small
//     paper patch where they cross;
//   - bottom right: three slim brass frames for whole cards (opening 64 × 89 mm) under the battle's nests: the sea deck,
//     the sea card, «Эффекты этого хода», a parchment tab on each with the name and one line;
//   - the left column: the title, the phase of the round (three round medallions on brass seats ≥ 13 mm for the 11 mm mark,
//     laid on a course Море → Пираты → Компания → back), the joint volley, and at the foot the lasting effects on a small
//     cartouche (the open chart above it is where the crew-wide lasting cards lie).
// Light from the upper left: every plate casts a soft shadow down-right. Every plate is marked data-plate, every word
// data-in="<its plate>" (tools/print/check-layout.ts).
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, fontCss, type Ctx, type Part } from '../kit';
import { chartSvg, type Rect } from '../map/chart';
import { rasterJpeg } from '../map/raster';
import { icon, TONE, type IconName } from './icons';
import { brassDisc } from './tokens-art';
import { sideRibbonSvg } from './boards/emblem';
import { measureMissing, widthOf, type TO } from './boards/frame';
import { TOKEN } from '../layout';

export const SCHEME_FILE = '04b-skhema-boya';

interface SchemeText {
  partTitle: string; title: string; tag: string; lead: string; phase: { title: string; sub: string; steps: string[] }; company: string; pirates: string;
  diag: string; joint: string[]; seaDeck: { title: string; lines: string[] }; seaCard: { title: string; lines: string[] };
  effects: { title: string; cards: string[] }; long: { title: string; text: string };
}
const S = (JSON.parse(fs.readFileSync(path.join(HERE, 'text/tokens.json'), 'utf8')) as { scheme: SchemeText }).scheme;
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));
/** a card of the data by its name: the printed names must be exactly the data's */
const cardName = (name: string): string => {
  const all = [...Object.values(data.decks).flat(), ...Object.values(data.legends)];
  if (!all.some(c => c.name === name)) throw new Error(`tokens.json: no card «${name}» in data/game-data.json`);
  return `«${name}»`;
};

// ---- geometry, mm ----
const PAGE = { w: 297, h: 210 };
/** the chart: the preview's scale; Tortuga put at this point of the sheet */
const VIEW = { mmPerDeg: 11.2, anchor: { lon: -72.8, lat: 20.05, x: 124, y: 64 }, inset: 4 };
/** the left column */
const COL = { x: 7, w: 68, top: 6, bottom: 202 };
/** a card frame: a slim brass rim round the opening 64 × 89 (a card 63 × 88 lies in it whole); its tab above */
const SLOT = { w: 66.4, h: 91.4, rim: 1.2, x0: 80, x1: 290, bottom: 202 };
const SLOT_Y = SLOT.bottom - SLOT.h;
const SLOT_XS = [0, 1, 2].map(i => SLOT.x0 + i * (SLOT.w + (SLOT.x1 - SLOT.x0 - 3 * SLOT.w) / 2));
const TAB = { h: 11.6 };
/** a ship nest: brass frame 38 mm, opening 33 mm (the token with 1.5 mm round it); the nests stand over the outer card frames */
const NEST = { size: 38, rim: 2.5, token: TOKEN.shipToken };
const NX = [SLOT_XS[0], SLOT_XS[2]].map(x => x + SLOT.w / 2 - NEST.size / 2);
const NY = { company: 6, pirates: 58 };
/** the phase medallions: the drawn medallion 13.6 mm across on a brass seat 15.8 mm (the 11 mm mark lies on it) */
const MED = { d: 13.6, rim: 1.1, gap: 7.3 };

// ---- colours ----
const INKC = '#2a1c0c';
const NOTE_INK = '#2a2018';
const PIRATES = '#2b2420';
/** the red of the Company's flag, deepened for the name plate and its words */
const COMPANY_RED = '#7c1d15';
const SEA_INK = '#1f4654';
const LOOK = { paper: '#f1e4c2', paperLine: '#5a4024', soft: '#4f3d28', cell: '#f7eed6', cellDeep: '#e3d1a6', brass: ['#f3d68c', '#c4954a', '#5e4214'] as const, patch: '#f3e8cc', halo: '#efe3c6' };
const SIDE = {
  company: { name: S.company, ink: COMPANY_RED, plate: COMPANY_RED, tint: '#f2d2c8' },
  pirates: { name: S.pirates, ink: PIRATES, plate: PIRATES, tint: '#d9d6d2' }
};
type Side = keyof typeof SIDE;

const r = (n: number) => Math.round(n * 100) / 100;
const pt = (n: number) => n * 25.4 / 72;
const W = (s: string, size: number, o: TO = {}) => widthOf(s, size, o);
interface TO2 extends TO { in?: string; name?: string; lh?: number }
const text = (x: number, y: number, s: string, size: number, o: TO2 = {}) => {
  const a = `x="${r(x)}" y="${r(y)}" font-family="${o.font ?? 'Alegreya Sans'}" font-weight="${o.w ?? 500}"${o.italic ? ' font-style="italic"' : ''} font-size="${r(pt(size))}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}`;
  // several lines (\n) are one element: tspans lh mm apart
  const body = s.includes('\n') ? s.split('\n').map((l, i) => `<tspan x="${r(x)}" y="${r(y + i * (o.lh ?? pt(size) * 1.2))}">${esc(l)}</tspan>`).join('') : esc(s);
  return `<text${o.in ? ` data-in="${o.in}"` : ''}${o.name ? ` data-name="${esc(o.name)}"` : ''} ${a} fill="${o.color ?? INKC}">${body}</text>`;
};
/** the largest of the sizes (pt, big to small) at which s is at most maxW wide; all are asked for, so the dry run measures them */
const fitSize = (s: string, sizes: number[], maxW: number, o: TO) => { const ws = sizes.map(z => W(s, z, o)); const i = ws.findIndex(w => w <= maxW); return sizes[i < 0 ? sizes.length - 1 : i]; };
const plateRect = (id: string, b: Rect) => `<rect data-plate="${id}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="none" stroke="none"/>`;
const ico = (name: IconName, cx: number, cy: number, s: number, id: string, op = 1) => `<rect data-plate="${id}" x="${r(cx - s / 2)}" y="${r(cy - s / 2)}" width="${r(s)}" height="${r(s)}" fill="none"/>${op < 1 ? `<g opacity="${op}">` : ''}${icon(name, cx, cy, s, TONE.sepia)}${op < 1 ? '</g>' : ''}`;
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');

// ---- SVG pieces (the manner of the boards v2: brass gradients, parchment slips) ----
const ID = 'sc';
function defs(): string {
  const [bl, bm, bd] = LOOK.brass;
  return `<defs>
<linearGradient id="${ID}br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".42" stop-color="${bm}"/><stop offset=".55" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${ID}brh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".5" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${ID}well" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.cellDeep}"/><stop offset=".22" stop-color="${LOOK.cell}"/><stop offset="1" stop-color="${LOOK.cell}"/></linearGradient>
<linearGradient id="${ID}paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.paper}"/><stop offset="1" stop-color="${mix(LOOK.paper, '#8a6a3a', 0.08)}"/></linearGradient>
</defs>`;
}
/** the shadow of a plate lit from the upper left: offset down-right */
const shadow = (b: Rect, rx: number, op = 0.28) => `<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.75)}" width="${r(b.w)}" height="${r(b.h)}" rx="${rx}" fill="#1a0e04" fill-opacity="${op}"/>`;
/** a slip of parchment on the chart: a soft shadow, a double rule */
function slip(pid: string, b: Rect, op = 0.94): string {
  return shadow(b, 1.4, 0.24) +
    `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="url(#${ID}paper)" fill-opacity="${op}" stroke="${LOOK.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    `<rect x="${r(b.x + 1)}" y="${r(b.y + 1)}" width="${r(b.w - 2)}" height="${r(b.h - 2)}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".6" stroke-width=".18"/>`;
}
/** a small paper patch pasted on the chart for the captain's ink note: a faint shadow, a fine edge, one corner turned */
function patch(pid: string, b: Rect): string {
  const c = 1.6;
  return `<rect x="${r(b.x + 0.35)}" y="${r(b.y + 0.5)}" width="${r(b.w)}" height="${r(b.h)}" rx=".5" fill="#1a0e04" fill-opacity=".17"/>` +
    `<path data-plate="${pid}" d="M${r(b.x + 0.5)} ${r(b.y)}H${r(b.x + b.w - c)}L${r(b.x + b.w)} ${r(b.y + c)}V${r(b.y + b.h - 0.5)}Q${r(b.x + b.w)} ${r(b.y + b.h)} ${r(b.x + b.w - 0.5)} ${r(b.y + b.h)}H${r(b.x + 0.5)}Q${r(b.x)} ${r(b.y + b.h)} ${r(b.x)} ${r(b.y + b.h - 0.5)}V${r(b.y + 0.5)}Q${r(b.x)} ${r(b.y)} ${r(b.x + 0.5)} ${r(b.y)}Z" fill="${LOOK.patch}" stroke="${LOOK.paperLine}" stroke-opacity=".5" stroke-width=".18"/>` +
    `<path d="M${r(b.x + b.w - c)} ${r(b.y)}V${r(b.y + c)}H${r(b.x + b.w)}Z" fill="${LOOK.cellDeep}" stroke="${LOOK.paperLine}" stroke-opacity=".5" stroke-width=".15" stroke-linejoin="round"/>`;
}
const rivet = (x: number, y: number, R = 0.9) => `<circle cx="${r(x)}" cy="${r(y)}" r="${R}" fill="${LOOK.brass[0]}" stroke="${LOOK.brass[2]}" stroke-width=".22"/><circle cx="${r(x - R * 0.3)}" cy="${r(y - R * 0.3)}" r="${r(R * 0.3)}" fill="#fff8e0" fill-opacity=".7"/>`;
/** a brass frame round an opening: the frame is the plate, the opening a clean recessed well */
function frame(pid: string, b: Rect, rim: number, rx: number, well: string): string {
  return shadow(b, rx, 0.32) +
    `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="${rx}" fill="url(#${ID}brh)" stroke="${LOOK.brass[2]}" stroke-width=".3"/>` +
    `<path d="M${r(b.x + rx)} ${r(b.y + 0.35)}H${r(b.x + b.w - rx)}" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".25"/>` +
    `<rect x="${r(b.x + rim)}" y="${r(b.y + rim)}" width="${r(b.w - 2 * rim)}" height="${r(b.h - 2 * rim)}" rx="${r(Math.max(0.6, rx - rim * 0.6))}" fill="${well}" stroke="${LOOK.brass[2]}" stroke-width=".28"/>`;
}
/** a barbed arrowhead in ink, its tip at (x, y), pointing along (ux, uy); the line it ends meets its notch */
const barb = (x: number, y: number, ux: number, uy: number, hd = 2.6, hw = 1.05, ink = NOTE_INK) =>
  `<path d="M${r(x)} ${r(y)}L${r(x - ux * hd - uy * hw)} ${r(y - uy * hd + ux * hw)}L${r(x - ux * hd * 0.62)} ${r(y - uy * hd * 0.62)}L${r(x - ux * hd + uy * hw)} ${r(y - uy * hd - ux * hw)}Z" fill="${ink}"/>`;

// ---- the flags of the sides (own drawings): Company — red and white stripes, a red cross in the white canton; Pirates —
// black, a skull over two crossed sabres. A flag on its staff: the cloth waves (it is drawn flat in (u, v) and bent), its
// folds shaded and hatched like an engraving, its shadow cast down-right; a turned staff with a gilt finial and a halyard ----
let flagSeq = 0;
/** a flag: the staff at x from foot to top, the cloth fw × fh flying to dir (±1) from just under the finial */
function flag(side: Side, x: number, foot: number, top: number, dir: 1 | -1, fw: number, fh: number): string {
  const id = `${ID}fl${flagSeq++}`, sw = Math.max(0.42, fh * 0.075), fin = sw * 1.05, y0 = top + fin * 2 + 0.25;
  const k = 2.1 * Math.PI, amp = fh * 0.085;
  // the wave: none at the hoist, growing to the fly; the fly droops a little
  const lift = (u: number) => amp * Math.sin(u * k - 0.5) * Math.min(1, u * 2.6) + u * u * fh * 0.05;
  const slope = (u: number) => Math.cos(u * k - 0.5) * Math.min(1, u * 2.6);
  const X = (u: number) => x + dir * (sw * 0.5 + u * fw), Y = (u: number, v: number) => y0 + v * fh + lift(u);
  const P = (u: number, v: number) => `${r(X(u))} ${r(Y(u, v))}`;
  /** the cloth between u0..u1, v0..v1, bent with the wave */
  const region = (u0: number, u1: number, v0: number, v1: number) => {
    const n = Math.max(2, Math.ceil((u1 - u0) * 24)), us = Array.from({ length: n + 1 }, (_, i) => u0 + (u1 - u0) * i / n);
    return 'M' + us.map(u => P(u, v0)).join('L') + 'L' + us.reverse().map(u => P(u, v1)).join('L') + 'Z';
  };
  const cloth = region(0, 1, 0, 1);
  const dark = side === 'pirates', out: string[] = [];
  // the shadow of the cloth and of the staff on what lies under them
  out.push(`<path d="${cloth}" transform="translate(${r(fh * 0.07)} ${r(fh * 0.11)})" fill="#1a0e04" fill-opacity=".24"/>`);
  out.push(`<path d="M${r(x + sw * 0.6)} ${r(foot)}V${r(top + fin)}" stroke="#1a0e04" stroke-opacity=".2" stroke-width="${r(sw)}"/>`);
  // the field
  let field = '';
  if (dark) field = `<path d="${cloth}" fill="#1b1714"/>`;
  else {
    const n = 9, cu = 0.42, cv = 5 / n, tb = fh * 0.1;
    field = `<path d="${cloth}" fill="#f4ecdb"/>`;
    for (let i = 0; i < n; i += 2) field += `<path d="${region(i * 2 < n * 2 * cv - 0.01 ? cu : 0, 1, i / n, (i + 1) / n)}" fill="#a8261c"/>`;
    // the canton: white, a red cross upright through it, a fine edge
    const cx = cu / 2, cy = cv / 2, du = tb / fw / 2, dv = tb / fh / 2;
    field += `<path d="${region(0, cu, 0, cv)}" fill="#f6f0e2" stroke="#7c1d15" stroke-width=".08"/>` +
      `<path d="${region(cx - du, cx + du, 0, cv)}${region(0, cu, cy - dv, cy + dv)}" fill="#a8261c"/>`;
  }
  // the emblem of the Pirates: a skull over two crossed sabres, bent a little with the cloth under it
  let emblem = '';
  if (dark) {
    const uc = 0.56, vc = 0.48, s = fh * 0.3, tilt = Math.atan2(slope(uc) * amp * k, fw) * 90 / Math.PI, bone = '#efe6d0', ink = '#1b1714';
    // two sabres crossed behind the skull, points up: a curved blade from the hilt (lower left) to the point (upper right),
    // a crossguard, a knuckle-bow, the grip and its pommel; the second mirrored, each edged dark where they cross
    const bq = (t: number, a: number, c: number, e: number) => (1 - t) * (1 - t) * a + 2 * t * (1 - t) * c + t * t * e;
    const edge = (sg: number) => Array.from({ length: 13 }, (_, j) => {
      const t = j / 12, x = bq(t, -0.62, 0.22, 0.86), y = bq(t, 0.78, 0.22, -0.88), dx = 2 * (1 - t) * 0.84 + 2 * t * 0.64, dy = 2 * (1 - t) * -0.56 + 2 * t * -1.1, l = Math.hypot(dx, dy), w = 0.095 * (1 - t ** 6);
      return `${r(x - dy / l * w * sg)} ${r(y + dx / l * w * sg)}`;
    });
    const blade = `M${edge(1).join('L')}L${edge(-1).reverse().join('L')}Z`, hilt = 'M-.75 .63L-.51 .97M-.63 .8L-.88 .97M-.51 .97Q-.66 1.13 -.9 1';
    const sabre = (m: 1 | -1) => `<g transform="scale(${m} 1)"><path d="${blade}" fill="${bone}" stroke="${ink}" stroke-width=".1" stroke-linejoin="round"/>` +
      `<path d="${hilt}" fill="none" stroke="${ink}" stroke-width=".3" stroke-linecap="round"/><path d="${hilt}" fill="none" stroke="${bone}" stroke-width=".14" stroke-linecap="round"/><circle cx="-.92" cy="1" r=".1" fill="${bone}" stroke="${ink}" stroke-width=".05"/></g>`;
    // the skull over them: the brow, the cheeks, the jaw; deep eyes, the nose, the teeth
    const skull = `<g transform="translate(0 -.2) scale(.74)"><path d="M-.5 -.28C-.5 -.74 -.26 -.98 0 -.98C.26 -.98 .5 -.74 .5 -.28C.5 -.06 .4 .04 .32 .1L.3 .34Q0 .44 -.3 .34L-.32 .1C-.4 .04 -.5 -.06 -.5 -.28Z" fill="${bone}" stroke="${ink}" stroke-width=".1"/>` +
      `<ellipse cx="-.2" cy="-.3" rx=".15" ry=".17" fill="${ink}"/><ellipse cx=".2" cy="-.3" rx=".15" ry=".17" fill="${ink}"/><path d="M0 -.1L-.07 .04H.07Z" fill="${ink}"/>` +
      `<path d="M-.15 .2V.36M0 .21V.38M.15 .2V.36" stroke="${ink}" stroke-width=".05"/><path d="M-.36 -.62Q-.2 -.86 .06 -.88" fill="none" stroke="#fffaf0" stroke-width=".07" stroke-linecap="round"/></g>`;
    emblem = `<g transform="translate(${P(uc, vc)}) rotate(${r(dir * tilt)}) scale(${r(s)})">${sabre(1)}${sabre(-1)}${skull}</g>`;
  }
  // the folds: strips across the cloth darkened where it turns away from the light, lightened where it faces it; the
  // deep folds hatched like an engraving (ink lines on the light cloth, light lines on the black)
  let folds = '', hatch = '';
  const N = 28, hg = 0.42 / fw;
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N, s = slope((u0 + u1) / 2) * dir;
    if (s > 0.12) folds += `<path d="${region(u0, u1 + 0.002, 0, 1)}" fill="#1a0e04" fill-opacity="${r((dark ? 0.35 : 0.24) * s)}"/>`;
    else if (s < -0.12) folds += `<path d="${region(u0, u1 + 0.002, 0, 1)}" fill="#fff8ea" fill-opacity="${r((dark ? 0.16 : 0.2) * -s)}"/>`;
  }
  for (let u = hg; u < 1; u += hg) {
    const s = slope(u) * dir;
    if (!dark && s > 0.6) hatch += `M${P(u, 0)}L${P(u, 1)}`;
    if (dark && s < -0.6) hatch += `M${P(u, 0.04)}L${P(u, 0.96)}`;
  }
  const hatchEl = hatch ? `<path d="${hatch}" fill="none" stroke="${dark ? '#f3ead6' : '#3a1a10'}" stroke-opacity="${dark ? 0.32 : 0.45}" stroke-width=".07"/>` : '';
  out.push(`<clipPath id="${id}"><path d="${cloth}"/></clipPath><g clip-path="url(#${id})">${field}${emblem}${folds}${hatchEl}</g>`);
  out.push(`<path d="${cloth}" fill="none" stroke="#1a120a" stroke-width=".14" stroke-linejoin="round"/>`);
  // the halyard: from the head and the foot of the cloth down the staff to a cleat
  const cl = foot - (foot - y0) * 0.38, hx = x - dir * sw * 0.75;
  out.push(`<path d="M${P(0, 0.02)}L${r(hx)} ${r(y0 + fh * 0.4)}L${r(hx)} ${r(cl)}M${P(0, 0.98)}L${r(hx + dir * 0.1)} ${r(y0 + fh * 1.3)}" fill="none" stroke="#5a4024" stroke-width=".07"/>`);
  // the staff: turned wood, lit on its left; a brass socket at the foot, a cleat, a gilt ball and spike at the top
  out.push(`<path d="M${r(x)} ${r(foot)}V${r(top + fin)}" stroke="#4a2c14" stroke-width="${r(sw)}"/><path d="M${r(x - sw * 0.2)} ${r(foot - 0.3)}V${r(top + fin + 0.3)}" stroke="#b98a52" stroke-width="${r(sw * 0.3)}" stroke-linecap="round"/>`);
  out.push(`<rect x="${r(hx - sw * 0.5)}" y="${r(cl - 0.18)}" width="${r(sw * 1.2)}" height=".36" rx=".12" fill="${LOOK.brass[1]}" stroke="${LOOK.brass[2]}" stroke-width=".06"/>`);
  out.push(`<rect x="${r(x - sw * 0.9)}" y="${r(foot - sw * 1.6)}" width="${r(sw * 1.8)}" height="${r(sw * 1.6)}" rx="${r(sw * 0.3)}" fill="${LOOK.brass[1]}" stroke="${LOOK.brass[2]}" stroke-width=".08"/>`);
  out.push(`<path d="M${r(x)} ${r(top)}L${r(x + fin * 0.45)} ${r(top + fin * 0.9)}L${r(x - fin * 0.45)} ${r(top + fin * 0.9)}Z" fill="${LOOK.brass[1]}" stroke="${LOOK.brass[2]}" stroke-width=".06"/>` +
    `<circle cx="${r(x)}" cy="${r(top + fin * 1.4)}" r="${r(fin * 0.62)}" fill="${LOOK.brass[1]}" stroke="${LOOK.brass[2]}" stroke-width=".08"/><circle cx="${r(x - fin * 0.2)}" cy="${r(top + fin * 1.22)}" r="${r(fin * 0.2)}" fill="#fff6d8" fill-opacity=".8"/>`);
  return out.join('');
}

// ---- the battle ----
/** the opening of a nest: the brass square round the 33 mm opening */
const nestBox = (side: Side, i: number): Rect => ({ x: NX[i], y: NY[side], w: NEST.size, h: NEST.size });
const nestC = (side: Side, i: number) => { const b = nestBox(side, i); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
/** the whole brass plate of a nest: the opening's square and, on its outer side, a wing with a niche at the top where the
 *  side's flag stands, a compass star engraved in the brass under it */
const NICHE = 14, NICHE_H = 19.5;
const nestPlate = (side: Side, i: number): Rect => { const b = nestBox(side, i); return { x: i === 0 ? b.x - NICHE : b.x, y: b.y, w: b.w + NICHE, h: b.h }; };
/** a compass star engraved in brass: eight points, each half cut deep (dark) and half bright, a ring round it */
function brassStar(cx: number, cy: number, R: number): string {
  const dk = LOOK.brass[2], lt = '#fff1c8', out: string[] = [`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.74)}" fill="none" stroke="${dk}" stroke-width=".16"/><circle cx="${r(cx + 0.1)}" cy="${r(cy + 0.12)}" r="${r(R * 0.74)}" fill="none" stroke="${lt}" stroke-opacity=".5" stroke-width=".1"/>`];
  for (let j = 0; j < 8; j++) {
    const a = j * Math.PI / 4 - Math.PI / 2, L = j % 2 ? R * 0.62 : R, w = j % 2 ? R * 0.14 : R * 0.2;
    const T = [cx + Math.cos(a) * L, cy + Math.sin(a) * L], A = [cx + Math.cos(a - Math.PI / 2) * w, cy + Math.sin(a - Math.PI / 2) * w], B = [cx + Math.cos(a + Math.PI / 2) * w, cy + Math.sin(a + Math.PI / 2) * w];
    out.push(`<path d="M${r(cx)} ${r(cy)}L${r(T[0])} ${r(T[1])}L${r(A[0])} ${r(A[1])}Z" fill="${dk}"/><path d="M${r(cx)} ${r(cy)}L${r(T[0])} ${r(T[1])}L${r(B[0])} ${r(B[1])}Z" fill="${lt}" fill-opacity=".55" stroke="${dk}" stroke-width=".08" stroke-linejoin="round"/>`);
  }
  return out.join('') + `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.09)}" fill="${LOOK.brass[0]}" stroke="${dk}" stroke-width=".08"/>`;
}
const nicheBox = (side: Side, i: number): Rect => { const b = nestBox(side, i), m = NEST.rim; return { x: i === 0 ? b.x - NICHE + m : b.x + b.w, y: b.y + m, w: NICHE - m, h: NICHE_H }; };
function nestSvg(side: Side, i: number): string {
  const b = nestBox(side, i), p = nestPlate(side, i), nb = nicheBox(side, i), m = NEST.rim, t = NEST.token, g = (b.w - 2 * m - t) / 2, sd = SIDE[side], rx = 2.4;
  const well = (w: Rect, fill: string, rr: number) => `<rect x="${r(w.x)}" y="${r(w.y)}" width="${r(w.w)}" height="${r(w.h)}" rx="${rr}" fill="${fill}" stroke="${LOOK.brass[2]}" stroke-width=".28"/>`;
  const out = [shadow(p, rx, 0.32),
    `<rect data-plate="nest-${side}-${i}" x="${r(p.x)}" y="${r(p.y)}" width="${r(p.w)}" height="${r(p.h)}" rx="${rx}" fill="url(#${ID}brh)" stroke="${LOOK.brass[2]}" stroke-width=".3"/>`,
    `<path d="M${r(p.x + rx)} ${r(p.y + 0.35)}H${r(p.x + p.w - rx)}" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".25"/>`,
    // the opening for the ship token (the side's tint) and the niche of the flag (a recessed paper well)
    well({ x: b.x + m, y: b.y + m, w: b.w - 2 * m, h: b.h - 2 * m }, sd.tint, 1.5), well(nb, mix(sd.tint, LOOK.cell, 0.45), 1.2)];
  // the frame of the nest for check-layout: the flags and drawings of the nest stay inside it
  out.push(`<rect data-frame="nest-${side}-${i}" x="${r(p.x)}" y="${r(p.y)}" width="${r(p.w)}" height="${r(p.h)}" fill="none" stroke="none"/>`);
  // where the token lies: a fine dashed square
  out.push(`<rect x="${r(b.x + m + g)}" y="${r(b.y + m + g)}" width="${t}" height="${t}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".55" stroke-width=".22" stroke-dasharray="1.4 1"/>`);
  const outer = (i === 0 ? -1 : 1) as 1 | -1, c = nestC(side, i);
  out.push(`<g data-deco="nest-${side}-${i}" data-name="флаги гнезда: ${sd.name} ${i + 1}">` +
    // the side's flag faint in the well, under the token (seen while the nest is empty)
    `<g opacity=".3">${flag(side, c.x - 7.6, c.y + 11.5, c.y - 12, 1, 15.4, 10.4)}</g>` +
    // the side's flag in its niche: the staff by the outer edge, the cloth flying toward the opening
    flag(side, outer < 0 ? nb.x + 1.5 : nb.x + nb.w - 1.5, nb.y + nb.h - 1.2, nb.y + 1.2, (-outer) as 1 | -1, nb.w - 2.9, (nb.w - 2.9) * 0.72) +
    brassStar(nb.x + nb.w / 2, (nb.y + nb.h + b.y + b.h - m) / 2, Math.min(nb.w / 2 - 0.6, (b.y + b.h - m - nb.y - nb.h) / 2 - 0.6)) + '</g>');
  for (const [dx, dy] of [[1.25, 1.25], [p.w - 1.25, 1.25], [1.25, p.h - 1.25], [p.w - 1.25, p.h - 1.25]]) out.push(rivet(p.x + dx, p.y + dy, 0.62));
  return out.join('');
}
/** the side's name between its two nests: the scroll of the board headers (parts/boards/emblem.ts), larger — the side's
 *  colour in its edges and swallow tails, the word letter-spaced on the paper face with lozenges */
function namePlate(side: Side): { svg: string; box: Rect } {
  const sd = SIDE[side], cy = NY[side] + NEST.size / 2, cx = (NX[0] + NEST.size + NX[1]) / 2;
  const rb = sideRibbonSvg(sd.name.toUpperCase(), side, cx, cy, { id: `${ID}-${side}`, size: 13, plate: `name-${side}` });
  return { box: rb.box, svg: rb.svg };
}
/** the part of the segment a→b outside the rect c (Liang–Barsky): 0, 1 or 2 pieces */
function cutOut(a: { x: number; y: number }, b: { x: number; y: number }, c: Rect | null): [number, number][] {
  if (!c) return [[0, 1]];
  const dx = b.x - a.x, dy = b.y - a.y; let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, a.x - c.x], [dx, c.x + c.w - a.x], [-dy, a.y - c.y], [dy, c.y + c.h - a.y]]) {
    if (p === 0) { if (q < 0) return [[0, 1]]; continue; }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
  }
  if (t0 >= t1) return [[0, 1]];
  return [[0, t0], [t1, 1]].filter(([u, v]) => v - u > 0.02) as [number, number][];
}
/** the head of a course line, as on an old chart: a slender dart (a sting) with concave flanks and swept barbs, its tip at
 *  (x, y) pointing along (ux, uy); engraved — one half cut solid in ink, the other left in paper with an ink edge, a fine
 *  rib down the middle. Returns the head and the paper halo under it */
function dart(x: number, y: number, ux: number, uy: number, hd = 3.1, hw = 1.15, ink = NOTE_INK): { halo: string; head: string } {
  const at = (a: number, n: number) => `${r(x - ux * a - uy * n)} ${r(y - uy * a + ux * n)}`, nk = hd * 0.62;
  const half = (sg: number) => `M${at(0, 0)}Q${at(hd * 0.5, sg * hw * 0.3)} ${at(hd, sg * hw)}L${at(nk, 0)}Z`;
  const whole = `M${at(0, 0)}Q${at(hd * 0.5, hw * 0.3)} ${at(hd, hw)}L${at(nk, 0)}L${at(hd, -hw)}Q${at(hd * 0.5, -hw * 0.3)} ${at(0, 0)}Z`;
  return {
    halo: `<path d="${whole}" fill="${LOOK.halo}" fill-opacity=".75" stroke="${LOOK.halo}" stroke-opacity=".75" stroke-width=".9" stroke-linejoin="round"/>`,
    head: `<path d="${half(1)}" fill="${ink}"/><path d="${half(-1)}" fill="${LOOK.patch}"/>` +
      `<path d="${whole}" fill="none" stroke="${ink}" stroke-width=".14" stroke-linejoin="round"/><path d="M${at(nk, 0)}L${at(0.5, 0)}" stroke="${ink}" stroke-width=".1"/>`
  };
}
/** a lozenge on a course line at (x, y) along (ux, uy): half ink, half paper, as the marks on a chart's rhumbs */
function lozenge(x: number, y: number, ux: number, uy: number, l = 1.3, w = 0.6, ink = NOTE_INK): { halo: string; head: string } {
  const at = (a: number, n: number) => `${r(x + ux * a - uy * n)} ${r(y + uy * a + ux * n)}`;
  const whole = `M${at(-l, 0)}L${at(0, w)}L${at(l, 0)}L${at(0, -w)}Z`;
  return {
    halo: `<path d="${whole}" fill="${LOOK.halo}" fill-opacity=".75" stroke="${LOOK.halo}" stroke-opacity=".75" stroke-width=".9" stroke-linejoin="round"/>`,
    head: `<path d="M${at(-l, 0)}L${at(0, w)}L${at(l, 0)}Z" fill="${ink}"/><path d="M${at(-l, 0)}L${at(0, -w)}L${at(l, 0)}Z" fill="${LOOK.patch}"/><path d="${whole}" fill="none" stroke="${ink}" stroke-width=".13" stroke-linejoin="round"/>`
  };
}
/** an engraved course line between two nests, the fire going both ways: a fine ink line with a dart at each end, dashed
 *  for the diagonal; a lozenge on its middle when it is whole (mid); a soft halo of paper under the line and its heads so
 *  it reads over the chart; cut where a note's patch lies on it */
function course(a: { x: number; y: number }, b: { x: number; y: number }, dash: string, cut: Rect | null, mid = false, ink = NOTE_INK): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, hd = 3.1;
  const P = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  let d = '';
  for (const [u, v] of cutOut(a, b, cut)) {
    const p = P(u), q = P(v), s0 = u === 0 ? hd * 0.6 : 0.6, s1 = v === 1 ? hd * 0.6 : 0.6;
    d += `M${r(p.x + ux * s0)} ${r(p.y + uy * s0)}L${r(q.x - ux * s1)} ${r(q.y - uy * s1)}`;
  }
  const marks = [dart(a.x, a.y, -ux, -uy, hd, 1.15, ink), dart(b.x, b.y, ux, uy, hd, 1.15, ink)];
  if (mid) marks.push(lozenge((a.x + b.x) / 2, (a.y + b.y) / 2, ux, uy, 1.3, 0.6, ink));
  return `<path d="${d}" stroke="${LOOK.halo}" stroke-opacity=".35" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
    `<path d="${d}" stroke="${LOOK.halo}" stroke-opacity=".7" stroke-width="1.1" fill="none" stroke-linecap="round"/>` + marks.map(m => m.halo).join('') +
    `<path d="${d}" stroke="${ink}" stroke-width=".3" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` + marks.map(m => m.head).join('');
}
/** the point where the segment from the centre c towards p leaves the nest box (plus a gap) */
function edgePoint(c: { x: number; y: number }, p: { x: number; y: number }, b: Rect, gap: number): { x: number; y: number } {
  const dx = p.x - c.x, dy = p.y - c.y, hw = b.w / 2 + gap, hh = b.h / 2 + gap, t = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9);
  return { x: c.x + dx * t, y: c.y + dy * t };
}
function battleSvg(): { svg: string; plates: Rect[] } {
  const out: string[] = [], plates: Rect[] = [], diag = Math.abs((data.ships[0].diagDamage as { offset: number }).offset);
  for (const side of ['company', 'pirates'] as Side[]) for (const i of [0, 1]) { out.push(nestSvg(side, i)); plates.push(nestPlate(side, i)); }
  // the captain's ink note on a paper patch, once: «по диагонали −1» on the crossing of the diagonals (the nests straight
  // opposite have a course line and no note: the user took the words «напротив — полный урон» off the scheme)
  const nsize = 9.5, no: TO2 = { font: 'Alegreya', w: 500, italic: true, color: NOTE_INK }, em = pt(nsize), pad = 1.9;
  const c00 = nestC('company', 0), c01 = nestC('company', 1), c10 = nestC('pirates', 0), c11 = nestC('pirates', 1);
  const X = { x: (c00.x + c11.x) / 2, y: (c00.y + c11.y) / 2 }, dWord = fill(S.diag, { diag }), dw = W(dWord, nsize, no);
  // the box of a line of SVG text in the browser: ~0.95 em above the baseline, ~0.3 em under it
  const dBox = { x: X.x - dw / 2 - pad - 0.4, y: X.y - em * 0.62 - pad, w: dw + 2 * pad + 0.8, h: em * 1.24 + 2 * pad };
  const gap = 1;
  for (const [p, q] of [[c00, c11], [c01, c10]]) out.push(course(edgePoint(p, q, nestBox('company', p === c00 ? 0 : 1), gap), edgePoint(q, p, nestBox('pirates', q === c11 ? 1 : 0), gap), '1.8 1', dBox));
  out.push(patch('note-diag', dBox) + text(X.x, X.y + em * 0.33, dWord, nsize, { ...no, anchor: 'middle', in: 'note-diag' }));
  plates.push(dBox);
  // straight opposite, in each pair: a whole course line from the Company's nest down to the Pirates' one, a lozenge on it
  for (const i of [0, 1]) { const c = nestC('company', i); out.push(course({ x: c.x, y: NY.company + NEST.size + gap }, { x: c.x, y: NY.pirates - gap }, '', null, true)); }
  for (const side of ['company', 'pirates'] as Side[]) { const np = namePlate(side); out.push(np.svg); plates.push(np.box); }
  return { svg: out.join('\n'), plates };
}

// ---- the card frames ----
interface Place { key: string; icon: IconName; title: string; line: string }
const places = (): Place[] => [
  { key: 'deck', icon: 'seaDeck', title: S.seaDeck.title, line: S.seaDeck.lines.join(' · ') },
  { key: 'card', icon: 'seaCard', title: S.seaCard.title, line: S.seaCard.lines.join(' · ') },
  { key: 'effects', icon: 'effects', title: S.effects.title, line: S.effects.cards.map(cardName).join(', ') }
];
const TAB_T: TO2 = { font: 'Alegreya SC', w: 800, ls: '.04em' }, TAB_L: TO2 = { font: 'Alegreya', w: 500, italic: true };
const TAB_SIZES = [7.6, 7.4, 7.2, 7];
/** the box of a line of SVG text in the browser: 1.0 em above the baseline, 0.39 em under it (Alegreya) */
const ASC = 1.0, DESC = 0.39;
function slotSvg(p: Place, x: number): string {
  const b = { x, y: SLOT_Y, w: SLOT.w, h: SLOT.h }, m = SLOT.rim, cx = x + SLOT.w / 2, cy = SLOT_Y + SLOT.h / 2, out: string[] = [];
  // the tab: parchment standing on the frame's upper rim (its foot under the rim), rounded at the top
  const tb = { x: x + 0.6, y: SLOT_Y - TAB.h, w: SLOT.w - 1.2, h: TAB.h + m }, rx = 1.8;
  const tabPath = `M${r(tb.x)} ${r(tb.y + tb.h)}V${r(tb.y + rx)}Q${r(tb.x)} ${r(tb.y)} ${r(tb.x + rx)} ${r(tb.y)}H${r(tb.x + tb.w - rx)}Q${r(tb.x + tb.w)} ${r(tb.y)} ${r(tb.x + tb.w)} ${r(tb.y + rx)}V${r(tb.y + tb.h)}Z`;
  out.push(`<path d="${tabPath}" transform="translate(.5 .75)" fill="#1a0e04" fill-opacity=".22"/>`);
  out.push(`<path d="${tabPath}" fill="url(#${ID}paper)" stroke="${LOOK.paperLine}" stroke-opacity=".55" stroke-width=".25"/>`);
  out.push(`<path d="M${r(tb.x + 1)} ${r(SLOT_Y)}V${r(tb.y + rx)}Q${r(tb.x + 1)} ${r(tb.y + 1)} ${r(tb.x + rx)} ${r(tb.y + 1)}H${r(tb.x + tb.w - rx)}Q${r(tb.x + tb.w - 1)} ${r(tb.y + 1)} ${r(tb.x + tb.w - 1)} ${r(tb.y + rx)}V${r(SLOT_Y)}" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".6" stroke-width=".18"/>`);
  // the plate of the words is the tab's visible part; the frame over the tab's foot
  out.push(plateRect(`label-${p.key}`, { x: tb.x, y: tb.y, w: tb.w, h: TAB.h }));
  out.push(frame(`slot-${p.key}`, b, m, 2.2, `url(#${ID}well)`));
  out.push(`<rect x="${r(cx - 31.5)}" y="${r(cy - 44)}" width="63" height="88" rx="3" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".45" stroke-width=".25" stroke-dasharray="1.6 1.1"/>`);
  out.push(ico(p.icon, cx, cy, 30, `slot-${p.key}-icon`, 0.6));
  // the words of the tab: the name, then one line (its size fitted to the tab)
  // one size for the line on all three tabs: the largest at which the longest fits
  const ts = 9.5, ls = Math.min(...places().map(q => fitSize(q.line, TAB_SIZES, tb.w - 5, TAB_L))), b1 = tb.y + 1.65 + pt(ts) * ASC;
  // the name with its icon at the left, the pair centred on the tab
  const tw = W(p.title, ts, TAB_T), iw = 4.4, ig = 1.4, gx = cx - (iw + ig + tw) / 2;
  out.push(ico(p.icon, gx + iw / 2, b1 - pt(ts) * 0.34, iw, `label-${p.key}-icon`));
  out.push(text(gx + iw + ig, b1, p.title, ts, { ...TAB_T, color: INKC, in: `label-${p.key}` }));
  out.push(text(cx, b1 + pt(ts) * DESC + 0.15 + pt(ls) * ASC, p.line, ls, { ...TAB_L, color: LOOK.soft, anchor: 'middle', in: `label-${p.key}` }));
  return out.join('');
}

// ---- the left column ----
/** where the drawn medallion of each phase icon lies in its 100-unit box: the circle (50, 56) r 35 of icons.ts phase(),
 *  moved by icons.ts fitted() with the EXTENT of that icon (kept in step with icons.ts by hand). The phase icons now keep
 *  all their drawing inside that circle and have no EXTENT, so fitted() leaves them in place: the extent here is the
 *  circle's own (ring and contour) */
const MEDALLION: Record<'phaseSea' | 'phasePirates' | 'phaseCompany', [number, number, number, number]> = {
  phaseSea: [14, 20, 86, 92], phasePirates: [14, 20, 86, 92], phaseCompany: [14, 20, 86, 92]
};
function medallion(name: keyof typeof MEDALLION): { x: number; y: number; R: number } {
  const e = MEDALLION[name], [x0, y0, x1, y1] = [e[0] - 0.5, e[1] - 0.5, e[2] + 0.5, e[3] + 0.5], lo = 2.5, hi = 97.5;
  const s = Math.min(1, (hi - lo) / (x1 - x0), (hi - lo) / (y1 - y0));
  const place = (a: number, b: number) => { const c = (a + b) / 2, h = (s * (b - a)) / 2; return Math.min(Math.max(c, lo + h), hi - h) - s * c; };
  return { x: place(x0, x1) + s * 50, y: place(y0, y1) + s * 56, R: s * 35 };
}
/** the phase of the round: three medallions on brass seats along a course, the steps under them, the course back */
function phaseSvg(y: number): { svg: string; box: Rect } {
  const p = S.phase, x = COL.x, R = MED.d / 2, seat = R + MED.rim, pitch = 2 * seat + MED.gap, mx = x + COL.w / 2;
  const cy = y + 20, capTop = cy + 9.6, capLh = 3.7, capS = 9, capBox = (n: number) => pt(capS) * 1.26 + (n - 1) * capLh;
  const back = capTop + capBox(2) + 2.4, b = { x, y, w: COL.w, h: back - y + 2.6 }, out = [slip('phase', b)];
  out.push(text(x + 3.2, y + 6.6, p.title, 10.5, { font: 'Alegreya', w: 700, in: 'phase' }));
  out.push(text(x + COL.w - 3.2, y + 6.6, p.sub, 8.5, { color: LOOK.soft, anchor: 'end', in: 'phase' }));
  const names: (keyof typeof MEDALLION)[] = ['phaseSea', 'phasePirates', 'phaseCompany'], colors = [SEA_INK, SIDE.pirates.ink, SIDE.company.ink];
  const xs = [-1, 0, 1].map(k => mx + k * pitch);
  const trail = `stroke="${NOTE_INK}" stroke-width=".4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  for (let i = 0; i < 3; i++) {
    const c = xs[i], m = medallion(names[i]), S2 = MED.d / (2 * m.R / 100), bx = c - (m.x / 100 - 0.5) * S2, by = cy - (m.y / 100 - 0.5) * S2;
    // the seat: a brass ring a little wider than the drawn medallion, its shadow down-right; the mark lies on it
    out.push(`<circle cx="${r(c + 0.45)}" cy="${r(cy + 0.65)}" r="${r(seat)}" fill="#1a0e04" fill-opacity=".3"/>` + brassDisc(c, cy, seat, MED.rim, `phase-seat-${i}`));
    // the drawing stays inside its medallion's circle (check-layout: data-deco inside data-frame)
    out.push(`<circle data-frame="phase-${i}" cx="${r(c)}" cy="${r(cy)}" r="${r(R + 0.3)}" fill="none" stroke="none"/><g data-deco="phase-${i}" data-name="${esc(p.steps[i])}">${ico(names[i], bx, by, S2, `phase-icon-${i}`).replace(/^<rect data-plate="[^"]*"[^>]*\/>/, '')}</g>` + plateRect(`phase-icon-${i}`, { x: bx - S2 / 2, y: by - S2 / 2, w: S2, h: S2 }));
    // the step under its medallion: one or two lines («Ходят» over the side)
    const words = p.steps[i].split(' '), lines = words.length > 1 ? [words[0], words.slice(1).join(' ')] : words;
    out.push(text(c, capTop + pt(capS) * 0.95, lines.join('\n'), capS, { font: 'Alegreya', w: 700, color: colors[i], anchor: 'middle', lh: capLh, in: 'phase', name: p.steps[i] }));
    // the course on to the next medallion: a dashed track with a barbed head
    if (i < 2) { const a0 = c + seat + 1, a1 = xs[i + 1] - seat - 0.9; out.push(`<path d="M${r(a0)} ${r(cy)}H${r(a1 - 1.6)}" ${trail} stroke-dasharray="1.3 .8"/>${barb(a1, cy, 1, 0, 2.3, 1)}`); }
  }
  // and back: from under «Компания» along the foot of the plate to under «Море»
  const yR = back, upTo = capTop + capBox(1) + 0.9;
  out.push(`<path d="M${r(xs[2])} ${r(capTop + capBox(2) + 0.9)}V${r(yR - 1.2)}Q${r(xs[2])} ${r(yR)} ${r(xs[2] - 1.2)} ${r(yR)}H${r(xs[0] + 1.2)}Q${r(xs[0])} ${r(yR)} ${r(xs[0])} ${r(yR - 1.2)}V${r(upTo + 1.6)}" ${trail} stroke-dasharray="1.3 .8"/>${barb(xs[0], upTo, 0, -1, 2.3, 1)}`);
  return { svg: out.join(''), box: b };
}
/** a cartouche: a slip with flourishes at its corners */
function cartouche(pid: string, b: Rect): string {
  const c = LOOK.paperLine, curl = (x: number, y: number, sx: number, sy: number) => `<path d="M${r(x + sx * 1.6)} ${r(y + sy * 5.5)}C${r(x + sx * 1.6)} ${r(y + sy * 2.6)} ${r(x + sx * 2.6)} ${r(y + sy * 1.6)} ${r(x + sx * 5.5)} ${r(y + sy * 1.6)}M${r(x + sx * 2.9)} ${r(y + sy * 2.9)}m${r(sx * -0.7)} 0a.7 .7 0 1 0 ${r(sx * 1.4)} 0a.7 .7 0 1 0 ${r(sx * -1.4)} 0" fill="none" stroke="${c}" stroke-width=".3" stroke-opacity=".75"/>`;
  return slip(pid, b, 0.96) + curl(b.x, b.y, 1, 1) + curl(b.x + b.w, b.y, -1, 1) + curl(b.x, b.y + b.h, 1, -1) + curl(b.x + b.w, b.y + b.h, -1, -1);
}

export const SCHEME_CSS = `
.sc{position:absolute;inset:0}
.sc-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.sc-abs{position:absolute}
.sc-lead{font:italic 500 9.5pt/1.22 Alegreya,serif;color:#3f2f1c}
.sc-joint{font:500 9pt/1.2 'Alegreya Sans',sans-serif;color:${INKC}}
.sc-joint b{font:700 9.5pt/1.2 Alegreya,serif;display:block}
.sc-long{font:italic 500 8.4pt/1.22 Alegreya,serif;color:#2c2016;text-align:center;text-wrap:balance;hyphens:manual}
.sc-long-h{font:800 9.5pt/1.2 'Alegreya SC',serif;letter-spacing:.06em;color:${INKC};text-align:center;font-style:normal;margin-bottom:.5mm}
`;
/** heights of HTML blocks at their widths, measured in the browser (mm) */
async function heights(ctx: Ctx, blocks: { html: string; w: number }[]): Promise<number[]> {
  const page = await ctx.browser.newPage();
  try {
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}body{font-variant-numeric:lining-nums}${SCHEME_CSS}</style>${blocks.map((b, i) => `<div id="b${i}" class="sc-abs" style="left:0;top:0;width:${b.w}mm">${b.html}</div>`).join('')}`);
    await page.evaluate(async () => { await document.fonts.ready; });
    return await page.evaluate((n: number) => Array.from({ length: n }, (_, i) => document.getElementById('b' + i)!.getBoundingClientRect().height * 25.4 / 96), blocks.length);
  } finally { await page.close(); }
}

/** the page: the chart, then the plates over it */
async function schemePage(ctx: Ctx): Promise<string> {
  // the widths of the single lines come from the browser: a dry run collects them
  battleSvg(); places().forEach((p, i) => slotSvg(p, SLOT_XS[i])); phaseSvg(0);
  await measureMissing(ctx);
  const pad = 3.2, tw = COL.w - 2 * pad;
  const lead = `<div class="sc-lead">${esc(S.lead)}</div>`;
  const joint = `<div class="sc-joint"><b>${esc(S.joint[0])}</b>${S.joint.slice(1).map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
  const long = `<div class="sc-long"><div class="sc-long-h">${esc(S.long.title)}</div>${esc(S.long.text)}</div>`;
  const jointW = tw - 12, longW = COL.w - 7;
  // the lead keeps clear of the cartouche's corner flourishes: 1 mm further in
  const [hLead, hJoint, hLong] = await heights(ctx, [{ html: lead, w: tw - 1 }, { html: joint, w: jointW }, { html: long, w: longW }]);

  const svg: string[] = [], html: string[] = [], calm: Rect[] = [];
  // the title slip: «Схема боя», the tag, the lead
  const tb = { x: COL.x, y: COL.top, w: COL.w, h: 12.4 + hLead + 3.2 };
  svg.push(cartouche('title', tb));
  svg.push(text(tb.x + pad, tb.y + 9.6, S.title, 22, { font: 'Alegreya SC', w: 800, in: 'title' }));
  svg.push(text(tb.x + tb.w - pad, tb.y + 9.2, S.tag, 9, { font: 'Alegreya SC', w: 700, ls: '.08em', color: '#7a5a22', anchor: 'end', in: 'title' }));
  html.push(`<div class="sc-abs" data-in="title" data-name="подзаголовок" style="left:${r(tb.x + pad + 1)}mm;top:${r(tb.y + 12.2)}mm;width:${r(tw - 1)}mm">${lead}</div>`);
  calm.push(tb);
  // the phase of the round
  const ph = phaseSvg(tb.y + tb.h + 3.6);
  svg.push(ph.svg); calm.push(ph.box);
  // the joint volley
  const jb = { x: COL.x, y: ph.box.y + ph.box.h + 3.6, w: COL.w, h: hJoint + 2 * 2.6 };
  svg.push(slip('joint', jb));
  svg.push(ico('guns', jb.x + 6.8, jb.y + jb.h / 2, 8.4, 'joint-icon'));
  html.push(`<div class="sc-abs" data-in="joint" data-name="совместный залп" style="left:${r(jb.x + pad + 9)}mm;top:${r(jb.y + 2.6)}mm;width:${r(jointW)}mm">${joint}</div>`);
  calm.push(jb);
  // the lasting effects: a small cartouche, its foot on the line of the card frames' foot (the cards lie on the chart above it)
  const lb = { x: COL.x, y: 0, w: COL.w, h: hLong + 2 * 4 };
  lb.y = COL.bottom - lb.h;
  if (lb.y < jb.y + jb.h + 4) console.warn(`warning: 04b: the lasting effects (${r(lb.h)} mm) crowd the joint volley`);
  svg.push(cartouche('long', lb));
  html.push(`<div class="sc-abs" data-in="long" data-name="долгие эффекты" style="left:${r(lb.x + (COL.w - longW) / 2)}mm;top:${r(lb.y + 4)}mm;width:${r(longW)}mm">${long}</div>`);
  calm.push(lb);
  // the battle and the card frames
  const bt = battleSvg();
  svg.push(bt.svg); calm.push(...bt.plates);
  places().forEach((p, i) => { svg.push(slotSvg(p, SLOT_XS[i])); calm.push({ x: SLOT_XS[i], y: SLOT_Y - TAB.h, w: SLOT.w, h: SLOT.h + TAB.h }); });

  // the chart under it all: calmed under the plates, its lettering off them and off the battle's courses
  const courses = { x: NX[0], y: NY.company, w: NX[1] + NEST.size - NX[0], h: NY.pirates + NEST.size - NY.company };
  const chart = chartSvg({
    style: 'plain', w: PAGE.w, h: PAGE.h, center: [0, 0], mmPerDeg: VIEW.mmPerDeg, anchor: VIEW.anchor, inset: VIEW.inset, seed: 11,
    calm, avoid: [courses],
    roses: [{ x: 41, y: 146, r: 12 }],
    ships: [{ x: 30, y: 118, s: 0.6 }]
  });
  const jpg = await rasterJpeg(ctx.browser, 'scheme-chart', chart, PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);
  return `<div class="sc"><svg class="sc-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${defs()}<image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>${svg.join('\n')}</svg>\n${html.join('\n')}</div>`;
}

export async function schemePart(ctx: Ctx): Promise<Part> {
  return { file: SCHEME_FILE, title: S.partTitle, css: SCHEME_CSS, pages: [{ html: await schemePage(ctx), land: true }] };
}
