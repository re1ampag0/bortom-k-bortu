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
// Review fix (verdict b5, serious): the grip is now one continuous coil of the tentacle itself — it comes down from
// the arch and winds 1.6 turns round his shin under the knee (the boot above the coils), as thick as the tentacle is
// there, the back turns behind the leg, the tip tucked away inside the last turn, the trouser pinched between turns;
// the whole figure is built in its own frame and leaned 17° towards the tentacle's root (right); the head is ×1.25,
// on the body's axis, a short neck, a three-quarter face (head34, upside down) screaming — mouth open, eyes wide, brows
// raised — the queue short and flung sideways, a pale halo of fog behind it and the figure raised so the head is on
// the sea, not the bulwark; the near arm bent at the elbow, clawing at the rail, the far arm half bent reaching out;
// a burst of water and foam over the bulwark at the tentacle's root.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { motes } = PK;

const HZ = 82, RAIL = 104, DK = 120;               // the horizon; the rail cap; the deck at the foot of the bulwark
const light = { time: 'fog', haze: .75, key: { type: 'moon', x: 58, y: 26, el: 34, color: '#d4f4e4', power: .75 }, fill: { color: '#2f5a50', power: .45 },
  rim: { az: 300, color: '#d8fff0', power: .5 } };
// the man: hung head down by his left ankle. Built in his own frame (x right, y down from the held ankle along the
// body), then leaned PHI towards the tentacle's root and set with the held ankle at A0
const A0 = [93, 37], PHI = -17 * Math.PI / 180, cP = Math.cos(PHI), sP = Math.sin(PHI);
const Pt = (x, y) => [A0[0] + x * cP - y * sP, A0[1] + x * sP + y * cP];
const J = { ank1: Pt(0, 0), kn1: Pt(-.6, 14), hip1: Pt(-2.2, 28), hip2: Pt(2.4, 27.4), kn2: Pt(14, 21), ank2: Pt(19, 32.5),
  shL: Pt(-5.9, 48.6), elL: [88.6, 86.8], wrL: [85.6, 99.6], shR: Pt(5.9, 48.6), elR: [121.4, 90.6], wrR: [124.2, 102],
  neck: Pt(0, 50.4), head: Pt(0, 58.2), hr: 5.8 };
// the coil round the shin (in his frame): from the tentacle's arrival at the front-right, 1.6 turns down the shin
// towards the knee; z = sin θ (+ towards us); the near half of each turn rides higher (we look up at him)
const CO = { t0: Math.PI / 4, t1: 3.3 * Math.PI, rx: 4.7, ry: 1.2, y0: 3.4, pitch: 5, w0: 4.3, w1: 2.6 };
const coilAt = t => { const q = (t - CO.t0) / (CO.t1 - CO.t0); return { p: Pt(CO.rx * Math.cos(t), CO.y0 + CO.pitch * (t - CO.t0) / (2 * Math.PI) - CO.ry * Math.sin(t)), w: lerp(CO.w0, CO.w1, q), z: Math.sin(t) }; };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon in the fog upper left (key, a little behind): rims on the tentacle\'s back and on the man, his front in half light', items: [
  ['tentacle', 84, 126, 98, 98, 'out of the sea behind the bulwark (root hidden by it), arching over the deck'],
  ['sailor (head down, leaned 17° right)', 80, 108, 52, 76, 'hung by the left shin from the tentacle\'s coil, head on the sea above the rail'], ['cap', 80, 124, 10, 6, 'in the air, falling to the deck'],
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
  if (o.suckers !== false) for (let i = 1; i < i1; i += (o.step || 2)) { const q = T.S[i]; if (q.w < 1.4) continue; const a = Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI;
    for (const row of q.w > 9 ? [.6, .88] : [.74]) { const p = T.at(i + (row > .8 ? 1 : 0), row * lit), r = q.w * (row > .8 ? .11 : .16);
      s += `<g transform="translate(${P2(p)}) rotate(${f(a)})"><ellipse rx="${f(r * 1.15)}" ry="${f(r * .8)}" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".25"/><ellipse cx="${f(r * .1)}" rx="${f(r * .55)}" ry="${f(r * .36)}" fill="${TS.mouth}"/><path d="M${f(-r)} ${f(-r * .5)}q${f(r)} ${f(-r * .5)} ${f(r * 2)} 0" stroke="#f4ece0" stroke-width="${f(r * .2)}" fill="none" opacity=".6"/></g>`; } }
  return { svg: s, T };
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
    const CS = coilAt(CO.t0).p, TC = [[172, 128], [168, 102], [162, 74], [151, 47], [134, 29], [117, 23.5], [106.5, 29], [CS[0] + 4.2, CS[1] - 1.6], CS], TW = [27, 25, 20.5, 15.5, 10.5, 7, 5.2, 4.5, CO.w0];
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
    // the sea bursting over the bulwark at the root: a burst of water on each side of it, foam slopping over the rail cap
    near += K.splash(u, { x: 149, y: RAIL + 1, w: 16, h: 17, seed: 2, L, wind: -.4 }) + K.splash(u, { x: 191, y: RAIL + 1, w: 14, h: 14, seed: 5, L, wind: .3 });
    near += K.foam(u, { x: 170, y: RAIL - .4, w: 54, h: 2.4, seed: 4, L }) + K.foam(u, { x: 146, y: RAIL + .2, w: 16, h: 1.6, seed: 8, L });
    for (const [x, sd] of [[146, 31], [156, 32], [186, 33], [194, 34]]) { const Rr = rng(sd), l = 5 + Rr() * 6;
      near += `<path d="M${f(x)} ${f(RAIL + .4)}q${f(-.6 + Rr())} ${f(l * .5)} ${f(-.2 + Rr() * .6)} ${f(l)}" stroke="#e8fff6" stroke-width="${f(.6 + Rr() * .6)}" fill="none" opacity="${f(.35 + Rr() * .2)}" stroke-linecap="round"/>`; }
    for (let i = 0; i < 26; i++) { const x = 142 + R() * 56, y = RAIL - 2 - R() * 20, r = .25 + R() * .45; near += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 1.6)}" fill="#effff8" opacity="${f(.35 + R() * .4)}"/>`; }

    // ——— the sailor, hung head down by his left shin, leaned towards the root ———
    let man = '';
    // a pale halo of fog behind his head, so it stands off the sea and the rail
    man += K.localGlow(u, { x: J.head[0], y: J.head[1], color: '#cfffe8', power: .4, radius: 14 }, { core: false });
    const leg = (hip, kn, ank, sd, rimSide) => H.cloth(u, { spine: [hip, [lerp(hip[0], kn[0], .5), lerp(hip[1], kn[1], .5)], kn, [lerp(kn[0], ank[0], .5), lerp(kn[1], ank[1], .5)], ank],
      w: [9, 8.2, 7, 6.2, 5.6], tone: PANTS, lit: rimSide, rim: RIMC, rimSide, rimOp: .55, seed: sd, drapes: 2, foldW: .7, sw: .35, capA: true });
    const sleeve = (sh, el, wr, sd, rimSide) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5)], el, [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5)], wr],
      w: [5.8, 5.3, 4.8, 4.1, 3.5], tone: SHIRT, lit: rimSide, rim: RIMC, rimSide, rimOp: .6, seed: sd, drapes: 1, foldW: .6, sw: .3, capA: true,
      cuff: { from: .86, k: 1.1, roll: true, tone: SHIRT } });
    // the free leg (far), flailing: thigh up and out, the shin down, the shoe
    man += leg(J.hip2, J.kn2, J.ank2, 11, 1) + shoe(u, J.ank2, [.82, -.53], 8.6, false);
    // the far arm (his left, our right): half bent, reaching out towards the rail, fingers spread and hooked
    const hR = H.hand3(u, { at: J.wrR, a: ang(J.elR, J.wrR) + 4, s: .78, m: -1, roll: 20, pose: 'open', spread: 12, flex: [[14, 26, 18], [16, 28, 20], [18, 30, 22], [20, 32, 24]], tone: SKIN, light: [-.6, -.8], sw: .25, palmW: .8, fingerW: .9 });
    man += sleeve(J.shR, J.elR, J.wrR, 21, 1) + hR.back + hR.front;
    // the coil's back turns: behind the shin (seen only where they come round its sides), the suckers on their inner face
    const coilSeg = (ta, tb, front, pre) => { const C = [], W = []; if (pre) { C.push(pre[0]); W.push(pre[1]); }
      for (let k = 0; k <= 10; k++) { const c = coilAt(lerp(ta, tb, k / 10)); C.push(c.p); W.push(c.w); } return { C, W }; };
    for (const [ta, tb] of [[Math.PI, 2 * Math.PI], [3 * Math.PI, CO.t1]]) { const g = coilSeg(ta, tb), T = H.tube(g.C, g.W, 4), d = 'M' + T.outline(0, T.N, 1, false, tb === CO.t1).map(P2).join('L') + 'Z';
      man += `<path d="${d}" fill="${mix(TS.shadow, TS.half, .6)}" stroke="${TS.outline}" stroke-width=".35"/><path d="M${T.edge(-.6).map(P2).join('L')}" stroke="${TS.half}" stroke-width=".8" fill="none" opacity=".6"/>`;
      for (let i = 1; i < T.N; i += 3) { const p = T.at(i, .1), r = T.S[i].w * .17; man += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r)}" ry="${f(r * .7)}" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".15" opacity=".8"/>`; } }
    // the held leg: straight up to the coil, the boot above it, sole to the sky
    man += leg(J.hip1, J.kn1, J.ank1, 13, -1) + shoe(u, J.ank1, [-.956, .292], 8.8, true);
    // the torso: a striped sailor's shirt, the sash at the waist (up, since he hangs), the shirt's hem fallen
    { const sp = [Pt(0, 26), Pt(-.3, 33), Pt(.1, 41), Pt(0, 48.6)], sw = [11, 10, 11.2, 12.6];
      man += H.cloth(u, { spine: sp, w: sw, tone: SHIRT, lit: -1, rim: RIMC, rimSide: -1, rimOp: .65, seed: 31, drapes: 2, foldW: .7, sw: .35, capA: true, capB: true });
      const T = H.tube(sp, sw, 8), cl = nid('st', u), d = 'M' + T.outline(0, T.N, 1, true, true).map(P2).join('L') + 'Z';
      man += `<defs><clipPath id="${cl}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${cl})">`;
      for (let k = 0; k < 7; k++) { const i = Math.round((.2 + k * .11) * T.N), a = T.at(i, -1.2), b = T.at(i, 1.2), m = T.at(i + 1, 0); man += `<path d="M${P2(a)}Q${P2([m[0], m[1] + .8])} ${P2(b)}" stroke="#2a3a5c" stroke-width="1.1" fill="none" opacity=".75"/>`; }
      man += `</g>`;
      // the sash round the waist
      const s0 = T.at(2, -1.15), s1 = T.at(2, 1.15), s2 = T.at(5, 1.1), s3 = T.at(5, -1.1), sg = nid('sa', u);
      man += `<defs>${linGrad(sg, s0[0], s0[1], s1[0], s1[1], [[0, '#c03a26', 1], [.5, '#8a1c14', 1], [1, '#4a0c08', 1]])}</defs><path d="M${[s0, s1, s2, s3].map(P2).join('L')}Z" fill="url(#${sg})" stroke="#2a0604" stroke-width=".3"/>`
        + `<path d="M${P2(s1)}q3 -1 3.6 -4.6q.6 3 -1.6 5.8z" fill="#8a1c14" stroke="#2a0604" stroke-width=".25"/>`; }
    // the coil's front turns: the tentacle itself, as thick as it is here, over the shin; the trouser pinched between
    { const pre = [[TC[TC.length - 2][0], TC[TC.length - 2][1]], TW[TW.length - 2]];
      for (const [ta, tb, first] of [[CO.t0, Math.PI, true], [2 * Math.PI, 3 * Math.PI, false]]) { const g = coilSeg(ta - (first ? 0 : .12), tb + .12, true, first ? pre : null);
        // the cloth bunched against the turn: a dark crease above and below it on the trouser
        const T = H.tube(g.C, g.W, 4);
        for (const sd of [-1.25, 1.3]) man += `<path d="M${T.edge(sd, first ? 4 : 1, T.N - 1).map(P2).join('L')}" stroke="${PANTS.shadow}" stroke-width=".7" fill="none" opacity=".8" stroke-linecap="round"/>`;
        man += tentacle(u, g.C, g.W, { lit: -1, seed: 7 + ta, suckers: false }).svg;
        // a sucker or two pressed flat to the cloth, peeping out under the turn's lower edge
        for (const t of [.35, .7]) { const i = Math.round(t * T.N), p = T.at(i, -.92), r = T.S[i].w * .16; man += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r * 1.2)}" ry="${f(r * .55)}" fill="${TS.sucker}" stroke="${TS.outline}" stroke-width=".15" opacity=".85"/>`; } } }
    // the near arm (his right, our left): bent at the elbow, the hand clawing at the rail cap
    const hL = H.hand3(u, { at: J.wrL, a: ang(J.elL, J.wrL) - 8, s: .88, m: 1, roll: 18, pose: 'open', spread: 16, flex: [[30, 58, 42], [34, 62, 46], [36, 62, 46], [40, 64, 48]], thumbFlex: [10, 26, 22], tone: SKIN, light: [-.6, -.8], sw: .25, palmW: .8, fingerW: .9 });
    man += sleeve(J.shL, J.elL, J.wrL, 23, -1) + hL.back + hL.front;
    // the neck (short) and the head, upside down on the body's axis, three-quarter face: a scream
    { const nk = [Pt(0, 47.2), Pt(0, 50.4), Pt(0, 53.2)]; man += H.cloth(u, { spine: nk, w: [5.4, 5, 4.8], tone: SKIN, lit: -1, seed: 41, folds: false, sw: .3 }); }
    { const rho = 180 + PHI * 180 / Math.PI, rr = -rho * Math.PI / 180, Lp = [-.5, -.86], lt = [Lp[0] * Math.cos(rr) - Lp[1] * Math.sin(rr), Lp[0] * Math.sin(rr) + Lp[1] * Math.cos(rr)];
      const hd = H.head34(u, { c: J.head, r: J.hr, turn: .3, dir: -1, tone: SKIN, light: lt, warm: { color: '#bfffe0', op: .25 }, eye: 'wide', eyeW: 1.25, eyeH: 1.7, browW: 1.3, brow: 'up', mouth: 1, hairColor: '#2a1a10', hair: { style: 'short', color: '#2a1a10' }, stubble: true });
      // the queue: short, flung out sideways and down from the back of his head, tied with a ribbon
      const rot = p => { const a = rho * Math.PI / 180, dx = p[0] - J.head[0], dy = p[1] - J.head[1]; return [J.head[0] + dx * Math.cos(a) - dy * Math.sin(a), J.head[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
      const q0 = rot(hd.Q(.35, -.55, -.8));
      man += `<path d="M${f(q0[0] + .6)} ${f(q0[1] - .9)}Q${f(q0[0] - 2.4)} ${f(q0[1] - .6)} ${f(q0[0] - 4.6)} ${f(q0[1] + .6)}Q${f(q0[0] - 2.4)} ${f(q0[1] + .6)} ${f(q0[0] + .2)} ${f(q0[1] + .9)}Z" fill="#2a1a10" stroke="#120804" stroke-width=".25"/>`
        + `<path d="M${f(q0[0] - .3)} ${f(q0[1] - .3)}q-2 0 -3.6 .9" stroke="#6a4a30" stroke-width=".3" fill="none" opacity=".7"/><path d="M${f(q0[0] - .7)} ${f(q0[1] - 1.3)}l.5 2.4l-1.4 -.3z" fill="#1a2a4a"/>`;
      // the scream: the jaw dropped — a dark open mouth with the upper teeth, drawn in the head's own frame over head34's lips
      const mo = [[-.22, .6, .82], [-.1, .56, .95], [.1, .56, .95], [.22, .6, .82], [.18, .8, .84], [0, .86, .92], [-.18, .8, .84]].map(q => hd.Q(...q));
      const scream = `<path d="${H.sp(mo, true)}" fill="#2a0a0c" stroke="#5a2420" stroke-width=".3"/><path d="${H.sp([hd.Q(-.15, .6, .92), hd.Q(0, .595, .96), hd.Q(.15, .6, .92)])}" stroke="#efe4d8" stroke-width=".55" fill="none"/>`
        + `<ellipse cx="${f(hd.Q(0, .78, .9)[0])}" cy="${f(hd.Q(0, .78, .9)[1])}" rx="${f(J.hr * .1)}" ry="${f(J.hr * .05)}" fill="#8a3a3a" opacity=".8"/>`;
      man += `<g transform="rotate(${f(rho)} ${P2(J.head)})">${hd.svg}${scream}${rimArc(hd, { r: J.hr, light: lt, color: RIMC, span: 50, opacity: .55 })}</g>`; }
    // his cap falling away under him, turning over
    man += `<g transform="translate(104 117) rotate(150)"><path d="M-4.4 1.4Q-4.6 -4 0 -4.4Q4.6 -4 4.4 1.4Z" fill="#2a3a5c" stroke="#0e1424" stroke-width=".35"/><path d="M-4.6 1.4H4.6" stroke="#c8d0d8" stroke-width="1.3"/><path d="M-3 -2Q0 -4 3 -2" stroke="#6a7a9c" stroke-width=".4" fill="none"/><circle cx="0" cy="-4.4" r="1" fill="#c03a26"/></g>`
      + `<path d="M106 111l-1 -3M102 112l-2 -2" stroke="${RIMC}" stroke-width=".3" opacity=".5"/>`;
    // drops shaken off him and the tentacle
    for (let i = 0; i < 26; i++) { const x = 80 + R() * 50, y = 40 + R() * 80, r = .2 + R() * .35; man += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 1.7)}" fill="#effff8" opacity="${f(.3 + R() * .4)}"/>`; }
    // ——— light: the moon's veil, motes, fog low over the deck; the under-glass dark ———
    let lt = K.localGlow(u, { x: 58, y: 26, color: '#e8fff4', power: .25, radius: 60 }, { core: false }) + motes(18, 10, 30, 180, 80, '#effff4', 4);
    lt += K.fog(u, L, { y: DK + 4, h: 30, density: .3, seed: 12 });
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 136, 0, 290, [[0, '#04140f', 0], [.35, '#04140f', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="136" width="220" height="154" fill="url(#${gl})"/>`; }
    return [bg, mid + near + man + lt];
  } };
