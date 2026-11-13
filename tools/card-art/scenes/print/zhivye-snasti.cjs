// «Живые снасти» (Месть королевы Анны, РЕМОНТ: восстановите 2 Паруса своему кораблю или кораблю союзника), refined
// from the first-round scene (portrait-revenge.cjs SCENES['Живые снасти']): sunset on the deck of the Revenge, no men
// on it. A broadsword stands driven into the planks, the green stone in its pommel glowing; a green glow runs over
// the deck from it to the fife rail at the foot of the mast, and there the ropes rise off the belaying pins by
// themselves, like snakes, and go to work on the torn mainsail: one laces the rip shut (the lower half already
// closed, its live end lifting to the next eyelet), two haul the foot of the sail taut.
// Fixed against the first round: the deck was a flat strip with a flat wall — now the deck in 2.5D, looking forward
// along it: the planks and both bulwarks run to the bow, the sea and the low sun ahead; the sail hung in the air —
// now it is bent to the yard on the mast; the ropes were loops in the air — now each starts wound on its pin and
// ends at work on the sail; the brief's find is added: the rip in the sail being laced by the rope itself.
// Light: the low sun ahead, behind the sail (key, contre-jour: the canvas glows through, the rip blazes); the green
// stone a small cold local light.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, gloom, motes } = PK;

const HZ = 92, VX = 100;                       // the sea horizon, the vanishing point (the bow)
const SUN = { x: 129, y: 44 };
const YD = 17;                                 // the yard
const SAIL = { x0: 22, x1: 178, top: 19, f0: 16, f1: 184, foot: 86, mid: 82 };
const STEM = [100, 97];                        // where the bulwarks meet at the bow
const MAST = { x: 100, foot: 114 };
const FIFE = { x0: 82, x1: 118, y: 102 };      // the fife rail's top bar
const PINS = [87, 95, 105, 113];
const SW = { x: 34, y: 123, a: 5 };            // the sword: where the blade enters the deck, its lean
const light = { time: 'dusk', haze: .45, key: { type: 'sun', x: SUN.x, y: SUN.y, el: 5, color: '#ffb46a', power: .95 }, fill: { color: '#6e4a70', power: .45 },
  rim: { az: 0, color: '#ffd0a0', power: .7 }, locals: [{ x: SW.x, y: 70, color: '#7aff9a', power: .4, radius: 26 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the low sun ahead behind the sail (key, contre-jour) + the sword stone (green local)', items: [
  ['sail', SAIL.f0, SAIL.foot, SAIL.f1 - SAIL.f0, SAIL.foot - SAIL.top, 'bent to the yard'], ['yard', 8, YD + 3, 184, 6, 'mast'],
  ['mast', MAST.x - 4, MAST.foot, 8, MAST.foot + 10, 'deck'], ['rip', 120, 78, 14, 54, 'sail'], ['fife rail', FIFE.x0, MAST.foot, FIFE.x1 - FIFE.x0, 14, 'deck round the mast'],
  ['ropes', 66, 104, 92, 30, 'from the pins to the sail'], ['bulwarks', -10, 150, 220, 54, 'deck sides, meeting at the bow'], ['sword', SW.x - 8, SW.y, 16, 56, 'driven into the deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
// the rip: half its gap at height y; above LACE it is still open, below it laced shut
const RIP0 = 25, RIP1 = 78, LACE = 52;
const ripX = y => 126 + (y - RIP0) * .06;
const gap = y => y > LACE ? 1 : Math.sin(Math.PI * (y - RIP0) / (LACE + 6 - RIP0)) * 6 + 1;

module.exports = { name: 'Живые снасти', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), R = rng(5);
    // ——— the sunset: sky, sun, clouds, the sea ahead with the sun's path ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 4 }) + K.sunMoon(u, L, { r: 8 });
    for (const [x, y, w, h, sd, fr] of [[40, 12, 70, 7, 3, .2], [168, 26, 56, 6, 8, .3], [10, 60, 40, 5, 5, .5], [190, 72, 36, 4, 6, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 160, swell: .45, seed: 6, glitter: SUN.x });
    // ——— the deck between the bulwarks, the planks to the bow; the bulwarks' inner faces, the rails ———
    { const dc = nid('dc', u);
      bg += `<defs><clipPath id="${dc}"><path d="M-10 150L${P2([STEM[0], STEM[1] + 4])}L210 150V290H-10Z"/></clipPath></defs><g clip-path="url(#${dc})">${K.deck(u, L, { horizon: HZ, top: 96, bottom: 290, vx: VX, kind: 'pine-deck', plank: 12, seed: 9, wet: true })}</g>`;
      for (const sg of [-1, 1]) { const xo = 100 + sg * 110, face = `M${xo} 114L${P2(STEM)}L${STEM[0]} ${STEM[1] + 4}L${xo} 150Z`, fc = nid('bf', u);
        bg += `<defs><clipPath id="${fc}"><path d="${face}"/></clipPath></defs><g clip-path="url(#${fc})">${woodTex(u, Math.min(xo, 100), 90, 110, 70, sg < 0 ? '#4a2a1a' : '#3a2016', '#1e0e08', '#0a0403', 5, false, sg < 0 ? 4 : 7)}`
          + Array.from({ length: 8 }, (_, i) => { const t = Math.pow(i / 8, 1.6), x = lerp(xo, 100, t), y0 = lerp(114, STEM[1], t), y1 = lerp(150, STEM[1] + 4, t); return `<path d="M${f(x)} ${f(y0)}L${f(x)} ${f(y1)}" stroke="#120804" stroke-width="${f(2.6 * (1 - t) + .4)}"/><path d="M${f(x - sg * (1.3 * (1 - t) + .2))} ${f(y0)}L${f(x - sg * (1.3 * (1 - t) + .2))} ${f(y1)}" stroke="#a8643a" stroke-width="${f(.6 * (1 - t) + .15)}" opacity=".5"/>`; }).join('')
          + `</g>`;
        // the rail cap: a lit top edge catching the sun
        bg += `<path d="M${xo} 114L${P2(STEM)}L${xo} ${f(110.6)}Z" fill="#5a3420"/><path d="M${xo} 110.6L${P2(STEM)}" stroke="#ffc890" stroke-width="1" opacity=".85"/>`
          + `<path d="M${xo} 150L${STEM[0]} ${STEM[1] + 4}" stroke="#0a0403" stroke-width="1.2"/>`; } }
    // ——— the mast and the yard ———
    let mid = K.shadeCyl(u, MAST.x, MAST.foot, MAST.x, -10, 4, L, 'oak', { r1: 4, r2: 3.4, outline: .4, seed: 3 });
    mid += `<path d="M${MAST.x - 3.4} 4L22 ${YD}M${MAST.x + 3.4} 4L178 ${YD}" stroke="#2a1608" stroke-width=".5"/>`;
    mid += K.shadeCyl(u, 100, YD, 6, YD + 1.4, 3, L, 'oak', { r1: 3, r2: 1.5, outline: .4, seed: 4 }) + K.shadeCyl(u, 100, YD, 194, YD + 1.4, 3, L, 'oak', { r1: 3, r2: 1.5, outline: .4, seed: 5 });
    // ——— the sail: canvas glowing with the sun behind it, the rip cut out of it ———
    const S = SAIL;
    const edge = `M${S.x0} ${S.top}L${S.x1} ${S.top}Q${S.x1 + 4} 52 ${S.f1} ${S.foot}Q100 ${S.mid - 4} ${S.f0} ${S.foot}Q${S.x0 - 4} 52 ${S.x0} ${S.top}Z`;
    const ys = []; for (let y = RIP0; y <= RIP1; y += 1.5) ys.push(y);
    const jag = y => (rng(Math.round(y * 7))() - .5) * (y < LACE ? 1.6 : .5);
    const ripL = ys.map(y => [ripX(y) - gap(y) + jag(y), y]), ripR = ys.map(y => [ripX(y) + gap(y) + jag(y + .7), y]);
    const rip = 'M' + ripL.map(P2).join('L') + 'L' + ripR.slice().reverse().map(P2).join('L') + 'Z';
    { const g = nid('sl', u), gs = nid('ss', u), sc = nid('sc', u);
      mid += `<defs>${linGrad(g, S.x0, 0, S.x1, 0, [[0, '#8a4a34', 1], [.18, '#c87a4c', 1], [.5, '#f2b878', 1], [.82, '#c87a4c', 1], [1, '#7a4030', 1]])}`
        + `${radGrad(gs, SUN.x, SUN.y, 70, [[0, '#fff0c8', .9], [.25, '#ffd090', .55], [.6, '#ffb070', .15], [1, '#ffb070', 0]])}<clipPath id="${sc}"><path d="${edge}${rip}" clip-rule="evenodd"/></clipPath></defs>`
        + `<path d="${edge}${rip}" fill-rule="evenodd" fill="url(#${g})"/><g clip-path="url(#${sc})"><rect x="0" y="0" width="200" height="100" fill="url(#${gs})"/>`
        // the cloths of the sail: seams down it, a little darker; the belly's soft folds; the reef band across it
        + Array.from({ length: 13 }, (_, i) => { const x = S.x0 + 6 + i * 12; return `<path d="M${x} ${S.top}Q${f(x + (x - 100) * .04)} 52 ${f(x + (x - 100) * .05)} 90" stroke="#7a3e26" stroke-width=".45" fill="none" opacity=".55"/>`; }).join('')
        + [[44, 8], [72, 10], [128, 10], [158, 8]].map(([x, w]) => `<path d="M${x} ${S.top + 2}Q${x + 2} 50 ${x} 84" stroke="#7a3a24" stroke-width="${w}" fill="none" opacity=".12"/>`).join('')
        + `<path d="M${S.x0 - 1} 31Q100 33 ${S.x1 + 1} 31" stroke="#8a4a2c" stroke-width="2.2" fill="none" opacity=".45"/><path d="M${S.x0} 30Q100 32 ${S.x1} 30" stroke="#ffd8a0" stroke-width=".4" fill="none" opacity=".5"/>`
        // the old shadow of the yard on the canvas, the bolt rope round the edges
        + `<path d="M${S.x0} ${S.top + 1.6}L${S.x1} ${S.top + 1.6}" stroke="#4a2414" stroke-width="2" opacity=".5"/></g>`
        + `<path d="${edge}" fill="none" stroke="#5a2e1a" stroke-width="1"/><path d="M${S.f0 + 2} ${S.foot - 1}Q100 ${S.mid - 5} ${S.f1 - 2} ${S.foot - 1}" stroke="#ffd8a8" stroke-width=".5" fill="none" opacity=".7"/>`;
      // the robands over the yard holding the head of the sail
      for (let x = S.x0 + 6; x < S.x1; x += 12) mid += `<path d="M${x} ${S.top + 1}q1.2 -4 2.4 0" stroke="#3a2010" stroke-width=".7" fill="none"/>`;
      // the rip's frayed edges, lit from behind: hot rims, loose threads
      mid += `<path d="M${ripL.map(P2).join('L')}" stroke="#fff0c0" stroke-width=".8" fill="none" opacity=".9"/><path d="M${ripR.map(P2).join('L')}" stroke="#fff0c0" stroke-width=".8" fill="none" opacity=".9"/>`;
      for (const [side, pts] of [[-1, ripL], [1, ripR]]) pts.forEach((p, i) => { if (p[1] > LACE - 2 || i % 2) return; const l = 1.4 + R() * 2.2; mid += `<path d="M${P2(p)}q${f(-side * l * .6)} ${f(l * .3)} ${f(-side * l)} ${f(l * .9)}" stroke="#f2c890" stroke-width=".35" fill="none"/>`; }); }
    // ——— the fife rail at the foot of the mast: two posts, the bar, the belaying pins ———
    { const box = (x0, y0, x1, y1, d) => K.shadeBox(u, [{ pts: [[x0, y0], [x1, y0], [x1 - d * .4, y0 - d], [x0 + d * .4, y0 - d]], n: 'top', grain: [1, 0] }, { pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], n: 'front', grain: [1, 0] }], L, 'oak', { seed: Math.round(x0), outline: .4 });
      mid += K.contactShadow(u, MAST.x, MAST.foot + 1, 50, L, { ry: 2.4 });
      for (const x of [FIFE.x0 + 2, FIFE.x1 - 2]) mid += K.shadeBox(u, [{ pts: [[x - 2.2, FIFE.y], [x + 2.2, FIFE.y], [x + 2.2, MAST.foot + 1], [x - 2.2, MAST.foot + 1]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: Math.round(x), outline: .4 });
      mid += box(FIFE.x0 - 2, FIFE.y + 3.4, FIFE.x1 + 2, FIFE.y + 6.6, 2.4);
      for (const x of PINS) mid += K.shadeCyl(u, x, FIFE.y + 11, x, FIFE.y - 4, 1.1, L, 'oak', { r1: .8, r2: 1.2, outline: .3, seed: x }) + K.shadeSphere(u, x, FIFE.y - 4.4, 1.5, L, 'oak', { outline: .3 }); }
    // ——— the live ropes: each wound on its pin in figure eights, then rising by itself to the sail ———
    const turns = x => { let o = ''; for (let k = 0; k < 3; k++) { const y = FIFE.y - 1.6 + k * 1.3; o += K.rope(u, L, [[x - 2.6, y + .8], [x, y - .4], [x + 2.6, y + .8]], { r: .7, seed: x + k }); } return o; };
    const green = (pts, w) => { const fl = nid('gf', u); let d = `M${P2(pts[0])}`; for (let i = 1; i < pts.length; i++) d += `L${P2(pts[i])}`;
      return `<defs><filter id="${fl}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><path d="${d}" stroke="#6aff96" stroke-width="${w}" fill="none" opacity=".35" filter="url(#${fl})" stroke-linejoin="round" style="mix-blend-mode:screen"/>`; };
    // the clew ropes: from the outer pins up to the cringles in the foot of the sail, rising in S-bends
    const cr = [[70, 82.6], [156, 83.6]];
    const ropeL = [[PINS[0], FIFE.y - 1], [84, 94], [77, 96], [73, 92], [76, 88.5], [72, 86], cr[0]];
    const ropeR = [[PINS[3], FIFE.y - 1], [120, 97.5], [130, 98], [139, 95], [145, 90], [151, 86.4], cr[1]];
    mid += green(ropeL, 3.4) + green(ropeR, 3.4);
    mid += turns(PINS[0]) + turns(PINS[3]) + turns(PINS[2]);
    mid += K.rope(u, L, ropeL, { r: 1.05, seed: 2 }) + K.rope(u, L, ropeR, { r: 1.05, seed: 3 });
    for (const c of cr) mid += `<circle cx="${c[0]}" cy="${c[1]}" r="1.7" fill="none" stroke="url(#iron${u})" stroke-width=".8"/>`;
    // the lacing rope: up from the pin, in through the lowest eyelet; then over the rip and back through, eyelet by
    // eyelet (the turns behind the canvas hidden); its live end lifts off towards the next eyelet, glowing at the tip
    { const eyeL = [70, 62, 54], eyeR = [74, 66, 58], tipY = 48;
      const EL = y => [ripX(y) - 4.2, y], ER = y => [ripX(y) + 4.2, y];
      let eyes = '';
      for (const y of [...eyeL, LACE - 6 + 2]) eyes += `<circle cx="${f(EL(y)[0])}" cy="${y}" r="1.25" fill="#2a1408" stroke="#d8b070" stroke-width=".5"/>`;
      for (const y of [...eyeR, 50, 78]) eyes += `<circle cx="${f(ER(y)[0])}" cy="${y}" r="1.25" fill="#2a1408" stroke="#d8b070" stroke-width=".5"/>`;
      mid += eyes;
      const up = [[PINS[2], FIFE.y - 1], [109, 95], [116, 93], [119, 88], [126, 85.4], [ER(78)[0] - .4, 78.4]];
      mid += green(up, 3) + K.rope(u, L, up, { r: 1, seed: 7 });
      eyeL.forEach((y, i) => { const a = EL(y), b = ER(eyeR[i]); mid += `<path d="M${P2(a)}L${P2(b)}" stroke="#000" stroke-width="2.4" opacity=".25" transform="translate(.6 .9)"/>` + K.rope(u, L, [a, [lerp(a[0], b[0], .5), lerp(a[1], b[1], .5) - .3], b], { r: .95, seed: 10 + i }); });
      // the live end: out of the top-left eyelet, lifting up and over, its whipped tip turned to the next eyelet
      const tip = [EL(54), [ripX(54) - 7, 50], [ripX(50) - 6, 44.6], [ripX(46) + 1, 42.4], [ripX(48) + 5.6, 45.6], [ER(50)[0] + .4, tipY + .4]];
      mid += green(tip, 3.4) + K.rope(u, L, tip, { r: .95, seed: 14, whip: true }) + K.localGlow(u, { x: ER(50)[0], y: tipY, color: '#8affb0', power: .5, radius: 7 }, { core: false });
      // the laced part of the rip pulled shut: a few puckers in the canvas across it
      for (const y of [56, 64, 72]) mid += `<path d="M${f(ripX(y) - 8)} ${y + 1}q4 -1.4 8 0t8 0" stroke="#7a3e26" stroke-width=".4" fill="none" opacity=".6"/>`; }
    // ——— the sword in the deck: the blade, the cup hilt, the grip, the green stone in the pommel ———
    { const a = SW.a * Math.PI / 180, v = [Math.sin(a), -Math.cos(a)], n = [Math.cos(a), Math.sin(a)], at = l => [SW.x + v[0] * l, SW.y + v[1] * l];
      mid += K.castShadow(u, L, { x: SW.x, y: SW.y, w: 4, h: 54, horizon: HZ, d: .3 }) + K.contactShadow(u, SW.x, SW.y, 8, L, { ry: 1.2 });
      const b0 = at(0), b1 = at(36), g = nid('bl', u), hw = 2.1;
      mid += `<defs>${linGrad(g, b0[0] - n[0] * hw, b0[1] - n[1] * hw, b0[0] + n[0] * hw, b0[1] + n[1] * hw, [[0, '#4a4248', 1], [.45, '#a49aa0', 1], [.55, '#e8dcd0', 1], [1, '#5a4e50', 1]])}</defs>`
        + `<path d="M${P2([b0[0] - n[0] * hw * .7, b0[1] - n[1] * hw * .7])}L${P2([b1[0] - n[0] * hw, b1[1] - n[1] * hw])}L${P2([b1[0] + n[0] * hw, b1[1] + n[1] * hw])}L${P2([b0[0] + n[0] * hw * .7, b0[1] + n[1] * hw * .7])}Z" fill="url(#${g})" stroke="#1e1a1c" stroke-width=".4"/>`
        + `<path d="M${P2(at(2))}L${P2(at(34))}" stroke="#3a3236" stroke-width=".5"/><path d="M${P2([b0[0] + n[0] * hw * .7, b0[1]])}L${P2([b1[0] + n[0] * hw, b1[1] + n[1] * hw])}" stroke="#ffe0b0" stroke-width=".45" opacity=".8"/>`;
      // the splintered planks round the blade
      mid += `<path d="M${SW.x - 4} ${SW.y + .6}l2.6 -1.4l1 1.2M${SW.x + 4} ${SW.y + .8}l-2.4 -1.6l-.8 1.4" stroke="#f0c88a" stroke-width=".45" fill="none"/>`;
      // the cup guard and the quillons, brass
      const gc = at(37.5);
      mid += K.shadeCyl(u, gc[0] - 8, gc[1] + .6, gc[0] + 8, gc[1] - .6, 1.1, L, 'brass', { r1: 1.3, r2: 1.3, cap: 'round', outline: .35 })
        + `<path d="M${f(gc[0] - 6.4)} ${f(gc[1] - .6)}Q${f(gc[0])} ${f(gc[1] + 6.6)} ${f(gc[0] + 6.4)} ${f(gc[1] - .6)}Q${f(gc[0])} ${f(gc[1] + 2)} ${f(gc[0] - 6.4)} ${f(gc[1] - .6)}Z" fill="url(#brass${u})" stroke="#4a3010" stroke-width=".4"/>`;
      const g0 = at(39), g1 = at(49);
      mid += K.shadeCyl(u, g0[0], g0[1], g1[0], g1[1], 1.5, L, 'leather', { r1: 1.6, r2: 1.4, outline: .35 })
        + Array.from({ length: 6 }, (_, i) => { const p = at(40 + i * 1.6); return `<path d="M${f(p[0] - 1.5)} ${f(p[1] + .5)}L${f(p[0] + 1.5)} ${f(p[1] - .5)}" stroke="#d8b060" stroke-width=".35"/>`; }).join('');
      const st = at(52.6);
      mid += K.shadeCyl(u, g1[0], g1[1], st[0], st[1] + 2.2, 1.4, L, 'brass', { r1: 1.6, r2: 1.2, outline: .3 });
      { const sg = nid('st', u); mid += `<defs>${radGrad(sg, st[0] - 1, st[1] - 1.2, 4.2, [[0, '#eaffe8', 1], [.3, '#6aff96', 1], [.75, '#1a8a46', 1], [1, '#063a1a', 1]])}</defs><circle cx="${f(st[0])}" cy="${f(st[1])}" r="3.2" fill="url(#${sg})" stroke="#042a12" stroke-width=".4"/><circle cx="${f(st[0] - 1)}" cy="${f(st[1] - 1.2)}" r=".7" fill="#ffffff"/>`; }
      mid += K.localGlow(u, { x: st[0], y: st[1], color: '#7aff9a', power: .75, radius: 20 }); }
    // the green trail over the deck from the sword to the fife rail, along a seam of the planks
    { const fl = nid('tf', u), d = `M${SW.x + 3} ${SW.y - .4}C60 121 78 116 ${PINS[0] - 1} ${MAST.foot + 1}`;
      mid += `<defs><filter id="${fl}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><path d="${d}" stroke="#6aff96" stroke-width="3" fill="none" opacity=".55" filter="url(#${fl})" style="mix-blend-mode:screen"/><path d="${d}" stroke="#e8fff0" stroke-width=".6" fill="none" opacity=".75"/>`; }
    // ——— the air: the low sun's haze round the sail, motes, the dark coming in from the edges ———
    let fg = K.localGlow(u, { x: SUN.x, y: SUN.y + 30, color: '#ffc080', power: .25, radius: 90 }, { core: false }) + motes(18, 20, 40, 160, 60, '#ffe0b0', 9)
      + gloom(u, 100, 60, 0, 0, .35, '#2a0e14') + gloom(u, 100, 60, 200, 0, .35, '#2a0e14') + gloom(u, 100, 100, 100, 220, .5, '#1a0a10');
    return [bg, mid + fg];
  } };
