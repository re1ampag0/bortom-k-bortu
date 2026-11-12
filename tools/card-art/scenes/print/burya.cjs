// «Буря» (Колода моря): a storm at night. A brig climbs the steep face of a swell, laid over so hard that her deck
// stands on end; she fires her bow gun at a merchantman on the next crest — and the shot drops into the wave short
// of her (a white splash beside the target). The horizon itself is tilted (we roll too); the wind tears the gun
// smoke away; slanting rain; the moon in a rift of the clouds (no lightning: that is «Гроза») gives the
// cold light, the gun flash and the lanterns of the merchant the warm. Rule: every Залп deals 1 damage less.
// Briefs: docs/mockups/print/card-briefs.md «Буря», docs/tasks/print-kit-cards.md «Буря».
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 108, TILT = -3.5;   // the series' horizon, rolled with us
// one key light: the moon in a rift of the clouds, high and right of the middle, in front of us (cold, back light);
// the gun flash and the merchant's lanterns are the warm locals
const light = {
  time: 'night',
  key: { type: 'moon', x: 128, y: 34, el: 40, color: '#c9d6f2', power: .62 },
  fill: { color: '#2a3550', power: .45 },
  rim: { az: 0, color: '#dfe8ff', power: .55 },
  locals: [{ x: 124, y: 76, h: 6, color: '#ffb24a', power: .85, radius: 40 }, { x: 170, y: 88, h: 3, color: '#ffc870', power: .5, radius: 18 }],
  haze: .45,
};
const skel = {
  horizon: HZ, eye: 3,
  items: [
    ['brig, heel -22', 46, 122, 84, 82, 'swell face (tilted waterline)'],
    ['bow gun + flash', 118, 70, 18, 14, 'bow of the brig'],
    ['shot arc', 128, 60, 26, 40, 'from the muzzle into the wave'],
    ['merchant, lanterns', 150, 102, 40, 34, 'far crest'],
    ['splash (miss)', 146, 102, 14, 16, 'water beside the merchant'],
    ['near swell', 0, 250, 200, 98, 'sea'],
    ['yard + rag', 34, 206, 76, 20, 'back of the near swell'],
  ],
};
// night storm: slate-indigo sky, the sea of the series dimmed (one blue-teal row)
const PAL = {
  sky: ['#0d1220', '#1b2438', '#2c3a52', '#45566e'], sea: ['#3d5f74', '#1b3c4e', '#0a1c26'],
  cloudLit: '#9aa8c4', cloudShade: '#141a28', smoke: '#9a9ca4',
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
  let out = o.veil === false ? '' : `<defs>${lin(id, 0, y0, 0, y1, [[0, c, .42], [.6, c, .22], [1, c, 0]])}${blur(fb, 2.4, [x0 - 30, y0 - 10, x1 - x0 + 80 + (y1 - y0) * dx, y1 - y0 + 20])}</defs>`
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
    // ——— the sky: low storm clouds, the moon looking through a rift between two banks ———
    let bg = K.sky(u, L, { horizon: HZ + 6, stars: false });
    bg += K.localGlow(u, { x: 126, y: 38, color: '#dfe6ff', power: .8, radius: 62 }, { core: false });
    bg += K.cloud(u, L, { x: 100, y: 24, w: 230, h: 34, seed: 5 });
    bg += K.cloud(u, L, { x: 190, y: 52, w: 110, h: 34, seed: 41 });
    // the rift in the clouds: the moon looks through a ragged window and silvers the cloud edges round it
    bg += K.sunMoon(u, L, { r: 6.5 });
    bg += K.cloud(u, L, { x: 34, y: 66, w: 150, h: 58, seed: 23 });
    bg += K.cloud(u, L, { x: 176, y: 84, w: 96, h: 26, seed: 31, far: .4 });
    bg += K.cloudBank(u, L, { y: HZ - 4, h: 12, x0: -20, x1: 220, n: 5, seed: 12, far: .7 });
    bg += rain(u, L, { x0: -14, x1: 54, y0: 62, y1: HZ + 8, n: 80, seed: 3, slant: .38 });
    bg += rain(u, L, { x0: 150, x1: 212, y0: 60, y1: HZ + 4, n: 50, seed: 8, slant: .38 });
    // ——— the rolled world: far rough sea, a far crest, the merchantman with her lanterns, the splash of our shot ———
    let world = `<g transform="translate(-50 0)">${K.water(u, L, { horizon: HZ, bottom: 300, swell: 1, seed: 5, glitter: 176, w: 300 })}</g>`;
    world += K.ship(u, L, { kind: 'merchant', x: 168, y: 101.5, scale: .5, sails: 'reefed', detail: 'mid', lights: true, seed: 6 });
    const farTop = [[118, 104.5], [134, 102.6], [150, 103.2], [166, 101.9], [182, 103.4], [204, 102.2]];
    world += swell(u, L, { top: farTop, bottom: 150, seed: 2, lean: .2, band: 4, streaks: 4, slope: 0, depth: 8 });
    world += crestFoam(u, L, farTop.slice(0, -1), { seed: 5, h: .7, gap: .35 });
    // the shot fell short: the splash stands beside the merchantman's bow, her lantern light catches it
    world += K.splash(u, { x: 141, y: 103.6, w: 14, h: 20, seed: 0, L, wind: 1 }) + K.localGlow(u, { x: 139, y: 98, color: '#ffc870', power: .25, radius: 14 }, { core: false });
    bg += `<g transform="rotate(${TILT} 100 ${HZ})">${world}</g>`;
    // the swell under the brig: its face rises to the right, the crest just ahead of her bow
    const ang = -21, ra = ang * Math.PI / 180, x0 = 78, y0 = 124;
    const onFace = x => y0 + (x - x0) * Math.tan(ra);
    const sTop = [[-6, onFace(-6) + 3], [18, onFace(18) + 2.4], [40, onFace(40) + 1.2], [60, onFace(60) + .4], [84, onFace(84)], [104, onFace(104)], [118, onFace(118) + 1.4], [128, 108], [140, 110.5], [160, 115], [184, 119], [214, 122]];
    bg += swell(u, L, { top: sTop, bottom: 240, seed: 4, lean: -.5, band: 12, sheenX: 104, sheenW: 26, streaks: 14, slope: Math.tan(ra) * .8, depth: 30,
      ripples: { horizon: 70, bottom: 260, rot: ang, cx: x0, cy: y0, op: .4 } });
    // ——— the brig on the face: heeled, bow up to the right, reefed, her windows lit ———
    const s = .95, sh = { kind: 'brig', x: x0, y: y0, scale: s, flip: true, heel: ang, sails: 'reefed', detail: 'near', lights: true, seed: 17, roll: 16 };   // laid over towards us by the sea: her deck shows
    const ca = Math.cos(ra), sa = Math.sin(ra), pt = (X, H) => [x0 - s * (X * ca - H * sa), y0 - s * (X * sa + H * ca)];
    let mid = `<g transform="rotate(${ang} ${x0} ${y0})">${K.contactShadow(u, x0, y0 + 1.2, 74, L, { ry: 3.2, opacity: .6 })}</g>`;
    // KIT-CANDIDATE heel: the kit cuts the hull at a level line y = waterline; heeled, the cut must tilt with the hull
    const wl = [pt(-400, -.2), pt(400, -.2), pt(400, 900), pt(-400, 900)].map(p => f(p[0]) + ' ' + f(p[1])).join('L');
    mid += K.ship(u, L, sh).replace(/<path d="M[-\d.]+ ([-\d.]+)L[-\d.]+ \1" stroke="#[0-9a-f]{6}" stroke-width="[\d.]+" opacity=".45"\/>/, '')
      .replace(/(<clipPath id="khw[^"]+">)<rect x="-400" y="-900" width="1000" height="[\d.]+"\/>/, `$1<path d="M${wl}Z"/>`);
    // the bow gun: an iron barrel out of the bow, pointing up past the merchantman
    const el = -26 * Math.PI / 180, a = pt(-29, 6.4), b = [a[0] + Math.cos(el) * 9, a[1] + Math.sin(el) * 9], m = [b[0] + Math.cos(el) * .4, b[1] + Math.sin(el) * .4];
    mid += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.25, L, 'iron', { r2: 1.05, outline: .4, seed: 3 });
    let fx = K.smoke(u, L, { x: m[0] + 4, y: m[1] - 2, w: 30, h: 22, wind: 1, seed: 6, opacity: .75, glow: { color: '#ffb060', power: .6 } });
    fx += K.muzzleFlash(u, { x: m[0], y: m[1], dir: -26, len: 21, seed: 0 });
    // the flight of the shot: a thin smoke trail rising and falling into the wave by the merchant (the miss)
    { const sp = (() => { const tp = [141, 103.6], rr = TILT * Math.PI / 180, c = Math.cos(rr), sn = Math.sin(rr); return [100 + (tp[0] - 100) * c - (tp[1] - HZ) * sn, HZ + (tp[0] - 100) * sn + (tp[1] - HZ) * c]; })();
      const p0 = [m[0] + 14, m[1] - 7], ctl = [126, 64], tl = nid('tl', u), tf = nid('tf', u);
      fx += `<defs>${lin(tl, p0[0], p0[1], sp[0], sp[1], [[0, '#ece8e0', .2], [.35, '#eeeae2', .9], [1, '#e0ded8', .6]])}${blur(tf, .5, [p0[0] - 10, 50, 70, 70])}</defs>`
        + `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(ctl[0])} ${f(ctl[1])} ${f(sp[0])} ${f(sp[1] - 9)}" stroke="url(#${tl})" stroke-width="2.4" fill="none" stroke-linecap="round" filter="url(#${tf})"/>`
        + `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(ctl[0])} ${f(ctl[1])} ${f(sp[0])} ${f(sp[1] - 9)}" stroke="#fbf8f0" stroke-width=".5" fill="none" stroke-linecap="round" opacity=".7"/>`; }
    // the flash lights the bow, the sails over it and the water under it
    fx += K.localGlow(u, { x: m[0] + 6, y: m[1], color: '#ffb24a', power: .55, radius: 40 }, { core: false }) + K.localGlow(u, { x: m[0] - 4, y: onFace(m[0]) + 2, color: '#ffa040', power: .3, radius: 26 }, { squash: .35, core: false });
    // foam along the tilted waterline and the sea breaking on the raised bow
    mid += `<g transform="rotate(${ang} ${x0} ${y0})">${K.foam(u, { x: x0 - 2, y: y0 + .4, w: 70, h: 1.4, seed: 21, L })}</g>`;
    const stem = pt(-34.5, 0);
    mid += K.splash(u, { x: stem[0], y: stem[1] + 1, w: 12, h: 10, seed: 5, L, wind: 1 });
    mid += crestFoam(u, L, sTop.slice(6, 10), { seed: 9, h: 1.2, gap: .25 });
    // spray torn off the crest by the wind, flying right
    { const R = rng(44); let sp = ''; for (let i = 0; i < 36; i++) { const x = 96 + R() * 40, y = 96 + R() * 22, l = 1.5 + R() * 4; sp += `<path d="M${f(x)} ${f(y)}l${f(l)} ${f(l * .22)}" stroke="#dfe8f0" stroke-width="${f(.25 + R() * .4)}" opacity="${f(.25 + R() * .45)}" stroke-linecap="round"/>`; } mid += sp; }
    // ——— the near swell (under the glass): a dark back with lace, the trough; a broken yard afloat ———
    let fg = '';
    const nTop = [[-8, 168], [16, 160], [40, 155.5], [66, 158], [92, 164], [118, 168], [146, 163], [172, 155], [196, 152], [212, 154]];
    fg += swell(u, L, { top: nTop, bottom: 284, seed: 8, lean: .3, band: 10, streaks: 10, slope: -.05, depth: 50, ripples: { horizon: 150, bottom: 290, op: .32 } });
    fg += crestFoam(u, L, nTop.slice(1, 4), { seed: 13, h: 1.6, gap: .3, dy: 1.5 }) + crestFoam(u, L, nTop.slice(6, 9), { seed: 14, h: 1.3, gap: .3, dy: 1.5 });
    const yd = [[34, 196], [104, 189]], cr = L.ramp('canvas', 66, 200);
    const cv = K.mat('canvas', L, { form: 'plane', x1: 40, y1: 196, x2: 96, y2: 210, n: [0, .9, .45], u });
    const rag = 'M44 197C56 195.6 66 194.6 80 193C83 195.6 80 198 85 200.6C77 202.4 72 201 66 204.6C60 202.6 55 205.4 49 203C51 201.4 45 200.2 44 197Z';
    let yard = `<defs>${cv.defs}</defs><path d="${rag}" fill="${cv.fill}" stroke="${cr.outline}" stroke-width=".3"/>`;
    const wv = nid('wv', u); yard += `<defs>${lin(wv, 0, 196, 0, 205, [[0, L.pal.sea[1], 0], [1, L.pal.sea[2], .75]])}</defs><path d="${rag}" fill="url(#${wv})"/>`;
    yard += K.shadeCyl(u, yd[0][0], yd[0][1], yd[1][0], yd[1][1], 2.6, L, 'oak', { r1: 2.3, r2: 2.8, outline: .5, seed: 7 });
    const se = yd[1], sr = L.ramp('oak', se[0], se[1]);   // the splintered end of the yard
    yard += `<path d="M${f(se[0] - .6)} ${f(se[1] - 2.8)}l3.2 -1.4l-1.2 1.6l3.6 .4l-2.6 1.2l3 1.5l-3.6 .2l1.4 1.8l-3.6 -.8Z" fill="${sr.half}" stroke="${sr.outline}" stroke-width=".35"/>`;
    fg += K.contactShadow(u, 69, 194, 74, L, { ry: 3, opacity: .45 }) + yard + K.foam(u, { x: 66, y: 195.5, w: 80, h: 1.3, seed: 33, L });
    // rain in front of everything, thin, the same slant
    fg += rain(u, L, { x0: -20, x1: 90, y0: 96, y1: 230, n: 40, seed: 12, slant: .38, veil: false });
    return [bg + mid + fx, fg];
  },
};
