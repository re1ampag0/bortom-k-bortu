// «Тортуга» (Колода моря): the blue hour on the quay of a pirate port. Under one lantern hung from the tavern's iron bracket
// two men strike a bargain across a rum barrel used as a table: a bearded pirate on the left sets a keg of powder down
// on the barrel head with both hands (a second keg already stands behind it; black powder trickles from a cracked
// stave), a fence in a tricorne on the right holds out two cards fanned in his fingers, backs to us — powder for
// cards. Behind them the tavern's door and windows glow, people at the door; in the harbour the ships ride at their
// moorings with lights aboard, the town's lights climb the hill. Card: each team may spend up to 2 Порох and draw as
// many cards.
// Second pass (review): the arms were tubes with ball joints and mitten hands, the faces had no features, the keg read
// as a beer mug, the chart did not say «cards» — now the men are drawn as contours (lib/people.cjs: sleeves with folds
// and cuffs, hands with fingers on what they hold, heads in profile with eye, brow, nose, mouth, the lantern warm on
// the cheeks); the kegs are squat casks with hoops and the black bomb mark; the chart is a fan of two cards.
// The blue hour with lamps was chosen for the port (the sea series is day, the brief leaves it to the author).
// Brief: docs/mockups/print/card-briefs.md «Тортуга».
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
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
    ['keg', 80, 108, 20, 24, 'a keg of powder on the barrel head, both the pirate\'s hands on it, powder trickling out'],
    ['keg 2', 100, 105, 17, 20, 'the second keg at the back of the barrel head'],
    ['cards', 108, 76, 18, 18, 'two cards fanned in the fence\'s hand, backs to us, over the second keg'],
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

module.exports = { name: 'Тортуга', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 }), LF = K.makeLight(lightFar, { horizon: HZ, eye: 1.6 });
    // the blue hour: the sky still deep blue over the hill, the lamps already lit
    const pal = { sky: ['#0a1230', '#18275a', '#2c4480', '#566aa0'], sea: ['#3a5086', '#1a2a50', '#0a1228'] };
    L.pal = Object.assign({}, L.pal, pal); LF.pal = Object.assign({}, LF.pal, pal);
    // ——— far: the sky, the hill with the town's lights, the harbour water, the ships at their moorings
    let bg = K.sky(u, LF, { horizon: HZ, stars: 60, seed: 9, density: 1 });
    bg += hill(u, LF);
    bg += K.water(u, LF, { horizon: HZ, bottom: QUAY + 2, swell: .1, seed: 6, glitter: false });
    bg += K.ship(u, LF, { kind: 'merchant', x: 96, y: 70, scale: .42, sails: 'furled', detail: 'far', lights: true, seed: 12 });
    bg += K.ship(u, LF, { kind: 'brig', x: 168, y: 86, scale: 1, flip: true, sails: 'furled', detail: 'mid', lights: true, reflect: true, seed: 5 });
    bg += lightsOnWater(u);
    // ——— the quay: its stone edge, the paving, the tavern on the left, the people at its door
    bg += quay(u, L);
    bg += tavern(u, L);
    // ——— near: the bracket and lantern, the barrel table, the two men, the kegs and the cards
    let fg = bracket(u, L) + K.lantern(u, L, LAMP);
    fg += K.castShadow(u, L, { x: 100, y: 168, w: 42, h: 60, horizon: HZ });
    fg += K.barrel(u, L, { x: 100, y: 168, s: 2, kind: 'rum', seed: 3 });
    // two kegs of powder (up to 2 Порох): one already stands at the back of the barrel head, the pirate sets the
    // other down in front of it with both hands; the fence holds out two cards to him
    const P = pirate(u, L);
    fg += K.castShadow(u, L, { x: 108, y: 105.4, w: 16, h: 20, horizon: HZ, d: .6 }) + keg(u, L, { x: 108.6, y: 105.4, h: 20, r: 7.8, seed: 5, lightX: 104 });
    fg += P.body;
    fg += K.castShadow(u, L, { x: KEG.x, y: KEG.y, w: KEG.r * 2, h: KEG.h, horizon: HZ, d: .6 }) + keg(u, L, Object.assign({ seed: 8, spill: true }, KEG));
    fg += P.farFingers + P.arm;
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
// Drawn as contours (lib/people.cjs): sleeves with folds and cuffs, no joint balls, hands with fingers on what they
// hold, heads in profile with eye, brow, nose and mouth, the lantern warm on the cheeks.
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const skinOf = (L, x, y) => { const r = L.ramp('skin', x, y); return { lit: mix(r.lit, '#ffd8a0', .25), half: r.half, core: r.core, shadow: r.shadow, outline: r.outline }; };
const WARM = '#ffc27a';
// the pirate on the left, facing right, seen from the waist up behind the barrel: a loose shirt, an open leather
// waistcoat, a red sash; he sets the keg of powder down on the barrel head with both hands. Returns the parts in
// their layers: `body` (behind the keg), `farFingers` (round the keg's far side) and `arm` (the near arm, over it)
function pirate(u, L) {
  let s = '';
  // the far arm goes forward behind his body and the keg: only its shoulder shows
  // the torso: back on the left in shade, chest to the lamp
  const body = [[43, 65], [57, 61], [64, 64.6], [68.2, 72], [69.6, 84], [70.4, 98], [71, 112], [72, 140], [36, 140], [37.4, 112], [38.4, 92], [38.8, 78], [39.6, 70.4]];
  const sh = K.mat('linen', L, { form: 'cyl', x1: 54, y1: 66, x2: 54, y2: 140, r: 17, u });
  s += `<defs>${sh.defs}</defs><path d="${sp(body, true)}" fill="${sh.fill}" stroke="${sh.ramp.outline}" stroke-width=".5"/>`;
  for (const [a, b, c] of [[[60, 66], [64, 78], [66, 92]], [[52, 66], [55, 80], [58, 96]], [[46, 68], [45, 82], [46, 98]]]) s += `<path d="${sp([a, b, c])}" stroke="${sh.ramp.shadow}" stroke-width=".7" fill="none" opacity=".5"/>`;
  const vest = K.mat('leather', L, { form: 'cyl', x1: 50, y1: 66, x2: 50, y2: 140, r: 15, u });
  s += `<defs>${vest.defs}</defs><path d="${sp([[40, 67], [50, 63], [55, 66], [58, 80], [60, 98], [60.4, 112], [61, 140], [36, 140], [37.4, 112], [38.4, 92], [38.8, 78]], true)}" fill="${vest.fill}" stroke="${vest.ramp.outline}" stroke-width=".5"/>`;
  s += `<path d="${sp([[55, 66], [58, 80], [60, 98], [60.4, 112]])}" stroke="${vest.ramp.lit}" stroke-width=".6" fill="none" opacity=".6"/>`;
  for (const y of [78, 88, 98]) s += K.shadeSphere(u, 59 + (y - 78) * .06, y, .9, L, 'brass', { outline: .3 });
  const sa = K.mat('paint-red', L, { form: 'cyl', x1: 54, y1: 104, x2: 54, y2: 116, r: 17, u });
  s += `<defs>${sa.defs}</defs><path d="${sp([[37.6, 104], [54, 105.4], [70.6, 103.6], [71.2, 115], [54, 117], [37.2, 115.6]], true)}" fill="${sa.fill}" stroke="${sa.ramp.outline}" stroke-width=".45"/>`;
  // the neck, the long hair behind, the head in profile to the right: bearded, a kerchief, an earring
  const sk = skinOf(L, 60, 50);
  s += H.cloth(u, { spine: [[55.8, 66], [57.8, 57.6]], w: [8.4, 7.4], tone: sk, lit: -1, folds: false });
  s += `<path d="${sp([[51, 53], [49.4, 58.6], [47.6, 63], [44, 66.4], [48, 66], [51.4, 64], [53.6, 60.6]], true)}" fill="#1c120c" stroke="#0a0604" stroke-width=".4"/>`;
  s += headDressed(u, L, [58.6, 49.4], 8.4, 1, sk, { beard: true, kerchief: true, earring: true, brow: 'calm' });
  // the near (left) arm: the shirt sleeve rolled to the elbow, the bare forearm forward to the keg, the hand on its side
  const sh0 = [61, 70], el = [63.6, 89], wr = [76.4, 97.6];
  let arm = H.cloth(u, { spine: [lerp2(el, wr, .1), wr], w: [5.8, 4.6], tone: sk, lit: -1, folds: false, seed: 4 });
  // hair and a vein on the forearm
  { const R = rng(9); for (let i = 0; i < 12; i++) { const t = .2 + R() * .7, p = lerp2(el, wr, t), q = [p[0] + (R() - .5) * 2, p[1] - .6 - R() * 1.2]; arm += `<path d="M${f(q[0])} ${f(q[1])}l1 .3" stroke="#3a2010" stroke-width=".22" opacity=".55"/>`; } }
  const lin = (() => { const r = L.ramp('linen', 62, 80); return { lit: mix(r.lit, WARM, .2), half: r.half, core: r.core, shadow: r.shadow, outline: r.outline }; })();
  arm += H.cloth(u, { spine: [sh0, [62.4, 80], lerp2(el, wr, .16)], w: [9, 8.2, 7.4], tone: lin, lit: -1, cuff: { from: .74, k: 1.1, roll: true }, seed: 8, capA: true, drapes: 4 });
  const hn = H.hand(u, { at: wr, a: -16, s: 1.25, m: 1, pose: 'open', spread: 7, curl: .3, tone: sk, thumb: 'front', sw: .42 });
  arm += hn.back + hn.front;
  // his far hand round the keg's far side: only the fingers show, curled over its flank
  const fh = H.hand(u, { at: [KEG.x + KEG.r + 7.2, KEG.y - KEG.h * .55], a: 172, s: 1.15, m: -1, pose: 'hook', spread: 5, curl: .55, tone: mixT(sk, .3), thumb: 'back', sw: .42 });
  return { body: s, arm, farFingers: fh.front };
}
const mixT = (t, k) => ({ lit: mix(t.lit, t.half, k), half: mix(t.half, t.shadow, k), core: mix(t.core || t.half, t.shadow, k), shadow: mix(t.shadow, '#05060c', k * .5), outline: t.outline });

// the keg of powder: a squat cask with heavy hoops, a round head with the bung, the black mark of powder stencilled on
// its belly (a bomb with a burning fuse), powder trickling from a cracked stave into a little heap
const KEG = { x: 90, y: 108.4, h: 24, r: 9.4 };
function keg(u, L, o) {
  const { x, y, h, r } = o, k = .3, bul = .12, oak = L.ramp('oak', x, y - h / 2), ir = L.ramp('iron', x, y - h / 2), R = rng(o.seed || 3);
  const rad = t => r * (1 + bul * Math.sin(Math.PI * t)), Y = t => y - h * t;
  const side = [];
  for (let i = 0; i <= 10; i++) side.push([x - rad(i / 10), Y(i / 10)]);
  for (let i = 10; i >= 0; i--) side.push([x + rad(i / 10), Y(i / 10) + 0]);
  const body = `M${f(x - r)} ${f(y)}` + side.slice(1, 11).map(p => `L${f(p[0])} ${f(p[1])}`).join('') + `A${f(r)} ${f(r * k)} 0 0 1 ${f(x + r)} ${f(Y(1))}` + side.slice(12).map(p => `L${f(p[0])} ${f(p[1])}`).join('') + `A${f(r)} ${f(r * k)} 0 0 1 ${f(x - r)} ${f(y)}Z`;
  const g = nid('kg', u), cid = nid('kc', u), lx = o.lightX != null ? o.lightX : 100;
  const litFrac = clamp(.5 + (lx - x) / (r * 4), .2, .85);
  let s = K.contactShadow(u, x, y, r * 2.2, L, { ry: r * k * .9, opacity: .7 });
  s += `<defs>${linGrad(g, x - r * 1.15, 0, x + r * 1.15, 0, [[0, mix(oak.shadow, '#0a0604', .4)], [litFrac * .55, oak.shadow], [litFrac, mix(oak.lit, WARM, .25)], [Math.min(.98, litFrac + .25), oak.core], [1, mix(oak.shadow, '#0a0604', .3)]])}<clipPath id="${cid}"><path d="${body}"/></clipPath></defs>`;
  s += `<path d="${body}" fill="url(#${g})"/>`;
  s += `<g clip-path="url(#${cid})">`;
  // the staves: seams curving with the belly, a few darker and lighter
  for (let i = -4; i <= 4; i++) { const a = i / 4.6, pts = []; for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push([x + rad(t) * Math.sin(a * Math.PI / 2), Y(t) + r * k * Math.cos(a * Math.PI / 2) * .9]); }
    s += `<path d="${sp(pts)}" stroke="${mix(oak.shadow, '#000', .4)}" stroke-width=".35" fill="none" opacity=".6"/>`;
    if (R() < .4) s += `<path d="${sp(pts.map(p => [p[0] + 1.2, p[1]]))}" stroke="${R() < .5 ? '#000' : oak.lit}" stroke-width="1.6" fill="none" opacity=".1"/>`; }
  // the powder mark: a black bomb with a long burning fuse and a spark, stencilled on the belly
  { const cx = x - r * .16, cy = Y(.42), br = r * .27, ink = '#0c0806';
    s += `<g opacity=".92"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(br)}" fill="${ink}"/>`
      + `<path d="M${f(cx + br * .45)} ${f(cy - br * .78)}l${f(br * .42)} ${f(-br * .36)}l${f(br * .34)} ${f(br * .42)}l${f(-br * .42)} ${f(br * .34)}Z" fill="${ink}"/>`
      + `<path d="M${f(cx + br * 1.05)} ${f(cy - br * 1.05)}c${f(br * .5)} ${f(-br * .55)} ${f(br * 1.2)} ${f(-br * .2)} ${f(br * 1.5)} ${f(-br * .9)}" fill="none" stroke="${ink}" stroke-width="${f(br * .2)}" stroke-linecap="round"/>`;
    const sx = cx + br * 2.75, sy = cy - br * 2.2; let st = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2, l = (i % 2 ? .5 : .95) * br; st += `M${f(sx + Math.cos(a) * br * .18)} ${f(sy + Math.sin(a) * br * .18)}L${f(sx + Math.cos(a) * l)} ${f(sy + Math.sin(a) * l)}`; }
    s += `<path d="${st}" stroke="${ink}" stroke-width="${f(br * .16)}" stroke-linecap="round"/><circle cx="${f(sx)}" cy="${f(sy)}" r="${f(br * .2)}" fill="${ink}"/></g>`;
    s += `<path d="M${f(cx - br * .7)} ${f(cy - br * .25)}a${f(br * .75)} ${f(br * .75)} 0 0 1 ${f(br * .5)} ${f(-br * .5)}" stroke="${oak.core}" stroke-width="${f(br * .14)}" fill="none" opacity=".45" stroke-linecap="round"/>`; }
  s += '</g>';
  // the hoops: iron bands round the belly near each end, dark under, lit along their top edge
  for (const t of [.07, .2, .8, .93]) { const rr = rad(t) * 1.02, yy = Y(t), d = `M${f(x - rr)} ${f(yy)}A${f(rr)} ${f(rr * k)} 0 0 0 ${f(x + rr)} ${f(yy)}`;
    s += `<path d="${d}" stroke="${ir.outline}" stroke-width="2.2" fill="none"/><path d="${d}" stroke="${ir.core}" stroke-width="1.5" fill="none"/><path d="M${f(x - rr * .2)} ${f(yy + rr * k - .5)}A${f(rr)} ${f(rr * k)} 0 0 0 ${f(x + rr * .9)} ${f(yy + rr * k * .4 - .5)}" stroke="${mix(ir.lit, WARM, .4)}" stroke-width=".45" fill="none" opacity=".8"/>`; }
  s += `<path d="${body}" fill="none" stroke="${oak.outline}" stroke-width=".5"/>`;
  // the head: the chime, the recessed head lit by the lantern, the bung stopped with a wooden plug
  const hy = Y(1), rt = rad(1);
  s += `<ellipse cx="${f(x)}" cy="${f(hy)}" rx="${f(rt)}" ry="${f(rt * k)}" fill="${mix(oak.shadow, '#0a0604', .3)}" stroke="${oak.outline}" stroke-width=".5"/>`;
  s += `<ellipse cx="${f(x)}" cy="${f(hy + .5)}" rx="${f(rt * .86)}" ry="${f(rt * k * .82)}" fill="${mix(oak.lit, WARM, .2)}"/>`;
  for (const q of [-.4, 0, .4]) s += `<path d="M${f(x + q * rt * .86)} ${f(hy + .5 - rt * k * .8 * Math.sqrt(1 - q * q))}V${f(hy + .5 + rt * k * .8 * Math.sqrt(1 - q * q))}" stroke="${oak.shadow}" stroke-width=".3" opacity=".6"/>`;
  s += `<ellipse cx="${f(x + rt * .3)}" cy="${f(hy + .6)}" rx="1.4" ry=".55" fill="${oak.shadow}" stroke="${oak.outline}" stroke-width=".3"/>`;
  if (o.spill) {
    // a crack low in a stave by the bottom hoop: the powder runs out in a thin black stream to a heap on the barrel
    const cx = x + rad(.12) * .62, cy = Y(.14), hx = cx + 3.2, hy2 = y + 2.6;
    s += `<path d="M${f(cx - .8)} ${f(cy)}l1.8 .4" stroke="#050302" stroke-width=".7"/>`;
    s += `<path d="M${f(cx + .6)} ${f(cy + .3)}C${f(cx + 1.8)} ${f(cy + .6)} ${f(hx - .4)} ${f(hy2 - 2.6)} ${f(hx)} ${f(hy2 - .6)}" stroke="#14100c" stroke-width=".7" fill="none"/>`;
    s += `<path d="M${f(hx - 3.6)} ${f(hy2 + .4)}Q${f(hx)} ${f(hy2 - 2)} ${f(hx + 3.8)} ${f(hy2 + .5)}Z" fill="#18120e"/>`;
    const RR = rng(21); for (let i = 0; i < 24; i++) { const gx = hx - 6 + RR() * 12, gy = hy2 + .3 + RR() * 1.4; s += `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(.16 + RR() * .16)}" fill="#14100c" opacity="${f(.6 + RR() * .4)}"/>`; }
    for (let i = 0; i < 6; i++) { const t = RR(); s += `<circle cx="${f(lerp(cx + 1, hx, t) + (RR() - .5) * .8)}" cy="${f(lerp(cy + .5, hy2 - .8, t))}" r=".18" fill="#14100c"/>`; }
    s += `<path d="M${f(hx - 2.4)} ${f(hy2 - .2)}q2.2 -1.2 4.4 0" stroke="${WARM}" stroke-width=".25" fill="none" opacity=".45"/>`;
  }
  return s;
}

// the fence on the right, facing left: a long dark-red coat with wide cuffs and brass buttons over a waistcoat and
// a stock, a tricorne; his right arm out over the barrel, offering two cards fanned in his fingers, backs to us
function fence(u, L) {
  let s = '';
  const coat = K.mat('paint-red', L, { form: 'cyl', x1: 146, y1: 66, x2: 146, y2: 140, r: 18, u });
  const body = [[162, 69], [150, 62], [139, 65], [134.6, 74], [132.6, 88], [131.6, 104], [130.4, 140], [168, 140], [166, 110], [165, 88], [163.6, 74]];
  s += `<defs>${coat.defs}</defs><path d="${sp(body, true)}" fill="${coat.fill}" stroke="${coat.ramp.outline}" stroke-width=".5"/>`;
  const wc = K.mat('paint-ochre', L, { form: 'cyl', x1: 138, y1: 70, x2: 138, y2: 130, r: 6, u });
  s += `<defs>${wc.defs}</defs><path d="${sp([[139.4, 66], [135, 74], [133.4, 88], [132.6, 104], [132.2, 118], [138.4, 120], [139, 104], [139.6, 88], [141, 72]], true)}" fill="${wc.fill}" stroke="${wc.ramp.outline}" stroke-width=".45"/>`;
  s += `<path d="${sp([[140.2, 62.4], [136, 64], [134.6, 68.6], [137.4, 72], [140.6, 68]], true)}" fill="${L.ramp('linen', 137, 66).half}" stroke="${L.ramp('linen', 137, 66).outline}" stroke-width=".4"/>`;
  s += `<path d="${sp([[141, 66], [141.6, 80], [140.4, 96], [140, 118]])}" stroke="${coat.ramp.shadow}" stroke-width="1.6" fill="none"/>`;
  for (const y of [80, 88, 96, 104]) s += K.shadeSphere(u, 138 - (y - 80) * .05, y, .8, L, 'brass', { outline: .3 });
  for (const [a, b, c] of [[[156, 70], [158, 90], [160, 112]], [[150, 76], [150.6, 96], [151, 120]]]) s += `<path d="${sp([a, b, c])}" stroke="${coat.ramp.shadow}" stroke-width=".9" fill="none" opacity=".6"/>`;
  // the neck, the hair tied in a queue behind, the head in profile to the left with a tricorne
  const sk = skinOf(L, 140, 50);
  s += H.cloth(u, { spine: [[145, 65.6], [143.6, 57.6]], w: [8, 7.2], tone: sk, lit: 1, folds: false });
  s += `<path d="${sp([[148, 53], [151.2, 56.6], [152, 61.4], [150.6, 64.6], [149.4, 61], [147, 57.6]], true)}" fill="#24180e" stroke="#0a0604" stroke-width=".4"/>`;
  s += `<path d="M150.8 60.4l1.8 1.4" stroke="#1a1a24" stroke-width="1.2"/>`;
  s += headDressed(u, L, [142.6, 49.4], 8.2, -1, sk, { tricorne: true, moustache: true, brow: 'up' });
  // the near (right) arm out over the barrel: the coat sleeve with its folds, the big turned cuff, a lace ruffle; the
  // hand holds the two cards up between the thumb (in front) and the fingers (behind)
  const red = (() => { const r = L.ramp('paint-red', 132, 80); return { lit: mix(r.lit, WARM, .25), half: r.half, core: r.core, shadow: r.shadow, outline: r.outline }; })();
  const sh0 = [141, 70], el = [133, 87], wr = [122.8, 80.4];
  s += H.cloth(u, { spine: [sh0, el, wr], w: [9, 8, 7.2], tone: red, lit: 1, rim: mix(red.lit, WARM, .4), rimSide: 1, seed: 12, cuff: { from: .66, k: 1.22, tone: (() => { const r = L.ramp('paint-red', 126, 82); return { lit: mix(r.lit, '#ffb080', .35), half: mix(r.half, '#000', .12), core: r.core, shadow: mix(r.shadow, '#000', .2), outline: r.outline }; })(), buttons: .8 }, L, capA: true, drapes: 4, foldW: 1.4 });
  // the lace ruffle at the wrist
  { const a = ang(el, wr) * Math.PI / 180, nx = -Math.sin(a), ny = Math.cos(a), ux = Math.cos(a), uy = Math.sin(a), ln = L.ramp('linen', wr[0], wr[1]);
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8 * 2 - 1, out = i % 2 ? 1.6 : .4; pts.push([wr[0] + nx * t * 3.8 + ux * out, wr[1] + ny * t * 3.8 + uy * out]); }
    pts.push([wr[0] + nx * 3.4 - ux * .6, wr[1] + ny * 3.4 - uy * .6], [wr[0] - nx * 3.4 - ux * .6, wr[1] - ny * 3.4 - uy * .6]);
    s += `<path d="${sp(pts, true)}" fill="${mix(ln.lit, WARM, .2)}" stroke="${ln.outline}" stroke-width=".35"/>`; }
  const hn = H.hand(u, { at: [wr[0] - 1, wr[1] - .6], a: -128, s: 1.12, m: -1, pose: 'open', spread: 6, curl: .55, tone: sk, thumb: 'front', thumbA: 14, sw: .42 });
  s += hn.back + cards(u, L, [117.4, 75.4]) + hn.front;
  return s;
}
// two playing cards fanned from one corner held in the hand, their backs to us: a dark blue field, a gilt border and a
// compass rose in the middle (our deck's back), the lantern warm on the gilt
function cards(u, L, pv) {
  let s = '';
  for (const [rot, dx] of [[-26, -.6], [-4, .6]]) {
    const w = 9.4, h = 13, g = nid('cd', u), x = pv[0] + dx - w / 2, y = pv[1] - h + 1.6;
    let c = `<defs>${linGrad(g, x, y, x + w, y + h, [[0, '#33507a'], [.45, '#1d3050'], [1, '#0e1a30']])}</defs>`;
    c += `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="1" fill="#efe4c8" stroke="#3a2a1a" stroke-width=".35"/>`;
    c += `<rect x="${f(x + .7)}" y="${f(y + .7)}" width="${f(w - 1.4)}" height="${f(h - 1.4)}" rx=".6" fill="url(#${g})"/>`;
    c += `<rect x="${f(x + 1.4)}" y="${f(y + 1.4)}" width="${f(w - 2.8)}" height="${f(h - 2.8)}" rx=".4" fill="none" stroke="#d8a84a" stroke-width=".35"/>`;
    const cx = x + w / 2, cy = y + h / 2; let st = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, l = i % 2 ? 1.6 : 2.8, b = a + Math.PI / 8, b2 = a - Math.PI / 8; st += `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(b2) * .7)} ${f(cy + Math.sin(b2) * .7)}L${f(cx + Math.cos(a) * l)} ${f(cy + Math.sin(a) * l)}L${f(cx + Math.cos(b) * .7)} ${f(cy + Math.sin(b) * .7)}Z`; }
    c += `<circle cx="${f(cx)}" cy="${f(cy)}" r="2.1" fill="none" stroke="#d8a84a" stroke-width=".3"/><path d="${st}" fill="#e8c060" stroke="#7a5a1a" stroke-width=".12"/>`;
    c += `<path d="M${f(x + .5)} ${f(y + .9)}V${f(y + h - 1)}" stroke="#fff6dc" stroke-width=".35" opacity=".7"/>`;
    s += `<g transform="rotate(${rot} ${f(pv[0])} ${f(pv[1])})">${c}</g>`;
  }
  return s;
}
// a head in profile (lib/people.cjs) with what each man wears: a beard, a moustache, a kerchief with its knot, a
// tricorne, a gold ring in the ear; the lantern between them warms the face side
function headDressed(u, L, c, r, dir, tone, o) {
  const hd = H.head(u, { c, r, dir, tone, warm: { color: '#ffb868', op: .55 }, edge: mix(tone.lit, WARM, .3), mouth: 0, eye: 'open', brow: o.brow, beard: o.beard, moustache: o.moustache, hairColor: o.beard ? '#22140c' : '#2a1a10', stubble: !o.beard });
  const Q = hd.Q;
  let s = hd.svg;
  if (o.beard) s += `<path d="${sp([Q(-.04, .5), Q(.26, .62), Q(.58, .7), Q(.86, .64), Q(.98, .76), Q(.94, 1.06), Q(.8, 1.42), Q(.46, 1.5), Q(.14, 1.2), Q(-.14, .8)], true)}" fill="#22140c" stroke="#0a0604" stroke-width=".4"/>`
    + `<path d="${sp([Q(1.04, .44), Q(.9, .46), Q(.74, .52), Q(.64, .62)])}" stroke="#22140c" stroke-width="${f(r * .12)}" fill="none" stroke-linecap="round"/>`
    + `<path d="${sp([Q(.9, .66), Q(.98, .82), Q(.92, 1.1), Q(.8, 1.4)])}" stroke="${mix('#22140c', WARM, .45)}" stroke-width=".5" fill="none" opacity=".8"/>`
    + `<path d="${sp([Q(1.02, .5), Q(.94, .51), Q(.86, .5)])}" stroke="#5a2a20" stroke-width="${f(r * .05)}" fill="none"/>`;
  if (o.earring) { const e = Q(-.04, .36); s += `<circle cx="${f(e[0])}" cy="${f(e[1] + .9)}" r="1" fill="none" stroke="#e0b450" stroke-width=".45"/>`; }
  if (o.kerchief) {
    const kr = L.ramp('paint-red', c[0], c[1] - r), id = nid('hk', u);
    s += `<defs>${linGrad(id, c[0] - dir * r, c[1], c[0] + dir * r, c[1] - r, [[0, kr.shadow], [.55, kr.core], [1, mix(kr.lit, WARM, .3)]])}</defs>`;
    s += `<path d="${sp([Q(-1.06, .1), Q(-.96, -.62), Q(-.4, -1.1), Q(.34, -1.12), Q(.82, -.72), Q(.66, -.52), Q(.1, -.68), Q(-.44, -.36), Q(-.7, .12)], true)}" fill="url(#${id})" stroke="${kr.outline}" stroke-width=".45"/>`;
    s += `<path d="${sp([Q(-.92, -.2), Q(-1.6, .2), Q(-1.9, .9), Q(-1.5, .7), Q(-1.3, .4), Q(-1.26, 1.1), Q(-.9, .5)], true)}" fill="${kr.shadow}" stroke="${kr.outline}" stroke-width=".4"/>`;
  }
  if (o.tricorne) {
    const hat = L.ramp('tar', c[0], c[1] - r), id = nid('ht', u);
    s += `<path d="${sp([Q(-.96, -.3), Q(-.84, -.7), Q(-.4, -.8), Q(-.6, -.2)], true)}" fill="#2a1a10"/>`;
    s += `<defs>${linGrad(id, c[0] - dir * r, c[1] - r, c[0] + dir * r, c[1] - r * 1.4, [[0, hat.shadow], [.6, hat.core], [1, hat.half]])}</defs>`;
    s += `<path d="${sp([Q(-.96, -.44), Q(-.6, -1.34), Q(.1, -1.5), Q(.7, -1.2), Q(.9, -.72), Q(.3, -.8), Q(-.3, -.7)], true)}" fill="url(#${id})" stroke="${hat.outline}" stroke-width=".45"/>`;
    s += `<path d="${sp([Q(-1.5, -.2), Q(-1.1, -.9), Q(-.2, -.66), Q(.6, -.74), Q(1.3, -1.26), Q(1.14, -.5), Q(.2, -.4), Q(-.8, -.32)], true)}" fill="${hat.core}" stroke="${hat.outline}" stroke-width=".45"/>`;
    s += `<path d="${sp([Q(-.2, -.66), Q(.6, -.74), Q(1.3, -1.26)])}" stroke="${mix(hat.lit, WARM, .4)}" stroke-width=".5" fill="none"/>`;
  }
  return s;
}
