// «Бросить якорь» (Жемчужина, ЗАРЯД, +2 урона, без штрафа за диагональ), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Бросить якорь']): a cut-away over and under the water in a shallow bay. The black ship
// has let go her anchor at full way and swings round on it: the chain runs taut from the hawse down into the water
// to the anchor biting into the sand (a furrow where it dragged, a cloud of silt); she heels in the turn, a bow wave
// at her stem, the white arc of her turn round the chain on the water; the side that has come round fires at the enemy
// standing off at an angle on the left (flashes at her ports, the smoke thrown towards the enemy, a shot falls by her).
// The light: a late afternoon sun high on the right; under the water its shafts slant down to the left.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;

const HZ = 64, WL = 86;   // horizon; the waterline = the cut through the water
const light = { time: 'day', haze: .3, key: { type: 'sun', x: 166, y: 16, color: '#ffe8bc', power: .95 }, fill: { color: '#8fb8d8', power: .5 } };
const SHIP = { kind: 'pearl', x: 126, y: WL, scale: .82, heel: 2, roll: 9, sails: 'reefed', wake: true, seed: 4 };
const HAWSE = [83, 77], RING = [57, 104];                         // where the chain leaves the bow; the anchor's ring
const ANC = { h: 46, rot: 44 };                                    // the anchor lies along the chain, the crown in the sand
const PORTS = [[107.7, 80.4], [124.1, 79.8], [140.5, 79.2]];      // three ports of her near gun deck (pearl row at X -22, -2, 18)
const skel = { horizon: HZ, eye: 3, items: [['pearl', 46, WL, 136, 83, 'water'], ['chain', 50, 112, 33, 35, 'hawse -> anchor (taut)'],
  ['anchor', 0, 146, 56, 46, 'sand'], ['enemy', 14, 65, 22, 14, 'water (far)'], ['wake', 2, 86, 184, 20, 'water (round the chain)'], ['flashes', 94, 82, 50, 8, 'near ports'], ['smoke', 60, 82, 84, 26, 'ports -> enemy']] };

module.exports = { name: 'Бросить якорь', variant: 's2', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    const R = rng(31);
    const line2 = (d, w, c, op) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    // ——— above the water: sky, clouds, a low green island far on the right, the bay
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 56, 10, 4, .1], [120, 18, 40, 7, 9, .2], [188, 52, 34, 6, 6, .5], [76, 58, 44, 5, 13, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    { const ig = nid('ig', u), sea = L.pal.sky[3];
      bg += `<defs>${linGrad(ig, 0, HZ - 9, 0, HZ, [[0, mix('#5e8a58', sea, .45)], [1, mix('#3e6440', sea, .4)]])}</defs>`
        + `<path d="M140 ${HZ}q6 -6 16 -6q8 -4 18 -1q10 -2 16 2q6 2 12 5z" fill="url(#${ig})"/><path d="M144 ${HZ - .4}q26 -1.4 60 0" stroke="${mix('#f0e2b8', sea, .3)}" stroke-width=".8" fill="none"/>`;
      for (const [x, h, b] of [[160, 10, -2], [168, 12, 1.6], [180, 9, -1]]) { const tx = x + b, ty = HZ - 6 - h, c = mix('#2e4a2c', sea, .4);
        bg += `<path d="M${x} ${HZ - 5}q${f(b * .4)} ${f(-h * .5)} ${f(b)} ${-h}" stroke="${c}" stroke-width=".8" fill="none"/>`
          + [-150, -110, -60, -20, 25].map(a => { const r = a * Math.PI / 180, l = 4.4; return `<path d="M${f(tx)} ${f(ty)}q${f(Math.cos(r) * l * .5)} ${f(Math.sin(r) * l * .5 - 1.2)} ${f(Math.cos(r) * l)} ${f(Math.sin(r) * l + 1.2)}" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round"/>`; }).join(''); } }
    bg += K.water(u, L, { horizon: HZ, bottom: WL + 1, swell: .35, seed: 6, glitter: 166 });
    // the enemy standing off at an angle, far on the left; our shot falls by her
    bg += `<g data-far="">${K.ship(u, L, { kind: 'endeavour', x: 24, y: HZ + 1.4, scale: .21, detail: 'far', flip: true, seed: 3 })}</g>`
      + K.splash(u, { x: 38, y: HZ + 2, w: 7, h: 11, seed: 3, L }) + K.splash(u, { x: 12, y: HZ + 2.4, w: 5, h: 7, seed: 4, L });
    // the wake of her turn, plain on the water: a broad white arc that starts under her stern, swings out to the
    // right and round behind her, comes out again beyond her bow and closes in towards the point where the chain
    // went in — she has spun on the spot round her anchor. Fresh and wide at the stern, older and thinner round the
    // far side; wider near us (perspective)
    { const id = nid('ab', u), C = { x: 96, y: 79, rx: 96, ry: 11 }, th0 = .66, th1 = -3.6, N = 90, foamC = mix(L.pal.sea[0], '#ffffff', .82);
      const P = s => { const th = th0 + (th1 - th0) * s; return [C.x + C.rx * Math.cos(th), C.y + C.ry * Math.sin(th)]; };
      let halo = '', core = '', lip = '';
      for (let i = 0; i < N; i++) { const s0 = i / N, s1 = (i + 1.2) / N, [x0, y0] = P(s0), [x1, y1] = P(s1), k = Math.max(0, (y0 - HZ) / (WL - HZ)), age = 1 - s0 * .45, w = (.7 + 5.2 * k) * age;
        halo += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke-width="${f(w * 1.9)}"/>`; core += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke-width="${f(w)}" opacity="${f(.55 + .4 * age)}"/>`;
        lip += `<path d="M${f(x0)} ${f(y0 + w * .42)}L${f(x1)} ${f(y1 + w * .42)}" stroke-width="${f(Math.max(.25, w * .18))}"/>`; }
      bg += `<defs><filter id="${id}" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>`
        + `<g filter="url(#${id})" stroke="${foamC}" stroke-linecap="round" fill="none" opacity=".5">${halo}</g>`
        + `<g stroke="#f6fffc" stroke-linecap="round" fill="none">${core}</g><g stroke="#ffffff" stroke-linecap="round" fill="none" opacity=".9">${lip}</g>`;
      // churned foam along it: patches and streaks, more and bigger where it is fresh and near
      for (let s = .01; s < 1; s += .018 + R() * .02) { const [x, y] = P(s), k = Math.max(0, (y - HZ) / (WL - HZ)), age = 1 - s * .45;
        bg += K.foam(u, { x: x + (R() - .5) * 2, y: y + (R() - .5) * (.6 + k * 1.6), w: (2.4 + k * 10) * age, h: (.3 + k * 1.3) * age, seed: 40 + Math.round(s * 300), L }); } }

    // ——— the ship: heeled in the turn, the bow pulled down by the chain, wake and bow wave
    bg += K.ship(u, L, SHIP);

    // ——— under the water: the body of the water, the shafts of the sun, the sand sloping away to the right
    let fg = '';
    const W0 = '#5cc0c4', W1 = '#1e7c92', W2 = '#0a3a56', W3 = '#04182a';
    { const wg = nid('wg', u); fg += `<defs>${linGrad(wg, 0, WL, 0, 290, [[0, W0], [.12, W1], [.42, W2], [1, W3]])}</defs><rect x="0" y="${WL}" width="200" height="${290 - WL}" fill="url(#${wg})"/>`; }
    // the shafts: soft bands from the surface down to the left, brighter near the top
    { const sg = nid('sg', u), sb = nid('sb', u); fg += `<defs>${linGrad(sg, 0, WL, 0, 220, [[0, '#e8fff4', .5], [.5, '#bff0e8', .16], [1, '#bff0e8', 0]])}<filter id="${sb}" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><g filter="url(#${sb})">`;
      for (const [x, w] of [[46, 9], [92, 14], [126, 6], [158, 16], [188, 8]]) fg += `<path d="M${x} ${WL}h${w}l${f(-48 - w * .5)} 140h${-w * 1.6}z" fill="url(#${sg})" style="mix-blend-mode:screen"/>`;
      fg += `</g>`; }
    // the hull below the waterline: her black bottom, weed and barnacles, the rudder; seen through the green water
    { const hg = nid('hg', u), hc = nid('hc', u), d = 'M76.6 86C77.4 89.6 82 92.8 92 93.2L156 93.2Q164 92.6 167.2 89.2L168.6 86Z';
      fg += `<defs>${linGrad(hg, 0, WL, 0, 101, [[0, '#24464a'], [.5, '#183a40'], [1, '#102c34']])}<clipPath id="${hc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${hg})"/>`
        + `<g clip-path="url(#${hc})">` + Array.from({ length: 36 }, () => { const x = 78 + R() * 88, y = 86.6 + R() * 6; return `<path d="M${f(x)} ${f(y)}q${f((R() - .5) * 2)} ${f(1.4 + R() * 2)} ${f((R() - .5) * 3)} ${f(2.6 + R() * 3)}" stroke="${R() > .5 ? '#3a6a3a' : '#5a7a40'}" stroke-width="${f(.4 + R() * .5)}" fill="none" opacity=".75"/>`; }).join('')
        + Array.from({ length: 22 }, () => `<circle cx="${f(80 + R() * 86)}" cy="${f(87 + R() * 6)}" r="${f(.3 + R() * .5)}" fill="#a8b8a8" opacity=".5"/>`).join('')
        + Array.from({ length: 12 }, () => { const x = 80 + R() * 84, y = 87 + R() * 5, w = 4 + R() * 6; return `<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-1 - R())} ${f(w)} 0" stroke="#8ae0d8" stroke-width=".35" fill="none" opacity=".45"/>`; }).join('') + `</g>`
        + `<path d="M167.2 89.2L168.6 86L172.6 86L172 92.6L167.4 92.8Z" fill="#183438" stroke="#0a1e24" stroke-width=".4"/><path d="M92 93.2L156 93.2" stroke="#0a1e24" stroke-width=".9"/>`; }
    // the sand: a slope from the shallows on the left down into the deep on the right; ripples, stones, weed
    { const sg = nid('sd', u), d = 'M-10 134Q20 138 50 148Q90 160 130 172Q170 186 210 196L210 292L-10 292Z';
      fg += `<defs>${linGrad(sg, 0, 134, 0, 260, [[0, '#d6c89a'], [.18, '#a49a74'], [.5, '#4a5a52'], [1, '#0e2230']])}</defs><path d="${d}" fill="url(#${sg})"/>`
        + `<path d="M-10 134Q20 138 50 148Q90 160 130 172Q170 186 210 196" stroke="#f4ecc8" stroke-width=".9" fill="none" opacity=".6"/>`;
      for (let i = 0; i < 14; i++) { const x = R() * 200, y = 136 + x * .3 + 4 + R() * 26, w = 6 + R() * 10; fg += `<path d="M${f(x)} ${f(y)}q${f(w / 4)} -1.2 ${f(w / 2)} 0t${f(w / 2)} 0" stroke="#f0e6c0" stroke-width=".5" fill="none" opacity="${f(.15 + R() * .25)}"/>`; }
      for (let i = 0; i < 9; i++) { const x = 50 + R() * 150, y = 146 + (x - 50) * .32 + R() * 6; fg += K.rock(u, L, { x, y, w: 3 + R() * 6, h: 2 + R() * 3, seed: 60 + i, contact: false }); }
      // the caustics: a net of light on the sand in the shallows
      for (let i = 0; i < 26; i++) { const x = -4 + R() * 120, y = 140 + x * .24 + R() * 10, w = 3 + R() * 6; fg += `<path d="M${f(x)} ${f(y)}q${f(w * .5)} ${f(-1 - R())} ${f(w)} ${f(R() - .5)}" stroke="#fff8d8" stroke-width="${f(.3 + R() * .4)}" fill="none" opacity="${f(.25 + R() * .3)}"/>`; } }
    // the weed and the fish, startled by the anchor
    { const weed = (x, y, h, c, sd) => { const Rw = rng(sd); let o = ''; for (let k = 0; k < 4; k++) { const hh = h * (.6 + Rw() * .5), bx = x + (k - 1.5) * 1.6; o += `<path d="M${f(bx)} ${f(y)}q${f(-2 - Rw() * 3)} ${f(-hh * .3)} ${f(-1)} ${f(-hh * .6)}t${f(-2 + Rw() * 2)} ${f(-hh * .4)}" stroke="${c}" stroke-width="${f(1 + Rw() * .6)}" fill="none" stroke-linecap="round"/>`; } return o; };
      fg += weed(70, 155, 14, '#3e7a50', 3) + weed(108, 165, 12, '#346a48', 5) + weed(150, 180, 16, '#2e5e44', 7) + weed(4, 140, 9, '#4a8a58', 9);
      const fish = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0q3 -3 7 -2.6q2 .6 3.4 2.6q-1.4 2 -3.4 2.6q-4 .4 -7 -2.6zM4 0l3.6 -2.6v5.2z" fill="${c}"/><path d="M-5 -.6q4 -2 8 -.6" stroke="#e8fff8" stroke-width=".4" fill="none" opacity=".6"/><circle cx="-4" cy="-.4" r=".5" fill="#06121a"/></g>`;
      for (const [x, y, s] of [[126, 116, 1], [136, 121, .85], [120, 124, .8], [146, 114, .7], [140, 128, .7]]) fg += fish(x, y, s, '#8ab8c0'); }
    // the water's own colour over everything under it, thicker with depth; bubbles off the chain
    { const tg = nid('tg', u); fg += `<defs>${linGrad(tg, 0, WL, 0, 290, [[0, W1, .06], [.25, W1, .18], [.6, W2, .5], [1, W3, .8]])}</defs><rect x="0" y="${WL}" width="200" height="${290 - WL}" fill="url(#${tg})"/>`; }
    // the anchor: lying along the chain, one fluke buried in the sand, the furrow it ploughed and the silt it threw up
    { const crown = K.anchor.ring({ x: 0, y: 0, h: ANC.h, rot: ANC.rot }), cx = RING[0] - crown.x, cy = RING[1] - crown.y;
      fg += `<path d="M${f(cx + 4)} ${f(cy + 2)}Q${f(cx + 30)} ${f(cy + 6)} ${f(cx + 52)} ${f(cy + 13)}" stroke="#6a6248" stroke-width="2.6" fill="none" opacity=".55"/><path d="M${f(cx + 6)} ${f(cy + .6)}Q${f(cx + 30)} ${f(cy + 4.6)} ${f(cx + 52)} ${f(cy + 11.4)}" stroke="#f0e6c0" stroke-width=".5" fill="none" opacity=".5"/>`;
      fg += K.anchor(u, L, { x: cx, y: cy, h: ANC.h, rot: ANC.rot, contact: false, seed: 5 });
      // the sand heaped over the buried fluke
      fg += `<path d="M${f(cx - 14)} ${f(cy + 1.4)}q4 -3.6 9 -3q4 .6 6 3.4z" fill="#b8ac84"/><path d="M${f(cx - 13)} ${f(cy + 1)}q4 -3.2 8.4 -2.6" stroke="#f0e6c0" stroke-width=".5" fill="none" opacity=".7"/>`;
      const sf = nid('sf', u); fg += `<defs><filter id="${sf}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g filter="url(#${sf})" opacity=".55">`
        + [[-4, -6, 8], [6, -10, 9], [-14, -10, 6], [16, -4, 7], [2, -18, 6]].map(([dx, dy, r]) => `<circle cx="${f(cx + dx)}" cy="${f(cy + dy)}" r="${r}" fill="#c8bc94"/>`).join('') + `</g>`; }
    // the chain under the water: straight and taut from the ring up to where it enters the water at the bow
    const k = (WL - HAWSE[1]) / (RING[1] - HAWSE[1]), IN = [HAWSE[0] + (RING[0] - HAWSE[0]) * k, WL];
    fg += K.chain(u, L, [RING, [(RING[0] + IN[0]) / 2, (RING[1] + IN[1]) / 2], IN], { link: 3.8, seed: 7 });
    for (let i = 0; i < 18; i++) { const t = R(), x = IN[0] + (RING[0] - IN[0]) * t + (R() - .5) * 6, y = IN[1] + (RING[1] - IN[1]) * t - R() * 4; fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.4 + R() * .8)}" fill="none" stroke="#e8fff8" stroke-width=".35" opacity="${f(.4 + R() * .4)}"/>`; }
    // the cut: the surface seen edge-on — a bright wavering line, the underside of the surface mirroring the light
    { const sl = nid('sl', u); let d = `M0 ${WL}`; for (let x = 0; x <= 200; x += 10) d += `Q${x + 5} ${f(WL + (x % 20 ? -1 : 1) * .9)} ${x + 10} ${WL}`;
      fg += `<defs>${linGrad(sl, 0, WL, 0, WL + 6, [[0, '#e8fff8', .55], [1, '#e8fff8', 0]])}</defs><rect x="0" y="${WL}" width="200" height="6" fill="url(#${sl})"/>`
        + `<path d="${d}" stroke="#f4fffc" stroke-width="1.1" fill="none" opacity=".85"/>`; }
    // the chain above the water: from the hawse straight down to the surface, bar-taut — a dark straight core under
    // the links, a glint of strain along it; a small V of foam where it cuts the water as she swings
    fg += line2(`M${HAWSE[0]} ${HAWSE[1]}L${f(IN[0])} ${WL}`, 1.3, '#0c0d10', .9);
    fg += K.chain(u, L, [HAWSE, [(HAWSE[0] + IN[0]) / 2, (HAWSE[1] + IN[1]) / 2], IN], { link: 3.8, seed: 9 });
    fg += line2(`M${f(HAWSE[0] - .5)} ${f(HAWSE[1] + .6)}L${f(IN[0] - .5)} ${f(WL - .4)}`, .35, '#f4f0e0', .55);
    fg += K.foam(u, { x: IN[0] + 2, y: WL + .2, w: 9, h: 1, seed: 5, L }) + line2(`M${f(IN[0] - .6)} ${WL - .2}l5 -1.6M${f(IN[0] - .6)} ${WL - .2}l6 .6`, .5, '#ffffff', .8)
      + K.splash(u, { x: IN[0], y: WL, w: 4, h: 3.4, seed: 2, L, wind: -.4 });
    // the bow wave: a white roll thrown up and ahead of her stem as she spins, foam spreading round her forefoot
    fg += K.splash(u, { x: 63, y: WL, w: 17, h: 14, seed: 1, L, wind: -.7 }) + K.foam(u, { x: 64, y: WL - .3, w: 18, h: 1.8, seed: 11, L })
      + line2(`M${54} ${WL - .6}Q${62} ${WL - 4} ${71} ${WL - 2.6}`, 1.4, '#ffffff', .85);
    // the side that has come round to the enemy fires: flashes at three ports of her gun deck, the fire and the
    // smoke thrown out towards the enemy (to the left, over her bow and the water)
    for (const [i, [x, y]] of PORTS.entries()) {
      fg += K.smoke(u, L, { x: x - 6, y: y - .5, w: 30, h: 15, wind: -3, seed: 3 + i * 4, opacity: .97, glow: { color: '#ffb050', power: .5 } }); }
    for (const [i, [x, y]] of PORTS.entries()) { const fb = nid('fb', u);
      fg += `<defs>${radGrad(fb, x - 1, y, 5, [[0, '#ffffff', 1], [.25, '#fff0b0', 1], [.55, '#ffc040', .85], [1, '#ff7a1e', 0]])}</defs><circle cx="${f(x - 1)}" cy="${f(y)}" r="5" fill="url(#${fb})"/>`
        + K.muzzleFlash(u, { x: x - .6, y, dir: 172, len: 13, seed: i, smoke: false }); }
    return [bg, fg];
  } };
