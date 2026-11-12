// «Армада Компании» (Индевор, Легенда, ПРИКАЗ: каждый вражеский корабль получает 2 урона по Корпусу и 1 по Парусам).
// A clear bright day, the sun high on the left. The whole horizon is sails: line behind line of the Company's ships
// under the same striped ensigns (a big Company flag on every mainmast of the first line), down to a haze of tiny topsails at the edge of the sea. The first line, close,
// fires one broadside: flashes of different size along their sides, each port with its own club of smoke rolling out
// over the water. In
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
    // the broadside: each port fires on its own — flashes of different size, a little up and down along the gun deck,
    // not quite evenly spaced, one or two still only smoking; each with its own club of smoke rolling out of the port
    { let flash = '', smoke = '';
      first.forEach(([x, y, s], i) => { const n = 6, x0 = x - 36 * s, x1 = x + 34 * s;
        for (let k = 0; k < n; k++) { const px = x0 + (x1 - x0) * (k + (R() - .5) * .5) / (n - 1), py = y - 8.5 * s + (R() - .5) * 2.4, sz = .5 + R() * .95, late = R() < .16;
          smoke += K.smoke(u, L, { x: px + 1.5 + sz * 2.5, y: py + 1.5 + sz * 1.5, w: (late ? 12 : 6) + sz * 7, h: (late ? 11 : 6) + sz * 6, wind: .7, seed: 200 + i * 7 + k, opacity: late ? .95 : .85 });
          if (late) continue;
          const nr = 5 + Math.floor(R() * 3);
          flash += K.muzzleFlash(u, { x: px, y: py, dir: 70 + (R() - .5) * 30, len: (2.6 + R() * 2) * sz + 1.4, seed: k + i, smoke: false, glow: false })
            + Array.from({ length: nr }, (_, j) => { const an = j * 2 * Math.PI / nr + R() * .7, l = (1.4 + R() * 1.8) * sz; return `<path d="M${f(px)} ${f(py)}l${f(Math.cos(an) * l)} ${f(Math.sin(an) * l * .8)}" stroke="#ffe9a0" stroke-width="${f(.35 + .3 * sz)}" stroke-linecap="round" opacity=".9"/>`; }).join('')
            + K.localGlow(u, { x: px, y: py + 1, color: '#ffd890', power: .6 + .35 * sz, radius: 3.5 + 5 * sz }) + `<circle cx="${f(px)}" cy="${f(py)}" r="${f(.6 + .9 * sz)}" fill="#fffbe0"/>`; } });
      mid += smoke + flash; }
    // the Company's colours over the first line: the same striped flag on every mainmast, big enough to read — red and
    // white stripes, a white canton with a red cross — blowing out to the right on a short staff over the truck
    { const S = require('../kit/ship.cjs'), red = '#c62a2a', wht = '#f6f0e2', dk = '#6a1414';
      first.forEach(([x, y, s], i) => { const t = S.shipGeom('endeavour', { x, y, scale: s, flip: true, seed: 140 + i, detail: 'mid' }).masts[1].top;
        const fx = t[0], fy = t[1] - 2.2, w = 9, h = 5.6, ph = i * 1.3, cid = nid('cf', u);
        const wv = (x0, k) => f(Math.sin(x0 / w * 5 + ph) * .7 * (x0 / w) + k);
        let top = `M${f(fx)} ${f(fy)}`, bot = '';
        for (let j = 1; j <= 8; j++) { const xx = w * j / 8; top += `L${f(fx + xx)} ${wv(xx, fy + xx * .06)}`; }
        for (let j = 8; j >= 0; j--) { const xx = w * j / 8; bot += `L${f(fx + xx)} ${wv(xx, fy + h - xx * .1)}`; }
        const d = top + bot + 'Z';
        let g = `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="M${f(fx)} ${f(t[1] + .6)}V${f(fy - .8)}" stroke="#3a2a1a" stroke-width=".55"/>`
          + `<path d="${d}" fill="${wht}"/><g clip-path="url(#${cid})">`;
        for (let k = 0; k < 7; k += 2) g += `<rect x="${f(fx - 1)}" y="${f(fy - 1 + (h + 1) * k / 7)}" width="${w + 2}" height="${f((h + 1) / 7)}" fill="${red}" transform="skewY(${f(2 + Math.sin(ph))})" transform-origin="${f(fx)} ${f(fy)}"/>`;
        g += `<rect x="${f(fx - 1)}" y="${f(fy - 1)}" width="${f(w * .44 + 1)}" height="${f(h * .52 + 1)}" fill="${wht}"/><path d="M${f(fx + w * .22)} ${f(fy - 1)}V${f(fy + h * .52)}M${f(fx - 1)} ${f(fy + h * .25)}H${f(fx + w * .44)}" stroke="${red}" stroke-width="1"/>`
          + [.3, .62, .9].map(q => `<rect x="${f(fx + w * q - .7)}" y="${f(fy - 2)}" width="1.4" height="${h + 4}" fill="#000" opacity=".14"/>`).join('') + `</g>`
          + `<path d="${d}" fill="none" stroke="${dk}" stroke-width=".3"/>`;
        mid += g; }); }
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
