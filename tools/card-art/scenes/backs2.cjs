// tools/card-art/scenes/backs2.cjs — card backs, design 2 «Гравюра» (docs/tasks/print-kit.md 4.10, review-art 19):
// the deck's ship as an old engraving on a sea chart — hatching in the deck's colour on parchment (little ink),
// a compass rose with rhumb lines, a ribbon cartouche under the ship's name. Колода моря — a large rose and
// engraved waves, no deck ship.
// Contract — the same as design 1 (backs.cjs): draw(kind) -> { svg, ground, tone, title, crest, letter, name };
//   svg — a full <svg viewBox="0 0 200 280">; ground — the flat parchment of the edge; tone 'light' (dark lettering);
//   title { y }, crest { y, d } (the generator's medallion with the letter sits in the centre of the rose),
//   letter null, name { y } (inside the ribbon). The picture holds no letters.
// Print rules: nearer than 9 mm (SAFE = 28.6 units) to the edge — only the flat ground; the hatching and rhumb lines
// end inside and dissolve into the ground (no frame, no line along the edge). Every line >= .4 units, hatch step
// >= 1.6 units (.5 mm); the step and length of the hatching follow the form (planks along the sheer of the hull,
// sails across their belly with a light spot, cross-hatching only in the shade) — not a fence of equal lines.
// The ship's hatching is built on its geometry: the hull lines follow kit SHIP_SPECS (sheer, bands, wales), every
// sail is hatched inside its own outline from kit shipSilhouette (the one-tone ship split into its parts).
'use strict';
const K = require('./kit/index.cjs');

const W = 200, H = 280, SAFE = 28.6;
const INK = { pearl: '#26262a', revenge: '#8e2420', endeavour: '#24497a', dutch: '#2f6b4a', sea: '#16404e' };
const PAPER = '#f2e9d5';
// the edge of each deck: parchment tinted towards the deck's colour (the backs differ by paper and line colour)
const GROUND = { pearl: '#ebe1ca', revenge: '#f3d2c0', endeavour: '#d4dfee', dutch: '#d9e6c4', sea: '#c8e6dc' };
const KINDS = Object.keys(GROUND);
const f = v => String(+(+v).toFixed(2));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
let seq = 0;
const bid = (p, u) => `bg${p}${u}n${seq++}`;
const pl = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L');

/** The picture dissolves into the ground towards the edges (the same construction as backs.cjs edgeFade, a
 *  narrower soft band: the lines end by themselves inside, the band only takes the paper texture and the rhumbs). */
function edgeFade(u, ground) {
  const ins = 3, sd = 2.6, R = 18, hard = 7;
  const m = bid('m', u), bl = bid('b', u), x0 = SAFE + ins, x1 = W - SAFE - ins, y0 = SAFE + ins, y1 = H - SAFE - ins;
  const ss = [0, .2, .4, .6, .8, 1].map(t => `<stop offset="${t}" stop-color="#fff" stop-opacity="${f(1 - (3 * t * t - 2 * t * t * t))}"/>`).join('');
  const g = ['t', 'r', 'b', 'l'].map(k => bid('g' + k, u));
  const strips = `<linearGradient id="${g[0]}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(SAFE)}" x2="0" y2="${f(SAFE + hard)}">${ss}</linearGradient>`
    + `<linearGradient id="${g[1]}" gradientUnits="userSpaceOnUse" x1="${f(W - SAFE)}" y1="0" x2="${f(W - SAFE - hard)}" y2="0">${ss}</linearGradient>`
    + `<linearGradient id="${g[2]}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(H - SAFE)}" x2="0" y2="${f(H - SAFE - hard)}">${ss}</linearGradient>`
    + `<linearGradient id="${g[3]}" gradientUnits="userSpaceOnUse" x1="${f(SAFE)}" y1="0" x2="${f(SAFE + hard)}" y2="0">${ss}</linearGradient>`;
  const E = 30, big = `M${-E} ${-E}H${W + E}V${H + E}H${-E}Z`;
  const win = `M${f(x0 + R)} ${f(y0)}H${f(x1 - R)}Q${f(x1)} ${f(y0)} ${f(x1)} ${f(y0 + R)}V${f(y1 - R)}Q${f(x1)} ${f(y1)} ${f(x1 - R)} ${f(y1)}H${f(x0 + R)}Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - R)}V${f(y0 + R)}Q${f(x0)} ${f(y0)} ${f(x0 + R)} ${f(y0)}Z`;
  const defs = strips + `<filter id="${bl}" filterUnits="userSpaceOnUse" x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}"><feGaussianBlur stdDeviation="${f(sd)}"/></filter>`
    + `<mask id="${m}" maskUnits="userSpaceOnUse" x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}"><rect x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}" fill="#000"/>`
    + `<path d="${big}${win}" fill="#fff" fill-rule="evenodd" filter="url(#${bl})"/>`
    + `<rect x="${-E}" y="${-E}" width="${W + 2 * E}" height="${f(E + SAFE + hard)}" fill="url(#${g[0]})"/><rect x="${f(W - SAFE - hard)}" y="${-E}" width="${f(E + SAFE + hard)}" height="${H + 2 * E}" fill="url(#${g[1]})"/>`
    + `<rect x="${-E}" y="${f(H - SAFE - hard)}" width="${W + 2 * E}" height="${f(E + SAFE + hard)}" fill="url(#${g[2]})"/><rect x="${-E}" y="${-E}" width="${f(E + SAFE + hard)}" height="${H + 2 * E}" fill="url(#${g[3]})"/></mask>`;
  return `<defs>${defs}</defs><rect x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}" fill="${ground}" mask="url(#${m})"/>`;
}

/** Parchment: lighter in the middle, the flat ground well inside the 9 mm line (no visible panel). */
function parchment(u, ground, ink, seed) {
  const g = bid('pg', u), light = K.mix(ground, '#fffbf0', .55);
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="100" cy="140" r="66" gradientTransform="translate(100 140) scale(1 1.55) translate(-100 -140)"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${K.mix(light, ground, .35)}"/><stop offset="1" stop-color="${ground}"/></radialGradient>`
    + `</defs>`
    + `<rect width="${W}" height="${H}" fill="url(#${g})"/>`;
}

// ——— the ship as an engraving ———

const nums = d => (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
/** The area of a path's points taken as a polygon (enough to tell a sail from a spar). */
const areaOf = d => { const n = nums(d); let a = 0; for (let i = 0; i + 3 < n.length; i += 2) a += n[i] * n[i + 3] - n[i + 2] * n[i + 1]; if (n.length > 3) a += n[n.length - 2] * n[1] - n[0] * n[n.length - 1]; return Math.abs(a) / 2; };
const bboxOf = d => { const n = nums(d); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }; };
const attr = (t, a) => { const m = t.match(new RegExp(` ${a}="([^"]*)"`)); return m ? m[1] : null; };

/** Splits the one-tone ship of kit shipSilhouette into its parts in drawing order: 'top' (rigging behind, sails,
 *  spars), 'hull' (the hull with the stern and the head, cut at the waterline), 'after' (rigging in front, flags). */
function shipParts(sil) {
  const toks = sil.match(/<\/?[a-zA-Z][^>]*>/g), out = { top: [], hull: [], after: [] };
  let phase = 'top', depth = 0, hullDepth = -1, inDefs = false;
  for (const t of toks) {
    if (t.startsWith('<defs')) { inDefs = true; continue; } if (t === '</defs>') { inDefs = false; continue; } if (inDefs) continue;
    if (t.startsWith('<g')) { depth++; if (/clip-path=/.test(t)) { phase = 'hull'; hullDepth = depth; } continue; }
    if (t === '</g>') { if (depth === hullDepth) { phase = 'after'; hullDepth = -1; } depth--; continue; }
    if (t.startsWith('<path') || t.startsWith('<circle')) out[phase].push(t);
  }
  return out;
}

// how the ships are toned: sails (0 white linen … 1 black cloth), hull (dark of the planking)
const TONE = { pearl: { sail: .86, hull: .92 }, revenge: { sail: .56, hull: .78 }, endeavour: { sail: .3, hull: .72 }, dutch: { sail: .42, hull: .62 }, brig: { sail: .2, hull: .6 }, merchant: { sail: .2, hull: .5 } };

/** Hatching of one sail inside its box, light from the upper left: the shade of a point is the tone of the cloth
 *  plus its place across the sail (the aft side turns away from the light). Lines run down the sail, bowed by its
 *  belly towards the bow; in the light they stop (paper), in the half-light they break around the lit belly, in the
 *  shade they run full length, closer and heavier. A cross-hatch at ~35° along the sail's curve only in the deep
 *  shade (the aft third) and at the foot; for the dark cloth a third layer on the aft edge. Nothing shorter than a
 *  fifth of the sail is drawn, so the light side stays clean paper. */
function sailHatch(bb, T, bow, R) {
  const w = bb.w, h = bb.h, bulge = Math.min(w * .07, 2.4) * bow, sag = Math.min(h * .05, 1.4);
  const shadeU = uu => clamp(T * .55 + .62 * Math.pow(uu, 1.3));
  const A = {}, add = (k, d) => { A[k] = (A[k] || '') + d; };
  let b = '', c = '';
  const vline = (x, v0, v1, uu) => { const p = []; for (let i = 0; i <= 6; i++) { const v = lerp(v0, v1, i / 6); p.push([x + bulge * Math.sin(Math.PI * clamp(v)) * (1 - .5 * uu), bb.y0 + v * h]); } return pl(p); };
  for (let x = bb.x0 + R() * .8; x < bb.x1 + .6;) {
    const uu = clamp((x - bb.x0) / w), sh = clamp(shadeU(uu) + .05 * (R() - .5)), k = sh > .72 ? '.74' : sh > .48 ? '.6' : '.48';
    if (sh > .6) add(k, vline(x, -.05, 1.05, uu));
    else if (sh > .22) { const g = (.6 - sh) / .38, half = .12 + .3 * g, t1 = .46 - half + .04 * (R() - .5), b0 = .46 + half * .8 + .04 * (R() - .5);
      if (t1 > .28) add(k, vline(x, -.05, t1, uu));
      if (b0 < .76) add(k, vline(x, b0, 1.05, uu)); }
    x += lerp(4.4, 1.65, sh) * (.9 + R() * .2);
  }
  const tg = -.7 * bow, span = w * Math.abs(tg), uS = clamp(.62 - T * .25);
  for (let cc = bb.y0 - span - 1; cc < bb.y1 + 1;) {
    const us = uS + R() * .08, vf = .8 + R() * .06; let seg = [];
    const flush = () => { if (seg.length > 3) b += pl(seg); seg = []; };
    for (let x = bb.x0 - 1; x <= bb.x1 + 1.01; x += 1.2) {
      const uu = (x - bb.x0) / w, yy = (tg > 0 ? cc : cc + span) + (x - bb.x0) * tg + sag * Math.sin(Math.PI * clamp(uu)), v = (yy - bb.y0) / h;
      if (uu > us || v > vf && shadeU(clamp(uu)) > .3) seg.push([x, yy]); else flush();
    }
    flush();
    cc += lerp(3.2, 2.1, T) * (.85 + R() * .3);
  }
  if (T > .6) for (let x = bb.x0 + w * (.72 + R() * .06); x < bb.x1 + h * .5;) { c += pl([[x, bb.y0 - .5], [x + h * .5 * bow, bb.y1 + .5]]); x += 2.3 * (.85 + R() * .3); }
  return Object.keys(A).map(k => `<path d="${A[k]}" stroke-width="${k}"/>`).join('') + (b ? `<path d="${b}" stroke-width=".42"/>` : '') + (c ? `<path d="${c}" stroke-width=".42"/>` : '');
}

/**
 * engraveShip(u, kind, { x, y, scale, flip, ink, paper, seed }) — the ship as an engraving in one ink on paper.
 * Hull: lines along the planking (the sheer of SHIP_SPECS), lighter above the widest line, cross-hatched below it
 * and on the stern quarter, a second cross at the waterline; painted bands left as paper, tarred bands and wales
 * dark; the gun ports dark. Sails: sailHatch inside each sail's outline. Spars solid, rigging in thin lines.
 * KIT-CANDIDATE: an engraved ship for any print picture (a chart, a cartouche, a logbook).
 */
function engraveShip(u, kind, o) {
  const sp = K.SHIP_SPECS[kind], s = o.scale, dir = o.flip ? -1 : 1, x0 = o.x, y0 = o.y, ink = o.ink, paper = o.paper, R = K.rng(o.seed || 7), tn = TONE[kind] || TONE.brig;
  const sil = K.shipSilhouette(kind, { x: x0, y: y0, scale: s, flip: o.flip, color: '#000', u: u + 'S' });
  const parts = shipParts(sil);
  let defs = '', out = '';
  // the paper under the ship hides the rhumbs and the water behind it
  out += `<g fill="${paper}" stroke="${paper}" stroke-width=".6">` + parts.top.concat(parts.after).filter(t => attr(t, 'fill') !== 'none' && !attr(t, 'stroke')).map(t => t.replace(/ fill="[^"]*"/, '')).join('') + '</g>';
  const wl = bid('wl', u); defs += `<clipPath id="${wl}"><rect x="-50" y="-50" width="300" height="${f(y0 + 50)}"/></clipPath>`;
  out += `<g clip-path="url(#${wl})" fill="${paper}">` + parts.hull.filter(t => !attr(t, 'stroke')).map(t => t.replace(/ fill="[^"]*"/, '').replace(/ fill-rule="[^"]*"/, '')).join('') + '</g>';
  const bow = -dir;
  const emit = (list, flags) => list.map(t => {
    if (t.startsWith('<circle')) return t.replace(/ fill="[^"]*"/, '').replace('<circle', `<circle fill="${ink}"`);
    const d = attr(t, 'd'); if (!d) return '';
    if (attr(t, 'fill') === 'none' || attr(t, 'stroke')) { const sw = Math.max(.4, +(attr(t, 'stroke-width') || .3)); return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(Math.min(sw, .9))}" stroke-linecap="round" opacity=".85"/>`; }
    const bb = bboxOf(d), rule = attr(t, 'fill-rule') || 'nonzero';
    const ar = areaOf(d); if (!flags && Math.min(bb.w, bb.h) > 2 && ar > 7 && ar > bb.w * bb.h * .28) { // a sail (a spar is thin, a flag small)
      const id = bid('sc', u); defs += `<clipPath id="${id}"><path d="${d}" clip-rule="${rule}"/></clipPath>`;
      return `<path d="${d}" fill="${paper}" fill-rule="${rule}"/><g clip-path="url(#${id})" fill="none" stroke="${ink}" stroke-linecap="round">${sailHatch(bb, ar < 70 ? Math.min(.2, tn.sail * .3) : tn.sail, bow, R)}</g>`
        + `<path d="${d}" fill="none" fill-rule="${rule}" stroke="${ink}" stroke-width=".55" stroke-linejoin="round"/>`;
    }
    return `<path d="${d}" fill="${ink}" fill-rule="${rule}" stroke="${ink}" stroke-width=".4"/>`; // spars, tops, flags
  }).join('');
  out += emit(parts.top);

  // ——— the hull ———
  const hb = sp.len / 2, xStem = -hb - sp.bow[0], xAft = hb + sp.over;
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  const Y = (h, X) => h + sheer(X) * clamp(h / sp.free, 0, 1.25);
  const P = (X, Hh) => [x0 + dir * s * X, y0 - s * Hh];
  const topMax = sp.free + sp.fc[1] + sp.tiers.reduce((a, t) => a + t[1], 0) + sp.taff + Math.max(...sp.sheer) * 1.3 + 3;
  const bands = sp.bands || [], paint = bands.filter(b => b.mat !== 'tar').sort((a, b) => a.h0 - b.h0), tar = bands.filter(b => b.mat === 'tar');
  // between painted bands (the chequer of the three-decker) the side is black: dense like a tarred band
  for (let i = 0; i + 1 < paint.length; i++) tar.push({ h0: paint[i].h1 + .2, h1: paint[i + 1].h0 - .2 });
  const inBand = (h, list, m = 0) => list.some(b => h > b.h0 - m && h < b.h1 + m);
  const along = (h, Xa, Xb) => { const p = []; for (let X = Xa; X < Xb + 2.9; X += 3) p.push(P(Math.min(X, Xb), Y(h, Math.min(X, Xb)))); return pl(p); };
  // the light from the upper left: xn — 0 at the left end of the hull in the picture, 1 at the right (the shade)
  const ex0 = P(xStem - 6, 0)[0], ex1 = P(xAft + 4, 0)[0], xn = X => clamp((P(X, 0)[0] - Math.min(ex0, ex1)) / Math.abs(ex1 - ex0));
  const L1 = {}, put = (k, d) => { L1[k] = (L1[k] || '') + d; };
  let l2 = '', bold = '', mould = '', stern = '';
  for (let h = -1.2; h < topMax;) {
    const t = h / sp.free, lit = t > .48 && h < sp.free * 1.02 || h > sp.free * 1.08, low = h < 3;
    if (!inBand(h, paint, .3)) { // a line of the planking broken at a butt or two; heavier towards the shade
      let Xa = xStem - 16 - R() * 6; const Xe = xAft + 12;
      while (Xa < Xe) { const l = 22 + R() * 34, Xb = Math.min(Xe, Xa + l), q = xn((Xa + Xb) / 2), k = (lit ? .44 : .56) + (q > .66 ? .2 : q > .33 ? .1 : 0) + (low ? .1 : 0);
        put(f(k), along(h, Xa, Xb)); Xa = Xb + (lit ? 1.6 + R() * 3 : .8 + R()); }
    }
    h += (lit ? 2.2 : low ? 1.25 : 1.65) / s * (.85 + R() * .3);
  }
  for (const b of tar) for (let h = b.h0 + .3; h < b.h1; h += 1.7 / s * .6) bold += along(h, xStem - 10, xAft + 10);
  for (const b of paint) put('.46', along(b.h0 - .15, xStem - 10, xAft + 10) + along(b.h1 + .15, xStem - 10, xAft + 10));
  for (const h of sp.wales || []) bold += along(h, xStem - 10, xAft + 10);
  // the deck mouldings: the waist's rail, the forecastle, every tier of the stern — the steps of the upper works
  const tierBase = j => sp.free + sp.tiers.slice(0, j).reduce((a, t) => a + t[1], 0);
  mould += along(sp.free - .1, xStem, sp.fc[0] - 1) + along(sp.free - .1, sp.tiers[0][0] - 1, xAft + 2);
  sp.tiers.forEach((t, j) => { if (j) mould += along(tierBase(j) - .1, t[0] - 1, xAft + 2); });
  // cross-hatching: one diagonal layer, irregular in step and length, rising towards the shade side
  const lim = Math.min(tn.hull > .85 ? .9 : tn.hull > .7 ? .5 : .42, paint.length ? (paint[0].h0 - .4) / sp.free : 1);
  const hTopL = Y(tierBase(sp.tiers.length) + sp.taff, xAft), xC = hb + sp.over * .3, hC = Y(sp.free * sp.counter, hb), qX = xC - sp.len * .17;
  for (let X = xStem - 14 - topMax * .8; X < qX + sp.len * .08;) {
    const q = xn(X), he = sp.free * Math.min(1, lim + (paint.length ? 0 : .5 * q * q)) * (.75 + R() * .5), h0 = -2 + R() * 1.5, Xe = X + .8 * (he - h0);
    l2 += pl([P(X, h0), P(Xe, Y(he, Xe))]);
    X += 2 / s * (.75 + R() * .6);
  }
  // the stern quarter turns away: short lines between the planks, ending at staggered places forward (a tone that
  // fades along the hull, not a box), and two or three lines along the raked edge of the transom
  { const reach = sp.len * .3, hi = tierBase(sp.tiers.length) + sp.taff;
    for (let h = -.6; h < hi; h += .95 / s * (.85 + R() * .3)) {
      const Xb = xAft + 6, Xa = Xb - reach * (.25 + Math.pow(R(), 1.4) * .75);
      stern += along(h, Xa, Xb);
    }
    const ux = xAft - xC, uy = hTopL - hC, ul = Math.hypot(ux, uy), dx = ux / ul, dy = uy / ul;
    for (const off of [.6, 1.6, 2.9]) { const t = (hTopL - hC) / dy; stern += pl([P(xC - off - dx * 30, hC - dy * 30), P(xC - off + dx * t, hTopL)]); } }
  const hm = bid('hm', u), E = 40;
  defs += `<mask id="${hm}" maskUnits="userSpaceOnUse" x="${-E}" y="${-E}" width="${W + 2 * E}" height="${H + 2 * E}"><g clip-path="url(#${wl})" fill="#fff">` + parts.hull.filter(t => !attr(t, 'stroke')).map(t => t.replace(/ fill="[^"]*"/, '').replace(/ fill-rule="[^"]*"/, '')).join('') + '</g></mask>';
  out += `<g mask="url(#${hm})" fill="none" stroke="${ink}" stroke-linecap="butt">${Object.keys(L1).map(k => `<path d="${L1[k]}" stroke-width="${k}"/>`).join('')}<path d="${l2}" stroke-width=".44"/><path d="${stern}" stroke-width=".46"/><path d="${bold}" stroke-width=".95"/><path d="${mould}" stroke-width=".8"/></g>`;
  // outlines of the hull and its parts, the gun ports dark, the weed and shells of the Dutchman as dots
  let hullOut = '';
  parts.hull.forEach((t, i) => {
    if (t.startsWith('<circle')) { hullOut += t.replace(/ fill="[^"]*"/, '').replace('<circle', `<circle fill="${ink}"`); return; }
    const d = attr(t, 'd'); if (!d) return;
    if (i === 0) { const sub = d.match(/M[^M]*/g) || [d]; hullOut += `<path d="${sub[0]}" fill="none" stroke="${ink}" stroke-width=".7" stroke-linejoin="round"/>`; if (sub.length > 1) hullOut += `<path d="${sub.slice(1).join('')}" fill="${ink}"/>`; return; }
    if (attr(t, 'fill') === 'none' || attr(t, 'stroke')) { hullOut += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(Math.max(.4, +(attr(t, 'stroke-width') || .3)))}"/>`; return; }
    const bb = bboxOf(d); hullOut += bb.w * bb.h < 6 ? `<path d="${d}" fill="${ink}"/>` : `<path d="${d}" fill="none" stroke="${ink}" stroke-width=".45" stroke-linejoin="round"/>`;
  });
  out += `<g clip-path="url(#${wl})">${hullOut}</g>`;
  out += emit(parts.after, true);   // in front: the flags, solid
  return `<defs>${defs}</defs><g>${out}</g>`;
}

// ——— the chart: water, rose, rhumbs, ribbon ———

/** Engraved water: rows of broken wavy lines under the ship, closer near the hull, sparser and shorter down. */
function waterLines(u, ink, o) {
  const R = K.rng(o.seed), y0 = o.y, rows = o.rows || 11;
  let thin = '', dark = '';
  let y = y0 + .9;
  for (let j = 0; j < rows; j++) {
    const k = j / (rows - 1), half = lerp(o.w0, o.w1, k) * (.9 + R() * .2), cx = 100 + (R() - .5) * 8;
    let x = cx - half + R() * 6; const xe = cx + half - R() * 6;
    while (x < xe) {
      const l = 5 + R() * 20 * (1 - k * .5), xb = Math.min(xe, x + l), p = [], ph = R() * 6, amp = .25 + R() * .3;
      for (let xx = x; xx < xb + .01; xx += 1.5) p.push([Math.min(xx, xb), y + amp * Math.sin(xx * .55 + ph)]);
      const under = o.hull && xb > o.hull[0] && x < o.hull[1] && j < 5;
      (under ? (dark += pl(p)) : (thin += pl(p)));
      x = xb + 1.6 + R() * (4 + 8 * k);
    }
    y += lerp(1.7, 2.9, k) * (.9 + R() * .2);
  }
  // the shadow of the hull on the water: short strokes between the rows under it
  if (o.hull) for (let j = 0; j < 6; j++) { const yy = y0 + 1.8 + j * 1.9, a = lerp(o.hull[0], (o.hull[0] + o.hull[1]) / 2, j / 9), b = lerp(o.hull[1], (o.hull[0] + o.hull[1]) / 2, j / 9);
    for (let x = a + R() * 3; x < b;) { const l = 3 + R() * 8; dark += pl([[x, yy], [Math.min(b, x + l), yy + (R() - .5) * .3]]); x += l + 1.5 + R() * 3 + j; } }
  return `<g fill="none" stroke="${ink}" stroke-linecap="round"><path d="${thin}" stroke-width=".45"/><path d="${dark}" stroke-width=".62"/></g>`;
}

/** Rhumb lines: the winds of the rose drawn across the chart, starting beyond its points; calm holes (the title,
 *  the ribbon) are cut out by a soft mask. */
function rhumbs(u, ink, cx, cy, r0, holes) {
  const m = bid('rm', u), bl = bid('rb', u);
  let a = '', b = '';
  for (let i = 0; i < 32; i++) { const t = i / 32 * 2 * Math.PI, dx = Math.sin(t), dy = -Math.cos(t), p = [[cx + dx * r0, cy + dy * r0], [cx + dx * 320, cy + dy * 320]];
    (i % 4 === 0 ? (a += pl(p)) : (b += pl(p))); }
  const mask = `<filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter><mask id="${m}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="320"><rect x="-20" y="-20" width="240" height="320" fill="#fff"/><g fill="#000" filter="url(#${bl})">${holes.map(e => `<ellipse cx="${e[0]}" cy="${e[1]}" rx="${e[2]}" ry="${e[3]}"/>`).join('')}</g></mask>`;
  return `<defs>${mask}</defs><g mask="url(#${m})" fill="none" stroke="${ink}"><path d="${a}" stroke-width=".5" opacity=".5"/><path d="${b}" stroke-width=".4" opacity=".32"/></g>`;
}

/** A compass rose: 32 points in three lengths, each split along its axis into a hatched and a light half; a ring
 *  with a scale of alternate dark divisions; the centre is left for the generator's medallion. */
function rose(u, ink, paper, cx, cy, o) {
  const R = o.r, ring = o.ring, R2 = R * .76, R3 = R * .66, hw = o.hw || .24;
  let under = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(ring + 2.4)}" fill="${paper}"/>`, out = '';
  const pt = (a, r) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
  const point = (a, len, base, big) => {
    const k = len > R * .9 ? 1 : 1.25, tip = pt(a, len), l = pt(a - hw * k, base), rr = pt(a + hw * k, base), c = [cx, cy];
    under += `<path d="${pl([c, l, tip, rr])}Z" fill="${paper}"/>`;
    // the dark half solid (the 8 winds) or two lines along it (the 16 winds); the light half is paper
    let hz = '';
    if (!big) for (const q of [.35, .7]) hz += pl([[lerp(c[0], l[0], q), lerp(c[1], l[1], q)], [lerp(tip[0], l[0], q * .55), lerp(tip[1], l[1], q * .55)]]);
    out += (big ? `<path d="${pl([c, l, tip])}Z" fill="${ink}"/>` : `<path d="${hz}" fill="none" stroke="${ink}" stroke-width=".4"/>`)
      + `<path d="${pl([c, l, tip, rr])}Z${pl([c, tip])}" fill="none" stroke="${ink}" stroke-width="${big ? .55 : .45}" stroke-linejoin="miter" stroke-miterlimit="8"/>`;
  };
  const pts = [];
  for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * Math.PI; if (i % 4 === 2) pts.push([a, R3 * (o.s16 || 1), ring * .5, false]); }
  for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * Math.PI; if (i % 8 === 4) pts.push([a, R2, ring * .62, true]); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * 2 * Math.PI; pts.push([a, R * (i === 0 ? (o.north || 1.08) : i === 2 ? (o.south || 1) : 1), ring * .7, true]); }
  // the ring with its scale under the points
  let ringD = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(ring - 1.4)}" fill="none" stroke="${ink}" stroke-width="2.8"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(ring + .9)}" fill="none" stroke="${ink}" stroke-width=".45"/>`;
  let blk = '';
  for (let i = 0; i < 64; i += 2) { const a0 = i / 64 * 2 * Math.PI, a1 = (i + 1) / 64 * 2 * Math.PI, p0 = pt(a0, ring - 1.4), p1 = pt(a1, ring - 1.4); blk += `M${f(p0[0])} ${f(p0[1])}A${f(ring - 1.4)} ${f(ring - 1.4)} 0 0 1 ${f(p1[0])} ${f(p1[1])}`; }
  ringD += `<path d="${blk}" fill="none" stroke="${paper}" stroke-width="1"/>`;
  pts.forEach(p => point(...p));
  return under + ringD + out;
}

/** A ribbon cartouche: a gently arched face with a double edge and two tails folded behind it (hatched in shade).
 *  Its face is left light for the ship's name. */
function ribbon(u, ink, paper, cy, x0, x1, hh) {
  const arch = 1.6, n = 16, yT = t => cy - hh / 2 - arch * Math.sin(Math.PI * t) + arch * .5, yB = t => cy + hh / 2 - arch * Math.sin(Math.PI * t) + arch * .5;
  const top = [], bot = []; for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t); top.push([x, yT(t)]); bot.push([x, yB(t)]); }
  const face = pl(top.concat(bot.slice().reverse())) + 'Z';
  const in1 = [], in2 = []; for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0 + 2, x1 - 2, t); in1.push([x, yT(t) + 1.5]); in2.push([x, yB(t) - 1.5]); }
  let tails = '', fold = '', hz = '';
  for (const side of [-1, 1]) {
    const ex = side < 0 ? x0 : x1, t0 = side < 0 ? 0 : 1, yt = yT(t0), yb = yB(t0), drop = hh * .45, out = 1.2, back = 10;
    const tail = [[ex - side * back, yt + drop], [ex + side * out, yt + drop - .6], [ex - side * 2.2, (yt + yb) / 2 + drop + 1.2], [ex + side * out, yb + drop + .6], [ex - side * back, yb + drop]];
    tails += pl(tail) + 'Z';
    const fl = [[ex, yb], [ex - side * back, yb + drop], [ex - side * back, yt + drop], [ex, yt]];
    fold += pl(fl) + 'Z';
    for (let k = 1; k < 5; k++) { const xx = ex - side * (back * k / 5); hz += pl([[xx, yb + .2], [xx - side * 1.2, yb + drop - .3]]); }
  }
  const lightP = K.mix(paper, '#fffdf7', .5);
  return `<path d="${tails}" fill="${K.mix(paper, ink, .22)}" stroke="${ink}" stroke-width=".55" stroke-linejoin="round"/><path d="${hz}" fill="none" stroke="${ink}" stroke-width=".42"/>`
    + `<path d="${fold}" fill="${K.mix(paper, ink, .55)}" stroke="${ink}" stroke-width=".5" stroke-linejoin="round"/>`
    + `<path d="${face}" fill="${lightP}" stroke="${ink}" stroke-width=".65" stroke-linejoin="round"/><path d="${pl(in1)}${pl(in2)}" fill="none" stroke="${ink}" stroke-width=".4" opacity=".7"/>`;
}

const wrap = body => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// ——— the layout ———
// Decks: the title on calm paper at the top, the ship in the middle (waterline y 158), engraved water under it,
// the rose below with the medallion in its centre, the ribbon with the name at the bottom.
const PLACES = { title: { y: 44 }, crest: { y: 203, d: 28 }, letter: null, name: { y: 236 } };
const SEA_PLACES = { title: { y: 44 }, crest: { y: 128, d: 30 }, letter: null, name: { y: 236 } };
const WL = 158;
const SHIPS = {
  pearl: { maxW: 128, maxH: 98, x: 101, flip: false, seed: 11 },
  revenge: { maxW: 124, maxH: 99, x: 99, flip: true, seed: 12 },
  endeavour: { maxW: 132, maxH: 100, x: 104, flip: false, seed: 13 },
  dutch: { maxW: 126, maxH: 98, x: 100, flip: false, seed: 14 },   // bow left: the high stern on the other side than the Revenge's
};

function deckBack(kind) {
  const u = 'g2' + kind.slice(0, 2), ink = INK[kind], g = GROUND[kind], paper = K.mix(g, '#fffbf0', .5), o = SHIPS[kind], P = PLACES;
  const b0 = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), sc = Math.min(o.maxW / b0.w, o.maxH / b0.h), bx = K.shipBox(kind, { x: o.x, y: WL, scale: sc, flip: o.flip });
  const sp = K.SHIP_SPECS[kind], hx0 = o.x - sp.len / 2 * sc, hx1 = o.x + sp.len / 2 * sc;
  let s = parchment(u, g, ink, 3 + KINDS.indexOf(kind));
  s += rhumbs(u, ink, 100, P.crest.y, 46, [[100, P.title.y, 84, 12], [100, P.name.y, 80, 13]]);
  s += waterLines(u, ink, { y: WL, rows: 10, w0: 62, w1: 26, seed: 21 + KINDS.indexOf(kind), hull: [Math.min(hx0, hx1), Math.max(hx0, hx1)] });
  s += rose(u, ink, paper, 100, P.crest.y, { r: 33, ring: 21, north: .98, south: .9 });
  s += engraveShip(u, kind, { x: o.x, y: WL, scale: sc, flip: o.flip, ink, paper, seed: o.seed });
  s += edgeFade(u, g);
  s += ribbon(u, ink, paper, P.name.y, 33, 167, 13);   // over the fade: its ends stay crisp, 4 units inside the 9 mm line
  return Object.assign({ svg: wrap(s), ground: g, tone: 'light', box: bx }, JSON.parse(JSON.stringify(P)));
}

/** Old-chart waves for Колода моря: rows of crests (a curl and a hatched back), offset row to row. */
function chartWaves(u, ink, paper, y0, rows, seed) {
  const R = K.rng(seed);
  let out = '';
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * 10, half = 52 - j * 10, step = 17 + R() * 3;
    for (let x = 100 - half + (j % 2) * step / 2 + R() * 3; x < 100 + half - 6; x += step * (.9 + R() * .2)) {
      const w = 11 + R() * 3, h = 3.4 + R() * 1.2, crest = `M${f(x)} ${f(y)}C${f(x + w * .3)} ${f(y - h * .2)} ${f(x + w * .45)} ${f(y - h)} ${f(x + w * .72)} ${f(y - h)}C${f(x + w * .9)} ${f(y - h)} ${f(x + w * .95)} ${f(y - h * .45)} ${f(x + w * .82)} ${f(y - h * .35)}`;
      const hz = `M${f(x + w * .55)} ${f(y - h * .55)}C${f(x + w * .62)} ${f(y - h * .2)} ${f(x + w * .78)} ${f(y - h * .05)} ${f(x + w * .95)} ${f(y)}`;
      out += `<path d="M${f(x)} ${f(y)}C${f(x + w * .3)} ${f(y - h * .2)} ${f(x + w * .45)} ${f(y - h)} ${f(x + w * .72)} ${f(y - h)}C${f(x + w * .95)} ${f(y - h)} ${f(x + w * 1.05)} ${f(y - h * .3)} ${f(x + w * 1.25)} ${f(y)}Z" fill="${paper}"/>`
        + `<path d="${crest}" fill="none" stroke="${ink}" stroke-width=".6" stroke-linecap="round"/><path d="M${f(x + w * .72)} ${f(y - h)}C${f(x + w * .95)} ${f(y - h)} ${f(x + w * 1.05)} ${f(y - h * .3)} ${f(x + w * 1.25)} ${f(y)}" fill="none" stroke="${ink}" stroke-width=".45"/>`
        + `<path d="${hz}" fill="none" stroke="${ink}" stroke-width=".42"/>`;
    }
  }
  return out;
}

function seaBack() {
  const kind = 'sea', u = 'g2se', ink = INK.sea, g = GROUND.sea, paper = K.mix(g, '#fffbf0', .5), P = SEA_PLACES;
  let s = parchment(u, g, ink, 9);
  s += rhumbs(u, ink, 100, P.crest.y, 70, [[100, P.title.y, 84, 12], [100, P.name.y, 80, 13]]);
  s += waterLines(u, ink, { y: 196, rows: 9, w0: 66, w1: 34, seed: 31 });
  s += rose(u, ink, paper, 100, P.crest.y, { r: 56, ring: 22, s16: 1.05 });
  // neutral ships on the chart (not a deck's ship): a fluyt nearer on the right, a brig far on the left
  s += engraveShip(u + 'm', 'merchant', { x: 141, y: 196, scale: .36, flip: true, ink, paper, seed: 3 });
  s += engraveShip(u + 'b', 'brig', { x: 62, y: 195, scale: .24, ink, paper, seed: 4 });
  s += chartWaves(u, ink, paper, 214, 2, 5);
  s += edgeFade(u, g);
  s += ribbon(u, ink, paper, P.name.y, 46, 154, 13);
  return Object.assign({ svg: wrap(s), ground: g, tone: 'light' }, JSON.parse(JSON.stringify(P)));
}

function draw(kind) {
  if (!GROUND[kind]) throw new Error(`backs2: unknown kind ${kind}`);
  const b = kind === 'sea' ? seaBack() : deckBack(kind);
  delete b.box;
  return b;
}

module.exports = { draw, KINDS, GROUND, INK, SAFE, engraveShip };
