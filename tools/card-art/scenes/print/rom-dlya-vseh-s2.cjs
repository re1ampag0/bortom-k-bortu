// «Ром для всех» (Жемчужина, РЕМОНТ: по 1 Команде своему кораблю и кораблю союзника), variant A of the method trial
// (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-pearl.cjs SCENES['Ром для всех']) at
// its best. Below decks at night, the berth deck in one-point perspective (deck, sides, beams and planking run to one
// vanishing point, the bulkhead with its door deep in): two hands from two crews come in from the lower corners and
// knock their mugs together, the rum leaping up between them — one sleeve is a black coat, the other a sailor's bare
// forearm with a bandage at the wrist (the wounded one is back on his feet). Round them the off-watch asleep in their
// hammocks, the open cask of rum by the side, one lantern on its rope; through the open gun port the ally's ship lies
// alongside with her lights lit — the rum goes round two ships.
// Fixed against the first round: the arms were flat tubes with mitten hands that did not hold the mugs — now each
// hand is one body with its arm (sleeve, cuff or bandage, back of the hand, knuckles), the fingers wrap the mug's
// front and stop short of its far edge, the thumb lies over the index finger; the room was a flat wall — now it has
// depth; the splash is one body of rum with drops along their flight; the lantern is the one light (warm sides to it,
// shadows away). Second pass: the splash is one low, wide crown wave over the touching rims (it read as two flames),
// the hands are a little smaller against the mugs.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, motes } = PK;

const VP = [100, 68], HZ = VP[1];                          // one-point perspective: the vanishing point = eye level
const FAR = .34, CEIL = 94.1, FLOOR = 70.6;                // the bulkhead's depth; deckhead and deck offsets from the eye at depth 1
const LAMP = { x: 64, y: 44, s: 1.25, hang: 16 }, lamp = K.lantern.local({ ...LAMP });
const light = { time: 'night', haze: .3, key: { type: 'point', ...lamp, h: 1.4, gy: 126, color: '#ffbe6a', power: 1, radius: 130 },
  fill: { color: '#2e3e5a', power: .35 }, rim: { az: 60, color: '#bcd0f0', power: .3 } };
const lightOut = { time: 'night', haze: .3, key: { type: 'moon', x: 182, y: 76, el: 20, color: '#d8e4fa', power: .8 }, fill: { color: '#3d5680', power: .4 } };
const skel = { horizon: HZ, eye: 1.2, light: 'one lantern hanging from the beam upper left; the moon outside the gun port (cold, only in the port)', items: [
  ['bulkhead', 66, 92, 68, 56, 'room, depth .34'], ['lantern', 56, 44, 16, 36, 'beam (rope)'], ['port', 160, 97, 26, 27, 'right side'], ['ally ship', 166, 95, 22, 14, 'sea, in the port'],
  ['hammock L', 6, 40, 42, 22, 'beams'], ['hammock R', 146, 40, 50, 22, 'beams'], ['cask', 25, 112, 20, 30, 'deck, left side'], ['shelf + bottles', 16, 64, 30, 16, 'left side'],
  ['bottle', 106, 127, 12, 26, 'table top'], ['tin mug', 66, 104, 28, 34, 'in the left hand'], ['tankard', 106, 102, 30, 34, 'in the right hand'],
  ['splash', 80, 78, 40, 22, 'a low crown over the touching rims'], ['arm L', -26, 250, 90, 170, 'from the lower left corner'], ['arm R', 120, 250, 106, 170, 'from the lower right corner']] };

const lerp = (a, b, t) => a + (b - a) * t;
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }
// an arm coming in from the lower corner: a sleeve tapering towards the wrist, folds across, a cuff; `bare` — the
// sleeve rolled up to the elbow, the forearm bare (with a bandage)
function arm(u, L, o) {
  const { x0, y0, x1, y1, w0, w1, cloth, cuff, bare, side } = o, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const P = (t, s) => { const w = lerp(w0, w1, Math.pow(t, .8)) / 2; return [x0 + dx * t + nx * w * s, y0 + dy * t + ny * w * s]; };
  const sl = bare ? .52 : 1, g = nid('ar', u), sk = nid('sk', u), lit = side > 0 ? -1 : 1;   // the lantern is upper left: the upper-left edge of each arm is lit
  const pts = t => [P(t, -1), P(t, 1)];
  const outline = (t0, t1) => { const a = [], b = []; for (let i = 0; i <= 8; i++) { const t = lerp(t0, t1, i / 8), q = pts(t); a.push(q[0]); b.push(q[1]); } return smooth([...a, ...b.reverse()], true); };
  const A = P(.5, -1), B = P(.5, 1);
  let out = `<defs>${linGrad(g, A[0], A[1], B[0], B[1], side > 0 ? [[0, cloth[0], 1], [.45, cloth[1], 1], [1, cloth[2], 1]] : [[0, cloth[2], 1], [.55, cloth[1], 1], [1, cloth[0], 1]])}`
    + `${linGrad(sk, A[0], A[1], B[0], B[1], side > 0 ? [[0, '#e8b88a', 1], [.5, '#b07a52', 1], [1, '#5a3420', 1]] : [[0, '#5a3420', 1], [.5, '#b07a52', 1], [1, '#e8b88a', 1]])}</defs>`;
  if (bare) {
    out += `<path d="${outline(.48, 1)}" fill="url(#${sk})" stroke="#3a1e10" stroke-width=".6"/>`;
    // hair and a vein on the forearm, the bandage wound round it near the wrist
    const R = rng(4); for (let i = 0; i < 26; i++) { const t = .55 + R() * .4, s = (R() - .5) * 1.4, p = P(t, s); out += `<path d="M${f(p[0])} ${f(p[1])}l${f(ux * 1.2 + R() * .4)} ${f(uy * 1.2)}" stroke="#4a2a18" stroke-width=".22" opacity=".55"/>`; }
    for (let i = 0; i < 4; i++) { const t = .86 + i * .036, a = P(t, -1.05), b = P(t + .02, 1.05), c = P(t + .045, -1.05);
      out += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(P(t + .065, 1.05)[0])} ${f(P(t + .065, 1.05)[1])}L${f(c[0])} ${f(c[1])}Z" fill="${i % 2 ? '#d8ccb0' : '#ece4d0'}" stroke="#8a7a5a" stroke-width=".3"/>`; }
    { const p = P(.9, -.2); out += `<path d="M${f(p[0])} ${f(p[1])}q2 1 3 4" stroke="#a83a2a" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"/>`; }
  }
  out += `<path d="${outline(0, sl)}" fill="url(#${g})" stroke="#0a0806" stroke-width=".6"/>`;
  // folds: soft curved creases across the sleeve, lit edge on the lantern side
  const R = rng(o.seed || 3);
  for (let i = 0; i < 7; i++) { const t = .08 + i * (sl - .14) / 6 + R() * .03, a = P(t, -.95), b = P(t + .04 + R() * .03, .1 + R() * .7), c = P(t - .02, .95);
    out += `<path d="M${f(a[0])} ${f(a[1])}Q${f(b[0])} ${f(b[1])} ${f(c[0])} ${f(c[1])}" stroke="${cloth[2]}" stroke-width="${f(.8 + R() * .6)}" fill="none" opacity=".55" stroke-linecap="round"/>`
      + `<path d="M${f(a[0] - ux)} ${f(a[1] - uy)}Q${f(b[0] - ux)} ${f(b[1] - uy)} ${f(c[0] - ux)} ${f(c[1] - uy)}" stroke="${cloth[0]}" stroke-width=".4" fill="none" opacity=".45"/>`; }
  { const a = P(.02, -lit), b = P(sl, -lit); out += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#ffc888" stroke-width=".6" opacity=".45"/>`; }
  // the cuff (a turned-back coat cuff with buttons, or the rolled sleeve) and a shirt ruffle at the wrist
  { const t = bare ? sl : .9, a = P(t - .07, -1.08), b = P(t - .07, 1.08), c = P(t, 1.04), d = P(t, -1.04), cg = nid('cf', u);
    out += `<defs>${linGrad(cg, a[0], a[1], b[0], b[1], side > 0 ? [[0, cuff[0], 1], [1, cuff[1], 1]] : [[0, cuff[1], 1], [1, cuff[0], 1]])}</defs><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}Z" fill="url(#${cg})" stroke="#0a0806" stroke-width=".5"/>`;
    if (!bare) { for (const s of [-.4, .3]) { const p = P(t - .035, s); out += K.shadeSphere(u, p[0], p[1], .9, L, 'brass', { outline: .25 }); }
      { const a0 = P(.9, -1.15); let d = `M${f(a0[0])} ${f(a0[1])}`; for (let i = 0; i < 5; i++) { const s0 = -1.15 + i * .46, s1 = s0 + .46, m = P(.945, s0 + .23), e = P(.925, s1); d += `Q${f(m[0] + ux * .6)} ${f(m[1] + uy * .6)} ${f(e[0])} ${f(e[1])}`; } d += `L${f(P(.9, 1.15)[0])} ${f(P(.9, 1.15)[1])}`;
        out += `<path d="${d}Z" fill="#e8e2d2" stroke="#8a8070" stroke-width=".3"/><path d="M${f(P(.92, -.6)[0])} ${f(P(.92, -.6)[1])}L${f(P(.95, -.5)[0])} ${f(P(.95, -.5)[1])}M${f(P(.92, .3)[0])} ${f(P(.92, .3)[1])}L${f(P(.95, .4)[0])} ${f(P(.95, .4)[1])}" stroke="#a89c88" stroke-width=".3"/>`; } } }
  return out;
}
// a mug's frame: origin at the middle of its bottom, y up the axis (negative), turned by a degrees
const mugFrame = (x, y, a) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return (lx, ly) => [x + lx * c - ly * s, y + lx * s + ly * c]; };
const pathM = (M, pts, closed = true) => smooth(pts.map(([x, y]) => M(x, y)), closed);
// the hand round a mug, in the mug's frame M (r — radius, H — height, e = -1: the hand is on the mug's left, +1: on
// its right). The back of the hand lies on the mug's side, the knuckles in a row up its front edge, the four fingers
// wrap across the front (each a little shorter toward the little finger; none reaches the far edge), the thumb lies
// over the index finger. `back` goes under the sleeve's cuff, `front` (finger shadows, fingers, thumb) over it.
function gripHand(u, M, r, H, e, skin, litBack, k = .87) {
  const X = (uu, y) => M(e * uu, y), P = pts => smooth(pts.map(([uu, y]) => X(uu, y)), true), t = H * .078;
  const gb = nid('hb', u), gf = nid('hf', u), gt = nid('ht', u);
  const A = X(r + .4 * H, -.5 * H), B = X(r * .3, -.5 * H), T0 = X(0, -.95 * H), T1 = X(0, -.15 * H);
  const lg = (id, p, q, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}">${st.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let defs = lg(gb, A, B, litBack ? [[0, skin[0]], [.55, skin[1]], [1, skin[2]]] : [[0, skin[2]], [.5, skin[1]], [1, skin[1]]])
    + lg(gf, T0, T1, [[0, skin[0]], [.45, skin[1]], [1, skin[2]]]) + lg(gt, X(0, -.98 * H), X(0, -.8 * H), [[0, skin[0]], [.6, skin[1]], [1, skin[2]]]);
  // the back of the hand: from the wrist (under the cuff) to the row of knuckles on the mug's front edge
  const backPts = [[r * .5, -.87 * H], [r + .1 * H, -.9 * H], [r + .36 * H, -.82 * H], [r + .48 * H, -.5 * H], [r + .4 * H, -.16 * H], [r + .1 * H, -.15 * H], [r * .5, -.2 * H], [r * .4, -.3 * H], [r * .42, -.44 * H], [r * .42, -.6 * H], [r * .41, -.76 * H]];
  let back = `<defs>${defs}</defs><path d="${P(backPts)}" fill="url(#${gb})" stroke="#3a1e10" stroke-width=".45"/>`;
  // tendons and the knuckle bumps on the back of the hand
  for (const y of [-.74, -.59, -.44, -.3]) { const a = X(r + .3 * H, y * H * .92 - .04 * H), b = X(r * .55, y * H); back += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${skin[2]}" stroke-width=".35" opacity=".45"/>`;
    const k = X(r * .5, y * H); back += `<circle cx="${f(k[0])}" cy="${f(k[1])}" r="${f(t * .7)}" fill="${skin[0]}" opacity="${litBack ? .45 : .25}"/>`; }
  // the fingers: each from its knuckle across the front, bowed a little with the cylinder, a nail at the tip
  const fingers = [[-.76, -.42], [-.6, -.5], [-.44, -.4], [-.29, -.16]];
  let front = '';
  for (const [c, tip] of fingers) { const a = X(r * .45, c * H + t + .5), b = X(0, c * H + t + .9), d = X(tip * r, c * H + t + .4);
    front += `<path d="M${f(a[0])} ${f(a[1])}Q${f(b[0])} ${f(b[1])} ${f(d[0])} ${f(d[1])}" stroke="#1a0c04" stroke-width="1.2" fill="none" opacity=".35" stroke-linecap="round"/>`; }
  for (const [c, tip] of fingers.slice().reverse()) { const y = c * H, u0 = r * .46, u1 = tip * r, bw = .022 * H;
    front += `<path d="${P([[u0, y - t], [(u0 + u1) / 2, y - t + bw], [u1 + t * .5, y - t * .85 + bw * .4], [u1 - t * .55, y], [u1 + t * .5, y + t * .9 + bw * .4], [(u0 + u1) / 2, y + t + bw], [u0, y + t]])}" fill="url(#${gf})" stroke="#3a1e10" stroke-width=".42"/>`;
    const n = X(u1 + t * .35, y - t * .1), j = X((u0 + u1) / 2 + r * .04, y);
    front += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(t * .55)}" ry="${f(t * .45)}" fill="#f0d4bc" opacity=".75" stroke="#8a5a40" stroke-width=".25"/>`
      + `<path d="M${f(j[0])} ${f(j[1] - t * .55)}q${f(-e * .5)} ${f(t * .55)} 0 ${f(t * 1.1)}" stroke="#7a4a30" stroke-width=".3" fill="none" opacity=".7"/>`
      + `<path d="${smooth([X(u0 - r * .05, y - t * .62), X((u0 + u1) / 2, y - t * .55 + bw), X(u1 + t, y - t * .5)])}" stroke="${skin[0]}" stroke-width=".45" fill="none" opacity=".7"/>`; }
  // the thumb from the ball of the hand over the index finger, its nail toward us
  front += `<path d="${P([[r + .22 * H, -.84 * H], [r * .6, -.99 * H], [r * .05, -.98 * H], [-r * .14, -.93 * H], [-r * .12, -.86 * H], [r * .2, -.85 * H], [r * .6, -.83 * H]])}" fill="url(#${gt})" stroke="#3a1e10" stroke-width=".42"/>`;
  { const n = X(-r * .02, -.93 * H); front += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(t * .7)}" ry="${f(t * .45)}" fill="#f0d4bc" opacity=".8" stroke="#8a5a40" stroke-width=".25"/>`; }
  { const a = X(r * .7, -.96 * H), b = X(r * .1, -.965 * H); front += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${skin[0]}" stroke-width=".5" opacity=".7" stroke-linecap="round"/>`; }
  // the hand is drawn a little smaller than the mug's own measure (k), round the row of knuckles on the mug's front
  const ap = X(r * .5, -.55 * H), w = X(r + .44 * H, -.5 * H), g = s => `<g transform="translate(${f(ap[0])} ${f(ap[1])}) scale(${k}) translate(${f(-ap[0])} ${f(-ap[1])})">${s}</g>`;
  return { back: g(back), front: g(front), wrist: [ap[0] + (w[0] - ap[0]) * k, ap[1] + (w[1] - ap[1]) * k] };
}
// a pewter can: a straight dented cylinder, a rolled rim, a scroll handle on side e; lit by the lantern, rum inside
function tinMug(u, L, M, r, H, e) {
  const ell = .26, a0 = M(0, 0), a1 = M(0, -H), ang = Math.atan2(a1[0] - a0[0], -(a1[1] - a0[1])) * 180 / Math.PI;
  const hd = [M(e * (r - .4), -H * .82), M(e * (r + 7), -H * .8), M(e * (r + 7.4), -H * .3), M(e * (r - .2), -H * .22)];
  const hp = `M${f(hd[0][0])} ${f(hd[0][1])}C${f(hd[1][0])} ${f(hd[1][1])} ${f(hd[2][0])} ${f(hd[2][1])} ${f(hd[3][0])} ${f(hd[3][1])}`;
  let out = `<path d="${hp}" stroke="#2a3034" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="${hp}" stroke="#8a969c" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  out += K.shadeCyl(u, a0[0], a0[1], a1[0], a1[1], r, L, 'iron', { ell, face: 2, outline: .45, r1: r, r2: r * .95 });
  // a raised foot ring and a band under the rim; two dents
  { const b0 = M(-r, -1.6), b1 = M(r, -1.6), c0 = M(-r * .95, -H + 3), c1 = M(r * .95, -H + 3);
    out += `<path d="M${f(b0[0])} ${f(b0[1])}Q${f(M(0, -1.6 + r * ell * 1.6)[0])} ${f(M(0, -1.6 + r * ell * 1.6)[1])} ${f(b1[0])} ${f(b1[1])}" stroke="#2a3034" stroke-width=".7" fill="none"/>`
      + `<path d="M${f(c0[0])} ${f(c0[1])}Q${f(M(0, -H + 3 + r * ell * 1.6)[0])} ${f(M(0, -H + 3 + r * ell * 1.6)[1])} ${f(c1[0])} ${f(c1[1])}" stroke="#d8e4ea" stroke-width=".5" fill="none" opacity=".5"/>`; }
  const d1 = M(-e * 3, -H * .3), d2 = M(-e * 6, -H * .55);
  out += `<ellipse cx="${f(d1[0])}" cy="${f(d1[1])}" rx="2.2" ry="1.2" fill="#1a2024" opacity=".3"/><ellipse cx="${f(d1[0] - .6)}" cy="${f(d1[1] - .5)}" rx="1.2" ry=".6" fill="#d8e4ea" opacity=".35"/><ellipse cx="${f(d2[0])}" cy="${f(d2[1])}" rx="1.4" ry=".8" fill="#1a2024" opacity=".25"/>`;
  const m = M(0, -H), rr = r * .95;
  out += `<ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(rr)}" ry="${f(rr * ell)}" transform="rotate(${f(ang)} ${f(m[0])} ${f(m[1])})" fill="#3a1606" stroke="#6a767c" stroke-width="1.2"/>`
    + `<ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(rr)}" ry="${f(rr * ell)}" transform="rotate(${f(ang)} ${f(m[0])} ${f(m[1])})" fill="none" stroke="#c8d4da" stroke-width=".35" opacity=".6"/>`
    + `<ellipse cx="${f(m[0] - rr * .3)}" cy="${f(m[1] - .3)}" rx="${f(rr * .4)}" ry="${f(rr * ell * .4)}" transform="rotate(${f(ang)} ${f(m[0])} ${f(m[1])})" fill="#ffb050" opacity=".55"/>`;
  return out;
}
// a hammock slung fore and aft under the beams (from p to q, both ends on hooks), sagging, a sleeper rolled in it
function hammock(u, L, p, q, sag, w, sleeper) {
  const g = nid('hm', u), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + sag], rp = L.ramp('canvas', m[0], m[1]);
  let out = `<path d="M${f(p[0])} ${f(p[1] - 6)}L${f(p[0] + (q[0] - p[0]) * .08)} ${f(p[1] + 1)}M${f(p[0])} ${f(p[1] - 6)}L${f(p[0] + (q[0] - p[0]) * .1)} ${f(p[1] + 3)}M${f(q[0])} ${f(q[1] - 4)}L${f(q[0] - (q[0] - p[0]) * .08)} ${f(q[1] + 1)}" stroke="#4a3a28" stroke-width=".5"/>`
    + `<defs>${linGrad(g, 0, m[1] - w, 0, m[1] + w, [[0, rp.half, 1], [.55, rp.shadow, 1], [1, mix(rp.lit, '#ffc888', .4), 1]])}</defs>`
    + `<path d="M${f(p[0] + (q[0] - p[0]) * .08)} ${f(p[1] + 1)}Q${f(m[0])} ${f(m[1] - w * .4)} ${f(q[0] - (q[0] - p[0]) * .08)} ${f(q[1] + 1)}Q${f(m[0])} ${f(m[1] + w * 1.2)} ${f(p[0] + (q[0] - p[0]) * .08)} ${f(p[1] + 1)}Z" fill="url(#${g})" stroke="#140c06" stroke-width=".5"/>`
    + `<path d="M${f(p[0] + (q[0] - p[0]) * .14)} ${f(p[1] + 2.4)}Q${f(m[0])} ${f(m[1] + w * .5)} ${f(q[0] - (q[0] - p[0]) * .14)} ${f(q[1] + 2)}" stroke="${rp.shadow}" stroke-width=".4" fill="none" opacity=".7"/>`;
  if (sleeper) out += `<path d="M${f(m[0] - (q[0] - p[0]) * .25)} ${f(m[1] - w * .1)}q${f((q[0] - p[0]) * .2)} ${f(-w * .9)} ${f((q[0] - p[0]) * .45)} ${f(-w * .4)}q${f((q[0] - p[0]) * .05)} ${f(w * .4)} 0 ${f(w * .6)}z" fill="#1a120a" opacity=".8"/>`;
  return out;
}
// the splash of rum where the two mugs knock: one low, wide wave thrown up out of both mouths and joined over the
// point where the rims touch, its top breaking into a crown of short points with a drop on each, its edges curling
// out over the rims; about half a mug high. Translucent amber, lit from the lantern (upper left): a bright streak
// along its lit shoulder, glints; drops flung to both sides and falling back, stretched along their flight
function splash(u, a, b) {
  const g = nid('rs', u), gl = nid('rl', u), R = rng(9), cx = (a[0] + b[0]) / 2, y0 = (a[1] + b[1]) / 2, h = 15;
  let out = `<defs>${linGrad(g, 0, y0 + 2, 0, y0 - h - 2, [[0, '#4a1a04', .96], [.4, '#9a4a0c', .93], [.8, '#dc9434', .9], [1, '#f6c46a', .88]])}`
    + `${linGrad(gl, cx - 14, 0, cx + 14, 0, [[0, '#ffd890', .5], [.45, '#ffd890', .12], [1, '#ffd890', 0]])}</defs>`;
  // the body: from the left mouth, the lip curling out over the left rim, up the shoulder to the crown, down the
  // right shoulder, the right lip, into the right mouth, and back over the point where the rims touch
  const body = [[a[0] - 1.5, a[1] + 1], [cx - 10, y0 - 2], [cx - 15.5, y0 - 3.6], [cx - 15, y0 - 6.4], [cx - 12.4, y0 - 10.6], [cx - 9, y0 - 14],
    [cx - 6.2, y0 - 13.2], [cx - 3.2, y0 - 15.2], [cx - .2, y0 - 13.6], [cx + 3, y0 - 15.4], [cx + 6, y0 - 13.4], [cx + 9, y0 - 14.4],
    [cx + 12.6, y0 - 10.4], [cx + 15.2, y0 - 6.6], [cx + 16, y0 - 3.8], [cx + 10.4, y0 - 2.2], [b[0] + 1.5, b[1] + 1], [cx, y0 - 1.2]];
  out += `<path d="${smooth(body, true)}" fill="url(#${g})" stroke="#3a1404" stroke-width=".4" stroke-linejoin="round"/>`
    + `<path d="${smooth(body, true)}" fill="url(#${gl})"/>`;
  // the thin rim of the crown seen through: a lighter band under the points; the curl of each lip
  out += `<path d="${smooth([[cx - 11, y0 - 11.2], [cx - 4, y0 - 12.6], [cx + 4, y0 - 12.6], [cx + 11.4, y0 - 11], [cx + 4, y0 - 9.6], [cx - 4, y0 - 9.6]], true)}" fill="#f8c060" opacity=".38"/>`
    + `<path d="M${f(cx - 15.2)} ${f(y0 - 4.2)}q2.4 1.4 5.6 1.6M${f(cx + 15.6)} ${f(y0 - 4.4)}q-2.4 1.4 -5.4 1.8" stroke="#2a0e02" stroke-width=".5" fill="none" opacity=".6" stroke-linecap="round"/>`;
  // the crown: uneven short points along the top leaning outward from the middle, the taller ones throwing off a drop
  for (const [x, y, l, lean, dr] of [[-10.6, -12.8, 2.6, -2.2, 1], [-6.6, -13.6, 1.5, -.9, 0], [-2.9, -14.8, 3.4, -.6, 1], [.4, -13.6, 1.3, .2, 0], [3.3, -15, 2.8, .9, 1], [6.8, -13.6, 1.7, 1.3, 0], [10.2, -12.9, 2.4, 2.3, 1]]) {
    const x0 = cx + x, yb = y0 + y + .8, x1 = x0 + lean, y1 = yb - l;
    out += `<path d="M${f(x0 - .85)} ${f(yb)}Q${f(x1 - .15)} ${f((yb + y1) / 2 + .3)} ${f(x1)} ${f(y1)}Q${f(x1 + .15)} ${f((yb + y1) / 2 + .3)} ${f(x0 + .85)} ${f(yb)}Z" fill="#e2a040" stroke="#3a1404" stroke-width=".22"/>`;
    if (dr) { const r = .55 + l * .06, dx = x1 + lean * .45, dy = y1 - r - 1.1;
      out += `<circle cx="${f(dx)}" cy="${f(dy)}" r="${f(r)}" fill="#cc7e22" stroke="#3a1404" stroke-width=".2"/><circle cx="${f(dx - .25)}" cy="${f(dy - .25)}" r=".26" fill="#fff0c8"/>`; } }
  // the light on the liquid: a streak along the lit (left) shoulder and over the crown, a softer one on the right, glints
  out += `<path d="${smooth([[cx - 13.6, y0 - 5], [cx - 11.6, y0 - 9.6], [cx - 8.4, y0 - 12.4], [cx - 4, y0 - 13]])}" stroke="#fff0c8" stroke-width=".9" fill="none" opacity=".85" stroke-linecap="round"/>`
    + `<path d="${smooth([[cx + 4.6, y0 - 12.2], [cx + 9.4, y0 - 11.8], [cx + 12.6, y0 - 8.4]])}" stroke="#ffe2a8" stroke-width=".55" fill="none" opacity=".55" stroke-linecap="round"/>`
    + `<path d="${smooth([[cx - 7, y0 - 4.2], [cx - 3, y0 - 6.4], [cx + 2, y0 - 6.6]])}" stroke="#ffd890" stroke-width=".5" fill="none" opacity=".45" stroke-linecap="round"/>`
    + [[-10.4, -9.6, .7], [-2, -11.2, .5], [7.6, -10, .45], [-12.8, -4.6, .4]].map(([x, y, r]) => `<circle cx="${f(cx + x)}" cy="${f(y0 + y)}" r="${r}" fill="#ffffff" opacity=".9"/>`).join('');
  // drops flung to the sides on low arcs and falling back, stretched along their flight
  for (let i = 0; i < 16; i++) { const e = i % 2 ? 1 : -1, d = 15 + R() * 13, x = cx + e * d, y = y0 - 13 + (d - 15) * (d - 15) * .07 + (R() - .5) * 5, r = .4 + R() * .65, ang = e * (15 + (d - 15) * 4);
    out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.8)}" ry="${f(r)}" transform="rotate(${f(ang)} ${f(x)} ${f(y)})" fill="#a8520e" stroke="#3a1404" stroke-width=".2"/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .38)}" fill="#ffe0a0" opacity=".9"/>`; }
  return out;
}

module.exports = { name: 'Ром для всех', kind: 'deck', status: 'draft', variant: 's2', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 }), Lo = K.makeLight(lightOut, { horizon: 88 });
    const [vx, vy] = VP, ray = (x, y, k) => [vx + (x - vx) * k, vy + (y - vy) * k];
    const wl = k => vx - 100 * k, wr = k => vx + 100 * k, cy = k => vy - CEIL * k, fy = k => vy + FLOOR * k, k0 = FAR;
    const q = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
    // ——— the far bulkhead: upright planks, a door, a coat on a peg ———
    let bg = woodTex(u, wl(k0), cy(k0), wr(k0) - wl(k0), fy(k0) - cy(k0), '#4a2e18', '#24160a', '#0e0804', 9, true, 21);
    bg += `<rect x="92" y="62" width="14" height="${f(fy(k0) - 62)}" fill="#1e1208" stroke="#0a0502" stroke-width=".5"/><path d="M96.6 62V${f(fy(k0))}M101.4 62V${f(fy(k0))}" stroke="#0a0502" stroke-width=".4"/><circle cx="104" cy="77" r=".9" fill="#a88a4a"/>`
      + `<path d="M78 58q2.4 -1.6 4 0l1 13q-3 1.4 -6 0z" fill="#2a1e14" stroke="#0a0604" stroke-width=".4"/><path d="M${f(wl(k0))} ${f(fy(k0) - 1.5)}H${f(wr(k0))}" stroke="#0a0502" stroke-width="1"/>`;
    // ——— the deckhead overhead: planking to the vanishing point, beams across, two carlings ———
    { const cg = nid('cl', u), kt = (vy + 2) / CEIL; bg += `<defs>${linGrad(cg, 0, 0, 0, cy(k0), [[0, '#1a1008', 1], [1, '#3a2412', 1]])}</defs><path d="${q([[-4, -2], [204, -2], [wr(k0), cy(k0)], [wl(k0), cy(k0)]])}" fill="url(#${cg})"/>`;
      for (let i = -7; i <= 7; i++) { const e = ray(vx + i * 22, -2, k0 / kt); bg += `<path d="M${f(vx + i * 22)} -2L${f(e[0])} ${f(e[1])}" stroke="#0a0502" stroke-width=".5" opacity=".8"/>`; }
      for (const k of [.7, .52, .41]) { const y0 = cy(k), t = 3.4 * k, bm = nid('cb', u);
        bg += `<defs>${linGrad(bm, 0, y0 - t, 0, y0 + t, [[0, '#24160a', 1], [.5, '#4a2e16', 1], [1, '#9a6a3a', 1]])}</defs><path d="M${f(wl(k))} ${f(y0 - t)}H${f(wr(k))}V${f(y0 + t)}H${f(wl(k))}Z" fill="url(#${bm})" stroke="#0a0502" stroke-width=".5"/>`; } }
    // ——— the left side: the hull's inside, planks to the vanishing point, ribs; a shelf with bottles and mugs ———
    { const sw = nid('sw', u); bg += `<defs>${linGrad(sw, 0, 0, wl(k0), 0, [[0, '#24160a', 1], [1, '#3a2412', 1]])}</defs><path d="${q([[wl(1.3), cy(1.3)], [wl(k0), cy(k0)], [wl(k0), fy(k0)], [wl(1.3), fy(1.3)]])}" fill="url(#${sw})"/>`;
      for (let i = 1; i < 10; i++) { const y = cy(1.3) + (fy(1.3) - cy(1.3)) * i / 10, e = ray(wl(1.3), y, k0 / 1.3); bg += `<path d="M${f(wl(1.3))} ${f(y)}L${f(e[0])} ${f(e[1])}" stroke="#080402" stroke-width=".5" opacity=".7"/>`; }
      for (const k of [.45, .6, .85]) bg += `<path d="M${f(wl(k))} ${f(cy(k))}V${f(fy(k))}" stroke="#080402" stroke-width="${f(3.2 * k)}" opacity=".75"/><path d="M${f(wl(k) + 1.6 * k)} ${f(cy(k))}V${f(fy(k))}" stroke="#a87444" stroke-width=".4" opacity=".45"/>`;
      // the shelf along the side (in perspective) with a few bottles and hanging mugs
      const sh = k => [wl(k) + 6 * k, vy - 6 * k];
      bg += `<path d="${q([[wl(.85), vy - 6 * .85], [wl(.5), vy - 3], sh(.5), sh(.85)])}" fill="#5a3a1c" stroke="#0e0804" stroke-width=".4"/><path d="M${f(sh(.85)[0])} ${f(sh(.85)[1])}L${f(sh(.5)[0])} ${f(sh(.5)[1])}" stroke="#c08a52" stroke-width=".5" opacity=".7"/>`;
      for (const [k, kind] of [[.78, 'rum'], [.68, 'empty'], [.58, 'rum']]) { const p = [wl(k) + 3.4 * k, vy - 5.4 * k]; bg += K.bottle(u, L, { x: p[0], y: p[1], s: .62 * k / .7, kind, seed: Math.round(k * 10) }); } }
    // ——— the right side: the hull with an open gun port, the ally alongside out there ———
    { const sw = nid('rw', u); bg += `<defs>${linGrad(sw, wr(k0), 0, 200, 0, [[0, '#3a2412', 1], [1, '#1e1208', 1]])}</defs><path d="${q([[wr(1.3), cy(1.3)], [wr(k0), cy(k0)], [wr(k0), fy(k0)], [wr(1.3), fy(1.3)]])}" fill="url(#${sw})"/>`;
      for (let i = 1; i < 10; i++) { const y = cy(1.3) + (fy(1.3) - cy(1.3)) * i / 10, e = ray(wr(1.3), y, k0 / 1.3); bg += `<path d="M${f(wr(1.3))} ${f(y)}L${f(e[0])} ${f(e[1])}" stroke="#080402" stroke-width=".5" opacity=".7"/>`; }
      for (const k of [.45, .56, .92]) bg += `<path d="M${f(wr(k))} ${f(cy(k))}V${f(fy(k))}" stroke="#080402" stroke-width="${f(3.2 * k)}" opacity=".75"/>`;
      const pa = .6, pb = .86, top = k => vy + 4 * k, sill = k => vy + 34 * k, pq = [[wr(pa), top(pa)], [wr(pb), top(pb)], [wr(pb), sill(pb)], [wr(pa), sill(pa)]], cid = nid('pt', u);
      let o = K.sky(u, Lo, { horizon: 88, stars: 16, seed: 6, top: 60 }) + K.sunMoon(u, Lo, { r: 2.6 }) + K.water(u, Lo, { horizon: 88, bottom: 112, swell: .3, seed: 2, glitter: 178 })
        + K.ship(u, Lo, { kind: 'revenge', x: 174, y: 91, scale: .26, detail: 'mid', sails: 'furled', lights: true, seed: 4 })
        + K.localGlow(u, { x: 176, y: 86, color: '#ffc070', power: .35, radius: 10 }, { core: false });
      bg += `<defs><clipPath id="${cid}"><path d="${q(pq)}"/></clipPath></defs><g clip-path="url(#${cid})">${o}</g>`
        // the thickness of the hull round the port: the sill and the near jamb in the lantern light
        + `<path d="${q([pq[3], pq[2], [pq[2][0] - 2.4, pq[2][1] + 1.6], [pq[3][0] - 2, pq[3][1] + 1.4]])}" fill="#8a5a30" stroke="#0a0502" stroke-width=".4"/>`
        + `<path d="${q([pq[0], pq[3], [pq[3][0] - 2, pq[3][1] + 1.4], [pq[0][0] - 2, pq[0][1] + .6]])}" fill="#6a4424" stroke="#0a0502" stroke-width=".4"/>`
        + `<path d="${q(pq)}" fill="none" stroke="#0a0502" stroke-width=".9"/>`
        // the lid hauled up inside, its red inner face toward us, the tackle to the deckhead
        + `<path d="${q([[wr(pa), top(pa) - 1], [wr(pb), top(pb) - 1], [wr(pb) - 1, top(pb) - 18 * pb], [wr(pa) - 1, top(pa) - 18 * pa]])}" fill="#7a2418" stroke="#0a0502" stroke-width=".5"/>`
        + `<path d="M${f(wr(pa) + 3)} ${f(top(pa) - 18 * pa)}L${f(wr(pa) + 2)} ${f(cy(pa))}M${f(wr(pb) - 4)} ${f(top(pb) - 18 * pb)}L${f(wr(pb) - 5)} ${f(cy(pb) + 20)}" stroke="#5a4028" stroke-width=".55"/>`
        + PK.shafts(u, 180, 70, [[wr(pa), sill(pa), wr(pa) - 30, fy(.9)], [wr(pb), sill(pb), wr(pb) - 18, fy(1.1)]], '#9ab8e0', .05); }
    // ——— the deck: planks to the vanishing point, seams across ———
    { const fl = nid('fl', u); bg += `<defs>${linGrad(fl, 0, fy(k0), 0, 200, [[0, '#3a2412', 1], [1, '#1a0e06', 1]])}</defs><path d="${q([[wl(k0), fy(k0)], [wr(k0), fy(k0)], [wr(2.4), fy(2.4)], [wl(2.4), fy(2.4)]])}" fill="url(#${fl})"/>`;
      for (let i = -10; i <= 10; i++) { const a = [vx + i * 9 * k0, fy(k0)], e = ray(a[0], a[1], 2.4 / k0); bg += `<path d="M${f(a[0])} ${f(a[1])}L${f(e[0])} ${f(e[1])}" stroke="#0a0502" stroke-width=".5" opacity=".75"/>`; }
      for (const k of [.4, .5, .64, .84]) bg += `<path d="M${f(wl(k))} ${f(fy(k))}H${f(wr(k))}" stroke="#0a0502" stroke-width=".35" opacity=".5"/>`; }
    bg += `<path d="M${f(wl(1.3))} ${f(cy(1.3))}L${f(wl(k0))} ${f(cy(k0))}H${f(wr(k0))}L${f(wr(1.3))} ${f(cy(1.3))}M${f(wl(1.3))} ${f(fy(1.3))}L${f(wl(k0))} ${f(fy(k0))}V${f(cy(k0))}M${f(wr(1.3))} ${f(fy(1.3))}L${f(wr(k0))} ${f(fy(k0))}V${f(cy(k0))}" stroke="#060302" stroke-width="1" fill="none" opacity=".85"/>`;
    // hammocks slung fore and aft along both sides under the beams, sleepers in them; the lantern's light under them
    bg += hammock(u, L, [4, 8], [46, 30], 9, 6, true) + hammock(u, L, [196, 8], [146, 30], 9, 6, true);
    // the open cask of rum standing on the deck by the side, a ladle in it
    { const k = .62, x = wl(k) + 14, y = fy(k);
      bg += K.castShadow(u, L, { x, y, w: 21 * .95, h: 30 * .95, horizon: HZ, d: .9, opacity: .55 }) + K.barrel(u, L, { x, y, s: .95, kind: 'rum', open: true, seed: 6 })
        + K.shadeCyl(u, x - 2, y - 28, x + 7, y - 40, .7, L, 'brass', { outline: .3 }); }
    bg += K.localGlow(u, { x: LAMP.x, y: LAMP.y - 8, color: '#ff9a40', power: .55, radius: 90 }, { core: false });
    // ——— the mess table in front (its top under the glass), a bottle and a pool of spilled rum on it ———
    { const ty0 = 118, ty1 = 150, tx = (y, s) => vx + s * 74 * (y - vy) / (ty1 - vy), tt = nid('tt', u);
      const top = [[tx(ty0, -1), ty0], [tx(ty0, 1), ty0], [tx(ty1, 1), ty1], [tx(ty1, -1), ty1]];
      bg += `<defs>${linGrad(tt, 0, ty0, 0, ty1, [[0, '#4a2e16', 1], [1, '#7a4e2a', 1]])}</defs><path d="${q(top)}" fill="url(#${tt})" stroke="#0e0804" stroke-width=".5"/>`;
      for (let i = 1; i < 8; i++) { const t = i / 8, a = [lerp(top[0][0], top[1][0], t), ty0], b = [lerp(top[3][0], top[2][0], t), ty1]; bg += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#2a1608" stroke-width=".5" opacity=".7"/>`; }
      bg += `<path d="M${f(top[0][0])} ${ty0}H${f(top[1][0])}" stroke="#c08a52" stroke-width=".5" opacity=".6"/>`
        + `<path d="${q([[tx(ty1, -1), ty1], [tx(ty1, 1), ty1], [tx(ty1, 1), ty1 + 8], [tx(ty1, -1), ty1 + 8]])}" fill="#2a180a"/><path d="M${f(tx(ty1, -1))} ${ty1}H${f(tx(ty1, 1))}" stroke="#e0aa6a" stroke-width=".7" opacity=".7"/>`
        + `<rect x="0" y="${ty1 + 8}" width="200" height="${f(280 - ty1 - 8)}" fill="#120a04"/>`
        + K.localGlow(u, { x: 80, y: 130, color: '#ffb050', power: .4, radius: 60 }, { squash: .35, core: false })
        + `<path d="M74 131q16 -4 30 -1q8 3 -6 6q-18 3 -24 -5z" fill="#4a1a04" opacity=".75"/><path d="M80 130.6q10 -2 20 0" stroke="#ffc070" stroke-width=".6" fill="none" opacity=".8"/>`;
      bg += K.castShadow(u, L, { x: 112, y: 127, w: 9 * 1.25, h: 20 * 1.25, horizon: HZ, d: .9, opacity: .6 }) + K.bottle(u, L, { x: 112, y: 127, s: 1.25, kind: 'rum', seed: 3 }); }
    let fg = '';
    // the lantern on its rope from the beam: the one light below decks
    fg += K.lantern(u, L, { ...LAMP, seed: 4 }) + K.localGlow(u, { x: lamp.x, y: lamp.y, color: '#ffd080', power: .8, radius: 22 });
    // the two mugs knocked together, the hands round them, the arms from the lower corners: a black coat (left), a
    // sailor's bare forearm with a bandage at the wrist in a rolled brown sleeve (right) — two crews, one toast
    const MS = 2.76, ML = mugFrame(80, 104, 16), MR = mugFrame(119.3, 102, -16), rL = 12.6, HL = 30.4, rR = 4.6 * MS, HR = 11 * MS;
    const hL = gripHand(u, ML, rL, HL, -1, ['#f2c8a0', '#c48e64', '#6a3a22'], true), hR = gripHand(u, MR, rR, HR, 1, ['#e4ae84', '#a8714a', '#4a2614'], false);
    fg += tinMug(u, L, ML, rL, HL, -1) + hL.back
      + arm(u, L, { x0: -26, y0: 250, x1: hL.wrist[0] + 1, y1: hL.wrist[1] + 1, w0: 60, w1: 17.6, cloth: ['#4a4a56', '#24242c', '#0a0a0e'], cuff: ['#3a3a44', '#101014'], side: -1, seed: 3 }) + hL.front;
    fg += K.mug(u, L, { x: 119.3, y: 102, s: MS, rot: -16, fill: 'rum', seed: 4, contact: false }) + hR.back
      + arm(u, L, { x0: 226, y0: 250, x1: hR.wrist[0] - 1, y1: hR.wrist[1] + 1, w0: 58, w1: 16.8, cloth: ['#8a5a3a', '#5a341e', '#24120a'], cuff: ['#9a6a44', '#3a2010'], bare: true, side: 1, seed: 5 }) + hR.front;
    // the rum leaping up where the rims meet
    { const a = ML(rL * .45, -HL), b = MR(-rR * .45, -HR); fg += splash(u, a, b) + K.localGlow(u, { x: (a[0] + b[0]) / 2, y: Math.min(a[1], b[1]) - 10, color: '#ffc070', power: .35, radius: 26 }, { core: false }); }
    // light: the lantern's warmth, the dark round the edges and under the glass
    fg += glow(u, lamp.x, lamp.y, 80, 60, '#ffb050', .18) + motes(16, 30, 20, 140, 80, '#ffe0b0', 7)
      + gloom(u, 60, 40, 200, 140, .3) + gloom(u, 100, 150, 100, 280, .5);
    return [bg, fg];
  } };
