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
  [62, 96.8, .33, 'mid'], [124, 97, .34, 'mid'], [182, 96.8, .32, 'mid'],
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

/** The gun run out at the port, seen from behind: the breech ring and the cascabel knob towards us, the vent on top,
 *  the stepped cheeks of the carriage on both sides, the rear trucks, the breeching rope to ringbolts in the side. */
function gunFromBehind(u, L, g) {
  const x = g.x, y = g.y, oak = L.ramp('oak', x, y + 6), rp = L.ramp('rope', x, y);
  let s = K.castShadow(u, L, { x, y: DECK, w: 22, h: 14, horizon: HZ, d: .6 }) + K.contactShadow(u, x, DECK, 24, L, { ry: 1.4, opacity: .6 });
  // the breeching: from the ringbolts in the side round the cascabel
  s += `<path d="M${x - 15} ${y - 2}Q${x - 8} ${y + 3} ${x - 1.4} ${y + .6}M${x + 15} ${y - 2}Q${x + 8} ${y + 3} ${x + 1.4} ${y + .6}" stroke="${rp.outline}" stroke-width="1.3" fill="none"/><path d="M${x - 15} ${y - 2}Q${x - 8} ${y + 3} ${x - 1.4} ${y + .6}M${x + 15} ${y - 2}Q${x + 8} ${y + 3} ${x + 1.4} ${y + .6}" stroke="${rp.half}" stroke-width=".7" fill="none"/>`;
  for (const sx of [-1, 1]) s += K.shadeSphere(u, x + sx * 15, y - 2, .9, L, 'iron', { outline: .3 });
  // the cheeks: stepped planks seen end-on, the axle between them, the rear trucks
  for (const sx of [-1, 1]) {
    const c = x + sx * 6.6, pts = [[c - 1.5, DECK - 3], [c - 1.5, y - 1], [c - .4, y - 1], [c - .4, y + 3], [c + 1.5, y + 3], [c + 1.5, DECK - 3]];
    s += K.shadeBox(u, [{ pts, n: 'front', kind: 'oak', grain: [0, 1] }], L, 'oak', { seed: 3 + sx, outline: .4 });
    s += `<ellipse cx="${f(x + sx * 8.6)}" cy="${f(DECK - 3.2)}" rx="1.3" ry="3.2" fill="${oak.shadow}" stroke="${oak.outline}" stroke-width=".4"/>`;
  }
  s += `<rect x="${x - 7}" y="${DECK - 4.6}" width="14" height="2" fill="${oak.core}" stroke="${oak.outline}" stroke-width=".35"/>`;
  // the breech: a round iron end with its base ring, the knob of the cascabel standing out to us
  s += K.shadeSphere(u, x, y, 5.2, L, 'iron', { outline: .45 });
  s += `<circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="${L.ramp('iron', x, y).outline}" stroke-width=".6"/><circle cx="${x}" cy="${y}" r="3.6" fill="none" stroke="${L.ramp('iron', x, y).shadow}" stroke-width=".4" opacity=".7"/>`;
  s += K.shadeSphere(u, x, y + .4, 1.6, L, 'iron', { outline: .35 });
  s += `<path d="M${x - .6} ${y - 5.1}h1.2v-1h-1.2Z" fill="${L.ramp('iron', x, y).core}"/>`;
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
