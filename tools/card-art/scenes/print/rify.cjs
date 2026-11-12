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
    ['brig (roll 12, heel -4, turning)', SX, WL, 96, 70, 'water, waterline y 98, bow left'],
    ['submerged hull + hole', 64, 111, 66, 13, 'under the water under the brig'],
    ['coral head under the forefoot', 72, 124, 26, 22, 'reef bed, its top at the keel (y ~106)'],
    ['splash at the bow', 62, WL, 22, 18, 'water at the forefoot'],
    ['wake bending away', 130, 100, 70, 60, 'water, from the stern to the bottom right'],
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

    // ——— the brig's body under the water (seen through it) and the coral head it has run onto
    const keel = [[62, 98.5], [63.5, 106], [70, 112.5], [86, 115.5], [108, 116], [122, 113], [129, 106], [130, 98.5]];
    { const hb = nid('hb', u);
      bg += `<defs>${blur(hb, .7)}</defs><ellipse cx="86" cy="122" rx="40" ry="5" fill="#0f4a5c" opacity=".35" filter="url(#${hb})"/>`
        + `<path d="${smooth(keel, false)}Z" fill="${mix('#4a3324', WATER, .32)}" opacity=".9" filter="url(#${hb})"/>`
        + `<path d="${smooth(keel.slice(1, 7), false)}" fill="none" stroke="${mix('#1b130e', WATER, .2)}" stroke-width="1.6" opacity=".8" filter="url(#${hb})"/>`
        + [104, 108.5, 112].map(y => `<path d="M${f(66 + (y - 104) * .6)} ${y}L${f(126 - (y - 104) * .5)} ${f(y + .4)}" stroke="${mix('#2a1c14', WATER, .35)}" stroke-width=".45" opacity=".7"/>`).join(''); }
    // the coral head under the forefoot: its crown grinds into the keel
    bg += coral(u, L, 72, 128, 18, 31, { tall: 1.6, deep: -.3, body: '#3d4a33' });
    { const sp = [[60, 129], [62, 120], [66, 113], [71, 110.4], [76, 111.2], [81, 116], [84, 129]], g = nid('sp', u);
      bg += `<defs>${linGrad(g, 66, 111, 78, 128, [[0, mix('#b9b083', WATER, .15)], [.5, mix('#6f6c4a', WATER, .22)], [1, mix('#2f3a2a', WATER, .3)]])}</defs><path d="${smooth(sp)}" fill="url(#${g})"/>`
        + `<path d="M64.5 116Q71 110.2 78.5 112" fill="none" stroke="#efe6bf" stroke-width="1" stroke-linecap="round" opacity=".8"/>`; }
    // the hole stove in at the forefoot: ragged dark mouth, light splintered edges, splinters drifting
    { const c = [73.6, 109.4], hole = [[68.5, 104.8], [71.5, 103], [73.5, 104.4], [76.5, 103.2], [78.8, 105.6], [76.8, 107.8], [72.6, 108.2], [69.6, 107.4]].map(([x, y]) => [c[0] + (x - 73.6) * 1.6, c[1] + (y - 105.5) * 1.5]);
      bg += `<path d="M${hole.map(p => p.map(f).join(' ')).join('L')}Z" fill="#071010" opacity=".95"/>`;
      for (const [i, dx, dy] of [[0, -3, -2], [1, -1, -3], [3, 2, -2.6], [4, 3.2, -.4], [5, 2.4, 2.2], [6, -.6, 2.6]]) { const [x, y] = hole[i];
        bg += `<path d="M${f(x)} ${f(y)}L${f(x + dx)} ${f(y + dy)}" stroke="${mix('#e6c896', WATER, .15)}" stroke-width=".9" stroke-linecap="round"/>`; }
      for (let i = 0; i < 8; i++) { const x = 58 + R() * 34, y = 112 + R() * 14, a = R() * 180; bg += `<rect x="${f(x)}" y="${f(y)}" width="${f(2.4 + R() * 3)}" height=".8" fill="${mix('#d2ae7c', WATER, .25)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`; }
      // the sand stirred up round the coral head, and bubbles rising from the hole to the surface
      const sb = nid('sb', u);
      bg += `<defs>${blur(sb, 2.4)}</defs><ellipse cx="90" cy="124" rx="18" ry="6" fill="#e2f6ea" opacity=".5" filter="url(#${sb})"/><ellipse cx="56" cy="121" rx="11" ry="4.5" fill="#e2f6ea" opacity=".45" filter="url(#${sb})"/>`;
      for (let i = 0; i < 18; i++) { const x = 73 + (R() - .5) * 14, y = 99.5 + R() * 9, r = .4 + R() * .9; bg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#e8fbff" fill-opacity=".25" stroke="#f4fdff" stroke-width=".4" opacity=".9"/>`; } }

    // ——— the wake: she came up the channel and is turning — the white track bends round behind her stern
    { const wk = [[128, 100], [142, 103], [156, 109], [168, 120], [178, 136], [186, 158], [192, 186]];
      const wkL = wk.map(([x, y], i) => [x - i * 1.4, y + i * .4]), wkR = wk.map(([x, y], i) => [x + i * 2.2, y - i * .9]);
      const wb = nid('kb', u);
      bg += `<defs>${blur(wb, 1.1)}</defs><g filter="url(#${wb})"><path d="${smooth(wkL, false)}L${wkR.slice().reverse().map(p => p.map(f).join(' ')).join('L')}Z" fill="#eefcf9" opacity=".55"/>`
        + `<path d="${smooth(wkL, false)}" stroke="#ffffff" stroke-width="2" fill="none" opacity=".9"/><path d="${smooth(wkR, false)}" stroke="#ffffff" stroke-width="2.6" fill="none" opacity=".9"/></g>`;
      for (let i = 1; i < wk.length - 1; i++) bg += K.foam(u, { x: wk[i][0] - i * .2, y: wk[i][1] + .2, w: 8 + i * 4, h: 1.2 + i * .4, seed: 60 + i, L }); }

    // ——— reef heads breaking the surface: wet stone, a ring of surf
    const head = (x, y, w, h, seed) => K.rock(u, L, { x, y, w, h, wet: true, foam: true, seed })
      + K.foam(u, { x, y: y + .4, w: w * 1.9, h: 1.3 + w * .07, seed: seed + 1, L });
    bg += head(30, 84, 15, 6, 3) + head(166, 74, 9, 3.5, 5) + head(14, 72, 7, 2.5, 7) + head(178, 120, 18, 6.5, 9);

    // ——— the brig, rolling outwards in the turn, bow lifting onto the reef; foam along her, the burst at her bow
    bg += K.ship(u, L, { kind: 'brig', x: SX, y: WL, scale: .95, roll: 15, heel: -4, sails: 'full', detail: 'near', wake: true, seed: 9 });
    bg += K.splash(u, { x: 63, y: WL + .5, w: 26, h: 24, seed: 2, L, wind: -1 }) + K.foam(u, { x: 66, y: WL + 1, w: 26, h: 2.2, seed: 12, L });
    // splinters flung up from the forefoot
    { let sp = ''; const tone = L.ramp('oak', 60, 90);
      for (const [x, y, a, l] of [[56, 86, -30, 4], [60, 80, 20, 3], [52, 92, -60, 3.4], [68, 84, 50, 2.6], [48, 84, 10, 2.2]]) sp += `<rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height=".9" rx=".3" fill="${tone.half}" transform="rotate(${a} ${f(x)} ${f(y)})"/><rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height=".35" fill="${tone.lit}" transform="rotate(${a} ${f(x)} ${f(y)})"/>`;
      bg += sp; }

    // ——— under the glass: a big reef head in surf close by, lower left
    let fg = head(36, 206, 46, 15, 13);
    return [bg, fg];
  } };
