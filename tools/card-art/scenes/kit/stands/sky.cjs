// Check sheets of the sky (kit/env.cjs: sky, sunMoon, water's glitter path) in four lights:
//   sky       — night with the moon over the sea; night with the moon among clouds; day with the sun; sunset. Look
//               for: a crisp moon with its own seas, a soft halo, a torn glitter path under the source, stars of
//               different size and brightness (a few large ones with rays), denser to the zenith, dying out at the
//               horizon and never on the moon or its halo; the sun with a glow and rays, its path on the water; the
//               sunset sky warming from the zenith to the horizon; the far ship lit from the source's side;
//   sky-close — the discs large: a full moon, a gibbous and a crescent moon (option `phase`), the day and the
//               sunset sun.
// Render: node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/sky.cjs --out <dir> --width 1000.
'use strict';
const K = require('../index.cjs');

const panel = (x, y, body, cap) => `<svg x="${x}" y="${y}" width="200" height="280" viewBox="0 0 200 280" overflow="hidden">${body}</svg><rect x="${x}" y="${y}" width="200" height="280" fill="none" stroke="#fff" stroke-width=".8"/>`
  + `<text x="${x + 4}" y="${y + 275}" font-family="sans-serif" font-size="6.5" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${cap}</text>`;
// a light with the sun or moon drawn at (x, y): the direction is found from the place
const at = (base, x, y, hz) => K.makeLight(Object.assign({}, base, { key: Object.assign({}, base.key, { x, y, az: null, el: null }) }), { horizon: hz });

const scene = (u, L, hz, o = {}) => {
  let s = K.sky(u, L, { horizon: hz, seed: o.seed || 4 }) + K.sunMoon(u, L, { r: o.r || 8, seed: 3, phase: o.phase });
  if (o.clouds) s += o.clouds(u, L);
  s += K.water(u, L, { horizon: hz, bottom: 280, swell: o.swell != null ? o.swell : .45, seed: 5 });
  if (o.ship) s += K.ship(u, L, Object.assign({ kind: 'pearl', detail: 'far', reflect: true }, o.ship));
  return s;
};

const HZ = 150;
const sky = { w: 815, h: 280, bg: '#222', svg: () => {
  const A = scene('SA', at(K.LIGHTS.pearl, 132, 52, HZ), HZ, { ship: { x: 62, y: 158, scale: .32 } });
  const B = scene('SB', at(K.LIGHTS.pearl, 92, 64, HZ), HZ, { seed: 9,
    clouds: (u, L) => K.cloud(u, L, { x: 58, y: 84, w: 92, h: 26, seed: 21 }) + K.cloud(u, L, { x: 150, y: 46, w: 80, h: 22, seed: 22 })
      + K.cloudBank(u, L, { y: HZ - 8, h: 14, x0: -10, x1: 210, n: 5, seed: 23, far: .75 }) });
  const C = scene('SC', at(K.LIGHTS.endeavour, 128, 48, HZ), HZ, { r: 7, ship: { kind: 'endeavour', x: 70, y: 160, scale: .34 },
    clouds: (u, L) => K.cloud(u, L, { x: 50, y: 60, w: 70, h: 20, seed: 31 }) + K.cloudBank(u, L, { y: HZ - 5, h: 10, x0: -10, x1: 210, n: 5, seed: 32, far: .8 }) });
  const D = scene('SD', at(K.LIGHTS.revenge, 74, HZ - 20, HZ), HZ, { r: 7.5, swell: .35, ship: { kind: 'revenge', x: 138, y: 160, scale: .34 },
    clouds: (u, L) => K.cloud(u, L, { x: 150, y: 70, w: 74, h: 14, seed: 41, far: .3 }) + K.cloudBank(u, L, { y: HZ - 30, h: 8, x0: 0, x1: 70, n: 2, seed: 42, far: .6 }) });
  return panel(0, 0, A, 'ночь: луна над морем, звёзды, дорожка') + panel(205, 0, B, 'ночь: луна в облаках')
    + panel(410, 0, C, 'день: солнце, лучи, дорожка') + panel(615, 0, D, 'закат: небо по высоте, низкое солнце');
} };

// the discs large: each panel is a 200 x 280 scene shown at 0.5, the disc made big
const close = { w: 815, h: 150, bg: '#222', svg: () => {
  const cell = (x, u, base, o) => { const L = at(base, 100, 70, 140);
    const body = K.sky(u, L, { horizon: 140, seed: 6 }) + K.sunMoon(u, L, { r: o.r, seed: 3, phase: o.phase, lit: o.lit }) + K.water(u, L, { horizon: 140, bottom: 280, seed: 7 });
    return `<svg x="${x}" y="0" width="160" height="140" viewBox="20 0 160 140" overflow="hidden">${body}</svg><rect x="${x}" y="0" width="160" height="140" fill="none" stroke="#fff" stroke-width=".8"/>`
      + `<text x="${x + 4}" y="147" font-family="sans-serif" font-size="6.5" fill="#eee">${o.cap}</text>`; };
  return cell(0, 'CA', K.LIGHTS.pearl, { r: 20, cap: 'луна полная, r 20' }) + cell(163, 'CB', K.LIGHTS.pearl, { r: 20, phase: .78, cap: 'phase .78' })
    + cell(326, 'CC', K.LIGHTS.pearl, { r: 20, phase: .25, lit: 200, cap: 'phase .25, lit 200' }) + cell(489, 'CD', K.LIGHTS.endeavour, { r: 14, cap: 'солнце, день, r 14' })
    + cell(652, 'CE', K.LIGHTS.revenge, { r: 14, cap: 'солнце, закат, r 14' });
} };

module.exports = { sheets: { sky, 'sky-close': close } };
