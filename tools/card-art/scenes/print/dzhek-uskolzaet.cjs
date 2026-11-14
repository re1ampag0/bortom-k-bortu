// «Джек ускользает» (Жемчужина, Легенда, РЕАКЦИЯ: когда «Жемчужина» должна утонуть — её Корпус 2, и Пираты меняют
// корабли местами). Night; the moon low on the left behind the enemies. The ring closes: the Endeavour on the left
// and the Dutchman behind fire their broadsides into one spot — and the spot is empty: a grove of shot splashes and
// smoke on churned water, her wake running out of it. The Black Pearl is already out of the ring on the right,
// almost sunk — heeled hard towards us, down by the stern, the sea pouring over her near quarter rail and into her lower
// ports, rags of sails — yet running out of the picture to the right with the wind. Not «Уйти по ветру» (one
// chaser, a clean run under full sail): here she is broken and the trap was the end, and she slips out of it.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, lerp, rng, nid, linGrad } = K;

const HZ = 96;
const MOON = { x: 64, y: 50 };
const SPOT = { x: 58, y: 109 };     // where she was: the converging fire falls here
const SINK = 118.4;                 // the sea's level on her: 3.6 units over the kit's waterline (122) — she is down to her lower ports
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 18, color: '#c8d8f6', power: .85 }, fill: { color: '#3d5680', power: .4 },
  rim: { az: -20, color: '#bfe0ff', power: .6 }, locals: [{ x: 30, y: 92, color: '#ffb050', power: .55, radius: 26 }, { x: SPOT.x, y: SPOT.y - 6, color: '#ffc070', power: .3, radius: 22 }] };
const PEARL = { kind: 'pearl', x: 124, y: 122, scale: .68, flip: true, roll: 20, heel: -7, sails: 'full', wake: true, lights: true, detail: 'near', seed: 4 };
const ENDV = { kind: 'endeavour', x: 16, y: 101, scale: .34, flip: true, sails: 'reefed', detail: 'mid', lights: true, seed: 2 };
const DUTCH = { kind: 'dutch', x: 87, y: 96.6, scale: .24, sails: 'reefed', detail: 'mid', lights: true, seed: 5 };
const skel = { horizon: HZ, eye: 3, light: 'the moon low on the left behind the enemies (back light): the splashes and the Pearl\'s sails glow through; gun flashes on the left',
  items: [
    ['pearl', 78, PEARL.y, 112, 69, 'water: heeled 20° to us, down by the stern 7° (the masts lean aft), sunk 3.6 units deeper (the sea at SINK), the sea over her quarter rail, running right'],
    ['endeavour', -8, ENDV.y, 56, 38, 'water, left, broadside firing'],
    ['dutchman', 70, DUTCH.y, 34, 19, 'water, behind and right of the spot, half behind the Pearl\'s stern, muted, firing'],
    ['splashes', 36, 116, 46, 26, 'water: the empty spot'],
    ['wake', 60, 122, 30, 12, 'water: from the spot to her stern'],
  ] };

module.exports = { name: 'Джек ускользает', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 50, seed: 8 }) + K.sunMoon(u, L, { r: 6.4 });
    // torn low clouds racing to the right, edged by the moon
    for (const [x, y, w, h, sd, fr] of [[150, 30, 80, 10, 31, 0], [30, 30, 50, 7, 12, .1], [104, 66, 56, 7, 17, .3], [182, 74, 40, 6, 5, .45], [24, 80, 44, 5, 9, .6], [120, 90, 50, 4, 23, .8]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .7, seed: 6, glitter: MOON.x });
    // the ring: the Dutchman behind, the Endeavour on the left, their broadsides flashing at the spot
    // the Dutchman stands clear of the splashes, half behind the Pearl's stern, muted: a dark shape in the haze
    bg += `<g opacity=".78">${K.ship(u, L, Object.assign({ air: .45 }, DUTCH))}</g>` + broadside(u, L, DUTCH, [-10, -3, 4, 11], .9, 31);
    bg += K.ship(u, L, ENDV) + broadside(u, L, ENDV, [-26, -16, -6, 4, 14], .9, 41);
    // the shot in the air: dark balls with faint streaks dropping into the spot
    { const R = rng(7); for (const [x, y, a] of [[44, 96, 30], [36, 99, 26], [70, 98, 110], [52, 92, 70]]) { const l = 3 + R() * 2, r = a * Math.PI / 180;
      bg += `<path d="M${f(x - Math.cos(r) * l)} ${f(y - Math.sin(r) * l)}L${f(x)} ${f(y)}" stroke="#d8e4fa" stroke-width=".35" opacity=".35" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r=".6" fill="#0c0e14"/>`; } }
    // the empty spot: churned water, a ring of foam, a grove of columns — the far ones first
    bg += spot(u, L);
    // the Pearl
    bg += K.ship(u, L, PEARL);
    const g = K.shipGeom(PEARL.kind, PEARL);
    // she rides lower than the kit's waterline: the same sea again (the same seed — the same waves) over her hull up to
    // SINK, a new line of foam where it meets her side, the wake laid after it
    { const cid = nid('sk', u); bg += `<defs><clipPath id="${cid}"><path d="M74 ${SINK}H196V127H74Z"/></clipPath></defs><g clip-path="url(#${cid})">${K.water(u, L, { horizon: HZ, bottom: 292, swell: .7, seed: 6, glitter: MOON.x })}</g>`;
      bg += K.foam(u, { x: 132, y: SINK + .3, w: 104, h: 2.2, seed: 14, L }) + K.foam(u, { x: 150, y: SINK + 1.6, w: 60, h: 1.2, seed: 15, L }); }
    // her wake: out of the spot to her stern, foam spreading behind her
    { const R = rng(19); for (let t = 0; t < 1; t += .07 + R() * .05) { const x = lerp(SPOT.x + 4, 88, t), y = lerp(SPOT.y + 1, SINK + 2, t);
      bg += K.foam(u, { x, y, w: 4 + t * 8, h: .5 + t * .7, seed: 60 + Math.round(t * 90), L }) + K.foam(u, { x: x + 2, y: y + 2 + t * 2.5, w: 3 + t * 6, h: .4 + t * .6, seed: 90 + Math.round(t * 90), L }); } }
    bg += awash(u, L, g);
    // the bow lifted by the sinking stern still throws a bow wave as she runs
    { const st = g.nearRail(-50); bg += K.splash(u, { x: st[0] + 6, y: SINK + .4, w: 14, h: 9, seed: 2, L, wind: 1 }) + K.foam(u, { x: st[0] + 4, y: SINK + .8, w: 24, h: 2, seed: 8, L }); }
    // smoke from a hit on her quarter, torn off to the right low over the water
    { const q = g.nearRail(42); bg += K.smoke(u, L, { x: q[0], y: q[1] - 1, w: 22, h: 18, wind: .8, seed: 13, opacity: .55, glow: { color: '#ff9a40', power: .35 } }); }
    // under the glass: the near sea dark, a crest catching the moon
    let fg = '';
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 128, 0, 280, [[0, '#04070e', 0], [.25, '#04070e', .45], [1, '#020409', .8]])}</defs><rect x="-10" y="128" width="220" height="164" fill="url(#${gl})"/>`; }
    return [bg, fg];
  } };

// gun flashes along a ship's side (X — along her length in her own units, as shipGeom), each with a puff of smoke
// blown to the right; the flashes point at the spot
function broadside(u, L, o, Xs, k, seed) {
  const g = K.shipGeom(o.kind, o), R = rng(seed);
  let s = '';
  for (const X of Xs) { const p = g.nearRail(X), y = p[1] + 3.2 * o.scale * 10 * .25, dir = Math.atan2(SPOT.y - y, SPOT.x - p[0]) * 180 / Math.PI;
    s += K.smoke(u, L, { x: p[0] + 1, y, w: 9 * k, h: 8 * k, wind: .7, seed: Math.round(R() * 90), opacity: .55, glow: { color: '#ffb050', power: .55 } });
    if (R() > .25) s += K.muzzleFlash(u, { x: p[0], y, dir, len: (5 + R() * 3) * k, seed: Math.round(R() * 9) }) + K.localGlow(u, { x: p[0], y, color: '#ffc070', power: .5, radius: 6 * k }); }
  return s;
}

// the spot she has just left: torn water and foam, and the shot falling into it — columns of different heights,
// the far ones smaller; spray hanging over them
function spot(u, L) {
  const R = rng(23);
  let s = K.localGlow(u, { x: SPOT.x, y: SPOT.y, color: '#cfe0ff', power: .25, radius: 24 }, { squash: .3, core: false });
  for (const [dx, dy, w] of [[-14, -2, 14], [6, -3, 16], [-4, 2, 22], [12, 3, 14], [-18, 4, 12]]) s += K.foam(u, { x: SPOT.x + dx, y: SPOT.y + dy, w, h: 1.1, seed: Math.round(R() * 99), L });
  for (const [dx, dy, w, h, sd] of [[-10, -4, 8, 15, 0], [8, -5, 7, 12, 4], [0, -2, 12, 26, 3], [-18, 0, 9, 14, 1], [16, 1, 10, 18, 2], [-6, 4, 11, 16, 5], [6, 5, 8, 10, 7]])
    s += K.splash(u, { x: SPOT.x + dx, y: SPOT.y + dy, w, h, seed: sd, L, wind: .4 });
  for (let i = 0; i < 40; i++) { const x = SPOT.x + (R() - .5) * 44, y = SPOT.y - 4 - R() * 22; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.2 + R() * .5)}" fill="#e8f2ff" opacity="${f(.25 + R() * .45)}"/>`; }
  return s;
}

// the sea on her deck: she is down by the stern, so the sea comes in over the near quarter rail — a sheet of white
// water heaped over the rail aft and spilling inboard, foam along the waist rail; a few ragged streams running back
// off the side (each its own length, width and slant, trailing aft)
function awash(u, L, g) {
  const R = rng(37);
  let s = '';
  for (let X = -30; X <= 44; X += 3 + R() * 3) { const p = g.nearRail(X), w = 3 + R() * 4, k = Math.max(0, (X - 8) / 36);
    s += K.foam(u, { x: p[0], y: p[1] + .2 - k * .6, w: w + k * 4, h: .8 + R() * .6 + k * 1.6, seed: Math.round(R() * 99) + 100, L });
    if (X < 20 && R() > .62) { const l = 1 + R() * 4.5, sl = .6 + R() * 2.2, x2 = p[0] - sl, wd = .2 + R() * .55;
      s += `<path d="M${f(p[0])} ${f(p[1] + .5)}Q${f(p[0] - sl * .2)} ${f(p[1] + l * .55)} ${f(x2)} ${f(p[1] + l)}" stroke="#dfeaff" stroke-width="${f(wd)}" fill="none" opacity="${f(.3 + R() * .35)}" stroke-linecap="round"/>`; } }
  // over the quarter: the sea itself climbing the rail and breaking inboard — crests over the rail, white water poured on deck
  for (const [X, w, h, sd] of [[22, 10, 5, 41], [31, 12, 7, 42], [40, 9, 5, 43]]) { const p = g.nearRail(X); s += K.splash(u, { x: p[0], y: p[1] + 1.2, w, h, seed: sd, L, wind: -.6 }); }
  { const a = g.nearRail(16), b = g.nearRail(44); s += K.foam(u, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + .6, w: Math.abs(b[0] - a[0]) + 6, h: 2.6, seed: 47, L }); }
  // spray thrown up where the rail meets the sea
  for (let i = 0; i < 30; i++) { const p = g.nearRail(-20 + R() * 66); s += `<circle cx="${f(p[0] + (R() - .5) * 3)}" cy="${f(p[1] - R() * 4)}" r="${f(.2 + R() * .5)}" fill="#eaf4ff" opacity="${f(.35 + R() * .45)}"/>`; }
  return s;
}
