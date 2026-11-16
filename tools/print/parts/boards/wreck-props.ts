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
import { anchor2, bell2, board, button, canvas, carriage, chain2, gun, coCrate, coinSpill, conch, epaulette, grapnel3, ingots, keg, mastYard, onionBottle, pistol2, sabre2, shellBed, shotHeap, sidePiece, spyglass, wheel } from './wreck-things';

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
  iron: { b: [['#8a4a22', 0.48, 0.42], ['#2e241c', 0.38, 0.75]], streak: '#9a5426', fouling: 1 },
  brass: { b: [['#4f9078', 0.34, 0.5], ['#2c4a3a', 0.26, 0.9]], streak: '#4f8a70', fouling: 0.6 },
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
  'skull' | 'firePot' | 'compass' | 'mapCase' | 'grapnel' | 'plank' | 'beam' | 'spar' | 'staves' |
  'gun' | 'shotHeap' | 'carriage' | 'keg' | 'canvas' | 'coCrate' | 'ingots' | 'coinSpill' | 'spyglass' | 'epaulette' | 'button' | 'wheel' | 'mastYard' | 'conch' | 'shellBed' | 'board' | 'sidePiece';
/** a thing on the floor: (x, y) — the middle of it where it enters the sand (mm); sink — the share of its height under the
 *  sand; s — scale; rot — degrees (clockwise); heap — the drifts against its sides (1 — by its size); drift — a bank of
 *  sand drifted over one end of it (minus — the left end, plus — the right; |drift| — the share of its width it covers),
 *  driftH — the bank's height (a share of the thing's height, 0.5); stuck — it stands stuck in the sand by one end (a
 *  blade, a spar driven in): its foot need not lie along the sand; rests — it rests on points of itself (an anchor on its
 *  ring, stock and fluke, a grapnel on its hooks): it must touch the sand at two places at least, far apart; opt — the
 *  kind's own */
export interface PropSpec { kind: PropKind; x: number; y: number; s?: number; rot?: number; sink?: number; flip?: boolean; heap?: number; drift?: number; driftH?: number; stuck?: boolean; rests?: boolean; opt?: Record<string, unknown>; name?: string }
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
    // a big hole: the broken ends of two planks stove outwards over it, sticking out of the side
    if (r > 1.8) for (const [dy, a] of [[-0.45, -18 - R() * 14], [0.35, 12 + R() * 16]] as [number, number][]) {
      const y0 = y + dy * r, l = r * (1.5 + R() * 0.8), th = r * 0.32;
      out.push(`<g transform="rotate(${f(a)} ${f(x - r * 0.9)} ${f(y0)})"><path d="M${f(x - r * 0.9)} ${f(y0 - th / 2)}H${f(x - r * 0.9 + l)}L${f(x - r * 0.9 + l + th * 0.6)} ${f(y0 - th * 0.1)}L${f(x - r * 0.9 + l + 0.1)} ${f(y0 + th * 0.2)}L${f(x - r * 0.9 + l + th * 0.4)} ${f(y0 + th / 2)}H${f(x - r * 0.9)}Z" fill="${mix(raw, '#2a2420', 0.35)}" stroke="#0a0806" stroke-width=".12"/><path d="M${f(x - r * 0.9)} ${f(y0 - th * 0.15)}H${f(x - r * 0.9 + l)}" stroke="${raw}" stroke-width=".12"/></g>`);
    }
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
  // burnt through: a long ragged hole along the strakes (the fire ran along the planks), its edges eaten round and charred
  // — no splinters: a wide black rim cracked like alligator skin, grey-brown scale and ash where the fire stopped (long
  // cold: no glow), a halo of soot round it; inside the dark, the charred frames, silt settled in its lower lip
  const id = `hc${Math.round(x * 10)}${Math.round(y * 10)}`;
  const lobe = (rx: number, ry: number, n: number, k: number, ph: number): P[] => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, q = 1 + k * Math.sin(a * 3 + ph) + k * 0.6 * Math.sin(a * 5 + ph * 2) + (R() - 0.5) * k * 0.8; return [x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q]; });
  const round = (p: P[]) => { const m = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let d = `M${f(m(p[p.length - 1], p[0])[0])} ${f(m(p[p.length - 1], p[0])[1])}`; p.forEach((q, i) => { const e = m(q, p[(i + 1) % p.length]); d += `Q${f(q[0])} ${f(q[1])} ${f(e[0])} ${f(e[1])}`; }); return d + 'Z'; };
  const ph = R() * 6, soot = lobe(r * 3.1, r * 1.35, 24, 0.28, ph), scale = lobe(r * 2.5, r * 1.05, 24, 0.3, ph), rim = lobe(r * 2.2, r * 0.9, 24, 0.3, ph), core = lobe(r * 1.7, r * 0.6, 22, 0.36, ph + 0.7);
  out.push(`<path d="${round(soot)}" fill="#120e0c" fill-opacity=".5" filter="url(#wB05)"/><path d="${round(scale)}" fill="#6a6056" fill-opacity=".32" filter="url(#wB02)"/><path d="${round(rim)}" fill="#0e0a08"/>`);
  out.push(`<clipPath id="${id}r"><path d="${round(rim)}"/></clipPath><g clip-path="url(#${id}r)">${charSvg(x - r * 2.4, y - r, x + r * 2.4, y + r, R, 1.6)}</g>`);
  for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, d2 = 0.95 + R() * 0.3; out.push(`<circle cx="${f(x + Math.cos(a) * r * 2.3 * d2)}" cy="${f(y + Math.sin(a) * r * 0.95 * d2)}" r="${f(0.1 + R() * r * 0.09)}" fill="${R() < 0.5 ? '#7a7266' : '#3e3a34'}" fill-opacity="${f(0.35 + R() * 0.4)}"/>`); }
  // inside: the dark, one or two frames burnt to stubs of different heights
  let fr = ''; for (const t of [-0.55, 0.35].slice(0, 1 + Math.floor(R() * 2))) { const xx = x + t * r * 1.6, hh = r * (0.3 + R() * 0.5); fr += `<path d="M${f(xx)} ${f(y + r)}V${f(y + r * 0.6 - hh)}l${f(r * 0.12)} ${f(-r * 0.2)}l${f(r * 0.1)} ${f(r * 0.25)}V${f(y + r)}Z" fill="#1e140c"/><path d="M${f(xx + 0.05)} ${f(y + r)}V${f(y + r * 0.6 - hh)}" stroke="#5a4e44" stroke-width="${f(r * 0.05)}"/>`; }
  out.push(`<clipPath id="${id}"><path d="${round(core)}"/></clipPath><path d="${round(core)}" fill="#100e0c"/><g clip-path="url(#${id})">${fr}<ellipse cx="${f(x + r * 0.2)}" cy="${f(y + r * 0.75)}" rx="${f(r * 1.8)}" ry="${f(r * 0.45)}" fill="#7a6e5c" fill-opacity=".75"/><path d="M${f(x - r * 1.2)} ${f(y + r * 0.42)}Q${f(x)} ${f(y + r * 0.25)} ${f(x + r * 1.4)} ${f(y + r * 0.4)}" fill="none" stroke="#a89a80" stroke-width="${f(r * 0.06)}" stroke-opacity=".6"/></g>`);
  out.push(`<path d="${round(core)}" fill="none" stroke="#4a4038" stroke-width="${f(r * 0.05)}" stroke-opacity=".6"/>`);
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
    return clay + `<path d="M3.6 -.3C5.6 -1.2 8.6 -1 10.6 -.6C11.6 -.4 11.2 .2 9.6 .3C7.4 .5 5 .4 3.6 -.3Z" fill="#120c08" fill-opacity=".85"/><path d="M5 -.55Q7.4 -1 9.6 -.6" fill="none" stroke="#8a8478" stroke-width=".2" stroke-opacity=".55"/>` + `<path d="M${pts([...J, ...far.reverse()]).replace(/ /g, 'L')}Z" fill="url(#${id}i)"/>` +
      `<clipPath id="${id}k"><path d="${lower}"/></clipPath><g clip-path="url(#${id}k)"><path d="${body}" fill="url(#${id}c)"/>${band}${knobs}</g><path d="${lower}" fill="none" stroke="#3a1a0c" stroke-width=".2"/>` +
      `<polyline points="${pts(J)}" fill="none" stroke="#ecb890" stroke-width=".35"/>`;
  }
  if (state === 'sealed') {
    // whole, its mouth stopped with a cap of pitch, the cord tied round the neck, the wick of twisted rag hanging out
    const wick = 'M.3 -12.6C1.6 -13.6 3 -13.2 3.6 -11.6C4.1 -10.2 4.6 -9.2 5.6 -8.8';
    return clay + `<path d="${body}" fill="url(#${id}c)" stroke="#3a1a0c" stroke-width=".2"/>${band}${knobs}` +
      `<path d="M-1.6 -10.4Q0 -9.8 1.6 -10.4M-1.6 -9.9Q0 -9.3 1.6 -9.9" fill="none" stroke="#6a5a40" stroke-width=".42"/><path d="M1.5 -10.1l.9 1.4M1.6 -10l1.3 .9" stroke="#6a5a40" stroke-width=".3" stroke-linecap="round"/>` +
      `<path d="M-1.9 -11C-2 -12.4 -1.2 -13 0 -13C1.2 -13 2 -12.4 1.9 -11Z" fill="#1c1410" stroke="#0a0604" stroke-width=".18"/><path d="M-1.2 -12.4Q-.4 -12.9 .6 -12.7" fill="none" stroke="#6a5a4a" stroke-width=".2" stroke-opacity=".7"/>` +
      `<path d="${wick}" fill="none" stroke="#2a221a" stroke-width=".85" stroke-linecap="round"/><path d="${wick}" fill="none" stroke="#a89878" stroke-width=".5" stroke-dasharray=".4 .3"/><path d="M5.6 -8.8l.5 .6M5.6 -8.8l.7 -.1" stroke="#8a7a5a" stroke-width=".2"/>`;
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
    rose += `<path d="M${f(s1[0])} ${f(s1[1] - 3.2)}L${f(t[0])} ${f(t[1] - 3.2)}L${f(s2[0])} ${f(s2[1] - 3.2)}Z" fill="${i % 2 ? '#8a7a5a' : i === 0 ? '#5e3a2a' : '#3a3428'}" fill-opacity=".7"/>`;
  }
  let ticks = ''; for (let i = 0; i < 32; i++) { const a = (i * Math.PI) / 16; ticks += `M${f(Math.sin(a) * 3.3)} ${f(-3.2 - Math.cos(a) * 1.75)}L${f(Math.sin(a) * 3.6)} ${f(-3.2 - Math.cos(a) * 1.9)}`; }
  return `<defs>${lin(id + 'b', [[0, '#e0bc72'], [0.35, '#a47c3a'], [1, '#3e2a10']], 0, 0, 1, 0)}${lin(id + 'r', [[0, '#f2d48a'], [1, '#7a5a26']], 0, 0, 1, 1)}${lin(id + 'l', [[0, '#c8a056'], [0.5, '#8a6428'], [1, '#3e2a10']], 0, 0, 1, 1)}</defs>` +
    // the lid standing open behind, on its hinge at the back of the rim: its rim and the darker inside
    `<path d="M-.9 -5.3L-.9 -5.9H.9L.9 -5.3Z" fill="#5a4018" stroke="#2e1e08" stroke-width=".12"/><ellipse cx=".4" cy="-7.4" rx="4.3" ry="2.3" transform="rotate(-5 .4 -7.4)" fill="url(#${id}l)" stroke="#2e1e08" stroke-width=".2"/><ellipse cx=".45" cy="-7.35" rx="3.5" ry="1.7" transform="rotate(-5 .45 -7.35)" fill="#6a4c1c" stroke="#2e1e08" stroke-width=".15"/><path d="M-2.6 -8.8Q-.6 -9.7 1.8 -9.4" fill="none" stroke="#f0d08a" stroke-width=".25" stroke-opacity=".6"/>` +
    `<path d="M-4.5 -3.2L-4.1 -1.1A4.1 1.1 0 0 0 4.1 -1.1L4.5 -3.2Z" fill="url(#${id}b)" stroke="#2e1e08" stroke-width=".18"/>` +
    `<path d="M-4.3 -2.2A4.3 1.1 0 0 0 4.3 -2.2" fill="none" stroke="#f0d08a" stroke-width=".22" stroke-opacity=".6"/>` +
    `<ellipse cx="0" cy="-3.2" rx="4.5" ry="2.4" fill="url(#${id}r)" stroke="#2e1e08" stroke-width=".18"/><ellipse cx="0" cy="-3.2" rx="3.75" ry="1.98" fill="#cfc3a2" stroke="#4a3412" stroke-width=".2"/>` +
    `<path d="${ticks}" stroke="#4a3e2a" stroke-width=".1"/>${rose}<path d="M-2.4 -2.4L.3 -3.5L2.6 -3.9L-.2 -2.9Z" fill="#1e1a14"/><circle cx="0" cy="-3.2" r=".28" fill="#a47c3a"/>` +
    `<path d="M-3.4 -2.6C-1.8 -1.3 1.8 -1.2 3.5 -2.4C2 -1.7 -1.6 -1.6 -3.4 -2.6Z" fill="#b8a888" fill-opacity=".9"/>` +
    // the glass gone milky, a crust of growth in it, cracked through from a blow at the right
    `<ellipse cx="0" cy="-3.2" rx="3.75" ry="1.98" fill="#a8ae9c" fill-opacity=".14"/><ellipse cx="-1.4" cy="-3.6" rx="1.6" ry=".7" fill="#c4c8b6" fill-opacity=".35"/><ellipse cx="1.8" cy="-2.6" rx="1.2" ry=".5" fill="#5a6a48" fill-opacity=".35"/>` +
    `<path d="M2.2 -3.3L-.9 -4.8L-2.6 -4.6M2.2 -3.3L3.3 -4.6M2.2 -3.3L.6 -1.5M2.2 -3.3L3.4 -2.1M.4 -4.1L-.4 -2.6" fill="none" stroke="#f2f2ea" stroke-width=".13" stroke-opacity=".75"/><path d="M2.2 -3.3L-.9 -4.8M2.2 -3.3L.6 -1.5" fill="none" stroke="#1e2018" stroke-width=".1" stroke-opacity=".6" transform="translate(.12 .1)"/>` +
    `<circle cx="-4.65" cy="-3.1" r=".45" fill="#8a6428" stroke="#2e1e08" stroke-width=".12"/><circle cx="4.65" cy="-3.1" r=".45" fill="#5a4018" stroke="#2e1e08" stroke-width=".12"/>`;
}
/** a leather map case (a long tube, no glass anywhere): the leather stitched along its seam, two leather bands, a brass
 *  end cap; the other end open, its lid hanging by a leather hinge, the chart pushed half out — a roll of stained paper
 *  with its torn edge and the spiral of its end; the shoulder strap lying slack on the sand with its buckle */
function mapCase(id: string): string {
  return `<defs>${lin(id + 'l', [[0, '#9a6a3e'], [0.3, '#6e4422'], [0.8, '#3a2210'], [1, '#22140a']])}${lin(id + 'b', [[0, '#e8c47a'], [0.35, '#a47c3a'], [1, '#3e2a10']])}${lin(id + 'p', [[0, '#efe2bc'], [0.5, '#cbb88a'], [1, '#7a6a4a']])}</defs>` +
    // the strap: a slack leather band from one band to the other, looping down onto the sand, a brass buckle
    `<path d="M-6 -.6C-5 1.2 -1 .9 1.6 .5C3.4 .2 4.4 .5 4.9 -.6" fill="none" stroke="#2a180a" stroke-width="1.15"/><path d="M-6 -.6C-5 1.2 -1 .9 1.6 .5C3.4 .2 4.4 .5 4.9 -.6" fill="none" stroke="#7a5030" stroke-width=".7"/>` +
    `<rect x="-2.2" y="-.15" width="1.4" height="1.2" fill="none" stroke="url(#${id}b)" stroke-width=".35"/>` +
    `<rect x="-10.6" y="-5.4" width="21.2" height="5.4" rx=".6" fill="url(#${id}l)" stroke="#1e1006" stroke-width=".2"/><path d="M-10 -4.4H10" stroke="#c49a6a" stroke-width=".35" stroke-opacity=".55"/>` +
    `<path d="M-10 -1.3H10" stroke="#d8b88a" stroke-width=".16" stroke-dasharray=".5 .4" stroke-opacity=".7"/><path d="M-3 -5.2l1.6 2.1l-.4 2M3.6 -5.3l-.8 1.6" fill="none" stroke="#1e1006" stroke-width=".15" stroke-opacity=".7"/>` +
    // the chart pushed out of the open end: a rolled sheet, its loose outer leaf with a torn edge, the spiral at its end
    `<path d="M10.2 -4.6H15.6L16.1 -4L15.4 -3.3L16 -2.5L15.5 -1.6L15.8 -1H10.2Z" fill="url(#${id}p)" stroke="#6a5a3a" stroke-width=".14"/>` +
    `<path d="M11 -3.4C12.4 -3.1 13.4 -3.5 14.8 -3.2M11 -2.2C12.6 -2.4 13.6 -1.9 15 -2.1" fill="none" stroke="#7a5a3a" stroke-width=".14" stroke-opacity=".6"/>` +
    `<path d="M15.6 -4.6C17.4 -4.6 17.6 -1 15.8 -1C14.8 -1 14.8 -3.2 15.9 -3.2C16.5 -3.2 16.5 -2.2 16 -2.2" fill="#d8c8a0" stroke="#6a5a3a" stroke-width=".14"/>` +
    `<path d="M10.6 -5.4C10.9 -5.4 11 -.2 10.6 0" fill="none" stroke="#140a04" stroke-width=".45"/>` +
    // the lid: a leather cup hanging open by its hinge below the mouth
    `<path d="M10.4 -.5C11.6 .2 13 .1 13.6 -.4L13.2 -.9C12.6 -.4 11.4 -.4 10.6 -.9Z" fill="#5a3a20" stroke="#1e1006" stroke-width=".14"/><ellipse cx="12.6" cy="-.15" rx="1.6" ry=".42" fill="#3a2210" stroke="#1e1006" stroke-width=".12"/>` +
    `<rect x="-6.6" y="-5.55" width="1.3" height="5.7" fill="#3e2412" stroke="#1e1006" stroke-width=".12"/><rect x="4.3" y="-5.55" width="1.3" height="5.7" fill="#3e2412" stroke="#1e1006" stroke-width=".12"/>` +
    `<rect x="-12.4" y="-5.6" width="2" height="5.8" rx=".5" fill="url(#${id}b)" stroke="#2e1e08" stroke-width=".15"/><path d="M-12 -4.8V-.8" stroke="#f0d48a" stroke-width=".25" stroke-opacity=".5"/>`;
}
/** a broken board, a heavy timber or a spar: weathered grey wood (or charred), grain, nails, worm holes, a splintered end */
function timber(id: string, R: () => number, o: { len: number; th: number; kind: 'plank' | 'beam' | 'spar'; charred: boolean; rig?: boolean }): string {
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
  if (charred && kind === 'beam') marks += `<clipPath id="${id}k"><path d="${shape}"/></clipPath><g clip-path="url(#${id}k)">${charSvg(L0, -th, L1, 0, R, 1.6)}</g>`;
  let rig = '';
  if (o.rig && kind === 'spar') {
    // what is left of its rigging: the gammoning turns at the heel, a stay's eye and a few rope ends trailing on the sand
    rig += `<path d="M${f(L0 + 3)} ${f(-th - 0.2)}l1 ${f(th + 0.4)}M${f(L0 + 4)} ${f(-th - 0.2)}l1 ${f(th + 0.4)}M${f(L0 + 5)} ${f(-th - 0.2)}l1 ${f(th + 0.4)}" stroke="#3a3024" stroke-width=".5"/>`;
    rig += `<circle cx="${f(L1 - 7)}" cy="${f(-th - 0.6)}" r=".9" fill="none" stroke="#2a221a" stroke-width=".45"/><path d="M${f(L1 - 7)} ${f(-th + 0.2)}C${f(L1 - 5)} ${f(-th + 2)} ${f(L1 - 2)} ${f(0.2)} ${f(L1 + 3)} .1" fill="none" stroke="#3a3024" stroke-width=".45"/>`;
    rig += `<path d="M${f(L0 + 12)} ${f(-th * 0.5)}C${f(L0 + 13)} ${f(0.6)} ${f(L0 + 17)} .2 ${f(L0 + 20)} .1" fill="none" stroke="#3a3024" stroke-width=".4"/><path d="M${f(L0 + 20)} .1l.8 -.4M${f(L0 + 20)} .1l.9 .2" stroke="#5a4e3c" stroke-width=".18"/>`;
  }
  return `<defs>${lin(id + 'w', [[0, c[0]], [0.55, c[1]], [1, c[2]]])}</defs><path d="${shape}" fill="url(#${id}w)" stroke="${c[2]}" stroke-width=".2"/>${extra}` +
    `<path d="${grain}" fill="none" stroke="${c[2]}" stroke-width=".14" stroke-opacity=".55"/>${marks}` +
    `<polyline points="${pts(end)}" fill="none" stroke="${charred ? '#7a6a58' : '#d8c8a2'}" stroke-width=".25"/>${rig}`;
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
  anchor: { mat: 'iron', draw: (e, o) => own(o, anchor2(e.u + 'an')) },
  cannon: { mat: 'iron', draw: (e, o) => e.K.cannon(e.u, e.L, { ...o, carriage: false, contact: false }) },
  shot: { mat: 'iron', draw: (e, o) => e.K.shot(e.u, e.L, { ...o, contact: false }) },
  bottle: { mat: 'glass', draw: (e, o) => own(o, onionBottle(e.u + 'bo')) },
  pistol: { mat: 'iron', draw: (e, o) => own(o, pistol2(e.u + 'pi')) },
  sabre: { mat: 'iron', draw: (e, o) => own(o, sabre2(e.u + 'sa')) },
  barrel: { mat: 'wood', draw: (e, o) => e.K.barrel(e.u, e.L, { ...o, kind: o.opt.kind ?? 'powder', lying: o.opt.lying !== false, contact: false }) },
  chest: { mat: 'wood', draw: (e, o) => e.K.chest(e.u, e.L, { ...o, open: o.opt.open ?? 0.85, gold: o.opt.gold ?? true, contact: false }) },
  crate: { mat: 'wood', draw: (e, o) => e.K.crate(e.u, e.L, { ...o, contact: false }) },
  rock: { mat: 'stone', draw: (e, o) => e.K.rock(e.u, e.L, { ...o, w: 24, h: 15, foam: false, contact: false }) },
  coins: { mat: 'gold', draw: (e, o) => e.K.coins(e.u, e.L, { ...o, n: o.opt.n ?? 7, contact: false }) },
  bell: { mat: 'brass', draw: (e, o) => own(o, bell2(e.u + 'be')) },
  /** opt.pts — the chain's path relative to (x, y), in mm */
  chain: { mat: 'iron', draw: (e, o) => chain2(e.u + 'ch', ((o.opt.pts as P[]) ?? [[-12, 0], [12, 0]]).map(([x, y]): P => [o.x + x * o.s, o.y + y * o.s]), 4 * o.s) },
  skull: { mat: 'bone', draw: (e, o) => own(o, skull(e.u + 'sk', rng(o.seed))) },
  /** opt.state: 'cracked' | 'broken' | 'shards' */
  firePot: { mat: 'clay', draw: (e, o) => own(o, firePot(e.u + 'fp', rng(o.seed), String(o.opt.state ?? 'cracked'))) },
  compass: { mat: 'brass', draw: (e, o) => own(o, compass(e.u + 'cp')) },
  mapCase: { mat: 'leather', draw: (e, o) => own(o, mapCase(e.u + 'mc')) },
  /** opt.rope: a rotten stub of line on the eye */
  grapnel: { mat: 'iron', draw: (e, o) => own(o, grapnel3(e.u + 'gr', rng(o.seed))) },
  sidePiece: { mat: 'wood', draw: (e, o) => own(o, sidePiece(e.u + 'sp', rng(o.seed), String(o.opt.paint ?? '#8a3a2a'), String(o.opt.band ?? '#c8a050'))) },
  /** opt.len, opt.th, opt.charred */
  plank: { mat: 'wood', draw: (e, o) => own(o, timber(e.u + 'pl', rng(o.seed), { len: Number(o.opt.len ?? 30), th: Number(o.opt.th ?? 2.6), kind: 'plank', charred: !!o.opt.charred })) },
  beam: { mat: 'char', draw: (e, o) => own(o, timber(e.u + 'bm', rng(o.seed), { len: Number(o.opt.len ?? 34), th: 4.2, kind: 'beam', charred: o.opt.charred !== false })) },
  /** opt.len, opt.th, opt.charred, opt.rig — what is left of its rigging */
  spar: { mat: 'wood', draw: (e, o) => own(o, timber(e.u + 'sp', rng(o.seed), { len: Number(o.opt.len ?? 50), th: Number(o.opt.th ?? 3.4), kind: 'spar', charred: !!o.opt.charred, rig: !!o.opt.rig })) },
  staves: { mat: 'wood', draw: (e, o) => own(o, staves(e.u + 'st', rng(o.seed))) },
  /** opt.len: the barrel's length (46) */
  gun: { mat: 'iron', draw: (e, o) => own(o, gun(e.u + 'gn', rng(o.seed), Number(o.opt.len ?? 46))) },
  /** opt.n: 3…5 balls */
  shotHeap: { mat: 'iron', draw: (e, o) => own(o, shotHeap(e.u + 'sh', rng(o.seed), Number(o.opt.n ?? 4))) },
  carriage: { mat: 'wood', draw: (e, o) => own(o, carriage(e.u + 'ca', rng(o.seed))) },
  /** opt.kind: 'broken' | 'foreign' | 'whole' */
  keg: { mat: 'wood', draw: (e, o) => own(o, keg(e.u + 'kg', rng(o.seed), (o.opt.kind as 'broken') ?? 'whole')) },
  /** opt.color: the cloth */
  canvas: { mat: 'leather', draw: (e, o) => own(o, canvas(e.u + 'cv', rng(o.seed), String(o.opt.color ?? '#6a665a'))) },
  /** opt.state: 'whole' | 'burst'; opt.n: the bale number (7 or 2) */
  coCrate: { mat: 'wood', draw: (e, o) => own(o, coCrate(e.u + 'cc', rng(o.seed), (o.opt.state as 'whole') ?? 'whole', Number(o.opt.n ?? 7))) },
  ingots: { mat: 'gold', draw: (e, o) => own(o, ingots(e.u + 'ig', rng(o.seed), Number(o.opt.n ?? 3))) },
  coinSpill: { mat: 'gold', draw: (e, o) => own(o, coinSpill(e.u + 'cs', rng(o.seed), Number(o.opt.n ?? 10), Number(o.opt.w ?? 18))) },
  spyglass: { mat: 'brass', draw: (e, o) => own(o, spyglass(e.u + 'sg', rng(o.seed))) },
  epaulette: { mat: 'gold', draw: (e, o) => own(o, epaulette(e.u + 'ep', rng(o.seed))) },
  button: { mat: 'brass', draw: (e, o) => own(o, button(e.u + 'bt')) },
  wheel: { mat: 'wood', draw: (e, o) => own(o, wheel(e.u + 'wh', rng(o.seed))) },
  /** opt.sail: the colour of the rag on the yard */
  mastYard: { mat: 'wood', draw: (e, o) => own(o, mastYard(e.u + 'my', rng(o.seed), String(o.opt.sail ?? '#8a8670'))) },
  conch: { mat: 'bone', draw: (e, o) => own(o, conch(e.u + 'co')) },
  shellBed: { mat: 'wood', draw: (e, o) => own(o, shellBed(e.u + 'sb', rng(o.seed))) },
  /** opt.len, opt.th, opt.paint — the ghost of another ship's paint */
  board: { mat: 'wood', draw: (e, o) => own(o, board(e.u + 'bd', rng(o.seed), Number(o.opt.len ?? 30), Number(o.opt.th ?? 4.6), (o.opt.paint as string) ?? null)) }
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
  const hl = Math.min(1.5, 0.35 + size * 0.08) * k, hr = hl * 0.7, wl = 1.4 + size * 0.3, wr = 1.1 + size * 0.24, cl = Math.min((xb - xa) * 0.3, 0.8 + size * 0.2), cr = cl * 0.7;
  const ph = R() * 6, lumps = Array.from({ length: 5 }, () => [R(), R() * 0.25] as P);
  const dr = spec.drift ?? 0, dw = Math.abs(dr) * w, dH = Math.min(3, (spec.driftH ?? 0.35) * (ys - box.y0));
  const sand = (x: number) => {
    let y = ys + Math.sin(x * 1.3 + ph) * 0.12;
    if (x < xa) y -= hl * smooth((x - (xa - wl)) / wl);
    else if (x < xa + cl) y -= hl * (1 - smooth((x - xa) / cl)) * 0.9 + hl * 0.1;
    if (x > xb) y -= hr * smooth(((xb + wr) - x) / wr);
    else if (x > xb - cr) y -= hr * (1 - smooth((xb - x) / cr)) * 0.9 + hr * 0.1;
    if (x >= xa && x <= xb) for (const [t, a] of lumps) { const c = xa + t * (xb - xa); y -= a * Math.exp(-Math.pow((x - c) / 1.8, 2)); }
    if (dr) {
      // the bank over one end: full height over the covered share, a soft fall towards the middle and outwards
      const e = dr > 0 ? box.x1 : box.x0, inn = dr > 0 ? -1 : 1, u = (x - e) * inn;   // u: mm from the end inwards
      const k2 = u < 0 ? smooth(1 + u / (dH * 2.2 + 2)) : u < dw ? 1 - 0.25 * smooth(u / dw) : 0.75 * (1 - smooth((u - dw) / (dw * 0.6 + 1.5)));
      y -= dH * k2 * (0.92 + 0.08 * Math.sin(x * 2.1 + ph));
    }
    return y;
  };
  const m0 = Math.min(xa - wl, dr < 0 ? box.x0 - dH * 2.2 - 2 : Infinity) - 0.5, m1 = Math.max(xb + wr, dr > 0 ? box.x1 + dH * 2.2 + 2 : -Infinity) + 0.5, mBottom = Math.max(box.y1, ys) + 2.6;
  const sx = Math.max((xa + xb) / 2, xb - Math.min(2, 0.2 * (xb - xa))), sx1 = xb + Math.min(3.5, 0.14 * h + 0.9), ry = Math.max(0.5, Math.min(0.8, 0.04 * h + 0.35));
  const shadow = { cx: (sx + sx1) / 2, cy: ys + ry - 0.1, rx: (sx1 - sx) / 2, ry };
  const top: P[] = [];
  for (let ii = 0; ii < occ.w; ii++) for (let jj = 0; jj < occ.h; jj++) if (occ.a[jj * occ.w + ii]) { const x = occ.x0 + (ii + 0.5) * CELL, y = occ.y0 + jj * CELL; if (y < sand(x) - 0.3) top.push([x, y]); break; }
  return { spec, i, mat: matOf(spec), dx, dy, occ, box, ys, xa, xb, sand, m0, m1, mBottom, shadow, top, seed };
}

// ---- drawing: the thing, its age, the sand over it, the shade at its base ----
export interface FloorPaint {
  /** the floor's fill (the same gradient as the floor: the sand over a thing is the floor itself), the id of the group
   *  with the near floor's ripples and caustics, the colours of the sand, the water's haze, the weed */
  floor: string; ripples: string; sand: [string, string, string]; haze: string; weed: string[]; glow: string; coral?: string[];
  /** 0 at the far edge of the floor … 1 at the foot of the sheet */
  depth(y: number): number;
}
/** a barnacle: a little whitish volcano — an uneven dome, its slit-mouth at the top, lit at the upper left */
export const barnacle = (x: number, y: number, r: number) => `<path d="M${f(x - r)} ${f(y + r * 0.3)}C${f(x - r * 0.9)} ${f(y - r * 0.5)} ${f(x - r * 0.4)} ${f(y - r * 0.75)} ${f(x)} ${f(y - r * 0.72)}C${f(x + r * 0.5)} ${f(y - r * 0.7)} ${f(x + r)} ${f(y - r * 0.3)} ${f(x + r * 0.95)} ${f(y + r * 0.35)}Z" fill="#8e897a" stroke="#4a463a" stroke-width="${f(Math.max(0.05, r * 0.1))}" stroke-opacity=".6"/>` +
  `<path d="M${f(x - r * 0.3)} ${f(y - r * 0.5)}Q${f(x)} ${f(y - r * 0.35)} ${f(x + r * 0.3)} ${f(y - r * 0.52)}" fill="none" stroke="#3a362c" stroke-width="${f(r * 0.16)}" stroke-opacity=".75"/><path d="M${f(x - r * 0.7)} ${f(y)}Q${f(x - r * 0.6)} ${f(y - r * 0.5)} ${f(x - r * 0.25)} ${f(y - r * 0.62)}" fill="none" stroke="#c8c2b0" stroke-width="${f(r * 0.16)}" stroke-opacity=".45"/>`;
/** the current runs to the right: everything that grows on the floor leans and streams that way */
export const CURRENT = 1;
/** a frond of weed growing from (x, y): a tapering ribbon bent over by the current, a lighter midrib */
function strand(x: number, y: number, h: number, c: string, R: () => number): string {
  const a = (R() - 0.3) * h * 0.25, b = CURRENT * (0.25 + R() * 0.4) * h * 0.7, w = 0.28 + R() * 0.3, tip: P = [x + b, y - h * (0.75 + R() * 0.2)];
  const m1: P = [x + a, y - h * 0.45], m2: P = [x + b * 0.6, y - h * 0.8];
  return `<path d="M${f(x - w)} ${f(y)}C${f(m1[0] - w)} ${f(m1[1])} ${f(m2[0] - w * 0.5)} ${f(m2[1])} ${f(tip[0])} ${f(tip[1])}C${f(m2[0] + w * 0.5)} ${f(m2[1] + w)} ${f(m1[0] + w)} ${f(m1[1])} ${f(x + w)} ${f(y)}Z" fill="${c}" fill-opacity=".85"/>` +
    `<path d="M${f(x)} ${f(y)}C${f(m1[0])} ${f(m1[1])} ${f(m2[0])} ${f(m2[1])} ${f(tip[0])} ${f(tip[1])}" fill="none" stroke="${mix(c, '#ffffff', 0.3)}" stroke-width=".12" stroke-opacity=".6"/>`;
}
/** the kinds of weed (all lean with the current): 'ribbon' — a few long tapering fronds; 'grass' — a tuft of fine
 *  blades; 'bush' — a branching stalk with small leaves and air bladders; 'lettuce' — a low ruffled leafy clump */
export type WeedKind = 'ribbon' | 'grass' | 'bush' | 'lettuce';
export function weed(kind: WeedKind, x: number, y: number, h: number, c: string, R: () => number): string {
  const dark = mix(c, '#000000', 0.35), light = mix(c, '#ffffff', 0.28);
  if (kind === 'ribbon') { let o = ''; const n = 2 + Math.floor(R() * 2); for (let i = 0; i < n; i++) o += strand(x + (R() - 0.5) * 1.6, y, h * (0.6 + R() * 0.45), i % 2 ? c : dark, R); return o; }
  if (kind === 'grass') {
    let o = ''; const n = 5 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++) {
      const x0 = x + (R() - 0.5) * 2.2, l = h * (0.45 + R() * 0.6), bend = CURRENT * l * (0.2 + R() * 0.45);
      o += `<path d="M${f(x0)} ${f(y)}Q${f(x0 + bend * 0.2)} ${f(y - l * 0.6)} ${f(x0 + bend)} ${f(y - l * (0.85 + R() * 0.1))}" fill="none" stroke="${R() < 0.5 ? c : light}" stroke-width="${f(0.22 + R() * 0.18)}" stroke-linecap="round" stroke-opacity=".9"/>`;
    }
    return o;
  }
  if (kind === 'bush') {
    let st = '', lv = '';
    const grow = (p: P, ang: number, len: number, d: number) => {
      const e: P = [p[0] + Math.sin(ang) * len, p[1] - Math.cos(ang) * len];
      st += `M${f(p[0])} ${f(p[1])}Q${f((p[0] + e[0]) / 2 + CURRENT * len * 0.15)} ${f((p[1] + e[1]) / 2)} ${f(e[0])} ${f(e[1])}`;
      for (let i = 0; i < 3; i++) { const t = 0.3 + i * 0.3, q: P = [p[0] + (e[0] - p[0]) * t, p[1] + (e[1] - p[1]) * t], sd = i % 2 ? 1 : -1;
        lv += `<ellipse cx="${f(q[0] + sd * 0.55 + CURRENT * 0.3)}" cy="${f(q[1])}" rx=".62" ry=".26" transform="rotate(${f(sd * 35 + CURRENT * 20)} ${f(q[0])} ${f(q[1])})" fill="${i % 2 ? c : light}"/>`;
        if (R() < 0.35) lv += `<circle cx="${f(q[0] - sd * 0.4)}" cy="${f(q[1] + 0.2)}" r=".28" fill="${mix(c, '#c8b060', 0.4)}"/>`; }
      if (d > 0) for (const s2 of [-1, 1]) grow(e, ang + s2 * (0.35 + R() * 0.3) + CURRENT * 0.15, len * (0.62 + R() * 0.2), d - 1);
    };
    grow([x, y], CURRENT * 0.2 + (R() - 0.5) * 0.2, h * 0.42, 2);
    return `<path d="${st}" fill="none" stroke="${dark}" stroke-width=".3" stroke-linecap="round"/>${lv}`;
  }
  // lettuce: three or four broad blades with wavy edges rising from one holdfast, bent over by the current
  let o = '';
  const n = 3 + Math.floor(R() * 2);
  for (let i = 0; i < n; i++) {
    const l = h * (0.55 + R() * 0.5), lean = CURRENT * (0.3 + R() * 0.5) + (i - (n - 1) / 2) * 0.35, wd = h * (0.16 + R() * 0.08), m = 7, L: P[] = [], Rt: P[] = [];
    for (let k = 0; k <= m; k++) { const t = k / m, cx = x + Math.sin(lean) * l * t + CURRENT * t * t * l * 0.25, cy = y - Math.cos(lean) * l * t * (1 - t * 0.15), ww = wd * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.08)) * (1 + (k % 2 ? 0.18 : -0.1));
      L.push([cx - ww * Math.cos(lean), cy - ww * Math.sin(lean)]); Rt.push([cx + ww * Math.cos(lean), cy + ww * Math.sin(lean)]); }
    const d = `M${pts([...L, ...Rt.reverse()]).replace(/ /g, 'L')}Z`;
    o += `<path d="${d}" fill="${i % 2 ? c : light}" fill-opacity=".85" stroke="${dark}" stroke-width=".12" stroke-linejoin="round"/><path d="M${f(x)} ${f(y)}Q${f(x + Math.sin(lean) * l * 0.5)} ${f(y - Math.cos(lean) * l * 0.55)} ${f(x + Math.sin(lean) * l * 0.92 + CURRENT * l * 0.2)} ${f(y - Math.cos(lean) * l * 0.85)}" fill="none" stroke="${dark}" stroke-width=".12" stroke-opacity=".6"/>`;
  }
  return o;
}
/** a small coral grown on a thing or the hull: a branching sprig (lit tips) or a crust with knobs, in muted colours */
export function coralSprig(x: number, y: number, h: number, c: string, R: () => number): string {
  const dark = mix(c, '#000000', 0.4), light = mix(c, '#ffffff', 0.3);
  let segs = '', tips = '';
  const grow = (p: P, a: number, len: number, w: number, d: number) => {
    const e: P = [p[0] + Math.sin(a) * len, p[1] - Math.cos(a) * len];
    segs += `<path d="M${f(p[0])} ${f(p[1])}L${f(e[0])} ${f(e[1])}" stroke="${dark}" stroke-width="${f(w + 0.25)}" stroke-linecap="round"/><path d="M${f(p[0])} ${f(p[1])}L${f(e[0])} ${f(e[1])}" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
    if (d <= 0) { tips += `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(w * 0.6)}" fill="${light}"/>`; return; }
    for (const s2 of [-1, 1]) grow(e, a + s2 * (0.4 + R() * 0.3), len * 0.68, w * 0.75, d - 1);
  };
  grow([x, y], (R() - 0.5) * 0.4, h * 0.38, Math.max(0.55, h * 0.17), 2);
  grow([x + 0.3, y], 0.7 + R() * 0.3, h * 0.3, Math.max(0.45, h * 0.13), 1);
  return segs + tips;
}
export const coralCrust = (x: number, y: number, r: number, c: string, R: () => number) => {
  let o = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.6)}" ry="${f(r * 0.75)}" fill="${c}" fill-opacity=".7"/>`;
  for (let i = 0; i < 5; i++) o += `<circle cx="${f(x + (R() - 0.5) * r * 2.4)}" cy="${f(y + (R() - 0.6) * r * 0.9)}" r="${f(r * (0.2 + R() * 0.2))}" fill="${mix(c, '#ffffff', 0.25)}" fill-opacity=".8"/>`;
  return o;
};
/** a sponge of a few tubes standing up from (x, y), their mouths open at the top */
export function tubeSponge(x: number, y: number, h: number, c: string, R: () => number): string {
  let o = ''; const n = 2 + Math.floor(R() * 3), dark = mix(c, '#000000', 0.45), light = mix(c, '#ffffff', 0.25);
  for (let i = 0; i < n; i++) {
    const l = h * (0.45 + R() * 0.55), r = h * (0.09 + R() * 0.05), x0 = x + (i - (n - 1) / 2) * r * 1.9 + (R() - 0.5) * r, lean = CURRENT * (R() - 0.2) * l * 0.18, tx = x0 + lean;
    o += `<path d="M${f(x0 - r)} ${f(y)}Q${f(x0 - r + lean * 0.4)} ${f(y - l * 0.6)} ${f(tx - r * 1.1)} ${f(y - l)}L${f(tx + r * 1.1)} ${f(y - l)}Q${f(x0 + r + lean * 0.4)} ${f(y - l * 0.6)} ${f(x0 + r)} ${f(y)}Z" fill="${c}" stroke="${dark}" stroke-width=".12"/>` +
      `<ellipse cx="${f(tx)}" cy="${f(y - l)}" rx="${f(r * 1.1)}" ry="${f(r * 0.42)}" fill="${dark}"/><path d="M${f(x0 - r * 0.5)} ${f(y - 0.2)}Q${f(x0 - r * 0.5 + lean * 0.4)} ${f(y - l * 0.6)} ${f(tx - r * 0.6)} ${f(y - l + 0.3)}" fill="none" stroke="${light}" stroke-width="${f(r * 0.35)}" stroke-opacity=".6"/>`;
  }
  return o;
}
/** an anemone: a short column, a crown of tentacles swaying with the current */
export function anemone(x: number, y: number, h: number, c: string, R: () => number): string {
  const dark = mix(c, '#000000', 0.4), light = mix(c, '#ffffff', 0.35), cw = h * 0.22, top = y - h * 0.35;
  let o = `<path d="M${f(x - cw)} ${f(y)}C${f(x - cw * 1.1)} ${f(top + h * 0.1)} ${f(x - cw * 1.3)} ${f(top)} ${f(x)} ${f(top)}C${f(x + cw * 1.3)} ${f(top)} ${f(x + cw * 1.1)} ${f(top + h * 0.1)} ${f(x + cw)} ${f(y)}Z" fill="${dark}"/>`;
  const n = 9 + Math.floor(R() * 5);
  for (let i = 0; i < n; i++) {
    const a = -1.2 + (i / (n - 1)) * 2.4, l = h * (0.45 + R() * 0.3), e: P = [x + Math.sin(a) * l + CURRENT * l * 0.25, top - Math.cos(a) * l * 0.8];
    o += `<path d="M${f(x + Math.sin(a) * cw)} ${f(top)}Q${f(x + Math.sin(a) * l * 0.6)} ${f(top - Math.cos(a) * l * 0.6)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="${i % 2 ? c : light}" stroke-width="${f(Math.max(0.18, h * 0.05))}" stroke-linecap="round"/>`;
  }
  return o;
}
/** a small sea fan grown on a thing */
export function smallFan(x: number, y: number, h: number, c: string, R: () => number): string {
  let o = ''; const n = 7, tilt = CURRENT * 0.25 + (R() - 0.5) * 0.4;
  for (let i = 0; i < n; i++) { const a = tilt - 0.9 + (i / (n - 1)) * 1.8, l = h * (0.7 + R() * 0.3); o += `<path d="M${f(x)} ${f(y)}Q${f(x + Math.sin(a) * l * 0.4)} ${f(y - Math.cos(a) * l * 0.5)} ${f(x + Math.sin(a) * l)} ${f(y - Math.cos(a) * l)}" fill="none" stroke="${c}" stroke-width=".26" stroke-linecap="round"/>`; }
  for (let kk = 1; kk <= 3; kk++) { const rr = h * kk / 3.6, ps: P[] = []; for (let i = 0; i <= 8; i++) { const a = tilt - 0.9 + (i / 8) * 1.8; ps.push([x + Math.sin(a) * rr, y - Math.cos(a) * rr]); } o += `<path d="M${pts(ps).replace(/ /g, 'L')}" fill="none" stroke="${c}" stroke-width=".14" stroke-opacity=".8"/>`; }
  return o;
}
/** mussels: a cluster of dark blue-black shells */
export function mussels(x: number, y: number, r: number, R: () => number): string {
  let o = ''; const n = 3 + Math.floor(R() * 4);
  for (let i = 0; i < n; i++) {
    const cx = x + (R() - 0.5) * r * 3, cy = y + (R() - 0.5) * r, a = (R() - 0.5) * 120, rr = r * (0.6 + R() * 0.5);
    o += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr)}" ry="${f(rr * 0.45)}" transform="rotate(${f(a)} ${f(cx)} ${f(cy)})" fill="#1e2228" stroke="#0a0c10" stroke-width=".08"/><path d="M${f(cx - rr * 0.5)} ${f(cy - rr * 0.1)}q${f(rr * 0.5)} ${f(-rr * 0.25)} ${f(rr)} 0" transform="rotate(${f(a)} ${f(cx)} ${f(cy)})" fill="none" stroke="#6a7a8a" stroke-width=".1" stroke-opacity=".7"/>`;
  }
  return o;
}
/** what has grown on a thing: none — bare (the stains only), shells — barnacles and mussels, weed — fronds from its top,
 *  silt — a thick layer of sand on it, coral — one small coral of one of four forms (a sprig, a fan, tubes, an anemone) */
export type Growth = 'none' | 'shells' | 'weed' | 'silt' | 'coral';
const GROWTHS: Growth[] = ['coral', 'none', 'shells', 'silt', 'weed', 'shells', 'none', 'coral', 'silt'];
/** the SVG of one placed thing (in the scene, mm); body — its drawing at the nominal anchor. The thing is cut at the sand
 *  line (what is under it is not seen: the floor itself shows there, one floor, no patch over it); the sand heaped
 *  against its sides and a lip of sand over its edge lie over it; a short dark shade where it meets the sand */
export function propSvg(p: Placed, body: string, paint: FloorPaint): string {
  const id = `wp${p.i}`, b = p.box, R = rng(p.seed * 13 + 5), w = b.x1 - b.x0, h = b.y1 - b.y0, a = AGE[p.mat], k = paint.depth(p.ys), [sd0, sd1] = paint.sand;
  const pad = 1.5, bx = b.x0 - pad, by = b.y0 - pad, bw = w + 2 * pad, bh = h + 2 * pad;
  const growth: Growth = (p.spec.opt?.growth as Growth | undefined) ?? (p.mat === 'gold' ? (p.i % 2 ? 'none' : 'silt') : GROWTHS[(p.i * 4 + p.seed) % GROWTHS.length]);
  const top: P[] = []; for (let x = p.m0; x <= p.m1 + 0.01; x += 0.3) top.push([x, p.sand(x)]);
  const X0 = Math.min(bx, p.m0) - 20, X1 = Math.max(bx + bw, p.m1) + 20;
  const aboveD = `M${f(X0)} ${f(by - 30)}H${f(X1)}V${f(p.ys)}L${pts([...top].reverse()).replace(/ /g, 'L')}L${f(X0)} ${f(p.ys)}Z`;
  const band = `M${f(X0)} ${f(p.ys - 1.6)}L${pts(top.map(([x, y]) => [x, y - 1.6] as P)).replace(/ /g, 'L')}L${f(X1)} ${f(p.ys - 1.6)}V${f(p.ys + 0.35)}L${pts([...top].reverse().map(([x, y]) => [x, y + 0.35] as P)).replace(/ /g, 'L')}L${f(X0)} ${f(p.ys + 0.35)}Z`;
  const out: string[] = [`<defs><g id="${id}">${p.dx || p.dy ? `<g transform="translate(${f(p.dx)} ${f(p.dy)})">${body}</g>` : body}</g>` +
    `<mask id="${id}m" maskUnits="userSpaceOnUse" x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}"><use href="#${id}" filter="url(#wWhite)"/></mask><clipPath id="${id}a"><path d="${aboveD}"/></clipPath>` +
    `<clipPath id="${id}b"><path d="${band}"/></clipPath></defs>`];
  // the shade it throws on the sand right at its foot: its own outline a little to the right and down, only in a narrow
  // band along the sand line (where it comes close to the sand); a short dark shadow at its base
  out.push(`<g clip-path="url(#${id}b)"><use href="#${id}" filter="url(#wBlack)" transform="translate(.55 .4)" opacity=".34"/></g>`);
  const s = p.shadow;
  out.push(`<ellipse cx="${f(s.cx)}" cy="${f(s.cy)}" rx="${f(s.rx)}" ry="${f(s.ry)}" fill="#000" fill-opacity=".24" filter="url(#wB05)"/>`);
  const thing: string[] = [`<use href="#${id}"/>`];
  // its age, on its own pixels only
  let age = '';
  a.b.forEach(([, op], j) => { age += `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" filter="url(#wAge-${p.mat}${j})" opacity="${op}"/>`; });
  const cells: P[] = []; cellsOf(p.occ, (x, y) => { if (y < p.sand(x) - 0.4) cells.push([x, y]); });
  const inside = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].every(([u, v]) => occAt(p.occ, x + u, y + v));
  if (a.streak) for (const [x, y] of p.top.filter(() => R() < (p.mat === 'iron' ? 0.13 : 0.07))) age += `<path d="M${f(x)} ${f(y + 0.3)}q${f((R() - 0.5) * 0.4)} ${f(1 + R() * 2)} ${f((R() - 0.5) * 0.3)} ${f(2 + R() * 4.5)}" stroke="${a.streak}" stroke-width="${f(0.25 + R() * 0.4)}" stroke-opacity=".5" fill="none" stroke-linecap="round"/>`;
  if (p.mat === 'iron') for (let n = 0; n < Math.min(40, w * h * 0.03) && cells.length; n++) { const [x, y] = cells[Math.floor(R() * cells.length)], r = 0.12 + R() * 0.22; if (inside(x, y, r * 1.6)) age += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.6)}" fill="#a85a26" fill-opacity=".45"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#140c08" fill-opacity=".75"/>`; }
  // silt settled on its upper faces: a crisp sandy layer (thick on «silt» things), a fine dust
  const silt = mix(mix(sd1, sd0, 0.5), '#a09070', 0.15);
  if (p.top.length > 2) {
    let d = '', prev: P | null = null;
    for (const q of p.top) { d += (prev && Math.abs(q[1] - prev[1]) < 0.9 ? 'L' : 'M') + `${f(q[0])} ${f(q[1] + 0.35)}`; prev = q; }
    const th = growth === 'silt' ? Math.min(2.2, 0.9 + h * 0.07) : Math.min(1, 0.4 + h * 0.03);
    age += `<path d="${d}" fill="none" stroke="${silt}" stroke-width="${f(th)}" stroke-opacity="${growth === 'silt' ? 0.85 : 0.5}" stroke-linejoin="round" filter="url(#wB02)"/>`;
    if (growth === 'silt') age += `<path d="${d}" fill="none" stroke="${mix(silt, '#ffffff', 0.2)}" stroke-width=".25" stroke-opacity=".7" transform="translate(0 -.25)"/>`;
  }
  for (let n = 0; n < w * h * 0.06; n++) { const x = b.x0 + R() * w, y = b.y0 + R() * h * 0.7; age += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.05 + R() * 0.07)}" fill="${sd1}" fill-opacity="${f(0.25 + R() * 0.3)}"/>`; }
  // barnacles: a few on most things, clusters and mussels on «shells» things, more of them low (where the larvae settle)
  const nC = Math.round(Math.min(9, (w * h) / 45 + 1) * a.fouling * (growth === 'shells' ? 1.4 : growth === 'none' || growth === 'silt' ? 0.3 : 0.6));
  for (let n = 0; n < nC && cells.length; n++) {
    let c = cells[Math.floor(R() * cells.length)]; for (let t = 0; t < 2; t++) { const d = cells[Math.floor(R() * cells.length)]; if (d[1] > c[1]) c = d; }
    const r0 = (0.25 + R() * 0.3) * Math.min(1.3, 0.55 + h / 20), m = 2 + Math.floor(R() * 4);
    if (growth === 'shells' && R() < 0.35 && inside(c[0], c[1], r0 * 2)) age += mussels(c[0], c[1], r0 * 1.4, R);
    for (let j = 0; j < m; j++) { const x = c[0] + (R() - 0.5) * r0 * 5, y = c[1] + (R() - 0.5) * r0 * 3, r = r0 * (0.55 + R() * 0.6); if (inside(x, y, r * 0.9)) age += barnacle(x, y, r); }
  }
  // the water between: paler with distance
  age += `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" fill="${paint.haze}" opacity="${f(0.04 + (1 - k) * 0.3)}"/>`;
  // the line where it goes in: a dark crevice on its own pixels just over the sand
  const enter = top.filter(([x]) => x >= p.xa - 0.3 && x <= p.xb + 0.3);
  if (enter.length > 1) age += `<path d="M${pts(enter.map(([x, y]) => [x, y - 0.25] as P)).replace(/ /g, 'L')}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width=".5" filter="url(#wB02)"/>`;
  thing.push(`<g mask="url(#${id}m)">${age}</g>`);
  // what has grown on it, standing up from its upper outline
  const hz = (c: string) => mix(c, paint.haze, 0.12 + (1 - k) * 0.25);
  const pick = () => p.top[Math.floor((0.12 + R() * 0.76) * p.top.length)];
  if (p.top.length > 6 && paint.coral && growth === 'coral') {
    const q = pick(), c = hz(paint.coral[(p.i + p.seed) % paint.coral.length]), hh = 2.2 + R() * Math.min(4.5, h * 0.3), form = (p.i + p.seed) % 4;
    thing.push(form === 0 ? coralSprig(q[0], q[1] + 0.5, hh, c, R) : form === 1 ? smallFan(q[0], q[1] + 0.4, hh * 1.1, c, R) : form === 2 ? tubeSponge(q[0], q[1] + 0.5, hh, c, R) : anemone(q[0], q[1] + 0.4, hh * 0.9, c, R));
  }
  if (p.top.length > 4 && growth === 'weed') {
    const n = 1 + (w > 14 ? 1 : 0);
    for (let i = 0; i < n; i++) { const q = pick(); thing.push(weed(i ? 'grass' : 'ribbon', q[0], q[1] + 0.5, 2 + R() * Math.min(5, 1 + h * 0.35), hz(paint.weed[(p.i + i) % paint.weed.length]), R)); }
  }
  out.push(`<g clip-path="url(#${id}a)">${thing.join('')}</g>`);
  // the sand heaped against its sides and over its edge: the floor's own paint, a little lighter (lit), the crest lit
  const heap = top.filter(([x, y]) => y < p.ys - 0.05 || (x >= p.xa && x <= p.xb));
  if (heap.length > 2) {
    const h0 = heap[0][0], h1 = heap[heap.length - 1][0], lip = 0.5;
    const d = `M${f(h0)} ${f(p.ys + lip)}L${pts(heap).replace(/ /g, 'L')}L${f(h1)} ${f(p.ys + lip)}Z`;
    out.push(`<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${f(p.ys - 0.1)}" x2="0" y2="${f(p.ys + lip)}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
      `<mask id="${id}f" maskUnits="userSpaceOnUse" x="${f(h0 - 1)}" y="${f(b.y0 - 6)}" width="${f(h1 - h0 + 2)}" height="${f(p.ys - b.y0 + 8)}"><rect x="${f(h0 - 1)}" y="${f(b.y0 - 6)}" width="${f(h1 - h0 + 2)}" height="${f(p.ys - b.y0 + 8)}" fill="url(#${id}g)"/></mask></defs>` +
      `<clipPath id="${id}h"><path d="${d}"/></clipPath><g mask="url(#${id}f)"><path d="${d}" fill="${paint.floor}"/><g clip-path="url(#${id}h)"><use href="#${paint.ripples}"/></g><path d="${d}" fill="${sd0}" fill-opacity=".08"/></g>`);
    out.push(`<path d="M${pts(heap.map(([x, y]) => [x - 0.1, y + 0.12] as P)).replace(/ /g, 'L')}" fill="none" stroke="${mix(sd0, '#ffffff', 0.15)}" stroke-width=".3" stroke-opacity=".6" filter="url(#wB02)"/>`);
    let gr = ''; for (const [x, y] of heap) if (R() < 0.3) gr += `<circle cx="${f(x + (R() - 0.5) * 0.3)}" cy="${f(y + 0.25 + R() * 0.3)}" r="${f(0.06 + R() * 0.08)}" fill="${R() < 0.5 ? paint.sand[2] : sd0}" fill-opacity=".6"/>`;
    out.push(gr);
  }
  // now and then weed rooted at its foot, streaming with the current (not on every thing)
  const kinds: WeedKind[] = ['grass', 'bush', 'ribbon', 'lettuce'], wc = (n: number) => mix(paint.weed[n % paint.weed.length], paint.haze, 0.25 + (1 - k) * 0.25);
  if (p.spec.opt?.weed !== false && growth !== 'weed' && R() < 0.3) {
    const x = R() < 0.5 ? p.xa - 0.4 - R() * 1.2 : p.xb + 0.3 + R();
    out.push(weed(kinds[(p.i + p.seed) % 4], x, p.sand(x) + 0.3, 2.4 + R() * Math.min(5, 1.5 + h * 0.35), wc(p.i), R));
  }
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
    const need = p.box.y1 - p.box.y0 > 4 ? 0.08 : 0.04;
    if (under / all < need) out.push(`${name(p)}: stands on the sand, not in it (${(100 * under / all).toFixed(1)} % under the sand line, need ≥ ${100 * need} %)`);
    if (above / all < 0.25) out.push(`${name(p)}: buried (only ${(100 * above / all).toFixed(1)} % above the sand, need ≥ 25 %)`);
    if (p.xb - p.xa < 0.6) out.push(`${name(p)}: does not meet the sand line`);
    let bad = 0; for (let x = p.xa; x <= p.xb; x += 0.5) if (p.ys < floorTop(x) + 0.4 || onHull([x, p.ys - 0.3])) bad++;
    if (bad > 1) out.push(`${name(p)}: its sand line (y ${p.ys.toFixed(1)}) is not on the open floor (on the hull or above the far edge)`);
    if (p.box.x0 < 1 || p.box.x1 > pageW - 1) out.push(`${name(p)}: cut by the edge of the sheet`);
    const s = p.shadow, cx = (p.xa + p.xb) / 2;
    if (Math.abs(s.cy - s.ry - p.ys) > 0.6) out.push(`${name(p)}: its shadow starts ${(s.cy - s.ry - p.ys).toFixed(1)} mm from its base`);
    if (s.cx <= cx) out.push(`${name(p)}: its shadow falls to the left (the light is from the left)`);
    if (s.rx < 0.5) out.push(`${name(p)}: no shadow at its base`);
    // it rests on the sand along its length: the bottom of each column of it reaches the sand (a long thing tilted up
    // out of the sand, a keg standing on its rim over the floor, a timber held up by one end — they float)
    // the whole lower edge, column by column: where its bottom is within 0.9 mm of the sand it rests on it
    const cols = new Map<number, number>();
    cellsOf(p.occ, (x, y) => { const c = Math.round(x / CELL); cols.set(c, Math.max(cols.get(c) ?? -Infinity, y)); });
    const cs = [...cols.entries()].sort((a, b) => a[0] - b[0]).map(([c, yb]) => [c * CELL, yb >= p.sand(c * CELL) - 0.9] as [number, boolean]);
    const W = p.box.x1 - p.box.x0, on = cs.filter(c => c[1]), x0 = on.length ? on[0][0] : NaN, x1 = on.length ? on[on.length - 1][0] : NaN;
    let gap = 0, run = 0; for (const [, t] of cs) { run = t ? 0 : run + CELL; gap = Math.max(gap, run); }
    const groups = cs.reduce((n, c, i) => n + (c[1] && (i === 0 || !cs[i - 1][1]) ? 1 : 0), 0);
    if (p.spec.rests) {
      // it rests on points of itself: two places at least, far apart (it does not balance on one)
      if (groups < 2 || x1 - x0 < 0.4 * W) out.push(`${name(p)}: does not rest on two places far apart (${groups} place(s) on the sand over x ${x0.toFixed(0)}…${x1.toFixed(0)} of ${p.box.x0.toFixed(0)}…${p.box.x1.toFixed(0)})`);
    } else if (!p.spec.stuck && W > 6) {
      // it lies on the sand along its length: most of its lower edge on the sand, no long stretch held up over it
      if (!on.length || x1 - x0 < 0.6 * W || on.length < 0.45 * cs.length || gap > Math.max(4, 0.3 * W)) out.push(`${name(p)}: floats over the sand (${(100 * on.length / Math.max(1, cs.length)).toFixed(0)} % of its lower edge on the sand, over x ${x0.toFixed(0)}…${x1.toFixed(0)} of ${p.box.x0.toFixed(0)}…${p.box.x1.toFixed(0)}; the longest stretch over it ${gap.toFixed(1)} mm)`);
    }
    if (hull > 6) out.push(`${name(p)}: overlaps the hull`);
  }
  // two things may overlap only when one lies clearly in front of the other (its base nearer by 2 mm or more: drawn later)
  ps.forEach((a, i) => ps.slice(i + 1).forEach((b, jj) => {
    const B = vis[i + 1 + jj]; let n = 0; for (const c of vis[i]) if (B.has(c)) n++;
    if (n > 3 && Math.abs(a.ys - b.ys) < 2) out.push(`${name(a)} and ${name(b)} overlap (${n} cells)`);
  }));
  return out;
}
