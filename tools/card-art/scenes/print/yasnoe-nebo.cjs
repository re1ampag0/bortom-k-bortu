// «Ясное небо» (Колода моря): the air is clear to the horizon, the brig opposite is seen to its last port, and the
// barrel of our gun points straight at it. Breakdown: docs/tasks/print-kit-cards.md «Ясное небо».
'use strict';
const K = require('../kit/index.cjs');

const HZ = 120;
// the sun is high behind the viewer's left shoulder (kit az: where the light comes FROM — 180 behind, 270 left)
const light = { time: 'day', haze: .05, key: { type: 'sun', az: 228, el: 58, color: '#fffbe8', power: 1 }, fill: { color: '#5d9be0', power: .5 } };
const skel = { horizon: HZ, eye: 4, light: 'high sun behind the viewer, over the left shoulder: the brig lit head-on, short shadows going away from us',
  items: [
    ['brig', 40, 131, 120, 95, 'on the water, waterline y 131, broadside to us'],
    ['port-left', 0, 280, 34, 134, 'the port jamb, part of our side', { edge: 1 }],
    ['port-right', 166, 280, 34, 134, 'the port jamb, part of our side', { edge: 1 }],
    ['sill', 30, 206, 140, 14, 'the port sill between the jambs'],
    ['gun', 74, 270, 52, 131, 'barrel on its carriage, the chase over the sill, muzzle y 139', { edge: 1 }],
    ['shot', 22, 268, 40, 22, 'pyramid on the deck at the left jamb'],
    ['linstock', 150, 268, 18, 82, 'leans on the right jamb, foot on the deck'],
  ] };

module.exports = { name: 'Ясное небо', kind: 'sea', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    // ——— sky without a cloud, the sea with fine glints all over (no path: the sun is behind us)
    let bg = K.sky(u, L, { horizon: HZ }) + K.water(u, L, { horizon: HZ, bottom: 280, swell: .3, seed: 11, glitter: false });
    bg += glints(u, L);
    // ——— the brig opposite, broadside, bow to the right
    bg += K.ship(u, L, { kind: 'brig', x: 102, y: 131, scale: 1.12, flip: true, sails: 'reefed', detail: 'near', reflect: true, seed: 21 });
    bg += K.foam(u, { x: 104, y: 131.3, w: 74, h: 1.4, L, seed: 6 });
    // ——— our gun port: jambs left and right, the sill, the gun on its carriage
    let fg = port(u, L);
    fg += gun(u, L);
    fg += K.castShadow(u, L, { x: 42, y: 266, w: 34, h: 18, horizon: HZ }) + K.shotPile(u, L, { x: 42, y: 266, s: 1.7, seed: 4 });
    fg += linstock(u, L);
    return [bg, fg];
  } };

/** Fine sun glints all over the water: short dabs, more and smaller towards the horizon. */
function glints(u, L) {
  let s = '', seed = 9; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    const t = Math.pow(R(), 1.4), y = HZ + 2 + t * 60, x = R() * 200, l = (.6 + R() * 1.6) * (.4 + t * 1.6), w = (.25 + R() * .35) * (.5 + t);
    s += `<path d="M${(x - l / 2).toFixed(2)} ${y.toFixed(2)}q${(l / 2).toFixed(2)} ${(-w * .6).toFixed(2)} ${l.toFixed(2)} 0" stroke="#fffbe8" stroke-width="${w.toFixed(2)}" stroke-linecap="round" fill="none" opacity="${(.35 + R() * .45).toFixed(2)}"/>`;
  }
  return s;
}

/** The jambs and sill of the gun port we look out of: thick oak, the inner face of the right jamb is lit. */
function port(u, L) {
  const faces = [
    // left jamb: its inner face looks right (in shadow), its front edge faces us
    { pts: [[0, 146], [24, 147], [33, 280], [0, 280]], n: 'front', kind: 'oak', grain: [0, 1] },
    { pts: [[24, 147], [30, 150], [39, 280], [33, 280]], n: 'right', kind: 'oak', grain: [0, 1] },
    // right jamb: the inner face looks left, into the sun
    { pts: [[200, 146], [176, 147], [167, 280], [200, 280]], n: 'front', kind: 'oak', grain: [0, 1] },
    { pts: [[176, 147], [170, 150], [161, 280], [167, 280]], n: 'left', kind: 'oak', grain: [0, 1] },
  ];
  const sill = [
    { pts: [[30, 194], [170, 194], [168, 200], [32, 200]], n: 'top', kind: 'oak', grain: [1, 0] },
    { pts: [[32, 200], [168, 200], [166, 208], [34, 208]], n: 'front', kind: 'oak', grain: [1, 0] },
  ];
  // the inside of our side below the sill: a dark planked wall the carriage stands against
  const wall = [{ pts: [[34, 208], [166, 208], [162, 280], [38, 280]], n: 'front', kind: 'tar', grain: [1, 0] }];
  return K.shadeBox(u, wall, L, 'tar') + K.shadeBox(u, sill, L, 'oak') + K.shadeBox(u, faces, L, 'oak');
}

/** Our gun from behind: the barrel runs away from us along the picture's axis, cheeks of the carriage on both sides. */
function gun(u, L) {
  let s = '';
  // carriage cheeks (stepped planks), seen from behind: top faces and the inner faces
  const cheek = (x0, x1, sg) => [
    { pts: [[x0, 280], [x0 + sg * 14, 280], [x1 + sg * 6, 214], [x1, 214]], n: 'top', kind: 'oak', grain: [0, 1] },
    { pts: [[x0 + sg * 14, 280], [x0 + sg * 16, 280], [x1 + sg * 7, 216], [x1 + sg * 6, 214]], n: sg < 0 ? 'right' : 'left', kind: 'oak', grain: [0, 1] },
  ];
  s += K.contactShadow(u, 100, 280, 80, L);
  s += K.shadeBox(u, cheek(80, 88, -1).concat(cheek(120, 112, 1)), L, 'oak');
  // the barrel: a turned form from the cascabel (near, big) to the muzzle (far, small)
  const A = [100, 262], B = [100, 139];
  const prof = [[0, 6], [.04, 8], [.07, 16.5], [.1, 17.5], [.13, 16.8], [.3, 14.6], [.32, 15.5], [.35, 14.3], [.55, 11.5], [.57, 12.3], [.6, 11.2],
    [.86, 8], [.9, 8], [.94, 9.3], [.98, 9.3], [1, 8.6]];
  const g = K.propLathe(u, L, 'iron', A, B, prof, { ell: .12 });
  s += g.svg;
  // the cascabel button at the near end
  s += K.shadeSphere(u, 100, 266, 5.6, L, 'iron');
  return s;
}

/** The linstock leaning on the right jamb: an oak staff, the slow match wound round its fork, smoke from the lit end. */
function linstock(u, L) {
  const foot = [156, 268], top = [170, 190];
  let s = K.castShadow(u, L, { x: foot[0], y: foot[1], w: 4, h: 70, horizon: HZ, d: 1 });
  s += K.shadeCyl(u, foot[0], foot[1], top[0], top[1], 1.6, L, 'oak', { r2: 1.3, seed: 8 });
  s += K.rope(u, L, [[top[0] - 1, top[1] + 8], [top[0] - 4, top[1] + 3], [top[0] - 3, top[1] - 2], [top[0] + 1, top[1] - 4]], { r: .9, seed: 7 });
  s += `<circle cx="${top[0] + 1}" cy="${top[1] - 4}" r="1.3" fill="#ff8a3a"/><circle cx="${top[0] + 1}" cy="${top[1] - 4}" r=".6" fill="#ffe2a0"/>`;
  s += K.smoke(u, L, { x: top[0] + 1, y: top[1] - 5, w: 12, h: 26, wind: .45, seed: 5, opacity: .5 });
  return s;
}
