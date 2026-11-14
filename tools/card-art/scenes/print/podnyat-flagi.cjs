// «Поднять флаги!» (Жемчужина, ПРИКАЗ: в этот ход Залпы обоих кораблей команды +1 урон), refined from the
// first-round scene (portrait-pearl.cjs SCENES['Поднять флаги!']): night, the flagstaff at the taffrail on the left,
// the big black flag with the skull and crossed bones just run up and flying out to the right; behind it, at sea,
// the Revenge and the Pearl — each has just broken out its own black flag at the main truck, all three fly the same
// way at once (brief: два флага синхронно). A sailor's hand hauls the halyard down hand over hand.
// Fixed against the first round: the flag was a flat banner hanging stiff from the staff — now it is cloth in the wind
// (folds lit by the moon behind it, the moon shines through it and through the shot holes, the fly torn into
// tongues), the skull is drawn with its volume and follows the folds; the staff stood on the rail by itself — now
// it is lashed to the bulwark with iron bands, the halyard runs over the truck down to a hand and a cleat; the two
// ships were squeezed copies — now the kit's Revenge and Pearl, both under sail, with their own flags made big
// enough to read. Light: the moon behind the flag (cold, the key); a lantern on the rail warms the hand (local).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 100;                                   // the sea horizon
const SX = 45, ST = 12;                           // the flagstaff: x, the truck
const FX = SX + 1.6, FT = 15, FH = 42, FLN = 99;  // the flag: hoist x, hoist top, hoist height, fly length (to the right)
const RAIL = 112;                                 // the top of the bulwark (the capping rail)
const MOON = { x: 116, y: 40 };
const LAMP = { x: 74, y: 110.2, s: 1.05 };
const light = { time: 'night', haze: .3, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 22, color: '#d4def6', power: .85 },
  fill: { color: '#3d5680', power: .4 }, rim: { az: 12, color: '#c8dcff', power: .6 },
  locals: [{ x: LAMP.x, y: LAMP.y - 8, color: '#ffc070', power: .75, radius: 42 }] };
const REV = { kind: 'revenge', x: 104, y: 103, scale: .34, flip: true, sails: 'full', detail: 'mid', lights: true, wake: true, seed: 3 };
const PRL = { kind: 'pearl', x: 165, y: 106, scale: .44, flip: true, sails: 'full', detail: 'mid', lights: true, wake: true, seed: 4 };
// the fist on the hauling part of the halyard, drawn in the hand's frame: origin the wrist, x toward the knuckles,
// the thumb on the frame's -y side (on top); the halyard runs through the fist along the knuckle line at x = 15
const WR = [35.5, 100], WA = -20 * Math.PI / 180;
const HP = (x, y) => [WR[0] + x * Math.cos(WA) - y * Math.sin(WA), WR[1] + x * Math.sin(WA) + y * Math.cos(WA)];
const HAUL = HP(15, -6.8), HAUL2 = HP(15, 5.9);   // where the halyard goes into the fist (over the index finger) and comes out
const skel = { horizon: HZ, eye: 3, light: 'the moon behind the flag (key) + a lantern on the rail (local, warms the hand)', items: [
  ['flag', FX, FT + FH + 4, FLN, FH + 6, 'staff (halyard)'], ['staff', SX - 2, 136, 4, 124, 'bulwark (iron bands)'],
  ['revenge', 80, 103, 50, 36, 'water'], ['pearl', 131, 106, 69, 46, 'water'], ['lantern', LAMP.x - 6, LAMP.y, 12, 30, 'rail cap'],
  ['hand + arm', 0, 150, 52, 60, 'from the near left edge, on the halyard'], ['bulwark', 0, 150, 200, 38, 'deck']] };

// ——— the big flag: cloth in the wind, folds lit by the moon behind, the skull and bones following the folds,
// shot holes and a torn fly that the sky shows through ———
function bigFlag(u, L) {
  const R = rng(11), N = 40;
  const w = t => 4.6 * Math.pow(t, .75) * Math.sin(Math.PI * 2 * 1.45 * t - .5);
  const dw = t => (w(Math.min(1, t + .01)) - w(Math.max(0, t - .01))) / .02;
  const X = t => FX + FLN * t, Yt = t => FT + w(t) + 2.4 * t * t, Yb = t => FT + FH * (1 - .1 * t) + w(t) + 3.4 * t * t;
  const at = (t, v) => [X(t), lerp(Yt(t), Yb(t), v)];
  const P = p => `${f(p[0])} ${f(p[1])}`;
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) { const t = i / N; top.push([X(t), Yt(t)]); bot.push([X(t), Yb(t)]); }
  // the torn fly: tongues of cloth of different length with notches between them
  const fly = [], tips = [];
  for (let k = 1; k < 12; k++) { const v = k / 12, b = at(1, v);
    if (k % 2) { const tip = [b[0] + 1 + R() * 5 + (k === 5 ? 3 : 0), b[1] + 1.2 + R()]; fly.push(tip); tips.push(tip); }
    else fly.push([b[0] - 4 - R() * 7, b[1] + (R() - .5)]); }
  const outline = 'M' + top.map(P).join('L') + 'L' + fly.map(P).join('L') + 'L' + bot.slice().reverse().map(P).join('L') + 'Z';
  // the shot holes (the sky shows through), each a small torn star
  const holes = [[.66, .62, 1.5], [.72, .44, 1.1], [.84, .7, 2.3], [.22, .82, 1.3], [.92, .3, 1.9], [.4, .12, 1.1]].map(([t, v, r]) => { const c = at(t, v), n = 8, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (i % 2 ? .55 + R() * .3 : 1 + R() * .5); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * .9]); }
    return { c, r, d: 'M' + pts.map(P).join('L') + 'Z' }; });
  const gid = nid('fg', u), oid = nid('fo', u), cid = nid('fc', u), mid = nid('fm', u), tid = nid('ft', u);
  // fold shading along the fly: the side of a wave turned up to the moon is lighter, the back of it dark
  const stops = [], ostops = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24, b = .5 + .5 * Math.tanh(-dw(t) * .45);
    stops.push([t, mix('#050508', '#555a6e', b), 1]);
    ostops.push(b < .5 ? [t, '#000000', (.5 - b) * 1.1] : [t, '#cfdcf6', (b - .5) * .4]); }
  let s = `<defs>${linGrad(gid, FX, 0, FX + FLN, 0, stops)}${linGrad(oid, FX, 0, FX + FLN, 0, ostops)}`
    + `${radGrad(tid, MOON.x, MOON.y, 44, [[0, '#dce6fa', .85], [.18, '#a8b8dc', .55], [.5, '#7080a8', .22], [1, '#5a6890', 0]])}`
    + `<clipPath id="${cid}"><path d="${outline}"/></clipPath>`
    + `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="140"><rect x="0" y="0" width="200" height="140" fill="#fff"/>${holes.map(h => `<path d="${h.d}" fill="#000"/>`).join('')}</mask></defs>`;
  s += `<g mask="url(#${mid})">`;
  s += `<path d="${outline}" fill="url(#${gid})"/>`;
  s += `<g clip-path="url(#${cid})">`;
  // the moon shines through the black cloth: a cold glow round the place it stands behind
  s += `<rect x="${FX}" y="0" width="${FLN + 20}" height="80" fill="url(#${tid})"/>`;
  // the weave and the old seams of the cloth (two breadths sewn together), stains of salt
  for (const v of [.5]) s += `<path d="M${top.map((p, i) => P(at(i / N, v))).join('L')}" stroke="#000" stroke-width=".7" fill="none" opacity=".45"/><path d="M${top.map((p, i) => P([at(i / N, v)[0], at(i / N, v)[1] + .6])).join('L')}" stroke="#6a7088" stroke-width=".3" fill="none" opacity=".35"/>`;
  for (let i = 0; i < 7; i++) { const t = .1 + R() * .8, v = .1 + R() * .8, c = at(t, v); s += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(3 + R() * 5)}" ry="${f(1.5 + R() * 2)}" fill="#8a90a8" opacity="${f(.04 + R() * .05)}"/>`; }
  // the skull and crossed bones, painted on the cloth: they follow the fold at the middle (skew), lit from behind
  { const t0 = .47, c = at(t0, .5), sk = Math.atan(dw(t0) / FLN) * 180 / Math.PI, T = `translate(${f(c[0])} ${f(c[1])}) skewY(${f(sk)}) scale(1.02)`;
    const bone = (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l * 1.5, ny = dx / l * 1.5;
      return `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#e6dfcc" stroke-width="2.8" stroke-linecap="round"/>`
        + [[x1, y1], [x2, y2]].map(([x, y]) => `<circle cx="${f(x + nx)}" cy="${f(y + ny)}" r="2.1" fill="#e6dfcc"/><circle cx="${f(x - nx)}" cy="${f(y - ny)}" r="2.1" fill="#e6dfcc"/>`).join('')
        + `<path d="M${f(x1 + nx * .5)} ${f(y1 + ny * .5)}L${f(x2 + nx * .5)} ${f(y2 + ny * .5)}" stroke="#fffaf0" stroke-width=".6" opacity=".7"/>`
        + `<path d="M${f(x1 - nx * .6)} ${f(y1 - ny * .6)}L${f(x2 - nx * .6)} ${f(y2 - ny * .6)}" stroke="#8a8474" stroke-width=".7" opacity=".7"/>`; };
    const cran = 'M-7.6 -1.6C-8 -11 -4.4 -14.6 0 -14.6C4.4 -14.6 8 -11 7.6 -1.6C7.4 1.2 6.2 2.8 5 3.4L5.2 7.2L-5.2 7.2L-5 3.4C-6.2 2.8 -7.4 1.2 -7.6 -1.6Z';
    const sg = nid('sk', u);
    let sv = `<defs>${linGrad(sg, -8, -14, 8, 7, [[0, '#fbf6ea', 1], [.5, '#e6dfcc', 1], [1, '#a29a86', 1]])}</defs>`;
    sv += bone(-15.5, -9.5, 15.5, 10.5) + bone(-15.5, 10.5, 15.5, -9.5);
    sv += `<path d="${cran}" fill="url(#${sg})" stroke="#5a5446" stroke-width=".35"/>`
      + `<path d="M-6.2 -8.6C-4.6 -12.6 2 -13.8 5.6 -10" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".75" stroke-linecap="round"/>`
      + `<path d="M-5.6 1.6Q-7 -1 -7 -4" stroke="#8a8270" stroke-width=".8" fill="none" opacity=".6"/>`
      + `<ellipse cx="-3.3" cy="-3.6" rx="2.5" ry="2.9" fill="#0a0a0e" transform="rotate(-14 -3.3 -3.6)"/><ellipse cx="3.3" cy="-3.6" rx="2.5" ry="2.9" fill="#0a0a0e" transform="rotate(14 3.3 -3.6)"/>`
      + `<path d="M-4.6 -6.2Q-3.2 -7.2 -1.6 -6" stroke="#fffaf0" stroke-width=".4" fill="none" opacity=".6"/>`
      + `<path d="M0 -.4L-1.4 2.2Q0 2.9 1.4 2.2Z" fill="#0a0a0e"/>`
      + `<path d="M-4.4 4.4H4.4" stroke="#4a4436" stroke-width=".45"/>` + [-3.3, -1.1, 1.1, 3.3].map(x => `<path d="M${x} 4.4V7.1" stroke="#4a4436" stroke-width=".4"/>`).join('')
      + `<path d="M2.6 -13.6L1.8 -11.4L3 -10" stroke="#6a6252" stroke-width=".35" fill="none"/>`;
    s += `<g transform="${T}">${sv}</g>`; }
  // the folds over everything painted on the cloth
  s += `<rect x="${FX}" y="0" width="${FLN + 20}" height="80" fill="url(#${oid})"/>`;
  // the hoist edge: the bolt rope sewn along it, a darker strip of the doubled cloth
  s += `<path d="M${f(FX)} ${f(FT)}L${f(FX + 2.6)} ${f(Yt(.025))}L${f(FX + 2.6)} ${f(Yb(.025))}L${f(FX)} ${f(FT + FH)}Z" fill="#000" opacity=".35"/>`;
  s += '</g>';
  // the moonlit edge along the top of the flag and round the tongues of the fly
  s += `<path d="M${top.map(P).join('L')}" stroke="#d6e2fa" stroke-width=".6" fill="none" opacity=".75"/>`;
  s += `<path d="M${fly.map(P).join('L')}" stroke="#a8b8d8" stroke-width=".4" fill="none" opacity=".6"/>`;
  s += '</g>';
  // round the holes: the frayed, lighter edge of the cloth; threads trail from the tongues of the fly
  for (const h of holes) s += `<path d="${h.d}" fill="none" stroke="#6a7088" stroke-width=".35" opacity=".8"/>`;
  for (const p of tips) s += `<path d="M${f(p[0])} ${f(p[1])}q${f(1 + R())} ${f(.3 + R() * .5)} ${f(2 + R() * 1.4)} ${f(1.2 + R())}" stroke="#2a2c36" stroke-width=".3" fill="none"/>`;
  s += `<path d="M${f(FX)} ${f(FT - .2)}V${f(FT + FH + .2)}" stroke="#b8a888" stroke-width=".9"/><path d="M${f(FX - .3)} ${f(FT)}V${f(FT + FH)}" stroke="#ece2c8" stroke-width=".3" opacity=".7"/>`;
  return s;
}

// a small black flag just broken out at a ship's main truck, flying to the bow (right): wave, a white skull dot
function shipFlag(u, top, w, h, seed) {
  const R = rng(seed), N = 10, pts = [], bt = [];
  for (let i = 0; i <= N; i++) { const t = i / N, wv = Math.sin(t * 5.4 + seed) * .9 * t; pts.push([top[0] + w * t, top[1] + 1 + wv + t * .5]); bt.push([top[0] + w * t, top[1] + 1 + h * (1 - .15 * t) + wv + t * .8]); }
  const P = p => `${f(p[0])} ${f(p[1])}`, c = [top[0] + w * .45, top[1] + 1 + h * .5 + Math.sin(.45 * 5.4 + seed) * .4];
  return `<path d="M${pts.map(P).join('L')}L${f(top[0] + w + .8)} ${f(top[1] + 1 + h * .55)}L${bt.slice().reverse().map(P).join('L')}Z" fill="#101016" stroke="#9ab0d0" stroke-width=".25" stroke-opacity=".6"/>`
    + `<circle cx="${f(c[0])}" cy="${f(c[1] - .3)}" r="${f(h * .17)}" fill="#e6dfcc"/><path d="M${f(c[0] - h * .3)} ${f(c[1] - .1)}l${f(h * .6)} ${f(h * .32)}M${f(c[0] - h * .3)} ${f(c[1] + .2)}l${f(h * .6)} ${f(-h * .3)}" stroke="#e6dfcc" stroke-width="${f(h * .09)}"/>`
    + `<path d="M${f(top[0])} ${f(top[1])}V${f(top[1] + h + 3)}" stroke="#8a7a5a" stroke-width=".25"/>`;
}

// the fist round the halyard (the hand's frame, see HP): the back of the hand with its knuckles, four fingers closed
// round the rope — their first joints cross in front of it and turn away behind it, each throwing a shade on the next
// one down — and the thumb on the far side, its tip tucked behind the rope. The lantern on the right warms the
// knuckles and the bends of the fingers; the moon rims the top.
function fist(u, L, tn) {
  const P = HP, Ps = a => a.map(p => P(p[0], p[1])), pth = (a, c = true) => H.sp(Ps(a), c);
  const g = (id, a, b, st) => { const A = P(a[0], a[1]), B = P(b[0], b[1]); return linGrad(id, A[0], A[1], B[0], B[1], st); };
  const bk = nid('hb', u), th = nid('ht', u), fm = nid('hm', u), fmg = nid('hmg', u), fid = [0, 1, 2, 3].map(i => nid('hf' + i, u));
  const fins = [[-4.85, 3.0, 3.3], [-1.85, 3.05, 3.6], [1.1, 2.9, 3.3], [3.85, 2.55, 2.4]];   // [y, width, reach past the rope]
  let s = '<defs>' + g(bk, [7, 5.6], [8, -6.6], [[0, tn.shadow, 1], [.3, tn.core, 1], [.62, tn.half, 1], [1, tn.lit, 1]])
    + g(th, [10, -9.2], [10, -5.8], [[0, tn.lit, 1], [.45, tn.half, 1], [1, tn.shadow, 1]])
    + fins.map(([y, w], i) => g(fid[i], [14, y - w / 2], [14, y + w / 2], [[0, mix(tn.half, tn.lit, .7), 1], [.4, tn.half, 1], [.8, tn.core, 1], [1, tn.shadow, 1]])).join('') + '</defs>';
  // the fingers, the lowest first: each one's shade falls on the one under it
  for (let i = fins.length - 1; i >= 0; i--) { const [y, w, e] = fins[i], t = y - w / 2, b = y + w / 2, x1 = 15 + e;
    if (i < fins.length - 1) s += `<path d="${pth([[10.5, b - .2], [x1 - 1, b + .1], [x1 - .2, b + .5]], false)}" stroke="#1a0a04" stroke-width="1.3" fill="none" opacity=".5" stroke-linecap="round"/>`;
    s += `<path d="${pth([[10.4, t], [13.5, t - .1], [x1 - 1.4, t + .1], [x1 - .1, y - w * .2], [x1 + .1, y + w * .15], [x1 - .9, b - .05], [13.5, b + .05], [10.4, b]])}" fill="url(#${fid[i]})" stroke="${tn.outline}" stroke-width=".38"/>`;
    // the bend of the finger turning away behind the rope: the crease of the joint and the lantern's light on it
    s += `<path d="${pth([[x1 - 2.1, t + .5], [x1 - 1.7, y], [x1 - 2, b - .5]], false)}" stroke="${tn.shadow}" stroke-width=".3" fill="none" opacity=".8"/>`;
    s += `<path d="${pth([[x1 - 1.2, t + .35], [x1 - .3, y - w * .15], [x1 - .4, y + w * .2]], false)}" stroke="#ffd2a0" stroke-width=".45" fill="none" opacity=".55" stroke-linecap="round"/>`;
    s += `<path d="${pth([[11.4, t + .45], [14, t + .35], [x1 - 1.6, t + .45]], false)}" stroke="${tn.lit}" stroke-width=".35" fill="none" opacity=".5"/>`; }
  // the back of the hand: the knuckles stand up along its edge over the bases of the fingers
  const back = [[-3.4, -4.3], [-1, -4.5], [3, -5.3], [7.5, -6.2], [10.6, -6.8], [12.4, -6.3], [13.1, -4.8], [12.6, -3.4], [13.3, -1.9], [12.8, -.4], [13.2, 1.1], [12.6, 2.4], [12.8, 3.9], [12, 5.2], [9.4, 5.6], [5, 5.2], [1, 4.8], [-1, 4.6], [-3.4, 4.4]];
  // it grows out of the forearm: faded in over the wrist, so there is no seam
  { const A = P(-3.4, 0), B = P(2.2, 0), lo = P(-6, -12), hi = P(24, 12);
    s += `<defs>${linGrad(fmg, A[0], A[1], B[0], B[1], [[0, '#fff', 0], [1, '#fff', 1]])}<mask id="${fm}" maskUnits="userSpaceOnUse" x="0" y="60" width="80" height="70"><rect x="0" y="60" width="80" height="70" fill="url(#${fmg})"/></mask></defs>`; }
  s += `<g mask="url(#${fm})"><path d="${pth(back)}" fill="url(#${bk})"/><path d="${pth(back.slice(1, -1), false)}" fill="none" stroke="${tn.outline}" stroke-width=".42"/></g>`;
  // the tendons fanning to the knuckles, the knuckles lit, the wrist crease
  for (const [y] of fins) { s += `<path d="${pth([[1.5, y * .35], [7, y * .75], [11.6, y * .98]], false)}" stroke="${tn.shadow}" stroke-width=".3" fill="none" opacity=".35"/>`
    + `<path d="${pth([[2, y * .35 - .4], [7.2, y * .75 - .4], [11.4, y * .98 - .4]], false)}" stroke="${tn.lit}" stroke-width=".25" fill="none" opacity=".3"/>`; }
  for (const [y, w] of fins) s += `<path d="${pth([[12.2, y - w * .38], [13.2, y], [12.3, y + w * .32]], false)}" stroke="#ffd8b0" stroke-width=".5" fill="none" opacity=".65" stroke-linecap="round"/>`;
    // the thumb from the ball of the hand along the top of the index finger, round the far side of the rope; its shade
  // on the index finger; the rope passes over its tip
  s += `<path d="${pth([[5, -5.6], [9, -5.9], [13, -5.9], [16, -6.3]], false)}" stroke="#1a0a04" stroke-width="1.1" fill="none" opacity=".45" stroke-linecap="round"/>`;
  s += `<path d="${pth([[1, -3.5], [3.4, -6.4], [7.5, -8.4], [11.5, -9], [14.8, -8.7], [16.8, -7.8], [17, -6.8], [15.4, -6.3], [12, -6.4], [8.5, -5.7], [5, -4.3]])}" fill="url(#${th})" stroke="${tn.outline}" stroke-width=".4"/>`;
  s += `<path d="${pth([[3.6, -6.6], [7.6, -8.4], [11.6, -8.85], [14.4, -8.6]], false)}" stroke="#c8dcff" stroke-width=".35" fill="none" opacity=".55"/>`;
  s += `<path d="${pth([[11.6, -6.6], [11.9, -7.5], [11.5, -8.4]], false)}" stroke="${tn.shadow}" stroke-width=".25" fill="none" opacity=".7"/>`;
  s += K.rope(u, L, [P(15.1, -9.8), P(15, -6.6)], { r: .42, seed: 9 });
  return s;
}

module.exports = { name: 'Поднять флаги!', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 8 }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 22, 54, 6, 14, .2], [24, 66, 50, 5, 5, .45], [176, 78, 44, 5, 9, .55], [92, 84, 60, 4, 21, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 150, swell: .45, seed: 6, glitter: MOON.x });
    // the two ships of the brethren, both under sail with the wind on the quarter, bows to the right
    bg += K.ship(u, L, REV) + K.ship(u, L, PRL);
    { const gr = K.shipGeom('revenge', REV).masts[1].top, gp = K.shipGeom('pearl', PRL).masts[1].top;
      bg += shipFlag(u, gr, 10, 5.6, 2) + shipFlag(u, gp, 12.5, 7, 5); }
    // the singing crews: lanterns along the rails, a glow over each deck
    bg += K.localGlow(u, { x: 102, y: 96, color: '#ffc070', power: .25, radius: 14 }, { core: false }) + K.localGlow(u, { x: 160, y: 98, color: '#ffc070', power: .3, radius: 18 }, { core: false });
    let fg = '';
    // our own bulwark at the stern, from the deck: backlit by the moon, the cap catches the light
    fg += K.bulwark(u, L, { x1: -2, x2: 202, y: 150, h: 38, kind: 'oak', seed: 9 });
    // the flagstaff lashed to the inside of the bulwark with two iron bands; the truck with its sheave on top
    fg += K.shadeCyl(u, SX, 140, SX, ST + 1, 1.7, L, 'oak', { r1: 1.9, r2: 1.25, outline: .35, seed: 4 });
    for (const y of [117, 131]) fg += `<rect x="${f(SX - 2.6)}" y="${y}" width="5.2" height="2.6" rx=".6" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".35"/><circle cx="${f(SX + 1.6)}" cy="${y + 1.3}" r=".45" fill="#c8ccd4"/>`;
    fg += K.shadeSphere(u, SX, ST, 2.4, L, 'oak', { outline: .35 }) + `<rect x="${f(SX - .4)}" y="${f(ST - .2)}" width="4.6" height="2" rx=".6" fill="#2a1a10"/>`;
    // the halyard: over the sheave; one part down to the head of the flag, the hauling part down to the fist and on
    // to the coil on the cleat; the downhaul from the foot of the hoist to the same cleat
    const RP = { r: .42, seed: 5 };
    fg += K.rope(u, L, [[SX + 2, ST + .6], [FX + .2, FT - .4]], RP);
    fg += K.rope(u, L, [[SX + 3.6, ST + 1], [lerp(SX + 3.6, HAUL[0], .9), HAUL[1] - 9], HAUL], RP) + K.rope(u, L, [HAUL2, [HAUL2[0] + .3, 110], [SX + 6, 121]], { ...RP, seed: 6 });
    fg += K.rope(u, L, [[FX + .2, FT + FH + .4], [SX + 2.2, 80], [SX + 4.4, 121]], { r: .38, seed: 7 });
    fg += `<rect x="${SX + 3}" y="120.4" width="9" height="2" rx="1" fill="url(#oak${u})" stroke="#140a04" stroke-width=".35"/>`
      + K.rope(u, L, [[SX + 6, 121.5], [SX + 4, 126], [SX + 7.4, 132], [SX + 10, 127], [SX + 8.4, 122]], { r: .45, seed: 8 });
    fg += bigFlag(u, L);
    // the lantern on the rail cap: its warm pool on the cap and on the hand
    fg += K.lantern(u, L, { ...LAMP, lit: true, seed: 2 }) + K.localGlow(u, { x: LAMP.x, y: LAMP.y - 8, color: '#ffc070', power: .75, radius: 22 })
      + K.localGlow(u, { x: LAMP.x, y: LAMP.y + 1, color: '#ffb050', power: .45, radius: 34 }, { squash: .3, core: false });
    // the sailor's right arm from the near left, the elbow a little bent: the rolled linen sleeve, the bare forearm,
    // the fist closed round the halyard and hauling it down
    { const skin = { lit: '#f0b888', half: '#b97c54', core: '#a46c48', shadow: '#5e3626', outline: '#2a140a' };
      const shirt = { lit: '#e2dccc', half: '#9c9688', shadow: '#3e4050', outline: '#1a1a20' };
      const E = [18, 125], W = HP(4, .1);
      fg += H.cloth(u, { spine: [E, [lerp(E[0], W[0], .5) - 1, lerp(E[1], W[1], .5) - .4], W], w: [12.4, 11.2, 8.6], tone: skin, lit: 1, rim: '#c8dcff', rimSide: -1, rimOp: .6, folds: false, capA: true, sw: .4 })
        + `<path d="M${f(E[0] + 6)} ${f(E[1] - 10)}q3.4 -2.4 6.6 -6.4M${f(E[0] + 9)} ${f(E[1] - 7.4)}q2.6 -1.6 5 -4.6" stroke="#7a4a30" stroke-width=".35" fill="none" opacity=".6"/>`;
      fg += H.cloth(u, { spine: [[-18, 146], [-2, 136], [E[0] + 1.6, E[1] - 1.4]], w: [17, 15.6, 14.6], tone: shirt, lit: 1, rim: '#c8dcff', rimSide: -1, rimOp: .5, cuff: { from: .78, k: 1.1, roll: true }, seed: 4, drapes: 3, sw: .4 });
      fg += fist(u, L, skin);
      fg += K.localGlow(u, { x: HP(14, 0)[0], y: HP(14, 0)[1], color: '#ffb060', power: .22, radius: 13 }, { core: false }); }
    // the light: the cold of the night over the deck, the dark under the glass
    fg += glow(u, MOON.x, MOON.y, 70, 50, '#c8d8f0', .1) + gloom(u, 100, 118, 100, 280, .55, '#04060c') + gloom(u, 100, 90, 0, 0, .18, '#04060c');
    return [bg, fg];
  } };
