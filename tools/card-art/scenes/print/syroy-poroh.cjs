// «Сырой порох» (Колода моря): the powder room below, seen from its door in one-point perspective — the planked floor
// gone under black-green water, the ship's sides with their frames as walls, the deck beams overhead. A sea has burst
// the scuttle in the deckhead and a torrent pours in at the left; kegs float and wallow, one has burst and its powder
// spreads over the water in a black, glossy mush. High on the right side, on a shelf above the flood, the other half
// of the kegs stand dry. The one light is the lantern behind the glass of the light room in the far bulkhead (as
// powder rooms were lit): warm on the dry kegs, a long shimmer on the water; the storm's grey through the scuttle only
// fills. Each team loses half its Powder. Brief: docs/mockups/print/card-briefs.md «Сырой порох».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad } = K;

// ——— the room: one vanishing point; a point of the room is (X, Y) on the front plane (relative to the VP) times the
// depth factor s (1 — the front plane, SB — the far bulkhead); x = VX + X·s, y = VY + Y·s
const VX = 98, VY = 76, SB = .36;
const XL = -132, XR = 142, YC = -122, YF = 96, YW = 62;   // left / right side, deckhead, floor, the water's surface
const P = (X, Y, s) => [VX + X * s, VY + Y * s];
const yW = s => VY + YW * s;   // the water's surface at depth s
const WIN = { x: 99, y: 60 };  // the light room's window in the far bulkhead (the lantern behind it)
const light = { time: 'night', key: { type: 'point', x: WIN.x, y: WIN.y, h: 1.2, gy: yW(SB), color: '#ffb24a', power: 1, radius: 150 },
  fill: { color: '#2e4a55', power: .38 }, haze: .2 };
const skel = { horizon: VY, eye: 1.2, light: 'the lantern behind the light-room window (99, 60) in the far bulkhead; cold grey from the scuttle top left',
  items: [
    ['far bulkhead + window', 50, 113, 101, 80, 'back wall, s .36'],
    ['deckhead: beams, planks, the burst scuttle (ragged hole, lid hanging)', 0, 33, 200, 33, 'ceiling; hole x 36–85, y 9–22'],
    ['torrent', 44, 108, 40, 96, 'from the hole (s .44–.55) down onto the water, curl of foam at the top'],
    ['shelf + 4 dry kegs', 138, 60, 70, 46, 'on knees on the right side, high over the water'],
    ['floating kegs (wet), one burst', 30, 132, 150, 40, 'on the water, s .5–.8'],
    ['powder stains', 45, 104, 120, 26, 'black swirls on the water round the kegs, y 104–130'],
    ['black mush', 40, 160, 150, 60, 'on the water, from the burst keg towards us'],
  ] };

function smooth(pts, closed = true) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
const poly = pts => `M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
const blur = (id, sd) => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
const rad = (id, cx, cy, r, st, o = '') => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${o}>${st.map(([q, c, a]) => `<stop offset="${f(q)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</radialGradient>`;
// the wood of the room lit by the window: warm near it, sinking to brown-black away from it
const WOOD = { lit: '#8e5a2e', mid: '#41291a', dark: '#150e0a', deep: '#0a0806' };
function woodLit(u, r = 150, cy = WIN.y) { const id = nid('wl', u); return { id, defs: rad(id, WIN.x, cy, r, [[0, WOOD.lit], [.22, WOOD.mid], [.62, WOOD.dark], [1, WOOD.deep]]) }; }

// a lying keg floating, sunk to its middle: the kit keg, then the water closed over its lower half (the same paint as
// the surface, so it joins it), a lit wet line where it breaks the surface
function floating(u, L, o, waterFill) {
  const s = o.s, cx = o.x, wy = o.wy, w = 30 * s, h = 19 * s, mk = nid('fm', u), g = nid('fg', u);
  let out = K.barrel(u, L, { x: cx, y: wy + h * .5, s, kind: 'powder', lying: true, open: o.open, rot: o.rot || 0, seed: o.seed, contact: false });
  out += `<defs>${linGrad(g, 0, wy - 1.2 * s, 0, wy + 1.4 * s, [[0, '#fff', 0], [1, '#fff', 1]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="280"><rect x="${f(cx - w)}" y="${f(wy - 1.2 * s)}" width="${f(w * 2)}" height="${f(h * 1.4)}" fill="url(#${g})"/></mask></defs>`
    + `<rect x="${f(cx - w * .75)}" y="${f(wy - 1.2 * s)}" width="${f(w * 1.5)}" height="${f(h * 1.2)}" fill="${waterFill}" mask="url(#${mk})" opacity=".92"/>`;
  // the line of wet light where the keg meets the water, and its ring of ripple
  out += `<ellipse cx="${f(cx)}" cy="${f(wy + .4 * s)}" rx="${f(w * .56)}" ry="${f(2.2 * s)}" fill="none" stroke="#e8b878" stroke-width="${f(.45 * s)}" opacity=".45"/>`
    + `<ellipse cx="${f(cx)}" cy="${f(wy + .8 * s)}" rx="${f(w * .78)}" ry="${f(3.4 * s)}" fill="none" stroke="#c9a070" stroke-width="${f(.3 * s)}" opacity=".25"/>`;
  return out;
}
// black wet powder spread on the water: a glossy mush with lumps, a brown-grey rim where it thins, warm glints
function mush(u, cx, cy, rx, ry, seed, o = {}) {
  const R = rng(seed), pts = []; const n = 12;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (R() - .5) * .4, k = .6 + R() * .55 + (Math.abs(Math.sin(a * 2 + seed)) * .25); pts.push([cx + Math.cos(a) * rx * k + (o.lean || 0) * Math.max(0, Math.sin(a)) * rx, cy + Math.sin(a) * ry * k]); }
  const id = nid('mu', u);
  let out = `<defs>${rad(id, cx, cy, Math.max(rx, ry) * 1.2, [[0, '#0b0a09'], [.6, '#141210'], [1, '#2a2622', .0]], ` gradientTransform="translate(${f(cx)} ${f(cy)}) scale(1 ${f(ry / rx)}) translate(${f(-cx)} ${f(-cy)})"`)}</defs>`;
  // the powder clouding the water round it, brown-black, and tendrils drawn out by the swirl
  const hb = nid('mh', u);
  out += `<defs>${blur(hb, Math.max(.8, rx * .09))}</defs><path d="${smooth(pts.map(([x, y]) => [cx + (x - cx) * 1.5, cy + (y - cy) * 1.6]))}" fill="#1a1612" opacity=".7" filter="url(#${hb})"/>`;
  for (let i = 0; i < 4; i++) { const a = R() * Math.PI * 2, sx = cx + Math.cos(a) * rx * .7, sy = cy + Math.sin(a) * ry * .7, ex = cx + Math.cos(a + .6) * rx * (1.5 + R() * .6), ey = cy + Math.sin(a + .6) * ry * (1.6 + R() * .6);
    out += `<path d="M${f(sx)} ${f(sy)}Q${f(cx + Math.cos(a + .3) * rx * 1.4)} ${f(cy + Math.sin(a + .3) * ry * 1.4)} ${f(ex)} ${f(ey)}" stroke="#14110e" stroke-width="${f(clamp(ry * .35, .6, 3))}" fill="none" stroke-linecap="round" opacity=".8" filter="url(#${hb})"/>`; }
  out += `<path d="${smooth(pts.map(([x, y]) => [cx + (x - cx) * 1.1, cy + (y - cy) * 1.12]))}" fill="#4a4036" opacity=".55"/><path d="${smooth(pts)}" fill="#100e0d"/>`;
  // lumps and grains
  for (let i = 0; i < Math.round(rx * 1.4); i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * .8, x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r, q = (.25 + R() * .6) * (rx / 10);
    out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(q)}" ry="${f(q * ry / rx * 1.4)}" fill="${R() < .5 ? '#2a2420' : '#070606'}"/>`; }
  // the lantern's glints on the wet black
  for (let i = 0; i < 3 + rx / 6; i++) { const x = cx + (R() - .5) * rx * 1.1, y = cy + (R() - .6) * ry * .9, l = (1 + R() * 2) * rx / 12;
    out += `<path d="M${f(x - l)} ${f(y)}q${f(l)} ${f(-l * .25)} ${f(l * 2)} 0" stroke="#ffcf8a" stroke-width="${f(clamp(rx / 40, .25, .7))}" fill="none" opacity="${f(.4 + R() * .4)}"/>`; }
  return out;
}

// the powder dissolving in the water round the kegs: a muddy brown cloud, black swirling streaks with brown-grey rims
// where they thin (black on black water reads only by its rim), lumps strung along them, the lantern's glints
function stain(u, cx, cy, rx, ry, seed) {
  const R = rng(seed), hb = nid('sh', u), sb = nid('ss', u);
  let out = `<defs>${blur(hb, Math.max(1, ry * .5))}${blur(sb, .35)}</defs><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * 1.25)}" ry="${f(ry * 1.4)}" fill="#6e583c" opacity=".42" filter="url(#${hb})"/>`;
  let rim = '', core = '', lumps = '';
  for (let i = 0; i < 6; i++) { const a0 = R() * Math.PI * 2, sw = 1.4 + R() * 1.6, dir = R() < .5 ? -1 : 1, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8, a = a0 + dir * sw * t, r = .25 + t * (.75 + R() * .25); pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    const d = smooth(pts, false), w = ry * (.32 + R() * .3);
    rim += `<path d="${d}" stroke-width="${f(w * 1.9)}"/>`; core += `<path d="${d}" stroke-width="${f(w)}"/>`;
    for (let k = 1; k < 8; k += 2) if (R() < .7) { const q = w * (.5 + R() * .5); lumps += `<ellipse cx="${f(pts[k][0])}" cy="${f(pts[k][1])}" rx="${f(q * 1.3)}" ry="${f(q * .8)}"/>`; } }
  out += `<g fill="none" stroke-linecap="round" filter="url(#${sb})"><g stroke="#8c7456" opacity=".55">${rim}</g><g stroke="#050404" opacity=".95">${core}</g></g><g fill="#0a0807">${lumps}</g>`;
  for (let i = 0; i < 4; i++) { const x = cx + (R() - .5) * rx * 1.2, y = cy + (R() - .5) * ry, l = 1 + R() * 1.6;
    out += `<path d="M${f(x - l)} ${f(y)}q${f(l)} -.4 ${f(l * 2)} 0" stroke="#ffcf8a" stroke-width=".4" fill="none" opacity="${f(.45 + R() * .35)}"/>`; }
  return out;
}

module.exports = { name: 'Сырой порох', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VY, eye: 1.2 });
    const R = rng(9);
    let bg = `<rect x="0" y="0" width="200" height="280" fill="${WOOD.deep}"/>`;

    // ——— the far bulkhead: vertical planks, the light room's window with the lantern behind its glass
    const bTL = P(XL, YC, SB), bTR = P(XR, YC, SB), bBR = P(XR, YW, SB), bBL = P(XL, YW, SB);
    { const w = woodLit(u, 95); bg += `<defs>${w.defs}</defs><path d="${poly([bTL, bTR, bBR, bBL])}" fill="url(#${w.id})"/>`;
      for (let x = bTL[0] + 6; x < bTR[0]; x += 6.2 + R() * 1.6) bg += `<path d="M${f(x)} ${f(bTL[1])}V${f(bBL[1])}" stroke="#0e0906" stroke-width=".55" opacity=".7"/>`;
      // the window: a deep frame, four panes glowing, the lantern's shape and flame behind
      const wx = WIN.x, wy = WIN.y, ww = 22, wh = 17, gl = nid('wg', u);
      bg += `<rect x="${f(wx - ww / 2 - 2.4)}" y="${f(wy - wh / 2 - 2.4)}" width="${f(ww + 4.8)}" height="${f(wh + 4.8)}" fill="#24170e"/>`
        + `<defs>${rad(gl, wx, wy + 1, 16, [[0, '#fff2c8'], [.3, '#ffcf72'], [.7, '#e08a34'], [1, '#8a4a1c']])}</defs><rect x="${f(wx - ww / 2)}" y="${f(wy - wh / 2)}" width="${ww}" height="${wh}" fill="url(#${gl})"/>`
        // the lantern behind the glass: its dark cage and the flame
        + `<path d="M${f(wx - 3)} ${f(wy + 6)}V${f(wy - 3)}L${f(wx)} ${f(wy - 6)}L${f(wx + 3)} ${f(wy - 3)}V${f(wy + 6)}Z" fill="none" stroke="#6a3a18" stroke-width=".9" opacity=".7"/>`
        + `<ellipse cx="${f(wx)}" cy="${f(wy + 1)}" rx="1.4" ry="2.6" fill="#fffbe8"/>`
        + `<path d="M${f(wx - ww / 2)} ${f(wy)}H${f(wx + ww / 2)}M${f(wx)} ${f(wy - wh / 2)}V${f(wy + wh / 2)}" stroke="#2a1a0e" stroke-width="1.4"/>`
        + `<rect x="${f(wx - ww / 2)}" y="${f(wy - wh / 2)}" width="${ww}" height="${wh}" fill="none" stroke="#3b2414" stroke-width="1"/>`
        // the sill catching the light
        + `<rect x="${f(wx - ww / 2 - 3)}" y="${f(wy + wh / 2 + 2)}" width="${f(ww + 6)}" height="1.6" fill="#c08048"/>`; }

    // ——— the deckhead: planks running to the VP, the burst scuttle, the beams across
    const cB = [P(XL, YC, SB), P(XR, YC, SB)], cF = [P(XL, YC, .9), P(XR, YC, .9)];
    { const w = woodLit(u, 130, WIN.y + 20); bg += `<defs>${w.defs}</defs><path d="${poly([cB[0], cB[1], cF[1], cF[0]])}" fill="url(#${w.id})"/>`;
      for (let X = XL + 16; X < XR; X += 17) { const a = P(X, YC, SB), b = P(X, YC, .9); bg += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#0b0705" stroke-width=".6" opacity=".75"/>`; } }
    // the scuttle: its coaming broken open, the grey storm light and the sea coming through
    const hs0 = .44, hs1 = .55, hX0 = -112, hX1 = -30;
    const h00 = P(hX0, YC, hs0), h10 = P(hX1, YC, hs0), h11 = P(hX1, YC, hs1), h01 = P(hX0, YC, hs1);
    { const g = nid('hg', u), Rh = rng(57), jag = [];
      // the hole torn through the deckhead: broken plank ends along the near and far edges (the planks run to the VP)
      for (let i = 0; i <= 9; i++) { const t = i / 9; jag.push([lerp(h01[0], h11[0], t) + (Rh() - .5) * 1.2, h01[1] + (i % 2 ? 2.4 : -.3) + Rh() * 1.2]); }
      jag.push([lerp(h11[0], h10[0], .5) - .8, lerp(h11[1], h10[1], .5)]);
      for (let i = 0; i <= 9; i++) { const t = i / 9; jag.push([lerp(h10[0], h00[0], t) + (Rh() - .5) * 1.2, h10[1] - (i % 2 ? 2.6 : 0) - Rh() * 1]); }
      jag.push([lerp(h00[0], h01[0], .5) + 1, lerp(h00[1], h01[1], .5)]);
      // the inner faces of the broken deck (its thickness), dark, a little below the hole's edge
      bg += `<path d="${poly(jag.map(([x, y]) => [x, y + 1.6]))}" fill="#1c130c"/>`
      // the storm through it: grey sky, rain slanting, a green sea cresting over the far edge
        + `<defs>${linGrad(g, 0, h01[1], 0, h00[1], [[0, '#b6c6c8'], [1, '#6c858b']])}</defs><path d="${poly(jag)}" fill="url(#${g})"/>`
        + `<path d="M${f(h00[0] - 2)} ${f(h00[1] - 1)}Q${f(h00[0] + 10)} ${f(h00[1] - 9)} ${f(h00[0] + 24)} ${f(h00[1] - 3)}L${f(h00[0] + 22)} ${f(h00[1] + .5)}L${f(h00[0] - 2)} ${f(h00[1] + .5)}Z" fill="#3e6a62" opacity=".9"/>`
        + `<path d="M${f(h00[0])} ${f(h00[1] - 3)}Q${f(h00[0] + 10)} ${f(h00[1] - 9.5)} ${f(h00[0] + 22)} ${f(h00[1] - 3.6)}" stroke="#e8f2ec" stroke-width="1" fill="none" opacity=".8"/>`
        + `<g stroke="#dfe9ea" stroke-width=".3" opacity=".45">` + Array.from({ length: 9 }, (_, i) => { const x = 58 + i * 3 + Rh() * 2, y = 10.5 + Rh() * 6; return `<path d="M${f(x)} ${f(y)}l-1.2 4"/>`; }).join('') + '</g>'
        // the lit splintered ends of the planks round the hole
        + `<path d="M${jag.map(p => p.map(f).join(' ')).join('L')}Z" stroke="#a8784c" stroke-width=".5" fill="none" opacity=".75"/>`; }
    // the beams: a near face and the underside, lit from the window below and behind
    for (const s of [.41, .6, .8]) {
      const t = .028, d = 9;
      const f0 = P(XL, YC, s), f1 = P(XR, YC, s), b0 = P(XL, YC + d, s), b1 = P(XR, YC + d, s), u0 = P(XL, YC + d, s - t), u1 = P(XR, YC + d, s - t);
      const g = nid('bm', u);
      bg += `<defs>${linGrad(g, f0[0], 0, f1[0], 0, [[0, WOOD.deep], [.45, '#3a2416'], [.55, '#3a2416'], [1, WOOD.deep]])}</defs>`
        + `<path d="${poly([f0, f1, b1, b0])}" fill="url(#${g})"/><path d="${poly([b0, b1, u1, u0])}" fill="${mix(WOOD.mid, '#b07040', .35)}" opacity=".85"/>`
        + `<path d="M${f(u0[0])} ${f(u0[1])}L${f(u1[0])} ${f(u1[1])}" stroke="#d08a4c" stroke-width=".5" opacity=".5"/>`;
    }

    // ——— the ship's sides: planks running to the VP, the frames standing out, wet and dark low down
    const side = (X, sgn) => {
      const w = woodLit(u, 140); let o = `<defs>${w.defs}</defs><path d="${poly([P(X, YC, SB), P(X, YC, 3.4), P(X, YW, 3.4), P(X, YW, SB)])}" fill="url(#${w.id})"/>`;
      for (let Y = YC + 14; Y < YW; Y += 13) { const a = P(X, Y, SB), b = P(X, Y, 3.4); o += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#0b0705" stroke-width=".6" opacity=".7"/>`; }
      // the wet band above the water, splashed dark
      { const g = nid('wb', u), a = P(X, YW - 22, SB), b = P(X, YW, SB), c = P(X, YW, 3.4), d = P(X, YW - 22, 3.4);
        o += `<defs>${linGrad(g, 0, a[1], 0, b[1], [[0, '#000', 0], [1, '#000', .55]])}</defs><path d="${poly([a, b, c, d])}" fill="#050403" opacity=".5"/>`; }
      // the frames: each a timber standing out of the side by 7, its near face towards us
      for (const s of [.44, .55, .7, .9, 1.16]) {
        const t = .03, X2 = X - sgn * 7, n0 = P(X, YC, s + t), n1 = P(X2, YC, s + t), n2 = P(X2, YW, s + t), n3 = P(X, YW, s + t), i0 = P(X2, YC, s), i3 = P(X2, YW, s);
        o += `<path d="${poly([n0, n1, n2, n3])}" fill="${mix(WOOD.dark, '#3c2616', .35)}"/><path d="${poly([n1, i0, i3, n2])}" fill="${mix(WOOD.mid, '#a86a38', clamp(.5 - (s - .44), 0, .5))}"/>`
          + `<path d="M${f(n1[0])} ${f(n1[1])}L${f(n2[0])} ${f(n2[1])}" stroke="#d08a4c" stroke-width=".4" opacity="${f(clamp(.6 - (s - .44) * .7, .1, .6))}"/>`;
      }
      return o;
    };
    bg += side(XL, -1) + side(XR, 1);

    // ——— the shelf high on the right side, on two knees, with the dry kegs standing on it
    { const Xs = 74, Ys = -36, s0 = .42, s1 = 1.1, th = 4;
      const t0 = P(Xs, Ys, s0), t1 = P(Xs, Ys, s1), w0 = P(XR, Ys, s0), w1 = P(XR, Ys, s1), e0 = P(Xs, Ys + th, s0), e1 = P(Xs, Ys + th, s1);
      bg += `<path d="${poly([t0, w0, w1, t1])}" fill="#7a4c28"/><path d="${poly([t0, t1, e1, e0])}" fill="#3a2414"/><path d="M${f(t0[0])} ${f(t0[1])}L${f(t1[0])} ${f(t1[1])}" stroke="#e0a060" stroke-width=".55" opacity=".8"/>`;
      // the knees under it
      for (const s of [.5, .78]) { const a = P(Xs + 4, Ys + th, s), b = P(XR, Ys + th, s), c = P(XR, Ys + 34, s); bg += `<path d="${poly([a, b, c])}" fill="#2c1b10"/><path d="M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}" stroke="#a86a38" stroke-width=".5" opacity=".6"/>`; }
      // the fiddle rail along its edge keeps them from going over
      const r0 = P(Xs + 2, Ys - 10, s0), r1 = P(Xs + 2, Ys - 10, s1);
      // the dry kegs: tarred, warm-lit on the side towards the window, standing, far ones first
      for (const [s, seed] of [[.46, 3], [.56, 5], [.68, 7], [.83, 9]]) {
        const [x, y] = P(Xs + 18, Ys, s + .015);
        bg += K.contactShadow(u, x, y, 26 * s, L) + K.barrel(u, L, { x, y, s: s * 1.42, kind: 'powder', seed });
      }
      bg += `<path d="M${f(r0[0])} ${f(r0[1])}L${f(r1[0])} ${f(r1[1])}" stroke="#5a3820" stroke-width="1.3"/>`;
      for (const s of [.5, .64, .8, .98]) { const a = P(Xs + 2, Ys - 10, s), b = P(Xs + 2, Ys, s); bg += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#4a2e1a" stroke-width="${f(1.2 * s)}"/>`; }
      // the lantern's warmth on the shelf and its kegs
      bg += K.localGlow(u, { x: 150, y: 44, color: '#ffb24a', power: .35, radius: 40 }, { core: false }); }

    // ——— the water: black-green, lit along a shimmering road from the window
    const wFill = nid('wf', u);
    { const a = P(XL, YW, SB), b = P(XR, YW, SB), c = P(XR, YW, 3.4), d = P(XL, YW, 3.4);
      bg += `<defs>${rad(wFill, WIN.x, yW(SB), 170, [[0, '#4a3e26'], [.16, '#1d2622'], [.5, '#0e1615'], [1, '#060908']], ` gradientTransform="translate(${WIN.x} ${f(yW(SB))}) scale(1 .7) translate(${-WIN.x} ${f(-yW(SB))})"`)}</defs>`
        + `<path d="${poly([a, b, c, d])}" fill="url(#${wFill})"/>`;
      // the window's road on the water, broken by ripple
      let road = '';
      for (let i = 0; i < 70; i++) { const t = Math.pow(R(), 1.5), y = yW(SB) + 1 + t * 160, w = (1.6 + t * 12) * (.5 + R()), x = WIN.x + (R() - .5) * (5 + t * 34);
        road += `<path d="M${f(x - w)} ${f(y)}q${f(w)} ${f(-.8 - t * 2)} ${f(w * 2)} 0" stroke="${R() < .3 ? '#fff0c0' : '#ffb85a'}" stroke-width="${f(.7 + t * 1.8)}" fill="none" opacity="${f(.9 - t * .45)}"/>`; }
      bg += K.localGlow(u, { x: WIN.x, y: yW(SB) + 14, color: '#ffb24a', power: .45, radius: 34 }, { squash: .35, core: false }) + road;
      let chop = '';
      for (let i = 0; i < 90; i++) { const t = Math.pow(R(), 1.2), y = yW(SB) + 2 + t * 170, w = (1.4 + t * 10) * (.6 + R()), x = R() * 210 - 5;
        chop += `<path d="M${f(x - w)} ${f(y)}q${f(w)} ${f(-.6 - t * 1.8)} ${f(w * 2)} 0" stroke="${R() < .5 ? '#5d6a5c' : '#020303'}" stroke-width="${f(.4 + t * 1.2)}" fill="none" opacity="${f(.35 + R() * .3)}"/>`; }
      bg += chop;
      // the waterline along the sides and the bulkhead: a thin lit wet edge
      bg += `<path d="M${f(P(XL, YW, 3.4)[0])} ${f(P(XL, YW, 3.4)[1])}L${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(P(XR, YW, 3.4)[0])} ${f(P(XR, YW, 3.4)[1])}" stroke="#c99a5c" stroke-width=".6" fill="none" opacity=".5"/>`; }

    // ——— kegs behind the torrent
    bg += floating(u, L, { x: 112, wy: yW(.47), s: .62, seed: 11, rot: -8 }, `url(#${wFill})`);
    bg += mush(u, 123, yW(.48) + 1.5, 9, 2.2, 4);

    // ——— the torrent through the scuttle: the sea comes in over the broken coaming with its own way on — a heavy green
    // tongue bowing to the right as it falls, white where it is torn, dark green where it is thick, lit warm on its
    // right edge by the window; it bursts on the water in foam and throws spray up the side
    { const foot = yW(.5), Rt = rng(31);
      const edge = (t, side) => { // t 0..1 down the fall; side -1 left edge, 1 right edge
        const y = lerp(14, foot - 1, t), cx = lerp(53, 74, Math.pow(t, 1.6)), hw = lerp(8, 22, Math.pow(t, 1.1));
        return [cx + side * hw + Math.sin(t * 13 + side * 2) * 1.6 * t + Math.sin(t * 31 + side * 5) * (.5 + 1.1 * t), y]; };
      const lft = [], rgt = []; for (let i = 0; i <= 20; i++) { const j = (Rt() - .5) * 2.4 * (i / 20); lft.push(edge(i / 20, -1).map((v, k) => k ? v : v - Math.abs(j))); rgt.unshift(edge(i / 20, 1).map((v, k) => k ? v : v + Math.abs(j))); }
      const body = lft.concat(rgt);
      const g = nid('tg', u), gx = nid('tx', u), b = nid('tb', u), b2 = nid('tb', u);
      bg += `<defs>${linGrad(g, 0, 10, 0, foot, [[0, '#7d9c96'], [.3, '#3f6560'], [.75, '#2c4f4b'], [1, '#9db8b0']])}${linGrad(gx, 40, 0, 98, 0, [[0, '#071010', .5], [.4, '#071010', 0], [.78, '#ffb24a', .1], [1, '#ffcf8a', .6]])}${blur(b, .45)}${blur(b2, 1.6)}</defs>`
        + `<path d="${smooth(body)}" fill="url(#${g})" opacity=".96"/><path d="${smooth(body)}" fill="url(#${gx})"/>`;
      // torn white sheets and green streaks down the fall, following its bow
      let st = '';
      for (let i = 0; i < 34; i++) { const q = .06 + Rt() * .88, t0 = Rt() * .5, t1 = Math.min(1, t0 + .25 + Rt() * .5), pt = t => { const a = edge(t, -1), c = edge(t, 1); return [lerp(a[0], c[0], q), a[1]]; };
        const a = pt(t0), m = pt((t0 + t1) / 2), c = pt(t1), white = Rt() < .55;
        st += `<path d="M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(c[0])} ${f(c[1])}" stroke="${white ? '#eef6f0' : '#183532'}" stroke-width="${f(white ? .5 + Rt() * 1.6 : .6 + Rt() * 1.2)}" fill="none" stroke-linecap="round" opacity="${f(white ? .45 + Rt() * .45 : .5)}"/>`; }
      bg += `<g filter="url(#${b})">${st}</g>`;
      // the torn white fringe of both edges: tatters flung off sideways, finer drops beyond them
      { let fr = ''; for (let i = 0; i < 46; i++) { const t = .04 + Rt() * .92, sd = Rt() < .5 ? -1 : 1, p = edge(t, sd), o = sd * (.4 + Rt() * 2.6 * (.4 + t)), q = .5 + Rt() * 1.3 * (.5 + t);
          fr += `<ellipse cx="${f(p[0] + o)}" cy="${f(p[1])}" rx="${f(q * .7)}" ry="${f(q * 1.6)}" transform="rotate(${f(sd * (20 + Rt() * 30))} ${f(p[0] + o)} ${f(p[1])})" opacity="${f(.45 + Rt() * .45)}"/>`;
          if (Rt() < .6) fr += `<circle cx="${f(p[0] + o * 2.4 + sd * 2)}" cy="${f(p[1] + Rt() * 3)}" r="${f(.25 + Rt() * .4)}" opacity="${f(.5 + Rt() * .4)}"/>`; }
        bg += `<g fill="#eef6f0" filter="url(#${b})">${fr}</g>`; }
      // where it pours in at the hole: a curl of foam rolling over itself
      bg += `<g fill="none" stroke-linecap="round" filter="url(#${b})"><path d="M43 21C41 12 53 8.6 58.6 12.6C62.4 15.4 59.4 20.4 55.6 19C53 18 53.8 15.2 56 15.6" stroke="#1e3a36" stroke-width="3.6" opacity=".5" transform="translate(.8 1)"/>`
        + `<path d="M43 21C41 12 53 8.6 58.6 12.6C62.4 15.4 59.4 20.4 55.6 19C53 18 53.8 15.2 56 15.6" stroke="#f4faf4" stroke-width="2.6" opacity=".95"/>`
        + `<path d="M46 23.6C45 16 52 12.6 56.4 14.4" stroke="#cfe2da" stroke-width="1.2" opacity=".8"/><path d="M60.6 14.8C63.4 18.4 62 22 59 23.4" stroke="#eef6f0" stroke-width="1.4" opacity=".75"/></g>`;
      // spray flung off the left edge and up the side, drops in flight
      bg += `<g filter="url(#${b2})" fill="#dfeee8"><ellipse cx="40" cy="${f(foot - 12)}" rx="12" ry="9" opacity=".5"/><ellipse cx="92" cy="${f(foot - 8)}" rx="10" ry="6" opacity=".45"/><ellipse cx="66" cy="${f(foot - 4)}" rx="28" ry="7" opacity=".55"/></g>`;
      for (let i = 0; i < 40; i++) { const a = Math.PI * (1.05 + Rt() * .9), r = 8 + Rt() * 30, x = 70 + Math.cos(a) * r * 1.3, y = foot - 4 + Math.sin(a) * r * .8, q = .3 + Rt() * .8;
        bg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(q)}" ry="${f(q * 1.5)}" fill="#eef6f2" opacity="${f(.5 + Rt() * .5)}"/>`; }
      bg += K.splash(u, { x: 70, y: foot, w: 56, h: 24, seed: 3, L, wind: 1 }) + K.foam(u, { x: 72, y: foot + 1, w: 66, h: 3.4, seed: 7, L });
      // rings of churned water spreading over the room from the foot
      for (const [rx, o] of [[44, .4], [62, .26], [84, .16]]) bg += `<ellipse cx="72" cy="${f(foot + 3)}" rx="${rx}" ry="${f(rx * .13)}" fill="none" stroke="#d6e6dc" stroke-width=".8" opacity="${o}"/>`;
      // broken planks hanging from the hole's edge, and the hatch lid torn open, hanging from its hinge on the right
      { const lid = [h11, h10, [h10[0] + .6, h10[1] + 24 * hs0], [h11[0] + .8, h11[1] + 24 * hs1]], lg = nid('lg', u);
        bg += `<defs>${linGrad(lg, h11[0], 0, h11[0] + 4, 0, [[0, '#7d8e90'], [.35, '#4a3422'], [1, '#2a1a10']])}</defs><path d="${poly(lid)}" fill="url(#${lg})"/>`
          + `<path d="M${f(lid[0][0])} ${f(lid[0][1])}L${f(lid[3][0])} ${f(lid[3][1])}" stroke="#b9c8c8" stroke-width=".5" opacity=".7"/>`
          + [.3, .7].map(t => `<path d="M${f(lerp(lid[0][0], lid[1][0], t))} ${f(lerp(lid[0][1], lid[1][1], t))}L${f(lerp(lid[3][0], lid[2][0], t))} ${f(lerp(lid[3][1], lid[2][1], t))}" stroke="#141010" stroke-width=".7" opacity=".8"/>`).join('')
          + `<path d="${poly([lid[3], lid[2], [lid[2][0] - .4, lid[2][1] + 1.2], [lid[3][0] - .5, lid[3][1] + 1.4]])}" fill="#120c08"/>`;
        for (const [x, y, dx, dy, w] of [[39, 10, -3.4, 15, 2.6], [73.6, 11, 3, 13, 2.2], [66.6, 11.6, 1.4, 7, 1.8]]) {
          const n = [-dy, dx], l = Math.hypot(...n), o = [n[0] / l * w / 2, n[1] / l * w / 2], tip = [x + dx, y + dy];
          bg += `<path d="${poly([[x - o[0], y - o[1]], [x + o[0], y + o[1]], [tip[0] + o[0] * .6, tip[1] + o[1] * .6 + .8], [tip[0], tip[1] - .6], [tip[0] - o[0], tip[1] - o[1] + 1.2]])}" fill="#4a3020"/>`
            + `<path d="M${f(x - o[0])} ${f(y - o[1])}L${f(tip[0] - o[0])} ${f(tip[1] - o[1] + 1.2)}" stroke="#a9bcbd" stroke-width=".4" opacity=".7"/>`; } }
      // the grey of the storm through the scuttle: a cold veil, not a second light
      const cv = nid('cv', u);
      bg += `<defs>${linGrad(cv, 0, h01[1], 0, foot, [[0, '#b8cfd2', .16], [1, '#b8cfd2', 0]])}</defs><path d="${poly([h01, h11, [h11[0] + 26, foot], [h01[0] - 14, foot]])}" fill="url(#${cv})"/>`; }

    // ——— the powder leaving the kegs: black swirls and runs in the water round them (above the glass)
    bg += stain(u, 104, 122, 30, 5.6, 41) + stain(u, 130, 108.5, 14, 3, 43) + stain(u, 150, 125, 15, 3.4, 45) + stain(u, 62, 126, 17, 3.6, 47);
    // ——— the kegs in front of the torrent: one wallowing, one burst with its powder pouring out as black mush
    bg += floating(u, L, { x: 160, wy: yW(.66), s: .8, seed: 13, rot: 10 }, `url(#${wFill})`);
    bg += mush(u, 84, yW(.72) + 3, 26, 5.5, 8, { lean: .3 }) + mush(u, 60, yW(.66) + 2, 9, 2.4, 12);
    bg += floating(u, L, { x: 92, wy: yW(.7), s: .9, seed: 17, rot: -14, open: true }, `url(#${wFill})`);
    // the burst head floating apart, staves loose
    { const tone = L.ramp('tar', 120, 120);
      for (const [x, y, a, l] of [[118, yW(.74), -12, 12], [124, yW(.8) + 1, 18, 10], [46, yW(.78), 6, 11]]) bg += `<rect x="${f(x)}" y="${f(y)}" width="${l}" height="1.8" rx=".8" fill="${tone.half}" transform="rotate(${a} ${f(x)} ${f(y)})"/><rect x="${f(x)}" y="${f(y)}" width="${l}" height=".5" fill="${tone.lit}" opacity=".8" transform="rotate(${a} ${f(x)} ${f(y)})"/>`; }

    // ——— under the glass: the mush spreading towards us, a near keg rolling half-sunk at the left
    let fg = mush(u, 110, 160, 46, 9, 21, { lean: .2 }) + mush(u, 168, 196, 30, 7, 23) + mush(u, 70, 214, 36, 8, 25);
    fg += floating(u, L, { x: 26, wy: 178, s: 1.7, seed: 19, rot: 12 }, `url(#${wFill})`);
    // the room closes in at the edges
    { const v = nid('vg', u); fg += `<defs>${rad(v, 98, 90, 170, [[.5, '#000', 0], [1, '#000', .55]])}</defs><rect x="0" y="0" width="200" height="280" fill="url(#${v})"/>`; }
    return [bg, fg];
  } };
