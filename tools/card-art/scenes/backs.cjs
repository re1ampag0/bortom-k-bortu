// tools/card-art/scenes/backs.cjs — the card backs of the print kit (docs/tasks/print-kit.md 4.10), three designs:
//   1 «Корабль в море» — the deck's ship large in the light of its deck (kit LIGHTS), sky, water, a far detail;
//   2 «Гравюра» and 3 «Медальон» — later, as their own functions in VARIANTS.
// Contract with the print generator (tools/print/art.ts BackSpec, tools/print/cards.ts backHtml):
//   back(kind, variant) -> { svg, ground, tone, title, crest, letter, name }
//   kind: 'pearl' | 'revenge' | 'endeavour' | 'dutch' | 'sea'; svg — a full <svg viewBox="0 0 200 280"> (63 x 88 mm);
//   ground — the flat colour of the edge (the generator floods the bleed with it); tone — 'dark' (light lettering);
//   title { y }, crest { y, d }, letter { y, size } | null, name { y } — places of the lettering in picture units.
//   The picture holds no letters: the generator lays the game's title, the brass medallion with the deck's letter
//   and the ship's name over the calm places returned here.
// Print rules (summary 0а п. 5, review-print 5, review-player 4.1, review-art 19): nearer than 9 mm (28.6 units) to
// the edge — only the flat ground, no lines parallel to the edge: the picture dissolves into the ground, so a back
// printed 3 mm off shows the same edge on every card and does not betray its column.
// Deck colours — of the mock-up (review-repo 10): Ж #26262a, М #8e2420, И #24497a, Г #2f6b4a; sea — SEA.band.
'use strict';
const K = require('./kit/index.cjs');

const W = 200, H = 280, SAFE = 28.6;
const GROUND = { pearl: '#26262a', revenge: '#8e2420', endeavour: '#24497a', dutch: '#2f6b4a', sea: '#16404e' };
const KINDS = Object.keys(GROUND);
const f = v => String(+(+v).toFixed(2));
let seq = 0;
const bid = (p, u) => `bk${p}${u}n${seq++}`;

/** Light scheme of a deck with the sun or moon put at a place in the picture (x, y) instead of az / el. */
const lightAt = (name, x, y, extra = {}) => { const b = K.LIGHTS[name], key = { type: b.key.type, color: b.key.color, power: b.key.power, x, y }; return Object.assign({}, b, { key }, extra); };
/** Scale that fits a ship's box into maxW x maxH. */
const fitShip = (kind, maxW, maxH) => { const b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }); return Math.min(maxW / b.w, maxH / b.h); };

/**
 * The picture dissolves into the ground towards the edges: from the edge to SAFE — the ground only; then a smooth
 * (smoothstep) fade over F units on each side. No line anywhere: a 3 mm shift moves only a soft gradient.
 * F = { t, r, b, l } — the fade widths. KIT-CANDIDATE: the same edge for any back or full-bleed picture.
 */
function edgeFade(u, ground, F = {}) {
  const fw = { t: F.t != null ? F.t : 22, r: F.r != null ? F.r : 18, b: F.b != null ? F.b : 26, l: F.l != null ? F.l : 18 };
  const m = bid('m', u), stops = [[0, 1], [.15, .94], [.3, .78], [.45, .58], [.6, .35], [.75, .16], [.9, .03], [1, 0]]
    .map(([o, s]) => { const t = o, v = 1 - (3 * t * t - 2 * t * t * t); return `<stop offset="${o}" stop-color="#fff" stop-opacity="${f(v)}"/>`; }).join('');
  const g = { t: bid('gt', u), r: bid('gr', u), b: bid('gb', u), l: bid('gl', u) };
  const x0 = SAFE, x1 = W - SAFE, y0 = SAFE, y1 = H - SAFE;
  const defs = `<linearGradient id="${g.t}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y0)}" x2="0" y2="${f(y0 + fw.t)}">${stops}</linearGradient>`
    + `<linearGradient id="${g.b}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y1)}" x2="0" y2="${f(y1 - fw.b)}">${stops}</linearGradient>`
    + `<linearGradient id="${g.l}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="0" x2="${f(x0 + fw.l)}" y2="0">${stops}</linearGradient>`
    + `<linearGradient id="${g.r}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="0" x2="${f(x1 - fw.r)}" y2="0">${stops}</linearGradient>`
    + `<mask id="${m}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${W + 40}" height="${H + 40}"><rect x="-20" y="-20" width="${W + 40}" height="${H + 40}" fill="#fff"/>`
    + `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" fill="#000"/>`
    + `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(fw.t)}" fill="url(#${g.t})"/><rect x="${f(x0)}" y="${f(y1 - fw.b)}" width="${f(x1 - x0)}" height="${f(fw.b)}" fill="url(#${g.b})"/>`
    + `<rect x="${f(x0)}" y="${f(y0)}" width="${f(fw.l)}" height="${f(y1 - y0)}" fill="url(#${g.l})"/><rect x="${f(x1 - fw.r)}" y="${f(y0)}" width="${f(fw.r)}" height="${f(y1 - y0)}" fill="url(#${g.r})"/></mask>`;
  return `<defs>${defs}</defs><rect x="-20" y="-20" width="${W + 40}" height="${H + 40}" fill="${ground}" mask="url(#${m})"/>`;
}

/** A soft pool of the ground colour under the lettering (medallion and name): the water there is calm. */
function calm(u, ground, x, y, rx, ry, op) {
  const g = bid('cv', u);
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${f(x)}" cy="${f(y)}" r="${f(rx)}" gradientTransform="translate(0 ${f(y)}) scale(1 ${f(ry / rx)}) translate(0 ${f(-y)})"><stop offset="0" stop-color="${ground}" stop-opacity="${f(op)}"/><stop offset=".55" stop-color="${ground}" stop-opacity="${f(op * .7)}"/><stop offset="1" stop-color="${ground}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})"/>`;
}

const wrap = body => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// ——— variant 1 «Корабль в море» ———
// One layout for the five decks, so they read as a set: the title in the calm top (y 44), the ship large in the
// middle (waterline y 180), the medallion over calm water below it, the name under the medallion.
const PLACES1 = { title: { y: 44 }, crest: { y: 211, d: 34 }, letter: null, name: { y: 244 } };
const WL = 180, HZ = 168;

const SCENES1 = {
  // «Чёрная жемчужина»: night; the moon behind the ship (contre-jour): the black sails glow at the edges, a rim on
  // the hull, the moon path on the water under the stern; a Company ship far on the horizon.
  pearl: u => {
    const light = lightAt('pearl', 146, 78, { rim: { az: 330, color: '#cfe4ff', power: .7 } }), L = K.makeLight(light, { horizon: HZ });
    const sc = fitShip('pearl', 150, 124);
    return K.sky(u, L, { horizon: HZ, seed: 12, stars: 60 }) + K.sunMoon(u, L, { r: 8.5 })
      + K.cloudBank(u, L, { y: 132, h: 9, x0: 40, x1: 190, n: 3, seed: 31, far: .75 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .4, seed: 5 })
      + K.ship(u, L, { kind: 'endeavour', x: 52, y: HZ + 1.2, scale: .17, detail: 'far', flip: true, sails: 'reefed' })
      + K.ship(u, L, { kind: 'pearl', x: 98, y: WL, scale: sc, wake: true, reflect: true, lights: true });
  },
  // «Месть королевы Анны»: sunset from the left, low warm side light; a burning merchant far behind, its smoke
  // carried by the wind over the sky; the ship's bow to the right (the wind is the same for the flags and the smoke).
  revenge: u => {
    const L = K.makeLight(K.LIGHTS.revenge, { horizon: HZ });
    const sc = fitShip('revenge', 146, 128);
    return K.sky(u, L, { horizon: HZ, seed: 13 })
      + K.cloudBank(u, L, { y: 150, h: 11, x0: 10, x1: 190, n: 4, seed: 41, far: .65 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .45, seed: 6 })
      + K.smoke(u, L, { x: 58, y: HZ - 1, w: 70, h: 120, wind: .7, seed: 9, opacity: .8, glow: { color: '#ff8a3a', power: .45 } })
      + K.ship(u, L, { kind: 'merchant', x: 58, y: HZ + 1.4, scale: .2, detail: 'far', sails: 'furled' })
      + K.fire(u, { x: 58, y: HZ - .6, w: 7, h: 6, seed: 3 })
      + K.ship(u, L, { kind: 'revenge', x: 104, y: WL, scale: sc, flip: true, wake: true, reflect: true, lights: true });
  },
  // «Индевор»: day, a high sun from the right; white full sails, cumulus over the horizon, a brig far away.
  endeavour: u => {
    const L = K.makeLight(K.LIGHTS.endeavour, { horizon: HZ });
    const sc = fitShip('endeavour', 152, 128);
    return K.sky(u, L, { horizon: HZ, seed: 14 })
      + K.cloud(u, L, { x: 60, y: 104, w: 70, h: 26, seed: 51, far: .3 }) + K.cloudBank(u, L, { y: 156, h: 14, x0: 0, x1: 200, n: 5, seed: 52, far: .7 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .5, seed: 7 })
      + K.ship(u, L, { kind: 'brig', x: 150, y: HZ + 1.2, scale: .2, detail: 'far', flip: true })
      + K.ship(u, L, { kind: 'endeavour', x: 98, y: WL, scale: sc, wake: true, reflect: true });
  },
  // «Летучий голландец»: green fog, a pale moon behind; fog banks behind and over the water line, a ghost of a ship
  // far in the fog; the bow to the right.
  dutch: u => {
    const light = lightAt('dutchman', 116, 70), L = K.makeLight(light, { horizon: HZ });
    const sc = fitShip('dutch', 146, 126);
    return K.sky(u, L, { horizon: HZ, seed: 15 }) + K.sunMoon(u, L, { r: 9 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .35, seed: 8 })
      + K.ship(u, L, { kind: 'merchant', x: 52, y: HZ + 1.6, scale: .3, detail: 'far', flip: true, sails: 'reefed' })
      + K.fog(u, L, { y: HZ - 40, h: 54, density: .7, seed: 3 })
      + K.ship(u, L, { kind: 'dutch', x: 102, y: WL, scale: sc, flip: true, wake: true, reflect: true, lights: true })
      + K.fog(u, L, { y: WL - 12, h: 30, density: .45, seed: 4 });
  },
  // Колода моря: the open sea without the deck's ship; the sun behind clouds and its path; a merchant fluyt in the
  // middle distance, a brig far away; big swell in front.
  sea: u => {
    const hz = 150, light = lightAt('sea', 138, 96), L = K.makeLight(light, { horizon: hz });
    return K.sky(u, L, { horizon: hz, seed: 16 }) + K.sunMoon(u, L, { r: 7 })
      + K.cloud(u, L, { x: 132, y: 92, w: 64, h: 20, seed: 61, far: .25 }) + K.cloudBank(u, L, { y: 140, h: 12, x0: 0, x1: 200, n: 5, seed: 62, far: .7 })
      + K.water(u, L, { horizon: hz, bottom: 280, swell: .95, seed: 9 })
      + K.ship(u, L, { kind: 'brig', x: 150, y: hz + 1.4, scale: .26, detail: 'far', flip: true })
      + K.ship(u, L, { kind: 'merchant', x: 86, y: 172, scale: .95, detail: 'mid', wake: true, reflect: true, heel: 2 });
  },
};

function variant1(kind) {
  const u = 'b1' + kind.slice(0, 2), g = GROUND[kind];
  const body = SCENES1[kind](u) + calm(u, g, 100, 226, 66, 40, .62) + edgeFade(u, g);
  return Object.assign({ svg: wrap(body), ground: g, tone: 'dark' }, JSON.parse(JSON.stringify(PLACES1)));
}

// ——— the designs; 2 «Гравюра» and 3 «Медальон» are added here as variant2 / variant3 ———
const VARIANTS = { 1: variant1 };

function back(kind, variant = 1) {
  if (!GROUND[kind]) throw new Error(`back: unknown kind ${kind}`);
  const fn = VARIANTS[variant];
  if (!fn) throw new Error(`back variant ${variant}: not drawn yet`);
  return fn(kind);
}

module.exports = { back, variants: Object.keys(VARIANTS).map(Number), KINDS, GROUND, SAFE };
