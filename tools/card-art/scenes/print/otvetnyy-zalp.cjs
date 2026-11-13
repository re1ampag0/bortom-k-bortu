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
const REV = { kind: 'revenge', x: 70, y: 120, scale: 1.15, flip: true, heel: -3, roll: 6, sails: 'full', detail: 'near', lights: true, seed: 7 };
const EN = { kind: 'endeavour', x: 180, y: 101, scale: .4, sails: 'full', detail: 'mid', seed: 4 };
const HIT = { X: 8, H: 13.5 };   // the smashed rail amidships, burning (local X, H on the Revenge's near side)
const light = { time: 'dusk', haze: .35, key: { type: 'sun', az: 132, el: 14, color: '#ffb070', power: .9 }, fill: { color: '#6e4a70', power: .42 },
  locals: [{ x: 70, y: 112, color: '#ffb050', power: .8, radius: 60 }, { x: 60, y: 104, color: '#ff8a30', power: .6, radius: 24 }] };
const skel = { horizon: HZ, eye: 3, light: 'the low sun behind us on the right; the flashes along her side; the fire of the hit', items: [
  ['revenge', -13, 120, 172, 110, 'water: the near swell, her waterline y 120 tilted 3° (bow up, right), rolled towards us'],
  ['flashes', 32, 116, 80, 10, 'her gun ports, one row'],
  ['white smoke', 40, 118, 120, 22, 'out of her ports, rolling right towards the enemy'],
  ['black smoke + fire', 50, 108, 50, 60, 'the smashed rail amidships, the plume drifting right'],
  ['enemy (Endeavour)', 150, 101, 52, 46, 'water on the horizon, right, beyond the Revenge\'s bowsprit'],
  ['enemy hits', 150, 104, 50, 20, 'her side and the water round her']] };

module.exports = { name: 'Ответный залп', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, { sky: ['#1a0c1e', '#46182c', '#a2402a', '#f0904e'], sea: ['#b05e40', '#44182a', '#120810'], cloudLit: '#f09a60', cloudShade: '#3e1c2e' });
    const Ld = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#2a1e22' }) });   // the soot of the hit
    const R = rng(29), dir = -1;
    const tan = -dir * Math.tan(REV.heel * Math.PI / 180), wlY = x => REV.y + (x - REV.x) * tan;
    // ——— the dusk ahead: red sky, lit clouds, the sea
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[60, 26, 90, 13, 6, .1], [170, 30, 70, 10, 2, .2], [130, 62, 60, 7, 15, .45], [30, 74, 46, 6, 7, .55], [180, 84, 40, 4, 11, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 4, glitter: false });
    // ——— the enemy beyond on the right: still in the smoke of her own salvo, and taking the answer
    bg += K.ship(u, L, EN);
    bg += K.smoke(u, L, { x: 170, y: 100, w: 52, h: 26, wind: .5, seed: 12, opacity: .85 });
    { const hx = 170, hy = 96; bg += K.localGlow(u, { x: hx, y: hy, color: '#ffd890', power: .8, radius: 9 });
      for (let i = 0; i < 14; i++) { const a = -Math.PI * (.1 + R() * .8), d = 2 + R() * 8, l = .6 + R() * 1.4, rot = R() * 3, cx = hx + Math.cos(a) * d, cy = hy + Math.sin(a) * d * .7;
        bg += `<path d="M${f(cx)} ${f(cy)}l${f(Math.cos(rot) * l)} ${f(Math.sin(rot) * l)}" stroke="${R() > .5 ? '#f0c88a' : '#8a5a2a'}" stroke-width=".4" stroke-linecap="round"/>`; } }
    bg += K.splash(u, { x: 158, y: 103, w: 7, h: 10, seed: 0, L, wind: 1 }) + K.splash(u, { x: 192, y: 102.5, w: 6, h: 9, seed: 2, L, wind: 1 }) + K.splash(u, { x: 147, y: 104, w: 5, h: 6, seed: 1, L, wind: 1 });

    // ——— the Revenge: rolled towards us on the slope of the near swell
    const G = K.shipGeom(REV.kind, REV), P = Hx.sidePt(REV, G), ang = Math.atan(tan) * 180 / Math.PI;
    let fg = '';
    { const g = nid('sw', u), top = [], N = 12; for (let i = 0; i <= N; i++) { const x = -10 + i * 220 / N; top.push([x, wlY(x) + .9 + Math.sin(i * 2.1) * .5]); }
      const d = Hx.sp(top) + 'L210 290L-10 290Z', nc = nid('nc', u);
      fg += `<defs>${Hx.lin(g, 0, 112, 0, 200, [[0, '#b86848'], [.1, '#62283a'], [.45, '#2c1220'], [1, '#100810']])}<clipPath id="${nc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${g})"/>`
        + `<g clip-path="url(#${nc})"><g opacity=".5">${K.water(u, L, { horizon: 98, bottom: 290, swell: 1, seed: 37, glitter: false })}</g></g>`; }
    fg += Hx.tiltShip(u, L, REV);
    fg += `<g transform="rotate(${f(ang)} ${REV.x} ${REV.y})">${K.foam(u, { x: REV.x + 4, y: REV.y + .8, w: 110, h: 2, seed: 23, L })}</g>`;

    // ——— the hit she has just taken: the rail smashed amidships, burning, a black plume drifting right
    { const [x, y] = P(HIT.X, HIT.H);
      fg += Hx.dent(u, L, { x, y: y + 2, r: 2.2, ang, seed: 3 }) + `<path d="M${f(x - 4)} ${f(y - .6)}l1.6 2.4l1.2 -1.8l1.4 2.6l1.6 -2.2l1.2 2l1.4 -2.4l-.4 3.6h-7.6z" fill="#0c0604"/>`
;
      fg += K.smoke(u, Ld, { x: x + 2, y: y - 4, w: 30, h: 50, wind: .85, seed: 5, opacity: .92, glow: { color: '#ff8a30', power: .8 } })
        + K.fire(u, { x: x - .5, y: y + 1.5, w: 12, h: 15, seed: 4, wind: .6, fuel: true }); }

    // ——— the answer: every port flashes at once, the white smoke rolling out to the right towards the enemy
    const ports = Hx.portXH(REV.kind).map(([X, H]) => P(X, H));
    { const pg = nid('pg', u), pd = nid('pd', u), pf = nid('pf', u);
      fg += `<defs><radialGradient id="${pg}" cx=".42" cy=".34" r=".66"><stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="#eee4da" stop-opacity=".95"/><stop offset=".8" stop-color="#b8a4a8" stop-opacity=".85"/><stop offset="1" stop-color="#7a6470" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a2030" stop-opacity=".45"/><stop offset="1" stop-color="#3a2030" stop-opacity="0"/></radialGradient>${Hx.blur(pf, .6)}</defs>`;
      let sh = '', bl = '';
      for (const [x, y] of ports) { const k = .75 + R() * .3;
        for (let j = 0; j < 5; j++) { const bx = x + 3 + j * 3.2 * k + (R() - .5), by = y + 1.6 - j * .8 + (R() - .5) * .8, rr = (1.6 + j * 1.0) * k;
          if (j > 1) sh += `<circle cx="${f(bx - .5)}" cy="${f(by + rr * .5)}" r="${f(rr)}" fill="url(#${pd})"/>`;
          bl += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(rr)}" fill="url(#${pg})" opacity="${f(.85 - j * .1)}"/>`; } }
      // the bank the billows merge into, lying on the water in front of her and drifting right
      { const gb = nid('bk', u); bl += `<defs>${Hx.lin(gb, 0, 108, 0, 124, [[0, '#ece2d8', 0], [.4, '#e6dcd2', .55], [.85, '#b8a8ac', .55], [1, '#8a7a84', 0]])}</defs>`
        + `<path d="M40 116Q70 108 110 110T170 108Q182 114 170 122Q120 126 50 124Q34 121 40 116Z" fill="url(#${gb})"/>`; }
      fg += sh + `<g filter="url(#${pf})">${bl}</g>`;
      ports.forEach(([x, y], i) => { fg += Hx.burst(u, x + .6, y, 1.7 * (.85 + R() * .35), i * 5 + 1, .55); });
      fg += K.localGlow(u, { x: 72, y: 113, color: '#ffb050', power: .45, radius: 50 }, { squash: .15, core: false })
        + K.localGlow(u, { x: 72, y: 126, color: '#ffb050', power: .35, radius: 44 }, { squash: .25, core: false }); }
    // the balls of the answer on their way, low over the water towards the enemy
    fg += Hx.flying(u, L, 116, 109, 136, 104, 1.1) + Hx.flying(u, L, 112, 111, 128, 107.5, 1);
    // under the glass: the near swell darkening
    { const g = nid('dk', u); fg += `<defs>${Hx.lin(g, 0, 140, 0, 290, [[0, '#0a0410', 0], [1, '#0a0410', .6]])}</defs><rect x="0" y="140" width="200" height="150" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
