// «Тиа Дальма» (Жемчужина, ПРИКАЗ: посмотрите 3 верхние карты Колоды моря, верните их в любом порядке; возьмите 2 карты),
// refined from the first-round scene (portrait-pearl.cjs SCENES['Тиа Дальма']): the witch's hut in the swamp. Jars on
// strings hang from the beam, a shelf of herbs and pots on the back wall, a round window to the fog and the moon over
// the mangroves; on the table three sea cards lie face down in a row, two live crabs crawl over them, thrown crab claws,
// little bones beside. Added from the brief (the find — погода в отражении): a wide wooden bowl
// of water at the back of the table that does not mirror the hut's ceiling but tomorrow's sky — a storm, a fork of
// lightning, a whitecap.
// Fixed against the first round: the room was a flat wall with things stuck on it — now a hut in 2.5D (back wall,
// side walls, the ceiling and the table top running to one vanishing point at eye level, nearer things bigger); the
// jars hung at random heights in front of the wall with no beam — now on strings from the beam, the near ones bigger;
// the cards were flat stickers — now they lie in the table's plane with a thickness and a shadow; the crabs were
// red blots — now jointed crabs with claws and legs, standing on the cards; candles stood unlit on the shelf — now a
// cluster of tallow candles on the table is the one warm light (the cards, crabs and bowl lit from the left).
// Light: the candles at the left back of the table (key, warm); the moon through the fog in the window (cold fill);
// the bowl's storm a faint cold glow of its own.
// Step 3 pass (print kit): the crabs' eight legs fan round the shell (front pair forward, rear pair swept back,
// pointed tips) instead of four stacked ribbons; the tall candle shows its flame (no white glow blob); the jar that
// stood on the shelf behind a hanging one is gone, the hanging ones hang clear of the shelf; rain and a tiny heeled
// ship in the bowl's storm; a string of glass beads, a black feather, a thread of candle smoke on the table.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, glow, gloom, motes } = PK;

const HZ = 46, VX = 100, FOC = 160;              // eye level, vanishing point, focal length (a high 3/4 view of the table)
const BW = { x0: 30, x1: 170, y0: 4, y1: 80 };    // the back wall
const TB = 84;                                    // the table's back edge
const WIN = { x: 122, y: 42, r: 14.5 };           // the round window
const CAND = [{ x: 40, y: 94, s: 1.55, len: 15 }, { x: 55, y: 90, s: 1.2, len: 9 }, { x: 30, y: 98, s: 1.3, len: 6 }];
const FL = { x: 40.2, y: 94 - 1.55 * (3.4 + 15 + 3) };
const BOWL = { x: 100, y: 89, rx: 25 };
const CARDS = [{ x: 58, y: 111, a: -6 }, { x: 101, y: 113, a: 2 }, { x: 144, y: 110, a: 7 }];
const light = { time: 'night', haze: .35, key: { type: 'point', x: FL.x, y: FL.y, h: .45, gy: 94, color: '#ffb860', power: 1, radius: 120 },
  fill: { color: '#3a5a5a', power: .4 }, rim: { az: 30, color: '#b8e0d0', power: .35 }, locals: [{ x: WIN.x, y: WIN.y, color: '#b8e0d0', power: .3, radius: 40 }] };
const skel = { horizon: HZ, eye: 1.2, light: 'tallow candles at the left back of the table (key, warm) + the moon through the fog in the window (cold fill)', items: [
  ['back wall', BW.x0, BW.y1, BW.x1 - BW.x0, BW.y1 - BW.y0, 'floor'], ['window', WIN.x - WIN.r - 3, WIN.y + WIN.r + 3, 2 * WIN.r + 6, 2 * WIN.r + 6, 'back wall'],
  ['shelf', 36, 60, 52, 22, 'back wall (two brackets)'], ['beam', -10, 9, 220, 9, 'side walls'], ['jars', 60, 82, 108, 70, 'strings from the beam'],
  ['table', 0, 280, 200, 280 - TB, 'floor'], ['candles', 22, 98, 40, 34, 'table top'], ['bowl', BOWL.x - BOWL.rx, BOWL.y + 6, BOWL.rx * 2, 14, 'table top'],
  ['cards', 42, 121, 118, 22, 'table top, face down'], ['crabs', 30, 120, 146, 26, 'on the cards'], ['bones, claws', 60, 130, 120, 20, 'table top']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${P2(pts[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${P2(p2)}`; }
  return d + (closed ? 'Z' : ''); }
// the point on the ray from the vanishing point through p, at x = X (for the side walls) or at y = Y (the floor)
const atX = (p, X) => { const t = (X - VX) / (p[0] - VX); return [X, HZ + (p[1] - HZ) * t]; };
const atY = (p, Y) => { const t = (Y - HZ) / (p[1] - HZ); return [VX + (p[0] - VX) * t, Y]; };
// a point on the table plane round (x0, y0): (lx, ly) in table units, turned by a, squashed by the view at that depth
const kAt = y => (y - HZ) / FOC;
const onTable = (x0, y0, a = 0) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), k = kAt(y0); return (lx, ly) => [x0 + lx * c - ly * s, y0 + (lx * s + ly * c) * k]; };

// a sea card lying face down: a cream border with its thickness, the deep-teal field, rows of gold waves, a small star rose
function seaCard(u, L, x, y, a) {
  const P = onTable(x, y, a), w = 15, h = 21, rc = 1.6, out = [];
  const rr = (hw, hh, r) => { const pts = []; for (const [cx, cy, a0] of [[hw - r, -hh + r, -90], [hw - r, hh - r, 0], [-hw + r, hh - r, 90], [-hw + r, -hh + r, 180]])
    for (let i = 0; i <= 3; i++) { const t = (a0 + i * 30) * Math.PI / 180; pts.push(P(cx + Math.cos(t) * r, cy + Math.sin(t) * r)); } return pts; };
  const sh = nid('tcs', u), lit = L.at(x, y);
  // the shadow away from the candles (to the right and toward us)
  out.push(`<defs><filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".8"/></filter></defs>`
    + `<path d="${poly(rr(w, h, rc).map(p => [p[0] - lit.ux * 1.6, p[1] - lit.uy * 1.2 + .6]))}" fill="#0a0402" opacity=".6" filter="url(#${sh})"/>`);
  out.push(`<path d="${poly(rr(w, h, rc).map(p => [p[0], p[1] + .8]))}" fill="#6a5034"/>`);
  { const g = nid('tcf', u), a0 = P(-w, -h), a1 = P(w, h);
    out.push(`<defs>${linGrad(g, a0[0], a0[1], a1[0], a1[1], [[0, '#f6e8c4', 1], [1, '#a8946a', 1]])}</defs><path d="${poly(rr(w, h, rc))}" fill="url(#${g})" stroke="#3a2a14" stroke-width=".35"/>`); }
  { const g = nid('tcd', u), a0 = P(-w, -h), a1 = P(w, h);
    out.push(`<defs>${linGrad(g, a0[0], a0[1], a1[0], a1[1], [[0, '#2a6a6a', 1], [.6, '#164848', 1], [1, '#0c2c30', 1]])}</defs><path d="${poly(rr(w - 1.5, h - 1.5, 1))}" fill="url(#${g})"/>`); }
  out.push(`<path d="${poly(rr(w - 2.6, h - 2.6, .6))}" fill="none" stroke="#c9a048" stroke-width=".35" opacity=".85"/>`);
  for (let i = -3; i <= 3; i++) { if (Math.abs(i) < 1) continue; const pts = []; for (let k = 0; k <= 12; k++) { const lx = -w + 3 + k / 12 * (2 * w - 6); pts.push(P(lx, i * 4.2 + Math.sin(k * 1.6) * .9)); }
    out.push(`<path d="${smooth(pts)}" stroke="#c9a048" stroke-width=".4" fill="none" opacity=".7"/>`); }
  const star = []; for (let i = 0; i < 16; i++) { const r = i % 4 === 0 ? 5.4 : i % 2 ? 1.8 : 3.2, t = i / 16 * Math.PI * 2 - Math.PI / 2; star.push(P(Math.cos(t) * r, Math.sin(t) * r)); }
  { const c = P(0, 0), k = kAt(y); out.push(`<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="4" ry="${f(4 * k)}" fill="#0c2c30" stroke="#c9a048" stroke-width=".4"/><path d="${poly(star)}" fill="#e2bc5c" stroke="#5a3a0c" stroke-width=".2"/>`); }
  // the candle's sheen on the card's left edge
  out.push(`<path d="${smooth([P(-w + .3, h - 2), P(-w + .3, -h + 2)])}" stroke="#fff4d8" stroke-width=".5" opacity=".8"/>`);
  return out.join('');
}

// a live crab, seen from above at the table's slant: (x, y) the middle of the shell, a — the way it faces (0 — toward
// us), s — size; the shell domed (lit on the candle's side, a rim of bumps and teeth), eyes on stalks, two claws (the
// big one raised), four jointed legs a side, tips on the support
function crab(u, L, x, y, s, a, o = {}) {
  const k = .55 + kAt(y) * .6, la = L.at(x, y), lx = la.ux, ly = la.uy, R = rng(o.seed || 3);
  const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
  const P = (px, py, pz = 0) => [x + (px * ca - py * sa) * s, y + ((px * sa + py * ca) * kAt(y) * 2.1 - pz) * s];   // local: x across, y forward (+ toward the face), z up
  const shell = '#b8401e', dark = '#4a1004', lit = '#ff9a5a';
  let back = '', out = '';
  // the shadow on the support
  { const b = nid('tcb', u); back += `<defs><filter id="${b}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${f(.9 * s)}"/></filter></defs>`
      + `<ellipse cx="${f(x - lx * 2 * s)}" cy="${f(y - ly * 1.2 * s + 1.4 * s)}" rx="${f(10 * s)}" ry="${f(4.4 * s)}" fill="#0a0402" opacity=".55" filter="url(#${b})"/>`; }
  // the legs: four pairs, short and thick, from the shell's sides; each a raised thigh and a short shin down to the
  // tip, the front pair out to the side, the rear pairs swept back (a crab's walking legs, not a spider's)
  // each leg leaves the shell's side at its own angle (the front pair angled forward, the rear pair swept back), so the
  // eight legs fan round the shell; a raised knee, a shin down to the ankle, a pointed dark tip on the support
  const leg = (side, i) => { const th = (24 - i * 27) * Math.PI / 180, dx = side * Math.cos(th), dy = Math.sin(th), rr = (a, z) => [r0[0] + dx * a, r0[1] + dy * a - (i > 1 ? (i - 1) * .8 * a / 12 : 0), z];
    const r0 = [side * 8.2 * Math.cos(th * .8), 4.6 * Math.sin(th * .9) + .4, 1.8];
    const A = P(...r0), B = P(...rr(5, 5)), C = P(...rr(9.2, 2.2)), D = P(...rr(11.2, 0)), wd = (2.5 - i * .2) * s;
    const pth = `M${P2(A)}L${P2(B)}L${P2(C)}`;
    return `<path d="${pth}" stroke="${dark}" stroke-width="${f(wd + .7)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${pth}" stroke="${shell}" stroke-width="${f(wd)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M${P2(A)}L${P2(B)}" stroke="${lit}" stroke-width="${f(wd * .32)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(${f(lx * .35 * s)} ${f(ly * .35 * s)})"/>`
      + `<circle cx="${f(B[0])}" cy="${f(B[1])}" r="${f(wd * .4)}" fill="${dark}" opacity=".5"/><circle cx="${f(C[0])}" cy="${f(C[1])}" r="${f(wd * .32)}" fill="${dark}" opacity=".45"/>`
      + `<path d="M${P2(C)}L${P2(D)}" stroke="${dark}" stroke-width="${f(wd * .75)}" stroke-linecap="round"/><path d="M${P2(C)}L${P2(D)}" stroke="#d86a3a" stroke-width="${f(wd * .4)}" stroke-linecap="round" opacity=".8"/>`; };
  for (const sd of [-1, 1]) for (let i = 3; i >= 0; i--) back += leg(sd, i);
  // the claws: an arm in two segments forward and out, the pincer (palm and two fingers); one raised (z up), one low
  const claw = (side, raise, big) => { const sc = big ? 1.45 : 1.25, cs = big ? 1.3 : 1.18, C = (px, py, pz) => P(px * cs, py * cs, pz),
      sh0 = C(side * 4.6, 3.6, 1.6), el = C(side * 8.4, 7.4, 2 + raise * .5), wr = C(side * 7, 11.6, 2 + raise),
      tipA = C(side * (4.4 - raise * .2), 16.6, 2 + raise * 1.3), tipB = C(side * 2.6, 13.6, 1.6 + raise * .6);
    let c = `<path d="M${P2(sh0)}L${P2(el)}L${P2(wr)}" stroke="${dark}" stroke-width="${f(3.6 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${P2(sh0)}L${P2(el)}L${P2(wr)}" stroke="${shell}" stroke-width="${f(2.7 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    // the palm: a swollen oval along wrist → fingers; the fixed finger and the movable one, slightly open
    const g = nid('tcl', u), mid = [(wr[0] + tipA[0]) / 2, (wr[1] + tipA[1]) / 2], ang = Math.atan2(tipA[1] - wr[1], tipA[0] - wr[0]) * 180 / Math.PI, len = Math.hypot(tipA[0] - wr[0], tipA[1] - wr[1]);
    c += `<defs>${radGrad(g, mid[0] + lx * 1.4 * s, mid[1] + ly * 1.4 * s, 4 * s * sc, [[0, '#ffc08a', 1], [.35, '#e0602e', 1], [.8, '#8a2008', 1], [1, '#3a0802', 1]])}</defs>`
      + `<ellipse cx="${f(lerp(wr[0], mid[0], .7))}" cy="${f(lerp(wr[1], mid[1], .7))}" rx="${f(len * .56)}" ry="${f(3.3 * s * sc)}" transform="rotate(${f(ang)} ${f(lerp(wr[0], mid[0], .7))} ${f(lerp(wr[1], mid[1], .7))})" fill="url(#${g})" stroke="${dark}" stroke-width=".35"/>`;
    const f0 = C(side * (4.6 - raise * .2), 14.2, 2 + raise * 1.1), fA = tipA, fB = tipB;
    c += `<path d="M${P2(f0)}Q${f(lerp(f0[0], fA[0], .5) + side * .6 * s)} ${f(lerp(f0[1], fA[1], .5))} ${P2(fA)}" stroke="${dark}" stroke-width="${f(1.4 * s * sc)}" fill="none" stroke-linecap="round"/><path d="M${P2(f0)}Q${f(lerp(f0[0], fA[0], .5) + side * .6 * s)} ${f(lerp(f0[1], fA[1], .5))} ${P2(fA)}" stroke="#d8582a" stroke-width="${f(.8 * s * sc)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${P2(f0)}Q${f(lerp(f0[0], fB[0], .5) - side * .8 * s)} ${f(lerp(f0[1], fB[1], .5) + .6 * s)} ${P2(fB)}" stroke="${dark}" stroke-width="${f(1.2 * s * sc)}" fill="none" stroke-linecap="round"/><path d="M${P2(f0)}Q${f(lerp(f0[0], fB[0], .5) - side * .8 * s)} ${f(lerp(f0[1], fB[1], .5) + .6 * s)} ${P2(fB)}" stroke="#c84a20" stroke-width="${f(.7 * s * sc)}" fill="none" stroke-linecap="round"/>`
      + `<circle cx="${f(fA[0])}" cy="${f(fA[1])}" r="${f(.35 * s)}" fill="#1a0602"/><circle cx="${f(fB[0])}" cy="${f(fB[1])}" r="${f(.3 * s)}" fill="#1a0602"/>`;
    return c; };
  out += claw(-1, o.raiseL || 0, o.big === -1) + claw(1, o.raiseR || 0, o.big === 1);
  // the shell: a wide domed oval, wider at the front, with a row of teeth along the front edge and the eyes
  { const g = nid('tcs', u), pts = []; for (let i = 0; i < 26; i++) { const t = i / 26 * Math.PI * 2, rx = 9.6 + (Math.sin(t) > 0 ? 1.4 * Math.sin(t) : -.8 * Math.sin(t)), ry = 5.8 - (Math.sin(t) < 0 ? .8 * -Math.sin(t) : 0), tooth = Math.sin(t) > .2 ? (i % 2 ? .6 : 0) : 0;
      pts.push(P(Math.cos(t) * (rx + tooth), Math.sin(t) * (ry + tooth * .6), 2.4)); }
    const c = P(0, 0, 2.4);
    out += `<defs>${radGrad(g, c[0] + lx * 3 * s, c[1] + ly * 2.2 * s - .8 * s, 9 * s, [[0, '#ffc898', 1], [.22, '#f07a40', 1], [.6, '#b03814', 1], [.9, '#5a1406', 1], [1, '#3a0802', 1]])}</defs>`
      + `<path d="${smooth(pts, true)}" fill="url(#${g})" stroke="#2a0602" stroke-width=".45"/>`
      // grooves and bumps on the shell, the speckle
      + `<path d="M${P2(P(-3.6, -2.4, 2.4))}Q${P2(P(0, 0, 3))} ${P2(P(3.6, -2.4, 2.4))}M${P2(P(-2, 2, 2.4))}Q${P2(P(0, .6, 3))} ${P2(P(2, 2, 2.4))}" stroke="#5a1406" stroke-width="${f(.35 * s)}" fill="none" opacity=".7"/>`
      + Array.from({ length: 9 }, () => { const p = P((R() - .5) * 13, (R() - .5) * 6, 2.8); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.3 * s)}" fill="${R() > .5 ? '#ffd8a8' : '#6a1a08'}" opacity=".6"/>`; }).join('')
      + `<ellipse cx="${f(c[0] + lx * 2.6 * s)}" cy="${f(c[1] + ly * 1.6 * s - .9 * s)}" rx="${f(3 * s)}" ry="${f(1 * s)}" fill="#fff0d8" opacity=".55"/>`;
    for (const sd of [-1, 1]) { const e0 = P(sd * 1.6, 5, 2.6), e1 = P(sd * 2.2, 6.4, 4.4);
      out += `<path d="M${P2(e0)}L${P2(e1)}" stroke="#5a1406" stroke-width="${f(.7 * s)}" stroke-linecap="round"/><circle cx="${f(e1[0])}" cy="${f(e1[1])}" r="${f(.8 * s)}" fill="#0a0202"/><circle cx="${f(e1[0] + lx * .3 * s)}" cy="${f(e1[1] - .3 * s)}" r="${f(.28 * s)}" fill="#fff"/>`; } }
  return back + out;
}

// a jar of greenish blown glass hanging on a string: a body with shoulders, a liquid with its level, something in it,
// a cork tied with twine; the candle's highlight and the background showing through
function jar(u, L, x, y, s, col, inside = '') {
  const g = nid('tjg', u), q = nid('tjq', u), h = 16 * s, w = 6 * s, la = L.at(x, y + h / 2), hs = -Math.sign(la.ux || -1);
  const body = `M${f(x - w * .55)} ${f(y + 2.4 * s)}h${f(w * 1.1)}v${f(1.2 * s)}q${f(w * .45)} ${f(.6 * s)} ${f(w * .45)} ${f(3 * s)}v${f(h - 9.5 * s)}q0 ${f(2.2 * s)} ${f(-w * .4)} ${f(2.4 * s)}h${f(-w * 1.2)}q${f(-w * .4)} ${f(-.2 * s)} ${f(-w * .4)} ${f(-2.4 * s)}v${f(-(h - 9.5 * s))}q0 ${f(-2.4 * s)} ${f(w * .45)} ${f(-3 * s)}z`;
  const lv = y + 8 * s;
  let out = `<defs>${linGrad(g, x - w, 0, x + w, 0, [[0, '#0e1a16', .7], [.25, '#8ab89a', .25], [.6, '#1a2a24', .12], [1, '#0a120e', .7]])}<clipPath id="${q}"><path d="${body}"/></clipPath></defs>`;
  out += `<path d="${body}" fill="#0a0e0c" opacity=".35"/><g clip-path="url(#${q})"><rect x="${f(x - w)}" y="${f(lv)}" width="${f(2 * w)}" height="${f(h)}" fill="${col}" opacity=".95"/>`
    + `<ellipse cx="${f(x)}" cy="${f(lv)}" rx="${f(w)}" ry="${f(1.1 * s)}" fill="${mix(col, '#ffffff', .3)}" opacity=".7"/>${inside}`
    + `<rect x="${f(x - w)}" y="${f(lv)}" width="${f(2 * w)}" height="${f(h)}" fill="url(#${g})" opacity=".6"/></g>` + glow(u, x, lv + 3 * s, 7 * s, 6 * s, col, .35)
    + `<path d="${body}" fill="url(#${g})" stroke="#0a1410" stroke-width=".4"/>`
    // the candles' warm light from below left: a glow on the glass and a hot rim along that side and the base
    + glow(u, x - w * .35, y + h * .7, w * 1.1, h * .45, '#ffa850', .3)
    + `<path d="M${f(x - w * .98)} ${f(y + 6.6 * s)}v${f(h - 10.6 * s)}q0 ${f(2 * s)} ${f(w * .4)} ${f(2.3 * s)}h${f(w * .7)}" stroke="#ffb860" stroke-width="${f(.7 * s)}" fill="none" stroke-linecap="round" opacity=".85"/>`
    + `<path d="M${f(x - hs * w * .62)} ${f(y + 6.4 * s)}v${f(h - 10.4 * s)}" stroke="#fff4d8" stroke-width="${f(.6 * s)}" stroke-linecap="round" opacity=".75"/>`
    + `<circle cx="${f(x - hs * w * .5)} " cy="${f(y + 5.6 * s)}" r="${f(.5 * s)}" fill="#fff" opacity=".9"/>`
    + `<rect x="${f(x - w * .5)}" y="${f(y)}" width="${f(w)}" height="${f(2.6 * s)}" rx="${f(.4 * s)}" fill="#7a5430" stroke="#2a1606" stroke-width=".3"/>`
    + `<path d="M${f(x - w * .58)} ${f(y + 2.4 * s)}h${f(w * 1.16)}" stroke="#c8a070" stroke-width="${f(.5 * s)}"/>`;
  return out;
}

module.exports = { name: 'Тиа Дальма', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, f: FOC }), R = rng(23);
    const B = BW, cTL = [B.x0, B.y0], cTR = [B.x1, B.y0], cBL = [B.x0, B.y1], cBR = [B.x1, B.y1];
    const lTop = atX(cTL, -10), lBot = atX(cBL, -10), rTop = atX(cTR, 210), rBot = atX(cBR, 210);
    let bg = '';
    // ——— the back wall: rough vertical boards, gaps of fog light between some; warm near the candles ———
    { const g = nid('twl', u);
      bg += woodTex(u, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, '#3e2c1a', '#1c120a', '#080402', 10, true, 11)
        + `<defs>${radGrad(g, FL.x, FL.y, 120, [[0, '#ffb060', .38], [.35, '#ff9a40', .14], [1, '#ff9a40', 0]])}</defs><rect x="${B.x0}" y="${B.y0}" width="${B.x1 - B.x0}" height="${B.y1 - B.y0}" fill="url(#${g})"/>`
        + [[52, 10, 30], [86, 20, 40], [150, 40, 30]].map(([x, y, h]) => `<path d="M${x} ${y}v${h}" stroke="#7a9a8a" stroke-width=".5" opacity=".35"/>`).join('');
      // a fishing net hung on the wall over the shelf, with two floats and a few shells
      { let net = ''; for (let i = 0; i < 9; i++) { net += `<path d="M${f(36 + i * 6)} 14q${f(1 + R())} 12 ${f(-2 + R() * 2)} ${f(22 + R() * 6)}" stroke="#8a7a5a" stroke-width=".35" fill="none" opacity=".6"/>`; }
        for (let j = 0; j < 5; j++) net += `<path d="M34 ${f(16 + j * 5)}q12 ${f(2 + R() * 2)} 24 0t24 0" stroke="#8a7a5a" stroke-width=".35" fill="none" opacity=".55"/>`;
        bg += net + K.shadeSphere(u, 44, 30, 2.6, L, 'glass', { outline: .3 }) + K.shadeSphere(u, 74, 34, 2.2, L, 'paint-ochre', { outline: .3 })
          + [[54, 38], [64, 24], [36, 36]].map(([x, y]) => `<path d="M${x - 2} ${y}q2 -3.4 4 0q-2 1.4 -4 0z" fill="#e8dcc0" stroke="#6a5a40" stroke-width=".3"/>`).join(''); } }
    // ——— the side walls and the ceiling, in perspective ———
    { const gl = nid('tsl', u), gr = nid('tsr', u);
      bg += `<defs>${linGrad(gl, -10, 0, B.x0, 0, [[0, '#2a1a0c', 1], [1, '#4a3018', 1]])}${linGrad(gr, B.x1, 0, 210, 0, [[0, '#24180e', 1], [1, '#100a06', 1]])}</defs>`
        + `<path d="${poly([lTop, cTL, cBL, lBot])}" fill="url(#${gl})"/><path d="${poly([cTR, rTop, rBot, cBR])}" fill="url(#${gr})"/>`;
      // the boards of the side walls: vertical seams, closer together toward the back
      for (let i = 1; i < 7; i++) { const t = 1 - Math.pow(.66, i), xl = lerp(-10, B.x0, t), xr = lerp(210, B.x1, t);
        const a = atX(cTL, xl), b = atX(cBL, xl), c = atX(cTR, xr), d = atX(cBR, xr);
        bg += `<path d="M${P2(a)}L${P2(b)}" stroke="#0a0502" stroke-width="${f(1 - t * .6)}"/><path d="M${f(a[0] + .6)} ${f(a[1])}L${f(b[0] + .6)} ${f(b[1])}" stroke="#c08a52" stroke-width=".3" opacity="${f(.35 - t * .2)}"/>`
          + `<path d="M${P2(c)}L${P2(d)}" stroke="#050302" stroke-width="${f(1 - t * .6)}"/>`; }
      // the ceiling: thatch on poles running back to the vanishing point
      const g = nid('tcl', u);
      bg += `<defs>${linGrad(g, 0, -14, 0, B.y0, [[0, '#0e0904', 1], [1, '#24160a', 1]])}</defs><path d="${poly([[-10, -20], [210, -20], rTop, cTR, cTL, lTop])}" fill="url(#${g})"/>`;
      for (let i = 0; i <= 8; i++) { const x = B.x0 + i * (B.x1 - B.x0) / 8, a = atY([x, B.y0], -16); bg += `<path d="M${f(x)} ${B.y0}L${P2(a)}" stroke="#3a2412" stroke-width="${f(1.6 + Math.abs(x - VX) * .01)}"/><path d="M${f(x)} ${B.y0}L${P2(a)}" stroke="#0a0502" stroke-width=".4" transform="translate(.8 0)"/>`; }
      // the corners of the room
      bg += `<path d="M${P2(lTop)}L${P2(cTL)}L${P2(cBL)}M${P2(rTop)}L${P2(cTR)}L${P2(cBR)}" stroke="#050302" stroke-width="1" fill="none"/>`; }
    // ——— the round window: fog over the swamp, the moon, the mangroves' roots; a thick frame with a cross ———
    { const w = WIN, cp = nid('twc', u), sg = nid('tws', u);
      bg += `<defs><clipPath id="${cp}"><circle cx="${w.x}" cy="${w.y}" r="${w.r}"/></clipPath>${linGrad(sg, 0, w.y - w.r, 0, w.y + w.r, [[0, '#0c1a1c', 1], [.55, '#2a4a46', 1], [1, '#5a7a70', 1]])}</defs>`
        + `<g clip-path="url(#${cp})"><rect x="${w.x - w.r}" y="${w.y - w.r}" width="${2 * w.r}" height="${2 * w.r}" fill="url(#${sg})"/>`
        + `<circle cx="${w.x + 5}" cy="${w.y - 6}" r="3.6" fill="#eef6ec"/><circle cx="${w.x + 5}" cy="${w.y - 6}" r="9" fill="#d8f0e0" opacity=".18"/>`
        + `<path d="M${w.x - 16} ${w.y + 6}q6 -4 12 -1q6 -5 13 -1q6 -3 12 1v20h-37z" fill="#16282a"/>`
        + [[-10, 1], [-4, -1], [6, 1], [11, -1]].map(([dx, sd]) => `<path d="M${w.x + dx} ${w.y + 16}q${sd * 2} -6 ${sd * -1} -12M${w.x + dx} ${w.y + 16}q${sd * -3} -5 ${sd * 1.6} -9" stroke="#0a1414" stroke-width="1.3" fill="none"/>`).join('')
        + `<rect x="${w.x - w.r}" y="${w.y + 3}" width="${2 * w.r}" height="9" fill="#b8e0d0" opacity=".28"/><rect x="${w.x - w.r}" y="${w.y + 8}" width="${2 * w.r}" height="10" fill="#c8e8dc" opacity=".22"/></g>`
        + `<path d="M${w.x - w.r} ${w.y}h${2 * w.r}M${w.x} ${w.y - w.r}v${2 * w.r}" stroke="#1e1208" stroke-width="1.8"/><path d="M${w.x - w.r} ${w.y - .7}h${2 * w.r}M${w.x - .7} ${w.y - w.r}v${2 * w.r}" stroke="#7a6a4a" stroke-width=".35" opacity=".6"/>`
        + `<circle cx="${w.x}" cy="${w.y}" r="${w.r + 1.6}" fill="none" stroke="#1a0e06" stroke-width="3.6"/><circle cx="${w.x}" cy="${w.y}" r="${w.r + 1.6}" fill="none" stroke="#6a4a2a" stroke-width="2.2"/>`
        + `<path d="M${w.x - w.r - 1.4} ${w.y + 3}A${w.r + 1.6} ${w.r + 1.6} 0 0 1 ${w.x - 2} ${w.y - w.r - 1.5}" stroke="#ffc080" stroke-width=".6" fill="none" opacity=".6"/>`
        + `<path d="M${w.x + w.r * .3} ${w.y + w.r + 1.4}A${w.r + 1.6} ${w.r + 1.6} 0 0 0 ${w.x + w.r + 1.5} ${w.y + 2}" stroke="#b8e0d0" stroke-width=".5" fill="none" opacity=".5"/>`
        // a shell wind-chime under the window
        + [0, 1, 2].map(k => `<path d="M${w.x - 6 + k * 6} ${w.y + w.r + 3}v${4 + k * 2}" stroke="#8a7a5a" stroke-width=".3"/><path d="M${w.x - 7.2 + k * 6} ${w.y + w.r + 7 + k * 2}q1.2 -2.4 2.4 0q-1.2 1 -2.4 0z" fill="#e8dcc0" stroke="#6a5a40" stroke-width=".25"/>`).join(''); }
    // ——— the shelf on the back wall, left: a plank on two brackets; pots of herbs, a small skull, jars, a bundle ———
    { const y = 60, x0 = 36, x1 = 88;
      bg += `<path d="M${x0} ${y}h${x1 - x0}v3.4h${x0 - x1}z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/><path d="M${x0} ${y}h${x1 - x0}" stroke="#ffc888" stroke-width=".5" opacity=".7"/>`
        + `<path d="M${x0 + 4} ${y + 3.4}l5 7M${x1 - 4} ${y + 3.4}l-5 7" stroke="#2a1a0a" stroke-width="1.8"/>`
        + `<path d="M${x0} ${y + 3.6}h${x1 - x0}l-2 3h${x0 - x1 + 4}z" fill="#000" opacity=".35"/>`;
      // pots with herbs
      for (const [x, c, hc] of [[42, '#7a4a2a', '#6a8a3a'], [56, '#8a5a34', '#8a7a4a']]) {
        bg += K.shadeCyl(u, x, y, x, y - 6, 3, L, 'paint-ochre', { r1: 2.6, r2: 3.2, ell: .25, face: 2, outline: .35 })
          + Array.from({ length: 6 }, (_, k) => `<path d="M${x - 1 + k * .4} ${y - 6}q${f(-4 + k * 1.6)} ${f(-5 - R() * 3)} ${f(-5 + k * 2)} ${f(-9 - R() * 3)}" stroke="${mix(hc, '#2a3a1a', R() * .4)}" stroke-width=".7" fill="none"/>`).join(''); }
      // a small animal skull, its eye holes dark
      bg += `<path d="M66 ${y}q-1 -6 4 -7q5 -.4 5.4 4.4q.2 2.6 -2 2.6z" fill="#d8ccb0" stroke="#4a3a24" stroke-width=".35"/><circle cx="70" cy="${y - 4}" r="1.1" fill="#1a0e06"/><path d="M73 ${y - 1}h2.6" stroke="#4a3a24" stroke-width=".4"/>`
        + `<path d="M66.4 ${y - 5.6}q2 -1.6 4.4 -1.2" stroke="#fff4d8" stroke-width=".5" fill="none" opacity=".7"/>`; }
    // ——— the table: planks running back to the vanishing point; its sides receding; the floor beyond, dark ———
    { const tl = [B.x0 + 4, TB], tr = [B.x1 - 4, TB], nl = atY(tl, 290), nr = atY(tr, 290), cp = nid('ttc', u);
      bg += `<rect x="-10" y="${B.y1}" width="220" height="210" fill="#0a0604"/><path d="M${P2(cBL)}L${P2(lBot)}M${P2(cBR)}L${P2(rBot)}" stroke="#1a0e06" stroke-width=".8"/>`
        + `<path d="${poly([cBL, cBR, rBot, [210, 290], [-10, 290], lBot])}" fill="#120a06"/>`
        + `<defs><clipPath id="${cp}"><path d="${poly([tl, tr, nr, nl])}"/></clipPath></defs><g clip-path="url(#${cp})">${K.deck(u, L, { horizon: HZ, top: TB, bottom: 290, vx: VX, kind: 'oak', plank: 13, seed: 9 })}</g>`
        // the table's back edge, a thin lit lip; its side thickness
        + `<path d="M${P2(tl)}L${P2(tr)}" stroke="#ffcc90" stroke-width=".7" opacity=".7"/><path d="M${P2(tl)}L${P2(nl)}L${f(nl[0])} 300L${f(tl[0])} ${TB + 4}Z" fill="#2a180a"/>`
        + `<path d="M${P2(tr)}L${P2(nr)}L${f(nr[0])} 300L${f(tr[0])} ${TB + 4}Z" fill="#140a04"/>`
        // stains, wax drops, scratches on the top
        + [[76, 102, 9], [150, 124, 6], [30, 128, 7]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * kAt(y))}" fill="#140a04" opacity=".35"/>`).join(''); }
    // ——— the beam across the near ceiling, and the jars hanging from it on strings (near ones bigger) ———
    let fg = '';
    const beamY = 6;
    fg += K.shadeBox(u, [{ pts: [[-10, beamY + 7], [210, beamY + 7], [210, beamY + 10], [-10, beamY + 10]], n: 'bottom', grain: [1, 0] }, { pts: [[-10, beamY - 6], [210, beamY - 6], [210, beamY + 7], [-10, beamY + 7]], n: 'front', grain: [1, 0] }], L, 'oak', { seed: 5, outline: .5 });
    // the top of the hut sinks into the dark (the candles are low on the table): the wall, the net and the beam dimmed
    { const g = nid('ttd', u); fg += `<defs>${linGrad(g, 0, -10, 0, 66, [[0, '#040201', .78], [.55, '#040201', .5], [1, '#040201', 0]])}</defs><rect x="-10" y="-20" width="220" height="86" fill="url(#${g})"/>`
        + glow(u, WIN.x, WIN.y, WIN.r + 2, WIN.r + 2, '#b8e0d0', .22); }
    { const J = [[69, 26, 1.35, '#d84a2a', ''], [87, 36, 1.1, '#3ab87a', ''], [104, 22, 1.5, '#f0b83a', ''], [163, 60, .85, '#9a5ad0', ''], [147, 46, 1.25, '#3a9ad0', ''], [136, 69, .75, '#9ac83a', '']];
      for (const [x, y, s, c] of J) fg += `<path d="M${x} ${beamY + 9}V${f(y)}" stroke="#8a7a5a" stroke-width="${f(.3 + s * .15)}"/>`;
      // things floating in the jars: an eye, a little snake, seeds
      const inside = [`<circle cx="69" cy="42" r="2.4" fill="#e8e0c8"/><circle cx="69.6" cy="42" r="1.1" fill="#2a6a3a"/><circle cx="69.8" cy="42" r=".45" fill="#000"/>`, '', `<path d="M98 42q2 -3 4 0t4 0t4 0" stroke="#3a2a10" stroke-width="1.1" fill="none"/>`, '', `<circle cx="145" cy="62" r=".8" fill="#1a1a10"/><circle cx="148" cy="64" r=".7" fill="#1a1a10"/><circle cx="146" cy="66" r=".8" fill="#1a1a10"/>`, ''];
      J.forEach(([x, y, s, c], i) => { fg += jar(u, L, x, y, s, c, inside[i]); });
      // a bundle of dried herbs and a string of small bones hanging at the left
      fg += `<path d="M24 ${beamY + 9}V28" stroke="#8a7a5a" stroke-width=".4"/>` + Array.from({ length: 9 }, (_, k) => `<path d="M24 28q${f(-4 + k)} ${f(8 + R() * 3)} ${f(-6 + k * 1.5)} ${f(16 + R() * 5)}" stroke="${['#6a7a3a', '#8a7a4a', '#5a6a3a'][k % 3]}" stroke-width=".8" fill="none"/>`).join('')
        + `<path d="M21 28h6" stroke="#8a5a2a" stroke-width="1.6"/>`; }
    // ——— the candles: three tallow candles on the table, back left; wax run onto the wood ———
    fg += `<ellipse cx="44" cy="96" rx="16" ry="${f(16 * kAt(96))}" fill="#e8d8b0" opacity=".35"/>`;
    for (const c of CAND) fg += K.candle(u, L, { x: c.x, y: c.y, s: c.s, len: c.len, seed: c.len });
    // ——— the bowl: a wide turned wooden bowl, the water in it holding tomorrow's storm ———
    { const { x, y, rx } = BOWL, k = kAt(y), ry = rx * k, top = y - 6, cp = nid('tbc', u), sg = nid('tbs', u), bg2 = nid('tbb', u);
      fg += K.castShadow(u, L, { x, y, w: rx * 2, h: 7, horizon: HZ, d: 1 })
        + `<defs>${linGrad(bg2, x - rx, 0, x + rx, 0, [[0, '#ffc080', 1], [.25, '#8a5a30', 1], [.7, '#3a2210', 1], [1, '#1a0e06', 1]])}</defs>`
        + `<path d="M${f(x - rx)} ${f(top)}A${rx} ${f(ry)} 0 0 0 ${f(x + rx)} ${f(top)}Q${f(x + rx - 2)} ${f(y + ry * .6)} ${f(x + rx * .55)} ${f(y + ry * .7)}H${f(x - rx * .55)}Q${f(x - rx + 2)} ${f(y + ry * .6)} ${f(x - rx)} ${f(top)}Z" fill="url(#${bg2})" stroke="#140a04" stroke-width=".5"/>`
        + `<path d="M${f(x - rx + 3)} ${f(top + 4)}Q${f(x)} ${f(top + 7.6)} ${f(x + rx - 3)} ${f(top + 4)}" stroke="#1a0e06" stroke-width=".4" fill="none" opacity=".6"/>`
        + `<ellipse cx="${x}" cy="${top}" rx="${rx}" ry="${f(ry)}" fill="#4a2c14" stroke="#140a04" stroke-width=".5"/>`
        + `<path d="M${f(x - rx)} ${f(top)}A${rx} ${f(ry)} 0 0 0 ${f(x + rx)} ${f(top)}" stroke="#ffcc90" stroke-width=".6" fill="none" opacity=".75"/>`
        + `<defs><clipPath id="${cp}"><ellipse cx="${x}" cy="${f(top + .5)}" rx="${rx - 1.6}" ry="${f(ry - 1)}"/></clipPath>${linGrad(sg, 0, top - ry, 0, top + ry, [[0, '#0a1016', 1], [.5, '#2a3a44', 1], [1, '#4a5a60', 1]])}</defs>`
        // the storm in the water, filling the whole bowl: a black thundercloud over the far two thirds, its belly lit by
        // a big fork of lightning, and under it a curling wave breaking white (tomorrow's sea)
        + `<g clip-path="url(#${cp})"><rect x="${x - rx}" y="${f(top - ry)}" width="${2 * rx}" height="${f(2 * ry)}" fill="#06090d"/>`
        + `<path d="M${x - rx} ${f(top + 1.6)}Q${x - 18} ${f(top - .6)} ${x - 13} ${f(top + .8)}Q${x - 9} ${f(top - 1.8)} ${x - 3} ${f(top + .2)}Q${x + 2} ${f(top - 1.4)} ${x + 7} ${f(top + .6)}Q${x + 13} ${f(top - 1.2)} ${x + 17} ${f(top + 1)}Q${x + 21} ${f(top - .2)} ${x + rx} ${f(top + 1.2)}V${f(top - ry)}H${x - rx}Z" fill="#141c24"/>`
        + [[-14, -3.4, 7, '#2a3844'], [-4, -4, 8, '#34444f'], [8, -3.6, 8, '#2a3844'], [16, -2.6, 6, '#1e2a34']].map(([dx, dy, r, c]) => `<ellipse cx="${x + dx}" cy="${f(top + dy)}" rx="${r}" ry="${f(r * .3)}" fill="${c}"/>`).join('')
        // the cloud's belly lit round the lightning
        + glow(u, x + 3, top - .6, 13, 3.6, '#b8dcff', .8)
        + `<path d="M${x - 6} ${f(top + .2)}Q${x - 2} ${f(top - 1.2)} ${x + 2} ${f(top + .1)}Q${x + 7} ${f(top - 1.3)} ${x + 11} ${f(top + .3)}" stroke="#d8ecff" stroke-width=".6" fill="none" opacity=".75"/>`
        // the near third: the dark sea, the wave rising and curling over to the left, its white crest and spray
        + `<path d="M${x - rx} ${f(top + 2.6)}Q${x - 10} ${f(top + 1.6)} ${x} ${f(top + 2.4)}T${x + rx} ${f(top + 2.2)}V${f(top + ry + 1)}H${x - rx}Z" fill="#0e2630"/>`
        + `<path d="M${x + 16} ${f(top + ry)}Q${x + 8} ${f(top + 1.2)} ${x - 2} ${f(top + 1.4)}Q${x - 9} ${f(top + 1.6)} ${x - 10} ${f(top + 3.4)}Q${x - 8} ${f(top + 4.4)} ${x - 5.6} ${f(top + 3.4)}Q${x - 2} ${f(top + 3.6)} ${x + 2} ${f(top + ry)}Z" fill="#2a5a66"/>`
        + `<path d="M${x + 14} ${f(top + 3.4)}Q${x + 6} ${f(top + 1)} ${x - 2} ${f(top + 1.3)}Q${x - 9} ${f(top + 1.5)} ${x - 10} ${f(top + 3.4)}Q${x - 8} ${f(top + 4.4)} ${x - 5.6} ${f(top + 3.4)}" stroke="#f4fbff" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
        + `<path d="M${x - 16} ${f(top + 4.4)}q3 -1.2 6 0M${x + 10} ${f(top + 4.8)}q4 -1 8 0" stroke="#d8eef4" stroke-width=".6" fill="none" stroke-linecap="round" opacity=".75"/>`
        + [[-1, 0], [2, -.6], [-4, -.4], [5, .2]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${f(top + .8 + dy)}" r=".45" fill="#fff" opacity=".8"/>`).join('')
        // slanting rain under the cloud, and a tiny ship heeled over on the swell to the right — tomorrow's sea
        + Array.from({ length: 11 }, (_, k) => { const rx0 = x - 20 + k * 3.9; return `<path d="M${f(rx0)} ${f(top - 1.6 + (k % 3) * .4)}l-1.6 ${f(3.6 + (k % 2) * .8)}" stroke="#9ab4c8" stroke-width=".3" opacity=".5"/>`; }).join('')
        + `<g transform="translate(${x + 13} ${f(top + 2.3)}) rotate(-16)"><path d="M-2.6 0h5.2l-1 1.1h-3.4z" fill="#04080c"/><path d="M0 0v-3.6M-.9 -.4v-2.4" stroke="#04080c" stroke-width=".35"/><path d="M.2 -3.4l1.6 1.2l-1.6 .8zM-.7 -2.6l1.1 .9l-1.1 .5z" fill="#c8d8e4" opacity=".8"/></g>`
        // the lightning: a fork from the cloud's belly down to the wave's crest, a cold halo round it
        + (() => { const d = `M${x + 6} ${f(top - ry + .4)}L${x + 2.6} ${f(top - 2.6)}L${x + 5} ${f(top - 2)}L${x + .6} ${f(top + .4)}L${x + 2.6} ${f(top + .6)}L${x - 1.4} ${f(top + 2.4)}`, br = `M${x + 3.6} ${f(top - 2.3)}L${x + 9} ${f(top - .4)}L${x + 8} ${f(top + .8)}`;
            return `<path d="${d}${br}" stroke="#a8d4ff" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".45"/><path d="${d}" stroke="#ffffff" stroke-width="1.1" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${br}" stroke="#ffffff" stroke-width=".6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`; })()
        + `</g>`
        + K.localGlow(u, { x: x + 3, y: top - 1, color: '#a8d0f0', power: .6, radius: 20 }, { squash: .45, core: false }); }
    // ——— the three sea cards, face down in a row ———
    for (const c of CARDS) fg += seaCard(u, L, c.x, c.y, c.a);
    // ——— thrown crab claws and little bones by the bowl ———
    { const claw = (x, y, a, s) => { const g = nid('tcw', u); return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s} ${f(s * .7)})"><defs>${radGrad(g, -1, -1, 5, [[0, '#ffb07a', 1], [.5, '#c84a20', 1], [1, '#4a1004', 1]])}</defs>`
        + `<path d="M0 0q3 -3 7 -1.4l4 -1.6q-1 2 -3.4 2.8q2.6 .6 4 2.4q-3 .4 -5 -.6q-4 2 -6.6 .4z" fill="url(#${g})" stroke="#2a0602" stroke-width=".35"/><path d="M1 -.6q3 -1.6 5.4 -.8" stroke="#ffd0a8" stroke-width=".4" fill="none" opacity=".7"/></g>`; };
      fg += claw(134, 99, -20, 1.3) + claw(62, 101, 160, 1.1) + claw(158, 102, 30, 1.2);
      const bone = (x, y, a, l) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M${-l / 2} 0h${l}" stroke="#4a3a24" stroke-width="2.2" stroke-linecap="round"/><path d="M${-l / 2} 0h${l}" stroke="#e8dcc0" stroke-width="1.5"/>`
        + [-1, 1].map(sd => `<circle cx="${sd * l / 2}" cy="-.8" r="1.1" fill="#e8dcc0" stroke="#4a3a24" stroke-width=".3"/><circle cx="${sd * l / 2}" cy=".8" r="1.1" fill="#e8dcc0" stroke="#4a3a24" stroke-width=".3"/>`).join('') + `<path d="M${-l / 2 + 1} -.5h${l - 2}" stroke="#fff" stroke-width=".4" opacity=".7"/></g>`;
      fg += bone(166, 120, 24, 11) + bone(178, 112, -40, 8) + bone(80, 103, 8, 7);
    }
    // ——— small things of hers on the table: a string of glass beads, a black feather; a thread of smoke from the tall candle ———
    { const bp = []; for (let i = 0; i < 15; i++) { const t = i / 14; bp.push([65 + t * 25, 123.6 + Math.sin(t * 5) * 1.2 - t * 1.6]); }
      fg += `<path d="${smooth(bp)}" stroke="#2a1a0a" stroke-width=".3" fill="none" opacity=".7"/>` + bp.map(([bx, by], i) => K.contactShadow(u, bx + .5, by + .6, 2.4, L, { ry: .4, opacity: .4 })
        + `<circle cx="${f(bx)}" cy="${f(by)}" r=".85" fill="${['#c83a2a', '#2a8a7a', '#e8c040', '#1a1a2a'][i % 4]}" stroke="#0a0604" stroke-width=".2"/><circle cx="${f(bx - .3)}" cy="${f(by - .3)}" r=".25" fill="#fff" opacity=".7"/>`).join('');
      fg += `<g transform="translate(118 104) rotate(-14)">${K.contactShadow(u, 1, 1.2, 14, L, { ry: .8, opacity: .45 })}<path d="M-7 .2Q0 -2.6 7 -.4Q0 1.4 -7 .2Z" fill="#14161c" stroke="#05060a" stroke-width=".25"/><path d="M-8.4 .4L7 -.3" stroke="#6a6a70" stroke-width=".3"/>`
        + Array.from({ length: 6 }, (_, k) => `<path d="M${-4 + k * 2} ${f(-.3 - (k % 2) * .2)}l1 -1.2" stroke="#2a3040" stroke-width=".25"/>`).join('') + `<path d="M-4 -.8Q1 -2 5.6 -.8" stroke="#5a6a8a" stroke-width=".3" fill="none" opacity=".6"/></g>`;
      { const sx = FL.x, sy = FL.y - 6; fg += `<path d="M${sx} ${sy}c-1.6 -4 2.4 -6 .6 -10s2 -6 .4 -10s1.8 -5 .2 -9" stroke="#d8ccb8" stroke-width=".55" fill="none" opacity=".28" stroke-linecap="round"/>`; } }
    // ——— the crabs: one on the left card raising a claw, one climbing the right card ———
    fg += crab(u, L, 46, 107, 1.1, 24, { raiseL: 3, big: -1, seed: 4 }) + crab(u, L, 158, 112, 1.2, -34, { raiseR: 2, big: 1, seed: 7 });
    // ——— light and air: the candle's warmth, the fog's cold from the window, smoke in the air, the corners dark ———
    fg += K.localGlow(u, { x: FL.x, y: FL.y, color: '#ffb860', power: .7, radius: 60 }, { core: false }) + glow(u, 90, 110, 90, 30, '#ffb060', .16)
      + glow(u, WIN.x, WIN.y, 30, 30, '#b8e0d0', .2) + motes(18, 30, 30, 140, 70, '#ffe0b0', 13)
      + gloom(u, 100, 60, 210, 30, .45, '#05080a') + gloom(u, 100, 120, 100, 290, .55, '#050302') + gloom(u, 100, 60, 100, -10, .2, '#050302');
    return [bg, fg];
  } };
