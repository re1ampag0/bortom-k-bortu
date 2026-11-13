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
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom, motes } = PK;

const HZ = 104, RAIL = 118, DK = 134;       // the horizon (behind the rail); the rail cap; the deck at the bulwark's foot
const WR = [98, 118], HS = 9.6, HA = -87;  // the wrist, the hand's size, its direction (up)
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 150, y: 26, el: 36, color: '#cfeee0', power: .65 }, fill: { color: '#2f5a50', power: .5 },
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
    let fg = '';
    { const g = nid('sl', u), cuff = nid('cf', u), a = [WR[0] - 2, WR[1] + 12], b = [WR[0] - 12, 300];
      // the sleeve: dark sea-green wool, wider towards the elbow (below the card), lit on the right by the moon
      fg += `<defs>${linGrad(g, a[0] - 22, 0, a[0] + 22, 0, [[0, '#0a1412', 1], [.45, '#1c2c28', 1], [.8, '#34504a', 1], [1, '#1a2a26', 1]])}${linGrad(cuff, a[0] - 20, 0, a[0] + 20, 0, [[0, '#14201c', 1], [.5, '#2e4640', 1], [.85, '#4e6e66', 1], [1, '#22342e', 1]])}</defs>`
        + `<path d="M${a[0] - 15} ${a[1] + 10}C${a[0] - 18} ${a[1] + 60} ${b[0] - 26} ${b[1] - 60} ${b[0] - 30} ${b[1]}H${b[0] + 32}C${b[0] + 28} ${b[1] - 70} ${a[0] + 20} ${a[1] + 60} ${a[0] + 16} ${a[1] + 10}Z" fill="url(#${g})" stroke="#020605" stroke-width=".6"/>`
        + `<path d="M${a[0] + 8} ${a[1] + 30}q-4 18 -12 30M${a[0] - 6} ${a[1] + 40}q2 16 -4 34M${a[0] + 12} ${a[1] + 70}q-6 14 -16 22" stroke="#040a08" stroke-width=".9" fill="none" opacity=".7"/>`
        + `<path d="M${a[0] + 14} ${a[1] + 16}C${a[0] + 18} ${a[1] + 50} ${b[0] + 30} ${b[1] - 80} ${b[0] + 30} ${b[1] - 40}" stroke="#7aa898" stroke-width=".7" fill="none" opacity=".6"/>`
        // the cuff: a broad turned-back band, two buttons
        + `<path d="M${a[0] - 18} ${a[1] - 2}Q${a[0]} ${a[1] - 7} ${a[0] + 18} ${a[1] - 2}L${a[0] + 17} ${a[1] + 13}Q${a[0]} ${a[1] + 8} ${a[0] - 16} ${a[1] + 13}Z" fill="url(#${cuff})" stroke="#020605" stroke-width=".6"/>`
        + `<path d="M${a[0] - 17} ${a[1] - 1}Q${a[0]} ${a[1] - 6} ${a[0] + 17} ${a[1] - 1}" stroke="#a8d0c0" stroke-width=".6" fill="none" opacity=".55"/><path d="M${a[0] - 16} ${a[1] + 12}Q${a[0]} ${a[1] + 7} ${a[0] + 17} ${a[1] + 12}" stroke="#020605" stroke-width="1.2" fill="none" opacity=".6"/>`
        + [[a[0] + 7, a[1] + 3], [a[0] + 12, a[1] + 3.6]].map(([x, y]) => K.shadeSphere(u, x, y, 1.5, L, 'brass', { outline: .3 })).join(''); }
    // the hand: palm to us, fingers up and a little apart, the thumb out to the left (his right hand)
    const hd = H.hand3(u, { at: WR, a: HA, s: HS, m: -1, roll: 180, pitch: 6, pose: 'open', spread: 5, palmW: .84, wristW: .9, fingerW: 1.02,
      flex: [[8, 12, 6], [6, 10, 5], [9, 13, 7], [12, 16, 9]], thumbSpread: 6, tone: SKIN, light: [.55, -.84], sw: .5 });
    // the wrist from the cuff to the heel of the hand
    { const w0 = hd.P(-.6, 0, -.42), w1 = [WR[0] - 2, WR[1] + 8], g = nid('wr', u);
      fg += `<defs>${linGrad(g, w1[0] - 12, 0, w1[0] + 12, 0, [[0, SKIN.shadow, 1], [.5, SKIN.half, 1], [.85, SKIN.lit, 1], [1, SKIN.half, 1]])}</defs>`
        + `<path d="M${f(w1[0] - 11.6)} ${f(w1[1])}L${f(w0[0] - 11.4)} ${f(w0[1])}L${f(w0[0] + 11.4)} ${f(w0[1])}L${f(w1[0] + 12)} ${f(w1[1])}Z" fill="url(#${g})" stroke="${SKIN.outline}" stroke-width=".45"/>`; }
    fg += hd.back + hd.front;
    // ——— the black spot in the middle of the palm: soot-black in the skin, smudged where he scrubbed at it ———
    { const c = hd.P(2.45, .1, -.85), R = rng(17), pts = [];
      for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, r = 7.6 * (1 + (R() - .5) * .5 + (i % 7 === 0 ? .22 : 0)); pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * .88]); }
      const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', bz = nid('bz', u), sp = nid('sp', u), bl = nid('sb', u), vb = nid('vb', u), sm = nid('sm', u);
      fg += `<defs>${radGrad(bz, c[0], c[1], 17, [[0, '#2a1420', .85], [.5, '#4a2a34', .5], [.8, '#5a3a40', .18], [1, '#5a3a40', 0]])}`
        + `${radGrad(sp, c[0] - 1.6, c[1] - 1.4, 10, [[0, '#050303', 1], [.55, '#0e0806', 1], [.85, '#1a0e0a', 1], [1, '#2a160e', 1]])}`
        + `<filter id="${bl}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter><filter id="${vb}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".25"/></filter>`
        + `<filter id="${sm}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter></defs>`
        // the bruise round it, then the dark veins creeping out to the fingers and the wrist
        + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="17" ry="15" fill="url(#${bz})"/>`;
      const veins = [[2.45, .1, 4.5, -1.4, 1.2], [2.45, .1, 4.8, -.45, 1.1], [2.45, .1, 4.7, .5, 1], [2.45, .1, 4.3, 1.35, .9], [2.45, .1, .5, -.8, 1], [2.45, .1, .3, .8, .9], [2.45, .1, 1.5, 1.7, .8]];
      let vs = '';
      for (const [x0, y0, x1, y1, w] of veins) { const a = hd.P(x0, y0, -.85), b = hd.P(x1, y1, -.85), mx = (a[0] + b[0]) / 2 + (R() - .5) * 6, my = (a[1] + b[1]) / 2 + (R() - .5) * 6;
        const q = [(a[0] + 2 * mx + b[0]) / 4, (a[1] + 2 * my + b[1]) / 4];
        vs += `<path d="M${f(a[0])} ${f(a[1])}Q${f(mx)} ${f(my)} ${f(b[0])} ${f(b[1])}" stroke="#1e0c14" stroke-width="${f(w)}" fill="none" stroke-linecap="round" opacity=".7"/>`
          + `<path d="M${f(q[0])} ${f(q[1])}l${f((R() - .5) * 8)} ${f((R() - .5) * 8)}" stroke="#2a1420" stroke-width="${f(w * .5)}" fill="none" stroke-linecap="round" opacity=".55"/>`; }
      fg += `<g filter="url(#${vb})">${vs}</g>`
        // the smudges: grey soot rubbed out of it down towards the heel of the hand (it does not come off)
        + `<g filter="url(#${sm})" opacity=".55">${[[-3, 5, -4, 14, 3.4], [2, 6, 3, 15, 3], [6, 3, 10, 11, 2.4], [-6, 2, -11, 8, 2.2]].map(([x0, y0, dx, dy, w]) => `<path d="M${f(c[0] + x0)} ${f(c[1] + y0)}q${f(dx * .3)} ${f(dy * .6)} ${f(dx)} ${f(dy)}" stroke="#2a221e" stroke-width="${w}" fill="none" stroke-linecap="round"/>`).join('')}</g>`
        // the blot: a charred, soft rim, the matte black inside (no rim light: it is in the skin, not a hole)
        + `<path d="${d}" fill="#2a1408" opacity=".8" filter="url(#${bl})" transform="translate(${f(c[0] * -.14)} ${f(c[1] * -.14)}) scale(1.14)"/>`
        + `<path d="${d}" fill="url(#${sp})"/>`
        + `<path d="M${f(c[0] - 4)} ${f(c[1] - 2)}l3 1.4l2.4 -1.8M${f(c[0] + 1)} ${f(c[1] + 3)}l2.6 -.6l1.4 2" stroke="#2e1c14" stroke-width=".45" fill="none" opacity=".8"/>`; }
    // ——— the water: a wet sheen on the palm and fingers, drops running down to the cuff, a few falling ———
    { const R = rng(29);
      for (const [x, y, l] of [[.6, -1.1, 10], [1.2, 1.2, 14], [.2, .2, 8], [3.6, 1.7, 9]]) { const p = hd.P(x, y, -.85);
        fg += `<path d="M${f(p[0])} ${f(p[1])}q${f(.6)} ${f(l * .5)} ${f(-.3)} ${f(l)}" stroke="#d8fff0" stroke-width=".7" fill="none" opacity=".55"/><ellipse cx="${f(p[0] - .3)}" cy="${f(p[1] + l + 1)}" rx="1" ry="1.4" fill="#e8fff8" opacity=".75"/>`; }
      for (let i = 0; i < 9; i++) { const p = hd.P(.8 + R() * 3.6, (R() - .5) * 3, -.85); fg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.4 + R() * .5)}" fill="#f0fff8" opacity="${f(.4 + R() * .4)}"/>`; }
      for (const [x, y] of [[78, 150], [116, 160], [84, 178]]) fg += `<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.4" fill="#d8fff0" opacity=".7"/>`; }
    // ——— the light: the cold veil, the green breath of the ship, the under-glass dark ———
    fg += motes(22, 10, 30, 180, 100, '#dffff0', 4) + glow(u, 150, 60, 70, 50, '#bff8e0', .08);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 150, 0, 290, [[0, '#040a08', 0], [.4, '#040a08', .45], [1, '#020504', .8]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${gl})"/>`; }
    fg += gloom(u, 100, 120, 0, -10, .2, '#020806');
    return [bg, fg];
  } };
