// «Кракен» (Голландец, Легенда, ПРИКАЗ: потратьте 3 Души — вражескому кораблю 4 урона по Корпусу и 2 по Команде).
// Night in the green fog. The monster has the enemy ship: one huge arm rises out of the sea on the left, higher than
// her masts, and comes down on her bow; another loops round her waist, over the rail and down her near side; a
// third climbs out of the water on the right and coils round her mizzen. She lists towards us, her deck tipped up;
// her men are flung off it into the air. In the foreground, low in the water, the beast's eye watches. The moon
// behind the fog over the ship is the only light: the arms and the rigging stand against the glow, edged in pale
// green; the eye glows on its own.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, lerp, nid, linGrad, radGrad, rng } = K;
const { glow, gloom, motes } = PK;

const HZ = 74;
const SHIP = { kind: 'revenge', x: 116, y: 100, scale: .66, roll: 13, heel: 5, seed: 7 };
const EYE = { x: 46, y: 104, w: 21 };
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 124, y: 38, color: '#d4f4e4', power: .8 }, fill: { color: '#2f5a50', power: .45 },
  rim: { az: 10, color: '#d8fff0', power: .55 }, locals: [{ x: EYE.x, y: EYE.y, color: '#d8ff80', power: .5, radius: 26 }] };
const skel = { horizon: HZ, eye: 1.5, light: 'the moon behind the fog, behind the ship (back light) + the glow of the eye', items: [
  ['ship', 62, 100, 100, 64, 'water, listing towards us'], ['arm L', 0, 128, 96, 100, 'out of the sea left, down on her bow'],
  ['arm M', 92, 104, 50, 50, 'loops round her waist over the rail'], ['arm R', 146, 116, 54, 84, 'out of the sea right, coiled round the mizzen'],
  ['eye', 28, 112, 38, 16, 'in the water, foreground'], ['men', 60, 70, 90, 40, 'in the air, flung off the deck'], ['tips', 0, 92, 40, 20, 'small arms out of the far sea']] };

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

module.exports = { name: 'Кракен', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.5 });
    // the sky: green fog, the moon behind it over the ship, torn cloud
    let bg = K.sky(u, L, { horizon: HZ, stars: 14, seed: 5 }) + K.sunMoon(u, L, { r: 8 });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 70, 9, 3, .3], [178, 52, 56, 7, 8, .45], [70, 62, 60, 6, 11, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += glow(u, 124, 40, 90, 60, '#bff8e0', .22);
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 9, glitter: 124 });
    // small arms out of the far sea: the beast is bigger than we see
    bg += tentacle(u, [[6, 86], [4, 74], [12, 66], [18, 70], [15, 74]], [5, 3.6, 2.4, 1.4, .6], { lit: -1, seed: 2, step: 3, blur: .6, rimW: .4 })
      + tentacle(u, [[180, 84], [184, 72], [178, 66], [174, 70]], [4, 3, 1.6, .6], { lit: 1, seed: 4, step: 3, blur: .6, rimW: .4 });
    bg += K.fog(u, L, { y: HZ - 14, h: 26, density: .6, seed: 3 });
    // the arm on the right: out of the sea behind her stern, up and round the mizzen (behind her hull, over her sails)
    const armR = [[188, 112], [192, 84], [186, 58], [170, 40], [152, 40], [146, 50], [154, 56], [160, 50], [156, 46]], wR = [20, 18, 15, 12, 9, 7, 5, 3, 1.2];
    // the arm round her waist: rising behind her far side, over the rail, down her near side into the sea
    const armM = [[140, 82], [134, 60], [122, 50], [108, 54], [102, 70], [100, 88], [96, 104]], wM = [15, 15, 14, 13, 13, 12, 11];
    let mid = tentacle(u, armM, wM, { lit: 1, to: .44, seed: 5 });
    // the ship, listing towards us under the weight, foam boiling round her
    const ship = K.ship(u, L, { ...SHIP, detail: 'mid', wake: false, lights: true });
    mid += ship + K.foam(u, { x: SHIP.x, y: SHIP.y + 1, w: 110, h: 4, seed: 4, L });
    mid += tentacle(u, armR, wR, { lit: 1, seed: 6 });
    mid += tentacle(u, armM, wM, { lit: 1, from: .42, seed: 5 });
    mid += K.splash(u, { x: 96, y: 104, w: 18, h: 12, seed: 4, L, wind: -.4 }) + K.splash(u, { x: 188, y: 110, w: 20, h: 14, seed: 1, L, wind: .3 });
    // her men flung off the tipped deck into the air
    mid += flung(84, 50, 1.1, -40, 1) + flung(136, 30, 1, 70, 2) + flung(72, 72, 1, 150, 3) + flung(170, 76, .9, -100, 4);
    // the great arm on the left: out of the sea at the left edge, up over her bowsprit, down on her bow
    const armL = [[14, 132], [8, 96], [12, 60], [30, 34], [56, 26], [76, 34], [82, 50], [78, 64], [70, 66], [68, 58], [73, 56]], wL = [34, 32, 28, 23, 18, 14, 11, 8, 5, 3, 1.2];
    let fg = tentacle(u, armL, wL, { lit: -1, seed: 8, blur: 1.6, rimW: 1.1 });
    fg += K.splash(u, { x: 16, y: 120, w: 30, h: 18, seed: 2, L, wind: -.3 });
    // spray and splinters where the arm comes down on her bow
    { const R = rng(9); for (let i = 0; i < 18; i++) { const a = -Math.PI * (.1 + R() * .8), d = 4 + R() * 14, x = 76 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * .7, l = 1 + R() * 2.2, r = R() * Math.PI;
      fg += i % 2 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.3 + R() * .5)}" fill="#e0fff0" opacity=".8"/>` : `<path d="M${f(x)} ${f(y)}l${f(Math.cos(r) * l)} ${f(Math.sin(r) * l)}" stroke="#a88a5a" stroke-width=".55" stroke-linecap="round"/>`; } }
    // the eye: a low hump of the beast's head awash in the foreground — bumpy, mottled skin edged by the moon —
    // a heavy lid half up over the glowing eye with its slit pupil; the sea closes over the hump's foot
    { const e = EYE, w = e.w, dm = nid('dm', u), ir = nid('ir', u), wt = nid('wt', u), R = rng(31);
      const hump = [[e.x - 40, e.y + 7], [e.x - 30, e.y - 1], [e.x - 20, e.y - 7], [e.x - 9, e.y - 12], [e.x + 4, e.y - 14], [e.x + 17, e.y - 11], [e.x + 28, e.y - 5], [e.x + 40, e.y + 7]];
      const sm = pts => { let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (let k = 1; k < pts.length; k++) { const p = pts[k - 1], q = pts[k]; d += `Q${f((p[0] + q[0]) / 2 + (R() - .5) * 3)} ${f(Math.min(p[1], q[1]) - 2.4)} ${f(q[0])} ${f(q[1])}`; } return d; };
      const top = sm(hump);
      fg += `<defs>${radGrad(dm, e.x + 8, e.y - 14, 46, [[0, '#56745e', 1], [.45, '#2a4034', 1], [1, '#0e1a14', 1]])}${radGrad(ir, e.x, e.y - 1, w * .42, [[0, '#fbffb8', 1], [.4, '#d0f060', 1], [.8, '#5a9a30', 1], [1, '#1a3a10', 1]])}`
        + `${radGrad(wt, e.x, e.y + 8, 52, [[0, '#183630', .95], [.6, '#1c3a34', .85], [1, '#1c3a34', 0]])}</defs>`
        + `<path d="${top}V${e.y + 12}H${e.x - 40}Z" fill="url(#${dm})"/>`;
      // mottled skin and warts
      for (let k = 0; k < 26; k++) { const x = e.x - 34 + R() * 68, y = e.y - 8 + R() * 14, r = .6 + R() * 1.8; fg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.4)}" ry="${f(r)}" fill="${R() > .45 ? '#0e1a14' : '#7a9a80'}" opacity="${f(.2 + R() * .3)}"/>`; }
      fg += `<path d="${top}" fill="none" stroke="#d8fff0" stroke-width="1" opacity=".6"/><path d="${top}" fill="none" stroke="#08120c" stroke-width=".5" transform="translate(0 .9)" opacity=".5"/>`;
      // folds of skin round the socket
      for (const [k, op] of [[1.3, .7], [1.65, .5], [2, .35]]) fg += `<path d="M${f(e.x - w * .52 * k)} ${f(e.y + 1.5)}Q${e.x} ${f(e.y - 8.5 * k)} ${f(e.x + w * .52 * k)} ${f(e.y + 1.5)}" stroke="#0a140e" stroke-width=".7" fill="none" opacity="${op}"/><path d="M${f(e.x - w * .5 * k)} ${f(e.y + .6)}Q${e.x} ${f(e.y - 9.4 * k)} ${f(e.x + w * .5 * k)} ${f(e.y + .6)}" stroke="#8ab89a" stroke-width=".35" fill="none" opacity="${f(op * .6)}"/>`;
      // the eye itself: the glow first, then the iris, the slit, the wet glint, the heavy upper lid
      fg += K.localGlow(u, { x: e.x, y: e.y - 1, color: '#d8ff80', power: .75, radius: 24 }, { squash: .65 })
        + `<path d="M${f(e.x - w * .55)} ${e.y}Q${e.x} ${e.y - 10} ${f(e.x + w * .55)} ${e.y}Q${e.x} ${e.y + 4.6} ${f(e.x - w * .55)} ${e.y}Z" fill="url(#${ir})" stroke="#0a1408" stroke-width=".6"/>`
        + `<path d="M${e.x - 1.1} ${e.y - 6.6}Q${e.x - 2.6} ${e.y - 1.6} ${e.x - 1.1} ${e.y + 3}H${e.x + 1.1}Q${e.x + 2.6} ${e.y - 1.6} ${e.x + 1.1} ${e.y - 6.6}Z" fill="#050805"/>`
        + `<ellipse cx="${e.x + 4.2}" cy="${e.y - 4}" rx="1.7" ry=".9" fill="#ffffff" opacity=".9"/><circle cx="${e.x - 5}" cy="${e.y + 1}" r=".5" fill="#ffffff" opacity=".6"/>`
        + `<path d="M${f(e.x - w * .62)} ${e.y + .4}Q${e.x - 2} ${e.y - 11.6} ${f(e.x + w * .62)} ${e.y - .2}Q${e.x} ${e.y - 7.4} ${f(e.x - w * .62)} ${e.y + .4}Z" fill="#1a2a20" stroke="#060c08" stroke-width=".5"/>`
        + `<path d="M${f(e.x - w * .5)} ${e.y - 3}Q${e.x - 2} ${e.y - 11.4} ${f(e.x + w * .5)} ${e.y - 3.4}" stroke="#a8d8b8" stroke-width=".45" fill="none" opacity=".6"/>`;
      // the sea over the hump's foot: soft at the sides (no edge), foam where the skin breaks the surface, the
      // eye's light on the ripples
      fg += `<path d="M${e.x - 60} ${e.y + 5}Q${e.x - 30} ${e.y + 2.6} ${e.x} ${e.y + 4.2}T${e.x + 60} ${e.y + 4}V${e.y + 30}H${e.x - 60}Z" fill="url(#${wt})"/>`
        + K.foam(u, { x: e.x, y: e.y + 4.4, w: 78, h: 2.4, seed: 6, L })
        + [1.6, 2.4].map((k, i) => `<ellipse cx="${e.x}" cy="${e.y + 7 + i * 3}" rx="${f(w * k)}" ry="${f(1.5 + i)}" fill="none" stroke="#d8ff80" stroke-width=".5" opacity="${f(.4 - i * .14)}"/>`).join(''); }
    // the fog over it all, the moon's veil, motes; dark below (under the glass)
    fg += K.fog(u, L, { y: 108, h: 40, density: .4, seed: 12 }) + motes(30, 10, 20, 180, 100, '#dffff0', 9);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 122, 0, 280, [[0, '#040a08', 0], [.3, '#040a08', .5], [1, '#020504', .85]])}</defs><rect x="-10" y="122" width="220" height="170" fill="url(#${gl})"/>`; }
    return [bg + mid, fg];
  } };
