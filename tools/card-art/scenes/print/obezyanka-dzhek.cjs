// «Обезьянка Джек» (Жемчужина, ПРИКАЗ: возьмите случайную карту из руки игрока-противника), variant A of the method
// trial (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-pearl.cjs SCENES['Обезьянка
// Джек']) at its best. Night in the cabin: the monkey in its little red coat stands on the near edge of the table
// and holds up the card it has just pulled out of the hand spread on the table (a gap in the fan where it was); the
// moon through the side window throws its shadow on the back wall — a monkey skeleton in the same pose.
// Fixed against the first round: the window hung skewed on a flat wall — now it is in the side wall and its light
// falls on the back wall as a pale patch with the shadow inside it (the shadow agrees with the pose and the light);
// the table top ran on into the floor — now it has a front edge and the dark under it; the tail was a loose stroke —
// it grows from the body; the coins and the mug stand on the table with shadows; the monkey has fur, volume, a lit
// side to the moon and a warm rim from the candle stub on the right.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, shafts, motes, tableTop } = PK;

const HZ = 70, TB = 92, TF = 128;                 // eye level; the table top: back edge (at the wall), front edge
const MK = { x: 92, y: 127, s: 1.08 };            // the monkey's feet on the near edge of the table
const CS = { x: 190, y: 116, s: 1.3, len: 5 };    // a candle stub at the right end of the table (the warm rim)
const light = { time: 'night', haze: .3, key: { type: 'moon', az: 290, el: 14, color: '#cfe0ff', power: .85 }, fill: { color: '#2e4466', power: .35 },
  rim: { az: 70, color: '#ffb860', power: .45 }, locals: [{ x: CS.x, y: CS.y - 15, color: '#ffb050', power: .6, radius: 60 }] };
const skel = { horizon: HZ, eye: 1.2, light: 'the moon through the side window on the left (low, from the left): the shadow falls on the back wall to the right; candle stub on the right = warm rim', items: [
  ['window', 4, 82, 22, 48, 'left side wall'], ['moon patch', 108, 88, 76, 66, 'back wall'], ['skeleton shadow', 116, 86, 60, 58, 'back wall, in the patch'],
  ['monkey', 70, MK.y, 46, 62, 'stands on the table near edge'], ['card', 106, 70, 16, 22, 'in its raised paw'],
  ['fan', 124, 118, 64, 18, 'table top'], ['coins', 112, 124, 22, 8, 'table top'], ['mug', 162, 108, 14, 14, 'table top'], ['candle stub', 182, 116, 16, 16, 'table top']] };

const lerp = (a, b, t) => a + (b - a) * t;
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// a playing card seen face up: cream card, a picture box and lines of type (no letters), a gilt edge
function card(u, x, y, a, s, sy = 1, lit = .5) {
  const g = nid('cd', u), pp = nid('cp', u);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)} ${f(s * sy)})">`
    + `<defs>${linGrad(g, -7, -10, 7, 10, [[0, mix('#c8b48c', '#f6ecd2', lit), 1], [1, mix('#8a7656', '#d8c8a4', lit), 1]])}${linGrad(pp, 0, -8, 0, 0, [[0, '#7a5a3a', 1], [1, '#a8784a', 1]])}</defs>`
    + `<rect x="-7" y="-10" width="14" height="20" rx="1.2" fill="url(#${g})" stroke="#4a3a24" stroke-width=".35"/>`
    + `<rect x="-5.6" y="-8.6" width="11.2" height="8.6" rx=".5" fill="url(#${pp})" stroke="#5a4428" stroke-width=".25"/>`
    + `<path d="M-4.6 -2.4q2 -3 4 -1.6q2 -2.4 4.4 .6" stroke="#e8c890" stroke-width=".45" fill="none" opacity=".8"/><circle cx="2.8" cy="-6.4" r="1" fill="#f0d8a0" opacity=".8"/>`
    + `<path d="M-5 2.4h10M-5 4.6h8.6M-5 6.8h9.4" stroke="#6a5a40" stroke-width=".55" opacity=".7"/><rect x="-6.4" y="-9.4" width="12.8" height="18.8" rx=".8" fill="none" stroke="#b08a3a" stroke-width=".3" opacity=".8"/>`
    + `<path d="M-6.8 -9.8h13.4" stroke="#fffaf0" stroke-width=".35" opacity=".6"/></g>`;
}
// the monkey: local units, origin between its feet, y up is negative. Lit from the left (the moon), a warm rim on
// the right (the candle). The right paw (our right) is raised with the card; the left hangs and holds the coat.
function monkey(u, L, o) {
  const { x, y, s } = o, id = k => nid(k, u), R = rng(7);
  const fur = id('fu'), furD = id('fd'), face = id('fa'), coat = id('co'), coatS = id('cs'), ear = id('ea');
  let out = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`
    + `<defs>${radGrad(fur, -6, -44, 18, [[0, '#a8794c', 1], [.55, '#6e4626', 1], [1, '#3a2210', 1]])}${linGrad(furD, -10, 0, 10, 0, [[0, '#8a6038', 1], [.6, '#4a2c16', 1], [1, '#7a4a24', 1]])}`
    + `${radGrad(face, -1.5, -46, 9, [[0, '#f8e6c8', 1], [.7, '#d8b08a', 1], [1, '#a87a56', 1]])}${radGrad(ear, 0, 0, 4, [[0, '#d8a888', 1], [1, '#7a4a30', 1]])}`
    + `${linGrad(coat, -14, 0, 14, 0, [[0, '#d8483a', 1], [.35, '#b8302a', 1], [.75, '#6a1410', 1], [.92, '#8a2418', 1], [1, '#c8582e', 1]])}${linGrad(coatS, 0, -36, 0, -10, [[0, '#000', 0], [1, '#000', .3]])}</defs>`;
  // the tail grows from under the coat tails at the back and curls up behind on the left
  const tail = 'M-5 -14C-16 -10 -26 -14 -27 -26C-28 -36 -20 -42 -14 -38C-10 -35 -12 -30 -16 -31';
  out += `<path d="${tail}" stroke="#2a1608" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="${tail}" stroke="url(#${furD})" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
    + `<path d="M-8 -12.6C-17 -10 -25 -15 -25.6 -26C-26 -33 -21 -39 -16 -37.6" stroke="#c8966a" stroke-width=".6" fill="none" opacity=".7"/>`;
  // legs, crouched a little, and the long feet gripping the table edge (toes over it)
  for (const e of [-1, 1]) {
    const leg = `M${7 * e} -18C${12 * e} -14 ${14 * e} -8 ${11 * e} -2L${6 * e} -2C${7 * e} -7 ${5 * e} -11 ${2 * e} -14Z`;
    out += `<path d="${leg}" fill="url(#${fur})" stroke="#2a1608" stroke-width=".5"/>`
      + `<path d="M${5 * e} -1.4C${7 * e} -3.2 ${14 * e} -3.4 ${17 * e} -1.6C${18 * e} -.4 ${17 * e} .8 ${15 * e} .8L${6 * e} .8C${4.6 * e} .4 ${4.4 * e} -.6 ${5 * e} -1.4Z" fill="#3a2212" stroke="#1a0c04" stroke-width=".4"/>`
      + [0, 1, 2].map(k => `<path d="M${(13 + k * 1.6) * e} .6q${.3 * e} 1.4 ${-.2 * e} 2.2" stroke="#2a1608" stroke-width=".9" stroke-linecap="round"/>`).join(''); }
  // the coat: a little frock coat with flared tails, lapels, a white shirt front, gilt trim and buttons
  const body = 'M-12 -37C-6 -40 6 -40 12 -37L14 -22C15 -17 16 -14 17 -11L9 -13C4 -11 -4 -11 -9 -13L-17 -11C-16 -14 -15 -17 -14 -22Z';
  out += `<path d="${body}" fill="url(#${coat})" stroke="#3a0806" stroke-width=".6"/><path d="${body}" fill="url(#${coatS})"/>`
    + `<path d="M-9 -13C-4 -15 4 -15 9 -13" stroke="#2a0404" stroke-width=".6" fill="none" opacity=".7"/><path d="M-1 -14v-2" stroke="#2a0404" stroke-width=".5"/>`
    + `<path d="M-4.4 -38L0 -27L4.4 -38Z" fill="#efe6d2"/><path d="M-3 -36.4q3 1.6 6 0M-2.4 -33.6q2.4 1.2 4.8 0M-1.6 -31q1.6 .8 3.2 0" stroke="#b8ac98" stroke-width=".35" fill="none"/>`
    + `<path d="M-5.6 -38.6L0 -25.6L5.6 -38.6" stroke="#d8b050" stroke-width=".9" fill="none"/><path d="M-12 -37C-11 -30 -10.4 -22 -9 -13M12 -37C11 -30 10.4 -22 9 -13" stroke="#d8b050" stroke-width=".6" fill="none" opacity=".8"/>`
    + `<path d="M-5.6 -38.6L-9 -32L-4 -30Z" fill="#9a221a" stroke="#3a0806" stroke-width=".35"/><path d="M5.6 -38.6L9 -32L4 -30Z" fill="#5a100c" stroke="#3a0806" stroke-width=".35"/>`;
  for (const yy of [-28, -23, -18]) for (const e of [-1, 1]) { const bx = e * (4.8 + (yy + 28) * .05); out += K.shadeSphere(u, bx, yy, .95, L, 'brass', { outline: .25 }); }
  // the left arm (ours) hangs, the paw holds the coat's edge; the cuff turned back
  out += `<path d="M-11 -35C-17 -31 -18 -24 -17 -18" stroke="#3a0806" stroke-width="6.2" fill="none" stroke-linecap="round"/><path d="M-11 -35C-17 -31 -18 -24 -17 -18" stroke="url(#${coat})" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + `<path d="M-19.6 -19.4l5.4 1.2" stroke="#efe6d2" stroke-width="2" stroke-linecap="round"/><path d="M-19.4 -20.4l5 1.1" stroke="#d8b050" stroke-width=".4"/>`
    + `<path d="M-18.6 -17.6C-19.6 -14.6 -18 -12.2 -15.6 -12.6C-14 -13 -13.6 -15 -14.6 -17.4Z" fill="#4a2c16" stroke="#1a0c04" stroke-width=".4"/><path d="M-17.8 -13.8q.8 1 2 .6" stroke="#8a5a36" stroke-width=".35" fill="none"/>`;
  // the right arm raised: sleeve to the elbow, a bare furry forearm, the paw pinching the card's corner
  out += `<path d="M10 -35C15 -38 18 -42 19 -48" stroke="#3a0806" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M10 -35C15 -38 18 -42 19 -48" stroke="url(#${coat})" stroke-width="4.8" fill="none" stroke-linecap="round"/>`
    + `<path d="M17 -47.6l4.6 1.6" stroke="#efe6d2" stroke-width="1.9" stroke-linecap="round" transform="rotate(-62 19 -48)"/>`
    + `<path d="M19 -49C19.6 -54 20 -57 20.6 -60" stroke="#2a1608" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M19 -49C19.6 -54 20 -57 20.6 -60" stroke="url(#${furD})" stroke-width="3.3" fill="none" stroke-linecap="round"/>`;
  // the head: ears, a dark cap of fur, the pale face mask, eyes with a glint, a sly smile
  for (const e of [-1, 1]) out += `<circle cx="${10.4 * e}" cy="-46" r="4" fill="url(#${fur})" stroke="#2a1608" stroke-width=".4"/><circle cx="${10.4 * e}" cy="-46" r="2.2" fill="url(#${ear})" transform="translate(${10.4 * e} -46) translate(${-10.4 * e} 46)"/>`;
  out += `<circle cx="0" cy="-46" r="10" fill="url(#${fur})" stroke="#2a1608" stroke-width=".5"/>`
    + `<path d="M-7 -48C-7 -53 -3 -54.6 0 -54.6S7 -53 7 -48C7 -41 4.4 -37.6 2 -36.6Q0 -36 -2 -36.6C-4.4 -37.6 -7 -41 -7 -48Z" fill="url(#${face})"/>`
    + `<path d="M-8.6 -50C-7 -56.6 -2.6 -57.4 0 -57.4S7 -56.6 8.6 -50C5 -53.4 2.6 -53.4 0 -52.6C-2.6 -53.4 -5 -53.4 -8.6 -50Z" fill="#2a1608"/>`
    + `<path d="M-6.4 -50.6q2.4 -1.6 4.6 -.4M1.8 -51q2.4 -1.2 4.6 .4" stroke="#3a2010" stroke-width=".6" fill="none"/>`;
  for (const e of [-1, 1]) out += `<ellipse cx="${3 * e}" cy="-47.4" rx="1.75" ry="2" fill="#1a0c04"/><ellipse cx="${3 * e - .2}" cy="-47.2" rx="1" ry="1.2" fill="#4a2a14"/><circle cx="${3 * e - .6}" cy="-48.2" r=".55" fill="#ffffff"/>`;
  out += `<path d="M-1 -43.4q1 .7 2 0" stroke="#5a3420" stroke-width=".5" fill="none"/><circle cx="-.7" cy="-43.6" r=".35" fill="#3a1e0c"/><circle cx=".7" cy="-43.6" r=".35" fill="#3a1e0c"/>`
    + `<path d="M-3.4 -40.6Q0 -38.4 3.8 -41.2" stroke="#5a2a14" stroke-width=".6" fill="none" stroke-linecap="round"/><path d="M3.8 -41.2l.6 -.8" stroke="#5a2a14" stroke-width=".5" stroke-linecap="round"/>`;
  // fur: short strands round the head and along the outline, lighter on the moon's side
  for (let i = 0; i < 46; i++) { const a = R() * Math.PI * 2, r0 = 9.4 + R() * .8, l = .9 + R() * 1.2, px = Math.cos(a) * r0, py = -46 + Math.sin(a) * r0, lit = Math.cos(a) < -.2;
    if (py > -40 && Math.abs(px) < 6) continue;
    out += `<path d="M${f(px)} ${f(py)}l${f(Math.cos(a + (R() - .5) * .6) * l)} ${f(Math.sin(a + (R() - .5) * .6) * l)}" stroke="${lit ? '#c8966a' : '#2a1608'}" stroke-width=".35" stroke-linecap="round" opacity=".85"/>`; }
  // the moon's cold edge on the left of head and coat, the candle's warm edge on the right
  out += `<path d="M-9.6 -50C-10.6 -46 -9.8 -41 -7.6 -39" stroke="#cfe0ff" stroke-width=".55" fill="none" opacity=".75"/><path d="M-12.4 -36C-14.4 -28 -15 -20 -16.6 -12" stroke="#ffc0a8" stroke-width=".5" fill="none" opacity=".55"/>`
    + `<path d="M9.4 -42C10 -40 9.8 -38.6 8.6 -37.4" stroke="#ffb860" stroke-width=".55" fill="none" opacity=".8"/><path d="M13 -34C14 -26 15 -18 16.6 -11.4" stroke="#ffb860" stroke-width=".55" fill="none" opacity=".75"/>`;
  return out + '</g>';
}
// gold coins on the table: a leaning stack of n and a few loose ones, warm metal with a dark milled edge
function gold(u, L, x, y, n, loose, seed) {
  const R = rng(seed), g = nid('gc', u), e = nid('ge', u), rx = 2.9, ry = 1.05;
  let out = `<defs>${linGrad(g, x - rx, 0, x + rx, 0, [[0, '#a8742a', 1], [.45, '#f2c860', 1], [.7, '#fff0b0', 1], [1, '#c8902e', 1]])}${linGrad(e, x - rx, 0, x + rx, 0, [[0, '#4a2c08', 1], [.6, '#8a5a18', 1], [1, '#a87428', 1]])}</defs>`;
  const one = (cx, cy) => `<path d="M${f(cx - rx)} ${f(cy)}v.8a${rx} ${ry} 0 0 0 ${f(2 * rx)} 0v-.8z" fill="url(#${e})"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" fill="url(#${g})" stroke="#5a3a0a" stroke-width=".25"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * .72)}" ry="${f(ry * .72)}" fill="none" stroke="#a87428" stroke-width=".25"/>`;
  out += K.contactShadow(u, x + 1, y + 1.2, 10, L, { ry: 1.4, opacity: .6 });
  for (let i = 0; i < loose; i++) { const cx = x - 6 + R() * 13, cy = y + .6 + R() * 2.4; out += K.contactShadow(u, cx, cy + 1, 6, L, { ry: .9, opacity: .5 }) + one(cx, cy); }
  for (let i = 0; i < n; i++) out += one(x + (R() - .5) * .5 + i * .12, y - i * .95);
  return out;
}
// the skeleton's shadow: a monkey skeleton in the same pose (raised arm with the card, curled tail), thrown on the
// back wall inside the patch of moonlight, a little larger and soft
function skeletonShadow(u, x, y, s) {
  const b = nid('sb', u), c = '#0a0a14';
  const st = (d, w) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<defs><filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter></defs><g filter="url(#${b})" opacity=".62" transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`
    + `<circle cx="0" cy="-46" r="8.6" fill="${c}"/><circle cx="-2.8" cy="-47" r="2" fill="#7c8ca8"/><circle cx="2.8" cy="-47" r="2" fill="#7c8ca8"/><path d="M-2.6 -41h5.2" stroke="#7c8ca8" stroke-width=".6"/>`
    + `<circle cx="-10" cy="-46" r="3" fill="${c}"/><circle cx="10" cy="-46" r="3" fill="${c}"/>`
    + st('M0 -38V-14', 2.2) + [-34, -30, -26, -22].map(yy => st(`M-7 ${yy + 2}Q0 ${yy - 1.6} 7 ${yy + 2}`, 1.3)).join('')
    + st('M-11 -36H11', 1.6) + st('M-11 -35L-16 -25L-16 -17', 1.5) + st('M11 -35L18 -43L20 -58', 1.5)
    + `<g transform="translate(22 -66) rotate(-14)"><rect x="-6" y="-8.5" width="12" height="17" rx="1" fill="${c}"/></g>`
    + st('M-8 -14Q0 -11 8 -14', 2) + st('M-6 -14L-9 -7L-8 0M6 -14L9 -7L8 0', 1.5) + st('M-12 0H-4M4 0H12', 1.4)
    + st('M-4 -14C-16 -10 -26 -14 -27 -26C-28 -36 -20 -42 -14 -38', 1.4) + '</g>';
}

module.exports = { name: 'Обезьянка Джек', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 }), Lo = K.makeLight({ time: 'night', haze: .3, key: { type: 'moon', x: 15, y: 62, el: 14, color: '#d8e4fa', power: .8 } }, { horizon: 78 });
    // the back wall: vertical planks; the ceiling beam; the side wall on the left in perspective
    let bg = woodTex(u, 0, 0, 200, TB + 1, '#4a2e18', '#22140a', '#0e0804', 15, true, 4)
      + K.localGlow(u, { x: 196, y: 96, color: '#ff9a40', power: .3, radius: 60 }, { core: false });
    { const bm = nid('bm', u); bg += `<defs>${linGrad(bm, 0, 0, 0, 12, [[0, '#120a04', 1], [.7, '#3a2210', 1], [1, '#6a4424', 1]])}</defs><path d="M0 0H200V11H0Z" fill="url(#${bm})"/><path d="M0 11H200" stroke="#0a0502" stroke-width="1.2"/><path d="M0 10.3H200" stroke="#a87444" stroke-width=".4" opacity=".55"/>`
        + PK.nails([[22, 6], [70, 6], [118, 6], [166, 6]], '#140a04', .6); }
    // the moon patch on the back wall and, inside it, the skeleton's shadow (drawn before the side wall)
    { const pg = nid('pt', u), bl = nid('pb', u), pq = 'M108 24L182 30L184 90L106 94Z';
      bg += `<defs>${linGrad(pg, 106, 0, 184, 0, [[0, '#a8c0e8', .42], [1, '#a8c0e8', .26]])}<filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>`
        + `<path d="${pq}" fill="url(#${pg})" filter="url(#${bl})" style="mix-blend-mode:screen"/>`
        + `<path d="M145 25.5L146 92" stroke="#0a0a14" stroke-width="1.6" opacity=".35" filter="url(#${bl})"/><path d="M107 58L183 60" stroke="#0a0a14" stroke-width="1.6" opacity=".35" filter="url(#${bl})"/>`
        + `<defs><clipPath id="${bl}c"><path d="${pq}"/></clipPath></defs><g clip-path="url(#${bl}c)">${skeletonShadow(u, 146, 112, 1.15)}</g>`; }
    // the side wall on the left: a darker plane in perspective with the window in it
    { const sw = nid('sw', u); bg += `<defs>${linGrad(sw, 0, 0, 34, 0, [[0, '#1a0e06', 1], [1, '#3a2412', 1]])}</defs><path d="M-2 -2L34 12L34 ${TB}L-2 ${TB + 14}Z" fill="url(#${sw})"/>`
        + [6, 14, 22, 30].map(x => `<path d="M${x} ${f(-2 + (x + 2) * 14 / 36)}V${f(TB + 14 - (x + 2) * 14 / 36)}" stroke="#0a0502" stroke-width=".8" opacity=".8"/>`).join('')
        + `<path d="M34 12V${TB}" stroke="#0a0502" stroke-width="1.4"/><path d="M33.2 12V${TB}" stroke="#7a4e2a" stroke-width=".4" opacity=".5"/>`;
      const wq = 'M6 40L27 46L27 82L6 90Z', wc = nid('wc', u);
      let o = K.sky(u, Lo, { horizon: 78, stars: 18, seed: 9, top: 38 }) + K.sunMoon(u, Lo, { r: 3.6 }) + K.water(u, Lo, { horizon: 78, bottom: 92, swell: .3, seed: 3, glitter: 15 });
      bg += `<defs><clipPath id="${wc}"><path d="${wq}"/></clipPath></defs><g clip-path="url(#${wc})">${o}</g>`
        + `<path d="${wq}" fill="none" stroke="#2a180a" stroke-width="2.6"/><path d="M16.5 43L16.5 86M6 65L27 64" stroke="#2a180a" stroke-width="1.6"/><path d="M6 40L27 46" stroke="#a87444" stroke-width=".4" opacity=".6"/>`
        + `<path d="M4 91L29 83L30 86L5 94Z" fill="#5a3a1c" stroke="#0e0804" stroke-width=".4"/>`; }
    // the beam of moonlight across the room from the window to the patch (dust in it)
    bg += shafts(u, 16, 62, [[108, 24, 106, 94], [182, 30, 184, 90]], '#c8dcf0', .08) + motes(22, 30, 30, 150, 60, '#dbe8ff', 3);
    // the table: the top in perspective, its front edge, the dark under it, the floor
    bg += tableTop(u, TB, TF - TB, '#7a4e2a', '#3a2210', 6)
      + K.localGlow(u, { x: 184, y: 110, color: '#ffb050', power: .5, radius: 50 }, { squash: .45, core: false })
      + glow(u, 70, 112, 60, 14, '#a8c0e8', .12);
    { const ed = nid('ed', u), ap = nid('ap', u);
      bg += `<defs>${linGrad(ed, 0, TF, 0, TF + 8, [[0, '#c08a52', 1], [.3, '#6a4020', 1], [1, '#24140a', 1]])}${linGrad(ap, 0, TF + 8, 0, 280, [[0, '#1e1208', 1], [1, '#0a0502', 1]])}</defs>`
        + `<rect x="0" y="${TF}" width="200" height="8" fill="url(#${ed})"/><path d="M0 ${TF}h200" stroke="#e0aa6a" stroke-width=".7" opacity=".75"/>`
        + `<rect x="0" y="${TF + 8}" width="200" height="${280 - TF - 8}" fill="url(#${ap})"/>`
        + woodTex(u, 0, TF + 8, 200, 26, '#3a2412', '#1a1008', '#0a0502', 20, true, 7)
        + `<path d="M0 ${TF + 34}h200" stroke="#0a0502" stroke-width="1.2"/><path d="M0 ${TF + 35}h200" stroke="#7a4e2a" stroke-width=".5" opacity=".45"/>`;
      for (const x of [16, 184]) bg += K.shadeCyl(u, x, TF + 34, x, 284, 5.6, L, 'oak', { r1: 5.6, r2: 4.2, seed: x });
      bg += woodTex(u, 0, 248, 200, 36, '#2a180a', '#120a04', '#060302', 9, false, 14); }
    // on the table: the hand spread open (one card missing in the middle), coins, a mug, the candle stub
    let fg = '';
    { const k = .62; fg += K.contactShadow(u, 156, 124, 64, L, { ry: 4, opacity: .5 });
      for (const [x, y, a] of [[132, 120, -26], [143, 117.5, -13], [166, 117, 10], [178, 119.5, 23]]) fg += K.contactShadow(u, x, y + 3, 14, L, { ry: 2, opacity: .45 }) + card(u, x, y, a, 1.05, k, .55 + (x - 130) / 150);
      // the empty place in the fan: a faint clean mark in the dust where the stolen card lay
      fg += `<path d="M150 112.4l9 -.4l1.2 12.4l-9.6 .4z" fill="#a87a4a" opacity=".18"/>`; }
    // the mug and the coins take the candle's light (a point light of their own, for their tops and rims)
    const Lc = K.makeLight({ time: 'night', key: { type: 'point', x: CS.x, y: CS.y - 15, h: .3, gy: CS.y, color: '#ffb860', power: .9, radius: 90 }, fill: { color: '#3a5276', power: .45 } }, { horizon: HZ, eye: 1.2 });
    fg += K.castShadow(u, Lc, { x: 166, y: 106, w: 9, h: 11, horizon: HZ, d: .9, opacity: .6 }) + K.mug(u, Lc, { x: 166, y: 106, s: 1.15, fill: 'rum', seed: 3 });
    fg += gold(u, L, 122, 125, 5, 3, 1) + gold(u, L, 186, 125.5, 3, 2, 2) + gold(u, L, 44, 121, 2, 2, 3) + gold(u, L, 64, 112, 1, 1, 4);
    fg += K.candle(u, L, { ...CS, seed: 2 }) + K.localGlow(u, { x: CS.x + .2, y: CS.y - 13.5, color: '#ffd080', power: .8, radius: 12 });
    // the monkey's shadow on the table (to the right, away from the moon) and the monkey itself
    fg += K.castShadow(u, L, { x: MK.x, y: MK.y - 1, w: 30, h: 60, horizon: HZ, d: .5, opacity: .65 }) + K.contactShadow(u, MK.x, MK.y - .4, 38, L, { ry: 1.8, opacity: .75 });
    fg += monkey(u, L, MK);
    // the stolen card in its raised paw: the paw's fingers over its corner
    const cx = MK.x + 22 * MK.s, cy = MK.y - 67 * MK.s;
    fg += card(u, cx, cy, -14, 1.25, 1, .85) + `<path d="M${f(cx - 3.6)} ${f(cy + 9.6)}q1.2 -2.6 3.6 -2.2q1.8 .6 1 2.6" fill="#4a2c16" stroke="#1a0c04" stroke-width=".4"/>`
      + K.localGlow(u, { x: cx, y: cy, color: '#e8f0ff', power: .35, radius: 16 }, { core: false });
    // light: the cold moon from the left, the warm stub on the right, the corners and the under-glass dark
    fg += glow(u, 60, 70, 50, 40, '#c8dcf0', .1) + gloom(u, 200, 40, 120, 60, .25) + gloom(u, 100, 140, 100, 280, .5);
    return [bg, fg];
  } };
