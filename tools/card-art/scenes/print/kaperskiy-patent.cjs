// «Каперский патент» (Индевор, ПРИКАЗ: возьмите 1 карту и положите 1 Порох в Трюм), refined from the first-round scene
// (portrait-endeavour.cjs SCENES['Каперский патент']): the Company's office in the evening. On the writing table the
// letter of marque lies open — lines of a fair hand, a broad flourish at its head, the band of small print at its foot
// with a reading glass over it, and the big red seal of the Company on a ribbon. The Company's striped flag hangs
// still on its pole behind the table; a candle is the light; a purse and a little stack of gold wait at the side.
// On the right the quill stands ready in the inkwell by the empty signature line; behind it two ledgers, in front the
// Company's desk seal and a stick of sealing wax. Brief's find: the Company's seal; the patent waiting to be signed.
// Fixed against the first round: the table was a flat green wall and the paper a sticker on it — now a room in 2.5D
// (back wall, side walls and the tooled leather of the table top running to one vanishing point, the sheet in the
// same perspective); the seal was a small coin — now a thick wax seal with the Company's cross on a ribbon; the lamp
// was a modern shaded lamp — now a candle; the desk seal of the first round is back (the pirate's hand was dropped).
// Light: the candle on the left (key, warm), the dusk window behind (cool, weak).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom } = PK;

const VX = 100, VY = 34;                      // the vanishing point (eye level)
const BW = [16, 184], WF = 70;                // the back wall's sides; the table's far edge (hides the wall foot)
const CAN = { x: 30, y: 98, s: 2, len: 13 };  // the candle on the table, left
const flameY = CAN.y - (3.4 + CAN.len + 3) * CAN.s;
const light = { time: 'night', haze: .2, key: { type: 'point', x: CAN.x, y: flameY, h: .5, gy: CAN.y, color: '#ffbe6a', power: 1, radius: 130 },
  fill: { color: '#3a4a64', power: .38 }, rim: { az: 0, color: '#9ab4d8', power: .25 } };
// the patent's four corners on the table (far-left, far-right, near-right, near-left): in the table's perspective
const SH = [[54, 79], [140, 77.4], [156, 121], [38, 123]];
const INK = { x: 160, y: 98 };                 // the inkwell with the quill standing in it
const STP = { x: 183, y: 122 };                // the Company's desk seal
const skel = { horizon: VY, eye: 1.5, light: 'candle on the table left (key) + dusk window behind (cool fill)', items: [
  ['back wall', BW[0], WF, BW[1] - BW[0], WF, 'floor (hidden by the table)'], ['window', 130, 44, 46, 38, 'back wall'], ['flag', 50, 70, 40, 60, 'pole in a floor stand behind the table'],
  ['table top', -10, 160, 220, 90, 'its far edge y 70'], ['patent', 38, 123, 118, 46, 'table top'], ['seal', 112, 112, 22, 20, 'on the patent, ribbon under it'],
  ['glass', 52, 116, 30, 14, 'on the patent'], ['candle', 22, 98, 18, 44, 'table top'], ['inkwell + quill', 150, 98, 32, 56, 'table top'],
  ['ledgers', 163, 88, 34, 16, 'table top, back right'], ['desk seal', 175, 122, 16, 33, 'table top'], ['sealing wax', 148, 132, 26, 8, 'table top'], ['purse + coins', 30, 124, 36, 22, 'table top']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
// a point on the sheet: (a across, b down) in 0..1 mapped bilinearly onto its four corners
const SP = (a, b) => { const t = [lerp(SH[0][0], SH[1][0], a), lerp(SH[0][1], SH[1][1], a)], d = [lerp(SH[3][0], SH[2][0], a), lerp(SH[3][1], SH[2][1], a)]; return [lerp(t[0], d[0], b), lerp(t[1], d[1], b)]; };
const toVP = (p, y) => [VX + (p[0] - VX) * (y - VY) / (p[1] - VY), y];   // the point on the line from VP through p at height y

// KIT-CANDIDATE (as in anzhelika.cjs, mirrored): a glass inkwell with a quill leaning to the right
function inkwell(u, L, x, y, k = 1) {
  const sc = `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">`;
  let out = K.shadeCyl(u, x, y, x, y - 6.5, 4.4, L, 'glass', { r1: 4.6, r2: 3.4, ell: .34, face: 2, outline: .4 })
    + `<path d="M${f(x - 4.1)} ${f(y - 2.2)}q4.1 1.4 8.2 0v1.6q-4.1 1.6 -8.2 0z" fill="#0c0f1a" opacity=".85"/>`
    + K.shadeCyl(u, x, y - 6.5, x, y - 8.2, 1.9, L, 'brass', { ell: .34, face: 2, outline: .35 }) + `<ellipse cx="${f(x)}" cy="${f(y - 8.2)}" rx="1.3" ry=".45" fill="#05070c"/>`;
  const q0 = [x - .2, y - 8.5], q1 = [x + 12, y - 42], rp = L.ramp('linen', x + 6, y - 26);
  out += `<path d="M${P2(q0)}Q${f(x + 4)} ${f(y - 26)} ${P2(q1)}" stroke="${rp.half}" stroke-width=".7" fill="none"/>`;
  const vane = [[x + 2.6, y - 18], [x + 1, y - 28], [x + 4, y - 38], [x + 11.4, y - 42.4], [x + 9.4, y - 33], [x + 6.8, y - 24], [x + 2.6, y - 18]];
  out += `<path d="${H.sp(vane, true)}" fill="${mix(rp.lit, '#f2e6cc', .55)}" stroke="${rp.outline}" stroke-width=".3" opacity=".95"/><path d="M${f(x + 2.4)} ${f(y - 18)}Q${f(x + 4.6)} ${f(y - 30)} ${f(x + 11.2)} ${f(y - 41.6)}" stroke="#fff8e8" stroke-width=".45" fill="none" opacity=".8"/>`;
  const R = rng(5); for (let i = 0; i < 12; i++) { const t = .15 + i / 13 * .8, sx = lerp(x + 2.4, x + 11.6, t), sy = lerp(y - 18, y - 42, t);
    out += `<path d="M${f(sx)} ${f(sy)}l${f(-(3 - t * 1.6 + R() * .6))} ${f(-1.6 - R())}" stroke="${rp.shadow}" stroke-width=".22" opacity=".6"/><path d="M${f(sx)} ${f(sy)}l${f(2.4 - t)} ${f(.6 + R() * .4)}" stroke="${rp.half}" stroke-width=".22" opacity=".6"/>`; }
  return sc + out + '</g>';
}

module.exports = { name: 'Каперский патент', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VY, eye: 1.5 });
    const R = rng(23);
    const ln = (d, w = .5, c = '#1a1008', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    const poly = (pts, fill, extra = '') => `<path d="M${pts.map(P2).join('L')}Z" fill="${fill}"${extra}/>`;
    // ——— the room: the back wall (dark green above an oak wainscot), the two side walls running out to the frame
    const WT = 46;                                       // the wainscot's top on the back wall
    let bg = `<rect width="200" height="280" fill="#141a16"/>`;
    { const g = nid('bw', u); bg += `<defs>${linGrad(g, 0, 0, 0, WF, [[0, '#1a2420'], [.6, '#26342c'], [1, '#2a3a30']])}</defs><rect x="${BW[0]}" y="-2" width="${BW[1] - BW[0]}" height="${WT + 2}" fill="url(#${g})"/>`;
      // a faint damask: rows of small lozenges
      for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) { const x = BW[0] + 7 + c * 14 + (r % 2) * 7, y = 3 + r * 6.4; bg += `<path d="M${x} ${f(y - 2)}l2 2l-2 2l-2 -2z" fill="#3a4c40" opacity=".35"/>`; } }
    // the wainscot: a rail and raised panels (lit bevel on the candle's side: left)
    { const rp = L.ramp('oak', 100, 58); bg += `<rect x="${BW[0]}" y="${WT}" width="${BW[1] - BW[0]}" height="${WF - WT}" fill="${mix(rp.shadow, '#1a0e06', .3)}"/>`
        + `<rect x="${BW[0]}" y="${WT - 1.6}" width="${BW[1] - BW[0]}" height="3" fill="${rp.half}"/><path d="M${BW[0]} ${WT - 1.6}H${BW[1]}" stroke="${rp.lit}" stroke-width=".5" opacity=".7"/>`;
      for (let i = 0; i < 7; i++) { const x0 = BW[0] + 4 + i * 24, x1 = x0 + 19, y0 = WT + 4, y1 = WF;
        bg += `<rect x="${x0}" y="${y0}" width="19" height="${y1 - y0}" fill="${mix(rp.shadow, rp.half, .25)}"/>` + ln(`M${x0} ${y1}V${y0}H${x1}`, .6, rp.half, .8) + ln(`M${x1} ${y0}V${y1}`, .6, '#0a0603', .8); } }
    // the side walls: ceiling, wainscot and floor lines run from the back wall's corners away from the vanishing point
    for (const [sx, ex] of [[BW[0], -1], [BW[1], 201]]) {
      const at = (yb) => { const t = (ex - VX) / (sx - VX); return [ex, VY + (yb - VY) * t]; };
      const top = at(-2), wt = at(WT), wf = at(WF + 12);
      bg += poly([[sx, -2], top, wt, [sx, WT]], '#121a16') + poly([[sx, WT], wt, wf, [sx, WF + 12]], '#1a1008');
      bg += ln(`M${sx} ${WT - .2}L${P2(wt)}`, 1.6, '#4a2e18', .9) + ln(`M${sx} -2V${WF}`, .6, '#060403', .9); }
    // the window in the back wall: dusk over the harbour, a Company ship at anchor, small panes in lead
    { const x0 = 132, x1 = 174, y0 = 6, y1 = 42, cid = nid('wc', u), sg = nid('ws', u), sea = nid('wsea', u);
      bg += `<rect x="${x0 - 3}" y="${y0 - 3}" width="${x1 - x0 + 6}" height="${y1 - y0 + 6}" fill="#2a180c"/>`
        + `<defs><clipPath id="${cid}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath>${linGrad(sg, 0, y0, 0, 30, [[0, '#2c3c64'], [.6, '#6a6a8a'], [1, '#d8a07a']])}${linGrad(sea, 0, 30, 0, y1, [[0, '#5a6a86'], [1, '#26344c']])}</defs>`
        + `<g clip-path="url(#${cid})"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${30 - y0}" fill="url(#${sg})"/><rect x="${x0}" y="30" width="${x1 - x0}" height="${y1 - 30}" fill="url(#${sea})"/>`
        + `<path d="M${x0} 30.2Q150 28.6 160 29.4T${x1} 29.6V30.4H${x0}Z" fill="#3a4258"/>`
        + `<path d="M148 31h14l-1.6 2h-11z" fill="#1a1c26"/><path d="M151 31V19M156 31V17.4M160 31V21.6" stroke="#1a1c26" stroke-width=".5"/>`
        + `<path d="M149.4 20h3.2l.4 4h-4zM154.4 18.6h3.4l.4 4.6h-4.2zM154.2 24h4l.4 4.4h-4.8zM149.2 25h3.6l.4 4h-4.4zM158.8 22.6h2.6l.3 3.6h-3.2z" fill="#3a3a4c"/>`
        + `<circle cx="161" cy="28" r=".5" fill="#ffd27a"/><path d="M${x0} 33h${x1 - x0}" stroke="#c8a888" stroke-width=".3" opacity=".4"/></g>`
        + [146, 160].map(x => `<rect x="${x - 1}" y="${y0}" width="2" height="${y1 - y0}" fill="#2a180c"/>`).join('') + `<rect x="${x0}" y="23" width="${x1 - x0}" height="2" fill="#2a180c"/>`;
      for (let x = x0 + 4.7; x < x1; x += 4.7) bg += ln(`M${f(x)} ${y0}V${y1}`, .2, '#1a1008', .6);
      for (let y = y0 + 4.3; y < y1; y += 4.3) bg += ln(`M${x0} ${f(y)}H${x1}`, .2, '#1a1008', .6);
      bg += K.localGlow(u, { x: 153, y: 30, color: '#8aa0c8', power: .25, radius: 30 }, { core: false }); }
    // the flag: a pole in a floor stand behind the table, the Company's striped colours hanging still in deep folds
    { const px = 56, top = 9, cid = nid('fl', u), fx0 = px + 1.2, fx1 = px + 30, fy0 = 12, fy1 = 62;
      bg += K.shadeCyl(u, px, WF + 2, px, top, 1.2, L, 'oak', { r1: 1.3, r2: 1, outline: .3, seed: 2 }) + K.shadeSphere(u, px, top - 1.6, 1.8, L, 'brass');
      // the cloth's outline: straight along the pole and the top, the fly hanging in a curve, the foot in scallops
      const foot = []; for (let i = 0; i <= 6; i++) { const x = lerp(fx0, fx1 - 4, i / 6); foot.push([x, fy1 + (i % 2 ? 1.8 : -.4) - i * .6]); }
      const d = `M${fx0} ${fy0}L${fx1} ${fy0 + 1}Q${fx1 + 1.6} ${(fy0 + fy1) / 2} ${fx1 - 4} ${fy1 - 4}` + foot.slice().reverse().map(p => `L${P2(p)}`).join('') + 'Z';
      const red = '#9a2420', wht = '#d8cfbc';
      bg += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${wht}"/><g clip-path="url(#${cid})">`;
      for (let k = 0; k < 11; k += 2) bg += `<rect x="${fx0 - 2}" y="${f(fy0 + k * 4.6)}" width="36" height="4.6" fill="${red}"/>`;
      bg += `<rect x="${fx0}" y="${fy0}" width="13" height="23" fill="${wht}"/><path d="M${fx0 + 6.5} ${fy0}v23M${fx0} ${fy0 + 11.5}h13" stroke="${red}" stroke-width="2.4"/>`;
      // vertical folds: light on the left of each ridge (candle side), shade on the right
      for (let k = 0; k < 6; k++) { const x = fx0 + 2.4 + k * 4.8, g = nid('ff', u);
        bg += `<defs>${linGrad(g, x - 2.4, 0, x + 2.4, 0, [[0, '#fff0d8', .22], [.4, '#000', 0], [.75, '#000', .32], [1, '#000', .1]])}</defs><rect x="${f(x - 2.4)}" y="${fy0}" width="4.8" height="${fy1 - fy0 + 4}" fill="url(#${g})"/>`; }
      bg += `</g><path d="${d}" fill="none" stroke="#2a0e08" stroke-width=".35"/>` + ln(`M${fx0} ${fy0}L${fx1} ${fy0 + 1}`, .6, '#3a2a1a'); }
    // the wall darkens up and away from the candle
    bg += gloom(u, 30, 60, 190, 0, .55, '#050806');

    // ——— the table: the far edge with its moulding, the green leather top with a tooled gold border in perspective
    let tb = '';
    { const rp = L.ramp('oak', 60, WF), g = nid('tl', u);
      tb += `<rect x="-2" y="${WF - 2.4}" width="204" height="3.4" fill="${rp.half}"/><path d="M-2 ${WF - 2.4}H202" stroke="${rp.lit}" stroke-width=".6" opacity=".8"/>`;
      tb += `<defs>${linGrad(g, 0, WF, 0, 200, [[0, '#1c3a26'], [.35, '#2a5236'], [1, '#183020']])}</defs><rect x="-2" y="${WF + 1}" width="204" height="210" fill="url(#${g})"/>`;
      // the leather's nap: faint strokes running to the vanishing point
      for (let i = 0; i < 40; i++) { const x = -60 + i * 8 + R() * 3, a = toVP([x, 200], WF + 1); tb += ln(`M${f(a[0])} ${WF + 1}L${f(x)} 200`, .25, '#0e2014', .35); }
      // the tooled border: a double gold line, its sides running to the vanishing point
      for (const [inset, w] of [[6, .5], [7.6, .3]]) { const yA = WF + inset, xl = toVP([-40 + inset * 6, 220], yA)[0], xr = toVP([240 - inset * 6, 220], yA)[0];
        tb += ln(`M${f(toVP([-40 + inset * 6, 220], 220)[0])} 220L${f(xl)} ${yA}H${f(xr)}L${f(toVP([240 - inset * 6, 220], 220)[0])} 220`, w, '#b8923a', .8); } }
    // the candle's pool of light on the leather
    tb += K.localGlow(u, { x: 60, y: 104, color: '#ffb860', power: .55, radius: 70 }, { squash: .4, core: false });

    // ——— the things on the table, far to near
    let fg = '';
    // the hourglass at the back left
    fg += K.castShadow(u, L, { x: 52, y: 80, w: 8, h: 14, horizon: VY, d: .9 }) + K.hourglass(u, L, { x: 52, y: 80, s: .95, sand: .55, seed: 3 });
    // the patent: its shadow, the sheet (cream, lit warmer towards the candle), a soft curl along its far edge
    { const sid = nid('sh', u), g = nid('sg', u);
      fg += `<defs><filter id="${sid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>${linGrad(g, SH[3][0], 0, SH[2][0], 0, [[0, '#fbf2dc'], [.5, '#f0e4c4'], [1, '#d8c8a2']])}</defs>`
        + poly(SH.map(p => [p[0] + 2.2, p[1] + 1.8]), '#06100a', ` opacity=".55" filter="url(#${sid})"`) + poly(SH, `url(#${g})`, ' stroke="#8a7a58" stroke-width=".4"')
        + ln(`M${P2(SH[0])}Q${f((SH[0][0] + SH[1][0]) / 2)} ${f(SH[0][1] - 1.6)} ${P2(SH[1])}`, 1.4, '#fffaf0', .7);
      // the head: a broad flourish across and a small crest (a shield with the Company's cross)
      { const a = SP(.18, .1), b = SP(.82, .1), m = SP(.5, .02), c = SP(.5, .17);
        fg += ln(`M${P2(a)}Q${P2(m)} ${P2(b)}`, 1.5, '#3a2a18', .85) + ln(`M${P2(SP(.26, .17))}Q${P2(c)} ${P2(SP(.74, .17))}`, .5, '#5a4a30', .7);
        const s0 = SP(.5, .26), sw = 4.6; fg += `<path d="M${f(s0[0] - sw)} ${f(s0[1] - 3.4)}h${f(sw * 2)}v2.8q0 3.6 ${f(-sw)} 5q${f(-sw)} -1.4 ${f(-sw)} -5z" fill="#f4ecdc" stroke="#7a1a14" stroke-width=".55"/><path d="M${f(s0[0])} ${f(s0[1] - 3.4)}v7.8M${f(s0[0] - sw)} ${f(s0[1] - .8)}h${f(sw * 2)}" stroke="#a8261e" stroke-width="1"/>`; }
      // the text: lines of a fair hand (strokes, no letters), each line following the sheet's perspective
      for (let k = 0; k < 9; k++) { const b = .36 + k * .045, a0 = .08 + (k % 4 === 0 ? .06 : 0), a1 = k === 8 ? .5 : .9 - (k % 3) * .03;
        let d = ''; const n = 14; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), p = SP(a, b + Math.sin(i * 1.7 + k) * .004); d += (i ? 'L' : 'M') + P2(p); }
        fg += `<path d="${d}" stroke="#4a3a28" stroke-width="${f(.42 + b * .2)}" fill="none" stroke-dasharray="${f(2 + R() * 2)} ${f(.6 + R() * .5)}" opacity=".85"/>`; }
      // the small print: a dense grey band at the foot, left; the reading glass over it
      for (let k = 0; k < 5; k++) { const b = .79 + k * .022, p = SP(.08, b), q = SP(.56, b); fg += `<path d="M${P2(p)}L${P2(q)}" stroke="#6a5a44" stroke-width=".34" stroke-dasharray=".7 .3" opacity=".8"/>`; }
      // the signature line, still empty, at the right under the text
      fg += ln(`M${P2(SP(.56, .8))}L${P2(SP(.92, .8))}`, .45, '#3a2a18', .8);
      // the reading glass: a brass ring and a turned handle, the print under it larger and sharper
      { const c = SP(.3, .82), rx = 8.4, ry = 5.4, gg = nid('rg', u);
        fg += `<ellipse cx="${f(c[0] + 1.6)}" cy="${f(c[1] + 1.6)}" rx="${rx}" ry="${ry}" fill="#06100a" opacity=".3"/>`
          + `<defs>${radGrad(gg, c[0] - 2, c[1] - 1.4, rx, [[0, '#fffaf0', .5], [.7, '#f4ead0', .15], [1, '#c8d8d8', .3]])}</defs>`;
        for (let k = 0; k < 4; k++) { const y = c[1] - 3.4 + k * 2.2, hw = Math.sqrt(Math.max(0, 1 - Math.pow((y - c[1]) / ry, 2))) * rx * .86; fg += `<path d="M${f(c[0] - hw)} ${f(y)}H${f(c[0] + hw)}" stroke="#4a3a28" stroke-width=".8" stroke-dasharray="1.6 .6"/>`; }
        fg += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${rx}" ry="${ry}" fill="url(#${gg})"/>`
          + K.shadeCyl(u, c[0] - rx - 9.6, c[1] + 2.6, c[0] - rx + .4, c[1] + .6, 1.1, L, 'oak', { r1: 1.2, r2: .9, outline: .3, cap: 'round' })
          + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${rx}" ry="${ry}" fill="none" stroke="#5a4214" stroke-width="1.6"/><ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${rx}" ry="${ry}" fill="none" stroke="#e8c870" stroke-width=".6" stroke-dasharray="6 3" opacity=".9"/>`
          + ln(`M${f(c[0] - 5)} ${f(c[1] - 3)}q3 -1.8 6.4 -1.4`, .7, '#ffffff', .8); }
      // the seal: a thick wax disc of the Company on a red-and-white ribbon whose tails run off the sheet's foot
      { const c = SP(.76, .74), rx = 10, ry = 6.6;
        const tail = (dx, col) => `<path d="M${f(c[0] + dx)} ${f(c[1])}L${f(c[0] + dx * 1.6 + 3)} ${f(c[1] + 15)}l${f(-1.6)} ${f(-2.2)}l${f(-2.4)} 1.6L${f(c[0] + dx - 2.6)} ${f(c[1] + 1)}Z" fill="${col}" stroke="#4a0a06" stroke-width=".3"/>`;
        fg += tail(-3, '#b82a22') + tail(3.4, '#c8302a') + `<path d="M${f(c[0] - 4)} ${f(c[1] + 3)}l3 10M${f(c[0] + 4.6)} ${f(c[1] + 3)}l3.2 9.6" stroke="#f4ece0" stroke-width=".9" opacity=".9"/>`;
        const g = nid('wx', u), e = nid('we', u);
        fg += `<defs>${radGrad(g, c[0] - 3, c[1] - 2.4, rx * 1.1, [[0, '#e04a3a'], [.45, '#b8201a'], [1, '#6a0c08']])}${radGrad(e, c[0] + 1, c[1] + 1, rx * .7, [[0, '#8a1410'], [1, '#c8302a']])}</defs>`
          + `<ellipse cx="${f(c[0] + 1)}" cy="${f(c[1] + 1.8)}" rx="${rx + .6}" ry="${ry + .4}" fill="#3a0604" opacity=".5"/>`
          + `<path d="M${f(c[0] - rx)} ${f(c[1])}q-.4 1.6 .6 2.4Q${f(c[0])} ${f(c[1] + ry + 2)} ${f(c[0] + rx - .4)} ${f(c[1] + 2.2)}q1 -1 .4 -2.2z" fill="#7a0e0a"/>`
          + `<path d="M${f(c[0] - rx)} ${f(c[1])}q1 -2.6 3 -3.6q2 -3.4 6.4 -2.8q5.4 -.6 7.6 2.6q2.6 1.4 3 3.8q-.2 3.2 -3.4 4.4q-3.4 2.6 -7.8 2q-5 .4 -7.4 -2.2q-2.2 -1.6 -1.4 -4.2z" fill="url(#${g})"/>`
          + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx * .62)}" ry="${f(ry * .62)}" fill="url(#${e})" stroke="#f07a60" stroke-width=".4" opacity=".95"/>`
          + `<path d="M${f(c[0])} ${f(c[1] - ry * .5)}v${f(ry)}M${f(c[0] - rx * .5)} ${f(c[1])}h${rx}" stroke="#e86a54" stroke-width="1.1"/><path d="M${f(c[0] + .5)} ${f(c[1] - ry * .5 + .5)}v${f(ry)}M${f(c[0] - rx * .5 + .5)} ${f(c[1] + .5)}h${rx}" stroke="#4a0806" stroke-width=".5" opacity=".7"/>`
          + `<path d="M${f(c[0] - 7)} ${f(c[1] - 2.4)}q3 -3 7 -3" stroke="#ffd0c0" stroke-width=".9" fill="none" opacity=".75"/>`; } }
    // the purse and the gold at the left front
    fg += K.castShadow(u, L, { x: 46, y: 118, w: 14, h: 14, horizon: VY, d: .8 })
      + `<g transform="translate(46 118)">${(() => { const rp = L.ramp('leather', 46, 112); return `<path d="M-8 0q-3 -9 3 -12l-1.6 -3.4h9.6l-1.6 3.4q7 3 3.4 12q-6 2.4 -12.8 0z" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".45"/><path d="M-7 -1q-2 -7 2 -10" stroke="${rp.lit}" stroke-width="1.4" fill="none" opacity=".6"/><path d="M-4.6 -12q4.4 1.6 9.2 0" stroke="#c9a048" stroke-width=".9" fill="none"/><path d="M4.4 -12.4q3 2.6 1.6 6" stroke="#c9a048" stroke-width=".6" fill="none"/>`; })()}</g>`
      + K.coins(u, L, { x: 66, y: 116, s: 1.1, n: 7, seed: 4 });
    // the candle (the key light) on the left
    fg += K.castShadow(u, L, { x: CAN.x, y: CAN.y, w: 8 * CAN.s, h: 2, horizon: VY, d: .9 }) + K.candle(u, L, { ...CAN, seed: 4 })
      + K.localGlow(u, { x: CAN.x, y: flameY, color: '#ffc070', power: .9, radius: 34 });
    // ——— the right side of the table, far to near: two ledgers stacked at the back, the inkwell with its quill
    // standing ready, the Company's desk seal (a brass matrix on a turned handle) and a stick of red sealing wax
    { const book = (x, y, w, h, ox, oy, cover, seed) => { const F = K.boxFaces(x, y, w, h, ox, oy);
        F[0].kind = 'leather'; F[1].kind = 'linen'; F[1].grain = false; F[2].kind = 'linen'; F[2].grain = false;
        let o = K.shadeBox(u, F, L, 'leather', { seed, outline: .35 });
        // the cover's tint, its boards proud of the page block, the gilt band on the top board
        o += `<path d="M${F[0].pts.map(P2).join('L')}Z" fill="${cover}" opacity=".45"/>`
          + ln(`M${f(x - .4)} ${f(y - h + .6)}H${f(x + w + .4)}`, .9, cover, .9) + ln(`M${f(x - .4)} ${f(y - .3)}H${f(x + w + .4)}`, .9, cover, .9);
        for (let k = 1; k < 4; k++) o += ln(`M${f(x + .6)} ${f(y - h + k * h / 4 + .2)}H${f(x + w - .6)}`, .2, '#8a7a58', .7);
        o += ln(`M${f(x + 3 + ox * .5)} ${f(y - h - oy * .5)}H${f(x + w - 3 + ox * .5)}`, .45, '#c9a048', .8);
        return o; };
      fg += K.castShadow(u, L, { x: 182, y: 88, w: 28, h: 9, horizon: VY, d: .5 })
        + book(166, 88, 31, 4.6, -3.2, 6, '#3a1a10', 1) + book(169, 83.4, 26, 4, -2.8, 5.2, '#1a2a3a', 2); }
    fg += K.castShadow(u, L, { x: INK.x, y: INK.y, w: 10, h: 10, horizon: VY, d: .9 }) + inkwell(u, L, INK.x, INK.y, 1.25);
    // the desk seal standing on the table: a brass foot, a turned oak handle swelling to a knob
    { const x = STP.x, y = STP.y, k = 1.35;
      fg += K.castShadow(u, L, { x, y, w: 12 * k, h: 24 * k, horizon: VY, d: .9 }) + K.contactShadow(u, x, y, 12 * k, L, { ry: 1.6 * k, opacity: .6 })
        + `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">` + K.shadeCyl(u, x, y, x, y - 3.4, 5.6, L, 'brass', { ell: .3, face: 2, outline: .35 })
        + K.shadeCyl(u, x, y - 3.4, x, y - 5.2, 3.2, L, 'brass', { r1: 4, r2: 2.4, ell: .3, face: 2, outline: .3 })
        + K.shadeCyl(u, x, y - 5.2, x, y - 17, 1.6, L, 'oak', { r1: 1.7, r2: 2.6, ell: .3, outline: .3, seed: 7 })
        + `<path d="M${f(x - 2.6)} ${f(y - 12.4)}h5.2M${f(x - 2)} ${f(y - 8.6)}h4" stroke="#1a0e06" stroke-width=".35" opacity=".7"/>`
        + K.shadeSphere(u, x, y - 20.4, 3.9, L, 'oak', { outline: .3 }) + '</g>'; }
    // the stick of sealing wax lying in front of it, its burnt end towards the candle
    { const a = [150, 129.5], b = [172, 126.4], m = K.mat('paint-red', L, { form: 'cyl', x1: a[0], y1: a[1], x2: b[0], y2: b[1], r: 1.7, u });
      fg += `<path d="M${f(a[0] + 1.6)} ${f(a[1] + 2.2)}L${f(b[0] + 1.6)} ${f(b[1] + 2.2)}" stroke="#06100a" stroke-width="2.6" opacity=".45" stroke-linecap="round"/>`
        + m.defs + `<path d="M${P2(a)}L${P2(b)}" stroke="${m.fill}" stroke-width="3.4" stroke-linecap="round"/>`
        + ln(`M${f(a[0] + 2)} ${f(a[1] - 1.1)}L${f(b[0] - 1)} ${f(b[1] - 1.1)}`, .5, '#ff9a80', .6)
        + `<ellipse cx="${f(a[0] - .4)}" cy="${f(a[1] + .1)}" rx="1.3" ry="1.8" transform="rotate(-8 ${f(a[0])} ${f(a[1])})" fill="#2a0604"/>`; }

    // ——— the room darkens away from the candle and down under the glass
    fg += gloom(u, 40, 90, 200, 60, .35, '#050403') + gloom(u, 100, 126, 100, 280, .5, '#030806');
    return [bg + tb, fg];
  } };
