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
 * The picture dissolves into the ground towards the edges: from the edge to SAFE — the ground only. The mask is a
 * blurred frame (a rounded window inset by `ins` past SAFE, blur `sd`) united with hard strips that are solid up
 * to SAFE and fade over `hard` units (the blur alone never reaches full ground). No edge of a shape lies near the
 * card's edge, so there is no seam; a 3 mm shift moves only a soft gradient.
 * KIT-CANDIDATE: the same edge for any back or full-bleed picture that must survive a shifted print.
 */
function edgeFade(u, ground, o = {}) {
  const ins = Object.assign({ t: 12, r: 6, b: 14, l: 6 }, o.ins), sd = o.sd || 5.5, R = o.radius || 26, hard = o.hard || 12;
  const m = bid('m', u), bl = bid('b', u), x0 = SAFE + ins.l, x1 = W - SAFE - ins.r, y0 = SAFE + ins.t, y1 = H - SAFE - ins.b;
  const ss = [0, .2, .4, .6, .8, 1].map(t => `<stop offset="${t}" stop-color="#fff" stop-opacity="${f(1 - (3 * t * t - 2 * t * t * t))}"/>`).join('');
  const g = ['t', 'r', 'b', 'l'].map(k => bid('g' + k, u));
  // strips from beyond the edge to SAFE + hard; the gradient pads solid white out to the edge
  const strips = `<linearGradient id="${g[0]}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(SAFE)}" x2="0" y2="${f(SAFE + hard)}">${ss}</linearGradient>`
    + `<linearGradient id="${g[1]}" gradientUnits="userSpaceOnUse" x1="${f(W - SAFE)}" y1="0" x2="${f(W - SAFE - hard)}" y2="0">${ss}</linearGradient>`
    + `<linearGradient id="${g[2]}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(H - SAFE)}" x2="0" y2="${f(H - SAFE - hard)}">${ss}</linearGradient>`
    + `<linearGradient id="${g[3]}" gradientUnits="userSpaceOnUse" x1="${f(SAFE)}" y1="0" x2="${f(SAFE + hard)}" y2="0">${ss}</linearGradient>`;
  const E = 30, big = `M${-E} ${-E}H${W + E}V${H + E}H${-E}Z`;
  const win = `M${f(x0 + R)} ${f(y0)}H${f(x1 - R)}Q${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + R)}V${f(y1 - R)}Q${f(x1)} ${f(y1)} ${f(x1 - R)} ${f(y1)}H${f(x0 + R)}Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - R)}V${f(y0 + R)}Q${f(x0)} ${f(y0)} ${f(x0 + R)} ${f(y0)}Z`;
  const defs = strips + `<filter id="${bl}" filterUnits="userSpaceOnUse" x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}"><feGaussianBlur stdDeviation="${f(sd)}"/></filter>`
    + `<mask id="${m}" maskUnits="userSpaceOnUse" x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}"><rect x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}" fill="#000"/>`
    + `<path d="${big}${win}" fill="#fff" fill-rule="evenodd" filter="url(#${bl})"/>`
    + `<rect x="${-E}" y="${-E}" width="${W + 2 * E}" height="${f(E + SAFE + hard)}" fill="url(#${g[0]})"/><rect x="${f(W - SAFE - hard)}" y="${-E}" width="${f(E + SAFE + hard)}" height="${H + 2 * E}" fill="url(#${g[1]})"/>`
    + `<rect x="${-E}" y="${f(H - SAFE - hard)}" width="${W + 2 * E}" height="${f(E + SAFE + hard)}" fill="url(#${g[2]})"/><rect x="${-E}" y="${-E}" width="${f(E + SAFE + hard)}" height="${H + 2 * E}" fill="url(#${g[3]})"/></mask>`;
  return `<defs>${defs}</defs><rect x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}" fill="${ground}" mask="url(#${m})"/>`;
}

/** A soft pool of the ground colour under the lettering (medallion and name): the water there is calm. */
function calm(u, ground, x, y, rx, ry, op) {
  const g = bid('cv', u);
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${f(x)}" cy="${f(y)}" r="${f(rx)}" gradientTransform="translate(0 ${f(y)}) scale(1 ${f(ry / rx)}) translate(0 ${f(-y)})"><stop offset="0" stop-color="${ground}" stop-opacity="${f(op)}"/><stop offset=".55" stop-color="${ground}" stop-opacity="${f(op * .7)}"/><stop offset="1" stop-color="${ground}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})"/>`;
}

/**
 * swellCrest(u, L, { x, y, w, h, seed, lean }) — one near swell seen from the side: a ridge `w` wide whose crest
 * rises `h` above the water line y; the back lit by the sky, the face in shadow with light through the thin top
 * (на просвет), a lace of foam along the crest and streaks running down the back. lean > 0 — the crest leans right.
 * KIT-CANDIDATE: kit/env.cjs has rows of swell but no single near wave.
 */
function swellCrest(u, L, o) {
  const x = o.x, y = o.y, w = o.w, h = o.h, R = K.rng(o.seed || 1), lean = o.lean || .2, P = L.pal;
  const x0 = x - w / 2, x1 = x + w / 2, px = x + lean * w * .18, py = y - h, th = h * 1.3;
  const sea = P.sea, top = K.mix(sea[0], P.sky[3], .35), face = K.mix(sea[1], sea[2], .35), deep = K.mix(sea[2], L.shadowTint, .25), glow = K.mix(sea[0], '#bfeee0', .45);
  const foam = K.mix('#f6fcff', L.keyColor, .3), g = bid('wv', u), gw = bid('wq', u), bl = bid('wl', u), mk = bid('wm', u), mg = bid('wn', u);
  const ridge = `M${f(x0)} ${f(y)}C${f(x0 + w * .25)} ${f(y - h * .15)} ${f(px - w * .2)} ${f(py)} ${f(px)} ${f(py)}C${f(px + w * .1)} ${f(py)} ${f(px + w * .16)} ${f(y - h * .45)} ${f(x1)} ${f(y + h * .25)}`;
  const body = ridge + `L${f(x1)} ${f(y + th)}C${f(x + w * .2)} ${f(y + th * 1.15)} ${f(x - w * .2)} ${f(y + th * .85)} ${f(x0)} ${f(y + th)}Z`;
  let out = `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(py)}" x2="0" y2="${f(y + th)}"><stop offset="0" stop-color="${top}" stop-opacity=".95"/><stop offset=".35" stop-color="${face}" stop-opacity=".9"/><stop offset=".75" stop-color="${deep}" stop-opacity=".55"/><stop offset="1" stop-color="${deep}" stop-opacity="0"/></linearGradient>`
    + `<radialGradient id="${gw}" gradientUnits="userSpaceOnUse" cx="${f(px + w * .05)}" cy="${f(py + h * .45)}" r="${f(w * .22)}"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`
    + `<filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter>`
    // the ridge dies out at both ends into the sea
    + `<linearGradient id="${mg}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="0" x2="${f(x1)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff"/><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="${f(x0 - 2)}" y="${f(py - 6)}" width="${f(w + 4)}" height="${f(h + th + 12)}"><rect x="${f(x0 - 2)}" y="${f(py - 6)}" width="${f(w + 4)}" height="${f(h + th + 12)}" fill="url(#${mg})"/></mask></defs><g mask="url(#${mk})">`;
  out += `<path d="${body}" fill="url(#${g})"/><path d="${body}" fill="url(#${gw})"/>`;
  // the lit line of the back and the lace of foam on the crest, thicker at the top
  out += `<path d="${ridge}" fill="none" stroke="${K.mix(top, '#ffffff', .4)}" stroke-width=".7" opacity=".7" stroke-linecap="round"/>`;
  let lace = '';
  for (let i = 0; i < 46; i++) {
    const t = R(), xx = x0 + w * (.25 + t * .6), near = 1 - Math.min(1, Math.abs(xx - px) / (w * .32)), yy = py + (1 - near) * h * .55 + (R() - .3) * 1.6, r = (.35 + R() * .9) * (.5 + near);
    if (near <= 0) continue;
    lace += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r * (1.3 + R()))}" ry="${f(r * .6)}" opacity="${f(.45 + R() * .5)}"/>`;
  }
  for (let i = 0; i < 7; i++) { const sx = px - w * (.05 + R() * .3), sy = py + h * (.25 + R() * .5), l = w * (.08 + R() * .14); lace += `<path d="M${f(sx)} ${f(sy)}q${f(-l / 2)} ${f(h * .12)} ${f(-l)} ${f(h * .28)}" stroke="${foam}" stroke-width="${f(.3 + R() * .35)}" fill="none" opacity="${f(.35 + R() * .3)}"/>`; }
  return out + `<g fill="${foam}" filter="url(#${bl})">${lace}</g></g>`;
}

/** Moonlit air: lifts the darkest night sky (top) and the near water (bottom) towards a steel blue by screen, so
 *  the night stays deep blue on an inkjet and not a black slab (review-art 19). Under the ship, over sky and sea. */
function nightLift(u, hz) {
  const g = bid('nl', u);
  return `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}"><stop offset="0" stop-color="#5a78a8" stop-opacity=".42"/><stop offset="${f((hz - 40) / H)}" stop-color="#5a78a8" stop-opacity=".1"/><stop offset="${f(hz / H)}" stop-color="#5a78a8" stop-opacity="0"/><stop offset="${f((hz + 30) / H)}" stop-color="#4a6890" stop-opacity=".08"/><stop offset="1" stop-color="#4a6890" stop-opacity=".34"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})" style="mix-blend-mode:screen"/>`;
}

const wrap = body => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// ——— variant 1 «Корабль в море» ———
// One layout for the five decks, so they read as a set: the title in the calm top (y 44), the ship large in the
// middle (waterline y 180), the medallion over calm water below it, the name under the medallion.
const PLACES1 = { title: { y: 44 }, crest: { y: 209, d: 36 }, letter: null, name: { y: 244 } };
const WL = 180, HZ = 168;

const SCENES1 = {
  // «Чёрная жемчужина»: night; the moon behind the ship (contre-jour): the black sails glow at the edges, a rim on
  // the hull, the moon path on the water under the stern; moonlit clouds low over the horizon.
  pearl: u => {
    const light = lightAt('pearl', 146, 78, { rim: { az: 330, color: '#cfe4ff', power: .7 } }), L = K.makeLight(light, { horizon: HZ });
    const sc = fitShip('pearl', 150, 124);
    return K.sky(u, L, { horizon: HZ, seed: 12, stars: 60 }) + K.sunMoon(u, L, { r: 8.5 })
      + K.cloudBank(u, L, { y: 132, h: 9, x0: 40, x1: 190, n: 3, seed: 31, far: .75 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .4, seed: 5 }) + nightLift(u, HZ)
      + K.ship(u, L, { kind: 'pearl', x: 98, y: WL, scale: sc, wake: true, reflect: true, lights: true });
  },
  // «Месть королевы Анны»: sunset from the left, low warm side light; smoke of a burnt prize rising from behind,
  // carried by the wind over the sky; the ship's bow to the right (the wind is the same for the flags and the smoke).
  revenge: u => {
    const L = K.makeLight(K.LIGHTS.revenge, { horizon: HZ });
    const sc = fitShip('revenge', 146, 128);
    return K.sky(u, L, { horizon: HZ, seed: 13 })
      + K.cloudBank(u, L, { y: 150, h: 11, x0: 10, x1: 190, n: 4, seed: 41, far: .65 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .45, seed: 6 })
      + K.smoke(u, L, { x: 64, y: HZ - 4, w: 46, h: 104, wind: .55, seed: 9, opacity: .62, glow: { color: '#ff8a3a', power: .35 } })
      + K.ship(u, L, { kind: 'revenge', x: 104, y: WL, scale: sc, flip: true, wake: true, reflect: true, lights: true });
  },
  // «Индевор»: day, a high sun from the right (behind the viewer): white full sails lit, short shadows, cumulus.
  endeavour: u => {
    const L = K.makeLight(K.LIGHTS.endeavour, { horizon: HZ });
    const sc = fitShip('endeavour', 152, 128);
    return K.sky(u, L, { horizon: HZ, seed: 14 })
      + K.cloud(u, L, { x: 60, y: 104, w: 70, h: 26, seed: 51, far: .3 }) + K.cloudBank(u, L, { y: 156, h: 14, x0: 0, x1: 200, n: 5, seed: 52, far: .7 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .5, seed: 7 })
      + K.ship(u, L, { kind: 'endeavour', x: 98, y: WL, scale: sc, wake: true, reflect: true });
  },
  // «Летучий голландец»: green fog, a pale moon behind on the left; a fog bank behind the ship and a low one over
  // the water line in front of it; the bow to the right.
  dutch: u => {
    const light = lightAt('dutchman', 62, 86), L = K.makeLight(light, { horizon: HZ });
    const sc = fitShip('dutch', 146, 126);
    return K.sky(u, L, { horizon: HZ, seed: 15 }) + K.sunMoon(u, L, { r: 9 })
      + K.water(u, L, { horizon: HZ, bottom: 280, swell: .35, seed: 8 })
      + K.fog(u, L, { y: HZ - 40, h: 54, density: .7, seed: 3 })
      + K.ship(u, L, { kind: 'dutch', x: 102, y: WL, scale: sc, flip: true, wake: true, reflect: true, lights: true })
      + K.fog(u, L, { y: WL - 12, h: 30, density: .45, seed: 4 });
  },
  // Колода моря: the open sea without the deck's ship; the sun under a cloud and its path; a merchant fluyt in the
  // middle distance, a brig far away; two near swells at the sides, calm water under the medallion.
  sea: u => {
    const hz = 150, light = lightAt('sea', 138, 96), L = K.makeLight(light, { horizon: hz });
    return K.sky(u, L, { horizon: hz, seed: 16 }) + K.sunMoon(u, L, { r: 7 })
      + K.cloud(u, L, { x: 132, y: 92, w: 64, h: 20, seed: 61, far: .25 }) + K.cloudBank(u, L, { y: 140, h: 12, x0: 0, x1: 200, n: 5, seed: 62, far: .7 })
      + K.water(u, L, { horizon: hz, bottom: 280, swell: .95, seed: 9 })
      + K.ship(u, L, { kind: 'brig', x: 148, y: hz + 1.4, scale: .3, detail: 'far', flip: true })
      + K.ship(u, L, { kind: 'merchant', x: 84, y: 168, scale: .72, detail: 'mid', wake: true, reflect: true, heel: 2 })
      + swellCrest(u, L, { x: 58, y: 198, w: 70, h: 7, seed: 3, lean: .3 }) + swellCrest(u, L, { x: 150, y: 214, w: 64, h: 6, seed: 4, lean: .2 });
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
