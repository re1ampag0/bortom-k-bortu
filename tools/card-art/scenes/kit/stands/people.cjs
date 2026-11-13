// Check sheet of the people (print/lib/people.cjs `figure`, `head34`): the six ready poses in a row under one light
// (night, the moon high on the left), three of them large, and three heads in three-quarter view (young, old with a
// beard, a woman) beside a fourth pose (en garde). Each small panel is a card (200 x 280 units, horizon 108).
// Render: node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/people.cjs --width 1000
'use strict';
const K = require('../index.cjs');
const P = require('../props.cjs');
const H = require('../../print/lib/people.cjs');

const HZ = 108;
const MOON = { time: 'night', haze: .3, key: { type: 'moon', az: 248, el: 34, color: '#d8e4ff', power: .9 }, fill: { color: '#34405e', power: .38 }, rim: { az: 60, color: '#bfe0ff', power: .45 } };
const cap = (x, y, t) => `<text x="${x + 4}" y="${y + 9}" font-family="sans-serif" font-size="6.5" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${t}</text>`;
const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-width=".8"/>`;

const deck = (u, L) => K.sky(u, L, { horizon: HZ, stars: 50, seed: 3 }) + K.cloudBank(u, L, { y: HZ - 10, h: 12, x0: 0, x1: 200, n: 4, seed: 4, far: .6 })
  + K.water(u, L, { horizon: HZ, bottom: 175 }) + P.bulwark(u, L, { x1: 0, x2: 200, y: 172, h: 38, seed: 27 }) + K.deck(u, L, { horizon: HZ, top: 172, bottom: 280, seed: 8 });

// the dress of the crew (one per pose, so the garments are all seen)
const DRESS = {
  stand: { shirt: '#d8ccb0', vest: '#5a2a1c', trousers: '#4a3c30', boots: '#2a1c14', sash: '#8a2418', kerchief: '#7a2418' },
  walk: { shirt: '#cfc4aa', coat: '#2c3446', trousers: '#3c3428', boots: '#22160e', belt: '#2a1a10' },
  haul: { shirt: '#ddd2b8', trousers: '#5a4a36', boot: 'bare', sash: '#3a4a6a', sleeves: 'rolled' },
  aim: { shirt: '#d8ccb0', vest: '#2a2a2e', coat: '#5a1c18', coatLen: 'knee', trousers: '#2e2a26', boots: '#1a120c', belt: '#2a1a10' },
  saber: { shirt: '#d4c8ac', vest: '#3a4a2c', trousers: '#4a3c30', boots: '#2a1c14', sash: '#7a2418' },
  sit: { shirt: '#d8ccb0', vest: '#4a3020', trousers: '#40362c', boots: '#2a1c14', belt: '#2a1a10', kerchief: '#2a3a5a' },
  helm: { shirt: '#cfc4aa', coat: '#3e2f24', trousers: '#3a3028', boots: '#22160e', kerchief: '#7a2418' }
};
const HEADS = {
  stand: { hair: { style: 'tied', color: '#2a1a10' }, stubble: true },
  walk: { hair: { style: 'short', color: '#3a2a1a' } },
  haul: { hair: { style: 'curly', color: '#1a120c' }, beard: 'short' },
  aim: { hair: { style: 'tied', color: '#e8e0d0', ribbon: '#1a1a22' }, brow: 'frown' },
  saber: { hair: { style: 'long', color: '#2a1a10' }, moustache: true, brow: 'frown', mouth: .3 },
  sit: { hair: { style: 'short', color: '#5a4a3a' }, beard: 'full', hairColor: '#5a4a3a' },
  helm: { hair: { style: 'short', color: '#9e9a92' }, hairColor: '#a29d94', beard: 'short', moustache: true, brow: 'frown' }
};
const HAT = { aim: { color: '#1c1a1e', trim: '#c8a050' } };

// a sabre or a pistol in a fist: the grip along the fist's axis
const inHand = (u, L, h, kind, s, up) => { const ax = h.axis || [Math.cos(h.a * Math.PI / 180), Math.sin(h.a * Math.PI / 180)], g = h.grip || h.at;
  let a = Math.atan2(ax[1], ax[0]) * 180 / Math.PI; if (up != null && Math.sin(a * Math.PI / 180) * up > 0) a += 180;
  if (kind === 'pistol') a = h.a + (Math.cos(h.a * Math.PI / 180) < 0 ? 180 : 0);   // the barrel along the arm
  const gl = kind === 'sabre' ? [-17.6, -.8] : [-9, .6], c = Math.cos(a * Math.PI / 180), sn = Math.sin(a * Math.PI / 180);
  const o = { x: g[0] - (gl[0] * c - gl[1] * sn) * s, y: g[1] - (gl[0] * sn + gl[1] * c) * s, s, rot: a, contact: false };
  return kind === 'sabre' ? P.sabre(u, L, o) : P.pistol(u, L, o); };

// one pose in its panel: the figure with what it holds or leans on
function posed(u, pose, o = {}) {
  const L = K.makeLight(MOON, { horizon: HZ }), at = o.at || [100, 262], h = o.h || 178, base = { L, pose, at, h, horizon: HZ, dress: DRESS[pose], head: HEADS[pose], hat: HAT[pose], seed: 5 };
  let s = deck(u, L);
  if (pose === 'sit') {
    const fg = H.figure(u, Object.assign(base, { at: [92, 262], h: 170, handsSeparate: false })), seat = fg.seat, ty = fg.wrist.R.at[1] + fg.Hh * .2;
    s += K.castShadow(u, L, { x: seat[0] - 6, y: 258, w: 30, h: 40, horizon: HZ, d: .5 }) + P.barrel(u, L, { x: seat[0] - 8, y: 262, s: 1.25, seed: 3 });
    s += fg.layers.shadow + fg.layers.back + fg.layers.legs + fg.layers.body + fg.layers.head;
    // the table in front: a top seen a little from above, its front board, two legs
    const x0 = 96, x1 = 196, d = 10;
    s += K.castShadow(u, L, { x: 146, y: 274, w: 96, h: ty < 240 ? 270 - ty : 30, horizon: HZ, d: .4 })
      + K.shadeBox(u, [{ pts: [[x0 + 6, ty + 6], [x0 + 12, ty + 6], [x0 + 12, 276], [x0 + 6, 276]], n: 'front' }, { pts: [[x1 - 12, ty + 6], [x1 - 6, ty + 6], [x1 - 6, 276], [x1 - 12, 276]], n: 'front' },
        { pts: [[x0 + 4, ty - d], [x1 + 4, ty - d], [x1, ty], [x0, ty]], n: 'top', grain: [1, 0] }, { pts: [[x0, ty], [x1, ty], [x1, ty + 7], [x0, ty + 7]], n: 'front', grain: [1, 0] }], L, 'oak', { seed: 4, outline: .5 })
      + P.mug(u, L, { x: 168, y: ty - 3, s: 1.3, seed: 2 }) + P.coins(u, L, { x: 140, y: ty - 4, s: 1, seed: 2 });
    return s + fg.layers.front;
  }
  if (pose === 'helm') {
    const WC = [100, 196], RIM = 30, TH = [-150, -38];
    const grips = TH.map(t => [WC[0] + Math.cos(t * Math.PI / 180) * (RIM + 8), WC[1] + Math.sin(t * Math.PI / 180) * (RIM + 8)]);
    const fg = H.figure(u, Object.assign(base, { reach: { R: grips[0], L: grips[1] }, handsSeparate: true }));
    s += fg.layers.shadow + fg.layers.back + fg.layers.legs + fg.layers.body + fg.layers.head;
    // the wheel on its post, ten spokes with handles
    s += K.shadeBox(u, [{ pts: [[WC[0] - 7, WC[1] + 8], [WC[0] + 7, WC[1] + 8], [WC[0] + 9, 272], [WC[0] - 9, 272]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: 3, outline: .4 });
    for (let k = 0; k < 10; k++) { const t = (TH[0] + k * 36) * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
      s += K.shadeCyl(u, WC[0] + c * 5, WC[1] + sn * 5, WC[0] + c * (RIM + 12), WC[1] + sn * (RIM + 12), 1.5, L, 'oak', { r1: 1.6, r2: 1.3, outline: .3, seed: k + 2 }); }
    s += `<circle cx="${WC[0]}" cy="${WC[1]}" r="${RIM}" fill="none" stroke="#0e0804" stroke-width="6.4"/><circle cx="${WC[0]}" cy="${WC[1]}" r="${RIM}" fill="none" stroke="url(#oak${u})" stroke-width="5"/>`
      + K.shadeSphere(u, WC[0], WC[1], 6, L, 'brass', { outline: .4 });
    s += fg.layers.front;
    for (const k of ['R', 'L']) s += fg.hands[k].back + fg.hands[k].front;
    return s;
  }
  const fg = H.figure(u, Object.assign(base, { handsSeparate: pose === 'aim' || pose === 'saber' }));
  s += fg.svg;
  if (pose === 'haul') { const a = fg.hands.R.grip || fg.wrist.R.at, b = fg.hands.L.grip || fg.wrist.L.at, dx = a[0] - b[0], dy = a[1] - b[1];
    s += P.rope(u, L, [[b[0] - dx * .9, b[1] - dy * .9 + 10], [b[0] - dx * .3, b[1] - dy * .3 + 2], b, a, [a[0] + dx * 1.5, a[1] + dy * 1.5], [220, a[1] + (220 - a[0]) * dy / (dx || 1)]], { r: 1.2, seed: 4 });
    s += fg.hands.R.front + fg.hands.L.front; }
  if (pose === 'aim') { s += fg.hands.L.back + inHand(u, L, fg.hands.L, 'sabre', fg.Hh * 3.2 / 46, -1) + fg.hands.L.front
    + fg.hands.R.back + inHand(u, L, fg.hands.R, 'pistol', fg.Hh * 1.7 / 27) + fg.hands.R.front; }
  if (pose === 'saber') s += fg.hands.L.back + fg.hands.L.front + fg.hands.R.back + inHand(u, L, fg.hands.R, 'sabre', fg.Hh * 3.2 / 46, 1) + fg.hands.R.front;
  return s;
}

const ROW = ['stand', 'walk', 'haul', 'aim', 'sit', 'helm'];
const NAMES = { stand: 'стоит (вес на ближней ноге)', walk: 'идёт', haul: 'тянет канат', aim: 'целится (пистолет, сабля)', sit: 'сидит за столом', helm: 'у штурвала', saber: 'к бою с саблей' };
const panel = (x, y, w, h, vb, body, t) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${body}</svg>` + box(x, y, w, h) + cap(x, y, t);

// three heads in three-quarter view under the same moon (a dark ground, the skin's ramp of the light)
const headPanel = (u, which) => { const L = K.makeLight(MOON, { horizon: HZ }), c = [100, 104], r = 50, skin = L.ramp('skin', c[0], c[1]);
  const lt = L.at(c[0], c[1]), Lp = [lt.ux, lt.uy];
  const O = {
    young: { turn: .42, dir: 1, hair: { style: 'tied', color: '#3a2414' }, look: [.2, 0], smile: .15 },
    old: { turn: .5, dir: -1, hair: { style: 'short', color: '#b8b2a8' }, hairColor: '#c2bcb2', beard: 'full', brow: 'frown', nod: 6, eye: 'half' },
    woman: { turn: .38, dir: 1, jawW: .86, hair: { style: 'long', color: '#5a3018' }, hairColor: '#5a3018', lips: '#a84a44', noseW: .82, browW: .7, eyeW: 1.05, smile: .2, look: [-.2, 0] }
  }[which];
  const g = K.nid('hb', u);
  let s = `<defs>${K.radGrad(g, 70, 60, 200, [[0, '#26304a'], [1, '#0a0d16']])}</defs><rect width="200" height="200" fill="url(#${g})"/>`;
  // the shoulders and the neck under the head, so the head has its support
  const sh = { young: '#d8ccb0', old: '#3e2f24', woman: '#5a2a3a' }[which], tn = { lit: K.mix(sh, '#d8e4ff', .35), half: K.mix(sh, '#303742', .3), shadow: K.mix(sh, '#000', .55), outline: K.mix(sh, '#000', .85) };
  s += `<path d="M20 210Q24 172 62 162Q92 154 100 158Q108 154 138 162Q176 172 180 210Z" fill="${tn.half}" stroke="${tn.outline}" stroke-width=".8"/>`
    + `<path d="M30 200Q36 176 64 166" stroke="${tn.lit}" stroke-width="2" fill="none" opacity=".5"/>`;
  s += H.cloth(u, { spine: [[100, 170], [100, 136]], w: [44, 38], tone: Object.assign({}, skin, { core: K.mix(skin.half, skin.shadow, .45) }), folds: false, lit: -1 });
  const hd = H.head34(u, Object.assign({ c, r, tone: Object.assign({}, skin, { core: K.mix(skin.half, skin.shadow, .45) }), light: Lp, tailApart: true, white: K.mix('#efe6da', skin.half, .5) }, O));
  const bgEnd = s.indexOf('<path d="M20 210');
  return s.slice(0, bgEnd) + hd.tail + s.slice(bgEnd) + hd.svg + require('../../print/lib/hat.cjs').rimArc(hd, { r, light: [-.9, -.3], color: '#bfe0ff', span: 34, width: r * .03, opacity: .2 });
};

module.exports = { sheets: {
  people: { w: 1200, h: 1024, bg: '#222', svg: () => {
    let s = '';
    ROW.forEach((p, i) => { s += panel(i * 200, 0, 200, 280, '0 0 200 280', posed('P' + i, p), NAMES[p]); });
    ['stand', 'walk', 'aim'].forEach((p, i) => { s += panel(i * 400, 280, 400, 444, '20 74 160 178', posed('Q' + i, p), NAMES[p] + ' — крупно'); });
    ['young', 'old', 'woman'].forEach((w, i) => { s += panel(i * 300, 724, 300, 300, '0 0 200 200', headPanel('Hd' + i, w), { young: 'молодой, 3/4', old: 'старый с бородой, 3/4', woman: 'женщина, 3/4' }[w]); });
    s += panel(900, 724, 300, 300, '10 70 180 180', posed('S0', 'saber'), NAMES.saber);
    return s; } }
} };
