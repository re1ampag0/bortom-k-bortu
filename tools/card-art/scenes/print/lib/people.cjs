// People for the print scenes, drawn as contours (not kit cylinders): a cloth tube along a bent spine (sleeve,
// trouser leg — folds at the bend, a cuff, no joint balls), a hand with fingers in a few poses (open, grip), a head
// in profile (eye, brow, nose, lips, ear, light on the cheek). Lives in a sub-folder so portrait.cjs does not load it
// as a scene. Pure functions -> SVG strings; ids from K.nid.
'use strict';
const K = require('../../kit/index.cjs');
const { f, mix, lerp, nid, linGrad, radGrad } = K;

function sp(P, closed) {
  const n = P.length, g = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}

// ——— a tube along a smooth spine ———
// C: control points, W: widths at them. Samples a Catmull-Rom curve; at(i, s) is the point at sample i, s from -1
// (the left edge) to 1 (the right edge, looking along the spine).
function tube(C, W, n = 7) {
  const S = [], g = i => C[Math.max(0, Math.min(C.length - 1, i))];
  for (let i = 0; i < C.length - 1; i++) for (let k = 0; k < n; k++) {
    const t = k / n, t2 = t * t, t3 = t2 * t, p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const p = [0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
    S.push({ p, w: lerp(W[i], W[i + 1], t * t * (3 - 2 * t)), seg: i, t });
  }
  S.push({ p: C[C.length - 1], w: W[W.length - 1], seg: C.length - 2, t: 1 });
  for (let i = 0; i < S.length; i++) { const a = S[Math.max(0, i - 1)].p, b = S[Math.min(S.length - 1, i + 1)].p, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    S[i].d = [dx / l, dy / l]; S[i].n = [-dy / l, dx / l]; }
  const N = S.length - 1;
  const at = (i, s, wk = 1) => { const q = S[Math.max(0, Math.min(N, i))]; return [q.p[0] + q.n[0] * q.w / 2 * s * wk, q.p[1] + q.n[1] * q.w / 2 * s * wk]; };
  const idx = t => Math.round(t * N);
  const edge = (s, i0 = 0, i1 = N, wk = 1) => { const a = []; for (let i = i0; i <= i1; i++) a.push(at(i, s, wk)); return a; };
  const outline = (i0 = 0, i1 = N, wk = 1, capA = false, capB = false) => {
    const l = edge(-1, i0, i1, wk), r = edge(1, i0, i1, wk).reverse(), P = [];
    if (capA) { const q = S[i0]; P.push([q.p[0] - q.d[0] * q.w * .42 * wk, q.p[1] - q.d[1] * q.w * .42 * wk]); }
    P.push(...l);
    if (capB) { const q = S[i1]; P.push([q.p[0] + q.d[0] * q.w * .42 * wk, q.p[1] + q.d[1] * q.w * .42 * wk]); }
    P.push(...r); return P;
  };
  return { S, N, at, idx, edge, outline };
}

// ——— cloth (or bare skin) along a limb ———
// o: { spine, w, tone {lit, half, shadow, outline}, lit: +1|-1 (which edge faces the light), rim (colour of the
// back-light edge, optional), rimSide (+1|-1, default -lit), folds: true (creases at the bends and a few drapes),
// cuff: { from (0..1), tone, k (widen) , roll (rolled sleeve lines) }, opacity, seed, capA, capB (round ends) }
function cloth(u, o) {
  const T = tube(o.spine, o.w), tn = o.tone, lit = o.lit || 1, cid = nid('pc', u), R = K.rng(o.seed || 7);
  const cutAt = o.cuff ? T.idx(o.cuff.from) : T.N;
  const body = T.outline(0, cutAt, 1, o.capA, o.capB && !o.cuff);
  let s = `<defs><clipPath id="${cid}"><path d="${sp(body, true)}"/></clipPath></defs>`;
  s += `<path d="${sp(body, true)}" fill="${tn.half}"/>`;
  s += `<g clip-path="url(#${cid})">`;
  const strip = (a, b, col, op) => `<path d="${sp(T.edge(a, 0, cutAt).concat(T.edge(b, 0, cutAt).reverse()), true)}" fill="${col}" opacity="${op}"/>`;
  s += strip(-lit * 1.2, -lit * .1, tn.shadow, .55) + strip(-lit * 1.2, -lit * .6, tn.shadow, .6);
  s += strip(lit * .3, lit * 1.2, tn.lit, .55) + strip(lit * .62, lit * .9, tn.lit, .45);
  if (o.folds !== false) {
    // creases on the inner side of each bend, fanning from it; a few soft drapes along the length
    for (let j = 1; j < o.spine.length - 1; j++) {
      const a = o.spine[j - 1], b = o.spine[j], c = o.spine[j + 1], cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      const inner = cr > 0 ? 1 : -1, ci = Math.round(j * T.N / (o.spine.length - 1));
      for (const [di, len, w] of [[0, .95, .7], [-3, .8, .55], [3, .75, .55], [-6, .55, .45], [5, .5, .4]]) {
        const i = ci + di; if (i < 1 || i >= cutAt) continue;
        const p0 = T.at(i, inner * .98), p1 = T.at(i + Math.sign(di || 1) * 1, inner * (1 - len * .7)), p2 = T.at(i + Math.sign(di || 1) * 2, inner * (1 - len * 1.6));
        s += `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}" stroke="${tn.shadow}" stroke-width="${f(w * (o.foldW || 1))}" fill="none" stroke-linecap="round" opacity=".75"/>`;
        const q0 = T.at(i + 1, inner * .9), q1 = T.at(i + 1 + Math.sign(di || 1), inner * (1 - len * .7) - lit * .08), q2 = T.at(i + 1 + Math.sign(di || 1) * 2, inner * (1 - len * 1.5));
        s += `<path d="M${f(q0[0])} ${f(q0[1])}Q${f(q1[0])} ${f(q1[1])} ${f(q2[0])} ${f(q2[1])}" stroke="${tn.lit}" stroke-width="${f(w * .5 * (o.foldW || 1))}" fill="none" stroke-linecap="round" opacity=".5"/>`;
      }
    }
    for (let k = 0; k < (o.drapes != null ? o.drapes : 3); k++) {
      const i = Math.round((.12 + .76 * R()) * cutAt), sd = R() < .5 ? -1 : 1, p0 = T.at(i, sd * .95), p1 = T.at(i + 2, sd * .1), p2 = T.at(i + 4, -sd * .55);
      s += `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}" stroke="${tn.shadow}" stroke-width="${f(.45 * (o.foldW || 1))}" fill="none" stroke-linecap="round" opacity=".55"/>`;
    }
  }
  s += '</g>';
  s += `<path d="${sp(body, true)}" fill="none" stroke="${tn.outline}" stroke-width="${o.sw || .4}"/>`;
  if (o.rim) s += `<path d="${sp(T.edge((o.rimSide || -lit) * .9, 0, cutAt))}" stroke="${o.rim}" stroke-width="${o.rimW || .45}" fill="none" opacity="${o.rimOp || .75}"/>`;
  if (o.cuff) {
    const c = o.cuff, ct = c.tone || tn, k = c.k || 1.12, i0 = Math.max(0, cutAt - 1), cuffP = T.outline(i0, T.N, k, false, false);
    s += `<path d="${sp(cuffP, true)}" fill="${ct.half}" stroke="${ct.outline}" stroke-width="${o.sw || .4}"/>`;
    s += `<path d="${sp(T.edge(lit * .55, i0, T.N, k).concat(T.edge(lit * 1, i0, T.N, k).reverse()), true)}" fill="${ct.lit}" opacity=".6"/>`;
    s += `<path d="${sp(T.edge(-lit * .55, i0, T.N, k).concat(T.edge(-lit * 1, i0, T.N, k).reverse()), true)}" fill="${ct.shadow}" opacity=".6"/>`;
    const a = T.at(i0, -1, k), b = T.at(i0, 1, k), m = T.at(Math.min(T.N, i0 + 1), 0);
    s += `<path d="M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}" stroke="${ct.outline}" stroke-width=".35" fill="none" opacity=".8"/>`;
    if (c.roll) for (let i = i0 + 1; i < T.N; i += 2) { const p = T.at(i, -1, k), q = T.at(i, 1, k); s += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="${ct.shadow}" stroke-width=".35" opacity=".7"/>`; }
    if (c.buttons) for (const sv of [-.35, .35]) { const p = T.at(Math.round((i0 + T.N) / 2), sv, k); s += K.shadeSphere(u, p[0], p[1], c.buttons, o.L, 'brass', { outline: .25 }); }
  }
  return s;
}

// ——— a hand ———
// o: { at: the wrist, a: degrees (the direction to the finger tips), s: size (1 = a hand of about 9 units), m: +1|-1
// (mirror: which side the thumb is on; +1 — the thumb on the frame's −y side), pose: 'open' | 'grip' | 'hook',
// tone (skin ramp), spread (deg, open), curl (0..1, open), thumb: 'front' | 'back', nails: true, bone: true (a
// skeleton hand: phalanges as bones, the same pose) }
// Returns { back, front }: `back` goes under what the hand holds, `front` over it (for 'grip' the fingers are front).
function hand(u, o) {
  const a = (o.a || 0) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, s = o.s || 1, m = o.m || 1, W = o.at;
  const P = (x, y) => [W[0] + s * (x * ux + m * y * nx), W[1] + s * (x * uy + m * y * ny)];
  const tn = o.tone, sw = o.sw || .38, nail = o.nail || mix(tn.lit, '#ffffff', .35);
  const Ps = arr => arr.map(p => P(p[0], p[1]));
  // a finger (or thumb) as a jointed tapered body from its base along angles th[] with lengths ls[]
  const digit = (b, th, ls, w0, curl) => {
    const C = [b], Wd = [w0]; let x = b[0], y = b[1], ang = th;
    ls.forEach((l, i) => { ang += (i ? curl : 0); x += Math.cos(ang * Math.PI / 180) * l; y += Math.sin(ang * Math.PI / 180) * l; C.push([x, y]); Wd.push(w0 * (1 - .14 * (i + 1))); });
    return { C, Wd };
  };
  const drawDigit = (dg, shade, showNail) => {
    if (o.bone) return boneDigit(dg);
    const T = tube(dg.C.map(p => P(p[0], p[1])), dg.Wd.map(w => w * s), 4), out = T.outline(0, T.N, 1, false, true);
    let r = `<path d="${sp(out, true)}" fill="${shade}" stroke="${tn.outline}" stroke-width="${sw}"/>`;
    // the joint creases and a lit line along the top
    for (let j = 1; j < dg.C.length - 1; j++) { const i = j * 4, p = T.at(i, -.7), q = T.at(i, .7); r += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="${tn.shadow}" stroke-width=".22" opacity=".75"/>`; }
    r += `<path d="${sp(T.edge(-.55 * m, 1, T.N - 1))}" stroke="${tn.lit}" stroke-width=".3" fill="none" opacity=".55"/>`;
    if (showNail && o.nails !== false) { const q = T.S[T.N], t = T.at(T.N - 1, 0); r += `<ellipse cx="${f(lerp(t[0], q.p[0], .5))}" cy="${f(lerp(t[1], q.p[1], .5))}" rx="${f(q.w * .42)}" ry="${f(q.w * .3)}" transform="rotate(${f(Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI)} ${f(lerp(t[0], q.p[0], .5))} ${f(lerp(t[1], q.p[1], .5))})" fill="${nail}" opacity=".7"/>`; }
    return r;
  };
  const bc = o.boneColor || '#eef0e6';
  const boneDigit = dg => { let r = ''; const Q = dg.C.map(p => P(p[0], p[1]));
    for (let i = 0; i < Q.length - 1; i++) { const w = dg.Wd[i] * s * .55; r += `<path d="M${f(Q[i][0])} ${f(Q[i][1])}L${f(lerp(Q[i][0], Q[i + 1][0], .86))} ${f(lerp(Q[i][1], Q[i + 1][1], .86))}" stroke="${bc}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
      r += `<circle cx="${f(Q[i][0])}" cy="${f(Q[i][1])}" r="${f(w * .62)}" fill="${bc}"/>`; }
    return r; };
  let back = '', front = '';
  const palmPts = [[-.4, -1.5], [1.6, -2.0], [4.4, -2.1], [5.2, -1.3], [5.4, 0], [5.2, 1.4], [4.4, 2.0], [1.6, 1.9], [-.4, 1.45]];
  const palm = () => {
    if (o.bone) { let r = ''; const Q = Ps([[0, 0], [5, -1.5], [5.2, -.5], [5.2, .5], [5, 1.5]]); for (let i = 1; i < 5; i++) r += `<path d="M${f(Q[0][0])} ${f(Q[0][1])}L${f(Q[i][0])} ${f(Q[i][1])}" stroke="${bc}" stroke-width="${f(.42 * s)}" stroke-linecap="round"/>`;
      return r + `<ellipse cx="${f(P(.4, 0)[0])}" cy="${f(P(.4, 0)[1])}" rx="${f(1.1 * s)}" ry="${f(.9 * s)}" fill="${bc}"/>`; }
    let r = `<path d="${sp(Ps(palmPts), true)}" fill="${tn.half}" stroke="${tn.outline}" stroke-width="${sw}"/>`;
    r += `<path d="${sp(Ps([[.4, -1.4 * m], [2.6, -1.8 * m], [4.6, -1.7 * m], [5.1, -1 * m]]))}" stroke="${tn.lit}" stroke-width="${f(.55 * s)}" fill="none" opacity=".6" stroke-linecap="round"/>`;
    r += `<path d="${sp(Ps([[.4, 1.3 * m], [2.6, 1.7 * m], [4.4, 1.8 * m]]))}" stroke="${tn.shadow}" stroke-width="${f(.6 * s)}" fill="none" opacity=".55" stroke-linecap="round"/>`;
    for (const y of [-1.4, -.45, .5, 1.4]) { const p = P(1.6, y * .7), q = P(4.6, y); r += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="${tn.shadow}" stroke-width=".2" opacity=".45"/>`; }
    return r;
  };
  const pose = o.pose || 'open';
  if (pose === 'open' || pose === 'hook') {
    const sp0 = o.spread != null ? o.spread : 8, cu = (o.curl != null ? o.curl : .25) * (pose === 'hook' ? 60 : 30);
    const F = [[-1.45, 4.2, -1.5], [-.48, 4.7, -.5], [.48, 4.4, .5], [1.42, 3.5, 1.5]];
    let fs = '';
    for (const [y, l, k] of F.slice().reverse()) fs += drawDigit(digit([4.8, y], k * sp0, [l * .45, l * .32, l * .26], 1.02, cu), k > 0 ? mix(tn.half, tn.shadow, .25) : tn.half, true);
    const th = digit([1.2, -1.6], -48 + (o.thumbA || 0), [1.8, 1.5, 1.2], 1.2, 18);
    const thumb = drawDigit(th, mix(tn.half, tn.lit, .2), true);
    if (o.thumb === 'back') back = thumb + fs + palm(); else { back = fs + palm(); front = thumb; }
    if (pose === 'hook' || o.split) { front = fs + front; back = (o.thumb === 'back' ? thumb : '') + palm(); }
  } else if (pose === 'grip') {
    // the fist round a handle that crosses the hand at x ≈ 6 along the frame's y: the four fingers wrap it in a
    // stack, their middle joints toward us; the thumb comes over the index finger from the ball of the hand
    let fs = '';
    const F = [[-1.5, .98], [-.5, 1.02], [.5, .98], [1.42, .86]];
    for (const [y, w] of F.slice().reverse()) {
      if (o.bone) { fs += boneDigit({ C: [[4.8, y], [6.5, y + .1], [7.4, y + .4], [6.9, y + .9]], Wd: [w, w * .85, w * .7, w * .6] }); continue; }
      const Q = Ps([[4.6, y - w / 2], [6.4, y - w / 2 - .05], [7.3, y - w / 2 + .15], [7.6, y], [7.3, y + w / 2 - .1], [6.4, y + w / 2], [4.6, y + w / 2]]);
      fs += `<path d="${sp(Q, true)}" fill="${tn.half}" stroke="${tn.outline}" stroke-width="${sw}"/>`;
      const a0 = P(6.3, y - w * .42), a1 = P(6.6, y), a2 = P(6.3, y + w * .42);
      fs += `<path d="M${f(a0[0])} ${f(a0[1])}Q${f(a1[0])} ${f(a1[1])} ${f(a2[0])} ${f(a2[1])}" stroke="${tn.shadow}" stroke-width=".22" fill="none" opacity=".8"/>`;
      const b0 = P(6.9, y - w * .4), b1 = P(7.5, y - w * .1); fs += `<path d="M${f(b0[0])} ${f(b0[1])}L${f(b1[0])} ${f(b1[1])}" stroke="${tn.lit}" stroke-width=".3" opacity=".6"/>`;
      const c0 = P(7.15, y - w * .4), c1 = P(7.15, y + w * .4); fs += `<path d="M${f(c0[0])} ${f(c0[1])}L${f(c1[0])} ${f(c1[1])}" stroke="${tn.shadow}" stroke-width=".5" opacity=".35"/>`;
    }
    const th = digit([1.4, -1.5], -30, [2.2, 1.9, 1.6], 1.25, 26);
    const thumb = o.bone ? boneDigit(th) : drawDigit(th, mix(tn.half, tn.lit, .25), true);
    back = '';
    front = palm() + fs + thumb;
  }
  return { back, front, P };
}

// ——— a jointed hand (3D) ———
// A small 3D model projected to the picture: the palm as a slab, four fingers with three phalanges each and the
// thumb with its own three bones (the first one makes the ball of the thumb). Each finger bends at its joints, so a
// fist round a handle is built by geometry: the fingers walk round the cylinder, the thumb comes round it the other
// way and lies over the index finger. Pieces are sorted by depth; what lies behind the held thing goes to `back`.
// o: { at: the wrist, or grip: where the handle's axis should cross the middle finger (then `at` is found);
//   a: degrees, the direction from the wrist to the knuckles; s: size (1 — a hand of about 9.5 units); m: ±1 mirror
//   (+1 — the thumb on the frame's −y side, as in hand()); roll: degrees round the hand's own axis — 0 the back of the
//   hand to us, 90 the thumb side (fist seen from the side), 180 the palm;
//   pose: 'wrap' (round a cylinder of radius r, default .8 — a hammer handle; 2 — a bottle) | 'fist' | 'open' |
//   'relaxed' | 'point' | 'scissor' (index and middle straight, pressed together: a card between them) | 'pinch';
//   flex: [[mcp, pip, dip] × 4] degrees (own pose, index → little), spread (deg), thumbFlex: [cmc, mcp, ip] deg,
//   thumbSpread (deg, + away from the fingers), yaw: [i, m, r, l] (deg, each finger's own sideways angle), tilt (deg: for 'wrap', the handle across the palm runs diagonal);
//   tone (skin ramp: lit, half, shadow, outline), light: [x, y] screen direction to the light (default up-left),
//   nails, knuckles (true), sw (outline), backFingers: [0..3, 'thumb'] — pieces to put in `back` (a card between
//   the fingers: the middle finger behind it); pitch: degrees round the hand's y — + tips the finger end towards us
//   (we look down on a fist: the curled fingers show beyond the knuckles);
//   optional proportions (default 1, the hand as before): palmW — the palm's width (and the knuckles' spread, the thumb's
//   root) across the hand, < 1 a slimmer hand; wristW — the palm's width at the wrist end only (< 1: it narrows to the
//   cuff); fingerW — the fingers' thickness; trueDorsal (false) — the back of each phalanx turns with its bend (nails
//   and knuckles right for fingers curled past 90°, e.g. curled fingers seen from the palm side); thumbJ — four local
//   points [x, y, z], the thumb's joints set by hand (e.g. lying across the palm); thumbOut ([x, y, z], default
//   [0, −1, .6]) — where the thumb's nail faces }
// Returns { back, front, P (local x, y, z → picture), wrist, grip (picture point of the handle axis), axis (unit,
// along the handle in the picture), r (the handle radius in picture units), joints (each digit's joints in the
// picture, index → little, thumb) }.
const HFING = [{ k: [4.75, -1.45], l: 4.2, w: 1.1, sp: -1.5 }, { k: [5.0, -.48], l: 4.7, w: 1.14, sp: -.5 },
  { k: [4.85, .48], l: 4.4, w: 1.08, sp: .5 }, { k: [4.5, 1.38], l: 3.5, w: .94, sp: 1.5 }];
const HPOSE = {
  open: { flex: [[4, 6, 4], [4, 6, 4], [5, 7, 4], [6, 8, 5]], spread: 7, thumbFlex: [0, 6, 8], thumbSpread: 4 },
  relaxed: { flex: [[16, 26, 14], [20, 30, 16], [24, 36, 20], [28, 40, 22]], spread: 3, thumbFlex: [8, 16, 14] },
  point: { flex: [[0, 4, 2], [78, 100, 60], [80, 100, 60], [80, 96, 56]], spread: 2, thumbFlex: [34, 30, 26], thumbSpread: -16 },
  scissor: { flex: [[6, 8, 4], [6, 8, 6], [70, 96, 56], [74, 96, 56]], spread: 0, thumbFlex: [22, 24, 18] },
  pinch: { flex: [[34, 46, 24], [40, 56, 30], [50, 70, 40], [58, 76, 44]], spread: 2, thumbFlex: [34, 22, 18], thumbSpread: -6 }
};
function hand3(u, o) {
  const s = o.s || 1, m = o.m || 1, an = (o.a || 0) * Math.PI / 180, ux = Math.cos(an), uy = Math.sin(an), nx = -uy, ny = ux;
  const rl = (o.roll || 0) * Math.PI / 180, cr = Math.cos(rl), sr = Math.sin(rl), pt = (o.pitch || 0) * Math.PI / 180, cp = Math.cos(pt), spp = Math.sin(pt);
  const tn = o.tone, sw = o.sw || .36, pose = o.pose || 'relaxed', wrap = pose === 'wrap' || pose === 'fist';
  const r = pose === 'fist' ? .12 : (o.r != null ? o.r : .8), tilt = (o.tilt != null ? o.tilt : 10) * Math.PI / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = a => sc(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
  // the view: a rotation about the hand's x axis; depth > 0 — towards us
  // pitch first (about the hand's y: + brings the finger end towards us), then roll (about its x)
  const pz = p => p[0] * spp + p[2] * cp, px = p => p[0] * cp - p[2] * spp;
  const yv = p => p[1] * cr + pz(p) * sr, dep = p => -p[1] * sr + pz(p) * cr;
  const VIEW = [spp * cr, -sr, cp * cr];
  let W = o.at || [0, 0];
  const scr = p => { const y = yv(p), x = px(p); return [W[0] + s * (x * ux + m * y * nx), W[1] + s * (x * uy + m * y * ny)]; };
  // the handle axis (wrap): along y, tilted so it is nearer the knuckles at the index side; z under the palm
  const zc = -(.85 + r), axX = y => 4.5 - Math.tan(tilt) * y;
  if (o.grip) { const g0 = scr([axX(-.48), -.48, zc]); W = [W[0] + o.grip[0] - g0[0], W[1] + o.grip[1] - g0[1]]; }
  const P = (x, y, z = 0) => scr([x, y, z]);
  const pr = Object.assign({}, HPOSE[pose] || {}, o);
  const pw = o.palmW || 1, ww = o.wristW || 1, fw = o.fingerW || 1;
  const HF = pw === 1 && fw === 1 ? HFING : HFING.map(F => Object.assign({}, F, { k: [F.k[0], F.k[1] * pw], w: F.w * fw }));
  const spread = (pr.spread != null ? pr.spread : 4) * Math.PI / 180;
  // ——— the digits as chains of 3D joints with widths ———
  const digits = [];
  HF.forEach((F, i) => {
    const K0 = [F.k[0], F.k[1], -.42], ls = [F.l * .45, F.l * .32, F.l * .26], ws = [F.w, F.w * .92, F.w * .84, F.w * .74];
    const yaw = (pr.yaw ? pr.yaw[i] * Math.PI / 180 : wrap ? -F.sp * 1.5 * Math.PI / 180 : F.sp * spread), d0 = [Math.cos(yaw), Math.sin(yaw), 0];
    const J = [K0], D = [], PH = [];
    if (wrap) {
      // walk round the handle: each joint on the circle of radius ρ about the axis, in the finger's own plane
      const C = [axX(K0[1]) - K0[0], zc - K0[2]];   // (along the finger, z) relative to the knuckle
      const rho = Math.hypot(C[0], C[1]); let th = Math.atan2(-C[1], -C[0]);
      for (const l of ls) { const st = 2 * Math.asin(Math.min(.999, l / (2 * rho))); th -= st;
        const t = C[0] + rho * Math.cos(th), z = C[1] + rho * Math.sin(th); J.push(add(K0, add(sc(d0, t), [0, 0, z]))); }
    } else {
      const fl = (pr.flex && pr.flex[i]) || [15, 20, 10]; let phi = 0, p = K0;
      fl.forEach((fd, j) => { phi += fd * Math.PI / 180; PH.push(phi); const d = add(sc(d0, Math.cos(phi)), [0, 0, -Math.sin(phi)]); p = add(p, sc(d, ls[j])); J.push(p); });
    }
    for (let j = 0; j < 3; j++) { const d = nrm(sub(J[j + 1], J[j])), dz = [0, 0, 1], dor = nrm(sub(dz, sc(d, dot(dz, d))));
      D.push(o.trueDorsal && PH.length ? nrm(add(sc(d0, Math.sin(PH[j])), [0, 0, Math.cos(PH[j])])) : dor); }
    digits.push({ id: i, J, ws, D });
  });
  { // the thumb: from the ball of the thumb (the carpal joint), three bones
    const C0 = [1.25, -1.45 * pw, -.78], ls = [1.75, 1.45, 1.2], ws = [1.4, 1.2, 1.08, .96].map(v => v * fw), J = [C0];
    if (o.thumbJ) { J.length = 0; for (const q of o.thumbJ) J.push(q.slice()); }
    else if (wrap) {
      // round the handle the other way from the fingers, rising from the palm, its tip over the index finger
      const ya = [-2.1 * pw, -1.7 * pw, -.95 * pw], ca = [axX(-1.9), zc]; let th = Math.atan2(J[0][2] - ca[1], J[0][0] - ca[0]);
      const rad = [r + .74, r + 1.2, r + 1.6];
      ls.forEach((l, j) => { const prev = J[j], dy = ya[j] - prev[1], lxz = Math.sqrt(Math.max(.05, l * l - dy * dy));
        const rho = rad[j], st = 2 * Math.asin(Math.min(.999, lxz / (2 * rho))); th = j === 0 ? Math.PI - .26 : th + st;
        J.push([ca[0] + rho * Math.cos(th), ya[j], ca[1] + rho * Math.sin(th)]); });
    } else {
      const tf = (pr.thumbFlex || [10, 15, 10]).map(v => v * Math.PI / 180), A = -(40 + (pr.thumbSpread || 0)) * Math.PI / 180;
      const T0 = nrm([Math.cos(A), Math.sin(A), -.5]), B0 = [.3, 1, -.9], B = nrm(sub(B0, sc(T0, dot(B0, T0))));
      let phi = 0, p = C0; tf.forEach((fd, j) => { phi += fd; const d = add(sc(T0, Math.cos(phi)), sc(B, Math.sin(phi))); p = add(p, sc(d, ls[j])); J.push(p); });
    }
    const D = []; for (let j = 0; j < 3; j++) { const d = nrm(sub(J[j + 1], J[j])), out = o.thumbOut || [0, -1, .6], dor = nrm(sub(out, sc(d, dot(out, d)))); D.push(dor); }
    digits.push({ id: 'thumb', J, ws, D });
  }
  // ——— drawing ———
  const Ls = o.light || [-.5, -.86];
  const lit2 = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return ((-dy / l) * Ls[0] + (dx / l) * Ls[1]) >= 0 ? 1 : -1; };
  const nail = o.nail || mix(tn.lit, '#ffffff', .3), crease = mix(tn.shadow, tn.half, .25);
  const piece = (dg, j0, j1) => {
    // one continuous tube through joints j0..j1 (a part of a digit that lies wholly in front of or behind the object)
    const C = [], Wd = []; for (let j = j0; j <= j1; j++) { C.push(scr(dg.J[j])); Wd.push(dg.ws[j] * s); }
    if (C.length === 2) { C.splice(1, 0, [lerp(C[0][0], C[1][0], .5), lerp(C[0][1], C[1][1], .5)]); Wd.splice(1, 0, lerp(Wd[0], Wd[1], .5)); }
    for (let k = 1; k < C.length; k++) if (Math.hypot(C[k][0] - C[k - 1][0], C[k][1] - C[k - 1][1]) < .02 * s) C[k] = [C[k][0] + .02 * s, C[k][1]];
    const T = tube(C, Wd, 5), tip = j1 === 3, out = T.outline(0, T.N, 1, true, true), side = lit2(C[0], C[C.length - 1]);
    let r2 = `<path d="${sp(out, true)}" fill="${tn.half}"/>`;
    const strip = (a, b, col, op) => `<path d="${sp(T.edge(a, 0, T.N).concat(T.edge(b, 0, T.N).reverse()), true)}" fill="${col}" opacity="${op}"/>`;
    r2 += strip(side * .25, side * .95, tn.lit, .55) + strip(-side * .45, -side * 1, tn.shadow, .5);
    // the joints: on the back of the finger a knuckle (light bump and a few wrinkles), on the inside a crease
    for (let j = Math.max(j0, 1); j <= Math.min(j1, 2); j++) {
      const i = Math.round((j - j0) / (j1 - j0) * T.N), facing = dot(dg.D[Math.min(2, j)], VIEW) + dot(dg.D[j - 1], VIEW);
      const p = T.at(i, -.62), q = T.at(i, .62), c = T.at(i, 0);
      if (facing > .1) r2 += `<path d="M${f(p[0])} ${f(p[1])}Q${f(c[0] + (c[0] - T.at(Math.max(0, i - 1), 0)[0]) * 1.4)} ${f(c[1] + (c[1] - T.at(Math.max(0, i - 1), 0)[1]) * 1.4)} ${f(q[0])} ${f(q[1])}" stroke="${crease}" stroke-width="${f(.16 * s)}" fill="none" opacity=".7"/>`
        + `<path d="M${f(T.at(i, -.4)[0])} ${f(T.at(i, -.4)[1])}Q${f(c[0])} ${f(c[1])} ${f(T.at(i, .4)[0])} ${f(T.at(i, .4)[1])}" stroke="${tn.lit}" stroke-width="${f(dg.ws[j] * s * .18)}" fill="none" stroke-linecap="round" opacity=".25" transform="translate(${f((c[0] - T.at(Math.max(0, i - 1), 0)[0]) * -.6)} ${f((c[1] - T.at(Math.max(0, i - 1), 0)[1]) * -.6)})"/>`;
      else r2 += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="${crease}" stroke-width="${f(.2 * s)}" opacity=".8"/>`;
    }
    r2 += `<path d="${sp(out, true)}" fill="none" stroke="${tn.outline}" stroke-width="${sw}"/>`;
    if (tip && o.nails !== false) {
      const dor = dg.D[2], vis = dot(dor, VIEW);
      const sl = Math.hypot(scr(dg.J[3])[0] - scr(dg.J[2])[0], scr(dg.J[3])[1] - scr(dg.J[2])[1]);
      if (vis > .3 && sl > dg.ws[3] * s * .7) { const a3 = dg.J[2], b3 = dg.J[3], w = dg.ws[3], c3 = add(add(sc(a3, .32), sc(b3, .68)), sc(dor, w * .34)), cc = scr(c3);
        const len = Math.hypot(...[0, 1].map(k => scr(b3)[k] - scr(a3)[k])), ang = Math.atan2(scr(b3)[1] - scr(a3)[1], scr(b3)[0] - scr(a3)[0]) * 180 / Math.PI;
        r2 += `<ellipse cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${f(Math.max(.18, len * .3))}" ry="${f(w * s * .34 * Math.min(1, vis + .2))}" transform="rotate(${f(ang)} ${f(cc[0])} ${f(cc[1])})" fill="${nail}" stroke="${mix(tn.shadow, tn.half, .3)}" stroke-width="${f(.1 * s)}" opacity=".9"/>`
          + `<ellipse cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${f(Math.max(.1, len * .12))}" ry="${f(w * s * .1)}" transform="rotate(${f(ang)} ${f(cc[0])} ${f(cc[1])})" fill="#ffffff" opacity=".55"/>`; }
    }
    return r2;
  };
  const items = [];   // { d: depth, svg, back }
  const dC = wrap ? dep([axX(-.48), -.48, zc]) : -1e9, backSet = new Set(o.backFingers || []);
  for (const dg of digits) {
    // split the chain where it crosses behind the handle (by the depth of each bone's middle)
    const segBack = [0, 1, 2].map(j => backSet.has(dg.id) || (wrap && dep(sc(add(dg.J[j], dg.J[j + 1]), .5)) < dC));
    let j = dg.id === 'thumb' ? 1 : 0;   // the thumb's first bone is inside the ball of the thumb (the palm's body)
    while (j < 3) { let k = j; while (k + 1 < 3 && segBack[k + 1] === segBack[j]) k++;
      const mids = []; for (let q = j; q <= k; q++) mids.push(dep(sc(add(dg.J[q], dg.J[q + 1]), .5)));
      items.push({ d: Math.max(...mids), svg: piece(dg, j, k + 1), back: segBack[j], thumb: dg.id === 'thumb' }); j = k + 1; }
  }
  // the palm: the back (z 0) and the inside (z −.85) outlines and the ball of the thumb, as one convex body
  let PB = [[-.4, -1.5], [1.4, -1.95], [3.2, -2.05], [4.4, -1.95], [4.82, -1.2], [4.98, -.4], [4.92, .5], [4.62, 1.35], [4.2, 1.85], [3.0, 2.0], [1.2, 1.85], [-.4, 1.45]];
  if (pw !== 1 || ww !== 1) PB = PB.map(p => [p[0], p[1] * pw * (p[0] < 2.2 ? lerp(ww, 1, Math.max(0, (p[0] + .4) / 2.6)) : 1)]);
  const TJ = digits[4].J, web = [TJ[1][0] + .1, TJ[1][1] + .1, TJ[1][2]], web0 = [lerp(TJ[0][0], TJ[1][0], .5), lerp(TJ[0][1], TJ[1][1], .5) - .35, lerp(TJ[0][2], TJ[1][2], .5)], web1 = [TJ[1][0] - .5, TJ[1][1] - .3, TJ[1][2]];
  const pts3 = [...PB.map(p => [p[0], p[1], 0]), ...PB.map(p => [p[0] * (p[0] > 4 ? .92 : .97), p[1] * .95, -.85]), [1.2, -1.9 * pw, -1.25], [2.4, -1.6 * pw, -1.35], [1.6, 1.4 * pw, -1.15], web, web0, web1];
  const hull = (() => { const Q = pts3.map(p => [px(p), yv(p)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr2 = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
    const lo = [], up = []; for (const p of Q) { while (lo.length > 1 && cr2(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of Q.slice().reverse()) { while (up.length > 1 && cr2(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); })();
  const H2 = hull.map(p => [W[0] + s * (p[0] * ux + m * p[1] * nx), W[1] + s * (p[0] * uy + m * p[1] * ny)]);
  let palm = '';
  { const g = nid('h3p', u), cx = H2.reduce((a, p) => a + p[0], 0) / H2.length, cy = H2.reduce((a, p) => a + p[1], 0) / H2.length, R0 = 3.2 * s;
    palm += `<defs>${linGrad(g, cx + Ls[0] * R0, cy + Ls[1] * R0, cx - Ls[0] * R0, cy - Ls[1] * R0, [[0, tn.lit, 1], [.4, tn.half, 1], [.85, tn.shadow, 1], [1, tn.shadow, 1]])}</defs>`
      + `<path d="${sp(H2, true)}" fill="url(#${g})" stroke="${tn.outline}" stroke-width="${sw}"/>`;
    const backVis = cr * cp, palmVis = -cr * cp;
    if (backVis > .25) {
      // the back of the hand: tendons fanning from the wrist to the knuckles, the knuckle row in the light
      for (const F of HF.slice(0, 3)) { const a0 = P(2.2, F.k[1] * .55, .02), a1 = P(F.k[0] - .5, F.k[1] * .92, .02);
        palm += `<path d="M${f(a0[0])} ${f(a0[1])}L${f(a1[0])} ${f(a1[1])}" stroke="${tn.lit}" stroke-width="${f(.32 * s)}" opacity="${f(.22 * backVis)}" stroke-linecap="round"/>`; }
      { const v = [P(1.0, .9, .02), P(2.2, .5, .02), P(3.0, .8, .02), P(3.9, .4, .02)]; palm += `<path d="${sp(v)}" stroke="${mix(tn.shadow, '#6a6a9a', .3)}" stroke-width="${f(.16 * s)}" fill="none" opacity="${f(.12 * backVis)}"/>`; }
      if (o.knuckles !== false) for (const F of HF) { const k = P(F.k[0] - .1, F.k[1], 0);
        palm += `<ellipse cx="${f(k[0])}" cy="${f(k[1])}" rx="${f(.42 * s)}" ry="${f(.3 * s)}" fill="${tn.lit}" opacity="${f(.45 * backVis)}"/>`; }
    }
    if (palmVis > .3) for (const L2 of [[[.8, -1.3], [2.4, -.9], [3.4, -1.4]], [[3.6, 1.8], [3.9, .2], [3.7, -1.6]], [[3.0, 1.9], [3.3, .6], [3.0, -.6]]])
      { const Q2 = L2.map(p => P(p[0], p[1], -.85)); palm += `<path d="${sp(Q2)}" stroke="${tn.shadow}" stroke-width="${f(.14 * s)}" fill="none" opacity="${f(.6 * palmVis)}"/>`; }
  }
  // the palm's depth: its nearest face, a little back, so the fingers' roots tuck under its edge
  const dPalm = Math.max(dep([2.5, 0, 0]), dep([2.5, 0, -.85])) - .35;
  items.push({ d: dPalm, svg: palm, back: wrap && dPalm < dC, palm: true });
  items.sort((a, b) => a.d - b.d);
  let back = '', front = '';
  for (const it of items) if (it.back) back += it.svg; else front += it.svg;
  const g1 = scr([axX(-1.6), -1.6, zc]), g2 = scr([axX(1.4), 1.4, zc]), gl = Math.hypot(g2[0] - g1[0], g2[1] - g1[1]) || 1;
  return { back, front, P, wrist: P(0, 0, -.42), grip: scr([axX(-.48), -.48, zc]), axis: [(g2[0] - g1[0]) / gl, (g2[1] - g1[1]) / gl], r: r * s, joints: digits.map(dg => dg.J.map(q => scr(q))) };
}

// ——— hair as a mass ———
// pts: the outline (picture points, closed); o: { r (the head radius: the size of strands), color, outline, seed,
// n (strands), flow: p → [dx, dy] (the way the hair runs there), sheen: point (the light's band on the mass), light
// ([x, y] to the light: the lit edge), tufts: indices of pts where a lock breaks the outline, tuftLen (× r), curl }
function hairMass(u, pts, o) {
  const r = o.r, R = K.rng(o.seed || 5), col = o.color, hi = o.hi || mix(col, '#f0dcc0', .38), lo = o.lo || mix(col, '#000000', .5);
  const cid = nid('hm', u), d = sp(pts, true), Lg = o.light || [0, -1];
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let s = '';
  // locks breaking the outline: a curved point outwards from the mass
  for (const i of o.tufts || []) { const p = pts[i % pts.length], q = pts[(i + 1) % pts.length], pp = pts[(i - 1 + pts.length) % pts.length];
    const tx = q[0] - pp[0], ty = q[1] - pp[1], tl = Math.hypot(tx, ty) || 1, ox = p[0] - cx, oy = p[1] - cy, ol = Math.hypot(ox, oy) || 1;
    const len = r * (o.tuftLen || .12) * (.6 + R() * .5), w = r * .09, fl = o.flow ? o.flow(p) : [ox / ol, oy / ol], fx = fl[0] * .6 + ox / ol * .4, fy = fl[1] * .6 + oy / ol * .4, fn = Math.hypot(fx, fy) || 1;
    const e = [p[0] + fx / fn * len, p[1] + fy / fn * len], a = [p[0] - tx / tl * w, p[1] - ty / tl * w], b = [p[0] + tx / tl * w, p[1] + ty / tl * w];
    s += `<path d="M${f(a[0])} ${f(a[1])}Q${f(lerp(a[0], e[0], .6) + tx / tl * w * .2)} ${f(lerp(a[1], e[1], .6) + ty / tl * w * .2)} ${f(e[0])} ${f(e[1])}Q${f(lerp(b[0], e[0], .4))} ${f(lerp(b[1], e[1], .4))} ${f(b[0])} ${f(b[1])}Z" fill="${col}" stroke="${lo}" stroke-width="${f(r * .02)}"/>`; }
  s += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${col}"/><g clip-path="url(#${cid})">`;
  // the mass in light and shade: a soft lit side towards the light, the far side darker
  { const g = nid('hl', u), R0 = Math.max(x1 - x0, y1 - y0) * .6;
    s += `<defs>${linGrad(g, cx + Lg[0] * R0, cy + Lg[1] * R0, cx - Lg[0] * R0, cy - Lg[1] * R0, [[0, hi, .35], [.45, col, 0], [1, lo, .55]])}</defs><path d="${d}" fill="url(#${g})"/>`; }
  if (o.sheen) { const g = nid('hs', u); s += `<defs>${radGrad(g, o.sheen[0], o.sheen[1], r * .55, [[0, hi, .45], [.6, hi, .15], [1, hi, 0]])}</defs><circle cx="${f(o.sheen[0])}" cy="${f(o.sheen[1])}" r="${f(r * .55)}" fill="url(#${g})"/>`; }
  // strands: short curved strokes along the flow, dark between the locks and light on them
  const n = o.n || 30;
  for (let k = 0; k < n; k++) {
    const p = [x0 + R() * (x1 - x0), y0 + R() * (y1 - y0)], fl = o.flow ? o.flow(p) : [0, 1], fn = Math.hypot(fl[0], fl[1]) || 1, fx = fl[0] / fn, fy = fl[1] / fn;
    const len = r * (.18 + R() * .3), bend = (R() - .5) * len * (o.curl ? 1.1 : .35), e = [p[0] + fx * len, p[1] + fy * len], m = [p[0] + fx * len / 2 - fy * bend, p[1] + fy * len / 2 + fx * bend];
    const near = o.sheen ? Math.hypot(p[0] - o.sheen[0], p[1] - o.sheen[1]) < r * .6 : false, light = R() < (near ? .65 : .3);
    s += `<path d="M${f(p[0])} ${f(p[1])}Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}" stroke="${light ? hi : lo}" stroke-width="${f(r * (light ? .022 : .032))}" fill="none" stroke-linecap="round" opacity="${light ? .55 : .5}"/>`;
  }
  s += `</g><path d="${d}" fill="none" stroke="${lo}" stroke-width="${f(r * .025)}" opacity=".9"/>`;
  return s;
}

// ——— a head in profile ———
// o: { c, r, dir (1 — facing right, −1 — left), tilt (deg, + nods the face down), tone (skin ramp), warm: { color,
// op } — the light on the cheek; rim: colour of the edge on the back of the head; mouth (0..1 open), eye: 'open' |
// 'wide' | 'half', look (deg: + down), brow ('calm' | 'up' | 'frown'), hairColor, beard, stubble, moustache, ear,
// lips colour; opacity;
// detail: true — the finer face (off by default, so the scenes drawn before it keep their look): the upper lid as a
// fold of skin with its crease, the lower lid's wet edge, a tapered brow of hair, the bridge and the ball of the nose
// lit, the nose wing as a form, shaped lips (the upper darker, the lower with a highlight and a shadow under it), the
// hollow under the cheekbone, the temple, the jaw's shade, the ear's rim and lobe; with detail, `beard` ('full' |
// 'short' | 'goatee' | true) and `moustache` are masses of hair with locks;
// hair: { color, style: 'short' | 'long' | 'tied' (a sailor's queue with a ribbon) | 'curly', ribbon } — the hair as
// a mass (strands, a sheen on the light side, locks at the edge); hairLight: [x, y] picture direction to the light
// for the sheen (default up and in front of the face) }
function head(u, o) {
  const r = o.r, dir = o.dir || 1, tl = (o.tilt || 0) * Math.PI / 180 * dir, ct = Math.cos(tl), st = Math.sin(tl);
  const Q = (a, b) => { const x = a * dir * r, y = b * r; return [o.c[0] + x * ct - y * st, o.c[1] + x * st + y * ct]; };
  const tn = o.tone, mo = o.mouth || 0, hairC = o.hairColor || '#1c120c', lips = o.lips || mix(tn.shadow, '#b04a40', .5);
  const jaw = mo * .16;
  // the outline: back of the skull, the crown, the forehead, the brow, the nose, the lips, the chin, the jaw, the nape
  const face = [[-.98, .14], [-1, -.32], [-.74, -.8], [-.2, -1.04], [.38, -.98], [.76, -.66], [.9, -.36], [.94, -.22], [.88, -.12],
    [.98, .02], [1.12, .16], [1.2, .26], [1.08, .31], [1.0, .33], [1.0, .4], [1.05, .46],
    ...(mo > .05 ? [[.96, .5], [.88, .52], [.96, .55 + jaw * .6], [1.02, .58 + jaw]] : [[1.0, .5], [1.04, .55]]),
    [.97, .63 + jaw], [.99, .72 + jaw], [.95, .84 + jaw], [.8, .93 + jaw * .7], [.45, .9 + jaw * .4], [.12, .74], [-.1, .56], [-.56, .5]];
  const F = face.map(p => Q(p[0], p[1]));
  const gid = nid('hg', u), cid = nid('hc', u), wid = nid('hw', u);
  const a0 = Q(-1, -.2), a1 = Q(1, .1);
  let s = `<defs>${linGrad(gid, a0[0], a0[1], a1[0], a1[1], o.faceLit === false ? [[0, tn.half], [.6, tn.core || tn.half], [1, tn.shadow]] : [[0, tn.shadow], [.45, tn.core || tn.half], [.8, tn.half], [1, tn.lit]])}<clipPath id="${cid}"><path d="${sp(F, true)}"/></clipPath>`;
  if (o.warm) { const w = Q(.62, .22); s += radGrad(wid, w[0], w[1], r * .75, [[0, o.warm.color, o.warm.op || .7], [.6, o.warm.color, (o.warm.op || .7) * .35], [1, o.warm.color, 0]]); }
  s += '</defs>';
  s += `<path d="${sp(F, true)}" fill="url(#${gid})"/>`;
  s += `<g clip-path="url(#${cid})">`;
  if (o.warm) s += `<rect x="${f(o.c[0] - 2 * r)}" y="${f(o.c[1] - 2 * r)}" width="${f(4 * r)}" height="${f(4 * r)}" fill="url(#${wid})"/>`;
  // the eye socket in shade under the brow, the cheekbone, the line from the nose wing to the mouth
  { const e = Q(.62, -.08); s += `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${f(r * .24)}" ry="${f(r * .14)}" fill="${tn.shadow}" opacity="${o.detail ? '.22' : '.45'}"/>`; }
  s += `<path d="${sp([Q(.36, .16), Q(.6, .24), Q(.8, .2)])}" stroke="${tn.lit}" stroke-width="${f(r * .09)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
  s += `<path d="${sp([Q(.98, .27), Q(.88, .36), Q(.9, .48)])}" stroke="${tn.shadow}" stroke-width="${f(r * .05)}" fill="none" opacity=".7"/>`;
  if (o.detail) {
    // the temple, the hollow under the cheekbone, the jaw turning away, the chin and the cheekbone catching light
    const soft = (c, rx, ry, col, op, rot = 0) => { const g = nid('hd', u); return `<defs>${radGrad(g, 0, 0, 1, [[0, col, op], [1, col, 0]])}</defs><ellipse cx="0" cy="0" rx="1" ry="1" fill="url(#${g})" transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(rot * dir + (o.tilt || 0) * dir)}) scale(${f(rx * r)} ${f(ry * r)})"/>`; };
    s += soft(Q(.36, -.22), .2, .26, tn.shadow, .35) + soft(Q(.5, .4), .3, .1, tn.shadow, .55, -12) + soft(Q(.4, .78), .42, .12, tn.shadow, .45, -20)
      + soft(Q(.86, .82), .1, .07, tn.lit, .5) + soft(Q(.56, .18), .2, .07, tn.lit, .45, -8);
    s += `<path d="${sp([Q(.92, -.06), Q(1.02, .06), Q(1.14, .2)])}" stroke="${tn.lit}" stroke-width="${f(r * .05)}" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  if ((o.stubble || o.beard) && !(o.detail && o.beard)) s += `<path d="${sp([Q(.2, .5), Q(.6, .56), Q(.96, .64), Q(.95, .84 + jaw), Q(.8, .93 + jaw * .7), Q(.45, .9 + jaw * .4), Q(.12, .74)], true)}" fill="${hairC}" opacity="${o.beard ? .95 : .3}"/>`;
  s += '</g>';
  // the profile line lit by the light in front of the face (or the back of the head by a rim)
  if (o.faceLit !== false) s += `<path d="${sp(face.slice(4, 20).map(p => Q(p[0], p[1])))}" stroke="${o.edge || tn.lit}" stroke-width="${f(Math.max(.3, r * .07))}" fill="none" opacity=".8"/>`;
  if (o.rim) s += `<path d="${sp([Q(-.98, .14), Q(-1, -.32), Q(-.74, -.8), Q(-.2, -1.04)])}" stroke="${o.rim}" stroke-width="${f(Math.max(.3, r * .08))}" fill="none" opacity=".75"/>`;
  s += `<path d="${sp(F, true)}" fill="none" stroke="${tn.outline}" stroke-width="${f(Math.max(.3, r * .06))}"/>`;
  // the nose: the wing and the nostril
  s += `<path d="${sp([Q(.96, .12), Q(.9, .2), Q(.94, .28), Q(1.04, .3)])}" stroke="${tn.outline}" stroke-width="${f(r * .045)}" fill="none" opacity=".8"/>`;
  { const n = Q(1.02, .28); s += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(r * .06)}" ry="${f(r * .03)}" fill="${tn.outline}" opacity=".7"/>`; }
  if (o.detail) {
    // the nose wing as a small form: lit on top, a shadow tucked under it; the ball of the nose with a highlight
    s += `<path d="${sp([Q(.95, .14), Q(1.04, .15), Q(1.08, .24), Q(1.02, .3), Q(.94, .28), Q(.92, .2)], true)}" fill="${tn.half}" opacity=".55"/>`
      + `<path d="${sp([Q(.93, .27), Q(1.0, .31), Q(1.06, .3)])}" stroke="${tn.shadow}" stroke-width="${f(r * .05)}" fill="none" opacity=".75"/>`
      + `<path d="${sp([Q(.96, .15), Q(1.03, .16), Q(1.07, .22)])}" stroke="${tn.lit}" stroke-width="${f(r * .03)}" fill="none" opacity=".6"/>`;
    { const g = Q(1.13, .19); s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(r * .028)}" fill="#ffffff" opacity=".45"/>`; }
  }
  // the mouth: shut (a line and the lips' colour) or open in the song (a dark gap, the teeth's edge)
  if (mo > .05) {
    s += `<path d="${sp([Q(1.04, .47), Q(.95, .5), Q(.86, .52), Q(.95, .54 + jaw * .6), Q(1.0, .57 + jaw)], true)}" fill="#2a0a0c" stroke="${tn.outline}" stroke-width="${f(r * .03)}"/>`;
    s += `<path d="${sp([Q(1.02, .48), Q(.95, .505)])}" stroke="#f0e6dc" stroke-width="${f(r * .035)}" fill="none" opacity=".8"/>`;
    s += `<path d="${sp([Q(1.05, .44), Q(1.0, .47), Q(.9, .5)])}" stroke="${lips}" stroke-width="${f(r * .06)}" fill="none" opacity=".8"/>`;
    s += `<path d="${sp([Q(.95, .57 + jaw * .8), Q(1.02, .6 + jaw)])}" stroke="${lips}" stroke-width="${f(r * .07)}" fill="none" opacity=".8"/>`;
  } else {
    s += `<path d="${sp([Q(1.03, .5), Q(.94, .51), Q(.86, .5)])}" stroke="${mix(tn.outline, lips, .3)}" stroke-width="${f(r * .05)}" fill="none"/>`;
    s += `<path d="${sp([Q(1.05, .46), Q(1.0, .49)])}" stroke="${lips}" stroke-width="${f(r * .06)}" fill="none" opacity=".6"/>`;
    if (o.detail) s += `<path d="${sp([Q(1.06, .44), Q(1.0, .47), Q(.92, .5), Q(.98, .505), Q(1.04, .5)], true)}" fill="${mix(lips, tn.shadow, .25)}" opacity=".8"/>`
      + `<path d="${sp([Q(1.04, .51), Q(.96, .52), Q(.98, .56), Q(1.04, .565)], true)}" fill="${lips}" opacity=".7"/>`
      + `<path d="${sp([Q(1.03, .53), Q(1.045, .55)])}" stroke="${mix(lips, '#ffffff', .5)}" stroke-width="${f(r * .025)}" fill="none" opacity=".7" stroke-linecap="round"/>`
      + `<path d="${sp([Q(.99, .59), Q(.95, .61)])}" stroke="${tn.shadow}" stroke-width="${f(r * .05)}" fill="none" opacity=".6" stroke-linecap="round"/>`
      + `<path d="${sp([Q(.87, .49), Q(.85, .52)])}" stroke="${tn.shadow}" stroke-width="${f(r * .03)}" fill="none" opacity=".7"/>`;
  }
  if (o.moustache && !o.detail) s += `<path d="${sp([Q(1.05, .4), Q(.92, .44), Q(.78, .5), Q(.7, .58)])}" stroke="${hairC}" stroke-width="${f(r * .12)}" fill="none" stroke-linecap="round"/>`;
  // the eye: the white wedge seen from the side, the iris forward, the upper lid heavy with lashes, the lower lid
  { const look = (o.look || 0) * .004, ey = o.eye || 'open', op = ey === 'wide' ? 1.25 : ey === 'half' ? .55 : 1;
    const top = -.16 - .05 * op, bot = -.07 + .02 * op;
    s += `<path d="${sp([Q(.56, -.11), Q(.66, top + .01), Q(.79, -.13), Q(.68, bot)], true)}" fill="${o.white || '#efe6da'}" opacity=".95"/>`;
    const ir = Q(.74, -.115 + look * 10); s += `<ellipse cx="${f(ir[0])}" cy="${f(ir[1])}" rx="${f(r * .045)}" ry="${f(r * .065 * Math.min(1, op))}" fill="${o.iris || '#2a1a10'}"/>`;
    { const g = Q(.755, -.135); s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(r * .018)}" fill="#ffffff" opacity=".9"/>`; }
    s += `<path d="${sp([Q(.54, -.12), Q(.64, top - .01), Q(.8, -.14)])}" stroke="#1a0c08" stroke-width="${f(r * .06)}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${f(Q(.8, -.14)[0])} ${f(Q(.8, -.14)[1])}L${f(Q(.86, -.17)[0])} ${f(Q(.86, -.17)[1])}" stroke="#1a0c08" stroke-width="${f(r * .035)}" stroke-linecap="round"/>`;
    s += `<path d="${sp([Q(.6, -.07), Q(.7, bot + .005), Q(.78, -.11)])}" stroke="${tn.shadow}" stroke-width="${f(r * .03)}" fill="none" opacity=".8"/>`;
    if (o.detail) {
      // the upper lid as a fold of skin over the eye, its crease, the shadow it casts on the white; the lower lid's
      // wet lit edge; the inner corner
      s += `<path d="${sp([Q(.53, -.12), Q(.62, top - .045), Q(.76, top - .02), Q(.84, -.155), Q(.79, -.14), Q(.66, top - .005), Q(.56, -.115)], true)}" fill="${tn.half}" opacity=".9"/>`
        + `<path d="${sp([Q(.54, -.15), Q(.63, top - .07), Q(.77, top - .05)])}" stroke="${tn.shadow}" stroke-width="${f(r * .03)}" fill="none" opacity=".85"/>`
        + `<path d="${sp([Q(.58, -.12), Q(.66, top + .02), Q(.78, -.13)])}" stroke="${tn.shadow}" stroke-width="${f(r * .04)}" fill="none" opacity=".35"/>`
        + `<path d="${sp([Q(.6, -.065), Q(.7, bot + .015), Q(.78, -.105)])}" stroke="${tn.lit}" stroke-width="${f(r * .022)}" fill="none" opacity=".7"/>`
        + `<path d="${sp([Q(.62, -.04), Q(.7, bot + .05), Q(.77, -.08)])}" stroke="${tn.shadow}" stroke-width="${f(r * .02)}" fill="none" opacity=".45"/>`;
    } }
  // the brow
  { const b = o.brow || 'calm', dy = b === 'up' ? -.07 : 0, fr = b === 'frown' ? .06 : 0;
    if (!o.detail) s += `<path d="${sp([Q(.46, -.3 + dy), Q(.66, -.36 + dy - fr * .3), Q(.86, -.3 + dy + fr)])}" stroke="${hairC}" stroke-width="${f(r * .1)}" fill="none" stroke-linecap="round"/>`;
    else { // a tapered mass, thick at the inner end, the hairs combed outwards
      const B = [[.46, -.29 + dy], [.6, -.36 + dy - fr * .3], [.76, -.36 + dy - fr * .1], [.9, -.3 + dy + fr], [.88, -.25 + dy + fr], [.74, -.29 + dy], [.58, -.29 + dy], [.47, -.255 + dy]];
      s += `<path d="${sp(B.map(p => Q(p[0], p[1])), true)}" fill="${hairC}"/>`;
      for (let k = 0; k < 7; k++) { const t = .1 + k * .12, a = Q(lerp(.5, .86, t) - .03, lerp(-.27, -.31, t) + dy + fr * t * .8), b = Q(lerp(.5, .86, t) + .05, lerp(-.33, -.34, t) + dy - fr * .2 + fr * t);
        s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${mix(hairC, '#d8c0a0', .35)}" stroke-width="${f(r * .014)}" opacity=".7"/>`; }
    } }
  // the ear
  if (o.ear !== false) { const E = [[-.06, -.16], [.1, -.12], [.14, .06], [.06, .26], [-.06, .34], [-.16, .26], [-.18, .02]].map(p => Q(p[0], p[1]));
    s += `<path d="${sp(E, true)}" fill="${tn.half}" stroke="${tn.outline}" stroke-width="${f(r * .04)}"/><path d="${sp([Q(.04, -.06), Q(.07, .08), Q(0, .2), Q(-.08, .18)])}" stroke="${tn.shadow}" stroke-width="${f(r * .04)}" fill="none"/>`;
    if (o.detail) s += `<path d="${sp([Q(-.04, -.12), Q(.08, -.09), Q(.11, .05), Q(.04, .22)])}" stroke="${tn.lit}" stroke-width="${f(r * .03)}" fill="none" opacity=".6"/>`
      + `<path d="${sp([Q(-.02, .02), Q(.03, .1), Q(-.03, .16)], true)}" fill="${tn.shadow}" opacity=".55"/>`
      + `<ellipse cx="${f(Q(-.07, .29)[0])}" cy="${f(Q(-.07, .29)[1])}" rx="${f(r * .05)}" ry="${f(r * .04)}" fill="${mix(tn.half, '#c05040', .2)}" opacity=".6"/>`; }
  const HL = o.hairLight || [dir * .5, -.86];
  if (o.detail && o.beard) {
    const j = p => [p[0], p[1] + (p[1] > .5 ? jaw : 0)];
    const BD = { full: [[.2, -.08], [.27, .28], [.5, .37], [.74, .42], [.9, .5], [.97, .6], [1.06, .72], [1.07, .92], [.98, 1.08], [.78, 1.15], [.5, 1.05], [.24, .87], [.04, .66], [-.06, .42], [.04, .12], [.1, -.12]],
      short: [[.2, -.08], [.27, .3], [.5, .4], [.74, .44], [.9, .52], [.97, .6], [1.02, .74], [1.0, .92], [.9, 1.0], [.6, .97], [.3, .82], [.08, .62], [-.02, .4], [.06, .1], [.12, -.1]],
      goatee: [[.88, .58], [.98, .6], [1.04, .72], [1.04, .92], [.96, 1.04], [.84, 1.02], [.8, .86], [.84, .7]] };
    const kind = BD[o.beard] ? o.beard : 'full', pts = BD[kind].map(j).map(p => Q(p[0], p[1]));
    s += hairMass(u, pts, { r, color: hairC, outline: tn.outline, seed: 11, flow: () => [dir * .22 * Math.cos(tl) - Math.sin(tl) * .2, 1], sheen: Q(.62, .62), light: HL,
      tufts: kind === 'goatee' ? [3, 4, 5] : kind === 'full' ? [7, 8, 9, 10, 11, 12] : [8, 9], tuftLen: kind === 'full' ? .11 : .06, n: kind === 'goatee' ? 12 : 34 });
  }
  if (o.detail && (o.moustache || o.beard)) {
    const M = [[1.07, .37], [.98, .35], [.86, .4], [.76, .5], [.72, .6], [.8, .56], [.9, .5], [1.0, .47], [1.08, .44]].map(p => Q(p[0], p[1]));
    s += hairMass(u, M, { r, color: hairC, outline: tn.outline, seed: 3, flow: () => [-dir * .7, .7], n: 10, light: HL, sheen: Q(.96, .4), tufts: [4], tuftLen: .06 });
  }
  if (o.hair) {
    const hs = o.hair.style || 'short', hc = o.hair.color || hairC;
    const front = [[.62, -.72], [.7, -.88]], top = [[.44, -1.1], [-.1, -1.17], [-.62, -1.02], [-.99, -.68], [-1.11, -.22]];
    const sideShort = [[-1.07, .18], [-.92, .44], [-.68, .54], [-.52, .4], [-.36, .22], [-.24, -.06], [-.1, -.22], [.1, -.24], [.2, -.12], [.23, .1], [.3, .04], [.32, -.3], [.44, -.54]];
    const sideLong = [[-1.13, .4], [-1.1, .95], [-1.02, 1.45], [-.8, 1.62], [-.62, 1.4], [-.5, 1.0], [-.32, .66], [-.1, .44], [.12, .3], [.24, .08], [.3, -.3], [.44, -.54]];
    const H0 = (hs === 'long' ? front.concat(top, sideLong) : front.concat(top, sideShort)).map(p => Q(p[0], p[1]));
    const crown = Q(.66, -.86);
    if (hs === 'tied') {
      // the queue: from the nape down the back, bound with a ribbon tied in a bow
      const T = [[-.78, .3], [-.62, .42], [-.66, .9], [-.74, 1.4], [-.82, 1.52], [-.9, 1.36], [-.9, .9], [-.92, .44]].map(p => Q(p[0], p[1]));
      s += hairMass(u, T, { r, color: hc, outline: tn.outline, seed: 21, flow: () => [-Math.sin(tl) * .1, 1], n: 10, light: HL, tufts: [4], tuftLen: .12 });
      const rb = o.hair.ribbon || '#1a1a22', b = Q(-.78, .58), b1 = Q(-.56, .48), b2 = Q(-.62, .74), b3 = Q(-1.0, .5), b4 = Q(-.98, .76);
      s += `<path d="M${f(b[0])} ${f(b[1])}L${f(b1[0])} ${f(b1[1])}L${f(b2[0])} ${f(b2[1])}ZM${f(b[0])} ${f(b[1])}L${f(b3[0])} ${f(b3[1])}L${f(b4[0])} ${f(b4[1])}Z" fill="${rb}" stroke="${tn.outline}" stroke-width="${f(r * .025)}"/>`
        + `<ellipse cx="${f(b[0])}" cy="${f(b[1])}" rx="${f(r * .07)}" ry="${f(r * .09)}" fill="${rb}" stroke="${tn.outline}" stroke-width="${f(r * .025)}"/>`;
    }
    const tufts = hs === 'curly' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : hs === 'long' ? [8, 9, 10, 11] : [5, 6, 7, 8, 9];
    s += hairMass(u, H0, { r, color: hc, outline: tn.outline, seed: 7, n: hs === 'curly' ? 50 : 42, light: HL, sheen: Q(.1, -.9), curl: hs === 'curly',
      flow: p => { const dx = p[0] - crown[0], dy = p[1] - crown[1], l = Math.hypot(dx, dy) || 1, dn = hs === 'long' ? Math.max(0, (p[1] - o.c[1]) / r) : 0; const v = [dx / l * (1 - dn) , dy / l * (1 - dn) + dn]; return v; },
      tufts, tuftLen: hs === 'curly' ? .07 : .08 });
  }
  if (o.opacity != null && o.opacity < 1) s = `<g opacity="${o.opacity}">${s}</g>`;
  return { svg: s, Q };
}

// ——— a head in three-quarter view ———
// A head turned from full face towards a profile, built on a small 3D model (a skull, the jaw, the eyes, the nose, the
// mouth, the ears) turned and projected, so the far eye narrows, the nose covers the far cheek and the near ear shows.
// o: { c, r, turn (0 full face … 1 almost profile; default .45), dir (+1 the face turned to the frame's right), nod
// (deg, + looks down), tone (skin ramp), light: [x, y] picture direction to the light (default up-left), warm:
// { color, op } — the light on the near cheek, rim (colour of the edge away from the light), eye: 'open' | 'wide' |
// 'half' | 'shut', look: [dx, dy] (−1..1), brow: 'calm' | 'up' | 'frown' | 'sly' (one up), mouth (0..1 open), smile
// (−1..1: + the corners up, a grin), lips, iris, hairColor, hair: { color, style: 'short' | 'long' | 'tied' |
// 'curly' | 'bald' }, beard: 'full' | 'short' | 'goatee', moustache, ear: false, opacity }
// Returns { svg, Q (x, y, z in head units → picture), depth (→ + towards us) }.
function head34(u, o) {
  const r = o.r, dir = o.dir || 1, yaw = (o.turn != null ? o.turn : .45) * 62 * Math.PI / 180 * dir, nod = (o.nod || 0) * Math.PI / 180;
  const cY = Math.cos(yaw), sY = Math.sin(yaw), cN = Math.cos(nod), sN = Math.sin(nod);
  const rot = p => { const x = p[0] * cY + p[2] * sY, z = -p[0] * sY + p[2] * cY; return [x, p[1] * cN + z * sN, -p[1] * sN + z * cN]; };
  const Q = (x, y, z) => { const q = rot([x, y, z]); return [o.c[0] + q[0] * r, o.c[1] + q[1] * r]; }, depth = (x, y, z) => rot([x, y, z])[2];
  const Qa = a => a.map(p => Q(p[0], p[1], p[2]));
  const tn = o.tone, hairC = o.hairColor || (o.hair && o.hair.color) || '#1c120c', lips = o.lips || mix(tn.shadow, '#b04a40', .5);
  const Ls = o.light || [-.5, -.86], mo = o.mouth || 0, sm = o.smile || 0, jw = mo * .14;
  const soft = (c, rx, ry, col, op, rotd = 0) => { const g = nid('h3s', u); return `<defs>${radGrad(g, 0, 0, 1, [[0, col, op], [1, col, 0]])}</defs><ellipse cx="0" cy="0" rx="1" ry="1" fill="url(#${g})" transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(rotd)}) scale(${f(Math.max(.01, rx * r))} ${f(Math.max(.01, ry * r))})"/>`; };
  const P2 = p => `${f(p[0])} ${f(p[1])}`;
  // ——— the outline: the skull's circle (its upper part) and the jaw, cheekbones and chin, as one convex body ———
  // the skull: an ellipsoid (narrower than deep), its outline a turned ellipse
  const sc0 = Q(0, -.2, -.1), RX = Math.hypot(.8 * cY, .96 * sY) * r, RY = .98 * r, R0 = Math.max(RX, RY), pts = [];
  const sk = (a, k = 1) => [sc0[0] + Math.cos(a) * RX * k, sc0[1] + Math.sin(a) * RY * k];
  for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2, p = sk(a); if (p[1] - sc0[1] < .32 * r) pts.push(p); }
  const jawP = [[-.64, .5, -.14], [.64, .5, -.14], [-.48, .82, .26], [.48, .82, .26], [-.22, .99 + jw, .55], [.22, .99 + jw, .55], [0, 1.03 + jw, .62],
    [-.68, .08, .4], [.68, .08, .4], [-.58, .5, .34], [.58, .5, .34], [-.78, .1, -.05], [.78, .1, -.05]];
  pts.push(...Qa(jawP));
  const hull = (() => { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
    const lo = [], up = []; for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of P.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); })();
  const F = sp(hull, true), gid = nid('h3g', u), cid = nid('h3c', u);
  let s = `<defs>${linGrad(gid, o.c[0] + Ls[0] * r, o.c[1] + Ls[1] * r, o.c[0] - Ls[0] * r, o.c[1] - Ls[1] * r, [[0, tn.lit], [.35, tn.half], [.75, tn.core || tn.half], [1, tn.shadow]])}<clipPath id="${cid}"><path d="${F}"/></clipPath></defs>`;
  s += `<path d="${F}" fill="url(#${gid})"/><g clip-path="url(#${cid})">`;
  if (o.warm) { const w = Q(dir * .4, .2, .7), g = nid('h3w', u); s += `<defs>${radGrad(g, w[0], w[1], r * .8, [[0, o.warm.color, o.warm.op || .6], [1, o.warm.color, 0]])}</defs><circle cx="${f(w[0])}" cy="${f(w[1])}" r="${f(r * .8)}" fill="url(#${g})"/>`; }
  // the side of the face turned away from us (behind the cheekbone line) in shade; the hollows under the cheekbones,
  // the temples, the eye sockets, the jaw's underside; the cheekbone and the chin catching the light
  { const far = Q(-dir * .62, .25, .2); s += soft(far, .45, .7, tn.shadow, .4 * Math.min(1, Math.abs(sY) * 2)); }
  for (const sd of [-1, 1]) { const v = Math.max(.2, depth(sd * .5, 0, .85) * 1.1);
    s += soft(Q(sd * .56, .44, .45), .2 * v, .1, tn.shadow, .45) + soft(Q(sd * .66, -.3, .45), .16 * v, .2, tn.shadow, .3)
      + soft(Q(sd * .34, -.1, .82), .2 * v, .12, tn.shadow, .4); }
  s += soft(Q(0, .98 + jw, .5), .5, .12, tn.shadow, .4) + soft(Q(0, .86 + jw, .66), .14, .07, tn.lit, .45);
  { const sd = (Q(.6, .14, .5)[0] - Q(-.6, .14, .5)[0]) * Ls[0] > 0 ? 1 : -1; s += soft(Q(sd * .56, .16, .58), .18, .07, tn.lit, .5); }
  if (o.stubble) s += `<path d="${sp(Qa([[-.8, .2, .2], [-.6, .5, .4], [-.3, .66, .78], [0, .74, .92], [.3, .66, .78], [.6, .5, .4], [.8, .2, .2], [.74, .55, -.05], [.5, .88, .32], [0, 1.05 + jw, .62], [-.5, .88, .32], [-.74, .55, -.05]]), true)}" fill="${hairC}" opacity=".22"/>`;
  s += '</g>';
  if (o.rim) { const H2 = hull.filter(p => (p[0] - o.c[0]) * Ls[0] + (p[1] - o.c[1]) * Ls[1] < -.2 * r); if (H2.length > 2) s += `<path d="${sp(H2)}" stroke="${o.rim}" stroke-width="${f(Math.max(.3, r * .07))}" fill="none" opacity=".7"/>`; }
  s += `<path d="${F}" fill="none" stroke="${tn.outline}" stroke-width="${f(Math.max(.3, r * .05))}"/>`;
  // ——— the near ear (on the side away from the turn) ———
  if (o.ear !== false) { const sd = -dir, v = depth(sd, 0, -.15); if (v > .12) {
    const e = [[sd * .78, -.12, -.06], [sd * .86, -.05, -.16], [sd * .88, .14, -.2], [sd * .83, .3, -.14], [sd * .78, .34, -.06], [sd * .75, .12, -.02]];
    s += `<path d="${sp(Qa(e), true)}" fill="${tn.half}" stroke="${tn.outline}" stroke-width="${f(r * .035)}"/>`
      + `<path d="${sp(Qa([[sd * .8, -.06, -.12], [sd * .84, .12, -.16], [sd * .8, .26, -.1]]))}" stroke="${tn.shadow}" stroke-width="${f(r * .04)}" fill="none"/>`
      + `<path d="${sp(Qa([[sd * .81, -.1, -.12], [sd * .87, .04, -.18], [sd * .86, .2, -.18]]))}" stroke="${tn.lit}" stroke-width="${f(r * .025)}" fill="none" opacity=".6"/>`; } }
  // ——— the eyes ———
  const ey = o.eye || 'open', op = ey === 'wide' ? 1.3 : ey === 'half' ? .55 : ey === 'shut' ? 0 : 1, lk = o.look || [0, 0];
  for (const sd of [-1, 1]) {
    const C3 = [sd * .34, -.06, .8], vis = Math.max(0, depth(sd * .45, 0, .9) / Math.hypot(.45, .9));
    if (vis < .08) continue;
    const c = Q(...C3), ex0 = rot([1, 0, 0]), el = Math.hypot(ex0[0], ex0[1]) || 1, ex = [ex0[0] / el, ex0[1] / el], up = [ex[1], -ex[0]];
    const w = .14 * r * (.3 + .7 * vis), h = .055 * r * op, at = (a, b) => [c[0] + ex[0] * a + up[0] * b, c[1] + ex[1] * a + up[1] * b];
    const inn = at(-sd * w, 0), out = at(sd * w, -.01 * r), top = at(sd * w * .1, h * 1.15), bot = at(sd * w * .05, -h * .75);
    const alm = `M${P2(inn)}Q${P2(at(-sd * w * .5, h * 1.3))} ${P2(top)}Q${P2(at(sd * w * .7, h * .9))} ${P2(out)}Q${P2(at(sd * w * .5, -h * .9))} ${P2(bot)}Q${P2(at(-sd * w * .6, -h * .6))} ${P2(inn)}Z`;
    s += soft(at(0, .02 * r), .17 * (.4 + .6 * vis), .1, tn.shadow, .45);
    if (op > 0) { const ic = nid('h3e', u), ir = at(lk[0] * w * .45 + sd * w * .05 * (1 - vis), -lk[1] * h * .4);
      s += `<defs><clipPath id="${ic}"><path d="${alm}"/></clipPath></defs><path d="${alm}" fill="${o.white || '#efe6da'}"/>`
        + `<g clip-path="url(#${ic})"><circle cx="${f(ir[0])}" cy="${f(ir[1])}" r="${f(r * .058)}" fill="${o.iris || '#4a2c18'}"/><circle cx="${f(ir[0])}" cy="${f(ir[1])}" r="${f(r * .028)}" fill="#0c0604"/>`
        + `<path d="M${P2(inn)}Q${P2(top)} ${P2(out)}" stroke="${tn.shadow}" stroke-width="${f(r * .05)}" fill="none" opacity=".45"/></g>`;
      const g = [ir[0] + Ls[0] * r * .022, ir[1] + Ls[1] * r * .022]; s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(r * .016)}" fill="#ffffff" opacity=".95"/>`; }
    // the upper lid line with lashes, the lid fold and its crease, the lower lid's lit edge
    s += `<path d="M${P2(inn)}Q${P2(at(-sd * w * .5, h * 1.3))} ${P2(top)}Q${P2(at(sd * w * .7, h * .9))} ${P2(out)}" stroke="#1a0c08" stroke-width="${f(r * .035)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${P2(out)}l${f(ex[0] * sd * r * .035 + up[0] * r * .015)} ${f(ex[1] * sd * r * .035 + up[1] * r * .015)}" stroke="#1a0c08" stroke-width="${f(r * .022)}" stroke-linecap="round"/>`
      + `<path d="M${P2(at(-sd * w * .8, h * .9 + .02 * r))}Q${P2(at(0, h * 1.5 + .04 * r))} ${P2(at(sd * w * 1.05, h * .5 + .015 * r))}" stroke="${tn.shadow}" stroke-width="${f(r * .022)}" fill="none" opacity=".8"/>`
      + `<path d="M${P2(at(-sd * w * .6, -h * .75))}Q${P2(at(sd * w * .1, -h * 1.05))} ${P2(at(sd * w * .85, -h * .45))}" stroke="${tn.lit}" stroke-width="${f(r * .018)}" fill="none" opacity=".65"/>`;
    // the brow: a tapered mass over the eye, thick at the nose end
    { const b = o.brow || 'calm', dy = (b === 'up' || (b === 'sly' && sd === dir)) ? -.07 : 0, fr = b === 'frown' ? .05 : 0;
      const B = [[sd * .1, -.25 + fr, .92], [sd * .3, -.33 + dy, .88], [sd * .52, -.31 + dy, .76], [sd * .6, -.25 + dy, .68], [sd * .5, -.27 + dy, .76], [sd * .3, -.28 + dy, .88], [sd * .12, -.21 + fr, .92]];
      s += `<path d="${sp(Qa(B), true)}" fill="${hairC}" stroke="${mix(hairC, '#000', .4)}" stroke-width="${f(r * .01)}"/>`; }
  }
  // ——— the nose: the side away from the light in shade, the lit bridge, the ball with a highlight, the wings ———
  { const N0 = [0, -.1, .93], T = [0, .33, 1.13], Bs = [0, .42, 1.0], Wl = [-.16, .35, .92], Wr = [.16, .35, .92];
    const shadeSide = (Q(...Wr)[0] - Q(...T)[0]) * Ls[0] > 0 ? -1 : 1, Ws = shadeSide > 0 ? Wr : Wl, Wn = shadeSide > 0 ? Wl : Wr;
    s += `<path d="${sp(Qa([N0, [shadeSide * .08, .1, .98], [shadeSide * .1, .3, 1.02], Ws, [shadeSide * .08, .42, .96], Bs]), true)}" fill="${tn.shadow}" opacity=".45"/>`
      + soft(Q(shadeSide * .12, .48, .95), .16, .05, tn.shadow, .55);
    s += `<path d="${sp(Qa([[-shadeSide * .02, -.04, .95], [-shadeSide * .03, .14, 1.04], [-shadeSide * .02, .28, 1.11]]))}" stroke="${tn.lit}" stroke-width="${f(r * .04)}" fill="none" opacity=".65" stroke-linecap="round"/>`;
    // the nose's own edge (the ridge seen against the far cheek when turned)
    s += `<path d="${sp(Qa([N0, [0, .12, 1.03], T, [0, .38, 1.07], Bs]))}" stroke="${tn.outline}" stroke-width="${f(r * .03)}" fill="none" opacity="${f(Math.min(.8, Math.abs(sY) * 1.6))}"/>`;
    for (const W2 of [Wl, Wr]) { const v = depth(W2[0] * 2, 0, .7); if (v < -.1) continue;
      s += `<path d="${sp(Qa([[W2[0] * .7, .26, 1.0], [W2[0] * 1.05, .3, .93], [W2[0], .41, .92], [W2[0] * .5, .42, .98]]))}" stroke="${tn.outline}" stroke-width="${f(r * .03)}" fill="none" opacity=".75"/>`; }
    for (const sd of [-1, 1]) { const n = Q(sd * .07, .41, 1.0); s += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(r * .035 * (.5 + .5 * Math.max(0, depth(sd, 0, 1.5) / 1.8)))}" ry="${f(r * .018)}" fill="${mix(tn.outline, tn.shadow, .3)}" opacity=".85"/>`; }
    { const g = Q(-shadeSide * .03, .3, 1.12); s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(r * .03)}" fill="#ffffff" opacity=".5"/>`; void Wn; } }
  // ——— the mouth ———
  { const cy = .62 - sm * .05, ml = [-.25, cy, .8], mr = [.25, cy, .8], m0 = [0, .62, .97], gap = mo * .1;
    const upper = [ml, [-.12, .555, .94], [0, .57, .98], [.12, .555, .94], mr, [.12, .615, .95], m0, [-.12, .615, .95]];
    const lower = [ml, [-.12, .63 + gap, .95], [0, .635 + gap, .97], [.12, .63 + gap, .95], mr, [.13, .7 + gap, .9], [0, .72 + gap, .92], [-.13, .7 + gap, .9]];
    if (mo > .05) s += `<path d="${sp(Qa([ml, [-.12, .615, .95], m0, [.12, .615, .95], mr, [.12, .63 + gap, .95], [0, .635 + gap, .97], [-.12, .63 + gap, .95]]), true)}" fill="#2a0a0c"/>`
      + `<path d="${sp(Qa([[-.12, .625, .95], [0, .63, .975], [.12, .625, .95]]))}" stroke="#efe4d8" stroke-width="${f(r * .035)}" fill="none"/>`;
    s += `<path d="${sp(Qa(upper), true)}" fill="${mix(lips, tn.shadow, .3)}"/><path d="${sp(Qa(lower), true)}" fill="${lips}"/>`
      + `<path d="${sp(Qa([[-.06, .67 + gap, .95], [.06, .67 + gap, .95]]))}" stroke="${mix(lips, '#ffffff', .45)}" stroke-width="${f(r * .025)}" fill="none" stroke-linecap="round" opacity=".7"/>`
      + `<path d="${sp(Qa([ml, [-.12, .615, .95], m0, [.12, .615, .95], mr]))}" stroke="${mix(tn.outline, lips, .2)}" stroke-width="${f(r * .025)}" fill="none"/>`
      + soft(Q(0, .79 + gap, .88), .13, .04, tn.shadow, .55);
    for (const sd of [-1, 1]) { const a = Q(sd * .26, cy - .01, .78), b = Q(sd * .3, cy - .05 - sm * .03, .74); s += `<path d="M${P2(a)}L${P2(b)}" stroke="${tn.shadow}" stroke-width="${f(r * .02)}" opacity="${f(.4 + Math.max(0, sm) * .4)}" stroke-linecap="round"/>`; }
    if (sm > .2) for (const sd of [-1, 1]) s += `<path d="${sp(Qa([[sd * .2, .4, .88], [sd * .34, .52, .78], [sd * .36, .64, .72]]))}" stroke="${tn.shadow}" stroke-width="${f(r * .025)}" fill="none" opacity=".55"/>`;
    s += `<path d="${sp(Qa([[-.04, .46, .99], [-.03, .54, .98]]))}M${P2(Q(.04, .46, .99))}L${P2(Q(.03, .54, .98))}" stroke="${tn.shadow}" stroke-width="${f(r * .015)}" fill="none" opacity=".45"/>`; }
  // ——— beard, moustache, hair as masses ———
  const HL = Ls;
  if (o.beard) {
    const ext = o.beard === 'full' ? .16 : .04, kind = o.beard;
    const outer = kind === 'goatee' ? [[-.2, .72, .86], [-.24, .9, .66], [-.16, 1.08 + jw + ext, .58], [0, 1.12 + jw + ext, .6], [.16, 1.08 + jw + ext, .58], [.24, .9, .66], [.2, .72, .86]]
      : [[-.74, .2, .22], [-.7, .5, -.06], [-.52, .88 + ext * .5, .24], [-.28, 1.06 + jw + ext, .52], [0, 1.12 + jw + ext, .6], [.28, 1.06 + jw + ext, .52], [.52, .88 + ext * .5, .24], [.7, .5, -.06], [.74, .2, .22],
        [.68, .22, .4], [.56, .4, .56], [.34, .6, .78], [.24, .7, .82], [0, .76 + jw, .93], [-.24, .7, .82], [-.34, .6, .78], [-.56, .4, .56], [-.68, .22, .4]];
    const pts2 = Qa(outer).filter((p, i) => true);
    s += hairMass(u, pts2, { r, color: hairC, outline: tn.outline, seed: 13, n: kind === 'goatee' ? 12 : 40, light: HL, sheen: Q(dir * .3, .9, .6),
      flow: () => [0, 1], tufts: kind === 'goatee' ? [2, 3, 4] : [2, 3, 4, 5, 6], tuftLen: kind === 'full' ? .14 : .07 });
  }
  if (o.moustache || o.beard) {
    const M = [[0, .46, 1.0], [.18, .5, .92], [.32, .62, .76], [.3, .68, .74], [.18, .58, .9], [0, .55, .99], [-.18, .58, .9], [-.3, .68, .74], [-.32, .62, .76], [-.18, .5, .92]];
    s += hairMass(u, Qa(M), { r, color: hairC, outline: tn.outline, seed: 4, n: 12, light: HL, flow: p => [(p[0] - Q(0, .5, 1)[0]) > 0 ? .7 : -.7, .7], tufts: [3, 7], tuftLen: .05 });
  }
  if (o.hair && o.hair.style !== 'bald') {
    const hs = o.hair.style || 'short', hc = o.hair.color || hairC;
    // the outer edge: the skull's outline over the top between the two sides, a little proud of it (the hair's volume)
    const L3 = hs === 'long' ? [-.86, .5, -.14] : [-.8, .16, -.16], R3 = [-L3[0], L3[1], L3[2]], pl = Q(...L3), pr = Q(...R3), vol = 1.07;
    let a0 = Math.atan2(pl[1] - sc0[1], pl[0] - sc0[0]), a1 = Math.atan2(pr[1] - sc0[1], pr[0] - sc0[0]); while (a1 < a0) a1 += Math.PI * 2;
    const arc = []; for (let k = 0; k <= 16; k++) arc.push(sk(lerp(a0, a1, k / 16), vol));
    // the hairline: sideburn, temple, forehead (a little peak), the other side
    const line = Qa([[.74, .16, .2], [.72, -.34, .44], [.48, -.6, .7], [.18, -.68, .8], [0, -.64, .84], [-.18, -.68, .8], [-.48, -.6, .7], [-.72, -.34, .44], [-.74, .16, .2]]);
    let HP = arc.slice().reverse().concat(line.slice().reverse());   // right side over the top to left, back by the hairline
    HP = arc.concat(line);
    if (hs === 'long') HP = [Q(-1.02, 1.3, -.2), ...arc, Q(1.02, 1.3, -.2), Q(.84, 1.2, .1), ...line, Q(-.84, 1.2, .1)];
    const crown = Q(0, -.9, .2);
    s += hairMass(u, HP, { r, color: hc, outline: tn.outline, seed: 9, n: hs === 'curly' ? 60 : 48, light: HL, sheen: Q(-Ls[0] < 0 ? -.3 : .3, -.8, .5), curl: hs === 'curly',
      flow: p => { const dx = p[0] - crown[0], dy = p[1] - crown[1], l = Math.hypot(dx, dy) || 1; return hs === 'long' && p[1] > o.c[1] ? [dx / l * .3, 1] : [dx / l, dy / l]; },
      tufts: hs === 'curly' ? [2, 4, 6, 8, 10, 12, 14] : [1, 3, 15, 16], tuftLen: hs === 'curly' ? .1 : .08 });
    if (hs === 'tied') { // the queue hangs down the back, behind the head: drawn under it
      const rb = o.hair.ribbon || '#1a1a22', q0 = Q(0, .4, -.9), q1 = Q(0, 1.5, -.95), b = Q(0, .62, -.92);
      const qT = [[q0[0] - r * .1, q0[1]], [q0[0] + r * .1, q0[1]], [q1[0] + r * .05, q1[1]], [q1[0], q1[1] + r * .12], [q1[0] - r * .06, q1[1]]];
      const tail = hairMass(u, qT, { r, color: hc, outline: tn.outline, seed: 21, n: 8, light: HL, flow: () => [0, 1], tufts: [3], tuftLen: .1 })
        + `<path d="M${P2(b)}l${f(-r * .2)} ${f(-r * .1)}l0 ${f(r * .2)}zM${P2(b)}l${f(r * .18)} ${f(-r * .12)}l${f(r * .02)} ${f(r * .2)}z" fill="${rb}" stroke="${tn.outline}" stroke-width="${f(r * .02)}"/>`
        + `<ellipse cx="${f(b[0])}" cy="${f(b[1])}" rx="${f(r * .06)}" ry="${f(r * .08)}" fill="${rb}" stroke="${tn.outline}" stroke-width="${f(r * .02)}"/>`;
      s = tail + s; }
  }
  if (o.opacity != null && o.opacity < 1) s = `<g opacity="${o.opacity}">${s}</g>`;
  return { svg: s, Q, depth };
}

module.exports = { sp, tube, cloth, hand, hand3, head, head34, hairMass };
