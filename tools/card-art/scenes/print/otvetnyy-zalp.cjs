// «Ответный залп» (Месть королевы Анны, РЕАКЦИЯ: после Залпа по «Мести» нанесите стрелявшему урон по Корпусу, равный
// Пушкам «Мести»; это не Залп), refined from the first-round scene (portrait-revenge.cjs SCENES['Ответный залп']): the
// same idea — the Revenge's guns answer the enemy, who is already taking the hits (splinters, columns of water at her
// waterline). After the brief the camera steps off her deck: the Revenge, still smoking from the hit she has just
// taken (a black plume and fire out of the smashed rail amidships), answers with her whole side at once — a flash at
// every port, the white smoke rolling out towards the enemy; the enemy beyond on the right still stands in the smoke
// of her own salvo. The find: two smokes — black from the hit, white from the answer.
// Fixed against the first round: three sprite guns on a flat brown wall, a tinted sprite enemy — now the kit's
// Revenge and Endeavour; the flashes were three cones — now one burst at each port (each its own shape), the light of
// them on her side and on the water; the enemy's hits — splinters, a flash, splashes round her. The Revenge is rolled
// towards us by the swell (her deck shows: the hit on it burns) and rides its slope, heel and roll together (as in
// «Буря»).
// Light: the low sun behind us on the right (key, warm, side-front); the flashes along her side, the fire of the hit.
'use strict';
const K = require('../kit/index.cjs');
const { helpers: Hx } = require('./tyazhyolyy-bort.cjs');
const { f, mix, nid, rng } = K;

const HZ = 100;
const REV = { kind: 'revenge', x: 70, y: 111, scale: 1.15, flip: true, heel: -3, roll: 6, sails: 'full', detail: 'near', lights: true, seed: 7 };
const EN = { kind: 'endeavour', x: 173, y: 101, scale: .5, sails: 'full', detail: 'mid', seed: 4 };
const HIT = { X: 8, H: 13.5 };   // the smashed rail amidships, burning (local X, H on the Revenge's near side)
const light = { time: 'dusk', haze: .35, key: { type: 'sun', az: 132, el: 14, color: '#ffb070', power: .9 }, fill: { color: '#6e4a70', power: .42 },
  locals: [{ x: 86, y: 102, color: '#ffb050', power: .8, radius: 50 }, { x: 60, y: 95, color: '#ff8a30', power: .7, radius: 30 }] };
const skel = { horizon: HZ, eye: 3, light: 'the low sun behind us on the right; the flashes along her side; the fire of the hit', items: [
  ['revenge', -13, 111, 172, 110, 'water: the near swell, her waterline y 111 tilted 3° (bow up, right), rolled towards us'],
  ['flashes', 32, 104, 80, 10, 'four of her gun ports, each in its own phase'],
  ['white smoke', 36, 106, 100, 18, 'clumps out of her ports, rolling right towards the enemy'],
  ['black smoke + fire', 46, 99, 40, 80, 'the smashed rail amidships, a column rising'],
  ['enemy (Endeavour)', 150, 101, 52, 46, 'water on the horizon, right, beyond the Revenge\'s bowsprit'],
  ['enemy hits', 150, 104, 50, 20, 'her side and the water round her']] };

module.exports = { name: 'Ответный залп', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, { sky: ['#1a0c1e', '#46182c', '#a2402a', '#f0904e'], sea: ['#b05e40', '#44182a', '#120810'], cloudLit: '#f09a60', cloudShade: '#3e1c2e' });
    const Ld = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#2a1e22' }) });   // the soot of the hit
    const Lk = Object.assign({}, L, { keyColor: '#3a2a2a', pal: Object.assign({}, L.pal, { smoke: '#120a0c' }) });   // its dense black core
    const R = rng(29), dir = -1;
    const tan = -dir * Math.tan(REV.heel * Math.PI / 180), wlY = x => REV.y + (x - REV.x) * tan;
    // ——— the dusk ahead: red sky, lit clouds, the sea
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[60, 26, 90, 13, 6, .1], [170, 30, 70, 10, 2, .2], [130, 62, 60, 7, 15, .45], [30, 74, 46, 6, 7, .55], [180, 84, 40, 4, 11, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 4, glitter: false });
    // ——— the enemy beyond on the right: still in the smoke of her own salvo, and taking the answer
    { const Le = Object.assign(K.makeLight(Object.assign({}, light, { haze: .12 }), { horizon: HZ, eye: 3 }), { pal: L.pal });
      bg += K.smoke(u, L, { x: 186, y: 96, w: 40, h: 22, wind: .5, seed: 12, opacity: .45 }) + K.ship(u, Le, EN);
      const Pe = Hx.sidePt(EN, K.shipGeom(EN.kind, EN));
      Hx.portXH(EN.kind, 1).forEach(([X, H], i) => { if (i % 3) return; const [x, y] = Pe(X, H);
        bg += Hx.portSmoke(u, L, { x, y, k: .55 + (i % 2) * .15, n: 4, seed: 40 + i, dir: [-.9, -.35], tone: 'grey', op: .85 }); }); }
    { const hx = 170, hy = 96; bg += K.localGlow(u, { x: hx, y: hy, color: '#ffd890', power: .8, radius: 9 });
      for (let i = 0; i < 14; i++) { const a = -Math.PI * (.1 + R() * .8), d = 2 + R() * 8, l = .6 + R() * 1.4, rot = R() * 3, cx = hx + Math.cos(a) * d, cy = hy + Math.sin(a) * d * .7;
        bg += `<path d="M${f(cx)} ${f(cy)}l${f(Math.cos(rot) * l)} ${f(Math.sin(rot) * l)}" stroke="${R() > .5 ? '#f0c88a' : '#8a5a2a'}" stroke-width=".4" stroke-linecap="round"/>`; } }
    bg += K.splash(u, { x: 158, y: 103, w: 7, h: 10, seed: 0, L, wind: 1 }) + K.splash(u, { x: 192, y: 102.5, w: 6, h: 9, seed: 2, L, wind: 1 }) + K.splash(u, { x: 147, y: 104, w: 5, h: 6, seed: 1, L, wind: 1 });

    // ——— the Revenge: rolled towards us on the slope of the near swell
    const G = K.shipGeom(REV.kind, REV), P = Hx.sidePt(REV, G), ang = Math.atan(tan) * 180 / Math.PI;
    let fg = '';
    { const g = nid('sw', u), top = [], N = 12; for (let i = 0; i <= N; i++) { const x = -10 + i * 220 / N; top.push([x, wlY(x) + .9 + Math.sin(i * 2.1) * .5]); }
      const d = Hx.sp(top) + 'L210 290L-10 290Z', nc = nid('nc', u);
      fg += `<defs>${Hx.lin(g, 0, 104, 0, 200, [[0, '#b86848'], [.1, '#62283a'], [.45, '#2c1220'], [1, '#100810']])}<clipPath id="${nc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${g})"/>`
        + `<g clip-path="url(#${nc})"><g opacity=".5">${K.water(u, L, { horizon: 98, bottom: 290, swell: 1, seed: 37, glitter: false })}</g></g>`; }
    fg += Hx.tiltShip(u, L, REV);
    fg += `<g transform="rotate(${f(ang)} ${REV.x} ${REV.y})">${K.foam(u, { x: REV.x + 4, y: REV.y + .8, w: 110, h: 2, seed: 23, L })}</g>`;

    // ——— the hit she has just taken: the rail smashed amidships, burning, a black plume drifting right
    { const [x, y] = P(HIT.X, HIT.H);
      fg += Hx.dent(u, L, { x, y: y + 2, r: 2.2, ang, seed: 3 }) + `<path d="M${f(x - 4)} ${f(y - .6)}l1.6 2.4l1.2 -1.8l1.4 2.6l1.6 -2.2l1.2 2l1.4 -2.4l-.4 3.6h-7.6z" fill="#0c0604"/>`
;
      fg += K.smoke(u, Ld, { x: x + 1, y: y - 6, w: 36, h: 82, wind: .35, seed: 5, opacity: .94, glow: { color: '#ff8a30', power: .9 } })
        + K.smoke(u, Lk, { x: x + 1.5, y: y - 8, w: 26, h: 74, wind: .3, seed: 9, opacity: .9 })
        + K.fire(u, { x: x - .5, y: y + 1.8, w: 17, h: 24, seed: 4, wind: .4, fuel: true }); }

    // ——— the answer: her guns go off one after another — one now, the others a moment ago, their flame sinking in
    // the clumps of smoke that roll out of the ports and away to the right towards the enemy
    const pxh = Hx.portXH(REV.kind), pq = (X, H, w = 2.4, hh = 2.28) => [P(X - w / 2, H - hh / 2), P(X + w / 2, H - hh / 2), P(X + w / 2, H + hh / 2), P(X - w / 2, H + hh / 2)];
    pxh.forEach(([X, H], i) => { if ([0, 2, 5, 7].includes(i)) return; const [x, y] = P(X, H - .24, 1.9);   // the ports fired earlier: smoke only, drifting off
      fg += Hx.portSmoke(u, L, { x: x + 1, y: y - .5, k: .7 + R() * .2, n: 4, seed: 60 + i, dir: [.95, -.3], op: .7 }); });
    for (const [i, ph, sd] of [[7, .85, 3], [5, .55, 8], [0, .3, 1], [2, 0, 6]]) { const [X, H] = pxh[i], m = P(X, H - .24, 1.9);
      fg += Hx.portFlash(u, L, { x: m[0], y: m[1], k: ph ? 1.15 : 1.6, phase: ph, seed: sd, dir: 8, len: 7, smokeDir: [.95, -.28], port: pq(X, H) }); }
    // a few clumps already carried off ahead of her bow, broken up
    fg += Hx.portSmoke(u, L, { x: 121, y: 100, k: .9, n: 3, seed: 81, dir: [1, -.3], op: .6 }) + Hx.portSmoke(u, L, { x: 133, y: 97, k: .7, n: 2, seed: 82, dir: [1, -.3], op: .45 });
    fg += K.localGlow(u, { x: 84, y: 103, color: '#ffb050', power: .4, radius: 40 }, { squash: .2, core: false })
      + K.localGlow(u, { x: 80, y: 116, color: '#ffb050', power: .3, radius: 40 }, { squash: .25, core: false });
    // the balls of the answer on their way, low over the water towards the enemy
    fg += Hx.flying(u, L, 120, 99, 142, 95, 1.1) + Hx.flying(u, L, 116, 102, 134, 99, 1);
    // under the glass: the near swell darkening
    { const g = nid('dk', u); fg += `<defs>${Hx.lin(g, 0, 140, 0, 290, [[0, '#0a0410', 0], [1, '#0a0410', .6]])}</defs><rect x="0" y="140" width="200" height="150" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
