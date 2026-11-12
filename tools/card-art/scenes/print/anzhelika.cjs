// «Анжелика» (Месть, ПРИКАЗ: возьмите 2 карты, затем передайте союзнику 1 карту с руки), variant A of the method
// trial (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait.cjs SCENES['Анжелика']) at its
// best. The captain's cabin at night: the stern window with the moon over the sea, the curtains tied back; on the
// table the chart, the crossed cutlasses, the ring and a sealed letter she sends to the ally — the ally's ship lies
// close by in the window with her stern lights lit, a lantern raised to answer. A tall candle is the light of the
// table (shadows fan from under it); the moon through the window is the cold fill.
// Fixed against the first round: the sabres stood upright in the air — now they lean from the table to the sill
// with contact shadows; the ring stood on its edge — it lies on the letter; the chart was a sheet standing on a wall —
// the table top is in perspective and the chart lies on it; the stepped moon path is a real glitter on the water.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, shafts, motes, tableTop } = PK;

const HZ = 52;                                   // eye level = the sea horizon in the window
const WX = 30, WY = 2, WW = 140, WH = 78;        // the window glass
const TB = 96, TF = 150;                         // the table top: back edge (at the wall), front edge
const CAN = { x: 166, y: 140, s: 2.3, len: 15 };  // the candle stick on the table
const flameY = CAN.y - (3.4 + CAN.len + 3) * CAN.s;
const light = { time: 'night', haze: .25, key: { type: 'point', x: CAN.x, y: flameY, h: .45, gy: CAN.y, color: '#ffb860', power: 1, radius: 120 },
  fill: { color: '#3a5276', power: .4 }, rim: { az: 0, color: '#bcd4f4', power: .35 } };
const lightOut = { time: 'night', haze: .35, key: { type: 'moon', x: 118, y: 21, el: 18, color: '#d8e4fa', power: .8 }, fill: { color: '#3d5680', power: .4 } };
const skel = { horizon: HZ, eye: 1.3, light: 'tall candle on the table right (x 166) + the moon through the window (cold fill)', items: [
  ['window', WX, WY + WH, WW, WH, 'stern wall'], ['ally ship', 50, 60, 40, 30, 'sea in the window'], ['sill', WX - 8, 90, WW + 16, 8, 'window frame'],
  ['chart', 32, 142, 112, 40, 'table top'], ['sabre L', 66, 146, 50, 68, 'hilt on the chart, tip on the sill'], ['sabre R', 84, 146, 50, 68, 'hilt on the chart, tip on the sill'],
  ['letter', 120, 124, 30, 12, 'on the chart'], ['ring', 125, 118, 9, 4, 'on the letter'], ['candle', 155, 140, 22, 50, 'table top'],
  ['inkwell', 18, 134, 14, 12, 'table top'], ['quill', 24, 134, 18, 40, 'in the inkwell'], ['spyglass', 130, 92, 34, 5, 'on the sill']] };

// a smooth path through points (Catmull-Rom)
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// heavy velvet curtain drawn aside and tied: folds as a repeated fold gradient, lit edge to the candle, gold tie and tassel
function curtain(u, x, d, lit) {
  const id = nid('cu', u), sh = nid('cs', u);
  const outer = `M${x} -4h${18 * d}q${-3 * d} 34 ${-7 * d} 58q${9 * d} 20 ${6 * d} 50h${-15 * d}q${-5 * d} -28 ${-3 * d} -50q${-3 * d} -30 ${1 * d} -58z`;
  let out = `<defs>${linGrad(id, x, 0, x + 18 * d, 0, [[0, '#2a0608', 1], [.12, lit ? '#a83226' : '#7a1c1a', 1], [.25, '#3a0a0c', 1], [.4, lit ? '#b8402e' : '#8a2420', 1], [.55, '#4a0e10', 1], [.72, lit ? '#c04a34' : '#922a22', 1], [.88, '#3a0a0c', 1], [1, '#1a0406', 1]])}`
    + `${linGrad(sh, 0, 50, 0, 110, [[0, '#000', 0], [1, '#000', .35]])}</defs>`
    + `<path d="${outer}" fill="url(#${id})" stroke="#1a0406" stroke-width=".5"/><path d="${outer}" fill="url(#${sh})"/>`;
  for (const k of [4, 8.5, 13]) out += `<path d="M${x + k * d} -2q${-1.4 * d} 30 ${-3.6 * d} 54q${3.4 * d} 22 ${1.6 * d} 48" stroke="#1e0406" stroke-width=".55" fill="none" opacity=".55"/>`;
  // the fringe along the inner edge and the gold rope tie with its tassel
  out += `<path d="M${x - 2 * d} 55q${9 * d} 4 ${17 * d} -1" stroke="#6a4a14" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${x - 2 * d} 54.4q${9 * d} 4 ${17 * d} -1" stroke="#e2c066" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
    + `<path d="M${x - 1 * d} 55.6q${8 * d} 3 ${15 * d} -1" stroke="#fff0b0" stroke-width=".35" fill="none" opacity="${lit ? .8 : .4}" stroke-dasharray="1 1.2"/>`
    + `<path d="M${x + 15 * d} 54q${1 * d} 5 ${0 * d} 8" stroke="#c9a048" stroke-width=".8" fill="none"/><path d="M${x + 13.6 * d} 62l${1.4 * d} -1.2l${1.4 * d} 1.2l${.6 * d} 6h${-4 * d}z" fill="#c9a048" stroke="#5a3a10" stroke-width=".3"/>`
    + `<path d="M${x + 13.4 * d} 64h${3.2 * d}" stroke="#fff0b0" stroke-width=".3" opacity=".6"/>`;
  return out;
}
// a folded letter lying on the table in perspective, the red wax seal on a ribbon
function letter(u, L, x, y, w, dpt, rot) {
  const a = rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = (lx, ly) => [x + lx * c - ly * s * 2.4, y + lx * s * .42 + ly];
  const pts = [P(-w / 2, -dpt), P(w / 2, -dpt), P(w / 2, 0), P(-w / 2, 0)], g = nid('lt', u), rp = L.ramp('bone', x, y);
  const pp = q => q.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  let out = K.contactShadow(u, x, y + .6, w * 1.05, L, { ry: dpt * .6, opacity: .55 })
    + `<defs>${linGrad(g, P(-w / 2, 0)[0], 0, P(w / 2, 0)[0], 0, [[0, rp.half, 1], [.6, rp.lit, 1], [1, mix(rp.lit, '#fff4d8', .4), 1]])}</defs>`
    + `<path d="M${pp(pts)}Z" fill="url(#${g})" stroke="${rp.outline}" stroke-width=".4"/>`
    // the folds: the flap meets in a point under the seal, a crease across
    + `<path d="M${pp([P(-w / 2, -dpt), P(0, -dpt * .35), P(w / 2, -dpt)])}" stroke="${rp.shadow}" stroke-width=".4" fill="none" opacity=".7"/>`
    + `<path d="M${pp([P(-w / 2 + .6, -dpt + .4), P(0, -dpt * .35 + .5), P(w / 2 - .6, -dpt + .4)])}" stroke="${rp.lit}" stroke-width=".3" fill="none" opacity=".7"/>`
    + `<path d="M${pp([P(-w / 2, -dpt * .5), P(w / 2, -dpt * .5)])}" stroke="${rp.half}" stroke-width=".25" opacity=".5"/>`;
  const sp = P(0, -dpt * .38), red = L.ramp('paint-red', sp[0], sp[1]);
  out += `<path d="M${f(sp[0] - .5)} ${f(sp[1])}q-1.6 3.2 -4.4 5.4M${f(sp[0] + .5)} ${f(sp[1])}q.4 3.6 2.6 6" stroke="${red.half}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
    + `<path d="M${f(sp[0] - 3.3)} ${f(sp[1] + .4)}q1.2 -1.6 3.2 -1.8q2.2 -.1 3.6 1.4q-.2 1.8 -3.2 2.2q-2.6 .2 -3.6 -1.8z" fill="${red.half}" stroke="${red.outline}" stroke-width=".35"/>`
    + `<ellipse cx="${f(sp[0] + .1)}" cy="${f(sp[1] + .1)}" rx="1.9" ry=".95" fill="none" stroke="${red.shadow}" stroke-width=".35"/><path d="M${f(sp[0] + .6)} ${f(sp[1] - .8)}q1.2 .2 1.8 .9" stroke="${red.lit}" stroke-width=".35" fill="none"/>`;
  return out;
}
// a gold ring with a stone lying flat (seen from above at the table's slant)
function ring(u, L, x, y, r, ky) {
  const rp = L.ramp('brass', x, y), g = nid('rg', u), ry = r * ky;
  return K.contactShadow(u, x + .4, y + .5, r * 2.4, L, { ry: ry * 1.1, opacity: .6 })
    + `<defs>${linGrad(g, x - r, y, x + r, y, [[0, rp.shadow, 1], [.4, rp.half, 1], [.8, rp.lit, 1], [1, rp.spec || '#fff4c8', 1]])}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(ry)}" fill="none" stroke="${rp.outline}" stroke-width="${f(r * .55)}"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(ry)}" fill="none" stroke="url(#${g})" stroke-width="${f(r * .38)}"/>`
    + `<path d="M${f(x + r * .2)} ${f(y - ry - .1)}q${f(r * .6)} .1 ${f(r * .9)} ${f(ry * .6)}" stroke="#fff6d0" stroke-width=".3" fill="none" opacity=".9"/>`
    // the stone in its claws on the near side
    + `<path d="M${f(x - 1.5)} ${f(y + ry - .2)}l1.5 -1.6l1.5 1.6l-1.5 1.3z" fill="#2a6aa8" stroke="#0e2a48" stroke-width=".3"/><path d="M${f(x - .2)} ${f(y + ry - 1.2)}l.9 1" stroke="#e8f6ff" stroke-width=".35"/>`
    + `<circle cx="${f(x + .5)}" cy="${f(y + ry - .9)}" r=".35" fill="#ffffff"/>`;
}
// a glass inkwell with a quill in it
function inkwell(u, L, x, y, k = 1) {
  const sc = `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">`;
  let out = K.castShadow(u, L, { x, y, w: 9, h: 9, horizon: HZ, d: .9 })
    + K.shadeCyl(u, x, y, x, y - 6.5, 4.4, L, 'glass', { r1: 4.6, r2: 3.4, ell: .34, face: 2, outline: .4 })
    + `<path d="M${f(x - 4.1)} ${f(y - 2.2)}q4.1 1.4 8.2 0v1.6q-4.1 1.6 -8.2 0z" fill="#0c0f1a" opacity=".85"/>`
    + K.shadeCyl(u, x, y - 6.5, x, y - 8.2, 1.9, L, 'brass', { ell: .34, face: 2, outline: .35 }) + `<ellipse cx="${f(x)}" cy="${f(y - 8.2)}" rx="1.3" ry=".45" fill="#05070c"/>`;
  // the quill: a shaft from the ink up and to the left, a vane with barbs, lit on the side of the candle
  const q0 = [x + .2, y - 8.5], q1 = [x - 12, y - 42], rp = L.ramp('linen', x - 6, y - 26);
  out += `<path d="M${f(q0[0])} ${f(q0[1])}Q${f(x - 4)} ${f(y - 26)} ${f(q1[0])} ${f(q1[1])}" stroke="${rp.half}" stroke-width=".7" fill="none"/>`;
  const vane = smooth([[x - 2.6, y - 18], [x - 1, y - 28], [x - 4, y - 38], [x - 11.4, y - 42.4], [x - 9.4, y - 33], [x - 6.8, y - 24], [x - 2.6, y - 18]]);
  out += `<path d="${vane}" fill="${mix(rp.lit, '#f2e6cc', .6)}" stroke="${rp.outline}" stroke-width=".3" opacity=".95"/><path d="M${f(x - 2.4)} ${f(y - 18)}Q${f(x - 4.6)} ${f(y - 30)} ${f(x - 11.2)} ${f(y - 41.6)}" stroke="#fff8e8" stroke-width=".45" fill="none" opacity=".8"/>`;
  const R = rng(5); for (let i = 0; i < 12; i++) { const t = .15 + i / 13 * .8, sx = lerp(x - 2.4, x - 11.6, t), sy = lerp(y - 18, y - 42, t);
    out += `<path d="M${f(sx)} ${f(sy)}l${f(3 - t * 1.6 + R() * .6)} ${f(-1.6 - R())}" stroke="${rp.shadow}" stroke-width=".22" opacity=".6"/><path d="M${f(sx)} ${f(sy)}l${f(-2.4 + t)} ${f(.6 + R() * .4)}" stroke="${rp.half}" stroke-width=".22" opacity=".6"/>`; }
  return sc + out + '</g>';
}
const lerp = (a, b, t) => a + (b - a) * t;
// a brass spyglass lying on the sill
function spyglass(u, L, x0, y, x1) {
  return K.contactShadow(u, (x0 + x1) / 2, y + 1.6, x1 - x0, L, { ry: 1, opacity: .6 })
    + K.shadeCyl(u, x0, y, x0 + (x1 - x0) * .42, y, 2.1, L, 'leather', { outline: .35, ell: .3, face: 1 })
    + K.shadeCyl(u, x0 + (x1 - x0) * .4, y - .1, x0 + (x1 - x0) * .7, y - .1, 1.7, L, 'brass', { outline: .35 })
    + K.shadeCyl(u, x0 + (x1 - x0) * .68, y - .2, x1, y - .2, 1.35, L, 'brass', { outline: .35, ell: .3, face: 2 })
    + K.shadeCyl(u, x0 + (x1 - x0) * .38, y, x0 + (x1 - x0) * .43, y, 2.4, L, 'brass', { outline: .3 })
    + K.shadeCyl(u, x0 - .6, y, x0 + .8, y, 2.4, L, 'brass', { outline: .3, ell: .3, face: 1 });
}
// a pair of brass dividers lying open on the chart
function dividers(L, x, y, a) {
  const rp = L.ramp('brass', x, y), l = 14, p1 = [x + Math.cos(a - .22) * l, y + Math.sin(a - .22) * l * .5], p2 = [x + Math.cos(a + .22) * l, y + Math.sin(a + .22) * l * .5];
  return `<path d="M${f(p1[0])} ${f(p1[1] + .5)}L${f(x)} ${f(y + .5)}L${f(p2[0])} ${f(p2[1] + .5)}" stroke="#2a1606" stroke-width=".9" fill="none" opacity=".35"/>`
    + `<path d="M${f(p1[0])} ${f(p1[1])}L${f(x)} ${f(y)}L${f(p2[0])} ${f(p2[1])}" stroke="${rp.outline}" stroke-width="1" fill="none" stroke-linejoin="round"/>`
    + `<path d="M${f(p1[0])} ${f(p1[1])}L${f(x)} ${f(y)}L${f(p2[0])} ${f(p2[1])}" stroke="${rp.lit}" stroke-width=".45" fill="none"/><circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".3"/>`;
}

module.exports = { name: 'Анжелика', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.3 }), Lo = K.makeLight(lightOut, { horizon: HZ });
    // the stern wall: dark planking, warmer towards the candle
    let bg = woodTex(u, 0, 0, 200, TB + 2, '#5a3820', '#2a180c', '#140a04', 15, true, 3)
      + K.localGlow(u, { x: 172, y: 70, color: '#ff9a40', power: .35, radius: 70 }, { core: false });
    // the window: a deep frame, the night sea outside, the moon and its path, the ally close by with her lights
    { const cid = nid('win', u); let o = K.sky(u, Lo, { horizon: HZ, stars: 46, seed: 11, top: WY }) + K.sunMoon(u, Lo, { r: 6.4 })
        + K.cloud(u, Lo, { x: 64, y: 22, w: 46, h: 6, seed: 4, far: .35 }) + K.cloud(u, Lo, { x: 168, y: 40, w: 30, h: 4, seed: 9, far: .6 })
        + K.water(u, Lo, { horizon: HZ, bottom: WY + WH + 2, swell: .35, seed: 6, glitter: 118 });
      o += K.ship(u, Lo, { kind: 'pearl', x: 66, y: HZ + 9, scale: .36, detail: 'mid', sails: 'reefed', lights: true, flip: true, reflect: true, seed: 3 });
      // her answering lantern raised at the stern: the signal that the letter is awaited
      o += K.localGlow(u, { x: 81.5, y: HZ - 4, color: '#ffc870', power: .9, radius: 5 }) + `<circle cx="81.5" cy="${HZ - 4}" r=".8" fill="#fff2c0"/>`
        + K.localGlow(u, { x: 81.5, y: HZ + 12, color: '#ffb050', power: .35, radius: 4 }, { squash: .3, core: false });
      bg += `<defs><clipPath id="${cid}"><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}"/></clipPath></defs><rect x="${WX - 7}" y="${WY - 6}" width="${WW + 14}" height="${WH + 13}" rx="3" fill="#24140a"/>`
        + `<g clip-path="url(#${cid})">${o}</g>`;
      // the moonlight and the reflections on the old glass: a faint cool sheen, small panes
      const gs = nid('gs', u); bg += `<defs>${linGrad(gs, WX, WY, WX + WW, WY + WH, [[0, '#cfe0ff', .08], [.45, '#cfe0ff', 0], [.6, '#cfe0ff', .06], [1, '#cfe0ff', 0]])}</defs><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}" fill="url(#${gs})"/>`;
      // mullions and transoms: a big grid of oak bars with a lit edge (moonlight inside, candle on the right)
      const bars = [1, 2, 3].map(c => WX + c * WW / 4), rails = [WY + WH * .5];
      for (const x of bars) bg += `<rect x="${f(x - 1.6)}" y="${WY}" width="3.2" height="${WH}" fill="#2a180a"/><path d="M${f(x - 1.6)} ${WY}v${WH}" stroke="#08040a" stroke-width=".5"/><path d="M${f(x + 1.3)} ${WY}v${WH}" stroke="#a87444" stroke-width=".45" opacity=".7"/>`;
      for (const y of rails) bg += `<rect x="${WX}" y="${f(y - 1.6)}" width="${WW}" height="3.2" fill="#2a180a"/><path d="M${WX} ${f(y - 1.6)}h${WW}" stroke="#8a6040" stroke-width=".4" opacity=".7"/><path d="M${WX} ${f(y + 1.6)}h${WW}" stroke="#08040a" stroke-width=".5"/>`;
      // thin lead cames dividing each pane in two (old glass)
      for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) { const x = WX + (c + .5) * WW / 4, y = WY + (r + .5) * WH / 2; bg += `<path d="M${f(x)} ${f(y - WH / 4 + 1.6)}v${f(WH / 2 - 3.2)}" stroke="#14100c" stroke-width=".4" opacity=".55"/>`; }
      // the frame: inner gilt bead, outer moulding lit by the candle on its right side
      const fr = nid('fr', u); bg += `<defs>${linGrad(fr, WX - 7, 0, WX + WW + 7, 0, [[0, '#2a1608', 1], [.7, '#4a2c14', 1], [1, '#8a5a30', 1]])}</defs>`
        + `<path d="M${WX - 7} ${WY - 6}h${WW + 14}v${WH + 13}h${-WW - 14}zM${WX} ${WY}v${WH}h${WW}v${-WH}z" fill="url(#${fr})" fill-rule="evenodd" stroke="#0e0804" stroke-width=".6"/>`
        + `<rect x="${WX - .6}" y="${WY - .6}" width="${WW + 1.2}" height="${WH + 1.2}" fill="none" stroke="#c9a048" stroke-width=".8" opacity=".75"/>`
        + `<path d="M${WX + WW + 6.4} ${WY - 5}v${WH + 11}" stroke="#d49a5a" stroke-width=".6" opacity=".7"/>`; }
    // the sill: a deep oak ledge under the window, lit from the right, its front face in shadow
    { const sl = nid('sl', u), sf = nid('sf', u); bg += `<defs>${linGrad(sl, 20, 0, 180, 0, [[0, '#4a2c16', 1], [.75, '#7a4e2a', 1], [1, '#b07a44', 1]])}${linGrad(sf, 0, 89, 0, 96, [[0, '#3a2210', 1], [1, '#1a0e06', 1]])}</defs>`
        + `<path d="M${WX - 10} 86L${WX + WW + 10} 86L${WX + WW + 12} 90L${WX - 12} 90Z" fill="url(#${sl})" stroke="#0e0804" stroke-width=".5"/><path d="M${WX - 12} 90h${WW + 24}v5h${-WW - 24}z" fill="url(#${sf})" stroke="#0e0804" stroke-width=".5"/>`
        + `<path d="M${WX - 11} 90.3h${WW + 22}" stroke="#d8a466" stroke-width=".45" opacity=".6"/>`; }
    // the curtains (the right one nearer the candle, its folds warm), the rod over the window
    bg += K.shadeCyl(u, 6, 1, 194, 1, 1.6, L, 'brass', { outline: .35 }) + K.shadeSphere(u, 5, 1, 2.4, L, 'brass') + K.shadeSphere(u, 195, 1, 2.4, L, 'brass')
      + curtain(u, 16, -1, false) + curtain(u, 184, 1, true);
    // the table: an oak top in perspective (the planks run to the window), the front edge with a moulding
    bg += `<g>${tableTop(u, TB, TF - TB, '#7a4e2a', '#3a2210', 5)}</g>`
      + K.localGlow(u, { x: CAN.x - 12, y: CAN.y - 6, color: '#ffb050', power: .55, radius: 64 }, { squash: .45, core: false })
      + `<path d="M0 ${TB}h200" stroke="#0a0502" stroke-width="1.4"/>`;
    // the moonlight lies on the table in two cool panes of light (the shape of the window)
    bg += shafts(u, 118, 21, [[58, TB + 4, 96, TB + 30], [104, TB + 4, 140, TB + 26]], '#b8d0f0', .1);
    // the table edge and the apron (under the glass: calm, dark), the turned legs, the floor
    { const ed = nid('ed', u), ap = nid('ap', u);
      bg += `<defs>${linGrad(ed, 0, TF, 0, TF + 6, [[0, '#c08a52', 1], [.35, '#6a4020', 1], [1, '#2a1608', 1]])}${linGrad(ap, 0, TF + 6, 0, 200, [[0, '#2a180a', 1], [1, '#0e0804', 1]])}</defs>`
        + `<rect x="0" y="${TF}" width="200" height="6" fill="url(#${ed})"/><path d="M0 ${TF}h200" stroke="#e0aa6a" stroke-width=".7" opacity=".8"/>`
        + `<rect x="0" y="${TF + 6}" width="200" height="${280 - TF - 6}" fill="url(#${ap})"/>`
        + woodTex(u, 0, TF + 7, 200, 34, '#3a2412', '#1e1208', '#0a0502', 17, true, 9)
        + `<path d="M0 ${TF + 41}h200" stroke="#0a0502" stroke-width="1.2"/><path d="M0 ${TF + 42}h200" stroke="#8a5a30" stroke-width=".5" opacity=".5"/>`;
      // a drawer with a brass drop handle (under the glass)
      bg += `<rect x="70" y="${TF + 12}" width="60" height="20" rx="1" fill="#2a180a" stroke="#0a0502" stroke-width=".7"/><path d="M71 ${TF + 12.6}h58" stroke="#a87444" stroke-width=".4" opacity=".6"/>`
        + K.shadeCyl(u, 96, TF + 22, 104, TF + 22, 1, L, 'brass', { outline: .3 }) + K.shadeSphere(u, 96, TF + 21, 1.1, L, 'brass') + K.shadeSphere(u, 104, TF + 21, 1.1, L, 'brass');
      for (const x of [14, 186]) bg += K.shadeCyl(u, x, TF + 42, x, 284, 6, L, 'oak', { r1: 6, r2: 4.6, seed: x }) + K.shadeCyl(u, x, TF + 60, x, TF + 64, 7, L, 'oak', { grain: false, outline: .35 });
      bg += woodTex(u, 0, 252, 200, 32, '#2a180a', '#120a04', '#060302', 9, false, 12); }
    // on the sill: the spyglass, a little away from where the blades rest
    let fg = spyglass(u, L, 140, 85.4, 168);
    // the chart lies on the table in perspective (wider at the front), its far edge curled, weighted by the inkwell
    { const ch = [[38, 112], [146, 108], [152, 146], [30, 148]], g = nid('ch', u), v = nid('cv', u), rp = L.ramp('bone', 90, 128);
      const d = smooth([[38, 112], [92, 109.5], [146, 108], [148.6, 127], [152, 146], [92, 147.6], [30, 148], [34, 130]], true);
      fg += K.contactShadow(u, 91, 147, 124, L, { ry: 2, opacity: .5 })
        + `<defs>${linGrad(g, 30, 0, 152, 0, [[0, rp.half, 1], [.55, mix(rp.half, rp.lit, .6), 1], [1, rp.lit, 1]])}${radGrad(v, 90, 128, 70, [[.55, '#7a5020', 0], [1, '#6a4018', .45]])}</defs>`
        + `<path d="${d}" fill="url(#${g})" stroke="${rp.outline}" stroke-width=".45"/><path d="${d}" fill="url(#${v})"/>`;
      // ink: two coasts and islands, a route with a cross, a compass rose, a few depth marks
      const ink = rp.outline;
      fg += `<path d="M40 118q12 -4 22 1q10 -5 20 2q-4 9 -18 8q-14 4 -24 -4z" fill="${mix(rp.half, '#b89060', .5)}" stroke="${ink}" stroke-width=".4" opacity=".9"/>`
        + `<path d="M104 134q12 -6 24 -1q6 7 -6 10q-14 1 -18 -9z" fill="${mix(rp.half, '#b89060', .5)}" stroke="${ink}" stroke-width=".4" opacity=".9"/>`
        + `<path d="M136 112q6 2 4 8q3 6 10 6" stroke="${ink}" stroke-width=".4" fill="none" opacity=".8"/>`
        + `<path d="M60 136q22 -8 44 -6" stroke="#9a2a22" stroke-width=".8" stroke-dasharray="2 1.4" fill="none"/><path d="M101 128.6l3 3M104 128.6l-3 3" stroke="#9a2a22" stroke-width="1"/>`
        + `<g transform="translate(140 138) scale(1 .5)">${Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8, r = k % 2 ? 3.2 : 7; return `<path d="M0 0L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}" stroke="${ink}" stroke-width="${k % 4 ? .3 : .5}"/>`; }).join('')}<circle r="2.4" fill="none" stroke="${ink}" stroke-width=".3"/></g>`
        + [[66, 124], [74, 128], [84, 122], [118, 118], [50, 142], [140, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".35" fill="${ink}" opacity=".6"/>`).join('')
        // the far edge curls up a little (a roll of paper catching the candle)
        + `<path d="M38 112Q92 107.2 146 108" stroke="${rp.lit}" stroke-width="1.3" fill="none" opacity=".8"/><path d="M38 112.8Q92 108.4 146 109" stroke="${rp.shadow}" stroke-width=".5" fill="none" opacity=".6"/>`;
      fg += dividers(L, 44, 141, -.3); }
    // the crossed cutlasses: hilts on the near half of the chart, the blades lean back and their points rest on
    // the sill (contact shadows at the guards and at the points); the blades catch the candle
    { const S = 1.85; fg += K.castShadow(u, L, { x: 80, y: 141, w: 10, h: 18, horizon: HZ, d: .5, opacity: .5 }) + K.castShadow(u, L, { x: 118, y: 141, w: 10, h: 18, horizon: HZ, d: .5, opacity: .45 });
      fg += K.contactShadow(u, 68, 142, 10, L, { ry: 1.4, opacity: .7 }) + K.contactShadow(u, 132, 142, 10, L, { ry: 1.4, opacity: .7 })
        + K.contactShadow(u, 117, 89, 4, L, { ry: .8, opacity: .5 }) + K.contactShadow(u, 83, 89, 4, L, { ry: .8, opacity: .5 });
      fg += K.sabre(u, L, { x: 95, y: 114, s: S, rot: -50, contact: false, seed: 3 }) + K.sabre(u, L, { x: 105, y: 114, s: S, rot: 50, flip: true, contact: false, seed: 7 }); }
    // the inkwell and quill on the left, the letter with the ring on it on the right, near the candle
    fg += inkwell(u, L, 22, 134, 1.35);
    fg += letter(u, L, 134, 124, 26, 9, -8) + ring(u, L, 129, 116.6, 3.4, .4);
    // a few coins left beside the letter (the price of the passage)
    fg += K.coins(u, L, { x: 150, y: 146, s: .8, n: 4, seed: 6 });
    // the candle: its cast shadow on the table, the stick, the light
    fg += K.castShadow(u, L, { x: CAN.x, y: CAN.y, w: 8 * CAN.s, h: 2, horizon: HZ, d: .9 }) + K.candle(u, L, { ...CAN, seed: 4 });
    fg += K.localGlow(u, { x: CAN.x, y: flameY, color: '#ffd080', power: .8, radius: 22 }) + K.localGlow(u, { x: CAN.x, y: flameY + 10, color: '#ffa040', power: .45, radius: 70 }, { core: false })
      + glow(u, 100, 112, 30, 12, '#ffd8a0', .18)   // the blades catch the candle
      + glow(u, 100, 70, 90, 50, '#9ab8e0', .08)     // the moon fills the room a little
      + motes(18, 110, 30, 90, 110, '#ffe0b0', 12)
      + gloom(u, 40, 120, 0, 120, .35) + gloom(u, 100, 170, 100, 280, .5);
    return [bg, fg];
  } };
