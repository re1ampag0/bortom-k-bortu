// «Норрингтон на борту» (Летучий голландец, РЕМОНТ: восстановите 2 клетки на любых шкалах корабля союзника), method A
// — a detailed copy of the first-round scene (portrait-dutch.cjs SCENES['Норрингтон на борту']): the ghost ship's deck
// in the green fog under a soft beam from above; the former admiral's things — the hat, the sword — on an old cask.
// Kept: the idea (the admiral is no more: his finery is spent), the fog and the soft light from above, the cask with
// the cocked hat on it and the sword leaning on it, the cobweb. Added after the brief: he himself, in the coat that
// was once splendid and is now torn and muddy (a navy coat, one tarnished epaulette hanging by threads, the white
// cuffs grey with dirt, no wig — his own hair tied back), hauls on a rope with both fists (people.cjs hand3, one
// sleeve from the shoulder through the elbow to the cuff on each arm); the rope runs up to a tackle out of the frame
// and down to a fresh plank being set over a shot hole in the side of the Endeavour, the ally lying alongside.
// No likeness of any actor: a generic weathered officer, turned 3/4 away to the ship, unshaven.
// Light: the moon behind the fog upper right (key: his face and fists turned to it, the plank, the Endeavour's side);
// the green fog (fill); a soft beam from above on the deck.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 94, RAIL = 120, FOOT = 152;              // the horizon; our rail's top; our deck at the bulwark's foot
const MOON = { x: 150, y: 16 };
const END = { kind: 'endeavour', x: 124, y: 136, scale: 1.55, sails: 'furled', detail: 'mid', flip: true, seed: 7 };
const HOLE = { x: 172, y: 104 };                    // the shot hole in her side, the plank going over it
const HEAD = { c: [80, 48], r: 11 };
const G1 = [103, 92], G2 = [131, 67];               // his fists on the rope: near (his right), far (his left)
const light = { time: 'fog', haze: .7, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 40, color: '#dff4ea', power: .75 },
  fill: { color: '#2a4a42', power: .45 }, rim: { az: 40, color: '#cff8e8', power: .45 } };
const skel = { horizon: HZ, eye: 1.7, light: 'the moon behind the fog upper right (key) + green fog (fill) + a soft beam from above', items: [
  ['Endeavour', -10, END.y, 220, 120, 'water alongside, beyond our rail (her waterline behind it), masts out of the top'],
  ['hole and plank', HOLE.x - 16, HOLE.y + 10, 34, 22, 'her side; the plank hangs on its rope'], ['rope', 100, 96, 110, 96, 'his fists -> tackle out of the frame -> the plank'],
  ['Norrington', 42, 224, 96, 190, 'stands on our deck, leaning back on the rope'], ['cask', 4, 164, 38, 46, 'our deck, by the bulwark'],
  ['hat', 4, 122, 36, 14, 'on the cask'], ['sword', 34, 164, 14, 58, 'leans on the cask'], ['bulwark', -10, FOOT, 220, FOOT - RAIL, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const SKIN = { lit: '#e4bc98', half: '#b08262', core: '#946a4e', shadow: '#5a3a2c', outline: '#24120a' };
const COAT = { lit: '#56658c', half: '#27324f', shadow: '#0f1528', outline: '#05070e' };       // navy, faded
const CUFF = { lit: '#cfcab4', half: '#8e8a76', shadow: '#4c4a3a', outline: '#1a1810' };      // white facings, grey with dirt
const BREECH = { lit: '#d0cab2', half: '#8e8872', shadow: '#4a4636', outline: '#1a1810' };
const BOOT = { lit: '#4a3a2a', half: '#241a12', shadow: '#0e0a06', outline: '#050302' };
const RIMC = '#cff8e8';

// a hand round a cylinder whose axis must run at t degrees (from na-abordazh.cjs)
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// KIT-CANDIDATE: a barnacle cluster (from kolokol-gollandtsa.cjs), lit from the right
function barnacles(u, x, y, n, s, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, bx - r, 0, bx + r, 0, [[0, '#3a4034', 1], [.4, '#8a907a', 1], [1, '#c8ccb4', 1]])}</defs>`
      + `<ellipse cx="${f(bx - r * .4)}" cy="${f(by + r * .5)}" rx="${f(r * 1.2)}" ry="${f(r * .6)}" fill="#050c0a" opacity=".45"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#3a3c2e" stroke-width=".25"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#1a1c14"/>`; }
  return out;
}
function weed(x, y, len, n, seed, col = '#3e7a5a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.6 + R() * .7)}" fill="none" stroke-linecap="round" opacity=".85"/>`; }
  return out;
}
// mud on the cloth: soft irregular blotches
function mud(u, pts, seed) {
  const R = rng(seed); return pts.map(([x, y, r]) => { const g = nid('md', u); return `<defs>${radGrad(g, x, y, r, [[0, '#5a4630', .8], [.6, '#5a4630', .5], [1, '#5a4630', 0]])}</defs><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * (.6 + R() * .5))}" fill="url(#${g})" transform="rotate(${f(R() * 180)} ${f(x)} ${f(y)})"/>`; }).join('');
}

module.exports = { name: 'Норрингтон на борту', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.7 });
    // ——— the fog: the sky, the moon behind it, the sea; the Endeavour alongside, a shot hole in her side ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 6, seed: 3 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[60, 30, 70, 7, 4, .5], [180, 52, 50, 6, 9, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .4, seed: 5, glitter: MOON.x });
    bg += K.ship(u, L, END) + K.fog(u, L, { y: 10, h: 60, density: .35, seed: 6 });
    // the hole: ragged, dark, splinters standing out of it; the fresh plank on its sling over it
    { const R = rng(4), pts = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2, r = (i % 2 ? 4.2 : 6.6) * (.85 + R() * .3); return [HOLE.x + Math.cos(a) * r * 1.2, HOLE.y + Math.sin(a) * r * .8]; });
      bg += `<path d="M${pts.map(P2).join('L')}Z" fill="#0a0806" stroke="#c8a070" stroke-width=".5"/>` + pts.filter((_, i) => i % 2 === 0).map(p => `<path d="M${P2(p)}l${f((p[0] - HOLE.x) * .35)} ${f((p[1] - HOLE.y) * .35)}" stroke="#e0c090" stroke-width=".7"/>`).join(''); }
    const plankA = [HOLE.x - 15, HOLE.y - 6], plankB = [HOLE.x + 15, HOLE.y - 12];
    bg += K.shadeBox(u, [{ pts: [plankA, plankB, [plankB[0] + .6, plankB[1] + 6], [plankA[0] + .6, plankA[1] + 6]], n: 'front', kind: 'pine-deck', grain: [1, -.2] }], L, 'pine-deck', { seed: 11, outline: .4 })
      + `<path d="M${P2(plankA)}L${P2(plankB)}" stroke="#fff4dc" stroke-width=".6" opacity=".8"/>`
      + K.rope(u, L, [[plankA[0] + 4, plankA[1] - .6], [HOLE.x + 2, HOLE.y - 22], [plankB[0] - 4, plankB[1] - .6]], { r: .6, seed: 7 })
      + K.rope(u, L, [[HOLE.x + 2, HOLE.y - 22], [190, 30], [204, -6]], { r: .75, seed: 8 });
    // our bulwark: the ghost ship's old grey-green oak, weed and barnacles; the deck in perspective under the glass
    bg += K.bulwark(u, L, { x1: -10, x2: 210, y: FOOT, h: FOOT - RAIL, kind: 'oak', posts: 24, seed: 3 });
    bg += `<rect x="-10" y="${RAIL - 2}" width="220" height="${FOOT - RAIL + 2}" fill="#2a4a40" opacity=".4" style="mix-blend-mode:multiply"/>`;
    for (const [x, n, sd] of [[14, 3, 1], [70, 4, 2], [150, 3, 3], [190, 2, 4]]) bg += weed(x, RAIL + 1, 12 + n * 2, n, sd);
    bg += barnacles(u, 40, RAIL + 8, 4, 1.1, 11) + barnacles(u, 168, RAIL + 10, 3, 1, 12);
    { const id = nid('dk', u); bg += `<defs><clipPath id="${id}"><rect x="-10" y="${FOOT}" width="220" height="${290 - FOOT}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: FOOT, bottom: 290, vx: 96, kind: 'oak', plank: 13, seed: 7, wet: true })}</g>`; }
    bg += `<rect x="-10" y="${FOOT}" width="220" height="${290 - FOOT}" fill="#1c3a34" opacity=".4" style="mix-blend-mode:multiply"/>` + K.fog(u, L, { y: RAIL - 8, h: 24, density: .35, seed: 8 });
    // the soft beam from above onto the deck (the first round's light)
    { const fb = nid('fb', u), gb = nid('gb', u);
      bg += `<defs><filter id="${fb}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>${linGrad(gb, 0, 0, 0, 240, [[0, '#c8fff0', .18], [1, '#c8fff0', .02]])}</defs><path d="M54 -10L110 -10L150 240L20 240Z" fill="url(#${gb})" filter="url(#${fb})" style="mix-blend-mode:screen"/>`; }

    // ——— the cask on the left with his cocked hat on its head and his sword leaning on it (the old still life) ———
    const CK = { x: 22, y: 162, s: 1.4 };
    let cask = K.castShadow(u, L, { x: CK.x, y: CK.y, w: 30, h: 42, horizon: HZ, d: .6, opacity: .5 }) + K.barrel(u, L, { x: CK.x, y: CK.y, s: CK.s, kind: 'rum', seed: 5 })
      + barnacles(u, 10, 146, 3, .9, 21) + weed(34, 126, 10, 2, 22);
    { const top = CK.y - 30 * CK.s; // the hat lying on the head of the cask, its gold edge tarnished, a cobweb from it to the cask
      cask += `<g transform="translate(${CK.x + 1} ${f(top + 1)})"><ellipse cx="0" cy="2" rx="17" ry="3.4" fill="#000" opacity=".35"/><path d="M-18 1Q0 -14 18 1Q8 5 0 5Q-8 5 -18 1Z" fill="#141620" stroke="#06080c" stroke-width=".5"/>`
        + `<path d="M-18 1Q0 -14 18 1" stroke="#9a8040" stroke-width="1.2" fill="none"/><path d="M-10 -5Q0 -12 10 -5" stroke="#1e2028" stroke-width="4" fill="none"/><path d="M-12 -4Q0 -11 12 -4" stroke="${RIMC}" stroke-width=".4" fill="none" opacity=".6"/>`
        + `<circle cx="-2" cy="-8" r="2.2" fill="#2a3060" stroke="#9a8040" stroke-width=".6"/></g>`
        + `<path d="M8 ${f(top + 2)}L4 ${f(top + 16)}M8 ${f(top + 2)}L10 ${f(top + 18)}M5.6 ${f(top + 8)}q2.6 1 4.2 -.4M4.8 ${f(top + 12)}q3 1.2 5.2 -.2" stroke="#e8f8f0" stroke-width=".25" fill="none" opacity=".6"/>`; }
    cask += `<g transform="translate(41 ${CK.y + 1}) rotate(-12)">${K.shadeCyl(u, 0, 0, 0, -44, .9, L, 'iron', { outline: .3 })}<path d="M-4 -44h8" stroke="url(#brass${u})" stroke-width="1.6"/><path d="M-3.4 -44q-3 -6 3 -9" stroke="url(#brass${u})" stroke-width="1" fill="none"/>`
      + `<rect x="-1.4" y="-54" width="2.8" height="10" rx=".9" fill="#d8d0bc" stroke="#3a3428" stroke-width=".3"/><circle cy="-55" r="1.8" fill="url(#brass${u})"/></g>`;

    // ——— Norrington: legs braced, leaning back on the rope; the coat over them ———
    let man = '';
    // the legs (mostly under the glass): white breeches gone grey, boots with soles and heels on the deck
    const leg = (hip, knee, ankle, sd, lit) => H.cloth(u, { spine: [hip, knee, ankle], w: [15, 11, 8.4], tone: BREECH, lit, seed: sd, drapes: 1, sw: .4, capA: false, cuff: { from: .62, k: 1.18, tone: BOOT } });
    const boot = (A, dir) => `<path d="M${f(A[0] - 5 * dir)} ${f(A[1] - 2)}L${f(A[0] - 5.4 * dir)} ${f(A[1] + 5)}L${f(A[0] + 11 * dir)} ${f(A[1] + 5.4)}Q${f(A[0] + 12 * dir)} ${f(A[1] + 2)} ${f(A[0] + 6 * dir)} ${f(A[1] + 1)}L${f(A[0] + 4 * dir)} ${f(A[1] - 2)}Z" fill="${BOOT.half}" stroke="${BOOT.outline}" stroke-width=".4"/><path d="M${f(A[0] - 5.4 * dir)} ${f(A[1] + 5)}L${f(A[0] + 11 * dir)} ${f(A[1] + 5.4)}" stroke="#050302" stroke-width="1.4"/>`;
    man += leg([70, 150], [64, 186], [58, 216], 3, -1) + boot([58, 216], -1) + leg([90, 150], [104, 184], [112, 214], 4, 1) + boot([112, 214], 1);
    // the far arm first (behind the chest): his left, reaching forward and up to the far fist
    const base = { s: 2.25, pose: 'wrap', r: 1.15, tone: SKIN, light: [.6, -.8], sw: .3, palmW: .8, fingerW: .9, nails: true };
    const RA = Math.atan2(G2[1] - G1[1], G2[0] - G1[0]) * 180 / Math.PI;     // the rope's direction between the fists
    const hF = handOn(u, { ...base, m: 1, roll: 18, pitch: 10, tilt: 10 }, G2, RA, -30);
    const hN = handOn(u, { ...base, m: 1, roll: 28, pitch: 14, tilt: 8 }, G1, RA, -20);
    const sleeve = (sh, el, w, sd, lit, rimOp) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5) + 1], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5) + .6], w],
      w: [13.4, 12.4, 11.2, 9.8, 8.8], tone: COAT, lit, rim: RIMC, rimSide: lit, rimOp, seed: sd, drapes: 1, sw: .45, capA: true, roundA: .9, cuff: { from: .84, k: 1.1, tone: CUFF } });
    const farArm = sleeve([93, 68], [112, 84], hF.wrist, 7, -1, .6);
    // the coat: 3/4 turned to the right, skirts down past the hips, open over the waistcoat
    { const cg = nid('ct', u), coat = [[62, 66], [56, 84], [56, 110], [54, 140], [48, 172], [66, 176], [80, 160], [96, 174], [108, 170], [104, 140], [102, 112], [104, 90], [100, 72], [92, 64], [80, 62]];
      man += farArm + `<defs>${linGrad(cg, 54, 0, 108, 0, [[0, COAT.shadow, 1], [.45, COAT.half, 1], [.85, COAT.lit, 1], [1, '#6a7a9a', 1]])}</defs><path d="${H.sp(coat, true)}" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".55"/>`;
      // the waistcoat (dirty white) and the shirt at the throat, the front edge of the coat turned back with a frayed gold braid
      man += `<path d="M86 66Q94 70 100 72L102 112L96 132L86 128L84 96Z" fill="${CUFF.half}" stroke="${CUFF.outline}" stroke-width=".4"/><path d="M98 76L100 110" stroke="${CUFF.lit}" stroke-width="1.2" opacity=".55"/>`
        + [80, 90, 100, 110, 120].map(y => K.shadeSphere(u, 92 + (y - 80) * .05, y, .8, L, 'brass', { outline: .2 })).join('')
        + `<path d="M84 64Q80 92 86 128L80 160" stroke="${COAT.outline}" stroke-width=".7" fill="none"/><path d="M85 64Q81 92 87 128" stroke="#a88a48" stroke-width=".9" fill="none" stroke-dasharray="5 1.4 3 2"/>`
        + `<path d="M86.6 61L94 59.6L97 68L91 69.6Z" fill="${CUFF.half}" stroke="${CUFF.outline}" stroke-width=".35"/><path d="M90 62q4 4 2 9" stroke="${CUFF.shadow}" stroke-width=".4" fill="none"/>`
        // folds, the tear at the hip with the lining showing, the mud, the moon's rim down his front
        + `<path d="M62 100q4 20 0 40M70 120q2 20 -4 40M98 140q2 14 6 28" stroke="${COAT.outline}" stroke-width=".8" fill="none" opacity=".7"/>`
        + `<path d="M58 134l5 -2l-1 4l4 -.6l-3 5z" fill="#3a1a1a" stroke="${COAT.outline}" stroke-width=".4"/><path d="M58 134l5 -2" stroke="${COAT.lit}" stroke-width=".4"/>`
        + mud(u, [[60, 150, 8], [74, 166, 7], [100, 160, 6], [64, 112, 5], [72, 92, 4], [96, 100, 4], [92, 122, 4.4], [88, 84, 3]], 5)
        + mud(u, [[58, 160, 9], [70, 140, 6], [100, 150, 5]], 6)
        + `<path d="${H.sp([[100, 72], [104, 90], [102, 112], [104, 140], [108, 170]])}" stroke="${RIMC}" stroke-width=".8" fill="none" opacity=".55"/>`; }
    // the far epaulette over the far shoulder (tarnished), the near one torn, hanging by its threads
    const epF = `<g transform="rotate(14 96 66)"><path d="M88 67q8 -5 16 0l-1 3h-14z" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".4" opacity=".85"/>${Array.from({ length: 7 }, (_, k) => `<path d="M${89 + k * 2} 70q.4 3 .6 ${f(4 + (k % 3))}" stroke="#a8862a" stroke-width=".7" fill="none"/>`).join('')}</g>`;
    const epN = `<g transform="rotate(-38 62 74)"><path d="M56 72q7 -4 14 0l-1 3h-12z" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".4" opacity=".8"/>${Array.from({ length: 6 }, (_, k) => k === 2 ? '' : `<path d="M${57 + k * 2} 75q.4 3 .4 ${f(3 + (k % 2) * 2)}" stroke="#9a7a2a" stroke-width=".7" fill="none"/>`).join('')}</g><path d="M63 70q-2 3 -1 6" stroke="#a8862a" stroke-width=".4" fill="none"/>`;
    // the near arm: his right, from the near shoulder down to the elbow and forward to the near fist
    const nearArm = sleeve([64, 72], [74, 100], hN.wrist, 9, 1, .75);
    // the rope: from the tackle out of the frame top right down through both fists, then slack to the deck
    const v = unit([G2[0] - G1[0], G2[1] - G1[1]]);
    const rope = K.rope(u, L, [[G2[0] + v[0] * 110, G2[1] + v[1] * 110], G2, G1, [G1[0] - v[0] * 6, G1[1] - v[1] * 6], [G1[0] - 2, G1[1] + 16], [114, 140], [124, 180], [118, 212]], { r: 1.15, seed: 3 });

    // ——— the head: 3/4 to the right, looking up at the plank; his own hair tied back, unshaven, a scratch ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .6, dir: 1, nod: -8, tone: SKIN, light: [.7, -.7], warm: { color: '#dff4ea', op: .18 },
      eye: 'open', look: [.4, -.4], brow: 'frown', mouth: .15, smile: -.1, lips: '#8a5a48', iris: '#4a6a7a', hair: { style: 'tied', color: '#3a2a1e', ribbon: '#141414' }, hairColor: '#3a2a1e', beard: 'short', noseL: 1.1 });
    let face = `<path d="M76.4 56L76.6 64L86.4 64L86.6 56Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".35"/><path d="M77 59q4.6 2.4 9.4 0" stroke="${SKIN.shadow}" stroke-width=".6" fill="none" opacity=".6"/>` + hd.svg + rimArc(hd, { r: HEAD.r, light: [-.7, .7], color: RIMC, span: 40, opacity: .35 });
    { const Q = hd.Q; face += mud(u, [[...Q(.5, .1, .7), 2.4], [...Q(-.2, -.6, .8), 2]], 9) + `<path d="M${P2(Q(.62, -.2, .7))}l1.6 2.4" stroke="#8a3a2a" stroke-width=".4"/>`
      // loose strands fallen out of the tie, wet on the brow
      + `<path d="M${P2(Q(.2, -.9, .6))}q-1 4 1 7M${P2(Q(.35, -.85, .55))}q.4 4 2.4 6" stroke="#2a1e14" stroke-width=".5" fill="none"/>`; }

    // ——— assemble: legs, far arm and coat, the far fist's back; near arm; rope; the fists' fronts; head; epaulettes ———
    man += hF.back + epF + face + nearArm + epN + hN.back + rope + hF.front + hN.front;
    { for (const h of [hF, hN]) { const k = h.P(4.6, -.4, .2); man += glow(u, k[0], k[1], 7, 6, '#dff4ea', .18); } }
    // he leans back on the rope: the whole figure turned 3° about his feet
    let fg = cask + `<g transform="rotate(-3 86 216)">${man}</g>`;
    // ——— light and air: the moon's veil, fog drifting over the deck, the under-glass dark ———
    fg += glow(u, 150, 60, 70, 60, '#cff8e8', .1) + motes(20, 0, 20, 200, 120, '#dffff0', 5) + K.fog(u, L, { y: 170, h: 60, density: .4, seed: 12 })
      + gloom(u, 100, 140, 100, 280, .5, '#020806') + gloom(u, 100, 100, -20, 40, .2, '#020806');
    return [bg, fg];
  } };
