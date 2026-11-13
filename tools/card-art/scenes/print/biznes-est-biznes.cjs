// «Бизнес есть бизнес» (Индевор, ПРИКАЗ: положите 2 Пороха в Трюм), refined from the first-round scene
// (portrait-endeavour.cjs SCENES['Бизнес есть бизнес']): the Company's office by day — the same office as «Каперский
// патент» (green damask over an oak wainscot, the green leather of the desk with its gold border, the striped flag).
// On the desk big brass scales stand dead level: two kegs of powder with the Company's mark in the left pan, a heap of
// gold in the right. Behind them the tall window on the harbour, a Company ship at anchor; at the right the open
// ledger with its columns, the quill in the inkwell, the key of the strongbox; in front columns of gold and a purse.
// Brief's find: the scales — powder weighed against gold, «ничего личного, только прибыль».
// Fixed against the first round: the room was a flat wall with a strip of floor — now a room in 2.5D (back wall, side
// walls and the desk top run to one vanishing point, the window in the back wall); the scales were thin lines with
// the pans' chains slack — now a turned brass pillar on a stepped foot, a beam with pointer and knife edges, three
// chains to each pan, the pans as dishes holding their load; one keg became two (the card's two Powder) and the coins
// a heap; the map on the wall was a blank sheet — now a framed chart of a coast. Light: the sun through the window
// behind the scales (key: the brass rimmed, the kegs and the gold lit from behind and above, shafts through the dusty
// air onto the desk); the room's warm fill from the front.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, shafts, motes } = PK;

const VX = 100, VY = 40;                      // the vanishing point (eye level)
const BW = [12, 188], WT = 58, WF = 72;       // the back wall's sides, the wainscot's top, the desk's far edge
const WIN = { x0: 34, x1: 146, y0: 2, y1: 55 };
const SC = { x: 90, y: 118, top: 42, beam: 48, half: 39, pan: 92 };   // the scales: foot, pillar top, beam, pans
const light = { time: 'day', haze: .3, key: { type: 'sun', az: 335, el: 34, color: '#fff2d0', power: .95 }, fill: { color: '#c8a070', power: .5 },
  rim: { az: 0, color: '#fff6dc', power: .5 } };
const skel = { horizon: VY, eye: 1.4, light: 'sun through the window behind the scales (key, rim) + warm room fill', items: [
  ['back wall', BW[0], WF, BW[1] - BW[0], WF, 'floor (hidden by the desk)'], ['window', WIN.x0, WIN.y1, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 'back wall'],
  ['flag', 160, 72, 26, 64, 'pole in a floor stand behind the desk'], ['chart', 18, 46, 14, 30, 'side wall'],
  ['desk top', -10, 280, 220, 208, 'its far edge y 72'], ['scales', SC.x - 40, SC.y, 80, SC.y - SC.top, 'desk top'], ['kegs', SC.x - SC.half - 10, SC.pan, 20, 13, 'left pan'],
  ['gold', SC.x + SC.half - 11, SC.pan, 22, 9, 'right pan'], ['ledger', 132, 124, 52, 18, 'desk top'], ['inkwell', 178, 104, 12, 40, 'desk top'], ['coins', 30, 130, 50, 12, 'desk top']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toVP = (p, y) => [VX + (p[0] - VX) * (y - VY) / (p[1] - VY), y];

// KIT-CANDIDATE (as in kaperskiy-patent.cjs): a glass inkwell with a quill leaning to the right
function inkwell(u, L, x, y, k = 1) {
  const sc = `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">`;
  let out = K.shadeCyl(u, x, y, x, y - 6.5, 4.4, L, 'glass', { r1: 4.6, r2: 3.4, ell: .34, face: 2, outline: .4 })
    + `<path d="M${f(x - 4.1)} ${f(y - 2.2)}q4.1 1.4 8.2 0v1.6q-4.1 1.6 -8.2 0z" fill="#0c0f1a" opacity=".85"/>`
    + K.shadeCyl(u, x, y - 6.5, x, y - 8.2, 1.9, L, 'brass', { ell: .34, face: 2, outline: .35 }) + `<ellipse cx="${f(x)}" cy="${f(y - 8.2)}" rx="1.3" ry=".45" fill="#05070c"/>`;
  const q0 = [x - .2, y - 8.5], q1 = [x - 12, y - 40], rp = L.ramp('linen', x - 6, y - 26);
  out += `<path d="M${P2(q0)}Q${f(x - 4)} ${f(y - 26)} ${P2(q1)}" stroke="${rp.half}" stroke-width=".7" fill="none"/>`;
  const vane = [[x - 2.6, y - 18], [x - 1, y - 28], [x - 4, y - 37], [x - 11.4, y - 40.4], [x - 9.4, y - 31], [x - 6.8, y - 23], [x - 2.6, y - 18]];
  out += `<path d="M${vane.map(P2).join('L')}Z" fill="${mix(rp.lit, '#f6ecd6', .55)}" stroke="${rp.outline}" stroke-width=".3" opacity=".95"/><path d="M${f(x - 2.4)} ${f(y - 18)}Q${f(x - 4.6)} ${f(y - 30)} ${f(x - 11.2)} ${f(y - 39.6)}" stroke="#fffaf0" stroke-width=".45" fill="none" opacity=".8"/>`;
  const R = rng(5); for (let i = 0; i < 12; i++) { const t = .15 + i / 13 * .8, sx = lerp(x - 2.4, x - 11.2, t), sy = lerp(y - 18, y - 40, t);
    out += `<path d="M${f(sx)} ${f(sy)}l${f(3 - t * 1.6 + R() * .6)} ${f(-1.6 - R())}" stroke="${rp.shadow}" stroke-width=".22" opacity=".5"/><path d="M${f(sx)} ${f(sy)}l${f(-(2.4 - t))} ${f(.6 + R() * .4)}" stroke="${rp.half}" stroke-width=".22" opacity=".6"/>`; }
  return sc + out + '</g>';
}

module.exports = { name: 'Бизнес есть бизнес', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VY, eye: 1.4 });
    const Lo = K.makeLight({ time: 'day', haze: .12, key: { type: 'sun', x: 128, y: 6, color: '#fff6dc', power: .9 } }, { horizon: 34 });
    const R = rng(29);
    const ln = (d, w = .5, c = '#1a1008', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    const poly = (pts, fill, extra = '') => `<path d="M${pts.map(P2).join('L')}Z" fill="${fill}"${extra}/>`;

    // ——— the room ———
    let bg = `<rect width="200" height="280" fill="#1c2a22"/>`;
    { const g = nid('bw', u); bg += `<defs>${linGrad(g, 0, 0, 0, WT, [[0, '#24342a'], [1, '#33483a']])}</defs><rect x="${BW[0]}" y="-2" width="${BW[1] - BW[0]}" height="${WT + 2}" fill="url(#${g})"/>`;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 12; c++) { const x = BW[0] + 7 + c * 14 + (r % 2) * 7, y = 3 + r * 6.4; bg += `<path d="M${x} ${f(y - 2)}l2 2l-2 2l-2 -2z" fill="#4a6050" opacity=".35"/>`; } }
    // the wainscot under the window: a rail and raised panels
    { const rp = L.ramp('oak', 100, 64); bg += `<rect x="${BW[0]}" y="${WT}" width="${BW[1] - BW[0]}" height="${WF - WT}" fill="${mix(rp.shadow, '#2a1608', .3)}"/>`
        + `<rect x="${BW[0]}" y="${WT - 1.6}" width="${BW[1] - BW[0]}" height="3" fill="${rp.half}"/><path d="M${BW[0]} ${WT - 1.6}H${BW[1]}" stroke="${rp.lit}" stroke-width=".5" opacity=".8"/>`;
      for (let i = 0; i < 7; i++) { const x0 = BW[0] + 4 + i * 24.6, x1 = x0 + 19.6, y0 = WT + 3;
        bg += `<rect x="${f(x0)}" y="${y0}" width="19.6" height="${WF - y0}" fill="${mix(rp.shadow, rp.half, .3)}"/>` + ln(`M${f(x0)} ${WF}V${y0}H${f(x1)}`, .6, rp.lit, .55) + ln(`M${f(x1)} ${y0}V${WF}`, .6, '#0a0603', .8); } }
    // the side walls, running out from the back wall's corners
    for (const [sx, ex] of [[BW[0], -1], [BW[1], 201]]) {
      const at = yb => { const t = (ex - VX) / (sx - VX); return [ex, VY + (yb - VY) * t]; };
      const top = at(-2), wt = at(WT), wf = at(WF + 12);
      bg += poly([[sx, -2], top, wt, [sx, WT]], sx < VX ? '#2c4034' : '#1e2c24') + poly([[sx, WT], wt, wf, [sx, WF + 12]], '#2a1608');
      bg += ln(`M${sx} ${WT - .2}L${P2(wt)}`, 1.6, '#5a3a1c', .9) + ln(`M${sx} -2V${WF}`, .6, '#0a0806', .9); }
    // the chart on the back wall left of the window: a framed coast
    bg += `<rect x="14.6" y="12" width="16.4" height="34" fill="#4a2a14" stroke="#1a0c04" stroke-width=".5"/><rect x="16.2" y="13.6" width="13.2" height="30.8" fill="#e6d6b0"/>`
      + ln('M17.4 22Q21 20 23 24T28.6 26M17.6 34Q22 31 28 35', .45, '#7a6040', .9) + `<path d="M19 25q2 -2 4 0q-1 2 -4 0z" fill="#b8a070"/><circle cx="24.6" cy="39.4" r="1.6" fill="none" stroke="#8a2a1a" stroke-width=".35"/><path d="M24.6 37.4v4M22.6 39.4h4" stroke="#8a2a1a" stroke-width=".25"/>`
      + ln('M14.6 12H31', .4, '#c89a60', .6) + `<path d="M31 12.6v34h1.2v-33z" fill="#0a0604" opacity=".35"/>`;
    // the window: the harbour by day — sky, a far shore, the sea, a Company ship at anchor; small panes in lead
    { const { x0, x1, y0, y1 } = WIN, cid = nid('wc', u), hz = 34;
      bg += `<rect x="${x0 - 3}" y="${y0 - 3}" width="${x1 - x0 + 6}" height="${y1 - y0 + 6}" fill="#3a2410"/>`
        + `<defs><clipPath id="${cid}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><g clip-path="url(#${cid})">`
        + K.sky(u, Lo, { horizon: hz, top: y0 }) + K.cloud(u, Lo, { x: 60, y: 20, w: 34, h: 6, seed: 3, far: .4 }) + K.cloud(u, Lo, { x: 132, y: 14, w: 28, h: 5, seed: 8, far: .5 })
        + `<path d="M${x0} ${hz + .2}Q50 ${hz - 4} 66 ${hz - 3}T96 ${hz - .6}V${hz + .4}H${x0}Z" fill="#7a9488" opacity=".8"/>`
        + K.water(u, Lo, { horizon: hz, bottom: y1 + 2, swell: .3, seed: 9, glitter: 128 })
        + K.ship(u, Lo, { kind: 'endeavour', x: 112, y: 45, scale: .34, sails: 'furled', detail: 'mid', seed: 2 })
        + K.ship(u, Lo, { kind: 'merchant', x: 58, y: 38.6, scale: .2, sails: 'furled', detail: 'far', flip: true, seed: 4 })
        + `</g>`;
      // the bars and the leading; the glass catching the light; the sill and its shadow
      for (let x = x0 + 4.66; x < x1 - 1; x += 4.66) bg += ln(`M${f(x)} ${y0}V${y1}`, .22, '#2a1a0c', .55);
      for (let y = y0 + 4.4; y < y1 - 1; y += 4.4) bg += ln(`M${x0} ${f(y)}H${x1}`, .22, '#2a1a0c', .55);
      for (const x of [x0 + (x1 - x0) / 3, x0 + (x1 - x0) * 2 / 3]) bg += `<rect x="${f(x - 1.2)}" y="${y0}" width="2.4" height="${y1 - y0}" fill="#3a2410"/><path d="M${f(x - 1.2)} ${y0}V${y1}" stroke="#a87a48" stroke-width=".4"/>`;
      bg += `<rect x="${x0}" y="27" width="${x1 - x0}" height="2.4" fill="#3a2410"/><path d="M${x0} 27H${x1}" stroke="#a87a48" stroke-width=".4"/>`
        + `<rect x="${x0 - 4}" y="${y1}" width="${x1 - x0 + 8}" height="2.6" fill="#7a5028"/><path d="M${x0 - 4} ${y1}H${x1 + 4}" stroke="#f0c890" stroke-width=".5"/>`
        + K.localGlow(u, { x: 90, y: 28, color: '#fff2d0', power: .35, radius: 70 }, { core: false }); }
    // the Company's flag on its pole in the right corner behind the desk, hanging still in folds (as in «Каперский патент»)
    { const px = 164, top = 8, cid = nid('fl', u), fx0 = px + 1.2, fx1 = px + 22, fy0 = 11, fy1 = 56;
      bg += K.shadeCyl(u, px, WF + 2, px, top, 1.2, L, 'oak', { r1: 1.3, r2: 1, outline: .3, seed: 2 }) + K.shadeSphere(u, px, top - 1.6, 1.8, L, 'brass');
      const foot = []; for (let i = 0; i <= 5; i++) { const x = lerp(fx0, fx1 - 3, i / 5); foot.push([x, fy1 + (i % 2 ? 1.8 : -.4) - i * .6]); }
      const d = `M${fx0} ${fy0}L${fx1} ${fy0 + 1}Q${fx1 + 1.6} ${(fy0 + fy1) / 2} ${fx1 - 3} ${fy1 - 3}` + foot.slice().reverse().map(p => `L${P2(p)}`).join('') + 'Z';
      const red = '#a02a22', wht = '#e2d8c4';
      bg += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${wht}"/><g clip-path="url(#${cid})">`;
      for (let k = 0; k < 11; k += 2) bg += `<rect x="${fx0 - 2}" y="${f(fy0 + k * 4.4)}" width="28" height="4.4" fill="${red}"/>`;
      bg += `<rect x="${fx0}" y="${fy0}" width="10" height="20" fill="${wht}"/><path d="M${fx0 + 5} ${fy0}v20M${fx0} ${fy0 + 10}h10" stroke="${red}" stroke-width="2.2"/>`;
      for (let k = 0; k < 5; k++) { const x = fx0 + 2.2 + k * 4.4, g = nid('ff', u);
        bg += `<defs>${linGrad(g, x - 2.2, 0, x + 2.2, 0, [[0, '#fff4dc', .3], [.4, '#000', 0], [.75, '#000', .3], [1, '#000', .1]])}</defs><rect x="${f(x - 2.2)}" y="${fy0}" width="4.4" height="${fy1 - fy0 + 4}" fill="url(#${g})"/>`; }
      bg += `</g><path d="${d}" fill="none" stroke="#2a0e08" stroke-width=".35"/>`; }

    // ——— the desk: the far edge's moulding, the green leather with a tooled gold border in perspective ———
    let tb = '';
    { const rp = L.ramp('oak', 60, WF), g = nid('tl', u);
      tb += `<rect x="-2" y="${WF - 2.4}" width="204" height="3.4" fill="${rp.half}"/><path d="M-2 ${WF - 2.4}H202" stroke="${rp.lit}" stroke-width=".6" opacity=".8"/>`;
      tb += `<defs>${linGrad(g, 0, WF, 0, 200, [[0, '#2a4a32'], [.35, '#335c3e'], [1, '#1c3424']])}</defs><rect x="-2" y="${WF + 1}" width="204" height="210" fill="url(#${g})"/>`;
      for (let i = 0; i < 40; i++) { const x = -60 + i * 8 + R() * 3, a = toVP([x, 200], WF + 1); tb += ln(`M${f(a[0])} ${WF + 1}L${f(x)} 200`, .25, '#10261a', .35); }
      for (const [inset, w] of [[6, .5], [7.6, .3]]) { const yA = WF + inset, xl = toVP([-40 + inset * 6, 220], yA)[0], xr = toVP([240 - inset * 6, 220], yA)[0];
        tb += ln(`M${f(toVP([-40 + inset * 6, 220], 220)[0])} 220L${f(xl)} ${yA}H${f(xr)}L${f(toVP([240 - inset * 6, 220], 220)[0])} 220`, w, '#c9a048', .85); } }
    // the window's light lying on the desk: a bright skewed patch of panes beyond the scales
    tb += K.localGlow(u, { x: 100, y: 92, color: '#fff0c8', power: .5, radius: 60 }, { squash: .35, core: false });

    // ——— the things on the desk, far to near ———
    let fg = '';
    // the scales' shadow on the leather, thrown towards us by the window
    fg += `<path d="M${SC.x - 15} ${SC.y + 1}L${SC.x + 15} ${SC.y + 1}L${SC.x + 30} ${SC.y + 22}L${SC.x - 22} ${SC.y + 22}Z" fill="#0a1a10" opacity=".25" filter="url(#soft${u})"/>`;
    // the scales: the stepped foot, the turned pillar, the crossbar with its pointer, three chains to each pan
    let sc = '';
    { const { x, y, top, beam, half, pan } = SC;
      sc += K.contactShadow(u, x, y, 34, L, { ry: 2.4, opacity: .55 })
        + K.shadeCyl(u, x, y, x, y - 3, 15.5, L, 'brass', { ell: .26, face: 2, outline: .4 })
        + K.shadeCyl(u, x, y - 3, x, y - 5.4, 10.5, L, 'brass', { r1: 12, r2: 9, ell: .26, face: 2, outline: .35 })
        + K.shadeCyl(u, x, y - 5.4, x, y - 8, 5, L, 'brass', { r1: 6, r2: 3.6, ell: .26, face: 2, outline: .35 })
        + K.shadeCyl(u, x, y - 8, x, top + 6, 2.3, L, 'brass', { r1: 2.6, r2: 1.9, outline: .35 });
      for (const yy of [y - 22, y - 44]) sc += K.shadeCyl(u, x, yy + 1.2, x, yy - 1.2, 3.2, L, 'brass', { r1: 2.6, r2: 2.6, bulge: .4, ell: .26, face: 2, outline: .3 });
      // the fork at the top that carries the beam's pivot; the pointer standing up from the beam, the scale plate
      sc += `<path d="M${x - 4.6} ${top + 7}Q${x - 5} ${beam + 2} ${x - 2.6} ${beam - 2.4}H${x - 1.4}Q${x - 3} ${beam + 2} ${x - 2.2} ${top + 7}Z M${x + 4.6} ${top + 7}Q${x + 5} ${beam + 2} ${x + 2.6} ${beam - 2.4}H${x + 1.4}Q${x + 3} ${beam + 2} ${x + 2.2} ${top + 7}Z" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".3"/>`
        + `<path d="M${x - 5} ${top + 7}H${x + 5}" stroke="url(#brass${u})" stroke-width="1.6"/>`
        + `<path d="M${x - 3.4} ${top + 1}A3.6 3.6 0 0 1 ${x + 3.4} ${top + 1}" fill="none" stroke="url(#brass${u})" stroke-width="1"/>`
        + `<path d="M${x} ${beam}V${top - 1.6}" stroke="#2a1a04" stroke-width=".9" stroke-linecap="round"/><path d="M${x - .3} ${beam - 1}V${top - 1}" stroke="#ffe8a0" stroke-width=".3"/>`
        + K.shadeSphere(u, x, top - 2.4, 1.3, L, 'brass', { outline: .3 });
      // the beam: thicker at the middle, the ends turned, a ring at each end for the chains
      sc += `<path d="M${x - half} ${beam - .6}Q${x} ${beam - 2.4} ${x + half} ${beam - .6}L${x + half} ${beam + .6}Q${x} ${beam + 1.8} ${x - half} ${beam + .6}Z" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".35"/>`
        + ln(`M${x - half + 1} ${beam - .7}Q${x} ${beam - 2.3} ${x + half - 1} ${beam - .7}`, .4, '#fff4c0', .85)
        + K.shadeSphere(u, x, beam, 2, L, 'brass', { outline: .3 });
      // each pan: three chains from the ring under the beam's end to the rim, the dish, and what lies in it
      for (const sd of [-1, 1]) { const ex = x + sd * half, rx = 15.4, ry = 4;
        sc += K.shadeSphere(u, ex + sd * 1, beam, 1.4, L, 'brass', { outline: .25 }) + `<circle cx="${ex + sd}" cy="${beam + 2.4}" r="1" fill="none" stroke="url(#brass${u})" stroke-width=".55"/>`;
        // the far chain first (behind the load), the two near after it
        const ring = [ex + sd, beam + 3.3], rim = [[ex, pan - ry * .9], [ex - rx * .92, pan + .4], [ex + rx * .92, pan + .4]];
        const chain = (a, b) => { const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.6); let o = '';
          for (let i = 0; i < n; i++) { const t = (i + .5) / n, cx = lerp(a[0], b[0], t), cy = lerp(a[1], b[1], t); o += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${i % 2 ? .35 : .55}" ry=".85" transform="rotate(${f(Math.atan2(b[0] - a[0], b[1] - a[1]) * -57.3)} ${f(cx)} ${f(cy)})" fill="none" stroke="#7a5a18" stroke-width=".35"/>`; } return o + ln(`M${P2(a)}L${P2(b)}`, .2, '#ffe8a0', .5); };
        sc += chain(ring, rim[0]);
        // the dish: the inside (its far wall lit by the window), the rim, the outside belly under it
        const bowl = `M${ex - rx} ${pan}Q${ex - rx * .7} ${pan + 7.2} ${ex} ${pan + 7.4}Q${ex + rx * .7} ${pan + 7.2} ${ex + rx} ${pan}Z`;
        const gi = nid('pi', u);
        sc += `<defs>${linGrad(gi, 0, pan - ry, 0, pan + ry, [[0, '#fff0b0'], [.4, '#c8962e'], [1, '#6a4a10']])}</defs>`
          + `<ellipse cx="${ex}" cy="${pan}" rx="${rx}" ry="${ry}" fill="url(#${gi})" stroke="#4a3008" stroke-width=".35"/>`;
        // the load
        if (sd < 0) { // two kegs of powder, side by side, the Company's mark painted on each
          for (const [dx, sd2] of [[-5.6, 3], [5.8, 5]]) { const kx = ex + dx, ky = pan + 1.8, ks = .5;
            // pale staves and dark hoops read as a keg at this size; the Company's mark burnt into the belly
            sc += K.barrel(u, L, { x: kx, y: ky, s: ks, kind: 'water', seed: sd2, contact: false })
              + `<circle cx="${f(kx)}" cy="${f(ky - 7.4)}" r="2.5" fill="none" stroke="#3a1a0a" stroke-width=".6" opacity=".9"/><path d="M${f(kx)} ${f(ky - 9.7)}v4.6M${f(kx - 2.3)} ${f(ky - 7.4)}h4.6" stroke="#3a1a0a" stroke-width=".6" opacity=".9"/>`
              + `<path d="M${f(kx - 4.6)} ${f(ky - 14.4)}Q${f(kx)} ${f(ky - 16.2)} ${f(kx + 4.6)} ${f(ky - 14.4)}" stroke="#fff4d0" stroke-width=".5" fill="none" opacity=".8"/>`; }
        } else { // a heap of gold: leaning stacks and loose coins, heaped above the rim
          // a heap of gold: columns of coins standing in the pan, their tops above the rim, a few leaning on them
          const coin = (cx, cy) => `<path d="M${f(cx - 2.7)} ${f(cy)}v.8a2.7 .95 0 0 0 5.4 0v-.8z" fill="url(#brass${u})" stroke="#5a3e08" stroke-width=".22"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="2.7" ry=".95" fill="#f2cc5a" stroke="#5a3e08" stroke-width=".22"/><path d="M${f(cx - 1.6)} ${f(cy - .3)}q1.6 -.5 3.2 0" stroke="#fff4c0" stroke-width=".3" fill="none"/>`;
          for (const [dx, dy, n] of [[-7, -.4, 5], [-1.6, -1.2, 8], [4, -.6, 6], [8.6, .4, 3], [-4.4, 1.6, 3], [1.6, 1.8, 4]]) for (let i = 0; i < n; i++) sc += coin(ex + dx + (i % 2 ? .15 : -.1), pan + dy - i * .82);
          sc += coin(ex + 6.6, pan - 3.6) + coin(ex - 9, pan - .8); }
        sc += `<path d="${bowl}" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".4"/>`
          + ln(`M${ex - rx + 1} ${pan + .6}Q${ex} ${pan + ry + 1.4} ${ex + rx - 1} ${pan + .6}`, .5, '#fff4c0', .8)
          +  `<path d="M${ex - 2.6} ${pan + 7.2}h5.2l-.8 1.4h-3.6z" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".3"/>`;
        sc += chain(ring, rim[1]) + chain(ring, rim[2]); } }
    // the sun on the brass and gold: rims towards the window
    sc += `<path d="M${SC.x - 1.6} ${SC.y - 9}V${SC.top + 8}" stroke="#fff8d8" stroke-width=".5" opacity=".75"/>`;
    fg += sc;
    // the coins and the purse at the left front; the key of the strongbox
    fg += K.coins(u, L, { x: 30, y: 128, s: 1.25, n: 8, seed: 21 }) + K.coins(u, L, { x: 52, y: 134, s: 1.25, n: 6, seed: 22 }) + K.coins(u, L, { x: 18, y: 112, s: 1.1, n: 5, seed: 23 });
    { const rp = L.ramp('leather', 60, 110); fg += K.contactShadow(u, 62, 116, 16, L, { ry: 1.6, opacity: .5 })
        + `<g transform="translate(62 116)"><path d="M-8 0q-3 -9 3 -12l-1.6 -3.4h9.6l-1.6 3.4q7 3 3.4 12q-6 2.4 -12.8 0z" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".45"/><path d="M5 -1q2 -7 -2 -10" stroke="${rp.lit}" stroke-width="1.2" fill="none" opacity=".55"/><path d="M-4.6 -12q4.4 1.6 9.2 0" stroke="#c9a048" stroke-width=".9" fill="none"/><path d="M-1 -12l-2 4M1.4 -12l2.2 4.4" stroke="#c9a048" stroke-width=".5"/></g>`; }
    { const kx = 112, ky = 130; fg += `<g transform="translate(${kx} ${ky}) rotate(-14)"><ellipse cx="1" cy="1.2" rx="12" ry="2" fill="#0a1a10" opacity=".35"/>`
        + `<circle r="3.2" fill="none" stroke="#1a1a1e" stroke-width="1.7"/><circle r="3.2" fill="none" stroke="#7a7a80" stroke-width=".9"/><path d="M3.2 0H14" stroke="#1a1a1e" stroke-width="1.6"/><path d="M3.2 -.3H14" stroke="#8a8a90" stroke-width=".7"/>`
        + `<path d="M11 0v3h1.4v-2h1v2.6h1.2V0" fill="#5a5a60" stroke="#1a1a1e" stroke-width=".35"/></g>`; }
    // the ledger open at the right: columns of figures (strokes), the ruled red lines, the ribbon; the quill's inkwell
    { const Q = [[136, 104], [184, 103], [194, 124], [128, 126]], at = (a, b) => [lerp(lerp(Q[0][0], Q[1][0], a), lerp(Q[3][0], Q[2][0], a), b), lerp(lerp(Q[0][1], Q[1][1], a), lerp(Q[3][1], Q[2][1], a), b)];
      fg += poly(Q.map(p => [p[0] + 2, p[1] + 2.2]), '#0a1a10', ' opacity=".4"') + poly([[Q[0][0] - 1, Q[0][1] - .6], [Q[1][0] + 1, Q[1][1] - .6], [Q[2][0] + 1.4, Q[2][1] + 1], [Q[3][0] - 1.4, Q[3][1] + 1]], '#5a1a10', ' stroke="#2a0804" stroke-width=".4"')
        + poly([Q[0], at(.5, -.02), at(.5, 1.02), Q[3]], '#eee2c4', ' stroke="#8a7a58" stroke-width=".3"') + poly([at(.5, -.02), Q[1], Q[2], at(.5, 1.02)], '#f6ecd2', ' stroke="#8a7a58" stroke-width=".3"');
      for (const a0 of [.06, .56]) { for (const c of [.0, .3]) fg += ln(`M${P2(at(a0 + c, .08))}L${P2(at(a0 + c, .94))}`, .25, '#b03a2a', .6);
        for (let k = 0; k < 8; k++) { const b = .14 + k * .1, l = .16 + R() * .14; fg += ln(`M${P2(at(a0 + .02, b))}L${P2(at(a0 + .02 + l, b))}`, .45, '#3a2a1a', .8) + ln(`M${P2(at(a0 + .32, b))}L${P2(at(a0 + .32 + .08 + R() * .06, b))}`, .5, '#2a1a10', .85); } }
      fg += ln(`M${P2(at(.88, .86))}L${P2(at(.98, .86))}`, .5, '#2a1a10', .9) + ln(`M${P2(at(.86, .9))}L${P2(at(.98, .9))}`, .35, '#2a1a10', .9);
      fg += `<path d="M${P2(at(.52, 1))}q.6 5 -1.4 9l1.4 -.4l.8 1.4" stroke="#b02a1a" stroke-width=".9" fill="none"/>`; }
    fg += K.castShadow(u, L, { x: 184, y: 100, w: 10, h: 10, horizon: VY, d: .9 }) + inkwell(u, L, 184, 100, 1.2);
    // the sun's shafts through the dusty air from the window down onto the desk; motes in them
    fg += shafts(u, 70, -30, [[60, 120, 92, 124], [104, 118, 132, 112], [24, 104, 44, 112]], '#fff4d0', .2) + motes(26, 50, 60, 90, 50, '#fff4d8', 9);
    // the room darkens to the sides and down under the glass
    fg += gloom(u, 100, 70, 0, 90, .3, '#0a0604') + gloom(u, 100, 70, 200, 90, .3, '#0a0604') + gloom(u, 100, 128, 100, 280, .5, '#040806');
    return [bg + tb, fg];
  } };
