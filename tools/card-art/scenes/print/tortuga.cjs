// «Тортуга» (Колода моря): the blue hour on the quay of a pirate port. Under one lantern hung from the tavern's iron bracket
// two men strike a bargain across a rum barrel used as a table: a bearded pirate on the left pushes a keg of powder
// over to the right, a fence in a tricorne on the right holds out a rolled chart to him. Behind them the tavern's
// door and windows glow, people at the door; in the harbour the ships ride at their moorings with lights aboard, the
// town's lights climb the hill. Card: each team may spend up to 2 Порох and draw as many cards (powder for cards).
// The blue hour with lamps was chosen for the port (the sea series is day, the brief leaves it to the author).
// Brief: docs/mockups/print/card-briefs.md «Тортуга».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 58;                                   // horizon: a standing eye on the quay
const QUAY = 102;                                // the quay's stone edge over the harbour water
const LAMP = { x: 100, y: 40, s: .8, hang: true };  // the lantern on the tavern's bracket, between the two men
const light = {
  time: 'night', haze: .2,
  key: Object.assign(K.lantern.local(LAMP), { type: 'point', color: '#ffc272', power: 1, radius: 120, h: 1.4, gy: 150 }),
  fill: { color: '#1f2a44', power: .5 },
  locals: [{ x: 12, y: 92, h: 1, color: '#ffa850', power: .7, radius: 40 }],
};
// the far harbour and the hill are lit by the night sky only (no moon): a dim cold light from high on the left
const lightFar = { time: 'night', haze: .4, key: { type: 'moon', az: 250, el: 50, color: '#8fa0c8', power: .3 }, fill: { color: '#1a2238', power: .5 } };
const skel = { horizon: HZ, eye: 1.6, light: 'one lantern hung between the two men over the barrel: their faces and the front of each lit, backs in shade, shadows fanning out on the quay; the tavern door glows on the left; the harbour is lit by the night sky',
  items: [
    ['pirate', 28, 140, 52, 104, 'left of the barrel, from the waist up, about 75 units/m (a head of 17 units)'],
    ['fence', 118, 140, 54, 98, 'right of the barrel, from the waist up'],
    ['barrel', 80, 168, 42, 62, 'a rum barrel standing on the quay as a table'],
    ['keg', 86, 106, 14, 19, 'a keg of powder on the barrel head, the pirate\'s hand on it'],
    ['chart', 100, 86, 28, 6, 'rolled, in the fence\'s hand over the keg'],
    ['lantern', 94, 40, 12, 24, 'hung from the bracket on a hook'],
    ['tavern', -12, 112, 66, 124, 'on the left, the door lit'],
    ['brig', 130, 84, 70, 70, 'moored in the harbour, lights aboard'],
  ] };

const pts = a => a.map(p => f(p[0]) + ' ' + f(p[1]));
function sp(P, closed) {
  const n = P.length, g = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
const cylOf = (u, L) => (a, b, r1, r2, kind, o = {}) => K.shadeCyl(u, a[0], a[1], b[0], b[1], Math.max(r1, r2), L, kind, Object.assign({ r1, r2, cap: 'round', outline: .45 }, o));

module.exports = { name: 'Тортуга', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 }), LF = K.makeLight(lightFar, { horizon: HZ, eye: 1.6 });
    // the blue hour: the sky still deep blue over the hill, the lamps already lit
    const pal = { sky: ['#0a1230', '#18275a', '#2c4480', '#566aa0'], sea: ['#3a5086', '#1a2a50', '#0a1228'] };
    L.pal = Object.assign({}, L.pal, pal); LF.pal = Object.assign({}, LF.pal, pal);
    // ——— far: the sky, the hill with the town's lights, the harbour water, the ships at their moorings
    let bg = K.sky(u, LF, { horizon: HZ, stars: 60, seed: 9 });
    bg += hill(u, LF);
    bg += K.water(u, LF, { horizon: HZ, bottom: QUAY + 2, swell: .1, seed: 6, glitter: false });
    bg += K.ship(u, LF, { kind: 'merchant', x: 96, y: 70, scale: .42, sails: 'furled', detail: 'far', lights: true, seed: 12 });
    bg += K.ship(u, LF, { kind: 'brig', x: 168, y: 86, scale: 1, flip: true, sails: 'furled', detail: 'mid', lights: true, reflect: true, seed: 5 });
    bg += lightsOnWater(u);
    // ——— the quay: its stone edge, the paving, the tavern on the left, the people at its door
    bg += quay(u, L);
    bg += tavern(u, L);
    // ——— near: the bracket and lantern, the barrel table, the two men, the keg and the chart
    let fg = bracket(u, L) + K.lantern(u, L, LAMP);
    fg += K.castShadow(u, L, { x: 100, y: 168, w: 42, h: 60, horizon: HZ });
    fg += K.barrel(u, L, { x: 100, y: 168, s: 2, kind: 'rum', seed: 3 });
    fg += K.castShadow(u, L, { x: 92, y: 109, w: 13, h: 18.6, horizon: HZ, d: .7 }) + K.barrel(u, L, { x: 92, y: 109, s: .62, kind: 'powder', seed: 8 });
    fg += pirate(u, L);
    fg += fence(u, L);
    fg += crates(u, L);
    return [bg, fg];
  } };

/** The hill over the harbour: a dark ridge with the town's windows scattered up its slope, a fort at the top. */
function hill(u, L) {
  const c = mix(L.pal.sky[3], '#05070e', .55), c2 = mix(c, '#05070e', .3), y = HZ, R = rng(14);
  let s = `<path d="M40 ${y}C60 ${y - 8} 74 ${y - 20} 96 ${y - 26}C112 ${y - 30} 126 ${y - 28} 140 ${y - 22}C158 ${y - 15} 176 ${y - 12} 200 ${y - 9}L212 ${y - 8}L212 ${y + .5}L40 ${y + .5}Z" fill="${c}"/>`;
  s += `<path d="M40 ${y}C60 ${y - 4} 80 ${y - 9} 110 ${y - 10}C140 ${y - 10} 170 ${y - 5} 212 ${y - 3}L212 ${y + .5}L40 ${y + .5}Z" fill="${c2}"/>`;
  // the fort's wall and tower on the crest
  s += `<path d="M100 ${y - 26.6}L100 ${y - 31}L103 ${y - 31}L103 ${y - 29.6}L112 ${y - 29.6}L112 ${y - 33}L116 ${y - 33}L116 ${y - 28.4}L120 ${y - 28}L120 ${y - 26.8}Z" fill="${c}"/>`;
  // the town's windows: small warm squares up the slope, more near the water
  for (let i = 0; i < 34; i++) { const t = R(), x = 54 + R() * 150, top = x < 96 ? y - (x - 40) * .45 : x < 140 ? y - 26 + (x - 96) * .1 : y - 22 + (x - 140) * .2, yy = lerp(y - 1.2, top + 2, Math.pow(R(), 1.6));
    s += `<rect x="${f(x)}" y="${f(yy)}" width="${f(.7 + R() * .5)}" height="${f(.6 + R() * .4)}" fill="${R() < .3 ? '#ffd890' : '#f0a850'}" opacity="${f(.55 + R() * .4)}"/>`; }
  return s;
}
/** The lights of the town and the ships drawn down the still water in broken streaks. */
function lightsOnWater(u) {
  const R = rng(31), b = nid('lw', u);
  let s = `<defs><filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".35"/></filter></defs><g filter="url(#${b})">`;
  for (const [x, y0, n] of [[60, 59, 4], [74, 59, 3], [118, 59, 4], [150, 59, 3], [186, 59, 4], [92, 71, 5]]) for (let i = 0; i < n; i++) { const y = y0 + 1 + i * 1.6 + R(); s += `<path d="M${f(x - .8 - R())} ${f(y)}h${f(1.4 + R() * 1.6)}" stroke="#f0a850" stroke-width=".45" opacity="${f(.5 - i * .08)}"/>`; }
  return s + '</g>';
}
/** The quay: the dressed stone edge over the water, the paving running up to us, wet and catching the lantern. */
function quay(u, L) {
  const st = L.ramp('iron', 120, 110), id = nid('qy', u), R = rng(8);
  let s = `<defs>${linGrad(id, 0, QUAY, 0, 292, [[0, mix(st.core, '#2a2018', .3)], [.3, mix(st.shadow, '#3a2a1c', .3)], [1, '#0d0b0c']])}</defs><path d="M-12 ${QUAY}H212V292H-12Z" fill="url(#${id})"/>`;
  // the coping stones along the edge, each its own length; the lit top edge
  let x = 50; while (x < 212) { const w = 9 + R() * 8; s += `<path d="M${f(x)} ${QUAY}h${f(w - .5)}v3h${f(-(w - .5))}Z" fill="${mix(st.half, '#4a3c30', .4)}" stroke="${st.outline}" stroke-width=".35"/>`; x += w; }
  s += `<path d="M50 ${QUAY}H212" stroke="${mix(st.lit, '#ffc070', .4)}" stroke-width=".5" opacity=".6"/>`;
  // the cobbles: rows of rounded stones getting bigger towards us, their tops wet with the lamp
  for (let y = QUAY + 5, row = 0; y < 292; row++) { const h = 2.4 + row * .9, w = h * 1.8; for (let xx = -12 + (row % 2) * w / 2 + R() * 2; xx < 212; xx += w + .6) {
      const cx = xx + w / 2, cy = y + h / 2, d = Math.hypot(cx - 100, (cy - 150) * 1.4), lit = clamp(1 - d / 120);
      s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w / 2)}" ry="${f(h / 2)}" fill="${mix('#1a1614', '#6a5440', lit * .8)}" stroke="#0a0808" stroke-width=".35"/>`;
      if (lit > .15) s += `<path d="M${f(cx - w * .3)} ${f(cy - h * .22)}q${f(w * .3)} ${f(-h * .25)} ${f(w * .6)} 0" stroke="#ffcf8a" stroke-width=".35" fill="none" opacity="${f(lit * .6)}"/>`; }
    y += h + .5; }
  s += K.localGlow(u, { x: 100, y: 160, color: '#ffb060', power: .45, radius: 70 }, { squash: .35, core: false });
  return s;
}
/** The tavern on the left: a timber-framed front, plaster between the posts, an upper window lit, the open door
 *  pouring warm light on the quay with two drinkers in it, a small lit window by the door, casks by the wall. */
function tavern(u, L) {
  const oak = L.ramp('oak', 30, 60), pl = '#5a4a3c', y0 = 112, R = rng(6);
  let s = `<path d="M-12 -12H64V${y0}H-12Z" fill="${mix(pl, '#141018', .35)}"/>`;
  // plaster texture: soft darker patches
  for (let i = 0; i < 10; i++) s += `<ellipse cx="${f(R() * 70 - 6)}" cy="${f(R() * 110)}" rx="${f(4 + R() * 8)}" ry="${f(3 + R() * 5)}" fill="#1a1418" opacity=".18"/>`;
  // the frame: posts, a rail between the floors, braces
  const beam = (x1, y1, x2, y2, w) => `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="${mix(oak.shadow, '#140c08', .4)}" stroke-width="${w}"/><path d="M${f(x1 + w * .35)} ${f(y1)}L${f(x2 + w * .35)} ${f(y2)}" stroke="${oak.half}" stroke-width=".4" opacity=".35"/>`;
  s += beam(-2, -12, -2, y0, 3.2) + beam(22, -12, 22, y0, 3) + beam(60, -12, 60, y0, 3.6) + beam(-12, 52, 64, 52, 3.4) + beam(-12, 6, 64, 6, 3) + beam(24, 52, 58, 8, 2.2);
  // the upper window (right of the medal): lit from inside, leaded panes, a shutter
  s += windowLit(u, 34, 14, 16, 18);
  // the door: open inwards, the lit room, two drinkers in silhouette against it, the step lit
  const d = nid('dr', u);
  s += `<defs>${linGrad(d, 0, 66, 0, y0, [[0, '#ffcf80'], [.6, '#f0a050'], [1, '#c86a2a']])}</defs><path d="M2 ${y0}V70Q10 62 18 70V${y0}Z" fill="url(#${d})" stroke="#140c08" stroke-width=".8"/>`;
  s += `<path d="M5 ${y0}C5 104 4.6 96 6.4 92C5.6 88 6 84 8.4 83.4C10.8 83.4 11.4 86.4 10.6 89C12.8 91 13.4 96 13 ${y0}Z" fill="#1a0e0a"/>`;
  s += `<path d="M13 ${y0}C13.4 102 14 94 15 90.6C14.4 88 15.2 85.6 17.2 85.4L18 85.6V${y0}Z" fill="#24140c"/><path d="M15 90.6L11 94" stroke="#24140c" stroke-width="1.4" stroke-linecap="round"/>`;
  s += `<path d="M2 ${y0}V70Q10 62 18 70V${y0}" fill="none" stroke="${mix(oak.core, '#140c08', .3)}" stroke-width="2"/>`;
  // the light from the door on the paving and the step
  s += K.localGlow(u, { x: 10, y: y0 + 4, color: '#ffa850', power: .7, radius: 26 }, { squash: .35 });
  // casks by the wall between the door and the pirate
  s += K.barrel(u, L, { x: 30, y: y0 + 2, s: .8, kind: 'rum', seed: 9 });
  s += K.barrel(u, L, { x: 30, y: y0 + 2 - 24, s: .62, kind: 'powder', seed: 4, lying: true });
  return s;
}
function windowLit(u, x, y, w, h) {
  const g = nid('wn', u);
  let s = `<defs>${radGrad(g, x + w / 2, y + h * .6, w, [[0, '#ffd890'], [.6, '#f09a48'], [1, '#a8501e']])}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${g})" stroke="#140c08" stroke-width="1.4"/>`;
  for (let i = 1; i < 3; i++) s += `<path d="M${f(x + w * i / 3)} ${y}V${y + h}" stroke="#3a2010" stroke-width=".5"/>`;
  s += `<path d="M${x} ${f(y + h / 2)}H${x + w}" stroke="#3a2010" stroke-width=".6"/>`;
  s += `<path d="M${x - 1.5} ${y + h + .6}H${x + w + 1.5}V${y + h + 2.4}H${x - 1.5}Z" fill="#3a281a" stroke="#140c08" stroke-width=".4"/>`;
  return s + K.localGlow(u, { x: x + w / 2, y: y + h / 2, color: '#ffb060', power: .35, radius: 18 }, { core: false });
}
/** The iron bracket out of the tavern's corner post with its scroll brace; the lantern hangs from a hook at its end. */
function bracket(u, L) {
  const ir = L.ramp('iron', 80, 14), y = 12, top = LAMP.y - 28 * LAMP.s;
  let s = `<path d="M61 ${y}H${LAMP.x + 3}" stroke="${ir.outline}" stroke-width="2.2"/><path d="M61 ${y - .5}H${LAMP.x + 3}" stroke="${ir.lit}" stroke-width=".5" opacity=".7"/>`;
  s += `<path d="M61 ${y + 16}C70 ${y + 14} 74 ${y + 4} 84 ${y + .6}" stroke="${ir.outline}" stroke-width="1.5" fill="none"/><path d="M68 ${y + 1}c-3 0 -4 3 -1.6 4.4c2 1 3.6 -1 2.4 -2.4" stroke="${ir.outline}" stroke-width="1" fill="none"/>`;
  s += `<path d="M${LAMP.x} ${y + .8}V${f(top + .4)}" stroke="${ir.outline}" stroke-width=".8"/><circle cx="${LAMP.x}" cy="${y + 1.6}" r="1" fill="none" stroke="${ir.core}" stroke-width=".5"/>`;
  return s;
}
/** A crate and a coil by the barrel, under the glass. */
function crates(u, L) {
  return K.castShadow(u, L, { x: 176, y: 232, w: 22 * 2.2, h: 16 * 2.2, horizon: HZ, d: .45 }) + K.crate(u, L, { x: 176, y: 232, s: 2.2, seed: 5 })
    + K.coil(u, L, { x: 34, y: 250, s: 2.2, seed: 3, tail: false });
}

// ——— the two men ———
// the pirate on the left, facing right, seen from the waist up behind the barrel: a loose shirt, an open leather
// waistcoat, a red sash; his left arm forward, the hand pressing the keg across the barrel head
function pirate(u, L) {
  const C = cylOf(u, L);
  let s = '';
  // the torso: back on the left in shade, chest to the lamp
  const body = [[43, 65], [57, 61], [64, 64.6], [68.2, 72], [69.6, 84], [70.4, 98], [71, 112], [72, 140], [36, 140], [37.4, 112], [38.4, 92], [38.8, 78], [39.6, 70.4]];
  const sh = K.mat('linen', L, { form: 'cyl', x1: 54, y1: 66, x2: 54, y2: 140, r: 17, u });
  s += `<defs>${sh.defs}</defs><path d="${sp(body, true)}" fill="${sh.fill}" stroke="${sh.ramp.outline}" stroke-width=".5"/>`;
  // shirt folds from the shoulder down to the sash
  for (const [a, b, c] of [[[60, 66], [64, 78], [66, 92]], [[52, 66], [55, 80], [58, 96]], [[46, 68], [45, 82], [46, 98]]]) s += `<path d="${sp([a, b, c])}" stroke="${sh.ramp.shadow}" stroke-width=".7" fill="none" opacity=".5"/>`;
  // the open waistcoat: the near front panel and the back
  const vest = K.mat('leather', L, { form: 'cyl', x1: 50, y1: 66, x2: 50, y2: 140, r: 15, u });
  s += `<defs>${vest.defs}</defs><path d="${sp([[40, 67], [50, 63], [55, 66], [58, 80], [60, 98], [60.4, 112], [61, 140], [36, 140], [37.4, 112], [38.4, 92], [38.8, 78]], true)}" fill="${vest.fill}" stroke="${vest.ramp.outline}" stroke-width=".5"/>`;
  s += `<path d="${sp([[55, 66], [58, 80], [60, 98], [60.4, 112]])}" stroke="${vest.ramp.lit}" stroke-width=".6" fill="none" opacity=".6"/>`;
  for (const y of [78, 88, 98]) s += K.shadeSphere(u, 59 + (y - 78) * .06, y, .9, L, 'brass', { outline: .3 });
  // the sash round the waist, behind the barrel's top
  const sa = K.mat('paint-red', L, { form: 'cyl', x1: 54, y1: 104, x2: 54, y2: 116, r: 17, u });
  s += `<defs>${sa.defs}</defs><path d="${sp([[37.6, 104], [54, 105.4], [70.6, 103.6], [71.2, 115], [54, 117], [37.2, 115.6]], true)}" fill="${sa.fill}" stroke="${sa.ramp.outline}" stroke-width=".45"/>`;
  // the neck and the head in profile to the right, bearded, a kerchief, an earring; long hair behind
  s += C([56, 65], [58.4, 54], 4.4, 4, 'skin');
  s += `<path d="${sp([[51, 50], [49.4, 56], [47.6, 62], [44, 66.4], [48, 66], [51.4, 63], [53.6, 58]], true)}" fill="#1c120c" stroke="#0a0604" stroke-width=".4"/>`;
  s += headProfile(u, L, [58.6, 46.4], 8.4, 1, { beard: true, kerchief: true, earring: true });
  // the near (left) arm: rolled sleeve to the elbow, the forearm forward and down to the keg
  const sh0 = [60, 70], el = [65.4, 89], wr = [80.4, 97.4];
  s += C(sh0, el, 4.6, 3.7, 'linen') + C(el, wr, 3.1, 2.3, 'skin');
  s += `<path d="${sp([[63.6, 86.6], [67.2, 87.4], [67.6, 91.6], [64, 91.4]], true)}" fill="${L.ramp('linen', 65, 89).core}" stroke="${L.ramp('linen', 65, 89).outline}" stroke-width=".4"/>`;
  return s + palmOnKeg(u, L, wr);
}
// the hand laid flat on the keg's side, the fingers over its upper hoop, the thumb along the top; pushing it right
function palmOnKeg(u, L, w) {
  const rp = L.ramp('skin', w[0] + 3, w[1]);
  const back = [[w[0] - 1.2, w[1] - 2.2], [w[0] + 2.2, w[1] - 3.6], [w[0] + 4.6, w[1] - 4.4], [w[0] + 5.6, w[1] - 2.8], [w[0] + 5.4, w[1] + .6], [w[0] + 3.4, w[1] + 2.2], [w[0], w[1] + 2.2]];
  let s = `<path d="${sp(back, true)}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".42"/>`;
  // four fingers bent over the keg's shoulder, each a little lower towards the little finger
  [[-4.4, 0], [-3.2, 1.4], [-1.8, 2.6], [-.4, 3.6]].forEach(([dy, dx], i) => {
    const a = [w[0] + 4.8, w[1] + dy + .6], b = [w[0] + 7.6 + dx * .2, w[1] + dy + 1.2 + i * .3];
    s += K.shadeCyl(u, a[0], a[1], b[0], b[1], .78, L, 'skin', { r1: .82, r2: .66, cap: 'round', outline: .35 });
  });
  s += K.shadeCyl(u, w[0] + 2.4, w[1] - 3.4, w[0] + 6.4, w[1] - 6.2, .9, L, 'skin', { r1: .95, r2: .74, cap: 'round', outline: .35 });
  s += `<path d="M${f(w[0] + .6)} ${f(w[1] - 2.6)}L${f(w[0] + 4.6)} ${f(w[1] - 4.2)}" stroke="${rp.lit}" stroke-width=".45" opacity=".7"/>`;
  return s;
}
// the fence on the right, facing left: a long dark-red coat with wide cuffs and brass buttons over a waistcoat and
// a stock, a tricorne; his right arm out over the barrel, the chart rolled in his fist
function fence(u, L) {
  const C = cylOf(u, L);
  let s = '';
  const coat = K.mat('paint-red', L, { form: 'cyl', x1: 146, y1: 66, x2: 146, y2: 140, r: 18, u });
  const body = [[162, 69], [150, 62], [139, 65], [134.6, 74], [132.6, 88], [131.6, 104], [130.4, 140], [168, 140], [166, 110], [165, 88], [163.6, 74]];
  s += `<defs>${coat.defs}</defs><path d="${sp(body, true)}" fill="${coat.fill}" stroke="${coat.ramp.outline}" stroke-width=".5"/>`;
  // the waistcoat and the white stock in the opening of the coat, the lapel turned back, buttons
  const wc = K.mat('paint-ochre', L, { form: 'cyl', x1: 138, y1: 70, x2: 138, y2: 130, r: 6, u });
  s += `<defs>${wc.defs}</defs><path d="${sp([[139.4, 66], [135, 74], [133.4, 88], [132.6, 104], [132.2, 118], [138.4, 120], [139, 104], [139.6, 88], [141, 72]], true)}" fill="${wc.fill}" stroke="${wc.ramp.outline}" stroke-width=".45"/>`;
  s += `<path d="${sp([[140.2, 62.4], [136, 64], [134.6, 68.6], [137.4, 72], [140.6, 68]], true)}" fill="${L.ramp('linen', 137, 66).half}" stroke="${L.ramp('linen', 137, 66).outline}" stroke-width=".4"/>`;
  s += `<path d="${sp([[141, 66], [141.6, 80], [140.4, 96], [140, 118]])}" stroke="${coat.ramp.shadow}" stroke-width="1.6" fill="none"/>`;
  for (const y of [80, 88, 96, 104]) s += K.shadeSphere(u, 138 - (y - 80) * .05, y, .8, L, 'brass', { outline: .3 });
  // folds of the coat down the back
  for (const [a, b, c] of [[[156, 70], [158, 90], [160, 112]], [[150, 76], [150.6, 96], [151, 120]]]) s += `<path d="${sp([a, b, c])}" stroke="${coat.ramp.shadow}" stroke-width=".9" fill="none" opacity=".6"/>`;
  // the neck, the hair tied in a queue behind, the head in profile to the left with a tricorne
  s += C([145, 65], [143.4, 54], 4.2, 3.9, 'skin');
  s += `<path d="${sp([[148, 50], [151.2, 54], [152, 60], [150.6, 64], [149.4, 59], [147, 55]], true)}" fill="#24180e" stroke="#0a0604" stroke-width=".4"/>`;
  s += `<path d="M150.6 58.8l1.8 1.6" stroke="#1a1a24" stroke-width="1.2"/>`;
  s += headProfile(u, L, [142.6, 46.4], 8.2, -1, { tricorne: true, moustache: true });
  // the near (right) arm out over the barrel: the coat sleeve to the big turned cuff, a lace ruffle, the fist
  const sh0 = [140, 70], el = [130.6, 86], wr = [120.6, 81.2];
  s += C(sh0, el, 4.4, 3.8, 'paint-red') + C(el, wr, 3.6, 3, 'paint-red');
  s += K.shadeCyl(u, 125.4, 83.8, 121.6, 81.6, 4.4, L, 'paint-red', { r1: 4.4, r2: 4.2, ell: .3, face: 2, outline: .45 });
  s += `<path d="${sp([[121.8, 77.4], [119.4, 78.4], [118.8, 80.6], [119.8, 83], [121.8, 85.6], [120.8, 81.6]], true)}" fill="${L.ramp('linen', 120, 81).lit}" stroke="${L.ramp('linen', 120, 81).outline}" stroke-width=".35"/>`;
  // the chart: a parchment roll, its ends showing the spiral, tied with a red ribbon with a seal; held in the fist
  s += chartRoll(u, L, [100.6, 80.6], [126, 84.4]);
  s += fist(u, L, [118.6, 82.2]);
  return s;
}
function chartRoll(u, L, a, b) {
  let s = K.shadeCyl(u, a[0], a[1], b[0], b[1], 2.4, L, 'canvas', { ell: .45, face: 1, outline: .45, seed: 7 });
  // the spiral at the near end
  s += `<path d="M${f(a[0] + .2)} ${f(a[1] - .1)}c.6 -.6 1.4 0 .9 .8c-.6 .9 -1.9 .5 -1.8 -.6c.1 -1.4 1.9 -1.9 2.7 -.6" stroke="${L.ramp('canvas', a[0], a[1]).shadow}" stroke-width=".3" fill="none"/>`;
  // the ribbon round it and the wax seal
  const m = [lerp(a[0], b[0], .42), lerp(a[1], b[1], .42)];
  s += `<path d="M${f(m[0] - .4)} ${f(m[1] - 2.4)}C${f(m[0] + .4)} ${f(m[1] - 1)} ${f(m[0] + .4)} ${f(m[1] + 1)} ${f(m[0] - .2)} ${f(m[1] + 2.5)}" stroke="#8a1a14" stroke-width="1.1" fill="none"/>`;
  s += `<path d="M${f(m[0] - .2)} ${f(m[1] + 2.4)}l-1.2 3.6M${f(m[0] - .2)} ${f(m[1] + 2.4)}l1.4 3.4" stroke="#8a1a14" stroke-width=".8"/>` + K.shadeSphere(u, m[0] - .1, m[1] + 2.6, 1.3, L, 'paint-red', { outline: .3 });
  return s;
}
// the fist round the roll seen from the thumb side: the knuckles on top, the thumb over the fingers towards us
function fist(u, L, c) {
  const rp = L.ramp('skin', c[0], c[1]);
  let s = `<path d="${sp([[c[0] + 2.8, c[1] - 3.2], [c[0] - .4, c[1] - 3.8], [c[0] - 3.4, c[1] - 3], [c[0] - 4.2, c[1] - 1], [c[0] - 3.8, c[1] + 1.6], [c[0] - 1, c[1] + 2.8], [c[0] + 2.6, c[1] + 2.6], [c[0] + 3.4, c[1]]], true)}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".42"/>`;
  // the finger joints round the roll, the thumb lying across
  for (const dx of [-2.6, -1.2, .2, 1.6]) s += `<path d="M${f(c[0] + dx)} ${f(c[1] - 2.6)}q-.5 2.4 0 4.6" stroke="${rp.shadow}" stroke-width=".3" fill="none" opacity=".7"/>`;
  s += K.shadeCyl(u, c[0] + 2.2, c[1] + .8, c[0] - 2.4, c[1] - .6, 1, L, 'skin', { r1: 1.1, r2: .85, cap: 'round', outline: .35 });
  s += `<path d="M${f(c[0] - 3)} ${f(c[1] - 3.4)}L${f(c[0] + 2.4)} ${f(c[1] - 3.2)}" stroke="${rp.lit}" stroke-width=".5" opacity=".7"/>`;
  return s;
}
// a head in profile (dir 1 — looking right, −1 — left): skull, brow, nose, lips, chin, ear, eye; options for a beard,
// a moustache, a kerchief with its knot, a tricorne, a gold ring in the ear
function headProfile(u, L, c, r, dir, o) {
  const Q = (a, b) => [c[0] + dir * a * r, c[1] + b * r], rp = L.ramp('skin', c[0] + dir * r * .6, c[1]);
  let s = K.shadeSphere(u, c[0], c[1], r, L, 'skin', { outline: .45 });
  // the face: forehead, brow ridge, nose, lips, chin and jaw
  const face = [Q(.3, -.92), Q(.74, -.62), Q(.92, -.3), Q(.9, -.14), Q(1.02, .04), Q(1.24, .3), Q(1.02, .4), Q(1.02, .52), Q(.96, .6), Q(1, .7), Q(.9, .8), Q(.88, 1), Q(.66, 1.16), Q(.2, 1.12), Q(-.2, .86), Q(-.1, .2)];
  s += `<path d="${sp(face, true)}" fill="${rp.core}" stroke="${rp.outline}" stroke-width=".45"/>`;
  s += `<path d="${sp([Q(.3, -.92), Q(.74, -.62), Q(.92, -.3), Q(.9, -.14), Q(1.02, .04), Q(1.24, .3)])}" stroke="${rp.lit}" stroke-width=".55" fill="none" opacity=".8"/>`;
  s += `<path d="${sp([Q(.62, -.06), Q(.8, .12), Q(.74, .3)])}" stroke="${rp.shadow}" stroke-width=".35" fill="none" opacity=".7"/>`;
  // the eye under the brow, the brow, the nostril, the mouth line
  s += `<path d="${sp([Q(.52, -.18), Q(.66, -.24), Q(.76, -.14)])}" stroke="#1a0e0a" stroke-width=".55" fill="none"/><path d="${sp([Q(.44, -.4), Q(.68, -.46), Q(.86, -.34)])}" stroke="#2a1a10" stroke-width=".65" fill="none"/>`;
  s += `<path d="${sp([Q(.98, .52), Q(.86, .54), Q(.74, .5)])}" stroke="#5a2a20" stroke-width=".4" fill="none"/>`;
  // the ear
  s += `<path d="${sp([Q(-.1, -.12), Q(.06, -.06), Q(.1, .2), Q(-.02, .42), Q(-.18, .34)], true)}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".35"/>`;
  if (o.beard) s += `<path d="${sp([Q(-.04, .5), Q(.26, .62), Q(.58, .66), Q(.92, .64), Q(1.04, .76), Q(.96, 1.06), Q(.82, 1.42), Q(.46, 1.5), Q(.14, 1.2), Q(-.14, .8)], true)}" fill="#22140c" stroke="#0a0604" stroke-width=".4"/>`
    + `<path d="${sp([Q(1.02, .48), Q(.84, .5), Q(.7, .56)])}" stroke="#22140c" stroke-width="${f(r * .14)}" fill="none" stroke-linecap="round"/>`
    + `<path d="${sp([Q(.92, .66), Q(1.02, .82), Q(.94, 1.1), Q(.82, 1.4)])}" stroke="${mix('#22140c', '#ffc070', .4)}" stroke-width=".45" fill="none" opacity=".8"/>`;
  if (o.moustache) s += `<path d="${sp([Q(1.02, .46), Q(.88, .48), Q(.72, .54), Q(.64, .64)])}" stroke="#2a1a10" stroke-width="${f(r * .1)}" fill="none" stroke-linecap="round"/>`;
  if (o.earring) { const e = Q(-.04, .5); s += `<circle cx="${f(e[0])}" cy="${f(e[1] + .9)}" r="1" fill="none" stroke="#e0b450" stroke-width=".45"/>`; }
  if (o.kerchief) {
    const kr = L.ramp('paint-red', c[0], c[1] - r), id = nid('hk', u);
    s += `<defs>${linGrad(id, c[0] - dir * r, c[1], c[0] + dir * r, c[1] - r, [[0, kr.shadow], [.55, kr.core], [1, kr.lit]])}</defs>`;
    s += `<path d="${sp([Q(-1.06, .1), Q(-.96, -.62), Q(-.4, -1.08), Q(.34, -1.1), Q(.82, -.7), Q(.62, -.56), Q(.1, -.7), Q(-.44, -.36), Q(-.7, .2)], true)}" fill="url(#${id})" stroke="${kr.outline}" stroke-width=".45"/>`;
    s += `<path d="${sp([Q(-.92, -.2), Q(-1.6, .2), Q(-1.9, .9), Q(-1.5, .7), Q(-1.3, .4), Q(-1.26, 1.1), Q(-.9, .5)], true)}" fill="${kr.shadow}" stroke="${kr.outline}" stroke-width=".4"/>`;
  }
  if (o.tricorne) {
    const hat = L.ramp('tar', c[0], c[1] - r), id = nid('ht', u);
    s += `<defs>${linGrad(id, c[0] - dir * r, c[1] - r, c[0] + dir * r, c[1] - r * 1.4, [[0, hat.shadow], [.6, hat.core], [1, hat.half]])}</defs>`;
    s += `<path d="${sp([Q(-.96, -.44), Q(-.6, -1.34), Q(.1, -1.5), Q(.7, -1.2), Q(.9, -.72), Q(.3, -.8), Q(-.3, -.7)], true)}" fill="url(#${id})" stroke="${hat.outline}" stroke-width=".45"/>`;
    // the cocked brim: up at the front and back, a lit edge towards the lamp
    s += `<path d="${sp([Q(-1.5, -.2), Q(-1.1, -.9), Q(-.2, -.66), Q(.6, -.74), Q(1.3, -1.26), Q(1.14, -.5), Q(.2, -.36), Q(-.8, -.32)], true)}" fill="${hat.core}" stroke="${hat.outline}" stroke-width=".45"/>`;
    s += `<path d="${sp([Q(-.2, -.66), Q(.6, -.74), Q(1.3, -1.26)])}" stroke="${mix(hat.lit, '#ffc070', .4)}" stroke-width=".5" fill="none"/>`;
  }
  return s;
}
