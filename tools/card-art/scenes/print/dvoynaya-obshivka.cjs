// «Двойная обшивка» (Индевор, РЕАКЦИЯ: Залп по «Индевору» наносит на 2 урона меньше), refined from the first-round
// scene (portrait-endeavour.cjs SCENES['Двойная обшивка']): the flagship's side close up, a round shot has smashed
// the outer planking and stuck in the second layer behind it. The brief's find — the two layers in section: the
// broken edge of the outer skin shows its thickness (the end grain of the strakes, a black line of tarred felt
// between the layers), and behind it the inner layer runs the other way, diagonally — whole, only dented and
// cracked round the ball. Splinters of the outer skin still fly.
// Fixed against the first round: the hole was a flat patch with the ball pasted on it and no depth — now the hole has
// walls (the left and bottom ones seen, lit from above), the inner layer lies deeper and is shaded by the rim, the
// ball sits sunk in a crater with its own shadow; the planking is the Endeavour's own: matt ochre strakes with
// butts and treenails between black wales, a gun port with its lid; the two iron straps that stood like posts are
// now the chain plates of her channel, slanting up to it; the plank on a tackle (it hung from nowhere) is gone.
// Light: the sun high on the left behind us (key), the blue sky (fill); the sea far below under the glass.
'use strict';
const K = require('../kit/index.cjs');
const { f, nid, linGrad, radGrad, rng, mix } = K;

const HZ = 210;                                                // (no horizon in the frame; for the shadows)
const C = { x: 98, y: 72 }, D = [7.4, -6.2];                    // the hole's centre; the depth of the outer skin in view
const BALL = { x: 94, y: 77, r: 13.5 };
const light = { time: 'day', haze: .1, key: { type: 'sun', az: 240, el: 40, color: '#fff2d6', power: 1 }, fill: { color: '#8db8e0', power: .5 } };
const skel = { horizon: HZ, eye: 3, light: 'the sun high on the left behind us', items: [
  ['side', 0, 280, 200, 280, 'the hull: ochre strakes between black wales, facing us'],
  ['hole', 62, 102, 72, 58, 'in the outer skin, between the wales'], ['inner layer', 66, 98, 66, 52, 'behind the hole, deeper by the skin'],
  ['ball', BALL.x - BALL.r, BALL.y + BALL.r, BALL.r * 2, BALL.r * 2, 'sunk in the inner layer'],
  ['gun port', 156, 58, 28, 28, 'in the side'], ['chain plates', 14, 120, 20, 120, 'bolted to the side up to the channel']] };

// the hole's outline, strake by strake: each plank of the outer skin broke off at its own length, its end a ragged
// tongue of fibres (planks split along the grain); returns the polygon and the ends [{ y0, y1, xl, xr }]
const HY = [44, 100], STK = 8;
function holePts(R) {
  const ends = [];
  for (let y0 = HY[0]; y0 < HY[1]; y0 += STK) { const m = (y0 + STK / 2 - C.y) / ((HY[1] - HY[0]) / 2), w = 36 * Math.sqrt(Math.max(.08, 1 - m * m));
    ends.push({ y0, y1: y0 + STK, xl: C.x - w * (.78 + R() * .4), xr: C.x + w * (.75 + R() * .4) }); }
  const right = [], left = [];
  for (const e of ends) { const j = () => (R() - .5) * 2.4;
    right.push([e.xr + j(), e.y0 + .3], [e.xr + 3 + R() * 4, e.y0 + 2 + R() * 1.5], [e.xr - 1 + j(), e.y0 + 4.2], [e.xr + 1.5 + R() * 3, e.y0 + 6], [e.xr + j(), e.y1 - .3]);
    left.push([e.xl + j(), e.y0 + .3], [e.xl - 3 - R() * 4, e.y0 + 2 + R() * 1.5], [e.xl + 1 + j(), e.y0 + 4.2], [e.xl - 1.5 - R() * 3, e.y0 + 6], [e.xl + j(), e.y1 - .3]); }
  const P = right.concat(left.reverse());
  P.ends = ends; return P;
}
const poly = (P, dx = 0, dy = 0) => 'M' + P.map(p => `${f(p[0] + dx)} ${f(p[1] + dy)}`).join('L') + 'Z';

module.exports = { name: 'Двойная обшивка', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    // the Endeavour's matt ochre, warmer and darker than the ramp's lit lemon at this size
    const R = rng(41), rO = Object.assign({}, L.ramp('ship-ochre', 100, 60), { lit: '#ecc872', half: '#bc8f38' }), rT = L.ramp('tar', 100, 60), rK = L.ramp('oak', 100, 80), rI = L.ramp('iron', 100, 60);
    // ——— the side: the black wales and the ochre strakes (8 units each), each strake of planks with staggered butts,
    // treenails in pairs at the frames, weather streaks running down from the wale
    const W1 = [0, 12], W2 = [122, 136], ST = 8;
    let bg = '';
    { const g = nid('so', u); bg += `<defs>${linGrad(g, 0, 0, 200, 280, [[0, '#d6aa4c'], [.4, '#bc8f38'], [1, '#7e5c22']])}</defs><rect width="200" height="280" fill="url(#${g})"/>`; }
    for (let y = W1[1]; y < 280; y += ST) {
      if (y >= W2[0] && y < W2[1]) continue;
      bg += `<path d="M0 ${f(y)}H200" stroke="${rO.outline}" stroke-width=".7" opacity=".75"/><path d="M0 ${f(y + .7)}H200" stroke="${rO.lit}" stroke-width=".35" opacity=".55"/>`;
      const off = (y / ST % 3) * 23;
      for (let x = -off; x < 200; x += 68) bg += `<path d="M${f(x)} ${f(y)}v${ST}" stroke="${rO.outline}" stroke-width=".5" opacity=".6"/><path d="M${f(x + .6)} ${f(y)}v${ST}" stroke="${rO.lit}" stroke-width=".3" opacity=".4"/>`;
      for (let x = 9 - off % 17; x < 200; x += 17) bg += `<circle cx="${f(x)}" cy="${f(y + 2.4)}" r=".55" fill="${rO.shadow}"/><circle cx="${f(x)}" cy="${f(y + 5.6)}" r=".55" fill="${rO.shadow}"/>`;
      // the grain: long faint strokes along each strake
      for (let k = 0; k < 7; k++) { const x = R() * 200, w = 14 + R() * 40, yy = y + 1.2 + R() * (ST - 2.4); bg += `<path d="M${f(x)} ${f(yy)}q${f(w / 2)} ${f((R() - .5) * .8)} ${f(w)} 0" stroke="${R() > .5 ? rO.lit : rO.shadow}" stroke-width=".3" fill="none" opacity=".45"/>`; }
    }
    // weathering: thin dark streaks down from the upper wale and from the port sill
    for (let k = 0; k < 16; k++) { const x = R() * 200, h = 6 + R() * 22; bg += `<path d="M${f(x)} ${W1[1]}q${f((R() - .5) * 2)} ${f(h / 2)} 0 ${f(h)}" stroke="${rT.half}" stroke-width="${f(.4 + R() * .8)}" opacity="${f(.08 + R() * .1)}" fill="none"/>`; }
    // the wales: thick black timbers standing proud, the upper edge catching the sun, a shadow under them
    for (const [a, b] of [W1, W2]) {
      const g = nid('sw', u);
      bg += `<defs>${linGrad(g, 0, a, 0, b, [[0, rT.lit], [.25, rT.half], [1, rT.core]])}</defs><rect x="0" y="${a}" width="200" height="${b - a}" fill="url(#${g})"/>`
        + `<path d="M0 ${a + .6}H200" stroke="${mix(rT.lit, '#ffffff', .3)}" stroke-width=".6" opacity=".7"/><path d="M0 ${b + 1.4}H200" stroke="#000" stroke-width="2.8" opacity=".22"/>`
        + `<path d="M0 ${(a + b) / 2}H200" stroke="#000" stroke-width=".4" opacity=".4"/>`;
      for (let x = 12; x < 200; x += 34) bg += `<circle cx="${x}" cy="${f(a + (b - a) * .3)}" r=".8" fill="${rI.half}"/>`;
    }
    // the gun port on the right: a black frame standing out, the lid shut, two hinges, the sill casting its shadow
    { const x = 157, y = 30, w = 27, h = 27;
      bg += `<path d="M${x - 2} ${y + h + 2.6}h${w + 4}" stroke="#000" stroke-width="2.4" opacity=".25"/>`
        + `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="${rT.half}"/><path d="M${x - 2} ${y - 1.6}h${w + 4}M${x - 1.6} ${y - 2}v${h + 4}" stroke="${rT.lit}" stroke-width=".7"/>`
        + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mix(rT.half, rT.lit, .25)}"/>`
        + [y + 7, y + 14, y + 21].map(yy => `<path d="M${x} ${yy}h${w}" stroke="${rT.core}" stroke-width=".5"/>`).join('')
        + [y + 5, y + h - 6].map(yy => `<path d="M${x - 3} ${yy}h${w * .8}" stroke="${rI.half}" stroke-width="2"/><path d="M${x - 3} ${yy - .6}h${w * .8}" stroke="${rI.lit}" stroke-width=".5"/><circle cx="${f(x + w * .8 - 3)}" cy="${yy}" r="1.2" fill="${rI.half}"/>`).join('')
        + `<path d="M${x + w / 2 - 3} ${y + h - 2}h6" stroke="${rI.half}" stroke-width="1.6"/>`; }
    // the chain plates: slanting iron straps from the channel (above the frame) down the side, bolted at each strake
    for (const [x0, x1] of [[18, 26], [36, 42]]) {
      const ya = 0, yb = 150;
      bg += `<path d="M${x0 + 1.6} ${ya}L${x1 + 1.6} ${yb}" stroke="#000" stroke-width="3.6" opacity=".2"/><path d="M${x0} ${ya}L${x1} ${yb}" stroke="${rI.half}" stroke-width="3.4"/><path d="M${x0 - 1.1} ${ya}L${x1 - 1.1} ${yb}" stroke="${rI.lit}" stroke-width=".7"/>`;
      for (let y = 18; y < yb; y += 16) { const x = x0 + (x1 - x0) * (y / yb); bg += `<circle cx="${f(x)}" cy="${y}" r="1.15" fill="${rI.shadow}"/><circle cx="${f(x - .35)}" cy="${y - .35}" r=".5" fill="${rI.lit}"/>`; }
    }

    // ——— the hole
    const P = holePts(R), hid = nid('ho', u), iid = nid('hi', u);
    let fg = `<defs><clipPath id="${hid}"><path d="${poly(P)}"/></clipPath><clipPath id="${iid}"><path d="${poly(P, D[0], D[1])}"/></clipPath></defs>`;
    // the walls: the cut end of the outer skin — the left wall in its own shade, the bottom one lit from above
    { const g = nid('hw', u);
      fg += `<defs>${linGrad(g, C.x - 30, C.y - 20, C.x - 10, C.y + 28, [[0, rK.shadow], [.6, rK.half], [1, rK.lit]])}</defs><g clip-path="url(#${hid})"><rect x="0" y="0" width="200" height="160" fill="url(#${g})"/>`;
      // the end grain of the strakes on the wall: the seams continue into the cut, slanting into the depth
      for (let y = W1[1]; y < 120; y += ST) { const xs = [];
        for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; if ((p[1] - y) * (q[1] - y) < 0) xs.push(p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1])); }
        if (!xs.length) continue; const xl = Math.min(...xs);
        fg += `<path d="M${f(xl - .5)} ${y}l${f(D[0] + 1)} ${f(D[1])}" stroke="${rK.core}" stroke-width=".7"/><path d="M${f(xl - .5)} ${y + .7}l${f(D[0] + 1)} ${f(D[1])}" stroke="${rK.lit}" stroke-width=".3" opacity=".6"/>`; }
      // the grain of the cut wood: short strokes along the depth
      for (let k = 0; k < 50; k++) { const x = C.x - 44 + R() * 70, y = C.y - 30 + R() * 64; fg += `<path d="M${f(x)} ${f(y)}l${f(D[0] * .5)} ${f(D[1] * .5)}" stroke="${rK.core}" stroke-width=".3" opacity=".45"/>`; }
      for (let k = 0; k < 40; k++) { const x = C.x - 40 + R() * 80, y = C.y - 30 + R() * 60; fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.25 + R() * .3)}" fill="${rK.core}" opacity=".35"/>`; }
      // the paint on the outer face and the black felt at the back of the wall
      fg += `<path d="${poly(P, D[0], D[1])}" fill="none" stroke="#120c08" stroke-width="2.4"/><path d="${poly(P, D[0] * .55, D[1] * .55)}" fill="none" stroke="${rK.core}" stroke-width=".35" opacity=".6"/>`;
      fg += `</g>`; }
    // the inner layer, deeper: diagonal planks of bare oak, a shadow of the rim along the upper-left of it
    { let s = `<g clip-path="url(#${hid})"><g clip-path="url(#${iid})">`;
      const g = nid('il', u);
      s += `<defs>${radGrad(g, BALL.x + 6, BALL.y - 6, 50, [[0, rK.lit], [.6, rK.half], [1, mix(rK.half, rK.shadow, .5)]])}</defs><rect x="40" y="20" width="120" height="110" fill="url(#${g})"/>`;
      for (let k = -12; k < 16; k++) { const x = C.x + k * 6.6; s += `<path d="M${f(x - 60)} ${f(C.y + 60)}L${f(x + 60)} ${f(C.y - 60)}" stroke="${rK.core}" stroke-width=".8"/><path d="M${f(x - 59)} ${f(C.y + 60.6)}L${f(x + 61)} ${f(C.y - 59.4)}" stroke="${rK.lit}" stroke-width=".35" opacity=".6"/>`;
        for (let j = 0; j < 3; j++) { const t = R(), px = x - 60 + 120 * t + 3.3, py = C.y + 60 - 120 * t + 1.2; s += `<path d="M${f(px)} ${f(py)}l${f(4 + R() * 6)} ${f(-(4 + R() * 6))}" stroke="${rK.shadow}" stroke-width=".25" opacity=".6"/>`; } }
      // the crater: the planks crushed into a dish round the ball, cracks running along their grain (diagonal) and a
      // few across, none of them through
      s += `<ellipse cx="${BALL.x + 1}" cy="${BALL.y + 1}" rx="${BALL.r + 5}" ry="${BALL.r + 4.4}" fill="${rK.shadow}" opacity=".75"/>`;
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + R() * .3, d1 = BALL.r + 3, d2 = d1 + 5 + R() * 14, along = k % 3 === 0;
        const ex = along ? Math.cos(-Math.PI / 4) * Math.sign(Math.cos(a) || 1) : Math.cos(a), ey = along ? Math.sin(-Math.PI / 4) * Math.sign(Math.cos(a) || 1) : Math.sin(a);
        const ax = BALL.x + Math.cos(a) * d1, ay = BALL.y + Math.sin(a) * d1;
        s += `<path d="M${f(ax)} ${f(ay)}l${f(ex * (d2 - d1) * .5 + (R() - .5) * 2)} ${f(ey * (d2 - d1) * .5 + (R() - .5) * 2)}l${f(ex * (d2 - d1) * .5)} ${f(ey * (d2 - d1) * .5)}" stroke="${rK.core}" stroke-width="${f(.4 + R() * .5)}" fill="none" stroke-linecap="round"/>`
          + `<path d="M${f(ax + .6)} ${f(ay + .6)}l${f(ex * (d2 - d1) * .45)} ${f(ey * (d2 - d1) * .45)}" stroke="${rK.lit}" stroke-width=".3" fill="none" opacity=".7"/>`; }
      // the crushed fibres standing up round the rim of the crater, lit on the side of the sun
      for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2 + R() * .2, d = BALL.r + 1 + R() * 2.5, x = BALL.x + Math.cos(a) * d, y = BALL.y + Math.sin(a) * d, l = 1.6 + R() * 2.6;
        s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a + .4) * l)} ${f(Math.sin(a + .4) * l)}" stroke="${Math.cos(a) + Math.sin(a) < 0 ? rK.lit : rK.half}" stroke-width="${f(.5 + R() * .5)}" stroke-linecap="round"/>`; }
      // the shadow of the rim: the outer skin shades the inner layer along its upper-left edge (the sun is up left)
      s += `<path d="M0 0H200V160H0Z${poly(P, D[0] + 3.4, D[1] + 4.2)}" fill="#1c1006" fill-rule="evenodd" opacity=".55"/>`;
      // the ball's shadow on the inner layer, down to the right
      s += `<ellipse cx="${BALL.x + 4.6}" cy="${BALL.y + 4.4}" rx="${BALL.r * 1.02}" ry="${BALL.r * .96}" fill="#1c1006" opacity=".5"/>`;
      fg += s + `</g></g>`; }
    // the ball, sunk in the crater (its lower right in the crater's dark), a dull iron with a mould seam and rust
    fg += K.shadeSphere(u, BALL.x, BALL.y, BALL.r, L, 'iron', { outline: .5 });
    fg += `<path d="M${BALL.x - BALL.r * .96} ${BALL.y + 2}Q${BALL.x} ${BALL.y + 6.4} ${BALL.x + BALL.r * .96} ${BALL.y + 2}" stroke="${rI.core}" stroke-width=".4" fill="none" opacity=".6"/>`
      + `<circle cx="${BALL.x + 5}" cy="${BALL.y + 6}" r="1.4" fill="#6a3a1c" opacity=".55"/><circle cx="${BALL.x - 7}" cy="${BALL.y + 3}" r=".9" fill="#6a3a1c" opacity=".45"/>`;
    // the crater's lip in front of the ball's lower edge: crushed wood in shade (the ball sits in it, not on it)
    fg += `<path d="M${BALL.x - BALL.r * .92} ${BALL.y + 4}Q${BALL.x} ${BALL.y + BALL.r * 1.5} ${BALL.x + BALL.r * .92} ${BALL.y + 4}Q${BALL.x} ${BALL.y + BALL.r * 1.12} ${BALL.x - BALL.r * .92} ${BALL.y + 4}Z" fill="${rK.shadow}" opacity=".85"/>`
      + `<path d="M${BALL.x - BALL.r * .9} ${BALL.y + 5}Q${BALL.x} ${BALL.y + BALL.r * 1.46} ${BALL.x + BALL.r * .9} ${BALL.y + 5}" stroke="${rK.lit}" stroke-width=".5" fill="none" opacity=".8"/>`;
    // one long piece of a broken plank, torn out and hanging from the lower edge, bent towards us: ochre face,
    // raw wood where it split, its shadow on the side below
    { const e = P.ends[P.ends.length - 2], x0 = e.xr - 14, y0 = e.y1 - .4;
      const pc = `M${f(x0)} ${f(y0)}L${f(x0 + 14)} ${f(y0 - .2)}L${f(x0 + 20)} ${f(y0 + 9)}L${f(x0 + 17)} ${f(y0 + 10.4)}L${f(x0 + 15)} ${f(y0 + 8.4)}L${f(x0 + 12.5)} ${f(y0 + 11)}L${f(x0 + 2)} ${f(y0 + 4)}Z`;
      fg += `<path d="${pc}" fill="#000" opacity=".28" transform="translate(2.6 3)"/><path d="${pc}" fill="${mix(rO.half, rO.lit, .25)}" stroke="${rO.outline}" stroke-width=".3"/>`
        + `<path d="M${f(x0 + 14)} ${f(y0 - .2)}L${f(x0 + 20)} ${f(y0 + 9)}" stroke="#f4dca0" stroke-width=".9"/><path d="M${f(x0 + 2)} ${f(y0 + 4)}L${f(x0 + 12.5)} ${f(y0 + 11)}" stroke="#f4dca0" stroke-width=".6"/>`
        + `<path d="M${f(x0 + 3)} ${f(y0 + 2.4)}L${f(x0 + 15)} ${f(y0 + 3.4)}M${f(x0 + 6)} ${f(y0 + 5.8)}L${f(x0 + 16)} ${f(y0 + 7)}" stroke="${rO.shadow}" stroke-width=".3" opacity=".7"/>`; }
    // ——— the broken rim of the outer skin: plank ends split along the grain, bent out towards us (lit edges, ochre
    // faces, raw wood where they tore), cracks running out along the strakes from the hole
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], a = Math.atan2(p[1] - C.y, p[0] - C.x);
      // the lit lip of the cut along the lower and right edges, the dark lip on the upper-left
      const lit = Math.cos(a) * .5 + Math.sin(a) > .1;
      fg += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}" stroke="${lit ? '#e8c880' : rO.outline}" stroke-width="${lit ? .7 : .7}"/>`; }
    for (const e of P.ends) for (const side of [-1, 1]) {
      const x = side < 0 ? e.xl : e.xr, ym = (e.y0 + e.y1) / 2;
      // loose fibres standing out of the plank's end, along the grain and into the hole
      for (let k = 0; k < 4; k++) { const yy = e.y0 + 1 + R() * (STK - 2), l = 3 + R() * 7; fg += `<path d="M${f(x + side * 1)} ${f(yy)}q${f(-side * l * .5)} ${f((R() - .5) * 1.4)} ${f(-side * l)} ${f((R() - .3) * 2.4)}" stroke="${R() > .4 ? '#f4dca0' : rK.half}" stroke-width="${f(.35 + R() * .5)}" fill="none" stroke-linecap="round"/>`; }
    }
    // cracks along the strakes running out of the hole, left and right, and the paint flaked off round the rim
    for (let k = 0; k < 8; k++) { const side = k % 2 ? 1 : -1, e = P.ends[Math.floor(R() * P.ends.length)], y = e.y0 + 1.6 + R() * 4.8, x0 = (side < 0 ? e.xl - 4 : e.xr + 6), l = 10 + R() * 22;
      fg += `<path d="M${f(x0)} ${f(y)}q${f(side * l * .5)} ${f((R() - .5) * 1.4)} ${f(side * l)} ${f((R() - .5) * 2)}" stroke="${rO.outline}" stroke-width=".55" fill="none"/><path d="M${f(x0)} ${f(y + .5)}q${f(side * l * .4)} ${f((R() - .5))} ${f(side * l * .8)} 0" stroke="${rO.lit}" stroke-width=".3" fill="none" opacity=".7"/>`; }
    for (let k = 0; k < 26; k++) { const e = P.ends[Math.floor(R() * P.ends.length)], side = R() > .5 ? 1 : -1, x = (side < 0 ? e.xl - 3 - R() * 6 : e.xr + 5 + R() * 6), y = e.y0 + R() * STK;
      fg += `<path d="M${f(x)} ${f(y)}l${f(1 + R() * 2)} ${f(-.5 + R())}l${f(.6)} ${f(1.2)}z" fill="${rK.lit}" opacity=".75"/>`; }

    // ——— the splinters of the outer skin still flying out at us, dust and a little smoke from the strike
    fg += K.smoke(u, L, { x: C.x + 10, y: C.y + 4, w: 40, h: 46, wind: .5, seed: 7, opacity: .32 });
    for (let k = 0; k < 30; k++) { const a = -Math.PI * .9 + R() * Math.PI * 1.25, d = 30 + R() * 46, cx = C.x + Math.cos(a) * d * 1.15, cy = C.y + Math.sin(a) * d * .85;
      const len = 2 + R() * 7, rot = a + (R() - .5) * 1.4, wd = .35 + R() * .7, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * wd * 2, ny = dx / len * wd * 2;
      fg += `<path d="M${f(cx - dx + 1.4)} ${f(cy - dy + 1.6)}L${f(cx + dx + 1.4)} ${f(cy + dy + 1.6)}" stroke="#000" stroke-width="${f(wd)}" opacity=".18"/>`
        + `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .45 ? rK.lit : rO.lit}" stroke="${rK.outline}" stroke-width=".2"/>`; }
    // the warm sun on the side, the frame's corners darker
    fg += K.localGlow(u, { x: 60, y: 30, color: '#fff2d0', power: .25, radius: 110 }, { core: false });
    { const g = nid('vg', u); fg += `<defs>${radGrad(g, 100, 80, 170, [[0, '#0c0806', 0], [.6, '#0c0806', 0], [1, '#0c0806', .5]])}</defs><rect width="200" height="280" fill="url(#${g})"/>`; }
    // under the glass: the lower wale and the sea far below, the side going dark into it
    { const g = nid('dk', u); fg += `<defs>${linGrad(g, 0, 140, 0, 280, [[0, '#0a0604', 0], [1, '#0a0604', .6]])}</defs><rect x="0" y="140" width="200" height="140" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
