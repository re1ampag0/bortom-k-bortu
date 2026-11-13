// «Жатва» (Летучий голландец, ПРИКАЗ: каждый вражеский корабль получает 1 урон по Команде), method A — a detailed
// copy of the first-round scene (portrait-dutch.cjs SCENES['Жатва']). The concept stays: the fallen give up their souls
// and the souls stream away, pale green, to the Dutchman — the old picture's three streams from three heaps into the
// bell. Now, as the brief asks (card-briefs.md «Жатва»), the harvest is taken from two enemy ships at once: night sea
// in the green fog, the two enemies near on either side (the Endeavour left, the Revenge right), men falling on their
// decks; over each deck the souls rise as little lights and draw out in long glowing ribbons, narrowing with distance,
// through the fog to the Dutchman lying between them further off, her ports and lantern green; where the ribbons meet,
// over her waist, her bell glows.
// Fixed against the first round: the souls came out of heaps of things on an empty deck and ran into a bell bigger than
// its frame — now they leave the men themselves, on two real ships, and the bell is the Dutchman's own, small on her
// belfry; the ships are the kit's, lit from behind by the moon in the fog (one light), the souls are the second light:
// their green falls on the sails and the water under them.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 92;                                                       // the horizon (behind the Dutchman's waterline)
const DU = { kind: 'dutch', x: 101, y: HZ + 4, scale: .56, detail: 'mid', lights: true, seed: 7 };
const EN = { kind: 'endeavour', x: 30, y: 132, scale: .54, detail: 'near', lights: true, seed: 4 };      // bow left, out of the frame
const RV = { kind: 'revenge', x: 172, y: 130, scale: .56, detail: 'near', lights: true, flip: true, seed: 6 }; // bow right
const BELL = { x: 101, y: 74 };                                      // where the ribbons meet: the bell over her waist
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 100, y: 16, el: 34, color: '#c8eadc', power: .5 }, fill: { color: '#2f5a50', power: .5 },
  rim: { az: 0, color: '#d8fff0', power: .4 }, locals: [{ x: 34, y: 96, color: '#9effd0', power: .45, radius: 40 }, { x: 166, y: 94, color: '#9effd0', power: .45, radius: 40 }, { x: BELL.x, y: BELL.y, color: '#9effd0', power: .5, radius: 30 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon in the fog behind the Dutchman (back light: dark hulls, glowing sails, a lit rim); the souls are the second light, green', items: [
  ['Dutchman', 60, HZ + 4, 80, 40, 'far sea'], ['bell glow', 92, 80, 18, 14, 'over her waist'],
  ['Endeavour', -10, 132, 80, 64, 'near sea, left'], ['Revenge', 128, 130, 82, 64, 'near sea, right'],
  ['souls rising', 10, 112, 60, 30, 'over the Endeavour deck'], ['souls rising', 136, 110, 60, 30, 'over the Revenge deck'],
  ['ribbons', 20, 60, 160, 60, 'in the air over the sea'], ['near sea', 0, 140, 200, 140, 'under the glass']] };

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
// a man falling on a deck, a small dark figure against the glow (the rail at (x, y)): 'slump' — hanging over the rail,
// 'fall' — going over backwards, arm thrown up; 'kneel' — sinking to his knees. Its own soul rises from it.
function man(x, y, s, pose, flip, col = '#0a1412') {
  const M = flip ? -1 : 1, T = (px, py) => [x + px * s * M, y + py * s], L = pts => 'M' + pts.map(p => P2(T(p[0], p[1]))).join('L');
  let out = '';
  if (pose === 'slump') out += `<path d="${L([[-1.2, 0], [-.6, -3.4], [1.6, -3.8], [3.2, -2], [3.6, .6], [2.4, 1.2], [1.4, -.8], [.6, 0]])}Z" fill="${col}"/>`   // the back bent over the rail
    + `<circle cx="${f(T(3.9, -.4)[0])}" cy="${f(T(3.9, -.4)[1])}" r="${f(1.3 * s)}" fill="${col}"/><path d="${L([[3, .4], [3.6, 3.4]])}" stroke="${col}" stroke-width="${f(1.1 * s)}" stroke-linecap="round"/>`
    + `<path d="${L([[-1, 0], [-1.6, 4.6]])}M${P2(T(.2, 0))}L${P2(T(.6, 4.6))}" stroke="${col}" stroke-width="${f(1.35 * s)}" stroke-linecap="round"/>`;
  if (pose === 'fall') out += `<path d="${L([[-.8, 0], [-2.6, -3.6], [-1.2, -4.6], [1, -1], [.8, .6]])}Z" fill="${col}"/>`
    + `<circle cx="${f(T(-2.9, -5.6)[0])}" cy="${f(T(-2.9, -5.6)[1])}" r="${f(1.25 * s)}" fill="${col}"/><path d="${L([[-1.6, -3.8], [-1.4, -6.6], [-.4, -8]])}" stroke="${col}" stroke-width="${f(1.05 * s)}" fill="none" stroke-linecap="round"/>`
    + `<path d="${L([[0, 0], [2.4, 2.4], [2.4, 4.6]])}M${P2(T(-.6, .2))}L${P2(T(-.2, 4.6))}" stroke="${col}" stroke-width="${f(1.35 * s)}" fill="none" stroke-linecap="round"/>`;
  if (pose === 'kneel') out += `<path d="${L([[-1, 0], [-.4, -4], [1.4, -4], [1.4, 0]])}Z" fill="${col}"/><circle cx="${f(T(.9, -5.2)[0])}" cy="${f(T(.9, -5.2)[1])}" r="${f(1.25 * s)}" fill="${col}"/>`
    + `<path d="${L([[-.6, 0], [-.4, 2.2], [2.6, 2.4]])}M${P2(T(1.2, -3.4))}L${P2(T(2.6, -1))}L${P2(T(2.8, .8))}" stroke="${col}" stroke-width="${f(1.25 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return out;
}

module.exports = { name: 'Жатва', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // ——— the night sky in the green fog, the moon behind the Dutchman, torn cloud ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 16, seed: 11 }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 80, 8, 3, .35], [168, 46, 70, 7, 8, .45], [70, 64, 60, 5, 5, .6], [150, 78, 50, 4, 12, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .4, seed: 13, glitter: 100 });
    // night: the fog's sky and sea pressed down to dusk, the moon's halo kept
    bg += `<rect width="200" height="290" fill="#0e2620" opacity=".5" style="mix-blend-mode:multiply"/>` + glow(u, 100, 16, 50, 34, '#c8eadc', .25);
    // ——— the Dutchman further off, between them, in the fog ———
    bg += K.ship(u, L, DU) + K.fog(u, L, { y: HZ - 10, h: 22, density: .4, seed: 4 });
    // her bell where the ribbons gather: a small bronze bell on a gallows over the waist, glowing from inside
    bg += `<path d="M${BELL.x - 5.4} ${BELL.y + 12}L${BELL.x - 4.6} ${BELL.y - 5}H${BELL.x + 4.6}L${BELL.x + 5.4} ${BELL.y + 12}" stroke="#101814" stroke-width="1.2" fill="none"/><path d="M${BELL.x - 6} ${BELL.y - 5.4}H${BELL.x + 6}" stroke="#101814" stroke-width="1.6"/>`
      + `<path d="M${BELL.x - 3.4} ${BELL.y + 4}Q${BELL.x - 3.2} ${BELL.y - 3.2} ${BELL.x} ${BELL.y - 3.6}Q${BELL.x + 3.2} ${BELL.y - 3.2} ${BELL.x + 3.4} ${BELL.y + 4}L${BELL.x + 4} ${BELL.y + 4.6}H${BELL.x - 4}Z" fill="#4a5a3a" stroke="#0a1008" stroke-width=".35"/>`
      + `<path d="M${BELL.x - 2.4} ${BELL.y + 3}Q${BELL.x - 2.2} ${BELL.y - 2} ${BELL.x - .6} ${BELL.y - 2.8}" stroke="#c8e8b0" stroke-width=".5" fill="none" opacity=".7"/><ellipse cx="${BELL.x}" cy="${BELL.y + 4.6}" rx="3.8" ry=".9" fill="#f4fff8"/>`;
    // the fog between her and the near ships: the depth
    bg += K.fog(u, L, { y: HZ + 2, h: 26, density: .5, seed: 9 });

    // ——— the two enemies near on either side; the souls' glow falls on their sails ———
    let mid = K.ship(u, L, EN) + K.ship(u, L, RV);
    const GE = K.shipGeom(EN.kind, EN), GR = K.shipGeom(RV.kind, RV);
    // the men on their decks: dark against the glow; the near-rail points carry them
    const onE = [[GE.nearRail(-12), 'slump', false, 1.6], [GE.nearRail(12), 'fall', false, 1.6], [GE.nearRail(34), 'kneel', true, 1.5]];
    const onR = [[GR.nearRail(-8), 'slump', true, 1.6], [GR.nearRail(14), 'kneel', false, 1.5], [GR.nearRail(36), 'fall', true, 1.6]];
    let men = '';
    for (const [p, pose, fl, s] of onE.concat(onR)) men += man(p[0], p[1] - .4, s, pose, fl);
    mid += men;

    // ——— the souls: from each man a light rises; over each deck they draw out into ribbons to the bell ———
    let souls = '';
    const bl = nid('rb', u), bs = nid('rs', u), rg = nid('rg', u);
    souls += `<defs><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="${bs}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`;
    const R = rng(17), T = [BELL.x, BELL.y + 1];
    // each side's souls gather at a junction over the sea and run on as one wider stream into the bell
    const J = { 1: [70, 62], '-1': [134, 60] };
    const streams = [];
    for (const [list, side] of [[onE, 1], [onR, -1]]) list.forEach(([p], i) => {
      const j = J[side], s0 = [p[0] + side * 1.5, p[1] - 21 - i * 3];           // the soul risen out of the man, over him
      const B = [s0[0] - side * (2 - i * 3), s0[1] - 18 - (2 - i) * 6], C = [j[0] - side * (16 + i * 4), j[1] - 8 + (i - 1) * 7];
      streams.push({ A: s0, B, C, D: j, p, side, i, w0: 4.6, w1: 3 }); });
    const trunks = [[J[1], [84, 50], [92, 62], T, 1], [J['-1'], [120, 48], [110, 62], T, -1]].map(([A, B, C, D, side]) => ({ A, B, C, D, side, w0: 6.4, w1: 2.2 }));
    // the glowing ribbons (wide and blurred, then the bright thread in them), wider near us, thin into the distance
    for (const { A, B, C, D, w0, w1, i } of streams.concat(trunks)) {
      const ph = R() * 6, wb = i == null ? .8 : 1.6;
      souls += `<path d="${ribbon(A, B, C, D, w0 * 1.6, w1 * 1.4, 36, wb, ph)}" fill="#9effd0" opacity=".26" filter="url(#${bl})" style="mix-blend-mode:screen"/>`
        + `<path d="${ribbon(A, B, C, D, w0 * .5, w1 * .45, 36, wb, ph)}" fill="#e4fff2" opacity=".55" filter="url(#${bs})" style="mix-blend-mode:screen"/>`; }
    // the wisp from each man up into his light; a few lights strung along the ribbons, smaller towards her
    for (const { A, B, C, D, p, side } of streams) {
      souls += `<path d="M${P2([p[0], p[1] - 5])}Q${P2([p[0] - side * 4, p[1] - 13])} ${P2(A)}" stroke="#bff8e0" stroke-width="2.6" fill="none" opacity=".45" filter="url(#${bl})" style="mix-blend-mode:screen"/>`
        + `<path d="M${P2([p[0], p[1] - 5])}Q${P2([p[0] - side * 4, p[1] - 13])} ${P2(A)}" stroke="#e4fff2" stroke-width=".6" fill="none" opacity=".5" stroke-dasharray="1.4 1.8" style="mix-blend-mode:screen"/>`;
      souls += soulLight(u, A[0], A[1], 1.9, -90, 1);
      { const t = .5 + R() * .15, q = bez(A, B, C, D, t), q2 = bez(A, B, C, D, t + .02), dir = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI; souls += soulLight(u, q[0], q[1], 1.3, dir, .85); } }
    for (const { A, B, C, D } of trunks) for (const t of [.3, .65]) { const q = bez(A, B, C, D, t), q2 = bez(A, B, C, D, t + .02), dir = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI; souls += soulLight(u, q[0], q[1], lerp(1.2, .8, t), dir, .8); }
    // where they meet: the bell's glow
    souls += `<defs>${radGrad(rg, T[0], T[1], 16, [[0, '#ffffff', .9], [.2, '#bff8e0', .55], [.6, '#6ae8b8', .18], [1, '#3adca0', 0]])}</defs><circle cx="${T[0]}" cy="${T[1]}" r="16" fill="url(#${rg})" style="mix-blend-mode:screen"/>`;

    // ——— light and air: the souls' green on the water under the ships, motes, the gloom under the glass ———
    let fg = K.localGlow(u, { x: 34, y: 136, color: '#7effc0', power: .3, radius: 34 }, { squash: .3, core: false })
      + K.localGlow(u, { x: 166, y: 134, color: '#7effc0', power: .3, radius: 34 }, { squash: .3, core: false })
      + glow(u, 36, 106, 34, 20, '#9effd0', .18) + glow(u, 164, 104, 34, 20, '#9effd0', .18)
      + K.fog(u, L, { y: 128, h: 24, density: .35, seed: 21 }) + motes(18, 20, 50, 160, 80, '#dffff0', 5)
      + gloom(u, 100, 140, 100, 280, .55, '#020806') + gloom(u, 100, 60, 100, 0, .25, '#020806');
    return [bg + mid, souls + fg];
  } };
