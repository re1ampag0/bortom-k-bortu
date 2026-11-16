// «Лунный свет» (Колода моря): a silver full moon rises huge over the sea; we are crouched on the deck of a ship
// under fire, by her bulwark. Two sailors sit low with their backs to the planking, knees up, heads well under the
// rail, while the enemy's musketry winks on a ship far out on the moonlit sea: a ball has just struck the rail cap
// over the left man's head and thrown up a spray of splinters — and nobody is hit. Card: for the whole round damage
// to Команда is 1 less (in the moonlight the men are hard to hit and keep under cover).
// Print review fix: the two sailors were cursed men whose bones glowed through their see-through bodies (bandanas,
// skulls) — directly the cursed crew of a well-known film. Now they are ordinary men taking cover; no skeletons,
// nothing see-through. The moon, the sea, the mast and shrouds, the coil and the hat on the deck are kept.
// Brief: docs/mockups/print/card-briefs.md «Лунный свет».
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 96;                     // horizon over the rail
const EYE = 1.1;                   // we crouch by the bulwark too
const DECK = 145;                  // where the bulwark meets the deck (≈ 45 units/m there)
const RAIL = 101;                  // the top of the rail cap (the bulwark ≈ 1 m)
const MOON = { x: 104, y: 52, r: 36 };
const HIT = [70, RAIL - 1];        // where the ball strikes the rail cap
const light = {
  time: 'night', haze: .3,
  key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#dfe8ff', power: .9 },
  fill: { color: '#1b2a48', power: .45 },
  rim: { az: 0, color: '#f4f7ff', power: .8 },
};
const skel = { horizon: HZ, eye: EYE, light: 'the full moon low over the sea behind the bulwark: the men under it in its shadow, silver edges on their heads and shoulders, the rail cap lit along its top',
  items: [
    ['moon', 68, 88, 72, 72, 'a huge disc low over the sea'],
    ['enemy', 20, HZ + 1, 22, 16, 'a ship far out on the sea, musket flashes along her rail'],
    ['bulwark', -12, DECK, 224, DECK - RAIL, 'our bulwark across the frame, the sea over it'],
    ['splinters', HIT[0] - 10, HIT[1] + 2, 20, 16, 'a ball strikes the rail cap over the left man'],
    ['man left', 40, 149, 46, 40, 'sitting against the bulwark, knees up, head under the rail, ≈ 45 units/m'],
    ['man right', 116, 149, 46, 40, 'sitting against the bulwark, hunched over his knees, head down'],
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

module.exports = { name: 'Лунный свет', kind: 'sea', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE });
    L.pal = Object.assign({}, L.pal, { sky: ['#05081a', '#0c1430', '#1a2a4c', '#34486a'], sea: ['#5a7090', '#1e3048', '#0a1424'] });
    let bg = K.sky(u, L, { horizon: HZ, stars: 50, seed: 3 });
    bg += moonDisc(u, MOON);
    bg += K.cloud(u, L, { x: 36, y: 34, w: 60, h: 12, seed: 6, far: .3 }) + K.cloud(u, L, { x: 176, y: 44, w: 52, h: 10, seed: 9, far: .4 });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .15, seed: 7, glitter: MOON.x });
    // ——— the enemy far out on the moonlit sea, the flashes of her muskets along her rail
    bg += K.ship(u, L, { kind: 'warship', x: 30, y: HZ + .9, scale: .17, flip: false, sails: 'reefed', detail: 'far', seed: 6 });
    for (const [x, y, d, sd] of [[24, HZ - 1.2, 8, 1], [29, HZ - 1.3, -4, 2], [34, HZ - 1.1, 4, 0], [38.5, HZ - 1, 12, 1]])
      bg += K.muzzleFlash(u, { x, y, dir: d, len: 2, seed: sd, smoke: false, glow: false }) + K.localGlow(u, { x, y, color: '#ffd8a0', power: .45, radius: 3 }, { core: false });
    // ——— our ship: the deck running to us, the bulwark across the frame, the mast and its shrouds
    bg += K.deck(u, L, { horizon: HZ, top: DECK, bottom: 292, vx: 104, seed: 5, plank: 26, wet: true });
    bg += mastAndShrouds(u, L);
    bg += bulwark(u, L);
    // the moonlight lies on the deck in a long pale path between the men
    bg += K.localGlow(u, { x: 104, y: 170, color: '#c8d8f4', power: .22, radius: 70 }, { squash: .3, core: false });
    // ——— the two men sitting with their backs to the bulwark; their shadows short under them
    let fg = crew(u, L);
    // ——— the ball strikes the rail cap over the left man: a gouge, splinters thrown up and out, wood dust
    fg += strike(u, L, HIT);
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

/** Our bulwark across the frame seen from the deck: the kit's planking and stanchions, in the moon's shadow (it is
 *  behind the bulwark), the rail cap lit along its top. */
function bulwark(u, L) {
  let s = K.bulwark(u, L, { x1: -12, x2: 212, y: DECK, h: DECK - RAIL, kind: 'oak', posts: 9, seed: 3 });
  s += `<rect x="-12" y="${RAIL + 1}" width="224" height="${DECK - RAIL - 1}" fill="#1a2440" opacity=".55" style="mix-blend-mode:multiply"/>`;
  s += `<path d="M-12 ${RAIL + .2}H212" stroke="#dfe8ff" stroke-width=".7" opacity=".7"/>`;
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

// ——— the crew: two sailors sitting on the deck with their backs against the bulwark (people.cjs figure(), ≈ 38
// units/m here: 1.8 m ≈ 70), knees drawn up, heads below the rail. The moon behind them: faces and fronts in the
// shade, silver edges on the heads and shoulders. The left one looks up at the splinters over him, his arms round his
// knees; the right one hunches over his knees, arms round his shins, head down, his hat pulled low.
const SIT_A = { turn: .3, sit: true, pelvis: [0, -8, 0], torso: [0, -2, -4], head: { turn: .25, nod: -20 },
  legs: { R: { thigh: [140, 10], shin: [-18, 4], foot: [0, 10], weight: true }, L: { thigh: [130, 16], shin: [-30, 6], foot: [0, 16] } },
  arms: { R: { to: [-.35, -1.05, 1.3], pole: [-1, -.6, .2] }, L: { to: [.75, -1.2, .75], pole: [1, -.2, -.6] } }, hands: { R: 'relaxed', L: 'relaxed' } };
const SIT_B = { turn: .45, sit: true, pelvis: [0, -4, 0], torso: [0, 16, 4], head: { turn: -.1, nod: 24 },
  legs: { R: { thigh: [150, 6], shin: [-14, 2], foot: [0, 8], weight: true }, L: { thigh: [146, 10], shin: [-10, 4], foot: [0, 12] } },
  arms: { R: { to: [-.05, -.85, 1.3], pole: [-1, -.2, .4] }, L: { to: [.2, -.85, 1.3], pole: [1, -.2, .4] } }, hands: { R: 'fist', L: 'fist' } };
function crew(u, L) {
  const at = [[62, DECK + 4], [140, DECK + 4]];
  const a = H.figure(nid('ca', u), { L, at: at[0], h: 81, dir: 1, pose: SIT_A, seed: 4, dim: .35,
    dress: { shirt: '#c8c0ac', vest: '#4a2a1a', trousers: '#3a3a4a', boots: '#1a1410', boot: 'shoe', belt: '#2a1a10' },
    skin: 'tan', head: { hair: { style: 'short', color: '#2a1a10' }, hairColor: '#2a1a10', brow: 'up', mouth: .25, eye: 'open', stubble: true } });
  const b = H.figure(nid('cb', u), { L, at: at[1], h: 81, dir: -1, pose: SIT_B, seed: 7, dim: .35,
    dress: { shirt: '#9aa4b8', trousers: '#4a3a30', boot: 'bare', kerchief: '#5a3a2a', belt: '#1a120c' },
    skin: 'olive', head: { hair: { style: 'short', color: '#1a1410' }, hairColor: '#1a1410', beard: true, brow: 'frown' }, hat: { color: '#1c1a20' } });
  // the dark of the bulwark's foot behind and under them
  let s = '';
  for (const [x, y] of at) s += K.contactShadow(u, x, y - 1, 34, L, { ry: 3, opacity: .7 });
  return s + a.svg + b.svg;
}
/** The ball's strike on the rail cap: a ragged gouge bitten out of the cap, splinters of every size thrown up and
 *  out (pale fresh wood inside, dark weathered outside, lit by the moon on top), a puff of wood dust. */
function strike(u, L, [x, y]) {
  const R = rng(23), oak = L.ramp('oak', x, y), dust = nid('dd', u);
  // the gouge: a dark bite out of the cap's top, pale torn wood round its lips
  let s = `<path d="M${f(x - 3.4)} ${f(y - .9)}L${f(x - 2)} ${f(y + .4)}L${f(x - .6)} ${f(y - .2)}L${f(x + .6)} ${f(y + 1.2)}L${f(x + 2.2)} ${f(y + .2)}L${f(x + 3.6)} ${f(y - .9)}Z" fill="#06080e"/>`
    + `<path d="M${f(x - 3.4)} ${f(y - .9)}L${f(x - 2)} ${f(y + .4)}L${f(x - .6)} ${f(y - .2)}L${f(x + .6)} ${f(y + 1.2)}L${f(x + 2.2)} ${f(y + .2)}L${f(x + 3.6)} ${f(y - .9)}" stroke="#d8c4a0" stroke-width=".35" fill="none"/>`;
  // the wood dust: a soft pale puff over the hit, lit by the moon
  s += `<defs><filter id="${dust}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>`
    + `<ellipse cx="${f(x + .5)}" cy="${f(y - 3.6)}" rx="6.5" ry="4" fill="#b8bcc4" opacity=".35" filter="url(#${dust})"/>`
    + `<ellipse cx="${f(x + .3)}" cy="${f(y - 2.2)}" rx="3" ry="2" fill="#c8ccd2" opacity=".4" filter="url(#${dust})"/>`;
  // the splinters: pale fresh wood torn out of the cap, thin wedges flying up and out from the hit, the long ones
  // first; each with a dark edge so it reads against the sky
  for (let i = 0; i < 18; i++) { const a = (-170 + R() * 160) * Math.PI / 180, d = 2.5 + R() * (i < 7 ? 6 : 10), l = .7 + R() * (i < 7 ? 2.6 : 1.1), w = .22 + R() * .3,
    cx = x + Math.cos(a) * d, cy = y - 1 + Math.sin(a) * d * .85, rot = a * 180 / Math.PI + (R() - .5) * 40;
    s += `<path d="M${f(-l)} 0L${f(-l * .2)} ${f(-w)}L${f(l)} 0L${f(-l * .1)} ${f(w)}Z" fill="${R() > .35 ? '#cfc4ae' : '#8a7a62'}" stroke="#3a2a1a" stroke-width=".14" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"/>`; }
  return s;
}
/** A knocked-off hat lying on the deck in the moonlight, under the glass. */
function hatOnDeck(u, L, x, y) {
  const t = L.ramp('tar', x, y);
  return K.contactShadow(u, x, y + 1, 26, L, { ry: 2.4, opacity: .55 }) + `<path d="${sp([[x - 13, y], [x - 8, y - 4], [x, y - 3], [x + 8, y - 5], [x + 13, y - 1], [x + 6, y + 2], [x - 6, y + 2.4]], true)}" fill="${t.core}" stroke="${t.outline}" stroke-width=".5"/>`
    + `<path d="${sp([[x - 6, y - 3], [x - 4, y - 9], [x + 3, y - 10], [x + 6, y - 4]])}" fill="${t.half}" stroke="${t.outline}" stroke-width=".5"/><path d="M${x - 12} ${y - .6}Q${x} ${y - 4.4} ${x + 12} ${y - 1.4}" stroke="#dfe8ff" stroke-width=".5" fill="none" opacity=".6"/>`;
}
