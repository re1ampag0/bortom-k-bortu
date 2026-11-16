// «Кракен» (Голландец, Легенда, ПРИКАЗ: потратьте 3 Души — вражескому кораблю 4 урона по Корпусу и 2 по Команде).
// A poster, from low on the water at night. The beast rises out of the sea behind the enemy ship — its head a hill
// of wet skin higher than her masts, the moon hidden behind its crown: a blazing rim of pale green light runs round
// the dome and god rays fan out from behind it through the mist. Two great glowing eyes, one either side of her,
// with the long bar pupils of an octopus, look straight at us. Two arms, thicker than her hull, come up out of the
// near sea at both edges, arch high over her like a gate and come down on her bow and her quarter, over the rail and
// down her near side into the water (under her keel): the hull cracks and splinters under them, her men are flung
// off the deck. The sea boils and turns round her in rings of foam; spray streams off the arms.
// Own design: a cephalopod's head with two eyes and bar pupils; no mouth or teeth shown, no fire.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, lerp, nid, linGrad, radGrad, rng } = K;
const { glow, gloom, motes, shafts, blurF } = PK;

const HZ = 106;
const SHIP = { kind: 'revenge', x: 100, y: 118, scale: .6, roll: 10, heel: 4, seed: 7 };
const MOON = { x: 140, y: 40 };
const EYES = [{ x: 38, y: 90, w: 24 }, { x: 162, y: 88, w: 24 }];
const light = { time: 'night', haze: .6, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#d8f8e8', power: .85 }, fill: { color: '#24443c', power: .45 },
  rim: { az: 10, color: '#e0fff2', power: .8 }, locals: EYES.map(e => ({ x: e.x, y: e.y, color: '#d8ff80', power: .45, radius: 30 })) };
const skel = { horizon: HZ, eye: 4, light: 'the moon behind the beast's crown (back light: rims toward it, the near sides dark) + the glow of its eyes', items: [
  ['head', 12, HZ + 3, 178, 80, 'sea, behind the ship (it rises out of the water)', 0, { bg: 1 }], ['ship', 54, SHIP.y, 90, 57, 'sea, in front of the head'],
  ['arm L', 0, 142, 80, 110, 'out of the near sea at the left edge, arched over, down on her bow and into the water under her', 0, { edge: 1 }],
  ['arm R', 120, 142, 80, 110, 'out of the near sea at the right edge, arched over, down on her quarter and into the water under her', 0, { edge: 1 }],
  ['men', 84, 76, 50, 24, 'in the air, flung off the deck']] };

// ——— KIT-CANDIDATE: a tentacle along a smooth spine C with widths W: the body shaded across (pale green rim on the lit
// side, the dark under side), mottled skin, the suckers along the under side (pale rings with dark mouths, smaller
// to the tip). lit: +1 | -1 — which edge faces the light. o.from, o.to: the share of the spine to draw (for parts that
// go behind and in front of something).
const TS = { lit: '#62866a', half: '#324c3e', shadow: '#1a2a22', outline: '#08120c', rim: '#c8ffe4', sucker: '#c8b8a4', mouth: '#4a2a28' };
function tentacle(u, C, W, o = {}) {
  const T = H.tube(C, W, 10), lit = o.lit || 1, i0 = Math.round((o.from || 0) * T.N), i1 = Math.round((o.to != null ? o.to : 1) * T.N), R = rng(o.seed || 3);
  const band = (a, b) => { const A = T.edge(a * lit, i0, i1), B = T.edge(b * lit, i0, i1).reverse(); return 'M' + [...A, ...B].map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'; };
  const out0 = T.outline(i0, i1, 1, false, i1 === T.N), d = 'M' + out0.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', cid = nid('tc', u), bl = nid('tb', u);
  let s = `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(o.blur || 1.2)}"/></filter></defs>`;
  s += `<path d="${d}" fill="${TS.half}"/><g clip-path="url(#${cid})"><g filter="url(#${bl})">`
    + `<path d="${band(.15, 1.3)}" fill="${TS.shadow}" opacity=".85"/><path d="${band(-1.3, -.35)}" fill="${TS.lit}" opacity=".9"/><path d="${band(-.95, -.6)}" fill="${mix(TS.lit, TS.rim, .4)}" opacity=".7"/></g>`;
  // mottled skin: darker spots and pale flecks along the body
  for (let i = i0 + 2; i < i1 - 1; i += 2) { const q = T.S[i]; if (q.w < 2.5) continue; const p = T.at(i, (R() - .5) * 1.2), r = q.w * (.06 + R() * .08);
    s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r * 1.6)}" ry="${f(r)}" transform="rotate(${f(Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI)} ${f(p[0])} ${f(p[1])})" fill="${R() > .5 ? '#14201a' : '#7a9a80'}" opacity="${f(.25 + R() * .25)}"/>`; }
  // a crease line along the spine and the under side
  s += `<path d="M${T.edge(.55 * lit, i0, i1).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="${TS.outline}" stroke-width="${f(Math.max(.3, W[0] * .02))}" fill="none" opacity=".5"/></g>`;
  // the rim of moonlight on the lit edge
  s += `<path d="M${T.edge(-.97 * lit, i0, i1).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="${TS.rim}" stroke-width="${f(o.rimW || .8)}" fill="none" opacity=".75" stroke-linecap="round"/>`;
  s += `<path d="${d}" fill="none" stroke="${TS.outline}" stroke-width=".45" opacity=".8"/>`;
  // suckers along the under side
  if (o.suckers !== false) for (let i = i0 + 1; i < i1; i += (o.step || 2)) { const q = T.S[i]; if (q.w < 1.6) continue; const p = T.at(i, .74 * lit), r = q.w * .16, a = Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI;
    s += `<g transform="translate(${f(p[0])} ${f(p[1])}) rotate(${f(a)})"><ellipse rx="${f(r * 1.15)}" ry="${f(r * .8)}" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".25"/><ellipse cx="${f(r * .1)}" rx="${f(r * .55)}" ry="${f(r * .36)}" fill="${TS.mouth}"/><path d="M${f(-r)} ${f(-r * .5)}q${f(r)} ${f(-r * .5)} ${f(r * 2)} 0" stroke="#f4ece0" stroke-width="${f(r * .2)}" fill="none" opacity=".6"/></g>`; }
  return s;
}
// a sailor flung through the air: a small dark contour (body, head, flailing arms and legs), the moon on his edge
function flung(x, y, s, a, seed) {
  const R = rng(seed), lim = (x0, y0, ang, l) => [x0 + Math.cos(ang) * l, y0 + Math.sin(ang) * l];
  const nk = [0, -2.2], hp = [0, 1.4], ar1 = lim(...nk, -2.4 + R() * .6, 2.6), ar2 = lim(...nk, -.6 - R() * .6, 2.6), lg1 = lim(...hp, 1.9 + R() * .4, 3.2), lg2 = lim(...hp, .9 + R() * .5, 3.2);
  const ln = (p, q, w) => `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="#0a120e" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">` + ln(nk, hp, 1.5) + ln(nk, ar1, .75) + ln(ar1, lim(...ar1, -1.2, 1.6), .6) + ln(nk, ar2, .75) + ln(ar2, lim(...ar2, .4, 1.6), .6)
    + ln(hp, lg1, .9) + ln(lg1, lim(...lg1, 1.2, 2), .75) + ln(hp, lg2, .9) + ln(lg2, lim(...lg2, 2.2, 2), .75)
    + `<circle cx="0" cy="-3.3" r="1.05" fill="#0a120e"/><path d="M.9 -3.6a1 1 0 0 1 -.2 1.4M.6 -2L.7 1.4" stroke="#c8ffe4" stroke-width=".3" fill="none" opacity=".7"/></g>`;
}

// a smooth closed or open path through points (quadratic curves through the midpoints)
const smooth = (P, close) => { let d = `M${f(P[0][0])} ${f(P[0][1])}`; for (let i = 1; i < P.length - 1; i++) { const m = [(P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2]; d += `Q${f(P[i][0])} ${f(P[i][1])} ${f(m[0])} ${f(m[1])}`; } const q = P[P.length - 1]; return d + `L${f(q[0])} ${f(q[1])}` + (close ? 'Z' : ''); };

// the beast's head: a hill of wet skin out of the sea, its crown leaning back to the right; dark against the moon,
// the rim blazing along the crown and fading down the flanks; ridges and folds, warts and old scars, barnacles at the
// waterline; two eyes with heavy lids and bar pupils, glowing
function beastHead(u, L) {
  const C = [[6, HZ + 4], [10, 98], [14, 86], [20, 74], [28, 62], [38, 52], [52, 42], [70, 34], [92, 29], [114, 28], [134, 32], [152, 40], [166, 52], [176, 66], [184, 80], [190, 94], [194, HZ + 4]];
  const top = smooth(C), d = top + 'Z', id = nid('bh', u), cl = nid('bc', u), bl = nid('bb', u), rg = nid('br', u), sh = nid('bs', u);
  const R = rng(41);
  let s = `<defs>${linGrad(id, 0, 28, 0, HZ + 4, [[0, '#2c4a42', 1], [.35, '#18302a', 1], [1, '#0a1612', 1]])}${radGrad(rg, MOON.x - 6, MOON.y + 4, 70, [[0, '#6a9a88', .55], [.5, '#3a6056', .22], [1, '#3a6056', 0]])}`
    + `<clipPath id="${cl}"><path d="${d}"/></clipPath>${blurF(bl, 1.6)}${blurF(sh, .7)}</defs>`;
  s += `<path d="${d}" fill="url(#${id})"/><g clip-path="url(#${cl})"><rect x="0" y="0" width="200" height="${HZ + 6}" fill="url(#${rg})"/>`;
  // the inner glow under the rim: the moonlight through the thin skin of the crown
  s += `<path d="${top}" stroke="#7ab8a0" stroke-width="9" fill="none" opacity=".35" filter="url(#${bl})"/>`;
  // ridges: long folds sweeping up from over the eyes to the crown, each a dark groove with a pale upper lip
  const ridges = [[[22, 84], [34, 66], [52, 52], [76, 44], [100, 40]], [[30, 92], [46, 76], [66, 62], [92, 54], [120, 50], [146, 54]], [[176, 84], [164, 66], [146, 52], [124, 44], [104, 40]],
    [[168, 92], [150, 76], [130, 64], [108, 58], [86, 60]], [[60, 40], [84, 36], [110, 35], [136, 40], [156, 50]]];
  ridges.forEach((r, i) => { const p = smooth(r); s += `<path d="${p}" stroke="#060e0a" stroke-width="${f(1.8 - i * .15)}" fill="none" opacity=".55" filter="url(#${sh})"/><path d="${p}" stroke="#8ec8b0" stroke-width=".5" fill="none" opacity=".35" transform="translate(0 -1.2)"/>`; });
  // the skin: mottled patches, warts with a lit top, a few long pale scars
  for (let k = 0; k < 90; k++) { const x = 10 + R() * 180, y = 30 + R() * 76, r = .5 + R() * 2.2;
    s += R() > .5 ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.6)}" ry="${f(r)}" fill="${R() > .5 ? '#050c09' : '#4a7466'}" opacity="${f(.2 + R() * .3)}"/>`
      : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .55)}" fill="#0c1814"/><path d="M${f(x - r * .5)} ${f(y - r * .1)}a${f(r * .5)} ${f(r * .5)} 0 0 1 ${f(r)} 0" stroke="#9ad0b8" stroke-width=".3" fill="none" opacity=".55"/>`; }
  for (const sc of [[[56, 58], [70, 52], [82, 50]], [[132, 64], [142, 58], [150, 56]], [[96, 34], [104, 38], [110, 44]]]) s += `<path d="${smooth(sc)}" stroke="#a8d8c4" stroke-width=".55" fill="none" opacity=".4"/>`;
  // barnacles and weed along the waterline
  for (let k = 0; k < 40; k++) { const x = 8 + R() * 184, y = HZ - 6 + R() * 9, r = .5 + R();
    s += `<path d="M${f(x - r)} ${f(y)}L${f(x - r * .4)} ${f(y - r * 1.2)}H${f(x + r * .4)}L${f(x + r)} ${f(y)}Z" fill="#6a7e70" opacity=".7"/><ellipse cx="${f(x)}" cy="${f(y - r * 1.2)}" rx="${f(r * .4)}" ry="${f(r * .15)}" fill="#0a1410"/>`; }
  s += `</g>`;
  // the rim: the moon blazing round the crown — wide soft glow, then a hard bright edge, fading down the flanks
  const rimM = nid('rm', u);
  s += `<defs>${radGrad(rimM, MOON.x, MOON.y, 120, [[0, '#ffffff', 1], [.55, '#ffffff', .55], [1, '#ffffff', 0]])}<mask id="${rimM}m" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="280"><rect width="200" height="280" fill="url(#${rimM})"/></mask></defs>`
    + `<g mask="url(#${rimM}m)"><path d="${top}" stroke="#d8fff0" stroke-width="5" fill="none" opacity=".45" filter="url(#${bl})"/><path d="${top}" stroke="#f0fff8" stroke-width="1.3" fill="none"/></g>`;
  // the eyes
  EYES.forEach((e, i) => { const w = e.w, ir = nid('ei', u), sk = i ? -1 : 1;
    // the socket: a heavy fold of skin round it, the brow over it catching the rim
    s += `<ellipse cx="${e.x}" cy="${e.y}" rx="${f(w * .78)}" ry="${f(w * .5)}" fill="#08120e" opacity=".75" filter="url(#${sh})"/>`
      + `<path d="M${f(e.x - w * .8)} ${f(e.y - 1)}Q${f(e.x)} ${f(e.y - w * .78)} ${f(e.x + w * .8)} ${f(e.y - 2)}" stroke="#7ab8a0" stroke-width=".8" fill="none" opacity=".5"/>`
      + glow(u, e.x, e.y, w * 1.5, w * 1.1, '#c8ff70', .55)
      + `<defs>${radGrad(ir, e.x - sk * 1.5, e.y - 1, w * .5, [[0, '#fbffc8', 1], [.35, '#e0f870', 1], [.75, '#7ab830', 1], [1, '#20400e', 1]])}</defs>`
      + `<path d="M${f(e.x - w * .52)} ${f(e.y + .5)}Q${f(e.x)} ${f(e.y - w * .42)} ${f(e.x + w * .52)} ${f(e.y - .5)}Q${f(e.x)} ${f(e.y + w * .3)} ${f(e.x - w * .52)} ${f(e.y + .5)}Z" fill="url(#${ir})" stroke="#060c04" stroke-width=".6"/>`
      // the bar pupil: a long horizontal slot, a little pinched in the middle
      + `<path d="M${f(e.x - w * .3)} ${f(e.y - 2.4)}Q${f(e.x)} ${f(e.y - 1.4)} ${f(e.x + w * .3)} ${f(e.y - 2.6)}Q${f(e.x + w * .36)} ${f(e.y - .6)} ${f(e.x + w * .3)} ${f(e.y + 1.4)}Q${f(e.x)} ${f(e.y + .6)} ${f(e.x - w * .3)} ${f(e.y + 1.6)}Q${f(e.x - w * .36)} ${f(e.y - .4)} ${f(e.x - w * .3)} ${f(e.y - 2.4)}Z" fill="#030503"/>`
      + `<ellipse cx="${f(e.x + w * .16)}" cy="${f(e.y - 3.6)}" rx="1.8" ry=".8" fill="#ffffff" opacity=".9"/>`
      // the heavy upper lid, half down, its edge wet
      + `<path d="M${f(e.x - w * .6)} ${f(e.y + .6)}Q${f(e.x)} ${f(e.y - w * .66)} ${f(e.x + w * .6)} ${f(e.y - .6)}Q${f(e.x)} ${f(e.y - w * .3)} ${f(e.x - w * .6)} ${f(e.y + .6)}Z" fill="#14261e" stroke="#040806" stroke-width=".5"/>`
      + `<path d="M${f(e.x - w * .5)} ${f(e.y - 1.6)}Q${f(e.x)} ${f(e.y - w * .34)} ${f(e.x + w * .5)} ${f(e.y - 2.4)}" stroke="#b8f0d0" stroke-width=".45" fill="none" opacity=".6"/>`
      // the lower lid fold
      + `<path d="M${f(e.x - w * .5)} ${f(e.y + 1.4)}Q${f(e.x)} ${f(e.y + w * .36)} ${f(e.x + w * .5)} ${f(e.y + .6)}" stroke="#040806" stroke-width=".9" fill="none" opacity=".8"/>`; });
  return s;
}

module.exports = { name: 'Кракен', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    // the sky: night, the moon low behind the beast's crown, its halo and the god rays fanning out from behind it
    let bg = K.sky(u, L, { horizon: HZ, stars: 40, seed: 5 }) + K.sunMoon(u, L, { r: 10 });
    for (const [x, y, w, h, sd, fr] of [[40, 22, 70, 8, 3, .3], [176, 30, 50, 6, 8, .4]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += glow(u, MOON.x, MOON.y, 120, 90, '#bff8e0', .4);
    bg += shafts(u, MOON.x, MOON.y, [[-20, -10, -30, 20], [0, -40, 30, -40], [60, -40, 90, -40], [170, -40, 200, -40], [240, -20, 240, 10], [240, 50, 240, 80], [-40, 50, -40, 80]], '#d8fff0', .28);
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .7, seed: 9, glitter: MOON.x });
    bg += beastHead(u, L);
    // where the head comes out of the sea: foam, and the mist over the water
    bg += K.foam(u, { x: 100, y: HZ + 3.6, w: 190, h: 2.4, seed: 3, L }) + K.fog(u, L, { y: HZ - 10, h: 18, density: .45, seed: 3 });
    let mid = '';
    // the sea turning round her: broken rings of foam in perspective, streaks
    { const R = rng(13); for (let k = 0; k < 4; k++) { const rx = 56 + k * 14, ry = 3.6 + k * 1.6, cy = SHIP.y + 1 + k * .8;
      for (let j = 0; j < 7; j++) { const a0 = R() * Math.PI * 2, a1 = a0 + .4 + R() * .7, p = a => [100 + Math.cos(a) * rx, cy + Math.sin(a) * ry];
        const A = p(a0), B = p(a1); mid += `<path d="M${f(A[0])} ${f(A[1])}A${f(rx)} ${f(ry)} 0 0 1 ${f(B[0])} ${f(B[1])}" stroke="#d8fff0" stroke-width="${f(.5 + R() * .7)}" fill="none" opacity="${f(.35 + R() * .3)}" stroke-linecap="round"/>`; } } }
    mid += K.ship(u, L, { ...SHIP, detail: 'mid', wake: false, lights: true }) + K.foam(u, { x: SHIP.x, y: SHIP.y + 1, w: 100, h: 3.4, seed: 4, L });
    // her men flung off the deck by the blow
    mid += flung(90, 74, 1, -30, 1) + flung(112, 62, .95, 60, 2) + flung(138, 84, .9, 160, 3);
    // the two arms: out of the near sea at the edges, arched high over her, down on her bow and her quarter, over the
    // rail and down her near side into the water (they go on under her keel)
    const armL = [[0, 146], [6, 116], [10, 90], [16, 66], [28, 48], [44, 38], [60, 38], [70, 46], [75, 60], [77, 76], [78, 92], [77.5, 104], [76.5, 113], [76, 121]], wL = [30, 28, 25, 22, 19, 16, 14, 12.5, 11, 10, 9.5, 9, 8.6, 8];
    const armR = [[200, 146], [194, 116], [190, 90], [184, 66], [172, 48], [156, 38], [140, 38], [130, 46], [126, 60], [125, 76], [125, 92], [125.5, 104], [126, 113], [126.5, 121]], wR = [30, 28, 25, 22, 19, 16, 14, 12.5, 11, 10, 9.5, 9, 8.6, 8];
    let fg = tentacle(u, armL, wL, { lit: -1, seed: 8, blur: 1.6, rimW: 1.2 }) + tentacle(u, armR, wR, { lit: 1, seed: 6, blur: 1.6, rimW: 1.2 });
    // where they bite: the rail smashed, the planks of her side cracked under each arm, splinters and spray
    for (const [hx, hy, sd] of [[77, 104, 9], [125.5, 106, 17]]) { const R = rng(sd);
      fg += `<path d="M${f(hx - 8)} ${f(hy + 1)}L${f(hx - 6.5)} ${f(hy - .6)}L${f(hx - 5.4)} ${f(hy + 1.6)}M${f(hx + 5.2)} ${f(hy + 1.2)}L${f(hx + 6.6)} ${f(hy - .8)}L${f(hx + 8)} ${f(hy + 1.4)}" stroke="#050403" stroke-width=".8" fill="none"/>`
        + `<path d="M${f(hx - 6.5)} ${f(hy - .6)}l-.6 -2.4M${f(hx + 6.6)} ${f(hy - .8)}l.8 -2.6" stroke="#d8b07a" stroke-width=".5" stroke-linecap="round"/>`;
      for (let i = 0; i < 16; i++) { const a = -Math.PI * (.05 + R() * .9), dd = 5 + R() * 12, x = hx + Math.cos(a) * dd, y = hy - 4 + Math.sin(a) * dd * .8, l = .8 + R() * 1.8, r = R() * Math.PI;
        fg += i % 3 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.25 + R() * .45)}" fill="#e0fff0" opacity=".8"/>` : `<path d="M${f(x)} ${f(y)}l${f(Math.cos(r) * l)} ${f(Math.sin(r) * l)}" stroke="#b08a5a" stroke-width=".5" stroke-linecap="round"/>`; }
      fg += K.splash(u, { x: hx, y: SHIP.y + 1, w: 16, h: 12, seed: sd, L, wind: 0 }); }
    // the arms come up out of the sea in a burst of spray; the water streams off them
    fg += K.splash(u, { x: 12, y: 132, w: 34, h: 20, seed: 2, L, wind: -.3 }) + K.splash(u, { x: 188, y: 132, w: 34, h: 20, seed: 1, L, wind: .3 });
    { const R = rng(29); for (const [C, sgn] of [[armL, 1], [armR, -1]]) for (let i = 0; i < 26; i++) { const k = 1 + Math.floor(R() * 6), p = C[k], x = p[0] + sgn * (6 + R() * 8), y = p[1] + R() * 10;
      fg += `<path d="M${f(x)} ${f(y)}l${f(sgn * .2)} ${f(1.4 + R() * 2)}" stroke="#d8fff0" stroke-width="${f(.3 + R() * .3)}" stroke-linecap="round" opacity="${f(.4 + R() * .4)}"/>`; } }
    fg += motes(30, 10, 30, 180, 90, '#dffff0', 9);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 128, 0, 280, [[0, '#040a08', 0], [.3, '#040a08', .5], [1, '#020504', .85]])}</defs><rect x="-10" y="128" width="220" height="170" fill="url(#${gl})"/>`; }
    return [bg + mid, fg];
  } };
