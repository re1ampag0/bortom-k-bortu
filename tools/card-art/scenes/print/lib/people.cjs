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

// ——— a head in profile ———
// o: { c, r, dir (1 — facing right, −1 — left), tilt (deg, + nods the face down), tone (skin ramp), warm: { color,
// op } — the light on the cheek; rim: colour of the edge on the back of the head; mouth (0..1 open), eye: 'open' |
// 'wide' | 'half', look (deg: + down), brow ('calm' | 'up' | 'frown'), hairColor, beard, stubble, moustache, ear,
// lips colour; opacity }
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
  { const e = Q(.62, -.08); s += `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${f(r * .24)}" ry="${f(r * .14)}" fill="${tn.shadow}" opacity=".45"/>`; }
  s += `<path d="${sp([Q(.36, .16), Q(.6, .24), Q(.8, .2)])}" stroke="${tn.lit}" stroke-width="${f(r * .09)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
  s += `<path d="${sp([Q(.98, .27), Q(.88, .36), Q(.9, .48)])}" stroke="${tn.shadow}" stroke-width="${f(r * .05)}" fill="none" opacity=".7"/>`;
  if (o.stubble || o.beard) s += `<path d="${sp([Q(.2, .5), Q(.6, .56), Q(.96, .64), Q(.95, .84 + jaw), Q(.8, .93 + jaw * .7), Q(.45, .9 + jaw * .4), Q(.12, .74)], true)}" fill="${hairC}" opacity="${o.beard ? .95 : .3}"/>`;
  s += '</g>';
  // the profile line lit by the light in front of the face (or the back of the head by a rim)
  if (o.faceLit !== false) s += `<path d="${sp(face.slice(4, 20).map(p => Q(p[0], p[1])))}" stroke="${o.edge || tn.lit}" stroke-width="${f(Math.max(.3, r * .07))}" fill="none" opacity=".8"/>`;
  if (o.rim) s += `<path d="${sp([Q(-.98, .14), Q(-1, -.32), Q(-.74, -.8), Q(-.2, -1.04)])}" stroke="${o.rim}" stroke-width="${f(Math.max(.3, r * .08))}" fill="none" opacity=".75"/>`;
  s += `<path d="${sp(F, true)}" fill="none" stroke="${tn.outline}" stroke-width="${f(Math.max(.3, r * .06))}"/>`;
  // the nose: the wing and the nostril
  s += `<path d="${sp([Q(.96, .12), Q(.9, .2), Q(.94, .28), Q(1.04, .3)])}" stroke="${tn.outline}" stroke-width="${f(r * .045)}" fill="none" opacity=".8"/>`;
  { const n = Q(1.02, .28); s += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(r * .06)}" ry="${f(r * .03)}" fill="${tn.outline}" opacity=".7"/>`; }
  // the mouth: shut (a line and the lips' colour) or open in the song (a dark gap, the teeth's edge)
  if (mo > .05) {
    s += `<path d="${sp([Q(1.04, .47), Q(.95, .5), Q(.86, .52), Q(.95, .54 + jaw * .6), Q(1.0, .57 + jaw)], true)}" fill="#2a0a0c" stroke="${tn.outline}" stroke-width="${f(r * .03)}"/>`;
    s += `<path d="${sp([Q(1.02, .48), Q(.95, .505)])}" stroke="#f0e6dc" stroke-width="${f(r * .035)}" fill="none" opacity=".8"/>`;
    s += `<path d="${sp([Q(1.05, .44), Q(1.0, .47), Q(.9, .5)])}" stroke="${lips}" stroke-width="${f(r * .06)}" fill="none" opacity=".8"/>`;
    s += `<path d="${sp([Q(.95, .57 + jaw * .8), Q(1.02, .6 + jaw)])}" stroke="${lips}" stroke-width="${f(r * .07)}" fill="none" opacity=".8"/>`;
  } else {
    s += `<path d="${sp([Q(1.03, .5), Q(.94, .51), Q(.86, .5)])}" stroke="${mix(tn.outline, lips, .3)}" stroke-width="${f(r * .05)}" fill="none"/>`;
    s += `<path d="${sp([Q(1.05, .46), Q(1.0, .49)])}" stroke="${lips}" stroke-width="${f(r * .06)}" fill="none" opacity=".6"/>`;
  }
  if (o.moustache) s += `<path d="${sp([Q(1.05, .4), Q(.92, .44), Q(.78, .5), Q(.7, .58)])}" stroke="${hairC}" stroke-width="${f(r * .12)}" fill="none" stroke-linecap="round"/>`;
  // the eye: the white wedge seen from the side, the iris forward, the upper lid heavy with lashes, the lower lid
  { const look = (o.look || 0) * .004, ey = o.eye || 'open', op = ey === 'wide' ? 1.25 : ey === 'half' ? .55 : 1;
    const top = -.16 - .05 * op, bot = -.07 + .02 * op;
    s += `<path d="${sp([Q(.56, -.11), Q(.66, top + .01), Q(.79, -.13), Q(.68, bot)], true)}" fill="${o.white || '#efe6da'}" opacity=".95"/>`;
    const ir = Q(.74, -.115 + look * 10); s += `<ellipse cx="${f(ir[0])}" cy="${f(ir[1])}" rx="${f(r * .045)}" ry="${f(r * .065 * Math.min(1, op))}" fill="${o.iris || '#2a1a10'}"/>`;
    { const g = Q(.755, -.135); s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(r * .018)}" fill="#ffffff" opacity=".9"/>`; }
    s += `<path d="${sp([Q(.54, -.12), Q(.64, top - .01), Q(.8, -.14)])}" stroke="#1a0c08" stroke-width="${f(r * .06)}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${f(Q(.8, -.14)[0])} ${f(Q(.8, -.14)[1])}L${f(Q(.86, -.17)[0])} ${f(Q(.86, -.17)[1])}" stroke="#1a0c08" stroke-width="${f(r * .035)}" stroke-linecap="round"/>`;
    s += `<path d="${sp([Q(.6, -.07), Q(.7, bot + .005), Q(.78, -.11)])}" stroke="${tn.shadow}" stroke-width="${f(r * .03)}" fill="none" opacity=".8"/>`; }
  // the brow
  { const b = o.brow || 'calm', dy = b === 'up' ? -.07 : 0, fr = b === 'frown' ? .06 : 0;
    s += `<path d="${sp([Q(.46, -.3 + dy), Q(.66, -.36 + dy - fr * .3), Q(.86, -.3 + dy + fr)])}" stroke="${hairC}" stroke-width="${f(r * .1)}" fill="none" stroke-linecap="round"/>`; }
  // the ear
  if (o.ear !== false) { const E = [[-.06, -.16], [.1, -.12], [.14, .06], [.06, .26], [-.06, .34], [-.16, .26], [-.18, .02]].map(p => Q(p[0], p[1]));
    s += `<path d="${sp(E, true)}" fill="${tn.half}" stroke="${tn.outline}" stroke-width="${f(r * .04)}"/><path d="${sp([Q(.04, -.06), Q(.07, .08), Q(0, .2), Q(-.08, .18)])}" stroke="${tn.shadow}" stroke-width="${f(r * .04)}" fill="none"/>`; }
  if (o.opacity != null && o.opacity < 1) s = `<g opacity="${o.opacity}">${s}</g>`;
  return { svg: s, Q };
}

module.exports = { sp, tube, cloth, hand, head };
