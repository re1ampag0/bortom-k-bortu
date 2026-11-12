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
// The roll (opts.roll, degrees; + towards the viewer): one sheet per ship — row 1 night, row 2 day, roll −15 … 15 and
// 8 together with heel 4; row 3 flip, the one-tone silhouette, far. Every panel 200 × 150 units.
const ROLLS = [-15, -8, 0, 8, 15];
const rollPanel = (u, kind, light, p, o = {}) => { const hz = 96, L = K.makeLight(light, { horizon: hz }), sc = fit(kind, 172, 84) * (o.k || 1);
  let s = K.sky(u, L, { horizon: hz }) + K.sunMoon(u, L) + K.cloudBank(u, L, { y: hz - 12, h: 14, x0: 0, x1: 200, n: 4, seed: 5, far: .6 }) + K.water(u, L, { horizon: hz, bottom: 150 });
  if (o.sil) return `<rect width="200" height="150" fill="#e9dfc8"/>` + K.shipSilhouette(kind, Object.assign({ x: 100, y: 120, scale: sc, u }, p));
  return s + K.ship(u, L, Object.assign({ kind, x: 100, y: 120, scale: sc, wake: true, reflect: true, lights: true }, p)); };
const tag = (x, y, t) => `<text x="${x + 6}" y="${y + 14}" font-family="DejaVu Sans,sans-serif" font-size="10" fill="#fff" stroke="#000" stroke-width="2.4" paint-order="stroke">${t}</text>`;
const rollSheet = kind => ({ w: 1200, h: 450, bg: '#222', svg: () => {
  const night = K.LIGHTS[DECK[kind] === 'endeavour' || DECK[kind] === 'sea' ? 'pearl' : DECK[kind]], day = K.LIGHTS.sea; let s = '';
  const cell = (c, r, body, t) => { s += panel(c * 200, r * 150, 200, 150, 200, 150, body) + tag(c * 200, r * 150, t); };
  ROLLS.forEach((rl, c) => { cell(c, 0, rollPanel(`R${kind}n${c}`, kind, night, { roll: rl }), `ночь, roll ${rl}`); cell(c, 1, rollPanel(`R${kind}d${c}`, kind, day, { roll: rl }), `день, roll ${rl}`); });
  cell(5, 0, rollPanel(`R${kind}nh`, kind, night, { roll: 8, heel: 4 }), 'ночь, roll 8 + heel 4'); cell(5, 1, rollPanel(`R${kind}dh`, kind, day, { roll: 8, heel: 4 }), 'день, roll 8 + heel 4');
  cell(0, 2, rollPanel(`R${kind}f1`, kind, day, { roll: -15, flip: true }), 'flip, roll −15'); cell(1, 2, rollPanel(`R${kind}f2`, kind, day, { roll: 15, flip: true }), 'flip, roll 15');
  cell(2, 2, rollPanel(`R${kind}f3`, kind, night, { roll: 8, heel: 4, flip: true }), 'flip, roll 8 + heel 4');
  cell(3, 2, rollPanel(`R${kind}s1`, kind, day, { roll: 15 }, { sil: true }), 'силуэт, roll 15'); cell(4, 2, rollPanel(`R${kind}s2`, kind, day, { roll: -15 }, { sil: true }), 'силуэт, roll −15');
  cell(5, 2, rollPanel(`R${kind}far`, kind, day, { roll: 12, detail: 'mid', sails: 'reefed' }, { k: .6 }), 'mid, reefed, roll 12');
  return s;
} });
for (const k of ['pearl', 'revenge', 'endeavour', 'dutch', 'merchant', 'brig']) sheets['roll-' + k] = rollSheet(k);
// For the user: the Pearl and the merchantman, roll −15 / 0 / +15, labels in Russian.
sheets['roll-user'] = { w: 600, h: 322, bg: '#1d1d1d', svg: () => { let s = '';
  const NAMES = { pearl: '«Чёрная жемчужина»', merchant: 'торговое судно' }, RL = [[-15, 'крен от зрителя 15°'], [0, 'без крена'], [15, 'крен на зрителя 15°']];
  ['pearl', 'merchant'].forEach((k, r) => RL.forEach(([rl, t], c) => { const L = K.LIGHTS.sea;
    s += panel(c * 200, 14 + r * 160, 200, 146, 200, 146, rollPanel(`U${k}${c}`, k, L, { roll: rl }, { k: 1.08 }))
      + `<text x="${c * 200 + 100}" y="${10 + r * 160}" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="8" fill="#eee">${NAMES[k]} — ${t}</text>`; }));
  return s; } };
// All six ships in one row in ONE scale (the user's sheet «было — стало»): day light, no roll; names in Russian.
const SIX = ['pearl', 'revenge', 'endeavour', 'dutch', 'merchant', 'brig'], SIX_NAMES = { pearl: '«Чёрная жемчужина»', revenge: '«Месть королевы Анны»', endeavour: '«Индевор»', dutch: '«Летучий голландец»', merchant: 'торговое судно', brig: 'бриг' };
// Row 2: the hulls of the same panels, 2.2 times closer (the gun ports, the stern, the head).
sheets['six'] = { w: 1200, h: 290, bg: '#1d1d1d', svg: () => { const sc = Math.min(...SIX.map(k => fit(k, 194, 126))); let s = '';
  SIX.forEach((k, c) => { const b = K.shipBox(k, { x: 0, y: 0, scale: sc }), x = 100 - (b.x0 + b.x1) / 2, body = rollPanel('X' + k, k, K.LIGHTS.sea, { x, y: 136, scale: sc }), zw = 200 / 2.2, zh = 120 / 2.2;
    s += panel(c * 200, 16, 200, 150, 200, 150, body)
      + `<svg x="${c * 200}" y="170" width="200" height="120" viewBox="${100 - zw / 2 + 4} ${136 - zh * .72} ${zw} ${zh}" preserveAspectRatio="xMidYMid slice">${rollPanel('Z' + k, k, K.LIGHTS.sea, { x, y: 136, scale: sc })}</svg><rect x="${c * 200}" y="170" width="200" height="120" fill="none" stroke="#fff" stroke-width="1"/>`
      + `<text x="${c * 200 + 100}" y="11" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="9" fill="#eee">${SIX_NAMES[k]}</text>`; });
  return s; } };
module.exports = { sheets };
