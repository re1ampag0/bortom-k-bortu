// «Лунный свет» (Колода моря): a silver full moon rises huge behind the waist of a ship; on the deck two sailors
// fight in front of its disc. In its light their flesh turns to smoke and the bones show through — skulls, ribs,
// the long bones of the arms and legs. One lunges and runs the other through: the sabre passes clean through his
// chest and out of his back, and he only grins and raises his own blade. The moon is over everyone: both men are
// cursed alike. Card: for the whole round damage to Команда is 1 less (cutlasses do not take the men).
// Not «Зомби-офицеры» (the dead of the Revenge): here it is the moonlight that does it, to all.
// Brief: docs/mockups/print/card-briefs.md «Лунный свет».
'use strict';
const K = require('../kit/index.cjs');
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
  knF: [48.4, 108.4], anF: [37.4, 120.2], toeF: [42, 123.6], heelF: [34.4, 123],
};
const D = {
  head: [118.4, 68.2], hr: 4.5, neck: [120, 73.4], shF: [122.4, 76.8], shN: [120.4, 77.6], hip: [124, 96.4],
  elN: [114.4, 89.4], wrN: [114.6, 100.4], fistN: [114.8, 103],
  elF: [131.6, 68.4], wrF: [129.6, 57.4], fistF: [129.2, 55],
  knN: [115, 110.4], anN: [111, 124.6], toeN: [104, 127], heelN: [113.2, 127.2],
  knF: [130.4, 110.6], anF: [134, 123], toeF: [128.6, 125.4], heelF: [136.4, 125.2],
};
const TIP = [134.4, 82.8];          // the point of the attacker's sabre, out of the defender's back

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
    fg += cursed(u, L, A, { hat: 'tricorne', facing: 1, coat: true });
    fg += sabre(u, L, A.fistN, TIP, 1);
    fg += cursed(u, L, D, { hat: 'kerchief', facing: -1 });
    // the blade seen faintly through his body, the point bright out of his back
    fg += bladeInside(u, L);
    fg += sabre(u, L, D.fistF, [140.6, 30.6], -1);
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
  for (const [bx, by, rx, ry, sd, op] of [[-.24, -.36, .3, .24, 1, .34], [.2, -.3, .17, .16, 2, .34], [.3, -.02, .22, .19, 3, .32], [.7, -.22, .1, .12, 4, .38], [-.56, .06, .28, .44, 5, .26], [-.1, .36, .2, .13, 6, .25], [.5, .26, .12, .19, 7, .28]])
    s += `<path d="${blob(bx, by, rx, ry, sd)}" fill="#9ea2a0" opacity="${op}"/>`;
  for (let i = 0; i < 12; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * .86, cx = x + Math.cos(a) * d * r, cy = y + Math.sin(a) * d * r, cr = (.03 + R() * .05) * r;
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="#b4b6ac" opacity=".55"/><path d="M${f(cx + cr)} ${f(cy)}A${f(cr)} ${f(cr)} 0 0 1 ${f(cx)} ${f(cy + cr)}" stroke="#fffdf4" stroke-width="${f(cr * .4)}" fill="none" opacity=".7"/>`; }
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

// ——— the cursed men: the flesh a dark translucent smoke against the moon, the clothes a little denser, the silver
// edge on every contour; the bones inside glow pale. Joints J (see A and D), facing 1 — right, −1 — left ———
function cursed(u, L, J, o) {
  const dir = o.facing, body = nid('cb', u), glow = nid('cg', u), rim = '#e8f0ff';
  // the silhouette: limbs as thick round strokes, the torso and the head as shapes, all in one translucent group
  const seg = (a, b, w) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke-width="${f(w)}" stroke-linecap="round" fill="none"/>`;
  const limbs = (col, k) => `<g stroke="${col}">${seg(J.shF, J.elF, 5.6 * k)}${seg(J.elF, J.wrF, 4.4 * k)}${seg(J.hip, J.knF, 8.4 * k)}${seg(J.knF, J.anF, 5.8 * k)}${seg(J.anF, J.toeF, 3 * k)}${seg(J.anF, J.heelF, 3.2 * k)}`
    + `${seg(J.hip, J.knN, 8.8 * k)}${seg(J.knN, J.anN, 6 * k)}${seg(J.anN, J.toeN, 3 * k)}${seg(J.anN, J.heelN, 3.2 * k)}${seg(J.shN, J.elN, 5.8 * k)}${seg(J.elN, J.wrN, 4.6 * k)}${seg(J.neck, J.head, 4.4 * k)}</g>`;
  // the clothes over the flesh: the shirt sleeves, the breeches to below the knee
  const cloth = `<g stroke="#070b16">${seg(J.shF, lerp2(J.shF, J.elF, .9), 6.4)}${seg(J.shN, lerp2(J.shN, J.elN, .9), 6.6)}${seg(J.hip, lerp2(J.knF, J.anF, .2), 9.4)}${seg(J.hip, lerp2(J.knN, J.anN, .2), 9.8)}</g>`;
  const ch = lerp2(J.shF, J.shN, .5), hip = J.hip, ax = hip[0] - ch[0], ay = hip[1] - ch[1], al = Math.hypot(ax, ay), nx = -ay / al, ny = ax / al;
  const T = (t, s) => [lerp(ch[0], hip[0], t) + nx * s, lerp(ch[1], hip[1], t) + ny * s];
  const torso = sp([T(-.12, -7 * dir), T(.3, -7.2 * dir), T(.66, -6 * dir), T(1.08, -7.2), T(1.08, 7.2), T(.66, 5.8 * dir), T(.3, 7.8 * dir), T(-.12, 6.6 * dir)], true);
  const fists = `<circle cx="${f(J.fistN[0])}" cy="${f(J.fistN[1])}" r="2"/><circle cx="${f(J.fistF[0])}" cy="${f(J.fistF[1])}" r="1.9"/>`;
  // the head of flesh round the skull: a profile with the brow, the nose, the chin and a stubbled jaw
  const HQ = (a, c) => [J.head[0] + dir * a * J.hr * 1.2, J.head[1] + c * J.hr * 1.2];
  const headS = `<path d="${sp([HQ(-.9, .3), HQ(-.92, -.4), HQ(-.4, -.94), HQ(.36, -.92), HQ(.8, -.5), HQ(.92, -.12), HQ(1.16, .2), HQ(.94, .32), HQ(.96, .56), HQ(.84, .86), HQ(.3, .92), HQ(-.3, .66)], true)}"/>`;
  let hat = '';
  if (o.hat === 'tricorne') hat = `<path d="${sp([[J.head[0] - 7.6, J.head[1] - 2.6], [J.head[0] - 3, J.head[1] - 4.8], [J.head[0] + 1, J.head[1] - 8.8], [J.head[0] + 5, J.head[1] - 5.6], [J.head[0] + 8.8, J.head[1] - 5.8], [J.head[0] + 6, J.head[1] - 2.2], [J.head[0], J.head[1] - 2.8]], true)}"/>`;
  else hat = `<path d="${sp([[J.head[0] + 4.6, J.head[1] - .4], [J.head[0] + 3.6, J.head[1] - 3.8], [J.head[0], J.head[1] - 5], [J.head[0] - 3.8, J.head[1] - 3.2], [J.head[0] - 4, J.head[1] - 1.6], [J.head[0] + 1, J.head[1] - 2.2]], true)}"/><path d="M${f(J.head[0] + 4.2)} ${f(J.head[1] - 1.4)}q4 1 6.4 4.6q-3.4 -1 -5.8 -2" />`;
  const coat = o.coat ? `<path d="${sp([T(.7, -5.4 * dir), T(1.05, -6.4), lerp2(J.knF, J.hip, .3), [J.hip[0] - 9, J.hip[1] + 10], T(.9, -6)], true)}"/>` : '';
  // a cold glow round the whole figure (blurred copy) and the translucent body over the moon
  let s = `<defs><filter id="${glow}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
  s += `<g filter="url(#${glow})" opacity=".2">${limbs('#9ab4e8', 1.15)}<path d="${torso}" fill="#9ab4e8"/></g>`;
  s += `<g id="${body}" opacity=".8">${limbs('#0d1426', 1)}<g fill="#0d1426"><path d="${torso}"/>${coat}${fists}${headS}${hat}</g></g>`;
  // clothes denser than the flesh: the shirt/coat on the torso, the breeches on the thighs, the hat
  s += `<g opacity=".55" fill="#070b16"><path d="${torso}"/>${coat}${hat}${cloth}</g>`;
  // the silver edge on the contours away from us (towards the moon): offset copies clipped to show only the rim
  s += `<g fill="none" stroke="${rim}" opacity=".55" stroke-width=".55"><path d="${torso}"/>${hat ? `<g>${hat.replace(/<path /g, '<path fill="none" ')}</g>` : ''}${headS.replace('<path ', '<path fill="none" ')}</g>`;
  s += bones(u, J, dir, T);
  return s;
}
// the bones showing through: a skull with dark sockets and a grin, the spine, the ribs round the chest, the pelvis,
// the long bones and the small ones of the hands and feet; pale, glowing a little
function bones(u, J, dir, T) {
  const bc = '#eef0e6', gid = nid('bg', u), b = (a, c, w) => `<path d="M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}" stroke="${bc}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
  const knob = (p, r) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="${bc}"/>`;
  const pair = (a, c, w, gap) => { const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * gap, ny = dx / l * gap; return b([a[0] + nx, a[1] + ny], [c[0] + nx * .6, c[1] + ny * .6], w) + b([a[0] - nx, a[1] - ny], [c[0] - nx * .6, c[1] - ny * .6], w * .8); };
  let s = '';
  // limbs: humerus, radius and ulna, femur, tibia and fibula; knobs at the joints
  s += b(J.shF, J.elF, 1.3) + pair(J.elF, J.wrF, .75, .55) + b(J.hip, J.knF, 1.6) + pair(J.knF, J.anF, .9, .6);
  s += b(J.shN, J.elN, 1.4) + pair(J.elN, J.wrN, .8, .6) + b(J.hip, J.knN, 1.7) + pair(J.knN, J.anN, .95, .65);
  for (const p of [J.elF, J.elN, J.knF, J.knN]) s += knob(p, 1.15);
  // the feet and the hands: a few small bones fanning out
  for (const [a, t1, t2] of [[J.anF, J.toeF, J.heelF], [J.anN, J.toeN, J.heelN]]) { s += b(a, t2, .9); for (const k of [-.5, 0, .5]) s += b(a, [t1[0] + k * .4, t1[1] + k * .7], .55); }
  for (const [w, fz] of [[J.wrF, J.fistF], [J.wrN, J.fistN]]) for (const k of [-.7, 0, .7]) s += b(w, [fz[0] + k * .5, fz[1] + k * .6], .5);
  // the spine: a row of vertebrae from the neck to the pelvis
  for (let t = 0; t <= 1.001; t += .09) { const p = T(t, -1.8 * dir * Math.sin(t * Math.PI) * .6); s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx=".95" ry=".7" fill="${bc}"/>`; }
  // the ribs: curved bars from the spine forward and down round the chest, shorter towards the bottom
  for (let i = 0; i < 6; i++) { const t = .1 + i * .075, back = T(t, -1.6 * dir), front = T(t + .1, (4.6 - i * .25) * dir), mid = T(t - .02, (2.4) * dir);
    s += `<path d="M${f(back[0])} ${f(back[1])}Q${f(mid[0])} ${f(mid[1] - 1.6)} ${f(front[0])} ${f(front[1])}" stroke="${bc}" stroke-width=".85" fill="none" stroke-linecap="round"/>`; }
  { const a = T(.08, 4.2 * dir), c = T(.48, 3.6 * dir); s += b(a, c, 1.1); }                  // the breastbone
  // the collarbones and the pelvis
  s += b(T(.02, -1.6 * dir), T(-.04, 4.4 * dir), .9);
  { const p = T(.97, 0); s += `<path d="${sp([[p[0] - 4.2, p[1] - 2.6], [p[0], p[1] - 1], [p[0] + 4.2, p[1] - 2.6], [p[0] + 3, p[1] + 1.6], [p[0], p[1] + 2.6], [p[0] - 3, p[1] + 1.6]], true)}" fill="${bc}" opacity=".9"/><ellipse cx="${f(p[0])}" cy="${f(p[1] + .4)}" rx="1.6" ry="1.1" fill="#1a2238"/>`; }
  // the skull in profile: the cranium, the eye socket, the nose hole, the cheekbone, the grinning jaw with teeth
  const h = J.head, r = J.hr * .86, Q = (a, c) => [h[0] + dir * a * r, h[1] + c * r];
  s += `<path d="${sp([Q(-.86, .28), Q(-.92, -.36), Q(-.5, -.88), Q(.2, -.98), Q(.74, -.66), Q(.94, -.12), Q(.98, .26), Q(.84, .42), Q(.9, .66), Q(.64, .82), Q(.2, .74), Q(-.28, .62)], true)}" fill="${bc}"/>`;
  s += `<ellipse cx="${f(Q(.5, -.06)[0])}" cy="${f(Q(.5, -.06)[1])}" rx="${f(r * .26)}" ry="${f(r * .24)}" fill="#0a0e1c"/><path d="${sp([Q(.86, .2), Q(.96, .36), Q(.8, .36)], true)}" fill="#0a0e1c"/>`;
  s += `<path d="M${pts([Q(.36, .62), Q(.82, .6)]).join('L')}" stroke="#2a3048" stroke-width=".35"/>`;
  for (let i = 0; i < 4; i++) { const p = Q(.42 + i * .12, .6); s += `<path d="M${f(p[0])} ${f(p[1] - .5)}v1" stroke="#2a3048" stroke-width=".25"/>`; }
  return `<defs><filter id="${gid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter></defs><g filter="url(#${gid})" opacity=".4">${s}</g><g opacity=".85">${s}</g>`;
}
/** A cutlass from the fist to the point: the curved blade with a bright edge towards the moon, the brass guard. */
function sabre(u, L, h, tip, side) {
  const dx = tip[0] - h[0], dy = tip[1] - h[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy * side, ny = ux * side;
  const g = [h[0] + ux * 2, h[1] + uy * 2], m = [lerp(g[0], tip[0], .55) + nx * 1.4, lerp(g[1], tip[1], .55) + ny * 1.4];
  let s = `<path d="M${f(g[0] + nx * .9)} ${f(g[1] + ny * .9)}Q${f(m[0] + nx * 1)} ${f(m[1] + ny * 1)} ${f(tip[0])} ${f(tip[1])}Q${f(m[0] - nx * .6)} ${f(m[1] - ny * .6)} ${f(g[0] - nx * .7)} ${f(g[1] - ny * .7)}Z" fill="#9aa6b8" stroke="#2a3040" stroke-width=".35"/>`;
  s += `<path d="M${f(g[0] + nx * .7)} ${f(g[1] + ny * .7)}Q${f(m[0] + nx * .8)} ${f(m[1] + ny * .8)} ${f(tip[0])} ${f(tip[1])}" stroke="#f4f8ff" stroke-width=".5" fill="none"/>`;
  // the guard: a brass cup round the fist
  s += `<path d="M${f(h[0] + ux * 1.8 + nx * 2.4)} ${f(h[1] + uy * 1.8 + ny * 2.4)}Q${f(h[0] + ux * 3 )} ${f(h[1] + uy * 3)} ${f(h[0] + ux * 1.8 - nx * 2.4)} ${f(h[1] + uy * 1.8 - ny * 2.4)}" stroke="${L.ramp('brass', h[0], h[1]).core}" stroke-width="1.1" fill="none"/>`;
  return s;
}
/** Over the defender's body the blade shows faintly through him; the point comes out of his back bright. */
function bladeInside(u, L) {
  const cid = nid('bi', u), a = [113, 82], b = TIP;
  return `<defs><clipPath id="${cid}"><rect x="${a[0]}" y="70" width="${f(b[0] - a[0])}" height="24"/></clipPath></defs><g clip-path="url(#${cid})" opacity=".5">${sabre(u, L, A.fistN, TIP, 1)}</g>`
    + `<path d="M127.6 82.6L${f(TIP[0])} ${f(TIP[1])}" stroke="#f4f8ff" stroke-width=".6" opacity=".9"/>`;
}
/** A knocked-off hat lying on the deck in the moonlight, under the glass. */
function hatOnDeck(u, L, x, y) {
  const t = L.ramp('tar', x, y);
  return K.contactShadow(u, x, y + 1, 26, L, { ry: 2.4, opacity: .55 }) + `<path d="${sp([[x - 13, y], [x - 8, y - 4], [x, y - 3], [x + 8, y - 5], [x + 13, y - 1], [x + 6, y + 2], [x - 6, y + 2.4]], true)}" fill="${t.core}" stroke="${t.outline}" stroke-width=".5"/>`
    + `<path d="${sp([[x - 6, y - 3], [x - 4, y - 9], [x + 3, y - 10], [x + 6, y - 4]])}" fill="${t.half}" stroke="${t.outline}" stroke-width=".5"/><path d="M${x - 12} ${y - .6}Q${x} ${y - 4.4} ${x + 12} ${y - 1.4}" stroke="#dfe8ff" stroke-width=".5" fill="none" opacity=".6"/>`;
}
