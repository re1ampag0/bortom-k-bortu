// «Выгодная сделка» — variant 'int' (the kit-interior trial): the same shot as vygodnaya-sdelka.cjs — the long
// contract on the table, the hand signing it in blood, the Company's man's finger on the line («здесь»), the penknife
// with the red tip, the wax, the gold — but the cabin behind is the kit room (K.interior 'cabin', night): the stern
// windows with the moon, the locker bench, the shelves, panelled sides and beams, all to one vanishing point; the table,
// the contract and the sheets under it are laid in the room's space (interior.geom: real rectangles in perspective).
// One light: the cabin's lantern hanging between the table and the windows (the scheme's key); the moon in the stern
// windows a weak cool fill. The candle of the base scene is gone, the lantern takes its place (decided without the user).
// In the set since 14.11 (the user chose the new interior); the earlier room is variant 'room' in vygodnaya-sdelka.cjs.
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;

const ROOM = { kind: 'cabin', mood: 'lamp', vp: [100, 40], f: 150, eye: 1.2, room: { d: 4.4 } };
const SCH = K.interior.scheme(ROOM.kind, ROOM), G = SCH.geom, LAMP = SCH.lamps.find(l => l.key);
const VX = G.vx, VY = G.vy, TY = .78;          // the vanishing point (eye level); the table top's height (m)
const TZ = [.3, 1.75], TX = [-1.3, 1.3];        // the table: its near and far edge (depth), its sides (m)
const TF = G.P(0, TY, TZ[1])[1];               // the table's far edge in the picture
const light = SCH.light;
// a sheet on the table: a rectangle (centre cx, cz; half width w, half depth d; turned a degrees) -> world corners
// [X, Z] far-left, far-right, near-right, near-left
const rectW = (cx, cz, w, d, a) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
  return [[-w, d], [w, d], [w, -d], [-w, -d]].map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c]); };
const PW = q => G.P(q[0], TY + .003, q[1]);
const CW = rectW(-.02, 1.0, .25, .42, -3);     // the contract
const SH = CW.map(PW);
const SIGN = { a0: .5, a1: .86, b: .62 };      // the signature line: across (a) and down (b) on the sheet
const SKIN = { lit: '#eec29a', half: '#bc8460', core: '#9a6646', shadow: '#5e3624', outline: '#26120a' };
const PALE = { lit: '#f8e0ca', half: '#d6ac8e', core: '#ba8e70', shadow: '#7a5242', outline: '#2e1a10' };
const HL = [-.4, -.92];                         // the lantern from the hands: up, a little left
const skel = { horizon: VY, eye: ROOM.eye, light: 'the cabin lantern hanging between the table and the stern windows (key) + the moon in the windows (cool fill)', items: [
  ['cabin (kit interior)', -2, TF, 204, TF + 2, 'floor; back wall at 4.4 m'], ['lantern', LAMP.x - 8, LAMP.y + 6, 16, 26, 'beam (rope)'],
  ['table top', -10, 280, 220, 280 - TF, `its far edge y ${f(TF)}`], ['contract', SH[3][0], SH[3][1], SH[2][0] - SH[3][0], SH[3][1] - SH[0][1], 'table top (two sheets under it)'],
  ['signing hand', 112, 116, 90, 40, 'quill on the signature line; forearm to the right edge'], ['pointing hand', -4, 118, 100, 26, 'index tip on the line; sleeve to the left edge'],
  ['inkwell + penknife', 160, 102, 30, 12, 'table top'], ['coins', 172, 120, 20, 8, 'table top'], ['sealing wax', 10, 126, 24, 8, 'table top']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
// a point on a sheet: a across, b down from its far edge, interpolated on the table (true perspective)
const SP = (a, b, Q = CW) => { const t = [lerp(Q[0][0], Q[1][0], a), lerp(Q[0][1], Q[1][1], a)], d = [lerp(Q[3][0], Q[2][0], a), lerp(Q[3][1], Q[2][1], a)]; return PW([lerp(t[0], d[0], b), lerp(t[1], d[1], b)]); };

module.exports = { name: 'Выгодная сделка', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, SCH.cam);
    const R = rng(41);
    const ln = (d, w = .5, c = '#1a1008', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    const poly = (pts, fill, extra = '') => `<path d="M${pts.map(P2).join('L')}Z" fill="${fill}"${extra}/>`;

    // ——— the cabin: the kit room, its own table, chart and chest left out (the scene's table stands there) ———
    let bg = K.interior(u, L, Object.assign({}, ROOM, { off: ['table', 'chart', 'chest'], gloom: false, seed: 11 }));

    // ——— the table: dark oak planks to the vanishing point, in the room's space; its far edge moulded ———
    let tb = '';
    { const cid = nid('tc', u), q = [[TX[0], TZ[1]], [TX[1], TZ[1]], [TX[1], TZ[0]], [TX[0], TZ[0]]].map(p => G.P(p[0], TY, p[1]));
      tb += K.contactShadow(u, VX, TF + 1, 230, L, { ry: 3, opacity: .5 })
        + `<defs><clipPath id="${cid}"><path d="M${q.map(P2).join('L')}Z"/></clipPath></defs><g clip-path="url(#${cid})">${K.deck(u, L, { horizon: VY, top: TF, bottom: 290, vx: VX, kind: 'oak', plank: .2 * G.upm(TZ[1]), seed: 7 })}</g>`
        + `<rect x="-2" y="${f(TF - 2)}" width="204" height="2.6" fill="#3a2410"/><path d="M-2 ${f(TF - 2)}H202" stroke="#c08a52" stroke-width=".5" opacity=".7"/><path d="M-2 ${f(TF + .6)}H202" stroke="#0a0603" stroke-width=".8"/>`
        // the lantern's pool on the table, toward its far edge under the lamp
        + K.localGlow(u, { x: LAMP.light.x, y: TF + 18, color: '#ffb050', power: .5, radius: 85 }, { squash: .4, core: false }); }

    // ——— the things on the table, far to near ———
    let fg = '';
    // the price: a few gold coins at the far right
    fg += K.coins(u, L, { x: 168, y: 96, s: 1.05, n: 6, seed: 9 });
    // the inkwell (black ink, not used)
    { const x = 178, y = 112;
      fg += K.contactShadow(u, x, y, 12, L, { ry: 1.4, opacity: .55 }) + K.shadeCyl(u, x, y, x, y - 6, 4.6, L, 'glass', { r1: 4.8, r2: 3.6, ell: .3, face: 2, outline: .4 })
        + `<path d="M${x - 4.2} ${y - 2}q4.2 1.4 8.4 0v1.6q-4.2 1.6 -8.4 0z" fill="#06080e" opacity=".9"/>` + K.shadeCyl(u, x, y - 6, x, y - 7.8, 2, L, 'brass', { ell: .3, face: 2, outline: .3 }); }
    // the two sheets under the contract, fanned out from under it (on the table, in its perspective)
    const sheet = (QW, tone, n) => { const Q = QW.map(PW), g = nid('sh', u); let o = poly(Q.map(p => [p[0] + .8, p[1] + 1.8]), '#0a0603', ' opacity=".45"')
        + `<defs>${linGrad(g, Q[0][0], Q[0][1], Q[2][0], Q[2][1], [[0, mix(tone, '#ffe8c0', .25)], [1, mix(tone, '#7a6040', .25)]])}</defs>` + poly(Q, `url(#${g})`, ' stroke="#7a6a48" stroke-width=".35"');
      for (let k = 0; k < n; k++) { const b = .1 + k * .07; o += ln(`M${P2(SP(.1, b, QW))}L${P2(SP(.86 - (k % 3) * .05, b, QW))}`, .4, '#5a4a32', .6); } return o; };
    fg += sheet(rectW(-.24, 1.08, .17, .27, 10), '#e2d6b6', 10) + sheet(rectW(.22, 1.04, .16, .27, -11), '#e8dcbe', 10);
    fg += sheet([[40, 90], [104, 84], [96, 146], [22, 150]], '#e2d6b6', 10) + sheet([[110, 86], [170, 92], [178, 150], [104, 142]], '#e8dcbe', 10);
    // the penknife lies on the right sheet, its red tip toward the inkwell
    { const a = [150, 116], b = [166, 110.4], c = [172.4, 108.2];   // handle a→b, blade b→c
      fg += ln(`M${f(a[0] + 1.4)} ${f(a[1] + 1.8)}L${f(c[0] + 1.4)} ${f(c[1] + 1.8)}`, 2.2, '#0a0603', .45)
        + K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.3, L, 'bone', { r1: 1.2, r2: 1.4, outline: .3, cap: 'round' })
        + `<path d="M${P2(b)}L${f(c[0])} ${f(c[1] - .4)}L${f(c[0] - .4)} ${f(c[1] + .9)}L${f(b[0])} ${f(b[1] + 1.2)}Z" fill="#c8ccd0" stroke="#3a3e44" stroke-width=".3"/>`
        + `<path d="M${f(c[0] - 2.4)} ${f(c[1] + .2)}L${f(c[0])} ${f(c[1] - .4)}L${f(c[0] - .4)} ${f(c[1] + .9)}L${f(c[0] - 2.6)} ${f(c[1] + 1.4)}Z" fill="#8a0a08"/>`
        + `<ellipse cx="${f(c[0] + 1.2)}" cy="${f(c[1] + 1.6)}" rx=".8" ry=".4" fill="#7a0806"/>`; }
    // the contract: its shadow, the sheet lit warm towards the lantern (far left), the head rolled at the far end
    { const g = nid('cg', u), sid = nid('cs', u);
      fg += `<defs><filter id="${sid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>${linGrad(g, SH[0][0], SH[0][1], SH[2][0], SH[2][1], [[0, '#fbf1d8'], [.5, '#f0e2c0'], [1, '#d6c49c']])}</defs>`
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
    // the stick of sealing wax at the left
    { const a = [12, 124], b = [32, 120], m = K.mat('paint-red', L, { form: 'cyl', x1: a[0], y1: a[1], x2: b[0], y2: b[1], r: 1.6, u });
      fg += ln(`M${f(a[0] + 1.4)} ${f(a[1] + 2)}L${f(b[0] + 1.4)} ${f(b[1] + 2)}`, 2.4, '#0a0603', .45) + m.defs + `<path d="M${P2(a)}L${P2(b)}" stroke="${m.fill}" stroke-width="3.2" stroke-linecap="round"/>`
        + `<ellipse cx="${f(b[0] + .2)}" cy="${f(b[1])}" rx="1.2" ry="1.7" transform="rotate(-10 ${P2(b)})" fill="#2a0604"/>`; }

    // ——— the pointing hand from the left: the Company's man, black sleeve, white cuff and frill; the index on the line
    const tip = SP(SIGN.a0 + .01, SIGN.b - .015);
    { const po = { a: 14, s: 2.5, m: 1, roll: 25, pitch: 10, pose: 'point', tone: PALE, light: HL, sw: .32, palmW: .82, wristW: .72 };
      const h0 = H.hand3(u, { ...po, at: [0, 0] }), t0 = h0.P(9.1, -1.45, -.42), at = [tip[0] - t0[0], tip[1] - t0[1]];
      const hd = H.hand3(u, { ...po, at }), w = hd.wrist, ua = [Math.cos(po.a * Math.PI / 180), Math.sin(po.a * Math.PI / 180)];
      const sleeve = { lit: '#4a4c58', half: '#202228', core: '#18191e', shadow: '#08080a', outline: '#040405' }, cuff = { lit: '#fffaf0', half: '#e6dece', shadow: '#a69e8e', outline: '#5a5448' };
      fg += K.contactShadow(u, tip[0] - 6, tip[1] + 2, 18, L, { ry: 1.6, opacity: .35 });
      fg += H.cloth(u, { spine: [[-14, w[1] + 22], [lerp(-14, w[0], .5), lerp(w[1] + 22, w[1], .5) + 1], [w[0] - ua[0] * 1.4, w[1] - ua[1] * 1.4]], w: [14.6, 11.7, 8.3], tone: sleeve, lit: -1, rim: '#ffcf96', rimSide: -1,
        cuff: { from: .93, k: 1.06, tone: cuff }, seed: 6, drapes: 3, sw: .4 });
      // the lace of the shirt falling from the cuff round the wrist: a ruffle of small scallops
      { const nv = [-ua[1], ua[0]], c0 = [w[0] - ua[0] * .6, w[1] - ua[1] * .6], pts = [];
        for (let i = 0; i <= 8; i++) { const t = -1 + i / 4, o2 = i % 2 ? 2.2 : .8; pts.push([c0[0] + nv[0] * t * 5 + ua[0] * o2, c0[1] + nv[1] * t * 5 + ua[1] * o2]); }
        fg += `<path d="M${P2([c0[0] + nv[0] * 4.2 - ua[0], c0[1] + nv[1] * 4.2 - ua[1]])}L${pts.slice().reverse().map(P2).join('L')}L${P2([c0[0] - nv[0] * 4.2 - ua[0], c0[1] - nv[1] * 4.2 - ua[1]])}Z" fill="#efe8d8" stroke="#7a7466" stroke-width=".3"/>`
          + [-2, 0, 2].map(t => ln(`M${P2([c0[0] + nv[0] * t * 1.6, c0[1] + nv[1] * t * 1.6])}l${f(ua[0] * 1.4)} ${f(ua[1] * 1.4)}`, .25, '#9a9282', .8)).join(''); }
      fg += hd.back + hd.front; }

    // ——— the signing hand from the right: a weathered hand in the writing pinch, the quill's nib at the end of the red
    // flourish; the quill runs between the thumb and the index: the index lies along the barrel (in front of it), the
    // thumb and the middle finger hold it from the other side (behind it, the thumb's tip showing past the barrel), the
    // barrel rests in the web and rises over the back of the hand; the forearm bare to the rolled shirt sleeve ———
    { const qa = -34 * Math.PI / 180, qd = [Math.cos(qa), Math.sin(qa)], nx = -qd[1], ny = qd[0];
      const qp = t => [nib[0] + qd[0] * t, nib[1] + qd[1] * t], pinch = qp(5.5);
      // a: the hand turned so the barrel (local: from the pinch 6, −1.9, −3.1 to the web 4, −1.5, 0) runs along the quill
      const so = { a: 197, s: 2.75, m: 1, roll: 45, pitch: 0, pose: 'pinch', tone: SKIN, light: HL, sw: .32, palmW: .82, wristW: .72,
        flex: [[45, 35, 5], [55, 45, 25], [62, 72, 44], [66, 78, 46]], backFingers: [1, 2, 3, 'thumb'],
        thumbJ: [[1.25, -1.19, -.78], [3.0, -2.6, -1.5], [4.6, -2.7, -2.2], [5.5, -2.5, -3.0]] };
      const h0 = H.hand3(u, { ...so, at: [0, 0] }), p0 = h0.P(6, -1.9, -3.1), at0 = [pinch[0] - p0[0], pinch[1] - p0[1]];
      const hd = H.hand3(u, { ...so, at: at0 }), wr = hd.wrist;
      const shirt = { lit: '#b0a284', half: '#6e6250', shadow: '#2a2218', outline: '#140e08' };   // the shirt, in the table's shadow
      const fa = 45 * Math.PI / 180, el = [wr[0] + Math.cos(fa) * 37, wr[1] + Math.sin(fa) * 37];   // the forearm: on from the wrist, down to the near edge
      let arm = H.cloth(u, { spine: [[el[0] + 30, el[1] + 30], [el[0] + 12, el[1] + 10], [el[0] + 2, el[1] + 1.6]], w: [24, 22.3, 20.9], tone: shirt, lit: -1, rim: '#a8c0e8', rimSide: 1, rimOp: .4, cuff: { from: .66, k: 1.14, roll: true }, seed: 9, drapes: 2, sw: .4 });
      arm = H.cloth(u, { spine: [[el[0] + 2, el[1] + .6], [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5) - 1], [wr[0] + 1, wr[1] + .4]], w: [13.9, 12.5, 9.1], tone: SKIN, lit: -1, rim: '#a8c0e8', rimSide: 1, rimOp: .45, folds: false, capA: true, sw: .35 })
        + Array.from({ length: 12 }, (_, k) => { const t = .2 + R() * .6, p = [lerp(el[0], wr[0], t), lerp(el[1], wr[1], t) - 2 + R() * 4]; return ln(`M${P2(p)}l${f(-1 - R())} ${f(-.6 + R() * .3)}`, .22, '#4a2a18', .5); }).join('') + arm;
      // the quill: the nib on the paper (wet red); the barrel's lower part goes under the index (between it and the
      // thumb), from the web up it lies over the back of the hand with the feather, up right
      const top = qp(48), bar = t0 => ln(`M${P2(qp(t0))}L${P2(top)}`, 1.15, '#5a5040') + ln(`M${P2(qp(t0))}L${P2(top)}`, .72, '#ece2c8');
      const qLow = bar(0) + ln(`M${P2(nib)}L${P2(qp(2.2))}`, .95, '#8a0a08');
      let qs = bar(9.6);
      { const b0 = qp(16.8), b1 = qp(47.3), m0 = qp(31.2), w = 4.1;
        qs += `<path d="M${P2(b0)}Q${f(m0[0] + nx * w * 1.2)} ${f(m0[1] + ny * w * 1.2)} ${P2(b1)}Q${f(m0[0] - nx * w * .55)} ${f(m0[1] - ny * w * .55)} ${P2(b0)}Z" fill="#f4eee0" stroke="#a8a090" stroke-width=".3"/>`
          + Array.from({ length: 9 }, (_, k) => { const p = qp(18.7 + k * 3.1), l = 3.6 - Math.abs(k - 4) * .42; return `<path d="M${P2(p)}l${f(nx * l + qd[0] * 1.4)} ${f(ny * l + qd[1] * 1.4)}" stroke="#c8c0b0" stroke-width=".22"/>`; }).join('')
          + ln(`M${P2(qp(19.2))}L${P2(qp(45.6))}`, .3, '#fffaf0', .7); }
      // the drop of blood hanging at the nib
      qs += `<path d="M${f(nib[0] + .4)} ${f(nib[1] - .2)}q.9 1.4 .2 2.2q-.9 .4 -1 -.5q0 -.8 .8 -1.7z" fill="#b0140e" stroke="#4a0604" stroke-width=".15"/><circle cx="${f(nib[0] + .1)}" cy="${f(nib[1] + 1.3)}" r=".22" fill="#ffb0a0"/>`;
      fg += arm + hd.back + qLow + hd.front + qs; }

    // ——— the light: the lantern's warmth over the far half of the table, the dark down under the glass ———
    // the signer's arm goes down into the dark under the glass: it fades there, so the glass stays even
    { const g = nid('ad', u); fg += `<defs>${radGrad(g, 190, 168, 46, [[0, '#050302', .8], [.55, '#050302', .55], [1, '#050302', 0]])}</defs><rect x="120" y="128" width="90" height="90" fill="url(#${g})" style="mix-blend-mode:multiply"/>`; }
    fg += K.localGlow(u, { x: LAMP.light.x, y: LAMP.light.y, color: '#ffc070', power: .35, radius: 70 }, { core: false }) + K.interior.gloom(u, L, { y0: 132 });
    return [bg + tb, fg];
  } };
