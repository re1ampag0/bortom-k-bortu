// «Анжелика» (Месть, ПРИКАЗ: возьмите 2 карты, затем передайте союзнику 1 карту с руки), variant A of the method
// trial (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait.cjs SCENES['Анжелика']) at its
// best. The captain's cabin at night: the stern window with the moon over the sea, the curtains tied back; on the
// table the chart with two heavy cutlasses lying crossed on it; a sapphire ring on her gloved ring finger; her gloved hand
// comes in from the near left and holds up the sealed letter (blue ribbon, red wax with an anchor) towards the
// ally's ship in the window — a lantern raised at her stern to answer. A tall candle is the light of the table
// (shadows fan away from it); the moon through the window is the cold fill.
// Fixed against the first round: the sabres stood upright in the air — now they lie crossed on the chart with
// their full volume (flat, bevel and ridge, a flame glint, shell guards, wire-bound grips) and their shadows, one
// on the other; the ring stood on its edge (then lay too small by the candle) — now it is on her ring finger, over the glove; the chart was a sheet
// standing on a wall — the table top is in perspective and the chart lies on it; the hand is one body from the
// coat sleeve through the cuff and glove to the thumb on the letter; the moon path is a real glitter on the water.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, shafts, motes, tableTop } = PK;

const HZ = 52;                                   // eye level = the sea horizon in the window
const WX = 30, WY = 2, WW = 140, WH = 78;        // the window glass
const TB = 96, TF = 150;                         // the table top: back edge (at the wall), front edge
const CAN = { x: 177, y: 140, s: 2.3, len: 15 };  // the candle stick on the table
const flameY = CAN.y - (3.4 + CAN.len + 3) * CAN.s;
const light = { time: 'night', haze: .25, key: { type: 'point', x: CAN.x, y: flameY, h: .45, gy: CAN.y, color: '#ffb860', power: 1, radius: 120 },
  fill: { color: '#3a5276', power: .4 }, rim: { az: 0, color: '#bcd4f4', power: .35 } };
const lightOut = { time: 'night', haze: .35, key: { type: 'moon', x: 118, y: 21, el: 18, color: '#d8e4fa', power: .8 }, fill: { color: '#3d5680', power: .4 } };
const skel = { horizon: HZ, eye: 1.3, light: 'tall candle on the table right (x 166) + the moon through the window (cold fill)', items: [
  ['window', WX, WY + WH, WW, WH, 'stern wall'], ['ally ship', 41, 61, 60, 38, 'sea in the window: the Revenge'], ['sill', WX - 8, 90, WW + 16, 8, 'window frame'],
  ['chart', 32, 142, 112, 40, 'table top'], ['sabres', 80, 136, 80, 36, 'crossed, flat on the chart'],
  ['arm + hand', -10, 190, 60, 90, 'from the near left edge'], ['letter', 46, 104, 44, 38, 'held in the hand'], ['ring', 64, 112, 8, 8, 'on her ring finger, over the glove'],
  ['candle', 166, 140, 22, 50, 'table top'], ['inkwell', 24, 104, 14, 12, 'table top'], ['quill', 12, 104, 22, 44, 'in the inkwell'], ['spyglass', 128, 92, 30, 5, 'on the sill']] };

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
// a local frame: origin W, x axis at angle a (degrees), scale s -> a mapper from local to picture units
const frameOf = (W, a, s = 1) => { const c = Math.cos(a * Math.PI / 180), sn = Math.sin(a * Math.PI / 180); return (lx, ly) => [W[0] + (lx * c - ly * sn) * s, W[1] + (lx * sn + ly * c) * s]; };
const pth = (P, pts, closed = true) => smooth(pts.map(([x, y]) => P(x, y)), closed);
const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
// a heavy cutlass lying flat on the table, from the pommel H to the point T: a curved blade with its flat, the
// bevel to the edge (the ridge between them catches the candle), a fuller near the spine, a hot reflection of the
// flame on the flat; a brass shell guard with a knuckle bow, a wire-bound leather grip, a ball pommel.
// o: { grip, w (blade width at the guard), bend (curve toward the spine), side (±1: which side the spine is),
// hot (0..1 — where along the blade the flame is reflected), bevelLit }
function cutlassShadow(u, H, T, o, D) {
  const g = cutlassGeom(H, T, o), b = nid('csb', u), sh = (pts, k) => poly(pts.map(p => [p[0] + D[0] * k, p[1] + D[1] * k]));
  const cup = g.cup.map(p => [p[0] + D[0] * 1.6, p[1] + D[1] * 1.6]);
  return `<defs><filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter></defs><g filter="url(#${b})" fill="#1a0a02" opacity=".55" style="mix-blend-mode:multiply">`
    + `<path d="${sh(g.blade, .45)}"/><path d="${poly(cup)}"/><path d="${sh(g.grip, 1.2)}"/><path d="${sh(g.bow, 1.4)}"/></g>`;
}
function cutlassGeom(H, T, o) {
  const dx = T[0] - H[0], dy = T[1] - H[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, sd = o.side || 1;
  const P = (lx, ly) => [H[0] + ux * lx - uy * ly * sd, H[1] + uy * lx + ux * ly * sd];
  const g0 = o.grip || 16, w = o.w || 7, bend = o.bend || 5, Lb = len - g0;
  const sp = t => [g0 + t * Lb, -w / 2 - bend * t * t], ed = t => [g0 + t * Lb, w / 2 * (1 - .3 * t) - bend * t * t], bv = t => [g0 + t * Lb, w / 2 * (1 - .3 * t) - w * .34 * (1 - .45 * t) - bend * t * t];
  const N = 14, ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const tipE = .84, spine = ts.map(sp), edge = ts.filter(t => t <= tipE).map(ed), bevel = ts.filter(t => t <= tipE).map(bv);
  const tip = sp(1), clip = [ed(tipE), [g0 + .93 * Lb, (ed(tipE)[1] + tip[1]) / 2 + .6], tip];
  const blade = [...spine, ...clip.slice(0, 2).reverse().reverse().slice(1, 2), ...edge.slice().reverse()].map(p => P(...p));
  const flat = [...spine.slice(0, -1), [g0 + .93 * Lb, (bv(tipE)[1] + tip[1]) / 2], ...bevel.slice().reverse()].map(p => P(...p));
  const bev = [...bevel, [g0 + .93 * Lb, (bv(tipE)[1] + tip[1]) / 2], tip, clip[1], ...edge.slice().reverse()].map(p => P(...p));
  const cup = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2; return P(g0 + .4 + Math.cos(a) * 2.8, Math.sin(a) * w * 1.05); });
  const grip = [P(1, -2.1), P(g0 - 1.5, -2.4), P(g0 - 1.5, 2.4), P(1, 2.1)];
  const bowPts = [P(g0 - .5, w * 1.05), P(g0 * .55, w * 1.55), P(g0 * .2, w * .9), P(1.4, 2.4)];
  const bow = [...bowPts, ...bowPts.slice().reverse().map(p => [p[0] - uy * 1.2 * sd, p[1] + ux * 1.2 * sd])];
  return { P, g0, w, Lb, len, ux, uy, sd, sp, ed, bv, blade, flat, bev, cup, grip, bowPts, bow, tipE };
}
function cutlass(u, L, H, T, o = {}) {
  const G = cutlassGeom(H, T, o), { P, g0, w, Lb, len } = G, hot = o.hot != null ? o.hot : .45;
  const A = P(g0, 0), B = P(len, 0), fg = nid('cfl', u), bg = nid('cbv', u), ac = nid('cac', u);
  const warm = '#ffe2b8';
  let out = `<defs>${linGrad(fg, A[0], A[1], B[0], B[1], [[0, '#3a4248', 1], [Math.max(0, hot - .22), '#6a767e', 1], [Math.max(0, hot - .06), '#b8c4ca', 1], [hot, warm, 1], [Math.min(1, hot + .05), '#c8d2d8', 1], [Math.min(1, hot + .2), '#66727a', 1], [1, '#323a40', 1]])}`
    + `${linGrad(bg, A[0], A[1], B[0], B[1], o.bevelLit ? [[0, '#8a969e', 1], [hot, '#f6f8f4', 1], [1, '#7a868e', 1]] : [[0, '#1e2428', 1], [hot, '#5a666e', 1], [1, '#1a2024', 1]])}`
    + `${linGrad(ac, ...P(g0, -w / 2), ...P(g0, w / 2), [[0, '#000', .28], [.5, '#000', 0], [1, '#000', .18]])}</defs>`;
  out += `<path d="${poly(G.flat)}" fill="url(#${fg})"/><path d="${poly(G.flat)}" fill="url(#${ac})"/><path d="${poly(G.bev)}" fill="url(#${bg})"/>`;
  // the fuller near the spine, the ridge between flat and bevel, the honed edge, the outline
  const ful = Array.from({ length: 9 }, (_, i) => { const t = .03 + i / 8 * .6; return [g0 + t * Lb, -w / 2 + w * .24 - (o.bend || 5) * t * t]; });
  out += `<path d="${smooth(ful.map(p => P(...p)))}" stroke="#14181c" stroke-width=".75" fill="none" opacity=".75" stroke-linecap="round"/>`
    + `<path d="${smooth(ful.map(p => P(p[0], p[1] + .65)))}" stroke="#e8eef2" stroke-width=".35" fill="none" opacity=".6" stroke-linecap="round"/>`
    + `<path d="${smooth(Array.from({ length: 9 }, (_, i) => P(...G.bv(i / 8 * G.tipE))))}" stroke="#f4f8fa" stroke-width=".4" fill="none" opacity=".85"/>`
    + `<path d="${smooth(Array.from({ length: 9 }, (_, i) => P(...G.ed(i / 8 * G.tipE))))}" stroke="#ffffff" stroke-width=".3" fill="none" opacity=".45"/>`
    + `<path d="${poly(G.blade)}" fill="none" stroke="#101418" stroke-width=".5" stroke-linejoin="round"/>`;
  // the hot point: the flame mirrored in the steel, a small four-ray glint on the ridge
  { const q = P(...G.bv(hot * .95)); out += K.localGlow(u, { x: q[0], y: q[1], color: '#ffe0b0', power: .7, radius: 6 }, { core: false })
      + `<path d="M${f(q[0] - 3.2)} ${f(q[1])}h6.4M${f(q[0])} ${f(q[1] - 2.2)}v4.4" stroke="#fffaf0" stroke-width=".35" opacity=".9" stroke-linecap="round"/><circle cx="${f(q[0])}" cy="${f(q[1])}" r=".55" fill="#ffffff"/>`; }
  // the grip: leather over the tang, bound with brass wire; a ferrule at the guard
  out += K.shadeCyl(u, ...P(1.4, 0), ...P(g0 - 1.6, 0), 2.1, L, 'leather', { r1: 1.9, r2: 2.3, outline: .4, grain: false });
  { let wire = ''; for (let i = 0; i < 8; i++) { const t = 2.2 + (i + .5) / 8 * (g0 - 4.4), a = P(t - .5, -2.1), b = P(t + .5, 2.1); wire += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; }
    out += `<path d="${wire}" stroke="#6a4a14" stroke-width=".7" stroke-linecap="round"/><path d="${wire}" stroke="#e8c870" stroke-width=".3" stroke-linecap="round" opacity=".85"/>`; }
  out += K.shadeCyl(u, ...P(g0 - 2.4, 0), ...P(g0 - .6, 0), 2.6, L, 'brass', { outline: .35 });
  // the knuckle bow: a flat brass bar from the shell to the pommel
  { const bp = G.bowPts, d = `M${f(bp[0][0])} ${f(bp[0][1])}C${f(bp[1][0])} ${f(bp[1][1])} ${f(bp[2][0])} ${f(bp[2][1])} ${f(bp[3][0])} ${f(bp[3][1])}`;
    out += `<path d="${d}" stroke="#4a3008" stroke-width="2.3" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#b8862e" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#ffe8a8" stroke-width=".45" fill="none" stroke-linecap="round" opacity=".85" transform="translate(.35 -.35)"/>`; }
  // the shell guard: a brass dish round the blade's root, pierced rim, lit toward the candle
  { const c = P(g0 + .4, 0), cg = nid('ccu', u), q = P(g0 + .4, -w * .5), qq = P(g0 + .4, w * .5);
    out += `<defs>${radGrad(cg, c[0] + 1.2, c[1] - 1, w * 1.4, [[0, '#fff2c0', 1], [.25, '#e8b850', 1], [.65, '#a87420', 1], [1, '#4a2e08', 1]])}</defs>`
      + `<path d="${poly(G.cup)}" fill="url(#${cg})" stroke="#3a2406" stroke-width=".5" stroke-linejoin="round"/>`
      + `<path d="M${f(q[0])} ${f(q[1])}L${f(qq[0])} ${f(qq[1])}" stroke="#5a3a0a" stroke-width="1.1" opacity=".6"/>`
      + [-.75, -.4, .4, .75].map(k => { const p = P(g0 + .4, k * w * 1.05); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".42" fill="#2a1804"/>`; }).join(''); }
  // the pommel
  { const p = P(.4, 0); out += K.shadeSphere(u, p[0], p[1], 2.5, L, 'brass', { outline: .4 }) + K.shadeCyl(u, ...P(-2.4, 0), ...P(-1.6, 0), 1.1, L, 'brass', { outline: .3 }); }
  return out;
}
// the sealed letter, drawn in its own frame: origin at the corner she holds (lower left), x along the bottom edge,
// the letter rises to y = -h. A folded packet: the flap closed down to a point, a blue silk ribbon round it, the
// red wax seal with a pressed anchor over the crossing, the address in a running hand below the flap
function sealedLetter(u, w, h) {
  const pg = nid('lpg', u), fg = nid('lfg', u), wx = nid('lwx', u), sb = nid('lsb', u), cx = w * .52, cy = -h * .44;
  let out = `<defs>${linGrad(pg, 0, 0, w, -h, [[0, '#9a845e', 1], [.45, '#d8c49a', 1], [.85, '#f6e8c6', 1], [1, '#fff4dc', 1]])}`
    + `${linGrad(fg, 0, -h, w, -h * .4, [[0, '#b8a27a', 1], [.6, '#ead8b0', 1], [1, '#fff0d0', 1]])}`
    + `${radGrad(wx, cx + 1.2, cy - 1.2, 5.5, [[0, '#e8584a', 1], [.4, '#b82a22', 1], [.85, '#6a0e0c', 1], [1, '#3a0606', 1]])}`
    + `<filter id="${sb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`;
  // paper thickness on the bottom and right edges, the sheet, a soft crease down the middle
  out += `<path d="M.6 .9H${f(w + .7)}V${f(-h + .8)}" stroke="#5a4428" stroke-width="1" fill="none" opacity=".75"/>`
    + `<path d="M0 0L${f(w)} 0L${f(w)} ${f(-h)}L.4 ${f(-h + .2)}Z" fill="url(#${pg})" stroke="#4a3418" stroke-width=".45" stroke-linejoin="round"/>`
    + `<path d="M${f(w * .5)} -.6V${f(-h * .3)}" stroke="#8a7452" stroke-width=".35" opacity=".5"/><path d="M${f(w * .5 + .5)} -.6V${f(-h * .3)}" stroke="#fff8e8" stroke-width=".3" opacity=".5"/>`;
  // the address: a few lines of running hand in brown ink (loops, no letters)
  { const R = rng(12); let d = ''; for (const [y0, x0, x1] of [[-h * .27, w * .14, w * .82], [-h * .16, w * .22, w * .74], [-h * .06, w * .3, w * .66]]) {
      let x = x0; d += `M${f(x)} ${f(y0)}`; while (x < x1) { const s = 1.3 + R() * 1.1, up = .9 + R() * 1.3; d += `q${f(s * .4)} ${f(-up)} ${f(s * .55)} 0q${f(-.25)} ${f(.9)} ${f(s * .45)} ${f(.15)}`; x += s; if (R() < .18) { d += `m${f(1.2)} 0`; x += 1.2; } } }
    out += `<path d="${d}" stroke="#3a2412" stroke-width=".32" fill="none" opacity=".75" stroke-linecap="round"/>`
      + `<path d="M${f(w * .14)} ${f(-h * .27 + 1.6)}q${f(w * .3)} 1.2 ${f(w * .64)} -.2" stroke="#3a2412" stroke-width=".28" fill="none" opacity=".55"/>`; }
  // the flap folded down to a point under the seal, its shadow on the sheet
  const flap = `M.4 ${f(-h + .2)}L${f(w)} ${f(-h)}L${f(cx + 1)} ${f(cy + 2.4)}Z`;
  out += `<path d="${flap}" fill="#2a1a08" opacity=".35" filter="url(#${sb})" transform="translate(-.6 1.2)"/><path d="${flap}" fill="url(#${fg})" stroke="#5a4428" stroke-width=".4" stroke-linejoin="round"/>`
    + `<path d="M1.6 ${f(-h + .9)}L${f(w - 1.4)} ${f(-h + .8)}" stroke="#fffaf0" stroke-width=".35" opacity=".7"/>`;
  // the ribbon across the packet, turned round the edges, two forked tails hanging from under the seal
  const rb = (d, wd) => `<path d="${d}" stroke="#0e1a3a" stroke-width="${f(wd + .6)}" fill="none" stroke-linecap="butt"/><path d="${d}" stroke="#2a4a8a" stroke-width="${f(wd)}" fill="none"/><path d="${d}" stroke="#7aa0e0" stroke-width="${f(wd * .22)}" fill="none" opacity=".7" transform="translate(0 ${f(-wd * .25)})"/>`;
  out += rb(`M-.6 ${f(cy + .6)}Q${f(w * .25)} ${f(cy + .9)} ${f(cx)} ${f(cy)}T${f(w + .6)} ${f(cy - .6)}`, 1.7)
    + `<path d="M-.8 ${f(cy - .3)}v1.9M${f(w + .8)} ${f(cy - 1.5)}v1.9" stroke="#0e1a3a" stroke-width=".9"/>`;
  out += `<path d="M${f(cx - 1.2)} ${f(cy + 1.4)}q-3 4 -6.4 6.2l1.2 .5l-.2 1.4q3.4 -2.6 6.6 -7.2z" fill="#2a4a8a" stroke="#0e1a3a" stroke-width=".4" stroke-linejoin="round"/>`
    + `<path d="M${f(cx + .8)} ${f(cy + 1.6)}q1.4 4.6 1 8.6l1 -.8l1 1.2q.8 -4.8 -1.6 -9.4z" fill="#22407a" stroke="#0e1a3a" stroke-width=".4" stroke-linejoin="round"/>`
    + `<path d="M${f(cx - 1.6)} ${f(cy + 2)}q-2.6 3.4 -5 5.2" stroke="#8ab0ee" stroke-width=".3" fill="none" opacity=".7"/>`;
  // the seal: a wax blob with a pressed rim and an anchor in it, the shadow it throws on the paper
  const blob = smooth([[cx - 4.6, cy + .4], [cx - 3.8, cy - 3], [cx - .6, cy - 4.6], [cx + 3, cy - 3.8], [cx + 4.8, cy - .6], [cx + 4.2, cy + 2.8], [cx + 1.6, cy + 4.6], [cx + 1.2, cy + 5.8], [cx - .4, cy + 4.6], [cx - 3.4, cy + 3.6]], true);
  out += `<path d="${blob}" fill="#2a0a02" opacity=".45" filter="url(#${sb})" transform="translate(-1.2 1.2)"/><path d="${blob}" fill="url(#${wx})" stroke="#3a0606" stroke-width=".4"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="3.1" fill="#8a1a14" stroke="#4a0808" stroke-width=".45"/><path d="M${f(cx - 2.6)} ${f(cy + 1.6)}a3.1 3.1 0 0 0 5 .6" stroke="#f08070" stroke-width=".35" fill="none" opacity=".8"/>`
    + `<path d="M${f(cx)} ${f(cy - 2)}v3.6M${f(cx - 1.1)} ${f(cy - 1.2)}h2.2M${f(cx - 1.8)} ${f(cy + .4)}q1.8 2.2 3.6 0" stroke="#4a0606" stroke-width=".42" fill="none" stroke-linecap="round"/><circle cx="${f(cx)}" cy="${f(cy - 2.3)}" r=".5" fill="none" stroke="#4a0606" stroke-width=".35"/>`
    + `<path d="M${f(cx + .6)} ${f(cy - 4)}q2.6 .2 3.6 2.4" stroke="#ffb4a0" stroke-width=".45" fill="none" stroke-linecap="round" opacity=".85"/><circle cx="${f(cx + 3.3)} " cy="${f(cy - 2.2)}" r=".4" fill="#fff0e0"/>`;
  return out;
}
// the captain's gloved right hand and the sleeve of her coat, one body from the elbow to the finger tips, drawn in
// the hand's frame (origin the wrist, x toward the fingers, the thumb on the -y side). Returns { back, thumb, P }:
// `back` (sleeve, cuff, glove, fingers) goes under the letter, `thumb` over it.
function gloveArm(u, L, W, a, s) {
  const P = frameOf(W, a, s), lv = { lit: '#f0cc9c', half: '#c0905c', shadow: '#7a4e2c', outline: '#2a1608' };   // buff riding leather
  const sl = nid('gsl', u), cf = nid('gcf', u), gv = nid('ggv', u), fn = nid('gfn', u);
  const across = (x, y0, y1, stops) => { const A = P(x, y0), B = P(x, y1); return `x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}"`; };
  const lg = (id, x, y0, y1, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ${across(x, y0, y1)}>${st.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let back = `<defs>${lg(sl, -40, -12, 12, [[0, '#14040a'], [.3, '#34101c'], [.68, '#68202e'], [.9, '#8c3444'], [1, '#4a1420']])}`
    + `${lg(cf, -16, -10, 10, [[0, '#1a0610'], [.4, '#3e1220'], [.82, '#7a2a3c'], [1, '#3a0e1a']])}`
    + `${lg(gv, 8, -7.5, 7.5, [[0, mix(lv.shadow, '#140a04', .4)], [.35, lv.shadow], [.7, lv.half], [.9, lv.lit], [1, lv.half]])}`
    + `${lg(fn, 22, -7, 7, [[0, mix(lv.shadow, '#140a04', .5)], [.5, lv.shadow], [1, lv.half]])}</defs>`;
  // the sleeve from the frame's edge, a few soft folds across it, the seam on top
  back += `<path d="${pth(P, [[-74, -14.5], [-56, -13.2], [-38, -11.4], [-22, -9.8], [-14, -9], [-14, 9.4], [-22, 10.2], [-38, 12], [-56, 13.8], [-74, 15]])}" fill="url(#${sl})" stroke="#0e0206" stroke-width=".6"/>`;
  for (const [x, k] of [[-58, 1], [-46, -1], [-33, 1], [-25, -1]]) { const a0 = P(x, 12.5 * k), a1 = P(x + 5, 2 * k), a2 = P(x - 1, -9 * k);
    back += `<path d="M${f(a0[0])} ${f(a0[1])}Q${f(a1[0])} ${f(a1[1])} ${f(a2[0])} ${f(a2[1])}" stroke="#12040a" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>`
      + `<path d="M${f(a0[0] + 1)} ${f(a0[1] - .6)}Q${f(a1[0] + 1)} ${f(a1[1] - .6)} ${f(a2[0] + 1)} ${f(a2[1] - .6)}" stroke="#a84a5a" stroke-width=".4" fill="none" opacity=".45"/>`; }
  // the glove: gauntlet, wrist and the back of the hand in one outline; the fingers bend away behind the letter
  const fingers = [[-4.3, 12.2, -.6], [-1.45, 13, .2], [1.4, 12.2, .9], [4.1, 7.6, 1.5]];   // the little finger curls under the sheet
  for (const [y, l, c] of fingers.slice().reverse()) back += `<path d="${pth(P, [[14, y - 1.55], [15 + l * .5, y - 1.5 + c * .4], [15 + l, y - 1.1 + c], [16 + l, y + c], [15 + l, y + 1.2 + c], [15 + l * .5, y + 1.55 + c * .4], [14, y + 1.55]])}" fill="url(#${fn})" stroke="${lv.outline}" stroke-width=".4"/>`;
  const glove = [[-13, -7.6], [-6, -5.8], [-.5, -5.3], [5, -6.5], [10.5, -7.1], [15.4, -6.6], [18.2, -4.6], [19.2, -1.5], [18.9, 1.6], [17.8, 4.6], [15, 6.3], [9, 6.4], [3, 5.6], [-1, 5.2], [-6, 5.8], [-13, 7.8]];
  back += `<path d="${pth(P, glove)}" fill="url(#${gv})" stroke="${lv.outline}" stroke-width=".5"/>`;
  // the stitched points on the back of the glove, the knuckles, the wrist crease, the leather's sheen
  for (const y of [-2.6, 0, 2.6]) { const A = P(3, y * .8), B = P(14, y); back += `<path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}" stroke="${lv.lit}" stroke-width=".3" stroke-dasharray=".8 .7" opacity=".7"/>`; }
  for (const y of [-4, -1.3, 1.4, 4]) { const A = P(16.4, y - 1.1), B = P(17.6, y), C = P(16.4, y + 1.1); back += `<path d="M${f(A[0])} ${f(A[1])}Q${f(B[0])} ${f(B[1])} ${f(C[0])} ${f(C[1])}" stroke="${mix(lv.lit, '#fff0d8', .3)}" stroke-width=".45" fill="none" opacity=".7"/>`; }
  { const A = P(-.5, -5), B = P(1.2, 0), C = P(-.2, 5); back += `<path d="M${f(A[0])} ${f(A[1])}Q${f(B[0])} ${f(B[1])} ${f(C[0])} ${f(C[1])}" stroke="${lv.outline}" stroke-width=".45" fill="none" opacity=".6"/>`; }
  { const A = P(2, 4.6), B = P(10, 5.6), C = P(16, 4.6); back += `<path d="M${f(A[0])} ${f(A[1])}Q${f(B[0])} ${f(B[1])} ${f(C[0])} ${f(C[1])}" stroke="#ffe0b8" stroke-width=".7" fill="none" opacity=".45" stroke-linecap="round"/>`; }
  // the coat's turned-back cuff over the gauntlet: velvet, gilt braid on both edges, two buttons
  back += `<path d="${pth(P, [[-26, -10.8], [-17, -10.2], [-9.4, -9.6], [-7.8, 0], [-9.4, 10], [-17, 10.8], [-26, 11.4]])}" fill="url(#${cf})" stroke="#0e0206" stroke-width=".55"/>`;
  for (const x of [-10.2, -24.6]) { const pts = [P(x, -9.6), P(x + 1.4, 0), P(x, 10.4)]; const d = `M${f(pts[0][0])} ${f(pts[0][1])}Q${f(pts[1][0])} ${f(pts[1][1])} ${f(pts[2][0])} ${f(pts[2][1])}`;
    back += `<path d="${d}" stroke="#5a3a0a" stroke-width="1.3" fill="none"/><path d="${d}" stroke="#d8b050" stroke-width=".7" fill="none"/><path d="${d}" stroke="#fff0b0" stroke-width=".25" fill="none" stroke-dasharray=".6 .6" opacity=".8"/>`; }
  for (const y of [-3.4, 3.6]) { const p = P(-17.6, y); back += K.shadeSphere(u, p[0], p[1], 1.25, L, 'brass', { outline: .3 }); }
  // the thumb, over the letter's face: from the ball of the hand round to the pad pressing the paper
  const th = [[3, -5.4], [7.5, -8.6], [13.5, -9.4], [19.5, -7.6], [23.4, -5.6], [24.8, -3.9], [23.8, -2.4], [20.4, -2.6], [15, -4], [9, -4.4], [4, -2.2]];
  const tg = nid('gth', u);
  let thumb = `<defs>${lg(tg, 14, -10, -2.4, [[0, mix(lv.shadow, '#140a04', .3)], [.45, lv.shadow], [.8, lv.half], [1, lv.lit]])}</defs>`;
  { const sp = P(20, -2.2); thumb += `<ellipse cx="${f(sp[0] - 1)}" cy="${f(sp[1] + 1.2)}" rx="3.4" ry="1.6" transform="rotate(${f(a)} ${f(sp[0] - 1)} ${f(sp[1] + 1.2)})" fill="#2a1406" opacity=".35"/>`; }
  thumb += `<path d="${pth(P, th)}" fill="url(#${tg})"/><path d="${pth(P, th.slice(0, 9), false)}" fill="none" stroke="${lv.outline}" stroke-width=".5"/>`;
  { const A = P(9, -7.6), B = P(16, -8.2), C = P(21.5, -6.4); thumb += `<path d="M${f(A[0])} ${f(A[1])}Q${f(B[0])} ${f(B[1])} ${f(C[0])} ${f(C[1])}" stroke="${lv.lit}" stroke-width=".3" stroke-dasharray=".8 .7" fill="none" opacity=".7"/>`; }
  { const A = P(16, -3.6), B = P(21, -2.6), C = P(24, -3.4); thumb += `<path d="M${f(A[0])} ${f(A[1])}Q${f(B[0])} ${f(B[1])} ${f(C[0])} ${f(C[1])}" stroke="#ffe4c0" stroke-width=".55" fill="none" opacity=".6" stroke-linecap="round"/>`; }
  // her ring on the ring finger, over the glove: a heavy gold band round the finger just past the knuckle, a sapphire
  // in a raised bezel on the back of the finger, the candle (on the right) lighting a warm spark in the stone and on the gold
  const rg = nid('grg', u), rs = nid('grs', u), rx = 20.3, ry = 1.75, sc = s;
  const band = [P(rx - .55, ry - 1.75), P(rx + .25, ry), P(rx - .55, ry + 1.75)], bd = `M${f(band[0][0])} ${f(band[0][1])}Q${f(band[1][0])} ${f(band[1][1])} ${f(band[2][0])} ${f(band[2][1])}`;
  const st = P(rx, ry), lt = P(rx + .6, ry + .9);
  let ring = `<defs>${lg(rg, rx, ry - 1.8, ry + 1.8, [[0, '#5a3606'], [.3, '#b8862a'], [.62, '#f4d070'], [.82, '#fff4c8'], [1, '#c89030']])}`
    + `<radialGradient id="${rs}" gradientUnits="userSpaceOnUse" cx="${f(st[0] - .6 * sc)}" cy="${f(st[1] - .7 * sc)}" r="${f(2.2 * sc)}"><stop offset="0" stop-color="#bfe0ff"/><stop offset=".35" stop-color="#3a7ad0"/><stop offset=".8" stop-color="#123e86"/><stop offset="1" stop-color="#081a40"/></radialGradient></defs>`;
  ring += `<path d="${bd}" stroke="#2a1604" stroke-width="${f(1.4 * sc)}" fill="none" stroke-linecap="round"/><path d="${bd}" stroke="url(#${rg})" stroke-width="${f(.92 * sc)}" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="${f(st[0])}" cy="${f(st[1])}" rx="${f(2 * sc)}" ry="${f(1.72 * sc)}" transform="rotate(${f(a)} ${f(st[0])} ${f(st[1])})" fill="#c8962e" stroke="#2a1604" stroke-width=".4"/>`
    + `<ellipse cx="${f(st[0])}" cy="${f(st[1])}" rx="${f(1.5 * sc)}" ry="${f(1.25 * sc)}" transform="rotate(${f(a)} ${f(st[0])} ${f(st[1])})" fill="url(#${rs})" stroke="#061230" stroke-width=".3"/>`
    + `<path d="M${f(st[0] - 1.1 * sc)} ${f(st[1] - .1 * sc)}q${f(.7 * sc)} ${f(-1 * sc)} ${f(1.7 * sc)} ${f(-.6 * sc)}" stroke="#e8f4ff" stroke-width=".35" fill="none" opacity=".75" stroke-linecap="round"/>`
    + `<ellipse cx="${f(lt[0])}" cy="${f(lt[1])}" rx="${f(.55 * sc)}" ry="${f(.35 * sc)}" fill="#ffb868" opacity=".8"/>`;
  { const g = P(rx - .1, ry - 1.7); ring += `<path d="M${f(g[0] - .5)} ${f(g[1] - .2)}q.6 -.6 1.3 -.2" stroke="#fff6d0" stroke-width=".35" fill="none" stroke-linecap="round"/>`; }
  // the spark: a small four-ray star on the stone toward the candle, and the warm glow round the ring
  { const q = P(rx + .5, ry + .3); ring += K.localGlow(u, { x: q[0], y: q[1], color: '#ffd890', power: .55, radius: 6 }, { core: false })
      + `<path d="M${f(q[0] - 2.4)} ${f(q[1])}h4.8M${f(q[0])} ${f(q[1] - 2.4)}v4.8" stroke="#ffffff" stroke-width=".3" stroke-linecap="round" opacity=".95"/><circle cx="${f(q[0])}" cy="${f(q[1])}" r=".55" fill="#ffffff"/>`; }
  return { back, thumb, ring, P };
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
      // the ally is the Revenge (decided with the user): her high overhanging stern with the lanterns on the left
      o += K.ship(u, Lo, { kind: 'revenge', x: 70, y: HZ + 9, scale: .4, detail: 'mid', sails: 'reefed', lights: true, flip: true, reflect: true, seed: 3 });
      // her answering lantern raised at the stern on its bracket: the signal that the letter is awaited
      o += K.localGlow(u, { x: 42, y: HZ - 8, color: '#ffc870', power: .9, radius: 5 }) + `<circle cx="42" cy="${HZ - 8}" r=".8" fill="#fff2c0"/>`
        + K.localGlow(u, { x: 42, y: HZ + 12, color: '#ffb050', power: .35, radius: 4 }, { squash: .3, core: false });
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
    let fg = spyglass(u, L, 126, 85.4, 154);
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
    }
    // the two cutlasses lie crossed on the chart, hilts toward us; each throws its shadow away from the candle,
    // the upper one's shadow falls across the lower blade
    { const away = (x, y) => { const dx = x - CAN.x, dy = y - CAN.y, l = Math.hypot(dx, dy); return [dx / l * 2.6, dy / l * 1.4 + .9]; };
      const A = { H: [76, 132], T: [162, 97], o: { grip: 18, w: 8, bend: 5, side: 1, hot: .62, bevelLit: true } };
      const B = { H: [152, 134], T: [72, 98], o: { grip: 18, w: 8, bend: 5, side: -1, hot: .3, bevelLit: false } };
      fg += cutlassShadow(u, A.H, A.T, A.o, away(118, 116)) + cutlass(u, L, A.H, A.T, A.o)
        + cutlassShadow(u, B.H, B.T, B.o, away(114, 118)) + cutlass(u, L, B.H, B.T, B.o); }
    // the inkwell and quill at the back left
    fg += inkwell(u, L, 26, 104, 1.1);
    // the captain's gloved hand comes in from the near left and holds the sealed letter up towards the ally's ship
    // in the window: the card she passes on. Fingers behind the sheet, the thumb on its face; the candle on the
    // right lights the glove's lower side and the paper
    { const Wr = [40.2, 123], ang = -52, hs = 1.4, H = gloveArm(u, L, Wr, ang, hs), C0 = H.P(21.5, 1.8), sb = nid('lsh', u);
      // the shadow the arm throws on the table (away from the candle, to the left)
      fg += `<defs><filter id="${sb}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter><clipPath id="${sb}c"><rect x="0" y="${TB}" width="200" height="${TF - TB}"/></clipPath></defs>`
        + `<g clip-path="url(#${sb}c)"><path d="${pth(frameOf([Wr[0] - 12, Wr[1] + 8], ang, hs), [[-60, -12], [-10, -8], [16, -7], [20, 0], [16, 7], [-10, 8], [-60, 12]])}" fill="#1a0a02" opacity=".4" filter="url(#${sb})"/></g>`;
      fg += H.back;
      // the letter's edge shades the fingers behind it
      fg += `<g transform="translate(${f(C0[0])} ${f(C0[1])}) rotate(${ang + 42})">`
        + `<path d="M-1.6 1.6L34 1.6L34 -24L-1.6 -24Z" fill="#140802" opacity=".35" filter="url(#${sb})" transform="translate(-1.4 1.6)"/>`
        + sealedLetter(u, 34, 23) + '</g>';
      fg += H.thumb + H.ring + K.localGlow(u, { x: C0[0] + 24, y: C0[1] - 14, color: '#ffd8a0', power: .22, radius: 22 }, { core: false }); }
    // the candle: its cast shadow on the table, the stick, the light
    fg += K.castShadow(u, L, { x: CAN.x, y: CAN.y, w: 8 * CAN.s, h: 2, horizon: HZ, d: .9 }) + K.candle(u, L, { ...CAN, seed: 4 });
    fg += K.localGlow(u, { x: CAN.x, y: flameY, color: '#ffd080', power: .8, radius: 22 }) + K.localGlow(u, { x: CAN.x, y: flameY + 10, color: '#ffa040', power: .45, radius: 70 }, { core: false })
      + glow(u, 108, 133, 34, 10, '#ffd8a0', .18)   // the blades catch the candle
      + glow(u, 100, 70, 90, 50, '#9ab8e0', .08)     // the moon fills the room a little
      + motes(18, 110, 30, 90, 110, '#ffe0b0', 12)
      + gloom(u, 40, 120, 0, 120, .35) + gloom(u, 100, 170, 100, 280, .5);
    return [bg, fg];
  } };
