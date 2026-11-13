// «Зомби у пушек» (Месть королевы Анны, ПРИКАЗ: «Месть» сразу даёт ещё один Залп, Порох за него не платят), refined
// from the first-round scene (portrait-revenge.cjs SCENES['Зомби у пушек']): the Revenge's gun deck right after a
// broadside — the smoke still hangs under the deck beams and drifts in through the port. A dead gunner stands big
// on the left, stooping under the low beams, and with both bony hands lowers the linstock: the smouldering match is
// on the touchhole of the gun again, the priming already flares. The gun stands run out at its port, the barrel
// running away from us; out there the enemy, in the smoke of the first shot. One clear story: a second shot, at once.
// Kept: the gun deck, the dead gunner and his linstock at the touchhole (the bony hand is the find), the gun to the
// right, the port with the enemy, the smoke of the first shot.
// Fixed against the first round: the gunner was a flat puppet with stick arms and a second smaller puppet behind —
// now one whole figure (people.cjs): a 3/4 head (head34) with the dead face, sunken cheeks and dull glowing eyes, a
// kerchief; the torn shirt and waistcoat; each arm one sleeve from the shoulder to the elbow where it is torn off, the
// bony forearm, a hand3 hand round the staff; he stands on his own feet on the deck. The gun was a side-view badge
// with the barrel through the wall — now built in 3D (as in «Калёные ядра»), seen from behind and to the left, the
// barrel running away out of the port; the wall was flat — now the deck in 2.5D (the ship's side facing us, beams
// overhead, the deck going away to one vanishing point at a crouching eye level: the horizon runs through the port).
// Light: the match and the priming flare at the touchhole (key, warm point, low right of him: his face and hands lit
// from below), the dusk through the port (cool-red, from the depth: the smoke glows, rims on the gun). No gore.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, motes, glow } = PK;

// the camera, in metres: x = VX + F·X/Z, y = HZ + F·(EYE − Y)/Z (a crouching eye: the horizon runs through the port)
const HZ = 93, VX = 112, F = 180, EYE = 1.1;
const M = (X, Y, Z) => [VX + F * X / Z, HZ + F * (EYE - Y) / Z];
const WZ = 4.0, CEIL = 1.8;                            // the ship's side (facing us) and the deck beams overhead
const PORT = { X: .65, w: .76, sill: .45, top: 1.3 };  // the port in the side, the gun run out through it
// the gun in 3D (gun units of 5.5 cm): S — picture units per gun unit at its breech (Z 2.1 m), D0 — the eye's distance
// to there (2 m), E — the eye's height, gx — its offset to the right; yaw 0: it points straight out, square to the side
const GU = .055, GUN = { S: F / (2.0 / GU), D0: 2.0 / GU, E: EYE / GU, gx: PORT.X / GU, gd: 0, yaw: 0 };
// the gunner stands at 1.8 m (100 units/m), left of the gun; he is drawn in his own frame and moved by MAN
const MAN = [22, 16], HEAD = { c: [58, 32], r: 11 };
const TOUCH = [166, 105.4];                            // the touchhole on the top of the breech (from the gun's own projection)
const TL = [TOUCH[0] - MAN[0], TOUCH[1] - MAN[1]];      // the same in the gunner's frame
const light = { time: 'dusk', haze: .45, key: { type: 'point', x: TOUCH[0], y: TOUCH[1] - 2, h: .95, gy: 172, color: '#ff9a48', power: 1, radius: 90, z: .3 },
  fill: { color: '#4a2a3a', power: .32 }, locals: [{ x: 141, y: 100, color: '#ffb080', power: .4, radius: 60 }] };
const lightOut = { time: 'dusk', haze: .5, key: { type: 'sun', x: 150, y: 88, el: 3, color: '#ffa070', power: .9 }, fill: { color: '#6e4a70', power: .42 } };
const skel = { horizon: HZ, eye: EYE, light: 'the match and the priming flare at the touchhole (key, warm point) + the dusk through the port (from the depth)', items: [
  ['ship side', -10, 142, 220, 81, 'the deck / the deck beams, 4 m away'], ['port', 124, 122, 34, 38, 'ship side'],
  ['enemy', 130, 94, 20, 12, 'the sea outside: her waterline on the horizon'], ['gun', 128, 170, 72, 70, 'deck, from behind-left; the barrel out of the port'],
  ['gunner', 44, 203, 76, 170, 'deck at 1.8 m, his feet on it (under the glass), stooping under the beams'],
  ['linstock', 96, 106, 70, 30, 'both his hands; its match on the touchhole'], ['shot pile', 18, 150, 24, 12, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const DEAD = { lit: '#a8a888', half: '#6c7458', core: '#545c44', shadow: '#2a3022', outline: '#10140a' };
const DEADH = { lit: '#b0ac8a', half: '#727858', core: '#585e44', shadow: '#2c3022', outline: '#10140a' };
const SHIRT = { lit: '#b8ae96', half: '#7a7262', shadow: '#3a362c', outline: '#18160e' };
const VEST = { lit: '#5a4232', half: '#33241a', shadow: '#150e0a', outline: '#070403' };
const PANTS = { lit: '#4e4a44', half: '#2a2824', shadow: '#121110', outline: '#050404' };
const RIMC = '#ffb880', FIREC = '#ffa850';
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// the ship's side from inside: long red-painted strakes with their seams, a butt joint here and there, nail heads
function planks(u, top, bot, R) {
  const h = 3.6; let s = `<rect x="-10" y="${f(top)}" width="220" height="${f(bot - top)}" fill="#5a1e16"/>`;
  for (let y = top; y < bot; y += h) { const v = R(); s += `<rect x="-10" y="${f(y)}" width="220" height="${f(h)}" fill="${v > .5 ? '#7a2c20' : '#3a1008'}" opacity="${f(.15 + Math.abs(v - .5) * .5)}"/>`
    + `<path d="M-10 ${f(y)}H210" stroke="#1a0604" stroke-width=".5"/><path d="M-10 ${f(y + .5)}H210" stroke="#a04a34" stroke-width=".25" opacity=".4"/>`;
    for (let x = -10 + R() * 70; x < 210; x += 60 + R() * 70) s += `<path d="M${f(x)} ${f(y)}V${f(y + h)}" stroke="#1a0604" stroke-width=".4" opacity=".7"/><circle cx="${f(x - 1)}" cy="${f(y + h / 2)}" r=".3" fill="#1a0604"/><circle cx="${f(x + 1)}" cy="${f(y + h / 2)}" r=".3" fill="#1a0604"/>`;
    for (let i = 0; i < 6; i++) { const gx = R() * 220 - 10; s += `<path d="M${f(gx)} ${f(y + h * (.3 + R() * .4))}h${f(6 + R() * 20)}" stroke="#2a0a06" stroke-width=".25" opacity=".4"/>`; } }
  return s;
}
// the knuckles standing out and the tendons on the back of a hand3 hand: skin over bone, no wounds
function bony(h, tn, k = 1) {
  let s = '';
  for (const J of h.joints) for (let j = 1; j < J.length - 1; j++) s += `<circle cx="${f(J[j][0])}" cy="${f(J[j][1])}" r="${f(.42 * k)}" fill="${tn.lit}" opacity=".55"/><circle cx="${f(J[j][0] + .25 * k)}" cy="${f(J[j][1] + .3 * k)}" r="${f(.3 * k)}" fill="${tn.shadow}" opacity=".5"/>`;
  for (const J of h.joints.slice(0, 4)) s += `<path d="M${P2(h.wrist)}L${P2(J[0])}" stroke="${tn.shadow}" stroke-width="${f(.32 * k)}" opacity=".5"/>`;
  return s;
}

module.exports = { name: 'Зомби у пушек', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(23);
    Lo.pal = Object.assign({}, Lo.pal, { smoke: '#8a6a68' });
    const G = gun(u, L);
    const WT = M(0, CEIL, WZ)[1], WB = M(0, 0, WZ)[1];                 // the side: its top under the beams, its foot on the deck
    const p0 = M(PORT.X - PORT.w / 2, PORT.top, WZ), p1 = M(PORT.X + PORT.w / 2, PORT.sill, WZ);
    const [px0, py0, px1, py1] = [p0[0], p0[1], p1[0], p1[1]];
    // ——— outside, through the port: the dusk, the sea, the enemy in the smoke of our first shot ———
    const oc = nid('oc', u);
    let out = K.sky(u, Lo, { horizon: HZ, stars: false }) + K.sunMoon(u, Lo, { r: 4 }) + K.cloud(u, Lo, { x: 136, y: 88, w: 30, h: 4, seed: 4, far: .4 })
      + K.water(u, Lo, { horizon: HZ, bottom: py1 + 2, swell: .4, seed: 5, glitter: 126 });
    out += K.ship(u, Lo, { kind: 'endeavour', x: 136, y: HZ + .8, scale: .2, sails: 'reefed', detail: 'mid', flip: true, seed: 4 })
      + K.smoke(u, Lo, { x: 146, y: HZ + 8, w: 34, h: 22, wind: -.6, seed: 12, opacity: .7, glow: { color: '#ff9a60', power: .4 } })
      + K.splash(u, { x: 130, y: HZ + 1.8, w: 5, h: 6, seed: 2, L: Lo });
    let bg = `<defs><clipPath id="${oc}"><rect x="${f(px0)}" y="${f(py0)}" width="${f(px1 - px0)}" height="${f(py1 - py0)}"/></clipPath></defs><g clip-path="url(#${oc})">${out}`
      + `<path d="M${f(px0 - 2)} ${f(py0)}L${f(px1 + 2)} ${f(py0)}L${f(px1 - 1)} ${f(py0 + 2.6)}L${f(px0 + 1)} ${f(py0 + 2.6)}Z" fill="#8a2018"/></g>`;
    // ——— the deck overhead: planks fore and aft (across the picture), the beams running to the side (to the VP) ———
    { const g = nid('cl', u); bg += `<defs>${linGrad(g, 0, 0, 0, WT, [[0, '#080403'], [1, '#2a140c']])}</defs><rect x="-10" y="-2" width="220" height="${f(WT + 2)}" fill="url(#${g})"/>`;
      for (let Z = 1.2; Z < WZ; Z *= 1.16) { const y = M(0, CEIL, Z)[1]; bg += `<path d="M-10 ${f(y)}H210" stroke="#060302" stroke-width="${f(Math.max(.4, 1.6 / Z))}" opacity=".8"/>`; }
      for (const X of [-2.4, -1.1, .2, 1.5, 2.8]) { const a = M(X - .1, CEIL, 1.1), b = M(X - .1, CEIL, WZ), c = M(X + .1, CEIL, WZ), d = M(X + .1, CEIL, 1.1), e = M(X - .1, CEIL - .2, WZ), g2 = M(X - .1, CEIL - .2, 1.1);
        bg += K.shadeBox(u, [{ pts: [a, b, e, g2], n: X > 0 ? 'left' : 'right', grain: [b[0] - a[0], b[1] - a[1]] }, { pts: [g2, e, M(X + .1, CEIL - .2, WZ), M(X + .1, CEIL - .2, 1.1)], n: 'bottom', grain: [b[0] - a[0], b[1] - a[1]] }], L, 'oak', { seed: X * 10 + 30, outline: .5 }); void c; void d; } }
    // ——— the ship's side from inside: red-painted planking, the port cut out with its thickness, frames, a knee ———
    { const m = nid('pm', u);
      bg += `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="-10" y="0" width="220" height="200"><rect x="-10" y="0" width="220" height="200" fill="#fff"/><rect x="${f(px0)}" y="${f(py0)}" width="${f(px1 - px0)}" height="${f(py1 - py0)}" fill="#000"/></mask></defs>`
        + `<g mask="url(#${m})">${planks(u, WT, WB, R)}</g>`
        + Array.from({ length: 12 }, () => { const x = R() * 200, y = WT + 2 + R() * (WB - WT - 4); return (x > px0 - 3 && x < px1 + 3 && y > py0 - 3 && y < py1 + 3) ? '' : `<path d="M${f(x)} ${f(y)}h${f(2 + R() * 6)}" stroke="#7a5a3a" stroke-width=".4" opacity=".35"/>`; }).join('');
      for (const X of [-2.4, -.9, .1, 1.3]) { const a = M(X - .09, CEIL, WZ), b = M(X + .09, 0, WZ); bg += K.shadeBox(u, [{ pts: [a, [b[0], a[1]], b, [a[0], b[1]]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: X * 7 + 40, outline: .45 }); }
      // the thickness of the side round the opening: the sill catches the dusk
      const t = .1, toward = (p, k) => [lerp(p[0], VX, k), lerp(p[1], HZ, k)], A = [px0, py0], B = [px1, py0], C = [px1, py1], D = [px0, py1], a = toward(A, t), b = toward(B, t), c = toward(C, t), d = toward(D, t);
      bg += `<path d="M${P2(A)}L${P2(B)}L${P2(b)}L${P2(a)}Z" fill="#140806"/><path d="M${P2(D)}L${P2(C)}L${P2(c)}L${P2(d)}Z" fill="#a8603a"/><path d="M${P2(A)}L${P2(a)}L${P2(d)}L${P2(D)}Z" fill="#4a2a1a"/><path d="M${P2(B)}L${P2(b)}L${P2(c)}L${P2(C)}Z" fill="#7a4026"/>`
        + `<path d="M${P2(d)}L${P2(c)}" stroke="#ffc890" stroke-width=".5"/><rect x="${f(px0 - 2)}" y="${f(py0 - 2)}" width="${f(px1 - px0 + 4)}" height="${f(py1 - py0 + 4)}" fill="none" stroke="#1a0a06" stroke-width="2.2"/>`; }
    // ——— the deck: planks fore and aft, closer towards the side; the dusk's pool under the port ———
    { const g = nid('dk', u); bg += `<defs>${linGrad(g, 0, WB, 0, 290, [[0, '#3a2014'], [1, '#160a06']])}</defs><rect x="-10" y="${f(WB)}" width="220" height="${f(290 - WB)}" fill="url(#${g})"/>`;
      for (let Z = WZ; Z > .9; Z /= 1.09) { const y = M(0, 0, Z)[1]; bg += `<path d="M-10 ${f(y)}H210" stroke="#0a0503" stroke-width="${f(Math.max(.35, 1.2 / Z))}"/><path d="M-10 ${f(y + .6 / Z)}H210" stroke="#6a4028" stroke-width="${f(Math.max(.2, .5 / Z))}" opacity=".35"/>`;
        for (let i = 0; i < 3; i++) { const x = R() * 220 - 10, y2 = M(0, 0, Z / 1.09)[1]; bg += `<path d="M${f(x)} ${f(y)}L${f(x)} ${f(y2)}" stroke="#0a0503" stroke-width=".4" opacity=".6"/>`; } }
      bg += `<path d="M-10 ${f(WB)}H210" stroke="#060302" stroke-width="1.4"/>` + K.localGlow(u, { x: (px0 + px1) / 2, y: WB + 6, color: '#ffa070', power: .3, radius: 34 }, { squash: .3, core: false }); }
    // the rammer and sponge in their rack on the side, a tub of water by the gunner's feet, shot in a garland on the right
    bg += `<g filter="url(#drop${u})"><path d="M14 ${f(WB - 2)}L24 ${f(WT + 8)}" stroke="url(#oakH${u})" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="24.3" cy="${f(WT + 6.4)}" rx="3.2" ry="2.3" fill="#3a2418" transform="rotate(8 24.3 ${f(WT + 6.4)})"/></g>`;
    bg += K.castShadow(u, L, { x: 30, y: 150, w: 24, h: 12, horizon: HZ }) + K.shotPile(u, L, { x: 30, y: 150, s: 1.1, n: 3, seed: 4 });

    // ——— the gun, the smoke of the first shot still hanging under the beams and curling in at the port ———
    let mid = G.svg;
    mid += K.smoke(u, Lo, { x: px0 + 4, y: py0 + 8, w: 70, h: 40, wind: -.9, seed: 21, opacity: .38, glow: { color: '#ff9a60', power: .45 } })
      + K.smoke(u, Lo, { x: 150, y: WT + 4, w: 100, h: 34, wind: -1, seed: 8, opacity: .28, glow: { color: '#ff8a50', power: .3 } })
      + K.smoke(u, Lo, { x: 30, y: WT - 6, w: 80, h: 30, wind: -.4, seed: 15, opacity: .2 });

    // ——— the gunner ———
    let man = '';
    // the legs: ragged breeches to the knee, the bare shins, shoes; under the glass, but he stands on the deck
    man += K.castShadow(u, L, { x: 52, y: 187, w: 44, h: 160, horizon: HZ, d: .5 }) + K.contactShadow(u, 52, 187, 40, L, { ry: 3 });
    for (const [hip, knee, ank, sd] of [[[62, 96], [70, 136], [70, 182], 1], [[44, 96], [38, 136], [36, 182], -1]]) {
      man += H.cloth(u, { spine: [hip, [lerp(hip[0], knee[0], .5), lerp(hip[1], knee[1], .5)], knee], w: [17, 15, 13], tone: PANTS, lit: 1, rim: RIMC, rimSide: 1, rimOp: .4, seed: sd + 5, drapes: 1, sw: .4, capA: true });
      man += H.cloth(u, { spine: [[knee[0], knee[1] - 3], [lerp(knee[0], ank[0], .5), lerp(knee[1], ank[1], .5)], ank], w: [9, 8, 6.4], tone: DEAD, lit: 1, folds: false, sw: .4 });
      man += `<path d="M${f(ank[0] - 4)} ${f(ank[1] - 1)}Q${f(ank[0] - 5)} ${f(ank[1] + 5)} ${f(ank[0] - 3)} 187.6L${f(ank[0] + 11)} 188Q${f(ank[0] + 12)} 184 ${f(ank[0] + 4)} ${f(ank[1] - 1)}Z" fill="#1a120c" stroke="#060402" stroke-width=".4"/>`
        + `<path d="${H.sp([[knee[0] - 8, knee[1] - 2], [knee[0] - 5, knee[1] + 2], [knee[0] - 2, knee[1] - 1], [knee[0] + 2, knee[1] + 3], [knee[0] + 6, knee[1] - 1], [knee[0] + 8, knee[1] + 1]])}" stroke="${PANTS.outline}" stroke-width=".8" fill="none"/>`; }
    // the torso, stooping forward to the gun: the torn linen shirt, the ragged waistcoat open over it, the sash
    { const sh = nid('sh', u), ve = nid('ve', u), sa = nid('sa', u);
      const shirt = [[40, 47], [50, 41], [58, 44], [66, 41], [76, 46], [80, 56], [79, 72], [75, 88], [68, 100], [42, 100], [37, 88], [34, 70], [35, 56]];
      man += `<defs>${linGrad(sh, 80, 60, 30, 70, [[0, SHIRT.lit, 1], [.4, SHIRT.half, 1], [1, SHIRT.shadow, 1]])}${linGrad(ve, 80, 60, 30, 70, [[0, VEST.lit, 1], [.4, VEST.half, 1], [1, VEST.shadow, 1]])}${linGrad(sa, 0, 88, 0, 100, [[0, '#8a2a1e', 1], [1, '#3a0c08', 1]])}</defs>`
        + `<path d="${H.sp(shirt, true)}" fill="url(#${sh})" stroke="${SHIRT.outline}" stroke-width=".45"/>`
        // the open collar: the dry skin of the chest, the collarbones and a rib or two under it (no wound)
        + `<path d="M52 42L58 51L64 42Q58 45 52 42Z" fill="${DEAD.half}" stroke="${DEAD.outline}" stroke-width=".3"/><path d="M54 45q4 1.6 8 0" stroke="${DEAD.shadow}" stroke-width=".45" fill="none" opacity=".6"/>`
        // the waistcoat: two ragged panels, its hem torn into tongues
        + `<path d="M40 47L50 41L54 52L56 72L54 92L50 100L46 97L42 100L38 94L37 88L34 70L35 56Z" fill="url(#${ve})" stroke="${VEST.outline}" stroke-width=".4"/>`
        + `<path d="M66 41L76 46L80 56L79 72L75 88L70 96L67 92L64 96L62 80Z" fill="url(#${ve})" stroke="${VEST.outline}" stroke-width=".4"/>`
        + `<path d="M66 41L62 80L64 96" stroke="#8a6448" stroke-width=".45" fill="none" opacity=".7"/><path d="M76 46L80 56L79 72L75 88" stroke="${FIREC}" stroke-width=".8" fill="none" opacity=".6"/>`
        + [52, 60, 68].map(y => `<circle cx="${f(54.6 + (y - 52) * .06)}" cy="${y}" r=".7" fill="#8a7a50" stroke="#2a2010" stroke-width=".2"/>`).join('')
        // rents in the shirt: dark gaps with frayed edges, the grey skin over the ribs in one of them
        + `<path d="M58 60l3 -1l1 5l-2 4l-3 -2z" fill="${DEAD.shadow}" stroke="${SHIRT.outline}" stroke-width=".3"/><path d="M58.6 62l2.6 .6M58.4 64.6l2.4 .4" stroke="${DEAD.half}" stroke-width=".5"/>`
        + `<path d="M60 76q3 6 1 12M56 70q-2 8 0 14M64 66q2 10 0 20" stroke="${SHIRT.shadow}" stroke-width=".6" fill="none" opacity=".7"/>`
        + `<path d="M38 88Q54 93 72 89L72 97Q54 101 40 97Z" fill="url(#${sa})" stroke="#1a0402" stroke-width=".35"/><path d="M70 90q5 3 4 10l-4 -3l-2 4q-1 -6 2 -11Z" fill="#6a1a12" stroke="#1a0402" stroke-width=".3"/>`; }
    // ——— the head: 3/4 to the right, bent to the touchhole; the dead face lit from below by the match ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .55, dir: 1, nod: 14, tone: DEAD, light: [.75, .55], warm: { color: '#ff9a48', op: .4 },
      eye: 'open', white: '#14160e', iris: '#d8f088', look: [.6, .5], brow: 'calm', mouth: .5, smile: -.05, lips: '#2a2a22', hair: { style: 'long', color: '#3a3630' }, hairColor: '#2e2a26', noseL: .9, noseW: 1.1, eyeW: .9, stubble: true });
    let head = hd.svg;
    { const Q = hd.Q, r = HEAD.r, soft = (p, rx, ry, col, op) => { const g = nid('dz', u); return `<defs>${radGrad(g, p[0], p[1], Math.max(rx, ry), [[0, col, op], [1, col, 0]])}</defs><ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})"/>`; };
      for (const sd of [-1, 1]) if (hd.depth(sd * .5, .4, .6) > 0) head += soft(Q(sd * .46, .44, .64), r * .3, r * .22, '#12160c', .7) + soft(Q(sd * .62, -.28, .5), r * .2, r * .22, '#12160c', .5) + soft(Q(sd * .34, -.07, .82), r * .24, r * .17, '#060804', .8)
        + `<path d="M${P2(Q(sd * .7, .14, .42))}Q${P2(Q(sd * .5, .24, .7))} ${P2(Q(sd * .26, .3, .86))}" stroke="${DEAD.lit}" stroke-width=".45" fill="none" opacity=".5"/>`;
      for (const sd of [-1, 1]) { const e = Q(sd * .34, -.05, .84); if (hd.depth(sd * .45, 0, .9) > .1) head += glow(u, e[0], e[1], 3.4, 2.4, '#d8f088', .85); }
      // the teeth bared in the slack jaw, a split in the dry skin of the cheek
      { const a = Q(-.17, .64, .93), b = Q(.17, .64, .93); head += `<path d="M${P2(a)}L${P2(b)}" stroke="#cfc6a6" stroke-width="1" opacity=".85"/>` + [-.1, -.03, .04, .11].map(x => { const p = Q(x, .6, .96), q = Q(x, .68, .96); return `<path d="M${P2(p)}L${P2(q)}" stroke="#2a2a20" stroke-width=".25"/>`; }).join(''); }
      head += `<path d="M${P2(Q(.62, .2, .5))}Q${P2(Q(.54, .44, .58))} ${P2(Q(.46, .62, .6))}" stroke="${DEAD.shadow}" stroke-width=".4" fill="none" opacity=".6"/>`; }
    head += rimArc(hd, { r: HEAD.r, light: [.7, .5], color: '#ffc8a0', span: 40, opacity: .35 });
    // the kerchief over the crown, knotted at the back, faded red, a rent in it
    { const Q = hd.Q, dp = hd.depth, pts = [];
      for (let k = 0; k < 36; k++) { const t = k / 36 * Math.PI * 2; for (const [y, rr] of [[-.42, 1.05], [-.75, .99], [-1.03, .62]]) pts.push(Q(Math.cos(t) * rr, y, Math.sin(t) * rr - .06)); }
      pts.push(Q(0, -1.17, -.1));
      const S = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
      for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of S.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      const cap = lo.slice(0, -1).concat(up.slice(0, -1)), cg = nid('kc', u), c0 = Q(0, -.8, 0);
      head += `<defs>${linGrad(cg, c0[0] + 7, c0[1] + 3, c0[0] - 7, c0[1] - 3, [[0, '#9a3a2a', 1], [.45, '#6a2018', 1], [1, '#2a0a06', 1]])}</defs><path d="M${cap.map(P2).join('L')}Z" fill="url(#${cg})" stroke="#1a0402" stroke-width=".35"/>`;
      const hem = []; for (let k = 0; k <= 20; k++) { const t = -Math.PI * .5 + k / 20 * Math.PI; const p = [Math.sin(t) * 1.05, -.42, Math.cos(t) * 1.05 - .06]; if (dp(...p) > -.1) hem.push(Q(...p)); }
      if (hem.length > 2) head += `<path d="M${hem.map(P2).join('L')}" stroke="#2a0604" stroke-width=".55" fill="none"/>`;
      for (const [a, b] of [[[.4, -.6, .9], [-.8, -.5, -.6]], [[.7, -.85, .5], [-.7, -.6, -.7]]]) { const p = Q(...a), q = Q(...b); head += `<path d="M${P2(p)}Q${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2 - .6)} ${P2(q)}" stroke="#3a0a06" stroke-width=".4" fill="none" opacity=".75"/>`; }
      { const p = Q(.3, -.9, .62); head += `<path d="M${P2(p)}l1.6 1l-.4 1.8l-1.8 -.6z" fill="#1a0806"/>`; }
      const kn = Q(-.05, -.55, -1.02);
      head += `<path d="M${f(kn[0] - 1.4)} ${f(kn[1] - .8)}q2.2 -1.2 3.2 .6q-.4 2 -2.6 1.8q-1.4 -.8 -.6 -2.4Z" fill="#5a1a12" stroke="#1a0402" stroke-width=".3"/>`
        + `<path d="M${f(kn[0] - .6)} ${f(kn[1] + .8)}Q${f(kn[0] - 3)} ${f(kn[1] + 5)} ${f(kn[0] - 5)} ${f(kn[1] + 9)}Q${f(kn[0] - 2)} ${f(kn[1] + 7)} ${f(kn[0] + .6)} ${f(kn[1] + 8)}Q${f(kn[0] - 1)} ${f(kn[1] + 4)} ${f(kn[0] + .6)} ${f(kn[1] + 1)}Z" fill="#4a120c" stroke="#1a0402" stroke-width=".3"/>`; }
    // the neck: short, sinewy, under the jaw
    const neck = `<path d="M53 38L54 44L63 44L64 38Z" fill="${DEAD.half}" stroke="${DEAD.outline}" stroke-width=".3"/><path d="M55.6 39q.8 3 0 5M61 39q.8 3 0 5" stroke="${DEAD.shadow}" stroke-width=".5" fill="none" opacity=".7"/>`;
    // ——— the linstock: an oak staff, the iron fork at its head holding the slow match, its glowing end on the touchhole ———
    const BUTT = [76, 62], HEADL = [TL[0] - 6.6, TL[1] - 7], ang = Math.atan2(HEADL[1] - BUTT[1], HEADL[0] - BUTT[0]) * 180 / Math.PI;
    const along = t => [lerp(BUTT[0], HEADL[0], t), lerp(BUTT[1], HEADL[1], t)];
    const staff = K.shadeCyl(u, ...BUTT, ...HEADL, 1.25, L, 'oak', { outline: .35, r2: 1.05, seed: 3 })
      + K.shadeSphere(u, ...BUTT, 1.4, L, 'iron', { outline: .3 });
    const fork = `<path d="M${P2(HEADL)}l1.4 .6q2.4 -2.6 5.4 -1.6M${P2(HEADL)}l.6 1.6q2.4 1.8 3 4.6" stroke="#1a1414" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M${P2(HEADL)}l1.4 .6q2.4 -2.6 5.4 -1.6" stroke="#6a605a" stroke-width=".45" fill="none"/>`
      + K.rope(u, L, [[HEADL[0] - 7, HEADL[1] - 2.6], [HEADL[0] - 4, HEADL[1] + .6], [HEADL[0] - 1, HEADL[1] - 1.8], [HEADL[0] + 2.4, HEADL[1] + 1.4], [HEADL[0] + 5.2, HEADL[1] + 2.4], [TL[0] - .4, TL[1] - 1.6]], { r: .7, seed: 5 })
      + `<circle cx="${f(TL[0] - .2)}" cy="${f(TL[1] - 1.4)}" r="1.1" fill="#ffd060"/>`;
    // the priming flaring at the touchhole: the flash, sparks, a puff going up
    let flare = K.fire(u, { x: TOUCH[0] + .6, y: TOUCH[1] + .2, w: 5, h: 9, seed: 6, wind: -.3, pool: false })
      + glow(u, TOUCH[0], TOUCH[1] - 2, 26, 20, '#ffb050', .7) + glow(u, TOUCH[0], TOUCH[1] - 1, 8, 6, '#fff0b0', .9)
      + K.smoke(u, L, { x: TOUCH[0] + 1, y: TOUCH[1] - 6, w: 22, h: 30, wind: -.4, seed: 4, opacity: .4, glow: { color: '#ff9a40', power: .6 } });
    { const RS = rng(41); for (let i = 0; i < 22; i++) { const a = -Math.PI * (.1 + RS() * .8), d = 3 + RS() * 14, x = TOUCH[0] + Math.cos(a) * d, y = TOUCH[1] - 2 + Math.sin(a) * d * .9, r = .2 + RS() * .45;
      flare += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * 1.4)} ${f(Math.sin(a) * 1.4)}" stroke="${RS() > .5 ? '#ffe8a0' : '#ffa040'}" stroke-width="${f(r)}" stroke-linecap="round" opacity="${f(.5 + RS() * .5)}"/>`; } }
    // ——— the arms: each one sleeve from the shoulder, torn off below the elbow; the bony forearm; the hand round the staff ———
    const base = { s: 2.25, pose: 'wrap', r: .9, tone: DEADH, light: [.8, .4], sw: .3, tilt: 6, fingerW: .72, palmW: .9 };
    const hN = handOn(u, { ...base, m: 1, roll: 10, pitch: 8 }, along(.27), ang, 70);
    const hF = handOn(u, { ...base, m: 1, roll: 25, pitch: 10 }, along(.6), ang, 70);
    const arm = (sh, el, h, sd) => { const w = h.wrist, tear = [lerp(el[0], w[0], .18), lerp(el[1], w[1], .18)];
      return H.cloth(u, { spine: [[w[0] * .0 + lerp(el[0], w[0], .1), lerp(el[1], w[1], .1)], [lerp(el[0], w[0], .55), lerp(el[1], w[1], .55)], w], w: [6.6, 5.4, 4.6], tone: DEAD, lit: sd, folds: false, sw: .35 })
        + `<path d="M${P2(lerp2(el, w, .4, -1.6))}L${P2(lerp2(el, w, .9, -.8))}" stroke="${DEAD.shadow}" stroke-width=".45" opacity=".6"/><path d="M${P2(lerp2(el, w, .3, 1.4))}L${P2(lerp2(el, w, .85, .9))}" stroke="${DEAD.lit}" stroke-width=".4" opacity=".5"/>`
        + H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5)], el, tear], w: [12, 11, 10, 10.4], tone: SHIRT, lit: sd, rim: FIREC, rimSide: 1, rimOp: .45, seed: sd + 9, folds: false, sw: .4, capA: true })
        + ragged(el, tear); };
    const lerp2 = (a, b, t, o) => { const d = unit([b[0] - a[0], b[1] - a[1]]); return [lerp(a[0], b[0], t) - d[1] * o, lerp(a[1], b[1], t) + d[0] * o]; };
    const ragged = (el, tear) => { const d = unit([tear[0] - el[0], tear[1] - el[1]]), n = [-d[1], d[0]]; let s = 'M'; for (let i = 0; i <= 8; i++) { const o = -5.6 + i * 1.4, l = (i % 2 ? 2.6 : .4) + (i % 3) * .6; s += `${f(tear[0] + n[0] * o + d[0] * l)} ${f(tear[1] + n[1] * o + d[1] * l)}${i < 8 ? 'L' : ''}`; }
      return `<path d="${s}" stroke="${SHIRT.outline}" stroke-width=".5" fill="none"/>`; };
    // the elbow between the shoulder and the wrist for the arm's two lengths, bent to the side `side` (+1 — below the line)
    const elbow = (sh, w, lu, lf, side) => { const d = Math.hypot(w[0] - sh[0], w[1] - sh[1]), a = Math.min(lu, (d * d + lu * lu - lf * lf) / (2 * d)), hh = Math.sqrt(Math.max(0, lu * lu - a * a)), e = unit([w[0] - sh[0], w[1] - sh[1]]);
      return [sh[0] + e[0] * a - e[1] * hh * side, sh[1] + e[1] * a + e[0] * hh * side]; };
    const shF = [74, 48], shN = [39, 49];
    const armF = arm(shF, elbow(shF, hF.wrist, 28, 27, 1), hF, 1), armN = arm(shN, elbow(shN, hN.wrist, 29, 28, 1), hN, 1);
    // ——— assemble: the far arm and its hand behind the staff, the body, the head, the near arm in front ———
    man += neck + head + armF + hF.back + staff + fork + hF.front + bony(hF, DEADH, 2.25) + armN + hN.back + hN.front + bony(hN, DEADH, 2.25);
    man = `<g transform="translate(${MAN[0]} ${MAN[1]})">${man}</g>`;
    // ——— the air: the glow of the flare on him and the gun, the haze of the smoke, the dark round the edges ———
    const air = K.localGlow(u, { x: TOUCH[0], y: TOUCH[1], color: '#ff9a48', power: .5, radius: 60 }, { core: false }) + motes(24, 80, 40, 120, 60, '#ffc890', 7)
      + gloom(u, 100, 80, 0, 10, .4) + gloom(u, 100, 60, 100, -10, .35) + gloom(u, 100, 120, 100, 280, .55);
    return [bg, mid + flare + man + air];
  } };

/** The gun from behind and to the left, built in 3D (from «Калёные ядра»: gun space X across, Y up, Z forward from
 *  the carriage's rear), projected to the one vanishing point: the barrel runs away from us out of the port. A truck
 *  carriage (stepped cheeks, axletrees, bed, quoin, transom, four trucks); the barrel with its rings, the base ring and
 *  the cascabel towards us. Returns { svg, muzzle, P } (P — gun space to the picture). */
function gun(u, L) {
  const { S, D0, E, gx, gd } = GUN, yaw = GUN.yaw * Math.PI / 180, cY = Math.cos(yaw), sY = Math.sin(yaw);
  const Wd = (X, Y, Z) => [gx + X * cY + Z * sY, Y, gd - X * sY + Z * cY];                      // gun space -> world (x, y, depth)
  const kOf = d => D0 / (D0 + d), pr = w => { const k = kOf(w[2]); return [VX + w[0] * S * k, HZ + (E - w[1]) * S * k]; };
  const P = (X, Y, Z) => pr(Wd(X, Y, Z)), scl = (X, Y, Z) => S * kOf(Wd(X, Y, Z)[2]);
  const Nw = n => [n[0] * cY + n[2] * sY, n[1], -n[0] * sY + n[2] * cY];                          // a gun-space normal in the world
  const toKit = n => { const w = Nw(n); return [w[0], w[1], -w[2]]; };                            // -> the kit's (x right, y up, z at us)
  const seen = (n, c) => { const w = Nw(n), q = Wd(...c); return w[0] * -q[0] + w[1] * (E - q[1]) + w[2] * (-D0 - q[2]) > 0; };
  const dir2 = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1; return [d[0] / l, d[1] / l]; };
  const gZ = dir2(P(0, 0, 0), P(0, 0, 10)), gX = dir2(P(0, 0, 0), P(10, 0, 0));
  const iron = L.ramp('iron', VX, 100);
  // a box in gun space: the faces we can see
  const box = (x0, x1, y0, y1, z0, z1, seed, kind = 'oak') => {
    const xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, zm = (z0 + z1) / 2, F = [];
    const add = (pts, n, c, grain) => { if (seen(n, c)) F.push({ pts: pts.map(p => P(...p)), n: toKit(n), grain }); };
    add([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], [xm, y1, zm], gZ);
    add([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], [x0, ym, zm], gZ);
    add([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], [x1, ym, zm], gZ);
    add([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], [xm, ym, z0], gX);
    add([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [xm, ym, z1], gX);
    return K.shadeBox(u, F, L, kind, { seed, outline: .45 });
  };
  // a solid truck: a disc of oak across X, its tread, the face we see, the iron linchpin
  const hull = pts => { const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = []; for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); };
  const truck = (X, Zc, r, th, seed) => {
    const sg = Math.sign(X), ring = Xf => Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return P(Xf, r + r * Math.cos(a), Zc + r * Math.sin(a)); });
    const outerSeen = seen([sg, 0, 0], [X + sg * th / 2, r, Zc]), Xv = X + (outerSeen ? 1 : -1) * sg * th / 2, Xb = X - (outerSeen ? 1 : -1) * sg * th / 2;
    const fv = ring(Xv), fb = ring(Xb), c = P(Xv, r, Zc), rp = L.ramp('oak', c[0], c[1]);
    return `<path d="M${hull(fv.concat(fb)).map(P2).join('L')}Z" fill="${rp.shadow}" stroke="${rp.outline}" stroke-width=".45"/>`
      + K.shadeBox(u, [{ pts: fv, n: toKit([outerSeen ? sg : -sg, 0, 0]), grain: gZ }], L, 'oak', { seed, outline: .45 })
      + `<path d="M${P2(P(Xv, r * 1.7, Zc - r * .7))}L${P2(P(Xv, r * .3, Zc + r * .7))}" stroke="${rp.outline}" stroke-width=".35" opacity=".6"/>`
      + K.shadeSphere(u, c[0], c[1], .9 * scl(Xv, r, Zc), L, 'iron', { outline: .3 }); };
  // the rings round the barrel: the half of each circle that faces us
  const band = (Z, r, w, col, op = 1) => { let d = '', on = false;
    for (let i = 0; i <= 36; i++) { const a = i / 36 * Math.PI * 2, n = [Math.cos(a), Math.sin(a), 0], p = P(r * n[0], 13 + r * n[1], Z), v = seen(n, [r * n[0], 13 + r * n[1], Z]);
      if (v) { d += `${on ? 'L' : 'M'}${P2(p)}`; on = true; } else on = false; }
    return `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`; };
  let s = '';
  // the shadows: the carriage's footprint, dark under it; the brazier throws the rest to the left
  { const fp = [P(-13.5, 0, -1), P(13.5, 0, -1), P(13.5, 0, 27.5), P(-13.5, 0, 27.5)], c = P(0, 0, 13);
    s += K.castShadow(u, L, { x: c[0], y: c[1], w: 44, h: 24, horizon: HZ, d: .8 }) + `<path d="M${fp.map(P2).join('L')}Z" fill="#050202" opacity=".55" filter="url(#soft${u})"/>`; }
  // the far side first: its trucks, the axletrees, the far cheek (front step first)
  s += truck(-11.6, 22.5, 4.4, 3, 21) + truck(-11.6, 2.8, 4, 3, 22);
  s += box(-12.8, 12.8, 3.4, 5.4, 21, 24, 17) + box(-12.8, 12.8, 3, 5, 1.3, 4.3, 18);
  for (const [z0, z1, h, sd] of [[16, 27, 12.6, 3], [8, 16, 10.4, 5], [0, 8, 8.4, 7]]) s += box(-9.6, -5.4, 2.6, h, z0, z1, sd);
  // between the cheeks: the transom, the bed, the quoin with its handle
  s += box(-5.4, 5.4, 3, 5.8, 11, 14.5, 9) + box(-4.6, 4.6, 5.8, 7, 1.5, 12, 13) + box(-2.8, 2.8, 7, 8.8, .6, 6, 15);
  { const a = P(0, 7.9, .6), b = P(0, 7.9, -1.4); s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.1 * scl(0, 7.9, 0), L, 'oak', { ell: .5, face: 2, outline: .35 }); }
  // the barrel: from the breech (towards us) to the muzzle out beyond the port
  const zb = 0, zm = 44, B = P(0, 13, zb), M = P(0, 13, zm);
  { const ax = Nw([0, 0, 1]), q = Wd(0, 13, zb), v = [-q[0], E - q[1], -D0 - q[2]], lv = Math.hypot(...v), ell = Math.abs(ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2]) / lv;
    s += K.shadeCyl(u, B[0], B[1], M[0], M[1], 4.2 * scl(0, 13, zb), L, 'iron', { r1: 4.3 * scl(0, 13, zb), r2: 2.8 * scl(0, 13, zm), ell, face: 1, outline: .5 });
    s += band(1.2, 4.6, 1.4, iron.outline) + band(1.6, 4.6, .5, iron.lit, .6);
    for (const [z, r] of [[9, 4.1], [18, 3.8], [30, 3.3], [42, 3.1]]) s += band(z, r + .25, 1.1, iron.shadow) + band(z + .5, r + .25, .45, iron.lit, .55);
    // the breech's face: the base ring's moulding, the sunset on the barrel's top, the brazier on its near flank
    { const c = P(0, 13, -.2), r = 4.3 * scl(0, 13, 0); s += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r * .6)}" ry="${f(r * .6 * Math.max(ell, .3))}" transform="rotate(${f(Math.atan2(gZ[1], gZ[0]) * 180 / Math.PI + 90)} ${f(c[0])} ${f(c[1])})" fill="none" stroke="${iron.shadow}" stroke-width=".6" opacity=".7"/>`; }
    s += `<path d="M${P2(P(-.5, 17, 3))}L${P2(P(-.4, 15.7, 40))}" stroke="#ffd0a0" stroke-width=".9" opacity=".45" stroke-linecap="round"/>`
      + `<path d="M${P2(P(3.5, 15.2, 3))}L${P2(P(2.4, 14.4, 40))}" stroke="#ff8a3a" stroke-width="1.1" opacity=".5" stroke-linecap="round"/>`; }
  // the cascabel: the neck and the knob towards us
  { const a = P(0, 13, -.2), b = P(0, 13, -2.6), c = P(0, 13, -3.8);
    s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.2 * scl(0, 13, -1), L, 'iron', { outline: .35 }) + K.shadeSphere(u, c[0], c[1], 1.7 * scl(0, 13, -3.8), L, 'iron', { outline: .4 }); }
  // the near cheek (front step first), the iron capsquares over the trunnions, the near trucks
  for (const [z0, z1, h, sd] of [[16, 27, 12.6, 4], [8, 16, 10.4, 6], [0, 8, 8.4, 8]]) s += box(5.4, 9.6, 2.6, h, z0, z1, sd);
  for (const sx of [-1, 1]) s += box(sx > 0 ? 5.2 : -9.8, sx > 0 ? 9.8 : -5.2, 12.6, 13.5, 21.6, 24.6, 30 + sx, 'iron');
  for (const [z, y] of [[3, 5.6], [11, 7], [20, 8.8], [24, 6.4]]) { const b = P(9.65, y, z); s += K.shadeSphere(u, b[0], b[1], .55 * scl(9.6, y, z) * .6, L, 'iron', { outline: .25 }); }
  s += truck(11.6, 22.5, 4.4, 3, 23) + truck(11.6, 2.8, 4, 3, 24);
  return { svg: s, muzzle: P(0, 13, zm), P };
}
