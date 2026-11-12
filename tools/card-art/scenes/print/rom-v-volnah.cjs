// «Ром в волнах» (Колода моря, сразу: каждый корабль восстанавливает 1 Команду). After a squall: the low sun breaks
// through the storm clouds ahead of us on the left and lays a gold path on a swell strewn with rum kegs. Our longboat
// lies among them, bow to the left; a sailor kneels in the bow and leans out with a boathook — its hook is in the
// rope becket of a keg on the gold water; behind him a mate stands and hauls a second keg in to the boat's side with
// his own boathook; a keg already caught lies in the stern, another bobs by our ship. The ship that lowered the boat lies hove-to on the
// right, the other ship far on the left — both get their rum. One key light: the low sun (warm rims on the wet oak,
// the men's faces lit, their backs in cool shade). No kegs under the glass. Not «Ром для всех» (that is on deck): here the rum is in the sea.
// Brief: docs/mockups/print/card-briefs.md «Ром в волнах». Men: lib/people.cjs contours.
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, mix, lerp, clamp, nid, linGrad, radGrad, rng } = K;

const HZ = 94, WL = 114;                 // horizon (eye ~0.75 m over the water); the boat's waterline
const CAM = { x: 36, y: 30, w: 144 };   // closer in: the picture shows x 36..180, y 30..232 (the glass from y ~131)
const SUN = { x: 76, y: 66 };
const light = { time: 'day', haze: .4, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffd294', power: 1 }, fill: { color: '#56708e', power: .5 },
  rim: { az: 330, color: '#ffe2ac', power: .6 } };
// after the squall: slate clouds, a gold break round the sun, the sea steel-blue with a gold path
const PAL = { sky: ['#232c3e', '#3e4a60', '#8e8476', '#f0c88e'], sea: ['#b89a74', '#3b5a6a', '#122c3a'], cloudLit: '#ffd9a2', cloudShade: '#2a3244' };
const skel = { horizon: HZ, eye: .75, light: 'the low sun ahead-left in a break of the clouds: warm rims, faces lit, backs in shade',
  items: [
    ['keg (hooked)', 52, 122.5, 25, 17, 'on the water, 40 % under, in the gold path'],
    ['boathook A', 66, 106, 68, 18, 'from the bow man\'s hands over the near gunwale to the keg\'s becket'],
    ['sailor A', 104, 104, 26, 26, 'kneels in the bow, leans out'],
    ['sailor B', 132, 104, 22, 34, 'stands amidships'],
    ['keg 2', 110, 131, 21, 15, 'on the water by the near side of the bow, in B\'s hook'],
    ['longboat', 89, WL, 121, 16, 'water, bow left', { edge: 1 }],
    ['keg in the boat', 176, 104, 20, 6, 'the boat\'s bottom boards (only its top above the gunwale)', { edge: 1 }],
    ['keg by our ship', 160, 101, 10, 7, 'water, 40 % under, foam'],
    ['ship (ours)', 152, 95.6, 44, 42, 'water, hove-to'], ['ship (other)', 40, 95.2, 26, 22, 'far water'],
    ['kegs far', 34, 108, 120, 10, 'far water'],
  ] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const len = a => Math.hypot(a[0], a[1]), unit = a => mul(a, 1 / (len(a) || 1)), dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ——— the boat: the near sheer (gunwale top), bow left ———
const SHEER = [[89, 98.6], [96, 100.6], [106, 102.1], [120, 103.1], [140, 103.7], [165, 103.5], [190, 102.8], [212, 101.8]];
const sheerY = x => { for (let i = 1; i < SHEER.length; i++) if (x <= SHEER[i][0]) { const a = SHEER[i - 1], b = SHEER[i], t = (x - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], t * t * (3 - 2 * t)); } return SHEER[SHEER.length - 1][1]; };
const farOff = x => 3.2 * clamp((x - 89) / 16, 0, 1);         // the far gunwale shows this much over the near one

// ——— kegs: lying kit barrels, the lower 40 % under water ———
// local frame of a lying barrel: x ±15, y −21.5 (top) .. 0 (bottom), s, rot (deg)
const kegP = (k, lx, ly) => { const a = (k.rot || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return [k.x + (lx * c - ly * sn) * k.s, k.y + (lx * sn + ly * c) * k.s]; };
const KEG1 = { x: 64, y: 122.5, s: .82, rot: -7, seed: 7 }, KEG2 = { x: 120, y: 131, s: .7, rot: 5, seed: 13 };
const HOOK1 = kegP(KEG1, 1.6, -24.8), HOOK2 = kegP(KEG2, 3, -24.6);

// ——— the men ———
// heads ~15 % larger, short thick necks, broad shoulders; A leans back on the hooked keg, B hauls with his weight back
const A = { dir: -1, hip: [126.5, 101.5], sh: [119.5, 88.2], head: [115.8, 84.2], hr: 3.75, tilt: 22,
  shirt: '#e2d6bc', sash: '#9a2c22', pants: '#3a3e4c', skin: '#c98a5c', hat: 'bandana', hatC: '#a8302a', seed: 3 };
const B = { dir: -1, hip: [146, 93.5], sh: [147.4, 80.4], head: [146.6, 75.1], hr: 3.75, tilt: 14,
  shirt: '#56708e', sash: '#6a4a2a', pants: '#5e5040', skin: '#b4784e', hat: 'cap', hatC: '#2c2e36', seed: 9,
  legs: [[[[148, 92], [150, 102], [151.4, 111.6]], true], [[[144.4, 92.5], [142.8, 102.4], [141.2, 111.6]], false]] };
// the poles: from the hook up through both grips to the butt end
const POLE_A = { hook: HOOK1, end: [131, 90.6] }, POLE_B = { hook: HOOK2, end: [158, 72] };
const onPole = (P, x) => { const t = (x - P.hook[0]) / (P.end[0] - P.hook[0]); return lerp2(P.hook, P.end, t); };
const onPoleY = (P, y) => { const t = (y - P.hook[1]) / (P.end[1] - P.hook[1]); return lerp2(P.hook, P.end, t); };
A.grips = { far: onPole(POLE_A, 108), near: onPole(POLE_A, 124) };
B.grips = { far: onPoleY(POLE_B, 94), near: onPoleY(POLE_B, 88) };

function tone(L, c, k = .5) { return { lit: mix(c, mix(L.keyColor, '#ffffff', .25), .5), half: c, core: c, shadow: mix(c, '#141c2c', k), outline: '#1a120c' }; }
function litSign(L, a, b) { const d = unit(sub(b, a)), n = [-d[1], d[0]], q = L.at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return dot(n, [q.ux, q.uy]) >= 0 ? 1 : -1; }
// two-bone arm: the elbow on the side of `pref`
function elbow(S, W, l1, l2, pref) {
  const d = Math.min(len(sub(W, S)), l1 + l2 - .01), u = unit(sub(W, S)), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), th = Math.acos(c);
  const rot = a => [u[0] * Math.cos(a) - u[1] * Math.sin(a), u[0] * Math.sin(a) + u[1] * Math.cos(a)];
  const e1 = add(S, mul(rot(th), l1)), e2 = add(S, mul(rot(-th), l1));
  return dot(sub(e1, S), pref) >= dot(sub(e2, S), pref) ? e1 : e2;
}
// a grip on a pole: the wrist sits 6·hs from the pole on the side of the elbow, the thumb toward the pole's hook
function grip(u, L, G, P, elbowAt, skin, hs) {
  const d = unit(sub(P.end, P.hook)), n = [-d[1], d[0]], side = dot(n, sub(G, elbowAt)) > 0 ? n : mul(n, -1);
  const a = Math.atan2(side[1], side[0]), wr = sub(G, mul(side, 6 * hs)), tip = mul(d, -1), m = dot(tip, [Math.sin(a), -Math.cos(a)]) >= 0 ? 1 : -1;
  return { wr, a: a * 180 / Math.PI, m };
}

function sailor(u, L, o) {
  const dir = o.dir, sk = tone(L, o.skin, .45), sh = tone(L, o.shirt), pa = tone(L, o.pants), sa = tone(L, o.sash), hs = .5, rimC = '#ffe2ac';
  const up = unit(sub(o.sh, o.hip)), fr = (() => { const n = [-up[1], up[0]]; return n[0] * dir > 0 ? n : mul(n, -1); })(), tl = len(sub(o.sh, o.hip));
  const T = (t, k) => add(add(o.hip, mul(up, tl * t)), mul(fr, k));
  const shN = T(.96, -.9), shF = T(.99, .9);
  // the arms: far one to the far grip, near one to the near grip
  const arm = (S, G, pref, tn, dark) => {
    const pre = grip(u, L, G, o.pole, add(S, mul(pref, 6)), sk, hs), E = elbow(S, pre.wr, 7.8, 7.4, pref), g2 = grip(u, L, G, o.pole, E, sk, hs);
    const W = g2.wr, El = E, mid = lerp2(El, W, .3);
    const fa = H.cloth(u, { spine: [lerp2(El, W, .02), lerp2(El, W, .55), W], w: [2.8, 2.4, 1.85], tone: dark ? tone(L, mix(o.skin, '#202838', .3), .5) : sk, lit: litSign(L, El, W), folds: false, capA: true, sw: .3 });
    const sl = H.cloth(u, { spine: [S, El, mid], w: [4.4, 3.3, 3.0], tone: tn, lit: litSign(L, S, El), rim: rimC, rimW: .35, rimOp: .55, cuff: { from: .8, k: 1.12, roll: true }, capA: true, seed: o.seed, drapes: 1, foldW: .7, sw: .32 });
    const hd = H.hand(u, { at: W, a: g2.a, s: hs, m: g2.m, pose: 'grip', tone: dark ? tone(L, mix(o.skin, '#202838', .3), .5) : sk, sw: .25 });
    return { limb: fa + sl, hand: hd.front, W, E: El };
  };
  const shF2 = tone(L, mix(o.shirt, '#1c2434', .35), .5);
  const far = arm(shF, o.grips.far, o.farPref, shF2, true), near = arm(shN, o.grips.near, o.nearPref, sh, false);
  // the torso in profile: a loose shirt over the chest, the sash at the waist (the hull hides the hips)
  const back = [[-.15, -3.0], [.2, -3.15], [.5, -3.55], [.8, -3.95], [.99, -3.4], [1.1, -1.6]], front = [[1.1, 1.4], [.97, 3.6], [.75, 4.2], [.5, 3.6], [.25, 3.2], [-.15, 3.3]];
  const outline = back.concat(front).map(p => T(p[0], p[1]));
  let body = far.limb;
  // the legs (standing in the boat: the near side hides them below the gunwale)
  for (const [sp, dark] of o.legs || []) body += H.cloth(u, { spine: sp, w: [5.4, 4.6, 4.2], tone: dark ? tone(L, mix(o.pants, '#141c2c', .35), .5) : pa, lit: litSign(L, sp[0], sp[2]), seed: o.seed + 2, drapes: 1, foldW: .8, capA: true, sw: .3 });
  { const g = nid('st', u), a0 = T(.6, 4 * (dot(fr, [L.ux, L.uy]) >= 0 ? 1 : -1)), a1 = T(.6, -4 * (dot(fr, [L.ux, L.uy]) >= 0 ? 1 : -1)), cid = nid('sc', u);
    body += `<defs>${linGrad(g, a0[0], a0[1], a1[0], a1[1], [[0, sh.lit], [.35, sh.half], [1, sh.shadow]])}<clipPath id="${cid}"><path d="${H.sp(outline, true)}"/></clipPath></defs><path d="${H.sp(outline, true)}" fill="url(#${g})"/>`;
    body += `<g clip-path="url(#${cid})">`;
    // folds of the shirt from the shoulder to the sash, the shade under the arm, the open collar
    for (const [t0, k0, t1, k1] of [[.92, 1.6, .3, 2.2], [.8, -.6, .22, .4], [.95, -2, .4, -2.4], [.6, 2.6, .25, 1]]) { const p = T(t0, k0), q = T(t1, k1), m = T((t0 + t1) / 2, (k0 + k1) / 2 + .8); body += `<path d="M${P2(p)}Q${P2(m)} ${P2(q)}" stroke="${sh.shadow}" stroke-width=".45" fill="none" opacity=".7"/>`; }
    { const p = T(.7, -.4), q = T(.4, -.1); body += `<path d="M${P2(T(.96, -1.4))}Q${P2(p)} ${P2(q)}" stroke="${sh.lit}" stroke-width=".35" fill="none" opacity=".5"/>`; }
    body += `<path d="${H.sp([T(1.1, .6), T(.86, 1.9), T(.8, 2.9), T(1.1, 3.2)], true)}" fill="${sk.half}" stroke="${sh.outline}" stroke-width=".25"/>`;
    // the sash
    body += `<path d="${H.sp([T(.02, -3.4), T(.2, -3.3), T(.22, 3.3), T(.02, 3.5)], true)}" fill="${sa.half}" stroke="${sa.outline}" stroke-width=".3"/><path d="M${P2(T(.17, -3.2))}L${P2(T(.19, 3.2))}" stroke="${sa.lit}" stroke-width=".4" opacity=".6"/>`;
    body += `<path d="${H.sp([T(.02, -3.4), T(-.4, -3.3), T(-.4, 3.4), T(.02, 3.5)], true)}" fill="${pa.half}"/>`;
    body += '</g>';
    body += `<path d="${H.sp(outline, true)}" fill="none" stroke="${sh.outline}" stroke-width=".35"/>`;
    // the back of the shirt catches nothing; the front edge toward the sun a warm rim
    body += `<path d="${H.sp(front.slice(0, 5).map(p => T(p[0], p[1] + .15)))}" stroke="${rimC}" stroke-width=".4" fill="none" opacity=".55"/>`; }
  // the neck and the head in profile, the face toward the sun
  const nk = T(.97, .9);
  body += H.cloth(u, { spine: [nk, lerp2(nk, o.head, .62)], w: [3.6, 3.2], tone: sk, lit: litSign(L, nk, o.head), folds: false });
  const hd = H.head(u, { c: o.head, r: o.hr, dir, tilt: o.tilt, tone: sk, warm: { color: '#ffcf8a', op: .55 }, eye: 'open', brow: 'frown', look: 25, hairColor: '#2a1a10', stubble: true, rim: rimC, edge: mix(sk.lit, '#fff0d0', .4), lips: '#9a4a3a' });
  body += hd.svg;
  const Q = hd.Q, ht = tone(L, o.hatC, .5);
  if (o.hat === 'bandana') {
    const id = nid('bd', u), a0 = Q(-1, 0), a1 = Q(.8, -.8);
    body += `<defs>${linGrad(id, a0[0], a0[1], a1[0], a1[1], [[0, ht.shadow], [.6, ht.half], [1, ht.lit]])}</defs><path d="${H.sp([Q(-1.06, .12), Q(-1.0, -.6), Q(-.5, -1.12), Q(.3, -1.14), Q(.84, -.72), Q(.62, -.52), Q(0, -.64), Q(-.5, -.34), Q(-.74, .16)], true)}" fill="url(#${id})" stroke="${ht.outline}" stroke-width=".3"/>`
      + `<path d="${H.sp([Q(-.92, -.26), Q(-1.6, .1), Q(-2.1, .7), Q(-1.7, .62), Q(-1.5, .42), Q(-1.6, 1.05), Q(-1.0, .5)], true)}" fill="${ht.shadow}" stroke="${ht.outline}" stroke-width=".28"/>`
      + `<path d="${H.sp([Q(-.3, -1.05), Q(.3, -1.06), Q(.74, -.74)])}" stroke="${ht.lit}" stroke-width=".4" fill="none" opacity=".7"/>`;
    for (const [x, y] of [[-.5, -.8], [-.1, -.95], [.3, -.86], [-.7, -.4], [-.25, -.55]]) { const p = Q(x, y); body += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".22" fill="#f2e2c0" opacity=".75"/>`; }
  } else {
    const id = nid('cp', u), a0 = Q(-1, 0), a1 = Q(.8, -.9);
    body += `<defs>${linGrad(id, a0[0], a0[1], a1[0], a1[1], [[0, ht.shadow], [.6, ht.half], [1, ht.lit]])}</defs><path d="${H.sp([Q(-1.05, .02), Q(-1.02, -.7), Q(-.6, -1.32), Q(.1, -1.42), Q(.66, -1.06), Q(.82, -.62), Q(.2, -.56), Q(-.5, -.4), Q(-.86, .1)], true)}" fill="url(#${id})" stroke="${ht.outline}" stroke-width=".3"/>`
      + `<path d="${H.sp([Q(-1.0, -.24), Q(-.3, -.66), Q(.5, -.82), Q(.84, -.66)])}" stroke="${ht.shadow}" stroke-width=".9" fill="none" opacity=".8"/>`;
    for (let i = 0; i < 6; i++) { const t = i / 5, p = Q(lerp(-.9, .6, t), lerp(-.5, -.95, t) - .1), q = Q(lerp(-.85, .5, t), lerp(-.9, -1.3, t)); body += `<path d="M${P2(p)}L${P2(q)}" stroke="${ht.shadow}" stroke-width=".25" opacity=".6"/>`; }
  }
  const nearSvg = near.limb + near.hand + far.hand;
  return { body, near: nearSvg, hands: { far, near } };
}

// ——— the boathook: an ash pole, an iron ferrule, a spike and a hook that bends back into the becket ———
function boathook(u, L, P, seed) {
  const d = unit(sub(P.hook, P.end)), n = [-d[1], d[0]], dn = n[1] > 0 ? n : mul(n, -1);   // the hook bends down
  const head = sub(P.hook, mul(d, 2.6)), F0 = sub(head, mul(d, 4.2));
  let s = K.shadeCyl(u, P.end[0], P.end[1], F0[0], F0[1], .82, L, 'oak', { r1: .72, seed, outline: .3 });
  s += K.shadeCyl(u, F0[0], F0[1], head[0], head[1], .95, L, 'iron', { r2: .8, outline: .3 });
  const tip = add(head, mul(d, 4.2));
  s += K.propTube(u, L, 'iron', `M${P2(head)}L${P2(tip)}`, .42, head);
  const h0 = add(head, mul(d, .6)), c1 = add(h0, mul(dn, 2.6)), c2 = add(add(h0, mul(dn, 3.6)), mul(d, -2.4)), h1 = add(add(h0, mul(dn, 2.2)), mul(d, -3.4));
  s += K.propTube(u, L, 'iron', `M${P2(h0)}C${P2(c1)} ${P2(c2)} ${P2(h1)}`, .45, h0);
  return s;
}

// the rope becket on top of a keg: a loop of line round the bilge hoop, standing up where the hook lifts it
function becket(u, L, k, lift) {
  const pts = [[-4.6, -20.4], [-3.6, -23], [-1, -24.9 - lift], [2.4, -25.2 - lift], [4.6, -22.4], [5.2, -20.2]].map(p => kegP(k, p[0], p[1]));
  return K.rope(u, L, pts, { r: .48 * k.s / .8, seed: k.seed + 40 });
}
// wet glints on the staves facing the low sun (upper left), short dabs along the staves
function wet(u, L, k) {
  const sp = mix(L.keyColor, '#ffffff', .55); let out = '';
  for (const [lx, ly, l, w, o] of [[-11, -18.5, 3.4, .5, .75], [-7, -20.4, 2.8, .45, .6], [-3, -21, 2.2, .4, .5], [-12.6, -14, 2.6, .4, .55], [4, -21, 1.8, .35, .4]]) {
    const p = kegP(k, lx, ly), q = kegP(k, lx + l, ly - .2); out += `<path d="M${P2(p)}L${P2(q)}" stroke="${sp}" stroke-width="${f(w * k.s / .8)}" stroke-linecap="round" opacity="${o}"/>`; }
  return out;
}
// a floating keg: the barrel, then the sea over its lower part (the same sea, cut below the waterline), foam round it
function keg(u, L, k, show, o = {}) {
  const a = kegP(k, -16, 0), b = kegP(k, 16, 0), wy = k.y - 8.6 * k.s, x0 = Math.min(a[0], b[0]) - 1.5, x1 = Math.max(a[0], b[0]) + 1.5, id = nid('kw', u), hump = (o.hump != null ? o.hump : 1.2) * k.s;
  let s = K.barrel(u, L, { x: k.x, y: k.y, s: k.s, kind: 'rum', lying: true, rot: k.rot || 0, flip: !!k.flip, ell: .32, seed: k.seed, contact: false });
  if (o.becket) s += becket(u, L, k, o.lift || 0);
  if (o.wet !== false) s += wet(u, L, k);
  s += `<defs><clipPath id="${id}"><path d="M${f(x0 - 3)} ${f(wy + .8)}C${f(x0 + 2)} ${f(wy + .4)} ${f(lerp(x0, x1, .3))} ${f(wy - hump)} ${f((x0 + x1) / 2)} ${f(wy - hump * .7)}S${f(x1 - 2)} ${f(wy + .2)} ${f(x1 + 3)} ${f(wy + .8)}L${f(x1 + 3)} ${f(wy + 40)}L${f(x0 - 3)} ${f(wy + 40)}Z"/></clipPath></defs><g clip-path="url(#${id})">${show}</g>`;
  s += K.foam(u, { x: (x0 + x1) / 2, y: wy - hump * .4, w: (x1 - x0) * 1.15, h: .9 + k.s * .5, L, seed: k.seed + 20 });
  return s;
}

function boat(u, L) {
  const xs = []; for (let x = 89; x <= 212; x += 3) xs.push(x);
  const near = xs.map(x => [x, sheerY(x)]), farL = xs.map(x => [x, sheerY(x) - farOff(x)]);
  const stem = [[95.6, WL], [92.4, 110], [90.2, 104], [89, 98.6]];
  const inside = { far: farL, near };
  // the interior: the inside of the far side (in shade, warm reflected light), the thwarts' tops, the oars along it
  const inn = K.mat('oak', L, { form: 'plane', x1: 89, y1: 96, x2: 212, y2: 104, n: 'back', u });
  let back = inn.defs + `<path d="M${farL.map(P2).join('L')}L${near.slice().reverse().map(P2).join('L')}Z" fill="${mix(inn.ramp.shadow, '#4a3020', .3)}"/>`;
  back += `<path d="M${farL.map(P2).join('L')}" stroke="${mix(L.keyColor, '#ffffff', .2)}" stroke-width=".55" fill="none" opacity=".7"/>`;
  back += `<path d="M${farL.map(p => P2([p[0], p[1] + .7])).join('L')}" stroke="${inn.ramp.outline}" stroke-width=".4" fill="none" opacity=".7"/>`;
  for (const x of [112, 158, 196]) back += `<path d="M${f(x - 2.4)} ${f(sheerY(x) - farOff(x) + 1.2)}h5.6l-.6 ${f(farOff(x) - .8)}h-5.6z" fill="${inn.ramp.half}" stroke="${inn.ramp.outline}" stroke-width=".3"/>`;
  return { back, inside, near, stem };
}
function hull(u, L, B) {
  const near = B.near, stem = B.stem;
  const outline = `M${P2(stem[3])}L${near.map(P2).join('L')}L212 ${WL}L${stem.map(P2).join('L')}Z`;
  const tar = K.mat('tar', L, { form: 'plane', x1: 89, y1: 98, x2: 212, y2: WL, n: 'front', u }), och = K.mat('paint-ochre', L, { form: 'plane', x1: 89, y1: 98, x2: 212, y2: 106, n: 'front', u });
  const cid = nid('hl', u);
  let s = tar.defs + och.defs + `<defs><clipPath id="${cid}"><path d="${outline}"/></clipPath></defs><path d="${outline}" fill="${mix(tar.ramp.half, '#1e3a36', .35)}"/>`;
  s += `<g clip-path="url(#${cid})">`;
  // the sheerstrake painted ochre, the clinker strakes below it (each laps over the next: a lit edge, a dark line)
  const strake = k => near.map(p => [p[0], lerp(p[1], WL, k)]);
  s += `<path d="M${near.map(P2).join('L')}L${strake(.27).slice().reverse().map(P2).join('L')}Z" fill="${och.ramp.half}"/>`;
  s += `<path d="M${near.map(p => P2([p[0], p[1] + .6])).join('L')}" stroke="${och.ramp.lit}" stroke-width=".5" fill="none" opacity=".7"/>`;
  for (const k of [.27, .5, .73]) { s += `<path d="M${strake(k).map(P2).join('L')}" stroke="#0e1a1a" stroke-width=".55" fill="none" opacity=".85"/><path d="M${strake(k).map(p => P2([p[0], p[1] + .5])).join('L')}" stroke="${mix(tar.ramp.lit, L.keyColor, .3)}" stroke-width=".35" fill="none" opacity=".45"/>`; }
  // the wet band at the water and the darker bottom of the near side
  { const g = nid('hw', u); s += `<defs>${linGrad(g, 0, WL - 6, 0, WL, [[0, '#0a1414', 0], [1, '#0a1414', .65]])}</defs><rect x="85" y="${WL - 6}" width="130" height="6" fill="url(#${g})"/>`; }
  // rivets of the clinker laps, a scrape on the paint
  { const R = rng(17); for (const k of [.5, .73]) for (let x = 100; x < 210; x += 6 + R() * 3) { const y = lerp(sheerY(x), WL, k) + .3; s += `<circle cx="${f(x)}" cy="${f(y)}" r=".28" fill="#c8a070" opacity=".45"/>`; } }
  s += '</g>';
  // the gunwale's lit top edge and the stem's edge toward the sun; the thole pins
  s += `<path d="M${P2(stem[3])}L${near.map(P2).join('L')}" stroke="${mix(L.keyColor, '#ffffff', .35)}" stroke-width=".7" fill="none" opacity=".85"/>`;
  s += `<path d="M${stem.slice().reverse().map(P2).join('L')}" stroke="${mix(L.keyColor, '#ffffff', .3)}" stroke-width=".55" fill="none" opacity=".75"/>`;
  for (const x of [166, 186, 205]) s += K.propTube(u, L, 'oak', `M${f(x)} ${f(sheerY(x) + .2)}L${f(x + .2)} ${f(sheerY(x) - 2.6)}`, .45, [x, sheerY(x) - 1]);
  return s;
}

// shafts of sunlight from the break in the clouds: down to the sea and up between the clouds
function rays(u) {
  const id = nid('ry', u); let s = `<defs>${radGrad(id, SUN.x, SUN.y, 130, [[0, '#ffe2a8', .32], [.4, '#ffd294', .12], [1, '#ffd294', 0]])}</defs>`;
  for (const [a, w] of [[64, 3], [80, 5], [96, 2.4], [112, 4], [128, 2.6], [150, 3.4], [-40, 3], [-62, 4], [-118, 3.4], [-140, 2.6], [175, 2], [8, 2.6]]) {
    const r = a * Math.PI / 180, r1 = (a - w) * Math.PI / 180, r2 = (a + w) * Math.PI / 180, R0 = 8, R1 = 150;
    s += `<path d="M${f(SUN.x + Math.cos(r) * R0)} ${f(SUN.y + Math.sin(r) * R0)}L${f(SUN.x + Math.cos(r1) * R1)} ${f(SUN.y + Math.sin(r1) * R1)}L${f(SUN.x + Math.cos(r2) * R1)} ${f(SUN.y + Math.sin(r2) * R1)}Z" fill="url(#${id})" style="mix-blend-mode:screen"/>`;
  }
  return s;
}

module.exports = { name: 'Ром в волнах', kind: 'sea', status: 'draft', cam: CAM, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .75 });
    L.pal = Object.assign({}, L.pal, PAL);
    // the sky after the squall: slate clouds above, a gold break round the low sun
    let bg = K.sky(u, L, { horizon: HZ, stars: false });
    bg += K.localGlow(u, { x: SUN.x, y: SUN.y + 6, color: '#ffcf86', power: .55, radius: 80 }, { squash: .6, core: false });
    for (const [x, y, w, h, sd, fr] of [[156, 50, 100, 20, 14, 0], [62, 41, 76, 13, 6, 0], [116, 57, 46, 8, 21, .15], [46, 80, 40, 5, 31, .4], [162, 79, 54, 7, 12, .35], [124, 88, 36, 4, 9, .6], [182, 90, 24, 3, 17, .7]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.sunMoon(u, L, { r: 5.4 }) + rays(u);
    // the sea, defined once and shown again over the lower part of each keg
    const seaId = nid('sea', u), show = `<use href="#${seaId}"/>`;
    bg += `<defs><g id="${seaId}">${K.water(u, L, { horizon: HZ, bottom: 290, swell: .78, seed: 8, glitter: SUN.x })}</g></defs>${show}`;
    // the far ship (left) and ours, hove-to on the right: both rolled on the swell
    bg += `<g data-far="">${K.ship(u, L, { kind: 'endeavour', x: 47, y: HZ + 1.2, scale: .19, detail: 'far', sails: 'reefed', heel: -1.5, roll: 6, seed: 3 })}</g>`;
    bg += K.ship(u, L, { kind: 'brig', x: 174, y: HZ + 1.6, scale: .42, detail: 'mid', sails: 'reefed', flip: true, heel: 2, roll: 7, seed: 5 });
    // kegs far out on the swell, in and beside the gold path
    for (const [x, y, s, r, sd] of [[46, 100.4, .24, -10, 2], [94, 99.4, .22, 8, 4], [40, 108, .4, 6, 5], [146, 99.2, .22, -6, 6], [74, 98.4, .2, 12, 8], [161, 101.4, .32, 4, 21]]) bg += keg(u, L, { x, y, s, rot: r, seed: sd }, show, { wet: s > .3, hump: s > .3 ? 1.5 : undefined });
    // the near swell under the glass: a few long crests with foam (dark and calm under the text)
    for (const [x, y, w, sd] of [[60, 140, 40, 41], [150, 148, 52, 42], [110, 170, 50, 43], [60, 204, 50, 44], [150, 210, 56, 45]]) bg += K.foam(u, { x, y, w, h: 1.4, L, seed: sd });
    // the hooked keg on the gold water
    let fg = keg(u, L, KEG1, show, { becket: true, lift: 1.2, hump: 1.6 });
    // the ripples it makes as it is pulled toward the boat
    for (const [dx, dy, w] of [[16, 1.6, 8], [21, 3.4, 10], [-15, 1.4, 6]]) fg += K.foam(u, { x: KEG1.x + dx, y: KEG1.y - 8.6 * KEG1.s + dy, w, h: .6, L, seed: 60 + dx });
    // the boat: the inside of the far side, the kegs already caught in the stern, the men, then the near side over them
    const BT = boat(u, L);
    fg += BT.back;
    fg += K.barrel(u, L, { x: 177, y: 111.6, s: .58, kind: 'rum', lying: true, rot: -4, ell: .32, seed: 23, contact: false });
    const a = sailor(u, L, Object.assign({}, A, { pole: POLE_A, farPref: [-.3, 1], nearPref: [.6, .8] }));
    const b = sailor(u, L, Object.assign({}, B, { pole: POLE_B, farPref: [-.2, 1], nearPref: [.7, .7] }));
    fg += b.body + a.body + hull(u, L, BT);
    // the water against the hull: the foam line, the dark reflection of the boat under it
    { const g = nid('rf', u), id = nid('rb', u); fg += `<defs>${linGrad(g, 0, WL, 0, WL + 10, [[0, '#0c1a1e', .7], [1, '#0c1a1e', 0]])}<filter id="${id}" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation=".8"/></filter></defs><path d="M95.6 ${WL}L212 ${WL}L212 ${WL + 9}Q150 ${WL + 7} 97 ${WL + 4}Z" fill="url(#${g})" filter="url(#${id})"/>`; }
    for (const [x, w, sd] of [[104, 20, 71], [132, 26, 72], [164, 30, 73], [196, 26, 74]]) fg += K.foam(u, { x, y: WL + .3, w, h: 1, L, seed: sd });
    fg += K.foam(u, { x: 96, y: WL - .2, w: 7, h: 1.4, L, seed: 75 });
    // the second keg by the near side of the bow, in B's hook (in front of the boat)
    fg += keg(u, L, KEG2, show, { becket: true, lift: 1.6, hump: 1.4 }) + K.splash(u, { x: KEG2.x - 9, y: KEG2.y - 8.6 * KEG2.s + .4, w: 7, h: 5, seed: 4, L });
    // the poles over the gunwale, then the near arms and the hands round them
    fg += boathook(u, L, POLE_A, 31) + boathook(u, L, POLE_B, 33);
    fg += a.near + b.near;
    // drops falling from the becket the hook lifts out of the water
    { const R = rng(51); for (const H0 of [HOOK1, HOOK2]) for (let i = 0; i < 6; i++) { const x = H0[0] + (R() - .5) * 3, y = H0[1] + 1 + R() * 5; fg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx=".3" ry="${f(.45 + R() * .4)}" fill="#fff2d8" opacity="${f(.5 + R() * .4)}"/>`; } }
    // the warm haze of the low sun over the water, the cool shade of the near sea
    fg += K.localGlow(u, { x: SUN.x, y: HZ + 6, color: '#ffd294', power: .28, radius: 60 }, { squash: .3, core: false });
    { const g = nid('gl', u); fg += `<defs>${linGrad(g, 0, 132, 0, 280, [[0, '#0a1620', 0], [1, '#0a1620', .5]])}</defs><rect x="0" y="132" width="200" height="150" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
