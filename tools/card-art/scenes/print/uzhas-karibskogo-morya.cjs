// «Ужас Карибского моря» (Месть королевы Анны, ПРИКАЗ: вражеский корабль теряет 2 Команды и до конца хода не может
// разыгрывать Реакции), refined from the first-round scene (portrait-revenge.cjs SCENES['Ужас Карибского моря']): the
// same idea — the terror of the Caribbean, his face in shadow, the fuses smouldering under his hat, the sea burning
// behind him. After the brief: he stands at the bow of the Revenge in the smoke, and over the burning water the
// Company ship's crew are already going over the side. Kept: the dark captain big in the middle, the tricorn, the
// smoke of the fuses drifting up, the sea on fire behind him, the red night. Changed on purpose: he is seen from
// behind (no face, no beard — a silhouette against the fire, not a likeness of anyone); his right fist round the fore
// shroud, his left hand low with the cutlass; long black hair tied with a red ribbon, a heavy coat with turned-back
// cuffs, a baldric. Fixed against the first round: the face was a flat mask on a flat coat; the pistols were brown
// blobs on a strip; the fires were a row of flat tongues — now the kit's fires on the water with their glow and
// smoke, the kit's Endeavour across the water with men's splashes round her, our bulwark at the bottom.
// Light: the burning sea ahead (key, a point low on the water, contre-jour: warm rims round him, the hat and the
// smoke lit from below); the red night (fill).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { tricorn } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom } = PK;

const HZ = 100;
const FIRE = { x: 120, y: 106 };                                   // the heart of the burning water ahead
const EN = { kind: 'endeavour', x: 172, y: 107, scale: .42, sails: 'full', seed: 4 };
const HEAD = { c: [76, 40], r: 7.4 };
const RAIL = 126;                                                   // the top of our bulwark
const FIG = { x: 80, y: 48, s: 1.3 };                               // where his head goes in the picture, and his scale
const light = { time: 'dusk', haze: .35, key: { type: 'point', x: FIRE.x, y: FIRE.y - 6, h: 3, gy: FIRE.y + 4, color: '#ff8a3a', power: 1, radius: 170, z: .2 },
  fill: { color: '#3a1420', power: .4 }, rim: { az: 10, color: '#ffb070', power: .6 } };
const skel = { horizon: HZ, eye: 4, light: 'the burning sea ahead (key, point low on the water, contre-jour on the captain); the red night (fill)', items: [
  ['captain', 40, 200, 90, 176, 'our forecastle, behind the bulwark: seen from behind, head at y 40'],
  ['shroud', 108, RAIL, 44, 136, 'from the channel up out of the top; his right fist round it'],
  ['cutlass', 14, 124, 42, 22, 'in his left fist, low'],
  ['enemy', 136, EN.y, 50, 50, 'water: across the fire'],
  ['fires', 0, 118, 200, 24, 'on the water between'],
  ['bulwark', -10, 170, 220, 44, 'the near side']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const COAT = { lit: '#6a3e3a', half: '#2c1a1e', core: '#201216', shadow: '#0e070a', outline: '#050203' };
const CUFF = { lit: '#7a4a40', half: '#3a2024', shadow: '#140a0c', outline: '#050203' };
const SKIN = { lit: '#d89a6a', half: '#7a4a30', core: '#5a3220', shadow: '#2a160c', outline: '#100604' };
const RIMC = '#ffa458';
const HAIR = '#141012';
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// a hand round a cylinder whose axis must run at t degrees: turn the hand until its grip axis does (as in na-abordazh)
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// the head as head34 models it (x right, y down, z out of the face), turned by `yaw` degrees about the vertical: at
// 180 the back of the head is towards us. Only Q and depth, for the tricorn of lib/hat.cjs.
function headFrame(c, r, yawDeg, nodDeg) {
  const yaw = yawDeg * Math.PI / 180, nod = nodDeg * Math.PI / 180, cY = Math.cos(yaw), sY = Math.sin(yaw), cN = Math.cos(nod), sN = Math.sin(nod);
  const rot = p => { const x = p[0] * cY + p[2] * sY, z = -p[0] * sY + p[2] * cY; return [x, p[1] * cN + z * sN, -p[1] * sN + z * cN]; };
  return { Q: (x, y, z) => { const q = rot([x, y, z]); return [c[0] + q[0] * r, c[1] + q[1] * r]; }, depth: (x, y, z) => rot([x, y, z])[2] };
}

module.exports = { name: 'Ужас Карибского моря', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, { sky: ['#0c0408', '#2a0c10', '#6a1e14', '#c2501e'], sea: ['#b4502a', '#401812', '#0e0406'], cloudLit: '#e07040', cloudShade: '#2a0e14', smoke: '#3a2220' });
    // ——— the red night: the sky over the burning sea, a few stars high up ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 26, seed: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 22, 80, 7, 5, .3], [30, 12, 60, 6, 11, .4], [176, 74, 50, 4, 3, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += glow(u, FIRE.x, HZ, 140, 34, '#ff7a2a', .55);
    bg += K.water(u, L, { horizon: HZ, bottom: 200, swell: .4, seed: 13, glitter: FIRE.x });
    // ——— the Company ship across the burning water; her men going over the side ———
    bg += K.ship(u, L, Object.assign({ wake: false, reflect: true, lights: true }, EN));
    bg += K.localGlow(u, { x: 158, y: 100, color: '#ff9a48', power: .45, radius: 30 }, { core: false });
    for (const [x, y, w, sd] of [[151, 108.4, 5.2, 4], [192, 108.6, 4.4, 7], [156, 109.6, 3.6, 10]]) bg += K.splash(u, { x, y, w, h: w * 1.1, seed: sd, L });
    // ——— smoke off the burning water, lit from below, drifting right; behind the captain's head a lit column ———
    const Ls = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#4a2a26' }) });
    bg += K.smoke(u, Ls, { x: 36, y: 106, w: 70, h: 92, wind: .45, seed: 8, opacity: .85, glow: { color: '#ff7a2a', power: .6 } });
    bg += K.smoke(u, Ls, { x: 112, y: 104, w: 60, h: 70, wind: .6, seed: 17, opacity: .7, glow: { color: '#ff8a2a', power: .55 } });
    bg += K.smoke(u, Ls, { x: 196, y: 108, w: 40, h: 54, wind: .4, seed: 3, opacity: .7, glow: { color: '#ff8a2a', power: .5 } });
    // ——— the fires on the water, far to near ———
    for (const [x, y, w, h, sd] of [[150, 108.6, 26, 5, 2], [104, 106.4, 14, 8, 5], [40, 107, 18, 11, 9], [126, 111, 24, 15, 3], [8, 113, 24, 15, 12], [196, 114, 22, 14, 6], [62, 116, 18, 10, 14]])
      bg += K.fire(u, { x, y, w, h, seed: sd, wind: .35, glow: true, pool: true });
    bg += glow(u, 118, 112, 60, 14, '#ffb050', .35);

    // ——— our bulwark at the bottom, its inner face away from the fire ———
    let fg = K.bulwark(u, L, { x1: -10, x2: 210, y: 172, h: 46, kind: 'oak', posts: 24, seed: 5 });
    fg += `<path d="M-10 ${RAIL + .2}H210" stroke="${RIMC}" stroke-width=".6" opacity=".6"/>`;
    fg += gloom(u, 100, 120, 100, 175, .55, '#0a0204');
    // ——— the captain, big, with the fore shroud he holds: drawn in his own units, scaled up into the picture ———
    fg += `<g transform="translate(${f(FIG.x - HEAD.c[0] * FIG.s)} ${f(FIG.y - HEAD.c[1] * FIG.s)}) scale(${FIG.s})">${captain(u, L)}</g>`;
    // the night closing in at the top, the warm haze low
    fg += gloom(u, 100, 60, 100, 0, .45, '#0a0204');
    return [bg, fg];
  } };

// ——— the captain, seen from behind ———
function captain(u, L) {
  const { c, r } = HEAD;
  let s = '';
  // the fore shroud from the channel (at our rail) up out of the picture, the next one off to the right, ratlines
  const S0 = [145, 102], S1 = [94.6, -40], T0 = [174, 102], T1 = [128, -40];
  s += K.rope(u, L, [S0, S1], { r: .7, seed: 3 }) + `<path d="M${P2(S0)}L${P2(S1)}" stroke="${RIMC}" stroke-width=".3" opacity=".6" transform="translate(.5 0)"/>`;
  s += K.rope(u, L, [T0, T1], { r: .65, seed: 5 });
  for (let k = 1; k < 12; k++) { const t = k / 12, a = [lerp(S0[0], S1[0], t), lerp(S0[1], S1[1], t)], b = [lerp(T0[0], T1[0], t), lerp(T0[1], T1[1], t)];
    s += `<path d="M${P2(a)}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + 1)} ${P2(b)}" stroke="#1a0c08" stroke-width=".42" fill="none"/>`; }
  // the grip on the shroud (his right fist) and the hilt in his left fist
  const GR = [lerp(S0[0], S1[0], (S0[1] - 50) / (S0[1] - S1[1])), 50];
  const ropeAng = Math.atan2(S1[1] - S0[1], S1[0] - S0[0]) * 180 / Math.PI;
  const hR = handOn(u, { s: 1.25, m: 1, roll: 20, pitch: 6, pose: 'wrap', r: 1.1, tone: SKIN, light: [.5, .7], sw: .28, tilt: 8, backFingers: [] }, GR, ropeAng, -20);
  const GS = [52, 110], bladeAng = 160;
  const hS = handOn(u, { s: 1.25, m: -1, roll: 30, pitch: 0, pose: 'wrap', r: .95, tone: SKIN, light: [.5, .7], sw: .28, tilt: 6 }, GS, bladeAng, 70);

  // ——— the coat's back: broad shoulders, the waist, the skirts flaring down past the bulwark ———
  const back = [[70, 51], [82, 51], [90, 53.4], [96.6, 57], [100.6, 62], [101, 70], [99.6, 82], [97.4, 100], [94, 114], [98, 128], [104, 150], [108, 176], [110, 204],
    [42, 204], [44, 176], [48, 150], [54, 128], [58.6, 114], [55.4, 100], [52.6, 82], [51.2, 70], [52.4, 62], [57, 56.6], [63, 53.2]];
  const cg = nid('cb', u), cl = nid('cc', u);
  s += `<defs>${linGrad(cg, 46, 0, 108, 0, [[0, mix(COAT.half, COAT.lit, .25), 1], [.18, COAT.half, 1], [.55, COAT.core, 1], [.86, COAT.half, 1], [1, mix(COAT.half, COAT.lit, .45), 1]])}<clipPath id="${cl}"><path d="${H.sp(back, true)}"/></clipPath></defs>`;
  s += `<path d="${H.sp(back, true)}" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".45"/>`;
  s += `<g clip-path="url(#${cl})">`;
  // the shoulder blades and the hollow of the back, the warm light from below on the skirts
  s += `<ellipse cx="65" cy="74" rx="9" ry="12" fill="${COAT.lit}" opacity=".12"/><ellipse cx="88" cy="74" rx="9" ry="12" fill="${COAT.lit}" opacity=".1"/>`;
  s += `<path d="M76 54V128" stroke="${COAT.shadow}" stroke-width="1.1" opacity=".8"/><path d="M76.6 56V126" stroke="${COAT.lit}" stroke-width=".35" opacity=".35"/>`;
  // the waist seam and the pleats of the skirts with their buttons, the vent down the middle
  s += `<path d="M58.6 114Q76 117 94 114" stroke="${COAT.shadow}" stroke-width=".8" fill="none"/>`;
  for (const [x0, x1] of [[64, 58], [70, 66], [82, 86], [88, 94]]) s += `<path d="M${x0} 116Q${f((x0 + x1) / 2)} 160 ${x1} 204" stroke="${COAT.shadow}" stroke-width="1" fill="none" opacity=".85"/><path d="M${x0 + .8} 117Q${f((x0 + x1) / 2 + .8)} 160 ${x1 + .8} 204" stroke="${COAT.lit}" stroke-width=".4" fill="none" opacity=".3"/>`;
  s += `<path d="M76 128L75 204" stroke="#000" stroke-width="1.3" opacity=".7"/><path d="M76.8 128L76 204" stroke="${COAT.lit}" stroke-width=".4" opacity=".35"/>`;
  for (const x of [69, 83]) s += K.shadeSphere(u, x, 117.4, 1.15, L, 'brass', { outline: .25 });
  // the fire's glow low on the skirts and on the near edges
  { const g = nid('cw', u); s += `<defs>${radGrad(g, 100, 128, 40, [[0, '#ff8a3a', .35], [1, '#ff8a3a', 0]])}</defs><rect x="40" y="90" width="72" height="120" fill="url(#${g})"/>`; }
  s += '</g>';
  // the rims of the fire round the coat: strong on the right (towards the heart of the fire), weaker on the left
  s += `<path d="${H.sp([[100.6, 62], [101, 70], [99.6, 82], [97.4, 100], [94, 114], [98, 128], [104, 150], [108, 176]])}" stroke="${RIMC}" stroke-width=".8" fill="none" opacity=".75"/>`;
  s += `<path d="${H.sp([[52.6, 82], [55.4, 100], [58.6, 114], [54, 128], [48, 150], [44, 176]])}" stroke="${RIMC}" stroke-width=".55" fill="none" opacity=".45"/>`;
  // ——— the baldric: over his right shoulder, across the back to the left hip, a brass buckle on it ———
  { const B = [[90, 54], [97, 59], [62, 126], [55.6, 121]], g = nid('bd', u);
    s += `<defs>${linGrad(g, 90, 54, 58, 124, [[0, '#6a3a1e', 1], [.5, '#4a2812', 1], [1, '#2a160a', 1]])}</defs><path d="M${B.map(P2).join('L')}Z" fill="url(#${g})" stroke="#0e0604" stroke-width=".4"/>`;
    s += `<path d="M97 59L62 126" stroke="${RIMC}" stroke-width=".5" opacity=".6"/><path d="M91 56L57 122" stroke="#8a5a30" stroke-width=".3" opacity=".6"/>`;
    s += `<rect x="-3" y="-2.6" width="6" height="5.2" rx=".6" fill="none" stroke="url(#brass${u})" stroke-width="1" transform="translate(77.6 89) rotate(-62)"/><path d="M77.6 89l2.4 -1.4" stroke="#d8b060" stroke-width=".5"/>`; }

  // ——— his left arm, low: one sleeve from the shoulder to the turned-back cuff, the fist on the hilt ———
  s += sabre(u, L, hS, bladeAng, 'back');
  s += hS.back;
  s += H.cloth(u, { spine: [[55.4, 63], [52.6, 74], [50.6, 85], [50.6, 95], lerp2(hS.wrist, [50.6, 95], -.05)], w: [12, 11.2, 10.4, 9.4, 8], tone: COAT, lit: -1, rim: RIMC, rimSide: -1, rimOp: .4, seed: 3, drapes: 2, foldW: .9, sw: .4, capA: true,
    cuff: { from: .66, k: 1.42, tone: CUFF } });
  s += hS.front;
  s += sabre(u, L, hS, bladeAng, 'front');
  // ——— his right arm raised to the shroud ———
  s += hR.back;
  s += H.cloth(u, { spine: [[96, 62], [104, 69], [112.4, 74], [119, 67], lerp2(hR.wrist, [119, 67], -.05)], w: [12, 11, 10.2, 9, 8], tone: COAT, lit: 1, rim: RIMC, rimSide: 1, rimOp: .7, seed: 5, drapes: 2, foldW: .9, sw: .4, capA: true,
    cuff: { from: .7, k: 1.4, tone: CUFF } });
  s += hR.front;

  // ——— the head from behind: the neck, the jaw's corner and the ear on the side towards the fire, the hair over the rest ———
  const hd = headFrame(c, r, 160, 6), R = rng(9);
  const at = (x, y) => [c[0] + x * r, c[1] + y * r];
  // the neck, short, in shade, between the hair and the coat's collar
  s += `<path d="${H.sp([at(-.5, .7), at(.5, .7), at(.6, 1.5), at(0, 1.62), at(-.6, 1.5)], true)}" fill="${SKIN.shadow}" stroke="${SKIN.outline}" stroke-width=".3"/><path d="${H.sp([at(.5, .74), at(.58, 1.1), at(.6, 1.5)])}" stroke="${RIMC}" stroke-width=".5" fill="none" opacity=".6"/>`;
  // the coat's turned-down collar round the neck
  s += `<path d="M${P2(at(-.86, 1.46))}Q${P2(at(0, 1.3))} ${P2(at(.86, 1.46))}L${P2(at(1.2, 1.9))}Q${P2(at(0, 1.66))} ${P2(at(-1.2, 1.9))}Z" fill="${COAT.half}" stroke="${COAT.outline}" stroke-width=".4"/><path d="M${P2(at(.86, 1.46))}L${P2(at(1.2, 1.9))}" stroke="${RIMC}" stroke-width=".5" opacity=".6"/>`;
  // the jaw and the cheek's edge: a dark sliver under the ear, its rim lit
  { const J = [at(.5, .2), at(.8, .3), at(.78, .64), at(.66, .9), at(.46, .96), at(.4, .6)];
    s += `<path d="${H.sp(J, true)}" fill="${SKIN.shadow}" stroke="${SKIN.outline}" stroke-width=".3"/><path d="${H.sp([at(.8, .32), at(.78, .64), at(.66, .9)])}" stroke="${RIMC}" stroke-width=".55" fill="none" opacity=".8"/>`; }
  // the skull and the hair over it, drawn back to the nape
  const hairP = [at(-.88, -.1), at(-.84, -.56), at(-.52, -.92), at(0, -1.04), at(.5, -.94), at(.84, -.58), at(.88, -.1), at(.76, .3), at(.6, .66), at(.34, .9), at(.12, 1.0), at(-.12, 1.0), at(-.36, .9), at(-.62, .66), at(-.8, .3)];
  s += H.hairMass(u, hairP, { r, color: HAIR, seed: 7, n: 46, light: [.5, .5], flow: p => { const dx = c[0] - p[0], dy = c[1] + r - p[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }, tufts: [1, 13], tuftLen: .1 });
  s += `<path d="${H.sp([at(.84, -.5), at(.88, -.1), at(.76, .3), at(.6, .66), at(.34, .9)])}" stroke="${RIMC}" stroke-width=".55" fill="none" opacity=".7"/>`;
  // the queue: gathered at the nape, down the back over the collar, bound with a red ribbon half way, the ends hanging
  { const q = [at(-.2, .86), at(.22, .86), at(.26, 1.9), at(.2, 3.2), at(.04, 4.0), at(-.1, 3.2), at(-.2, 1.9)];
    s += H.hairMass(u, q, { r, color: HAIR, seed: 4, n: 14, light: [.5, .4], flow: () => [0, 1], tufts: [3, 4], tuftLen: .12 });
    s += `<path d="${H.sp([at(.24, 1), at(.26, 1.9), at(.2, 3.2), at(.04, 3.9)])}" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".55"/>`;
    const b = at(.03, 2.3);
    s += `<path d="M${P2(b)}q-1.4 3 -.6 6.2l.9 -.2q-.6 -3 .4 -5.8zM${P2(b)}q1.6 2.6 1.8 5.8l-.9 0q-.2 -3 -1.4 -5.6z" fill="#8a1a12" stroke="#2a0604" stroke-width=".25"/>`
      + `<path d="M${f(b[0] - 1.7)} ${f(b[1] - 1.1)}h3.4v2.2h-3.4z" fill="#b02a1c" stroke="#2a0604" stroke-width=".3"/><path d="M${f(b[0] + 1.7)} ${f(b[1] - 1.1)}v2.2" stroke="${RIMC}" stroke-width=".4" opacity=".7"/>`; }
  // the near ear, in shade, its rim lit
  { const E = [at(.72, -.02), at(.92, -.08), at(1.0, .14), at(.94, .4), at(.8, .5), at(.72, .34)];
    s += `<path d="${H.sp(E, true)}" fill="${SKIN.core}" stroke="${SKIN.outline}" stroke-width=".3"/><path d="${H.sp([at(.92, -.06), at(1.0, .14), at(.94, .4)])}" stroke="${RIMC}" stroke-width=".5" fill="none" opacity=".85"/><path d="${H.sp([at(.8, .06), at(.88, .2), at(.82, .36)])}" stroke="${SKIN.shadow}" stroke-width=".35" fill="none"/>`; }
  // ——— the slow-match fuses tucked under the brim: cords hanging past the hair, their ends glowing, smoke curling up ———
  const fuses = [[-1.02, -.42, 2.1, -12], [-.9, -.5, 1.1, 6], [1.04, -.4, 2.4, 10]];
  let embers = '', smk = '';
  fuses.forEach(([x, y, len, a], i) => { const p = at(x, y), q = [p[0] + Math.sin(a * Math.PI / 180) * len * r * .5, p[1] + len * r * .5];
    s += `<path d="M${P2(p)}Q${f(p[0] + (q[0] - p[0]) * .2 + .5)} ${f((p[1] + q[1]) / 2)} ${P2(q)}" stroke="#20160e" stroke-width=".85" fill="none" stroke-linecap="round"/><path d="M${P2(p)}Q${f(p[0] + (q[0] - p[0]) * .2 + .5)} ${f((p[1] + q[1]) / 2)} ${P2(q)}" stroke="#7a5a3a" stroke-width=".3" fill="none" opacity=".6"/>`;
    embers += glow(u, q[0], q[1], 3, 3, '#ff9a3a', .85) + `<circle cx="${f(q[0])}" cy="${f(q[1])}" r=".6" fill="#ffd27a"/><circle cx="${f(q[0])}" cy="${f(q[1])}" r=".28" fill="#fff4d0"/>`;
    // the smoke: a thin thread up from the ember, out round the brim, widening, curling and drifting off to the right
    const sd = x > 0 ? 1 : -1, W = [q, [q[0] + sd * 1.4, q[1] - 4], [q[0] + sd * 4.4, q[1] - 9], [q[0] + sd * 4 + 3, q[1] - 15], [q[0] + 2 + i * 3, q[1] - 21 - i], [q[0] + 10 + i * 4, q[1] - 27 - i * 3], [q[0] + 22 + i * 4, q[1] - 30 - i * 4]];
    for (const [w, op, col] of [[3.2, .1, '#bfa49a'], [1.6, .2, '#d8c0b0'], [.5, .4, '#ffd8b8']]) smk += `<path d="${H.sp(W)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
    for (let k = 0; k < 3; k++) { const pp = W[3 + k]; smk += `<ellipse cx="${f(pp[0] + (R() - .5) * 2)}" cy="${f(pp[1])}" rx="${f(2 + k * 1.4)}" ry="${f(1.2 + k * .7)}" fill="#c8b0a4" opacity="${f(.1 - k * .02)}"/>`; } });
  { const bl = nid('fb', u); s += `<defs><filter id="${bl}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".35"/></filter></defs><g filter="url(#${bl})">${smk}</g>`; }
  // ——— the tricorn: the felt brim turned up in three, gold braid on its edge ———
  const hat = tricorn(u, hd, { r, color: '#16100f', dark: '#060304', lit: '#5a3a30', trim: '#b08a3a', light: [.45, .6], rim: RIMC, y: -.6, size: 1.56, turnUp: .82, seed: 3 });
  s += hat.back + hat.front + embers;
  return s;
}
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// the cutlass in his left fist: the grip through the fist, a brass shell guard and knuckle-bow, the blade out to the
// left and down, the fire along its edge. part: 'back' — the blade and the pommel (behind the fingers), 'front' — the guard
function sabre(u, L, h, bladeAng, part) {
  const v = [Math.cos(bladeAng * Math.PI / 180), Math.sin(bladeAng * Math.PI / 180)], nn = [-v[1], v[0]], g = h.grip;
  const at = (t, o) => [g[0] + v[0] * t + nn[0] * o, g[1] + v[1] * t + nn[1] * o];
  if (part === 'back') {
    let s = K.shadeCyl(u, ...at(-5.6, 0), ...at(4.4, 0), 1.1, L, 'leather', { outline: .3, seed: 4 }) + K.shadeSphere(u, ...at(-6.2, 0), 1.4, L, 'brass', { outline: .3 });
    const B = [at(6, -1.2), at(16, -1.5), at(26, -.8), at(34.6, 1.4), at(37.4, 2.8), at(35.6, .9), at(26, 2.1), at(16, 1.7), at(6, 1.2)];
    const bid = nid('bl', u), b0 = at(20, -1.6), b1 = at(20, 2.2);
    s += `<defs>${linGrad(bid, b0[0], b0[1], b1[0], b1[1], [[0, '#ffd8a8', 1], [.3, '#a8a09a', 1], [.62, '#4a4644', 1], [1, '#ffb070', 1]])}</defs>`
      + `<path d="M${P2(B[0])}Q${P2(B[1])} ${P2(B[2])}Q${P2(at(31, .2))} ${P2(B[3])}L${P2(B[4])}L${P2(B[5])}Q${P2(at(30, 2.2))} ${P2(B[6])}Q${P2(B[7])} ${P2(B[8])}Z" fill="url(#${bid})" stroke="#1a1410" stroke-width=".3"/>`
      + `<path d="M${P2(at(7, -.2))}Q${P2(at(16, -.4))} ${P2(at(28, .3))}" stroke="#3a3634" stroke-width=".45" fill="none"/>`
      + `<path d="M${P2(at(8, 1.1))}Q${P2(at(18, 1.7))} ${P2(at(33, 1.9))}" stroke="#ffe0b0" stroke-width=".4" fill="none" opacity=".85"/>`;
    return s;
  }
  // the shell guard over the fist's lower end and the knuckle-bow round the fingers
  const c0 = at(5.2, 0);
  return `<ellipse cx="${f(c0[0])}" cy="${f(c0[1])}" rx="1.5" ry="3.6" transform="rotate(${f(bladeAng)} ${f(c0[0])} ${f(c0[1])})" fill="url(#brass${u})" stroke="#2a1a08" stroke-width=".3"/>`
    + `<path d="M${P2(at(5.4, 2.6))}Q${P2(at(0, 5.4))} ${P2(at(-5.8, 1.2))}" stroke="#3a2a10" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M${P2(at(5.4, 2.6))}Q${P2(at(0, 5.4))} ${P2(at(-5.8, 1.2))}" stroke="#d0a050" stroke-width=".55" fill="none" stroke-linecap="round"/>`;
}
