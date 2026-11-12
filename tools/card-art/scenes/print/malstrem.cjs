// «Мальстрём» (Колода моря): the view from inside the funnel — along the far wall of water two ships circle one after
// the other, heeled in to the axis; below, the black eye of the whirlpool — the sea itself changes the ships' places.
// Brief: docs/tasks/print-kit-cards.md «Мальстрём». Kit only (kit/README.md).
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 128; // the line of the eye: hidden by the wall of water (the rim of the funnel is above it)
// the key light: cold light from the rift in the clouds high over the middle, in front of us (kit az ~2: from the
// depth at the viewer; the brief's 180 "where it flies" = at the viewer): the rim and the foam light, the wall darkens
// to the eye, the water dust over the rim glows; short shadows of the ships, down the slope to the centre
const light = {
  time: 'dusk',
  key: { type: 'sun', x: 110, y: 28, el: 70, color: '#b9c6e0', power: .6 },
  fill: { color: '#27365a', power: .5 },
  rim: { az: 0, color: '#e4ecff', power: .5 },
  haze: .3,
};
// the funnel: contours k = 0 (the rim) .. 1 (the eye) are ellipses; the far half (up) is flat, the near half (down,
// coming at us) is deep — we look from the wall near us, already slid into the funnel
const EYE = [100, 170];
const C = k => ({ cx: lerp(100, EYE[0], k), cy: lerp(120, EYE[1], k), rx: lerp(136, 21, Math.pow(k, .9)), up: lerp(58, 11, Math.pow(k, .8)), dn: lerp(300, 15, Math.pow(k, .5)) });
const P = (k, t) => { const c = C(k), s = Math.sin(t); return [c.cx + c.rx * Math.cos(t), c.cy + (s < 0 ? c.up : c.dn) * s]; };
// the skeleton: [id, x, y (base), w, h, support]
const skel = {
  horizon: HZ, eye: 4,
  items: [
    ['rim of the funnel', 0, 84, 200, 22, 'sea (arc x0 y84 - x100 y62 - x200 y78)'],
    ['merchant A (near), heel 20', 116, 120, 64, 56, 'far wall of the funnel'],
    ['merchant B (far), heel -20', 30, 126, 50, 40, 'far wall of the funnel'],
    ['eye of the whirlpool', 74, 188, 52, 30, 'bottom of the funnel'],
    ['twisted plank + rope', 120, 238, 70, 22, 'near wall (foam)'],
  ],
};
// the sea series' water; an indigo dusk sky
const PAL = {
  sky: ['#1c2140', '#2e3862', '#4c5a88', '#8090b4'], sea: ['#7fb0c8', '#2f5f74', '#16323f'],
  cloudLit: '#c6d0ec', cloudShade: '#283258', smoke: '#aab4cc',
};

function sp(pts, closed) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
const lin = (id, x1, y1, x2, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${st.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</linearGradient>`;
const blur = (id, sd, box) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
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
// one contour as a closed path (the far half and the near half)
const ring = k => { const pts = []; for (let i = 0; i < 24; i++) pts.push(P(k, -Math.PI + i / 24 * 2 * Math.PI)); return sp(pts, true); };

// KIT-CANDIDATE vortex: the inside of a funnel of water. The wall's tone runs from the rim (lit from the rift, the
// sky's sheen on it) to the dark eye: the light falls on the far wall that faces us and up, the near wall turns
// away; foam lies in spiral bands running in to the eye, the gaps between them grow towards the viewer
function vortex(u, L, o = {}) {
  const R = rng(o.seed || 5), fl = nid('vf', u), N = 30;
  const lit = L.tone('water-wet', .55, 100, 70), sheen = mix(L.pal.sky[3], L.keyColor, .4), deep = L.tone('water-wet', -.9, 100, 170), eye = mix(deep, '#10202c', .55);
  let rings = '';
  for (let i = 0; i <= N; i++) { const k = i / N, c = k < .5 ? mix(mix(lit, sheen, .25 * (1 - k * 2)), L.pal.sea[1], Math.pow(k * 2, 1.2)) : mix(L.pal.sea[1], k < .9 ? deep : eye, Math.pow((k - .5) / .5, .9)); rings += `<path d="${ring(k)}" fill="${c}"/>`; }
  let out = `<defs>${blur(fl, 1.8, [-40, 40, 280, 280])}</defs><g filter="url(#${fl})">${rings}</g>`;
  // the near wall turns away from the light: a shade over the lower half that deepens at the bottom edge
  const nw = nid('vn', u); out += `<defs>${lin(nw, 0, 150, 0, 280, [[0, L.shadowTint, 0], [.5, L.shadowTint, .3], [1, L.shadowTint, .55]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${nw})"/>`;
  // the throat: the darkest ring and a soft black-blue hole (never black)
  const th = nid('vt', u), tb = nid('vb', u);
  out += `<defs><radialGradient id="${th}" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="${mix(eye, '#0d1822', .5)}"/><stop offset=".55" stop-color="${eye}" stop-opacity=".9"/><stop offset="1" stop-color="${eye}" stop-opacity="0"/></radialGradient>${blur(tb, 1.4, [60, 140, 80, 60])}</defs>`
    + `<ellipse cx="${EYE[0]}" cy="${EYE[1] + 1}" rx="17" ry="11" fill="url(#${th})" filter="url(#${tb})"/>`;
  // spiral bands of foam: each arm runs in from the rim to the eye in less than a turn, its own pitch; a band of
  // foam that thins and dims towards the eye, with loose strands beside it, broken in places
  const fb = nid('vs', u), foamC = mix('#eef6f8', L.keyColor, .2), foamS = mix(foamC, L.pal.sea[1], .5);
  let bands = '';
  const strand = (a, t0, turns, k0, k1, wk, off, opk, brk) => {
    const n = 70; let seg = null; const segs = [];
    for (let i = 0; i <= n; i++) {
      const q = i / n, k = lerp(k0, k1, Math.pow(q, .75)), t = t0 + q * turns * 2 * Math.PI, s = Math.sin(t);
      const p = P(clamp(k + off), t), w = (.35 + 2.4 * (1 - k)) * (1 + 1.1 * Math.max(0, s) * (1 - k)) * (.55 + .45 * Math.sin(q * 13 + a * 3.1) + .25 * Math.sin(q * 31 + a)) * wk;
      if (Math.sin(q * brk + a * 1.7) + Math.sin(q * brk * 2.3 + a) * .5 + (R() - .5) * .6 < -.7 || w < .15) { if (seg) segs.push(seg); seg = null; continue; }
      if (!seg) seg = { top: [], bot: [], k: [] };
      // the band lies along the contour: its width across goes along the slope (towards the eye)
      const pin = P(Math.min(1, k + off + .02), t), dx = pin[0] - p[0], dy = pin[1] - p[1], l = Math.hypot(dx, dy) || 1;
      seg.top.push([p[0] - dx / l * w * .4, p[1] - dy / l * w * .4]); seg.bot.push([p[0] + dx / l * w * .6, p[1] + dy / l * w * .6]); seg.k.push(k + (s > 0 ? .25 : 0));
    }
    if (seg) segs.push(seg);
    for (const g of segs) { if (g.top.length < 3) continue; const km = Math.min(1, g.k[Math.floor(g.k.length / 2)]), op = clamp(.9 - km * .75) * (.55 + R() * .45) * opk;
      const d = sp(g.top) + sp(g.bot.slice().reverse()).replace(/^M/, 'L') + 'Z';
      bands += `<path d="${d}" fill="${foamS}" opacity="${f(op * .75)}"/><path d="${sp(g.top)}" fill="none" stroke="${foamC}" stroke-width="${f(.3 + .7 * (1 - km))}" stroke-linecap="round" opacity="${f(op)}"/>`; }
  };
  for (let a = 0; a < (o.arms || 5); a++) {
    const t0 = -Math.PI * (.02 + a * .41) + (R() - .5) * .35, turns = .7 + R() * .35, k0 = R() * .08, k1 = .9 + R() * .07, brk = 14 + R() * 12;
    strand(a, t0, turns, k0, k1, 1, 0, 1, brk);
    strand(a + 7, t0 + .06, turns * .96, k0 + .02, k1 - .05, .35, .028 + R() * .02, .8, brk * 1.4);
    if (R() > .4) strand(a + 13, t0 - .05, turns * 1.03, k0 + .04, k1 - .1, .25, -.03 - R() * .02, .6, brk * 1.8);
  }
  out += `<defs>${blur(fb, .35, [-40, 30, 280, 280])}</defs><g filter="url(#${fb})">${bands}</g>`;
  // the lace between the bands: thin streaks along the contours
  let lace = '';
  for (let i = 0; i < 70; i++) { const k = Math.pow(R(), .8) * .9, t = -Math.PI * 2 * R(), dt = (.08 + R() * .16) * (1 - k * .5), p0 = P(k, t), p1 = P(k + .004, t + dt * .5), p2 = P(k + .008, t + dt);
    lace += `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}" fill="none" stroke="${foamC}" stroke-width="${f(.2 + R() * .45 * (1 - k))}" stroke-linecap="round" opacity="${f(.12 + R() * .25)}"/>`; }
  out += lace;
  return out;
}

module.exports = {
  name: 'Мальстрём', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, PAL);
    // ——— the sky over the rim: heavy indigo clouds, a rift of cold light in the middle ———
    let bg = K.sky(u, L, { horizon: 92 });
    bg += K.localGlow(u, { x: 110, y: 30, color: '#dfe6fa', power: .7, radius: 40 }, { core: false });
    bg += K.cloud(u, L, { x: 28, y: 52, w: 120, h: 50, seed: 15 });
    bg += K.cloud(u, L, { x: 182, y: 50, w: 110, h: 46, seed: 44 });
    bg += K.cloud(u, L, { x: 60, y: 14, w: 150, h: 26, seed: 8 });
    bg += K.cloud(u, L, { x: 172, y: 12, w: 100, h: 22, seed: 29 });
    bg += K.cloudBank(u, L, { y: 80, h: 12, x0: -10, x1: 210, n: 5, seed: 6, far: .65 });
    // ——— the funnel ———
    bg += vortex(u, L, { seed: 5, arms: 5 });
    // the rim: the lit crest of the far wall and the water dust over it, glowing against the rift
    const rimPts = []; for (let i = 0; i <= 20; i++) rimPts.push(P(0, -Math.PI + i / 20 * Math.PI));
    const rg = nid('rg', u), rb = nid('rb', u), dust = mix(L.pal.sky[3], L.keyColor, .5);
    bg += `<defs>${lin(rg, 0, 0, 200, 0, [[0, L.rimColor, .25], [.55, L.rimColor, .9], [1, L.rimColor, .35]])}${blur(rb, .6, [-10, 50, 220, 50])}</defs><path d="${sp(rimPts)}" fill="none" stroke="url(#${rg})" stroke-width="1.2" filter="url(#${rb})"/>`;
    const db = nid('db', u), dg = nid('dg', u);
    let mist = `<defs>${blur(db, 3, [-20, 30, 240, 80])}<radialGradient id="${dg}"><stop offset="0" stop-color="${dust}" stop-opacity=".55"/><stop offset="1" stop-color="${dust}" stop-opacity="0"/></radialGradient></defs><g filter="url(#${db})">`;
    const R = rng(71);
    for (let i = 0; i < 11; i++) { const p = P(0, -Math.PI + (i + .5) / 11 * Math.PI), near = 1 - Math.min(1, Math.abs(p[0] - 110) / 120); mist += `<ellipse cx="${f(p[0] + (R() - .5) * 8)}" cy="${f(p[1] - 3 - R() * 4)}" rx="${f(14 + R() * 12)}" ry="${f(3 + R() * 3)}" fill="url(#${dg})" opacity="${f(.35 + .5 * near)}"/>`; }
    bg += mist + '</g>';
    { const rf = []; for (let i = 0; i <= 10; i++) rf.push(P(.012, -Math.PI * .72 + i / 10 * Math.PI * .44)); bg += crestFoam(u, L, rf, { seed: 3, h: .8, gap: .35 }); }

    // ——— the two ships on the far wall, heeled in to the axis; a short soft shadow of each down the slope ———
    const shipOn = (o) => {
      const ra = o.heel * Math.PI / 180, ca = Math.cos(ra), sa = Math.sin(ra), d = o.flip ? -1 : 1;
      const pt = (X, H) => [o.x + d * o.scale * (X * ca - H * sa), o.y - o.scale * (X * sa + H * ca)];
      const wl = [pt(-400, -.2), pt(400, -.2), pt(400, 900), pt(-400, 900)].map(p => f(p[0]) + ' ' + f(p[1])).join('L');
      let s = `<g transform="rotate(${o.heel} ${o.x} ${o.y})">${K.contactShadow(u, o.x + o.sx, o.y + o.sy, 70 * o.scale, L, { ry: 3.6 * o.scale, opacity: .5 })}</g>`;
      // KIT-CANDIDATE heel: the kit cuts the hull at a level line y = waterline; heeled, the cut must tilt with the hull
      s += K.ship(u, L, Object.assign({ kind: 'merchant', sails: 'reefed', detail: o.detail }, o))
        .replace(/<path d="M[-\d.]+ ([-\d.]+)L[-\d.]+ \1" stroke="#[0-9a-f]{6}" stroke-width="[\d.]+" opacity=".45"\/>/, '')
        .replace(/(<clipPath id="khw[^"]+">)<rect x="-400" y="-900" width="1000" height="[\d.]+"\/>/, `$1<path d="M${wl}Z"/>`);
      // the bow wave and the foam along the side: the ship runs left round the funnel
      s += `<g transform="rotate(${o.heel} ${o.x} ${o.y})">${K.foam(u, { x: o.x + 1 * o.scale, y: o.y + .3, w: 58 * o.scale, h: 1.6 * o.scale, seed: o.seed + 4, L })}</g>`;
      const st = pt(-37, 0); s += K.splash(u, { x: st[0], y: st[1] + .5, w: 14 * o.scale, h: 10 * o.scale, seed: o.seed % 3 === 0 ? 1 : o.seed, L, wind: -1 });
      return s;
    };
    let ships = shipOn({ x: 60, y: 121, scale: .5, heel: -20, seed: 31, detail: 'mid', sx: 2, sy: 2 });
    ships += shipOn({ x: 148, y: 111, scale: .76, heel: 20, seed: 13, detail: 'near', sx: -2, sy: 2.5 });

    // ——— under the glass: the eye, the wide whorls (in the vortex), a twisted plank with a rope end ———
    let fg = '';
    const pl = [[38, 228], [62, 221], [86, 222.5]], pw = 4.6;
    // the plank: a board bent along the whorl, its top face lit from above, its edge in shade; grain along it
    const top = pl.map(p => [p[0], p[1] - pw * .5]), bot = pl.map(p => [p[0] + .6, p[1] + pw * .5]), edge = bot.map(p => [p[0] + .4, p[1] + 1.6]);
    const pm = K.mat('oak', L, { form: 'plane', x1: pl[0][0], y1: pl[0][1] - 2, x2: pl[2][0], y2: pl[2][1] + 2, n: [0, .85, .5], u }), pe = K.mat('oak', L, { form: 'plane', x1: pl[0][0], y1: pl[0][1], x2: pl[2][0], y2: pl[2][1] + 3, n: [0, -.2, 1], u }), orp = L.ramp('oak', pl[1][0], pl[1][1]);
    fg += K.contactShadow(u, pl[1][0], pl[1][1] + 3, 44, L, { ry: 2.6, opacity: .45 });
    fg += `<defs>${pm.defs}${pe.defs}</defs><path d="${sp(bot)}${sp(edge.slice().reverse()).replace(/^M/, 'L')}Z" fill="${pe.fill}" stroke="${orp.outline}" stroke-width=".35"/>`
      + `<path d="${sp(top)}${sp(bot.slice().reverse()).replace(/^M/, 'L')}Z" fill="${pm.fill}" stroke="${orp.outline}" stroke-width=".4"/>`
      + `<path d="${sp(pl.map(p => [p[0] - .4, p[1] - .6]))}M${f(pl[0][0] + 1)} ${f(pl[0][1] + .9)}Q${f(pl[1][0] + 1)} ${f(pl[1][1] + .9)} ${f(pl[2][0] - 2)} ${f(pl[2][1] + .7)}" fill="none" stroke="${orp.core}" stroke-width=".3" opacity=".6"/>`;
    // the nail hole end and a rope's end still tied round it, trailing in the water
    const re = pl[2];
    fg += K.rope(u, L, [[re[0] + 1, re[1] - 1.4], [re[0] - 4, re[1] + 3], [re[0] - 12, re[1] + 5], [re[0] - 20, re[1] + 3.5]], { r: .9, seed: 4 });
    fg += K.foam(u, { x: pl[1][0], y: pl[1][1] + 2.6, w: 50, h: 1.3, seed: 52, L });
    return [bg + ships, fg];
  },
};
