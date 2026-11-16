// 03 — the back «Затонул» of a ship board, v3 (composition B «дно под толщей воды»): the ship lies wrecked on the sea floor
// in the lower part of the sheet, heeled and bow down, the keel and the bow buried in the sand that heaps along her side;
// the masts are snapped and the main top lies across the stern with its tip in the sand. One floor runs from the foot of
// the sheet to a hazy far edge; one light comes from above, a little from the left: the rays slant down to the right,
// caustics dance on the sand and on the hull, every thing on the floor lies on it and casts its shadow, far things fade
// into the water. The scene is one raster (soft light, blurs, the caustic noise); the plates are vector and hang over the
// water: the cartouche on ropes from the surface, the rules as a scroll on two rollers tied under the cartouche, the brass
// column «Капитан — на борту союзника» with the ship token and the two lines for the ally.
//
// The frame is shared by the four ships; per ship only SEA[key] changes (see Sea). The words are those of the old back
// (boards.json → frame.wreck and rules.md «Корабль тонет»), word for word. Every word is data-in="<its plate>"
// (tools/print/check-layout.ts). WRECK_CHECK (filled when a back is built, printed by check.ts) checks the physics: every
// thing lies on the sand, nothing overlaps the hull or another thing, the hull sits in the sand, the plates leave the
// hull free.
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT, esc, fontCss, type Ctx } from '../../kit';
import { type Ship } from '../../layout';
import { DECK_KEY } from '../../colors';
import { rasterJpeg } from '../../map/raster';
import { iconSvg, type IconName, type IconTone } from '../icons';
import { TXT as FTXT, basePalette, jonesLine, md, measureMissing, noRef, rulesLine, rulesSection, widthOf, type Pal, type ShipKey, type ShipMaterial, type TO } from './frame';
import { LOOKS, defsOf, ico, text, type Look } from './v2';

type P = [number, number];
interface Rect { x: number; y: number; w: number; h: number }
interface Box { x0: number; y0: number; x1: number; y1: number }
type KitFn = (u: string, L: unknown, o: Record<string, unknown>) => string;
const require = createRequire(import.meta.url);
const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship: KitFn; anchor: KitFn; cannon: KitFn; shot: KitFn; chest: KitFn; bottle: KitFn; rock: KitFn; barrel: KitFn; crate: KitFn;
  castShadow(u: string, L: unknown, o: { x: number; y: number; w: number; h: number; horizon: number; d?: number; opacity?: number }): string;
  makeLight(l: unknown, cam: { horizon: number }): unknown; LIGHTS: Record<string, { key: Record<string, unknown> } & Record<string, unknown>>;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number };
  shipGeom(kind: string, o: Record<string, unknown>): { masts: { x: number; H: number; top: P }[]; nearRail(X: number): number[]; farRail(X: number): number[] };
  SHIP_SPECS: Record<string, { len: number; free: number; draft: number; over: number; bow: number[]; tw: number[] }>;
};

// ---- the look of each ship's sea floor ----
type PropKind = 'anchor' | 'cannon' | 'chest' | 'shot' | 'bottle' | 'rock' | 'barrel' | 'crate';
/** a thing on the floor: (x, y) is the middle of its foot on the sand (mm); s — the kit's scale; rot — degrees */
interface Prop { kind: PropKind; x: number; y: number; s: number; rot?: number }
interface Sea {
  /** the kit's light of the deck (LIGHTS key), turned to come from above, a little from the left */
  light: 'pearl' | 'revenge' | 'endeavour' | 'dutchman';
  /** the water: under the surface, mid-depth, at the floor */
  water: [string, string, string];
  /** the light from the surface (rays, caustics, bubbles, specks) and the strength of the rays */
  glow: string; rays: number;
  /** the water between the eye and the wreck: colour and strength; the lighter water behind the wreck (its silhouette reads) */
  haze: [string, number]; back: [string, number];
  /** the sand: lit crest, body, shade */
  sand: [string, string, string];
  /** fish colour and opacity; corals; weed; the rags of the sails; shells grown on the hull (the Dutchman) */
  fish: [string, number]; coral: string[]; weed: string[]; rag: string; shells?: boolean;
  /** the far edge of the floor (mm): there the sand dissolves into the water */
  hz: number;
  /** the ship: the middle of its waterline (mm), scale, roll (kit, −20…20: from the viewer, the bottom shows), tilt (degrees,
   *  the bow down), the break of each mast (a share of its height), the fallen top of one mast (it lies from the deck to
   *  the floor on the side `side`, its tip on the sand at y = ty), the sand over the waterline at the bow and at the stern
   *  (mm; minus — under it) */
  ship: { x: number; y: number; scale: number; roll: number; tilt: number; brk: number[]; fall?: { mast: number; side: 1 | -1; ty: number }; bow: number; stern: number };
  /** what lies on the floor */
  props: Prop[]; seed: number;
}
const SHIP0 = { roll: -18, brk: [0.5, 0.56, 0.42], bow: 14, stern: -8 };
export const SEA: Record<ShipKey, Sea> = {
  pearl: {
    light: 'pearl', water: ['#43769c', '#24486a', '#1d3852'], glow: '#c4e2ff', rays: 0.5, haze: ['#1c3c5a', 0.24], back: ['#4f86ac', 0.55],
    sand: ['#b4bec6', '#7d8a95', '#465462'], fish: ['#a9c6dc', 0.62], coral: ['#7d6590', '#5a7a9a', '#9a6470'], weed: ['#2c5a4c', '#3e6e5c', '#24463e'],
    rag: '#2c2c32', hz: 150, ship: { ...SHIP0, x: 168, y: 181, scale: 1.7, tilt: 9, fall: { mast: 0, side: -1, ty: 166 } },
    props: [
      { kind: 'anchor', x: 26, y: 199, s: 0.85, rot: 101 },
      { kind: 'shot', x: 98, y: 202, s: 1.05 }, { kind: 'shot', x: 107, y: 205.5, s: 1.05 }, { kind: 'shot', x: 116.5, y: 200.5, s: 0.95 },
      { kind: 'bottle', x: 142, y: 199, s: 0.72, rot: 12 },
      { kind: 'cannon', x: 190, y: 203, s: 0.66, rot: -4 },
      { kind: 'chest', x: 284, y: 199, s: 0.7, rot: -3 },
      { kind: 'rock', x: 54, y: 207, s: 0.62 }
    ], seed: 11
  },
  revenge: {
    light: 'revenge', water: ['#946040', '#5c3624', '#40241a'], glow: '#ffd2a0', rays: 0.42, haze: ['#4a2418', 0.28], back: ['#b8724a', 0.4],
    sand: ['#d4ab86', '#a07254', '#62402e'], fish: ['#2a120c', 0.58], coral: ['#c4523a', '#d88a52', '#8e3434'], weed: ['#5e5a26', '#74702e', '#40401c'],
    rag: '#6a1c16', hz: 150, ship: { ...SHIP0, x: 160, y: 181, scale: 1.95, tilt: 9, fall: { mast: 0, side: -1, ty: 166 } },
    props: [
      { kind: 'anchor', x: 24, y: 199, s: 0.85, rot: 101 },
      { kind: 'shot', x: 96, y: 203, s: 1.05 }, { kind: 'shot', x: 105, y: 206, s: 1.05 }, { kind: 'shot', x: 114, y: 201.5, s: 0.95 },
      { kind: 'cannon', x: 160, y: 204, s: 0.66, rot: -5 },
      { kind: 'bottle', x: 212, y: 200, s: 0.72, rot: -10 },
      { kind: 'chest', x: 284, y: 199, s: 0.7, rot: -3 },
      { kind: 'rock', x: 56, y: 207, s: 0.62 }
    ], seed: 23
  },
  endeavour: {
    light: 'endeavour', water: ['#86d0d2', '#3c94a4', '#1f6474'], glow: '#fffbe8', rays: 0.5, haze: ['#4a9cac', 0.15], back: ['#b4e6e6', 0.5],
    sand: ['#f6e8c4', '#d8be8c', '#94805e'], fish: ['#f4c64c', 0.9], coral: ['#e8785a', '#f2b45e', '#c85c8e'], weed: ['#4e8a3c', '#62a04a', '#386830'],
    rag: '#e2d6b4', hz: 150, ship: { ...SHIP0, x: 140, y: 181, scale: 1.62, tilt: 8, fall: { mast: 0, side: -1, ty: 168 } },
    props: [
      { kind: 'anchor', x: 22, y: 199, s: 0.85, rot: 101 },
      { kind: 'shot', x: 74, y: 204, s: 1.05 }, { kind: 'shot', x: 83, y: 206.5, s: 1.05 },
      { kind: 'cannon', x: 124, y: 204, s: 0.66, rot: -4 },
      { kind: 'barrel', x: 196, y: 205, s: 0.55, rot: -4 },
      { kind: 'crate', x: 252, y: 199, s: 0.82, rot: 3 }, { kind: 'crate', x: 284, y: 206, s: 0.74, rot: -3 },
      { kind: 'rock', x: 46, y: 208, s: 0.55 }
    ], seed: 37
  },
  dutch: {
    light: 'dutchman', water: ['#7eb098', '#3a6a58', '#22423a'], glow: '#dcf6e6', rays: 0.58, haze: ['#2c5446', 0.16], back: ['#b2e0c6', 0.66],
    sand: ['#bcc2a0', '#86927a', '#4c5a46'], fish: ['#c4dccc', 0.62], coral: ['#7c9c6a', '#a0aa6c', '#5e8a7c'], weed: ['#3e7a3c', '#62984e', '#2c5230'],
    rag: '#8a8670', shells: true, hz: 150, ship: { ...SHIP0, x: 166, y: 181, scale: 1.74, tilt: 9, fall: { mast: 0, side: -1, ty: 166 } },
    props: [
      { kind: 'anchor', x: 24, y: 199, s: 0.85, rot: 101 },
      { kind: 'shot', x: 98, y: 203, s: 1.05 }, { kind: 'shot', x: 107, y: 206, s: 1.05 },
      { kind: 'bottle', x: 146, y: 203, s: 0.72, rot: 10 },
      { kind: 'cannon', x: 188, y: 204, s: 0.66, rot: -4 },
      { kind: 'chest', x: 284, y: 199, s: 0.7, rot: -3 },
      { kind: 'rock', x: 56, y: 207, s: 0.62 }
    ], seed: 41
  }
};

// ---- helpers ----
const PAGE = { w: 297, h: 210 };
const f = (n: number) => String(Math.round(n * 100) / 100);
const pt = (n: number) => n * 25.4 / 72;
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
    (l > 7 ? `<path d="M${f(.22 * l)} ${f(-.13 * l)}Q${f(.27 * l)} 0 ${f(.22 * l)} ${f(.12 * l)}" fill="none" stroke="${dark}" stroke-width="${f(.03 * l)}" stroke-opacity=".7"/><path d="M${f(.27 * l)} ${f(.04 * l)}L${f(.42 * l)} ${f(.13 * l)}L${f(.36 * l)} ${f(.02 * l)}Z" fill="${dark}" fill-opacity=".7"/><path d="M${f(.3 * l)} ${f(-.12 * l)}L${f(.34 * l)} ${f(.1 * l)}M${f(.42 * l)} ${f(-.14 * l)}L${f(.46 * l)} ${f(.11 * l)}M${f(.54 * l)} ${f(-.13 * l)}L${f(.57 * l)} ${f(.1 * l)}" stroke="${light}" stroke-width="${f(.015 * l)}" stroke-opacity=".5"/>` : '') +
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

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/** a torn rag of sail hanging from a spar stub at (x, y): the cloth drifts a little with the current (flow), soft folds
 *  sway along it, the foot is torn; the spar is drawn with it */
function rag(x: number, y: number, w: number, h: number, color: string, R: () => number, flow: number): string {
  const ph = R() * 6, NU = 8, len = Array.from({ length: NU + 1 }, () => 0.5 + R() * 0.5);
  const lenAt = (u: number) => { const i = Math.min(NU - 1, Math.floor(u * NU)), t = u * NU - i; return len[i] + (len[i + 1] - len[i]) * t; };
  const at = (u: number, v: number): P => [x + u * w * (1 - 0.14 * v) + flow * h * 0.3 * v * v + Math.sin(v * 3.4 + u * 2.6 + ph) * 1.1 * v, y + u * w * 0.06 + v * h + Math.sin(u * 7 + ph) * 0.4 * v];
  const top: P[] = [], right: P[] = [], foot: P[] = [], left: P[] = [];
  for (let i = 0; i <= NU; i++) top.push(at(i / NU, 0));
  for (let j = 1; j <= 6; j++) right.push(at(1, lenAt(1) * j / 6));
  for (let i = NU; i >= 0; i--) { const u = i / NU; foot.push(at(u, lenAt(u))); if (i) foot.push(at(u - 0.5 / NU, lenAt(u - 0.5 / NU) - 0.08 - R() * 0.14)); }
  for (let j = 5; j >= 1; j--) left.push(at(0, lenAt(0) * j / 6));
  const outline = [...top, ...right, ...foot, ...left].map(q => `${f(q[0])},${f(q[1])}`).join(' ');
  const dark = mix(color, '#000000', 0.45), light = mix(color, '#ffffff', 0.3);
  let folds = '';
  for (const u of [0.18, 0.42, 0.66, 0.86]) {
    const pts: P[] = []; for (let v = 0; v <= lenAt(u) - 0.05; v += 0.1) pts.push(at(u, v));
    if (pts.length > 2) folds += `<path d="${spline(pts)}" fill="none" stroke="${dark}" stroke-width=".7" stroke-opacity=".38"/><path d="${spline(pts.map(q => [q[0] - 0.7, q[1]] as P))}" fill="none" stroke="${light}" stroke-width=".4" stroke-opacity=".35"/>`;
  }
  const y1 = y + w * 0.06;
  return `<g opacity=".92"><polygon points="${outline}" fill="${color}"/>${folds}<polygon points="${outline}" fill="none" stroke="${dark}" stroke-width=".25" stroke-opacity=".6"/></g>` +
    `<path d="M${f(x - 2.4)} ${f(y - 0.25)}L${f(x + w + 2)} ${f(y1 + 0.2)}" stroke="#241c12" stroke-width="1.15" stroke-linecap="round"/><path d="M${f(x - 2)} ${f(y - 0.55)}L${f(x + w + 1.6)} ${f(y1 - 0.1)}" stroke="#6a5a40" stroke-width=".3" stroke-opacity=".7" stroke-linecap="round"/>`;
}
/** a stone (or a far rock) whose foot is at (x, y): an uneven dome lit from the upper left, its shadow on the sand to the right */
function stone(x: number, y: number, w: number, h: number, R: () => number, shade = true): string {
  const n = 9, pts: P[] = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * (1 - i / n), e = i === 0 || i === n; pts.push([x + Math.cos(a) * w / 2 * (e ? 1 : 0.86 + R() * 0.18), y - (e ? 0 : Math.pow(Math.sin(a), 0.7) * h * (0.82 + R() * 0.25))]); }
  const d = spline(pts) + `Q${f(x)} ${f(y + h * 0.12)} ${f(pts[0][0])} ${f(pts[0][1])}Z`;
  return (shade ? `<ellipse cx="${f(x + w * 0.18)}" cy="${f(y + 0.15)}" rx="${f(w * 0.6)}" ry="${f(Math.max(0.35, h * 0.2))}" fill="#000" fill-opacity=".3"/>` : '') + `<path d="${d}" fill="url(#wPeb)"/>`;
}

// ---- the scene ----
interface Plates { title: Rect; rules: Rect; col: Rect }
/** a thing on the floor where it was put: its anchor for the kit and its drawn box (measured in the browser) */
interface Placed { kind: PropKind; x: number; y: number; s: number; rot: number; ax: number; ay: number; seed: number; box: Box }
/** the scene's geometry for the physics check */
interface Geo { H: number; crest(x: number): number; floorTop(x: number): number; hull: P[]; keel: P[]; span: [number, number]; props: Placed[]; fall?: { tip: P; ty: number } }

const lightOf = (sea: Sea) => { const base = K.LIGHTS[sea.light]; return K.makeLight({ ...base, key: { ...base.key, az: 215, el: 66 } }, { horizon: sea.hz }); };
function propSvg(p: { kind: PropKind; s: number; rot?: number }, uu: string, L: unknown, ax: number, ay: number, seed: number, contact = true): string {
  const o = { x: ax, y: ay, s: p.s, rot: p.rot ?? 0, seed, contact };
  switch (p.kind) {
    case 'anchor': return K.anchor(uu, L, o);
    case 'cannon': return K.cannon(uu, L, { ...o, carriage: false });
    case 'chest': return K.chest(uu, L, { ...o, open: 0.85, gold: true });
    case 'shot': return K.shot(uu, L, o);
    case 'barrel': return K.barrel(uu, L, { ...o, kind: 'powder', lying: true });
    case 'crate': return K.crate(uu, L, o);
    case 'bottle': return K.bottle(uu, L, { ...o, lying: true });
    default: return K.rock(uu, L, { ...o, w: 24, h: 15, foam: false });
  }
}
/** puts every thing with the bottom of its drawing on its foot point: the browser measures the drawn box, the anchor moves */
const PLACED = new Map<string, Placed[]>();
async function placeProps(ctx: Ctx, key: ShipKey, sea: Sea): Promise<Placed[]> {
  const got = PLACED.get(key); if (got) return got;
  const L = lightOf(sea), page = await ctx.browser.newPage();
  const boxes = async (at: P[]): Promise<Box[]> => {
    await page.setContent(`<!doctype html><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}" width="${PAGE.w}" height="${PAGE.h}">${sea.props.map((p, i) => `<g id="q${i}">${propSvg(p, `m${i}`, L, at[i][0], at[i][1], i + 1, false)}</g>`).join('')}</svg>`);
    return page.evaluate((n: number) => Array.from({ length: n }, (_, i) => { const b = (document.getElementById('q' + i) as unknown as SVGGraphicsElement).getBBox(); return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height }; }), sea.props.length);
  };
  try {
    const b0 = await boxes(sea.props.map(p => [p.x, p.y]));
    const at = sea.props.map((p, i): P => [2 * p.x - (b0[i].x0 + b0[i].x1) / 2, 2 * p.y - b0[i].y1]);
    const b1 = await boxes(at);
    const v = sea.props.map((p, i) => ({ kind: p.kind, x: p.x, y: p.y, s: p.s, rot: p.rot ?? 0, ax: at[i][0], ay: at[i][1], seed: i + 1, box: b1[i] }));
    PLACED.set(key, v); return v;
  } finally { await page.close(); }
}
/** how far to lower the ship so that its rail clears the rules scroll */
function clearOfRules(key: ShipKey, S: Sea['ship'], rules: Rect, len: number): number {
  const g = K.shipGeom(key, { kind: key, x: S.x, y: S.y, scale: S.scale, roll: S.roll }), a = -S.tilt * Math.PI / 180, need = rules.y + rules.h + 4;
  let dy = 0;
  for (let X = -len / 2; X <= len / 2; X += 3) {
    const [x, y] = g.nearRail(X), px = S.x + (x - S.x) * Math.cos(a) - (y - S.y) * Math.sin(a), py = S.y + (x - S.x) * Math.sin(a) + (y - S.y) * Math.cos(a);
    if (px < rules.x + rules.w + 6) dy = Math.max(dy, need - py);
  }
  return dy;
}
/** the shadows of a thing on the sand, from its drawn box: a dark contact shadow whose top edge is the thing's bottom, and a
 *  softer cast shadow, both shifted a little to the right and down (the light comes from above, a little from the left) */
function shadowsOf(p: Placed): { cx: number; cy: number; rx: number; ry: number; op: number; blur: string }[] {
  const b = p.box, w = b.x1 - b.x0, h = b.y1 - b.y0, cx = (b.x0 + b.x1) / 2, r1 = Math.max(0.6, Math.min(1.6, h * 0.1)), r2 = Math.max(1, Math.min(3, h * 0.2));
  return [{ cx: cx + w * 0.18, cy: b.y1 + r2 - 0.2, rx: w * 0.56, ry: r2, op: 0.2, blur: 'wB1' }, { cx: cx + w * 0.05, cy: b.y1 + r1 - 0.2, rx: w * 0.5, ry: r1, op: 0.38, blur: 'wB05' }];
}
/** the whole sea-floor picture (mm), to be rasterised, and its geometry */
export function seaFloorSvg(key: ShipKey, sea: Sea, pl: Plates, props: Placed[]): { svg: string; geo: Geo } {
  const R = rng(sea.seed), sp = K.SHIP_SPECS[key], u = `wr${key}`, H = sea.hz, W = PAGE.w;
  const S = { ...sea.ship, y: sea.ship.y + clearOfRules(key, sea.ship, pl.rules, sp.len) }, s = S.scale, L = lightOf(sea);
  const [w0, w1, w2] = sea.water, [sd0, sd1, sd2] = sea.sand;
  const fog = mix(mix(w1, w2, 0.3), sea.back[0], 0.22), out: string[] = [];
  const dep = (y: number) => clamp01((y - H) / (PAGE.h - H));
  const poly = (p: P[]) => p.map(q => `${f(q[0])},${f(q[1])}`).join(' ');

  // ---- the geometry: the ship (local coordinates, the group is tilted about the middle of the waterline), the sand ----
  const o = { kind: key, x: S.x, y: S.y, scale: s, roll: S.roll, sails: 'furled', seed: sea.seed };
  const body = K.ship(u, L, o), geom = K.shipGeom(key, o), masts = [...geom.masts].sort((a, b) => a.x - b.x);
  const hl = (sp.len / 2) * s, stem = S.x - hl, stern = S.x + hl, draft = sp.draft * s, deck = S.y - sp.free * s;
  const ra = -S.tilt * Math.PI / 180, rot = (p: P): P => [S.x + (p[0] - S.x) * Math.cos(ra) - (p[1] - S.y) * Math.sin(ra), S.y + (p[0] - S.x) * Math.sin(ra) + (p[1] - S.y) * Math.cos(ra)];
  const mx = masts.map(m => S.x + m.x * s), yb = masts.map((m, i) => S.y - (S.brk[i] ?? 0.45) * (S.y - m.top[1]));
  const rail: P[] = []; for (let X = -sp.len / 2; X <= sp.len / 2 + 0.01; X += 4) { const q = geom.nearRail(X); rail.push([q[0], q[1] - 1.2 * s]); }
  const keelL: P[] = [[stern + sp.over * s * 0.8, S.y + 0.1 * draft], [stern, S.y + draft * 0.85], [S.x, S.y + draft], [stem + 6 * s, S.y + draft * 0.75], [stem - sp.bow[0] * s * 0.5, S.y - 1 * s]];
  const hull = [...rail, [stern + sp.over * s * 0.85, rail[rail.length - 1][1] - 1 * s] as P, ...keelL].map(rot);
  const keel: P[] = []; for (let X = stem + 8 * s; X <= stern - 3 * s; X += 4) { const t = (X - S.x) / hl; keel.push(rot([X, S.y + draft * (1 - 0.3 * Math.pow(Math.abs(t), 3))])); }
  const stemP = rot([stem, S.y]), sternP = rot([stern, S.y]);
  const baseL = rot([stem + 6 * s, S.y + draft * 0.75])[1] + 4, baseR = rot([stern, S.y + draft * 0.85])[1] + 4;
  const lump = (x: number) => Math.sin(x / 6.5 + sea.seed) * 0.6 - 1.4 * Math.pow(Math.max(0, Math.sin(x / 9.3 + sea.seed * 2)), 4);
  const along = (x: number) => { const t = clamp01((x - stemP[0]) / (sternP[0] - stemP[0])); return stemP[1] + t * (sternP[1] - stemP[1]) - (S.bow + (S.stern - S.bow) * smooth(t)); };
  /** the top of the sand heaped along the hull; beyond the ends it runs down to the floor */
  const crest = (x: number) => {
    if (x < stemP[0]) { const k = smooth((stemP[0] - x) / 30); return along(stemP[0]) + (baseL - along(stemP[0])) * k + lump(x) * (1 - k); }
    if (x > sternP[0]) { const k = smooth((x - sternP[0]) / 26); return along(sternP[0]) + (baseR - along(sternP[0])) * k + lump(x) * (1 - k); }
    return along(x) + lump(x);
  };
  const span: [number, number] = [stemP[0] - 4, sternP[0] + 4];
  const farTop = (x: number) => H + Math.sin(x / 41 + sea.seed) * 1.1 + Math.sin(x / 13 + sea.seed * 2) * 0.45;
  /** where the visible sand starts at x: the crest in front of the hull, the far edge elsewhere */
  const floorTop = (x: number) => (x >= span[0] && x <= span[1] ? crest(x) : farTop(x) + 1);
  const fp: P[] = []; for (let x = -4; x <= W + 4; x += 6) fp.push([x, farTop(x)]);
  const floorD = `${spline(fp)}L${W + 4} ${PAGE.h + 3}L-4 ${PAGE.h + 3}Z`;
  const B0 = stemP[0] - 30, B1 = sternP[0] + 26, cp: P[] = []; for (let x = B0; x <= B1 + 0.01; x += 2) cp.push([x, crest(x)]);
  const bermD = `${spline(cp)}L${f(B1)} ${PAGE.h + 3}L${f(B0)} ${PAGE.h + 3}Z`;
  const hullTop = Math.min(...hull.map(q => q[1])), crestMax = Math.max(...cp.map(q => q[1]));

  // the fallen top: from the deck by its stump down to the sand, its yards lying flat (foreshortened), cut where they meet the sand
  let fall: Geo['fall'], fallG = '';
  if (S.fall) {
    const i = S.fall.mast, F = rot([mx[i], deck + 0.5 * s]), Lp = yb[i] - masts[i].top[1], a = Math.asin(Math.max(-0.95, Math.min(0.95, (S.fall.ty - F[1]) / Lp)));
    const d: P = [S.fall.side * Math.cos(a), Math.sin(a)], tip: P = [F[0] + d[0] * Lp, F[1] + d[1] * Lp], th = Math.atan2(d[0], -d[1]) * 180 / Math.PI;
    fall = { tip, ty: S.fall.ty };
    fallG = `<clipPath id="wFallC"><rect x="-10" y="-10" width="${W + 20}" height="${f(S.fall.ty + 10.6)}"/></clipPath>` +
      `<g id="wFallG" clip-path="url(#wFallC)"><g transform="translate(${f(F[0])} ${f(F[1])}) rotate(${f(th)}) translate(${f(-mx[i])} ${f(-yb[i])})"><g clip-path="url(#wHigh)"><use href="#${u}Body"/></g></g></g>`;
  }
  const jag = (i: number): P[] => [[mx[i] - 2.4 * s, yb[i] + 0.7 * s], [mx[i] - 1.1 * s, yb[i] - 1.7 * s], [mx[i] - 0.2 * s, yb[i] + 1 * s], [mx[i] + 0.8 * s, yb[i] - 1.2 * s], [mx[i] + 2.4 * s, yb[i] + 0.5 * s]];
  // what is kept of the kit ship: the bow and the bowsprit, each stump to its jagged break with the shrouds under it (a
  // tent from the break down to the rail), between the masts and aft only the hull to a little over its rail (no loose
  // yards or gaffs floating over the deck, no ensign: it would fly as in a wind)
  const railAt = (x: number) => { const X = Math.max(-sp.len / 2, Math.min(sp.len / 2, (x - S.x) / s)); return Math.min(geom.nearRail(X)[1], geom.farRail(X)[1]) - 3.5 * s; };
  const xL = stem - 80, xEnd = stern + (sp.over + Math.max(...sp.tw)) * s + 0.3, low: P[] = [[xL, S.y + 80], [xL, yb[0] - 3 * s], ...jag(0)];
  const along2 = (xa: number, xb: number) => { for (let x = xa; x < xb; x += 3) low.push([x, railAt(x)]); low.push([xb, railAt(xb)]); };
  for (let i = 0; i < masts.length - 1; i++) {
    const xa = mx[i] + 13 * s, xb = mx[i + 1] - 13 * s;
    if (xa < xb) along2(xa, xb); else low.push([(mx[i] + mx[i + 1]) / 2, Math.max(railAt((mx[i] + mx[i + 1]) / 2), (yb[i] + yb[i + 1]) / 2)]);
    low.push(...jag(i + 1));
  }
  along2(Math.min(mx[masts.length - 1] + 13 * s, xEnd - 1), xEnd);
  low.push([xEnd, S.y + 80]);
  let high = '';
  if (S.fall) { const i = S.fall.mast, hw = 2.6 * s, topY = masts[i].top[1] - 12 * s, j = jag(i); high = `<clipPath id="wHigh"><polygon points="${poly([[mx[i] - hw, topY], [mx[i] + hw, topY], [mx[i] + hw, j[4][1]], ...[...j].reverse(), [mx[i] - hw, j[0][1]]])}"/></clipPath>`; }
  // the hull: the fouled bottom under the old waterline with the rudder, then the kit's ship cut at the breaks
  let foul = '';
  for (let i = 0; i < 26; i++) { const x = stem + 8 * s + R() * (stern - stem - 14 * s), y = S.y + R() * draft * 0.8; foul += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.6 + R() * 1.6)}" ry="${f(0.4 + R() * 0.9)}" fill="${sea.weed[i % 3]}" fill-opacity=".55"/>`; }
  const hullG = `<g id="wHullG" transform="rotate(${f(-S.tilt)} ${f(S.x)} ${f(S.y)})">` +
    `<path d="M${f(stem - 1)} ${f(S.y - 0.5)}C${f(stem + 6 * s)} ${f(S.y + draft * 0.75)} ${f(stem + hl * 0.4)} ${f(S.y + draft)} ${f(S.x)} ${f(S.y + draft)}C${f(S.x + hl * 0.6)} ${f(S.y + draft)} ${f(stern - 3 * s)} ${f(S.y + draft * 0.8)} ${f(stern + 1.5 * s)} ${f(S.y - 0.5)}Z" fill="url(#wKeel)"/>` +
    `<path d="M${f(stern - 0.5 * s)} ${f(S.y - 2 * s)}L${f(stern + 3.8 * s)} ${f(S.y - 1 * s)}L${f(stern + 3 * s)} ${f(S.y + draft * 0.82)}L${f(stern - 1.5 * s)} ${f(S.y + draft * 0.86)}Z" fill="#1c1b16"/>${foul}` +
    `<g clip-path="url(#wLow)"><use href="#${u}Body"/></g></g>`;
  const sil = (flt: string) => (fallG ? `<use href="#wFallG" filter="url(#${flt})"/>` : '') + `<use href="#wHullG" filter="url(#${flt})"/>`;

  // ---- defs ----
  const cau = (id: string, fx: number, fy: number, seed: number, table: string, y0: number, h: number) =>
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="${f(y0)}" width="${W}" height="${f(h)}" color-interpolation-filters="sRGB"><feTurbulence type="turbulence" baseFrequency="${fx} ${fy}" numOctaves="1" seed="${seed}" result="t"/>` +
    `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="a0"/><feComponentTransfer in="a0" result="a"><feFuncA type="table" tableValues="${table}"/></feComponentTransfer>` +
    `<feFlood flood-color="${sea.glow}" result="c"/><feComposite in="c" in2="a" operator="in"/></filter>`;
  const stoneC = mix(sd2, '#5c5a56', 0.35);
  out.push(`<defs>
<linearGradient id="wW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w0}"/><stop offset=".45" stop-color="${w1}"/><stop offset=".72" stop-color="${mix(w1, w2, 0.6)}"/><stop offset="1" stop-color="${w2}"/></linearGradient>
<radialGradient id="wSun" cx=".3" cy="-.08" r=".7"><stop offset="0" stop-color="${sea.glow}" stop-opacity=".42"/><stop offset=".5" stop-color="${sea.glow}" stop-opacity=".1"/><stop offset="1" stop-color="${sea.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="wRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea.glow}" stop-opacity="1"/><stop offset=".55" stop-color="${sea.glow}" stop-opacity=".35"/><stop offset="1" stop-color="${sea.glow}" stop-opacity="0"/></linearGradient>
<linearGradient id="wTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="wTopM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="30"><rect width="${W}" height="30" fill="url(#wTop)"/></mask>
<linearGradient id="wFloor" gradientUnits="userSpaceOnUse" x1="0" y1="${H - 1}" x2="0" y2="${PAGE.h}"><stop offset="0" stop-color="${fog}"/><stop offset=".12" stop-color="${mix(fog, sd2, 0.45)}"/><stop offset=".34" stop-color="${mix(sd1, fog, 0.25)}"/><stop offset=".6" stop-color="${sd1}"/><stop offset=".82" stop-color="${mix(sd1, sd0, 0.22)}"/><stop offset="1" stop-color="${mix(sd1, sd2, 0.2)}"/></linearGradient>
<linearGradient id="wFade" gradientUnits="userSpaceOnUse" x1="0" y1="${H}" x2="0" y2="${H + 22}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="wNearG" gradientUnits="userSpaceOnUse" x1="0" y1="${H + 18}" x2="0" y2="${H + 34}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="wFarG" gradientUnits="userSpaceOnUse" x1="0" y1="${H + 18}" x2="0" y2="${H + 34}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<linearGradient id="wKeel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix('#4a4632', sea.weed[2], .35)}"/><stop offset=".45" stop-color="${mix('#262618', sea.weed[2], .3)}"/><stop offset="1" stop-color="#0e100c"/></linearGradient>
<linearGradient id="wAO" gradientUnits="userSpaceOnUse" x1="0" y1="${f(hullTop)}" x2="0" y2="${f(crestMax)}"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
<linearGradient id="wCrestHi" gradientUnits="userSpaceOnUse" x1="${f(B0)}" y1="0" x2="${f(B1)}" y2="0"><stop offset="0" stop-color="${mix(sd0, '#ffffff', .3)}" stop-opacity="0"/><stop offset=".16" stop-color="${mix(sd0, '#ffffff', .3)}" stop-opacity="1"/><stop offset=".86" stop-color="${mix(sd0, '#ffffff', .3)}" stop-opacity="1"/><stop offset="1" stop-color="${mix(sd0, '#ffffff', .3)}" stop-opacity="0"/></linearGradient>
<linearGradient id="wCrestSh" gradientUnits="userSpaceOnUse" x1="${f(B0)}" y1="0" x2="${f(B1)}" y2="0"><stop offset="0" stop-color="${sd2}" stop-opacity="0"/><stop offset=".16" stop-color="${sd2}" stop-opacity="1"/><stop offset=".86" stop-color="${sd2}" stop-opacity="1"/><stop offset="1" stop-color="${sd2}" stop-opacity="0"/></linearGradient>
<radialGradient id="wPeb" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="${mix(stoneC, '#ffffff', .4)}"/><stop offset=".5" stop-color="${stoneC}"/><stop offset="1" stop-color="${mix(stoneC, '#000000', .5)}"/></radialGradient>
<radialGradient id="wBack" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${sea.back[0]}" stop-opacity="${sea.back[1]}"/><stop offset=".6" stop-color="${sea.back[0]}" stop-opacity="${sea.back[1] * 0.45}"/><stop offset="1" stop-color="${sea.back[0]}" stop-opacity="0"/></radialGradient>
<radialGradient id="wVig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
<filter id="wB3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="wB2" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="wB1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="wB05" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".45"/></filter>
<filter id="wWhite" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
<filter id="wBlack" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
${cau('wCauF', 0.12, 0.36, sea.seed, '1 .4 .08 0 0 0 0 0 0 0 0 0', H, PAGE.h - H)}
${cau('wCauN', 0.065, 0.16, sea.seed + 7, '1 .5 .14 0 0 0 0 0 0 0 0 0', H, PAGE.h - H)}
${cau('wCauH', 0.16, 0.2, sea.seed + 3, '1 .36 .06 0 0 0 0 0 0 0 0 0 0', 0, PAGE.h)}
<g id="${u}Body">${body}</g>
<clipPath id="wLow"><polygon points="${poly(low)}"/></clipPath>${high}
${hullG}${fallG}
<mask id="wSilM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}">${sil('wWhite')}</mask>
<mask id="wFloorM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><path d="${floorD}" fill="url(#wFade)"/>${sil('wBlack')}<path d="${bermD}" fill="url(#wFade)"/></mask>
<mask id="wNearM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><rect width="${W}" height="${PAGE.h}" fill="url(#wNearG)"/></mask>
<mask id="wFarM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><rect width="${W}" height="${PAGE.h}" fill="url(#wFarG)"/></mask>
<clipPath id="wFloorC"><path d="${floorD}"/></clipPath>
</defs>`);

  // ---- the water ----
  out.push(`<rect width="${W}" height="${PAGE.h}" fill="url(#wW)"/><rect width="${W}" height="${PAGE.h}" fill="url(#wSun)"/>`);
  let net = '';
  for (let k = 0; k < 18; k++) {
    const y0 = 1 + R() * 22, a = 0.8 + R() * 1.6, p = 6 + R() * 10, ph = R() * 6, pts: P[] = [];
    for (let x = -4; x <= W + 4; x += 4) pts.push([x, y0 + Math.sin(x / p + ph) * a + Math.sin(x / (p * 0.37) + ph * 2) * a * 0.4]);
    net += `<path d="${spline(pts)}" fill="none" stroke="${sea.glow}" stroke-width="${f(0.25 + R() * 0.35)}" stroke-opacity="${f(0.25 + R() * 0.3)}"/>`;
  }
  out.push(`<g mask="url(#wTopM)" filter="url(#wB05)">${net}</g>`);
  out.push(`<ellipse cx="${f(S.x + 10)}" cy="${f(S.y - 50)}" rx="150" ry="80" fill="url(#wBack)"/>`);
  // far rays, behind everything: the light reaching the far floor
  const SRC: P = [30, -320];
  const ray = (xb: number, w: number, len: number, op: number) => {
    const d0 = Math.hypot(xb - SRC[0], -4 - SRC[1]), ux = (xb - SRC[0]) / d0, uy = (-4 - SRC[1]) / d0, k = (d0 + len) / d0, nx = -uy, ny = ux;
    const a: P = [xb, -4], b: P = [xb + nx * w, -4 + ny * w], c: P = [xb + ux * len + nx * w * k, -4 + uy * len + ny * w * k], e: P = [xb + ux * len, -4 + uy * len];
    return `<polygon points="${poly([a, b, c, e])}" fill="url(#wRay)" opacity="${f(op)}"/>`;
  };
  let farRays = '';
  for (let i = 0; i < 7; i++) farRays += ray(-20 + i * 48 + R() * 30, 10 + R() * 20, H + 10, sea.rays * 0.3);
  out.push(`<g filter="url(#wB3)">${farRays}</g>`);

  // ---- the floor: one plane from the foot of the sheet to the far edge, where it dissolves in the water ----
  out.push(`<path d="${floorD}" fill="url(#wFloor)"/><path d="${spline(fp)}" fill="none" stroke="${fog}" stroke-width="3" filter="url(#wB1)"/>`);
  // far things on the floor: reefs on the far edge, rocks and weed nearer, all paler with distance
  let far = '';
  for (let i = 0; i < 9; i++) { const x = 6 + i * 36 + R() * 20, w = 18 + R() * 26, y = farTop(x) + 0.8; far += `<path d="M${f(x - w / 2)} ${f(y)}C${f(x - w / 3)} ${f(y - 3 - R() * 4)} ${f(x + w / 4)} ${f(y - 4 - R() * 5)} ${f(x + w / 2)} ${f(y)}Z" fill="${mix(fog, w2, 0.3)}" fill-opacity=".8"/>`; }
  out.push(`<g filter="url(#wB1)">${far}</g>`);
  let mid = '';
  for (let i = 0; i < 16; i++) {
    const x = R() * W, y = farTop(x) + 2 + R() * 16, k = dep(y), op = clamp01(0.25 + k * 1.8);
    if (R() < 0.55) mid += `<g opacity="${f(op)}">${stone(x, y, (5 + R() * 12) * (0.4 + k * 1.6), (2.4 + R() * 4) * (0.4 + k * 1.6), R, false)}</g>`;
    else mid += `<g opacity="${f(op * 0.9)}">${tuft(x, y + 0.5, (8 + R() * 12) * (0.4 + k * 1.4), sea.weed.map(c => mix(c, fog, 0.45)), R, 3)}</g>`;
  }
  out.push(`<g filter="url(#wB05)">${mid}</g>`);
  out.push(`<g filter="url(#wB05)">${school({ x: W - 96, y: H - 34, w: 80, h: 12 }, 16, 2.4, sea, R, 1)}</g>`);
  // the shadow of the hull on the floor behind it, to the right (the light is above, a little to the left and behind us)
  out.push(`<g clip-path="url(#wFloorC)"><polygon points="${poly(hull.map(q => [q[0] + 12, q[1] + (q[1] - crestMax) * -0.15 - 3] as P))}" fill="#000" fill-opacity=".34" filter="url(#wB3)"/></g>`);
  // the fallen top lies behind the hull; its shadow on the sand under its tip
  if (fall) out.push(`<ellipse cx="${f(fall.tip[0] - S.fall!.side * 10)}" cy="${f(fall.ty + 0.8)}" rx="16" ry="1.6" fill="#000" fill-opacity=".35" filter="url(#wB1)"/><use href="#wFallG"/>` +
    `<path d="M${f(fall.tip[0] - 5)} ${f(fall.ty + 0.9)}C${f(fall.tip[0] - 3)} ${f(fall.ty - 1.2)} ${f(fall.tip[0] + 3)} ${f(fall.ty - 1.4)} ${f(fall.tip[0] + 5)} ${f(fall.ty + 0.9)}Z" fill="url(#wFloor)"/>`);
  // ---- the wreck ----
  out.push(`<use href="#wHullG"/>`);
  // the hull in the water: darker down to the sand, the water between us and it, the caustics on its side
  out.push(`<g mask="url(#wSilM)"><rect width="${W}" height="${PAGE.h}" fill="url(#wAO)"/><rect width="${W}" height="${PAGE.h}" fill="${sea.haze[0]}" fill-opacity="${sea.haze[1]}"/><rect width="${W}" height="${PAGE.h}" filter="url(#wCauH)" opacity=".13"/></g>`);
  const hz = (c: string) => mix(c, sea.haze[0], sea.haze[1]);
  // rigging from the stumps down to the rail; rags of sail on the spar stubs
  const rope = (a: P, b: P, sag: number, w = 0.42) => `<path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + sag)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${hz('#1e1a14')}" stroke-width="${w}" stroke-linecap="round"/>`;
  const rig: string[] = [];
  masts.forEach((_, i) => {
    const t = rot([mx[i], yb[i] + 1.5 * s]);
    rig.push(rope(t, rot([mx[i] - 16 * s, deck + 1.5 * s]), 7), rope(t, rot([mx[i] + 13 * s, deck + 1 * s]), 6), rope(rot([mx[i] + 0.4 * s, yb[i] + 5 * s]), rot([mx[i] - 8 * s, deck + 2 * s]), 4, 0.32));
    const a = rot([mx[i] - 3.5 * s, yb[i] + 6.5 * s]), rw = (7 + R() * 3) * s;
    rig.push(rag(a[0], a[1], rw, (6 + R() * 4) * s, hz(sea.rag), R, i % 2 ? -0.6 : 0.8));
  });
  if (fall) { const tp = fall.tip, side = S.fall!.side, F = rot([mx[S.fall!.mast], deck]); for (const k of [0.45, 0.7]) rig.push(rope([F[0] + (tp[0] - F[0]) * k, F[1] + (tp[1] - F[1]) * k - 1], rot([mx[S.fall!.mast] + side * (6 + k * 10) * s, deck + 1.5 * s]), 5, 0.36)); }
  out.push(rig.join(''));
  // shells grown on the side (the Dutchman), weed along the rail swaying up
  const hullW: string[] = [];
  if (sea.shells) { let sh = ''; for (let i = 0; i < 24; i++) { const x = stem + 10 * s + R() * (stern - stem - 18 * s), y = S.y - 1 - R() * (S.y - deck) * 0.85; sh += shell(x, y, 0.3 + R() * 0.25, (R() - 0.5) * 80, i % 4 === 0 ? 1 : 0); } hullW.push(`<g opacity=".6">${sh}</g>`); }
  for (let i = 0, nw = sea.shells ? 18 : 10; i < nw; i++) { const x = stem + 14 * s + (i / (nw - 1)) * (stern - stem - 26 * s) + (R() - 0.5) * 8; hullW.push(kelp(x, deck + 2 + R() * 3, 4 + R() * 12, hz(sea.weed[i % 3]), R, 0.1, 1.3)); }
  out.push(`<g transform="rotate(${f(-S.tilt)} ${f(S.x)} ${f(S.y)})">${hullW.join('')}</g>`);
  // the hull sits in the sand: a dark seam where they meet, then the sand heaped along the side over it
  const cl = cp.filter(q => q[0] > stemP[0] - 6 && q[0] < sternP[0] + 6);
  out.push(`<path d="${spline(cl.map(q => [q[0], q[1] - 0.8] as P))}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2.6" filter="url(#wB1)"/>`);
  out.push(`<path d="${bermD}" fill="url(#wFloor)"/>`);
  // little drifts of sand climbing the side
  let drift = '';
  for (let x = stemP[0] + 10 + R() * 8; x < sternP[0] - 8; x += 16 + R() * 18) {
    const w = 5 + R() * 6, h = 1.4 + R() * 1.8, y0 = crest(x - w), y1 = crest(x + w);
    drift += `<path d="M${f(x - w)} ${f(y0 + 0.6)}C${f(x - w * 0.4)} ${f(crest(x) - h)} ${f(x + w * 0.3)} ${f(crest(x) - h * 0.9)} ${f(x + w)} ${f(y1 + 0.6)}Z" fill="url(#wFloor)"/><path d="M${f(x - w * 0.8)} ${f(y0 - 0.1)}C${f(x - w * 0.4)} ${f(crest(x) - h)} ${f(x + w * 0.1)} ${f(crest(x) - h * 0.95)} ${f(x + w * 0.5)} ${f(crest(x) - h * 0.5)}" fill="none" stroke="${mix(sd0, '#ffffff', .3)}" stroke-width=".45" stroke-opacity=".6"/>`;
  }
  out.push(drift);
  out.push(`<path d="${spline(cp.map(q => [q[0], q[1] + 6.5] as P))}" fill="none" stroke="url(#wCrestSh)" stroke-width="8" stroke-opacity=".28" filter="url(#wB2)"/>`);
  out.push(`<path d="${spline(cp.map(q => [q[0], q[1] + 0.5] as P))}" fill="none" stroke="url(#wCrestHi)" stroke-width="1.3" stroke-opacity=".7" filter="url(#wB05)"/>`);
  let slip = '';
  for (let i = 0; i < 26; i++) { const x = B0 + 14 + R() * (B1 - B0 - 28), y = crest(x) + 1.5 + R() * 2; slip += `<path d="M${f(x)} ${f(y)}q${f(0.6 + R())} ${f(2 + R() * 2.5)} ${f(0.2 + R() * 1.2)} ${f(4 + R() * 3)}" fill="none" stroke="${sd2}" stroke-width=".3" stroke-opacity=".3"/>`; }
  out.push(slip);

  // ---- the near floor: ripples, the caustics, the pools of light (all over the sand, none on the hull) ----
  let rip = '';
  for (let y = H + 2.5; y < PAGE.h + 1;) {
    const k = dep(y);
    for (let x = -5 + R() * 10; x < W + 5; x += (6 + R() * 12) * (0.5 + k)) {
      const len = (5 + R() * 12) * (0.45 + k), pts: P[] = [], yy = y + (R() - 0.5) * 1.2 * k;
      for (let xx = x; xx <= x + len; xx += 1.2) pts.push([xx, yy + Math.sin(xx * 0.5 / (0.5 + k) + y) * 0.3 * (0.3 + k) - Math.sin(Math.PI * (xx - x) / len) * 0.5 * (0.3 + k)]);
      if (pts.length < 3) continue;
      rip += `<path d="${spline(pts)}" fill="none" stroke="${sd2}" stroke-width="${f(0.12 + 0.36 * k)}" stroke-opacity="${f(0.08 + 0.26 * k)}"/><path d="${spline(pts.map(q => [q[0] + 0.3, q[1] - 0.25 - 0.45 * k] as P))}" fill="none" stroke="${sd0}" stroke-width="${f(0.1 + 0.3 * k)}" stroke-opacity="${f(0.1 + 0.4 * k)}"/>`;
    }
    y += 0.7 + 3.4 * k + R() * 0.8 * k;
  }
  let pools = '';
  for (let i = 0; i < 6; i++) { const x = 20 + i * 52 + R() * 26, y = H + 14 + R() * (PAGE.h - H - 16); pools += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(14 + R() * 18)}" ry="${f(2.5 + dep(y) * 5)}" fill="${sea.glow}" fill-opacity=".16"/>`; }
  out.push(`<g mask="url(#wFloorM)">${rip}<g mask="url(#wFarM)"><rect y="${H}" width="${W}" height="${PAGE.h - H}" filter="url(#wCauF)" opacity=".42"/></g><g mask="url(#wNearM)"><rect y="${H}" width="${W}" height="${PAGE.h - H}" filter="url(#wCauN)" opacity=".48"/></g><g filter="url(#wB3)">${pools}</g></g>`);

  // ---- what lies on the near floor ----
  const taken: Box[] = props.map(p => p.box);
  const free = (b: Box) => !taken.some(q => b.x0 < q.x1 + 1 && b.x1 > q.x0 - 1 && b.y0 < q.y1 + 1 && b.y1 > q.y0 - 1);
  // stones and shells, scattered (none under the things)
  let peb = '';
  for (let i = 0; i < 70; i++) {
    const x = R() * W, y = floorTop(x) + 2 + R() * (PAGE.h - floorTop(x)), k = dep(y), w = (0.8 + R() * 2.6) * (0.35 + k), h = w * (0.45 + R() * 0.25);
    if (y > PAGE.h - 0.5 || !free({ x0: x - w, y0: y - h, x1: x + w, y1: y })) continue;
    peb += i % 5 === 4 ? shell(x, y, (0.25 + R() * 0.3) * (0.5 + k), (R() - 0.5) * 70, i % 2) : stone(x, y, w, h, R);
  }
  if (sea.shells) for (let i = 0; i < 16; i++) { const x = 6 + R() * (W - 12), y = Math.max(floorTop(x) + 3, PAGE.h - 1.5 - R() * 22), k = dep(y); if (free({ x0: x - 3, y0: y - 3, x1: x + 3, y1: y })) peb += shell(x, y, (0.5 + R() * 0.5) * (0.3 + k), (R() - 0.5) * 60, i % 3 === 0 ? 1 : 0); }
  out.push(peb);
  // low weed on the sand, a few tufts of each height
  for (let i = 0; i < 14; i++) {
    const x = 6 + R() * (W - 12), y = Math.min(PAGE.h - 1, floorTop(x) + 1.5 + R() * 8), k = dep(y), h = (i % 3 === 0 ? 14 : 5) * (0.6 + R() * 0.8) * (0.5 + k);
    if (!free({ x0: x - 3, y0: y - 2, x1: x + 3, y1: y })) continue;
    out.push(tuft(x, y, h, sea.weed, R, 2 + (i % 3)));
  }
  // the things: each lies on its foot, its shadow cast to the right and back, sand drifted against it
  const lip = (x: number, y: number, w: number) => `<path d="M${f(x - w / 2)} ${f(y + 0.5)}C${f(x - w / 3)} ${f(y - 1.1)} ${f(x + w / 3)} ${f(y - 1.2)} ${f(x + w / 2)} ${f(y + 0.5)}Z" fill="url(#wFloor)"/><path d="M${f(x - w / 2.6)} ${f(y - 0.2)}C${f(x - w / 4)} ${f(y - 0.95)} ${f(x + w / 4)} ${f(y - 1.05)} ${f(x + w / 2.6)} ${f(y - 0.2)}" fill="none" stroke="${sd0}" stroke-width=".3" stroke-opacity=".6"/>`;
  [...props].sort((a, b) => a.y - b.y).forEach((p, n) => {
    const b = p.box, w = b.x1 - b.x0, h = b.y1 - b.y0, cx = (b.x0 + b.x1) / 2;
    for (const sh of shadowsOf(p)) out.push(`<ellipse cx="${f(sh.cx)}" cy="${f(sh.cy)}" rx="${f(sh.rx)}" ry="${f(sh.ry)}" fill="#000" fill-opacity="${sh.op}" filter="url(#${sh.blur})"/>`);
    out.push(propSvg(p, `${u}p${n}`, L, p.ax, p.ay, p.seed, false));
    if (p.kind !== 'shot' && p.kind !== 'rock') out.push(lip(cx + w * 0.12, p.y + 0.25, Math.min(26, w * 0.42)));
  });
  // corals in the corners, by the buried bow and past the stern; tall weed close to the eye at the edges
  const cl2 = sea.coral, spot = (x0: number, x1: number, w: number, h: number): P | null => {
    for (let t = 0; t < 14; t++) { const x = x0 + R() * (x1 - x0), y = Math.max(floorTop(x) + 2, PAGE.h - 1.5 - R() * 12); if (free({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y })) { taken.push({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y }); return [x, y]; } }
    return null;
  };
  const c: string[] = [];
  let q = spot(2, 18, 22, 24); if (q) c.push(fanCoral(q[0], q[1], 24, cl2[1], R));
  q = spot(6, 30, 16, 18); if (q) c.push(branchCoral(q[0], q[1], 18, cl2[0], R));
  q = spot(0, 14, 16, 7); if (q) c.push(domeCoral(q[0], q[1], 8, 5.4, cl2[2], R, 'wDome1'));
  q = spot(W - 18, W - 4, 20, 22); if (q) c.push(fanCoral(q[0], q[1], 22, cl2[1], R));
  q = spot(W - 40, W - 18, 14, 16); if (q) c.push(branchCoral(q[0], q[1], 16, cl2[0], R));
  q = spot(W - 50, W - 26, 14, 5); if (q) c.push(domeCoral(q[0], q[1], 6.5, 4.4, cl2[2], R, 'wDome2'));
  q = spot(stemP[0] - 26, stemP[0] - 6, 12, 12); if (q) c.push(branchCoral(q[0], q[1], 12, cl2[2], R));
  q = spot(sternP[0] + 8, sternP[0] + 24, 10, 5); if (q) c.push(domeCoral(q[0], q[1], 5.5, 3.8, cl2[0], R, 'wDome3'));
  out.push(c.join(''));
  out.push(tuft(-1, PAGE.h + 2, 50, sea.weed.map(cc => mix(cc, '#000000', .35)), R, 5), tuft(W + 1, PAGE.h + 2, 42, sea.weed.map(cc => mix(cc, '#000000', .35)), R, 4));

  // ---- the light coming down, bubbles, the fish, specks; the vignette ----
  let rays = '';
  for (let i = 0; i < 11; i++) rays += ray(-30 + i * 32 + R() * 22, 4 + R() * 14, 150 + R() * 60, sea.rays * (0.4 + R() * 0.7));
  out.push(`<g filter="url(#wB2)">${rays}</g>`);
  for (let i = 0; i < masts.length; i++) if (!S.fall || i !== S.fall.mast) out.push(bubbles(...rot([mx[i], yb[i]]), 0, sea.glow, R));
  out.push(bubbles(...rot([stern - 6 * s, deck - 10 * s]), 0, sea.glow, R));
  const gx = pl.title.x + pl.title.w + 8, gw = pl.col.x - 6 - gx;
  if (gw > 24) out.push(school({ x: gx, y: 8, w: gw, h: 18 }, Math.round(gw / 4.6), 4.6, sea, R));
  const cy = pl.col.y + pl.col.h;
  out.push(school({ x: pl.col.x + 6, y: cy + 8, w: pl.col.w - 10, h: 12 }, 9, 6.2, sea, R));
  out.push(fish(pl.rules.x + pl.rules.w + 14, cy + 30, 13, -4, sea.fish[0], Math.min(1, sea.fish[1] + 0.15)), fish(W - 30, H - 14, 9.5, 6, sea.fish[0], sea.fish[1] * 0.85));
  let snow = '';
  for (let i = 0; i < 260; i++) snow += `<circle cx="${f(R() * W)}" cy="${f(R() * PAGE.h * 0.92)}" r="${f(0.08 + R() * 0.28)}" fill="${sea.glow}" fill-opacity="${f(0.15 + R() * 0.35)}"/>`;
  out.push(snow, `<rect width="${W}" height="${PAGE.h}" fill="url(#wVig)"/>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${PAGE.h}">${out.join('\n')}</svg>`, geo: { H, crest, floorTop, hull, keel, span, props, fall } };
}

// ---- the physics of the scene (WRECK_CHECK, printed by check.ts) ----
export const WRECK_CHECK: { board: string; issues: string[] }[] = [];
const inPoly = (p: P, poly: P[]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
function physics(g: Geo, plates: Rect[]): string[] {
  const issues: string[] = [], name = (p: Placed) => `${p.kind} at x ${Math.round(p.x)}`;
  const seen = (p: P) => inPoly(p, g.hull) && p[1] < g.crest(p[0]);
  for (const p of g.props) {
    const b = p.box;
    if (Math.abs(b.y1 - p.y) > 1) issues.push(`${name(p)}: its bottom is ${(b.y1 - p.y).toFixed(1)} mm off its foot on the sand`);
    let worst = 0; for (let x = Math.max(0, b.x0 + 1); x <= Math.min(PAGE.w, b.x1 - 1); x += 1) worst = Math.max(worst, g.floorTop(x) - p.y);
    if (worst > 0.5) issues.push(`${name(p)}: its foot is ${worst.toFixed(1)} mm above the sand (hangs in the water or stands on the hull)`);
    for (const sh of shadowsOf(p)) {
      if (Math.abs(sh.cy - sh.ry - b.y1) > 0.3) issues.push(`${name(p)}: its shadow starts ${(sh.cy - sh.ry - b.y1).toFixed(1)} mm from its bottom`);
      if (sh.cx < (b.x0 + b.x1) / 2) issues.push(`${name(p)}: its shadow falls to the left (the light is from the left)`);
    }
    let hit = 0; for (let x = b.x0; x <= b.x1; x += 0.8) for (let y = b.y0; y <= b.y1; y += 0.8) if (seen([x, y])) hit++;
    if (hit > 2) issues.push(`${name(p)}: overlaps the hull`);
  }
  g.props.forEach((a, i) => { for (const b of g.props.slice(i + 1)) if (a.box.x0 < b.box.x1 - 0.3 && a.box.x1 > b.box.x0 + 0.3 && a.box.y0 < b.box.y1 - 0.3 && a.box.y1 > b.box.y0 + 0.3) issues.push(`${name(a)} and ${name(b)} overlap`); });
  // the hull rests in the sand: the sand covers the keel along its whole length
  const float = g.keel.filter(k => g.crest(k[0]) > k[1] - 0.5);
  if (float.length) issues.push(`the keel shows above the sand at x ${float.map(k => Math.round(k[0])).join(', ')} (the hull floats)`);
  if (g.fall && (g.fall.tip[1] < g.fall.ty - 1 || g.fall.ty < g.H + 1)) issues.push(`the fallen mast's tip (y ${g.fall.tip[1].toFixed(1)}) does not reach the sand`);
  if (g.fall && (g.fall.tip[0] < 4 || g.fall.tip[0] > PAGE.w - 4)) issues.push(`the fallen mast's tip lies off the sheet (x ${g.fall.tip[0].toFixed(1)}): its support is not seen`);
  // the plates leave the hull free
  let all = 0, under = 0;
  const xs = g.hull.map(q => q[0]), ys = g.hull.map(q => q[1]);
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 1) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1) if (seen([x, y])) { all++; if (plates.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) under++; }
  if (under / Math.max(1, all) > 0.03) issues.push(`the plates cover ${(100 * under / all).toFixed(1)} % of the hull (more than 3 %)`);
  return issues;
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
const HEAD_O: TO = { font: 'Alegreya SC', w: 800, ls: '.04em' }, LAB_O: TO = { font: 'Alegreya', w: 800 };
const COL = { w: 90, pad: 4.5, token: 24, row: 10.5, icon: 8.6 };
/** the scroll: the paper hangs from the top roller (at y) down to the bottom roll; the text's margins inside the paper */
const RULES = { y: 41, padX: 10, padTop: 7.5, padBottom: 9.5, maxBottom: 140 };
const r2 = (n: number) => Math.round(n * 100) / 100;
/** the icons by the list of «Корабль тонет»: the hand of cards, a card played with the Charge to the ally's Volley, the reaction, the move */
const LI_ICONS: IconName[] = ['cards', 'volley', 'reaction', 'sails'];
/** the note under the ally lines: what to take off this ship's board, and the Endeavour's Heart of Davy Jones */
function noteParts(ship: Ship): { icon: IconName; html: string } | null {
  const clear = FTXT.wreck.clear[ship.code] ?? FTXT.wreck.clear._, jones = jonesLine(ship), ps: string[] = [];
  if (clear) ps.push(`<p>${esc(clear)}</p>`);
  if (jones) ps.push(`<p><b>${esc(FTXT.wreck.jones)}</b> ${esc(noRef(jones))}</p>`);
  if (!ps.length) return null;
  return { icon: jones ? 'heartChest' : /„Под водой“/.test(clear) ? 'underwater' : 'plan', html: ps.join('') };
}
/** the measured HTML blocks: the rules on the scroll and the note in the column */
const FIT = new Map<string, { rs: number; rh: number; ns: number; nh: number }>();
async function fitBlocks(ctx: Ctx, ship: Ship, tone: IconTone, rulesW: number, noteW: number): Promise<{ rs: number; rh: number; ns: number; nh: number }> {
  const got = FIT.get(ship.code); if (got) return got;
  const page = await ctx.browser.newPage();
  const h = async (html: string, w: number) => { await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}${WRECK_CSS}</style><div id="b" style="position:absolute;left:0;top:0;width:${w}mm">${html}</div>`); await page.evaluate(async () => { await document.fonts.ready; }); return (await page.evaluate(() => (document.getElementById('b') as HTMLElement).scrollHeight)) * 25.4 / 96; };
  try {
    let rs = 12.5, rh = 0;
    for (; rs >= 10; rs = Math.round((rs - 0.25) * 100) / 100) { rh = await h(rulesHtml(rs, tone), rulesW); if (RULES.y + RULES.padTop + rh + RULES.padBottom <= RULES.maxBottom) break; }
    let ns = 11.5, nh = 0;
    const note = noteParts(ship);
    if (note) for (; ns >= 9.5; ns = Math.round((ns - 0.25) * 100) / 100) { nh = await h(noteHtml(note.html, ns), noteW); if (nh <= 30) break; }
    const v = { rs, rh: Math.ceil(rh * 10) / 10 + 0.4, ns, nh: note ? Math.ceil(nh * 10) / 10 + 0.4 : 0 };
    FIT.set(ship.code, v); return v;
  } finally { await page.close(); }
}
/** a small engraved flourish for the heading: a rule that ends in a lozenge and a curl (pointing to the words) */
const flourish = (flip: boolean) => `<svg class="wr-fl" viewBox="0 0 34 6" width="17mm" height="3mm"${flip ? ' style="transform:scaleX(-1)"' : ''}><path d="M1 3H22.5" stroke="currentColor" stroke-width=".55"/><path d="M4 3H20" stroke="currentColor" stroke-width="1.3" stroke-opacity=".35"/><path d="M22.5 3L25.5 .9L28.5 3L25.5 5.1Z" fill="currentColor"/><path d="M28.5 3C30.5 3 31.6 1.8 31.2 .9C30.8 .1 29.6 .4 29.8 1.4" fill="none" stroke="currentColor" stroke-width=".5"/><circle cx="1.2" cy="3" r=".8" fill="currentColor"/></svg>`;
/** the drop cap: the letter in the ship's colour on a little engraved plate with a double rule and scrolls in the corners */
const dropCap = (ch: string) => `<span class="wr-dc"><svg viewBox="0 0 40 40" preserveAspectRatio="none"><rect x=".5" y=".5" width="39" height="39" rx="1.5" fill="var(--c)"/><rect x="2.6" y="2.6" width="34.8" height="34.8" rx=".8" fill="none" stroke="#f6e7c2" stroke-width=".7" stroke-opacity=".85"/><rect x="4" y="4" width="32" height="32" fill="none" stroke="#f6e7c2" stroke-width=".3" stroke-opacity=".6"/>` +
  [[4, 4, 1, 1], [36, 4, -1, 1], [4, 36, 1, -1], [36, 36, -1, -1]].map(([x, y, a, b]) => `<path d="M${x} ${y + b * 6}C${x} ${y + b * 2} ${x + a * 2} ${y} ${x + a * 6} ${y}M${x + a * 1.6} ${y + b * 4.2}C${x + a * 2.4} ${y + b * 2.4} ${x + a * 3} ${y + b * 3} ${x + a * 2.6} ${y + b * 3.8}" fill="none" stroke="#f6e7c2" stroke-width=".55" stroke-opacity=".8"/>`).join('') +
  `</svg><span>${esc(ch)}</span></span>`;
function rulesHtml(size: number, tone: IconTone): string {
  const sec = rulesSection(FTXT.wreck.section);
  const para = sec.p.map((p, i) => {
    const t = noRef(p);
    if (i === 0 && /^\p{Lu}/u.test(t)) return `<p class="wr-first">${dropCap(t[0])}${md(t.slice(1))}</p>`;
    return `<p>${md(t)}</p>`;
  }).join('');
  return `<div class="wr-rules" style="--fs:${size}pt"><div class="wr-h">${flourish(false)}<span>${esc(FTXT.wreck.section)}</span>${flourish(true)}</div>${para}` +
    `<ul>${sec.li.map((l, i) => `<li>${iconSvg(LI_ICONS[i % LI_ICONS.length], 6.2, tone)}${md(noRef(l))}</li>`).join('')}</ul><p class="wr-q">${md(noRef(rulesLine(FTXT.wreck.captainLine)))}</p></div>`;
}
const noteHtml = (html: string, size: number) => `<div class="wr-note" style="--ns:${size}pt">${html}</div>`;
/** the heading of the column in two lines, cut at the dash: «Капитан —» / «на борту союзника» */
const headLines = () => { const t = FTXT.wreck.free, i = t.indexOf(' — '); return i > 0 ? [t.slice(0, i + 2), t.slice(i + 3)] : [t]; };

interface Plan { title: Rect; rules: Rect; col: Rect; head: Rect; rows: Rect[]; rules2: number[]; note: Rect | null; token: Rect; titleSize: number; headSize: number }
function plan(ship: Ship, fit: { rh: number; nh: number }): Plan {
  const tw = Math.max(24 + widthOf(FTXT.wreck.title, 26, TITLE_O) + 6, 24 + widthOf(`${ship.name} · ${ship.captain}`, 12, SUB_O) + 5, 112);
  const title = { x: 16, y: 11, w: tw, h: 23 };
  const col = { x: PAGE.w - 12 - COL.w, y: 11, w: COL.w, h: 0 }, p = COL.pad;
  const rules = { x: 18, y: RULES.y, w: col.x - 12 - 18, h: RULES.padTop + fit.rh + RULES.padBottom };
  const token = { x: col.x + p, y: col.y + p, w: COL.token, h: COL.token };
  const head = { x: token.x + token.w + 3, y: token.y + 1, w: col.x + col.w - p - (token.x + token.w + 3), h: COL.token - 2 };
  const lines = headLines(), widest = Math.max(...lines.map(l => widthOf(l, 12.5, HEAD_O)));
  const headSize = Math.min(12.5, Math.floor(((head.w - 4) / widest) * 12.5 * 4) / 4);
  let y = token.y + token.h + 6;
  const rows: Rect[] = [], rules2: number[] = [y - 3];
  for (let i = 0; i < 2; i++) { rows.push({ x: col.x + p, y, w: col.w - 2 * p, h: COL.row }); y += COL.row + (i ? 0 : 3); if (!i) rules2.push(y - 1.5); }
  let note: Rect | null = null;
  if (fit.nh) { y += 3; rules2.push(y); y += 3; note = { x: col.x + p, y, w: col.w - 2 * p, h: Math.max(fit.nh + 6, 13) }; y += note.h; }
  col.h = y + p - col.y;
  return { title, rules, col, head, rows, rules2, note, token, titleSize: 26, headSize };
}

/** a rope the plates hang by: a dark lay with a lighter twist; a ring at the foot when it ends on a plate */
function rope(a: P, b: P, brass?: string): string {
  const d = `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1] - (brass ? 0.9 : 0))}`;
  return `<path d="${d}" stroke="#2a1e10" stroke-width=".8"/><path d="${d}" stroke="#b89a64" stroke-width=".4" stroke-dasharray=".7 .7"/>` + (brass ? `<circle cx="${r2(b[0])}" cy="${r2(b[1] - 0.4)}" r="1.15" fill="none" stroke="${brass}" stroke-width=".45"/>` : '');
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
/** the scroll's extent with its rollers (for the physics check): the knobs stick out at the sides */
const scrollBox = (b: Rect): Rect => ({ x: b.x - 8.5, y: b.y - 2, w: b.w + 17, h: b.h + 2.5 });
/** the rules: a scroll of a ship's log hanging under the cartouche — a turned wooden roller at the top, the paper hanging
 *  from it, waterlogged (stains, darker edges, the sides a little wavy), the foot rolled up round a weighted roller */
function rulesSvg(b: Rect, L: Look, pal: Pal, id: string): string {
  const { x, y, w, h } = b, out: string[] = [], ink = L.paperLine;
  const top = y + 1.2, foot = y + h - 3.4, rr = 3.1;
  // the paper: the sides sway in a little, the top edge tucked under the roller
  const paper = `M${r2(x)} ${r2(top)}H${r2(x + w)}C${r2(x + w + 0.9)} ${r2(top + (foot - top) * 0.35)} ${r2(x + w - 0.9)} ${r2(top + (foot - top) * 0.7)} ${r2(x + w)} ${r2(foot)}H${r2(x)}C${r2(x + 0.9)} ${r2(top + (foot - top) * 0.7)} ${r2(x - 0.9)} ${r2(top + (foot - top) * 0.35)} ${r2(x)} ${r2(top)}Z`;
  const stain = mix(L.paper, '#7a5a2a', 0.35);
  out.push(`<defs><radialGradient id="${id}soak" cx=".5" cy=".45" r=".72"><stop offset=".55" stop-color="${L.paper}"/><stop offset="1" stop-color="${mix(L.paper, '#6a4a24', 0.2)}"/></radialGradient>` +
    `<radialGradient id="${id}stain"><stop offset="0" stop-color="${stain}" stop-opacity="0"/><stop offset=".72" stop-color="${stain}" stop-opacity=".1"/><stop offset=".9" stop-color="${stain}" stop-opacity=".22"/><stop offset="1" stop-color="${stain}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${id}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a38"/><stop offset=".35" stop-color="#6e4520"/><stop offset="1" stop-color="#2e1a0a"/></linearGradient>` +
    `<linearGradient id="${id}roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(L.paper, '#ffffff', 0.35)}"/><stop offset=".4" stop-color="${L.paper}"/><stop offset=".8" stop-color="${mix(L.paper, '#5a3c1c', 0.32)}"/><stop offset="1" stop-color="${mix(L.paper, '#3a2410', 0.5)}"/></linearGradient>` +
    `<radialGradient id="${id}knob" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c89a5e"/><stop offset=".5" stop-color="#7a4c22"/><stop offset="1" stop-color="#2a1608"/></radialGradient></defs>`);
  // the shadow on the water behind
  out.push(`<path d="${paper}" fill="#05080c" fill-opacity=".34" transform="translate(1.1 1.6)"/><rect x="${r2(x - 6)}" y="${r2(foot - rr + 1.4)}" width="${r2(w + 12)}" height="${r2(2 * rr)}" rx="${rr}" fill="#05080c" fill-opacity=".3"/>`);
  out.push(`<path data-plate="wtext" d="${paper}" fill="url(#${id}soak)" stroke="${ink}" stroke-opacity=".45" stroke-width=".22"/>`);
  // water stains, rings of tide-marks
  for (const [cx, cy, rx, ry] of [[0.82, 0.18, 26, 15], [0.12, 0.72, 20, 13], [0.58, 0.86, 30, 9], [0.3, 0.1, 14, 8]]) out.push(`<ellipse cx="${r2(x + w * cx)}" cy="${r2(top + (foot - top) * cy)}" rx="${rx}" ry="${ry}" fill="url(#${id}stain)"/>`);
  // the double rule of the page, the fleurons in its corners
  const fx0 = x + 3.4, fy0 = top + 3.6, fx1 = x + w - 3.4, fy1 = foot - 3;
  out.push(`<rect x="${r2(fx0)}" y="${r2(fy0)}" width="${r2(fx1 - fx0)}" height="${r2(fy1 - fy0)}" fill="none" stroke="${pal.deep}" stroke-opacity=".55" stroke-width=".4"/><rect x="${r2(fx0 + 1)}" y="${r2(fy0 + 1)}" width="${r2(fx1 - fx0 - 2)}" height="${r2(fy1 - fy0 - 2)}" fill="none" stroke="${pal.deep}" stroke-opacity=".4" stroke-width=".18"/>`);
  for (const [cx, cy, a, bb] of [[fx0, fy0, 1, 1], [fx1, fy0, -1, 1], [fx0, fy1, 1, -1], [fx1, fy1, -1, -1]]) out.push(`<path d="M${r2(cx + a * 1)} ${r2(cy + bb * 1)}l${a * 2.2} ${bb * 2.2}" stroke="${pal.deep}" stroke-opacity=".5" stroke-width=".3"/><path d="M${r2(cx + a * 3.6)} ${r2(cy + bb * 2.4)}c${a * -0.2} ${bb * -1.5} ${a * 1.8} ${bb * -1.8} ${a * 2.2} ${bb * -0.6}M${r2(cx + a * 2.4)} ${r2(cy + bb * 3.6)}c${a * -1.5} ${bb * -0.2} ${a * -1.8} ${bb * 1.8} ${a * -0.6} ${bb * 2.2}" fill="none" stroke="${pal.deep}" stroke-opacity=".55" stroke-width=".3"/><circle cx="${r2(cx + a * 2)}" cy="${r2(cy + bb * 2)}" r=".55" fill="${pal.deep}" fill-opacity=".6"/>`);
  // the top roller: a turned rod with knobs, the paper wrapped once round it
  const knob = (cx: number, cy: number, r: number) => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r}" fill="url(#${id}knob)" stroke="#1e1006" stroke-width=".25"/><circle cx="${r2(cx - r * 0.3)}" cy="${r2(cy - r * 0.35)}" r="${r2(r * 0.28)}" fill="#f0d6a6" fill-opacity=".55"/>`;
  out.push(`<rect x="${r2(x - 5.5)}" y="${r2(top - 1.9)}" width="${r2(w + 11)}" height="3.8" rx="1.9" fill="url(#${id}wood)" stroke="#1e1006" stroke-width=".25"/><rect x="${r2(x - 0.6)}" y="${r2(top - 2.1)}" width="${r2(w + 1.2)}" height="4.2" rx="2" fill="url(#${id}roll)" stroke="${ink}" stroke-opacity=".5" stroke-width=".2"/>`);
  out.push(`<path d="M${r2(x - 3.8)} ${r2(top - 1.6)}V${r2(top + 1.6)}M${r2(x + w + 3.8)} ${r2(top - 1.6)}V${r2(top + 1.6)}" stroke="#2a1608" stroke-width=".3"/>`, knob(x - 7, top, 2.4), knob(x + w + 7, top, 2.4));
  // the bottom roll: the paper rolled up (its spiral shows at the ends), the weighted rod through it
  out.push(`<rect x="${r2(x - 5.5)}" y="${r2(foot - 1.7)}" width="${r2(w + 11)}" height="3.4" rx="1.7" fill="url(#${id}wood)" stroke="#1e1006" stroke-width=".25"/>`);
  out.push(`<rect x="${r2(x - 0.8)}" y="${r2(foot - rr)}" width="${r2(w + 1.6)}" height="${r2(2 * rr)}" rx="${rr}" fill="url(#${id}roll)" stroke="${ink}" stroke-opacity=".55" stroke-width=".22"/><path d="M${r2(x + 1)} ${r2(foot - rr + 0.9)}H${r2(x + w - 1)}" stroke="#fffaf0" stroke-opacity=".6" stroke-width=".35"/><path d="M${r2(x + 2)} ${r2(foot + rr - 1.1)}H${r2(x + w - 2)}" stroke="${ink}" stroke-opacity=".25" stroke-width=".25"/>`);
  for (const ex of [x - 0.8 + rr * 0.55, x + w + 0.8 - rr * 0.55]) out.push(`<ellipse cx="${r2(ex)}" cy="${r2(foot)}" rx="${r2(rr * 0.55)}" ry="${rr}" fill="${mix(L.paper, '#8a6a3a', 0.25)}" stroke="${ink}" stroke-opacity=".55" stroke-width=".2"/><path d="M${r2(ex)} ${r2(foot - rr * 0.75)}c${r2(rr * 0.4)} 0 ${r2(rr * 0.4)} ${r2(rr * 1.5)} 0 ${r2(rr * 1.5)}c${r2(-rr * 0.28)} 0 ${r2(-rr * 0.28)} ${r2(-rr * 1.05)} 0 ${r2(-rr * 1.05)}c${r2(rr * 0.18)} 0 ${r2(rr * 0.18)} ${r2(rr * 0.6)} 0 ${r2(rr * 0.6)}" fill="none" stroke="${ink}" stroke-opacity=".6" stroke-width=".2"/>`);
  out.push(knob(x - 7, foot, 2.2), knob(x + w + 7, foot, 2.2));
  return out.join('');
}
/** the brass column: a plate on two ropes, rivets in the corners; the token and the heading, then the two lines for the
 *  ally set on the brass with their engraved icons in little roundels, brass rules with a lozenge between them */
function columnSvg(p: Plan, L: Look, pal: Pal, id: string, tokenUrl: string, ship: Ship, noteIcon: IconName | null): string {
  const { col } = p, [bl, bm, bd] = L.brass, ink = '#2a1a08', out: string[] = [];
  out.push(`<defs><linearGradient id="${id}col" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".55" stop-color="${mix(bl, bm, 0.7)}"/><stop offset="1" stop-color="${bm}"/></linearGradient>` +
    `<radialGradient id="${id}boss" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="${bl}"/><stop offset="1" stop-color="${bm}"/></radialGradient></defs>`);
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
  // the heading, engraved into the brass: two lines with a short rule under them
  const hd = p.head, lines = headLines(), em = pt(p.headSize), gap = em * 1.42, top = hd.y + hd.h / 2 - (gap * (lines.length - 1)) / 2 + 0.33 * em;
  out.push(`<rect data-plate="whead" x="${r2(hd.x)}" y="${r2(hd.y)}" width="${r2(hd.w)}" height="${r2(hd.h)}" fill="none"/>`);
  lines.forEach((l, i) => out.push(text(hd.x + 1.6, top + i * gap + 0.25, l, p.headSize, { ...HEAD_O, color: '#fff6d8', op: 0.55 }), text(hd.x + 1.6, top + i * gap, l, p.headSize, { ...HEAD_O, color: pal.deep, in: 'whead' })));
  // the brass rules between the parts: an engraved line with a highlight, a lozenge with dots in the middle
  const rule = (y: number, x0 = col.x + 6, x1 = col.x + col.w - 6) => { const m = (x0 + x1) / 2; return `<path d="M${r2(x0)} ${r2(y)}H${r2(m - 4)}M${r2(m + 4)} ${r2(y)}H${r2(x1)}" stroke="${bd}" stroke-width=".35"/><path d="M${r2(x0)} ${r2(y + 0.4)}H${r2(m - 4)}M${r2(m + 4)} ${r2(y + 0.4)}H${r2(x1)}" stroke="#fff6d8" stroke-opacity=".55" stroke-width=".25"/><path d="M${r2(m - 2.4)} ${r2(y)}L${r2(m)} ${r2(y - 1.3)}L${r2(m + 2.4)} ${r2(y)}L${r2(m)} ${r2(y + 1.3)}Z" fill="${bd}"/><circle cx="${r2(m - 3.4)}" cy="${r2(y)}" r=".45" fill="${bd}"/><circle cx="${r2(m + 3.4)}" cy="${r2(y)}" r=".45" fill="${bd}"/>`; };
  p.rules2.forEach(y => out.push(rule(y)));
  // the two lines for the ally: an engraved icon in a sunk roundel, the words set on the brass
  const icons: IconName[] = ['cards', 'reaction'];
  p.rows.forEach((rw, i) => {
    const cx = rw.x + COL.icon / 2 + 0.6, cy = rw.y + rw.h / 2, rr = COL.icon / 2 + 0.6;
    out.push(`<circle cx="${r2(cx + 0.25)}" cy="${r2(cy + 0.35)}" r="${r2(rr)}" fill="#1a0e04" fill-opacity=".3"/><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(rr)}" fill="url(#${id}boss)" stroke="${bd}" stroke-width=".35"/><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(rr - 0.7)}" fill="none" stroke="${bd}" stroke-width=".15" stroke-opacity=".8"/>`);
    out.push(ico(icons[i], cx, cy, COL.icon - 1.4, { ...L.tone, ink, paper: bl }, `wcell${i}-icon`));
    const lx = cx + rr + 2.6, lb = { x: lx, y: rw.y, w: rw.x + rw.w - lx, h: rw.h };
    out.push(`<rect data-plate="wlab${i}" x="${r2(lb.x)}" y="${r2(lb.y)}" width="${r2(lb.w)}" height="${r2(lb.h)}" fill="none"/>`);
    const by = lb.y + lb.h / 2 + 0.33 * pt(13);
    out.push(text(lb.x + 1.5, by + 0.25, FTXT.wreck.ally[i], 13, { ...LAB_O, color: '#fff6d8', op: 0.55 }), text(lb.x + 1.5, by, FTXT.wreck.ally[i], 13, { ...LAB_O, color: ink, in: `wlab${i}` }));
  });
  // the note: a slip of parchment riveted into the brass, its icon at the left
  const n = p.note;
  if (n && noteIcon) {
    out.push(`<rect x="${r2(n.x + 0.4)}" y="${r2(n.y + 0.6)}" width="${r2(n.w)}" height="${r2(n.h)}" rx="1" fill="#1a0e04" fill-opacity=".3"/><rect data-plate="wnote" x="${r2(n.x)}" y="${r2(n.y)}" width="${r2(n.w)}" height="${r2(n.h)}" rx="1" fill="url(#${id}paper)" stroke="${bd}" stroke-width=".3"/><rect x="${r2(n.x + 0.9)}" y="${r2(n.y + 0.9)}" width="${r2(n.w - 1.8)}" height="${r2(n.h - 1.8)}" rx=".6" fill="none" stroke="${L.paperLine}" stroke-opacity=".5" stroke-width=".18"/>`);
    for (const rx of [n.x + 1.9, n.x + n.w - 1.9]) out.push(`<circle cx="${r2(rx)}" cy="${r2(n.y + n.h / 2)}" r=".6" fill="${bm}" stroke="${bd}" stroke-width=".2"/>`);
    out.push(ico(noteIcon, n.x + 7.4, n.y + n.h / 2, 8, L.tone, 'wnote-icon'));
  }
  return out.join('');
}

/** One back «Затонул», v3. */
export async function wreckV3(ctx: Ctx, ship: Ship, mat?: ShipMaterial): Promise<{ html: string; css: string }> {
  const key = DECK_KEY[ship.code] as ShipKey, Lk = LOOKS[key], base = basePalette(ship.color), pal = mat?.palette ? mat.palette(base) : base, sea = SEA[key], id = `wr${key}`;
  const note = noteParts(ship);
  // the words' widths come from the browser: a dry run collects them
  plan(ship, { rh: 80, nh: note ? 20 : 0 });
  await measureMissing(ctx);
  const d2 = plan(ship, { rh: 80, nh: note ? 20 : 0 });
  const fit = await fitBlocks(ctx, ship, Lk.tone, d2.rules.w - 2 * RULES.padX, d2.note ? d2.note.w - 16 : 40);
  const p = plan(ship, fit);
  const props = await placeProps(ctx, key, sea);
  const scene = seaFloorSvg(key, sea, p, props);
  const plates = [{ x: p.title.x - 2.2, y: p.title.y, w: p.title.w + 4.4, h: p.title.h }, scrollBox(p.rules), p.col];
  const issues = physics(scene.geo, plates), at = WRECK_CHECK.findIndex(c => c.board === ship.name);
  if (at >= 0) WRECK_CHECK.splice(at, 1);
  WRECK_CHECK.push({ board: ship.name, issues });
  const jpg = await rasterJpeg(ctx.browser, `wreck3-${key}`, scene.svg, PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);
  const tokenUrl = await tokenPic(ctx, ship);
  const brass = Lk.brass[1], svg: string[] = [defsOf(id, Lk)];
  // the cartouche and the column hang on ropes from the surface; the scroll's top roller is tied under the cartouche
  const T = p.title, Rr = p.rules, ty = Rr.y + 1.2;
  svg.push(rope([T.x + 14, 0], [T.x + 14, T.y], brass), rope([T.x + T.w - 14, 0], [T.x + T.w - 14, T.y], brass));
  svg.push(rope([p.col.x + 14, 0], [p.col.x + 14, p.col.y], brass), rope([p.col.x + p.col.w - 14, 0], [p.col.x + p.col.w - 14, p.col.y], brass));
  svg.push(titleSvg(T, ship, pal, Lk, id));
  const tie = (a: P, x: number) => rope(a, [x, ty - 1.9]) + `<path d="M${r2(x - 1)} ${r2(ty - 2)}l2 3.8M${r2(x)} ${r2(ty - 2)}l2 3.8M${r2(x - 2)} ${r2(ty - 2)}l2 3.8" stroke="#2a1e10" stroke-width=".55"/><path d="M${r2(x - 1)} ${r2(ty - 2)}l2 3.8M${r2(x)} ${r2(ty - 2)}l2 3.8M${r2(x - 2)} ${r2(ty - 2)}l2 3.8" stroke="#b89a64" stroke-width=".22"/>`;
  svg.push(rulesSvg(Rr, Lk, pal, id), tie([T.x + 26, T.y + T.h - 0.6], T.x + 25), tie([T.x + T.w - 26, T.y + T.h - 0.6], T.x + T.w - 25));
  svg.push(columnSvg(p, Lk, pal, id, tokenUrl, ship, note?.icon ?? null));
  const rx = Rr.x + RULES.padX, ry = Rr.y + RULES.padTop, rw = Rr.w - 2 * RULES.padX;
  let html = `<div class="wr-abs" data-in="wtext" data-name="правила «Корабль тонет»" style="left:${r2(rx)}mm;top:${r2(ry)}mm;width:${r2(rw)}mm;height:${r2(fit.rh)}mm;--ink:${Lk.ink};--soft:${Lk.soft};--c:${pal.deep};--rule:${Lk.noteLine}">${rulesHtml(fit.rs, Lk.tone)}</div>`;
  if (note && p.note) html += `\n<div class="wr-abs" data-in="wnote" data-name="что снять" style="left:${r2(p.note.x + 13)}mm;top:${r2(p.note.y + 3)}mm;width:${r2(p.note.w - 16)}mm;height:${r2(fit.nh)}mm;--ink:${Lk.ink};--c:${pal.deep}">${noteHtml(note.html, fit.ns)}</div>`;
  return { html: `<div class="wr wr-${key}"><svg class="wr-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>${svg.join('\n')}</svg>\n${html}</div>`, css: WRECK_CSS };
}

export const WRECK_CSS = `
.wr{position:absolute;inset:0}
.wr-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.wr-abs{position:absolute;overflow:hidden}
.wr-rules{font:500 var(--fs) 'Alegreya Sans',sans-serif;line-height:1.27;color:var(--ink)}
.wr-rules .wr-h{display:flex;align-items:center;justify-content:center;gap:2.4mm;font:800 calc(var(--fs) + 3pt)/1.1 'Alegreya SC',serif;letter-spacing:.06em;color:var(--c);margin-bottom:2.2mm}
.wr-rules .wr-fl{flex:none;display:block}
.wr-rules p{margin:0}
.wr-rules b{font-weight:800}
.wr-rules .wr-dc{float:left;position:relative;width:calc(3 * 1.27 * var(--fs) - .5mm);height:calc(3 * 1.27 * var(--fs) - .5mm);margin:.55mm 2.2mm 0 0;font:800 calc(2.75 * var(--fs))/1 'Alegreya SC',serif;color:#fff8e6;text-align:center}
.wr-rules .wr-dc svg{position:absolute;inset:0;width:100%;height:100%}
.wr-rules .wr-dc span{position:relative;display:block;padding-top:calc(.36 * var(--fs))}
.wr-rules ul{margin:1.6mm 0 0;padding:0;list-style:none;clear:both}
.wr-rules li{position:relative;padding-left:8.4mm;margin-top:1.3mm;min-height:6.2mm}
.wr-rules li>svg{position:absolute;left:0;top:calc(.635em - 3.1mm)}
.wr-rules .wr-q{margin-top:2.4mm;padding-top:1.8mm;border-top:.3mm solid var(--rule);font:italic 500 calc(var(--fs) - .5pt)/1.27 Alegreya,serif;color:var(--soft)}
.wr-note{font:500 var(--ns) 'Alegreya Sans',sans-serif;line-height:1.25;color:var(--ink)}
.wr-note p{margin:0}
.wr-note p+p{margin-top:1.4mm}
.wr-note b{font-weight:800;color:var(--c)}
`;
