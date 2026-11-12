// «Девятый вал» (Колода моря): a wall of water higher than the mast hangs over a small brig; the crest already tears
// its upper sails — every turn minus a Sail. Brief: docs/tasks/print-kit-cards.md «Девятый вал». Kit only (kit/README.md).
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 124;
// the key light: the low dawn sun behind the wave on the left, in front of us (kit az ~350: from the depth at the
// viewer, a little from the left; the brief's 150 "where it flies" = at the viewer and to the right). The thin crest
// glows through, the face is in its own shadow, the shadows of the brig fall at the viewer and to the right.
const light = {
  time: 'dusk',
  key: { type: 'sun', az: 348, x: 34, y: 76, el: 10, color: '#ffc470', power: 1 },
  fill: { color: '#3d6a70', power: .4 },
  rim: { az: 350, color: '#fff0c8', power: .7 },
  haze: .3,
};
// the skeleton: horizon (seen only on the right), eye 2 m; [id, x, y (base), w, h, support]
const skel = {
  horizon: HZ, eye: 2,
  items: [
    ['wave body + crest', 0, 240, 150, 220, 'sea (the wave rises from it)'],
    ['brig, heel -15 (bow up, left)', 120, 127, 68, 70, 'lower slope of the wave'],
    ['torn fore topsail', 164, 80, 24, 22, 'flying from the foremast, sheets to the yard'],
    ['second small crest', 100, 230, 110, 34, 'sea'],
    ['broken mast + canvas', 14, 246, 84, 18, 'on the water'],
  ],
};

// the sea series' water (print-kit-cards.md, head); a dawn sky: indigo above, amber at the horizon
const PAL = {
  sky: ['#2a3152', '#5a5674', '#c98a6a', '#ffd08c'], sea: ['#7fb0c8', '#2f5f74', '#16323f'],
  cloudLit: '#ffc890', cloudShade: '#3a3650', smoke: '#c8c0b8',
};

function sp(pts, closed) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
const lin = (id, x1, y1, x2, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${st.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</linearGradient>`;
const rad = (id, cx, cy, r, st) => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}">${st.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</radialGradient>`;
const blur = (id, sd, box) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
// the tone of the water on a face with the normal n = [x right, y up, z at the viewer] (as kit planeGrad does)
const waterTone = (L, n, x, y, k = 0) => { const l = Math.hypot(...n), d = L.at(x, y); return L.tone('water-wet', clamp((n[0] * d.dx - n[1] * d.dy + n[2] * d.dz) / l + k, -1, 1), x, y); };
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
// a point on a Catmull-Rom chain at parameter t (0..1 over the whole chain)
// y of the top of a chain of points at x (linear)
function yOn(pts, x) { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1); } return pts[pts.length - 1][1]; }
function along(pts, t) {
  const n = pts.length - 1, q = clamp(t) * n, i = Math.min(n - 1, Math.floor(q)), k = q - i, p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const c = (a, b, c2, d) => .5 * (2 * b + (-a + c2) * k + (2 * a - 5 * b + 4 * c2 - d) * k * k + (-a + 3 * b - 3 * c2 + d) * k * k * k);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
}

module.exports = {
  name: 'Девятый вал', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    L.pal = Object.assign({}, L.pal, PAL);
    // ——— sky at dawn; the cloud going away upper right; the sea of the trough ———
    let bg = K.sky(u, L, { horizon: HZ + 1 });
    bg += K.cloud(u, L, { x: 176, y: 58, w: 104, h: 46, seed: 14 });
    bg += K.cloud(u, L, { x: 150, y: 92, w: 80, h: 14, seed: 27, far: .6 });
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: .9, seed: 9, glitter: false });
    // the gold strip of the dawn on the sea at the horizon, right (the glitter path itself is behind the wave)
    const gs = nid('gs', u), gb = nid('gb', u);
    bg += `<defs>${rad(gs, 0, 0, 1, [[0, '#ffd89a', .85], [.5, '#ffc070', .35], [1, '#ffc070', 0]])}${blur(gb, .6, [100, HZ - 6, 110, 14])}</defs>`
      + `<ellipse cx="170" cy="${HZ + 1.4}" rx="44" ry="1.8" fill="url(#${gs})" filter="url(#${gb})"/>`;

    // ——— the wave: the back (upper left), the crest curling to the right, the overhanging lip, the hollow face, the foot
    const back = [[-12, 66], [6, 56], [30, 42], [54, 30], [78, 22.5], [102, 19.5], [122, 22], [137, 29], [145, 38.5], [146.5, 45]];
    const under = [[146.5, 45], [141, 49.5], [132, 48.6], [123, 51], [116, 58], [112.5, 70], [113, 86], [118.5, 100], [128, 109], [140, 114.6], [158, 120.2], [178, 125.6], [198, 128.6], [214, 129.4]];
    const foot = [[214, 129.4], [214, 135], [186, 133], [158, 135.5], [130, 143], [104, 157], [78, 175], [52, 196], [26, 216], [-12, 236]];
    const bodyD = sp(back) + sp(under).replace(/^M[^C]+/, '') + sp(foot).replace(/^M[^C]+/, '') + 'L-12 66Z';
    const cl = nid('wc', u), wg = nid('wg', u), wf = nid('wf', u);
    const crestT = waterTone(L, [-.3, .6, .5], 90, 30, .3), faceT = waterTone(L, [.6, .1, 1], 120, 80), footT = waterTone(L, [.3, .4, 1], 60, 200, -.2);
    let defs = `<clipPath id="${cl}"><path d="${bodyD}"/></clipPath>`
      + lin(wg, 60, 20, 140, 250, [[0, mix(crestT, L.pal.sea[1], .3)], [.25, faceT], [.6, mix(faceT, footT, .6)], [1, footT]]);
    let wave = `<path d="${bodyD}" fill="url(#${wg})"/>`;
    let inside = '';
    // the face turns from the light: darker towards the right, where it faces us and the trough
    defs += lin(wf, 40, 0, 200, 0, [[0, '#000', 0], [.6, L.shadowTint, .12], [1, L.shadowTint, .3]]);
    inside += `<rect x="-12" y="0" width="230" height="290" fill="url(#${wf})"/>`;
    // the back of the wave towards the sun: the slope above the crest catches the low light (a warm sheen)
    const bk = nid('bk', u), bkb = nid('bb', u);
    defs += lin(bk, 30, 30, 50, 70, [[0, mix(L.keyColor, L.pal.sea[0], .45), .7], [1, L.pal.sea[1], 0]]) + blur(bkb, 2.4, [-20, 0, 180, 110]);
    inside += `<path d="${sp(back.slice(0, 6))}L84 44L50 58L10 76L-12 84Z" fill="url(#${bk})" filter="url(#${bkb})"/>`;
    // the thin crest lets the low sun through: bottle green with amber under the crest line, fading down the face
    const tg = nid('tg', u), tb = nid('tb', u), glow = mix('#3f9a7c', L.keyColor, .2), amber = mix('#d9b25a', L.keyColor, .3);
    defs += rad(tg, 112, 30, 46, [[0, amber, .95], [.3, glow, .8], [.7, mix(glow, faceT, .5), .35], [1, faceT, 0]]) + blur(tb, 3.2, [40, 0, 140, 110]);
    inside += `<path d="M64 26C84 20 112 17 132 25C146 32 150 44 140 52C128 54 120 60 114 72C110 60 98 46 84 40C76 37 68 34 64 26Z" fill="url(#${tg})" filter="url(#${tb})"/>`;
    // the hollow under the lip: the curl's own shadow on the face
    const hg = nid('hg', u), hb = nid('hb', u);
    defs += rad(hg, 128, 56, 22, [[0, L.shadowTint, .55], [.6, L.shadowTint, .25], [1, L.shadowTint, 0]]) + blur(hb, 2.6, [90, 30, 70, 60]);
    inside += `<ellipse cx="128" cy="58" rx="20" ry="13" fill="url(#${hg})" filter="url(#${hb})"/>`;
    // the volume of the face: broad soft folds of the rolling water from the crest down to the left, lighter where they
    // turn up to the sky, and the sky's sheen on the lower concave face (it faces up to the light sky on the right)
    const R = rng(41), lace = mix('#eef6f8', L.keyColor, .15), skyC = mix(L.pal.sky[2], L.pal.sea[0], .5);
    const fb = nid('fb', u); defs += blur(fb, 6, [-30, 0, 260, 300]);
    let folds = '';
    [[[112, 34], [90, 60], [62, 96], [30, 136], [-8, 170]], [[118, 60], [100, 88], [74, 124], [44, 160], [10, 196]], [[96, 30], [70, 50], [40, 76], [6, 104]]].forEach((c, i) => {
      const g = nid('fg', u); defs += lin(g, c[0][0], c[0][1], c[c.length - 1][0], c[c.length - 1][1], [[0, skyC, 0], [.3, skyC, .16 - i * .03], [.7, skyC, .09], [1, skyC, 0]]);
      folds += `<path d="${sp(c)}" fill="none" stroke="url(#${g})" stroke-width="${22 - i * 4}" stroke-linecap="round" filter="url(#${fb})"/>`; });
    const sk = nid('sk', u); defs += lin(sk, 150, 100, 70, 150, [[0, skyC, .5], [.5, skyC, .22], [1, skyC, 0]]);
    folds += `<path d="M112 84C114 100 124 112 150 122L120 146L60 150L80 110Z" fill="url(#${sk})" filter="url(#${fb})"/>`;
    inside += folds;
    // the kit's ripples on the lower face and the foot, larger towards the viewer
    // the kit's ripples on the lower face and the foot, fading out up the face (a mask, no edge)
    const wm = nid('wm', u), wmg = nid('wmg', u);
    defs += lin(wmg, 0, 80, 0, 170, [[0, '#fff', 0], [1, '#fff', .42]]) + `<mask id="${wm}" maskUnits="userSpaceOnUse" x="-12" y="0" width="230" height="290"><rect x="-12" y="0" width="230" height="290" fill="url(#${wmg})"/></mask>`;
    inside += `<g mask="url(#${wm})">${K.water(u, L, { horizon: 60, bottom: 300, swell: 1, seed: 61, glitter: false, w: 220 })}</g>`;
    // water draining down the face: long streaks of lace from under the lip down into the face, each its own length
    let streaks = '';
    for (let i = 0; i < 30; i++) {
      const top = i % 2, a0 = top ? along(back, .45 + R() * .5) : along(under, .14 + R() * .4), a = top ? [a0[0] - R() * 8, a0[1] + 8 + R() * 14] : [a0[0] - 3 - R() * 14, a0[1] + R() * 6], len = 14 + R() * 40, bend = 2 + R() * 6, th = .25 + R() * .45, dx = -(3 + R() * 12);
      streaks += `<path d="M${f(a[0])} ${f(a[1])}c${f(bend * .3)} ${f(len * .35)} ${f(dx * .4)} ${f(len * .7)} ${f(dx)} ${f(len)}c${f(-dx * .3 + th)} ${f(-len * .3)} ${f(-dx * .7 + bend * .3 + th * 2)} ${f(-len * .65)} ${f(-dx + th * 1.6)} ${f(-len)}z" fill="${lace}" opacity="${f(.07 + R() * .17)}"/>`;
    }
    inside += streaks;
    // the dark foot (under the glass): the wave's base in its own shadow
    const ft = nid('ft', u);
    defs += lin(ft, 0, 140, 0, 250, [[0, L.shadowTint, 0], [1, L.shadowTint, .4]]);
    inside += `<rect x="-12" y="140" width="230" height="150" fill="url(#${ft})"/>`;
    wave = `<defs>${defs}</defs>` + wave + `<g clip-path="url(#${cl})">${inside}</g>`;
    // the warm rim of the sun along the very crest (it shines through the thinnest water)
    const rg = nid('rg', u), rb = nid('rb', u);
    wave += `<defs>${lin(rg, 0, 18, 150, 50, [[0, L.rimColor, .1], [.4, L.rimColor, .85], [.85, amber, .6], [1, amber, 0]])}${blur(rb, .5, [-20, 0, 190, 80])}</defs>`
      + `<path d="${sp(back)}" fill="none" stroke="url(#${rg})" stroke-width="1.1" filter="url(#${rb})"/>`;
    // foam on the crest and on the falling lip
    wave += crestFoam(u, L, back.slice(3, 10).map(p => [p[0], p[1] + 1.2]), { seed: 7, h: 2, gap: .12 });
    // KIT-CANDIDATE spray: the mist torn off the crest by the wind, carried right and up; against the low sun it glows
    // warm at its edge to the source and greys away from it
    const mb = nid('mb', u), mg = nid('mg', u), mist = mix('#ffffff', L.keyColor, .35);
    let spray = `<defs>${blur(mb, 2.2, [40, -20, 170, 80])}<radialGradient id="${mg}" fx=".3" fy=".6"><stop offset="0" stop-color="${mist}" stop-opacity=".8"/><stop offset=".5" stop-color="${mix(mist, L.pal.sky[1], .4)}" stop-opacity=".35"/><stop offset="1" stop-color="${L.pal.sky[1]}" stop-opacity="0"/></radialGradient></defs><g filter="url(#${mb})">`;
    for (let i = 0; i < 9; i++) { const t = i / 8, x = lerp(70, 150, t) + R() * 6, y = yOn(back, x) - 3 - R() * 6 - t * 6, rx = 8 + R() * 10, ry = 3 + R() * 3;
      spray += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(-12 - R() * 14)} ${f(x)} ${f(y)})" fill="url(#${mg})" opacity="${f(.5 + R() * .4)}"/>`; }
    spray += '</g>';
    let drops = '';
    for (let i = 0; i < 22; i++) { const x = 80 + R() * 76, y = yOn(back, Math.min(146, x)) - 1 - R() * 10, l = .4 + R() * .9; drops += `<path d="M${f(x)} ${f(y)}l${f(l)} ${f(-l * .35)}" stroke="${mist}" stroke-width="${f(.3 + R() * .4)}" stroke-linecap="round" opacity="${f(.25 + R() * .4)}"/>`; }
    wave += spray + drops + K.splash(u, { x: 141, y: 33, w: 10, h: 6, seed: 2, L, wind: 1 });
    // the foot: a band of churned white water along the curve of the foot, then the foam in broken patches
    const wb = nid('wb', u), wbf = nid('wbf', u), fz = foot.slice(2, 10), wbd = sp(fz) + sp(fz.slice().reverse().map(p => [p[0] + 4, p[1] + 7])).replace(/^M/, 'L') + 'Z';
    wave += `<defs>${lin(wb, 0, 130, 0, 236, [[0, mix(lace, L.pal.sea[1], .35), .55], [1, mix(lace, L.pal.sea[1], .5), .35]])}${blur(wbf, 1.6, [-30, 110, 260, 150])}</defs><path d="${wbd}" fill="url(#${wb})" filter="url(#${wbf})"/>`;
    // the foot: churned water where the face meets the trough, in broken patches
    wave += crestFoam(u, L, foot.slice(2, 10).map(p => [p[0], p[1] - 1]), { seed: 19, h: 1.2, gap: .5 });
    // patches of white water along the foot, torn and of different size
    let ww = '';
    for (let i = 0; i < 16; i++) { const a = along(foot.slice(2, 10), R()), rx = 3 + R() * 5, ry = .5 + R() * .7;
      ww += `<ellipse cx="${f(a[0] + (R() - .5) * 4)}" cy="${f(a[1] + 1 + R() * 3)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(-28 + R() * 10)} ${f(a[0])} ${f(a[1])})" fill="${lace}" opacity="${f(.18 + R() * .3)}"/>`; }
    const wwf = nid('ww', u); wave += `<defs><filter id="${wwf}" filterUnits="userSpaceOnUse" x="-20" y="110" width="250" height="150"><feTurbulence type="fractalNoise" baseFrequency="0.3 0.4" numOctaves="2" seed="17" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g filter="url(#${wwf})">${ww}</g>`;

    // ——— the brig at the foot: heeled -15 (bow up, into the wave), reefed; its torn fore topsail flies off ———
    const x0 = 157, y0 = 119.8, s = .74, ang = -15, ra = ang * Math.PI / 180, ca = Math.cos(ra), sa = Math.sin(ra);
    const pt = (X, H) => [x0 + s * (X * ca - H * sa), y0 - s * (X * sa + H * ca)];
    const wl = [pt(-400, -.2), pt(400, -.2), pt(400, 900), pt(-400, 900)].map(p => f(p[0]) + ' ' + f(p[1])).join('L');
    // KIT-CANDIDATE heel: the kit cuts the hull at a level line y = waterline; heeled, the cut must tilt with the hull
    let brig = `<g transform="rotate(${ang} ${x0} ${y0})">${K.contactShadow(u, x0, y0 + .8, 52, L, { ry: 2.4, opacity: .5 })}</g>`;
    brig += K.ship(u, L, { kind: 'brig', x: x0, y: y0, scale: s, heel: ang, sails: 'reefed', detail: 'near', seed: 23 })
      .replace(/<path d="M[-\d.]+ ([-\d.]+)L[-\d.]+ \1" stroke="#[0-9a-f]{6}" stroke-width="[\d.]+" opacity=".45"\/>/, '')
      .replace(/(<clipPath id="khw[^"]+">)<rect x="-400" y="-900" width="1000" height="[\d.]+"\/>/, `$1<path d="M${wl}Z"/>`);
    brig += `<g transform="rotate(${ang} ${x0} ${y0})">${K.foam(u, { x: x0 - 1, y: y0 + .3, w: 50, h: 1.1, seed: 12, L })}</g>`;
    brig += K.splash(u, { x: pt(-35, 0)[0] + 1, y: pt(-35, 0)[1] + .6, w: 9, h: 8, seed: 3, L, wind: 1 });
    // the torn fore topsail: a sheet of canvas blown off the foremast, two torn sheets still running to the yard arms
    const ya = pt(-15 - 9, 49), yb = pt(-15 + 9, 49), sailP = [[166, 62], [176, 58.5], [185, 62], [183, 70], [187, 77], [176, 76], [168, 79], [170, 71]];
    const sm = K.mat('canvas', L, { form: 'fold', x1: 168, y1: 60, x2: 184, y2: 78, r: 2.6, u }), sr = L.ramp('canvas', 176, 68);
    brig += `<defs>${sm.defs}</defs><path d="M${f(ya[0])} ${f(ya[1])}Q${f((ya[0] + 166) / 2)} ${f(ya[1] - 2)} 166 62M${f(yb[0])} ${f(yb[1])}Q${f((yb[0] + 168) / 2)} ${f(yb[1] + 4)} 168 79" fill="none" stroke="${sr.outline}" stroke-width=".3" opacity=".85"/>`
      + `<path d="${sp(sailP, true)}" fill="${sm.fill}" stroke="${sr.outline}" stroke-width=".35"/>`
      + `<path d="M171 63C174 67 173 71 175 75M178 61C180 65 179 70 182 74" fill="none" stroke="${sr.core}" stroke-width=".5" opacity=".6"/>`;

    // ——— under the glass: the second small crest on the right, the broken mast with its canvas afloat ———
    let fg = '';
    const sTop = [[-14, 252], [10, 246], [40, 236], [80, 224], [110, 212], [132, 204], [152, 199], [172, 197.5], [192, 200], [214, 205]];
    const sD = sp(sTop) + 'L214 290L-14 290Z', sg = nid('sg', u);
    fg += `<defs>${lin(sg, 0, 196, 0, 290, [[0, mix(L.pal.sea[1], '#9fd6c8', .25)], [.2, L.pal.sea[1]], [1, L.pal.sea[2]]])}</defs><path d="${sD}" fill="url(#${sg})"/>`;
    fg += crestFoam(u, L, sTop.slice(4, 9).map(p => [p[0], p[1] + .8]), { seed: 23, h: 1.6, gap: .25 });
    const m1 = [16, 247], m2 = [96, 236];
    const cvm = K.mat('canvas', L, { form: 'plane', x1: 30, y1: 238, x2: 70, y2: 252, n: [0, .9, .45], u }), cr = L.ramp('canvas', 50, 245);
    const rag = 'M30 243.6C40 241 52 240 64 238.6C67 241.6 63 244.6 68 247.4C58 249.6 48 248.2 40 251.6C36 249 31 248 30 243.6Z', wv = nid('wv', u);
    fg += K.contactShadow(u, 56, 242, 84, L, { ry: 3, opacity: .45 })
      + `<defs>${cvm.defs}${lin(wv, 0, 242, 0, 252, [[0, L.pal.sea[1], 0], [1, L.pal.sea[2], .7]])}</defs><path d="${rag}" fill="${cvm.fill}" stroke="${cr.outline}" stroke-width=".3"/><path d="${rag}" fill="url(#${wv})"/>`
      + K.shadeCyl(u, m1[0], m1[1], m2[0], m2[1], 3.2, L, 'oak', { r1: 3.4, r2: 2.8, outline: .5, seed: 9 })
      + K.foam(u, { x: 56, y: 242.5, w: 92, h: 1.4, seed: 44, L });
    return [bg + wave + brig, fg];
  },
};
