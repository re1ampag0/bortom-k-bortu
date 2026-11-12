// kit/props.cjs — things of a print scene, built the way they are really made and shaded from the scene's light L
// (kit/light.cjs, makeLight): casks, a gun on its carriage, a gun port, shot, rope, chain, an anchor, a lantern,
// a candle, a bottle, a mug, a chest, a crate, a sack, a bell, a scroll, coins, a sabre, a pistol, an hourglass,
// a bulwark, a pier, a bollard, a rock.
// Every function is name(u, L, opts) -> one SVG string. opts: x, y — the point the thing stands on (the middle of
// its foot), s — scale (1 = the thing's own units, see kit/README.md), rot (degrees, clockwise), flip (mirror in
// x), seed. All geometry is computed in picture units, so the light stays the scene's light under rot and flip.
// A thing is returned WITHOUT its cast shadow (the scene lays it with castShadow) but with the contact darkening
// at its foot (opts.contact: false to drop it). Pure functions, no Node API. Rules: docs/mockups/print/STYLE.md.
'use strict';
const LT = require('./light.cjs');
const ENV = require('./env.cjs');
const { nid, f, clamp, lerp, rng, mix, scale, linGrad, radGrad, mat, shadeCyl, shadeSphere, shadeBox, contactShadow, MAT } = LT;

// ——— small geometry ———
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const unit = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const mixP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const P2 = p => `${f(p[0])} ${f(p[1])}`;
const KB = .5523;
const seedOf = (o, d) => (o && o.seed != null ? o.seed : d);
const NORMALS = { top: [0, 1, 0], bottom: [0, -1, 0], left: [-1, 0, 0], right: [1, 0, 0], front: [0, 0, 1], back: [0, 0, -1] };
/** A quarter of an ellipse round c from c + a to c + b (a, b — conjugate half-axes) as a cubic Bézier. */
const arc = (c, a, b) => { const p3 = add(c, b); return `C${P2(add(add(c, a), mul(b, KB)))} ${P2(add(p3, mul(a, KB)))} ${P2(p3)}`; };
const ellD = (c, v, w) => `M${P2(add(c, v))}${arc(c, v, w)}${arc(c, w, mul(v, -1))}${arc(c, mul(v, -1), mul(w, -1))}${arc(c, mul(w, -1), v)}Z`;
/** Half an ellipse from c - v through c + w to c + v. */
const halfD = (c, v, w, cmd = 'M') => `${cmd}${P2(sub(c, v))}${arc(c, mul(v, -1), w)}${arc(c, w, v)}`;
/** The same half walked back: a line to c + v, then through c + w to c - v. */
const halfR = (c, v, w) => `L${P2(add(c, v))}${arc(c, v, w)}${arc(c, w, mul(v, -1))}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const line = pts => 'M' + pts.map(P2).join('L');
/** A smooth path through the points (Catmull-Rom as cubic Béziers). */
function smooth(pts, closed) {
  const n = pts.length; if (n < 3) return line(pts);
  const g = i => closed ? pts[((i % n) + n) % n] : pts[clamp(i, 0, n - 1)];
  let d = 'M' + P2(pts[0]);
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${P2([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P2([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P2(p2)}`; }
  return d + (closed ? 'Z' : '');
}
/** Points on the same curve, `per` to a span. */
function dense(pts, per = 8, closed) {
  const n = pts.length; if (n < 3) { const out = []; for (let i = 0; i + 1 < n; i++) for (let j = 0; j < per; j++) out.push(mixP(pts[i], pts[i + 1], j / per)); out.push(pts[n - 1]); return out; }
  const g = i => closed ? pts[((i % n) + n) % n] : pts[clamp(i, 0, n - 1)], out = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let j = 0; j < per; j++) { const t = j / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3))); } }
  out.push(closed ? pts[0] : pts[n - 1]); return out;
}
/** Walk a polyline: points every `step` units with the unit tangent t and the normal n. R jitters the step. */
function walk(pl, step, R) {
  const out = []; let need = step * .5;
  for (let i = 0; i + 1 < pl.length; i++) { const a = pl[i], b = pl[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-6) continue; const t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; let at = 0;
    while (need <= l - at) { at += need; out.push({ p: [a[0] + t[0] * at, a[1] + t[1] * at], t, n: [-t[1], t[0]] }); need = step * (R ? .82 + R() * .36 : 1); }
    need -= l - at; }
  return out;
}

/**
 * The thing's own frame: p(lx, ly) — a local point (x to the right, y down, the foot at 0, 0) in the picture;
 * v — a local vector; d — a local path string (commands M L C Q S T Z in either case; no H, V, A); n — a normal
 * ([x, y up, z at the viewer] or a name) turned with the thing, for shadeBox and mat.
 */
function frame(o = {}) {
  const x = o.x || 0, y = o.y || 0, s = o.s != null ? o.s : 1, a = rad(o.rot || 0), fl = o.flip ? -1 : 1, c = Math.cos(a), sn = Math.sin(a);
  const v = (lx, ly) => { const X = lx * fl * s, Y = ly * s; return [X * c - Y * sn, X * sn + Y * c]; };
  const p = (lx, ly) => { const q = v(lx, ly); return [x + q[0], y + q[1]]; };
  const n = nn => { const m = Array.isArray(nn) ? nn : NORMALS[nn] || NORMALS.front, sx = m[0] * fl, sy = -m[1]; return [sx * c - sy * sn, -(sx * sn + sy * c), m[2]]; };
  const d = str => { let rel = false, out = ''; const tk = str.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || []; let buf = [];
    for (const t of tk) { if (/[a-zA-Z]/.test(t)) { out += t; rel = t !== t.toUpperCase() && t !== 'z'; buf = []; } else { buf.push(+t); if (buf.length === 2) { out += P2(rel ? v(buf[0], buf[1]) : p(buf[0], buf[1])) + ' '; buf = []; } } }
    return out.trim(); };
  return { x, y, s, fl, rot: o.rot || 0, p, v, n, d, face: (pts, nn, extra) => Object.assign({ pts: pts.map(q => p(q[0], q[1])), n: n(nn) }, extra) };
}
const ellOf = (o, L, y, lo = .16, hi = .42) => o.ell != null ? o.ell : clamp(L.ellipse(y), lo, hi);
const seat = (u, L, o, x, y, w, extra) => o.contact === false ? '' : contactShadow(u, x, y, w, L, extra);
const specOp = (L, m, la) => m.spec ? m.spec.op * clamp(.35 + L.key.power * la.k * .75) : 0;

// ——— shaded forms the light library has no helper for ———
/**
 * tube(u, L, kind, d, r, at, opts) — a round bar or rope of radius r along the path d (picture units): the dark
 * body, then narrower strokes pushed to the light (core, half tone, light, highlight) and one pushed away from it
 * (reflex). `at` — the point the light is taken at. opts: cap: 'round' | 'butt', outline: false | width, spec: false.
 */
function tube(u, L, kind, d, r, at, o = {}) {
  const m = MAT[kind] || MAT.oak, la = L.at(at[0], at[1]), rp = L.ramp(kind, at[0], at[1]), back = la.dz < 0, off = la.p * (back ? .6 : .4) * r, cap = o.cap || 'round';
  const ow = o.outline === false ? 0 : typeof o.outline === 'number' ? o.outline : clamp(r * .2, .22, .55);
  const st = (col, w, k, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="${cap}" stroke-linejoin="round"${k ? ` transform="translate(${f(la.ux * off * k)} ${f(la.uy * off * k)})"` : ''}${op < 1 ? ` opacity="${f(op)}"` : ''}/>`;
  let out = (ow ? st(rp.outline, 2 * r + 2 * ow, 0) : '') + st(L.tone(kind, -.55, at[0], at[1]), 2 * r, 0) + st(rp.reflex, r * .45, -1.6, .6) + st(rp.core, r * 1.7, .3) + st(rp.half, r * (back ? .9 : 1.3), .62) + st(rp.lit, r * (back ? .45 : .78), 1);
  if (m.spec && rp.spec && o.spec !== false) out += st(rp.spec, clamp(r * m.spec.w * 1.5, .14, r * .5), 1.12, specOp(L, m, la));
  return out;
}
/** The lay of a rope: oblique S-strokes across it along the polyline `pl`, a light dab beside each on the lit side. */
function layMarks(L, pl, r, R, at) {
  const la = L.at(at[0], at[1]), rp = L.ramp('rope', at[0], at[1]); let dk = '', lt = '';
  for (const q of walk(pl, r * 1.3, R)) {
    const a = add(q.p, add(mul(q.n, -r * .95), mul(q.t, -r * .6))), b = add(q.p, add(mul(q.n, r * .95), mul(q.t, r * .6)));
    dk += `M${P2(a)}C${P2(add(a, add(mul(q.n, r * .7), mul(q.t, -r * .1))))} ${P2(add(b, add(mul(q.n, -r * .7), mul(q.t, r * .1))))} ${P2(b)}`;
    const sg = Math.sign(la.ux * q.n[0] + la.uy * q.n[1]) || 1, c = add(q.p, add(mul(q.n, sg * r * .38), mul(q.t, r * .62 + sg * r * .2)));
    lt += `M${P2(add(c, mul(q.n, -sg * r * .26)))}L${P2(add(c, add(mul(q.n, sg * r * .26), mul(q.t, sg * r * .3))))}`;
  }
  return `<path d="${dk}" stroke="${rp.outline}" stroke-width="${f(clamp(r * .22, .16, .5))}" fill="none" opacity=".6" stroke-linecap="round"/><path d="${lt}" stroke="${mix(rp.lit, '#ffffff', .3)}" stroke-width="${f(clamp(r * .24, .16, .5))}" fill="none" opacity="${f(.25 + .35 * clamp(la.p))}" stroke-linecap="round"/>`;
}
/**
 * lathe(u, L, kind, A, B, prof, opts) — a turned form (a bell, a bottle, a bulb of glass): the axis runs from A to
 * B (picture points), prof = [[t, r], ...] — the radius r (picture units) at the share t of the axis; the profile is
 * smoothed. Each slice gets the cylinder's gradient across it, tilted by the slope of the profile (a flare turned
 * up to the light is lighter). opts: ell — how flat the round ends look, opacity (glass), spec: false | [t0, t1],
 * outline: false | width, hard: true — keep the profile as given. Returns { svg, d (the outline), clip (its id) }.
 */
function lathe(u, L, kind, A, B, prof, o = {}) {
  const m = MAT[kind] || MAT.oak, len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, a = unit(sub(B, A)), n = [-a[1], a[0]], k = o.ell || 0;
  const mid = mixP(A, B, .5), la = L.at(mid[0], mid[1]), LN = la.dx * n[0] + la.dy * n[1], LA = la.dx * a[0] + la.dy * a[1], rp = L.ramp(kind, mid[0], mid[1]);
  const pr = o.hard ? prof : dense(prof.map(q => [q[0] * len, q[1]]), 4).map(q => [clamp(q[0] / len), Math.max(.02, q[1])]).filter((q, i, all) => !i || q[0] > all[i - 1][0] + 1e-4);
  const P = (t, sg, r) => add(add(A, mul(a, t * len)), mul(n, sg * r));
  const r0 = pr[0][1], r1 = pr[pr.length - 1][1];
  let d = 'M' + pr.map(q => P2(P(q[0], -1, q[1]))).join('L');
  d += k ? arc(B, mul(n, -r1), mul(a, k * r1)) + arc(B, mul(a, k * r1), mul(n, r1)) : 'L' + P2(P(1, 1, r1));
  d += 'L' + pr.slice().reverse().map(q => P2(P(q[0], 1, q[1]))).join('L');
  d += (k ? arc(A, mul(n, r0), mul(a, -k * r0)) + arc(A, mul(a, -k * r0), mul(n, -r0)) : '') + 'Z';
  const cid = nid('lc', u), fid = nid('lf', u), rmax = Math.max(...pr.map(q => q[1])), SS = [-1, -.9, -.72, -.5, -.25, 0, .25, .5, .72, .9, 1];
  let defs = `<clipPath id="${cid}"><path d="${d}"/></clipPath>`, body = '';
  const sd = clamp(len / pr.length * .5, .12, .7);
  for (let i = 0; i + 1 < pr.length; i++) {
    const [t0, ra] = pr[i], [t1, rb] = pr[i + 1], rm = Math.max(.05, (ra + rb) / 2), ph = Math.atan2(rb - ra, (t1 - t0) * len), cph = Math.cos(ph), sph = Math.sin(ph), gid = nid('lg', u), c = P((t0 + t1) / 2, 0, 0);
    const I = sg => cph * (sg * LN + Math.sqrt(1 - sg * sg) * la.dz) - sph * LA;
    defs += linGrad(gid, c[0] - n[0] * rm, c[1] - n[1] * rm, c[0] + n[0] * rm, c[1] + n[1] * rm, SS.map(sg => [(sg + 1) / 2, L.tone(kind, I(sg), mid[0], mid[1])]));
    const e0 = i === 0 ? -(k * ra + 1) / len : -.3 / len, e1 = i + 2 === pr.length ? (k * rb + 1) / len : .3 / len;
    body += `<path d="${poly([P(t0 + e0, -1.3, ra), P(t1 + e1, -1.3, rb), P(t1 + e1, 1.3, rb), P(t0 + e0, 1.3, ra)])}" fill="url(#${gid})"/>`;
  }
  const xs = [A[0], B[0]], ys = [A[1], B[1]], pad = rmax * 1.5 + 3;
  defs += `<filter id="${fid}" filterUnits="userSpaceOnUse" x="${f(Math.min(...xs) - pad)}" y="${f(Math.min(...ys) - pad)}" width="${f(Math.abs(xs[1] - xs[0]) + 2 * pad)}" height="${f(Math.abs(ys[1] - ys[0]) + 2 * pad)}"><feGaussianBlur stdDeviation="${f(sd)}"/></filter>`;
  let hi = '';
  if (m.spec && rp.spec && o.spec !== false) {
    const raw = LN / Math.hypot(LN, 1 + la.dz) || 0, sh = Math.abs(LN) < .1 ? raw : Math.sign(LN) * clamp(Math.abs(raw), .3, la.dz >= 0 ? .45 : .9), [ta, tb] = Array.isArray(o.spec) ? o.spec : [.1, .9];
    const hp = pr.filter(q => q[0] >= ta && q[0] <= tb).map(q => P(q[0], sh, q[1])); if (hp.length > 1) { const hd = line(hp), w = m.spec.w * rmax * 1.5, op = specOp(L, m, la);
      if (m.spec.halo) hi += `<path d="${hd}" stroke="${m.spec.halo}" stroke-width="${f(w * 3)}" fill="none" opacity="${f(op * .3)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      hi += `<path d="${hd}" stroke="${rp.spec}" stroke-width="${f(w * 2)}" fill="none" opacity="${f(op * .3)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${hd}" stroke="${rp.spec}" stroke-width="${f(w)}" fill="none" opacity="${f(op)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  }
  const ow = o.outline === false ? 0 : typeof o.outline === 'number' ? o.outline : clamp(rmax * .07, .4, .7);
  const svg = `<defs>${defs}</defs><g clip-path="url(#${cid})"${o.opacity != null ? ` opacity="${f(o.opacity)}"` : ''}><g filter="url(#${fid})">${body}</g>${hi}</g>` + (ow ? `<path d="${d}" fill="none" stroke="${rp.outline}" stroke-width="${f(ow)}" stroke-linejoin="round"/>` : '');
  return { svg, d, clip: cid, P: (t, sg) => { const q = pr.reduce((b, c) => Math.abs(c[0] - t) < Math.abs(b[0] - t) ? c : b); return P(t, sg, q[1]); }, la, rp, a, n };
}
/** A flat disc facing the viewer (a wheel, a trunnion's end): face + a thin lit edge on the light's side. */
function disc(u, L, c, r, kind, o = {}) {
  const g = mat(kind, L, { form: 'plane', x1: c[0] - r, y1: c[1] - r, x2: c[0] + r, y2: c[1] + r, n: o.n || 'front', u }), la = L.at(c[0], c[1]), rp = g.ramp, eid = nid('de', u);
  const ow = o.outline === false ? 0 : o.outline || clamp(r * .1, .3, .6);
  return `<defs>${g.defs}${linGrad(eid, c[0] + la.ux * r, c[1] + la.uy * r, c[0] - la.ux * r, c[1] - la.uy * r, [[0, mix(rp.lit, '#ffffff', .35), .8], [.4, rp.lit, 0], [1, rp.lit, 0]])}</defs><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${g.fill}"${ow ? ` stroke="${rp.outline}" stroke-width="${f(ow)}"` : ''}/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .9)}" fill="none" stroke="url(#${eid})" stroke-width="${f(r * .12)}"/>`;
}
/** A small bolt head or rivet with its glint on the light's side. */
function rivet(L, c, r, kind = 'iron') {
  const la = L.at(c[0], c[1]), rp = L.ramp(kind, c[0], c[1]);
  return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${rp.core}" stroke="${rp.outline}" stroke-width="${f(r * .3)}"/><circle cx="${f(c[0] + la.ux * r * .3)}" cy="${f(c[1] + la.uy * r * .3)}" r="${f(r * .42)}" fill="${rp.spec || rp.lit}" opacity=".8"/>`;
}
/** A flame: layers from the orange mantle to the white heart; c — the wick's tip, h — height. */
function flame(u, c, h, R, o = {}) {
  const w = h * .26, lean = (R() - .5) * h * .16, tip = [c[0] + lean, c[1] - h];
  const sh = (k, kw) => `M${f(c[0])} ${f(c[1] + h * .04)}C${f(c[0] - w * kw * 1.5)} ${f(c[1] - h * .04)} ${f(c[0] - w * kw)} ${f(c[1] - h * k * .55)} ${f(lerp(c[0], tip[0], k))} ${f(c[1] - h * k)}C${f(c[0] + w * kw)} ${f(c[1] - h * k * .55)} ${f(c[0] + w * kw * 1.5)} ${f(c[1] - h * .04)} ${f(c[0])} ${f(c[1] + h * .04)}Z`;
  const gid = nid('fh', u);
  return (o.glow === false ? '' : `<defs><radialGradient id="${gid}"><stop offset="0" stop-color="#ffd58a" stop-opacity=".7"/><stop offset=".35" stop-color="#ffb24a" stop-opacity=".28"/><stop offset="1" stop-color="#ffb24a" stop-opacity="0"/></radialGradient></defs><circle cx="${f(c[0])}" cy="${f(c[1] - h * .5)}" r="${f(h * (o.halo || 2.2))}" fill="url(#${gid})" style="mix-blend-mode:screen"/>`)
    + `<path d="${sh(1, 1)}" fill="#f47a18" opacity=".92"/><path d="${sh(.82, .78)}" fill="#ffc23a"/><path d="${sh(.6, .52)}" fill="#ffeb9a"/><path d="${sh(.36, .3)}" fill="#fffdf0"/><ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(w * .5)}" ry="${f(h * .07)}" fill="#6a8fd8" opacity=".55"/>`;
}

// ——— the round wooden vessel: staves, hoops, head, opening (cask, mug, bucket) ———
function vessel(S, E, r1, r2, bulge, k) {
  const a = unit(sub(E, S)), n = [-a[1], a[0]];
  const rr = t => lerp(r1, r2, t) * (1 + bulge * 4 * t * (1 - t)), C = t => mixP(S, E, t);
  const front = (t, sg, pad = 1) => { const q = rr(t) * pad; return add(C(t), add(mul(n, sg * q), mul(a, -k * q * Math.sqrt(Math.max(0, 1 - sg * sg))))); };
  const seam = sg => { const p0 = front(0, sg), p1 = front(.5, sg), p2 = front(1, sg); return [p0, [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2], p2]; };
  const band = (t, pad = 1.035) => [C(t), mul(n, rr(t) * pad), mul(a, -k * rr(t) * pad)];
  return { S, E, a, n, k, rr, C, front, seam, band };
}
/** Staves of different width: seams crowd to the edges as on a round form; every stave has its own tint. */
function staves(L, G, kind, R, s, o = {}) {
  const c = G.C(.5), rp = L.ramp(kind, c[0], c[1]), th = []; let ang = -90 + 5 + R() * 9, out = '';
  const step = o.step || 13;
  while (ang < 87) { th.push(ang); ang += step + R() * step * .85; }
  th.forEach((g, i) => { const [p0, cc, p2] = G.seam(Math.sin(rad(g)));
    if (i) { const [q0, qc, q2] = G.seam(Math.sin(rad(th[i - 1]))), v = R(); out += `<path d="M${P2(q0)}Q${P2(qc)} ${P2(q2)}L${P2(p2)}Q${P2(cc)} ${P2(p0)}Z" fill="${v > .5 ? rp.lit : rp.shadow}" opacity="${f(.03 + Math.abs(v - .5) * .3)}"/>`; }
    out += `<path d="M${P2(p0)}Q${P2(cc)} ${P2(p2)}" stroke="${rp.outline}" stroke-width="${f(clamp(.4 * s, .28, .6))}" fill="none" opacity=".6"/>`; });
  return { svg: out, th };
}
/** Hoops: bands that follow the round of the vessel, a little proud of the wood, with a shadow under each. */
function hoops(u, L, G, kind, at, R, s, o = {}) {
  const c = G.C(.5), rm = Math.max(G.rr(0), G.rr(.5), G.rr(1)) * 1.04, g = mat(kind, L, { form: 'cyl', x1: G.S[0], y1: G.S[1], x2: G.E[0], y2: G.E[1], r: rm, u }), rp = g.ramp, la = L.at(c[0], c[1]);
  const up = (la.dx * G.a[0] + la.dy * G.a[1]) >= 0 ? 1 : -1; let out = `<defs>${g.defs}</defs>`;
  for (const [t0, w0] of at) { const w = w0 * (.9 + R() * .22), ta = clamp(t0 - w / 2 + (R() - .5) * .012, .003, .997), tb = clamp(ta + w, .003, .997);
    const [c1, v1, w1] = G.band(ta), [c2, v2, w2] = G.band(tb), [cs, vs, ws] = up > 0 ? [c1, v1, w1] : [c2, v2, w2];
    out += `<path d="${halfD(add(cs, mul(G.a, -up * .55 * s)), vs, ws)}" stroke="${L.shadowTint}" stroke-width="${f(1.1 * s)}" fill="none" opacity=".34"/>`
      + `<path d="${halfD(c1, v1, w1)}${halfR(c2, v2, w2)}Z" fill="${g.fill}" stroke="${rp.outline}" stroke-width="${f(clamp(.4 * s, .3, .5))}" stroke-linejoin="round"/>`
      + `<path d="${halfD(add(up > 0 ? c2 : c1, mul(G.a, -up * .3 * s)), mul(up > 0 ? v2 : v1, .985), mul(up > 0 ? w2 : w1, .985))}" stroke="${mix(rp.lit, '#ffffff', .25)}" stroke-width="${f(.3 * s)}" fill="none" opacity=".45"/>`;
    if (o.rivets !== false) { const sg = (R() * 1.3 - .65); out += rivet(L, G.front((ta + tb) / 2, sg, 1.035), clamp(.42 * s, .25, .6), kind); }
  }
  return out;
}
/**
 * The open mouth of a round vessel seen from above: the far inner wall (lit on the side away from the light), the
 * contents at `depth` below the rim, the rim's shadow on them. c — the rim's centre, v, w — its half-axes, down —
 * the unit vector into the vessel. fill: 'water' | 'rum' | 'powder' | 'dark' | svg colour.
 */
function mouth(u, L, c, v, w, down, kind, o = {}) {
  const inner = o.inner || .88, vi = mul(v, inner), wi = mul(w, inner), la = L.at(c[0], c[1]), rp = L.ramp(kind, c[0], c[1]), R = Math.hypot(v[0], v[1]), kk = Math.hypot(w[0], w[1]) / (R || 1);
  const cid = nid('mo', u), wid = nid('mw', u), sid = nid('ms', u), vu = unit(v), sg = (la.dx * vu[0] + la.dy * vu[1]) >= 0 ? 1 : -1, lx = mul(vu, sg * R * inner);
  let defs = `<clipPath id="${cid}"><path d="${ellD(c, vi, wi)}"/></clipPath>` + linGrad(wid, c[0] + lx[0], c[1] + lx[1], c[0] - lx[0], c[1] - lx[1], [[0, L.tone(kind, -.85, c[0], c[1])], [.45, L.tone(kind, -.35, c[0], c[1])], [1, L.tone(kind, .25 + .45 * la.p, c[0], c[1])]]);
  let body = `<path d="${ellD(c, vi, wi)}" fill="url(#${wid})"/>`;
  if (o.fill && o.fill !== 'dark') {
    const cc = add(c, mul(down, o.depth != null ? o.depth : R * .4)), lid = nid('ml', u);
    const col = o.fill === 'water' ? [L.tone('water-wet', .55, c[0], c[1]), L.tone('water-wet', -.5, c[0], c[1])] : o.fill === 'rum' ? [mix(L.tone('leather', .5, c[0], c[1]), '#7a2c0a', .35), mix(L.tone('leather', -.7, c[0], c[1]), '#2a0c04', .5)] : o.fill === 'powder' ? [L.tone('tar', .5, c[0], c[1]), L.tone('tar', -.5, c[0], c[1])] : [o.fill, scale(o.fill, .6)];
    defs += linGrad(lid, cc[0] - lx[0], cc[1] - lx[1], cc[0] + lx[0], cc[1] + lx[1], [[0, col[0]], [1, col[1]]]) + linGrad(sid, cc[0] + lx[0], cc[1] + lx[1], cc[0] - lx[0] * .2, cc[1] - lx[1] * .2, [[0, L.shadowTint, .7], [.5, L.shadowTint, .3], [1, L.shadowTint, 0]]);
    body += `<path d="${ellD(cc, vi, wi)}" fill="url(#${lid})"/>`;
    if (o.fill === 'powder') { const Rg = rng(seedOf(o, 5)); for (let i = 0; i < 22; i++) { const q = Rg() * 6.283, d = Math.sqrt(Rg()) * .85; body += `<circle cx="${f(cc[0] + vi[0] * Math.cos(q) * d + wi[0] * Math.sin(q) * d)}" cy="${f(cc[1] + vi[1] * Math.cos(q) * d + wi[1] * Math.sin(q) * d)}" r="${f(R * (.018 + Rg() * .03))}" fill="${i % 3 ? col[1] : rp.half}" opacity=".55"/>`; } }
    else { const sp = L.ramp('water-wet', c[0], c[1]).spec, h = add(cc, add(mul(vi, -sg * .34), mul(wi, -.2))); // the sky's light on the liquid, on the side away from the rim's shadow
      body += `<ellipse cx="${f(h[0])}" cy="${f(h[1])}" rx="${f(R * .3)}" ry="${f(Math.max(.2, R * .3 * kk))}" fill="${sp}" opacity="${f(o.fill === 'water' ? .5 : .28)}"/><ellipse cx="${f(h[0] - sg * R * .05)}" cy="${f(h[1])}" rx="${f(R * .12)}" ry="${f(Math.max(.15, R * .12 * kk))}" fill="#ffffff" opacity="${f(o.fill === 'water' ? .75 : .45)}"/>`; }
    body += `<path d="${ellD(cc, vi, wi)}" fill="url(#${sid})"/><path d="${ellD(cc, vi, wi)}" fill="none" stroke="${rp.outline}" stroke-width="${f(clamp(R * .03, .2, .4))}" opacity=".5"/>`;
  }
  return `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}</g><path d="${ellD(c, vi, wi)}" fill="none" stroke="${rp.outline}" stroke-width="${f(clamp(R * .04, .25, .5))}"/>`;
}
/** Stave ends on the rim of a vessel: short radial ticks between the outer and the inner ellipse. */
function rimTicks(L, c, v, w, inner, R, kind, n = 14) {
  const rp = L.ramp(kind, c[0], c[1]); let d = '';
  for (let i = 0; i < n; i++) { const q = (i + R() * .7) / n * 6.283, e = add(mul(v, Math.cos(q)), mul(w, Math.sin(q))); d += `M${P2(add(c, mul(e, inner)))}L${P2(add(c, e))}`; }
  return `<path d="${d}" stroke="${rp.outline}" stroke-width=".3" fill="none" opacity=".55"/>`;
}

/**
 * barrel(u, L, { x, y, s, kind: 'rum' | 'powder' | 'water', lying, open, ell, seed, flip, rot }) — a cask: staves of
 * different width, iron hoops, the chime and the recessed head. Standing, it is 30 units high at s = 1 (the belly
 * is 21.5 wide); (x, y) — the centre of the bottom. lying: on its side, 30 long, (x, y) — under the belly, the
 * head to the right (flip — to the left), with chocks. rum — oak with a tap and a bung; powder — tarred, a rope
 * becket on the head; water — pale pine. open: no head, the contents show (water, rum, powder).
 */
function barrel(u, L, o = {}) {
  const F = frame(o), s = F.s, R = rng(seedOf(o, 3)), kind = o.kind || 'rum', wood = kind === 'powder' ? 'tar' : kind === 'water' ? 'pine-deck' : 'oak';
  const H = 30, r = 9.2, bulge = .17, lying = !!o.lying, k = o.ell != null ? o.ell : lying ? .3 : clamp(L.ellipse(F.y), .16, .4), Rs = r * s;
  const S = lying ? F.p(-H / 2, -r * (1 + bulge)) : F.p(0, 0), E = lying ? F.p(H / 2, -r * (1 + bulge)) : F.p(0, -H);
  const G = vessel(S, E, Rs, Rs, bulge, k), { a, n } = G, rp = L.ramp(wood, ...G.C(.5)), la = L.at(...G.C(.5));
  let out = lying ? seat(u, L, o, F.x, F.y, H * s * .78, { ry: Math.max(.8, Rs * .16) }) : seat(u, L, o, S[0], S[1] + k * Rs * .45, Rs * 2.15);
  if (lying) for (const lx of [-9.5, 8.5]) out += shadeBox(u, [F.face([[lx - 2.2, -2.6], [lx + 2.2, -2.6], [lx + 2.9, -3.6], [lx - 1.5, -3.6]], 'top'), F.face([[lx - 2.2, -2.6], [lx + 2.2, -2.6], [lx + 2.6, 1.2], [lx - 2.6, 1.2]], 'front')], L, 'oak', { seed: seedOf(o, 3) + lx });
  out += shadeCyl(u, S[0], S[1], E[0], E[1], Rs, L, wood, { ell: k, face: 2, bulge, seed: seedOf(o, 3) });
  out += staves(L, G, wood, R, s).svg;
  if (kind === 'water') { // a wet dark foot
    const [c1, v1, w1] = G.band(0, 1), [c2, v2, w2] = G.band(.16, 1), wid = nid('bw', u);
    out += `<defs>${linGrad(wid, c1[0], c1[1], c2[0], c2[1], [[0, L.shadowTint, .5], [1, L.shadowTint, 0]])}</defs><path d="${halfD(c1, v1, w1)}${halfR(c2, v2, w2)}Z" fill="url(#${wid})"/>`;
  }
  const hw = .052, at = kind === 'rum' ? [[.05, hw * 1.2], [.185, hw], [.33, hw * .9], [.67, hw * .9], [.815, hw], [.95, hw * 1.2]] : [[.05, hw * 1.25], [.2, hw * 1.05], [.8, hw * 1.05], [.95, hw * 1.25]];
  out += hoops(u, L, G, 'iron', at, R, s);
  // the head: the chime (stave ends) round a recessed head, or the open mouth
  const hv = mul(n, Rs), hwv = mul(a, k * Rs), dn = mul(a, -1), dep = 1.5 * s;
  if (o.open) out += mouth(u, L, E, hv, hwv, mul(dn, s), wood, { inner: .88, depth: lying ? Rs * 2 : (kind === 'powder' ? 1.7 : 2.1) * s, fill: lying ? 'dark' : kind, seed: seedOf(o, 3) }) + rimTicks(L, E, hv, hwv, .88, R, wood);
  else {
    const cid = nid('bh', u), hc = add(E, mul(dn, dep)), vi = mul(hv, .88), wi = mul(hwv, .88), n3 = [a[0] * Math.sqrt(1 - k * k), -a[1] * Math.sqrt(1 - k * k), k];
    const hg = mat(wood, L, { form: 'plane', x1: hc[0] - Rs, y1: hc[1] - Rs * Math.max(k, .3), x2: hc[0] + Rs, y2: hc[1] + Rs * Math.max(k, .3), n: n3, u }), wid = nid('bi', u), sid = nid('bs', u);
    const lv = unit([la.ux * 1, la.uy * (lying ? 1 : k)]), ls = [lv[0] * Rs * .88 * (lying ? k : 1), lv[1] * Rs * .88 * (lying ? 1 : k)];
    out += `<defs>${hg.defs}<clipPath id="${cid}"><path d="${ellD(E, vi, wi)}"/></clipPath>${linGrad(wid, E[0] + ls[0], E[1] + ls[1], E[0] - ls[0], E[1] - ls[1], [[0, L.tone(wood, -.8, E[0], E[1])], [1, L.tone(wood, .3, E[0], E[1])]])}${linGrad(sid, hc[0] + ls[0], hc[1] + ls[1], hc[0] - ls[0] * .1, hc[1] - ls[1] * .1, [[0, L.shadowTint, .6], [.45, L.shadowTint, .22], [1, L.shadowTint, 0]])}</defs>`;
    let hd = `<path d="${ellD(E, vi, wi)}" fill="url(#${wid})"/><path d="${ellD(hc, vi, wi)}" fill="${hg.fill}"/>`;
    const be = R() * 2.4 - 1.2, cb = Math.cos(be), sb = Math.sin(be), hp = (q, e) => add(hc, add(mul(vi, q * cb - e * sb), mul(wi, q * sb + e * cb)));
    let q = -.55 + R() * .2; while (q < .8) { const e = Math.sqrt(1 - q * q); hd += `<path d="M${P2(hp(q, -e))}L${P2(hp(q, e))}" stroke="${hg.ramp.outline}" stroke-width="${f(clamp(.35 * s, .25, .5))}" opacity=".55"/><path d="M${P2(hp(q + .04, -e))}L${P2(hp(q + .04, e))}" stroke="${hg.ramp.lit}" stroke-width="${f(.25 * s)}" opacity=".3"/>`; q += .38 + R() * .3; }
    hd += `<path d="${ellD(hc, vi, wi)}" fill="url(#${sid})"/>`;
    out += `<g clip-path="url(#${cid})">${hd}</g><path d="${ellD(E, vi, wi)}" fill="none" stroke="${rp.outline}" stroke-width="${f(clamp(.38 * s, .28, .5))}"/>` + rimTicks(L, E, hv, hwv, .88, R, wood);
    if (kind === 'powder') { // a rope becket through two holes in the head
      const h1 = hp(-.5, 0), h2 = hp(.5, 0), top = add(add(hc, mul(a, (lying ? 3.4 : 5.4) * s)), lying ? [0, 2.6 * s] : [0, 0]);
      out += `<circle cx="${f(h1[0])}" cy="${f(h1[1])}" r="${f(.7 * s)}" fill="${rp.outline}"/><circle cx="${f(h2[0])}" cy="${f(h2[1])}" r="${f(.7 * s)}" fill="${rp.outline}"/>` + rope(u, L, [h1, mixP(h1, top, .75), add(top, [0, -.2 * s]), mixP(h2, top, .75), h2], { r: .78 * s, seed: seedOf(o, 3) + 5 });
    } else { const bp = hp(.42, .3); out += shadeCyl(u, bp[0], bp[1], bp[0] + a[0] * 1.5 * s, bp[1] + a[1] * 1.5 * s, 1.2 * s, L, 'pine-deck', { ell: lying ? .3 : k * 1.1, face: 2, outline: .3, grain: false }); }
  }
  if (kind === 'rum') { // a tap in the lower front (standing) or in the head (lying), a bung on the bilge
    if (lying) { const p0 = add(E, mul(n, Rs * .5)), p1 = add(p0, mul(a, 5 * s)), pk = add(p0, mul(a, 3.2 * s));
      out += shadeCyl(u, p0[0], p0[1], p1[0], p1[1], 1.05 * s, L, 'brass', { ell: .3, face: 2, outline: .35 }) + shadeCyl(u, pk[0], pk[1] + .6 * s, pk[0], pk[1] - 3 * s, .55 * s, L, 'brass', { outline: .3 }) + shadeCyl(u, pk[0] - 1.5 * s, pk[1] - 3 * s, pk[0] + 1.5 * s, pk[1] - 3 * s, .55 * s, L, 'brass', { outline: .3, cap: 'round' });
      const bg = G.front(.5, -.93); out += shadeCyl(u, bg[0], bg[1] + .4 * s, bg[0], bg[1] - 1.5 * s, 1.3 * s, L, 'pine-deck', { ell: .3, face: 2, outline: .3, grain: false });
    } else { const sg = .5 * F.fl, p0 = G.front(.17, sg), dir = unit(add(mul(n, sg), mul(a, -k * Math.sqrt(1 - sg * sg)))), p1 = add(p0, mul(dir, 4.6 * s)), pk = add(p0, mul(dir, 2.8 * s));
      out += `<path d="M${P2(add(p0, [0, 1 * s]))}q${f(.4 * s)} ${f(2.6 * s)} ${f(-.2 * s)} ${f(4.2 * s)}" stroke="${rp.shadow}" stroke-width="${f(1.1 * s)}" fill="none" opacity=".4" stroke-linecap="round"/>`
        + shadeCyl(u, p0[0], p0[1], p1[0], p1[1], 1.05 * s, L, 'brass', { ell: .45, face: 2, outline: .35 }) + shadeCyl(u, pk[0], pk[1] + .5 * s, pk[0], pk[1] - 3.1 * s, .55 * s, L, 'brass', { outline: .3 }) + shadeCyl(u, pk[0] - 1.5 * s, pk[1] - 3.1 * s, pk[0] + 1.5 * s, pk[1] - 3.1 * s, .55 * s, L, 'brass', { outline: .3, cap: 'round' });
      const bg = G.front(.52, -.42 * F.fl); out += `<ellipse cx="${f(bg[0])}" cy="${f(bg[1])}" rx="${f(1.25 * s)}" ry="${f(1.5 * s)}" fill="${L.tone('pine-deck', .3, bg[0], bg[1])}" stroke="${rp.outline}" stroke-width=".35"/>`; }
  }
  return out;
}

// ——— the gun ———
const GUN = { tx: 8, ty: 15.8, breech: -26, muzzle: 34 }; // the trunnion's place on the carriage; the bore's ends from the trunnion
function gunGeo(o) {
  const F = frame(o), kl = (o.len || 60) / 60, e = rad(o.elev || 0), turn = o.turn != null ? o.turn : .18, q = [turn, -turn * .72], rec = (o.recoil || 0) * 10;
  const car = o.carriage !== false;
  // carriage space: X along the gun, Y up, Z into the depth -> local picture
  const C3 = (X, Y, Z = 0) => car ? F.p(X - rec + q[0] * Z, -Y + q[1] * Z) : F.p(X - GUN.tx + q[0] * Z, -(Y - GUN.ty) + q[1] * Z);
  const B = (xb, yb = 0, Z = 0) => C3(GUN.tx + xb * kl * Math.cos(e) + yb * Math.sin(e), GUN.ty + xb * kl * Math.sin(e) - yb * Math.cos(e), Z);
  return { F, kl, e, turn, q, rec, car, C3, B };
}
/**
 * cannon(u, L, { x, y, s, len, elev, carriage, recoil, turn, breech, tackle, seed, flip, rot }) — a cast-iron ship's
 * gun seen from the side (the muzzle to the right, flip — to the left; `turn` 0..0.3 — how far the muzzle is turned
 * at us, 0.18): the base ring, two reinforces with their rings, the chase, the muzzle swell with the bore, the
 * cascabel, the vent, trunnions under capsquares; a truck carriage: stepped cheeks with bolts, two axles, four
 * trucks, the bed and the quoin under the breech, the breeching rope round the cascabel and tackles as paired
 * lines. The bore is `len` units long (60) at s = 1; the carriage is 35 long and stands on y. elev — degrees up;
 * recoil 0..1 — run back (the breeching goes taut); carriage: false — the barrel alone, (x, y) — its trunnion.
 * cannon.muzzle(opts) -> { x, y, dir } for muzzleFlash.
 */
function cannon(u, L, o = {}) {
  const G = gunGeo(o), { F, C3, B, car } = G, s = F.s, R = rng(seedOf(o, 6)), k = G.turn;
  let out = '';
  const truck = (X, r, Z0, Z1, near) => { // a solid wooden wheel: the tread, the face with its grain and seam, the iron axle end
    const cf = C3(X, r, Z0), cb = C3(X, r, Z1), rs = r * s, la = L.at(cf[0], cf[1]), rp = L.ramp('oak', cf[0], cf[1]);
    let w = `<circle cx="${f(cb[0])}" cy="${f(cb[1])}" r="${f(rs)}" fill="${L.tone('oak', clamp(la.dx * .5 - la.dy * .8, -1, 1) * (near ? 1 : .2) - (near ? 0 : .5), cf[0], cf[1])}" stroke="${rp.outline}" stroke-width=".45"/>`;
    if (!near) return w + `<circle cx="${f(cf[0])}" cy="${f(cf[1])}" r="${f(rs)}" fill="${L.tone('oak', -.6, cf[0], cf[1])}" stroke="${rp.outline}" stroke-width=".45"/>`;
    w += disc(u, L, cf, rs, 'oak', { outline: .5 });
    const cid = nid('gw', u), Rw = rng(seedOf(o, 6) + X * 7); let g = '';
    for (let i = 0; i < 6; i++) { const yy = (Rw() * 2 - 1) * rs * .9, x0 = (Rw() - .7) * rs, l = rs * (.5 + Rw()); g += `<path d="M${f(cf[0] + x0)} ${f(cf[1] + yy)}q${f(l / 2)} ${f((Rw() - .5) * .8)} ${f(l)} 0" stroke="${i % 2 ? rp.core : rp.lit}" stroke-width=".3" fill="none" opacity=".3"/>`; }
    const sy = (Rw() - .5) * rs * .5;
    w += `<defs><clipPath id="${cid}"><circle cx="${f(cf[0])}" cy="${f(cf[1])}" r="${f(rs)}"/></clipPath></defs><g clip-path="url(#${cid})">${g}<path d="M${f(cf[0] - rs)} ${f(cf[1] + sy)}L${f(cf[0] + rs)} ${f(cf[1] + sy + (Rw() - .5) * 1.2)}" stroke="${rp.outline}" stroke-width=".4" opacity=".6"/>`
      + `<circle cx="${f(cf[0])}" cy="${f(cf[1])}" r="${f(rs * .88)}" fill="none" stroke="${rp.shadow}" stroke-width="${f(rs * .1)}" opacity=".3"/><ellipse cx="${f(cf[0])}" cy="${f(cf[1] + rs * .92)}" rx="${f(rs * .8)}" ry="${f(rs * .3)}" fill="${L.shadowTint}" opacity=".35"/></g>`;
    w += `<circle cx="${f(cf[0])}" cy="${f(cf[1])}" r="${f(rs * .44)}" fill="${L.tone('oak', -.3, cf[0], cf[1])}" stroke="${rp.outline}" stroke-width=".35"/>` + shadeSphere(u, cf[0], cf[1], rs * .29, L, 'iron', { outline: .35 });
    const lp = F.v(0, -rs * .42 / s); w += `<path d="M${P2(add(cf, mul(lp, .6)))}L${P2(add(cf, mul(lp, 1.25)))}" stroke="${L.ramp('iron', cf[0], cf[1]).outline}" stroke-width="${f(.6 * s)}" stroke-linecap="round"/>`;
    return w;
  };
  // the cheek's outline (X, Y), from the front bottom, counter-clockwise: front end, steps down to the rear
  const steps = [[14, 14.6], [4, 14.6], [4, 12.3], [-3, 12.3], [-3, 10.2], [-10, 10.2], [-10, 8.2], [-17, 8.2], [-17, 6.3], [-21, 6.3]];
  const cheek = Z => 'M' + P2(C3(14, 4.6, Z)) + 'L' + steps.map(p => P2(C3(p[0], p[1], Z))).join('L') + `L${P2(C3(-21, 4.2, Z))}L${P2(C3(-18.2, 4.2, Z))}Q${P2(C3(-15, 5.4, Z))} ${P2(C3(-11.6, 4.3, Z))}L${P2(C3(5.2, 4.4, Z))}Q${P2(C3(9, 5.6, Z))} ${P2(C3(12.6, 4.6, Z))}Z`;
  const ZN = -7, ZI = -4.2;
  if (car) {
    const w1 = C3(9, 0, ZN - 1.3), w2 = C3(-15, 0, ZN - 1.3);
    out += seat(u, L, o, w1[0], w1[1], 9.5 * s) + seat(u, L, o, w2[0], w2[1], 8 * s) + seat(u, L, o, ...C3(-3, 0, 0), 36 * s, { opacity: .45, ry: 2.2 * s });
    out += truck(9, 4.6, 9.6, 7, false) + truck(-15, 3.8, 9.6, 7, false);
    out += `<path d="${cheek(4.2)}" fill="${L.tone('oak', -.75, ...C3(0, 9, 4))}" stroke="${L.ramp('oak', ...C3(0, 9, 4)).outline}" stroke-width=".45" stroke-linejoin="round"/>`;
    // axle trees, the bed and the quoin (wedge) with its handle under the breech
    out += shadeBox(u, [{ pts: [C3(-21, 6.3, ZI), C3(-6, 6.3, ZI), C3(-6, 8.4, ZI), C3(-21, 8.4, ZI)], n: F.n('front') }], L, 'oak', { seed: seedOf(o, 6) + 1 });
    out += shadeBox(u, [{ pts: [C3(-22, 8.4, -2), C3(-7.5, 8.4, -2), C3(-7.5, 9.5, -2), C3(-22, 12.2, -2)], n: F.n('front'), grain: [1, 0] }, { pts: [C3(-22, 12.2, -2), C3(-7.5, 9.5, -2), C3(-7.5, 9.5, 2), C3(-22, 12.2, 2)], n: F.n([.18, .98, 0]) }], L, 'pine-deck', { seed: seedOf(o, 6) + 2 });
    const q0 = C3(-22, 10.2, -2), q1 = C3(-24.6, 10.2, -2); out += shadeCyl(u, q0[0], q0[1], q1[0], q1[1], .75 * s, L, 'pine-deck', { cap: 'round', outline: .35, grain: false });
  }
  // the barrel, breech to muzzle: every part is a cylinder of its own, the rings stand proud
  const seg = (x0, x1, r0, r1, extra) => { const p = B(x0), q = B(x1); return shadeCyl(u, p[0], p[1], q[0], q[1], Math.max(r0, r1) * s, L, 'iron', Object.assign({ r1: r0 * s, r2: r1 * s, ell: k, face: 2, outline: .45, seed: seedOf(o, 6) + x0 }, extra)); };
  const cb = B(-31.2), rpI = L.ramp('iron', ...B(0));
  out += shadeSphere(u, cb[0], cb[1], 2.05 * s, L, 'iron', { outline: .45 }) + seg(-29.8, -28.2, 1.25, 1.5) + seg(-28.4, -26, 2.6, 5.2, { spec: false }) + seg(-26, -24.5, 5.9, 5.9) + seg(-24.5, -10, 5.35, 4.95);
  { const v0 = B(-21.5, -5.2), v1 = B(-21.5, -6); out += `<ellipse cx="${f(v0[0])}" cy="${f(v0[1])}" rx="${f(1.3 * s)}" ry="${f(.5 * s)}" transform="rotate(${f(F.rot - deg(G.e) * F.fl)} ${f(v0[0])} ${f(v0[1])})" fill="${rpI.core}" stroke="${rpI.outline}" stroke-width=".35"/><circle cx="${f(v1[0])}" cy="${f(v1[1])}" r="${f(.4 * s)}" fill="${rpI.outline}"/>`; } // the vent
  out += seg(-10, -8.7, 5.4, 5.4) + seg(-8.7, 6, 4.85, 4.45);
  out += seg(6, 7.2, 4.9, 4.9) + seg(7.2, 27.6, 4.25, 3.2) + seg(26, 26.8, 3.6, 3.6) + seg(27.6, 30.2, 3.2, 3.75, { spec: false }) + seg(30.2, 32.6, 3.75, 4.3) + seg(32.6, 34, 4.3, 3.95);
  { const mc = B(34), ax = unit(sub(B(34), B(0))), nn = [-ax[1], ax[0]], br = 1.75 * s; // the bore
    out += `<path d="${ellD(mc, mul(nn, br), mul(ax, br * k))}" fill="${mix(rpI.outline, '#0a0806', .55)}"/><path d="${halfD(add(mc, mul(ax, .25 * s)), mul(nn, br * .96), mul(ax, br * k * .96))}" stroke="${rpI.half}" stroke-width="${f(.3 * s)}" fill="none" opacity=".5"/>`; }
  // soot and rust in the hollows behind the rings
  for (const [xr, rr] of [[-24.3, 5.3], [-8.5, 4.8], [7.4, 4.2], [27, 3.2]]) { const c = B(xr), ax = unit(sub(B(34), B(0))), nn = [-ax[1], ax[0]]; out += `<path d="${halfD(c, mul(nn, rr * s * .97), mul(ax, -rr * s * k))}" stroke="${mix(rpI.outline, '#5a2c14', .35)}" stroke-width="${f(.7 * s)}" fill="none" opacity=".4"/>`; }
  if (!car) { const tc = B(0, .5, -6.2); return out + disc(u, L, tc, 2.1 * s, 'iron'); }
  // the near cheek: its face, the treads of the steps and its front end; bolts; the capsquare over the trunnion
  { const cid = nid('gc', u), fc = [C3(-21, 4, ZN), C3(14, 4, ZN), C3(14, 14.6, ZN), C3(-21, 14.6, ZN)], g = mat('oak', L, { form: 'plane', x1: fc[0][0], y1: fc[2][1], x2: fc[1][0], y2: fc[0][1], n: F.n('front'), u }), rp = g.ramp, la = L.at(...C3(0, 9, ZN));
    let tr = '';
    for (let i = 0; i + 1 < steps.length; i += 2) tr += poly([C3(steps[i][0], steps[i][1], ZN), C3(steps[i + 1][0], steps[i + 1][1], ZN), C3(steps[i + 1][0], steps[i + 1][1], ZI), C3(steps[i][0], steps[i][1], ZI)]);
    out += `<path d="${tr}" fill="${L.tone('oak', clamp(-la.dy * .9 + .1, -1, 1), ...C3(0, 9, ZN))}" stroke="${rp.outline}" stroke-width=".4" stroke-linejoin="round"/><path d="${poly([C3(14, 4.6, ZN), C3(14, 14.6, ZN), C3(14, 14.6, ZI), C3(14, 4.6, ZI)])}" fill="${L.tone('oak', clamp(la.dx * F.fl, -1, 1), ...C3(14, 9, ZN))}" stroke="${rp.outline}" stroke-width=".4" stroke-linejoin="round"/>`;
    let gr = ''; const Rg = rng(seedOf(o, 6) + 9);
    for (let i = 0; i < 12; i++) { const X = -21 + Rg() * 30, Y = 4.8 + Rg() * 9.4, l = 4 + Rg() * 9, a = C3(X, Y, ZN), b = C3(X + l, Y + (Rg() - .5) * .5, ZN), c = C3(X + l / 2, Y + (Rg() - .5) * .9, ZN); gr += `<path d="M${P2(a)}Q${P2(c)} ${P2(b)}" stroke="${i % 3 ? rp.core : rp.lit}" stroke-width=".32" fill="none" opacity="${i % 3 ? .32 : .24}"/>`; }
    gr += `<path d="M${P2(C3(-21, 8.9, ZN))}L${P2(C3(-4, 9.1, ZN))}L${P2(C3(14, 8.8, ZN))}" stroke="${rp.outline}" stroke-width=".4" fill="none" opacity=".55"/>`; // the cheek is two planks
    // the barrel's shadow on the cheek and the dark under the steps
    const sg = nid('gs', u); out += `<defs>${g.defs}<clipPath id="${cid}"><path d="${cheek(ZN)}"/></clipPath>${linGrad(sg, 0, C3(0, 15, ZN)[1], 0, C3(0, 9.5, ZN)[1], [[0, L.shadowTint, .5], [1, L.shadowTint, 0]])}</defs>`;
    out += `<path d="${cheek(ZN)}" fill="${g.fill}"/><g clip-path="url(#${cid})">${gr}<path d="${poly([C3(-21, 16, ZN), C3(14, 16, ZN), C3(14, 9, ZN), C3(-21, 9, ZN)])}" fill="url(#${sg})" opacity="${f(clamp(.35 - la.dy * .5, .2, .8))}"/></g><path d="${cheek(ZN)}" fill="none" stroke="${rp.outline}" stroke-width=".55" stroke-linejoin="round"/>`;
    // worn light edges of the steps on the light's side
    out += `<path d="${line(steps.map(p => C3(p[0], p[1] - .35, ZN)))}" stroke="${mix(rp.lit, '#ffffff', .3)}" stroke-width=".35" fill="none" opacity="${f(clamp(.15 - la.dy * .5, 0, .6))}"/>`;
    for (const [X, Y] of [[11.4, 12.6], [1, 10.5], [-6.4, 8.6], [-13.4, 6.7], [-19.2, 5.2], [12, 6.2], [-9, 5.6]]) out += rivet(L, C3(X, Y, ZN), .62 * s);
  }
  const tc = B(0, .5, ZN - .8); out += disc(u, L, tc, 2.1 * s, 'iron');
  { const p = [C3(4.2, 14.9, ZN), C3(5.4, 15, ZN), C3(5.9, 17.2, ZN), C3(8, 18.2, ZN), C3(10.1, 17.2, ZN), C3(10.6, 15, ZN), C3(11.8, 14.9, ZN)]; out += tube(u, L, 'iron', smooth(p), .5 * s, p[3]) + rivet(L, p[0], .5 * s) + rivet(L, p[6], .5 * s); }
  out += truck(9, 4.6, ZN - 2.6, ZN - .1, true) + truck(-15, 3.8, ZN - 2.6, ZN - .1, true);
  // ring bolts, the breeching and the tackles
  const ring = (X, Y, r = 1.15) => { const c = C3(X, Y, ZN - .2), v = F.v(r, 0), w = F.v(0, r * 1.15); return tube(u, L, 'iron', ellD(add(c, [0, r * s * .9]), v, w), .3 * s, c) + rivet(L, c, .5 * s); };
  out += ring(-1, 9.6) + ring(11.6, 8.6, .95) + ring(-20, 5.2, .95);
  if (o.breech !== false) { const slack = 1 - clamp(o.recoil || 0), side = F.p((o.sideX != null ? o.sideX : 22), -10.5), nk = B(-29), rr = .74 * s, rg = C3(-1, 8.4, ZN - .4);
    const up = [add(nk, F.v(-.4, -1.3)), add(nk, F.v(1.2, .9)), mixP(nk, rg, .45), add(mixP(nk, rg, .8), F.v(-.6, .5 * slack)), rg];
    const fw = [rg, add(mixP(rg, side, .33), F.v(0, (2.6 * slack + .2))), add(mixP(rg, side, .7), F.v(0, (2 * slack + .1))), side];
    out += rope(u, L, up, { r: rr, seed: seedOf(o, 6) + 3 }) + rope(u, L, fw, { r: rr, seed: seedOf(o, 6) + 4 }); }
  if (o.tackle !== false) { const rpR = L.ramp('rope', ...C3(0, 6, ZN));
    const pair = (a, b, sag) => { const m = add(mixP(a, b, .5), [0, sag * s]), nn = unit([-(b[1] - a[1]), b[0] - a[0]]); let t = '';
      for (const e of [-.34, .34]) t += `<path d="M${P2(add(a, mul(nn, e * s)))}Q${P2(add(m, mul(nn, e * s)))} ${P2(add(b, mul(nn, e * s)))}" stroke="${rpR.outline}" stroke-width="${f(.5 * s)}" fill="none"/><path d="M${P2(add(a, mul(nn, e * s)))}Q${P2(add(m, mul(nn, e * s)))} ${P2(add(b, mul(nn, e * s)))}" stroke="${e < 0 ? rpR.half : rpR.core}" stroke-width="${f(.26 * s)}" fill="none"/>`;
      const blk = p => { const g = mat('oak', L, { form: 'sphere', x1: p[0], y1: p[1], r: 1.2 * s, u }), an = deg(Math.atan2(b[1] - a[1], b[0] - a[0])); return `<defs>${g.defs}</defs><ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(1.2 * s)}" ry="${f(.8 * s)}" transform="rotate(${f(an)} ${f(p[0])} ${f(p[1])})" fill="${g.fill}" stroke="${g.ramp.outline}" stroke-width=".35"/>`; };
      return t + blk(mixP(a, b, .16)) + blk(mixP(a, b, .84)); };
    out += pair(C3(11.6, 7.6, ZN - .4), F.p((o.sideX != null ? o.sideX : 22), -13.5), .6) + pair(C3(-20, 4.4, ZN - .4), F.p(-34, -.9), .5); }
  return out;
}
/** cannon.muzzle(opts) -> { x, y, dir }: the middle of the muzzle's face and the bore's direction (degrees, 0 — to the right, 90 — down) for muzzleFlash. */
cannon.muzzle = (o = {}) => { const G = gunGeo(o), m = G.B(GUN.muzzle), t = G.B(0); return { x: m[0], y: m[1], dir: deg(Math.atan2(m[1] - t[1], m[0] - t[0])) }; };

/**
 * gunPort(u, L, { x, y, s, w, h, open, kind, inside, horizon, below, seed, flip }) — a gun port in a ship's side;
 * (x, y) — the middle of its sill, w x h — the opening (16 x 14). Seen from outside: the dark opening with the
 * shadow of the side in it, the lit sill and jamb (the planking's thickness), the lid on two strap hinges raised by
 * `open` 0..1 (its red inner side shows when it is up; `below` 0..0.6 — how far below the port we stand), lanyards.
 * inside: true — seen from the deck: the frame with the sky and the sea in the opening (horizon — its y).
 */
function gunPort(u, L, o = {}) {
  const F = frame(o), s = F.s, w = o.w || 16, h = o.h || 14, kind = o.kind || 'tar', open = o.open === true || o.open == null ? 1 : +o.open || 0, R = rng(seedOf(o, 8));
  const c = F.p(0, -h / 2), la = L.at(c[0], c[1]), rp = L.ramp(kind, c[0], c[1]), hid = nid('ph', u), cid = nid('pc', u);
  const hole = [F.p(-w / 2, 0), F.p(w / 2, 0), F.p(w / 2, -h), F.p(-w / 2, -h)], th = 1.9;
  let out = `<defs><clipPath id="${cid}"><path d="${poly(hole)}"/></clipPath>`;
  if (o.inside) {
    const hz = o.horizon != null ? o.horizon : L.cam.horizon, P = L.pal, top = Math.min(hole[2][1], hole[0][1]), bot = Math.max(hole[2][1], hole[0][1]), t = clamp((hz - top) / Math.max(1, bot - top), .02, .98);
    out += linGrad(hid, 0, top, 0, bot, [[0, P.sky[2]], [t, P.sky[3]], [t + .001, P.sea[0]], [1, mix(P.sea[0], P.sea[1], .7)]]) + '</defs>';
    out += `<path d="${poly(hole)}" fill="url(#${hid})"/>` + (o.through ? `<g clip-path="url(#${cid})">${o.through}</g>` : '');
    // the thickness of the side: the sill and one jamb catch the light from outside, the lintel is dark
    const sill = [F.p(-w / 2, 0), F.p(w / 2, 0), F.p(w / 2 - th * .5, -th * .8), F.p(-w / 2 + th * 1.1, -th * .8)], jamb = [F.p(-w / 2, 0), F.p(-w / 2 + th * 1.1, -th * .8), F.p(-w / 2 + th * 1.1, -h), F.p(-w / 2, -h)];
    out += `<g clip-path="url(#${cid})">` + shadeBox(u, [{ pts: jamb, n: F.n([.8, 0, .6]) }, { pts: sill, n: F.n([0, .9, .44]) }], L, o.wood || 'oak', { seed: seedOf(o, 8) })
      + `<path d="${poly(sill)}" fill="${L.keyColor}" opacity="${f(.28 * L.key.power)}" style="mix-blend-mode:screen"/><path d="${poly([F.p(-w / 2, -h), F.p(w / 2, -h), F.p(w / 2, -h + 1.2), F.p(-w / 2, -h + 1.2)])}" fill="${L.shadowTint}" opacity=".5"/></g>`;
    return out + `<path d="${poly(hole)}" fill="none" stroke="${L.ramp(o.wood || 'oak', c[0], c[1]).outline}" stroke-width=".6" stroke-linejoin="round"/>`;
  }
  const dark = mix(scale(L.shadowTint, .5), '#120c08', .5), deep = mix(L.tone('oak', -.7, c[0], c[1]), dark, .45);
  out += linGrad(hid, c[0] + la.ux * w * .4 * s, hole[2][1], c[0] - la.ux * w * .2 * s, hole[0][1], [[0, dark], [.55, mix(dark, deep, .6)], [1, deep]]) + '</defs>';
  out += `<path d="${poly(hole)}" fill="url(#${hid})"/>`;
  { const sill = [F.p(-w / 2, 0), F.p(w / 2, 0), F.p(w / 2 - th * .3, -th * .75), F.p(-w / 2 + th, -th * .75)], jamb = [F.p(-w / 2, 0), F.p(-w / 2 + th, -th * .75), F.p(-w / 2 + th, -h), F.p(-w / 2, -h)];
    out += `<g clip-path="url(#${cid})">` + shadeBox(u, [{ pts: jamb, n: F.n([.75, 0, .66]) }, { pts: sill, n: F.n([0, .8, .6]) }], L, o.wood || 'oak', { seed: seedOf(o, 8), outline: .3 })
      + `<path d="${poly([F.p(-w / 2, -h), F.p(w / 2, -h), F.p(w / 2, -h * (1 - .3 * open) - 1), F.p(-w / 2, -h * (1 - .3 * open) - 1)])}" fill="${dark}" opacity=".6"/></g>`; }
  out += `<path d="${poly(hole)}" fill="none" stroke="${rp.outline}" stroke-width=".6" stroke-linejoin="round"/><path d="M${P2(F.p(-w / 2 - .5, .5))}L${P2(F.p(w / 2 + .5, .5))}" stroke="${rp.lit}" stroke-width=".4" opacity=".5"/>`;
  // the lid
  const ph = rad(open * 100), kv = o.below != null ? o.below : .55, yf = -h + h * Math.cos(ph) - kv * h * Math.sin(ph), wf = w / 2 * (1 + .1 * Math.sin(ph)), upSide = yf < -h - .2;
  const lid = [[-w / 2, -h], [w / 2, -h], [wf, yf], [-wf, yf]], nrm = upSide ? [0, -Math.sin(ph), -Math.cos(ph)] : [0, Math.sin(ph), Math.cos(ph)];
  if (open > .02 && Math.abs(yf + h) > .6 || open <= .02) {
    const face = F.face(lid, nrm, { kind: upSide ? 'paint-red' : kind, grain: [1, 0] }), ed = 1.3 * (upSide ? -1 : 1) * (open > .02 ? 1 : 0);
    out += shadeBox(u, [face].concat(ed ? [F.face([[-wf, yf], [wf, yf], [wf, yf + ed], [-wf, yf + ed]], 'front', { kind })] : []), L, kind, { seed: seedOf(o, 8) + 1 });
    const q = (a, b) => F.p(lerp(lerp(-w / 2, -wf, b), lerp(w / 2, wf, b), a), lerp(-h, yf, b)), rpl = L.ramp(upSide ? 'paint-red' : kind, ...q(.5, .5));
    for (const b of [.36, .7]) out += `<path d="M${P2(q(0, b + (R() - .5) * .06))}L${P2(q(1, b + (R() - .5) * .06))}" stroke="${rpl.outline}" stroke-width=".35" opacity=".6"/>`;
    for (const a of [.24, .76]) { const st = [q(a - .05, .0), q(a + .05, .0), q(a + .05, upSide ? .34 : .8), q(a - .05, upSide ? .34 : .8)]; out += shadeBox(u, [{ pts: st, n: F.n(nrm) }], L, 'iron', { outline: .35 }) + rivet(L, q(a, .12), .45 * s) + rivet(L, q(a, upSide ? .28 : .66), .45 * s); }
    const rb = q(.5, upSide ? .6 : .82); out += tube(u, L, 'iron', ellD(add(rb, [0, .9 * s]), [.9 * s, 0], [0, 1.1 * s]), .28 * s, rb) + rivet(L, rb, .45 * s);
    if (upSide) for (const a of [.2, .8]) { const p0 = q(a, 1), p1 = F.p(lerp(-w / 2, w / 2, a) * .9, -h * 2 - 3); out += `<circle cx="${f(p1[0])}" cy="${f(p1[1])}" r="${f(.6 * s)}" fill="${rp.outline}"/>` + rope(u, L, [p0, p1], { r: .38 * s, seed: seedOf(o, 8) + a * 10 }); }
  }
  for (const a of [-.26, .26]) { const p = F.p(w * a, -h); out += shadeCyl(u, ...F.p(w * a - 1.3, -h - .2), ...F.p(w * a + 1.3, -h - .2), .7 * s, L, 'iron', { outline: .3 }) + shadeBox(u, [F.face([[w * a - .8, -h - .6], [w * a + .8, -h - .6], [w * a + .8, -h - 3.4], [w * a - .8, -h - 3.4]], 'front')], L, 'iron', { outline: .3 }) + rivet(L, add(p, F.v(0, -2.5)), .4 * s); }
  return out;
}

/** shot(u, L, { x, y, s, r }) — a round shot of radius r (3.2) lying on (x, y): cast iron with the mould's seam. */
function shot(u, L, o = {}) {
  const F = frame(o), r = (o.r || 3.2) * F.s, c = [F.x, F.y - r], R = rng(seedOf(o, 9)), rp = L.ramp('iron', c[0], c[1]), a = R() * 3.14;
  return seat(u, L, o, F.x, F.y, r * 1.5) + shadeSphere(u, c[0], c[1], r, L, 'iron')
    + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r * .97)}" ry="${f(r * (.25 + R() * .2))}" transform="rotate(${f(deg(a))} ${f(c[0])} ${f(c[1])})" fill="none" stroke="${rp.outline}" stroke-width="${f(clamp(r * .06, .2, .4))}" stroke-dasharray="${f(r * 2.6)} ${f(r * 9)}" opacity=".45"/>`
    + `<circle cx="${f(c[0] + (R() - .5) * r)}" cy="${f(c[1] + r * (.2 + R() * .4))}" r="${f(r * .16)}" fill="#6a3a1c" opacity=".25"/>`;
}
/**
 * shotPile(u, L, { x, y, s, n, r, garland, seed }) — a pyramid of round shot on a square foot: n shot along the
 * foot's side (3 -> 9 + 4 + 1), each of radius r (3.2); every ball is lit by the scene's light and drops a soft
 * shadow on the balls under and behind it; a rope garland keeps the foot together (garland: false to drop it).
 */
function shotPile(u, L, o = {}) {
  const F = frame(o), s = F.s, n = Math.max(1, Math.round(o.n || 3)), r = (o.r || 3.2) * s, k = ellOf(o, L, F.y, .2, .42), R = rng(seedOf(o, 10));
  const la = L.at(F.x, F.y - r * n), sid = nid('sp', u), W = n * 2 * r;
  let out = seat(u, L, o, F.x, F.y + r * k * (n - 1) * .2, W * 1.08, { ry: Math.max(1, r * k * n * .8) });
  out += `<defs><radialGradient id="${sid}"><stop offset="0" stop-color="${scale(L.shadowTint, .55)}" stop-opacity=".75"/><stop offset=".6" stop-color="${scale(L.shadowTint, .55)}" stop-opacity=".42"/><stop offset="1" stop-color="${scale(L.shadowTint, .55)}" stop-opacity="0"/></radialGradient></defs>`;
  const gar = o.garland !== false && n > 1, gc = [F.x, F.y - r * .5 - k * r * (n - 1)], gv = [W * .5 + r * .1, 0], gw = [0, (W * .5 + r * .1) * k + r * .05];
  if (gar) out += tube(u, L, 'rope', halfD(gc, gv, mul(gw, -1)), .62 * s, gc, { cap: 'butt' });
  const balls = [];
  for (let l = 0; l < n; l++) { const m = n - l; for (let j = m - 1; j >= 0; j--) for (let i = 0; i < m; i++)
    balls.push([F.x + (i - (m - 1) / 2) * 2 * r + (R() - .5) * r * .06, F.y - r - l * r * 1.42 - (j + l * .5) * 2 * r * k * .9, l, j]); }
  balls.sort((a, b) => a[2] - b[2] || b[3] - a[3]);
  for (const [bx, by, l] of balls) {
    out += `<circle cx="${f(bx - la.ux * r * .28)}" cy="${f(by - la.uy * r * .28 + r * .2)}" r="${f(r * 1.22)}" fill="url(#${sid})"/>` + shadeSphere(u, bx, by, r, L, 'iron', { outline: clamp(r * .08, .35, .6) });
    if (R() > .5) out += `<circle cx="${f(bx + (R() - .5) * r)}" cy="${f(by + r * (.1 + R() * .5))}" r="${f(r * (.1 + R() * .1))}" fill="#6a3a1c" opacity=".22"/>`;
    void l;
  }
  if (gar) { const pl = []; for (let i = 0; i <= 20; i++) { const t = Math.PI * i / 20; pl.push([gc[0] - gv[0] * Math.cos(t), gc[1] + gw[1] * Math.sin(t)]); }
    out += tube(u, L, 'rope', halfD(gc, gv, gw), .62 * s, add(gc, gw), { cap: 'butt' }) + layMarks(L, pl, .62 * s, R, add(gc, gw)); }
  return out;
}

// ——— rope, chain, anchor ———
/**
 * rope(u, L, pts, { r, seed, cap, whip }) — a laid rope of radius r (1) through the picture points pts (a smooth
 * curve): the round of the rope by the light and the lay — oblique strokes across it. whip: true — whipped ends.
 */
function rope(u, L, pts, o = {}) {
  const r = o.r || 1, R = rng(seedOf(o, 31)), pl = dense(pts, 8), mid = pl[pl.length >> 1], d = smooth(pts);
  let out = tube(u, L, 'rope', d, r, mid, { cap: o.cap || 'butt' }) + layMarks(L, pl, r, R, mid);
  if (o.whip) for (const [p, q] of [[pts[0], pl[1]], [pts[pts.length - 1], pl[pl.length - 2]]]) { const t = unit(sub(q, p)), a = add(p, mul(t, r * .5)), b = add(p, mul(t, r * 1.3)); out += `<path d="M${P2(a)}L${P2(b)}" stroke="${L.ramp('leather', p[0], p[1]).core}" stroke-width="${f(r * 2.05)}"/>`; }
  return out;
}
/**
 * coil(u, L, { x, y, s, r, turns, rr, tail, ell, seed }) — a coil of rope lying on the deck, seen in perspective:
 * `turns` (4) loops of radius r (11) laid one on another, each a little off the last; rr — the rope's radius
 * (1.25); the far halves are drawn first, then the dark well, then the near halves; a loose end runs out (tail:
 * false to drop it, flip — to the left).
 */
function coil(u, L, o = {}) {
  const F = frame(o), s = F.s, r = (o.r || 11) * s, n = Math.max(1, Math.round(o.turns || 4)), rr = (o.rr || 1.25) * s, k = ellOf(o, L, F.y, .2, .5), R = rng(seedOf(o, 12));
  const loops = []; for (let i = 0; i < n; i++) { const ri = r * (1 - .045 * i) * (.97 + R() * .06); loops.push({ c: [F.x + (R() - .5) * r * .1, F.y - rr * .9 - i * rr * 1.5 * (1 - k * .35) + (R() - .5) * rr * .2], v: [ri, 0], w: [(R() - .5) * ri * .05, ri * k] }); }
  const half = (lp, sg, i) => { const w = mul(lp.w, sg), pl = []; for (let j = 0; j <= 24; j++) { const t = Math.PI * j / 24; pl.push(add(lp.c, add(mul(lp.v, -Math.cos(t)), mul(w, Math.sin(t))))); }
    const at = add(lp.c, w); return tube(u, L, 'rope', halfD(lp.c, lp.v, w), rr, at, { cap: 'butt' }) + layMarks(L, pl, rr, rng(seedOf(o, 12) + i * 7 + (sg > 0 ? 3 : 0)), at); };
  let out = seat(u, L, o, F.x, F.y + r * k * .1, r * 2.25, { ry: Math.max(1, r * k * 1.05) });
  loops.forEach((lp, i) => { out += half(lp, -1, i); });
  const top = loops[n - 1], wid = nid('cw', u);
  out += `<defs>${radGrad(wid, top.c[0], top.c[1] + rr * n * .5, r, [[0, scale(L.shadowTint, .5), .9], [.7, scale(L.shadowTint, .6), .7], [1, scale(L.shadowTint, .6), .3]])}</defs><path d="${ellD(add(top.c, [0, rr * .4]), mul(top.v, .92), mul(top.w, .92))}" fill="url(#${wid})"/>`;
  if (o.tail !== false) { const a = add(loops[0].c, [loops[0].v[0] * F.fl * .97, rr * .2]), e = F.fl; out += rope(u, L, [a, add(a, [e * r * .22, r * k * .34]), add(a, [e * r * .55, r * k * .2]), add(a, [e * r * .82, r * k * .5])], { r: rr, seed: seedOf(o, 12) + 2, whip: true }); }
  loops.forEach((lp, i) => { out += half(lp, 1, i); });
  return out;
}
/**
 * chain(u, L, pts, { link, seed }) — an iron chain along the picture points pts: links `link` long (4.4), every
 * other one seen flat (an oval ring) and edge-on (a bar), each a little turned and of its own size.
 */
function chain(u, L, pts, o = {}) {
  const link = o.link || 4.4, wr = link * .13, R = rng(seedOf(o, 13)), W = walk(dense(pts, 8), link * .64);
  let flat = '', edge = '';
  W.forEach((q, i) => { const an = (R() - .5) * .24, c = Math.cos(an), sn = Math.sin(an), t = [q.t[0] * c - q.t[1] * sn, q.t[0] * sn + q.t[1] * c], nn = [-t[1], t[0]], sz = .94 + R() * .12, hl = (link / 2 - wr) * sz;
    if (i % 2) edge += tube(u, L, 'iron', `M${P2(add(q.p, mul(t, -hl)))}L${P2(add(q.p, mul(t, hl)))}`, wr * 1.1, q.p);
    else { const hw = link * .27 * sz, e = hl - hw, a = add(q.p, mul(t, e)), b = add(q.p, mul(t, -e));
      flat += tube(u, L, 'iron', `M${P2(add(b, mul(nn, hw)))}L${P2(add(a, mul(nn, hw)))}${arc(a, mul(nn, hw), mul(t, hw))}${arc(a, mul(t, hw), mul(nn, -hw))}L${P2(add(b, mul(nn, -hw)))}${arc(b, mul(nn, -hw), mul(t, -hw))}${arc(b, mul(t, -hw), mul(nn, hw))}Z`, wr, q.p); } });
  return edge + flat;
}
/**
 * anchor(u, L, { x, y, s, h, seed, flip, rot }) — an anchor with a wooden stock, h (40) units from the crown to the
 * ring; (x, y) — the crown, the shank runs up (turn it with rot to lay or lean it). Iron shank and arms with
 * flukes (palms), an oak stock in two halves with iron hoops, set across the arms (it is seen end-on, shortened),
 * the ring in the eye.
 */
function anchor(u, L, o = {}) {
  const F = frame(o), q = (o.h || 40) / 40, s = F.s * q, p = (x, y) => F.p(x * q, y * q);
  const sc = p(0, -34.3), sa = p(10.4, -38.3), sb = p(-10.4, -30.3);
  const stockHalf = (e, near) => shadeCyl(u, sc[0], sc[1], e[0], e[1], 1.95 * s, L, 'oak', { r1: 2.1 * s, r2: 1.3 * s, ell: near ? .4 : 0, face: near ? 2 : 0, seed: seedOf(o, 14) + (near ? 1 : 0) });
  const hoop = t => { const a = mixP(sc, t > 0 ? sb : sa, Math.abs(t) - .05), b = mixP(sc, t > 0 ? sb : sa, Math.abs(t) + .05); return shadeCyl(u, a[0], a[1], b[0], b[1], lerp(2.05, 1.35, Math.abs(t)) * s, L, 'iron', { outline: .3 }); };
  let out = seat(u, L, o, F.x, F.y, 6 * s, { opacity: .5 }) + stockHalf(sa, false) + hoop(-.45);
  const rc = p(0, -39.9); out += tube(u, L, 'iron', ellD(rc, F.v(2.7 * q, 0), F.v(0, 3 * q)), .55 * s, rc);
  const a0 = p(0, -1), a1 = p(0, -37.6); out += shadeCyl(u, a0[0], a0[1], a1[0], a1[1], 1.5 * s, L, 'iron', { r1: 1.55 * s, r2: 1.05 * s, outline: .45 }) + shadeSphere(u, ...a1, 1.25 * s, L, 'iron', { outline: .4 });
  for (const e of [-1, 1]) { const arm = `M${P2(p(0, -.4))}C${P2(p(e * 5.5, 1.4))} ${P2(p(e * 11.8, -2.2))} ${P2(p(e * 14.2, -10))}`, am = p(e * 10, -2);
    out += tube(u, L, 'iron', arm, 1.4 * s, am, { cap: 'round' });
    const fl = [[e * 14.7, -13.2], [e * 9.4, -9.6], [e * 11.2, -5.6], [e * 15.2, -6.2]];
    out += shadeBox(u, [F.face(fl.map(v => [v[0] * q, v[1] * q]), [-e * .35, .45, .82])], L, 'iron', { outline: .45 }) + `<path d="M${P2(p(e * 14.4, -12.4))}L${P2(p(e * 12.2, -6.4))}" stroke="${L.ramp('iron', ...am).lit}" stroke-width="${f(.35 * s)}" opacity=".5"/>`; }
  out += shadeSphere(u, ...p(0, -.3), 1.75 * s, L, 'iron', { outline: .4 });
  return out + stockHalf(sb, true) + hoop(.45) + hoop(.12);
}

// ——— light: lantern, candle ———
/**
 * lantern(u, L, { x, y, s, lit, hang, glow, ell, seed, rot }) — a ship's lantern, 22 units high (28 with the bail):
 * a brass foot, a glass cylinder between three brass rods with two guard wires, a candle and its flame inside, a
 * collar, a conical cap with a vented chimney, a wire bail and a ring. (x, y) — the middle of its foot. lit: false —
 * dark glass (the far rod shows through). hang: units of rope drawn up from the ring to a hook (no contact shadow).
 * lantern.local(opts) -> { x, y, h, color, power, radius, gy } — the entry for light.locals (or a point key).
 */
function lantern(u, L, o = {}) {
  const F = frame(o), s = F.s, k = ellOf(o, L, F.y, .16, .36), lit = o.lit !== false, R = rng(seedOf(o, 15));
  const cyl = (y0, y1, r0, r1, kind, extra) => shadeCyl(u, ...F.p(0, y0), ...F.p(0, y1), Math.max(r0, r1) * s, L, kind, Object.assign({ r1: r0 * s, r2: r1 * s, ell: k, face: 2, outline: .4 }, extra));
  const G = vessel(F.p(0, -1.6), F.p(0, -13.8), 4.2 * s, 4.2 * s, 0, k), gc = G.C(.5), rpB = L.ramp('brass', gc[0], gc[1]), rpG = L.ramp('glass', gc[0], gc[1]), la = L.at(gc[0], gc[1]);
  const [c0, v0, w0] = G.band(0, 1), [c1, v1, w1] = G.band(1, 1), body = `${halfD(c0, v0, w0)}${halfR(c1, v1, w1)}Z`;
  let out = o.hang ? '' : seat(u, L, o, F.x, F.y + k * 2 * s, 11 * s);
  if (o.hang) { const a = F.p(0, -29), b = F.p(0, -29 - o.hang); out += rope(u, L, [b, a], { r: .45 * s, seed: seedOf(o, 15) }) + tube(u, L, 'iron', F.d('M0 -29.6 C1.6 -29.6 1.6 -27.4 0 -27.4'), .32 * s, a); }
  out += cyl(0, -1.6, 5.2, 5);
  const back = sg => add(add(G.C(0), mul(G.n, sg * 4.2 * s)), mul(G.a, k * 4.2 * s * Math.sqrt(1 - sg * sg)));
  { const b0 = back(.17), b1 = add(b0, sub(G.E, G.S)); out += `<path d="M${P2(b0)}L${P2(b1)}" stroke="${L.tone('brass', lit ? .2 : -.6, gc[0], gc[1])}" stroke-width="${f(.8 * s)}"/>`; }
  if (!lit) out += `<path d="${body}" fill="${L.tone('glass', -.5, gc[0], gc[1])}" opacity=".3"/>`;
  out += shadeCyl(u, ...F.p(0, -1.4), ...F.p(0, -5.2), 1.15 * s, L, 'bone', { ell: k, face: 2, outline: .3 }) + `<path d="M${P2(F.p(0, -5.1))}L${P2(F.p(.1, -6.1))}" stroke="#2a1c12" stroke-width="${f(.35 * s)}" stroke-linecap="round"/>`;
  const fp = F.p(.1, -6);
  if (lit) { const gid = nid('lt', u); out += flame(u, fp, 4.4 * s, R, { glow: o.glow, halo: 3 })
    + `<defs>${radGrad(gid, fp[0], fp[1] - 2 * s, 8.5 * s, [[0, '#fffbe2', .5], [.4, '#ffdc80', .62], [1, '#f2a03a', .78]])}</defs><path d="${body}" fill="url(#${gid})"/>`; }
  else { const g = mat('glass', L, { form: 'cyl', x1: G.S[0], y1: G.S[1], x2: G.E[0], y2: G.E[1], r: 4.2 * s, u }); out += `<defs>${g.defs}</defs><path d="${body}" fill="${g.fill}" opacity=".42"/>`; }
  const sgL = (la.dx * G.n[0] + la.dy * G.n[1]) >= 0 ? 1 : -1;
  out += `<path d="M${P2(G.front(.12, sgL * .5))}L${P2(G.front(.86, sgL * .5))}" stroke="#ffffff" stroke-width="${f(.55 * s)}" stroke-linecap="round" opacity="${lit ? .45 : .7}"/><path d="M${P2(G.front(.3, -sgL * .72))}L${P2(G.front(.7, -sgL * .72))}" stroke="#ffffff" stroke-width="${f(.3 * s)}" stroke-linecap="round" opacity=".28"/>`
    + `<path d="${body}" fill="none" stroke="${lit ? mix(rpB.outline, '#8a4a12', .5) : rpG.outline}" stroke-width=".35"/>`;
  for (const t of [.34, .68]) { const [c, v, w] = G.band(t, 1.03); out += `<path d="${halfD(c, v, w)}" stroke="${rpB.outline}" stroke-width="${f(.7 * s)}" fill="none"/><path d="${halfD(c, v, w)}" stroke="${lit ? rpB.core : rpB.half}" stroke-width="${f(.4 * s)}" fill="none"/>`; }
  for (const sg of [-.94, .77]) { const p0 = G.front(0, sg, 1.04), p1 = G.front(1, sg, 1.04); out += shadeCyl(u, p0[0], p0[1], p1[0], p1[1], .45 * s, L, 'brass', { outline: .3 }); }
  out += cyl(-13.6, -14.8, 4.8, 4.8) + cyl(-14.6, -19.4, 5.7, 1.9) + cyl(-19.2, -21.2, 1.9, 1.9);
  for (const sg of [-.5, .1, .62]) out += `<path d="M${P2(F.p(sg * 1.9, -19.7))}L${P2(F.p(sg * 1.9, -20.7))}" stroke="${rpB.outline}" stroke-width="${f(.4 * s)}" stroke-linecap="round" opacity=".8"/>`;
  out += cyl(-21, -21.8, 2.5, 2.2);
  const bail = F.d('M-4.7 -15 C-6.6 -24 -2.6 -26.6 0 -26.6 C2.6 -26.6 6.6 -24 4.7 -15'), rc = F.p(0, -27.7);
  return out + tube(u, L, 'brass', bail, .36 * s, F.p(0, -26.6)) + tube(u, L, 'brass', ellD(rc, F.v(1.2, 0), F.v(0, 1.25)), .32 * s, rc);
}
lantern.local = (o = {}) => { const F = frame(o), p = F.p(.1, -7.5); return Object.assign({ x: p[0], y: p[1], h: o.h != null ? o.h : o.horizon != null && !o.hang ? Math.max(.05, 1.7 * 7.5 * F.s / Math.max(4, F.y - o.horizon)) : .45, color: o.color || '#ffc070', power: o.power != null ? o.power : .85, radius: o.radius || 70 }, o.hang ? {} : { gy: F.y }); };

/**
 * candle(u, L, { x, y, s, lit, len, glow, ell, seed, flip }) — a tallow candle in a brass chamber stick: a dished
 * saucer with a ring handle (to the right; flip — to the left), a socket, the candle `len` (10) units long with
 * runs of wax, a wick and a flame; the wax glows under the flame. About 16 units high. candle.local(opts) — its
 * entry for light.locals.
 */
function candle(u, L, o = {}) {
  const F = frame(o), s = F.s, k = ellOf(o, L, F.y, .18, .4), lit = o.lit !== false, len = o.len || 10, R = rng(seedOf(o, 16)), top = -3.4 - len;
  const cyl = (y0, y1, r0, r1, kind, extra) => shadeCyl(u, ...F.p(0, y0), ...F.p(0, y1), Math.max(r0, r1) * s, L, kind, Object.assign({ r1: r0 * s, r2: r1 * s, ell: k, face: 2, outline: .38 }, extra));
  let out = seat(u, L, o, F.x, F.y + k * 1.5 * s, 11 * s);
  const hc = F.p(6.9, -1.1); out += tube(u, L, 'brass', ellD(hc, F.v(1.7, 0), F.v(0, 1.2)), .42 * s, hc);
  out += cyl(0, -1.1, 4.2, 6.2);
  { const c = F.p(0, -1.1), rp = L.ramp('brass', c[0], c[1]); out += `<path d="${ellD(c, F.v(5.2, 0), F.v(0, 5.2 * k))}" fill="${rp.shadow}" opacity=".45"/><path d="${ellD(F.p(0, -.9), F.v(3.4, 0), F.v(0, 3.4 * k))}" fill="${rp.half}" opacity=".7"/>`; }
  out += cyl(-.9, -3.7, 2.1, 1.9) + cyl(-3.4, top, 1.5, 1.45, 'bone', { outline: .35 });
  const rpW = L.ramp('bone', ...F.p(0, top / 2));
  for (let i = 0; i < 3; i++) { const sg = R() * 1.6 - .8, l = 1.5 + R() * 4.5, x = sg * 1.45, y0 = top + k * 1.45 * Math.sqrt(1 - sg * sg);
    out += `<path d="M${P2(F.p(x, y0 - .2))}L${P2(F.p(x + (R() - .5) * .3, y0 + l))}" stroke="${rpW.outline}" stroke-width="${f(1.05 * s)}" stroke-linecap="round" opacity=".5"/><path d="M${P2(F.p(x, y0 - .2))}L${P2(F.p(x + (R() - .5) * .3, y0 + l))}" stroke="${rpW.lit}" stroke-width="${f(.72 * s)}" stroke-linecap="round"/>`; }
  const tc = F.p(0, top); out += `<path d="${ellD(tc, F.v(.9, 0), F.v(0, .9 * k))}" fill="${rpW.shadow}" opacity=".6"/><path d="M${P2(tc)}L${P2(F.p(.15, top - 1.3))}" stroke="#2a1c12" stroke-width="${f(.36 * s)}" stroke-linecap="round"/>`;
  if (lit) { const gid = nid('cg', u), a = F.p(0, top), b = F.p(0, top + 4.2); out += `<defs>${linGrad(gid, a[0], a[1], b[0], b[1], [[0, '#ffd58a', .75], [1, '#ffd58a', 0]])}</defs><path d="${poly([F.p(-1.45, top - .2), F.p(1.45, top - .2), F.p(1.45, top + 4.2), F.p(-1.45, top + 4.2)])}" fill="url(#${gid})" style="mix-blend-mode:screen"/>` + flame(u, F.p(.15, top - 1.1), 4.8 * s, R, { glow: o.glow, halo: 2.6 }); }
  return out;
}
candle.local = (o = {}) => { const F = frame(o), p = F.p(.15, -3.4 - (o.len || 10) - 3); return { x: p[0], y: p[1], h: o.h != null ? o.h : .3, color: o.color || '#ffb860', power: o.power != null ? o.power : .7, radius: o.radius || 46, gy: F.y }; };

// ——— glass and small things ———
/**
 * bottle(u, L, { x, y, s, kind: 'rum' | 'empty', lying, ell, seed, flip, rot }) — a hand-blown bottle of dark green
 * glass, 20 units high and 9 wide: a mallet body, a sloping shoulder, a neck with a string rim, a cork. Glass: the
 * background shows through, a dark edge, a narrow highlight and a point glint on the light's side; rum — dark
 * liquid up to the shoulder. lying: on its side (the neck to the right; flip — to the left).
 */
function bottle(u, L, o = {}) {
  const F = frame(o), s = F.s, kind = o.kind || 'rum', lying = !!o.lying, k = o.ell != null ? o.ell : lying ? .2 : ellOf(o, L, F.y, .16, .36), H = 20;
  const A = lying ? F.p(-H / 2, -4.5) : F.p(0, 0), B = lying ? F.p(H / 2, -4.5) : F.p(0, -H);
  const prof = [[0, 3.9], [.03, 4.4], [.3, 4.5], [.43, 4.35], [.53, 3.3], [.61, 1.95], [.69, 1.42], [.9, 1.25], [.915, 1.65], [.95, 1.65], [.962, 1.3], [1, 1.3]].map(q => [q[0], q[1] * s]);
  const g = lathe(u, L, 'glass', A, B, prof, { ell: k, opacity: kind === 'empty' ? .5 : .66, spec: [.07, .42] }), { a, n, la, rp } = g, C = t => mixP(A, B, t), R5 = 5.2 * s;
  let out = lying ? seat(u, L, o, F.x, F.y, 12 * s, { ry: 1 * s }) : seat(u, L, o, A[0], A[1] + k * 2 * s, 9.5 * s);
  if (kind !== 'empty') { const dn = n[1] >= 0 ? 1 : -1, col = mix(L.tone('leather', -.2, A[0], A[1]), '#2c0d04', .55), tl = .47;
    const reg = lying ? [add(C(-.02), mul(n, dn * R5 * .1)), add(C(.6), mul(n, dn * R5 * .1)), add(C(.6), mul(n, dn * R5)), add(C(-.02), mul(n, dn * R5))] : [add(C(-.1), mul(n, -R5)), add(C(-.1), mul(n, R5)), add(C(tl), mul(n, R5)), add(C(tl), mul(n, -R5))];
    out += `<g clip-path="url(#${g.clip})"><path d="${poly(reg)}" fill="${col}" opacity=".88"/>` + (lying ? '' : `<path d="${ellD(C(tl), mul(n, 4.3 * s), mul(a, 4.3 * s * k))}" fill="${mix(col, L.tone('leather', .8, A[0], A[1]), .45)}" opacity=".8"/>`) + '</g>'; }
  out += g.svg;
  out += `<g clip-path="url(#${g.clip})"><path d="${g.d}" fill="none" stroke="${L.tone('glass', -.95, A[0], A[1])}" stroke-width="${f(1.7 * s)}" opacity=".5"/><path d="${halfD(C(.035), mul(n, 4.1 * s), mul(a, -4.1 * s * k))}" stroke="${L.tone('glass', -.9, A[0], A[1])}" stroke-width="${f(.8 * s)}" fill="none" opacity=".5"/></g>`;
  const sg = (la.dx * n[0] + la.dy * n[1]) >= 0 ? 1 : -1, gp = add(C(.44), mul(n, sg * 2.4 * s)), g2 = add(C(.2), mul(n, -sg * 3.3 * s)), g3 = add(C(.36), mul(n, -sg * 3.3 * s));
  out += `<ellipse cx="${f(gp[0])}" cy="${f(gp[1])}" rx="${f(1.1 * s)}" ry="${f(.6 * s)}" transform="rotate(${f(deg(Math.atan2(a[1], a[0])) + 25 * sg)} ${f(gp[0])} ${f(gp[1])})" fill="#ffffff" opacity="${f(.5 + .4 * clamp(L.key.power * la.k))}"/><path d="M${P2(g2)}L${P2(g3)}" stroke="${rp.lit}" stroke-width="${f(.45 * s)}" stroke-linecap="round" opacity=".4"/>`;
  const c0 = add(B, mul(a, -.4 * s)), c1 = add(B, mul(a, 1.5 * s));
  return out + shadeCyl(u, c0[0], c0[1], c1[0], c1[1], 1.05 * s, L, 'pine-deck', { ell: k, face: 2, outline: .32, grain: false });
}
/**
 * mug(u, L, { x, y, s, fill, ell, seed, flip }) — a coopered tankard, 11 units high and 9 wide: oak staves, two
 * brass hoops, a handle (to the right; flip — to the left), the open mouth with drink in it (fill: 'rum' | 'water'
 * | 'dark' — empty).
 */
function mug(u, L, o = {}) {
  const F = frame(o), s = F.s, k = ellOf(o, L, F.y, .18, .4), R = rng(seedOf(o, 18)), H = 11, S = F.p(0, 0), E = F.p(0, -H), G = vessel(S, E, 4.6 * s, 4.15 * s, .03, k);
  const hd = F.d('M3.8 -9.3 C10.2 -10.4 10 -1.6 4.2 -2.4'), hm = F.p(8.6, -5.8);
  let out = seat(u, L, o, S[0], S[1] + k * 2 * s, 10 * s) + tube(u, L, 'oak', hd, .85 * s, hm, { cap: 'butt' })
    + shadeCyl(u, S[0], S[1], E[0], E[1], 4.6 * s, L, 'oak', { r1: 4.6 * s, r2: 4.15 * s, ell: k, face: 2, bulge: .03, seed: seedOf(o, 18) });
  out += staves(L, G, 'oak', R, s, { step: 19 }).svg + hoops(u, L, G, 'brass', [[.15, .1], [.84, .1]], R, s, { rivets: false });
  return out + mouth(u, L, E, mul(G.n, 4.15 * s), mul(G.a, k * 4.15 * s), mul(G.a, -1), 'oak', { inner: .85, depth: 1.7 * s, fill: o.fill || 'rum' });
}

/**
 * chest(u, L, { x, y, s, open, gold, kind, seed, flip }) — a sea chest, 30 wide, 17 high (closed) and 10 deep, seen
 * from the front and a little from the right (flip — from the left): oak boards, a vaulted lid, two iron straps
 * with rivets over lid and front, corner irons, a brass lock plate with a hasp, a drop handle on the end. open:
 * true | 0..1 — the lid thrown back on its hinges; inside — a heap of coins (gold: false — empty).
 */
function chest(u, L, o = {}) {
  const F = frame(o), s = F.s, R = rng(seedOf(o, 19)), W = 15, Hb = 13, ox = 8, oy = 5.5, lidH = 3.6, ov = .5, rho = 3.4, wood = o.kind || 'oak', open = o.open === true ? 1 : +o.open || 0, sd = seedOf(o, 19);
  const P = (x, y) => F.p(x, y), fc = (pts, nn, extra) => F.face(pts, nn, extra), gx = F.v(1, 0), gz = F.v(ox, -oy);
  const mid = P(0, -Hb / 2), rp = L.ramp(wood, mid[0], mid[1]), la = L.at(mid[0], mid[1]);
  const strapX = [-9.4, 9.4], sw = 1.25;
  let out = seat(u, L, o, ...P(ox / 2, -oy / 2 + 1.2), (2 * W + ox) * s, { ry: (oy / 2 + 1.6) * s });
  const body = () => { let b = shadeBox(u, [fc([[W, -Hb], [W + ox, -Hb - oy], [W + ox, -oy], [W, 0]], 'right', { grain: gz }), fc([[-W, -Hb], [W, -Hb], [W, 0], [-W, 0]], 'front', { grain: gx })], L, wood, { seed: sd });
    for (const yy of [-4.3 + (R() - .5) * .6, -8.7 + (R() - .5) * .6]) b += `<path d="M${P2(P(-W, yy))}L${P2(P(W, yy))}L${P2(P(W + ox, yy - oy))}" stroke="${rp.outline}" stroke-width=".4" fill="none" opacity=".6"/><path d="M${P2(P(-W, yy + .4))}L${P2(P(W, yy + .4))}" stroke="${rp.lit}" stroke-width=".3" opacity=".3"/>`;
    return b; };
  const front = () => { let b = '';
    for (const x of strapX) { b += shadeBox(u, [fc([[x - sw, -Hb + (open ? 0 : -lidH)], [x + sw, -Hb + (open ? 0 : -lidH)], [x + sw, 0], [x - sw, 0]], 'front')], L, 'iron', { outline: .4 }); for (const yy of [-2, -6.6, -11.2].concat(open ? [] : [-Hb - lidH / 2])) b += rivet(L, P(x, yy), .55 * s); }
    for (const e of [-1, 1]) b += shadeBox(u, [fc([[e * W, 0], [e * (W - 3.4), 0], [e * W, -3.4]], 'front')], L, 'iron', { outline: .4 }) + rivet(L, P(e * (W - 1), -1), .42 * s);
    const lk = mat('brass', L, { form: 'plane', x1: P(-2.6, 0)[0], y1: P(0, -Hb)[1], x2: P(2.6, 0)[0], y2: P(0, -Hb + 6.2)[1], n: F.n('front'), u });
    b += `<defs>${lk.defs}</defs><path d="${F.d(`M-2.7 ${-Hb + .3} L2.7 ${-Hb + .3} L2.7 ${-Hb + 3.8} Q2.6 ${-Hb + 6.3} 0 ${-Hb + 6.6} Q-2.6 ${-Hb + 6.3} -2.7 ${-Hb + 3.8} Z`)}" fill="${lk.fill}" stroke="${lk.ramp.outline}" stroke-width=".45"/>`
      + `<path d="${F.d(`M-2.1 ${-Hb + .9} L2.1 ${-Hb + .9}`)}" stroke="${lk.ramp.spec}" stroke-width=".35" opacity=".7"/><circle cx="${f(P(0, -Hb + 3.2)[0])}" cy="${f(P(0, -Hb + 3.2)[1])}" r="${f(.7 * s)}" fill="${lk.ramp.outline}"/><path d="${F.d(`M-.35 ${-Hb + 3.4} L.35 ${-Hb + 3.4} L.6 ${-Hb + 5.2} L-.6 ${-Hb + 5.2} Z`)}" fill="${lk.ramp.outline}"/>`;
    if (!open) b += shadeBox(u, [fc([[-1.05, -Hb - lidH + .8], [1.05, -Hb - lidH + .8], [1.05, -Hb + 1.5], [-1.05, -Hb + 1.5]], 'front')], L, 'iron', { outline: .35 }) + rivet(L, P(0, -Hb - lidH + 1.6), .45 * s);
    // a drop handle on the end
    const hc = [W + ox / 2, -Hb / 2 - oy / 2 - 1], du = unit([ox, -oy]), e1 = P(hc[0] - du[0] * 2.3, hc[1] - du[1] * 2.3), e2 = P(hc[0] + du[0] * 2.3, hc[1] + du[1] * 2.3), em = P(hc[0], hc[1] + 3.6);
    return b + rivet(L, e1, .55 * s) + rivet(L, e2, .55 * s) + tube(u, L, 'iron', `M${P2(e1)}Q${P2(em)} ${P2(e2)}`, .42 * s, em); };
  if (!open) {
    const V = (x, th) => { const t = rad(th), d = (1 - Math.cos(t)) / 2; return [x + ox * d, -Hb - lidH - oy * d - rho * Math.sin(t)]; }, TH = [0, 32, 64, 96, 129];
    out += body();
    const side = [[W + ov, -Hb]]; for (let th = 0; th <= 180; th += 20) side.push(V(W + ov, th)); side.push([W + ov + ox, -Hb - oy]);
    const faces = [fc(side, 'right', { grain: gz })];
    for (let i = TH.length - 2; i >= 0; i--) { const tm = rad((TH[i] + TH[i + 1]) / 2); faces.push(fc([V(-W - ov, TH[i]), V(W + ov, TH[i]), V(W + ov, TH[i + 1]), V(-W - ov, TH[i + 1])], [0, Math.sin(tm), Math.cos(tm)], { grain: gx })); }
    faces.push(fc([[-W - ov, -Hb - lidH], [W + ov, -Hb - lidH], [W + ov, -Hb], [-W - ov, -Hb]], 'front', { grain: gx }));
    out += shadeBox(u, faces, L, wood, { seed: sd + 3, outline: .45 });
    for (const x of strapX) { const sf = []; for (let i = TH.length - 2; i >= 0; i--) { const tm = rad((TH[i] + TH[i + 1]) / 2); sf.push(fc([V(x - sw, TH[i]), V(x + sw, TH[i]), V(x + sw, TH[i + 1]), V(x - sw, TH[i + 1])], [0, Math.sin(tm), Math.cos(tm)])); }
      out += shadeBox(u, sf, L, 'iron', { outline: .3 }) + rivet(L, P(...V(x, 30)), .5 * s) + rivet(L, P(...V(x, 95)), .5 * s); }
    out += `<path d="M${P2(P(-W - ov, -Hb))}L${P2(P(W + ov, -Hb))}L${P2(P(W + ov + ox, -Hb - oy))}" stroke="${L.shadowTint}" stroke-width="${f(.9 * s)}" fill="none" opacity=".45"/>`;
    return out + front();
  }
  // open: the lid stands behind on its hinges and shows its inner side
  const an = rad(open * 105), Dup = 12, off = [Math.cos(an) * -ox, Math.cos(an) * oy - Math.sin(an) * Dup], H1 = [-W + ox, -Hb - oy], H2 = [W + ox, -Hb - oy], F1 = add(H1, off), F2 = add(H2, off);
  const bv = [-Math.sin(an) * lidH * .58, Math.sin(an) * lidH * .4 - Math.cos(an) * lidH], ni = [0, -Math.cos(an), Math.sin(an)], nb = [0, Math.sin(an), Math.cos(an)];
  const inset = (t, e) => { const a = mixP(H1, F1, e), b = mixP(H2, F2, e); return mixP(a, b, t); };
  out += shadeBox(u, [fc([H1, H2, F2, F1], ni, { grain: gx }), fc([inset(.05, .1), inset(.95, .1), inset(.95, .88), inset(.05, .88)], ni, { kind: 'leather', grain: false })], L, wood, { seed: sd + 5 });
  out += shadeBox(u, [fc([F1, F2, add(F2, bv), add(F1, bv)], nb, { grain: gx })], L, wood, { seed: sd + 6 });
  for (const x of strapX) out += shadeBox(u, [fc([add(mixP(F1, F2, (x - sw + W) / (2 * W)), [0, 0]), mixP(F1, F2, (x + sw + W) / (2 * W)), add(mixP(F1, F2, (x + sw + W) / (2 * W)), bv), add(mixP(F1, F2, (x - sw + W) / (2 * W)), bv)], nb)], L, 'iron', { outline: .3 });
  out += body();
  const cid = nid('ch', u), wid = nid('ci', u), op = [[-W, -Hb], [W, -Hb], [W + ox, -Hb - oy], [-W + ox, -Hb - oy]], a0 = P(0, -Hb), a1 = P(ox, -Hb - oy);
  out += `<defs><clipPath id="${cid}"><path d="${poly([P(-W + .4, -Hb), P(W - .2, -Hb), P(W + ox - .4, -Hb - oy), P(W + ox - .4, -Hb - oy - 14), P(-W + .4, -Hb - oy - 14)])}"/></clipPath>${linGrad(wid, a0[0], a0[1], a1[0], a1[1], [[0, L.tone(wood, -1, mid[0], mid[1])], [.6, L.tone(wood, -.55, mid[0], mid[1])], [1, L.tone(wood, -.05, mid[0], mid[1])]])}</defs><path d="${poly(op.map(q => P(q[0], q[1])))}" fill="url(#${wid})" stroke="${rp.outline}" stroke-width=".5" stroke-linejoin="round"/>`;
  if (o.gold !== false) { const mc = P(ox / 2, -Hb - oy / 2 + .4), mr = (W - .5) * s, g = mat('brass', L, { form: 'sphere', x1: mc[0], y1: mc[1] - 1 * s, r: mr * .9, u }), rb = g.ramp; let coins = '';
    for (let i = 0; i < 34; i++) { const q = R() * 6.283, d = Math.sqrt(R()), cx = ox / 2 + Math.cos(q) * d * (W - 2.2), cy = -Hb - oy / 2 - .2 + Math.sin(q) * d * (oy / 2 + 1.4) - (1 - d) * 2.2, c = P(cx, cy), I = clamp(.1 + R() * .9 - d * .3);
      coins += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(1.5 * s)}" ry="${f((.5 + R() * .5) * s)}" transform="rotate(${f((R() - .5) * 50)} ${f(c[0])} ${f(c[1])})" fill="${L.tone('brass', I, c[0], c[1])}" stroke="${rb.outline}" stroke-width=".25"/>`;
      if (i % 5 === 0) coins += `<circle cx="${f(c[0] + la.ux * .5 * s)}" cy="${f(c[1] + la.uy * .2 * s)}" r="${f(.42 * s)}" fill="#fffbe6" opacity=".9"/><circle cx="${f(c[0] + la.ux * .5 * s)}" cy="${f(c[1] + la.uy * .2 * s)}" r="${f(1.2 * s)}" fill="#ffd27a" opacity=".3"/>`; }
    out += `<defs>${g.defs}</defs><g clip-path="url(#${cid})"><path d="${ellD(mc, F.v(W - .5, 0), F.v(0, oy / 2 + 2.6))}" fill="${g.fill}"/>${coins}</g>`; }
  out += `<path d="M${P2(P(-W, -Hb))}L${P2(P(W, -Hb))}L${P2(P(W + ox, -Hb - oy))}" stroke="${mix(rp.lit, '#ffffff', .3)}" stroke-width=".4" fill="none" opacity=".5"/>`;
  return out + front();
}
/**
 * crate(u, L, { x, y, s, kind, seed, flip }) — a nailed crate, 22 wide, 16 high and 10 deep, seen from the front and a
 * little from the right (flip — from the left): boards of different width, corner cleats and a diagonal brace
 * standing proud of the boards (each drops a thin shadow away from the light), nail heads.
 */
function crate(u, L, o = {}) {
  const F = frame(o), s = F.s, R = rng(seedOf(o, 20)), W = 11, H = 16, ox = 8, oy = 5.5, wood = o.kind || 'pine-deck', sd = seedOf(o, 20), P = (x, y) => F.p(x, y), gx = F.v(1, 0), gz = F.v(ox, -oy);
  const mid = P(0, -H / 2), rp = L.ramp(wood, mid[0], mid[1]), la = L.at(mid[0], mid[1]);
  let out = seat(u, L, o, ...P(ox / 2, -oy / 2 + 1.2), (2 * W + ox) * s, { ry: (oy / 2 + 1.6) * s });
  out += shadeBox(u, [F.face([[-W, -H], [W, -H], [W + ox, -H - oy], [-W + ox, -H - oy]], 'top', { grain: gx }), F.face([[W, -H], [W + ox, -H - oy], [W + ox, -oy], [W, 0]], 'right', { grain: gz }), F.face([[-W, -H], [W, -H], [W, 0], [-W, 0]], 'front', { grain: gx })], L, wood, { seed: sd });
  let ln = ''; const ys = []; let yy = -3.2 - R() * 1.4; while (yy > -H + 2) { ys.push(yy); yy -= 3.3 + R() * 1.8; }
  for (const y of ys) ln += `M${P2(P(-W, y))}L${P2(P(W, y))}L${P2(P(W + ox, y - oy))}`;
  for (const t of [.3 + R() * .1, .64 + R() * .1]) ln += `M${P2(P(-W + ox * t, -H - oy * t))}L${P2(P(W + ox * t, -H - oy * t))}`;
  out += `<path d="${ln}" stroke="${rp.outline}" stroke-width=".42" fill="none" opacity=".65"/>`;
  const sh = [-la.ux * .7 * s, -la.uy * .7 * s + .25 * s];
  const cidC = nid('cr', u); out += `<defs><clipPath id="${cidC}"><path d="${poly([P(-W, 0), P(W, 0), P(W + ox, -oy), P(W + ox, -H - oy), P(-W + ox, -H - oy), P(-W, -H)])}"/></clipPath></defs>`;
  const batten = (pts, nn, grain) => { const q = pts.map(v => P(v[0], v[1])); return `<path d="${poly(q.map(v => add(v, sh)))}" fill="${L.shadowTint}" opacity=".4" clip-path="url(#${cidC})"/>` + shadeBox(u, [{ pts: q, n: F.n(nn), grain }], L, wood, { seed: sd + Math.round(pts[0][0] * 3 + pts[0][1]), outline: .45 }); };
  out += batten([[-7.6, -.5], [-7.6, -3.7], [7.6, -H + .5], [7.6, -H + 3.7]], 'front', F.v(15.2, -(H - 4.2)));
  out += batten([[-W, -H], [-7.8, -H], [-7.8, 0], [-W, 0]], 'front', F.v(0, 1)) + batten([[7.8, -H], [W, -H], [W, 0], [7.8, 0]], 'front', F.v(0, 1));
  const dz = t => [W + ox * t, -oy * t];
  out += batten([[...add(dz(0), [0, -H])], [...add(dz(.3), [0, -H])], dz(.3), dz(0)], 'right', F.v(0, 1)) + batten([[...add(dz(.7), [0, -H])], [...add(dz(1), [0, -H])], dz(1), dz(.7)], 'right', F.v(0, 1));
  for (const x of [-9.4, 9.4]) for (const y of ys.concat([-H + 1.4])) out += rivet(L, P(x + (R() - .5) * .5, y + 1.5), .36 * s);
  return out;
}
/**
 * sack(u, L, { x, y, s, seed, flip }) — a full sack, 20 wide and 21 high: a sagging belly with volume, corner ears
 * at the bottom, gathered folds running from the rope tie at the neck, the tuft above the tie, a stitched side seam.
 */
function sack(u, L, o = {}) {
  const F = frame(o), s = F.s, R = rng(seedOf(o, 21)), lean = (R() - .5) * .12, P = (x, y) => F.p(x - y * lean, y), j = () => (R() - .5) * .7;
  const pts = [[-8.2, .4], [-10, -2.4 + j()], [-9.7 + j(), -7], [-7.9, -11.4 + j()], [-4.3, -14.9], [-2.5, -16.5], [2.4, -16.5], [4.6, -14.6], [8.2 + j(), -11], [10, -6.4 + j()], [9.7, -2.2], [8, .4], [0, .9]].map(q => P(q[0], q[1]));
  const d = smooth(pts, true), c = P(0, -7.6), g = mat('canvas', L, { form: 'sphere', x1: c[0], y1: c[1], r: 11.6 * s, u }), rp = g.ramp, la = L.at(c[0], c[1]), cid = nid('sk', u), oid = nid('so', u), b0 = P(0, .8), b1 = P(0, -4.6);
  let out = seat(u, L, o, F.x, F.y + .4 * s, 19 * s);
  // the tuft above the tie
  const tuft = smooth([P(-2.3, -16.4), P(-3.6, -18.6), P(-4.4, -20.6 + j()), P(-2.4, -20.2), P(-1, -21.3 + j()), P(.6, -20.3), P(2.2, -21.2 + j()), P(4.2, -20.2), P(3.4, -18.4), P(2.3, -16.4)].map(q => q)), tg = mat('canvas', L, { form: 'fold', x1: P(0, -16.5)[0], y1: P(0, -16.5)[1], x2: P(0, -21)[0], y2: P(0, -21)[1], r: 1.5 * s, u });
  out += `<defs>${g.defs}${tg.defs}<clipPath id="${cid}"><path d="${d}"/></clipPath>${linGrad(oid, b0[0], b0[1], b1[0], b1[1], [[0, L.shadowTint, .5], [1, L.shadowTint, 0]])}</defs>`
    + `<path d="${tuft}Z" fill="${tg.fill}" stroke="${rp.outline}" stroke-width=".5" stroke-linejoin="round"/>`;
  let fold = '', lite = '';
  const sgL = la.ux >= 0 ? 1 : -1;
  for (let i = 0; i < 7; i++) { const t = (i + .5) / 7, x0 = lerp(-2.2, 2.2, t), x1 = lerp(-8.6, 8.8, t) + j(), y1 = -9.5 + Math.abs(t - .5) * -3 + j() * 2, a = P(x0, -16.2), b = P(x1, y1), m = P(lerp(x0, x1, .45) + (t - .5) * 1.6, lerp(-16.2, y1, .5));
    fold += `M${P2(a)}Q${P2(m)} ${P2(b)}`; lite += `M${P2(add(a, [sgL * .5 * s, 0]))}Q${P2(add(m, [sgL * .7 * s, 0]))} ${P2(add(b, [sgL * .5 * s, 0]))}`; }
  for (const e of [-1, 1]) fold += `M${P2(P(e * 9.2, -2.6))}Q${P2(P(e * 6.6, -1.4))} ${P2(P(e * 4.4, -2.4 + j()))}M${P2(P(e * 8.4, -5))}Q${P2(P(e * 6.8, -3.6))} ${P2(P(e * 5.6, -4.2))}`;
  const seam = smooth([P(7.4, -.4), P(8.4, -4), P(8, -8.4), P(6, -12), P(3.4, -15)]);
  out += `<path d="${d}" fill="${g.fill}"/><g clip-path="url(#${cid})"><path d="${fold}" stroke="${rp.shadow}" stroke-width="${f(.7 * s)}" fill="none" opacity=".5" stroke-linecap="round"/><path d="${lite}" stroke="${mix(rp.lit, '#ffffff', .2)}" stroke-width="${f(.5 * s)}" fill="none" opacity=".4" stroke-linecap="round"/>`
    + `<path d="${seam}" stroke="${rp.outline}" stroke-width="${f(.4 * s)}" fill="none" opacity=".5" stroke-dasharray="${f(.9 * s)} ${f(.8 * s)}"/><path d="${poly([P(-12, 1.4), P(12, 1.4), P(12, -4.6), P(-12, -4.6)])}" fill="url(#${oid})"/></g><path d="${d}" fill="none" stroke="${rp.outline}" stroke-width=".55" stroke-linejoin="round"/>`;
  out += rope(u, L, [P(-2.9, -16.2), P(0, -15.4), P(2.9, -16.4)], { r: .62 * s, seed: seedOf(o, 21) }) + rope(u, L, [P(1.6, -15.7), P(3.6, -13.6), P(3.2, -11.2)], { r: .45 * s, seed: seedOf(o, 21) + 1, whip: true }) + rope(u, L, [P(1.2, -15.6), P(.6, -13), P(1.5, -11.6)], { r: .45 * s, seed: seedOf(o, 21) + 2, whip: true });
  return out;
}
/**
 * bell(u, L, { x, y, s, frame, ell, seed }) — a brass ship's bell with its bell rope: the crown, the shoulder with
 * moulding lines, the flared waist and the thick lip (13 high, 13 across the mouth), an iron clapper showing under
 * the mouth, a rope with a knot hanging from it. It hangs in a small oak belfry (two posts with knobs on feet, a
 * headstock), 34 units high; (x, y) — the middle between the feet. frame: false — the bell alone, (x, y) — the top
 * of its crown.
 */
function bell(u, L, o = {}) {
  const F0 = frame(o), s = F0.s, fr = o.frame !== false, F = fr ? F0 : frame(Object.assign({}, o, { x: F0.p(0, 23.6)[0], y: F0.p(0, 23.6)[1] })), k = ellOf(o, L, F0.y, .16, .34), R = rng(seedOf(o, 22));
  let out = '';
  if (fr) for (const e of [-1, 1]) { const x = e * 11.5; out += seat(u, L, o, ...F.p(x, .2), 8.5 * s) + shadeBox(u, [F.face([[x - 3.6, -2.4], [x + 3.6, -2.4], [x + 4.6, -3.7], [x - 2.6, -3.7]], 'top'), F.face([[x - 3.6, -2.4], [x + 3.6, -2.4], [x + 3.6, 0], [x - 3.6, 0]], 'front')], L, 'oak', { seed: seedOf(o, 22) + e })
    + shadeCyl(u, ...F.p(x + .5, -2.8), ...F.p(x + .5, -30), 1.55 * s, L, 'oak', { ell: k, face: 2, seed: seedOf(o, 22) + e * 3 }) + shadeCyl(u, ...F.p(x + .5, -24.2), ...F.p(x + .5, -25.2), 1.95 * s, L, 'oak', { ell: k, face: 2, grain: false, outline: .35 }) + shadeSphere(u, ...F.p(x + .5, -31.4), 1.9 * s, L, 'oak'); }
  // the clapper and the bell rope hang under the mouth
  const cl = F.p(.4, -7.9); out += shadeSphere(u, cl[0], cl[1], 1.35 * s, L, 'iron', { outline: .35 }) + rope(u, L, [F.p(.4, -6.8), F.p(.2, -4.6), F.p(.7, -2.6)], { r: .5 * s, seed: seedOf(o, 22) }) + shadeSphere(u, ...F.p(.7, -2.2), .95 * s, L, 'rope', { outline: .3 });
  out += tube(u, L, 'iron', F.d('M-1.5 -27 L-1.5 -24 Q0 -22.6 1.5 -24 L1.5 -27'), .45 * s, F.p(0, -24));
  const A = F.p(0, -23.6), B = F.p(0, -10.6), mr = 6.6;
  const prof = [[0, 2.3], [.05, 3.2], [.12, 3.65], [.3, 3.9], [.5, 4.2], [.68, 4.75], [.82, 5.5], [.92, 6.2], [.975, 6.55], [1, mr]].map(q => [q[0], q[1] * s]);
  const g = lathe(u, L, 'brass', A, B, prof, { ell: k, spec: [.12, .86] });
  out += shadeCyl(u, ...F.p(0, -23.2), ...F.p(0, -24.6), 1.5 * s, L, 'brass', { ell: k, face: 2, outline: .35 }) + g.svg;
  let bands = ''; const rr = t => { let i = 0; while (i + 2 < prof.length && prof[i + 1][0] < t) i++; return lerp(prof[i][1], prof[i + 1][1], clamp((t - prof[i][0]) / (prof[i + 1][0] - prof[i][0]))); };
  for (const t of [.15, .21, .86, .915]) { const c = mixP(A, B, t), r = rr(t); bands += `<path d="${halfD(c, mul(g.n, r), mul(g.a, r * k))}" stroke="${g.rp.shadow}" stroke-width="${f(.4 * s)}" fill="none" opacity=".7"/><path d="${halfD(add(c, mul(g.a, .42 * s)), mul(g.n, r * 1.01), mul(g.a, r * k))}" stroke="${g.rp.spec}" stroke-width="${f(.28 * s)}" fill="none" opacity=".45"/>`; }
  out += `<g clip-path="url(#${g.clip})">${bands}</g>`;
  if (fr) out += shadeCyl(u, ...F.p(-14, -27), ...F.p(14, -27), 1.75 * s, L, 'oak', { ell: .25, face: 2, seed: seedOf(o, 22) + 9 });
  void R; return out;
}
/**
 * scroll(u, L, { x, y, s, seal, ell, seed, flip }) — a parchment half unrolled on a table, 19 wide: the roll at the
 * far edge with its spiral end, the sheet lying in perspective with a curl at the near edge, a faint coastline
 * drawn in ink (no writing), a red wax seal on a ribbon (seal: false to drop it).
 */
function scroll(u, L, o = {}) {
  const F = frame(o), s = F.s, R = rng(seedOf(o, 23)), k = ellOf(o, L, F.y, .2, .5), dp = 20 * k, P = (x, y) => F.p(x, y);
  const sheet = [[-8.4, -dp], [8.4, -dp], [9.7, .2], [-9.7, .2]], c = P(0, -dp / 2), g = mat('bone', L, { form: 'plane', x1: P(-9, 0)[0], y1: P(0, -dp)[1], x2: P(9, 0)[0], y2: P(0, 0)[1], n: F.n('top'), u }), rp = g.ramp, cid = nid('sc', u), oid = nid('sd', u), a0 = P(0, -dp), a1 = P(0, -dp + 2.6);
  let out = seat(u, L, o, c[0], c[1] + 1 * s, 19 * s, { ry: (dp / 2 + 1) * s, opacity: .5 });
  out += `<defs>${g.defs}<clipPath id="${cid}"><path d="${poly(sheet.map(q => P(q[0], q[1])))}"/></clipPath>${linGrad(oid, a0[0], a0[1], a1[0], a1[1], [[0, L.shadowTint, .5], [1, L.shadowTint, 0]])}</defs><path d="${poly(sheet.map(q => P(q[0], q[1])))}" fill="${g.fill}" stroke="${rp.outline}" stroke-width=".45" stroke-linejoin="round"/>`;
  const S = (x, t) => P(x * lerp(1, 1.15, t), lerp(-dp, .2, t)); let ink = '';
  { const cst = []; for (let i = 0; i <= 8; i++) cst.push(S(-6 + i * 1.5, .25 + .3 * Math.sin(i * 1.3 + R() * 2) + R() * .12)); ink += `<path d="${smooth(cst)}" stroke="${rp.outline}" stroke-width="${f(.35 * s)}" fill="none" opacity=".6"/>`;
    const isl = S(3.5 + R() * 2, .22); ink += `<ellipse cx="${f(isl[0])}" cy="${f(isl[1])}" rx="${f(1.3 * s)}" ry="${f(.55 * s)}" fill="none" stroke="${rp.outline}" stroke-width="${f(.3 * s)}" opacity=".55"/>`;
    ink += `<path d="${smooth([S(-6.5, .82), S(-2, .68), S(1.5, .78), S(5, .4)])}" stroke="${L.tone('paint-red', .2, c[0], c[1])}" stroke-width="${f(.3 * s)}" stroke-dasharray="${f(.8 * s)} ${f(.7 * s)}" fill="none" opacity=".7"/>`; }
  out += `<g clip-path="url(#${cid})">${ink}<path d="${poly([P(-10, -dp), P(10, -dp), P(10, -dp + 2.6), P(-10, -dp + 2.6)])}" fill="url(#${oid})"/></g>`;
  out += shadeCyl(u, ...P(-9, -dp - 1.1), ...P(9, -dp - 1.1), 1.6 * s, L, 'bone', { ell: .3, face: 2, outline: .42 });
  { const e = P(9, -dp - 1.1), sp = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * 9, r = 1.3 * (1 - i / 16); sp.push(add(e, F.v(Math.cos(t) * r * .3, Math.sin(t) * r))); } out += `<path d="${smooth(sp)}" stroke="${rp.outline}" stroke-width="${f(.25 * s)}" fill="none" opacity=".6"/>`; }
  out += shadeCyl(u, ...P(-10, .5), ...P(10, .5), .95 * s, L, 'bone', { ell: .3, face: 2, outline: .4 });
  if (o.seal !== false) { const sp = S(6.2, .8); out += `<path d="M${P2(sp)}Q${P2(add(sp, F.v(1.6, 1.6)))} ${P2(add(sp, F.v(1.2, 3.4)))}M${P2(sp)}Q${P2(add(sp, F.v(-.4, 2)))} ${P2(add(sp, F.v(-1.4, 3.2)))}" stroke="${L.tone('paint-red', .3, sp[0], sp[1])}" stroke-width="${f(.9 * s)}" fill="none" stroke-linecap="round"/>` + shadeSphere(u, sp[0], sp[1], 1.45 * s, L, 'paint-red', { outline: .35 }) + `<circle cx="${f(sp[0])}" cy="${f(sp[1])}" r="${f(.75 * s)}" fill="none" stroke="${L.ramp('paint-red', sp[0], sp[1]).shadow}" stroke-width="${f(.3 * s)}" opacity=".7"/>`; }
  return out;
}
/**
 * coins(u, L, { x, y, s, n, r, ell, seed }) — gold coins on a table: a leaning stack and loose coins round it, n in
 * all (7), each of radius r (2.2): a thick edge, a face with a raised rim and a glint on the light's side.
 */
function coins(u, L, o = {}) {
  const F = frame(o), s = F.s, n = Math.max(1, Math.round(o.n || 7)), r = (o.r || 2.2) * s, k = ellOf(o, L, F.y, .2, .5), R = rng(seedOf(o, 24)), th = r * .26;
  const one = (c, tilt = 0) => { const la = L.at(c[0], c[1]), rp = L.ramp('brass', c[0], c[1]), top = [c[0], c[1] - th], v = [r * Math.cos(tilt), r * Math.sin(tilt)], w = [-r * k * Math.sin(tilt), r * k * Math.cos(tilt)];
    const g = mat('brass', L, { form: 'cyl', x1: c[0], y1: c[1], x2: top[0], y2: top[1], r, u }), tg = mat('brass', L, { form: 'plane', x1: top[0] - r, y1: top[1] - r * k, x2: top[0] + r, y2: top[1] + r * k, n: 'top', u }), gl = add(top, [la.ux * r * .42, la.uy * r * .42 * k]);
    return `<defs>${g.defs}${tg.defs}</defs><path d="${halfD(c, v, w)}${halfR(top, v, w)}Z" fill="${g.fill}" stroke="${rp.outline}" stroke-width=".32" stroke-linejoin="round"/><path d="${ellD(top, v, w)}" fill="${tg.fill}" stroke="${rp.outline}" stroke-width=".32"/><path d="${ellD(top, mul(v, .74), mul(w, .74))}" fill="none" stroke="${rp.shadow}" stroke-width="${f(clamp(r * .08, .15, .3))}" opacity=".6"/>`
      + `<ellipse cx="${f(gl[0])}" cy="${f(gl[1])}" rx="${f(r * .42)}" ry="${f(r * .42 * k)}" fill="#ffd27a" opacity=".45"/><ellipse cx="${f(gl[0])}" cy="${f(gl[1])}" rx="${f(r * .2)}" ry="${f(r * .2 * k)}" fill="#fffdf0" opacity=".9"/>`; };
  const st = Math.min(n, Math.max(1, Math.round(n * .45))), loose = [];
  for (let i = 0; i < n - st; i++) { const a = (i / Math.max(1, n - st)) * 5.2 + R() * .8 + .6, d = r * (2.1 + R() * 1.6); loose.push([F.x + Math.cos(a) * d + r * .6, F.y + Math.sin(a) * d * k * 1.3, (R() - .5) * .3]); }
  let out = seat(u, L, o, F.x, F.y, r * 2.4), back = '', front = '';
  for (const q of loose.sort((a, b) => a[1] - b[1])) { const c = seat(u, L, o, q[0], q[1], r * 2.2, { opacity: .6 }) + one(q, q[2]); if (q[1] < F.y) back += c; else front += c; }
  out += back; for (let i = 0; i < st; i++) out += one([F.x + (R() - .5) * r * .34, F.y - i * th * 1.08], (R() - .5) * .08);
  return out + front;
}
/**
 * sabre(u, L, { x, y, s, seed, flip, rot }) — a cutlass lying on a table, 46 units long, the hilt to the left (flip
 * — to the right), (x, y) — under its middle: a curved steel blade with a fuller, a ground edge and a clipped point
 * (flat steel by the light, a glint across it), a brass shell guard and knuckle bow, a leather grip bound with
 * wire, a brass pommel.
 */
function sabre(u, L, o = {}) {
  const F = frame(o), s = F.s, P = (x, y) => F.p(x, y), R = rng(seedOf(o, 25));
  const bd = F.d('M-12 -2.7 Q5 -3.2 21.4 -8.9 L23.2 -8.3 Q22.6 -6.6 20.6 -5.2 Q9 -.2 -12 .2 Z'), mid = P(5, -3), la = L.at(mid[0], mid[1]), cid = nid('sb', u);
  const g = mat('iron', L, { form: 'plane', x1: P(-12, 0)[0], y1: P(0, -9)[1], x2: P(23, 0)[0], y2: P(0, .4)[1], n: F.n([0, .3, .95]), u }), rp = g.ramp;
  const bev = F.d('M-12 -.6 Q9 -1.1 20.2 -6 L21.6 -6.2 Q21.6 -5.9 20.6 -5.2 Q9 -.2 -12 .2 Z'), bI = clamp(F.n([0, -.55, .83]).reduce((t, v, i) => t + v * [la.dx, -la.dy, la.dz][i], 0), -1, 1);
  let out = seat(u, L, o, ...P(2, .6), 40 * s, { ry: 1.3 * s, opacity: .6 });
  const gl = nid('sg', u), g0 = P(0, -3), g1 = P(13.5, -5), gop = .25 + .5 * clamp(L.key.power * la.k);
  out += `<defs>${linGrad(gl, g0[0], g0[1], g1[0], g1[1], [[0, '#ffffff', 0], [.4, '#ffffff', gop * .5], [.55, '#ffffff', gop], [.62, '#ffffff', gop * .25], [.72, '#ffffff', gop * .7], [.8, '#ffffff', gop * .15], [1, '#ffffff', 0]])}</defs>`;
  out += `<defs>${g.defs}<clipPath id="${cid}"><path d="${bd}"/></clipPath></defs><path d="${bd}" fill="${g.fill}"/><g clip-path="url(#${cid})"><path d="${bev}" fill="${L.tone('iron', bI + .25, mid[0], mid[1])}"/>`
    + `<path d="${F.d('M-11 -1.9 Q5 -2.4 17.5 -6.4')}" stroke="${rp.shadow}" stroke-width="${f(.55 * s)}" fill="none" opacity=".7"/><path d="${F.d('M-11 -1.55 Q5 -2.05 17.5 -6.05')}" stroke="${rp.spec}" stroke-width="${f(.25 * s)}" fill="none" opacity=".6"/>`
    + `<path d="${poly([P(1, -10), P(15, -10), P(12, 1.5), P(-2, 1.5)])}" fill="url(#${gl})"/></g><path d="${bd}" fill="none" stroke="${rp.outline}" stroke-width=".45" stroke-linejoin="round"/>`;
  // the hilt
  out += tube(u, L, 'brass', F.d('M-12.6 .9 C-13.4 5.4 -21 5.8 -22.8 1.4'), .62 * s, P(-17, 4.4));
  out += shadeCyl(u, ...P(-13.4, -1.3), ...P(-21.8, -.2), 1.2 * s, L, 'leather', { outline: .4 });
  let wire = ''; for (let i = 0; i < 6; i++) { const t = (i + .5) / 6, c = mixP(P(-13.4, -1.3), P(-21.8, -.2), t); wire += `M${P2(add(c, F.v(.35, -1.2)))}L${P2(add(c, F.v(-.35, 1.2)))}`; }
  out += `<path d="${wire}" stroke="${L.ramp('brass', ...P(-17, -.8)).lit}" stroke-width="${f(.28 * s)}" opacity=".75"/>`;
  out += shadeCyl(u, ...P(-13.5, -1.25), ...P(-12.3, -1.25), 3.3 * s, L, 'brass', { ell: .28, face: 2, outline: .42 }) + shadeSphere(u, ...P(-22.9, -.05), 1.6 * s, L, 'brass', { outline: .4 });
  void R; return out;
}
/**
 * pistol(u, L, { x, y, s, seed, flip, rot }) — a flintlock pistol lying on its side, 27 units long, the muzzle to the
 * right (flip — to the left), (x, y) — under its middle: an iron barrel in a wooden stock with a brass band and
 * butt cap, a ramrod under the barrel, the lock (plate, cock with its flint, frizzen over the pan), a trigger in a
 * brass guard.
 */
function pistol(u, L, o = {}) {
  const F = frame(o), s = F.s, P = (x, y) => F.p(x, y);
  const st = F.d('M11.8 -4.9 L-4.2 -5 Q-6.4 -6 -7.6 -5.2 Q-10.6 -3.4 -12.4 .2 Q-13.6 2.4 -12.6 3.6 Q-11.2 4.4 -10 3.2 Q-8.4 .2 -5.4 -1.9 Q-2.4 -2.9 2 -3.1 L11.8 -3.4 Z');
  const g = mat('oak', L, { form: 'cyl', x1: P(-12.5, 2)[0], y1: P(-12.5, 2)[1], x2: P(11.8, -4.2)[0], y2: P(11.8, -4.2)[1], r: 2.6 * s, u }), rp = g.ramp, cid = nid('pi', u), rI = L.ramp('iron', ...P(0, -5)), rB = L.ramp('brass', ...P(0, -3));
  let out = seat(u, L, o, ...P(0, 1.2), 24 * s, { ry: 1.5 * s, opacity: .6 });
  out += tube(u, L, 'brass', F.d('M-7 -1.4 C-6.8 2 -1.6 1.8 -1.2 -2.6'), .36 * s, P(-4, 1));
  out += `<path d="${F.d('M-4.3 -2.8 Q-4.6 -1 -3.7 -.3')}" stroke="${rI.outline}" stroke-width="${f(.75 * s)}" fill="none" stroke-linecap="round"/><path d="${F.d('M-4.3 -2.8 Q-4.6 -1 -3.7 -.3')}" stroke="${rI.half}" stroke-width="${f(.4 * s)}" fill="none" stroke-linecap="round"/>`;
  out += `<defs>${g.defs}<clipPath id="${cid}"><path d="${st}"/></clipPath></defs><path d="${st}" fill="${g.fill}"/><g clip-path="url(#${cid})"><path d="${F.d('M-11.6 1.6 Q-8.6 -3.2 -4 -4 L10 -4.1')}" stroke="${rp.lit}" stroke-width="${f(.4 * s)}" fill="none" opacity=".35"/><path d="${F.d('M-12 3 Q-9.6 -1.4 -5 -2.6')}" stroke="${rp.shadow}" stroke-width="${f(.5 * s)}" fill="none" opacity=".4"/></g><path d="${st}" fill="none" stroke="${rp.outline}" stroke-width=".45" stroke-linejoin="round"/>`;
  out += shadeSphere(u, ...P(-12.3, 2.5), 1.55 * s, L, 'brass', { outline: .38 });
  out += shadeCyl(u, ...P(1.5, -3.25), ...P(12.8, -3.5), .4 * s, L, 'pine-deck', { outline: .3, grain: false, cap: 'round' });
  out += shadeCyl(u, ...P(-4.6, -5.9), ...P(13.4, -5.9), 1.15 * s, L, 'iron', { r1: 1.25 * s, r2: .98 * s, ell: .22, face: 2, outline: .4 });
  { const m = P(13.4, -5.9); out += `<ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(.14 * s)}" ry="${f(.55 * s)}" transform="rotate(${f(F.rot)} ${f(m[0])} ${f(m[1])})" fill="${rI.outline}"/>`; }
  for (const x of [7.6, 11.6]) out += shadeCyl(u, ...P(x, -4.7), ...P(x + .9, -4.7), 2 * s, L, 'brass', { outline: .3 });
  // the lock: plate, pan, frizzen, cock with the flint
  const lp = mat('iron', L, { form: 'plane', x1: P(-6.6, 0)[0], y1: P(0, -5.3)[1], x2: P(.4, 0)[0], y2: P(0, -3.2)[1], n: F.n('front'), u });
  out += `<defs>${lp.defs}</defs><path d="${F.d('M-6.6 -4.2 Q-6.4 -5.3 -5 -5.2 L-.4 -5.1 Q.6 -4.9 .2 -4 Q-2 -3.1 -5.4 -3.3 Q-6.6 -3.4 -6.6 -4.2 Z')}" fill="${lp.fill}" stroke="${rI.outline}" stroke-width=".4"/>`;
  out += `<path d="${F.d('M-2.6 -5.3 L-.9 -5.3 L-.7 -4.7 L-2.8 -4.7 Z')}" fill="${rI.core}" stroke="${rI.outline}" stroke-width=".3"/>`;
  out += tube(u, L, 'iron', F.d('M-2.4 -5.5 L-1 -5.6 Q-.3 -6.4 -.5 -8.3'), .42 * s, P(-.8, -6.8));
  out += tube(u, L, 'iron', F.d('M-5.3 -4.1 Q-6.6 -5.8 -5.9 -7.4 Q-5.2 -8.5 -3.9 -8.2'), .55 * s, P(-5.8, -6.8));
  out += `<path d="${poly([P(-4.2, -8.7), P(-2.6, -7.7), P(-4, -7.5)])}" fill="${L.tone('bone', .2, ...P(-3.5, -8))}" stroke="${rI.outline}" stroke-width=".3" stroke-linejoin="round"/>` + rivet(L, P(-5.2, -4.2), .62 * s) + rivet(L, P(-4.4, -8.9), .45 * s) + rivet(L, P(-1.6, -4.1), .36 * s);
  void rB; return out;
}
/**
 * hourglass(u, L, { x, y, s, sand, ell, seed }) — a sand glass, 16 units high and 10 wide: two turned oak plates on
 * three thin posts, two glass bulbs meeting in a narrow neck (the background shows through, glints on the light's
 * side), sand in the upper bulb (sand 0..1 — how much is left, 0.45), a thread of it falling, a cone below.
 */
function hourglass(u, L, o = {}) {
  const F = frame(o), s = F.s, k = ellOf(o, L, F.y, .18, .4), sand = o.sand != null ? clamp(o.sand, 0, 1) : .45, P = (x, y) => F.p(x, y), H = 16;
  const cyl = (y0, y1, r, kind, extra) => shadeCyl(u, ...P(0, y0), ...P(0, y1), r * s, L, kind, Object.assign({ ell: k, face: 2, outline: .4 }, extra));
  const post = sg => { const x = sg * 4.05, dy = k * 4.05 * Math.sqrt(1 - sg * sg); return shadeCyl(u, ...P(x, -1.3 + dy), ...P(x, -H + 1.3 + dy), .48 * s, L, 'oak', { outline: .3, grain: false }); };
  let out = seat(u, L, o, F.x, F.y + k * 2 * s, 10 * s) + cyl(0, -1.4, 4.9, 'oak', { seed: seedOf(o, 26) });
  { const x = .2 * 4.05, dy = -k * 4.05 * Math.sqrt(1 - .04); out += shadeCyl(u, ...P(x, -1.3 + dy), ...P(x, -H + 1.3 + dy), .48 * s, L, 'oak', { outline: .3, grain: false }); }
  const A = P(0, -1.5), B = P(0, -H + 1.5), prof = [[0, 2.5], [.07, 3.25], [.2, 3.35], [.34, 2.4], [.45, .95], [.5, .46], [.55, .95], [.66, 2.4], [.8, 3.35], [.93, 3.25], [1, 2.5]].map(q => [q[0], q[1] * s]);
  const g = lathe(u, L, 'glass', A, B, prof, { ell: k, opacity: .2, spec: false, outline: .38 }), C = t => mixP(A, B, t), col = L.tone('paint-ochre', .55, A[0], A[1]), col2 = L.tone('paint-ochre', -.15, A[0], A[1]);
  const lo = .06 + (1 - sand) * .2, hi = .56 + sand * .3, n = g.n, a = g.a, R4 = 4 * s;
  let sd = `<path d="M${P2(add(C(.005), mul(n, -R4)))}L${P2(add(C(lo * .55), mul(n, -R4 * .78)))}Q${P2(C(lo * 2.4))} ${P2(add(C(lo * .55), mul(n, R4 * .78)))}L${P2(add(C(.005), mul(n, R4)))}L${P2(add(C(-.1), mul(n, R4)))}L${P2(add(C(-.1), mul(n, -R4)))}Z" fill="${col}"/><path d="M${P2(C(lo * 1.3))}L${P2(add(C(lo * .5), mul(n, R4 * .8)))}L${P2(add(C(-.1), mul(n, R4)))}L${P2(C(-.1))}Z" fill="${col2}" opacity=".45"/>`;
  if (sand > .02) sd += `<path d="${poly([add(C(.5), mul(n, -R4)), add(C(.5), mul(n, R4)), add(C(hi), mul(n, R4)), add(C(hi - .03), [0, 0]), add(C(hi), mul(n, -R4))])}" fill="${col}"/><path d="${ellD(C(hi - .012), mul(n, 2.6 * s), mul(a, 2.6 * s * k))}" fill="${col2}" opacity=".5"/><path d="M${P2(C(.5))}L${P2(C(lo * 1.2))}" stroke="${col}" stroke-width="${f(.3 * s)}"/>`;
  out += `<g clip-path="url(#${g.clip})">${sd}</g>` + g.svg;
  const sgL = (g.la.dx * n[0] + g.la.dy * n[1]) >= 0 ? 1 : -1;
  for (const [t0, t1] of [[.1, .3], [.7, .9]]) { const p0 = add(C(t0), mul(n, sgL * 2.1 * s)), p1 = add(C(t1), mul(n, sgL * 2.1 * s)), pm = add(C((t0 + t1) / 2), mul(n, sgL * 2.6 * s)); out += `<path d="M${P2(p0)}Q${P2(pm)} ${P2(p1)}" stroke="#ffffff" stroke-width="${f(.5 * s)}" fill="none" stroke-linecap="round" opacity="${f(.45 + .4 * clamp(L.key.power * g.la.k))}"/><path d="M${P2(add(p0, mul(n, -sgL * 4.4 * s)))}L${P2(add(p1, mul(n, -sgL * 4.4 * s)))}" stroke="${g.rp.lit}" stroke-width="${f(.3 * s)}" stroke-linecap="round" opacity=".35"/>`; }
  out += `<g clip-path="url(#${g.clip})"><path d="${g.d}" fill="none" stroke="${L.tone('glass', -.6, A[0], A[1])}" stroke-width="${f(.9 * s)}" opacity=".3"/></g>`;
  return out + post(-.86) + post(.72) + cyl(-H + 1.4, -H, 4.9, 'oak', { seed: seedOf(o, 26) + 1 });
}

// ——— big things of the place: bulwark, pier, bollard, rock ———
/**
 * bulwark(u, L, { x1, x2, y, h, kind, posts, seed }) — a ship's bulwark seen from the deck, from x1 to x2 (picture
 * units, 0..200), its foot on y, h (34) high: strakes of planking of different width with butt joints and nails, the
 * stanchions standing proud of them (each shows the side turned to the middle of the picture and drops a shadow
 * away from the light), the capping rail with its lit top and the shadow under it, the waterway at the foot.
 * posts — the mean gap between stanchions (26). A dark calm foreground under the card's glass.
 */
function bulwark(u, L, o = {}) {
  const x1 = o.x1 != null ? o.x1 : 0, x2 = o.x2 != null ? o.x2 : 200, y = o.y != null ? o.y : 280, h = o.h || 34, kind = o.kind || 'oak', R = rng(seedOf(o, 27)), sd = seedOf(o, 27), top = y - h, cx = L.cam.cx, k = h / 34;
  const rf = 3.4 * k, rt = 2 * k, ww = 3 * k, mid = [(x1 + x2) / 2, y - h / 2], la = L.at(mid[0], mid[1]);
  const g = mat(kind, L, { form: 'plane', x1, y1: top, x2, y2: y, n: 'front', u }), rp = g.ramp, cid = nid('bw', u), sid = nid('bs', u), shLen = clamp((4 + 8 * -la.dy) * k, 3 * k, 13 * k);
  let body = `<rect x="${f(x1)}" y="${f(top)}" width="${f(x2 - x1)}" height="${f(h)}" fill="${g.fill}"/>`, yy = top + rf;
  while (yy < y - ww - 2) { const sh = (5.2 + R() * 3.2) * k, y2 = Math.min(y - ww, yy + sh), v = R();
    body += `<rect x="${f(x1)}" y="${f(yy)}" width="${f(x2 - x1)}" height="${f(y2 - yy)}" fill="${v > .5 ? rp.lit : rp.shadow}" opacity="${f(.03 + Math.abs(v - .5) * .22)}"/>`;
    for (let i = 0, n = Math.round((x2 - x1) / 14); i < n; i++) { const gx = x1 + R() * (x2 - x1), gl = (8 + R() * 22) * k, gy = yy + (.15 + R() * .7) * (y2 - yy); body += `<path d="M${f(gx)} ${f(gy)}q${f(gl / 2)} ${f((R() - .5) * 1.4 * k)} ${f(gl)} ${f((R() - .5) * .6 * k)}" stroke="${i % 3 ? rp.core : rp.lit}" stroke-width="${f(clamp(.34 * k, .25, .6))}" fill="none" opacity="${i % 3 ? .3 : .22}"/>`; }
    for (let bx = x1 + R() * 60; bx < x2; bx += 50 + R() * 70) { body += `<path d="M${f(bx)} ${f(yy)}L${f(bx)} ${f(y2)}" stroke="${rp.outline}" stroke-width="${f(.45 * k)}" opacity=".6"/>`; for (const e of [-1.6, 1.6]) for (const t of [.25, .75]) body += `<circle cx="${f(bx + e * k)}" cy="${f(lerp(yy, y2, t))}" r="${f(.42 * k)}" fill="${rp.outline}" opacity=".7"/>`; }
    body += `<path d="M${f(x1)} ${f(y2)}L${f(x2)} ${f(y2)}" stroke="${rp.outline}" stroke-width="${f(.55 * k)}" opacity=".7"/><path d="M${f(x1)} ${f(y2 + .5 * k)}L${f(x2)} ${f(y2 + .5 * k)}" stroke="${rp.lit}" stroke-width="${f(.3 * k)}" opacity=".3"/>`;
    yy = y2; }
  let out = `<defs>${g.defs}<clipPath id="${cid}"><rect x="${f(x1)}" y="${f(top)}" width="${f(x2 - x1)}" height="${f(h)}"/></clipPath>${linGrad(sid, 0, top + rf, 0, top + rf + shLen, [[0, L.shadowTint, .6], [1, L.shadowTint, 0]])}</defs><g clip-path="url(#${cid})">${body}<rect x="${f(x1)}" y="${f(top + rf)}" width="${f(x2 - x1)}" height="${f(shLen)}" fill="url(#${sid})"/></g>`;
  // the waterway at the foot
  out += shadeBox(u, [{ pts: [[x1, y - ww], [x2, y - ww], [x2, y], [x1, y]], n: [0, .55, .83], grain: [1, 0] }], L, kind, { seed: sd + 1, outline: .45 });
  // stanchions
  const gap = (o.posts || 26) * k; let px = x1 + gap * (.2 + R() * .5), si = 0;
  while (px < x2 - 2) { const pw = (5.2 + R() * 1.5) * k, sw = 1.6 * k, right = px + pw / 2 < cx, sx = right ? px + pw : px - sw, y0 = top + rf * .6, lightRight = la.dx > 0, shW = clamp(1.6 + 3 * Math.abs(la.dx), 1.6, 4.2) * k, shx = lightRight ? Math.min(px, sx) - shW : Math.max(px + pw, sx + sw), gid = nid('bp', u);
    out += `<defs>${linGrad(gid, lightRight ? shx + shW : shx, 0, lightRight ? shx : shx + shW, 0, [[0, L.shadowTint, .5], [1, L.shadowTint, 0]])}</defs><rect x="${f(shx)}" y="${f(y0)}" width="${f(shW)}" height="${f(y - ww - y0)}" fill="url(#${gid})"/>`;
    out += shadeBox(u, [{ pts: [[sx, y0], [sx + sw, y0], [sx + sw, y - ww * .5], [sx, y - ww * .5]], n: right ? 'right' : 'left', grain: [0, 1] }, { pts: [[px, y0], [px + pw, y0], [px + pw, y - ww * .3], [px, y - ww * .3]], n: 'front', grain: [0, 1] }], L, kind, { seed: sd + 7 + si, outline: .5 });
    for (const t of [.24, .72]) out += rivet(L, [px + pw / 2 + (R() - .5) * k, lerp(y0, y, t)], .55 * k);
    px += pw + gap * (.8 + R() * .4); si++; }
  // the capping rail: front face and lit top
  const rg = nid('br', u), ug = nid('bu', u);
  out += shadeBox(u, [{ pts: [[x1, top - rt], [x2, top - rt], [x2, top], [x1, top]], n: 'top', grain: [1, 0] }, { pts: [[x1, top], [x2, top], [x2, top + rf], [x1, top + rf]], n: [0, .25, .97], grain: [1, 0] }], L, kind, { seed: sd + 3, outline: .5 });
  out += `<defs>${linGrad(rg, 0, top, 0, top + rf, [[0, rp.lit, .35], [.4, rp.lit, 0], [.75, L.shadowTint, 0], [1, L.shadowTint, .4]])}${linGrad(ug, 0, top + rf, 0, top + rf + 1.4 * k, [[0, L.shadowTint, .55], [1, L.shadowTint, 0]])}</defs><rect x="${f(x1)}" y="${f(top)}" width="${f(x2 - x1)}" height="${f(rf)}" fill="url(#${rg})"/><rect x="${f(x1)}" y="${f(top + rf)}" width="${f(x2 - x1)}" height="${f(1.4 * k)}" fill="url(#${ug})"/>`
    + `<path d="M${f(x1)} ${f(top + rf * .56)}L${f(x2)} ${f(top + rf * .56)}" stroke="${rp.outline}" stroke-width="${f(.35 * k)}" opacity=".45"/><path d="M${f(x1)} ${f(top + .25 * k)}L${f(x2)} ${f(top + .25 * k)}" stroke="${mix(rp.lit, '#ffffff', .35)}" stroke-width="${f(.4 * k)}" opacity="${f(clamp(.2 - la.dy * .5, .1, .7))}"/>`;
  for (let jx = x1 + 30 + R() * 60; jx < x2 - 10; jx += 70 + R() * 60) out += `<path d="M${f(jx)} ${f(top - rt)}L${f(jx + 1.2 * k)} ${f(top)}L${f(jx + 4 * k)} ${f(top + rf)}" stroke="${rp.outline}" stroke-width="${f(.4 * k)}" fill="none" opacity=".6"/>`;
  return out;
}

function pierGeo(L, o = {}) {
  const hz = o.horizon != null ? o.horizon : L.cam.horizon, vx = o.vx != null ? o.vx : L.cam.cx, y = o.y != null ? o.y : 280, far = o.far != null ? o.far : hz + 22, x1 = o.x1 != null ? o.x1 : 30, x2 = o.x2 != null ? o.x2 : 110;
  const sc = yy => (yy - hz) / (y - hz), X = (xb, yy) => vx + (xb - vx) * sc(yy), s1 = sc(far), yAt = t => hz + (y - hz) / lerp(1, 1 / s1, t);
  return { hz, vx, y, far, x1, x2, sc, X, yAt };
}
/**
 * pier(u, L, { horizon, vx, x1, x2, y, far, drop, piles, pileH, plank, kind, bollard, bollardAt, seed }) — a wooden
 * pier running from the viewer into the depth: its near edge lies on y (280) from x1 to x2, the sides run to the
 * vanishing point (vx, horizon), the far end is at y = far. Planks lie across it, each of its own width, tint and
 * length, with nails at the ends; piles stand along both edges (`piles` to a side, pileH high at the near edge);
 * where a side is seen (the pier lies to one side of vx) it shows the stringer, the dark under the deck, braces
 * and the piles going `drop` units down to the water with foam round them. A bollard stands on it (bollard: false
 * to drop it). pier.at(L, opts, t, side) -> { x, y, s }: the point of the deck at depth t 0..1 (near..far), side
 * -1..1 across, and the scale there — to stand things on it.
 */
function pier(u, L, o = {}) {
  const G = pierGeo(L, o), { hz, y, far, x1, x2, sc, X, yAt } = G, kind = o.kind || 'pine-deck', R = rng(seedOf(o, 28)), sd = seedOf(o, 28), drop = o.drop != null ? o.drop : 30, np = o.piles || 5, ph = o.pileH || 12;
  const visR = x2 < G.vx, visL = x1 > G.vx, mid = [X((x1 + x2) / 2, (y + far) / 2), (y + far) / 2], la = L.at(mid[0], mid[1]), rp = L.ramp(kind, mid[0], mid[1]);
  const I = L.point ? -.1 : clamp(-la.dy * .8 + .08, -.2, .9);
  let out = '', after = '';
  const pile = (xe, sgn, t, vis, i) => { const yy = yAt(t), s = sc(yy), cxp = X(xe, yy) + sgn * 1.3 * s, r = 2.5 * s * (.9 + R() * .25), topY = yy - ph * s * (.8 + R() * .45), bot = vis ? yy + drop * s : yy + 2 * s, k = clamp(L.ellipse(yy, hz) * 1.1, .14, .4), tilt = (R() - .5) * 1.6 * s;
    let p = '';
    if (vis) { const wy = lerp(bot, yy, .34 + R() * .12); p += shadeCyl(u, cxp, bot, cxp, wy, r, L, 'tar', { outline: .4, seed: sd + i }) + `<path d="M${f(cxp - r)} ${f(wy)}q${f(r)} ${f(r * k * 1.2)} ${f(2 * r)} 0" stroke="${mix(L.tone('tar', .2, cxp, wy), '#3f6a3a', .5)}" stroke-width="${f(clamp(1.4 * s, .4, 2))}" fill="none" opacity=".7"/>`
      + shadeCyl(u, cxp, wy, cxp + tilt, topY, r, L, 'oak', { ell: k, face: 2, seed: sd + i * 3 }) + ENV.foam(u, { x: cxp, y: bot, w: r * 3.4, L, seed: sd + i * 5 }); }
    else p += shadeCyl(u, cxp, bot, cxp + tilt, topY, r, L, 'oak', { ell: k, face: 2, seed: sd + i * 3 });
    if (R() > .55) { const by = lerp(topY, yy, .22); p += shadeCyl(u, cxp + tilt * .8, by + 1.1 * s, cxp + tilt * .8, by, r * 1.06, L, 'iron', { ell: k, outline: .3 }); }
    return p; };
  const ts = Array.from({ length: np }, (_, j) => lerp(.03, .97, np > 1 ? j / (np - 1) : .5));
  for (let j = np - 1; j >= 0; j--) { if (!visL) out += pile(x1, -1, ts[j], false, j * 2); if (!visR) out += pile(x2, 1, ts[j], false, j * 2 + 1); }
  for (const [xe, sgn, vis] of [[x1, -1, visL], [x2, 1, visR]]) if (vis) { // the seen side: the dark under the deck, braces, the stringer
    const a = [xe, y], b = [X(xe, far), far], a2 = [xe, y + drop], b2 = [X(xe, far), far + drop * sc(far)], uid = nid('pu', u), bh = 4.6;
    out += `<defs>${linGrad(uid, 0, far, 0, y + drop, [[0, mix(L.pal.sea[1], L.shadowTint, .5), .55], [1, mix(L.pal.sea[2], scale(L.shadowTint, .6), .6), .9]])}</defs><path d="${poly([a, b, b2, a2])}" fill="url(#${uid})"/>`;
    for (let j = 0; j + 1 < np; j++) { const ya = yAt(ts[j]), yb = yAt(ts[j + 1]), sa = sc(ya), sb = sc(yb), pa = [X(xe, ya), ya + bh * sa], pb = [X(xe, yb), yb + drop * sb * .82], pc = [X(xe, ya), ya + drop * sa * .82], pd = [X(xe, yb), yb + bh * sb], tc = L.ramp('tar', pa[0], pa[1]);
      out += `<path d="M${P2(pa)}L${P2(pb)}M${P2(pc)}L${P2(pd)}" stroke="${tc.outline}" stroke-width="${f(2.2 * sa)}"/><path d="M${P2(pa)}L${P2(pb)}M${P2(pc)}L${P2(pd)}" stroke="${tc.half}" stroke-width="${f(1.3 * sa)}"/>`; }
    out += shadeBox(u, [{ pts: [a, b, [b[0], b[1] + bh * sc(far)], [a[0], a[1] + bh]], n: sgn > 0 ? 'right' : 'left', grain: [b[0] - a[0], b[1] - a[1]] }], L, 'oak', { seed: sd + 11, outline: .5 });
    for (let j = np - 1; j >= 0; j--) after += pile(xe, sgn, ts[j], true, 20 + j);
  }
  // the deck: planks across, each its own
  const did = nid('pd', u), tn = L.tone(kind, I, mid[0], mid[1]);
  out += `<defs>${linGrad(did, 0, far, 0, y, [[0, mix(L.tone(kind, I + .05, mid[0], far), L.pal.sky[3], clamp(L.haze * .35))], [1, L.tone(kind, I - .12, mid[0], y)]])}</defs><path d="${poly([[X(x1, far), far], [X(x2, far), far], [x2, y], [x1, y]])}" fill="url(#${did})"/>`;
  const pw = o.plank || 7, s1 = sc(far), seam = mix(rp.outline, L.tone(kind, -.4, mid[0], mid[1]), .3), lit = L.tone(kind, Math.min(1, I + .4), mid[0], mid[1]); let inv = 1, pl = '';
  while (inv < 1 / s1) { const nx = Math.min(1 / s1, inv + pw / (y - hz) * (.75 + R() * .55)), y0 = hz + (y - hz) / inv, y1 = hz + (y - hz) / nx, s = 1 / inv, eL = (R() - .35) * 1.6 * s, eR = (R() - .35) * 1.6 * s, v = R();
    const q = [[X(x1, y1) - eL, y1], [X(x2, y1) + eR, y1], [X(x2, y0) + eR, y0], [X(x1, y0) - eL, y0]];
    pl += `<path d="${poly(q)}" fill="${v > .5 ? lit : seam}" opacity="${f(.05 + Math.abs(v - .5) * .34)}"/><path d="M${P2(q[3])}L${P2(q[2])}" stroke="${seam}" stroke-width="${f(clamp(.6 * s, .2, .7))}" opacity=".8"/><path d="M${f(q[3][0])} ${f(y0 - .5 * s)}L${f(q[2][0])} ${f(y0 - .5 * s)}" stroke="${lit}" stroke-width="${f(clamp(.3 * s, .12, .4))}" opacity=".35"/>`;
    if (s > .3) { const ym = (y0 + y1) / 2; for (const [xa, e] of [[X(x1, ym), 1], [X(x2, ym), -1]]) for (const dy of [-.22, .22]) pl += `<ellipse cx="${f(xa + e * 2.6 * s)}" cy="${f(ym + dy * (y0 - y1))}" rx="${f(.5 * s)}" ry="${f(.3 * s)}" fill="${seam}" opacity=".75"/>`;
      if (R() > .4) { const gx = lerp(q[3][0], q[2][0], .1 + R() * .5), gl = (q[2][0] - q[3][0]) * (.2 + R() * .3), gy = lerp(y0, y1, .3 + R() * .4); pl += `<path d="M${f(gx)} ${f(gy)}q${f(gl / 2)} ${f((R() - .5) * 1.4 * s)} ${f(gl)} 0" stroke="${R() > .5 ? seam : lit}" stroke-width="${f(clamp(.35 * s, .15, .45))}" fill="none" opacity=".3"/>`; } }
    inv = nx; }
  out += pl + `<path d="M${P2([X(x1, far), far])}L${P2([x1, y])}M${P2([X(x2, far), far])}L${P2([x2, y])}" stroke="${rp.outline}" stroke-width=".5" fill="none" opacity=".8"/>`;
  void tn;
  if (o.bollard !== false) { const b = pier.at(L, o, o.bollardAt != null ? o.bollardAt : .3, visR ? .5 : visL ? -.5 : .55); after = bollard(u, L, { x: b.x, y: b.y, s: b.s * (o.bollardS || 1), rope: o.bollardRope, seed: sd + 2 }) + after; }
  return out + after;
}
pier.at = (L, o = {}, t = 0, side = 0) => { const G = pierGeo(L, o), yy = G.yAt(clamp(t)); return { x: G.X(lerp(G.x1, G.x2, (side + 1) / 2), yy), y: yy, s: G.sc(yy) }; };

/**
 * bollard(u, L, { x, y, s, kind, rope, ell, seed }) — mooring bitts: two short posts with mushroom caps on a foot
 * plate, a cross bar through them; 14 wide, 11 high. kind — 'iron' (cast) or 'oak'. rope: true — a rope made fast
 * round them in figure-of-eight turns. bollard.tie(opts) -> { x, y } — where a mooring rope leaves it.
 */
function bollard(u, L, o = {}) {
  const F = frame(o), s = F.s, k = ellOf(o, L, F.y, .2, .45), kind = o.kind || 'iron', D = 7, dx = 1.3, y0 = -1.3 - D * k / 2, P = (x, y) => F.p(x, y), sd = seedOf(o, 29);
  let out = seat(u, L, o, ...P(dx / 2, -D * k / 2 + .6), 17 * s, { ry: (D * k / 2 + 1.2) * s });
  out += shadeBox(u, [F.face([[-7, -1.3], [7, -1.3], [7 + dx, -1.3 - D * k], [-7 + dx, -1.3 - D * k]], 'top'), F.face([[7, -1.3], [7 + dx, -1.3 - D * k], [7 + dx, -D * k], [7, 0]], 'right'), F.face([[-7, -1.3], [7, -1.3], [7, 0], [-7, 0]], 'front')], L, kind === 'iron' ? 'iron' : 'oak', { seed: sd });
  const px = [-3.3 + dx / 2, 3.3 + dx / 2];
  out += shadeCyl(u, ...P(-6.6 + dx / 2, y0 - 5.2), ...P(6.6 + dx / 2, y0 - 5.2), .9 * s, L, kind, { ell: .25, face: 2, outline: .4, seed: sd + 1 });
  for (const x of px) out += seat(u, L, o, ...P(x, y0), 4.4 * s, { opacity: .6 }) + shadeCyl(u, ...P(x, y0), ...P(x, y0 - 8.2), 1.8 * s, L, kind, { ell: k, face: 2, outline: .45, seed: sd + x }) + shadeCyl(u, ...P(x, y0 - 8), ...P(x, y0 - 9.4), 2.5 * s, L, kind, { r1: 2.2 * s, r2: 2.5 * s, ell: k, face: 2, outline: .45, seed: sd + x + 1 });
  if (o.rope) { const rr = .62 * s, R = rng(sd + 3); let fr = '';
    for (let i = 0; i < 3; i++) { const yy = y0 - 2 - i * 1.45, a = P(px[0] + 1.9, yy + (i % 2 ? .5 : -.3)), b = P(px[1] - 1.9, yy + (i % 2 ? -.3 : .5)); out += rope(u, L, [a, b], { r: rr, seed: sd + 5 + i });
      for (const x of px) { const c = P(x, yy), v = F.v(2.1, 0), w = F.v(0, 2.1 * k + .25), pl = []; for (let j = 0; j <= 14; j++) { const t = Math.PI * j / 14; pl.push(add(c, add(mul(v, -Math.cos(t)), mul(w, Math.sin(t))))); } fr += tube(u, L, 'rope', halfD(c, v, w), rr, add(c, w), { cap: 'butt' }) + layMarks(L, pl, rr, R, add(c, w)); } }
    out += fr; }
  return out;
}
bollard.tie = (o = {}) => { const F = frame(o), p = F.p(3.3 + .65 + 2.1, -1.3 - 7 * (o.ell != null ? o.ell : .3) / 2 - 3.4); return { x: p[0], y: p[1] }; };

/**
 * rock(u, L, { x, y, s, w, h, seed, wet, foam, flip }) — a rock w wide and h high standing on (x, y): an uneven
 * outline, flat facets, each toned by its own normal against the scene's light, lighter worn edges on the light's
 * side, cracks. wet: the foot is dark and glossy with glints stretched down, and foam lies along the waterline
 * (foam: false to drop it; without wet the rock gets a contact shadow on dry ground).
 */
function rock(u, L, o = {}) {
  const F = frame(o), s = F.s, w = o.w || 30, h = o.h || 20, R = rng(seedOf(o, 30)), m = 6 + Math.floor(R() * 2), P = q => F.p(q[0], q[1]);
  const up = []; for (let i = 0; i <= m; i++) { const th = Math.PI * (1 - i / m), e = i === 0 || i === m; up.push([Math.cos(th) * w / 2 * (e ? 1 : .8 + R() * .26), e ? .2 : -Math.pow(Math.sin(th), .8) * h * (.78 + R() * .28), e ? h * .16 : 0]); }
  const qs = [[-w * (.1 + R() * .14), -h * (.5 + R() * .16), h * .55], [w * (.08 + R() * .16), -h * (.4 + R() * .2), h * .5]], bm = [(R() - .5) * w * .24, .7, h * .36];
  const near = p => Math.hypot(p[0] - qs[0][0], p[1] - qs[0][1]) <= Math.hypot(p[0] - qs[1][0], p[1] - qs[1][1]) ? 0 : 1, tris = [];
  for (let i = 0; i < m; i++) { const a = near(up[i]), b = near(up[i + 1]); tris.push([up[i], up[i + 1], qs[b]]); if (a !== b) tris.push([up[i], qs[a], qs[b]]); }
  tris.push([up[0], qs[0], bm], [qs[0], qs[1], bm], [qs[1], up[m], bm]);
  const c0 = P([0, -h / 2]), stone = (I, wetK = 0) => { const dry = mix(mix(L.tone('iron', I, c0[0], c0[1]), L.tone('leather', I, c0[0], c0[1]), .32), L.tone('bone', I, c0[0], c0[1]), .14); return wetK ? mix(dry, L.tone('water-wet', I * .8 - .15, c0[0], c0[1]), wetK) : dry; };
  const la = L.at(c0[0], c0[1]), outline = mix(stone(-.1), '#1c0f08', .62), sil = poly(up.map(P)), cid = nid('rk', u);
  let defs = `<clipPath id="${cid}"><path d="${sil}"/></clipPath>`, body = '', edges = '';
  for (const t of tris) { const p = t.map(P), z = t.map(q => q[2] * s), e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], z[1] - z[0]], e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], z[2] - z[0]];
    let nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(nn[0], nn[1], nn[2]) || 1; nn = nn.map(v => v / l * (nn[2] < 0 ? -1 : 1));
    const I = clamp(nn[0] * la.dx + nn[1] * la.dy + nn[2] * la.dz, -1, 1), cx = (p[0][0] + p[1][0] + p[2][0]) / 3, cy = (p[0][1] + p[1][1] + p[2][1]) / 3, gid = nid('rg', u), ext = Math.max(...p.map(q => Math.hypot(q[0] - cx, q[1] - cy)));
    defs += linGrad(gid, cx + la.ux * ext, cy + la.uy * ext, cx - la.ux * ext, cy - la.uy * ext, [[0, stone(clamp(I + .14, -1, 1))], [1, stone(clamp(I - .14, -1, 1))]]);
    body += `<path d="${poly(p)}" fill="url(#${gid})" stroke="${stone(I)}" stroke-width=".4" stroke-linejoin="round"/>`;
    if (I > .25) edges += `<path d="M${P2(p[0])}L${P2(p[2])}L${P2(p[1])}" stroke="${mix(stone(1), '#ffffff', .3)}" stroke-width="${f(.4 * s)}" fill="none" opacity="${f(.2 + I * .4)}" stroke-linejoin="round"/>`;
    else edges += `<path d="M${P2(p[0])}L${P2(p[2])}L${P2(p[1])}" stroke="${outline}" stroke-width="${f(.35 * s)}" fill="none" opacity=".28" stroke-linejoin="round"/>`; }
  let marks = '';
  for (let i = 0; i < 4; i++) { const a = [(R() - .5) * w * .7, -h * (.15 + R() * .6)], b = [a[0] + (R() - .5) * w * .22, a[1] + h * (.08 + R() * .16)], c = [b[0] + (R() - .5) * w * .12, b[1] + h * (.05 + R() * .1)]; marks += `<path d="M${P2(P(a))}L${P2(P(b))}L${P2(P(c))}" stroke="${outline}" stroke-width="${f(.4 * s)}" fill="none" opacity=".45" stroke-linejoin="round"/><path d="M${P2(add(P(a), [la.ux * -.5 * s, la.uy * -.5 * s]))}L${P2(add(P(b), [la.ux * -.5 * s, la.uy * -.5 * s]))}" stroke="${stone(1)}" stroke-width="${f(.3 * s)}" opacity=".3"/>`; }
  for (let i = 0; i < 12; i++) { const q = P([(R() - .5) * w * .8, -h * R() * .8]); marks += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f((.25 + R() * .4) * s)}" fill="${i % 2 ? outline : stone(1)}" opacity=".22"/>`; }
  if (o.wet) { const wid = nid('rw', u), a = P([0, .8]), b = P([0, -h * .42]), sp = L.ramp('water-wet', c0[0], c0[1]).spec; defs += linGrad(wid, a[0], a[1], b[0], b[1], [[0, mix(L.shadowTint, '#0c1a20', .4), .72], [.6, mix(L.shadowTint, '#0c1a20', .4), .4], [1, L.shadowTint, 0]]);
    marks += `<path d="${poly([P([-w, 1]), P([w, 1]), P([w, -h * .42]), P([-w, -h * .42])])}" fill="url(#${wid})"/>`;
    for (let i = 0; i < 7; i++) { const x = (R() - .5) * w * .8 + la.ux * w * .12, y0 = -h * (.05 + R() * .26), l = h * (.06 + R() * .12); marks += `<path d="M${P2(P([x, y0]))}L${P2(P([x + (R() - .5) * .6, y0 + l]))}" stroke="${sp}" stroke-width="${f((.4 + R() * .5) * s)}" stroke-linecap="round" opacity="${f(.3 + R() * .4)}"/>`; } }
  let out = o.wet ? '' : seat(u, L, o, F.x, F.y + .4 * s, w * s * 1.02);
  out += `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}${edges}${marks}</g><path d="${sil}" fill="none" stroke="${outline}" stroke-width=".6" stroke-linejoin="round"/>`;
  if (o.wet && o.foam !== false) out += ENV.foam(u, { x: F.x, y: F.y + .3 * s, w: w * s * 1.14, L, seed: seedOf(o, 30) + 4 });
  return out;
}

module.exports = { barrel, cannon, gunPort, shot, shotPile, rope, coil, chain, anchor, lantern, candle, bottle, mug, chest, crate, sack, bell, scroll, coins, sabre, pistol, hourglass, bulwark, pier, bollard, rock,
  propTube: tube, propLathe: lathe, propFrame: frame };
