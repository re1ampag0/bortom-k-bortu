// «Сырой порох» (Колода моря): a sea came over the bulwark at night and fell on the powder kegs on the hatch: the
// right keg has lost its head and black wet powder runs down its staves, the left one is dry under tarred canvas.
// Breakdown: docs/tasks/print-kit-cards.md «Сырой порох».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, scale, clamp, lerp, rng, nid, linGrad, radGrad } = K;

// One lantern hangs over the kegs (a point light): the dry canvas warm and matt, the wet keg glossy; the shadows on
// the hatch fan out from the point under the lamp. A cold rim from the right on the sheet of water (kit az: where
// the light comes FROM, 90 — from the right; the brief's 250 is written «where it flies»): the night sky behind it.
const light = { time: 'night', key: { type: 'point', x: 106, y: 40, h: 1.5, color: '#ffb24a', power: 1, radius: 120 },
  fill: { color: '#1f3550', power: .4 }, rim: { az: 70, color: '#cfe6ff', power: .5 }, haze: .25 };
// The glass of this card starts at y 133 and the rule «the point above y 126» is above the breakdown's numbers: the
// eye stays low (0.5 m) but the camera looks a little down, so the hidden horizon drops from y 122 to y 92 and the
// kegs (66 u = 0.4 m at 2.2 m) stand at y 122 instead of 151. The bulwark (1.1 m, 6 m off) still hides the horizon.
const HZ = 92, EYE = .5;
const skel = { horizon: HZ, eye: EYE, light: 'lantern over the kegs at x 106, y 40 (1.5 m); shadows fan out from the point under it on the hatch; cold rim on the sheet of water from the right',
  items: [
    ['bulwark', 0, 119, 200, 59, 'stands on the deck 6 m off, foot y 119, rail y 60; hides the horizon y 92'],
    ['hatch', 28, 174, 160, 60, 'on the deck 1.9 m off, front edge y 124–174, top to y 114'],
    ['keg-canvas', 49, 122, 50, 64, 'stands on the hatch top'],
    ['keg-wet', 117, 122, 46, 64, 'stands on the hatch top, head knocked off'],
    ['head', 164, 124, 16, 34, 'the knocked-off head leans on the wet keg, on the hatch top'],
    ['lantern', 96, 50, 22, 32, 'hangs on a rope from the hook under the boom, swung 12°'],
    ['boom', 0, 14, 150, 10, 'spar across the top, its mast off the frame to the left'],
    ['sea', 120, 86, 80, 46, 'a sheet of water flying over the rail from the right'],
    ['keg-lying', 14, 246, 58, 38, 'lies on its side on the deck on chocks'],
    ['coil', 136, 266, 50, 14, 'lies on the deck'],
  ] };

// a smooth closed (or open) path through points (Catmull-Rom)
function smooth(pts, closed = true) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// ——— KIT-CANDIDATE: a hatch (a low wooden box with a coaming and a planked cover) seen from a low eye ———
function hatch(u, L, o) {
  const { x1, x2, y, h, back } = o, vx = 100, top = y - h, k = (back - HZ) / (top - HZ), bx = t => vx + (t - vx) * k;
  const faces = [
    { pts: [[x1, top], [x2, top], [bx(x2), back], [bx(x1), back]], n: 'top', grain: [1, 0] },
    { pts: [[x1, top], [x2, top], [x2, y], [x1, y]], n: 'front', grain: [1, 0] },
  ];
  let out = K.shadeBox(u, faces, L, 'oak', { seed: 61, outline: .55 });
  // the cover's planks on the top face run into the depth
  const rp = L.ramp('oak', 100, top);
  for (let i = 1; i < 7; i++) { const t = (i + (i % 2 ? .08 : -.06)) / 7, xa = lerp(x1, x2, t), xb = bx(xa); out += `<path d="M${f(xa)} ${f(top)}L${f(xb)} ${f(back)}" stroke="${rp.outline}" stroke-width=".45" opacity=".6"/>`; }
  // the coaming: a thick board round the cover, its front edge catching the lamp
  out += K.shadeBox(u, [{ pts: [[x1 - 2, top - 1.4], [x2 + 2, top - 1.4], [x2 + 2, top + 5], [x1 - 2, top + 5]], n: [0, .35, .94], grain: [1, 0] }], L, 'oak', { seed: 63, outline: .5 });
  // the boards of the front face, each its own width, with nail heads at the ends and the posts
  const R = rng(65); let yy = top + 5;
  while (yy < y - 9) { yy = Math.min(y - 3, yy + 11 + R() * 7);
    out += `<path d="M${f(x1)} ${f(yy)}H${f(x2)}" stroke="${rp.outline}" stroke-width=".6" opacity=".7"/><path d="M${f(x1)} ${f(yy + .7)}H${f(x2)}" stroke="${rp.lit}" stroke-width=".35" opacity=".25"/>`;
    for (const nx of [x1 + 3.5, x1 + (x2 - x1) * (.3 + R() * .1), x1 + (x2 - x1) * (.62 + R() * .1), x2 - 3.5]) out += `<circle cx="${f(nx)}" cy="${f(yy - 2.6)}" r=".55" fill="${rp.outline}" opacity=".7"/>`; }
  // iron corner straps at the front corners
  for (const cx of [x1 - 1, x2 - 6]) out += K.shadeBox(u, [{ pts: [[cx, top + 5], [cx + 7, top + 5], [cx + 7, y - 1], [cx, y - 1]], n: 'front' }], L, 'iron', { seed: 66 + cx, outline: .4 });
  return out;
}

// ——— KIT-CANDIDATE: tarred canvas thrown over a standing keg and lashed round its belly: it follows the keg's
// form (the chime makes shoulders, the belly bulges), lies in soft folds from the shoulders and pinched at the
// lashing, and spreads on the hatch at the hem ———
function tarp(u, L, o) {
  const { x, y, w, h } = o, R = rng(o.seed || 5), la = L.at(x, y - h / 2), sg = la.ux >= 0 ? 1 : -1;
  const pts = [[x - w * .63, y + 1.6], [x - w * .57, y - h * .12], [x - w * .55, y - h * .46], [x - w * .51, y - h * .8], [x - w * .45, y - h * .94], [x - w * .26, y - h * 1.02], [x, y - h * 1.04], [x + w * .26, y - h * 1.02], [x + w * .45, y - h * .95], [x + w * .51, y - h * .8], [x + w * .55, y - h * .46], [x + w * .57, y - h * .12], [x + w * .65, y + 1.3], [x + w * .34, y + 3.1], [x, y + 2.3], [x - w * .34, y + 3.3]];
  const d = smooth(pts), id = nid('tp', u), cid = nid('tc', u), sh = nid('ts', u), tg = nid('tt', u);
  // tarred canvas: canvas tones darkened with tar, warm on the lamp's side, dull, no highlight
  const T = I => mix(L.tone('canvas', I, x, y - h / 2), L.tone('tar', I, x, y - h / 2), .5);
  let defs = linGrad(id, x + sg * w * .56, y - h * .6, x - sg * w * .56, y - h * .45, [[0, T(.9)], [.22, T(.6)], [.5, T(.05)], [.62, T(-.25)], [.85, T(-.6)], [1, T(-.35)]])
    + `<clipPath id="${cid}"><path d="${d}"/></clipPath>` + linGrad(sh, x, y - h * .5, x, y + 3, [[0, L.shadowTint, 0], [.75, L.shadowTint, .12], [1, L.shadowTint, .5]])
    + radGrad(tg, x + sg * w * .14, y - h * .98, w * .46, [[0, T(1), .75], [.5, T(.8), .3], [1, T(.6), 0]]);
  let inn = `<rect x="${f(x - w)}" y="${f(y - h * 1.1)}" width="${f(w * 2)}" height="${f(h * 1.2)}" fill="url(#${sh})"/><ellipse cx="${f(x + sg * w * .14)}" cy="${f(y - h * .98)}" rx="${f(w * .46)}" ry="${f(h * .12)}" fill="url(#${tg})"/>`;
  // folds: broad and soft from the shoulders to the hem, each its own width and lean; the hollow on the side away
  // from the lamp, the ridge on its side
  const ridge = T(.75), hollow = mix(T(-.75), L.shadowTint, .15);
  for (let i = 0; i < 6; i++) { const t = (i + .25 + R() * .5) / 6, fx = x + (t - .5) * w * 1.02, top = y - h * (.9 - .1 * Math.abs(t - .5) * 2), fw = 2.6 + R() * 2.6, bend = (t - .5) * 5 + (R() - .5) * 2, g = nid('tf', u);
    defs += linGrad(g, fx - fw, 0, fx + fw, 0, sg > 0 ? [[0, hollow, 0], [.45, hollow, .5], [.7, hollow, .12], [1, ridge, .35]] : [[0, ridge, .35], [.3, hollow, .12], [.55, hollow, .5], [1, hollow, 0]]);
    inn += `<path d="M${f(fx - fw * .45)} ${f(top + 3)}C${f(fx - fw * .55)} ${f(lerp(top, y, .35))} ${f(fx - fw + bend * .6)} ${f(lerp(top, y, .7))} ${f(fx - fw * 1.2 + bend)} ${f(y + 3)}L${f(fx + fw * 1.2 + bend)} ${f(y + 3)}C${f(fx + fw + bend * .6)} ${f(lerp(top, y, .7))} ${f(fx + fw * .55)} ${f(lerp(top, y, .35))} ${f(fx + fw * .45)} ${f(top + 3)}Q${f(fx)} ${f(top - 1.5)} ${f(fx - fw * .45)} ${f(top + 3)}Z" fill="url(#${g})" opacity=".85"/>`; }
  // the chime under the cloth: a soft ridge round the head and a dip inside it
  inn += `<path d="M${f(x - w * .47)} ${f(y - h * .9)}Q${f(x)} ${f(y - h * .97)} ${f(x + w * .47)} ${f(y - h * .9)}" stroke="${T(-.4)}" stroke-width="1.8" fill="none" opacity=".4"/><path d="M${f(x - w * .47)} ${f(y - h * .925)}Q${f(x)} ${f(y - h * .995)} ${f(x + w * .47)} ${f(y - h * .925)}" stroke="${T(.95)}" stroke-width=".7" fill="none" opacity=".45"/>`;
  // creases pinched by the lashing, above and below the rope
  const by = y - h * .48, rb = t => by + Math.sin(Math.PI * t) * 3.4;
  for (let i = 0; i < 9; i++) { const t = (i + .5) / 9, X = x + (t - .5) * w * 1.08, Y = rb(t), up = 4 + R() * 5, dn = 4 + R() * 6, lx = (R() - .5) * 1.6;
    inn += `<path d="M${f(X + lx)} ${f(Y - up)}Q${f(X - .8)} ${f(Y - up * .4)} ${f(X)} ${f(Y)}Q${f(X + .9)} ${f(Y + dn * .5)} ${f(X - lx)} ${f(Y + dn)}" stroke="${hollow}" stroke-width="${f(.8 + R() * .6)}" fill="none" opacity=".5" stroke-linecap="round"/>`; }
  // a hem seam and the hem's turned edge lying on the hatch
  inn += `<path d="M${f(x - w * .58)} ${f(y - h * .1)}Q${f(x)} ${f(y - h * .015)} ${f(x + w * .6)} ${f(y - h * .12)}" stroke="${T(-.8)}" stroke-width=".55" fill="none" opacity=".45"/>`;
  let out = `<defs>${defs}</defs><path d="${d}" fill="url(#${id})"/><g clip-path="url(#${cid})">${inn}</g><path d="${d}" fill="none" stroke="${L.ramp('tar', x, y).outline}" stroke-width=".6" stroke-linejoin="round"/>`;
  // the lashing round the belly, the knot and its tail on the lamp's side
  const a = []; for (let i = 0; i <= 10; i++) { const t = i / 10; a.push([x + (t - .5) * w * 1.1, rb(t)]); }
  const kx = x + sg * w * .32, ky = by + 2.7;
  out += K.rope(u, L, a, { r: 1.05, seed: 71 }) + K.rope(u, L, [[kx, ky], [kx + sg * 2, ky + 5], [kx + sg * 1.2, ky + 11], [kx + sg * 3, ky + 16]], { r: .8, seed: 73, whip: true }) + K.shadeSphere(u, kx, ky, 1.9, L, 'rope', { outline: .3 });
  return out;
}

// ——— KIT-CANDIDATE: wet black powder: a glossy tar-black slurry. run() — a tongue running down a surface,
// thicker where it gathers, ending in a drop; the lamp's light on its ridge ———
const SL = ['#141211', '#2b2522'];
function run(u, L, x, y0, len, w, seed, o = {}) {
  const R = rng(seed), la = L.at(x, y0), sg = la.ux >= 0 ? 1 : -1, n = 7, lft = [], rgt = [];
  for (let i = 0; i <= n; i++) { const t = i / n, wob = Math.sin(t * 5 + seed) * w * .25 + (o.lean || 0) * t, ww = w * (.5 - .14 * t + .08 * Math.sin(t * 9 + seed)) ; lft.push([x + wob - ww, y0 + len * t]); rgt.unshift([x + wob + ww, y0 + len * t]); }
  const tip = lft[n], tr = w * .55, dp = [[tip[0] + w * .1, tip[1] + tr * .8], [tip[0] + w * .4 + tr * .2, tip[1] + tr * 1.6], [rgt[0][0] - w * .1, rgt[0][1] + tr * .8]];
  const d = smooth(lft.concat(dp, rgt)), id = nid('sl', u), hi = mix(L.keyColor, '#ffffff', .5);
  let out = `<defs>${linGrad(id, x + sg * w, y0, x - sg * w, y0, [[0, SL[1]], [.5, SL[0]], [1, mix(SL[0], L.shadowTint, .3)]])}</defs><path d="${d}" fill="url(#${id})"/>`;
  const gl = lft.map((p, i) => [lerp(p[0], rgt[n - i][0], sg > 0 ? .7 : .3), p[1]]).slice(1, Math.max(3, Math.round(n * .75)));
  out += `<path d="${smooth(gl, false)}" stroke="${hi}" stroke-width="${f(Math.max(.3, w * .14))}" fill="none" stroke-linecap="round" opacity="${f(o.glint != null ? o.glint : .55)}"/>`;
  return out + `<circle cx="${f(dp[1][0] - sg * tr * .3)}" cy="${f(dp[1][1] - tr * .5)}" r="${f(tr * .22)}" fill="${hi}" opacity=".5"/>`;
}

// ——— KIT-CANDIDATE: a sheet of water breaking over the rail: a heavy curl, its thin lip lit through, lace of foam
// streaming along its run and down the falling face, a ragged foot that breaks into spray on the inner planking ———
function sheet(u, L) {
  const R = rng(91);
  const crest = [[206, 47], [190, 45], [175, 42], [160, 37], [146, 34], [134, 37], [125, 44], [119.5, 53], [118.5, 62], [121, 70]];
  const foot = [[123, 77], [124.5, 84], [130, 87.5], [137, 84.5], [145, 88.5], [154, 85.5], [163, 89.5], [173, 86.5], [184, 90], [194, 87], [206, 89]];
  const d = smooth(crest.concat(foot)), id = nid('ws', u), cid = nid('wc', u), ef = nid('we', u), th = nid('wt', u), lg = nid('wl', u), dk = nid('wd', u);
  const deep = '#16323f', mid = '#2f5f74', thin = '#3d6f88', glow = '#7fb0c8', foamC = '#eef6f8';
  let defs = linGrad(id, 204, 70, 120, 56, [[0, deep], [.35, mid], [.75, thin], [1, mix(glow, L.keyColor, .15)]])
    + `<clipPath id="${cid}"><path d="${d}"/></clipPath>`
    + `<filter id="${ef}" filterUnits="userSpaceOnUse" x="108" y="22" width="104" height="80"><feTurbulence type="fractalNoise" baseFrequency="0.08 0.11" numOctaves="2" seed="17" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + linGrad(th, 118, 60, 146, 50, [[0, mix(glow, L.keyColor, .3), .8], [.4, glow, .35], [1, glow, 0]])
    + radGrad(lg, 124, 66, 24, [[0, L.keyColor, .42], [.5, L.keyColor, .12], [1, L.keyColor, 0]])
    + linGrad(dk, 0, 40, 0, 90, [[0, deep, 0], [.5, deep, .25], [1, deep, .5]]);
  let inn = `<rect x="140" y="30" width="70" height="64" fill="url(#${dk})"/><rect x="108" y="26" width="100" height="70" fill="url(#${th})"/><ellipse cx="124" cy="66" rx="24" ry="22" fill="url(#${lg})" style="mix-blend-mode:screen"/>`;
  // the crest: the cold rim of the night sky, the thin top lit through
  inn += `<path d="${smooth(crest.map(p => [p[0] + .2, p[1] + 1]), false)}" stroke="${L.rimColor}" stroke-width="1.5" fill="none" opacity=".5"/><path d="${smooth(crest.map(p => [p[0] + .6, p[1] + 2.6]), false)}" stroke="${glow}" stroke-width="2.6" fill="none" opacity=".22"/>`;
  // streamlines: offsets of the crest into the body that turn down the falling face; foam lies on them as broken lace
  for (let s = 0; s < 13; s++) { const off = 3 + s * 3.4 + R() * 2, line = [];
    for (let i = 0; i < crest.length; i++) { const p = crest[i], q = crest[Math.min(crest.length - 1, i + 1)], r0 = crest[Math.max(0, i - 1)], tx = q[0] - r0[0], ty = q[1] - r0[1], tl = Math.hypot(tx, ty) || 1; line.push([p[0] - ty / tl * off * .6 + off * .45, p[1] + tx / tl * off * .6 * -1 + off * .1]); }
    const last = line[line.length - 1]; line.push([last[0] + 1 + R(), last[1] + 9], [last[0] + 2 + R() * 2, 92]);
    // walk it and lay pieces of lace of their own length and width, with gaps
    const pl = []; for (let i = 0; i + 1 < line.length; i++) for (let j = 0; j < 6; j++) pl.push([lerp(line[i][0], line[i + 1][0], j / 6), lerp(line[i][1], line[i + 1][1], j / 6)]);
    let i = Math.floor(R() * 4);
    while (i < pl.length - 2) { const ln = 2 + Math.floor(R() * 7), seg = pl.slice(i, Math.min(pl.length, i + ln));
      if (seg.length > 1 && R() > .3) inn += `<path d="M${seg.map(p => f(p[0] + (R() - .5) * .5) + ' ' + f(p[1])).join('L')}" stroke="${mix(foamC, glow, R() * .5)}" stroke-width="${f(.4 + R() * 1.5 * (1 - s / 16))}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${f(.18 + R() * .4)}"/>`;
      i += ln + 1 + Math.floor(R() * 3); } }
  let out = `<defs>${defs}</defs><g filter="url(#${ef})"><path d="${d}" fill="url(#${id})"/><g clip-path="url(#${cid})">${inn}</g></g>`;
  // the foot breaks on the planking: foam and water running down the boards
  out += K.foam(u, { x: 165, y: 88, w: 80, h: 3.6, seed: 23, L });
  for (let i = 0; i < 11; i++) { const x0 = 128 + R() * 72, l = 6 + R() * 22; out += `<path d="M${f(x0)} ${f(89 + R() * 2)}q${f((R() - .5) * 2)} ${f(l / 2)} ${f((R() - .5) * 2)} ${f(l)}" stroke="${mix(glow, L.keyColor, .2)}" stroke-width="${f(.45 + R() * .8)}" fill="none" stroke-linecap="round" opacity="${f(.2 + R() * .3)}"/>`; }
  // spray off the crest, thrown up and to the left: drops stretched along their flight, of every size
  // the spray rises off the crest in sheets that tear into drops: torn veils first, then the drops stretched along
  // their flight, the larger ones lower and nearer the crest
  const vf = nid('wv', u); out += `<defs><filter id="${vf}" filterUnits="userSpaceOnUse" x="110" y="0" width="100" height="50"><feTurbulence type="fractalNoise" baseFrequency="0.16 0.22" numOctaves="2" seed="29" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".5"/></filter></defs><g filter="url(#${vf})">`;
  for (const [x0, y0, l, hh, op] of [[204, 40, 34, 7, .38], [184, 36, 30, 6, .32], [162, 31, 22, 5, .3], [196, 30, 18, 4, .22]]) out += `<path d="M${x0} ${y0}C${f(x0 - l * .3)} ${f(y0 - hh)} ${f(x0 - l * .7)} ${f(y0 - hh * 1.3)} ${f(x0 - l)} ${f(y0 - hh * 1.6)}C${f(x0 - l * .7)} ${f(y0 - hh * .6)} ${f(x0 - l * .3)} ${f(y0 + 1)} ${x0} ${f(y0 + 2)}Z" fill="${mix(foamC, glow, .25)}" opacity="${op}"/>`;
  out += '</g>';
  for (let i = 0; i < 60; i++) { const px = 120 + R() * 84, hgt = R(), py = 38 - hgt * 34 - (px - 120) * .04, rr = .22 + (1 - hgt) * R() * .7, ang = -22 - R() * 26;
    if (py > 36 && px < 150) continue;
    out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(rr * (2.4 + R() * 1.6))}" ry="${f(rr)}" transform="rotate(${f(ang)} ${f(px)} ${f(py)})" fill="${R() > .45 ? foamC : mix(glow, L.keyColor, .3)}" opacity="${f(.3 + R() * .5)}"/>`; }
  return out;
}

module.exports = { name: 'Сырой порох', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE });
    // a stormy night sky, lifted (no black), the series' blue
    L.pal = Object.assign({}, L.pal, { sky: ['#24344d', '#2c425c', '#38526b', '#45607a'] });
    let bg = K.sky(u, L, { horizon: HZ, stars: false });
    bg += K.cloudBank(u, L, { y: 50, h: 16, x0: -30, x1: 110, n: 2, seed: 8, far: .95 });
    // the deck from the bulwark's foot to the viewer; the pool of the lamp
    bg += K.deck(u, L, { horizon: HZ, top: 119, bottom: 280, vx: 100, seed: 12, plank: 30 });
    bg += K.bulwark(u, L, { x1: -2, x2: 202, y: 119, h: 59, seed: 31, posts: 36 });
    // the sea over the rail (behind the kegs)
    bg += sheet(u, L);
    // the boom across the top: iron bands, a hook under it; the lantern swings 12° off the plumb
    let fg = K.shadeCyl(u, -12, 4, 152, 9.5, 4.6, L, 'oak', { seed: 5, outline: .6 });
    for (const t of [.5, .8]) { const bx = lerp(-12, 152, t), by = lerp(4, 9.5, t); fg += K.shadeCyl(u, bx - 2, by, bx + 2, by + .1, 5.1, L, 'iron', { outline: .4, ell: .05 }); }
    const lamp = { x: 104.4, y: 47.4, s: 1, rot: 12 }, F = K.propFrame(lamp), ring = F.p(0, -27.7), hook = [ring[0] + 1.6, 13.4];
    fg += K.rope(u, L, [hook, [lerp(hook[0], ring[0], .5), lerp(hook[1], ring[1], .5)], [ring[0], ring[1] - .9]], { r: .5, seed: 9 });
    fg += K.propTube(u, L, 'iron', `M${f(hook[0] - 1.3)} ${f(hook[1] - 3.2)}c0 2.8 2.6 2.8 2.6 0`, .38, hook);
    // the hatch; the shadows of the kegs fan out on its top from the point under the lamp
    fg += hatch(u, L, { x1: 28, x2: 188, y: 174, h: 50, back: 114 });
    fg += K.castShadow(u, L, { x: 74, y: 122, w: 48, h: 64, horizon: HZ }) + K.castShadow(u, L, { x: 140, y: 122, w: 44, h: 64, horizon: HZ });
    // the knocked-off head leans on the wet keg: a disc of tarred staves seen obliquely, its edge to the lamp
    { const cx = 171, cy = 104, g = K.mat('tar', L, { form: 'plane', x1: cx - 6, y1: cy - 18, x2: cx + 6, y2: cy + 18, n: [.75, .15, .64], u }), ed = L.ramp('tar', cx, cy), cid = nid('hd', u), el = `<ellipse cx="${cx}" cy="${cy}" rx="6.2" ry="17.5" transform="rotate(-9 ${cx} ${cy})"`;
      fg += K.contactShadow(u, cx + 1.5, 122.5, 16, L) + `<defs>${g.defs}<clipPath id="${cid}">${el}/></clipPath></defs><ellipse cx="${cx - 1.8}" cy="${cy}" rx="6.2" ry="17.5" transform="rotate(-9 ${cx - 1.8} ${cy})" fill="${ed.half}" stroke="${ed.outline}" stroke-width=".5"/>${el} fill="${g.fill}" stroke="${ed.outline}" stroke-width=".5"/>`
        + `<g clip-path="url(#${cid})">${[-3, .4, 3.6].map((dx, i) => `<path d="M${f(cx + dx + 3)} ${cy - 20}L${f(cx + dx - 3)} ${cy + 20}" stroke="${ed.outline}" stroke-width=".45" opacity="${.5 + i * .05}"/>`).join('')}<path d="M${cx - 8} ${cy + 4}L${cx + 8} ${cy + 1}" stroke="${L.ramp('iron', cx, cy).core}" stroke-width="1.6" opacity=".75"/></g>`; }
    // the dry keg under its canvas and the wet open one
    fg += K.contactShadow(u, 74, 123, 56, L) + tarp(u, L, { x: 74, y: 122, w: 46, h: 64, seed: 7 });
    fg += K.barrel(u, L, { x: 140, y: 122, s: 2.1, kind: 'powder', open: true, seed: 14 });
    // wet: the lamp's glints stretched down the lit staves
    const wr = L.ramp('water-wet', 130, 90);
    fg += [[125.5, 70, 20], [128, 96, 18], [124.5, 106, 9]].map(([x, y, l], i) => `<path d="M${x} ${y}q-.6 ${f(l / 2)} .2 ${l}" stroke="${wr.spec}" stroke-width="${f(1 - i * .2)}" fill="none" stroke-linecap="round" opacity=".55"/>`).join('');
    // the black slurry welling over the chime, running down the staves and pooling on the hatch
    { const cx = 140, cy = 59, rx = 19.6, ry = 3.1, up = [], lo = [], Rr = rng(41);
      for (let i = 0; i <= 14; i++) { const a = Math.PI * (.08 + .84 * i / 14), p = [cx - Math.cos(a) * rx, cy + Math.sin(a) * ry]; up.push([p[0], p[1] - .6]); lo.unshift([p[0], p[1] + 1.2 + Rr() * 2.2 * Math.sin(a)]); }
      const id = nid('sb', u); fg += `<defs>${linGrad(id, cx - rx, cy, cx + rx, cy, [[0, SL[1]], [.6, SL[0]], [1, SL[0]]])}</defs><path d="${smooth(up.concat(lo))}" fill="url(#${id})"/><path d="${smooth(up.slice(1, 8), false)}" stroke="${mix(L.keyColor, '#ffffff', .5)}" stroke-width=".45" fill="none" opacity=".55"/>`; }
    fg += run(u, L, 127, 62, 50, 3.8, 3) + run(u, L, 134.5, 63, 34, 3, 5) + run(u, L, 146, 63, 22, 2.6, 7, { glint: .4 }) + run(u, L, 152, 62, 12, 2.2, 9, { glint: .3 });
    fg += run(u, L, 131, 109, 13, 3.2, 11);
    { const id = nid('sp', u); fg += `<defs>${linGrad(id, 112, 122, 168, 126, [[0, SL[1]], [.5, SL[0]], [1, mix(SL[0], L.shadowTint, .25)]])}</defs><path d="M114 121.4C121 119.6 142 119.8 160 121.4C167 122.2 170 124.2 162 125.6C152 126.6 132 126.4 118 125.4C110 124.8 109 122.6 114 121.4Z" fill="url(#${id})"/><path d="M119 121.1C131 120 147 120.2 157 121.3" stroke="${mix(L.keyColor, '#ffffff', .45)}" stroke-width=".5" fill="none" opacity=".55"/>`; }
    // it spills over the coaming, down the hatch's front and away across the deck to the scupper
    fg += run(u, L, 153, 124, 46, 4.4, 13, { lean: 2 });
    { const c = [[155, 171], [163, 177], [174, 182], [188, 186], [206, 189]], wd = [3.6, 5, 6.4, 7.8, 9], a = c.map((p, i) => [p[0], p[1] - wd[i] * .45]), b = c.map((p, i) => [p[0], p[1] + wd[i] * .55]).reverse(), id = nid('ss', u);
      fg += `<defs>${linGrad(id, 0, 168, 0, 194, [[0, SL[1]], [1, SL[0]]])}</defs><path d="${smooth(a.concat(b))}" fill="url(#${id})"/><path d="${smooth(a.map(p => [p[0], p[1] + 1]).slice(0, 4), false)}" stroke="${mix(L.keyColor, '#ffffff', .4)}" stroke-width=".5" fill="none" opacity=".4"/>`; }
    // the wet deck: the lamp's reflection stretched towards the viewer, broken by the seams
    const rg = nid('rf', u), rb = nid('rb', u);
    fg += `<defs>${linGrad(rg, 0, 176, 0, 262, [[0, L.keyColor, .5], [.5, L.keyColor, .22], [1, L.keyColor, 0]])}<filter id="${rb}" filterUnits="userSpaceOnUse" x="70" y="166" width="70" height="104"><feGaussianBlur stdDeviation="2.4 1.4"/></filter></defs><path d="M99 177L112 177L119 262L93 262Z" fill="url(#${rg})" filter="url(#${rb})" style="mix-blend-mode:screen"/>`;
    // under the glass: a third keg on its side, a coil of rope
    fg += K.castShadow(u, L, { x: 44, y: 246, w: 50, h: 34, horizon: HZ, opacity: .55 });
    fg += K.barrel(u, L, { x: 44, y: 246, s: 1.75, kind: 'powder', lying: true, flip: true, seed: 21 });
    fg += K.coil(u, L, { x: 160, y: 264, s: 1.6, turns: 4, seed: 33 });
    // the lantern in front of everything and its glow
    fg += K.lantern(u, L, Object.assign({}, lamp, { seed: 4 }));
    fg += K.localGlow(u, { x: 106, y: 40, color: '#ffb24a', power: .5, radius: 66 }, { core: false });
    return [bg, fg];
  } };
