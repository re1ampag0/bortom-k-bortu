// «Девятый вал» (Колода моря): one wave, twice the height of the masts, rears out of the left of the frame and curls
// over a brig; she climbs its foot bow first, laid over, and the lip, already over her mastheads, tears the main
// topgallant off its yard — it flies out of the hollow on two sheets. No rain, one wave (that is «Буря»). The low
// storm sun stands behind the wave: the thin crest glows bottle green and amber through, the face and the brig are
// in the wave's own shadow (cold, rim-lit), the sky right of the curl is the only open light.
// Every turn minus a Sail. Brief: docs/mockups/print/card-briefs.md «Девятый вал». Kit only (kit/README.md).
'use strict';
const K = require('../kit/index.cjs');
const { nid, f, clamp, lerp, rng, mix } = K;

const HZ = 114;
// the key light: the low sun behind the wave, ahead and left (kit az ~330: from the depth, from the left), hidden by
// the crest; it shines through the thin lip, rims the brig on her left edges; the sky right of the curl is lit by it
const light = {
  time: 'dusk',
  key: { type: 'sun', az: 332, x: 46, y: 70, el: 9, color: '#ffbe6a', power: .85 },
  fill: { color: '#24414c', power: .45 },
  rim: { az: 330, color: '#ffe2b0', power: .75 },
  haze: .3,
};
// the skeleton: horizon (seen only right of the curl), eye 2 m; [id, x, y (base), w, h, support]
const skel = {
  horizon: HZ, eye: 2,
  items: [
    ['wave: back, crest y 14, lip to x 182', -12, 290, 226, 276, 'sea (the wave rises from it)'],
    ['brig, heel -14, roll 12 (bow up, left)', 62, 124, 90, 66, 'foot of the wave (tilted waterline)'],
    ['torn main topgallant', 156, 74, 26, 22, 'flying from the main topgallant yard on two sheets'],
    ['spray falling from the lip', 168, 84, 24, 40, 'from the lip'],
  ],
};

// a storm dusk: slate above, a hot band at the horizon; the water bottle green (the sea series' water darkened)
const PAL = {
  sky: ['#121726', '#2a2d44', '#6e4f58', '#d88f58'], sea: ['#4f8e88', '#173f4a', '#081a22'],
  cloudLit: '#e6a070', cloudShade: '#1c1e30', smoke: '#9a9ca4',
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
    const R = rng(41), lace = mix('#eef6f8', L.keyColor, .15);
    // ——— the storm sky: the hidden sun lights the air over the back of the wave; heavy cloud upper right, warm-edged
    let bg = K.sky(u, L, { horizon: HZ + 1, stars: false });
    bg += K.localGlow(u, { x: 40, y: 46, color: '#ffbe70', power: .7, radius: 74 }, { core: false });
    bg += K.cloud(u, L, { x: 34, y: 16, w: 150, h: 24, seed: 5, far: .25 });
    bg += K.cloud(u, L, { x: 178, y: 30, w: 130, h: 40, seed: 14 });
    bg += K.cloud(u, L, { x: 204, y: 76, w: 86, h: 30, seed: 27, far: .35 });
    bg += K.cloudBank(u, L, { y: HZ - 1, h: 9, x0: 140, x1: 224, n: 3, seed: 12, far: .7 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: 1, seed: 9, glitter: false });
    // the warm line of the low sun on the far sea under the curl
    const gs = nid('gs', u), gb = nid('gb', u);
    bg += `<defs>${rad(gs, 0, 0, 1, [[0, '#ffc888', .7], [.5, '#ffb070', .25], [1, '#ffb070', 0]])}${blur(gb, .6, [140, HZ - 6, 80, 14])}</defs>`
      + `<ellipse cx="190" cy="${HZ + 1.2}" rx="30" ry="1.5" fill="url(#${gs})" filter="url(#${gb})"/>`;

    // ——— the wave: the back (left, up to the crest), the lip curling right over the brig, the hollow face, the foot
    const back = [[-12, 74], [6, 62], [24, 48], [44, 34], [64, 23], [86, 16], [108, 13.5], [130, 16], [150, 22], [166, 30], [178, 39.5], [183.5, 49]];
    const under = [[183.5, 49], [179.5, 55], [171, 56.8], [163, 55.6], [156.5, 58.5], [152.5, 66], [152.8, 78], [157, 91], [166, 102], [180, 109.6], [196, 114.4], [214, 116.6]];
    const bodyD = sp(back) + sp(under).replace(/^M[^C]+/, '') + 'L214 290L-12 290Z';
    const cl = nid('wc', u), wg = nid('wg', u);
    const crestT = waterTone(L, [-.4, .7, .3], 100, 20, .1), faceT = waterTone(L, [.5, .1, 1], 110, 70, -.15), footT = waterTone(L, [.2, .4, 1], 80, 180, -.45);
    let defs = `<clipPath id="${cl}"><path d="${bodyD}"/></clipPath>`
      + lin(wg, 0, 12, 0, 240, [[0, mix(crestT, L.pal.sea[0], .3)], [.12, mix(crestT, faceT, .5)], [.3, faceT], [.55, mix(faceT, footT, .6)], [1, footT]]);
    let wave = `<path d="${bodyD}" fill="url(#${wg})"/>`;
    let inside = '';
    // the face turns from the light towards the right, where it looks at us under the lip
    const wf = nid('wf', u);
    defs += lin(wf, 40, 0, 200, 0, [[0, '#000', 0], [.55, L.shadowTint, .2], [1, L.shadowTint, .45]]);
    inside += `<rect x="-12" y="0" width="230" height="290" fill="url(#${wf})"/>`;
    // the back of the wave towards the sun: a warm sheen on the slope left of the crest
    const bk = nid('bk', u), bkb = nid('bb', u);
    defs += lin(bk, 20, 40, 40, 90, [[0, mix(L.keyColor, L.pal.sea[0], .35), .75], [1, L.pal.sea[1], 0]]) + blur(bkb, 2.6, [-20, 0, 160, 120]);
    inside += `<path d="${sp(back.slice(0, 7))}L90 40L50 66L10 90L-12 100Z" fill="url(#${bk})" filter="url(#${bkb})"/>`;
    // the thin crest and lip let the low sun through: bottle green, amber under the crest line, fading down the face
    const tg = nid('tg', u), tb = nid('tb', u), glow = mix('#3fae86', L.keyColor, .18), amber = mix('#e0b860', L.keyColor, .35);
    defs += rad(tg, 118, 24, 62, [[0, amber, .95], [.28, glow, .85], [.62, mix(glow, faceT, .5), .4], [1, faceT, 0]]) + blur(tb, 3.4, [30, -10, 190, 110]);
    inside += `<path d="M58 30C84 14 128 10 158 22C176 30 186 44 178 54C166 56 156 58 150 68C140 56 120 44 100 40C84 37 68 38 58 30Z" fill="url(#${tg})" filter="url(#${tb})"/>`;
    // the hollow under the lip: the curl's own shadow, deepest just under it, over the brig's mastheads
    const hg = nid('hg', u), hb = nid('hb', u);
    defs += rad(hg, 150, 62, 34, [[0, L.shadowTint, .7], [.55, L.shadowTint, .35], [1, L.shadowTint, 0]]) + blur(hb, 3, [100, 26, 100, 90]);
    inside += `<ellipse cx="146" cy="64" rx="34" ry="18" fill="url(#${hg})" filter="url(#${hb})"/>`;
    // the volume of the face: broad soft folds of water rolling down from the crest, lighter where they turn to the sky
    const skyC = mix(L.pal.sky[3], L.pal.sea[0], .55), fb = nid('fb', u);
    defs += blur(fb, 6, [-30, 0, 260, 300]);
    let folds = '';
    [[[120, 40], [96, 66], [70, 98], [40, 132]], [[140, 70], [118, 92], [96, 120]], [[96, 30], [70, 50], [40, 76], [6, 104]]].forEach((c, i) => {
      const g = nid('fg', u); defs += lin(g, c[0][0], c[0][1], c[c.length - 1][0], c[c.length - 1][1], [[0, skyC, 0], [.3, skyC, .2 - i * .04], [.7, skyC, .1], [1, skyC, 0]]);
      folds += `<path d="${sp(c)}" fill="none" stroke="url(#${g})" stroke-width="${20 - i * 4}" stroke-linecap="round" filter="url(#${fb})"/>`; });
    // the sky's warm sheen on the lower face where it turns to the open light right of the curl
    const sk = nid('sk', u); defs += lin(sk, 170, 100, 120, 130, [[0, skyC, .55], [.5, skyC, .2], [1, skyC, 0]]);
    folds += `<path d="M152 80C156 96 168 106 200 116L170 130L130 128L140 100Z" fill="url(#${sk})" filter="url(#${fb})"/>`;
    inside += folds;
    // the kit's ripples on the lower face, turned with the slope under the brig, fading out up the face
    const wm = nid('wm', u), wmg = nid('wmg', u);
    defs += lin(wmg, 0, 70, 0, 150, [[0, '#fff', 0], [1, '#fff', .5]]) + `<mask id="${wm}" maskUnits="userSpaceOnUse" x="-12" y="0" width="230" height="290"><rect x="-12" y="0" width="230" height="290" fill="url(#${wmg})"/></mask>`;
    inside += `<g mask="url(#${wm})" transform="rotate(14 112 124)">${K.water(u, L, { horizon: 70, bottom: 300, swell: 1, seed: 61, glitter: false, w: 260 })}</g>`;
    // water draining down the face: long streaks of lace from under the crest, each its own length and bend
    let streaks = '';
    for (let i = 0; i < 18; i++) {
      const a0 = along(back.slice(3, 11), R()), a = [a0[0] - R() * 6, a0[1] + 5 + R() * 12], len = 10 + R() * 22, bend = 3 + R() * 7, th = .3 + R() * .5, dx = -(6 + R() * 14);
      streaks += `<path d="M${f(a[0])} ${f(a[1])}c${f(bend * .6)} ${f(len * .3)} ${f(dx * .3)} ${f(len * .75)} ${f(dx)} ${f(len)}c${f(-dx * .3 + th)} ${f(-len * .25)} ${f(-dx * .75 + bend * .6 + th * 2)} ${f(-len * .7)} ${f(-dx + th * 1.6)} ${f(-len)}z" fill="${lace}" opacity="${f(.04 + R() * .1)}"/>`;
    }
    inside += streaks;
    // the dark foot (under the glass): the wave's base in its own shadow
    const ft = nid('ft', u);
    defs += lin(ft, 0, 130, 0, 250, [[0, L.shadowTint, 0], [1, L.shadowTint, .5]]);
    inside += `<rect x="-12" y="130" width="230" height="160" fill="url(#${ft})"/>`;
    wave = `<defs>${defs}</defs>` + wave + `<g clip-path="url(#${cl})">${inside}</g>`;
    // the hot rim of the sun along the very crest (it shines through the thinnest water), dimming over the lip
    const rg = nid('rg', u), rb = nid('rb', u);
    wave += `<defs>${lin(rg, 0, 14, 184, 50, [[0, L.rimColor, .25], [.45, L.rimColor, .95], [.85, amber, .7], [1, amber, .2]])}${blur(rb, .45, [-20, 0, 220, 80])}</defs>`
      + `<path d="${sp(back)}" fill="none" stroke="url(#${rg})" stroke-width="1.2" filter="url(#${rb})"/>`;
    // foam boiling on the crest and along the falling lip
    wave += crestFoam(u, L, back.slice(4, 12).map(p => [p[0], p[1] + 1.3]), { seed: 7, h: 2.2, gap: .1 });
    wave += crestFoam(u, L, under.slice(0, 4).map(p => [p[0], p[1] - .6]), { seed: 8, h: 1.2, gap: .2 });
    // lace along the inner face where it meets the open light: it reads as water turning over, not as a rock
    wave += crestFoam(u, L, under.slice(4, 11).map(p => [p[0] - 1.2, p[1] + .4]), { seed: 18, h: .8, gap: .35 });
    // KIT-CANDIDATE spray: the mist torn off the crest by the wind, carried right and up; against the low sun it glows
    const mb = nid('mb', u), mg = nid('mg', u), mist = mix('#ffffff', L.keyColor, .4);
    let spray = `<defs>${blur(mb, 2.2, [40, -30, 190, 90])}<radialGradient id="${mg}" fx=".3" fy=".6"><stop offset="0" stop-color="${mist}" stop-opacity=".85"/><stop offset=".5" stop-color="${mix(mist, L.pal.sky[1], .4)}" stop-opacity=".35"/><stop offset="1" stop-color="${L.pal.sky[1]}" stop-opacity="0"/></radialGradient></defs><g filter="url(#${mb})">`;
    for (let i = 0; i < 11; i++) { const t = i / 10, x = lerp(66, 178, t) + R() * 6, y = yOn(back, Math.min(183, x)) - 3 - R() * 6 - t * 5, rx = 8 + R() * 11, ry = 2.6 + R() * 3;
      spray += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(-8 - R() * 12)} ${f(x)} ${f(y)})" fill="url(#${mg})" opacity="${f(.5 + R() * .4)}"/>`; }
    spray += '</g>';
    let drops = '';
    for (let i = 0; i < 26; i++) { const x = 76 + R() * 108, y = yOn(back, Math.min(183, x)) - 1 - R() * 11, l = .4 + R() * 1; drops += `<path d="M${f(x)} ${f(y)}l${f(l)} ${f(-l * .35)}" stroke="${mist}" stroke-width="${f(.3 + R() * .4)}" stroke-linecap="round" opacity="${f(.3 + R() * .4)}"/>`; }
    wave += spray + drops;
    // the lip throws down a ragged curtain: thin falling strands and drops in the open light right of the curl
    const cv = nid('cv', u), cvb = nid('cvb', u);
    let curtain = `<defs>${lin(cv, 0, 48, 0, 96, [[0, lace, .7], [.5, mix(lace, L.pal.sky[2], .3), .35], [1, L.pal.sky[2], 0]])}${blur(cvb, .9, [160, 40, 50, 70])}</defs>`
      + `<path d="M172 55C178 56 184 52 186 50C189 62 192 76 190 92C186 80 182 70 176 64C174 60 173 58 172 55Z" fill="url(#${cv})" filter="url(#${cvb})"/>`;
    for (let i = 0; i < 14; i++) { const x = 174 + R() * 14, y = 52 + R() * 6, l = 8 + R() * 26; curtain += `<path d="M${f(x)} ${f(y)}q${f(1 + R() * 2)} ${f(l * .5)} ${f(2 + R() * 3)} ${f(l)}" stroke="${lace}" stroke-width="${f(.25 + R() * .45)}" fill="none" stroke-linecap="round" opacity="${f(.2 + R() * .35)}"/>`; }
    for (let i = 0; i < 18; i++) { const x = 172 + R() * 22, y = 60 + R() * 38; curtain += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(.3 + R() * .35)}" ry="${f(.6 + R() * .6)}" fill="${lace}" opacity="${f(.3 + R() * .4)}"/>`; }
    wave += curtain;

    // ——— the brig climbing the foot: heeled -14 (bow up, left, into the wave), rolled 12 at us; reefed ———
    const x0 = 112, y0 = 124, s = .86, ang = -14, roll = 12, ra = ang * Math.PI / 180, ca = Math.cos(ra), sa = Math.sin(ra), cr = Math.cos(roll * Math.PI / 180);
    const pt = (X, H) => [x0 + s * (X * ca - H * cr * sa), y0 - s * (X * sa + H * cr * ca)];
    const wl = [pt(-400, -.2), pt(400, -.2), pt(400, 900), pt(-400, 900)].map(p => f(p[0]) + ' ' + f(p[1])).join('L');
    let brig = `<g transform="rotate(${-ang} ${x0} ${y0})">${K.contactShadow(u, x0, y0 + 1, 62, L, { ry: 2.8, opacity: .55 })}</g>`;
    // (the nose is left: the picture turns by -heel)
    // KIT-CANDIDATE heel: the kit cuts the hull at a level line y = waterline; heeled, the cut must tilt with the hull
    brig += K.ship(u, L, { kind: 'brig', x: x0, y: y0, scale: s, heel: ang, roll, sails: 'reefed', detail: 'near', lights: true, seed: 23 })
      .replace(/<path d="M[-\d.]+ ([-\d.]+)L[-\d.]+ \1" stroke="#[0-9a-f]{6}" stroke-width="[\d.]+" opacity=".45"\/>/, '')
      .replace(/(<clipPath id="khw[^"]+">)<rect x="-400" y="-900" width="1000" height="[\d.]+"\/>/, `$1<path d="M${wl}Z"/>`);
    brig += `<g transform="rotate(${-ang} ${x0} ${y0})">${K.foam(u, { x: x0 - 2, y: y0 + .4, w: 66, h: 1.5, seed: 12, L })}</g>`;
    const stem = pt(-37, 0);
    brig += K.splash(u, { x: stem[0] + 1, y: stem[1] + .8, w: 13, h: 11, seed: 3, L, wind: 1 });
    // the torn main topgallant: a sheet of canvas torn off its yard, flying out of the hollow on two sheets
    const ya = pt(13 - 7, 63), yb = pt(13 + 7, 63), sailP = [[157, 63], [167, 59], [177, 62.5], [175.5, 70], [180, 77], [169, 76], [160, 79], [162, 71]];
    const sm = K.mat('canvas', L, { form: 'fold', x1: 159, y1: 60, x2: 178, y2: 78, r: 2.6, u }), sr = L.ramp('canvas', 168, 68);
    brig += `<defs>${sm.defs}</defs><path d="M${f(ya[0])} ${f(ya[1])}Q${f((ya[0] + 157) / 2)} ${f(ya[1] - 3)} 157 63M${f(yb[0])} ${f(yb[1])}Q${f((yb[0] + 160) / 2)} ${f(yb[1] + 5)} 160 79" fill="none" stroke="${sr.outline}" stroke-width=".32" opacity=".9"/>`
      + `<path d="${sp(sailP, true)}" fill="${sm.fill}" stroke="${sr.outline}" stroke-width=".35"/>`
      + `<path d="M162 64C165 68 164 72 166 76M170 61C172 65 171 70 174 74" fill="none" stroke="${sr.core}" stroke-width=".5" opacity=".6"/>`
      + `<path d="M177 62.5l2.2 -1.4l-.6 1.8l2 .2l-1.8 1.2M180 77l2 1.2l-1.8 .3l.8 1.6" fill="none" stroke="${sr.outline}" stroke-width=".3" opacity=".8"/>`;
    // the warm rim of the hidden sun on the brig's left (the lip's glow) — a soft light on her bow and fore sails
    brig += K.localGlow(u, { x: 96, y: 70, color: '#ffc27a', power: .2, radius: 40 }, { core: false });

    // ——— under the glass: the dark trough (no debris: it showed below the glass, over the deck strip) ———
    let fg = '';
    const sTop = [[-14, 252], [10, 246], [40, 236], [80, 224], [110, 212], [132, 204], [152, 199], [172, 197.5], [192, 200], [214, 205]];
    const sD = sp(sTop) + 'L214 290L-14 290Z', sg = nid('sg', u);
    fg += `<defs>${lin(sg, 0, 196, 0, 290, [[0, mix(L.pal.sea[1], '#9fd6c8', .2)], [.2, L.pal.sea[1]], [1, L.pal.sea[2]]])}</defs><path d="${sD}" fill="url(#${sg})"/>`;
    fg += crestFoam(u, L, sTop.slice(4, 9).map(p => [p[0], p[1] + .8]), { seed: 23, h: 1.6, gap: .25 });
    return [bg + wave + brig, fg];
  },
};
