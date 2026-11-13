// «Сделка с Сяо Фэном» (Индевор, ПРИКАЗ: любой вражеский корабль получает 3 урона по Корпусу и 1 по Парусам; это не
// Залп), refined from the first-round scene (portrait-endeavour.cjs SCENES['Сделка с Сяо Фэном']): the deal at a low
// lacquered table in a harbour teahouse at night — red silk lanterns, lattice screens, a chart on silk with ship
// figures, tea. The Company's hand (a navy coat sleeve, a lace cuff) sets down a bag of silver and the coins spill
// over the chart; across the table the hired captain's hand (a red silk sleeve with a gold border) holds an open fan.
// The bargain is made on the chart: a curved dagger is driven through the enemy's black figure — through her sails
// into her hull (the card's damage: hull and sails) — and the junk figure with ribbed sails points at her. Through the
// open window behind, the junk herself lies in the harbour under the moon (the brief's find: the battened sails).
// Fixed against the first round: the room was a flat backdrop with the table floating in front — now a room in 2.5D:
// the ceiling beams, the back wall and the side walls run to one vanishing point, the table top in perspective, the
// things on it scaled by their depth and standing on it with contact shadows; the fan hung in the air on a stiff
// tube — now a 3D hand closing round its guard sticks, one sleeve from the edge through the elbow; the lanterns are
// lanterns (silk on ribs, caps, tassels, the light inside). No faces: the two sides of the deal are their hands.
// Light: the big lantern over the table (key, warm red-orange from above); the two far lanterns at the back wall
// (locals); the moon through the window (cold, a rim on the dagger and the far edges).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, blurF } = PK;

const HZ = 58, VX = 100, FOC = 110;                 // eye level, the vanishing point, units per metre at 1 m
const P3 = (X, Y, z) => [VX + FOC * X / z, HZ - FOC * Y / z];   // X right, Y up from the eye (m), z depth (m)
const ZB = 4.6, XW = 2.4, YC = 1.3, YF = -1.2;      // the back wall, the side walls, the ceiling, the floor
const YT = -.55;                                    // the table top
const LAMP = { x: 100, y: 16, rx: 10.4, ry: 12 };   // the big lantern over the table
const FAR = [{ x: 56, y: 44.2, rx: 3.9, ry: 4.6 }, { x: 144, y: 44.2, rx: 3.9, ry: 4.6 }];
const MOON = { x: 110, y: 42 };
const light = { time: 'night', haze: .3, key: { type: 'point', x: LAMP.x, y: LAMP.y, gy: 101, color: '#ff9a5a', power: 1, radius: 120 },
  fill: { color: '#2a3048', power: .35 }, rim: { az: 0, color: '#9ab4ff', power: .3 },
  locals: FAR.map(l => ({ x: l.x, y: l.y, color: '#ff7a40', power: .45, radius: 40 })) };
const SKIN = { lit: '#f2c294', half: '#c4865c', core: '#a46a44', shadow: '#5e3422', outline: '#26120a' };
const SKIN2 = { lit: '#eec08e', half: '#bf8558', core: '#9e6640', shadow: '#5a321e', outline: '#24100a' };
const ENEMY = P3(-.17, YT, 1.3), JUNK = P3(.2, YT, 1.2), BAG = P3(-.55, YT, 1.08);
const G1 = [BAG[0] + .4, BAG[1] - 19.4];            // the Company's fist round the neck of the bag, the fingers on its tie
const G2 = [160, 84];                               // the captain's fist round the fan's guard sticks
const skel = { horizon: HZ, eye: .55, light: 'big silk lantern over the table (key, warm) + two far lanterns + the moon through the window (cold rim)', items: [
  ['back wall', 42.6, 86.7, 114.8, 59.8, 'floor (z 4.6)'], ['window', 82, 66.4, 36, 31, 'back wall'], ['screens', 47, 72.3, 106, 38, 'back wall, side walls'],
  ['table', 0, 135, 200, 42, 'floor (legs), top y 92.6 far edge'], ['chart', 54, 118.5, 88, 22, 'table top'], ['enemy figure + dagger', 78, 104.5, 16, 30, 'chart; the dagger through it into the table'],
  ['junk figure', 109, 108.4, 19, 19, 'chart'], ['bag of silver', 34, 114.5, 21, 22, 'table, held by the neck'], ['coins', 52, 120, 24, 8, 'chart / table'],
  ['teapot + cups', 30, 103, 110, 12, 'table'], ['fan + hand', 126, 92, 74, 36, 'his fist, the sleeve from the right edge'], ['lantern', 89, 28, 22, 28, 'cord from the ceiling']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = a => 'M' + a.map(P2).join('L') + 'Z';
const ln = (d, w = .5, c = '#0a0604', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
function handAt(u, base, g, t, a0) { let a = a0, h; for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip: g }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
  let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; } return h; }

module.exports = { name: 'Сделка с Сяо Фэном', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .55 }), R = rng(57);
    // ——— outside the window: the night harbour, the moon, the junk at anchor ———
    const W0 = P3(-.75, .95, ZB), W1 = P3(.75, -.35, ZB);   // the window opening (top left, bottom right)
    let out = '';
    { const g = nid('ws', u), gs = nid('wsea', u);
      out += `<defs>${linGrad(g, 0, W0[1], 0, HZ, [[0, '#0c1428'], [.7, '#1e2c4a'], [1, '#34466a']])}${linGrad(gs, 0, HZ, 0, W1[1], [[0, '#2a3a58'], [1, '#0a1220']])}</defs>`
        + `<rect x="${W0[0]}" y="${W0[1]}" width="${f(W1[0] - W0[0])}" height="${f(HZ - W0[1])}" fill="url(#${g})"/>`
        + `<rect x="${W0[0]}" y="${HZ}" width="${f(W1[0] - W0[0])}" height="${f(W1[1] - HZ)}" fill="url(#${gs})"/>`
        + glow(u, MOON.x, MOON.y, 16, 14, '#c8d8ff', .35) + `<circle cx="${MOON.x}" cy="${MOON.y}" r="3.1" fill="#f2f0e4"/><circle cx="${MOON.x - .8}" cy="${MOON.y - .6}" r=".9" fill="#d8d6c8" opacity=".6"/>`
        + Array.from({ length: 14 }, () => `<circle cx="${f(W0[0] + R() * 36)}" cy="${f(W0[1] + R() * 14)}" r="${f(.15 + R() * .2)}" fill="#e8ecff" opacity="${f(.4 + R() * .5)}"/>`).join('');
      // the far shore with a few lights, the moon's path on the water
      out += `<path d="M${W0[0]} ${HZ + .2}Q${W0[0] + 8} ${HZ - 2.4} ${W0[0] + 15} ${HZ - 1.6}T${W0[0] + 26} ${HZ - .4}V${HZ + .3}H${W0[0]}Z" fill="#0c1220"/>`
        + [[86, HZ - 1], [90, HZ - 1.6], [95, HZ - .8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".3" fill="#ffc870"/>`).join('');
      for (let i = 0; i < 9; i++) { const y = HZ + 1 + i * .9, w = 1 + i * .5 + R(); out += `<path d="M${f(MOON.x - w / 2 + (R() - .5) * 2)} ${f(y)}h${f(w)}" stroke="#e8ecff" stroke-width=".35" opacity="${f(.65 - i * .05)}"/>`; }
      // the junk: a low hull with a high stern, three masts with battened sails, the moon along their edges
      const jx = 97, jy = HZ + 2.6, J = (x, y) => [jx + x, jy + y];
      out += `<path d="M${P2(J(-8.6, -2.6))}L${P2(J(-7, 0))}H${f(jx + 6.4)}L${P2(J(8.2, -3.8))}L${P2(J(8.6, -4.6))}L${P2(J(6.8, -4))}H${f(jx - 6)}Z" fill="#0a0e18" stroke="#3a4868" stroke-width=".25"/>`
        + `<path d="M${P2(J(-7, 0))}H${f(jx + 6.4)}" stroke="#0a0e18" stroke-width=".8" opacity=".6" transform="translate(0 .9) scale(1 1)"/>`;
      for (const [mx, h, w] of [[-4.6, 9, 5.4], [.6, 13.6, 7.6], [5.6, 7.6, 4.4]]) { const b = J(mx, -3.4), t = [b[0], b[1] - h];
        out += ln(`M${P2(b)}L${P2(t)}`, .3, '#0a0e18');
        const pts = [], nB = 6; for (let k = 0; k <= nB; k++) { const yy = t[1] + 1 + k * (h - 2.4) / nB, ww = w * (.62 + .38 * Math.sin(k / nB * Math.PI * .8 + .3)); pts.push([b[0] + .3, yy], [b[0] + ww, yy - .7]); }
        let sail = `M${P2([b[0] + .3, t[1] + 1])}`; for (let k = 0; k <= nB; k++) sail += `L${P2(pts[k * 2 + 1])}`; sail += `L${P2([b[0] + .3, b[1] - 1.4])}Z`;
        out += `<path d="${sail}" fill="#3a1e1a" stroke="#0a0e18" stroke-width=".25"/>`;
        for (let k = 0; k <= nB; k++) out += ln(`M${P2(pts[k * 2])}L${P2(pts[k * 2 + 1])}`, .2, '#0a0a10', .9) + ln(`M${P2([pts[k * 2 + 1][0] - .8, pts[k * 2 + 1][1] - .15])}L${P2(pts[k * 2 + 1])}`, .25, '#b8c8ee', .7); }
      out += [[J(7.4, -5.6), '#ffb860'], [J(-7.6, -3.6), '#ffb860']].map(([p, c]) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".45" fill="${c}"/>` + glow(u, p[0], p[1], 2, 2, c, .6)).join('')
        + ln(`M${P2(J(-6.6, .6))}h13`, .3, '#5a6a8a', .5); }

    // ——— the ceiling: boards running to the vanishing point, beams across ———
    let room = '';
    { const cTop = P3(-XW, YC, ZB), g = nid('cg', u);
      room += `<defs>${linGrad(g, 0, 0, 0, cTop[1], [[0, '#0e0605'], [1, '#2a120c']])}</defs><rect x="-2" y="-2" width="204" height="${f(cTop[1] + 2)}" fill="url(#${g})"/>`;
      for (let X = -XW; X <= XW + .01; X += .3) { const a = P3(X, YC, ZB), b = P3(X, YC, 1.2); room += ln(`M${P2(a)}L${P2(b)}`, .4, '#050202', .8); }
      for (const z of [3.6, 2.7, 2.1]) { const h = .16, a0 = P3(-XW, YC, z), a1 = P3(XW, YC, z), b0 = P3(-XW, YC - h, z), b1 = P3(XW, YC - h, z), c0 = P3(-XW, YC - h, z + .16), c1 = P3(XW, YC - h, z + .16);
        room += `<path d="${poly([c0, c1, b1, b0])}" fill="#6a2c1a"/><path d="${poly([a0, a1, b1, b0])}" fill="#2a100a" stroke="#050202" stroke-width=".4"/>`
          + ln(`M${P2(b0)}L${P2(b1)}`, .5, '#c87a50', .55); } }
    // ——— the back wall: posts, lintel, a low panelled wainscot; the window; the paper screens ———
    const corner = { tl: P3(-XW, YC, ZB), tr: P3(XW, YC, ZB), bl: P3(-XW, YF, ZB), br: P3(XW, YF, ZB) };
    { const g = nid('bw', u);
      room += `<defs>${linGrad(g, 0, corner.tl[1], 0, corner.bl[1], [[0, '#2a120c'], [.5, '#3e1a10'], [1, '#22100a']])}</defs><path d="${poly([corner.tl, corner.tr, corner.br, corner.bl])}" fill="url(#${g})"/>`; }
    room += out;
    // a paper screen in a frame: corners A (top-left), B (top-right), C (bottom-right), D (bottom-left) as 3D points
    const screen = (A, B, C, D, nx, ny, warm, seed) => {
      const Rr = rng(seed), Q = (s, t) => { const top = [lerp(A[0], B[0], s), lerp(A[1], B[1], s), lerp(A[2], B[2], s)], bot = [lerp(D[0], C[0], s), lerp(D[1], C[1], s), lerp(D[2], C[2], s)];
        return P3(lerp(top[0], bot[0], t), lerp(top[1], bot[1], t), lerp(top[2], bot[2], t)); };
      const pg = nid('pp', u), c = Q(.5, .45);
      let s = `<defs>${radGrad(pg, c[0], c[1], Math.hypot(Q(1, 1)[0] - Q(0, 0)[0], Q(1, 1)[1] - Q(0, 0)[1]) * .6, [[0, warm[0]], [.6, warm[1]], [1, warm[2]]])}</defs>`
        + `<path d="${poly([Q(0, 0), Q(1, 0), Q(1, 1), Q(0, 1)])}" fill="url(#${pg})"/>`;
      // faint blotches of the paper, then the lattice of thin bars (a square grid with a border band)
      for (let i = 0; i < 5; i++) { const p = Q(.1 + Rr() * .8, .1 + Rr() * .8); s += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(2 + Rr() * 3)}" ry="${f(1.5 + Rr() * 2)}" fill="#8a5a3a" opacity=".08"/>`; }
      for (let i = 1; i < nx; i++) s += ln(`M${P2(Q(i / nx, 0))}L${P2(Q(i / nx, 1))}`, .45, '#1e0c06', .9);
      for (let j = 1; j < ny; j++) s += ln(`M${P2(Q(0, j / ny))}L${P2(Q(1, j / ny))}`, .45, '#1e0c06', .9);
      s += `<path d="${poly([Q(0, 0), Q(1, 0), Q(1, 1), Q(0, 1)])}" fill="none" stroke="#140804" stroke-width="1.6"/>`
        + `<path d="${poly([Q(.06, .05), Q(.94, .05), Q(.94, .95), Q(.06, .95)])}" fill="none" stroke="#1e0c06" stroke-width=".6"/>`;
      return s; };
    const WARM = ['#f4d49a', '#d8a066', '#8a5030'], WARM2 = ['#e8c48c', '#b88050', '#6a3a22'];
    room += screen([-2.2, 1, ZB], [-.95, 1, ZB], [-.95, -.6, ZB], [-2.2, -.6, ZB], 8, 10, WARM, 3)
      + screen([.95, 1, ZB], [2.2, 1, ZB], [2.2, -.6, ZB], [.95, -.6, ZB], 8, 10, WARM, 5);
    // the side walls: dark boards, a paper screen on each, posts
    for (const sd of [-1, 1]) { const X = sd * XW, a = P3(X, YC, ZB), b = P3(X, YC, 2.2), c = P3(X, YF, 2.2), d = P3(X, YF, ZB), g = nid('sw', u);
      room += `<defs>${linGrad(g, a[0], 0, b[0], 0, [[0, '#3a180e'], [1, '#1e0a06']])}</defs><path d="${poly([a, b, c, d])}" fill="url(#${g})"/>`;
      room += screen([X, 1, 3.0], [X, 1, 4.2], [X, -.6, 4.2], [X, -.6, 3.0], 9, 10, WARM2, 7 + sd);
      for (const z of [2.65, 2.8, 4.45]) { const p0 = P3(X, YC, z), p1 = P3(X, YF, z); room += `<path d="M${P2(p0)}L${P2(p1)}" stroke="#140804" stroke-width="${f(FOC * .1 / z)}"/>`; } }
    // the posts and rails of the back wall round the screens and the window
    { const post = (X0, X1) => { const a = P3(X0, YC, ZB), b = P3(X1, YF, ZB); return `<rect x="${f(a[0])}" y="${f(a[1])}" width="${f(b[0] - a[0])}" height="${f(b[1] - a[1])}" fill="#1a0a06"/>` + ln(`M${f(b[0] - .3)} ${f(a[1])}V${f(b[1])}`, .35, '#a05a34', .45); };
      room += post(-XW, -2.2) + post(-.95, -.75) + post(.75, .95) + post(2.2, XW);
      const rail = (Y0, Y1, X0 = -XW, X1 = XW) => { const a = P3(X0, Y0, ZB), b = P3(X1, Y1, ZB); return `<rect x="${f(a[0])}" y="${f(a[1])}" width="${f(b[0] - a[0])}" height="${f(b[1] - a[1])}" fill="#1e0c06"/>` + ln(`M${f(a[0])} ${f(b[1] - .2)}H${f(b[0])}`, .35, '#b86a3e', .5); };
      room += rail(1.12, .95) + rail(-.6, -.7) + rail(-.35, -.42, -.85, .85);
      // the wainscot under the rail: panels
      for (let X = -2.2; X < 2.2; X += .55) { const a = P3(X + .04, -.74, ZB), b = P3(X + .51, -1.12, ZB); room += `<rect x="${f(a[0])}" y="${f(a[1])}" width="${f(b[0] - a[0])}" height="${f(b[1] - a[1])}" fill="#2e140c" stroke="#120604" stroke-width=".4"/>` + ln(`M${f(a[0])} ${f(a[1] + .2)}H${f(b[0])}`, .3, '#a8603a', .4); }
      // the window's frame: its depth (the reveal) lit on the far side by the moon; the sill
      room += `<path d="M${P2(W0)}H${f(W1[0])}V${f(W1[1])}H${f(W0[0])}Z" fill="none" stroke="#140804" stroke-width="1.6"/>`
        + `<path d="M${f(W1[0] - 1.6)} ${f(W0[1] + .8)}V${f(W1[1] - .8)}" stroke="#7a8ab0" stroke-width=".5" opacity=".6"/>`
        + `<path d="M${f(W0[0] - 1)} ${f(W1[1])}H${f(W1[0] + 1)}L${f(W1[0] + 1.6)} ${f(W1[1] + 1.4)}H${f(W0[0] - 1.6)}Z" fill="#3a1a10" stroke="#120604" stroke-width=".35"/>`; }
    // the corners of the room
    room += ln(`M${P2(corner.tl)}L${P2(corner.bl)}`, .8, '#0a0402') + ln(`M${P2(corner.tr)}L${P2(corner.br)}`, .8, '#0a0402')
      + ln(`M${P2(corner.tl)}L${P2(P3(-XW, YC, 2.2))}`, .8, '#0a0402') + ln(`M${P2(corner.tr)}L${P2(P3(XW, YC, 2.2))}`, .8, '#0a0402');
    // the floor in the gap under the table: dark boards to the vanishing point
    { const a = corner.bl, b = corner.br, g = nid('fl', u);
      room += `<defs>${linGrad(g, 0, a[1], 0, 140, [[0, '#2a140a'], [1, '#120804']])}</defs><path d="M-2 ${f(P3(-XW, YF, 2.2)[1])}L${P2(a)}L${P2(b)}L202 ${f(P3(XW, YF, 2.2)[1])}V140H-2Z" fill="url(#${g})"/>`;
      for (let X = -XW; X <= XW; X += .28) room += ln(`M${P2(P3(X, YF, ZB))}L${P2(P3(X, YF, 1.4))}`, .35, '#0a0402', .7); }
    // the warmth of the lanterns on the walls
    room += K.localGlow(u, { x: FAR[0].x, y: FAR[0].y + 4, color: '#ff8a48', power: .55, radius: 30 }, { core: false })
      + K.localGlow(u, { x: FAR[1].x, y: FAR[1].y + 4, color: '#ff8a48', power: .55, radius: 30 }, { core: false })
      + K.localGlow(u, { x: LAMP.x, y: LAMP.y + 30, color: '#ff8a50', power: .35, radius: 90 }, { core: false });

    // ——— a red silk lantern: ribs, the gathered silk, black lacquer caps, the gold tassel; the light inside ———
    const lantern = (o, cord) => { const { x, y, rx, ry } = o, g = nid('ln', u), g2 = nid('lc', u);
      let s = ln(`M${f(x)} ${f(cord)}V${f(y - ry - .8)}`, Math.max(.25, rx * .03), '#1a0c06');
      s += `<defs>${radGrad(g, x - rx * .1, y + ry * .05, rx * 1.1, [[0, '#ffd890'], [.3, '#ff8a3a'], [.7, '#d0281a'], [1, '#6a0806']])}${linGrad(g2, x - rx * .4, 0, x + rx * .4, 0, [[0, '#2a1a10'], [.4, '#4a3020'], [1, '#0a0604']])}</defs>`
        + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})" stroke="#4a0604" stroke-width="${f(rx * .04)}"/>`;
      for (const k of [-.78, -.5, -.2, .12, .42, .7]) { const xx = x + k * rx, b = Math.sqrt(1 - k * k) * ry; s += `<path d="M${f(x + k * rx * .55)} ${f(y - ry * .93)}Q${f(xx + k * rx * .25)} ${f(y)} ${f(x + k * rx * .55)} ${f(y + ry * .93)}" stroke="#7a0a06" stroke-width="${f(rx * .035)}" fill="none" opacity="${f(.5 + Math.abs(k) * .4)}"/>`; void b; }
      for (const t of [-.55, 0, .55]) { const b = Math.sqrt(1 - t * t) * rx; s += `<path d="M${f(x - b)} ${f(y + t * ry)}Q${f(x)} ${f(y + t * ry + ry * .12)} ${f(x + b)} ${f(y + t * ry)}" stroke="#ffb070" stroke-width="${f(rx * .02)}" fill="none" opacity=".35"/>`; }
      s += `<path d="M${f(x - rx * .45)} ${f(y - ry * .92)}h${f(rx * .9)}v${f(-ry * .2)}h${f(-rx * .9)}z" fill="url(#${g2})" stroke="#050302" stroke-width="${f(rx * .03)}"/>`
        + `<path d="M${f(x - rx * .45)} ${f(y + ry * .92)}h${f(rx * .9)}v${f(ry * .2)}h${f(-rx * .9)}z" fill="url(#${g2})" stroke="#050302" stroke-width="${f(rx * .03)}"/>`
        + `<path d="M${f(x - rx * .45)} ${f(y - ry * 1.12)}h${f(rx * .9)}M${f(x - rx * .45)} ${f(y + ry * 1.12)}h${f(rx * .9)}" stroke="#d8a040" stroke-width="${f(rx * .035)}" opacity=".8"/>`;
      // the tassel: a knot, then the gold threads
      const ty = y + ry * 1.12;
      s += `<circle cx="${f(x)}" cy="${f(ty + rx * .14)}" r="${f(rx * .1)}" fill="#c89030"/>`;
      for (let k = -3; k <= 3; k++) s += ln(`M${f(x + k * rx * .02)} ${f(ty + rx * .2)}L${f(x + k * rx * .06)} ${f(ty + rx * .95)}`, rx * .03, k % 2 ? '#e8b848' : '#a87420', .95);
      s += `<ellipse cx="${f(x - rx * .35)}" cy="${f(y - ry * .3)}" rx="${f(rx * .18)}" ry="${f(ry * .35)}" fill="#ffe0a8" opacity=".35"/>`;
      return s + K.localGlow(u, { x, y, color: '#ff8a40', power: .9, radius: rx * 3.2 }); };
    const lamps = FAR.map(l => lantern(l, P3(0, YC, 4)[1])).join('');

    // ——— the table: dark red lacquer in perspective, its left end, a leg; the lamp's pool and sheen on it ———
    let table = '';
    const TF = 1.75, TX = 1.3, tFL = P3(-TX, YT, TF), tFR = P3(TX, YT, TF);
    { const g = nid('tt', u), nearL = P3(-TX, YT, .62), nearR = P3(TX, YT, .62);
      table += `<path d="M${P2(P3(-TX + .05, YT - .04, TF - .05))}L${P2(P3(-TX + .05, YF, TF - .05))}" stroke="#1a0806" stroke-width="3.4"/>`
        + `<path d="M${P2(P3(TX - .05, YT - .04, TF - .05))}L${P2(P3(TX - .05, YF, TF - .05))}" stroke="#1a0806" stroke-width="3.4"/>`;
      table += `<defs>${linGrad(g, 0, tFL[1], 0, 160, [[0, '#4a1610'], [.3, '#5e1c12'], [1, '#2a0a06']])}</defs>`
        + `<path d="${poly([tFL, tFR, nearR, nearL])}" fill="url(#${g})"/>`
        // the thickness of the far edge (seen just as a lit lip) and of the left and right ends
        + `<path d="M${P2(tFL)}L${P2(tFR)}" stroke="#d87a58" stroke-width=".6" opacity=".7"/>`
        + `<path d="M${P2(tFL)}L${P2(nearL)}L${P2([nearL[0], nearL[1] + 6])}L${P2([tFL[0], tFL[1] + 2.4])}Z" fill="#1e0806"/>`
        + `<path d="M${P2(tFR)}L${P2(nearR)}L${P2([nearR[0], nearR[1] + 6])}L${P2([tFR[0], tFR[1] + 2.4])}Z" fill="#1e0806"/>`
        + ln(`M${P2(tFL)}L${P2(nearL)}`, .5, '#c86a48', .55) + ln(`M${P2(tFR)}L${P2(nearR)}`, .5, '#c86a48', .55);
      // the pool of the lamp, the reflection of the lantern and of the window in the lacquer
      table += K.localGlow(u, { x: 100, y: 104, color: '#ff8a4a', power: .7, radius: 60 }, { squash: .35, core: false })
        + `<ellipse cx="100" cy="${f(tFL[1] + 4)}" rx="6" ry="2.2" fill="#ffb070" opacity=".22"/>`
        + `<path d="M${f(W0[0] + 2)} ${f(tFL[1] + 1)}h${f(W1[0] - W0[0] - 4)}l2 3h${f(-(W1[0] - W0[0]))}z" fill="#8aa0d0" opacity=".1"/>`; }

    // ——— the chart on silk, rolled on two rods: islands in ink and wash, rhumb lines from a rose, little waves ———
    const CX0 = -.42, CX1 = .38, CZ0 = 1.55, CZ1 = 1.0, CH = (s, t) => P3(lerp(CX0, CX1, s), YT, 1 / lerp(1 / CZ0, 1 / CZ1, t));
    let chart = '';
    { const g = nid('ch', u), quad = [CH(0, 0), CH(1, 0), CH(1, 1), CH(0, 1)];
      chart += K.contactShadow(u, (quad[2][0] + quad[3][0]) / 2, quad[2][1] + 1, quad[2][0] - quad[3][0], L, { ry: 1.2, opacity: .5 })
        + `<defs>${linGrad(g, 0, quad[0][1], 0, quad[2][1], [[0, '#d8c49c'], [.5, '#f0dcb0'], [1, '#e0c898']])}</defs><path d="${poly(quad)}" fill="url(#${g})" stroke="#7a5a3a" stroke-width=".35"/>`;
      // the silk's sheen and a soft crease across
      chart += `<path d="${poly([CH(.3, 0), CH(.42, 0), CH(.5, 1), CH(.36, 1)])}" fill="#fff4dc" opacity=".25"/>` + ln(`M${P2(CH(0, .52))}L${P2(CH(1, .5))}`, .3, '#8a6a44', .35);
      // the rose and its rhumb lines
      const rc = CH(.52, .36);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, e = CH(.52 + Math.cos(a) * .9, .36 + Math.sin(a) * 1.4); chart += ln(`M${P2(rc)}L${P2(e)}`, .18, '#8a3a2a', .45); }
      { const r1 = 2.4, pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 - Math.PI / 2, rr = k % 4 === 0 ? r1 : k % 2 === 0 ? r1 * .6 : r1 * .35; pts.push([rc[0] + Math.cos(a) * rr * 1.3, rc[1] + Math.sin(a) * rr * .55]); }
        chart += `<path d="${poly(pts)}" fill="#a8402a" stroke="#5a1a10" stroke-width=".2" opacity=".85"/><ellipse cx="${f(rc[0])}" cy="${f(rc[1])}" rx="1.1" ry=".5" fill="#e8d0a0"/>`; }
      // islands: a coast in ink, a green-ochre wash inside, a few hills
      const isle = (s0, t0, ws, ts, seed) => { const Ri = rng(seed), n = 11, pts = [];
        for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, rr = .7 + Ri() * .45; pts.push(CH(s0 + Math.cos(a) * ws * rr, t0 + Math.sin(a) * ts * rr)); }
        return `<path d="${H.sp(pts, true)}" fill="#a8a06a" opacity=".75" stroke="#3a2a1a" stroke-width=".35"/>`
          + `<path d="${H.sp(pts, true)}" fill="none" stroke="#5a7a8a" stroke-width="1.1" opacity=".22" transform="translate(0 .4)"/>`
          + ln(`M${P2(CH(s0 - ws * .3, t0))}l1.2 -.9l1.2 .9`, .25, '#3a2a1a', .7); };
      chart += isle(.14, .22, .1, .2, 3) + isle(.84, .2, .12, .16, 5) + isle(.2, .82, .08, .14, 9) + isle(.7, .86, .07, .12, 11);
      for (let i = 0; i < 12; i++) { const p = CH(.1 + R() * .8, .1 + R() * .8); chart += ln(`M${P2(p)}q.5 -.4 1 0q.5 .4 1 0`, .2, '#4a5a6a', .45); }
      // the rods: dark wood with gold caps, at the far and near edges
      for (const [t, rr] of [[0, .9], [1, 1.25]]) { const a = CH(-.04, t), b = CH(1.04, t);
        chart += K.shadeCyl(u, a[0], a[1] - rr * .6, b[0], b[1] - rr * .6, rr, L, 'oak', { outline: .3, seed: 4 + t })
          + K.shadeSphere(u, a[0] - rr * .3, a[1] - rr * .6, rr * 1.15, L, 'brass', { outline: .25 }) + K.shadeSphere(u, b[0] + rr * .3, b[1] - rr * .6, rr * 1.15, L, 'brass', { outline: .25 }); } }

    // ——— tea: a blue-and-white pot and two cups, steam ———
    let tea = '';
    const cup = (X, z, seed) => { const p = P3(X, YT, z), k = FOC / z, rr = .045 * k, h = .05 * k, e = .34;
      return K.contactShadow(u, p[0], p[1], rr * 2.4, L, { ry: rr * .45, opacity: .6 })
        + `<path d="M${f(p[0] - rr)} ${f(p[1] - h)}Q${f(p[0] - rr * .9)} ${f(p[1] - h * .1)} ${f(p[0] - rr * .45)} ${f(p[1])}H${f(p[0] + rr * .45)}Q${f(p[0] + rr * .9)} ${f(p[1] - h * .1)} ${f(p[0] + rr)} ${f(p[1] - h)}Z" fill="#e8e2d4" stroke="#5a5040" stroke-width=".3"/>`
        + `<path d="M${f(p[0] + rr * .2)} ${f(p[1] - h * .9)}Q${f(p[0] + rr * .8)} ${f(p[1] - h * .5)} ${f(p[0] + rr * .4)} ${f(p[1] - h * .05)}" stroke="#a87858" stroke-width="${f(rr * .35)}" fill="none" opacity=".35"/>`
        + `<path d="M${f(p[0] - rr * .95)} ${f(p[1] - h * .72)}Q${f(p[0])} ${f(p[1] - h * .55)} ${f(p[0] + rr * .95)} ${f(p[1] - h * .72)}" stroke="#2a4a8a" stroke-width="${f(rr * .12)}" fill="none"/>`
        + `<ellipse cx="${f(p[0])}" cy="${f(p[1] - h)}" rx="${f(rr)}" ry="${f(rr * e)}" fill="#f4f0e6" stroke="#5a5040" stroke-width=".3"/><ellipse cx="${f(p[0])}" cy="${f(p[1] - h + rr * .04)}" rx="${f(rr * .8)}" ry="${f(rr * e * .7)}" fill="#7a5a28"/>`
        + `<ellipse cx="${f(p[0] - rr * .3)}" cy="${f(p[1] - h + rr * .02)}" rx="${f(rr * .25)}" ry="${f(rr * .08)}" fill="#ffd8a0" opacity=".6"/>` + steam(p[0], p[1] - h - .6, k * .06, seed); };
    function steam(x, y, h, seed) { const Rs = rng(seed), id = nid('st', u); let s = `<defs>${blurF(id, .45)}</defs><g filter="url(#${id})" opacity=".5">`;
      for (let i = 0; i < 3; i++) { const dx = (Rs() - .5) * 2; s += `<path d="M${f(x + dx)} ${f(y)}c${f(-2 + Rs() * 1)} ${f(-h * .3)} ${f(2.4)} ${f(-h * .5)} ${f(.4 + Rs())} ${f(-h * .8)}s${f(-2)} ${f(-h * .4)} ${f(.6)} ${f(-h * .9)}" stroke="#f4ece0" stroke-width="${f(.5 + Rs() * .4)}" fill="none"/>`; }
      return s + '</g>'; }
    { const p = P3(-.6, YT, 1.6), k = FOC / 1.6, rr = .07 * k, c = [p[0], p[1] - rr * .95];
      tea += K.contactShadow(u, p[0], p[1], rr * 2.2, L, { ry: rr * .3, opacity: .6 })
        // the spout (to the left) and the handle (right), behind and in front of the body
        + `<path d="M${f(c[0] + rr * .85)} ${f(c[1] - rr * .4)}q${f(rr * .8)} ${f(-rr * .1)} ${f(rr * .7)} ${f(rr * .5)}q${f(-.1 * rr)} ${f(rr * .4)} ${f(-rr * .7)} ${f(rr * .3)}" stroke="#d8d0c0" stroke-width="${f(rr * .16)}" fill="none"/>`
        + (() => { const g = nid('tp', u); return `<defs>${radGrad(g, c[0] + rr * .25, c[1] - rr * .45, rr * 1.3, [[0, '#fffaf0'], [.45, '#e8e0d0'], [.85, '#9a8a74'], [1, '#6a5a48']])}</defs><ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rr)}" ry="${f(rr * .92)}" fill="url(#${g})" stroke="#4a4030" stroke-width=".3"/>`; })()
        + `<path d="M${f(c[0] - rr * .9)} ${f(c[1] - rr * .2)}L${f(c[0] - rr * 1.75)} ${f(c[1] - rr * .95)}L${f(c[0] - rr * 1.6)} ${f(c[1] - rr * 1.05)}L${f(c[0] - rr * .8)} ${f(c[1] + rr * .2)}Z" fill="#e0d8c8" stroke="#5a5040" stroke-width=".3"/>`
        + `<path d="M${f(c[0] - rr * .98)} ${f(c[1] + rr * .1)}Q${f(c[0])} ${f(c[1] + rr * .42)} ${f(c[0] + rr * .98)} ${f(c[1] + rr * .1)}" stroke="#2a4a8a" stroke-width="${f(rr * .14)}" fill="none"/>`
        + `<path d="M${f(c[0] - rr * .5)} ${f(c[1] - rr * .1)}q${f(rr * .25)} ${f(-rr * .3)} ${f(rr * .5)} 0t${f(rr * .5)} 0" stroke="#2a4a8a" stroke-width="${f(rr * .08)}" fill="none" opacity=".8"/>`
        + `<ellipse cx="${f(c[0])}" cy="${f(c[1] - rr * .82)}" rx="${f(rr * .5)}" ry="${f(rr * .16)}" fill="#e8e2d4" stroke="#5a5040" stroke-width=".3"/>`
        + `<circle cx="${f(c[0])}" cy="${f(c[1] - rr * 1.02)}" r="${f(rr * .16)}" fill="#f0ead8" stroke="#4a4030" stroke-width=".25"/>` + steam(c[0] - rr * 1.7, c[1] - rr * 1.1, k * .05, 4); }
    tea += cup(-.98, 1.62, 6) + cup(.5, 1.55, 8);

    // ——— the figures: the enemy (black hull, black sails), the junk (ribbed rust sails) ———
    let figs = '';
    const enemy = (() => { const [x, y] = ENEMY, k = FOC / 1.3 / 100, H0 = 11 * k * 100 / 100;
      const hl = 7.2, top = y - 3.8;
      let s = K.contactShadow(u, x, y + .2, 17, L, { ry: 1.2, opacity: .7 })
        + `<path d="M${f(x - hl)} ${f(top)}L${f(x + hl + 1.6)} ${f(top - .8)}L${f(x + hl - .8)} ${f(y)}H${f(x - hl + 1.2)}Z" fill="#141216" stroke="#000" stroke-width=".35"/>`
        + `<path d="M${f(x - hl)} ${f(top)}L${f(x + hl + 1.6)} ${f(top - .8)}" stroke="#c87a58" stroke-width=".45"/>`
        + `<path d="M${f(x - hl + .6)} ${f(top + 1.4)}L${f(x + hl + .6)} ${f(top + .7)}" stroke="#3a3a42" stroke-width=".3"/>`
        + [-4, -1.4, 1.2, 3.8].map(dx => `<rect x="${f(x + dx - .4)}" y="${f(top + 1.6)}" width=".8" height=".7" fill="#000"/>`).join('');
      for (const [mx, h, w] of [[-3, 9, 4.4], [2.2, 11, 5.2]]) { const b = [x + mx, top - .2], tp = [b[0], b[1] - h];
        s += ln(`M${P2(b)}L${P2(tp)}`, .45, '#2a1a10');
        for (const [y0, y1, ww] of [[.15, .5, w], [.55, .9, w * 1.1]]) s += `<path d="M${f(b[0] - ww / 2)} ${f(tp[1] + h * y0)}Q${f(b[0] - .6)} ${f(tp[1] + h * (y0 + y1) / 2)} ${f(b[0] - ww / 2 - .2)} ${f(tp[1] + h * y1)}H${f(b[0] + ww / 2 + .2)}Q${f(b[0] + .8)} ${f(tp[1] + h * (y0 + y1) / 2)} ${f(b[0] + ww / 2)} ${f(tp[1] + h * y0)}Z" fill="#1e1c22" stroke="#000" stroke-width=".25"/>`
          + ln(`M${f(b[0] - ww / 2)} ${f(tp[1] + h * y0)}Q${f(b[0] - .6)} ${f(tp[1] + h * (y0 + y1) / 2)} ${f(b[0] - ww / 2 - .2)} ${f(tp[1] + h * y1)}`, .3, '#c8806a', .6); }
      void H0; return s; })();
    figs += enemy;
    // the dagger: driven through her main topsail and the hull into the table, leaning a little; a curved blade
    { const tip = [ENEMY[0] + 2.2, ENEMY[1] - 1.6], dir = [-.16, -.987], nrm = [-dir[1], dir[0]], at = t => [tip[0] + dir[0] * t, tip[1] + dir[1] * t];
      const bend = t => .9 * Math.sin(t / 22 * Math.PI) ;   // the blade's curve (to the right)
      const B = (t, w) => { const p = at(t), b = bend(t); return [p[0] + nrm[0] * (w + b), p[1] + nrm[1] * (w + b)]; };
      const ts = [0, 4, 8, 12, 16, 20, 22];
      const wd = t => .55 + t / 22 * 1.0;
      const bl = ts.map(t => B(t, -wd(t))).concat(ts.slice().reverse().map(t => B(t, wd(t))));
      const g = nid('dg', u);
      figs += `<defs>${linGrad(g, B(10, -2)[0], B(10, -2)[1], B(10, 2)[0], B(10, 2)[1], [[0, '#f4f6f8'], [.45, '#b8c0c8'], [.55, '#5a6470'], [1, '#2a3038']])}</defs>`
        // the torn sail round the blade: a dark slit
        + `<path d="M${P2(B(6.4, -1.8))}L${P2(B(7.6, .2))}L${P2(B(6.8, 2.2))}L${P2(B(5.6, .4))}Z" fill="#000" opacity=".8"/>`
        + `<path d="${poly(bl)}" fill="url(#${g})" stroke="#1a1e24" stroke-width=".3"/>`
        + ln(`M${ts.map(t => P2(B(t, -.1))).join('L')}`, .25, '#3a4048', .8) + ln(`M${ts.slice(2).map(t => P2(B(t, -wd(t) * .7))).join('L')}`, .25, '#ffffff', .7)
        + ln(`M${P2(B(4, wd(4) * .8))}L${P2(B(20, wd(20) * .8))}`, .3, '#ff9a60', .45);
      // the guard: a brass crossbar with curled ends; the grip wrapped in dark cord; the pommel
      const gc = at(23.2), gl = [gc[0] + nrm[0] * 4.6, gc[1] + nrm[1] * 4.6], gr = [gc[0] - nrm[0] * 4.6, gc[1] - nrm[1] * 4.6];
      figs += K.shadeCyl(u, gr[0], gr[1], gl[0], gl[1], .9, L, 'brass', { outline: .3 })
        + K.shadeSphere(u, gl[0] + dir[0] * .8, gl[1] + dir[1] * .8, 1.05, L, 'brass', { outline: .25 }) + K.shadeSphere(u, gr[0] + dir[0] * .8, gr[1] + dir[1] * .8, 1.05, L, 'brass', { outline: .25 });
      const g0 = at(24), g1 = at(33.4);
      figs += K.shadeCyl(u, g0[0], g0[1], g1[0], g1[1], 1.25, L, 'leather', { r1: 1.15, r2: 1.35, outline: .3 });
      for (let t = 25; t < 33; t += 1.1) { const a = [at(t)[0] + nrm[0] * 1.3, at(t)[1] + nrm[1] * 1.3], b = [at(t + .8)[0] - nrm[0] * 1.3, at(t + .8)[1] - nrm[1] * 1.3]; figs += ln(`M${P2(a)}L${P2(b)}`, .3, '#0a0604', .7); }
      const pm = at(34.6); figs += K.shadeSphere(u, pm[0], pm[1], 1.7, L, 'brass', { outline: .3 }) + `<path d="M${f(pm[0] - 1.2)} ${f(pm[1] - .4)}a1.6 1.6 0 0 1 1.6 -1.2" stroke="#b8ccff" stroke-width=".35" fill="none" opacity=".7"/>`
        + ln(`M${P2(B(18, -wd(18) - .1))}L${P2(B(22, -wd(22) - .1))}`, .35, '#c8d8ff', .6);
      // splinters of her hull round the blade
      for (let i = 0; i < 5; i++) { const a = -Math.PI * (.2 + R() * .6); figs += ln(`M${f(tip[0])} ${f(tip[1] - 1)}l${f(Math.cos(a) * (1.4 + R() * 1.6))} ${f(Math.sin(a) * (1 + R()))}`, .3, '#5a3a24', .9); } }
    // the junk figure: bow to the left, a raised stern, three masts with battened rust sails (their ribs)
    { const [x, y] = JUNK, k = FOC / 1.2 / 100;
      const hl = 9.2 * k / .917, top = y - 3.6;
      figs += K.contactShadow(u, x, y + .2, hl * 2.2, L, { ry: 1.2, opacity: .7 })
        + `<path d="M${f(x - hl - 1.4)} ${f(top - 1.2)}L${f(x - hl + .8)} ${f(y)}H${f(x + hl - 1)}L${f(x + hl + .6)} ${f(top - 2.6)}L${f(x + hl - 1.8)} ${f(top - 2.8)}L${f(x + hl - 2.4)} ${f(top)}H${f(x - hl + .2)}Z" fill="#6a3418" stroke="#1a0a04" stroke-width=".35"/>`
        + `<path d="M${f(x - hl - .6)} ${f(top - .2)}H${f(x + hl - 2.4)}" stroke="#d8a040" stroke-width=".5"/><path d="M${f(x - hl + .4)} ${f(top + 1.6)}H${f(x + hl - 1.2)}" stroke="#2a1006" stroke-width=".4"/>`
        + `<path d="M${f(x + hl - 1.8)} ${f(top - 2.8)}L${f(x + hl + .6)} ${f(top - 2.6)}" stroke="#ffb070" stroke-width=".4"/>`
        + `<circle cx="${f(x - hl + .6)}" cy="${f(top + .9)}" r=".55" fill="#f0e0b0" stroke="#1a0a04" stroke-width=".2"/>`;
      for (const [mx, h, w] of [[-5.2, 11, 6.6], [.6, 16, 9.4], [5.8, 9, 5.4]]) { const b = [x + mx, top - .1], tp = [b[0], b[1] - h], nB = 6, ribs = [];
        for (let i = 0; i <= nB; i++) { const yy = tp[1] + .8 + i * (h - 2) / nB, ww = w * (.55 + .45 * Math.sin((i / nB) * Math.PI * .75 + .35)); ribs.push([[b[0] - .4, yy + .1], [b[0] - .4 + ww, yy - .9 - i * .08]]); }
        let sail = `M${P2(ribs[0][0])}`; for (let i = 0; i <= nB; i++) { const e = ribs[i][1]; sail += i ? `Q${f(e[0] - .9)} ${f(e[1] - (h - 2) / nB * .55)} ${P2(e)}` : `L${P2(e)}`; }
        sail += `L${P2(ribs[nB][0])}Z`;
        const g = nid('js', u);
        figs += ln(`M${P2(b)}L${P2(tp)}`, .5, '#2a1406') + `<defs>${linGrad(g, b[0], tp[1], b[0] + w, b[1], [[0, '#d8683a'], [.6, '#a03c22'], [1, '#5a1c10']])}</defs><path d="${sail}" fill="url(#${g})" stroke="#2a0c06" stroke-width=".3"/>`;
        for (const [a, e] of ribs) figs += ln(`M${P2(a)}L${P2(e)}`, .4, '#2a1408', .95) + ln(`M${P2([a[0], a[1] - .35])}L${P2([e[0], e[1] - .35])}`, .2, '#ffc890', .5);
        figs += `<path d="M${P2(tp)}l-2.4 .8l2.4 .8z" fill="#d8b040"/>`; } }

    // ——— the bag of silver on the table, coins spilling out over the chart ———
    let bag = '';
    const coin = (x, y, r, tilt = 0) => { const e = .36, g = nid('cn', u);
      return `<defs>${linGrad(g, x - r, y - r, x + r, y + r, [[0, '#ffffff'], [.35, '#d4dae0'], [.7, '#8a929c'], [1, '#4a5058']])}</defs>`
        + `<g transform="rotate(${f(tilt)} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y + r * .14)}" rx="${f(r)}" ry="${f(r * e)}" fill="#5a6068" stroke="#1e2226" stroke-width=".25"/>`
        + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * e)}" fill="url(#${g})" stroke="#2a2e34" stroke-width=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * .7)}" ry="${f(r * e * .7)}" fill="none" stroke="#6a727c" stroke-width=".2"/>`
        + `<path d="M${f(x - r * .8)} ${f(y - r * e * .5)}A${f(r)} ${f(r * e)} 0 0 1 ${f(x + r * .3)} ${f(y - r * e)}" stroke="#fff8e8" stroke-width=".3" fill="none" opacity=".9"/></g>`; };
    { const sx = BAG[0], sy = BAG[1];
      // coins: a short stack, then loose ones fanning out over the chart (back to front)
      const loose = [[58, 113, 1.7, -8], [64, 116.4, 1.8, 6], [55, 118.6, 1.9, -4], [69, 119.6, 1.9, 12], [61, 121.4, 2, 2], [50, 121.6, 2, -10], [74, 115, 1.6, 4]].sort((a, b) => a[1] - b[1]);
      for (const [x, y, r, t] of loose) bag += K.contactShadow(u, x, y + .6, r * 2.4, L, { ry: r * .45, opacity: .5 }) + coin(x, y, r, t);
      for (let i = 0; i < 4; i++) bag += coin(sx + 13.6 + (R() - .5) * .3, sy + 1.6 - i * .75, 2.1, (R() - .5) * 4);
      const lf = nid('lf', u);
      bag += `<defs><filter id="${lf}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".62 .06 0 0 0  .04 .44 0 0 0  0 .04 .3 0 0  0 0 0 1 0"/></filter></defs>`
        + `<g filter="url(#${lf})">${K.sack(u, L, { x: sx, y: sy, s: 1.04, seed: 7 })}</g>`
        // the bag's mouth gaping on the far side: coins inside catching the lamp
        + coin(sx + 4.2, sy - 3.6, 1.6, -20) + coin(sx + 6.2, sy - 1.8, 1.7, 14); }
    // the Company's hand round the neck of the bag: a navy coat sleeve with a gold-buttoned cuff, a lace ruffle
    const coatT = { lit: '#4a5a8a', half: '#222a48', core: '#1a2038', shadow: '#0a0e1c', outline: '#04060c' };
    const h1 = handAt(u, { s: 3.4, m: 1, roll: 52, pitch: 6, pose: 'wrap', r: .62, tone: SKIN, light: [.6, -.8], sw: .32, palmW: .92, wristW: .82 }, G1, -86, -4);
    let arm1 = '';
    { const W = h1.wrist, ua = [W[0] - (W[0] - 8), 0], EL = [W[0] - 22, W[1] + 15];
      void ua;
      arm1 += H.cloth(u, { spine: [[-24, 136], [EL[0] - 8, EL[1] + 6], EL, [lerp(EL[0], W[0], .55), lerp(EL[1], W[1], .55) + .6], [W[0] - 1.6, W[1] + .4]], w: [17.6, 16.2, 15, 13.4, 12.2],
        tone: coatT, lit: -1, rim: '#8aa0d8', rimSide: 1, rimOp: .45, seed: 5, drapes: 2, sw: .4, L,
        cuff: { from: .72, k: 1.3, buttons: .75, tone: { lit: '#3a4c80', half: '#1a2448', shadow: '#080c1a', outline: '#04060c' } } });
      // the gold braid along the cuff's edge, the lace ruffle out of it over the wrist
      const c0 = [W[0] - 2.6, W[1] + .6];
      arm1 += `<path d="M${f(c0[0] - .6)} ${f(c0[1] - 7)}Q${f(c0[0] + 1.6)} ${f(c0[1])} ${f(c0[0] - .4)} ${f(c0[1] + 7)}" stroke="#d8a840" stroke-width=".8" fill="none"/>`
        + `<path d="M${f(c0[0] - .2)} ${f(c0[1] - 5.6)}Q${f(c0[0] + 3.4)} ${f(c0[1] - 4)} ${f(c0[0] + 2.6)} ${f(c0[1] - 1)}Q${f(c0[0] + 4.2)} ${f(c0[1] + 1.4)} ${f(c0[0] + 2.4)} ${f(c0[1] + 3)}Q${f(c0[0] + 3.4)} ${f(c0[1] + 5)} ${f(c0[0] + .2)} ${f(c0[1] + 5.8)}Z" fill="#ece6d6" stroke="#6a6252" stroke-width=".3"/>`
        + ln(`M${f(c0[0] + .8)} ${f(c0[1] - 4)}q1.6 1 1.2 3M${f(c0[0] + .9)} ${f(c0[1] + 1)}q1.4 1 1 3.4`, .3, '#a89e88', .9); }
    // the tie under the fingers: the cord's wrap round the gathered neck and its two ends hanging out of the fist
    { const n0 = [BAG[0] - 3.2, BAG[1] - 16.9], n1 = [BAG[0] + 3.4, BAG[1] - 17.1];
      const tf = nid('tf', u);
      arm1 += h1.back + `<defs><filter id="${tf}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".7 .06 0 0 0  .04 .5 0 0 0  0 .04 .34 0 0  0 0 0 1 0"/></filter></defs><g filter="url(#${tf})">`
        + K.rope(u, L, [n0, [BAG[0], BAG[1] - 15.9], n1], { r: .7, seed: 31 })
        + K.rope(u, L, [[BAG[0] + 2.2, BAG[1] - 17], [BAG[0] + 4.6, BAG[1] - 14.4], [BAG[0] + 4.2, BAG[1] - 10.6]], { r: .5, seed: 32, whip: true })
        + K.rope(u, L, [[BAG[0] + 1.4, BAG[1] - 16.8], [BAG[0] + 2.4, BAG[1] - 13.6], [BAG[0] + 1.2, BAG[1] - 11.2]], { r: .48, seed: 33, whip: true }) + '</g>'
        + h1.front; }

    // ——— the hired captain's hand with the open fan: a red silk sleeve with a gold border from the right edge ———
    const h2 = handAt(u, { s: 2.8, m: -1, roll: 46, pitch: -4, pose: 'wrap', r: .5, tone: SKIN2, light: [-.62, -.78], sw: .32, palmW: .9, wristW: .8 }, G2, -98, 190);
    let fan = '';
    { const ax = h2.axis[1] < 0 ? h2.axis : [-h2.axis[0], -h2.axis[1]], piv = [G2[0] - ax[0] * 6, G2[1] - ax[1] * 6];
      const a0 = Math.atan2(ax[1], ax[0]), A0 = a0 - 1.32, A1 = a0 + 1.18, r0 = 16.5, r1 = 33.5, N = 18;
      const at = (a, r) => [piv[0] + Math.cos(a) * r, piv[1] + Math.sin(a) * r];
      // the leaf: pleats, each its own tone (folds towards and away from the lamp), a gold band at the edge
      for (let i = 0; i < N; i++) { const a = lerp(A0, A1, i / N), b = lerp(A0, A1, (i + 1) / N), lit = i % 2 === 0, warm = .5 + .5 * Math.cos((a + b) / 2 - (-2.2));
        fan += `<path d="M${P2(at(a, r0))}L${P2(at(a, r1))}L${P2(at(b, r1 + (lit ? .4 : -.2)))}L${P2(at(b, r0))}Z" fill="${mix(lit ? '#c8302a' : '#7a1410', '#ff8a50', warm * .25)}" stroke="#3a0604" stroke-width=".2"/>`; }
      fan += `<path d="M${P2(at(A0, r1 - 2.6))}A${r1 - 2.6} ${r1 - 2.6} 0 0 1 ${P2(at(A1, r1 - 2.6))}" stroke="#d8a840" stroke-width="1.2" fill="none" opacity=".85"/>`
        + `<path d="M${P2(at(A0, r0 + 1.4))}A${r0 + 1.4} ${r0 + 1.4} 0 0 1 ${P2(at(A1, r0 + 1.4))}" stroke="#d8a840" stroke-width=".6" fill="none" opacity=".8"/>`;
      // painted on the leaf: a gold wave and a few clouds
      { let d = ''; for (let i = 0; i <= 24; i++) { const a = lerp(A0 + .12, A1 - .12, i / 24), rr = 21 + Math.sin(i * 1.3) * 2.2; d += (i ? 'L' : 'M') + P2(at(a, rr)); } fan += ln(d, .55, '#e8b848', .75); }
      for (const [a, rr] of [[.3, 25], [.62, 18], [.8, 25.6]]) { const c = at(lerp(A0, A1, a), rr); fan += `<path d="M${f(c[0] - 1.6)} ${f(c[1])}a1 1 0 0 1 1.6 -1a1.2 1.2 0 0 1 2 .6a.9 .9 0 0 1 .4 1.4z" fill="none" stroke="#e8c060" stroke-width=".35" opacity=".8"/>`; }
      // the guard sticks: dark lacquer ribs from the pivot, the outer guards thicker; the rivet
      for (let i = 0; i <= N; i += 2) { const a = lerp(A0, A1, i / N); fan += ln(`M${P2(at(a, 1.2))}L${P2(at(a, r0 + 1))}`, i === 0 || i === N ? .9 : .45, '#1e0804', .95); }
      fan += ln(`M${P2(at(A0, 1.2))}L${P2(at(A0, r1 + .4))}`, .9, '#2a0a06') + ln(`M${P2(at(A1, 1.2))}L${P2(at(A1, r1 + .4))}`, .9, '#2a0a06')
      // the sticks' heads: the bundle closing under the fist's little finger into a rounded end round the rivet;
      // the tassel's cord from that end
      { const nx = -ax[1], ny = ax[0], e = [piv[0] - ax[0] * 2.4, piv[1] - ax[1] * 2.4], b0 = [piv[0] + ax[0] * 2.2, piv[1] + ax[1] * 2.2];
        fan += `<path d="M${f(b0[0] + nx * 1.9)} ${f(b0[1] + ny * 1.9)}L${f(e[0] + nx * 1.3)} ${f(e[1] + ny * 1.3)}Q${f(e[0] - ax[0] * 1.6)} ${f(e[1] - ax[1] * 1.6)} ${f(e[0] - nx * 1.3)} ${f(e[1] - ny * 1.3)}L${f(b0[0] - nx * 1.9)} ${f(b0[1] - ny * 1.9)}Z" fill="#2a0c06" stroke="#0e0402" stroke-width=".3"/>`
          + ln(`M${f(b0[0] - nx * 1.2)} ${f(b0[1] - ny * 1.2)}L${f(e[0] - nx * .8)} ${f(e[1] - ny * .8)}`, .35, '#c86a3a', .55)
          + ln(`M${f(b0[0] + nx * .2)} ${f(b0[1] + ny * .2)}L${f(e[0] + nx * .1)} ${f(e[1] + ny * .1)}M${f(b0[0] + nx * 1)} ${f(b0[1] + ny * 1)}L${f(e[0] + nx * .7)} ${f(e[1] + ny * .7)}`, .2, '#0a0302', .8)
          + K.shadeSphere(u, piv[0], piv[1], .95, L, 'brass', { outline: .25 })
          + `<path d="M${f(e[0])} ${f(e[1])}q-.5 2.6 .4 5.2" stroke="#c89030" stroke-width=".5" fill="none"/><circle cx="${f(e[0] + .4)}" cy="${f(e[1] + 5.8)}" r=".8" fill="#e8b040"/>`
          + ln(`M${f(e[0] + .4)} ${f(e[1] + 6.4)}l-.5 2.2M${f(e[0] + .4)} ${f(e[1] + 6.4)}l.1 2.4M${f(e[0] + .4)} ${f(e[1] + 6.4)}l.6 2.1`, .3, '#e0a838', .9); }
      // the fist's soft shadow on the sticks and the leaf (the lamp is up and to the left)
      { const sid = nid('fs', u), c = [lerp(G2[0], h2.wrist[0], .3) + 2.6, lerp(G2[1], h2.wrist[1], .3) + 1.6];
        fan += `<defs>${blurF(sid, 1.2)}</defs><ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="7" ry="5.4" fill="#1a0402" opacity=".5" filter="url(#${sid})"/>`; }
      // the lamp through the thin silk near its top edge, the moon's thin line on the far edge
      fan += glow(u, at(-2.1, 26)[0], at(-2.1, 26)[1], 10, 7, '#ffb070', .25) + ln(`M${P2(at(A1 - .3, r1 + .2))}L${P2(at(A1, r1 + .4))}`, .45, '#b8c8ff', .6); }
    let arm2 = '';
    { const W = h2.wrist, EL = [W[0] + 24, W[1] + 18], silk = { lit: '#e04a34', half: '#a01c14', core: '#7a120c', shadow: '#3a0604', outline: '#1a0202' };
      // a wide silk sleeve, opening out towards the wrist; smooth silk: no creases, long sheen lines instead
      const spine = [[232, 128], [EL[0] + 6, EL[1] + 4], EL, [lerp(EL[0], W[0], .5), lerp(EL[1], W[1], .5) + 1.4], [W[0] + 2.4, W[1] + .6]];
      arm2 += H.cloth(u, { spine, w: [17, 17.6, 18.6, 20.4, 22.4], tone: silk, lit: -1, seed: 9, folds: false, sw: .4,
        cuff: { from: .93, k: 1.03, tone: { lit: '#e0b450', half: '#a07624', shadow: '#4a3008', outline: '#2a1a04' } } });
      for (const [o2, c, w, op] of [[-.32, '#ff8a6a', .9, .45], [-.12, '#ffb090', .4, .35], [.3, '#4a0604', 1.1, .45]]) {
        const pts = spine.slice(1).map((p, i, a) => { const q = a[Math.min(a.length - 1, i + 1)], r0 = a[Math.max(0, i - 1)], dx = q[0] - r0[0], dy = q[1] - r0[1], l = Math.hypot(dx, dy) || 1, ww = [17.6, 18.6, 20.4, 22.4][i] / 2;
          return [p[0] - dy / l * ww * o2 * 2, p[1] + dx / l * ww * o2 * 2]; });
        arm2 += ln(H.sp(pts.slice(0, -1).concat([[lerp(pts[pts.length - 2][0], pts[pts.length - 1][0], .8), lerp(pts[pts.length - 2][1], pts[pts.length - 1][1], .8)]])), w, c, op); }
      // the bend at the elbow: the silk gathers on its inner (upper) side into a shadow and three soft folds
      // running across the sleeve from it, each with a lit ridge beside its crease
      { const T = H.tube(spine, [17, 17.6, 18.6, 20.4, 22.4]), sh = nid('sb', u), cl = nid('sc', u), body = T.outline(0, T.N, 1);
        const strip = T.edge(.98, 8, 20).concat(T.edge(.25, 8, 20).reverse());
        arm2 += `<defs>${blurF(sh, .9)}<clipPath id="${cl}"><path d="${H.sp(body, true)}"/></clipPath></defs><g clip-path="url(#${cl})">`
          + `<path d="${H.sp(strip, true)}" fill="#2a0202" opacity=".7" filter="url(#${sh})"/>`;
        for (const [i, k] of [[10, 1], [13, .85], [17, .7]]) { const c = (a, b, s0, s1, s2) => H.sp([T.at(a, s0), T.at(Math.round((a + b) / 2), s1), T.at(b, s2)]);
          arm2 += ln(c(i, i + 4, .96, .3 * k, -.4 * k), 1.4, '#320202', .7) + ln(c(i + 1, i + 5, .9, .22 * k, -.42 * k), .6, '#ff9a78', .45); }
        arm2 += '</g>'; }
      // the border's pattern: small squared spirals in dark thread; a white inner sleeve at the wrist
      const c0 = [W[0] + 3.4, W[1] + .6];
      for (let i = -3; i <= 3; i++) arm2 += `<path d="M${f(c0[0] + i * .15)} ${f(c0[1] + i * 2.1 - .6)}h1v1h-.6" stroke="#5a3008" stroke-width=".3" fill="none" opacity=".8"/>`;
      arm2 += `<path d="M${f(W[0] + .2)} ${f(W[1] - 4)}Q${f(W[0] + 1.8)} ${f(W[1])} ${f(W[0] + .2)} ${f(W[1] + 4.4)}L${f(W[0] + 1.4)} ${f(W[1] + 4.2)}Q${f(W[0] + 2.8)} ${f(W[1])} ${f(W[0] + 1.4)} ${f(W[1] - 4)}Z" fill="#d8ccb4" stroke="#5a5040" stroke-width=".3"/>`; }

    // ——— the big lantern over the table, last: in front of the back wall; the air ———
    const big = lantern(LAMP, -2) + K.localGlow(u, { x: LAMP.x, y: LAMP.y, color: '#ffb060', power: .5, radius: 60 }, { core: false });
    const air = motes(18, 60, 20, 80, 60, '#ffd8a0', 9) + gloom(u, 100, 60, 0, 0, .35, '#0a0204') + gloom(u, 100, 60, 200, 0, .3, '#0a0204')
      + gloom(u, 100, 118, 100, 280, .55, '#0a0204');
    return [room + lamps, table + chart + tea + figs + bag + arm1 + arm2 + h2.back + fan + h2.front + big + air];
  } };
