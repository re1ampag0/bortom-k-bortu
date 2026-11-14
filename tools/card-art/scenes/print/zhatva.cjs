// «Жатва» (Летучий голландец, ПРИКАЗ: каждый вражеский корабль получает 1 урон по Команде), method A — a detailed
// copy of the first-round scene (portrait-dutch.cjs SCENES['Жатва']). The concept stays: the old picture's big bell
// on its beam, the souls streaming up into it. Now, as the brief asks (card-briefs.md «Жатва»), the harvest is taken
// from two enemy ships at once: we stand on the Dutchman, under her bell hung from the beam overhead; night sea in the
// green fog, the two enemies near on either side (the Endeavour left, the Revenge right), their men falling on their
// decks behind the bulwark; over each the soul rises as a little light and draws out in a glowing ribbon through the
// fog into the bell's mouth — «the bell tolls for all at once».
// Fixed against the first round: the souls came out of heaps of things on an empty deck — now they leave the men
// themselves, on two real ships. Correction pass after review (verdict-b4): the bell is big again (≈ ¼ of the card's
// width, top centre, under the beam — the far Dutchman is gone: we are on her); the sailors are small (about the
// bulwark plus one gun deck), whole (heads, hands, clothes, folds), standing on the deck behind the bulwark (clipped
// at the rail), in falling poses (thrown back, sinking to the knees, hanging on the shrouds, clutching the throat);
// the ribbons are no longer a mirrored fountain — each its own length, bend and width, all converging on the mouth;
// the two ships moved in from the card's edges.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 92;                                                       // the horizon
const EN = { kind: 'endeavour', x: 44, y: 132, scale: .54, detail: 'near', lights: true, seed: 4 };      // bow left
const RV = { kind: 'revenge', x: 157, y: 130, scale: .56, detail: 'near', lights: true, flip: true, seed: 6 }; // bow right
const BEAM = 12;                                                     // the underside of the overhead beam
const BELL = { x: 100, y: BEAM + 9, s: 3.3, rot: -5 };               // crown at (x, y); the mouth 13·s below
const BP = (lx, ly) => { const a = BELL.rot * Math.PI / 180; return [BELL.x + (lx * Math.cos(a) - ly * Math.sin(a)) * BELL.s, BELL.y + (lx * Math.sin(a) + ly * Math.cos(a)) * BELL.s]; };
const MOUTH = BP(0, 13);                                             // where the ribbons go in
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 150, y: 54, el: 30, color: '#c8eadc', power: .5 }, fill: { color: '#2f5a50', power: .5 },
  rim: { az: 0, color: '#d8fff0', power: .4 }, locals: [{ x: 40, y: 100, color: '#9effd0', power: .45, radius: 40 }, { x: 160, y: 100, color: '#9effd0', power: .45, radius: 40 }, { x: MOUTH[0], y: MOUTH[1] + 4, color: '#9effd0', power: .6, radius: 34 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon in the fog (back light: dark hulls, glowing sails); the souls and the bell mouth are the second light, green from below', items: [
  ['beam', 0, 3, 200, 10, 'overhead, the Dutchman'], ['bell', 78, 21, 44, 44, 'top centre, hung from the beam'],
  ['Endeavour', -7, 72, 90, 60, 'near sea, left'], ['Revenge', 117, 77, 84, 53, 'near sea, right'],
  ['sailors', 16, 108, 60, 14, 'behind the Endeavour bulwark'], ['sailors', 138, 110, 50, 14, 'behind the Revenge bulwark'],
  ['ribbons', 20, 60, 160, 50, 'from the men up into the bell mouth'], ['near sea', 0, 140, 200, 140, 'under the glass']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const bez = (A, B, C, D, t) => { const a = 1 - t; return [0, 1].map(j => a * a * a * A[j] + 3 * a * a * t * B[j] + 3 * a * t * t * C[j] + t * t * t * D[j]); };
// KIT-CANDIDATE ribbon: a band along a cubic from A to D, width w0 at A to w1 at D, as a closed path
// (wob: a sideways wave of that amplitude along it, ph its phase — a wisp, not a wire)
function ribbon(A, B, C, D, w0, w1, n = 28, wob = 0, ph = 0) {
  const S = Array.from({ length: n + 1 }, (_, i) => bez(A, B, C, D, i / n)), Lf = [], Rt = [];
  for (let i = 0; i <= n; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, t = i / n;
    const w = lerp(w0, w1, t) / 2 * (1 + .25 * Math.sin(t * 17 + ph)), o = wob * Math.sin(t * 9.4 + ph) * Math.sin(Math.PI * t), c = [S[i][0] - dy / l * o, S[i][1] + dx / l * o];
    Lf.push([c[0] - dy / l * w, c[1] + dx / l * w]); Rt.push([c[0] + dy / l * w, c[1] - dx / l * w]); }
  return 'M' + Lf.map(P2).join('L') + 'L' + Rt.reverse().map(P2).join('L') + 'Z';
}
// KIT-CANDIDATE soulLight: a soul as a little light — a soft green halo, a white core, a short tail trailing behind it
// along -dir (the way it came)
function soulLight(u, x, y, r, dir, op = 1) {
  const a = dir * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, tl = r * 5.5, g = nid('so', u), t = nid('st', u);
  return `<defs>${radGrad(g, x, y, r * 4.2, [[0, '#e8fff4', .75 * op], [.25, '#9effd0', .4 * op], [1, '#4ae0a8', 0]])}${linGrad(t, x, y, x - ux * tl, y - uy * tl, [[0, '#d8fff0', .7 * op], [1, '#9effd0', 0]])}</defs>`
    + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 4.2)}" fill="url(#${g})" style="mix-blend-mode:screen"/>`
    + `<path d="M${P2([x + nx * r * .8, y + ny * r * .8])}Q${P2([x - ux * tl * .5 + nx * r * .5, y - uy * tl * .5 + ny * r * .5])} ${P2([x - ux * tl, y - uy * tl])}Q${P2([x - ux * tl * .5 - nx * r * .5, y - uy * tl * .5 - ny * r * .5])} ${P2([x - nx * r * .8, y - ny * r * .8])}Z" fill="url(#${t})" style="mix-blend-mode:screen"/>`
    + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#f4fff8" opacity="${f(.95 * op)}"/>`;
}
// barnacles and weed on the beam and the bronze (as on the Dutchman's bell card)
function barnacles(u, x, y, n, s, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, bx - r, 0, bx + r, 0, [[0, '#3a4034', 1], [.4, '#8a907a', 1], [1, '#c8ccb4', 1]])}</defs>`
      + `<ellipse cx="${f(bx - r * .4)}" cy="${f(by + r * .5)}" rx="${f(r * 1.2)}" ry="${f(r * .6)}" fill="#050c0a" opacity=".45"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#3a3c2e" stroke-width=".25"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#1a1c14"/>`; }
  return out;
}
function weed(x, y, len, n, seed, col = '#3e7a5a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.6 + R() * .7)}" fill="none" stroke-linecap="round" opacity=".85"/>`
      + `<path d="M${f(x0 + .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#9ad8b0" stroke-width=".25" fill="none" opacity=".45"/>`; }
  return out;
}

// a sailor on the deck behind the bulwark: drawn whole in his own units (feet at 0, head ~7.3 up, the rail at -3.3),
// then clipped at the rail so only what shows over the bulwark is seen. A pose is a spine (hip H → shoulders S), a
// head and two arms (shoulder side, elbow, hand). Backlit by the moon, lit green from above by the souls.
const POSES = {
  back:   { H: [0, -3.3], S: [-.75, -5.6], head: [-1.35, -6.2], tilt: -38, arms: [[-1, [-1.8, -6.6], [-2.05, -7.65]], [1, [.45, -4.7], [-.15, -5.05]]] },     // thrown back, an arm flung up, a hand to his chest
  kneel:  { H: [0, -1.5], S: [.35, -3.85], head: [.8, -4.35], tilt: 30, arms: [[-1, [-.2, -3.0], [-.35, -3.45]], [1, [1.25, -3.05], [1.45, -3.45]]] },      // sunk to his knees, hands on the rail, head bowed
  shroud: { H: [0, -3.1], S: [.45, -5.4], head: [.95, -5.7], tilt: 34, arms: [[-1, [-.55, -6.5], [-.75, -7.55]], [1, [1.0, -4.5], [1.05, -3.75]]] },      // hanging on the shrouds by one hand, sagging
  throat: { H: [0, -3.3], S: [.3, -5.75], head: [.55, -6.3], tilt: 14, arms: [[-1, [-.35, -4.7], [.45, -5.95]], [1, [1.45, -5.0], [2.3, -5.45]]] },       // clutching his throat, the other arm groping out
};
function sailor(u, x, railY, s, pose, flip, C) {
  const P = POSES[pose], M = flip ? -1 : 1, deck = railY + 3.3 * s, cid = nid('sc', u);
  const [hx, hy] = P.H, [sx, sy] = P.S, dl = Math.hypot(sx - hx, sy - hy), dx = (sx - hx) / dl, dy = (sy - hy) / dl, nx = -dy, ny = dx;
  const sh = e => [sx + nx * .82 * e, sy + ny * .82 * e + .08], hp = e => [hx + nx * .55 * e, hy + ny * .55 * e];
  const neck = [sx + dx * .25, sy + dy * .25], [cx, cy] = P.head;
  let b = '';
  // the arm behind the body first if it crosses it (the hand to the chest / throat), else after
  const arm = ([e, el, ha]) => { const s0 = sh(e);
    return `<path d="M${P2(s0)}L${P2(el)}" stroke="${C.coat}" stroke-width=".56" stroke-linecap="round"/><path d="M${P2(el)}L${P2(ha)}" stroke="${C.coat}" stroke-width=".46" stroke-linecap="round"/>`
      + `<path d="M${P2(s0)}L${P2(el)}L${P2(ha)}" stroke="${C.rim}" stroke-width=".12" fill="none" opacity=".55" transform="translate(0 -.18)"/>`
      + `<path d="M${P2([lerp(el[0], ha[0], .78), lerp(el[1], ha[1], .78)])}L${P2([lerp(el[0], ha[0], .86), lerp(el[1], ha[1], .86)])}" stroke="${C.shirt}" stroke-width=".52"/>`   // the cuff
      + `<circle cx="${f(ha[0])}" cy="${f(ha[1])}" r=".27" fill="${C.skin}"/><path d="M${P2([ha[0] - .2, ha[1] - .1])}l.12 -.22" stroke="${C.skin}" stroke-width=".14" stroke-linecap="round"/>`; };
  // legs (hidden by the bulwark, but drawn so he stands on the deck)
  b += `<path d="M${P2(hp(-1))}L${P2([hx - .5, 0])}M${P2(hp(1))}L${P2([hx + .5, 0])}" stroke="#1a1c1e" stroke-width=".6"/>`;
  // the torso: a jacket open on a pale shirt, a belt, a fold from the shoulder
  const torso = [sh(-1), sh(1), hp(1), hp(-1)];
  b += `<path d="M${P2(torso[0])}Q${P2([sx + dx * .25, sy + dy * .25])} ${P2(torso[1])}L${P2(torso[2])}L${P2(torso[3])}Z" fill="${C.coat}" stroke="#060808" stroke-width=".1"/>`
    + `<path d="M${P2([sx + nx * .3, sy + ny * .3])}L${P2([hx + nx * .22, hy + ny * .22])}L${P2([hx - nx * .2, hy - ny * .2])}L${P2([sx - nx * .28, sy - ny * .28])}Z" fill="${C.shirt}"/>`
    + `<path d="M${P2([hx + nx * .58 + dx * .35, hy + ny * .58 + dy * .35])}L${P2([hx - nx * .58 + dx * .35, hy - ny * .58 + dy * .35])}" stroke="#14100c" stroke-width=".26"/>`
    + `<path d="M${P2([sx + nx * .55, sy + ny * .55 + .2])}Q${P2([sx + nx * .2 - dx * .8, sy + ny * .2 - dy * .8])} ${P2([hx + nx * .35 + dx * .6, hy + ny * .35 + dy * .6])}" stroke="#0a0c0c" stroke-width=".1" fill="none" opacity=".6"/>`
    + `<path d="M${P2(sh(-1))}Q${P2([sx + dx * .3, sy + dy * .3])} ${P2(sh(1))}" stroke="${C.rim}" stroke-width=".2" fill="none" opacity=".85"/>`;
  // the neck and head: skin, hair, a kerchief; tilted with the pose; the green from above on the crown
  b += `<path d="M${P2(neck)}L${P2([lerp(neck[0], cx, .6), lerp(neck[1], cy, .6)])}" stroke="${C.skin}" stroke-width=".34"/>`
    + `<g transform="rotate(${P.tilt} ${f(cx)} ${f(cy)})"><ellipse cx="${f(cx)}" cy="${f(cy)}" rx=".44" ry=".52" fill="${C.skin}"/>`
    + `<path d="M${f(cx - .46)} ${f(cy - .02)}Q${f(cx - .4)} ${f(cy - .62)} ${f(cx + .05)} ${f(cy - .6)}Q${f(cx + .46)} ${f(cy - .52)} ${f(cx + .44)} ${f(cy - .12)}Q${f(cx + .1)} ${f(cy - .32)} ${f(cx - .46)} ${f(cy - .02)}Z" fill="${C.hat}"/>`
    + `<path d="M${f(cx - .4)} ${f(cy - .4)}Q${f(cx)} ${f(cy - .72)} ${f(cx + .38)} ${f(cy - .42)}" stroke="${C.rim}" stroke-width=".14" fill="none" opacity=".8"/>`
    + `<path d="M${f(cx + .2)} ${f(cy + .12)}h.18" stroke="#2a1a14" stroke-width=".08" opacity=".7"/></g>`;
  const [a0, a1] = P.arms; b += arm(a0) + arm(a1);
  return `<defs><clipPath id="${cid}"><rect x="${f(x - 14)}" y="0" width="28" height="${f(railY - .15)}"/></clipPath></defs>`
    + `<g clip-path="url(#${cid})"><g transform="translate(${f(x)} ${f(deck)}) scale(${f(M * s)} ${f(s)})">${b}</g></g>`;
}
// where a pose's soul leaves him (his chest) and where his raised hand is, in scene units
const at = (x, railY, s, pose, flip, p) => { const M = flip ? -1 : 1; return [x + p[0] * s * M, railY + 3.3 * s + p[1] * s]; };

module.exports = { name: 'Жатва', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // ——— the night sky in the green fog, the moon low on the right, torn cloud ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 16, seed: 11 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 80, 8, 3, .35], [168, 40, 70, 7, 8, .45], [70, 70, 60, 5, 5, .6], [140, 80, 50, 4, 12, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .4, seed: 13, glitter: 100 });
    bg += `<rect width="200" height="290" fill="#0e2620" opacity=".5" style="mix-blend-mode:multiply"/>` + glow(u, 150, 54, 40, 30, '#c8eadc', .22);
    bg += K.fog(u, L, { y: HZ - 10, h: 22, density: .45, seed: 4 }) + K.fog(u, L, { y: HZ + 2, h: 24, density: .4, seed: 9 });

    // ——— the two enemies near on either side, moved in from the edges ———
    let mid = K.ship(u, L, EN) + K.ship(u, L, RV);
    const GE = K.shipGeom(EN.kind, EN), GR = K.shipGeom(RV.kind, RV);
    // the crews: muted navy blue on the Endeavour, pirates' reds and stripes on the Revenge
    const CE = [{ coat: '#26364a', shirt: '#9aa8a2', skin: '#a8907a', hat: '#141a22', rim: '#c8ffe4' }, { coat: '#2c3a4c', shirt: '#b0b8ae', skin: '#9a8470', hat: '#2a2018', rim: '#c8ffe4' }, { coat: '#3a3a40', shirt: '#a4aca4', skin: '#ae967e', hat: '#141a22', rim: '#c8ffe4' }];
    const CR = [{ coat: '#4a2a24', shirt: '#a89e8a', skin: '#a08068', hat: '#7a2a22', rim: '#c8ffe4' }, { coat: '#3a3226', shirt: '#b4aa92', skin: '#8e7460', hat: '#1a1410', rim: '#c8ffe4' }, { coat: '#2e2a2a', shirt: '#9c9682', skin: '#a68a70', hat: '#6a3a1a', rim: '#c8ffe4' }];
    const S = 1.3, men = [];
    for (const [G, X, pose, fl, C] of [[GE, -40, 'back', false, CE[0]], [GE, -11, 'kneel', false, CE[1]], [GE, 17, 'shroud', true, CE[2]],
      [GR, 22, 'throat', true, CR[0]], [GR, -11, 'kneel', true, CR[1]], [GR, -44, 'back', true, CR[2]]]) { const p = G.nearRail(X); men.push({ x: p[0], y: p[1], pose, fl, C }); }
    for (const m of men) {
      // the shroud he hangs on: a line from his raised hand up towards the masthead and down to the rail
      if (m.pose === 'shroud') { const h = at(m.x, m.y, S, m.pose, m.fl, POSES.shroud.arms[0][2]); mid += `<path d="M${P2([h[0] + 3.4, h[1] - 14])}L${P2([h[0] - 1.6, m.y + .2])}" stroke="#0e1210" stroke-width=".32"/>`; }
      mid += sailor(u, m.x, m.y, S, m.pose, m.fl, m.C); }

    // ——— the beam overhead and the bell: we stand on the Dutchman, under her bell ———
    let top = K.shadeCyl(u, -6, BEAM - 4.6, 206, BEAM - 4.6, 5, L, 'oak', { outline: .5, ell: .35, face: 1, seed: 21 });
    for (const x of [87, 113]) top += K.shadeCyl(u, x, BEAM - 9.6, x, BEAM + 1.2, 1.3, L, 'iron', { outline: .3 });
    top += barnacles(u, 62, BEAM - 7, 3, 1, 31) + barnacles(u, 146, BEAM - 6, 4, .9, 32) + weed(70, BEAM, 16, 3, 33) + weed(132, BEAM, 11, 2, 34) + weed(168, BEAM - 1, 18, 2, 35, '#2e6a4a');
    top += K.shadeBox(u, [{ pts: [[90, BEAM + 1], [110, BEAM + 1], [110, BEAM + 7], [90, BEAM + 7]], n: 'front' }], L, 'oak', { seed: 40 })
      + K.shadeCyl(u, 100, BEAM + 6, 100, BEAM + 10, 2.2, L, 'iron', { outline: .35 });
    const prof = [[0, 2.3], [.05, 3.2], [.12, 3.65], [.3, 3.9], [.5, 4.2], [.68, 4.75], [.82, 5.5], [.92, 6.2], [.975, 6.55], [1, 6.6]], HB = 13;
    const side = e => prof.map(([t, r]) => [e * r, t * HB]), bd = 'M' + [...side(-1), ...side(1).reverse()].map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
    const BT = `translate(${BELL.x} ${BELL.y}) rotate(${BELL.rot}) scale(${BELL.s})`;
    top += `<g transform="${BT}"><path d="${bd}" fill="#26342a"/><ellipse cx="0" cy="13" rx="6.6" ry="1.4" fill="#26342a"/></g>`;
    top += K.bell(u, L, { ...BELL, frame: false, clapper: false, seed: 5 });
    { const cid = nid('bp', u), pg = nid('pa', u), mo = nid('mo', u), gl = nid('gl', u), mc = nid('mc', u), lb = nid('lb', u);
      top += `<g transform="${BT}"><defs><clipPath id="${cid}"><path d="${bd}"/></clipPath>${linGrad(pg, 0, 0, 0, 13, [[0, '#5ac8a0', .4], [.5, '#3a9a7a', .2], [1, '#2a7a60', .45]])}`
        + `${linGrad(gl, 0, 13, 0, 4, [[0, '#9effd0', .55], [.5, '#6ae8b8', .15], [1, '#6ae8b8', 0]])}</defs><g clip-path="url(#${cid})">`
        // verdigris runs down the bronze; the souls' green lights the skirt from below
        + `<path d="M-2.2 1.2Q-1.6 6 -3.6 13M1.4 .6Q2.4 5 1.6 9Q1 11.6 2.4 13M3.4 4Q4.4 8 4.2 13M-4 7Q-5 10 -5.6 13" stroke="url(#${pg})" stroke-width=".9" fill="none" stroke-linecap="round"/>`
        + `<rect x="-7" y="4" width="14" height="10" fill="url(#${gl})" style="mix-blend-mode:screen"/>`
        + `<path d="M-6.6 11.6Q0 12.8 6.6 11.6V13.4H-6.6Z" fill="#3a9a7a" opacity=".4"/></g>`
        // we look up into the mouth: inside, the light the souls bring
        + `<defs>${radGrad(mo, 0, 13, 6.45, [[0, '#f4fff8', 1], [.35, '#9effd0', 1], [.8, '#2a6a54', 1], [1, '#0a1a14', 1]])}<clipPath id="${mc}"><ellipse cx="0" cy="13" rx="6.45" ry="1.25"/></clipPath>`
        + `<filter id="${lb}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation=".35"/></filter></defs>`
        + `<ellipse cx="0" cy="13" rx="6.45" ry="1.25" fill="url(#${mo})"/>`
        + `<g clip-path="url(#${mc})"><path d="M.6 11.2L1.2 12.9" stroke="#0a0e0c" stroke-width=".6"/><circle cx="1.2" cy="13" r="1.1" fill="#1a2420"/></g>`
        + `<path d="M-6.4 13.1Q0 14.5 6.4 13.1" stroke="#9effd0" stroke-width="1" fill="none" opacity=".7" filter="url(#${lb})"/>`
        + `<path d="M-6.4 13.1Q0 14.5 6.4 13.1" stroke="#e0fff0" stroke-width=".3" fill="none" opacity=".85"/></g>`;
      const b1 = BP(4.4, 8.6), b2 = BP(-3.8, 5), w1 = BP(5.8, 10.8);
      top += barnacles(u, b1[0], b1[1], 4, 1.1, 51) + barnacles(u, b2[0], b2[1], 2, .9, 52) + weed(w1[0], w1[1], 12, 3, 53, '#2e6a4a'); }

    // ——— the souls: from each man a light rises and draws out in its own ribbon into the bell's mouth ———
    let souls = '';
    const bl = nid('rb', u), bs = nid('rs', u), rg = nid('rg', u);
    souls += `<defs><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter><filter id="${bs}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".6"/></filter></defs>`;
    const R = rng(17), Mx = MOUTH[0], My = MOUTH[1] + 1.2;
    // each ribbon its own: [rise above the man, bend 1, bend 2, entry offset at the mouth, width near, width at the bell, wobble]
    const shape = [
      [11, [-6, -30], [34, 70], -4.5, 4.4, 1.4, 1.8],     // Endeavour aft: a long high loop out over her quarter and in
      [8, [6, -10], [72, 94], -2.2, 3.4, 1.2, 1.1],       // Endeavour waist: low and flat across the sea
      [9, [2, -16], [86, 82], -.6, 3.8, 1.3, .7],         // Endeavour forward of the main: short, straight up into it
      [7, [-4, -20], [116, 86], 1.4, 3.6, 1.3, 1.4],      // Revenge waist: short S
      [10, [10, -6], [140, 98], 3.2, 4.2, 1.5, 2.2],      // Revenge mid: long, low, swinging out wide first
      [13, [4, -34], [150, 52], 4.6, 3.2, 1.1, 1],        // Revenge forward: tall rise, then a long fall in over the lip
    ];
    const strands = men.map((m, i) => { const [rise, b1, c2, off, w0, w1, wb] = shape[i], hd = at(m.x, m.y, S, m.pose, m.fl, POSES[m.pose].head), A = [hd[0], Math.min(hd[1] - 4, m.y - rise - 3)], D = [Mx + off, My];
      return { A, B: [A[0] + b1[0], A[1] + b1[1]], C: c2, D, w0, w1, wb, m, hd }; });
    for (const { A, B, C, D, w0, w1, wb } of strands) {
      const ph = R() * 6;
      souls += `<path d="${ribbon(A, B, C, D, w0 * 1.6, w1 * 1.5, 40, wb, ph)}" fill="#9effd0" opacity=".26" filter="url(#${bl})" style="mix-blend-mode:screen"/>`
        + `<path d="${ribbon(A, B, C, D, w0 * .5, w1 * .5, 40, wb, ph)}" fill="#e4fff2" opacity=".6" filter="url(#${bs})" style="mix-blend-mode:screen"/>`; }
    for (const { A, B, C, D, m, hd } of strands) {
      const ch = [hd[0], hd[1] - 1.2];                                // out of him, over his head (not over his body)
      souls += `<path d="M${P2(ch)}Q${P2([lerp(ch[0], A[0], .5) + (m.fl ? 1.5 : -1.5), lerp(ch[1], A[1], .5)])} ${P2(A)}" stroke="#bff8e0" stroke-width="1.6" fill="none" opacity=".3" filter="url(#${bl})" style="mix-blend-mode:screen"/>`
        + `<path d="M${P2(ch)}Q${P2([lerp(ch[0], A[0], .5) + (m.fl ? 1.5 : -1.5), lerp(ch[1], A[1], .5)])} ${P2(A)}" stroke="#e4fff2" stroke-width=".4" fill="none" opacity=".4" stroke-dasharray="1.2 1.6" style="mix-blend-mode:screen"/>`;
      souls += soulLight(u, A[0], A[1], 1.4, -90, .9);
      const t = .45 + R() * .2, q = bez(A, B, C, D, t), q2 = bez(A, B, C, D, t + .02), dir = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI; souls += soulLight(u, q[0], q[1], 1.2, dir, .85); }
    // the glow at the mouth, where they all go in
    souls += `<defs>${radGrad(rg, Mx, My + 1, 18, [[0, '#ffffff', .8], [.2, '#bff8e0', .5], [.6, '#6ae8b8', .16], [1, '#3adca0', 0]])}</defs><ellipse cx="${f(Mx)}" cy="${f(My + 1)}" rx="18" ry="12" fill="url(#${rg})" style="mix-blend-mode:screen"/>`;

    // ——— light and air ———
    let fg = K.localGlow(u, { x: 40, y: 136, color: '#7effc0', power: .3, radius: 32 }, { squash: .3, core: false })
      + K.localGlow(u, { x: 160, y: 134, color: '#7effc0', power: .3, radius: 32 }, { squash: .3, core: false })
      + glow(u, Mx, 100, 26, 30, '#9effd0', .12)
      + K.fog(u, L, { y: 128, h: 24, density: .35, seed: 21 }) + motes(18, 20, 40, 160, 90, '#dffff0', 5)
      + gloom(u, 100, 140, 100, 280, .55, '#020806');
    return [bg + mid, souls + top + fg];
  } };
