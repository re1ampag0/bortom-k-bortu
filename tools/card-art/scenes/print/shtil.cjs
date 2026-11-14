// «Штиль» (Колода моря): dead calm at the end of a hot day. A brig stands on water like glass, her sails hang in
// folds from the yards, the flag hangs down the staff; she fired her bow gun a while ago and the smoke still stands
// over the water in a straight column, not a breath to bend it (the find of the card); the column, the brig and a
// far ship lie whole in the mirror under them. The low sun ahead, right, through the heat haze: one warm light, the
// slack canvas glows through. Nobody can move. Brief: docs/mockups/print/card-briefs.md «Штиль».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad } = K;
// the low sun ahead and to the right (kit az ~20: from the depth, a little right), warm, through the haze
const light = { time: 'dusk', key: { type: 'sun', x: 157, y: 58, color: '#ffc47a', power: .9 }, fill: { color: '#5c6e92', power: .5 },
  rim: { az: 20, color: '#ffe2b4', power: .6 }, haze: .55 };
const HZ = 91, WL = 97, WF = 93.5;   // horizon; waterlines of the near and the far ship (the glass of a sea card starts at y 129:
// the 30 units of glassy water over it carry the mirror of the brig)
const BX = 104, BS = 1;   // the brig: middle of the waterline, scale (her trucks clear the top and the medal)
const skel = { horizon: HZ, eye: 2, items: [
  ['brig (near), limp sails', 50, WL, 96, 82, 'water'], ['smoke column', 66, 89, 16, 52, 'the forecastle of the brig (the bow gun)'],
  ['far ship', 150, WF, 46, 36, 'water'], ['sun', 150, 65, 14, 14, 'sky'], ['weed', 16, 160, 44, 4, 'water']] };

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
    const lx = t => hc - hw * lerp(.97, fw, Math.pow(t, .8)) + Math.sin(t * 5 + r() * 6) * .25, rx = t => hc + hw * lerp(.97, fw, Math.pow(t, .8)) + Math.sin(t * 6 + r() * 6) * .25;
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push(pt(rx(t), a[1] - ht * t)); }
    // the foot: the clews hang lowest, the middle sags in two or three soft scallops
    const sc = 2 + Math.floor(r() * 2), ph = r() * 6;
    for (let i = 1; i < n; i++) { const t = i / n, X = lerp(rx(1), lx(1), t), H = fy + ht * (.025 + .022 * Math.sin(t * Math.PI * sc + ph) + .075 * Math.sin(Math.PI * t)); pts.push(pt(X, H)); }
    for (let i = n; i >= 0; i--) { const t = i / n; pts.push(pt(lx(t), a[1] - ht * t)); }
    const d = smooth(pts), A = pt(hc, a[1]), B = pt(hc, fy), id = nid('sl', u), ci = nid('sc', u);
    // the tone down the sail: a dark band of the yard's shadow, the glow through the body, the foot rolled
    defs += linGrad(id, A[0], A[1], B[0], B[1], [[0, deep], [.08, glow], [.55, mix(glow, ridge, .35)], [.9, glow], [1, deep]]) + `<clipPath id="${ci}"><path d="${d}"/></clipPath>`;
    let inn = '';
    // folds: from points of the head down, of their own width and depth, running out before the foot
    const nf = Math.max(3, Math.round(hw * 2 / (far ? 4.2 : 2.6)));
    for (let k = 0; k < nf; k++) {
      const t = (k + .25 + r() * .5) / nf, X = lerp(hc - hw, hc + hw, t), w = (.5 + r() * .9) * (far ? 1.3 : 1), len = ht * (.55 + r() * .45), lean = (t - .5) * hw * -.12 + (r() - .5) * .6;
      const g = nid('sf', u), p0 = pt(X, a[1] + .2), p1 = pt(X + lean, a[1] - len), m = pt(X + lean * .5 - w, a[1] - len * .5), m2 = pt(X + lean * .5 + w, a[1] - len * .5);
      defs += linGrad(g, m[0], m[1], m2[0], m2[1], [[0, deep, 0], [.38, deep, .5 + r() * .3], [.62, deep, .2], [1, ridge, 0]]);
      inn += `<path d="M${P(p0)}Q${P(m)} ${P(p1)}Q${P(m2)} ${P(p0)}Z" fill="url(#${g})"/>`;
      if (!far && r() > .35) { const q = pt(X + w * 1.1 + lean * .3, a[1] - len * .35); inn += `<path d="M${P(pt(X + w * 1.1, a[1] - .4))}Q${P(q)} ${P(pt(X + w * 1.2 + lean * .7, a[1] - len * .8))}" stroke="${ridge}" stroke-width="${f(.28 * s)}" fill="none" opacity=".55"/>`; }
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
  const cut = [[main.top[0] - dir * .35, main.top[1] - 7.2 * z, -dir * 14 * z, 7.8 * z]];
  if (fore !== main) cut.push([fore.top[0] - dir * .3, fore.top[1] - 2.2 * z, -dir * 15 * z, 2.7 * z]);
  let limp = '';
  { // the flag: hanging from the head of its staff, the stripes run down it, folds across
    const h0 = [main.top[0] - dir * .15 * s, main.top[1] - 6.4 * z], len = 5.4 * z, wd = 1.9 * z, stripes = [L.tone('ship-flag-red', dz), L.tone('linen', dz), L.tone('water-wet', dz + .2)].map(col), id = nid('fl', u);
    const sway = t => -dir * (Math.sin(t * 3.1 + 1) * .25 + t * .35) * z;
    const edge = (k) => { const a = []; for (let i = 0; i <= 6; i++) { const t = i / 6; a.push([h0[0] - dir * wd * k * (1 - .25 * t) + sway(t), h0[1] + len * t]); } return a; };
    const Lf = edge(0), Rf = edge(1), d = smooth(Lf.concat(Rf.reverse()));
    defs += linGrad(id, h0[0], h0[1], h0[0] - dir * wd, h0[1], [[0, stripes[0]], [.33, stripes[0]], [.34, stripes[1]], [.66, stripes[1]], [.67, stripes[2]], [1, stripes[2]]]);
    const fd = nid('ff', u); defs += linGrad(fd, h0[0], h0[1], h0[0], h0[1] + len, [[0, deep, .5], [.3, deep, 0], [.55, deep, .35], [.8, deep, 0], [1, deep, .4]]);
    limp += `<path d="${d}" fill="url(#${id})"/><path d="${d}" fill="url(#${fd})"/>` + (far ? '' : `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(.2 * Math.sqrt(s))}"/>`);
  }
  if (fore !== main) { // the pennant: a long thin tail down the topmast, twisting
    const h0 = [fore.top[0] - dir * .2 * s, fore.top[1] - .8 * z], len = 9 * z, a = [], b = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = h0[0] - dir * (Math.sin(t * 4.2) * .6 + t * .9) * z, y = h0[1] + len * t, wd = .85 * z * (1 - .85 * t); a.push([x, y]); b.unshift([x - dir * wd, y + .1]); }
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

// ——— KIT-CANDIDATE: a ship's boat afloat, in profile, bow to the left: clinker strakes, a gunwale catching the
// light from above, a sliver of the inside, a transom. (x, y) — the middle of the waterline, len — its length.
function skiff(u, L, o) {
  const x = o.x, y = o.y, l = o.len, k = l / 14, fb = 2.1 * k, x0 = x - l / 2, x1 = x + l / 2;
  const top = t => y - fb - (1.25 * Math.pow(1 - t, 2.4) + .55 * Math.pow(t, 3)) * k;   // the sheer: up at the bow, a little at the stern
  const sideTop = [], sideBot = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; sideTop.push([lerp(x0 + .6 * k, x1, t), top(t)]); }
  const stem = [[x0 + .6 * k, top(0)], [x0 + .1 * k, top(0) + 1.2 * k], [x0 + .9 * k, y - .4 * k], [x0 + 2.4 * k, y]];
  const hull = smooth([...sideTop, [x1 + .25 * k, y - .3 * k], [x1 - .4 * k, y], ...stem.slice().reverse().slice(0, 3)].concat([[x0 + .3 * k, top(0) + .5 * k]]));
  const g = K.mat('ship-wood', L, { form: 'plane', x1: x0, y1: y - fb - 1.2 * k, x2: x1, y2: y, n: [0, -.15, 1], u }), rp = g.ramp, gw = L.ramp('oak', x, y - fb);
  let out = g.defs + `<path d="${hull}" fill="${g.fill}"/>`;
  // clinker strakes: each lap a light upper edge over its own shadow line, following the sheer
  for (const q of [.32, .58, .8]) { const a = []; for (let i = 0; i <= 10; i++) { const t = i / 10; a.push([lerp(x0 + (1.2 + q * 1.4) * k, x1 - .1 * k, t), lerp(top(t), y, q)]); }
    out += `<path d="M${a.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="${rp.shadow}" stroke-width="${f(.28 * k)}" fill="none" opacity=".8"/><path d="M${a.map(p => f(p[0]) + ' ' + f(p[1] - .3 * k)).join('L')}" stroke="${rp.half}" stroke-width="${f(.16 * k)}" fill="none" opacity=".6"/>`; }
  // the inside seen just over the near gunwale: the far side's inner planking and two thwarts
  const inner = []; for (let i = 0; i <= 10; i++) { const t = i / 10; inner.push([lerp(x0 + 1.4 * k, x1 - .2 * k, t), top(t) - .55 * k * Math.sin(Math.PI * Math.min(1, t * 1.1))]); }
  out += `<path d="M${inner.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}L${sideTop.slice().reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="${L.ramp('ship-wood', x, y).reflex}"/>`;
  for (const t of [.38, .66]) out += `<path d="M${f(lerp(x0, x1, t))} ${f(top(t) - .5 * k)}l${f(.5 * k)} ${f(.4 * k)}" stroke="${gw.half}" stroke-width="${f(.35 * k)}"/>`;
  out += `<path d="M${sideTop.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="${gw.lit}" stroke-width="${f(.45 * k)}" fill="none" stroke-linecap="round"/>`;
  out += `<path d="${hull}" fill="none" stroke="${rp.outline}" stroke-width="${f(.3 * k)}" stroke-linejoin="round"/>`;
  return { svg: out, bow: [x0 + .7 * k, top(0) + .2 * k] };
}
// ——— KIT-CANDIDATE: a raft of floating weed seen almost edge on: a flat ragged patch, olive, wet glints on the side
// of the sun, loose fronds trailing off it
function weed(u, L, o) {
  const R = rng(o.seed || 3), x = o.x, y = o.y, w = o.w, h = o.h, pts = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = .75 + R() * .35 + .15 * Math.sin(a * 3 + 1); pts.push([x + Math.cos(a) * w / 2 * r, y + Math.sin(a) * h / 2 * r]); }
  // sargasso weed: olive-brown, its tones taken from the kit's weed and ochre in the scene's light, sunk into the water's tone
  const sea = L.pal.sea[1], tw = I => mix(mix(L.tone('ship-weed', I, x, y), L.tone('paint-ochre', I, x, y), .45), sea, .35);
  const rp = { half: tw(.4), lit: tw(.9) }, sh = { shadow: tw(-.5), core: tw(-.1) }, gid = nid('wd', u);
  let out = `<ellipse cx="${f(x)}" cy="${f(y + h * .25)}" rx="${f(w * .55)}" ry="${f(h * .75)}" fill="${L.shadowTint}" opacity=".2"/>` + linGrad(gid, 0, y - h / 2, 0, y + h / 2, [[0, tw(.5)], [.5, tw(.1)], [1, tw(-.4)]]).replace(/^/, '<defs>') + '</defs>' + `<path d="${smooth(pts)}" fill="url(#${gid})"/>`;
  for (let i = 0; i < 9; i++) { const px = x + (R() - .5) * w * .8, py = y + (R() - .5) * h * .6, l = 2 + R() * 4; out += `<path d="M${f(px)} ${f(py)}q${f(l / 2)} ${f(-.5 - R() * .6)} ${f(l)} ${f((R() - .5) * .6)}" stroke="${R() > .5 ? rp.half : sh.shadow}" stroke-width="${f(.4 + R() * .4)}" fill="none" stroke-linecap="round" opacity=".8"/>`; }
  for (let i = 0; i < 5; i++) { const px = x + (R() - .5) * w * .9, l = 4 + R() * 6, sg = R() > .5 ? 1 : -1; out += `<path d="M${f(px)} ${f(y + h * .3)}q${f(sg * l * .5)} ${f(1 + R())} ${f(sg * l)} ${f(.4 + R())}" stroke="${sh.core}" stroke-width=".5" fill="none" opacity=".6"/>`; }
  for (let i = 0; i < 6; i++) { const px = x + (.1 + R() * .4) * w * .9, py = y - h * (.1 + R() * .3); out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(.6 + R())}" ry=".25" fill="${mix(L.keyColor, '#ffffff', .4)}" opacity="${f(.4 + R() * .4)}"/>`; }
  return out;
}

// ——— KIT-CANDIDATE: a column of smoke in a dead calm: it stands straight up from its source, its axis a plumb line;
// only the edges are lobed (the billows rolling up it), it widens upwards and its top just begins to spread. Lit from
// the side of the key light, in shade on the other; denser at the foot, thinning upwards. (x, y) — the source.
function column(u, L, o) {
  const R = rng(o.seed || 4), x = o.x, y = o.y, h = o.h, w0 = o.w0 || 2.4, w1 = o.w1 || 14, n = 40, ph = R() * 6, ph2 = R() * 6;
  const hw = t => (lerp(w0, w1, Math.pow(t, 1.25)) / 2) * (1 + .35 * Math.pow(clamp((t - .82) / .18), 2));
  const lob = (t, p) => 1 + .1 * Math.sin(t * 26 + p) + .05 * Math.sin(t * 57 + p * 2);
  const left = [], right = [];
  for (let i = 0; i <= n; i++) { const t = i / n, yy = y - h * t; left.push([x - hw(t) * lob(t, ph), yy]); right.push([x + hw(t) * lob(t, ph2), yy]); }
  // the top: a rounded crown of three billows
  const tw = hw(1), crown = [[x + tw * .8, y - h - tw * .35], [x + tw * .3, y - h - tw * .62], [x - tw * .25, y - h - tw * .55], [x - tw * .8, y - h - tw * .3]];
  const d = smooth([[x + .2, y + .4], ...right.slice(1), ...crown, ...left.slice(1).reverse(), [x - .2, y + .4]]);
  const P0 = L.pal, side = L.key && L.key.x != null ? Math.sign(L.key.x - x) || 1 : 1;
  const lit = mix(P0.smoke, L.keyColor, .5), shade = mix(P0.smoke, L.shadowTint, .55), rim = mix(lit, '#ffffff', .35), mid = mix(lit, shade, .45);
  const g = nid('cg', u), m = nid('cm', u), mg = nid('cmg', u), ci = nid('cc', u), fl = nid('cf', u);
  const box = [x - w1 * 1.4 - 4, y - h - w1 - 4, w1 * 2.8 + 8, h + w1 + 10];
  let defs = linGrad(g, x - w1 * .6 * side, 0, x + w1 * .6 * side, 0, [[0, shade], [.45, mid], [.8, lit], [1, rim]])
    + linGrad(mg, 0, y, 0, y - h - tw, [[0, '#fff', 1], [.55, '#fff', .82], [1, '#fff', .5]])
    + `<mask id="${m}" maskUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><rect x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}" fill="url(#${mg})"/></mask>`
    + `<clipPath id="${ci}"><path d="${d}"/></clipPath>`
    + `<filter id="${fl}" filterUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><feTurbulence type="fractalNoise" baseFrequency="0.09 0.05" numOctaves="2" seed="${o.seed || 4}"/><feDisplacementMap in="SourceGraphic" scale="1.2" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".35"/></filter>`;
  // the billows rolling up the column: each a soft round swelling, lit on the key side, its underside in shade
  let inn = '';
  for (let t = .06; t < 1.02; t += .055 + R() * .04) { const yy = y - h * t, r = hw(t) * (.9 + R() * .25), bg = nid('cb', u);
    defs += `<radialGradient id="${bg}" gradientUnits="userSpaceOnUse" cx="${f(x + side * r * .35)}" cy="${f(yy - r * .3)}" r="${f(r * 1.1)}"><stop offset="0" stop-color="${rim}" stop-opacity=".55"/><stop offset=".55" stop-color="${lit}" stop-opacity=".18"/><stop offset="1" stop-color="${shade}" stop-opacity="0"/></radialGradient>`;
    inn += `<path d="M${f(x - r)} ${f(yy)}Q${f(x)} ${f(yy + r * .5)} ${f(x + r)} ${f(yy)}" stroke="${shade}" stroke-width="${f(.25 + r * .08)}" fill="none" opacity=".35"/><ellipse cx="${f(x)}" cy="${f(yy - r * .2)}" rx="${f(r)}" ry="${f(r * .62)}" fill="url(#${bg})"/>`; }
  // the foot: the densest grey, warm from the shot, right at the port
  inn += `<ellipse cx="${f(x)}" cy="${f(y - 1)}" rx="${f(w0 * .9)}" ry="${f(2.4)}" fill="${mix(shade, '#3a3036', .4)}" opacity=".6"/>`;
  return `<defs>${defs}</defs><g mask="url(#${m})" opacity="${f(o.opacity != null ? o.opacity : .95)}"><g filter="url(#${fl})"><path d="${d}" fill="url(#${g})"/><g clip-path="url(#${ci})">${inn}</g></g></g>`;
}
// ——— KIT-CANDIDATE: a mirror reflection on dead-calm water: the thing turned straight down about its waterline y,
// whole and crisp (no ripples tear it), a little darker and bluer than the thing, fading out over h units; a few
// faint long glints across it where the glass catches the sky
function mirrorOf(u, L, body, y, h, op) {
  let b = body;
  for (const id of new Set([...body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))) { const n = nid('mr', u); b = b.split(`id="${id}"`).join(`id="${n}"`).split(`url(#${id})`).join(`url(#${n})`).split(`href="#${id}"`).join(`href="#${n}"`); }
  const wc = L.pal.sea[1], [r0, g0, b0] = [1, 3, 5].map(i => parseInt(wc.slice(i, i + 2), 16) / 255 * .26), fi = nid('mf', u), mk = nid('mk', u), mg = nid('mg', u);
  const defs = `<filter id="${fi}" filterUnits="userSpaceOnUse" x="-40" y="${f(y - 1)}" width="280" height="${f(h + 4)}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".74 0 0 0 ${f(r0)} 0 .74 0 0 ${f(g0)} 0 0 .76 0 ${f(b0)} 0 0 0 1 0"/><feGaussianBlur stdDeviation=".12 .3"/></filter>`
    + linGrad(mg, 0, y, 0, y + h, [[0, '#fff', 1], [.45, '#fff', .75], [1, '#fff', 0]])
    + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="-40" y="${f(y)}" width="280" height="${f(h)}"><rect x="-40" y="${f(y)}" width="280" height="${f(h)}" fill="url(#${mg})"/></mask>`;
  return `<defs>${defs}</defs><g mask="url(#${mk})" opacity="${f(op)}"><g filter="url(#${fi})"><g transform="translate(0 ${f(2 * y)}) scale(1 -1)">${b}</g></g></g>`;
}

module.exports = { name: 'Штиль', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    // a hot evening: deep blue overhead going to amber at the horizon; the sea series' water, holding the sky like glass
    L.pal = Object.assign({}, L.pal, { sky: ['#2c4870', '#6b7d9c', '#d9a274', '#ffd69c'], sea: ['#e4bc92', '#5c8496', '#1d3e52'], smoke: '#8c8590' });
    let bg = K.sky(u, L, { horizon: HZ, stars: false }) + K.sunMoon(u, L, { r: 6.5 });
    bg += K.cloud(u, L, { x: 160, y: 30, w: 96, h: 8, seed: 21, far: .55 }) + K.cloud(u, L, { x: 120, y: 48, w: 70, h: 6, seed: 33, far: .7 });
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: 0, seed: 11, glitter: 157 });
    // the heat haze over the water: a warm band that swallows the horizon
    bg += K.fog(u, L, { y: HZ - 16, h: 22, density: .4, seed: 4 });
    // mirror water: no ripple tears the reflection (mirrorOf), it reads whole and sharp
    // the far ship, bow to the left as ours: becalmed in the haze under the sun
    const far = `<g data-far="">${becalmed(u, L, { kind: 'merchant', x: 176, y: WF, scale: .44, detail: 'far', seed: 5 }).svg}</g>`;
    bg += `<g data-far="">${mirrorOf(u, L, far, WF, 34, .5)}</g>` + far;
    // the near brig: bow to the left, every sail hanging slack
    const nb = becalmed(u, L, { kind: 'brig', x: BX, y: WL, scale: BS, seed: 7 }), near = nb.svg;
    // the smoke of the bow gun: it went off a while ago from the forecastle and stands straight up over the bow in a
    // plumb column, its top just spreading; lit warm from the right by the low sun; mirrored straight down under it
    const sm = column(u, L, { x: BX - 31 * BS, y: WL - 8.6 * BS, h: 50, w0: 2.6, w1: 14, seed: 4 });
    bg += mirrorOf(u, L, near + sm, WL, 70, .82) + near;
    bg += `<path d="M${f(BX - 35 * BS)} ${WL + .3}H${f(BX + 38 * BS)}" stroke="${L.shadowTint}" stroke-width=".6" opacity=".5"/>`;
    bg += sm;
    // the glass of the water: a few long faint glints across the mirror, where it catches the sky
    { const Rg = rng(23); for (let i = 0; i < 9; i++) { const yy = WL + 2 + Math.pow(Rg(), .8) * 30, x0 = -10 + Rg() * 190, l = 14 + Rg() * 40;
      bg += `<path d="M${f(x0)} ${f(yy)}h${f(l)}" stroke="${mix(L.pal.sky[3], '#ffffff', .2)}" stroke-width="${f(.15 + Rg() * .2)}" opacity="${f(.12 + Rg() * .18)}"/>`; } }
    // the warm glow of the sun on the slack canvas and the water under it
    bg += K.localGlow(u, { x: 157, y: 88, color: '#ffc47a', power: .35, radius: 40 }, { squash: .3, core: false });
    // under the glass: a raft of weed in the near water
    bg += weed(u, L, { x: 38, y: 158, w: 44, h: 3.4, seed: 9 });
    return [bg, ''];
  } };
