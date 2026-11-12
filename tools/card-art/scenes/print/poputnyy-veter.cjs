// «Попутный ветер» (Колода моря): a fresh, bright morning with a strong even wind from the left. Two merchantmen of
// one side run before it under all sail heeled towards us (kit `roll`), bow spray flying, long pennants straight out ahead;
// they have just changed places — the near one came up from the far line, the far one from the near — and their
// wakes cross behind them on the water. Cloud rows and high mares' tails are combed the same way, whitecaps on the
// low waves, spindrift torn off downwind. Card: changing places (Перестроение) is free for both teams this round.
// Brief: docs/mockups/print/card-briefs.md «Попутный ветер»; docs/tasks/print-kit-cards.md «Попутный ветер».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 116;                     // horizon
const SUN = { x: 34, y: 90 };       // the low morning sun on the left, upwind, under the clouds
const light = { time: 'day', haze: .12, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffdc9a', power: 1 }, fill: { color: '#8fc0e8', power: .5 } };
const NEAR = { kind: 'merchant', x: 94, y: 136, scale: 1.05, flip: true, roll: 8, sails: 'full', detail: 'near', seed: 9 };
const FAR = { kind: 'merchant', x: 176, y: 119.4, scale: .4, flip: true, roll: 4, sails: 'full', detail: 'mid', seed: 31 };
const skel = { horizon: HZ, eye: 3, light: 'the low morning sun ahead on the left, upwind: sails glow through, bright edges towards it, shadows on the water towards us and to the right',
  items: [
    ['near', 48, NEAR.y, 100, 80, 'on the water, heeled 8° towards us, running to the right'],
    ['far', 158, FAR.y, 40, 36, 'on the water, higher and to the right, clear of the near one, running to the right'],
    ['wakes', 0, 138, 160, 20, 'on the water above the glass: the two wakes cross left of the near stern'],
    ['spray', 136, 134, 22, 18, 'thrown up at the near ship\'s stem, carried to the right'],
    ['crest', -10, 250, 110, 40, 'a near whitecap under the glass'],
  ] };

module.exports = { name: 'Попутный ветер', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, { sea: ['#86b6cc', '#3d6f88', '#16323f'], sky: ['#2f6cba', '#5b95d2', '#a6c9e6', '#f6dcb0'] });
    let bg = K.sky(u, L, { horizon: HZ });
    bg += maresTails(u, L);
    bg += K.sunMoon(u, L, { r: 7.5 });
    // cumulus rows driven to the right: long flat clouds, the near ones big and high, smaller towards the horizon
    for (const [x, y, w, h, sd, fr] of [[126, 46, 92, 20, 11, 0], [30, 36, 58, 13, 4, .05], [206, 60, 54, 12, 6, .15],
      [80, 82, 54, 10, 7, .35], [168, 92, 44, 8, 9, .45], [10, 96, 36, 6, 15, .6], [118, 106, 34, 5, 23, .8], [196, 108, 26, 4, 25, .85]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .55, seed: 5 });
    // the shadows of the running clouds on the water: long soft patches, cool, under the glass and in the middle
    bg += cloudShadows(u, L);
    // whitecaps all over the low sea, small and many far off, fewer and larger near
    bg += whitecaps(u, L);
    // the two wakes crossing behind the ships: the far ship came up from the near line, the near one from the far
    bg += wake(u, L, [[FAR.x - 16, FAR.y + .4], [130, 120.6], [70, 123], [48, 126.6], [30, 130.4], [12, 134.6], [-14, 139.6]], 41, 2.4);
    bg += wake(u, L, [[NEAR.x - 40, NEAR.y + .2], [44, 134.6], [30, 131], [14, 126.4], [-14, 121.4]], 43, 2.2);
    // the far ship, then the near one over it, bow spray at both stems
    bg += K.ship(u, L, FAR) + K.foam(u, { x: FAR.x + 2, y: FAR.y + .3, w: 30, h: .5, L, seed: 7 }) + K.splash(u, { x: FAR.x + 15.6, y: FAR.y + .4, w: 4.5, h: 5.5, seed: 5, L, wind: 1 });
    bg += K.ship(u, L, NEAR) + K.foam(u, { x: NEAR.x + 5, y: NEAR.y + .4, w: 66, h: 1, L, seed: 8 });
    bg += K.splash(u, { x: NEAR.x + 39.8, y: NEAR.y + .2, w: 12, h: 16, seed: 2, L, wind: 1 });
    // ——— under the glass: a near whitecap breaking downwind, spindrift torn off it
    let fg = nearSwell(u, L) + whitecap(u, L, { x: 172, y: 196, w: 60, h: 9, seed: 12, wind: 1 });
    fg += spindrift(u, L, 46, 196, 90, 7) + spindrift(u, L, 194, 189, 30, 8);
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
    if (y < 140 && x > -10 && x < 150) continue;
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

// a ship's wake on the water along a path (picture points, the stern first): a smooth pale band of churned water
// widening away from the stern and towards the viewer, its two edges drawn as broken lines of foam (the arms of the
// wake), torn foam only close under the stern
function wake(u, L, pts, seed, k) {
  const R = rng(seed), c = mix(L.pal.sea[0], '#ffffff', .78), fc = mix('#f8fdff', L.keyColor, .15), id = nid('wk', u), bl = nid('wl', u);
  const pl = []; for (let i = 0; i + 1 < pts.length; i++) for (let j = 0; j < 8; j++) { const t = j / 8; pl.push([lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]); }
  pl.push(pts[pts.length - 1]);
  const n = pl.length, wd = i => k * (.6 + 3 * Math.pow(i / n, .8)) * clamp((pl[i][1] - HZ) / 12, .35, 2.5);
  const top = [], bot = [];
  for (let i = 0; i < n; i++) { const w = wd(i) * .5; top.push([pl[i][0], pl[i][1] - w * .45]); bot.push([pl[i][0], pl[i][1] + w]); }
  const sm = q => { let d = `M${f(q[0][0])} ${f(q[0][1])}`; for (let i = 1; i < q.length; i++) { const m = [(q[i - 1][0] + q[i][0]) / 2, (q[i - 1][1] + q[i][1]) / 2]; d += `Q${f(q[i - 1][0])} ${f(q[i - 1][1])} ${f(m[0])} ${f(m[1])}`; } return d; };
  let s = `<defs>${linGrad(id, pl[0][0], pl[0][1], pl[n - 1][0], pl[n - 1][1], [[0, c, .92], [.4, c, .7], [1, c, .38]])}<filter id="${bl}" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation=".6"/></filter></defs>`;
  s += `<path d="${sm(top)}L${sm(bot.slice().reverse()).slice(1)}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
  // the edges: soft unbroken lines of churned water fading away from the stern, flecks of foam riding on them
  for (const [q, e] of [[top, 1], [bot, 2]]) { const g = nid('we', u), wob = q.map((p, i) => [p[0], p[1] + Math.sin(i * .9 + seed + e) * .25 * clamp((p[1] - HZ) / 20)]);
    s += `<defs>${linGrad(g, q[0][0], q[0][1], q[n - 1][0], q[n - 1][1], [[0, fc, .95], [.5, fc, .75], [1, fc, .4]])}</defs><path d="${sm(wob)}" stroke="url(#${g})" stroke-width="${f(.45 * k)}" fill="none" filter="url(#${bl})"/>`;
    for (let i = 2; i < n; i += 3 + Math.floor(R() * 3)) { const p = wob[i], t = i / n, w = (1 + R() * 2.2) * (.5 + clamp((p[1] - HZ) / 25)); s += `<ellipse cx="${f(p[0] + (R() - .5) * 2)}" cy="${f(p[1])}" rx="${f(w * .8)}" ry="${f(Math.max(.18, w * .1))}" fill="${fc}" opacity="${f((.95 - .45 * t) * (.6 + R() * .4))}"/>`; } }
  for (let i = 0; i < 4; i++) { const p = pl[i * 2]; s += K.foam(u, { x: p[0] - 1, y: p[1] + .3, w: 4 + i * 1.5, h: .5, seed: seed + i * 3, L }); }
  return s;
}

// the shadows of the clouds racing over the sea: long soft patches stretched along the wind, darker and larger near
function cloudShadows(u, L) {
  let s = '';
  for (const [x, y, rx, ry, op] of [[150, 146, 54, 5, .45], [52, 178, 80, 11, .5], [160, 226, 70, 13, .42], [30, 270, 90, 16, .5]]) {
    const id = nid('cs', u); s += `<defs>${radGrad(id, 0, 0, 1, [[0, L.shadowMul, op], [.55, L.shadowMul, op * .55], [1, L.shadowMul, 0]])}</defs><ellipse cx="0" cy="0" rx="1" ry="1" transform="translate(${x} ${y}) scale(${rx} ${ry})" fill="url(#${id})" style="mix-blend-mode:multiply"/>`;
  }
  return s;
}

// the back of a big near swell across the bottom of the frame: a dark body with two humps rising from the left, its
// crest running down to the right; the low sun ahead shines through the thin top of the crest (a teal glow), foam
// breaks on the humps and is torn off downwind — the dark calm form under the glass
function nearSwell(u, L) {
  const P = L.pal, id = nid('ns', u), cr = nid('nc', u), bl = nid('nb', u), eb = nid('ne', u), body = mix(P.sea[2], L.shadowTint, .2), glow = mix(mix(P.sea[1], '#4fae9e', .45), L.keyColor, .12);
  const crest = 'M-14 214C4 205 24 197 44 198C60 199 70 206 86 206C104 206 118 211 136 220C156 230 182 236 214 238';
  let s = `<defs>${linGrad(id, 0, 197, 0, 292, [[0, glow, .97], [.12, mix(glow, body, .5), .98], [.4, body, 1], [1, K.scale(body, .75), 1]])}`
    + `<filter id="${eb}" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation=".7"/></filter><filter id="${bl}" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
  s += `<path d="${crest}L214 300L-14 300Z" fill="url(#${id})" filter="url(#${eb})"/>`;
  // the lit back of each hump and the shade in the hollow between them
  s += `<g filter="url(#${bl})"><ellipse cx="34" cy="206" rx="26" ry="5" fill="${mix(glow, '#ffffff', .25)}" opacity=".45"/><ellipse cx="100" cy="212" rx="22" ry="4" fill="${mix(glow, '#ffffff', .2)}" opacity=".35"/><ellipse cx="68" cy="216" rx="16" ry="6" fill="${body}" opacity=".5"/></g>`;
  // foam on the humps, broken; lace sliding down the back; small whitecaps of the wind waves riding on it
  for (const [x, y, w, h, sd] of [[30, 198.6, 32, 2.4, 3], [94, 206.4, 24, 1.6, 9], [146, 224.6, 22, 1.2, 13]]) s += K.foam(u, { x, y, w, h, L, seed: sd });
  for (const [x, y, w, sd] of [[22, 212, 26, 21], [60, 222, 22, 23], [112, 222, 18, 25], [36, 240, 30, 27], [140, 248, 24, 29], [84, 262, 30, 31]]) s += K.foam(u, { x, y, w, h: .45, L, seed: sd });
  return s;
}
