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

// one coral mass on the floor: its shadow on the sand (away and left), a dark body, a lit crown to the lower right,
// polyps and fans in muted colours; all of it seen through the water (veil by depth)
function coral(u, L, cx, cy, rx, seed, o = {}) {
  const R = rng(seed * 7 + 3), ry = rx * flat(cy) * (o.tall || 1), v = veil(cy) * .7 + (o.deep || 0), w = c => mix(c, WATER, v);
  const pts = blobPts(cx, cy, rx, ry, seed, 12, .34);
  let s = '';
  const sh = pts.map(([x, y]) => [x - rx * .16, y - ry * .3]);
  s += `<path d="${smooth(sh)}" fill="${w('#1f5a5e')}" opacity=".55"/>`;
  s += `<path d="${smooth(pts)}" fill="${w(o.body || '#4a6550')}"/>`;
  // the side towards us in the shade (the light is high: the crown is lighter than the flanks)
  const lip = pts.map(([x, y]) => [x + (x - cx) * -.12 + rx * .05, y + (y > cy ? -ry * .1 : ry * .55)]);
  s += `<path d="${smooth(lip)}" fill="${w(o.crown || '#7c8a5e')}"/>`;
  const hi = blobPts(cx + rx * .18, cy + ry * .05, rx * .5, ry * .42, seed + 11, 9, .4);
  s += `<path d="${smooth(hi)}" fill="${w('#a9a477')}" opacity=".75"/>`;
  // polyps and small heads
  const cols = ['#c27f72', '#d2ad62', '#7d74ad', '#d9c99a', '#5f8f6a'];
  const n = Math.round(rx * .9);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * .78, x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r * .85, rr = (.6 + R() * 1.4) * (rx / 14), c = cols[Math.floor(R() * cols.length)];
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr)}" ry="${f(rr * flat(cy) * 1.2)}" fill="${w(c)}"/><ellipse cx="${f(x + rr * .25)}" cy="${f(y + rr * .1)}" rx="${f(rr * .45)}" ry="${f(rr * .3)}" fill="${w(mix(c, '#fff4d6', .45))}" opacity=".8"/>`;
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
      // the deep channel the brig came up: dark blue, winding in from the bottom right to her stern and on past her
      const ch = [[214, 286], [158, 286], [140, 220], [132, 160], [118, 124], [92, 106], [60, 96], [30, 84], [14, 72], [40, 68], [74, 82], [118, 96], [150, 116], [168, 150], [186, 210], [214, 250]];
      const cb = nid('cb', u), cg = nid('cg', u);
      bg += `<defs>${blur(cb, 3.2)}${linGrad(cg, 0, 60, 0, 280, [[0, '#145f86'], [.5, '#1a7397'], [1, '#2589a5']])}</defs><path d="${smooth(ch)}" fill="url(#${cg})" filter="url(#${cb})" opacity=".92"/>`;
      // the reef: masses on both sides of the channel, far ones small and veiled, near ones big and clear
      const reefs = [
        [22, 62, 16, 1], [58, 64, 12, 2], [96, 70, 14, 3], [150, 66, 18, 4], [184, 72, 14, 5], [176, 90, 18, 6],
        [12, 98, 20, 7], [44, 112, 22, 8], [100, 128, 20, 9], [196, 112, 18, 10],
        [20, 150, 34, 11], [76, 158, 30, 12], [118, 186, 22, 13], [24, 226, 40, 14], [96, 246, 36, 15], [186, 182, 14, 16], [198, 244, 26, 17],
      ];
      for (const [x, y, r, s] of reefs) bg += coral(u, L, x, y, r * (y - HZ + 30) / 100, s);
      // caustics: a net of light rings on the sand, finer far off
      { const cc = nid('cc', u); let net = '';
        for (let i = 0; i < 120; i++) { const y = 74 + Math.pow(R(), .9) * 206, x = R() * 200, r = (2.4 + R() * 3.2) * (y - HZ) / 80; net += `<path d="${smooth(blobPts(x, y, r, r * flat(y), i + 400, 6, .5))}"/>`; }
        bg += `<defs>${blur(cc, .35)}</defs><g fill="none" stroke="#f4fff0" stroke-width=".55" opacity=".4" filter="url(#${cc})">${net}</g>`; }
      bg += '</g>'; }

    // ——— the brig's body under the water (seen through it, dark and veiled) and the coral head it has run onto
    const keel = [[62, 98.5], [64, 104], [71, 108.6], [86, 111], [108, 111.6], [122, 109.4], [129, 104], [130, 98.5]];
    { const hb = nid('hb', u);
      bg += `<defs>${blur(hb, .9)}</defs><path d="${smooth(keel, false)}Z" fill="${mix('#3a2a20', WATER, .45)}" opacity=".78" filter="url(#${hb})"/>`
        + `<path d="${smooth(keel.slice(1, 7), false)}" fill="none" stroke="${mix('#1b130e', WATER, .3)}" stroke-width="1.2" opacity=".7" filter="url(#${hb})"/>`
        // her shadow on the sand below, away and left
        + `<ellipse cx="88" cy="114" rx="40" ry="5" fill="#0f4a5c" opacity=".35" filter="url(#${hb})"/>`; }
    // the coral head under the forefoot: its crown grinds into the keel
    bg += coral(u, L, 74, 118, 15, 31, { tall: 1.5, deep: -.1, body: '#566a4d' });
    { const sp = [[64, 120], [66, 112], [70, 106.6], [74, 105.2], [78, 107], [82, 112], [84, 120]];
      bg += `<path d="${smooth(sp)}" fill="${mix('#6e6f4f', WATER, .32)}"/><path d="M67 113Q72 106.6 77.5 107.4" fill="none" stroke="${mix('#c9c08a', WATER, .3)}" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>`; }
    // the hole stove in at the forefoot: ragged dark mouth, light splintered edges, splinters drifting
    { const hole = [[68.5, 104.8], [71.5, 103], [73.5, 104.4], [76.5, 103.2], [78.8, 105.6], [76.8, 107.8], [72.6, 108.2], [69.6, 107.4]];
      bg += `<path d="M${hole.map(p => p.map(f).join(' ')).join('L')}Z" fill="#0a1410" opacity=".9"/>`;
      for (const [x1, y1, x2, y2] of [[68.5, 104.8, 66.2, 103.2], [71.5, 103, 70.6, 100.8], [76.5, 103.2, 78.4, 101.2], [78.8, 105.6, 81.4, 105], [76.8, 107.8, 79, 109.6]])
        bg += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${mix('#d9b98a', WATER, .25)}" stroke-width=".8" stroke-linecap="round"/>`;
      for (let i = 0; i < 7; i++) { const x = 60 + R() * 30, y = 108 + R() * 14, a = R() * 180; bg += `<rect x="${f(x)}" y="${f(y)}" width="${f(2 + R() * 3)}" height=".7" fill="${mix('#c8a676', WATER, .35)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`; }
      // the sand stirred up round the coral head, and bubbles rising from the hole
      const sb = nid('sb', u);
      bg += `<defs>${blur(sb, 2.2)}</defs><ellipse cx="86" cy="118" rx="18" ry="6" fill="#d8f2e2" opacity=".42" filter="url(#${sb})"/><ellipse cx="62" cy="114" rx="10" ry="4" fill="#d8f2e2" opacity=".35" filter="url(#${sb})"/>`;
      for (let i = 0; i < 14; i++) { const x = 70 + (R() - .5) * 12, y = 99.5 + R() * 7, r = .35 + R() * .7; bg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="#e8fbff" stroke-width=".35" opacity=".85"/>`; } }

    // ——— the water itself: deeper colour towards the horizon, the sky's sheen on it far off, light ripples
    { const g = nid('wv', u), s = nid('ws', u);
      bg += `<defs>${linGrad(g, 0, 56, 0, 280, [[0, '#1a6f95', .55], [.25, '#2190ad', .25], [1, '#38b2bf', .06]])}${linGrad(s, 0, HZ, 0, 96, [[0, '#d5eef2', .85], [.35, '#bfe4ee', .35], [1, '#bfe4ee', 0]])}</defs>`
        + `<rect x="0" y="${HZ}" width="200" height="${280 - HZ}" fill="url(#${g})"/><rect x="0" y="${HZ}" width="200" height="56" fill="url(#${s})"/>`;
      let rip = '';
      for (let i = 0; i < 150; i++) { const y = HZ + 2 + Math.pow(R(), 1.6) * 230, x = R() * 204 - 2, w = (1.2 + R() * 3) * (y - HZ + 6) / 40, h = w * .12;
        rip += `<path d="M${f(x - w)} ${f(y)}q${f(w)} ${f(-h * 2)} ${f(w * 2)} 0" stroke="#f2fbff" stroke-width="${f(clamp((y - HZ) / 120, .25, .7))}" fill="none" opacity="${f(.25 + R() * .35)}"/>`; }
      bg += rip; }

    // ——— the wake: she came up the channel and is turning — the white track bends round behind her stern
    { const wk = [[128, 100], [142, 103], [156, 109], [168, 120], [178, 136], [186, 158], [192, 186]];
      const wkL = wk.map(([x, y], i) => [x - i * 1.4, y + i * .4]), wkR = wk.map(([x, y], i) => [x + i * 2.2, y - i * .9]);
      const wb = nid('kb', u);
      bg += `<defs>${blur(wb, 1.1)}</defs><g filter="url(#${wb})"><path d="${smooth(wkL, false)}L${wkR.slice().reverse().map(p => p.map(f).join(' ')).join('L')}Z" fill="#e8fbf8" opacity=".35"/>`
        + `<path d="${smooth(wkL, false)}" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".75"/><path d="${smooth(wkR, false)}" stroke="#ffffff" stroke-width="1.8" fill="none" opacity=".7"/></g>`;
      for (let i = 1; i < wk.length - 1; i++) bg += K.foam(u, { x: wk[i][0], y: wk[i][1], w: 6 + i * 3, h: .8 + i * .25, seed: 60 + i, L }); }

    // ——— reef heads breaking the surface: wet stone, a ring of surf
    const head = (x, y, w, h, seed) => K.rock(u, L, { x, y, w, h, wet: true, foam: true, seed })
      + K.foam(u, { x, y: y + .4, w: w * 1.5, h: 1 + w * .05, seed: seed + 1, L });
    bg += head(30, 84, 15, 6, 3) + head(166, 74, 9, 3.5, 5) + head(14, 72, 7, 2.5, 7) + head(178, 120, 18, 6.5, 9);

    // ——— the brig, rolling outwards in the turn, bow lifting onto the reef; foam along her, the burst at her bow
    bg += K.ship(u, L, { kind: 'brig', x: SX, y: WL, scale: .95, roll: 12, heel: -4, sails: 'full', detail: 'near', wake: true, seed: 9 });
    bg += K.splash(u, { x: 63, y: WL + .5, w: 22, h: 20, seed: 2, L, wind: -1 }) + K.foam(u, { x: 66, y: WL + 1, w: 26, h: 2.2, seed: 12, L });
    // splinters flung up from the forefoot
    { let sp = ''; const tone = L.ramp('oak', 60, 90);
      for (const [x, y, a, l] of [[56, 86, -30, 4], [60, 80, 20, 3], [52, 92, -60, 3.4], [68, 84, 50, 2.6], [48, 84, 10, 2.2]]) sp += `<rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height=".9" rx=".3" fill="${tone.half}" transform="rotate(${a} ${f(x)} ${f(y)})"/><rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height=".35" fill="${tone.lit}" transform="rotate(${a} ${f(x)} ${f(y)})"/>`;
      bg += sp; }

    // ——— under the glass: a big reef head in surf close by, lower left
    let fg = head(36, 206, 46, 15, 13);
    return [bg, fg];
  } };
