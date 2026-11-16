// «Джек ускользает» (Жемчужина, Легенда, РЕАКЦИЯ: когда «Жемчужина» должна утонуть — её Корпус 2, и Пираты меняют
// корабли местами). A poster: the camera low at the waterline, the Black Pearl huge across the upper half, almost
// sunk — down by the stern, heeled towards us, the sea over her quarter rail and on her deck — yet every rag of sail
// drawing, her bow up and throwing spray at us: she is running out of the trap to the right. The waning moon stands
// behind her stern, over the trap: her torn sails glow through and are edged with its light, rays fan out through the
// gun smoke and over her, the moon's path runs through the splashes where she was. Behind her on the left the trap: a wall of gun smoke on the horizon, the enemies' broadsides flashing in
// it (the Endeavour on the left, the Dutchman behind), a grove of shot splashes on the empty spot where she was and
// her wake running out of it. No fire on any ship: only the muzzle flashes.
'use strict';
const K = require('../kit/index.cjs');
const { f, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 104;
const MOON = { x: 30, y: 60 };
const SPOT = { x: 34, y: 112 };     // where she was: the converging fire falls here
const WL = 124;                     // the kit's waterline of the Pearl
const SINK = 118.6;                 // the sea's level on her: 5.4 units over the kit's waterline — down to her lower ports
const light = { time: 'night', haze: .4, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#d4e2ff', power: .95 }, fill: { color: '#3a5280', power: .42 },
  rim: { az: -30, color: '#d8ecff', power: .85 }, locals: [{ x: 14, y: 100, color: '#ffb050', power: .45, radius: 24 }] };
const PEARL = { kind: 'pearl', x: 110, y: WL, scale: 1.03, flip: true, roll: 18, heel: -8, sails: 'full', wake: true, lights: true, detail: 'near', seed: 4, wind: 1 };
const ENDV = { kind: 'endeavour', x: 6, y: 108, scale: .3, flip: true, sails: 'reefed', detail: 'mid', lights: true, seed: 2 };
const DUTCH = { kind: 'dutch', x: 52, y: 105.6, scale: .16, sails: 'reefed', detail: 'far', lights: true, seed: 5 };
const skel = { horizon: HZ, eye: 1, light: 'the full moon low behind the Pearl\'s stern, over the trap (back light from the left): her sails glow through and are edged, rays fan out through the smoke; gun flashes on the left',
  items: [
    ['pearl', 38, WL, 170, 104, 'water: heeled 18° to us, down by the stern 8° (the bow up), sunk 5.4 units deeper (the sea at SINK), the sea over her quarter rail, running right'],
    ['endeavour', -18, ENDV.y, 44, 29, 'water, far left in the smoke, broadside firing'],
    ['dutchman', 40, DUTCH.y, 24, 13, 'water, far behind the spot, in the smoke, firing'],
    ['splashes', 14, 116, 42, 26, 'water: the empty spot'],
    ['wake', 40, 122, 30, 10, 'water: from the spot to her stern'],
    ['spray', 168, 120, 40, 40, 'her bow wave, thrown at us and to the right', { edge: 1 }],
  ] };

module.exports = { name: 'Джек ускользает', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 60, seed: 8, clear: 30 });
    // a wide cold bloom round the moon, then the disc
    bg += K.localGlow(u, { x: MOON.x, y: MOON.y, color: '#9ab8ff', power: .5, radius: 110 }, { core: false }) + K.sunMoon(u, L, { r: 8, phase: .78, lit: 200 });
    // a thin torn cloud racing across the moon's lower half (it is the moon: waning, half veiled)
    bg += K.cloud(u, L, { x: MOON.x + 6, y: MOON.y + 4.5, w: 34, h: 2.6, seed: 27, far: .2 });
    // torn low clouds racing to the right, their edges lit by the moon
    for (const [x, y, w, h, sd, fr] of [[170, 26, 70, 9, 31, .1], [22, 34, 56, 8, 12, .15], [150, 70, 50, 6, 17, .35], [36, 80, 44, 5, 9, .55], [188, 92, 40, 4, 23, .7]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    // rays from the moon: long soft blades fanning out over the whole sky (behind the ship)
    bg += rays(u, MOON, 220, [[-170, 5], [-150, 4], [-128, 6], [-106, 3.5], [-84, 5], [-62, 4], [-40, 6], [-18, 3.5], [4, 5], [24, 4], [150, 4], [172, 5]], '#cfe0ff', .2, 3);
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .85, seed: 6, glitter: MOON.x });
    // the trap behind her: a wall of gun smoke along the horizon on the left, the enemies in it firing at the spot
    bg += K.smoke(u, L, { x: 10, y: 109, w: 60, h: 36, wind: .7, seed: 3, opacity: .75, glow: { color: '#ffa040', power: .6 } });
    bg += `<g opacity=".7">${K.ship(u, L, Object.assign({ air: .55 }, DUTCH))}</g>` + broadside(u, L, DUTCH, [-12, -2, 8], .6, 31);
    bg += K.ship(u, L, ENDV) + broadside(u, L, ENDV, [-30, -20, -10, 0, 10, 20], .95, 41);
    bg += K.smoke(u, L, { x: 40, y: 109, w: 46, h: 26, wind: .8, seed: 7, opacity: .55, glow: { color: '#ffb050', power: .3 } });
    // shot in the air: dark balls with faint streaks dropping into the spot
    { const R = rng(7); for (const [x, y, a] of [[24, 100, 40], [44, 98, 140], [30, 94, 60]]) { const l = 3 + R() * 2, r = a * Math.PI / 180;
      bg += `<path d="M${f(x - Math.cos(r) * l)} ${f(y - Math.sin(r) * l)}L${f(x)} ${f(y)}" stroke="#d8e4fa" stroke-width=".35" opacity=".35" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r=".6" fill="#0c0e14"/>`; } }
    bg += spot(u, L);
    // her wake: out of the spot to her stern, foam spreading behind her
    { const R = rng(19); for (let t = 0; t < 1; t += .07 + R() * .05) { const x = lerp(SPOT.x + 4, 56, t), y = lerp(SPOT.y + 1, SINK + 1.4, t);
      bg += K.foam(u, { x, y, w: 4 + t * 8, h: .5 + t * .7, seed: 60 + Math.round(t * 90), L }) + K.foam(u, { x: x + 2, y: y + 2 + t * 2.5, w: 3 + t * 6, h: .4 + t * .6, seed: 90 + Math.round(t * 90), L }); } }
    // the Pearl
    bg += K.ship(u, L, PEARL);
    const g = K.shipGeom(PEARL.kind, PEARL);
    // she rides lower than the kit's waterline: the same sea again (the same seed — the same waves) over her hull up to
    // SINK, a new line of foam where it meets her side
    { const cid = nid('sk', u); bg += `<defs><clipPath id="${cid}"><path d="M14 ${SINK}H200V${WL + 6}H14Z"/></clipPath></defs><g clip-path="url(#${cid})">${K.water(u, L, { horizon: HZ, bottom: 292, swell: .85, seed: 6, glitter: MOON.x })}</g>`;
      bg += K.foam(u, { x: 100, y: SINK + .3, w: 150, h: 2.4, seed: 14, L }) + K.foam(u, { x: 70, y: SINK + 1.8, w: 70, h: 1.4, seed: 15, L }); }
    bg += awash(u, L, g);
    // the moon through the rigging: a second set of short bright rays over the ship, as if through the holes in her sails
    bg += rays(u, MOON, 70, [[-160, 2.5], [-120, 2], [-95, 3], [-60, 2], [-25, 2.5], [10, 2], [40, 2.5], [75, 2], [110, 2.5], [140, 2]], '#e8f0ff', .22, 1.6);
    bg += K.localGlow(u, { x: MOON.x, y: MOON.y, color: '#e0ecff', power: .45, radius: 22 });
    // her bow up and running: a big bow wave thrown forward and up, sheets of spray blown at us and to the right
    { const st = g.nearRail(-56); bg += bowWave(u, L, st[0] + 2, SINK + .4); }
    // smoke from a hit on her quarter, torn off to the right low over the water
    { const q = g.nearRail(40); bg += K.smoke(u, L, { x: q[0], y: q[1] - 1, w: 20, h: 16, wind: .9, seed: 13, opacity: .45 }); }
    let fg = '';
    // spray flying across the front: droplets streaked by the wind to the right, thick by her bow
    { const st = K.shipGeom(PEARL.kind, PEARL).nearRail(-56); fg += spray(u, st[0] + 2, SINK - 2); }
    // under the glass: the near sea dark, a crest catching the moon
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 130, 0, 280, [[0, '#04070e', 0], [.22, '#04070e', .5], [1, '#020409', .85]])}</defs><rect x="-10" y="130" width="220" height="162" fill="url(#${gl})"/>`; }
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

// gun flashes along a ship's side (X — along her length in her own units, as shipGeom), each with a puff of smoke
// blown to the right; the flashes point at the spot
function broadside(u, L, o, Xs, k, seed) {
  const g = K.shipGeom(o.kind, o), R = rng(seed);
  let s = '';
  for (const X of Xs) { const p = g.nearRail(X), y = p[1] + 3.2 * o.scale * 10 * .25, dir = Math.atan2(SPOT.y - y, SPOT.x - p[0]) * 180 / Math.PI;
    s += K.smoke(u, L, { x: p[0] + 1, y, w: 9 * k, h: 8 * k, wind: .7, seed: Math.round(R() * 90), opacity: .55, glow: { color: '#ffb050', power: .55 } });
    if (R() > .2) s += K.muzzleFlash(u, { x: p[0], y, dir, len: (5 + R() * 3) * k, seed: Math.round(R() * 9) }) + K.localGlow(u, { x: p[0], y, color: '#ffc070', power: .55, radius: 7 * k }); }
  return s;
}

// the spot she has just left: torn water and foam, and the shot falling into it — columns of different heights,
// the far ones smaller; spray hanging over them
function spot(u, L) {
  const R = rng(23);
  let s = K.localGlow(u, { x: SPOT.x, y: SPOT.y, color: '#cfe0ff', power: .25, radius: 22 }, { squash: .3, core: false });
  for (const [dx, dy, w] of [[-12, -2, 12], [6, -3, 14], [-4, 2, 20], [12, 3, 12]]) s += K.foam(u, { x: SPOT.x + dx, y: SPOT.y + dy, w, h: 1, seed: Math.round(R() * 99), L });
  for (const [dx, dy, w, h, sd] of [[-10, -4, 7, 13, 0], [8, -5, 6, 11, 4], [0, -2, 10, 22, 3], [-16, 0, 8, 12, 1], [14, 1, 8, 15, 2], [-5, 4, 9, 13, 5]])
    s += K.splash(u, { x: SPOT.x + dx, y: SPOT.y + dy, w, h, seed: sd, L, wind: .4 });
  for (let i = 0; i < 34; i++) { const x = SPOT.x + (R() - .5) * 38, y = SPOT.y - 4 - R() * 20; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.2 + R() * .45)}" fill="#e8f2ff" opacity="${f(.25 + R() * .45)}"/>`; }
  return s;
}

// the sea on her deck: she is down by the stern, so the sea comes in over the near quarter rail — white water heaped
// over the rail aft and spilling inboard, foam along the waist rail; ragged streams running back off the side
function awash(u, L, g) {
  const R = rng(37);
  let s = '';
  for (let X = -30; X <= 44; X += 3 + R() * 3) { const p = g.nearRail(X), w = 3 + R() * 4, k = Math.max(0, (X - 8) / 36);
    s += K.foam(u, { x: p[0], y: p[1] + .2 - k * .6, w: w + k * 4, h: .8 + R() * .6 + k * 1.6, seed: Math.round(R() * 99) + 100, L });
    if (X < 20 && R() > .62) { const l = 1 + R() * 4.5, sl = .6 + R() * 2.2, x2 = p[0] - sl, wd = .2 + R() * .55;
      s += `<path d="M${f(p[0])} ${f(p[1] + .5)}Q${f(p[0] - sl * .2)} ${f(p[1] + l * .55)} ${f(x2)} ${f(p[1] + l)}" stroke="#dfeaff" stroke-width="${f(wd)}" fill="none" opacity="${f(.3 + R() * .35)}" stroke-linecap="round"/>`; } }
  for (const [X, w, h, sd] of [[22, 10, 5, 41], [31, 13, 8, 42], [40, 10, 6, 43]]) { const p = g.nearRail(X); s += K.splash(u, { x: p[0], y: p[1] + 1.2, w, h, seed: sd, L, wind: -.6 }); }
  { const a = g.nearRail(16), b = g.nearRail(44); s += K.foam(u, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + .6, w: Math.abs(b[0] - a[0]) + 6, h: 2.8, seed: 47, L }); }
  for (let i = 0; i < 30; i++) { const p = g.nearRail(-20 + R() * 66); s += `<circle cx="${f(p[0] + (R() - .5) * 3)}" cy="${f(p[1] - R() * 4)}" r="${f(.2 + R() * .5)}" fill="#eaf4ff" opacity="${f(.35 + R() * .45)}"/>`; }
  return s;
}

// her bow wave: the stem cuts the sea and throws it up and forward in a flared sheet — two crescents of white water
// rising from the cutwater, curling over at the top and breaking into lumps and drops; foam spreading back along her
// side; backlit by the moon: a grey-blue body, a bright top edge
function bowWave(u, L, x, y) {
  const R = rng(61), gid = nid('bw', u);
  let s = `<defs>${linGrad(gid, 0, y - 18, 0, y + 1, [[0, '#f4f8ff', .95], [.45, '#c4d4ea', .85], [1, '#7a90b0', .7]])}</defs>`;
  // the sheets: [forward reach, height, thickness]
  for (const [fw, h, th, op] of [[30, 17, 5, .7], [22, 12, 4, .9], [14, 7, 3, 1]]) {
    const top = [x + fw * .55, y - h], tip = [x + fw, y - h * .55], d = `M${f(x - 2)} ${f(y)}C${f(x)} ${f(y - h * .6)} ${f(top[0] - fw * .3)} ${f(top[1])} ${f(top[0])} ${f(top[1])}`
      + `C${f(top[0] + fw * .25)} ${f(top[1])} ${f(tip[0])} ${f(tip[1] - 2)} ${f(tip[0])} ${f(tip[1])}`
      + `C${f(tip[0] - th)} ${f(tip[1] - 1)} ${f(top[0] + 1)} ${f(top[1] + th)} ${f(x + fw * .4)} ${f(y - h * .3)}Q${f(x + fw * .7)} ${f(y - 1)} ${f(x + fw * .9)} ${f(y)}Z`;
    s += `<path d="${d}" fill="url(#${gid})" opacity="${op}"/><path d="M${f(x)} ${f(y - h * .55)}C${f(top[0] - fw * .3)} ${f(top[1])} ${f(top[0])} ${f(top[1])} ${f(top[0] + fw * .2)} ${f(top[1] + .3)}" stroke="#ffffff" stroke-width=".6" fill="none" opacity=".8" stroke-linecap="round"/>`;
    // the curl breaking into lumps at the tip
    for (let i = 0; i < 7; i++) { const t = R(), px = lerp(top[0], tip[0] + 3, t) + (R() - .5) * 2, py = lerp(top[1], tip[1], t) - R() * 3;
      s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(.5 + R() * 1)}" ry="${f(.4 + R() * .7)}" fill="#eef4ff" opacity="${f(.6 + R() * .4)}"/>`; } }
  s += K.foam(u, { x: x + 8, y: y + .8, w: 40, h: 3, seed: 8, L }) + K.foam(u, { x: x - 16, y: y + .4, w: 34, h: 2, seed: 9, L });
  return s;
}

// flying spray in front of her bow: drops on arcs out of the bow wave — up, forward and down, blown to the right;
// each drop drawn along its flight, the near ones bigger and blurred
function spray(u, x0, y0) {
  const R = rng(51), bl = nid('sb', u);
  let near = '', far = '';
  for (let i = 0; i < 26; i++) { const vx = 10 + R() * 30, vy = -(6 + R() * 16), n = 5 + Math.floor(R() * 5), big = R() > .7;
    for (let k = 1; k <= n; k++) { const t = k / n * (.6 + R() * .6), x = x0 + vx * t, y = y0 + vy * t + 16 * t * t;
      if (R() < .35) continue;
      const dx = vx, dy = vy + 32 * t, l = Math.hypot(dx, dy), len = (big ? 1.6 : .9) + R() * 1.2, r = big ? .55 + R() * .5 : .25 + R() * .35;
      const d = `<path d="M${f(x - dx / l * len)} ${f(y - dy / l * len)}L${f(x)} ${f(y)}" stroke="#eef6ff" stroke-width="${f(r * 2)}" stroke-linecap="round" opacity="${f(.45 + R() * .5)}"/>`;
      if (big) near += d; else far += d; } }
  return `<defs><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".35"/></filter></defs>${far}<g filter="url(#${bl})">${near}</g>`;
}
