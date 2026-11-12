// Check sheets of the ships (kit/ship.cjs): one sheet per ship — large in the light of its deck, the one-tone silhouette,
// the mid and far versions, the size on a printed card back. Render: node tools/card-art/kit-sheet.mjs <this file>.
'use strict';
const K = require('../index.cjs');
const DECK = { pearl: 'pearl', revenge: 'revenge', endeavour: 'endeavour', dutch: 'dutchman', merchant: 'sea', brig: 'endeavour' };
const fit = (kind, maxW, maxH) => { const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }); return Math.min(maxW / b.w, maxH / b.h); };
const panel = (x, y, w, h, vw, vh, body) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid slice">${body}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-width="1"/>`;
const scene = (u, kind, o) => {
  const hz = o.horizon, L = K.makeLight(K.LIGHTS[DECK[kind]], { horizon: hz });
  let s = K.sky(u, L, { horizon: hz }) + K.sunMoon(u, L) + K.cloudBank(u, L, { y: hz - 14, h: 16, x0: 0, x1: 200, n: 4, seed: 5, far: .6 }) + K.water(u, L, { horizon: hz, bottom: o.vh });
  for (const p of o.ships) s += K.ship(u, L, Object.assign({ kind }, p));
  return s;
};
const sheet = kind => ({ w: 400, h: 280, bg: '#222', svg: () => {
  const s1 = fit(kind, 176, 128), s2 = fit(kind, 120, 62);
  const big = scene('A' + kind, kind, { horizon: 150, vh: 215, ships: [{ x: 100, y: 160, scale: s1, wake: true, reflect: true, lights: true }] });
  const sil = `<rect width="200" height="133" fill="#e9dfc8"/>` + K.shipSilhouette(kind, { x: 100, y: 110, scale: fit(kind, 170, 96), u: 'S' + kind });
  const mid = scene('B' + kind, kind, { horizon: 78, vh: 133, ships: [{ x: 118, y: 96, scale: s2 * 1.25, detail: 'mid', flip: true, heel: 0, sails: 'reefed', wake: true, reflect: true }] });
  const far = scene('C' + kind, kind, { horizon: 78, vh: 133, ships: [{ x: 60, y: 81, scale: s2 * .42, detail: 'far' }, { x: 150, y: 84, scale: s2 * .6, detail: 'far', flip: true, sails: 'furled' }] });
  return panel(0, 0, 260, 280, 200, 215, big) + panel(260, 0, 140, 93, 200, 133, sil) + panel(260, 93, 140, 93, 200, 133, mid) + panel(260, 186, 140, 94, 200, 133, far);
} });
const sheets = {};
for (const k of ['pearl', 'revenge', 'endeavour', 'dutch', 'merchant', 'brig']) sheets['ship-' + k] = sheet(k);
module.exports = { sheets };
