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
  // roundA (optional, default false): the start cap as a dome (a rounded shoulder) instead of one point
  const outline = (i0 = 0, i1 = N, wk = 1, capA = false, capB = false, roundA = false) => {
    const l = edge(-1, i0, i1, wk), r = edge(1, i0, i1, wk).reverse(), P = [];
    if (capA && roundA) { const q = S[i0], h = q.w / 2 * wk, kc = typeof roundA === 'number' ? roundA : .9;
      for (let k = 1; k < 8; k++) { const ph = Math.PI * (1 - k / 8); P.push([q.p[0] - q.d[0] * Math.sin(ph) * h * kc - q.n[0] * Math.cos(ph) * h, q.p[1] - q.d[1] * Math.sin(ph) * h * kc - q.n[1] * Math.cos(ph) * h]); } }
    else if (capA) { const q = S[i0]; P.push([q.p[0] - q.d[0] * q.w * .42 * wk, q.p[1] - q.d[1] * q.w * .42 * wk]); }
    P.push(...l);
    if (capB) { const q = S[i1]; P.push([q.p[0] + q.d[0] * q.w * .42 * wk, q.p[1] + q.d[1] * q.w * .42 * wk]); }
    P.push(...r); return P;
  };
  return { S, N, at, idx, edge, outline };
}

// ——— cloth (or bare skin) along a limb ———
// o: { spine, w, tone {lit, half, shadow, outline}, lit: +1|-1 (which edge faces the light), rim (colour of the
// back-light edge, optional), rimSide (+1|-1, default -lit), folds: true (creases at the bends and a few drapes),
// cuff: { from (0..1), tone, k (widen) , roll (rolled sleeve lines) }, opacity, seed, capA, capB (round ends),
// roundA (optional: with capA, the start cap a full dome — a rounded shoulder; a number sets its depth, default .9),
// tension (optional, default false): creases only at the real bends, their number and length by the bend's depth (a
// straight limb gets none but the drapes) }
function cloth(u, o) {
  const T = tube(o.spine, o.w), tn = o.tone, lit = o.lit || 1, cid = nid('pc', u), R = K.rng(o.seed || 7);
  const cutAt = o.cuff ? T.idx(o.cuff.from) : T.N;
  const body = T.outline(0, cutAt, 1, o.capA, o.capB && !o.cuff, o.roundA);
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
      // tension (optional): the creases only where the limb bends, as many and as long as the bend is deep
      let tk = 1; if (o.tension) { const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
        const ang = Math.acos(Math.max(-1, Math.min(1, ((b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1])) / l1 / l2))) * 180 / Math.PI;
        tk = Math.max(0, Math.min(1, (ang - 7) / 38)); if (tk <= 0) continue; }
      for (const [di, len0, w0] of [[0, .95, .7], [-3, .8, .55], [3, .75, .55], [-6, .55, .45], [5, .5, .4]]) {
        const i = ci + di, len = len0 * (o.tension ? .45 + .55 * tk : 1), w = w0 * (o.tension ? .5 + .5 * tk : 1); if (i < 1 || i >= cutAt) continue;
        if (o.tension && Math.abs(di) > 2 + tk * 5) continue;
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
//   'relaxed' | 'point' | 'scissor' (index and middle straight, pressed together: a card between them) | 'pinch' | 'hold';
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
//   [0, −1, .6]) — where the thumb's nail faces;
//   thumbTo ([x, y, z] local) — the thumb's tip brought there (IK on its angles; 'pinch' without an own thumbFlex does
//   it by default: the thumb's pad against the index finger's pad, pinchGap (.15) apart; thumbTo: false — the old
//   thumb); trigger: true (wrap) — the index finger off the handle, curled on a trigger in front of it (triggerFlex,
//   default [2, 50, 22]); backFingers may hold 'palm' (the palm behind a held card); cut (local x) — the wrist end cut
//   there and left without an outline, with the sleeve's shade on it (figure() passes 0: the hand grows out of the
//   cuff); lightZ (.55) — the light's share towards us, for the tone of each phalanx by how it faces the light }
// Drawn: each phalanx a little waisted, the joints full, the knuckle standing out on a bent joint and the skin
// folding in on its inside, a round pad at the tip; nails (plate, cuticle, glint) on the tips turned to us, pads on
// the tips seen from the palm; a thick outer contour (the silhouette reads at card size) with thin inner lines; the
// pieces lying behind the others sunk a little darker.
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
  pinch: { flex: [[34, 46, 24], [40, 56, 30], [50, 70, 40], [58, 76, 44]], spread: 2, thumbFlex: [34, 22, 18], thumbSpread: -6 },
  // a flat thing (a card, a letter) held between the thumb in front and the fingers behind it
  hold: { flex: [[14, 10, 6], [12, 10, 6], [16, 14, 8], [22, 20, 10]], spread: 3, thumbFlex: [10, 10, 8] }
};
function hand3(u, o) {
  const s = o.s || 1, m = o.m || 1, an = (o.a || 0) * Math.PI / 180, ux = Math.cos(an), uy = Math.sin(an), nx = -uy, ny = ux;
  const rl = (o.roll || 0) * Math.PI / 180, cr = Math.cos(rl), sr = Math.sin(rl), pt = (o.pitch || 0) * Math.PI / 180, cp = Math.cos(pt), spp = Math.sin(pt);
  const tn = o.tone, sw = o.sw || .36, pose = o.pose || 'relaxed', wrap = pose === 'wrap' || pose === 'fist';
  const r = pose === 'fist' ? .12 : (o.r != null ? o.r : .8), tilt = (o.tilt != null ? o.tilt : 10) * Math.PI / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = a => sc(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1)), cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // the view: a rotation about the hand's x axis; depth > 0 — towards us
  // pitch first (about the hand's y: + brings the finger end towards us), then roll (about its x)
  const pz = p => p[0] * spp + p[2] * cp, px = p => p[0] * cp - p[2] * spp;
  const yv = p => p[1] * cr + pz(p) * sr, dep = p => -p[1] * sr + pz(p) * cr;
  const VIEW = [spp * cr, -sr, cp * cr];
  let W = o.at || [0, 0];
  const scr = p => { const y = yv(p), x = px(p); return [W[0] + s * (x * ux + m * y * nx), W[1] + s * (x * uy + m * y * ny)]; };
  // a local direction in the view's frame (screen x, screen y down, depth to us): for the light on each piece
  const vv = p => { const y = yv(p), x = px(p); return [x * ux + m * y * nx, x * uy + m * y * ny, dep(p)]; };
  // the handle axis (wrap): along y, tilted so it is nearer the knuckles at the index side; z under the palm
  const zc = -(.85 + r), axX = y => 4.5 - Math.tan(tilt) * y;
  if (o.grip) { const g0 = scr([axX(-.48), -.48, zc]); W = [W[0] + o.grip[0] - g0[0], W[1] + o.grip[1] - g0[1]]; }
  const P = (x, y, z = 0) => scr([x, y, z]);
  const pr = Object.assign({}, HPOSE[pose] || {}, o);
  const cut = o.cut != null ? o.cut : null;
  const pw = o.palmW || 1, ww = o.wristW || (cut != null ? .9 : 1), fw = o.fingerW || 1;
  const HF = pw === 1 && fw === 1 ? HFING : HFING.map(F => Object.assign({}, F, { k: [F.k[0], F.k[1] * pw], w: F.w * fw }));
  const spread = (pr.spread != null ? pr.spread : 4) * Math.PI / 180;
  // ——— the digits as chains of 3D joints with widths ———
  const digits = [];
  HF.forEach((F, i) => {
    const K0 = [F.k[0], F.k[1], -.42], ls = [F.l * .45, F.l * .32, F.l * .26], ws = [F.w, F.w * .92, F.w * .84, F.w * .74];
    const trig = wrap && i === 0 && o.trigger;   // the index finger off the handle, on a trigger in front of it
    const yaw = (pr.yaw ? pr.yaw[i] * Math.PI / 180 : wrap ? -F.sp * 1.5 * Math.PI / 180 : F.sp * spread), d0 = [Math.cos(yaw), Math.sin(yaw), 0];
    const J = [K0], D = [], PH = [];
    if (wrap && !trig) {
      // walk round the handle: each joint on the circle of radius ρ about the axis, in the finger's own plane
      const C = [axX(K0[1]) - K0[0], zc - K0[2]];   // (along the finger, z) relative to the knuckle
      const rho = Math.hypot(C[0], C[1]); let th = Math.atan2(-C[1], -C[0]);
      for (const l of ls) { const st = 2 * Math.asin(Math.min(.999, l / (2 * rho))); th -= st;
        const t = C[0] + rho * Math.cos(th), z = C[1] + rho * Math.sin(th); J.push(add(K0, add(sc(d0, t), [0, 0, z]))); }
    } else {
      const fl = trig ? (o.triggerFlex || [2, 50, 22]) : (pr.flex && pr.flex[i]) || [15, 20, 10]; let phi = 0, p = K0;
      fl.forEach((fd, j) => { phi += fd * Math.PI / 180; PH.push(phi); const d = add(sc(d0, Math.cos(phi)), [0, 0, -Math.sin(phi)]); p = add(p, sc(d, ls[j])); J.push(p); });
    }
    for (let j = 0; j < 3; j++) { const d = nrm(sub(J[j + 1], J[j])), dz = [0, 0, 1], dor = nrm(sub(dz, sc(d, dot(dz, d))));
      D.push(o.trueDorsal && PH.length ? nrm(add(sc(d0, Math.sin(PH[j])), [0, 0, Math.cos(PH[j])])) : dor); }
    digits.push({ id: i, J, ws, D });
  });
  { // the thumb: from the ball of the thumb (the carpal joint), three bones
    const C0 = [1.25, -1.45 * pw, -.78], ls = [1.75, 1.45, 1.2], ws = [1.4, 1.2, 1.08, .96].map(v => v * fw);
    let J = [C0];
    // its joints from four numbers: the sideways angle A, the lift e (z of the first bone), the bends tf (rad)
    const chain = (A, e, tf) => { const T0 = nrm([Math.cos(A), Math.sin(A), e]), B0 = [.3, 1, -.9], B = nrm(sub(B0, sc(T0, dot(B0, T0))));
      const Q = [C0]; let phi = 0, p = C0; tf.forEach((fd, j) => { phi += fd; const d = add(sc(T0, Math.cos(phi)), sc(B, Math.sin(phi))); p = add(p, sc(d, ls[j])); Q.push(p); }); return Q; };
    if (o.thumbJ) { J = o.thumbJ.map(q => q.slice()); }
    else if (wrap) {
      // round the handle the other way from the fingers, rising from the palm, its tip over the index finger
      const ya = [-2.1 * pw, -1.7 * pw, -.95 * pw], ca = [axX(-1.9), zc]; let th = Math.atan2(J[0][2] - ca[1], J[0][0] - ca[0]);
      const rad = [r + .74, r + 1.2, r + 1.6];
      ls.forEach((l, j) => { const prev = J[j], dy = ya[j] - prev[1], lxz = Math.sqrt(Math.max(.05, l * l - dy * dy));
        const rho = rad[j], st = 2 * Math.asin(Math.min(.999, lxz / (2 * rho))); th = j === 0 ? Math.PI - .26 : th + st;
        J.push([ca[0] + rho * Math.cos(th), ya[j], ca[1] + rho * Math.sin(th)]); });
    } else {
      const q0 = [-(40 + (pr.thumbSpread || 0)) * Math.PI / 180, -.5, ...(pr.thumbFlex || [10, 15, 10]).map(v => v * Math.PI / 180)];
      // thumbTo (a local point), or for 'pinch' (without an own thumbFlex) the index finger's tip: the thumb's tip is
      // brought there (its pad against the finger's pad, pinchGap apart — a coin, a card's edge)
      let T = o.thumbTo || null;
      if (!T && pose === 'pinch' && o.thumbTo !== false && !o.thumbFlex) { const it = digits[0].J[3], tb = chain(q0[0], q0[1], q0.slice(2))[3], v = nrm(sub(tb, it));
        T = add(it, sc(v, (digits[0].ws[3] + ws[3]) * .5 + (o.pinchGap != null ? o.pinchGap : .15))); }
      if (T) { const lo = [-2.2, -1.6, -.3, -.3, -.3], hi = [.6, 1, 1.6, 1.7, 1.6], q = q0.slice();
        const cost = v => { const tip = chain(v[0], v[1], v.slice(2))[3], d = sub(tip, T); return dot(d, d) + .015 * v.reduce((a, x, k) => a + (x - q0[k]) * (x - q0[k]), 0); };
        let c0 = cost(q), st = .25;
        for (let it = 0; it < 90 && st > .002; it++) { let moved = false;
          for (let k = 0; k < 5; k++) for (const sg of [1, -1]) { const v = q.slice(); v[k] = cl(v[k] + sg * st, lo[k], hi[k]); const c = cost(v); if (c < c0) { c0 = c; q[k] = v[k]; moved = true; } }
          if (!moved) st *= .55; }
        J = chain(q[0], q[1], q.slice(2)); }
      else J = chain(q0[0], q0[1], q0.slice(2));
    }
    const D = []; for (let j = 0; j < 3; j++) { const d = nrm(sub(J[j + 1], J[j])), out = o.thumbOut || [0, -1, .6], dor = nrm(sub(out, sc(d, dot(out, d)))); D.push(dor); }
    digits.push({ id: 'thumb', J, ws, D });
  }
  // ——— drawing ———
  const Ls = o.light || [-.5, -.86], Lv = nrm([Ls[0], Ls[1], o.lightZ != null ? o.lightZ : .55]);
  const lit2 = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return ((-dy / l) * Ls[0] + (dx / l) * Ls[1]) >= 0 ? 1 : -1; };
  const core = tn.core || mix(tn.half, tn.shadow, .5);
  // a surface facing the light (I = 1), across it (0), away (−1): its local colour
  const toneI = I => I >= 0 ? mix(tn.half, tn.lit, cl(I) * .72) : mix(tn.half, core, cl(-I) * .85);
  const nail = o.nail || mix(tn.lit, '#fff4ee', .4), crease = mix(tn.shadow, tn.half, .25), osw = sw * 2.3;
  const detail = cl((s - .9) / .8);   // small marks (wrinkles, pads) only on hands big enough to show them
  const piece = (dg, j0, j1, dim) => {
    // one continuous body through joints j0..j1 (a part of a digit wholly in front of or behind the object): each
    // bone a little waisted, the joints a little full, the tip a round pad; on a bent joint the knuckle stands out
    // on the back of the finger and the skin folds in on the inside
    const C = [], Wd = [], ji = [];
    for (let j = j0; j <= j1; j++) {
      ji.push(C.length); C.push(scr(dg.J[j])); Wd.push(dg.ws[j] * s * (j > j0 && j < 3 ? 1.04 : 1));
      if (j < j1) { const tipB = j === 2; C.push(scr(add(sc(dg.J[j], tipB ? .4 : .5), sc(dg.J[j + 1], tipB ? .6 : .5)))); Wd.push((dg.ws[j] + dg.ws[j + 1]) * .5 * s * (tipB ? 1.02 : .93)); }
    }
    for (let k = 1; k < C.length; k++) if (Math.hypot(C[k][0] - C[k - 1][0], C[k][1] - C[k - 1][1]) < .03 * s) C[k] = [C[k][0] + .03 * s * ux, C[k][1] + .03 * s * uy];
    const NS = 4, T = tube(C, Wd, NS), tip = j1 === 3, side = lit2(C[0], C[C.length - 1]);
    const bumps = [];
    for (let j = Math.max(j0 + 1, 1); j <= Math.min(j1 - 1, 2); j++) {
      const a = nrm(sub(dg.J[j], dg.J[j - 1])), b = nrm(sub(dg.J[j + 1], dg.J[j])), bend = cl(Math.acos(cl(dot(a, b), -1, 1)) / (75 * Math.PI / 180));
      if (bend < .05) continue;
      const i = ji[j - j0] * NS, dd = add(dg.D[j - 1], dg.D[j]), q0 = scr(dg.J[j]), q1 = scr(add(dg.J[j], sc(nrm(dd), .5))), v = [q1[0] - q0[0], q1[1] - q0[1]];
      const n = T.S[Math.min(T.N, i)].n, pj = (v[0] * n[0] + v[1] * n[1]) / (.5 * s);
      bumps.push({ i, sd: pj >= 0 ? 1 : -1, k: bend * cl(Math.abs(pj) * 1.3) });
    }
    const off = (i, sd) => { let v = 0; for (const b of bumps) { const g = Math.exp(-((i - b.i) * (i - b.i)) / 3.2); v += b.sd === sd ? .13 * b.k * g : -.07 * b.k * Math.exp(-((i - b.i) * (i - b.i)) / 1.4); } return v; };
    const edgeO = sd => { const a = []; for (let i = 0; i <= T.N; i++) { const q = T.S[i], h = q.w / 2 * (1 + off(i, sd)); a.push([q.p[0] + q.n[0] * h * sd, q.p[1] + q.n[1] * h * sd]); } return a; };
    const capAt = (i, dir) => { const q = T.S[i], h = q.w / 2, out = []; for (let k = 1; k < 8; k++) { const ph = Math.PI * k / 8;
      out.push([q.p[0] + q.d[0] * Math.sin(ph) * h * 1.04 * dir - q.n[0] * Math.cos(ph) * h * dir, q.p[1] + q.d[1] * Math.sin(ph) * h * 1.04 * dir - q.n[1] * Math.cos(ph) * h * dir]); } return out; };
    const outl = [...edgeO(-1), ...capAt(T.N, 1), ...edgeO(1).reverse(), ...capAt(0, -1)];
    // the piece's own colour by how its back faces the light, sunk a little where it lies behind the others
    const Dm = nrm(dg.D.slice(Math.max(0, j0), j1).reduce((a, d) => add(a, d), [0, 0, 0])), I = dot(vv(Dm), Lv) * .45;
    const base = mix(toneI(I), core, dim);
    let r2 = `<path d="${sp(outl, true)}" fill="${base}" stroke="${tn.outline}" stroke-width="${f(osw)}" stroke-linejoin="round" paint-order="stroke"/>`;
    const strip = (a, b, col, op) => `<path d="${sp(T.edge(a, 0, T.N).concat(T.edge(b, 0, T.N).reverse()), true)}" fill="${col}" opacity="${f(op)}"/>`;
    r2 += strip(-side * .1, -side * .95, core, .55) + strip(-side * .42, -side * .84, tn.shadow, .42) + strip(-side * .86, -side * .96, tn.half, .28)
      + strip(side * .18, side * .9, tn.lit, .48) + strip(side * .38, side * .66, mix(tn.lit, '#ffffff', .3), .2 * cl(I + .5));
    // the joints: on the back a knuckle catching the light (and a few wrinkles on a big hand), inside a crease
    for (let j = Math.max(j0, 1); j <= Math.min(j1, 2); j++) {
      if (j === j0) continue;
      const i = ji[j - j0] * NS, fc = dot(dg.D[Math.min(2, j)], VIEW) + dot(dg.D[j - 1], VIEW), c = T.at(i, 0), pv = T.at(Math.max(0, i - 1), 0), dv0 = [c[0] - pv[0], c[1] - pv[1]];
      if (fc > .1) {
        const hl = T.at(i, side * .3);
        r2 += `<ellipse cx="${f(hl[0])}" cy="${f(hl[1])}" rx="${f(dg.ws[j] * s * .26)}" ry="${f(dg.ws[j] * s * .17)}" transform="rotate(${f(Math.atan2(dv0[1], dv0[0]) * 180 / Math.PI)} ${f(hl[0])} ${f(hl[1])})" fill="${tn.lit}" opacity="${f(.28 * cl(fc))}"/>`;
        if (detail > 0) for (const dk of [-1, 1]) { const p = T.at(i + dk, -.42), q = T.at(i + dk, .42), mm = T.at(i + dk * 2, 0);
          r2 += `<path d="M${f(p[0])} ${f(p[1])}Q${f(mm[0])} ${f(mm[1])} ${f(q[0])} ${f(q[1])}" stroke="${crease}" stroke-width="${f(.1 * s)}" fill="none" opacity="${f(.45 * detail * cl(fc))}"/>`; }
      } else { const p = T.at(i, -.66), q = T.at(i, .66);
        r2 += `<path d="M${f(p[0])} ${f(p[1])}Q${f(c[0] + dv0[0] * .8)} ${f(c[1] + dv0[1] * .8)} ${f(q[0])} ${f(q[1])}" stroke="${crease}" stroke-width="${f(.17 * s)}" fill="none" opacity=".75"/>`; }
    }
    if (tip) {
      const dor = dg.D[2], vis = dot(dor, VIEW), a3 = scr(dg.J[2]), b3 = scr(dg.J[3]), sl = Math.hypot(b3[0] - a3[0], b3[1] - a3[1]), w = dg.ws[3] * s;
      if (o.nails !== false && vis > .25 && sl > w * .55) {
        // the nail on the back of the last phalanx: a rounded plate from its middle to the tip, a cuticle, a glint
        const at3 = t => scr(add(add(sc(dg.J[2], 1 - t), sc(dg.J[3], t)), sc(dor, dg.ws[3] * .42))), e = [(b3[0] - a3[0]) / sl, (b3[1] - a3[1]) / sl], nn = [-e[1], e[0]];
        const hw = w * .33 * cl(vis + .25), p0 = at3(.42), p1 = at3(1.05), q = (p, k, t) => [p[0] + nn[0] * hw * k + e[0] * t, p[1] + nn[1] * hw * k + e[1] * t];
        const A = q(p0, -.86, 0), B = q(p0, .86, 0), C1 = q(p1, 1, -hw * .2), C2 = q(p1, -1, -hw * .2), T1 = q(p1, 0, hw * .55), M0 = q(p0, 0, -hw * .5);
        const P2 = p => `${f(p[0])} ${f(p[1])}`;
        r2 += `<path d="M${P2(A)}Q${P2(M0)} ${P2(B)}L${P2(C1)}Q${P2(q(p1, 1, hw * .45))} ${P2(T1)}Q${P2(q(p1, -1, hw * .45))} ${P2(C2)}Z" fill="${nail}" stroke="${mix(tn.shadow, tn.half, .3)}" stroke-width="${f(.09 * s)}" opacity="${f(.55 + .4 * cl(vis))}"/>`
          + `<path d="M${P2(q(p0, -side * m * .3, hw * .5))}L${P2(q(p1, -side * m * .3, -hw * .1))}" stroke="#ffffff" stroke-width="${f(hw * .32)}" stroke-linecap="round" opacity="${f(.3 * cl(vis))}"/>`;
      } else if (vis < -.3 && detail > 0 && sl > w * .5) {
        // the pad of the finger tip seen from the palm side
        const c3 = scr(add(add(sc(dg.J[2], .3), sc(dg.J[3], .7)), sc(dor, -dg.ws[3] * .3)));
        r2 += `<ellipse cx="${f(c3[0])}" cy="${f(c3[1])}" rx="${f(sl * .32)}" ry="${f(w * .28)}" transform="rotate(${f(Math.atan2(b3[1] - a3[1], b3[0] - a3[0]) * 180 / Math.PI)} ${f(c3[0])} ${f(c3[1])})" fill="${tn.lit}" opacity="${f(.22 * detail)}"/>`;
      }
    }
    return r2;
  };
  const specs = [];   // { d: depth, dg, j0, j1, back }
  const dC = wrap ? dep([axX(-.48), -.48, zc]) : -1e9, backSet = new Set(o.backFingers || []);
  for (const dg of digits) {
    // split the chain where it crosses behind the handle (by the depth of each bone's middle)
    const segBack = [0, 1, 2].map(j => backSet.has(dg.id) || (wrap && dep(sc(add(dg.J[j], dg.J[j + 1]), .5)) < dC));
    let j = dg.id === 'thumb' ? 1 : 0;   // the thumb's first bone is inside the ball of the thumb (the palm's body)
    while (j < 3) { let k = j; while (k + 1 < 3 && segBack[k + 1] === segBack[j]) k++;
      const mids = []; for (let q = j; q <= k; q++) mids.push(dep(sc(add(dg.J[q], dg.J[q + 1]), .5)));
      specs.push({ d: Math.max(...mids), dg, j0: j, j1: k + 1, back: segBack[j] }); j = k + 1; }
  }
  const dMax = Math.max(...specs.map(q => q.d)), dMin = Math.min(...specs.map(q => q.d));
  const items = specs.map(q => ({ d: q.d, back: q.back, svg: piece(q.dg, q.j0, q.j1, dMax - dMin > .3 ? .2 * (dMax - q.d) / (dMax - dMin) : 0) }));
  // the palm: the back (z 0) and the inside (z −.85) outlines and the ball of the thumb, as one convex body; with
  // `cut` the wrist end is cut off there (the sleeve's edge) and left without an outline, so the hand comes out of it
  let PB = [[-.4, -1.5], [1.4, -1.95], [3.2, -2.05], [4.4, -1.95], [4.82, -1.2], [4.98, -.4], [4.92, .5], [4.62, 1.35], [4.2, 1.85], [3.0, 2.0], [1.2, 1.85], [-.4, 1.45]];
  if (pw !== 1 || ww !== 1) PB = PB.map(p => [p[0], p[1] * pw * (p[0] < 2.2 ? lerp(ww, 1, Math.max(0, (p[0] + .4) / 2.6)) : 1)]);
  if (cut != null) PB = PB.map(p => [Math.max(p[0], cut), p[1]]);
  const TJ = digits[4].J, web = [TJ[1][0] + .1, TJ[1][1] + .1, TJ[1][2]], web0 = [lerp(TJ[0][0], TJ[1][0], .5), lerp(TJ[0][1], TJ[1][1], .5) - .35, lerp(TJ[0][2], TJ[1][2], .5)], web1 = [TJ[1][0] - .5, TJ[1][1] - .3, TJ[1][2]];
  let pts3 = [...PB.map(p => [p[0], p[1], 0]), ...PB.map(p => [p[0] * (p[0] > 4 ? .92 : .97), p[1] * .95, -.85]), [1.2, -1.9 * pw, -1.25], [2.4, -1.6 * pw, -1.35], [1.6, 1.4 * pw, -1.15], web, web0, web1];
  if (cut != null) pts3 = pts3.map(p => [Math.max(p[0], cut), p[1], p[2]]);
  const hull = (() => { const Q = pts3.map(p => [px(p), yv(p), cut != null && p[0] <= cut + 1e-6]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr2 = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
    const lo = [], up = []; for (const p of Q) { while (lo.length > 1 && cr2(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of Q.slice().reverse()) { while (up.length > 1 && cr2(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); })();
  const H2 = hull.map(p => [W[0] + s * (p[0] * ux + m * p[1] * nx), W[1] + s * (p[0] * uy + m * p[1] * ny)]);
  let palm = '';
  { const g = nid('h3p', u), cx = H2.reduce((a, p) => a + p[0], 0) / H2.length, cy = H2.reduce((a, p) => a + p[1], 0) / H2.length, R0 = 3.2 * s;
    const backVis = cr * cp, palmVis = -cr * cp, Ip = dot(vv([0, 0, backVis >= 0 ? 1 : -1]), Lv), dk = c => mix(c, core, cl(-Ip) * .45);
    palm += `<defs>${linGrad(g, cx + Ls[0] * R0, cy + Ls[1] * R0, cx - Ls[0] * R0, cy - Ls[1] * R0, [[0, dk(tn.lit), 1], [.4, dk(mix(tn.half, tn.lit, cl(Ip) * .3)), 1], [.85, dk(tn.shadow), 1], [1, dk(mix(tn.shadow, tn.half, .25)), 1]])}</defs>`;
    // the outline: whole, or open across the cut (drawn first and thick, the fill over its inner half)
    const ci = hull.findIndex((p, i) => p[2] && hull[(i + 1) % hull.length][2]);
    if (ci >= 0) { const n = H2.length, open = []; for (let k = 1; k <= n; k++) open.push(H2[(ci + k) % n]);
      palm += `<path d="${sp(open)}" fill="none" stroke="${tn.outline}" stroke-width="${f(osw)}" stroke-linejoin="round"/><path d="${sp(H2, true)}" fill="url(#${g})"/>`; }
    else palm += `<path d="${sp(H2, true)}" fill="url(#${g})" stroke="${tn.outline}" stroke-width="${f(osw)}" stroke-linejoin="round" paint-order="stroke"/>`;
    if (cut != null) { const sg = nid('h3c', u), a0 = P(cut, 0), a1 = P(cut + 1.5, 0);
      // the sleeve's shade on the wrist, fading towards the knuckles
      palm += `<defs>${linGrad(sg, a0[0], a0[1], a1[0], a1[1], [[0, tn.shadow, .6], [1, tn.shadow, 0]])}</defs><path d="${sp(H2, true)}" fill="url(#${sg})"/>`; }
    if (backVis > .25) {
      // the back of the hand: faint tendons from the wrist to the knuckles, the knuckles in the light
      for (const F of HF.slice(0, 3)) { const a0 = P(2.2, F.k[1] * .55, .02), a1 = P(F.k[0] - .6, F.k[1] * .92, .02);
        palm += `<path d="M${f(a0[0])} ${f(a0[1])}L${f(a1[0])} ${f(a1[1])}" stroke="${tn.lit}" stroke-width="${f(.26 * s)}" opacity="${f(.1 * backVis)}" stroke-linecap="round"/>`; }
      if (o.knuckles !== false) for (const F of HF) { const k = P(F.k[0] - .15, F.k[1], 0);
        palm += `<ellipse cx="${f(k[0] + Ls[0] * .12 * s)}" cy="${f(k[1] + Ls[1] * .12 * s)}" rx="${f(.4 * s * F.w)}" ry="${f(.28 * s * F.w)}" fill="${tn.lit}" opacity="${f(.26 * backVis)}"/>`; }
    }
    if (palmVis > .3) {
      for (const L2 of [[[.8, -1.3], [2.4, -.9], [3.4, -1.4]], [[3.6, 1.8], [3.9, .2], [3.7, -1.6]], [[3.0, 1.9], [3.3, .6], [3.0, -.6]]])
        { const Q2 = L2.map(p => P(p[0], p[1], -.85)); palm += `<path d="${sp(Q2)}" stroke="${tn.shadow}" stroke-width="${f(.12 * s)}" fill="none" opacity="${f(.45 * palmVis)}"/>`; }
      // the ball of the thumb and the heel of the hand: soft rounds in the light
      const b1 = P(1.4, -1.0, -1.1), b2 = P(1.2, 1.0, -.95);
      palm += `<ellipse cx="${f(b1[0])}" cy="${f(b1[1])}" rx="${f(1.1 * s)}" ry="${f(.8 * s)}" fill="${tn.lit}" opacity="${f(.16 * palmVis)}"/><ellipse cx="${f(b2[0])}" cy="${f(b2[1])}" rx="${f(.9 * s)}" ry="${f(.6 * s)}" fill="${tn.lit}" opacity="${f(.1 * palmVis)}"/>`;
    }
  }
  // the palm's depth: its nearest face, a little back, so the fingers' roots tuck under its edge
  const dPalm = Math.max(dep([2.5, 0, 0]), dep([2.5, 0, -.85])) - .35;
  items.push({ d: dPalm, svg: palm, back: backSet.has('palm') || (wrap && dPalm < dC), palm: true });
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
  // (opt-in) locks: groups of hair, each a broad lit band along the flow with a dark gap on its side away from the
  // light, so the mass reads as strands gathered in locks, not a smooth cap. o.locks — how many; o.lockRoots(R, k) —
  // where lock k starts (default: anywhere in the mass); o.lockLen — length in r (default .7); o.lockW — width in r
  if (o.locks) {
    const Ln = Math.hypot(Lg[0], Lg[1]) || 1, lx = Lg[0] / Ln, ly = Lg[1] / Ln, lw = r * (o.lockW || .13), body = mix(col, hi, .3);
    for (let k = 0; k < o.locks; k++) {
      let p = o.lockRoots ? o.lockRoots(R, k) : [x0 + R() * (x1 - x0), y0 + R() * (y1 - y0)];
      const L0 = r * (o.lockLen || .7) * (.7 + R() * .5), st = 6, P3 = [p], bend = (R() - .5) * (o.curl ? 1.4 : .5);
      for (let i = 0; i < st; i++) { const fl = o.flow ? o.flow(p) : [0, 1], fn = Math.hypot(fl[0], fl[1]) || 1, t = i / st;
        const dx = fl[0] / fn, dy = fl[1] / fn, bx = -dy * bend * Math.sin(t * Math.PI * (o.curl ? 2 : 1)), by = dx * bend * Math.sin(t * Math.PI * (o.curl ? 2 : 1));
        p = [p[0] + (dx + bx * .6) * L0 / st, p[1] + (dy + by * .6) * L0 / st]; P3.push(p); }
      const a = P3[0], b = P3[P3.length - 1], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      let nx = -ty / tl, ny = tx / tl; if (nx * lx + ny * ly > 0) { nx = -nx; ny = -ny; }   // n — towards the shade
      const off = (P, k2) => sp(P.map(q => [q[0] + nx * k2, q[1] + ny * k2]));
      s += `<path d="${off(P3, 0)}" stroke="${body}" stroke-width="${f(lw)}" fill="none" stroke-linecap="round" opacity=".5"/>`
        + `<path d="${off(P3, lw * .55)}" stroke="${lo}" stroke-width="${f(lw * .36)}" fill="none" stroke-linecap="round" opacity=".75"/>`
        + `<path d="${off(P3, -lw * .22)}" stroke="${hi}" stroke-width="${f(lw * .18)}" fill="none" stroke-linecap="round" opacity=".55"/>`;
    }
  }
  // (opt-in) edgeShade: [[i0, i1], …] — runs of the outline where the mass turns under (over the brow, at the nape,
  // a beard under the cheekbone and the jaw): a soft dark band inside the edge
  if (o.edgeShade) { const bf = nid('hb', u), pad = r * 3;
    s += `<defs><filter id="${bf}" filterUnits="userSpaceOnUse" x="${f(x0 - pad)}" y="${f(y0 - pad)}" width="${f(x1 - x0 + pad * 2)}" height="${f(y1 - y0 + pad * 2)}"><feGaussianBlur stdDeviation="${f(r * .05)}"/></filter></defs>`;
    for (const [i0, i1, w0] of o.edgeShade) { const run = pts.slice(i0, i1 + 1); if (run.length > 1) s += `<path d="${sp(run)}" stroke="${lo}" stroke-width="${f(r * (w0 || .16))}" fill="none" stroke-linecap="round" opacity=".7" filter="url(#${bf})"/>`; } }
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
// 'curly' | 'bald' }, beard: 'full' | 'short' | 'goatee', moustache, ear: false, opacity;
// optional face shape (default 1 each, the face as before): noseW — the nose's width (wings, nostrils), noseL — how far
// its tip stands out; browW — the brows' thickness; eyeW, eyeH — the eyes' width and opening; beardTufts — the beard's
// locks breaking its outline (an array of outline indices; [] for a smooth edge); folds: false — no faint fold from
// the nose to the mouth's corners (on by default); tailApart: true — the tied queue is not in svg but in `tail` (to
// draw behind the body); jawW — the jaw's and chin's width (default 1; .85–.9 a finer, a woman's jaw) }
// Returns { svg, Q (x, y, z in head units → picture), depth (→ + towards us), tail ('' unless tailApart) }.
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
  pts.push(...Qa(o.jawW && o.jawW !== 1 ? jawP.map(p => [p[0] * (p[1] > .3 ? o.jawW : 1), p[1], p[2]]) : jawP));
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
    const w = .14 * r * (.3 + .7 * vis) * (o.eyeW || 1), h = .055 * r * op * (o.eyeH || 1), at = (a, b) => [c[0] + ex[0] * a + up[0] * b, c[1] + ex[1] * a + up[1] * b];
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
      const bw = ((o.browW || 1) - 1) * .025, B = [[sd * .1, -.25 + fr - bw, .92], [sd * .3, -.33 + dy - bw, .88], [sd * .52, -.31 + dy - bw, .76], [sd * .6, -.25 + dy, .68], [sd * .5, -.27 + dy + bw, .76], [sd * .3, -.28 + dy + bw, .88], [sd * .12, -.21 + fr + bw, .92]];
      s += `<path d="${sp(Qa(B), true)}" fill="${hairC}" stroke="${mix(hairC, '#000', .4)}" stroke-width="${f(r * .01)}"/>`; }
  }
  // ——— the nose: the side away from the light in shade, the lit bridge, the ball with a highlight, the wings ———
  { const nW = o.noseW || 1, nL = o.noseL || 1, N0 = [0, -.1, .93], T = [0, .33, .93 + .2 * nL], Bs = [0, .42, .93 + .07 * nL], Wl = [-.16 * nW, .35, .92], Wr = [.16 * nW, .35, .92];
    const shadeSide = (Q(...Wr)[0] - Q(...T)[0]) * Ls[0] > 0 ? -1 : 1, Ws = shadeSide > 0 ? Wr : Wl, Wn = shadeSide > 0 ? Wl : Wr;
    s += `<path d="${sp(Qa([N0, [shadeSide * .08, .1, .98], [shadeSide * .1, .3, 1.02], Ws, [shadeSide * .08, .42, .96], Bs]), true)}" fill="${tn.shadow}" opacity=".45"/>`
      + soft(Q(shadeSide * .12, .48, .95), .16, .05, tn.shadow, .55);
    s += `<path d="${sp(Qa([[-shadeSide * .02, -.04, .95], [-shadeSide * .03, .14, 1.04], [-shadeSide * .02, .28, 1.11]]))}" stroke="${tn.lit}" stroke-width="${f(r * .04)}" fill="none" opacity=".65" stroke-linecap="round"/>`;
    // the nose's own edge (the ridge seen against the far cheek when turned)
    s += `<path d="${sp(Qa([N0, [0, .12, 1.03], T, [0, .38, 1.07], Bs]))}" stroke="${tn.outline}" stroke-width="${f(r * .03)}" fill="none" opacity="${f(Math.min(.8, Math.abs(sY) * 1.6))}"/>`;
    for (const W2 of [Wl, Wr]) { const v = depth(W2[0] * 2, 0, .7); if (v < -.1) continue;
      s += `<path d="${sp(Qa([[W2[0] * .7, .26, 1.0], [W2[0] * 1.05, .3, .93], [W2[0], .41, .92], [W2[0] * .5, .42, .98]]))}" stroke="${tn.outline}" stroke-width="${f(r * .03)}" fill="none" opacity=".75"/>`; }
    for (const sd of [-1, 1]) { const n = Q(sd * .07 * nW, .41, .93 + .07 * nL); s += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(r * .035 * nW * (.5 + .5 * Math.max(0, depth(sd, 0, 1.5) / 1.8)))}" ry="${f(r * .018)}" fill="${mix(tn.outline, tn.shadow, .3)}" opacity=".85"/>`; }
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
    // the fold from the nose's wing to the mouth's corner, faint on a calm face (folds: false — none): the cheek's
    // form against the mouth, without it the face reads as a smooth mask
    else if (o.folds !== false) for (const sd of [-1, 1]) { const v = depth(sd * .3, .5, .8); if (v < .2) continue;
      s += `<path d="${sp(Qa([[sd * .19, .42, .9], [sd * .3, .53, .8], [sd * .32, .63, .75]]))}" stroke="${tn.shadow}" stroke-width="${f(r * .03)}" fill="none" stroke-linecap="round" opacity="${f(.18 + .12 * Math.min(1, v))}"/>`
        + `<path d="${sp(Qa([[sd * .22, .43, .9], [sd * .33, .54, .8]]))}" stroke="${tn.lit}" stroke-width="${f(r * .018)}" fill="none" stroke-linecap="round" opacity=".22"/>`; }
    s += `<path d="${sp(Qa([[-.04, .46, .99], [-.03, .54, .98]]))}M${P2(Q(.04, .46, .99))}L${P2(Q(.03, .54, .98))}" stroke="${tn.shadow}" stroke-width="${f(r * .015)}" fill="none" opacity=".45"/>`; }
  // ——— beard, moustache, hair as masses ———
  const HL = Ls;
  let tailS = '';
  if (o.beard) {
    const ext = o.beard === 'full' ? .16 : .04, kind = o.beard;
    const outer = kind === 'goatee' ? [[-.2, .72, .86], [-.24, .9, .66], [-.16, 1.08 + jw + ext, .58], [0, 1.12 + jw + ext, .6], [.16, 1.08 + jw + ext, .58], [.24, .9, .66], [.2, .72, .86]]
      : [[-.74, .2, .22], [-.7, .5, -.06], [-.52, .88 + ext * .5, .24], [-.28, 1.06 + jw + ext, .52], [0, 1.12 + jw + ext, .6], [.28, 1.06 + jw + ext, .52], [.52, .88 + ext * .5, .24], [.7, .5, -.06], [.74, .2, .22],
        [.68, .22, .4], [.56, .4, .56], [.34, .6, .78], [.24, .7, .82], [0, .76 + jw, .93], [-.24, .7, .82], [-.34, .6, .78], [-.56, .4, .56], [-.68, .22, .4]];
    const pts2 = Qa(outer).filter((p, i) => true);
    s += hairMass(u, pts2, { r, color: hairC, outline: tn.outline, seed: 13, n: kind === 'goatee' ? 12 : 40, light: HL, sheen: Q(dir * .3, .9, .6),
      flow: () => [0, 1], tufts: o.beardTufts || (kind === 'goatee' ? [2, 3, 4] : [2, 3, 4, 5, 6]), tuftLen: kind === 'full' ? .14 : .07 });
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
      if (o.tailApart) tailS = tail; else s = tail + s; }
  }
  if (o.opacity != null && o.opacity < 1) { s = `<g opacity="${o.opacity}">${s}</g>`; if (tailS) tailS = `<g opacity="${o.opacity}">${tailS}</g>`; }
  return { svg: s, Q, depth, tail: tailS };
}

// ——— a whole figure ———
// A person built on a small 3D skeleton (in head units: 7.5 heads tall, shoulders 2 heads, the elbow at the waist, the
// finger tips at mid-thigh), posed, turned (yaw) and projected; the body drawn as cloth tubes and a torso of rings, the
// head by head34. Poses are written for a figure facing the frame's right; dir −1 mirrors the drawing (the light does
// not mirror). Limbs: R — the side nearer to us when turned (the figure's right while facing right), L — the far one.
// Angles are absolute in the body's frame before the turn: [flex (+ forward), abd (+ out to the side)], degrees.
const DEG = Math.PI / 180;
const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: a => Math.hypot(a[0], a[1], a[2]), lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
};
v3.nrm = a => v3.sc(a, 1 / (v3.len(a) || 1));
const rX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c + p[2] * s, -p[1] * s + p[2] * c]; };   // + leans the top forward
const rY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };  // + turns the front to +x
const rZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };   // + drops the +x side
const rotOf = r => p => rY(rX(rZ(p, (r[0] || 0) * DEG), (r[1] || 0) * DEG), (r[2] || 0) * DEG);
const dv = (fl, ab, sd) => { const F = fl * DEG, A = ab * DEG; return [sd * Math.sin(A), Math.cos(A) * Math.cos(F), Math.cos(A) * Math.sin(F)]; };
const BONE = { thigh: 1.85, shin: 1.72, ankle: .28, upper: 1.38, fore: 1.05, hand: .7, hipW: .46, shW: .75, shY: -2.02, headY: -3.116 };
// the torso as rings: [y, rx, rz, z of the centre, share of the chest's turn (1) against the pelvis' (0)]
const TRING = [[-2.3, .27, .24, -.1, 1], [-2.15, .5, .3, -.06, 1], [-1.97, .8, .38, -.02, 1], [-1.6, .84, .48, .03, 1], [-1.2, .78, .48, .05, 1],
  [-.8, .68, .43, .04, .6], [-.42, .72, .44, .02, .2], [-.05, .8, .46, 0, 0], [.25, .72, .42, -.02, 0]];
// the foot (boot) around the ankle: [forward, up, half-width]
const FOOT = [[-.21, -.08, .12], [-.18, -.28, .12], [.2, -.28, .15], [.62, -.28, .18], [.97, -.22, .12], [.93, -.08, .13], [.5, .03, .15], [.14, .12, .13], [-.15, .1, .13]];
const FIG_POSES = {
  // standing, the weight on the near leg (contrapposto): the hip on that side up, the shoulders the other way, the far
  // knee loose and the foot turned out; the far hand on the hip
  stand: { turn: .35, pelvis: [6, 0, 0], torso: [-4, 2, -4], head: { turn: .12, nod: 3 },
    legs: { R: { thigh: [2, -5], shin: [-1, -3], foot: [0, 10], weight: true }, L: { thigh: [14, 7], shin: [-6, 4], foot: [0, 24] } },
    arms: { R: { upper: [5, 7], fore: [16, 3] }, L: { to: [.9, -.4, .1], pole: [1, -.3, -.7] } }, hands: { R: 'relaxed', L: 'fist' } },
  // walking: the near leg forward on its heel, the far one pushing off its toes; the arms swing against the legs
  walk: { turn: .72, pelvis: [2, 0, 8], torso: [-1, 5, -8], head: { turn: -.05, nod: 4 },
    legs: { R: { thigh: [24, 2], shin: [14, 0], foot: [14, 6], weight: true }, L: { thigh: [-16, 3], shin: [-40, 0], foot: [-26, 8] } },
    arms: { R: { upper: [-22, 6], fore: [-8, 4] }, L: { upper: [24, 6], fore: [50, -2] } }, hands: { R: 'relaxed', L: 'relaxed' } },
  // hauling on a rope: leaning back against it, the front leg braced, both fists on the rope in front
  haul: { turn: .78, pelvis: [0, -6, 4], torso: [0, -20, -4], head: { turn: 0, nod: 8 },
    legs: { R: { thigh: [34, 3], shin: [28, 0], foot: [8, 6], weight: true }, L: { thigh: [-4, 5], shin: [-32, 0], foot: [-4, 14] } },
    arms: { R: { to: [-.1, -1.25, 1.55], pole: [-.6, 1, -.2] }, L: { to: [.12, -1.18, 1.0], pole: [.6, 1, -.4] } }, hands: { R: 'wrap', L: 'wrap' } },
  // aiming a pistol at arm's length (the near hand), the far hand low with a sabre; side-on, the head along the arm
  aim: { turn: .62, pelvis: [2, 0, 4], torso: [-2, 0, -12], head: { turn: .28, nod: 2 },
    legs: { R: { thigh: [12, 4], shin: [5, 0], foot: [2, 10], weight: true }, L: { thigh: [-12, 8], shin: [-14, 4], foot: [0, 34] } },
    arms: { R: { upper: [86, -10], fore: [89, -9] }, L: { upper: [-8, 14], fore: [14, 10] } }, hands: { R: 'wrap', L: 'wrap' } },
  // en garde with a cutlass: a short lunge, the sword hand forward at the chest, the free arm out behind for balance
  saber: { turn: .5, pelvis: [0, 4, 6], torso: [0, 8, -8], head: { turn: .08, nod: 6 },
    legs: { R: { thigh: [42, 4], shin: [-2, 2], foot: [2, 6], weight: true }, L: { thigh: [-22, 10], shin: [-26, 6], foot: [0, 36] } },
    arms: { R: { upper: [48, 12], fore: [92, -6] }, L: { upper: [-34, 52], fore: [-6, 74] } }, hands: { R: 'wrap', L: 'relaxed' } },
  // sitting at a table: thighs level, shins down, the forearms on the table top, leaning in a little
  sit: { turn: .3, sit: true, pelvis: [0, 0, 0], torso: [0, 10, 0], head: { turn: .05, nod: 10 },
    legs: { R: { thigh: [86, 8], shin: [6, 4], foot: [0, 10], weight: true }, L: { thigh: [82, 10], shin: [-4, 8], foot: [0, 16] } },
    arms: { R: { upper: [30, 8], fore: [84, -16] }, L: { upper: [26, 10], fore: [80, -24] } }, hands: { R: 'relaxed', L: 'relaxed' } },
  // at the wheel: feet apart and braced, the fists on two handles in front at the chest, the elbows out
  helm: { turn: .2, pelvis: [0, 0, 0], torso: [0, 4, 0], head: { turn: .25, nod: -2 },
    legs: { R: { thigh: [2, 9], shin: [0, 7], foot: [0, 12], weight: true }, L: { thigh: [-2, 9], shin: [0, 7], foot: [0, 14] } },
    arms: { R: { to: [-.6, -1.3, 1.05], pole: [-1, .6, -.3] }, L: { to: [.55, -1.75, 1.05], pole: [1, .6, -.3] } }, hands: { R: 'wrap', L: 'wrap' } }
};
const mergeDeep = (a, b) => { if (!b) return a; const out = Array.isArray(a) ? a.slice() : Object.assign({}, a);
  for (const k of Object.keys(b)) out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object' && !Array.isArray(a[k]) ? mergeDeep(a[k], b[k]) : b[k];
  return out; };
// a tone ramp from a local colour under the scene's light (or a ramp given whole)
const toneOf = (c, L, dim) => typeof c === 'object' ? c : (() => { const base = mix(c, L.shadowColor || '#20242c', dim);
  return { lit: mix(base, L.keyColor || '#ffffff', .26), half: base, core: mix(base, L.shadowColor || '#20242c', .35),
    shadow: mix(mix(base, L.shadowColor || '#20242c', .5), '#000000', .3), outline: mix(c, '#000000', .82) }; })();

// o: { at: [x, y] — the ground under the pelvis (the lowest sole stands on y), h: the height standing (default 120),
// pose: 'stand' | 'walk' | 'haul' | 'aim' | 'saber' | 'sit' | 'helm' or a pose object, adjust: overrides merged into the
// pose (e.g. { arms: { R: { upper: [70, 8] } } }), turn (0 facing us … 1 profile; the pose's by default), dir (±1),
// L (makeLight; required), reach: { R: [x, y], L: [x, y] } — picture points the wrists go to (two-bone IK, the elbow
// out as the pose's pole), dress: { shirt, vest, coat, coatLen: 'hip' | 'knee', trousers, boots, boot: 'high' |
// 'shoe' | 'bare', belt, sash, kerchief, sleeves: 'long' | 'rolled' } (colours or ramps; false — none), skin (ramp,
// default L.ramp('skin')), dim (0..1, how much the colours sink into the night; default .3 at night), head: options
// for head34 (hair, beard, eye, brow, mouth, smile …; turn and nod add to the pose's), hat: { color, … } (a tricorn),
// rim (colour of the back-light edge; false — none; default L.rimColor), hand: (u, info) => { back, front } (draws a
// hand; info: { side, at, a, s, m, pose, tone, light, L }), hands: { R, L } (hand poses), handsSeparate: true (the
// hands are not drawn into svg — draw them yourself round the prop), shadow: false, horizon (with it — a cast
// shadow), seed }
// Returns { svg, layers: { shadow, back, legs, body, head, front }, hands: { R, L } ({ back, front, at, a, … }),
// wrist: { R, L } ({ at, a, depth }), joints: { R, L } (shoulder, elbow, wrist, hip, knee, ankle, toe, heel),
// head: head34 result, neck, pelvis, feet: { R, L }, seat (sit: the seat under the buttocks), top, Hh, r }.
function figure(u, o) {
  const L = o.L, at = o.at || [100, 260], Hh = (o.h || 120) / 7.5, R = K.rng(o.seed || 11);
  let pose = typeof o.pose === 'object' ? o.pose : FIG_POSES[o.pose || 'stand'] || FIG_POSES.stand;
  pose = mergeDeep(pose, o.adjust);
  const turn = o.turn != null ? o.turn : pose.turn != null ? pose.turn : .4, dir = o.dir || 1, mir = dir < 0 ? -1 : 1, psi = turn * 90 * DEG;
  const Rp = rotOf(pose.pelvis || [0, 0, 0]), Rt = rotOf(pose.torso || [0, 0, 0]), SD = { R: -1, L: 1 };
  // ——— the legs: forward kinematics, the weight leg on the ground, the others brought down to it ———
  const legOf = (k, sp) => { const sd = SD[k], hip = Rp([sd * BONE.hipW, 0, 0]);
    const knee = v3.add(hip, v3.sc(dv(sp.thigh[0], sp.thigh[1], sd), BONE.thigh)), ankle = v3.add(knee, v3.sc(dv(sp.shin[0], sp.shin[1], sd), BONE.shin));
    const ft = sp.foot || [0, 10], F0 = rY([0, 0, 1], sd * ft[1] * DEG), S0 = rY([1, 0, 0], sd * ft[1] * DEG), p = ft[0] * DEG;
    const F = v3.add(v3.sc(F0, Math.cos(p)), v3.sc([0, -1, 0], Math.sin(p))), U = v3.add(v3.sc(F0, -Math.sin(p)), v3.sc([0, -1, 0], Math.cos(p)));
    const pts = []; for (const q of FOOT) for (const s of [-1, 1]) pts.push(v3.add(ankle, v3.add(v3.add(v3.sc(F, q[0]), v3.sc(U, q[1])), v3.sc(S0, q[2] * s))));
    return { sd, hip, knee, ankle, F, U, S: S0, pts, sole: Math.max(...pts.map(q => q[1])) }; };
  const legSpec = {}; for (const k of ['R', 'L']) legSpec[k] = mergeDeep({ thigh: [0, 4], shin: [0, 3], foot: [0, 10] }, (pose.legs || {})[k]);
  const wl = ['R', 'L'].filter(k => legSpec[k].weight); if (!wl.length) wl.push('R');
  const ground = Math.max(...wl.map(k => legOf(k, legSpec[k]).sole));
  for (const k of ['R', 'L']) { const sp0 = legSpec[k]; if (sp0.weight || sp0.plant === false) continue;
    // the knee bends (or straightens) till the sole meets the ground; if the leg cannot reach, the toes point down
    const bent = sp0.thigh[0] - sp0.shin[0]; let best = null;
    for (let e = -bent; e <= 80; e += .25) { const sp = mergeDeep(sp0, { shin: [sp0.shin[0] - e, sp0.shin[1]] }), c = Math.abs(legOf(k, sp).sole - ground) + .0004 * Math.abs(e);
      if (!best || c < best.c) best = { c, sp }; }
    let sp = best.sp; if (legOf(k, sp).sole < ground - .02) { let b2 = null;
      for (let p = sp.foot[0]; p >= sp.foot[0] - 70; p -= .5) { const s2 = mergeDeep(sp, { foot: [p, sp.foot[1]] }), c = Math.abs(legOf(k, s2).sole - ground); if (!b2 || c < b2.c) b2 = { c, s2 }; }
      sp = b2.s2; }
    legSpec[k] = sp; }
  const leg = { R: legOf('R', legSpec.R), L: legOf('L', legSpec.L) };
  // ——— the picture: turn, mirror, scale; y measured from the ground ———
  const turned = p => rY(p, psi), pr = p => { const q = turned(p); return [at[0] + mir * q[0] * Hh, at[1] + (p[1] - ground) * Hh]; }, dep = p => turned(p)[2];
  const prInv = (pt, d) => { const x = (pt[0] - at[0]) * mir / Hh, y = (pt[1] - at[1]) / Hh + ground; return rY([x, y, d], -psi); };
  // ——— the arms: angles or a target (two-bone IK in 3D) ———
  const shoulder = sd => Rt([sd * BONE.shW, BONE.shY, -.02]);
  const ik = (S, T, a, b, pole) => { const d = v3.sub(T, S), D = Math.min(v3.len(d), (a + b) * .998), uu = v3.nrm(d);
    const ca = Math.max(-1, Math.min(1, (a * a + D * D - b * b) / (2 * a * D))), sa = Math.sqrt(1 - ca * ca), pv = v3.nrm(v3.sub(pole, v3.sc(uu, v3.dot(pole, uu))));
    return { E: v3.add(S, v3.add(v3.sc(uu, a * ca), v3.sc(pv, a * sa))), W: v3.add(S, v3.sc(uu, D)) }; };
  const arm = {};
  for (const k of ['R', 'L']) { const sd = SD[k], sp = mergeDeep({ upper: [0, 6], fore: [10, 3] }, (pose.arms || {})[k]), S = shoulder(sd);
    let E = v3.add(S, v3.sc(dv(sp.upper[0], sp.upper[1], sd), BONE.upper)), W = v3.add(E, v3.sc(dv(sp.fore[0], sp.fore[1], sd), BONE.fore));
    const pole = sp.pole || [sd * .7, .4, -.6];
    if (sp.to) ({ E, W } = ik(S, sp.to, BONE.upper, BONE.fore, pole));
    if (o.reach && o.reach[k]) ({ E, W } = ik(S, prInv(o.reach[k], dep(W)), BONE.upper, BONE.fore, pole));
    arm[k] = { sd, S, E, W }; }
  // ——— tones and light ———
  const dim = o.dim != null ? o.dim : L.time === 'night' ? .3 : L.time === 'dusk' ? .15 : 0, dr = o.dress || {};
  const T = c => c ? toneOf(c, L, dim) : null;
  const cShirt = T(dr.shirt != null ? dr.shirt : '#d6cbb2'), cVest = T(dr.vest), cCoat = T(dr.coat), cTrou = T(dr.trousers || '#4a3c30');
  const cBoot = dr.boot === 'bare' ? null : T(dr.boots || '#2a1c14'), cBelt = dr.belt === false ? null : T(dr.belt || '#3a2416'), cSash = T(dr.sash);
  const headC3 = Rt([0, BONE.headY, .04]), hc = pr(headC3), la = L.at(hc[0], hc[1] + 3 * Hh), Lp = [la.ux, la.uy], back = la.dz < -.15;
  // the skin's ramp of the scene light, its terminator softened (the kit's core is for hard things and blackens a face)
  const skin = o.skin || (() => { const r0 = L.ramp('skin', hc[0], hc[1]); return Object.assign({}, r0, { core: mix(r0.half, r0.shadow, .45) }); })();
  const rimC = o.rim === false ? null : o.rim || L.rimColor || (back ? L.keyColor : null);
  const rimDir = L.rim && L.rim.az != null ? (() => { const x = Math.sin(L.rim.az * DEG), y = -.35, l = Math.hypot(x, y); return [x / l, y / l]; })() : Lp;
  const sideOf = (A, B, v) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1; return (-dy * v[0] + dx * v[1]) / l >= 0 ? 1 : -1; };
  const sw = Math.max(.25, Hh * .018), P2 = p => `${f(p[0])} ${f(p[1])}`, W = k => k * Hh;
  const limb = (pts3, w, tone, extra) => { const sp = pts3.map(pr);
    return cloth(u, Object.assign({ spine: sp, w: w.map(W), tone, lit: sideOf(sp[0], sp[sp.length - 1], Lp), rim: rimC, rimSide: sideOf(sp[0], sp[sp.length - 1], rimDir),
      rimOp: .32, rimW: Hh * .025, tension: true, drapes: 1, foldW: Hh * .045, sw, seed: Math.round(R() * 99) + 1, L }, extra)); };
  // ——— the torso's surface: a point at height y, angle th (0 the front, +π/2 the figure's left side) ———
  const ringAt = y => { let i = 0; while (i < TRING.length - 2 && TRING[i + 1][0] < y) i++; const a = TRING[i], b = TRING[i + 1], t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
    return a.map((v, j) => v + (b[j] - v) * t); };
  const surf = (y, th, k = 1) => { const g = ringAt(y), loc = [g[1] * k * Math.sin(th), y, g[3] + g[2] * k * Math.cos(th)]; return v3.lerp(Rp(loc), Rt(loc), g[4]); };
  const seen = (y, th) => { const g = ringAt(y), n = [Math.sin(th) / g[1], 0, Math.cos(th) / g[2]]; return dep(v3.lerp(Rp(n), Rt(n), g[4])) > .02; };
  const S2 = (y, th, k) => pr(surf(y, th, k));
  const axA = pr(Rp([0, 0, 0])), axB = pr(Rt([0, -2.1, 0])), axL = Math.hypot(axB[0] - axA[0], axB[1] - axA[1]) || 1, nP = [-(axB[1] - axA[1]) / axL, (axB[0] - axA[0]) / axL];
  // the outline between two heights: the extreme points of each ring across the body's axis
  const outlineOf = (ys, k = 1) => { const Lf = [], Rg = [];
    for (const y of ys) { let mn = null, mx = null; for (let j = 0; j < 36; j++) { const q = S2(y, j / 36 * Math.PI * 2, k), v = q[0] * nP[0] + q[1] * nP[1];
      if (!mn || v < mn.v) mn = { v, q }; if (!mx || v > mx.v) mx = { v, q }; } Lf.push(mn.q); Rg.push(mx.q); }
    return { Lf, Rg, pts: Lf.concat(Rg.slice().reverse()) }; };
  const ysOf = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  const visTh = (y, a, b, n = 12) => { const out = []; for (let i = 0; i <= n; i++) { const th = a + (b - a) * i / n; if (seen(y, th)) out.push(th); } return out; };
  const band = (y0, y1, a, b, k = 1.01) => { const t0 = visTh(y0, a, b, 16), t1 = visTh(y1, a, b, 16); if (t0.length < 2 || t1.length < 2) return null;
    return t0.map(th => S2(y0, th, k)).concat(t1.slice().reverse().map(th => S2(y1, th, k))); };
  const shade = (pts, tone, key) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const g = nid('fgt', u), r = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * .5, st = back ? [[0, tone.half], [.45, tone.core || tone.half], [1, tone.shadow]] : [[0, tone.lit], [.38, tone.half], [.74, tone.core || tone.half], [1, tone.shadow]];
    return `<defs>${linGrad(g, cx + Lp[0] * r * .8, cy + Lp[1] * r * .3, cx - Lp[0] * r * .9, cy - Lp[1] * r * .3, st)}</defs><path d="${sp(pts, true)}" fill="url(#${g})"${key ? ` stroke="${tone.outline}" stroke-width="${f(sw)}"` : ''}/>`; };
  const rimLine = (ol, a = 0, b) => { if (!rimC) return ''; const useR = nP[0] * rimDir[0] + nP[1] * rimDir[1] > 0, ln = (useR ? ol.Rg : ol.Lf).slice(a, b);
    return ln.length > 1 ? `<path d="${sp(ln)}" stroke="${rimC}" stroke-width="${f(Hh * .03)}" fill="none" opacity=".42" stroke-linecap="round"/>` : ''; };
  const stroke = (pts, col, w, op) => `<path d="${sp(pts)}" stroke="${col}" stroke-width="${f(w)}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
  const fold = (pts, tone, w = 1) => stroke(pts, tone.shadow, Hh * .045 * w, .7) + stroke(pts.map(p => [p[0] + Lp[0] * Hh * .03, p[1] + Lp[1] * Hh * .03]), tone.lit, Hh * .022 * w, .45);
  const surfLine = (a, b, n = 6, k = 1.01) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, y = lerp(a[0], b[0], t), th = lerp(a[1], b[1], t); if (seen(y, th)) out.push(S2(y, th, k)); } return out; };
  const sit = !!pose.sit;
  // ——— layers ———
  let shadowS = '', backS = '', legsS = '', bodyS = '', headS = '', frontS = '';
  // the shadows: the cast shadow (with a horizon) and the dark seat under each sole on the ground
  if (o.shadow !== false) {
    if (o.horizon != null && at[1] > o.horizon + 2) shadowS += K.castShadow(u, L, { x: at[0], y: at[1], w: W(1.6), h: (o.h || 120) * (sit ? .72 : 1), horizon: o.horizon, d: .45 });
    for (const k of ['R', 'L']) { const lg = leg[k]; if (lg.sole < ground - .06) continue; const pp = lg.pts.filter(q => q[1] > ground - .06).map(pr), xs = pp.map(q => q[0]);
      shadowS += K.contactShadow(u, (Math.min(...xs) + Math.max(...xs)) / 2, at[1] + Hh * .02, Math.max(W(.5), Math.max(...xs) - Math.min(...xs) + W(.2)), L, { ry: W(.09), opacity: .7 }); }
  }
  // the legs: the far one first; trousers, the boot's shaft with its turned top and ankle creases, the foot
  const drawLeg = k => { const lg = leg[k], top = v3.add(lg.hip, Rp([0, -.32, 0])); let s = '';
    s += limb([top, v3.lerp(lg.hip, lg.knee, .5), lg.knee, v3.lerp(lg.knee, lg.ankle, .3), v3.lerp(lg.knee, lg.ankle, .68), lg.ankle], [.8, .64, .49, .5, .4, .33], cTrou, { drapes: 2 });
    const ft = lg.pts.map(pr), hullP = (() => { const P = ft.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
      const lo = [], up = []; for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of P.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); })();
    const fTone = cBoot || skin, nearS = dep(v3.add(lg.ankle, lg.S)) > dep(v3.sub(lg.ankle, lg.S)) ? 1 : -1;
    s += shade(hullP, fTone, true);
    const solePts = FOOT.filter(q => q[1] < -.2).map(q => pr(v3.add(lg.ankle, v3.add(v3.add(v3.sc(lg.F, q[0]), v3.sc(lg.U, q[1] + .02)), v3.sc(lg.S, q[2] * nearS)))));
    if (cBoot) s += stroke(solePts, fTone.outline, W(.06), .9) + stroke(solePts.map(p => [p[0], p[1] - W(.05)]), fTone.lit, W(.02), .4);
    if (cBoot && dr.boot !== 'shoe') { const kA = (t) => v3.lerp(lg.knee, lg.ankle, t);
      s += limb([kA(.12), kA(.55), v3.add(lg.ankle, v3.sc(lg.U, -.06))], [.56, .5, .44], cBoot, { drapes: 1 });
      const tb = { lit: mix(fTone.lit, '#ffffff', .1), half: mix(fTone.half, fTone.lit, .35), core: fTone.half, shadow: fTone.shadow, outline: fTone.outline };
      s += limb([kA(.04), kA(.2)], [.62, .58], tb, { drapes: 0, folds: false });
      const sp2 = [kA(.6), kA(.78), lg.ankle].map(pr), T2 = tube(sp2, [W(.5), W(.47), W(.44)]);
      for (const t of [.35, .6, .85]) { const i = T2.idx(t), a = T2.at(i, -.9), b = T2.at(i, .9), m = T2.at(Math.min(T2.N, i + 1), (R() - .5) * .3);
        s += `<path d="M${P2(a)}Q${P2(m)} ${P2(b)}" stroke="${fTone.shadow}" stroke-width="${f(W(.035))}" fill="none" opacity=".75"/>`; } }
    if (dr.boot === 'shoe' && cBoot) { const b = pr(v3.add(lg.ankle, v3.add(v3.sc(lg.F, .42), v3.sc(lg.U, .02)))); s += K.shadeSphere(u, b[0], b[1], W(.06), L, 'brass', { outline: .2 }); }
    return s; };
  const legOrder = ['R', 'L'].sort((a, b) => dep(v3.lerp(leg[a].hip, leg[a].ankle, .5)) - dep(v3.lerp(leg[b].hip, leg[b].ankle, .5)));
  // the coat's skirts (knee length): the back panel under the legs, a front panel over each thigh
  const knee = cCoat && dr.coatLen === 'knee';
  if (knee) { const ol = outlineOf([-.3, .25], 1.04), a = ol.Lf[1], b = ol.Rg[1], hem = W(sit ? .5 : 1.6);
    backS += shade([ol.Lf[0], a, [a[0] - W(.1), a[1] + hem], [lerp(a[0], b[0], .5), a[1] + hem + W(.05)], [b[0] + W(.1), b[1] + hem], b, ol.Rg[0]], cCoat, true);
    for (const t of [.3, .7]) backS += fold([[lerp(a[0], b[0], t), a[1] + W(.2)], [lerp(a[0], b[0], t) + W(.03), a[1] + hem * .6], [lerp(a[0] - W(.1), b[0] + W(.1), t), a[1] + hem]], cCoat, .8); }
  const panel = k => { const lg = leg[k], sd = lg.sd, w0 = S2(-.3, sd * .28, 1.04), th1 = visTh(-.3, sd * .3, sd * 1.7).pop(), w1 = th1 != null ? S2(-.3, th1, 1.05) : w0;
    const kp = pr(v3.lerp(lg.hip, lg.knee, sit ? .5 : .72)), hp = pr(lg.hip), dx = kp[0] - hp[0], dy = kp[1] - hp[1], l = Math.hypot(dx, dy) || 1, n = [-dy / l * W(.42), dx / l * W(.42)];
    let b0 = [kp[0] + n[0], kp[1] + n[1]], b1 = [kp[0] - n[0], kp[1] - n[1]]; if (Math.hypot(b0[0] - w1[0], b0[1] - w1[1]) < Math.hypot(b1[0] - w1[0], b1[1] - w1[1])) [b0, b1] = [b1, b0];
    const pts = [w0, w1, [lerp(w1[0], b1[0], .5) + (b1[0] - w1[0]) * .04, lerp(w1[1], b1[1], .5)], b1, b0, [lerp(w0[0], b0[0], .5), lerp(w0[1], b0[1], .5)]];
    let s = shade(pts, cCoat, true);
    for (let i = 1; i <= 2; i++) { const t = i / 3, a = [lerp(w0[0], w1[0], t), lerp(w0[1], w1[1], t)], b = [lerp(b0[0], b1[0], t + .05), lerp(b0[1], b1[1], t + .05)];
      s += fold([a, [lerp(a[0], b[0], .5) + W(.04), lerp(a[1], b[1], .5)], b], cCoat, .8); }
    return s; };
  // the pelvis in the trousers (no line along its bottom, it runs into the thighs)
  const pelv = outlineOf(ysOf(-.6, .25, 5));
  legsS += drawLeg(legOrder[0]);
  legsS += shade(pelv.pts, cTrou, false) + `<path d="${sp(pelv.Lf)}M${P2(pelv.Rg[0])}${sp(pelv.Rg).slice(sp(pelv.Rg).indexOf('C'))}" stroke="${cTrou.outline}" stroke-width="${f(sw)}" fill="none"/>`;
  legsS += drawLeg(legOrder[1]);
  if (knee) legsS += panel(legOrder[0]) + panel(legOrder[1]);
  // ——— the upper body: the outer garment over the torso, the openings, the belt or sash, the folds ———
  const outer = cCoat || cVest || cShirt, botY = cCoat && !knee ? .12 : cVest && !cCoat ? -.3 : -.38;
  const up = outlineOf(ysOf(-2.3, botY, 10), cCoat ? 1.04 : 1);
  { const cid = nid('fgc', u);
    bodyS += shade(up.pts, outer, true) + `<defs><clipPath id="${cid}"><path d="${sp(up.pts, true)}"/></clipPath></defs><g clip-path="url(#${cid})">`;
    const vee = (open, y0, y1, k = 1.02) => { const ys = ysOf(y0, y1, 7), l = ys.map(y => S2(y, -open(y), k)), r = ys.map(y => S2(y, open(y), k)); return l.concat(r.reverse()); };
    const cOpen = y => y < -1.6 ? lerp(.36, .3, (y + 2.13) / .53) : lerp(.3, .26, Math.min(1, (y + 1.6) / 1.4));
    const vOpen = y => Math.max(.02, lerp(.3, 0, (y + 2.13) / .85));
    if (cCoat) { bodyS += shade(vee(cOpen, -2.2, botY + .1), cVest || cShirt, false);
      if (cVest) { bodyS += shade(vee(vOpen, -2.2, -1.28, 1.03), cShirt, false);
        for (let y = -1.2; y < -.45; y += .19) if (seen(y, .04)) { const b = S2(y, .04, 1.03); bodyS += K.shadeSphere(u, b[0], b[1], W(.04), L, 'brass', { outline: .15 }); } }
      else bodyS += fold(surfLine([-1.9, .05], [-.6, -.04]), cShirt, .8); }
    else if (cVest) { bodyS += shade(vee(vOpen, -2.2, -1.28, 1.02), cShirt, false);
      for (let y = -1.2; y < -.45; y += .19) if (seen(y, .04)) { const b = S2(y, .04, 1.02); bodyS += K.shadeSphere(u, b[0], b[1], W(.04), L, 'brass', { outline: .15 }); } }
    else bodyS += stroke(surfLine([-2.12, .0], [-1.5, .02]), cShirt.shadow, W(.03), .7);
    // the belt or sash round the waist (inside the coat's opening when there is one)
    const bA = cCoat ? -.27 : -Math.PI, bB = cCoat ? .27 : Math.PI;
    if (cSash) { const bd = band(-.56, -.3, bA, bB, 1.04); if (bd) { bodyS += shade(bd, cSash, true);
      for (const y of [-.49, -.4]) bodyS += fold(surfLine([y, bA * .9], [y + .04, bB * .9], 8, 1.05), cSash, .7); } }
    else if (cBelt) { const bd = band(-.46, -.33, bA, bB, 1.03); if (bd) { bodyS += shade(bd, cBelt, true);
      if (seen(-.4, 0)) { const c = S2(-.4, 0, 1.04); bodyS += `<rect x="${f(c[0] - W(.07))}" y="${f(c[1] - W(.075))}" width="${f(W(.14))}" height="${f(W(.15))}" fill="none" stroke="url(#brass${u})" stroke-width="${f(W(.035))}"/>`; } } }
    // folds by tension: the shirt bunched over the belt, the short side of the waist, a raised arm pulling across
    const fT = cCoat ? (cVest || cShirt) : outer;
    if (!cCoat || !cVest) for (let i = 0; i < 5; i++) { const th = (R() - .5) * 2.4, y = -.62 - R() * .1; if (!seen(y, th)) continue;
      bodyS += fold([S2(y + .06, th - .14), S2(y - .02, th), S2(y + .06, th + .14)], fT, .7); }
    const pr0 = (pose.pelvis || [0])[0], tr0 = (pose.torso || [0])[0];
    if (Math.abs(pr0 - tr0) > 4) { const sd = -Math.sign(pr0 - tr0); for (const y of [-1.0, -.86, -.72]) bodyS += fold(surfLine([y, sd * 1.05], [y + .05, sd * 1.5], 4, 1.01), outer, .8); }
    for (const k of ['R', 'L']) { const a = arm[k], d = v3.nrm(v3.sub(a.E, a.S)); if (d[1] > .55) continue;
      bodyS += fold(surfLine([-1.62, a.sd * 1.0], [-.75, -a.sd * .15], 7), outer, .9) + fold(surfLine([-1.5, a.sd * 1.15], [-.95, a.sd * .25], 5), outer, .7); }
    if (Math.abs(((pose.torso || [])[2] || 0) - ((pose.pelvis || [])[2] || 0)) > 8) { const sd = Math.sign(((pose.torso || [])[2] || 0) - ((pose.pelvis || [])[2] || 0));
      bodyS += fold(surfLine([-1.7, sd * .9], [-.5, -sd * .5], 8), outer, .8); }
    if (cCoat) { // the coat's front edges and the lapels turned back
      for (const sd of [-1, 1]) { const e = surfLine([-2.13, sd * cOpen(-2.13)], [botY, sd * cOpen(botY)], 8, 1.04); if (e.length > 1) bodyS += stroke(e, cCoat.outline, sw * 1.2, .9);
        if (seen(-1.7, sd * .5)) { const lp = [S2(-2.1, sd * .36, 1.05), S2(-1.62, sd * .66, 1.05), S2(-1.22, sd * .3, 1.05)];
          bodyS += `<path d="${sp(lp, true)}" fill="${mix(cCoat.half, cCoat.lit, .25)}" stroke="${cCoat.outline}" stroke-width="${f(sw)}"/>`; } } }
    bodyS += '</g>' + rimLine(up, 1, 9);
  }
  // ——— the neck, the collar (or kerchief), the head, the hat ———
  const neckB = Rt([0, -1.98, -.02]), neckT = v3.add(headC3, Rt([0, .3, -.15]));   // its top end inside the jaw
  const nTone = { lit: skin.half, half: mix(skin.half, skin.shadow, .3), core: mix(skin.half, skin.shadow, .5), shadow: skin.shadow, outline: skin.outline };
  headS += limb([neckB, neckT], [.44, .38], nTone, { folds: false, rim: rimC, drapes: 0 });
  { const sOpen = y => Math.max(.02, lerp(.22, 0, (y + 2.3) / .5)), ys = ysOf(-2.3, -1.8, 6), l = ys.map(y => S2(y, -sOpen(y), 1.03)), rr = ys.map(y => S2(y, sOpen(y), 1.03));
    if (seen(-2.1, 0)) headS += `<path d="${sp(l.concat(rr.reverse()), true)}" fill="${nTone.half}"/><path d="${sp(l)}M${P2(rr[0])}${sp(rr).slice(sp(rr).indexOf('C'))}" stroke="${cShirt.shadow}" stroke-width="${f(sw)}" fill="none" opacity=".8"/>`
      + stroke(ysOf(-2.05, -1.85, 3).map(y => S2(y, .0, 1.03)), skin.shadow, W(.03), .35); }
  headS += `<path d="${sp([pr(v3.lerp(neckB, neckT, .5)), pr(neckT)])}" stroke="${skin.shadow}" stroke-width="${f(W(.2))}" opacity=".35" stroke-linecap="round"/>`;
  { const col = cShirt, cb = [], ct = [];
    for (const th of visTh(-2.25, -Math.PI * .55, Math.PI * .55, 14)) { if (Math.abs(th) < .2) continue; cb.push([th, S2(-2.2, th, 1.12)]); ct.push([th, S2(-2.4, th, 1.2)]); }
    for (const sd of [-1, 1]) { const a = cb.filter(q => q[0] * sd > 0).map(q => q[1]), b = ct.filter(q => q[0] * sd > 0).map(q => q[1]); if (a.length < 2) continue;
      const tip = S2(-2.0, sd * .22, 1.1), pts = sd < 0 ? a.concat([tip]).concat(b.reverse()) : [tip].concat(a.reverse()).concat(b);
      headS += `<path d="${sp(pts, true)}" fill="${col.half}" stroke="${col.outline}" stroke-width="${f(sw)}"/>`; }
    if (dr.kerchief) { const kt = T(dr.kerchief), bd = band(-2.16, -2.02, -1.4, 1.4, 1.1); if (bd) headS += shade(bd, kt, true);
      const c = S2(-2.0, .05, 1.15); headS += `<path d="M${P2(c)}l${f(W(-.12))} ${f(W(.42))}l${f(W(.1))} ${f(W(-.04))}l${f(W(.08))} ${f(W(.12))}l${f(W(.04))} ${f(W(-.46))}z" fill="${kt.half}" stroke="${kt.outline}" stroke-width="${f(sw)}"/>`
        + K.shadeSphere(u, c[0], c[1], W(.07), L, 'linen', { outline: .2 }).replace(/url\(#[^)]+\)/, kt.half); } }
  const hp = Object.assign({}, pose.head || {}), ho = o.head || {};
  const tt = (psi / DEG + ((pose.torso || [])[2] || 0)) / 62 + (hp.turn || 0) + (ho.turn || 0), r = Hh / 2.21;
  const hd = head34(u, Object.assign({ c: hc, r, tone: skin, light: Lp, hair: { style: 'short', color: '#2a1c12' }, white: mix('#efe6da', skin.half, .2 + dim) }, ho,
    { turn: Math.min(1.05, Math.abs(tt)), dir: mir * (tt >= 0 ? 1 : -1), nod: (hp.nod || 0) + (ho.nod || 0), tailApart: true }));
  if (hd.tail) backS = hd.tail + backS;
  headS += hd.svg;
  if (rimC) headS += require('./hat.cjs').rimArc(hd, { r, light: [-rimDir[0], -rimDir[1]], color: rimC, span: 40, width: r * .045, opacity: .32 });
  if (o.hat) { const ht = require('./hat.cjs').tricorn(u, hd, Object.assign({ r, light: Lp, rim: rimC }, o.hat)); headS += ht.back + ht.front; }
  // ——— the arms with the hands: behind the body or in front of it, by depth ———
  const hands = {}, wrist = {};
  const drawArm = k => { const a = arm[k], sTop = v3.add(a.S, Rt([0, -.14, 0])), coat = !!cCoat, tn = cCoat || cShirt, rolled = !coat && dr.sleeves === 'rolled';
    let s = '';
    const wp = pr(a.W), ep = pr(a.E), ang = Math.atan2(wp[1] - ep[1], wp[0] - ep[0]) / DEG;
    // a bare forearm narrows to the wrist, so the hand grows out of it
    if (rolled) s += limb([v3.lerp(a.E, a.W, .4), v3.lerp(a.E, a.W, .8), a.W], [.34, .26, .2], skin, { folds: false, drapes: 0 });
    const end = rolled ? v3.lerp(a.E, a.W, .55) : a.W, ck = coat ? 1.1 : 1.14;
    s += limb([sTop, v3.lerp(a.S, a.E, .5), a.E, v3.lerp(a.E, end, .5), end], coat ? [.46, .44, .4, .36, .3] : [.47, .47, .43, .4, .33], tn,
      { capA: true, roundA: .55, cuff: coat ? { from: .86, k: ck, tone: mix ? { lit: mix(tn.lit, '#ffffff', .1), half: mix(tn.half, tn.lit, .3), core: tn.half, shadow: tn.shadow, outline: tn.outline } : tn } : { from: .88, k: ck, roll: rolled }, drapes: 2 });
    if (!rolled) {
      // the cuff's mouth round the wrist: its dark inside, wider the more the forearm points at us
      const hw = W(coat ? .3 : .33) * ck / 2, fl = v3.len(v3.sub(a.W, a.E)) || 1, dz = (dep(a.W) - dep(a.E)) / fl, ry = hw * Math.max(.2, Math.abs(dz) * (dz > 0 ? .9 : .45));
      s += `<ellipse cx="${f(wp[0])}" cy="${f(wp[1])}" rx="${f(ry)}" ry="${f(hw * .94)}" transform="rotate(${f(ang)} ${f(wp[0])} ${f(wp[1])})" fill="${mix(tn.shadow, '#000000', .5)}" stroke="${tn.outline}" stroke-width="${f(sw)}"/>`;
    }
    const hs = Hh * BONE.hand / 9.5, hpose = (o.hands && o.hands[k]) || (pose.hands || {})[k] || 'relaxed';
    // the hand comes out of the sleeve: its wrist end is cut at the cuff's edge (a bare forearm: a little inside it)
    const info = { side: k, at: wp, a: ang, s: hs, m: mir, pose: hpose, tone: skin, light: Lp, L, sw: Math.max(.2, sw * .8), cut: rolled ? -.6 : 0 };
    const h = o.hand ? o.hand(u, info) : hand3(u, info);
    hands[k] = Object.assign({}, h, { at: wp, a: ang }); wrist[k] = { at: wp, a: ang, depth: dep(a.W) };
    if (!o.handsSeparate) s += h.back + h.front;
    return s; };
  const armZ = k => (dep(arm[k].E) + dep(arm[k].W)) / 2, chestZ = dep(Rt([0, -1.4, 0]));
  for (const k of ['R', 'L'].sort((a, b) => armZ(a) - armZ(b))) { const s = drawArm(k); if (armZ(k) < chestZ - .25) backS += s; else frontS += s; }
  const J = {}; for (const k of ['R', 'L']) { const lg = leg[k], a = arm[k];
    J[k] = { shoulder: pr(a.S), elbow: pr(a.E), wrist: pr(a.W), hip: pr(lg.hip), knee: pr(lg.knee), ankle: pr(lg.ankle), toe: pr(v3.add(lg.ankle, v3.sc(lg.F, .97))), heel: pr(v3.add(lg.ankle, v3.sc(lg.F, -.2))) }; }
  const layers = { shadow: shadowS, back: backS, legs: legsS, body: bodyS, head: headS, front: frontS };
  let svg = shadowS + backS + legsS + bodyS + headS + frontS;
  if (o.opacity != null && o.opacity < 1) svg = `<g opacity="${o.opacity}">${svg}</g>`;
  return { svg, layers, hands, wrist, joints: J, head: hd, neck: pr(neckB), pelvis: pr([0, 0, 0]), feet: { R: J.R.ankle, L: J.L.ankle },
    seat: sit ? pr([0, .32, -.25]) : null, top: hc[1] - r * 1.2, Hh, r, ground: at[1] };
}

module.exports = { sp, tube, cloth, hand, hand3, head, head34, hairMass, figure, FIG_POSES };
