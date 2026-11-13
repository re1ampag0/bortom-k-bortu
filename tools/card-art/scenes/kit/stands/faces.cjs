// Check sheet of the faces and the skin (print/lib/people.cjs `head34`, `skinTone`): four people of four skin tones
// (fair, tan, olive, dark) under a lantern on the left — large, then at the size a head has on a card (a 200-unit
// card shown 250 px wide: r 13, ~1.25 px per unit at --width 1000), then the same at card size under the moon.
// Render: node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/faces.cjs --width 1000
'use strict';
const K = require('../index.cjs');
const H = require('../../print/lib/people.cjs');

const LANTERN = { time: 'night', key: { type: 'point', x: 10, y: 30, color: '#ffc27a', power: 1.1, radius: 260 }, fill: { color: '#3a3448', power: .4 } };
const MOON = { time: 'night', haze: .3, key: { type: 'moon', az: 248, el: 34, color: '#d8e4ff', power: .9 }, fill: { color: '#34405e', power: .38 }, rim: { az: 60, color: '#bfe0ff', power: .45 } };
const cap = (x, y, t) => `<text x="${x + 6}" y="${y + 16}" font-family="sans-serif" font-size="13" fill="#fff" stroke="#000" stroke-width=".4" paint-order="stroke">${t}</text>`;
const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#fff" stroke-width="1"/>`;
const panel = (x, y, w, h, vb, body, t) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${body}</svg>` + box(x, y, w, h) + (t ? cap(x, y, t) : '');

const PEOPLE = [
  { skin: 'fair', name: 'светлая', o: { turn: .42, dir: 1, hair: { style: 'tied', color: '#7a4a24' }, hairColor: '#6a3e1e', look: [.2, 0], smile: .15, iris: '#3a5a6a' } },
  { skin: 'tan', name: 'загорелая', o: { turn: .5, dir: -1, hair: { style: 'short', color: '#2a1a10' }, beard: 'short', brow: 'frown', nod: 4 } },
  { skin: 'olive', name: 'смуглая', o: { turn: .38, dir: 1, jawW: .86, hair: { style: 'long', color: '#1a100a' }, hairColor: '#1a100a', noseW: .82, browW: .7, eyeW: 1.05, smile: .2, look: [-.2, 0] } },
  { skin: 'dark', name: 'тёмная', o: { turn: .45, dir: -1, hair: { style: 'curly', color: '#0e0a08' }, hairColor: '#0e0a08', moustache: true, nod: 3, iris: '#2a160c' } }
];

// the skin as the scene gives it: skinTone (with it) or the one ramp of the light for everybody (as before it)
const toneFor = (L, kind, c) => H.skinTone ? H.skinTone(kind, { L, x: c[0], y: c[1] })
  : (() => { const r0 = L.ramp('skin', c[0], c[1]); return Object.assign({}, r0, { core: K.mix(r0.half, r0.shadow, .45) }); })();

// one person: a dark ground, the shoulders and the neck under the head (its support), the head lit by the key
function bust(u, LT, P, c, r) {
  const L = K.makeLight(LT), lt = L.at(c[0], c[1]), Lp = [lt.ux, lt.uy], skin = toneFor(L, P.skin, c), g = K.nid('fb', u);
  let s = `<defs>${K.radGrad(g, c[0] - r * 1.5, c[1] - r, r * 5, [[0, '#2e2a34'], [1, '#0c0b10']])}</defs><rect x="${c[0] - r * 4}" y="${c[1] - r * 3}" width="${r * 8}" height="${r * 6}" fill="url(#${g})"/>`;
  const sh = '#5a4a3a', tn = { lit: K.mix(sh, '#ffd9a8', .3), half: K.mix(sh, '#303742', .3), shadow: K.mix(sh, '#000', .55), outline: K.mix(sh, '#000', .85) }, k = r / 50;
  const X = (dx, dy) => `${K.f(c[0] + dx * k)} ${K.f(c[1] + dy * k)}`;
  s += `<path d="M${X(-80, 110)}Q${X(-76, 68)} ${X(-38, 58)}Q${X(-8, 50)} ${X(0, 54)}Q${X(8, 50)} ${X(38, 58)}Q${X(76, 68)} ${X(80, 110)}Z" fill="${tn.half}" stroke="${tn.outline}" stroke-width="${K.f(.8 * k)}"/>`;
  s += H.cloth(u, { spine: [[c[0], c[1] + 66 * k], [c[0], c[1] + 32 * k]], w: [44 * k, 38 * k], tone: skin, folds: false, lit: -1 });
  const hd = H.head34(u, Object.assign({ c, r, tone: skin, light: Lp, tailApart: true }, P.o));
  const at = s.indexOf(`<path d="M${X(-80, 110)}`);
  return s.slice(0, at) + hd.tail + s.slice(at) + hd.svg;
}

module.exports = { sheets: {
  faces: { w: 1000, h: 640, bg: '#222', svg: () => {
    let s = '';
    PEOPLE.forEach((P, i) => { s += panel(i * 250, 0, 250, 250, '0 0 200 200', bust('FA' + i, LANTERN, P, [100, 104], 50), P.name + ' — крупно, фонарь'); });
    // at card size: the viewBox is 200 units across 250 px, the head r 13 as on the cards
    PEOPLE.forEach((P, i) => { s += panel(i * 250, 260, 250, 180, '0 0 200 144', bust('FB' + i, LANTERN, P, [100, 62], 13), i ? '' : 'размер карты, фонарь'); });
    PEOPLE.forEach((P, i) => { s += panel(i * 250, 450, 250, 180, '0 0 200 144', bust('FC' + i, MOON, P, [100, 62], 13), i ? '' : 'размер карты, луна'); });
    return s; } }
} };
