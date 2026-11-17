// «Гроза» (Колода моря): a thunderstorm at night. Three ships ride the dark sea; the man-of-war in the middle carries
// the tallest masts and all her sail — and a bolt of lightning out of the cloud base strikes her main truck: the
// topgallant is ripped open from the head to the foot, its torn cloth streaming downwind, scraps blown away. The brig
// on the left and the merchantman on the right, lower masts and reefed sails, are untouched. The flash is the one
// light: it stands behind the ships (back light, rims on the hulls and sails, the cloud bellies lit from below).
// Print review fix: the topgallant burned (flames, embers) — the card puts no Fire, so now the sail is torn, not burning.
// Not «Буря» (rain, a heeled ship, a miss): here it is the lightning, and one mast higher than the others.
// Card: the ship with the highest Паруса takes 2 damage to Паруса.
// Brief: docs/mockups/print/card-briefs.md «Гроза».
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 110;
// the man-of-war of this card: the kit's warship with a lower foremast (by ~5 scene units), so the main truck is
// plainly the highest point, and a shorter bowsprit, so her jibs keep clear of the merchantman on the right
const KIND = 'warship-groza';
if (!K.SHIP_SPECS[KIND]) { const w = K.SHIP_SPECS.warship;
  K.SHIP_SPECS[KIND] = Object.assign({}, w, { sprit: Object.assign({}, w.sprit, { len: 21 }), masts: w.masts.map((m, i) => i === 0 ? Object.assign({}, m, { H: m.H - 6 }) : m) }); }
const WAR = { kind: KIND, x: 104, y: 120, scale: .84, flip: true, sails: 'full', detail: 'near', seed: 11, roll: 4 };
const STRIKE = K.shipGeom(WAR.kind, WAR).masts[1].top;          // the main truck, the highest point of the three ships
const BOLT0 = [138, -8];                                       // where the bolt leaves the cloud base (out of frame)
// the topgallant sail of the main mast: between the yards at .7 and .93 of the mast over the deck (ship.cjs QY[3])
const TG = (() => { const s = WAR.scale, hD = 15.2, Hm = 100 - hD, y = q => WAR.y - s * (hD + q * Hm); return { x: STRIKE[0] + 1.2, y0: y(.93), y1: y(.7), hw: .078 * 96 * 1.22 * s * .95 }; })();
const light = {
  time: 'night',
  key: { type: 'moon', x: 112, y: 14, color: '#e4e2ff', power: .95 },
  fill: { color: '#2a2f52', power: .5 },
  rim: { az: 0, color: '#eae8ff', power: .8 },
  locals: [],
  haze: .4,
};
const skel = {
  horizon: HZ, eye: 3, light: 'the lightning behind the ships, high in the middle: back light, rims towards it',
  items: [
    ['bolt', 92, 0, 36, 36, 'from the cloud base out of frame to the main truck of the man-of-war'],
    ['warship', 38, WAR.y, 128, 88, 'on the water, full sail, the tallest masts, the topgallant torn by the strike'],
    ['brig', 2, 114, 40, 40, 'on the water, left, reefed, lower masts, behind the warship\'s stern'],
    ['merchant', 176, 114, 40, 38, 'on the water, right, reefed, lower masts'],
    ['near sea', 0, 280, 200, 150, 'rough water under the glass'],
  ],
};
const PAL = { sky: ['#07081a', '#12142e', '#23264c', '#3e416e'], sea: ['#4a5a7e', '#1c2846', '#090f20'] };

const lin = (id, x1, y1, x2, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${st.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</linearGradient>`;
const blur = (id, sd, box) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// ——— the lightning: a jagged channel by midpoint displacement, its branches thinner and fading; drawn as a wide
// violet halo, a blue-white glow and a white core
function jag(a, b, R, rough, depth) {
  if (depth === 0) return [a, b];
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, d = (R() - .5) * l * rough;
  const p = [m[0] + nx * d, m[1] + ny * d];
  return jag(a, p, R, rough, depth - 1).concat(jag(p, b, R, rough, depth - 1).slice(1));
}
function bolt(u, a, b, seed) {
  const R = rng(seed), main = jag(a, b, R, .48, 5);
  const branches = [];
  for (const [t, ang, len, w] of [[.12, -42, 26, .6], [.3, 34, 20, .5], [.55, -50, 14, .42], [.42, 52, 12, .34], [.08, 60, 16, .4]]) {
    const p = main[Math.round(t * (main.length - 1))], dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + ang * Math.PI / 180;
    const e = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
    branches.push({ pts: jag(p, e, R, .5, 3), w });
  }
  const P = pts => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L');
  const g1 = nid('bh', u), g2 = nid('bg', u), box = [a[0] - 60, a[1] - 20, 130, b[1] - a[1] + 60];
  let s = `<defs>${blur(g1, 4, box)}${blur(g2, .9, box)}</defs>`;
  const all = [{ pts: main, w: 1.7 }].concat(branches);
  s += `<g filter="url(#${g1})" stroke="#8f84ff" fill="none" stroke-linejoin="round" opacity=".75">${all.map(br => `<path d="${P(br.pts)}" stroke-width="${f(br.w * 6)}"/>`).join('')}</g>`;
  s += `<g filter="url(#${g2})" stroke="#cfd2ff" fill="none" stroke-linejoin="round">${all.map(br => `<path d="${P(br.pts)}" stroke-width="${f(br.w * 2.6)}"/>`).join('')}</g>`;
  s += `<g stroke="#ffffff" fill="none" stroke-linejoin="round" stroke-linecap="round">${all.map((br, i) => `<path d="${P(br.pts)}" stroke-width="${f(br.w * (i ? .7 : .95))}"${i ? ' opacity=".85"' : ''}/>`).join('')}</g>`;
  return s;
}

// ——— the topgallant torn by the strike: a jagged rent from the head down through the cloth (the dark sky through it),
// the cloth on the right ripped from its foot and streaming downwind (to the right), a tatter hanging off the left
// clew, loose threads along the torn edges, a few scraps blown away. No fire: the flash only lights the torn edges
// cold white-violet.
function tornSail(u, L) {
  const x0 = TG.x, y0 = TG.y0, y1 = TG.y1, hw = TG.hw, h = y1 - y0, R = rng(5), P = pts => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L');
  const ge = nid('te', u), cl = nid('tc', u), cs = nid('ts', u);
  const CL = '#dcdae4', CM = '#a9a8bc', CD = '#5a5a78', EDGE = '#f2f0ff';
  let s = `<defs>${blur(ge, .7, [x0 - 30, y0 - 20, 70, 50])}`
    + lin(cl, x0, y0, x0 + hw + 12, y0 + 6, [[0, CM], [.5, CL], [1, '#c4c2d4']]) + lin(cs, x0 - hw, y1 - 6, x0 - hw - 4, y1 + 8, [[0, CM], [1, CD]]) + '</defs>';
  // the rent: wide at the foot, closing up to a split under the head, ragged on both sides
  const left = [], right = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8, y = lerp(y0 + 1.6, y1 - .2, t), w = lerp(.4, 1, Math.pow(t, .8)), j = (R() - .5) * 1.4;
    left.push([x0 + .6 - w * 4.2 + j, y]); right.push([x0 + 1.4 + w * (hw - 3.2) + (R() - .5) * 1.4, y]); }
  const rent = left.concat(right.slice().reverse());
  s += `<path d="${P(rent)}Z" fill="#2c2b56"/>`;
  // the torn edges caught by the flash: a cold glow, then a thin bright line
  s += `<g fill="none" stroke-linejoin="round"><path d="${P(left)}" stroke="${EDGE}" stroke-width=".9" opacity=".55" filter="url(#${ge})"/><path d="${P(right)}" stroke="${EDGE}" stroke-width=".9" opacity=".55" filter="url(#${ge})"/>`
    + `<path d="${P(left)}" stroke="${EDGE}" stroke-width=".35"/><path d="${P(right)}" stroke="${EDGE}" stroke-width=".35"/></g>`;
  // loose threads hanging off the torn edges into the rent
  let th = '';
  for (const [side, k] of [[left, .9], [right, -.9]]) for (let i = 2; i < side.length - 1; i += 1) { const p = side[i], l = 1 + R() * 1.6;
    th += `<path d="M${f(p[0])} ${f(p[1])}q${f(k * l * .5)} ${f(l * .4)} ${f(k * l * .3 + .6)} ${f(l)}" stroke="${CL}" stroke-width=".25" fill="none" opacity=".85"/>`; }
  s += th;
  // the right half ripped from its foot: the cloth bellies out and streams to the right, its end in ragged tongues
  const fr = [[x0 + hw - .4, y0 + 1.2], [x0 + hw + 4, y0 + 2.4], [x0 + hw + 8.6, y0 + 3.4], [x0 + hw + 12, y0 + 3.2], [x0 + hw + 10.4, y0 + 5], [x0 + hw + 13.4, y0 + 6.4],
    [x0 + hw + 9.6, y0 + 7.4], [x0 + hw + 11.6, y0 + 9.6], [x0 + hw + 7, y0 + 9.4], [x0 + hw + 5, y0 + 11.6], [x0 + hw + 3.2, y0 + 9.8], [x0 + hw - .2, y0 + h * .62], [right[5][0], right[5][1]], [right[2][0], right[2][1]]];
  s += `<path d="${P(fr)}Z" fill="url(#${cl})" stroke="${CD}" stroke-width=".3" stroke-linejoin="round"/>`
    + `<path d="M${f(x0 + hw)} ${f(y0 + 2.6)}Q${f(x0 + hw + 5)} ${f(y0 + 4.6)} ${f(x0 + hw + 9)} ${f(y0 + 5.2)}M${f(x0 + hw - .2)} ${f(y0 + 6)}Q${f(x0 + hw + 3)} ${f(y0 + 7.6)} ${f(x0 + hw + 6)} ${f(y0 + 8.6)}" stroke="${CD}" stroke-width=".3" fill="none" opacity=".6"/>`
    + `<path d="${P(fr.slice(0, 4))}" stroke="${EDGE}" stroke-width=".4" fill="none" opacity=".9"/>`;
  // a tatter torn off the left clew, hanging and flicking downwind
  const tl = [[x0 - hw + .6, y1 - 4.2], [x0 - hw + 2.6, y1 - .4], [x0 - hw + 2.2, y1 + 3.2], [x0 - hw + 3.4, y1 + 6.4], [x0 - hw + 1.2, y1 + 4.4], [x0 - hw - .2, y1 + 6.8], [x0 - hw - .4, y1 + 2.4], [x0 - hw - .6, y1 - 1.6]];
  s += `<path d="${P(tl)}Z" fill="url(#${cs})" stroke="${CD}" stroke-width=".3" stroke-linejoin="round"/><path d="${P(tl.slice(0, 3))}" stroke="${EDGE}" stroke-width=".3" fill="none" opacity=".7"/>`;
  // scraps of canvas blown away downwind, tumbling (pale cloth, not burning)
  for (const [x, y, a, sc] of [[x0 + hw + 15, y0 + 1, 20, 1.2], [x0 + hw + 19, y0 + 8, -35, .9], [x0 + hw + 13, y0 + 13, 60, .8], [x0 + hw + 23, y0 + 3, 10, .65], [x0 + 6, y1 + 3, -20, .6]])
    s += `<path d="M0 0l2.2 -.6l.6 .9l1.4 .2l-.8 1.6l-2 .3l-.6 -.8Z" fill="${CL}" stroke="${CD}" stroke-width=".25" transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${sc})"/>`;
  return s;
}

// ——— the strike at the truck: a white star of light, a ring of sparks thrown off
function impact(u, p) {
  const R = rng(9);
  // a short blue-white flash on the sky round the strike, a star of thin rays
  let s = K.localGlow(u, { x: p[0], y: p[1] - 4, color: '#d6e4ff', power: .85, radius: 34 }, { core: false });
  for (const [a, l, w] of [[-90, 16, .9], [90, 9, .6], [0, 13, .7], [180, 13, .7], [-45, 7, .45], [-135, 7, .45]]) { const r = a * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), q = [p[0] + c * l, p[1] + sn * l], n = [-sn * w, c * w];
    s += `<path d="M${f(p[0] + n[0])} ${f(p[1] + n[1])}L${f(q[0])} ${f(q[1])}L${f(p[0] - n[0])} ${f(p[1] - n[1])}Z" fill="#eef4ff" opacity=".8"/>`; }
  s += K.localGlow(u, { x: p[0], y: p[1], color: '#dcd8ff', power: 1, radius: 16 }) + K.localGlow(u, { x: p[0], y: p[1], color: '#ffffff', power: .9, radius: 5 });
  for (let i = 0; i < 14; i++) { const a = R() * Math.PI * 2, l = 2 + R() * 5; s += `<path d="M${f(p[0] + Math.cos(a) * 1.2)} ${f(p[1] + Math.sin(a) * 1.2)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="#f4f2ff" stroke-width="${f(.2 + R() * .3)}" stroke-linecap="round" opacity="${f(.5 + R() * .5)}"/>`; }
  return s;
}

// thin slanting rain, the same slant as the wind (to the right)
function rain(u, L, o) {
  const R = rng(o.seed || 9), c = mix(L.pal.sky[3], '#ffffff', .3), dx = o.slant || .3;
  let st = '';
  for (let i = 0; i < (o.n || 40); i++) { const x = lerp(o.x0, o.x1, R()), y = lerp(o.y0, o.y1, R()), l = 4 + R() * 9; st += `<path d="M${f(x)} ${f(y)}l${f(l * dx)} ${f(l)}" stroke="${c}" stroke-width="${f(.15 + R() * .2)}" opacity="${f(.15 + R() * .3)}"/>`; }
  return `<g stroke-linecap="round">${st}</g>`;
}

module.exports = {
  name: 'Гроза', kind: 'sea', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, PAL);
    // ——— the sky: a low heavy cloud base, its bellies lit violet-white from the flash
    let bg = K.sky(u, L, { horizon: HZ + 4, stars: false });
    bg += K.localGlow(u, { x: 120, y: 14, color: '#b8b2ff', power: .8, radius: 100 }, { core: false });
    bg += K.cloud(u, L, { x: 40, y: 30, w: 150, h: 40, seed: 7 });
    bg += K.cloud(u, L, { x: 178, y: 26, w: 120, h: 36, seed: 19 });
    bg += K.cloud(u, L, { x: 18, y: 72, w: 90, h: 30, seed: 23, far: .3 });
    bg += K.cloud(u, L, { x: 190, y: 70, w: 80, h: 26, seed: 29, far: .35 });
    bg += K.cloudBank(u, L, { y: HZ - 3, h: 10, x0: -20, x1: 220, n: 5, seed: 12, far: .7 });
    // the cloud bellies round the bolt's root, white-violet from the flash
    bg += K.localGlow(u, { x: 134, y: 4, color: '#e6e4ff', power: .75, radius: 34 }, { core: false });
    // a far second flash in the clouds on the right, faint
    bg += K.localGlow(u, { x: 178, y: 46, color: '#a8a4ff', power: .35, radius: 30 }, { core: false });
    bg += rain(u, L, { x0: -10, x1: 70, y0: 40, y1: HZ, n: 50, seed: 3 }) + rain(u, L, { x0: 150, x1: 210, y0: 50, y1: HZ, n: 34, seed: 5 });
    // ——— the sea: rough, the flash laid on it in a broken path under the strike
    bg += K.water(u, L, { horizon: HZ, bottom: 300, swell: .85, seed: 6, glitter: 112 });
    // ——— the two lower ships: reefed, lit only from behind, untouched
    bg += K.ship(u, L, { kind: 'brig', x: 20, y: 114, scale: .5, flip: true, sails: 'reefed', detail: 'mid', seed: 4, lights: true });
    bg += K.foam(u, { x: 20, y: 114.2, w: 34, h: .8, seed: 3, L });
    bg += K.ship(u, L, { kind: 'merchant', x: 191, y: 114, scale: .48, flip: true, sails: 'reefed', detail: 'mid', seed: 8, lights: true });
    bg += K.foam(u, { x: 191, y: 114.2, w: 34, h: .8, seed: 5, L });
    // ——— the man-of-war: all sail, the tallest masts; the bolt hits her main truck
    let mid = K.ship(u, L, Object.assign({ wake: true }, WAR));
    mid += K.foam(u, { x: WAR.x, y: WAR.y + .3, w: 96, h: 1.2, seed: 9, L });
    mid += tornSail(u, L);
    let fx = bolt(u, BOLT0, [STRIKE[0], STRIKE[1] - .6], 21) + impact(u, STRIKE);
    // the flash on the water under the ship, cold
    fx += K.localGlow(u, { x: 112, y: HZ + 6, color: '#c8c4ff', power: .3, radius: 50 }, { squash: .2, core: false });
    // ——— under the glass: the near swell, dark, with foam
    let fg = rain(u, L, { x0: -10, x1: 200, y0: 120, y1: 230, n: 30, seed: 12 });
    return [bg + mid + fx, fg];
  },
};
