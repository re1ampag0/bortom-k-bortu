// «Жестокая дисциплина» (Месть королевы Анны, ПРИКАЗ: возьмите 2 карты; в этот ход можно сыграть на 2 карты больше;
// потеряйте 1 Команду), refined from the first-round scene (portrait-revenge.cjs SCENES['Жестокая дисциплина']): the
// flogging mast of the Revenge at night — the cat-o'-nine-tails hanging on a forged nail, the irons on a chain from a
// ringbolt, a lantern on its bracket, notches cut into the wood, a red haze round the moon. Kept: all of that and the
// mast big in the middle. Fixed against the first round: the mast stood before a flat strip of rail — now it stands on
// the Revenge's deck seen in depth (2,5D: the deck, her red-painted bulwarks and the bow running to one vanishing
// point; the foremast with her crimson course furled on its yard, the shrouds, the bowsprit, the sea beyond); the cat
// was a stack of strokes — now a turned leather handle with a Turk's head, a lanyard over the nail, nine knotted
// tails hanging in a fan; the notches are tallies — groups of four struck through, the last group unfinished; the
// irons are a pair of hinged cuffs on a real chain; the lantern hangs on the kit's ship lantern with its light.
// Light: the lantern on the bracket, left (key, warm: the mast's lit side, the cat, the notches); the red moon high on
// the right behind thin cloud (cold-red rim on the mast, the irons, the far deck and the sea).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 98, FOC = 140, EYE = 1.7, MOON = { x: 152, y: 40 };
const MX = 93, MR = 13;                                     // the main mast: its axis and radius (in front of us, z ≈ 3 m)
const LAMP = { x: 50, y: 74, s: 1.15, hang: 2.6 };          // the lantern's foot; it hangs from the bracket's hook
const FLAME = { x: 50.2, y: 65.6 };
const light = { time: 'night', haze: .3, key: { type: 'point', x: FLAME.x, y: FLAME.y, h: 1.2, gy: 180, color: '#ffb664', power: 1, radius: 110 },
  fill: { color: '#4a1e2a', power: .4 }, rim: { az: 60, color: '#ff9a7a', power: .55 } };
const lightSky = { time: 'night', haze: .4, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 30, color: '#ffc8a8', power: .75 }, fill: { color: '#4a1a24', power: .45 } };
const skel = { horizon: HZ, eye: EYE, light: 'the lantern on its bracket, left (key, warm) + the red moon high right (rim, the far deck)', items: [
  ['mast', MX - MR, 140, 2 * MR, 150, 'deck, z ≈ 3 m, out of the top'], ['lantern', LAMP.x - 7, LAMP.y, 14, 34, 'hangs from the bracket'],
  ['bracket', LAMP.x - 2, 40, MX - LAMP.x, 10, 'on the mast\'s upper band'], ['cat', 66, 112, 26, 62, 'on a nail in the mast, in front of its lit face'],
  ['irons', 104, 112, 40, 30, 'on a chain from a ringbolt, right'], ['deck, bulwarks, bow', -10, 140, 220, 40, 'z 6–27 m'],
  ['foremast, yard, furled course', 40, 112, 120, 90, 'z ≈ 20 m'], ['moon', MOON.x - 8, MOON.y + 8, 16, 16, 'sky']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const CAMX = -2.3;                                          // we stand to port of the centre line: the foremast clears the main mast
const pr = (X, Y, z) => [100 + (X - CAMX) * FOC / z, HZ + (EYE - Y) * FOC / z];   // metres across, up from the deck, ahead -> picture

module.exports = { name: 'Жестокая дисциплина', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Ls = K.makeLight(lightSky, { horizon: HZ }), R = rng(29);
    Ls.pal = Object.assign({}, Ls.pal, { sky: ['#0a0306', '#240a10', '#4e1618', '#8a3420'], sea: ['#6a2a22', '#24100e', '#0a0506'], cloudLit: '#c0583a', cloudShade: '#1e0a10' });
    // ——— the night sky in a red haze, the moon behind thin cloud, the sea beyond the bow ———
    let bg = K.sky(u, Ls, { horizon: HZ, stars: 40, seed: 13 }) + glow(u, MOON.x, MOON.y, 46, 40, '#ff8a5a', .3) + K.sunMoon(u, Ls, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 47, 64, 5, 7, .2], [40, 30, 70, 7, 3, .4], [120, 76, 80, 5, 11, .6], [180, 88, 50, 3, 2, .7]]) bg += K.cloud(u, Ls, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, Ls, { horizon: HZ, bottom: 130, swell: .5, seed: 8, glitter: MOON.x });

    // ——— the deck in depth: planks to the vanishing point, the red bulwarks either side, the bow ahead ———
    const BX = 4.4, BH = 1.05, Z0 = 5.6, Z1 = 25;
    { const deckPoly = [pr(-BX, 0, Z0), pr(-BX, 0, Z1), pr(-1.6, 0, Z1 + 2.2), pr(0, 0, Z1 + 2.8), pr(1.6, 0, Z1 + 2.2), pr(BX, 0, Z1), pr(BX, 0, Z0)], dc = nid('dk', u);
      bg += `<defs><clipPath id="${dc}"><path d="M${deckPoly.map(P2).join('L')}Z"/></clipPath></defs><g clip-path="url(#${dc})">${K.deck(u, Ls, { horizon: HZ, top: HZ + 4, bottom: 150, vx: 100, kind: 'oak', plank: 9, seed: 6, wet: true })}</g>`; }
    // a grating hatch on the deck to the left, two lashed casks against the starboard bulwark, a coil
    { const g = [pr(-2.6, 0, 9), pr(-.9, 0, 9), pr(-.9, 0, 13), pr(-2.6, 0, 13)], gt = [pr(-2.6, .25, 9), pr(-.9, .25, 9), pr(-.9, .25, 13), pr(-2.6, .25, 13)];
      bg += `<path d="M${P2(g[0])}L${P2(g[1])}L${P2(gt[1])}L${P2(gt[0])}Z" fill="#2a120c"/><path d="M${gt.map(P2).join('L')}Z" fill="#3a2016" stroke="#0e0604" stroke-width=".35"/>`;
      for (let i = 1; i < 6; i++) { const a = [lerp(gt[0][0], gt[1][0], i / 6), gt[0][1]], b = [lerp(gt[3][0], gt[2][0], i / 6), gt[3][1]]; bg += `<path d="M${P2(a)}L${P2(b)}" stroke="#0e0604" stroke-width=".4"/>`; }
      for (let i = 1; i < 6; i++) { const z = lerp(9, 13, i / 6), a = pr(-2.6, .25, z), b = pr(-.9, .25, z); bg += `<path d="M${P2(a)}L${P2(b)}" stroke="#0e0604" stroke-width=".3"/>`; }
      bg += `<path d="M${P2(gt[3])}L${P2(gt[2])}" stroke="#d08a6a" stroke-width=".35" opacity=".5"/>`;
      for (const [z, sd] of [[16, 3], [17.6, 5]]) { const p = pr(BX - .55, 0, z), s = .9 * 7.4 / z; bg += K.barrel(u, Ls, { x: p[0], y: p[1], s, kind: 'water', seed: sd }); }
      { const p = pr(-BX + .9, 0, 18); bg += K.coil(u, Ls, { x: p[0], y: p[1], s: 8 / 18, seed: 4 }); } }
    // the bulwarks' inner faces (red paint), planking lines, the cap rail lit by the moon on the left side
    for (const sd of [-1, 1]) {
      const X = sd * BX, a = pr(X, 0, Z0), b = pr(X, 0, Z1), c = pr(X, BH, Z1), d = pr(X, BH, Z0), id = nid('bw', u);
      bg += `<defs>${linGrad(id, a[0], 0, b[0], 0, [[0, sd < 0 ? '#3a0e0c' : '#200608', 1], [1, '#4a1612', 1]])}</defs><path d="M${P2(a)}L${P2(b)}L${P2(c)}L${P2(d)}Z" fill="url(#${id})"/>`;
      for (const y of [.3, .55, .8]) { const p = pr(X, y, Z0), q = pr(X, y, Z1); bg += `<path d="M${P2(p)}L${P2(q)}" stroke="#1a0606" stroke-width=".4" opacity=".7"/>`; }
      for (let z = Z0 + 1.6; z < Z1; z += 2.2) { const p = pr(X, 0, z), q = pr(X, BH + .08, z); bg += `<path d="M${P2(p)}L${P2(q)}" stroke="#140404" stroke-width="${f(Math.max(.35, 6 / z))}"/>`; }
      const e = pr(X - sd * .12, BH + .12, Z0), g2 = pr(X - sd * .12, BH + .12, Z1);
      bg += `<path d="M${P2(e)}L${P2(g2)}L${P2(c)}L${P2(d)}Z" fill="#2a120c"/><path d="M${P2(e)}L${P2(g2)}" stroke="${sd < 0 ? '#e09070' : '#a05040'}" stroke-width="${sd < 0 ? .7 : .5}" opacity=".75"/>`;
    }
    // the bow: the bulwarks closing to the stem, the knightheads, the bowsprit rising out over the sea
    { const bl = [pr(-BX, 0, Z1), pr(-1.6, 0, Z1 + 2.2), pr(0, 0, Z1 + 2.8), pr(1.6, 0, Z1 + 2.2), pr(BX, 0, Z1)];
      const bt = [pr(-BX, BH + .1, Z1), pr(-1.6, BH + .25, Z1 + 2.2), pr(0, BH + .4, Z1 + 2.8), pr(1.6, BH + .25, Z1 + 2.2), pr(BX, BH + .1, Z1)];
      bg += `<path d="M${bl.map(P2).join('L')}L${bt.slice().reverse().map(P2).join('L')}Z" fill="#3a1010"/><path d="M${bt.map(P2).join('L')}" stroke="#d07a5a" stroke-width=".5" fill="none" opacity=".7"/>`;
      const s0 = pr(0, BH + .4, Z1 + 2.6), s1 = pr(0, 7.6, Z1 + 16);
      bg += K.shadeCyl(u, s0[0], s0[1], s1[0], s1[1], 1.1, Ls, 'tar', { r1: 1.3, r2: .7, outline: .25, seed: 3 })
        + `<path d="M${P2(s1)}L${P2(pr(0, 14, 20.6))}" stroke="#140808" stroke-width=".4"/>`; }
    // the foremast, her crimson course furled on the yard, the topsail yard above; the shrouds down to the channels
    { const mb = pr(0, 0, 20.4), mt = [mb[0], -10], yd = 11.4, yl = pr(-8.2, yd, 20.4), yr = pr(8.2, yd, 20.4);
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const p = pr(sd * (BX + .15), BH + .1, 18.4 + k * .9), q = pr(sd * .35, 13.6, 20.4);
        bg += `<path d="M${P2(p)}L${P2(q)}" stroke="#120606" stroke-width=".42"/>`; }
      bg += K.shadeCyl(u, mb[0], mb[1], mt[0], mt[1], 2.1, Ls, 'tar', { r1: 2.2, r2: 1.7, outline: .25, seed: 5 });
      // the furled sail: a fat crimson roll under the yard with sagging bights and gaskets round it
      const n = 14, top = [], bot = [];
      for (let i = 0; i <= n; i++) { const t = i / n, X = lerp(-7.6, 7.6, t), p = pr(X, yd, 20.4), sag = 2.6 + Math.sin(t * Math.PI * 4) * .9 + Math.sin(t * Math.PI) * 2.2; top.push([p[0], p[1] - .4]); bot.push([p[0], p[1] + 3.4 + sag]); }
      const sg = nid('fs', u);
      bg += `<defs>${linGrad(sg, 0, yl[1], 0, yl[1] + 8, [[0, '#7a2228', 1], [.5, '#4a1218', 1], [1, '#1e060a', 1]])}</defs><path d="M${top.map(P2).join('L')}L${bot.slice().reverse().map(P2).join('L')}Z" fill="url(#${sg})" stroke="#120406" stroke-width=".3"/>`;
      for (let i = 1; i < n; i += 2) { const a = top[i], b = bot[i]; bg += `<path d="M${P2(a)}Q${f(a[0] + 1)} ${f((a[1] + b[1]) / 2)} ${P2(b)}" stroke="#2a1410" stroke-width=".55" fill="none"/>`; }
      bg += `<path d="M${bot.map(P2).join('L')}" stroke="#c0584a" stroke-width=".35" fill="none" opacity=".45"/>`;
      bg += K.shadeCyl(u, yl[0], yl[1], yr[0], yr[1], 1.1, Ls, 'tar', { r1: .8, r2: .8, outline: .25, seed: 7 });
      const tl = pr(-5.4, 17.2, 20.4), tr = pr(5.4, 17.2, 20.4);
      bg += K.shadeCyl(u, tl[0], tl[1], tr[0], tr[1], .8, Ls, 'tar', { r1: .6, r2: .6, outline: .2, seed: 9 })
        + `<path d="M${P2(tl)}L${P2(yl)}M${P2(tr)}L${P2(yr)}" stroke="#140808" stroke-width=".35"/>`; }
    // the main shrouds coming down past us to the near channels, out of the frame's corners, with their ratlines
    let shr = '';
    for (const sd of [-1, 1]) {
      const lines = [0, 1, 2].map(k => [[MX + sd * (4 + k * 1.4), -6], [100 + sd * (150 + k * 18), 200]]);
      for (const [a, b] of lines) shr += `<path d="M${P2(a)}L${P2(b)}" stroke="#0e0606" stroke-width=".9"/><path d="M${P2(a)}L${P2(b)}" stroke="${sd < 0 ? '#c07850' : '#b05a48'}" stroke-width=".25" opacity=".5"/>`;
      for (let y = 8; y < 130; y += 9) { const at = ([a, b]) => [lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])), y]; const p = at(lines[0]), q = at(lines[2]); shr += `<path d="M${P2(p)}Q${f((p[0] + q[0]) / 2)} ${f(y + 1.2)} ${P2(q)}" stroke="#140808" stroke-width=".45" fill="none"/>`; }
    }

    // ——— the mast: round timber, darker to the right; iron bands bowed by the eye height ———
    let mast = K.shadeCyl(u, MX, -10, MX, 150, MR, L, 'oak', { r1: MR, r2: MR + .4, outline: .45, seed: 11 });
    mast += `<path d="M${MX - MR + 1.2} -10V150" stroke="#ffb878" stroke-width=".6" opacity=".35"/><path d="M${MX + MR - .8} -10V150" stroke="#ff8a6a" stroke-width=".7" opacity=".45"/>`;
    // the grain, a long check in the wood
    for (let i = 0; i < 9; i++) { const x = MX - MR + 2 + R() * (2 * MR - 4), y0 = R() * 120; mast += `<path d="M${f(x)} ${f(y0)}q${f((R() - .5) * 1.4)} ${f(10 + R() * 14)} ${f((R() - .5) * .6)} ${f(22 + R() * 20)}" stroke="#2a1608" stroke-width=".3" fill="none" opacity=".45"/>`; }
    mast += `<path d="M${MX + 4} 104q-.6 8 .3 16q.4 4 -.2 8" stroke="#140804" stroke-width=".6" fill="none"/>`;
    const band = (y, h) => { const bw = (y - HZ) * .025, id = nid('ib', u);
      let s = `<defs>${linGrad(id, MX - MR, 0, MX + MR, 0, [[0, '#a89890', 1], [.25, '#5a524e', 1], [.7, '#24201e', 1], [1, '#4a3a3a', 1]])}</defs>`
        + `<path d="M${f(MX - MR - .5)} ${f(y)}Q${MX} ${f(y + bw * 2)} ${f(MX + MR + .5)} ${f(y)}V${f(y + h)}Q${MX} ${f(y + h + bw * 2)} ${f(MX - MR - .5)} ${f(y + h)}Z" fill="url(#${id})" stroke="#0a0808" stroke-width=".4"/>`;
      for (const t of [-.72, -.36, 0, .36, .72]) { const x = MX + t * MR, yy = y + h / 2 + bw * (1 - t * t); s += K.shadeSphere(u, x, yy, .62, L, 'iron', { outline: .15 }); }
      return s + `<path d="M${f(MX - MR)} ${f(y + .4)}Q${f(MX - MR * .4)} ${f(y + .4 + bw * 1.4)} ${f(MX)} ${f(y + .4 + bw * 2)}" stroke="#ffd8a8" stroke-width=".4" fill="none" opacity=".6"/>`; };
    mast += band(14, 4.4) + band(38, 4.4) + band(112, 4.6);
    // the tallies cut into the wood: groups of four struck through, the last one unfinished; each cut a dark groove with a lit lip
    { const cut = (x, y, dx, dy) => `<path d="M${f(x)} ${f(y)}l${f(dx)} ${f(dy)}" stroke="#1a0a04" stroke-width=".85" stroke-linecap="round"/><path d="M${f(x - .45)} ${f(y + .1)}l${f(dx)} ${f(dy)}" stroke="#f0c08a" stroke-width=".3" opacity=".7"/>`;
      const groups = [[87, 52, 4], [96, 53, 4], [88, 62, 4], [97, 63.4, 4], [88.6, 72.6, 4], [97.6, 74, 2]];
      for (const [gx, gy, n] of groups) {
        for (let i = 0; i < n; i++) { const x = gx + i * 1.6 + (R() - .5) * .3; mast += cut(x, gy + (R() - .5) * .6, (R() - .5) * .5, 6.4 + R() * .8); }
        if (n === 4) mast += cut(gx - 1, gy + 5.8, 7.6, -4.4 + (R() - .5));
      } }
    // the ringbolt on the right of the mast; the chain sags out to the irons hanging open
    let irons = '';
    { const rb = [MX + MR - 3.4, 84];
      irons += `<rect x="${f(rb[0] - 1.6)}" y="${f(rb[1] - 1.6)}" width="3.2" height="3.2" rx=".6" fill="#2a2424" stroke="#0a0808" stroke-width=".3"/>`
        + `<ellipse cx="${f(rb[0] + 2.2)}" cy="${f(rb[1] + 1.4)}" rx="2.4" ry="3" fill="none" stroke="#0a0808" stroke-width="1.6" transform="rotate(-20 ${f(rb[0] + 2.2)} ${f(rb[1] + 1.4)})"/><ellipse cx="${f(rb[0] + 2.2)}" cy="${f(rb[1] + 1.4)}" rx="2.4" ry="3" fill="none" stroke="#6a5a58" stroke-width=".7" transform="rotate(-20 ${f(rb[0] + 2.2)} ${f(rb[1] + 1.4)})"/>`;
      const c0 = [rb[0] + 3.4, rb[1] + 3.6], c1 = [124, 98];
      irons += K.chain(u, L, [c0, [110, 95], [117, 98.6], c1], { link: 3.6, seed: 5 });
      // a pair of hinged cuffs on a short chain, one hanging, one turned towards us and open
      const cuff = (c, rx, ry, rot, open) => { const id = nid('cf', u);
        let s = `<defs>${linGrad(id, c[0] - rx, c[1] - ry, c[0] + rx, c[1] + ry, [[0, '#8a7a76', 1], [.4, '#3a3230', 1], [1, '#141010', 1]])}</defs><g transform="rotate(${rot} ${f(c[0])} ${f(c[1])})">`;
        const arc = open ? `M${f(c[0] - rx)} ${f(c[1])}A${rx} ${ry} 0 1 1 ${f(c[0] + rx * .2)} ${f(c[1] + ry * .98)}` : `M${f(c[0] - rx)} ${f(c[1])}A${rx} ${ry} 0 1 1 ${f(c[0] - rx)} ${f(c[1] + .01)}`;
        s += `<path d="${arc}" fill="none" stroke="#080606" stroke-width="3"/><path d="${arc}" fill="none" stroke="url(#${id})" stroke-width="2.1"/>`;
        if (open) s += `<path d="M${f(c[0] - rx)} ${f(c[1])}Q${f(c[0] - rx * 1.6)} ${f(c[1] + ry * 1.6)} ${f(c[0] - rx * .2)} ${f(c[1] + ry * 2.1)}" fill="none" stroke="#080606" stroke-width="3"/><path d="M${f(c[0] - rx)} ${f(c[1])}Q${f(c[0] - rx * 1.6)} ${f(c[1] + ry * 1.6)} ${f(c[0] - rx * .2)} ${f(c[1] + ry * 2.1)}" fill="none" stroke="url(#${id})" stroke-width="2.1"/>`;
        s += K.shadeSphere(u, c[0] - rx, c[1], 1, L, 'iron', { outline: .2 }) + `<path d="M${f(c[0] - rx * .6)} ${f(c[1] - ry * .8)}A${rx} ${ry} 0 0 1 ${f(c[0] + rx * .5)} ${f(c[1] - ry * .86)}" stroke="#ff9a7a" stroke-width=".45" fill="none" opacity=".6"/>`;
        return s + '</g>'; };
      irons += cuff([c1[0] + 1.6, c1[1] + 6.4], 3.6, 4.4, 8, false)
        + K.chain(u, L, [[c1[0] + 3, c1[1] + 10.4], [c1[0] + 7, c1[1] + 14], [c1[0] + 12, c1[1] + 12]], { link: 2.8, seed: 7 })
        + cuff([c1[0] + 15.6, c1[1] + 10.6], 3.6, 4.4, -30, true);
      irons = `<g transform="translate(${f(rb[0])} ${rb[1]}) scale(1.3) translate(${f(-rb[0])} ${-rb[1]})">${irons}</g>`; }
    // the bracket: a forged arm out of the upper band to the left with a scrolled brace, the hook, the lantern
    let lamp = '';
    { const y0 = 40.2, hx = LAMP.x, x0 = MX - MR + .5;
      lamp += `<path d="M${f(x0)} ${y0}H${f(hx - 1)}" stroke="#0a0808" stroke-width="2.2" stroke-linecap="round"/><path d="M${f(x0)} ${y0 - .4}H${f(hx - 1)}" stroke="#7a6a64" stroke-width=".7"/>`
        + `<path d="M${f(x0)} ${y0 + 9}Q${f(x0 - 12)} ${y0 + 8} ${f(x0 - 18)} ${y0 + 1.4}" stroke="#0a0808" stroke-width="1.5" fill="none"/><path d="M${f(x0 - 18)} ${y0 + 1.4}q-3 -1 -2 -3q2 -1 2.6 1" stroke="#0a0808" stroke-width="1" fill="none"/>`
        + `<path d="M${f(hx - 1)} ${y0}q-2.2 0 -2.2 2.2q0 2 2 2.2" stroke="#0a0808" stroke-width="1.1" fill="none"/>`;
      lamp += K.lantern(u, L, { ...LAMP, lit: true, seed: 4 }) + K.localGlow(u, { x: FLAME.x, y: FLAME.y, color: '#ffc070', power: .85, radius: 30 }); }
    // the cat on its nail in front of the lit face: the lanyard over the nail, a turned leather handle with a Turk's
    // head at the butt, nine knotted tails hanging in a loose fan, two of them over the band
    let cat = '';
    { const nail = [84, 48], h0 = [83, 56], h1 = [83.6, 73];
      cat += `<circle cx="${nail[0]}" cy="${nail[1]}" r="1.3" fill="#2a2424" stroke="#0a0808" stroke-width=".3"/><circle cx="${nail[0] - .3}" cy="${nail[1] - .3}" r=".45" fill="#c8b0a0" opacity=".7"/>`
        + `<path d="M${nail[0] - .8} ${nail[1] + .6}Q${nail[0] - 3.4} ${nail[1] + 4} ${h0[0] - 1.2} ${h0[1] - .4}M${nail[0] + .8} ${nail[1] + .6}Q${nail[0] + 2.6} ${nail[1] + 4} ${h0[0] + 1.2} ${h0[1] - .4}" stroke="#2a1608" stroke-width=".8" fill="none"/>`;
      cat += K.shadeCyl(u, h0[0], h0[1], h1[0], h1[1], 2.2, L, 'leather', { r1: 1.9, r2: 2.3, outline: .35, seed: 6 });
      for (let i = 0; i < 6; i++) { const y = h0[1] + 3 + i * 2.2; cat += `<path d="M${f(h0[0] - 2)} ${f(y)}l${f(4.2)} ${f(1.2)}" stroke="#1a0c06" stroke-width=".4"/>`; }
      cat += K.shadeSphere(u, h0[0] - .1, h0[1] - .6, 2.4, L, 'leather', { outline: .3 }) + `<path d="M${f(h0[0] - 2)} ${f(h0[1] - 1.2)}q2 1 4 0M${f(h0[0] - 2.2)} ${f(h0[1] - .2)}q2.2 1 4.4 0" stroke="#1a0c06" stroke-width=".35" fill="none"/>`;
      // the tails: from the butt of the handle, each its own length and sway, a knot at two points, frayed ends
      const RT = rng(17);
      for (let k = 0; k < 9; k++) { const x0 = h1[0] - 1.6 + k * .4, ex = h1[0] - 11 + k * 2.7 + (RT() - .5) * 2, ey = h1[1] + 30 + (RT() - .5) * 6 - Math.abs(k - 4) * 1.2;
        const c = [lerp(x0, ex, .5) + (RT() - .5) * 3, lerp(h1[1], ey, .5)], d = `M${f(x0)} ${f(h1[1] + 1)}Q${P2(c)} ${f(ex)} ${f(ey)}`;
        cat += `<path d="${d}" stroke="#120804" stroke-width="1.15" fill="none"/><path d="${d}" stroke="#5a3a24" stroke-width=".5" fill="none" opacity=".8" transform="translate(-.3 0)"/>`;
        for (const t of [.42, .74]) { const q = [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * c[0] + t * t * ex, (1 - t) * (1 - t) * (h1[1] + 1) + 2 * (1 - t) * t * c[1] + t * t * ey];
          cat += K.shadeSphere(u, q[0], q[1], .95, L, 'leather', { outline: .2 }); }
        cat += `<path d="M${f(ex)} ${f(ey)}l${f(-.6)} 1.6M${f(ex)} ${f(ey)}l.5 1.7M${f(ex)} ${f(ey)}l0 1.8" stroke="#3a2414" stroke-width=".3"/>`; }
      cat += `<path d="M${f(h1[0] - 2.4)} ${f(h1[1] - .5)}q2.4 1.4 4.8 0" stroke="#1a0c06" stroke-width=".5" fill="none"/>`;
      // its shadow thrown on the mast by the lantern, to the right
      cat = `<g transform="translate(${nail[0]} ${nail[1]}) scale(1.22) translate(${-nail[0]} ${-nail[1]})"><path d="M${f(h0[0] + 4)} ${f(h0[1] + 2)}L${f(h1[0] + 5)} ${f(h1[1] + 2)}L${f(h1[0] + 14)} ${f(h1[1] + 30)}L${f(h1[0] - 2)} ${f(h1[1] + 32)}Z" fill="#1a0806" opacity=".35"/>` + cat + '</g>'; }

    // ——— the air: the lantern's pool on the mast, moon-red haze, the dark at the edges and below ———
    const air = glow(u, FLAME.x + 18, FLAME.y + 10, 46, 50, '#ffb060', .22) + glow(u, MOON.x, MOON.y + 30, 60, 50, '#ff7a50', .08)
      + motes(14, 40, 60, 60, 50, '#ffd8b0', 5) + gloom(u, 100, 60, 0, 0, .35) + gloom(u, 100, 120, 100, 280, .55, '#0a0204');
    return [bg + shr, mast + irons + cat + lamp + air];
  } };
