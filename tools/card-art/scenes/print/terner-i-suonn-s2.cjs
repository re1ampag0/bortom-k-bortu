// «Тёрнер и Суонн» (Жемчужина, ПРИКАЗ: союзник берёт 1 карту, его корабль восстанавливает 1 клетку любой шкалы),
// refined from the first-round scene (portrait-pearl.cjs SCENES['Тёрнер и Суонн']): two different sabres driven into
// the wet sand of a beach crosswise, against the sunset — they lean on each other, and neither would stand alone. The
// left one is the smith's: a plain, heavy cutlass with a forged steel stirrup hilt, a black wire-bound grip and the
// smith's own mark struck by the ricasso; the right one is the lady's: a slim gilt sabre with a pierced shell, a pale
// grip and a silk ribbon tied round it, its tails streaming in the evening wind. Between their points a gold ring lies
// half in the sand; by the left one the smith's hammer, dropped. Two trails of footprints come to the sabres.
// Fixed against the first round: the sabres read as pick-axes (thin bars, a blob for a hilt) — now real blades with a
// flat, a fuller, a bevel and hilts built of parts; they stood on the sand — now they go into it (a lip of sand
// round each, the wet mirror under them); the ring was flat on the shore line — now it lies in the sand with its
// thickness and catches the sun; the hammer and the prints were under the glass — now above it.
// Light: the sun on the horizon right behind the sabres (key, contre-jour): the blades dark with hot edges and the
// sunset in their flats, long shadows coming at us; the sky's afterglow is the cold fill.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 82, SUN = { x: 104, y: 81 };
const WET0 = 97, WET1 = 120;               // the wet, mirroring band of the beach (behind it the surf)
// the sabres: pommel H, the guard at `g` units along, the blade goes into the sand at E
const SM = { H: [58, 26], E: [126, 113], g: 17, w: 8.4, bend: 7, side: 1 };     // the smith's cutlass (in front)
const SW = { H: [146, 28], E: [76, 114], g: 16, w: 6.6, bend: 5, side: -1 };    // the lady's sabre (behind)
const RING = { x: 101, y: 113.5, r: 8.1 };
const light = { time: 'dusk', haze: .45, key: { type: 'sun', x: SUN.x, y: SUN.y, el: 2, color: '#ffb070', power: .95 },
  fill: { color: '#6a5a8a', power: .4 }, rim: { az: 0, color: '#ffd0a0', power: .8 } };
const skel = { horizon: HZ, eye: 1.6, light: 'the setting sun right behind the sabres (contre-jour) + the afterglow of the sky (cold fill)', items: [
  ['smith cutlass', 52, 115, 80, 92, 'driven into the wet sand at 126,113'], ['lady sabre', 72, 116, 80, 90, 'driven into the sand at 76,114, leaning on the cutlass'],
  ['ring', 91, 119, 20, 11, 'half in the sand between the points'], ['hammer', 18, 126, 34, 12, 'lying on the sand'], ['ribbon', 146, 60, 46, 26, 'tied round the lady\'s grip']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${P2(pts[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${P2(p2)}`; }
  return d + (closed ? 'Z' : ''); }

// a sabre's frame: x along from the pommel to the sand entry, y across (+ toward the edge); the blade bows toward the spine
function frame(o) {
  const dx = o.E[0] - o.H[0], dy = o.E[1] - o.H[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, sd = o.side;
  const P = (lx, ly) => [o.H[0] + ux * lx - uy * ly * sd, o.H[1] + uy * lx + ux * ly * sd];
  const Lb = len - o.g, bow = t => -o.bend * Math.sin(t * Math.PI) * .9;   // the curve: the middle of the blade pushed to the spine
  const half = t => o.w / 2 * (1 - .22 * t);
  const spine = t => [o.g + t * Lb, -half(t) + bow(t)], edge = t => [o.g + t * Lb, half(t) + bow(t)], ridge = t => [o.g + t * Lb, half(t) * .2 + bow(t)];
  return { P, len, Lb, ux, uy, spine, edge, ridge, half, bow };
}

// the blade: the flat (spine to ridge) reflects the dusk sky — dark at the spine, the sunset glowing toward the ridge;
// the bevel (ridge to edge) catches the low sun; a fuller along the spine for two thirds; the cut-off end is in the sand
function blade(u, o, hot) {
  const G = frame(o), N = 16, ts = Array.from({ length: N + 1 }, (_, i) => i / N), { P } = G;
  const flat = [...ts.map(t => P(...G.spine(t))), ...ts.slice().reverse().map(t => P(...G.ridge(t)))];
  const bev = [...ts.map(t => P(...G.ridge(t))), ...ts.slice().reverse().map(t => P(...G.edge(t)))];
  const all = [...ts.map(t => P(...G.spine(t))), ...ts.slice().reverse().map(t => P(...G.edge(t)))];
  const A = P(o.g, 0), B = P(G.len, 0), fa = nid('tbf', u), fb = nid('tbb', u), fc = nid('tbc', u);
  const a0 = P(o.g + G.Lb * .5, -o.w / 2 + G.bow(.5)), a1 = P(o.g + G.Lb * .5, o.w / 2 + G.bow(.5));
  let s = `<defs>${linGrad(fa, A[0], A[1], B[0], B[1], [[0, '#14161e', 1], [.3, '#2c2a36', 1], [hot - .14, '#6a4448', 1], [hot - .03, '#e0905e', 1], [hot, '#ffd4a4', 1], [hot + .05, '#c06a4a', 1], [hot + .2, '#4a2e30', 1], [1, '#1e161a', 1]])}`
    + linGrad(fb, A[0], A[1], B[0], B[1], [[0, '#34343e', 1], [hot - .2, '#8a6a66', 1], [hot - .05, '#f0b484', 1], [hot, '#fff4dc', 1], [hot + .08, '#e8986a', 1], [hot + .25, '#6a4038', 1], [1, '#3a2a28', 1]])
    + linGrad(fc, a0[0], a0[1], a1[0], a1[1], [[0, '#05060a', .55], [.45, '#05060a', 0], [1, '#05060a', 0]]) + `</defs>`;
  s += `<path d="${poly(flat)}" fill="url(#${fa})"/><path d="${poly(flat)}" fill="url(#${fc})"/><path d="${poly(bev)}" fill="url(#${fb})"/>`;
  const ful = Array.from({ length: 12 }, (_, i) => { const t = .02 + i / 11 * .62; return [o.g + t * G.Lb, -G.half(t) * .48 + G.bow(t)]; });
  s += `<path d="${smooth(ful.map(p => P(...p)))}" stroke="#0e1014" stroke-width="${f(o.w * .13)}" fill="none" stroke-linecap="round" opacity=".8"/>`
    + `<path d="${smooth(ful.map(p => P(p[0], p[1] + o.w * .09)))}" stroke="#ffb888" stroke-width=".35" fill="none" opacity=".55" stroke-linecap="round"/>`
    + `<path d="${smooth(ts.map(t => P(...G.ridge(t))))}" stroke="#ffe6c4" stroke-width=".4" fill="none" opacity=".75"/>`
    + `<path d="${smooth(ts.map(t => P(...G.edge(t))))}" stroke="#fff4e0" stroke-width=".5" fill="none" opacity=".85"/>`
    + `<path d="${smooth(ts.map(t => P(...G.spine(t))))}" stroke="#ff9a60" stroke-width=".35" fill="none" opacity=".45"/>`
    + `<path d="${poly(all)}" fill="none" stroke="#0a0a0e" stroke-width=".5" stroke-linejoin="round"/>`;
  // the sun's star on the bevel
  { const q = P(...G.ridge(hot)); s += K.localGlow(u, { x: q[0], y: q[1], color: '#ffd8a0', power: .75, radius: 9 }, { core: false })
      + `<path d="M${f(q[0] - 4)} ${f(q[1])}h8M${f(q[0])} ${f(q[1] - 3)}v6" stroke="#fffaf0" stroke-width=".4" stroke-linecap="round" opacity=".9"/><circle cx="${f(q[0])}" cy="${f(q[1])}" r=".7" fill="#fff"/>`; }
  return { svg: s, G };
}

// a lip of sand pushed up round the blade where it goes in, its shadow and a glint of water in the slot
function entry(u, o) {
  const G = frame(o), E = o.E, w = o.w * .9;
  return `<path d="M${f(E[0] - w - 2)} ${f(E[1] + 1)}q${f(w * .5)} -3.2 ${f(w + 2)} -3q${f(w * .6)} -.2 ${f(w + 2)} 3q${f(-w - 2)} 2 ${f(-w * 2 - 4)} 0z" fill="#8a6650"/>`
    + `<path d="M${f(E[0] - w - 1)} ${f(E[1] - .2)}q${f(w * .5)} -2.6 ${f(w + 1)} -2.6q${f(w * .6)} 0 ${f(w + 1)} 2.6" stroke="#ffc898" stroke-width=".55" fill="none" opacity=".75"/>`
    + `<ellipse cx="${f(E[0])}" cy="${f(E[1] + .4)}" rx="${f(w * .7)}" ry=".9" fill="#1a0c08" opacity=".7"/>`
    + `<path d="M${f(E[0] - w * .5)} ${f(E[1] + .5)}h${f(w)}" stroke="#ffe0b0" stroke-width=".3" opacity=".7"/>`;
}

// the smith's hilt: a steel stirrup guard forged in one piece with a short back quillon, a black leather grip bound
// with twisted iron wire, a plain steel cap pommel with a peened button; his mark struck beside the ricasso
function smithHilt(u, L, o) {
  const G = frame(o), { P } = G, g = o.g, w = o.w;
  let s = K.shadeCyl(u, ...P(2.6, 0), ...P(g - 2, 0), 2.5, L, 'leather', { r1: 2.3, r2: 2.7, outline: .45, grain: false });
  { let wire = ''; for (let i = 0; i < 9; i++) { const t = 3.4 + (i + .5) / 9 * (g - 6.2), a = P(t - .7, -2.4), b = P(t + .7, 2.5); wire += `M${P2(a)}L${P2(b)}`; }
    s += `<path d="${wire}" stroke="#141418" stroke-width=".9" stroke-linecap="round"/><path d="${wire}" stroke="#c8a084" stroke-width=".3" stroke-linecap="round" opacity=".75"/>`; }
  // the cap pommel and its button
  s += K.shadeCyl(u, ...P(-.6, 0), ...P(2.8, 0), 3.1, L, 'iron', { r1: 2.4, r2: 3.1, outline: .45, ell: .3, face: 1 }) + K.shadeSphere(u, ...P(-1.2, 0), 1.3, L, 'iron', { outline: .3 });
  // the guard: a flat steel bar from the ricasso out over the edge side, round the hand, into the pommel
  const bp = [P(g, w * .55), P(g - 1, w * 1.75), P(g * .55, w * 1.95), P(g * .15, w * 1.45), P(1.6, 2.6)];
  const d = smooth(bp);
  s += `<path d="${d}" stroke="#0c0d10" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#4a4a56" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    + `<path d="${d}" stroke="#ffc090" stroke-width=".55" fill="none" stroke-linecap="round" opacity=".8" transform="translate(.55 .2)"/>`;
  // the cross-bar at the blade's root, the back quillon curled to a knob
  const q0 = P(g, -w * 1.3), q1 = P(g + .4, w * .7), qk = P(g - 2.6, -w * 1.55);
  s += `<path d="M${P2(q1)}L${P2(q0)}Q${P2(P(g - .6, -w * 1.75))} ${P2(qk)}" stroke="#0c0d10" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M${P2(q1)}L${P2(q0)}Q${P2(P(g - .6, -w * 1.75))} ${P2(qk)}" stroke="#545462" stroke-width="2.3" fill="none" stroke-linecap="round"/>`
    + `<path d="M${P2(q1)}L${P2(q0)}" stroke="#ffcc98" stroke-width=".5" opacity=".8" transform="translate(.5 .1)"/>` + K.shadeSphere(u, ...qk, 1.5, L, 'iron', { outline: .3 });
  s += `<path d="${poly([P(g - .6, -w * .7), P(g + 1.6, -w * .7), P(g + 1.6, w * .75), P(g - .6, w * .75)])}" fill="#2a2a34" stroke="#0a0a0e" stroke-width=".4"/>`;
  // the smith's mark: a small hammer over an anvil struck into the ricasso
  { const c = P(g + 5.4, -.4), a = Math.atan2(G.uy, G.ux) * 180 / Math.PI;
    s += `<g transform="translate(${P2(c)}) rotate(${f(a + 90)}) scale(.8)" opacity=".85"><path d="M-2.2 1.3h4.4l-.8 1.1h-2.8zM-2.8 .5h5.6" stroke="#ffd8b0" stroke-width=".45" fill="none"/><path d="M-.6 -.2l1.6 -2.6M-.4 -3.2l2.6 1.2" stroke="#ffd8b0" stroke-width=".55" stroke-linecap="round"/></g>`; }
  return s;
}

// the lady's hilt: a gilt pierced shell at the blade's root, a slim gilt knuckle bow, a pale grip (ray skin) bound
// with gold wire, a pear pommel; a rose silk ribbon tied round the grip in a bow, two tails streaming in the wind
function ladyHilt(u, L, o) {
  const G = frame(o), { P } = G, g = o.g, w = o.w;
  let s = K.shadeCyl(u, ...P(3, 0), ...P(g - 1.8, 0), 2, L, 'bone', { r1: 1.7, r2: 2.1, outline: .4, grain: false });
  { let wire = ''; for (let i = 0; i < 10; i++) { const t = 3.8 + (i + .5) / 10 * (g - 6), a = P(t - .5, -1.9), b = P(t + .5, 2); wire += `M${P2(a)}L${P2(b)}`; }
    s += `<path d="${wire}" stroke="#7a5414" stroke-width=".55" stroke-linecap="round"/><path d="${wire}" stroke="#ffe08a" stroke-width=".22" stroke-linecap="round" opacity=".9"/>`; }
  s += K.shadeSphere(u, ...P(.8, 0), 2.7, L, 'brass', { outline: .4 }) + K.shadeCyl(u, ...P(2.4, 0), ...P(3.6, 0), 1.6, L, 'brass', { outline: .3 }) + K.shadeSphere(u, ...P(-1.9, 0), .9, L, 'brass', { outline: .25 });
  const bp = [P(g + .2, w * .8), P(g - 2, w * 2.1), P(g * .5, w * 2.2), P(g * .14, w * 1.4), P(2.4, 1.8)], d = smooth(bp);
  s += `<path d="${d}" stroke="#3a2406" stroke-width="2" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#c8902e" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fff0b0" stroke-width=".4" fill="none" stroke-linecap="round" opacity=".85" transform="translate(.4 .1)"/>`;
  // the shell: an oval dish across the blade's root, pierced with a ring of holes, its rim lit
  { const cg = nid('tls', u), c = P(g + .6, .3), pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2; return P(g + .6 + Math.cos(a) * 3, .3 + Math.sin(a) * w * 1.25); });
    s += `<defs>${radGrad(cg, c[0] + 1.4, c[1] + 1, w * 1.6, [[0, '#fff4c8', 1], [.25, '#f0c060', 1], [.6, '#a87420', 1], [1, '#3a2406', 1]])}</defs><path d="${poly(pts)}" fill="url(#${cg})" stroke="#2a1804" stroke-width=".5" stroke-linejoin="round"/>`
      + [-.75, -.35, .45, .85].map(k => { const p = P(g + .6, .3 + k * w * 1.05); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".5" fill="#1a0e04"/>`; }).join('')
      + `<path d="${smooth(pts.slice(2, 10))}" stroke="#fff6d0" stroke-width=".45" fill="none" opacity=".8"/>`; }
  // the ribbon: tied round the grip's middle, two tails flowing right on the wind, twisting (light and dark sides)
  { const k0 = P(g * .55, 0), rib = (pts, wd, seed) => {
      // a smooth band along the tail: its width turns with the twist (a narrow neck where it shows its edge), the
      // lit face rose, the turned-over face dark wine
      const n = 28, C = []; for (let i = 0; i <= n; i++) { const t = i / n * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(t)), q = t - j, a = pts[Math.max(0, j - 1)], b = pts[j], c = pts[j + 1], d = pts[Math.min(pts.length - 1, j + 2)];
        const cr = (p0, p1, p2, p3, k) => .5 * (2 * p1 + (-p0 + p2) * k + (2 * p0 - 5 * p1 + 4 * p2 - p3) * k * k + (-p0 + 3 * p1 - 3 * p2 + p3) * k * k * k);
        C.push([cr(a[0], b[0], c[0], d[0], q), cr(a[1], b[1], c[1], d[1], q)]); }
      const tw = i => Math.cos(i / n * Math.PI * 2.2 + seed), Lft = [], Rgt = [];
      C.forEach((p, i) => { const a = C[Math.max(0, i - 1)], b = C[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ww = wd * (.25 + .75 * Math.abs(tw(i))) * (1 - i / n * .35) / 2;
        Lft.push([p[0] - dy / l * ww, p[1] + dx / l * ww]); Rgt.push([p[0] + dy / l * ww, p[1] - dx / l * ww]); });
      let out = `<path d="${smooth(Lft)}L${smooth(Rgt.slice().reverse()).slice(1)}Z" fill="#d8486a" stroke="#3a0a18" stroke-width=".3" stroke-linejoin="round"/>`;
      // the dark spans where the back of the ribbon shows
      let i0 = null; for (let i = 0; i <= n + 1; i++) { const back = i <= n && tw(i) < 0; if (back && i0 == null) i0 = i; if (!back && i0 != null) { const a = Math.max(0, i0 - 1), b = Math.min(n, i);
          out += `<path d="${smooth(Lft.slice(a, b + 1))}L${smooth(Rgt.slice(a, b + 1).reverse()).slice(1)}Z" fill="#7a1a34" opacity=".9"/>`; i0 = null; } }
      out += `<path d="${smooth(Lft)}" stroke="#ffb8c8" stroke-width=".45" fill="none" opacity=".7"/>`;
      return out; };
    const t1 = [k0, [k0[0] + 6, k0[1] + 3], [k0[0] + 13, k0[1] + 2], [k0[0] + 20, k0[1] + 6], [k0[0] + 27, k0[1] + 5], [k0[0] + 34, k0[1] + 9], [k0[0] + 40, k0[1] + 8.4]];
    const t2 = [k0, [k0[0] + 5, k0[1] + 6.5], [k0[0] + 11, k0[1] + 8], [k0[0] + 17, k0[1] + 13], [k0[0] + 23, k0[1] + 14], [k0[0] + 29, k0[1] + 18.5]];
    s += rib(t2, 3.2, 2) + rib(t1, 3.6, 5);
    // the knot and the two loops of the bow over the grip
    s += [[-1, '#b8304e'], [1, '#d8486a']].map(([sd, c]) => { const d = `M${f(k0[0])} ${f(k0[1])}c${sd * -1} -5 ${sd * 7} -6.4 ${sd * 6.4} -2.4c${sd * -.4} 2.4 ${sd * -4} 3 ${sd * -6.4} 2.4`;
        return `<path d="${d}" stroke="#3a0a18" stroke-width="2.6" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#ffc0d0" stroke-width=".4" fill="none" opacity=".6" transform="translate(0 -.5)"/>`; }).join('')
      + `<ellipse cx="${f(k0[0])}" cy="${f(k0[1])}" rx="1.4" ry="1.7" fill="#9a2440" stroke="#3a0a18" stroke-width=".3"/>`; }
  return s;
}

module.exports = { name: 'Тёрнер и Суонн', variant: 's2', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), R = rng(17);
    // ——— the sky: dusk, a low bank of clouds lit from below, the sun half set behind the sabres; the sea ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 26, seed: 5 }) + K.sunMoon(u, L, { r: 9 })
      + K.cloud(u, L, { x: 40, y: 62, w: 52, h: 9, seed: 3, far: .4 }) + K.cloud(u, L, { x: 168, y: 56, w: 46, h: 8, seed: 7, far: .45 })
      + K.cloud(u, L, { x: 120, y: 40, w: 40, h: 6, seed: 11, far: .6 }) + K.cloud(u, L, { x: 64, y: 30, w: 34, h: 5, seed: 13, far: .7 })
      + K.water(u, L, { horizon: HZ, bottom: WET0 + 2, swell: .35, seed: 6, glitter: SUN.x });
    // the surf: the last wave running up the sand, foam on its lip
    bg += `<path d="M-6 ${WET0 - 3}Q40 ${WET0 - 5} 90 ${WET0 - 3.4}T206 ${WET0 - 3.6}V${WET0 + 3}H-6Z" fill="#3a2e3a" opacity=".6"/>`
      + K.foam(u, { x: 100, y: WET0 - 1.4, w: 220, seed: 4, h: 2.2, L });
    // ——— the beach: the wet band mirrors the sky (sunset streak under the sun), then the dry sand ———
    { const g = nid('tws', u), g2 = nid('twd', u), cl = nid('twc', u);
      bg += `<defs>${linGrad(g, 0, WET0, 0, WET1 + 8, [[0, '#d88a5a', 1], [.25, '#8a5a5a', 1], [.7, '#4a3a48', 1], [1, '#3a2e30', 1]])}`
        + linGrad(g2, 0, WET1, 0, 280, [[0, '#6a4e3e', 1], [.3, '#4a3428', 1], [1, '#1e140e', 1]]) + `</defs>`
        + `<rect x="-6" y="${WET0}" width="212" height="${WET1 - WET0 + 10}" fill="url(#${g})"/>`
        + `<path d="M-6 ${WET1 + 2}Q50 ${WET1 - 2} 100 ${WET1 + 1}T206 ${WET1}V290H-6Z" fill="url(#${g2})"/>`
        // the sun's long streak on the wet sand: a soft column, a few broken glints in it
        + glow(u, SUN.x, WET0 + 9, 9, 13, '#ffd8a0', .55)
        // the bright mirror column of the sun down the wet sand: a hot core, widening and fading toward us
        + (() => { const cg = nid('twl', u), bl = nid('twb', u); return `<defs>${linGrad(cg, 0, WET0, 0, WET1 + 14, [[0, '#fff0c8', .8], [.35, '#ffd090', .5], [.75, '#ffb070', .18], [1, '#ffb070', 0]])}<filter id="${bl}" x="-60%" y="-10%" width="220%" height="120%"><feGaussianBlur stdDeviation="2.2 1"/></filter></defs>`
          + `<path d="M${SUN.x - 5} ${WET0}L${SUN.x + 5} ${WET0}L${SUN.x + 12} ${WET1 + 14}L${SUN.x - 12} ${WET1 + 14}Z" fill="url(#${cg})" filter="url(#${bl})" style="mix-blend-mode:screen"/>`; })()
        + glow(u, SUN.x, WET0 + 14, 14, 20, '#ffc888', .4)
        + Array.from({ length: 11 }, (_, k) => { const y = WET0 + 2 + k * 2.6 + R() * 1.2, w = 3 + k * 1.3 + R() * 3; return `<path d="M${f(SUN.x - w / 2 + (R() - .5) * 4)} ${f(y)}h${f(w)}" stroke="#fff0c8" stroke-width=".55" stroke-linecap="round" opacity="${f(.8 - k * .1)}"/>`; }).join('')
        // ripple marks in the dry sand, lit on the sun's side
        + Array.from({ length: 16 }, (_, k) => { const y = WET1 + 4 + k * k * .55 + R() * 2, x = -10 + R() * 40, ln = 40 + R() * 80; return `<path d="M${f(x)} ${f(y)}q${f(ln * .25)} -1.4 ${f(ln * .5)} 0t${f(ln * .5)} 0" stroke="#1a100a" stroke-width="${f(.5 + k * .06)}" fill="none" opacity=".5"/><path d="M${f(x)} ${f(y - .6)}q${f(ln * .25)} -1.4 ${f(ln * .5)} 0t${f(ln * .5)} 0" stroke="#c8906a" stroke-width=".35" fill="none" opacity=".45"/>`; }).join('')
        // a thin sheet of the last wave sliding back, its lace edge
        + `<path d="M-6 ${WET0 + 6}Q30 ${WET0 + 9} 70 ${WET0 + 7}T150 ${WET0 + 9}T206 ${WET0 + 7}" stroke="#ffe8d0" stroke-width=".6" fill="none" opacity=".55"/>`
        + `<path d="M-6 ${WET0 + 6.8}Q30 ${WET0 + 9.8} 70 ${WET0 + 7.8}T150 ${WET0 + 9.8}T206 ${WET0 + 7.8}" stroke="#2a1e24" stroke-width=".5" fill="none" opacity=".4"/>`;
      // two trails of footprints coming to the sabres from the near left and the near right (one a bare heavy boot,
      // the other a slim shoe), shrinking with distance
      for (const side of [-1, 1]) for (let k = 0; k < 7; k++) { const t = k / 6, y = 150 - t * 34, x = 100 + side * (50 - t * 22) + (k % 2 ? 3 : -3) * (1 - t * .5), s = 1.25 - t * .55;
        const rx = (side < 0 ? 2.6 : 1.9) * s, ry = (side < 0 ? 1.5 : 1.2) * s;
        bg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="#120a06" opacity=".7"/><path d="M${f(x - rx)} ${f(y - ry * .3)}q${f(rx)} ${f(-ry * 1.1)} ${f(rx * 2)} 0" stroke="#d8a080" stroke-width="${f(.4 * s)}" fill="none" opacity=".55"/>`; }
    }
    // ——— the long shadows of the sabres, coming at us from the entries, fanning from the sun ———
    let fg = '';
    { const sb = nid('tsb', u); fg += `<defs><filter id="${sb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(#${sb})" opacity=".78" style="mix-blend-mode:multiply">`;
      for (const o of [SM, SW]) { const e = o.E, dx = e[0] - SUN.x, dy = e[1] - SUN.y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, len = 90;
        fg += `<path d="M${f(e[0] - 1.6)} ${f(e[1])}L${f(e[0] + ux * len - 6)} ${f(e[1] + uy * len)}L${f(e[0] + ux * len + 6)} ${f(e[1] + uy * len)}L${f(e[0] + 1.6)} ${f(e[1])}Z" fill="#1a0e18"/>`; }
      fg += `</g>`; }
    // ——— the reflections of the sabres in the wet sand, then the sabres: the lady's behind, the smith's in front ———
    const sw = blade(u, SW, .62), sm = blade(u, SM, .58);
    const swAll = sw.svg + ladyHilt(u, L, SW), smAll = sm.svg + smithHilt(u, L, SM);
    fg += K.reflection(u, swAll, { y: SW.E[1], h: 22, L, opacity: .62, seed: 3 }) + K.reflection(u, smAll, { y: SM.E[1], h: 22, L, opacity: .62, seed: 5 });
    // each sabre is cut at its own sand entry (the part in the sand hidden)
    const cut = (o, svg) => { const id = nid('tcp', u); return `<defs><clipPath id="${id}"><rect x="-10" y="-10" width="220" height="${f(o.E[1] + 10.4)}"/></clipPath></defs><g clip-path="url(#${id})">${svg}</g>`; };
    fg += cut(SW, swAll) + entry(u, SW);
    // where the lady's blade lies against the smith's: a dark contact under it
    fg += cut(SM, smAll) + entry(u, SM);
    // ——— the ring, half in the sand between the points: a gold band seen from above at an angle, the sun in it ———
    { const { x, y, r } = RING, k = .56, ry = r * k, bw = 2, rg = nid('trg', u), ri = nid('tri', u), rh = nid('trh', u);
      fg += `<ellipse cx="${x + 1}" cy="${f(y + 2)}" rx="${r + 1.6}" ry="${f(ry + 1)}" fill="#1a0e08" opacity=".5"/>`
        + `<defs>${linGrad(rg, x - r, y, x + r, y, [[0, '#7a4a10', 1], [.3, '#e8b040', 1], [.55, '#fff6c8', 1], [.75, '#d89a28', 1], [1, '#5a3408', 1]])}`
        + linGrad(ri, x - r, y, x + r, y, [[0, '#2a1604', 1], [.5, '#8a5a14', 1], [1, '#2a1604', 1]])
        + `<clipPath id="${rh}"><ellipse cx="${x}" cy="${f(y)}" rx="${f(r - bw * .5)}" ry="${f(ry - bw * .5)}"/></clipPath></defs>`
        // the hole: wet sand seen through it, the band's own shadow on it at the far side, then the band's inner face
        + `<ellipse cx="${x}" cy="${f(y)}" rx="${f(r - bw * .5)}" ry="${f(ry - bw * .5)}" fill="#7a5848"/>`
        + `<g clip-path="url(#${rh})"><ellipse cx="${x}" cy="${f(y - 1.4)}" rx="${f(r - .4)}" ry="${f(ry - .6)}" fill="none" stroke="#24140c" stroke-width="2.2" opacity=".75"/>`
        + `<path d="M${f(x - 3)} ${f(y + 1.2)}h6" stroke="#ffd8a8" stroke-width=".5" stroke-linecap="round" opacity=".7"/></g>`
        // the far half of the band (its inside face seen, darker), then the near half (the outside face, the sun in it)
        + `<path d="M${f(x - r)} ${f(y)}A${f(r)} ${f(ry)} 0 0 1 ${f(x + r)} ${f(y)}" stroke="url(#${ri})" stroke-width="${bw}" fill="none"/>`
        + `<path d="M${f(x - r + .4)} ${f(y - .6)}A${f(r - .4)} ${f(ry - .4)} 0 0 1 ${f(x + r - .4)} ${f(y - .6)}" stroke="#ffd070" stroke-width=".4" fill="none" opacity=".75"/>`
        + `<path d="M${f(x - r)} ${f(y)}A${f(r)} ${f(ry)} 0 0 0 ${f(x + r)} ${f(y)}" stroke="url(#${rg})" stroke-width="${bw + .8}" fill="none"/>`
        // the rims: the outer edge dark, the inner edge of the near half a thin bright line, so the band reads as a hoop
        + `<ellipse cx="${x}" cy="${f(y)}" rx="${f(r + bw * .55)}" ry="${f(ry + bw * .55)}" fill="none" stroke="#2a1604" stroke-width=".45"/>`
        + `<path d="M${f(x - r + bw * .6)} ${f(y + .3)}A${f(r - bw * .6)} ${f(ry - bw * .6)} 0 0 0 ${f(x + r - bw * .6)} ${f(y + .3)}" stroke="#fff4c8" stroke-width=".45" fill="none" opacity=".9"/>`
        // sand heaped over its near-left edge (half sunk)
        + `<path d="M${f(x - r - 2.6)} ${f(y + ry + .6)}q2.4 -4 6.4 -1.6q1.8 1.4 3.4 2.6z" fill="#6a4c3c"/><path d="M${f(x - r - 2.2)} ${f(y + ry)}q2.2 -3.2 5.6 -1.4" stroke="#e0a880" stroke-width=".4" fill="none" opacity=".7"/>`
        + K.localGlow(u, { x: x + 2.4, y: y + ry, color: '#ffe0a0', power: .7, radius: 12 }, { core: false })
        + `<path d="M${x + 2.4 - 4.8} ${f(y + ry)}h9.6M${x + 2.4} ${f(y + ry - 3.6)}v7.2" stroke="#fffaf0" stroke-width=".45" stroke-linecap="round"/><circle cx="${x + 2.4}" cy="${f(y + ry)}" r=".8" fill="#fff"/>`; }
    // ——— the smith's hammer, dropped on the sand at the left: an ash handle, a forged head, its shadow ———
    { const a = [20, 128], b = [44, 117], hv = [(b[0] - a[0]) / 26.4, (b[1] - a[1]) / 26.4], pv = [-hv[1], hv[0]];
      fg += `<path d="M${f(a[0] + 1)} ${f(a[1] + 2.4)}L${f(b[0] + 2)} ${f(b[1] + 2.6)}L${f(b[0] + 8)} ${f(b[1] + 4)}L${f(b[0] - 6)} ${f(b[1] + 6)}Z" fill="#120a08" opacity=".45" filter="url(#drop${u})"/>`
        + K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.6, L, 'oak', { r1: 1.5, r2: 1.8, outline: .4, cap: 'round', seed: 3 });
      const c = [b[0] + hv[0] * 1.4, b[1] + hv[1] * 1.4], h1 = [c[0] + pv[0] * 6.4, c[1] + pv[1] * 6.4], h2 = [c[0] - pv[0] * 5.2, c[1] - pv[1] * 5.2];
      fg += K.shadeCyl(u, h2[0], h2[1], h1[0], h1[1], 2.6, L, 'iron', { r1: 2.2, r2: 2.9, outline: .45, ell: .5, face: 2 })
        + `<path d="M${P2(h2)}L${P2(h1)}" stroke="#ffc090" stroke-width=".45" opacity=".7" transform="translate(.4 -1.8)"/>`; }
    // ——— air: warm haze low over the sea, sparks of sand in the light, the near sand sinking into shadow ———
    fg += glow(u, SUN.x, SUN.y + 2, 120, 22, '#ffa860', .32) + glow(u, 100, 76, 40, 50, '#ffc890', .12) + motes(14, 60, 70, 90, 40, '#ffe0b0', 9)
      + gloom(u, 100, 120, 100, 280, .6, '#0a0410') + gloom(u, 100, 60, 100, 0, .25, '#060410');
    return [bg, fg];
  } };
