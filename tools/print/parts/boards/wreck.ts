// 03 — the back «Затонул» of a ship board, v3 (composition B «дно под толщей воды»): the ship lies wrecked on the sea floor
// in the lower third of the sheet, the bow buried in the sand, the stern a little raised, the masts snapped; above it a
// column of water with shafts of light, bubbles, a school of fish, rigging and rags hanging from the stumps; in front —
// rippled sand, an anchor, shot, a chest, a gun, corals and weed. The scene is one raster (soft light, blurs, gradients
// of the water); the plates hang in the water over it and are vector: a cartouche with the ship's medallion, a
// waterlogged page with the rules, a brass column «Капитан — на борту союзника» with the two cells and the ship token.
//
// The frame is shared by the four ships; per ship only SEA[key] changes (see Sea): the colours of the water, the light,
// the sand, the fish, the corals and weed, the rags, the ship's place and how it lies, how the masts broke, which mast
// fell, and the props on the floor. The words are those of the old back (boards.json → frame.wreck and rules.md
// «Корабль тонет»), word for word.
// Every word is data-in="<its plate>" (tools/print/check-layout.ts).
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT, esc, fontCss, type Ctx } from '../../kit';
import { BOARD, type Ship } from '../../layout';
import { DECK_KEY } from '../../colors';
import { rasterJpeg } from '../../map/raster';
import { TXT as FTXT, basePalette, jonesLine, md, measureMissing, noRef, rulesLine, rulesSection, widthOf, type Pal, type ShipKey, type ShipMaterial, type TO } from './frame';
import { LOOKS, cellSvg, defsOf, ico, text, type Look } from './v2';

type P = [number, number];
interface Rect { x: number; y: number; w: number; h: number }
type KitFn = (u: string, L: unknown, o: Record<string, unknown>) => string;
const require = createRequire(import.meta.url);
const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship: KitFn; anchor: KitFn; cannon: KitFn; shot: KitFn; chest: KitFn; bottle: KitFn; rock: KitFn;
  makeLight(l: unknown, cam: { horizon: number }): unknown; LIGHTS: Record<string, { key: Record<string, unknown> } & Record<string, unknown>>;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number };
  shipGeom(kind: string, o: Record<string, unknown>): { masts: { x: number; H: number; top: P }[] };
  SHIP_SPECS: Record<string, { len: number; free: number; draft: number }>;
};

// ---- the look of each ship's sea floor ----
type PropKind = 'anchor' | 'cannon' | 'chest' | 'shot' | 'bottle' | 'rock';
interface Prop { kind: PropKind; x: number; dy: number; s: number; rot?: number }
interface Sea {
  /** the kit's light of the deck (LIGHTS key), turned to come from above */
  light: 'pearl' | 'revenge' | 'endeavour' | 'dutchman';
  /** the water: under the surface, mid-depth, at the floor */
  water: [string, string, string];
  /** the light from the surface (rays, caustics, bubbles, specks) and the strength of the rays */
  glow: string; rays: number;
  /** the water between the eye and the wreck: colour and strength; the lighter water behind the wreck (its silhouette reads) */
  haze: [string, number]; back: [string, number];
  /** the sand: lit crest, body, shade; the far floor in the haze */
  sand: [string, string, string]; far: string;
  /** fish colour and opacity; corals; weed; the rags of the sails; shells and green (the Dutchman) */
  fish: [string, number]; coral: string[]; weed: string[]; rag: string; shells?: boolean;
  /** the ship: the middle of its waterline (mm), scale, roll (kit, −20…20: from the viewer, the bottom shows), tilt (degrees,
   *  the bow down), the break of each mast (a share of its height), the fallen top of one mast (rotation about the break,
   *  where the break lands), the sand over the waterline at the bow and at the stern (mm; minus — under it) */
  ship: { x: number; y: number; scale: number; roll: number; tilt: number; brk: number[]; fall?: { mast: number; rot: number; dx: number; dy: number }; bow: number; stern: number };
  /** the level of the floor away from the ship, and what lies on it */
  bed: number; props: Prop[]; seed: number;
}
const PROPS: Prop[] = [
  { kind: 'anchor', x: 30, dy: 13, s: 0.95, rot: 74 },
  { kind: 'shot', x: 104, dy: 12, s: 1.15 }, { kind: 'shot', x: 111.5, dy: 14.5, s: 1.15 }, { kind: 'shot', x: 97, dy: 15.5, s: 1.1 },
  { kind: 'bottle', x: 150, dy: 15, s: 0.75, rot: 14 },
  { kind: 'cannon', x: 196, dy: 12.5, s: 0.72, rot: -6 },
  { kind: 'rock', x: 286, dy: 5, s: 0.8 },
  { kind: 'chest', x: 258, dy: 12, s: 0.88, rot: -4 }
];
export const SEA: Record<ShipKey, Sea> = {
  pearl: {
    light: 'pearl', water: ['#2f587a', '#13283f', '#060e19'], glow: '#c4e2ff', rays: 0.5, haze: ['#1c3c5a', 0.26], back: ['#4a7ea4', 0.6],
    sand: ['#a7b2ba', '#66737f', '#2a3541'], far: '#203a52', fish: ['#a9c6dc', 0.62], coral: ['#7d6590', '#5a7a9a', '#9a6470'], weed: ['#2c5a4c', '#3e6e5c', '#24463e'],
    rag: '#26262b', ship: { x: 168, y: 185, scale: 1.85, roll: -18, tilt: 10, brk: [0.36, 0.5, 0.42], fall: { mast: 1, rot: 116, dx: 0, dy: 10 }, bow: 17, stern: -6 },
    bed: 197, props: PROPS, seed: 11
  },
  revenge: {
    light: 'revenge', water: ['#7a4630', '#3a2018', '#140908'], glow: '#ffd2a0', rays: 0.42, haze: ['#4a2418', 0.32], back: ['#b0683e', 0.4],
    sand: ['#c99e78', '#8d5d42', '#43261a'], far: '#4a2a1e', fish: ['#2a120c', 0.58], coral: ['#c4523a', '#d88a52', '#8e3434'], weed: ['#5e5a26', '#74702e', '#40401c'],
    rag: '#6a1c16', ship: { x: 160, y: 185, scale: 2.08, roll: -18, tilt: 10, brk: [0.36, 0.5, 0.42], fall: { mast: 1, rot: 116, dx: 0, dy: 10 }, bow: 17, stern: -6 },
    bed: 197, props: PROPS, seed: 23
  },
  endeavour: {
    light: 'endeavour', water: ['#6ab4c2', '#2b7088', '#0f3646'], glow: '#fff6dc', rays: 0.45, haze: ['#3a8096', 0.26], back: ['#8ccad4', 0.45],
    sand: ['#efdeb2', '#c4a878', '#6e5a40'], far: '#4a8a98', fish: ['#f0c24a', 0.85], coral: ['#e2765a', '#f0b25e', '#c45a8a'], weed: ['#4c7c3a', '#5e9046', '#365c2c'],
    rag: '#d8ccaa', ship: { x: 168, y: 185, scale: 1.85, roll: -18, tilt: 10, brk: [0.36, 0.5, 0.42], fall: { mast: 1, rot: 116, dx: 0, dy: 10 }, bow: 17, stern: -6 },
    bed: 197, props: PROPS, seed: 37
  },
  dutch: {
    light: 'dutchman', water: ['#4a7866', '#1e3e34', '#0a1b16'], glow: '#d4f2e2', rays: 0.4, haze: ['#244a3e', 0.28], back: ['#5e8e78', 0.45],
    sand: ['#a4ae92', '#6a765e', '#2e3a30'], far: '#284a3e', fish: ['#b0ccbc', 0.58], coral: ['#6c8c6a', '#8c9c6a', '#5a7a74'], weed: ['#3a6a3a', '#5a8a4a', '#2a4a2c'],
    rag: '#8a8670', shells: true, ship: { x: 168, y: 185, scale: 2.05, roll: -18, tilt: 10, brk: [0.36, 0.5, 0.42], fall: { mast: 1, rot: 116, dx: 0, dy: 10 }, bow: 17, stern: -6 },
    bed: 197, props: PROPS, seed: 41
  }
};

// ---- helpers ----
const PAGE = { w: 297, h: 210 };
const f = (n: number) => String(Math.round(n * 100) / 100);
const pt = (n: number) => n * 25.4 / 72;
const C = BOARD.cell;
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
/** a smooth open curve through points (Catmull-Rom as cubic Béziers) */
function spline(p: P[]): string {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

// ---- the living things and the small pieces of the scene (own drawings) ----
/** a fish swimming left: a lens body, a forked tail, a dorsal fin, a light belly, the eye */
function fish(x: number, y: number, l: number, rot: number, color: string, op: number): string {
  const body = `M0 0C${f(.18 * l)} ${f(-.25 * l)} ${f(.58 * l)} ${f(-.23 * l)} ${f(.8 * l)} ${f(-.03 * l)}L${f(l)} ${f(-.19 * l)}L${f(.94 * l)} 0L${f(l)} ${f(.19 * l)}L${f(.8 * l)} ${f(.03 * l)}C${f(.58 * l)} ${f(.2 * l)} ${f(.18 * l)} ${f(.21 * l)} 0 0Z`;
  const fin = `M${f(.3 * l)} ${f(-.2 * l)}L${f(.44 * l)} ${f(-.34 * l)}L${f(.58 * l)} ${f(-.19 * l)}Z`;
  const dark = mix(color, '#000000', .45), light = mix(color, '#ffffff', .45);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" opacity="${f(op)}"><path d="${fin}" fill="${dark}"/><path d="${body}" fill="${color}"/>` +
    `<path d="M${f(.06 * l)} ${f(.05 * l)}C${f(.3 * l)} ${f(.15 * l)} ${f(.56 * l)} ${f(.13 * l)} ${f(.76 * l)} ${f(.03 * l)}" fill="none" stroke="${light}" stroke-width="${f(.05 * l)}" stroke-opacity=".7"/>` +
    `<path d="M${f(.1 * l)} ${f(-.1 * l)}C${f(.3 * l)} ${f(-.19 * l)} ${f(.56 * l)} ${f(-.17 * l)} ${f(.76 * l)} ${f(-.05 * l)}" fill="none" stroke="${dark}" stroke-width="${f(.05 * l)}" stroke-opacity=".6"/>` +
    `<circle cx="${f(.11 * l)}" cy="${f(-.035 * l)}" r="${f(.028 * l)}" fill="${dark}"/></g>`;
}
/** a school of fish in a box, all swimming left in a loose stream along a gentle arc */
function school(b: Rect, n: number, size: number, sea: Sea, R: () => number, far = 0): string {
  const out: string[] = [], ph = R() * 3;
  for (let i = 0; i < n; i++) {
    const t = (i + R() * 0.8) / n, x = b.x + t * b.w, y = b.y + b.h / 2 + Math.sin(t * Math.PI * 1.4 + ph) * b.h * 0.28 + (R() - 0.5) * b.h * 0.55;
    const l = size * (0.75 + R() * 0.5), op = sea.fish[1] * (0.55 + R() * 0.45) * (1 - far * 0.55);
    out.push(fish(x, y, l, -6 + (R() - 0.5) * 16, far ? mix(sea.fish[0], sea.water[1], far * 0.6) : sea.fish[0], op));
  }
  return out.join('');
}
/** a column of bubbles rising from (x, y) to y = top, wobbling, larger as they rise */
function bubbles(x: number, y: number, top: number, glow: string, R: () => number): string {
  const out: string[] = [], ph = R() * 6;
  for (let yy = y - 2 - R() * 3; yy > top; yy -= 2.2 + R() * 4.5) {
    const k = (y - yy) / Math.max(1, y - top), r = 0.3 + k * 1.1 * (0.5 + R()), xx = x + Math.sin(yy * 0.14 + ph) * (1 + k * 2.4) + (R() - 0.5) * 1.6;
    out.push(`<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(r)}" fill="${glow}" fill-opacity=".1" stroke="${glow}" stroke-opacity=".62" stroke-width="${f(Math.max(0.12, r * 0.16))}"/><circle cx="${f(xx - r * 0.35)}" cy="${f(yy - r * 0.38)}" r="${f(r * 0.24)}" fill="#ffffff" fill-opacity=".75"/>`);
  }
  return out.join('');
}
/** a strand of kelp: a tapering ribbon swaying up from (x, y), a lighter midrib */
function kelp(x: number, y: number, h: number, color: string, R: () => number, lean = 0, wmax = 2.2): string {
  const n = 14, ph = R() * 6, amp = 1.4 + R() * 1.8, c: P[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n; c.push([x + Math.sin(t * 5.2 + ph) * amp * t + lean * h * t * t, y - h * t]); }
  const L: P[] = [], Rt: P[] = [];
  c.forEach((p, i) => {
    const q = c[Math.min(n, i + 1)], o = c[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, t = i / n;
    const w = wmax * (0.35 + 0.65 * Math.sin(Math.PI * Math.pow(t, 0.6))) * (1 - 0.75 * t) + 0.15;
    L.push([p[0] - dy / d * w / 2, p[1] + dx / d * w / 2]); Rt.push([p[0] + dy / d * w / 2, p[1] - dx / d * w / 2]);
  });
  const d = spline(L) + spline(Rt.reverse()).replace(/^M/, 'L') + 'Z';
  return `<path d="${d}" fill="${color}"/><path d="${spline(c)}" fill="none" stroke="${mix(color, '#ffffff', .3)}" stroke-width=".22" stroke-opacity=".55"/>`;
}
/** a tuft of kelp strands */
function tuft(x: number, y: number, h: number, colors: string[], R: () => number, n = 4): string {
  let out = '';
  for (let i = 0; i < n; i++) out += kelp(x + (R() - 0.5) * 5, y, h * (0.55 + R() * 0.5), colors[i % colors.length], R, (R() - 0.4) * 0.25, 1.6 + R() * 1.2);
  return out;
}
/** a branching coral: forks with rounded tips, lit from above */
function branchCoral(x: number, y: number, h: number, color: string, R: () => number): string {
  const segs: string[] = [], tips: string[] = [], dark = mix(color, '#000000', .4), light = mix(color, '#ffffff', .35);
  const grow = (p: P, a: number, len: number, w: number, depth: number) => {
    const bend = (R() - 0.5) * 0.5, e: P = [p[0] + Math.sin(a) * len, p[1] - Math.cos(a) * len], m: P = [p[0] + Math.sin(a + bend) * len * 0.55, p[1] - Math.cos(a + bend) * len * 0.55];
    const d = `M${f(p[0])} ${f(p[1])}Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}`;
    segs.push(`<path d="${d}" fill="none" stroke="${dark}" stroke-width="${f(w + 0.5)}" stroke-linecap="round"/>`, `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round"/>`,
      `<path d="${d}" fill="none" stroke="${light}" stroke-width="${f(w * 0.3)}" stroke-linecap="round" stroke-opacity=".7" transform="translate(${f(-w * 0.22)} 0)"/>`);
    if (depth <= 0) { tips.push(`<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(w * 0.62)}" fill="${light}"/>`); return; }
    const k = 2 + (R() < 0.35 ? 1 : 0);
    for (let i = 0; i < k; i++) grow(e, a + (i - (k - 1) / 2) * (0.5 + R() * 0.35) + (R() - 0.5) * 0.2, len * (0.62 + R() * 0.16), w * 0.72, depth - 1);
  };
  grow([x, y], (R() - 0.5) * 0.3, h * 0.36, Math.max(0.9, h * 0.09), 3);
  return segs.join('') + tips.join('');
}
/** a sea fan: thin branching rays and a fine mesh between them */
function fanCoral(x: number, y: number, h: number, color: string, R: () => number): string {
  const out: string[] = [], n = 11, tilt = (R() - 0.5) * 0.3;
  for (let i = 0; i < n; i++) {
    const a = tilt - 1.05 + (i / (n - 1)) * 2.1, len = h * (0.75 + R() * 0.25), e: P = [x + Math.sin(a) * len, y - Math.cos(a) * len * 0.95];
    out.push(`<path d="M${f(x)} ${f(y)}Q${f(x + Math.sin(a) * len * 0.4 + (R() - 0.5) * 2)} ${f(y - Math.cos(a) * len * 0.5)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="${color}" stroke-width=".42" stroke-linecap="round"/>`);
  }
  for (let k = 1; k <= 5; k++) {
    const rr = h * k / 5.6, pts: P[] = [];
    for (let i = 0; i <= 12; i++) { const a = tilt - 1.05 + (i / 12) * 2.1; pts.push([x + Math.sin(a) * rr + (R() - 0.5) * 0.6, y - Math.cos(a) * rr * 0.95 + (R() - 0.5) * 0.6]); }
    out.push(`<path d="${spline(pts)}" fill="none" stroke="${color}" stroke-width=".2" stroke-opacity=".8"/>`);
  }
  return `<path d="M${f(x - 1)} ${f(y + 0.3)}L${f(x)} ${f(y - 3)}L${f(x + 1)} ${f(y + 0.3)}Z" fill="${mix(color, '#000000', .3)}"/>` + out.join('');
}
/** a dome of brain coral with meandering grooves */
function domeCoral(x: number, y: number, rx: number, ry: number, color: string, R: () => number, id: string): string {
  const out = [`<defs><radialGradient id="${id}" cx=".38" cy=".25" r=".85"><stop offset="0" stop-color="${mix(color, '#ffffff', .3)}"/><stop offset=".6" stop-color="${color}"/><stop offset="1" stop-color="${mix(color, '#000000', .45)}"/></radialGradient></defs>`,
    `<path d="M${f(x - rx)} ${f(y)}C${f(x - rx)} ${f(y - ry * 1.3)} ${f(x + rx)} ${f(y - ry * 1.3)} ${f(x + rx)} ${f(y)}Z" fill="url(#${id})"/>`];
  for (let k = 0; k < 6; k++) {
    const yy = y - ry * (0.1 + k * 0.15), half = rx * Math.sqrt(Math.max(0, 1 - Math.pow((y - yy) / ry, 2))) * 0.9, pts: P[] = [];
    for (let i = 0; i <= 8; i++) pts.push([x - half + (2 * half * i) / 8, yy + Math.sin(i * 1.7 + k) * 0.5 + (R() - 0.5) * 0.3]);
    if (half > 1) out.push(`<path d="${spline(pts)}" fill="none" stroke="${mix(color, '#000000', .5)}" stroke-width=".22" stroke-opacity=".6"/>`);
  }
  return out.join('');
}
/** a scallop shell and a little spiral shell (the Dutchman's floor) */
function shell(x: number, y: number, s: number, rot: number, kind: number): string {
  if (kind) return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(s)})"><path d="M0 0C-2.4 0 -3.2 -2.6 -1.6 -3.8C0 -5 2.6 -3.6 2.2 -1.4C1.9 .4 -.2 .8 -.6 -.6C-.9 -1.6 .4 -2.2 .9 -1.4" fill="#cfc6ae" stroke="#5a5444" stroke-width=".25"/><path d="M-.6 -.6C-.9 -1.6 .4 -2.2 .9 -1.4" fill="none" stroke="#5a5444" stroke-width=".2"/></g>`;
  let ribs = '';
  for (let i = 0; i < 7; i++) { const a = -1.15 + i * 0.383; ribs += `M0 0L${f(Math.sin(a) * 3.4)} ${f(-Math.cos(a) * 3.4)}`; }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(s)})"><path d="M0 0L-3.2 -1.6C-3 -3.6 -1.4 -4 0 -4C1.4 -4 3 -3.6 3.2 -1.6Z" fill="#ddd2b8" stroke="#6a604c" stroke-width=".25"/><path d="${ribs}" stroke="#8a7c62" stroke-width=".2"/><path d="M-.9 .2H.9L.5 -.6H-.5Z" fill="#b8ab90"/></g>`;
}

// ---- the scene ----
interface Plates { title: Rect; rules: Rect; col: Rect }
/** the whole sea-floor picture (mm), to be rasterised */
export function seaFloorSvg(key: ShipKey, sea: Sea, pl: Plates): string {
  const R = rng(sea.seed), S = sea.ship, s = S.scale, sp = K.SHIP_SPECS[key], u = `wr${key}`;
  const base = K.LIGHTS[sea.light], L = K.makeLight({ ...base, key: { ...base.key, az: 160, el: 64 } }, { horizon: 150 });
  const out: string[] = [];
  const [w0, w1, w2] = sea.water;
  // the water: lighter under the surface, deep at the floor; the bright patch where the light comes in (upper left)
  out.push(`<defs>
<linearGradient id="wW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w0}"/><stop offset=".45" stop-color="${w1}"/><stop offset="1" stop-color="${w2}"/></linearGradient>
<radialGradient id="wSun" cx=".3" cy="-.08" r=".7"><stop offset="0" stop-color="${sea.glow}" stop-opacity=".42"/><stop offset=".5" stop-color="${sea.glow}" stop-opacity=".1"/><stop offset="1" stop-color="${sea.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="wRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea.glow}" stop-opacity="1"/><stop offset=".5" stop-color="${sea.glow}" stop-opacity=".4"/><stop offset="1" stop-color="${sea.glow}" stop-opacity="0"/></linearGradient>
<linearGradient id="wTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="wTopM" maskUnits="userSpaceOnUse" x="0" y="0" width="${PAGE.w}" height="30"><rect width="${PAGE.w}" height="30" fill="url(#wTop)"/></mask>
<linearGradient id="wSand" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="210"><stop offset="0" stop-color="${sea.sand[0]}"/><stop offset=".3" stop-color="${sea.sand[1]}"/><stop offset="1" stop-color="${sea.sand[2]}"/></linearGradient>
<linearGradient id="wKeel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix('#4a4632', sea.weed[2], .35)}"/><stop offset=".45" stop-color="${mix('#262618', sea.weed[2], .3)}"/><stop offset="1" stop-color="#0e100c"/></linearGradient>
<radialGradient id="wBack" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${sea.back[0]}" stop-opacity="${sea.back[1]}"/><stop offset=".6" stop-color="${sea.back[0]}" stop-opacity="${sea.back[1] * 0.45}"/><stop offset="1" stop-color="${sea.back[0]}" stop-opacity="0"/></radialGradient>
<radialGradient id="wVig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
<filter id="wB2" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="wB1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="wB05" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".45"/></filter>
</defs>`);
  out.push(`<rect width="${PAGE.w}" height="${PAGE.h}" fill="url(#wW)"/><rect width="${PAGE.w}" height="${PAGE.h}" fill="url(#wSun)"/>`);
  // the underside of the surface: a net of bright wavering lines, fading down
  let net = '';
  for (let k = 0; k < 18; k++) {
    const y0 = 1 + R() * 22, a = 0.8 + R() * 1.6, p = 6 + R() * 10, ph = R() * 6, pts: P[] = [];
    for (let x = -4; x <= PAGE.w + 4; x += 4) pts.push([x, y0 + Math.sin(x / p + ph) * a + Math.sin(x / (p * 0.37) + ph * 2) * a * 0.4]);
    net += `<path d="${spline(pts)}" fill="none" stroke="${sea.glow}" stroke-width="${f(0.25 + R() * 0.35)}" stroke-opacity="${f(0.25 + R() * 0.3)}"/>`;
  }
  out.push(`<g mask="url(#wTopM)" filter="url(#wB05)">${net}</g>`);

  // lighter water behind the wreck: the dark hull and the stumps stand out against it
  out.push(`<ellipse cx="${f(sea.ship.x + 10)}" cy="${f(sea.ship.y - 50)}" rx="150" ry="80" fill="url(#wBack)"/>`);
  // the far floor in the haze: low dunes, rocks and weed as silhouettes
  const farY = (x: number) => sea.bed - 30 + Math.sin(x / 38 + sea.seed) * 3.2 + Math.sin(x / 13 + sea.seed * 2) * 1.2;
  const farPts: P[] = []; for (let x = -4; x <= PAGE.w + 4; x += 6) farPts.push([x, farY(x)]);
  let farS = `<path d="${spline(farPts)}L${PAGE.w + 4} ${PAGE.h}L-4 ${PAGE.h}Z" fill="${sea.far}"/>`;
  for (let i = 0; i < 9; i++) { const x = 8 + i * 34 + R() * 18, w = 8 + R() * 16, h = 4 + R() * 8, y = farY(x) + 1; farS += `<path d="M${f(x - w / 2)} ${f(y)}C${f(x - w / 2)} ${f(y - h)} ${f(x + w / 2)} ${f(y - h * 1.1)} ${f(x + w / 2)} ${f(y)}Z" fill="${mix(sea.far, w2, .25)}"/>`; }
  for (let i = 0; i < 12; i++) { const x = R() * PAGE.w; farS += kelp(x, farY(x) + 1, 10 + R() * 14, mix(sea.far, w2, .15), R, (R() - 0.5) * 0.3, 1.6); }
  out.push(`<g filter="url(#wB1)">${farS}</g>`);
  // a far school, faint, in the open water right of the rules
  out.push(`<g filter="url(#wB05)">${school({ x: pl.col.x - 30, y: pl.col.y + pl.col.h + 4, w: 60, h: 10 }, 14, 3.2, sea, R, 1)}</g>`);

  // ---- the wreck (in its own coordinates; the group is tilted about the middle of the waterline) ----
  const o = { kind: key, x: S.x, y: S.y, scale: s, roll: S.roll, sails: 'furled', seed: sea.seed };
  const body = K.ship(u, L, o), geom = K.shipGeom(key, o), masts = [...geom.masts].sort((a, b) => a.x - b.x);
  const hl = (sp.len / 2) * s, stem = S.x - hl, stern = S.x + hl, draft = sp.draft * s, deck = S.y - sp.free * s;
  const mx = masts.map(m => S.x + m.x * s), yb = masts.map((m, i) => S.y - (S.brk[i] ?? 0.45) * (S.y - m.top[1]));
  const jag = (i: number): P[] => [[mx[i] - 2.4 * s, yb[i] + 0.7 * s], [mx[i] - 1.1 * s, yb[i] - 1.7 * s], [mx[i] - 0.2 * s, yb[i] + 1 * s], [mx[i] + 0.8 * s, yb[i] - 1.2 * s], [mx[i] + 2.4 * s, yb[i] + 0.5 * s]];
  const xL = stem - 80, xR = stern + 80;
  const low: P[] = [[xL, S.y + 80], [xL, yb[0] - 3 * s]];
  masts.forEach((_, i) => low.push(...jag(i)));
  low.push([xR, yb[yb.length - 1] - 3 * s], [xR, S.y + 80]);
  const poly = (p: P[]) => p.map(q => `${f(q[0])},${f(q[1])}`).join(' ');
  const ship: string[] = [`<defs><clipPath id="wLow"><polygon points="${poly(low)}"/></clipPath>`];
  let fallen = '';
  if (S.fall) {
    const i = S.fall.mast, hw = 26 * s, topY = masts[i].top[1] - 12 * s, j = jag(i);
    ship.push(`<clipPath id="wHigh"><polygon points="${poly([[mx[i] - hw, topY], [mx[i] + hw, topY], [mx[i] + hw, j[4][1]], ...[...j].reverse(), [mx[i] - hw, j[0][1]]])}"/></clipPath>`);
    fallen = `<g transform="translate(${f(mx[i] + S.fall.dx)} ${f(yb[i] + S.fall.dy)}) rotate(${S.fall.rot}) translate(${f(-mx[i])} ${f(-yb[i])})"><g clip-path="url(#wHigh)">${body}</g></g>`;
  }
  ship.push('</defs>');
  // the bottom under the old waterline: fouled, with the rudder; the kit cuts the hull at the water
  ship.push(`<path d="M${f(stem - 1)} ${f(S.y - 0.5)}C${f(stem + 6 * s)} ${f(S.y + draft * 0.75)} ${f(stem + hl * 0.4)} ${f(S.y + draft)} ${f(S.x)} ${f(S.y + draft)}C${f(S.x + hl * 0.6)} ${f(S.y + draft)} ${f(stern - 3 * s)} ${f(S.y + draft * 0.8)} ${f(stern + 1.5 * s)} ${f(S.y - 0.5)}Z" fill="url(#wKeel)"/>`);
  ship.push(`<path d="M${f(stern - 0.5 * s)} ${f(S.y - 2 * s)}L${f(stern + 3.8 * s)} ${f(S.y - 1 * s)}L${f(stern + 3 * s)} ${f(S.y + draft * 0.82)}L${f(stern - 1.5 * s)} ${f(S.y + draft * 0.86)}Z" fill="#1c1b16"/>`);
  for (let i = 0; i < 26; i++) { const x = stem + 8 * s + R() * (stern - stem - 14 * s), y = S.y + R() * draft * 0.8; ship.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.6 + R() * 1.6)}" ry="${f(0.4 + R() * 0.9)}" fill="${sea.weed[i % 3]}" fill-opacity=".55"/>`); }
  // the fallen top lies behind the hull
  ship.push(fallen, `<g clip-path="url(#wLow)">${body}</g>`);
  // rigging hanging from the stumps, loose ends floating up; rags of sail swaying
  const rope = (a: P, b: P, sag: number, w = 0.42) => `<path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + sag)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="#1e1a14" stroke-width="${w}" stroke-linecap="round"/>`;
  masts.forEach((_, i) => {
    const top: P = [mx[i], yb[i] + 1.5 * s];
    ship.push(rope(top, [mx[i] - 16 * s, deck + 1.5 * s], 9), rope(top, [mx[i] + 13 * s, deck + 1 * s], 7), rope([mx[i] + 0.4 * s, yb[i] + 5 * s], [mx[i] - 8 * s, deck + 2 * s], 5, 0.32));
    let d = `M${f(mx[i] + 0.5 * s)} ${f(yb[i] + 2 * s)}`;
    for (let k = 1; k <= 6; k++) d += `L${f(mx[i] + 0.5 * s + Math.sin(k * 1.3 + i) * 1.6 + k * 1.1)} ${f(yb[i] + 2 * s - k * 3.2)}`;
    ship.push(`<path d="${d}" fill="none" stroke="#2a241a" stroke-width=".35" stroke-linejoin="round"/>`);
    const rx0 = mx[i] + (i % 2 ? -1 : 1) * 3 * s, ry0 = yb[i] + 6 * s, rw = (5 + R() * 4) * s, rh = (5 + R() * 5) * s;
    ship.push(`<path d="M${f(rx0)} ${f(ry0)}C${f(rx0 + rw * 0.4)} ${f(ry0 - 1.5)} ${f(rx0 + rw * 0.8)} ${f(ry0 + 1)} ${f(rx0 + rw)} ${f(ry0 - 0.5)}L${f(rx0 + rw * 0.9)} ${f(ry0 + rh * 0.6)}L${f(rx0 + rw * 0.7)} ${f(ry0 + rh * 0.4)}L${f(rx0 + rw * 0.55)} ${f(ry0 + rh)}L${f(rx0 + rw * 0.35)} ${f(ry0 + rh * 0.55)}L${f(rx0 + rw * 0.15)} ${f(ry0 + rh * 0.8)}Z" fill="${sea.rag}" fill-opacity=".88"/>`);
  });
  // the fallen top still hangs in its rigging: stays from it down to the rail
  if (S.fall) {
    const i = S.fall.mast, a = S.fall.rot * Math.PI / 180, b0: P = [mx[i] + S.fall.dx, yb[i] + S.fall.dy], at = (d: number): P => [b0[0] + Math.sin(a) * d, b0[1] - Math.cos(a) * d];
    for (const [d, x, sag] of [[22, 0.55, 6], [36, 0.75, 9], [48, 0.95, 4]] as const) ship.push(rope(at(d * s), [S.x + x * hl, deck - 1.5 * s + x * 2 * s], sag, 0.38));
  }
  // weed along the rail and on the hull, swaying up
  for (let i = 0; i < 9; i++) { const x = stem + 14 * s + (i / 8) * (stern - stem - 26 * s) + (R() - 0.5) * 8; ship.push(kelp(x, deck + 2 + R() * 3, 6 + R() * 10, sea.weed[i % 3], R, 0.1, 1.4)); }
  const tilt = -S.tilt, ra = tilt * Math.PI / 180;
  const rot = (p: P): P => [S.x + (p[0] - S.x) * Math.cos(ra) - (p[1] - S.y) * Math.sin(ra), S.y + (p[0] - S.x) * Math.sin(ra) + (p[1] - S.y) * Math.cos(ra)];
  out.push(`<g transform="rotate(${f(tilt)} ${f(S.x)} ${f(S.y)})">${ship.join('')}</g>`);

  // the water between us and the wreck, then the light coming down through it
  out.push(`<rect width="${PAGE.w}" height="${PAGE.h}" fill="${sea.haze[0]}" fill-opacity="${sea.haze[1]}"/>`);
  let rays = '';
  for (let i = 0; i < 10; i++) {
    const x = -30 + i * 34 + R() * 22, w = 5 + R() * 15, len = 140 + R() * 80, op = sea.rays * (0.45 + R() * 0.75);
    rays += `<polygon points="${f(x)},-8 ${f(x + w)},-8 ${f(x + w * 1.7)},${f(len)} ${f(x - w * 0.3)},${f(len)}" fill="url(#wRay)" opacity="${f(op)}" transform="rotate(-15 ${f(x)} -8)"/>`;
  }
  out.push(`<g filter="url(#wB2)">${rays}</g>`);
  // bubbles from the broken masts and the stern
  for (let i = 0; i < masts.length; i++) out.push(bubbles(...rot([mx[i], yb[i]]), 0, sea.glow, R));
  out.push(bubbles(...rot([stern - 6 * s, deck - 10 * s]), 0, sea.glow, R), bubbles(...rot([S.x - 10 * s, deck]), 40, sea.glow, R));
  // schools in the open water: between the cartouche and the column, under the column
  const gx = pl.title.x + pl.title.w + 8, gw = pl.col.x - 6 - gx;
  if (gw > 24) out.push(school({ x: gx, y: 8, w: gw, h: 18 }, Math.round(gw / 4.2), 5.2, sea, R));
  out.push(school({ x: pl.col.x + 4, y: pl.col.y + pl.col.h + 6, w: pl.col.w - 8, h: 14 }, 11, 5.4, sea, R));

  // ---- the floor in front: the sand heaps over the bow and drops under the stern ----
  const stemP = rot([stem, S.y]), sternP = rot([stern, S.y]);
  const bed = (x: number) => sea.bed + Math.sin(x / 27 + sea.seed) * 2.2 + Math.sin(x / 11 + sea.seed * 3) * 1.1;
  const hullY = (x: number) => { const t = Math.max(0, Math.min(1, (x - stemP[0]) / (sternP[0] - stemP[0]))); return stemP[1] + t * (sternP[1] - stemP[1]) - (S.bow + (S.stern - S.bow) * smooth(t)) + Math.sin(x / 6.5) * 0.8; };
  const sandY = (x: number) => {
    if (x >= stemP[0] && x <= sternP[0]) return hullY(x);
    const d = x < stemP[0] ? stemP[0] - x : x - sternP[0], k = smooth(d / 40);
    return hullY(x) * (1 - k) + bed(x) * k - (x < stemP[0] ? 5 * Math.exp(-Math.pow(d / 16, 2)) : 0);
  };
  const sp2: P[] = []; for (let x = -4; x <= PAGE.w + 4; x += 3) sp2.push([x, Math.min(PAGE.h - 4, sandY(x))]);
  out.push(`<path d="${spline(sp2)}L${PAGE.w + 4} ${PAGE.h + 2}L-4 ${PAGE.h + 2}Z" fill="url(#wSand)"/>`);
  out.push(`<path d="${spline(sp2)}" fill="none" stroke="${mix(sea.sand[0], '#ffffff', .25)}" stroke-width=".7" stroke-opacity=".55" filter="url(#wB05)"/>`);
  // ripples: rows of short waves following the floor, a dark trough and a lit crest
  let rip = '';
  for (let row = 0; row < 7; row++) {
    for (let x = R() * 10; x < PAGE.w; x += 10 + R() * 14) {
      const len = 7 + R() * 14, off = 3 + row * 2.6 + R() * 1.2, pts: P[] = [];
      for (let xx = x; xx <= x + len; xx += 1.5) pts.push([xx, Math.min(PAGE.h - 1, sandY(xx)) + off + Math.sin(xx * 0.9) * 0.35]);
      if (pts[0][1] > PAGE.h - 1) continue;
      rip += `<path d="${spline(pts)}" fill="none" stroke="${sea.sand[2]}" stroke-width="${f(0.3 + row * 0.05)}" stroke-opacity=".45"/>` +
        `<path d="${spline(pts.map(q => [q[0], q[1] - 0.5] as P))}" fill="none" stroke="${sea.sand[0]}" stroke-width="${f(0.25 + row * 0.04)}" stroke-opacity=".5"/>`;
    }
  }
  out.push(rip);
  // light dancing on the sand
  let spots = '';
  for (let i = 0; i < 40; i++) { const x = R() * PAGE.w, y = Math.min(PAGE.h - 2, sandY(x) + 2 + R() * 14); spots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.5 + R() * 3.5)}" ry="${f(0.4 + R() * 0.7)}" fill="${sea.glow}" fill-opacity="${f(0.1 + R() * 0.14)}"/>`; }
  out.push(`<g filter="url(#wB05)">${spots}</g>`);

  // the things on the floor, far ones first; a lip of sand over each one's foot
  const lip = (x: number, y: number, w: number) => `<path d="M${f(x - w / 2)} ${f(y + 1.6)}C${f(x - w / 3)} ${f(y - 1.2)} ${f(x + w / 3)} ${f(y - 1.4)} ${f(x + w / 2)} ${f(y + 1.6)}Z" fill="url(#wSand)"/><path d="M${f(x - w / 2.6)} ${f(y + 0.4)}C${f(x - w / 4)} ${f(y - 0.9)} ${f(x + w / 4)} ${f(y - 1.1)} ${f(x + w / 2.6)} ${f(y + 0.4)}" fill="none" stroke="${sea.sand[0]}" stroke-width=".35" stroke-opacity=".6"/>`;
  const items = sea.props.map(p => ({ ...p, y: Math.min(PAGE.h - 2, sandY(p.x) + p.dy) })).sort((a, b) => a.y - b.y);
  let n = 0;
  for (const p of items) {
    const uu = `${u}p${n++}`, o2 = { x: p.x, y: p.y, s: p.s, rot: p.rot ?? 0, seed: n };
    if (p.kind === 'anchor') out.push(K.anchor(uu, L, o2), lip(p.x + 8, p.y + 1, 26));
    else if (p.kind === 'cannon') out.push(K.cannon(uu, L, { ...o2, carriage: false }), lip(p.x - 6, p.y + 0.6, 30));
    else if (p.kind === 'chest') out.push(K.chest(uu, L, { ...o2, open: 0.85, gold: true }), lip(p.x, p.y + 0.6, 30 * p.s));
    else if (p.kind === 'shot') out.push(K.shot(uu, L, o2), lip(p.x, p.y + 0.4, 7 * p.s));
    else if (p.kind === 'bottle') out.push(K.bottle(uu, L, { ...o2, lying: true }), lip(p.x, p.y + 0.4, 12 * p.s));
    else out.push(K.rock(uu, L, { ...o2, w: 24, h: 15, foam: false }));
  }
  // corals and weed: tufts along the floor, clusters in the corners, by the buried bow
  const cl = sea.coral;
  out.push(fanCoral(10, sandY(10) + 6, 26, cl[1], R), branchCoral(20, sandY(20) + 9, 20, cl[0], R), domeCoral(5, sandY(5) + 12, 9, 6, cl[2], R, 'wDome1'));
  out.push(fanCoral(PAGE.w - 9, sandY(PAGE.w - 9) + 7, 24, cl[1], R), branchCoral(PAGE.w - 22, sandY(PAGE.w - 22) + 10, 18, cl[0], R), domeCoral(PAGE.w - 34, sandY(PAGE.w - 34) + 13, 7, 4.6, cl[2], R, 'wDome2'));
  out.push(branchCoral(stemP[0] - 6, sandY(stemP[0] - 6) + 4, 14, cl[2], R), domeCoral(stemP[0] + 16, sandY(stemP[0] + 16) + 3, 6, 4, cl[0], R, 'wDome3'));
  for (const x of [44, 82, 128, 172, 226, 246]) out.push(tuft(x, Math.min(PAGE.h - 1, sandY(x) + 4 + R() * 6), 10 + R() * 9, sea.weed, R, 3));
  if (sea.shells) for (let i = 0; i < 14; i++) { const x = 20 + R() * (PAGE.w - 40); out.push(shell(x, Math.min(PAGE.h - 2, sandY(x) + 3 + R() * 12), 0.8 + R() * 0.6, (R() - 0.5) * 60, i % 3 === 0 ? 1 : 0)); }
  // big dark kelp at the edges of the sheet, close to the eye
  out.push(tuft(-1, PAGE.h + 2, 46, sea.weed.map(c => mix(c, '#000000', .35)), R, 4), tuft(PAGE.w + 1, PAGE.h + 2, 40, sea.weed.map(c => mix(c, '#000000', .35)), R, 4));
  // specks drifting in the water, the vignette
  let snow = '';
  for (let i = 0; i < 280; i++) snow += `<circle cx="${f(R() * PAGE.w)}" cy="${f(R() * PAGE.h * 0.92)}" r="${f(0.08 + R() * 0.28)}" fill="${sea.glow}" fill-opacity="${f(0.15 + R() * 0.35)}"/>`;
  out.push(snow, `<rect width="${PAGE.w}" height="${PAGE.h}" fill="url(#wVig)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${out.join('\n')}</svg>`;
}

// ---- the ship token (the same picture as the new token on sheet 04: the kit ship on paper) ----
const TPIC = { w: 30, h: 21.4 }, TPAPER = '#fbf6ea';
async function tokenPic(ctx: Ctx, ship: Ship): Promise<string> {
  const kind = DECK_KEY[ship.code], b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), m = 1.2, wl = TPIC.h - 1.4, k = Math.min((TPIC.w - 2 * m) / b.w, (wl - m) / b.h);
  const body = K.ship('tk' + kind, K.makeLight(K.LIGHTS.endeavour, { horizon: wl - 2 }), { kind, x: TPIC.w / 2 - k * (b.x0 + b.x1) / 2, y: wl, scale: k });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TPIC.w} ${TPIC.h}"><rect width="${TPIC.w}" height="${TPIC.h}" fill="${TPAPER}"/>${body}<path d="M1 ${wl + 0.5}q1.2 -.6 2.4 0${'t2.4 0'.repeat(11)}" fill="none" stroke="#6f8a96" stroke-width=".25"/></svg>`;
  return (await rasterJpeg(ctx.browser, 'token-ship-' + kind, svg, TPIC.w, TPIC.h, ctx.opts.draft ? 300 : 600, 0.92)).url;
}

// ---- the plates ----
const TITLE_O: TO = { font: 'Alegreya SC', w: 800, ls: '.06em' }, SUB_O: TO = { font: 'Alegreya', italic: true, w: 500 };
const HEAD_O: TO = { font: 'Alegreya SC', w: 800, ls: '.04em' }, LAB_O: TO = { font: 'Alegreya Sans', w: 800 };
const COL = { w: 90, pad: 4.5, token: 24, row: 13, gap: 4 };
const RULES = { y: 39, padX: 7, padTop: 5.5, padBottom: 8, maxBottom: 137 };
const r2 = (n: number) => Math.round(n * 100) / 100;
/** the measured HTML blocks: the rules page and the note in the column */
const FIT = new Map<string, { rs: number; rh: number; ns: number; nh: number }>();
async function fitBlocks(ctx: Ctx, ship: Ship, rulesW: number, noteW: number): Promise<{ rs: number; rh: number; ns: number; nh: number }> {
  const got = FIT.get(ship.code); if (got) return got;
  const page = await ctx.browser.newPage();
  const h = async (html: string, w: number) => { await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}${WRECK_CSS}</style><div id="b" style="position:absolute;left:0;top:0;width:${w}mm">${html}</div>`); await page.evaluate(async () => { await document.fonts.ready; }); return (await page.evaluate(() => (document.getElementById('b') as HTMLElement).scrollHeight)) * 25.4 / 96; };
  try {
    let rs = 12.5, rh = 0;
    for (; rs >= 10; rs = Math.round((rs - 0.25) * 100) / 100) { rh = await h(rulesHtml(rs), rulesW); if (RULES.y + RULES.padTop + rh + RULES.padBottom <= RULES.maxBottom) break; }
    let ns = 11.5, nh = 0;
    for (; ns >= 9.5; ns = Math.round((ns - 0.25) * 100) / 100) { nh = await h(noteHtml(ship, ns), noteW); if (nh <= 34) break; }
    const v = { rs, rh: Math.ceil(rh * 10) / 10 + 0.4, ns, nh: Math.ceil(nh * 10) / 10 + 0.4 };
    FIT.set(ship.code, v); return v;
  } finally { await page.close(); }
}
function rulesHtml(size: number): string {
  const sec = rulesSection(FTXT.wreck.section);
  return `<div class="wr-rules" style="--fs:${size}pt"><div class="wr-h">${esc(FTXT.wreck.section)}</div>${sec.p.map(p => `<p>${md(noRef(p))}</p>`).join('')}<ul>${sec.li.map(l => `<li>${md(noRef(l))}</li>`).join('')}</ul><p class="wr-q">${md(noRef(rulesLine(FTXT.wreck.captainLine)))}</p></div>`;
}
function noteHtml(ship: Ship, size: number): string {
  const jones = jonesLine(ship);
  return `<div class="wr-note" style="--ns:${size}pt"><p>${esc(FTXT.wreck.clear[ship.code] ?? FTXT.wreck.clear._)}</p>${jones ? `<p><b>${esc(FTXT.wreck.jones)}</b> ${esc(noRef(jones))}</p>` : ''}</div>`;
}
/** the heading of the column in two lines, cut at the dash: «Капитан —» / «на борту союзника» */
const headLines = () => { const t = FTXT.wreck.free, i = t.indexOf(' — '); return i > 0 ? [t.slice(0, i + 2), t.slice(i + 3)] : [t]; };

interface Plan { title: Rect; rules: Rect; col: Rect; head: Rect; cells: P[]; labels: Rect[]; note: Rect; token: Rect; titleSize: number; headSize: number }
function plan(ship: Ship, fit: { rh: number; nh: number }): Plan {
  const tw = Math.max(24 + widthOf(FTXT.wreck.title, 26, TITLE_O) + 6, 24 + widthOf(`${ship.name} · ${ship.captain}`, 12, SUB_O) + 5, 112);
  const title = { x: 16, y: 11, w: tw, h: 23 };
  const col = { x: PAGE.w - 12 - COL.w, y: 11, w: COL.w, h: 0 }, p = COL.pad;
  const rules = { x: 14, y: RULES.y, w: col.x - 8 - 14, h: RULES.padTop + fit.rh + RULES.padBottom };
  const token = { x: col.x + p, y: col.y + p, w: COL.token, h: COL.token };
  const head = { x: token.x + token.w + 3, y: token.y + 2, w: col.x + col.w - p - (token.x + token.w + 3), h: COL.token - 4 };
  const lines = headLines(), widest = Math.max(...lines.map(l => widthOf(l, 12.5, HEAD_O)));
  const headSize = Math.min(12.5, Math.floor(((head.w - 5.5) / widest) * 12.5 * 4) / 4);
  let y = token.y + token.h + 5;
  const cells: P[] = [], labels: Rect[] = [];
  for (let i = 0; i < 2; i++) {
    const cy = y + i * (COL.row + COL.gap);
    cells.push([col.x + p, cy]);
    const lx = col.x + p + C + 10.5;
    labels.push({ x: lx, y: cy + 1, w: col.x + col.w - p - lx, h: C - 2 });
  }
  y += 2 * COL.row + COL.gap + 5;
  const note = { x: col.x + p, y, w: col.w - 2 * p, h: fit.nh + 6 };
  col.h = note.y + note.h + p - col.y;
  return { title, rules, col, head, cells, labels, note, token, titleSize: 26, headSize };
}

/** a rope the plates hang by: a dark lay with a lighter twist, a brass ring at the foot */
function hang(x: number, y0: number, y1: number, brass: string): string {
  return `<path d="M${r2(x)} ${r2(y0)}V${r2(y1 - 0.9)}" stroke="#2a1e10" stroke-width=".8"/><path d="M${r2(x)} ${r2(y0)}V${r2(y1 - 0.9)}" stroke="#b89a64" stroke-width=".4" stroke-dasharray=".7 .7"/>` +
    `<circle cx="${r2(x)}" cy="${r2(y1 - 0.4)}" r="1.15" fill="none" stroke="${brass}" stroke-width=".45"/>`;
}
/** the cartouche of the title: scrolled ends like the face's header, the medallion with the ship's letter */
function titleSvg(b: Rect, ship: Ship, pal: Pal, L: Look, id: string): string {
  const { x, y, w, h } = b, out: string[] = [];
  const shape = `M${x + 5} ${y}H${x + w - 5}C${x + w - 1.5} ${y} ${x + w} ${y + 2.4} ${x + w + 2.2} ${y + 1.6}C${x + w + 0.6} ${y + h / 2} ${x + w + 0.6} ${y + h / 2} ${x + w + 2.2} ${y + h - 1.6}C${x + w} ${y + h - 2.4} ${x + w - 1.5} ${y + h} ${x + w - 5} ${y + h}H${x + 5}C${x + 1.5} ${y + h} ${x} ${y + h - 2.4} ${x - 2.2} ${y + h - 1.6}C${x - 0.6} ${y + h / 2} ${x - 0.6} ${y + h / 2} ${x - 2.2} ${y + 1.6}C${x} ${y + 2.4} ${x + 1.5} ${y} ${x + 5} ${y}Z`;
  out.push(`<path d="${shape}" fill="#05080c" fill-opacity=".38" transform="translate(.7 1)"/><path d="${shape}" fill="url(#${id}paper)" stroke="${L.paperLine}" stroke-width=".4"/>`);
  out.push(`<rect data-plate="wtitle" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="none"/><rect x="${r2(x + 1.6)}" y="${r2(y + 1.4)}" width="${r2(w - 3.2)}" height="${r2(h - 2.8)}" rx="1" fill="none" stroke="${L.paperLine}" stroke-width=".2" stroke-opacity=".8"/>`);
  const mx = x + 11.5, my = y + h / 2;
  out.push(`<g data-plate="wtitle-medal"><circle cx="${r2(mx)}" cy="${r2(my)}" r="8.4" fill="url(#${id}brh)" stroke="${L.brass[2]}" stroke-width=".3"/><circle cx="${r2(mx)}" cy="${r2(my)}" r="7" fill="${pal.solid}"/><circle cx="${r2(mx)}" cy="${r2(my)}" r="6.2" fill="none" stroke="#fff8e6" stroke-width=".22" stroke-opacity=".7"/></g>`);
  out.push(text(mx, my + pt(20) * 0.33, ship.code, 20, { font: 'Alegreya SC', w: 800, color: '#fff8e6', anchor: 'middle', in: 'wtitle-medal' }));
  out.push(text(x + 23.5, y + 11.2, FTXT.wreck.title, 26, { ...TITLE_O, color: pal.deep, in: 'wtitle' }));
  out.push(text(x + 23.5, y + 19.4, `${ship.name} · ${ship.captain}`, 12, { ...SUB_O, color: L.ink, in: 'wtitle' }));
  return out.join('');
}
/** the rules: a waterlogged page, the foot torn, darker at the edges */
function rulesSvg(b: Rect, L: Look, pal: Pal, id: string): string {
  const { x, y, w, h } = b, pts: string[] = [];
  for (let i = 0; i <= 36; i++) pts.push(`${r2(x + w - (w * i) / 36)} ${r2(y + h - (i % 2 ? 1.1 : 0) - (i % 5 === 0 ? 0.6 : 0) - (i % 7 === 3 ? 0.5 : 0))}`);
  const page = `M${x + 1.4} ${y}H${x + w - 1.4}Q${x + w} ${y} ${x + w} ${y + 1.4}V${y + h}L${pts.join('L')}V${y + 1.4}Q${x} ${y} ${x + 1.4} ${y}Z`;
  return `<defs><radialGradient id="${id}soak" cx=".5" cy=".45" r=".72"><stop offset=".6" stop-color="${L.paper}"/><stop offset="1" stop-color="${mix(L.paper, '#6a4a24', 0.16)}"/></radialGradient></defs>` +
    `<path d="${page}" fill="#05080c" fill-opacity=".38" transform="translate(.8 1.1)"/><path data-plate="wtext" d="${page}" fill="url(#${id}soak)" stroke="${L.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    `<rect x="${r2(x + 1.2)}" y="${r2(y + 1.2)}" width="${r2(w - 2.4)}" height="${r2(h - 3.6)}" rx=".8" fill="none" stroke="${L.paperLine}" stroke-opacity=".5" stroke-width=".18"/>` +
    `<path d="M${r2(x + 3.4)} ${r2(y + 1.2)}V${r2(y + h - 2.6)}" stroke="${pal.deep}" stroke-opacity=".35" stroke-width=".25"/>`;
}
/** the brass column: a plate on two ropes, rivets in the corners; sunken light panels under the words */
function columnSvg(p: Plan, L: Look, pal: Pal, id: string, tokenUrl: string, ship: Ship): string {
  const { col } = p, [bl, bm, bd] = L.brass, ink = '#2a1a08', out: string[] = [];
  out.push(`<defs><linearGradient id="${id}col" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".55" stop-color="${mix(bl, bm, 0.7)}"/><stop offset="1" stop-color="${bm}"/></linearGradient></defs>`);
  out.push(`<rect x="${r2(col.x + 0.8)}" y="${r2(col.y + 1.1)}" width="${col.w}" height="${r2(col.h)}" rx="2" fill="#05080c" fill-opacity=".42"/>`);
  out.push(`<rect data-plate="wcol" x="${col.x}" y="${col.y}" width="${col.w}" height="${r2(col.h)}" rx="2" fill="url(#${id}col)" stroke="${bd}" stroke-width=".35"/>`);
  out.push(`<rect x="${r2(col.x + 1.1)}" y="${r2(col.y + 1.1)}" width="${r2(col.w - 2.2)}" height="${r2(col.h - 2.2)}" rx="1.2" fill="none" stroke="${bd}" stroke-width=".2" stroke-opacity=".8"/><path d="M${r2(col.x + 2)} ${r2(col.y + 0.6)}H${r2(col.x + col.w - 2)}" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".3"/>`);
  for (const [rx, ry] of [[col.x + 2.6, col.y + 2.6], [col.x + col.w - 2.6, col.y + 2.6], [col.x + 2.6, col.y + col.h - 2.6], [col.x + col.w - 2.6, col.y + col.h - 2.6]]) out.push(`<circle cx="${r2(rx)}" cy="${r2(ry)}" r=".9" fill="${bm}" stroke="${bd}" stroke-width=".22"/><circle cx="${r2(rx - 0.25)}" cy="${r2(ry - 0.25)}" r=".3" fill="#fff6d8" fill-opacity=".7"/>`);
  // the token: the kit ship on paper, the band in the ship's colour with its letter
  const t = p.token, k = t.w / 30, band = { x: t.x, y: t.y + 21.4 * k, w: t.w, h: t.h - 21.4 * k };
  out.push(`<rect x="${r2(t.x + 0.6)}" y="${r2(t.y + 0.8)}" width="${t.w}" height="${t.h}" fill="#1a0e04" fill-opacity=".35"/><g data-plate="wtoken"><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="${TPAPER}"/><image href="${tokenUrl}" x="${t.x}" y="${t.y}" width="${r2(TPIC.w * k)}" height="${r2(TPIC.h * k)}" preserveAspectRatio="none"/></g>`);
  out.push(`<rect data-plate="wtoken-band" x="${r2(band.x)}" y="${r2(band.y)}" width="${r2(band.w)}" height="${r2(band.h)}" fill="${ship.color}"/><path d="M${r2(band.x)} ${r2(band.y)}H${r2(band.x + band.w)}" stroke="${bl}" stroke-width=".35"/>`);
  out.push(`<circle cx="${r2(band.x + band.w / 2)}" cy="${r2(band.y + band.h / 2)}" r="${r2(band.h / 2 - 0.5)}" fill="${mix(ship.color, '#000000', 0.25)}" stroke="${bl}" stroke-width=".3"/>`);
  out.push(text(band.x + band.w / 2, band.y + band.h / 2 + pt(7.5) * 0.33, ship.code, 7.5, { font: 'Alegreya SC', w: 800, color: '#fff4d8', anchor: 'middle', in: 'wtoken-band' }));
  out.push(`<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="none" stroke="${bd}" stroke-width=".3"/>`);
  // the heading on a sunken panel, two lines
  const hd = p.head, lines = headLines(), em = pt(p.headSize), gap = em * 1.48, top = hd.y + hd.h / 2 - (gap * (lines.length - 1)) / 2 + 0.33 * em;
  out.push(`<rect data-plate="whead" x="${r2(hd.x)}" y="${r2(hd.y)}" width="${r2(hd.w)}" height="${r2(hd.h)}" rx="1" fill="${bl}" fill-opacity=".75" stroke="${bd}" stroke-width=".25"/>`);
  lines.forEach((l, i) => out.push(text(hd.x + 2.5, top + i * gap, l, p.headSize, { ...HEAD_O, color: pal.deep, in: 'whead' })));
  // the two cells, each with its icon and its words
  const icons = ['cards', 'reaction'] as const;
  p.cells.forEach((c, i) => {
    const lb = p.labels[i];
    out.push(cellSvg(`wcell${i}`, c[0], c[1], id, L));
    out.push(ico(icons[i], c[0] + C + 5, c[1] + C / 2, 6.4, { ...L.tone, ink, paper: bm }, `wcell${i}-icon`));
    out.push(`<rect data-plate="wlab${i}" x="${r2(lb.x)}" y="${r2(lb.y)}" width="${r2(lb.w)}" height="${r2(lb.h)}" rx="1" fill="${bl}" fill-opacity=".75" stroke="${bd}" stroke-width=".25"/>`);
    out.push(text(lb.x + 2.5, lb.y + lb.h / 2 + 0.33 * pt(12), FTXT.wreck.ally[i], 12, { ...LAB_O, color: ink, in: `wlab${i}` }));
  });
  // the note: a slip of parchment riveted into the brass
  const n = p.note;
  out.push(`<rect data-plate="wnote" x="${r2(n.x)}" y="${r2(n.y)}" width="${r2(n.w)}" height="${r2(n.h)}" rx="1" fill="url(#${id}paper)" stroke="${bd}" stroke-width=".3"/><rect x="${r2(n.x + 0.9)}" y="${r2(n.y + 0.9)}" width="${r2(n.w - 1.8)}" height="${r2(n.h - 1.8)}" rx=".6" fill="none" stroke="${L.paperLine}" stroke-opacity=".5" stroke-width=".18"/>`);
  return out.join('');
}

/** One back «Затонул», v3. */
export async function wreckV3(ctx: Ctx, ship: Ship, mat?: ShipMaterial): Promise<{ html: string; css: string }> {
  const key = DECK_KEY[ship.code] as ShipKey, Lk = LOOKS[key], base = basePalette(ship.color), pal = mat?.palette ? mat.palette(base) : base, sea = SEA[key], id = `wr${key}`;
  // the words' widths come from the browser: a dry run collects them
  plan(ship, { rh: 80, nh: 20 });
  await measureMissing(ctx);
  const d2 = plan(ship, { rh: 80, nh: 20 });
  const fit = await fitBlocks(ctx, ship, d2.rules.w - 2 * RULES.padX, d2.note.w - 6);
  const p = plan(ship, fit);
  const jpg = await rasterJpeg(ctx.browser, `wreck3-${key}`, seaFloorSvg(key, sea, p), PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);
  const tokenUrl = await tokenPic(ctx, ship);
  const brass = Lk.brass[1], svg: string[] = [defsOf(id, Lk)];
  svg.push(hang(p.title.x + 14, 0, p.title.y, brass), hang(p.title.x + p.title.w - 14, 0, p.title.y, brass));
  svg.push(hang(p.title.x + 26, p.title.y + p.title.h, p.rules.y, brass), hang(p.title.x + p.title.w - 26, p.title.y + p.title.h, p.rules.y, brass));
  svg.push(hang(p.col.x + 14, 0, p.col.y, brass), hang(p.col.x + p.col.w - 14, 0, p.col.y, brass));
  svg.push(titleSvg(p.title, ship, pal, Lk, id), rulesSvg(p.rules, Lk, pal, id), columnSvg(p, Lk, pal, id, tokenUrl, ship));
  const rx = p.rules.x + RULES.padX, ry = p.rules.y + RULES.padTop, rw = p.rules.w - 2 * RULES.padX;
  const html = `<div class="wr-abs" data-in="wtext" data-name="правила «Корабль тонет»" style="left:${r2(rx)}mm;top:${r2(ry)}mm;width:${r2(rw)}mm;height:${r2(fit.rh)}mm;--ink:${Lk.ink};--soft:${Lk.soft};--c:${pal.deep};--dot:${Lk.brass[1]};--rule:${Lk.noteLine}">${rulesHtml(fit.rs)}</div>
<div class="wr-abs" data-in="wnote" data-name="что снять" style="left:${r2(p.note.x + 3)}mm;top:${r2(p.note.y + 3)}mm;width:${r2(p.note.w - 6)}mm;height:${r2(fit.nh)}mm;--ink:${Lk.ink};--c:${pal.deep}">${noteHtml(ship, fit.ns)}</div>`;
  return { html: `<div class="wr wr-${key}"><svg class="wr-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>${svg.join('\n')}</svg>\n${html}</div>`, css: WRECK_CSS };
}

export const WRECK_CSS = `
.wr{position:absolute;inset:0}
.wr-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.wr-abs{position:absolute;overflow:hidden}
.wr-rules{font:500 var(--fs) 'Alegreya Sans',sans-serif;line-height:1.27;color:var(--ink)}
.wr-rules .wr-h{font:800 calc(var(--fs) + 2pt)/1.1 'Alegreya SC',serif;letter-spacing:.05em;color:var(--c);margin-bottom:1.8mm}
.wr-rules p{margin:0}
.wr-rules b{font-weight:800}
.wr-rules ul{margin:1.4mm 0 0;padding:0;list-style:none}
.wr-rules li{position:relative;padding-left:4.8mm;margin-top:1.2mm}
.wr-rules li::before{content:'';position:absolute;left:.8mm;top:calc(.635em - .85mm);width:1.7mm;height:1.7mm;border-radius:50%;background:var(--dot)}
.wr-rules .wr-q{margin-top:2.6mm;padding-top:1.8mm;border-top:.3mm solid var(--rule);font:italic 500 calc(var(--fs) - .5pt)/1.27 Alegreya,serif;color:var(--soft)}
.wr-note{font:500 var(--ns) 'Alegreya Sans',sans-serif;line-height:1.25;color:var(--ink)}
.wr-note p{margin:0}
.wr-note p+p{margin-top:1.4mm}
.wr-note b{font-weight:800;color:var(--c)}
`;
