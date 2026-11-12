// «Ром для всех» (Жемчужина, РЕМОНТ: по 1 Команде своему кораблю и кораблю союзника), variant A of the method trial
// (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-pearl.cjs SCENES['Ром для всех']) at
// its best. Below decks at night: two hands from two crews come in from the lower corners and knock their mugs
// together, the rum leaping up between them — one sleeve is a black coat, the other a sailor's bandaged forearm (the
// wounded one is back on his feet). Behind: the crew's quarters, hammocks between the beams, one lantern; through the
// open gun port the ally's ship lies alongside with her ports lit — the rum goes round two ships. The open cask of
// rum stands behind the table, a bottle beside it.
// Fixed against the first round: the arms were flat tubes with mitten hands that did not hold the mugs — now the
// sleeves have folds and cuffs, the fingers wrap round the mugs; the mugs are a pewter can and a coopered tankard with
// volume; the splash is one body of rum with drops along their flight, not scattered dots; the lantern is the one
// light (warm sides to it, shadows away); the bottle stands on the table, the cask on the deck behind it.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, motes, tableTop } = PK;

const HZ = 74, TB = 130;                                  // eye level; the table's back edge
const LAMP = { x: 58, y: 40, s: 1.25, hang: 14 };
const light = { time: 'night', haze: .3, key: { type: 'point', x: 58.4, y: 30.6, h: 1.4, gy: 126, color: '#ffbe6a', power: 1, radius: 130 },
  fill: { color: '#2e3e5a', power: .35 }, rim: { az: 60, color: '#bcd0f0', power: .3 } };
const lightOut = { time: 'night', haze: .3, key: { type: 'moon', x: 150, y: 40, el: 30, color: '#d8e4fa', power: .8 }, fill: { color: '#3d5680', power: .4 } };
const skel = { horizon: HZ, eye: 1.2, light: 'one lantern hanging from the beam upper left; the moon outside the gun port (cold, only in the port)', items: [
  ['lantern', 50, 40, 16, 34, 'beam (rope)'], ['port', 136, 52, 44, 32, 'hull side'], ['ally ship', 136, 84, 44, 26, 'sea, in the port'],
  ['hammock L', -4, 60, 62, 16, 'beams'], ['hammock M', 70, 54, 58, 14, 'beams'], ['cask', 152, 134, 26, 40, 'table top, back'],
  ['bottle', 118, 142, 12, 26, 'table top'], ['tin mug', 70, 82, 26, 30, 'in the left hand'], ['tankard', 104, 80, 30, 32, 'in the right hand'],
  ['splash', 80, 48, 44, 26, 'in the air over the mugs'], ['arm L', -14, 210, 90, 120, 'from the lower left corner'], ['arm R', 120, 210, 92, 120, 'from the lower right corner']] };

const lerp = (a, b, t) => a + (b - a) * t;
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }
// a hammock slung between two hooks, sagging, with a sleeper's shape in it (canvas lit from the lantern side)
function hammock(u, L, x0, x1, y, sag, sleeper) {
  const g = nid('hm', u), mx = (x0 + x1) / 2, rp = L.ramp('canvas', mx, y + sag);
  let out = `<path d="M${x0} ${y - 8}L${x0 + 7} ${y + 1}M${x1} ${y - 8}L${x1 - 7} ${y + 1}" stroke="#2a2018" stroke-width=".6"/>`
    + `<defs>${linGrad(g, 0, y, 0, y + sag + 8, [[0, rp.lit, 1], [.5, rp.half, 1], [1, rp.shadow, 1]])}</defs>`
    + `<path d="M${x0 + 6} ${y}Q${mx} ${y + sag * 1.7} ${x1 - 6} ${y}Q${mx} ${y + sag * 2.6 + 6} ${x0 + 6} ${y}Z" fill="url(#${g})" stroke="#1a1208" stroke-width=".5"/>`
    + `<path d="M${x0 + 10} ${y + 2}Q${mx} ${y + sag * 2.2} ${x1 - 10} ${y + 2}" stroke="${rp.shadow}" stroke-width=".4" fill="none" opacity=".7"/>`;
  if (sleeper) out += `<path d="M${mx - 18} ${y + sag * .9}q8 -9 20 -6q8 -4 14 1q-4 4 -12 4q-14 4 -22 1z" fill="#140c08" opacity=".92"/><circle cx="${mx - 16}" cy="${y + sag * .8 - 1}" r="3.2" fill="#140c08"/>`
    + `<path d="M${mx + 14} ${y + sag * .9 - 1}q5 4 4 10" stroke="#140c08" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return out;
}
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
    for (let i = 0; i < 4; i++) { const t = .78 + i * .035, a = P(t, -1.05), b = P(t + .02, 1.05), c = P(t + .045, -1.05);
      out += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(P(t + .065, 1.05)[0])} ${f(P(t + .065, 1.05)[1])}L${f(c[0])} ${f(c[1])}Z" fill="${i % 2 ? '#d8ccb0' : '#ece4d0'}" stroke="#8a7a5a" stroke-width=".3"/>`; }
    { const p = P(.82, -.2); out += `<path d="M${f(p[0])} ${f(p[1])}q2 1 3 4" stroke="#a83a2a" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"/>`; }
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
// the hand round a mug, drawn in the mug's frame (origin the mug's bottom middle, y up negative, rotation a): the
// back of the hand and the knuckles at the mug's side, four fingers wrapped across the front, the thumb on the rim side
function grip(u, x, y, a, s, r, H, side, skin) {
  const e = side;   // -1: hand comes from the left, +1: from the right
  const g = nid('gp', u);
  let out = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})"><defs>${linGrad(g, -r, 0, r, 0, e < 0 ? [[0, skin[0], 1], [.5, skin[1], 1], [1, skin[2], 1]] : [[0, skin[2], 1], [.5, skin[1], 1], [1, skin[0], 1]])}</defs>`;
  // the back of the hand behind the mug's side, towards the wrist
  out += `<path d="M${f(e * r * .7)} ${f(-H * .2)}C${f(e * (r + 4))} ${f(-H * .25)} ${f(e * (r + 6))} ${f(-H * .05)} ${f(e * (r + 5))} ${f(H * .25)}L${f(e * (r - 1))} ${f(H * .32)}C${f(e * r)} ${f(H * .1)} ${f(e * r)} ${f(-H * .05)} ${f(e * r * .7)} ${f(-H * .2)}Z" fill="url(#${g})" stroke="#3a1e10" stroke-width=".35"/>`;
  // four fingers across the front, curving round the cylinder, each shorter towards the little finger
  for (let i = 0; i < 4; i++) { const yy = -H * (.62 - i * .135), l = r * (1.3 - i * .12), w = H * .14, x0 = e * (r + .6), x1 = x0 - e * l;
    out += `<path d="M${f(x0)} ${f(yy - w / 2)}Q${f((x0 + x1) / 2)} ${f(yy - w / 2 + .7)} ${f(x1)} ${f(yy - w * .35)}Q${f(x1 - e * w * .55)} ${f(yy)} ${f(x1)} ${f(yy + w * .4)}Q${f((x0 + x1) / 2)} ${f(yy + w / 2 + .9)} ${f(x0)} ${f(yy + w / 2)}Z" fill="url(#${g})" stroke="#3a1e10" stroke-width=".35"/>`
      + `<path d="M${f(x1 + e * .9)} ${f(yy - w * .2)}q${f(-e * .7)} ${f(w * .25)} 0 ${f(w * .5)}" stroke="#e8c0a0" stroke-width=".3" fill="none" opacity=".8"/>`
      + `<path d="M${f(x0 - e * l * .45)} ${f(yy - w * .4)}v${f(w * .8)}" stroke="#7a4a30" stroke-width=".25" opacity=".6"/>`; }
  // the thumb over the top finger, pointing up the mug
  out += `<path d="M${f(e * (r + .4))} ${f(-H * .64)}C${f(e * r * .4)} ${f(-H * .7)} ${f(e * r * .1)} ${f(-H * .82)} ${f(e * r * .2)} ${f(-H * .9)}C${f(e * r * .4)} ${f(-H * .96)} ${f(e * r * .7)} ${f(-H * .9)} ${f(e * r * .8)} ${f(-H * .8)}C${f(e * r)} ${f(-H * .72)} ${f(e * (r + 1.4))} ${f(-H * .7)} ${f(e * (r + 1.6))} ${f(-H * .64)}Z" fill="url(#${g})" stroke="#3a1e10" stroke-width=".35"/>`
    + `<path d="M${f(e * r * .26)} ${f(-H * .88)}q${f(e * .8)} ${f(-H * .05)} ${f(e * 1.6)} 0" stroke="#f0d0b0" stroke-width=".35" fill="none"/>`;
  return out + '</g>';
}
// a pewter can: a straight dented cylinder, a rim, a scroll handle; lit by the lantern, the rum inside
function tinMug(u, L, x, y, a, s) {
  const H = 15, r = 6.2, rad = a * Math.PI / 180, P = (lx, ly) => [x + (lx * Math.cos(rad) - ly * Math.sin(rad)) * s, y + (lx * Math.sin(rad) + ly * Math.cos(rad)) * s];
  const S = P(0, 0), E = P(0, -H), ell = .26;
  let out = K.propTube ? '' : '';
  const hd = [P(r - .4, -H * .8), P(r + 5, -H * .78), P(r + 5.4, -H * .3), P(r - .2, -H * .22)];
  out += `<path d="M${f(hd[0][0])} ${f(hd[0][1])}C${f(hd[1][0])} ${f(hd[1][1])} ${f(hd[2][0])} ${f(hd[2][1])} ${f(hd[3][0])} ${f(hd[3][1])}" stroke="#2a3034" stroke-width="${f(2.6 * s)}" fill="none" stroke-linecap="round"/><path d="M${f(hd[0][0])} ${f(hd[0][1])}C${f(hd[1][0])} ${f(hd[1][1])} ${f(hd[2][0])} ${f(hd[2][1])} ${f(hd[3][0])} ${f(hd[3][1])}" stroke="#8a969c" stroke-width="${f(1.4 * s)}" fill="none" stroke-linecap="round"/>`;
  out += K.shadeCyl(u, S[0], S[1], E[0], E[1], r * s, L, 'iron', { ell, face: 2, outline: .45, r1: r * s, r2: r * .94 * s });
  // dents and a rolled rim; the rum surface in the mouth with a warm glint
  const d1 = P(-2, -H * .45), d2 = P(1.6, -H * .2);
  out += `<ellipse cx="${f(d1[0])}" cy="${f(d1[1])}" rx="${f(1.8 * s)}" ry="${f(1 * s)}" fill="#1a2024" opacity=".35"/><ellipse cx="${f(d1[0] - .5)}" cy="${f(d1[1] - .4)}" rx="${f(1 * s)}" ry="${f(.5 * s)}" fill="#d8e4ea" opacity=".35"/><ellipse cx="${f(d2[0])}" cy="${f(d2[1])}" rx="${f(1.2 * s)}" ry="${f(.7 * s)}" fill="#1a2024" opacity=".3"/>`;
  const m = P(0, -H), rr = r * .94 * s;
  out += `<ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(rr)}" ry="${f(rr * ell)}" transform="rotate(${f(a)} ${f(m[0])} ${f(m[1])})" fill="#3a1606" stroke="#5a666c" stroke-width="${f(.9 * s)}"/>`
    + `<ellipse cx="${f(m[0] - rr * .3)}" cy="${f(m[1] - .2)}" rx="${f(rr * .35)}" ry="${f(rr * ell * .4)}" transform="rotate(${f(a)} ${f(m[0])} ${f(m[1])})" fill="#ffb050" opacity=".55"/>`;
  return out;
}
// the splash of rum between the two mugs: one body of liquid thrown up from both mouths, translucent amber, lit
// from the lantern, breaking into drops that fly along curves (stretched along their flight)
function splash(u, a, b) {
  const g = nid('rs', u), R = rng(9), top = [(a[0] + b[0]) / 2 + 1, Math.min(a[1], b[1]) - 20];
  let out = `<defs>${linGrad(g, 0, top[1] + 22, 0, top[1] - 4, [[0, '#5a2206', .95], [.5, '#b0580e', .9], [1, '#f2b050', .85]])}</defs>`;
  // a sheet of rum thrown up out of each mouth towards the other, meeting in a crown over the mugs
  const sheet = (m, e) => smooth([[m[0] - e * 4, m[1] + 1], [m[0] - e * 3, m[1] - 8], [top[0] - e * 6, top[1] + 2], [top[0] - e * 1, top[1] - 3], [top[0] + e * 2, top[1] + 4], [m[0] + e * 2, m[1] - 4], [m[0] + e * 3, m[1] + .5]], true);
  out += `<path d="${sheet(a, 1)}" fill="url(#${g})" stroke="#3a1404" stroke-width=".35"/><path d="${sheet(b, -1)}" fill="url(#${g})" stroke="#3a1404" stroke-width=".35"/>`
    + `<path d="M${f(a[0] - 2)} ${f(a[1] - 3)}Q${f(a[0] + 1)} ${f(top[1] + 6)} ${f(top[0] - 3)} ${f(top[1] + 1)}M${f(b[0] + 1)} ${f(b[1] - 4)}Q${f(b[0] - 1)} ${f(top[1] + 7)} ${f(top[0] + 2)} ${f(top[1] + 2)}" stroke="#ffe2a8" stroke-width=".6" fill="none" opacity=".8" stroke-linecap="round"/>`;
  // the crown where they meet: short fingers of rum, each ending in a drop
  for (let i = 0; i < 6; i++) { const t = (i - 2.5) / 2.5, x0 = top[0] + t * 5, y0 = top[1] + 1 + Math.abs(t) * 2, x1 = x0 + t * 5 + (R() - .5) * 2, y1 = y0 - 5 - R() * 4;
    out += `<path d="M${f(x0 - .9)} ${f(y0)}Q${f(x1)} ${f((y0 + y1) / 2)} ${f(x1)} ${f(y1)}Q${f(x1 + .4)} ${f((y0 + y1) / 2)} ${f(x0 + .9)} ${f(y0)}Z" fill="#b0580e" stroke="#3a1404" stroke-width=".25"/><circle cx="${f(x1)}" cy="${f(y1 - 1)}" r="${f(.8 + R() * .5)}" fill="#c06a18" stroke="#3a1404" stroke-width=".2"/><circle cx="${f(x1 - .3)}" cy="${f(y1 - 1.3)}" r=".35" fill="#ffe2a8"/>`; }
  // drops thrown off to the sides and falling back, stretched along their flight
  for (let i = 0; i < 18; i++) { const e = i % 2 ? 1 : -1, d = 6 + R() * 18, x = top[0] + e * d, y = top[1] - 2 + d * d * .025 + (R() - .5) * 8, r = .45 + R() * 1, ang = e * (20 + d * 2);
    out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.8)}" ry="${f(r)}" transform="rotate(${f(ang)} ${f(x)} ${f(y)})" fill="#9a4a0c" stroke="#3a1404" stroke-width=".2"/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .38)}" fill="#ffe0a0" opacity=".9"/>`; }
  return out;
}

module.exports = { name: 'Ром для всех', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 }), Lo = K.makeLight(lightOut, { horizon: 74 });
    // the hull side behind: planking between frames; the deck beams overhead
    let bg = woodTex(u, 0, 0, 200, TB + 1, '#3e2816', '#1a1008', '#0a0604', 12, true, 14);
    for (const x of [30, 96, 186]) { const g = nid('fr', u); bg += `<defs>${linGrad(g, x - 5, 0, x + 5, 0, [[0, '#5a3a1e', 1], [.5, '#3a2412', 1], [1, '#140a04', 1]])}</defs><rect x="${x - 5}" y="0" width="10" height="${TB}" fill="url(#${g})"/><path d="M${x - 5} 0V${TB}" stroke="#8a5a30" stroke-width=".5" opacity=".6"/>`; }
    { const g = nid('bm', u); bg += `<defs>${linGrad(g, 0, 0, 0, 12, [[0, '#120a04', 1], [.6, '#3a2412', 1], [1, '#7a5030', 1]])}</defs><rect x="0" y="0" width="200" height="12" fill="url(#${g})"/><path d="M0 12H200" stroke="#0a0502" stroke-width="1.2"/>`
      + PK.nails([[20, 7], [60, 7], [104, 7], [148, 7], [190, 7]], '#140a04', .6); }
    // the open gun port on the right: the night outside, the ally alongside with her ports lit, the lid hauled up
    { const px = 138, py = 52, pw = 42, ph = 32, cid = nid('pt', u);
      let o = K.sky(u, Lo, { horizon: 74, stars: 16, seed: 6, top: py }) + K.sunMoon(u, Lo, { r: 3.4 }) + K.water(u, Lo, { horizon: 74, bottom: py + ph + 2, swell: .3, seed: 2, glitter: 150 })
        + K.ship(u, Lo, { kind: 'revenge', x: 162, y: 84, scale: .42, detail: 'mid', sails: 'furled', lights: true, seed: 4 });
      bg += `<defs><clipPath id="${cid}"><rect x="${px}" y="${py}" width="${pw}" height="${ph}"/></clipPath></defs><g clip-path="url(#${cid})">${o}`
        + K.localGlow(u, { x: 160, y: 66, color: '#ffc070', power: .35, radius: 14 }, { core: false }) + `</g>`
        + `<path d="M${px - 3} ${py - 3}h${pw + 6}v${ph + 6}h${-pw - 6}zM${px} ${py}v${ph}h${pw}v${-ph}z" fill="#2a180a" fill-rule="evenodd" stroke="#0a0502" stroke-width=".6"/>`
        + `<path d="M${px} ${py + ph}h${pw}l3 3h${-pw - 6}z" fill="#7a5030"/><path d="M${px} ${py}l-3 -3M${px + pw} ${py}l3 -3" stroke="#0a0502" stroke-width=".5"/>`
        // the lid hauled up inside: red inner face, the tackle to the beam
        + `<path d="M${px - 2} ${py - 4}L${px + pw + 2} ${py - 4}L${px + pw} ${py - 10}L${px} ${py - 10}Z" fill="#2e1c0e" stroke="#0a0502" stroke-width=".5"/><path d="M${px + 1} ${py - 9.4}H${px + pw - 1}" stroke="#7a5030" stroke-width=".5" opacity=".7"/>`
        + `<path d="M${px + 8} ${py - 10}L${px + 4} 12M${px + pw - 8} ${py - 10}L${px + pw - 4} 12" stroke="#5a4028" stroke-width=".6"/>`
        + PK.shafts(u, 150, 40, [[px, py + ph, px - 12, TB], [px + pw, py + ph, px + pw - 6, TB]], '#9ab8e0', .06); }
    // hammocks between the beams with the off-watch asleep in them (the lantern light catches their undersides)
    bg += hammock(u, L, -6, 58, 62, 9, true) + hammock(u, L, 72, 128, 56, 8, true);
    bg += K.localGlow(u, { x: 58, y: 40, color: '#ff9a40', power: .5, radius: 80 }, { core: false });
    // the table in front: rough planks in perspective, a spilled pool of rum catching the lantern
    bg += tableTop(u, TB, 280 - TB, '#5a3a20', '#2a1a0a', 15)
      + K.localGlow(u, { x: 70, y: 150, color: '#ffb050', power: .45, radius: 70 }, { squash: .4, core: false })
      + `<path d="M44 152q18 -5 38 -1q10 4 -8 7q-22 3 -30 -6z" fill="#4a1a04" opacity=".75"/><path d="M50 151q12 -2 24 0" stroke="#ffc070" stroke-width=".6" fill="none" opacity=".8"/>`;
    let fg = '';
    // the open cask behind the table (its foot hidden by the table edge), a ladle in it; the bottle on the table
    fg += K.castShadow(u, L, { x: 164, y: TB + 4, w: 24, h: 38, horizon: HZ, d: .9, opacity: .55 }) + K.barrel(u, L, { x: 164, y: TB + 4, s: 1.25, kind: 'rum', open: true, seed: 6 });
    fg += K.shadeCyl(u, 160, TB - 34, 176, TB - 52, .8, L, 'brass', { outline: .3 });
    fg += K.castShadow(u, L, { x: 124, y: 142, w: 9, h: 22, horizon: HZ, d: .9, opacity: .6 }) + K.bottle(u, L, { x: 124, y: 142, s: 1.3, kind: 'rum', seed: 3 });
    // the lantern on its rope from the beam
    fg += K.lantern(u, L, { ...LAMP, seed: 4 }) + K.localGlow(u, { x: 58.4, y: 31, color: '#ffd080', power: .8, radius: 22 });
    // the two arms from the lower corners: a black coat (left), a sailor's bandaged forearm in a rolled brown sleeve (right)
    fg += arm(u, L, { x0: -16, y0: 232, x1: 70, y1: 100, w0: 50, w1: 16, cloth: ['#4a4a56', '#24242c', '#0a0a0e'], cuff: ['#3a3a44', '#101014'], side: -1, seed: 3 })
      + arm(u, L, { x0: 216, y0: 232, x1: 128, y1: 98, w0: 48, w1: 15, cloth: ['#8a5a3a', '#5a341e', '#24120a'], cuff: ['#9a6a44', '#3a2010'], bare: true, side: 1, seed: 5 });
    // the mugs knocked together (tilted towards each other) and the hands round them
    fg += tinMug(u, L, 82, 98, 16, 1.55) + grip(u, 82, 98, 16, 1.55, 6.2, 15, -1, ['#f0c49a', '#c08a60', '#6a3a22']);
    fg += K.mug(u, L, { x: 116, y: 96, s: 1.75, rot: -16, fill: 'rum', flip: true, seed: 4, contact: false }) + grip(u, 116, 96, -16, 1.75, 4.5, 11, 1, ['#e0aa80', '#a8714a', '#5a3018']);
    // the rum leaping up where they meet
    fg += splash(u, [88.4, 75.7], [110.8, 77.7]) + K.localGlow(u, { x: 100, y: 64, color: '#ffc070', power: .35, radius: 24 }, { core: false });
    // light: the lantern's warmth, the dark round the edges and under the glass
    fg += glow(u, 60, 34, 80, 60, '#ffb050', .2) + motes(16, 30, 20, 120, 90, '#ffe0b0', 7)
      + gloom(u, 60, 30, 200, 140, .35) + gloom(u, 100, 150, 100, 280, .5);
    return [bg, fg];
  } };
