// «Армада Компании» (Индевор, Легенда, ПРИКАЗ: каждый вражеский корабль получает 2 урона по Корпусу и 1 по Парусам).
// A poster, from low on the water at sunset. Two giants of the Company's line tower over the near sea at both edges,
// cut by the frame — their glowing sails up to the top of the card, the striped ensigns streaming from them like
// banners. Between them, in the window they make, the whole sea to the horizon is sails: line behind line of ships
// under the same flag, down to a haze of topsails against the low sun. The sun stands right behind the fleet: every
// sail glows through, god rays fan out from between the masts across the smoke. The line beyond the pirates fires one
// broadside — a row of flashes, smoke rolling out lit from behind; the two pirate ships, small in the middle of it all,
// black sails and red, are dark against the sun path, shot falling round them, splinters off their hulls, a sail torn.
// Everything sails left with the wind (the flags and the smoke go left): one wind, one sun, one horizon.
// Every ship is the kit's model (K.ship), as on the deck backs: the Company's fleet all «Индевор»-class, the pirates near
// enough for the full detail (user's decision 16.11).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, shafts } = PK;

const HZ = 121;
const SUN = { x: 100, y: 64 };
// perspective from low on the water (the eye ≈ 6 m up): a ship's scale grows with its waterline's depth below the
// horizon, .16 per unit — the whole fleet stands on a narrow band of sea under the horizon and towers over it
const sc = y => .16 * (y - HZ);
const light = { time: 'dusk', haze: .45, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffe0a0', power: 1 }, fill: { color: '#6f7ea8', power: .45 },
  rim: { az: 0, color: '#fff0c8', power: .8 } };
// the lines of the fleet from the horizon toward us: [depth below the horizon, number, first x, step, firing]
const LINES = [[.45, 28, -3, 7.5, 0], [1, 17, -6, 13, 0], [1.8, 11, -4, 20, 1], [2.7, 8, 2, 28, 1], [3.6, 5, 8, 46, 1]];
// the two nearest ships at the edges, cut by the frame (bow left: a stern quarter on the left, a bow on the right)
const WL = { x: -18, y: HZ + 6 }, WR = { x: 226, y: HZ + 6 };
const PEARL = { x: 56, y: HZ + 4.5 }, REV = { x: 141, y: HZ + 4.4 };   // nearer than the firing line, smaller ships (≈ .55 of a first-rate)
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
    smoke += K.smoke(u, L, { x: px - sz * .8, y: py + sz * 1.1, w: sz * 6.5, h: sz * 5.2, wind: -.7, seed: Math.floor(R() * 999), opacity: .5 });
    // fired toward us: a starburst — a soft hot glow, short spikes of different length, a white core
    flash += glow(u, f(px), f(py), f(sz * 2.2), f(sz * 1.8), '#ffb850', .65)
      + Array.from({ length: 7 }, (_, j) => { const an = j * 2 * Math.PI / 7 + R() * .6, l = sz * (.8 + R() * 1.1), w = sz * .22; const c = Math.cos(an), sn = Math.sin(an) * .8;
        return `<path d="M${f(px - sn * w)} ${f(py + c * w)}L${f(px + c * l)} ${f(py + sn * l)}L${f(px + sn * w)} ${f(py - c * w)}Z" fill="#ffe8a0" opacity=".95"/>`; }).join('')
      + `<circle cx="${f(px)}" cy="${f(py)}" r="${f(sz * .42)}" fill="#fffdf0"/>`;
  }
  return { smoke, flash };
}

module.exports = { name: 'Армада Компании', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 6 });
    const R = rng(17);
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 6.5, rays: false });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 80, 8, 4, .2], [166, 40, 64, 7, 7, .3], [118, 52, 50, 5, 2, .5]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    { const vg = nid('vg', u); bg += `<defs>${linGrad(vg, 0, 0, 0, HZ, [[0, '#1a1030', .5], [.45, '#2a1838', .15], [1, '#2a1838', 0]])}</defs><rect x="-10" y="-10" width="220" height="${HZ + 10}" fill="url(#${vg})"/>`; }
    bg += glow(u, SUN.x, SUN.y + 8, 120, 46, '#ffd890', .6) ;
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 5, glitter: SUN.x });
    // the fleet from the horizon toward us, line behind line, each bigger; the nearer three lines fire one broadside
    // toward us and the pirates — a flash at every port but a few, smoke rolling out of each and drifting left
    let fleet = '';
    const flags = [];
    LINES.forEach(([dep, n, x0, step, fire], li) => {
      let ships = '', smoke = '', flash = '';
      for (let i = 0; i < n; i++) { const x = x0 + i * step + (R() - .5) * step * .3, y = HZ + dep + (R() - .5) * dep * .12, s = sc(y), kind = 'endeavour';
        ships += K.ship(u, L, { kind, x, y, scale: s, detail: s < .25 ? 'far' : s < .45 ? 'mid' : 'near', wake: s > .15, lights: s > .3, seed: 30 + li * 40 + i });
        if (li === LINES.length - 1) flags.push({ x, y, s, kind, seed: 30 + li * 40 + i });
        if (fire) { const b = broadside(u, L, R, { x, y }, s, kind === 'warship' ? [[4, 13, -36, 30], [9.5, 13, -36, 30]] : [[3.6, 15, -38, 34.8], [8.8, 15, -38, 34.8], [14, 15, -38, 34.8]], { skip: .3, k: 1.5 });
          smoke += b.smoke; flash += b.flash; } }
      fleet += ships + smoke + flash;
      if (li === 1) fleet += K.fog(u, L, { y: HZ - 6, h: 8, density: .35, seed: 3 })
        // the god rays from the sun, between the masts, through the haze and the smoke
        // a few soft rays from the sun, through the haze
        + shafts(u, SUN.x, SUN.y, [[20, -20, 45, -30], [150, -30, 178, -20], [-30, 0, -40, 20], [230, 0, 240, 22]], '#fff0c0', .12);
    });
    // the Company's colours over the nearest line: the same striped ensign on every mainmast, big enough to read
    { const S = require('../kit/ship.cjs');
      flags.forEach((p, i) => { const t = S.shipGeom(p.kind, { x: p.x, y: p.y, scale: p.s, seed: p.seed, detail: 'mid' }).masts[1].top;
        fleet += `<path d="M${f(t[0])} ${f(t[1] + 1)}V${f(t[1] - 3.4)}" stroke="#2a1c10" stroke-width=".6"/><circle cx="${f(t[0])}" cy="${f(t[1] - 3.8)}" r=".6" fill="#c89a40"/>`
          + ensign(u, t[0], t[1] - 3, 15, 8.6, i * 1.3); }); }
    bg += fleet;
    let mid = '';
    // the shot in flight toward the pirates: dark specks with faint trails out of the smoke
    for (let i = 0; i < 14; i++) { const x = 20 + R() * 160, y = HZ - 4 + R() * 7; mid += `<path d="M${f(x)} ${f(y)}l${f(.8 + R())} ${f(-1.2 - R() * .6)}" stroke="#fff4d0" stroke-width=".4" opacity=".4"/><circle cx="${f(x)}" cy="${f(y)}" r=".5" fill="#1a1410"/>`; }
    // the pirates under fire, running left before the wind: splashes round them, splinters off the hulls
    mid += K.splash(u, { x: 30, y: HZ + 4.2, w: 7, h: 11, seed: 0, L, wind: -.4 }) + K.splash(u, { x: 102, y: HZ + 4.2, w: 6, h: 10, seed: 2, L, wind: -.4 }) + K.splash(u, { x: 176, y: HZ + 4.4, w: 7, h: 11, seed: 1, L, wind: -.4 });
    mid += K.ship(u, L, { kind: 'revenge', x: REV.x, y: REV.y, scale: sc(REV.y) * .7, detail: 'near', roll: -6, heel: -2, wake: true, lights: true, seed: 4 });
    mid += K.ship(u, L, { kind: 'pearl', x: PEARL.x, y: PEARL.y, scale: sc(PEARL.y) * .7, detail: 'near', roll: -6, heel: -3, wake: true, lights: true, seed: 3 });
    mid += K.splash(u, { x: 46, y: HZ + 7.4, w: 9, h: 13, seed: 3, L, wind: -.4 }) + K.splash(u, { x: 134, y: HZ + 7, w: 8, h: 12, seed: 4, L, wind: -.4 }) + K.splash(u, { x: 92, y: HZ + 8.4, w: 6, h: 9, seed: 5, L, wind: -.4 });
    // hits: splinters off the Pearl's quarter and the Revenge's side, a puff where the shot went in
    for (const [hx, hy, sd] of [[80, HZ + 1.6, 9], [155, HZ + 1.6, 11]]) { const Rh = rng(sd);
      for (let i = 0; i < 12; i++) { const a = -Math.PI * (.1 + Rh() * .8), d = 1 + Rh() * 5.5, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d, l = .6 + Rh() * 1.2, r = Rh() * Math.PI;
        mid += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(r) * l)} ${f(Math.sin(r) * l)}" stroke="#2a1a10" stroke-width=".4" stroke-linecap="round"/>`; }
      mid += K.smoke(u, L, { x: hx, y: hy, w: 6, h: 6, wind: -.6, seed: sd, opacity: .55 }); }
    // the two nearest ships at the edges, cut by the frame: their sails glow through, up to the top of the card
    let fg = '';
    fg += K.ship(u, L, { kind: 'endeavour', x: WL.x, y: WL.y, scale: sc(WL.y), detail: 'near', wake: true, lights: true, seed: 140 });
    fg += K.ship(u, L, { kind: 'endeavour', x: WR.x, y: WR.y, scale: sc(WR.y), detail: 'near', wake: true, lights: true, seed: 141 });
    // the sun's warmth over the near sea and the giants' bows; the haze between us and them
    fg += glow(u, SUN.x, HZ + 6, 70, 12, '#ffcf80', .18);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 132, 0, 280, [[0, '#101828', 0], [.3, '#101828', .45], [1, '#080c18', .8]])}</defs><rect x="-10" y="132" width="220" height="160" fill="url(#${gl})"/>`; }
    return [bg + mid, fg];
  } };
