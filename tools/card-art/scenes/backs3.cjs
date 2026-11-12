// tools/card-art/scenes/backs3.cjs — card back, variant 3 «Медальон» (docs/tasks/print-kit.md 4.10, review-art 19):
// a symmetric ornament embossed tone in tone on a middle tone of the deck's colour; a large central medallion
// (rope ring, raised brass rim, a light field with the deck's ship in one dark tone); two anchors behind the
// medallion; brass corner plates well inside the edge. Колода моря — a compass rose over waves in the medallion and
// the rays of a great wind star behind it instead of the anchors.
// Contract — the same as variant 1 (backs.cjs): draw(kind) -> { svg, ground, tone, title, crest, letter, name }.
// The picture holds no letters. The generator lays the brass letter medallion (crest) under the big medallion, on
// the bottom rope swag; the big medallion and the crest never overlap (the rope ring ends at y 193, the crest's
// brass ring starts at 195). The ornament is symmetric under a 180° turn about the card's centre (100, 140); only
// the ship in the middle and the lettering are not.
// Print rules: nearer than 9 mm (28.6 units) to the edge — only the flat ground; the ornament ends at 30. Lines are
// at least 0.35 units; dark ink only on the ship and the thin outlines (the ground is a middle tone, the field light).
'use strict';
const K = require('./kit/index.cjs');

const W = 200, H = 280, SAFE = 28.6, CX = 100, CY = 140;
// middle tones of the deck colours (Ж #26262a, М #8e2420, И #24497a, Г #2f6b4a, sea #16404e): «Жемчужина» not darker
// than #4a423c (review-art 19 в)
const DECK = { pearl: '#26262a', revenge: '#8e2420', endeavour: '#24497a', dutch: '#2f6b4a', sea: '#16404e' };
const GROUND = { pearl: '#4f4d54', revenge: '#963229', endeavour: '#355a8b', dutch: '#3b7454', sea: '#2a6272' };
const KINDS = Object.keys(GROUND);
const PLACES = { title: { y: 44 }, crest: { y: 213, d: 28 }, letter: null, name: { y: 243 } };
const f = v => String(+(+v).toFixed(2));
const mix = K.mix;
let seq = 0;
const bid = (p, u) => `b3${p}${u}n${seq++}`;

// light of the emblem: from the upper left, a little in front
const LIGHT = { time: 'day', key: { type: 'sun', az: 228, el: 48, color: '#fff4e0', power: 1 }, fill: { color: '#a8b4c0', power: .4 } };
const LD = [-.62, -.78]; // direction to the light in the picture plane

const rot = ([x, y]) => [2 * CX - x, 2 * CY - y];
const P = p => `${f(p[0])} ${f(p[1])}`;
/** A path from segments [['M', [x, y]], ['C', p1, p2, p], ['L', p], ['Z']] with every point mapped by m. */
const pathD = (segs, m = p => p) => segs.map(s => s[0] + s.slice(1).map(p => P(m(p))).join(' ')).join('');
const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/** Tones of the embossing on a ground: face a shade lighter, the lit bevel lighter, the shadow bevel darker. */
const embossTones = (g, k = 1) => ({ face: mix(g, '#ffffff', .085 * k), hi: mix(g, '#fff6e6', .3 * k), lo: mix(g, '#06080c', Math.min(.7, .42 * k)), deep: mix(g, '#06080c', .25 * k) });

/**
 * Embossing tone in tone: the shapes (drawn with currentColor) three times — the dark bevel shifted to the lower
 * right, the light one to the upper left, the face on top; `detail` (grooves, also currentColor) on the face in the
 * dark tone with a light hairline beside it. Offsets are in picture units, so it looks the same at any resolution.
 */
function emboss(T, shapes, detail = '', d = .62) {
  return `<g color="${T.lo}" opacity=".85" transform="translate(${f(d)} ${f(d * 1.15)})">${shapes}</g>`
    + `<g color="${T.hi}" opacity=".8" transform="translate(${f(-d * .8)} ${f(-d * .9)})">${shapes}</g>`
    + `<g color="${T.face}">${shapes}</g>`
    + (detail ? `<g color="${T.hi}" opacity=".5" transform="translate(-.35 -.4)">${detail}</g><g color="${T.deep}">${detail}</g>` : '');
}

/** Samples along a polyline function c(t), t 0..1, every `step` units of length: [{ x, y, tx, ty }]. */
function along(c, step, closed) {
  const N = 400, pts = [];
  for (let i = 0; i <= N; i++) pts.push(c(i / N));
  const len = [0];
  for (let i = 1; i <= N; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = len[N], n = Math.max(2, Math.round(L / step)), out = [];
  for (let k = 0; k < (closed ? n : n + 1); k++) {
    const s = L * k / n; let i = 1;
    while (i < N && len[i] < s) i++;
    const a = pts[i - 1], b = pts[i], t = (s - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1]), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    out.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / l, ty: (b[1] - a[1]) / l });
  }
  return out;
}

/**
 * A laid rope along samples: the dark outline, the body, then the strands — each a slanted lozenge across the rope
 * with its lit crown towards the light and a groove after it; w — the rope's thickness. Returns the two paths.
 */
function ropeStrands(S, w) {
  const step = Math.hypot(S[1].x - S[0].x, S[1].y - S[0].y), sk = w * .42;
  let lit = '', grv = '';
  for (const s of S) {
    const nx = -s.ty, ny = s.tx, side = Math.sign(nx * LD[0] + ny * LD[1]) || 1; // which edge of the rope faces the light
    const a = [s.x - nx * w * .46 - s.tx * sk, s.y - ny * w * .46 - s.ty * sk], b = [s.x + nx * w * .46 + s.tx * sk, s.y + ny * w * .46 + s.ty * sk];
    grv += `M${P(a)}L${P(b)}`;
    // the strand's crown: its lit half, nearer the side of the rope that faces the light
    const m = [s.x + s.tx * step * .5, s.y + s.ty * step * .5], c0 = [m[0] + nx * side * w * .05, m[1] + ny * side * w * .05], c1 = [m[0] + nx * side * w * .36 + s.tx * sk * .7, m[1] + ny * side * w * .36 + s.ty * sk * .7];
    lit += `M${P(c0)}L${P(c1)}`;
  }
  return { lit, grv, step };
}

function ropeRing(u, cx, cy, r, w, T) {
  const S = along(t => [cx + r * Math.cos(t * 2 * Math.PI), cy + r * Math.sin(t * 2 * Math.PI)], w * .62, true), R = ropeStrands(S, w);
  const g = bid('rg', u);
  return `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${f(cx - r * .7)}" y1="${f(cy - r * .8)}" x2="${f(cx + r * .7)}" y2="${f(cy + r * .8)}"><stop offset="0" stop-color="${T.lit}"/><stop offset=".5" stop-color="${T.body}"/><stop offset="1" stop-color="${T.shade}"/></linearGradient></defs>`
    + `<path d="${circ(cx, cy, r)}" fill="none" stroke="${T.out}" stroke-width="${f(w + .9)}"/>`
    + `<path d="${circ(cx, cy, r)}" fill="none" stroke="url(#${g})" stroke-width="${f(w)}"/>`
    + `<path d="${R.lit}" stroke="${T.spec}" stroke-width="${f(R.step * .42)}" stroke-linecap="round" opacity=".55"/>`
    + `<path d="${R.grv}" stroke="${T.out}" stroke-width=".55" stroke-linecap="round" opacity=".85"/>`;
}

/** The kit's brass (MAT.brass in this light), warmed towards old gold: the kit's tone reads lemon on a middle ground. */
function brassRamp(L, x, y) {
  const rp = L.ramp('brass', x, y);
  return { lit: mix(rp.lit, '#f2c87e', .72), half: mix(rp.half, '#a9742f', .4), shadow: mix(rp.shadow, '#55361a', .35), outline: mix(rp.outline, '#2c1a0a', .3), spec: '#fff6dc' };
}

/** Brass: a flat plate whose colour runs from lit (upper left) to shadow (lower right) over the box (x0, y0)-(x1, y1). */
function brassGrad(u, L, x0, y0, x1, y1, rev) {
  const rp = brassRamp(L, (x0 + x1) / 2, (y0 + y1) / 2), g = bid('br', u);
  const st = rev ? [[0, rp.shadow], [.35, mix(rp.shadow, rp.half, .5)], [.7, rp.half], [1, mix(rp.half, rp.lit, .6)]] : [[0, mix(rp.lit, rp.spec, .3)], [.3, rp.lit], [.62, rp.half], [1, mix(rp.shadow, rp.half, .3)]];
  return { id: g, rp, defs: `<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}">${st.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>` };
}

/** A brass ball (rivet, scroll end): radial gradient with the highlight towards the light and a dark edge. */
function brassBall(u, L, x, y, r) {
  const rp = brassRamp(L, x, y), g = bid('bb', u);
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${f(x + LD[0] * r * .4)}" cy="${f(y + LD[1] * r * .4)}" r="${f(r * 1.25)}"><stop offset="0" stop-color="${rp.spec}"/><stop offset=".25" stop-color="${rp.lit}"/><stop offset=".7" stop-color="${rp.half}"/><stop offset="1" stop-color="${rp.shadow}"/></radialGradient></defs>`
    + `<path d="${circ(x, y, r)}" fill="url(#${g})" stroke="${rp.outline}" stroke-width=".4"/>`;
}

/** The raised brass rim between r0 and r1: the outer slope lit at the upper left, the inner slope at the lower right. */
function brassRim(u, L, cx, cy, r0, r1) {
  const rm = (r0 + r1) / 2, a = brassGrad(u, L, cx - r1 * .7, cy - r1 * .7, cx + r1 * .7, cy + r1 * .7), b = brassGrad(u, L, cx - r1 * .7, cy - r1 * .7, cx + r1 * .7, cy + r1 * .7, true);
  const ring = (ra, rb) => `${circ(cx, cy, rb)}${circ(cx, cy, ra)}`;
  return `<defs>${a.defs}${b.defs}</defs>`
    + `<path d="${ring(rm, r1)}" fill="url(#${a.id})" fill-rule="evenodd"/><path d="${ring(r0, rm)}" fill="url(#${b.id})" fill-rule="evenodd"/>`
    + `<path d="${circ(cx, cy, rm)}" fill="none" stroke="${mix(a.rp.lit, '#fffbe8', .5)}" stroke-width=".45" opacity=".7"/>`
    + `<path d="${circ(cx, cy, r1)}" fill="none" stroke="${a.rp.outline}" stroke-width=".55"/><path d="${circ(cx, cy, r0)}" fill="none" stroke="${a.rp.outline}" stroke-width=".5"/>`;
}

/**
 * A corner plate of brass: a scallop shell opening towards its corner — a fan of ribs from the hinge, a scalloped
 * lip, the two ears of the hinge, a rivet in the hinge. (cx, cy) — the hinge; (dx, dy) — the unit direction to the
 * corner. Drawn point by point in picture units, so the light stays at the upper left on all four.
 */
function cornerPlate(u, L, cx, cy, dx, dy, s, T) {
  const px = dy, py = -dx, m = ([a, b]) => [cx + (a * dx + b * px) * s, cy + (a * dy + b * py) * s];
  const R = 15.5, A = 50 * Math.PI / 180, N = 7, pol = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  // the lip: N scallops between the two edge rays of the fan; the fan starts 2.6 off the hinge
  const a0 = -A, da = 2 * A / N;
  const segs = [['M', pol(2.6, a0)], ['L', pol(R * .93, a0)]];
  for (let k = 0; k < N; k++) {
    const aa = a0 + k * da, ab = aa + da, am = aa + da / 2;
    segs.push(['C', pol(R * 1.03, aa + da * .1), pol(R * 1.12, am - da * .2), pol(R * 1.1, am)], ['C', pol(R * 1.12, am + da * .2), pol(R * 1.03, ab - da * .1), pol(R * .93, ab)]);
  }
  segs.push(['L', pol(2.6, A)], ['C', pol(1.2, A * .4), pol(1.2, -A * .4), pol(2.6, a0)], ['Z']);
  const shell = pathD(segs, m);
  // ribs between the scallops, from near the hinge to the lip; the ears: two small wings across the hinge
  const ribs = [];
  for (let k = 1; k < N; k++) { const a = a0 + k * da; ribs.push(['M', pol(4.6, a)], ['L', pol(R * .88, a)]); }
  const rib = pathD(ribs, m);
  const ear = e => pathD([['M', [1.2, e * 1.4]], ['L', [-2.2, e * 3.2]], ['C', [-3.6, e * 4.6], [-2.4, e * 7], [-.6, e * 6.6]], ['L', [3.4, e * 3.2]], ['Z']], m);
  const ears = ear(1) + ear(-1);
  const e = 17 * s, mc = m([7, 0]), g = brassGrad(u, L, mc[0] - e, mc[1] - e, mc[0] + e, mc[1] + e), rp = g.rp, h = m([.6, 0]);
  return `<defs>${g.defs}</defs><path d="${ears}${shell}" fill="${T.lo}" opacity=".6" transform="translate(.8 1)"/>`
    + `<path d="${ears}" fill="url(#${g.id})" stroke="${rp.outline}" stroke-width=".55" stroke-linejoin="round"/>`
    + `<path d="${shell}" fill="url(#${g.id})" stroke="${rp.outline}" stroke-width=".6" stroke-linejoin="round"/>`
    + `<path d="${rib}" fill="none" stroke="${rp.spec}" stroke-width=".45" stroke-linecap="round" opacity=".5" transform="translate(-.35 -.4)"/>`
    + `<path d="${rib}" fill="none" stroke="${rp.shadow}" stroke-width=".6" stroke-linecap="round" opacity=".9"/>`
    + brassBall(u, L, h[0], h[1], 2.2 * s);
}

/**
 * An anchor, upright with its ring up, `h` long, its middle at (0, 0) — as SVG shapes in currentColor for emboss().
 * The mapping m puts it in the picture (and turns it). Returns { shapes, detail }.
 */
function anchorShapes(m, h) {
  const t = -h / 2, b = h / 2, A = 18, S = 15;
  const ringC = m([0, t + 4.4]), ring = `<path d="${circ(ringC[0], ringC[1], 3.6)}" fill="none" stroke="currentColor" stroke-width="1.9"/>`;
  const stock = pathD([['M', [-S, t + 11.2]], ['C', [-S + 3, t + 10], [S - 3, t + 10], [S, t + 11.2]], ['L', [S, t + 14.2]], ['C', [S - 3, t + 13.4], [-S + 3, t + 13.4], [-S, t + 14.2]], ['Z']], m);
  const knob = (x, y) => { const c = m([x, y]); return `<path d="${circ(c[0], c[1], 2.1)}"/>`; };
  const shank = pathD([['M', [-1.7, t + 7.6]], ['L', [1.7, t + 7.6]], ['L', [2.3, b - 7]], ['L', [-2.3, b - 7]], ['Z']], m);
  const arms = pathD([['M', [-A, b - 21]], ['C', [-A + .5, b - 8], [-9, b - 2.5], [0, b - 2.5]], ['C', [9, b - 2.5], [A - .5, b - 8], [A, b - 21]]], m);
  const fluke = e => pathD([['M', [e * (A + 1.2), b - 33]], ['C', [e * (A + 4.4), b - 28], [e * (A + 4.6), b - 22], [e * (A + 3), b - 17.6]], ['L', [e * (A - 1.4), b - 19.2]], ['C', [e * (A - 3.2), b - 23], [e * (A - 2.2), b - 28.5], [e * (A + 1.2), b - 33]], ['Z']], m);
  const crown = pathD([['M', [0, b + .4]], ['L', [-3, b - 3]], ['L', [0, b - 6.4]], ['L', [3, b - 3]], ['Z']], m);
  const shapes = `<g fill="currentColor">${ring}<path d="${stock}"/>${knob(-S - .6, t + 12.7)}${knob(S + .6, t + 12.7)}<path d="${shank}"/>`
    + `<path d="${arms}" fill="none" stroke="currentColor" stroke-width="3.3" stroke-linecap="round"/><path d="${fluke(-1)}"/><path d="${fluke(1)}"/><path d="${crown}"/></g>`;
  // grooves: the ridge down the shank and the flukes, the hoops of the stock
  const detail = `<path d="${pathD([['M', [0, t + 15]], ['L', [0, b - 8]], ['M', [-A - 1.4, b - 29]], ['L', [-A - .2, b - 20]], ['M', [A + 1.4, b - 29]], ['L', [A + .2, b - 20]], ['M', [-5, t + 10.6]], ['L', [-5, t + 14]], ['M', [5, t + 10.6]], ['L', [5, t + 14]]], m)}" fill="none" stroke="currentColor" stroke-width=".45" stroke-linecap="round"/>`;
  return { shapes, detail };
}

/** A laid rope as emboss shapes: the body along the samples and its grooves. */
function ropeShapes(S, w) {
  const R = ropeStrands(S, w), d = S.map((s, i) => (i ? 'L' : 'M') + P([s.x, s.y])).join('');
  return { shapes: `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`, detail: `<path d="${R.grv}" fill="none" stroke="currentColor" stroke-width=".45" stroke-linecap="round"/>` };
}

const bez = (p0, p1, p2, p3) => t => { const s = 1 - t; return [0, 1].map(i => s * s * s * p0[i] + 3 * s * s * t * p1[i] + 3 * s * t * t * p2[i] + t * t * t * p3[i]); };

/** A wind star: 8 rays — rr = [north-south, east-west, the diagonals] long, wl wide at the root — halves lit and shaded. */
function starShapes(rr, wl, cx = CX, cy = CY) {
  let lit = '', shade = '';
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 - Math.PI / 2, r = k % 2 ? rr[2] : k % 4 ? rr[1] : rr[0], w = k % 2 ? wl * .75 : wl;
    const tip = [cx + r * Math.cos(a), cy + r * Math.sin(a)], l = [cx + w * Math.cos(a - Math.PI / 2), cy + w * Math.sin(a - Math.PI / 2)], rt = [cx + w * Math.cos(a + Math.PI / 2), cy + w * Math.sin(a + Math.PI / 2)];
    lit += `<path d="M${f(cx)} ${f(cy)}L${P(l)}L${P(tip)}Z"/>`; shade += `<path d="M${f(cx)} ${f(cy)}L${P(tip)}L${P(rt)}Z"/>`;
  }
  return { lit, shade };
}

/** Waves in a band, as strokes: rows of crests from x0 to x1 at y, wavelength wl. */
function waveRows(x0, x1, y, rows, gap, wl, amp) {
  let d = '';
  for (let r = 0; r < rows; r++) {
    const yy = y + r * gap, ph = (r % 2) * wl / 2;
    d += `M${f(x0)} ${f(yy)}`;
    for (let x = x0 - ph; x < x1; x += wl) d += `Q${f(x + wl / 4)} ${f(yy - amp)} ${f(x + wl / 2)} ${f(yy)}T${f(x + wl)} ${f(yy)}`;
  }
  return d;
}

/** Inside of the medallion: the deck's ship as one dark silhouette on a calm sea; for the sea — a compass rose over waves. */
function fieldArt(u, kind, ink, mid, rf) {
  if (kind === 'sea') {
    // the rose a little above the middle, the waves under its south point
    const cy = CY - rf * .14, rr = rf * .7, rose = starShapes([rr * .92, rr * .92, rr * .56], rf * .12, CX, cy);
    let ticks = '';
    for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16, r0 = rr, r1 = rr * (k % 4 ? 1.06 : 1.12); ticks += `M${P([CX + r0 * Math.cos(a), cy + r0 * Math.sin(a)])}L${P([CX + r1 * Math.cos(a), cy + r1 * Math.sin(a)])}`; }
    return `<path d="${waveRows(CX - rf, CX + rf, cy + rr * 1.2, 3, rf * .1, rf * .3, rf * .06)}" fill="none" stroke="${mid}" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`
      + `<path d="${circ(CX, cy, rr)}" fill="none" stroke="${ink}" stroke-width=".5" opacity=".8"/><path d="${ticks}" stroke="${ink}" stroke-width=".5" opacity=".85"/>`
      + `<g fill="${mid}">${rose.lit}</g><g fill="${ink}">${rose.shade}</g>`
      + `<path d="${circ(CX, cy, rf * .08)}" fill="${ink}"/>`;
  }
  const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), sc = Math.min(rf * 1.74 / b.w, rf * 1.44 / b.h), wl = CY + rf * .5;
  const x = CX - (b.x0 + b.x1) / 2 * sc, flip = kind === 'revenge'; // «Месть» bow to the right, «Голландец» to the left: the two read apart by shape too
  const xx = flip ? CX + (b.x0 + b.x1) / 2 * sc : x;
  let sil = K.shipSilhouette(kind, { x: xx, y: wl, scale: sc, flip, color: ink, u: 'b3' + u });
  // the rigging of the silhouette is hairline at this size: no line thinner than 0.35 units
  sil = sil.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${f(Math.max(.35, +w))}"`);
  return `<rect x="${CX - rf}" y="${f(wl - .4)}" width="${2 * rf}" height="${rf}" fill="${mid}" opacity=".38"/>`
    + `<path d="${waveRows(CX - rf, CX + rf, wl + 4.2, 3, 4.4, 9, 1.3)}" fill="none" stroke="${mid}" stroke-width=".8" stroke-linecap="round" opacity=".85"/>`
    + sil;
}

/** The big medallion: shadow, rope ring, brass rim, light field with the art, the field's inner shadow, a bead ring. */
function medallion(u, L, kind, g, T) {
  const rRope = 50.4, wRope = 5.6, r1 = rRope - wRope / 2 - .2, r0 = r1 - 6.6, rf = r0, ink = mix(DECK[kind], '#08090c', .35), mid = mix(GROUND[kind], DECK[kind], .5);
  const field = mix('#efe4c8', GROUND[kind], .16), fieldEdge = mix(field, GROUND[kind], .22);
  const rt = { out: mix('#2a1d10', g, .2), body: '#b28c56', lit: '#e7cf98', shade: '#7a5a32', spec: '#fff1cc' };
  const sh = bid('sh', u), fg = bid('fg', u), cl = bid('cl', u), is = bid('is', u);
  let beads = '';
  for (let k = 0; k < 60; k++) { const a = k * Math.PI / 30; beads += `<path d="${circ(CX + (rf - 2.6) * Math.cos(a), CY + (rf - 2.6) * Math.sin(a), .55)}"/>`; }
  return `<defs><filter id="${sh}" x="40" y="80" width="130" height="130" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="1.4"/></filter>`
    + `<radialGradient id="${fg}" gradientUnits="userSpaceOnUse" cx="${CX - 8}" cy="${CY - 10}" r="${f(rf * 1.25)}"><stop offset="0" stop-color="${mix(field, '#ffffff', .25)}"/><stop offset=".6" stop-color="${field}"/><stop offset="1" stop-color="${fieldEdge}"/></radialGradient>`
    + `<clipPath id="${cl}"><path d="${circ(CX, CY, rf)}"/></clipPath>`
    + `<linearGradient id="${is}" gradientUnits="userSpaceOnUse" x1="${f(CX - rf * .6)}" y1="${f(CY - rf * .8)}" x2="${f(CX + rf * .5)}" y2="${f(CY + rf * .7)}"><stop offset="0" stop-color="#2a1a08" stop-opacity=".5"/><stop offset=".55" stop-color="#2a1a08" stop-opacity="0"/></linearGradient></defs>`
    + `<path d="${circ(CX + 1.2, CY + 1.8, rRope + wRope / 2 + .6)}" fill="${T.lo}" opacity=".7" filter="url(#${sh})"/>`
    + `<path d="${circ(CX, CY, rf)}" fill="url(#${fg})"/>`
    + `<g clip-path="url(#${cl})">${fieldArt(u, kind, ink, mid, rf)}<g fill="${mid}" opacity=".75">${beads}</g>`
    + `<path d="${circ(CX, CY, rf - .6)}" fill="none" stroke="url(#${is})" stroke-width="2.4"/></g>`
    + brassRim(u, L, CX, CY, r0, r1) + ropeRing(u, CX, CY, rRope, wRope, rt);
}

function draw(kind) {
  if (!GROUND[kind]) throw new Error(`backs3: unknown kind ${kind}`);
  const u = kind.slice(0, 2), g = GROUND[kind], T = embossTones(g), L = K.makeLight(LIGHT, { horizon: 20 });
  let body = `<rect x="-30" y="-30" width="${W + 60}" height="${H + 60}" fill="${g}"/>`;
  // a soft glow of the ground behind the medallion: the gradient follows the ellipse and is gone at its edge (x 30..170)
  const gl = bid('gl', u);
  body += `<defs><radialGradient id="${gl}"><stop offset="0" stop-color="${mix(g, '#ffffff', .12)}"/><stop offset=".55" stop-color="${mix(g, '#ffffff', .06)}"/><stop offset="1" stop-color="${g}" stop-opacity="0"/></radialGradient></defs>`
    + `<ellipse cx="${CX}" cy="${CY}" rx="70" ry="98" fill="url(#${gl})"/>`;
  // rope swags from corner plate to corner plate, top and bottom (the bottom one runs behind the letter medallion)
  const sw = along(bez([54, 69], [72, 84], [128, 84], [146, 69]), 2.6 * .62), swR = sw.map(s => { const p = rot([s.x, s.y]); return { x: p[0], y: p[1], tx: -s.tx, ty: -s.ty }; });
  const r1 = ropeShapes(sw, 2.6), r2 = ropeShapes(swR, 2.6);
  // the ornament behind the medallion: anchors (ships' decks) or the wind star (sea)
  let orn;
  if (kind === 'sea') {
    const st = starShapes([88, 68, 62], 9.5);
    orn = `<g color="${T.lo}" opacity=".7" transform="translate(.7 .8)"><g fill="currentColor">${st.lit}${st.shade}</g></g>`
      + `<g fill="${mix(g, '#ffffff', .2)}">${st.lit}</g><g fill="${mix(g, '#000000', .2)}">${st.shade}</g>`;
    // waves embossed at the sides, turned by 180° on the right
    const wv = `<path d="${waveRows(33, 60, 103, 3, 6.5, 11, 2.2)}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
    orn += emboss(T, wv + `<g transform="rotate(180 ${CX} ${CY})">${wv}</g>`);
  } else {
    const a1 = anchorShapes(([x, y]) => [54 + x, CY + y], 110), a2 = anchorShapes(([x, y]) => rot([54 + x, CY + y]), 110);
    orn = emboss(embossTones(g, 1.4), a1.shapes + a2.shapes, a1.detail + a2.detail, .75);
  }
  body += orn + emboss(T, r1.shapes + r2.shapes, r1.detail + r2.detail, .5);
  body += medallion(u, L, kind, g, T);
  // brass corner plates, pointing to the corners, their tips 30+ units from the edge
  const s = 1, o = 48, oy = 68, dg = Math.SQRT1_2;
  body += cornerPlate(u, L, o, oy, -dg, -dg, s, T) + cornerPlate(u, L, W - o, oy, dg, -dg, s, T) + cornerPlate(u, L, o, H - oy, -dg, dg, s, T) + cornerPlate(u, L, W - o, H - oy, dg, dg, s, T);
  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  return Object.assign({ svg, ground: g, tone: 'dark' }, JSON.parse(JSON.stringify(PLACES)));
}

module.exports = { draw, KINDS, GROUND, SAFE };
