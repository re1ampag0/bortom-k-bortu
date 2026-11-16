// The things on the sea floor of the backs «Затонул» (wreck.ts): what each ship lost, lying IN the sand — part of each
// thing under it, the sand drifted against its sides, the thing tilted as it settled — and old: rust, verdigris, bleached
// and rotten wood, stains, silt on every upper surface, barnacles and weed grown on it.
//
// How a thing gets onto the floor (one pipeline for every kind, so a new kind is one entry in PROP_DEFS):
//   1. PROP_DEFS[kind].draw(env, o) draws it at a nominal anchor (scene mm; own SVG or a kit prop);
//   2. measureProps() rasterises each drawing in the browser → its occupancy grid (which 0.2 mm cells it covers);
//   3. placeProp() moves it so its middle is at spec.x and `sink` of its height is under the sand line spec.y, and
//      works out the sand around it: the line where it enters the sand, the drifts heaped against its sides, the shadow;
//   4. propSvg() draws, in this order: the thing → its age (masked to its own pixels: stains, rust or verdigris, silt
//      on its upper outline, barnacles, haze with depth) → the sand over its buried part (the floor's own paint and
//      ripples, clipped to the mound) → the dark crevice and the shadow at its base → weed growing from it;
//   5. propIssues() checks the physics from the same numbers (WRECK_CHECK).
// A new kind: add its name to PropKind and an entry { mat, draw } to PROP_DEFS (draw at o.x, o.y with o.s, o.rot; own
// drawings use own(o, …) — a local frame with the foot at 0, 0, x right, y down, 1 = 1 mm at s = 1).
import type { Page } from '@playwright/test';

export type P = [number, number];
export interface Box { x0: number; y0: number; x1: number; y1: number }
type KitFn = (u: string, L: unknown, o: Record<string, unknown>) => string;
export interface Kit {
  anchor: KitFn; cannon: KitFn; shot: KitFn; chest: KitFn; bottle: KitFn; rock: KitFn; barrel: KitFn; crate: KitFn; sabre: KitFn; pistol: KitFn; coins: KitFn; bell: KitFn;
  chain(u: string, L: unknown, pts: P[], o: Record<string, unknown>): string;
  rope(u: string, L: unknown, pts: P[], o: Record<string, unknown>): string;
}

/** what the age does to a material: two kinds of blotches (colour, opacity, size of the noise), streaks running down */
export type AgeMat = 'iron' | 'brass' | 'wood' | 'char' | 'bone' | 'clay' | 'leather' | 'glass' | 'stone' | 'gold';
const AGE: Record<AgeMat, { b: [string, number, number][]; streak?: string; fouling: number }> = {
  iron: { b: [['#8a4a22', 0.62, 0.42], ['#2e241c', 0.5, 0.75]], streak: '#9a5426', fouling: 1 },
  brass: { b: [['#4f9078', 0.68, 0.5], ['#2c4a3a', 0.4, 0.9]], streak: '#4f8a70', fouling: 0.8 },
  wood: { b: [['#a8a490', 0.25, 0.3], ['#1e1610', 0.5, 0.65]], fouling: 1 },
  char: { b: [['#6a645c', 0.4, 0.55], ['#0c0a08', 0.45, 0.4]], fouling: 0.6 },
  bone: { b: [['#7a5a32', 0.42, 0.45], ['#3e3322', 0.3, 0.9]], fouling: 0.5 },
  clay: { b: [['#d4c8aa', 0.45, 0.6], ['#3a2a1c', 0.32, 0.8]], fouling: 0.8 },
  leather: { b: [['#3a2a1a', 0.45, 0.4], ['#b0a286', 0.35, 0.85]], fouling: 0.6 },
  glass: { b: [['#dfe6dc', 0.4, 0.5], ['#3e5434', 0.35, 0.7]], fouling: 0.5 },
  stone: { b: [['#56664a', 0.35, 0.35], ['#2a2a22', 0.25, 0.7]], fouling: 0.7 },
  gold: { b: [], fouling: 0.15 }
};
/** the filters of the blotches (put once in the scene's defs) */
export function ageDefs(): string {
  let out = '';
  for (const [m, a] of Object.entries(AGE)) a.b.forEach(([c, , fr], i) => {
    out += `<filter id="wAge-${m}${i}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fr}" numOctaves="3" seed="${7 + i * 13 + m.length}" result="t"/>` +
      `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${i ? '0 1.6 0 0 -.3' : '1.6 0 0 0 -.3'}" result="a0"/><feComponentTransfer in="a0" result="a"><feFuncA type="table" tableValues="0 0 0 .15 .7 1 1"/></feComponentTransfer>` +
      `<feFlood flood-color="${c}"/><feComposite in2="a" operator="in"/></filter>`;
  });
  return out;
}

/** the filters of the hull's age (on full-sheet rects masked by the hull's silhouette): wChar0 — black blotches of
 *  charred wood, wChar1 — grey ash caught in the cracks of the char, wPeel — pale patches where the paint has peeled */
export function hullAgeDefs(): string {
  const noise = (id: string, type: string, fr: string, oct: number, seed: number, table: string, color: string) =>
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="297" height="210" color-interpolation-filters="sRGB"><feTurbulence type="${type}" baseFrequency="${fr}" numOctaves="${oct}" seed="${seed}" result="t"/>` +
    `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -.2" result="a0"/><feComponentTransfer in="a0" result="a"><feFuncA type="table" tableValues="${table}"/></feComponentTransfer>` +
    `<feFlood flood-color="${color}"/><feComposite in2="a" operator="in"/></filter>`;
  return noise('wChar0', 'fractalNoise', '.09 .16', 4, 3, '0 0 .1 .6 1 1', '#060403') +
    noise('wChar1', 'turbulence', '.55 .9', 2, 9, '0 0 0 0 0 .2 .7 1', '#8a8278') +
    noise('wPeel', 'fractalNoise', '.07 .2', 4, 5, '0 0 0 .3 .85 1', '#a4aca6');
}

/** charred planking (the «alligator» char of burnt wood) over a box (mm, in the ship's own frame): rows of blocks along
 *  the planks split by dark cracks, grey ash catching the light on the upper edges of some blocks */
export function charSvg(x0: number, y0: number, x1: number, y1: number, R: () => number, k = 1): string {
  let cr = '', ash = '';
  for (let y = y0; y < y1; y += 0.7 + R() * 0.6) {
    // the grain splits: broken runs along the plank, short cross-checks at random, no two rows alike
    for (let x = x0 + R() * 3; x < x1; x += 2 + R() * 4) { const l = 1 + R() * 3.5; cr += `M${f(x)} ${f(y)}q${f(l / 2)} ${f((R() - 0.5) * 0.35)} ${f(l)} ${f((R() - 0.5) * 0.2)}`; }
    for (let x = x0 + R() * 2; x < x1; x += 0.8 + R() * 2.6) {
      if (R() < 0.55) cr += `M${f(x)} ${f(y + (R() - 0.5) * 0.3)}l${f((R() - 0.5) * 0.4)} ${f(0.3 + R() * 0.6)}`;
      if (R() < 0.18) ash += `M${f(x + 0.2)} ${f(y + 0.25)}h${f(0.3 + R() * 0.9)}`;
    }
  }
  return `<path d="${cr}" fill="none" stroke="#050302" stroke-width=".18" stroke-opacity="${f(0.6 * k)}" stroke-linecap="round"/><path d="${ash}" fill="none" stroke="#a09688" stroke-width=".2" stroke-opacity="${f(0.35 * k)}" stroke-linecap="round"/>`;
}

export type PropKind = 'anchor' | 'cannon' | 'shot' | 'bottle' | 'pistol' | 'sabre' | 'barrel' | 'chest' | 'crate' | 'rock' | 'chain' | 'coins' | 'bell' |
  'skull' | 'firePot' | 'compass' | 'mapCase' | 'grapnel' | 'plank' | 'beam' | 'spar' | 'staves';
/** a thing on the floor: (x, y) — the middle of it where it enters the sand (mm); sink — the share of its height under the
 *  sand; s — scale; rot — degrees (clockwise); heap — the drifts against its sides (1 — by its size); opt — the kind's own */
export interface PropSpec { kind: PropKind; x: number; y: number; s?: number; rot?: number; sink?: number; flip?: boolean; heap?: number; opt?: Record<string, unknown>; name?: string }
export interface DrawO { x: number; y: number; s: number; rot: number; flip: boolean; seed: number; opt: Record<string, unknown> }
export interface Env { u: string; L: unknown; K: Kit }
interface PropDef { mat: AgeMat; draw(e: Env, o: DrawO): string }

const f = (n: number) => String(Math.round(n * 100) / 100);
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
/** an own drawing in its local frame: the foot at (0, 0), x right, y down, mm at s = 1 */
const own = (o: DrawO, body: string) => `<g transform="translate(${f(o.x)} ${f(o.y)}) rotate(${f(o.rot)}) scale(${f(o.s * (o.flip ? -1 : 1))} ${f(o.s)})">${body}</g>`;
const lin = (id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rad = (id: string, stops: [number, string][], cx = 0.35, cy = 0.3, r = 0.8) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
/** a jagged line from a to b: n teeth, depth d (to the left of a→b and back) */
function jag(a: P, b: P, n: number, d: number, R: () => number): P[] {
  const out: P[] = [], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  for (let i = 1; i < n; i++) { const t = (i + (R() - 0.5) * 0.6) / n, k = (i % 2 ? 1 : -0.4) * d * (0.4 + R() * 0.8); out.push([a[0] + dx * t + nx * k, a[1] + dy * t + ny * k]); }
  return out;
}
export const jagLine = jag;
const pts = (p: P[]) => p.map(q => `${f(q[0])},${f(q[1])}`).join(' ');
const poly = (p: P[]) => `M${pts(p).replace(/ /g, 'L')}Z`;

// ---- the wounds of a hull (drawn on the kit's ship, in its frame) ----
/** a hole in the side at (x, y) of size r (mm): 'shot' — a round hole with the raw wood of a splintered rim, splinters
 *  bent out and in, cracks running along the planks; 'breach' — planks stove in over the frames, their ends stepped and
 *  splintered, one sprung plank hanging out; 'burn' — burnt through, a wide charred rim with ash, charred frames inside.
 *  burnt (0..1) — the raw wood of the edges darkened by fire */
export function holeSvg(x: number, y: number, r: number, kind: 'shot' | 'breach' | 'burn', R: () => number, burnt = 0): string {
  const raw = mix('#9a8a6c', '#2a1e14', 0.2 + burnt * 0.7), rawD = mix('#6a5640', '#120c08', burnt * 0.7), out: string[] = [];
  const blob = (rx: number, ry: number, n: number, k: number): P[] => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.4, q = (i % 2 ? 1 : 1 - k) * (0.85 + R() * 0.3); return [x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q]; });
  const ribs = (hw: number, hh: number, c: [string, string]) => { let o = ''; for (let xx = x - hw + (0.6 + R()) * r * 0.4; xx < x + hw; xx += r * (0.55 + R() * 0.25)) o += `<rect x="${f(xx)}" y="${f(y - hh)}" width="${f(r * 0.2)}" height="${f(hh * 2)}" fill="${c[0]}"/><rect x="${f(xx)}" y="${f(y - hh)}" width="${f(r * 0.06)}" height="${f(hh * 2)}" fill="${c[1]}"/>`; return o; };
  if (kind === 'shot') {
    const core = blob(r * 1.05, r * 0.9, 12, 0.2), rim = blob(r * 1.45, r * 1.2, 14, 0.3);
    for (let i = 0; i < 2; i++) { const d = (i ? 1 : -1) * r * (2 + R() * 2.5); out.push(`<path d="M${f(x + (i ? 1 : -1) * r)} ${f(y + (R() - 0.5) * r * 0.6)}l${f(d * 0.5)} ${f((R() - 0.5) * 0.6)}l${f(d * 0.5)} ${f((R() - 0.5) * 0.5)}" stroke="#050504" stroke-width="${f(Math.max(0.15, r * 0.1))}" stroke-opacity=".7" fill="none"/>`); }
    out.push(`<path d="${poly(rim)}" fill="${raw}" fill-opacity=".85"/>`);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + R() * 0.7, l = r * (1.25 + R() * 0.45), w = r * (0.14 + R() * 0.12), c: P = [x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 0.95], nx = -Math.sin(a), ny = Math.cos(a);
      out.push(`<path d="M${f(c[0] + nx * w)} ${f(c[1] + ny * w)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l * 0.85)}L${f(c[0] - nx * w)} ${f(c[1] - ny * w)}Z" fill="${raw}" stroke="${rawD}" stroke-width=".1"/>`); }
    out.push(`<path d="${poly(core)}" fill="#050605" stroke="${rawD}" stroke-width="${f(r * 0.12)}"/>`);
    for (let i = 0; i < 3; i++) { const a = R() * Math.PI * 2, c: P = [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85]; out.push(`<path d="M${f(c[0] - 0.12)} ${f(c[1])}L${f(x + Math.cos(a) * r * 0.35)} ${f(y + Math.sin(a) * r * 0.3)}L${f(c[0] + 0.12)} ${f(c[1] + 0.1)}Z" fill="${rawD}"/>`); }
    return out.join('');
  }
  if (kind === 'breach') {
    const hw = r * 1.3, hh = r * 0.8, rows = 4, L: P[] = [], Rr: P[] = [];
    for (let j = 0; j <= rows; j++) { const yy = y - hh + (2 * hh * j) / rows; L.push([x - hw * (0.6 + R() * 0.5), yy]); Rr.push([x + hw * (0.6 + R() * 0.5), yy]); }
    const edge: P[] = []; L.forEach((q, j) => { edge.push(q); if (j < rows) edge.push([q[0], L[j + 1][1]]); });
    const redge: P[] = []; Rr.forEach((q, j) => { redge.push(q); if (j < rows) redge.push([q[0], Rr[j + 1][1]]); });
    const shape = [...edge, ...redge.reverse()], id = `hb${Math.round(x * 10)}${Math.round(y * 10)}`;
    out.push(`<clipPath id="${id}"><path d="${poly(shape)}"/></clipPath><path d="${poly(shape)}" fill="#060504"/><g clip-path="url(#${id})">${ribs(hw * 1.2, hh, [mix('#3a2a1c', '#0e0a08', burnt), mix('#7a6448', '#2a2018', burnt)])}</g>`);
    for (const q of [...L, ...Rr]) { const sgn = q[0] < x ? 1 : -1; out.push(`<path d="M${f(q[0])} ${f(q[1] + 0.05)}l${f(sgn * r * (0.2 + R() * 0.3))} ${f(hh / rows * 0.5)}l${f(-sgn * r * 0.25)} ${f(hh / rows * 0.45)}" fill="${raw}" stroke="${rawD}" stroke-width=".1"/>`); }
    const p0: P = [x - hw * 0.3, y - hh], ang = 24 + R() * 30;
    out.push(`<g transform="rotate(${f(ang)} ${f(p0[0])} ${f(p0[1])})"><rect x="${f(p0[0])}" y="${f(p0[1] - r * 0.12)}" width="${f(hw * 1.1)}" height="${f(2 * hh / rows)}" fill="${mix('#2a2622', raw, 0.25)}" stroke="#0a0806" stroke-width=".12"/><path d="M${f(p0[0] + hw * 1.1)} ${f(p0[1] - r * 0.12)}l${f(r * 0.4)} ${f(hh / rows * 0.6)}l${f(-r * 0.4)} ${f(hh / rows * 0.8)}" fill="${raw}"/></g>`);
    return out.join('');
  }
  // burnt through: the planking gone in a ragged patch wider than high (the fire ran along the strakes), the frames
  // standing in it with ash on their edges, the plank ends round it eaten to points, a halo of scorched grey
  const outer = blob(r * 1.9, r * 1.2, 18, 0.3), core = blob(r * 1.35, r * 0.78, 15, 0.4), id = `hc${Math.round(x * 10)}${Math.round(y * 10)}`;
  out.push(`<path d="${poly(outer)}" fill="#5a524a" fill-opacity=".35"/>`);
  for (let i = 0; i < 30; i++) { const a = R() * Math.PI * 2, d = r * (1.1 + R() * 0.6); out.push(`<path d="M${f(x + Math.cos(a) * d * 1.35)} ${f(y + Math.sin(a) * d * 0.85)}h${f(0.4 + R() * r * 0.35)}" stroke="#a49a8e" stroke-width="${f(0.15 + R() * 0.15)}" stroke-opacity="${f(0.35 + R() * 0.4)}"/>`); }
  const fr = (hw: number, hh: number) => { let o = ''; for (let xx = x - hw + r * 0.3; xx < x + hw; xx += r * (0.62 + R() * 0.2)) o += `<rect x="${f(xx)}" y="${f(y - hh)}" width="${f(r * 0.26)}" height="${f(hh * 2)}" fill="#24180f"/><rect x="${f(xx)}" y="${f(y - hh)}" width="${f(r * 0.08)}" height="${f(hh * 2)}" fill="#8a7a68"/><path d="M${f(xx + r * 0.26)} ${f(y - hh)}v${f(hh * 2)}" stroke="#000" stroke-width="${f(r * 0.06)}"/>`; return o; };
  out.push(`<clipPath id="${id}"><path d="${poly(core)}"/></clipPath><path d="${poly(core)}" fill="#020101"/><g clip-path="url(#${id})">${fr(r * 1.4, r)}<path d="M${f(x - r * 1.4)} ${f(y - r * 0.15)}H${f(x + r * 1.4)}" stroke="#1a120c" stroke-width="${f(r * 0.22)}"/></g>`);
  out.push(`<path d="${poly(core)}" fill="none" stroke="#8a8076" stroke-width="${f(r * 0.07)}" stroke-opacity=".75" stroke-dasharray="${f(r * 0.3)} ${f(r * 0.12)}"/>`);
  return out.join('');
}

// ---- own drawings ----
/** a skull without its jaw, a little turned to the right, stained */
function skull(id: string, R: () => number): string {
  const head = 'M-4.3 -4.6C-4.6 -8.6 -1.8 -10.4 .8 -10.3C3.9 -10.2 5.3 -8 5 -5.2C4.9 -4 4.4 -3.3 3.9 -2.7L3.7 -1.4C3.6 -.5 3 0 2.2 0L-1.4 0C-2.4 0 -3 -.6 -3.1 -1.4L-3.3 -2.6C-3.9 -3.1 -4.2 -3.8 -4.3 -4.6Z';
  let teeth = '';
  for (let i = 0; i < 7; i++) { const x = -2.3 + i * 0.74; if (R() < 0.22) teeth += `<rect x="${f(x)}" y="-1.7" width=".62" height="1.25" fill="#20160e"/>`; else teeth += `<path d="M${f(x)} -1.75h.62v1.1q-.31 .35 -.62 0Z" fill="#ddd0b0" stroke="#5a4c34" stroke-width=".12"/>`; }
  return `<defs>${rad(id + 'h', [[0, '#efe4c6'], [0.5, '#c4b48e'], [1, '#6e5e42']], 0.36, 0.26, 0.82)}</defs>` +
    `<path d="${head}" fill="url(#${id}h)" stroke="#4a3e2a" stroke-width=".2"/>` +
    `<path d="M-3.4 -3.2C-2 -3.6 1 -3.7 3.8 -3C3.6 -2.2 3.6 -1.9 3.6 -1.6L-3.1 -1.6Z" fill="#7a6a4a" fill-opacity=".45"/>` +
    `<path d="M-3.1 -5.4C-3.1 -6.6 -1.9 -7.1 -1 -6.8C-.1 -6.5 .2 -5.5 -.2 -4.7C-.6 -3.9 -2 -3.8 -2.6 -4.2C-3 -4.5 -3.1 -4.9 -3.1 -5.4Z" fill="#1d140c"/>` +
    `<path d="M1.2 -5.5C1.2 -6.5 2.3 -6.9 3.1 -6.6C3.8 -6.3 3.9 -5.4 3.6 -4.7C3.3 -4.1 2.3 -4 1.8 -4.3C1.4 -4.6 1.2 -5 1.2 -5.5Z" fill="#1d140c"/>` +
    `<path d="M-3 -6.5C-2.2 -7.4 -.6 -7.3 -.1 -6.4M1.4 -6.6C2.1 -7.2 3.3 -7.1 3.8 -6.4" fill="none" stroke="#f6eed6" stroke-width=".3" stroke-opacity=".7"/>` +
    `<path d="M.35 -3.9L-.45 -2.3L.3 -2.55L.95 -2.3Z" fill="#20160e"/>` + teeth +
    `<path d="M.8 -10.2C1.1 -9 .4 -8.4 1 -7.6M-2.8 -8.6l.8 .9" fill="none" stroke="#4a3c26" stroke-width=".16"/>` +
    `<path d="M4.9 -5.6C4.7 -4.2 4.2 -3.3 3.8 -2.8" fill="none" stroke="#3a2e1c" stroke-width=".5" stroke-opacity=".5"/>`;
}
/** a clay fire pot (an own design: a round belly with an incised band and knobs, a corded neck, a rag in the mouth);
 *  state: 'cracked' — whole with a crack and a chip, 'broken' — the lower half with its jagged edge, 'shards' — pieces */
function firePot(id: string, R: () => number, state: string): string {
  const clay = `<defs>${rad(id + 'c', [[0, '#d4926a'], [0.5, '#a05a3a'], [1, '#4a2414']], 0.34, 0.28, 0.85)}${lin(id + 'i', [[0, '#1a0e08'], [1, '#4a2a1a']])}</defs>`;
  const body = 'M-1.6 0C-4.4 -.4 -5 -3.4 -4.7 -5.4C-4.4 -8 -2.6 -9.4 -1.3 -9.7L-1.2 -11L1.2 -11L1.3 -9.7C2.6 -9.4 4.4 -8 4.7 -5.4C5 -3.4 4.4 -.4 1.6 0Z';
  // the band: two incised rings with a row of stamped rosettes between them, ribs combed down the belly
  let ros = ''; for (let i = 0; i < 6; i++) { const x = -3.7 + i * 1.48, y = -5.6 + Math.abs(x) * 0.06; ros += `<circle cx="${f(x)}" cy="${f(y)}" r=".42" fill="none" stroke="#3a1a0c" stroke-width=".16"/><circle cx="${f(x)}" cy="${f(y)}" r=".1" fill="#3a1a0c"/>`; }
  let ribs = ''; for (let i = 0; i < 7; i++) { const x = -3 + i; ribs += `M${f(x)} -4.2Q${f(x * 1.05)} -2.4 ${f(x * 0.7)} -.6`; }
  const band = `<path d="M-4.65 -6.6Q0 -5.6 4.65 -6.6M-4.6 -4.7Q0 -3.7 4.6 -4.7" fill="none" stroke="#3a1a0c" stroke-width=".25"/>${ros}<path d="${ribs}" fill="none" stroke="#5a2a14" stroke-width=".18" stroke-opacity=".6"/>`;
  let knobs = ''; for (const [x, y] of [[-3.4, -2.6], [-1.2, -2.2], [1.2, -2.2], [3.3, -2.6], [-2.4, -8], [2.4, -8]]) knobs += `<circle cx="${x}" cy="${y}" r=".45" fill="#b8704a" stroke="#4a2414" stroke-width=".12"/><circle cx="${x - 0.12}" cy="${y - 0.14}" r=".14" fill="#f0c49a" fill-opacity=".7"/>`;
  if (state === 'shards') {
    let out = clay;
    const sh: [number, number, number, number][] = [[-5, -1.2, 4.2, -18], [1.5, -.9, 3.4, 24], [6.2, -1.4, 3.8, -4], [-1.6, -2.6, 2.4, 40]];
    for (const [x, y, w, r] of sh) {
      const h = w * 0.55, outer = `M${f(-w / 2)} 0Q0 ${f(-h * 1.6)} ${f(w / 2)} 0L${f(w * 0.36)} ${f(h * 0.12)}Q0 ${f(-h * 1.15)} ${f(-w * 0.4)} ${f(h * 0.15)}Z`;
      out += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="${outer}" fill="url(#${id}c)" stroke="#3a1a0c" stroke-width=".15"/><path d="M${f(-w * 0.4)} ${f(h * 0.15)}Q0 ${f(-h * 1.15)} ${f(w * 0.36)} ${f(h * 0.12)}" fill="none" stroke="#e8b48c" stroke-width=".3"/>` +
        `<path d="M${f(-w * 0.3)} ${f(-h * 0.55)}Q0 ${f(-h * 0.95)} ${f(w * 0.3)} ${f(-h * 0.55)}" fill="none" stroke="#3a1a0c" stroke-width=".18"/></g>`;
    }
    return out;
  }
  if (state === 'broken') {
    const J: P[] = [[-4.75, -6.4], ...jag([-4.75, -6.4], [4.75, -3.6], 6, 1.1, R), [4.75, -3.6]];
    const lower = `M-4.75 -6.4L${pts(J.slice(1)).replace(/ /g, 'L')}C5 -2.4 4.4 -.4 1.6 0L-1.6 0C-4.4 -.4 -5 -3.4 -4.75 -6.4Z`;
    const far: P[] = J.map(([x, y], i) => [x * 0.86, y - 1.6 - Math.sin((i / (J.length - 1)) * Math.PI) * 0.5]);
    return clay + `<path d="M${pts([...J, ...far.reverse()]).replace(/ /g, 'L')}Z" fill="url(#${id}i)"/>` +
      `<clipPath id="${id}k"><path d="${lower}"/></clipPath><g clip-path="url(#${id}k)"><path d="${body}" fill="url(#${id}c)"/>${band}${knobs}</g><path d="${lower}" fill="none" stroke="#3a1a0c" stroke-width=".2"/>` +
      `<polyline points="${pts(J)}" fill="none" stroke="#ecb890" stroke-width=".35"/>`;
  }
  const chip: P[] = [[1.6, -9.5], [3.5, -8.4], ...jag([3.5, -8.4], [1.3, -7.2], 3, 0.6, R), [1.3, -7.2]];
  return clay + `<path d="${body}" fill="url(#${id}c)" stroke="#3a1a0c" stroke-width=".2"/>${band}${knobs}` +
    `<path d="M-1.25 -10.2H1.25M-1.3 -9.8H1.3" stroke="#2a1a10" stroke-width=".28"/><ellipse cx="0" cy="-11" rx="1.7" ry=".55" fill="#7a3e22" stroke="#3a1a0c" stroke-width=".15"/>` +
    `<path d="M-.4 -11.2C-.9 -12.6 -.3 -13.6 .6 -14.2C.4 -13.2 1 -12.4 .6 -11.2Z" fill="#3a3028"/><path d="M-.1 -11.4C-.2 -12.4 .1 -13 .5 -13.6" stroke="#6a5a48" stroke-width=".18" fill="none"/>` +
    `<path d="M${pts(chip).replace(/ /g, 'L')}Z" fill="#1a0e08"/><polyline points="${pts(chip)}" fill="none" stroke="#e8b48c" stroke-width=".25"/>` +
    `<path d="M-3.6 -7.4L-2.6 -6.2L-3 -5L-2 -3.6L-2.4 -2.2" fill="none" stroke="#24100a" stroke-width=".22"/>`;
}
/** a brass boat compass lying tilted: the bowl, the rim, the card with its rose under cracked glass, silt inside */
function compass(id: string): string {
  let rose = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, l = i % 2 ? 1.9 : 3.1, w = 0.42, p = (r: number, b: number): P => [Math.sin(b) * r, -Math.cos(b) * r * 0.53];
    const t = p(l, a), s1 = p(w, a + Math.PI / 2), s2 = p(w, a - Math.PI / 2);
    rose += `<path d="M${f(s1[0])} ${f(s1[1] - 3.2)}L${f(t[0])} ${f(t[1] - 3.2)}L${f(s2[0])} ${f(s2[1] - 3.2)}Z" fill="${i % 2 ? '#8a7a5a' : i === 0 ? '#7a2a1a' : '#3a3428'}" fill-opacity=".8"/>`;
  }
  let ticks = ''; for (let i = 0; i < 32; i++) { const a = (i * Math.PI) / 16; ticks += `M${f(Math.sin(a) * 3.3)} ${f(-3.2 - Math.cos(a) * 1.75)}L${f(Math.sin(a) * 3.6)} ${f(-3.2 - Math.cos(a) * 1.9)}`; }
  return `<defs>${lin(id + 'b', [[0, '#e0bc72'], [0.35, '#a47c3a'], [1, '#3e2a10']], 0, 0, 1, 0)}${lin(id + 'r', [[0, '#f2d48a'], [1, '#7a5a26']], 0, 0, 1, 1)}</defs>` +
    `<path d="M-4.5 -3.2L-4.1 -1.1A4.1 1.1 0 0 0 4.1 -1.1L4.5 -3.2Z" fill="url(#${id}b)" stroke="#2e1e08" stroke-width=".18"/>` +
    `<path d="M-4.3 -2.2A4.3 1.1 0 0 0 4.3 -2.2" fill="none" stroke="#f0d08a" stroke-width=".22" stroke-opacity=".6"/>` +
    `<ellipse cx="0" cy="-3.2" rx="4.5" ry="2.4" fill="url(#${id}r)" stroke="#2e1e08" stroke-width=".18"/><ellipse cx="0" cy="-3.2" rx="3.75" ry="1.98" fill="#cfc3a2" stroke="#4a3412" stroke-width=".2"/>` +
    `<path d="${ticks}" stroke="#4a3e2a" stroke-width=".1"/>${rose}<path d="M-2.4 -2.4L.3 -3.5L2.6 -3.9L-.2 -2.9Z" fill="#1e1a14"/><circle cx="0" cy="-3.2" r=".28" fill="#a47c3a"/>` +
    `<path d="M-3.4 -2.6C-1.8 -1.3 1.8 -1.2 3.5 -2.4C2 -1.7 -1.6 -1.6 -3.4 -2.6Z" fill="#b8a888" fill-opacity=".9"/>` +
    `<path d="M1 -3.6L-1.6 -4.9M1 -3.6L3.1 -4.4M1 -3.6L.2 -1.6M1 -3.6L2.9 -2.4" stroke="#ffffff" stroke-width=".14" stroke-opacity=".7"/>` +
    `<path d="M-3 -4.2C-1.8 -4.9 -.4 -5 .6 -4.9" fill="none" stroke="#ffffff" stroke-width=".35" stroke-opacity=".45"/>` +
    `<circle cx="-4.65" cy="-3.1" r=".45" fill="#8a6428" stroke="#2e1e08" stroke-width=".12"/><circle cx="4.65" cy="-3.1" r=".45" fill="#5a4018" stroke="#2e1e08" stroke-width=".12"/>`;
}
/** a leather map case (a long tube): brass end cap and bands, a stitched seam, the far end open with the map rolled in it */
function mapCase(id: string): string {
  return `<defs>${lin(id + 'l', [[0, '#9a6a3e'], [0.3, '#6e4422'], [0.8, '#3a2210'], [1, '#22140a']])}${lin(id + 'b', [[0, '#e8c47a'], [0.35, '#a47c3a'], [1, '#3e2a10']])}${lin(id + 'p', [[0, '#efe2bc'], [0.5, '#cbb88a'], [1, '#7a6a4a']])}</defs>` +
    `<rect x="-10.6" y="-4.6" width="21.2" height="4.6" fill="url(#${id}l)"/><path d="M-10 -3.7H10" stroke="#c49a6a" stroke-width=".35" stroke-opacity=".6"/>` +
    `<path d="M-10 -1.1H10" stroke="#d8b88a" stroke-width=".16" stroke-dasharray=".5 .4" stroke-opacity=".7"/>` +
    `<rect x="12.2" y="-3.9" width="2.6" height="3.2" fill="url(#${id}p)"/><ellipse cx="14.8" cy="-2.3" rx=".5" ry="1.6" fill="#d8c8a0" stroke="#6a5a3a" stroke-width=".12"/><path d="M14.8 -3.2C15.2 -3 15.2 -1.8 14.8 -1.6C14.5 -1.6 14.5 -2.6 14.85 -2.6" fill="none" stroke="#6a5a3a" stroke-width=".12"/>` +
    `<path d="M12.6 -3.8C13.4 -3.4 13.8 -2.6 14.4 -2.4" stroke="#8a2a1a" stroke-width=".3" fill="none"/>` +
    `<ellipse cx="10.6" cy="-2.3" rx=".8" ry="2.3" fill="#140a04" stroke="url(#${id}b)" stroke-width=".55"/>` +
    `<rect x="-6.4" y="-4.75" width="1" height="4.9" fill="url(#${id}b)"/><rect x="4.2" y="-4.75" width="1" height="4.9" fill="url(#${id}b)"/>` +
    `<rect x="-12.6" y="-4.75" width="2.2" height="4.9" fill="url(#${id}b)"/><ellipse cx="-12.6" cy="-2.3" rx=".75" ry="2.45" fill="#6a4a1c" stroke="#2e1e08" stroke-width=".15"/><circle cx="-12.7" cy="-2.3" r=".5" fill="#a47c3a"/>` +
    `<path d="M-1.8 -4.6C-1.8 -6 2 -6 2 -4.6" fill="none" stroke="#3a2210" stroke-width=".7"/>`;
}
/** a four-armed grappling hook: the shank with a ring, two arms in profile with barbed points, one towards the viewer
 *  and one behind; rope: a frayed stub of line bent to the ring */
function grapnel(id: string, rope: boolean): string {
  const arm = (e: number) => `<path d="M${f(e * 0.3)} -.9C${f(e * 3)} -.2 ${f(e * 5.3)} -2.2 ${f(e * 5.9)} -6.1" fill="none" stroke="#1a1816" stroke-width="1.35" stroke-linecap="round"/>` +
    `<path d="M${f(e * 0.3)} -.9C${f(e * 3)} -.2 ${f(e * 5.3)} -2.2 ${f(e * 5.9)} -6.1" fill="none" stroke="url(#${id}i)" stroke-width=".95" stroke-linecap="round"/>` +
    `<path d="M${f(e * 5.4)} -5.4L${f(e * 6.1)} -8L${f(e * 6.5)} -5.6Z" fill="#2a2826" stroke="#121110" stroke-width=".15"/><path d="M${f(e * 5.7)} -6.4L${f(e * 4.7)} -6.9L${f(e * 5.6)} -5.6Z" fill="#2a2826"/>`;
  let r = '';
  if (rope) {
    const d = 'M.9 -15.8C3.4 -18.6 6.6 -17.6 7.8 -15C8.8 -12.8 8.2 -10.4 9.6 -8.8';
    r = `<path d="${d}" fill="none" stroke="#3a2c18" stroke-width="1.25" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#8a7248" stroke-width=".85"/><path d="${d}" fill="none" stroke="#4a3a22" stroke-width=".85" stroke-dasharray=".35 .55"/>` +
      `<path d="M9.6 -8.8l.4 1.8M9.6 -8.8l1.1 1.2M9.6 -8.8l-.4 1.6M9.6 -8.8l.9 2.1" stroke="#8a7248" stroke-width=".2" fill="none"/>`;
  }
  return `<defs>${lin(id + 'i', [[0, '#7a7872'], [0.45, '#3a3836'], [1, '#141312']], 0, 0, 1, 0)}</defs>` +
    `<path d="M0 -1C.2 -2.6 .4 -3.6 .7 -4.6" fill="none" stroke="#141312" stroke-width=".9" stroke-linecap="round"/>` + arm(-1) + arm(1) +
    `<path d="M-.55 -.8L-.42 -13.6H.42L.55 -.8Z" fill="url(#${id}i)" stroke="#121110" stroke-width=".18"/>` +
    `<ellipse cx="0" cy="-14.9" rx="1.45" ry="1.65" fill="none" stroke="#141312" stroke-width=".85"/><ellipse cx="0" cy="-14.9" rx="1.45" ry="1.65" fill="none" stroke="#5a5854" stroke-width=".4" stroke-dasharray="2 1.2"/>` +
    `<circle cx="0" cy="-.7" r="1.05" fill="url(#${id}i)" stroke="#121110" stroke-width=".18"/>` +
    `<path d="M.2 -.3C.7 .8 1.4 1.1 1.9 .1" fill="none" stroke="#1a1816" stroke-width="1.05" stroke-linecap="round"/><path d="M1.6 .4L2.3 -1L2.4 .5Z" fill="#2a2826"/>` + r;
}
/** a broken board, a heavy timber or a spar: weathered grey wood (or charred), grain, nails, worm holes, a splintered end */
function timber(id: string, R: () => number, o: { len: number; th: number; kind: 'plank' | 'beam' | 'spar'; charred: boolean }): string {
  const { len, th, kind, charred } = o, L0 = -len / 2, L1 = len / 2;
  const c = charred ? ['#5a524a', '#2a221c', '#0e0a08'] : ['#a89a7c', '#7a6c52', '#3e3426'];
  const end: P[] = [[L1, -th], ...jag([L1, -th], [L1 - 1.4, 0], 7, 2.2, R).map(([x, y]): P => [x + (R() - 0.3) * 2.4, y]), [L1 - 1.4, 0]];
  let shape = '', extra = '';
  if (kind === 'spar') {
    const r1 = th / 2, r2 = th * 0.4;
    shape = `M${L0} ${f(-r1 * 2)}L${f(L1)} ${f(-r1 - r2)}L${pts(end.map(([x, y]): P => [x, -r1 + (y + th / 2) * (r2 / r1)]).slice(1)).replace(/ /g, 'L')}L${L0} 0Z`;
    for (const t of [0.12, 0.42]) { const x = L0 + t * len; extra += `<rect x="${f(x)}" y="${f(-th - 0.05)}" width="1.1" height="${f(th + 0.1)}" fill="${charred ? '#1a1612' : '#3a2e24'}"/><path d="M${f(x + 0.2)} ${f(-th + 0.3)}V${f(-th * 0.5)}" stroke="${charred ? '#6a5040' : '#9a5a2a'}" stroke-width=".3"/>`; }
    extra += `<ellipse cx="${L0}" cy="${f(-r1)}" rx="${f(r1 * 0.35)}" ry="${f(r1)}" fill="${c[1]}" stroke="${c[2]}" stroke-width=".15"/>`;
  } else {
    shape = `M${L0} ${f(-th)}L${pts(end).replace(/ /g, 'L')}L${L0} 0Z`;
    if (kind === 'beam') extra += `<path d="M${L0} ${f(-th)}l1.6 -1.3L${f(L1 - 0.6)} ${f(-th - 1.3)}L${f(L1)} ${f(-th)}Z" fill="${mix(c[0], '#ffffff', 0.12)}"/><rect x="${f(L0 - 0.01)}" y="${f(-th)}" width="1.6" height="${f(th)}" fill="${c[1]}"/>` +
      `<path d="M${f(L0 + 0.8)} ${f(-th * 0.5)}m-.5 0a.5 ${f(th * 0.3)} 0 1 0 1 0a.5 ${f(th * 0.3)} 0 1 0 -1 0" fill="none" stroke="${c[2]}" stroke-width=".12"/>`;
    else extra += `<path d="M${L0} ${f(-th)}H${f(L1 - 1)}" stroke="${mix(c[0], '#ffffff', 0.25)}" stroke-width=".3"/><path d="M${L0} ${f(-th * 0.28)}H${f(L1 - 1.6)}" stroke="${c[2]}" stroke-width=".35" stroke-opacity=".6"/>`;
  }
  let grain = '';
  for (let i = 0; i < Math.round(th * 1.6); i++) { const y = -th * (0.15 + 0.75 * R()), x0 = L0 + R() * len * 0.3, x1 = L1 - R() * len * 0.3; grain += `M${f(x0)} ${f(y)}Q${f((x0 + x1) / 2)} ${f(y + (R() - 0.5) * 0.8)} ${f(x1)} ${f(y + (R() - 0.5) * 0.4)}`; }
  let marks = '';
  if (charred) { for (let i = 0; i < len * 0.8; i++) { const x = L0 + R() * len, y = -th * (0.1 + 0.8 * R()); marks += `<path d="M${f(x)} ${f(y)}l${f(0.6 + R())} ${f((R() - 0.5) * 0.4)}" stroke="${R() < 0.5 ? '#8a7c6a' : '#000000'}" stroke-width=".18" stroke-opacity=".7"/>`; } }
  else {
    for (let i = 0; i < Math.round(len / 9); i++) { const x = L0 + 2 + R() * (len - 6), y = -th * (0.3 + 0.4 * R()); marks += `<circle cx="${f(x)}" cy="${f(y)}" r=".32" fill="#3a2414"/><path d="M${f(x)} ${f(y + 0.3)}v${f(0.8 + R() * 1.2)}" stroke="#8a4a22" stroke-width=".3" stroke-opacity=".5"/>`; }
    for (let i = 0; i < Math.round(len / 4); i++) { const x = L0 + R() * len, y = -th * (0.15 + 0.7 * R()); marks += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.18 + R() * 0.3)}" ry=".14" fill="#1a120a" fill-opacity=".8"/>`; }
  }
  return `<defs>${lin(id + 'w', [[0, c[0]], [0.55, c[1]], [1, c[2]]])}</defs><path d="${shape}" fill="url(#${id}w)" stroke="${c[2]}" stroke-width=".2"/>${extra}` +
    `<path d="${grain}" fill="none" stroke="${c[2]}" stroke-width=".14" stroke-opacity=".55"/>${marks}` +
    `<polyline points="${pts(end)}" fill="none" stroke="${charred ? '#7a6a58' : '#d8c8a2'}" stroke-width=".25"/>`;
}
/** the staves of a burst keg: curved slats splayed on the sand and a rusted hoop */
function staves(id: string, R: () => number): string {
  let out = `<defs>${lin(id + 'w', [[0, '#5a4a36'], [0.6, '#3a2c1e'], [1, '#1a120a']])}</defs>`;
  const st: [number, number, number, number][] = [[-7, -1.4, 11, -14], [-1, -.9, 12, 6], [5.6, -1.6, 10, 22], [1, -3.2, 9, -30]];
  for (const [x, y, l, r] of st) out += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M${f(-l / 2)} 0Q0 -1.6 ${f(l / 2)} 0L${f(l / 2 - 0.2)} -1.4Q0 -3 ${f(-l / 2 + 0.2)} -1.4Z" fill="url(#${id}w)" stroke="#120c06" stroke-width=".15"/><path d="M${f(-l / 2 + 0.6)} -.9Q0 -2.3 ${f(l / 2 - 0.6)} -.9" fill="none" stroke="#7a6a52" stroke-width=".15" stroke-opacity=".6"/></g>`;
  void R;
  return out + `<ellipse cx="1" cy="-2.6" rx="6.4" ry="2.2" fill="none" stroke="#1a1410" stroke-width=".9" transform="rotate(-8 1 -2.6)"/><ellipse cx="1" cy="-2.6" rx="6.4" ry="2.2" fill="none" stroke="#6a3a1c" stroke-width=".45" stroke-dasharray="3 1.4" transform="rotate(-8 1 -2.6)"/>`;
}

// ---- the kinds ----
export const PROP_DEFS: Record<PropKind, PropDef> = {
  anchor: { mat: 'iron', draw: (e, o) => e.K.anchor(e.u, e.L, { ...o, contact: false }) },
  cannon: { mat: 'iron', draw: (e, o) => e.K.cannon(e.u, e.L, { ...o, carriage: false, contact: false }) },
  shot: { mat: 'iron', draw: (e, o) => e.K.shot(e.u, e.L, { ...o, contact: false }) },
  bottle: { mat: 'glass', draw: (e, o) => e.K.bottle(e.u, e.L, { ...o, lying: o.opt.lying !== false, kind: o.opt.kind ?? 'rum', contact: false }) },
  pistol: { mat: 'iron', draw: (e, o) => e.K.pistol(e.u, e.L, { ...o, contact: false }) },
  sabre: { mat: 'iron', draw: (e, o) => e.K.sabre(e.u, e.L, { ...o, contact: false }) },
  barrel: { mat: 'wood', draw: (e, o) => e.K.barrel(e.u, e.L, { ...o, kind: o.opt.kind ?? 'powder', lying: o.opt.lying !== false, contact: false }) },
  chest: { mat: 'wood', draw: (e, o) => e.K.chest(e.u, e.L, { ...o, open: o.opt.open ?? 0.85, gold: o.opt.gold ?? true, contact: false }) },
  crate: { mat: 'wood', draw: (e, o) => e.K.crate(e.u, e.L, { ...o, contact: false }) },
  rock: { mat: 'stone', draw: (e, o) => e.K.rock(e.u, e.L, { ...o, w: 24, h: 15, foam: false, contact: false }) },
  coins: { mat: 'gold', draw: (e, o) => e.K.coins(e.u, e.L, { ...o, n: o.opt.n ?? 7, contact: false }) },
  bell: { mat: 'brass', draw: (e, o) => e.K.bell(e.u, e.L, { ...o, frame: false, contact: false }) },
  /** opt.pts — the chain's path relative to (x, y), in mm */
  chain: { mat: 'iron', draw: (e, o) => e.K.chain(e.u, e.L, ((o.opt.pts as P[]) ?? [[-12, 0], [12, 0]]).map(([x, y]): P => [o.x + x * o.s, o.y + y * o.s]), { link: 4.4 * o.s, seed: o.seed }) },
  skull: { mat: 'bone', draw: (e, o) => own(o, skull(e.u + 'sk', rng(o.seed))) },
  /** opt.state: 'cracked' | 'broken' | 'shards' */
  firePot: { mat: 'clay', draw: (e, o) => own(o, firePot(e.u + 'fp', rng(o.seed), String(o.opt.state ?? 'cracked'))) },
  compass: { mat: 'brass', draw: (e, o) => own(o, compass(e.u + 'cp')) },
  mapCase: { mat: 'leather', draw: (e, o) => own(o, mapCase(e.u + 'mc')) },
  /** opt.rope: a frayed stub of line on the ring */
  grapnel: { mat: 'iron', draw: (e, o) => own(o, grapnel(e.u + 'gr', !!o.opt.rope)) },
  /** opt.len, opt.charred */
  plank: { mat: 'wood', draw: (e, o) => own(o, timber(e.u + 'pl', rng(o.seed), { len: Number(o.opt.len ?? 30), th: 2.6, kind: 'plank', charred: !!o.opt.charred })) },
  beam: { mat: 'char', draw: (e, o) => own(o, timber(e.u + 'bm', rng(o.seed), { len: Number(o.opt.len ?? 34), th: 4.2, kind: 'beam', charred: o.opt.charred !== false })) },
  spar: { mat: 'wood', draw: (e, o) => own(o, timber(e.u + 'sp', rng(o.seed), { len: Number(o.opt.len ?? 50), th: Number(o.opt.th ?? 3.4), kind: 'spar', charred: !!o.opt.charred })) },
  staves: { mat: 'wood', draw: (e, o) => own(o, staves(e.u + 'st', rng(o.seed))) }
};
const matOf = (s: PropSpec): AgeMat => (s.opt?.charred ? 'char' : PROP_DEFS[s.kind].mat);

// ---- measuring: which cells of the sheet each drawing covers ----
export const CELL = 0.2;
export interface Occ { x0: number; y0: number; w: number; h: number; a: Uint8Array }
/** rasterises each drawing (scene mm) in the browser at 1 / CELL px per mm; a cell is covered when its alpha > 40 % */
export async function measureProps(page: Page, svgs: string[]): Promise<Occ[]> {
  await page.setContent(`<!doctype html><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" width="297" height="210">${svgs.map((s, i) => `<g id="q${i}">${s}</g>`).join('')}</svg>`);
  const got = await page.evaluate(async ({ n, k }: { n: number; k: number }) => {
    const out: { x0: number; y0: number; w: number; h: number; bits: string }[] = [];
    for (let i = 0; i < n; i++) {
      const g = document.getElementById('q' + i) as unknown as SVGGraphicsElement, b = g.getBBox();
      const x0 = Math.floor(b.x - 2), y0 = Math.floor(b.y - 2), W = Math.ceil(b.width + 4), H = Math.ceil(b.height + 4), w = Math.round(W * k), h = Math.round(H * k);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${x0} ${y0} ${W} ${H}" width="${w}" height="${h}">${g.innerHTML}</svg>`;
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
      const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d')!; cx.drawImage(img, 0, 0, w, h);
      const d = cx.getImageData(0, 0, w, h).data; let bits = '';
      for (let j = 0; j < w * h; j++) bits += d[j * 4 + 3] > 102 ? '1' : '0';
      out.push({ x0, y0, w, h, bits });
    }
    return out;
  }, { n: svgs.length, k: 1 / CELL });
  return got.map(o => ({ x0: o.x0, y0: o.y0, w: o.w, h: o.h, a: Uint8Array.from(o.bits, ch => (ch === '1' ? 1 : 0)) }));
}
const tight = (o: Occ): Box => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) if (o.a[j * o.w + i]) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  return { x0: o.x0 + x0 * CELL, y0: o.y0 + y0 * CELL, x1: o.x0 + (x1 + 1) * CELL, y1: o.y0 + (y1 + 1) * CELL };
};

// ---- placing: the thing in the sand ----
export interface Placed {
  spec: PropSpec; i: number; mat: AgeMat; dx: number; dy: number; occ: Occ; box: Box;
  /** the sand line (y) and where the thing enters it (x from … to) */
  ys: number; xa: number; xb: number;
  /** the top of the sand at x near the thing (the drifts against its sides), and the mound's extent */
  sand(x: number): number; m0: number; m1: number; mBottom: number;
  /** the dark crevice and the cast shadow at its base */
  shadow: { cx: number; cy: number; rx: number; ry: number };
  /** the upper outline of the thing (x, y) every cell */
  top: P[]; seed: number;
}
export function placeProp(spec: PropSpec, i: number, occ0: Occ, seed: number): Placed {
  const b0 = tight(occ0), h = b0.y1 - b0.y0, w = b0.x1 - b0.x0, sink = spec.sink ?? 0.25;
  const dx = spec.x - (b0.x0 + b0.x1) / 2, dy = spec.y + sink * h - b0.y1, occ = { ...occ0, x0: occ0.x0 + dx, y0: occ0.y0 + dy };
  const box = { x0: b0.x0 + dx, y0: b0.y0 + dy, x1: b0.x1 + dx, y1: b0.y1 + dy }, ys = spec.y, R = rng(seed * 7 + 3);
  // where it enters the sand: the covered cells of the row at the sand line (the nearest covered row if it is thin there)
  let xa = Infinity, xb = -Infinity;
  for (let d = 0; d < 12 && xa === Infinity; d++) for (const jj of [Math.round((ys - occ.y0) / CELL) + d, Math.round((ys - occ.y0) / CELL) - d]) {
    if (jj < 0 || jj >= occ.h) continue;
    for (let ii = 0; ii < occ.w; ii++) if (occ.a[jj * occ.w + ii]) { const x = occ.x0 + ii * CELL; xa = Math.min(xa, x); xb = Math.max(xb, x + CELL); }
  }
  if (xa === Infinity) { xa = spec.x - 0.5; xb = spec.x + 0.5; }
  const size = Math.max(1, Math.min(h, w * 0.7)), k = spec.heap ?? 1;
  const hl = Math.min(2.6, 0.5 + size * 0.14) * k, hr = hl * 0.62, wl = 2.2 + size * 0.55, wr = 1.6 + size * 0.4, cl = Math.min((xb - xa) * 0.3, 0.8 + size * 0.2), cr = cl * 0.7;
  const ph = R() * 6, lumps = Array.from({ length: 6 }, () => [R(), R() * 0.35] as P);
  const sand = (x: number) => {
    let y = ys + Math.sin(x * 1.3 + ph) * 0.12;
    if (x < xa) y -= hl * smooth((x - (xa - wl)) / wl);
    else if (x < xa + cl) y -= hl * (1 - smooth((x - xa) / cl)) * 0.9 + hl * 0.1;
    if (x > xb) y -= hr * smooth(((xb + wr) - x) / wr);
    else if (x > xb - cr) y -= hr * (1 - smooth((xb - x) / cr)) * 0.9 + hr * 0.1;
    if (x >= xa && x <= xb) for (const [t, a] of lumps) { const c = xa + t * (xb - xa); y -= a * Math.exp(-Math.pow((x - c) / 1.2, 2)); }
    return y;
  };
  const m0 = xa - wl - 0.5, m1 = xb + wr + 0.5, mBottom = Math.max(box.y1, ys) + 2.6;
  const sx = Math.max(xa, (xa + xb) / 2), sx1 = xb + Math.min(8, 0.3 * h + 1.2), ry = Math.max(0.5, Math.min(1.8, 0.1 * h + 0.3));
  const shadow = { cx: (sx + sx1) / 2, cy: ys + ry - 0.1, rx: (sx1 - sx) / 2, ry };
  const top: P[] = [];
  for (let ii = 0; ii < occ.w; ii++) for (let jj = 0; jj < occ.h; jj++) if (occ.a[jj * occ.w + ii]) { const x = occ.x0 + (ii + 0.5) * CELL, y = occ.y0 + jj * CELL; if (y < sand(x) - 0.3) top.push([x, y]); break; }
  return { spec, i, mat: matOf(spec), dx, dy, occ, box, ys, xa, xb, sand, m0, m1, mBottom, shadow, top, seed };
}

// ---- drawing: the thing, its age, the sand over it, the shade at its base ----
export interface FloorPaint {
  /** the floor's fill (the same gradient as the floor: the sand over a thing is the floor itself), the id of the group
   *  with the near floor's ripples and caustics, the colours of the sand, the water's haze, the weed */
  floor: string; ripples: string; sand: [string, string, string]; haze: string; weed: string[]; glow: string;
  /** 0 at the far edge of the floor … 1 at the foot of the sheet */
  depth(y: number): number;
}
/** a barnacle: a little whitish volcano — an uneven dome, its slit-mouth at the top, lit at the upper left */
export const barnacle = (x: number, y: number, r: number) => `<path d="M${f(x - r)} ${f(y + r * 0.3)}C${f(x - r * 0.9)} ${f(y - r * 0.5)} ${f(x - r * 0.4)} ${f(y - r * 0.75)} ${f(x)} ${f(y - r * 0.72)}C${f(x + r * 0.5)} ${f(y - r * 0.7)} ${f(x + r)} ${f(y - r * 0.3)} ${f(x + r * 0.95)} ${f(y + r * 0.35)}Z" fill="#b8b2a0" stroke="#5a5446" stroke-width="${f(Math.max(0.05, r * 0.1))}" stroke-opacity=".7"/>` +
  `<path d="M${f(x - r * 0.3)} ${f(y - r * 0.5)}Q${f(x)} ${f(y - r * 0.35)} ${f(x + r * 0.3)} ${f(y - r * 0.52)}" fill="none" stroke="#3a362c" stroke-width="${f(r * 0.16)}" stroke-opacity=".75"/><path d="M${f(x - r * 0.7)} ${f(y)}Q${f(x - r * 0.6)} ${f(y - r * 0.5)} ${f(x - r * 0.25)} ${f(y - r * 0.62)}" fill="none" stroke="#ece6d4" stroke-width="${f(r * 0.18)}" stroke-opacity=".7"/>`;
/** a frond of weed growing from (x, y): a tapering ribbon swaying up, a lighter midrib */
function strand(x: number, y: number, h: number, c: string, R: () => number): string {
  const a = (R() - 0.5) * h * 0.5, b = (R() - 0.3) * h * 0.45, w = 0.28 + R() * 0.3, tip: P = [x + b, y - h];
  const m1: P = [x + a, y - h * 0.4], m2: P = [x - a * 0.5 + b * 0.8, y - h * 0.75];
  return `<path d="M${f(x - w)} ${f(y)}C${f(m1[0] - w)} ${f(m1[1])} ${f(m2[0] - w * 0.5)} ${f(m2[1])} ${f(tip[0])} ${f(tip[1])}C${f(m2[0] + w * 0.5)} ${f(m2[1])} ${f(m1[0] + w)} ${f(m1[1])} ${f(x + w)} ${f(y)}Z" fill="${c}" fill-opacity=".85"/>` +
    `<path d="M${f(x)} ${f(y)}C${f(m1[0])} ${f(m1[1])} ${f(m2[0])} ${f(m2[1])} ${f(tip[0])} ${f(tip[1])}" fill="none" stroke="${mix(c, '#ffffff', 0.3)}" stroke-width=".12" stroke-opacity=".6"/>`;
}
/** the SVG of one placed thing (in the scene, mm); body — its drawing at the nominal anchor */
export function propSvg(p: Placed, body: string, paint: FloorPaint): string {
  const id = `wp${p.i}`, b = p.box, R = rng(p.seed * 13 + 5), w = b.x1 - b.x0, h = b.y1 - b.y0, a = AGE[p.mat], k = paint.depth(p.ys), [sd0, sd1, sd2] = paint.sand;
  const pad = 1.5, bx = b.x0 - pad, by = b.y0 - pad, bw = w + 2 * pad, bh = h + 2 * pad;
  const out: string[] = [`<defs><g id="${id}">${p.dx || p.dy ? `<g transform="translate(${f(p.dx)} ${f(p.dy)})">${body}</g>` : body}</g>` +
    `<mask id="${id}m" maskUnits="userSpaceOnUse" x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}"><use href="#${id}" filter="url(#wWhite)"/></mask></defs>`, `<use href="#${id}"/>`];
  // its age, on its own pixels only
  let age = '';
  a.b.forEach(([, op], j) => { age += `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" filter="url(#wAge-${p.mat}${j})" opacity="${op}"/>`; });
  if (a.streak) for (const [x, y] of p.top.filter(() => R() < 0.06)) age += `<path d="M${f(x)} ${f(y + 0.3)}q${f((R() - 0.5) * 0.4)} ${f(1 + R() * 2)} ${f((R() - 0.5) * 0.3)} ${f(2 + R() * 3.5)}" stroke="${a.streak}" stroke-width="${f(0.25 + R() * 0.35)}" stroke-opacity=".45" fill="none" stroke-linecap="round"/>`;
  // silt on the upper outline (a soft light rim of fine sand), dust over the upper half
  if (p.top.length > 2) {
    let d = '', prev: P | null = null;
    for (const q of p.top) { d += (prev && Math.abs(q[1] - prev[1]) < 0.9 ? 'L' : 'M') + `${f(q[0])} ${f(q[1] + 0.35)}`; prev = q; }
    age += `<path d="${d}" fill="none" stroke="${mix(sd0, '#ffffff', 0.15)}" stroke-width="${f(Math.min(1.1, 0.45 + h * 0.03))}" stroke-opacity=".62" stroke-linejoin="round" filter="url(#wB02)"/>`;
    age += `<path d="${d}" fill="none" stroke="${sd1}" stroke-width="${f(Math.min(2.2, 0.9 + h * 0.06))}" stroke-opacity=".28" stroke-linejoin="round" transform="translate(0 .5)" filter="url(#wB05)"/>`;
  }
  for (let n = 0; n < w * h * 0.08; n++) { const x = b.x0 + R() * w, y = b.y0 + R() * h * 0.7; age += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.05 + R() * 0.07)}" fill="${sd1}" fill-opacity="${f(0.25 + R() * 0.3)}"/>`; }
  // barnacles in little clusters, more on the lower half; a crust of coralline here and there
  // (inside its outline: a cell and its neighbours covered; more of them low, near the sand, where the larvae settle)
  const cells: P[] = []; cellsOf(p.occ, (x, y) => { if (y < p.sand(x) - 0.4) cells.push([x, y]); });
  const inside = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].every(([u, v]) => occAt(p.occ, x + u, y + v));
  const nC = Math.round(Math.min(9, (w * h) / 45 + 1) * a.fouling);
  for (let n = 0; n < nC && cells.length; n++) {
    let c = cells[Math.floor(R() * cells.length)]; for (let t = 0; t < 2; t++) { const d = cells[Math.floor(R() * cells.length)]; if (d[1] > c[1]) c = d; }
    const r0 = (0.25 + R() * 0.3) * Math.min(1.3, 0.55 + h / 20), m = 2 + Math.floor(R() * 4);
    if (R() < 0.35 && inside(c[0], c[1], r0 * 2)) age += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r0 * 3)}" ry="${f(r0 * 1.6)}" fill="#c4a4a0" fill-opacity=".3"/>`;
    for (let j = 0; j < m; j++) { const x = c[0] + (R() - 0.5) * r0 * 5, y = c[1] + (R() - 0.5) * r0 * 3, r = r0 * (0.55 + R() * 0.6); if (inside(x, y, r * 0.9)) age += barnacle(x, y, r); }
  }
  // the water between: paler and bluer with distance, lit with the caustics
  age += `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" fill="${paint.haze}" opacity="${f(0.14 + (1 - k) * 0.32)}"/>`;
  age += `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" filter="url(#wCauN)" opacity=".28"/>`;
  out.push(`<g mask="url(#${id}m)">${age}</g>`);
  // the sand over its buried part: the floor's own paint, clipped to the mound; the drifts lit at their crests
  const top: P[] = []; for (let x = p.m0; x <= p.m1 + 0.01; x += 0.4) top.push([x, p.sand(x)]);
  const mound = `M${f(p.m0)} ${f(p.mBottom)}L${pts(top).replace(/ /g, 'L')}L${f(p.m1)} ${f(p.mBottom)}Z`;
  // (it fades out under the thing's lowest point, so its foot leaves no edge on the floor)
  const fy0 = Math.max(p.ys, b.y1) + 0.2;
  out.push(`<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${f(fy0)}" x2="0" y2="${f(p.mBottom)}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<mask id="${id}f" maskUnits="userSpaceOnUse" x="${f(p.m0 - 1)}" y="${f(b.y0 - 6)}" width="${f(p.m1 - p.m0 + 2)}" height="${f(p.mBottom - b.y0 + 8)}"><rect x="${f(p.m0 - 1)}" y="${f(b.y0 - 6)}" width="${f(p.m1 - p.m0 + 2)}" height="${f(p.mBottom - b.y0 + 8)}" fill="url(#${id}g)"/></mask></defs>` +
    `<clipPath id="${id}c"><path d="${mound}"/></clipPath><g mask="url(#${id}f)"><path d="${mound}" fill="${paint.floor}"/><g clip-path="url(#${id}c)"><use href="#${paint.ripples}"/></g></g>`);
  const crest = (from: number, to: number) => { const q = top.filter(([x]) => x >= from && x <= to); return q.length > 1 ? `M${pts(q).replace(/ /g, 'L')}` : ''; };
  out.push(`<path d="${crest(p.xa - (p.xa - p.m0) * 0.55, p.xa + 0.3) + crest(p.xb - 0.3, p.xb + (p.m1 - p.xb) * 0.45)}" fill="none" stroke="${mix(sd0, '#ffffff', 0.3)}" stroke-width=".32" stroke-opacity=".5" transform="translate(0 .2)" filter="url(#wB02)"/>`);
  // silt settled at its foot: the sand's colour rising a little up its side from the sand line
  out.push(`<g mask="url(#${id}m)"><path d="${crest(p.m0, p.m1)}" fill="none" stroke="${sd1}" stroke-width="${f(Math.min(2.4, 0.8 + h * 0.08))}" stroke-opacity=".45" filter="url(#wB05)"/></g>`);
  // the crevice where it goes in, and its shadow on the sand, falling right and down from its base
  out.push(`<path d="${crest(p.xa - 0.4, p.xb + 0.4)}" fill="none" stroke="#000" stroke-opacity=".42" stroke-width="${f(Math.min(1.1, 0.45 + h * 0.03))}" transform="translate(0 .3)" filter="url(#wB02)"/>`);
  const s = p.shadow;
  out.push(`<ellipse cx="${f(s.cx)}" cy="${f(s.cy)}" rx="${f(s.rx)}" ry="${f(s.ry)}" fill="#000" fill-opacity=".26" filter="url(#wB05)"/>`);
  // grains spilled on its foot
  let gr = ''; for (let n = 0; n < (p.xb - p.xa) * 2.2; n++) { const x = p.xa + R() * (p.xb - p.xa), y = p.sand(x) - R() * 0.9; gr += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.08 + R() * 0.14)}" fill="${R() < 0.5 ? sd0 : sd1}"/>`; }
  out.push(gr);
  // weed rooted on it
  if (a.fouling >= 0.5 && p.top.length > 4 && R() < 0.4) {
    let wd = ''; const nW = Math.min(3, Math.round(w / 14) + (R() < 0.4 ? 1 : 0));
    for (let n = 0; n < nW; n++) { const q = p.top[Math.floor(R() * p.top.length)]; const t = 1 + R() * 2; for (let j = 0; j < t; j++) wd += strand(q[0] + (R() - 0.5) * 1.2, q[1] + 0.4, 1.4 + R() * Math.min(5, 1 + h * 0.3), mix(paint.weed[(n + j) % paint.weed.length], paint.haze, 0.45), R); }
    out.push(wd);
  }
  void sd2;
  return out.join('');
}

// ---- the physics of one thing ----
function occAt(o: Occ, x: number, y: number): boolean { const i = Math.floor((x - o.x0) / CELL), j = Math.floor((y - o.y0) / CELL); return i >= 0 && j >= 0 && i < o.w && j < o.h && o.a[j * o.w + i] === 1; }
const cellsOf = (o: Occ, fn: (x: number, y: number) => void) => { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) if (o.a[j * o.w + i]) fn(o.x0 + (i + 0.5) * CELL, o.y0 + (j + 0.5) * CELL); };
/** the issues of the things on a floor: each lies IN the sand (part of it under the line, most above), the line where
 *  it enters lies on the open floor, its shadow starts at its base and falls right, no two overlap, none on the hull */
export function propIssues(ps: Placed[], floorTop: (x: number) => number, onHull: (p: P) => boolean, pageW: number): string[] {
  const out: string[] = [];
  const name = (p: Placed) => `${p.spec.name ?? p.spec.kind} at x ${Math.round(p.spec.x)}`;
  const vis: Set<string>[] = [];
  for (const p of ps) {
    let above = 0, under = 0, hull = 0; const seen = new Set<string>();
    cellsOf(p.occ, (x, y) => { if (y < p.sand(x)) { above++; seen.add(`${Math.round(x / 0.4)},${Math.round(y / 0.4)}`); if (onHull([x, y])) hull++; } else under++; });
    vis.push(seen);
    const all = above + under;
    if (under / all < 0.04) out.push(`${name(p)}: stands on the sand, not in it (${(100 * under / all).toFixed(1)} % under the sand line, need ≥ 4 %)`);
    if (above / all < 0.25) out.push(`${name(p)}: buried (only ${(100 * above / all).toFixed(1)} % above the sand, need ≥ 25 %)`);
    if (p.xb - p.xa < 0.6) out.push(`${name(p)}: does not meet the sand line`);
    let bad = 0; for (let x = p.xa; x <= p.xb; x += 0.5) if (p.ys < floorTop(x) + 0.4 || onHull([x, p.ys - 0.3])) bad++;
    if (bad > 1) out.push(`${name(p)}: its sand line (y ${p.ys.toFixed(1)}) is not on the open floor (on the hull or above the far edge)`);
    if (p.box.x0 < -2 || p.box.x1 > pageW + 2) out.push(`${name(p)}: off the sheet`);
    const s = p.shadow, cx = (p.xa + p.xb) / 2;
    if (Math.abs(s.cy - s.ry - p.ys) > 0.6) out.push(`${name(p)}: its shadow starts ${(s.cy - s.ry - p.ys).toFixed(1)} mm from its base`);
    if (s.cx <= cx) out.push(`${name(p)}: its shadow falls to the left (the light is from the left)`);
    if (s.rx < 0.5) out.push(`${name(p)}: no shadow at its base`);
    if (hull > 6) out.push(`${name(p)}: overlaps the hull`);
  }
  ps.forEach((a, i) => ps.slice(i + 1).forEach((b, jj) => {
    const B = vis[i + 1 + jj]; let n = 0; for (const c of vis[i]) if (B.has(c)) n++;
    if (n > 3) out.push(`${name(a)} and ${name(b)} overlap (${n} cells)`);
  }));
  return out;
}
