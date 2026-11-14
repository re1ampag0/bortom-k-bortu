// A tricorn hat on a people.cjs head34: built in the head's own 3D units (hd.Q, hd.depth), so it turns and nods with
// the head. The brim is a ring turned up between three corners (one to the front), the crown a felt dome over it.
// Lives in lib/ beside people.cjs (not a scene). Pure functions -> SVG strings.
'use strict';
const K = require('../../kit/index.cjs');
const { f, mix, nid, linGrad } = K;

// hd: the head34 result; o: { r (the head radius), color (felt), dark, trim (the brim's edge braid, optional), light: [x, y]
// picture direction to the light, rim (colour of the edge away from the light, optional), y (the band's height in head
// units, default −.66), size (brim radius, default 1.36), turnUp (how high the sides stand, default .8), seed }
// Returns { back, front }: `back` — the brim behind the crown (draw after the head), `front` — the crown and the brim before it.
function tricorn(u, hd, o) {
  const { Q, depth } = hd, r = o.r, col = o.color || '#1c1a1e', dark = o.dark || mix(col, '#000000', .6), lt = o.light || [-.5, -.86];
  const lit = o.lit || mix(col, '#c8ccd8', .2), y0 = o.y != null ? o.y : -.66, Rb = o.size || 1.36, up = o.turnUp != null ? o.turnUp : .8;
  const P2 = p => `${f(p[0])} ${f(p[1])}`, N = 48;
  // the brim: inner ring on the head, outer edge turned up between the corners (t = 0 front, ±120°)
  const upf = t => Math.pow(Math.sin(1.5 * t), 2);
  const inner = t => [Math.sin(t) * 1.0, y0, Math.cos(t) * .98 - .1];
  const outer = t => { const k = upf(t), rr = 1.0 + (Rb - 1.0) * (1 - k) + .08 * k; return [Math.sin(t) * rr, y0 - .02 - up * k + .08 * (1 - k), Math.cos(t) * rr * .98 - .1]; };
  const shade = (p, n) => { const a = Q(...p), b = Q(p[0] + n[0] * .2, p[1] + n[1] * .2, p[2] + n[2] * .2), dz = depth(p[0] + n[0], p[1] + n[1], p[2] + n[2]) - depth(...p);
    const nx = (b[0] - a[0]) / (r * .2), ny = (b[1] - a[1]) / (r * .2), I = Math.max(-1, Math.min(1, nx * lt[0] + ny * lt[1] + dz * .25));
    return I > 0 ? mix(col, lit, I) : mix(col, dark, -I * .8); };
  const segs = [];
  for (let k = 0; k < N; k++) {
    const t0 = -Math.PI + k / N * Math.PI * 2, t1 = t0 + Math.PI * 2 / N, tm = (t0 + t1) / 2, kk = upf(tm);
    const n = [Math.sin(tm) * kk, -(1 - kk), Math.cos(tm) * kk];            // the turned-up wall faces out, the flat corner faces up
    const q = [inner(t0), inner(t1), outer(t1), outer(t0)], d = q.reduce((a, p) => a + depth(...p), 0) / 4;
    // the inside of the turned-up wall faces us when the wall is at the back
    const back = depth(Math.sin(tm), 0, Math.cos(tm)) < 0;
    segs.push({ d, back, svg: `<path d="M${q.map(p => P2(Q(...p))).join('L')}Z" fill="${back ? mix(shade(q[0], n.map(v => -v)), dark, .35) : shade(q[0], n)}" stroke="${back ? mix(col, dark, .5) : shade(q[0], n)}" stroke-width="${f(r * .02)}"/>`,
      edge: [Q(...outer(t0)), Q(...outer(t1))] });
  }
  // the crown: a dome from the band up, as the hull of its rings
  const pts = [];
  for (let k = 0; k < 36; k++) { const t = k / 36 * Math.PI * 2; for (const [yy, rr] of [[y0, .98], [y0 - .3, .96], [y0 - .55, .86], [y0 - .72, .62], [y0 - .8, .3]]) pts.push(Q(Math.sin(t) * rr, yy, Math.cos(t) * rr * .98 - .14)); }
  const S = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]), lo = [], hi = [];
  for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of S.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1)), c = Q(0, y0 - .45, 0), g = nid('tcr', u);
  let crown = `<defs>${linGrad(g, c[0] + lt[0] * r, c[1] + lt[1] * r, c[0] - lt[0] * r, c[1] - lt[1] * r, [[0, lit, 1], [.45, col, 1], [1, dark, 1]])}</defs>`
    + `<path d="M${hull.map(P2).join('L')}Z" fill="url(#${g})" stroke="${dark}" stroke-width="${f(r * .025)}"/>`
    // the dent along the top and a crease or two of worn felt
    + `<path d="M${P2(Q(-.3, y0 - .78, .2))}Q${P2(Q(0, y0 - .7, .3))} ${P2(Q(.3, y0 - .78, .2))}" stroke="${dark}" stroke-width="${f(r * .03)}" fill="none" opacity=".7"/>`
    + `<path d="M${P2(Q(-.5, y0 - .3, .7))}q${f(r * .05)} ${f(-r * .1)} ${f(r * .02)} ${f(-r * .22)}" stroke="${dark}" stroke-width="${f(r * .02)}" fill="none" opacity=".5"/>`;
  if (o.band !== false) { const bp = []; for (let k = 0; k <= 20; k++) { const t = -Math.PI / 2 + k / 20 * Math.PI; bp.push([Math.sin(t) * .99, y0 - .04, Math.cos(t) * .97 - .14]); }
    const vis = bp.filter(p => depth(...p) > -.05).map(p => Q(...p)); if (vis.length > 1) crown += `<path d="M${vis.map(P2).join('L')}" stroke="${o.bandColor || mix(col, '#000000', .3)}" stroke-width="${f(r * .12)}" fill="none"/>`; }
  let back = '', front = '';
  segs.sort((a, b) => a.d - b.d);
  for (const s of segs) { const e = `<path d="M${P2(s.edge[0])}L${P2(s.edge[1])}" stroke="${o.trim || dark}" stroke-width="${f(r * (o.trim ? .045 : .03))}" stroke-linecap="round"/>`;
    if (s.d < -.15) back += s.svg + e; else front += s.svg + e; }
  // the rim of the far edge (away from the light), when asked
  if (o.rim) { let d = '', prev = null; for (let k = 0; k <= 40; k++) { const t = -Math.PI + k / 40 * Math.PI * 2, p = Q(...outer(t)), ok = (p[0] - c[0]) * lt[0] + (p[1] - c[1]) * lt[1] < -r * .3;
      if (ok) d += (prev ? 'L' : 'M') + P2(p); prev = ok ? p : null; }
    if (d) front += `<path d="${d}" stroke="${o.rim}" stroke-width="${f(r * .035)}" fill="none" opacity=".6"/>`; }
  return { back, front: crown + front, crown };
}

// The back-light edge of a head34 head as one unbroken arc on the side away from the light (head34's own `rim` joins
// hull points that need not be neighbours, so it can cut across the face). hd: head34 result; o: { r, light: [x, y],
// color, span (degrees each side of the point opposite the light, default 70), width, opacity }
function rimArc(hd, o) {
  const c = hd.Q(0, -.12, 0), lt = o.light || [-.5, -.86], a0 = Math.atan2(-lt[1], -lt[0]), sp = (o.span || 70) * Math.PI / 180, P = [];
  for (let k = 0; k <= 16; k++) { const a = a0 - sp + k / 16 * sp * 2; P.push([c[0] + Math.cos(a) * o.r * .86, c[1] + Math.sin(a) * o.r * 1.02]); }
  return `<path d="M${P.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}" stroke="${o.color || '#c8dcff'}" stroke-width="${f(o.width || o.r * .06)}" fill="none" stroke-linecap="round" opacity="${o.opacity || .6}"/>`;
}

module.exports = { tricorn, rimArc };
