// Check sheets of the flags and pennants (kit/ship.cjs: flagCloth, shipFlag, opts.wind). Render:
//   node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/flags.cjs --out <dir> --width 1000
// 'flags' — every design large, the wind to the left and to the right, by day and at night (needs shipFlag);
// 'ships' — the Pearl and the Endeavour whole with gun smoke in the same wind, and close views of their flags (this
// sheet also renders with an older kit, for «before | after»).
'use strict';
const K = require('../index.cjs');
const panel = (x, y, w, h, vb, body) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${body}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-width="1"/>`;
const tag = (x, y, t) => `<text x="${x + 5}" y="${y + 12}" font-family="DejaVu Sans,sans-serif" font-size="9" fill="#fff" stroke="#000" stroke-width="2.2" paint-order="stroke">${t}</text>`;
const LT = { day: K.LIGHTS.sea, night: K.LIGHTS.pearl };
const windOf = K.shipWind || (o => o.wind ? Math.sign(o.wind) : o.flip ? 1 : -1);

// ——— sheet 1: the designs ———
const DESIGNS = [
  ['jolly', 'череп и кости', {}], ['company', 'флаг Компании', {}], ['merchant', 'торговый (полосы)', {}], ['trade', 'торговый (красный, охра)', {}],
  ['plain', 'простой', {}], ['pennant', 'вымпел красный, раздвоенный', { fork: 1 }], ['pennant', 'вымпел чёрный, рваный', { color: 'ship-flag-black', torn: 1 }], ['pennant', 'вымпел белый', { color: 'linen' }]];
const COLS = [['day', -1, 'день, ветер влево'], ['day', 1, 'день, ветер вправо'], ['night', -1, 'ночь, ветер влево'], ['night', 1, 'ночь, ветер вправо']];
const flagPanel = (u, time, wind, design, ex) => { const L = K.makeLight(LT[time], { horizon: 140 }), pen = design === 'pennant';
  const sc = pen ? 7.4 : 12, x = wind < 0 ? 176 : 24, y = pen ? 44 : 22;
  return K.sky(u, L, { horizon: 140 }) + K.shipFlag(u, L, Object.assign({ x, y, scale: sc, design, wind, staff: pen ? 0 : 1.4, seed: 3 }, ex)); };
const sheets = {};
if (K.shipFlag) sheets.flags = { w: 800, h: 8 * 100, bg: '#1d1d1d', svg: () => { let s = '';
  DESIGNS.forEach(([d, name, ex], r) => COLS.forEach(([time, wind, t], c) => {
    s += panel(c * 200, r * 100, 200, 100, '0 0 200 100', flagPanel(`F${r}${c}`, time, wind, d, ex)) + tag(c * 200, r * 100, `${name} — ${t}`); }));
  return s; } };

// ——— sheet 2: two ships whole with smoke in the same wind, and their flags close ———
const fit = (kind, maxW) => maxW / K.shipBox(kind, { x: 0, y: 0, scale: 1 }).w;
const SHIPS = [
  ['pearl', 'night', {}, '«Жемчужина», ночь, нос влево'], ['pearl', 'day', { flip: true }, '«Жемчужина», день, нос вправо'],
  ['endeavour', 'day', {}, '«Индевор», день, нос влево'], ['endeavour', 'night', { flip: true }, '«Индевор», ночь, нос вправо']];
const place = (kind, p) => { const sc = fit(kind, 170), b = K.shipBox(kind, Object.assign({ x: 0, y: 0, scale: sc }, p)); return Object.assign({ kind, x: 100 - (b.x0 + b.x1) / 2, y: 122, scale: sc, seed: 4 }, p); };
const shipPanel = (u, kind, time, p) => { const L = K.makeLight(LT[time], { horizon: 108 }), o = place(kind, p), w = windOf(o);
  let s = K.sky(u, L, { horizon: 108 }) + K.sunMoon(u, L) + K.water(u, L, { horizon: 108, bottom: 150 }) + K.ship(u, L, Object.assign({ wake: true, reflect: true, lights: true }, o));
  // a shot from the waist: the smoke drifts with the same wind as the flags
  s += K.smoke(u, L, { x: o.x - w * 8, y: o.y - 6, w: 30, h: 46, wind: .75 * w, seed: 6, opacity: .8 });
  return { s, o }; };
// the flag's places in scene units, from the ship's own parameters (no heel, no roll)
const flagView = (o, which) => { const sp = K.SHIP_SPECS[o.kind], g = K.shipGeom(o.kind, o), dir = o.flip ? -1 : 1, w = windOf(o), s = o.scale;
  if (which === 'main') { const t = g.masts.reduce((a, b) => b.H > a.H ? b : a).top, L = sp.len / 100; return [t[0] + w * 7 * L * s, t[1] - 4 * L * s, 30 * L * s]; }
  const xA = sp.len / 2 + sp.over, k = sp.ensignK || 1, X = xA + sp.tw[0] * .92 + 4 * k, H = g.rail(xA) + 16 * k;
  return [o.x + dir * s * X + w * 7 * k * s, o.y - s * (H - 5 * k), 30 * k * s]; };
sheets.ships = { w: 800, h: 400, bg: '#1d1d1d', svg: () => { let s = '', c = 0;
  SHIPS.forEach(([kind, time, p, t], i) => { const { s: body, o } = shipPanel(`S${i}`, kind, time, p);
    s += panel(i * 200, 0, 200, 150, '0 0 200 150', body) + tag(i * 200, 0, t);
    const [cx, cy, w] = flagView(o, 'main'), h = w * .62;
    s += panel(i * 200, 150, 200, 125, `${cx - w / 2} ${cy - h / 2} ${w} ${h}`, body) + tag(i * 200, 150, 'флаги у топа, крупно');
    if (kind === 'endeavour') { const [ex, ey, ew] = flagView(o, 'ens'), eh = ew * .62; s += panel(c * 200, 275, 200, 125, `${ex - ew / 2} ${ey - eh / 2} ${ew} ${eh}`, body) + tag(c * 200, 275, 'кормовой флаг «Индевора»'); c++; } });
  // the option wind: the same Pearl, sails furled, the wind against her bow (at anchor): the flags fly astern
  if (K.shipWind) { const L = K.makeLight(LT.day, { horizon: 108 }), o = place('pearl', { wind: 1, sails: 'furled' }), body = K.sky('W', L, { horizon: 108 }) + K.water('W', L, { horizon: 108, bottom: 150 }) + K.ship('W', L, Object.assign({ reflect: true }, o)) + K.smoke('W', L, { x: o.x + 20, y: o.y - 6, w: 30, h: 46, wind: .75, seed: 6, opacity: .8 });
    s += panel(400, 275, 200, 125, '0 12 200 125', body) + tag(400, 275, 'wind: 1 — ветер в нос (на якоре)');
    const e = place('endeavour', { wind: -1, flip: true, sails: 'furled' }), body2 = K.sky('W2', L, { horizon: 108 }) + K.water('W2', L, { horizon: 108, bottom: 150 }) + K.ship('W2', L, Object.assign({ reflect: true }, e));
    const [ex, ey, ew] = flagView(e, 'ens'), eh = ew * .62;
    s += panel(600, 275, 200, 125, `${ex - ew / 2} ${ey - eh / 2} ${ew} ${eh}`, body2) + tag(600, 275, '«Индевор», wind: −1, нос вправо'); }
  return s; } };
module.exports = { sheets };
