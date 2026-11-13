// «Абордаж рыболюдей» (Летучий голландец, ПРИКАЗ: только по кораблю напротив — 2 урона по Команде; это не Залп),
// method A — a detailed copy of the first-round scene (portrait-dutch.cjs SCENES['Абордаж рыболюдей']): night on the
// enemy's deck in the green fog, a lantern on the left; the Dutchman's crew comes up out of the sea and over the rail.
// Kept: the idea (they come from the water, not by jumping from a ship), the lantern, the fishman with a weapon, the
// one climbing over the rail dripping water, the Dutchman behind in the fog, the dropped sailor's cap on the deck.
// Fixed against the first round: two small puppet fishmen with stick pikes — now one big whole figure climbing over
// our rail at us: a fish head of his own design (a wide toothy jaw, a bulging eye, gill frills, a spiny crest, a
// barnacle crust), a rotten coat over a pale scaled belly, a scallop shell on one shoulder; his right arm a crab claw
// that crushes the rail cap (splinters at the bite), his left fist (people.cjs hand3) round a rusty cutlass held up;
// water pours off him down the inside of the bulwark onto the deck. Behind him, out in the sea, more fish heads break
// the water and a claw comes over the rail on the far right; the Dutchman is a ghost in the fog on the horizon.
// Light: a bright patch of fog behind him (key, contre-jour: green rims on the crest, the shoulders, the blade) and
// the enemy's lantern on the left (warm, on his face, the claw and the rail).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 100, RAIL = 112, FOOT = 148;            // the horizon; the top of our rail; the deck at the foot of the bulwark
const HC = [98, 48];                                // the fish head's centre
const LAMP = { x: 28, y: 88, s: 1.05, hang: 16 };   // the enemy's lantern, hanging on the left
const LL = K.lantern.local(LAMP);
const light = { time: 'fog', haze: .75, key: { type: 'moon', x: 112, y: 18, el: 30, color: '#cfeee0', power: .6 },
  fill: { color: '#24443c', power: .45 }, rim: { az: 20, color: '#bff8e0', power: .7 },
  locals: [{ x: LL.x, y: LL.y, color: '#ffb860', power: .85, radius: 90 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'a bright patch of fog behind him, upper middle (key, contre-jour, green rims) + the lantern on the left (warm)', items: [
  ['sea', -10, RAIL, 220, RAIL - HZ, 'beyond the rail'], ['Dutchman', 150, HZ + 1, 50, 50, 'water, far, in the fog'],
  ['fish heads', 10, 112, 60, 8, 'in the water beyond the rail'], ['fishman', 52, RAIL, 120, 92, 'climbs over our rail from the sea (hips behind the bulwark)'],
  ['claw', 18, 124, 52, 30, 'clamped on the rail cap'], ['cutlass', 124, 88, 22, 70, 'in his left fist'],
  ['lantern', 16, LAMP.y, 24, 46, 'hangs on its line from above'], ['bulwark', -10, FOOT, 220, FOOT - RAIL, 'deck'],
  ['cap', 120, 200, 30, 14, 'deck'], ['puddle', 40, 196, 120, 30, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const SKIN = { lit: '#b4b88a', half: '#62785a', core: '#4c6048', shadow: '#22342a', outline: '#08120c' };   // grey-green, wet
const COAT = { lit: '#55604a', half: '#2c3628', shadow: '#121a12', outline: '#040804' };
const SHELL = { lit: '#e4a070', half: '#a8502c', shadow: '#4a1c0e', outline: '#1e0804' };                  // the claw: rusty crab red
const RIMC = '#bff8e0', WARM = '#ffb860';

// a hand round a cylinder whose axis must run at t degrees (from na-abordazh.cjs)
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// KIT-CANDIDATE: a barnacle cluster — cones with dark mouths, lit towards `lx` (−1 left, +1 right), each with its shadow
function barnacles(u, x, y, n, s, seed, lx = -1) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, bx + lx * r, 0, bx - lx * r, 0, [[0, '#d8d4bc', 1], [.5, '#8a907a', 1], [1, '#30382c', 1]])}</defs>`
      + `<ellipse cx="${f(bx - lx * r * .4)}" cy="${f(by + r * .5)}" rx="${f(r * 1.2)}" ry="${f(r * .6)}" fill="#050c0a" opacity=".45"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#2a2c22" stroke-width=".25"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#141610"/>`; }
  return out;
}
// KIT-CANDIDATE: weed hanging in strands from (x, y)
function weed(x, y, len, n, seed, col = '#3e7a5a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.6 + R() * .7)}" fill="none" stroke-linecap="round" opacity=".85"/>`
      + `<path d="M${f(x0 + .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#9ad8b0" stroke-width=".25" fill="none" opacity=".45"/>`; }
  return out;
}
// water running off an edge: a thin sheet with a lit line, ending in a drop
function runs(pts, w, op = .7) {
  const d = H.sp(pts);
  return `<path d="${d}" stroke="#7ab8a8" stroke-width="${f(w)}" fill="none" stroke-linecap="round" opacity="${f(op * .45)}"/><path d="${d}" stroke="#e8fff4" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" opacity="${f(op)}"/>`
    + `<ellipse cx="${f(pts[pts.length - 1][0])}" cy="${f(pts[pts.length - 1][1] + w * .9)}" rx="${f(w * .55)}" ry="${f(w * .8)}" fill="#e8fff4" opacity="${f(op * .9)}"/>`;
}
// a scaled patch: rows of small arcs clipped to a path
function scales(u, d, x0, y0, x1, y1, r, col, op, seed) {
  const id = nid('sc', u), R = rng(seed); let s = `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">`;
  for (let y = y0, row = 0; y < y1; y += r * .9, row++) for (let x = x0 + (row % 2) * r; x < x1; x += r * 2) {
    const j = (R() - .5) * r * .3; s += `<path d="M${f(x - r + j)} ${f(y)}Q${f(x + j)} ${f(y + r * 1.1)} ${f(x + r + j)} ${f(y)}" stroke="${col}" stroke-width="${f(r * .22)}" fill="none" opacity="${f(op * (.6 + R() * .4))}"/>`; }
  return s + '</g>';
}

// ——— the fish head: drawn in head units (1 = 1 picture unit at scale 1) about HC, facing 3/4 to our left ———
function fishHead(u, L) {
  const [cx, cy] = HC, S = 1.0, T = (x, y) => [cx + x * S, cy + y * S], TP = pts => pts.map(p => T(p[0], p[1]));
  let s = '';
  // the skull: a heavy wedge, the snout to the left, the gill cover behind, the neck going down into the collar
  const skull = TP([[-25, 2], [-24, -5], [-19, -12], [-10, -18], [0, -21], [10, -19], [18, -13], [22, -4], [23, 6], [21, 16], [16, 26], [6, 30], [-6, 28]]);
  const jaw = TP([[-6, 10], [-12, 15], [-18, 19.5], [-23.5, 22.5], [-24.5, 24.5], [-20, 26.5], [-10, 28], [0, 29], [8, 28]]);
  const g = nid('fh', u), gj = nid('fj', u), ge = nid('fe', u);
  s += `<defs>${linGrad(g, cx - 26, cy - 10, cx + 22, cy + 8, [[0, '#c8c08a', 1], [.25, SKIN.lit, 1], [.55, SKIN.half, 1], [.85, SKIN.shadow, 1], [1, '#16241e', 1]])}`
    + `${linGrad(gj, cx - 24, cy + 18, cx + 6, cy + 30, [[0, '#d8d0a4', 1], [.5, '#a0a07a', 1], [1, '#3a4836', 1]])}</defs>`;
  // the dorsal crest behind the skull: spines with a torn membrane between them, lit green on the back edge
  { const base = [[-14, -16], [-8, -19.5], [-2, -21], [4, -20.6], [10, -18.6], [15, -15.6], [19, -11.6], [22, -6], [23.4, 0]],
      len = [7, 11, 14, 15, 14, 12, 10, 8, 6], ang = [-118, -108, -98, -88, -76, -64, -50, -36, -22];
    const tips = base.map((b, i) => [b[0] + Math.cos(ang[i] * Math.PI / 180) * len[i], b[1] + Math.sin(ang[i] * Math.PI / 180) * len[i]]);
    let mem = 'M' + P2(T(...base[0]));
    tips.forEach((t, i) => { mem += 'L' + P2(T(...t)); if (i < tips.length - 1) { const m = [(t[0] + tips[i + 1][0]) / 2, (t[1] + tips[i + 1][1]) / 2], b = [(base[i][0] + base[i + 1][0]) / 2, (base[i][1] + base[i + 1][1]) / 2]; mem += 'L' + P2(T(lerp(b[0], m[0], .55 + (i % 2) * .15), lerp(b[1], m[1], .55 + (i % 2) * .15))); } });
    mem += 'L' + P2(T(...base[base.length - 1])) + 'Z';
    const gm = nid('fm', u);
    s += `<defs>${linGrad(gm, cx - 10, cy - 36, cx + 20, cy - 10, [[0, '#6a3a2a', .9], [.6, '#3a2a22', .9], [1, '#1a1a16', .9]])}</defs><path d="${mem}" fill="url(#${gm})" stroke="#0a0806" stroke-width=".4" stroke-linejoin="round"/>`;
    tips.forEach((t, i) => { const b = T(...base[i]), q = T(...t); s += `<path d="M${P2(b)}L${P2(q)}" stroke="#d8c8a0" stroke-width="${f(1.1 - i * .05)}" stroke-linecap="round"/><path d="M${P2(b)}L${P2(q)}" stroke="#3a2a1a" stroke-width=".35" transform="translate(.5 .3)"/>`; });
    // the green rim on the back edge of each lit spine (along the spine itself, not a line floating beside the tips)
    tips.forEach((t, i) => { if (i < 3) return; const b = base[i], d = unit([t[0] - b[0], t[1] - b[1]]), o = [-d[1] * .5, d[0] * .5];
      s += `<path d="M${P2(T(b[0] + o[0] + d[0] * 2, b[1] + o[1] + d[1] * 2))}L${P2(T(t[0] + o[0] * .4, t[1] + o[1] * .4))}" stroke="${RIMC}" stroke-width=".45" stroke-linecap="round" opacity=".7"/>`; }); }
  // the gape: dark mouth between the jaws, needle teeth on both
  const mouth = TP([[-25.5, 3.4], [-16, 6.6], [-6, 9], [-12, 14.6], [-18, 19], [-23.4, 21.6], [-25.6, 14]]);
  s += `<path d="M${mouth.map(P2).join('L')}Z" fill="#1a0806"/>`;
  { const ig = nid('fi', u); const c = T(-17, 13); s += `<defs>${radGrad(ig, c[0], c[1], 9, [[0, '#7a2a24', 1], [.6, '#3a0e0c', 1], [1, '#120404', 1]])}</defs><path d="M${TP([[-22, 8], [-12, 10.4], [-16, 16.4], [-22, 18.6]]).map(P2).join('L')}Z" fill="url(#${ig})"/>`; }
  // the lower jaw dropped open, its throat pale; barbels under the chin
  s += `<path d="${H.sp(jaw.concat(TP([[12, 22], [4, 16]])), true)}" fill="url(#${gj})" stroke="${SKIN.outline}" stroke-width=".5"/>`;
  // the skull over it
  s += `<path d="${H.sp(skull, true)}" fill="url(#${g})" stroke="${SKIN.outline}" stroke-width=".55"/>`;
  // teeth: upper row hanging from the upper jaw, lower row standing on the lower jaw (thin, curved, pale)
  for (let i = 0; i < 9; i++) { const t = i / 8, a = [lerp(-24.6, -7.5, t), lerp(3.8, 8.8, t)], l = 3.4 - Math.abs(t - .3) * 2.4;
    const p = T(a[0], a[1]), q = T(a[0] - .6, a[1] + l); s += `<path d="M${P2([p[0] - .55, p[1]])}Q${P2([q[0] + .4, (p[1] + q[1]) / 2])} ${P2(q)}Q${P2([q[0] + .7, (p[1] + q[1]) / 2])} ${P2([p[0] + .55, p[1]])}Z" fill="#ece4cc" stroke="#4a3a2a" stroke-width=".2"/>`; }
  for (let i = 0; i < 8; i++) { const t = i / 7, a = [lerp(-23.6, -9, t), lerp(21.4, 13.4, t)], l = 3 - Math.abs(t - .25) * 2;
    const p = T(a[0], a[1]), q = T(a[0] - 1, a[1] - l); s += `<path d="M${P2([p[0] - .5, p[1]])}Q${P2([q[0] + .3, (p[1] + q[1]) / 2])} ${P2(q)}Q${P2([q[0] + .7, (p[1] + q[1]) / 2])} ${P2([p[0] + .5, p[1]])}Z" fill="#ded6bc" stroke="#4a3a2a" stroke-width=".2"/>`; }
  // the lips: a thick rubbery rim along both jaws, lit by the lantern
  s += `<path d="${H.sp(TP([[-25.6, 3], [-16, 6.2], [-6, 8.6]]))}" stroke="#8a8a62" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="${H.sp(TP([[-25.4, 2.4], [-16, 5.6], [-8, 7.8]]))}" stroke="#f0e0b0" stroke-width=".45" fill="none" opacity=".75"/>`
    + `<path d="${H.sp(TP([[-24.6, 22.6], [-18, 19.6], [-11, 15], [-6.4, 10]]))}" stroke="#9a9468" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  s += [[-20, 26.4, -2, 8], [-14, 27.6, 1, 10], [-8, 28.4, 2, 7]].map(([x, y, dx, l]) => { const a = T(x, y), b = T(x + dx, y + l); return `<path d="M${P2(a)}Q${P2([a[0] - 1.4, (a[1] + b[1]) / 2])} ${P2(b)}" stroke="#4a5a40" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M${P2(a)}Q${P2([a[0] - 1.4, (a[1] + b[1]) / 2])} ${P2(b)}" stroke="#c8c89a" stroke-width=".3" fill="none" opacity=".7"/>`; }).join('');
  // the gill cover: a curved plate edge, the red frills under it, slits behind
  s += `<path d="${H.sp(TP([[4, -14], [9, -4], [10, 6], [7, 16], [2, 24]]))}" stroke="${SKIN.outline}" stroke-width=".9" fill="none"/><path d="${H.sp(TP([[3.4, -13.4], [8.4, -4], [9.4, 6], [6.4, 16]]))}" stroke="#d8d8a8" stroke-width=".4" fill="none" opacity=".55"/>`;
  { const R = rng(7); let fr = ''; for (let i = 0; i < 9; i++) { const t = i / 8, a = T(lerp(9.8, 7.4, t) + .4, lerp(-3, 15, t)), l = 1.6 + R() * 1.4;
      fr += `<path d="M${P2(a)}q${f(l * .8)} ${f(l * .1)} ${f(l)} ${f(l * .5)}" stroke="${i % 2 ? '#4a1612' : '#6a2620'}" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".85"/>`; }
    s += fr; }
  s += [[13, -6, 15, 12], [16.5, -4, 18, 10]].map(([x0, y0, x1, y1]) => `<path d="M${P2(T(x0, y0))}Q${P2(T(x0 + 3, (y0 + y1) / 2))} ${P2(T(x1, y1))}" stroke="#0a120c" stroke-width=".9" fill="none"/><path d="M${P2(T(x0 - .7, y0))}Q${P2(T(x0 + 2.3, (y0 + y1) / 2))} ${P2(T(x1 - .7, y1))}" stroke="#7a9a80" stroke-width=".35" fill="none" opacity=".5"/>`).join('');
  // scales over the cheek and the back of the head, a lateral line
  s += scales(u, H.sp(skull, true), cx - 2, cy - 18, cx + 24, cy + 30, 1.7, '#0e1a12', .55, 3);
  s += `<path d="${H.sp(TP([[-6, -8], [6, -9], [16, -6], [22, -2]]))}" stroke="#d8d8b0" stroke-width=".4" fill="none" stroke-dasharray="1 1.2" opacity=".5"/>`;
  // the far eye, a bump over the snout; the near eye: big, bulging, a glowing yellow-green iris, a slit pupil
  { const fe = T(-19, -10.5); s += `<ellipse cx="${f(fe[0])}" cy="${f(fe[1])}" rx="2.6" ry="2" fill="#4a5a40" stroke="${SKIN.outline}" stroke-width=".4"/><path d="M${f(fe[0] - 2)} ${f(fe[1] + .2)}q2 -1.4 4 0" stroke="#d8f070" stroke-width=".7" fill="none" opacity=".8"/>`; }
  { const e = T(-8, -6.5), er = 5.4 * S;
    s += `<ellipse cx="${f(e[0] + .6)}" cy="${f(e[1] + .8)}" rx="${f(er + 1.6)}" ry="${f(er + 1.3)}" fill="#2a3a2a" stroke="${SKIN.outline}" stroke-width=".5"/>`
      + `<defs>${radGrad(ge, e[0] - 1, e[1] - 1, er, [[0, '#fbff9a', 1], [.45, '#c8e040', 1], [.85, '#5a7a18', 1], [1, '#1a2a08', 1]])}</defs><circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(er)}" fill="url(#${ge})" stroke="#0a0e04" stroke-width=".5"/>`
      + `<ellipse cx="${f(e[0] - .6)}" cy="${f(e[1] + .2)}" rx="${f(er * .22)}" ry="${f(er * .78)}" fill="#050604"/><circle cx="${f(e[0] - 2.2)}" cy="${f(e[1] - 2.2)}" r="1.1" fill="#ffffff" opacity=".9"/>`
      + `<path d="M${f(e[0] - er - 1.4)} ${f(e[1] - 1)}Q${f(e[0])} ${f(e[1] - er - 3.6)} ${f(e[0] + er + 1.8)} ${f(e[1] - .4)}" stroke="${SKIN.outline}" stroke-width="1.2" fill="none"/>`
      + `<path d="M${f(e[0] - er - 1)} ${f(e[1] - 1.8)}Q${f(e[0])} ${f(e[1] - er - 3.8)} ${f(e[0] + er)} ${f(e[1] - 2.4)}" stroke="#e8e0b0" stroke-width=".45" fill="none" opacity=".7"/>`
      + glow(u, e[0], e[1], 9, 8, '#e8ff80', .35); }
  // nostril pits on the snout, a scar
  s += [[-21, -3.4], [-18.6, -4.4]].map(([x, y]) => { const p = T(x, y); return `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx=".8" ry=".5" fill="#0a120c"/>`; }).join('');
  // the soft modelling over the skull: lit from the lantern on the left, dark to the right, the green rim on top
  { const mg = nid('mo', u), c = T(-12, -4); s += `<defs>${radGrad(mg, c[0], c[1], 34, [[0, '#ffe0a0', .28], [.45, '#ffe0a0', 0], [1, '#000', .35]])}</defs><path d="${H.sp(skull, true)}" fill="url(#${mg})"/>`;
    s += `<path d="${H.sp(TP([[10, -19], [18, -13], [22, -4], [23, 6], [21, 16]]))}" stroke="${RIMC}" stroke-width=".9" fill="none" opacity=".7"/>`; }
  // a crust of barnacles on the cheek, barnacles at the crest's root, weed from the jaw
  s += barnacles(u, T(4, 10)[0], T(4, 10)[1], 6, 1.1, 11) + barnacles(u, T(14, 2)[0], T(14, 2)[1], 3, .9, 12) + barnacles(u, T(-2, -15)[0], T(-2, -15)[1], 3, .8, 13);
  s += barnacles(u, T(16, -10)[0], T(16, -10)[1], 3, .8, 14, -1);
  s += weed(T(4, 27)[0], T(4, 27)[1], 8, 2, 21, '#1e4a34');
  // drops falling from the jaw
  s += [[-24, 26, 6], [-12, 29, 9]].map(([x, y, l]) => runs([T(x, y), T(x - .4, y + l * .5), T(x - .2, y + l)], .9, .75)).join('');
  return s;
}

// ——— the crab claw: the carpus (a spined shell segment from the elbow to the wrist), the palm, and the open pincer
// clamped on the rail cap — the movable finger over the cap, the fixed one under its lip; teeth on the inner edges,
// black tips biting into the wood. ang — the claw's axis (degrees), from the wrist to the tips ———
function claw(u, L, el, wr, ang) {
  const d = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)], n = [-d[1], d[0]];
  const P = (t, o) => [wr[0] + d[0] * t + n[0] * o, wr[1] + d[1] * t + n[1] * o], PP = a => a.map(q => P(q[0], q[1]));
  const lit = (pts, a, b) => { const g = nid('cg', u), A = P(...a), B = P(...b); return [`<defs>${linGrad(g, A[0], A[1], B[0], B[1], [[0, SHELL.lit, 1], [.45, SHELL.half, 1], [1, SHELL.shadow, 1]])}</defs>`, g]; };
  let s = '';
  // the carpus: a tapered shell tube with ridges and two spines
  { const e = unit([wr[0] - el[0], wr[1] - el[1]]), m = [-e[1], e[0]], Q = (t, o) => [el[0] + e[0] * t + m[0] * o, el[1] + e[1] * t + m[1] * o], len = Math.hypot(wr[0] - el[0], wr[1] - el[1]);
    const body = [Q(-2, -6.4), Q(len * .5, -6.8), Q(len + 1, -5.4), Q(len + 1, 5.4), Q(len * .5, 6.6), Q(-2, 6.2)], g = nid('cc', u), A = Q(len / 2, 7), B = Q(len / 2, -7);
    s += `<defs>${linGrad(g, A[0], A[1], B[0], B[1], [[0, SHELL.lit, 1], [.5, SHELL.half, 1], [1, SHELL.shadow, 1]])}</defs><path d="${H.sp(body, true)}" fill="url(#${g})" stroke="${SHELL.outline}" stroke-width=".55"/>`;
    for (const t of [len * .3, len * .62]) s += `<path d="M${P2(Q(t, -6.6))}Q${P2(Q(t + 2, 0))} ${P2(Q(t, 6.6))}" stroke="${SHELL.shadow}" stroke-width=".7" fill="none" opacity=".75"/>`;
    for (const t of [len * .2, len * .5, len * .8]) { const b0 = Q(t, 6.4), tip = Q(t + 2.4, 9.6); s += `<path d="M${P2(Q(t - 1.2, 6.2))}L${P2(tip)}L${P2(Q(t + 1.2, 6.4))}Z" fill="${SHELL.lit}" stroke="${SHELL.outline}" stroke-width=".3"/>`; } }
  // the fixed finger (below) and the movable finger (above): long, curved inwards, teeth on the inner edges
  const fixed = [[18, 4], [26, 7.4], [34, 8], [40, 6.6], [44.6, 3.4], [45.4, 1.6], [42, 2.8], [36, 3.6], [28, 3], [20, 1]];
  const dact = [[16, -5], [24, -9.4], [33, -10.4], [40, -8.4], [45, -4.4], [46.4, -1.8], [43, -3], [36, -4.6], [28, -4.4], [20, -2]];
  for (const [pts, side] of [[fixed, 1], [dact, -1]]) {
    const [defs, g] = lit(pts, [30, side * 10], [30, -side * 1]); s += defs + `<path d="${H.sp(PP(pts), true)}" fill="url(#${g})" stroke="${SHELL.outline}" stroke-width=".55"/>`;
    s += `<path d="M${P2(P(...pts[4]))}L${P2(P(...pts[5]))}L${P2(P(...pts[6]))}Z" fill="#160a08"/><path d="${H.sp(PP([pts[3], pts[4], pts[5]]))}" stroke="#2a1410" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    // teeth: small blunt cones along the inner edge, pointing into the gap
    for (let k = 0; k < 6; k++) { const t = 22 + k * 3.6, o = side > 0 ? lerp(1.4, 3.2, k / 5) : lerp(-2.4, -4.2, k / 5); s += `<path d="M${P2(P(t - 1, o))}L${P2(P(t, o - side * 1.6))}L${P2(P(t + 1, o))}Z" fill="#f2e2c4" stroke="${SHELL.outline}" stroke-width=".22"/>`; }
    // the light along the finger's outer edge
    s += `<path d="${H.sp(PP(pts.slice(0, 4).map(q => [q[0], q[1] - side * .7])))}" stroke="${side < 0 ? '#ffe6c0' : SHELL.shadow}" stroke-width=".7" fill="none" opacity=".6"/>`; }
  // the palm: a long swollen plate, ridged, tubercles, the lantern's light on its upper flank
  const palm = [[-3, -5.4], [6, -9.4], [16, -10], [22, -7], [24, -1], [22, 6.4], [14, 9.2], [4, 8.8], [-3, 5.6]];
  { const [defs, g] = lit(palm, [10, -10], [10, 10]); s += defs + `<path d="${H.sp(PP(palm), true)}" fill="url(#${g})" stroke="${SHELL.outline}" stroke-width=".6"/>`; }
  { const R = rng(5); for (let i = 0; i < 18; i++) { const p = P(R() * 22, -7 + R() * 14); s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.45 + R() * .55)}" fill="${SHELL.lit}" opacity=".65"/><circle cx="${f(p[0] + .3)}" cy="${f(p[1] + .4)}" r="${f(.35 + R() * .35)}" fill="${SHELL.shadow}" opacity=".5"/>`; } }
  s += `<path d="${H.sp(PP([[0, -6], [8, -8.6], [17, -8.8], [22, -6]]))}" stroke="#ffe6c0" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".75"/>`
    + `<path d="${H.sp(PP([[2, 7.6], [10, 8.6], [18, 7.4]]))}" stroke="${RIMC}" stroke-width=".55" fill="none" opacity=".5"/>`
    + `<path d="${H.sp(PP([[2, 1], [12, .4], [21, 1.4]]))}" stroke="${SHELL.shadow}" stroke-width=".5" fill="none" opacity=".6"/>`;
  const b = P(8, 4); s += barnacles(u, b[0], b[1], 4, .85, 31, -1);
  const w = P(10, 8.6); s += weed(w[0], w[1], 10, 2, 32, '#3a7a50');
  return { svg: s, tipUp: P(46, -1.8), tipDn: P(45.4, 1.6) };
}

module.exports = { name: 'Абордаж рыболюдей', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // ——— the night fog: the sky, a bright patch behind him, the sea, the Dutchman far on the right ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 8, seed: 6 }) + glow(u, 108, 34, 90, 70, '#cfffe8', .45) + glow(u, 108, 34, 40, 30, '#f0fff6', .35);
    for (const [x, y, w, h, sd, fr] of [[40, 36, 70, 7, 3, .45], [168, 52, 60, 6, 8, .55], [30, 78, 50, 5, 5, .7], [150, 86, 60, 4, 11, .8]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .5, seed: 4, glitter: 108 });
    bg += `<g opacity=".55">${K.ship(u, L, { kind: 'dutch', x: 176, y: HZ + 1, scale: .5, detail: 'far', lights: true, seed: 6 })}</g>` + K.fog(u, L, { y: HZ - 22, h: 30, density: .6, seed: 2 });
    // his crewmates breaking the water beyond the rail: dark fish heads with crests, rings of ripples
    // (left and right: big and lit — a pale crest, the green rim, a yellow eye with a glint, a gill slit, a mouth line)
    for (const [x, y, s, dir, big] of [[15, 105.6, 1.25, -1, 1], [52, 106.4, .55, -1, 0], [179, 106, 1.3, 1, 1]]) {
      const hg = nid('wh', u);
      bg += `<g transform="translate(${x} ${y}) scale(${dir * s} ${s})">`
        + (big ? `<defs>${linGrad(hg, -9, -8, 9, 4, [[0, '#5a7a62', 1], [.5, '#2e4a3c', 1], [1, '#14241e', 1]])}</defs>` : '')
        + `<path d="M-3 -7l2 -6l2 5l2 -5l2 5l1.6 -3l.6 4" fill="${big ? '#4a3a2c' : '#1c2a24'}" stroke="#0e1a14" stroke-width=".4" stroke-linejoin="round"/>`
        + (big ? `<path d="M-1 -13L-3 -7M3 -12L1 -7M7 -10L5 -6" stroke="#d8c8a0" stroke-width=".55" stroke-linecap="round"/>` : '')
        + `<path d="M-9 4Q-9 -4 -4 -7Q2 -9 7 -5Q10 -1 9 4Z" fill="${big ? `url(#${hg})` : '#14241e'}" stroke="#08120c" stroke-width=".35"/>`
        + `<path d="M-4 -7Q2 -9 7 -5Q10 -1 9 4" stroke="${RIMC}" stroke-width="${big ? .7 : .5}" fill="none" opacity="${big ? .8 : .6}"/>`
        + (big ? `<path d="M-9 1.6Q-5 3 -1 1.4" stroke="#08120c" stroke-width=".55" fill="none"/><path d="M2 -3q1.4 2.6 .4 5.6M4 -3.4q1.4 2.6 .4 5.8" stroke="#0e1a14" stroke-width=".45" fill="none"/>`
          + `<circle cx="-4" cy="-2.4" r="2" fill="#0e1a10"/><circle cx="-4" cy="-2.4" r="1.6" fill="#e0f070"/><ellipse cx="-4" cy="-2.4" rx=".4" ry="1.3" fill="#141408"/><circle cx="-4.7" cy="-3.2" r=".5" fill="#ffffff"/>`
          : `<circle cx="-4" cy="-2" r="1.2" fill="#d8f070" opacity=".9"/>`) + `</g>`
        + `<ellipse cx="${x}" cy="${f(y + 3.6 * s)}" rx="${f(13 * s)}" ry="${f(1.6 * s)}" fill="none" stroke="#e8fff4" stroke-width=".5" opacity=".6"/><ellipse cx="${x}" cy="${f(y + 4 * s)}" rx="${f(18 * s)}" ry="${f(2.2 * s)}" fill="none" stroke="#c8f0e0" stroke-width=".35" opacity=".35"/>`; }

    // ——— his body: the rotten coat over the pale scaled belly, leaning over the rail at us ———
    let man = '';
    const torso = [[58, 112], [60, 92], [64, 80], [76, 72], [88, 70], [100, 74], [112, 72], [126, 74], [138, 82], [142, 96], [144, 112]];
    { const cg = nid('ct', u), bgd = nid('bl', u);
      man += `<defs>${linGrad(cg, 56, 70, 146, 110, [[0, '#4a5040', 1], [.3, COAT.half, 1], [.75, COAT.shadow, 1], [1, '#0a100a', 1]])}${linGrad(bgd, 84, 80, 120, 112, [[0, '#d8d4a8', 1], [.5, '#9aa07a', 1], [1, '#3a4630', 1]])}</defs>`
        + `<path d="${H.sp(torso)}L144 118L58 118Z" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".6"/>`;
      // the belly between the coat's torn fronts, scaled
      const belly = [[88, 76], [100, 80], [112, 76], [118, 96], [116, 118], [86, 118], [84, 96]];
      man += `<path d="${H.sp(belly, true)}" fill="url(#${bgd})" stroke="${COAT.outline}" stroke-width=".4"/>` + scales(u, H.sp(belly, true), 82, 76, 120, 118, 2.2, '#3a4430', .6, 9)
        + `<path d="M90 86q10 3 22 0M88 96q12 3 26 0M87 106q14 3 28 0" stroke="#4a5438" stroke-width=".5" fill="none" opacity=".6"/>`;
      // the lapels, ragged; a rope belt across; holes and barnacles
      man += `<path d="M88 72L84 96L80 118L72 118L76 92Z" fill="#323c2e" stroke="${COAT.outline}" stroke-width=".4"/><path d="M112 72L118 96L124 118L132 118L126 92Z" fill="#141c12" stroke="${COAT.outline}" stroke-width=".4"/>`
        + `<path d="M80 118l2 -5l2 4l2 -6l2 7M120 118l2 -6l2 5l2 -4l2 5" fill="none" stroke="#0a100a" stroke-width=".6"/>`
        + `<path d="M76 80q6 8 4 22M134 86q-4 10 -2 24M68 96q2 8 0 16" stroke="#0a100a" stroke-width=".8" fill="none" opacity=".7"/>`
        + `<path d="M64 80Q72 72 88 70" stroke="#c8a870" stroke-width=".8" fill="none" opacity=".5"/>`
        + `<path d="M126 74Q138 80 142 96" stroke="${RIMC}" stroke-width=".9" fill="none" opacity=".6"/>`
        + barnacles(u, 70, 100, 5, 1.1, 41) + barnacles(u, 132, 104, 4, 1, 42) + weed(76, 112, 8, 2, 43);
      // the neck: thick, scaled, going into the collar under the jaw
      man += `<path d="M86 74Q90 64 96 62L112 62Q118 66 116 74Q104 80 86 74Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".45"/>`; }

    // ——— the bulwark of our ship in front of his hips; the rail cap; water running down its inside ———
    let rail = K.bulwark(u, L, { x1: -10, x2: 210, y: FOOT, h: FOOT - RAIL, kind: 'oak', posts: 26, seed: 5 });
    rail += `<rect x="-10" y="${RAIL - 1}" width="220" height="${FOOT - RAIL + 1}" fill="#1a3a30" opacity=".25" style="mix-blend-mode:multiply"/>`;
    { const id = nid('dk', u); rail += `<defs><clipPath id="${id}"><rect x="-10" y="${FOOT}" width="220" height="${290 - FOOT}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: FOOT, bottom: 290, vx: 100, kind: 'pine-deck', plank: 14, seed: 8, wet: true })}</g>`; }
    rail += `<path d="M-10 ${RAIL + .4}H210" stroke="${RIMC}" stroke-width=".5" opacity=".45"/>`;
    // the far claw coming over the rail on the right: two black-tipped fingers hooked over the cap
    rail += `<g transform="translate(173 ${RAIL + 1}) rotate(8) scale(1.1)"><path d="M-8 -2Q-6 -8 0 -9Q6 -8 8 -2L6 4Q0 6 -6 4Z" fill="${SHELL.half}" stroke="${SHELL.outline}" stroke-width=".5"/><path d="M-6 2Q-12 4 -14 10L-11 9Q-8 5 -4 5Z" fill="${SHELL.shadow}" stroke="${SHELL.outline}" stroke-width=".4"/><path d="M-14 10l3 -1l-1 -2z" fill="#140806"/><path d="M-6 -8Q0 -10 6 -7" stroke="${RIMC}" stroke-width=".5" fill="none" opacity=".6"/></g>`
      + runs([[168, RAIL + 4], [168.4, RAIL + 12], [168, RAIL + 22]], 1, .6);
    // water pouring off him down the inside of the bulwark, into a spreading puddle on the deck
    rail += [[76, 22, 1.2], [96, 30, 1.6], [112, 16, 1.1], [128, 27, 1.4]].map(([x, l, w], i) => runs([[x, RAIL + 2], [x + (i % 2 ? 1.2 : -1), RAIL + l * .35], [x + (i % 2 ? -.6 : .8), RAIL + l * .7], [x + (i % 2 ? .4 : -.3), RAIL + l]], w, .6)).join('');
    { const R = rng(3), pts = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2, r = 1 + (R() - .5) * .3; return [100 + Math.cos(a) * 62 * r, 168 + Math.sin(a) * 10 * r]; });
      const g = nid('pd', u); rail += `<defs>${linGrad(g, 40, 0, 160, 0, [[0, '#a87a40', .45], [.4, '#3a6a5e', .4], [1, '#2a4a40', .35]])}</defs><path d="M${pts.map(P2).join('L')}Z" fill="url(#${g})" stroke="#0e2420" stroke-width=".3"/>`
        + [.3, .55, .8].map((k, i) => `<ellipse cx="96" cy="166" rx="${f(56 * k)}" ry="${f(9 * k)}" fill="none" stroke="#e0fff4" stroke-width="${f(.5 - i * .1)}" opacity="${f(.55 - i * .15)}"/>`).join(''); }
    // the dropped cap of the enemy's sailor on the wet deck, a little apart
    rail += K.castShadow(u, L, { x: 150, y: 206, w: 14, h: 6, horizon: HZ, d: .6, opacity: .5 })
      + `<g transform="translate(150 204) rotate(-12)"><path d="M-8 2q0 -10 8 -10t8 10z" fill="#2a3a5a" stroke="#0a1020" stroke-width=".5"/><path d="M-9 2h18" stroke="#d8d0c0" stroke-width="1.6"/><path d="M-6 -2q4 -5 10 -2" stroke="#ffc080" stroke-width=".5" fill="none" opacity=".6"/><circle cy="-8" r="1.4" fill="#c8302a"/></g>`;

    // ——— his right arm (our left): sleeve from the shoulder down and out to the elbow, then the claw on the rail ———
    const SH = [68, 80], EL = [44, 92], WR = [52, 106], CANG = 166;
    let armR = H.cloth(u, { spine: [SH, [56, 85], EL], w: [15, 13.6, 12.4], tone: COAT, lit: 1, rim: RIMC, rimSide: -1, rimOp: .3, seed: 3, drapes: 1, sw: .45, capA: true, roundA: .9 });
    const cl = claw(u, L, EL, WR, CANG);
    // the sleeve's torn end over the elbow, rags hanging; then the claw
    armR += cl.svg;
    const rags = `<path d="M36 90l-1 7l2.4 -2.4l1 6l2 -5.6l2.4 4l1 -5l2.6 3.4l.6 -5" fill="#1e261a" stroke="#040804" stroke-width=".4" stroke-linejoin="round"/>`;
    // the bite: the cap crushed between the tips, splinters lifting, a crack down the plank
    const tu = cl.tipUp, td = cl.tipDn;
    const bite = `<path d="M${f(tu[0] - 3)} ${f(tu[1] + .6)}l-2.6 -3.6l3.4 1.6M${f(tu[0] + 2)} ${f(tu[1] + .4)}l1.4 -4l.8 3.4" stroke="#d8b080" stroke-width=".7" fill="none"/>`
      + `<path d="M${f(td[0])} ${f(td[1] + 1)}l-1.4 8l1.4 6" stroke="#0a0604" stroke-width=".6" fill="none"/><path d="M${f(td[0] - 4)} ${f(td[1] + 2)}l-3 2.6" stroke="#d8b080" stroke-width=".6"/>`
      + K.localGlow(u, { x: tu[0], y: tu[1] + 2, color: '#ffc070', power: .25, radius: 8 }, { squash: .4, core: false });
    // the scallop: down on the shoulder's top (off the jaw), half sunk into the coat — its hinge half under the cloth,
    // a lip of cloth over the cut, its shadow on the sleeve
    const shell = (() => { const c = [62.4, 86.6], sc = nid('sk', u); let sh = `<ellipse cx="${f(c[0] + 2.4)}" cy="${f(c[1] + 1.6)}" rx="7.4" ry="2.6" transform="rotate(-24 ${f(c[0] + 2.4)} ${f(c[1] + 1.6)})" fill="#040804" opacity=".55"/>`
        + `<defs><clipPath id="${sc}"><rect x="-16" y="-17" width="32" height="14.6"/></clipPath></defs><g transform="translate(${c[0]} ${c[1]}) rotate(-28) scale(.62)"><g clip-path="url(#${sc})">`; const sg = nid('ss', u);
      sh += `<defs>${linGrad(sg, -10, -10, 10, 6, [[0, '#f0e0c0', 1], [.5, '#c0a07c', 1], [1, '#4a3a2a', 1]])}</defs><path d="M0 8L-13 -4Q-12 -12 -4 -14Q0 -15 4 -14Q12 -12 13 -4Z" fill="url(#${sg})" stroke="#2a1e12" stroke-width=".5"/>`;
      for (let k = -5; k <= 5; k++) sh += `<path d="M0 8L${f(k * 2.4)} ${f(-14 + Math.abs(k) * .9)}" stroke="#5a4632" stroke-width=".5" opacity=".7"/>`;
      sh += `<path d="M-13 -4Q-12 -12 -4 -14" stroke="#ffe0b0" stroke-width=".7" fill="none" opacity=".6"/><path d="M4 -14Q12 -12 13 -4" stroke="${RIMC}" stroke-width=".7" fill="none" opacity=".55"/></g>`
        + `<path d="M-14 -2.2Q0 -4.6 14 -2.2" stroke="#040804" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-13 -1.2Q0 -3.4 13 -1.2" stroke="#4a5440" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
      return sh + barnacles(u, 74, 76, 3, .9, 44, -1); })();

    // ——— his left arm (our right): the sleeve to the elbow out at his side, the forearm up to the fist on the cutlass ———
    const GRIP = [134, 76], BLADE = -84;
    const GR = 1.6, HS = 3.6;                     // the grip's radius; the fist ×1.33 of the first pass, closed round the grip (r·s ≈ GR)
    const hL = handOn(u, { s: HS, m: 1, roll: 0, pitch: 20, pose: 'wrap', r: (GR + .15) / HS, tone: SKIN, light: [-.8, -.4], sw: .32, tilt: 4, palmW: .8, fingerW: 1.02, nails: true }, GRIP, BLADE, -160);
    const armL = H.cloth(u, { spine: [[132, 80], [146, 90], [156, 98], [lerp(156, hL.wrist[0], .5), lerp(98, hL.wrist[1], .5)], hL.wrist], w: [15, 13.4, 12.4, 11.6, 11], tone: COAT, lit: -1, rim: RIMC, rimSide: 1, rimOp: .7, seed: 7, drapes: 1, sw: .45, capA: true, roundA: .9,
      cuff: { from: .9, k: 1.04, tone: { lit: '#3a4030', half: '#222a1e', shadow: '#0e140c', outline: '#040402' } } });
    // the cutlass: rusted blade with nicks, a curved brass guard, the grip through his fist, a weed strand off the guard
    let sword = '';
    { let v = hL.axis; if (v[1] > 0) v = [-v[0], -v[1]]; const n = [-v[1], v[0]], g = hL.grip, at = (t, o = 0) => [g[0] + v[0] * t + n[0] * o, g[1] + v[1] * t + n[1] * o];
      const gripSvg = K.shadeCyl(u, ...at(-9.6), ...at(7.4), GR, L, 'leather', { outline: .3 }) + K.shadeSphere(u, ...at(-10.6), 2.3, L, 'brass', { outline: .35 });
      const bl = [at(9, -1.6), at(32, -2.4), at(54, -1), at(64, 1.4), at(60, 2.6), at(38, 2.4), at(9, 1.6)], bg2 = nid('bl', u), a = at(30, -3), b = at(30, 3);
      const blade = `<defs>${linGrad(bg2, a[0], a[1], b[0], b[1], [[0, '#e8f0ec', 1], [.4, '#9aa6a2', 1], [1, '#3a4440', 1]])}</defs><path d="${H.sp(bl, true)}" fill="url(#${bg2})" stroke="#141a18" stroke-width=".45"/>`
        + `<path d="M${P2(at(10, -.4))}L${P2(at(48, -.2))}" stroke="#4a5450" stroke-width=".4"/>` + [[20, 1.8], [34, 2], [44, -1.6]].map(([t, o]) => `<circle cx="${f(at(t, o)[0])}" cy="${f(at(t, o)[1])}" r="${f(1 + (t % 3) * .2)}" fill="#7a3a1a" opacity=".7"/>`).join('')
        + `<path d="M${P2(at(40, 2.7))}l.8 -1.2l.6 1.3M${P2(at(26, 2.5))}l.8 -1l.6 1.1" stroke="#141a18" stroke-width=".35" fill="none"/>`
        + `<path d="M${P2(at(12, -1.8))}L${P2(at(56, -.6))}" stroke="${RIMC}" stroke-width=".6" opacity=".8"/>`;
      // the guard: a thick brass cross-bar and a knuckle bow closed from it round the fist to the pommel, dark-edged
      const cross = `M${P2(at(8.2, -5))}Q${P2(at(9.8, 0))} ${P2(at(8.2, 5))}`, bow = `M${P2(at(8.4, -4.8))}C${P2(at(6, -13))} ${P2(at(-8, -12.4))} ${P2(at(-10.6, -2))}`;
      const guard = `<path d="${bow}" stroke="#1e1206" stroke-width="2.9" fill="none" stroke-linecap="round"/><path d="${bow}" stroke="url(#brass${u})" stroke-width="2" fill="none" stroke-linecap="round"/>`
        + `<path d="${cross}" stroke="#1e1206" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${cross}" stroke="url(#brass${u})" stroke-width="3" fill="none" stroke-linecap="round"/>`
        + `<path d="M${P2(at(8.6, -4))}Q${P2(at(10, 0))} ${P2(at(8.6, 4))}" stroke="#fff0c0" stroke-width=".5" fill="none" opacity=".6"/>`
        + K.shadeSphere(u, ...at(-10.6), 2.3, L, 'brass', { outline: .35 });
      sword = { back: blade + hL.back + gripSvg, front: hL.front + guard }; }

    // ——— assemble: body, his left arm behind the head, the head, then the rail in front of his hips, the claw on it ———
    const head = fishHead(u, L);
    const knuck = (() => { const k = hL.P(4.6, -.4, .2); return glow(u, k[0], k[1], 8, 7, '#bff8e0', .15); })();
    let fg = man + armL + sword.back + sword.front + knuck + head + rail + armR + rags + shell + bite;
    // ——— light and air: the lantern (hanging on the left), its warmth on the claw and the face, fog, the dark below ———
    fg += K.lantern(u, L, LAMP) + K.localGlow(u, { x: LL.x, y: LL.y, color: '#ffc070', power: .75, radius: 22 })
      + glow(u, 56, 92, 60, 50, WARM, .14) + glow(u, 30, 156, 40, 14, WARM, .18)
      + motes(22, 0, 30, 200, 90, '#dffff0', 7) + K.fog(u, L, { y: RAIL - 4, h: 22, density: .3, seed: 9 })
      + gloom(u, 100, 140, 100, 280, .55, '#020806') + gloom(u, 100, 120, 220, 60, .25, '#020806');
    return [bg, fg];
  } };
