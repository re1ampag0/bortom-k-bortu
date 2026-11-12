// «Армада Компании» (Индевор, Легенда, ПРИКАЗ: каждый вражеский корабль получает 2 урона по Корпусу и 1 по Парусам).
// A clear bright day, the sun high on the left. The whole horizon is sails: line behind line of the Company's ships
// under the same striped ensigns, down to a haze of tiny topsails at the edge of the sea. The first line, close,
// fires one broadside together: a row of flashes along their sides and the smoke rolling out over the water. In
// front of it, small against that wall, the two pirate ships — black sails and red — with the shot falling all
// round them in splashes.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, rng } = K;
const { glow, gloom } = PK;

const HZ = 66;
const light = { time: 'day', haze: .3, key: { type: 'sun', az: 300, el: 38, color: '#fff2d0', power: 1 }, fill: { color: '#8fb8d8', power: .5 } };
const skel = { horizon: HZ, eye: 1.4, light: 'the sun high on the left (lit sides to the left, shadows and smoke shade to the right)', items: [
  ['horizon fleet', 0, HZ + 2, 200, 10, 'sea, far'], ['third line', 0, 76, 200, 16, 'sea'], ['second line', 0, 86, 200, 26, 'sea'],
  ['first line', 0, 115, 200, 46, 'sea, broadside'], ['smoke', 0, 112, 200, 26, 'over the water in front of the line'],
  ['pearl', 40, 138, 40, 34, 'sea, foreground'], ['revenge', 128, 137, 36, 30, 'sea, foreground'], ['splashes', 20, 141, 170, 20, 'round the pirates']] };

module.exports = { name: 'Армада Компании', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.4 });
    const R = rng(17);
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 24, 60, 10, 4, .3], [70, 44, 50, 7, 7, .5], [186, 52, 40, 6, 2, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .45, seed: 5, glitter: 40 });
    // the fleet: from the horizon towards us, each line bigger; the far ones only a haze of topsails
    let fleet = '';
    for (let i = 0; i < 26; i++) { const x = -4 + i * 8.2 + (R() - .5) * 4, y = HZ + 1.2 + R() * 1.6, s = .045 + R() * .025;
      fleet += K.ship(u, L, { kind: R() > .4 ? 'warship' : 'endeavour', x, y, scale: s, detail: 'far', flip: true, wake: false, seed: 30 + i }); }
    for (let i = 0; i < 14; i++) { const x = -6 + i * 15.4 + (R() - .5) * 5, y = HZ + 5 + R() * 2.5, s = .085 + R() * .03;
      fleet += K.ship(u, L, { kind: i % 3 ? 'endeavour' : 'warship', x, y, scale: s, detail: 'far', flip: true, wake: false, seed: 60 + i }); }
    fleet += K.fog(u, L, { y: HZ - 4, h: 12, density: .25, seed: 3 });
    for (let i = 0; i < 8; i++) { const x = 4 + i * 27 + (R() - .5) * 6, y = HZ + 12 + R() * 3, s = .15 + R() * .03;
      fleet += K.ship(u, L, { kind: i % 4 === 2 ? 'warship' : 'endeavour', x, y, scale: s, detail: 'far', flip: true, wake: true, seed: 80 + i }); }
    // the second line fires too, further off: small flashes and puffs
    for (let i = 0; i < 6; i++) { const x = 18 + i * 34 + (R() - .5) * 6, y = HZ + 24 + R() * 2, s = .23;
      fleet += K.ship(u, L, { kind: 'endeavour', x, y, scale: s, detail: 'far', flip: true, wake: true, seed: 90 + i });
      for (let k = 0; k < 3; k++) { const px = x - 8 + k * 6, py = y - 2.4; fleet += K.smoke(u, L, { x: px, y: py, w: 7, h: 7, wind: .6, seed: 120 + i * 3 + k, opacity: .8 }) + `<circle cx="${f(px)}" cy="${f(py)}" r=".9" fill="#fff4c0"/>`; } }
    bg += fleet;
    // the first line: four big Company ships in a line of battle, all firing the one broadside towards us
    let mid = '';
    const first = [[8, 113, .38], [64, 115, .42], [124, 114, .41], [184, 115, .42]];
    first.forEach(([x, y, s], i) => { mid += K.ship(u, L, { kind: 'endeavour', x, y, scale: s, detail: 'mid', flip: true, wake: true, seed: 140 + i }); });
    // the broadside: a flash at each port along their near sides, the smoke rolling out over the water to the right
    { let flash = '', smoke = '';
      first.forEach(([x, y, s], i) => { const n = 6, x0 = x - 36 * s, x1 = x + 34 * s;
        for (let k = 0; k < n; k++) { const px = x0 + (x1 - x0) * k / (n - 1) + (R() - .5) * 2, py = y - 8.5 * s + (R() - .5) * .8;
          smoke += K.smoke(u, L, { x: px + 3, y: py + 4, w: 13 + R() * 6, h: 12 + R() * 5, wind: .7, seed: 200 + i * 7 + k, opacity: .9 });
          flash += K.muzzleFlash(u, { x: px, y: py, dir: 70 + (R() - .5) * 30, len: 4 + R() * 2, seed: k + i, smoke: false, glow: false })
            + [0, 1, 2, 3, 4, 5].map(j => { const an = j * Math.PI / 3 + R() * .5, l = 2 + R() * 1.6; return `<path d="M${f(px)} ${f(py)}l${f(Math.cos(an) * l)} ${f(Math.sin(an) * l * .8)}" stroke="#ffe9a0" stroke-width=".6" stroke-linecap="round" opacity=".9"/>`; }).join('')
            + K.localGlow(u, { x: px, y: py + 1, color: '#ffd890', power: .9, radius: 7 }) + `<circle cx="${f(px)}" cy="${f(py)}" r="1.4" fill="#fffbe0"/>`; } });
      mid += smoke + flash; }
    // the shot in flight: dark specks over the water towards the pirates, with faint trails
    for (let i = 0; i < 12; i++) { const x = 10 + R() * 180, y = 120 + R() * 10; mid += `<path d="M${f(x)} ${f(y)}l${f(-1 - R() * 2)} ${f(-2.4 - R())}" stroke="#ffffff" stroke-width=".6" opacity=".35"/><circle cx="${f(x)}" cy="${f(y)}" r=".75" fill="#1a1c20"/>`; }
    // the pirates, small in front of that wall of ships, running before it to the left; splashes all round them
    let fg = '';
    fg += K.splash(u, { x: 22, y: 133, w: 10, h: 12, seed: 0, L, wind: .2 }) + K.splash(u, { x: 102, y: 132, w: 9, h: 10, seed: 1, L, wind: .2 }) + K.splash(u, { x: 180, y: 133, w: 9, h: 11, seed: 2, L, wind: .2 });
    fg += K.ship(u, L, { kind: 'pearl', x: 62, y: 138, scale: .3, detail: 'mid', roll: 8, heel: -3, wake: true, seed: 3 });
    fg += K.ship(u, L, { kind: 'revenge', x: 146, y: 137, scale: .3, detail: 'mid', roll: 8, heel: -2, wake: true, seed: 4 });
    fg += K.splash(u, { x: 86, y: 138, w: 12, h: 16, seed: 3, L, wind: .2 }) + K.splash(u, { x: 126, y: 139, w: 11, h: 14, seed: 4, L, wind: .2 }) + K.splash(u, { x: 44, y: 141, w: 8, h: 9, seed: 5, L, wind: .2 });
    // a hit: splinters off the Revenge's quarter
    { for (let i = 0; i < 10; i++) { const a = -Math.PI * (.2 + R() * .6), d = 2 + R() * 7, x = 160 + Math.cos(a) * d, y = 129 + Math.sin(a) * d, l = .8 + R() * 1.6, r = R() * Math.PI;
      fg += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(r) * l)} ${f(Math.sin(r) * l)}" stroke="#8a5a30" stroke-width=".5" stroke-linecap="round"/>`; }
      fg += K.smoke(u, L, { x: 160, y: 129, w: 8, h: 10, wind: .5, seed: 9, opacity: .7 }); }
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 142, 0, 280, [[0, '#0a1a2a', 0], [.3, '#0a1a2a', .45], [1, '#06101a', .8]])}</defs><rect x="-10" y="142" width="220" height="150" fill="url(#${gl})"/>`; }
    return [bg + mid, fg];
  } };
