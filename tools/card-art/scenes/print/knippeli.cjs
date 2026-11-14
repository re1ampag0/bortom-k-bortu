// «Книппели» (Жемчужина, ЗАРЯД, Залп бьёт по Парусам), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Книппели']): looking up the mainmast of a Company ship at night. The spinning chain
// shot — two balls on a short chain — has just snapped the topsail yard's left arm and flies on up through the
// topgallant, leaving a ragged rent behind it from the balls down to the sail's torn-loose clew; the broken arm hangs from its lift, the topsail is torn off it and flogs, the topmast shrouds have
// parted, splinters, a block and rope ends fall. The moon high on the right shines through the canvas (the sails
// glow, the shot and the rigging stand dark on them). Below, under the glass: the course, the rail, a strip of sea.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;

const HZ = 240, RAIL = 252;   // the eye level is low: we look up the mast; the far rail of the deck
const MOON = { x: 152, y: 26 };
const light = { time: 'night', haze: .3, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#d4e0f6', power: .85 }, fill: { color: '#3a5480', power: .42 },
  rim: { az: 20, color: '#cfe4ff', power: .7 } };
const SHOT = { x: 52, y: 64, a: -28, r: 5.8, len: 30 };   // the chain shot: middle, angle of the chain, ball radius, ball to ball
const BRK = { x: 64, y: 92 };                               // where the topsail yard snapped
const RIP = [[49, 70], [26, 90.5]];                         // the rent in the topgallant: from behind the balls to its clew
const skel = { horizon: HZ, eye: 1.7, light: 'moon high right, behind the sails', items: [
  ['chainshot', SHOT.x - 18, SHOT.y, 36, 20, 'in flight'], ['mast', 92, 290, 16, 276, 'deck'], ['topgallant', 22, 90, 156, 40, 'yard'],
  ['topsail', -6, 150, 214, 58, 'yard (left arm broken)'], ['brokenArm', 18, 128, 48, 36, 'lift'], ['course', -12, 230, 224, 80, 'yard'],
  ['block', 86, 120, 8, 10, 'falling'], ['rail', -10, 290, 220, 38, 'deck']] };

module.exports = { name: 'Книппели', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ });
    const R = rng(23);
    const cyl = (x1, y1, x2, y2, r1, r2 = r1, o = {}) => K.shadeCyl(u, x1, y1, x2, y2, r1, L, o.kind || 'oak', Object.assign({ r1, r2, outline: .35 }, o));
    const line = (d, w = .5, c = '#0e0d0c', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    // the canvas lit through by the moon behind it: one gradient for every sail, brightest near the moon
    const sg = nid('sg', u), sgDefs = radGrad(sg, MOON.x, MOON.y, 230, [[0, '#f6f2de'], [.14, '#e0dcc6'], [.32, '#aeac9c'], [.52, '#74766e'], [.76, '#40444c'], [1, '#22262e']]);
    // sail: top edge on its yard (tl..tr, sagging to the middle), leeches to the clews (bl, br), the foot with a roach;
    // cloths (seams) run down; the reef band under the yard; the belly darkens under the yard and at the foot
    const sail = (P, o = {}) => {
      const { tl, tr, bl, br } = P, sag = o.sag || 2, roach = o.roach || 3, id = nid('sl', u), bid = nid('sb', u);
      const d = o.d || `M${f(tl[0])} ${f(tl[1])}Q${f((tl[0] + tr[0]) / 2)} ${f((tl[1] + tr[1]) / 2 - sag)} ${f(tr[0])} ${f(tr[1])}Q${f((tr[0] + br[0]) / 2 + (o.leech || 2))} ${f((tr[1] + br[1]) / 2)} ${f(br[0])} ${f(br[1])}`
        + `Q${f((bl[0] + br[0]) / 2)} ${f((bl[1] + br[1]) / 2 - roach)} ${f(bl[0])} ${f(bl[1])}Q${f((tl[0] + bl[0]) / 2 - (o.leech || 2))} ${f((tl[1] + bl[1]) / 2)} ${f(tl[0])} ${f(tl[1])}Z`;
      const y0 = Math.min(tl[1], tr[1]), y1 = Math.max(bl[1], br[1]), h = y1 - y0;
      const hid = nid('sh', u), x0 = Math.min(tl[0], bl[0]), x1 = Math.max(tr[0], br[0]);
      let out = `<defs>${linGrad(bid, 0, y0, 0, y1, [[0, '#0a0c12', .55], [.12, '#0a0c12', .18], [.45, '#0a0c12', 0], [.8, '#0a0c12', .12], [1, '#0a0c12', .4]])}`
        + `${linGrad(hid, x0, 0, x1, 0, [[0, '#0a0c12', .45], [.18, '#0a0c12', .12], [.5, '#0a0c12', 0], [.82, '#0a0c12', .1], [1, '#0a0c12', .35]])}<clipPath id="${id}"><path d="${d}"/></clipPath></defs>`
        + `<path d="${d}" fill="url(#${sg})"/><g clip-path="url(#${id})"><rect x="-20" y="${f(y0 - 5)}" width="240" height="${f(h + 10)}" fill="url(#${bid})"/><rect x="-20" y="${f(y0 - 5)}" width="240" height="${f(h + 10)}" fill="url(#${hid})"/>`;
      // the cloths: seams from the yard to the foot, fanning with the sail, a little bowed by the wind
      const n = o.cloths || 12;
      for (let i = 1; i < n; i++) { const t = i / n, a = [tl[0] + (tr[0] - tl[0]) * t, tl[1] + (tr[1] - tl[1]) * t - sag * 4 * t * (1 - t)], b = [bl[0] + (br[0] - bl[0]) * t, bl[1] + (br[1] - bl[1]) * t - roach * 4 * t * (1 - t)];
        const bow = (t - .5) * 3;
        out += `<path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2 + bow)} ${f((a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}" stroke="#1a1c22" stroke-width=".45" fill="none" opacity=".42"/>`
          + `<path d="M${f(a[0] + .7)} ${f(a[1])}Q${f((a[0] + b[0]) / 2 + bow + .7)} ${f((a[1] + b[1]) / 2)} ${f(b[0] + .7)} ${f(b[1])}" stroke="#fffbe8" stroke-width=".3" fill="none" opacity=".12"/>`; }
      // the reef band with its points, a few creases from the clews
      if (o.reef !== false) { const ry = h * .16;
        out += `<path d="M${f(tl[0] - 4)} ${f(tl[1] + ry)}Q${f((tl[0] + tr[0]) / 2)} ${f((tl[1] + tr[1]) / 2 + ry - sag)} ${f(tr[0] + 4)} ${f(tr[1] + ry)}" stroke="#1a1c22" stroke-width=".8" fill="none" opacity=".45"/>`;
        for (let x = tl[0] + 3; x < tr[0] - 2; x += 4.2) out += `<path d="M${f(x)} ${f(tl[1] + ry - .4 - sag * .5)}v2" stroke="#1a1c22" stroke-width=".35" opacity=".5"/>`; }
      for (const [c, s] of [[bl, 1], [br, -1]]) for (let k = 0; k < 3; k++) out += `<path d="M${f(c[0])} ${f(c[1])}q${f(s * (12 + k * 8))} ${f(-6 - k * 5)} ${f(s * (26 + k * 12))} ${f(-14 - k * 9)}" stroke="#0e1016" stroke-width="${f(1.4 - k * .3)}" fill="none" opacity=".18"/>`;
      out += (o.inner || '') + `</g>`;
      // the bolt rope along the edges: dark, a rim of moonlight on the side towards the moon
      out += `<path d="${d}" fill="none" stroke="#14161a" stroke-width=".7"/>`;
      return out;
    };
    // a ragged hole in the canvas, the sky (lit near the moon) seen through it
    const hole = (x, y, r, seed) => { const Rh = rng(seed); let d = ''; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = r * (.6 + Rh() * .6); d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr * .8); }
      return `<path d="${d}Z" fill="#1c2a44" stroke="#f0ecd8" stroke-width=".4" stroke-opacity=".6"/>`; };

    // ——— the sky: stars, the moon high on the right, thin cloud drifting
    let bg = `<defs>${sgDefs}</defs>` + K.sky(u, L, { horizon: HZ, stars: 70, seed: 12 }) + K.sunMoon(u, L, { r: 7.5 });
    bg += K.cloud(u, L, { x: 182, y: 70, w: 44, h: 6, seed: 7, far: .25 }) + K.cloud(u, L, { x: 18, y: 30, w: 50, h: 6, seed: 3, far: .3 });
    // the sea beyond the rail under the glass, the far rail and the bulwark
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 2, swell: .4, seed: 5, glitter: MOON.x });
    bg += K.bulwark(u, L, { x1: -10, x2: 210, y: 292, h: 40, kind: 'oak', posts: 30, seed: 4 });

    // ——— the course (the main sail) on the main yard: the biggest, mostly under the glass, lit through
    let rig = sail({ tl: [-8, 152], tr: [208, 152], bl: [-2, 232], br: [202, 232] }, { sag: 3, roach: 4, cloths: 18, inner: hole(150, 196, 3.4, 1) + hole(42, 210, 2.6, 2) });
    // ——— the topsail: its right part whole; the left part torn away from the broken arm, a ragged edge
    const TS = { tl: [BRK.x, 93.5], tr: [184, 93.5], bl: [-8, 150], br: [208, 150] };
    { const Rt = rng(41), edge = []; // the tear runs from the break down and out to the left leech
      for (let i = 0; i <= 10; i++) { const t = i / 10, x = BRK.x + (2 - BRK.x) * t + (Rt() - .5) * 6 * Math.sin(t * Math.PI), y = 94 + (126 - 94) * t + (Rt() - .5) * 5; edge.push([x, y]); }
      const d = `M${f(TS.tl[0])} ${f(TS.tl[1])}Q122 91.5 ${TS.tr[0]} ${TS.tr[1]}Q198 122 ${TS.br[0]} ${TS.br[1]}Q100 145 ${TS.bl[0]} ${TS.bl[1]}L-8 128` + edge.slice().reverse().map(p => `L${f(p[0])} ${f(p[1])}`).join('') + 'Z';
      rig += sail(TS, { d, cloths: 14, roach: 5, inner: hole(150, 120, 2.8, 4) });
      // loose threads and frayed strips along the tear, the light through the frayed edge
      for (let i = 1; i < edge.length - 1; i++) { const [x, y] = edge[i], l = 3 + Rt() * 6; rig += line(`M${f(x)} ${f(y)}q${f(-l * .6)} ${f(-1 - Rt() * 2)} ${f(-l)} ${f(-3 - Rt() * 3)}`, .6 + Rt() * .5, '#cfcab4', .7); }
      rig += `<path d="M${edge.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="#fff6dc" stroke-width=".6" fill="none" opacity=".55"/>`; }
    // ——— the topgallant: whole, nearest the moon — the brightest canvas, the shot crosses it
    rig += sail({ tl: [52, 54], tr: [150, 54], bl: [24, 90], br: [178, 90] }, { sag: 1.6, roach: 2.5, cloths: 10 });
    // the rent the chain shot tore in it: from just behind the balls down along their flight to the lower left corner,
    // over the broken arm — narrow where the balls went through, gaping and ragged at the clew, which is torn loose;
    // the night sky through it, a lit frayed edge, threads standing out of both edges and bridging the narrow end
    { const Rr = rng(53), P0 = RIP[0], P1 = RIP[1], n = 14, Lt = [], Rt = [];
      const dx = P1[0] - P0[0], dy = P1[1] - P0[1], len = Math.hypot(dx, dy), tx = dx / len, ty = dy / len, nx = -ty, ny = tx;
      for (let i = 0; i <= n; i++) { const t = i / n, w = .7 + 5.4 * Math.pow(t, 1.15), cx = P0[0] + dx * t + Math.sin(t * 9) * .9 * t, cy = P0[1] + dy * t;
        Lt.push([cx + nx * (w + (Rr() - .5) * 1.4 * t), cy + ny * (w + (Rr() - .5) * 1.4 * t)]); Rt.push([cx - nx * (w + (Rr() - .5) * 1.4 * t), cy - ny * (w + (Rr() - .5) * 1.4 * t)]); }
      const pts = Lt.concat(Rt.slice().reverse()), d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', rg = nid('rg', u);
      // the canvas pulled away from the rent darkens along it
      rig += `<path d="${d}" fill="none" stroke="#0e1016" stroke-width="2.4" stroke-linejoin="round" opacity=".32"/>`
        + `<defs>${linGrad(rg, P0[0], P0[1], P1[0], P1[1], [[0, '#22304a'], [1, '#141c30']])}</defs><path d="${d}" fill="url(#${rg})"/>`
        + `<circle cx="${f(P1[0] + 1.5)}" cy="${f(P1[1] - 4)}" r=".45" fill="#e8eeff"/><circle cx="${f(P0[0] - 7)}" cy="${f(P0[1] + 9)}" r=".3" fill="#e8eeff" opacity=".8"/>`;
      // the frayed edges: lit on the side towards the moon, dark on the other
      rig += line('M' + Lt.map(p => f(p[0]) + ' ' + f(p[1])).join('L'), .55, '#fff4d8', .75) + line('M' + Rt.map(p => f(p[0]) + ' ' + f(p[1])).join('L'), .5, '#e8e2c8', .55);
      // loose threads: out of both edges into the gap and hanging down; across the narrow end a few still bridge it
      // (0–3 per segment, at random points along it, of very different length and droop — no regular comb)
      for (const [E, s] of [[Lt, -1], [Rt, 1]]) for (let i = 1; i < E.length; i++) for (let k = 0, m = Math.floor(Rr() * 3.4); k < m; k++) {
        const v = Rr(), x = E[i - 1][0] + (E[i][0] - E[i - 1][0]) * v, y = E[i - 1][1] + (E[i][1] - E[i - 1][1]) * v, q = i / n, l = .6 + Math.pow(Rr(), 1.6) * (2.4 + q * 5), a = Math.atan2(ny * s, nx * s) + (Rr() - .5) * 1.8 + .5;
        rig += line(`M${f(x)} ${f(y)}q${f(Math.cos(a) * l * .5)} ${f(Math.sin(a) * l * .5 + .3)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l + .8 + Rr() * .8)}`, .22 + Rr() * .2, Rr() > .3 ? '#e4dec6' : '#9a968a', .85); }
      for (let i = 1; i < 5; i++) rig += line(`M${f(Lt[i][0])} ${f(Lt[i][1])}Q${f((Lt[i][0] + Rt[i][0]) / 2)} ${f((Lt[i][1] + Rt[i][1]) / 2 + .8)} ${f(Rt[i][0])} ${f(Rt[i][1])}`, .2, '#e4dec6', .8);
      // the corner torn loose: a flap of canvas hanging out of the leech, curled, its frayed end flogging down-left
      rig += `<path d="M${f(Lt[9][0])} ${f(Lt[9][1])}Q22 88 15 97L18 96.4Q19 99 16.6 101L20.6 97.6Q25 93 ${f(Lt[13][0])} ${f(Lt[13][1])}Z" fill="#5c5e5c" stroke="#1a1c22" stroke-width=".35"/>`
        + line(`M${f(Lt[9][0])} ${f(Lt[9][1])}Q22 88 15 97`, .4, '#e8e2c8', .55) + line('M16.6 101q-1 2 -.4 4M18 96.4q-2 1.6 -2.6 3.8M15 97q-2.2 .6 -3.6 2.6', .25, '#c8c2ac', .8); }

    // ——— the masts: lower mast from the deck to the top, topmast to the crosstrees, topgallant to the truck
    let mast = cyl(105, 296, 103, 134, 5.4, 4.4) + cyl(101.5, 142, 100.5, 60, 3.2, 2.5) + cyl(99.6, 68, 99, 16, 1.9, 1.2);
    // the doublings: the cap and the hounds where one mast overlaps the next
    mast += K.shadeBox(u, [{ pts: [[95, 136], [110, 136], [109, 141], [96, 141]], n: [0, -.5, .85] }], L, 'oak', { outline: .4 })
      + K.shadeBox(u, [{ pts: [[96.6, 62], [104.4, 62], [104, 66], [97, 66]], n: [0, -.5, .85] }], L, 'oak', { outline: .35 });
    // the main top seen from below: a dark platform wider than the mast, its rim catching the moon; the crosstrees
    const top = `<path d="M74 128L130 128L134 134L70 134Z" fill="#17120e"/><path d="M74 128L130 128" stroke="#a89c86" stroke-width=".6" opacity=".7"/><path d="M70 134L134 134" stroke="#0a0806" stroke-width="1"/>`
      + [80, 90, 114, 124].map(x => `<path d="M${x} 134v1.6" stroke="#0a0806" stroke-width="1.2"/>`).join('')
      + `<path d="M90 64h21" stroke="#1a1410" stroke-width="2"/><path d="M90 63.2h21" stroke="#a89c86" stroke-width=".4" opacity=".6"/>`;
    // the yards: main, topsail (the left arm snapped), topgallant; slings and the lifts from the mastheads
    let yards = cyl(-14, 151, 214, 151, 2.4, 2.4, { r1: 1.8, r2: 1.8 }) + K.shadeSphere(u, 103, 151, 3.4, L, 'oak');
    yards += cyl(BRK.x + 1, 92.4, 188, 92.4, 1.9, 1.5) + K.shadeSphere(u, 101, 92.4, 2.7, L, 'oak');
    yards += cyl(48, 53, 154, 53, 1.3, 1.1) + K.shadeSphere(u, 99.6, 53, 1.8, L, 'oak');
    // the footropes under the yards with their stirrups (the broken arm's footrope hangs slack)
    for (const [xa, xb, y, dp] of [[BRK.x + 4, 186, 92.4, 5], [50, 152, 53, 3.4], [-12, 212, 151, 6]]) {
      const n = 5; let d = ''; for (let i = 0; i < n; i++) { const a = xa + (xb - xa) * i / n, b = xa + (xb - xa) * (i + 1) / n; d += `M${f(a)} ${f(y + dp * .6)}Q${f((a + b) / 2)} ${f(y + dp)} ${f(b)} ${f(y + dp * .6)}`; d += `M${f(b)} ${f(y + 1)}L${f(b)} ${f(y + dp * .6)}`; }
      yards += line(d, .4, '#14110e', .85); }
    yards += line(`M${BRK.x + 4} ${BRK.y + 3}Q${BRK.x - 6} ${BRK.y + 22} ${BRK.x - 16} ${BRK.y + 12}`, .4, '#14110e', .85);
    // the stub of the broken arm: splintered end, raw wood pale where it tore
    { const bx = BRK.x + 1, by = 92.4; let st = '';
      for (let i = 0; i < 7; i++) { const yy = by - 1.8 + i * .6, l = 1.5 + R() * 4; st += `<path d="M${f(bx)} ${f(yy)}l${f(-l)} ${f((R() - .5) * 1.6)}l${f(l * .8)} .5Z" fill="${i % 2 ? '#e6cc9a' : '#b48a58'}" stroke="#3a2412" stroke-width=".15"/>`; }
      yards += st; }
    // the broken outer piece of the topsail yard: hangs from its lift at the yardarm, the broken end swinging down
    const AR = { a: [22, 99], b: [44, 128] };
    yards += line(`M99.6 60L${AR.a[0]} ${AR.a[1] - 1}`, .55, '#14110e');   // the topsail lift, still holding the arm
    yards += cyl(AR.a[0], AR.a[1], AR.b[0], AR.b[1], 1.5, 1.7);
    { let st = ''; for (let i = 0; i < 6; i++) { const l = 1.6 + R() * 3.4, a = Math.atan2(AR.b[1] - AR.a[1], AR.b[0] - AR.a[0]) + (R() - .5) * .9; st += `<path d="M${f(AR.b[0] + (R() - .5) * 2)} ${f(AR.b[1] + (R() - .5) * 2)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${i % 2 ? '#e6cc9a' : '#b48a58'}" stroke-width=".7" stroke-linecap="round"/>`; } yards += st; }
    // the strips of topsail still laced to the broken arm: torn into narrow ribbons that hang and flog out to the
    // left in the wind, each wavy, thinning to a frayed end; dimmer than the whole canvas (the moon is far from them)
    { const fl = nid('fl', u), Rs = rng(77); let st = `<defs>${linGrad(fl, AR.a[0], AR.a[1], 0, 140, [[0, '#b4b0a0'], [.5, '#7c7c74'], [1, '#44484e']])}</defs>`;
      for (let i = 0; i < 5; i++) { const t = .08 + i * .2, ax = AR.a[0] + (AR.b[0] - AR.a[0]) * t, ay = AR.a[1] + (AR.b[1] - AR.a[1]) * t, w0 = 1.4 + Rs() * 1.4, len = 12 + Rs() * 10, ph = Rs() * 6, n = 10;
        const C = []; for (let k = 0; k <= n; k++) { const q = k / n; C.push([ax - len * q * .8, ay + len * q * (.45 + i * .06) + Math.sin(q * 7 + ph) * 1.6 * q]); }
        const top = [], bot = []; C.forEach((c, k) => { const q = k / n, w = w0 * (1 - q * .55); top.push([c[0], c[1] - w / 2]); bot.unshift([c[0] + (Rs() - .5) * .4, c[1] + w / 2]); });
        const e = C[n]; let fr = ''; for (let k = 0; k < 3; k++) fr += `M${f(e[0])} ${f(e[1] + (k - 1) * .5)}q${f(-1.4 - Rs() * 1.4)} ${f(.4 + Rs())} ${f(-2.6 - Rs() * 2)} ${f(1 + Rs() * 1.6)}`;
        st += `<path d="M${top.concat(bot).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${fl})" stroke="#1a1c22" stroke-width=".3"/>` + line(fr, .3, '#9a988c', .8)
          + line(`M${top.map(p => f(p[0]) + ' ' + f(p[1] + .3)).join('L')}`, .25, '#e8e4d0', .35); }
      yards += st; }
    // ——— the standing rigging over the sails: lower shrouds from the channels to the top, ratlines; topmast shrouds
    // (the left ones parted — their ends curl), the stay of the topgallant, the braces
    let shr = '';
    for (const [sx, ex] of [[-18, 76], [-4, 79], [10, 82], [218, 128], [204, 125], [190, 122]]) shr += line(`M${sx} ${RAIL - 2}L${ex} 134`, .7, '#100e0c');
    for (let k = 1; k < 9; k++) { const t = k / 9.4, yy = RAIL - 2 - t * (RAIL - 136), xl = -18 + (76 + 18) * t, xr = 10 + (82 - 10) * t, xl2 = 190 + (122 - 190) * t, xr2 = 218 + (128 - 218) * t;
      shr += line(`M${f(xl)} ${f(yy)}L${f(xr)} ${f(yy - 1)}M${f(xl2)} ${f(yy - 1)}L${f(xr2)} ${f(yy)}`, .35, '#100e0c', .9); }
    // right topmast shrouds whole; the left ones parted: the lower ends whip up from the top, the upper ones hang
    shr += line('M126 129L102 64M121 129L101.6 64M116 129L101.2 64', .5, '#100e0c');
    for (let k = 0; k < 6; k++) shr += line(`M${f(124 - k * .5)} ${f(124 - k * 11)}L${f(110 - k * 1.2)} ${f(123 - k * 11)}`, .3, '#100e0c', .8);
    // (whipping S-curves, each parted end frayed into a little brush of strands — not curled hooks)
    shr += line('M76 129L83 113q1.5 -3.5 -1.2 -6.5q-2.4 -2.6 -1 -6M81 129L86 116q1.8 -4.4 4.6 -5.2q2.6 -.8 3.4 -3.6', .5, '#100e0c');
    shr += line('M99 64L92 78q-2.4 5 -6.4 6.8q-3 1.4 -4.4 4.6M99.4 64L95 84q-1 6 -5 8', .5, '#100e0c');
    for (const [x, y, a] of [[80.8, 100.5, -100], [94, 107.2, -60], [81.2, 89.4, 110], [90, 92, 140]]) for (let k = -1; k <= 1; k++) {
      const r = (a + k * 22) * Math.PI / 180, l = 1.4 + (k === 0 ? .6 : 0); shr += line(`M${x} ${y}l${f(Math.cos(r) * l)} ${f(Math.sin(r) * l)}`, .25, '#3a3028', .9); }
    // the braces and the lifts of the course and the topgallant
    shr += line('M99 22L50 53M99 22L152 53M101 66L214 151', .4, '#14110e', .85);
    shr += line('M150 54L210 34M52 54L-10 38', .4, '#14110e', .8);

    // ——— the Company pennant streaming from the truck to the left, red and white, forked
    { const pg = nid('pg', u), d = 'M99 15q-10 -3 -18 0t-14 1t-14 4l5 1l-6 3q8 -1 14 -3t13 -2t20 -1z';
      mast += `<defs>${linGrad(pg, 99, 0, 48, 0, [[0, '#d8d2c4'], [1, '#8a8478']])}</defs><path d="${d}" fill="url(#${pg})"/>`
        + `<path d="M99 16.4q-10 -2.4 -18 .6t-14 1.4t-13 4" stroke="#a8302a" stroke-width="1.6" fill="none"/>` + K.shadeSphere(u, 99, 14, 2.2, L, 'oak'); }

    // ——— the chain shot: two balls on a taut chain, spinning; the blur disc of the spin, the trail from the break
    let shot = '';
    { const { x, y, a, r, len } = SHOT, ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180), h = len / 2;
      const A = [x - ca * h, y - sa * h], B = [x + ca * h, y + sa * h], bl = nid('bl', u), tr = nid('tr', u);
      shot += `<defs><filter id="${bl}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>${linGrad(tr, RIP[1][0], RIP[1][1], x, y, [[0, '#dfe6ee', 0], [1, '#dfe6ee', .28]])}</defs>`
        // the trail: up along the rent it tore, from the torn clew to the shot, a soft streak
        + `<path d="M${RIP[1][0] + 2} ${RIP[1][1]}Q${x - 10} ${y + 14} ${x} ${y}" stroke="url(#${tr})" stroke-width="6" fill="none" filter="url(#${bl})"/>`
        // the swept disc: a faint grey ring where the balls have been in this instant
        + `<ellipse cx="${x}" cy="${y}" rx="${h + r}" ry="${f((h + r) * .8)}" fill="#c8d0dc" opacity=".12" filter="url(#${bl})"/>`
        + `<ellipse cx="${x}" cy="${y}" rx="${h}" ry="${f(h * .8)}" fill="none" stroke="#e4eaf2" stroke-width="${f(r * 1.4)}" opacity=".22" filter="url(#${bl})"/>`
        + `<path d="M${f(x - h - 1)} ${f(y + 6)}a${h + 1} ${f((h + 1) * .8)} 0 0 1 ${f(9)} ${f(-14)}M${f(x + h + 1)} ${f(y - 6)}a${h + 1} ${f((h + 1) * .8)} 0 0 1 ${f(-9)} ${f(14)}" stroke="#eef4fa" stroke-width=".8" fill="none" opacity=".6"/>`;
      shot += K.chain(u, L, [[A[0] + ca * r * .8, A[1] + sa * r * .8], [x, y + 1], [B[0] - ca * r * .8, B[1] - sa * r * .8]], { link: 3.6, seed: 5 });
      for (const [px, py] of [A, B]) shot += K.shadeSphere(u, px, py, r, L, 'iron', { outline: .6 }) + `<circle cx="${f(px - ca * r * .9)}" cy="${f(py - sa * r * .9)}" r="1.1" fill="url(#iron${u})" stroke="#0a0a0a" stroke-width=".3"/>`;
      // a cold glint of the moon on each ball (the moon is up and to the right)
      for (const [px, py] of [A, B]) shot += `<circle cx="${f(px + r * .38)}" cy="${f(py - r * .42)}" r="${f(r * .2)}" fill="#f4f8ff" opacity=".9"/>`; }

    // ——— the burst at the break: splinters flying up and out, rope ends, a block and a fid falling
    let fall = '';
    for (let i = 0; i < 24; i++) { const a = -Math.PI * (.2 + R() * 1.1), d = 4 + R() * 26, l = 1.4 + R() * 3.6, rot = a + (R() - .5) * 2, w = .4 + R() * .5;
      const cx = BRK.x + Math.cos(a) * d, cy = BRK.y + Math.sin(a) * d * .8 + (R() > .6 ? 18 * R() : 0), dx = Math.cos(rot) * l / 2, dy = Math.sin(rot) * l / 2, nx = -dy / l * w * 2, ny = dx / l * w * 2;
      fall += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx)} ${f(cy - ny)}Z" fill="${R() > .45 ? '#e8d0a0' : '#a87c4a'}" stroke="#2a180a" stroke-width=".15"/>`; }
    // scraps of canvas torn out by the shot, fluttering down along its track (nothing burns: chain shot only tears)
    { const Rs = rng(91);
      for (const [cx, cy, w, rot] of [[38, 100, 4.2, 30], [58, 108, 3.2, -24], [30, 116, 3.6, 62], [70, 120, 2.6, 10], [44, 82, 2.4, -50]]) {
        const top = [[-w, -w * .25], [-w * .1, -w * .5], [w * 1.1, -w * .2]].map(([x, y]) => [x + (Rs() - .5) * w * .3, y + (Rs() - .5) * w * .3]);
        // the torn lower edge: from the right corner back to the left one in uneven bites — teeth of different
        // depth and pitch, never a regular saw
        const a0 = [w * .6 + (Rs() - .5) * w * .3, w * .3], a1 = [-w * .7 + (Rs() - .5) * w * .3, w * .32], rag = [a0];
        for (let t = 0; t < 1;) { t = Math.min(1, t + .1 + Rs() * .28); const x = a0[0] + (a1[0] - a0[0]) * t, y = a0[1] + (a1[1] - a0[1]) * t;
          rag.push([x + (Rs() - .5) * w * .12, y + (Rs() > .45 ? w * (.08 + Rs() * .4) : -w * Rs() * .12)]); }
        const pts = top.concat(rag), d = 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';
        // 2–3 threads hanging from the torn edge, each its own length and droop
        let th = ''; for (let k = 0, n = 2 + (Rs() > .5 ? 1 : 0); k < n; k++) { const q = rag[1 + Math.floor(Rs() * (rag.length - 2))], l = w * (.5 + Rs() * .9);
          th += `M${f(q[0])} ${f(q[1])}q${f((Rs() - .5) * l * .6)} ${f(l * .5)} ${f((Rs() - .5) * l * .5)} ${f(l)}`; }
        fall += `<g transform="translate(${cx} ${cy}) rotate(${rot})"><path d="${d}" fill="#6e6e68" stroke="#1a1c22" stroke-width=".25" stroke-linejoin="round"/>`
          + `<path d="M${f(top[0][0])} ${f(top[0][1])}L${f(top[1][0])} ${f(top[1][1])}L${f(top[2][0])} ${f(top[2][1])}" stroke="#f4eed8" stroke-width=".35" fill="none" opacity=".7"/>`
          + `<path d="M${f(-w * .6)} ${f(-w * .1)}L${f(w * .7)} ${f(-w * .05)}" stroke="#4a4c4e" stroke-width=".25" opacity=".6"/>`
          + `<path d="${th}" stroke="#bdb8a4" stroke-width=".22" fill="none" opacity=".85" stroke-linecap="round"/></g>`; } }
    // the block (falling, tumbling) with a bit of rope, a second smaller one further down
    for (const [bx, by, s, rot] of [[86, 116, 1, 28], [56, 142, .7, -40]]) {
      fall += `<g transform="translate(${bx} ${by}) rotate(${rot}) scale(${s})"><rect x="-3.4" y="-4.4" width="6.8" height="8.8" rx="3" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/><circle r="1.5" fill="url(#iron${u})" stroke="#0a0a0a" stroke-width=".3"/><path d="M-2.6 -3.8q2.6 -1.4 5.2 0" stroke="#e0c090" stroke-width=".4" fill="none" opacity=".6"/></g>`
        + line(`M${bx} ${by - 4 * s}q${f(4 * s)} ${f(-8 * s)} ${f(-1 * s)} ${f(-16 * s)}q-3 -4 1 -8`, .6 * s, '#3a2c1c'); }
    // loose rope ends of the reef points and the bunt lines whipping in the wind
    fall += line('M70 96q4 6 1 12q-2 4 2 8M76 94q5 4 4 10M58 98q-2 8 2 12', .55, '#c8b48c', .8);

    // ——— the light: the moon's glow on the canvas round it, the air; the dark at the foot of the frame
    let lt = K.localGlow(u, { x: 140, y: 64, color: '#dfe8ff', power: .22, radius: 70 }, { core: false });
    { const g = nid('gl', u); lt += `<defs>${linGrad(g, 0, 170, 0, 290, [[0, '#04070e', 0], [.5, '#04070e', .3], [1, '#04070e', .55]])}</defs><rect x="0" y="170" width="200" height="120" fill="url(#${g})"/>`; }
    return [bg, rig + top + mast + yards + shr + fall + shot + lt];
  } };
