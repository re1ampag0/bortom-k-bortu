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
  'paint-olive': { base: '#6a7146', spec: { w: .4, op: .12, col: 'warm' }, reflex: 'warm', reflexK: .3, grain: 1 },   // the merchant's faded painted band
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
// yards, rake, aft: 'lateen' | 'gaff', lower: a square sail on the lower yard of the mizzen, lat: [fore reach, aft reach,
// height of the peak] of the lateen yard (default [.105, .11, .64]); galRoof — the height of the gallery's roof (2.1).
// The third dimension (for the roll): beam — the breadth of the hull to its length at the waterline, so the half-breadth
// b(X) = beam * len / 2 at the widest section, narrowing to the stem and to the sternpost (the transom keeps ~0.6 of it
// above the counter), tumblehome above the widest line by `tumble`; draft — the depth of the keel under the waterline;
// bilge — the fullness of the section under water (2 — a round bilge, 3 — a flat floor and a hard turn); inner — the
// paint of the inner side of the bulwark; deckK — the planks of the deck; bottom: 'foul' | 'copper' | 'tar'.
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
    beam: .25, draft: 9, bilge: 2.2, inner: 'ship-red', deckK: 'pine-deck', bottom: 'foul',   // 40 x 10 m (ru-BP, the dossier)
  },
  // Queen Anne's Revenge (2011): a short hull "stern up": the highest stern of the four, broad, 3.5 tiers; a sprit
  // topmast; a lateen mizzen; dark red sooty hull, red dirty torn sails.
  revenge: {
    len: 84, free: 9.6, sheer: [3, 3.4], tumble: .3, bow: [6.5, 2.2], over: 10, counter: .8,
    fc: [-21, 5.4], tiers: [[0, 6.6], [14, 6.6], [26, 6], [36, 3.6]], taff: 2.4, tw: [7, 8.5], openRail: 2,
    hull: 'ship-red', trim: 'ship-wood', gilt: 1, wales: [], bands: [{ h0: 2.7, h1: 3.9, mat: 'tar' }, { h0: 6.5, h1: 7.5, mat: 'tar' }],
    ports: [{ h: 5.2, n: 10, x0: -29, x1: 25, w: 2.1, open: .8 }], deckPorts: [7, -17, 30],
    gallery: [12, 2, 4.5], tierWin: 2, lantern: 1.5,
    beak: [12, 2.6, 3.4], sprit: { len: 23, steeve: 30, topmast: 13 }, jibs: 1,
    masts: [{ x: -27, H: 98, n: 3, k: .98 }, { x: 2, H: 110, n: 3, k: 1.06, rake: 1 }, { x: 27, H: 86, n: 2, k: .72, rake: 2, aft: 'lateen' }],
    spar: 'ship-wood', yard: 'tar', sail: 'ship-sail-red', cond: 'patched', flag: 'jolly', pennant: 'ship-flag-red',
    beam: .26, draft: 8.6, bilge: 2.2, inner: 'paint-red', deckK: 'oak', bottom: 'foul',   // a light frigate, the La Concorde: ~3.8 : 1
  },
  // HMS Endeavour (2007): the biggest; a high even wall of the side with three rows of ports on ochre bands; the
  // forecastle almost level with the waist; a broad stern of middle height with galleries; a gaff mizzen; a long
  // bowsprit with a jib-boom; white whole sails, the full set.
  endeavour: {
    len: 104, free: 17.5, sheer: [1.5, 2], tumble: .5, bow: [5, 1.7], over: 7, counter: .62,
    fc: [-28, 1.6], tiers: [[12, 3], [31, 3.6]], taff: 1.4, tw: [6.5, 7.5],
    hull: 'tar', trim: 'paint-ochre', gilt: 1, wales: [1.9], bands: [{ h0: 3.3, h1: 5.9, mat: 'paint-ochre' }, { h0: 7.7, h1: 10.3, mat: 'paint-ochre' }, { h0: 12.1, h1: 14.7, mat: 'paint-ochre' }],
    ports: [{ h: 4.6, n: 15, x0: -41, x1: 40, w: 1.9, open: .8 }, { h: 9, n: 15, x0: -42, x1: 41, w: 1.9, open: .85 }, { h: 13.4, n: 14, x0: -41, x1: 40, w: 1.9, open: .9 }], deckPorts: [9, -22, 42],
    gallery: [12, 2, 4.4], tierWin: 3, lantern: 1,
    beak: [9.5, 3.4, 0], sprit: { len: 30, steeve: 20, jib: 13, spritsail: 'set' }, jibs: 3,
    masts: [{ x: -34, H: 116, n: 4, k: .95 }, { x: 1, H: 127, n: 4, k: 1.04, rake: .8 }, { x: 34, H: 99, n: 3, k: .74, rake: 1.6, aft: 'gaff' }],
    spar: 'paint-ochre', yard: 'tar', sail: 'linen', cond: 'whole', flag: 'pennant', pennant: 'ship-flag-red', ensign: 'company',
    beam: .28, draft: 14, bilge: 2.5, inner: 'paint-red', deckK: 'pine-deck', bottom: 'copper',   // HMS Victory: 15.8 m to 56.7 m on the gundeck, draught 8.8 m
  },
  // The Flying Dutchman (2006-2007), after a Dutch ship of the 17th century (the fluyt, the Vasa): a "pear" —
  // bellied below, narrow above, a strong tumblehome; two rows of ports; the highest and narrowest stern of all,
  // rising aft in steps and raked aft; a tall narrow quarter gallery of three tiers under a pointed roof (not the
  // broad block of the Revenge), no lantern; a strong sheer; a sprit topmast; a long steep lateen yard;
  // green-brown overgrown hull, rags of sails.
  dutch: {
    len: 90, free: 11, sheer: [5, 7], tumble: 1.5, bow: [7, 2.6], over: 13, counter: .62,
    fc: [-28, 3], tiers: [[2, 3.4], [17, 5], [28, 6], [37, 6.5], [45, 6]], taff: 2.6, tw: [1.1, 6.8], openRail: 4,
    hull: 'ship-ghost', trim: 'ship-ghost', gilt: 0, wales: [3.2, 6.6, 10.1], bands: [], growth: true,
    ports: [{ h: 4.7, n: 10, x0: -30, x1: 26, w: 2, open: .55 }, { h: 8.4, n: 9, x0: -27, x1: 24, w: 1.9, open: .5 }], deckPorts: [4, -24, -6],
    gallery: [6.5, 3, 3.9], galRoof: 4.6, tierWin: 1, lantern: 0,
    beak: [12, 1.4, 3.6], sprit: { len: 22, steeve: 32, topmast: 12, spritsail: 'set' }, jibs: 1,
    masts: [{ x: -28, H: 92, n: 3, k: .96 }, { x: -1, H: 104, n: 3, k: 1.03, rake: 1.5 }, { x: 24, H: 90, n: 2, k: .66, rake: 3.5, aft: 'lateen', lat: [.15, .085, .8] }],
    spar: 'ship-ghost', yard: 'ship-ghost', sail: 'ship-sail-ghost', cond: 'rags', flag: 'pennant', pennant: 'ship-flag-black',
    beam: .25, draft: 9.5, bilge: 3, inner: 'ship-ghost', deckK: 'ship-ghost', bottom: 'foul',   // the Vasa: 11.7 m to ~47.5 m at the waterline; a pear: full below
  },
  // A neutral merchantman: a small fluyt — a bellied hull, no gun ports, three masts, light sails. A working ship,
  // lived in: weathered planks of different tones and a few fresh ones, an ochre band, mended sails, cargo in the
  // waist (barrels, bales under a net), the longboat on the hatch, a stern lantern and one on the fore shrouds,
  // two figures of the crew in light shirts (helm, shrouds), long plain pennants; an olive band, a bleached top, a tarred bottom; low in the water (laden). No side's
  // colours and no ensign (card-briefs.md «Нейтральные суда»: not a fifth fighter); `ensign: 'trade'` stays available.
  merchant: {
    len: 70, free: 7.9, sheer: [2.6, 4.2], tumble: .8, bow: [5.5, 2.6], over: 5.5, counter: .74,
    fc: [-22, 2.2], tiers: [[9, 3.4], [22, 3.6]], taff: 1.6, tw: [1.6, 3.6],
    hull: 'ship-wood', trim: 'ship-wood', gilt: 0, wales: [], bands: [{ h0: -1, h1: 2.6, mat: 'tar' }, { h0: 4.1, h1: 5.9, mat: 'paint-olive' }, { h0: 6.2, h1: 6.6, mat: 'linen' }], wear: 2.6, bleach: 1, sailVar: 1,
    ports: [], deckPorts: [0, 0, 0], gallery: [6, 1, 3.4], tierWin: 1, lantern: 1,
    beak: [7.5, 1.4, 2.6], sprit: { len: 17, steeve: 28, spritsail: 'set' }, jibs: 0,
    masts: [{ x: -22, H: 62, n: 2, k: 1.05 }, { x: 0, H: 72, n: 2, k: 1.15, rake: 1 }, { x: 21, H: 52, n: 2, k: .72, rake: 2, aft: 'lateen' }],
    spar: 'oak', yard: 'ship-wood', sail: 'canvas', cond: 'mended', flag: 'pennant', pennant: 'ship-flag-red', forePennant: 1,
    beam: .23, draft: 7.6, bilge: 3.2, inner: 'paint-ochre', deckK: 'pine-deck', bottom: 'tar',   // a fluyt: 4-5 : 1, a flat floor; laden
    life: { barrels: [[-27.4, 0], [-25.5, 0], [-26.45, 1]], bales: [-16.6, -1.4], tarp: 1, crates: [11.2, 13.9], boom: -9, crew: [['helm', 27.5], ['climb', 1]], shroudLamp: 0 },
  },
  // A neutral brig: two masts with square sails, a gaff sail on the main, a low flush hull with one white band.
  brig: {
    len: 66, free: 7.2, sheer: [2, 1.6], tumble: .25, bow: [5.5, 1.6], over: 4.5, counter: .74,
    fc: [-23, 1.2], tiers: [[16, 1.8]], taff: 1, tw: [3, 3.6],
    hull: 'tar', trim: 'ship-wood', gilt: 0, wales: [2.6], bands: [{ h0: 4.2, h1: 6.1, mat: 'linen' }],
    ports: [{ h: 5.15, n: 8, x0: -22, x1: 22, w: 1.6, open: 1 }], deckPorts: [0, 0, 0], gallery: [5, 1, 2.6], tierWin: 0, lantern: 0,
    beak: [6, 2.4, 0], sprit: { len: 18, steeve: 22, jib: 8 }, jibs: 2,
    masts: [{ x: -15, H: 70, n: 3, k: 1.35 }, { x: 13, H: 76, n: 3, k: 1.42, rake: 1.5, aft: 'gaff', lower: true }],
    spar: 'oak', yard: 'tar', sail: 'canvas', cond: 'whole', flag: 'pennant', pennant: 'ship-flag-red',
    beam: .27, draft: 6.6, bilge: 2.2, inner: 'paint-ochre', deckK: 'pine-deck', bottom: 'foul',   // a brig of the 18th century: ~3.7 : 1
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
  // (the key light itself when it is behind the ship: the kant stays on the side of the moon or the low sun)
  const rimDir = plain ? null : back ? (() => { const l = Math.hypot(dC.ux, dC.uy - .35); return [dC.ux / l, (dC.uy - .35) / l]; })() : L.rim ? (() => { const a = Math.sin(rad(L.rim.az)), l = Math.hypot(a, .55); return [a / l, -.55 / l]; })() : null;
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
  // the side in section: above the widest line (t0) it leans in and looks up at the sky, below it turns under to the
  // keel; the sky lights what looks up, the water throws a cold reflex on what looks down
  const sideNY = t => { const t0 = .42; return t > t0 ? (.22 + sp.tumble * .55) * Math.pow((t - t0) / (1 - t0), 1.1) : -1.15 * Math.pow((t0 - t) / t0, 1.35); };
  const sideI = t => { const ny = sideNY(t); return lum([0, ny, 1]) + .22 * Math.max(0, ny); };
  const reflexC = mix(mix(L.pal.sea[0], L.pal.sky[3], .35), L.fillColor, .3), rfx = t => t < .26 ? .24 * Math.pow(1 - t / .26, 1.6) : 0;
  const sideT = (km, t) => sil ? C : col(mix(L.tone(km, clamp(sideI(t), -1, 1), cen[0], cen[1]), reflexC, rfx(t)));
  const SIDE_T = [0, .04, .09, .15, .22, .3, .38, .46, .56, .68, .8, .9, 1];

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
  const topRim = rimDir ? clamp(-rimDir[1] * 1.2) * rimPow : 0;                  // how much the upper edges catch the back light
  const shOff = k => [-dir * dC.ux * k, dC.uy * k], shd = sil ? C : col(mix(L.shadowTint, '#0c0a0a', .4));   // a short cast shadow on the side, away from the light
  if (sil) hull += `<path d="${hullD}${ports.map(p => box(p.X, p.H, p.w, p.hh)).join('')}" fill="${C}" fill-rule="evenodd"/>`;
  else {
    const hc = clipOf(hullD), topH = sp.free + 1, topMax = Math.max(hTop, Hs) + 1;
    // the side in light: lit top, the terminator below the widest line, the cold reflex of the water at the waterline
    hull += fillP(hullD, gr([0, 0], [0, topH], SIDE_T.map(t => [t, sideT(hullK, t)])));
    let inner = '';
    const dark = col(mix(L.tone(hullK, -.7, cen[0], cen[1]), '#150d0a', .45)), lite = col(mix(L.tone(hullK, .9, cen[0], cen[1]), L.keyColor, .35));
    const Rp = R('planks'), stepH = near ? 1.25 : 2.3, rows = [];
    for (let h = 1.1; h < topMax; h += stepH * (.9 + Rp() * .2)) rows.push(h);
    let seams = '', butts = '', grain = '', pl = '';
    if (!far) rows.forEach((h, ri) => { const h2 = ri + 1 < rows.length ? rows[ri + 1] : h + stepH, xa = stemX(Math.min(h, Hs)) + .2;
      seams += line(along(h, xa, xAft + 1, 3));
      if (!near) return;
      // planks of their own tone, fading at the butts; a fibre or two along each; all under the paint of the bands
      for (let X = xa - Rp() * 12; X < xAft; ) { const l = 12 + Rp() * 15, Xs = Math.max(X, xa), Xb = Math.min(xAft + 1, X + l), v = Rp() * 2 - 1;
        if (X > xa + .5) butts += seg([X, Y(h, X) + .06], [X, Y(h2, X) - .06]);
        // a worn hull (sp.wear): stronger differences, some planks bleached grey, a few fresh light ones fitted in repairs
        const wz = sp.wear ? Rp() : 1, wc = !sp.wear ? null : wz < .14 ? mix(lite, '#a8a496', .6) : wz < .2 ? mix(lite, '#e0b27a', .5) : null;
        if ((Math.abs(v) > .3 || wc) && Xb - Xs > 3) { const id = nid('hp', u), a = pt(Xs, Y(h, Xs)), b = pt(Xb, Y(h, Xb)), c = wc || (v > 0 ? lite : dark), op = wc ? .34 + Math.abs(v) * .2 : Math.abs(v) * (v > 0 ? .075 : .1) * (sp.wear || 1);
          defs += linGrad(id, a[0], a[1], b[0], b[1], [[0, c, 0], [.18, c, op], [.8, c, op * (.55 + Rp() * .45)], [1, c, 0]]); pl += fillP(strip(h + .05, h2 - .05, Xs, Xb, 2.5), `url(#${id})`); }
        if (Rp() > .3) { const g0 = Xs + Rp() * (Xb - Xs) * .3, g1 = Xb - Rp() * (Xb - Xs) * .35, gh = lerp(h, h2, .25 + Rp() * .5), ph = Rp() * 6, a = [];
          for (let x = g0; x < g1; x += 1.6) a.push([x, Y(gh, x) + .07 * Math.sin(x * .7 + ph)]); if (a.length > 2) grain += line(a); }
        X += l; } });
    inner += pl + strokeP(grain, Rp() > .5 ? dark : lite, clamp(.08 * s, .08, .18), ' opacity=".22"');
    for (const b of sp.bands) { const km = b.mat || 'paint-ochre', t0 = b.h0 / topH, t1 = b.h1 / topH, ts = [0, .5, 1].map(k => lerp(t0, t1, k));
      inner += fillP(strip(b.h0, b.h1, xStem - 3, xAft + 2), gr([0, b.h0], [0, b.h1], ts.map((t, i) => [i / 2, sideT(km, t)])));
      if (!far) inner += strokeP(line(along(b.h0, xStem - 3, xAft + 2)), ink(km), .22 * s, ' opacity=".55"') + strokeP(line(along(b.h1 - .14, xStem - 3, xAft + 2)), tone(km, sideI(t1) + .55), .18 * s, ' opacity=".6"')
        + (topRim ? strokeP(line(along(b.h1 - .1, xStem - 3, xAft + 2)), rimCol, .14 * s, ` opacity="${f(topRim * .7)}"`) : ''); }
    if (!far) {
      inner += strokeP(seams, dark, clamp(.13 * s, .12, .3), ' opacity=".4"') + strokeP(butts, dark, clamp(.12 * s, .1, .26), ' opacity=".32"');
      // wales: thick strakes with light on the upper edge, the kant of the back light, shadow under them
      for (const h of sp.wales) { const a = along(h, xStem - 3, xAft + 2);
        inner += strokeP(line(a.map(p => [p[0], p[1] - .7])), dark, .34 * s, ' opacity=".45"') + strokeP(line(a), tone(hullK, sideI(h / topH) - .16), .95 * s) + strokeP(line(a.map(p => [p[0], p[1] + .4])), lite, .16 * s, ' opacity=".55"')
          + (topRim ? strokeP(line(a.map(p => [p[0], p[1] + .44])), rimCol, .13 * s, ` opacity="${f(topRim * .6)}"`) : ''); }
      // the mouldings of the decks: the waist's rail carried aft, the deck line of every tier, the forecastle
      const mould = (h, Xa, Xb) => { const a = along(h, Xa, Xb); return strokeP(line(a), dark, .5 * s, ' opacity=".7"') + strokeP(line(a.map(p => [p[0], p[1] + .26])), sp.gilt ? tone('brass', If + .35) : lite, .2 * s, ` opacity="${sp.gilt ? .8 : .5}"`); };
      inner += mould(sp.free - .1, xStem, sp.fc[0] - 1) + mould(sp.free - .1, sp.tiers[0][0] - 1, xAft + 2);
      sp.tiers.forEach((t, j) => { if (j) inner += mould(tierBase(j) - .1, t[0] - 1, xAft + 2); });
      // the cap of the rail along the top edge, with the kant of the back light
      inner += strokeP(line(topPts.map(p => [p[0], p[1] - .3])), tone(sp.trim, If + .3), .55 * s, ' opacity=".8"') + strokeP(line(topPts.map(p => [p[0], p[1] - .75])), dark, .22 * s, ' opacity=".55"')
        + (topRim ? strokeP(line(topPts.map(p => [p[0], p[1] - .18])), rimCol, .28 * s, ` opacity="${f(clamp(topRim * 1.4))}"`) : '');
    }
    // the round of the bow: a gradient across the rake of the stem, each step turned a little more forward
    { const bw = sp.len * .17 + sp.bow[0] * .6, P0 = [stemX(0), 0], P1 = [stemX(Hs), Hs], rl = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), nb = [(P1[1] - P0[1]) / rl, -(P1[0] - P0[0]) / rl], M = [stemX(Hs * .45), Hs * .45];
      const st = [0, .12, .26, .42, .6, .8, 1].map(a => { const th = Math.pow(1 - a, 1.4) * 1.25, dI = lum([-Math.sin(th), .1, Math.cos(th)]) - lum([0, .1, 1]); return [a, dI > 0 ? lite : dark, dI > 0 ? clamp(dI * .8, 0, .5) : clamp(-dI * 1.05, 0, .66)]; });
      inner += fillP(poly([[xStem - 12, -8], [xStem + bw * 2.5, -8], [xStem + bw * 2.5, topMax + 4], [xStem - 12, topMax + 4]]), gr(M, [M[0] + nb[0] * bw, M[1] + nb[1] * bw], st)); }
    // the round of the quarter: lighter or darker than the flat side by the light
    { const n = [.62, 0, .78], dI = lum(n) - If; if (Math.abs(dI) > .04) { const c = dI > 0 ? lite : dark, a0 = dI > 0 ? clamp(dI * .5, 0, .5) : clamp(-dI * .75, 0, .62), Xa = xAft, Xb = hb - sp.len * .1;
      inner += fillP(poly([[Xb - 4, -7], [Xa + 4, -7], [Xa + 4, 60], [Xb - 4, 60]]), gr([Xa, 0], [Xb, 0], [[0, c, a0], [.45, c, a0 * .45], [1, c, 0]])); } }
    // wet planks at the waterline: darker, with the weed of the Dutchman
    if (sp.bleach) inner += fillP(strip(4.4, topMax + 2, xStem - 3, xAft + 2, 4), gr([0, 4.4], [0, topMax], [[0, '#bcb6a4', 0], [.45, '#bcb6a4', .2], [1, '#cdc7b4', .36]]));   // the upper strakes bleached by sun and salt
    inner += fillP(strip(-1, 1.6, xStem - 3, xAft + 2, 6), gr([0, 0], [0, 1.6], [[0, sp.growth ? tone('ship-weed', -.5) : dark, .6], [1, dark, 0]]));
    hull += `<g clip-path="url(#${hc})">${inner}</g>`;
    // the ports: lids with an edge in the light, a shadow under them; guns of different size, some ports empty
    const Rq = R('lids'), hole = col(mix(L.tone(hullK, -1, cen[0], cen[1]), '#17100c', .7)), lidK = sp.bands.length && kind === 'endeavour' ? 'tar' : hullK;
    const up = dC.uy < 0, edgeHi = topRim > .2 ? rimCol : lite, so = shOff(.42), lidUp = sp.growth ? .3 : 0, frame = sp.growth ? mix(lite, rimCol, .5) : ''; let pr = '', mz = '';
    if (!far) { mz = nid('hm', u); defs += `<radialGradient id="${mz}" cx=".5" cy=".5" r=".55" fx="${f(.5 + .3 * dC.ux)}" fy="${f(.5 + .3 * dC.uy)}"><stop offset="0" stop-color="${tone('iron', If + .45)}"/><stop offset=".3" stop-color="${tone('iron', If - .25)}"/><stop offset="1" stop-color="${tone('iron', -.95)}"/></radialGradient>`; }
    for (const p of ports) { const hw = p.w / 2, hh = p.hh / 2, jit = Rq(), j2 = Rq(), j3 = Rq();
      if (far) { pr += fillP(box(p.X, p.H, p.w, p.hh), hole, ' opacity=".8"'); continue; }
      const T = [[p.X - hw, p.H + hh], [p.X + hw, p.H + hh]], B = [[p.X - hw, p.H - hh], [p.X + hw, p.H - hh]];
      if (p.st === 'shut') { const lw = p.w * (1.04 + j3 * .06), lh = p.hh * (1.02 + j2 * .06), Il = If + lidUp + (jit - .5) * .3, tl = [[p.X - lw / 2, p.H + lh / 2], [p.X + lw / 2, p.H + lh / 2]], bl = [[p.X - lw / 2, p.H - lh / 2], [p.X + lw / 2, p.H - lh / 2]];
        pr += fillP(box(p.X + so[0], p.H + so[1], lw, lh), shd, ' opacity=".42"') + fillP(box(p.X, p.H, lw, lh), gr(bl[0], tl[0], [[0, tone(lidK, Il - .22)], [.6, tone(lidK, Il)], [1, tone(lidK, Il + .12)]]))
          + strokeP(seg(...(up ? tl : bl)), edgeHi, .17 * s, ' opacity=".7"') + strokeP(seg(...(up ? bl : tl)), dark, .2 * s, ' opacity=".75"')
          + strokeP(seg([p.X - lw * .3, p.H - lh * .3], [p.X - lw * .3, p.H + lh * .5]) + seg([p.X + lw * .3, p.H - lh * .3], [p.X + lw * .3, p.H + lh * .5]), tone('iron', If - .1), .15 * s, ' opacity=".8"')
          + strokeP(box(p.X, p.H, lw, lh), ink(lidK), .12 * s, ' opacity=".6"'); continue; }
      if (frame) pr += strokeP(box(p.X, p.H, p.w + .5, p.hh + .5), frame, .18 * s, ' opacity=".42"');
      pr += fillP(box(p.X, p.H, p.w, p.hh), hole) + strokeP(seg(...(up ? B : T)), edgeHi, .2 * s, ' opacity=".6"') + strokeP(seg(...(up ? T : B)), dark, .16 * s, ' opacity=".7"');
      if (p.st !== 'gone' && (p.st === 'deck' ? jit > .3 : jit > .2)) { const r = (p.st === 'deck' ? .4 : .5) * (.85 + j3 * .3), mx = p.X + (j2 - .5) * .4, my = p.H - .1 + (j3 - .5) * .2, pm = pt(mx, my);
        pr += `<circle cx="${f(pm[0])}" cy="${f(pm[1])}" r="${f(r * s)}" fill="url(#${mz})" stroke="${ink('iron')}" stroke-width="${f(.1 * s)}"/>` + dot(mx - dir * dC.ux * r * .12, my + dC.uy * r * .12, r * (.5 + j2 * .14)) + ` fill="${hole}"/>`; }
      if (p.st === 'open') { const upL = hh * (.6 + jit * .95), lean = (j2 - .5) * .5, lid = [[p.X - hw, p.H + hh], [p.X + hw, p.H + hh], [p.X + hw + lean, p.H + hh + upL], [p.X - hw + lean, p.H + hh + upL]]; // the lid lifted: its inner face in shadow, its edge in light, two lanyards
        pr += fillP(poly(lid.map(q => [q[0] + so[0], q[1] + so[1]])), shd, ' opacity=".35"') + fillP(poly(lid), gr(lid[0], lid[3], [[0, tone(lidK, If - .5 + (jit - .5) * .2)], [1, tone(lidK, If - .25)]]), ` stroke="${ink(lidK)}" stroke-width="${f(.14 * s)}"`)
          + strokeP(seg(lid[3], lid[2]), edgeHi, .2 * s, ' opacity=".7"') + (near ? strokeP(seg([p.X - hw * .6 + lean, p.H + hh + upL], [p.X - hw * .3, p.H + hh + upL + 1]) + seg([p.X + hw * .6 + lean, p.H + hh + upL], [p.X + hw * .3, p.H + hh + upL + 1]), dark, .1 * s, ' opacity=".7"') : ''); }
      if (p.st === 'askew') { const a = (jit - .3) * 1.1, c = Math.cos(a), sn = Math.sin(a), hx = p.X - hw, hy = p.H + hh, q = (x, y) => [hx + x * c - y * sn, hy + x * sn + y * c]; // a lid hanging on one hinge
        pr += fillP(poly([q(0, 0), q(p.w, 0), q(p.w, -p.hh), q(0, -p.hh)].map(v => [v[0] + so[0], v[1] + so[1]])), shd, ' opacity=".35"') + fillP(poly([q(0, 0), q(p.w, 0), q(p.w, -p.hh), q(0, -p.hh)]), tone(lidK, If - .15), ` stroke="${ink(lidK)}" stroke-width="${f(.16 * s)}"`) + strokeP(seg(q(0, 0), q(p.w, 0)), edgeHi, .15 * s, ' opacity=".6"'); }
    }
    hull += pr;
  }

  // ——— the stern: the transom's strip turned to the viewer, the quarter gallery, windows, the lantern ———
  let stern = '', glowAt = [];
  const tw = h => lerp(sp.tw[1], sp.tw[0], clamp((h - hC) / (hTop - hC))), lightC = sp.growth ? '#bff5d8' : '#ffd27a', lightHot = sp.growth ? '#eafff2' : '#fff1c4';
  // windows burn only at night, at dusk and in the fog; by day (and in an unlit window) the glass is dark with the sky in it
  const lit = !!o.lights && L.time !== 'day', Rw = R('win'), glassDark = col(mix(mix(L.pal.sky[0], L.pal.sea[2], .5), '#070b12', .45)), skyHi = col(mix(L.pal.sky[2], L.pal.sky[3], .4));
  let glassG = '';
  const glass = (d, cx, cy, r, always) => { if (sil) return '';
    const on = lit && (always || Rw() < .68), k = always ? 1 : .5 + Rw() * .5;
    if (on && !far) { const id = nid('hl', u), p = pt(cx, cy), hot = mix(lightC, lightHot, k), mid = mix(mix(lightC, '#a8521a', .3), lightC, k); defs += `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * s)}"><stop offset="0" stop-color="${hot}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${mix(lightC, '#a8521a', sp.growth ? .2 : .55)}"/></radialGradient>`; return { d: fillP(d, `url(#${id})`), on }; }
    if (on) return { d: fillP(d, col(lightC)), on };
    if (far) return { d: fillP(d, glassDark), on };
    if (!glassG) { glassG = nid('hq', u); defs += `<linearGradient id="${glassG}" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="${mix(skyHi, glassDark, .2)}"/><stop offset=".3" stop-color="${mix(skyHi, glassDark, .55)}"/><stop offset=".36" stop-color="${glassDark}"/><stop offset="1" stop-color="${mix(glassDark, '#04060a', .45)}"/></linearGradient>`; }
    return { d: fillP(d, `url(#${glassG})`), on }; };
  const win = (d, cx, cy, r, always) => glass(d, cx, cy, r, always).d || '';
  {
    const tA = [xAft, hTop], arch = sp.tw[0] * .32 + .6, hM = (hC + hTop) / 2;
    const trPoly = 'M' + pp(xC, hC) + 'L' + pp(tA[0], tA[1]) + 'Q' + pp(xAft + sp.tw[0] * .5, hTop + arch * 1.5) + ' ' + pp(xAft + sp.tw[0], hTop + arch * .2) + 'L' + pp(xC + sp.tw[1], hC + .5) + 'Z';
    const under = poly([[xC, hC], [xC + sp.tw[1], hC + .5], [hb + sp.tw[1] * .3, hC * .5], [hb - .3, hC * .42], [hb + sp.over * .02, hC * .74]]);
    const rud = poly([[hb - .4, hC * .5], [hb + 1.5, hC * .46], [hb + 1.1, -6], [hb - 1.4, -6]]);
    const nT = [.74, .1, .66], nTq = [.42, .1, .9], nTa = [.97, .1, .2];   // the middle of the transom; its edge at the quarter; its far edge
    stern += fillP(rud, tone(hullK, lum(nT) - .35)) + edge(rud, hullK, .7) + fillP(under, gr([xC, hC], [hb, hC * .45], [[0, tone(hullK, -.6)], [1, tone(hullK, -.95)]])) + edge(under, hullK, .7);
    // the transom: a curved face — lighter where it turns to the light, the counter below looks down into its own shadow
    stern += fillP(trPoly, gr([transX(hM), hM], [transX(hM) + tw(hM), hM], [[0, tone(hullK, lum(nTq) - .1)], [.5, tone(hullK, lum(nT) - .12)], [1, tone(hullK, lum(nTa) - .2)]]));
    if (!sil) stern += fillP(trPoly, gr([0, hC], [0, hTop + arch], [[0, col(mix(L.tone(hullK, -.9, cen[0], cen[1]), '#150d0a', .4)), .55], [.3, col(L.tone(hullK, -.5, cen[0], cen[1])), 0], [.8, col(L.fillColor), 0], [1, col(mix(L.fillColor, L.keyColor, .4)), .22]]));
    if (!plain) { // the tiers on the transom: two or three rows of windows of different size, a carved crest
      const tc = clipOf(trPoly); let inn = '';
      const levels = [gh0]; for (let j = 1; j < gal[1]; j++) levels.push(gh0 + j * gal[2]); sp.tiers.forEach((t, j) => { const h = Y(tierBase(j + 1), xAft) + .9; if (h > levels[levels.length - 1] + gal[2] * .9 && h < hTop - 2.6) levels.push(h); });
      const top3 = Math.min(levels.length - 1, 3); levels.forEach((h, li) => { const e = transX(h), w = tw(h), row = li < 2 ? li : li === top3 ? 2 : -1, k = [1, .8, .6][row] || 0, wh = Math.min(gal[2] - 1.3, 3.2) * k, n = row < 0 ? 0 : row === 2 || w < 5 ? 1 : 2;
        inn += strokeP(seg([e - 1, h - .5], [e + w + 1, h - .3]), sp.gilt ? tone('brass', lum(nT) + .3) : tone(sp.trim, lum(nT) + .3), .3 * s, ' opacity=".85"');
        for (let i = 0; i < n; i++) { const span = n === 1 ? .5 : .72 / n, a = e + w * (n === 1 ? .28 : .14 + i * .86 / n), b = a + w * (span - .08), k2 = kT * wh, pw4 = poly([[a, h], [b, h + .08], [b + k2, h + wh], [a + k2, h + wh]]);
          inn += win(pw4, (a + b) / 2, h + wh / 2, wh) + strokeP(pw4 + seg([(a + b) / 2, h], [(a + b) / 2 + k2, h + wh]) + (wh > 2 ? seg([a + k2 / 2, h + wh / 2], [b + k2 / 2, h + wh / 2]) : ''), ink(hullK), .16 * s); } });
      inn += strokeP('M' + pp(xAft + .4, hTop - .5) + 'Q' + pp(xAft + sp.tw[0] * .5, hTop + arch * 1.25 - .5) + ' ' + pp(xAft + sp.tw[0] - .3, hTop + arch * .2 - .5), sp.gilt ? tone('brass', lum(nT) + .4) : tone(sp.trim, lum(nT) + .35), .45 * s, ' opacity=".9"');
      if (topRim) inn += strokeP('M' + pp(xAft, hTop - .1) + 'Q' + pp(xAft + sp.tw[0] * .5, hTop + arch * 1.5 - .1) + ' ' + pp(xAft + sp.tw[0], hTop + arch * .2 - .1), rimCol, .4 * s, ` opacity="${f(clamp(topRim * 1.3))}"`);
      stern += `<g clip-path="url(#${tc})">${inn}</g>` + rim(trPoly, tc, [xAft, hM], hTop - hC, 1.1, 1.2);
    }
    stern += edge(trPoly, hullK);
    // the quarter gallery: a bay of windows on the side, a roof above, a drop below
    const gx = (h, t) => { const b = transX(h); return b - gal[0] * (1 - .1 * (h - gh0) / (gh1 - gh0)) * (1 - t); };
    const body = poly([[gx(gh0, 0), gh0], [gx(gh0, 1) + .5, gh0], [gx(gh1, 1) + .5, gh1], [gx(gh1, 0), gh1]]);
    const drop = spl([[gx(gh0, 0), gh0], [gx(gh0, .14), gh0 - 1.2], [gx(gh0, .5), gh0 - 2.3], [gx(gh0, .86), gh0 - 1.4], [gx(gh0, 1) + .5, gh0]], false) + 'Z';
    const rH = sp.galRoof || 2.1, roof = spl([[gx(gh1, 0) - .4, gh1], [gx(gh1, .2), gh1 + rH * .62], [gx(gh1, .58), gh1 + rH], [gx(gh1, .92), gh1 + rH * .71], [gx(gh1, 1) + .7, gh1]], false) + 'Z';
    const gI = t => lum([lerp(-.55, .5, t), .1, .85]);
    if (sil) stern += fillP(body + drop + roof, C); else {
      stern += (far ? '' : fillP(poly([[gx(gh0, 0) - .5, gh0 - 3.4], [gx(gh0, 1), gh0 - 3], [gx(gh0, 1), gh0], [gx(gh0, 0), gh0]]), col(mix(L.tone(hullK, -.8, cen[0], cen[1]), '#150d0a', .4)), ' opacity=".45"'))
        + fillP(drop, tone(sp.trim, lum([0, -.6, .8]))) + edge(drop, sp.trim, .8)
        + fillP(body, gr([gx(gh0, 0), gh0], [gx(gh0, 1), gh0], [0, .3, .6, 1].map(t => [t, tone(sp.gilt ? sp.trim : hullK, gI(t))]))) + fillP(roof, gr([0, gh1], [0, gh1 + rH], [[0, tone(hullK, lum([0, .3, .9]) - .1)], [1, tone(hullK, lum([0, .8, .6]))]]));
      const nw = Math.max(2, Math.round(gal[0] / 4));
      for (let j = 0; j < gal[1]; j++) { const h0 = gh0 + j * gal[2] + .55, h1 = h0 + gal[2] - 1.3;
        for (let i = 0; i < nw; i++) { const t0 = (i + .16) / nw, t1 = (i + .86) / nw, w = poly([[gx(h0, t0), h0], [gx(h0, t1), h0], [gx(h1, t1), h1], [gx(h1, t0), h1]]);
          stern += win(w, (gx(h0, t0) + gx(h1, t1)) / 2, (h0 + h1) / 2, gal[2] * .8) + (far ? '' : strokeP(w + seg([gx(h0, (t0 + t1) / 2), h0], [gx(h1, (t0 + t1) / 2), h1]) + seg([gx((h0 + h1) / 2, t0), (h0 + h1) / 2], [gx((h0 + h1) / 2, t1), (h0 + h1) / 2]), ink(hullK), .16 * s)); }
        if (!far) stern += strokeP(seg([gx(h0 - .55, 0) - .3, h0 - .5], [gx(h0 - .55, 1) + .6, h0 - .5]), sp.gilt ? tone('brass', If + .4) : tone(sp.trim, If + .3), .34 * s) + (sp.gilt ? strokeP(sag([gx(h1, 0), h1 + .3], [gx(h1, .5), h1 + .3], -.35) + sag([gx(h1, .5), h1 + .3], [gx(h1, 1), h1 + .3], -.35), tone('brass', If + .4), .2 * s) : ''); }
      if (!far) { const Rr = R('roof'); let tiles = ''; for (let i = 1; i < 6; i++) tiles += sag([gx(gh1, i / 6 - .02), gh1 + .15], [gx(gh1, .5 + (i / 6 - .5) * .35), gh1 + rH * .9 + Rr() * .15], .2); stern += strokeP(tiles, ink(hullK), .13 * s, ' opacity=".6"') + edge(body, hullK, .8) + edge(roof, hullK, .8); }
      if (lit) glowAt.push([transX((gh0 + gh1) / 2) - gal[0] * .4, (gh0 + gh1) / 2, gal[0] * 1.2 + gal[1] * 3]);
    }
    // small windows of the upper tiers on the side
    if (!plain && sp.tierWin) sp.tiers.forEach((t, j) => { const hb0 = tierBase(j + 1); if (j === 0 && sp.tiers.length > 1 && gh1 + 2 > Y(hb0, hb)) return; const Rr = R('tw' + j);
      for (let i = 0; i < sp.tierWin; i++) { const X = transX(Y(hb0, xAft)) - 3.2 - i * 3.6 - Rr() * .6; if (X < t[0] + 2) break; const H = Y(hb0 - t[1] * .55, X), w = box(X, H, 1.5, 1.7);
        if (H < gh1 + 2.4 && X > gx0 - 1 || i && Rr() < .35) continue;
        stern += win(w, X, H, 1.6) + strokeP(w + seg([X, H - .85], [X, H + .85]), ink(hullK), .15 * s) + strokeP(seg([X - .95, H + 1], [X + .95, H + 1]), sp.gilt ? tone('brass', If + .4) : tone(sp.trim, If + .3), .22 * s); } });
    // the stern lantern on the taffrail
    if (sp.lantern && !far) { const z = sp.lantern * Lu * .95, lx = xAft + sp.tw[0] * .5, ly = hTop + arch * .7, q = (a, b) => [lx + a * z + kT * b * z * .5, ly + 1.2 * z + b * z];
      const bodyL = poly([q(-.5, 0), q(.5, 0), q(.9, 2), q(.55, 2.5), q(-.55, 2.5), q(-.9, 2)]), capL = poly([q(-.75, 2.5), q(.75, 2.5), q(.2, 3.3), q(0, 3.9), q(-.2, 3.3)]);
      stern += strokeP(seg([lx, ly - .4], q(0, 0)), tone('iron', If), .3 * s);
      if (sil) stern += fillP(bodyL + capL, C); else { stern += win(bodyL, q(0, 1.2)[0], q(0, 1.2)[1], 1.6 * z, true) + strokeP(bodyL + seg(q(0, 0), q(0, 2.5)) + seg(q(-.7, 1), q(.7, 1)), tone('brass', If + .1), .2 * s) + fillP(capL, tone('brass', If + .2), ` stroke="${ink('brass')}" stroke-width="${f(.16 * s)}"`); if (lit) glowAt.push([q(0, 1.2)[0], q(0, 1.2)[1], 5 * z + 3]); } }
  }
  // an open rail with stanchions on the upper tiers; channels of the shrouds come later
  if (sp.openRail != null && !far && sp.tiers[sp.openRail]) { const Xa = sp.tiers[sp.openRail][0] + 1.6, Rr = R('rail'); let posts = '', hand = [];
    for (let X = Xa; X < xAft - .6; X += 1.5 + Rr() * .2) { posts += seg([X, rail(X) - .1], [X, rail(X) + 1.25]); hand.push([X, rail(X) + 1.25]); }
    if (hand.length > 1) stern += strokeP(posts, tone(sp.trim, If + .1), .26 * s) + strokeP(line(hand), tone(sp.trim, If + .3), .36 * s); }

  // ——— the beakhead, the bowsprit, the anchor ———
  const bs = sp.sprit, B0 = [xStem + 3.2, Hs - .9], bd = [-Math.cos(rad(bs.steeve)), Math.sin(rad(bs.steeve))], Bp = t => [B0[0] + bd[0] * bs.len * t, B0[1] + bd[1] * bs.len * t];
  const nUp = [bd[1], -bd[0]], jOff = 1.08 * Lu, Bend = bs.jib ? [Bp(1)[0] + bd[0] * bs.jib + nUp[0] * jOff, Bp(1)[1] + bd[1] * bs.jib + nUp[1] * jOff] : Bp(1);   // the jib-boom lies on the bowsprit
  let bow = '', bowBack = '';
  {
    const bk = sp.beak, topS = Y(sp.free, xStem) - .5, dep = bk[2] ? bk[2] * Lu : topS - .8, h1 = topS - dep, tip = [xStem - bk[0], topS + bk[1]], sA = [stemX(topS) + .6, topS], sB = [stemX(h1) + .6, h1];
    const lower = bk[2] ? [sB, [lerp(sB[0], tip[0], .45), lerp(sB[1], tip[1], .3)], [lerp(sB[0], tip[0], .8), lerp(sB[1], tip[1], .72)], [tip[0], tip[1] - .5]]
      : [sB, [sB[0] - bk[0] * .34, h1 + dep * .1], [sB[0] - bk[0] * .62, h1 + dep * .42], [lerp(sB[0], tip[0], .86), h1 + dep * .76], [tip[0], tip[1] - .7]];
    const beakD = spl(lower.concat([[tip[0] - .2, tip[1] + .4], [lerp(tip[0], sA[0], .5), lerp(tip[1], sA[1], .5) - .1 - bk[1] * .22], sA]), false) + 'L' + pp(sA[0] + 1, sA[1] - .5) + 'L' + pp(sB[0] + 1, sB[1]) + 'Z';
    const R1 = [[sA[0] + 1.6, sA[1] + 1.1], [lerp(sA[0], tip[0], .5), lerp(sA[1], tip[1], .5) + .55 - bk[1] * .2], [tip[0] + .6, tip[1] + .75]], hR = topS - Math.min(dep, 4.2 * Lu) * .55, R2 = [[sA[0] + .4, hR], [lerp(sA[0], tip[0], .5), lerp(hR, tip[1], .5) - .25], [tip[0] + 1, tip[1] - .1]];
    { // the head and the cutwater: a narrow knee, its fore edge turned away, the top in the sky light, the water's reflex below
      const dk = col(mix(L.tone(hullK, -.85, cen[0], cen[1]), '#150d0a', .4)), lt = col(mix(L.tone(hullK, .9, cen[0], cen[1]), L.keyColor, .35)), lo = Math.min(h1, 0);
      bow += fillP(beakD, gr([tip[0] - 1, 0], [sA[0] + 1, 0], [[0, tone(hullK, lum([-.8, .1, .6]) - .15)], [.6, tone(hullK, If - .25)], [1, tone(hullK, If - .12)]]));
      if (!sil) bow += fillP(beakD, gr([0, lo], [0, tip[1] + .5], [[0, reflexC, .35], [.12, dk, .3], [.45, dk, 0], [.85, lt, 0], [1, lt, .3]]));
      if (!plain) { let sm = ''; for (const k of [.3, .6]) { const a = []; for (let h = h1 + .6; h < topS - .4; h += 1.2) a.push([lerp(stemX(h) + .4, xStem - bk[0] * .55, k * .5), h]); if (a.length > 1) sm += line(a); } bow += strokeP(sm, dk, .14 * s, ' opacity=".4"'); }
      bow += edge(beakD, hullK, .8) + (topRim ? strokeP(spl([[tip[0] - .2, tip[1] + .4], [lerp(tip[0], sA[0], .5), lerp(tip[1], sA[1], .5) - .1 - bk[1] * .22], sA]), rimCol, .3 * s, ` opacity="${f(clamp(topRim * 1.2))}"`) : ''); }
    if (!plain) { let tim = ''; for (const t of [.25, .5, .75]) tim += seg([lerp(R1[0][0], R1[2][0], t), lerp(R1[0][1], R1[2][1], t) + .3], [lerp(R2[0][0], R2[2][0], t), lerp(R2[0][1], R2[2][1], t) - .1]);
      bow += strokeP(tim, tone(sp.trim, If), .28 * s) + strokeP(spl(R1) + spl(R2), sp.gilt ? tone('brass', If + .2) : tone(sp.trim, If + .25), .42 * s) + strokeP(spl(R1), ink(sp.trim), .12 * s, ' opacity=".5"'); }
    // a carved billet at the head: a dark scroll, no figure
    bow += dot(tip[0] - .2, tip[1] + .5, 1.05 * Lu) + ` fill="${tone(hullK, If - .2)}"${ow ? ` stroke="${ink(hullK)}" stroke-width="${f(ow * .7)}"` : ''}/>` + (plain ? '' : strokeP('M' + pp(tip[0] + .5, tip[1] + .3) + 'Q' + pp(tip[0] - .2, tip[1] + 1.4) + ' ' + pp(tip[0] - .8, tip[1] + .5) + 'Q' + pp(tip[0] - .3, tip[1] - .1) + ' ' + pp(tip[0] - .1, tip[1] + .6), sp.gilt ? tone('brass', If + .3) : tone(sp.trim, If + .35), .2 * s));
    bowBack += spar(B0, Bp(1), .95 * Lu, .62 * Lu, sp.spar);
    if (bs.jib) { const J0 = [Bp(.6)[0] + nUp[0] * jOff, Bp(.6)[1] + nUp[1] * jOff], cap = (t, w, a0, a1, km, I) => { const c = Bp(t), e = [bd[0] * w / 2, bd[1] * w / 2]; return fillP(poly([[c[0] - e[0] + nUp[0] * a0, c[1] - e[1] + nUp[1] * a0], [c[0] + e[0] + nUp[0] * a0, c[1] + e[1] + nUp[1] * a0], [c[0] + e[0] + nUp[0] * a1, c[1] + e[1] + nUp[1] * a1], [c[0] - e[0] + nUp[0] * a1, c[1] - e[1] + nUp[1] * a1]]), tone(km, I)) + edge(poly([[c[0] - e[0] + nUp[0] * a0, c[1] - e[1] + nUp[1] * a0], [c[0] + e[0] + nUp[0] * a0, c[1] + e[1] + nUp[1] * a0], [c[0] + e[0] + nUp[0] * a1, c[1] + e[1] + nUp[1] * a1], [c[0] - e[0] + nUp[0] * a1, c[1] - e[1] + nUp[1] * a1]]), km, .5); };
      bowBack += spar(J0, Bend, .46 * Lu, .28 * Lu, sp.spar) + cap(.64, .45 * Lu, -.75 * Lu, jOff + .5 * Lu, 'rope', If - .1) + cap(.995, 1 * Lu, -.8 * Lu, jOff + .62 * Lu, 'tar', If - .05); }   // the heel lashing and the cap (an eselhoofd) at the end of the bowsprit
    if (near) bow += strokeP(seg([B0[0] - 1.2, B0[1] + .9], [B0[0] - 2.6, B0[1] - 2.2]) + seg([B0[0] - 2, B0[1] + 1.4], [B0[0] - 3.4, B0[1] - 1.8]), tone('rope', If - .2), .22 * s);
    if (!plain && kind !== 'merchant') { // the anchor hung from the cathead: a beam out of the bow at the rail, the ring on a short tackle
      const z = Lu, cx = xStem + 7.6, ch = rail(cx) - .7, cE = [cx - 1.5 * z, ch + .45 * z], rg = [cE[0] - .1 * z, cE[1] - 2.3 * z], q = (a, b) => [rg[0] + a * z, rg[1] + b * z];
      const so2 = shOff(.9), qs = (a, b) => { const p = q(a, b); return [p[0] + so2[0], p[1] + so2[1]]; }, ir = tone('iron', If - .1), irL = tone('iron', If + .65), hi = [dir * dC.ux * .13, -dC.uy * .13];
      const arms = g => 'M' + pp(...g(-2.7, -5.6)) + 'Q' + pp(...g(-.9, -8.5)) + ' ' + pp(...g(1.3, -6.1));
      const palm = (E, a) => { const c = Math.cos(a), sn = Math.sin(a), P = (x, y) => [E[0] + (x * c - y * sn) * z, E[1] + (x * sn + y * c) * z]; return spl([P(-.15, -.35), P(.55, -.5), P(1.25, .05), P(.45, .4), P(-.1, .25)], true); };
      bow += strokeP(seg(qs(-.15, -.4), qs(-.55, -7.4)) + arms(qs), shd, .7 * s, ' opacity=".28" stroke-linecap="round"')                         // its shadow on the bow
        + spar([cx + 1.6 * z, ch - .15], cE, .6 * z, .52 * z, sp.trim) + fillP(box(cE[0] - .15 * z, cE[1], .8 * z, 1.15 * z), tone(sp.trim, lum([-.8, .1, .6])), ` stroke="${ink(sp.trim)}" stroke-width="${f(.14 * s)}"`)
        + strokeP(seg([cE[0] - .4 * z, cE[1] - .45 * z], q(-.2, .25)) + seg([cE[0] + .2 * z, cE[1] - .45 * z], q(.2, .25)), tone('rope', If), .17 * s)
        + spar(q(-.15, -.4), q(-.55, -7.4), .27 * z, .33 * z, 'iron', { grain: false })
        + strokeP(arms(q), ir, .52 * s, ' stroke-linecap="round"') + strokeP(arms((a, b) => { const p = q(a, b); return [p[0] + hi[0], p[1] + hi[1]]; }), irL, .15 * s, ' stroke-linecap="round" opacity=".7"')
        + fillP(palm(q(-2.7, -5.6), 2.2) + palm(q(1.3, -6.1), .95), gr(q(0, -5.4), q(0, -7.4), [[0, tone('iron', If + .35)], [1, tone('iron', If - .45)]]), ` stroke="${ink('iron')}" stroke-width="${f(.1 * s)}"`)
        + spar(q(-1.7, -1.25), q(1.4, -.95), .33 * z, .26 * z, 'oak', { bulge: .25 }) + dot(...q(0, .05), .34 * z) + ` fill="none" stroke="${ir}" stroke-width="${f(.17 * s)}"/>` + dot(...q(-.07, .12), .34 * z) + ` fill="none" stroke="${irL}" stroke-width="${f(.06 * s)}" opacity=".7"/>`; }
  }

  // ——— masts, yards, sails ———
  const ropeD = sil ? C : col(mix(L.tone('tar', If * .5, cen[0], cen[1]), '#17110d', .35)), ropeL = tone('rope', If - .1), sailK = sp.sail, cond = sp.cond;
  // the light through the cloth comes from one source for the whole rig (the moon, the low sun, the glow of the fog):
  // the sails nearer to it shine more; it is one gradient in scene units shared by every sail
  let thruG = '';
  const thru = () => { if (thruG) return thruG; thruG = nid('ht', u); const Hx = Math.max(...sp.masts.map(m => m.H)), c = pt(0, Hx * .52), R0 = Hx * s, src = [c[0] + dC.ux * R0 * .7, c[1] + dC.uy * R0 * .7], lt = mix(tone(sailK, -1), col(L.keyColor), .4);
    defs += `<radialGradient id="${thruG}" gradientUnits="userSpaceOnUse" cx="${f(src[0])}" cy="${f(src[1])}" r="${f(R0 * 1.25)}"><stop offset="0" stop-color="${lt}" stop-opacity=".85"/><stop offset=".38" stop-color="${lt}" stop-opacity=".5"/><stop offset=".75" stop-color="${lt}" stop-opacity=".16"/><stop offset="1" stop-color="${lt}" stop-opacity="0"/></radialGradient>`; return thruG; };
  // a sail on a map S(u, v) -> local point: u — from the fore edge to the aft one, v — from the head to the foot
  const cloth = (S, q) => {
    const Rr = R(q.name), N = 14, wd = q.wd, ht = q.ht, rough = cond !== 'whole' && cond !== 'mended' && q.tear !== false, mended = cond === 'mended' && q.tear !== false, rags = cond === 'rags', torn = cond === 'torn';
    const at0 = (cu, cv) => (du, dv) => S(clamp(cu + du / wd, .025, .975), clamp(cv + dv / ht, .035, .96));
    // the foot of a torn sail: a smooth line cut by tears of different depth, width and slant, with tatters hanging below
    let dvAt = () => 0;
    const cuts = [], tg = [];
    if (rough && q.foot !== false) {
      for (let i = 0, nt = rags ? 4 + Math.floor(Rr() * 3) : torn ? 2 + Math.floor(Rr() * 2) : 1 + Math.floor(Rr() * 2); i < nt; i++) { const w = (rags ? .02 : .014) + Rr() * .055, sk = (Rr() - .5) * .9;
        cuts.push([.07 + Rr() * .86, (rags ? .07 + Rr() * .25 : .035 + Rr() * .13) * (Rr() < .3 ? .45 : 1), w * (1 + sk), w * (1 - sk)]); }
      for (let i = 0, nt = rags ? 2 + Math.floor(Rr() * 3) : torn && Rr() > .5 ? 1 : 0; i < nt; i++) tg.push([.1 + Rr() * .8, .025 + Rr() * (rags ? .09 : .045), .012 + Rr() * .026]);
      const p1 = Rr() * 6, p2 = Rr() * 6, am = rags ? .02 : .009;
      dvAt = uu => { let dv = am * (.55 + .45 * Math.sin(uu * 17 + p1)) * (.5 + .5 * Math.sin(uu * 43 + p2));
        for (const c of cuts) { const x = uu < c[0] ? (c[0] - uu) / c[2] : (uu - c[0]) / c[3]; if (x < 1) dv = Math.max(dv, c[1] * Math.pow(1 - x, 1.6)); }
        for (const t of tg) { const x = Math.abs(uu - t[0]) / t[2]; if (x < 1) dv = Math.min(dv, -t[1] * Math.pow(1 - x * x, .3)); }
        return dv; };
    }
    const p3 = Rr() * 6, p4 = Rr() * 6, jag = rags ? .035 : 0, wl = (v, p) => jag * Math.sin(Math.PI * v) * (.45 + .55 * Math.sin(v * 11 + p));   // a ragged leech and luff
    let dOut;
    if (!rough) { const pts = [S(0, 0), S(1, 0)]; for (let i = 1; i <= N; i++) pts.push(S(1, i / N)); for (let i = 1; i < N; i++) pts.push(S(1 - i / N, 1)); for (let i = 0; i < N; i++) pts.push(S(0, 1 - i / N)); dOut = line(pts) + 'Z'; }
    else { const us = []; for (let i = 1, n = Math.max(24, Math.round(wd * 2.2)); i < n; i++) us.push(i / n);
      for (const c of cuts) us.push(c[0], c[0] - c[2] * .45, c[0] + c[3] * .45); for (const t of tg) us.push(t[0], t[0] - t[2] * .97, t[0] + t[2] * .97, t[0] - t[2] * .6, t[0] + t[2] * .6);
      const pts = [S(1, 0)]; for (let i = 1; i < N; i++) pts.push(S(1 - wl(i / N, p3), i / N)); pts.push(S(1, 1 - dvAt(1)));
      us.filter(v => v > .012 && v < .988).sort((a, b) => b - a).forEach(uu => pts.push(S(uu, 1 - dvAt(uu))));
      pts.push(S(0, 1 - dvAt(0))); for (let i = N - 1; i > 0; i--) pts.push(S(wl(i / N, p4), i / N)); pts.push(S(0, 0));
      dOut = 'M' + pp(...S(0, 0)) + 'L' + spl(pts).slice(1) + 'Z'; }
    // holes of three kinds, none over another: a ragged round, a rip along the threads, a flap hanging into its tear
    let dHole = '', flaps = '', fringe = '';
    if (rough) { const nH = Math.round(wd * ht / (rags ? 90 : torn ? 115 : 240) * (.6 + Rr() * .8)), hs = [];
      for (let tr = 0; hs.length < nH && tr < nH * 8 + 8; tr++) {
        const r = (rags ? .95 : .75) + Math.pow(Rr(), 2.2) * (rags ? 3 : 2.3), cu = .12 + Rr() * .76, cv = .14 + Rr() * .62;
        if (cv + r * 1.6 / ht > 1 - Math.max(dvAt(cu), dvAt(clamp(cu - r / wd)), dvAt(clamp(cu + r / wd))) - .04 || cu - r * 1.3 / wd < .04 || cu + r * 1.3 / wd > .96 || cv - r * 1.6 / ht < .05) continue;
        if (hs.some(h => Math.hypot((h[0] - cu) * wd, (h[1] - cv) * ht) < (h[2] + r) * 1.3 + .8)) continue;
        hs.push([cu, cv, r]);
        const at = at0(cu, cv), ty = Rr(), hp = [];
        if (ty < .42) { // a ragged round, longer up and down, its edge chewed
          const m = 10 + Math.floor(Rr() * 4), rx = r * (.7 + Rr() * .4), ry = r * (1.05 + Rr() * .45), a1 = Rr() * 6, a2 = Rr() * 6;
          for (let k = 0; k < m; k++) { const a = (k + (Rr() - .5) * .4) / m * 2 * Math.PI, rr = (1 + .26 * Math.sin(2 * a + a1) + .14 * Math.sin(3 * a + a2)) * (k % 3 === 1 ? .8 + Rr() * .15 : .96 + Rr() * .1); hp.push(at(Math.sin(a) * rx * rr, -Math.cos(a) * ry * rr)); }
          dHole += spl(hp, true);
        } else if (ty < .88 || !near || cond === 'patched') { // a rip: a crooked slit, wide in the middle, pointed at the ends
          const l = r * (2.2 + Rr() * 1.8), ang = (Rr() < .7 ? Math.PI / 2 : 0) + (Rr() - .5) * .6, ca = Math.cos(ang), sa = Math.sin(ang), m = 5, wv = r * (.26 + Rr() * .3), A = [], B = [];
          for (let k = 0; k <= m; k++) { const t = k / m, off = k && k < m ? (Rr() - .5) * l * .16 : 0, x = (t - .5) * l * ca - off * sa, y = (t - .5) * l * sa + off * ca, w = k && k < m ? wv * Math.pow(Math.sin(Math.PI * t), .8) * (.65 + Rr() * .7) : 0;
            A.push(at(x - sa * w, y + ca * w)); if (k && k < m) B.unshift(at(x + sa * w * (.5 + Rr() * .7), y - ca * w * (.5 + Rr() * .7))); }
          dHole += spl(A.concat(B), true);
        } else { // a flap: an L-shaped tear; the loose piece hangs from the upper edge, its back to us
          const w = r * (1.2 + Rr() * .8), h = r * (1.3 + Rr() * .9), lean = (Rr() - .5) * r * .8, A = [-w / 2, -h * .45], B = [w / 2, -h * .5 + (Rr() - .5) * r * .3], Cc = [lean, h * .55];
          const mid = (p, p2, j) => [lerp(p[0], p2[0], .5) + (Rr() - .5) * j, lerp(p[1], p2[1], .5) + (Rr() - .5) * j];
          dHole += spl([A, mid(A, B, r * .25), B, [lerp(B[0], Cc[0], .35) + r * .3, lerp(B[1], Cc[1], .35)], mid(B, Cc, r * .45), [Cc[0] + r * .2, Cc[1] - r * .1], Cc, [Cc[0] - r * .25, Cc[1] - r * .15], mid(Cc, A, r * .45), [lerp(A[0], Cc[0], .3) - r * .3, lerp(A[1], Cc[1], .3)]].map(p => at(p[0], p[1])), true);
          const Fc = [lean * .5 + (Rr() - .5) * r * .5, h * .3];
          flaps += spl([A, mid(A, B, r * .1), B, [lerp(B[0], Fc[0], .55) + r * .1, lerp(B[1], Fc[1], .55)], Fc, [lerp(A[0], Fc[0], .5) - r * .1, lerp(A[1], Fc[1], .5)]].map(p => at(p[0] * .93, p[1] + r * .04)), true);
        }
        if (near && Rr() > .35) for (let k = 0, nk = 2 + Math.floor(Rr() * 4); k < nk; k++) { const x0 = (Rr() - .5) * r * 1.1, y0 = -r * (.6 + Rr() * .3), ln = r * (.25 + Rr() * .7), b = (Rr() - .5) * .5;   // threads hanging into the hole
          fringe += 'M' + pp(...at(x0, y0)) + 'Q' + pp(...at(x0 + b * ln, y0 + ln * .55)) + ' ' + pp(...at(x0 + (b * 1.8 - .1) * ln, y0 + ln)); }
      }
      if (q.foot !== false && near) for (let k = 0, nf = Math.round(wd * (rags ? .9 : .3)); k < nf; k++) { const uu = .03 + Rr() * .94, p0 = S(uu, 1 - dvAt(uu) - .004), ln = .3 + Math.pow(Rr(), 1.8) * (rags ? 2.2 : 1.2), b = (Rr() - .5) * .8;   // loose threads along the torn foot
        fringe += 'M' + pp(...p0) + 'Q' + pp(p0[0] + (b * .4 - .1) * ln, p0[1] - ln * .55) + ' ' + pp(p0[0] + (b - .25) * ln, p0[1] - ln); }
    }
    const d = dOut + dHole;
    const sv = sp.sailVar ? strHash(q.name) % 4 : -1, svar = c => sv === 0 ? mix(c, '#f6f2e8', .32) : sv === 1 ? mix(c, '#7e7260', .3) : c;   // cloths of different age: one new and whiter, one grey-brown
    const paint = gr(S(0, .5), S(1, .5), [0, .2, .4, .6, .8, 1].map(t => [t, svar(tone(sailK, lum([lerp(q.nF[0], q.nA[0], t), lerp(q.nF[1], q.nA[1], t), lerp(q.nF[2], q.nA[2], t)])))]));
    let out = `<path d="${d}" fill="${paint}" fill-rule="evenodd"/>`;
    if (sil) return out;
    const Im = lum([(q.nF[0] + q.nA[0]) / 2, .1, (q.nF[2] + q.nA[2]) / 2]), shade = tone(sailK, Im - .5), glowE = back ? mix(tone(sailK, -1), col(L.keyColor), .55) : shade, cid = clipOf(d); let inn = '';
    if (!far) { // cloths: seams along the sail, every cloth of its own tone
      const nc = Math.max(3, Math.round(wd / 2.3)), cuts2 = []; let seams = '';
      for (let i = 0; i <= nc; i++) cuts2.push(clamp((i + (i && i < nc ? (Rr() - .5) * .3 : 0)) / nc));
      const col2 = uu => [0, .2, .4, .6, .8, 1.06].map(v => S(uu, v));
      for (let i = 0; i < nc; i++) { if (i) seams += line(col2(cuts2[i])); if (near && Rr() > .4) inn += fillP(poly(col2(cuts2[i]).concat(col2(cuts2[i + 1]).reverse())), Rr() > .5 ? shade : tone(sailK, Im + .4), ` opacity="${f(.05 + Rr() * .08)}"`); }
      inn += strokeP(seams, shade, clamp(.15 * s, .12, .3), ` opacity="${back ? .6 : .45}"`);
      if (q.reef) for (const v of q.reef) { const a = []; for (let i = 0; i <= 8; i++) a.push(S(i / 8, v)); inn += strokeP(line(a), shade, .5 * s, ' opacity=".3"');
        if (near) { let rp = ''; for (let i = 1; i < nc * 2; i++) { const p = S(i / (nc * 2), v); rp += seg(p, [p[0] + (Rr() - .5) * .3, p[1] - .8 - Rr() * .4]); } inn += strokeP(rp, shade, .13 * s, ' opacity=".6"'); } }
      if (rough || mended) { // stains, patches (a mended sail: only stains and patches of other cloth, stitched round)
        const sid = nid('hs', u); defs += `<radialGradient id="${sid}"><stop offset="0" stop-color="${shade}" stop-opacity="1"/><stop offset="1" stop-color="${shade}" stop-opacity="0"/></radialGradient>`;
        for (let i = 0; i < 2 + Math.round(wd * ht / 200); i++) { const p = pt(...S(.1 + Rr() * .8, .1 + Rr() * .8)); inn += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f((2 + Rr() * 4) * s)}" ry="${f((2 + Rr() * 5) * s)}" fill="url(#${sid})" opacity="${f(.2 + Rr() * .3)}"/>`; }
        const np = cond === 'patched' ? 1 + Math.round(wd * ht / 260) : mended ? Math.round(wd * ht / 480 + Rr() * .9) : torn && Rr() > .5 ? 1 : 0;
        for (let i = 0; i < np; i++) { const cu = .15 + Rr() * .7, cv = .15 + Rr() * .65, k = mended ? .55 + Rr() * 1.3 : 1, du = (1.4 + Rr() * 1.6) / wd * k, dv = (1.6 + Rr() * 2) / ht * k, j = () => (Rr() - .5) * .25;
          // a mended sail: patches of different size, cut unevenly (a crooked edge with a midpoint on every side)
          const pd = mended ? poly([[-1, -1], [0, -1.15], [1, -1], [1.1, 0], [1, 1], [0, 1.1], [-1, 1], [-1.12, 0]].map(([a, b]) => S(cu + du * (a + (Rr() - .5) * .3), cv + dv * (b + (Rr() - .5) * .3)))) : poly([S(cu - du * (1 + j()), cv - dv * (1 + j())), S(cu + du * (1 + j()), cv - dv * (1 + j())), S(cu + du * (1 + j()), cv + dv * (1 + j())), S(cu - du * (1 + j()), cv + dv * (1 + j()))]);
          const pc = Rr(); inn += fillP(pd, mended ? (pc < .4 ? tone(sailK, Im + .45) : pc < .75 ? mix(tone(sailK, Im - .1), '#8a6a3a', .35) : mix(tone(sailK, Im), '#7a7e70', .4)) : pc > .5 ? tone(sailK, Im + .35) : shade, mended ? ' opacity=".45"' : ' opacity=".5"') + (near ? strokeP(pd, shade, .14 * s, ` stroke-dasharray="${f(.5 * s)} ${f(.4 * s)}" opacity=".8"`) : ''); }
      }
      if (back && q.mastU != null) { const a = []; for (let i = 0; i <= 6; i++) a.push(S(q.mastU, i / 6)); inn += strokeP(line(a), shade, 1.3 * Lu * s, ' opacity=".2"'); }   // the mast seen through the cloth
    }
    // the turn of the cloth: shadow under the yard, the foot rolled under
    inn += fillP(d, gr(S(.5, 0), S(.5, 1), [[0, shade, back ? .25 : .5], [.07, shade, back ? .1 : .22], [.2, shade, 0], [.7, shade, 0], [1, shade, .34]]), ' fill-rule="evenodd"');
    if (!far) { if (back) inn += fillP(d, `url(#${thru()})`, ' fill-rule="evenodd"');   // against the light: the one source shines through
      else { const bid = nid('hb', u), c = pt(...S(clamp(.5 + .3 * dir * dC.ux, .22, .78), clamp(.45 + .25 * dC.uy, .22, .6))), lt = tone(sailK, Im + .55);   // in front light: the belly on the side of the source
        defs += `<radialGradient id="${bid}" gradientUnits="userSpaceOnUse" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(Math.min(wd, ht) * .62 * s)}"><stop offset="0" stop-color="${lt}" stop-opacity=".45"/><stop offset=".55" stop-color="${lt}" stop-opacity=".2"/><stop offset="1" stop-color="${lt}" stop-opacity="0"/></radialGradient>`; inn += fillP(d, `url(#${bid})`, ' fill-rule="evenodd"'); }
      if (rough) inn += strokeP(dHole + (q.foot !== false ? dOut : ''), glowE, clamp(.7 * s, .3, 1.3), ` opacity="${back ? .1 : .1}"`) + strokeP(dHole, glowE, clamp(.3 * s, .15, .6), ` opacity="${back ? .1 : .12}"`);   // the thin frayed edges: no outline, a soft rim
    }
    out += `<g clip-path="url(#${cid})">${inn}</g>`;
    if (!far) { const thr = mix(tone(sailK, Im + .15), glowE, back ? .4 : 0);
      if (flaps) out += fillP(flaps, back ? mix(tone(sailK, -.6), col(L.keyColor), .22) : tone(sailK, Im - .4)) + strokeP(flaps, shade, clamp(.12 * s, .1, .25), ' opacity=".55"');
      out += strokeP(fringe, thr, clamp(.1 * s, .08, .22), ' opacity=".8" stroke-linecap="round"') + rim(dOut, cid, S(.5, .5), Math.max(wd, ht) * .6, .9, 1.1) + strokeP(dOut, ink(sailK), rough ? clamp(ow * .6, .3, .6) : clamp(ow * .85, .4, .8), ` stroke-linejoin="round"${rough ? ' opacity=".75"' : ''}`); }
    return out;
  };
  // a furled sail: a lumpy roll under the yard with gaskets
  const furl = (c, hw, name, k = 1) => { const Rr = R(name), n = Math.max(4, Math.round(hw * 2 / 2.4)), a = [[c[0] - hw, c[1] - .1]], b = [];
    for (let i = 0; i <= n; i++) { const t = i / n; b.push([c[0] - hw + 2 * hw * t, c[1] - .25 - (.7 + Rr() * .7) * k * Lu * Math.pow(Math.sin(Math.PI * clamp(t, .04, .96)), .4)]); }
    const d = spl(a.concat(b, [[c[0] + hw, c[1] - .1]]), false) + 'Z'; let g = '';
    if (!plain) for (let i = 1; i < n; i++) g += seg([b[i][0], c[1] + .2], [b[i][0] + .15, b[i][1] - .1]);
    return fillP(d, gr([c[0], c[1]], [c[0], c[1] - 1.6 * k * Lu], [[0, tone(sailK, lum([0, .6, .8]))], [1, tone(sailK, lum([0, -.7, .7]))]])) + strokeP(g, ink(sailK), .14 * s, ' opacity=".7"') + (ow ? strokeP(d, ink(sailK), Math.max(.25, ow * .6)) : ''); };
  const sqMap = (hc, hw, fc, fw, bel, roach) => (uu, v) => { const X = lerp(hc[0] + (2 * uu - 1) * hw, fc[0] + (2 * uu - 1) * fw, v), H = lerp(hc[1], fc[1], v), sv = Math.pow(Math.max(0, Math.sin(Math.PI * v)), .85); return [X - bel * sv * (.72 + .6 * (1 - uu)), H + roach * 4 * uu * (1 - uu) * v * v]; };
  const quadMap = (c00, c10, c01, c11, bel, roach) => (uu, v) => { const a = [lerp(c00[0], c10[0], uu), lerp(c00[1], c10[1], uu)], b = [lerp(c01[0], c11[0], uu), lerp(c01[1], c11[1], uu)]; return [lerp(a[0], b[0], v) - bel * Math.sin(Math.PI * v) * (.25 + .75 * uu), lerp(a[1], b[1], v) + roach * 4 * uu * (1 - uu) * v * v - bel * .25 * Math.sin(Math.PI * v) * uu]; };
  const nSq = [[-.82, .12, .52], [.28, .12, .94]], nFa = [[-.4, .05, .9], [.3, .05, .94]];

  const masts = sp.masts.map((m, mi) => { const hD = rail(m.x) - 1.5, Hm = m.H - hD, rk = Math.tan(rad(m.rake || 0)), A = q => [m.x + rk * q * Hm, hD + q * Hm], Q = QY[m.n], qs = Q.slice(), st = [];
    for (let i = 0; i < m.n; i++) { st[i] = i === 0 && m.aft && !m.lower ? 'bare' : set === 'furled' ? 'furl' : set === 'reefed' ? (i === 1 ? 'reef' : 'furl') : 'set';
      if (i && st[i] === 'reef') qs[i] = lerp(Q[i - 1], Q[i], .66); if (i && st[i] === 'furl') qs[i] = lerp(Q[i - 1], Q[i], i === 1 ? .5 : .62); }
    const w = Q.map((_, i) => WY[i] * sp.len * m.k), qT = Q[0] + .035, qC = m.n >= 3 ? Q[1] + .03 : null, rr = Lu * Math.pow(m.k, .6) * (m.n === 2 && sp.len < 80 ? .9 : 1);
    return { m, mi, hD, Hm, A, Q, qs, st, w, qT, qC, rr }; });
  let rigBack = '', sails = '', spars = '', rigFront = '', standing = '', running = '', thin = '', lifts = '';
  // stays: from every masthead forward and down to the mast ahead or to the bowsprit
  masts.forEach((M, i) => { const P = masts[i - 1], heads = [M.A(M.qT - .01), M.A(M.qC != null ? M.qC : 1), M.A(1)];
    if (!P) { standing += seg(heads[0], Bp(.5)) + seg(heads[1], Bp(.96)); if (M.qC != null) standing += seg(heads[2], Bend); if (!far) standing += seg(Bp(.72), [stemX(sp.free * .3) - .3, sp.free * .3]); }
    else { standing += seg(heads[0], P.A(.04)) + seg(heads[1], P.A(P.qT)); if (M.qC != null) standing += seg(heads[2], P.A(P.qC != null ? P.qC : 1)); } });
  rigBack += strokeP(standing, ropeD, rw(.24), far ? ' opacity=".5"' : ' opacity=".9"'); standing = '';
  const shr = [];   // the shrouds of every mast (channel, spread, top) for the crew and the lanterns of sp.life
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
      if (!far) { const up = A(Math.min(1, qs[i] + (i + 1 < m.n ? (Q[i + 1] - Q[i]) * .42 : (1 - Q[i]) * .9))); lifts += seg([c[0] - hw, c[1] + .3], up) + seg([c[0] + hw, c[1] + .3], up);
        const N = masts[M.mi + 1], to = N ? N.A(Math.max(.06, qs[i] * .62 - .1)) : [Math.min(xAft, c[0] + hw + 12 + i * 3), rail(Math.min(xAft, c[0] + hw + 12 + i * 3)) + .2]; running += sag([c[0] + hw, c[1]], to, -1.2); }
    }
    // the fore-and-aft sail of the mizzen
    if (m.aft === 'lateen') { const lt = m.lat || [.105, .11, .64], F = [m.x - lt[0] * sp.len * m.k / .7, hD + Hm * .1], Pk = [m.x + lt[1] * sp.len * m.k / .7, hD + Hm * lt[2]], cx = Math.min(xAft + 1, m.x + .13 * sp.len * m.k / .7), Cw = [cx, rail(Math.min(cx, xAft)) + 1.8];
      if (set !== 'furled') sails += cloth(quadMap(F, Pk, F, Cw, 1.6 * Lu, -1.2), { name: nm + 'lat', wd: Pk[0] - F[0], ht: (Pk[1] - Cw[1]) * .7, nF: nFa[0], nA: nFa[1], foot: false });
      spars += spar(F, Pk, .42 * rr, .26 * rr, sp.yard); if (!far) running += seg(Cw, [cx - 1, rail(Math.min(cx, xAft))]) + seg(Pk, A(Q[1] * .93)) + seg(F, [F[0] + 1.5, rail(F[0] + 1.5)]);
    } else if (m.aft === 'gaff') { // the gaff passes under the yardarm of the lower yard, clear of the topsail's clew
      const Lg = .15 * sp.len * m.k / .74, yH = A(Q[0])[1] - 1.3 * Lu, xc = (w[0] + 1.6) / Lg, qt = clamp(Math.min(.38, (yH - Hm * .13 * xc - hD) / Hm), .27, .38), th = A(qt), rise = Math.min(Hm * .13, Math.max(Hm * .05, (yH - th[1]) / xc)), tk = A(.07), Pk = [th[0] + Lg, th[1] + rise], Bm = [tk[0] + .185 * sp.len * m.k / .74, tk[1] + 1.4];
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
    rigFront += ch; shr.push({ xb, sprd, hCh, tp, ns, sx });
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
    if (bs.spritsail) { const hw = .045 * sp.len, tipX = xStem - sp.beak[0], tipH = Y(sp.free, xStem) - .5 + sp.beak[1], ts = clamp((B0[0] - (tipX - 2.4 - hw)) / (-bd[0] * bs.len), .56, .97), c = Bp(ts), yc = [c[0], c[1] - 1.25 * Lu];   // the spritsail hangs ahead of the head, clear of it
      const footH = Math.max(1.6, yc[1] - .1 * sp.len, yc[0] + 1.2 + hw > tipX - 1 ? tipH + 1.6 : -9);
      if (bs.spritsail === 'set' && set === 'full') sails = cloth(sqMap([yc[0], yc[1] - .3], hw * .95, [yc[0] + 1.2, footH], hw * .9, 1 * Lu, .6), { name: 'sps', wd: hw * 2, ht: yc[1] - footH, nF: nSq[0], nA: nSq[1] }) + sails; else sails = furl(yc, hw * .92, 'spsf', .7) + sails;
      spars += spar([yc[0] - hw, yc[1]], [yc[0] + hw, yc[1]], .32 * Lu, .32 * Lu, sp.yard, { bulge: .3 }); if (!far) running += seg([yc[0] - hw * .5, yc[1]], Bp(.7)) + seg([yc[0] + hw * .5, yc[1]], Bp(.42)) + seg([yc[0] - hw, yc[1]], Bp(.95)); }
  }
  rigBack += strokeP(lifts, ropeD, rw(.14), ' opacity=".8"'); rigFront += strokeP(standing, ropeD, rw(.22), far ? ' opacity=".5"' : '') + strokeP(thin, ropeD, rw(.14), ' opacity=".85"') + strokeP(running, ropeL, rw(.15), ` opacity="${back ? .5 : .65}"`);

  // ——— flags: they fly to the bow, with the wind that fills the sails ———
  const flagAt = (X0, Ht, fw, fh, design, name) => { const Rr = R(name), ph = Rr() * 6, taper = design === 'pennant' ? 1 : 0, rag = sp.growth || cond === 'torn';
    const F = (a, b) => [X0 - a * fw * (1 - .05 * b), Ht - b * fh * (1 - taper * a * .97) - taper * a * fh * .2 - .16 * a * a * fh * (taper ? 2.5 : 1) + .09 * fh * (taper ? 1.6 : 1) * Math.sin(a * 7.2 + ph) * Math.pow(a, .6)];
    const N = 12, pts = []; for (let i = 0; i <= N; i++) pts.push(F(i / N, 0)); if (rag && !taper) for (let i = 1; i < 6; i++) pts.push(F(1 - Rr() * .16, i / 6));
    let lo = N; if (rag && taper) { // a torn pennant: the fly split into tails of different length
      const a1 = .62 + Rr() * .1, a2 = .8 + Rr() * .1; pts.push(F(.97, .35), F(a1, .45), F(a2, .62), F(a1 - .08, .72), F(a1 + .02 + Rr() * .1, 1)); lo = Math.floor((a1 + .02) * N); }
    for (let i = lo; i >= 0; i--) pts.push(F(i / N, 1));
    const d = line(pts) + 'Z', km = design === 'jolly' ? 'ship-flag-black' : design === 'pennant' ? sp.pennant : 'linen';
    if (sil) return fillP(d, C);
    const cid = clipOf(d), I0 = lum([-.2, 0, .98]); let inn = '';
    const band = (b0, b1, a0, a1, c) => { const p = []; for (let i = 0; i <= 8; i++) p.push(F(lerp(a0, a1, i / 8), b0)); for (let i = 8; i >= 0; i--) p.push(F(lerp(a0, a1, i / 8), b1)); return fillP(poly(p), c); };
    if (design === 'company') { const red = tone('ship-flag-red', I0); for (let i = 0; i < 7; i++) inn += band(i / 7, (i + .5) / 7, 0, 1, red); inn += band(0, 3 / 7, 0, .38, tone('linen', I0)) + band(1.2 / 7, 1.8 / 7, 0, .38, red) + band(0, 3 / 7, .16, .22, red); }
    else if (design === 'merchant') inn += band(0, 1 / 3, 0, 1, tone('ship-flag-red', I0)) + band(2 / 3, 1, 0, 1, tone('water-wet', I0 + .2));
    else if (design === 'trade') inn += band(0, 1, 0, .3, tone('ship-flag-red', I0)) + band(.34, .66, .3, 1, tone('paint-ochre', I0 + .15));   // a plain trade ensign: a red hoist, an ochre stripe on white
    else if (design === 'plain') inn += band(.36, .64, 0, 1, tone('ship-flag-red', I0));
    else if (design === 'jolly' && !far) { const bone = tone('bone', I0 + .15), c = (a, b) => F(.5 + a * fh / fw, .47 + b), sk = []; for (let i = 0; i < 12; i++) { const t = i / 12 * 2 * Math.PI; sk.push(c(Math.sin(t) * .2, -.1 + Math.cos(t) * .2)); }
      inn += strokeP(seg(c(-.36, .12), c(.36, .44)) + seg(c(.36, .12), c(-.36, .44)), bone, .075 * fh * s, ' stroke-linecap="round"') + fillP(spl(sk, true) + poly([c(-.12, .04), c(.12, .04), c(.1, .2), c(-.1, .2)]), bone) + fillP(poly([c(-.12, -.12), c(-.03, -.12), c(-.04, -.03), c(-.11, -.03)]) + poly([c(.12, -.12), c(.03, -.12), c(.04, -.03), c(.11, -.03)]) + poly([c(0, 0), c(-.03, .06), c(.03, .06)]), tone(km, I0)); }
    const sh = tone(km, I0 - .6), fold = []; for (let i = 0; i <= 8; i++) { const a = i / 8; fold.push([a, sh, clamp(.2 - .26 * Math.cos(a * 7.2 + ph)) * (i ? 1 : .3)]); }
    inn += fillP(d, gr(F(0, .5), F(1, .5), fold));
    return fillP(d, tone(km, I0)) + `<g clip-path="url(#${cid})">${inn}</g>` + (ow ? strokeP(d, ink(km), .28 * s, ' stroke-linejoin="round"') : ''); };
  let flags = '';
  { const main = masts.reduce((a, b) => b.m.H > a.m.H ? b : a), t = main.A(1), fore = masts[0], z = Lu;
    if (sp.flag === 'pennant') flags += flagAt(t[0] - .2, t[1] + 1.2, 22 * z, 2.2 * z, 'pennant', 'pen');
    if (sp.flag === 'pennant' && sp.forePennant && fore !== main) { const ft = fore.A(1); flags += flagAt(ft[0] - .2, ft[1] + 1, 13 * z, 1.6 * z, 'pennant', 'penF'); }
    else { flags += strokeP(seg(t, [t[0], t[1] + 6.6 * z]), ropeD, rw(.34)) + flagAt(t[0] - .15, t[1] + 6.4 * z, 9.5 * z, 5.6 * z, sp.flag, 'flag'); if (fore !== main) { const ft = fore.A(1); flags += flagAt(ft[0] - .2, ft[1] + 1, 11 * z, 1.7 * z, 'pennant', 'pen'); } }
    if (sp.ensign) { const k = sp.ensignK || 1, b = [xAft + sp.tw[0] * .92, hTop + .2], e = [b[0] + 4 * k, b[1] + 16 * k]; flags += strokeP(seg(b, e), tone(sp.spar, If), rw(.42 * Math.sqrt(k))) + flagAt(e[0] - .3, e[1] - .3, 15 * k, 9 * k, sp.ensign, 'ens'); } }

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
    if (!plain) { // barnacles in uneven clumps: thick at the waterline and under the wales, every one a little cone with its pit
      const bg = nid('hy', u); defs += `<radialGradient id="${bg}" cx=".5" cy=".5" r=".6" fx="${f(.5 + .32 * dC.ux)}" fy="${f(.5 + .32 * dC.uy)}"><stop offset="0" stop-color="${tone('bone', If + .5)}"/><stop offset=".5" stop-color="${tone('bone', If - .1)}"/><stop offset="1" stop-color="${tone('bone', -.7)}"/></radialGradient>`;
      const pit = col(mix(tone('ship-ghost', -.9), '#0a1210', .4)), nc = Math.round(sp.len / (near ? 2.2 : 3.6)); let pits = '';
      for (let c = 0; c < nc; c++) { const X0 = -hb + 2 + Rr() * (sp.len - 4), H0 = Rr() < .65 ? .2 + Math.pow(Rr(), 1.5) * 2.4 : sp.wales[Math.floor(Rr() * sp.wales.length)] - .9 - Rr() * .6, n = 3 + Math.floor(Math.pow(Rr(), 1.6) * 12);
        let X = X0, H = Y(H0, X0);
        for (let k = 0; k < n; k++) { const r = (.13 + Math.pow(Rr(), 2) * .36) * Lu, a = Rr() * 6.28, p = pt(X, H), rx = r * s * (.85 + Rr() * .35), ry = r * s * (.7 + Rr() * .3);
          shells += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(Rr() * 180)} ${f(p[0])} ${f(p[1])})" opacity="${f(.6 + Rr() * .35)}"/>`;
          if (near && r > .2 * Lu) pits += dot(X - dir * dC.ux * r * .18, H + dC.uy * r * .18, r * .2) + '/>';
          X += Math.cos(a) * r * 1.7; H += Math.sin(a) * r * 1.2 - .04; } }
      growA += `<g clip-path="url(#${wlClip})"><g fill="url(#${bg})">${shells}</g><g fill="${pit}" opacity=".6">${pits}</g></g>`; }
  }

  // ——— life aboard (sp.life — the merchantman): the cargo piled high over the rail (barrels on the forecastle,
  // bales in the waist under a net and a faded tarpaulin, crates on the quarterdeck), a cargo boom swinging one more
  // bale over the hatch, two of the crew in light shirts (at the helm against the sky, up the main shrouds against
  // the sail), a lantern on the fore shrouds. All of it stands on the deck behind the bulwark: the rail hides the feet.
  let lifeBack = '', lifeFront = '';
  if (sp.life && !far && !refl) { const lf = sp.life, Rl = R('life'), deck = X => rail(X) - 1.5;
    const nF = lum([-1, .15, .6]), nA = lum([1, .15, .6]);   // the fore and the aft side of a thing on deck
    const gx3 = (Xa, Xb, km, k = 0) => gr([Xa, 0], [Xb, 0], [[0, tone(km, nF + k)], [.5, tone(km, If + k)], [1, tone(km, nA + k)]]);
    const sackT = (I, c) => mix(tone('linen', I), c, .72);
    // barrels on the forecastle, a second one standing on two: bellied staves, iron hoops, a light chime
    for (const [X, row] of lf.barrels || []) { const w = .9 + Rl() * .1, h = 2.5 + Rl() * .3, H0 = deck(X) + .7 + row * 2.85, d = 'M' + pp(X - w, H0) + 'Q' + pp(X - w * 1.32, H0 + h / 2) + ' ' + pp(X - w, H0 + h) + 'L' + pp(X + w, H0 + h) + 'Q' + pp(X + w * 1.32, H0 + h / 2) + ' ' + pp(X + w, H0) + 'Z';
      lifeBack += fillP(d, gx3(X - w * 1.2, X + w * 1.2, 'oak', -.05)) + strokeP(seg([X - w * 1.2, H0 + h * .28], [X + w * 1.2, H0 + h * .28]) + seg([X - w * 1.16, H0 + h * .74], [X + w * 1.16, H0 + h * .74]), tone('iron', If - .1), .26 * s)
        + strokeP(seg([X - w, H0 + h - .12], [X + w, H0 + h - .12]), tone('oak', If + .5), .16 * s, ' opacity=".8"') + edge(d, 'oak', .6); }
    const baleD = (X0, X1, H0, H1) => { const r = .45; return spl([[X0 + r, H0], [(X0 + X1) / 2, H0 - .05], [X1 - r, H0], [X1, H0 + r], [X1 + .06, (H0 + H1) / 2], [X1, H1 - r], [X1 - r, H1], [(X0 + X1) / 2, H1 + .1], [X0 + r, H1], [X0, H1 - r], [X0 - .06, (H0 + H1) / 2], [X0, H0 + r]], true); };
    const bale = (X0, X1, H0, H1) => { const d = baleD(X0, X1, H0, H1), c = mix('#a27a46', '#7e6a4e', Rl()), w = X1 - X0;
      return { d, svg: fillP(d, gr([X0, 0], [X1, 0], [[0, sackT(nF - .2, c)], [.5, sackT(If - .1, c)], [1, sackT(nA - .2, c)]])) + strokeP(seg([X0 + w * .35, H0 + .1], [X0 + w * .35, H1 - .1]) + seg([X0 + .1, (H0 + H1) / 2 + .2], [X1 - .1, (H0 + H1) / 2 + .2]), tone('rope', If - .3), .15 * s, ' opacity=".8"') + edge(d, 'linen', .5) }; };
    // the pile in the waist: three rows of bales stepped in, a net over it lashed to the rail, a tarpaulin over one end
    if (lf.bales) { const [a, b] = lf.bales, bw = 2.9, bh = 2.5, n = Math.max(1, Math.floor((b - a) / bw)), H00 = deck(a) + .6; let all = '', bales = '', topRow = 0;
      for (let row = 0; row < 3 && n - row > 0; row++) for (let i = 0; i < n - row; i++) { const X0 = a + i * bw + row * bw / 2 + .06, X1 = X0 + bw - .12, H0 = H00 + row * (bh + .04), q2 = bale(X0, X1, H0, H0 + bh); all += q2.d; bales += q2.svg; topRow = row; }
      const top = H00 + (topRow + 1) * (bh + .04) + .2, cid = clipOf(all); let net = '';
      for (let X = a - 9; X < b + 1; X += .95) net += seg([X, H00], [X + 7.5, top]) + seg([X + 7.5, H00], [X, top]);
      lifeBack += bales;
      if (lf.tarp) { const t0 = a + bw * 1.5, t1 = a + bw * 3.6, tH = H00 + 2 * (bh + .04) + bh + .35, d = 'M' + pp(t0 - .2, tH - .3) + 'Q' + pp((t0 + t1) / 2, tH + .5) + ' ' + pp(t1 + .3, tH - .2) + 'L' + pp(t1 + 1.8, H00 + bh * 1.2) + 'Q' + pp(t1 + 1, H00 + bh * .9) + ' ' + pp(t1 + 1.5, H00 + bh * .3) + 'L' + pp(t1 - .2, H00 + bh * 1.4) + 'L' + pp(t0 + .5, H00 + bh * 2.2) + 'Z';
        lifeBack += fillP(d, gx3(t0, t1 + 1.8, 'paint-red', -.25)) + fillP(d, mix(tone('canvas', If - .2), '#7e5a40', .7), ' opacity=".7"') + strokeP('M' + pp(t0 + 1.2, tH) + 'Q' + pp(t1 - .5, H00 + bh * 2.4) + ' ' + pp(t1 + 1, H00 + bh * .8), tone('paint-red', -.7), .14 * s, ' opacity=".6"') + edge(d, 'canvas', .5); }
      lifeBack += `<g clip-path="url(#${cid})">${strokeP(net, tone('rope', If - .15), .1 * s, ' opacity=".75"')}</g>` + strokeP(seg([a + bw / 2, top - .15], [a - .4, deck(a) + .4]) + seg([b - bw, top - .15], [b + .4, deck(a) + .4]), tone('rope', If - .1), .16 * s); }
    // crates lashed on the quarterdeck
    for (const [i, X] of (lf.crates || []).entries()) { const H0 = deck(X) + .4 + (i === 2 ? 2.3 : 0), w = 1.3, h = 2.2, d = box(X, H0 + h / 2, w * 2, h);
      lifeBack += fillP(d, gx3(X - w, X + w, 'pine-deck', -.2)) + strokeP(seg([X - w, H0 + h * .5], [X + w, H0 + h * .5]) + seg([X - w + .3, H0 + .2], [X + w - .3, H0 + h - .2]), tone('oak', -.4), .16 * s, ' opacity=".7"') + edge(d, 'oak', .6); }
    // the cargo boom: a spar from the main mast over the hatch, a tackle, one more bale hanging in a sling
    if (lf.boom != null && masts[1]) { const M = masts[1], heel = M.A(.1), X = lf.boom, tip = [X - 1.2, heel[1] + 15.5], ld = [X, deck(X) + 11.8];
      const q2 = bale(ld[0] - 1.5, ld[0] + 1.5, ld[1], ld[1] + 2.3);
      lifeBack += spar(heel, tip, .42, .3, sp.spar) + strokeP(seg(tip, M.A(.42)), ropeD, rw(.16)) + strokeP(seg(tip, [X, ld[1] + 3.4]) + seg([X, ld[1] + 3.4], [ld[0] - 1.3, ld[1] + 2.2]) + seg([X, ld[1] + 3.4], [ld[0] + 1.3, ld[1] + 2.2]), ropeL, rw(.15)) + q2.svg; }
    // the crew: dark figures in light shirts, larger; legs below the rail are hidden
    const man = sil ? C : col(mix(L.tone('tar', -.4, cen[0], cen[1]), '#140e0b', .55)), shirt = tone('linen', If + .05);
    const figure = (X, H0, lean, arms) => { const k = 1.5, c = Math.cos(rad(lean)) * k, sn = Math.sin(rad(lean)) * k, P = (dx, dh) => [X + dx * c - dh * sn, H0 + dx * sn + dh * c];
      const body = poly([P(-.5, 0), P(-.36, 2.1), P(-.44, 3.3), P(.44, 3.3), P(.36, 2.1), P(.5, 0), P(.16, 0), P(0, 1.2), P(-.16, 0)]), torso = poly([P(-.4, 2.05), P(-.47, 3.3), P(.47, 3.3), P(.4, 2.05)]);
      const head = P(0, 3.82), sh = P(0, 3.15);
      return fillP(body, man) + fillP(torso, shirt) + edge(torso, 'linen', .5) + dot(head[0], head[1], .44 * k) + ` fill="${man}"/>` + fillP(poly([P(-.5, 4.08), P(.5, 4.08), P(.32, 4.36), P(-.32, 4.36)]), man)
        + strokeP(arms.map(hd => seg(sh, hd)).join(''), shirt, .5 * s, ' stroke-linecap="round"') + strokeP(arms.map(hd => seg(hd, hd)).join(''), man, .55 * s, ' stroke-linecap="round"'); };
    for (const [pose, X] of lf.crew || []) {
      if (pose === 'helm') { const H0 = deck(X) + .3; lifeBack += figure(X, H0, 0, [[X - 1.9, H0 + 3.2], [X - 1.6, H0 + 2.9]]) + spar([X - 2.2, H0 + 1.4], [X - 1.8, H0 + 3.4], .16, .13, 'oak', { grain: false }); }
      else if (pose === 'climb' && shr[X]) { const g = shr[X], t = .36, h = lerp(g.hCh, g.tp[1], t), i0 = Math.floor((g.ns - 1) / 2), x = g.sx(i0, h) + .3;
        lifeFront += figure(x, h - 2.3, -4, [[g.sx(i0, h + 3) - .4, h + 3.1], [g.sx(i0 + 1, h + 3) + .1, h + 3.1]]); } }
    // a lantern hung on the fore shrouds low over the rail; at night it warms the pile, the rail, the foot of the sail, the water
    if (lf.shroudLamp != null && shr[lf.shroudLamp]) { const g = shr[lf.shroudLamp], h = g.hCh + 5, i0 = Math.floor(g.ns / 2), X = g.sx(i0, h), z = .8, q2 = (a2, b2) => [X + a2 * z, h - 1 + b2 * z];
      const bodyL = poly([q2(-.55, -2.4), q2(.55, -2.4), q2(.8, -.6), q2(-.8, -.6)]), capL = poly([q2(-.85, -.6), q2(.85, -.6), q2(0, .5)]);
      lifeFront += strokeP(seg([X, h], q2(0, .5)), ropeD, rw(.14)) + (sil ? fillP(bodyL + capL, C) : win(bodyL, ...q2(0, -1.5), 1.6 * z, true) + strokeP(bodyL + seg(q2(0, -2.4), q2(0, -.6)), tone('brass', If + .1), .14 * s) + fillP(capL, tone('brass', If + .2)) + fillP(poly([q2(-.6, -2.4), q2(.6, -2.4), q2(.5, -2.75), q2(-.5, -2.75)]), tone('brass', If - .1)));
      if (lit) glowAt.push([X, h - 1 - 1.5 * z, 14], [X + 6, h + 3, 16], [X + 3, rail(X) - 1, 12]); }
    // at night the stern windows throw their light on the poop, the mizzen and the water under the counter
    if (lit) glowAt.push([xAft - 6, hTop + 1, 14], [xAft - 2, 1, 16]);
  }

  // far away only the big lines of the rig stay: the back rigging goes pale
  const body = rigBack + bowBack + sails + spars + lifeBack + `<g clip-path="url(#${wlClip})">` + hull + (sil ? '' : rim(hullD, clipOf(hullD), [0, sp.free], sp.len * .6, 1.1)) + (ow ? strokeP(hullD, ink(hullK), ow, ' stroke-linejoin="round"') : '') + stern + bow + '</g>' + growA + rigFront + lifeFront + growB + flags;
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
  // a closed smooth curve in scene units, and a torn patch of foam round (cx, cy)
  const cspl = pts => { const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d + 'Z'; };
  const blob = (cx, cy, rx, ry) => { const m = 7 + Math.floor(Rr() * 3), p = [], a0 = Rr() * 6, q1 = Rr() * 6; for (let k = 0; k < m; k++) { const a = a0 + (k + (Rr() - .5) * .4) / m * 2 * Math.PI, r = .78 + .22 * Math.sin(2 * a + q1) + (Rr() - .5) * .3; p.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); } return cspl(p); };
  let out = '';
  if (o.reflect) { const r = build(u, L, o, 'refl'); out += E.reflection(u, r.svg, { y: y0, h: Math.min(Math.max(...sp.masts.map(m => m.H)) * s * .55, 90), L, opacity: far ? .4 : .62, stretch: 1.05, seed: seed % 97 + 3 }); }
  const stern = x0 + dir * s * hb, stem = x0 - dir * s * hb;
  // the dark of the water right under the hull: the waterline reads even where the hull is as dark as the sea
  if (!far && (o.wake || o.reflect)) { const id = nid('hd', u); out += `<defs><radialGradient id="${id}" cx=".5" cy="0" r=".5"><stop offset="0" stop-color="${L.shadowTint}" stop-opacity=".5"/><stop offset=".6" stop-color="${L.shadowTint}" stop-opacity=".22"/><stop offset="1" stop-color="${L.shadowTint}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${f(x0)}" cy="${f(y0)}" rx="${f(sp.len * s * .56)}" ry="${f(2.6 * s)}" fill="url(#${id})"/>`; }
  if (o.wake) { // the wake astern: a band of churned water, narrow under the counter, wider and fainter astern, soft at the edges; torn foam on it
    const len = sp.len * s * .8, x1 = stern - dir * 7 * s, x2 = stern + dir * len, id = nid('hk', u), fid = nid('hf', u), n = 20, top = [], bot = [], wA = t => (1 + 3.4 * Math.pow(t, .8)) * s;
    for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x1, x2, t), wob = Math.sin(t * 9 + seed) * .3 * s * t; top.push([x, y0 - .1 * s + t * .25 * s]); bot.unshift([x, y0 + wA(t) + wob]); }
    const pts = top.concat(bot), xa = Math.min(x1, x2) - 4 * s, ya = y0 - 3 * s;
    out += `<defs>${linGrad(id, x1, 0, x2, 0, [[0, fc, 0], [.1, fc, .38], [.28, fc, .24], [.6, fc, .09], [1, fc, 0]])}<filter id="${fid}" filterUnits="userSpaceOnUse" x="${f(xa)}" y="${f(ya)}" width="${f(len + 16 * s)}" height="${f(12 * s)}"><feGaussianBlur stdDeviation="${f(clamp(.75 * s, .3, 2.5))}"/></filter></defs>`
      + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${id})" filter="url(#${fid})"/>`;
    let fo = '', st = '';
    for (let i = 0, nf = far ? 9 : 34; i < nf; i++) { const t = Math.pow(Rr(), 1.3), x = lerp(stern - dir * 1.5 * s, x2, t * .9), w = wA(t), edge = Rr() < .5, y = y0 + w * (edge ? .72 + Rr() * .26 : .12 + Rr() * .5), rx = (.7 + Rr() * 2.4) * s * (1 - t * .55), ry = rx * (.2 + Rr() * .18);
      fo += `<path d="${blob(x, y, rx, ry)}" opacity="${f((.5 + Rr() * .45) * (1 - t * .85))}"/>`; }
    for (let i = 0; i < (far ? 4 : 12); i++) { const t = Rr(), x = stern + dir * (t * len * .85), l = (2 + Rr() * 6) * s * (1 - t * .5), y = y0 + (.3 + Rr() * .8) * wA(t), bend = (Rr() - .5) * .8 * s;
      st += `<path d="M${f(x)} ${f(y)}q${f(dir * l / 2)} ${f(bend)} ${f(dir * l)} ${f(bend * .4)}" stroke-width="${f(clamp((.15 + Rr() * .3) * s, .1, .6))}" opacity="${f((.3 + Rr() * .45) * (1 - t * .8))}"/>`; }
    out += `<g fill="${fc}">${fo}</g><g fill="none" stroke="${fc}" stroke-linecap="round">${st}</g>`;
  }
  out += b.svg;
  if (o.wake) { // the bow wave climbing the stem and running aft along the side, foam along the waterline
    const sh = mix(fc, L.shadowTint, .4), n = far ? 10 : 34; let froth = '', shade = '';
    for (let i = 0; i < n; i++) { const t = Math.pow(Rr(), 1.5), x = stem + dir * (-2.6 + t * 24) * s, up = 2.1 * s * Math.pow(Math.sin(Math.PI * Math.min(1, t * 2.4 + .1)), 1.4) * (1 - t * .6), y = y0 - Rr() * up + .2 * s, r = (.5 + Rr() * 1.1) * s * (1 - t * .5);
      froth += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * (1 + Rr() * .8))}" ry="${f(r * .55)}" transform="rotate(${f(-dir * (25 - t * 30) * Rr())} ${f(x)} ${f(y)})"/>`;
      if (i % 3 === 0) shade += `<ellipse cx="${f(x + dir * .4 * s)}" cy="${f(y + r * .5)}" rx="${f(r * 1.3)}" ry="${f(r * .4)}"/>`; }
    out += `<g fill="${sh}" opacity=".45">${shade}</g><g fill="${fc}" opacity=".95">${froth}</g>`;
    if (!far) for (let i = 0; i < 12; i++) out += `<circle cx="${f(stem + dir * (-4.5 + Rr() * 8) * s)}" cy="${f(y0 - Rr() * 3.6 * s)}" r="${f((.12 + Rr() * .24) * s)}" fill="${fc}" opacity="${f(.4 + Rr() * .5)}"/>`;
    // the lace along the side: a torn band, thick in the bow wave and thin aft, seldom broken, holes and flecks in it
    const p1 = Rr() * 6, p2 = Rr() * 6, p3 = Rr() * 6, nz = t => .45 * Math.sin(t * 11 + p1) + .3 * Math.sin(t * 29 + p2) + .35 * Math.sin(t * 5 + p3), step = .6 * s, xs0 = stem + dir * 2.5 * s, xs1 = stern - dir * .3 * s, cnt = Math.max(10, Math.round(Math.abs(xs1 - xs0) / step));
    let lace = '', flecks = '', holes = '', seg2 = null;
    const close = () => { if (seg2 && seg2.a.length > 2) lace += cspl(seg2.a.concat(seg2.b.reverse())); seg2 = null; };
    for (let i = 0; i <= cnt; i++) { const t = i / cnt, x = lerp(xs0, xs1, t), v = nz(t * 3);
      if (v < -.78 && t > .15) { close(); continue; }
      const th = s * (.2 + 1.05 * Math.pow(1 - t, 3)) * (.45 + .4 * (v + 1.1)) * (far ? .8 : 1);
      if (!seg2) seg2 = { a: [], b: [] };
      seg2.a.push([x, y0 - th * (.2 + Rr() * .35)]); seg2.b.push([x + dir * (Rr() - .5) * .4 * s, y0 + th * (.4 + Rr() * .55)]);
      if (!far && th > .45 * s && Rr() > .8) holes += `<path d="${blob(x, y0 + th * .25, (.2 + Rr() * .35) * th, (.12 + Rr() * .12) * th)}"/>`;
      if (!far && Rr() > .75) flecks += `<path d="${blob(x + dir * (Rr() - .5) * s, y0 + th + (.35 + Rr() * 1.2) * s, (.25 + Rr() * .75) * s, (.1 + Rr() * .14) * s)}" opacity="${f(.3 + Rr() * .45)}"/>`; }
    close();
    out += `<g fill="${sh}" opacity=".3" transform="translate(0 ${f(.35 * s)})"><path d="${lace}"/></g><g fill="${fc}" opacity=".92"><path d="${lace}"/>${flecks}</g>` + (holes ? `<g fill="${mix(L.pal.sea[1], fc, .25)}" opacity=".55">${holes}</g>` : '');
  } else if (!far) out += `<path d="M${f(stem - 2 * s)} ${f(y0 + .2 * s)}L${f(stern + 2 * s)} ${f(y0 + .2 * s)}" stroke="${fc}" stroke-width="${f(.35 * s)}" opacity=".45"/>`;
  if (o.lights && !far && L.time !== 'day') { // the windows and the lantern light the air round them and the water under the stern (not by day)
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
