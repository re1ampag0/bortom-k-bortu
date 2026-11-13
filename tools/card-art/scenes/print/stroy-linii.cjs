// «Строй линии» (Индевор, ПРИКАЗ: Перестроение бесплатно; Залпы по диагонали без штрафа), refined from the first-round
// scene (portrait-endeavour.cjs SCENES['Строй линии']): a bright day, the Company's flagship close on the left with a
// hoist of signal flags from her main truck down to the head, and behind her the line of battle — four ships in one
// wake, each smaller and higher, their waterlines and mastheads on two straight lines that meet on the horizon. The
// next ship astern repeats the signal with a small hoist of her own. Brief's find: the perfect line of ships.
// Fixed against the first round: the column stood at odd spacings and squeezed by hand — now true perspective (scale
// and height from one distance step); the flags hung on a line from nowhere — now on a halyard from the main truck
// to the jib-boom; the ships are the kit's Endeavour; the sea has a trail of wake streaks along the column.
// Light: the sun high ahead right over the column (key), the sails half against it glowing, glitter on the water.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, rng } = K;
const { gloom } = PK;

const HZ = 80, VX = 214;                      // the horizon; the point the column runs to
const F0 = { x: 76, y: 112, s: .86 };          // the flagship (bow left)
const SUN = { x: 132, y: 24 };
const STEP = .95;                             // distance step between ships of the line (in flagship distances)
const LINE = [1, 2, 3, 4].map(i => { const k = 1 / (1 + STEP * i); return { x: VX - (VX - F0.x) * k, y: HZ + (F0.y - HZ) * k, s: F0.s * k, i }; });
const light = { time: 'day', haze: .3, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#fff4d8', power: 1 }, fill: { color: '#8fb8d8', power: .55 }, rim: { az: 20, color: '#fff6e0', power: .5 } };
const skel = { horizon: HZ, eye: 3, light: 'sun high ahead right over the column', items: [
  ['flagship', F0.x - 76, F0.y, 135, 90, 'sea'], ...LINE.map(p => [`line ${p.i}`, p.x - 74 * p.s, p.y, 130 * p.s, 89 * p.s, 'sea, one wake']),
  ['signal hoist', 6, 36, 72, 64, 'main truck → jib-boom'], ['wake lane', 60, 86, 140, 30, 'sea']] };

// signal flags along a line from A to B: each flag hangs from the halyard by its hoist edge and flies to the left
// (the wind is on the ships' quarter: the flags blow towards the bow, as the kit's ensigns do)
const COLS = [['#c62a2a', '#f6f0e2', 'h'], ['#1e3a8a', '#f6f0e2', 'x'], ['#e8b030', '#c62a2a', 'v'], ['#f6f0e2', '#1e3a8a', 'c'], ['#c62a2a', '#e8b030', 'd'],
  ['#2a6a3a', '#f6f0e2', 'h'], ['#1e3a8a', '#e8b030', 'c'], ['#f6f0e2', '#c62a2a', 'x'], ['#e8b030', '#1e3a8a', 'h']];
function hoist(u, A, B, n, size, seed, op = 1) {
  const R = rng(seed);
  let out = `<path d="M${f(A[0])} ${f(A[1])}Q${f((A[0] + B[0]) / 2 + size * .3)} ${f((A[1] + B[1]) / 2 + size * .5)} ${f(B[0])} ${f(B[1])}" stroke="#3a2a1a" stroke-width="${f(Math.max(.18, size * .06))}" fill="none" opacity="${op}"/>`;
  for (let k = 0; k < n; k++) {
    const t0 = (k + .25) / (n + .2), t1 = t0 + .55 / (n + .2), sag = t => Math.sin(t * Math.PI) * size * .25;
    const p0 = [A[0] + (B[0] - A[0]) * t0 + sag(t0) * .6, A[1] + (B[1] - A[1]) * t0 + sag(t0)], p1 = [A[0] + (B[0] - A[0]) * t1 + sag(t1) * .6, A[1] + (B[1] - A[1]) * t1 + sag(t1)];
    const w = size * (1.3 + R() * .3), fl = R() * .6 - .3, [c1, c2, pat] = COLS[(k + seed) % COLS.length], cid = nid('sf', u);
    // the fly: out to the left with a soft flutter (two waves along it)
    const q0 = [p0[0] - w, p0[1] + fl * size + size * .15], q1 = [p1[0] - w, p1[1] + fl * size + size * .2];
    const d = `M${f(p0[0])} ${f(p0[1])}Q${f(p0[0] - w * .5)} ${f(p0[1] - size * .25)} ${f(q0[0])} ${f(q0[1])}L${f(q1[0])} ${f(q1[1])}Q${f(p1[0] - w * .5)} ${f(p1[1] + size * .2)} ${f(p1[0])} ${f(p1[1])}Z`;
    out += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><g opacity="${op}"><path d="${d}" fill="${c1}"/><g clip-path="url(#${cid})">`;
    const mx = (p0[0] + q1[0]) / 2, my = (p0[1] + q1[1]) / 2;
    if (pat === 'h') out += `<rect x="${f(mx - w)}" y="${f(my)}" width="${f(w * 2)}" height="${f(size * 2)}" fill="${c2}"/>`;
    else if (pat === 'v') out += `<rect x="${f(mx - w)}" y="${f(my - size * 2)}" width="${f(w)}" height="${f(size * 4)}" fill="${c2}"/>`;
    else if (pat === 'x') out += `<path d="M${f(p0[0])} ${f(p0[1])}L${f(q1[0])} ${f(q1[1])}M${f(p1[0])} ${f(p1[1])}L${f(q0[0])} ${f(q0[1])}" stroke="${c2}" stroke-width="${f(size * .32)}"/>`;
    else if (pat === 'c') out += `<path d="M${f(mx)} ${f(my - size)}V${f(my + size)}M${f(mx - w)} ${f(my)}H${f(mx + w)}" stroke="${c2}" stroke-width="${f(size * .3)}"/>`;
    else out += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(size * .32)}" fill="${c2}"/>`;
    // the fold's shade and the sun on the upper edge
    out += `<path d="M${f(mx)} ${f(my - size)}V${f(my + size)}" stroke="#000" stroke-width="${f(size * .35)}" opacity=".16"/></g>`
      + `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p0[0] - w * .5)} ${f(p0[1] - size * .25)} ${f(q0[0])} ${f(q0[1])}" stroke="#fff8e8" stroke-width="${f(size * .1)}" fill="none" opacity=".6"/></g>`;
  }
  return out;
}

module.exports = { name: 'Строй линии', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    const R = rng(29);
    // ——— the day: sky, the sun ahead right, fair-weather clouds, the sea with the sun's path under the column
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7.5 });
    for (const [x, y, w, h, sd, fr] of [[54, 22, 64, 9, 3, .25], [176, 40, 46, 7, 8, .45], [96, 58, 52, 6, 5, .6], [24, 68, 36, 4, 2, .75], [150, 70, 44, 4, 6, .8]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .42, seed: 11, glitter: SUN.x + 4 });
    // the wake lane: the column's one track on the water, a pale straight band from the flagship's stern to the horizon
    { const a = [F0.x + 50 * F0.s, F0.y + 1.5], b = [VX, HZ];
      for (let k = 0; k < 40; k++) { const t = Math.pow(R(), 1.6), x = a[0] + (b[0] - a[0]) * t + (R() - .5) * 3 * (1 - t), y = a[1] + (b[1] - a[1]) * t + (R() - .4) * 2.4 * (1 - t);
        bg += `<path d="M${f(x)} ${f(y)}h${f((2 + R() * 5) * (1 - t * .8))}" stroke="#ffffff" stroke-width="${f(.3 + .5 * (1 - t))}" opacity="${f(.35 + R() * .4)}"/>`; } }
    // a far haze of the rest of the fleet on the horizon at the column's end
    for (let i = 0; i < 4; i++) bg += K.ship(u, L, { kind: i % 2 ? 'warship' : 'endeavour', x: VX - 22 + i * 7, y: HZ + .6, scale: .06, detail: 'far', wake: false, seed: 70 + i });
    // ——— the line, far to near: each in the flagship's wake, the same sail, the same heading; a small repeat of the signal
    let mid = '';
    for (const p of LINE.slice().reverse()) {
      mid += K.ship(u, L, { kind: 'endeavour', x: p.x, y: p.y, scale: p.s, detail: p.s > .3 ? 'mid' : 'far', wake: true, seed: 40 + p.i });
      const g = K.shipGeom('endeavour', { x: p.x, y: p.y, scale: p.s, seed: 40 + p.i }), mt = g.masts[1].top;
      if (p.i === 1) mid += hoist(u, [mt[0], mt[1] + .4], [p.x - 86 * p.s, p.y - 24 * p.s], 5, 2.6 * p.s / .5, p.i, .95);
    }
    // ——— the flagship, close: full sail, her wake, the long hoist from the main truck to the jib-boom end
    let fg = K.ship(u, L, { kind: 'endeavour', x: F0.x, y: F0.y, scale: F0.s, detail: 'near', wake: true, seed: 7 });
    { const g = K.shipGeom('endeavour', { x: F0.x, y: F0.y, scale: F0.s, seed: 7 }), mt = g.masts[1].top;
      fg += hoist(u, [mt[0], mt[1] + .6], [F0.x - 86 * F0.s, F0.y - 26 * F0.s], 9, 3.6, 0); }
    // gulls over the line
    for (const [x, y, s] of [[150, 46, 1.1], [160, 40, .8], [112, 52, .9]]) fg += `<path d="M${f(x - 3 * s)} ${f(y)}q${f(1.5 * s)} ${f(-1.6 * s)} ${f(3 * s)} 0q${f(1.5 * s)} ${f(-1.6 * s)} ${f(3 * s)} 0" stroke="#3a4450" stroke-width="${f(.45 * s)}" fill="none"/>`;
    // the sea darkens down under the glass
    fg += gloom(u, 100, 128, 100, 280, .45, '#06202a');
    return [bg + mid, fg];
  } };
