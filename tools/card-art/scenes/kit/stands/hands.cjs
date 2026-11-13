// Check sheet of the hands (print/lib/people.cjs `hand3`, and figure()'s hands): six grips under one light (a warm
// lantern on the left, at night indoors) — a mug held by its body, a sabre's grip seen from the thumb side, a card
// with the thumb on its face, a coin in a pinch, a rope in a fist, a pistol with the index finger on the trigger.
// Each grip is a card (200 x 280 units, the hand ~15 units long) shown twice: large (the top row, a crop) and at the
// card's own size (the bottom row: at --width 1500 each card is 250 px, the size of the printed card). A second sheet
// shows figure() with these hands: the poses 'aim' (pistol and sabre) and 'haul' (rope), whole and large.
// Render: node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/hands.cjs --width 1500
'use strict';
const K = require('../index.cjs');
const P = require('../props.cjs');
const H = require('../../print/lib/people.cjs');

const HZ = 120, LAMP = { x: 16, y: 196, s: 1.5 };
const LIGHT = { time: 'night', haze: .2, key: Object.assign({ type: 'point' }, P.lantern.local(Object.assign({ horizon: HZ, radius: 150, power: .95 }, LAMP))),
  fill: { color: '#2c2a40', power: .35 } };
const cap = (x, y, t) => `<text x="${x + 4}" y="${y + 9}" font-family="sans-serif" font-size="6.5" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${t}</text>`;
const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-width=".8"/>`;
const panel = (x, y, w, h, vb, body, t) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${body}</svg>` + box(x, y, w, h) + cap(x, y, t);
const D = Math.PI / 180;

// the room: a dark plank wall, a table top from y 200, the lantern on it at the left
const room = (u, L) => { const g = K.nid('hw', u);
  let s = `<defs>${K.radGrad(g, LAMP.x + 10, 170, 230, [[0, '#4a3222'], [.45, '#24180f'], [1, '#0c0806']])}</defs><rect width="200" height="280" fill="url(#${g})"/>`;
  for (let x = 14; x < 200; x += 23) s += `<path d="M${x} 0V200" stroke="#000" stroke-width=".7" opacity=".35"/>`;
  s += K.shadeBox(u, [{ pts: [[0, 200], [200, 200], [200, 280], [0, 280]], n: 'top', grain: [1, 0] }], L, 'oak', { seed: 4, outline: .4 });
  return s + P.lantern(u, L, Object.assign({ seed: 2 }, LAMP)); };
const skinAt = (L, x, y) => { const r0 = L.ramp('skin', x, y); return Object.assign({}, r0, { core: K.mix(r0.half, r0.shadow, .45) }); };
const litAt = (L, x, y) => { const a = L.at(x, y); return [a.ux, a.uy]; };
// a sleeve end (a linen shirt cuff) from the edge of the frame to the wrist
const sleeve = (u, L, from, to, w) => { const tn = L.ramp('linen', to[0], to[1]), lt = litAt(L, to[0], to[1]);
  const dx = to[0] - from[0], dy = to[1] - from[1], side = (-dy * lt[0] + dx * lt[1]) >= 0 ? 1 : -1;
  return H.cloth(u, { spine: [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], to], w: [w * 1.15, w * 1.05, w], tone: tn, lit: side, folds: true, drapes: 1, sw: .35, cuff: { from: .8, k: 1.12 }, tension: true, L }); };

// a grip's result: the picture and the middle of the hand (for the crop)
const out = (hd, svg) => { const q = hd.joints.flat().concat([hd.wrist]); return { svg, c: [q.reduce((a, p) => a + p[0], 0) / q.length, q.reduce((a, p) => a + p[1], 0) / q.length] }; };
const S = 2;   // the hand's size: ~19 units from the wrist to the open finger tips, a fist ~12
const GRIPS = {
  // a mug held round its body from the right, the back of the hand to us, the fingers round the far side
  mug(u, L) { const c = [100, 168], tn = skinAt(L, ...c), ms = 1.1, base = [c[0] + 1, 196];
    const hd = H.hand3(u, { grip: [base[0], base[1] - 6 * ms], a: 196, s: S, m: 1, roll: 8, pose: 'wrap', r: 4.4 * ms / S, tilt: 0, tone: tn, light: litAt(L, ...c), sw: .32 });
    return out(hd, sleeve(u, L, [156, 150], hd.wrist, 3 * S) + hd.back + P.mug(u, L, { x: base[0], y: base[1], s: ms, seed: 3 }) + hd.front); },
  // a sabre in a fist, the thumb side to us, the blade up
  sabre(u, L) { const c = [100, 160], tn = skinAt(L, ...c);
    const hd = H.hand3(u, { grip: c, a: -4, s: S, m: 1, roll: 16, pose: 'wrap', r: .75, tone: tn, light: litAt(L, ...c), sw: .32 });
    const ax = hd.axis; let a = Math.atan2(ax[1], ax[0]) / D; if (Math.sin(a * D) > 0) a += 180;
    const gl = [-17.6, -.8], ss = 1.5, cc = Math.cos(a * D), sn = Math.sin(a * D), g = hd.grip;
    const sb = P.sabre(u, L, { x: g[0] - (gl[0] * cc - gl[1] * sn) * ss, y: g[1] - (gl[0] * sn + gl[1] * cc) * ss, s: ss, rot: a, contact: false });
    return out(hd, sleeve(u, L, [40, 176], hd.wrist, 3 * S) + hd.back + sb + hd.front); },
  // a playing card shown to us: the thumb on its face at the lower corner, the fingers and the palm behind it
  card(u, L) { const c = [104, 150], tn = skinAt(L, ...c);
    const hd = H.hand3(u, { at: [92, 196], a: -72, s: S, m: -1, roll: 180, pose: 'hold', flex: [[14, 10, 6], [12, 10, 6], [16, 14, 8], [22, 20, 10]], spread: 3, tone: tn, light: litAt(L, ...c), sw: .32,
      backFingers: [0, 1, 2, 3, 'palm'], thumbTo: [6.2, -.9, -1.9] });
    const kn = hd.joints[0][0], cw = 22, ch = 32, a = 8 * D, ca = Math.cos(a), sa = Math.sin(a), o = [kn[0] - 6, kn[1] + 3];
    const Q = [[0, 0], [cw, 0], [cw, -ch], [0, -ch]].map(p => [o[0] + p[0] * ca - p[1] * sa, o[1] + p[0] * sa + p[1] * ca]);
    const card = `<path d="M${Q.map(p => p.map(K.f).join(' ')).join('L')}Z" fill="#efe6d2" stroke="#3a2a1a" stroke-width=".4" stroke-linejoin="round"/>`
      + `<path d="M${Q.map((p, i) => { const q = [Q[(i + 2) % 4][0] - p[0], Q[(i + 2) % 4][1] - p[1]]; return [p[0] + q[0] * .1, p[1] + q[1] * .1].map(K.f).join(' '); }).join('L')}Z" fill="none" stroke="#8a2418" stroke-width=".6"/>`
      + `<text x="${K.f(Q[3][0] + 3)}" y="${K.f(Q[3][1] + 8)}" font-family="serif" font-size="7" fill="#8a2418" transform="rotate(8 ${K.f(Q[3][0])} ${K.f(Q[3][1])})">A</text>`;
    return out(hd, sleeve(u, L, [80, 280], hd.wrist, 3 * S) + hd.back + card + hd.front); },
  // a coin in a pinch: the thumb in front of it, the index finger behind, the other fingers curled
  coin(u, L) { const c = [100, 156], tn = skinAt(L, ...c);
    const hd = H.hand3(u, { at: [72, 176], a: -28, s: S, m: 1, roll: 100, pitch: 0, pose: 'pinch', tone: tn, light: litAt(L, ...c), sw: .32, backFingers: [0], pinchGap: .5 });
    const it = hd.joints[0][3], tt = hd.joints[4][3], cp = [(it[0] + tt[0]) / 2 + 1.2, (it[1] + tt[1]) / 2 - 1.8], r = 3.4, rp = L.ramp('brass', ...cp), g = K.nid('hc', u), lt = litAt(L, ...cp);
    const coin = `<defs>${K.linGrad(g, cp[0] + lt[0] * r, cp[1] + lt[1] * r, cp[0] - lt[0] * r, cp[1] - lt[1] * r, [[0, rp.spec || rp.lit, 1], [.35, rp.lit, 1], [.75, rp.half, 1], [1, rp.shadow, 1]])}</defs>`
      + `<ellipse cx="${K.f(cp[0] - .5)}" cy="${K.f(cp[1] + .2)}" rx="${r * .86}" ry="${r}" fill="${rp.shadow}" stroke="${rp.outline}" stroke-width=".35"/>`
      + `<ellipse cx="${K.f(cp[0])}" cy="${K.f(cp[1])}" rx="${r * .86}" ry="${r}" fill="url(#${g})" stroke="${rp.outline}" stroke-width=".35"/>`
      + `<ellipse cx="${K.f(cp[0])}" cy="${K.f(cp[1])}" rx="${r * .62}" ry="${r * .74}" fill="none" stroke="${rp.shadow}" stroke-width=".3" opacity=".7"/>`;
    return out(hd, sleeve(u, L, [20, 200], hd.wrist, 3 * S) + hd.back + coin + hd.front); },
  // a rope in a fist, the back of the hand to us, the rope across it on a diagonal
  rope(u, L) { const c = [100, 160], tn = skinAt(L, ...c);
    const hd = H.hand3(u, { grip: c, a: -64, s: S, m: 1, roll: 18, pose: 'wrap', r: .78, tilt: 14, tone: tn, light: litAt(L, ...c), sw: .32 });
    const g = hd.grip, ax = hd.axis, pt = k => [g[0] + ax[0] * k, g[1] + ax[1] * k];
    const rp = P.rope(u, L, [pt(-60), pt(-20), pt(0), pt(20), pt(60)], { r: 1.25, seed: 4 });
    return out(hd, sleeve(u, L, [70, 280], hd.wrist, 3 * S) + hd.back + rp + hd.front); },
  // a pistol held at its grip, the barrel to the right, the index finger on the trigger
  pistol(u, L) { const c = [96, 164], tn = skinAt(L, ...c);
    const hd = H.hand3(u, { grip: c, a: 20, s: S, m: 1, roll: 12, pose: 'wrap', r: .82, tilt: 6, trigger: true, tone: tn, light: litAt(L, ...c), sw: .32 });
    const ax = hd.axis; let ga = Math.atan2(ax[1], ax[0]) / D; if (Math.sin(ga * D) < 0) ga += 180;   // the grip axis, pointing down
    const ps = 1.45, rot = ga - 125.5, gl = [-8.8, -2.6], cc = Math.cos(rot * D), sn = Math.sin(rot * D), g = hd.grip;
    const pi = P.pistol(u, L, { x: g[0] - (gl[0] * cc - gl[1] * sn) * ps, y: g[1] - (gl[0] * sn + gl[1] * cc) * ps, s: ps, rot, contact: false });
    return out(hd, sleeve(u, L, [30, 196], hd.wrist, 3 * S) + hd.back + pi + hd.front); }
};
const NAMES = { mug: 'кружка', sabre: 'сабля', card: 'карта (лист)', coin: 'монета (щепоть)', rope: 'канат', pistol: 'пистолет' };
const ZOOM = { card: 1.35, pistol: 1.25, sabre: 1.3 };
const scene = (u, k) => { const L = K.makeLight(LIGHT, { horizon: HZ }), g = GRIPS[k](u, L); return { svg: room(u, L) + g.svg, c: g.c }; };
const crop = (c, z) => { const w = 28 * z, h = 33.6 * z; return [c[0] - w / 2, c[1] - h / 2, w, h].map(K.f).join(' '); };

// figure() with the new hands (as in stands/people.cjs): 'aim' with a pistol and a sabre, 'haul' on a rope
const MOON = { time: 'night', haze: .3, key: { type: 'moon', az: 248, el: 34, color: '#d8e4ff', power: .9 }, fill: { color: '#34405e', power: .38 }, rim: { az: 60, color: '#bfe0ff', power: .45 } };
const deck = (u, L) => K.sky(u, L, { horizon: 108, stars: 50, seed: 3 }) + K.water(u, L, { horizon: 108, bottom: 175 }) + P.bulwark(u, L, { x1: 0, x2: 200, y: 172, h: 38, seed: 27 }) + K.deck(u, L, { horizon: 108, top: 172, bottom: 280, seed: 8 });
const inHand = (u, L, h, kind, s, up) => { const ax = h.axis || [Math.cos(h.a * D), Math.sin(h.a * D)], g = h.grip || h.at;
  let a = Math.atan2(ax[1], ax[0]) / D; if (up != null && Math.sin(a * D) * up > 0) a += 180;
  if (kind === 'pistol') a = h.a + (Math.cos(h.a * D) < 0 ? 180 : 0);
  const gl = kind === 'sabre' ? [-17.6, -.8] : [-9, .6], c = Math.cos(a * D), sn = Math.sin(a * D);
  const o = { x: g[0] - (gl[0] * c - gl[1] * sn) * s, y: g[1] - (gl[0] * sn + gl[1] * c) * s, s, rot: a, contact: false };
  return kind === 'sabre' ? P.sabre(u, L, o) : P.pistol(u, L, o); };
const posed = (u, pose) => { const L = K.makeLight(MOON, { horizon: 108 });
  const base = { L, pose, at: [100, 262], h: 178, horizon: 108, seed: 5,
    dress: pose === 'aim' ? { shirt: '#d8ccb0', vest: '#2a2a2e', coat: '#5a1c18', coatLen: 'knee', trousers: '#2e2a26', boots: '#1a120c', belt: '#2a1a10' } : { shirt: '#ddd2b8', trousers: '#5a4a36', boot: 'bare', sash: '#3a4a6a', sleeves: 'rolled' },
    head: pose === 'aim' ? { hair: { style: 'tied', color: '#e8e0d0', ribbon: '#1a1a22' }, brow: 'frown' } : { hair: { style: 'curly', color: '#1a120c' }, beard: 'short' },
    hat: pose === 'aim' ? { color: '#1c1a1e', trim: '#c8a050' } : undefined };
  let s = deck(u, L);
  const fg = H.figure(u, Object.assign(base, { handsSeparate: pose === 'aim' }));
  s += fg.svg;
  if (pose === 'haul') { const a = fg.hands.R.grip || fg.wrist.R.at, b = fg.hands.L.grip || fg.wrist.L.at, dx = a[0] - b[0], dy = a[1] - b[1];
    s += P.rope(u, L, [[b[0] - dx * .9, b[1] - dy * .9 + 10], [b[0] - dx * .3, b[1] - dy * .3 + 2], b, a, [a[0] + dx * 1.5, a[1] + dy * 1.5], [220, a[1] + (220 - a[0]) * dy / (dx || 1)]], { r: 1.2, seed: 4 });
    s += fg.hands.R.front + fg.hands.L.front; }
  if (pose === 'aim') s += fg.hands.L.back + inHand(u, L, fg.hands.L, 'sabre', fg.Hh * 3.2 / 46, -1) + fg.hands.L.front
    + fg.hands.R.back + inHand(u, L, fg.hands.R, 'pistol', fg.Hh * 1.7 / 27) + fg.hands.R.front;
  return { s, fg }; };

const ORDER = ['mug', 'sabre', 'card', 'coin', 'rope', 'pistol'];
module.exports = { GRIPS, sheets: {
  hands: { w: 1200, h: 520, bg: '#222', svg: () => {
    let s = '';
    ORDER.forEach((k, i) => { const a = scene('A' + i, k); s += panel(i * 200, 0, 200, 240, crop(a.c, ZOOM[k] || 1), a.svg, NAMES[k] + ' — крупно'); });
    ORDER.forEach((k, i) => { s += panel(i * 200, 240, 200, 280, '0 0 200 280', scene('B' + i, k).svg, NAMES[k] + ' — карта'); });
    return s; } },
  figures: { w: 1200, h: 560, bg: '#222', svg: () => {
    let s = ''; const A = posed('F0', 'aim'), B = posed('F1', 'haul');
    s += panel(0, 0, 200, 280, '0 0 200 280', A.s, 'целится — карта') + panel(0, 280, 200, 280, '0 0 200 280', B.s, 'тянет канат — карта');
    // the crops: 50 x 28 units round each hand (the middle of its joints)
    const cr = (fg, k) => { const q = fg.hands[k].joints.flat(), c = [q.reduce((a, p) => a + p[0], 0) / q.length, q.reduce((a, p) => a + p[1], 0) / q.length]; return `${K.f(c[0] - 25)} ${K.f(c[1] - 14)} 50 28`; };
    s += panel(200, 0, 500, 280, cr(A.fg, 'R'), posed('F2', 'aim').s, 'пистолет — крупно') + panel(700, 0, 500, 280, cr(A.fg, 'L'), posed('F3', 'aim').s, 'сабля — крупно');
    s += panel(200, 280, 500, 280, cr(B.fg, 'R'), posed('F4', 'haul').s, 'канат, ближняя — крупно') + panel(700, 280, 500, 280, cr(B.fg, 'L'), posed('F5', 'haul').s, 'канат, дальняя — крупно');
    return s; } }
} };
