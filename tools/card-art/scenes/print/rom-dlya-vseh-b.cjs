// «Ром для всех» (Жемчужина, РЕМОНТ: +1 Команда своему кораблю и +1 союзнику) — variant B of the method trial:
// a new shot. Night on the deck of the «Жемчужина», one lantern over a rum cask lying on its trestle: the tap is
// open, a thick amber stream runs into a mug held out by a sailor's hand. Across the dark water, close alongside,
// the allied «Месть» with lit ports; a line runs from our rigging to hers and a rum bottle in a net slides along it
// over the gap — the rum goes to both ships. The lantern is the one key light (warm, shadows fall away from it);
// the moon is only a cold rim in the sky.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng } = K;

const HZ = 112;
const LAMP = { x: 58, y: 36, s: 1.35, hang: 30 };
const lamp = K.lantern.local({ ...LAMP });
const light = { time: 'night', haze: .35, key: { type: 'point', ...lamp, h: 1.2, gy: 120, color: '#ffbe6a', power: 1, radius: 110 },
  fill: { color: '#34486c', power: .35 }, locals: [{ x: 160, y: 96, color: '#ffb050', power: .4, radius: 30 }] };
const CASK = { x: 46, y: 104, s: 2.25 };
const MUG = { x: 98, y: 126, s: 2.1 };
const skel = { horizon: HZ, eye: 2.2, light: 'the lantern over the cask (key) + the lit ports of the ally', items: [
  ['cask', 12, 60, 70, 46, 'trestle on the hatch'], ['mug', 86, 100, 22, 26, 'in the hand'], ['stream', 82, 88, 14, 14, 'from the tap'],
  ['lantern', 50, 4, 18, 36, 'rope from the yard'], ['bottle', 112, 40, 16, 26, 'line between the ships'], ['ally', 120, 40, 90, 80, 'water']] };

module.exports = { name: 'Ром для всех', variant: 'b', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2.2 });
    const Lm = K.makeLight({ time: 'night', haze: .35, key: { type: 'moon', x: 182, y: 22, el: 30, color: '#b9cff6', power: .7 }, fill: { color: '#3d5680', power: .4 } }, { horizon: HZ });
    const R = rng(41);
    // ——— the night outside: sky with a small moon, the sea, the allied «Месть» close alongside with lit ports
    let bg = K.sky(u, Lm, { horizon: HZ, stars: 50, seed: 3 }) + K.sunMoon(u, Lm, { r: 5 });
    bg += K.cloud(u, Lm, { x: 120, y: 30, w: 70, h: 8, seed: 6, far: .5 });
    bg += K.water(u, Lm, { horizon: HZ, bottom: 290, swell: .4, seed: 8, glitter: 182 });
    bg += K.ship(u, Lm, { kind: 'revenge', x: 168, y: 120, scale: 1.05, detail: 'mid', lights: true, wake: false, reflect: true, seed: 5 });
    // the crew of the Месть at her rail, raising mugs (tiny silhouettes against her lit ports)
    for (const [x, y, a] of [[132, 101, -1], [141, 100, 1], [150, 100.4, -1]]) bg += `<path d="M${x - 1.6} ${y + 4}L${x - 1.4} ${y - 1.4}Q${x} ${y - 3} ${x + 1.4} ${y - 1.4}L${x + 1.6} ${y + 4}Z" fill="#0c0a10"/><circle cx="${x}" cy="${y - 3.4}" r="1.3" fill="#0c0a10"/><path d="M${x + a * 1.2} ${y - 1}l${a * 2} -3.4" stroke="#0c0a10" stroke-width="1"/><rect x="${x + a * 3.4 - .8}" y="${y - 5.8}" width="1.6" height="1.8" fill="#ffb050"/>`;
    bg += K.localGlow(u, { x: 150, y: 104, color: '#ffb050', power: .35, radius: 26 }, { core: false });
    // ——— the line between the ships: from our yard (off the top left) to her shrouds; the bottle slides along it
    const P0 = [-10, 4], P2 = [150, 70], P1 = [86, 52];
    const q = t => [(1 - t) * (1 - t) * P0[0] + 2 * t * (1 - t) * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * t * (1 - t) * P1[1] + t * t * P2[1]];
    bg += `<path d="M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}" stroke="#120c08" stroke-width="1.1" fill="none"/><path d="M${P0[0]} ${P0[1] - .5}Q${P1[0]} ${P1[1] - .5} ${P2[0]} ${P2[1] - .5}" stroke="#c89a60" stroke-width=".35" fill="none" opacity=".6"/>`;
    let fg = '', bot = '';
    { const b = q(.74), bx = b[0], by = b[1];
      // a block on the line, a short strop, the bottle in a rope net below it, swinging a little (to the ally)
      bot += `<rect x="${f(bx - 2)}" y="${f(by - 1.6)}" width="4" height="4.4" rx="1.4" fill="#4a3018" stroke="#140a04" stroke-width=".4"/>`
        + `<path d="M${f(bx)} ${f(by + 2.6)}L${f(bx + 2)} ${f(by + 9)}" stroke="#7a5a34" stroke-width=".7"/>`
        + K.bottle(u, L, { x: bx + 7, y: by + 33, s: 1.35, rot: -16, kind: 'rum', seed: 3 })
        + [0, 1, 2, 3].map(i => `<path d="M${f(bx + 1 + i * 2.6)} ${f(by + 9 + i * .4)}Q${f(bx + 8 + i)} ${f(by + 20)} ${f(bx + 4 + i * 3.4)} ${f(by + 32)}" stroke="#a88050" stroke-width=".35" fill="none" opacity=".8"/>`).join('')
        + `<path d="M${f(bx - 6)} ${f(by + 14)}q-3 1 -6 0M${f(bx - 5)} ${f(by + 20)}q-3 1 -6 0" stroke="#d8c8a8" stroke-width=".35" opacity=".5" fill="none"/>`; }
    // ——— our deck: the hatch coaming, the trestle, the cask on it; a rail on the right into the dark
    bg += K.bulwark(u, L, { x1: 104, x2: 214, y: 132, h: 26, kind: 'oak', posts: 24, seed: 3 });
    { const dc = nid('dk', u); bg += `<defs><clipPath id="${dc}"><rect x="-10" y="120" width="220" height="170"/></clipPath></defs><g clip-path="url(#${dc})">${K.deck(u, L, { horizon: HZ, top: 120, bottom: 290, vx: 60, kind: 'pine-deck', plank: 13, seed: 6 })}</g>`; }
    // the crate the cask rests on (a trestle of two crates under a plank)
    fg += K.castShadow(u, L, { x: 46, y: 150, w: 70, h: 40, horizon: HZ, d: .45 });
    fg += K.crate(u, L, { x: 46, y: 150, s: 3.3, seed: 4 });
    fg += K.castShadow(u, L, { x: CASK.x, y: CASK.y, w: 30 * CASK.s, h: 19 * CASK.s, horizon: HZ, d: .5 });
    fg += K.barrel(u, L, { ...CASK, kind: 'rum', lying: true, seed: 7 });
    // ——— the stream from the tap into the mug: thick, amber, lit through by the lantern; splashes in the mug
    const T = { x: 85.2, y: 92 }, Mm = { x: MUG.x - 1, y: MUG.y - 21 };
    { const sg = nid('st', u);
      fg += `<defs>${linGrad(sg, T.x, 0, T.x + 10, 0, [[0, '#7a3a0a'], [.4, '#e8902a'], [.6, '#ffd27a'], [1, '#8a4410']])}</defs>`
        + `<path d="M${T.x - .9} ${T.y}C${T.x + 4} ${T.y + 1} ${Mm.x - 2} ${T.y + 4} ${Mm.x - 1.4} ${Mm.y + 2}L${Mm.x + 1.6} ${Mm.y + 2}C${Mm.x + 1} ${T.y + 3} ${T.x + 5} ${T.y - 1} ${T.x + .9} ${T.y - 1.4}Z" fill="url(#${sg})" opacity=".95"/>`
        + `<path d="M${T.x + 1} ${T.y - .6}C${T.x + 5} ${T.y} ${Mm.x - .6} ${T.y + 3} ${Mm.x} ${Mm.y}" stroke="#fff0c0" stroke-width=".4" fill="none" opacity=".8"/>`; }
    // the sailor's hand from the bottom right holding the mug under the tap: a striped sleeve, tanned hand
    fg += PK.arm(u, 178, 200, 127, 116, { w0: 22, w1: 11, cloth: '#3a3a52', dark: '#12121c', light: '#6a6a84', bare: .45, pose: 'fist', side: -1, s: 1.25, twist: -58 });
    fg += K.mug(u, L, { ...MUG, fill: 'rum', seed: 5 });
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (.15 + R() * .7), d = 2 + R() * 5; fg += `<circle cx="${f(Mm.x + Math.cos(a) * d)}" cy="${f(Mm.y + 1 + Math.sin(a) * d * .8)}" r="${f(.35 + R() * .45)}" fill="#ffc870" opacity=".9"/>`; }
    fg += bot;
    // ——— the lantern on its rope from the yard over the cask, and its light
    fg += K.lantern(u, L, { ...LAMP, lit: true, seed: 4 });
    fg += K.localGlow(u, { x: lamp.x, y: lamp.y, color: '#ffbe6a', power: .7, radius: 50 }) + K.localGlow(u, { x: 60, y: 120, color: '#ffb050', power: .35, radius: 70 }, { squash: .35, core: false });
    // under the glass: the dark deck
    const gl = nid('gl', u);
    fg += `<defs>${linGrad(gl, 0, 140, 0, 290, [[0, '#0a0604', 0], [.35, '#0a0604', .5], [1, '#050302', .85]])}</defs><rect x="-10" y="140" width="220" height="150" fill="url(#${gl})"/>`;
    return [bg, fg];
  } };
