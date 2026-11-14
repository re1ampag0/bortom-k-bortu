// «Русалки» (Колода моря): a still evening in the lilac afterglow, the full moon low over a cluster of black rocks off our bow. On the rocks
// the wild mermaids sing: one sits on the crown of the big rock, her face to us in profile and her mouth open in the
// song, one hand on her breast, the other held out to the sailor; another lies on the low rock singing too; a third
// flips her tail by the rocks. The song goes over the water to the ship in shimmering rings and a few notes. A sailor
// has already leapt off the bow — caught diving head first down towards them, body leaning to the rocks, knees and
// elbows bent, hands reaching, his face rapt and his mouth open; below him the splash of the man who went before.
// The ship's lantern warms his back, the moon edges his front. Card: every ship with Команда 3+ loses 1 Команда.
// Second pass (review): the sailor flew up like a superman, people were tubes with ball joints and mitten hands,
// faces had no features — now the people are drawn as contours (lib/people.cjs: sleeves with folds and cuffs, hands
// with fingers, heads in profile with eye, brow, nose, mouth); the bow has a rail cap, shaded strakes, a channel with
// deadeyes for the shrouds; the anchor is gone.
// Brief: docs/mockups/print/card-briefs.md «Русалки».
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
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
    ['sailor', 40, 92, 58, 32, 'diving head first off the bow towards the rocks, about 28 units/m, the trailing toe just off the rail'],
    ['splash', 62, 130, 18, 16, 'where the one before him went in, under him'],
    ['bow', -12, WL, 66, 72, 'our bow seen from the side, the rail at y 72, the stem at x 48; the channel with deadeyes'],
    ['rocks', 100, 124, 100, 52, 'a cluster on the water at mid distance, foam at the feet'],
    ['mermaid 1', 128, 92, 40, 46, 'sitting on the crown of the big rock, singing, a hand held out to the sailor'],
    ['mermaid 2', 100, 112, 40, 18, 'lying on the low rock, tail in the sea, singing'],
    ['song', 92, 96, 50, 34, 'rings and notes from their mouths to the ship'],
    ['tail', 84, 122, 12, 12, 'a fin out of the water by the rocks'],
    ['lantern', 10, 58, 12, 20, 'hung from the fore shrouds on a lanyard'],
  ] };

const pts = a => a.map(p => f(p[0]) + ' ' + f(p[1]));
const sp = H.sp;

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
    const m1 = mermaidSitting(u, L, 152, 90, 1.4);
    mid += m1.svg;
    mid += K.rock(u, L, { x: 119, y: 126, w: 36, h: 13, wet: true, seed: 23 });
    const m2 = mermaidLying(u, L, 118, 114, 1.3);
    mid += m2.svg;
    mid += finOut(u, L, 90, 125);
    mid += K.foam(u, { x: 150, y: 124.5, w: 92, h: 1.2, L, seed: 9 });
    // the splash of the man who went before, under the diving sailor: rings on the water, the spray thrown up
    mid += `<ellipse cx="70" cy="130.4" rx="13" ry="1.8" fill="none" stroke="#b8c6e4" stroke-width=".45" opacity=".5"/><ellipse cx="70" cy="130.2" rx="8" ry="1.1" fill="none" stroke="#d8e2f6" stroke-width=".4" opacity=".55"/>`;
    mid += K.splash(u, { x: 70, y: 130, w: 15, h: 15, seed: 6, L });
    // the song: rings and notes from their open mouths over the water to the ship
    mid += song(u, L, [m1.mouth, m2.mouth]);
    // our bow on the left, the rigging; the lantern; the sailor diving
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
  return { skin: mix(sk.shadow, '#1a2236', .35), skinLit: mix(sk.half, '#c8d4ee', .35), tail: '#163a3c', tailLit: '#4f9a8c', hair: '#120c10', rim: '#eef3ff', out: '#0a0e18',
    // pearly skin, a little cold in the moonlight, kept light enough for the face to read against the moon
    tone: { lit: '#eef2fa', half: '#a6b2c6', core: '#97a4ba', shadow: '#55607a', outline: '#0a0e18' } };
}
// she sits on the crown of the rock facing left (towards our ship), singing to it: the head lifted, the mouth open, one
// hand on her breast, the other held out to the sailor; the tail runs down the right side of the rock to the sea
function mermaidSitting(u, L, x, y, s) {
  const T = mermaidTones(L, x, y), P = (a, b) => [x + a * s, y + b * s], Q = arr => arr.map(p => P(p[0], p[1]));
  let o = '';
  // the tail: from the hip down the rock's right flank, the fin spread on the wet stone near the water
  const tail = Q([[-3, -1], [2, -2.4], [7, -.6], [11.4, 4], [13, 10], [12.4, 16], [10.4, 21.6], [12.6, 26.4], [17.6, 28.6], [13.2, 30], [9, 27.6], [6.2, 30.8], [7.4, 25], [8.4, 19.6], [8.6, 13.6], [6.8, 8], [2.6, 3.6], [-3.4, 2.4]]);
  const tid = nid('mt', u);
  o += `<defs>${linGrad(tid, x + 4 * s, y - 2 * s, x + 14 * s, y + 6 * s, [[0, T.tail], [.6, mix(T.tail, T.tailLit, .35)], [1, T.tailLit]])}</defs>`;
  o += `<path d="${sp(tail, true)}" fill="url(#${tid})" stroke="${T.out}" stroke-width=".45"/>`;
  const R = rng(11);
  for (let i = 0; i < 22; i++) { const t = R(), a = [lerp(1, 11, t), lerp(-.4, 22, t * t)], q = P(a[0] + (R() - .5) * 2.2, a[1] + (R() - .5) * 1.4);
    o += `<path d="M${f(q[0] - .9 * s)} ${f(q[1])}q${f(.9 * s)} ${f(1.1 * s)} ${f(1.8 * s)} 0" stroke="${T.tailLit}" stroke-width=".3" fill="none" opacity="${f(.25 + R() * .3)}"/>`; }
  o += `<path d="${sp(Q([[2, -2.4], [7, -.6], [11.4, 4], [13, 10], [12.4, 16], [10.4, 21.6]]))}" stroke="${T.rim}" stroke-width=".6" fill="none" opacity=".75"/>`;
  o += `<path d="${sp(Q([[12.6, 26.4], [17.6, 28.6]]))}" stroke="${T.rim}" stroke-width=".45" fill="none" opacity=".6"/>`;
  // the hair falling down her back behind the shoulders (the far part, under the torso)
  o += `<path d="${sp(Q([[.6, -19.6], [2.6, -17.6], [3.6, -14], [4.6, -10], [5.6, -6.4], [6.8, -3.4], [4.8, -4], [3.4, -7.4], [2, -11], [.4, -14.6]]), true)}" fill="${T.hair}" stroke="${T.out}" stroke-width=".3"/>`;
  // the torso: slim waist, the back towards the moon
  const torso = Q([[-3.6, 1], [-3.2, -4.4], [-3.8, -8.6], [-3.4, -12.6], [-1.6, -14.2], [1.4, -14.4], [3.2, -13], [3.4, -9.4], [2.4, -6], [2.8, -2], [3, 1]]);
  const bid = nid('mb', u);
  o += `<defs>${linGrad(bid, x - 4 * s, y - 8 * s, x + 4 * s, y - 9 * s, [[0, T.tone.lit], [.35, T.tone.half], [.8, T.tone.shadow], [1, T.skinLit]])}</defs>`;
  o += `<path d="${sp(torso, true)}" fill="url(#${bid})" stroke="${T.out}" stroke-width=".45"/>`;
  o += `<path d="${sp(Q([[-3.8, .4], [-.4, -.6], [3.2, .2]]))}" stroke="#2f6a5e" stroke-width="${f(1.3 * s)}" fill="none" stroke-linecap="round"/>`;
  o += `<path d="${sp(Q([[3.2, -13], [3.4, -9.4], [2.4, -6], [2.8, -2]]))}" stroke="${T.rim}" stroke-width=".55" fill="none" opacity=".8"/>`;
  // the neck and the head lifted in the song, in profile to the left
  o += H.cloth(u, { spine: Q([[-.4, -13.6], [-.9, -16.4]]), w: [2.1 * s, 1.7 * s], tone: T.tone, lit: 1, folds: false });
  const hd = H.head(u, { c: P(-1.2, -18.8), r: 2.7 * s, dir: -1, tilt: -14, tone: T.tone, faceLit: true, edge: mix(T.tone.lit, '#ffd8a8', .25), warm: { color: '#e8c8b8', op: .35 }, rim: T.rim,
    mouth: .85, eye: 'half', brow: 'up', hairColor: T.hair, ear: false, iris: '#1c3a3a', lips: '#7a3a48', white: '#d8dce6' });
  o += hd.svg;
  // the hair over the crown and behind the ear, wet strands with the moon on them
  o += `<path d="${sp(Q([[-1.9, -21.6], [-.6, -22.1], [1, -21.6], [2, -19.8], [2.8, -17.4], [3.4, -14.2], [2.2, -14.6], [1.4, -16.4], [.9, -18.2], [.2, -19.8], [-1, -20.9]]), true)}" fill="${T.hair}" stroke="${T.out}" stroke-width=".3"/>`;
  o += `<path d="${sp(Q([[.6, -21.2], [1.8, -19.6], [2.6, -17.4], [3.6, -14], [4.6, -10], [5.6, -6.4], [6.8, -3.4]]))}" stroke="${T.rim}" stroke-width=".55" fill="none" opacity=".7"/>`;
  for (const k of [0, 1, 2]) o += `<path d="${sp(Q([[-.6 + k * .7, -21.4], [.4 + k * .8, -18.4], [1.6 + k * .7, -15], [3 + k * .7, -10 + k]]))}" stroke="#3a4660" stroke-width=".3" fill="none" opacity=".6"/>`;
  // the far arm: the hand laid on her breast
  o += H.cloth(u, { spine: Q([[1.4, -13], [2.4, -9.2], [-.6, -9.8]]), w: [1.5 * s, 1.15 * s, .85 * s], tone: T.tone, lit: -1, folds: false, rim: T.rim, rimSide: -1, capA: true });
  o += H.hand(u, { at: P(-.6, -9.8), a: Math.atan2(-1.2, -2.4) * 180 / Math.PI, s: .3 * s, m: 1, pose: 'open', spread: 3, curl: .35, tone: T.tone, thumb: 'back', sw: .3 }).back;
  // the near arm held out to the sailor, the open hand turned up to him
  const sh = P(-2.6, -13.2), el = P(-6.8, -13.8), wr = P(-10.8, -15.8);
  o += H.cloth(u, { spine: [sh, el, wr], w: [1.6 * s, 1.15 * s, .82 * s], tone: T.tone, lit: -1, folds: false, rim: T.rim, rimSide: -1, capA: true });
  const hn = H.hand(u, { at: wr, a: Math.atan2(wr[1] - el[1], wr[0] - el[0]) * 180 / Math.PI - 8, s: .36 * s, m: -1, pose: 'open', spread: 13, curl: .2, tone: T.tone, thumb: 'front', sw: .3 });
  o += hn.back + hn.front;
  return { svg: o, mouth: hd.Q(1.02, .52) };
}
// she lies along the low rock, propped on her left elbow, facing left and singing; the tail goes over the edge into the sea
function mermaidLying(u, L, x, y, s) {
  const T = mermaidTones(L, x, y), P = (a, b) => [x + a * s, y + b * s], Q = arr => arr.map(p => P(p[0], p[1]));
  const tid = nid('ml', u);
  let o = `<defs>${linGrad(tid, x, y - 4, x + 20, y + 4, [[0, T.tail], [1, mix(T.tail, T.tailLit, .5)]])}</defs>`;
  const tail = Q([[0, -3.4], [6, -4], [12, -3.2], [17, -1.2], [20.4, 2.4], [22, 7], [21, 10], [19.6, 6.2], [17, 3.2], [12, 1.4], [6, 1.4], [0, 1]]);
  o += `<path d="${sp(tail, true)}" fill="url(#${tid})" stroke="${T.out}" stroke-width=".4"/>`;
  o += `<path d="${sp(Q([[0, -3.4], [6, -4], [12, -3.2], [17, -1.2], [20.4, 2.4], [22, 7]]))}" stroke="${T.rim}" stroke-width=".5" fill="none" opacity=".7"/>`;
  // her hair down her back, her torso raised on the elbow
  o += `<path d="${sp(Q([[-8.2, -12.4], [-6.6, -11.4], [-5.4, -8.8], [-3.6, -6.4], [-.6, -4.4], [-3.4, -3.8], [-6.2, -6], [-7.6, -8.6]]), true)}" fill="${T.hair}" stroke="${T.out}" stroke-width=".3"/>`;
  o += `<path d="${sp(Q([[1, 1], [-4, 1.2], [-7.4, .4], [-9.6, -2.6], [-9.4, -6], [-7.4, -7.4], [-4.4, -5.6], [-1.6, -3.6], [1, -3.4]]), true)}" fill="${T.tone.half}" stroke="${T.out}" stroke-width=".4"/>`;
  o += `<path d="${sp(Q([[-7.4, -7.4], [-4.4, -5.6], [-1.6, -3.6], [1, -3.4]]))}" stroke="${T.rim}" stroke-width=".45" fill="none" opacity=".7"/>`;
  // the propped arm: the upper arm down to the elbow on the stone, the forearm forward, the hand flat on the rock
  const sh = P(-8.6, -5.8), el = P(-10.2, .2), wr = P(-14, .1);
  o += H.cloth(u, { spine: [sh, el, wr], w: [1.5 * s, 1.1 * s, .8 * s], tone: T.tone, lit: 1, folds: false, capA: true });
  const hn = H.hand(u, { at: wr, a: 182, s: .3 * s, m: 1, pose: 'open', spread: 5, curl: .12, tone: T.tone, thumb: 'back', sw: .3 });
  o += hn.back;
  // the neck and the head in profile to the left, lifted in the song
  o += H.cloth(u, { spine: Q([[-8.4, -6.4], [-9.2, -8.6]]), w: [1.9 * s, 1.6 * s], tone: T.tone, lit: 1, folds: false });
  const hd = H.head(u, { c: P(-9.8, -10.8), r: 2.4 * s, dir: -1, tilt: -22, tone: T.tone, edge: mix(T.tone.lit, '#ffd8a8', .25), warm: { color: '#e8c8b8', op: .3 }, rim: T.rim,
    mouth: .8, eye: 'half', brow: 'up', hairColor: T.hair, ear: false, iris: '#1c3a3a', lips: '#7a3a48', white: '#d8dce6' });
  o += hd.svg;
  o += `<path d="${sp(Q([[-10.2, -13.4], [-8.8, -13.4], [-7.4, -12.2], [-6.8, -10.4], [-6.4, -8.8], [-7.6, -9.4], [-8.2, -10.8], [-9.2, -12.4]]), true)}" fill="${T.hair}" stroke="${T.out}" stroke-width=".3"/>`;
  o += `<path d="${sp(Q([[-8.8, -13.4], [-7.4, -12.2], [-6.6, -10.2], [-5.4, -8.8], [-3.6, -6.4], [-.6, -4.4]]))}" stroke="${T.rim}" stroke-width=".45" fill="none" opacity=".7"/>`;
  return { svg: o, mouth: hd.Q(1.02, .52) };
}
// the song: from each open mouth rings of shimmering light spread over the water towards the ship, broken into short
// dashes; a few notes float on the air between them and the sailor
function song(u, L, mouths) {
  const gid = nid('sg', u), c = '#e8dcff';
  let s = `<defs><filter id="${gid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".5"/></filter></defs>`;
  let rings = '';
  mouths.forEach((m, k) => {
    for (let i = 0; i < 5; i++) { const r = 4 + i * 5.2, a0 = (180 - 28 + k * 6) * Math.PI / 180, a1 = (180 + 30 - k * 10) * Math.PI / 180;
      const p0 = [m[0] + Math.cos(a0) * r, m[1] + Math.sin(a0) * r], p1 = [m[0] + Math.cos(a1) * r, m[1] + Math.sin(a1) * r];
      rings += `<path d="M${f(p0[0])} ${f(p0[1])}A${f(r)} ${f(r)} 0 0 1 ${f(p1[0])} ${f(p1[1])}" stroke="${c}" stroke-width="${f(.75 - i * .1)}" fill="none" stroke-dasharray="${f(1.6 + i * .3)} ${f(.9 + i * .4)}" stroke-linecap="round" opacity="${f(.85 - i * .14)}"/>`; }
  });
  s += `<g filter="url(#${gid})" opacity=".9">${rings}</g>${rings.replace(/stroke-width="[^"]*"/g, 'stroke-width=".3"').replace(/stroke="#e8dcff"/g, 'stroke="#ffffff"')}`;
  // the notes: a head, a stem, a flag; drifting on a wavy line to the ship, smaller further from her
  const note = (x, y, k, two) => { const hr = 1.05 * k;
    let n = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(hr * 1.2)}" ry="${f(hr * .82)}" transform="rotate(-24 ${f(x)} ${f(y)})" fill="${c}"/><path d="M${f(x + hr * 1.05)} ${f(y - .2)}v${f(-4.6 * k)}" stroke="${c}" stroke-width="${f(.42 * k)}"/>`;
    if (two) n += `<ellipse cx="${f(x + 3.2 * k)}" cy="${f(y - .9 * k)}" rx="${f(hr * 1.2)}" ry="${f(hr * .82)}" transform="rotate(-24 ${f(x + 3.2 * k)} ${f(y - .9 * k)})" fill="${c}"/><path d="M${f(x + 3.2 * k + hr * 1.05)} ${f(y - .9 * k - .2)}v${f(-4.6 * k)}" stroke="${c}" stroke-width="${f(.42 * k)}"/><path d="M${f(x + hr * 1.05)} ${f(y - 4.6 * k)}L${f(x + 3.2 * k + hr * 1.05)} ${f(y - 5.5 * k)}" stroke="${c}" stroke-width="${f(.9 * k)}"/>`;
    else n += `<path d="M${f(x + hr * 1.05)} ${f(y - 4.6 * k)}q${f(1.6 * k)} ${f(1.2 * k)} ${f(1.4 * k)} ${f(3 * k)}" stroke="${c}" stroke-width="${f(.4 * k)}" fill="none"/>`;
    return n; };
  const notes = note(124, 70, .95, false) + note(110.5, 76, .9, true) + note(100, 69.5, .8, false) + note(118, 92, .75, false) + note(103, 88, .7, false);
  s += `<g filter="url(#${gid})" opacity=".8">${notes}</g><g opacity=".9">${notes}</g>`;
  // a faint sinuous glimmer on the air along the way the song goes
  s += `<path d="M140 66C130 60 122 74 112 70S96 64 90 74" stroke="${c}" stroke-width=".4" fill="none" stroke-dasharray=".6 1.4" opacity=".55"/>`;
  return s;
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
// the bow from the side, stem to the right. Our eye is low, so we see the rail cap from below: its face lit by the
// lantern, a shadow under its lip on the bulwark. The strakes run along the sheer, each a little darker towards its
// lower seam; the wales stand proud and throw a shadow down the planking; the fore channel juts out under the rail
// with the deadeyes of the shrouds on it and the chainplates down the side.
const railTop = x => 72 - (x + 12) * .055;                        // the sheer rises a little to the stem
const CH = x => railTop(x) + 6.4;                                   // the top of the fore channel
const SHROUDS = [4, 12, 20];
function bow(u, L) {
  const stem = [[48, railTop(48) - 2], [47.4, 92], [44.6, 112], [40, WL + 4]];
  const outlinePts = [[-14, railTop(-14)], [48, railTop(48)], ...stem.slice(1), [-14, WL + 4]];
  const id = nid('bw', u), cid = nid('bc', u), tar = L.ramp('tar', 20, 100), oak = L.ramp('oak', 20, 80);
  let s = `<defs>${linGrad(id, 0, 66, 0, WL, [[0, mix(tar.half, oak.core, .3)], [.3, tar.core], [1, mix(tar.shadow, '#05080e', .3)]])}<clipPath id="${cid}"><path d="M${pts(outlinePts).join('L')}Z"/></clipPath></defs>`;
  s += `<path d="${sp([[-14, railTop(-14)], [48, railTop(48)]])}L${pts(stem.slice(1)).join('L')}L-14 ${WL + 4}Z" fill="url(#${id})"/>`;
  s += `<g clip-path="url(#${cid})">`;
  // the strakes: each a band along the sheer, lighter at its top edge, shaded down to the seam under it; the butts
  // of the planks staggered, every plank a touch different in tone
  const R = rng(5), seam = y => x => y + (x + 14) * -.004 + Math.pow((x + 14) / 64, 2) * -1.2;
  for (let y = 79; y < WL + 2; y += 4.4) {
    const top = seam(y), bot = seam(y + 4.4), g = nid('sk', u);
    s += `<defs>${linGrad(g, 0, y, 0, y + 4.4, [[0, mix(tar.half, '#000', .05)], [.25, tar.core], [.85, mix(tar.shadow, '#000', .2)], [1, mix(tar.shadow, '#000', .45)]])}</defs>`;
    s += `<path d="M-14 ${f(top(-14))}L50 ${f(top(50))}L50 ${f(bot(50))}L-14 ${f(bot(-14))}Z" fill="url(#${g})" opacity=".9"/>`;
    for (let x = -14 + R() * 18; x < 50; x += 16 + R() * 12) { const w = 16 + R() * 10; s += `<path d="M${f(x)} ${f(top(x) + .3)}h${f(w)}v4h${f(-w)}Z" fill="${R() < .5 ? '#000' : '#ffffff'}" opacity="${f(.03 + R() * .04)}"/><path d="M${f(x)} ${f(top(x) + .3)}v4" stroke="${mix(tar.shadow, '#000', .4)}" stroke-width=".35" opacity=".7"/>`; }
    s += `<path d="M-14 ${f(top(-14))}L50 ${f(top(50))}" stroke="${mix(tar.shadow, '#000', .5)}" stroke-width=".45" opacity=".85"/><path d="M-14 ${f(top(-14) + .5)}L50 ${f(top(50) + .5)}" stroke="${mix(tar.lit, L.keyColor, .3)}" stroke-width=".3" opacity=".35"/>`;
  }
  // the wales: heavy rounded bands, their shadow thrown down the strakes under them
  for (const [y, w] of [[88, 3.6], [102, 3.2]]) {
    const g = nid('wa', u);
    s += `<path d="M-14 ${f(y + w / 2 + .2)}C10 ${f(y + w + .2)} 30 ${f(y + w)} 50 ${f(y + w - 2.4)}L50 ${f(y + w - .4)}C30 ${f(y + w + 2)} 10 ${f(y + w + 2.2)} -14 ${f(y + w / 2 + 2.2)}Z" fill="#05060c" opacity=".45"/>`;
    s += `<defs>${linGrad(g, 0, y - w / 2, 0, y + w / 2, [[0, tar.lit], [.4, tar.half], [1, tar.shadow]])}</defs><path d="M-14 ${f(y - w / 2)}C10 ${f(y)} 30 ${f(y - .2)} 50 ${f(y - 2.6)}L50 ${f(y + w - 2.6)}C30 ${f(y + w - .2)} 10 ${f(y + w)} -14 ${f(y + w / 2)}Z" fill="url(#${g})" stroke="${tar.outline}" stroke-width=".4"/>`;
  }
  // the bulwark's upper strake is oiled oak; under the rail cap's lip a dark shadow
  s += `<path d="M-14 ${f(railTop(-14))}L50 ${f(railTop(50))}L50 ${f(railTop(50) + 6)}L-14 ${f(railTop(-14) + 7)}Z" fill="${mix(oak.core, tar.core, .45)}"/>`;
  s += `<path d="M-14 ${f(railTop(-14) + .4)}L50 ${f(railTop(50) + .4)}L50 ${f(railTop(50) + 2)}L-14 ${f(railTop(-14) + 2.2)}Z" fill="#05060c" opacity=".5"/>`;
  s += `<path d="M-14 ${f(railTop(-14) + 7)}L50 ${f(railTop(50) + 6)}" stroke="${mix(tar.shadow, '#000', .5)}" stroke-width=".6"/>`;
  // the lantern's warmth on the bow round it
  s += K.localGlow(u, { x: LAMP.x + 2, y: 74, color: '#ffb05a', power: .55, radius: 34 }, { core: false });
  // the channel's shadow on the planking and the chainplates running down from it, bolted at their feet
  s += `<path d="M-14 ${f(CH(-14) + 2.2)}L27 ${f(CH(27) + 2.2)}L28 ${f(CH(28) + 5.4)}L-14 ${f(CH(-14) + 6.2)}Z" fill="#05060c" opacity=".45"/>`;
  const iron = L.ramp('iron', 12, 86);
  for (const x of SHROUDS) { const a = [x + .4, CH(x) + 2.2], b = [x - 1.2, CH(x) + 14];
    s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${iron.shadow}" stroke-width="1.1"/><path d="M${f(a[0] + .35)} ${f(a[1])}L${f(b[0] + .35)} ${f(b[1])}" stroke="${mix(iron.lit, '#ffb878', .3)}" stroke-width=".3" opacity=".7"/>`
      + `<circle cx="${f(b[0])}" cy="${f(b[1] + .4)}" r=".7" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".25"/>`; }
  s += '</g>';
  // the rail cap seen from below: its face catches the lantern, its top edge the moon
  s += `<path d="M-14 ${f(railTop(-14) - 2)}L49 ${f(railTop(49) - 2)}L49.8 ${f(railTop(49) + .5)}L-14 ${f(railTop(-14) + .5)}Z" fill="${oak.core}" stroke="${oak.outline}" stroke-width=".4"/>`;
  s += `<path d="M-14 ${f(railTop(-14) - .2)}L49.6 ${f(railTop(49) - .2)}" stroke="${oak.shadow}" stroke-width=".9" opacity=".7"/>`;
  s += `<path d="M-14 ${f(railTop(-14) - 1.9)}L49 ${f(railTop(49) - 1.9)}" stroke="${mix(oak.lit, L.keyColor, .3)}" stroke-width=".55" opacity=".9"/>`;
  s += K.localGlow(u, { x: LAMP.x + 1, y: railTop(LAMP.x) - 1, color: '#ffc070', power: .5, radius: 14 }, { core: false, squash: .25 });
  // the stem: its forward edge lit by the moon ahead
  s += `<path d="M${f(stem[0][0])} ${f(stem[0][1])}C48.4 88 46.6 104 ${f(stem[3][0])} ${f(stem[3][1])}" stroke="${mix(tar.lit, L.keyColor, .5)}" stroke-width=".7" fill="none" opacity=".75"/>`;
  // the fore channel: a thick plank out from the side, seen from below — its underside dark, its face lit
  { const x0 = -14, x1 = 27, g = nid('ch', u);
    s += `<defs>${linGrad(g, 0, CH(10), 0, CH(10) + 2.4, [[0, mix(oak.lit, '#ffc070', .2)], [.5, oak.core], [1, oak.shadow]])}</defs>`;
    s += `<path d="M${x0} ${f(CH(x0))}L${x1} ${f(CH(x1))}L${x1 + 1.2} ${f(CH(x1) + 1)}L${x1 + .6} ${f(CH(x1) + 2.4)}L${x0} ${f(CH(x0) + 2.4)}Z" fill="url(#${g})" stroke="${oak.outline}" stroke-width=".4"/>`;
    s += `<path d="M${x0} ${f(CH(x0) + 2.4)}L${x1 + .6} ${f(CH(x1) + 2.4)}L${x1} ${f(CH(x1) + 3.4)}L${x0} ${f(CH(x0) + 3.6)}Z" fill="${mix(oak.shadow, '#05060c', .5)}"/>`; }
  // the foam where the bow meets the sea
  s += K.foam(u, { x: 14, y: WL + .3, w: 58, h: 1.3, L, seed: 21 });
  return s;
}
/** The fore shrouds: from the deadeyes on the channel (lanyards rove between each pair) up out of the frame to the foremast; ratlines. */
function rigging(u, L) {
  const rp = L.ramp('rope', 20, 40), oak = L.ramp('oak', 12, 70);
  let s = '';
  const tops = [[-14, -14], [-6, -14], [2, -14]], feet = SHROUDS.map(x => [x, CH(x) - 4.4]);
  feet.forEach((a, i) => { s += `<path d="M${f(a[0])} ${f(a[1])}L${f(tops[i][0])} ${f(tops[i][1])}" stroke="${rp.outline}" stroke-width="${f(1.1 - i * .1)}" fill="none"/>`; });
  for (let t = .1; t < .9; t += .1) { const p = feet.map((a, i) => [lerp(a[0], tops[i][0], t), lerp(a[1], tops[i][1], t)]);
    for (let i = 0; i < 2; i++) s += `<path d="M${f(p[i][0])} ${f(p[i][1])}Q${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2 + 1)} ${f(p[i + 1][0])} ${f(p[i + 1][1])}" stroke="${rp.outline}" stroke-width=".38" fill="none" opacity=".85"/>`; }
  // the deadeyes: the upper one at the shroud's end, the lower one on the channel, the lanyard between them
  for (const x of SHROUDS) { const up = [x, CH(x) - 4.4], lo = [x + .2, CH(x) - 1.2];
    s += `<path d="M${f(up[0] - .7)} ${f(up[1])}L${f(lo[0] - .7)} ${f(lo[1])}M${f(up[0])} ${f(up[1])}L${f(lo[0])} ${f(lo[1])}M${f(up[0] + .7)} ${f(up[1])}L${f(lo[0] + .7)} ${f(lo[1])}" stroke="${rp.core}" stroke-width=".3"/>`;
    for (const p of [up, lo]) s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="1.5" ry="1.1" fill="${oak.shadow}" stroke="${oak.outline}" stroke-width=".35"/><path d="M${f(p[0] - 1.2)} ${f(p[1] - .5)}q1.2 -.8 2.4 0" stroke="${mix(oak.lit, '#ffc070', .3)}" stroke-width=".3" fill="none" opacity=".8"/>`; }
  return s;
}
function lanternOnLanyard(u, L) {
  // the lanyard from the aftmost shroud down to the lantern's bail
  const a = [20, CH(20) - 4.4], b = [2, -14], t = (a[0] - LAMP.x) / (a[0] - b[0]), top = [LAMP.x, lerp(a[1], b[1], t)];
  return `<path d="M${f(top[0])} ${f(top[1])}L${f(LAMP.x)} ${f(LAMP.y - 28 * LAMP.s + .4)}" stroke="#2a1a0c" stroke-width=".5"/>` + K.lantern(u, L, LAMP);
}

// ——— the sailor diving ———
// head first down towards the rocks: the body leans to them, the near leg trailing back to the rail (the toe just
// off it), the far knee bent under him; the far arm reaches up to the singer, the near one down to the water; his face
// in profile, rapt, the mouth open. Drawn as contours (lib/people.cjs): shirt sleeves with folds and cuffs, rolled
// trousers, bare feet, hands with fingers. The lantern behind warms his back, the moon ahead lights his face.
function sailor(u, L) {
  const lift = (r, k = .3) => ({ lit: mix(r.lit, '#e8eeff', k), half: r.half, core: r.core, shadow: r.shadow, outline: r.outline });
  const skin = lift(L.ramp('skin', 80, 78), .2), shirt = lift(L.ramp('linen', 68, 72), .2), pants = (() => { const r = L.ramp('tar', 56, 72); return { lit: mix(r.lit, '#6a7aa8', .5), half: mix(r.half, '#2a3458', .4), core: mix(r.core, '#2a3458', .4), shadow: mix(r.shadow, '#080a14', .3), outline: r.outline }; })();
  const red = L.ramp('paint-red', 62, 66), warm = '#ffb878', moon = '#dfe8ff';
  let s = '';
  // the far arm raised forward to the singer, the hand open
  const fSh = [74.2, 73.2], fEl = [81, 68.2], fWr = [88.4, 66.6];
  s += H.cloth(u, { spine: [fSh, fEl, fWr], w: [3.4, 2.8, 2.3], tone: mix3(shirt, .25), lit: -1, cuff: { from: .84, k: 1.12 }, rim: moon, rimSide: -1, seed: 3, capA: true });
  { const h = H.hand(u, { at: fWr, a: -6, s: .56, m: 1, pose: 'open', spread: 11, curl: .3, tone: mix3(skin, .25), thumb: 'front', sw: .32 }); s += h.back + h.front; }
  // the far leg: the knee bent under him, the shin trailing back, the bare foot pointed
  const fHip = [61.8, 65.6], fKn = [66.4, 75.6], fAn = [57.8, 79.4];
  s += H.cloth(u, { spine: [lerp2(fKn, fAn, .3), fAn], w: [2.8, 2.2], tone: mix3(skin, .25), lit: -1, folds: false });
  s += foot(u, fAn, 192, 5.6, mix3(skin, .25));
  s += H.cloth(u, { spine: [fHip, fKn, lerp2(fKn, fAn, .45)], w: [5.6, 4.2, 3.4], tone: mix3(pants, .25), lit: -1, cuff: { from: .84, k: 1.08, roll: true }, seed: 5, capA: true });
  // the torso: a loose shirt from the hips to the shoulders, billowing, folds blown back
  const hip = [60.4, 66.8], mid = [67.8, 70.2], sh = [75, 74.4];
  s += H.cloth(u, { spine: [hip, mid, sh], w: [6.6, 7.4, 7.8], tone: shirt, lit: -1, rim: warm, rimSide: -1, rimOp: .6, seed: 9, drapes: 5, capB: true });
  // the open collar and the throat
  s += `<path d="${sp([[73.6, 77.6], [75.6, 76.4], [77, 77.2]])}" stroke="${shirt.shadow}" stroke-width=".5" fill="none"/>`;
  // the sash at the waist, its ends lifting up behind him as he falls
  s += H.cloth(u, { spine: [[59.4, 66.4], [63.6, 68.2]], w: [7.2, 7.4], tone: red, lit: -1, folds: false });
  s += `<path d="${sp([[60.2, 64.2], [56.4, 59.8], [52.6, 58.2], [53.8, 60.4], [52.4, 61.2], [56.6, 63.2], [58.8, 65.6]], true)}" fill="${red.core}" stroke="${red.outline}" stroke-width=".35"/><path d="${sp([[60.2, 64.2], [56.4, 59.8], [52.6, 58.2]])}" stroke="${mix(red.lit, warm, .4)}" stroke-width=".35" fill="none" opacity=".8"/>`;
  // the near leg trailing back to the rail: rolled trousers, the bare shin, the foot pointed and just off the rail
  const nHip = [60.4, 68], nKn = [50.8, 72], nAn = [45.4, 67.6];
  s += H.cloth(u, { spine: [lerp2(nKn, nAn, .3), nAn], w: [3, 2.4], tone: skin, lit: -1, rim: warm, rimSide: 1, folds: false });
  s += foot(u, nAn, 214, 6, skin);
  s += H.cloth(u, { spine: [nHip, nKn, lerp2(nKn, nAn, .45)], w: [6, 4.4, 3.6], tone: pants, lit: -1, rim: warm, rimSide: 1, rimOp: .5, cuff: { from: .84, k: 1.08, roll: true }, seed: 6, capA: true });
  // the neck and the head lifted to look at the rocks
  s += H.cloth(u, { spine: [[75.2, 75.4], [78.6, 75.6]], w: [3.2, 2.8], tone: skin, lit: -1, folds: false });
  const hd = H.head(u, { c: [81.6, 75.4], r: 3.5, dir: 1, tilt: 6, tone: skin, warm: { color: '#d8e4ff', op: .5 }, edge: moon, rim: warm, mouth: .55, eye: 'wide', brow: 'up', hairColor: '#1c120c', stubble: true });
  s += hd.svg;
  const Q = hd.Q, kr = red, kid = nid('kc', u);
  // the hair at the nape under the kerchief; the kerchief over the crown, the knot behind, its tails lifted
  s += `<path d="${sp([Q(-.96, .3), Q(-.98, -.1), Q(-.7, -.2), Q(-.5, .2), Q(-.6, .5)], true)}" fill="#1c120c"/>`;
  { const a = Q(-1, .3), b = Q(.9, -.8); s += `<defs>${linGrad(kid, a[0], a[1], b[0], b[1], [[0, kr.shadow], [.6, kr.core], [1, mix(kr.lit, warm, .2)]])}</defs>`; }
  s += `<path d="${sp([Q(-1.06, .1), Q(-1.02, -.55), Q(-.52, -1.08), Q(.3, -1.12), Q(.84, -.7), Q(.6, -.54), Q(0, -.66), Q(-.5, -.34), Q(-.76, .16)], true)}" fill="url(#${kid})" stroke="${kr.outline}" stroke-width=".4"/>`;
  s += `<path d="${sp([Q(-.92, -.4), Q(-1.7, -.9), Q(-2.5, -1.6), Q(-2.1, -1), Q(-2.5, -.6), Q(-1.7, -.5), Q(-1, -.1)], true)}" fill="${kr.shadow}" stroke="${kr.outline}" stroke-width=".35"/>`;
  s += `<path d="${sp([Q(.3, -1.12), Q(.84, -.7)])}" stroke="${moon}" stroke-width=".4" fill="none" opacity=".7"/>`;
  // the near arm reaching down to the water, the hand open
  const nSh = [74.6, 76.6], nEl = [80.4, 83.6], nWr = [87.4, 87.4];
  s += H.cloth(u, { spine: [nSh, nEl, nWr], w: [3.6, 3, 2.4], tone: shirt, lit: -1, cuff: { from: .84, k: 1.12 }, rim: moon, rimSide: -1, seed: 4, capA: true });
  { const h = H.hand(u, { at: nWr, a: 36, s: .58, m: -1, pose: 'open', spread: 10, curl: .35, tone: skin, thumb: 'front', sw: .32 }); s += h.back + h.front; }
  return `<g>${s}</g>`;
}
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
// the far side of him is a little deeper in shade
function mix3(t, k) { return { lit: mix(t.lit, t.half, k), half: mix(t.half, t.shadow, k), core: mix(t.core || t.half, t.shadow, k), shadow: mix(t.shadow, '#05060c', k * .5), outline: t.outline }; }
// a bare foot pointed (the instep in a line with the shin): heel, sole, the ball, the toes; a = the direction to the toes
function foot(u, at, a, len, tn) {
  const r = a * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r), nx = -uy, ny = ux, k = len / 6;
  const P = (x, y) => [at[0] + k * (x * ux + y * nx), at[1] + k * (x * uy + y * ny)];
  const out = [[-.8, -1.1], [1.4, -1.2], [3.6, -1.0], [5.2, -.8], [6.2, -.3], [6.3, .3], [5.4, .7], [3.8, .9], [2, 1.3], [.4, 1.5], [-1, 1.0]].map(p => P(p[0], p[1]));
  let s = `<path d="${sp(out, true)}" fill="${tn.half}" stroke="${tn.outline}" stroke-width=".35"/>`;
  s += `<path d="${sp([P(0, -1), P(2.6, -1.05), P(5, -.7)])}" stroke="${tn.lit}" stroke-width=".4" fill="none" opacity=".6"/>`;
  for (const y of [-.45, 0, .4]) { const p = P(5.2, y), q = P(6.1, y * .8); s += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="${tn.shadow}" stroke-width=".2" opacity=".8"/>`; }
  { const p = P(-.2, .9); s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.5 * k)}" fill="${tn.shadow}" opacity=".5"/>`; }
  return s;
}
