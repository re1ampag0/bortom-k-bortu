// «Флот на горизонте» (Колода моря): a clear fresh morning. Over the rail of our ship the whole horizon is full of
// sails: a fleet of men-of-war — frigates and ships of the line, a neutral navy with plain white pennants, none of the
// four decks' colours — in two loose lines running before the wind, more hull-down behind them. On our deck everyone
// hurries: on the left a sailor hauls on a halyard to make sail, his rope running up out of the frame; on the right a
// powder boy runs to the gun with a cartridge under his arm; the gun stands run out at its port in the middle. The
// sun is low behind us on the left: the far sails shine white against the sky, the men are lit on their backs.
// Card: for the whole round every ship may play 1 card more.
// Brief: docs/mockups/print/card-briefs.md «Флот на горизонте» (the user: a neutral navy, ships of the line and
// frigates, no sides' flags; a piece of our deck in front, few people, small, drawn as contours).
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad } = K;

const HZ = 92, RAIL = 104, BASE = 128, DECK = 137;      // horizon; the top of our bulwark, its foot; where the men stand
const GUN = { x: 104, y: 120 };                          // the gun's breech seen from behind, at the port
const light = { time: 'day', haze: .2, key: { type: 'sun', az: 235, el: 24, color: '#fff0d0', power: 1 }, fill: { color: '#8db8e0', power: .55 } };
// the fleet: [x, waterline y, scale, detail], far to near; all bows to the right, before the wind from the left
const FLEET = [
  [14, 92.5, .11, 'far'], [34, 92.5, .1, 'far'], [98, 92.5, .11, 'far'], [122, 92.5, .1, 'far'], [150, 92.6, .11, 'far'], [172, 92.6, .1, 'far'], [198, 92.6, .11, 'far'],
  [44, 93.8, .19, 'far'], [86, 94, .2, 'far'], [146, 93.9, .19, 'far'], [196, 94, .2, 'far'],
  [62, 96.4, .28, 'mid'], [124, 96.6, .285, 'mid'], [182, 96.4, .27, 'mid'],
];
const skel = { horizon: HZ, eye: 4, light: 'the low morning sun behind us on the left: the far sails lit white, the men lit on their backs and left sides, shadows away to the right',
  items: [
    ['fleet', 0, 97, 210, 44, 'on the water at the horizon, fourteen men-of-war in two lines and hull-down'],
    ['bulwark', -10, BASE, 220, BASE - RAIL, 'our rail across the frame, 1 m = 24 units'],
    ['gun', 92, DECK, 24, 22, 'on our deck at the port, seen from behind'],
    ['hauler', 10, DECK + 2, 34, 46, 'stands on our deck, hauls on a halyard from aloft'],
    ['powder boy', 150, DECK + 3, 42, 46, 'runs on our deck to the gun, a cartridge under his arm'],
    ['shrouds', 40, RAIL, 40, 116, 'from our rail up and out of the frame on the left'],
  ] };

const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

module.exports = { name: 'Флот на горизонте', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, { sea: ['#86b4cc', '#3a6c86', '#16323f'], sky: ['#3a74bc', '#6a9ed2', '#b0cfe6', '#efe4cc'] });
    // ——— the sky: clean morning blue, a few small clouds high, lit from behind us
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[150, 22, 70, 13, 4, 0], [40, 46, 50, 9, 9, .2], [196, 58, 40, 7, 12, .4], [100, 70, 36, 5, 16, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 140, swell: .45, seed: 4, glitter: false });
    // ——— the fleet, far to near
    FLEET.forEach(([x, y, s, d], i) => {
      // a low haze lies on the water along the horizon: over the hulls of the far lines, under the near one
      if (i === 11) bg += K.fog(u, L, { y: HZ - 3.2, h: 5.4, density: .45, seed: 3 });
      bg += K.ship(u, L, { kind: 'warship', x, y, scale: s, flip: true, sails: 'full', detail: d, seed: 30 + i, wake: d === 'mid' });
      if (d === 'mid') bg += K.foam(u, { x, y: y + .2, w: 96 * s * .9, h: .6, seed: i, L });
    });
    // ——— our ship: the deck under the glass, the shrouds rising from the rail, the bulwark with the port and the gun
    let fg = K.deck(u, L, { horizon: HZ, top: BASE, bottom: 292, vx: 100, seed: 7, plank: 26 });
    fg += shrouds(u, L);
    fg += K.bulwark(u, L, { x1: -10, x2: 210, y: BASE, h: BASE - RAIL, kind: 'oak', posts: 26, seed: 5 });
    fg += K.gunPort(u, L, { x: GUN.x, y: BASE - 3, w: 20, h: 15, inside: true, horizon: HZ, kind: 'oak', seed: 3 });
    fg += gunFromBehind(u, L, GUN);
    // ——— the men: the hauler on the left, the powder boy on the right
    fg += hauler(u, L);
    fg += runner(u, L);
    return [bg, fg];
  } };

/** Our main shrouds: from the deadeyes over the rail up and to the left out of the frame, ratlines across. */
function shrouds(u, L) {
  const rp = L.ramp('rope', 50, 60), feet = [[48, RAIL + .2], [55, RAIL + .2], [62, RAIL + .2], [69, RAIL + .2]], tops = [[-6, -14], [6, -14], [18, -14], [30, -14]];
  let s = '';
  feet.forEach((a, i) => { const b = tops[i]; s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${rp.outline}" stroke-width="${f(1 - i * .08)}" fill="none"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${rp.lit}" stroke-width=".3" opacity=".55" transform="translate(-.3 -.2)" fill="none"/>`;
    s += K.shadeSphere(u, a[0], a[1] - 1.4, 1.6, L, 'oak', { outline: .35 }); });
  for (let t = .08; t < .95; t += .07) {
    const p = feet.map((a, i) => lerp2(a, tops[i], t));
    for (let i = 0; i < 3; i++) s += `<path d="M${f(p[i][0])} ${f(p[i][1])}Q${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2 + .8)} ${f(p[i + 1][0])} ${f(p[i + 1][1])}" stroke="${rp.outline}" stroke-width=".35" fill="none" opacity=".8"/>`;
  }
  return s;
}

/** The gun run out at the port, seen from behind and a little above: a truck carriage — two massive oak cheeks
 *  stepped down towards us, their tops and rear ends lit, the transom between them, the axletrees and four low
 *  trucks (the rear pair near and big, the front pair under the port, higher and smaller); the iron barrel lies in
 *  it, its chase running out through the port to the sea, the breech towards us: the base ring and the cascabel
 *  knob; the breeching rope from ringbolts in the side round the cascabel. */
function gunFromBehind(u, L, g) {
  const VX = 100, Y0 = DECK - 1, Y1 = BASE + 1.4, AX = g.x - VX;          // the deck under the rear and the front of the carriage
  // carriage space: X across (+ right), Y up, Z 0 at the rear .. 1 at the port -> picture (perspective towards (VX, HZ))
  const P = (X, Y, Z) => { const yg = lerp(Y0, Y1, Z), k = (yg - HZ) / (Y0 - HZ); return [VX + (AX + X) * k, yg - Y * k]; };
  const oak = L.ramp('oak', g.x, g.y + 6), iron = L.ramp('iron', g.x, g.y), rp = L.ramp('rope', g.x, g.y);
  let s = K.castShadow(u, L, { x: g.x, y: DECK, w: 22, h: 14, horizon: HZ, d: .6 }) + K.contactShadow(u, g.x, DECK, 26, L, { ry: 1.6, opacity: .65 });
  const box = (x0, x1, y0, y1, z0, z1, kind, seed, skip = {}) => {   // a block of wood: its far faces first
    const F = [];
    if (!skip.top) F.push({ pts: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], n: 'top', grain: [0, -1] });
    const cx = VX + (AX + (x0 + x1) / 2) * 1;
    if (cx > VX + 1) F.push({ pts: [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], n: 'left', grain: [0, -1] });
    else if (cx < VX - 1) F.push({ pts: [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], n: 'right', grain: [0, -1] });
    F.push({ pts: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], n: 'front', grain: [1, 0] });
    return K.shadeBox(u, F, L, kind || 'oak', { seed, outline: .4 });
  };
  // a truck seen edge-on from behind: a thick wooden disc, its rim towards us, the axle's end and its linchpin
  const truck = (X, Z, r, th, seed) => {
    const c = P(X, r, Z), k = (lerp(Y0, Y1, Z) - HZ) / (Y0 - HZ), w = th * k, h = r * k;
    return K.shadeBox(u, [{ pts: [[c[0] - w / 2, c[1] - h * .96], [c[0] + w / 2, c[1] - h * .96], [c[0] + w / 2, c[1] + h], [c[0] - w / 2, c[1] + h]], n: 'front', grain: [0, 1] }], L, 'oak', { seed, outline: .35 })
      + `<ellipse cx="${f(c[0])}" cy="${f(c[1] - h * .96)}" rx="${f(w / 2)}" ry="${f(w * .22)}" fill="${oak.lit}" stroke="${oak.outline}" stroke-width=".3"/>`
      + `<path d="M${f(c[0] - w / 2)} ${f(c[1] + h * .3)}h${f(w)}M${f(c[0] - w / 2)} ${f(c[1] - h * .35)}h${f(w)}" stroke="${oak.shadow}" stroke-width=".3" opacity=".7"/>`;
  };
  // the front trucks and axletree under the port, then the cheeks, the rear axletree and trucks in front
  s += box(-9.4, 9.4, 2.2, 4.4, .78, .9, 'oak', 11, { top: true });
  for (const sx of [-1, 1]) s += truck(sx * 11, .84, 3, 3, 20 + sx);
  // the cheeks: thick oak slabs, stepped down towards us (three steps), bolted
  for (const sx of [-1, 1]) {
    const xi = sx * 5.4, xo = sx * 9.6, x0 = Math.min(xi, xo), x1 = Math.max(xi, xo);
    s += box(x0, x1, 1.6, 12.6, .62, 1, 'oak', 3 + sx);
    s += box(x0, x1, 1.6, 10, .32, .62, 'oak', 5 + sx);
    s += box(x0, x1, 1.6, 7.4, 0, .32, 'oak', 7 + sx);
    for (const [Y, Z] of [[3.4, 0], [5.8, 0], [8.6, .32]]) { const b = P((x0 + x1) / 2, Y, Z); s += K.shadeSphere(u, b[0], b[1], .5, L, 'iron', { outline: .2 }); }
    // the capsquare over the trunnion
    { const a = P(x0 - .2, 12.9, .62), b = P(x1 + .2, 12.9, .78); s += `<rect x="${f(a[0])}" y="${f(b[1] - .9)}" width="${f(b[0] - a[0])}" height="${f(a[1] - b[1] + 1.2)}" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".3"/>`; }
  }
  // the transom between the cheeks and the bed under the breech with its quoin
  s += box(-5.4, 5.4, 1.6, 5.2, .34, .5, 'oak', 9);
  s += box(-4.6, 4.6, 5.2, 6.6, .05, .4, 'oak', 13);
  s += box(-2.6, 2.6, 6.6, 8.2, .02, .2, 'oak', 15);
  // the rear axletree and the rear trucks, low and broad
  s += box(-12.8, 12.8, 1.6, 3.4, .04, .16, 'oak', 17, { top: false });
  for (const sx of [-1, 1]) s += truck(sx * 11.6, .08, 2.8, 3.4, 30 + sx);
  // the breeching: from the ringbolts in the side round the cascabel
  const cas = P(0, 13, -.12), rb = [P(-13, 9, .98), P(13, 9, .98)];
  const br = `M${f(rb[0][0])} ${f(rb[0][1])}Q${f(cas[0] - 9)} ${f(cas[1] + 5)} ${f(cas[0] - 1.4)} ${f(cas[1] + .8)}M${f(rb[1][0])} ${f(rb[1][1])}Q${f(cas[0] + 9)} ${f(cas[1] + 5)} ${f(cas[0] + 1.4)} ${f(cas[1] + .8)}`;
  for (const p of rb) s += K.shadeSphere(u, p[0], p[1], .8, L, 'iron', { outline: .3 });
  // the barrel: the chase runs away from us out through the port, the breech lies between the cheeks
  { const a = P(0, 13, 1.25), b = P(0, 13, .02), ka = (lerp(Y0, Y1, 1.25) - HZ) / (Y0 - HZ);
    s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 5.4, L, 'iron', { r1: 3.4 * ka, r2: 5.4, ell: .3, outline: .45 });
    // the reinforce rings across the barrel, the vent on top
    for (const z of [.35, .7]) { const q = P(0, 13, z), kq = (lerp(Y0, Y1, z) - HZ) / (Y0 - HZ), r = (5.4 - z * 1.4) * kq;
      s += `<path d="M${f(q[0] - r)} ${f(q[1])}A${f(r)} ${f(r * .35)} 0 0 0 ${f(q[0] + r)} ${f(q[1])}" stroke="${iron.shadow}" stroke-width=".7" fill="none"/><path d="M${f(q[0] - r)} ${f(q[1] - .5)}A${f(r)} ${f(r * .35)} 0 0 0 ${f(q[0] + r)} ${f(q[1] - .5)}" stroke="${iron.lit}" stroke-width=".35" fill="none" opacity=".6"/>`; }
    const v = P(0, 13 + 5.2, .14); s += `<rect x="${f(v[0] - .6)}" y="${f(v[1] - .5)}" width="1.2" height="1" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".2"/>`; }
  // the breech end: a round iron face with its base ring, the cascabel neck and knob standing out to us
  { const c = P(0, 13, 0);
    s += K.shadeSphere(u, c[0], c[1], 5.4, L, 'iron', { outline: .45 });
    s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="5.4" fill="none" stroke="${iron.outline}" stroke-width=".6"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="4.2" fill="none" stroke="${iron.lit}" stroke-width=".35" opacity=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="3.6" fill="none" stroke="${iron.shadow}" stroke-width=".45" opacity=".75"/>`; }
  s += `<path d="${br}" stroke="${rp.outline}" stroke-width="1.4" fill="none"/><path d="${br}" stroke="${rp.half}" stroke-width=".75" fill="none"/>`;
  s += K.shadeCyl(u, cas[0], cas[1] - .1, cas[0], cas[1] + .1, 1, L, 'iron', { outline: .3 }) + K.shadeSphere(u, cas[0], cas[1] + .6, 1.8, L, 'iron', { outline: .35 });
  return s;
}

// ——— the men: contours (lib/people.cjs): a torso of cloth, sleeves and trousers with folds and cuffs, hands with
// fingers, a head in profile. J — joints; o.dir — facing (1 right, -1 left); colours of shirt, trousers, kerchief.
function clothTone(L, c) { return { lit: mix(c, mix(L.keyColor, '#ffffff', .3), .45), half: c, core: c, shadow: mix(c, '#14202c', .45), outline: '#1a140e' }; }
// which side of a limb faces the light (the sun is behind us on the left): +1 when the spine's left normal looks left
function litOf(L, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], n = [-dy, dx]; return n[0] * L.ux + n[1] * L.uy >= 0 ? 1 : -1; }
function man(u, L, J, o) {
  const dir = o.dir, sh = clothTone(L, o.shirt), tr = clothTone(L, o.pants), kc = clothTone(L, o.kerchief), skin = { lit: '#f0c8a0', half: '#c89068', core: '#b07a54', shadow: '#7a4a32', outline: '#3a2014' }, shoe = clothTone(L, '#2a221c');
  const HS = o.hs || .5, rim = mix(L.keyColor, '#ffffff', .4);
  const ch = lerp2(J.shF, J.shN, .5), hip = J.hip, ax = hip[0] - ch[0], ay = hip[1] - ch[1], al = Math.hypot(ax, ay), nx = -ay / al, ny = ax / al;
  const T = (t, w) => [lerp(ch[0], hip[0], t) + nx * w, lerp(ch[1], hip[1], t) + ny * w];
  const arm = (a, b, c, seed) => H.cloth(u, { spine: [a, b, c], w: [4.4, 3.8, 3], tone: sh, lit: litOf(L, a, c), rim, cuff: { from: .86, k: 1.12, roll: o.rolled }, seed, capA: true, drapes: 2 });
  const leg = (a, b, c, seed) => H.cloth(u, { spine: [a, b, c], w: [6.4, 5, 4.2], tone: tr, lit: litOf(L, a, c), rim, cuff: { from: .9, k: 1.08 }, seed, capA: true, drapes: 2 });
  const foot = (an, toe) => { const d = ang(an, toe) * Math.PI / 180, l = Math.hypot(toe[0] - an[0], toe[1] - an[1]), ux = Math.cos(d), uy = Math.sin(d), px = -uy, py = ux;
    const P = (t, h) => [an[0] + ux * l * t + px * h, an[1] + uy * l * t + py * h];
    return `<path d="${H.sp([P(-.25, -1.2), P(.4, -1.3), P(1, -.6), P(1.05, .5), P(.3, 1.1), P(-.3, 1)], true)}" fill="${shoe.half}" stroke="${shoe.outline}" stroke-width=".35"/>`; };
  const hand = (wr, el, ho) => H.hand(u, Object.assign({ at: wr, a: ang(el, wr), s: HS, m: dir, pose: 'grip', tone: skin, sw: .28 }, ho));
  let s = '';
  // far limbs first
  const hF = hand(J.wrF, J.elF, o.handF || {});
  s += foot(J.anF, J.toeF) + leg(J.hip, J.knF, J.anF, 5);
  s += arm(J.shF, J.elF, J.wrF, 3) + hF.back + (o.inF || '') + hF.front;
  // the torso: a loose shirt (or jacket) to the hips, a sash at the waist
  const torso = H.sp([T(-.1, -5.4), T(.35, -5.6), T(.75, -4.8), T(1.06, -5.6), T(1.06, 5.6), T(.75, 4.6), T(.35, 5.8), T(-.1, 5)], true);
  { const g = nid('ts', u), lt = litOf(L, ch, hip), a0 = T(.5, -6 * lt), a1 = T(.5, 6 * lt);
    s += `<defs>${linGrad(g, a1[0], a1[1], a0[0], a0[1], [[0, sh.lit], [.35, sh.half], [1, sh.shadow]])}</defs><path d="${torso}" fill="url(#${g})" stroke="${sh.outline}" stroke-width=".38"/>`;
    for (const [t0, s0, t1, s1] of [[.15, 2, .65, -1], [.25, -3, .8, -2.4]]) { const p = T(t0, s0), q = T(t1, s1), m = T((t0 + t1) / 2, (s0 + s1) / 2 + 1.2); s += `<path d="M${f(p[0])} ${f(p[1])}Q${f(m[0])} ${f(m[1])} ${f(q[0])} ${f(q[1])}" stroke="${sh.shadow}" stroke-width=".45" fill="none" opacity=".7"/>`; } }
  s += H.cloth(u, { spine: [T(.86, 0), T(1.0, 0)], w: [11.4, 11.6], tone: kc, lit: 1, folds: false });
  s += foot(J.anN, J.toeN) + leg(J.hip, J.knN, J.anN, 6);
  // the neck and the head in profile, a kerchief knotted on it
  s += H.cloth(u, { spine: [J.neck, lerp2(J.neck, J.head, .5)], w: [2.8, 2.5], tone: skin, lit: 1, folds: false });
  const hd = H.head(u, { c: J.head, r: J.hr, dir, tilt: o.tilt || 0, tone: skin, faceLit: o.faceLit, rim, eye: 'open', brow: o.brow || 'frown', mouth: o.mouth || 0, hairColor: '#2a1a10', stubble: true });
  s += hd.svg;
  { const Q = hd.Q, id = nid('kh', u), a0 = Q(-1, 0), a1 = Q(.8, -.8);
    s += `<defs>${linGrad(id, a0[0], a0[1], a1[0], a1[1], [[0, kc.lit], [.5, kc.half], [1, kc.shadow]])}</defs><path d="${H.sp([Q(-1.06, .12), Q(-1.0, -.6), Q(-.5, -1.1), Q(.3, -1.12), Q(.84, -.72), Q(.62, -.54), Q(0, -.66), Q(-.5, -.34), Q(-.74, .16)], true)}" fill="url(#${id})" stroke="${kc.outline}" stroke-width=".35"/>`
      + `<path d="${H.sp([Q(-.92, -.26), Q(-1.6, .2), Q(-2.1, .8), Q(-1.7, .7), Q(-1.5, .5), Q(-1.6, 1.1), Q(-1.0, .5)], true)}" fill="${kc.shadow}" stroke="${kc.outline}" stroke-width=".3"/>`; }
  // the near arm last
  const hN = hand(J.wrN, J.elN, o.handN || {});
  s += arm(J.shN, J.elN, J.wrN, 4) + hN.back + (o.inN || '') + hN.front;
  const shadow = K.contactShadow(u, (J.anF[0] + J.anN[0]) / 2, DECK + 2, Math.abs(J.anN[0] - J.anF[0]) + 10, L, { ry: 1.4, opacity: .6 });
  return shadow + s;
}

/** The hauler: facing right, leaning back, both hands high on the halyard that runs up out of the frame; its tail
 *  hangs down past him to the deck. */
function hauler(u, L) {
  const J = { head: [30, 95.6], hr: 3.6, neck: [28.6, 99.6], shF: [30, 102.4], shN: [27.4, 103.2], hip: [22.4, 121],
    elF: [35.6, 96.6], wrF: [39.8, 89.6], elN: [33.4, 99.4], wrN: [38.4, 93.2],
    knF: [30.6, 129], anF: [35.4, DECK], toeF: [39.6, DECK + .4], knN: [19.2, 130], anN: [17, DECK + 2], toeN: [21.4, DECK + 2.4] };
  const rp = L.ramp('rope', 40, 80), top = [60, -6], hnd = [40.6, 90.6], d = [hnd[0] - top[0], hnd[1] - top[1]], k = (BASE + 6 - hnd[1]) / d[1];
  const rope = `<path d="M${f(top[0])} ${f(top[1])}L${f(hnd[0])} ${f(hnd[1])}" stroke="${rp.outline}" stroke-width=".95"/><path d="M${f(top[0])} ${f(top[1])}L${f(hnd[0])} ${f(hnd[1])}" stroke="${rp.lit}" stroke-width=".35" opacity=".6" transform="translate(-.25 0)"/>`;
  const tail = `<path d="M${f(hnd[0])} ${f(hnd[1])}Q${f(hnd[0] + d[0] * k * .4 - 4)} ${f(hnd[1] + d[1] * k * .6)} ${f(hnd[0] - 6)} ${f(BASE + 6)}" stroke="${rp.outline}" stroke-width=".9" fill="none"/>`;
  return tail + man(u, L, J, { dir: 1, shirt: '#d9cfb6', pants: '#3e4656', kerchief: '#a83a2a', tilt: -12, faceLit: false, mouth: .3, hs: .46, rolled: true, inF: rope, inN: '' });
}

/** The powder boy: facing left, running to the gun, a cartridge (a pale canvas bag of powder) under his near arm,
 *  the far arm swinging back, the far leg pushing off with the heel up. */
function runner(u, L) {
  const J = { head: [158.6, 96.2], hr: 3.6, neck: [160.2, 100.2], shF: [162.6, 102.6], shN: [160.6, 103.4], hip: [169.6, 120.4],
    elN: [162.8, 112.8], wrN: [155.6, 114.6], elF: [171.8, 108.4], wrF: [177.4, 114.6],
    knN: [160.4, 128.4], anN: [163.4, DECK + 1], toeN: [158.6, DECK + 1.6], knF: [178, 127.6], anF: [187.4, 133.4], toeF: [184.6, 136.6] };
  // the cartridge: a canvas cylinder held against his side, its tied end towards the gun
  const cv = L.ramp('canvas', 154, 112), c0 = [151.2, 111.6], c1 = [161.4, 114.4], cr = 2.4, n = [-(c1[1] - c0[1]), c1[0] - c0[0]], nl = Math.hypot(...n), nx = n[0] / nl * cr, ny = n[1] / nl * cr;
  const cart = `<path d="M${f(c0[0] + nx)} ${f(c0[1] + ny)}L${f(c1[0] + nx)} ${f(c1[1] + ny)}A${f(cr * .5)} ${f(cr)} ${f(ang(c0, c1))} 0 0 ${f(c1[0] - nx)} ${f(c1[1] - ny)}L${f(c0[0] - nx)} ${f(c0[1] - ny)}Z" fill="${cv.half}" stroke="${cv.outline}" stroke-width=".35"/>`
    + `<path d="M${f(c0[0] - nx * .6)} ${f(c0[1] - ny * .6)}L${f(c1[0] - nx * .6)} ${f(c1[1] - ny * .6)}" stroke="${cv.lit}" stroke-width=".8" opacity=".6"/>`
    + `<path d="M${f(c0[0] + nx)} ${f(c0[1] + ny)}Q${f(c0[0] - 1.6)} ${f(c0[1])} ${f(c0[0] - nx)} ${f(c0[1] - ny)}" stroke="${cv.outline}" stroke-width=".5" fill="${cv.core}"/>`;
  return man(u, L, J, { dir: -1, shirt: '#7c8ea0', pants: '#5a4a36', kerchief: '#2c4c6c', tilt: 10, mouth: .45, brow: 'up', hs: .46, inF: '', inN: cart, handN: { a: ang(J.elN, J.wrN) - 20 } });
}
