// «Гроза» (Колода моря): a thunderstorm at night. Three ships ride the dark sea; the man-of-war in the middle carries
// the tallest masts and all her sail — and a bolt of lightning out of the cloud base strikes her main truck: the
// topgallant sail bursts into flame, sparks rain off the yard. The brig on the left and the merchantman on the right,
// lower masts and reefed sails, are untouched. The flash is the one light: it stands behind the ships (back light,
// rims on the hulls and sails, the cloud bellies lit from below); the burning sail is the warm local.
// Not «Буря» (rain, a heeled ship, a miss): here it is the lightning, and one mast higher than the others.
// Card: the ship with the highest Паруса takes 2 damage to Паруса.
// Brief: docs/mockups/print/card-briefs.md «Гроза».
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 110;
const WAR = { kind: 'warship', x: 104, y: 120, scale: .84, flip: true, sails: 'full', detail: 'near', seed: 11, roll: 4 };
const STRIKE = K.shipGeom(WAR.kind, WAR).masts[1].top;          // the main truck, the highest point of the three ships
const BOLT0 = [124, -6];                                       // where the bolt leaves the cloud base (out of frame)
// the topgallant sail of the main mast: between the yards at .7 and .93 of the mast over the deck (ship.cjs QY[3])
const TG = (() => { const s = WAR.scale, hD = 15.2, Hm = 100 - hD, y = q => WAR.y - s * (hD + q * Hm); return { x: STRIKE[0] + 1.2, y0: y(.93), y1: y(.7), hw: .078 * 96 * 1.22 * s * .95 }; })();
const light = {
  time: 'night',
  key: { type: 'moon', x: 112, y: 14, color: '#e4e2ff', power: .95 },
  fill: { color: '#2a2f52', power: .5 },
  rim: { az: 0, color: '#eae8ff', power: .8 },
  locals: [{ x: TG.x, y: (TG.y0 + TG.y1) / 2, h: 30, color: '#ff9a3a', power: .8, radius: 46 }],
  haze: .4,
};
const skel = {
  horizon: HZ, eye: 3, light: 'the lightning behind the ships, high in the middle: back light, rims towards it; the burning sail warm',
  items: [
    ['bolt', 92, 0, 36, 36, 'from the cloud base out of frame to the main truck of the man-of-war'],
    ['warship', 38, WAR.y, 128, 88, 'on the water, full sail, the tallest masts, the topgallant on fire'],
    ['brig', 2, 114, 40, 40, 'on the water, left, reefed, lower masts, behind the warship\'s stern'],
    ['merchant', 166, 113.5, 40, 38, 'on the water, right, reefed, lower masts'],
    ['near sea', 0, 280, 200, 150, 'rough water under the glass'],
  ],
};
const PAL = { sky: ['#0b0c1e', '#191b36', '#2d3058', '#4a4d7a'], sea: ['#4a5a7e', '#1c2846', '#090f20'] };

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
  const R = rng(seed), main = jag(a, b, R, .42, 5);
  const branches = [];
  for (const [t, ang, len, w] of [[.22, -38, 18, .5], [.45, 30, 14, .45], [.62, -55, 10, .38], [.35, 48, 9, .3]]) {
    const p = main[Math.round(t * (main.length - 1))], dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + ang * Math.PI / 180;
    const e = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
    branches.push({ pts: jag(p, e, R, .5, 3), w });
  }
  const P = pts => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L');
  const g1 = nid('bh', u), g2 = nid('bg', u), box = [a[0] - 60, a[1] - 20, 130, b[1] - a[1] + 60];
  let s = `<defs>${blur(g1, 3.2, box)}${blur(g2, .9, box)}</defs>`;
  const all = [{ pts: main, w: 1.25 }].concat(branches);
  s += `<g filter="url(#${g1})" stroke="#8f84ff" fill="none" stroke-linejoin="round" opacity=".75">${all.map(br => `<path d="${P(br.pts)}" stroke-width="${f(br.w * 6)}"/>`).join('')}</g>`;
  s += `<g filter="url(#${g2})" stroke="#cfd2ff" fill="none" stroke-linejoin="round">${all.map(br => `<path d="${P(br.pts)}" stroke-width="${f(br.w * 2.6)}"/>`).join('')}</g>`;
  s += `<g stroke="#ffffff" fill="none" stroke-linejoin="round" stroke-linecap="round">${all.map((br, i) => `<path d="${P(br.pts)}" stroke-width="${f(br.w * (i ? .7 : .95))}"${i ? ' opacity=".85"' : ''}/>`).join('')}</g>`;
  return s;
}

// ——— the burning topgallant: a ragged hole burnt through the cloth, its edge glowing, the flame licking up from it
// and blown downwind (to the bow, right), sparks and burning shreds falling off the yard
function burningSail(u, L) {
  const cx = TG.x + 1.5, cy = lerp(TG.y0, TG.y1, .55), R = rng(5), w = TG.hw * 1.15, h = (TG.y1 - TG.y0) * .62;
  const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = (.75 + R() * .4); pts.push([cx + Math.cos(a) * w * .6 * r, cy + Math.sin(a) * h * .6 * r]); }
  const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', ge = nid('be', u);
  let s = `<defs>${blur(ge, .8, [cx - 30, cy - 30, 60, 60])}</defs>`;
  // the scorch round the hole, then the hole (the dark sky through it), then its glowing edge
  s += `<path d="${d}" fill="#2a160c" opacity=".75" transform="translate(${f(cx)} ${f(cy)}) scale(1.35) translate(${f(-cx)} ${f(-cy)})" filter="url(#${ge})"/>`;
  s += `<path d="${d}" fill="${PAL.sky[1]}"/>`;
  s += `<path d="${d}" fill="none" stroke="#ff8a2a" stroke-width="1.1" filter="url(#${ge})"/><path d="${d}" fill="none" stroke="#ffd27a" stroke-width=".4"/>`;
  s += K.fire(u, { x: cx - 1, y: cy + h * .35, w: w * 1.5, h: h * 2.1, seed: 3, wind: .55, glow: true, pool: false });
  s += K.fire(u, { x: cx + w * .55, y: TG.y1 - 1, w: w * .7, h: h * 1.1, seed: 8, wind: .6, glow: false, pool: false });
  // sparks and shreds of burning canvas falling off, drifting downwind
  let sp = '';
  for (let i = 0; i < 26; i++) { const x = cx - 4 + R() * 26, y = cy + R() * 40, r = .25 + R() * .45; sp += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${R() > .5 ? '#ffd890' : '#ff9a40'}" opacity="${f(.5 + R() * .5)}"/>`; }
  for (let i = 0; i < 4; i++) { const x = cx + 4 + R() * 16, y = cy + 10 + R() * 26, a = R() * 90; sp += `<path d="M${f(x)} ${f(y)}l1.6 -.5l.4 1.2l-1.4 .6Z" fill="#ffb050" transform="rotate(${f(a)} ${f(x)} ${f(y)})" opacity=".9"/>`; }
  return s + sp;
}

// ——— the strike at the truck: a white star of light, a ring of sparks thrown off
function impact(u, p) {
  const R = rng(9);
  let s = K.localGlow(u, { x: p[0], y: p[1], color: '#dcd8ff', power: 1, radius: 16 }) + K.localGlow(u, { x: p[0], y: p[1], color: '#ffffff', power: .9, radius: 5 });
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
  name: 'Гроза', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, PAL);
    // ——— the sky: a low heavy cloud base, its bellies lit violet-white from the flash
    let bg = K.sky(u, L, { horizon: HZ + 4, stars: false });
    bg += K.localGlow(u, { x: 116, y: 18, color: '#b8b2ff', power: .7, radius: 90 }, { core: false });
    bg += K.cloud(u, L, { x: 40, y: 30, w: 150, h: 40, seed: 7 });
    bg += K.cloud(u, L, { x: 178, y: 26, w: 120, h: 36, seed: 19 });
    bg += K.cloud(u, L, { x: 18, y: 72, w: 90, h: 30, seed: 23, far: .3 });
    bg += K.cloud(u, L, { x: 190, y: 70, w: 80, h: 26, seed: 29, far: .35 });
    bg += K.cloudBank(u, L, { y: HZ - 3, h: 10, x0: -20, x1: 220, n: 5, seed: 12, far: .7 });
    // a far second flash in the clouds on the right, faint
    bg += K.localGlow(u, { x: 178, y: 46, color: '#a8a4ff', power: .35, radius: 30 }, { core: false });
    bg += rain(u, L, { x0: -10, x1: 70, y0: 40, y1: HZ, n: 50, seed: 3 }) + rain(u, L, { x0: 150, x1: 210, y0: 50, y1: HZ, n: 34, seed: 5 });
    // ——— the sea: rough, the flash laid on it in a broken path under the strike
    bg += K.water(u, L, { horizon: HZ, bottom: 300, swell: .85, seed: 6, glitter: 112 });
    // ——— the two lower ships: reefed, lit only from behind, untouched
    bg += K.ship(u, L, { kind: 'brig', x: 20, y: 114, scale: .5, flip: true, sails: 'reefed', detail: 'mid', seed: 4, lights: true });
    bg += K.foam(u, { x: 20, y: 114.2, w: 34, h: .8, seed: 3, L });
    bg += K.ship(u, L, { kind: 'merchant', x: 184, y: 113.5, scale: .5, flip: true, sails: 'reefed', detail: 'mid', seed: 8, lights: true });
    bg += K.foam(u, { x: 184, y: 113.7, w: 36, h: .8, seed: 5, L });
    // ——— the man-of-war: all sail, the tallest masts; the bolt hits her main truck
    let mid = K.ship(u, L, Object.assign({ wake: true }, WAR));
    mid += K.foam(u, { x: WAR.x, y: WAR.y + .3, w: 96, h: 1.2, seed: 9, L });
    mid += K.localGlow(u, { x: TG.x, y: TG.y1 + 30, color: '#ff9a3a', power: .3, radius: 44 }, { core: false });
    mid += burningSail(u, L);
    let fx = bolt(u, BOLT0, [STRIKE[0], STRIKE[1] - .6], 21) + impact(u, STRIKE);
    // the flash on the water under the ship, cold
    fx += K.localGlow(u, { x: 112, y: HZ + 6, color: '#c8c4ff', power: .3, radius: 50 }, { squash: .2, core: false });
    // ——— under the glass: the near swell, dark, with foam
    let fg = rain(u, L, { x0: -10, x1: 200, y0: 120, y1: 230, n: 30, seed: 12 });
    return [bg + mid + fx, fg];
  },
};
