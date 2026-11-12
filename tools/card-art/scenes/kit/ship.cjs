// kit/ship.cjs — the ships of the game drawn from one parametric construction: hull -> strakes and wales -> rows
// of gun ports with lids -> stern with a quarter gallery and windows -> forecastle -> beakhead and bowsprit -> masts
// of three sections with tops -> yards -> sails -> standing rigging (shrouds with ratlines, stays) -> running
// rigging -> flags. The four ships of the game differ by the PARAMETERS OF THE SILHOUETTE (SPECS below), taken from
// the artist's table of docs/mockups/print/ships-refs.md. The view is a profile (the side to the viewer), the bow
// to the left. All light comes from L (kit/light.cjs): every point is computed in scene units, so gradients and
// highlights stay on the side of the source when the ship is flipped or heeled.
// Pure functions that return SVG strings; no Node API. Rules: docs/mockups/print/STYLE.md, API: kit/README.md.
'use strict';
const K = require('./light.cjs'), E = require('./env.cjs');
const { nid, f, clamp, lerp, rng, mix, scale: mul, linGrad, MAT, shadeCyl, makeLight, LIGHTS, localGlow } = K;
const rad = d => d * Math.PI / 180;
const strHash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const DIM = { night: .8, fog: .78, dusk: .96, day: 1 };

// ——— the ships' own materials, added to the kit's table (the colours of the decks of the game) ———
const SHIP_MAT = {
  'ship-red': { base: '#842a1c', spec: { w: .4, op: .14, col: 'warm' }, reflex: 'warm', reflexK: .3, grain: 1 },   // sooty dark red planking
  'ship-ghost': { base: '#4c5038', spec: null, reflex: 'sky', reflexK: .4, grain: 1 },                             // old drowned wood
  'ship-weed': { base: '#3c5a32', spec: null, reflex: 'sky', reflexK: .2 },
  'ship-wood': { base: '#7d5c3a', spec: { w: .5, op: .16, col: 'warm' }, reflex: 'warm', reflexK: .34, grain: 1 },
  'ship-sail-black': { base: '#46464e', spec: null, reflex: 'sky', reflexK: .16, trans: .55 },
  'ship-sail-red': { base: '#a8382a', spec: null, reflex: 'warm', reflexK: .16, trans: .6 },
  'ship-sail-ghost': { base: '#93a58c', spec: null, reflex: 'sky', reflexK: .16, trans: .7 },
  'ship-flag-black': { base: '#2e2e34', spec: null, reflex: 'sky', reflexK: .1, trans: .3 },
  'ship-flag-red': { base: '#c23a2c', spec: null, reflex: 'warm', reflexK: .1, trans: .5 },
};
for (const k of Object.keys(SHIP_MAT)) if (!MAT[k]) MAT[k] = SHIP_MAT[k];

// ——— the parameters of the silhouettes. Local units: x along the waterline from the bow (-len / 2) to the stern
// (+len / 2), heights above the waterline. len — the hull at the waterline; free — the rail of the waist;
// sheer — how much the lines rise at the bow and at the stern; tumble — the tumblehome of the sides (shading);
// bow: [rake, roundness]; over — the stern's overhang; counter — the height of the counter (x free);
// fc: [aft end, height] of the forecastle; tiers: [start x, height] of the quarterdeck, the poop, ...; taff — the
// taffrail; tw: [top, bottom] — the width of the transom's visible strip; ports: rows of gun ports;
// deckPorts: [n, x0, x1] — guns of the open deck; gallery: [length, tiers, tier height]; beak: [length, rise,
// depth of its knee at the stem (0 — a cutwater down to the waterline)]; masts: x, H (the truck above the water), n — yards, k — the width of the
// yards, rake, aft: 'lateen' | 'gaff', lower: a square sail on the lower yard of the mizzen.
const SPECS = {
  // The Black Pearl (2003): the longest and lowest; one closed row of ports; a slender stern of two tiers; a bare
  // nose (no sprit topmast); square sails on the mizzen; black torn sails.
  pearl: {
    len: 104, free: 8.2, sheer: [3, 2.4], tumble: .25, bow: [6.5, 1.9], over: 7, counter: .78,
    fc: [-30, 2.6], tiers: [[17, 4.2], [37, 3.8]], taff: 1.6, tw: [3.2, 4.2], openRail: 1,
    hull: 'tar', trim: 'ship-wood', gilt: 0, wales: [3.1, 6.4], bands: [],
    ports: [{ h: 4.7, n: 9, x0: -31, x1: 30, w: 2.1, open: .3 }], deckPorts: [7, -24, 32],
    gallery: [10.5, 1, 4.2], tierWin: 2, lantern: 1,
    beak: [14, 2.2, 3.2], sprit: { len: 27, steeve: 24 }, jibs: 1,
    masts: [{ x: -34, H: 92, n: 3, k: .92 }, { x: 0, H: 104, n: 3, k: 1, rake: 1.2 }, { x: 33, H: 76, n: 2, k: .7, rake: 2.5, lower: true }],
    spar: 'tar', yard: 'tar', sail: 'ship-sail-black', cond: 'torn', flag: 'jolly', pennant: 'ship-flag-black',
  },
  // Queen Anne's Revenge (2011): a short hull "stern up": the highest stern of the four, broad, 3.5 tiers; a sprit
  // topmast; a lateen mizzen; dark red sooty hull, red dirty torn sails.
  revenge: {
    len: 84, free: 9.6, sheer: [3, 3.4], tumble: .3, bow: [6.5, 2.2], over: 10, counter: .8,
    fc: [-21, 5.4], tiers: [[0, 6.6], [14, 6.6], [26, 6], [36, 3.6]], taff: 2.4, tw: [7, 8.5], openRail: 2,
    hull: 'ship-red', trim: 'ship-wood', gilt: 1, wales: [], bands: [{ h0: 2.7, h1: 3.9, mat: 'tar' }, { h0: 6.5, h1: 7.5, mat: 'tar' }],
    ports: [{ h: 5.2, n: 8, x0: -27, x1: 24, w: 2.1, open: .8 }], deckPorts: [7, -17, 30],
    gallery: [12, 2, 4.5], tierWin: 3, lantern: 1.5,
    beak: [12, 2.6, 3.4], sprit: { len: 23, steeve: 30, topmast: 13 }, jibs: 1,
    masts: [{ x: -27, H: 98, n: 3, k: .98 }, { x: 2, H: 110, n: 3, k: 1.06, rake: 1 }, { x: 27, H: 86, n: 2, k: .72, rake: 2, aft: 'lateen' }],
    spar: 'ship-wood', yard: 'tar', sail: 'ship-sail-red', cond: 'patched', flag: 'jolly', pennant: 'ship-flag-red',
  },
  // HMS Endeavour (2007): the biggest; a high even wall of the side with three rows of ports on ochre bands; the
  // forecastle almost level with the waist; a broad stern of middle height with galleries; a gaff mizzen; a long
  // bowsprit with a jib-boom; white whole sails, the full set.
  endeavour: {
    len: 104, free: 17.5, sheer: [1.5, 2], tumble: .5, bow: [5, 1.7], over: 7, counter: .62,
    fc: [-28, 1.6], tiers: [[12, 3], [31, 3.6]], taff: 1.4, tw: [6.5, 7.5],
    hull: 'tar', trim: 'paint-ochre', gilt: 1, wales: [1.9], bands: [{ h0: 3.3, h1: 5.9, mat: 'paint-ochre' }, { h0: 7.7, h1: 10.3, mat: 'paint-ochre' }, { h0: 12.1, h1: 14.7, mat: 'paint-ochre' }],
    ports: [{ h: 4.6, n: 15, x0: -41, x1: 40, w: 1.9, open: 1 }, { h: 9, n: 15, x0: -42, x1: 41, w: 1.9, open: 1 }, { h: 13.4, n: 14, x0: -41, x1: 40, w: 1.9, open: 1 }], deckPorts: [9, -22, 42],
    gallery: [12, 2, 4.4], tierWin: 3, lantern: 1,
    beak: [9.5, 3.4, 0], sprit: { len: 30, steeve: 20, jib: 13, spritsail: 'set' }, jibs: 3,
    masts: [{ x: -34, H: 116, n: 4, k: .95 }, { x: 1, H: 127, n: 4, k: 1.04, rake: .8 }, { x: 34, H: 99, n: 3, k: .74, rake: 1.6, aft: 'gaff' }],
    spar: 'paint-ochre', yard: 'tar', sail: 'linen', cond: 'whole', flag: 'pennant', pennant: 'ship-flag-red', ensign: 'company',
  },
  // The Flying Dutchman (2006-2007): a "pear" — bellied below, narrow above; two rows of ports; a very high stern
  // narrowing upwards; a strong sheer; a sprit topmast; a lateen mizzen; green-brown overgrown hull, rags of sails.
  dutch: {
    len: 92, free: 11.4, sheer: [4.5, 6], tumble: 1, bow: [7, 2.6], over: 9, counter: .7,
    fc: [-27, 3.4], tiers: [[14, 4.2], [31, 4.6], [43.5, 4.2]], taff: 2, tw: [1.4, 6.5], openRail: 2,
    hull: 'ship-ghost', trim: 'ship-ghost', gilt: 0, wales: [3.2, 6.6, 10.1], bands: [], growth: true,
    ports: [{ h: 4.7, n: 10, x0: -30, x1: 30, w: 2, open: .55 }, { h: 8.4, n: 9, x0: -27, x1: 28, w: 1.9, open: .5 }], deckPorts: [4, 12, 35],
    gallery: [8, 1, 4], tierWin: 2, lantern: 1,
    beak: [11, 1.2, 3.6], sprit: { len: 22, steeve: 32, topmast: 12, spritsail: 'set' }, jibs: 1,
    masts: [{ x: -29, H: 92, n: 3, k: .96 }, { x: 0, H: 104, n: 3, k: 1.03, rake: 1.5 }, { x: 27, H: 84, n: 2, k: .7, rake: 3, aft: 'lateen' }],
    spar: 'ship-ghost', yard: 'ship-ghost', sail: 'ship-sail-ghost', cond: 'rags', flag: 'jolly', pennant: 'ship-flag-black',
  },
  // A neutral merchantman: a small fluyt — a bellied hull, no gun ports, three masts, light sails.
  merchant: {
    len: 70, free: 8.6, sheer: [2.6, 4.2], tumble: .8, bow: [5.5, 2.6], over: 5.5, counter: .74,
    fc: [-22, 2.2], tiers: [[9, 3.4], [22, 3.6]], taff: 1.6, tw: [1.6, 3.6],
    hull: 'ship-wood', trim: 'ship-wood', gilt: 0, wales: [], bands: [{ h0: 3, h1: 4.3, mat: 'tar' }, { h0: 7.4, h1: 8.1, mat: 'tar' }],
    ports: [], deckPorts: [0, 0, 0], gallery: [6, 1, 3.4], tierWin: 1, lantern: .8,
    beak: [7.5, 1.4, 2.6], sprit: { len: 17, steeve: 28 }, jibs: 1,
    masts: [{ x: -22, H: 62, n: 2, k: 1.05 }, { x: 0, H: 72, n: 2, k: 1.15, rake: 1 }, { x: 21, H: 52, n: 2, k: .72, rake: 2, aft: 'lateen' }],
    spar: 'oak', yard: 'ship-wood', sail: 'canvas', cond: 'whole', flag: 'merchant', pennant: 'linen',
  },
  // A neutral brig: two masts with square sails, a gaff sail on the main, a low flush hull with one white band.
  brig: {
    len: 66, free: 7.2, sheer: [2, 1.6], tumble: .25, bow: [5.5, 1.6], over: 4.5, counter: .74,
    fc: [-23, 1.2], tiers: [[16, 1.8]], taff: 1, tw: [3, 3.6],
    hull: 'tar', trim: 'ship-wood', gilt: 0, wales: [2.6], bands: [{ h0: 4.2, h1: 6.1, mat: 'linen' }],
    ports: [{ h: 5.15, n: 8, x0: -22, x1: 22, w: 1.6, open: 1 }], deckPorts: [0, 0, 0], gallery: [5, 1, 2.6], tierWin: 0, lantern: .7,
    beak: [6, 2.4, 0], sprit: { len: 18, steeve: 22, jib: 8 }, jibs: 2,
    masts: [{ x: -15, H: 70, n: 3, k: 1.35 }, { x: 13, H: 76, n: 3, k: 1.42, rake: 1.5, aft: 'gaff', lower: true }],
    spar: 'oak', yard: 'tar', sail: 'canvas', cond: 'whole', flag: 'plain', pennant: 'ship-flag-red',
  },
};
const QY = { 4: [.36, .62, .8, .94], 3: [.4, .7, .93], 2: [.46, .86] }, WY = [.14, .108, .078, .054];

/** shipBox(kind, { x, y, scale, flip }) -> { x0, x1, top, y, w, h } — the box of the ship in scene units (without
 *  the wake and the reflection): for placing it in a scene. */
function shipBox(kind, o = {}) {
  const sp = SPECS[kind] || SPECS.pearl, s = o.scale || 1, dir = o.flip ? -1 : 1, x = o.x != null ? o.x : 100, y = o.y != null ? o.y : 180;
  const bs = sp.sprit, reach = Math.cos(rad(bs.steeve)) * (bs.len + (bs.jib || 0)) + (bs.topmast ? .045 * sp.len : 0), fore = -sp.len / 2 - sp.bow[0] + 3.2 - reach, aft = sp.len / 2 + sp.over + sp.tw[1] + (sp.ensign ? 5 : 1);
  const top = Math.max(...sp.masts.map(m => m.H)) + 7, a = x + dir * s * fore, b = x + dir * s * aft;
  return { x0: Math.min(a, b), x1: Math.max(a, b), top: y - s * top, y, w: Math.abs(b - a), h: s * top };
}

// ——— the builder: mode 'color' — the ship in light; 'sil' — one flat tone; 'refl' — a simple body for the reflection
function build(u, L, o, mode) {
  const kind = SPECS[o.kind] ? o.kind : 'pearl', sp = SPECS[kind];
  const s = o.scale || 1, dir = o.flip ? -1 : 1, x0 = o.x != null ? o.x : 100, y0 = o.y != null ? o.y : 180;
  const ang = rad(o.heel || 0), ca = Math.cos(ang), sa = Math.sin(ang);
  const sil = mode === 'sil', refl = mode === 'refl';
  const det = sil ? 'mid' : refl ? 'far' : (o.detail === 'far' || o.detail === 'mid' ? o.detail : 'near');
  const far = det === 'far', near = det === 'near', plain = sil || far;   // plain: no small things, no outline
  const C = o.color || '#1b1d22', set = o.sails || 'full', seed = o.seed != null ? o.seed : strHash(kind) % 9973;
  const R = name => rng(seed * 7919 + strHash(name) % 65521);
  const air = sil || refl ? 0 : o.air != null ? o.air : far ? clamp(.36 + L.haze * .32, 0, .85) : 0, airC = mix(L.pal.sky[2], L.pal.sky[3], .55);
  const Lu = sp.len / 100, hb = sp.len / 2;

  // local point -> scene point
  const pt = (X, H) => [x0 + dir * s * (X * ca - H * sa), y0 - s * (X * sa + H * ca)];
  const pp = (X, H) => { const p = pt(X, H); return f(p[0]) + ' ' + f(p[1]); };
  const line = pts => 'M' + pts.map(p => pp(p[0], p[1])).join('L');
  const poly = pts => line(pts) + 'Z';
  const seg = (A, B) => 'M' + pp(A[0], A[1]) + 'L' + pp(B[0], B[1]);
  const sag = (A, B, k) => 'M' + pp(A[0], A[1]) + 'Q' + pp((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - k) + ' ' + pp(B[0], B[1]);
  const spl = (pts, closed) => { // a smooth curve through the points (Catmull-Rom)
    const n = pts.length; if (n < 3) return line(pts) + (closed ? 'Z' : '');
    const g = i => closed ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))];
    let d = 'M' + pp(pts[0][0], pts[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += 'C' + pp(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + ' ' + pp(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + ' ' + pp(p2[0], p2[1]); }
    return d + (closed ? 'Z' : '');
  };
  const box = (X, H, w, h) => poly([[X - w / 2, H - h / 2], [X + w / 2, H - h / 2], [X + w / 2, H + h / 2], [X - w / 2, H + h / 2]]);
  const dot = (X, H, r) => { const p = pt(X, H); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * s)}"`; };

  // light: the intensity on a local normal [towards the stern, up, at the viewer]; tones go to the sky's tone far away
  const cen = pt(0, sp.free * 2), dC = L.at(cen[0], cen[1]);
  const lum = n => { const l = Math.hypot(n[0], n[1], n[2]) || 1; return (dir * n[0] * dC.dx - n[1] * dC.dy + n[2] * dC.dz) / l; };
  const col = c => sil ? C : air ? mix(c, airC, air) : c;
  const tone = (kindM, I) => sil ? C : col(L.tone(kindM, clamp(I, -1, 1), cen[0], cen[1]));
  const ink = kindM => sil ? C : col(mix(L.tone(kindM, -.1, cen[0], cen[1]), '#1c0f08', .62));
  const back = dC.dz < -.25, If = lum([0, 0, 1]);
  let defs = '';
  const gr = (A, B, stops) => { if (sil) return C; const id = nid('hg', u), a = pt(A[0], A[1]), b = pt(B[0], B[1]); defs += linGrad(id, a[0], a[1], b[0], b[1], stops); return `url(#${id})`; };
  const clipOf = d => { const id = nid('hc', u); defs += `<clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath>`; return id; };
  const ow = plain ? 0 : clamp(.3 * Math.sqrt(s) + .12, .4, .8);        // the outline of the big forms
  const rw = w => f(clamp(w * s, .1, .5));                                // the width of a rope
  const fillP = (d, paint, extra = '') => `<path d="${d}" fill="${paint}"${extra}/>`;
  const strokeP = (d, paint, w, extra = '') => d ? `<path d="${d}" fill="none" stroke="${paint}" stroke-width="${typeof w === 'number' ? f(w) : w}"${extra}/>` : '';
  const edge = (d, kindM, k = 1) => ow ? strokeP(d, ink(kindM), ow * k, ' stroke-linejoin="round"') : '';
  // rim light: the edges turned to the back light catch it
  const rimDir = plain ? null : L.rim ? (() => { const a = Math.sin(rad(L.rim.az)), l = Math.hypot(a, .55); return [a / l, -.55 / l]; })() : back ? [dC.ux, dC.uy] : null;
  const rimCol = L.rim ? L.rim.color : mix(L.keyColor, '#ffffff', .3), rimPow = L.rim ? L.rim.power : clamp(L.key.power * .62);
  const rim = (d, clipId, c, ext, w = .9, k = 1) => { if (!rimDir) return ''; const p = pt(c[0], c[1]), e = ext * s, id = nid('hr', u);
    defs += linGrad(id, p[0] - rimDir[0] * e * .15, p[1] - rimDir[1] * e * .15, p[0] + rimDir[0] * e, p[1] + rimDir[1] * e, [[0, rimCol, 0], [.5, rimCol, rimPow * .5 * k], [1, rimCol, clamp(rimPow * 1.5 * k)]]);
    return `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="${f(clamp(w * s, .5, 1.6))}" clip-path="url(#${clipId})"/>`; };
  // a spar: a shaded cylinder near, a flat bar far away
  const spar = (A, B, r1, r2, kindM, opt = {}) => {
    const p = pt(A[0], A[1]), q = pt(B[0], B[1]);
    if (plain) { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, a1 = Math.max(r1 * s, .1), a2 = Math.max(r2 * s, .1);
      return `<path d="M${f(p[0] + nx * a1)} ${f(p[1] + ny * a1)}L${f(q[0] + nx * a2)} ${f(q[1] + ny * a2)}L${f(q[0] - nx * a2)} ${f(q[1] - ny * a2)}L${f(p[0] - nx * a1)} ${f(p[1] - ny * a1)}Z" fill="${tone(kindM, If * .6)}"/>`; }
    const rm = Math.max(r1, r2) * s;
    return shadeCyl(u, p[0], p[1], q[0], q[1], rm, L, kindM, Object.assign({ r1: r1 * s, r2: r2 * s, outline: clamp(rm * .2, .14, .45), grain: near && rm > 1.3, seed: seed + Math.round(A[0] * 7 + A[1] * 3) }, opt));
  };

  // ——— the hull's lines ———
  const xStem = -hb - sp.bow[0], xAft = hb + sp.over;
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  const Y = (h, X) => h + sheer(X) * clamp(h / sp.free, 0, 1.25);          // a line of the hull at the height h follows the sheer
  const sm = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const tierBase = j => sp.free + sp.tiers.slice(0, j).reduce((a, t) => a + t[1], 0);
  const baseTop = X => sp.free + sp.fc[1] * (1 - sm((X - sp.fc[0] + 1.4) / 2.8)) + sp.tiers.reduce((a, t) => a + t[1] * sm((X - t[0] + 1.4) / 2.8), 0) + sp.taff * sm((X - xAft + 3.5) / 3.5);
  const rail = X => Y(baseTop(X), X);
  const Hs = rail(xStem), hTop = rail(xAft);
  const stemX = h => { const t = h / Hs, p = sp.bow[1]; return -hb - sp.bow[0] * (t < 0 ? t * p * .5 : 1 - Math.pow(1 - Math.min(t, 1), p)); };
  const hC = Y(sp.free * sp.counter, hb), xC = hb + sp.over * .3, kT = (xAft - xC) / (hTop - hC), transX = h => xC + kT * (h - hC);   // the transom's edge
  const hullPts = [], topPts = [];
  for (let h = -6; h < Hs - .05; h += .8) hullPts.push([stemX(h), h]);
  for (let X = xStem; X < xAft - .05; X += .8) topPts.push([X, rail(X)]);
  topPts.push([xAft, hTop]); hullPts.push(...topPts, [xC, hC]);
  for (let i = 1; i <= 6; i++) { const t = i / 6, q = 1 - t; hullPts.push([q * q * xC + 2 * t * q * (hb + sp.over * .02) + t * t * (hb - .3), q * q * hC + 2 * t * q * hC * .74 + t * t * hC * .42]); }
  hullPts.push([hb - 1.4, -6]);
  const hullD = line(hullPts) + 'Z', hullK = sp.hull;
  const strip = (h0, h1, Xa, Xb, step = 2.5) => { const a = [], b = []; for (let X = Xa; X < Xb + step - 1e-6; X += step) { const x = Math.min(X, Xb); a.push([x, Y(h1, x)]); b.unshift([x, Y(h0, x)]); } return poly(a.concat(b)); };
  const along = (h, Xa, Xb, step = 2.5) => { const a = []; for (let X = Xa; X < Xb + step - 1e-6; X += step) { const x = Math.min(X, Xb); a.push([x, Y(h, x)]); } return a; };
  const sideI = t => { const t0 = .4, ny = t > t0 ? sp.tumble * (t - t0) / (1 - t0) : -.9 * Math.pow((t0 - t) / t0, 1.5); return lum([0, ny, 1]); };

  // the quarter gallery and the gun ports
  const gal = sp.gallery, gh0 = hC + .7, gh1 = gh0 + gal[1] * gal[2], gx0 = transX(gh0) - gal[0];
  const ports = [];
  sp.ports.forEach((row, ri) => { const Rr = R('ports' + ri); for (let i = 0; i < row.n; i++) { const X = lerp(row.x0, row.x1, i / (row.n - 1)) + (Rr() - .5) * .3, H = Y(row.h, X), w = row.w || 2, q = Rr(), z = Rr();
    if (X > gx0 - w && H > gh0 - 3) continue;
    let st = q < (row.open != null ? row.open : .5) ? 'open' : 'shut'; if (sp.growth) st = z < .2 ? 'gone' : z < .42 ? 'askew' : st;
    ports.push({ X, H, w, hh: w * .95, st }); } });
  const dp = sp.deckPorts; if (dp[0]) for (let i = 0; i < dp[0]; i++) { const X = lerp(dp[1], dp[2], i / Math.max(1, dp[0] - 1)); if (Math.abs(rail(X + 1.6) - rail(X - 1.6)) > .7 || X > gx0 - 1 && rail(X) - 1.6 < gh1 + 2.6) continue; ports.push({ X, H: rail(X) - 1.6, w: 1.5, hh: 1.4, st: 'deck' }); }

  // ——— the hull's paint ———
  let hull = '';
  const wlClip = nid('hw', u); defs += `<clipPath id="${wlClip}"><rect x="-400" y="-900" width="1000" height="${f(900 + y0)}"/></clipPath>`;
  if (sil) hull += `<path d="${hullD}${ports.map(p => box(p.X, p.H, p.w, p.hh)).join('')}" fill="${C}" fill-rule="evenodd"/>`;
  else {
    const hc = clipOf(hullD), topH = sp.free + 1;
    hull += fillP(hullD, gr([0, 0], [0, topH], [0, .08, .2, .4, .6, .8, 1].map(t => [t, tone(hullK, sideI(t))])));
    let inner = '';
    for (const b of sp.bands) { const km = b.mat || 'paint-ochre', t0 = b.h0 / topH, t1 = b.h1 / topH;
      inner += fillP(strip(b.h0, b.h1, xStem - 3, xAft + 2), gr([0, b.h0], [0, b.h1], [[0, tone(km, sideI(t0))], [1, tone(km, sideI(t1))]]));
      if (!far) inner += strokeP(line(along(b.h0, xStem - 3, xAft + 2)), ink(km), .22 * s, ' opacity=".55"') + strokeP(line(along(b.h1 - .12, xStem - 3, xAft + 2)), tone(km, If + .5), .16 * s, ' opacity=".5"'); }
    const dark = col(mix(L.tone(hullK, -.7, cen[0], cen[1]), '#150d0a', .45)), lite = col(mix(L.tone(hullK, .9, cen[0], cen[1]), L.keyColor, .35));
    if (!far) {
      // strakes: seams that follow the sheer, butt joints, planks of slightly different tone
      const Rp = R('planks'), stepH = near ? 1.25 : 2.3, topMax = Math.max(hTop, Hs) + 1; let seams = '', butts = '', pl = '';
      for (let h = 1.1; h < topMax; h += stepH * (.9 + Rp() * .2)) { const xa = stemX(Math.min(h, Hs)) + .2;
        seams += line(along(h, xa, xAft + 1, 3));
        if (near) for (let X = xa + 4 + Rp() * 9; X < xAft; X += 8 + Rp() * 12) { butts += seg([X, Y(h, X)], [X, Y(h + stepH, X)]);
          if (Rp() > .45) { const l = 5 + Rp() * 9; pl += fillP(strip(h, h + stepH, X, X + l, 2.5), Rp() > .5 ? lite : dark, ` opacity="${f(.05 + Rp() * .09)}"`); } } }
      inner += pl + strokeP(seams, dark, clamp(.13 * s, .12, .3), ' opacity=".42"') + strokeP(butts, dark, clamp(.13 * s, .12, .3), ' opacity=".4"');
      // wales: thick strakes with light on the upper edge and shadow under them
      for (const h of sp.wales) { const a = along(h, xStem - 3, xAft + 2);
        inner += strokeP(line(a), tone(hullK, sideI(h / topH) - .18), .95 * s) + strokeP(line(a.map(p => [p[0], p[1] + .42])), lite, .16 * s, ' opacity=".5"') + strokeP(line(a.map(p => [p[0], p[1] - .62])), dark, .3 * s, ' opacity=".55"'); }
      // the mouldings of the decks: the waist's rail carried aft, the deck line of every tier, the forecastle
      const mould = (h, Xa, Xb) => { const a = along(h, Xa, Xb); return strokeP(line(a), dark, .5 * s, ' opacity=".7"') + strokeP(line(a.map(p => [p[0], p[1] + .26])), sp.gilt ? tone('brass', If + .35) : lite, .2 * s, ` opacity="${sp.gilt ? .8 : .5}"`); };
      inner += mould(sp.free - .1, xStem, sp.fc[0] - 1) + mould(sp.free - .1, sp.tiers[0][0] - 1, xAft + 2);
      sp.tiers.forEach((t, j) => { if (j) inner += mould(tierBase(j) - .1, t[0] - 1, xAft + 2); });
      // the cap of the rail along the top edge
      inner += strokeP(line(topPts.map(p => [p[0], p[1] - .3])), tone(sp.trim, If + .3), .55 * s, ' opacity=".8"') + strokeP(line(topPts.map(p => [p[0], p[1] - .75])), dark, .22 * s, ' opacity=".55"');
    }
    // the round of the bow and of the quarter: lighter or darker than the flat side by the light
    const turn = (n, Xa, Xb) => { const dI = lum(n) - If; if (Math.abs(dI) < .04) return ''; const c = dI > 0 ? lite : dark, a0 = dI > 0 ? clamp(dI * .5, 0, .5) : clamp(-dI * .75, 0, .62);
      return fillP(poly([[Math.min(Xa, Xb) - 4, -7], [Math.max(Xa, Xb) + 4, -7], [Math.max(Xa, Xb) + 4, 60], [Math.min(Xa, Xb) - 4, 60]]), gr([Xa, 0], [Xb, 0], [[0, c, a0], [.45, c, a0 * .45], [1, c, 0]])); };
    inner += turn([-.8, 0, .6], xStem, -hb + sp.len * .2) + turn([.62, 0, .78], xAft, hb - sp.len * .1);
    // wet planks at the waterline
    inner += fillP(strip(-1, 2.2, xStem - 3, xAft + 2, 6), gr([0, 0], [0, 2.2], [[0, sp.growth ? tone('ship-weed', -.5) : dark, .75], [1, dark, 0]]));
    hull += `<g clip-path="url(#${hc})">${inner}</g>`;
    // the ports
    const Rq = R('lids'), hole = col(mix(L.tone(hullK, -1, cen[0], cen[1]), '#17100c', .7)), lidK = sp.bands.length && kind === 'endeavour' ? 'tar' : hullK; let pr = '';
    for (const p of ports) { const hw = p.w / 2, hh = p.hh / 2, jit = Rq(), j2 = Rq();
      if (far) { pr += fillP(box(p.X, p.H, p.w, p.hh), hole, ' opacity=".8"'); continue; }
      if (p.st === 'shut') { pr += fillP(box(p.X, p.H, p.w, p.hh), tone(lidK, If + (jit - .5) * .3), ` stroke="${ink(lidK)}" stroke-width="${f(.2 * s)}"`) + strokeP(seg([p.X - hw * .5, p.H + hh], [p.X - hw * .5, p.H + hh * .2]) + seg([p.X + hw * .5, p.H + hh], [p.X + hw * .5, p.H + hh * .2]), tone('iron', If), .16 * s) + dot(p.X, p.H - hh * .35, .22) + ` fill="none" stroke="${tone('iron', If + .2)}" stroke-width="${f(.12 * s)}"/>`; continue; }
      pr += fillP(box(p.X, p.H, p.w, p.hh), hole) + strokeP(seg([p.X - hw, p.H - hh], [p.X + hw, p.H - hh]), lite, .14 * s, ' opacity=".5"');
      if (p.st !== 'deck' || jit > .25) { const r = p.st === 'deck' ? .42 : .56; pr += dot(p.X + (j2 - .5) * .3, p.H - .1, r) + ` fill="${tone('iron', If + .25)}" stroke="${ink('iron')}" stroke-width="${f(.14 * s)}"/>` + dot(p.X + (j2 - .5) * .3, p.H - .1, r * .5) + ` fill="${hole}"/>`; }
      if (p.st === 'open') { const up = hh * (.9 + jit * .5), lean = (j2 - .5) * .3; // the lid lifted: its underside in shadow, two lanyards
        pr += fillP(poly([[p.X - hw, p.H + hh], [p.X + hw, p.H + hh], [p.X + hw + lean, p.H + hh + up], [p.X - hw + lean, p.H + hh + up]]), tone(lidK, If - .35), ` stroke="${ink(lidK)}" stroke-width="${f(.18 * s)}"`)
          + strokeP(seg([p.X - hw + lean, p.H + hh + up], [p.X + hw + lean, p.H + hh + up]), lite, .16 * s, ' opacity=".6"') + (near ? strokeP(seg([p.X - hw * .6 + lean, p.H + hh + up], [p.X - hw * .3, p.H + hh + up + 1]) + seg([p.X + hw * .6 + lean, p.H + hh + up], [p.X + hw * .3, p.H + hh + up + 1]), dark, .1 * s, ' opacity=".7"') : ''); }
      if (p.st === 'askew') { const a = (jit - .3) * 1.1, c = Math.cos(a), sn = Math.sin(a), hx = p.X - hw, hy = p.H + hh, q = (x, y) => [hx + x * c - y * sn, hy + x * sn + y * c]; // a lid hanging on one hinge
        pr += fillP(poly([q(0, 0), q(p.w, 0), q(p.w, -p.hh), q(0, -p.hh)]), tone(lidK, If - .15), ` stroke="${ink(lidK)}" stroke-width="${f(.18 * s)}"`); }
    }
    hull += pr;
  }

  // ——— the stern: the transom's strip turned to the viewer, the quarter gallery, windows, the lantern ———
  let stern = '', glowAt = [];
  const tw = h => lerp(sp.tw[1], sp.tw[0], clamp((h - hC) / (hTop - hC))), lightC = sp.growth ? '#bff5d8' : '#ffd27a', lightHot = sp.growth ? '#eafff2' : '#fff1c4';
  const glass = (d, cx, cy, r) => { if (sil) return ''; // a window: warm light inside, or dark glass with the sky in it
    if (o.lights && !far) { const id = nid('hl', u), p = pt(cx, cy); defs += `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * s)}"><stop offset="0" stop-color="${lightHot}"/><stop offset=".6" stop-color="${lightC}"/><stop offset="1" stop-color="${mix(lightC, '#a8521a', sp.growth ? .15 : .45)}"/></radialGradient>`; return fillP(d, `url(#${id})`); }
    return fillP(d, o.lights ? col(lightC) : tone('glass', If - .3)) + (far || o.lights ? '' : fillP(d, col(L.fillColor), ' opacity=".28"')); };
  {
    const tA = [xAft, hTop], arch = sp.tw[0] * .32 + .6;
    const trPoly = 'M' + pp(xC, hC) + 'L' + pp(tA[0], tA[1]) + 'Q' + pp(xAft + sp.tw[0] * .5, hTop + arch * 1.5) + ' ' + pp(xAft + sp.tw[0], hTop + arch * .2) + 'L' + pp(xC + sp.tw[1], hC + .5) + 'Z';
    const under = poly([[xC, hC], [xC + sp.tw[1], hC + .5], [hb + sp.tw[1] * .3, hC * .5], [hb - .3, hC * .42], [hb + sp.over * .02, hC * .74]]);
    const rud = poly([[hb - .4, hC * .5], [hb + 1.5, hC * .46], [hb + 1.1, -6], [hb - 1.4, -6]]);
    const nT = [.74, .1, .66];
    stern += fillP(rud, tone(hullK, lum(nT) - .35)) + edge(rud, hullK, .7) + fillP(under, tone(hullK, -.85)) + edge(under, hullK, .7);
    stern += fillP(trPoly, gr([xC, hC], [xAft, hTop + arch], [[0, tone(hullK, lum(nT) - .25)], [1, tone(hullK, lum(nT) + .1)]]));
    if (!plain) { // the tiers on the transom, the windows of every tier, a carved crest
      const tc = clipOf(trPoly); let inn = '';
      const levels = [gh0]; for (let j = 1; j < gal[1]; j++) levels.push(gh0 + j * gal[2]); sp.tiers.forEach((t, j) => { const h = Y(tierBase(j + 1), xAft) + .9; if (h > levels[levels.length - 1] + gal[2] * .9 && h < hTop - 2.6) levels.push(h); });
      for (const h of levels) { const e = transX(h), w = tw(h), wh = Math.min(gal[2] - 1.3, 3.2), n = w > 5 ? 2 : 1;
        inn += strokeP(seg([e - 1, h - .5], [e + w + 1, h - .3]), sp.gilt ? tone('brass', lum(nT) + .3) : tone(sp.trim, lum(nT) + .3), .3 * s, ' opacity=".85"');
        for (let i = 0; i < n; i++) { const a = e + w * (.14 + i * .86 / n), b = a + w * (.72 / n - .08), k2 = kT * wh;
          inn += glass(poly([[a, h], [b, h + .08], [b + k2, h + wh], [a + k2, h + wh]]), (a + b) / 2, h + wh / 2, wh) + strokeP(poly([[a, h], [b, h + .08], [b + k2, h + wh], [a + k2, h + wh]]) + seg([(a + b) / 2, h], [(a + b) / 2 + k2, h + wh]) + seg([a + k2 / 2, h + wh / 2], [b + k2 / 2, h + wh / 2]), ink(hullK), .16 * s); } }
      inn += strokeP('M' + pp(xAft + .4, hTop - .5) + 'Q' + pp(xAft + sp.tw[0] * .5, hTop + arch * 1.25 - .5) + ' ' + pp(xAft + sp.tw[0] - .3, hTop + arch * .2 - .5), sp.gilt ? tone('brass', lum(nT) + .4) : tone(sp.trim, lum(nT) + .35), .45 * s, ' opacity=".9"');
      stern += `<g clip-path="url(#${tc})">${inn}</g>` + rim(trPoly, tc, [xAft, (hC + hTop) / 2], hTop - hC, .9);
    }
    stern += edge(trPoly, hullK);
    // the quarter gallery: a bay of windows on the side, a roof above, a drop below
    const gx = (h, t) => { const b = transX(h); return b - gal[0] * (1 - .1 * (h - gh0) / (gh1 - gh0)) * (1 - t); };
    const body = poly([[gx(gh0, 0), gh0], [gx(gh0, 1) + .5, gh0], [gx(gh1, 1) + .5, gh1], [gx(gh1, 0), gh1]]);
    const drop = spl([[gx(gh0, 0), gh0], [gx(gh0, .14), gh0 - 1.2], [gx(gh0, .5), gh0 - 2.3], [gx(gh0, .86), gh0 - 1.4], [gx(gh0, 1) + .5, gh0]], false) + 'Z';
    const roof = spl([[gx(gh1, 0) - .4, gh1], [gx(gh1, .2), gh1 + 1.3], [gx(gh1, .58), gh1 + 2.1], [gx(gh1, .92), gh1 + 1.5], [gx(gh1, 1) + .7, gh1]], false) + 'Z';
    const gI = t => lum([lerp(-.55, .5, t), .1, .85]);
    if (sil) stern += fillP(body + drop + roof, C); else {
      stern += (far ? '' : fillP(poly([[gx(gh0, 0) - .5, gh0 - 3.4], [gx(gh0, 1), gh0 - 3], [gx(gh0, 1), gh0], [gx(gh0, 0), gh0]]), col(mix(L.tone(hullK, -.8, cen[0], cen[1]), '#150d0a', .4)), ' opacity=".45"'))
        + fillP(drop, tone(sp.trim, lum([0, -.6, .8]))) + edge(drop, sp.trim, .8)
        + fillP(body, gr([gx(gh0, 0), gh0], [gx(gh0, 1), gh0], [0, .3, .6, 1].map(t => [t, tone(sp.gilt ? sp.trim : hullK, gI(t))]))) + fillP(roof, gr([0, gh1], [0, gh1 + 2.1], [[0, tone(hullK, lum([0, .3, .9]) - .1)], [1, tone(hullK, lum([0, .8, .6]))]]));
      const nw = Math.max(2, Math.round(gal[0] / 3.4));
      for (let j = 0; j < gal[1]; j++) { const h0 = gh0 + j * gal[2] + .55, h1 = h0 + gal[2] - 1.3;
        for (let i = 0; i < nw; i++) { const t0 = (i + .16) / nw, t1 = (i + .86) / nw, w = poly([[gx(h0, t0), h0], [gx(h0, t1), h0], [gx(h1, t1), h1], [gx(h1, t0), h1]]);
          stern += glass(w, (gx(h0, t0) + gx(h1, t1)) / 2, (h0 + h1) / 2, gal[2] * .8) + (far ? '' : strokeP(w + seg([gx(h0, (t0 + t1) / 2), h0], [gx(h1, (t0 + t1) / 2), h1]) + seg([gx((h0 + h1) / 2, t0), (h0 + h1) / 2], [gx((h0 + h1) / 2, t1), (h0 + h1) / 2]), ink(hullK), .16 * s)); }
        if (!far) stern += strokeP(seg([gx(h0 - .55, 0) - .3, h0 - .5], [gx(h0 - .55, 1) + .6, h0 - .5]), sp.gilt ? tone('brass', If + .4) : tone(sp.trim, If + .3), .34 * s) + (sp.gilt ? strokeP(sag([gx(h1, 0), h1 + .3], [gx(h1, .5), h1 + .3], -.35) + sag([gx(h1, .5), h1 + .3], [gx(h1, 1), h1 + .3], -.35), tone('brass', If + .4), .2 * s) : ''); }
      if (!far) { const Rr = R('roof'); let tiles = ''; for (let i = 1; i < 6; i++) tiles += sag([gx(gh1, i / 6 - .02), gh1 + .15], [gx(gh1, .5 + (i / 6 - .5) * .35), gh1 + 1.9 + Rr() * .15], .2); stern += strokeP(tiles, ink(hullK), .13 * s, ' opacity=".6"') + edge(body, hullK, .8) + edge(roof, hullK, .8); }
      glowAt.push([transX((gh0 + gh1) / 2) - gal[0] * .4, (gh0 + gh1) / 2, gal[0] * 1.2 + gal[1] * 3]);
    }
    // small windows of the upper tiers on the side
    if (!plain && sp.tierWin) sp.tiers.forEach((t, j) => { const hb0 = tierBase(j + 1); if (j === 0 && sp.tiers.length > 1 && gh1 + 2 > Y(hb0, hb)) return; const Rr = R('tw' + j);
      for (let i = 0; i < sp.tierWin; i++) { const X = transX(Y(hb0, xAft)) - 3.2 - i * 3.4 - Rr() * .4; if (X < t[0] + 2) break; const H = Y(hb0 - t[1] * .55, X), w = box(X, H, 1.5, 1.7);
        if (H < gh1 + 2.4 && X > gx0 - 1) continue;
        stern += glass(w, X, H, 1.6) + strokeP(w + seg([X, H - .85], [X, H + .85]), ink(hullK), .15 * s) + strokeP(seg([X - .95, H + 1], [X + .95, H + 1]), sp.gilt ? tone('brass', If + .4) : tone(sp.trim, If + .3), .22 * s); } });
    // the stern lantern on the taffrail
    if (sp.lantern && !far) { const z = sp.lantern * Lu * .95, lx = xAft + sp.tw[0] * .5, ly = hTop + arch * .7, q = (a, b) => [lx + a * z + kT * b * z * .5, ly + 1.2 * z + b * z];
      const bodyL = poly([q(-.5, 0), q(.5, 0), q(.9, 2), q(.55, 2.5), q(-.55, 2.5), q(-.9, 2)]), capL = poly([q(-.75, 2.5), q(.75, 2.5), q(.2, 3.3), q(0, 3.9), q(-.2, 3.3)]);
      stern += strokeP(seg([lx, ly - .4], q(0, 0)), tone('iron', If), .3 * s);
      if (sil) stern += fillP(bodyL + capL, C); else { stern += glass(bodyL, q(0, 1.2)[0], q(0, 1.2)[1], 1.6 * z) + strokeP(bodyL + seg(q(0, 0), q(0, 2.5)) + seg(q(-.7, 1), q(.7, 1)), tone('brass', If + .1), .2 * s) + fillP(capL, tone('brass', If + .2), ` stroke="${ink('brass')}" stroke-width="${f(.16 * s)}"`); glowAt.push([q(0, 1.2)[0], q(0, 1.2)[1], 5 * z + 3]); } }
  }
  // an open rail with stanchions on the upper tiers; channels of the shrouds come later
  if (sp.openRail != null && !far && sp.tiers[sp.openRail]) { const Xa = sp.tiers[sp.openRail][0] + 1.6, Rr = R('rail'); let posts = '', hand = [];
    for (let X = Xa; X < xAft - .6; X += 1.5 + Rr() * .2) { posts += seg([X, rail(X) - .1], [X, rail(X) + 1.25]); hand.push([X, rail(X) + 1.25]); }
    if (hand.length > 1) stern += strokeP(posts, tone(sp.trim, If + .1), .26 * s) + strokeP(line(hand), tone(sp.trim, If + .3), .36 * s); }

  // ——— the beakhead, the bowsprit, the anchor ———
  const bs = sp.sprit, B0 = [xStem + 3.2, Hs - .9], bd = [-Math.cos(rad(bs.steeve)), Math.sin(rad(bs.steeve))], Bp = t => [B0[0] + bd[0] * bs.len * t, B0[1] + bd[1] * bs.len * t];
  const Bend = bs.jib ? [Bp(1)[0] + bd[0] * bs.jib, Bp(1)[1] + bd[1] * bs.jib + .4] : Bp(1);
  let bow = '', bowBack = '';
  {
    const bk = sp.beak, topS = Y(sp.free, xStem) - .5, dep = bk[2] ? bk[2] * Lu : topS - .8, h1 = topS - dep, tip = [xStem - bk[0], topS + bk[1]], sA = [stemX(topS) + .6, topS], sB = [stemX(h1) + .6, h1];
    const lower = bk[2] ? [sB, [lerp(sB[0], tip[0], .45), lerp(sB[1], tip[1], .3)], [lerp(sB[0], tip[0], .8), lerp(sB[1], tip[1], .72)], [tip[0], tip[1] - .5]]
      : [sB, [sB[0] - bk[0] * .34, h1 + dep * .1], [sB[0] - bk[0] * .62, h1 + dep * .42], [lerp(sB[0], tip[0], .86), h1 + dep * .76], [tip[0], tip[1] - .7]];
    const beakD = spl(lower.concat([[tip[0] - .2, tip[1] + .4], [lerp(tip[0], sA[0], .5), lerp(tip[1], sA[1], .5) - .1 - bk[1] * .22], sA]), false) + 'L' + pp(sA[0] + 1, sA[1] - .5) + 'L' + pp(sB[0] + 1, sB[1]) + 'Z';
    const R1 = [[sA[0] + 1.6, sA[1] + 1.1], [lerp(sA[0], tip[0], .5), lerp(sA[1], tip[1], .5) + .55 - bk[1] * .2], [tip[0] + .6, tip[1] + .75]], hR = topS - Math.min(dep, 4.2 * Lu) * .55, R2 = [[sA[0] + .4, hR], [lerp(sA[0], tip[0], .5), lerp(hR, tip[1], .5) - .25], [tip[0] + 1, tip[1] - .1]];
    bow += fillP(beakD, tone(hullK, If - .3)) + edge(beakD, hullK, .8);
    if (!plain) { let tim = ''; for (const t of [.25, .5, .75]) tim += seg([lerp(R1[0][0], R1[2][0], t), lerp(R1[0][1], R1[2][1], t) + .3], [lerp(R2[0][0], R2[2][0], t), lerp(R2[0][1], R2[2][1], t) - .1]);
      bow += strokeP(tim, tone(sp.trim, If), .28 * s) + strokeP(spl(R1) + spl(R2), sp.gilt ? tone('brass', If + .2) : tone(sp.trim, If + .25), .42 * s) + strokeP(spl(R1), ink(sp.trim), .12 * s, ' opacity=".5"'); }
    // a carved billet at the head: a dark scroll, no figure
    bow += dot(tip[0] - .2, tip[1] + .5, 1.05 * Lu) + ` fill="${tone(hullK, If - .2)}"${ow ? ` stroke="${ink(hullK)}" stroke-width="${f(ow * .7)}"` : ''}/>` + (plain ? '' : strokeP('M' + pp(tip[0] + .5, tip[1] + .3) + 'Q' + pp(tip[0] - .2, tip[1] + 1.4) + ' ' + pp(tip[0] - .8, tip[1] + .5) + 'Q' + pp(tip[0] - .3, tip[1] - .1) + ' ' + pp(tip[0] - .1, tip[1] + .6), sp.gilt ? tone('brass', If + .3) : tone(sp.trim, If + .35), .2 * s));
    bowBack += spar(B0, Bp(1), .95 * Lu, .62 * Lu, sp.spar);
    if (bs.jib) bowBack += spar([Bp(.72)[0], Bp(.72)[1] + .9], Bend, .48 * Lu, .3 * Lu, sp.spar);
    if (near) bow += strokeP(seg([B0[0] - 1.2, B0[1] + .9], [B0[0] - 2.6, B0[1] - 2.2]) + seg([B0[0] - 2, B0[1] + 1.4], [B0[0] - 3.4, B0[1] - 1.8]), tone('rope', If - .2), .22 * s);
    if (!plain && kind !== 'merchant') { // the anchor at the cathead
      const ax = xStem + 7.5, ay = Hs - 1.2, z = Lu, q = (a, b) => [ax + a * z, ay + b * z], ir = tone('iron', If + .1);
      bow += fillP(box(ax, ay + .2, 1.1 * z, 1 * z), tone(sp.trim, If + .2), ` stroke="${ink(sp.trim)}" stroke-width="${f(.2 * s)}"`) + strokeP(seg(q(0, -.3), q(-.3, -1.6)), tone('rope', If), .2 * s)
        + strokeP(seg(q(-.3, -1.9), q(-.8, -7.4)), ir, .5 * s, ' stroke-linecap="round"') + strokeP('M' + pp(...q(-2.9, -5.6)) + 'Q' + pp(...q(-1, -8.6)) + ' ' + pp(...q(1.3, -6.2)), ir, .46 * s, ' stroke-linecap="round"')
        + fillP(poly([q(-2.9, -5.6), q(-3.3, -6.6), q(-2.2, -6.5)]) + poly([q(1.3, -6.2), q(1.9, -7.1), q(.8, -7.2)]), ir) + strokeP(seg(q(-1.5, -2.5), q(.9, -2.2)), tone(sp.trim, If), .5 * s) + dot(...q(-.3, -1.75), .32 * z) + ` fill="none" stroke="${ir}" stroke-width="${f(.16 * s)}"/>`; }
  }

  // ——— masts, yards, sails ———
  const ropeD = sil ? C : col(mix(L.tone('tar', If * .5, cen[0], cen[1]), '#17110d', .35)), ropeL = tone('rope', If - .1), sailK = sp.sail, cond = sp.cond;
  // a sail on a map S(u, v) -> local point: u — from the fore edge to the aft one, v — from the head to the foot
  const cloth = (S, q) => {
    const Rr = R(q.name), N = 14, pts = [], wd = q.wd, ht = q.ht, rough = cond !== 'whole' && q.tear !== false;
    pts.push(S(0, 0), S(1, 0));
    const jag = cond === 'rags' ? .05 : 0;
    for (let i = 1; i <= N; i++) pts.push(S(1 - (jag ? Rr() * jag * Math.sin(Math.PI * i / N) : 0), i / N));
    if (rough && q.foot !== false) { // a torn foot: notches of different depth, tatters
      const nn = cond === 'rags' ? 5 + Math.floor(Rr() * 4) : cond === 'torn' ? 2 + Math.floor(Rr() * 3) : 1 + Math.floor(Rr() * 2), notch = [];
      for (let i = 0; i < nn; i++) notch.push([.08 + Rr() * .84, (cond === 'rags' ? .1 + Rr() * .34 : .05 + Rr() * .17), .02 + Rr() * .05]);
      const us = []; for (let i = 1; i < Math.max(8, Math.round(wd / 1.1)); i++) us.push(i / Math.max(8, Math.round(wd / 1.1))); for (const n of notch) us.push(n[0], n[0] - n[2], n[0] + n[2]);
      us.filter(v => v > .02 && v < .98).sort((a, b) => b - a).forEach(uu => { let dv = (cond === 'rags' ? .05 : .018) * Rr(); for (const n of notch) dv = Math.max(dv, n[1] * Math.max(0, 1 - Math.abs(uu - n[0]) / n[2])); pts.push(S(uu, 1 - dv)); });
    } else for (let i = 1; i < N; i++) pts.push(S(1 - i / N, 1));
    for (let i = 0; i < N; i++) pts.push(S(jag ? Rr() * jag * Math.sin(Math.PI * i / N) : 0, 1 - i / N));
    const dOut = line(pts) + 'Z'; let dHole = '', threads = '';
    if (rough) { // slits with pointed ends and ragged holes inside the cloth
      const area = wd * ht, n = Math.round(area / (cond === 'rags' ? 55 : cond === 'torn' ? 105 : 240) * (.6 + Rr() * .8));
      for (let i = 0; i < n; i++) { const slit = Rr() < (cond === 'rags' ? .45 : cond === 'torn' ? .8 : .5), cu = .13 + Rr() * .74, cv = .15 + Rr() * .64, lean = (Rr() - .5) * .6, hp = [];
        const at = (du, dv) => S(clamp(cu + du / wd + lean * dv / wd, .04, .96), clamp(cv + dv / ht, .05, .93));
        if (slit) { const l = (cond === 'torn' ? 3 + Rr() * 7.5 : 1.8 + Rr() * 5.5) * (cond === 'rags' ? 1.25 : 1), w = .25 + Rr() * .5 + l * .045, m = 3 + Math.floor(Rr() * 2);
          hp.push(at(0, -l / 2)); for (let k = 1; k <= m; k++) hp.push(at(w * (.5 + Rr() * .7) * Math.sin(Math.PI * k / (m + 1)), -l / 2 + l * (k + (Rr() - .5) * .5) / (m + 1)));
          hp.push(at((Rr() - .5) * w, l / 2)); for (let k = m; k >= 1; k--) hp.push(at(-w * (.4 + Rr() * .7) * Math.sin(Math.PI * k / (m + 1)), -l / 2 + l * (k + (Rr() - .5) * .5) / (m + 1)));
        } else { const ru = .7 + Rr() * 1.7, rv = (1 + Rr() * 2.4) * (cond === 'rags' ? 1.3 : 1), m = 7 + Math.floor(Rr() * 4);
          for (let k = 0; k < m; k++) { const a = (k + Rr() * .5) / m * 2 * Math.PI, rr = k % 2 ? .45 + Rr() * .35 : .8 + Rr() * .5; hp.push(at(Math.sin(a) * ru * rr, Math.cos(a) * rv * rr)); }
          if (near && Rr() > .4) threads += seg(at(-ru * .5, -rv * (.2 + Rr() * .5)), at(ru * .5, rv * (.1 + Rr() * .5))); }
        dHole += line(hp) + 'Z'; }
    }
    const d = dOut + dHole;
    const paint = gr(S(0, .5), S(1, .5), [0, .2, .4, .6, .8, 1].map(t => [t, tone(sailK, lum([lerp(q.nF[0], q.nA[0], t), lerp(q.nF[1], q.nA[1], t), lerp(q.nF[2], q.nA[2], t)]))]));
    let out = `<path d="${d}" fill="${paint}" fill-rule="evenodd"/>`;
    if (sil) return out;
    const Im = lum([(q.nF[0] + q.nA[0]) / 2, .1, (q.nF[2] + q.nA[2]) / 2]), shade = tone(sailK, Im - .5), cid = clipOf(d); let inn = '';
    if (!far) { // cloths: seams along the sail, every cloth of its own tone
      const nc = Math.max(3, Math.round(wd / 2.3)), cuts = []; let seams = '';
      for (let i = 0; i <= nc; i++) cuts.push(clamp((i + (i && i < nc ? (Rr() - .5) * .3 : 0)) / nc));
      const col2 = uu => [0, .2, .4, .6, .8, 1].map(v => S(uu, v));
      for (let i = 0; i < nc; i++) { if (i) seams += line(col2(cuts[i])); if (near && Rr() > .4) inn += fillP(poly(col2(cuts[i]).concat(col2(cuts[i + 1]).reverse())), Rr() > .5 ? shade : tone(sailK, Im + .4), ` opacity="${f(.05 + Rr() * .08)}"`); }
      inn += strokeP(seams, shade, clamp(.15 * s, .12, .3), ` opacity="${back ? .6 : .45}"`);
      if (q.reef) for (const v of q.reef) { const a = []; for (let i = 0; i <= 8; i++) a.push(S(i / 8, v)); inn += strokeP(line(a), shade, .5 * s, ' opacity=".3"');
        if (near) { let rp = ''; for (let i = 1; i < nc * 2; i++) { const p = S(i / (nc * 2), v); rp += seg(p, [p[0] + (Rr() - .5) * .3, p[1] - .8 - Rr() * .4]); } inn += strokeP(rp, shade, .13 * s, ' opacity=".6"'); } }
      if (rough) { // stains, patches
        const sid = nid('hs', u); defs += `<radialGradient id="${sid}"><stop offset="0" stop-color="${shade}" stop-opacity="1"/><stop offset="1" stop-color="${shade}" stop-opacity="0"/></radialGradient>`;
        for (let i = 0; i < 2 + Math.round(wd * ht / 200); i++) { const p = pt(...S(.1 + Rr() * .8, .1 + Rr() * .8)); inn += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f((2 + Rr() * 4) * s)}" ry="${f((2 + Rr() * 5) * s)}" fill="url(#${sid})" opacity="${f(.2 + Rr() * .3)}"/>`; }
        const np = cond === 'patched' ? 1 + Math.round(wd * ht / 260) : cond === 'torn' && Rr() > .5 ? 1 : 0;
        for (let i = 0; i < np; i++) { const cu = .15 + Rr() * .7, cv = .15 + Rr() * .65, du = (1.4 + Rr() * 1.6) / wd, dv = (1.6 + Rr() * 2) / ht, j = () => (Rr() - .5) * .25, pd = poly([S(cu - du * (1 + j()), cv - dv * (1 + j())), S(cu + du * (1 + j()), cv - dv * (1 + j())), S(cu + du * (1 + j()), cv + dv * (1 + j())), S(cu - du * (1 + j()), cv + dv * (1 + j()))]);
          inn += fillP(pd, Rr() > .5 ? tone(sailK, Im + .35) : shade, ' opacity=".5"') + (near ? strokeP(pd, shade, .14 * s, ` stroke-dasharray="${f(.5 * s)} ${f(.4 * s)}" opacity=".8"`) : ''); }
      }
      if (back && q.mastU != null) { const a = []; for (let i = 0; i <= 6; i++) a.push(S(q.mastU, i / 6)); inn += strokeP(line(a), shade, 1.3 * Lu * s, ' opacity=".2"'); }   // the mast seen through the cloth
    }
    // the turn of the cloth: shadow under the yard, the foot rolled under, a light belly
    inn += fillP(d, gr(S(.5, 0), S(.5, 1), [[0, shade, back ? .25 : .5], [.07, shade, back ? .1 : .22], [.2, shade, 0], [.7, shade, 0], [1, shade, .34]]), ' fill-rule="evenodd"');
    if (!far) { const bid = nid('hb', u), c = pt(...S(.4 - .15 * dir * dC.dx, .45)), lt = back ? mix(tone(sailK, -1), col(L.keyColor), .34) : tone(sailK, Im + .55); defs += `<radialGradient id="${bid}" gradientUnits="userSpaceOnUse" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(Math.min(wd, ht) * .62 * s)}"><stop offset="0" stop-color="${lt}" stop-opacity="${back ? .62 : .5}"/><stop offset=".55" stop-color="${lt}" stop-opacity="${back ? .3 : .22}"/><stop offset="1" stop-color="${lt}" stop-opacity="0"/></radialGradient>`; inn += fillP(d, `url(#${bid})`, ' fill-rule="evenodd"'); }
    out += `<g clip-path="url(#${cid})">${inn}</g>`;
    if (!far) out += strokeP(threads, shade, .12 * s, ' opacity=".8"') + rim(dOut, cid, S(.5, .5), Math.max(wd, ht) * .6, .9, 1.1) + strokeP(dHole, ink(sailK), clamp(.2 * s, .15, .3), ' stroke-linejoin="round" opacity=".85"') + strokeP(dOut, ink(sailK), clamp(ow * .85, .4, .8), ' stroke-linejoin="round"');
    return out;
  };
  // a furled sail: a lumpy roll under the yard with gaskets
  const furl = (c, hw, name, k = 1) => { const Rr = R(name), n = Math.max(4, Math.round(hw * 2 / 2.4)), a = [[c[0] - hw, c[1] - .1]], b = [];
    for (let i = 0; i <= n; i++) { const t = i / n; b.push([c[0] - hw + 2 * hw * t, c[1] - .25 - (.7 + Rr() * .7) * k * Lu * Math.pow(Math.sin(Math.PI * clamp(t, .04, .96)), .4)]); }
    const d = spl(a.concat(b, [[c[0] + hw, c[1] - .1]]), false) + 'Z'; let g = '';
    if (!plain) for (let i = 1; i < n; i++) g += seg([b[i][0], c[1] + .2], [b[i][0] + .15, b[i][1] - .1]);
    return fillP(d, gr([c[0], c[1]], [c[0], c[1] - 1.6 * k * Lu], [[0, tone(sailK, lum([0, .6, .8]))], [1, tone(sailK, lum([0, -.7, .7]))]])) + strokeP(g, ink(sailK), .14 * s, ' opacity=".7"') + (ow ? strokeP(d, ink(sailK), Math.max(.25, ow * .6)) : ''); };
  const sqMap = (hc, hw, fc, fw, bel, roach) => (uu, v) => { const X = lerp(hc[0] + (2 * uu - 1) * hw, fc[0] + (2 * uu - 1) * fw, v), H = lerp(hc[1], fc[1], v), sv = Math.pow(Math.sin(Math.PI * v), .85); return [X - bel * sv * (.72 + .6 * (1 - uu)), H + roach * 4 * uu * (1 - uu) * v * v]; };
  const quadMap = (c00, c10, c01, c11, bel, roach) => (uu, v) => { const a = [lerp(c00[0], c10[0], uu), lerp(c00[1], c10[1], uu)], b = [lerp(c01[0], c11[0], uu), lerp(c01[1], c11[1], uu)]; return [lerp(a[0], b[0], v) - bel * Math.sin(Math.PI * v) * (.25 + .75 * uu), lerp(a[1], b[1], v) + roach * 4 * uu * (1 - uu) * v * v - bel * .25 * Math.sin(Math.PI * v) * uu]; };
  const nSq = [[-.82, .12, .52], [.28, .12, .94]], nFa = [[-.4, .05, .9], [.3, .05, .94]];

  const masts = sp.masts.map((m, mi) => { const hD = rail(m.x) - 1.5, Hm = m.H - hD, rk = Math.tan(rad(m.rake || 0)), A = q => [m.x + rk * q * Hm, hD + q * Hm], Q = QY[m.n], qs = Q.slice(), st = [];
    for (let i = 0; i < m.n; i++) { st[i] = i === 0 && m.aft && !m.lower ? 'bare' : set === 'furled' ? 'furl' : set === 'reefed' ? (i === 1 ? 'reef' : 'furl') : 'set';
      if (i && st[i] === 'reef') qs[i] = lerp(Q[i - 1], Q[i], .66); if (i && st[i] === 'furl') qs[i] = lerp(Q[i - 1], Q[i], i === 1 ? .5 : .62); }
    const w = Q.map((_, i) => WY[i] * sp.len * m.k), qT = Q[0] + .035, qC = m.n >= 3 ? Q[1] + .03 : null, rr = Lu * Math.pow(m.k, .6) * (m.n === 2 && sp.len < 80 ? .9 : 1);
    return { m, mi, hD, Hm, A, Q, qs, st, w, qT, qC, rr }; });
  let rigBack = '', sails = '', spars = '', rigFront = '', standing = '', running = '', thin = '';
  // stays: from every masthead forward and down to the mast ahead or to the bowsprit
  masts.forEach((M, i) => { const P = masts[i - 1], heads = [M.A(M.qT - .01), M.A(M.qC != null ? M.qC : 1), M.A(1)];
    if (!P) { standing += seg(heads[0], Bp(.5)) + seg(heads[1], Bp(.96)); if (M.qC != null) standing += seg(heads[2], Bend); if (!far) standing += seg(Bp(.72), [stemX(sp.free * .3) - .3, sp.free * .3]); }
    else { standing += seg(heads[0], P.A(.04)) + seg(heads[1], P.A(P.qT)); if (M.qC != null) standing += seg(heads[2], P.A(P.qC != null ? P.qC : 1)); } });
  rigBack += strokeP(standing, ropeD, rw(.24), far ? ' opacity=".5"' : ' opacity=".9"'); standing = '';
  masts.forEach(M => { const { m, A, Q, qs, st, w, qT, qC, rr, hD, Hm } = M, nm = 'm' + M.mi;
    // the mast: lower mast, topmast, topgallant mast; the top and the crosstrees
    let mast = spar(A(0), A(Q[0] + .09), 1.15 * rr, .92 * rr, sp.spar) + spar(A(Q[0] - .005), A(qC != null ? Q[1] + .075 : 1), .78 * rr, .56 * rr, sp.spar);
    if (qC != null) mast += spar(A(Q[1] - .005), A(1), .5 * rr, .28 * rr, sp.spar);
    const T = A(qT), tw2 = 2.5 * rr, top = poly([[T[0] - tw2 * .82, T[1] - .35 * rr], [T[0] + tw2 * .82, T[1] - .35 * rr], [T[0] + tw2, T[1] + .3 * rr], [T[0] - tw2, T[1] + .3 * rr]]);
    mast += fillP(top, tone(sp.spar === 'paint-ochre' ? 'tar' : sp.spar, lum([0, -.5, .8]))) + edge(top, sp.spar, .6) + (plain ? '' : strokeP(seg([T[0] - tw2, T[1] + .3 * rr], [T[0] + tw2, T[1] + .3 * rr]), tone(sp.spar, If + .5), .2 * s, ' opacity=".7"'));
    if (qC != null) { const c = A(qC); mast += strokeP(seg([c[0] - 1.5 * rr, c[1]], [c[0] + 1.5 * rr, c[1]]), tone(sp.yard, If), .4 * rr * s, ' stroke-linecap="round"'); }
    if (!plain) mast += fillP(box(...A(Q[0] + .085), 2 * rr, .9 * rr), tone('tar', If)) + dot(...A(1.004), .42 * rr) + ` fill="${tone(sp.gilt ? 'brass' : sp.spar, If + .3)}"/>`;
    rigBack += mast;
    // square sails and yards
    for (let i = 0; i < m.n; i++) { const c = A(qs[i]), hw = w[i];
      if (st[i] === 'set' || st[i] === 'reef') {
        const hc = [c[0] - .4, c[1] - .5 * rr], fc = i === 0 ? [A(0)[0] - .3, hD + 3.6] : [A(qs[i - 1])[0] - .2, A(qs[i - 1])[1] + .8 * rr], fw = i === 0 ? hw * 1.01 : w[i - 1] * .96, ht = hc[1] - fc[1];
        sails += cloth(sqMap(hc, hw * .95, fc, fw, ht * .135, ht * (i === 0 ? .15 : .09)), { name: nm + 's' + i, wd: hw + fw, ht, nF: nSq[0], nA: nSq[1], mastU: .5 + .2 / hw, reef: st[i] === 'reef' ? [.07, .13] : i === 1 ? [.16, .29] : i === 0 ? [.14] : null });
        if (st[i] === 'reef') sails += furl([c[0] - .3, c[1] - .2 * rr], hw * .93, nm + 'r' + i, .7);
        if (!far && i === 0) running += seg([fc[0] - fw, fc[1]], [fc[0] - fw - 2.5, rail(fc[0] - fw - 2.5)]) + seg([fc[0] + fw, fc[1]], [fc[0] + fw + 4, rail(fc[0] + fw + 4)]);   // tack and sheet
      } else if (st[i] === 'furl') sails += furl([c[0] - .3, c[1] - .2 * rr], hw * .94, nm + 'f' + i, i === 0 ? 1.25 : 1);
      spars += spar([c[0] - hw, c[1]], [c[0] + hw, c[1]], (.4 - i * .05) * rr, (.4 - i * .05) * rr, sp.yard, { bulge: .4 });
      // lifts from the yardarms to the masthead, braces from the aft yardarm aft and down
      if (!far) { const up = A(Math.min(1, qs[i] + (i + 1 < m.n ? (Q[i + 1] - Q[i]) * .42 : (1 - Q[i]) * .9))); thin += seg([c[0] - hw, c[1] + .3], up) + seg([c[0] + hw, c[1] + .3], up);
        const N = masts[M.mi + 1], to = N ? N.A(Math.max(.06, qs[i] * .62 - .1)) : [Math.min(xAft, c[0] + hw + 12 + i * 3), rail(Math.min(xAft, c[0] + hw + 12 + i * 3)) + .2]; running += sag([c[0] + hw, c[1]], to, -1.2); }
    }
    // the fore-and-aft sail of the mizzen
    if (m.aft === 'lateen') { const F = [m.x - .105 * sp.len * m.k / .7, hD + Hm * .1], Pk = [m.x + .11 * sp.len * m.k / .7, hD + Hm * .64], cx = Math.min(xAft + 1, m.x + .13 * sp.len * m.k / .7), Cw = [cx, rail(Math.min(cx, xAft)) + 1.8];
      if (set !== 'furled') sails += cloth(quadMap(F, Pk, F, Cw, 1.6 * Lu, -1.2), { name: nm + 'lat', wd: Pk[0] - F[0], ht: (Pk[1] - Cw[1]) * .7, nF: nFa[0], nA: nFa[1], foot: false });
      spars += spar(F, Pk, .42 * rr, .26 * rr, sp.yard); if (!far) running += seg(Cw, [cx - 1, rail(Math.min(cx, xAft))]) + seg(Pk, A(Q[1] * .93)) + seg(F, [F[0] + 1.5, rail(F[0] + 1.5)]);
    } else if (m.aft === 'gaff') { const th = A(.38), tk = A(.07), Pk = [th[0] + .15 * sp.len * m.k / .74, th[1] + Hm * .13], Bm = [tk[0] + .185 * sp.len * m.k / .74, tk[1] + 1.4];
      if (set !== 'furled') sails += cloth(quadMap([th[0] + .6, th[1]], Pk, [tk[0] + .6, tk[1] + .4], [Bm[0] - .5, Bm[1] + .4], -1.3 * Lu, 0), { name: nm + 'gaf', wd: Bm[0] - tk[0], ht: th[1] - tk[1], nF: nFa[0], nA: nFa[1], foot: false, tear: false });
      spars += spar(th, Pk, .4 * rr, .26 * rr, sp.yard) + spar(tk, Bm, .44 * rr, .3 * rr, sp.yard); if (!far) running += seg(Pk, A(Q[1] * .96)) + seg(Bm, [Math.min(xAft, Bm[0] + 2), rail(Math.min(xAft, Bm[0] + 2))]) + seg([Bm[0] - 1, Bm[1]], A(.36)); }
    // shrouds with ratlines on a channel, deadeyes and chain plates; backstays
    const ns = m.k > .9 ? 6 : m.k > .8 ? 5 : 4, sprd = .072 * sp.len * Math.max(.75, Math.min(1.05, m.k)), hCh = rail(m.x + sprd * .5) - 1.5, xb = m.x + .9, tp = A(qT - .012), step = sprd / (ns - 1), Rr = R(nm + 'rat');
    const sx = (i, h) => { const b = xb + i * step; return b + (tp[0] + .12 * i - b) * (h - hCh) / (tp[1] - hCh); };
    let ch = '';
    if (!far) { const cd = poly([[xb - .9, hCh - .28], [xb + sprd + .9, hCh - .28], [xb + sprd + .7, hCh + .22], [xb - .7, hCh + .22]]);
      ch += (sil ? '' : fillP(poly([[xb - .9, hCh - .28], [xb + sprd + .9, hCh - .28], [xb + sprd + .5, hCh - 1.3], [xb - .5, hCh - 1.3]]), col(mix(L.tone(hullK, -.8, cen[0], cen[1]), '#150d0a', .4)), ' opacity=".4"')) + fillP(cd, tone(sp.trim, lum([0, .5, .8]))) + (ow ? strokeP(cd, ink(sp.trim), .22 * s) : ''); }
    for (let i = 0; i < ns; i++) { standing += seg([sx(i, hCh), hCh + .2], [tp[0] + .12 * i, tp[1]]); if (near) { thin += seg([sx(i, hCh), hCh - .25], [sx(i, hCh) + .35, hCh - 2.7]); ch += dot(sx(i, hCh + .55), hCh + .55, .3) + ` fill="${ropeD}"/>` + dot(sx(i, hCh + 1.5), hCh + 1.5, .3) + ` fill="${ropeD}"/>`; } }
    if (!far) for (let h = hCh + 2.6; h < tp[1] - 1.2; h += (near ? 1.45 : 2.5) * (.92 + Rr() * .16)) { const a = sx(0, h), b = sx(ns - 1, h); if (b - a < .5) break; thin += sag([a, h + (Rr() - .5) * .16], [b, h + (Rr() - .5) * .16], .08 + Rr() * .1); }
    standing += seg([xb + sprd + 1.6, hCh + .2], A(qC != null ? qC : .98)); if (qC != null) standing += seg([xb + sprd + 3, hCh + .2], A(.99));
    if (!far) { const T2 = A(qT), hd = A(qC != null ? qC - .01 : .97); for (let i = 0; i < 3; i++) thin += seg([T2[0] + (.5 + i * .65) * rr, T2[1] + .3 * rr], [hd[0] + .1 * i, hd[1]]);
      thin += seg([T2[0] + tw2 * .9, T2[1] - .3 * rr], A(qT - .07)) + seg([T2[0] - tw2 * .9, T2[1] - .3 * rr], A(qT - .07));
      if (near) for (let h = T2[1] + 2; h < hd[1] - 1.5; h += 1.5) { const k = (h - T2[1]) / (hd[1] - T2[1]); thin += seg([lerp(T2[0] + .5 * rr, hd[0], k), h], [lerp(T2[0] + 1.8 * rr, hd[0] + .2, k), h]); } }
    rigFront += ch;
  });

  // head sails: jibs on the stays of the fore mast; the sprit topmast and the spritsail
  { const F = masts[0], Rr = R('jib'); let hs = '';
    if (set !== 'furled') for (let i = 0; i < sp.jibs; i++) { const n = sp.jibs, t = n === 1 ? 1 : i / (n - 1);
      const tack = n === 1 ? [Bp(.93)[0], Bp(.93)[1] + .5] : !bs.jib ? [Bp(lerp(.6, .97, t))[0], Bp(lerp(.6, .97, t))[1] + .5] : i === 0 ? [Bp(.66)[0], Bp(.66)[1] + .5] : [lerp(Bp(1)[0], Bend[0], i === n - 1 ? .97 : .42), lerp(Bp(1)[1], Bend[1], i === n - 1 ? .97 : .42) + .4];
      const top = F.A(n === 1 ? (F.qC != null ? F.qC : .95) : lerp(F.qC != null ? F.qC - .04 : .8, .96, t)), hf = n === 1 ? .7 : lerp(.74, .6, t), head = [lerp(tack[0], top[0], hf), lerp(tack[1], top[1], hf)];
      const cx = lerp(tack[0], F.m.x, n === 1 ? .6 : lerp(.62, .5, t)), clew = [cx, Math.max(tack[1] + 1.5, (cx > xStem ? rail(cx) : Bp(.2)[1]) + 3 + (n - 1 - i) * 1.2 + Rr() * 1.2)];
      hs = cloth(quadMap(head, head, tack, clew, 1.3 * Lu, .05 * (clew[0] - tack[0])), { name: 'jib' + i, wd: (clew[0] - tack[0]) * .75, ht: head[1] - tack[1], nF: nFa[0], nA: nFa[1], foot: cond === 'rags' }) + hs; if (!far) running += sag(clew, [clew[0] + 5, rail(clew[0] + 5)], -.4); }
    sails = hs + sails;
    if (bs.topmast) { const b = Bp(1), t = [b[0] - .3, b[1] + bs.topmast], yq = [b[0] - .3, b[1] + bs.topmast * .82], hw = .034 * sp.len, kn = poly([[b[0] + 1.4, b[1] - .2], [b[0] - .9, b[1] - .3], [b[0] - .6, b[1] + 2.2]]);
      bowBack += fillP(kn, tone(sp.spar, If - .2)) + spar([b[0] - .3, b[1] - .2], t, .42 * Lu, .26 * Lu, sp.spar) + fillP(poly([[b[0] - 1.7, b[1] + bs.topmast * .36], [b[0] + 1.1, b[1] + bs.topmast * .36], [b[0] + 1.4, b[1] + bs.topmast * .36 + .45], [b[0] - 2, b[1] + bs.topmast * .36 + .45]]), tone(sp.spar, If - .3));
      if (set === 'full') sails = cloth(sqMap([yq[0] - .2, yq[1] - .3], hw * .95, [b[0] - .5, b[1] + bs.topmast * .36 + 1], hw * 1.1, bs.topmast * .07, bs.topmast * .04), { name: 'spt', wd: hw * 2, ht: bs.topmast * .42, nF: nSq[0], nA: nSq[1] }) + sails; else sails = furl(yq, hw * .9, 'sptf', .6) + sails;
      spars += spar([yq[0] - hw, yq[1]], [yq[0] + hw, yq[1]], .3 * Lu, .3 * Lu, sp.yard, { bulge: .3 });
      rigBack += strokeP(seg(t, F.A(F.qC != null ? F.qC : .9)) + seg(t, Bp(.55)), ropeD, rw(.24), far ? ' opacity=".55"' : ''); }
    if (bs.spritsail) { const c = Bp(.56), yc = [c[0], c[1] - 1.25 * Lu], hw = .045 * sp.len;
      if (bs.spritsail === 'set' && set === 'full') sails = cloth(sqMap([yc[0], yc[1] - .3], hw * .95, [yc[0] + 1.2, Math.max(1.6, yc[1] - .1 * sp.len)], hw * .9, 1 * Lu, .6), { name: 'sps', wd: hw * 2, ht: yc[1] - Math.max(1.6, yc[1] - .1 * sp.len), nF: nSq[0], nA: nSq[1] }) + sails; else sails = furl(yc, hw * .92, 'spsf', .7) + sails;
      spars += spar([yc[0] - hw, yc[1]], [yc[0] + hw, yc[1]], .32 * Lu, .32 * Lu, sp.yard, { bulge: .3 }); if (!far) running += seg([yc[0] - hw * .5, yc[1]], Bp(.7)) + seg([yc[0] + hw * .5, yc[1]], Bp(.42)) + seg([yc[0] - hw, yc[1]], Bp(.95)); }
  }
  rigFront += strokeP(standing, ropeD, rw(.22), far ? ' opacity=".5"' : '') + strokeP(thin, ropeD, rw(.14), ' opacity=".85"') + strokeP(running, ropeL, rw(.15), ` opacity="${back ? .5 : .65}"`);

  // ——— flags: they fly to the bow, with the wind that fills the sails ———
  const flagAt = (X0, Ht, fw, fh, design, name) => { const Rr = R(name), ph = Rr() * 6, taper = design === 'pennant' ? 1 : 0, rag = sp.growth || cond === 'torn';
    const F = (a, b) => [X0 - a * fw * (1 - .05 * b), Ht - b * fh * (1 - taper * a * .97) - taper * a * fh * .2 - .16 * a * a * fh * (taper ? 2.5 : 1) + .09 * fh * (taper ? 1.6 : 1) * Math.sin(a * 7.2 + ph) * Math.pow(a, .6)];
    const N = 12, pts = []; for (let i = 0; i <= N; i++) pts.push(F(i / N, 0)); if (rag && !taper) for (let i = 1; i < 6; i++) pts.push(F(1 - Rr() * .16, i / 6)); for (let i = N; i >= 0; i--) pts.push(F(i / N, 1));
    const d = line(pts) + 'Z', km = design === 'jolly' ? 'ship-flag-black' : design === 'pennant' ? sp.pennant : 'linen';
    if (sil) return fillP(d, C);
    const cid = clipOf(d), I0 = lum([-.2, 0, .98]); let inn = '';
    const band = (b0, b1, a0, a1, c) => { const p = []; for (let i = 0; i <= 8; i++) p.push(F(lerp(a0, a1, i / 8), b0)); for (let i = 8; i >= 0; i--) p.push(F(lerp(a0, a1, i / 8), b1)); return fillP(poly(p), c); };
    if (design === 'company') { const red = tone('ship-flag-red', I0); for (let i = 0; i < 7; i++) inn += band(i / 7, (i + .5) / 7, 0, 1, red); inn += band(0, 3 / 7, 0, .38, tone('linen', I0)) + band(1.2 / 7, 1.8 / 7, 0, .38, red) + band(0, 3 / 7, .16, .22, red); }
    else if (design === 'merchant') inn += band(0, 1 / 3, 0, 1, tone('ship-flag-red', I0)) + band(2 / 3, 1, 0, 1, tone('water-wet', I0 + .2));
    else if (design === 'plain') inn += band(.36, .64, 0, 1, tone('ship-flag-red', I0));
    else if (design === 'jolly' && !far) { const bone = tone('bone', I0 + .15), c = (a, b) => F(.5 + a * fh / fw, .47 + b), sk = []; for (let i = 0; i < 12; i++) { const t = i / 12 * 2 * Math.PI; sk.push(c(Math.sin(t) * .2, -.1 + Math.cos(t) * .2)); }
      inn += strokeP(seg(c(-.36, .12), c(.36, .44)) + seg(c(.36, .12), c(-.36, .44)), bone, .075 * fh * s, ' stroke-linecap="round"') + fillP(spl(sk, true) + poly([c(-.12, .04), c(.12, .04), c(.1, .2), c(-.1, .2)]), bone) + fillP(poly([c(-.12, -.12), c(-.03, -.12), c(-.04, -.03), c(-.11, -.03)]) + poly([c(.12, -.12), c(.03, -.12), c(.04, -.03), c(.11, -.03)]) + poly([c(0, 0), c(-.03, .06), c(.03, .06)]), tone(km, I0)); }
    const sh = tone(km, I0 - .6), fold = []; for (let i = 0; i <= 8; i++) { const a = i / 8; fold.push([a, sh, clamp(.2 - .26 * Math.cos(a * 7.2 + ph)) * (i ? 1 : .3)]); }
    inn += fillP(d, gr(F(0, .5), F(1, .5), fold));
    return fillP(d, tone(km, I0)) + `<g clip-path="url(#${cid})">${inn}</g>` + (ow ? strokeP(d, ink(km), .28 * s, ' stroke-linejoin="round"') : ''); };
  let flags = '';
  { const main = masts.reduce((a, b) => b.m.H > a.m.H ? b : a), t = main.A(1), fore = masts[0], z = Lu;
    if (sp.flag === 'pennant') flags += flagAt(t[0] - .2, t[1] + 1.2, 22 * z, 2.2 * z, 'pennant', 'pen');
    else { flags += strokeP(seg(t, [t[0], t[1] + 6.6 * z]), ropeD, rw(.34)) + flagAt(t[0] - .15, t[1] + 6.4 * z, 9.5 * z, 5.6 * z, sp.flag, 'flag'); if (fore !== main) { const ft = fore.A(1); flags += flagAt(ft[0] - .2, ft[1] + 1, 11 * z, 1.7 * z, 'pennant', 'pen'); } }
    if (sp.ensign) { const b = [xAft + sp.tw[0] * .92, hTop + .2], e = [b[0] + 4, b[1] + 16]; flags += strokeP(seg(b, e), tone(sp.spar, If), rw(.42)) + flagAt(e[0] - .3, e[1] - .3, 15, 9, sp.ensign, 'ens'); } }

  // ——— growth of the Dutchman: weed hanging from every edge, shells, lumps that break the outline ———
  let growA = '', growB = '';
  if (sp.growth) { const Rr = R('weed'), wk = tone('ship-weed', If - .2), wk2 = tone('ship-weed', If + .25);
    const strand = (X, H, l) => { const a = [[X, H]]; let x = X; const n = Math.max(2, Math.round(l / 1.2)); for (let i = 1; i <= n; i++) { x += (Rr() - .5) * .7; a.push([x, H - l * i / n]); } return spl(a); };
    let w1 = '', w2 = '', lumps = '', shells = '';
    for (let X = xStem - sp.beak[0] + 2; X < xAft; X += 1.6 + Rr() * 3.6) { const top = X < xStem ? Hs - 3 : rail(X); if (Rr() > .45) lumps += dot(X, top - .1 + Rr() * .3, (.35 + Rr() * .75) * Lu) + '/>'; if (X > xStem && Rr() > .3) { const h = sp.wales[Math.floor(Rr() * sp.wales.length)]; (Rr() > .5 ? w1 += strand(X, Y(h, X) - .4, 1 + Rr() * 3.2) : w2 += strand(X, Y(h, X) - .4, .8 + Rr() * 2)); } }
    for (const t of [.3, .45, .6, .78, .9]) w1 += strand(Bp(t)[0], Bp(t)[1] - .6, 1.5 + Rr() * 4);
    for (const M of masts) for (let i = 0; i < M.m.n; i++) { const c = M.A(M.qs[i]); for (let k = 0; k < 2 + Rr() * 3; k++) { const X = c[0] + (Rr() * 2 - 1) * M.w[i]; w1 += strand(X, c[1] - .3, 1.2 + Rr() * 4.5); } }
    growB += strokeP(w1, wk, clamp(.24 * s, .12, .5), ' stroke-linecap="round"') + (plain ? '' : strokeP(w2, wk2, clamp(.2 * s, .12, .4), ' stroke-linecap="round"'));
    growA += `<g fill="${tone(hullK, If - .25)}">${lumps}</g>`;
    if (!plain) { for (let X = -hb + 1; X < hb; X += .7 + Rr() * 2.4) { const n = 1 + Math.floor(Rr() * 4), h = Rr() < .7 ? .4 + Rr() * 2.6 : sp.wales[Math.floor(Rr() * sp.wales.length)] + Rr(); for (let k = 0; k < n; k++) shells += dot(X + (Rr() - .5) * 1.4, Y(h, X) + (Rr() - .5) * .9, (.16 + Rr() * .26) * Lu) + ` opacity="${f(.45 + Rr() * .45)}"/>`; }
      growA += `<g fill="${tone('bone', If)}" clip-path="url(#${wlClip})">${shells}</g>`; }
  }

  // far away only the big lines of the rig stay: the back rigging goes pale
  const body = rigBack + bowBack + sails + spars + `<g clip-path="url(#${wlClip})">` + hull + (sil ? '' : rim(hullD, clipOf(hullD), [0, sp.free], sp.len * .6, 1.1)) + (ow ? strokeP(hullD, ink(hullK), ow, ' stroke-linejoin="round"') : '') + stern + bow + '</g>' + growA + rigFront + growB + flags;
  let svg = `<defs>${defs}</defs>` + body;
  if (sil) svg = svg.replace(/ (?:fill-|stroke-)?opacity="[^"]*"/g, '');
  return { svg, glowAt, pt, sp, hb, xAft, seed, s, dir, x0, y0, lightC, Lu };
}

/**
 * ship(u, L, opts) — a ship in profile, the bow to the left. opts: kind: 'pearl' | 'revenge' | 'endeavour' |
 * 'dutch' | 'merchant' | 'brig'; x, y — the middle of the waterline in scene units; scale (1: the hull is about
 * 100 units long at the waterline); flip — the bow to the right; heel — degrees, the tilt in the picture's plane
 * (positive: the bow down, the masts lean ahead); sails: 'full' | 'reefed' | 'furled'; detail: 'near' | 'mid' |
 * 'far' (far: no small things and no outline, the tones go to the sky's tone at the horizon); wake: foam at the
 * stem and along the side, the wake astern; reflect: the reflection straight under the ship (env.reflection);
 * lights: light in the stern windows and in the lantern; seed. Returns one <g>.
 */
function ship(u, L, o = {}) {
  const b = build(u, L, o, 'color'), { sp, s, dir, x0, y0, hb, seed, Lu } = b, Rr = rng(seed + 77), far = o.detail === 'far';
  const foamC = mul(mix('#f6fcff', L.keyColor, .3), DIM[L.time] || 1), fc = far ? mix(foamC, L.pal.sky[3], .45) : foamC;
  let out = '';
  if (o.reflect) { const r = build(u, L, o, 'refl'); out += E.reflection(u, r.svg, { y: y0, h: Math.min(Math.max(...sp.masts.map(m => m.H)) * s * .55, 90), L, opacity: far ? .4 : .62, stretch: 1.05, seed: seed % 97 + 3 }); }
  const stern = x0 + dir * s * hb, stem = x0 - dir * s * hb;
  if (o.wake) { // the wake astern: a band of churned water and streaks of foam that fade
    const len = sp.len * s * .7, id = nid('hk', u), x1 = stern - dir * 4 * s, x2 = stern + dir * len;
    out += `<defs>${linGrad(id, x1, 0, x2, 0, [[0, fc, .5], [.3, fc, .28], [1, fc, 0]])}</defs><path d="M${f(x1)} ${f(y0 - .2 * s)}L${f(x2)} ${f(y0 + .6 * s)}L${f(x2)} ${f(y0 + 4.6 * s)}L${f(x1)} ${f(y0 + 2.2 * s)}Z" fill="url(#${id})"/>`;
    for (let i = 0; i < (far ? 6 : 16); i++) { const t = Rr(), x = stern + dir * (t * len * .9 - 2 * s), l = (2.5 + Rr() * 7) * s * (1 - t * .5), y = y0 + (.3 + Rr() * (1.4 + 2.6 * t)) * s;
      out += `<path d="M${f(x)} ${f(y)}q${f(dir * l / 2)} ${f(-.5 * s)} ${f(dir * l)} 0" stroke="${fc}" stroke-width="${f(clamp((.2 + Rr() * .3) * s, .12, .7))}" fill="none" opacity="${f((.35 + Rr() * .5) * (1 - t * .8))}" stroke-linecap="round"/>`; }
  }
  out += b.svg;
  if (o.wake) { // the bow wave climbing the stem and running aft along the side, foam along the waterline
    const sh = mix(fc, L.shadowTint, .4), n = far ? 10 : 34; let froth = '', shade = '';
    for (let i = 0; i < n; i++) { const t = Math.pow(Rr(), 1.5), x = stem + dir * (-2.6 + t * 24) * s, up = 2.1 * s * Math.pow(Math.sin(Math.PI * Math.min(1, t * 2.4 + .1)), 1.4) * (1 - t * .6), y = y0 - Rr() * up + .2 * s, r = (.5 + Rr() * 1.1) * s * (1 - t * .5);
      froth += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * (1 + Rr() * .8))}" ry="${f(r * .55)}" transform="rotate(${f(-dir * (25 - t * 30) * Rr())} ${f(x)} ${f(y)})"/>`;
      if (i % 3 === 0) shade += `<ellipse cx="${f(x + dir * .4 * s)}" cy="${f(y + r * .5)}" rx="${f(r * 1.3)}" ry="${f(r * .4)}"/>`; }
    out += `<g fill="${sh}" opacity=".45">${shade}</g><g fill="${fc}" opacity=".95">${froth}</g>`;
    if (!far) for (let i = 0; i < 12; i++) out += `<circle cx="${f(stem + dir * (-4.5 + Rr() * 8) * s)}" cy="${f(y0 - Rr() * 3.6 * s)}" r="${f((.12 + Rr() * .24) * s)}" fill="${fc}" opacity="${f(.4 + Rr() * .5)}"/>`;
    out += E.foam(u, { x: x0 + dir * s * 2, y: y0 + .25 * s, w: sp.len * s * .97, h: clamp(.75 * s, .5, 2), seed: seed % 89 + 5, L });
  } else if (!far) out += `<path d="M${f(stem - 2 * s)} ${f(y0 + .2 * s)}L${f(stern + 2 * s)} ${f(y0 + .2 * s)}" stroke="${fc}" stroke-width="${f(.35 * s)}" opacity=".45"/>`;
  if (o.lights && !far) { // the windows and the lantern light the air round them and the water under the stern
    for (const g of b.glowAt) { const p = b.pt(g[0], g[1]); out += localGlow(u, { x: p[0], y: p[1], color: b.lightC, power: .5, radius: g[2] * s }, { core: false }); }
    for (let i = 0; i < 7; i++) { const x = stern + dir * (Rr() * 8 - 7) * s, y = y0 + (1 + i * 1.5 + Rr()) * s, l = (2 + Rr() * 4) * s; out += `<path d="M${f(x)} ${f(y)}q${f(l / 2)} ${f(-.4 * s)} ${f(l)} 0q${f(-l / 2)} ${f(.4 * s)} ${f(-l)} 0z" fill="${b.lightC}" opacity="${f(.5 - i * .055)}"/>`; }
  }
  return `<g>${out}</g>`;
}

/**
 * shipSilhouette(kind, opts) — the same ship in one flat tone, without colour, flag designs, water and background:
 * for the blind check of the silhouettes. opts: x, y, scale, flip, heel, sails, seed, color ('#1b1d22'), u.
 * The gun ports and the holes of torn sails stay open.
 */
function shipSilhouette(kind, o = {}) {
  return `<g>${build(o.u || 'sil', makeLight(LIGHTS.endeavour), Object.assign({}, o, { kind }), 'sil').svg}</g>`;
}

module.exports = { ship, shipSilhouette, shipBox, SHIP_SPECS: SPECS };
