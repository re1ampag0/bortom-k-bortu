// «Выгодная сделка» (Индевор, ПРИКАЗ: возьмите 3 карты), refined from the first-round scene (portrait-endeavour.cjs
// SCENES['Выгодная сделка']): night in the stern cabin, the candle on the table. A long contract lies across the table
// — its head still rolled at the far end, lines and lines of a fair hand, two more sheets of it fanned out under it.
// At the foot of the text a hand signs: the quill writes a dark red flourish, a drop of blood on its nib and a second
// one fallen on the sheet; across from it a hand in a black sleeve with a white cuff — the Company's man — taps the
// line with one finger: «здесь». The penknife that drew the blood lies by the inkwell, its tip red. Brief's find:
// the red signature (кабала: «Подпишите здесь… кровью»).
// Fixed against the first round: the three sheets were stickers on a flat wall of planks — now a cabin in 2.5D (the
// stern windows in the back wall, side panels and ceiling beams, the table top's planks to one vanishing point, the
// sheets in its perspective); the quill stood alone in a pot — now a hand holds it and writes (people.cjs hand3, the
// writing pinch), the forearm bare to the rolled shirt sleeve; the mystery box with three knobs and the blue squiggle
// are gone — the penknife, the stick of sealing wax and the price (a few gold coins) say the same plainly. Light: the
// candle on the left (key, warm), the moon through the stern windows (cool, weak: rims on the hands and the paper's edge).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, woodTex } = PK;

const VX = 100, VY = 40;                       // the vanishing point (eye level)
const BW = [18, 182], WT = 10, WB = 48, TF = 74;  // the back wall's sides; the windows' top and sill; the table's far edge
const CAN = { x: 28, y: 100, s: 2, len: 13 };
const flameY = CAN.y - (3.4 + CAN.len + 3) * CAN.s;
const light = { time: 'night', haze: .25, key: { type: 'point', x: CAN.x, y: flameY, h: .5, gy: CAN.y, color: '#ffb860', power: 1, radius: 140 },
  fill: { color: '#2e3c5a', power: .38 }, rim: { az: 0, color: '#a8c0e8', power: .3 } };
// the contract's four corners on the table (far-left, far-right, near-right, near-left)
const SH = [[62, 82], [140, 81], [156, 146], [44, 148]];
const SIGN = { a0: .5, a1: .86, b: .58 };      // the signature line: across (a) and down (b) on the sheet
const SKIN = { lit: '#eec29a', half: '#bc8460', core: '#9a6646', shadow: '#5e3624', outline: '#26120a' };
const PALE = { lit: '#f8e0ca', half: '#d6ac8e', core: '#ba8e70', shadow: '#7a5242', outline: '#2e1a10' };
const skel = { horizon: VY, eye: 1.3, light: 'candle on the table left (key) + moon through the stern windows (cool fill, rims)', items: [
  ['stern windows', BW[0], WB, BW[1] - BW[0], WB - WT, 'back wall'], ['stern bench', BW[0], TF, BW[1] - BW[0], TF - WB, 'floor (hidden by the table)'],
  ['table top', -10, 280, 220, 280 - TF, 'its far edge y 74'], ['contract', 44, 148, 112, 67, 'table top (two sheets under it)'], ['roll', 60, 84, 82, 7, 'contract head'],
  ['signing hand', 112, 132, 90, 40, 'quill on the signature line; forearm to the right edge'], ['pointing hand', -4, 134, 100, 26, 'index tip on the line; sleeve to the left edge'],
  ['candle', 20, 100, 16, 44, 'table top'], ['inkwell + penknife', 160, 102, 30, 12, 'table top'], ['coins', 172, 120, 20, 8, 'table top'], ['sealing wax', 18, 122, 20, 6, 'table top']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SP = (a, b, Q = SH) => { const t = [lerp(Q[0][0], Q[1][0], a), lerp(Q[0][1], Q[1][1], a)], d = [lerp(Q[3][0], Q[2][0], a), lerp(Q[3][1], Q[2][1], a)]; return [lerp(t[0], d[0], b), lerp(t[1], d[1], b)]; };
const toVP = (p, y) => [VX + (p[0] - VX) * (y - VY) / (p[1] - VY), y];

module.exports = { name: 'Выгодная сделка', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VY, eye: 1.3 });
    const Lo = K.makeLight({ time: 'night', haze: .3, key: { type: 'moon', x: 134, y: 18, color: '#e8eeff', power: .8 } }, { horizon: 36 });
    const R = rng(41);
    const ln = (d, w = .5, c = '#1a1008', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    const poly = (pts, fill, extra = '') => `<path d="M${pts.map(P2).join('L')}Z" fill="${fill}"${extra}/>`;

    // ——— the cabin: the ceiling's beams, the side panels, the stern windows with the night sea, the bench ———
    let bg = `<rect width="200" height="280" fill="#140c06"/>`;
    { // the ceiling: planks running back to the wall, two beams across
      bg += poly([[-2, -2], [202, -2], [BW[1], WT - 2], [BW[0], WT - 2]], '#1e1208');
      for (let i = 0; i < 12; i++) { const x = -40 + i * 26, a = toVP([x, -60], WT - 2); bg += ln(`M${f(x * .9 + 10)} -2L${P2(a)}`, .4, '#0a0603', .7); }
      bg += `<rect x="-2" y="2" width="204" height="3.2" fill="#3a2410"/><path d="M-2 5.2H202" stroke="#0a0603" stroke-width=".7"/><path d="M-2 2H202" stroke="#7a5028" stroke-width=".35" opacity=".5"/>`;
      bg += `<rect x="${BW[0]}" y="${WT - 2.4}" width="${BW[1] - BW[0]}" height="2.4" fill="#2e1c0c"/>`; }
    for (const [sx, ex] of [[BW[0], -2], [BW[1], 202]]) {
      const at = yb => { const t = (ex - VX) / (sx - VX); return [ex, VY + (yb - VY) * t]; };
      const top = at(WT - 2), bot = at(TF + 10);
      bg += poly([[sx, WT - 2], top, bot, [sx, TF + 10]], sx < VX ? '#3a2412' : '#24160a');
      // raised panels on the side wall, in its perspective
      for (const [y0, y1] of [[14, 40], [46, 70]]) { const a = at(y0), b = at(y1), m0 = [lerp(sx, ex, .25), lerp(y0, a[1], .25)], m1 = [lerp(sx, ex, .8), lerp(y0, a[1], .8)], n1 = [lerp(sx, ex, .8), lerp(y1, b[1], .8)], n0 = [lerp(sx, ex, .25), lerp(y1, b[1], .25)];
        bg += poly([m0, m1, n1, n0], sx < VX ? '#4a2e16' : '#2c1a0c', ` stroke="${sx < VX ? '#6a4420' : '#3a2410'}" stroke-width=".5"`); }
      bg += ln(`M${sx} ${WT - 2}V${TF}`, .8, '#0a0603', .9); }
    // the back wall round the windows, the windows themselves: five lights, small panes in lead, the night outside
    { const g = nid('bw', u); bg += `<defs>${linGrad(g, 0, WT, 0, TF, [[0, '#2a1a0c'], [1, '#3a2412']])}</defs><rect x="${BW[0]}" y="${WT}" width="${BW[1] - BW[0]}" height="${TF - WT}" fill="url(#${g})"/>`;
      const n = 5, gap = 4, w = (BW[1] - BW[0] - 6 - gap * (n - 1)) / n;
      const cid = nid('wc', u);
      let clip = ''; for (let i = 0; i < n; i++) { const x = BW[0] + 3 + i * (w + gap); clip += `<rect x="${f(x)}" y="${WT + 2}" width="${f(w)}" height="${WB - WT - 4}" rx="1.4"/>`; }
      bg += `<defs><clipPath id="${cid}">${clip}</clipPath></defs><g clip-path="url(#${cid})">`
        + K.sky(u, Lo, { horizon: 36, stars: 40, top: WT }) + K.sunMoon(u, Lo, { r: 4.2 }) + K.cloud(u, Lo, { x: 70, y: 26, w: 30, h: 4, seed: 5, far: .5 })
        + K.water(u, Lo, { horizon: 36, bottom: WB + 2, swell: .4, seed: 6, glitter: 134 }) + `</g>`;
      for (let i = 0; i < n; i++) { const x = BW[0] + 3 + i * (w + gap);
        for (let k = 1; k < 5; k++) bg += ln(`M${f(x + k * w / 5)} ${WT + 2}V${WB - 2}`, .25, '#140c06', .7);
        for (let k = 1; k < 6; k++) bg += ln(`M${f(x)} ${f(WT + 2 + k * (WB - WT - 4) / 6)}H${f(x + w)}`, .25, '#140c06', .7);
        bg += `<rect x="${f(x)}" y="${WT + 2}" width="${f(w)}" height="${WB - WT - 4}" rx="1.4" fill="none" stroke="#4a2e14" stroke-width="1.2"/>`
          + ln(`M${f(x + .6)} ${WB - 2.6}H${f(x + w - .6)}`, .4, '#a8bce0', .35); }
      // the sill and the bench under the windows: a locker front of panels, a cushion along it
      bg += `<rect x="${BW[0]}" y="${WB}" width="${BW[1] - BW[0]}" height="3" fill="#5a3818"/><path d="M${BW[0]} ${WB}H${BW[1]}" stroke="#a8bce0" stroke-width=".4" opacity=".4"/>`
        + `<path d="M${BW[0]} ${WB + 8}Q100 ${WB + 6} ${BW[1]} ${WB + 8}V${WB + 14}H${BW[0]}Z" fill="#5a1a14"/><path d="M${BW[0]} ${WB + 8}Q100 ${WB + 6} ${BW[1]} ${WB + 8}" stroke="#a84a3a" stroke-width=".6" opacity=".7"/>`
        + [40, 70, 100, 130, 160].map(x => `<path d="M${x} ${WB + 7.4}v6.4" stroke="#2a0806" stroke-width=".5"/>`).join('')
        + K.localGlow(u, { x: 134, y: 26, color: '#a8c0f0', power: .25, radius: 40 }, { core: false }); }

    // ——— the table: dark oak planks to the vanishing point, its far edge moulded ———
    let tb = '';
    { const cid = nid('tc', u);
      tb += `<defs><clipPath id="${cid}"><rect x="-2" y="${TF}" width="204" height="210"/></clipPath></defs><g clip-path="url(#${cid})">${K.deck(u, L, { horizon: VY, top: TF, bottom: 290, vx: VX, kind: 'oak', plank: 26, seed: 7 })}</g>`
        + `<rect x="-2" y="${TF - 2.4}" width="204" height="3" fill="#3a2410"/><path d="M-2 ${TF - 2.4}H202" stroke="#c08a52" stroke-width=".5" opacity=".7"/><path d="M-2 ${TF + .6}H202" stroke="#0a0603" stroke-width=".8"/>`
        + K.localGlow(u, { x: 46, y: 104, color: '#ffb050', power: .55, radius: 80 }, { squash: .4, core: false }); }

    // ——— the things on the table, far to near ———
    let fg = '';
    // the price: a few gold coins at the far right
    fg += K.coins(u, L, { x: 168, y: 96, s: 1.05, n: 6, seed: 9 });
    // the inkwell (black ink, not used) and the penknife with its red tip lying before it
    { const x = 178, y = 112;
      fg += K.contactShadow(u, x, y, 12, L, { ry: 1.4, opacity: .55 }) + K.shadeCyl(u, x, y, x, y - 6, 4.6, L, 'glass', { r1: 4.8, r2: 3.6, ell: .3, face: 2, outline: .4 })
        + `<path d="M${x - 4.2} ${y - 2}q4.2 1.4 8.4 0v1.6q-4.2 1.6 -8.4 0z" fill="#06080e" opacity=".9"/>` + K.shadeCyl(u, x, y - 6, x, y - 7.8, 2, L, 'brass', { ell: .3, face: 2, outline: .3 }); }
    { const a = [150, 116], b = [166, 110.4], c = [172.4, 108.2];   // handle a→b, blade b→c
      fg += ln(`M${f(a[0] + 1.4)} ${f(a[1] + 1.8)}L${f(c[0] + 1.4)} ${f(c[1] + 1.8)}`, 2.2, '#0a0603', .45)
        + K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.3, L, 'bone', { r1: 1.2, r2: 1.4, outline: .3, cap: 'round' })
        + `<path d="M${P2(b)}L${f(c[0])} ${f(c[1] - .4)}L${f(c[0] - .4)} ${f(c[1] + .9)}L${f(b[0])} ${f(b[1] + 1.2)}Z" fill="#c8ccd0" stroke="#3a3e44" stroke-width=".3"/>`
        + `<path d="M${f(c[0] - 2.4)} ${f(c[1] + .2)}L${f(c[0])} ${f(c[1] - .4)}L${f(c[0] - .4)} ${f(c[1] + .9)}L${f(c[0] - 2.6)} ${f(c[1] + 1.4)}Z" fill="#8a0a08"/>`
        + `<ellipse cx="${f(c[0] + 1.2)}" cy="${f(c[1] + 1.6)}" rx=".8" ry=".4" fill="#7a0806"/>`; }
    // the two sheets under the contract, fanned out from under it
    const sheet = (Q, tone, n) => { const g = nid('sh', u); let o = poly(Q.map(p => [p[0] + 2, p[1] + 2]), '#0a0603', ' opacity=".45"')
        + `<defs>${linGrad(g, Q[3][0], 0, Q[2][0], 0, [[0, mix(tone, '#ffe8c0', .25)], [1, mix(tone, '#7a6040', .25)]])}</defs>` + poly(Q, `url(#${g})`, ' stroke="#7a6a48" stroke-width=".35"');
      for (let k = 0; k < n; k++) { const b = .1 + k * .07; o += ln(`M${P2(SP(.1, b, Q))}L${P2(SP(.86 - (k % 3) * .05, b, Q))}`, .4, '#5a4a32', .6); } return o; };
    fg += sheet([[40, 90], [104, 84], [96, 146], [22, 150]], '#e2d6b6', 10) + sheet([[110, 86], [170, 92], [178, 150], [104, 142]], '#e8dcbe', 10);
    // the contract: its shadow, the sheet lit warm towards the candle, the head rolled at the far end
    { const g = nid('cg', u), sid = nid('cs', u);
      fg += `<defs><filter id="${sid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>${linGrad(g, SH[3][0], 0, SH[2][0], 0, [[0, '#fbf1d8'], [.5, '#f0e2c0'], [1, '#d6c49c']])}</defs>`
        + poly(SH.map(p => [p[0] + 2.4, p[1] + 2]), '#0a0603', ` opacity=".55" filter="url(#${sid})"`) + poly(SH, `url(#${g})`, ' stroke="#8a7a58" stroke-width=".4"');
      // the roll at the head: a paper cylinder along the far edge, its spiral end on the left
      const r0 = [SH[0][0] - 1, SH[0][1] - 1.6], r1 = [SH[1][0] + 1, SH[1][1] - 1.6];
      fg += K.shadeCyl(u, r0[0], r0[1], r1[0], r1[1], 3.2, L, 'linen', { ell: .9, face: 1, outline: .35 })
        + `<path d="M${f(r0[0] - .8)} ${f(r0[1])}a1.6 1.8 0 1 1 1.6 1.8a.9 1 0 1 1 -.6 -1" stroke="#8a7a58" stroke-width=".3" fill="none"/>`;
      // the head of the text: a broad flourish, then line after line of a fair hand; the margin ruled
      fg += ln(`M${P2(SP(.18, .07))}Q${P2(SP(.5, .02))} ${P2(SP(.82, .07))}`, 1.3, '#2a1a0c', .85);
      for (let k = 0; k < 10; k++) { const b = .13 + k * .04, a0 = .08 + (k % 5 === 0 ? .05 : 0), a1 = k === 9 ? .56 : .92 - (k % 3) * .03;
        let d = ''; for (let i = 0; i <= 14; i++) { const a = lerp(a0, a1, i / 14), p = SP(a, b + Math.sin(i * 1.7 + k) * .003); d += (i ? 'L' : 'M') + P2(p); }
        fg += `<path d="${d}" stroke="#3a2a18" stroke-width="${f(.4 + b * .25)}" fill="none" stroke-dasharray="${f(2 + R() * 2)} ${f(.6 + R() * .5)}" opacity=".85"/>`; }
      // the small print under the signatures, a dense grey band
      for (let k = 0; k < 6; k++) { const b = .7 + k * .03; fg += `<path d="M${P2(SP(.08, b))}L${P2(SP(.92, b))}" stroke="#6a5a44" stroke-width=".36" stroke-dasharray=".7 .3" opacity=".75"/>`; }
      // the Company's side already signed in black at the left, its red seal on a ribbon below
      fg += ln(`M${P2(SP(.1, SIGN.b))}L${P2(SP(.42, SIGN.b))}`, .35, '#3a2a18', .8)
        + ln(`M${P2(SP(.12, SIGN.b - .02))}q2 -4 4 -1t4 -1q2 -2 5 0`, .6, '#140c06', .9);
      { const c = SP(.24, SIGN.b + .08), rx = 4.6, ry = 3.2, gw = nid('wx', u);
        fg += `<defs>${radGrad(gw, c[0] - 1.6, c[1] - 1, rx * 1.2, [[0, '#d84a3a'], [.5, '#a81c16'], [1, '#5a0a06']])}</defs>`
          + `<path d="M${f(c[0] - 1)} ${f(c[1])}l-2 7l1.6 -.6l1 1.4l1.6 -7.4zM${f(c[0] + 1)} ${f(c[1])}l2.6 6.6l-1.6 -.2l-.6 1.6l-2.2 -7.4z" fill="#b8302a" stroke="#4a0806" stroke-width=".25"/>`
          + `<ellipse cx="${f(c[0] + .6)}" cy="${f(c[1] + .9)}" rx="${rx + .4}" ry="${ry + .3}" fill="#2a0604" opacity=".5"/><ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${rx}" ry="${ry}" fill="url(#${gw})"/>`
          + `<path d="M${f(c[0])} ${f(c[1] - 1.6)}v3.2M${f(c[0] - 2)} ${f(c[1])}h4" stroke="#e86a54" stroke-width=".6"/><path d="M${f(c[0] - 3)} ${f(c[1] - 1)}q1.6 -1.8 4 -1.8" stroke="#ffc0b0" stroke-width=".5" fill="none" opacity=".7"/>`; }
      // the signature line on the right, and on it the red flourish, wet; a drop fallen beside it
      fg += ln(`M${P2(SP(SIGN.a0, SIGN.b))}L${P2(SP(SIGN.a1, SIGN.b))}`, .35, '#3a2a18', .8); }
    // the red signature: a looping hand along the line, ending at the nib
    // a cursive hand: a tall capital loop, then a run of small loops (a prolate trochoid) along the line
    const sigP = [SP(.515, SIGN.b), SP(.53, SIGN.b - .1), SP(.548, SIGN.b - .115), SP(.552, SIGN.b - .06), SP(.54, SIGN.b - .005), SP(.555, SIGN.b - .02)];
    { const n = 5, a0 = .565, a1 = .78, T = n * 2 * Math.PI;
      for (let i = 1; i <= 60; i++) { const t = i / 60 * T, a = a0 + (a1 - a0) * t / T - .011 * Math.sin(t), h = (i % 24 < 12 ? .055 : .04) * (1 - Math.cos(t)) / 2; sigP.push(SP(a, SIGN.b - .008 - h)); } }
    const nib = sigP[sigP.length - 1];
    fg += `<path d="${H.sp(sigP)}" stroke="#4a0604" stroke-width="1.05" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(.25 .3)"/>`
      + `<path d="${H.sp(sigP)}" stroke="#a8100c" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${H.sp(sigP.slice(-4))}" stroke="#d8302a" stroke-width=".35" fill="none" opacity=".8"/>`;
    { const d = SP(.62, SIGN.b + .05); fg += `<ellipse cx="${f(d[0])}" cy="${f(d[1])}" rx="1.1" ry=".7" fill="#8a0806"/><ellipse cx="${f(d[0] - .3)}" cy="${f(d[1] - .2)}" rx=".35" ry=".2" fill="#ff8a7a" opacity=".8"/>`; }
    // the stick of sealing wax and the candle at the left
    { const a = [12, 124], b = [32, 120], m = K.mat('paint-red', L, { form: 'cyl', x1: a[0], y1: a[1], x2: b[0], y2: b[1], r: 1.6, u });
      fg += ln(`M${f(a[0] + 1.4)} ${f(a[1] + 2)}L${f(b[0] + 1.4)} ${f(b[1] + 2)}`, 2.4, '#0a0603', .45) + m.defs + `<path d="M${P2(a)}L${P2(b)}" stroke="${m.fill}" stroke-width="3.2" stroke-linecap="round"/>`
        + `<ellipse cx="${f(b[0] + .2)}" cy="${f(b[1])}" rx="1.2" ry="1.7" transform="rotate(-10 ${P2(b)})" fill="#2a0604"/>`; }
    fg += K.castShadow(u, L, { x: CAN.x, y: CAN.y, w: 8 * CAN.s, h: 2, horizon: VY, d: .9 }) + K.candle(u, L, { ...CAN, seed: 6 });

    // ——— the pointing hand from the left: the Company's man, black sleeve, white cuff and frill; the index on the line
    const tip = SP(SIGN.a0 + .01, SIGN.b - .015);
    { const po = { a: 14, s: 2.05, m: 1, roll: 25, pitch: 10, pose: 'point', tone: PALE, light: [-.7, -.7], sw: .32, palmW: .82, wristW: .72 };
      const h0 = H.hand3(u, { ...po, at: [0, 0] }), t0 = h0.P(9.1, -1.45, -.42), at = [tip[0] - t0[0], tip[1] - t0[1]];
      const hd = H.hand3(u, { ...po, at }), w = hd.wrist, ua = [Math.cos(po.a * Math.PI / 180), Math.sin(po.a * Math.PI / 180)];
      const sleeve = { lit: '#4a4c58', half: '#202228', core: '#18191e', shadow: '#08080a', outline: '#040405' }, cuff = { lit: '#fffaf0', half: '#e6dece', shadow: '#a69e8e', outline: '#5a5448' };
      fg += K.contactShadow(u, tip[0] - 6, tip[1] + 2, 18, L, { ry: 1.6, opacity: .35 });
      fg += H.cloth(u, { spine: [[-14, w[1] + 18], [lerp(-14, w[0], .5), lerp(w[1] + 18, w[1], .5) + 1], [w[0] - ua[0] * 1.4, w[1] - ua[1] * 1.4]], w: [12, 9.6, 6.8], tone: sleeve, lit: -1, rim: '#ffcf96', rimSide: -1,
        cuff: { from: .93, k: 1.06, tone: cuff }, seed: 6, drapes: 3, sw: .4 });
      // the lace of the shirt falling from the cuff round the wrist: a ruffle of small scallops
      { const nv = [-ua[1], ua[0]], c0 = [w[0] - ua[0] * .6, w[1] - ua[1] * .6], pts = [];
        for (let i = 0; i <= 8; i++) { const t = -1 + i / 4, o2 = i % 2 ? 2.2 : .8; pts.push([c0[0] + nv[0] * t * 4.2 + ua[0] * o2, c0[1] + nv[1] * t * 4.2 + ua[1] * o2]); }
        fg += `<path d="M${P2([c0[0] + nv[0] * 4.2 - ua[0], c0[1] + nv[1] * 4.2 - ua[1]])}L${pts.slice().reverse().map(P2).join('L')}L${P2([c0[0] - nv[0] * 4.2 - ua[0], c0[1] - nv[1] * 4.2 - ua[1]])}Z" fill="#efe8d8" stroke="#7a7466" stroke-width=".3"/>`
          + [-2, 0, 2].map(t => ln(`M${P2([c0[0] + nv[0] * t * 1.6, c0[1] + nv[1] * t * 1.6])}l${f(ua[0] * 1.4)} ${f(ua[1] * 1.4)}`, .25, '#9a9282', .8)).join(''); }
      fg += hd.back + hd.front; }

    // ——— the signing hand from the right: a weathered hand in the writing pinch, the quill's nib at the end of the red
    // flourish; the quill runs between the thumb and the index: the index lies along the barrel (in front of it), the
    // thumb and the middle finger hold it from the other side (behind it, the thumb's tip showing past the barrel), the
    // barrel rests in the web and rises over the back of the hand; the forearm bare to the rolled shirt sleeve ———
    { const qa = -34 * Math.PI / 180, qd = [Math.cos(qa), Math.sin(qa)], nx = -qd[1], ny = qd[0];
      const qp = t => [nib[0] + qd[0] * t, nib[1] + qd[1] * t], pinch = qp(4.6);
      // a: the hand turned so the barrel (local: from the pinch 6, −1.9, −3.1 to the web 4, −1.5, 0) runs along the quill
      const so = { a: 197, s: 2.3, m: 1, roll: 45, pitch: 0, pose: 'pinch', tone: SKIN, light: [-.8, -.55], sw: .32, palmW: .82, wristW: .72,
        flex: [[45, 35, 5], [55, 45, 25], [62, 72, 44], [66, 78, 46]], backFingers: [1, 2, 3, 'thumb'],
        thumbJ: [[1.25, -1.19, -.78], [3.0, -2.6, -1.5], [4.6, -2.7, -2.2], [5.5, -2.5, -3.0]] };
      const h0 = H.hand3(u, { ...so, at: [0, 0] }), p0 = h0.P(6, -1.9, -3.1), at0 = [pinch[0] - p0[0], pinch[1] - p0[1]];
      const hd = H.hand3(u, { ...so, at: at0 }), wr = hd.wrist;
      const shirt = { lit: '#b0a284', half: '#6e6250', shadow: '#2a2218', outline: '#140e08' };   // the shirt, in the table's shadow
      const fa = 45 * Math.PI / 180, el = [wr[0] + Math.cos(fa) * 31, wr[1] + Math.sin(fa) * 31];   // the forearm: on from the wrist, down to the near edge
      let arm = H.cloth(u, { spine: [[el[0] + 30, el[1] + 30], [el[0] + 12, el[1] + 10], [el[0] + 2, el[1] + 1.6]], w: [20, 18.6, 17.4], tone: shirt, lit: -1, rim: '#a8c0e8', rimSide: 1, rimOp: .4, cuff: { from: .66, k: 1.14, roll: true }, seed: 9, drapes: 2, sw: .4 });
      arm = H.cloth(u, { spine: [[el[0] + 2, el[1] + .6], [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5) - 1], [wr[0] + 1, wr[1] + .4]], w: [11.6, 10.4, 7.6], tone: SKIN, lit: -1, rim: '#a8c0e8', rimSide: 1, rimOp: .45, folds: false, capA: true, sw: .35 })
        + Array.from({ length: 12 }, (_, k) => { const t = .2 + R() * .6, p = [lerp(el[0], wr[0], t), lerp(el[1], wr[1], t) - 2 + R() * 4]; return ln(`M${P2(p)}l${f(-1 - R())} ${f(-.6 + R() * .3)}`, .22, '#4a2a18', .5); }).join('') + arm;
      // the quill: the nib on the paper (wet red); the barrel's lower part goes under the index (between it and the
      // thumb), from the web up it lies over the back of the hand with the feather, up right
      const top = qp(40), bar = t0 => ln(`M${P2(qp(t0))}L${P2(top)}`, 1.15, '#5a5040') + ln(`M${P2(qp(t0))}L${P2(top)}`, .72, '#ece2c8');
      const qLow = bar(0) + ln(`M${P2(nib)}L${P2(qp(2.2))}`, .95, '#8a0a08');
      let qs = bar(8);
      { const b0 = qp(14), b1 = qp(39.4), m0 = qp(26), w = 3.4;
        qs += `<path d="M${P2(b0)}Q${f(m0[0] + nx * w * 1.2)} ${f(m0[1] + ny * w * 1.2)} ${P2(b1)}Q${f(m0[0] - nx * w * .55)} ${f(m0[1] - ny * w * .55)} ${P2(b0)}Z" fill="#f4eee0" stroke="#a8a090" stroke-width=".3"/>`
          + Array.from({ length: 9 }, (_, k) => { const p = qp(15.6 + k * 2.6), l = 3 - Math.abs(k - 4) * .35; return `<path d="M${P2(p)}l${f(nx * l + qd[0] * 1.4)} ${f(ny * l + qd[1] * 1.4)}" stroke="#c8c0b0" stroke-width=".22"/>`; }).join('')
          + ln(`M${P2(qp(16))}L${P2(qp(38))}`, .3, '#fffaf0', .7); }
      // the drop of blood hanging at the nib
      qs += `<path d="M${f(nib[0] + .4)} ${f(nib[1] - .2)}q.9 1.4 .2 2.2q-.9 .4 -1 -.5q0 -.8 .8 -1.7z" fill="#b0140e" stroke="#4a0604" stroke-width=".15"/><circle cx="${f(nib[0] + .1)}" cy="${f(nib[1] + 1.3)}" r=".22" fill="#ffb0a0"/>`;
      fg += arm + hd.back + qLow + hd.front + qs; }

    // ——— the light: the candle's glow, the dark round it and down under the glass ———
    // the signer's arm goes down into the dark under the glass: it fades there, so the glass stays even
    { const g = nid('ad', u); fg += `<defs>${radGrad(g, 190, 168, 46, [[0, '#050302', .8], [.55, '#050302', .55], [1, '#050302', 0]])}</defs><rect x="120" y="128" width="90" height="90" fill="url(#${g})" style="mix-blend-mode:multiply"/>`; }
    fg += K.localGlow(u, { x: CAN.x, y: flameY, color: '#ffc070', power: .95, radius: 38 })
      + gloom(u, 60, 100, 200, 40, .35, '#050302') + gloom(u, 100, 132, 100, 280, .5, '#050302');
    return [bg + tb, fg];
  } };
