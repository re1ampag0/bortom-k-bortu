// «Лунный свет» (Колода моря): a silver full moon rises huge behind the waist of a ship; on the deck two sailors
// fight in front of its disc. In its light their flesh turns to smoke and the bones show through — skulls, ribs,
// the long bones of the arms and legs. One lunges and runs the other through: the sabre passes clean through his
// chest and out of his back, and he only grins and raises his own blade. The moon is over everyone: both men are
// cursed alike. Card: for the whole round damage to Команда is 1 less (cutlasses do not take the men).
// Not «Зомби-офицеры» (the dead of the Revenge): here it is the moonlight that does it, to all.
// Second pass (review): they were bare skeletons with stick limbs — now they are sailors whose shirts, trousers,
// bandanas and faces have gone thin as smoke, the skeleton glowing through (lib/people.cjs contours, see-through);
// bony fingers round the hilts, shoes in a fencer's stance with their shadows; ripples and sparks where the blade
// goes in and out of him (it passes through, no harm); the moon's seas paler and its craters small.
// Brief: docs/mockups/print/card-briefs.md «Лунный свет».
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 102;                    // horizon over the far rail
const RAIL = 109;                  // the top of the far bulwark's rail
const DECK = 118;                  // where the far bulwark meets the deck
const MOON = { x: 104, y: 58, r: 36 };
const light = {
  time: 'night', haze: .3,
  key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#dfe8ff', power: .9 },
  fill: { color: '#1b2a48', power: .4 },
  rim: { az: 0, color: '#f4f7ff', power: .8 },
};
const skel = { horizon: HZ, eye: 1.7, light: 'the full moon right behind the two men: they stand dark against its disc with silver edges, their bones glowing through; long shadows run from their feet towards us over the deck',
  items: [
    ['moon', 68, 94, 72, 72, 'a huge disc low over the sea behind the far rail'],
    ['attacker', 30, 126, 70, 64, 'lunging to the right, 37 units/m, the sabre through the other\'s chest'],
    ['defender', 102, 127, 46, 74, 'on his feet, the blade through him and out of his back, his own sabre raised'],
    ['bulwark', -12, DECK, 224, 12, 'the far side of the deck across the frame, the sea over it'],
    ['mast', 176, 292, 14, 300, 'the mainmast on the right, shrouds to the rail'],
    ['coil', 30, 250, 50, 20, 'under the glass on the deck'],
  ] };

const pts = a => a.map(p => f(p[0]) + ' ' + f(p[1]));
function sp(P, closed) {
  const n = P.length, g = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// the two men: joints of the attacker (lunging right) and of the defender (facing left)
const A = {
  head: [75, 69.6], hr: 4.5, neck: [72.4, 74.6], shF: [71, 77.6], shN: [72.6, 78.4], hip: [62, 96],
  elN: [83.6, 80.2], wrN: [94, 81.6], fistN: [96.6, 81.6],
  elF: [61, 71], wrF: [54.4, 63.4], fistF: [52.6, 61.4],
  knN: [76.4, 106], anN: [82, 122.4], toeN: [89.6, 125.4], heelN: [80.4, 125],
  knF: [48.4, 108.4], anF: [37.4, 120.2], toeF: [40.6, 124.4], heelF: [35.2, 122.6],
};
const D = {
  head: [118.4, 68.2], hr: 4.5, neck: [120, 73.4], shF: [122.4, 76.8], shN: [120.4, 77.6], hip: [124, 96.4],
  elN: [114.4, 89.4], wrN: [114.6, 100.4], fistN: [114.8, 103],
  elF: [131.6, 68.4], wrF: [129.6, 57.4], fistF: [129.2, 55],
  knN: [115, 110.4], anN: [111, 124.6], toeN: [104, 127], heelN: [113.2, 127.2],
  knF: [130.4, 110.6], anF: [134, 122.6], toeF: [138.4, 125.6], heelF: [132.8, 124.2],
};
const TIP = [134.4, 82.8];          // the point of the attacker's sabre, out of the defender's back
const DTIP = [140.6, 30.6];         // the point of the defender's raised sabre

module.exports = { name: 'Лунный свет', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.7 });
    L.pal = Object.assign({}, L.pal, { sky: ['#05081a', '#0c1430', '#1a2a4c', '#34486a'], sea: ['#5a7090', '#1e3048', '#0a1424'] });
    let bg = K.sky(u, L, { horizon: HZ, stars: 50, seed: 3 });
    bg += moonDisc(u, MOON);
    bg += K.cloud(u, L, { x: 36, y: 34, w: 60, h: 12, seed: 6, far: .3 }) + K.cloud(u, L, { x: 176, y: 44, w: 52, h: 10, seed: 9, far: .4 });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .15, seed: 7, glitter: MOON.x });
    // ——— the ship: the far bulwark across the frame, the deck running to us, the mast and its shrouds
    bg += K.deck(u, L, { horizon: HZ, top: DECK, bottom: 292, vx: 104, seed: 5, plank: 26, wet: true });
    bg += bulwark(u, L);
    bg += mastAndShrouds(u, L);
    // the moonlight lies on the deck in a long pale path between the men's shadows
    bg += K.localGlow(u, { x: 104, y: 150, color: '#c8d8f4', power: .25, radius: 80 }, { squash: .3, core: false });
    // ——— the two men, their shadows towards us; the attacker first, then his blade, then the man it runs through
    let fg = K.castShadow(u, L, { x: 62, y: 124, w: 22, h: 58, horizon: HZ }) + K.castShadow(u, L, { x: 122, y: 126, w: 18, h: 60, horizon: HZ });
    const ca = cursed(u, L, A, { facing: 1, sword: { arm: 'N', fist: A.fistN, tip: TIP }, colors: { shirt: '#b4bed2', pants: '#2c3a5c', skin: '#9c98a4', band: '#8a3030' }, freeF: { da: -14, spread: 16, curl: .2, m: -1 }, brow: 'frown', mouth: .2 });
    const cd = cursed(u, L, D, { facing: -1, sword: { arm: 'F', fist: D.fistF, tip: DTIP }, colors: { shirt: '#8e9cb8', pants: '#3c3248', skin: '#9c98a4', band: '#2c5478' }, freeN: { spread: 6, curl: .5 }, brow: 'up', mouth: .35 });
    fg += ca.svg + sabre(u, L, A.fistN, TIP, 1) + ca.hand;
    fg += cd.svg;
    // the blade seen faintly through his body, the point bright out of his back; ripples and sparks where it passes
    fg += bladeInside(u, L);
    fg += sabre(u, L, D.fistF, DTIP, -1) + cd.hand;
    fg += K.coil(u, L, { x: 40, y: 246, s: 2.4, seed: 4, tail: false });
    fg += hatOnDeck(u, L, 160, 214);
    return [bg, fg];
  } };

/** The full moon: a sharp disc, its seas, a few bright craters, a tight silver corona and a wide soft glow. */
function moonDisc(u, { x, y, r }) {
  const g = nid('md', u), c = nid('mc', u), h = nid('mh', u), R = rng(51);
  const blob = (bx, by, rx, ry, sd) => { const q = rng(sd); return sp(Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, k = 1 + (q() - .5) * .45; return [x + (bx + Math.cos(a) * rx * k) * r, y + (by + Math.sin(a) * ry * k) * r]; }), true); };
  let s = `<defs>${radGrad(g, x - r * .12, y - r * .12, r * 1.05, [[0, '#fbfaf2'], [.72, '#ecebdd'], [1, '#c6c8bc']])}${radGrad(h, x, y, r * 2.4, [[.4, '#dfe8ff', .3], [.62, '#b8c8ec', .1], [1, '#b8c8ec', 0]])}<clipPath id="${c}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath></defs>`;
  s += `<circle cx="${x}" cy="${y}" r="${f(r * 2.4)}" fill="url(#${h})"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/><g clip-path="url(#${c})">`;
  // the seas: faint and pale, smaller than before; then many small craters, each a light grey bowl with a bright rim
  for (const [bx, by, rx, ry, sd, op] of [[-.24, -.36, .3, .24, 1, .34], [.2, -.3, .17, .16, 2, .34], [.3, -.02, .22, .19, 3, .32], [.7, -.22, .1, .12, 4, .38], [-.56, .06, .28, .44, 5, .26], [-.1, .36, .2, .13, 6, .25], [.5, .26, .12, .19, 7, .28]])
    s += `<path d="${blob(bx, by, rx * .62, ry * .62, sd)}" fill="#c2c4bc" opacity="${f(op * .5)}"/>`;
  for (let i = 0; i < 30; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * .9, cx = x + Math.cos(a) * d * r, cy = y + Math.sin(a) * d * r, cr = (.012 + R() * .026) * r;
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="#cfd0c6" opacity=".55"/><path d="M${f(cx - cr)} ${f(cy)}A${f(cr)} ${f(cr)} 0 0 0 ${f(cx + cr * .7)} ${f(cy + cr * .7)}" stroke="#a8aaa0" stroke-width="${f(cr * .3)}" fill="none" opacity=".45"/><path d="M${f(cx + cr)} ${f(cy)}A${f(cr)} ${f(cr)} 0 0 1 ${f(cx)} ${f(cy + cr)}" stroke="#fffdf4" stroke-width="${f(cr * .35)}" fill="none" opacity=".6"/>`; }
  return s + `</g><circle cx="${x}" cy="${y}" r="${f(r - .2)}" fill="none" stroke="#c4c6b8" stroke-width=".4" opacity=".7"/>`;
}

/** The far bulwark across the frame seen from inside: the rail cap lit along its top by the moon behind, the
 *  planking dark, stanchions, a gunport closed; the waterway along the deck. */
function bulwark(u, L) {
  const oak = L.ramp('oak', 100, 112), id = nid('bk', u);
  let s = `<defs>${linGrad(id, 0, RAIL, 0, DECK, [[0, mix(oak.shadow, '#0a1020', .45)], [1, mix(oak.shadow, '#05080e', .65)]])}</defs><path d="M-12 ${RAIL}H212V${DECK + .6}H-12Z" fill="url(#${id})"/>`;
  for (let x = -6; x < 212; x += 15.5) s += `<path d="M${f(x)} ${RAIL + 1.2}h2.2v${f(DECK - RAIL - 1.2)}h-2.2Z" fill="${mix(oak.shadow, '#04060c', .55)}"/><path d="M${f(x + 2.2)} ${RAIL + 1.2}v${f(DECK - RAIL - 1.2)}" stroke="${mix(oak.core, '#c8d8f4', .3)}" stroke-width=".3" opacity=".4"/>`;
  s += `<path d="M-12 ${RAIL - 1.6}H212V${RAIL + 1.2}H-12Z" fill="${mix(oak.core, '#1a2234', .5)}" stroke="${oak.outline}" stroke-width=".4"/><path d="M-12 ${RAIL - 1.4}H212" stroke="#dfe8ff" stroke-width=".6" opacity=".75"/>`;
  s += `<path d="M-12 ${DECK}H212" stroke="#05070c" stroke-width="1.2" opacity=".7"/>`;
  return s;
}
/** The mainmast on the right edge rising out of the deck; its shrouds come down to the rail. */
function mastAndShrouds(u, L) {
  const rp = L.ramp('rope', 180, 60);
  let s = '';
  for (const [a, b] of [[[150, RAIL - 1], [184, -14]], [[160, RAIL - 1], [188, -14]], [[170, RAIL - 1], [192, -14]]]) s += `<path d="M${pts([a, b]).join('L')}" stroke="${rp.outline}" stroke-width=".9" fill="none"/>`;
  for (let t = .1; t < .95; t += .085) { const p = [[150, RAIL - 1], [160, RAIL - 1], [170, RAIL - 1]].map((a, i) => lerp2(a, [[184, -14], [188, -14], [192, -14]][i], t));
    s += `<path d="M${pts(p).join('L')}" stroke="${rp.outline}" stroke-width=".38" fill="none" opacity=".8"/>`; }
  s += K.shadeCyl(u, 196, 292, 196, -14, 6, L, 'oak', { r1: 6.4, r2: 5.2, outline: .5, seed: 3 });
  // a stay from the masthead across the sky over the moon
  s += `<path d="M196 -4L-14 64" stroke="${rp.outline}" stroke-width=".7" fill="none"/>`;
  return s;
}

// ——— the cursed men: in the moonlight their clothes and flesh turn thin as smoke — the shirt, the trousers, the
// bandana and the face are still there, half see-through, and the skeleton glows through them, brighter where the
// moon is behind. Drawn as contours (lib/people.cjs): sleeves with folds and cuffs, trousers, shoes in a fencer's
// stance; the bony hands close their fingers round the hilts. Joints J (see A and D), facing 1 — right, −1 — left.
// Returns { svg, hand }: the sword hand goes over the hilt, after the sabre is drawn.
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const BONE = '#f2f4ea';
function cursed(u, L, J0, o) {
  const dir = o.facing, rim = '#e8f0ff', HS = .56;
  // the sword hand: the grip runs along the blade through the fist, the fingers wrap it, the wrist sits above it
  const sw = o.sword, beta = ang(sw.fist, sw.tip), a = beta + 90, wr = [sw.fist[0] - 6.1 * HS * Math.cos(a * Math.PI / 180), sw.fist[1] - 6.1 * HS * Math.sin(a * Math.PI / 180)];
  const J = Object.assign({}, J0, sw.arm === 'N' ? { wrN: wr } : { wrF: wr });
  const ch = lerp2(J.shF, J.shN, .5), hip = J.hip, ax = hip[0] - ch[0], ay = hip[1] - ch[1], al = Math.hypot(ax, ay), nx = -ay / al, ny = ax / al;
  const T = (t, s) => [lerp(ch[0], hip[0], t) + nx * s, lerp(ch[1], hip[1], t) + ny * s];
  const C = o.colors, tone = (c, k = .5) => ({ lit: mix(c, '#eef3ff', .55), half: c, core: c, shadow: mix(c, '#04060e', k), outline: '#05070e' });
  const shirt = tone(C.shirt), pants = tone(C.pants), skin = tone(C.skin, .45), band = tone(C.band), shoe = tone('#141826', .3);
  const lit = dir;   // the moon is behind them: the edge away from us; the near side faces us in shade
  let flesh = '';
  // the far arm and the far leg, then the shirt, the near leg, the near arm; the head
  const armPart = (sh, el, w, free) => H.cloth(u, { spine: [sh, el, w], w: [5.4, 4.6, 3.6], tone: shirt, lit: -lit, rim, rimSide: -lit, cuff: { from: .84, k: 1.14 }, seed: 3, capA: true, drapes: 2 });
  const legPart = (hp, kn, an, k) => H.cloth(u, { spine: [hp, kn, an], w: [8.6 * k, 6.2 * k, 5 * k], tone: pants, lit: -lit, rim, rimSide: -lit, cuff: { from: .9, k: 1.06 }, seed: 5, capA: true, drapes: 2 });
  const shoeP = (an, toe, heel) => { const d = ang(heel, toe) * Math.PI / 180, ux = Math.cos(d), uy = Math.sin(d), l = Math.hypot(toe[0] - heel[0], toe[1] - heel[1]), up = [0, -1];
    const P = (t, h) => [heel[0] + ux * l * t, heel[1] + uy * l * t - h];
    return `<path d="${sp([P(-.06, .2), P(.3, -.15), P(.8, -.1), P(1.06, .3), P(1.02, 1.3), P(.7, 2), P(.42, 2.8), [an[0] + 1.4 * dir, an[1] - .6], [an[0] - 1.6 * dir, an[1] - .4], P(-.08, 1.8)], true)}" fill="${shoe.half}" stroke="${shoe.outline}" stroke-width=".4"/>`
      + `<path d="M${f(P(0, 0)[0])} ${f(P(0, 0)[1])}L${f(P(1, 0)[0])} ${f(P(1, 0)[1])}" stroke="#05070e" stroke-width=".9"/>`; };
  const freeHand = (wrist, elb, ao = {}) => { const h = H.hand(u, Object.assign({ at: wrist, a: ang(elb, wrist) + (ao.da || 0), s: HS, m: ao.m || 1, pose: 'open', spread: 10, curl: .35, tone: skin, thumb: 'front', sw: .3 }, ao)); return h.back + h.front; };
  // far side
  if (sw.arm === 'F') flesh += armPart(J.shF, J.elF, J.wrF); else flesh += armPart(J.shF, J.elF, J.wrF) + freeHand(J.wrF, J.elF, o.freeF || {});
  flesh += shoeP(J.anF, J.toeF, J.heelF) + legPart(J.hip, J.knF, J.anF, .95);
  // the shirt over the chest, loose, tucked into the trousers under a sash
  const torso = sp([T(-.12, -7 * dir), T(.3, -7.2 * dir), T(.66, -6 * dir), T(1.08, -7.2), T(1.08, 7.2), T(.66, 5.8 * dir), T(.3, 7.8 * dir), T(-.12, 6.6 * dir)], true);
  { const g = nid('ts', u), a0 = T(.5, -8 * dir), a1 = T(.5, 8 * dir);
    flesh += `<defs>${linGrad(g, a0[0], a0[1], a1[0], a1[1], [[0, shirt.lit], [.3, shirt.half], [1, shirt.shadow]])}</defs><path d="${torso}" fill="url(#${g})" stroke="${shirt.outline}" stroke-width=".4"/>`;
    for (const [t0, s0, t1, s1] of [[.1, 2 * dir, .6, -1 * dir], [.2, 5 * dir, .8, 2 * dir], [.05, -3 * dir, .5, -5 * dir]]) { const p = T(t0, s0), q = T(t1, s1), m = T((t0 + t1) / 2, (s0 + s1) / 2 + 1.4 * dir); flesh += `<path d="M${f(p[0])} ${f(p[1])}Q${f(m[0])} ${f(m[1])} ${f(q[0])} ${f(q[1])}" stroke="${shirt.shadow}" stroke-width=".55" fill="none" opacity=".7"/>`; }
    const p = T(-.02, -1.4 * dir), q = T(.24, 3.8 * dir); flesh += `<path d="M${f(p[0])} ${f(p[1])}L${f(T(.18, .6 * dir)[0])} ${f(T(.18, .6 * dir)[1])}L${f(q[0])} ${f(q[1])}" stroke="${shirt.shadow}" stroke-width=".5" fill="none"/>`; }
  flesh += H.cloth(u, { spine: [T(.86, 0), T(1.0, 0)], w: [15, 15.4], tone: band, lit: -lit, folds: false });
  flesh += shoeP(J.anN, J.toeN, J.heelN) + legPart(J.hip, J.knN, J.anN, 1);
  // the neck and the head: a face in profile, see-through, the bandana knotted behind
  flesh += H.cloth(u, { spine: [J.neck, lerp2(J.neck, J.head, .55)], w: [3.6, 3.2], tone: skin, lit: -lit, folds: false });
  const hd = H.head(u, { c: [J.head[0] + .2 * dir, J.head[1] + .3], r: J.hr * 1.05, dir, tone: skin, faceLit: false, rim, warm: { color: '#cfe0ff', op: .45 }, mouth: o.mouth || 0, eye: 'open', brow: o.brow || 'frown', hairColor: '#1a1e2a', stubble: true, white: '#dfe6f2', iris: '#0a0e18' });
  let headL = hd.svg;
  { const Q = hd.Q, id = nid('bd', u);
    const a0 = Q(-1, 0), a1 = Q(.8, -.8);
    headL += `<defs>${linGrad(id, a0[0], a0[1], a1[0], a1[1], [[0, band.shadow], [.6, band.half], [1, band.lit]])}</defs><path d="${sp([Q(-1.06, .12), Q(-1.0, -.6), Q(-.5, -1.1), Q(.3, -1.12), Q(.84, -.72), Q(.62, -.54), Q(0, -.66), Q(-.5, -.34), Q(-.74, .16)], true)}" fill="url(#${id})" stroke="${band.outline}" stroke-width=".4"/>`
      + `<path d="${sp([Q(-.92, -.26), Q(-1.7, .1), Q(-2.3, .7), Q(-1.8, .6), Q(-1.6, .4), Q(-1.7, 1.1), Q(-1.0, .5)], true)}" fill="${band.shadow}" stroke="${band.outline}" stroke-width=".35"/>`; }
  flesh += headL;
  // the near arm (the free one of the defender reaches back down; the attacker's carries the sabre)
  if (sw.arm === 'N') flesh += armPart(J.shN, J.elN, J.wrN); else flesh += armPart(J.shN, J.elN, J.wrN) + freeHand(J.wrN, J.elN, o.freeN || {});
  // a ghost of the sword hand's flesh round the grip
  const fh = H.hand(u, { at: wr, a, s: HS, m: 1, pose: 'grip', tone: skin, sw: .3 });
  // the cold glow round the figure, the see-through flesh and clothes, the bones glowing through, the silver edges
  const glow = nid('cg', u);
  let s = `<defs><filter id="${glow}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`;
  s += `<g filter="url(#${glow})" opacity=".3"><path d="${torso}" fill="#9ab4e8"/>${bones(u, J, dir, T, true)}</g>`;
  s += `<g opacity=".6">${flesh}</g>`;
  s += bones(u, J, dir, T);
  // the face over the skull again, thin: the eye, the brow, the nose and the mouth read, the skull glows through
  s += `<g opacity=".42">${headL}</g>`;
  s += `<g fill="none" stroke="${rim}" opacity=".5" stroke-width=".5"><path d="${torso}"/></g>`;
  // the sword hand: the ghost of the flesh, then the finger bones wrapped round the grip, glowing
  const bh = H.hand(u, { at: wr, a, s: HS, m: 1, pose: 'grip', tone: skin, bone: true, boneColor: BONE });
  const free = [];
  const hand = `<g opacity=".5">${fh.front}</g>` + `<g filter="url(#${glow})" opacity=".55">${bh.front}</g>` + bh.front;
  // the free hand's bones
  const fw = sw.arm === 'N' ? [J.wrF, J.elF, o.freeF || {}] : [J.wrN, J.elN, o.freeN || {}];
  const fb = H.hand(u, Object.assign({ at: fw[0], a: ang(fw[1], fw[0]) + (fw[2].da || 0), s: HS, m: fw[2].m || 1, pose: 'open', spread: 10, curl: .35, tone: skin, bone: true, boneColor: BONE, thumb: 'front' }, fw[2]));
  s += `<g filter="url(#${glow})" opacity=".55">${fb.back}${fb.front}</g>${fb.back}${fb.front}`;
  // the shadows of the feet on the deck: each shoe sits on its own dark contact patch
  let sh = '';
  for (const [h, t] of [[J.heelF, J.toeF], [J.heelN, J.toeN]]) sh += K.contactShadow(u, (h[0] + t[0]) / 2, Math.max(h[1], t[1]) + .3, Math.abs(t[0] - h[0]) + 6, L, { ry: 1.4, opacity: .85 });
  return { svg: sh + s, hand };
}
// the bones showing through: a skull with dark sockets and a grin, the spine, the ribs round the chest, the pelvis,
// the long bones of the arms and legs, the small bones of the feet in the shoes (the hands are drawn with the hands)
function bones(u, J, dir, T, plain) {
  const bc = BONE, gid = nid('bg', u), b = (a, c, w) => `<path d="M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}" stroke="${bc}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
  const knob = (p, r) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="${bc}"/>`;
  const pair = (a, c, w, gap) => { const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * gap, ny = dx / l * gap; return b([a[0] + nx, a[1] + ny], [c[0] + nx * .6, c[1] + ny * .6], w) + b([a[0] - nx, a[1] - ny], [c[0] - nx * .6, c[1] - ny * .6], w * .8); };
  let s = '';
  s += b(J.shF, J.elF, 1.3) + pair(J.elF, J.wrF, .75, .55) + b(J.hip, J.knF, 1.6) + pair(J.knF, J.anF, .9, .6);
  s += b(J.shN, J.elN, 1.4) + pair(J.elN, J.wrN, .8, .6) + b(J.hip, J.knN, 1.7) + pair(J.knN, J.anN, .95, .65);
  for (const p of [J.elF, J.elN, J.knF, J.knN]) s += knob(p, 1.05);
  for (const [a, t1, t2] of [[J.anF, J.toeF, J.heelF], [J.anN, J.toeN, J.heelN]]) { s += b(a, [t2[0], t2[1] - .8], .9); for (const k of [-.5, 0, .5]) s += b(a, [t1[0] - (t1[0] - a[0]) * .1, t1[1] - .8 + k * .5], .5); }
  for (let t = 0; t <= 1.001; t += .09) { const p = T(t, -1.8 * dir * Math.sin(t * Math.PI) * .6); s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx=".95" ry=".7" fill="${bc}"/>`; }
  for (let i = 0; i < 6; i++) { const t = .1 + i * .075, back = T(t, -1.6 * dir), front = T(t + .1, (4.6 - i * .25) * dir), mid = T(t - .02, (2.4) * dir);
    s += `<path d="M${f(back[0])} ${f(back[1])}Q${f(mid[0])} ${f(mid[1] - 1.6)} ${f(front[0])} ${f(front[1])}" stroke="${bc}" stroke-width=".85" fill="none" stroke-linecap="round"/>`; }
  { const a = T(.08, 4.2 * dir), c = T(.48, 3.6 * dir); s += b(a, c, 1.1); }
  s += b(T(.02, -1.6 * dir), T(-.04, 4.4 * dir), .9);
  { const p = T(.97, 0); s += `<path d="${sp([[p[0] - 4.2, p[1] - 2.6], [p[0], p[1] - 1], [p[0] + 4.2, p[1] - 2.6], [p[0] + 3, p[1] + 1.6], [p[0], p[1] + 2.6], [p[0] - 3, p[1] + 1.6]], true)}" fill="${bc}" opacity=".9"/><ellipse cx="${f(p[0])}" cy="${f(p[1] + .4)}" rx="1.6" ry="1.1" fill="#1a2238"/>`; }
  const h = [J.head[0] + .2 * dir, J.head[1] + .3], r = J.hr * .9, Q = (a, c) => [h[0] + dir * a * r, h[1] + c * r];
  s += `<path d="${sp([Q(-.86, .28), Q(-.92, -.36), Q(-.5, -.88), Q(.2, -.98), Q(.74, -.66), Q(.94, -.12), Q(.98, .26), Q(.84, .42), Q(.9, .66), Q(.64, .82), Q(.2, .74), Q(-.28, .62)], true)}" fill="${bc}"/>`;
  if (plain) return s;
  s += `<ellipse cx="${f(Q(.5, -.06)[0])}" cy="${f(Q(.5, -.06)[1])}" rx="${f(r * .24)}" ry="${f(r * .22)}" fill="#0a0e1c" opacity=".85"/><path d="${sp([Q(.86, .2), Q(.96, .36), Q(.8, .36)], true)}" fill="#0a0e1c" opacity=".85"/>`;
  s += `<path d="M${pts([Q(.36, .62), Q(.82, .6)]).join('L')}" stroke="#2a3048" stroke-width=".35"/>`;
  for (let i = 0; i < 4; i++) { const p = Q(.42 + i * .12, .6); s += `<path d="M${f(p[0])} ${f(p[1] - .5)}v1" stroke="#2a3048" stroke-width=".25"/>`; }
  return `<defs><filter id="${gid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><g filter="url(#${gid})" opacity=".6">${s}</g><g opacity=".82">${s}</g>`;
}
/** A cutlass from the fist to the point: the wrapped grip through the fist, the pommel, the brass guard, the curved
 *  blade with a bright edge towards the moon. */
function sabre(u, L, h, tip, side) {
  const dx = tip[0] - h[0], dy = tip[1] - h[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy * side, ny = ux * side;
  const g = [h[0] + ux * 2, h[1] + uy * 2], m = [lerp(g[0], tip[0], .55) + nx * 1.4, lerp(g[1], tip[1], .55) + ny * 1.4];
  let s = `<path d="M${f(h[0] - ux * 2.2)} ${f(h[1] - uy * 2.2)}L${f(g[0])} ${f(g[1])}" stroke="#2a1a10" stroke-width="1.5" stroke-linecap="round"/>`
    + K.shadeSphere(u, h[0] - ux * 2.6, h[1] - uy * 2.6, .85, L, 'brass', { outline: .25 });
  s += `<path d="M${f(g[0] + nx * .9)} ${f(g[1] + ny * .9)}Q${f(m[0] + nx * 1)} ${f(m[1] + ny * 1)} ${f(tip[0])} ${f(tip[1])}Q${f(m[0] - nx * .6)} ${f(m[1] - ny * .6)} ${f(g[0] - nx * .7)} ${f(g[1] - ny * .7)}Z" fill="#9aa6b8" stroke="#2a3040" stroke-width=".35"/>`;
  s += `<path d="M${f(g[0] + nx * .7)} ${f(g[1] + ny * .7)}Q${f(m[0] + nx * .8)} ${f(m[1] + ny * .8)} ${f(tip[0])} ${f(tip[1])}" stroke="#f4f8ff" stroke-width=".5" fill="none"/>`;
  s += `<path d="M${f(h[0] + ux * 1.8 + nx * 2.4)} ${f(h[1] + uy * 1.8 + ny * 2.4)}Q${f(h[0] + ux * 3)} ${f(h[1] + uy * 3)} ${f(h[0] + ux * 1.8 - nx * 2.4)} ${f(h[1] + uy * 1.8 - ny * 2.4)}" stroke="${L.ramp('brass', h[0], h[1]).core}" stroke-width="1.1" fill="none"/>`;
  return s;
}
/** Over the defender's body the blade shows faintly through him; where it goes in at his chest and out of his back
 *  the moonlit flesh ripples like water round it and throws a few cold sparks — it passes through, no harm done. */
function bladeInside(u, L) {
  const cid = nid('bi', u), a = [113, 82], b = TIP, gid = nid('rp', u);
  let s = `<defs><clipPath id="${cid}"><rect x="${a[0]}" y="70" width="${f(b[0] - a[0])}" height="24"/></clipPath><filter id="${gid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".6"/></filter></defs><g clip-path="url(#${cid})" opacity=".55">${sabre(u, L, A.fistN, TIP, 1)}</g>`;
  s += `<path d="M127.6 82.6L${f(TIP[0])} ${f(TIP[1])}" stroke="#f4f8ff" stroke-width=".6" opacity=".9"/>`;
  // the ripples: thin rings round the blade at the entry and the exit, seen edge-on (tall narrow ellipses), and sparks
  let rp = '';
  for (const [x, y] of [[114.6, 82.1], [127.4, 82.5]]) {
    for (const [rx, ry, op] of [[.9, 1.8, .95], [1.6, 3.4, .7], [2.3, 5, .45], [3, 6.6, .25]]) rp += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#e6f0ff" stroke-width=".4" opacity="${op}"/>`;
    const R = rng(Math.round(x));
    for (let i = 0; i < 6; i++) { const t = R() * Math.PI * 2, d = 2.4 + R() * 3.6, px = x + Math.cos(t) * d * .7, py = y + Math.sin(t) * d, k = .5 + R() * .7;
      rp += `<path d="M${f(px - k)} ${f(py)}h${f(2 * k)}M${f(px)} ${f(py - k)}v${f(2 * k)}" stroke="#ffffff" stroke-width=".25" stroke-linecap="round" opacity="${f(.6 + R() * .4)}"/>`; }
  }
  s += `<g filter="url(#${gid})">${rp}</g>${rp}`;
  return s;
}
/** A knocked-off hat lying on the deck in the moonlight, under the glass. */
function hatOnDeck(u, L, x, y) {
  const t = L.ramp('tar', x, y);
  return K.contactShadow(u, x, y + 1, 26, L, { ry: 2.4, opacity: .55 }) + `<path d="${sp([[x - 13, y], [x - 8, y - 4], [x, y - 3], [x + 8, y - 5], [x + 13, y - 1], [x + 6, y + 2], [x - 6, y + 2.4]], true)}" fill="${t.core}" stroke="${t.outline}" stroke-width=".5"/>`
    + `<path d="${sp([[x - 6, y - 3], [x - 4, y - 9], [x + 3, y - 10], [x + 6, y - 4]])}" fill="${t.half}" stroke="${t.outline}" stroke-width=".5"/><path d="M${x - 12} ${y - .6}Q${x} ${y - 4.4} ${x + 12} ${y - 1.4}" stroke="#dfe8ff" stroke-width=".5" fill="none" opacity=".6"/>`;
}
