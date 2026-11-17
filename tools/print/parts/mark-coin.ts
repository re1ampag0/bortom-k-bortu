// The identical marks of sheet 04 (page 2): 11 mm brass coins on the 11 mm grid (TOKEN.marker), the same coin drawn small
// in the caption and in the slip «как пользоваться». markArt(cx, cy, id) draws one coin centred at (cx, cy), mm.
// An engraved brass token: a bevelled rim (lit from the upper left, a polished glint, the inner wall in shade), a patterned
// ring and an engraved centre, grime in the recesses. Vector, flat paint only: the bevel and the domed face are shaded in
// steps (stacked discs, like turned brass), not with SVG gradients: 48 coins of repeated gradients print wrong in some
// PDF readers (poppler draws the reused shading patterns at the first coin's place), flat paint looks the same in every
// reader and RIP (as brassDisc in tokens-art.ts). No filters. Every line ≥ 0.15 mm at 11 mm; the fine engraving is filled
// shapes, so the small copies (caption, slip) are not thickened by strokes.ts. The coin is Ø 8.8 mm: 1.1 mm of parchment
// to the shared cut on each side, so a cut 1 mm off still leaves the coin whole.
// Variants (PRINT_MARK=a|b|c, default MARK_DEFAULT):
//   a — a rope ring and a 16-point compass rose engraved in a light brass field;
//   b — a ring of breaking waves and an engraved anchor inside a beaded circle;
//   c — a ship's compass: a ring of 32 engraved bearings, a blackened recess and a raised polished 16-point rose in it.

export type MarkVariant = 'a' | 'b' | 'c';
export const MARK_DEFAULT: MarkVariant = 'c';
export const MARK_VARIANT: MarkVariant = (['a', 'b', 'c'] as const).find(v => v === process.env.PRINT_MARK) ?? MARK_DEFAULT;

/** the coin of the sheet (the variant of PRINT_MARK) */
export function markArt(cx: number, cy: number, id: string): string {
  return markCoin(MARK_VARIANT, cx, cy, id);
}

// ---- geometry ----
const f = (n: number) => String(Math.round(n * 1000) / 1000);
type P = [number, number];
/** a point at radius r, bearing deg (0 — up, clockwise) */
const pol = (cx: number, cy: number, r: number, deg: number): P => {
  const a = deg * Math.PI / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};
const pt = (p: P) => `${f(p[0])} ${f(p[1])}`;
const poly = (ps: P[]) => `M${ps.map(pt).join('L')}Z`;
/** a clockwise arc of radius r from bearing d0 to d1 */
const arc = (cx: number, cy: number, r: number, d0: number, d1: number) =>
  `M${pt(pol(cx, cy, r, d0))}A${f(r)} ${f(r)} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${pt(pol(cx, cy, r, d1))}`;
const circleD = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
/** a ring between radii r1 > r2 (fill-rule evenodd) */
const annulus = (cx: number, cy: number, r1: number, r2: number) => circleD(cx, cy, r1) + circleD(cx, cy, r2);

// ---- colours ----
const INK = '#2a1a08';          // the engraving (LOOK.engrave)
const EDGE = '#3e2a0c';         // the coin's outer edge
const HI = '#fff4cc';           // a polished highlight
const GRIME = '#2c1a06';        // dirt in the recesses
const B = { light: '#f7dc96', mid: '#d2a458', deep: '#a57735', dark: '#6e4c1a' };

/** the coin's sizes, mm */
const R = 4.4;                  // the outer edge (Ø 8.8 on the 11 mm token)
const RB = 3.72;                // the rim's inner edge: the pattern ring starts here
const RF = 2.95;                // the pattern ring's inner edge: the field

let seq = 0;

const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
/** the colour at t (0…1) along evenly spaced stops */
function ramp(stops: string[], t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), k = x - i;
  const a = hex(stops[i]), b = hex(stops[i + 1]);
  return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * k).toString(16).padStart(2, '0')).join('');
}
/** a domed disc of radius r in n steps: from the full disc in stops[0] to a small one (end × r) shifted by (dx, dy) towards
 *  the light in the last stop; |(dx, dy)| ≤ r (1 − end) keeps every step inside the disc */
function dome(cx: number, cy: number, r: number, stops: string[], dx: number, dy: number, n = 10, end = 0.12): string {
  let s = '';
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    s += `<circle cx="${f(cx + dx * t)}" cy="${f(cy + dy * t)}" r="${f(r * (1 - t * (1 - end)))}" fill="${ramp(stops, t)}"/>`;
  }
  return s;
}
/** the convex rim, lit from the upper left: discs of radius R slid towards the light, lighter each step, clipped to the coin */
const RIM = ['#4e3510', '#80592a', '#b4843e', '#d6a85a', '#ecc877'];
function bevel(u: string, cx: number, cy: number): string {
  let s = `<defs><clipPath id="${u}c"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}"/></clipPath></defs><g clip-path="url(#${u}c)">`;
  const n = 9, step = 0.11;
  for (let k = 0; k <= n; k++) s += `<circle cx="${f(cx - step * k)}" cy="${f(cy - step * k)}" r="${f(R)}" fill="${ramp(RIM, k / n)}"/>`;
  return s + `</g>`;
}
const FACE = ['#a37534', '#c09050', '#d9ab62', '#ebc77e', '#f9e2a2'];

/** grime at the foot of a recess of radius r: steps of flat translucent paint (a gradient with transparent stops
 *  becomes a soft mask in the PDF, which some readers draw wrong) */
const grime = (cx: number, cy: number, r: number) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - 0.15)}" fill="none" stroke="${GRIME}" stroke-opacity=".28" stroke-width=".3"/>`
  + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - 0.45)}" fill="none" stroke="${GRIME}" stroke-opacity=".12" stroke-width=".3"/>`;

/** the shadow on the parchment, the bevelled rim, the glint, the inner wall and the domed face inside it */
function rim(u: string, cx: number, cy: number): string {
  const w = RB - 0.1;
  return `<circle cx="${f(cx + 0.32)}" cy="${f(cy + 0.46)}" r="${f(R + 0.12)}" fill="#1a0e04" fill-opacity=".12"/>`
    + `<circle cx="${f(cx + 0.2)}" cy="${f(cy + 0.3)}" r="${f(R)}" fill="#1a0e04" fill-opacity=".2"/>`
    + bevel(u, cx, cy)
    // the polished crown of the bevel and a weaker reflection opposite
    + `<path d="${arc(cx, cy, R - 0.3, 272, 352)}" fill="none" stroke="${HI}" stroke-opacity=".8" stroke-width=".24" stroke-linecap="round"/>`
    + `<path d="${arc(cx, cy, R - 0.3, 115, 150)}" fill="none" stroke="${HI}" stroke-opacity=".35" stroke-width=".18" stroke-linecap="round"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R - 0.1)}" fill="none" stroke="${EDGE}" stroke-width=".2"/>`
    // the step down into the face: the inner wall (in shade on the upper left, lit on the lower right), then the face
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(RB)}" fill="#a87a38"/>`
    + `<path d="${arc(cx, cy, w, 232, 398)}" fill="none" stroke="#4a320c" stroke-opacity=".75" stroke-width=".2"/>`
    + `<path d="${arc(cx, cy, w, 75, 195)}" fill="none" stroke="#f2d58c" stroke-width=".2" stroke-linecap="round"/>`
    + dome(cx, cy, RB - 0.2, FACE, -1.1, -1.3)
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(RB)}" fill="none" stroke="${INK}" stroke-opacity=".75" stroke-width=".16"/>`;
}

/** a kite of the rose: the light half (counter-clockwise side) and the dark half */
function kite(cx: number, cy: number, deg: number, L: number, w: number, phi: number): [string, string] {
  const c: P = [cx, cy], tip = pol(cx, cy, L, deg), l = pol(cx, cy, w, deg - phi), r = pol(cx, cy, w, deg + phi);
  return [poly([c, l, tip]), poly([c, tip, r])];
}
/** a 16-point rose: [light halves, dark halves, outlines] by size (minor, intercardinal, cardinal) */
function rose(cx: number, cy: number, s: { card: number; inter: number; minor: number; w: number }) {
  const tiers: { light: string; dark: string; all: string }[] = [];
  const spec: [number, number, number, number][] = [[22.5, s.minor, s.w * 0.55, 22.5], [45, s.inter, s.w * 0.85, 45], [0, s.card, s.w, 45]];
  for (const [off, L, w, phi] of spec) {
    let light = '', dark = '', all = '';
    const step = off === 22.5 ? 45 : 90;
    for (let d = off; d < 360 + off - 1; d += step) {
      const [a, b] = kite(cx, cy, d, L, w, phi);
      light += a; dark += b; all += poly([pol(cx, cy, w, d - phi), pol(cx, cy, L, d), pol(cx, cy, w, d + phi), [cx, cy]]);
    }
    tiers.push({ light, dark, all });
  }
  return tiers;
}

// ---- a: rope ring, engraved 16-point rose in a light field ----
function coinA(u: string, cx: number, cy: number): string {
  let s = rim(u, cx, cy);
  // the rope lies in a recess: dark ground, then 30 twisted strands, each with a glint along its middle
  const r1 = RB - 0.2, r2 = RF, n = 30, p = 360 / n, gap = 2.6, tw = 8, rm = (r1 + r2) / 2;
  s += `<path d="${annulus(cx, cy, r1, r2)}" fill="${B.dark}" fill-rule="evenodd"/>`;
  let strands = '', glints = '';
  for (let i = 0; i < n; i++) {
    const a = i * p, w = p - gap;
    const o1 = pol(cx, cy, r1 - 0.02, a), o2 = pol(cx, cy, r1 - 0.02, a + w), i1 = pol(cx, cy, r2 + 0.02, a + tw), i2 = pol(cx, cy, r2 + 0.02, a + tw + w);
    const m1 = pol(cx, cy, rm, a + tw / 2 - 2.6), m2 = pol(cx, cy, rm, a + tw / 2 + w - 2.6);
    strands += `M${pt(o1)}Q${pt(m1)} ${pt(i1)}L${pt(i2)}Q${pt(m2)} ${pt(o2)}Z`;
    const g1 = pol(cx, cy, r1 - 0.12, a + w * 0.3), g2 = pol(cx, cy, rm, a + tw / 2 + w * 0.12 - 2.6), g3 = pol(cx, cy, r2 + 0.14, a + tw + w * 0.3);
    const h1 = pol(cx, cy, r1 - 0.12, a + w * 0.62), h3 = pol(cx, cy, r2 + 0.14, a + tw + w * 0.55);
    glints += `M${pt(g1)}Q${pt(g2)} ${pt(g3)}L${pt(h3)}Q${pt(pol(cx, cy, rm, a + tw / 2 + w * 0.45 - 2.6))} ${pt(h1)}Z`;
  }
  s += `<path d="${strands}" fill="${B.mid}"/><path d="${glints}" fill="${HI}" fill-opacity=".7"/>`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(RF)}" fill="none" stroke="${INK}" stroke-width=".16"/>`;
  s += grime(cx, cy, RF - 0.02);
  // the rose: an engraved circle behind it, 16 points in two tones
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="1.35" fill="none" stroke="${INK}" stroke-opacity=".8" stroke-width=".16"/>`;
  rose(cx, cy, { card: 2.6, inter: 1.95, minor: 1.55, w: 0.58 }).forEach((t, k) => {
    s += k === 0 ? `<path d="${t.all}" fill="${INK}" fill-opacity=".8"/>`
      : `<path d="${t.light}" fill="${B.light}"/><path d="${t.dark}" fill="${INK}"/>`
      + `<path d="${t.all}" fill="none" stroke="${INK}" stroke-width=".15" stroke-linejoin="round"/>`;
  });
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r=".38" fill="${B.light}" stroke="${INK}" stroke-width=".15"/>`;
  return s;
}

// ---- b: breaking waves round an engraved anchor ----
/** one breaking wave in a band: (t along the period 0…1, h across the band 0…1, out = towards the rim) */
const WAVE: P[] = [[0, 0.2], [0.18, 0.26], [0.36, 0.52], [0.5, 0.8], [0.63, 0.94], [0.78, 0.92], [0.9, 0.8], [0.94, 0.64],
  [0.9, 0.5], [0.82, 0.55], [0.76, 0.66], [0.7, 0.58], [0.7, 0.44], [0.76, 0.32], [0.88, 0.23], [1, 0.2]];
/** a Catmull-Rom curve through the points, sampled */
function smooth(ps: P[], k = 5): P[] {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, c_: number, d: number) => 0.5 * (2 * b + (-a + c_) * t + (2 * a - 5 * b + 4 * c_ - d) * t2 + (-a + 3 * b - 3 * c_ + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
}
const RFB = 2.72;                // b: a wider ring for the waves
function coinB(u: string, cx: number, cy: number): string {
  let s = rim(u, cx, cy);
  const r1 = RB - 0.2, r2 = RFB, n = 11, p = 360 / n, wave = smooth(WAVE), at = (i: number, t: number, h: number) => pol(cx, cy, r2 + h * (r1 - r2), (i + t) * p);
  s += `<path d="${annulus(cx, cy, r1, r2)}" fill="#4a3110" fill-rule="evenodd"/>`;
  // the brass of the waves: from the inner edge up to the wave line, all round
  const line: P[] = [];
  for (let i = 0; i < n; i++) for (const [t, h] of (i ? wave.slice(1) : wave)) line.push(at(i, t, h));
  s += `<path d="M${line.map(pt).join('L')}Z${circleD(cx, cy, r2)}" fill="${B.mid}" fill-rule="evenodd"/>`;
  // the light on the back of each wave, the shade in its face
  let gl = '', sh = '';
  for (let i = 0; i < n; i++) {
    gl += `M${pt(at(i, 0.3, 0.42))}Q${pt(at(i, 0.48, 0.84))} ${pt(at(i, 0.74, 0.86))}L${pt(at(i, 0.7, 0.76))}Q${pt(at(i, 0.5, 0.72))} ${pt(at(i, 0.3, 0.42))}Z`;
    sh += `M${pt(at(i, 0.64, 0.58))}Q${pt(at(i, 0.62, 0.36))} ${pt(at(i, 0.84, 0.24))}L${pt(at(i, 0.74, 0.24))}Q${pt(at(i, 0.56, 0.34))} ${pt(at(i, 0.64, 0.58))}Z`;
  }
  s += `<path d="${gl}" fill="${HI}" fill-opacity=".75"/><path d="${sh}" fill="${B.dark}" fill-opacity=".55"/>`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r2)}" fill="none" stroke="${INK}" stroke-width=".16"/>`;
  s += grime(cx, cy, r2 - 0.02);
  // a beaded circle
  let beads = '';
  for (let i = 0; i < 30; i++) { const [x, y] = pol(cx, cy, 2.36, i * 12); beads += circleD(x, y, 0.1); }
  s += `<path d="${beads}" fill="${INK}" fill-opacity=".85"/>`;
  // the anchor (mm from the centre; y down): shank, stock, arms, flukes — each its own shape (no holes where they meet)
  const X = (x: number) => f(cx + x), Y = (y: number) => f(cy + y);
  const shank = `M${X(-0.15)} ${Y(-1.5)}L${X(0.15)} ${Y(-1.5)}L${X(0.2)} ${Y(1.6)}L${X(-0.2)} ${Y(1.6)}Z`;
  const stock = `M${X(-0.95)} ${Y(-1.36)}L${X(0.95)} ${Y(-1.36)}L${X(0.95)} ${Y(-1.12)}L${X(-0.95)} ${Y(-1.12)}Z`;
  const arms = `M${X(-1.42)} ${Y(0.42)}Q${X(-1.28)} ${Y(1.8)} ${X(0)} ${Y(1.86)}Q${X(1.28)} ${Y(1.8)} ${X(1.42)} ${Y(0.42)}`
    + `L${X(1.12)} ${Y(0.6)}Q${X(0.98)} ${Y(1.48)} ${X(0)} ${Y(1.5)}Q${X(-0.98)} ${Y(1.48)} ${X(-1.12)} ${Y(0.6)}Z`;
  const fluke = (k: number) => `M${X(k * 1.42)} ${Y(-0.12)}L${X(k * 1.8)} ${Y(0.74)}L${X(k * 1.32)} ${Y(0.6)}L${X(k * 1.02)} ${Y(0.66)}Z`;
  for (const d of [shank, stock, arms, fluke(-1), fluke(1)]) s += `<path d="${d}" fill="${INK}"/>`;
  s += `<circle cx="${X(-1.0)}" cy="${Y(-1.24)}" r=".19" fill="${INK}"/><circle cx="${X(1.0)}" cy="${Y(-1.24)}" r=".19" fill="${INK}"/>`
    + `<path d="M${X(-0.16)} ${Y(1.78)}L${X(0)} ${Y(2.1)}L${X(0.16)} ${Y(1.78)}Z" fill="${INK}"/>`;
  // the ring at the top of the shank
  s += `<circle cx="${X(0)}" cy="${Y(-1.78)}" r=".28" fill="none" stroke="${INK}" stroke-width=".2"/>`;
  return s;
}

// ---- c: a ship's compass — bearings ring, blackened recess, raised polished rose ----
function coinC(u: string, cx: number, cy: number): string {
  let s = rim(u, cx, cy);
  // 32 bearings engraved into the brass ring; the four quarters long, the north a pointer
  let ticks = '';
  const r1 = RB - 0.28, r2 = RF + 0.12;
  for (let i = 0; i < 32; i++) {
    const d = i * 360 / 32;
    if (i === 0) continue;
    const major = i % 8 === 0, mid = i % 4 === 0, len = (r1 - r2) * (major ? 1 : mid ? 0.78 : i % 2 ? 0.5 : 0.62);
    const hw = (major ? 0.2 : 0.16) / 2 / r1 * 180 / Math.PI, hwi = (major ? 0.11 : 0.15) / 2 / (r1 - len) * 180 / Math.PI;
    ticks += poly([pol(cx, cy, r1, d - hw), pol(cx, cy, r1, d + hw), pol(cx, cy, r1 - len, d + hwi), pol(cx, cy, r1 - len, d - hwi)]);
  }
  s += grime(cx, cy, RB - 0.2) + `<path d="${ticks}" fill="${INK}"/>`;
  // the north: a small engraved arrowhead
  s += `<path d="${poly([pol(cx, cy, r1 + 0.05, -9), pol(cx, cy, r1 + 0.05, 9), pol(cx, cy, r2 - 0.05, 0)])}" fill="${INK}"/>`;
  // the recess: blackened, its edge cut sharp, a glint on its lower-right wall
  s += dome(cx, cy, RF, ['#1c1105', '#2e1e09', '#46300f', '#6a471b'], -0.7, -0.9, 9, 0.2)
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(RF)}" fill="none" stroke="${INK}" stroke-width=".18"/>`;
  s += `<path d="${arc(cx, cy, RF - 0.14, 122, 152)}" fill="none" stroke="${B.light}" stroke-opacity=".4" stroke-width=".16" stroke-linecap="round"/>`;
  // a fine brass ring behind the rose
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="1.42" fill="none" stroke="${B.mid}" stroke-opacity=".85" stroke-width=".16"/>`;
  // the rose stands proud: its shadow, then the faces in polished brass
  const spec = { card: 2.72, inter: 1.98, minor: 1.5, w: 0.6 }, sh = rose(cx + 0.14, cy + 0.2, spec), tiers = rose(cx, cy, spec);
  s += `<path d="${sh.map(t => t.all).join('')}" fill="#0c0602" fill-opacity=".55"/>`;
  for (const t of tiers) {
    s += `<path d="${t.light}" fill="#f5d88e"/><path d="${t.dark}" fill="#a3742f"/>`
      + `<path d="${t.all}" fill="none" stroke="#3a2408" stroke-width=".15" stroke-linejoin="round"/>`;
  }
  // wear: two fine scratches across the blackened recess
  s += `<path d="M${f(cx - 2.2)} ${f(cy + 1.0)}Q${f(cx - 1.4)} ${f(cy + 1.55)} ${f(cx - 0.55)} ${f(cy + 1.85)}M${f(cx + 1.25)} ${f(cy - 1.95)}L${f(cx + 2.05)} ${f(cy - 1.1)}" fill="none" stroke="${B.light}" stroke-opacity=".16" stroke-width=".15" stroke-linecap="round"/>`;
  // the pivot
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r=".42" fill="#efcf82"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r=".42" fill="none" stroke="#3a2408" stroke-width=".15"/>`
    + `<circle cx="${f(cx - 0.1)}" cy="${f(cy - 0.12)}" r=".12" fill="${HI}"/>`;
  return s;
}

/** one coin of a variant centred at (cx, cy), mm; id — the page's id prefix (the coin's clip path gets its own id) */
export function markCoin(v: MarkVariant, cx: number, cy: number, id: string): string {
  const u = `${id}mk${(seq++).toString(36)}-`;
  // drawn round (0, 0) and moved into place
  const body = v === 'a' ? coinA(u, 0, 0) : v === 'b' ? coinB(u, 0, 0) : coinC(u, 0, 0);
  // wear: the rim's polish rubbed through on the high points (light), grime at its foot (dark)
  const wear = `<path d="${arc(0, 0, R - 0.62, 300, 330)}" fill="none" stroke="${HI}" stroke-opacity=".45" stroke-width=".16" stroke-linecap="round"/>`
    + `<path d="${arc(0, 0, R - 0.55, 60, 75)}" fill="none" stroke="${HI}" stroke-opacity=".3" stroke-width=".15" stroke-linecap="round"/>`;
  return `<g data-mark="${v}" transform="translate(${f(cx)} ${f(cy)})">` + body + wear + `</g>`;
}
