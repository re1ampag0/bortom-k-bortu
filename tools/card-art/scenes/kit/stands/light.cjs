// Check sheets of the light library (kit/light.cjs) and the environments (kit/env.cjs):
//   materials — every MAT kind as a ball, a cylinder and a box in four light schemes (night, dusk, day, fog with a
//               lantern): the highlight must sit on the source's side in every column, the terminator and the reflex
//               must read, metal narrow and bright, wood broad and dull, cloth without a highlight;
//   env       — sky with clouds and the moon or sun, water and foam, three splashes, fog, smoke, fire, three muzzle
//               flashes, the deck, in the four times of day.
// Render: node tools/card-art/kit-sheet.mjs <this file>.
'use strict';
const K = require('../index.cjs');

const HZ = 108, f = K.f;
const label = (x, y, t, a = 'start', size = 6) => `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${size}" text-anchor="${a}" fill="#eee">${t}</text>`;

// ——— materials ———
const COL = 92, ROW = 30, X0 = 40, Y0 = 22;
const SCHEMES = [
  { name: 'ночь, луна справа спереди', light: () => K.LIGHTS.pearl },
  { name: 'закат, солнце слева', light: () => K.LIGHTS.revenge },
  { name: 'день, солнце справа сзади', light: () => K.LIGHTS.endeavour },
  { name: 'туман + фонарь слева вверху', light: (bx, y) => ({ time: 'fog', haze: .6, key: { type: 'point', x: bx + 8, y: y - 8, h: .6, gy: y + 14, radius: 70, color: '#ffc070', power: .9 }, fill: { color: '#3a6a5c', power: .46 } }) },
];
const materials = { w: X0 + COL * 4 + 4, h: Y0 + ROW * K.KINDS.length + 6, bg: '#1c1c1c', svg: () => {
  let s = '';
  SCHEMES.forEach((sc, j) => { const bx = X0 + j * COL, P = K.makeLight(sc.light(bx, 100), { horizon: HZ }).pal, gid = 'kstandbg' + j;
    s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[3]}"/></linearGradient></defs>`
      + `<rect x="${bx}" y="${Y0 - 4}" width="${COL - 2}" height="${ROW * K.KINDS.length + 6}" fill="url(#${gid})"/>` + label(bx + COL / 2 - 1, 12, sc.name, 'middle', 5.2); });
  K.KINDS.forEach((kind, i) => { const y = Y0 + i * ROW + ROW / 2;
    s += label(4, y + 2, kind, 'start', 5.4);
    SCHEMES.forEach((sc, j) => { const bx = X0 + j * COL, u = `M${i}x${j}`, L = K.makeLight(sc.light(bx, y), { horizon: HZ });
      const c1 = bx + 15, c2 = bx + 44, c3 = bx + 64;
      s += K.shadeSphere(u, c1, y, 10.5, L, kind) + K.shadeCyl(u, c2, y + 11, c2, y - 10, 7.5, L, kind, { ell: .3, face: 2, seed: i * 7 + j })
        + K.shadeBox(u, K.boxFaces(c3, y + 11, 15, 16, 6, 4), L, kind, { seed: i * 5 + j });
      if (L.point) s += `<circle cx="${f(L.key.x)}" cy="${f(L.key.y)}" r="1.6" fill="#ffe2a0"/>`; });
  });
  return s;
} };
// ——— environments ———
const panel = (x, y, body, cap) => `<svg x="${x}" y="${y}" width="200" height="280" viewBox="0 0 200 280">${body}</svg><rect x="${x}" y="${y}" width="200" height="280" fill="none" stroke="#fff" stroke-width=".8"/>`
  + `<text x="${x + 4}" y="${y + 9}" font-family="sans-serif" font-size="6.5" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${cap}</text>`;
const splashes = (u, L, y, w, h) => [0, 1, 2].map(k => K.splash(u + 'p' + k, { x: 40 + k * 60, y: y + k * 4, w, h, seed: k, L })).join('');
const env = { w: 400, h: 560, bg: '#222', svg: () => {
  const A = (() => { const u = 'EA', L = K.makeLight(Object.assign({}, K.LIGHTS.pearl, { key: Object.assign({}, K.LIGHTS.pearl.key, { x: 150, y: 46, az: null, el: null }) }), { horizon: HZ });
    return K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L) + K.cloud(u, L, { x: 60, y: 70, w: 70, h: 24, seed: 2 }) + K.cloudBank(u, L, { y: HZ - 6, h: 12, x0: 0, x1: 200, n: 5, seed: 3, far: .7 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .6 }) + splashes(u, L, 196, 18, 40) + K.foam(u, { x: 100, y: 262, w: 120, L, seed: 2 }); })();
  const B = (() => { const u = 'EB', L = K.makeLight(K.LIGHTS.endeavour, { horizon: HZ });
    return K.sky(u, L, { horizon: HZ }) + K.cloud(u, L, { x: 70, y: 60, w: 80, h: 30, seed: 4 }) + K.cloud(u, L, { x: 160, y: 84, w: 50, h: 16, seed: 5, far: .5 }) + K.cloudBank(u, L, { y: HZ - 4, h: 10, x0: 0, x1: 200, n: 6, seed: 6, far: .8 })
      + K.water(u, L, { horizon: HZ, bottom: 216, swell: .5 }) + splashes(u, L, 172, 16, 36) + K.foam(u, { x: 110, y: 204, w: 110, L, seed: 6 }) + K.deck(u, L, { horizon: HZ, top: 214, bottom: 280 }); })();
  const C = (() => { const u = 'EC', L = K.makeLight(K.LIGHTS.revenge, { horizon: HZ }), fl = [[30, 168, -6], [100, 172, 4], [160, 166, -14]];
    let s = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L) + K.cloudBank(u, L, { y: HZ - 10, h: 14, x0: 0, x1: 200, n: 4, seed: 7, far: .5 }) + K.water(u, L, { horizon: HZ, bottom: 200 }) + K.deck(u, L, { horizon: HZ, top: 200, bottom: 280 });
    s += K.smoke(u, L, { x: 72, y: 250, w: 40, h: 90, wind: .5, seed: 4, glow: { color: '#ff9a40', power: .6 } }) + K.fire(u, { x: 70, y: 264, w: 22, h: 34, seed: 3, wind: .5, fuel: true }) + K.fire(u, { x: 150, y: 270, w: 12, h: 18, seed: 5, wind: .5, fuel: true });
    fl.forEach(([x, y, d], k) => { s += K.smoke(u + 's' + k, L, { x: x + 14, y: y + 2, w: 26, h: 26, wind: .8, seed: 9 + k, opacity: .8 }) + K.muzzleFlash(u + 'f' + k, { x, y, dir: d, len: 30, seed: k }); });
    return s; })();
  const D = (() => { const u = 'ED', L = K.makeLight(K.LIGHTS.dutchman, { horizon: HZ });
    return K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L) + K.water(u, L, { horizon: HZ, bottom: 280 }) + K.ship(u, L, { kind: 'dutch', x: 130, y: 122, scale: .5, detail: 'far' })
      + K.fog(u, L, { y: 96, h: 50, seed: 2 }) + K.smoke(u, L, { x: 49, y: 194, w: 30, h: 70, wind: -.3, seed: 8 }) + K.foam(u, { x: 50, y: 202, w: 30, L, seed: 9 }) + K.fire(u, { x: 50, y: 201, w: 12, h: 14, seed: 4, wind: -.3, fuel: true }) + K.fog(u, L, { y: 180, h: 70, density: .5, seed: 5 }) + K.splash(u, { x: 150, y: 240, w: 20, h: 44, seed: 1, L }); })();
  return panel(0, 0, A, 'ночь: луна, облака, зыбь, всплески ×3, пена') + panel(200, 0, B, 'день: облака, вода, всплески ×3, палуба')
    + panel(0, 280, C, 'закат: огонь, дым с подсветкой, вспышки ×3') + panel(200, 280, D, 'туман: туман, горящие обломки, дым, всплеск');
} };

module.exports = { sheets: { materials, env } };
