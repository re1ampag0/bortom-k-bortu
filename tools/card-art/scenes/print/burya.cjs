// «Буря» (Колода моря): a brig on the steep face of a swell, laid over so hard that its bow chasers point into the
// clouds — in such a sea a broadside hits weaker. Brief: docs/tasks/print-kit-cards.md «Буря». Kit only (kit/README.md).
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 122;
// the key light comes from the rift in the clouds, high and a little right of the middle, in front of us (kit az: 0 —
// from the depth at the viewer; the brief's 190 "where it flies" = at the viewer): soft light, short shadows towards us
const light = {
  time: 'day',
  key: { type: 'sun', az: 3, x: 116, y: 32, el: 55, color: '#cfd6d2', power: .6 },
  fill: { color: '#4a5a5c', power: .5 },
  rim: { az: 0, color: '#e6ecea', power: .45 },
  locals: [{ x: 152, y: 100, h: 6, color: '#ffb24a', power: .8, radius: 36 }],
  haze: .5,
};
// the skeleton: horizon (hidden by the swell), eye 3 m; [id, x, y (base), w, h, support]
const skel = {
  horizon: HZ, eye: 3,
  items: [
    ['brig, heel -24', 84, 130, 82, 88, 'swell face (tilted waterline)'],
    ['bow chasers', 140, 100, 22, 16, 'bow of the brig'],
    ['shot trails', 160, 86, 40, 36, 'from the muzzles'],
    ['near swell', 0, 250, 200, 98, 'sea'],
    ['yard + rag', 34, 206, 76, 20, 'back of the near swell'],
  ],
};

// the sea series' water (print-kit-cards.md, head): one blue-teal row; the storm's sky is leaden
const PAL = {
  sky: ['#3b444b', '#56626a', '#7c898d', '#a3acaa'], sea: ['#7c9ba6', '#2f5f74', '#16323f'],
  cloudLit: '#d3d9d6', cloudShade: '#3a444b', smoke: '#b8b6b0',
};

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
// KIT-CANDIDATE rain: a curtain of slanting rain from a cloud base: a soft veil and streaks of different length,
// thicker and denser near the base, thinning towards the sea
function rain(u, L, o) {
  const R = rng(o.seed || 9), id = nid('rn', u), fb = nid('rb', u), c = mix(L.pal.sky[2], '#ffffff', .25), dx = o.slant || .35;
  const [x0, x1, y0, y1] = [o.x0, o.x1, o.y0, o.y1];
  let out = `<defs>${lin(id, 0, y0, 0, y1, [[0, c, .42], [.6, c, .22], [1, c, 0]])}${blur(fb, 2.4, [x0 - 30, y0 - 10, x1 - x0 + 80, y1 - y0 + 20])}</defs>`
    + `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y0)}L${f(x1 + (y1 - y0) * dx)} ${f(y1)}L${f(x0 + (y1 - y0) * dx)} ${f(y1)}Z" fill="url(#${id})" filter="url(#${fb})"/>`;
  let st = '';
  for (let i = 0; i < (o.n || 40); i++) {
    const t = R(), x = lerp(x0, x1, R()) + t * (y1 - y0) * dx, y = y0 + t * (y1 - y0) * .9, l = 5 + R() * 13;
    st += `<path d="M${f(x)} ${f(y)}l${f(l * dx)} ${f(l)}" stroke="${c}" stroke-width="${f(.18 + R() * .22)}" opacity="${f((.2 + R() * .35) * (1 - t * .6))}"/>`;
  }
  return out + `<g stroke-linecap="round">${st}</g>`;
}

module.exports = {
  name: 'Буря', kind: 'sea', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, PAL);
    // ——— sky: leaden, a rift of light in the clouds over the middle ———
    let bg = K.sky(u, L, { horizon: HZ + 2 });
    bg += K.localGlow(u, { x: 116, y: 36, color: '#eef2ec', power: .75, radius: 44 }, { core: false });
    bg += K.cloudBank(u, L, { y: HZ - 5, h: 13, x0: -20, x1: 220, n: 5, seed: 12, far: .75 });
    bg += K.cloud(u, L, { x: 184, y: 70, w: 116, h: 48, seed: 31 });
    bg += K.cloud(u, L, { x: 26, y: 84, w: 136, h: 64, seed: 23 });
    bg += K.cloud(u, L, { x: 66, y: 24, w: 170, h: 32, seed: 5 });
    bg += K.cloud(u, L, { x: 178, y: 20, w: 110, h: 28, seed: 41 });
    bg += rain(u, L, { x0: -12, x1: 48, y0: 80, y1: HZ + 4, n: 70, seed: 3, slant: .38 });
    bg += rain(u, L, { x0: 156, x1: 208, y0: 64, y1: HZ, n: 46, seed: 8, slant: .38 });
    // ——— the sea: far rough water, an uneven line of far swells at the horizon ———
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: 1, seed: 5, glitter: false });
    const farTop = [[-4, HZ + 1], [14, HZ - 1.6], [30, HZ + .6], [48, HZ - 2.4], [66, HZ], [82, HZ - 1.4], [104, HZ + 1.2]];
    bg += swell(u, L, { top: farTop, bottom: 200, seed: 2, lean: .2, band: 5 });
    bg += crestFoam(u, L, farTop.slice(1, -1), { seed: 5, h: .6, gap: .5 });
    // the swell under the brig: its face rises to the right at 24 degrees, the crest just beyond the bow
    const ang = -24, ra = ang * Math.PI / 180, x0 = 121, y0 = 114;
    const onFace = x => y0 + (x - x0) * Math.tan(ra);
    const sTop = [[-6, onFace(-6) + 3], [24, onFace(24) + 2.4], [50, onFace(50) + 1.2], [76, onFace(76) + .4], [104, onFace(104)], [132, onFace(132)], [158, onFace(158) + .8], [172, 93], [186, 94], [198, 98], [214, 104]];
    bg += swell(u, L, { top: sTop, bottom: 230, seed: 4, lean: -.5, band: 12, sheenX: 132, sheenW: 30, streaks: 12, slope: Math.tan(ra) * .8, depth: 30,
      ripples: { horizon: 60, bottom: 260, rot: ang, cx: x0, cy: y0, op: .42 } });
    // ——— the brig on the face: heeled -24 (bow up to the right), reefed; its shadow on the water below it ———
    const s = 1.1, sh = { kind: 'brig', x: x0, y: y0, scale: s, flip: true, heel: ang, sails: 'reefed', detail: 'near', seed: 17 };
    const ca = Math.cos(ra), sa = Math.sin(ra), pt = (X, H) => [x0 - s * (X * ca - H * sa), y0 - s * (X * sa + H * ca)];
    let mid = `<g transform="rotate(${ang} ${x0} ${y0})">${K.contactShadow(u, x0, y0 + 1.2, 80, L, { ry: 3.4, opacity: .55 })}</g>`;
    // without a wake the kit draws a level line at the waterline: the waterline here is tilted, its foam is our own
    // KIT-CANDIDATE heel: the kit cuts the hull at a level line y = waterline; heeled, the cut must tilt with the hull
    const wl = [pt(-400, -.2), pt(400, -.2), pt(400, 900), pt(-400, 900)].map(p => f(p[0]) + ' ' + f(p[1])).join('L');
    mid += K.ship(u, L, sh).replace(/<path d="M[-\d.]+ ([-\d.]+)L[-\d.]+ \1" stroke="#[0-9a-f]{6}" stroke-width="[\d.]+" opacity=".45"\/>/, '')
      .replace(/(<clipPath id="khw[^"]+">)<rect x="-400" y="-900" width="1000" height="[\d.]+"\/>/, `$1<path d="M${wl}Z"/>`);
    // the bow chasers: two iron barrels out of the bow, along the hull and a little higher (30 degrees to the horizon)
    const el = -30 * Math.PI / 180, gun = [[-29.5, 6.6, 9], [-26, 4.9, 8]];
    let guns = '', flashes = '';
    gun.forEach(([X, H, ln], i) => {
      const a = pt(X, H), b = [a[0] + Math.cos(el) * ln, a[1] + Math.sin(el) * ln];
      guns += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.2, L, 'iron', { r2: 1, outline: .4, seed: 3 + i });
      const m = [b[0] + Math.cos(el) * .4, b[1] + Math.sin(el) * .4];
      flashes += K.muzzleFlash(u, { x: m[0], y: m[1], dir: -30 + (i ? 3 : -2), len: i ? 24 : 32, seed: i ? 1 : 0 });
      // the trail of the shot: a thin soft streak of smoke along the flight, drifting right with the wind
      const tl = nid('tl', u), tf = nid('tf', u), q0 = 26 + i * 5, q1 = q0 + 40 + i * 8, p0 = [m[0] + Math.cos(el) * q0, m[1] + Math.sin(el) * q0], p1 = [m[0] + Math.cos(el) * q1 + 2.5, m[1] + Math.sin(el) * q1 + 1.6];
      flashes += `<defs>${lin(tl, p0[0], p0[1], p1[0], p1[1], [[0, '#ece8e0', .0], [.15, '#ece8e0', .95], [1, '#d6d4cd', .25]])}${blur(tf, .45, [p0[0] - 10, p1[1] - 10, 90, 60])}</defs>`
        + `<path d="M${f(p0[0])} ${f(p0[1])}Q${f((p0[0] + p1[0]) / 2 + 1)} ${f((p0[1] + p1[1]) / 2 - .6)} ${f(p1[0])} ${f(p1[1])}" stroke="url(#${tl})" stroke-width="${f(1.9 - i * .4)}" fill="none" stroke-linecap="round" filter="url(#${tf})"/>`;
    });
    // the gun smoke, carried right past the ship by the wind from the left, lit from inside by the flashes
    const m0 = pt(-33, 10);
    flashes = K.smoke(u, L, { x: m0[0] + 6, y: m0[1] - 4, w: 26, h: 26, wind: .9, seed: 6, opacity: .7, glow: { color: '#ffb060', power: .5 } }) + flashes;
    mid += guns;
    // foam along the tilted waterline and the sea breaking on the raised bow
    mid += `<g transform="rotate(${ang} ${x0} ${y0})">${K.foam(u, { x: x0 - 2, y: y0 + .4, w: 74, h: 1.3, seed: 21, L })}</g>`;
    const stem = pt(-34.5, 0);
    mid += K.splash(u, { x: stem[0], y: stem[1] + 1, w: 11, h: 9, seed: 5, L, wind: 1 });
    mid += crestFoam(u, L, sTop.slice(7, 10), { seed: 9, h: 1.2, gap: .25 });
    // ——— the near swell (under the glass): a dark back with lace, the trough between; a broken yard afloat ———
    let fg = '';
    const nTop = [[-8, 168], [16, 160], [40, 155.5], [66, 158], [92, 164], [118, 168], [146, 163], [172, 155], [196, 152], [212, 154]];
    fg += swell(u, L, { top: nTop, bottom: 284, seed: 8, lean: .3, band: 10, streaks: 10, slope: -.05, depth: 50,
      ripples: { horizon: 150, bottom: 290, op: .32 } });
    fg += crestFoam(u, L, nTop.slice(1, 4), { seed: 13, h: 1.6, gap: .3, dy: 1.5 }) + crestFoam(u, L, nTop.slice(6, 9), { seed: 14, h: 1.3, gap: .3, dy: 1.5 });
    // the broken yard lying on the back of the near swell, a rag of its sail spread flat on the water beside it
    const yd = [[34, 196], [104, 189]], cr = L.ramp('canvas', 66, 200);
    const cv = K.mat('canvas', L, { form: 'plane', x1: 40, y1: 196, x2: 96, y2: 210, n: [0, .9, .45], u });
    const rag = 'M44 197C56 195.6 66 194.6 80 193C83 195.6 80 198 85 200.6C77 202.4 72 201 66 204.6C60 202.6 55 205.4 49 203C51 201.4 45 200.2 44 197Z';
    let yard = `<defs>${cv.defs}</defs><path d="${rag}" fill="${cv.fill}" stroke="${cr.outline}" stroke-width=".3"/>`
      + `<path d="M54 196.6C55 198.6 53 200.6 56 203.4M68 195.4C69 197.6 67 199.6 70 202.6" fill="none" stroke="${cr.core}" stroke-width=".6" opacity=".5"/>`;
    // the lower edge of the rag sinks: the water shows through it
    const wv = nid('wv', u); yard += `<defs>${lin(wv, 0, 196, 0, 205, [[0, L.pal.sea[1], 0], [1, L.pal.sea[2], .75]])}</defs><path d="${rag}" fill="url(#${wv})"/>`;
    yard += K.shadeCyl(u, yd[0][0], yd[0][1], yd[1][0], yd[1][1], 2.6, L, 'oak', { r1: 2.3, r2: 2.8, outline: .5, seed: 7 });
    const se = yd[1], sr = L.ramp('oak', se[0], se[1]);
    yard += `<path d="M${f(se[0] - .6)} ${f(se[1] - 2.8)}l3.2 -1.4l-1.2 1.6l3.6 .4l-2.6 1.2l3 1.5l-3.6 .2l1.4 1.8l-3.6 -.8Z" fill="${sr.half}" stroke="${sr.outline}" stroke-width=".35"/>`;
    fg += K.contactShadow(u, 69, 194, 74, L, { ry: 3, opacity: .45 }) + yard + K.foam(u, { x: 66, y: 195.5, w: 80, h: 1.3, seed: 33, L });
    return [bg + mid + flashes, fg];
  },
};
