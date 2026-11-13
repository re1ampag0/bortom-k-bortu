// «Чёрная метка» (Летучий голландец, ПРИКАЗ: выбранный вражеский корабль до конца хода получает +2 урона от
// каждого Залпа по нему), method A: the first-round scene (portrait-dutch.cjs SCENES['Чёрная метка']) at its best.
// A sailor's right hand held up to us, palm open, fingers up; in the middle of the palm the black spot — burnt into
// the skin, a soot-black blot with a charred, bruised rim, dark veins creeping out of it towards the fingers and the
// wrist; the hand is wet (he has scrubbed at it: it will not come off), drops run down to the cuff. Behind him — over
// the rail of his ship, in the green fog — the Flying Dutchman has come for him, her lanterns pale green.
// Fixed against the first round: the hand was a flat cut-out with a hole in it — now a jointed hand (people.cjs
// hand3: the palm, the ball of the thumb, three phalanges a finger) on one sleeve with one cuff; the spot is a mark in
// the skin, not a hole; the empty fog behind is now the rail and the Dutchman's silhouette (the brief).
// Light: the moon behind the fog, upper right (key, cold, the ship's back light); the Dutchman's green lanterns.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { sp } = H;
const { glow, gloom, motes } = PK;

const HZ = 104, RAIL = 118, DK = 134;       // the horizon (behind the rail); the rail cap; the deck at the bulwark's foot
const WR = [98, 118];                      // the wrist (the cuff sits just below it)
const HO = [97, 120], HR = -2, HSC = 1.12;  // the hand's frame: its origin (the middle of the wrist), turn, scale
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 128, y: 22, el: 36, color: '#cfeee0', power: .65 }, fill: { color: '#2f5a50', power: .5 },
  rim: { az: 20, color: '#d8fff0', power: .45 }, locals: [{ x: 160, y: 92, color: '#9effc8', power: .35, radius: 30 }] };
const skel = { horizon: HZ, eye: 1.7, light: 'the moon in the fog upper right (key, back light for the ship); the Dutchman\'s green lanterns', items: [
  ['Dutchman', 118, HZ + 2, 82, 84, 'sea, in the fog behind the rail'], ['rail', 0, DK, 200, DK - RAIL + 4, 'the bulwark of his ship'],
  ['hand', 60, 118, 76, 100, 'his arm, up from below'], ['black spot', 84, 104, 26, 22, 'in the palm'], ['sleeve, cuff', 70, 290, 46, 172, 'from the bottom edge to the wrist'],
  ['drops', 80, 122, 36, 40, 'down the wrist']] };
const SKIN = { lit: '#e4c2a0', half: '#b68e6e', shadow: '#5e4434', outline: '#22140c' };

module.exports = { name: 'Чёрная метка', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.7 });
    // ——— the night: green fog, the moon a blur upper right, the sea ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 14, seed: 6 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 70, 8, 5, .3], [120, 56, 60, 7, 11, .5], [20, 74, 50, 6, 2, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .35, seed: 4, glitter: 150 });
    bg += K.fog(u, L, { y: HZ - 30, h: 40, density: .4, seed: 2 });
    // the Dutchman: come up out of the fog behind him, close, bow to the left, her lanterns green
    bg += K.ship(u, L, { kind: 'dutch', x: 160, y: HZ + 3, scale: .78, sails: 'full', detail: 'mid', lights: true, seed: 4 });
    bg += K.fog(u, L, { y: HZ - 14, h: 26, density: .55, seed: 7 }) + glow(u, 160, 92, 40, 20, '#9effc8', .14);
    // the rail of his own ship: old oak with weed on it, wet; the deck below it in the dark
    bg += K.bulwark(u, L, { x1: -4, x2: 204, y: DK, h: DK - RAIL, kind: 'oak', posts: 30, seed: 3 })
      + `<rect x="-4" y="${RAIL - 2}" width="208" height="${DK - RAIL + 2}" fill="#2a4a40" opacity=".35" style="mix-blend-mode:multiply"/>`;
    bg += K.deck(u, L, { horizon: HZ, top: DK, bottom: 290, vx: 96, kind: 'pine-deck', plank: 13, seed: 5, wet: true })
      + `<rect x="0" y="${DK}" width="200" height="${290 - DK}" fill="#14302a" opacity=".55" style="mix-blend-mode:multiply"/>`;
    bg += K.fog(u, L, { y: RAIL - 8, h: 24, density: .35, seed: 9 });

    // ——— the arm: one coat sleeve from the bottom edge up to one turned-back cuff, the wrist out of it ———
    let fg = '', cuffSvg = '';
    { const g = nid('sl', u), cuff = nid('cf', u), a = [WR[0] - 2, WR[1] + 12], b = [WR[0] - 12, 300];
      // the sleeve: dark sea-green wool, wider towards the elbow (below the card), lit on the right by the moon
      fg += `<defs>${linGrad(g, a[0] - 22, 0, a[0] + 22, 0, [[0, '#0a1412', 1], [.45, '#1c2c28', 1], [.8, '#34504a', 1], [1, '#1a2a26', 1]])}${linGrad(cuff, a[0] - 20, 0, a[0] + 20, 0, [[0, '#14201c', 1], [.5, '#2e4640', 1], [.85, '#4e6e66', 1], [1, '#22342e', 1]])}</defs>`
        + `<path d="M${a[0] - 15} ${a[1] + 10}C${a[0] - 18} ${a[1] + 60} ${b[0] - 26} ${b[1] - 60} ${b[0] - 30} ${b[1]}H${b[0] + 32}C${b[0] + 28} ${b[1] - 70} ${a[0] + 20} ${a[1] + 60} ${a[0] + 16} ${a[1] + 10}Z" fill="url(#${g})" stroke="#020605" stroke-width=".6"/>`
        + `<path d="M${a[0] + 8} ${a[1] + 30}q-4 18 -12 30M${a[0] - 6} ${a[1] + 40}q2 16 -4 34M${a[0] + 12} ${a[1] + 70}q-6 14 -16 22" stroke="#040a08" stroke-width=".9" fill="none" opacity=".7"/>`
        + `<path d="M${a[0] + 14} ${a[1] + 16}C${a[0] + 18} ${a[1] + 50} ${b[0] + 30} ${b[1] - 80} ${b[0] + 30} ${b[1] - 40}" stroke="#7aa898" stroke-width=".7" fill="none" opacity=".6"/>`;
      // the cuff: a broad turned-back band, two buttons (drawn over the wrist, after the hand)
      cuffSvg = `<path d="M${a[0] - 18} ${a[1] - 2}Q${a[0]} ${a[1] - 7} ${a[0] + 18} ${a[1] - 2}L${a[0] + 17} ${a[1] + 13}Q${a[0]} ${a[1] + 8} ${a[0] - 16} ${a[1] + 13}Z" fill="url(#${cuff})" stroke="#020605" stroke-width=".6"/>`
        + `<path d="M${a[0] - 17} ${a[1] - 1}Q${a[0]} ${a[1] - 6} ${a[0] + 17} ${a[1] - 1}" stroke="#a8d0c0" stroke-width=".6" fill="none" opacity=".55"/><path d="M${a[0] - 16} ${a[1] + 12}Q${a[0]} ${a[1] + 7} ${a[0] + 17} ${a[1] + 12}" stroke="#020605" stroke-width="1.2" fill="none" opacity=".6"/>`
        + [[a[0] + 7, a[1] + 3], [a[0] + 12, a[1] + 3.6]].map(([x, y]) => K.shadeSphere(u, x, y, 1.5, L, 'brass', { outline: .3 })).join(''); }
    // ——— the hand: his right hand, palm to us, fingers up and fanned, the thumb out to the left ———
    // Drawn here with smooth shapes in the hand's own frame (origin — the middle of the wrist, y down, 1 unit ≈ 1/45 of
    // the palm), placed by HT. One skin tone for the whole hand: the pieces are outlined first, then filled again
    // without a stroke, so only the silhouette keeps a line (no seam between the palm and the fingers).
    const HT = `translate(${HO[0]} ${HO[1]}) rotate(${HR}) scale(${HSC})`, LW = .42;
    const dirA = a => { const r = a * Math.PI / 180; return [Math.sin(r), -Math.cos(r)]; };
    // a tapered digit: an axis of phalanges (lengths, each one's direction in degrees from up), widths at the joints;
    // returns its outline and the axis with its widths (for the creases and the shading)
    const digit = (base, segs, ws, back = 5) => {
      const ax = [], W = [], d0 = dirA(segs[0][1]); ax.push([base[0] - d0[0] * back, base[1] - d0[1] * back]); W.push(ws[0]);
      let p = base; ax.push(p); W.push(ws[0]);
      segs.forEach(([l, a], j) => { const d = dirA(a); for (let k = 1; k <= 4; k++) { const t = k / 4, q = [p[0] + d[0] * l * t, p[1] + d[1] * l * t];
        ax.push(q); W.push(lerp(ws[j], ws[j + 1], t) * (1 + .035 * Math.sin(Math.PI * t))); } p = ax[ax.length - 1]; });
      const left = [], right = [], n = ax.length;
      for (let i = 0; i < n; i++) { const a = ax[Math.max(0, i - 1)], b = ax[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, w = W[i] / 2;
        left.push([ax[i][0] - nx * w, ax[i][1] - ny * w]); right.push([ax[i][0] + nx * w, ax[i][1] + ny * w]); }
      // the round tip: half a circle past the last axis point
      const e = ax[n - 1], pv = ax[n - 2], l = Math.hypot(e[0] - pv[0], e[1] - pv[1]), ux = (e[0] - pv[0]) / l, uy = (e[1] - pv[1]) / l, nx = -uy, ny = ux, rt = W[n - 1] / 2, cap = [];
      for (let k = 1; k < 6; k++) { const t = Math.PI * k / 6; cap.push([e[0] + rt * (-nx * Math.cos(t) + ux * Math.sin(t) * 1.05), e[1] + rt * (-ny * Math.cos(t) + uy * Math.sin(t) * 1.05)]); }
      const out = [...left, ...cap, ...right.slice().reverse()];
      return { out, ax, W, tip: e, u: [ux, uy] };
    };
    const FING = [ // [base, [[len, angle] × 3], [widths at base, PIP, DIP, tip]]
      [[-10.6, -43.6], [[13, -10], [10, -8], [8.2, -6.5]], [8.6, 7.9, 7.1, 6.3]],
      [[-1.6, -46.4], [[14.6, -1.5], [11.4, -1], [9.2, -.5]], [9, 8.3, 7.4, 6.6]],
      [[7.1, -45], [[13.4, 8.5], [10.4, 7], [8.4, 5.5]], [8.4, 7.7, 6.9, 6.1]],
      [[14.4, -39.4], [[10.6, 19], [8, 16.5], [6.6, 14]], [7, 6.4, 5.8, 5.1]]];
    const fingers = FING.map(([b, s2, w]) => digit(b, s2, w, 6));
    const thumb = digit([-16.4, -28.5], [[13.6, -52], [11.6, -38]], [12.2, 9.4, 7.8], 8);
    const PALM = [[-11, 15], [-11.6, 3], [-15.6, -3.6], [-20.2, -11.6], [-21.8, -19.6], [-20.6, -27], [-17, -34.5], [-15.6, -40], [-14.6, -44.5], [-8, -47.6], [0, -48.6],
      [8, -47.2], [14, -43.6], [18, -38], [18.6, -30], [18.1, -20], [16.6, -10.5], [14, -2.5], [11.2, 4], [10.8, 15]];
    const SKN = '#c89a76', OUT = '#24140c';
    const shapes = [sp(PALM, true), sp(thumb.out, true), ...fingers.map(F => sp(F.out, true))];
    let hand = shapes.map(d => `<path d="${d}" fill="${SKN}" stroke="${OUT}" stroke-width="${LW * 2}" stroke-linejoin="round"/>`).join('')
      + shapes.map(d => `<path d="${d}" fill="${SKN}"/>`).join('');
    const hc = nid('hc', u), sb = nid('hb', u), sb2 = nid('hb2', u);
    hand += `<defs><clipPath id="${hc}">${shapes.map(d => `<path d="${d}"/>`).join('')}</clipPath><filter id="${sb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>`
      + `<filter id="${sb2}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".3"/></filter></defs><g clip-path="url(#${hc})">`;
    // the light on the skin: cool moonlight from behind on the right edges, the warm half-tone in front, the left
    // edges in shade; each digit rounded across its width
    { const g = nid('hl', u); hand += `<defs>${linGrad(g, -24, 0, 22, 0, [[0, '#4a2c1c', .45], [.35, '#4a2c1c', 0], [.75, '#fff0e0', 0], [1, '#fff0e0', .22]])}</defs><rect x="-40" y="-100" width="80" height="120" fill="url(#${g})"/>`; }
    for (const D of [...fingers, thumb]) { const m = Math.floor(D.ax.length * .55), a = D.ax[m], b = D.ax[m + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, w = D.W[m] / 2 + .3, g = nid('fd', u);
      // (the thumb: no rim on its upper edge — that side faces the index finger; its root fades out further up, past the web)
      const th = D === thumb, r0 = D.ax[th ? 4 : 1], r1 = D.ax[th ? 6 : 3], mg = nid('fg', u), mk = nid('fm', u);
      hand += `<defs>${linGrad(g, a[0] - nx * w, a[1] - ny * w, a[0] + nx * w, a[1] + ny * w, th ? [[0, '#3a2014', .4], [.3, '#5a3420', 0], [.7, '#e8c4a0', .12], [1, '#5a3420', .15]] : [[0, '#3a2014', .5], [.28, '#5a3420', .1], [.5, '#e8c4a0', .16], [.78, '#e8c4a0', 0], [.92, '#fff4e4', .5], [1, '#5a3420', .22]])}`
        + `${linGrad(mg, r0[0], r0[1], r1[0], r1[1], [[0, '#ffffff', 0], [1, '#ffffff', 1]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="-70" y="-110" width="140" height="140"><rect x="-70" y="-110" width="140" height="140" fill="url(#${mg})"/></mask></defs>`
        + `<path d="${sp(D.out, true)}" fill="url(#${g})" mask="url(#${mk})"/>`; }
    // the pads: the mounds under the fingers (no line across), the ball of the thumb, the heel; the hollow of the palm
    { const g = nid('hp', u), g2 = nid('hq', u), dk = nid('hd', u);
      hand += `<defs>${radGrad(g, 0, 0, 1, [[0, '#f0caa6', .75], [1, '#f0caa6', 0]])}${radGrad(dk, 1, -22, 17, [[0, '#3a2016', .6], [.55, '#4a2a1c', .3], [1, '#4a2a1c', 0]])}</defs>`
        + `<rect x="-40" y="-60" width="80" height="80" fill="url(#${dk})"/>`;
      for (const [x, y, rx, ry, op] of [[-11.2, -39.5, 4.6, 3.6, .55], [-2, -42, 4.8, 3.6, .55], [6.8, -40.6, 4.4, 3.4, .5], [13.6, -35.6, 3.6, 3, .45],
        [-13.6, -15, 8.4, 11.6, .75], [13.4, -15, 4.6, 10, .38], [0, 2, 9, 4, .3]]) hand += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${mix('#f0caa6', SKN, .2)}" opacity="${op * .6}" filter="url(#${sb})"/>`;
      hand += `<defs>${radGrad(g2, -15, -13, 11, [[0, '#2a160c', 0], [.7, '#2a160c', 0], [1, '#2a160c', .25]])}</defs>`; }
    // the joints: soft creases at two levels on each finger (a pair at the middle joint, one at the last), the thumb's one
    const crease = (D, i, off, w = .55, op = .5) => { const a0 = D.ax[i], b = D.ax[i + 1], l = Math.hypot(b[0] - a0[0], b[1] - a0[1]), ux = (b[0] - a0[0]) / l, uy = (b[1] - a0[1]) / l, nx = -uy, ny = ux, h = D.W[i] / 2 * w, a = [a0[0] + ux * off, a0[1] + uy * off];
      return `<path d="M${f(a[0] - nx * h)} ${f(a[1] - ny * h)}Q${f(a[0] - ux * .7)} ${f(a[1] - uy * .7)} ${f(a[0] + nx * h)} ${f(a[1] + ny * h)}" stroke="#6a4230" stroke-width=".42" fill="none" stroke-linecap="round" opacity="${op}"/>`; };
    { let cr = ''; for (const D of fingers) cr += crease(D, 5, -.5, .55, .5) + crease(D, 5, .6, .42, .32) + crease(D, 9, 0, .5, .42);
      cr += crease(thumb, 5, 0, .55, .5) + crease(thumb, 5, 1, .4, .3);
      // where the fingers part: a short soft fold at each fork
      for (const [x, y] of [[-6.2, -45.2], [2.8, -46.6], [11, -43]]) cr += `<path d="M${x} ${y}q.3 1.6 .1 2.8" stroke="#5a3626" stroke-width=".5" fill="none" stroke-linecap="round" opacity=".55"/>`;
      // the lines of the palm: life (round the ball of the thumb), head, heart
      cr += `<path d="M-14.6 -36.5C-6.5 -31 -6.8 -12 -4.2 4" stroke="#6a4230" stroke-width=".55" fill="none" opacity=".6"/>`
        + `<path d="M-14.2 -35.5C-4 -30.5 7 -28.5 15.6 -22.5" stroke="#6a4230" stroke-width=".5" fill="none" opacity=".55"/>`
        + `<path d="M17.6 -33C9 -37.6 1 -36.4 -7.4 -42" stroke="#6a4230" stroke-width=".5" fill="none" opacity=".55"/>`
        + `<path d="M3 3C2 -8 3.4 -18 5 -34" stroke="#6a4230" stroke-width=".35" fill="none" opacity=".35"/>`;
      hand += `<g filter="url(#${sb2})">${cr}</g>`; }
    // the fingertip pads catch a little light; the thumb's nail shows on its outer edge
    for (const D of [...fingers, thumb]) { const t = D.tip, k = D.W[D.W.length - 1] / 2; hand += `<ellipse cx="${f(t[0] - D.u[0] * k * .6 + .6)}" cy="${f(t[1] - D.u[1] * k * .6)}" rx="${f(k * .5)}" ry="${f(k * .75)}" transform="rotate(${f(Math.atan2(D.u[1], D.u[0]) * 180 / Math.PI + 90)} ${f(t[0] - D.u[0] * k * .6 + .6)} ${f(t[1] - D.u[1] * k * .6)})" fill="#f2d2b2" opacity=".35" filter="url(#${sb2})"/>`; }
    { const t = thumb.tip, n = [-thumb.u[1], thumb.u[0]], k = thumb.W[thumb.W.length - 1] / 2, c = [t[0] - thumb.u[0] * 2.4 - n[0] * k * .78, t[1] - thumb.u[1] * 2.4 - n[1] * k * .78];
      hand += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx=".7" ry="2.2" transform="rotate(${f(Math.atan2(thumb.u[1], thumb.u[0]) * 180 / Math.PI + 90)} ${f(c[0])} ${f(c[1])})" fill="#ecd0bc" stroke="#7a5440" stroke-width=".25" opacity=".85"/>`; }
    // ——— the black spot: soaked into the skin in the middle of the palm — a soft-edged blot, the black run out
    // along the lines of the palm and into the fine creases round it ———
    { const c = [1.2, -21.5], R = rng(17), pts = [], mk = nid('mk', u), mg = nid('mg', u), b1 = nid('bk', u), b2 = nid('bl', u);
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 6.6 * (1 + (R() - .5) * .42); pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * .92]); }
      hand += `<defs><filter id="${b1}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter><filter id="${b2}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation=".75"/></filter>`
        + `${radGrad(mg, c[0], c[1], 14, [[0, '#ffffff', 1], [.4, '#ffffff', .75], [1, '#ffffff', 0]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="-40" y="-70" width="80" height="90"><rect x="-40" y="-70" width="80" height="90" fill="url(#${mg})"/></mask></defs>`
        // the stain's shadow in the skin round it (a grey-violet bruise), then the ink in the lines, then the blot
        + `<ellipse cx="${c[0]}" cy="${c[1] + .5}" rx="12" ry="11" fill="#2a1620" opacity=".55" filter="url(#${b1})"/>`
        + `<g mask="url(#${mk})" filter="url(#${sb2})"><path d="M-14.6 -36.5C-6.5 -31 -6.8 -12 -4.2 4M-14.2 -35.5C-4 -30.5 7 -28.5 15.6 -22.5M17.6 -33C9 -37.6 1 -36.4 -7.4 -42" stroke="#060404" stroke-width=".85" fill="none" stroke-linecap="round"/>`
        + Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2 + R() * .5, r0 = 5.5, r1 = 8.5 + R() * 3.5, m = (R() - .5) * 3;
          return `<path d="M${f(c[0] + Math.cos(a) * r0)} ${f(c[1] + Math.sin(a) * r0)}Q${f(c[0] + Math.cos(a) * (r0 + r1) / 2 - Math.sin(a) * m)} ${f(c[1] + Math.sin(a) * (r0 + r1) / 2 + Math.cos(a) * m)} ${f(c[0] + Math.cos(a) * r1)} ${f(c[1] + Math.sin(a) * r1)}" stroke="#1a0e10" stroke-width="${f(.25 + R() * .2)}" fill="none" opacity=".45"/>`; }).join('') + `</g>`
        + `<path d="${sp(pts, true)}" fill="#0a0606" opacity=".8" filter="url(#${b1})" transform="translate(${f(c[0] * -.2)} ${f(c[1] * -.2)}) scale(1.2)"/>`
        + `<path d="${sp(pts, true)}" fill="#030202" filter="url(#${b2})"/>`
        + `<path d="${sp(pts.map(p => [c[0] + (p[0] - c[0]) * .55 - .8, c[1] + (p[1] - c[1]) * .55 - .6]), true)}" fill="#000000" filter="url(#${b2})"/>`; }
    // ——— the water: a wet sheen on the palm and fingers, drops running down to the cuff ———
    { const R = rng(29);
      for (const [x, y, l] of [[-12, -6, 9], [12.6, -4, 11], [-3, -2, 7], [16, -24, 8]]) hand += `<path d="M${x} ${y}q.6 ${f(l * .5)} -.3 ${l}" stroke="#e8fff6" stroke-width=".55" fill="none" opacity=".55"/><ellipse cx="${f(x - .3)}" cy="${f(y + l + .9)}" rx=".8" ry="1.2" fill="#f0fff8" opacity=".75"/>`;
      for (let i = 0; i < 6; i++) { const D = fingers[i % 4], p = D.ax[3 + Math.floor(R() * (D.ax.length - 4))]; hand += `<circle cx="${f(p[0] + (R() - .5) * 3)}" cy="${f(p[1])}" r="${f(.3 + R() * .3)}" fill="#f4fffa" opacity="${f(.35 + R() * .3)}"/>`; }
      for (const D of fingers) { const a = D.ax[4], b = D.ax[D.ax.length - 2], n = [-D.u[1], D.u[0]], k = D.W[4] / 2 * .55; hand += `<path d="M${f(a[0] + n[0] * k)} ${f(a[1] + n[1] * k)}L${f(b[0] + n[0] * k * .8)} ${f(b[1] + n[1] * k * .8)}" stroke="#e8fff6" stroke-width=".35" opacity=".35" stroke-linecap="round"/>`; } }
    hand += '</g>';
    fg += `<g transform="${HT}">${hand}</g>` + cuffSvg;
    { for (const [x, y] of [[78, 150], [116, 160], [84, 178]]) fg += `<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.4" fill="#d8fff0" opacity=".7"/>`; }
    // ——— the light: the cold veil, the green breath of the ship, the under-glass dark ———
    fg += motes(22, 10, 30, 180, 100, '#dffff0', 4) + glow(u, 150, 60, 70, 50, '#bff8e0', .08);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 150, 0, 290, [[0, '#040a08', 0], [.4, '#040a08', .45], [1, '#020504', .8]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${gl})"/>`; }
    fg += gloom(u, 100, 120, 0, -10, .2, '#020806');
    return [bg, fg];
  } };
