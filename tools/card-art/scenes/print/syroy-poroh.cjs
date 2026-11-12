// «Сырой порох» (Колода моря): a sea came over the bulwark at night and fell on the powder kegs on the hatch: the
// right keg has lost its head and black wet powder runs down its staves, the left one is dry under tarred canvas.
// Breakdown: docs/tasks/print-kit-cards.md «Сырой порох».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, scale, clamp, lerp, rng, nid, linGrad, radGrad } = K;

// One lantern hangs over the kegs (a point light): the dry canvas warm and matt, the wet keg glossy; the shadows on
// the hatch fan out from the point under the lamp. A cold rim from the right (kit az: where the light comes FROM —
// 250 is from the left-behind; the brief's words «холодный кант справа» on the sheet of water: the rim comes from
// the right, az 90+) — the night sky over the sea behind the sheet.
const light = { time: 'night', key: { type: 'point', x: 106, y: 44, h: 1.5, color: '#ffb24a', power: 1, radius: 120 },
  fill: { color: '#1f3550', power: .4 }, rim: { az: 70, color: '#cfe6ff', power: .5 }, haze: .25 };
const HZ = 122, EYE = .5;
// hatch: front face y 155–205 (0.3 m at 166 u/m), its top recedes to y 143; kegs 0.4 m = 66 u stand on it
const skel = { horizon: HZ, eye: EYE, light: 'lantern over the kegs at x 106, y 44 (1.5 m); shadows fan out from the point under it on the hatch; cold rim on the sheet of water from the right',
  items: [
    ['bulwark', 0, 150, 200, 62, 'stands on the deck, foot y 150, rail y 88; hides the horizon y 122'],
    ['hatch', 28, 205, 160, 62, 'on the deck, front edge y 155–205, top to y 143'],
    ['keg-canvas', 48, 152, 52, 66, 'stands on the hatch top'],
    ['keg-wet', 114, 151, 52, 66, 'stands on the hatch top, head knocked off'],
    ['lantern', 96, 56, 20, 30, 'hangs on a rope from the hook under the boom, swung 12°'],
    ['boom', 0, 22, 140, 12, 'spar across the top, its mast off the frame to the left'],
    ['sea', 124, 98, 76, 70, 'a sheet of water flying over the rail from the right'],
    ['keg-lying', 14, 252, 58, 40, 'lies on its side on the deck on chocks'],
    ['coil', 136, 268, 50, 14, 'lies on the deck'],
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
  // the coaming: a thick top board round the cover, its front edge catching the lamp
  const cf = [{ pts: [[x1 - 2, top - 1], [x2 + 2, top - 1], [x2 + 2, top + 6], [x1 - 2, top + 6]], n: [0, .3, .95], grain: [1, 0] }];
  out += K.shadeBox(u, cf, L, 'oak', { seed: 63, outline: .5 });
  // the cover's planks on the top face (they run across, into the depth) and the front face's boards
  const rp = L.ramp('oak', 100, top);
  for (let i = 1; i < 7; i++) { const t = i / 7, xa = lerp(x1, x2, t), xb = bx(xa); out += `<path d="M${f(xa)} ${f(top - 1)}L${f(xb)} ${f(back)}" stroke="${rp.outline}" stroke-width=".45" opacity=".6"/>`; }
  const R = rng(65); let yy = top + 6;
  while (yy < y - 8) { const nh = 12 + R() * 6; yy = Math.min(y - 3, yy + nh);
    out += `<path d="M${f(x1)} ${f(yy)}H${f(x2)}" stroke="${rp.outline}" stroke-width=".6" opacity=".7"/><path d="M${f(x1)} ${f(yy + .7)}H${f(x2)}" stroke="${rp.lit}" stroke-width=".35" opacity=".25"/>`;
    for (const nx of [x1 + 5, x1 + (x2 - x1) * (.3 + R() * .1), x1 + (x2 - x1) * (.62 + R() * .1), x2 - 5]) out += `<circle cx="${f(nx)}" cy="${f(yy - 3)}" r=".55" fill="${rp.outline}" opacity=".7"/>`; }
  // iron corner straps at the front corners
  for (const cx of [x1, x2 - 7]) out += K.shadeBox(u, [{ pts: [[cx, top + 6], [cx + 7, top + 6], [cx + 7, y - 2], [cx, y - 2]], n: 'front' }], L, 'iron', { seed: 66 + cx, outline: .4 });
  return out;
}

// ——— KIT-CANDIDATE: tarred canvas thrown over a standing keg and lashed round its belly ———
function tarp(u, L, o) {
  const { x, y, w, h } = o, R = rng(o.seed || 5), la = L.at(x, y - h / 2), sg = la.ux >= 0 ? 1 : -1;
  // the cloth: a dome over the head, falling straight down the sides, flaring and lying in folds on the hatch
  const pts = [[x - w * .58, y + 1.5], [x - w * .55, y - h * .35], [x - w * .5, y - h * .78], [x - w * .36, y - h * .98], [x - w * .1, y - h * 1.05], [x + w * .18, y - h * 1.04], [x + w * .4, y - h * .95], [x + w * .5, y - h * .74], [x + w * .54, y - h * .36], [x + w * .6, y + 1.2], [x + w * .3, y + 2.6], [x, y + 2], [x - w * .3, y + 2.8]];
  const d = smooth(pts), id = nid('tp', u), cid = nid('tc', u), sh = nid('ts', u);
  // tarred canvas: canvas tones darkened with tar, warm on the lamp's side, dull, no highlight
  const T = I => mix(L.tone('canvas', I, x, y - h / 2), L.tone('tar', I, x, y - h / 2), .55);
  let defs = linGrad(id, x + sg * w * .55, y - h * .6, x - sg * w * .55, y - h * .4, [[0, T(.95)], [.3, T(.55)], [.55, T(0)], [.8, T(-.55)], [1, T(-.9)]])
    + `<clipPath id="${cid}"><path d="${d}"/></clipPath>` + linGrad(sh, x, y - h * 1.05, x, y + 2, [[0, '#ffffff', .18], [.25, '#ffffff', 0], [.85, L.shadowTint, 0], [1, L.shadowTint, .5]]);
  let inn = `<rect x="${f(x - w)}" y="${f(y - h * 1.1)}" width="${f(w * 2)}" height="${f(h * 1.2)}" fill="url(#${sh})"/>`;
  // folds hang from the shoulders of the keg down to the hatch, each its own width, darker in the hollow, lit ridge
  const nf = 7;
  for (let i = 0; i < nf; i++) { const t = (i + .3 + R() * .4) / nf, fx = x + (t - .5) * w * 1.05, top = y - h * (.55 + .3 * (1 - Math.abs(t - .5) * 2)), fw = 1.6 + R() * 2.2, g = nid('tf', u), bend = (t - .5) * 4 + (R() - .5) * 2;
    const hollow = mix(T(-.7), L.shadowTint, .2), ridge = T(.75);
    defs += linGrad(g, fx - fw, 0, fx + fw, 0, sg > 0 ? [[0, hollow, 0], [.45, hollow, .7], [.62, hollow, .25], [1, ridge, .45]] : [[0, ridge, .45], [.38, hollow, .25], [.55, hollow, .7], [1, hollow, 0]]);
    inn += `<path d="M${f(fx)} ${f(top)}C${f(fx - fw)} ${f(lerp(top, y, .4))} ${f(fx - fw * 1.3 + bend)} ${f(lerp(top, y, .8))} ${f(fx - fw * 1.1 + bend)} ${f(y + 3)}L${f(fx + fw * 1.1 + bend)} ${f(y + 3)}C${f(fx + fw * 1.2 + bend)} ${f(lerp(top, y, .8))} ${f(fx + fw)} ${f(lerp(top, y, .4))} ${f(fx)} ${f(top)}Z" fill="url(#${g})"/>`; }
  // the cloth sags between the rim of the head: a soft dip and two creases from the chime
  inn += `<path d="M${f(x - w * .44)} ${f(y - h * .86)}Q${f(x)} ${f(y - h * .93)} ${f(x + w * .44)} ${f(y - h * .84)}" stroke="${T(-.5)}" stroke-width="1.6" fill="none" opacity=".45"/><path d="M${f(x - w * .44)} ${f(y - h * .88)}Q${f(x)} ${f(y - h * .95)} ${f(x + w * .44)} ${f(y - h * .86)}" stroke="${T(.9)}" stroke-width=".6" fill="none" opacity=".4"/>`;
  // a hem seam
  inn += `<path d="M${f(x - w * .56)} ${f(y - h * .12)}Q${f(x)} ${f(y - h * .02)} ${f(x + w * .58)} ${f(y - h * .14)}" stroke="${T(-.8)}" stroke-width=".5" fill="none" opacity=".5" stroke-dasharray="1.6 1.1"/>`;
  let out = `<defs>${defs}</defs><path d="${d}" fill="url(#${id})"/><g clip-path="url(#${cid})">${inn}</g><path d="${d}" fill="none" stroke="${L.ramp('tar', x, y).outline}" stroke-width=".6" stroke-linejoin="round"/>`;
  // the lashing round the belly: a rope that follows the round of the keg, pinching the cloth
  const by = y - h * .5, a = [], b = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10, X = x + (t - .5) * w * 1.04; a.push([X, by + Math.sin(Math.PI * t) * 3.2]); }
  out += K.rope(u, L, a, { r: 1.05, seed: 71 });
  for (const t of [.12, .45, .8]) { const X = x + (t - .5) * w * 1.04, Y = by + Math.sin(Math.PI * t) * 3.2; b.push(`<path d="M${f(X - 2)} ${f(Y - 4)}Q${f(X)} ${f(Y - 1)} ${f(X + 2)} ${f(Y - 4.5)}" stroke="${T(-.8)}" stroke-width=".7" fill="none" opacity=".55"/>`); }
  // the knot and its tail on the lamp's side
  const kx = x + sg * w * .3, ky = by + 2.6;
  out += b.join('') + K.rope(u, L, [[kx, ky], [kx + sg * 2, ky + 5], [kx + sg * 1, ky + 11], [kx + sg * 3, ky + 16]], { r: .8, seed: 73, whip: true }) + K.shadeSphere(u, kx, ky, 1.8, L, 'rope', { outline: .3 });
  return out;
}

// ——— KIT-CANDIDATE: wet black powder running down the staves and spreading on the planks: a glossy tar-black
// slurry with the lamp's highlights on its ridges ———
function slurry(u, L, pts, o = {}) {
  const w = o.w || 2, d = smooth(pts, false), id = nid('sl', u), a = pts[0], b = pts[pts.length - 1];
  const dark = '#151313', mid = '#2a2522', hi = mix(L.keyColor, '#ffffff', .5);
  let out = `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, mid], [.5, dark], [1, mix(dark, L.shadowTint, .3)]])}</defs>`;
  out += `<path d="${d}" stroke="url(#${id})" stroke-width="${f(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  out += `<path d="${d}" stroke="${hi}" stroke-width="${f(w * .18)}" fill="none" stroke-linecap="round" opacity="${f(o.glint != null ? o.glint : .55)}" transform="translate(${f(-w * .22)} 0)" stroke-dasharray="${f(3 + w)} ${f(4 + w * 2)}"/>`;
  return out;
}

// ——— KIT-CANDIDATE: a sheet of green water breaking over the rail: a heavy curl with a thin lip lit through,
// foam streaks along its run, a ragged foot breaking into spray on the bulwark's inner side ———
function sheet(u, L) {
  const R = rng(91);
  const body = [[204, 38], [186, 37], [168, 39], [152, 44], [139, 51], [129, 60], [123, 70], [124, 79], [128, 86], [127, 92], [133, 97], [142, 94], [151, 98], [160, 95], [170, 99], [181, 95], [192, 99], [204, 96]];
  const d = smooth(body), id = nid('ws', u), cid = nid('wc', u), ef = nid('we', u), th = nid('wt', u), lg = nid('wl', u);
  const deep = '#16323f', mid = '#2f5f74', thin = '#3d6f88', glow = '#7fb0c8', foam = '#eef6f8';
  let defs = linGrad(id, 200, 50, 126, 78, [[0, deep], [.45, mid], [.8, thin], [1, mix(glow, L.keyColor, .2)]])
    + `<clipPath id="${cid}"><path d="${d}"/></clipPath>`
    + `<filter id="${ef}" filterUnits="userSpaceOnUse" x="110" y="26" width="100" height="84"><feTurbulence type="fractalNoise" baseFrequency="0.09 0.12" numOctaves="2" seed="17" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>`
    // the thin lip lit through by the lamp and the sky: a band along the leading edge
    + linGrad(th, 122, 74, 150, 60, [[0, mix(glow, L.keyColor, .35), .85], [.35, glow, .45], [1, glow, 0]])
    // the lamp's warm sheen on the face that turns to it (left, low)
    + radGrad(lg, 128, 74, 26, [[0, L.keyColor, .45], [.5, L.keyColor, .14], [1, L.keyColor, 0]]);
  let inn = `<rect x="110" y="30" width="96" height="74" fill="url(#${th})"/><ellipse cx="128" cy="74" rx="26" ry="22" fill="url(#${lg})" style="mix-blend-mode:screen"/>`;
  // the top of the curl: the cold rim of the night sky along the crest
  inn += `<path d="M204 39.5C186 38.5 168 40.5 152 45.5S131 58 125 69" stroke="${L.rimColor}" stroke-width="1.6" fill="none" opacity=".55"/><path d="M204 41C186 40 168 42 152 47S132 59 126 70" stroke="${glow}" stroke-width="2.4" fill="none" opacity=".25"/>`;
  // foam streaks along the run of the water: from the crest round the curl and down the falling face
  for (let i = 0; i < 16; i++) { const t = i / 16, y0 = 44 + t * 46 + (R() - .5) * 4, x0 = 204 - R() * 8, len = 30 + R() * 40, bend = 6 + t * 8, sw = .5 + R() * 1.4;
    inn += `<path d="M${f(x0)} ${f(y0)}c${f(-len * .35)} ${f(-2 + R() * 3)} ${f(-len * .7)} ${f(bend * .4)} ${f(-len)} ${f(bend)}" stroke="${foam}" stroke-width="${f(sw)}" fill="none" stroke-linecap="round" opacity="${f(.2 + R() * .35)}"/>`; }
  // the falling curtain: streaks running down from the lip
  for (let i = 0; i < 9; i++) { const x0 = 126 + i * 7 + R() * 4, y0 = 72 + R() * 8, l = 14 + R() * 10;
    inn += `<path d="M${f(x0)} ${f(y0)}q${f(1 + R())} ${f(l * .5)} ${f(R() * 2)} ${f(l)}" stroke="${mix(foam, glow, .3)}" stroke-width="${f(.7 + R())}" fill="none" stroke-linecap="round" opacity="${f(.25 + R() * .3)}"/>`; }
  let out = `<defs>${defs}</defs><g filter="url(#${ef})"><path d="${d}" fill="url(#${id})"/><g clip-path="url(#${cid})">${inn}</g></g>`;
  // the foot breaks on the planks of the bulwark: a ragged band of foam and the water running down the boards
  out += K.foam(u, { x: 164, y: 97, w: 78, h: 4.5, seed: 23, L });
  for (let i = 0; i < 10; i++) { const x0 = 132 + R() * 66, l = 8 + R() * 22; out += `<path d="M${f(x0)} ${f(98 + R() * 2)}q${f((R() - .5) * 2)} ${f(l / 2)} ${f((R() - .5) * 2)} ${f(l)}" stroke="${mix(glow, L.keyColor, .2)}" stroke-width="${f(.5 + R() * .8)}" fill="none" stroke-linecap="round" opacity="${f(.25 + R() * .3)}"/>`; }
  // spray thrown up and to the left off the crest: drops stretched along their flight, lit by the lamp on the left
  for (let i = 0; i < 46; i++) { const t = R(), px = 128 + R() * 74, py = 18 + R() * 32 - (px - 128) * .05, rr = .35 + R() * R() * 1.4, ang = -20 - R() * 25;
    if (py > 46 && px < 150) continue;
    out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(rr * 2.2)}" ry="${f(rr)}" transform="rotate(${f(ang)} ${f(px)} ${f(py)})" fill="${t > .5 ? foam : mix(glow, L.keyColor, .3)}" opacity="${f(.35 + R() * .5)}"/>`; }
  return out;
}

module.exports = { name: 'Сырой порох', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE });
    // a stormy night sky, lifted (no black): the series' blue, low clouds lit from below by nothing — just air
    L.pal = Object.assign({}, L.pal, { sky: ['#26364f', '#2e4560', '#3b5770', '#4a667c'] });
    let bg = K.sky(u, L, { horizon: HZ, stars: false });
    bg += K.cloudBank(u, L, { y: 70, h: 26, x0: -20, x1: 140, n: 3, seed: 8, far: .5 });
    // the deck from the bulwark's foot to the viewer, wet; the pool of the lamp
    bg += K.deck(u, L, { horizon: HZ, top: 150, bottom: 280, vx: 100, seed: 12, plank: 26 });
    bg += K.bulwark(u, L, { x1: -2, x2: 202, y: 150, h: 62, seed: 31, posts: 34 });
    // the boom across the top and the lantern's rope
    let fg = K.shadeCyl(u, -12, 16, 150, 23, 5.2, L, 'oak', { seed: 5, outline: .6 });
    for (const t of [.18, .62]) { const bx = lerp(-12, 150, t), by = lerp(16, 23, t); fg += K.shadeCyl(u, bx - 2.4, by, bx + 2.4, by + .2, 5.8, L, 'iron', { outline: .4, ell: .05 }); }
    // the lantern swings on its rope: 12° off the plumb
    const lamp = { x: 104, y: 56, s: 1.02, rot: 12 }, F = K.propFrame(lamp), ring = F.p(0, -27.7), hook = [ring[0] - 1.8, 21.5];
    fg += K.rope(u, L, [[hook[0], hook[1]], [lerp(hook[0], ring[0], .5), lerp(hook[1], ring[1], .5)], [ring[0], ring[1] - 1]], { r: .5, seed: 9 });
    fg += K.propTube(u, L, 'iron', `M${f(hook[0] - 1.2)} ${f(hook[1] - 3)}c0 2.6 2.4 2.6 2.4 0`, .35, hook);
    // the hatch and the shadows of the kegs on it (fanned from the point under the lamp)
    fg += K.castShadow(u, L, { x: 150, y: 206, w: 40, h: 60, horizon: HZ, opacity: .5 });
    fg += hatch(u, L, { x1: 28, x2: 188, y: 205, h: 50, back: 143 });
    fg += K.castShadow(u, L, { x: 74, y: 152, w: 48, h: 64, horizon: HZ }) + K.castShadow(u, L, { x: 140, y: 151, w: 46, h: 64, horizon: HZ });
    // the dry keg under its canvas (the keg itself shows only at the hem) and the wet open one
    fg += K.contactShadow(u, 74, 153, 56, L) + tarp(u, L, { x: 74, y: 152, w: 50, h: 66, seed: 7 });
    fg += K.barrel(u, L, { x: 140, y: 151, s: 2.2, kind: 'powder', open: true, seed: 14 });
    // wet: the lamp's glints stretched down the lit staves, water beads on the hoops
    const wr = L.ramp('water-wet', 140, 120);
    fg += [[150, 98, 18], [154, 112, 22], [147, 124, 16]].map(([x, y, l], i) => `<path d="M${x} ${y}q.8 ${f(l / 2)} -.2 ${l}" stroke="${wr.spec}" stroke-width="${f(1.1 - i * .2)}" fill="none" stroke-linecap="round" opacity=".55"/>`).join('');
    // the black slurry over the chime and down the staves, pooling on the hatch and running off its edge
    fg += slurry(u, L, [[124, 91], [123, 98], [124.5, 110], [123, 124], [125, 140], [124, 151]], { w: 3.2 });
    fg += slurry(u, L, [[132, 89], [133, 100], [131.5, 115], [133, 130], [132, 146], [134, 152]], { w: 2.4 });
    fg += slurry(u, L, [[146, 89], [147, 97], [146, 106]], { w: 2, glint: .4 });
    fg += `<path d="M112 153.5C118 150 140 150.5 158 152.5C164 153.5 168 156 160 157.5C146 159 126 158.5 114 157C108 156 108 155 112 153.5Z" fill="#1a1715"/><path d="M118 153.2C130 151.8 146 152 156 153.2" stroke="${mix(L.keyColor, '#ffffff', .45)}" stroke-width=".5" fill="none" opacity=".55"/>`;
    fg += slurry(u, L, [[150, 156], [153, 170], [151.5, 185], [154, 200], [160, 212], [176, 224], [196, 232], [206, 236]], { w: 3.6, glint: .45 });
    // the knocked-off head lying against the hatch's front, tilted
    fg += `<g transform="rotate(-16 178 156)">` + K.shadeCyl(u, 166, 156, 190, 156, 2.2, L, 'tar', { ell: .9, face: 2, cap: 'round', seed: 3, outline: .5 }) + `</g>`;
    // the wet deck: the lamp's reflection stretched towards the viewer, broken by the seams
    const rg = nid('rf', u), rb = nid('rb', u);
    fg += `<defs>${linGrad(rg, 0, 206, 0, 270, [[0, L.keyColor, .55], [.5, L.keyColor, .25], [1, L.keyColor, 0]])}<filter id="${rb}" filterUnits="userSpaceOnUse" x="70" y="196" width="70" height="84"><feGaussianBlur stdDeviation="2.2 1.2"/></filter></defs><path d="M98 207L112 207L118 270L94 270Z" fill="url(#${rg})" filter="url(#${rb})" style="mix-blend-mode:screen"/>`;
    // under the glass: a third keg on its side, a coil of rope
    fg += K.castShadow(u, L, { x: 44, y: 252, w: 50, h: 36, horizon: HZ, opacity: .55 });
    fg += K.barrel(u, L, { x: 44, y: 252, s: 1.75, kind: 'powder', lying: true, flip: true, seed: 21 });
    fg += K.coil(u, L, { x: 160, y: 266, s: 1.6, turns: 4, seed: 33 });
    // the sea over the rail, then the lantern in front of everything and its glow
    fg += sheet(u, L);
    fg += K.lantern(u, L, Object.assign({}, lamp, { seed: 4 }));
    fg += K.localGlow(u, { x: 106, y: 44, color: '#ffb24a', power: .55, radius: 70 }, { core: false });
    return [bg, fg];
  } };
