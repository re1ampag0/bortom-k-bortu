// Check sheets of the two great ships of the game, large: «Индевор» and «Летучий голландец» (kit/ship.cjs), in the light of
// its own deck and in daylight, plus the one-tone silhouette and the mid version. Render:
// node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/ships-big.cjs
'use strict';
const K = require('../index.cjs');
const DECK = { endeavour: 'endeavour', dutch: 'dutchman' };
const fit = (kind, maxW, maxH) => { const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }); return Math.min(maxW / b.w, maxH / b.h); };
const panel = (x, y, w, h, body) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">${body}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-width=".6"/>`;
const scene = (u, kind, light, p) => { const hz = 118, L = K.makeLight(light, { horizon: hz });
  return K.sky(u, L, { horizon: hz }) + K.sunMoon(u, L) + K.cloudBank(u, L, { y: hz - 12, h: 14, x0: 0, x1: 200, n: 4, seed: 5, far: .6 }) + K.water(u, L, { horizon: hz, bottom: 150 })
    + K.ship(u, L, Object.assign({ kind, x: 100, y: 126, scale: fit(kind, 188, 118), wake: true, reflect: true, lights: true }, p)); };
const sheet = kind => ({ w: 400, h: 300, bg: '#222', svg: () =>
  panel(0, 0, 200, 150, scene('G' + kind + 'a', kind, K.LIGHTS[DECK[kind]], {})) + panel(200, 0, 200, 150, scene('G' + kind + 'b', kind, K.LIGHTS.sea, { flip: true }))
  + panel(0, 150, 200, 150, `<rect width="200" height="150" fill="#e9dfc8"/>` + K.shipSilhouette(kind, { x: 100, y: 126, scale: fit(kind, 188, 118), u: 'GS' + kind }))
  + panel(200, 150, 200, 150, scene('G' + kind + 'c', kind, K.LIGHTS.sea, { detail: 'mid', sails: 'reefed', scale: fit(kind, 188, 118) * .62, x: 110 })) });
module.exports = { sheets: { 'big-endeavour': sheet('endeavour'), 'big-dutch': sheet('dutch') } };
