// Check sheets of the things (kit/props.cjs): every thing large, standing on its support (deck, table, pier), in at
// least two light schemes, with its cast and contact shadow, and the variants (a gun at rest and firing, a port
// shut and open, a chest shut and open, casks standing, lying and open). Each sheet is 2 x 2 card-size panels
// (200 x 280 units, the camera of the kit: horizon 108). Render: node tools/card-art/kit-sheet.mjs <this file>.
'use strict';
const K = require('../index.cjs');
const P = require('../props.cjs');

const HZ = 108;
const panel = (x, y, body, cap) => `<svg x="${x}" y="${y}" width="200" height="280" viewBox="0 0 200 280">${body}</svg><rect x="${x}" y="${y}" width="200" height="280" fill="none" stroke="#fff" stroke-width=".8"/>`
  + `<text x="${x + 4}" y="${y + 9}" font-family="sans-serif" font-size="6.5" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${cap}</text>`;
const sheet = (cells, caps) => ({ w: 400, h: 560, bg: '#222', svg: () => cells.map((c, i) => panel((i % 2) * 200, Math.floor(i / 2) * 280, c(), caps[i])).join('') });

// light schemes
const NIGHT = K.LIGHTS.pearl;                                                     // the moon in front, right
const DAY = K.LIGHTS.endeavour;                                                   // high sun, right and behind us
const DUSK = K.LIGHTS.revenge;                                                    // low sun from the left
const WINDOW = { time: 'day', haze: .2, key: { type: 'sun', az: 250, el: 32, color: '#fff0d0', power: .95 }, fill: { color: '#8a9cb8', power: .4 } }; // a cabin window to the left
const lamp = (loc, time = 'night') => ({ time, haze: .3, key: Object.assign({ type: 'point' }, loc), fill: { color: '#34486c', power: .3 } });

/** castShadow + the thing: w, h — the thing's foot width and height in picture units, d — depth to width. */
const put = (u, L, fn, o, w, h, d) => K.castShadow(u, L, { x: o.x, y: o.y, w, h, horizon: HZ, d }) + fn(u, L, o);
const deckScene = (u, L, o = {}) => {
  let s = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L) + K.cloudBank(u, L, { y: HZ - 10, h: 14, x0: 0, x1: 200, n: 4, seed: 4, far: .6 }) + K.water(u, L, { horizon: HZ, bottom: 175 });
  if (o.wall !== false) s += P.bulwark(u, L, { x1: 0, x2: 200, y: o.wallY || 172, h: o.wallH || 38, seed: o.seed || 27 });
  return s + K.deck(u, L, { horizon: HZ, top: o.wallY || 172, bottom: 280, seed: o.seed || 8 });
};
const tableScene = (u, L) => P.bulwark(u, L, { x1: 0, x2: 200, y: 160, h: 160, kind: 'oak', posts: 60, seed: 31 }) + K.deck(u, L, { horizon: HZ, top: 160, bottom: 280, kind: 'oak', plank: 34, seed: 12 });

// ——— sheet 1: the gun ———
const gun = { x: 96, y: 246, s: 2.1, side: false, seed: 6 };
const guns = [
  () => { const u = 'GA', L = K.makeLight(NIGHT, { horizon: HZ });
    return deckScene(u, L) + put(u, L, P.cannon, gun, 64, 44, .5) + put(u, L, P.shotPile, { x: 168, y: 268, s: 1.3, seed: 2 }, 26, 16) + put(u, L, P.shot, { x: 30, y: 272, s: 1.5, seed: 4 }, 9, 9); },
  () => { const u = 'GB', L = K.makeLight(DUSK, { horizon: HZ }), o = Object.assign({}, gun, { recoil: .7, elev: 4, seed: 7 }), m = P.cannon.muzzle(o);
    return deckScene(u, L, { seed: 3 }) + put(u, L, P.cannon, o, 64, 44, .5) + K.smoke(u, L, { x: m.x + 18, y: m.y - 2, w: 40, h: 60, wind: .6, seed: 3, glow: { color: '#ffb050', power: .4 } }) + K.muzzleFlash(u, { x: m.x, y: m.y, dir: m.dir, len: 40, seed: 2 }) + K.localGlow(u, { x: m.x, y: m.y + 40, color: '#ffc070', power: .55, radius: 60 }, { squash: .35, core: false }); },
  () => { const u = 'GC', L = K.makeLight(DAY, { horizon: HZ }), side = K.mat('tar', L, { form: 'plane', x1: 0, y1: 70, x2: 200, y2: 250, n: 'front', u });
    let s = K.sky(u, L, { horizon: HZ }) + K.water(u, L, { horizon: HZ, bottom: 280 }) + side.defs + `<path d="M0 70Q100 62 200 70V246Q100 254 0 246Z" fill="${side.fill}" stroke="${side.ramp.outline}" stroke-width=".6"/>`;
    for (let i = 0, y = 82; y < 240; i++, y += 9 + (i % 3) * 1.6) s += `<path d="M0 ${y}Q100 ${y - 7 + y * .03} 200 ${y}" stroke="${side.ramp.outline}" stroke-width=".45" fill="none" opacity=".55"/>`;
    s += K.foam(u, { x: 100, y: 250, w: 200, L, seed: 3 });
    return s + P.gunPort(u, L, { x: 38, y: 180, s: 1.9, open: 0, seed: 1 }) + P.gunPort(u, L, { x: 102, y: 180, s: 1.9, open: .5, seed: 2 }) + P.gunPort(u, L, { x: 164, y: 180, s: 1.9, open: 1, seed: 3 }); },
  () => { const u = 'GD', lo = { x: 46, y: 118, s: 1.7, hang: 18, lit: true }, loc = P.lantern.local(lo), L = K.makeLight(lamp(loc), { horizon: HZ });
    return deckScene(u, L, { wallY: 200, wallH: 92, seed: 5 }) + P.gunPort(u, L, { x: 118, y: 180, s: 2.6, inside: true, horizon: HZ, seed: 4 }) + K.localGlow(u, Object.assign({}, loc, { y: 236, radius: 70, power: .4 }), { squash: .3, core: false })
      + put(u, L, P.shotPile, { x: 112, y: 258, s: 1.5, seed: 5 }, 30, 18) + put(u, L, P.shot, { x: 170, y: 268, s: 1.6, seed: 6 }, 10, 10) + put(u, L, P.shot, { x: 58, y: 272, s: 1.6, seed: 8 }, 10, 10) + P.lantern(u, L, lo) + K.localGlow(u, loc); },
];

// ——— sheet 2: stores on the deck ———
const casks = (u, L) => put(u, L, P.barrel, { x: 42, y: 214, s: 1.75, kind: 'rum', seed: 3 }, 38, 52) + put(u, L, P.barrel, { x: 104, y: 206, s: 1.55, kind: 'powder', seed: 5 }, 34, 46)
  + put(u, L, P.barrel, { x: 162, y: 222, s: 1.6, kind: 'water', open: true, seed: 9 }, 35, 48) + put(u, L, P.barrel, { x: 98, y: 266, s: 1.75, kind: 'rum', lying: true, seed: 11 }, 52, 34, .6);
const boxes = (u, L) => put(u, L, P.chest, { x: 56, y: 208, s: 1.85, seed: 2 }, 56, 32, .35) + put(u, L, P.chest, { x: 146, y: 222, s: 1.85, open: true, flip: true, seed: 3 }, 56, 34, .35)
  + put(u, L, P.crate, { x: 52, y: 268, s: 1.8, seed: 4 }, 40, 29, .45) + put(u, L, P.sack, { x: 150, y: 272, s: 1.8, seed: 5 }, 34, 36, .7);
const stores = [
  () => { const u = 'SA', L = K.makeLight(DAY, { horizon: HZ }); return deckScene(u, L) + casks(u, L); },
  () => { const u = 'SB', lo = { x: 150, y: 278, s: 1.5, lit: true }, loc = P.lantern.local(Object.assign({ horizon: HZ }, lo)), L = K.makeLight(lamp(loc), { horizon: HZ });
    return deckScene(u, L, { seed: 6 }) + casks(u, L) + K.localGlow(u, Object.assign({}, loc, { y: 270, radius: 80, power: .45 }), { squash: .3, core: false }) + P.lantern(u, L, lo) + K.localGlow(u, loc); },
  () => { const u = 'SC', L = K.makeLight(DUSK, { horizon: HZ }); return deckScene(u, L, { seed: 2 }) + boxes(u, L); },
  () => { const u = 'SD', L = K.makeLight(NIGHT, { horizon: HZ }); return deckScene(u, L, { seed: 7 }) + boxes(u, L); },
];

// ——— sheet 3: on the cabin table ———
const tableA = (u, L, lit) => put(u, L, P.hourglass, { x: 38, y: 250, s: 2, seed: 1 }, 20, 32) + put(u, L, P.bottle, { x: 62, y: 204, s: 1.7, kind: 'rum', seed: 2 }, 16, 34)
  + put(u, L, P.candle, { x: 104, y: 200, s: 1.9, lit, seed: 3 }, 16, 30) + put(u, L, P.mug, { x: 150, y: 214, s: 2, fill: 'rum', seed: 4 }, 18, 22) + put(u, L, P.coins, { x: 120, y: 258, s: 2, seed: 5 }, 22, 6)
  + put(u, L, P.bottle, { x: 168, y: 262, s: 1.6, kind: 'empty', lying: true, flip: true, seed: 6 }, 32, 14, .5);
const tableB = (u, L) => put(u, L, P.scroll, { x: 72, y: 206, s: 2.4, seed: 1 }, 46, 6, .5) + put(u, L, P.pistol, { x: 146, y: 230, s: 1.9, seed: 2 }, 50, 8, .4)
  + put(u, L, P.sabre, { x: 92, y: 258, s: 1.9, rot: -6, seed: 3 }, 86, 5, .2) + put(u, L, P.coins, { x: 34, y: 246, s: 1.7, n: 5, seed: 7 }, 18, 5);
const table = [
  () => { const u = 'TA', co = { x: 104, y: 200, s: 1.9 }, loc = P.candle.local(co), L = K.makeLight(lamp(loc), { horizon: HZ });
    return tableScene(u, L) + K.localGlow(u, Object.assign({}, loc, { y: 205, radius: 90, power: .45 }), { squash: .32, core: false }) + tableA(u, L, true) + K.localGlow(u, loc); },
  () => { const u = 'TB', L = K.makeLight(WINDOW, { horizon: HZ }); return tableScene(u, L) + tableA(u, L, false); },
  () => { const u = 'TC', lo = { x: 168, y: 186, s: 1.4, lit: true }, loc = P.lantern.local(Object.assign({ horizon: HZ }, lo)), L = K.makeLight(lamp(loc), { horizon: HZ });
    return tableScene(u, L) + K.localGlow(u, Object.assign({}, loc, { y: 192, radius: 90, power: .45 }), { squash: .32, core: false }) + tableB(u, L) + put(u, L, P.lantern, lo, 18, 40) + K.localGlow(u, loc); },
  () => { const u = 'TD', L = K.makeLight(DUSK, { horizon: HZ }), lo = { x: 168, y: 186, s: 1.4, lit: false }; return tableScene(u, L) + tableB(u, L) + put(u, L, P.lantern, lo, 18, 40); },
];

// ——— sheet 4: harbour and rigging ———
const pierO = { horizon: HZ, vx: 140, x1: 24, x2: 176, y: 280, far: 136, drop: 30, seed: 28 };
const harbour = (u, L) => { const a = P.pier.at(L, pierO, .32, .35), c = P.pier.at(L, pierO, .08, -.45);
  return K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L) + K.cloudBank(u, L, { y: HZ - 12, h: 16, x0: 0, x1: 200, n: 4, seed: 6, far: .5 }) + K.water(u, L, { horizon: HZ, bottom: 280 })
    + P.rock(u, L, { x: 26, y: 168, s: 1.4, w: 34, h: 26, wet: true, seed: 3 }) + P.rock(u, L, { x: 176, y: 128, s: .7, w: 30, h: 18, wet: true, seed: 8 })
    + P.pier(u, L, Object.assign({ bollard: false }, pierO)) + put(u, L, P.bollard, { x: a.x, y: a.y, s: a.s * 2.2, rope: true, seed: 2 }, 30 * a.s, 24 * a.s, .5) + put(u, L, P.coil, { x: c.x, y: c.y, s: c.s * 1.6, seed: 4 }, 34 * c.s, 5 * c.s); };
const rigging = (u, L) => { const an = { x: 38, y: 250, s: 1.4, rot: 14, seed: 2 }, ring = P.anchor.ring(an);
  return put(u, L, P.anchor, an, 40, 56, .3) + P.chain(u, L, [[ring.x, ring.y], [ring.x + 14, ring.y + 40], [ring.x + 30, 262], [ring.x + 70, 268], [ring.x + 92, 258]], { link: 6, seed: 3 })
    + put(u, L, P.bell, { x: 150, y: 222, s: 1.65, seed: 4 }, 40, 56, .5) + put(u, L, P.coil, { x: 128, y: 264, s: 1.55, seed: 5 }, 36, 6)
    + P.rope(u, L, [[96, 200], [80, 214], [92, 232], [70, 244]], { r: 1.4, seed: 6, whip: true }); };
const rig = [
  () => { const u = 'RA', L = K.makeLight(K.LIGHTS.sea, { horizon: HZ }); return harbour(u, L); },
  () => { const u = 'RB', L = K.makeLight(NIGHT, { horizon: HZ }); return harbour(u, L); },
  () => { const u = 'RC', L = K.makeLight(DAY, { horizon: HZ }); return deckScene(u, L, { seed: 9 }) + rigging(u, L); },
  () => { const u = 'RD', lo = { x: 100, y: 128, s: 1.5, hang: 16, lit: true }, loc = P.lantern.local(lo), L = K.makeLight(lamp(loc), { horizon: HZ });
    return deckScene(u, L, { seed: 10 }) + K.localGlow(u, Object.assign({}, loc, { y: 236, radius: 80, power: .4 }), { squash: .3, core: false }) + rigging(u, L) + P.lantern(u, L, lo) + K.localGlow(u, loc); },
];

module.exports = { sheets: {
  'props-guns': sheet(guns, ['пушка, ночь (луна)', 'выстрел, откат, закат', 'порты снаружи: закрыт / ½ / открыт, день', 'порт изнутри, ядра, фонарь']),
  'props-stores': sheet(stores, ['бочки: ром, порох, вода открытая, лёжа — день', 'бочки — фонарь на палубе', 'сундуки закрыт/открыт, ящик, мешок — закат', 'то же — ночь (луна)']),
  'props-table': sheet(table, ['стол: часы, бутылки, свеча, кружка, монеты — свеча', 'то же — день из окна слева', 'свиток, пистолет, сабля, монеты, фонарь — фонарь', 'то же — закат, фонарь погашен']),
  'props-rig': sheet(rig, ['причал, кнехт с канатом, бухта, камни — день', 'то же — ночь (луна)', 'якорь, цепь, колокол, бухта, канат — день', 'то же — фонарь']),
} };
