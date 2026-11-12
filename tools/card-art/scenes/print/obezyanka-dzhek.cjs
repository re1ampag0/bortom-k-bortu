// «Обезьянка Джек» (Жемчужина, ПРИКАЗ: возьмите случайную карту из руки игрока-противника), variant A of the method
// trial (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-pearl.cjs SCENES['Обезьянка
// Джек']) at its best. Night in the cabin, seen in one-point perspective (floor, walls, ceiling beams and carlings
// all run to one vanishing point; the far wall with its door stands deep in the room): the monkey in its little red
// coat stands on the near edge of the table among the gold and holds up high the card it has just pulled out of the
// hand spread on the table (a gap in the fan where it was), a gold coin in its other paw; the moon through the window
// in the left wall throws its shadow on the right wall — a monkey skeleton in the same pose.
// Fixed against the first round: the window hung skewed on a flat wall and the room had no depth — now it is a room
// in perspective with a high ceiling; the card was held by the tail and the paws went through things — now the
// palm is behind the card's lower edge and the fingers curl over it in front, the coin is pinched the same way;
// the table top has a front edge and legs on the floor; the coins, chest and mug stand on the table with shadows;
// the monkey has fur, volume, a lit side to the moon and a warm rim from the candle stub.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, shafts, motes, tableTop } = PK;

const VP = [100, 62], HZ = VP[1];                  // one-point perspective: the vanishing point = eye level
const FAR = .38, CEIL = 105.3, FLOOR = 63.2;       // the far wall's depth; ceiling and floor offsets from the eye at depth 1
const MK = { x: 90, y: 126.5, s: 1.15 };             // the monkey's feet on the near edge of the table
const CS = { x: 140, y: 108, s: 1.2, len: 5 };    // a candle stub at the back right of the table (the warm rim)
const light = { time: 'night', haze: .3, key: { type: 'moon', az: 290, el: 14, color: '#cfe0ff', power: .85 }, fill: { color: '#2e4466', power: .35 },
  rim: { az: 70, color: '#ffb860', power: .45 }, locals: [{ x: CS.x, y: CS.y - 14, color: '#ffb050', power: .6, radius: 60 }] };
const skel = { horizon: HZ, eye: 1.2, light: 'the moon through the window in the left wall (low, from the left): the shadow falls on the right wall; candle stub on the table = warm rim', items: [
  ['far wall', 62, 86, 76, 64, 'room, depth .38'], ['door', 116, 86, 15, 30, 'far wall'], ['left window', 22, 82, 18, 36, 'left wall'], ['moon patch', 156, 96, 38, 76, 'right wall'],
  ['skeleton shadow', 160, 98, 36, 66, 'right wall, in the patch'], ['table', 34, 128, 132, 28, 'floor (legs)'],
  ['monkey', 66, MK.y, 46, 60, 'stands on the table near edge'], ['card', 60, 66, 18, 26, 'in its raised left paw'], ['coin', 107, 88, 7, 7, 'in its right paw'],
  ['fan', 108, 120, 54, 14, 'table top'], ['chest + gold', 42, 127, 40, 20, 'table top'], ['mug', 114, 104, 10, 12, 'table top'], ['candle stub', 134, 108, 12, 14, 'table top']] };

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
  // the left arm (ours) raised high: coat sleeve to the elbow, a bare furry forearm, the dark palm under the card
  // (the card itself and the fingers curled over its lower edge are drawn by the scene, over the monkey)
  { const sl = 'M-10.5 -35C-15 -37.6 -17.4 -41 -17.8 -46.4', fa = 'M-17.8 -46.4C-18.2 -50.6 -18.4 -54.6 -18.6 -58.6';
    out += `<path d="${sl}" stroke="#3a0806" stroke-width="6.2" fill="none" stroke-linecap="round"/><path d="${sl}" stroke="url(#${coat})" stroke-width="5" fill="none" stroke-linecap="round"/>`
      + `<path d="M-15.2 -38.4C-16.6 -40.4 -17.4 -42.6 -17.6 -45" stroke="#e86a50" stroke-width=".5" fill="none" opacity=".5"/>`
      + `<path d="${fa}" stroke="#2a1608" stroke-width="4.3" fill="none" stroke-linecap="round"/><path d="${fa}" stroke="url(#${furD})" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
      + `<path d="M-19.4 -48.6C-19.8 -52 -20 -55 -20.1 -58" stroke="#c8966a" stroke-width=".45" fill="none" opacity=".75"/>`
      + `<path d="M-20.6 -46.2l5.6 -.5" stroke="#efe6d2" stroke-width="2.1" stroke-linecap="round"/><path d="M-20.4 -47.3l5.2 -.5" stroke="#d8b050" stroke-width=".4"/>`
      + `<path d="M-21 -59.4C-21.4 -62.6 -19.8 -64.8 -18 -64.6C-16 -64.4 -15.4 -62 -16.2 -59.2C-17.2 -57.6 -19.8 -57.6 -21 -59.4Z" fill="#3a2010" stroke="#140804" stroke-width=".4"/>`
      + `<path d="M-20.2 -59.6q1.6 1 3.4 .2" stroke="#7a4a2a" stroke-width=".35" fill="none"/>`; }
  // the right arm (ours) bent at the elbow, the paw up by the shoulder holding the gold coin (coin and fingers by the scene)
  { const sl = 'M11 -35C15.4 -32.6 17.4 -29 17 -25.4', fa = 'M17 -25.4C19.6 -28 21.4 -31.4 22 -35';
    out += `<path d="${sl}" stroke="#3a0806" stroke-width="6.2" fill="none" stroke-linecap="round"/><path d="${sl}" stroke="url(#${coat})" stroke-width="5" fill="none" stroke-linecap="round"/>`
      + `<path d="M14.6 -26.4l4.8 -1.6" stroke="#efe6d2" stroke-width="2" stroke-linecap="round"/><path d="M14.4 -27.4l4.6 -1.5" stroke="#d8b050" stroke-width=".4"/>`
      + `<path d="${fa}" stroke="#2a1608" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="${fa}" stroke="url(#${furD})" stroke-width="3.1" fill="none" stroke-linecap="round"/>`
      + `<path d="M20 -30.6C20.8 -32 21.4 -33.4 21.8 -35" stroke="#ffb860" stroke-width=".45" fill="none" opacity=".7"/>`
      + `<path d="M19.6 -36.4C19.4 -39 21 -40.6 22.8 -40.2C24.6 -39.8 25.2 -37.6 24.4 -35.6C23.4 -34 20.6 -34.2 19.6 -36.4Z" fill="#3a2010" stroke="#140804" stroke-width=".4"/>`; }
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
  return `<defs><filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter></defs><g filter="url(#${b})" opacity=".78" transform="translate(${f(x)} ${f(y)}) scale(${f(s * .8)} ${f(s)})">`
    + `<circle cx="0" cy="-46" r="8.6" fill="${c}"/><circle cx="-2.8" cy="-47" r="2" fill="#7c8ca8"/><circle cx="2.8" cy="-47" r="2" fill="#7c8ca8"/><path d="M-2.6 -41h5.2" stroke="#7c8ca8" stroke-width=".6"/>`
    + `<circle cx="-10" cy="-46" r="3" fill="${c}"/><circle cx="10" cy="-46" r="3" fill="${c}"/>`
    + st('M0 -38V-14', 2.2) + [-34, -30, -26, -22].map(yy => st(`M-7 ${yy + 2}Q0 ${yy - 1.6} 7 ${yy + 2}`, 1.3)).join('')
    + st('M-11 -36H11', 1.6) + st('M-11 -35L-17.6 -46L-18.6 -60', 1.5) + st('M11 -35L17 -25L22 -36', 1.5)
    + `<g transform="translate(-19.4 -74.5) rotate(-8)"><rect x="-8" y="-11.5" width="16" height="23" rx="1" fill="${c}"/></g><ellipse cx="23" cy="-42.6" rx="3" ry="3.4" fill="${c}"/>`
    + st('M-8 -14Q0 -11 8 -14', 2) + st('M-6 -14L-9 -7L-8 0M6 -14L9 -7L8 0', 1.5) + st('M-12 0H-4M4 0H12', 1.4)
    + st('M-4 -14C-16 -10 -26 -14 -27 -26C-28 -36 -20 -42 -14 -38', 1.4) + '</g>';
}

module.exports = { name: 'Обезьянка Джек', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 }), Lo = K.makeLight({ time: 'night', haze: .3, key: { type: 'moon', x: 33, y: 60, el: 14, color: '#d8e4fa', power: .8 } }, { horizon: 74 });
    const [vx, vy] = VP, ray = (x, y, k) => [vx + (x - vx) * k, vy + (y - vy) * k];   // a point slid along its line to the vanishing point
    const wl = k => vx - 100 * k, wr = k => vx + 100 * k, cy = k => vy - CEIL * k, fy = k => vy + FLOOR * k;   // the room's edges at depth k (1 = picture plane)
    const q = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
    const k0 = FAR;   // the far wall's depth
    // ——— the far wall: upright planks, a door on the right, a little framed chart on the left ———
    let bg = woodTex(u, wl(k0), cy(k0), wr(k0) - wl(k0), fy(k0) - cy(k0), '#4a2e18', '#24160a', '#0e0804', 9, true, 4);
    { const dx0 = 116, dx1 = 131, dy0 = 56, dy1 = fy(k0), dg = nid('dr', u);
      bg += `<defs>${linGrad(dg, dx0, 0, dx1, 0, [[0, '#5a3a1e', 1], [.5, '#3a2412', 1], [1, '#24160a', 1]])}</defs><path d="M${dx0 - 1.4} ${dy1}V${dy0 - 1.4}H${dx1 + 1.4}V${dy1}Z" fill="#140a04"/>`
        + `<rect x="${dx0}" y="${dy0}" width="${dx1 - dx0}" height="${dy1 - dy0}" fill="url(#${dg})" stroke="#0a0502" stroke-width=".5"/>`
        + [1, 2].map(i => `<path d="M${f(dx0 + i * (dx1 - dx0) / 3)} ${dy0}V${dy1}" stroke="#0e0804" stroke-width=".45"/>`).join('')
        + [dy0 + 5, dy1 - 7].map(y => `<path d="M${dx0 - .4} ${f(y)}h10" stroke="#14100c" stroke-width="1.5" stroke-linecap="round"/><path d="M${dx0 - .4} ${f(y - .5)}h10" stroke="#8a96a0" stroke-width=".35" opacity=".6"/>`).join('')
        + `<circle cx="${dx1 - 3}" cy="${f((dy0 + dy1) / 2 + 2)}" r="1.4" fill="none" stroke="#8a7040" stroke-width=".55"/>`
        // a coat and a hat hung on a peg beside the door
        + `<path d="M${dx1 + 3.4} 52l1 0" stroke="#5a3a1c" stroke-width="1.2"/><path d="M${dx1 + 2} 53q2.4 -1.6 4 0l1.2 16q-3 1.4 -6.4 0z" fill="#1a1420" stroke="#08060a" stroke-width=".4"/><path d="M${dx1 + 1} 51.6q3.4 -3.4 6.6 0z" fill="#120c08"/>`;
      // the framed chart on the left of the far wall
      bg += `<rect x="67" y="38" width="16" height="12" fill="#3a2410" stroke="#0e0804" stroke-width=".5"/><rect x="68.4" y="39.4" width="13.2" height="9.2" fill="#a88a5c"/><path d="M70 45q3 -3 6 -1q3 -2 4 1" stroke="#5a4428" stroke-width=".4" fill="none"/><path d="M68.4 39.4h13.2" stroke="#d8b878" stroke-width=".3" opacity=".6"/>`
        // the far wall's skirting and its lower shadow
        + `<path d="M${f(wl(k0))} ${f(fy(k0) - 2)}H${f(wr(k0))}" stroke="#0e0804" stroke-width="1.2"/>`; }
    // ——— the ceiling: a narrow band of deck planking, the deck beams across it, the carlings run to the vanishing point ———
    { const cg = nid('cl', u); bg += `<defs>${linGrad(cg, 0, 0, 0, cy(k0), [[0, '#1c1008', 1], [1, '#3a2412', 1]])}</defs><path d="${q([[-4, -2], [204, -2], ray(204, -2, k0 / ((vy + 2) / CEIL)), ...[]].slice(0, 2).concat([[wr(k0), cy(k0)], [wl(k0), cy(k0)]]))}" fill="url(#${cg})"/>`;
      for (let i = -6; i <= 6; i++) { const top = [vx + i * 26, -2], e = ray(top[0], top[1], (vy - cy(k0)) / (vy + 2)); bg += `<path d="M${f(top[0])} -2L${f(e[0])} ${f(e[1])}" stroke="#0a0502" stroke-width=".55" opacity=".8"/>`; }
      for (const k of [.66, .52, .44]) { const y0 = cy(k), t = 3.2 * k, a = wl(k), b = wr(k), bm = nid('cb', u);
        bg += `<defs>${linGrad(bm, 0, y0 - t, 0, y0 + t * .9, [[0, '#2a1a0c', 1], [.55, '#4a2e16', 1], [1, '#8a5a32', 1]])}</defs><path d="M${f(a)} ${f(y0 - t)}H${f(b)}V${f(y0 + t * .9)}H${f(a)}Z" fill="url(#${bm})" stroke="#0a0502" stroke-width=".5"/>`
          + `<path d="M${f(a)} ${f(y0 + t * .9)}H${f(b)}" stroke="#c08a52" stroke-width=".35" opacity=".5"/>`; }
      // two carlings: heavy timbers running from the beams to the far wall
      for (const sx of [-1, 1]) { const top = [vx + sx * 44, -2], e = ray(top[0], top[1], (vy - cy(k0)) / (vy + 2)), w0 = 7, w1 = w0 * k0 / ((vy + 2) / CEIL), cg2 = nid('cr', u);
        bg += `<defs>${linGrad(cg2, top[0] - w0, 0, top[0] + w0, 0, [[0, '#24160a', 1], [.5, '#5a3a1e', 1], [1, '#2a1a0c', 1]])}</defs><path d="${q([[top[0] - w0, -2], [top[0] + w0, -2], [e[0] + w1 * .6, e[1]], [e[0] - w1 * .6, e[1]]])}" fill="url(#${cg2})" stroke="#0a0502" stroke-width=".4"/>`; } }
    // ——— the left wall: dark, its planks running to the vanishing point, ribs upright; the moon window in it ———
    { const sw = nid('sw', u), kk = [1.2, k0];
      bg += `<defs>${linGrad(sw, 0, 0, wl(k0), 0, [[0, '#120a04', 1], [1, '#2e1c0e', 1]])}</defs><path d="${q([[wl(1.3), cy(1.3)], [wl(k0), cy(k0)], [wl(k0), fy(k0)], [wl(1.3), fy(1.3)]])}" fill="url(#${sw})"/>`;
      for (let i = 1; i < 9; i++) { const y = cy(1.3) + (fy(1.3) - cy(1.3)) * i / 9, e = ray(wl(1.3), y, k0 / 1.3); bg += `<path d="M${f(wl(1.3))} ${f(y)}L${f(e[0])} ${f(e[1])}" stroke="#060302" stroke-width=".5" opacity=".7"/>`; }
      for (const k of [.48, .6, .82]) bg += `<path d="M${f(wl(k))} ${f(cy(k))}V${f(fy(k))}" stroke="#060302" stroke-width="${f(3 * k)}" opacity=".7"/><path d="M${f(wl(k) + 1.4 * k)} ${f(cy(k))}V${f(fy(k))}" stroke="#6a4424" stroke-width=".4" opacity=".4"/>`;
      void kk;
      // the window between two ribs: night sky, the low moon, the sea; mullions; a sill
      const ka = .62, kb = .78, wq = [[wl(ka), vy - 14 * ka], [wl(kb), vy - 14 * kb], [wl(kb), vy + 22 * kb], [wl(ka), vy + 22 * ka]], wc = nid('wc', u);
      let o = K.sky(u, Lo, { horizon: 74, stars: 18, seed: 9, top: 40 }) + K.sunMoon(u, Lo, { r: 3.4 }) + K.water(u, Lo, { horizon: 74, bottom: 90, swell: .3, seed: 3, glitter: 33 });
      bg += `<defs><clipPath id="${wc}"><path d="${q(wq)}"/></clipPath></defs><g clip-path="url(#${wc})">${o}</g>`
        + `<path d="${q(wq)}" fill="none" stroke="#2a180a" stroke-width="2.4"/>`
        + `<path d="M${f((wq[0][0] + wq[1][0]) / 2)} ${f((wq[0][1] + wq[1][1]) / 2)}L${f((wq[3][0] + wq[2][0]) / 2)} ${f((wq[3][1] + wq[2][1]) / 2)}" stroke="#2a180a" stroke-width="1.5"/>`
        + `<path d="M${f(wl(ka))} ${f(vy + 4 * ka)}L${f(wl(kb))} ${f(vy + 4 * kb)}" stroke="#2a180a" stroke-width="1.5"/>`
        + `<path d="M${f(wl(ka))} ${f(vy - 14 * ka)}L${f(wl(kb))} ${f(vy - 14 * kb)}" stroke="#a8c0e0" stroke-width=".4" opacity=".5"/>`
        + `<path d="${q([[wl(ka) + 1, vy + 22 * ka + 1], [wl(kb) + 1, vy + 22 * kb + 1], [wl(kb) + 4, vy + 22 * kb + 4], [wl(ka) + 3.4, vy + 22 * ka + 3.6]])}" fill="#5a3a1c" stroke="#0e0804" stroke-width=".4"/>`; }
    // ——— the right wall: planks to the vanishing point; the moon's patch on it with the skeleton's shadow ———
    { const sw = nid('rw', u);
      bg += `<defs>${linGrad(sw, wr(k0), 0, 200, 0, [[0, '#2e1c0e', 1], [1, '#1a0e06', 1]])}</defs><path d="${q([[wr(1.3), cy(1.3)], [wr(k0), cy(k0)], [wr(k0), fy(k0)], [wr(1.3), fy(1.3)]])}" fill="url(#${sw})"/>`;
      for (let i = 1; i < 9; i++) { const y = cy(1.3) + (fy(1.3) - cy(1.3)) * i / 9, e = ray(wr(1.3), y, k0 / 1.3); bg += `<path d="M${f(wr(1.3))} ${f(y)}L${f(e[0])} ${f(e[1])}" stroke="#060302" stroke-width=".5" opacity=".7"/>`; }
      for (const k of [.5, .66]) bg += `<path d="M${f(wr(k))} ${f(cy(k))}V${f(fy(k))}" stroke="#060302" stroke-width="${f(3 * k)}" opacity=".7"/>`;
      const pa = .56, pb = .94, pq = [[wr(pa), vy - 60 * pa], [wr(pb), vy - 60 * pb], [wr(pb), vy + 42 * pb], [wr(pa), vy + 42 * pa]], pg = nid('pt', u), bl = nid('pb', u);
      bg += `<defs>${linGrad(pg, wr(pa), 0, wr(pb), 0, [[0, '#a8c0e8', .27], [1, '#a8c0e8', .17]])}<filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3"/></filter><clipPath id="${bl}c"><path d="${q(pq)}"/></clipPath></defs>`
        + `<path d="${q(pq)}" fill="url(#${pg})" filter="url(#${bl})" style="mix-blend-mode:screen"/>`
        + `<g opacity=".35" filter="url(#${bl})"><path d="M${f(wr((pa + pb) / 2))} ${f(vy - 60 * (pa + pb) / 2)}V${f(vy + 42 * (pa + pb) / 2)}" stroke="#0a0a14" stroke-width="1.8"/><path d="M${f(wr(pa))} ${f(vy + 4 * pa)}L${f(wr(pb))} ${f(vy + 4 * pb)}" stroke="#0a0a14" stroke-width="1.8"/></g>`
        + `<g clip-path="url(#${bl}c)">${skeletonShadow(u, 175, 93, .86)}</g>`; }
    // ——— the floor: planks running to the vanishing point, cross seams closer with depth ———
    { const fl = nid('fl', u); bg += `<defs>${linGrad(fl, 0, fy(k0), 0, 200, [[0, '#2a180a', 1], [1, '#140a04', 1]])}</defs><path d="${q([[wl(k0), fy(k0)], [wr(k0), fy(k0)], [wr(2.2), fy(2.2)], [wl(2.2), fy(2.2)]])}" fill="url(#${fl})"/>`;
      for (let i = -9; i <= 9; i++) { const a = [vx + i * 11 * k0, fy(k0)], e = ray(a[0], a[1], 2.2 / k0); bg += `<path d="M${f(a[0])} ${f(a[1])}L${f(e[0])} ${f(e[1])}" stroke="#080402" stroke-width=".5" opacity=".75"/>`; }
      for (const k of [.46, .56, .7, .9]) bg += `<path d="M${f(wl(k))} ${f(fy(k))}H${f(wr(k))}" stroke="#080402" stroke-width=".35" opacity=".5"/>`;
      bg += `<path d="${q([[wl(k0), fy(k0)], [wr(k0), fy(k0)]])}" stroke="#060302" stroke-width="1"/>`; }
    // the room's corners: the edges where walls meet ceiling and floor
    bg += `<path d="M${f(wl(1.3))} ${f(cy(1.3))}L${f(wl(k0))} ${f(cy(k0))}L${f(wr(k0))} ${f(cy(k0))}L${f(wr(1.3))} ${f(cy(1.3))}M${f(wl(1.3))} ${f(fy(1.3))}L${f(wl(k0))} ${f(fy(k0))}V${f(cy(k0))}M${f(wr(1.3))} ${f(fy(1.3))}L${f(wr(k0))} ${f(fy(k0))}V${f(cy(k0))}" stroke="#060302" stroke-width="1" fill="none" opacity=".85"/>`;
    // the beam of moonlight across the room from the window to the patch (dust in it)
    bg += shafts(u, 30, 62, [[wr(.56), vy - 60 * .56, wr(.56), vy + 42 * .56], [wr(.94), vy - 60 * .94, wr(.94), vy + 42 * .94]], '#c8dcf0', .07) + motes(26, 40, 26, 140, 60, '#dbe8ff', 3);
    // ——— the table in the foreground: its top in perspective, the far legs standing on the floor ———
    const T = { y0: 100, y1: 128 }, tx = (y, s) => { const k = (y - vy) / (T.y1 - vy); return vx + s * 66 * k; };   // the table's half-width runs to the vanishing point
    let fg = '';
    { const kL = (T.y0 - vy) / (T.y1 - vy), floorY = vy + (T.y0 - vy) * 2.1;
      for (const s of [-1, 1]) fg += K.shadeCyl(u, tx(T.y0, s) - s * 3, T.y0 + 2, tx(T.y0, s) - s * 3, floorY, 3.2 * kL, L, 'oak', { r1: 3.4 * kL, r2: 2.6 * kL, seed: 3 + s }) + K.contactShadow(u, tx(T.y0, s) - s * 3, floorY, 12, L, { ry: 1.4, opacity: .7 });
      const tt = nid('tt', u), top = [[tx(T.y0, -1), T.y0], [tx(T.y0, 1), T.y0], [tx(T.y1, 1), T.y1], [tx(T.y1, -1), T.y1]];
      fg += `<defs>${linGrad(tt, 0, T.y0, 0, T.y1, [[0, '#4a2e16', 1], [1, '#7a4e2a', 1]])}</defs><path d="${q(top)}" fill="url(#${tt})" stroke="#0e0804" stroke-width=".5"/>`;
      for (let i = 1; i < 7; i++) { const t = i / 7, a = [lerp(top[0][0], top[1][0], t), T.y0], b = [lerp(top[3][0], top[2][0], t), T.y1]; fg += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#2a1608" stroke-width=".5" opacity=".75"/><path d="M${f(a[0] + .5)} ${f(a[1])}L${f(b[0] + .8)} ${f(b[1])}" stroke="#a87444" stroke-width=".3" opacity=".35"/>`; }
      { const R = rng(8); for (let i = 0; i < 14; i++) { const t = R(), y = lerp(T.y0 + 2, T.y1 - 2, R()), x = lerp(tx(y, -1), tx(y, 1), t); fg += `<path d="M${f(x)} ${f(y)}q${f(1.6 + R() * 2)} ${f(-.3)} ${f(3 + R() * 4)} ${f(.2)}" stroke="#2a1608" stroke-width=".25" fill="none" opacity=".45"/>`; } }
      fg += `<path d="M${f(top[0][0])} ${T.y0}H${f(top[1][0])}" stroke="#a87444" stroke-width=".4" opacity=".5"/>`
        + K.localGlow(u, { x: CS.x, y: CS.y, color: '#ffb050', power: .5, radius: 40 }, { squash: .4, core: false })
        + glow(u, 70, 114, 46, 12, '#a8c0e8', .12);
      // the front edge and the dark apron under it (under the glass)
      const ed = nid('ed', u), ap = nid('ap', u);
      fg += `<defs>${linGrad(ed, 0, T.y1, 0, T.y1 + 7, [[0, '#c08a52', 1], [.3, '#6a4020', 1], [1, '#24140a', 1]])}${linGrad(ap, 0, T.y1 + 7, 0, 282, [[0, '#1e1208', 1], [1, '#0a0502', 1]])}</defs>`
        + `<path d="${q([[tx(T.y1, -1), T.y1], [tx(T.y1, 1), T.y1], [tx(T.y1, 1), T.y1 + 7], [tx(T.y1, -1), T.y1 + 7]])}" fill="url(#${ed})"/><path d="M${f(tx(T.y1, -1))} ${T.y1}H${f(tx(T.y1, 1))}" stroke="#e0aa6a" stroke-width=".7" opacity=".75"/>`
        + `<path d="${q([[tx(T.y1, -1), T.y1 + 7], [tx(T.y1, 1), T.y1 + 7], [tx(T.y1, 1) + 2, 282], [tx(T.y1, -1) - 2, 282]])}" fill="url(#${ap})"/>`
        + woodTex(u, tx(T.y1, -1), T.y1 + 7, tx(T.y1, 1) - tx(T.y1, -1), 30, '#3a2412', '#1a1008', '#0a0502', 12, true, 7);
      for (const s of [-1, 1]) fg += K.shadeCyl(u, tx(T.y1, s) - s * 7, T.y1 + 36, tx(T.y1, s) - s * 7, 284, 6, L, 'oak', { r1: 6, r2: 4.8, seed: 9 + s }); }
    // on the table: the opponent's hand spread open (one card missing), gold, a mug, a purse, the candle stub
    { const k = .62; fg += K.contactShadow(u, 132, 120, 44, L, { ry: 3, opacity: .5 });
      for (const [x, y, a] of [[118, 117, -24], [127, 115, -11], [146, 115.4, 10], [155, 118, 22]]) fg += K.contactShadow(u, x, y + 3, 12, L, { ry: 1.8, opacity: .45 }) + card(u, x, y, a, .92, k, .5 + (x - 116) / 120);
      fg += `<path d="M132.6 110.4l7.6 -.3l1 10.6l-8.2 .3z" fill="#a87a4a" opacity=".2"/>`; }
    const Lc = K.makeLight({ time: 'night', key: { type: 'point', x: CS.x, y: CS.y - 14, h: .3, gy: CS.y, color: '#ffb860', power: .9, radius: 80 }, fill: { color: '#3a5276', power: .45 } }, { horizon: HZ, eye: 1.2 });
    fg += K.castShadow(u, Lc, { x: 118, y: 104, w: 8, h: 10, horizon: HZ, d: .9, opacity: .55 }) + K.mug(u, Lc, { x: 118, y: 104, s: .95, fill: 'rum', seed: 3 });
    // a small open chest of gold on the left, coins spilled from it, stacks of gold in front
    fg += K.castShadow(u, L, { x: 54, y: 118, w: 30 * .62, h: 17 * .62, horizon: HZ, d: .35, opacity: .55 }) + K.chest(u, L, { x: 54, y: 118, s: .62, open: true, gold: true, seed: 4 });
    fg += gold(u, L, 62, 123, 1, 4, 5) + gold(u, L, 70, 125, 7, 3, 1) + gold(u, L, 46, 126, 4, 2, 6) + gold(u, L, 112, 124, 3, 2, 3) + gold(u, L, 140, 125, 4, 2, 2) + gold(u, L, 106, 110, 2, 2, 4);
    fg += K.candle(u, L, { ...CS, seed: 2 }) + K.localGlow(u, { x: CS.x + .2, y: CS.y - 12.5, color: '#ffd080', power: .8, radius: 11 });
    // the monkey's shadow on the table (to the right, away from the moon) and the monkey itself
    fg += K.castShadow(u, L, { x: MK.x, y: MK.y - 1, w: 28, h: 56, horizon: HZ, d: .5, opacity: .6 }) + K.contactShadow(u, MK.x, MK.y - .4, 36, L, { ry: 1.6, opacity: .75 });
    fg += monkey(u, L, MK);
    const W = (lx, ly) => [MK.x + lx * MK.s, MK.y + ly * MK.s];
    // the stolen card held high: the palm behind its lower edge, four fingers curled over it in front
    { const cs = 1.28 * MK.s, c = W(-19.4, -61.6 - 10 * cs / MK.s), a = -8, rd = a * Math.PI / 180, bot = (dx) => { dx *= MK.s; return [c[0] + dx * Math.cos(rd) - 10 * cs * Math.sin(rd), c[1] + dx * Math.sin(rd) + 10 * cs * Math.cos(rd)]; };
      fg += `<g transform="translate(${f(c[0] - 1.6)} ${f(c[1] + 1.4)}) rotate(${a})"><rect x="${f(-7 * cs)}" y="${f(-10 * cs)}" width="${f(14 * cs)}" height="${f(20 * cs)}" rx="1.4" fill="#0a0a14" opacity=".35"/></g>`
        + card(u, c[0], c[1], a, cs, 1, .85);
      for (const [dx, l0] of [[-3.2, 2.6], [-1.05, 3.1], [1.1, 3], [3.1, 2.4]]) { const p = bot(dx), l = l0 * MK.s;
        fg += `<path d="M${f(p[0] - 1.05)} ${f(p[1] + 1.4)}C${f(p[0] - 1.15)} ${f(p[1] - l * .6)} ${f(p[0] - .7)} ${f(p[1] - l)} ${f(p[0])} ${f(p[1] - l)}C${f(p[0] + .7)} ${f(p[1] - l)} ${f(p[0] + 1.15)} ${f(p[1] - l * .6)} ${f(p[0] + 1.05)} ${f(p[1] + 1.4)}Z" fill="#3a2010" stroke="#140804" stroke-width=".35"/>`
          + `<path d="M${f(p[0] - .5)} ${f(p[1] - l + .5)}q.5 -.3 1 0" stroke="#8a5a36" stroke-width=".3" fill="none"/>`; }
      fg += `<path d="M${f(bot(-5)[0])} ${f(bot(-5)[1] + 1.2)}q-1.6 -2.6 -.4 -4.6q1.2 .2 1.4 2.6" fill="#3a2010" stroke="#140804" stroke-width=".35"/>`
        + K.localGlow(u, { x: c[0], y: c[1], color: '#e8f0ff', power: .3, radius: 16 }, { core: false }); }
    // the gold coin in the other paw, held up by the shoulder: the moon's glint on it, the thumb over its rim
    { const c = W(23, -42.6), r = 3.3 * MK.s, cg = nid('cn', u);
      fg += `<defs>${radGrad(cg, c[0] - 1, c[1] - 1, r * 1.3, [[0, '#fff6c8', 1], [.35, '#f2c860', 1], [.8, '#b8862a', 1], [1, '#6a4410', 1]])}</defs>`
        + K.localGlow(u, { x: c[0], y: c[1], color: '#ffd890', power: .55, radius: 13 }, { core: false })
        + `<ellipse cx="${f(c[0] + .7)}" cy="${f(c[1])}" rx="${f(r * .9)}" ry="${f(r)}" fill="#6a4410" stroke="#3a2404" stroke-width=".4"/>`
        + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r * .9)}" ry="${f(r)}" fill="url(#${cg})" stroke="#5a3a0a" stroke-width=".4"/>`
        + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r * .62)}" ry="${f(r * .7)}" fill="none" stroke="#a87428" stroke-width=".35"/><path d="M${f(c[0] - 1.2)} ${f(c[1] - .4)}l1.2 -1.4l1.2 1.4l-1.2 1.4z" fill="#a87428"/>`
        + `<path d="M${f(c[0] - 4.4)} ${f(c[1] - 2.6)}l2.4 .9M${f(c[0] - 2.2)} ${f(c[1] - 5)}l.9 2.2" stroke="#fffaf0" stroke-width=".35" stroke-linecap="round"/><circle cx="${f(c[0] - 1.6)}" cy="${f(c[1] - 1.8)}" r=".6" fill="#ffffff"/>`;
      const p = W(21.6, -39.6);
      for (const [dx, l] of [[-.9, 2.4], [1, 2.6]]) fg += `<path d="M${f(p[0] + dx - .95)} ${f(p[1] + 1.2)}C${f(p[0] + dx - 1)} ${f(p[1] - l * .6)} ${f(p[0] + dx - .6)} ${f(p[1] - l)} ${f(p[0] + dx)} ${f(p[1] - l)}C${f(p[0] + dx + .6)} ${f(p[1] - l)} ${f(p[0] + dx + 1)} ${f(p[1] - l * .6)} ${f(p[0] + dx + .95)} ${f(p[1] + 1.2)}Z" fill="#3a2010" stroke="#140804" stroke-width=".35"/>`; }
    // light: the cold moon from the left, the warm stub on the right, the corners and the under-glass dark
    fg += glow(u, 60, 70, 50, 40, '#c8dcf0', .08) + gloom(u, 200, 40, 120, 60, .2) + gloom(u, 100, 140, 100, 280, .5);
    return [bg, fg];
  } };
