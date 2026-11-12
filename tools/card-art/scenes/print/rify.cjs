// «Рифы» (Колода моря): a brig squeezes between stone teeth and the reef is already ripping its side; on the
// neighbouring rock lie the ribs of one who tried before. Breakdown: docs/tasks/print-kit-cards.md «Рифы».
'use strict';
const K = require('../kit/index.cjs');

const HZ = 120;
// the sun high in front of us, to the left (kit az: where the light comes FROM — 0 from the depth, 270 left)
const light = { time: 'day', haze: .2, key: { type: 'sun', az: 310, el: 50, color: '#fff0d2', power: 1 }, fill: { color: '#7fd0d0', power: .5 } };
const skel = { horizon: HZ, eye: 5, light: 'sun high in front, left: left faces of the rocks warm, right faces violet-brown; shadows fall on the water to the right and towards us',
  items: [
    ['brig', 62, 127, 92, 76, 'on the water, waterline y 127, bow to the right into the right rock'],
    ['rock-right', 130, 135, 66, 72, 'stands in the water, foot y 135; touches the bow at x 132–138, y 113–127'],
    ['rock-left', 8, 135, 58, 50, 'stands in the water, foot y 134'],
    ['wreck', 12, 121, 42, 26, 'old ribs lying on the left rock, propped on the stone'],
    ['plank', 92, 176, 30, 8, 'floats on the shallows'],
    ['rock-near', 0, 268, 76, 26, 'in the shallows by the bottom left edge, surf round it', { edge: 1 }],
  ] };

module.exports = { name: 'Рифы', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 5 });
    let bg = K.sky(u, L, { horizon: HZ }) + K.water(u, L, { horizon: HZ, bottom: 280, swell: .35, seed: 17, glitter: false });
    bg += shallows(u, L);
    // the brig: its shadow on the water, the hull, foam along it
    bg += K.castShadow(u, L, { x: 104, y: 128, w: 70, h: 30, horizon: HZ, onto: 'water', d: .25 });
    bg += K.ship(u, L, { kind: 'brig', x: 104, y: 127, scale: .92, flip: true, heel: 2.5, sails: 'reefed', detail: 'near', reflect: true, wake: true, seed: 9 });
    let fg = '';
    // the left rock with the old wreck: a low shoulder, a broken block and the peak — several stones, not one dome
    fg += K.castShadow(u, L, { x: 46, y: 134, w: 30, h: 44, horizon: HZ, onto: 'water' });
    fg += K.rock(u, L, { x: 26, y: 133, w: 34, h: 17, rot: 4, wet: true, seed: 41 });
    fg += wreck(u, L);
    fg += K.rock(u, L, { x: 40, y: 134, w: 24, h: 30, rot: 7, wet: true, seed: 43 });
    fg += K.rock(u, L, { x: 54, y: 135, w: 20, h: 47, rot: -3, wet: true, seed: 44 });
    // the right crag: a tall leaning stone, a lower one at its foot, a tooth in front biting into the bow
    fg += K.castShadow(u, L, { x: 168, y: 135, w: 44, h: 64, horizon: HZ, onto: 'water' });
    fg += K.rock(u, L, { x: 186, y: 135, w: 26, h: 40, rot: 6, wet: true, seed: 46 });
    fg += K.rock(u, L, { x: 168, y: 134, w: 26, h: 72, rot: 2, wet: true, seed: 47 });
    fg += K.rock(u, L, { x: 151, y: 135.5, w: 22, h: 44, rot: -5, wet: true, seed: 49 });
    fg += K.rock(u, L, { x: 140, y: 136, w: 18, h: 22, rot: -10, wet: true, seed: 52 });
    // surf over the feet of both groups (the stones stand in the water, their feet do not show)
    fg += K.foam(u, { x: 40, y: 135, w: 46, h: 2.6, L, seed: 71 }) + K.foam(u, { x: 170, y: 136, w: 62, h: 2.6, L, seed: 72 });
    fg += impact(u, L);
    // the shallows near us: a floating plank, sun glints on the left, the near rock in the surf
    fg += plank(u, L) + glints(u);
    fg += K.rock(u, L, { x: 26, y: 264, w: 50, h: 22, rot: 5, wet: true, seed: 58 }) + K.rock(u, L, { x: 58, y: 268, w: 30, h: 13, rot: -6, wet: true, seed: 63 });
    fg += K.foam(u, { x: 38, y: 265, w: 84, h: 3.4, L, seed: 59 });
    return [bg, fg];
  } };

/** The clear shallows: a pale lane of sand under the water between dark masses of drowned stone on both sides. */
function shallows(u, L) {
  const id = 'krsh' + u, b1 = 'krsb' + u, g = 'krsg' + u, d = 'krsd' + u;
  let s = `<defs><filter id="${b1}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>`
    + `<linearGradient id="${g}" x1="0" y1="140" x2="0" y2="280" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6fd6cc" stop-opacity=".35"/><stop offset=".5" stop-color="#58c4bc" stop-opacity=".45"/><stop offset="1" stop-color="#3aa6a4" stop-opacity=".35"/></linearGradient>`
    + `<linearGradient id="${d}" x1="0" y1="140" x2="0" y2="280" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#16323f" stop-opacity=".45"/><stop offset="1" stop-color="#16323f" stop-opacity=".75"/></linearGradient></defs>`;
  // the sand lane (light), widening towards us
  s += `<path d="M94 142C88 156 96 166 84 184C72 204 86 222 66 246C58 258 62 272 54 284H150C144 266 152 250 140 232C128 212 132 196 118 180C108 166 112 154 106 142Z" fill="url(#${g})" filter="url(#${b1})"/><path d="M70 200C80 196 92 204 88 214C84 222 72 222 66 214C62 208 64 202 70 200Z" fill="url(#${g})" filter="url(#${b1})"/>`;
  // drowned stone, left and right
  s += `<path d="M-4 150C20 146 46 150 62 160C70 190 58 226 40 252C24 262 6 258 -4 250Z" fill="url(#${d})" filter="url(#${b1})"/>`;
  s += `<path d="M204 150C180 147 150 152 132 166C126 196 140 236 168 262C184 270 198 266 204 258Z" fill="url(#${d})" filter="url(#${b1})"/>`;
  s += `<path d="M118 196C130 192 142 200 140 214C136 226 122 228 114 218C110 210 112 200 118 196Z" fill="url(#${d})" filter="url(#${b1})" opacity=".7"/>`;
  return s;
}

/** The old wreck on the left rock: a keel stub and curved ribs propped on the stone, a broken mast leaning. */
function wreck(u, L) {
  // old weathered wood, dark and dull; ribs of different length, two of them broken off short
  let s = K.propTube(u, L, 'ship-wood', 'M14 121.0C22 118.0 32 116.0 44 115.0', 1.5, [30, 118]);
  const ribs = [[18, 120, 14, 109, 17, 99], [24, 119, 21, 107, 25, 96], [30, 118, 28.5, 110, 30.5, 104], [36, 117, 35, 105, 39, 97], [42, 116, 42, 110, 44, 107]];
  for (const [x0, y0, x1, y1, x2, y2] of ribs) s += K.propTube(u, L, 'ship-wood', `M${x0} ${y0}Q${x1} ${y1} ${x2} ${y2}`, .75 + (y0 % 3) * .12, [x1, y1]);
  // the broken mast leaning across the ribs, its split top
  s += K.shadeCyl(u, 26, 120, 50, 98, 1.25, L, 'ship-wood', { r2: 1, seed: 3 });
  s += K.propTube(u, L, 'ship-wood', 'M49.6 98.6Q51.4 96.4 52.4 94.2', .5, [51, 96]);
  return s;
}

/** Where the right rock bites the bow: split planks, splinters flying off, a burst of white water. */
function impact(u, L) {
  let s = K.splash(u, { x: 136, y: 126, w: 18, h: 20, seed: 4, L, wind: 1 });
  // splinters of raw wood, each its own length, width and turn, flying up and away from the bow
  const rw = L.ramp('pine-deck'), sp = [[137, 109, 6.5, -40, .7], [142, 104, 6, -66, .55], [132, 106, 7, 205, .6]];
  for (const [x, y, l, a, w] of sp) {
    const r = a * Math.PI / 180, dx = Math.cos(r) * l, dy = Math.sin(r) * l, nx = -Math.sin(r) * w, ny = Math.cos(r) * w;
    s += `<path d="M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}Q${(x + dx * .5 + nx * 1.6).toFixed(1)} ${(y + dy * .5 + ny * 1.6).toFixed(1)} ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}Q${(x + dx * .45 - nx).toFixed(1)} ${(y + dy * .45 - ny).toFixed(1)} ${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}Z" fill="${rw.lit}" stroke="${rw.outline}" stroke-width=".3"/>`;
  }
  s += K.foam(u, { x: 140, y: 130, w: 22, h: 3, L, seed: 6 });
  return s;
}

/** A torn-off strake floating on the shallows: an oak board with its nail holes, foam at its edges. */
function plank(u, L) {
  const faces = [
    { pts: [[88, 174], [122, 165], [123, 168], [89, 177.2]], n: 'top', kind: 'ship-wood', grain: [1, -.26] },
    { pts: [[89, 177.2], [123, 168], [123, 169.4], [89, 178.6]], n: 'front', kind: 'ship-wood', grain: false },
  ];
  return K.shadeBox(u, faces, L, 'ship-wood') + K.foam(u, { x: 105, y: 174, w: 40, h: 1.5, L, seed: 61 });
}

/** Sun glints in a patch on the left of the shallows (under the sun, which is high to the left in front of us). */
function glints(u) {
  let s = '', seed = 23; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) {
    const x = 22 + R() * 44 + (R() - .5) * 10, y = 150 + R() * 70, t = (y - 150) / 70, l = (1 + R() * 2.4) * (.7 + t), w = (.3 + R() * .35) * (.7 + t * .6);
    s += `<path d="M${(x - l / 2).toFixed(2)} ${y.toFixed(2)}q${(l / 2).toFixed(2)} ${(-w * .7).toFixed(2)} ${l.toFixed(2)} 0" stroke="#fff6dc" stroke-width="${w.toFixed(2)}" stroke-linecap="round" fill="none" opacity="${(.3 + R() * .5).toFixed(2)}"/>`;
  }
  return s;
}
