// kit/interior.cjs — the rooms of the print scenes in 2.5D: a captain's cabin, a gun deck, a hold and a tavern. The
// floor, the walls, the ceiling and its beams are built in metres and projected to one vanishing point (the eye
// level), so the room, its furniture and the kit's things stand in one space: nearer — bigger, farther — smaller and
// darker. The room takes its light from the scene's L (a lantern, a fire, a hatch or the windows): every face is
// toned by its real normal to the source, light from the windows lies on the floor as patches of the panes.
// Pure functions that return SVG strings; no Node API. API: kit/README.md («Интерьеры — interior.cjs»).
'use strict';
const LT = require('./light.cjs');
const ENV = require('./env.cjs');
const PR = require('./props.cjs');
const { nid, f, clamp, lerp, rng, mix, rgb, linGrad, MAT, shadeCyl, castShadow, contactShadow, localGlow, makeLight, PAL } = LT;

// materials of the rooms (added to MAT, like the ship materials; existing kinds are never replaced)
const ROOM_MAT = {
  'oak-old': { base: '#80573a', spec: { w: .5, op: .14, col: 'warm' }, reflex: 'warm', reflexK: .3, grain: 1 },
  'pine-old': { base: '#a4835a', spec: { w: .5, op: .12, col: 'warm' }, reflex: 'warm', reflexK: .3, grain: 1 },
  stone: { base: '#968c7c', spec: { w: .4, op: .08, col: 'cold' }, reflex: 'warm', reflexK: .3 },
  plaster: { base: '#d6c9ac', spec: null, reflex: 'warm', reflexK: .25 },
  soot: { base: '#3a3430', spec: null, reflex: 'warm', reflexK: .2 },
  bilge: { base: '#33402f', spec: { w: .12, op: .9, col: 'key', stretch: 2.4 }, reflex: 'sky', reflexK: .4 },
};
for (const k of Object.keys(ROOM_MAT)) if (!MAT[k]) MAT[k] = ROOM_MAT[k];

/** The four rooms: the eye (vp, f, eye in metres), the box in metres (xl, xr — the side walls, h — the ceiling,
 *  d — the back wall), the materials, the default mood and the light outside (day — through the windows by day;
 *  night — the moon's patches when the room is lit by its lamps). */
const ROOMS = {
  cabin: { vp: [112, 92], f: 190, eye: 1.5, room: { xl: -2.1, xr: 1.9, h: 2.2, d: 5 }, floor: 'oak', wall: 'oak-old', ceil: 'oak-old', mood: 'lamp', seed: 11,
    day: { az: 14, el: 26 }, night: { az: 18, el: 34, color: '#a8bce8', power: .32 } },
  gundeck: { vp: [100, 100], f: 150, eye: 1.2, room: { xl: -3.6, xr: 3.6, h: 1.75, d: 15 }, floor: 'pine-deck', wall: 'pine-old', ceil: 'oak-old', mood: 'lamp', seed: 23,
    day: { az: 64, el: 22 }, night: { az: 66, el: 30, color: '#9fb4e0', power: .22 } },
  hold: { vp: [100, 104], f: 190, eye: 1.45, room: { xl: -2.25, xr: 2.25, h: 2.15, d: 7.4 }, floor: 'pine-old', wall: 'oak-old', ceil: 'oak-old', mood: 'window', seed: 37,
    day: { az: 160, el: 74 }, night: { az: 160, el: 74, color: '#a8bce8', power: .3 } },
  tavern: { vp: [96, 98], f: 190, eye: 1.55, room: { xl: -2.6, xr: 2.6, h: 2.6, d: 6 }, floor: 'oak', wall: 'stone', ceil: 'plaster', mood: 'lamp', seed: 53,
    day: { az: 10, el: 30 }, night: { az: 12, el: 30, color: '#a8bce8', power: .26 } },
};
const ROOM_KINDS = Object.keys(ROOMS);

const rad = d => d * Math.PI / 180;
const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const lum = h => { const c = rgb(h); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const hull = pts => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const blur = (id, sd) => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${f(sd)}"/></filter>`;

/**
 * interior.geom(opts) — the room's space: { P(X, Y, Z) -> [x, y], at(X, Z, Y) -> { x, y, upm }, upm(Z) (picture units
 * per metre at the depth Z), floorY(Z, Y), zAt(y, Y), XL, XR, H, Zb, back: { x0, x1, top, bot }, cam }. X — metres to
 * the right of the eye, Y — up from the floor, Z — into the depth. opts: kind, vp, f, eye, room: { xl, xr, h, d },
 * or back: { x0, x1, top, bot } — the back wall in the picture (the room's depth and size follow from it).
 */
function geomOf(o = {}) {
  const kind = ROOMS[o.kind] ? o.kind : 'cabin', D = ROOMS[kind];
  const vp = o.vp || D.vp, vx = vp[0], vy = vp[1], F = o.f || D.f, e = o.eye || D.eye, rm = Object.assign({}, D.room, o.room);
  let XL = rm.xl, XR = rm.xr, H = rm.h, Zb = rm.d;
  if (o.back) { const b = o.back; Zb = F * e / Math.max(4, b.bot - vy); XL = (b.x0 - vx) * Zb / F; XR = (b.x1 - vx) * Zb / F; H = e + (vy - b.top) * Zb / F; }
  const P = (X, Y, Z) => { Z = Math.max(Z, .05); return [vx + F * X / Z, vy + F * (e - Y) / Z]; };
  return { kind, vx, vy, f: F, eye: e, XL, XR, H, Zb, Zn: .35, P, cam: { horizon: vy, cx: vx, f: F, eye: e },
    back: { x0: P(XL, 0, Zb)[0], x1: P(XR, 0, Zb)[0], top: P(0, H, Zb)[1], bot: P(0, 0, Zb)[1] },
    upm: Z => F / Math.max(Z, .05), floorY: (Z, Y = 0) => P(0, Y, Z)[1], zAt: (y, Y = 0) => F * (e - Y) / Math.max(.5, y - vy),
    at: (X, Z, Y = 0) => { const p = P(X, Y, Z); return { x: p[0], y: p[1], upm: F / Math.max(Z, .05) }; } };
}

// ——— the lamps of a room: where they hang or burn, which is the key light in a mood ———
function lampsOf(S, mood) {
  const out = [], k = S.kind, Zb = S.Zb;
  const lantern = (X, Y, Z, lit, key, beamY) => { const upm = S.upm(Z), s = upm * .42 / 28, p = S.P(X, Y, Z), fy = Y + 7.5 * s / upm, fp = S.P(X, fy, Z), top = Y + 29 * s / upm;
    out.push({ type: 'lantern', X, Y, Z, s, x: p[0], y: p[1], lit, key, hang: beamY != null ? Math.max(1, (beamY - top) * upm / s) : 0,
      light: { x: fp[0] + .1 * s, y: fp[1], h: fy, gy: S.floorY(Z), color: '#ffc070', power: key ? 1 : .7, radius: key ? 150 : 90 } }); };
  const candle = (X, Y, Z, lit, key) => { const upm = S.upm(Z), s = upm * .2 / 16, p = S.P(X, Y, Z), fy = Y + 16.4 * s / upm, fp = S.P(X, fy, Z);
    out.push({ type: 'candle', X, Y, Z, s, x: p[0], y: p[1], lit, key, light: { x: fp[0], y: fp[1], h: fy, gy: S.floorY(Z), color: '#ffb860', power: key ? .9 : .6, radius: key ? 110 : 60 } }); };
  if (k === 'cabin') lantern(-.55, 1.5, 2.9, mood === 'lamp', mood === 'lamp', S.H - .16);
  if (k === 'gundeck') { const by = S.H - .2; lantern(-.55, .98, 3.4, mood === 'lamp', mood === 'lamp', by); lantern(.5, .98, 7.4, mood === 'lamp', false, by); lantern(-.4, .98, 10.4, mood === 'lamp', false, by); }
  if (k === 'hold') {
    const hx = -.5, hz = 4.1, p = S.P(hx, S.H - .05, hz);
    out.push({ type: 'hatch', X: hx, Y: S.H, Z: hz, lit: mood !== 'lamp', key: mood !== 'lamp', light: { x: p[0], y: p[1], h: S.H - .05, gy: S.floorY(hz), color: mood === 'lamp' ? '#a8bce8' : '#eef2f2', power: 1, radius: 125 } });
    lantern(.55, 1.12, 4.6, mood === 'lamp', mood === 'lamp', S.H - .2);
  }
  if (k === 'tavern') {
    const fp = S.P(-1.45, .4, Zb - .15), fire = mood === 'lamp';
    out.push({ type: 'fire', X: -1.45, Y: .4, Z: Zb - .15, lit: fire, key: fire, light: { x: fp[0], y: fp[1], h: .4, gy: S.floorY(Zb - .15), color: '#ff9a48', power: 1, radius: 150 } });
    candle(1.05, 1.06, Zb - 1.32, true, !fire); candle(2.0, 1.06, Zb - 1.36, true, false);
  }
  return out;
}

/**
 * interior.scheme(kind, { mood, vp, f, eye, room, back }) -> { light, cam, vp, mood, lamps, geom } — the light of the
 * room for makeLight: mood 'lamp' — night, the room's lantern (the gun deck's lanterns, the tavern's hearth fire) is
 * the key, other lamps are locals; 'window' — day through the windows (the cabin's stern lights, the gun deck's
 * ports; the hold: daylight down the hatch), the lamps are out; the tavern also takes 'candles' (the hearth out).
 * Use: const s = K.interior.scheme('cabin'), L = K.makeLight(s.light, s.cam).
 */
function scheme(kind = 'cabin', o = {}) {
  const S = geomOf(Object.assign({}, o, { kind })), D = ROOMS[S.kind], mood = o.mood || D.mood, lamps = lampsOf(S, mood);
  const key = lamps.find(l => l.key && l.lit), locals = lamps.filter(l => l.lit && !l.key).map(l => Object.assign({}, l.light));
  let light;
  if (key) {
    light = { time: 'night', haze: .3, key: Object.assign({ type: 'point' }, key.light), fill: { color: '#2e3c5a', power: .34 }, locals };
    if (S.kind === 'cabin' || S.kind === 'tavern') light.rim = { az: 0, color: '#a8c0e8', power: .26 };
    if (S.kind === 'hold' && mood !== 'lamp') Object.assign(light, { time: 'day', fill: { color: '#4a5666', power: .3 } });
  } else light = { time: 'day', haze: .35, key: { type: 'sun', az: D.day.az, el: D.day.el, color: '#fff0d0', power: .95 }, fill: { color: '#6a7c98', power: .36 }, locals };
  return { light, cam: S.cam, vp: [S.vx, S.vy], mood, lamps, geom: S };
}

// ——— drawing in the room's space ———
function ctx(u, L, o) {
  const S = geomOf(o), D = ROOMS[S.kind], mood = o.mood || D.mood, off = new Set(o.off || []), items = o.items || {};
  const c = { u, L, S, D, mood, near: o.detail !== 'mid', R: rng(o.seed != null ? o.seed : D.seed), seed: o.seed != null ? o.seed : D.seed, lamps: lampsOf(S, mood), o };
  c.has = (n, prop = true) => !(prop && o.props === false) && !off.has(n) && items[n] !== false;
  const key = c.lamps.find(l => l.key && l.lit);
  // the room's source for the faces: the key lamp (world), or a glow at the windows by day (bounce light)
  c.src = key ? { X: key.X, Y: key.light.h, Z: key.Z } : null;
  if (S.kind === 'hold' && key && key.type === 'hatch') c.src = { X: key.X, Y: S.H - .1, Z: key.Z };
  if (S.kind === 'tavern' && key && key.type === 'fire') c.src = { X: key.X, Y: .45, Z: S.Zb - .3 };
  c.glowW = !key ? (S.kind === 'gundeck' ? { X: S.XR, Y: .9, Z: S.Zb * .55 } : { X: (S.XL + S.XR) / 2 + .4, Y: 1.4, Z: S.Zb }) : null;
  // the light from outside through the windows: the key sun by day, the moon (weak) at night
  const wo = o.win === false ? null : o.win || (!L.point && L.key && L.key.az != null ? { az: L.key.az, el: L.key.el, color: L.keyColor, power: L.key.power } : D.night);
  c.win = wo ? Object.assign({ color: '#fff0d0', power: .9 }, wo) : null;
  c.outT = o.outside || (L.point ? (S.kind === 'hold' && mood !== 'lamp' ? 'day' : 'night') : L.time);
  c.dark = mix(L.shadowTint, '#120e0c', .5);
  c.toneAt = (kind, p, n, bias = 0) => {
    const [x, y] = S.P(p[0], p[1], p[2]);
    let I = -.3, far = 0;
    if (c.src) { const v = [c.src.X - p[0], c.src.Y - p[1], c.src.Z - p[2]], d = Math.hypot(v[0], v[1], v[2]) || 1; I = (v[0] * n[0] + v[1] * n[1] + v[2] * n[2]) / d * .95; far = clamp((d - 1.2) / (S.Zb * .95)); }
    else if (c.glowW) { const g = c.glowW, d = Math.hypot(p[0] - g.X, p[1] - g.Y, p[2] - g.Z); I = lerp(.32, -.45, clamp(d / 4.5)); far = clamp((d - 1) / (S.Zb * 1.1)); }
    const t = L.tone(kind, clamp(I + bias, -1, 1), x, y);
    return mix(t, c.dark, clamp(far * .55 + clamp(p[2] / (S.Zb * 1.6)) * .14));
  };
  c.things = [];
  return c;
}

/** A flat face of the room (world polygon W, normal n into the room): a linear gradient between its lightest and
 *  darkest corner. */
function wface(c, kind, W, n, o = {}) {
  const { u, S } = c, pts = W.map(p => S.P(p[0], p[1], p[2])), T = W.map(p => c.toneAt(kind, p, n, o.bias || 0));
  let a = 0, b = 0; T.forEach((t, i) => { if (lum(t) > lum(T[a])) a = i; if (lum(t) < lum(T[b])) b = i; });
  const id = nid('if', u), same = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]) < .5;
  const fill = same ? T[a] : `url(#${id})`;
  return (same ? '' : `<defs>${linGrad(id, pts[a][0], pts[a][1], pts[b][0], pts[b][1], [[0, T[a]], [1, T[b]]])}</defs>`)
    + `<path d="${poly(pts)}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${f(o.sw || .35)}" stroke-linejoin="round"` : ''}${o.op != null ? ` opacity="${f(o.op)}"` : ''}/>`;
}
// a picture point back on an axis-aligned plane of the room
const unproject = (S, ax, v, x, y) => {
  const F = S.f, e = S.eye;
  if (ax === 0) { const Z = F * v / ((x - S.vx) || 1e-3); return [v, e - (y - S.vy) * Z / F, Z]; }
  if (ax === 1) { const Z = F * (e - v) / ((y - S.vy) || 1e-3); return [(x - S.vx) * Z / F, v, Z]; }
  return [(x - S.vx) * v / F, e - (y - S.vy) * v / F, v];
};
/** A big plane of the room (axis-aligned world rectangle W, normal n): a radial gradient around the point nearest
 *  to the source, toned outwards (falloff, the turn of the face away from the source, the dark of the depth). */
function wplane(c, kind, W, n, o = {}) {
  const { u, S } = c, pts = W.map(p => S.P(p[0], p[1], p[2])), ax = n.findIndex(v => Math.abs(v) > .5);
  const s0 = c.src || c.glowW || { X: 0, Y: S.H / 2, Z: S.Zb / 2 };
  const mn = [0, 1, 2].map(i => Math.min(...W.map(p => p[i]))), mx = [0, 1, 2].map(i => Math.max(...W.map(p => p[i])));
  const foot = [s0.X, s0.Y, s0.Z].map((v, i) => clamp(v, mn[i], mx[i])); foot[2] = Math.max(foot[2], S.Zn + .3);
  const fc = S.P(foot[0], foot[1], foot[2]);
  let far = 0, Rr = 1; pts.forEach((p, i) => { const d = Math.hypot(p[0] - fc[0], p[1] - fc[1]); if (d > Rr) { Rr = d; far = i; } });
  // sample along the picture line to the farthest corner; keep the samples that land on the plane's front
  const list = [];
  for (const t of [0, .04, .1, .18, .3, .45, .65, .85, 1]) {
    const x = lerp(fc[0], pts[far][0], t), y = lerp(fc[1], pts[far][1], t);
    let w = unproject(S, ax, W[0][ax], x, y); if (!(w[2] > .05) || t === 1) w = t === 1 ? W[far] : foot;
    list.push([t, c.toneAt(kind, w, n, o.bias || 0)]);
  }
  const id = nid('ip', u);
  return `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(fc[0])}" cy="${f(fc[1])}" r="${f(Rr)}">${list.map(([t, col]) => `<stop offset="${f(t)}" stop-color="${col}"/>`).join('')}</radialGradient></defs>`
    + `<path d="${poly(pts)}" fill="url(#${id})"/>`;
}
/** A line in the room from A to B (world), w metres wide: tapers with the depth. */
function wl(c, A, B, w, col, op = 1) {
  const S = c.S, a = S.P(A[0], A[1], A[2]), b = S.P(B[0], B[1], B[2]), wa = clamp(w * S.upm(A[2]) / 2, .08, 4), wb = clamp(w * S.upm(B[2]) / 2, .08, 4);
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return `<path d="${poly([[a[0] + nx * wa, a[1] + ny * wa], [b[0] + nx * wb, b[1] + ny * wb], [b[0] - nx * wb, b[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]])}" fill="${col}" opacity="${f(op)}"/>`;
}
/** A box of the room (furniture, beams, boards) from its world extents: the faces the eye can see, each toned by
 *  its normal; a light worn line on the front's top edge; wood grain along the front (near). */
function wbox(c, kind, X0, X1, Y0, Y1, Z0, Z1, o = {}) {
  const S = c.S, e = S.eye, k = o.kind || kind, st = { stroke: o.stroke || mix(c.toneAt(k, [(X0 + X1) / 2, Y0, Z0], [0, 0, -1]), '#120a06', .65), sw: o.sw || .3 };
  let s = '';
  if (Y1 < e && o.top !== false) s += wface(c, o.topKind || k, [[X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1]], [0, 1, 0], st);
  if (Y0 > e) s += wface(c, k, [[X0, Y0, Z0], [X1, Y0, Z0], [X1, Y0, Z1], [X0, Y0, Z1]], [0, -1, 0], st);
  if (X0 > 0) s += wface(c, k, [[X0, Y0, Z0], [X0, Y1, Z0], [X0, Y1, Z1], [X0, Y0, Z1]], [-1, 0, 0], st);
  if (X1 < 0) s += wface(c, k, [[X1, Y0, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X1, Y0, Z1]], [1, 0, 0], st);
  if (o.front !== false) s += wface(c, k, [[X0, Y0, Z0], [X1, Y0, Z0], [X1, Y1, Z0], [X0, Y1, Z0]], [0, 0, -1], st);
  const tTop = c.toneAt(k, [(X0 + X1) / 2, Y1, Z0], [0, 1, 0]);
  if (o.edge !== false && Y1 < e) s += wl(c, [X0, Y1, Z0], [X1, Y1, Z0], .012, mix(tTop, '#fff4e0', .3), .55);
  if (c.near && o.grain !== false && MAT[k] && MAT[k].grain) {
    const R = rng(Math.round((X0 * 7 + Y0 * 13 + Z0 * 17) * 100) & 0xffff), n = Math.min(6, Math.round((Y1 - Y0) * 30) + 1), lt = mix(c.toneAt(k, [(X0 + X1) / 2, (Y0 + Y1) / 2, Z0], [0, 0, -1]), '#120a06', .4);
    for (let i = 0; i < n; i++) { const y = lerp(Y0, Y1, (i + .3 + R() * .4) / n), a = lerp(X0, X1, R() * .3), b = lerp(X0, X1, .6 + R() * .4); s += wl(c, [a, y, Z0], [b, y + (R() - .5) * .01, Z0], .006, lt, .35); }
  }
  return s;
}
/** The shadow a flat thing (world points) drops on the plane Y from the room's key: the lamp (fan), or the sun. */
function dropShadow(c, W, Y = 0, o = {}) {
  const { u, S, L } = c; let pts;
  if (c.src && L.point) { const s = c.src; pts = W.filter(p => p[1] < s.Y - .05).map(p => { const k = Math.min(4, (s.Y - Y) / (s.Y - p[1])); return [s.X + (p[0] - s.X) * k, Y, s.Z + (p[2] - s.Z) * k]; }); }
  else if (c.win) { const a = rad(c.win.az), e = rad(c.win.el); pts = W.map(p => { const t = (p[1] - Y) / Math.sin(e); return [p[0] - Math.sin(a) * Math.cos(e) * t, Y, p[2] - Math.cos(a) * Math.cos(e) * t]; }); }
  if (!pts || pts.length < 3) return '';
  pts = pts.concat(W.filter(p => Math.abs(p[1] - Y) < .02)).map(p => [p[0], Y, Math.max(p[2], S.Zn + .1)]);
  const id = nid('is', u), sd = o.blur || 1.6, op = o.opacity != null ? o.opacity : .72;
  return `<defs>${blur(id, sd)}</defs><path d="${poly(hull(pts.map(p => S.P(p[0], p[1], p[2]))))}" fill="${L.shadowMul}" opacity="${f(op)}" filter="url(#${id})" style="mix-blend-mode:multiply"/>`;
}
// the ray of the outside light into the room
const rayOf = win => { const a = rad(win.az), e = rad(win.el); return [-Math.sin(a) * Math.cos(e), -Math.sin(e), -Math.cos(a) * Math.cos(e)]; };
const hitY = (d, p, Y) => { const t = (p[1] - Y) / -d[1]; return [p[0] + d[0] * t, Y, p[2] + d[2] * t]; };
/** Panes of an opening for the light patches: rect (world corners along u and v) split into nu x nv panes. */
function panes(A, U, V, nu, nv, bar) {
  const out = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = (i + bar) / nu, b = (i + 1 - bar) / nu, c0 = (j + bar) / nv, d0 = (j + 1 - bar) / nv, q = (s, t) => [A[0] + U[0] * s + V[0] * t, A[1] + U[1] * s + V[1] * t, A[2] + U[2] * s + V[2] * t];
    out.push([q(a, c0), q(b, c0), q(b, d0), q(a, d0)]);
  }
  return out;
}
/** Patches of the outside light through the panes on the plane Y (the floor, a table top), and the shafts in the
 *  air. opens: [{ A, U, V, nu, nv }] — the openings. clip: a picture polygon the patches stay in. */
function winLight(c, opens, Y, o = {}) {
  const { u, S, L } = c; if (!c.win || !(c.win.power > 0)) return '';
  const d = rayOf(c.win); if (d[1] >= -.05) return '';
  const col = mix(c.win.color, '#ffffff', .2), pw = c.win.power, ok = p => p[2] > S.Zn + .2 && p[2] < S.Zb + .01 && p[0] > S.XL - .01 && p[0] < S.XR + .01;
  let pat = '', sh = '';
  for (const op of opens) {
    const ps = panes(op.A, op.U, op.V, op.nu || 1, op.nv || 1, op.bar != null ? op.bar : .08);
    for (const q of ps) { const h = q.map(p => hitY(d, p, Y)); if (h.every(ok)) pat += `<path d="${poly(h.map(p => S.P(p[0], p[1], p[2])))}"/>`; }
    if (o.shafts !== false) { const cs = [op.A, [op.A[0] + op.U[0], op.A[1] + op.U[1], op.A[2] + op.U[2]], [op.A[0] + op.U[0] + op.V[0], op.A[1] + op.U[1] + op.V[1], op.A[2] + op.U[2] + op.V[2]], [op.A[0] + op.V[0], op.A[1] + op.V[1], op.A[2] + op.V[2]]];
      const hs = cs.map(p => hitY(d, p, Y)).map(p => [p[0], p[1], Math.max(p[2], S.Zn + .2)]), pc = cs.concat(hs).map(p => S.P(p[0], p[1], p[2]));
      const m0 = S.P(...cs[2]), m1 = S.P(...hs[0]), gid = nid('iw', u);
      sh += `<defs>${linGrad(gid, m0[0], m0[1], m1[0], m1[1], [[0, col, clamp(.1 * pw * (.5 + L.haze))], [1, col, clamp(.025 * pw)]])}</defs><path d="${poly(hull(pc))}" fill="url(#${gid})"/>`; }
  }
  const id = nid('iq', u), id2 = nid('ir', u), clip = o.clip ? `<clipPath id="${id2}"><path d="${poly(o.clip)}"/></clipPath>` : '';
  const a = clamp((o.k != null ? o.k : .42) * pw);
  return { patches: pat ? `<defs>${blur(id, o.blur || .7)}${clip}</defs><g${clip ? ` clip-path="url(#${id2})"` : ''}><g fill="${col}" opacity="${f(a)}" filter="url(#${id})">${pat}</g></g>` : '', shafts: sh ? `<defs>${blur(id + 's', 2.2)}</defs><g filter="url(#${id}s)">${sh}</g>` : '' };
}
/** The world outside an opening: sky and sea at the eye's horizon, in the outside light (moon or sun). */
function outside(c, clipD, top, bottom, o = {}) {
  const { u, S, L } = c, day = c.outT === 'day' || c.outT === 'dusk', w = c.win || c.D.night;
  const Lo = o.Lo || makeLight({ time: c.outT, haze: .3, key: { type: day ? 'sun' : 'moon', az: w.az, el: w.el, color: day ? '#fff2d8' : '#e8eeff', power: day ? 1 : .8 } }, S.cam);
  const cid = nid('io', u);
  let s = `<defs><clipPath id="${cid}"><path d="${clipD}"/></clipPath></defs><g clip-path="url(#${cid})">`
    + ENV.sky(u, Lo, { horizon: S.vy, stars: day ? false : 30, top: top - 2, seed: c.seed + 3 });
  if (o.moon) s += ENV.sunMoon(u, makeLight({ time: c.outT, key: { type: 'moon', x: o.moon[0], y: o.moon[1], color: '#eef2ff', power: .8 } }, S.cam), { r: o.moonR || 3.6 });
  if (bottom > S.vy) s += ENV.water(u, Lo, { horizon: S.vy, bottom: bottom + 2, swell: .35, seed: c.seed + 5, glitter: o.glitter });
  return s + '</g>';
}
/** A window (or port) in a wall: the outside, the frame and the muntins, the reveal of the wall's thickness. side:
 *  'back' (in the back wall, x from X0 to X1, y from Y0 to Y1) | 'right' | 'left' (in a side wall, z from Z0 to Z1). */
function opening(c, kind, o) {
  const S = c.S, e = S.eye, t = o.depth || .15;
  let W, Wi, faces = [];
  if (o.side === 'back') { const { X0, X1, Y0, Y1 } = o, Z = S.Zb, Zi = Z + t;
    W = [[X0, Y0, Z], [X1, Y0, Z], [X1, Y1, Z], [X0, Y1, Z]]; Wi = [[X0, Y0, Zi], [X1, Y0, Zi], [X1, Y1, Zi], [X0, Y1, Zi]];
    if (X0 < 0) faces.push([[[X0, Y0, Z], [X0, Y1, Z], [X0, Y1, Zi], [X0, Y0, Zi]], [1, 0, 0]]);
    if (X1 > 0) faces.push([[[X1, Y0, Z], [X1, Y1, Z], [X1, Y1, Zi], [X1, Y0, Zi]], [-1, 0, 0]]);
    if (Y0 < e) faces.push([[[X0, Y0, Z], [X1, Y0, Z], [X1, Y0, Zi], [X0, Y0, Zi]], [0, 1, 0]]);
    if (Y1 > e) faces.push([[[X0, Y1, Z], [X1, Y1, Z], [X1, Y1, Zi], [X0, Y1, Zi]], [0, -1, 0]]);
  } else { const sg = o.side === 'right' ? 1 : -1, X = sg > 0 ? S.XR : S.XL, Xi = X + sg * t, { Z0, Z1, Y0, Y1 } = o;
    W = [[X, Y0, Z0], [X, Y0, Z1], [X, Y1, Z1], [X, Y1, Z0]]; Wi = [[Xi, Y0, Z0], [Xi, Y0, Z1], [Xi, Y1, Z1], [Xi, Y1, Z0]];
    faces.push([[[X, Y0, Z1], [Xi, Y0, Z1], [Xi, Y1, Z1], [X, Y1, Z1]], [0, 0, -1]]);
    if (Y0 < e) faces.push([[[X, Y0, Z0], [X, Y0, Z1], [Xi, Y0, Z1], [Xi, Y0, Z0]], [0, 1, 0]]);
    if (Y1 > e) faces.push([[[X, Y1, Z0], [X, Y1, Z1], [Xi, Y1, Z1], [Xi, Y1, Z0]], [0, -1, 0]]);
  }
  const pts = W.map(p => S.P(p[0], p[1], p[2])), ys = pts.map(p => p[1]);
  let s = outside(c, poly(pts), Math.min(...ys), Math.max(...ys), o);
  // the frame and the muntins in the glass plane (at the far face of the wall)
  if (o.nu || o.nv) { const fr = mix(c.toneAt(kind, Wi[0], [0, 0, -1]), '#140c06', .35), A = Wi[0], U = Wi[1].map((v, i) => v - A[i]), V = Wi[3].map((v, i) => v - A[i]);
    for (let i = 1; i < (o.nu || 1); i++) { const a = A.map((v, k) => v + U[k] * i / o.nu); s += wl(c, a, a.map((v, k) => v + V[k]), o.bar || .018, fr, .95); }
    for (let j = 1; j < (o.nv || 1); j++) { const a = A.map((v, k) => v + V[k] * j / o.nv); s += wl(c, a, a.map((v, k) => v + U[k]), o.bar || .018, fr, .95); }
    if (c.L.point && o.sheen !== false) { const lp = c.L.key, gid = nid('ih', c.u), q = Wi.map(p => S.P(p[0], p[1], p[2])); // the warm room mirrored faintly in the glass
      s += `<defs>${linGrad(gid, q[0][0], q[0][1], q[2][0], q[2][1], [[0, lp.color, .1], [.5, lp.color, .03], [1, lp.color, .08]])}</defs><path d="${poly(q)}" fill="url(#${gid})"/>`; }
  }
  for (const [F, n] of faces) s += wface(c, o.reveal || kind, F, n, { stroke: mix(c.toneAt(kind, F[0], n), '#120a06', .6), sw: .25 });
  return s;
}
/** The dark round the edges and under the glass (the lower part of the card): calm and dark, never black. */
function gloom(u, L, o = {}) {
  const y0 = o.y0 != null ? o.y0 : 150, k = o.k != null ? o.k : .72, c = mix(L.shadowTint, '#1e1914', .62), id = nid('ig', u), id2 = nid('iv', u);
  return `<defs>${linGrad(id, 0, y0, 0, 280, [[0, c, 0], [.4, c, k * .5], [1, c, k]])}<radialGradient id="${id2}" gradientUnits="userSpaceOnUse" cx="100" cy="120" r="175"><stop offset=".55" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}" stop-opacity="${f(k * .6)}"/></radialGradient></defs>`
    + `<rect x="-2" y="${f(y0)}" width="204" height="${f(282 - y0)}" fill="url(#${id})"/><rect x="-2" y="-2" width="204" height="284" fill="url(#${id2})"/>`;
}

// ——— the shell: floor, ceiling, side walls, back wall ———
function shell(c, o = {}) {
  const { u, L, S, D, near, R } = c, { XL, XR, H, Zb, Zn } = S, fk = o.floor || D.floor, wk = o.wall || D.wall, ck = o.ceil || D.ceil;
  const zb = S.zAt(280), plank = .2 * S.upm(zb);
  let s = `<rect x="-2" y="-2" width="204" height="284" fill="${c.dark}"/>`;
  // the floor: planks to the vanishing point (deck), toned down at the back, the lamp's pool on it
  s += ENV.deck(u, L, { horizon: S.vy, top: S.back.bot, bottom: 282, vx: S.vx, kind: fk, plank, seed: c.seed + 1 });
  { const id = nid('id', u); s += `<defs>${linGrad(id, 0, S.back.bot, 0, S.back.bot + 60, [[0, c.dark, .6], [1, c.dark, 0]])}</defs><rect x="-2" y="${f(S.back.bot)}" width="204" height="60" fill="url(#${id})"/>`; }
  // the ceiling
  s += wplane(c, ck, [[XL, H, Zn], [XR, H, Zn], [XR, H, Zb], [XL, H, Zb]], [0, -1, 0]);
  if (o.ceilPlanks !== false) { const sc = mix(c.toneAt(ck, [0, H, Zb], [0, -1, 0]), '#0c0705', .55); for (let X = XL + .18 + R() * .1; X < XR; X += .2 + R() * .07) s += wl(c, [X, H, Zn + .2], [X, H, Zb], .012, sc, .7); }
  // the side walls
  for (const sg of [-1, 1]) { const X = sg < 0 ? XL : XR;
    s += wplane(c, wk, [[X, 0, Zn], [X, H, Zn], [X, H, Zb], [X, 0, Zb]], [-sg, 0, 0]);
    if (o.strakes !== false) { const sc = mix(c.toneAt(wk, [X, H / 2, Zb], [-sg, 0, 0]), '#0c0705', .55);
      for (let Y = .17 + R() * .06; Y < H - .05; Y += (o.strake || .19) + R() * .04) s += wl(c, [X, Y, Zn + .2], [X, Y, Zb], .012, sc, .65);
      if (near) for (let i = 0; i < 26; i++) { const Z = lerp(Zn + .5, Zb, Math.pow(R(), .7)), Y = R() * H; s += wl(c, [X, Y, Z], [X, Y + .16, Z], .01, sc, .5); } }
  }
  // the back wall: boards upright
  s += wplane(c, wk, [[XL, 0, Zb], [XR, 0, Zb], [XR, H, Zb], [XL, H, Zb]], [0, 0, -1]);
  if (o.boards !== false) { const sc = mix(c.toneAt(wk, [0, H / 2, Zb], [0, 0, -1]), '#0c0705', .55); for (let X = XL + .2 + R() * .1; X < XR; X += .22 + R() * .06) s += wl(c, [X, 0, Zb], [X, H, Zb], .012, sc, .6); }
  // the corners: dark seams where the planes meet
  const cs = mix(c.dark, '#0a0605', .4);
  for (const X of [XL, XR]) { s += wl(c, [X, 0, Zb], [X, H, Zb], .03, cs, .7) + wl(c, [X, H, Zn], [X, H, Zb], .03, cs, .6) + wl(c, [X, 0, Zn], [X, 0, Zb], .03, cs, .7); }
  s += wl(c, [XL, H, Zb], [XR, H, Zb], .03, cs, .6) + wl(c, [XL, 0, Zb], [XR, 0, Zb], .035, cs, .8);
  return s;
}
/** The beams across the ceiling at the depths zs (bh — height, bd — width in metres); knees at the walls. */
function beams(c, zs, bh, bd, kind, o = {}) {
  const { S } = c; let s = '';
  for (const z of zs.slice().sort((a, b) => b - a)) {
    s += wbox(c, kind, S.XL, S.XR, S.H - bh, S.H, z, z + bd, { grain: c.near });
    if (o.knees !== false) for (const sg of [-1, 1]) { const X = sg < 0 ? S.XL : S.XR, k = .32;
      s += wface(c, kind, [[X, S.H - bh, z], [X + -sg * k, S.H - bh, z], [X, S.H - bh - k, z]], [0, 0, -1], { stroke: mix(c.dark, '#000', .3), sw: .25 }); }
  }
  return s;
}
// a kit thing at a world place: its picture point and scale (mPerUnit — metres per unit of the thing at s = 1)
const put = (c, X, Z, Y, mPerUnit) => { const a = c.S.at(X, Z, Y); return { x: a.x, y: a.y, s: a.upm * mPerUnit }; };
const shadowOf = (c, q, w, h, d, Y = 0) => (Y ? '' : castShadow(c.u, c.L, { x: q.x, y: q.y, w, h, horizon: c.S.vy, d }));

/** The lanterns, candles and fires of the room, with their glow. */
function lamps(c, types) {
  const { u, L } = c; let s = '', glow = '';
  for (const l of c.lamps) {
    if (types && !types.includes(l.type)) continue;
    if (l.type === 'lantern' && c.has('lamp')) { s += PR.lantern(u, L, { x: l.x, y: l.y, s: l.s, lit: l.lit, hang: l.hang || undefined, contact: false, seed: c.seed + 9 });
      if (l.lit) glow += localGlow(u, Object.assign({}, l.light, { radius: l.light.radius * .45, power: l.light.power * .5 })) + localGlow(u, Object.assign({}, l.light, { radius: l.light.radius * 1.1, power: .16 }), { core: false }); }
    if (l.type === 'candle' && c.has('candles')) { s += PR.candle(u, L, { x: l.x, y: l.y, s: l.s, lit: l.lit, seed: c.seed + 12 });
      if (l.lit) glow += localGlow(u, Object.assign({}, l.light, { radius: l.light.radius * .4, power: l.light.power * .55 })); }
  }
  return { s, glow };
}

// ——— the four rooms ———
function cabin(c) {
  const { u, L, S, has, R } = c, { XL, XR, H, Zb } = S;
  let s = shell(c, { strake: .26 });
  const WIN = { X0: -.95, X1: 1.75, Y0: .95, Y1: 1.95 }, n = 4, gap = .08, ww = (WIN.X1 - WIN.X0 - gap * (n - 1)) / n;
  const lights = []; for (let i = 0; i < n; i++) { const X0 = WIN.X0 + i * (ww + gap); lights.push({ X0, X1: X0 + ww }); }
  const opens = has('windows', false) ? lights.map(w => ({ A: [w.X0, WIN.Y1, Zb], U: [w.X1 - w.X0, 0, 0], V: [0, WIN.Y0 - WIN.Y1, 0], nu: 3, nv: 4, bar: .1 })) : [];
  const table = { X0: -.72, X1: .6, Z0: 2.5, Z1: 3.4, Y: .78 };
  const TL = has('table') ? winLight(c, opens, table.Y, { clip: [[table.X0, table.Y, table.Z0], [table.X1, table.Y, table.Z0], [table.X1, table.Y, table.Z1], [table.X0, table.Y, table.Z1]].map(p => S.P(...p)), shafts: false }) : '';
  const FL = winLight(c, opens, 0);
  s += FL ? FL.patches : '';
  // raised panels on the side walls, in their perspective
  if (has('panels', false)) for (const sg of [-1, 1]) { const X = sg < 0 ? XL : XR;
    for (const [Y0, Y1] of [[.2, .85], [1.05, 1.95]]) for (let Z = 1.2; Z < Zb - .3; Z += .9) {
      const W = [[X, Y0, Z + .08], [X, Y1, Z + .08], [X, Y1, Z + .78], [X, Y0, Z + .78]];
      s += wface(c, 'oak-old', W, [-sg, 0, 0], { bias: .08, stroke: mix(c.toneAt('oak-old', W[0], [-sg, 0, 0]), '#120a06', .6), sw: .3 }) + wl(c, W[1], W[2], .012, mix(c.toneAt('oak-old', W[1], [-sg, -.3, 0]), '#fff0d8', .2), .5); } }
  // the stern windows: four lights in the back wall, the night (or the day) outside
  if (has('windows', false)) {
    for (const w of lights) s += opening(c, 'oak-old', { side: 'back', X0: w.X0, X1: w.X1, Y0: WIN.Y0, Y1: WIN.Y1, depth: .16, nu: 3, nv: 4, bar: .016, glitter: S.P(1.3, 0, 30)[0] });
    s += wbox(c, 'oak-old', WIN.X0 - .06, WIN.X1 + .06, WIN.Y0 - .06, WIN.Y0, Zb - .07, Zb, { grain: false });                           // the sill
    s += wbox(c, 'oak-old', WIN.X0 - .08, WIN.X1 + .08, WIN.Y1, WIN.Y1 + .08, Zb - .05, Zb, { grain: false });                          // the head
  }
  // the locker bench under the windows, a red cushion on it
  if (has('bench')) { const B = { X0: -1, X1: XR, Z0: Zb - .5 };
    s += dropShadow(c, [[B.X0, .46, B.Z0], [B.X1, .46, B.Z0], [B.X1, .46, Zb], [B.X0, .46, Zb]], 0, { opacity: .5 });
    s += wbox(c, 'oak-old', B.X0, B.X1, 0, .44, B.Z0, Zb) + wbox(c, 'paint-red', B.X0 + .03, B.X1, .44, .53, B.Z0 + .02, Zb - .04, { grain: false, sw: .25 });
    for (let X = B.X0 + .45; X < B.X1 - .2; X += .62) s += wface(c, 'oak-old', [[X, .07, B.Z0], [X + .44, .07, B.Z0], [X + .44, .37, B.Z0], [X, .37, B.Z0]], [0, 0, -1], { bias: -.12, stroke: mix(c.dark, '#000', .2), sw: .3 }); }
  // the shelves left of the windows: two boards on brackets, a jug, mugs, bottles, a candle stick, an hourglass
  if (has('shelves')) { const X0 = XL + .06, X1 = -1.08, Zs = Zb - .24;
    for (const Y of [1.02, 1.48]) { s += wbox(c, 'oak-old', X0, X1, Y - .04, Y, Zs, Zb, { grain: false });
      for (const X of [X0 + .12, X1 - .12]) s += wface(c, 'oak-old', [[X, Y - .04, Zb - .02], [X, Y - .04, Zs + .04], [X, Y - .22, Zb - .02]], [1, 0, 0], { stroke: mix(c.dark, '#000', .3), sw: .2 }); }
    const Zi = Zb - .12, sh = [];
    sh.push(PR.mug(u, L, Object.assign(put(c, -1.88, Zi, 1.02, .15 / 11), { fill: 'dark', seed: c.seed + 21 })), PR.bottle(u, L, Object.assign(put(c, -1.6, Zi, 1.02, .3 / 20), { kind: 'rum', seed: c.seed + 22 })),
      PR.bottle(u, L, Object.assign(put(c, -1.4, Zi, 1.02, .28 / 20), { kind: 'empty', seed: c.seed + 23 })), PR.mug(u, L, Object.assign(put(c, -1.22, Zi, 1.02, .14 / 11), { seed: c.seed + 24 })),
      PR.hourglass(u, L, Object.assign(put(c, -1.82, Zi, 1.48, .22 / 16), { seed: c.seed + 25 })), PR.candle(u, L, Object.assign(put(c, -1.45, Zi, 1.48, .2 / 16), { lit: false, seed: c.seed + 26 })),
      PR.bottle(u, L, Object.assign(put(c, -1.22, Zi, 1.48, .3 / 20), { kind: 'rum', seed: c.seed + 27 })));
    s += sh.join(''); }
  // the beams
  if (has('beams', false)) s += beams(c, [1.9, 2.9, 3.9, Zb - .22], .16, .16, 'oak-old');
  // the chest by the bench (far), the table with the chart (near)
  if (has('chest')) { const q = put(c, 1.42, 4.4, 0, .85 / 30); s += shadowOf(c, q, 30 * q.s, 17 * q.s, .35) + PR.chest(u, L, Object.assign(q, { open: false, flip: q.x > S.vx, seed: c.seed + 31 })); }
  if (has('table')) { const T = table, Y = T.Y;
    s += dropShadow(c, [[T.X0, Y, T.Z0], [T.X1, Y, T.Z0], [T.X1, Y, T.Z1], [T.X0, Y, T.Z1]], 0, { opacity: .8, blur: 2.2 });
    for (const [X, Z] of [[T.X0 + .1, T.Z1 - .1], [T.X1 - .16, T.Z1 - .1]]) s += wbox(c, 'oak', X, X + .06, 0, Y - .1, Z, Z + .06, { grain: false });
    for (const [X, Z] of [[T.X0 + .1, T.Z0 + .06], [T.X1 - .16, T.Z0 + .06]]) s += wbox(c, 'oak', X, X + .07, 0, Y - .1, Z, Z + .07, { grain: false });
    s += wbox(c, 'oak', T.X0 + .06, T.X1 - .06, Y - .12, Y - .03, T.Z0 + .05, T.Z1 - .05) + wbox(c, 'oak', T.X0, T.X1, Y - .03, Y, T.Z0, T.Z1);
    s += TL ? TL.patches : '';
    if (has('chart')) { // the chart: a sheet in the table's plane, a coast in ink, rhumb lines from a rose; a rolled chart and dividers beside
      const C = [[-.5, Y + .002, 2.62], [.3, Y + .002, 2.6], [.36, Y + .002, 3.22], [-.44, Y + .002, 3.26]], cp = C.map(p => S.P(...p));
      const ink = '#3a2a1a', at = (a, b) => { const t = [lerp(C[0][0], C[1][0], a), lerp(C[0][2], C[1][2], a)], d = [lerp(C[3][0], C[2][0], a), lerp(C[3][2], C[2][2], a)]; return S.P(lerp(t[0], d[0], b), Y + .002, lerp(t[1], d[1], b)); };
      s += wface(c, 'canvas', C, [0, 1, 0], { stroke: mix(c.toneAt('canvas', C[0], [0, 1, 0]), '#2a1a0c', .5), sw: .25 });
      const R2 = rng(c.seed + 41); let coast = 'M' + P2(at(.08, .15)); for (let i = 1; i <= 9; i++) coast += 'L' + P2(at(.08 + i * .06 + (R2() - .5) * .04, .15 + Math.sin(i * 1.3) * .12 + R2() * .18));
      s += `<path d="${coast}" stroke="${ink}" stroke-width=".35" fill="none" opacity=".75"/>`;
      const rc = at(.66, .58); for (let i = 0; i < 8; i++) { const a = at(.66 + Math.cos(i * Math.PI / 4) * .32, .58 + Math.sin(i * Math.PI / 4) * .42); s += `<path d="M${P2(rc)}L${P2(a)}" stroke="${ink}" stroke-width=".18" opacity=".45"/>`; }
      s += `<ellipse cx="${f(rc[0])}" cy="${f(rc[1])}" rx="2.4" ry="${f(2.4 * clamp((rc[1] - S.vy) / S.f * 3, .2, 1))}" fill="none" stroke="${ink}" stroke-width=".25" opacity=".6"/>`;
      s += PR.scroll(u, L, Object.assign(put(c, .4, 3.12, Y, .38 / 19), { seed: c.seed + 42 }));
    } }
  s += FL ? FL.shafts : '';
  const lp = lamps(c); s += lp.s + lp.glow;
  return s;
}

function gundeck(c) {
  const { u, L, S, has, R } = c, { XL, XR, H, Zb } = S, PZ = [6, 8.6, 11.2, 13.8], GZ = [6, 8.6, 11.2], P0 = .52, P1 = 1.12, PW = .34;
  let s = shell(c, { strake: .17 });
  const opens = []; if (has('ports', false)) for (const Z of PZ) for (const sg of [-1, 1]) opens.push({ A: [sg < 0 ? XL : XR, P1, Z - PW], U: [0, 0, 2 * PW], V: [0, P0 - P1, 0], nu: 1, nv: 1, bar: .02 });
  const FL = winLight(c, opens, 0, { k: .5 }); s += FL ? FL.patches : '';
  // the bulkhead at the far end: a dark doorway with a glimmer
  { const d = [[-.36, 0, Zb], [.36, 0, Zb], [.36, 1.42, Zb], [-.36, 1.42, Zb]].map(p => S.P(...p)); s += `<path d="${poly(d)}" fill="${mix(c.dark, '#000', .25)}"/>` + wl(c, [-.36, 1.42, Zb], [.36, 1.42, Zb], .06, c.toneAt('oak-old', [0, 1.5, Zb], [0, 0, -1]), 1); }
  // the ports in both sides with red reveals, the night (day) outside
  const items = [];
  if (has('ports', false)) for (const Z of PZ) for (const sg of [-1, 1]) items.push({ Z: Z + .4, s: opening(c, 'pine-old', { side: sg > 0 ? 'right' : 'left', Z0: Z - PW, Z1: Z + PW, Y0: P0, Y1: P1, depth: .32, reveal: 'paint-red', glitter: S.P(sg * 4, 0, 20)[0] }) });
  // the guns run out through the ports (far ones first), each with its shadow; shot in the garlands between them
  if (has('guns')) for (const Z of GZ) for (const sg of [-1, 1]) { const q = put(c, sg * (XR - 1.48), Z, 0, 2.5 / 60);
    items.push({ Z, s: shadowOf(c, q, 30 * q.s, 21 * q.s, .5) + PR.cannon(u, L, Object.assign(q, { flip: sg < 0, sideX: 1.48 * 60 / 2.5, seed: c.seed + Math.round(Z * 3) + (sg > 0 ? 1 : 0) })) }); }
  if (has('shot')) for (const Z of [7.3, 9.9]) for (const sg of [-1, 1]) { const X = sg < 0 ? XL + .14 : XR - .14;
    let g = wbox(c, 'oak-old', X - .1, X + .1, 0, .1, Z - .45, Z + .45, { grain: false });
    for (let k = 4; k >= -4; k--) { const q = put(c, X, Z + k * .1, .1, .085 / 3.2); g += PR.shot(u, L, Object.assign(q, { seed: c.seed + k + 50 })); }
    items.push({ Z: Z + .5, s: g }); }
  if (has('mast')) { const Z = 9.9, r = .3 * S.upm(Z), b = S.P(0, 0, Z), t = S.P(0, H, Z);
    items.push({ Z: Z + .1, s: castShadow(u, L, { x: b[0], y: b[1], w: 2 * r, h: b[1] - t[1], horizon: S.vy }) + contactShadow(u, b[0], b[1], 2 * r, L) + shadeCyl(u, b[0], b[1], t[0], t[1], r, L, 'oak', { ell: .12, seed: c.seed + 61 })
      + PR.shotPile(u, L, Object.assign(put(c, .62, 9.4, 0, .085 / 3.2), { n: 3, seed: c.seed + 62 })) }); }
  if (has('ropes')) { const q = put(c, .45, 4.3, 0, .32 / 11); items.push({ Z: 4.3, s: PR.coil(u, L, Object.assign(q, { seed: c.seed + 71 })) });
    const r = put(c, -.25, 3.9, 0, 2.4 / 64); items.push({ Z: 3.9, s: PR.rammer(u, L, Object.assign(r, { rot: -4, head: 'both', seed: c.seed + 72 })) });
    const k = put(c, -1.05, 5.1, 0, .3 / 11); items.push({ Z: 5.1, s: PR.coil(u, L, Object.assign(k, { turns: 3, seed: c.seed + 74 })) }); }
  for (let z = 1.2; z < Zb - .3; z += 1) items.push({ Z: z - .05, s: has('beams', false) ? beams(c, [z], .2, .2, 'oak-old', { knees: false }) : '' });
  for (const l of c.lamps) items.push({ Z: l.Z - .02, s: '', lamp: l });
  let glow = '';
  for (const it of items.sort((a, b) => b.Z - a.Z)) { if (it.lamp) { c.lamps = [it.lamp]; const lp = lamps(c); s += lp.s; glow += lp.glow; } else s += it.s; }
  c.lamps = lampsOf(S, c.mood);
  return s + (FL ? FL.shafts : '') + glow;
}

function hold(c) {
  const { u, L, S, has, R, near } = c, { H, Zb, Zn } = S, YW = -.38, ZP = 3.3;
  // the hull's section (one half; the platform is Y = 0): from the bilge water up to the deck above
  const PROF = [[.95, YW], [1.32, -.2], [1.62, 0], [1.94, .5], [2.12, 1.05], [2.22, 1.6], [2.25, H]];
  const side = sg => PROF.map(p => [sg * p[0], p[1]]);
  let s = `<rect x="-2" y="-2" width="204" height="284" fill="${c.dark}"/>`;
  s += wplane(c, 'oak-old', [[-2.25, H, Zn], [2.25, H, Zn], [2.25, H, Zb], [-2.25, H, Zb]], [0, -1, 0]);
  { const sc = mix(c.toneAt('oak-old', [0, H, Zb], [0, -1, 0]), '#0c0705', .55); for (let X = -2.1; X < 2.2; X += .21 + R() * .05) s += wl(c, [X, H, Zn + .2], [X, H, Zb], .012, sc, .7); }
  // the ceiling planking of the hull: strips along the depth, toned by their normals; seams between the strakes
  for (const sg of [-1, 1]) { const pr = side(sg);
    for (let i = 0; i < pr.length - 1; i++) { const a = pr[i], b = pr[i + 1], nx = b[1] - a[1], ny = Math.abs(b[0] - a[0]), l = Math.hypot(nx, ny) || 1;
      const nn = [-sg * Math.abs(nx / l), ny / l, 0];                                              // inward and up (the hull flares)
      s += wface(c, 'oak-old', [[a[0], a[1], Zn], [b[0], b[1], Zn], [b[0], b[1], Zb], [a[0], a[1], Zb]], nn);
      const sc = mix(c.toneAt('oak-old', [a[0], a[1], Zb], nn), '#0c0705', .55);
      for (let k = 0; k < 3; k++) { const t = k / 3, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; s += wl(c, [p[0], p[1], Zn + .2], [p[0], p[1], Zb], .014, sc, .7); } } }
  // the bulkhead aft: the section closed by upright planks
  { const W = side(-1).reverse().concat(side(1)).map(p => [p[0], p[1], Zb]); s += wface(c, 'oak-old', W, [0, 0, -1]);
    const sc = mix(c.toneAt('oak-old', [0, 1, Zb], [0, 0, -1]), '#0c0705', .55); for (let X = -2.1; X < 2.2; X += .24 + R() * .05) s += wl(c, [X, YW, Zb], [X, H, Zb], .014, sc, .6); }
  // the bilge water in front of the platform: dark, a ripple, the light of the hatch in it
  if (has('water', false)) { const xw = .95, W = [[-xw, YW, Zn], [xw, YW, Zn], [xw, YW, Zb], [-xw, YW, Zb]], wp = W.map(p => S.P(...p)), id = nid('iw', u), a = S.P(0, YW, ZP), b = S.P(0, YW, Zn + .3);
    s += `<defs>${linGrad(id, 0, a[1], 0, b[1], [[0, L.tone('bilge', -.5, a[0], a[1])], [1, L.tone('bilge', -.2, b[0], b[1])]])}</defs><path d="${poly(wp)}" fill="url(#${id})"/>`;
    for (let i = 0; i < 14; i++) { const Z = lerp(Zn + .4, ZP, R()), X = (R() - .5) * 1.5; s += wl(c, [X - .2, YW, Z], [X + .2, YW, Z + .02], .01, mix(L.tone('bilge', .4, 100, 200), '#ffffff', .2), .35); } }
  // the frames: crooked ribs up the sides and the deck beams over them, each its own wobble
  if (has('ribs', false)) for (let Z = Zb - .35; Z > .7; Z -= .62 + R() * .08) {
    const w = .15, th = .13 + R() * .04, RR = rng(Math.round(Z * 100) + c.seed);
    let g = '';
    for (const sg of [-1, 1]) { const pr = side(sg).map((p, i) => [p[0] + (RR() - .5) * .07, p[1]]), inn = pr.map(p => [p[0] - sg * th, p[1]]);
      if (Z < ZP + .1) { pr[0][1] = YW; inn[0][1] = YW; }
      for (let i = 0; i < pr.length - 1; i++) { const a = inn[i], b = inn[i + 1], nn = [-sg, .3, 0];
        g += wface(c, 'oak-old', [[a[0], a[1], Z], [b[0], b[1], Z], [b[0], b[1], Z + w], [a[0], a[1], Z + w]], nn, { stroke: mix(c.dark, '#000', .3), sw: .2 }); }
      g += wface(c, 'oak-old', pr.map(p => [p[0], p[1], Z]).concat(inn.slice().reverse().map(p => [p[0], p[1], Z])), [0, 0, -1], { bias: -.05, stroke: mix(c.dark, '#000', .3), sw: .25 }); }
    g += wbox(c, 'oak-old', -2.2, 2.2, H - .2, H, Z, Z + w, { grain: near });
    s += g; }
  // the platform: loose planks over the frames, its front edge above the water
  if (has('platform', false)) { const xp = 1.62, Wp = [[-xp, 0, ZP], [xp, 0, ZP], [xp, 0, Zb], [-xp, 0, Zb]].map(p => S.P(...p)), cid = nid('ik', u);
    s += `<defs><clipPath id="${cid}"><path d="${poly(Wp)}"/></clipPath></defs><g clip-path="url(#${cid})">${ENV.deck(u, L, { horizon: S.vy, top: S.back.bot, bottom: Wp[0][1] + 1, vx: S.vx, kind: 'pine-old', plank: .24 * S.upm(ZP), seed: c.seed + 2 })}</g>`;
    s += wbox(c, 'pine-old', -xp, xp, -.1, 0, ZP, ZP + .05, { top: false });
    for (const X of [-1.1, -.1, .9]) s += wbox(c, 'oak-old', X, X + .16, YW, -.1, ZP + .1, ZP + .26, { top: false, grain: false }); }
  // the hatch in the deck above: the sky, the coaming, the light falling down it
  const hx0 = -.95, hx1 = -.05, hz0 = 3.66, hz1 = 4.56, hatchLit = c.mood !== 'lamp';
  if (has('hatch', false)) { const Q = [[hx0, H, hz0], [hx1, H, hz0], [hx1, H, hz1], [hx0, H, hz1]].map(p => S.P(...p)), id = nid('iy', u);
    const sky = hatchLit ? PAL.day.sky : PAL.night.sky;
    s += `<defs>${linGrad(id, 0, Q[2][1], 0, Q[0][1], [[0, sky[2]], [1, sky[3]]])}</defs><path d="${poly(Q)}" fill="url(#${id})"/>`;
    s += wface(c, 'oak-old', [[hx0, H, hz1], [hx1, H, hz1], [hx1, H + .3, hz1], [hx0, H + .3, hz1]], [0, 0, -1], { stroke: mix(c.dark, '#000', .3), sw: .25 });
    s += wface(c, 'oak-old', [[hx0, H, hz0], [hx0, H, hz1], [hx0, H + .3, hz1], [hx0, H + .3, hz0]], [1, 0, 0], { stroke: mix(c.dark, '#000', .3), sw: .25 });
    s += wbox(c, 'oak-old', hx0 - .1, hx1 + .1, H - .12, H, hz0 - .1, hz0, { grain: false }); }
  // the light patch at the ladder's foot
  const d = [.1, -1, -.18], col = hatchLit ? '#fff6e4' : '#b8c8ee';
  if (has('hatch', false)) { const corners = [[hx0, H, hz0], [hx1, H, hz0], [hx1, H, hz1], [hx0, H, hz1]], hit = corners.map(p => hitY(d, p, 0)), id = nid('ia', u);
    s += `<defs>${blur(id, 2)}</defs><path d="${poly(hit.map(p => S.P(...p)))}" fill="${col}" opacity="${f(hatchLit ? .42 : .14)}" filter="url(#${id})"/>`; }
  // the stores: casks standing and lying in tiers, crates stacked, a sack, a coil of rope
  const items = [];
  if (has('barrels')) {
    for (const [X, Z, k, sd] of [[1.12, 6.3, 'water', 1], [.52, 6.6, 'rum', 2], [1.2, 5.55, 'rum', 3]]) { const q = put(c, X, Z, 0, .9 / 30); items.push({ Z, s: shadowOf(c, q, 21.5 * q.s, 30 * q.s) + PR.barrel(u, L, Object.assign(q, { kind: k, seed: c.seed + 80 + sd })) }); }
    for (const [X, Z, Y, sd] of [[-1.18, 6.25, 0, 4], [-1.22, 5.5, 0, 5], [-1.2, 5.9, .55, 6]]) { const q = put(c, X, Z, Y, .9 / 30); items.push({ Z: Z - Y * .2, s: (Y ? '' : shadowOf(c, q, 30 * q.s, 19 * q.s, .6)) + PR.barrel(u, L, Object.assign(q, { lying: true, flip: true, kind: 'water', seed: c.seed + 80 + sd, contact: !Y })) }); } }
  if (has('crates')) { const q = put(c, .95, 4.75, 0, .6 / 22), q2 = put(c, .98, 4.85, .44, .5 / 22);
    items.push({ Z: 4.75, s: shadowOf(c, q, 22 * q.s, 26 * q.s, .45) + PR.crate(u, L, Object.assign(q, { flip: q.x > S.vx, seed: c.seed + 91 })) + PR.crate(u, L, Object.assign(q2, { flip: q2.x > S.vx, seed: c.seed + 92, contact: false })) });
    const k = put(c, .38, 4.05, 0, .55 / 21); items.push({ Z: 4.05, s: shadowOf(c, k, 19 * k.s, 20 * k.s, .7) + PR.sack(u, L, Object.assign(k, { seed: c.seed + 93 })) }); }
  if (has('rope')) { const q = put(c, -1.0, 4.0, 0, .3 / 11); items.push({ Z: 4.0, s: PR.coil(u, L, Object.assign(q, { seed: c.seed + 94 })) }); }
  // the ladder from the platform up through the hatch, lit from above
  if (has('ladder', false)) { const b0 = 4.72, t0 = hz0 + .12, xs = [-.82, -.2], st = .27;
    let g = dropShadow(c, [[xs[0], 0, b0], [xs[1], 0, b0], [xs[1], H, t0], [xs[0], H, t0]].map(p => [p[0], Math.min(p[1], 1.9), p[2]]), 0, { opacity: .4 });
    for (const X of xs) g += wbox(c, 'oak-old', X - .045, X + .045, 0, .02, b0 - .05, b0 + .05, { grain: false });
    for (let Y = st; Y < H - .1; Y += st) { const Z = lerp(b0, t0, Y / H); g += wbox(c, 'pine-old', xs[0], xs[1], Y - .035, Y, Z - .09, Z + .05, { grain: false, sw: .2 }); }
    for (const X of xs) g += wl(c, [X, 0, b0], [X, H + .3, lerp(b0, t0, (H + .3) / H)], .07, c.toneAt('oak-old', [X, 1.2, 4.2], [0, 0, -1], .1), 1) + wl(c, [X + .03, 0, b0], [X + .03, H + .3, lerp(b0, t0, (H + .3) / H)], .015, mix(c.toneAt('oak-old', [X, 1.8, 4.2], [0, 1, 0]), '#fff8e8', .25), .7);
    items.push({ Z: 4.4, s: g }); }
  for (const l of c.lamps) if (l.type === 'lantern') items.push({ Z: l.Z, s: '', lamp: l });
  let glow = '';
  for (const it of items.sort((a, b) => b.Z - a.Z)) { if (it.lamp) { c.lamps = [it.lamp]; const lp = lamps(c); s += lp.s; glow += lp.glow; } else s += it.s; }
  c.lamps = lampsOf(S, c.mood);
  // the shaft of light down the hatch, in the air
  if (has('hatch', false)) { const corners = [[hx0, H, hz0], [hx1, H, hz0], [hx1, H, hz1], [hx0, H, hz1]], hit = corners.map(p => hitY(d, p, 0)), pc = corners.concat(hit).map(p => S.P(...p)), gid = nid('ib', u), fl = nid('ic', u), a = S.P(-.5, H, 4.1), b = S.P(-.5, 0, 4.4);
    s += `<defs>${linGrad(gid, a[0], a[1], b[0], b[1], [[0, col, hatchLit ? .34 : .1], [.6, col, hatchLit ? .14 : .04], [1, col, hatchLit ? .06 : .02]])}${blur(fl, 2.4)}</defs><path d="${poly(hull(pc))}" fill="url(#${gid})" filter="url(#${fl})"/>`;
    if (hatchLit) s += localGlow(u, { x: a[0], y: a[1] + 4, color: col, power: .5, radius: 40 }, { core: false }); }
  return s + glow;
}

function tavern(c) {
  const { u, L, S, has, R, near } = c, { XL, XR, H, Zb } = S;
  let s = shell(c, { strakes: false, boards: false, ceilPlanks: false });
  // stone courses on the walls: rows of blocks, joints staggered; a dark joint and a lit top edge to each row
  { const jc = w => mix(w, '#0c0705', .5);
    for (const sg of [-1, 1]) { const X = sg < 0 ? XL : XR;
      for (let Y = .28, r = 0; Y < H - .05; Y += .26 + R() * .06, r++) { const j = jc(c.toneAt('stone', [X, Y, S.Zb], [-sg, 0, 0])); s += wl(c, [X, Y, S.Zn + .2], [X, Y, Zb], .018, j, .7);
        if (near) for (let Z = 1 + R() * .5; Z < Zb; Z += .38 + R() * .3) s += wl(c, [X, Y, Z], [X, Y + .24, Z], .016, j, .55); } }
    for (let Y = .25, r = 0; Y < H; Y += .25 + R() * .06, r++) { const j = jc(c.toneAt('stone', [0, Y, Zb], [0, 0, -1])); s += wl(c, [XL, Y, Zb], [XR, Y, Zb], .018, j, .7);
      for (let X = XL + (r % 2) * .2 + R() * .1; X < XR; X += .36 + R() * .22) s += wl(c, [X, Y - .25, Zb], [X, Y, Zb], .016, j, .6); } }
  const items = [];
  // the hearth in the back wall: a stone breast, the soot-black firebox, logs burning; the mantel shelf
  if (has('hearth', false)) { const X0 = -2.0, X1 = -.9, Y1 = .95, dz = .55, Zi = Zb + dz;
    s += wbox(c, 'stone', X0 - .3, X1 + .3, 0, H, Zb - .2, Zb, { grain: false, top: false });
    for (let Y = .28; Y < H; Y += .3) s += wl(c, [X0 - .3, Y, Zb - .2], [X1 + .3, Y, Zb - .2], .016, mix(c.toneAt('stone', [X0, Y, Zb - .2], [0, 0, -1]), '#0c0705', .5), .6);
    const Zf = Zb - .2, inner = [[[X0, 0, Zi], [X1, 0, Zi], [X1, Y1, Zi], [X0, Y1, Zi]], [0, 0, -1]];
    s += wface(c, 'soot', [[X0, 0, Zf], [X1, 0, Zf], [X1, Y1, Zf], [X0, Y1, Zf]], [0, 0, -1], { bias: -.4 }) + wface(c, 'soot', inner[0], inner[1], { bias: -.2 });
    s += wface(c, 'soot', [[X0, 0, Zf], [X0, Y1, Zf], [X0, Y1, Zi], [X0, 0, Zi]], [1, 0, 0]) + wface(c, 'stone', [[X0, 0, Zf], [X1, 0, Zf], [X1, 0, Zi], [X0, 0, Zi]], [0, 1, 0], { bias: -.2 });
    s += wbox(c, 'oak-old', X0 - .4, X1 + .4, Y1, Y1 + .12, Zf - .2, Zf, {});                                       // the mantel
    s += PR.mug(u, L, Object.assign(put(c, X0 - .1, Zf - .1, Y1 + .12, .14 / 11), { seed: c.seed + 101 })) + PR.bottle(u, L, Object.assign(put(c, X1 + .1, Zf - .1, Y1 + .12, .3 / 20), { kind: 'empty', seed: c.seed + 102 }));
    const fl = c.lamps.find(l => l.type === 'fire'), fp = S.P(-1.45, 0, Zb + .25), up = S.upm(Zb + .25);
    s += fl && fl.lit ? ENV.fire(u, { x: fp[0], y: fp[1], w: .62 * up, h: .62 * up, seed: c.seed + 103, fuel: true, glow: true, pool: true })
      : `<ellipse cx="${f(fp[0])}" cy="${f(fp[1] - 1)}" rx="${f(.3 * up)}" ry="${f(.05 * up)}" fill="#7a2a10" opacity=".7"/>` + localGlow(u, { x: fp[0], y: fp[1] - 1, color: '#ff6a20', power: .35, radius: .5 * up }, { core: false }); }
  // the window to the night: deep stone reveal, small leaded panes, the moon
  if (has('window', false)) s += opening(c, 'stone', { side: 'back', X0: -.35, X1: .45, Y0: 1.08, Y1: 1.9, depth: .45, nu: 3, nv: 4, bar: .014, moon: S.P(.25, 1.75, Zb + 8), moonR: 3 })
    + wbox(c, 'oak-old', -.4, .5, 1.02, 1.08, Zb - .08, Zb, { grain: false });
  const WL = has('window', false) ? winLight(c, [{ A: [-.35, 1.9, Zb + .45], U: [.8, 0, 0], V: [0, -.82, 0], nu: 3, nv: 4, bar: .07 }], 0, { k: .4 }) : null;
  s += WL ? WL.patches : '';
  // the shelves behind the counter: bottles and mugs on two boards; casks lying on a rack below them
  if (has('shelves')) { const X0 = .75, X1 = XR - .05, Zs = Zb - .26;
    for (const Y of [1.42, 1.86]) { s += wbox(c, 'oak-old', X0, X1, Y - .05, Y, Zs, Zb, { grain: false });
      const R2 = rng(c.seed + Math.round(Y * 10)); let X = X0 + .12; const sh = [];
      while (X < X1 - .1) { const t = R2(); sh.push(t < .55 ? PR.bottle(u, L, Object.assign(put(c, X, Zb - .13, Y, (.26 + R2() * .06) / 20), { kind: R2() < .6 ? 'rum' : 'empty', seed: c.seed + Math.round(X * 50) })) : PR.mug(u, L, Object.assign(put(c, X, Zb - .13, Y, .14 / 11), { seed: c.seed + Math.round(X * 40), fill: 'dark' }))); X += .14 + R2() * .1; }
      s += sh.join(''); }
    for (const [X, sd] of [[1.25, 1], [1.95, 2]]) s += PR.barrel(u, L, Object.assign(put(c, X, Zb - .35, .48, .7 / 30), { lying: true, kind: 'rum', seed: c.seed + 110 + sd, contact: false }));
    s += wbox(c, 'oak-old', .8, XR - .1, .38, .48, Zb - .6, Zb - .1, { grain: false }); }
  // the counter: a long box of planks, its top worn light; mugs, a bottle, the candles
  if (has('counter')) { const C = { X0: .55, X1: XR, Y: 1.05, Z0: Zb - 1.7, Z1: Zb - 1.05 };
    s += dropShadow(c, [[C.X0, C.Y, C.Z0], [C.X1, C.Y, C.Z0], [C.X1, C.Y, C.Z1], [C.X0, C.Y, C.Z1]], 0, { opacity: .55 });
    s += wbox(c, 'oak', C.X0, C.X1, 0, C.Y - .06, C.Z0 + .06, C.Z1) + wbox(c, 'oak', C.X0 - .04, C.X1, C.Y - .06, C.Y, C.Z0, C.Z1);
    for (let X = C.X0 + .16; X < C.X1; X += .2 + R() * .05) s += wl(c, [X, .04, C.Z0 + .06], [X, C.Y - .08, C.Z0 + .06], .012, mix(c.toneAt('oak', [X, .5, C.Z0], [0, 0, -1]), '#0c0705', .5), .6);
    s += PR.mug(u, L, Object.assign(put(c, 1.45, C.Z0 + .3, C.Y, .15 / 11), { fill: 'rum', seed: c.seed + 121 })) + PR.mug(u, L, Object.assign(put(c, 1.6, C.Z0 + .22, C.Y, .15 / 11), { seed: c.seed + 122 }))
      + PR.bottle(u, L, Object.assign(put(c, 2.3, C.Z0 + .35, C.Y, .3 / 20), { kind: 'rum', seed: c.seed + 123 }));
    const lp = lamps(c, ['candle']); s += lp.s; items.push({ glow: lp.glow }); }
  // casks on the floor at the left, near
  if (has('barrels')) for (const [X, Z, sd] of [[-2.0, 4.6, 1], [-1.55, 4.1, 2]]) { const q = put(c, X, Z, 0, .9 / 30); s += shadowOf(c, q, 21.5 * q.s, 30 * q.s) + PR.barrel(u, L, Object.assign(q, { kind: 'rum', seed: c.seed + 130 + sd })); }
  if (has('beams', false)) s += beams(c, [1.4, 2.5, 3.6, 4.7, Zb - .25], .24, .22, 'oak-old');
  s += (WL ? WL.shafts : '') + items.map(i => i.glow || '').join('');
  return s;
}

const BUILD = { cabin, gundeck, hold, tavern };

/**
 * interior(u, L, { kind, vp, f, eye, room, back, mood, detail, seed, props, items, off, win, outside, gloom }) — the
 * room as one SVG string (background + its furniture + the lamps' glow). kind: 'cabin' | 'gundeck' | 'hold' | 'tavern'.
 * L — from makeLight(interior.scheme(kind).light, scheme.cam) or the scene's own (point key = lamp, sun = windows).
 * detail: 'near' | 'mid' (fewer seams and grain). props: false — the bare room (walls, beams, windows); items: { name:
 * false } or off: [names] — leave out single parts so the scene puts its own (cabin: windows, panels, bench, shelves,
 * beams, table, chart, chest, lamp; gundeck: ports, guns, shot, mast, ropes, beams, lamp; hold: water, ribs, platform,
 * hatch, ladder, barrels, crates, rope, lamp; tavern: hearth, window, shelves, counter, candles, barrels, beams). win:
 * { az, el, color, power } | false — the light through the windows; outside: 'night' | 'day' | 'dusk' — what is seen
 * through them; gloom: false — no dark at the bottom and the edges (then put interior.gloom last yourself).
 */
function interior(u, L, o = {}) {
  const c = ctx(u, L, o);
  let s = BUILD[c.S.kind](c);
  if (o.gloom !== false) s += gloom(u, L, { y0: o.gloomY });
  return s;
}
interior.geom = geomOf;
interior.scheme = scheme;
interior.gloom = gloom;
interior.KINDS = ROOM_KINDS;

module.exports = { interior, ROOMS };
