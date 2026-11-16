// The ship's emblem and the side's ribbon — engraved pieces of an old chart's cartouche, drawn in SVG (no film imagery).
//
//   emblemSvg(key, cx, cy, R, o)  — a brass medallion of outer radius R (mm) with the ship's letter on its field and the
//                                   ship's own device round and behind it:
//       pearl     — a sixteen-point wind rose behind the ring (its shaded halves hatched), a pearl at its north, a string
//                   of pearls on the ring, a black tattered sail on the yard, its stays, an engraved sky and a hatched
//                   choppy sea in the field;
//       revenge   — tongues of fire round the ring (their shaded flanks hatched) and sparks, a skull (brows, temples, a
//                   crack, hatched shade) over crossed bones on top, a laid-rope ring lit strand by strand, the field a
//                   blaze of rays;
//       endeavour — the Company's arms of our own drawing (a red shield in a raised gilt rim, its chief blue with three
//                   gold bezants; the tinctures engraved by hatching too), a crown on top, two crossed iron anchors behind
//                   (hatched, a cable bent to each ring), a reeded coin edge;
//       dutch     — the ring is a ship's wheel with turned spokes, a scallop on top, two tentacles coiling up round it
//                   from below (suckers inwards), kelp and a whelk, barnacles on the rim.
//     Every ring: a soft cast shadow, an outer chamfer lit at the upper left and an inner wall lit at the lower right,
//     both engraved on their dark sides, glints of polished metal; the field sunk under the ring, its shadow hatched.
//     Light falls from the upper left. Everything stays within EMBLEM_EXTENT × R of the centre.
//   sideRibbonSvg(word, side, cx, cy, o) — the side's name in letter-spaced small capitals: variant 'scroll' — a
//     banderole with forked tails folded back (the side's colour on the edges and the tails; the face shaded into its
//     folds, the folds and the tails hatched, a ripple across each tail, a soft shadow), 'flag' — a small engraved
//     cartouche with the side's flag on a staff. o.size sets the type, o.minW stretches it (the battle scheme).
//
// Printing (tools/print/README.md): no filters or opacity on images; outlines ≥ 0.15 mm, engraved strokes ≥ 0.1 mm at
// the real size (0.17 of R = 10 at R 6.5); the letter in Alegreya SC 800, outlined by filled copies, never a stroke.
// A word carries data-in, its plate data-plate (check-layout: ≥ 1.5 mm inside it).
import { widthOf, type ShipKey, type TO } from './frame';

const f = (n: number) => Math.round(n * 100) / 100;
const pt = (n: number) => n * 25.4 / 72;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
/** a point at radius r, angle a (degrees, 0 — up, clockwise) */
const pol = (r: number, a: number): [number, number] => [r * Math.sin(a * Math.PI / 180), -r * Math.cos(a * Math.PI / 180)];
const P = (p: [number, number]) => `${f(p[0])} ${f(p[1])}`;
const poly = (ps: [number, number][]) => 'M' + ps.map(P).join('L') + 'Z';

const BRASS: [string, string, string] = ['#f3d68c', '#c4954a', '#5e4214'];
const CREAM = '#fff8e6';
/** how far the emblem reaches from its centre, in R (up, down, to either side) */
export const EMBLEM_EXTENT = { up: 1.43, down: 1.45, side: 1.46 };
/** the letter's type: Alegreya SC 800; the browser's box of a line is 1.03 em over the baseline and 0.35 em under */
export const LETTER_O: TO = { font: 'Alegreya SC', w: 800 };
const BOX = { up: 1.03, down: 0.35 };
/** the scroll's sag, mm */
const SAG = 0.45;

export interface EmblemOpts {
  /** a prefix unique on the page (gradients, clips) */
  id: string;
  letter: string;
  /** the letter's size, pt (19 on the face's header) */
  size?: number;
  /** the ship's colours: pal.solid (≥ 4.5 : 1 under cream) and pal.deep */
  solid: string; deep: string;
  brass?: [string, string, string];
  /** the letter's plate (data-plate; the letter carries data-in) */
  plate?: string;
  /** data-deco on the emblem's group */
  deco?: string;
}

// ---- drawing helpers, in the emblem's units (R = 10) ----
interface D { id: string; B: [string, string, string]; defs: string[]; n: number }
const uid = (d: D, s: string) => `${d.id}${s}${++d.n}`;
/** the segments of parallel lines (angle in degrees, step apart) that fall inside a box — no point of them leaves it */
export function hatchLines(box: [number, number, number, number], step: number, angle: number): string {
  const [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, L = Math.hypot(x1 - x0, y1 - y0) / 2;
  const a = angle * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  let p = '';
  for (let o = -L + step / 2; o <= L; o += step) {
    const px = cx + nx * o, py = cy + ny * o;
    let t0 = -L - 1, t1 = L + 1;
    for (const [q, lo, hi] of [[dx, x0 - px, x1 - px], [dy, y0 - py, y1 - py]] as const) {
      if (Math.abs(q) < 1e-9) { if (lo > 0 || hi < 0) { t0 = 1; t1 = 0; } continue; }
      const u = lo / q, v = hi / q;
      t0 = Math.max(t0, Math.min(u, v)); t1 = Math.min(t1, Math.max(u, v));
    }
    if (t1 - t0 > 0.05) p += `M${f(px + dx * t0)} ${f(py + dy * t0)}L${f(px + dx * t1)} ${f(py + dy * t1)}`;
  }
  return p;
}
/** parallel lines over a box, clipped to a path: engraved shading */
function hatch(d: D, clipD: string, box: [number, number, number, number], step: number, angle: number, sw: number, color: string, op = 1): string {
  const id = uid(d, 'h');
  d.defs.push(`<clipPath id="${id}"><path d="${clipD}"/></clipPath>`);
  return `<g clip-path="url(#${id})"><path d="${hatchLines(box, step, angle)}" stroke="${color}" stroke-width="${sw}"${op < 1 ? ` stroke-opacity="${op}"` : ''} fill="none"/></g>`;
}
const lin = (d: D, stops: [number, string][], x2 = 1, y2 = 1, x1 = 0, y1 = 0) => {
  const id = uid(d, 'g');
  d.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
  return `url(#${id})`;
};
const rad = (d: D, stops: [number, string][], cx = 0.38, cy = 0.32, r = 0.8) => {
  const id = uid(d, 'r');
  d.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`);
  return `url(#${id})`;
};
const circ = (cx: number, cy: number, r: number, attrs: string) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${attrs}/>`;
const circleD = (r: number, cx = 0, cy = 0) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
const arc = (r: number, a0: number, a1: number) => `M${P(pol(r, a0))}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${P(pol(r, a1))}`;
const shadowOf = (path: string, op = 0.28) => `<path d="${path}" fill="#1a0e04" fill-opacity="${op}" transform="translate(.45 .65)"/>`;

const SHADE = '#1a0e04';
/** how a surface facing the angle a (degrees, 0 — up, clockwise) is lit: 1 — towards the light at the upper left, −1 — away */
const lit = (a: number) => Math.cos((a - 315) * Math.PI / 180);
const annulus = (r0: number, r1: number) => circleD(r1) + circleD(r0);
/** a soft cast shadow: two offset copies of a shape, the farther fainter */
const softShadow = (path: string, k = 1) => `<path d="${path}" fill="${SHADE}" fill-opacity="${f(0.12 * k)}" transform="translate(.8 1.1)"/><path d="${path}" fill="${SHADE}" fill-opacity="${f(0.2 * k)}" transform="translate(.42 .6)"/>`;
/** a four-pointed glint of light on polished metal: arms s long up and down, 0.62 s across */
const glint = (x: number, y: number, s: number, c = '#ffffff') => {
  const a = s * 0.62, q = s * 0.1;
  return `<path d="M${f(x)} ${f(y - s)}Q${f(x + q)} ${f(y - q)} ${f(x + a)} ${f(y)}Q${f(x + q)} ${f(y + q)} ${f(x)} ${f(y + s)}Q${f(x - q)} ${f(y + q)} ${f(x - a)} ${f(y)}Q${f(x - q)} ${f(y - q)} ${f(x)} ${f(y - s)}Z" fill="${c}"/>`;
};
/** engraved radial strokes between r0 and r1 over the angles a0…a1, shorter towards the ends when tapered */
function radialHatch(r0: number, r1: number, a0: number, a1: number, step: number, taper = true, from: 'out' | 'in' = 'out'): string {
  let p = '';
  for (let a = a0 + step / 2; a < a1; a += step) {
    const k = taper ? Math.pow(Math.sin(Math.PI * (a - a0) / (a1 - a0)), 0.7) : 1, len = (r1 - r0) * Math.max(0.35, k);
    p += from === 'out' ? `M${P(pol(r1, a))}L${P(pol(r1 - len, a))}` : `M${P(pol(r0, a))}L${P(pol(r0 + len, a))}`;
  }
  return p;
}
/** a Catmull-Rom spine through the points, k samples a span */
function spline(pts: [number, number][], k = 8): [number, number][] {
  const cr = (p0: number, p1: number, p2: number, p3: number, t: number) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < k; j++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)], t = j / k;
    out.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** the ring: its cast shadow, the band (brass, or the wheel's wood), the outer chamfer lit at the upper left and the
 *  inner wall going down to the field, lit at the lower right (tone: the chamfers' metal, light → dark) */
function ring(d: D, fill: string, line: string, tone: [string, string, string]): string {
  const [tl, tm, td] = tone;
  return softShadow(circleD(10), 1.15) + circ(0, 0, 10, `fill="${fill}"`) +
    `<path d="${annulus(9.3, 10)}" fill-rule="evenodd" fill="${lin(d, [[0, mix(tl, '#ffffff', 0.5)], [0.3, tl], [0.6, tm], [1, td]])}"/>` +
    `<path d="${annulus(7.6, 8.2)}" fill-rule="evenodd" fill="${lin(d, [[0, td], [0.4, tm], [0.75, tl], [1, mix(tl, '#ffffff', 0.4)]])}"/>` +
    circ(0, 0, 9.3, `fill="none" stroke="${line}" stroke-width=".18"`) + circ(0, 0, 8.2, `fill="none" stroke="${line}" stroke-width=".18"`);
}
/** over the ring's own pattern: the engraved shade on the chamfers' dark sides, the rim's outline, the light on the band
 *  and the glints of polished metal */
function ringLight(line: string, light: string): string {
  return `<path d="${radialHatch(9.32, 9.98, 62, 208, 3.4)}${radialHatch(7.62, 8.18, 242, 388, 4.2, true, 'in')}" stroke="${line}" stroke-width=".17" stroke-opacity=".75" fill="none"/>` +
    circ(0, 0, 10, `fill="none" stroke="${line}" stroke-width=".4"`) + circ(0, 0, 7.75, `fill="none" stroke="${line}" stroke-width=".3"`) +
    `<path d="${arc(9.62, 262, 350)}" fill="none" stroke="${light}" stroke-width=".3" stroke-linecap="round"/>` +
    `<path d="${arc(7.95, 105, 165)}" fill="none" stroke="${light}" stroke-opacity=".8" stroke-width=".22" stroke-linecap="round"/>` +
    glint(...pol(9.64, 312), 1.3) + glint(...pol(9.64, 268), 0.55) + glint(...pol(7.92, 135), 0.75, mix(light, '#ffffff', 0.5));
}
/** the field under the letter */
function field(fill: string, line: string): string {
  return circ(0, 0, 7.6, `fill="${fill}" stroke="${line}" stroke-width=".3"`);
}
const fieldRule = (c = CREAM, op = 0.6) => circ(0, 0, 7.1, `fill="none" stroke="${c}" stroke-opacity="${op}" stroke-width=".24"`);
/** the field is sunk under the ring: the ring's shadow falls on it at the upper left (hatched), the light at the lower right */
function fieldShade(d: D): string {
  const c1 = uid(d, 'c'), c2 = uid(d, 'c'), cres = circleD(7.6) + circleD(7.6, 0.8, 1.0);
  d.defs.push(`<clipPath id="${c1}"><path d="${circleD(7.6)}"/></clipPath><clipPath id="${c2}"><path d="${cres}" clip-rule="evenodd"/></clipPath>`);
  return `<g clip-path="url(#${c1})"><path d="${cres}" fill-rule="evenodd" fill="${SHADE}" fill-opacity=".3"/>` +
    `<g clip-path="url(#${c2})"><path d="${hatchLines([-7.6, -7.6, 7.6, 7.6], 0.42, 45)}" stroke="${SHADE}" stroke-width=".17" stroke-opacity=".55" fill="none"/></g></g>` +
    `<path d="${arc(7.32, 105, 168)}" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width=".26" stroke-linecap="round"/>`;
}

// ---- the Pearl: the wind rose, the pearls, the black sail ----
function pearl(d: D, o: EmblemOpts): { back: string; ring: string; field: string; front: string } {
  const [bl, bm, bd] = d.B, ink = '#1a1714', black = o.solid, cream = '#f4ecd8';
  // the rose: a card ring with its degrees behind sixteen points, each split into a lit and a shaded half
  let back = circ(0, 0, 11.0, `fill="none" stroke="${ink}" stroke-width=".26"`) + circ(0, 0, 10.45, `fill="none" stroke="${ink}" stroke-width=".2"`);
  let ticks = '';
  for (let i = 0; i < 32; i++) { const a = i * 360 / 32 + 5.625; ticks += `M${P(pol(10.45, a))}L${P(pol(11.0, a))}`; }
  back += `<path d="${ticks}" stroke="${ink}" stroke-width=".2"/>`;
  const pts: { a: number; L: number; w: number; c: [string, string] }[] = [];
  for (let i = 0; i < 8; i++) pts.push({ a: 22.5 + i * 45, L: 11.7, w: 8, c: [cream, mix(black, cream, 0.3)] });
  for (let i = 0; i < 4; i++) pts.push({ a: 45 + i * 90, L: 12.9, w: 13, c: [bl, bm] });
  for (let i = 0; i < 4; i++) pts.push({ a: i * 90, L: i === 0 ? 12.85 : 14.5, w: 17, c: [cream, black] });
  for (const p of pts) {
    const tip = pol(p.L, p.a), axis = pol(8, p.a), l = pol(8.4, p.a - p.w), rr = pol(8.4, p.a + p.w);
    back += shadowOf(poly([l, tip, rr]), 0.22);
    // the lit half faces the upper left: the half on the side nearer to 315°
    const leftLit = lit(p.a - p.w / 2) > lit(p.a + p.w / 2), dark = leftLit ? [axis, tip, rr] : [l, tip, axis];
    back += `<path d="${poly([l, tip, axis])}" fill="${leftLit ? p.c[0] : p.c[1]}"/><path d="${poly([axis, tip, rr])}" fill="${leftLit ? p.c[1] : p.c[0]}"/>`;
    // the shaded half engraved: strokes along the point (none on the black ones), a fine light line on the lit edge
    if (p.c[1] !== black) {
      const xs = dark.map(q => q[0]), ys = dark.map(q => q[1]);
      back += hatch(d, poly(dark as [number, number][]), [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], 0.4, p.a - 90 + (leftLit ? 9 : -9), 0.17, p.c[1] === bm ? bd : ink, 0.7);
    }
    back += `<path d="${poly([l, tip, rr])}" fill="none" stroke="${ink}" stroke-width=".26" stroke-linejoin="round"/><path d="M${P(axis)}L${P(tip)}" stroke="${ink}" stroke-width=".2"/>`;
  }
  // the pearl at the north: its lustre, the light at the upper left, the sea's light under it
  const pg = rad(d, [[0, '#ffffff'], [0.45, '#efe9de'], [0.85, '#b4ad9e'], [1, '#8a8478']], 0.35, 0.3, 0.75);
  back += shadowOf(circleD(1.15, 0, -13.1), 0.3) + circ(0, -13.1, 1.15, `fill="${pg}" stroke="${ink}" stroke-width=".22"`) +
    `<path d="M-.75 -12.45A.95 .95 0 0 0 .8 -12.5" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width=".2" stroke-linecap="round"/>` + glint(-0.4, -13.5, 0.62);
  // the ring: a string of pearls, a gold bead between each two, the pearls' shadows on the brass
  let rg = '';
  const bead = rad(d, [[0, '#ffffff'], [0.45, '#efe9de'], [0.85, '#b0a998'], [1, '#7e786c']], 0.35, 0.3, 0.75);
  for (let i = 0; i < 20; i++) { const [x, y] = pol(8.75, i * 18 + 9); rg += circ(x + 0.16, y + 0.22, 0.56, `fill="${SHADE}" fill-opacity=".4"`); }
  for (let i = 0; i < 20; i++) { const [x, y] = pol(8.75, i * 18); rg += circ(x, y, 0.22, `fill="${bm}" stroke="${bd}" stroke-width=".17"`); }
  for (let i = 0; i < 20; i++) { const [x, y] = pol(8.75, i * 18 + 9); rg += circ(x, y, 0.56, `fill="${bead}" stroke="${bd}" stroke-width=".18"`) + circ(x - 0.2, y - 0.2, 0.15, 'fill="#ffffff"'); }
  // the field: mother-of-pearl, the sea at the foot, the mast and its pennant, the yard and the black sail
  let fl = field(rad(d, [[0, '#fbf7ee'], [0.55, '#e4ddcd'], [0.85, '#c9c0ad'], [1, '#a59c88']]), bd);
  const clipF = circleD(7.45);
  const fc = uid(d, 'c'); d.defs.push(`<clipPath id="${fc}"><path d="${clipF}"/></clipPath>`);
  let sea = '';
  for (const [y0, k] of [[5.5, 0], [6.4, 0.9], [7.25, 0.3]] as const) { sea += `M${f(-8 + k)} ${y0}`; for (let i = 0; i < 9; i++) sea += `q.45 -.55 .9 0t.9 0`; }
  // the sky engraved in level strokes, closer towards the foot; the sea under it, its swell hatched
  let sky = '';
  for (let y = -7.3, k = 0; y < 5.4; y += 0.62 - Math.min(0.2, k * 0.012), k++) sky += `M-7.6 ${f(y)}H7.6`;
  const seaD = 'M-8 5.9Q-4 5.2 0 5.7T8 5.6V8H-8Z';
  fl += `<g clip-path="url(#${fc})"><path d="${sky}" stroke="#9a907c" stroke-width=".17" stroke-opacity=".6"/><path d="${seaD}" fill="#8f8a7e"/>` +
    hatch(d, seaD, [-8, 5.2, 8, 8], 0.36, 0, 0.17, '#4a453c', 0.7) + `<path d="${sea}" fill="none" stroke="#2a2620" stroke-width=".26"/></g>`;
  fl += `<path d="M0 -4.6V-7.05" stroke="#4a3018" stroke-width=".5"/><path d="M.15 -7.05Q1.4 -7.15 2.7 -6.55Q1.3 -6.5 .15 -6.1Z" fill="${black}" stroke="${ink}" stroke-width=".17"/>`;
  // the stays from the masthead to the yard's arms
  fl += `<path d="M0 -7.0L-5.4 -4.95M0 -7.0L5.4 -4.95" stroke="#3a2a1a" stroke-width=".17"/>`;
  // the sail: bellied, its foot torn
  const foot: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const x = 4.9 - i * 9.8 / 12, y = 4.3 + 1.35 * (1 - (x / 4.9) ** 2) + (i % 2 ? -0.55 : 0) + (i === 5 ? -0.5 : 0); foot.push([x, y]); }
  const sail = `M-5.35 -4.55C-6.55 -1.6 -6.45 2.1 -4.9 4.3${foot.slice().reverse().map(p => 'L' + P(p)).join('')}L4.9 4.3C6.45 2.1 6.55 -1.6 5.35 -4.55Z`;
  fl += `<path d="${sail}" fill="#0a0806" fill-opacity=".35" transform="translate(.35 .45)"/>`;
  fl += `<path d="${sail}" fill="${lin(d, [[0, mix(black, '#ffffff', 0.22)], [0.45, black], [1, mix(black, '#000000', 0.45)]], 1, 0)}" stroke="${ink}" stroke-width=".3" stroke-linejoin="round"/>`;
  let seams = '';
  for (const x of [-3.5, -1.75, 0, 1.75, 3.5]) seams += `M${f(x)} -4.5Q${f(x * 1.2)} 0 ${f(x * 0.92)} ${f(4.1 + 1.35 * (1 - (x * 0.92 / 4.9) ** 2))}`;
  fl += `<path d="${seams}" fill="none" stroke="${mix(black, '#ffffff', 0.3)}" stroke-width=".22"/>`;
  fl += hatch(d, sail, [0.5, -5, 6.6, 6], 0.55, -62, 0.18, '#000000', 0.65) + hatch(d, sail, [3.2, -5, 6.6, 6], 0.55, 28, 0.17, '#000000', 0.6);
  // the cloth's highlights where the wind fills it: fine light strokes on the belly at the left
  fl += hatch(d, sail, [-6.6, -4.4, -2.6, 4.6], 0.5, 62, 0.17, mix(black, '#ffffff', 0.55), 0.55);
  fl += `<path d="M-5.0 -3.9C-5.95 -1.4 -5.85 1.8 -4.55 3.7" fill="none" stroke="${mix(black, '#ffffff', 0.42)}" stroke-width=".32" stroke-linecap="round"/>`;
  fl += `<path d="M0 5.6V6.6M-4.9 4.3L-6.6 5.4M4.9 4.3L6.6 5.4" stroke="#2a1a0c" stroke-width=".24"/>`;
  // holes shot through it
  fl += `<path d="M3.9 -3.75l.5 -.2.25.35-.15.45-.45.1-.3-.3Z" fill="#d9d1c0" stroke="${ink}" stroke-width=".17"/><path d="M-4.15 3.55l.4 -.3.35.2.05.45-.4.2-.35-.15Z" fill="#c9c0ad" stroke="${ink}" stroke-width=".17"/>`;
  // the yard
  fl += `<path d="M-5.75 -4.75Q0 -5.25 5.75 -4.75" fill="none" stroke="#2a1a0c" stroke-width=".95" stroke-linecap="round"/><path d="M-5.6 -4.95Q0 -5.45 5.6 -4.95" fill="none" stroke="#a87a48" stroke-width=".3" stroke-linecap="round"/>`;
  return { back, ring: rg, field: fl + fieldRule('#ffffff', 0.7), front: '' };
}

// ---- the Revenge: fire, the skull and bones ----
function flame(d: D, x: number, y: number, rot: number, L: number, w: number, m: number, red: string, dark: string): string {
  // a tongue licking up, its tip leaning, a flick off its side; m = ±1 mirrors it
  const X = (v: number) => f(v * m);
  const shape = (l: number, ww: number, dy = 0) => `M${X(-ww / 2)} ${f(dy)}C${X(-ww * 0.62)} ${f(dy - l * 0.28)} ${X(-ww * 0.1)} ${f(dy - l * 0.42)} ${X(-ww * 0.32)} ${f(dy - l * 0.62)}` +
    `C${X(-ww * 0.48)} ${f(dy - l * 0.78)} ${X(-ww * 0.1)} ${f(dy - l * 0.9)} ${X(ww * 0.2)} ${f(dy - l)}C${X(ww * 0.04)} ${f(dy - l * 0.82)} ${X(ww * 0.26)} ${f(dy - l * 0.72)} ${X(ww * 0.28)} ${f(dy - l * 0.58)}` +
    `C${X(ww * 0.5)} ${f(dy - l * 0.62)} ${X(ww * 0.62)} ${f(dy - l * 0.7)} ${X(ww * 0.74)} ${f(dy - l * 0.8)}C${X(ww * 0.7)} ${f(dy - l * 0.5)} ${X(ww * 0.64)} ${f(dy - l * 0.22)} ${X(ww / 2)} ${f(dy)}Z`;
  const o = shape(L, w);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
    `<path d="${o}" fill="#1a0e04" fill-opacity=".25" transform="translate(${f(0.35 * m)} .5)"/>` +
    `<path d="${o}" fill="${red}" stroke="${dark}" stroke-width=".28" stroke-linejoin="round"/>` +
    // the tongue's shaded flank engraved in strokes rising with it
    hatch(d, o, m > 0 ? [0, -L, w * 0.8, 0] : [-w * 0.8, -L, 0, 0], 0.4, m > 0 ? -72 : -108, 0.17, dark, 0.75) +
    `<path d="${shape(L * 0.74, w * 0.62, -0.1)}" fill="#d9772c"/>` +
    `<path d="${shape(L * 0.44, w * 0.32, -0.2)}" fill="#f6d67e"/>` +
    `<path d="M${X(w * 0.3)} ${f(-L * 0.08)}C${X(w * 0.42)} ${f(-L * 0.3)} ${X(w * 0.36)} ${f(-L * 0.45)} ${X(w * 0.48)} ${f(-L * 0.62)}" fill="none" stroke="${dark}" stroke-width=".22" stroke-linecap="round"/>` +
    // the white heat in the core
    `<path d="M${X(-w * 0.05)} ${f(-L * 0.06)}C${X(-w * 0.12)} ${f(-L * 0.18)} ${X(0)} ${f(-L * 0.28)} ${X(-w * 0.04)} ${f(-L * 0.36)}" fill="none" stroke="#fff4cc" stroke-width=".22" stroke-linecap="round"/></g>`;
}
function skull(d: D, cx: number, cy: number, bone: string, ink: string): string {
  const head = `M-2.1 1.1C-3 .5-3.1-1-2.8-1.9C-2.3-2.95-1.2-3.05 0-3.05C1.2-3.05 2.3-2.95 2.8-1.9C3.1-1 3 .5 2.1 1.1L1.9 1.6C1.9 2.45 1.4 2.75 0 2.75C-1.4 2.75-1.9 2.45-1.9 1.6Z`;
  const boneD = (x0: number, y0: number, x1: number, y1: number) => {
    const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang) * 0.42, ny = Math.cos(ang) * 0.42;
    const knob = (x: number, y: number) => circ(x + nx, y + ny, 0.62, `fill="${bone}" stroke="${ink}" stroke-width=".24"`) + circ(x - nx, y - ny, 0.62, `fill="${bone}" stroke="${ink}" stroke-width=".24"`);
    const sh = Math.sign(ny) || 1, sx = nx * sh * 0.38, sy = ny * sh * 0.38;
    return `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>` + knob(x0, y0) + knob(x1, y1) +
      `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${bone}" stroke-width=".66" stroke-linecap="round"/>` +
      `<path d="M${f(x0 + sx)} ${f(y0 + sy)}L${f(x1 + sx)} ${f(y1 + sy)}" stroke="${mix(bone, ink, 0.45)}" stroke-width=".18"/>` +
      `<path d="M${f(x0 - sx * 0.6)} ${f(y0 - sy * 0.6)}L${f(x1 - sx * 0.6)} ${f(y1 - sy * 0.6)}" stroke="#ffffff" stroke-opacity=".8" stroke-width=".17"/>`;
  };
  const bones = `<path d="M-5 -2L5 2.2M5 -2L-5 2.2" stroke="#1a0e04" stroke-opacity=".25" stroke-width="1.2" transform="translate(.35 .5)"/>` + boneD(-5, -2, 5, 2.2) + boneD(5, -2, -5, 2.2);
  return `<g transform="translate(${f(cx)} ${f(cy)})">${bones}` +
    `<path d="${head}" fill="#1a0e04" fill-opacity=".3" transform="translate(.4 .55)"/>` +
    `<path d="${head}" fill="${lin(d, [[0, '#fbf3df'], [0.55, bone], [1, mix(bone, '#5a4024', 0.35)]])}" stroke="${ink}" stroke-width=".3" stroke-linejoin="round"/>` +
    hatch(d, head, [0.4, -3.1, 3.2, 2.8], 0.45, -50, 0.17, mix(bone, ink, 0.55)) +
    hatch(d, head, [1.6, -1.2, 3.2, 2.8], 0.45, 40, 0.17, mix(bone, ink, 0.6)) +
    // the temples
    `<path d="M-2.75 -.9C-2.35 -.6 -2.3 .1 -2.55 .55M2.75 -.9C2.35 -.6 2.3 .1 2.55 .55" fill="none" stroke="${mix(bone, ink, 0.5)}" stroke-width=".17" stroke-linecap="round"/>` +
    // the sockets under heavy brows, their rims in shade
    `<path d="M-2.15 -.85Q-1.25 -1.3 -.3 -.8Q-.2 .25 -1.0 .5Q-1.95 .4 -2.15 -.85ZM2.15 -.85Q1.25 -1.3 .3 -.8Q.2 .25 1.0 .5Q1.95 .4 2.15 -.85Z" fill="${mix(bone, ink, 0.5)}"/>` +
    `<path d="M-2.0 -.72Q-1.2 -1.1 -.42 -.68Q-.36 .18 -1.0 .38Q-1.8 .28 -2.0 -.72ZM2.0 -.72Q1.2 -1.1 .42 -.68Q.36 .18 1.0 .38Q1.8 .28 2.0 -.72Z" fill="${ink}"/>` +
    `<path d="M0 .4L.48 1.25H-.48Z" fill="${ink}"/><path d="M-1.45 1.9H1.45M-1 1.65V2.55M-.5 1.65V2.65M0 1.65V2.7M.5 1.65V2.65M1 1.65V2.55" stroke="${ink}" stroke-width=".2"/>` +
    // a crack across the crown
    `<path d="M.75 -3.0L.5 -2.45L.95 -2.05L.7 -1.55" fill="none" stroke="${ink}" stroke-width=".17" stroke-linejoin="round"/>` +
    `<path d="M-2.2 -1.9C-1.8 -2.6 -1.1 -2.75 -.4 -2.75" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width=".3" stroke-linecap="round"/>` + glint(-1.3, -2.35, 0.5) + `</g>`;
}
function revenge(d: D, o: EmblemOpts): { back: string; ring: string; field: string; front: string } {
  const [, , bd] = d.B, red = o.solid, dark = mix(o.solid, '#000000', 0.55);
  let back = '';
  const tongues: [number, number, number][] = [[28, 6.2, 2.6], [52, 6.4, 3.0], [76, 6.6, 3.2], [100, 6.4, 3.2], [124, 5.8, 3.0], [148, 5.0, 2.8], [170, 3.8, 2.4]];
  for (const side of [1, -1]) for (const [a, L, w] of tongues) {
    const [x, y] = pol(8.6, a * side), rot = a * side * 0.5;
    back += flame(d, x, y, rot, L, w, side, red, dark);
  }
  // sparks flying off the blaze
  for (const [r0, a, s] of [[12.6, 62, 0.34], [13.2, 88, 0.26], [12.4, 112, 0.3], [12.8, -70, 0.3], [13.1, -96, 0.26], [12.3, -118, 0.32]] as const) {
    const [x, y] = pol(r0, a);
    back += `<path d="M${f(x)} ${f(y - s * 1.6)}Q${f(x + s * 0.3)} ${f(y - s * 0.3)} ${f(x + s)} ${f(y)}Q${f(x + s * 0.3)} ${f(y + s * 0.3)} ${f(x)} ${f(y + s * 1.2)}Q${f(x - s * 0.3)} ${f(y + s * 0.3)} ${f(x - s)} ${f(y)}Q${f(x - s * 0.3)} ${f(y - s * 0.3)} ${f(x)} ${f(y - s * 1.6)}Z" fill="#f6c45e" stroke="${dark}" stroke-width=".17"/>`;
  }
  // the rope ring
  // the rope ring: laid strands, each lit or shaded by where it faces, a dark groove between them, a gleam on the lit ones
  const bl = d.B[0], cid = uid(d, 'c');
  d.defs.push(`<clipPath id="${cid}"><path d="${annulus(8.22, 9.28)}" clip-rule="evenodd"/></clipPath>`);
  let rope = `<path d="${annulus(8.22, 9.28)}" fill-rule="evenodd" fill="${mix(bd, '#000000', 0.3)}"/>`, gleams = '';
  for (let i = 0; i < 40; i++) {
    const a = i * 9, k = (1 - lit(a)) / 2, [x, y] = pol(8.75, a);
    rope += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.0" ry=".46" transform="rotate(${f(a - 48)} ${f(x)} ${f(y)})" fill="${mix(bl, bd, 0.1 + k * 0.75)}" stroke="${mix(bd, '#000000', 0.2)}" stroke-width=".17"/>`;
    // the strand's light on its upper side
    const [hx, hy] = pol(8.62, a - 0.8), r = (a - 48) * Math.PI / 180;
    if (lit(a) > -0.5) gleams += `M${f(hx - Math.cos(r) * 0.42)} ${f(hy - Math.sin(r) * 0.42)}L${f(hx + Math.cos(r) * 0.42)} ${f(hy + Math.sin(r) * 0.42)}`;
  }
  const rg = `<g clip-path="url(#${cid})">${rope}<path d="${gleams}" stroke="#fff4d0" stroke-width=".2" stroke-linecap="round"/></g>` +
    circ(0, 0, 9.3, `fill="none" stroke="${bd}" stroke-width=".22"`) + circ(0, 0, 8.2, `fill="none" stroke="${bd}" stroke-width=".22"`);
  // the field: a blaze of rays round the letter
  let fl = field(rad(d, [[0, mix(red, '#ffffff', 0.12)], [0.65, red], [1, mix(red, '#000000', 0.35)]]), bd);
  let rays = '';
  for (let i = 0; i < 24; i++) { const a = i * 15 + 7.5; rays += poly([pol(7.5, a - 3.2), pol(7.5, a + 3.2), pol(2.2, a)]); }
  fl += `<path d="${rays}" fill="${mix(red, '#000000', 0.22)}"/>`;
  const front = skull(d, 0, -11.25, '#efe2c2', '#2a120a');
  return { back, ring: rg, field: fl + fieldRule(), front };
}

// ---- the Endeavour: the Company's arms, the crown, the crossed anchors ----
function anchor(d: D, rot: number): string {
  const line = '#15181c', iron = lin(d, [[0, '#c4cad2'], [0.35, '#8a9098'], [0.7, '#4a5058'], [1, '#262a30']], 1, 0);
  // the shank swelling towards the crown, the arms, the flukes, the crown's point, the ring and the wooden stock
  const shank = 'M-.4 -12.6H.4L.62 12.6L0 13.35L-.62 12.6Z';
  const arms = 'M-3.9 9.7C-3.7 12.3 -1.8 13.5 0 13.5C1.8 13.5 3.7 12.3 3.9 9.7';
  const palm = (s: number) => `M${f(s * 3.9)} 9.7L${f(s * 5.0)} 10.3L${f(s * 4.6)} 7.7L${f(s * 3.0)} 10.4Z`;
  const rope = 'M.5 -12.85C2.3 -12.75 2.1 -11.1 .25 -10.7C-1.7 -10.3 -1.75 -8.9 -.2 -8.5';
  let g = `<g transform="translate(.45 .65)"><path d="M0 -12.4V12.4${arms}" fill="none" stroke="${SHADE}" stroke-opacity=".22" stroke-width="1.25"/></g>`;
  g += `<path d="${shank}" fill="${iron}" stroke="${line}" stroke-width=".26" stroke-linejoin="round"/>` + hatch(d, shank, [0.05, -12.6, 0.62, 13.35], 0.36, -35, 0.17, line, 0.7);
  g += `<path d="${arms}" fill="none" stroke="${line}" stroke-width="1.3" stroke-linecap="round"/><path d="${arms}" fill="none" stroke="#6a7078" stroke-width=".85" stroke-linecap="round"/>` +
    `<path d="M-3.75 10.0C-3.5 12.0 -1.8 13.05 0 13.05C1.8 13.05 3.5 12.0 3.75 10.0" fill="none" stroke="#c4cad2" stroke-width=".2" stroke-linecap="round"/>`;
  for (const sd of [-1, 1]) {
    g += `<path d="${palm(sd)}" fill="${lin(d, [[0, '#9aa0a8'], [1, '#3a4048']])}" stroke="${line}" stroke-width=".26" stroke-linejoin="round"/>` +
      hatch(d, palm(sd), sd > 0 ? [3.9, 7.7, 5.0, 10.4] : [-5.0, 7.7, -3.9, 10.4], 0.36, 60, 0.17, line, 0.6);
  }
  g += `<path d="M-3.9 10.1L-4.5 8.2M3.9 10.1L4.5 8.2" stroke="#d4dae2" stroke-width=".2"/>`;
  g += circ(0, -13.55, 1.05, `fill="none" stroke="${line}" stroke-width=".72"`) + circ(0, -13.55, 1.05, `fill="none" stroke="#7a8088" stroke-width=".36"`) +
    `<path d="M-.95 -13.95A1.05 1.05 0 0 1 .3 -14.55" fill="none" stroke="#e4e8ee" stroke-width=".17" stroke-linecap="round"/>`;
  // the cable bent to the ring, lying round the shank
  g += `<path d="${rope}" fill="none" stroke="${SHADE}" stroke-width=".72" stroke-linecap="round"/><path d="${rope}" fill="none" stroke="#c8a464" stroke-width=".44" stroke-linecap="round"/>` +
    `<path d="${rope}" fill="none" stroke="#6a4818" stroke-width=".44" stroke-dasharray=".17 .3"/>`;
  const stock = 'M-3.6 -11.6Q-3.6 -12.05 -3.15 -12.05H3.15Q3.6 -12.05 3.6 -11.6V-11.45Q3.6 -11 3.15 -11H-3.15Q-3.6 -11 -3.6 -11.45Z';
  g += `<path d="${stock}" fill="${lin(d, [[0, '#b8804a'], [0.45, '#7a4c24'], [1, '#2e1a0a']], 0, 1)}" stroke="${line}" stroke-width=".24"/>` +
    `<path d="M-3.2 -11.72H-2.75M-2.45 -11.72H2.45M2.75 -11.72H3.2M-2.0 -11.3H1.6" stroke="#4a2a10" stroke-width=".17"/><path d="M-3.1 -11.88H3.1" stroke="#e0b07a" stroke-width=".17"/>` +
    `<path d="M-2.6 -12.05V-11M2.6 -12.05V-11" stroke="#8a9098" stroke-width=".4"/>` + circ(-3.75, -11.52, 0.4, `fill="#6a7078" stroke="${line}" stroke-width=".18"`) + circ(3.75, -11.52, 0.4, `fill="#6a7078" stroke="${line}" stroke-width=".18"`);
  return `<g transform="rotate(${rot})">${g}</g>`;
}
function crown(d: D, cy: number): string {
  const [bl, bm, bd] = d.B, gold = lin(d, [[0, bl], [0.5, bm], [1, bd]], 0, 1);
  const band = `M-4.6 ${cy + 0.2}Q0 ${cy - 0.6} 4.6 ${cy + 0.2}V${cy + 1.75}Q0 ${cy + 0.95} -4.6 ${cy + 1.75}Z`;
  const arches = `M-4.3 ${cy + 0.1}C-4.6 ${cy - 2.4} -1.4 ${cy - 3.2} 0 ${cy - 2.7}C1.4 ${cy - 3.2} 4.6 ${cy - 2.4} 4.3 ${cy + 0.1}`;
  const cap = `${arches}Q0 ${cy - 0.7} -4.3 ${cy + 0.1}Z`;
  let s = `<path d="${cap}" fill="#1a0e04" fill-opacity=".25" transform="translate(.4 .6)"/><path d="${band}" fill="#1a0e04" fill-opacity=".25" transform="translate(.4 .6)"/>`;
  s += `<path d="${cap}" fill="${lin(d, [[0, '#a8322a'], [1, '#5a120c']])}" stroke="${bd}" stroke-width=".22"/>`;
  s += hatch(d, cap, [-4.3, cy - 3.2, 4.3, cy + 0.2], 0.45, 90, 0.17, '#3a0a06', 0.75) + hatch(d, cap, [1.2, cy - 3.2, 4.3, cy + 0.2], 0.45, 30, 0.17, '#3a0a06', 0.6);
  // the arches (one in front, two at the sides), pearls on them
  s += `<path d="${arches}M0 ${cy - 2.7}V${cy - 0.2}" fill="none" stroke="${bd}" stroke-width=".9"/><path d="${arches}M0 ${cy - 2.7}V${cy - 0.2}" fill="none" stroke="${bm}" stroke-width=".5"/>`;
  for (const t of [0.25, 0.5, 0.75]) for (const sd of [-1, 1]) { const x = sd * 4.3 * (1 - t) * 0.95, y = cy - 2.6 * Math.sin(t * Math.PI / 1.1) - 0.1; s += circ(x, y, 0.22, 'fill="#fffaf0"'); }
  // the orb and the cross
  s += circ(0, cy - 3.2, 0.62, `fill="${gold}" stroke="${bd}" stroke-width=".2"`) + `<path d="M0 ${f(cy - 3.8)}V${f(cy - 4.3)}M-.36 ${f(cy - 4.05)}H.36" stroke="${bd}" stroke-width=".42" stroke-linecap="round"/>`;
  // the band with its jewels and the fleurons on it
  for (const sd of [-1, 0, 1]) {
    const x = sd * 2.8, y = cy - 0.2 + Math.abs(sd) * 0.15;
    s += `<path d="M${f(x)} ${f(y - 1.25)}C${f(x + 0.55)} ${f(y - 0.75)} ${f(x + 0.45)} ${f(y - 0.25)} ${f(x)} ${f(y + 0.1)}C${f(x - 0.45)} ${f(y - 0.25)} ${f(x - 0.55)} ${f(y - 0.75)} ${f(x)} ${f(y - 1.25)}Z" fill="${gold}" stroke="${bd}" stroke-width=".2"/>`;
  }
  s += `<path d="${band}" fill="${gold}" stroke="${bd}" stroke-width=".26"/>`;
  // the band's lower edge turned away from the light: hatched; its upper edge lit
  s += hatch(d, band, [-4.6, cy + 0.95, 4.6, cy + 1.8], 0.32, 0, 0.17, bd, 0.8);
  s += `<path d="M-4.4 ${cy + 0.55}Q0 ${cy - 0.2} 4.4 ${cy + 0.55}" fill="none" stroke="#fff4c8" stroke-width=".2" stroke-opacity=".8"/>`;
  const jewels: [number, string][] = [[-3.1, '#1f3a6a'], [-1.55, '#9a1f14'], [0, '#1f5a3a'], [1.55, '#9a1f14'], [3.1, '#1f3a6a']];
  for (const [x, c] of jewels) {
    const y = f(cy + 0.95 - Math.abs(x) * 0.03);
    s += `<ellipse cx="${x}" cy="${y}" rx="${x === 0 ? 0.5 : 0.36}" ry=".36" fill="${c}" stroke="${bd}" stroke-width=".17"/>` + circ(x - 0.12, +y - 0.12, 0.11, 'fill="#ffffff"');
  }
  s += glint(-0.22, cy - 3.42, 0.42) + glint(-3.4, cy + 0.35, 0.5);
  return s;
}
function endeavour(d: D, o: EmblemOpts): { back: string; ring: string; field: string; front: string } {
  const [, , bd] = d.B, gules = '#8a2018', azure = '#1f3456', ink = '#2a1a08';
  const back = anchor(d, -42) + anchor(d, 42);
  // a reeded coin edge
  // a reeded coin edge: each reed a lit ridge and a dark groove, the grooves deeper on the side away from the light
  let ridges = '', grooves = '';
  for (let i = 0; i < 72; i++) {
    const a = i * 5, k = (1 - lit(a)) / 2;
    ridges += `M${P(pol(8.3, a - 1.2))}L${P(pol(9.2, a - 1.2))}`;
    grooves += `<path d="M${P(pol(8.3, a + 1.2))}L${P(pol(9.2, a + 1.2))}" stroke="${mix(bd, '#000000', 0.2)}" stroke-width="${f(0.17 + k * 0.12)}"/>`;
  }
  const rg = `<path d="${ridges}" stroke="#fff2c4" stroke-width=".17" stroke-opacity=".85"/>${grooves}`;
  // the field and the shield on it
  let fl = field(rad(d, [[0, mix(o.solid, '#ffffff', 0.08)], [0.7, o.solid], [1, o.deep]]), bd);
  const fc = uid(d, 'c'); d.defs.push(`<clipPath id="${fc}"><path d="${circleD(7.5)}"/></clipPath>`);
  const diaper = hatchLines([-7.5, -7.5, 7.5, 7.5], 1.0, 45) + hatchLines([-7.5, -7.5, 7.5, 7.5], 1.0, 135);
  fl += `<g clip-path="url(#${fc})"><path d="${diaper}" stroke="${o.deep}" stroke-width=".2" stroke-opacity=".8"/></g>`;
  const shield = 'M-5 -5.4H5V.9C5 4.1 2.6 6.1 0 7.1C-2.6 6.1 -5 4.1 -5 .9Z';
  const chief = 'M-5 -5.4H5V-3.45H-5Z';
  fl += `<path d="${shield}" fill="#1a0e04" fill-opacity=".35" transform="translate(.35 .5)"/>`;
  fl += `<path d="${shield}" fill="${lin(d, [[0, mix(gules, '#ffffff', 0.12)], [1, mix(gules, '#000000', 0.3)]])}"/>`;
  fl += hatch(d, shield, [-5, -5.4, 5, 7.1], 0.62, 90, 0.18, mix(gules, '#000000', 0.45), 0.8);
  fl += `<path d="${chief}" fill="${azure}"/>` + hatch(d, chief, [-5, -5.4, 5, -3.45], 0.5, 0, 0.18, '#0c1a30', 0.9);
  for (const x of [-2.9, 0, 2.9]) fl += circ(x + 0.12, -4.28, 0.62, `fill="${SHADE}" fill-opacity=".45"`) + circ(x, -4.42, 0.62, `fill="${lin(d, [[0, '#fbe6a4'], [1, '#a87a2a']])}" stroke="${ink}" stroke-width=".17"`) + circ(x - 0.2, -4.62, 0.13, 'fill="#ffffff"');
  // the shield's gilt rim, raised: lit at the upper left, shaded at the lower right
  const sc = uid(d, 'c');
  d.defs.push(`<clipPath id="${sc}"><path d="${shield}"/></clipPath>`);
  fl += `<path d="M-5 -3.45H5" stroke="${d.B[1]}" stroke-width=".3"/>` +
    `<g clip-path="url(#${sc})"><path d="${shield}" fill="none" stroke="${lin(d, [[0, mix(d.B[0], '#ffffff', 0.4)], [0.5, d.B[1]], [1, d.B[2]]])}" stroke-width="1.0"/></g>` +
    `<path d="${shield}" fill="none" stroke="${ink}" stroke-width=".2"/><path d="${shield}" fill="none" stroke="${ink}" stroke-width=".17" stroke-opacity=".6" transform="translate(0 .2) scale(.9)"/>`;
  fl += `<path d="M-4.2 -2.9V.9C-4.2 3.4 -2.5 5.1 -.4 6.0" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width=".25"/>` + glint(-4.55, -4.95, 0.6);
  return { back, ring: rg, field: fl + fieldRule(CREAM, 0.45), front: crown(d, -9.75) };
}

// ---- the Dutchman: the wheel, the scallop, the kelp, the barnacles ----
function kelp(d: D, pts: [number, number][], w0: number, w1: number, seed: number): string {
  // a frond along a polyline-ish spine (Catmull-Rom sampled), its edges rippled; the midrib lighter
  const spine = spline(pts);
  const L: [number, number][] = [], Rr: [number, number][] = [], n = spine.length;
  spine.forEach((p, i) => {
    const q = spine[Math.min(n - 1, i + 1)], o = spine[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, t = i / (n - 1);
    const w = (w0 + (w1 - w0) * t) * (i === n - 1 ? 0.15 : 1) * (1 + 0.38 * Math.sin(i * 1.15 + seed));
    L.push([p[0] - dy / l * w, p[1] + dx / l * w]); Rr.push([p[0] + dy / l * w * (1 + 0.2 * Math.cos(i * 1.7 + seed)), p[1] - dx / l * w * (1 + 0.2 * Math.cos(i * 1.7 + seed))]);
  });
  const outline = 'M' + L.map(P).join('L') + 'L' + Rr.reverse().map(P).join('L') + 'Z';
  const mid = 'M' + spine.map(P).join('L');
  return `<path d="${outline}" fill="#1a0e04" fill-opacity=".25" transform="translate(.4 .55)"/>` +
    `<path d="${outline}" fill="${lin(d, [[0, '#8a8e48'], [0.5, '#5a6228'], [1, '#2e3614']])}" stroke="#1f2a10" stroke-width=".24" stroke-linejoin="round"/>` +
    `<path d="${mid}" fill="none" stroke="#c4cc8a" stroke-width=".22" stroke-linecap="round"/>` +
    // the frond's shaded half veined in fine strokes
    `<path d="${spine.filter((_, i) => i % 2 === 1 && i < n - 2).map((p, i) => { const q = spine[Math.min(n - 1, i * 2 + 2)], o = spine[i * 2], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * (i * 2 + 1) / (n - 1)) * 0.8; return `M${P(p)}L${f(p[0] + (dy / l + dx / l * 0.6) * w)} ${f(p[1] + (-dx / l + dy / l * 0.6) * w)}`; }).join('')}" stroke="#1f2a10" stroke-width=".17" stroke-opacity=".7"/>` +
    // air bladders along the midrib, in pairs
    spine.filter((_, i) => i > 3 && i < n - 4 && i % 7 === 3).map((p, k) => circ(p[0] + (k % 2 ? 0.25 : -0.25), p[1], 0.5, `fill="${rad(d, [[0, '#c8c878'], [1, '#56602a']], 0.35, 0.3, 0.8)}" stroke="#1f2a10" stroke-width=".18"`)).join('');
}
function scallop(d: D, cx: number, cy: number, s: number, rot = 0): string {
  // hinge at (cx, cy), the fan opening upward to radius 4.4·s
  const n = 9, R0 = 4.4, edge: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = -62 + i * 124 / n, p = pol(R0, a);
    if (i === 0) edge.push(`M${P(p)}`);
    else { const m = pol(R0 + 0.55, a - 62 / n); edge.push(`Q${P(m)} ${P(p)}`); }
  }
  const fan = `M0 0L${P(pol(R0, -62))}${edge.slice(1).join('')}Z`;
  let ribs = '';
  for (let i = 0; i <= n; i++) ribs += `M0 -.3L${P(pol(R0 - 0.1, -62 + i * 124 / n))}`;
  const ears = 'M-.25 0L-1.9 -.15L-1.7 -1.2L-.5 -1.1ZM.25 0L1.9 -.15L1.7 -1.2L.5 -1.1Z';
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${rot}) scale(${s})">` +
    `<path d="${fan}" fill="#1a0e04" fill-opacity=".28" transform="translate(.4 .55)"/>` +
    `<path d="${ears}" fill="#e6d2ac" stroke="#4a3018" stroke-width=".22"/>` +
    `<path d="${fan}" fill="${rad(d, [[0, '#fff6e2'], [0.6, '#ecd6b0'], [1, '#c09868']], 0.35, 0.7, 0.9)}" stroke="#4a3018" stroke-width=".26" stroke-linejoin="round"/>` +
    `<path d="${ribs}" stroke="#7a5432" stroke-width=".2"/>` + hatch(d, fan, [0, -4.8, 4.8, 0], 0.55, -20, 0.17, '#7a5432', 0.6) + `</g>`;
}
function whelk(cx: number, cy: number, rot: number): string {
  const body = 'M-1.3 -.2C-1.4 -1.4 -.4 -2.4 .8 -2.6C1.1 -1.6 1.6 -.6 1.5 .5C1.3 1.6 .2 2.2 -.6 1.8C-1.2 1.4 -1.25 .6 -1.3 -.2Z';
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${rot})"><path d="${body}" fill="#1a0e04" fill-opacity=".28" transform="translate(.35 .5)"/>` +
    `<path d="${body}" fill="#e8d6b2" stroke="#4a3018" stroke-width=".24"/>` +
    `<path d="M-1.2 -.6C-.4 -1.2 .6 -1.6 1.0 -1.95M-1.25 .4C-.2 -.2 1.0 -.5 1.5 -.4M-1 1.3C-.1 .9 .8 .7 1.35 .8" fill="none" stroke="#7a5432" stroke-width=".2"/>` +
    `<path d="M-.4 .7C.1 1.0 .5 .9 .7 .5" fill="none" stroke="#4a3018" stroke-width=".22"/></g>`;
}
/** a sea-beast's arm along the points: tapering to a curled tip, its suckers on the side `side` (±1 of the spine's
 *  normal), the shaded half engraved in strokes across it, a gleam along the lit half */
function tentacle(d: D, pts: [number, number][], w0: number, side: 1 | -1): string {
  const sp = spline(pts, 10), n = sp.length, L: [number, number][] = [], Rr: [number, number][] = [], nm: [number, number][] = [], ws: number[] = [];
  sp.forEach((p, i) => {
    const q = sp[Math.min(n - 1, i + 1)], o = sp[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, t = i / (n - 1);
    const w = Math.max(0.1, w0 * Math.pow(1 - t, 0.75));
    nm.push([-dy / l, dx / l]); ws.push(w);
    L.push([p[0] - dy / l * w, p[1] + dx / l * w]); Rr.push([p[0] + dy / l * w, p[1] - dx / l * w]);
  });
  const outline = 'M' + L.map(P).join('L') + 'L' + Rr.slice().reverse().map(P).join('L') + 'Z';
  const flesh = '#8e5e58', deep = '#3a1c18';
  let s = softShadow(outline, 1.1) + `<path d="${outline}" fill="${lin(d, [[0, '#c8948a'], [0.5, flesh], [1, '#5e3632']])}"/>`;
  // the round of the arm engraved along it: two lines following its shaded flank (the side whose normal turns from the
  // light), a gleam along the lit one; ringed creases across it here and there
  const along = (k: number, to: number) => { let q = ''; sp.forEach((p, i) => { if (i < 1 || i > n * to) return; const [nx, ny] = nm[i], aw = nx + ny > 0 ? 1 : -1; q += `${q ? 'L' : 'M'}${f(p[0] + nx * aw * ws[i] * k)} ${f(p[1] + ny * aw * ws[i] * k)}`; }); return q; };
  let cr = '';
  for (let i = 4; i < n * 0.7; i += 5) { const p = sp[i], [nx, ny] = nm[i], w = ws[i] * 0.92; cr += `M${f(p[0] + nx * w)} ${f(p[1] + ny * w)}Q${f(p[0] + (sp[i + 1][0] - p[0]) * 1.2)} ${f(p[1] + (sp[i + 1][1] - p[1]) * 1.2)} ${f(p[0] - nx * w)} ${f(p[1] - ny * w)}`; }
  s += `<path d="${along(0.5, 0.8)}${along(0.76, 0.86)}" fill="none" stroke="${deep}" stroke-width=".17" stroke-opacity=".8"/><path d="${cr}" fill="none" stroke="${deep}" stroke-width=".17" stroke-opacity=".45"/>` +
    `<path d="${along(-0.45, 0.82)}" fill="none" stroke="#f2d2c6" stroke-width=".24" stroke-linecap="round"/>`;
  s += `<path d="${outline}" fill="none" stroke="#24100c" stroke-width=".26" stroke-linejoin="round"/>`;
  // the suckers along one edge, smaller towards the tip
  for (let i = 3; i < n - 6; i += 3) {
    const p = sp[i], [nx, ny] = nm[i], w = ws[i], r = Math.max(0.2, w * 0.4), x = p[0] + nx * side * w * 0.98, y = p[1] + ny * side * w * 0.98;
    s += circ(x, y, r, `fill="#ecd2c0" stroke="${deep}" stroke-width=".17"`) + circ(x + nx * side * r * 0.2, y + ny * side * r * 0.2, r * 0.45, `fill="#7a4440"`);
  }
  return s;
}
function dutch(d: D, o: EmblemOpts): { back: string; ring: string; field: string; front: string } {
  const [bl, bm, bd] = d.B, green = o.solid, wood = lin(d, [[0, '#a8743e'], [0.5, '#6e4520'], [1, '#2e1a0a']]);
  // the spokes' turned handles behind the rim
  const handle = 'M-.45 -9.4L-.45 -10.5L-.8 -10.7L-.8 -11.0L-.5 -11.2C-1.0 -11.7 -1.0 -12.5 -.55 -13.0C-.7 -13.35 -.6 -13.95 0 -14.05C.6 -13.95 .7 -13.35 .55 -13.0C1.0 -12.5 1.0 -11.7 .5 -11.2L.8 -11.0L.8 -10.7L.45 -10.5L.45 -9.4Z';
  let back = '';
  for (let i = 0; i < 8; i++) {
    const a = 22.5 + i * 45;
    back += `<g transform="rotate(${a})"><path d="${handle}" fill="#1a0e04" fill-opacity=".25" transform="rotate(${-a}) translate(.4 .55) rotate(${a})"/><path d="${handle}" fill="${lin(d, [[0, '#b07a42'], [0.45, '#7a4c24'], [1, '#2e1a0a']], 1, 0)}" stroke="#1e1006" stroke-width=".24" stroke-linejoin="round"/>` +
      hatch(d, handle, [0.1, -14.05, 1.0, -9.4], 0.34, 35, 0.17, '#1e1006', 0.65) +
      `<path d="M-.3 -11.5C-.55 -12 -.5 -12.5 -.25 -12.85" fill="none" stroke="#e8c08a" stroke-width=".22" stroke-linecap="round"/><path d="M-.8 -10.85H.8" stroke="${bm}" stroke-width=".3"/><path d="M-.62 -13.0H.62" stroke="#1e1006" stroke-width=".17"/></g>`;
  }
  // the kelp climbing up the right side; two arms of the deep rising from under the wheel and coiling round it over the
  // spokes, their suckers inwards — the left one up to the ten o'clock spoke, the right one to the three o'clock
  back += kelp(d, [[11.4, 4.8], [12.6, 0.6], [12.2, -1.4], [13.6, -5.0], [11.0, -8.8]], 0.85, 0.38, 2.7);
  back += tentacle(d, [[-2.4, 6.4], [-6.2, 10.2], [-10.0, 9.0], [-12.0, 5.2], [-12.4, 0.8], [-11.9, -3.6], [-10.4, -6.9], [-8.8, -6.5], [-9.15, -5.1], [-10.2, -5.35]], 0.98, 1);
  back += tentacle(d, [[2.6, 6.6], [6.4, 10.2], [10.2, 8.8], [12.1, 5.0], [12.3, 0.6], [11.2, -2.2], [9.95, -1.6], [10.15, -0.35], [11.0, -0.6]], 0.9, -1);
  // the rim: wood between brass bands, its grain, the brass studs, barnacles
  let rg = `<path d="${arc(8.5, 200, 262)}${arc(9.0, 276, 345)}${arc(8.6, 8, 72)}${arc(8.95, 96, 152)}${arc(8.45, 150, 192)}${arc(8.8, 225, 300)}${arc(8.4, 300, 350)}${arc(8.75, 40, 110)}${arc(8.4, 112, 140)}" fill="none" stroke="#1e1006" stroke-width=".18" stroke-opacity=".75"/>`;
  rg += `<path d="${arc(8.9, 160, 200)}${arc(8.65, 245, 280)}${arc(8.85, 350, 380)}" fill="none" stroke="#c89060" stroke-width=".17" stroke-opacity=".8"/>`;
  for (let i = 0; i < 8; i++) { const [x, y] = pol(8.75, 22.5 + i * 45); rg += circ(x + 0.12, y + 0.16, 0.46, `fill="${SHADE}" fill-opacity=".4"`) + circ(x, y, 0.46, `fill="${rad(d, [[0, bl], [0.6, bm], [1, bd]], 0.35, 0.3, 0.8)}" stroke="${bd}" stroke-width=".18"`) + circ(x - 0.15, y - 0.15, 0.12, 'fill="#fffbe8"'); }
  for (const [r0, a, s] of [[8.7, 118, 0.62], [9.3, 128, 0.48], [8.5, 133, 0.5], [9.15, 140, 0.4], [8.75, 103, 0.42]] as const) {
    const [x, y] = pol(r0, a);
    // a barnacle: a low cone of plates round a dark mouth
    let plates = '';
    for (let k = 0; k < 6; k++) { const q = pol(s, k * 60 + 15), m = pol(s * 0.42, k * 60 + 15); plates += `M${f(x + q[0])} ${f(y + q[1])}L${f(x + m[0] - s * 0.1)} ${f(y + m[1] - s * 0.1)}`; }
    rg += circ(x + 0.15, y + 0.2, s, 'fill="#1a0e04" fill-opacity=".35"') + circ(x, y, s, `fill="${rad(d, [[0, '#f4ecd8'], [0.7, '#ddd3ba'], [1, '#9a8e72']], 0.35, 0.3, 0.8)}" stroke="#3a3020" stroke-width=".18"`) +
      `<path d="${plates}" stroke="#6a5e44" stroke-width=".17"/>` + circ(x - s * 0.1, y - s * 0.1, s * 0.36, 'fill="#3a3020"');
  }
  // the field: the spokes and the hub under the letter, in the field's own shade
  let fl = field(rad(d, [[0, mix(green, '#ffffff', 0.1)], [0.7, green], [1, mix(green, '#000000', 0.35)]]), bd);
  const sh = mix(green, '#000000', 0.28);
  let spokes = '';
  for (let i = 0; i < 8; i++) spokes += `M${P(pol(2.2, 22.5 + i * 45))}L${P(pol(7.6, 22.5 + i * 45))}`;
  fl += `<path d="${spokes}" stroke="${sh}" stroke-width="1.0"/><path d="${spokes}" stroke="${mix(green, '#ffffff', 0.12)}" stroke-width=".22" transform="translate(-.25 -.2)"/>` + circ(0, 0, 2.6, `fill="${sh}" stroke="${mix(green, '#000000', 0.45)}" stroke-width=".3"`);
  // the front: the scallop crowning it, the kelp climbing both sides, a whelk
  // the kelp climbing up behind, two arms of the deep coiling round the wheel from below, a whelk
  let front = `<path d="M-2 9.6C-2.4 11 -1.6 11.8 -2.2 13.1M.4 9.9C.9 11.1 .1 12 .6 13.4M2.6 9.4C2.4 10.6 3.2 11.4 2.8 12.6" fill="none" stroke="#3e4a1e" stroke-width=".3" stroke-linecap="round"/>`;
  front += whelk(-6.6, 7.9, -35);
  front += scallop(d, 0, -9.55, 1.0);
  return { back, ring: rg, field: fl + fieldRule(CREAM, 0.5), front };
}

const MOTIF: Record<ShipKey, (d: D, o: EmblemOpts) => { back: string; ring: string; field: string; front: string }> = { pearl, revenge, endeavour, dutch };
const RING: Record<ShipKey, (d: D) => [string, string]> = {
  pearl: d => [lin(d, [[0, d.B[0]], [0.5, d.B[1]], [1, d.B[2]]]), d.B[2]],
  revenge: d => [lin(d, [[0, d.B[0]], [0.5, d.B[1]], [1, d.B[2]]]), d.B[2]],
  endeavour: d => [lin(d, [[0, d.B[0]], [0.5, d.B[1]], [1, d.B[2]]]), d.B[2]],
  dutch: d => [lin(d, [[0, '#a8743e'], [0.5, '#6e4520'], [1, '#2e1a0a']]), '#1e1006']
};

/** the letter's box (the browser's line box) for a letter of `size` pt centred at cy */
export function letterBox(letter: string, size: number, cx: number, cy: number) {
  // the width from the browser once measured; until then (and as a floor) the widest capital, Ж, at ≈ 1.0 em
  const em = pt(size), base = cy + 0.33 * em, w = Math.max(widthOf(letter, size, LETTER_O), 1.02 * em);
  return { base, box: { x: cx - w / 2, y: base - BOX.up * em, w, h: (BOX.up + BOX.down) * em } };
}

/** the emblem of a ship: see the head of the file. Returns one <g> (data-deco when o.deco). */
export function emblemSvg(key: ShipKey, cx: number, cy: number, R: number, o: EmblemOpts): string {
  const d: D = { id: o.id + 'm', B: o.brass ?? BRASS, defs: [], n: 0 };
  const m = MOTIF[key](d, o), [rf, rl] = RING[key](d);
  const body = m.back + ring(d, rf, rl, d.B) + m.ring + ringLight(rl, key === 'dutch' ? '#f0d8a8' : '#fff6d8') + m.field + fieldShade(d) + m.front;
  const size = o.size ?? 19, { base, box } = letterBox(o.letter, size, cx, cy);
  const plate = o.plate ? `<rect data-plate="${o.plate}" x="${f(box.x - 1.65)}" y="${f(box.y - 1.65)}" width="${f(box.w + 3.3)}" height="${f(box.h + 3.3)}" fill="none" stroke="none"/>` : '';
  const dark = key === 'pearl' ? '#0a0806' : mix(o.solid, '#000000', 0.6);
  // the dark outline as eight filled copies round the letter (a stroked text would be set as a Type 3 font in the PDF)
  const halo = pt(size) * 0.035, glyph = (x: number, y: number, fill: string, attr = '') => `<text${attr} x="${f(x)}" y="${f(y)}" font-family="Alegreya SC" font-weight="800" font-size="${f(pt(size))}" fill="${fill}" text-anchor="middle">${esc(o.letter)}</text>`;
  const letter = Array.from({ length: 8 }, (_, i) => glyph(cx + halo * Math.cos(i * Math.PI / 4), base + halo * Math.sin(i * Math.PI / 4), dark)).join('') + glyph(cx, base, CREAM, o.plate ? ` data-in="${o.plate}"` : '');
  return `<g${o.deco ? ` data-deco="${o.deco}"` : ''}><defs>${d.defs.join('')}</defs><g transform="translate(${f(cx)} ${f(cy)}) scale(${f(R / 10)})">${body}</g>${plate}${letter}</g>`;
}

// ---- the side's ribbon ----
export type Side = 'pirates' | 'company';
export const sideOf = (word: string): Side => /КОМП/i.test(word) ? 'company' : 'pirates';
/** the side's colours: the ink of its word, its flag's field and stripes */
export const SIDE_INK: Record<Side, { ink: string; back: string; stripe: string; light: string }> = {
  pirates: { ink: '#2b2420', back: '#2b2420', stripe: '#2b2420', light: '#f3ead6' },
  company: { ink: '#7c1d15', back: '#a8261c', stripe: '#a8261c', light: '#f6efe0' }
};
export const RIBBON_O: TO = { font: 'Alegreya SC', w: 800, ls: '.15em' };
const RIB_LS = 0.15;
export interface RibbonOpts {
  id: string;
  /** the word's size, pt (default 7) */
  size?: number;
  /** the face at least this wide, mm (the ribbon between the nests of the battle scheme) */
  minW?: number;
  variant?: 'scroll' | 'flag';
  /** the face's plate (data-plate; the word carries data-in) */
  plate?: string;
  deco?: string;
  paper?: string;
  brass?: [string, string, string];
}
interface RibbonGeo { fw: number; fh: number; tw: number; ls: number; em: number; flagW: number; out: number; up: number }
/** the measures of a ribbon: face (the plate) w × h, the whole thing's half-width and how far it rises over the face */
export function ribbonGeo(word: string, o: { size?: number; minW?: number; variant?: 'scroll' | 'flag' }): RibbonGeo & { total: number } {
  const size = o.size ?? 7, em = pt(size), tw = widthOf(word, size, RIBBON_O), ls = RIB_LS * em, variant = o.variant ?? 'scroll';
  const fh = (BOX.up + BOX.down) * em + 3.2;
  const flagW = variant === 'flag' ? fh * 0.78 : 0;
  const orn = variant === 'scroll' ? 1.6 : 1.1;
  const fw = Math.max(o.minW ?? 0, tw + ls + 2 * 1.55 + 2 * orn + flagW);
  const out = variant === 'scroll' ? fh * 0.44 : 1.9, up = variant === 'scroll' ? fh * 0.22 + SAG + 1.6 : 0;
  return { fw, fh, tw, ls, em, flagW, out, up, total: fw + 2 * out };
}
/** the ribbon with the side's word centred on (cx, cy): returns the svg, the whole extent and the face (the plate) */
export function sideRibbonSvg(word: string, side: Side, cx: number, cy: number, o: RibbonOpts): { svg: string; box: { x: number; y: number; w: number; h: number }; face: { x: number; y: number; w: number; h: number } } {
  const g = ribbonGeo(word, o), S = SIDE_INK[side], B = o.brass ?? BRASS, paper = o.paper ?? '#f4e8c8', variant = o.variant ?? 'scroll';
  const x0 = cx - g.fw / 2, x1 = cx + g.fw / 2, t = cy - g.fh / 2, b = cy + g.fh / 2, out: string[] = [], defs: string[] = [];
  const id = o.id + 'rb';
  const face = { x: x0, y: t, w: g.fw, h: g.fh };
  const textX = variant === 'flag' ? x0 + 1.0 + g.flagW + (g.fw - 1.0 - g.flagW) / 2 : cx;
  const word1 = `<text${o.plate ? ` data-in="${o.plate}"` : ''} x="${f(textX + g.ls / 2)}" y="${f(cy + 0.33 * g.em)}" font-family="Alegreya SC" font-weight="800" font-size="${f(g.em)}" letter-spacing="${RIB_LS}em" fill="${S.ink}" text-anchor="middle">${esc(word)}</text>`;
  const plate = o.plate ? `<rect data-plate="${o.plate}" x="${f(x0)}" y="${f(t)}" width="${f(g.fw)}" height="${f(g.fh)}" fill="none" stroke="none"/>` : '';
  defs.push(`<linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(paper, '#ffffff', 0.45)}"/><stop offset=".55" stop-color="${paper}"/><stop offset="1" stop-color="${mix(paper, '#7a5a2a', 0.22)}"/></linearGradient>`);
  // the ornaments either side of the word: a lozenge, a dot and a tapered rule
  const orn = (xa: number, dir: 1 | -1) => {
    const y = cy + 0.02, l = xa + dir * 0.9;
    return `<path d="M${f(xa)} ${f(y)}L${f(l)} ${f(y - 0.55)}L${f(xa + dir * 1.8)} ${f(y)}L${f(l)} ${f(y + 0.55)}Z" fill="${S.ink}"/>` + `<circle cx="${f(xa - dir * 0.55)}" cy="${f(y)}" r=".26" fill="${S.ink}"/>`;
  };
  const tw0 = g.tw - g.ls;
  if (variant === 'scroll') {
    // the face sags a little in the middle (a smile): its top runs t − SAG … t, its bottom b … b + SAG, so the plate
    // [t, b] stays inside it; the tails fold back behind its ends and fly up and out, forked
    const a = SAG;
    const th = g.fh * 0.84, d = g.fh * 0.22, tl = g.out, lift = 0.8;
    for (const sd of [-1, 1] as const) {
      const xe = sd < 0 ? x0 : x1, xi = xe - sd * 2.2, xo = xe + sd * tl, top = t - a - d, bot = top + th, notch = 1.4;
      const tail = `M${f(xi)} ${f(top)}C${f(xi + sd * tl * 0.5)} ${f(top - 0.7)} ${f(xe + sd * tl * 0.5)} ${f(top + 0.5)} ${f(xo)} ${f(top - lift)}L${f(xo - sd * notch)} ${f((top + bot) / 2 - lift + 0.2)}L${f(xo + sd * 0.3)} ${f(bot - lift)}C${f(xe + sd * tl * 0.5)} ${f(bot + 0.5)} ${f(xi + sd * tl * 0.5)} ${f(bot - 0.7)} ${f(xi)} ${f(bot)}Z`;
      const cid = `${id}t${sd < 0 ? 'l' : 'r'}`;
      defs.push(`<clipPath id="${cid}"><path d="${tail}"/></clipPath>`);
      // the tail's shadow on the paper, soft: two copies, the farther fainter
      out.push(`<path d="${tail}" fill="#1a0e04" fill-opacity=".12" transform="translate(.75 1.0)"/><path d="${tail}" fill="#1a0e04" fill-opacity=".24" transform="translate(.4 .55)"/>`);
      if (side === 'company') {
        let st = '';
        const n = 5, hh = th / n;
        for (let i = 0; i < n; i += 2) st += `<path d="M${f(xi)} ${f(top + i * hh)}C${f(xi + sd * tl * 0.5)} ${f(top - 0.7 + i * hh)} ${f(xe + sd * tl * 0.5)} ${f(top + 0.5 + i * hh)} ${f(xo + sd * 0.3)} ${f(top - lift + i * hh)}v${f(hh)}C${f(xe + sd * tl * 0.5)} ${f(top + 0.5 + (i + 1) * hh)} ${f(xi + sd * tl * 0.5)} ${f(top - 0.7 + (i + 1) * hh)} ${f(xi)} ${f(top + (i + 1) * hh)}Z" fill="${S.stripe}"/>`;
        out.push(`<path d="${tail}" fill="${S.light}"/><g clip-path="url(#${cid})">${st}</g>`);
      } else {
        const h = hatchLines([Math.min(xi, xo), top - lift - 0.7, Math.max(xi, xo), bot + 0.4], 0.55, sd > 0 ? 66 : 114);
        out.push(`<path d="${tail}" fill="${S.back}"/><g clip-path="url(#${cid})"><path d="${h}" stroke="#6a6058" stroke-width=".16"/></g>`);
      }
      // the tail's modelling: in shade where it goes back under the face (engraved strokes), a ripple across it half way
      // out (a dark and a light crease), a gleam along its upper edge
      const xm = xe + sd * tl * 0.5;
      out.push(`<g clip-path="url(#${cid})"><path d="${hatchLines([Math.min(xi, xe + sd * 1.3), top - 1.5, Math.max(xi, xe + sd * 1.3), bot + 1], 0.3, sd > 0 ? 100 : 80)}" stroke="#000000" stroke-width=".13" stroke-opacity=".55"/>` +
        `<path d="M${f(xm)} ${f(top - 0.2)}Q${f(xm + sd * 0.55)} ${f((top + bot) / 2)} ${f(xm + sd * 0.1)} ${f(bot + 0.4)}" fill="none" stroke="#000000" stroke-opacity=".5" stroke-width=".3"/>` +
        `<path d="M${f(xm - sd * 0.35)} ${f(top - 0.1)}Q${f(xm + sd * 0.2)} ${f((top + bot) / 2)} ${f(xm - sd * 0.25)} ${f(bot + 0.4)}" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width=".2"/></g>`);
      out.push(`<path d="M${f(xe + sd * 0.4)} ${f(top + 0.32)}C${f(xe + sd * tl * 0.5)} ${f(top + 0.75)} ${f(xe + sd * tl * 0.6)} ${f(top - lift + 0.5)} ${f(xo - sd * 0.25)} ${f(top - lift + 0.3)}" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width=".18" stroke-linecap="round"/>`);
      out.push(`<path d="${tail}" fill="none" stroke="#1a120a" stroke-width=".26" stroke-linejoin="round"/>`);
      // the fold: the inside of the turn, dark, from the face's end down to the tail's lower edge; its far side in
      // engraved strokes, a thin light on its crest
      const fold = `M${f(xe)} ${f(bot - 0.05)}L${f(xe)} ${f(b)}L${f(xe + sd * 1.6)} ${f(bot + 0.05)}Z`, fid = `${cid}f`;
      defs.push(`<clipPath id="${fid}"><path d="${fold}"/></clipPath>`);
      out.push(`<path d="${fold}" fill="${mix(S.back, '#000000', 0.5)}"/><g clip-path="url(#${fid})"><path d="${hatchLines([Math.min(xe, xe + sd * 1.6), bot - 0.2, Math.max(xe, xe + sd * 1.6), b + 0.2], 0.28, sd > 0 ? 45 : 135)}" stroke="#000000" stroke-width=".13" stroke-opacity=".7"/></g>` +
        `<path d="${fold}" fill="none" stroke="#1a120a" stroke-width=".2" stroke-linejoin="round"/><path d="M${f(xe + sd * 0.12)} ${f(bot + 0.15)}L${f(xe + sd * 0.12)} ${f(b - 0.15)}" stroke="${S.light}" stroke-opacity=".6" stroke-width=".14"/>`);
    }
    // the face: paper, the side's colour on its edges
    const faceD = `M${f(x0)} ${f(t - a)}Q${f(cx)} ${f(t + a)} ${f(x1)} ${f(t - a)}V${f(b)}Q${f(cx)} ${f(b + 2 * a)} ${f(x0)} ${f(b)}Z`;
    out.push(`<path d="${faceD}" fill="#1a0e04" fill-opacity=".1" transform="translate(.75 .95)"/><path d="${faceD}" fill="#1a0e04" fill-opacity=".22" transform="translate(.4 .45)"/>`);
    out.push(`<path d="${faceD}" fill="url(#${id}p)"/>`);
    // the face bends back into the folds at its ends: a shade gathering there, engraved strokes at the very ends
    // (clear of the ornaments), and a soft swell of light a little inside them
    defs.push(`<linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2410" stop-opacity=".42"/><stop offset=".07" stop-color="#3a2410" stop-opacity=".1"/><stop offset=".14" stop-color="#3a2410" stop-opacity="0"/>` +
      `<stop offset=".86" stop-color="#3a2410" stop-opacity="0"/><stop offset=".93" stop-color="#3a2410" stop-opacity=".1"/><stop offset="1" stop-color="#3a2410" stop-opacity=".42"/></linearGradient>`);
    defs.push(`<clipPath id="${id}fc"><path d="${faceD}"/></clipPath>`);
    const eh = (xa: number, xb: number) => hatchLines([xa, t - a - 0.5, xb, b + 2 * a + 0.5], 0.26, 92);
    out.push(`<path d="${faceD}" fill="url(#${id}e)"/><g clip-path="url(#${id}fc)"><path d="${eh(x0, x0 + 0.62)}${eh(x1 - 0.62, x1)}" stroke="#3a2410" stroke-width=".13" stroke-opacity=".6"/></g>`);
    out.push(`<path d="${faceD}" fill="none" stroke="#1a120a" stroke-width=".26"/>`);
    const along = (dy: number) => `M${f(x0)} ${f(t - a + dy)}Q${f(cx)} ${f(t + a + dy)} ${f(x1)} ${f(t - a + dy)}`;
    const H = b - t + a;
    out.push(`<path d="${along(0.55)}${along(H - 0.55)}" fill="none" stroke="${S.stripe}" stroke-width=".55"/><path d="${along(1.15)}${along(H - 1.15)}" fill="none" stroke="${S.stripe}" stroke-width=".16"/>`);
    out.push(`<path d="${along(0.22)}" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width=".2"/><path d="${along(H - 0.2)}" fill="none" stroke="#3a2410" stroke-opacity=".35" stroke-width=".2"/>`);
    out.push(orn(cx - tw0 / 2 - 0.95, -1) + orn(cx + tw0 / 2 + 0.95, 1));
  } else {
    // a cartouche with hollow corners and scrolled ends, the flag on a staff in it
    const k = 1.1, fr = (dd: number, kk: number) => `M${f(x0 + dd + kk)} ${f(t + dd)}H${f(x1 - dd - kk)}A${kk} ${kk} 0 0 0 ${f(x1 - dd)} ${f(t + dd + kk)}V${f(b - dd - kk)}A${kk} ${kk} 0 0 0 ${f(x1 - dd - kk)} ${f(b - dd)}H${f(x0 + dd + kk)}A${kk} ${kk} 0 0 0 ${f(x0 + dd)} ${f(b - dd - kk)}V${f(t + dd + kk)}A${kk} ${kk} 0 0 0 ${f(x0 + dd + kk)} ${f(t + dd)}Z`;
    for (const sd of [-1, 1] as const) {
      const xe = sd < 0 ? x0 : x1;
      const vol = `M${f(xe)} ${f(cy - 1.9)}C${f(xe + sd * 1.6)} ${f(cy - 2.1)} ${f(xe + sd * 2.0)} ${f(cy - 0.4)} ${f(xe + sd * 1.0)} ${f(cy - 0.1)}C${f(xe + sd * 0.4)} ${f(cy + 0.05)} ${f(xe + sd * 0.35)} ${f(cy - 0.75)} ${f(xe + sd * 0.85)} ${f(cy - 0.8)}` +
        `M${f(xe)} ${f(cy + 1.9)}C${f(xe + sd * 1.6)} ${f(cy + 2.1)} ${f(xe + sd * 2.0)} ${f(cy + 0.4)} ${f(xe + sd * 1.0)} ${f(cy + 0.1)}C${f(xe + sd * 0.4)} ${f(cy - 0.05)} ${f(xe + sd * 0.35)} ${f(cy + 0.75)} ${f(xe + sd * 0.85)} ${f(cy + 0.8)}`;
      out.push(`<path d="${vol}" fill="none" stroke="#1a120a" stroke-width=".55" stroke-linecap="round"/><path d="${vol}" fill="none" stroke="${B[1]}" stroke-width=".28" stroke-linecap="round"/>`);
    }
    out.push(`<path d="${fr(0, k)}" fill="#1a0e04" fill-opacity=".24" transform="translate(.4 .6)"/>`);
    out.push(`<path d="${fr(0, k)}" fill="url(#${id}p)" stroke="${S.ink}" stroke-width=".4"/><path d="${fr(0.75, 0.7)}" fill="none" stroke="${S.ink}" stroke-width=".18"/>`);
    for (const [qx, qy] of [[x0, t], [x1, t], [x0, b], [x1, b]]) out.push(`<circle cx="${f(qx)}" cy="${f(qy)}" r=".38" fill="${S.ink}"/>`);
    // the flag
    const sx = x0 + 1.75, top = t + 1.2, foot = b - 1.0, fw = g.flagW - 1.3, fh = (foot - top) * 0.6, ftop = top + 0.15;
    const fl = `M${f(sx)} ${f(ftop)}Q${f(sx + fw * 0.5)} ${f(ftop - 0.6)} ${f(sx + fw)} ${f(ftop + 0.15)}Q${f(sx + fw * 0.85)} ${f(ftop + fh * 0.5)} ${f(sx + fw + 0.05)} ${f(ftop + fh + 0.1)}Q${f(sx + fw * 0.5)} ${f(ftop + fh - 0.45)} ${f(sx)} ${f(ftop + fh)}Z`;
    defs.push(`<clipPath id="${id}f"><path d="${fl}"/></clipPath>`);
    if (side === 'pirates') {
      const fx = sx + fw * 0.52, fy = ftop + fh * 0.48, s = fh * 0.26;
      out.push(`<path d="${fl}" fill="${S.back}"/><path d="M${f(fx - s * 1.2)} ${f(fy + s * 1.25)}L${f(fx + s * 1.2)} ${f(fy + s * 0.15)}M${f(fx + s * 1.2)} ${f(fy + s * 1.25)}L${f(fx - s * 1.2)} ${f(fy + s * 0.15)}" stroke="${S.light}" stroke-width=".3" stroke-linecap="round"/>` +
        `<circle cx="${f(fx)}" cy="${f(fy - s * 0.25)}" r="${f(s * 0.72)}" fill="${S.light}"/><path d="M${f(fx - s * 0.32)} ${f(fy + s * 0.2)}h${f(s * 0.64)}v${f(s * 0.4)}h${f(-s * 0.64)}Z" fill="${S.light}"/>` +
        `<circle cx="${f(fx - s * 0.28)}" cy="${f(fy - s * 0.3)}" r="${f(s * 0.2)}" fill="${S.back}"/><circle cx="${f(fx + s * 0.28)}" cy="${f(fy - s * 0.3)}" r="${f(s * 0.2)}" fill="${S.back}"/>`);
    } else {
      let st = '';
      for (let i = 0; i < 7; i += 2) st += `<rect x="${f(sx - 1)}" y="${f(ftop - 1 + i * (fh + 2) / 7)}" width="${f(fw + 2)}" height="${f((fh + 2) / 7)}" fill="${S.stripe}"/>`;
      const cw = fw * 0.42, ch = fh * 0.5;
      out.push(`<path d="${fl}" fill="${S.light}"/><g clip-path="url(#${id}f)">${st}<rect x="${f(sx)}" y="${f(ftop - 1)}" width="${f(cw)}" height="${f(ch + 1)}" fill="${S.light}"/><path d="M${f(sx + cw / 2)} ${f(ftop - 1)}V${f(ftop + ch)}M${f(sx)} ${f(ftop + ch * 0.55)}H${f(sx + cw)}" stroke="${S.stripe}" stroke-width="${f(Math.max(0.3, fh * 0.13))}"/></g>`);
    }
    out.push(`<path d="${fl}" fill="none" stroke="#1a120a" stroke-width=".2"/>`);
    out.push(`<path d="M${f(sx)} ${f(foot)}V${f(top - 0.3)}" stroke="#3a2412" stroke-width=".42" stroke-linecap="round"/><circle cx="${f(sx)}" cy="${f(top - 0.45)}" r=".42" fill="${B[1]}" stroke="${B[2]}" stroke-width=".15"/>`);
    out.push(`<path d="M${f(sx - 0.8)} ${f(foot)}H${f(sx + 0.8)}" stroke="#3a2412" stroke-width=".35" stroke-linecap="round"/>`);
    out.push(orn(textX - tw0 / 2 - 0.95, -1).replace(/<path[^>]*\/>/, '') + orn(textX + tw0 / 2 + 0.95, 1).replace(/<path[^>]*\/>/, ''));
  }
  const minX = x0 - g.out - 0.3, maxX = x1 + g.out + 0.7, minY = t - g.up - 0.3, maxY = b + (variant === 'scroll' ? SAG : 0) + 0.6;
  return {
    svg: `<g${o.deco ? ` data-deco="${o.deco}"` : ''}><defs>${defs.join('')}</defs>${out.join('')}${plate}${word1}</g>`,
    box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, face
  };
}
