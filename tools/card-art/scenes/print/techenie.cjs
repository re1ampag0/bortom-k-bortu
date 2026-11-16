// «Течение» (Колода моря): no wind at all — a hazy, still day, the sails of both ships hang slack, the pennants hang
// down — and yet the ships travel: a strong sea current runs round in a long flat loop through the frame, a river in
// the sea. The near ship is carried right along its near reach, her own churned trail behind her; the far one is
// carried left along its far reach — they pass each other going opposite ways, each to the other's place (the card:
// both teams swap their ships' places). Long streaks of foam lie along the loop, thin upstream and broad at their
// downstream heads (they point the way), and bend round its turns: the right turn in full, the inner reach turning on
// the left; dark smooth lanes and pale rippled lanes run with them, ribbons of weed stream with it, small eddies spin
// off its edge. Not «Попутный ветер» (sails full) and not «Мальстрём» (no vortex, no centre: a long open loop).
// Review fix (print-kit): the far brig's bowsprit met the near ship's and read as a tow — the brig moved right, clear
// of it; the straight lanes (both ships carried the same way) became the loop; the rock in the stream went with them.
// Brief: docs/mockups/print/card-briefs.md «Течение».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad } = K;

const HZ = 96;
// the loop on the sea, in ground units (X across, Z the distance; the eye 1 over the water): an ellipse round
// (Xc, Zc) with semi-axes A, B; a streamline is the same ellipse scaled by r; the water runs with θ (near reach to the
// right, far reach to the left). Projected: x = 100 + X·KP/Z, y = HZ + KP/Z
const LOOP = { Xc: -1.5, Zc: 25, A: 10.1, B: 14, KP: 300, r0: .55, r1: 1.45 };
const light = { time: 'day', key: { type: 'sun', x: 150, y: 28, color: '#fff4dc', power: .85 }, fill: { color: '#a9c9d6', power: .6 }, haze: .4 };
const NEAR = { kind: 'merchant', x: 88, y: 121, scale: .95, flip: true, seed: 7 };  // bow right, carried right on the near reach
const FAR = { kind: 'brig', x: 174, y: 104.5, scale: .44, detail: 'mid', seed: 5 };  // bow left, carried left on the far reach
const skel = { horizon: HZ, eye: 2.5, light: 'the hazy sun high on the right ahead: soft light, sails lit through, short shadows towards us and left',
  items: [
    ['near ship', 36, NEAR.y, 96, 76, 'on the water, slack sails, carried right on the near reach of the current'],
    ['far ship', 152, FAR.y, 40, 36, 'on the water, slack sails, carried left on the far reach'],
    ['lanes', -10, 290, 220, 194, 'foam streaks along the loop of the current, round its right turn'],
    ['weed', 20, 200, 160, 80, 'ribbons along the lanes, under the glass'],
  ] };

// ——— KIT-CANDIDATE: limp sails of a becalmed ship. kit/ship.cjs draws sails only bellied by the wind (full, reefed)
// or furled; this hangs slack square sails (and the lateen) from the yards of a ship drawn with sails: 'furled', at
// the yards' own places (the same lines as ship.cjs build(): rail, masts, QY / WY), with folds from the yard down,
// the foot sagging between loose clews. It also redraws the shrouds over the courses (in the kit they lie over the
// sails) and returns the boxes of the flags that fly in the kit, to cut them out and hang them limp.
const QY = { 4: [.36, .62, .8, .94], 3: [.4, .7, .93], 2: [.46, .86] }, WY = [.14, .108, .078, .054];
function slackRig(u, L, o) {
  const sp = K.SHIP_SPECS[o.kind], s = o.scale, dir = o.flip ? -1 : 1, x0 = o.x, y0 = o.y, hb = sp.len / 2, xAft = hb + sp.over, Lu = sp.len / 100, far = o.detail === 'far';
  const R = rng(o.seed || 7), air = far ? clamp(.36 + L.haze * .32, 0, .85) : 0, airC = mix(L.pal.sky[2], L.pal.sky[3], .55), col = c => air ? mix(c, airC, air) : c;
  const sm = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  const Y = (h, X) => h + sheer(X) * clamp(h / sp.free, 0, 1.25);
  const baseTop = X => sp.free + sp.fc[1] * (1 - sm((X - sp.fc[0] + 1.4) / 2.8)) + sp.tiers.reduce((a, t) => a + t[1] * sm((X - t[0] + 1.4) / 2.8), 0) + sp.taff * sm((X - xAft + 3.5) / 3.5);
  const rail = X => Y(baseTop(X), X);
  const pt = (X, H) => [x0 + dir * s * X, y0 - s * H];
  const P = p => f(p[0]) + ' ' + f(p[1]);
  const cl = K.MAT[sp.sail] ? sp.sail : 'canvas', dz = L.dz;
  // the cloth against the sun: lit through, a little darker where it hangs in folds
  const tn = I => col(L.tone(cl, clamp(I, -1, 1)));
  const glow = mix(tn(dz * .4), col(L.keyColor), .22), deep = tn(Math.max(-1, dz * 1.4)), ridge = mix(tn(dz * .25), col(L.keyColor), .25), ink = col(mix(L.tone(cl, -.1), '#1c0f08', .62));
  const ropeD = col(mix(L.tone('tar', dz * .5), '#17110d', .35));
  let sails = '', over = '', defs = '';
  // one hanging sail: the head along the yard (a, b), the foot at the height fy (local), its clews loose
  const sail = (a, b, fy, fw, name) => {
    const r = rng((o.seed || 7) * 31 + name.length * 7 + Math.round(a[0] * 13)), hc = (a[0] + b[0]) / 2, hw = (b[0] - a[0]) / 2, ht = a[1] - fy, n = 14;
    // the leeches hang in, concave, the clews drawn together under the weight of the cloth
    const lx = t => hc - hw * (lerp(.97, fw, Math.pow(t, .8)) - .07 * Math.sin(Math.PI * t)) + Math.sin(t * 5 + r() * 6) * .25, rx = t => hc + hw * (lerp(.97, fw, Math.pow(t, .8)) - .07 * Math.sin(Math.PI * t)) + Math.sin(t * 6 + r() * 6) * .25;
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push(pt(rx(t), a[1] - ht * t)); }
    // the foot: the clews hang lowest, the middle sags in two or three soft scallops
    const sc = 2 + Math.floor(r() * 2), ph = r() * 6;
    for (let i = 1; i < n; i++) { const t = i / n, X = lerp(rx(1), lx(1), t), H = fy + ht * (.02 + .04 * Math.abs(Math.sin(t * Math.PI * sc + ph)) + .15 * Math.sin(Math.PI * t)); pts.push(pt(X, H)); }
    for (let i = n; i >= 0; i--) { const t = i / n; pts.push(pt(lx(t), a[1] - ht * t)); }
    const d = smooth(pts), A = pt(hc, a[1]), B = pt(hc, fy), id = nid('sl', u), ci = nid('sc', u);
    // the tone down the sail: a dark band of the yard's shadow, the glow through the body, the foot rolled
    defs += linGrad(id, A[0], A[1], B[0], B[1], [[0, deep], [.08, glow], [.55, mix(glow, ridge, .35)], [.9, glow], [1, deep]]) + `<clipPath id="${ci}"><path d="${d}"/></clipPath>`;
    let inn = '';
    // folds: from points of the head down, of their own width and depth, running out before the foot
    const nf = Math.max(4, Math.round(hw * 2 / (far ? 3.2 : 1.9)));
    for (let k = 0; k < nf; k++) {
      const t = (k + .25 + r() * .5) / nf, X = lerp(hc - hw, hc + hw, t), w = (.45 + r() * .8) * (far ? 1.3 : 1), len = ht * (.78 + r() * .3), lean = (t - .5) * hw * -.12 + (r() - .5) * .6;
      const g = nid('sf', u), p0 = pt(X, a[1] + .2), p1 = pt(X + lean, a[1] - len), m = pt(X + lean * .5 - w, a[1] - len * .5), m2 = pt(X + lean * .5 + w, a[1] - len * .5);
      defs += linGrad(g, m[0], m[1], m2[0], m2[1], [[0, deep, 0], [.38, deep, .75 + r() * .25], [.6, deep, .35], [.8, ridge, .5], [1, ridge, 0]]);
      inn += `<path d="M${P(p0)}Q${P(m)} ${P(p1)}Q${P(m2)} ${P(p0)}Z" fill="url(#${g})"/>`;
      if (!far && r() > .1) { const q = pt(X + w * 1.1 + lean * .3, a[1] - len * .35); inn += `<path d="M${P(pt(X + w * 1.1, a[1] - .4))}Q${P(q)} ${P(pt(X + w * 1.2 + lean * .7, a[1] - len * .8))}" stroke="${ridge}" stroke-width="${f(.36 * s)}" fill="none" opacity=".8"/>`; }
    }
    // seams of the cloths, faint, along the hang
    if (!far) for (let X = hc - hw + 2.3; X < hc + hw - 1; X += 2.3) inn += `<path d="M${P(pt(X, a[1]))}L${P(pt(X + (X - hc) * -.04, fy))}" stroke="${deep}" stroke-width="${f(.12 * s)}" opacity=".3"/>`;
    sails += `<path d="${d}" fill="url(#${id})"/><g clip-path="url(#${ci})">${inn}</g>` + (far ? '' : `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(clamp(.3 * Math.sqrt(s) + .12, .4, .8) * .8)}" stroke-linejoin="round"/>`);
  };
  const flags = [];
  sp.masts.forEach((m, mi) => {
    const hD = rail(m.x) - 1.5, Hm = m.H - hD, rk = Math.tan((m.rake || 0) * Math.PI / 180), A = q => [m.x + rk * q * Hm, hD + q * Hm], Q = QY[m.n], qs = Q.slice();
    const rr = Lu * Math.pow(m.k, .6) * (m.n === 2 && sp.len < 80 ? .9 : 1), w = Q.map((_, i) => WY[i] * sp.len * m.k);
    for (let i = 1; i < m.n; i++) qs[i] = lerp(Q[i - 1], Q[i], i === 1 ? .5 : .62);   // the yards of a furled rig hang lowered: the slack sails hang from there
    for (let i = 0; i < m.n; i++) {
      if (i === 0 && m.aft && !m.lower) continue;
      const c = A(qs[i]), hw = w[i] * .95, fy = i === 0 ? hD + 3.6 : A(qs[i - 1])[1] + .8 * rr;
      sail([c[0] - hw, c[1] - .35 * rr], [c[0] + hw, c[1] - .35 * rr], fy, i === 0 ? .9 : .84, `m${mi}s${i}`);
    }
    if (m.aft === 'lateen') { // the lateen hangs from its slanting yard like a curtain: the aft edge falls straight down, the foot sags to the tack
      const lt = m.lat || [.105, .11, .64], F = [m.x - lt[0] * sp.len * m.k / .7, hD + Hm * .1], Pk = [m.x + lt[1] * sp.len * m.k / .7, hD + Hm * lt[2]], cx = Math.min(xAft - 1.5, Pk[0] - .8), Cw = [cx, rail(cx) + 3];
      const yd = t => [lerp(F[0], Pk[0], t), lerp(F[1], Pk[1], t) - .35];
      const pts = []; for (let i = 0; i <= 8; i++) pts.push(pt(...yd(i / 8)));
      for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push(pt(lerp(Pk[0] - .3, Cw[0], t) + Math.sin(t * Math.PI) * .5, lerp(Pk[1] - .6, Cw[1], t))); }
      for (let i = 1; i < 7; i++) { const t = i / 7; pts.push(pt(lerp(Cw[0], F[0] + 1, t), lerp(Cw[1], F[1] - .6, t) - Math.sin(t * Math.PI) * 1.4 - .4 * Math.sin(t * Math.PI * 3))); }
      const d = smooth(pts), g = nid('sl', u), ci = nid('sc', u), a = pt(...yd(.7)), b = pt(Pk[0] - 2, Cw[1]);
      defs += linGrad(g, a[0], a[1], b[0], b[1], [[0, deep], [.1, glow], [.6, mix(glow, ridge, .3)], [1, mix(glow, deep, .4)]]) + `<clipPath id="${ci}"><path d="${d}"/></clipPath>`;
      let inn = '';
      // the folds hang straight down from the yard, longer towards the high end
      for (let k = 0, nk = far ? 3 : 6; k < nk; k++) { const t = (k + .3 + R() * .4) / nk, y0p = yd(t), top = pt(...y0p), lenH = (y0p[1] - lerp(F[1], Cw[1], t)) * (.6 + R() * .35), bot = pt(y0p[0] + (R() - .5) * .8, y0p[1] - lenH), w = (.5 + R() * .7) * s, gg = nid('sf', u);
        defs += linGrad(gg, top[0] - w, top[1], top[0] + w, top[1], [[0, deep, 0], [.4, deep, .45 + R() * .25], [.7, deep, .15], [1, ridge, 0]]);
        inn += `<path d="M${P(top)}Q${f(top[0] - w)} ${f((top[1] + bot[1]) / 2)} ${P(bot)}Q${f(top[0] + w)} ${f((top[1] + bot[1]) / 2)} ${P(top)}Z" fill="url(#${gg})"/>`; }
      sails += `<path d="${d}" fill="url(#${g})"/><g clip-path="url(#${ci})">${inn}</g>` + (far ? '' : `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(.5 * Math.sqrt(s) * .8)}" stroke-linejoin="round"/>`);
    }
    // shrouds over the course (as ship.cjs draws them: from the channel to the top, with ratlines)
    const ns = m.k > .9 ? 6 : m.k > .8 ? 5 : 4, sprd = .072 * sp.len * Math.max(.75, Math.min(1.05, m.k)), hCh = rail(m.x + sprd * .5) - 1.5, xb = m.x + .9, qT = Q[0] + .035, tp = A(qT - .012), step = sprd / (ns - 1);
    const sx = (i, h) => { const b = xb + i * step; return b + (tp[0] + .12 * i - b) * (h - hCh) / (tp[1] - hCh); };
    let sh = '', rat = '';
    for (let i = 0; i < ns; i++) sh += `M${P(pt(sx(i, hCh), hCh + .2))}L${P(pt(tp[0] + .12 * i, tp[1]))}`;
    if (!far) for (let h = hCh + 2.6; h < tp[1] - 1.2; h += 1.45 * (.92 + R() * .16)) { const p = pt(sx(0, h), h), q = pt(sx(ns - 1, h), h); rat += `M${P(p)}Q${f((p[0] + q[0]) / 2)} ${f(p[1] + .12 * s)} ${P(q)}`; }
    over += `<path d="${sh}" stroke="${ropeD}" stroke-width="${f(clamp(.22 * s, .1, .5))}" fill="none"${far ? ' opacity=".5"' : ''}/>` + (rat ? `<path d="${rat}" stroke="${ropeD}" stroke-width="${f(clamp(.14 * s, .1, .5))}" fill="none" opacity=".85"/>` : '');
    flags.push({ mi, top: pt(...A(1)), H: m.H });
  });
  // the flag on its staff over the tallest mast and the pennant on the fore truck: the kit flies them; here they hang
  const main = flags.reduce((a, b) => b.H > a.H ? b : a), fore = flags[0], z = Lu * s;
  const cut = [[main.top[0] - 26 * z, main.top[1] - 9 * z, 52 * z, 9.3 * z]];
  if (fore !== main) cut.push([fore.top[0] - 22 * z, fore.top[1] - 3.2 * z, 44 * z, 3.5 * z]);
  const spar = col(L.tone('oak', dz * .6));
  let limp = '';
  { // the flag: hanging from the head of its staff, the stripes run down it, folds across
    const h0 = [main.top[0] - dir * .1 * z, main.top[1] - 6.4 * z], len = 5.4 * z, wd = 1.9 * z, stripes = [L.tone('ship-flag-red', dz), L.tone('linen', dz), L.tone('water-wet', dz + .2)].map(col), id = nid('fl', u);
    const sway = t => -dir * (Math.sin(t * 3.1 + 1) * .25 + t * .35) * z;
    const edge = (k) => { const a = []; for (let i = 0; i <= 6; i++) { const t = i / 6; a.push([h0[0] - dir * wd * k * (1 - .25 * t) + sway(t), h0[1] + len * t]); } return a; };
    const Lf = edge(0), Rf = edge(1), d = smooth(Lf.concat(Rf.reverse()));
    defs += linGrad(id, h0[0], h0[1], h0[0] - dir * wd, h0[1], [[0, stripes[0]], [.33, stripes[0]], [.34, stripes[1]], [.66, stripes[1]], [.67, stripes[2]], [1, stripes[2]]]);
    const fd = nid('ff', u); defs += linGrad(fd, h0[0], h0[1], h0[0], h0[1] + len, [[0, deep, .5], [.3, deep, 0], [.55, deep, .35], [.8, deep, 0], [1, deep, .4]]);
    limp += `<path d="M${P([main.top[0], main.top[1] + .5 * z])}L${P([main.top[0], h0[1] - .4 * z])}" stroke="${spar}" stroke-width="${f(clamp(.5 * z, .15, .6))}"/>`;
    limp += `<path d="${d}" fill="url(#${id})"/><path d="${d}" fill="url(#${fd})"/>` + (far ? '' : `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(.2 * Math.sqrt(s))}"/>`);
  }
  if (fore !== main) { // the pennant: a long thin tail down the topmast, twisting
    const h0 = [fore.top[0] - dir * .1 * z, fore.top[1] - .8 * z], len = 9 * z, a = [], b = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = h0[0] - dir * (Math.sin(t * 4.2) * .6 + t * .9) * z, y = h0[1] + len * t, wd = .85 * z * (1 - .85 * t); a.push([x, y]); b.unshift([x - dir * wd, y + .1]); }
    limp += `<path d="M${P([fore.top[0], fore.top[1] + .4 * z])}L${P([fore.top[0], h0[1] - .3 * z])}" stroke="${spar}" stroke-width="${f(clamp(.45 * z, .15, .5))}"/>`;
    limp += `<path d="${smooth(a.concat(b))}" fill="${col(L.tone('linen', dz * .8))}"/>`;
  }
  return { sails, over, defs, cut, limp, stern: pt(xAft - 1.2, rail(xAft - 1.2) - .6) };
}
// a smooth closed path through points (Catmull-Rom)
function smooth(pts) { const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
  d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d + 'Z'; }

// a becalmed ship: the kit's hull and rig with furled sails, the flags cut out, the slack sails hung over, the
// waterline cut clean (no foam on mirror water)
function becalmed(u, L, o) {
  const rig = slackRig(u, L, o), cid = nid('bc', u);
  const holes = rig.cut.map(([x, y, w, h]) => { const a = Math.min(x, x + w); return `M${f(a)} ${f(y)}h${f(Math.abs(w))}v${f(h)}h${f(-Math.abs(w))}z`; }).join('');
  const clip = `<clipPath id="${cid}"><path d="M-40 -40H240V${f(o.y + .05)}H-40Z${holes}" clip-rule="evenodd"/></clipPath>`;
  return { svg: `<defs>${clip}${rig.defs}</defs><g clip-path="url(#${cid})">${K.ship(u, L, Object.assign({}, o, { sails: 'furled' }))}</g>${rig.sails}${rig.over}${rig.limp}`, stern: rig.stern };
}

// ——— the current: the loop's streamlines. proj(r, θ) → the point on the screen; unproj(x, y) → [r, θ]
const proj = (r, th) => { const X = LOOP.Xc + LOOP.A * r * Math.cos(th), Z = LOOP.Zc + LOOP.B * r * Math.sin(th); return [100 + X * LOOP.KP / Z, HZ + LOOP.KP / Z]; };
const unproj = (x, y) => { const Z = LOOP.KP / Math.max(.3, y - HZ), X = (x - 100) * Z / LOOP.KP, u = (X - LOOP.Xc) / LOOP.A, v = (Z - LOOP.Zc) / LOOP.B; return [Math.hypot(u, v), Math.atan2(v, u)]; };
const speed = (r, th) => { const a = proj(r, th), b = proj(r, th + .002); return Math.hypot(b[0] - a[0], b[1] - a[1]) / .002 || 1; };   // screen units per radian
const span = (r, th, len) => len / speed(r, th);   // the θ that runs `len` screen units downstream from th
const depth = y => Math.max(0, y - HZ);                     // the scale of things on the water at y (0 at the horizon)
const P2 = p => f(p[0]) + ' ' + f(p[1]);
// a tapered strip along the streamline r from th0 (upstream) to th1 (downstream): its half-width grows with the
// depth (and a little more where the line runs up the screen, the ground not foreshortened across it); a wedge is a
// hair upstream, opening to a broad head downstream; a gentle wiggle along it
function flow(r, th0, th1, wk, ph, amp, wedge) {
  const n = 22, C = [], top = [], bot = [];
  for (let i = 0; i <= n; i++) C.push(proj(r, lerp(th0, th1, i / n)));
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = C[i], a = C[Math.max(0, i - 1)], b = C[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, d = depth(p[1]);
    const off = Math.sin(t * 7 + ph) * d * amp, hw = (.05 + d * wk) * (1 + 1.6 * nx * nx) * (wedge ? Math.pow(t, .75) * Math.pow(clamp((1 - t) * 6), .6) * 1.6 : Math.pow(Math.sin(Math.PI * clamp(t * 1.05)), .5));
    top.push([p[0] + nx * (off + hw), p[1] + ny * (off + hw)]); bot.unshift([p[0] + nx * (off - hw), p[1] + ny * (off - hw)]);
  }
  return 'M' + top.concat(bot).map(P2).join('L') + 'Z';
}
// a strip of screen length len running downstream from (x, y) (back < 0: upstream of it)
const flowFrom = (x, y, len, wk, ph, amp, wedge) => { const [r, th] = unproj(x, y), d = span(r, th, Math.abs(len)); return flow(r, len < 0 ? th - d : th, len < 0 ? th : th + d, wk, ph, amp, wedge); };
const ring = (ra, rb) => { const a = [], b = []; for (let i = 0; i <= 96; i++) { const th = i / 96 * Math.PI * 2; a.push(proj(ra, th)); b.unshift(proj(rb, th)); } return 'M' + a.map(P2).join('L') + 'ZM' + b.map(P2).join('L') + 'Z'; };
function lanes(u, L, o) {
  const R = rng(o.seed), foamC = mix('#ffffff', L.keyColor, .2), dark = mix(L.pal.sea[1], L.pal.sea[2], .45), lite = mix(L.pal.sea[0], '#ffffff', .2);
  let back = '', s = '';
  // dark smooth lanes and pale rippled lanes, alternating, laid as rings of the loop; the loop's edges fade out
  const N = 16;
  for (let i = 0; i < N; i++) { const ra = lerp(LOOP.r0, LOOP.r1, i / N), rb = lerp(LOOP.r0, LOOP.r1, (i + .45 + R() * .35) / N), edge = Math.min(i + 1, N - i) < 2 ? .5 : 1;
    back += `<path d="${ring(ra, rb)}" fill-rule="evenodd" fill="${i % 2 ? dark : lite}" opacity="${f((i % 2 ? .55 : .3) * edge)}"/>`; }
  // foam streaks: wedges along the streamlines, each its own length (on the screen) and place; more of them on the
  // near reach and round the right turn, where the eye looks
  for (let i = 0; i < o.n; i++) {
    const r = lerp(LOOP.r0 + .03, LOOP.r1 - .03, R()), th = R() < .55 ? lerp(-2.2, .9, R()) : R() * Math.PI * 2, p = proj(r, th);
    if (p[0] < -30 || p[0] > 230) continue;
    const len = (14 + R() * 50) * (.4 + clamp(depth(p[1]) / 30, 0, 1.6)), wk = .014 + R() * .02, d = span(r, th, len);
    s += `<path d="${flow(r, th, th + d, wk, R() * 6, .004, true)}" fill="${foamC}" opacity="${f(.55 + R() * .4)}"/>`;
    // a broken chain of short wedges along the same line, ahead of the streak
    if (R() > .35) { let t = th + d; for (let k = 0; k < 3; k++) { t += span(r, t, 3 + R() * 6); const e = t + span(r, t, 3 + R() * 7); s += `<path d="${flow(r, t, e, wk * .9, R() * 6, 0, true)}" fill="${foamC}" opacity="${f(.3 + R() * .35)}"/>`; t = e; } }
  }
  return `<g clip-path="url(#${o.clip})">${back}${s}</g>`;
}
// small eddies spun off the stream: a short curl of foam, an open spiral (not a whirlpool)
function eddy(u, L, x, y, r, seed) {
  const R = rng(seed), c = mix('#ffffff', L.keyColor, .2), pts = [];
  for (let i = 0; i <= 22; i++) { const a = i / 22 * Math.PI * 3.2 + R() * .05, rr = r * (1 - i / 30); pts.push([x + Math.cos(a) * rr * 1.6, y + Math.sin(a) * rr * .45]); }
  return `<path d="M${pts.map(P2).join('L')}" stroke="${c}" stroke-width="${f(.25 + r * .05)}" fill="none" opacity=".55" stroke-linecap="round"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.2)}" ry="${f(r * .3)}" fill="${L.pal.sea[2]}" opacity=".18"/>`;
}
// weed streaming along a lane: a clump of two or three limp fronds from one holdfast (upstream), each a thin
// twisting ribbon that snakes downstream, with blades (leaves) on both sides laid back by the current and small
// bladders; olive-brown, lighter where a blade turns to the sun. Sizes grow with the depth (perspective).
function weed(u, L, x0, y00, len, w, seed) {
  const R = rng(seed), sc = clamp(depth(y00) / 24, .25, 3) * w / 3.6, [r0, th0] = unproj(x0, y00);
  const q0 = proj(r0, th0), q1 = proj(r0 + .01, th0), drs = .01 / (Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1);   // r per screen unit across the stream
  const leafC = ['#6e6424', '#86762c', '#5a5420', '#9a8a3a'], dark = '#2a2810';
  let back = '', front = '';
  const nf = 2 + Math.floor(R() * 2);
  for (let k = 0; k < nf; k++) {
    const lk = len * (.65 + R() * .4), ph = R() * 6, ph2 = R() * 6, side = (k - (nf - 1) / 2) * 1.1, n = 30, c = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, off = side * sc * t * 1.4 + (Math.sin(t * 7.5 + ph) * 1.1 + Math.sin(t * 15 + ph2) * .35) * sc * Math.pow(t, .6);
      c.push(proj(r0 + off * drs, th0 + span(r0, th0, lk) * t));
    }
    // the stipe: a ribbon twisting (its width swells and narrows), lighter where it shows its face
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) { const t = i / n, p = c[i], q = c[Math.min(n, i + 1)], o = c[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l,
      hw = sc * (.18 + .38 * Math.abs(Math.sin(t * 6 + ph))) * (1 - .55 * t); top.push([p[0] + nx * hw, p[1] + ny * hw]); bot.unshift([p[0] - nx * hw, p[1] - ny * hw]); }
    const id = nid('wd', u), a = c[0], b = c[n];
    back += `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, '#3e3c16'], [.25, '#7a6a2a'], [.5, '#4c4a1c'], [.75, '#8a7a34'], [1, '#5a5420', .7]])}</defs><path d="${smooth(top.concat(bot))}" fill="url(#${id})" stroke="${dark}" stroke-width="${f(.12 * sc)}" opacity=".95"/>`;
    // the blades: alternate sides, laid back downstream along the stipe, wavy, of their own length
    for (let i = 3, sd = 1; i < n - 1; i += 2 + Math.floor(R() * 2), sd = -sd) {
      const t = i / n, p = c[i], q = c[i + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + sd * (.45 + R() * .3), ll = sc * (2.2 + R() * 1.6) * (1 - .45 * t), lw = sc * (.45 + R() * .3) * (1 - .3 * t);
      const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux, bend = (R() - .5) * .8;
      const Pq = (s1, h) => [p[0] + ux * ll * s1 + vx * (h + bend * s1 * s1 * ll * .3), p[1] + uy * ll * s1 + vy * (h + bend * s1 * s1 * ll * .3)];
      const pts = [Pq(0, 0), Pq(.25, lw * .9), Pq(.6, lw), Pq(1, 0), Pq(.6, -lw * .8), Pq(.25, -lw * .7)];
      const col = leafC[Math.floor(R() * leafC.length)];
      front += `<path d="${smooth(pts)}" fill="${col}" stroke="${dark}" stroke-width="${f(.1 * sc)}" opacity=".93"/><path d="M${P2(Pq(.05, 0))}Q${P2(Pq(.5, lw * .15))} ${P2(Pq(.9, 0))}" stroke="${dark}" stroke-width="${f(.07 * sc)}" fill="none" opacity=".5"/>`;
      if (R() > .6) { const bp = Pq(.02, 0); front += `<circle cx="${f(bp[0])}" cy="${f(bp[1])}" r="${f(.28 * sc)}" fill="#9a8a36" stroke="${dark}" stroke-width="${f(.08 * sc)}"/>`; }
    }
  }
  // the holdfast: a small dark knot where the fronds start, a ripple of foam on its upstream side
  return back + front + `<ellipse cx="${f(x0)}" cy="${f(y00)}" rx="${f(.7 * sc)}" ry="${f(.45 * sc)}" fill="${dark}" opacity=".85"/>`;
}
const weedAt = (u, L, x, y, len, w, seed) => weed(u, L, x, y, len, w, seed);
// white water where the stream meets a hull: a bourrelet piled up at (x, y) (s — its size), the foam spilling
// downstream along the loop (wind: the side the spray drifts to)
function bourrelet(u, L, x, y, s, seed, wind = 1) {
  const R = rng(seed), c = mix('#ffffff', L.keyColor, .15);
  let o = K.splash(u, { x, y: y + .2, w: 7 * s, h: 3.2 * s, seed: 1 + seed * 3, L, wind }) + K.foam(u, { x: x + 3 * s * wind, y: y + .4, w: 14 * s, h: 1.6 * s, seed, L });
  for (let i = 0; i < 6; i++) o += `<path d="${flowFrom(x + 2 * wind, y + .8 + (R() - .3) * 2.4 * s, (10 + R() * 18) * s, .05 + R() * .03, R() * 6, .01, true)}" fill="${c}" opacity="${f(.55 + R() * .35)}"/>`;
  return o;
}

// a ship's churned trail behind her stern, lying upstream along the loop (k: its size — the far ship's is smaller)
function trail(u, L, o, k = 1, seed = 13) {
  const R = rng(seed), c = mix('#ffffff', L.keyColor, .2), back = o.flip ? -1 : 1, st = o.x + back * 36 * o.scale;
  let s = '';
  for (let i = 0; i < 14; i++) { const len = (14 + R() * 26) * k;
    s += `<path d="${flowFrom(st + back * (2 + R() * 6) * k, o.y + .5 * k + (R() - .3) * 4 * k, -len, .045 + R() * .03, R() * 6, .012)}" fill="${c}" opacity="${f(.55 + R() * .35)}"/>`; }
  s += K.foam(u, { x: st + back * 6 * k, y: o.y + k, w: 16 * k, h: 1.5 * k, seed: seed + 8, L });
  return s;
}
// the band of foam along the near ship's waterline, thickening towards her bow where the stream piles on her
function waterlineFoam(u, L, o) {
  const c = mix('#ffffff', L.keyColor, .15), x0 = o.x - 34 * o.scale, x1 = o.x + 35 * o.scale, n = 24, top = [], bot = [], R = rng(31);
  for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), h = (.5 + 1.3 * t * t) * (.8 + R() * .4); top.push([x, o.y - h * .45]); bot.unshift([x, o.y + h * .8]); }
  return `<path d="${smooth(top.concat(bot))}" fill="${c}" opacity=".9"/>` + K.foam(u, { x: o.x, y: o.y + .4, w: 70 * o.scale, h: 1.8, seed: 8, L });
}

module.exports = { name: 'Течение', kind: 'sea', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2.5 });
    L.pal = Object.assign({}, L.pal, { sky: ['#7fa6c0', '#a6c2d0', '#cfdcd8', '#ebe6d6'], sea: ['#7fb4b8', '#1f6474', '#0c2f3a'] });
    // ——— a hazy still sky: the sun through the haze, flat motionless clouds, a low far coast on the right
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 6.5 });
    for (const [x, y, w, h, sd, fr] of [[70, 30, 90, 9, 3, .2], [190, 52, 60, 7, 8, .4], [36, 72, 70, 6, 11, .55], [118, 84, 40, 4, 14, .75]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.fog(u, L, { y: HZ - 16, h: 18, density: .3, seed: 2 });
    { const y = HZ, far = mix(L.pal.sky[3], '#6a8a96', .5);
      bg += `<path d="M150 ${y}C158 ${y - 2} 166 ${y - 5} 174 ${y - 5.6}C182 ${y - 6} 190 ${y - 3.4} 198 ${y - 2.8}C204 ${y - 2.4} 208 ${y - 2.6} 210 ${y - 2.4}L210 ${y}Z" fill="${far}" opacity=".8"/>`; }
    // ——— the sea and the current over it
    bg += K.water(u, L, { horizon: HZ, bottom: 300, swell: .2, seed: 9, glitter: 150 });
    const cl = nid('cc', u);
    bg += `<defs><clipPath id="${cl}"><rect x="-20" y="${HZ + .3}" width="240" height="${300 - HZ}"/></clipPath></defs>`;
    bg += lanes(u, L, { seed: 3, n: 190, clip: cl });
    bg += eddy(u, L, 24, 108, 3.5, 1) + eddy(u, L, 128, 104, 2.2, 2) + eddy(u, L, 40, 136, 5, 3);
    bg += weedAt(u, L, 2, 126, 34, 3.4, 4) + weedAt(u, L, 112, 104.5, 18, 3.2, 5) + weedAt(u, L, 18, 106, 22, 3.2, 7) + weedAt(u, L, 140, 131, 34, 3.6, 8) + weedAt(u, L, 60, 136, 26, 3.4, 9);
    // ——— the far ship carried left on the far reach, the near ship carried right with her trail: they pass
    // the far ship: her trail behind her stern (right), white water at her bow (left) — she goes left
    bg += trail(u, L, FAR, .45, 17) + becalmed(u, L, FAR).svg + K.foam(u, { x: FAR.x, y: FAR.y + .2, w: 30, h: 1, seed: 6, L });
    bg += bourrelet(u, L, FAR.x - 15.2, FAR.y, .55, 2, -1) + eddy(u, L, FAR.x + 8, FAR.y + 2.4, 2.4, 6);
    bg += trail(u, L, NEAR);
    bg += becalmed(u, L, Object.assign({ detail: 'near' }, NEAR)).svg;
    bg += waterlineFoam(u, L, NEAR);
    // the near ship's bow: the water piles on it and tears round it, eddies spin off under her
    bg += bourrelet(u, L, NEAR.x + 34 * NEAR.scale, NEAR.y, 1, 1) + eddy(u, L, NEAR.x + 6, NEAR.y + 4.5, 4, 7) + eddy(u, L, NEAR.x - 22, NEAR.y + 3.2, 3, 8);
    // ——— under the glass: nothing that would stick out from under it
    let fg = '';
    return [bg, fg];
  } };
