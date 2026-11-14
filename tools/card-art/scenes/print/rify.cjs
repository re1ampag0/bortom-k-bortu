// «Рифы» (Колода моря): seen from aloft, a lagoon of clear water over a coral reef. A brig came up the deep blue channel
// and is putting her helm over — her wake bends behind her — and the turn has carried her out of the channel onto the
// reef: through the water we see her keel grinding on a coral head, a hole stove in at the forefoot, splinters and
// bubbles and stirred-up sand; above, spray and foam burst at her bow. The reef lies everywhere under the clear water;
// here and there a head breaks the surface in a ring of surf. Every ship that changes place takes a hit to the Hull.
// Brief: docs/mockups/print/card-briefs.md «Рифы». Kit only, plus the scene's own reef and water.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad } = K;

const HZ = 46, WL = 98, SX = 96;   // horizon high (the eye is aloft), the brig's waterline and middle
// the sun high behind us and to the right (kit az: where the light comes FROM — 180 from behind): the water is clear
// (no glare), the reef's faces to the right and towards us are lit, its shadows fall on the sand away and to the left
const light = { time: 'day', haze: .25, key: { type: 'sun', az: 142, el: 56, color: '#fff2d6', power: 1 }, fill: { color: '#7fd6d6', power: .5 } };
const skel = { horizon: HZ, eye: 14, light: 'sun high behind-right; reef faces right/towards us lit, shadows on the sand up-left',
  items: [
    ['brig (roll 15, turned 12° bow up-left)', SX, WL, 96, 80, 'water, waterline y 98 at the middle, bow left'],
    ['submerged hull + hole at the forefoot', 64, 91, 64, 22, 'under the water, turned with the brig; hole at (70.5, 100)'],
    ['stone spire under the forefoot', 50, 103, 44, 28, 'reef bed, its point at the keel (70.4, 103.2)'],
    ['splash at the bow', 65, 91, 26, 24, 'water at the stem'],
    ['wake bending away', 127, 104, 68, 96, 'water, from the stern to the bottom right'],
    ['reef heads in surf', 0, 72, 200, 60, 'reef, breaking the surface (left, far right, near right)'],
    ['reef bed', 0, 60, 200, 220, 'sea floor under clear water, both sides of the channel'],
  ] };

const PAL = { sky: ['#3f8fcf', '#6fb2dd', '#a7d4ea', '#dcefee'], sea: ['#5aa9c8', '#1f7ea6', '#0d4f73'], cloudLit: '#ffffff', cloudShade: '#9ec4da' };

// a smooth closed path through points (Catmull-Rom)
function smooth(pts, closed = true) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
// an irregular blob round (cx, cy): rx × ry, jag — how ragged
function blobPts(cx, cy, rx, ry, seed, n = 11, jag = .28) {
  const R = rng(seed), out = [];
  for (let i = 0; i < n; i++) { const a = (i + (R() - .5) * .5) / n * Math.PI * 2, k = 1 - jag / 2 + R() * jag; out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return out;
}
const poly = pts => `M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
const blur = (id, sd) => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
// how much water lies over a thing at screen y (far = more water, the colour goes to the deep's)
const veil = y => clamp(1 - (y - HZ) / 190, 0, 1);
// perspective flattening of a flat shape on the floor at y (eye aloft)
const flat = y => clamp(.3 + (y - HZ) / 300, .3, .78);
const WATER = '#2a9cb6';

// one coral mass on the floor, seen through the water (veil by depth): its shadow on the sand (away and left), a dark
// body of lumps — each a dome lit on its crown and towards the lower right, dark at its foot — and a few muted colours
function coral(u, L, cx, cy, rx, seed, o = {}) {
  const R = rng(seed * 7 + 3), ry = rx * flat(cy) * (o.tall || 1), v = clamp(veil(cy) * .55 + (o.deep || 0), 0, 1), w = c => mix(c, WATER, v);
  const pts = blobPts(cx, cy, rx, ry, seed, 12, .36);
  let s = `<path d="${smooth(pts.map(([x, y]) => [x - rx * .2, y - ry * .5]))}" fill="${w('#0f3f4a')}" opacity=".55"/>`;
  s += `<path d="${smooth(pts)}" fill="${w(o.body || '#33402e')}"/>`;
  const n = 4 + Math.floor(R() * 3), cols = ['#b07a6a', '#c9a24f', '#7a6aa0', '#8f9b5a'];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * .5, dx = cx + Math.cos(a) * rx * r, dy = cy + Math.sin(a) * ry * r - ry * .08, dr = rx * (.32 + R() * .26), g = nid('cd', u);
    const lit = i === n - 1 && R() < .7 ? cols[Math.floor(R() * cols.length)] : '#a39a68';
    s += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${f(dx + dr * .22)}" cy="${f(dy - dr * flat(cy) * .1)}" r="${f(dr * 1.05)}"><stop offset="0" stop-color="${w(mix(lit, '#f3ecc8', .3))}"/><stop offset=".55" stop-color="${w(lit)}"/><stop offset="1" stop-color="${w('#2b3a2a')}"/></radialGradient></defs>`
      + `<path d="${smooth(blobPts(dx, dy, dr, dr * flat(cy) * 1.15, seed * 13 + i, 9, .3))}" fill="url(#${g})"/>`;
    // the creases of brain coral / the knobs of the heads
    if (dr > 4) for (let k = 0; k < 3; k++) { const yy = dy + (k - 1) * dr * flat(cy) * .38; s += `<path d="M${f(dx - dr * .55)} ${f(yy)}q${f(dr * .3)} ${f(-dr * .12)} ${f(dr * .55)} 0t${f(dr * .55)} 0" stroke="${w('#2a3426')}" stroke-width="${f(clamp(dr * .05, .3, .9))}" fill="none" opacity=".55"/>`; }
  }
  return s;
}

module.exports = { name: 'Рифы', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 14 });
    L.pal = Object.assign({}, L.pal, PAL);
    const R = rng(17);
    // ——— the sky: tropical blue, a low bank of fair-weather cloud on the horizon
    let bg = K.sky(u, L, { horizon: HZ + 2, stars: false });
    bg += K.cloudBank(u, L, { y: HZ - 1, h: 14, x0: -10, x1: 210, n: 5, seed: 6, far: .55 });
    bg += K.cloud(u, L, { x: 150, y: 22, w: 54, h: 12, seed: 9, far: .3 });
    // the open sea beyond the reef: deep blue to the horizon
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: .35, seed: 21, glitter: false });

    // ——— the lagoon floor: sand under clear turquoise water, fading into the deep at the reef's far edge
    { const g = nid('lf', u), m = nid('lm', u), b = nid('lb', u);
      bg += `<defs>${linGrad(g, 0, 58, 0, 280, [[0, '#2c9db8'], [.18, '#3cb9c0'], [.45, '#63d0c4'], [1, '#8fe0c8']])}${linGrad(m, 0, 54, 0, 74, [[0, '#fff', 0], [1, '#fff', 1]])}<mask id="${b}m" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="280"><rect x="0" y="54" width="200" height="230" fill="url(#${m})"/></mask></defs>`
        + `<g mask="url(#${b}m)"><rect x="0" y="54" width="200" height="230" fill="url(#${g})"/>`;
      // sand ripples and pale patches
      for (let i = 0; i < 26; i++) { const y = 70 + Math.pow(R(), .8) * 210, x = R() * 200, rx = (8 + R() * 18) * (y - HZ) / 90; bg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * flat(y) * .6)}" fill="#c9f0d8" opacity="${f(.18 + R() * .2)}"/>`; }
      // the deep channel the brig came up: dark blue, from the bottom right on out to the open sea; she has left it to the left
      const ch = [[214, 290], [150, 290], [136, 220], [130, 160], [128, 118], [134, 92], [142, 72], [150, 58], [170, 58], [168, 76], [164, 100], [166, 130], [176, 180], [196, 230], [214, 250]];
      const cb = nid('cb', u), cg = nid('cg', u);
      bg += `<defs>${blur(cb, 3.2)}${linGrad(cg, 0, 60, 0, 280, [[0, '#145f86'], [.5, '#1a7397'], [1, '#2589a5']])}</defs><path d="${smooth(ch)}" fill="url(#${cg})" filter="url(#${cb})" opacity=".92"/>`;
      // the reef: masses on both sides of the channel, far ones small and veiled, near ones big and clear
      const reefs = [
        [24, 62, 18, 1], [70, 66, 12, 2], [112, 64, 12, 3], [190, 66, 14, 5], [196, 92, 18, 6],
        [18, 96, 26, 7], [52, 116, 22, 8], [104, 128, 20, 9],
        [22, 156, 40, 11], [86, 166, 32, 12], [30, 232, 48, 14], [104, 252, 40, 15], [200, 150, 20, 16], [206, 250, 30, 17],
      ];
      for (const [x, y, r, s] of reefs) bg += coral(u, L, x, y, r * (y - HZ + 30) / 100, s);
      // caustics: a net of light rings on the sand, finer far off
      { const cc = nid('cc', u); let net = '';
        for (let i = 0; i < 120; i++) { const y = 74 + Math.pow(R(), .9) * 206, x = R() * 200, r = (2.4 + R() * 3.2) * (y - HZ) / 80; net += `<path d="${smooth(blobPts(x, y, r, r * flat(y), i + 400, 6, .5))}"/>`; }
        bg += `<defs>${blur(cc, .35)}</defs><g fill="none" stroke="#f4fff0" stroke-width=".45" opacity=".22" filter="url(#${cc})">${net}</g>`; }
      bg += '</g>'; }

    // ——— the water itself: deeper colour towards the horizon, the sky's sheen on it far off, light ripples
    { const g = nid('wv', u), s = nid('ws', u);
      bg += `<defs>${linGrad(g, 0, 56, 0, 280, [[0, '#1a6f95', .38], [.25, '#2190ad', .12], [1, '#38b2bf', .03]])}${linGrad(s, 0, HZ, 0, 96, [[0, '#d5eef2', .85], [.35, '#bfe4ee', .35], [1, '#bfe4ee', 0]])}</defs>`
        + `<rect x="0" y="${HZ}" width="200" height="${280 - HZ}" fill="url(#${g})"/><rect x="0" y="${HZ}" width="200" height="56" fill="url(#${s})"/>`;
      let rip = '';
      for (let i = 0; i < 150; i++) { const y = HZ + 2 + Math.pow(R(), 1.6) * 230, x = R() * 204 - 2, w = (1.2 + R() * 3) * (y - HZ + 6) / 40, h = w * .12;
        rip += `<path d="M${f(x - w)} ${f(y)}q${f(w)} ${f(-h * 2)} ${f(w * 2)} 0" stroke="#f2fbff" stroke-width="${f(clamp((y - HZ) / 120, .25, .7))}" fill="none" opacity="${f(.25 + R() * .35)}"/>`; }
      bg += rip; }

    // the brig is turned 12° across the picture, bow up and left: she lies along the bend of her wake, which starts at her stern
    const A = 12, ca = Math.cos(A * Math.PI / 180), sa = Math.sin(A * Math.PI / 180);
    const rot = (x, y) => [SX + (x - SX) * ca - (y - WL) * sa, WL + (x - SX) * sa + (y - WL) * ca], turn = `transform="rotate(${A} ${SX} ${WL})"`;
    const deep = '#13506a';
    // ——— the brig's body under the water, seen through it (drawn level, then turned with her): the run of the bottom
    // narrowing from the waterline to the keel, the wood going dark and blue with depth, seams following the bilge;
    // the hole stove in at the forefoot where the stone touches
    { const hb = nid('hb', u), hg = nid('hg', u), sb = nid('fs', u);
      const body = [[64.2, 97.4], [65, 101.2], [67.4, 104.8], [71.4, 107.6], [79, 109.4], [96, 110.2], [110, 109.8], [119, 108.4], [124.4, 105.4], [127, 101.4], [127.6, 97.4]];   // the brig is 66 × .95 long: stem 64.6, stern 127.4
      bg += `<defs>${blur(sb, 2.2)}</defs><ellipse cx="94" cy="125" rx="44" ry="5.5" fill="#0f4a5c" opacity=".3" filter="url(#${sb})"/>`;
      bg += `<defs>${blur(hb, .45)}${linGrad(hg, 0, 97, 0, 114, [[0, mix('#4a3626', '#1d6f8a', .38)], [.35, mix('#2e3c3c', '#17607e', .58)], [.7, '#145a78'], [1, '#0c3c58']])}</defs><g ${turn}>`
        + `<path d="${smooth(body, false)}Z" fill="url(#${hg})" filter="url(#${hb})"/>`;
      // the seams of the bottom: each strake runs out to the stem and the stern post, sagging with the bilge; fainter deeper
      for (let k = 1; k <= 4; k++) bg += `<path d="M${f(64.8 + k * .8)} ${f(97.8 + k * 2)}Q96 ${f(98 + k * 2.8)} ${f(127.4 - k * .5)} ${f(97.8 + k * 1.9)}" stroke="${mix('#1a120c', deep, k * .15)}" stroke-width=".42" fill="none" opacity="${f(.6 - k * .08)}"/>`;
      // the keel: a narrow dark spine under the bilge, from the forefoot to the heel of the stern post
      bg += `<path d="M70.4 107Q74 108.8 79 109.6T96 110.4Q110 110.4 118 109T124 105.8" stroke="${mix('#0b1517', deep, .25)}" stroke-width="1.5" fill="none" opacity=".85"/>`
        // the light through the water on the upper bilge: a few wavering lines of caustic
        + `<path d="M72 101.2q6 -1 12 .2t12 -.2t12 .4t10 -.3M70 104q8 -1.2 14 0t14 .2t14 -.3t10 .4" stroke="#e8fbf4" stroke-width=".4" fill="none" opacity=".22"/>`;
      // the hole: a ragged black mouth in the planking, the broken strakes' ends pointing in, sprung ends standing out
      const hole = [[64.8, 107.2], [66.4, 105.6], [67.6, 106.4], [69, 104.9], [70.4, 106], [72.2, 105], [73.4, 106.4], [75.4, 106.8], [74, 108], [75, 109.6], [72.6, 109.2], [71, 110.6], [69.4, 109.4], [67.2, 110.2], [66.8, 108.8]];
      const wood = mix('#dcbc8c', WATER, .18), woodD = mix('#7a5636', WATER, .25);
      bg += `<g transform="translate(71.5 105.4) scale(.85) translate(-70 -107.6)"><path d="M${hole.map(p => p.map(f).join(' ')).join('L')}Z" fill="${woodD}" transform="translate(.4 .5)"/><path d="M${hole.map(p => p.map(f).join(' ')).join('L')}Z" fill="#040b0c"/>`
        + `<g fill="${wood}"><path d="M64.4 106.6L68.8 107.3L64.8 107.9Z"/><path d="M75.8 107.2L71.6 107.8L75.4 108.5Z"/><path d="M67.4 106.2L70.4 107.9L68.6 105.8Z"/><path d="M71.4 110.8L70.2 108.4L72.6 109.6Z"/><path d="M66.6 109.8L68.6 108.6L67.6 110.6Z"/></g>`
        + `<g stroke="${wood}" stroke-linecap="round" fill="none"><path d="M73.4 106.2L77.8 103.4" stroke-width=".8"/><path d="M75 109.6L79.6 111" stroke-width=".7"/><path d="M67.2 110.2L63.6 112.8" stroke-width=".8"/><path d="M69 104.9L68 101.6" stroke-width=".6"/></g>`
        + `<path d="M64.8 107.2L66.4 105.6L67.6 106.4L69 104.9L70.4 106L72.2 105L73.4 106.4L75.4 106.8" stroke="#f0d8a8" stroke-width=".35" fill="none" opacity=".8"/></g></g>`; }
    // the bed under her forefoot, and the stone itself: a sharp grey-green spire rising off it, its point scraping the keel
    bg += coral(u, L, 72.7, 129, 16, 31, { tall: 1.1, deep: -.3, body: '#3d4a33' });
    bg += '<g transform="translate(2.7 -2.4)">';
    { const T = [67.7, 105.6], g = nid('st', u), g2 = nid('sl', u), sb = nid('sb', u);
      const lf = [[47, 133], [50.5, 127], [54.6, 121], [58.2, 116.4], [61.2, 112.8], [63.6, 110.2], [65.8, 107.6], T];
      const rt = [[69.2, 108], [70.6, 110.8], [73.6, 114.2], [77, 117.6], [81.8, 121.2], [86.4, 125], [91, 133]];
      bg += `<defs>${linGrad(g, 50, 0, 90, 0, [[0, mix('#26342c', WATER, .38)], [.5, mix('#3e4a3a', WATER, .3)], [1, mix('#55604a', WATER, .3)]])}${linGrad(g2, 68, 106, 84, 128, [[0, mix('#d6d0aa', WATER, .12)], [.4, mix('#8e8c68', WATER, .22)], [1, mix('#4c5440', WATER, .32)]])}${blur(sb, 2.4)}</defs>`
        + `<path d="${poly(lf.concat(rt))}" fill="url(#${g})"/>`
        + `<path d="${poly([T, ...rt, [82, 129], [74, 126.4], [70.2, 119], [68.6, 112]])}" fill="url(#${g2})"/>`
        // its cracks and ledges, a little weed low down
        + `<path d="M60 117.4L63.4 116.6L62.4 121M56 124.4L60.6 123.2M72 118.4L75.6 119.2L74.4 123.6M67.6 110.6L66.4 115.4" stroke="${mix('#1b2620', WATER, .3)}" stroke-width=".45" fill="none" opacity=".8"/>`
        // the point: fresh scraped stone and the scars of the keel on it
        + `<path d="M65.6 108.4L67.7 105.6L69.6 108.6" stroke="#f4eed2" stroke-width=".7" fill="none" stroke-linejoin="round" opacity=".9"/><path d="M64.4 110.6l3.2 -.6M66.4 111.8l3.6 -.4" stroke="#efe8c8" stroke-width=".35" opacity=".7"/>`
        // the sand thrown up round it
        + `<ellipse cx="78" cy="118" rx="12" ry="4.6" fill="#e2f6ea" opacity=".42" filter="url(#${sb})"/><ellipse cx="57" cy="117" rx="8" ry="3.8" fill="#e2f6ea" opacity=".38" filter="url(#${sb})"/>`;
      bg += '</g>';
      // splinters drifting off the hole
      for (let i = 0; i < 8; i++) { const x = 58 + R() * 30, y = 108 + R() * 16, a = R() * 180; bg += `<rect x="${f(x)}" y="${f(y)}" width="${f(2.4 + R() * 3)}" height=".8" fill="${mix('#d2ae7c', WATER, .25)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`; }
      // bubbles boiling out of the hole and rising to the surface by her bow
      const hc = rot(71.5, 105.4);
      for (let i = 0; i < 22; i++) { const t = R(), x = hc[0] + (R() - .5) * (3 + t * 6) + t * -1, y = hc[1] - t * 7, r = .3 + R() * .5 + t * .35;
        bg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#e8fbff" fill-opacity=".3" stroke="#f4fdff" stroke-width=".35" opacity="${f(.95 - t * .3)}"/>`; } }

    // ——— the wake: from her stern it bends away round to the bottom right — the channel she has turned out of
    { const st = rot(127.4, 98), wk = [st, [138, 108], [150, 113], [162, 120.4], [173, 132], [182, 151], [189, 177], [194, 200]];
      const wkL = wk.map(([x, y], i) => [x - i * 1.4, y + i * .5]), wkR = wk.map(([x, y], i) => [x + i * 2.2, y - i * .9]);
      const wb = nid('kb', u);
      bg += `<defs>${blur(wb, 1.1)}</defs><g filter="url(#${wb})"><path d="${smooth(wkL, false)}L${wkR.slice().reverse().map(p => p.map(f).join(' ')).join('L')}Z" fill="#eefcf9" opacity=".55"/>`
        + `<path d="${smooth(wkL, false)}" stroke="#ffffff" stroke-width="2" fill="none" opacity=".9"/><path d="${smooth(wkR, false)}" stroke="#ffffff" stroke-width="2.6" fill="none" opacity=".9"/></g>`;
      for (let i = 1; i < wk.length - 1; i++) bg += K.foam(u, { x: wk[i][0] - i * .2, y: wk[i][1] + .2, w: 8 + i * 4, h: 1.2 + i * .4, seed: 60 + i, L }); }

    // ——— reef heads breaking the surface: wet stone, a ring of surf
    const head = (x, y, w, h, seed) => K.rock(u, L, { x, y, w, h, wet: true, foam: true, seed })
      + K.foam(u, { x, y: y + .4, w: w * 1.9, h: 1.3 + w * .07, seed: seed + 1, L });
    bg += head(30, 84, 15, 6, 3) + head(166, 74, 9, 3.5, 5) + head(14, 72, 7, 2.5, 7) + head(178, 120, 18, 6.5, 9);

    // ——— the brig, rolling outwards in the turn, bow lifting onto the reef: turned with her body below, foam along
    // her waterline (her own straight wake would fight the bent one), the burst at her bow
    bg += `<g ${turn}>` + K.ship(u, L, { kind: 'brig', x: SX, y: WL, scale: .95, roll: 15, sails: 'full', detail: 'near', wake: false, seed: 9 })
      + K.foam(u, { x: 97, y: WL + .5, w: 62, h: 1.5, seed: 14, L }) + K.foam(u, { x: 71, y: WL + 1, w: 20, h: 2.2, seed: 12, L }) + '</g>';
    { const b = rot(64.6, 98); bg += K.splash(u, { x: b[0] + .5, y: b[1] + .6, w: 26, h: 24, seed: 2, L, wind: -1 }); }
    // splinters flung up from the forefoot
    { let sp = ''; const tone = L.ramp('oak', 60, 90);
      for (const [x, y, a, l] of [[60, 80, -30, 4], [64, 74, 20, 3], [56, 86, -60, 3.4], [72, 78, 50, 2.6], [52, 78, 10, 2.2]]) sp += `<rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height=".9" rx=".3" fill="${tone.half}" transform="rotate(${a} ${f(x)} ${f(y)})"/><rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height=".35" fill="${tone.lit}" transform="rotate(${a} ${f(x)} ${f(y)})"/>`;
      bg += sp; }

    // ——— under the glass: a big reef head in surf close by, lower left
    let fg = head(36, 206, 46, 15, 13);
    return [bg, fg];
  } };
