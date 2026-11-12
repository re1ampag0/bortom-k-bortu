// «Русалки» (Колода моря): a still evening in the lilac afterglow, the full moon low over a cluster of black rocks off our bow. On the rocks
// the wild mermaids sing: one sits on the crown of the big rock, head thrown back, one arm raised to us against the
// moon; another lies on the low rock, her tail in the sea; a third flips her tail by the rocks. A sailor of a
// neutral ship has already leapt off the bow rail towards them — caught in mid-air, arms out, his trailing foot just
// leaving the rail; the ship's lantern warms his back, the moon edges his front. Card: every ship with Команда 3+
// loses 1 Команда (the song takes one man off every big crew).
// Brief: docs/mockups/print/card-briefs.md «Русалки».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 112;                       // horizon: our eye is low, near the water by the bow
const WL = 138;                       // the waterline of our bow
const MOON = { x: 150, y: 44 };
const LAMP = { x: 15, y: 63, s: .5, hang: true };   // the ship's lantern hung from the fore shrouds
const light = {
  time: 'night', haze: .3,
  key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#cfdcf6', power: .7 },
  fill: { color: '#24304a', power: .45 },
  rim: { az: 70, color: '#e4ecff', power: .7 },
  locals: [Object.assign(K.lantern.local(LAMP), { power: .9, radius: 62 })],
};
const skel = { horizon: HZ, eye: .5, light: 'the full moon low ahead over the rocks: the mermaids and the sailor dark against it with silver edges, the glitter path under it; the ship\'s lantern on the left warms the sailor\'s back and our bow',
  items: [
    ['sailor', 28, 74, 74, 52, 'in mid-air off the bow rail, 29 units/m, the trailing toe just off the rail'],
    ['bow', -12, WL, 66, 72, 'our bow seen from the side, the rail at y 72, the stem at x 48'],
    ['rocks', 100, 124, 100, 52, 'a cluster on the water at mid distance, foam at the feet'],
    ['mermaid 1', 132, 92, 34, 46, 'sitting on the crown of the big rock, arm raised against the moon'],
    ['mermaid 2', 104, 110, 34, 16, 'lying on the low rock, tail in the sea'],
    ['tail', 84, 122, 12, 12, 'a fin out of the water by the rocks'],
    ['lantern', 10, 58, 12, 20, 'hung from the fore shrouds on a lanyard'],
    ['anchor', 34, 116, 16, 34, 'hanging at the cathead'],
  ] };

const pts = a => a.map(p => f(p[0]) + ' ' + f(p[1]));
function sp(P, closed) {
  const n = P.length, g = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}

module.exports = { name: 'Русалки', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .5 });
    // the lilac afterglow of the set sun low over the sea, the full moon rising in it
    L.pal = Object.assign({}, L.pal, { sky: ['#0b0c22', '#1d1c40', '#453a66', '#86688f'], sea: ['#66587e', '#262846', '#0c1022'] });
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 5 }) + K.sunMoon(u, L, { r: 10 });
    bg += K.cloud(u, L, { x: 100, y: 30, w: 70, h: 10, seed: 3, far: .5 }) + K.cloud(u, L, { x: 186, y: 64, w: 40, h: 8, seed: 8, far: .6 });
    bg += farShore(u, L);
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .2, seed: 12, glitter: MOON.x });
    bg += K.fog(u, L, { y: HZ - 10, h: 22, density: .3, seed: 4 });
    // the rocks and the mermaids on them, far to near
    let mid = K.rock(u, L, { x: 182, y: 120, w: 34, h: 26, wet: true, seed: 41 });
    mid += K.rock(u, L, { x: 154, y: 124, w: 46, h: 40, wet: true, seed: 17 });
    mid += mermaidSitting(u, L, 150, 89, 1.22);
    mid += K.rock(u, L, { x: 119, y: 126, w: 36, h: 13, wet: true, seed: 23 });
    mid += mermaidLying(u, L, 117, 114, 1.15);
    mid += finOut(u, L, 90, 125);
    mid += K.foam(u, { x: 150, y: 124.5, w: 92, h: 1.2, L, seed: 9 });
    // our bow on the left, the anchor at the cathead, the rigging; the lantern; the sailor in mid-air
    let fg = bow(u, L);
    fg += rigging(u, L);
    fg += lanternOnLanyard(u, L);
    fg += sailor(u, L);
    return [bg + mid, fg];
  } };

/** A low far coast on the horizon left of the rocks, flat dark in the moonlit haze. */
function farShore(u, L) {
  const c = mix(L.pal.sky[3], '#0d1424', .45), y = HZ;
  return `<path d="M44 ${y}C54 ${y - 2} 62 ${y - 5} 72 ${y - 5.6}C80 ${y - 6} 86 ${y - 3.4} 96 ${y - 3}C104 ${y - 2.6} 110 ${y - 1.4} 118 ${y}Z" fill="${c}" opacity=".85"/>`;
}

// ——— the mermaids: seen against the moon, dark bodies with a silver edge towards it; the tail scaled and green ———
function mermaidTones(L, x, y) {
  const sk = L.ramp('skin', x, y);
  return { skin: mix(sk.shadow, '#1a2236', .35), skinLit: mix(sk.half, '#c8d4ee', .35), tail: '#163a3c', tailLit: '#4f9a8c', hair: '#120c10', rim: '#eef3ff', out: '#0a0e18' };
}
// she sits on the crown of the rock facing left (towards our ship), her head thrown back singing, the left arm raised
// to us, the right hand on the rock behind her; the tail runs down the right side of the rock to the sea
function mermaidSitting(u, L, x, y, s) {
  const T = mermaidTones(L, x, y), P = (a, b) => [x + a * s, y + b * s], Q = arr => arr.map(p => P(p[0], p[1]));
  let o = '';
  // the tail: from the hip down the rock's right flank, the fin spread on the wet stone near the water
  const tail = Q([[-3, -1], [2, -2.4], [7, -.6], [11.4, 4], [13, 10], [12.4, 16], [10.4, 21.6], [12.6, 26.4], [17.6, 28.6], [13.2, 30], [9, 27.6], [6.2, 30.8], [7.4, 25], [8.4, 19.6], [8.6, 13.6], [6.8, 8], [2.6, 3.6], [-3.4, 2.4]]);
  const tid = nid('mt', u);
  o += `<defs>${linGrad(tid, x + 4 * s, y - 2 * s, x + 14 * s, y + 6 * s, [[0, T.tail], [.6, mix(T.tail, T.tailLit, .35)], [1, T.tailLit]])}</defs>`;
  o += `<path d="${sp(tail, true)}" fill="url(#${tid})" stroke="${T.out}" stroke-width=".45"/>`;
  // scales: small arcs in rows along the tail, brighter towards the moon (upper right)
  const R = rng(11);
  for (let i = 0; i < 22; i++) { const t = R(), a = [lerp(1, 11, t), lerp(-.4, 22, t * t)], q = P(a[0] + (R() - .5) * 2.2, a[1] + (R() - .5) * 1.4);
    o += `<path d="M${f(q[0] - .9 * s)} ${f(q[1])}q${f(.9 * s)} ${f(1.1 * s)} ${f(1.8 * s)} 0" stroke="${T.tailLit}" stroke-width=".3" fill="none" opacity="${f(.25 + R() * .3)}"/>`; }
  o += `<path d="${sp(Q([[2, -2.4], [7, -.6], [11.4, 4], [13, 10], [12.4, 16], [10.4, 21.6]]))}" stroke="${T.rim}" stroke-width=".6" fill="none" opacity=".75"/>`;
  o += `<path d="${sp(Q([[12.6, 26.4], [17.6, 28.6]]))}" stroke="${T.rim}" stroke-width=".45" fill="none" opacity=".6"/>`;
  // the right arm behind her, the hand on the rock
  o += `<path d="${sp(Q([[2.4, -13], [4.2, -9], [5.6, -4.2], [6.6, -1.2], [5.2, -1], [4.2, -4.4], [2.6, -8.6], [.8, -12.4]]), true)}" fill="${mix(T.skin, '#0a0e18', .3)}" stroke="${T.out}" stroke-width=".4"/>`;
  // the torso: slim waist, the back towards the moon
  const torso = Q([[-3.6, 1], [-3.2, -4.4], [-3.8, -8.6], [-3.4, -12.6], [-1.6, -14.2], [1.4, -14.4], [3.2, -13], [3.4, -9.4], [2.4, -6], [2.8, -2], [3, 1]]);
  const bid = nid('mb', u);
  o += `<defs>${linGrad(bid, x - 4 * s, y - 8 * s, x + 4 * s, y - 9 * s, [[0, T.skin], [.65, mix(T.skin, T.skinLit, .3)], [1, T.skinLit]])}</defs>`;
  o += `<path d="${sp(torso, true)}" fill="url(#${bid})" stroke="${T.out}" stroke-width=".45"/>`;
  // a belt of shells and weed at the join of skin and scales
  o += `<path d="${sp(Q([[-3.8, .4], [-.4, -.6], [3.2, .2]]))}" stroke="#2f6a5e" stroke-width="${f(1.3 * s)}" fill="none" stroke-linecap="round"/>`;
  o += `<path d="${sp(Q([[3.2, -13], [3.4, -9.4], [2.4, -6], [2.8, -2]]))}" stroke="${T.rim}" stroke-width=".55" fill="none" opacity=".8"/>`;
  // the raised left arm: shoulder, elbow up and forward, the open hand high against the moon
  const arm = Q([[-2.6, -13.6], [-5.6, -17.2], [-7.6, -21.6], [-8.4, -25.6], [-8.2, -27.6], [-9.2, -29.6], [-8.4, -29.8], [-7.6, -28.4], [-7.4, -30.6], [-6.6, -30.4], [-6.6, -28.2], [-5.8, -29.4], [-5.2, -28.8], [-6, -26.2], [-6.4, -22], [-4.6, -18], [-1.6, -14.8]]);
  o += `<path d="${sp(arm, true)}" fill="${T.skin}" stroke="${T.out}" stroke-width=".45"/><path d="${sp(Q([[-5.2, -28.8], [-6, -26.2], [-6.4, -22], [-4.6, -18]]))}" stroke="${T.rim}" stroke-width=".5" fill="none" opacity=".85"/>`;
  // the head thrown back, the face up to the sky (profile to the left), the mouth open in the song
  const head = Q([[-1, -14.2], [-2.8, -16], [-3.6, -18.4], [-4.8, -19.6], [-4.2, -20.4], [-4.6, -21.4], [-3.8, -22.6], [-2, -23.2], [.6, -22.6], [1.8, -20.6], [1.6, -18], [.6, -15.6]]);
  o += `<path d="${sp(head, true)}" fill="${T.skin}" stroke="${T.out}" stroke-width=".45"/>`;
  // the hair: long, falling down her back over the shoulder towards the moon, wet strands
  const hair = Q([[-3.6, -22.8], [-1.6, -23.8], [1.2, -23], [2.8, -20.4], [3.6, -16], [5, -12], [5.6, -7], [7.2, -3.4], [5.2, -4], [4.2, -6.4], [3.2, -10.4], [2, -13.6], [.6, -17], [-.4, -20], [-2.6, -21.6]]);
  o += `<path d="${sp(hair, true)}" fill="${T.hair}" stroke="${T.out}" stroke-width=".35"/>`;
  o += `<path d="${sp(Q([[1.2, -23], [2.8, -20.4], [3.6, -16], [5, -12], [5.6, -7], [7.2, -3.4]]))}" stroke="${T.rim}" stroke-width=".55" fill="none" opacity=".7"/>`;
  for (const k of [0, 1, 2]) o += `<path d="${sp(Q([[.4 + k * .8, -21.6], [1.6 + k * .9, -17], [2.8 + k, -12 + k], [4 + k * .8, -7 + k]]))}" stroke="#3a4660" stroke-width=".3" fill="none" opacity=".6"/>`;
  return o;
}
// she lies along the low rock, propped on her left elbow, facing left; the tail goes over the rock's edge into the sea
function mermaidLying(u, L, x, y, s) {
  const T = mermaidTones(L, x, y), P = (a, b) => [x + a * s, y + b * s], Q = arr => arr.map(p => P(p[0], p[1]));
  const tid = nid('ml', u);
  let o = `<defs>${linGrad(tid, x, y - 4, x + 20, y + 4, [[0, T.tail], [1, mix(T.tail, T.tailLit, .5)]])}</defs>`;
  const tail = Q([[0, -3.4], [6, -4], [12, -3.2], [17, -1.2], [20.4, 2.4], [22, 7], [21, 10], [19.6, 6.2], [17, 3.2], [12, 1.4], [6, 1.4], [0, 1]]);
  o += `<path d="${sp(tail, true)}" fill="url(#${tid})" stroke="${T.out}" stroke-width=".4"/>`;
  o += `<path d="${sp(Q([[0, -3.4], [6, -4], [12, -3.2], [17, -1.2], [20.4, 2.4], [22, 7]]))}" stroke="${T.rim}" stroke-width=".5" fill="none" opacity=".7"/>`;
  // her torso raised on the elbow, the head turned to us singing, the hair down her back
  o += `<path d="${sp(Q([[1, 1], [-4, 1.2], [-7.4, .4], [-9.6, -2.6], [-9.4, -6], [-7.4, -7.4], [-4.4, -5.6], [-1.6, -3.6], [1, -3.4]]), true)}" fill="${T.skin}" stroke="${T.out}" stroke-width=".4"/>`;
  o += `<path d="${sp(Q([[-9.4, -5.4], [-12, -2], [-12.4, 1.2], [-10.8, 1.4], [-10.4, -1.4], [-8.4, -3.6]]), true)}" fill="${mix(T.skin, '#0a0e18', .25)}" stroke="${T.out}" stroke-width=".35"/>`;
  o += `<path d="${sp(Q([[-9.6, -7.6], [-11.6, -9], [-11.8, -11.4], [-10.2, -12.8], [-7.8, -12.2], [-7, -10], [-7.6, -8]]), true)}" fill="${T.skin}" stroke="${T.out}" stroke-width=".4"/>`;
  o += `<path d="${sp(Q([[-11.8, -11.4], [-10, -13.4], [-7.4, -12.6], [-6, -9.4], [-4, -6.4], [-1, -4.6], [-3.6, -4.2], [-6.4, -6.6], [-8, -9.6]]), true)}" fill="${T.hair}" stroke="${T.out}" stroke-width=".3"/>`;
  o += `<path d="${sp(Q([[-10, -13.4], [-7.4, -12.6], [-6, -9.4], [-4, -6.4], [-1, -4.6]]))}" stroke="${T.rim}" stroke-width=".45" fill="none" opacity=".7"/>`;
  return o;
}
// a third one diving by the rocks: only her fin is out of the water, rings round it
function finOut(u, L, x, y) {
  const T = mermaidTones(L, x, y);
  let o = `<ellipse cx="${x}" cy="${y + .6}" rx="9" ry="1.3" fill="none" stroke="#9fb4d4" stroke-width=".4" opacity=".5"/><ellipse cx="${x}" cy="${y + .4}" rx="5" ry=".8" fill="#c8d6f0" opacity=".25"/>`;
  o += `<path d="${sp([[x - 1.4, y + .4], [x - 1, y - 3], [x - 3.6, y - 7.2], [x - 1.2, y - 6], [x, y - 4.2], [x + 1.6, y - 6.8], [x + 4.6, y - 7.8], [x + 1.6, y - 3], [x + 1.4, y + .4]], true)}" fill="${T.tail}" stroke="${T.out}" stroke-width=".4"/>`;
  o += `<path d="M${x + 1.6} ${y - 6.8}L${x + 4.6} ${y - 7.8}L${x + 1.6} ${y - 3}" stroke="${T.rim}" stroke-width=".45" fill="none" opacity=".75"/>`;
  return o + K.splash(u, { x: x + .4, y: y + .6, w: 8, h: 5, seed: 4, L });
}

// ——— our bow ———
// the bow from the side, stem to the right: the bulwark and rail, the wales, tarred planking; the face we see looks
// away from the moon (in shade), its top and the stem's edge catch the moon, the lantern warms the rail by it
function bow(u, L) {
  const railTop = x => 72 - (x + 12) * .055;                      // the sheer rises a little to the stem
  const stem = [[48, railTop(48) - 2], [47.4, 92], [44.6, 112], [40, WL + 4]];
  const outlinePts = [[-14, railTop(-14)], [48, railTop(48)], ...stem.slice(1), [-14, WL + 4]];
  const id = nid('bw', u), cid = nid('bc', u), tar = L.ramp('tar', 20, 100), oak = L.ramp('oak', 20, 80);
  let s = `<defs>${linGrad(id, 0, 66, 0, WL, [[0, mix(tar.half, oak.core, .3)], [.3, tar.core], [1, mix(tar.shadow, '#05080e', .3)]])}<clipPath id="${cid}"><path d="M${pts(outlinePts).join('L')}Z"/></clipPath></defs>`;
  s += `<path d="${sp([[-14, railTop(-14)], [48, railTop(48)]])}L${pts(stem.slice(1)).join('L')}L-14 ${WL + 4}Z" fill="url(#${id})"/>`;
  s += `<g clip-path="url(#${cid})">`;
  // strakes: thin seams along the sheer, the wales as thick rounded bands, butts staggered
  const R = rng(5);
  for (let y = 78; y < WL; y += 4.2) { const k = (y - 70) * .012; s += `<path d="M-14 ${f(y)}C10 ${f(y + 1.6 + k)} 30 ${f(y + 1.2)} 50 ${f(y - .6 - k * 3)}" stroke="${mix(tar.shadow, '#000', .35)}" stroke-width=".45" fill="none" opacity=".7"/>`;
    for (let i = 0; i < 2; i++) { const bx = -10 + R() * 50; s += `<path d="M${f(bx)} ${f(y + .3)}v4" stroke="${mix(tar.shadow, '#000', .3)}" stroke-width=".35" opacity=".55"/>`; } }
  for (const [y, w] of [[86, 3.6], [100, 3.2]]) {
    const g = nid('wa', u);
    s += `<defs>${linGrad(g, 0, y - w / 2, 0, y + w / 2, [[0, tar.lit], [.4, tar.half], [1, tar.shadow]])}</defs><path d="M-14 ${f(y - w / 2)}C10 ${f(y)} 30 ${f(y - .2)} 50 ${f(y - 2.6)}L50 ${f(y + w - 2.6)}C30 ${f(y + w - .2)} 10 ${f(y + w)} -14 ${f(y + w / 2)}Z" fill="url(#${g})" stroke="${tar.outline}" stroke-width=".4"/>`;
  }
  // the bulwark's upper strake is oiled oak, the rail cap on top
  s += `<path d="M-14 ${f(railTop(-14))}L50 ${f(railTop(50))}L50 ${f(railTop(50) + 6)}L-14 ${f(railTop(-14) + 7)}Z" fill="${mix(oak.core, tar.core, .45)}"/>`;
  s += '</g>';
  // the rail cap: the top catches the moon and the lantern
  s += `<path d="M-14 ${f(railTop(-14) - 1.6)}L49 ${f(railTop(49) - 1.6)}L49.6 ${f(railTop(49) + .4)}L-14 ${f(railTop(-14) + .4)}Z" fill="${oak.core}" stroke="${oak.outline}" stroke-width=".4"/><path d="M-14 ${f(railTop(-14) - 1.5)}L49 ${f(railTop(49) - 1.5)}" stroke="${mix(oak.lit, L.keyColor, .3)}" stroke-width=".55" opacity=".9"/>`;
  // the stem: its forward edge lit by the moon ahead
  s += `<path d="M${f(stem[0][0])} ${f(stem[0][1])}C48.4 88 46.6 104 ${f(stem[3][0])} ${f(stem[3][1])}" stroke="${mix(tar.lit, L.keyColor, .5)}" stroke-width=".7" fill="none" opacity=".75"/>`;
  // the lantern's warmth on the bow round it
  s += `<g clip-path="url(#${cid})">${K.localGlow(u, { x: LAMP.x + 2, y: 74, color: '#ffb05a', power: .55, radius: 34 }, { core: false })}</g>`;
  // the cathead: a heavy timber out over the side by the stem; the anchor hangs from it on its cable, its fluke
  // against the planking
  const ch = [34, railTop(34) + 6];
  s += K.shadeBox(u, [{ pts: [[ch[0] - 3, ch[1]], [ch[0] + 3, ch[1]], [ch[0] + 3, ch[1] + 5], [ch[0] - 3, ch[1] + 5]], n: 'front', kind: 'oak' }, { pts: [[ch[0] - 3, ch[1]], [ch[0] + 3, ch[1]], [ch[0] + 3.6, ch[1] - 1], [ch[0] - 2.4, ch[1] - 1]], n: 'top', kind: 'oak' }], L, 'oak', { seed: 3, outline: .4 });
  const A = { x: 36, y: 122, h: 30 }, ring = K.anchor.ring(A);
  s += K.rope(u, L, [[ch[0], ch[1] + 5], [ring.x - .2, (ch[1] + ring.y) / 2], [ring.x, ring.y]], { r: .6, seed: 8 });
  s += K.anchor(u, L, A);
  // the foam where the bow meets the sea, the water dark in her shadow
  s += K.foam(u, { x: 14, y: WL + .3, w: 58, h: 1.3, L, seed: 21 });
  return s;
}
/** The fore shrouds from the chains at the rail up out of the frame to the foremast behind us, ratlines. */
function rigging(u, L) {
  const rp = L.ramp('rope', 20, 40);
  let s = '';
  const feet = [[4, 70.2], [12, 69.8], [20, 69.4]], tops = [[-14, -14], [-6, -14], [2, -14]];
  feet.forEach((a, i) => { s += `<path d="M${f(a[0])} ${f(a[1])}L${f(tops[i][0])} ${f(tops[i][1])}" stroke="${rp.outline}" stroke-width="${f(1.1 - i * .1)}" fill="none"/>`; });
  for (let t = .1; t < .9; t += .1) { const p = feet.map((a, i) => [lerp(a[0], tops[i][0], t), lerp(a[1], tops[i][1], t)]);
    for (let i = 0; i < 2; i++) s += `<path d="M${f(p[i][0])} ${f(p[i][1])}Q${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2 + 1)} ${f(p[i + 1][0])} ${f(p[i + 1][1])}" stroke="${rp.outline}" stroke-width=".38" fill="none" opacity=".85"/>`; }
  return s;
}
function lanternOnLanyard(u, L) {
  // the lanyard from the second shroud down to the lantern's bail
  const t = (20 - LAMP.x) / 18, top = [LAMP.x, 69.4 - 83.4 * t];
  return `<path d="M${f(top[0])} ${f(top[1])}L${f(LAMP.x)} ${f(LAMP.y - 28 * LAMP.s + .4)}" stroke="#2a1a0c" stroke-width=".5"/>` + K.lantern(u, L, LAMP);
}

// ——— the sailor in mid-air ———
// built from shaded limbs (kit cylinders), far side first; he leaps to the right, arms out towards the rocks, his
// trailing right foot just pushing off the rail
function sailor(u, L) {
  const k = 1.5, O = [30.9, 74.1], P = (x, y) => [O[0] + x * k, O[1] + y * k];
  const J = {
    toeN: P(-.6, -4.2), anN: P(2, -5.2), knN: P(10, -9.8), hipN: P(19.4, -12.6),
    toeF: P(14.4, 1.8), anF: P(16, -.6), knF: P(24.8, -5.2), hipF: P(20, -13.2),
    shN: P(31.4, -19.6), shF: P(32, -21), neck: P(34, -21.8), head: P(36.4, -24.2),
    elN: P(38, -17.4), wrN: P(44.2, -17.6), haN: P(47.4, -18),
    elF: P(37.8, -26.4), wrF: P(43, -31), haF: P(45.6, -33.4),
  };
  const r = v => v * k, cyl = (a, b, r1, r2, kind, o = {}) => K.shadeCyl(u, a[0], a[1], b[0], b[1], Math.max(r1, r2) * k, L, kind, Object.assign({ r1: r1 * k, r2: r2 * k, cap: 'round', outline: .4 }, o));
  let s = '';
  // the far arm (raised), the far leg (tucked)
  s += cyl(J.shF, J.elF, 1.5, 1.3, 'linen') + cyl(J.elF, J.wrF, 1.15, .9, 'skin') + hand(u, L, J.wrF, J.haF, k);
  s += cyl(J.hipF, J.knF, 2.2, 1.8, 'tar') + cyl(J.knF, J.anF, 1.6, 1.15, 'tar', { r2: .9 * k }) + cyl([lerp(J.knF[0], J.anF[0], .7), lerp(J.knF[1], J.anF[1], .7)], J.anF, 1.05, .95, 'skin') + cyl(J.anF, J.toeF, .9, .7, 'skin');
  // the torso: a loose shirt from the shoulders to the sash, folds blown back
  const pel = [(J.hipN[0] + J.hipF[0]) / 2, (J.hipN[1] + J.hipF[1]) / 2], chest = [(J.shN[0] + J.shF[0]) / 2 - .6 * k, (J.shN[1] + J.shF[1]) / 2 + .8 * k];
  s += cyl(pel, chest, 3.3, 3.8, 'linen', { bulge: .06, r1: 3.1 * k, r2: 3.6 * k });
  const fold = (a, b) => `<path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + 1)} ${f(b[0])} ${f(b[1])}" stroke="${L.ramp('linen', pel[0], pel[1]).shadow}" stroke-width=".55" fill="none" opacity=".55"/>`;
  s += fold(P(24, -17.6), P(30.4, -18.6)) + fold(P(23, -14.6), P(28.6, -15.8)) + fold(P(25.6, -20.4), P(29.6, -21.4));
  // the sash at the waist, its ends flying back
  s += cyl(P(19.4, -13.8), P(21.4, -14.8), 3.3, 3.3, 'paint-red', { cap: false, ell: .3 });
  s += `<path d="${sp([P(19.6, -12.2), P(15, -9.4), P(11.4, -9.8), P(12.6, -11.2), P(16, -12.2)], true)}" fill="${L.ramp('paint-red', 16, 60).core}" stroke="${L.ramp('paint-red', 16, 60).outline}" stroke-width=".35"/>`;
  // the near leg trailing back to the rail, the bare foot pointed
  s += cyl(J.hipN, J.knN, 2.4, 1.9, 'tar') + cyl(J.knN, J.anN, 1.7, 1.2, 'tar', { r2: 1 * k }) + cyl([lerp(J.knN[0], J.anN[0], .72), lerp(J.knN[1], J.anN[1], .72)], J.anN, 1.1, .95, 'skin') + cyl(J.anN, J.toeN, .95, .7, 'skin');
  // the neck and the head in profile, looking at the rocks; a dark kerchief, the hair tied behind
  s += cyl(J.neck, [J.neck[0] + 1.4 * k, J.neck[1] - 1.2 * k], 1.15, 1.1, 'skin');
  s += head(u, L, J.head, 2.7 * k);
  // the near arm reaching forward
  s += cyl(J.shN, J.elN, 1.55, 1.3, 'linen') + cyl(J.elN, J.wrN, 1.15, .9, 'skin') + hand(u, L, J.wrN, J.haN, k);
  // the moon edges him on the right and top; a faint cool glow round the edges is left to the kit's rim lines
  return `<g>${s}</g>`;
}
// an open hand: the palm from the wrist along the forearm, the thumb up, the fingers together
function hand(u, L, w, t, k) {
  const dx = t[0] - w[0], dy = t[1] - w[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux, rp = L.ramp('skin', w[0], w[1]);
  const Q = (a, b) => [w[0] + ux * a * k + nx * b * k, w[1] + uy * a * k + ny * b * k];
  const palm = [Q(0, -.9), Q(1.6, -1.1), Q(3.6, -.9), Q(4.4, -.3), Q(4.2, .5), Q(2.4, .9), Q(.6, .9)];
  const thumb = [Q(1, -.8), Q(2.2, -1.9), Q(3, -2), Q(2.6, -1.2)];
  return `<path d="${sp(thumb, true)}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".35"/><path d="${sp(palm, true)}" fill="${rp.core}" stroke="${rp.outline}" stroke-width=".4"/>`
    + `<path d="M${f(Q(2.4, -.2)[0])} ${f(Q(2.4, -.2)[1])}L${f(Q(4.1, -.1)[0])} ${f(Q(4.1, -.1)[1])}" stroke="${rp.shadow}" stroke-width=".25" opacity=".7"/>`
    + `<path d="M${f(Q(1, -.95)[0])} ${f(Q(1, -.95)[1])}L${f(Q(4, -.6)[0])} ${f(Q(4, -.6)[1])}" stroke="${L.rimColor}" stroke-width=".35" opacity=".6"/>`;
}
// the head in profile to the right: skull, brow, nose, jaw with stubble, the ear, a dark kerchief knotted behind
function head(u, L, c, r) {
  const rp = L.ramp('skin', c[0], c[1]), Q = (a, b) => [c[0] + a * r, c[1] + b * r];
  let s = K.shadeSphere(u, c[0], c[1], r, L, 'skin', { outline: .4 });
  // the face: brow, nose, lips, chin on the right side
  s += `<path d="${sp([Q(.55, -.55), Q(.98, -.2), Q(1.24, .14), Q(1.02, .26), Q(1.08, .5), Q(.98, .68), Q(.86, .96), Q(.4, 1.12), Q(-.1, .92)], false)}L${f(Q(.2, 0)[0])} ${f(Q(.2, 0)[1])}Z" fill="${rp.core}" stroke="${rp.outline}" stroke-width=".4"/>`;
  s += `<path d="${sp([Q(.98, .68), Q(.86, .96), Q(.4, 1.12), Q(-.1, .92)])}" stroke="#3a2a22" stroke-width="${f(r * .22)}" fill="none" opacity=".55" stroke-linecap="round"/>`;
  s += `<path d="${sp([Q(.55, -.55), Q(.98, -.2), Q(1.24, .14)])}" stroke="${L.rimColor}" stroke-width=".4" fill="none" opacity=".7"/>`;
  s += `<circle cx="${f(Q(.62, -.08)[0])}" cy="${f(Q(.62, -.08)[1])}" r="${f(r * .1)}" fill="#1a1010"/>`;
  s += `<path d="${sp([Q(-.2, -.1), Q(-.02, .1), Q(-.12, .42), Q(-.34, .3)], true)}" fill="${rp.shadow}" stroke="${rp.outline}" stroke-width=".3"/>`;
  // the kerchief over the crown, its knot and tails behind blown back
  const kid = nid('kc', u), kr = L.ramp('paint-red', c[0], c[1]);
  s += `<defs>${linGrad(kid, c[0] - r, c[1], c[0] + r, c[1] - r, [[0, kr.shadow], [.6, kr.core], [1, kr.half]])}</defs>`;
  s += `<path d="${sp([Q(-1.04, .2), Q(-1, -.5), Q(-.5, -1.02), Q(.3, -1.08), Q(.86, -.62), Q(.62, -.5), Q(0, -.62), Q(-.5, -.3), Q(-.74, .26)], true)}" fill="url(#${kid})" stroke="${kr.outline}" stroke-width=".4"/>`;
  s += `<path d="${sp([Q(-.9, -.3), Q(-1.8, -.1), Q(-2.6, .3), Q(-2, .5), Q(-1.6, .2), Q(-1.9, .9), Q(-1.1, .5), Q(-.8, .1)], true)}" fill="${kr.shadow}" stroke="${kr.outline}" stroke-width=".35"/>`;
  return s;
}
/** His cap, knocked off, floats below on the moonlit water. */
function floatingCap(u, L, x, y) {
  return `<ellipse cx="${x}" cy="${y + 1}" rx="8" ry="1.4" fill="none" stroke="#7f98bc" stroke-width=".45" opacity=".45"/>` + K.shadeCyl(u, x - 4.4, y, x + 4.4, y, 1.6, L, 'canvas', { r1: 1.8, r2: 1.4, ell: .3, outline: .4 });
}
