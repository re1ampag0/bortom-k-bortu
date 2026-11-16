// «Корабль в бутылке» (Месть, Легенда, ПРИКАЗ: вражеский корабль с Корпусом 3 или меньше тонет. Это не Залп).
// A poster: Blackbeard's cabin, the great stern window ablaze with the setting sun. His fist (the black coat sleeve,
// the broad gold-laced cuff, a linen ruffle) comes up from below and raises a big corked bottle by its neck against
// the sun — the sun stands right behind the glass, the glass burns at its edges and rays fan out through the cabin.
// Inside, a living storm: the sea in the bottle (level, though the bottle tilts) is torn by a whirlpool, and a
// battered little Company ship (torn sails, the foremast snapped) slides bow first down its wall, spray whirling round
// the glass above it — she sinks into his collection. No fire anywhere: only the sun.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
// the enemy in the bottle: the kit's Company ship beaten — torn sails with holes, yards askew, the foremast snapped
const WRECK = 'endeavour-bottled2';
if (!K.SHIP_SPECS[WRECK]) { const e = K.SHIP_SPECS.endeavour;
  K.SHIP_SPECS[WRECK] = Object.assign({}, e, { cond: 'torn', holeK: 1.1, broken: 1, jibs: 1, masts: e.masts.map((m, i) => i === 0 ? Object.assign({}, m, { H: 56, n: 2, Q: [.5, .9] }) : m) }); }
const { f, mix, lerp, nid, linGrad, radGrad, rng } = K;
const { woodTex } = PK;

const HZ = 96;                                    // eye level = the sea horizon in the window, just over the bottle's sea
const SUN = { x: 60, y: 80 };
const BA = [6, 101], BB = [172, 74], BR = 25;     // the bottle: the axis (base to mouth), the body's radius
const SEA = 104;                                  // the level of the sea inside the bottle (level: the bottle tilts, the water does not)
const VX = 44;                                    // the whirlpool's axis
const light = { time: 'dusk', haze: .45, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffc080', power: 1 }, fill: { color: '#6a3a3a', power: .45 },
  rim: { az: 0, color: '#ffb060', power: .9 } };
const skel = { horizon: HZ, eye: 1.6, light: 'the setting sun in the stern window right behind the bottle (back light): the glass burns at its edges, rays fan out; the fist rim-lit', items: [
  ['window', -4, 152, 208, 146, 'the stern wall', { bg: 1 }],
  ['bottle', 6, 120, 172, 56, 'held by the fist at its neck'], ['sea in it', 8, 120, 92, 16, 'inside the bottle, level'], ['ship in it', 50, 108, 24, 26, 'on the whirlpool\'s wall, inside'],
  ['fist', 124, 108, 40, 40, 'the arm from below, gripping the neck'], ['sleeve', 140, 280, 50, 170, 'the arm, out of the frame below', { edge: 1 }]] };

// the bottle's profile: [t along the axis, radius share] — a long clear body, a short shoulder, a long neck (room for
// a fist), a string rim at the mouth
const PROF = [[0, .92], [.02, 1], [.5, 1], [.56, .93], [.63, .6], [.67, .38], [.69, .33], [.92, .3], [.932, .37], [.958, .37], [.97, .31], [1, .31]];
const AX = [BB[0] - BA[0], BB[1] - BA[1]], LEN = Math.hypot(AX[0], AX[1]), AU = [AX[0] / LEN, AX[1] / LEN], AN = [-AU[1], AU[0]];
const onAxis = (t, k = 0) => [BA[0] + AX[0] * t + AN[0] * k, BA[1] + AX[1] * t + AN[1] * k];

module.exports = { name: 'Корабль в бутылке', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // ——— the window: the sky on fire, the sun low over the sea, a long glitter path ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 11 }) + K.localGlow(u, { x: SUN.x, y: SUN.y, color: '#ffb060', power: .6, radius: 120 }, { core: false })
      + K.sunMoon(u, L, { r: 10 });
    for (const [x, y, w, h, sd, fr] of [[150, 22, 80, 8, 4, .2], [20, 36, 60, 6, 9, .35], [130, 58, 50, 5, 2, .5], [190, 74, 40, 4, 6, .65], [6, 70, 34, 4, 3, .7]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 160, swell: .5, seed: 6, glitter: SUN.x });
    // rays from the sun: long soft blades fanning out over the whole window and the cabin
    bg += rays(u, SUN, 260, [[-172, 4], [-150, 3], [-128, 5], [-104, 3], [-82, 5], [-58, 3.5], [-34, 5], [-12, 3], [10, 4], [168, 3]], '#ffd8a0', .2, 3);
    // the stern window's frame: heavy dark mullions and a transom, the sun on their edges; the dark wall above and the
    // sill below
    bg += windowFrame(u);
    // ——— the bottle ———
    let fg = '';
    const g = K.propLathe(u, L, 'glass', BA, BB, PROF.map(q => [q[0], q[1] * BR]), { ell: .16, opacity: .26, spec: false, outline: .6 });
    // the fist: its params set so that the neck's axis runs through the grip
    const S = 6.6, grip = onAxis(.8), hd = H.hand3(u, { grip, a: -105 + Math.atan2(AU[1], AU[0]) * 180 / Math.PI + 9.3, s: S, m: 1, roll: 10, pitch: 34, pose: 'wrap', r: PROF[8][1] * BR / S, tilt: 6,
      tone: skinRamp(L, grip), light: [-1, -.15], sw: .42, lod: 'full' });
    // the arm under the fist: the coat sleeve from the wrist down out of the frame, the gold-laced cuff, the ruffle
    fg += sleeve(u, L, hd);
    fg += hd.back;
    // inside the bottle: the window seen through the glass, warmer; the sea, the whirlpool, the ship, the spray
    fg += `<g clip-path="url(#${g.clip})">${inside(u, L)}</g>`;
    fg += g.svg;
    // the glass against the sun: the outline burning, an inner bright line, the far wall's glow round the sun
    fg += `<path d="${g.d}" fill="none" stroke="#ffe2b0" stroke-width="1.3" opacity=".55" stroke-linejoin="round"/><path d="${g.d}" fill="none" stroke="#fff6e0" stroke-width=".5" opacity=".9" stroke-linejoin="round"/>`
      + glassGlints(u);
    fg += cork(u, L);
    fg += hd.front;
    // the light over everything: a few short bright rays from the sun through the glass, the bloom of the sun in it
    fg += rays(u, SUN, 90, [[-160, 2], [-120, 2.5], [-75, 2], [-30, 2.5], [15, 2], [60, 2.5], [110, 2], [140, 2.5]], '#fff0d0', .2, 1.4)
      + K.localGlow(u, { x: SUN.x, y: SUN.y, color: '#fff0c8', power: .5, radius: 20 });
    // dust in the sunbeams
    { const R = rng(17); for (let i = 0; i < 46; i++) { const x = R() * 200, y = 10 + R() * 120, d = Math.hypot(x - SUN.x, y - SUN.y);
      fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.2 + R() * .45)}" fill="#ffe6c0" opacity="${f(Math.max(.1, .7 - d / 180) * (.5 + R() * .5))}"/>`; } }
    // under the text glass: the dark of the cabin
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 132, 0, 280, [[0, '#0c0604', 0], [.25, '#0c0604', .5], [1, '#060302', .9]])}</defs><rect x="-10" y="132" width="220" height="160" fill="url(#${gl})"/>`; }
    return [bg, fg];
  } };

// soft rays from a point: blades [angle°, half-width°] of length len, blurred and added with screen
function rays(u, c, len, list, col, op, blur) {
  const fid = nid('ry', u), gid = nid('rg', u);
  let s = `<defs><filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter>${radGrad(gid, c.x, c.y, len, [[0, col, op * 2], [.25, col, op], [1, col, 0]])}</defs>`;
  const P = (a, l) => `${f(c.x + Math.cos(a * Math.PI / 180) * l)} ${f(c.y + Math.sin(a * Math.PI / 180) * l)}`;
  s += `<g filter="url(#${fid})" style="mix-blend-mode:screen">`;
  for (const [a, w] of list) s += `<path d="M${f(c.x)} ${f(c.y)}L${P(a - w, len)}L${P(a + w, len)}Z" fill="url(#${gid})"/>`;
  return s + '</g>';
}

// the skin's tones at a point, the shadow side a little warmer (the cabin's bounce)
function skinRamp(L, p) { const r0 = L.ramp('skin', p[0], p[1]); return Object.assign({}, r0, { core: mix(r0.half, r0.shadow, .45) }); }

// the stern window: the frame round the picture's edges, two mullions and a transom; their sides towards the sun lit
function windowFrame(u) {
  const wd = nid('wd', u), sill = nid('si', u);
  let s = `<defs>${linGrad(wd, 0, 0, 0, 14, [[0, '#140a06', 1], [1, '#2a160c', 1]])}${linGrad(sill, 0, 142, 0, 160, [[0, '#c08048', 1], [.2, '#5a3018', 1], [1, '#1a0c06', 1]])}</defs>`;
  // the wall over the window and the sill under it
  s += `<rect x="-10" y="-10" width="220" height="18" fill="url(#${wd})"/>` + woodTex(u, -10, 150, 220, 140, '#3a2010', '#1e1008', '#0a0503', 17, true, 9)
    + `<rect x="-10" y="142" width="220" height="10" fill="url(#${sill})"/><path d="M-10 142h220" stroke="#ffc888" stroke-width=".7" opacity=".8"/>`;
  // the frame's inner edge
  s += `<path d="M-10 8h220" stroke="#ffb070" stroke-width=".6" opacity=".7"/>`;
  // mullions (x, width) — the sun on their left edge (it is left of the right ones), the transom
  for (const [x, w] of [[14, 4.6], [112, 4.6], [178, 4]]) { const lt = x > SUN.x ? 1 : -1, ex = lt > 0 ? x - w / 2 : x + w / 2;
    s += `<rect x="${f(x - w / 2)}" y="8" width="${w}" height="134" fill="#1c0e08"/><path d="M${f(ex)} 8V142" stroke="#ffb878" stroke-width=".7" opacity=".85"/>`; }
  s += `<rect x="-10" y="44" width="220" height="3.4" fill="#1c0e08"/><path d="M-10 47.4h220" stroke="#ffb878" stroke-width=".5" opacity=".7"/>`;
  // thin lead lattice in the panes, faint against the sky
  for (let x = -6; x < 210; x += 16) s += `<path d="M${x} 8V142" stroke="#2a160c" stroke-width=".35" opacity=".35"/>`;
  return s;
}

// the inside of the bottle (drawn inside its clip): the glass's own warm tint over what is behind it, the sea with
// its whirlpool, the ship sliding down its wall, the spray whirling round above
function inside(u, L) {
  let s = `<rect x="0" y="0" width="200" height="160" fill="#ffd8a0" opacity=".08"/>`;
  const R = rng(5), ys = SEA, x0 = BA[0] - 4, x1 = 130, th = [VX + 2, ys + 15];
  // the sea, lit through from behind: bright green-gold under the surface, deep teal below
  const sg = nid('bs', u); s += `<defs>${linGrad(sg, 0, ys - 1, 0, ys + 20, [[0, '#9ad0b0', 1], [.18, '#3a8a86', 1], [.6, '#16505a', 1], [1, '#0a2a34', 1]])}</defs>`
    + `<rect x="${x0}" y="${ys}" width="${x1 - x0}" height="30" fill="url(#${sg})"/>`;
  // the whirlpool: a hollow in the surface — the far wall seen down to the throat, darker, swirled with foam
  const rw = 30, wall = nid('bw', u), fun = `M${VX - rw} ${ys}C${VX - rw * .55} ${ys + 1} ${VX - 7} ${ys + 4} ${th[0] - 1.6} ${th[1]}L${th[0] + 1.6} ${th[1]}C${VX + 9} ${ys + 4} ${VX + rw * .55} ${ys + 1} ${VX + rw} ${ys}Z`;
  s += `<defs>${linGrad(wall, 0, ys, 0, th[1], [[0, '#2c6e72', 1], [.5, '#174a54', 1], [1, '#06161e', 1]])}</defs><path d="${fun}" fill="url(#${wall})"/>`;
  for (let k = 0; k < 8; k++) { const d = k / 8, rx = rw * Math.pow(1 - d, 1.25), cy = ys + d * 15 * .96, ry = 2.4 * (1 - d) + .3, cx = VX + d * 2;
    const a0 = Math.PI * (1.04 + R() * .1), a1 = Math.PI * (1.96 - R() * .1), P = a => `${f(cx + Math.cos(a) * rx)} ${f(cy + Math.sin(a) * ry)}`;
    s += `<path d="M${P(a0)}A${f(rx)} ${f(ry)} 0 0 1 ${P(a1)}" stroke="#e8fff4" stroke-width="${f(.25 + (1 - d) * .4)}" stroke-dasharray="${f(2 + R() * 4)} ${f(1 + R() * 2)}" fill="none" opacity="${f(.35 + (1 - d) * .4)}"/>`; }
  // the ship: on the right wall of the whirlpool, her bow down into it, heeled with the wall's slope
  const sl = Math.atan2(th[1] - ys, (VX + rw) - th[0]) * 180 / Math.PI, sx = VX + 15, sy = ys + (VX + rw - sx) * (th[1] - ys) / (VX + rw - th[0]);
  s += K.ship(u, L, { kind: WRECK, x: sx, y: sy + .4, scale: .21, heel: sl * .9, detail: 'mid', seed: 6 });
  // the near rim of the hollow: a ring of foam in front of her keel, and the sea's surface either side of it
  s += `<path d="M${VX - rw} ${ys}Q${VX} ${ys + 3.4} ${VX + rw} ${ys}" stroke="#f0fff8" stroke-width=".9" fill="none" opacity=".8"/>`
    + K.foam(u, { x: VX + 2, y: ys + 2.2, w: rw * 1.9, h: 1.4, seed: 21, L }) + K.foam(u, { x: 96, y: ys + .4, w: 40, h: .9, seed: 22, L });
  s += `<path d="M${x0} ${ys}H${VX - rw}M${VX + rw} ${ys}H${x1}" stroke="#d8fff0" stroke-width=".6" opacity=".7"/>`;
  // spray whirling round above the hollow: broken rings of drops, wider and fainter as they rise, the front halves over
  // the ship
  for (const [dy, rx, ry, op] of [[-3, 32, 4, .7], [-9, 36, 5, .5], [-16, 38, 5.5, .32], [-23, 36, 5, .2]]) { const cy = ys + dy;
    for (let i = 0; i < 26; i++) { const a = Math.PI * (.08 + R() * .84), px = VX + Math.cos(a) * rx, py = cy + Math.sin(a) * ry, l = .8 + R() * 2.2, tx = -Math.sin(a), ty = Math.cos(a) * ry / rx;
      s += `<path d="M${f(px)} ${f(py)}l${f(tx * l)} ${f(ty * l)}" stroke="#f4fff8" stroke-width="${f(.3 + R() * .45)}" stroke-linecap="round" opacity="${f(op * (.5 + R() * .5))}"/>`; }
    s += `<path d="M${f(VX - rx)} ${f(cy)}A${rx} ${ry} 0 0 0 ${f(VX + rx)} ${f(cy)}" stroke="#f4fff8" stroke-width=".5" stroke-dasharray="3 2 1 3" fill="none" opacity="${f(op * .7)}"/>`; }
  // drops thrown up on the inside of the glass
  for (let i = 0; i < 30; i++) { const t = R() * .52, k = (R() - .5) * 1.8 * BR, p = onAxis(t, k); if (p[1] > ys - 2) continue;
    s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.25 + R() * .5)}" fill="#f6fffa" opacity="${f(.4 + R() * .4)}"/>`; }
  return s;
}

// glints of the glass: a long bright streak along the body's upper side and its lower side, the shoulder's ring, the
// base's ring — all lit from the sun behind
function glassGlints(u) {
  const pA = onAxis(.04, -BR * .8), pB = onAxis(.48, -BR * .8), qA = onAxis(.06, BR * .84), qB = onAxis(.46, BR * .84);
  let s = `<path d="M${f(pA[0])} ${f(pA[1])}L${f(pB[0])} ${f(pB[1])}" stroke="#fffaf0" stroke-width="1.4" stroke-linecap="round" opacity=".45"/><path d="M${f(pA[0])} ${f(pA[1])}L${f(pB[0])} ${f(pB[1])}" stroke="#ffffff" stroke-width=".5" stroke-linecap="round" opacity=".85"/>`
    + `<path d="M${f(qA[0])} ${f(qA[1])}L${f(qB[0])} ${f(qB[1])}" stroke="#ffe0b0" stroke-width=".8" stroke-linecap="round" opacity=".5"/>`;
  // the base: an ellipse ring
  { const c = onAxis(.012); s += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(BR * .16)}" ry="${f(BR * .92)}" transform="rotate(${f(Math.atan2(AU[1], AU[0]) * 180 / Math.PI)} ${f(c[0])} ${f(c[1])})" fill="none" stroke="#ffe6c0" stroke-width=".7" opacity=".6"/>`; }
  // the shoulder: a bright curve
  { const a = onAxis(.6, -BR * .78), b = onAxis(.58, BR * .8), m = onAxis(.62, 0); s += `<path d="M${f(a[0])} ${f(a[1])}Q${f(m[0] + 3)} ${f(m[1])} ${f(b[0])} ${f(b[1])}" stroke="#ffeacc" stroke-width=".6" fill="none" opacity=".55"/>`; }
  // the sun's own glare in the glass: a soft white spot on the body where the sun is behind it
  s += K.localGlow(u, { x: SUN.x + 2, y: SUN.y - 1, color: '#fffbe8', power: .3, radius: 12 }, { core: false });
  return s;
}

// the cork in the mouth, pressed home, its top standing out of the string rim
function cork(u, L) {
  const a = onAxis(.955), b = onAxis(1.035), r = BR * .29, ck = nid('ck', u), ang = Math.atan2(AU[1], AU[0]) * 180 / Math.PI;
  const P = (p, k) => [p[0] + AN[0] * k, p[1] + AN[1] * k], q = [P(a, -r), P(b, -r * 1.04), P(b, r * 1.04), P(a, r)];
  return `<defs>${linGrad(ck, P(a, -r)[0], P(a, -r)[1], P(a, r)[0], P(a, r)[1], [[0, '#e0a868', 1], [.35, '#a8723e', 1], [1, '#4a2a12', 1]])}</defs>`
    + `<path d="M${q.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z" fill="url(#${ck})" stroke="#24120a" stroke-width=".45"/>`
    + `<ellipse cx="${f(b[0])}" cy="${f(b[1])}" rx="${f(r * .2)}" ry="${f(r * 1.04)}" transform="rotate(${f(ang)} ${f(b[0])} ${f(b[1])})" fill="#c08a52" stroke="#24120a" stroke-width=".4"/>`
    + `<path d="M${f(q[0][0])} ${f(q[0][1])}L${f(q[1][0])} ${f(q[1][1])}" stroke="#ffd8a0" stroke-width=".6" opacity=".8"/>`;
}

// the arm: the black coat sleeve from the wrist down out of the frame, a broad turned-back cuff laced with gold and two
// brass buttons, the linen ruffle at the wrist; the sun on its left edge
function sleeve(u, L, hd) {
  const w = hd.wrist, dir = [w[0] - hd.grip[0], w[1] - hd.grip[1]], dl = Math.hypot(dir[0], dir[1]), e = [dir[0] / dl, dir[1] / dl], n = [-e[1], e[0]];
  const at = (t, k) => [w[0] + e[0] * t + n[0] * k, w[1] + e[1] * t + n[1] * k];
  const coat = { lit: '#4a3840', half: '#251a20', shadow: '#0e080c', outline: '#030203' };
  let s = H.cloth(u, { spine: [at(8, 0), at(60, 1), at(140, 3)], w: [17, 19, 21], tone: coat, lit: n[0] < 0 ? 1 : -1, folds: true, drapes: 2, sw: .5, tension: true, L, seed: 4 });
  // the sun on the sleeve's left edge
  { const a = at(10, -8.8), b = at(140, -11); s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#ff9a50" stroke-width=".8" opacity=".75"/>`; }
  // the cuff: a broad band turned back, darker red-black, gold lace on both edges, two buttons
  { const c0 = 6, c1 = 22, q = [at(c0, -10.4), at(c1, -11.2), at(c1, 11.2), at(c0, 10.4)], cg = nid('cf', u);
    s += `<defs>${linGrad(cg, q[0][0], q[0][1], q[3][0], q[3][1], [[0, '#5a2a2a', 1], [.4, '#2a1214', 1], [1, '#120708', 1]])}</defs>`
      + `<path d="M${q.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z" fill="url(#${cg})" stroke="#050203" stroke-width=".5"/>`
      + [[c0 + 1, 10.4], [c1 - 1, 11.2]].map(([t, k]) => { const a = at(t, -k + .3), b = at(t, k - .3); return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#d8a848" stroke-width="1.1"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#ffe090" stroke-width=".35" opacity=".8"/>`; }).join('')
      + [-4, 3].map(k => { const p = at((c0 + c1) / 2, k); return K.shadeSphere(u, p[0], p[1], 1.3, L, 'brass', { outline: .3 }); }).join(''); }
  // the ruffle: scallops of linen out of the cuff, round the wrist
  { let d = ''; const t0 = 5, A = at(t0, -9.5), B = at(t0, 9.5); d = `M${f(A[0])} ${f(A[1])}`;
    for (let i = 0; i < 5; i++) { const p0 = at(t0, -9.5 + 19 * i / 5), p1 = at(t0, -9.5 + 19 * (i + 1) / 5), k = 4.2 + (i % 2) * 1.2, c0 = [p0[0] - e[0] * k, p0[1] - e[1] * k], c1 = [p1[0] - e[0] * k, p1[1] - e[1] * k];
      d += `C${f(c0[0])} ${f(c0[1])} ${f(c1[0])} ${f(c1[1])} ${f(p1[0])} ${f(p1[1])}`; }
    d += `L${f(B[0])} ${f(B[1])}Z`;
    s += `<path d="${d}" fill="#e8dcc4" stroke="#5a4a36" stroke-width=".4" stroke-linejoin="round"/>`
      + [-5.7, -1.9, 1.9, 5.7].map(k => { const p = at(t0, k), q = at(t0 - 3, k); return `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="#a8967a" stroke-width=".35" stroke-linecap="round"/>`; }).join('')
      + (() => { const a = at(t0 - 3.6, -9.5), b = at(t0 + 1, -9.5); return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#fff0d0" stroke-width=".6" opacity=".8"/>`; })(); }
  return s;
}
