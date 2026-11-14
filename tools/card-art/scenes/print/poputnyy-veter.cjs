// «Попутный ветер» (Колода моря): a fresh, bright morning with a strong even wind from the left. Two merchantmen of
// one side run before it under all sail: the near one slides down the back of a swell — bow down on the slope and
// heeled towards us (kit `roll`, the tilt on the slope as in «Буря») — the bone in her teeth, spray blown off her
// stem; long pennants stand straight out ahead of the wind on every masthead. Cloud rows and high mares' tails are
// combed the same way, whitecaps all over the sea, spindrift torn off downwind. Card: changing places
// (Перестроение) is free for both teams this round.
// Brief: docs/mockups/print/card-briefs.md «Попутный ветер»; docs/tasks/print-kit-cards.md «Попутный ветер».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 116;                     // horizon
const SUN = { x: 34, y: 90 };       // the low morning sun on the left, upwind, under the clouds
const light = { time: 'day', haze: .12, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffdc9a', power: 1 }, fill: { color: '#8fc0e8', power: .5 } };
// the ships are tilted on the slope of the sea by turning the whole ship (hull, sails, the kit's foam and wake)
// round the middle of her waterline: the same as kit `heel` for a flipped ship, and the level cut of the hull at
// the waterline turns with it
const NEAR = { kind: 'merchant', x: 94, y: 136, scale: 1.05, flip: true, roll: 12, sails: 'full', detail: 'near', wake: true, seed: 9 }, TN = 7;
const FAR = { kind: 'merchant', x: 176, y: 119.4, scale: .4, flip: true, roll: 6, sails: 'full', detail: 'mid', wake: true, seed: 31 }, TF = -2.5;
const skel = { horizon: HZ, eye: 3, light: 'the low morning sun ahead on the left, upwind: sails glow through, bright edges towards it, shadows on the water towards us and to the right',
  items: [
    ['near', 48, NEAR.y, 100, 80, 'on the back of a swell, bow down 7° on the slope, heeled 12° towards us, running to the right'],
    ['far', 158, FAR.y, 40, 36, 'on the water, higher and to the right, clear of the near one, bow up 2.5° on the next sea'],
    ['swell', -14, 124, 228, 116, 'the back of the swell under the near ship, its crest behind her stern'],
    ['pennants', 60, 34, 120, 14, 'flying from the mastheads straight out to the right'],
    ['spray', 128, 120, 36, 22, 'thrown up at the near ship\'s stem, blown to the right'],
    ['crest', -10, 250, 110, 40, 'a near whitecap under the glass'],
  ] };

module.exports = { name: 'Попутный ветер', kind: 'sea', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
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
    // the back of the swell under the near ship: its top runs along her tilted waterline, the crest behind her stern
    const ra = TN * Math.PI / 180, x0 = NEAR.x, y0 = NEAR.y, onFace = x => y0 + (x - x0) * Math.tan(ra);
    const sTop = [[-14, 122.6], [6, 124.4], [26, onFace(26) + .8], [48, onFace(48) + .3], [70, onFace(70)], [94, y0], [118, onFace(118) + .2], [134, onFace(134) + .7], [150, onFace(150) + .9], [170, onFace(150) + 1.4], [190, onFace(150)], [214, onFace(150) - 1.8]];
    bg += swell(u, L, { top: sTop, bottom: 250, seed: 4, lean: .35, band: 9, streaks: 16, slope: Math.tan(ra) * .7, depth: 40,
      ripples: { horizon: HZ, bottom: 292, rot: TN, cx: x0, cy: y0, op: .55 } });
    bg += crestFoam(u, L, sTop.slice(0, 4), { seed: 6, h: 1.1, gap: .3 });
    // the shadows of the running clouds on the water: long soft patches, cool, under the glass and in the middle
    bg += cloudShadows(u, L);
    // whitecaps all over the sea, small and many far off, fewer and larger near
    bg += whitecaps(u, L);
    // the far ship, bow up on the next sea, then the near one over it, sliding down the slope
    bg += `<g transform="rotate(${TF} ${FAR.x} ${FAR.y})">${K.ship(u, L, FAR)}</g>` + K.splash(u, { x: FAR.x + 15.6, y: FAR.y - .2, w: 5, h: 6, seed: 5, L, wind: 1 });
    bg += pennants(u, L, FAR, TF, [17, 13, 9], .8, 41);
    bg += `<g transform="rotate(${TN} ${x0} ${y0})">${K.ship(u, L, NEAR)}</g>`;
    bg += pennants(u, L, NEAR, TN, [44, 32, 22], 2.3, 43);
    // the bow: white water thrown up at the stem and blown to the right, spray streaming off it
    const st = [x0 + 36.75 * Math.cos(ra), y0 + 36.75 * Math.sin(ra)];
    bg += K.splash(u, { x: st[0] + 2, y: st[1] - .2, w: 15, h: 19, seed: 2, L, wind: 1 }) + spray(u, L, st[0] + 3, st[1] - 9, 40, 18, 44) + spray(u, L, st[0] - 8, st[1] - 3, 26, 6, 45);
    // ——— under the glass: a near whitecap breaking downwind, spindrift torn off it
    let fg = nearSwell(u, L) + whitecap(u, L, { x: 172, y: 196, w: 60, h: 9, seed: 12, wind: 1 });
    fg += spindrift(u, L, 46, 196, 90, 7) + spindrift(u, L, 194, 189, 30, 8) + spindrift(u, L, 120, 160, 60, 9);
    return [bg, fg];
  } };

// ——— KIT-CANDIDATE: long pennants standing out in a strong wind from every masthead of a ship (o: the ship's
// options, tilt: its turn in degrees; lens: pennant lengths for the masts, the tallest first): a long tapering
// strip nearly straight downwind, short quick waves running along it, the fly a little lower than the hoist;
// lit along its upper edge from the sun, the folds darker. Drawn over the kit's own short pennants.
function pennants(u, L, o, tilt, lens, w0, seed) {
  const g = K.shipGeom(o.kind, Object.assign({}, o, { heel: tilt })), R = rng(seed);
  const tops = g.masts.map(m => m.top).sort((a, b) => a[1] - b[1]);
  let s = '';
  tops.forEach((p, i) => { const len = lens[i] || lens[lens.length - 1], w = w0 * (i ? .8 : 1), ph = R() * 6, k = 6 + R() * 2.5, N = 18, top = [], bot = [];
    const c = t => [p[0] + .3 + t * len, p[1] - .45 * o.scale + len * (.03 * t * t + .015 * t) + w * .55 * Math.sin(t * k + ph) * Math.pow(t, .6)];
    for (let j = 0; j <= N; j++) { const t = j / N, q = c(t), hw = w * .5 * (1 - .88 * t); top.push([q[0], q[1] - hw]); bot.push([q[0] - hw * .15, q[1] + hw]); }
    const d = `M${top.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}L${bot.reverse().map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z`, id = nid('pn', u);
    const stops = []; for (let j = 0; j <= 10; j++) { const t = j / 10, v = Math.sin(t * k + ph + .9); stops.push([t, v > 0 ? mix('#e0503a', '#ffb08a', v * .35) : mix('#c23a2c', '#5a160e', -v * .55), 1]); }
    s += `<defs>${linGrad(id, p[0], 0, p[0] + len, 0, stops)}</defs><path d="${d}" fill="url(#${id})" stroke="#4a140c" stroke-width="${f(Math.max(.12, w * .1))}" stroke-linejoin="round"/>`
      + `<path d="M${top.slice(0, 12).map(q => f(q[0]) + ' ' + f(q[1] + .15)).join('L')}" stroke="#ffc8a0" stroke-width="${f(w * .12)}" fill="none" opacity=".55"/>`; });
  return s;
}

// spray blown off the bow wave: drops and short streaks flying downwind, thinning out to the right and falling
function spray(u, L, x, y, len, h, seed) {
  const R = rng(seed), c = mix('#f4fbff', L.keyColor, .2), bl = nid('sy', u);
  let s = `<defs><filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".25"/></filter></defs><g filter="url(#${bl})" stroke="${c}" stroke-linecap="round" fill="none">`;
  for (let i = 0; i < 70; i++) { const t = Math.pow(R(), .8), px = x + t * len + (R() - .5) * 3, py = y + (R() - .5) * h * (1 - t * .4) + t * t * h * .5, l = (.8 + R() * 3.2) * (1 - t * .5);
    s += `<path d="M${f(px)} ${f(py)}l${f(l)} ${f(l * .12)}" stroke-width="${f(.3 + R() * .55)}" opacity="${f((.95 - t * .55) * (.6 + R() * .4))}"/>`; }
  return s + '</g>';
}

// ——— copied from burya.cjs (accepted): the swell body and crest foam (KIT-CANDIDATE there)
const pts2d = (pts) => pts.map(p => f(p[0]) + ' ' + f(p[1]));
// a smooth open or closed curve through points (Catmull-Rom as cubic Béziers)
function sp(pts, closed) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
const lin = (id, x1, y1, x2, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${st.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</linearGradient>`;
const blur = (id, sd, box) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
// the tone of the water on a face with the normal n = [x right, y up, z at the viewer] (as kit planeGrad does)
const waterTone = (L, n, x, y, k = 0) => { const l = Math.hypot(...n), d = L.at(x, y); return L.tone('water-wet', clamp((n[0] * d.dx - n[1] * d.dy + n[2] * d.dz) / l + k, -1, 1), x, y); };

// KIT-CANDIDATE swell: the body of one big swell — its top runs through `top` (left to right), down to `bottom`.
// The tone runs across the swell from the crest (its thin top lets the light through, the sky's sheen on it) to the
// dark trough; the face leans by `lean` (normal); wind streaks of foam lie along the face.
function swell(u, L, o) {
  const top = o.top, bot = o.bottom, R = rng(o.seed || 1), id = nid('sw', u), id2 = nid('sx', u), cl = nid('sc', u);
  const xs = top.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), ymin = Math.min(...top.map(p => p[1]));
  const d = sp(top) + `L${f(x1)} ${f(bot)}L${f(x0)} ${f(bot)}Z`;
  const cx = (x0 + x1) / 2, crest = waterTone(L, [o.lean || 0, 1, .35], cx, ymin, .25), face = waterTone(L, [o.lean || 0, .35, 1], cx, ymin + 20), trough = waterTone(L, [o.lean || 0, -.2, 1], cx, bot, -.35);
  const sheen = mix(L.pal.sky[3], L.keyColor, .4), glow = mix(mix(L.pal.sea[0], '#9fd6c8', .35), L.keyColor, .25);
  let defs = lin(id, 0, ymin, 0, bot, [[0, glow], [.08, crest], [.3, face], [.75, mix(face, trough, .7)], [1, trough]]) + `<clipPath id="${cl}"><path d="${d}"/></clipPath>`;
  let body = `<path d="${d}" fill="url(#${id})"/>`;
  // the thin translucent band just under the crest line, lit through from the rift; it fades down the face
  defs += lin(id2, 0, ymin - 2, 0, ymin + (o.band || 14), [[0, glow, .0], [.25, glow, .55], [1, glow, 0]]);
  body += `<g clip-path="url(#${cl})">`;
  const band = top.map(p => [p[0], p[1] + (o.band || 14)]).reverse();
  body += `<path d="${sp(top)}L${pts2d(band).map(s => 'L' + s).join('').slice(1)}Z" fill="url(#${id2})" opacity=".8"/>`;
  // the cold sheen of the rift on the crest, right under the source
  if (o.sheenX != null) { const g = nid('sh', u), fb = nid('sb', u); defs += `<radialGradient id="${g}"><stop offset="0" stop-color="${sheen}" stop-opacity=".7"/><stop offset="1" stop-color="${sheen}" stop-opacity="0"/></radialGradient>` + blur(fb, 1.2, [o.sheenX - 40, ymin - 20, 80, 60]);
    const yy = yAt(top, o.sheenX); body += `<ellipse cx="${f(o.sheenX)}" cy="${f(yy + 3)}" rx="${f(o.sheenW || 22)}" ry="3.2" fill="url(#${g})" filter="url(#${fb})"/>`; }
  // wind streaks: long thin lines of foam down the face, each its own length and bend, in loose chains
  for (let i = 0; i < (o.streaks || 0); i++) {
    const sx = lerp(x0, x1, R()), sy = yAt(top, sx) + 4 + R() * (o.depth || 30), ln = 10 + R() * 26, sl = (o.slope || 0) + (R() - .5) * .08, th = .2 + R() * .35, bd = (R() - .5) * 3;
    body += `<path d="M${f(sx)} ${f(sy)}c${f(ln * .3)} ${f(ln * .3 * sl - th + bd)} ${f(ln * .7)} ${f(ln * .7 * sl - th - bd)} ${f(ln)} ${f(ln * sl)}c${f(-ln * .3)} ${f(-ln * .3 * sl + th * 1.4 - bd)} ${f(-ln * .7)} ${f(-ln * .7 * sl + th * 1.4 + bd)} ${f(-ln)} ${f(-ln * sl)}z" fill="${mix(sheen, '#ffffff', .4)}" opacity="${f(.12 + R() * .22)}"/>`;
  }
  // the ripples of the kit's sea laid over the face, turned with it (larger and stronger towards the viewer)
  if (o.ripples) { const r = o.ripples; body += `<g opacity="${f(r.op || .5)}"${r.rot ? ` transform="rotate(${f(r.rot)} ${f(r.cx)} ${f(r.cy)})"` : ''}>${K.water(u, L, { horizon: r.horizon, bottom: r.bottom || 300, swell: 1, seed: o.seed + 50, glitter: false, w: r.w || 260 })}</g>`; }
  body += (o.inner || '') + '</g>';
  return `<defs>${defs}</defs>${body}`;
}
// y of a polyline of points at x (linear between the points)
function yAt(pts, x) { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]]; return b[1] + (a[1] - b[1]) * (b[0] - x) / (b[0] - a[0] || 1); } return pts[pts.length - 1][1]; }
// foam laid along a curve: kit foam pieces turned to the local slope
function crestFoam(u, L, pts, o = {}) {
  let out = '';
  const R = rng(o.seed || 3);
  for (let i = 0; i < pts.length - 1; i++) {
    if (R() < (o.gap || .15)) continue;
    const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, w = Math.hypot(b[0] - a[0], b[1] - a[1]) * (1.05 + R() * .3);
    out += `<g transform="rotate(${f(ang)} ${f(mx)} ${f(my)})">${K.foam(u, { x: mx, y: my + (o.dy || 0), w, h: (o.h || 1.6) * (.7 + R() * .6), seed: (o.seed || 3) * 31 + i, L })}</g>`;
  }
  return out;
}

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
    // keep clear of the near ship's hull and her foam (they are drawn over)
    if (y < 144 && x > 40 && x < 162) continue;
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
