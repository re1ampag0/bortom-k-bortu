// kit/light.cjs — the light of a print scene and everything that follows from it: materials shaded from the
// light (gradients in userSpaceOnUse, laid along the light's projection on the form), ready shaded forms with the
// highlight on the light's side, cast and contact shadows by geometry, pools of local light.
// Pure functions that return SVG strings; no Node API. Rules: docs/mockups/print/STYLE.md, API: kit/README.md.
// The scene box is 200 x 280 units (x to the right, y down). Every id ends with the scene suffix `u` and a counter.
'use strict';

let seq = 0;
/** A fresh id: prefix + scene suffix + counter (never repeats inside a process). */
const nid = (p, u) => `k${p}${u}n${seq++}`;
const f = v => String(+(+v).toFixed(2));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
/** Deterministic random numbers 0..1 from a seed (mulberry32). */
const rng = seed => { let s = (Math.imul((seed | 0) + 1, 2654435761) >>> 0) || 1; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

// ——— colour arithmetic (arrays 0..1 inside, hex strings outside) ———
const rgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
const hex = c => '#' + c.map(v => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const luma = c => .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
const satA = (c, k) => { const l = luma(c); return c.map(v => l + (v - l) * k); };
/** mix('#aabbcc', '#112233', t) -> hex between the two. */
const mix = (a, b, t) => hex(mixA(rgb(a), rgb(b), t));
/** Multiply a colour's brightness: scale('#806040', 1.2). */
const scale = (a, k) => hex(rgb(a).map(v => v * k));
const shoulder = v => v > .8 ? .8 + (v - .8) / (1 + (v - .8) / .2) : v;

// ——— palettes: the time of day of a deck. sky: top -> horizon; sea: at the horizon -> at the viewer ———
const PAL = {
  night: { // Black Pearl: night, the moon, blue steel
    sky: ['#0a1322', '#142640', '#27405c', '#3d5a74'], sea: ['#2e4a64', '#152a40', '#0a1626'],
    cloudLit: '#b9c9de', cloudShade: '#1a2840', fog: '#7f97ad', smoke: '#9aa6b8',
    key: { type: 'moon', az: 28, el: 26, color: '#b9cff6', power: .7 }, fill: { color: '#3d5680', power: .4 },
    shadowTint: '#1c2346', tint: .7, floor: .125, sat: .74 },
  dusk: { // Queen Anne's Revenge: sunset, fire, red and orange
    sky: ['#2b2440', '#7a3340', '#d9643a', '#ffc070'], sea: ['#d98a52', '#6a3440', '#241a2c'],
    cloudLit: '#ffb478', cloudShade: '#5b3350', fog: '#c98a6a', smoke: '#b89684',
    key: { type: 'sun', az: 290, el: 9, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 },
    shadowTint: '#33264a', tint: .55, floor: .13, sat: 1 },
  day: { // Endeavour: day, white and blue with ochre
    sky: ['#3f7fb8', '#6fa8d0', '#b4d2de', '#ecead2'], sea: ['#86b6c4', '#2e7088', '#113a4e'],
    cloudLit: '#ffffff', cloudShade: '#9db2c6', fog: '#dfe8e8', smoke: '#d8d2c6',
    key: { type: 'sun', az: 115, el: 55, color: '#fff3d6', power: 1 }, fill: { color: '#8fb4d8', power: .5 },
    shadowTint: '#2b4262', tint: .45, floor: .14, sat: 1 },
  fog: { // Flying Dutchman: greenish fog
    sky: ['#0c1a18', '#1b3530', '#315348', '#4f7566'], sea: ['#3f6458', '#1b3a34', '#0c1f1c'],
    cloudLit: '#8fb8a8', cloudShade: '#142a26', fog: '#9fd0bc', smoke: '#8aa89c',
    key: { type: 'moon', az: 0, el: 35, color: '#bfe8d6', power: .6 }, fill: { color: '#3a6a5c', power: .46 },
    shadowTint: '#14302c', tint: .7, floor: .125, sat: .8 },
};
/** Ready light schemes of the decks (copy and change: { ...LIGHTS.pearl, key: { ...LIGHTS.pearl.key, az: 320 } }). */
const LIGHTS = {
  pearl: { time: 'night', haze: .35, key: { ...PAL.night.key }, fill: { ...PAL.night.fill }, rim: { az: 330, color: '#bfe0ff', power: .5 } },
  revenge: { time: 'dusk', haze: .45, key: { ...PAL.dusk.key }, fill: { ...PAL.dusk.fill } },
  endeavour: { time: 'day', haze: .25, key: { ...PAL.day.key }, fill: { ...PAL.day.fill } },
  dutchman: { time: 'fog', haze: .8, key: { ...PAL.fog.key }, fill: { ...PAL.fog.fill } },
  sea: { time: 'day', haze: .3, key: { ...PAL.day.key, az: 40, el: 30 }, fill: { ...PAL.day.fill } },
};
/** The camera the shadows are built with: horizon y, the picture's centre x, focal length (units), eye height (m). */
const CAM = { horizon: 108, cx: 100, f: 320, eye: 1.7 };

// ——— materials: base colour (lit by white light), highlight by the table of STYLE.md, reflex, translucency ———
// spec: w — width in radii, op — opacity, col — cold | warm | white | key, halo — a warm glow round a white core,
// stretch — how much longer than wide. reflex: sky (bluish, from the fill) | warm (from the deck). trans: light
// passing through against the light.
const MAT = {
  iron: { base: '#727c82', spec: { w: .15, op: .85, col: 'cold' }, reflex: 'sky', reflexK: .5 },
  brass: { base: '#dcae4a', spec: { w: .13, op: .95, col: 'white', halo: '#ffd27a' }, reflex: 'warm', reflexK: .6 },
  oak: { base: '#ad7740', spec: { w: .5, op: .2, col: 'warm' }, reflex: 'warm', reflexK: .36, grain: 1 },
  'pine-deck': { base: '#c4a273', spec: { w: .55, op: .16, col: 'warm' }, reflex: 'warm', reflexK: .32, grain: 1 },
  canvas: { base: '#e3d4ae', spec: null, reflex: 'warm', reflexK: .16, trans: .6 },
  linen: { base: '#f2ecdd', spec: null, reflex: 'sky', reflexK: .16, trans: .7 },
  leather: { base: '#8c5730', spec: { w: .45, op: .22, col: 'warm' }, reflex: 'warm', reflexK: .2 },
  skin: { base: '#e2ab82', spec: { w: .36, op: .3, col: 'warm' }, reflex: 'warm', reflexK: .42, trans: .14 },
  rope: { base: '#cba86e', spec: null, reflex: 'warm', reflexK: .22 },
  glass: { base: '#4f8a78', spec: { w: .1, op: 1, col: 'white' }, reflex: 'sky', reflexK: .3, glass: 1 },
  'water-wet': { base: '#476a76', spec: { w: .12, op: .95, col: 'key', stretch: 2.4 }, reflex: 'sky', reflexK: .55 },
  tar: { base: '#433d38', spec: { w: .4, op: .2, col: 'cold' }, reflex: 'sky', reflexK: .5, grain: 1 },
  'paint-red': { base: '#bb3a2a', spec: { w: .36, op: .2, col: 'warm' }, reflex: 'warm', reflexK: .3 },
  'paint-ochre': { base: '#d4a440', spec: { w: .36, op: .2, col: 'warm' }, reflex: 'warm', reflexK: .3 },
  bone: { base: '#e8dfc4', spec: { w: .3, op: .3, col: 'white' }, reflex: 'warm', reflexK: .3, trans: .1 },
  coral: { base: '#da7260', spec: { w: .3, op: .14, col: 'warm' }, reflex: 'warm', reflexK: .3 },
};
const KINDS = Object.keys(MAT);
const NORMALS = { top: [0, 1, 0], bottom: [0, -1, 0], left: [-1, 0, 0], right: [1, 0, 0], front: [0, 0, 1], back: [0, 0, -1] };
const pw = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return pts[pts.length - 1][1]; };

/**
 * makeLight(light, cam?) — the scene's light scheme (docs/tasks/print-kit-review-art.md, item 8) with what follows
 * from it. light: { key: { type: 'sun' | 'moon' | 'point', az, el, x, y, h, color, power }, fill: { color, power },
 * rim: { az, color, power }, locals: [{ x, y, h, color, power, radius }], time: 'night' | 'day' | 'dusk' | 'fog',
 * haze }. az: 0 — the light comes from the depth at the viewer (back light), 90 — from the right, 180 — from behind
 * the viewer, 270 — from the left; el — height in degrees. cam: { horizon, cx, f, eye }.
 */
function makeLight(light = {}, cam = {}) {
  const time = PAL[light.time] ? light.time : 'day', P = PAL[time];
  const C = Object.assign({}, CAM, light.cam, cam);
  const key = Object.assign({}, P.key, light.key);
  if (light.key && light.key.type === 'point') { delete key.az; delete key.el; if (light.key.az != null) key.az = light.key.az; if (light.key.el != null) key.el = light.key.el; }
  const fill = Object.assign({}, P.fill, light.fill);
  const rim = light.rim ? Object.assign({ az: 300, color: '#bfe0ff', power: .5 }, light.rim) : null;
  const locals = (light.locals || []).map(l => Object.assign({ h: 1.8, color: '#ffb24a', power: .8, radius: 60 }, l));
  const point = key.type === 'point';
  if (point) { if (key.x == null) key.x = C.cx; if (key.y == null) key.y = C.horizon - 20; if (key.h == null) key.h = 2; if (key.radius == null) key.radius = 130; }
  else {
    const given = light.key || {};
    // the place in the picture and the direction describe the same source: one is found from the other
    if (given.x != null && given.az == null) key.az = (deg(Math.atan2(given.x - C.cx, C.f)) + 360) % 360;
    if (given.y != null && given.el == null) key.el = clamp(deg(Math.atan((C.horizon - given.y) * Math.cos(rad(key.az)) / C.f)), 3, 88);
    if (Math.cos(rad(key.az)) > .05) {
      if (key.x == null || given.x == null) key.x = C.cx + C.f * Math.tan(rad(key.az));
      if (key.y == null || given.y == null) key.y = C.horizon - C.f * Math.tan(rad(key.el)) / Math.cos(rad(key.az));
    }
  }
  const dirSun = () => { const a = rad(key.az), e = rad(key.el); return { dx: Math.sin(a) * Math.cos(e), dy: -Math.sin(e), dz: -Math.cos(a) * Math.cos(e), k: 1 }; };
  const fin = d => { const p = Math.hypot(d.dx, d.dy); d.p = p; d.ux = p > 1e-4 ? d.dx / p : 0; d.uy = p > 1e-4 ? d.dy / p : -1; return d; };
  /** The unit vector to the key light as seen from the picture point (x, y): dx, dy in the picture plane (y down),
   *  dz — the share towards the viewer; ux, uy — the same direction as a unit vector in the plane; k — how much of
   *  the light's power arrives (a point light fades with distance). */
  const at = (x, y) => {
    if (!point) return fin(dirSun());
    const vx = key.x - x, vy = key.y - y, d = Math.hypot(vx, vy), z = key.z != null ? key.z : .38, c = Math.sqrt(1 - z * z);
    return fin(d < 1e-3 ? { dx: 0, dy: 0, dz: 1, k: 1 } : { dx: vx / d * c, dy: vy / d * c, dz: z, k: 1 / (1 + Math.pow(d / key.radius, 2)) });
  };
  const g = at(C.cx, 140);
  const keyRGB = rgb(key.color), fillRGB = rgb(fill.color);
  const shadowTint = light.shadowTint || (point ? mix('#3d2414', P.shadowTint, .3) : P.shadowTint);
  const st = rgb(shadowTint), lift = st.map(v => v * (.34 / Math.max(.05, luma(st))));
  // the colour a cast shadow multiplies its support by: the tint lifted to a middle tone, so the shadow darkens and
  // colours the support but never reaches black
  const mulL = point ? .27 : .38, shadowMul = hex(mixA(st.map(v => v * (mulL / Math.max(.05, luma(st)))), [mulL, mulL, mulL], .25));
  const bounce = { sky: fillRGB.map(v => v * (.6 + fill.power)), warm: mixA(keyRGB, rgb('#c8905c'), .55).map(v => v * (.35 + .5 * key.power)) };
  const amb = mixA([1, 1, 1], fillRGB, P.tint).map(v => v * fill.power);

  /** The colour of a material under intensity I: 1 — facing the light, 0 — the terminator, -1 — facing away. */
  const toneA = (kind, I, x = C.cx, y = 140, kk) => {
    const m = MAT[kind] || MAT.oak, base = rgb(m.base), k = kk != null ? kk : at(x, y).k;
    const lit = clamp((I + .1) / 1.1), through = I < 0 && m.trans ? -I * m.trans : 0;
    const a = pw(I, [[-1, 1], [-.5, .95], [-.1, .7], [.3, 1], [1, 1]]);
    const rf = I < -.35 ? (-I - .35) / .65 * (m.reflexK != null ? m.reflexK : .2) : 0, B = bounce[m.reflex || 'warm'];
    let c = base.map((b, i) => b * (keyRGB[i] * key.power * k * (lit + through) + amb[i] * a + B[i] * rf));
    c = satA(c.map(shoulder), (1 + .22 * (1 - lit)) * (point ? Math.max(P.sat, .92) : P.sat));
    const l = luma(c); if (l < P.floor) c = mixA(c, lift, clamp((P.floor - l) / Math.max(1e-3, luma(lift) - l)));
    return c;
  };
  const tone = (kind, I, x, y) => hex(toneA(kind, I, x, y));
  /** The named tones of a material at (x, y): lit, half, core (the terminator), shadow, reflex, outline, spec. */
  const ramp = (kind, x, y) => {
    const m = MAT[kind] || MAT.oak, core = toneA(kind, -.1, x, y);
    const sc = !m.spec ? null : m.spec.col === 'cold' ? mixA(keyRGB, [.86, .93, 1], .6) : m.spec.col === 'white' ? mixA(keyRGB, [1, 1, 1], .8) : m.spec.col === 'key' ? mixA(keyRGB, [1, 1, 1], .35) : mixA(mixA(rgb(m.base), keyRGB, .5), [1, .95, .85], .5);
    return { lit: tone(kind, 1, x, y), half: tone(kind, .45, x, y), core: hex(core), shadow: tone(kind, -.5, x, y), reflex: tone(kind, -1, x, y),
      outline: hex(mixA(core, rgb('#1c0f08'), .62)), spec: sc ? hex(sc) : null };
  };

  // ——— the ground plane: picture point <-> world (X to the right, Z into the depth, metres) ———
  const toWorld = (sx, sy, hz = C.horizon) => { const Z = C.f * C.eye / Math.max(.5, sy - hz); return [(sx - C.cx) * Z / C.f, Z]; };
  const toScreen = (X, Z, hz = C.horizon, height = 0) => { Z = Math.max(Z, .12); return [C.cx + C.f * X / Z, hz + C.f * (C.eye - height) / Z]; };
  const front = !point && Math.cos(rad(key.az)) > .05;
  // the azimuth the shadows are built with: a source drawn in the picture throws shadows from its drawn place
  const azS = point ? 0 : front && key.x != null ? Math.atan2(key.x - C.cx, C.f) : rad(key.az);
  /** The vanishing point of the shadows of a sun or moon on the horizon (item 9): under the source when it is in
   *  front of us (toward: the shadows run at the viewer and fan out), on the opposite side when it is behind
   *  (they run into the depth and converge); parallel: side light, the shadows lie along the horizon. */
  const vanish = (hz = C.horizon) => {
    if (point) return null;
    const c = Math.cos(azS);
    if (Math.abs(c) < .03) return { x: Math.sin(azS) > 0 ? -1e5 : 1e5, y: hz, parallel: true, toward: false };
    return { x: C.cx + C.f * Math.tan(azS), y: hz, parallel: false, toward: c > 0 };
  };
  /** Point light: the point of the support right under the lamp (key.gy, or from the lamp's height h in metres). */
  const keyBase = (hz = C.horizon) => {
    if (!point) return null;
    if (key.gy != null) return { x: key.x, y: key.gy };
    const q = key.h / C.eye, gy = Math.abs(1 - q) > .05 ? (key.y - hz * q) / (1 - q) : -1;
    return { x: key.x, y: gy > Math.max(hz + 4, key.y + 2) ? gy : key.y + 34 * key.h };
  };
  /** The shadow of a point: the foot stands at the picture point (sx, sy), the point is hPx picture units above it.
   *  Returns the world foot, the world shadow and the shadow's picture point. */
  const shadowOf = (sx, sy, hPx, hz = C.horizon) => {
    const [X, Z] = toWorld(sx, sy, hz), Hm = hPx * Z / C.f;
    let TX, TZ;
    if (point) {
      const b = keyBase(hz), [BX, BZ] = toWorld(b.x, b.y, hz), k = Math.min(3.5, Hm / Math.max(key.h - Hm, key.h * .22));
      TX = X + (X - BX) * k; TZ = Z + (Z - BZ) * k;
    } else {
      const len = Math.min(Hm / Math.tan(rad(Math.max(4, key.el))), Hm * 9);
      TX = X - Math.sin(azS) * len; TZ = Z - Math.cos(azS) * len;
    }
    TZ = Math.max(TZ, Z * .22);
    const [x, y] = toScreen(TX, TZ, hz);
    return { X, Z, TX, TZ, Hm, x, y };
  };
  /** Where the shadow of a pole hPx high standing at (x, y) ends: { x, y, angle (degrees, 0 = to the right,
   *  90 = down, at the viewer), len }. For the skeleton check and for hand-drawn shadows. */
  const shadowAt = (x, y, hPx, hz = C.horizon) => { const s = shadowOf(x, y, hPx, hz); return { x: s.x, y: s.y, angle: deg(Math.atan2(s.y - y, s.x - x)), len: Math.hypot(s.x - x, s.y - y) }; };
  /** How flat a circle lying on the support looks at the picture height y (ellipse ry / rx). */
  const ellipse = (y, hz = C.horizon) => clamp((y - hz) / C.f, .02, 1);

  return { time, haze: light.haze != null ? light.haze : .3, key, fill, rim, locals, cam: C, pal: P, point,
    dx: g.dx, dy: g.dy, dz: g.dz, ux: g.ux, uy: g.uy,
    keyColor: key.color, lightColor: key.color, fillColor: fill.color, shadowColor: hex(amb), reflexColor: hex(bounce.warm.map(v => clamp(v))), rimColor: rim ? rim.color : null, shadowTint, shadowMul,
    source: key.x != null && key.y != null ? { x: key.x, y: key.y } : null, front,
    at, tone, ramp, vanish, keyBase, shadowOf, shadowAt, ellipse, toWorld, toScreen };
}

// ——— gradients ———
const stopsOf = list => list.map(([o, c, a]) => `<stop offset="${f(clamp(o))}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('');
const linGrad = (id, x1, y1, x2, y2, list, extra = '') => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"${extra}>${stopsOf(list)}</linearGradient>`;
const radGrad = (id, cx, cy, r, list, fx, fy) => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${fx != null ? ` fx="${f(fx)}" fy="${f(fy)}"` : ''}>${stopsOf(list)}</radialGradient>`;
const SS = [-1, -.93, -.8, -.6, -.35, -.1, .15, .4, .62, .82, .94, 1];

// the gradient across a cylinder: I(s) = s * (L . N) + sqrt(1 - s^2) * dz, s = -1..1 across the width
function cylGrad(id, kind, L, x1, y1, x2, y2, r) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1, ax = (x2 - x1) / len, ay = (y2 - y1) / len, nx = -ay, ny = ax, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const d = L.at(mx, my), LN = d.dx * nx + d.dy * ny;
  const I = s => s * LN + Math.sqrt(1 - s * s) * d.dz;
  return { defs: linGrad(id, mx - nx * r, my - ny * r, mx + nx * r, my + ny * r, SS.map(s => [(s + 1) / 2, L.tone(kind, I(s), mx, my)])), d, LN, ax, ay, nx, ny, mx, my, len };
}
// the gradient of a sphere: the terminator is the circle through the points where the great circle of shadow
// crosses the outline; a focal gradient puts the brightest point where the light looks at the sphere
function sphGrad(id, kind, L, x, y, r) {
  const d = L.at(x, y), p = d.p, dz = d.dz;
  const I = t => t * p + Math.sqrt(Math.max(0, 1 - t * t)) * dz;
  const T = (kindI) => L.tone(kind, kindI, x, y);
  if (dz > -.05) {
    const g = Math.max(dz, .14), q = p * p / (2 * g), rho = q + g, s0 = (g + p) / (1 + p), c = p + (q - p) / s0, R = rho / s0;
    const list = [0, .1, .22, .36, .5, .62, .74, .84, .92, 1].map(s => [s, T(I(p - s * (1 + p)))]);
    return { defs: radGrad(id, x + d.ux * c * r, y + d.uy * c * r, R * r, list, x + d.ux * p * r * .97, y + d.uy * p * r * .97), d, back: false };
  }
  // back light: the dark side looks at us, a lit crescent on the light's side
  const g = Math.min(dz, -.14), q = p * p / (2 * g), R = 1 - q;
  const list = [0, .2, .4, .55, .68, .78, .86, .92, .97, 1].map(s => { const t = Math.max(-1, q + s * R); return [s, T(I(t) + (t > 0 ? .3 * Math.pow(t, 8) : 0))]; });
  return { defs: radGrad(id, x + d.ux * q * r, y + d.uy * q * r, R * r, list), d, back: true };
}
const normalOf = n => { const v = Array.isArray(n) ? n : NORMALS[n] || NORMALS.front, l = Math.hypot(v[0], v[1], v[2]) || 1; return v.map(c => c / l); };
// the gradient of a flat face: its tone by the normal, a little lighter towards the light; a face in shadow
// lightens towards the support (the light bounced off it)
function planeGrad(id, kind, L, pts, n) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const d = L.at(cx, cy), v = normalOf(n), I = v[0] * d.dx - v[1] * d.dy + v[2] * d.dz;
  let ux = d.ux, uy = d.uy; if (I < 0) { ux = 0; uy = -1; }
  const ext = Math.max(...pts.map(p => Math.abs((p[0] - cx) * ux + (p[1] - cy) * uy))) || 1;
  const a = I >= 0 ? L.tone(kind, Math.min(1, I + .14), cx, cy) : L.tone(kind, Math.max(-.32, I * .6), cx, cy);
  const b = I >= 0 ? L.tone(kind, I - .14, cx, cy) : L.tone(kind, -.95, cx, cy);
  return { defs: linGrad(id, cx + ux * ext, cy + uy * ext, cx - ux * ext, cy - uy * ext, [[0, a], [1, b]]), I, d, cx, cy };
}
/**
 * mat(kind, L, { form: 'cyl' | 'sphere' | 'plane' | 'fold', x1, y1, x2, y2, r, u, n }) -> { defs, fill, ramp }.
 * cyl: the axis (x1, y1) - (x2, y2) and the radius r. sphere: the centre (x1, y1) and r. plane: the opposite
 * corners (x1, y1), (x2, y2) of the face and its normal n ('top' | 'front' | 'left' | 'right' | 'back' | [x, y, z],
 * x to the right, y up, z at the viewer). fold: folds of cloth running along (x1, y1) - (x2, y2), r — half the
 * width of one fold (the gradient repeats across). Put `defs` anywhere in the scene, use `fill` as fill or stroke.
 */
function mat(kind, L, o = {}) {
  const u = o.u || '', form = o.form || 'plane', id = nid('m', u);
  const x1 = o.x1 || 0, y1 = o.y1 || 0, x2 = o.x2 != null ? o.x2 : x1, y2 = o.y2 != null ? o.y2 : y1 + 10, r = o.r || 5;
  let defs;
  if (form === 'cyl') defs = cylGrad(id, kind, L, x1, y1, x2, y2, r).defs;
  else if (form === 'sphere') defs = sphGrad(id, kind, L, x1, y1, r).defs;
  else if (form === 'fold') {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / len, ny = (x2 - x1) / len, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = L.at(mx, my), LN = d.dx * nx + d.dy * ny;
    const list = Array.from({ length: 9 }, (_, i) => { const t = i / 8, a = Math.sin(t * 2 * Math.PI) * .62, I = LN * a + d.dz * Math.sqrt(1 - a * a) - .16 * (1 - Math.cos(t * 2 * Math.PI)) * (d.dz >= 0 ? 1 : -1); return [t, L.tone(kind, I, mx, my)]; });
    defs = linGrad(id, mx - nx * r, my - ny * r, mx + nx * r, my + ny * r, list, ' spreadMethod="repeat"');
  } else defs = planeGrad(id, kind, L, [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], o.n || 'front').defs;
  return { defs, fill: `url(#${id})`, id, ramp: L.ramp(kind, (x1 + x2) / 2, (y1 + y2) / 2) };
}

// ——— light of the lamps of the scene on a form: a warm side facing each lamp inside its radius ———
function localsOver(u, L, cx, cy, r, shape) {
  let out = '';
  for (const loc of L.locals) {
    const vx = loc.x - cx, vy = loc.y - cy, d = Math.hypot(vx, vy), reach = loc.radius * 1.15; if (d > reach || d < 1e-3) continue;
    const k = loc.power * Math.pow(1 - d / reach, 1.5), id = nid('ll', u), ux = vx / d, uy = vy / d;
    out += linGrad(id, cx + ux * r, cy + uy * r, cx - ux * r * .5, cy - uy * r * .5, [[0, loc.color, clamp(k * .85)], [.5, loc.color, clamp(k * .3)], [1, loc.color, 0]]) + shape(`url(#${id})`);
  }
  return out;
}
const quarter = (c, v, w, t0) => { // a quarter of the ellipse c + v cos t + w sin t from t0 as a cubic Bézier
  const K = .5523, t1 = t0 + Math.PI / 2, P = t => [c[0] + v[0] * Math.cos(t) + w[0] * Math.sin(t), c[1] + v[1] * Math.cos(t) + w[1] * Math.sin(t)], D = t => [-v[0] * Math.sin(t) + w[0] * Math.cos(t), -v[1] * Math.sin(t) + w[1] * Math.cos(t)];
  const p0 = P(t0), p3 = P(t1), d0 = D(t0), d1 = D(t1);
  return `C${f(p0[0] + K * d0[0])} ${f(p0[1] + K * d0[1])} ${f(p3[0] - K * d1[0])} ${f(p3[1] - K * d1[1])} ${f(p3[0])} ${f(p3[1])}`;
};
const hash = (...a) => Math.abs(Math.round(a.reduce((s, v, i) => s + v * (i * 37 + 13), 7))) % 9973;

/**
 * shadeCyl(u, x1, y1, x2, y2, r, L, kind, opts) — a shaded cylinder from (x1, y1) to (x2, y2): a barrel of a gun,
 * a mast, an arm, a cask. opts: r1, r2 — radii at the ends (taper); bulge — the belly of a cask (0.12);
 * ell — how flat the round ends look (0 — seen from the side, flat cuts; 0.3 — seen from above; 1 — round caps);
 * face: 0 | 1 | 2 — which end shows its face (1 — the start, 2 — the end); outline: false or a width;
 * spec: false — no highlight; grain: false — no wood fibre; seed.
 */
function shadeCyl(u, x1, y1, x2, y2, r, L, kind, o = {}) {
  const m = MAT[kind] || MAT.oak, r1 = o.r1 != null ? o.r1 : r, r2 = o.r2 != null ? o.r2 : r, bulge = o.bulge || 0, k = o.cap === 'round' ? 1 : o.ell || 0;
  const rm = Math.max(r1, r2) * (1 + bulge), gid = nid('c', u), cid = nid('cc', u);
  const G = cylGrad(gid, kind, L, x1, y1, x2, y2, rm), { ax, ay, nx, ny, mx, my, d, LN, len } = G, rp = L.ramp(kind, mx, my);
  const S = [x1, y1], E = [x2, y2], vS = [nx * r1, ny * r1], wS = [-ax * r1 * k, -ay * r1 * k], vE = [nx * r2, ny * r2], wE = [ax * r2 * k, ay * r2 * k];
  const side = (from, to, sg) => { if (!bulge) return `L${f(to[0])} ${f(to[1])}`; const rb = (r1 + r2) / 2 * (1 + bulge), c = 2 * rb - (r1 + r2) / 2; return `Q${f(mx + sg * nx * c)} ${f(my + sg * ny * c)} ${f(to[0])} ${f(to[1])}`; };
  const pS1 = [S[0] + vS[0], S[1] + vS[1]], pS2 = [S[0] - vS[0], S[1] - vS[1]], pE1 = [E[0] + vE[0], E[1] + vE[1]], pE2 = [E[0] - vE[0], E[1] - vE[1]];
  const body = `M${f(pS1[0])} ${f(pS1[1])}${quarter(S, vS, wS, 0)}${quarter(S, vS, wS, Math.PI / 2)}${side(pS2, pE2, -1)}${quarter(E, [-vE[0], -vE[1]], wE, 0)}${quarter(E, [-vE[0], -vE[1]], wE, Math.PI / 2)}${side(pE1, pS1, 1)}Z`;
  const ow = o.outline === false ? 0 : typeof o.outline === 'number' ? o.outline : clamp(rm * .07, .4, .8);
  let defs = G.defs + `<clipPath id="${cid}"><path d="${body}"/></clipPath>`, inner = '';
  // wood fibre along the axis (vector strokes inside the form)
  if (m.grain && o.grain !== false && rm >= 2.5) {
    const R = rng(o.seed != null ? o.seed : hash(x1, y1, x2, y2)), n = Math.round(clamp(rm * .7, 3, 9));
    for (let i = 0; i < n; i++) { const s = (R() * 2 - 1) * .9, t0 = R() * .5, t1 = t0 + .25 + R() * .5, wob = (R() - .5) * rm * .12;
      const P = t => [x1 + (x2 - x1) * t + nx * s * lerp(r1, r2, t) * (1 + bulge * 4 * t * (1 - t)), y1 + (y2 - y1) * t + ny * s * lerp(r1, r2, t) * (1 + bulge * 4 * t * (1 - t))];
      const a = P(t0), b = P(Math.min(1, t1)), c = P((t0 + Math.min(1, t1)) / 2);
      inner += `<path d="M${f(a[0])} ${f(a[1])}Q${f(c[0] + nx * wob)} ${f(c[1] + ny * wob)} ${f(b[0])} ${f(b[1])}" stroke="${i % 3 ? rp.core : rp.lit}" stroke-width="${f(clamp(rm * .035, .25, .5))}" fill="none" opacity="${f(i % 3 ? .3 : .22)}"/>`; }
  }
  // the highlight: a stripe along the axis on the light's side
  if (m.spec && o.spec !== false && rp.spec) {
    const raw = LN / Math.hypot(LN, 1 + d.dz) || 0, sh = Math.abs(LN) < .1 ? raw : Math.sign(LN) * clamp(Math.abs(raw), .3, d.dz >= 0 ? .45 : .9);
    const P = t => { const rr = lerp(r1, r2, t) * (1 + bulge * 4 * t * (1 - t)); return [x1 + (x2 - x1) * t + nx * sh * rr, y1 + (y2 - y1) * t + ny * sh * rr]; };
    const a = P(.06), b = P(.94), c = P(.5), c2 = [2 * c[0] - (a[0] + b[0]) / 2, 2 * c[1] - (a[1] + b[1]) / 2], hid = nid('ch', u);
    const dd = `M${f(a[0])} ${f(a[1])}Q${f(c2[0])} ${f(c2[1])} ${f(b[0])} ${f(b[1])}`, w = m.spec.w * rm * 2 * (d.dz < 0 ? .6 : 1), op = m.spec.op * clamp(.35 + L.key.power * d.k * .75);
    defs += linGrad(hid, a[0], a[1], b[0], b[1], [[0, rp.spec, 0], [.18, rp.spec, 1], [.6, rp.spec, .8], [1, rp.spec, 0]]);
    if (m.spec.halo) inner += `<path d="${dd}" stroke="${m.spec.halo}" stroke-width="${f(w * 3)}" fill="none" opacity="${f(op * .3)}" stroke-linecap="round"/>`;
    inner += `<path d="${dd}" stroke="url(#${hid})" stroke-width="${f(w * 2.1)}" fill="none" opacity="${f(op * .32)}" stroke-linecap="round"/><path d="${dd}" stroke="url(#${hid})" stroke-width="${f(w)}" fill="none" opacity="${f(op)}" stroke-linecap="round"/>`;
  }
  // rim light: a thin line along the edge on the rim's side
  if (L.rim && o.rim !== false) { const sg = Math.sign(Math.sin(rad(L.rim.az)) * nx) || 1, P = t => [x1 + (x2 - x1) * t + nx * sg * lerp(r1, r2, t) * .93 * (1 + bulge * 4 * t * (1 - t)), y1 + (y2 - y1) * t + ny * sg * lerp(r1, r2, t) * .93 * (1 + bulge * 4 * t * (1 - t))], a = P(.04), b = P(.96), c = P(.5);
    inner += `<path d="M${f(a[0])} ${f(a[1])}Q${f(2 * c[0] - (a[0] + b[0]) / 2)} ${f(2 * c[1] - (a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}" stroke="${L.rim.color}" stroke-width="${f(clamp(rm * .09, .25, .9))}" fill="none" opacity="${f(clamp(L.rim.power * .55))}"/>`; }
  const loc = localsOver(u, L, mx, my, Math.max(rm, len / 2), fl => `<path d="${body}" fill="${fl}" style="mix-blend-mode:screen"/>`);
  let out = `<defs>${defs}</defs><g style="isolation:isolate"><path d="${body}" fill="url(#${gid})"${m.glass ? ' fill-opacity=".72"' : ''}/><g clip-path="url(#${cid})">${inner}</g>${loc}</g>`;
  if (ow) out += `<path d="${body}" fill="none" stroke="${rp.outline}" stroke-width="${f(ow)}" stroke-linejoin="round"/>`;
  // the visible end face
  if (o.face && k > 0) {
    const c = o.face === 1 ? S : E, v = o.face === 1 ? vS : vE, w = o.face === 1 ? wS : wE, sg = o.face === 1 ? -1 : 1, rr = o.face === 1 ? r1 : r2, kk = Math.min(k, .98), cs = Math.sqrt(1 - kk * kk);
    const fd = L.at(c[0], c[1]), I = sg * (fd.dx * ax + fd.dy * ay) * cs + fd.dz * kk, fid = nid('cf', u);
    const fp = `M${f(c[0] + v[0])} ${f(c[1] + v[1])}${[0, 1, 2, 3].map(i => quarter(c, v, w, i * Math.PI / 2)).join('')}Z`;
    out += `<defs>${linGrad(fid, c[0] + fd.ux * rr, c[1] + fd.uy * rr * kk, c[0] - fd.ux * rr, c[1] - fd.uy * rr * kk, [[0, L.tone(kind, Math.min(1, I + .12), c[0], c[1])], [1, L.tone(kind, I - .16, c[0], c[1])]])}</defs><path d="${fp}" fill="url(#${fid})"${ow ? ` stroke="${rp.outline}" stroke-width="${f(ow)}"` : ''}/>`;
  }
  return out;
}

/**
 * shadeSphere(u, x, y, r, L, kind, opts) — a shaded ball: a round shot, a head, a knob. The highlight is moved from
 * the centre to the light by 0.3-0.4 r (with back light it slides onto the lit crescent). opts: outline: false or a
 * width; spec: false.
 */
function shadeSphere(u, x, y, r, L, kind, o = {}) {
  const m = MAT[kind] || MAT.oak, gid = nid('s', u), cid = nid('sc', u), G = sphGrad(gid, kind, L, x, y, r), d = G.d, rp = L.ramp(kind, x, y);
  const ow = o.outline === false ? 0 : typeof o.outline === 'number' ? o.outline : clamp(r * .07, .4, .8);
  let defs = G.defs + `<clipPath id="${cid}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/></clipPath>`, inner = '';
  if (G.back) { // the reflex: light from the support on the edge away from the light
    const rid = nid('sr', u); defs += radGrad(rid, x + d.ux * r * .4, y + d.uy * r * .4 - r * .2, r * 1.5, [[0, rp.reflex, 0], [.66, rp.reflex, 0], [.9, rp.reflex, .75], [1, rp.reflex, .9]]);
    inner += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${rid})"/>`;
  }
  if (m.glass) { // light gathered by the glass on the side away from the source; a darker edge
    const cidg = nid('sg', u); defs += radGrad(cidg, x - d.ux * r * .5, y - d.uy * r * .5, r * .55, [[0, rp.lit, .75], [.6, rp.lit, .25], [1, rp.lit, 0]]);
    inner += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${cidg})"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .94)}" fill="none" stroke="${rp.core}" stroke-width="${f(r * .12)}" opacity=".45"/>`;
  }
  if (m.spec && o.spec !== false && rp.spec) {
    const raw = d.p / Math.sqrt(2 + 2 * d.dz + 1e-6), off = d.dz >= 0 ? clamp(raw, .3, .4) : clamp(raw, .4, .78);
    const hx = x + d.ux * off * r, hy = y + d.uy * off * r, w = m.spec.w * r * 1.25, st = m.spec.stretch || 1.35, op = m.spec.op * clamp(.35 + L.key.power * d.k * .75), a = deg(Math.atan2(d.uy, d.ux)) + 90;
    const sq = d.dz < 0 ? .5 : 1, hid = nid('sh', u);
    defs += `<radialGradient id="${hid}"><stop offset="0" stop-color="${rp.spec}"/><stop offset=".55" stop-color="${rp.spec}" stop-opacity=".7"/><stop offset="1" stop-color="${rp.spec}" stop-opacity="0"/></radialGradient>`;
    const el = (k, opq, fill) => `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(w * st * k)}" ry="${f(w * k * sq)}" transform="rotate(${f(m.spec.stretch ? 90 : a)} ${f(hx)} ${f(hy)})" fill="${fill}" opacity="${f(opq)}"/>`;
    if (m.spec.halo) inner += el(2.6, op * .4, m.spec.halo);
    inner += el(1.7, op * .45, `url(#${hid})`) + el(1, op, `url(#${hid})`);
    if (m.glass) inner += `<path d="M${f(hx - w * 1.6)} ${f(hy + w * 2.2)}q${f(w * 1.4)} ${f(-w * .6)} ${f(w * 2.6)} ${f(-w * .2)}" stroke="${rp.spec}" stroke-width="${f(w * .5)}" fill="none" opacity=".5" stroke-linecap="round"/>`;
  }
  if (L.rim && o.rim !== false) { const rid = nid('sm', u), sg = Math.sign(Math.sin(rad(L.rim.az))) || 1;
    defs += linGrad(rid, x + sg * r, y - r * .3, x - sg * r * .2, y + r * .3, [[0, L.rim.color, clamp(L.rim.power * .9)], [.35, L.rim.color, clamp(L.rim.power * .3)], [.6, L.rim.color, 0]]);
    inner += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .95)}" fill="none" stroke="url(#${rid})" stroke-width="${f(clamp(r * .12, .3, 1.4))}"/>`; }
  const loc = localsOver(u, L, x, y, r, fl => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fl}" style="mix-blend-mode:screen"/>`);
  return `<defs>${defs}</defs><g style="isolation:isolate"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${gid})"${m.glass ? ' fill-opacity=".7"' : ''}/><g clip-path="url(#${cid})">${inner}</g>${loc}</g>`
    + (ow ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${rp.outline}" stroke-width="${f(ow)}"/>` : '');
}

/**
 * shadeBox(u, faces, L, kind, opts) — flat faces with normals: faces = [{ pts: [[x, y], ...], n: 'top' | 'front' |
 * 'left' | 'right' | 'back' | 'bottom' | [x, y, z], kind?, grain?: [dx, dy] }] in the order they are painted (far
 * first). Each face takes its tone from its normal (the top, the side to the light, the side in shadow); edges
 * turned to the light get a light worn line; a thin outline. opts: outline: false or a width; seed.
 */
function shadeBox(u, faces, L, kind, o = {}) {
  const ow = o.outline === false ? 0 : typeof o.outline === 'number' ? o.outline : .55;
  let defs = '', out = '';
  faces.forEach((fc, fi) => {
    const kd = fc.kind || kind, m = MAT[kd] || MAT.oak, id = nid('b', u), G = planeGrad(id, kd, L, fc.pts, fc.n), rp = L.ramp(kd, G.cx, G.cy);
    const dd = 'M' + fc.pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
    defs += G.defs;
    let inner = '';
    if (m.grain && fc.grain !== false && o.grain !== false) { // fibre along the face (default: along its first edge)
      const g0 = fc.grain || [fc.pts[1][0] - fc.pts[0][0], fc.pts[1][1] - fc.pts[0][1]], gl = Math.hypot(g0[0], g0[1]) || 1, gx = g0[0] / gl, gy = g0[1] / gl;
      const ext = Math.max(...fc.pts.map(p => Math.hypot(p[0] - G.cx, p[1] - G.cy))), R = rng((o.seed != null ? o.seed : hash(G.cx, G.cy)) + fi * 17), n = Math.round(clamp(ext * .35, 3, 12));
      for (let i = 0; i < n; i++) { const s = (R() * 2 - 1) * ext, t0 = (R() * 2 - 1) * ext, l = ext * (.3 + R() * .7), x0 = G.cx - gy * s + gx * t0, y0 = G.cy + gx * s + gy * t0, wob = (R() - .5) * 1.2;
        inner += `<path d="M${f(x0)} ${f(y0)}q${f(gx * l / 2 - gy * wob)} ${f(gy * l / 2 + gx * wob)} ${f(gx * l)} ${f(gy * l)}" stroke="${i % 3 ? rp.core : rp.lit}" stroke-width=".35" fill="none" opacity="${i % 3 ? .28 : .2}"/>`; }
    }
    if (G.I > .2) fc.pts.forEach((p, i) => { // worn light edges on the light's side
      const q = fc.pts[(i + 1) % fc.pts.length], ex = q[0] - p[0], ey = q[1] - p[1], el = Math.hypot(ex, ey) || 1; let ox = ey / el, oy = -ex / el;
      if ((p[0] + q[0]) / 2 * ox + (p[1] + q[1]) / 2 * oy < G.cx * ox + G.cy * oy) { ox = -ox; oy = -oy; }
      if (ox * G.d.ux + oy * G.d.uy > .35) inner += `<path d="M${f(p[0] - ox * .6)} ${f(p[1] - oy * .6)}L${f(q[0] - ox * .6)} ${f(q[1] - oy * .6)}" stroke="${mix(rp.lit, '#ffffff', .35)}" stroke-width=".7" opacity="${f(m.spec ? .55 : .3)}" stroke-linecap="round"/>`; });
    const cid = nid('bc', u); defs += `<clipPath id="${cid}"><path d="${dd}"/></clipPath>`;
    const loc = localsOver(u, L, G.cx, G.cy, Math.max(...fc.pts.map(p => Math.hypot(p[0] - G.cx, p[1] - G.cy))), fl => `<path d="${dd}" fill="${fl}" style="mix-blend-mode:screen"/>`);
    out += `<g style="isolation:isolate"><path d="${dd}" fill="url(#${id})"/><g clip-path="url(#${cid})">${inner}</g>${loc}</g>` + (ow ? `<path d="${dd}" fill="none" stroke="${rp.outline}" stroke-width="${f(ow)}" stroke-linejoin="round"/>` : '');
  });
  return `<defs>${defs}</defs>` + out;
}
/**
 * boxFaces(x, y, w, h, ox, oy) — the three visible faces of a crate for shadeBox: the front face is the rectangle
 * with the bottom left corner (x, y), w wide and h high; the back is shifted by (ox, -oy): ox > 0 shows the right
 * side, ox < 0 the left one. Returns [top, side, front].
 */
function boxFaces(x, y, w, h, ox = 8, oy = 5) {
  const t = y - h, sx = ox >= 0 ? x + w : x;
  return [
    { pts: [[x, t], [x + w, t], [x + w + ox, t - oy], [x + ox, t - oy]], n: 'top' },
    { pts: [[sx, t], [sx + ox, t - oy], [sx + ox, y - oy], [sx, y]], n: ox >= 0 ? 'right' : 'left', grain: [0, 1] },
    { pts: [[x, t], [x + w, t], [x + w, y], [x, y]], n: 'front' },
  ];
}

const hull = pts => { // convex hull (monotone chain)
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const poly = pts => pts.length ? 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z' : '';

/**
 * castShadow(u, L, { x, y, w, h, horizon, onto, wallY, opacity, d }) — the shadow an upright thing throws on its
 * support. (x, y) — the middle of its foot in the picture, w — the width of the foot, h — its height (picture
 * units), horizon — the horizon y. Sun and moon: the shadow runs along the line through the shadows' vanishing
 * point (L.vanish); its length is h / tan(el), shortened by perspective. Point light: it runs from the point under
 * the lamp through the foot, the shadows of neighbours fan out. Sharp at the foot, softer to the end; the colour is
 * L.shadowTint, never black. onto: 'deck' (default) | 'water' (paler). wallY: the y of the foot of a wall behind:
 * the shadow climbs it. d: depth of the foot relative to its width (1 — round).
 */
function castShadow(u, L, o) {
  const hz = o.horizon != null ? o.horizon : L.cam.horizon, { x, y, w, h } = o;
  if (y <= hz + 1 || !(h > 0)) return '';
  const C = L.cam, s0 = L.shadowOf(x, y, h, hz), Rm = w / 2 * s0.Z / C.f, dep = o.d != null ? o.d : 1, N = 18;
  const vX = s0.TX - s0.X, vZ = s0.TZ - s0.Z, Zw = o.wallY != null && o.wallY > hz + 1 ? C.f * C.eye / (o.wallY - hz) : Infinity;
  const base = [], mid = [], tip = [], wall = [];
  let PB = null; if (L.point) { const b = L.keyBase(hz), [BX, BZ] = L.toWorld(b.x, b.y, hz); PB = [BX, BZ, Math.min(3.5, s0.Hm / Math.max(L.key.h - s0.Hm, L.key.h * .22))]; }
  for (let i = 0; i < N; i++) {
    const a = i / N * 2 * Math.PI, X = s0.X + Rm * Math.cos(a), Z = s0.Z + Rm * dep * Math.sin(a) * .98;
    let TX = X + vX, TZ = Z + vZ, t = 1;
    if (PB) { TX = X + (X - PB[0]) * PB[2]; TZ = Z + (Z - PB[1]) * PB[2]; } // point light: every point is pushed away from the lamp's foot
    TZ = Math.max(TZ, s0.Z * .2);
    if (TZ > Zw && Z < Zw) { t = (Zw - Z) / (TZ - Z); TX = X + (TX - X) * t; TZ = Zw; wall.push(L.toScreen(TX, Zw, hz), L.toScreen(TX, Zw, hz, s0.Hm * (1 - t))); }
    base.push(L.toScreen(X, Z, hz)); mid.push(L.toScreen(X + (TX - X) * .55, Z + (TZ - Z) * .55, hz)); tip.push(L.toScreen(TX, TZ, hz));
  }
  const all = hull(base.concat(tip)), near = hull(base.concat(mid)), len = Math.hypot(s0.x - x, s0.y - y);
  const dist = L.point ? clamp(Math.hypot(L.key.x - x, L.key.y - y) / L.key.radius) : 0;
  const a0 = (o.opacity != null ? o.opacity : L.point ? .8 - .3 * dist : .78) * (o.onto === 'water' ? .5 : 1);
  const sdA = clamp(len * .01, .2, .6), sdB = clamp(len * (L.point ? .06 : .03), .6, 4.5), tint = L.shadowMul;
  const xs = all.concat(wall).map(p => p[0]), ys = all.concat(wall).map(p => p[1]), pad = sdB * 4 + 2;
  const bx = Math.max(-80, Math.min(...xs) - pad), by = Math.max(-80, Math.min(...ys) - pad), bw = Math.min(360, Math.max(...xs) + pad) - bx, bh = Math.min(440, Math.max(...ys) + pad) - by;
  const fa = nid('ta', u), fb = nid('tb', u), ga = nid('tg', u), gb = nid('th', u);
  const box = `filterUnits="userSpaceOnUse" x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}"`;
  const ex = s0.x, ey = s0.y, far = L.point ? .3 : .55;
  let out = `<defs><filter id="${fa}" ${box}><feGaussianBlur stdDeviation="${f(sdA)}"/></filter><filter id="${fb}" ${box}><feGaussianBlur stdDeviation="${f(sdB)}"/></filter>`
    + linGrad(ga, x, y, lerp(x, ex, .6), lerp(y, ey, .6), [[0, tint, a0 * .6], [.5, tint, a0 * .4], [1, tint, 0]])
    + linGrad(gb, x, y, ex, ey, [[0, tint, a0 * .8], [.5, tint, a0 * .72], [1, tint, a0 * far]]) + `</defs>`
    + `<g style="mix-blend-mode:multiply"><path d="${poly(all)}" fill="url(#${gb})" filter="url(#${fb})"/><path d="${poly(near)}" fill="url(#${ga})" filter="url(#${fa})"/>`;
  if (wall.length >= 4) out += `<path d="${poly(hull(wall))}" fill="${tint}" opacity="${f(a0 * .55)}" filter="url(#${fb})"/>`;
  return out + '</g>';
}

/** contactShadow(u, x, y, w, L, opts) — the dark seat of a thing on its support: a soft flat ellipse under the foot
 *  (x, y) of width w, pushed a little away from the light. opts: ry, opacity. */
function contactShadow(u, x, y, w, L, o = {}) {
  const id = nid('cs', u), d = L.at(x, y), rx = w * .56, ry = o.ry != null ? o.ry : Math.max(.7, rx * Math.max(.16, L.ellipse(y)) * .8), c = scale(L.shadowTint, .62), op = o.opacity != null ? o.opacity : .8;
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${f(op)}"/><stop offset=".55" stop-color="${c}" stop-opacity="${f(op * .6)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${f(x - d.ux * w * .07)}" cy="${f(y + ry * .1)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${id})"/>`;
}

/** localGlow(u, loc, opts) — the pool of a local light (a lantern, a candle, a fire, a flash): a warm circle that
 *  fades with distance, laid over what is already drawn. loc: { x, y, color, power, radius } (an entry of
 *  light.locals or the point key). opts: squash — ry / rx (a pool on the deck is flat), core: false — no hot heart. */
function localGlow(u, loc, o = {}) {
  const id = nid('lg', u), r = loc.radius != null ? loc.radius : 60, c = loc.color || '#ffb24a', p = loc.power != null ? loc.power : .8, k = o.squash || 1;
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${f(clamp(p * .85))}"/><stop offset=".14" stop-color="${c}" stop-opacity="${f(clamp(p * .55))}"/><stop offset=".38" stop-color="${c}" stop-opacity="${f(p * .24)}"/><stop offset=".7" stop-color="${c}" stop-opacity="${f(p * .07)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`
    + `<ellipse cx="${f(loc.x)}" cy="${f(loc.y)}" rx="${f(r)}" ry="${f(r * k)}" fill="url(#${id})" style="mix-blend-mode:screen"/>`
    + (o.core === false ? '' : `<ellipse cx="${f(loc.x)}" cy="${f(loc.y)}" rx="${f(r * .05)}" ry="${f(r * .05 * k)}" fill="${mix(c, '#ffffff', .7)}" opacity="${f(clamp(p))}"/>`);
}

module.exports = { makeLight, mat, shadeCyl, shadeSphere, shadeBox, boxFaces, castShadow, contactShadow, localGlow,
  LIGHTS, PAL, MAT, KINDS, CAM, rng, mix, scale, nid, f, clamp, lerp, rgb, hex, linGrad, radGrad };
