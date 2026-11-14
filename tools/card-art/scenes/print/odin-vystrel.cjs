// «Один выстрел» (Жемчужина, ЗАРЯД: +1 урон, из Плана +3 и без Реакций), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Один выстрел']): a moonlit beach, a palm leaning in from the left; on a flat rock at the
// water's edge lies a flintlock pistol (the butt on the slab, the barrel on a loose stone), loaded for one shot, its barrel toward the enemy ship that rides at anchor in
// the moon path; in front of it, on a scrap of red velvet, the one ball kept for it — the treasure, a glint on it;
// the powder horn behind. One key light: the moon (upper right, a little from the depth): a long cold glint along the
// barrel, the brass of the butt and the guard, silver edges on the rock and the fronds; the enemy's stern lanterns are
// the only warm light. Brief: docs/mockups/print/card-briefs.md «Один выстрел» (one shot, patience — a trump kept).
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, lerp, clamp, nid, linGrad, radGrad, rng } = K;

const HZ = 84, SHORE = 100;
const MOON = { x: 158, y: 40 };
// the moon in the picture; its light on the things comes from the right and a little from the depth (az 58)
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, az: 58, el: 30, color: '#cbdaf6', power: .85 }, fill: { color: '#3a5280', power: .42 },
  rim: { az: 40, color: '#d6e6ff', power: .55 }, locals: [{ x: 146, y: 82, color: '#ffc070', power: .35, radius: 10 }] };
const GUN = { x: 100, y: 110, s: 4.2, rot: 14 };                   // the butt on the rock (y ~112), the fore-end on a stone
const BALL = { x: 29, y: 114.6, r: 5.2 };
const skel = { horizon: HZ, eye: 1.2, light: 'the moon upper right (az 58): glint along the barrel, rims; warm lanterns of the enemy',
  items: [
    ['rock', 12, 152, 182, 50, 'sand (sunk in it)'],
    ['pistol', 41, 112, 120, 44, 'rock top (butt and guard), the barrel on the stone'],
    ['stone', 131, 116, 26, 10, 'rock top, under the barrel'],
    ['ball on velvet', 15, 121, 26, 15, 'rock top'],
    ['powder horn', 160, 108, 32, 10, 'rock top, behind the muzzle'],
    ['enemy ship', 135, 84.8, 31, 26, 'sea, at anchor in the moon path'],
    ['palm', -8, 170, 110, 160, 'sand, leans in from the left', { edge: 1 }],
    ['bottle', 30, 196, 20, 10, 'sand (half buried)'],
  ] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const gunP = (lx, ly) => { const a = GUN.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [GUN.x + (lx * c - ly * s) * GUN.s, GUN.y + (lx * s + ly * c) * GUN.s]; };

// the flat rock: a top face catching the moon, a front face in shade sunk in the sand, cracks with lit lips
const TOP = [[12, 113], [17, 108.4], [34, 105.6], [52, 104.8], [70, 102.6], [96, 103.4], [122, 101.8], [150, 103.2], [170, 103.6], [184, 106.2], [193, 109.4], [194, 113.4], [184, 118], [160, 120.4], [134, 122.2], [100, 121.6], [76, 123], [50, 121.4], [26, 120]];
const FRONT = [[12, 113], [26, 120], [50, 121.4], [76, 123], [100, 121.6], [134, 122.2], [160, 120.4], [184, 118], [194, 113.4], [197, 124], [192, 140], [178, 152], [120, 158], [60, 156], [20, 150], [6, 136], [8, 120]];
function sp(P, closed) {
  const n = P.length, g = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  let d = `M${P2(P[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${P2(p2)}`; }
  return d + (closed ? 'Z' : '');
}
function rock(u, L) {
  const tg = nid('rt', u), fg = nid('rf', u), tc = nid('rtc', u), fc = nid('rfc', u), R = rng(12);
  const top = sp(TOP, true), front = sp(FRONT, true);
  const lit = mix('#6e747c', L.keyColor, .22), half = '#454a52', dark = '#262a32', deep = '#14181f';
  let s = `<defs>${linGrad(tg, 190, 104, 20, 122, [[0, lit], [.45, mix(lit, half, .55)], [1, half]])}${linGrad(fg, 0, 114, 0, 158, [[0, mix(half, dark, .5)], [.35, dark], [1, deep]])}`
    + `<clipPath id="${tc}"><path d="${top}"/></clipPath><clipPath id="${fc}"><path d="${front}"/></clipPath></defs>`;
  s += `<path d="${front}" fill="url(#${fg})"/>`;
  s += `<g clip-path="url(#${fc})">`;
  // the front: strata and vertical joints, barnacle grit low down, a wet dark band where the surf reaches
  for (const [y0, k] of [[128, .5], [138, .4], [147, .3]]) s += `<path d="M0 ${y0}Q60 ${y0 + 3} 110 ${y0 + 1}T200 ${y0 - 2}" stroke="#0e1218" stroke-width="${k + .3}" fill="none" opacity=".7"/><path d="M0 ${y0 - .8}Q60 ${y0 + 2.2} 110 ${y0 + .2}T200 ${y0 - 2.8}" stroke="${mix(half, L.keyColor, .3)}" stroke-width=".35" fill="none" opacity=".35"/>`;
  for (const x of [44, 92, 136, 172]) s += `<path d="M${x} 121q-2 10 1 18t-1 16" stroke="#0e1218" stroke-width=".7" fill="none" opacity=".75"/><path d="M${x + .8} 121.5q-2 10 1 18" stroke="${mix(half, L.keyColor, .35)}" stroke-width=".35" fill="none" opacity=".4"/>`;
  for (let i = 0; i < 90; i++) { const x = 8 + R() * 186, y = 140 + R() * 18; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.25 + R() * .5)}" fill="${R() > .5 ? '#a8aeb4' : '#0c1016'}" opacity="${f(.25 + R() * .35)}"/>`; }
  s += '</g>';
  s += `<path d="${top}" fill="url(#${tg})"/>`;
  s += `<g clip-path="url(#${tc})">`;
  // the top: weathered pits, a crack across, lichen, the moon's sheen on the far right
  for (let i = 0; i < 70; i++) { const x = 14 + R() * 178, y = 103 + R() * 19, r = .3 + R() * 1.1; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .45)}" fill="${R() > .35 ? '#3a3e46' : mix(lit, '#ffffff', .2)}" opacity="${f(.2 + R() * .3)}"/>`; }
  s += `<path d="M64 103.4q4 5 -2 9t2 10" stroke="#20242c" stroke-width=".8" fill="none"/><path d="M64.8 103.6q4 5 -2 9t2 10" stroke="${mix(lit, '#ffffff', .3)}" stroke-width=".35" fill="none" opacity=".5"/>`;
  s += `<path d="M140 103q-3 6 3 10q4 3 1 8" stroke="#20242c" stroke-width=".7" fill="none"/><path d="M140.8 103.2q-3 6 3 10" stroke="${mix(lit, '#ffffff', .3)}" stroke-width=".3" fill="none" opacity=".45"/>`;
  for (const [x, y, w] of [[34, 108, 7], [176, 112, 6], [122, 119, 5], [18, 116, 4]]) s += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f(w * .32)}" fill="#7a8a5a" opacity=".22"/>`;
  { const g = nid('rs', u); s += `<defs>${radGrad(g, 176, 106, 34, [[0, mix(L.keyColor, '#ffffff', .3), .22], [1, L.keyColor, 0]])}</defs><ellipse cx="176" cy="107" rx="34" ry="8" fill="url(#${g})"/>`; }
  s += '</g>';
  // the edge between top and front catches the moon on the right, goes dull to the left
  { const g = nid('re', u); s += `<defs>${linGrad(g, 194, 0, 12, 0, [[0, mix(L.keyColor, '#ffffff', .4), .9], [.5, L.keyColor, .45], [1, L.keyColor, .15]])}</defs><path d="${sp(TOP.slice(10).concat([TOP[0]]))}" stroke="url(#${g})" stroke-width=".7" fill="none"/>`; }
  s += `<path d="${sp(TOP.slice(0, 11))}" stroke="${mix(L.keyColor, '#ffffff', .25)}" stroke-width=".45" fill="none" opacity=".5"/>`;
  return s;
}

// the palm: a ringed trunk leaning in from the bottom left, the crown against the stars, fronds of leaflets
function palm(u, L) {
  const B = [[-10, 176], [6, 120], [30, 74], [60, 44]], at = t => { const m = 1 - t; return [0, 1].map(j => m * m * m * B[0][j] + 3 * m * m * t * B[1][j] + 3 * m * t * t * B[2][j] + t * t * t * B[3][j]); };
  const tan = t => { const a = at(Math.max(0, t - .01)), b = at(Math.min(1, t + .01)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const W = t => lerp(10, 5.2, t), N = 40, left = [], right = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = at(t), d = tan(t), n = [-d[1], d[0]]; left.push([p[0] + n[0] * W(t) / 2, p[1] + n[1] * W(t) / 2]); right.push([p[0] - n[0] * W(t) / 2, p[1] - n[1] * W(t) / 2]); }
  const tr = nid('pt', u), cid = nid('pc', u), out = `M${left.map(P2).join('L')}L${right.slice().reverse().map(P2).join('L')}Z`;
  // the moon is to the right: the trunk's right (upper) side lit, the left in shade
  const a0 = at(.5), d0 = tan(.5), n0 = [-d0[1], d0[0]];
  let s = `<defs>${linGrad(tr, a0[0] + n0[0] * 6, a0[1] + n0[1] * 6, a0[0] - n0[0] * 6, a0[1] - n0[1] * 6, [[0, '#1c1814'], [.5, '#3a3228'], [.85, '#6a6458'], [1, '#9aa0a8']])}<clipPath id="${cid}"><path d="${out}"/></clipPath></defs>`;
  s += `<path d="${out}" fill="url(#${tr})"/><g clip-path="url(#${cid})">`;
  for (let i = 1; i < 34; i++) { const t = i / 34, p = at(t), d = tan(t), n = [-d[1], d[0]], w = W(t) / 2 + .5, a = [p[0] + n[0] * w, p[1] + n[1] * w], b = [p[0] - n[0] * w, p[1] - n[1] * w], m = [p[0] + d[0] * 1.4, p[1] + d[1] * 1.4];
    s += `<path d="M${P2(a)}Q${P2(m)} ${P2(b)}" stroke="#14100c" stroke-width=".7" fill="none" opacity=".8"/><path d="M${P2([a[0] + d[0] * .7, a[1] + d[1] * .7])}Q${P2([m[0] + d[0] * .7, m[1] + d[1] * .7])} ${P2([b[0] + d[0] * .7, b[1] + d[1] * .7])}" stroke="#8a8a84" stroke-width=".35" fill="none" opacity=".35"/>`; }
  s += `</g><path d="M${right.map(P2).join('L')}" stroke="#b8c8e0" stroke-width=".5" fill="none" opacity=".55"/>`;
  // the fronds: a midrib arching out and drooping, leaflets on both sides combed toward the tip
  const C = B[3], R = rng(5);
  const frond = (ang, l, droop, back) => {
    const a = ang * Math.PI / 180, tip = [C[0] + Math.cos(a) * l, C[1] + Math.sin(a) * l + droop], mid = [C[0] + Math.cos(a) * l * .55, C[1] + Math.sin(a) * l * .55 - l * .16];
    const q = t => [(1 - t) * (1 - t) * C[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0], (1 - t) * (1 - t) * C[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1]];
    const col = back ? '#0e1a16' : '#16261e', litC = back ? '#5a7a80' : '#9ab8c8';
    let r = '';
    for (let i = 2; i < 22; i++) {
      const t = i / 22, p = q(t), p2 = q(Math.min(1, t + .02)), d = [p2[0] - p[0], p2[1] - p[1]], dl = Math.hypot(d[0], d[1]) || 1, ux = d[0] / dl, uy = d[1] / dl, ll = (1 - t * .7) * l * .26 + 1.2;
      for (const sd of [-1, 1]) {
        const nx = -uy * sd, ny = ux * sd, hang = .55 + .35 * t, e = [p[0] + (ux * .55 + nx * .8) * ll, p[1] + (uy * .55 + ny * .8) * ll + hang * ll * .55], m = [p[0] + (ux * .2 + nx * .6) * ll, p[1] + (uy * .2 + ny * .6) * ll];
        r += `<path d="M${P2(p)}Q${P2(m)} ${P2(e)}" stroke="${col}" stroke-width="${f(1.25 - t * .5)}" fill="none" stroke-linecap="round"/>`;
        if (sd === (Math.cos(a) > 0 ? -1 : 1) || R() > .6) r += `<path d="M${P2(p)}Q${P2(m)} ${P2(e)}" stroke="${litC}" stroke-width=".3" fill="none" opacity="${f(.35 + R() * .3)}" stroke-linecap="round" transform="translate(.35 -.35)"/>`;
      }
    }
    r += `<path d="M${P2(C)}Q${P2(mid)} ${P2(tip)}" stroke="#2a2a20" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M${P2(C)}Q${P2(mid)} ${P2(tip)}" stroke="${litC}" stroke-width=".35" fill="none" opacity=".6" transform="translate(.3 -.4)"/>`;
    return r;
  };
  let back = '', fr = '';
  for (const [a, l, d] of [[-150, 30, 10], [-112, 26, 4], [-62, 30, 8], [-18, 32, 14]]) back += frond(a, l, d, true);
  for (const [a, l, d] of [[-176, 34, 18], [-128, 30, 10], [-88, 26, 4], [-38, 34, 12], [6, 36, 22], [150, 26, 22], [40, 26, 20]]) fr += frond(a, l, d, false);
  s += back;
  for (const [dx, dy] of [[-2.4, 2.2], [1.6, 2.8], [-.2, 4]]) s += K.shadeSphere(u, C[0] + dx, C[1] + dy, 2.1, L, 'leather', { outline: .3 });
  s += fr;
  return s;
}

// the ball on its scrap of red velvet: a lead sphere with the moon in it and a small star of a glint
function ballOnVelvet(u, L) {
  const v = [[15, 116], [36, 111.6], [42, 119.2], [20, 121.2]], vid = nid('vv', u), R = rng(8);
  let s = `<defs>${linGrad(vid, 42, 111, 15, 121, [[0, '#c0404a'], [.4, '#7a1a24'], [1, '#3a0a12']])}</defs>`;
  s += K.contactShadow(u, 28.5, 120, 30, L, { ry: 1.6, opacity: .6 });
  s += `<path d="M${P2(v[0])}Q25 112.6 ${P2(v[1])}Q40 115 ${P2(v[2])}Q30 121.8 ${P2(v[3])}Q16.6 118.6 ${P2(v[0])}Z" fill="url(#${vid})" stroke="#1e0408" stroke-width=".4"/>`;
  // the velvet's nap: soft folds, a frayed edge, the moon on the raised fold
  s += `<path d="M20 119q8 -3 18 -4" stroke="#e0707a" stroke-width=".6" fill="none" opacity=".45"/><path d="M18 117q9 -2 16 -4" stroke="#2a060c" stroke-width=".5" fill="none" opacity=".6"/>`;
  for (let i = 0; i < 12; i++) { const t = i / 11, x = lerp(20.4, 42, t), y = lerp(121.2, 119.2, t); s += `<path d="M${f(x)} ${f(y)}l${f(-.2 + R() * .4)} ${f(.6 + R() * .6)}" stroke="#8a2a34" stroke-width=".3"/>`; }
  s += K.contactShadow(u, BALL.x, BALL.y, BALL.r * 2, L, { ry: 1, opacity: .85 });
  s += K.shadeSphere(u, BALL.x, BALL.y - BALL.r, BALL.r, L, 'iron', { outline: .35 });
  // the casting sprue's tiny flat, the star of the glint
  { const g = [BALL.x + BALL.r * .42, BALL.y - BALL.r * 1.42];
    s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r=".9" fill="#ffffff" opacity=".95"/><path d="M${f(g[0] - 4.2)} ${f(g[1])}H${f(g[0] + 4.2)}M${f(g[0])} ${f(g[1] - 4.2)}V${f(g[1] + 4.2)}" stroke="#ffffff" stroke-width=".35" opacity=".85" stroke-linecap="round"/>`
      + `<path d="M${f(g[0] - 1.8)} ${f(g[1] - 1.8)}L${f(g[0] + 1.8)} ${f(g[1] + 1.8)}M${f(g[0] - 1.8)} ${f(g[1] + 1.8)}L${f(g[0] + 1.8)} ${f(g[1] - 1.8)}" stroke="#ffffff" stroke-width=".25" opacity=".6" stroke-linecap="round"/>`
      + K.localGlow(u, { x: g[0], y: g[1], color: '#dfeaff', power: .5, radius: 7 }); }
  return s;
}

// a loose stone on the slab under the barrel: lit on the right (the moon), the barrel lies on its top
function stone(u, L) {
  const pts = [[131, 111.4], [133.6, 108.4], [139, 106.75], [145, 107.9], [150.5, 109.9], [155.4, 111.2], [157.2, 113.4], [154, 115.6], [144, 116.4], [135, 115.4]];
  const g = nid('st', u), cid = nid('stc', u), R = rng(19), lit = mix('#7a8088', L.keyColor, .28), half = '#4a4f58', dark = '#22262e', d = sp(pts, true);
  let s = K.contactShadow(u, 145, 116, 30, L, { ry: 1.6, opacity: .8 });
  s += `<defs>${linGrad(g, 157, 107, 133, 116, [[0, lit], [.4, mix(lit, half, .6)], [1, dark]])}<clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${g})"/>`;
  s += `<g clip-path="url(#${cid})"><path d="M131 112.6Q144 112 158 111.6" stroke="#181c22" stroke-width=".6" fill="none" opacity=".6"/>`;
  for (let i = 0; i < 22; i++) { const x = 133 + R() * 23, y = 107 + R() * 9, r = .25 + R() * .6; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .5)}" fill="${R() > .4 ? '#2a2e36' : mix(lit, '#ffffff', .25)}" opacity="${f(.25 + R() * .3)}"/>`; }
  s += `</g><path d="${d}" fill="none" stroke="#14181f" stroke-width=".45"/><path d="${sp(pts.slice(2, 7))}" stroke="${mix(L.keyColor, '#ffffff', .4)}" stroke-width=".55" fill="none" opacity=".75"/>`;
  return s;
}
// the shadows the pistol leaves where it touches (under it): a dark line under the fore-end on the stone, a pool under the guard
function gunShadows(u, L) {
  let s = '';
  { const a = gunP(6.4, -2.75), b = gunP(12.6, -2.75), id = nid('gs', u); s += `<defs><filter id="${id}" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation=".7"/></filter></defs><path d="M${P2(a)}L${P2(b)}" stroke="#05070c" stroke-width="2.2" stroke-linecap="round" opacity=".75" filter="url(#${id})"/>`; }
  { const g = gunP(-4.2, 1.6); s += K.contactShadow(u, g[0] + .6, g[1] + .9, 13, L, { ry: 1.4, opacity: .85 }); }
  { const g = gunP(-12.3, 4.1); s += K.contactShadow(u, g[0] + .8, g[1] + .2, 12, L, { ry: 1.3, opacity: .85 }); }
  return s;
}
// over the kit pistol: a round muzzle (a turned ring, the dark bore) and a flint cock — the jaws, the flint, the screw
function gunDetail(u, L) {
  const rI = L.ramp('iron', ...gunP(0, -6)), Q = pts => pts.map(p => P2(gunP(p[0], p[1]))).join('L');
  let s = K.shadeCyl(u, ...gunP(12.5, -5.9), ...gunP(13.5, -5.9), 1.12 * GUN.s, L, 'iron', { outline: .35 });
  { const m = gunP(13.55, -5.9), r = 1.1 * GUN.s;
    s += `<g transform="rotate(${GUN.rot} ${f(m[0])} ${f(m[1])})"><ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(r * .5)}" ry="${f(r)}" fill="${rI.half}" stroke="${rI.outline}" stroke-width=".4"/>`
      + `<path d="M${f(m[0])} ${f(m[1] - r)}A${f(r * .5)} ${f(r)} 0 0 1 ${f(m[0] + r * .48)} ${f(m[1] + r * .2)}" stroke="${mix(L.keyColor, '#ffffff', .5)}" stroke-width=".6" fill="none" opacity=".85"/>`
      + `<ellipse cx="${f(m[0] + .25)}" cy="${f(m[1] + .2)}" rx="${f(r * .27)}" ry="${f(r * .55)}" fill="#030409"/></g>`; }
  // the cock: a swan neck from the tumbler up to the lower jaw, the flint in its leather between the jaws, the jaw screw
  s += `<path d="M${Q([[-6.1, -4.1], [-6.9, -5.5], [-6.7, -6.9], [-6.1, -7.6], [-5.0, -7.4], [-5.5, -6.7], [-5.6, -5.6], [-4.8, -4.3]])}Z" fill="${rI.half}" stroke="${rI.outline}" stroke-width=".4" stroke-linejoin="round"/>`;
  s += `<path d="M${Q([[-6.6, -6.6], [-6.4, -7.3]])}" stroke="${mix(L.keyColor, '#ffffff', .4)}" stroke-width=".45" opacity=".7"/>`;
  s += `<path d="M${Q([[-6.3, -7.75], [-3.1, -7.75], [-3.0, -7.15], [-6.2, -7.15]])}Z" fill="${rI.core}" stroke="${rI.outline}" stroke-width=".35"/>`;
  s += `<path d="M${Q([[-4.4, -8.45], [-3.9, -8.5], [-1.9, -8.25], [-2.3, -7.8], [-4.4, -7.8]])}Z" fill="#6a5a40" stroke="${rI.outline}" stroke-width=".3"/><path d="M${Q([[-3.7, -8.4], [-2.0, -8.2]])}" stroke="#e8dcc0" stroke-width=".3" opacity=".7"/>`;
  s += `<path d="M${Q([[-5.7, -9.1], [-3.3, -9.1], [-3.2, -8.5], [-5.6, -8.5]])}Z" fill="${rI.half}" stroke="${rI.outline}" stroke-width=".35"/>`;
  s += K.shadeCyl(u, ...gunP(-4.5, -7.2), ...gunP(-4.5, -10.0), .26 * GUN.s, L, 'iron', { outline: .25 });
  { const h = gunP(-4.5, -10.15); s += `<ellipse cx="${f(h[0])}" cy="${f(h[1])}" rx="${f(.55 * GUN.s)}" ry="${f(.2 * GUN.s)}" transform="rotate(${GUN.rot} ${f(h[0])} ${f(h[1])})" fill="${rI.lit}" stroke="${rI.outline}" stroke-width=".3"/><path d="M${Q([[-4.9, -10.15], [-4.1, -10.15]])}" stroke="${rI.outline}" stroke-width=".3"/>`; }
  return s;
}

// the powder horn: a curved cow horn, a turned brass cap on the wide end, a stopper at the tip, a leather strap
function horn(u, L) {
  const A = [192, 110.4], Bt = [166, 107.4], n = 18, pts = [], bot = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(A[0], Bt[0], t), y = lerp(A[1], Bt[1], t) - Math.sin(t * Math.PI) * 3.2, r = lerp(4.2, 1.1, Math.pow(t, .8)); pts.push([x, y - r]); bot.push([x, y + r]); }
  const g = K.mat('bone', L, { form: 'cyl', x1: A[0], y1: A[1] - 2, x2: Bt[0], y2: Bt[1] - 2, r: 4.2, u });
  let s = K.castShadow(u, L, { x: 179, y: 113.4, w: 26, h: 7, horizon: HZ, d: .3 }) + K.contactShadow(u, 180, 113.4, 26, L, { opacity: .7 });
  s += `<defs>${g.defs}</defs><path d="M${pts.map(P2).join('L')}L${bot.slice().reverse().map(P2).join('L')}Z" fill="${g.fill}" stroke="${g.ramp.outline}" stroke-width=".35"/>`;
  // the horn's growth rings and its dark tip, the cold sheen along the top
  for (let i = 3; i < n - 2; i += 2) { const a = pts[i], b = bot[i]; s += `<path d="M${P2(a)}Q${f(a[0] + .8)} ${f((a[1] + b[1]) / 2)} ${P2(b)}" stroke="${g.ramp.shadow}" stroke-width=".25" fill="none" opacity=".55"/>`; }
  s += `<path d="M${pts.slice(1, n - 1).map(p => P2([p[0], p[1] + .8])).join('L')}" stroke="${mix(L.keyColor, '#ffffff', .5)}" stroke-width=".45" fill="none" opacity=".7"/>`;
  s += K.shadeCyl(u, A[0] + 1.6, A[1], A[0] - .6, A[1] - .2, 4.6, L, 'brass', { ell: .5, face: 1, outline: .3 });
  s += K.shadeCyl(u, Bt[0] + 1.2, Bt[1] - 3.2 + .2, Bt[0] - 2.4, Bt[1] - 3.4, .9, L, 'brass', { outline: .25 });
  s += K.shadeCyl(u, Bt[0] - 2.2, Bt[1] - 3.4, Bt[0] - 3.8, Bt[1] - 3.5, .7, L, 'oak', { outline: .25, cap: 'round' });
  // the strap: from the cap over the rock, a loop lying behind
  s += K.propTube(u, L, 'leather', `M${f(A[0] - 1)} ${f(A[1] + 3)}C${f(A[0] - 10)} ${f(A[1] + 6)} 170 117 162 116C156 115.4 158 110 ${f(Bt[0] + 1)} ${f(Bt[1] - 1.4)}`, .55, [172, 116]);
  return s;
}

module.exports = { name: 'Один выстрел', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 });
    // the night: stars, the moon upper right, thin clouds lit at the edges
    let bg = K.sky(u, L, { horizon: HZ, stars: 110, seed: 21 }) + K.sunMoon(u, L, { r: 7.2 });
    for (const [x, y, w, h, sd, fr] of [[118, 26, 64, 7, 3, .25], [186, 64, 36, 5, 8, .45], [70, 76, 44, 4, 12, .65], [150, 78, 30, 3, 15, .75]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    // the sea to the shore: the moon path, a low headland far right, the enemy at anchor in the path
    bg += K.water(u, L, { horizon: HZ, bottom: SHORE + 6, swell: .45, seed: 21, glitter: MOON.x });
    bg += `<path d="M168 ${HZ + .4}Q174 ${HZ - 4} 182 ${HZ - 5}Q192 ${HZ - 7.4} 200 ${HZ - 6}V${HZ + .4}Z" fill="${mix(L.pal.sky[3], '#0a1220', .55)}"/>`;
    bg += `<g data-far="">${K.ship(u, L, { kind: 'endeavour', x: 150, y: HZ + .9, scale: .3, detail: 'far', sails: 'furled', lights: true, heel: .6, roll: -4, flip: true, seed: 2 })}</g>`;
    bg += K.localGlow(u, { x: 140.8, y: HZ - 2, color: '#ffc070', power: .45, radius: 6 });
    // the surf: two lines of foam running up the sand, the wet sand mirroring the moon
    const shore = x => SHORE + 1.4 * Math.sin(x / 23) + .8 * Math.sin(x / 9 + 1);
    { const sg = nid('sd', u), wg = nid('ws', u), pts = []; for (let x = -4; x <= 204; x += 4) pts.push([x, shore(x)]);
      bg += `<defs>${linGrad(sg, 0, SHORE, 0, 280, [[0, '#4a4c50'], [.08, '#6a6252'], [.4, '#4a4232'], [1, '#1a160e']])}${linGrad(wg, 0, SHORE, 0, SHORE + 9, [[0, '#2a3a50', .9], [1, '#2a3a50', 0]])}</defs>`
        + `<path d="M${pts.map(P2).join('L')}L204 290L-4 290Z" fill="url(#${sg})"/><path d="M${pts.map(P2).join('L')}L204 ${SHORE + 10}L-4 ${SHORE + 10}Z" fill="url(#${wg})"/>`;
      // the moon in the wet sand: a broken vertical streak under it
      const R = rng(4); for (let i = 0; i < 14; i++) { const y = SHORE + 1 + i * .8, w = 6 - i * .35 + R() * 3; bg += `<path d="M${f(MOON.x - w / 2 + (R() - .5) * 2)} ${f(y)}h${f(w)}" stroke="#dfe8ff" stroke-width=".45" opacity="${f(.55 - i * .035)}"/>`; }
      for (const [x, w, sd, dy] of [[30, 60, 31, 0], [110, 70, 32, -.3], [180, 50, 33, .2]]) bg += K.foam(u, { x, y: shore(x) + dy, w, h: 1.3, L, seed: sd });
      for (const [x, w, sd] of [[60, 50, 34], [150, 60, 35]]) bg += K.foam(u, { x, y: shore(x) - 3.6, w, h: .8, L, seed: sd });
      // the sand: footprints from the water up to the rock, shells, a half-buried bottle (under the glass)
      for (let i = 0; i < 9; i++) { const t = i / 8, x = 196 - t * 34 + (i % 2) * 4, y = 162 + t * -6 + i * 12, r = 1.6 + i * .25; bg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .5)}" fill="#14100a" opacity=".45"/><path d="M${f(x - r)} ${f(y - r * .2)}q${f(r)} ${f(-r * .5)} ${f(2 * r)} 0" stroke="#8a826e" stroke-width=".3" fill="none" opacity=".5"/>`; }
      for (const [x, y] of [[88, 176], [140, 198], [64, 214]]) bg += `<path d="M${x - 3} ${y}q3 -4.6 6 0z" fill="#cfc4aa" stroke="#4a4030" stroke-width=".3"/><path d="M${x} ${y}v-3M${x - 1.6} ${y}l.8 -2.6M${x + 1.6} ${y}l-.8 -2.6" stroke="#7a6e58" stroke-width=".25"/>`;
      bg += K.bottle(u, L, { x: 36, y: 200, s: 1.2, kind: 'empty', lying: true, rot: -18, seed: 3 }) + `<path d="M22 204q12 -6 24 -6q10 0 16 5q-12 4 -24 4q-10 0 -16 -3z" fill="#3a3426"/>`; }
    // the palm leaning in from the left, over the sand and the sea
    bg += palm(u, L);
    // the rock, the shadows on its top, the things on it
    let fg = rock(u, L);
    fg += K.castShadow(u, L, { x: 104, y: 113.4, w: 112, h: 7, horizon: HZ, d: .18, opacity: .7 });
    fg += horn(u, L);
    fg += stone(u, L) + gunShadows(u, L);
    fg += K.pistol(u, L, { x: GUN.x, y: GUN.y, s: GUN.s, rot: GUN.rot, seed: 4 });
    // the moon along the barrel: one long cold glint, brighter toward the muzzle; on the brass bands, the cock, the butt
    { const a = gunP(-4, -6.95), b = gunP(13.2, -6.7), g = nid('gl', u);
      fg += `<defs>${linGrad(g, a[0], a[1], b[0], b[1], [[0, '#dfeaff', .1], [.55, '#eef4ff', .75], [.9, '#ffffff', .95], [1, '#ffffff', .4]])}</defs><path d="M${P2(a)}L${P2(b)}" stroke="url(#${g})" stroke-width="1.5" stroke-linecap="round"/>`;
      { const a2 = gunP(-3, -5.1), b2 = gunP(12.6, -5.0); fg += `<path d="M${P2(a2)}L${P2(b2)}" stroke="#8aa0c0" stroke-width=".5" opacity=".45" stroke-linecap="round"/>`; }
      for (const [x, y, r] of [[-12.0, 1.7, 1.6], [-4.8, -8.6, .9], [8.1, -6.9, .8], [12.1, -6.9, .8]]) { const p = gunP(x, y); fg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="#ffffff" opacity=".8"/>` + K.localGlow(u, { x: p[0], y: p[1], color: '#dfeaff', power: .3, radius: r * 4 }); } }
    // a fine engraving on the lock plate and the stock's grain, the touch of wear on the brass
    { const p = gunP(-5.6, -4.2), q = gunP(-.8, -4.2); fg += `<path d="M${P2(p)}Q${P2(gunP(-3.2, -3.4))} ${P2(q)}" stroke="#c8d4e4" stroke-width=".3" fill="none" opacity=".55"/>`;
      for (const k of [-1.2, .2, 1.6]) { const a = gunP(-11, k + .4), b = gunP(-6, k - 1.6), c = gunP(4, -3.6 + k * .2); fg += `<path d="M${P2(a)}Q${P2(b)} ${P2(c)}" stroke="#2a1608" stroke-width=".3" fill="none" opacity=".45"/>`; } }
    fg += gunDetail(u, L);
    fg += ballOnVelvet(u, L);
    // the night over the near sand, a cold breath of the moon on the rock's right
    fg += K.localGlow(u, { x: 178, y: 108, color: '#cbdaf6', power: .22, radius: 40 }, { squash: .4, core: false });
    { const g = nid('ng', u); fg += `<defs>${linGrad(g, 0, 150, 0, 280, [[0, '#04060c', 0], [1, '#04060c', .55]])}</defs><rect x="0" y="150" width="200" height="132" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
