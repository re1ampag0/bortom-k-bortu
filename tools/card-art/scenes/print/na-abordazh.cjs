// «На абордаж!» (Месть королевы Анны, ПРИКАЗ: только по кораблю напротив — 2 урона по Команде и 1 по Корпусу; не
// Залп), refined from the first-round scene (portrait-revenge.cjs SCENES['На абордаж!']): the two sides alongside at
// sunset, the grapnel lines taut between the rails, a man swinging across on a rope against the sky. Kept: the idea,
// the sunset, the high side close on the right, the lines from rail to rail, the swing rope from the yard, the sabre.
// Fixed against the first round: the side was a flat brown wall — now the kit's Revenge alongside (her waist, the
// port row, the channels and shrouds, the masts going up out of the picture); the three swingers were stick
// silhouettes without hands or feet — now one boarder, big and whole, mid-swing towards us: his near fist round the
// rope (people.cjs hand3), the cutlass up in the other fist, one sleeve from shoulder to cuff on each arm, breeches,
// boots with soles and heels, a red sash and a head scarf; the hooks were bent strokes — now forged four-fluked
// grapnels biting our rail in the foreground, splinters at the bite. We stand on the enemy's deck: our rail across
// the bottom. Light: the low sun behind the Revenge's foremast rigging, upper left (key, contre-jour: warm rims on
// him, the blade and the lines; her side towards us in half shade); the warm haze of the sunset (fill).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 93, SUN = { x: 34, y: 64 };
const REV = { kind: 'revenge', x: 124, y: 122, scale: 3, sails: 'reefed', seed: 3 };   // her waist alongside, bow to the left
const RAIL = 112;                                                                      // the top of our rail (the near side)
const HEAD = { c: [92, 40], r: 6 };
const light = { time: 'dusk', haze: .4, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffb46a', power: .9 },
  fill: { color: '#5a2a34', power: .45 }, rim: { az: 300, color: '#ffc488', power: .6 } };
const skel = { horizon: HZ, eye: 4.7, light: 'the low sun behind her fore rigging, upper left (key, contre-jour) + the sunset haze (fill)', items: [
  ['Revenge', -10, 122, 220, 150, 'water alongside: her waist, rail at y≈86, masts out of the top'],
  ['boarder', 58, 114, 74, 100, 'in the air between the sides, on the rope from her yard'],
  ['cutlass', 56, 50, 14, 38, 'in his fist'], ['swing rope', 118, 22, 36, 30, 'from above the picture to his fist'],
  ['grapnel lines', 34, 113, 160, 30, 'her rail -> hooks on our rail'], ['our rail', -10, 140, 220, 28, 'the near side']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#e6ad7c', half: '#ad6c40', core: '#8a5230', shadow: '#4e2a18', outline: '#1e0c06' };
const SHIRT = { lit: '#ecd8b4', half: '#a48a6a', shadow: '#584232', outline: '#24160c' };
const VEST = { lit: '#6a4630', half: '#3a2418', shadow: '#1a0e08', outline: '#0a0604' };
const PANTS = { lit: '#565a6e', half: '#2c2e3c', shadow: '#15161e', outline: '#08080c' };
const BOOT = { lit: '#6a4428', half: '#34200f', shadow: '#160c05', outline: '#070302' };
const RIMC = '#ffc080';
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// a hand round a cylinder whose axis must run at t degrees: turn the hand until its grip axis does
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}

// a boot's foot: A — the ankle, d — towards the toe, the sole on the side of n; sz — the foot's length
function bootFoot(u, A, d, sz, rimSide) {
  d = unit(d); let n = [-d[1], d[0]]; if (n[1] < 0) n = [-n[0], -n[1]];
  const k = sz / 12, P = (x, y) => [A[0] + (d[0] * x + n[0] * y) * k, A[1] + (d[1] * x + n[1] * y) * k];
  const out = [[-2.6, -2.6], [-3.4, .4], [-3.5, 2.4], [-3, 3.6], [-.6, 3.7], [.2, 3], [2, 2.9], [7, 3.3], [9.4, 3.2], [10.6, 2.4], [10.8, 1.2], [9.8, .1], [7.4, -.6], [3.6, -1.4], [1.6, -2.8]].map(q => P(q[0], q[1]));
  const id = nid('bt', u), c0 = P(4, -1.4), c1 = P(4, 3.4);
  let s = `<defs>${linGrad(id, c0[0], c0[1], c1[0], c1[1], [[0, BOOT.lit, 1], [.45, BOOT.half, 1], [1, BOOT.shadow, 1]])}</defs>`
    + `<path d="M${out.map(P2).join('L')}Z" fill="url(#${id})" stroke="${BOOT.outline}" stroke-width=".4" stroke-linejoin="round"/>`;
  // the sole and the heel block, darker; the welt line; the toe's shine
  const sole = [[-3, 3.6], [-.6, 3.7], [.2, 3], [2, 2.9], [7, 3.3], [9.4, 3.2], [10.6, 2.4], [10.2, 2.1], [9.2, 2.6], [7, 2.6], [2, 2.2], [-.6, 2.8], [-3.3, 2.7]].map(q => P(q[0], q[1]));
  s += `<path d="M${sole.map(P2).join('L')}Z" fill="#0c0603"/>` + `<path d="M${P2(P(-.4, 2.6))}L${P2(P(-.4, 3.7))}" stroke="#2a180c" stroke-width=".35"/>`
    + `<path d="M${P2(P(6, -.3))}Q${P2(P(9, .2))} ${P2(P(10, 1.4))}" stroke="#c89a70" stroke-width=".5" fill="none" opacity=".55"/>`;
  if (rimSide) s += `<path d="M${[[-2.6, -2.6], [1.6, -2.8], [3.6, -1.4], [7.4, -.6], [9.8, .1]].map(q => P2(P(q[0], q[1]))).join('L')}" stroke="${RIMC}" stroke-width=".55" fill="none" opacity=".7" stroke-linejoin="round"/>`;
  return s;
}

// a grapnel thrown from her side, biting over our rail: the crown sitting on the cap, the shank and its ring leaning
// back along the line towards her, four barbed flukes — two hooked over the cap's edge towards us and down our face,
// their points in the wood, two hanging down the far side behind the rail. Returns { back, front, ring }: back goes
// under the bulwark (it hides the far flukes), front over it; the ring is where the line is made fast.
function grapnel(u, L, x, y, s, seed, toward) {
  const R = rng(seed), d = unit([toward[0] - x, toward[1] - y]), ring = [x + d[0] * 9 * s, y + d[1] * 9 * s];
  let out = '';
  const fl = (dx, dy, front) => { const a = [x, y], b = [x + dx * .7, y + dy * .1 - 1.6 * s], c = [x + dx, y + dy], tip = [x + dx * .86, y + dy - 2.6 * s];
    const d0 = `M${P2(a)}Q${P2(b)} ${P2(c)}Q${P2([c[0] + dx * .14, c[1] + 1 * s])} ${P2([c[0] + dx * .02, c[1] + .4 * s])}L${P2(tip)}`;
    return `<path d="${d0}" stroke="#0a0808" stroke-width="${f(2.6 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${d0}" stroke="${front ? '#56504e' : '#3a3434'}" stroke-width="${f(1.5 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M${P2(tip)}l${f(-dx * .12)} ${f(-1.4 * s)}l${f(dx * .22)} ${f(.9 * s)}Z" fill="#6a6260" stroke="#0a0808" stroke-width="${f(.3 * s)}"/>`
      + `<path d="M${P2([a[0], a[1] - .7 * s])}Q${P2([b[0], b[1] - .7 * s])} ${P2([c[0] - dx * .05, c[1] - .9 * s])}" stroke="${RIMC}" stroke-width="${f(.45 * s)}" fill="none" opacity=".7"/>`; };
  out += fl(4.6 * s, 4.2 * s, false) + fl(-4.8 * s, 4 * s, false);
  out += K.shadeCyl(u, x, y + .4 * s, ring[0] - d[0] * 1.6 * s, ring[1] - d[1] * 1.6 * s, 1.05 * s, L, 'iron', { outline: .3, seed });
  out += `<circle cx="${f(ring[0])}" cy="${f(ring[1])}" r="${f(1.8 * s)}" fill="none" stroke="#0a0808" stroke-width="${f(1.15 * s)}"/><circle cx="${f(ring[0])}" cy="${f(ring[1])}" r="${f(1.8 * s)}" fill="none" stroke="#5a5250" stroke-width="${f(.6 * s)}"/>`
    + `<path d="M${f(ring[0] - 1.6 * s)} ${f(ring[1] - .8 * s)}A${f(1.8 * s)} ${f(1.8 * s)} 0 0 1 ${f(ring[0] + .6 * s)} ${f(ring[1] - 1.7 * s)}" stroke="${RIMC}" stroke-width="${f(.4 * s)}" fill="none" opacity=".7"/>`;
  const back = out; let front = '';
  // the two near flukes over the cap's edge: their shadow on our face first, a dark bite where each crosses the
  // edge, the fluke, then splinters of the face round the point driven into it
  for (const [dx, dy] of [[-3.6, 6.6], [3.2, 6]]) {
    front += `<path d="M${P2([x + dx * s * .5 + .8 * s, y + 2.4 * s])}Q${P2([x + dx * s + .9 * s, y + dy * s * .6])} ${P2([x + dx * s + .7 * s, y + dy * s + 1 * s])}" stroke="#140806" stroke-width="${f(2.2 * s)}" fill="none" opacity=".45" stroke-linecap="round"/>`
      + `<ellipse cx="${f(x + dx * s * .62)}" cy="${f(y + 1.9 * s)}" rx="${f(1.4 * s)}" ry="${f(.5 * s)}" fill="#120806" opacity=".8"/>`
      + fl(dx * s, dy * s, true);
    const tp = [x + dx * s * .86, y + dy * s - 2.6 * s];
    for (let i = 0; i < 3; i++) front += `<path d="M${f(tp[0] + (R() - .5) * 2 * s)} ${f(tp[1] - .4 * s)}l${f((R() - .5) * 2.4 * s)} ${f(-.8 - R() * 1.6 * s)}" stroke="#e8c49a" stroke-width="${f(.32 * s)}" opacity=".8"/>`; }
  // the crown boss on top of the cap, catching the sun
  front += K.shadeSphere(u, x, y, 1.35 * s, L, 'iron', { outline: .3 }) + `<path d="M${f(x - 1 * s)} ${f(y - .7 * s)}q${f(.8 * s)} ${f(-.7 * s)} ${f(1.8 * s)} ${f(-.3 * s)}" stroke="${RIMC}" stroke-width="${f(.35 * s)}" fill="none" opacity=".7"/>`;
  return { back, front, ring };
}

module.exports = { name: 'На абордаж!', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4.7 }), R = rng(37);
    L.pal = Object.assign({}, L.pal, { sky: ['#2a0e18', '#6e2220', '#c8582c', '#f2a458'], sea: ['#c8683a', '#4a1e1e', '#140808'], cloudLit: '#ffb070', cloudShade: '#4a1a22' });
    // ——— the sunset sky, the sun low behind her fore rigging, clouds lit from below ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 5 }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 26, 80, 9, 4, .3], [60, 16, 70, 7, 9, .45], [110, 56, 60, 5, 2, .6], [24, 82, 50, 4, 12, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += glow(u, SUN.x, SUN.y, 70, 40, '#ffcf8a', .45) + K.water(u, L, { horizon: HZ, bottom: 160, swell: .45, seed: 6, glitter: SUN.x });
    // ——— the Revenge alongside: her waist, the port row, shrouds and masts going up out of the picture ———
    bg += K.ship(u, L, Object.assign({ wake: false, lights: true }, REV));
    const G = K.shipGeom(REV.kind, REV);
    // the sun's glow through her rigging and the gun smoke drifting from the last broadside between the sides
    bg += K.localGlow(u, { x: SUN.x, y: SUN.y, color: '#ffb060', power: .5, radius: 44 }, { core: false });
    const Ls = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#8a5a4a' }) });
    bg += K.smoke(u, Ls, { x: 186, y: 100, w: 46, h: 54, wind: -.5, seed: 9, opacity: .55, glow: { color: '#ff9a50', power: .4 } })
      + K.smoke(u, Ls, { x: 8, y: 96, w: 30, h: 34, wind: .3, seed: 4, opacity: .4, glow: { color: '#ffb060', power: .5 } });

    // ——— the empty swing ropes of the men already across, hanging from her yards above the picture ———
    let mid = '';
    mid += K.rope(u, L, [[172, -4], [170, 20], [164, 46], [160, 58]], { r: .8, seed: 3, whip: true })
      + K.rope(u, L, [[186, -4], [189, 24], [194, 50], [197, 62]], { r: .75, seed: 5, whip: true });
    // ——— the grapnel lines: from her rail, taut down to the hooks over ours ———
    const lines = [[-24, 34], [2, 140], [16, 186]].map(([X, xn]) => { const a = G.nearRail(X), g = grapnel(u, L, xn, RAIL - .4, 1.55, xn + 3, a); return { a, b: g.ring, g }; });
    for (const ln of lines) mid += K.rope(u, L, [ln.a, [lerp(ln.a[0], ln.b[0], .5), lerp(ln.a[1], ln.b[1], .5) + .3], ln.b], { r: 1.15, seed: Math.round(ln.b[0]) })
      + `<path d="M${P2([ln.a[0], ln.a[1] - .9])}L${P2([ln.b[0], ln.b[1] - .9])}" stroke="${RIMC}" stroke-width=".45" opacity=".7"/>` + ln.g.back;
    // ——— our rail across the bottom, and the hooks biting it ———
    let near = K.bulwark(u, L, { x1: -10, x2: 210, y: 146, h: 34, kind: 'oak', posts: 30, seed: 8 });
    near += `<path d="M-10 ${RAIL + .2}H210" stroke="${RIMC}" stroke-width=".6" opacity=".55"/>`;
    for (const ln of lines) near += ln.g.front;

    // ——— the boarder, mid-swing towards us ———
    let man = '';
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .5, dir: -1, nod: 6, tone: SKIN, light: [-.85, -.35], warm: { color: '#ffa860', op: .35 },
      eye: 'wide', look: [-.6, .3], brow: 'frown', mouth: .55, smile: -.15, hair: { style: 'long', color: '#24160e' }, hairColor: '#24160e', moustache: true, stubble: true, iris: '#3a2a1a' });
    // the rope hand (his left, near): round the rope over his head; the cutlass hand (his right, far) forward and up
    const ROPE0 = [127, -34], GR = [121, 22], ropeAng = Math.atan2(GR[1] - ROPE0[1], GR[0] - ROPE0[0]) * 180 / Math.PI;
    const hR = handOn(u, { s: 1.05, m: -1, roll: 24, pitch: 10, pose: 'wrap', r: 1.15, tone: SKIN, light: [-.85, -.4], sw: .26, tilt: 8 }, GR, ropeAng, -70);
    const GS = [63, 47], bladeAng = -97;
    const hS = handOn(u, { s: 1.05, m: -1, roll: 40, pitch: 8, pose: 'wrap', r: .95, tone: SKIN, light: [-.85, -.4], sw: .26, tilt: 6 }, GS, bladeAng, 180);
    // the far (sabre) arm first: one sleeve from his right shoulder, the elbow out in front, to the cuff
    const shF = [88.5, 52.5], elF = [75, 56.5], shN = [109, 52.5], elN = [116.5, 37.5];
    const sleeve = (sh, el, w, sd, rimSide) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5) + .8], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5) + .3], w],
      w: [7.4, 7, 6.2, 5.2, 4.3], tone: SHIRT, lit: rimSide, rim: RIMC, rimSide, rimOp: .65, seed: sd, drapes: 2, foldW: .7, sw: .35, capA: true,
      cuff: { from: .84, k: 1.12, tone: { lit: '#f2e2c4', half: '#b8a080', shadow: '#6a5440', outline: '#24160c' } } });
    man += sleeve(shF, elF, hS.wrist, 3, -1);
    // the legs: breeches to the knee, boots with a turned-down top to the ankle, the feet; the far (leading) leg first
    const leg = (hip, knee, ank, toe, sd, rimSide) => {
      let s = H.cloth(u, { spine: [hip, [lerp(hip[0], knee[0], .5), lerp(hip[1], knee[1], .5) + .6], knee, [lerp(knee[0], ank[0], .12), lerp(knee[1], ank[1], .12)]],
        w: [10.4, 9.4, 7.6, 7], tone: PANTS, lit: rimSide, rim: RIMC, rimSide, rimOp: .55, seed: sd, drapes: 2, foldW: .7, sw: .35, capA: true });
      s += bootFoot(u, ank, toe, 12.4, true);
      s += H.cloth(u, { spine: [ank, [lerp(ank[0], knee[0], .5), lerp(ank[1], knee[1], .5)], [lerp(ank[0], knee[0], .92), lerp(ank[1], knee[1], .92)]],
        w: [5, 5.8, 6.8], tone: BOOT, lit: -rimSide, rim: RIMC, rimSide: -rimSide, rimOp: .55, seed: sd + 1, drapes: 0, folds: false, sw: .35,
        cuff: { from: .74, k: 1.28, tone: { lit: '#7a5434', half: '#4a2e18', shadow: '#1e1208', outline: '#070302' } } });
      return s; };
    man += leg([101, 81.5], [80.6, 77.2], [85.6, 92.9], [-.75, .66], 11, -1);
    man += leg([109.5, 82.5], [92.3, 95.4], [79.3, 106.9], [-1, .3], 13, -1);
    // the neck (short), under the jaw
    man += `<path d="M89.6 44.6L97.6 44.8L99.4 50.6Q95 52.4 90.6 50.8Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".3"/><path d="M90.4 46.4q3 2.2 7 .4" stroke="${SKIN.shadow}" stroke-width=".5" fill="none" opacity=".6"/>`;
    // the torso: the linen shirt open at the throat, the dark sleeveless jerkin over it, the sash at the waist
    { const sh = nid('sh', u), ve = nid('ve', u), sa = nid('sa', u);
      const shirtD = 'M88 51.4Q90.4 49.4 93.6 49.4L98 57.6L102.4 49.4Q107.6 49 110.6 50.6Q113.8 52.6 113.6 56.4Q113.4 60 112.8 62.4Q112 66 111.8 70L111.6 78.6L98.8 78.6L97.2 76Q93 71.6 90.6 66Q87.6 61.4 87 58Q85.4 55.4 86.4 53.4Q87 52 88 51.4Z';
      const vFar = 'M88 51.6Q90.6 49.8 93.4 49.8L96 61L98.4 77.6L97.2 76Q93 71.6 90.6 66Q87.6 61.4 87 58Q85.4 55.4 86.4 53.4Q87 52.2 88 51.6Z';
      const vNear = 'M103 49.8Q107.6 49.4 110.6 50.8Q113.8 52.8 113.6 56.4Q113.4 60 112.8 62.4Q112 66 111.8 70L111.6 78.4L101.6 78.4Q100.4 70 100.6 63Z';
      const vc = nid('vc', u), pc = nid('pc', u), sd = nid('sd', u), ap = nid('ap', u), vb = nid('vb', u);
      man += `<defs>${linGrad(sh, 86, 0, 114, 0, [[0, '#d8c09c', 1], [.35, '#a68c6c', 1], [1, '#5e4836', 1]])}${linGrad(ve, 86, 0, 114, 0, [[0, '#5a3a28', 1], [.3, '#3a2418', 1], [1, '#1a0e08', 1]])}${linGrad(sa, 0, 76, 0, 85, [[0, '#c03a26', 1], [.5, '#8a1c14', 1], [1, '#4a0c08', 1]])}</defs>`
        + `<path d="${shirtD}" fill="url(#${sh})" stroke="${SHIRT.outline}" stroke-width=".35"/>`
        // the shirt in the shadow of the jerkin's edges (its thickness standing off the linen)
        + `<path d="M94.4 50.4L97 61.2L99.2 77M102.2 50.6Q99.6 63 100.8 77.8" stroke="#2a1a10" stroke-width="1.5" fill="none" opacity=".45" stroke-linecap="round"/>`
        // the chest in the open collar: skin, the shirt's edges laid back
        + `<path d="M94.4 49.8L98 57L101.6 49.8Q98 51.6 94.4 49.8Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".25"/><path d="M95.8 51.2q2.2 1.4 4.4 0" stroke="${SKIN.shadow}" stroke-width=".35" fill="none" opacity=".6"/>`
        // the jerkin: two panels, its edges apart over the shirt, a lit edge towards the sun
        + `<path d="${vFar}" fill="url(#${ve})" stroke="${VEST.outline}" stroke-width=".35"/><path d="${vNear}" fill="url(#${ve})" stroke="${VEST.outline}" stroke-width=".35"/>`
        // the modelling inside the jerkin: the chest's swell, the side turning away into shade, the hollow under the
        // raised arm with its pulled folds, the shoulder seams, the darkening down to the sash
        + `<defs><clipPath id="${vc}"><path d="${vFar}"/><path d="${vNear}"/></clipPath>${radGrad(pc, 105.4, 56, 7.4, [[0, '#9a6c4c', .7], [.6, '#6a4630', .25], [1, '#3a2418', 0]])}${linGrad(sd, 106.6, 0, 113.8, 0, [[0, '#000', 0], [.55, '#000', .45], [.85, '#000', .62], [1, '#1a0c06', .4]])}`
        + `${radGrad(ap, 111.6, 57.4, 5, [[0, '#040100', .85], [.6, '#040100', .45], [1, '#040100', 0]])}${linGrad(vb, 0, 68, 0, 78.6, [[0, '#000', 0], [1, '#000', .4]])}</defs>`
        + `<g clip-path="url(#${vc})"><rect x="84" y="46" width="32" height="34" fill="url(#${pc})"/><ellipse cx="91" cy="58" rx="4.4" ry="7" fill="#7a5238" opacity=".35"/>`
        + `<rect x="84" y="46" width="32" height="34" fill="url(#${sd})"/><ellipse cx="111.6" cy="57.6" rx="3.4" ry="5.4" fill="url(#${ap})"/><rect x="84" y="46" width="32" height="34" fill="url(#${vb})"/>`
        + `<path d="M111.4 55.2Q108.6 57.4 105.6 57.6M111.8 58Q109.2 60.6 106.2 61.4M112 61.2Q110 63 108 63.6" stroke="#0a0402" stroke-width=".45" fill="none" opacity=".7"/><path d="M111 55.8Q108.4 58 105.8 58.4M111.4 58.8Q109 61.2 106.4 62" stroke="#7a5238" stroke-width=".3" fill="none" opacity=".5"/>`
        + `<path d="M88.4 52.6Q90.6 51.4 92.6 51.6M104.6 51.2Q107.8 51 110 52.2" stroke="#0a0402" stroke-width=".35" fill="none" opacity=".6" stroke-dasharray=".6 .5"/></g>`
        + `<path d="M86.4 53.4Q87 52.2 88 51.6Q90.6 49.8 93.4 49.8" stroke="${RIMC}" stroke-width=".6" fill="none" opacity=".7"/>`
        + `<path d="M93.4 49.8L96 61L98.2 77.6" stroke="#8a6448" stroke-width=".4" fill="none" opacity=".7"/><path d="M86.4 53.4L87.2 58L90.6 66L97.2 76" stroke="${RIMC}" stroke-width=".7" fill="none" opacity=".75"/>`
        + `<path d="M98.6 60q1.6 4 1 10M99.8 66q.8 5 .2 10" stroke="#6a5240" stroke-width=".35" fill="none" opacity=".7"/>`
        + [55.5, 61, 66.5].map(y => `<circle cx="${f(101.6 + (y - 55) * -.03)}" cy="${y}" r=".55" fill="#c9a048" stroke="#4a3010" stroke-width=".2"/>`).join('')
        // the sash wound round the waist, knotted on the near hip, its ends streaming back in the swing
        + `<path d="M97 75.6Q104.6 78.4 112 77.6L112.8 84.6Q105 86 98 83.6Z" fill="url(#${sa})" stroke="#2a0604" stroke-width=".35"/>`
        + `<path d="M97.6 78.4Q105 80.6 112.2 80M97.8 81Q105 83 112.6 82.4" stroke="#5a0e0a" stroke-width=".35" fill="none" opacity=".8"/><path d="M96.6 76.4Q97.4 80 97.8 83.4" stroke="${RIMC}" stroke-width=".5" fill="none" opacity=".6"/>`
        + `<path d="M111 79.4q3 -1 4 1.6q-1 2.6 -4 2q-1.4 -1.8 0 -3.6Z" fill="#9a2418" stroke="#2a0604" stroke-width=".3"/>`
        + `<path d="M114.6 80.6Q120 82 125 79.6Q123 83.4 126.6 86Q120 86.4 114.4 82.6Z" fill="#8a1c14" stroke="#2a0604" stroke-width=".3"/><path d="M114 82.4Q118 87 123.4 91Q119 91 116.8 93.4Q114.4 88 113.2 83.2Z" fill="#6e140e" stroke="#2a0604" stroke-width=".3"/>`
        + `<path d="M116 81.4Q120 82.8 124 81.2M115 84q3 3.6 6.6 6.2" stroke="#c04030" stroke-width=".35" fill="none" opacity=".7"/>`; }
    // the head, its rim of sunset on the side towards the sun; the scarf over the crown, knotted behind, ends flying
    man += hd.svg + rimArc(hd, { r: HEAD.r, light: [.9, .3], color: RIMC, span: 55, opacity: .7 });
    { const Q = hd.Q, dp = hd.depth;
      const pts = []; for (let k = 0; k < 36; k++) { const t = k / 36 * Math.PI * 2; for (const [y, rr] of [[-.42, 1.04], [-.75, .98], [-1.02, .62]]) pts.push(Q(Math.cos(t) * rr, y, Math.sin(t) * rr - .06)); }
      pts.push(Q(0, -1.16, -.1));
      const hull = P => { const S = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
        for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of S.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const cap = hull(pts), cg = nid('sc', u), c0 = Q(0, -.8, 0);
      man += `<defs>${linGrad(cg, c0[0] - 7, c0[1] - 3, c0[0] + 7, c0[1] + 3, [[0, '#d4402a', 1], [.4, '#9a2016', 1], [1, '#4a0a08', 1]])}</defs><path d="M${cap.map(P2).join('L')}Z" fill="url(#${cg})" stroke="#2a0604" stroke-width=".35"/>`;
      // the hem over the brow, a few folds pulled to the knot, the sun on its crown
      const hem = []; for (let k = 0; k <= 20; k++) { const t = -Math.PI * .5 + k / 20 * Math.PI; const p = [Math.sin(t) * 1.04, -.42, Math.cos(t) * 1.04 - .06]; if (dp(...p) > -.1) hem.push(Q(...p)); }
      if (hem.length > 2) man += `<path d="M${hem.map(P2).join('L')}" stroke="#3a0806" stroke-width=".5" fill="none"/>`;
      for (const [a, b] of [[[.4, -.6, .9], [-.8, -.5, -.6]], [[.7, -.85, .5], [-.7, -.6, -.7]], [[.2, -1, .6], [-.6, -.8, -.75]]]) { const p = Q(...a), q = Q(...b); man += `<path d="M${P2(p)}Q${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2 - .6)} ${P2(q)}" stroke="#5a0e0a" stroke-width=".35" fill="none" opacity=".75"/>`; }
      { const a = Q(-.3, -1.1, .3), b = Q(.6, -.9, .5); man += `<path d="M${P2(a)}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 - 1)} ${P2(b)}" stroke="${RIMC}" stroke-width=".6" fill="none" opacity=".65"/>`; }
      // the knot at the back of the head and its two ends streaming back (to the right) in the swing
      const kn = Q(-.05, -.55, -1.02);
      man += `<path d="M${f(kn[0] - 1.4)} ${f(kn[1] - .8)}q2.2 -1.2 3.2 .6q-.4 2 -2.6 1.8q-1.4 -.8 -.6 -2.4Z" fill="#8a1c14" stroke="#2a0604" stroke-width=".3"/>`
        + `<path d="M${f(kn[0] + 1.4)} ${f(kn[1] - .4)}Q${f(kn[0] + 6)} ${f(kn[1] - 2.4)} ${f(kn[0] + 10.6)} ${f(kn[1] - .6)}Q${f(kn[0] + 7)} ${f(kn[1] + .6)} ${f(kn[0] + 8.6)} ${f(kn[1] + 2.4)}Q${f(kn[0] + 4)} ${f(kn[1] + 1.4)} ${f(kn[0] + 1.2)} ${f(kn[1] + .8)}Z" fill="#9a2418" stroke="#2a0604" stroke-width=".3"/>`
        + `<path d="M${f(kn[0] + 1)} ${f(kn[1] + .8)}Q${f(kn[0] + 4.6)} ${f(kn[1] + 3.6)} ${f(kn[0] + 7.6)} ${f(kn[1] + 6.4)}Q${f(kn[0] + 4.4)} ${f(kn[1] + 6)} ${f(kn[0] + 3.4)} ${f(kn[1] + 7.6)}Q${f(kn[0] + 2.4)} ${f(kn[1] + 4)} ${f(kn[0] + .2)} ${f(kn[1] + 1.4)}Z" fill="#701410" stroke="#2a0604" stroke-width=".3"/>`;
      // a gold ring in the near ear
      { const e = Q(.84, .34, -.1); if (dp(.84, .34, -.1) > -.2) man += `<circle cx="${f(e[0])}" cy="${f(e[1] + .9)}" r=".8" fill="none" stroke="url(#brass${u})" stroke-width=".4"/>`; } }

    // ——— the cutlass in his far fist: the grip through the fist, the shell guard and knuckle-bow, the curved blade up ———
    let sabre = '';
    { const v = [Math.cos(bladeAng * Math.PI / 180), Math.sin(bladeAng * Math.PI / 180)], nn = [-v[1], v[0]], g = hS.grip;
      const at = (t, o) => [g[0] + v[0] * t + nn[0] * o, g[1] + v[1] * t + nn[1] * o];
      const grip = K.shadeCyl(u, ...at(-4.6, 0), ...at(3.6, 0), .95, L, 'leather', { outline: .3, seed: 4 });
      const pommel = K.shadeSphere(u, ...at(-5.2, 0), 1.2, L, 'brass', { outline: .3 });
      // the blade: back edge straight-ish, the edge bellying, a clipped point; the fuller; the sun along the edge
      const B = [at(4.4, -1.1), at(13, -1.3), at(21.5, -.6), at(28.6, 1.3), at(31, 2.5), at(29.6, .8), at(21.5, 1.8), at(13, 1.5), at(4.4, 1.1)];
      const bid = nid('bl', u), b0 = at(18, -1.5), b1 = at(18, 2);
      const blade = `<defs>${linGrad(bid, b0[0], b0[1], b1[0], b1[1], [[0, '#fff0d8', 1], [.3, '#c8c4c0', 1], [.62, '#6a6866', 1], [1, '#d8d0c8', 1]])}</defs>`
        + `<path d="M${P2(B[0])}Q${P2(B[1])} ${P2(B[2])}Q${P2(at(26, .2))} ${P2(B[3])}L${P2(B[4])}L${P2(B[5])}Q${P2(at(25, 1.9))} ${P2(B[6])}Q${P2(B[7])} ${P2(B[8])}Z" fill="url(#${bid})" stroke="#2a2420" stroke-width=".3"/>`
        + `<path d="M${P2(at(5, -.2))}Q${P2(at(13, -.3))} ${P2(at(23, .3))}" stroke="#4a4644" stroke-width=".4" fill="none"/>`
        + `<path d="M${P2(at(6, 1))}Q${P2(at(15, 1.5))} ${P2(at(27, 1.6))}" stroke="#ffe6c0" stroke-width=".35" fill="none" opacity=".85"/>`;
      // the shell guard over the fist and the knuckle-bow down the fingers' side to the pommel
      const shell = `<path d="M${P2(at(3.6, -3.2))}Q${P2(at(5.4, 0))} ${P2(at(3.6, 3.4))}L${P2(at(3, 3))}Q${P2(at(4.2, 0))} ${P2(at(3, -2.8))}Z" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".3"/>`;
      const bow = `<path d="M${P2(at(3.4, 2.8))}Q${P2(at(1, 5.6))} ${P2(at(-2.6, 5))}Q${P2(at(-5, 3.4))} ${P2(at(-5.4, .8))}" stroke="#4a3008" stroke-width="1.15" fill="none" stroke-linecap="round"/><path d="M${P2(at(3.4, 2.8))}Q${P2(at(1, 5.6))} ${P2(at(-2.6, 5))}Q${P2(at(-5, 3.4))} ${P2(at(-5.4, .8))}" stroke="#d8b060" stroke-width=".5" fill="none" stroke-linecap="round"/>`;
      sabre = blade + hS.back + grip + pommel + hS.front + shell + bow
        + glow(u, ...at(27, 1.4), 5, 5, '#ffe0a0', .45); }
    // the near (rope) arm: sleeve up to the cuff, the fist round the rope; the rope's free end flying below the fist
    let ropeArm = K.rope(u, L, [ROPE0, [lerp(ROPE0[0], GR[0], .5) + .6, lerp(ROPE0[1], GR[1], .5)], GR], { r: 1.1, seed: 7 })
      + `<path d="M${P2(ROPE0)}L${P2(GR)}" stroke="${RIMC}" stroke-width=".35" opacity=".5"/>`;
    // the rope runs on through the fist; just under it a stopper knot (the rope's end), nothing trailing
    const rv = unit([ROPE0[0] - GR[0], ROPE0[1] - GR[1]]), on = t => [GR[0] + rv[0] * t, GR[1] + rv[1] * t];
    ropeArm += sleeve(shN, elN, hR.wrist, 5, -1) + hR.back + K.rope(u, L, [on(3.4), GR, on(-3.6)], { r: 1.1, seed: 8 }) + hR.front
      + K.shadeSphere(u, ...on(-4.6), 1.7, L, 'oak', { outline: .3 }) + `<path d="M${P2(on(-3.6))}q-1.4 1 -.4 2.2M${P2(on(-4.4))}q1.6 .4 1.2 1.8" stroke="#3a2410" stroke-width=".35" fill="none"/>`;

    // ——— the air: the sun's glare, motes, the dark coming up from the deck ———
    const air = glow(u, 70, 60, 60, 46, '#ffb070', .12) + motes(18, 20, 50, 90, 50, '#ffd8a0', 11) + gloom(u, 100, 70, 0, 10, .25) + gloom(u, 100, 120, 100, 280, .5, '#140608');
    return [bg, mid + `<g transform="translate(100 33) scale(1.1) translate(-100 -40)">${man + sabre + ropeArm}</g>` + near + air];
  } };
