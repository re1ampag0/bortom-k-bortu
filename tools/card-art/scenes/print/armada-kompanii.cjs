// «Армада Компании» (Индевор, Легенда, ПРИКАЗ: каждый вражеский корабль получает 2 урона по Корпусу и 1 по Парусам).
// A poster, from low on the water at sunset. Two giants of the Company's line tower over the near sea at both edges,
// cut by the frame — their glowing sails up to the top of the card, the striped ensigns streaming from them like
// banners. Between them, in the window they make, the whole sea to the horizon is sails: line behind line of ships
// under the same flag, down to a haze of topsails against the low sun. The sun stands right behind the fleet: every
// sail glows through, god rays fan out from between the masts across the smoke. The line beyond the pirates fires one
// broadside — a row of flashes, smoke rolling out lit from behind; the two pirate ships, small in the middle of it all,
// black sails and red, are dark against the sun path, shot falling round them, splinters off their hulls, a sail torn.
// Everything sails left with the wind (the flags and the smoke go left): one wind, one sun, one horizon.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, shafts } = PK;

const HZ = 116;
const SUN = { x: 100, y: 66 };
// perspective from low on the water (the eye ≈ 6 m up): a ship's scale grows with its waterline's depth below the
// horizon, .13 per unit — the whole fleet stands on a narrow band of sea under the horizon and towers over it
const sc = y => .13 * (y - HZ);
const light = { time: 'dusk', haze: .45, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffe0a0', power: 1 }, fill: { color: '#6f7ea8', power: .45 },
  rim: { az: 0, color: '#fff0c8', power: .8 } };
// the lines of the fleet from the horizon toward us: [depth below the horizon, number, first x, step, firing]
const LINES = [[.5, 26, -3, 8, 0], [1.1, 15, -6, 14.5, 0], [1.9, 9, -2, 25, 1], [2.8, 6, 4, 38, 1], [3.8, 4, 22, 52, 1]];
// the two nearest ships at the edges, cut by the frame (bow left: a stern quarter on the left, a bow on the right)
const WL = { x: -26, y: HZ + 6.6 }, WR = { x: 232, y: HZ + 6.6 };
const PEARL = { x: 58, y: HZ + 4.9 }, REV = { x: 146, y: HZ + 4.7 };   // nearer than the firing line, smaller ships (≈ .58 of a first-rate)
const skel = { horizon: HZ, eye: 6, light: 'the low sun straight ahead behind the fleet (back light: lit edges toward the sun, shadows toward us)', items: [
  ['horizon haze of topsails', 0, HZ + .6, 200, 6, 'sea, far', 60, { bg: 1 }], ['lines 2-4', 0, HZ + 2.9, 200, 32, 'sea', 60, { bg: 1 }],
  ['firing line', 0, HZ + 3.8, 200, 42, 'sea, broadside toward us and the pirates', 60, { bg: 1 }], ['smoke', 0, HZ + 4, 200, 30, 'over the water in front of the firing line'],
  ['pearl', 54, PEARL.y, 50, 30, 'sea, in front of the firing line', 40], ['revenge', 106, REV.y, 42, 26, 'sea, in front of the firing line', 35],
  ['wing L', 0, WL.y, 58, 90, 'sea, near, cut by the frame', 60, { edge: 1 }], ['wing R', 138, WR.y, 62, 86, 'sea, near, cut by the frame', 60, { edge: 1 }]] };

// the Company's striped ensign, big, on its own staff: red and white stripes, a white canton with a red cross;
// the cloth runs in a wave downwind (left) and is lit through by the sun behind it
function ensign(u, fx, fy, w, h, ph) {
  const red = '#c8302a', wht = '#f8eedc', dk = '#5a1410', cid = nid('cf', u), sh = nid('cs', u);
  const wv = (x0, k) => f(Math.sin(x0 / w * 4.6 + ph) * h * .16 * (x0 / w) + k);
  let top = `M${f(fx)} ${f(fy)}`, bot = '';
  for (let j = 1; j <= 12; j++) { const xx = w * j / 12; top += `L${f(fx - xx)} ${wv(xx, fy + xx * .08)}`; }
  for (let j = 12; j >= 0; j--) { const xx = w * j / 12; bot += `L${f(fx - xx)} ${wv(xx, fy + h - xx * .1)}`; }
  const d = top + bot + 'Z';
  let g = `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath>${linGrad(sh, fx - w, 0, fx, 0, Array.from({ length: 9 }, (_, i) => [i / 8, '#000', f(.05 + .2 * (.5 + .5 * Math.sin(i * 1.9 + ph)))]))}</defs>`
    + `<path d="${d}" fill="${wht}"/><g clip-path="url(#${cid})">`;
  for (let k = 0; k < 9; k += 2) g += `<path d="M${f(fx + 2)} ${f(fy + h * k / 9)}${Array.from({ length: 13 }, (_, j) => { const xx = w * j / 12; return `L${f(fx - xx)} ${wv(xx, fy + h * k / 9 + xx * (.08 - .18 * k / 9))}`; }).join('')}l0 ${f(h / 9 + .2)}${Array.from({ length: 13 }, (_, j) => { const xx = w * (12 - j) / 12; return `L${f(fx - xx)} ${wv(xx, fy + h * (k + 1) / 9 + xx * (.08 - .18 * (k + 1) / 9))}`; }).join('')}Z" fill="${red}"/>`;
  g += `<path d="M${f(fx + 1)} ${f(fy - 1)}H${f(fx - w * .42)}V${f(fy + h * .55)}H${f(fx + 1)}Z" fill="${wht}"/>`
    + `<path d="M${f(fx - w * .21)} ${f(fy - 1)}V${f(fy + h * .55)}M${f(fx + 1)} ${f(fy + h * .27)}H${f(fx - w * .42)}" stroke="${red}" stroke-width="${f(h * .11)}"/>`
    + `<rect x="${f(fx - w - 2)}" y="${f(fy - 4)}" width="${f(w + 4)}" height="${f(h + 8)}" fill="url(#${sh})"/>`
    // the sun through the cloth: a warm glow along the upper edge
    + `<path d="${top}" stroke="#fff4c8" stroke-width="${f(h * .08)}" fill="none" opacity=".7"/></g>`
    + `<path d="${d}" fill="none" stroke="${dk}" stroke-width=".3" opacity=".7"/>`;
  return g;
}
// a broadside: flashes at the ports of one row, each port its own size; the smoke rolls out of every port toward us
// and drifts left with the wind
function broadside(u, L, R, ship, s, rows, o = {}) {
  let flash = '', smoke = '';
  for (const [h, n, x0, x1] of rows) for (let k = 0; k < n; k++) {
    if (R() < (o.skip || .25)) continue;
    const lx = x0 + (x1 - x0) * k / (n - 1), px = ship.x + lx * s, py = ship.y - h * s - .2 * s, sz = s * (3 + R() * 3.4) * (o.k || 1);
    smoke += K.smoke(u, L, { x: px - sz * .8, y: py + sz * 1.1, w: sz * 6.5, h: sz * 5.2, wind: -.7, seed: Math.floor(R() * 999), opacity: .85 });
    flash += K.localGlow(u, { x: px, y: py, color: '#ffd080', power: .9, radius: sz * 3.4 }, { core: false })
      + Array.from({ length: 6 }, (_, j) => { const an = j * Math.PI / 3 + R() * .8, l = sz * (.6 + R() * .7); return `<path d="M${f(px)} ${f(py)}l${f(Math.cos(an) * l)} ${f(Math.sin(an) * l * .75)}" stroke="#ffe9a0" stroke-width="${f(sz * .14)}" stroke-linecap="round"/>`; }).join('')
      + `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(sz * .5)}" ry="${f(sz * .38)}" fill="#fff8d8"/>`;
  }
  return { smoke, flash };
}

module.exports = { name: 'Армада Компании', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 6 });
    const R = rng(17);
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 6.5, rays: false });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 80, 8, 4, .2], [166, 40, 64, 7, 7, .3], [118, 52, 50, 5, 2, .5]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += glow(u, SUN.x, SUN.y + 8, 120, 46, '#ffd890', .55);
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 5, glitter: SUN.x });
    // the fleet from the horizon toward us, line behind line, each bigger; the nearer three lines fire one broadside
    // toward us and the pirates — a flash at every port but a few, smoke rolling out of each and drifting left
    let fleet = '';
    LINES.forEach(([dep, n, x0, step, fire], li) => {
      let ships = '', smoke = '', flash = '';
      for (let i = 0; i < n; i++) { const x = x0 + i * step + (R() - .5) * step * .3, y = HZ + dep + (R() - .5) * dep * .12, s = sc(y), kind = (i + li) % 3 === 1 ? 'warship' : 'endeavour';
        ships += K.ship(u, L, { kind, x, y, scale: s, detail: s < .25 ? 'far' : 'mid', wake: s > .15, seed: 30 + li * 40 + i });
        if (fire) { const b = broadside(u, L, R, { x, y }, s, kind === 'warship' ? [[4, 13, -36, 30], [9.5, 13, -36, 30]] : [[3.6, 15, -38, 34.8], [8.8, 15, -38, 34.8], [14, 15, -38, 34.8]], { skip: .3, k: 1.5 });
          smoke += b.smoke; flash += b.flash; } }
      fleet += ships + smoke + flash;
      if (li === 1) fleet += K.fog(u, L, { y: HZ - 6, h: 8, density: .35, seed: 3 })
        // the god rays from the sun, between the masts, through the haze and the smoke
        + shafts(u, SUN.x, SUN.y, [[-40, 50, -40, 80], [-30, 150, 0, 170], [40, 180, 62, 180], [140, 180, 165, 175], [230, 130, 240, 160], [240, 50, 240, 70],
          [20, -20, 45, -30], [150, -30, 178, -20], [-30, 0, -40, 20], [230, 0, 240, 22]], '#fff0c0', .24);
    });
    bg += fleet;
    let mid = '';
    // the shot in flight toward the pirates: dark specks with faint trails out of the smoke
    for (let i = 0; i < 14; i++) { const x = 20 + R() * 160, y = HZ - 4 + R() * 7; mid += `<path d="M${f(x)} ${f(y)}l${f(.8 + R())} ${f(-1.2 - R() * .6)}" stroke="#fff4d0" stroke-width=".4" opacity=".4"/><circle cx="${f(x)}" cy="${f(y)}" r=".5" fill="#1a1410"/>`; }
    // the pirates under fire, running left before the wind: splashes round them, splinters off the hulls
    mid += K.splash(u, { x: 30, y: HZ + 4.2, w: 7, h: 11, seed: 0, L, wind: -.4 }) + K.splash(u, { x: 102, y: HZ + 4.2, w: 6, h: 10, seed: 2, L, wind: -.4 }) + K.splash(u, { x: 176, y: HZ + 4.4, w: 7, h: 11, seed: 1, L, wind: -.4 });
    mid += K.ship(u, L, { kind: 'revenge', x: REV.x, y: REV.y, scale: sc(REV.y) * .58, detail: 'mid', roll: -6, heel: -2, wake: true, seed: 4 });
    mid += K.ship(u, L, { kind: 'pearl', x: PEARL.x, y: PEARL.y, scale: sc(PEARL.y) * .58, detail: 'mid', roll: -6, heel: -3, wake: true, seed: 3 });
    mid += K.splash(u, { x: 46, y: HZ + 7.4, w: 9, h: 13, seed: 3, L, wind: -.4 }) + K.splash(u, { x: 134, y: HZ + 7, w: 8, h: 12, seed: 4, L, wind: -.4 }) + K.splash(u, { x: 92, y: HZ + 8.4, w: 6, h: 9, seed: 5, L, wind: -.4 });
    // hits: splinters off the Pearl's quarter and the Revenge's side, a puff where the shot went in
    for (const [hx, hy, sd] of [[80, HZ + 1.6, 9], [162, HZ + 1.6, 11]]) { const Rh = rng(sd);
      for (let i = 0; i < 12; i++) { const a = -Math.PI * (.1 + Rh() * .8), d = 1 + Rh() * 5.5, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d, l = .6 + Rh() * 1.2, r = Rh() * Math.PI;
        mid += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(r) * l)} ${f(Math.sin(r) * l)}" stroke="#2a1a10" stroke-width=".4" stroke-linecap="round"/>`; }
      mid += K.smoke(u, L, { x: hx, y: hy, w: 6, h: 6, wind: -.6, seed: sd, opacity: .55 }); }
    // the two nearest ships at the edges, cut by the frame: their sails glow through, up to the top of the card
    let fg = '';
    fg += K.ship(u, L, { kind: 'endeavour', x: WL.x, y: WL.y, scale: sc(WL.y), detail: 'near', wake: true, seed: 140 });
    fg += K.ship(u, L, { kind: 'endeavour', x: WR.x, y: WR.y, scale: sc(WR.y), detail: 'near', wake: true, seed: 141 });
    // their great ensigns, streaming left from staffs over a truck
    { const S = require('../kit/ship.cjs');
      for (const [G, sd, w, ph, m] of [[WL, 140, 30, 0, 2], [WR, 141, 30, 1.7, 0]]) { const t = S.shipGeom('endeavour', { x: G.x, y: G.y, scale: sc(G.y), seed: sd, detail: 'near' }).masts[m].top;
        fg += `<path d="M${f(t[0])} ${f(t[1] + 1)}V${f(t[1] - 5)}" stroke="#2a1c10" stroke-width="1"/><circle cx="${f(t[0])}" cy="${f(t[1] - 5.6)}" r=".9" fill="#c89a40"/>`
          + ensign(u, t[0], t[1] - 4.4, w, w * .58, ph); } }
    // the sun's warmth over the near sea and the giants' bows; the haze between us and them
    fg += glow(u, SUN.x, HZ + 6, 80, 14, '#ffcf80', .3);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 132, 0, 280, [[0, '#101828', 0], [.3, '#101828', .45], [1, '#080c18', .8]])}</defs><rect x="-10" y="132" width="220" height="160" fill="url(#${gl})"/>`; }
    return [bg + mid, fg];
  } };
