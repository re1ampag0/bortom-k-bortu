// «Попутный ветер» (Колода моря): a fresh, bright morning with a strong even wind from the left. Two merchantmen of
// one side run before it under all sail, heeled and pitching, bow spray flying, long pennants straight out ahead;
// they have just changed places — the near one came up from the far line, the far one from the near — and their
// wakes cross behind them on the water. Cloud rows and high mares' tails are combed the same way, whitecaps on the
// low waves, spindrift torn off downwind. Card: changing places (Перестроение) is free for both teams this round.
// Brief: docs/mockups/print/card-briefs.md «Попутный ветер»; docs/tasks/print-kit-cards.md «Попутный ветер».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 116;                     // horizon
const SUN = { x: 34, y: 90 };       // the low morning sun on the left, upwind, under the clouds
const light = { time: 'day', haze: .12, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffe9b8', power: 1 }, fill: { color: '#8fc0e8', power: .55 } };
const NEAR = { kind: 'merchant', x: 100, y: 133, scale: 1.02, flip: true, heel: 4, sails: 'full', detail: 'near', wake: true, seed: 9 };
const FAR = { kind: 'merchant', x: 172, y: 119.5, scale: .46, flip: true, heel: 3, sails: 'full', detail: 'mid', wake: true, seed: 31 };
const skel = { horizon: HZ, eye: 3, light: 'the low morning sun ahead on the left, upwind: sails glow through, bright edges towards it, shadows on the water towards us and to the right',
  items: [
    ['near', 52, NEAR.y, 108, 92, 'on the water, heeled, running to the right'],
    ['far', 150, FAR.y, 50, 42, 'on the water, ahead and further, running to the right'],
    ['wakes', -10, 150, 170, 34, 'on the water: the two wakes cross behind the ships'],
    ['spray', 136, 134, 22, 18, 'thrown up at the near ship\'s stem, carried to the right'],
    ['crest', -10, 250, 110, 40, 'a near whitecap under the glass'],
  ] };

module.exports = { name: 'Попутный ветер', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, { sea: ['#86b6cc', '#3d6f88', '#16323f'], sky: ['#3f7fc6', '#6aa2d8', '#a9cde8', '#f2e6cf'] });
    let bg = K.sky(u, L, { horizon: HZ });
    bg += maresTails(u, L);
    bg += K.sunMoon(u, L, { r: 6.5 });
    // cumulus rows driven to the right: long flat clouds, the near ones big and high, smaller towards the horizon
    for (const [x, y, w, h, sd, fr] of [[118, 30, 58, 13, 11, 0], [180, 40, 40, 10, 4, .1], [64, 50, 40, 9, 6, .25],
      [140, 66, 44, 9, 7, .35], [200, 78, 30, 7, 9, .5], [98, 84, 34, 7, 15, .55], [12, 74, 30, 6, 18, .45], [150, 100, 34, 5, 23, .8], [66, 104, 28, 4, 25, .85]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .55, seed: 5 });
    // whitecaps all over the low sea, small and many far off, fewer and larger near
    bg += whitecaps(u, L);
    // the two wakes crossing behind the ships: the far ship came up from the near line, the near one from the far
    bg += wake(u, L, [[FAR.x - 17, FAR.y + .6], [130, FAR.y + 1.2], [70, 120.6], [44, 123.4], [22, 130], [-14, 150]], 41, 1.2);
    bg += wake(u, L, [[NEAR.x - 34, NEAR.y + .4], [48, 132], [28, 128], [8, 123.4], [-14, 120.2]], 43, 1);
    // the far ship, then the near one over it, bow spray at both stems
    bg += K.ship(u, L, FAR) + K.splash(u, { x: FAR.x + 19, y: FAR.y + .4, w: 5, h: 6, seed: 5, L, wind: 1 });
    bg += K.ship(u, L, NEAR);
    bg += K.splash(u, { x: NEAR.x + 37, y: NEAR.y + .2, w: 13, h: 16, seed: 2, L, wind: 1 });
    // ——— under the glass: a near whitecap breaking downwind, spindrift torn off it
    let fg = whitecap(u, L, { x: 40, y: 244, w: 84, h: 13, seed: 6, wind: 1 }) + whitecap(u, L, { x: 168, y: 206, w: 56, h: 9, seed: 12, wind: 1 });
    fg += spindrift(u, L, 70, 232, 60, 7) + spindrift(u, L, 188, 198, 30, 8);
    return [bg, fg];
  } };

// ——— KIT-CANDIDATE: high cirrus combed out by the wind (mares' tails): thin bright streaks with hooked ends,
// blurred, long and slanting the way the wind blows
function maresTails(u, L) {
  const bl = nid('mt', u), c = mix(L.pal.cloudLit, '#ffffff', .4), R = rng(17);
  let s = `<defs><filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".9"/></filter></defs><g filter="url(#${bl})" fill="none" stroke="${c}" stroke-linecap="round">`;
  for (const [x, y, l] of [[70, 8, 70], [120, 14, 62], [20, 22, 54], [150, 4, 50], [96, 22, 40]]) {
    for (let i = 0; i < 3; i++) { const dx = (R() - .5) * 6, dy = i * 2.2, ll = l * (.7 + R() * .4);
      s += `<path d="M${f(x + dx)} ${f(y + dy)}c${f(ll * .35)} ${f(-1.2)} ${f(ll * .7)} ${f(-1.6)} ${f(ll)} ${f(-4.2)}q${f(2.6)} ${f(-1.8)} ${f(4.4)} ${f(-.6)}" stroke-width="${f(.7 + R() * .8)}" opacity="${f(.3 + R() * .3)}"/>`; }
  }
  return s + '</g>';
}

// whitecaps over the whole sea: a crest broken white on its back, a dark trough before it, foam lace downwind.
// Many and small near the horizon, fewer and larger near (rows of the sea's perspective), none in a row.
function whitecaps(u, L) {
  let s = ''; const R = rng(61);
  for (let i = 0; i < 26; i++) {
    const t = Math.pow(R(), 1.25), y = HZ + 3 + t * 92, w = 3 + t * 34, h = .5 + t * 5, x = R() * 210 - 5;
    // keep clear of the near ship's hull and its spray (they are drawn over), and of the wakes' crossing
    if (y < 137 && x > 50 && x < 150) continue;
    s += whitecap(u, L, { x, y, w, h, seed: 70 + i, wind: 1 });
  }
  return s;
}

// a whitecap on a crest of the kit's sea: the lit back of the crest and the dark trough in front of it as soft
// blurred lenses (no hard body over the sea), foam breaking along the top, lace sliding down the face and torn off
// downwind
function whitecap(u, L, o) {
  const R = rng(o.seed || 5), x = o.x, y = o.y, w = o.w, h = o.h, wind = o.wind || 1, P = L.pal, bl = nid('wcb', u), g1 = nid('wc1', u), g2 = nid('wc2', u);
  const back = mix(P.sea[1], mix(P.sea[0], L.keyColor, .3), .45), trough = mix(P.sea[2], L.shadowTint, .4);
  const lens = (cx, cy, rw, up, dn, sk) => `M${f(cx - rw)} ${f(cy)}C${f(cx - rw * .4)} ${f(cy - up)} ${f(cx + rw * (.2 + sk))} ${f(cy - up * 1.1)} ${f(cx + rw)} ${f(cy)}C${f(cx + rw * .3)} ${f(cy + dn)} ${f(cx - rw * .5)} ${f(cy + dn * .9)} ${f(cx - rw)} ${f(cy)}Z`;
  let out = `<defs><filter id="${bl}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="${f(h * .22)}"/></filter>${linGrad(g1, 0, y - h, 0, y + h * .2, [[0, back, 1], [.6, back, .55], [1, back, 0]])}${linGrad(g2, 0, y, 0, y + h * 1.2, [[0, trough, .95], [.5, trough, .6], [1, trough, 0]])}</defs>`;
  out += `<g filter="url(#${bl})"><path d="${lens(x, y + h * .15, w * .62, h, h * .25, .15)}" fill="url(#${g1})"/><path d="${lens(x + wind * w * .1, y + h * .45, w * .7, h * .2, h * 1.1, -.1)}" fill="url(#${g2})"/></g>`;
  out += K.foam(u, { x: x + wind * w * .08, y: y - h * .42, w: w * .5, h: Math.max(.35, h * .2), seed: (o.seed || 5) + 3, L });
  for (let i = 0; i < 3; i++) { const t = .2 + i * .25 + R() * .1; out += K.foam(u, { x: x + wind * w * (.05 + t * .35) + (R() - .5) * w * .1, y: y - h * .2 + t * h * .7, w: w * (.22 - t * .12) * (.7 + R() * .6), h: Math.max(.25, h * .08), seed: (o.seed || 5) + 11 + i * 7, L }); }
  return out;
}

// spindrift: the foam torn off a crest and carried downwind — short streaks and drops thinning out to the right
function spindrift(u, L, x, y, len, seed) {
  const R = rng(seed), c = mix('#f2fbff', L.keyColor, .25), bl = nid('sd', u);
  let s = `<defs><filter id="${bl}" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter></defs><g filter="url(#${bl})" fill="${c}">`;
  for (let i = 0; i < 16; i++) { const t = R(), px = x + t * len, py = y - t * len * .12 + (R() - .5) * 3, l = (1 + R() * 2.4) * (1 - t * .5), th = .3 + R() * .35;
    s += `<path d="M${f(px)} ${f(py)}q${f(l * .5)} ${f(-th)} ${f(l)} ${f(-th * .3)}q${f(-l * .5)} ${f(th * 1.1)} ${f(-l)} ${f(th * .3)}z" opacity="${f((.7 - t * .55) * (.6 + R() * .4))}"/>`; }
  return s + '</g>';
}

// a ship's wake on the water along a path (picture points, far end first is the stern): a pale band of churned
// water widening with distance from the stern and towards the viewer, torn foam on it, broken crests along its edges
function wake(u, L, pts, seed, k) {
  const R = rng(seed), c = mix(L.pal.sea[0], '#ffffff', .4), id = nid('wk', u), bl = nid('wl', u);
  // resample the path; the width grows along it and with nearness (y below the horizon)
  const pl = []; for (let i = 0; i + 1 < pts.length; i++) for (let j = 0; j < 8; j++) { const t = j / 8; pl.push([lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]); }
  pl.push(pts[pts.length - 1]);
  const n = pl.length, wd = i => k * (.4 + 1.6 * Math.pow(i / n, .7)) * clamp((pl[i][1] - HZ) / 14, .2, 2.6);
  const top = [], bot = [];
  for (let i = 0; i < n; i++) { const a = pl[Math.max(0, i - 1)], b = pl[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = wd(i) * .22;
    top.push([pl[i][0] - dy / l * w * 0 , pl[i][1] - w]); bot.push([pl[i][0], pl[i][1] + w]); }
  const poly = top.concat(bot.reverse()).map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  let s = `<defs>${linGrad(id, pl[0][0], pl[0][1], pl[n - 1][0], pl[n - 1][1], [[0, c, .55], [.35, c, .34], [1, c, .12]])}<filter id="${bl}" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation=".7"/></filter></defs><path d="M${poly}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
  for (let i = 1; i < n; i += 1 + Math.floor(R() * 2)) { const p = pl[i], w = wd(i), side = R() < .5 ? -1 : 1, fade = 1 - .7 * i / n;
    if (R() < .75) s += K.foam(u, { x: p[0] + (R() - .5) * 2, y: p[1] + side * w * .14, w: (1.6 + R() * 3) * w, h: Math.max(.25, .18 * w), seed: seed + i * 3, L }).replace('<g', `<g opacity="${f(fade)}"`); }
  return s;
}
