// «Ответ из пучины» (Летучий голландец, РЕАКЦИЯ: после Залпа по вашей команде стрелявший получает 1 урон по Команде;
// это не Залп), method A — a detailed copy of the first-round scene (portrait-dutch.cjs SCENES['Ответ из пучины']).
// The concept stays: on the enemy's deck at night in the green fog, one thick tentacle comes over the rail out of the
// sea; a barrel knocked over, a sailor's cap flying. Brief (card-briefs.md «Ответ из пучины»): the tentacle from
// over the side of the ship that fired takes one sailor. Find: one tentacle, one man (unlike «Кракен»: no monster).
// Fixed against the first round: the old tentacle was a uniform rubber hose lying across the deck with pink rings
// and nobody in it — now it rises from the sea behind the bulwark, thick at the root and tapering to a thin tip,
// mottled, suckers along its under side, a rim of moonlight along its back, water streaming off it in translucent
// ribbons that tear into threads; its tip is coiled round one ankle of a sailor and hauls him up head down over his
// own deck: a whole man in a striped shirt, his arms flung down towards the planks, fingers spread, his cap falling.
// The Dutchman a ghost on the horizon: the answer comes from her.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { motes } = PK;

const HZ = 82, RAIL = 104, DK = 120;               // the horizon; the rail cap; the deck at the foot of the bulwark
const light = { time: 'fog', haze: .75, key: { type: 'moon', x: 58, y: 26, el: 34, color: '#d4f4e4', power: .75 }, fill: { color: '#2f5a50', power: .45 },
  rim: { az: 300, color: '#d8fff0', power: .5 } };
// the man: hung head down by his left ankle
const J = { ank1: [95, 46], kn1: [96.6, 60], hip1: [98.6, 74], hip2: [102.4, 73], kn2: [114, 66.4], ank2: [119, 78.4],
  shL: [95.6, 94.4], elL: [88.6, 102.4], wrL: [83.4, 112], shR: [107.4, 94.8], elR: [114.4, 102], wrR: [119.4, 110.6], neck: [101.6, 96.4], head: [102.6, 103.8], hr: 4.6 };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon in the fog upper left (key, a little behind): rims on the tentacle\'s back and on the man, his front in half light', items: [
  ['tentacle', 84, 126, 98, 98, 'out of the sea behind the bulwark (root hidden by it), arching over the deck'],
  ['sailor (head down)', 76, 114, 50, 72, 'hung by the left ankle from the tentacle\'s tip coil'], ['cap', 80, 124, 10, 6, 'in the air, falling to the deck'],
  ['bulwark', 0, DK, 200, 16, 'the deck'], ['barrel (lying)', 18, 134, 30, 16, 'the deck, knocked over'], ['Dutchman', 28, 84, 30, 22, 'far sea, in the fog'],
  ['deck', 0, 290, 200, 170, 'under the glass from y≈138']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const SKIN = { lit: '#dcb89c', half: '#9c7258', core: '#7a5440', shadow: '#4a2e22', outline: '#1a0c06' };
const SHIRT = { lit: '#eef4ec', half: '#aab8b0', shadow: '#56645e', outline: '#16201c' };
const PANTS = { lit: '#5c6c7c', half: '#2e3a48', shadow: '#151c26', outline: '#080a0e' };
const BOOT = { lit: '#5a3c26', half: '#2e1c0e', shadow: '#140a04', outline: '#070302' };
const RIMC = '#d8fff0';

// ——— KIT-CANDIDATE tentacle (from kraken.cjs, the same spine/tube): the body shaded across, mottled skin, a crease,
// the moon's rim on the back, suckers along the under side — each a pale ring with a dark mouth, smaller to the tip
const TS = { lit: '#6a8e72', half: '#34503f', shadow: '#16261e', outline: '#07100b', rim: '#c8ffe4', sucker: '#cdbca6', mouth: '#4a2a28' };
function tentacle(u, C, W, o = {}) {
  const T = H.tube(C, W, 10), lit = o.lit || 1, i0 = 0, i1 = T.N, R = rng(o.seed || 3);
  const band = (a, b) => { const A = T.edge(a * lit, i0, i1), B = T.edge(b * lit, i0, i1).reverse(); return 'M' + [...A, ...B].map(P2).join('L') + 'Z'; };
  const d = 'M' + T.outline(i0, i1, 1, false, true).map(P2).join('L') + 'Z', cid = nid('tc', u), bl = nid('tb', u);
  let s = `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>`;
  s += `<path d="${d}" fill="${TS.half}"/><g clip-path="url(#${cid})"><g filter="url(#${bl})">`
    + `<path d="${band(.15, 1.3)}" fill="${TS.shadow}" opacity=".85"/><path d="${band(-1.3, -.35)}" fill="${TS.lit}" opacity=".9"/><path d="${band(-.95, -.6)}" fill="${mix(TS.lit, TS.rim, .4)}" opacity=".7"/></g>`;
  for (let i = 2; i < i1 - 1; i += 2) { const q = T.S[i]; if (q.w < 2.5) continue; const p = T.at(i, (R() - .5) * 1.2), r = q.w * (.06 + R() * .08);
    s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r * 1.6)}" ry="${f(r)}" transform="rotate(${f(Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI)} ${P2(p)})" fill="${R() > .5 ? '#14201a' : '#86a68a'}" opacity="${f(.25 + R() * .25)}"/>`; }
  s += `<path d="M${T.edge(.55 * lit, i0, i1).map(P2).join('L')}" stroke="${TS.outline}" stroke-width="${f(Math.max(.3, W[0] * .02))}" fill="none" opacity=".5"/></g>`;
  s += `<path d="M${T.edge(-.97 * lit, i0, i1).map(P2).join('L')}" stroke="${TS.rim}" stroke-width=".8" fill="none" opacity=".75" stroke-linecap="round"/>`;
  s += `<path d="${d}" fill="none" stroke="${TS.outline}" stroke-width=".45" opacity=".8"/>`;
  // suckers: on the under side, the ones on the turn of the body seen as ovals, two rows where it is thick
  for (let i = 1; i < i1; i += (o.step || 2)) { const q = T.S[i]; if (q.w < 1.4) continue; const a = Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI;
    for (const row of q.w > 9 ? [.6, .88] : [.74]) { const p = T.at(i + (row > .8 ? 1 : 0), row * lit), r = q.w * (row > .8 ? .11 : .16);
      s += `<g transform="translate(${P2(p)}) rotate(${f(a)})"><ellipse rx="${f(r * 1.15)}" ry="${f(r * .8)}" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".25"/><ellipse cx="${f(r * .1)}" rx="${f(r * .55)}" ry="${f(r * .36)}" fill="${TS.mouth}"/><path d="M${f(-r)} ${f(-r * .5)}q${f(r)} ${f(-r * .5)} ${f(r * 2)} 0" stroke="#f4ece0" stroke-width="${f(r * .2)}" fill="none" opacity=".6"/></g>`; } }
  return { svg: s, T };
}
// one turn of the tip round the ankle: a band across the leg, its near half (drawn over the leg), shaded across,
// two suckers pressed to the cloth
function coilBand(u, c, rx, ry, w, a, seed) {
  const pts = [], n = 14;
  for (let i = 0; i <= n; i++) { const t = Math.PI * i / n; pts.push([rx * Math.cos(t), ry * Math.sin(t)]); }
  const top = pts.map(p => [p[0], p[1] - w / 2]), bot = pts.map(p => [p[0], p[1] + w / 2]).reverse(), g = nid('cb', u);
  let s = `<g transform="translate(${P2(c)}) rotate(${f(a)})"><defs>${linGrad(g, 0, ry - w / 2, 0, ry + w / 2, [[0, mix(TS.lit, TS.rim, .3), 1], [.45, TS.half, 1], [1, TS.shadow, 1]])}</defs>`
    + `<path d="M${top.concat(bot).map(P2).join('L')}Z" fill="url(#${g})" stroke="${TS.outline}" stroke-width=".35"/>`;
  for (const t of [.35, .65]) { const x = rx * Math.cos(Math.PI * t), y = ry * Math.sin(Math.PI * t) + w * .32, r = w * .16;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.2)}" ry="${f(r * .7)}" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".2"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * .55)}" ry="${f(r * .3)}" fill="${TS.mouth}"/>`; }
  s += `<path d="M${top.map(P2).join('L')}" stroke="${TS.rim}" stroke-width=".4" fill="none" opacity=".7"/>`;
  return s + '</g>';
}
// a shoe at the ankle A, toe along d; the sole on the side of n (soleUp: the other side — the held foot, upside down)
function shoe(u, A, d, sz, soleUp) {
  d = unit(d); let n = [-d[1], d[0]]; if ((n[1] < 0) !== !!soleUp) n = [-n[0], -n[1]];
  const k = sz / 12, P = (x, y) => [A[0] + (d[0] * x + n[0] * y) * k, A[1] + (d[1] * x + n[1] * y) * k];
  const out = [[-2.6, -2.6], [-3.4, .4], [-3.5, 2.4], [-3, 3.6], [-.6, 3.7], [.2, 3], [2, 2.9], [7, 3.3], [9.4, 3.2], [10.6, 2.4], [10.8, 1.2], [9.8, .1], [7.4, -.6], [3.6, -1.4], [1.6, -2.8]].map(q => P(q[0], q[1]));
  const id = nid('sh', u), c0 = P(4, -1.4), c1 = P(4, 3.4);
  let s = `<defs>${linGrad(id, c0[0], c0[1], c1[0], c1[1], [[0, BOOT.lit, 1], [.45, BOOT.half, 1], [1, BOOT.shadow, 1]])}</defs>`
    + `<path d="M${out.map(P2).join('L')}Z" fill="url(#${id})" stroke="${BOOT.outline}" stroke-width=".35" stroke-linejoin="round"/>`;
  const sole = [[-3, 3.6], [-.6, 3.7], [.2, 3], [2, 2.9], [7, 3.3], [9.4, 3.2], [10.6, 2.4], [10.2, 2.1], [9.2, 2.6], [7, 2.6], [2, 2.2], [-.6, 2.8], [-3.3, 2.7]].map(q => P(q[0], q[1]));
  s += `<path d="M${sole.map(P2).join('L')}Z" fill="#0c0603"/><path d="M${P2(P(6, -.3))}Q${P2(P(9, .2))} ${P2(P(10, 1.4))}" stroke="#b08a68" stroke-width=".4" fill="none" opacity=".55"/>`
    + `<path d="M${[[-2.6, -2.6], [1.6, -2.8], [3.6, -1.4], [7.4, -.6]].map(q => P2(P(q[0], q[1]))).join('L')}" stroke="${RIMC}" stroke-width=".4" fill="none" opacity=".55"/>`;
  return s;
}
// KIT-CANDIDATE pour (as in uyti-na-glubinu.cjs): a thin translucent veil off a ledge, tearing into threads and drops
function pour(u, x, y0, y1, w, seed, o = {}) {
  const R = rng(seed), h = y1 - y0, drift = o.drift || 0, op = o.op || 1;
  if (h < 3) return '';
  const id = nid('po', u), X = t => x + drift * t * t;
  let s = `<defs>${linGrad(id, 0, y0, 0, y0 + h * .6, [[0, '#effff8', .34 * op], [.5, '#d8fff0', .2 * op], [1, '#c8f0e4', 0]])}</defs>`;
  const tear = .3 + R() * .15, n = 8, Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) { const t = i / n * (tear + .12), y = y0 + h * t, k = w * (1 - t / (tear + .14)) / 2 + .1;
    Lp.push([X(t) - k + Math.sin(i * 1.9 + seed) * w * .06, y]); Rp.unshift([X(t) + k + Math.sin(i * 1.3 + seed) * w * .06, y]); }
  s += `<path d="M${Lp.concat(Rp).map(P2).join('L')}Z" fill="url(#${id})"/>`;
  s += `<path d="M${f(x - w / 2)} ${f(y0)}Q${f(x)} ${f(y0 + .6)} ${f(x + w / 2)} ${f(y0)}" stroke="#ffffff" stroke-width=".35" fill="none" opacity="${f(.55 * op)}"/>`;
  const nt = 2 + Math.floor(R() * 2);
  for (let j = 0; j < nt; j++) { const spx = (j / (nt - 1 || 1) - .5) * w * .7, t1 = Math.min(.95, tear + .3 + R() * .35), pts = [];
    for (let i = 0; i <= 8; i++) { const t = lerp(tear, t1, i / 8); pts.push([X(t) + spx * (1 + (t - tear) * 1.5) + Math.sin(i * 1.7 + j * 2) * .3, y0 + h * t]); }
    for (let i = 0; i < 8; i++) { if (i > 3 && R() < .35) continue; s += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#e8fff6" stroke-width="${f(Math.max(.14, w * .16 * (1 - i / 9)))}" opacity="${f((.42 - i * .035) * op)}" stroke-linecap="round"/>`; }
    const e = pts[8]; for (let k = 0; k < 4; k++) { const r = .18 + R() * .3; s += `<ellipse cx="${f(e[0] + (R() - .5) * 1.6)}" cy="${f(e[1] + 1 + k * 2.2 + R())}" rx="${f(r)}" ry="${f(r * 1.8)}" fill="#effff8" opacity="${f(.35 + R() * .35)}"/>`; } }
  return s;
}

module.exports = { name: 'Ответ из пучины', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 }), R = rng(17);
    // ——— the green fog at night over the sea; the Dutchman a ghost on the horizon ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 10, seed: 6 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[150, 40, 100, 9, 4, .3], [30, 56, 70, 7, 9, .45], [120, 66, 80, 6, 2, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .5, seed: 9, glitter: 58 });
    bg += `<g opacity=".7">${K.ship(u, L, { kind: 'dutch', x: 40, y: HZ + 2, scale: .3, detail: 'far', lights: true, seed: 4 })}</g>`;
    bg += K.fog(u, L, { y: HZ - 14, h: 24, density: .55, seed: 3 });
    // ——— the tentacle: out of the sea behind the bulwark, over the deck, its tip coiled round his ankle ———
    const TC = [[172, 128], [168, 102], [162, 74], [150, 48], [130, 31], [111, 29], [99, 36], [96.5, 43.5]], TW = [27, 25, 20.5, 15.5, 10.5, 7, 5, 4.2];
    const tn = tentacle(u, TC, TW, { lit: -1, seed: 5, step: 2 });
    let mid = tn.svg;
    // a few barnacles and a frond of weed on its back near the root
    for (const [t, sd] of [[.2, 1], [.26, 2], [.33, 3]]) { const i = Math.round(t * tn.T.N), p = tn.T.at(i, .55); mid += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.8 + sd * .2)}" fill="#a8ac94" stroke="#2a2c22" stroke-width=".25"/><circle cx="${f(p[0] + .2)}" cy="${f(p[1] - .2)}" r=".35" fill="#1a1c14"/>`; }
    // water streaming off its under side: translucent ribbons tearing into threads, down to the deck
    for (const [t, w, sd] of [[.12, 4.4, 11], [.2, 3.6, 12], [.29, 3, 13], [.37, 2.4, 14], [.46, 1.8, 15]]) { const i = Math.round(t * tn.T.N), p = tn.T.at(i, -.9);
      mid += pour(u, p[0], p[1], Math.max(p[1] + 8, RAIL + 2 + (1 - t) * 12), w, sd, { drift: -1.2, op: 1.2 }); }
    // where it broke out of the sea behind the rail: a low crown of water thrown up round its root, spray in the air
    mid += K.splash(u, { x: 174, y: RAIL + 3, w: 30, h: 12, seed: 1, L, wind: -.3 });
    for (let i = 0; i < 30; i++) { const x = 150 + R() * 46, y = RAIL - 4 - R() * 24, r = .2 + R() * .4; mid += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 1.6)}" fill="#effff8" opacity="${f(.3 + R() * .45)}"/>`; }
    // ——— our bulwark and deck (the ship that fired): the tentacle's root hidden behind it ———
    let near = K.bulwark(u, L, { x1: -4, x2: 204, y: DK, h: DK - RAIL, kind: 'oak', posts: 22, seed: 6 });
    near += `<rect x="-4" y="${RAIL - 2}" width="208" height="${DK - RAIL + 2}" fill="#2a4a40" opacity=".3" style="mix-blend-mode:multiply"/>`;
    near += K.deck(u, L, { horizon: HZ, top: DK, bottom: 290, vx: 100, kind: 'pine-deck', plank: 13, seed: 7, wet: true });
    near += `<rect x="0" y="${DK}" width="200" height="${290 - DK}" fill="#1c3a34" opacity=".4" style="mix-blend-mode:multiply"/>`;
    // where it came over: the rail cap cracked under its weight, splinters standing up, the tentacle over it
    { const tb = nid('tk', u); near += `<defs><clipPath id="${tb}"><rect x="-10" y="${RAIL - 30}" width="220" height="31"/></clipPath></defs><g clip-path="url(#${tb})">${tentacle(u, TC.slice(0, 4), TW.slice(0, 4), { lit: -1, seed: 5, step: 2 }).svg}</g>`; }
    for (let i = 0; i < 9; i++) { const x = 152 + R() * 30, l = 2 + R() * 4, a = -60 - R() * 60; near += `<path d="M${f(x)} ${f(RAIL + .6)}l${f(Math.cos(a * Math.PI / 180) * l)} ${f(Math.sin(a * Math.PI / 180) * l)}l.5 .3z" fill="#c8a882" stroke="#3a2a1a" stroke-width=".2"/>`; }
    // the wet trail on the deck where it dragged him: a dark smear, a puddle with the moon in it
    near += `<path d="M40 128Q80 124 120 130Q150 134 176 124L178 128Q150 140 118 136Q80 132 42 134Z" fill="#0e2620" opacity=".45"/><ellipse cx="96" cy="132" rx="16" ry="2.2" fill="#6aa898" opacity=".3"/>`;
    // the barrel he knocked over, lying across the deck
    near += K.castShadow(u, L, { x: 34, y: 136, w: 26, h: 16, horizon: HZ, d: .4, opacity: .4 }) + K.barrel(u, L, { x: 34, y: 136, s: .82, lying: true, rot: -8, seed: 4 });

    // ——— the sailor, hung head down by his left ankle ———
    let man = '';
    const leg = (hip, kn, ank, sd, rimSide) => H.cloth(u, { spine: [hip, [lerp(hip[0], kn[0], .5), lerp(hip[1], kn[1], .5)], kn, [lerp(kn[0], ank[0], .5), lerp(kn[1], ank[1], .5)], ank],
      w: [9, 8.2, 7, 6.2, 5.6], tone: PANTS, lit: rimSide, rim: RIMC, rimSide, rimOp: .55, seed: sd, drapes: 2, foldW: .7, sw: .35, capA: true });
    const sleeve = (sh, el, wr, sd, rimSide) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5)], el, [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5)], wr],
      w: [5.6, 5.2, 4.6, 4, 3.4], tone: SHIRT, lit: rimSide, rim: RIMC, rimSide, rimOp: .6, seed: sd, drapes: 1, foldW: .6, sw: .3, capA: true,
      cuff: { from: .86, k: 1.1, roll: true, tone: SHIRT } });
    // the free leg (far), flailing: thigh out, the shin down, the shoe
    man += leg(J.hip2, J.kn2, J.ank2, 11, 1) + shoe(u, J.ank2, [.9, -.38], 8.4, false);
    // the far arm (his left, our right): flung down and out towards the deck
    const hR = H.hand3(u, { at: J.wrR, a: ang(J.elR, J.wrR) + 6, s: .72, m: -1, roll: 20, pose: 'open', spread: 12, tone: SKIN, light: [-.6, -.8], sw: .25, palmW: .8, fingerW: .9 });
    man += sleeve(J.shR, J.elR, J.wrR, 21, 1) + hR.back + hR.front;
    // the held leg: straight up to the coil
    man += leg(J.hip1, J.kn1, J.ank1, 13, -1) + shoe(u, J.ank1, [.99, -.12], 8.4, true);
    // the torso: a striped sailor's shirt, the sash at the waist (up, since he hangs), the shirt's hem fallen
    { const sp = [[100.4, 72.4], [100, 79], [100.6, 87], [101.6, 94.6]], sw = [11, 10, 11.2, 12.6];
      man += H.cloth(u, { spine: sp, w: sw, tone: SHIRT, lit: -1, rim: RIMC, rimSide: -1, rimOp: .65, seed: 31, drapes: 2, foldW: .7, sw: .35, capA: true, capB: true });
      const T = H.tube(sp, sw, 8), cl = nid('st', u), d = 'M' + T.outline(0, T.N, 1, true, true).map(P2).join('L') + 'Z';
      man += `<defs><clipPath id="${cl}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${cl})">`;
      for (let k = 0; k < 7; k++) { const i = Math.round((.2 + k * .11) * T.N), a = T.at(i, -1.2), b = T.at(i, 1.2), m = T.at(i + 1, 0); man += `<path d="M${P2(a)}Q${P2([m[0], m[1] + .8])} ${P2(b)}" stroke="#2a3a5c" stroke-width="1.1" fill="none" opacity=".75"/>`; }
      man += `</g>`;
      // the sash round the waist
      const s0 = T.at(2, -1.15), s1 = T.at(2, 1.15), s2 = T.at(5, 1.1), s3 = T.at(5, -1.1), sg = nid('sa', u);
      man += `<defs>${linGrad(sg, s0[0], s0[1], s1[0], s1[1], [[0, '#c03a26', 1], [.5, '#8a1c14', 1], [1, '#4a0c08', 1]])}</defs><path d="M${[s0, s1, s2, s3].map(P2).join('L')}Z" fill="url(#${sg})" stroke="#2a0604" stroke-width=".3"/>`
        + `<path d="M${P2(s1)}q3 -1 3.6 -4.6q.6 3 -1.6 5.8z" fill="#8a1c14" stroke="#2a0604" stroke-width=".25"/>`; }
    // the coil: the tip comes round his ankle twice and the thin end curls out
    man += coilBand(u, [95.6, 47.6], 4.6, 1.6, 3.6, -6, 1) + coilBand(u, [95.8, 51.6], 4.4, 1.5, 3.2, -4, 2);
    { const tip = H.tube([[91.4, 52.4], [88.6, 50.4], [87.4, 46.6], [89.2, 44.2]], [3, 2.2, 1.4, .6], 8), d = 'M' + tip.outline(0, tip.N, 1, false, true).map(P2).join('L') + 'Z';
      man += `<path d="${d}" fill="${TS.half}" stroke="${TS.outline}" stroke-width=".3"/><path d="M${tip.edge(-.8).map(P2).join('L')}" stroke="${TS.rim}" stroke-width=".35" fill="none" opacity=".7"/>`
        + [.25, .55].map(t => { const p = tip.at(Math.round(t * tip.N), .55); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".45" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".15"/>`; }).join(''); }
    // the near arm (his right, our left): reaching down for the planks
    const hL = H.hand3(u, { at: J.wrL, a: ang(J.elL, J.wrL) - 4, s: .74, m: 1, roll: 16, pose: 'open', spread: 14, tone: SKIN, light: [-.6, -.8], sw: .25, palmW: .8, fingerW: .9 });
    man += sleeve(J.shL, J.elL, J.wrL, 23, -1) + hL.back + hL.front;
    // the neck and the head, upside down: mouth open in a shout, hair hanging in its queue
    man += H.cloth(u, { spine: [[101.6, 93.6], J.neck, [102.2, 99]], w: [4.4, 4, 3.8], tone: SKIN, lit: -1, seed: 41, folds: false, sw: .3 });
    { const hd = H.head(u, { c: J.head, r: J.hr, dir: 1, tilt: 172, tone: SKIN, rim: RIMC, warm: { color: '#bfffe0', op: .25 }, eye: 'wide', brow: 'up', mouth: .7, hairColor: '#2a1a10', stubble: true });
      // the queue hanging down from the crown, tied with a ribbon
      man += `<path d="M101.6 108q-1.4 3 -.4 6.4q.6 2.4 -.6 4.4" stroke="#2a1a10" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M101.2 108.8q-1 3 0 6" stroke="#6a4a30" stroke-width=".4" fill="none" opacity=".7"/><path d="M100.4 110.4l2.4 .4l-1 1.6z" fill="#1a2a4a"/>`;
      man += hd.svg; }
    // his cap falling away under him, turning over
    man += `<g transform="translate(86 122) rotate(150)"><path d="M-4.4 1.4Q-4.6 -4 0 -4.4Q4.6 -4 4.4 1.4Z" fill="#2a3a5c" stroke="#0e1424" stroke-width=".35"/><path d="M-4.6 1.4H4.6" stroke="#c8d0d8" stroke-width="1.3"/><path d="M-3 -2Q0 -4 3 -2" stroke="#6a7a9c" stroke-width=".4" fill="none"/><circle cx="0" cy="-4.4" r="1" fill="#c03a26"/></g>`
      + `<path d="M88 116l-1 -3M84 117l-2 -2" stroke="${RIMC}" stroke-width=".3" opacity=".5"/>`;
    // drops shaken off him and the tentacle
    for (let i = 0; i < 26; i++) { const x = 80 + R() * 50, y = 40 + R() * 80, r = .2 + R() * .35; man += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 1.7)}" fill="#effff8" opacity="${f(.3 + R() * .4)}"/>`; }
    // ——— light: the moon's veil, motes, fog low over the deck; the under-glass dark ———
    let lt = K.localGlow(u, { x: 58, y: 26, color: '#e8fff4', power: .25, radius: 60 }, { core: false }) + motes(18, 10, 30, 180, 80, '#effff4', 4);
    lt += K.fog(u, L, { y: DK + 4, h: 30, density: .3, seed: 12 });
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 136, 0, 290, [[0, '#04140f', 0], [.35, '#04140f', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="136" width="220" height="154" fill="url(#${gl})"/>`; }
    return [bg, mid + near + man + lt];
  } };
