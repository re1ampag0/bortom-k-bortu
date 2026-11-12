// «Рифы» (Колода моря): a brig squeezes between stone teeth and the reef is already ripping its side; on the
// neighbouring rock lie the ribs of one who tried before. Breakdown: docs/tasks/print-kit-cards.md «Рифы».
'use strict';
const K = require('../kit/index.cjs');

const HZ = 120;
// the sun high in front of us, to the left (kit az: where the light comes FROM — 0 from the depth, 270 left)
const light = { time: 'day', haze: .2, key: { type: 'sun', az: 310, el: 50, color: '#fff0d2', power: 1 }, fill: { color: '#7fd0d0', power: .5 } };
const skel = { horizon: HZ, eye: 5, light: 'sun high in front, left: left faces of the rocks warm, right faces violet-brown; shadows fall on the water to the right and towards us',
  items: [
    ['brig', 62, 127, 92, 76, 'on the water, waterline y 127, bow to the right into the right rock'],
    ['rock-right', 148, 135, 50, 70, 'stands in the water, foot y 135'],
    ['tooth', 134, 128, 21, 17, 'stands in the water at the ship\'s depth, foot y 128; the bow runs onto it, hole at x 128–140, y 119–127'],
    ['rock-left', 8, 135, 58, 50, 'stands in the water, foot y 134'],
    ['wreck', 12, 121, 42, 26, 'old ribs lying on the left rock, propped on the stone'],
    ['plank', 92, 176, 30, 8, 'floats on the shallows'],
    ['rock-near', 0, 268, 76, 26, 'in the shallows by the bottom left edge, surf round it', { edge: 1 }],
    ['drowned', 0, 240, 200, 70, 'stones under the water, both sides of the sand lane'],
  ] };

module.exports = { name: 'Рифы', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 5 });
    let bg = K.sky(u, L, { horizon: HZ }) + K.water(u, L, { horizon: HZ, bottom: 280, swell: .35, seed: 17, glitter: false });
    bg += shallows(u, L) + drowned(u, L);
    // the tooth that the bow runs onto stands at the ship's own depth: drawn first, the bow comes in front of it
    bg += K.castShadow(u, L, { x: 146, y: 128, w: 18, h: 18, horizon: HZ });
    bg += crag(u, L, TOOTH, 128, 3);
    // the brig: its shadow on the water, the hull, foam along it
    bg += K.castShadow(u, L, { x: 104, y: 128, w: 70, h: 30, horizon: HZ, d: .25 });
    bg += K.ship(u, L, { kind: 'brig', x: 104, y: 127, scale: .92, flip: true, heel: 2.5, sails: 'reefed', detail: 'near', reflect: true, wake: true, seed: 9 });
    bg += impact(u, L);
    let fg = '';
    // the left rock with the old wreck: a low rounded shoulder (boulder) and a broken faceted peak
    fg += K.castShadow(u, L, { x: 54, y: 134, w: 26, h: 44, horizon: HZ });
    fg += crag(u, L, low(26, 133, 38, 15, 41), 133, 4);
    fg += wreck(u, L);
    fg += crag(u, L, LEFT, 134, 1);
    // the right crag: a tall stepped stone and a low boulder at its far side
    fg += K.castShadow(u, L, { x: 174, y: 135, w: 38, h: 66, horizon: HZ });
    fg += crag(u, L, low(193, 136, 22, 32, 46), 136, 5);
    fg += crag(u, L, RIGHT, 135, 2);
    fg += K.foam(u, { x: 26, y: 133.6, w: 42, h: 2.4, L, seed: 73 }) + K.foam(u, { x: 54, y: 134.6, w: 34, h: 2.6, L, seed: 71 }) + K.foam(u, { x: 175, y: 135.6, w: 44, h: 2.6, L, seed: 72 });
    // the shallows near us: a floating plank, sun glints on the left, the near rock in the surf
    fg += plank(u, L) + glints(u);
    fg += crag(u, L, low(28, 266, 54, 24, 58), 266, 6) + crag(u, L, low(62, 269, 30, 12, 63), 269, 7);
    fg += K.foam(u, { x: 40, y: 267, w: 84, h: 3.4, L, seed: 59 });
    return [bg, fg];
  } };

// KIT-CANDIDATE: a faceted crag (the kit's rock is a rounded dome). Each crag is a few flat facets cut by a ridge
// and ledges; shadeBox tones every facet by its normal in the scene light: facets turned left to the sun are warm
// ochre stone, facets turned right are in shadow, cooled by the sky (the shadow tint) to a violet-brown.
// Facets: [points, normal [x right, y up, z to us]]
const NL = [-.86, .2, .46], NL2 = [-.55, .5, .66], NT = [-.15, .97, .2], NR = [.74, .12, .66], NR2 = [.9, .3, .3];
const RIGHT = [
  [[[150, 135], [152, 118], [157, 110], [160, 97], [170, 96], [168, 113], [170, 135]], NL],
  [[[160, 97], [163, 84], [166, 74], [170, 66], [169, 80], [170, 96]], NL2],
  [[[154, 111], [157, 110], [160, 97], [158, 104]], NT],
  [[[170, 66], [176, 70], [180, 82], [182, 91], [171, 97], [169, 80]], NR],
  [[[182, 91], [189, 95], [180, 99], [171, 97]], NT],
  [[[171, 97], [180, 99], [189, 95], [191, 110], [194, 124], [195, 135], [170, 135]], NR2],
  [[[168, 113], [171, 97], [180, 99], [176, 115], [178, 135], [170, 135]], NR],
];
const LEFT = [
  [[[40, 134], [42, 121], [47, 113], [52, 111], [55, 119], [55, 134]], NL],
  [[[47, 113], [52, 99], [56, 88], [57, 104], [52, 111]], NL2],
  [[[52, 111], [57, 104], [60, 107], [55, 119]], NT],
  [[[56, 88], [61, 93], [63, 104], [60, 107], [57, 104]], NR],
  [[[60, 107], [63, 104], [66, 117], [69, 134], [55, 134], [55, 119]], NR2],
];
const TOOTH = [
  [[[135, 128], [137, 119], [142, 111], [144, 118], [143, 128]], NL],
  [[[142, 111], [148, 113], [152, 121], [154, 128], [143, 128], [144, 118]], NR],
];
function crag(u, L, facets, base, seed) {
  const faces = facets.map(([pts, n]) => ({ pts, n, kind: n[0] < 0 ? 'ship-wood' : 'coral', grain: false }));
  let s = K.shadeBox(u, faces, L, 'ship-wood');
  const cool = facets.filter(([, n]) => n[0] > 0).map(([pts]) => { const q = pts.slice(1).concat([pts[0]]); return `<path d="M${q.map(p => p.join(' ')).join('L')}Z" fill="${L.shadowTint}" opacity=".3"/>`; }).join('');
  const all = facets.flatMap(([pts]) => pts), x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), top = Math.min(...all.map(p => p[1]));
  const cid = 'kcr' + u + seed, wid = 'kcw' + u + seed, ol = mixHex(L.ramp('leather').outline, '#2a1a20', .3);
  const clip = facets.map(([pts]) => `<path d="M${pts.map(p => p.join(' ')).join('L')}Z"/>`).join('');
  // the wet dark foot and a few cracks with a lit lip on the sun's side, all inside the stone
  let marks = `<rect x="${x0}" y="${base - 9}" width="${x1 - x0}" height="9" fill="url(#${wid})"/>`;
  let r = seed * 97; const R = () => (r = (r * 16807 + 11) % 2147483647) / 2147483647;
  for (let i = 0; i < 4; i++) { const x = x0 + (x1 - x0) * (.15 + R() * .7), y = top + (base - top) * (.25 + R() * .5), l = 5 + R() * 9, b = (R() - .5) * 4;
    marks += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${b.toFixed(1)} ${(l * .5).toFixed(1)} ${(b * .4 + (R() - .5) * 2).toFixed(1)} ${l.toFixed(1)}" stroke="${ol}" stroke-width=".45" fill="none" opacity=".55"/>`
      + `<path d="M${(x - .5).toFixed(1)} ${(y + .3).toFixed(1)}q${b.toFixed(1)} ${(l * .5).toFixed(1)} ${(b * .4).toFixed(1)} ${(l * .8).toFixed(1)}" stroke="#f3d6a8" stroke-width=".3" fill="none" opacity=".3"/>`; }
  s += `<defs><clipPath id="${cid}">${clip}</clipPath><linearGradient id="${wid}" x1="0" y1="${base}" x2="0" y2="${base - 9}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c2a34" stop-opacity=".7"/><stop offset="1" stop-color="#1c2a34" stop-opacity="0"/></linearGradient></defs>`
    + `<g clip-path="url(#${cid})">${cool}${marks}</g>`;
  return s;
}
/** A low faceted stone: a lit left facet, a top and a right facet in shadow, its corners moved by the seed. */
function low(x, base, w, h, seed) {
  let r = seed * 131 + 7; const R = () => (r = (r * 16807 + 3) % 2147483647) / 2147483647, j = (v, k) => +(v + (R() - .5) * k).toFixed(1);
  const x0 = x - w / 2, x1 = x + w / 2, lf = [x0, base], ls = [j(x0 + .1 * w, w * .08), j(base - .55 * h, h * .2)], tl = [j(x - .14 * w, w * .1), j(base - h, h * .1)];
  const tr = [j(x + .2 * w, w * .1), j(base - .9 * h, h * .12)], rs = [j(x1 - .08 * w, w * .06), j(base - .48 * h, h * .2)], rf = [x1, base], m = [j(x + .02 * w, w * .08), j(base - .62 * h, h * .1)], mb = [j(x + .05 * w, w * .1), base];
  return [[[lf, ls, tl, m, mb], NL], [[tl, tr, m], NT], [[tr, rs, rf, mb, m], NR]];
}
function mixHex(a, b, t) { const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

/** Drowned stones under the clear water: kit stones seen through the water (half transparent, tinted). */
function drowned(u, L) {
  const st = [[22, 178, 44, 16, 81], [46, 214, 36, 13, 82], [12, 236, 30, 11, 83], [168, 190, 40, 14, 84], [150, 232, 34, 12, 85], [190, 222, 26, 10, 86]];
  let s = '';
  const bid = 'kdrb' + u, vid = 'kdrv' + u;
  s += `<defs><filter id="${bid}" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter>`
    + `<linearGradient id="${vid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7f8c" stop-opacity=".35"/><stop offset="1" stop-color="#16323f" stop-opacity=".35"/></linearGradient></defs>`;
  // the stones under the water: softened, faded into the water's colour, a turquoise veil of water over their tops
  for (const [x, y, w, h, seed] of st) s += `<g opacity=".6" filter="url(#${bid})">${K.rock(u, L, { x, y, w, h, seed, contact: false })}</g>`
    + `<ellipse cx="${x}" cy="${y - h * .45}" rx="${w * .55}" ry="${h * .6}" fill="url(#${vid})" filter="url(#${bid})"/>`;
  return s;
}

/** The clear shallows: a pale lane of sand under the water between dark masses of drowned stone on both sides. */
function shallows(u, L) {
  const id = 'krsh' + u, b1 = 'krsb' + u, g = 'krsg' + u, d = 'krsd' + u;
  let s = `<defs><filter id="${b1}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>`
    + `<linearGradient id="${g}" x1="0" y1="140" x2="0" y2="280" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6fd6cc" stop-opacity=".35"/><stop offset=".5" stop-color="#58c4bc" stop-opacity=".45"/><stop offset="1" stop-color="#3aa6a4" stop-opacity=".35"/></linearGradient>`
    + `<linearGradient id="${d}" x1="0" y1="140" x2="0" y2="280" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#16323f" stop-opacity=".45"/><stop offset="1" stop-color="#16323f" stop-opacity=".75"/></linearGradient></defs>`;
  // the sand lane (light), widening towards us
  s += `<path d="M94 142C88 156 96 166 84 184C72 204 86 222 66 246C58 258 62 272 54 284H150C144 266 152 250 140 232C128 212 132 196 118 180C108 166 112 154 106 142Z" fill="url(#${g})" filter="url(#${b1})"/><path d="M70 200C80 196 92 204 88 214C84 222 72 222 66 214C62 208 64 202 70 200Z" fill="url(#${g})" filter="url(#${b1})"/>`;
  // drowned stone, left and right
  s += `<path d="M-4 150C20 146 46 150 62 160C70 190 58 226 40 252C24 262 6 258 -4 250Z" fill="url(#${d})" filter="url(#${b1})"/>`;
  s += `<path d="M204 150C180 147 150 152 132 166C126 196 140 236 168 262C184 270 198 266 204 258Z" fill="url(#${d})" filter="url(#${b1})"/>`;
  s += `<path d="M118 196C130 192 142 200 140 214C136 226 122 228 114 218C110 210 112 200 118 196Z" fill="url(#${d})" filter="url(#${b1})" opacity=".7"/>`;
  return s;
}

/** The old wreck on the left rock: a keel stub and curved ribs propped on the stone, a broken mast leaning. */
function wreck(u, L) {
  // old weathered wood, dark and dull; ribs of different length, two of them broken off short
  let s = K.propTube(u, L, 'ship-wood', 'M14 121.0C22 118.0 32 116.0 44 115.0', 1.5, [30, 118]);
  const ribs = [[18, 120, 14, 109, 17, 99], [24, 119, 21, 107, 25, 96], [30, 118, 28.5, 110, 30.5, 104], [36, 117, 35, 105, 39, 97], [42, 116, 42, 110, 44, 107]];
  for (const [x0, y0, x1, y1, x2, y2] of ribs) s += K.propTube(u, L, 'ship-wood', `M${x0} ${y0}Q${x1} ${y1} ${x2} ${y2}`, .75 + (y0 % 3) * .12, [x1, y1]);
  // the broken mast leaning across the ribs, its split top
  s += K.shadeCyl(u, 26, 120, 50, 98, 1.25, L, 'ship-wood', { r2: 1, seed: 3 });
  s += K.propTube(u, L, 'ship-wood', 'M49.6 98.6Q51.4 96.4 52.4 94.2', .5, [51, 96]);
  return s;
}

/** Where the right rock bites the bow: split planks, splinters flying off, a burst of white water. */
function impact(u, L) {
  const rw = L.ramp('pine-deck'), dk = '#1e1a1c';
  // the hole in the bow side just over the waterline: a dark torn gap, the ends of the burst planks sprung out
  let s = `<path d="M131.0 122.6C132.0 118.6 134.4 116.4 137.0 116.8C139.6 115.8 141.8 117.6 142.6 120.4C141.4 122.2 139.0 121.4 137.8 123.4C135.6 122.2 133.4 124.0 131.0 122.6Z" fill="${dk}" opacity=".92"/>`;
  const planks = [[132, 118.4, 7, -24, 1.1], [135, 121.2, 8.5, -12, 1.2], [139, 117.6, 6.5, -48, .95], [137.5, 123, 6, 8, 1]];
  for (const [x, y, l, a, w] of planks) {
    const r = a * Math.PI / 180, dx = Math.cos(r) * l, dy = Math.sin(r) * l, nx = -Math.sin(r) * w, ny = Math.cos(r) * w;
    s += `<path d="M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}L${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}Q${(x + dx * .6 + nx).toFixed(1)} ${(y + dy * .6 + ny).toFixed(1)} ${(x + dx + nx * .3).toFixed(1)} ${(y + dy + ny * .3).toFixed(1)}L${(x + dx - nx * .6).toFixed(1)} ${(y + dy - ny * .6).toFixed(1)}Q${(x + dx * .5 - nx).toFixed(1)} ${(y + dy * .5 - ny).toFixed(1)} ${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}Z" fill="${rw.half}" stroke="${rw.outline}" stroke-width=".35"/>`
      + `<path d="M${(x + dx * .55).toFixed(1)} ${(y + dy * .55 - w * .4).toFixed(1)}L${(x + dx).toFixed(1)} ${(y + dy - w * .2).toFixed(1)}" stroke="${rw.lit}" stroke-width=".5" opacity=".8"/>`;
  }
  s += K.splash(u, { x: 147, y: 128, w: 11, h: 12, seed: 4, L, wind: 1 });
  // splinters of raw wood flying up and away, on the sky between the jib and the crag
  const sp = [[148, 104, 6.5, -55, .7], [151, 96, 6, -78, .55], [146, 92, 7, -110, .6]];
  for (const [x, y, l, a, w] of sp) {
    const r = a * Math.PI / 180, dx = Math.cos(r) * l, dy = Math.sin(r) * l, nx = -Math.sin(r) * w, ny = Math.cos(r) * w;
    s += `<path d="M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}Q${(x + dx * .5 + nx * 1.6).toFixed(1)} ${(y + dy * .5 + ny * 1.6).toFixed(1)} ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}Q${(x + dx * .45 - nx).toFixed(1)} ${(y + dy * .45 - ny).toFixed(1)} ${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}Z" fill="${rw.lit}" stroke="${rw.outline}" stroke-width=".3"/>`;
  }
  s += K.foam(u, { x: 142, y: 128, w: 18, h: 2.6, L, seed: 6 });
  return s;
}

/** A torn-off strake floating on the shallows: an oak board with its nail holes, foam at its edges. */
function plank(u, L) {
  const faces = [
    { pts: [[88, 174], [122, 165], [123, 168], [89, 177.2]], n: 'top', kind: 'ship-wood', grain: [1, -.26] },
    { pts: [[89, 177.2], [123, 168], [123, 169.4], [89, 178.6]], n: 'front', kind: 'ship-wood', grain: false },
  ];
  return K.shadeBox(u, faces, L, 'ship-wood') + K.foam(u, { x: 105, y: 174, w: 40, h: 1.5, L, seed: 61 });
}

/** Sun glints in a patch on the left of the shallows (under the sun, which is high to the left in front of us). */
function glints(u) {
  let s = '', seed = 23; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) {
    const x = 22 + R() * 44 + (R() - .5) * 10, y = 150 + R() * 70, t = (y - 150) / 70, l = (1 + R() * 2.4) * (.7 + t), w = (.3 + R() * .35) * (.7 + t * .6);
    s += `<path d="M${(x - l / 2).toFixed(2)} ${y.toFixed(2)}q${(l / 2).toFixed(2)} ${(-w * .7).toFixed(2)} ${l.toFixed(2)} 0" stroke="#fff6dc" stroke-width="${w.toFixed(2)}" stroke-linecap="round" fill="none" opacity="${(.3 + R() * .5).toFixed(2)}"/>`;
  }
  return s;
}
