// «Подкуп» (Индевор, ПРИКАЗ: до конца хода вражеская команда не может разыгрывать Реакции), refined from the first-round
// scene (portrait-endeavour.cjs SCENES['Подкуп']): a dark corner of the hold, the one shaft of daylight falling from the
// grating overhead onto a barrel head where the deal is struck. From the left a hand in a navy sleeve with a gold-laced
// cuff and a lace frill holds a red velvet purse by its gold drawstring, pinched between thumb and forefinger, the
// little finger raised; from the right the boatswain's rough tattooed hand, palm up, cups the purse's heavy bottom —
// the money is passing from hand to hand. Behind the boatswain, in the dark: the arms chest with a chain and a padlock
// on it and the linstock leaning against the wall, its match dead (a last wisp of smoke). Brief's find: the handshake
// with the purse; the locked arms chest and the dead match — the crew will not answer.
// Fixed against the first round: the hands were flat mittens with stiff fingers, the purse floated on a straight
// string, the arms were tubes from the frame's edges — now jointed hands (people.cjs hand3: the officer's pinch, the
// boatswain's cupped palm, the purse resting in it), a sleeve with a cuff and lace, a bare forearm with hair and a
// tattoo; the hold in 2.5D (frames, strakes, deck beams and the grating running to one vanishing point, casks lying
// in tiers at the back). Light: the daylight shaft from the grating (key, cool-warm white), nothing else — the rest
// sinks into the dark.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, motes } = PK;

const VX = 100, VY = 60, FOC = 110;                     // the vanishing point (eye level), the focal length
const XS = 2.8, YC = -.8, YF = 1.4, ZB = 6;              // the hold's half width, ceiling, floor (m from the eye), the back
const pr = (X, Y, Z) => [VX + FOC * X / Z, VY + FOC * Y / Z];
const GR = { x0: -.6, x1: .6, z0: 1.7, z1: 2.9 };        // the grating in the deck overhead
const light = { time: 'night', haze: .4, key: { type: 'point', x: 100, y: 4, h: 3, gy: 136, color: '#fff0d4', power: 1, radius: 170 },
  fill: { color: '#3a3444', power: .28 }, rim: { az: 0, color: '#ffe8c0', power: .3 } };
const PP = [88, 52];                                     // the officer's pinch on the drawstring
const TIE = [95, 71];                                    // the purse's neck (the tie)
const BOT = [98, 106];                                   // the purse's bottom, in the boatswain's palm
const HEAD = { x: 100, y: 132, rx: 66, ry: 11 };         // the barrel head the deal is struck over
const CH = { x: 158, y: 111, s: 1.15 };                  // the arms chest (behind the boatswain's arm)
const skel = { horizon: VY, eye: 1.4, light: 'the shaft of daylight from the grating overhead (key); no other source', items: [
  ['back bulkhead', 49, 86, 102, 44, 'floor at 6 m'], ['grating', 65, 28, 70, 18, 'the deck overhead, 2.2–3.4 m'], ['casks', 4, 112, 60, 40, 'floor, left, 2.5–4 m'],
  ['arms chest', 140, 111, 40, 26, 'floor, right, 3 m'], ['linstock', 176, 112, 14, 58, 'leaning on the side, right'], ['barrel head', 34, 149, 132, 22, 'barrel, 0.75 m'],
  ['officer arm + hand', -20, 80, 120, 64, 'from the top-left corner'], ['purse', 84, 108, 26, 46, 'hangs from the pinch, rests in the palm'], ['boatswain arm + hand', 70, 140, 140, 40, 'from the right edge']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const OFF = { lit: '#f6dcc2', half: '#d8ae90', shadow: '#7e563e', outline: '#3a2216' };
const BOS = { lit: '#d8a070', half: '#a86c44', shadow: '#5a301a', outline: '#24120a' };

module.exports = { name: 'Подкуп', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VY, eye: 1.4 }), R = rng(17);
    return [hold(u, L, R), deal(u, L, R) + air(u, L)];
  } };

/** The hold in 2.5D: the back bulkhead, the sides with strakes and frames, the deck overhead with its beams and the
 *  grating, the floor; casks lying at the back left, the arms chest and the linstock at the right. */
function hold(u, L, R) {
  let s = `<rect x="-10" y="-10" width="220" height="300" fill="#0c0805"/>`;
  // the floor: planks running to the VP, dimmer away from the shaft
  { const id = nid('fl', u), fp = [pr(-XS, YF, .6), pr(-XS, YF, ZB), pr(XS, YF, ZB), pr(XS, YF, .6)];
    s += `<defs><clipPath id="${id}"><path d="${poly(fp)}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: VY, top: pr(0, YF, ZB)[1], bottom: 300, vx: VX, kind: 'oak', plank: 12, seed: 4 })}</g>`; }
  // the back bulkhead: vertical boards
  { const a = pr(-XS, YC, ZB), b = pr(XS, YF, ZB), g = nid('bk', u);
    s += `<defs>${linGrad(g, 0, a[1], 0, b[1], [[0, '#1c120a'], [1, '#2e1e10']])}</defs><rect x="${f(a[0])}" y="${f(a[1])}" width="${f(b[0] - a[0])}" height="${f(b[1] - a[1])}" fill="url(#${g})"/>`;
    for (let x = a[0] + 6; x < b[0]; x += 6 + R() * 2) s += `<path d="M${f(x)} ${f(a[1])}V${f(b[1])}" stroke="#0a0604" stroke-width=".5"/>`; }
  // the sides: strakes to the VP, the frames standing at intervals (lit edge towards the shaft)
  for (const sd of [-1, 1]) {
    const X = sd * XS, wall = [pr(X, YC, .5), pr(X, YC, ZB), pr(X, YF, ZB), pr(X, YF, .5)], g = nid('sw', u);
    s += `<defs>${linGrad(g, VX + sd * 120, 0, VX + sd * 50, 0, [[0, '#120a05'], [1, '#2a1a0e']])}</defs><path d="${poly(wall)}" fill="url(#${g})"/>`;
    for (let y = YC + .18; y < YF; y += .2) s += `<path d="M${P2(pr(X, y, .5))}L${P2(pr(X, y, ZB))}" stroke="#070402" stroke-width=".55"/><path d="M${P2(pr(X, y + .02, .5))}L${P2(pr(X, y + .02, ZB))}" stroke="#6a4626" stroke-width=".25" opacity=".3"/>`;
    for (const z of [1.2, 1.9, 2.8, 3.9, 5.2]) { const w = .16, a = pr(X, YC, z), b = pr(X, YF, z), c = pr(X - sd * w, YF, z), d = pr(X - sd * w, YC, z);
      s += K.shadeBox(u, [{ pts: [a, d, c, b], n: sd < 0 ? 'right' : 'left', grain: [0, 1] }], L, 'oak', { seed: Math.round(z * 10) + (sd + 1), outline: .3 }); }
  }
  // the deck overhead: planks to the VP, the beams across, the grating with daylight through it
  { const cp = [pr(-XS, YC, .4), pr(-XS, YC, ZB), pr(XS, YC, ZB), pr(XS, YC, .4)];
    s += `<path d="${poly(cp)}" fill="#160e08"/>`;
    for (let x = -XS; x <= XS; x += .25) s += `<path d="M${P2(pr(x, YC, .4))}L${P2(pr(x, YC, ZB))}" stroke="#070402" stroke-width=".45"/>`;
    // the grating: the opening shows bright sky; the bars cross it both ways
    const q = [pr(GR.x0, YC, GR.z0), pr(GR.x1, YC, GR.z0), pr(GR.x1, YC, GR.z1), pr(GR.x0, YC, GR.z1)], g = nid('gs', u);
    s += `<defs>${linGrad(g, 0, q[2][1], 0, q[0][1], [[0, '#f4f2e6'], [1, '#d8e6ee']])}</defs><path d="${poly(q)}" fill="url(#${g})"/>`;
    for (let k = 1; k < 6; k++) { const x = lerp(GR.x0, GR.x1, k / 6); s += `<path d="M${P2(pr(x, YC, GR.z0))}L${P2(pr(x, YC, GR.z1))}" stroke="#2a1a0c" stroke-width="${f(1.3)}"/>`; }
    for (let k = 1; k < 4; k++) { const z = lerp(GR.z0, GR.z1, k / 4); s += `<path d="M${P2(pr(GR.x0, YC, z))}L${P2(pr(GR.x1, YC, z))}" stroke="#2a1a0c" stroke-width="${f(1.6 * 2.6 / z)}"/>`; }
    // the coaming round it: the near edge lit from the opening
    s += `<path d="${poly([pr(GR.x0 - .1, YC, GR.z0 - .1), pr(GR.x1 + .1, YC, GR.z0 - .1), pr(GR.x1, YC, GR.z0), pr(GR.x0, YC, GR.z0)])}" fill="#4a3018"/><path d="${poly(q)}" fill="none" stroke="#1a0e06" stroke-width="1.4"/>`;
    for (const z of [.9, 1.5, 2.15, 3.45, 4.4, 5.6]) { const d = .18, a = pr(-XS, YC, z), b = pr(XS, YC, z), c = pr(XS, YC + d, z), e = pr(-XS, YC + d, z), a2 = pr(-XS, YC + d, z + .2), b2 = pr(XS, YC + d, z + .2);
      s += K.shadeBox(u, [{ pts: [e, c, b2, a2], n: 'bottom', grain: [1, 0] }, { pts: [a, b, c, e], n: 'front', grain: [1, 0] }], L, 'oak', { seed: Math.round(z * 7), outline: .35 }); } }
  // casks lying in tiers at the back left (and a tier at the back right in the dark)
  { const c = [[34, 114, 1.25, 1], [60, 100, .9, 2], [44, 92, .9, 3], [142, 98, .85, 4]];
    for (const [x, y, sc, sd] of c) s += K.castShadow(u, L, { x, y, w: 30 * sc, h: 12 * sc, horizon: VY, d: .4 }) + K.barrel(u, L, { x, y, s: sc, lying: true, flip: x > 100, kind: sd % 2 ? 'rum' : 'water', seed: sd + 20 }); }
  // the arms chest: shut, a chain across its lid and front, a big padlock on the hasp
  s += K.castShadow(u, L, { x: CH.x, y: CH.y, w: 30 * CH.s, h: 17 * CH.s, horizon: VY, d: .35 }) + K.chest(u, L, { x: CH.x, y: CH.y, s: CH.s, open: false, flip: true, seed: 6 });
  s += K.chain(u, L, [[CH.x - 15, CH.y - 21], [CH.x - 6, CH.y - 22.6], [CH.x + 1, CH.y - 20], [CH.x + 1.4, CH.y - 12]], { link: 2.2, seed: 3 })
    + K.chain(u, L, [[CH.x + 18, CH.y - 24], [CH.x + 10, CH.y - 23], [CH.x + 3, CH.y - 19.6], [CH.x + 1.4, CH.y - 12]], { link: 2.2, seed: 5 });
  { const x = CH.x + 1.4, y = CH.y - 9, rp = L.ramp('iron', x, y);
    s += `<path d="M${f(x - 2.2)} ${f(y - 2)}a2.2 2.6 0 0 1 4.4 0" stroke="${rp.half}" stroke-width="1" fill="none"/>`
      + `<path d="M${f(x - 3.4)} ${f(y - 2)}h6.8l.4 5.2q-3.8 2 -7.6 0z" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".35"/><path d="M${f(x - 2.8)} ${f(y - 1.4)}v4.4" stroke="${rp.lit}" stroke-width=".7" opacity=".7"/>`
      + `<path d="M${f(x)} ${f(y + .2)}v1.6" stroke="#05030a" stroke-width=".7" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r=".6" fill="#05030a"/>`; }
  // the linstock leaning on the side behind the chest: its match hangs dead from the forked head, a last wisp
  { const a = [190, 128], b = [176, 64], rp = L.ramp('oak', 183, 96);
    s += `<path d="M${P2(a)}L${P2(b)}" stroke="${rp.outline}" stroke-width="2.2" stroke-linecap="round"/><path d="M${P2(a)}L${P2(b)}" stroke="${rp.half}" stroke-width="1.5" stroke-linecap="round"/><path d="M${f(a[0] - .5)} ${f(a[1])}L${f(b[0] - .5)} ${f(b[1])}" stroke="${rp.lit}" stroke-width=".35" opacity=".5"/>`
      + `<path d="M${f(b[0] - 3)} ${f(b[1] - 4)}q1.6 3.6 3 4q1.6 -.6 3 -4" stroke="#3a3a40" stroke-width="1" fill="none"/>`
      + `<path d="M${f(b[0] - 3)} ${f(b[1] - 4)}q-4 6 -2 16q1 6 -1 10" stroke="#5a4a32" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
      + `<circle cx="${f(b[0] - 3.2)}" cy="${f(b[1] + 22)}" r=".8" fill="#2a2420"/>`
      + K.smoke(u, L, { x: b[0] - 3.2, y: b[1] + 21, w: 6, h: 26, wind: -.2, seed: 11, opacity: .22 }); }
  // the shaft's light on the floor behind the barrel; the dark closing in on the sides and the far end
  s += K.localGlow(u, { x: 100, y: 122, color: '#fff0d0', power: .4, radius: 50 }, { squash: .3, core: false })
    + gloom(u, 100, 70, 0, 70, .55, '#030201') + gloom(u, 100, 70, 200, 70, .45, '#030201') + gloom(u, 100, 60, 100, 0, .35, '#030201');
  return s;
}

/** The barrel head, the officer's arm and pinch, the purse, the boatswain's arm and cupped hand. */
function deal(u, L, R) {
  let s = '';
  // ——— the barrel head: a chime round the boards, the hoop below, a coin that rolled out; its staves under the glass
  { const { x, y, rx, ry } = HEAD, rp = L.ramp('oak', x, y), g = nid('bh', u);
    s += `<path d="M${x - rx} ${y}V${y + 60}H${x + rx}V${y}" fill="#2a180c"/>`;
    for (let k = -5; k <= 5; k++) s += `<path d="M${f(x + k * rx / 5.6)} ${f(y + ry * Math.sqrt(Math.max(0, 1 - Math.pow(k / 5.6, 2))))}V${y + 60}" stroke="#120804" stroke-width=".6"/>`;
    s += `<path d="M${x - rx} ${y + 13}Q${x} ${y + 13 + ry * 1.9} ${x + rx} ${y + 13}" stroke="#1a1a1e" stroke-width="3" fill="none"/><path d="M${x - rx} ${y + 11.6}Q${x} ${y + 11.6 + ry * 1.9} ${x + rx} ${y + 11.6}" stroke="#6a6a70" stroke-width=".5" fill="none" opacity=".6"/>`;
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".6"/>`
      + `<defs>${radGrad(g, x - 4, y - 3, rx * .9, [[0, '#d8a46a', .9], [.5, '#8a5a30', .5], [1, '#3a2010', 0]])}</defs><ellipse cx="${x}" cy="${y}" rx="${rx - 5}" ry="${ry - 2}" fill="url(#${g})" stroke="#2a160a" stroke-width=".5"/>`;
    for (const d of [-36, -14, 8, 30]) { const hw = Math.sqrt(1 - Math.pow(d / (rx - 5), 2)) * (ry - 2); s += `<path d="M${x + d} ${f(y - hw)}V${f(y + hw)}" stroke="#2a160a" stroke-width=".55"/>`; }
    s += K.coins(u, L, { x: 132, y: y + 1, s: 1, n: 2, r: 2.4, seed: 9 }); }

  // ——— the boatswain: the bare forearm from the right edge (the rolled sleeve off the frame), the hand cupped palm up
  const bo = { a: 172, s: 6, m: -1, roll: 25, pitch: 0, pose: 'wrap', r: 2.15, tone: BOS, light: [-.25, -.97], sw: .45, palmW: .86, wristW: .74, fingerW: 1.08 };
  const hb = H.hand3(u, { ...bo, grip: [BOT[0], BOT[1] - 8] });
  const bw = hb.wrist;
  { const el = [216, 146], sp = [[bw[0] - 2, bw[1]], [lerp(bw[0], el[0], .45), lerp(bw[1], el[1], .45) - 2], el];
    s += `<path d="M${f(bw[0])} ${f(bw[1] + 8)}Q160 ${f(bw[1] + 18)} 212 ${f(el[1] + 12)}" stroke="#000" stroke-width="8" opacity=".3" fill="none"/>`;
    s += H.cloth(u, { spine: sp, w: [13, 16, 19], tone: BOS, lit: -1, folds: false, sw: .45, rim: '#ffe0b0', rimSide: -1, rimOp: .5 });
    // the hair on the forearm, the tattoo (an anchor and a band of rope), a vein
    for (let k = 0; k < 46; k++) { const t = .1 + R() * .84, x = lerp(sp[0][0], el[0], t), y = lerp(sp[0][1], el[1], t) + (R() - .55) * lerp(10, 15, t);
      s += `<path d="M${f(x)} ${f(y)}l${f(1.6 + R())} ${f(-.6 - R() * .5)}" stroke="#2a160a" stroke-width=".22" opacity=".6"/>`; }
    const tx = lerp(sp[0][0], el[0], .5), ty = lerp(sp[0][1], el[1], .5) - 1.5, ang = Math.atan2(el[1] - bw[1], el[0] - bw[0]) * 180 / Math.PI;
    s += `<g transform="translate(${f(tx)} ${f(ty)}) rotate(${f(ang - 90)}) scale(1)" opacity=".72"><path d="M0 -6v12M-3.4 -3.4h6.8M-5.6 2.6q5.6 7 11.2 0" stroke="#22344a" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cy="-7.4" r="1.5" fill="none" stroke="#22344a" stroke-width=".9"/><path d="M-5.6 2.6l-1 -1.6M5.6 2.6l1 -1.6" stroke="#22344a" stroke-width=".9"/></g>`
      + `<path d="M${f(bw[0] + 8)} ${f(bw[1] + 3)}q10 1 20 5" stroke="#7a4a2c" stroke-width=".5" fill="none" opacity=".6"/>`; }
  s += hb.back;

  // ——— the officer: the navy sleeve from the top-left corner, the gold-laced cuff, the lace; the hand pinching the cord
  const oo = { a: 22, s: 5.6, m: 1, roll: 60, pitch: 0, pose: 'pinch', tone: OFF, light: [-.25, -.97], sw: .4, palmW: .86, wristW: .8, fingerW: .9,
    flex: [[10, 70, 30], [20, 50, 30], [25, 55, 30], [12, 24, 12]], thumbJ: [[1.25, -1.25, -.78], [3.0, -2.0, -1.5], [4.6, -2.1, -2.3], [6.0, -1.6, -2.9]] };
  const ho0 = H.hand3(u, { ...oo, at: [0, 0] }), p0 = ho0.P(6.2, -1.45, -3.0), ho = H.hand3(u, { ...oo, at: [PP[0] - p0[0], PP[1] - p0[1]] });
  const ow = ho.wrist, ax = [Math.cos(22 * Math.PI / 180), Math.sin(22 * Math.PI / 180)];
  { const navy = { lit: '#4a5a8a', half: '#222c50', shadow: '#0a0e22', outline: '#04060e' }, cuffT = { lit: '#3a4a7a', half: '#1a2244', shadow: '#080a1a', outline: '#04060e' };
    const w0 = [ow[0] - ax[0] * 2, ow[1] - ax[1] * 2], el = [-24, 16];
    s += H.cloth(u, { spine: [el, [lerp(el[0], w0[0], .5), lerp(el[1], w0[1], .5) - 1], w0], w: [24, 20, 16.6], tone: navy, lit: 1, rim: '#c8d4ff', rimSide: -1, rimOp: .35, seed: 4, drapes: 2,
      cuff: { from: .74, k: 1.3, tone: cuffT }, sw: .45 });
    // the cuff's gold lace: two bands across and three buttons
    const cp = t => [lerp(el[0], w0[0], t), lerp(el[1], w0[1], t)], nrm = [-ax[1], ax[0]];
    for (const t of [.78, .95]) { const c = cp(t), h = 11.6; s += `<path d="M${f(c[0] - nrm[0] * h)} ${f(c[1] - nrm[1] * h)}Q${f(c[0] + ax[0] * 1.6)} ${f(c[1] + ax[1] * 1.6)} ${f(c[0] + nrm[0] * h)} ${f(c[1] + nrm[1] * h)}" stroke="#c9a048" stroke-width="1.5" fill="none"/><path d="M${f(c[0] - nrm[0] * h)} ${f(c[1] - nrm[1] * h - .4)}Q${f(c[0] + ax[0] * 1.6)} ${f(c[1] + ax[1] * 1.6 - .4)} ${f(c[0] + nrm[0] * h * .2)} ${f(c[1] + nrm[1] * h * .2 - .4)}" stroke="#fff0b0" stroke-width=".4" fill="none" opacity=".8"/>`; }
    for (const k of [-.5, 0, .5]) { const c = cp(.865); s += K.shadeSphere(u, c[0] + nrm[0] * k * 16, c[1] + nrm[1] * k * 16, 1.3, L, 'brass', { outline: .25 }); }
    // the lace frill falling over the wrist: three tiers of scallops, cream on the navy
    const lace = (t0, hw, col, edge, ph) => { const c = [w0[0] + ax[0] * t0, w0[1] + ax[1] * t0]; let d = `M${f(c[0] - nrm[0] * hw)} ${f(c[1] - nrm[1] * hw)}`;
      const n = 9; for (let k = 0; k < n; k++) { const v = -1 + (k + 1) * 2 / n, mid = -1 + (k + .5) * 2 / n, bulge = 2.4 + Math.sin(k * 1.9 + ph) * .8;
        d += `Q${f(c[0] + nrm[0] * mid * hw + ax[0] * bulge)} ${f(c[1] + nrm[1] * mid * hw + ax[1] * bulge)} ${f(c[0] + nrm[0] * v * hw)} ${f(c[1] + nrm[1] * v * hw)}`; }
      d += `L${f(c[0] + nrm[0] * hw - ax[0] * 3)} ${f(c[1] + nrm[1] * hw - ax[1] * 3)}L${f(c[0] - nrm[0] * hw - ax[0] * 3)} ${f(c[1] - nrm[1] * hw - ax[1] * 3)}Z`;
      return `<path d="${d}" fill="${col}" stroke="${edge}" stroke-width=".3"/>`; };
    s += lace(0, 10.4, '#d8ccb0', '#7a6e58', 0) + lace(2.2, 9.2, '#ece2cc', '#8a7e66', 1.2) + lace(4.2, 7.8, '#faf4e4', '#9a8e74', 2.4);
    for (let k = 0; k < 12; k++) { const v = -.8 + k * .145, c = [w0[0] + ax[0] * 4.6 + nrm[0] * v * 7.4, w0[1] + ax[1] * 4.6 + nrm[1] * v * 7.4]; s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r=".32" fill="#8a7e66" opacity=".8"/>`; } }
  s += ho.back;

  // ——— the drawstring from the pinch to the purse's neck, its tasselled ends; the purse itself ———
  { const g1 = [PP[0] + .4, PP[1] + .6];
    s += `<path d="M${P2(g1)}Q${f(lerp(g1[0], TIE[0], .5) - 1)} ${f(lerp(g1[1], TIE[1], .5))} ${f(TIE[0] - 1.4)} ${f(TIE[1] - 1)}" stroke="#7a5a14" stroke-width="1.1" fill="none"/><path d="M${P2(g1)}Q${f(lerp(g1[0], TIE[0], .5) - 1)} ${f(lerp(g1[1], TIE[1], .5))} ${f(TIE[0] - 1.4)} ${f(TIE[1] - 1)}" stroke="#e8c060" stroke-width=".45" fill="none"/>`
      + `<path d="M${P2([g1[0] + .8, g1[1] + .2])}Q${f(lerp(g1[0], TIE[0], .5) + 1.6)} ${f(lerp(g1[1], TIE[1], .5) + 1)} ${f(TIE[0] + 1.2)} ${f(TIE[1] - 1)}" stroke="#7a5a14" stroke-width="1.1" fill="none"/><path d="M${P2([g1[0] + .8, g1[1] + .2])}Q${f(lerp(g1[0], TIE[0], .5) + 1.6)} ${f(lerp(g1[1], TIE[1], .5) + 1)} ${f(TIE[0] + 1.2)} ${f(TIE[1] - 1)}" stroke="#f0d070" stroke-width=".4" fill="none"/>`; }
  s += purse(u, L, R);
  s += ho.front + hb.front;
  // the officer's signet ring on the little finger
  { const p = ho.joints[3][1]; s += K.shadeSphere(u, p[0], p[1], 1.1, L, 'brass', { outline: .25 }); }
  return s;
}

/** The purse: red velvet gathered at the neck by a gold cord, heavy with coins (their rims press through the cloth),
 *  the gathered frill above the tie, two tassels on the cord ends; its bottom sits in the boatswain's palm. */
function purse(u, L, R) {
  const [tx, ty] = TIE, [bx, by] = BOT, w = 12.6, g = nid('pv', u), sh = nid('ps', u);
  const body = `M${f(tx - 2.6)} ${f(ty + .6)}C${f(tx - 7)} ${f(ty + 3)} ${f(bx - w - 1)} ${f(by - 14)} ${f(bx - w + .6)} ${f(by - 6)}C${f(bx - w + 1.6)} ${f(by - 1)} ${f(bx - 6)} ${f(by + 1.4)} ${f(bx)} ${f(by + 1.2)}`
    + `C${f(bx + 6)} ${f(by + 1)} ${f(bx + w - .4)} ${f(by - 1.6)} ${f(bx + w - .6)} ${f(by - 7)}C${f(bx + w - .8)} ${f(by - 14)} ${f(tx + 7.4)} ${f(ty + 3)} ${f(tx + 2.6)} ${f(ty + .6)}Z`;
  let s = `<defs>${radGrad(g, bx - 4, by - 13, 17, [[0, '#e04a4a'], [.35, '#a81e22'], [.75, '#5a0a10'], [1, '#2a0408']])}${linGrad(sh, bx - w, 0, bx + w, 0, [[0, '#000', 0], [.6, '#000', 0], [1, '#000', .45]])}</defs>`;
  s += `<path d="${body}" fill="url(#${g})" stroke="#1a0206" stroke-width=".45"/><path d="${body}" fill="url(#${sh})"/>`;
  // the velvet's folds running down from the gathered neck; the coins' rims pressing through near the bottom
  for (const [dx, len, op] of [[-5, 13, .5], [-1.6, 16, .45], [2, 15, .45], [5.4, 11, .5]]) s += `<path d="M${f(tx + dx * .3)} ${f(ty + 2)}Q${f(tx + dx * 1.2)} ${f(ty + len * .5)} ${f(tx + dx * 1.7)} ${f(ty + len)}" stroke="#3a0408" stroke-width=".7" fill="none" opacity="${op}"/>`
    + `<path d="M${f(tx + dx * .3 - .7)} ${f(ty + 2)}Q${f(tx + dx * 1.2 - .7)} ${f(ty + len * .5)} ${f(tx + dx * 1.7 - .7)} ${f(ty + len)}" stroke="#ff8a7a" stroke-width=".35" fill="none" opacity=".35"/>`;
  for (const [cx, cy, rx] of [[bx - 5, by - 6, 3.6], [bx + 3, by - 4.6, 3.8], [bx - .6, by - 10.6, 3.4], [bx + 6.4, by - 10, 3]]) s += `<path d="M${f(cx - rx)} ${f(cy)}a${rx} ${f(rx * .45)} 0 0 1 ${f(rx * 2)} 0" stroke="#ff9a8a" stroke-width=".45" fill="none" opacity=".5"/><path d="M${f(cx - rx)} ${f(cy + .5)}a${rx} ${f(rx * .45)} 0 0 0 ${f(rx * 2)} 0" stroke="#2a0206" stroke-width=".5" fill="none" opacity=".5"/>`;
  // the sheen on the velvet towards the light (top left) and the gold embroidery: a small crest of the Company
  s += `<path d="M${f(bx - w + 2.6)} ${f(by - 8)}Q${f(bx - w + 3)} ${f(by - 15)} ${f(tx - 3.4)} ${f(ty + 4)}" stroke="#ff9a9a" stroke-width="1.4" fill="none" opacity=".35"/>`
    + `<g transform="translate(${f(bx)} ${f(by - 20)})"><path d="M-3 -3h6v2.6q0 3 -3 4.2q-3 -1.2 -3 -4.2z" fill="none" stroke="#e8c060" stroke-width=".6"/><path d="M0 -3v7M-3 -.6h6" stroke="#e8c060" stroke-width=".5"/></g>`;
  // the gathered frill above the tie
  { let d = `M${f(tx - 2.8)} ${f(ty + .4)}`; const n = 7; for (let k = 0; k < n; k++) { const x0 = tx - 2.8 + k * 5.6 / n, x1 = x0 + 5.6 / n, xm = (x0 + x1) / 2 + (k - 3) * .5, top = ty - 4.4 - Math.sin(k * 1.7) * .9 - (k === 3 ? .6 : 0); d += `L${f(xm + (k - 3) * .5)} ${f(top)}L${f(x1)} ${f(ty - .4)}`; }
    s += `<path d="${d}L${f(tx + 2.8)} ${f(ty + .4)}Z" fill="#8a1418" stroke="#1a0206" stroke-width=".35"/>`;
    for (let k = 0; k < 5; k++) { const x = tx - 2 + k; s += `<path d="M${f(x)} ${f(ty)}L${f(x + (k - 2) * 1.1)} ${f(ty - 3.6)}" stroke="${k % 2 ? '#3a0408' : '#e86a6a'}" stroke-width=".35" opacity=".6"/>`; } }
  // the tie: the gold cord wound twice, its two ends hanging with tassels
  s += `<path d="M${f(tx - 3.2)} ${f(ty - .2)}Q${tx} ${f(ty + 1.6)} ${f(tx + 3.2)} ${f(ty - .2)}M${f(tx - 3)} ${f(ty + 1)}Q${tx} ${f(ty + 2.8)} ${f(tx + 3)} ${f(ty + 1)}" stroke="#8a6a1a" stroke-width="1.2" fill="none"/>`
    + `<path d="M${f(tx - 3.2)} ${f(ty - .4)}Q${tx} ${f(ty + 1.3)} ${f(tx + 3.2)} ${f(ty - .4)}" stroke="#f4d47a" stroke-width=".45" fill="none"/>`;
  for (const [dx, len] of [[-.6, 9], [1.8, 7]]) { const a = [tx + dx, ty + 1.6], b = [tx + dx * 3 - 2, ty + len];
    s += `<path d="M${P2(a)}Q${f(a[0] - 1)} ${f((a[1] + b[1]) / 2)} ${P2(b)}" stroke="#a8862a" stroke-width=".7" fill="none"/>`
      + `<path d="M${f(b[0] - 1.1)} ${f(b[1] + .4)}q1.1 -1.4 2.2 0l.6 4q-1.7 .8 -3.4 0z" fill="#d8b04a" stroke="#6a4a10" stroke-width=".3"/><path d="M${f(b[0] - .6)} ${f(b[1] + 1.4)}v3M${f(b[0] + .5)} ${f(b[1] + 1.4)}v3" stroke="#7a5a14" stroke-width=".25"/>`; }
  // one coin's edge peeping from the neck
  s += `<path d="M${f(tx - 1)} ${f(ty - 2.4)}l2.6 -.6" stroke="#f4d47a" stroke-width=".9" stroke-linecap="round"/>`;
  return s;
}

/** The shaft from the grating with its dust; the light on the deal; the dark round the edges and under the glass. */
function air(u, L) {
  const q0 = pr(GR.x0, YC, GR.z0), q1 = pr(GR.x1, YC, GR.z0), id = nid('sf', u), g = nid('sg', u);
  let s = `<defs><filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>${linGrad(g, 0, q0[1], 0, 150, [[0, '#fff4dc', .38], [.6, '#fff0d0', .2], [1, '#fff0d0', 0]])}</defs>`
    + `<path d="M${f(q0[0] - 2)} ${f(q0[1] - 4)}L${f(q1[0] + 2)} ${f(q1[1] - 4)}L162 150L46 150Z" fill="url(#${g})" filter="url(#${id})" style="mix-blend-mode:screen"/>`;
  s += motes(30, 60, 30, 80, 100, '#fff0d0', 13);
  s += K.localGlow(u, { x: 96, y: 92, color: '#fff2da', power: .45, radius: 34 }, { core: false })
    + gloom(u, 100, 120, 100, 280, .55, '#030201') + gloom(u, 60, 60, 0, 0, .25, '#030201');
  return s;
}
module.exports.parts = { hold, deal, air, light, VY };
