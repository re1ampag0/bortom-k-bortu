// «Течение» (Колода моря): no wind at all — a hazy, still day, the sails of both ships hang slack, the pennants hang
// down — and yet the ships travel: a strong sea current runs through the frame from the far left towards the near
// right, a river in the sea. Long streaks of foam and dark smooth lanes lie along it, ribbons of weed stream with it,
// small eddies spin off its edge; it tears white past a rock (the water piles on its upstream side, a long wake
// downstream). The near ship is carried along with her own churned trail behind her and her sails hanging; the far
// one drifts stern-first on the same stream. Not «Попутный ветер» (sails full) and not «Мальстрём» (a circle): straight lanes.
// Card: both teams swap their ships' places.
// Brief: docs/mockups/print/card-briefs.md «Течение».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad } = K;

const HZ = 96;
const VP = [-40, HZ + .4];          // where the lanes of the current converge: off the frame on the left horizon (the lanes run diagonally)
const light = { time: 'day', key: { type: 'sun', x: 150, y: 28, color: '#fff4dc', power: .85 }, fill: { color: '#a9c9d6', power: .6 }, haze: .4 };
const NEAR = { kind: 'merchant', x: 92, y: 121, scale: .95, flip: true, seed: 7 };  // bow right, carried right
const FAR = { kind: 'brig', x: 160, y: 104.5, scale: .44, detail: 'mid', seed: 5 };  // bow left, carried right (stern-first)
const ROCK = { x: 186, y: 114 };
const skel = { horizon: HZ, eye: 2.5, light: 'the hazy sun high on the right ahead: soft light, sails lit through, short shadows towards us and left',
  items: [
    ['near ship', 36, NEAR.y, 96, 76, 'on the water, slack sails, carried right on the current'],
    ['far ship', 140, FAR.y, 40, 36, 'on the water, slack sails, in the stream'],
    ['rock', 176, ROCK.y, 18, 10, 'stands in the stream, water piled on its left, wake to the right'],
    ['lanes', -10, 290, 220, 194, 'foam streaks along rays from the far left horizon'],
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

// ——— the current: lanes along rays from VP. y on the ray that reaches yr at x = 200
const rayY = (yr, x) => VP[1] + (x - VP[0]) * (yr - VP[1]) / (200 - VP[0]);
const depth = y => Math.max(0, y - HZ);                     // the scale of things on the water at y (0 at the horizon)
const P2 = p => f(p[0]) + ' ' + f(p[1]);
// a tapered strip along a ray from x0 to x1, its half-width growing with the depth, a gentle wiggle along it
function strip(yr, x0, x1, wk, ph, amp) {
  const n = 18, top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = lerp(x0, x1, t), y0 = rayY(yr, x), d = depth(y0), y = y0 + Math.sin(t * 7 + ph) * d * amp, hw = (.05 + d * wk) * Math.pow(Math.sin(Math.PI * clamp(t * 1.05)), .5);
    top.push([x, y - hw]); bot.unshift([x + d * .04, y + hw]);
  }
  return 'M' + top.concat(bot).map(P2).join('L') + 'Z';
}
function lanes(u, L, o) {
  const R = rng(o.seed), foamC = mix('#ffffff', L.keyColor, .2), dark = mix(L.pal.sea[1], L.pal.sea[2], .45), lite = mix(L.pal.sea[0], '#ffffff', .2);
  let back = '', s = '';
  // dark smooth lanes and pale rippled lanes, alternating, laid as wedges between rays
  for (let i = 0; i < 26; i++) {
    const t0 = i / 26, t1 = (i + .45 + R() * .35) / 26, ya = HZ + .6 + 210 * Math.pow(t0, 1.7), yb = HZ + .6 + 210 * Math.pow(t1, 1.7);
    back += `<path d="M${P2(VP)}L210 ${f(rayY(ya, 210))}L210 ${f(rayY(yb, 210))}Z" fill="${i % 2 ? dark : lite}" opacity="${f(i % 2 ? .42 : .24)}"/>`;
  }
  // foam streaks: long and thin far off, longer, wider and broken near; each its own length and gap
  for (let i = 0; i < o.n; i++) {
    const mid = i < o.n * .6, t = mid ? R() : Math.pow(R(), 1.3), yr = mid ? HZ + 2 + 62 * t : HZ + 1 + 230 * t, x0 = -30 + R() * 210, len = 30 + R() * 110 + (mid ? 40 : t * 80), wk = (mid ? .014 : .009) + R() * .016;
    s += `<path d="${strip(yr, x0, x0 + len, wk, R() * 6, .006)}" fill="${foamC}" opacity="${f(.4 + R() * .45)}"/>`;
    // a broken chain of short dashes along the same lane, ahead of the streak
    if (R() > .45) for (let k = 0; k < 3; k++) { const xa = x0 + len + 4 + k * (6 + R() * 10); s += `<path d="${strip(yr, xa, xa + 3 + R() * 6, wk * .8, R() * 6, 0)}" fill="${foamC}" opacity="${f(.2 + R() * .3)}"/>`; }
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
// a ribbon of weed streaming along a lane: an olive-brown blade, wavy, twisting (lighter where it turns to the sun),
// small bladders along it
function weed(u, L, yr, x0, len, w, seed) {
  const R = rng(seed), n = 16, top = [], bot = [], ph = R() * 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + len * t, y0 = rayY(yr, x), d = depth(y0), y = y0 + Math.sin(t * 9 + ph) * d * .018, hw = w * d * .02 * (.4 + .6 * Math.abs(Math.sin(t * 5 + ph))) * (1 - .6 * t);
    top.push([x, y - hw]); bot.unshift([x, y + hw]);
  }
  const d = 'M' + top.concat(bot).map(P2).join('L') + 'Z', id = nid('wd', u), a = top[0], b = top[n];
  let s = `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, '#4a4a1e'], [.3, '#7a6a2a'], [.55, '#4c4a1c'], [.8, '#8a7a34'], [1, '#3e3c18', .6]])}</defs><path d="${d}" fill="url(#${id})" stroke="#2a2810" stroke-width=".25" opacity=".92"/>`;
  for (let k = 0; k < 4; k++) { const t = .1 + R() * .7, p = top[Math.round(t * n)], r = .25 + depth(p[1]) * .012; s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="#8a7a30" stroke="#2a2810" stroke-width=".2"/>`; }
  return s;
}
// the rock in the stream: dark wet stone lit on its left top; the water piles up white on its upstream (left) side and
// runs off in a long V of foam downstream (right), along the lanes
function rock(u, L, x, y) {
  // a craggy stack: angular facets, the faces towards the sun (right, up) pale grey, the others dark and wet
  const P = q => q.map(p => f(x + p[0]) + ' ' + f(y + p[1])).join('L');
  const body = [[-9, 0], [-8, -4], [-6, -6.5], [-4.5, -11], [-2, -13.5], [0, -12.5], [1.5, -15], [3.6, -12], [5.4, -9], [7.2, -7.6], [8.4, -3.6], [10, 0]];
  let s = `<path d="M${P(body)}Z" fill="#3a3832" stroke="#1a1814" stroke-width=".35"/>`;
  for (const [q, c] of [[[[1.5, -15], [3.6, -12], [5.4, -9], [7.2, -7.6], [8.4, -3.6], [10, 0], [5, 0], [3, -6], [1.2, -10]], '#9a9486'], [[[-2, -13.5], [0, -12.5], [1.2, -10], [-1, -7], [-3, -9]], '#6c675c'], [[[-8, -4], [-6, -6.5], [-4, -5], [-5.5, 0], [-9, 0]], '#2a2924']]) s += `<path d="M${P(q)}Z" fill="${c}"/>`;
  s += `<path d="M${P([[1.5, -15], [3.6, -12], [5.4, -9], [7.2, -7.6], [8.4, -3.6]])}" stroke="#ece4d0" stroke-width=".5" fill="none" opacity=".8"/>`;
  s += `<path d="M${P([[-9, -.6], [10, -.6], [10, 0], [-9, 0]])}Z" fill="#1c2a28" opacity=".6"/>`;
  // the downstream V: two foam tails along the lanes, widening, broken
  const c = mix('#ffffff', L.keyColor, .15);
  for (const [dy, len, wk] of [[-1.2, 40, .03], [1.6, 46, .035], [.2, 30, .02]]) { const yr = rayY(0, 0) + (y + dy - rayY(0, 0)) * (200 - VP[0]) / (x + 8 - VP[0]); s += `<path d="${strip(yr, x + 6, x + 6 + len, wk, 1, .01)}" fill="${c}" opacity=".7"/>`; }
  // the water piled on the upstream side and the foam round the foot
  s += K.splash(u, { x: x - 8, y: y + .3, w: 9, h: 5, seed: 1, L, wind: 1 }) + K.foam(u, { x: x + 1, y: y + .2, w: 24, h: 1.2, seed: 4, L });
  return s;
}
// the near ship's churned trail behind her stern (left), lying along the lanes, and the foam along her waterline
function trail(u, L, o) {
  const R = rng(13), c = mix('#ffffff', L.keyColor, .2), st = o.x - 36 * o.scale;
  let s = K.foam(u, { x: o.x - 2, y: o.y + .3, w: 74 * o.scale, h: 1.3, seed: 8, L });
  for (let i = 0; i < 14; i++) { const yr = rayY(0, 0) + (o.y + .5 + (R() - .3) * 4 - rayY(0, 0)) * (200 - VP[0]) / (st - VP[0]), x1 = st - 2 - R() * 6, len = 18 + R() * 40;
    s += `<path d="${strip(yr, x1 - len, x1, .045 + R() * .03, R() * 6, .012)}" fill="${c}" opacity="${f(.55 + R() * .35)}"/>`; }
  s += K.foam(u, { x: st - 6, y: o.y + 1, w: 16, h: 1.5, seed: 21, L });
  return s;
}

module.exports = { name: 'Течение', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
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
    bg += eddy(u, L, 24, 108, 3.5, 1) + eddy(u, L, 128, 104, 2.2, 2) + eddy(u, L, 60, 140, 6, 3);
    bg += weed(u, L, 150, 0, 40, 3.6, 4) + weed(u, L, 118, 120, 30, 3.6, 5) + weed(u, L, 104, 66, 24, 3.4, 7) + weed(u, L, 150, 128, 44, 4.4, 8) + weed(u, L, 196, 4, 56, 4.4, 9);
    // ——— the rock, the far ship drifting stern-first, the near ship carried with her trail
    bg += rock(u, L, ROCK.x, ROCK.y);
    bg += becalmed(u, L, FAR).svg + K.foam(u, { x: FAR.x, y: FAR.y + .2, w: 30, h: .8, seed: 6, L });
    bg += trail(u, L, NEAR);
    bg += becalmed(u, L, Object.assign({ detail: 'near' }, NEAR)).svg;
    bg += `<path d="M${f(NEAR.x - 40)} ${NEAR.y + .3}H${f(NEAR.x + 40)}" stroke="${L.shadowTint}" stroke-width=".6" opacity=".45"/>`;
    // ——— under the glass: weed streaming near, an eddy
    let fg = weed(u, L, 240, 20, 70, 3.2, 11) + weed(u, L, 300, 110, 80, 3, 12) + weed(u, L, 190, 150, 50, 3, 13) + eddy(u, L, 150, 200, 9, 4);
    return [bg, fg];
  } };
