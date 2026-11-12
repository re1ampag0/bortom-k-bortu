// «Колокол «Голландца»» (Голландец, ПРИКАЗ: каждый противник сбрасывает 1 карту; возьмите 1) — variant B of the
// method trial: a new shot. Low angle under the bell of the «Летучий Голландец» at night in the fog: a big old
// bronze bell in green patina, barnacles and weed on its lip, swings on a rotten beam — the clapper has just hit
// it. The sound goes out as pale green rings through the fog, over the sea, to two enemy ships far off; on the
// rings, playing cards are torn away from them and drift down into the water. The one light: a cold moon behind the
// fog upper right; the rings and the strike give a ghostly green glow of their own.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng } = K;

const HZ = 120;
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 148, y: 50, el: 40, color: '#cfeee0', power: .7 },
  fill: { color: '#2f5a50', power: .45 }, locals: [{ x: 74, y: 96, color: '#9effd0', power: .5, radius: 40 }] };
const BELL = { x: 98, y: 16, rot: 13 };   // the crown's pivot under the beam; the swing (degrees)
const skel = { horizon: HZ, eye: 4, light: 'the moon behind the fog (upper right) + the green glow of the strike', items: [
  ['bell', 50, 16, 96, 96, 'beam (iron straps)'], ['beam', -10, 0, 220, 16, 'the gallows of the bell'],
  ['ship1', 10, 96, 40, 26, 'water, far'], ['ship2', 150, 92, 46, 30, 'water, far'], ['cards', 20, 60, 170, 60, 'in the air']] };

module.exports = { name: 'Колокол «Голландца»', variant: 'b', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    const R = rng(31);
    // ——— fog sky, the moon through it, the sea in the fog, two enemy ships far off
    let bg = K.sky(u, L, { horizon: HZ, stars: 14, seed: 6 }) + K.sunMoon(u, L, { r: 7 });
    bg += K.cloudBank(u, L, { y: 60, h: 14, x0: -20, x1: 220, n: 4, seed: 8, far: .6 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .35, seed: 7, glitter: 160 });
    bg += K.ship(u, L, { kind: 'endeavour', x: 30, y: HZ + 2, scale: .36, detail: 'far', flip: true, lights: true, seed: 4 })
      + K.ship(u, L, { kind: 'merchant', x: 172, y: HZ + 3, scale: .5, detail: 'far', lights: true, seed: 9 });
    bg += K.fog(u, L, { y: HZ - 16, h: 30, density: .55, seed: 4 });
    // ——— the sound: rings out of the bell's mouth, through the fog, over the sea (broken, fading with distance)
    const C = { x: 80, y: 92 }, rf = nid('rf', u);
    let rings = `<defs><filter id="${rf}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><g style="mix-blend-mode:screen">`;
    [[30, .9], [52, .75], [78, .55], [108, .4], [142, .26]].forEach(([r, op], i) => {
      const dash = i < 1 ? '' : ` stroke-dasharray="${f(r * .5)} ${f(r * .12)}"`;
      rings += `<ellipse cx="${C.x}" cy="${C.y}" rx="${r}" ry="${f(r * .82)}" fill="none" stroke="#9effd0" stroke-width="${f(3.4 - i * .4)}" opacity="${f(op * .5)}" filter="url(#${rf})"${dash}/>`
        + `<ellipse cx="${C.x}" cy="${C.y}" rx="${r}" ry="${f(r * .82)}" fill="none" stroke="#e8fff4" stroke-width=".55" opacity="${f(op * .8)}"${dash}/>`; });
    bg += rings + '</g>';
    // ——— cards torn from the enemies, drifting down on the rings into the sea (backs up, own pattern)
    const cards = [[22, 88, -30, .5, .7], [44, 76, 28, .58, .8], [150, 74, -18, .6, .8], [178, 86, 40, .5, .7], [190, 104, -60, .42, .6], [12, 106, 70, .4, .55], [132, 98, 15, .45, .65]];
    for (const [x, y, a, s, op] of cards) bg += `<g opacity="${op}">${PK.cardBack(u, x, y, a, s, .82, '#284a40', '#d8e8d8')}</g>`;
    // a card already in the water, half sunk, with a ring of ripples
    bg += `<g opacity=".6">${PK.cardBack(u, 152, 126, 80, .45, .35, '#284a40', '#c8d8c8')}</g><ellipse cx="152" cy="127" rx="9" ry="1.6" fill="none" stroke="#bfe8d8" stroke-width=".4" opacity=".6"/>`;
    // ——— the gallows beam overhead: rotten oak, weed hanging from it, iron straps down to the crown
    let fg = '';
    fg += K.shadeCyl(u, -12, 8, 212, 3, 7.5, L, 'oak', { seed: 12, rim: true });
    fg += `<path d="M-12 14.4L212 9.6" stroke="#0a1410" stroke-width="1.4" opacity=".7"/>`;
    for (const x of [8, 34, 150, 178, 196]) { const y = 13 - x * .025, l = 5 + R() * 9; fg += `<path d="M${f(x)} ${f(y)}c${f(-2 + R())} ${f(l * .3)} ${f(2 + R())} ${f(l * .6)} ${f(R() * 2 - 1)} ${f(l)}" stroke="#1e4030" stroke-width="${f(1.4 + R() * .8)}" fill="none" stroke-linecap="round"/>`; }
    // ——— the bell itself, drawn in its own frame and turned by the swing
    const bd = 'M-9 0C-9 -2 9 -2 9 0L10 4C21 6 27 14 28 30C29 46 32 62 41 74C44 78 46 80 46 83C46 86 -46 86 -46 83C-46 80 -44 78 -41 74C-32 62 -29 46 -28 30C-27 14 -21 6 -10 4Z';
    const bg1 = nid('bl', u), bc = nid('bc', u), pg = nid('pa', u), mo = nid('mo', u);
    let b = `<defs>${linGrad(bg1, -46, 0, 46, 0, [[0, '#0e1a16'], [.18, '#22382e'], [.45, '#4a6a4a'], [.68, '#a89a5a'], [.78, '#e8d08a'], [.86, '#8a7a44'], [1, '#2a3626']])}`
      + `<clipPath id="${bc}"><path d="${bd}"/></clipPath><radialGradient id="${pg}"><stop offset="0" stop-color="#78d4ae" stop-opacity=".9"/><stop offset=".55" stop-color="#4aa484" stop-opacity=".6"/><stop offset="1" stop-color="#3a7a64" stop-opacity="0"/></radialGradient>`
      + `${radGrad(mo, 0, 82, 46, [[0, '#9effd0', .7], [.3, '#1a3a30', 1], [1, '#020605', 1]])}</defs>`;
    // the crown: two loops through the iron straps of the beam
    b += `<path d="M-6 -1Q-8 -12 0 -12Q8 -12 6 -1" stroke="#1a2a22" stroke-width="5" fill="none"/><path d="M-6 -1Q-8 -12 0 -12Q8 -12 6 -1" stroke="#7a8a5a" stroke-width="1.2" fill="none" opacity=".8"/>`;
    b += `<path d="${bd}" fill="url(#${bg1})" stroke="#06100c" stroke-width=".9"/>`;
    // inside the clip: the bands, patina runs and blotches, the dent, the lip's thickness
    let inn = '';
    for (const [y, w] of [[10, 1.4], [14, .8], [62, 1.2], [67, .7], [76, 2.2]]) { const hw = y < 30 ? 22 + y * .25 : 26 + (y - 30) * .38; inn += `<path d="M${f(-hw)} ${y}Q0 ${f(y + 4)} ${f(hw)} ${y}" stroke="#0a140e" stroke-width="${w}" fill="none" opacity=".7"/><path d="M${f(-hw)} ${f(y - w)}Q0 ${f(y + 4 - w)} ${f(hw)} ${f(y - w)}" stroke="#e8d890" stroke-width=".45" fill="none" opacity=".45"/>`; }
    for (let i = 0; i < 30; i++) { const x = -44 + R() * 72, y = 4 + R() * 78, rx = 4 + R() * 11, ry = 2.4 + R() * 7; inn += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${pg})" transform="rotate(${f(R() * 60 - 30)} ${f(x)} ${f(y)})"/>`; }
    for (let i = 0; i < 9; i++) { const x = -30 + R() * 60, y = 8 + R() * 30, l = 14 + R() * 30; inn += `<path d="M${f(x)} ${f(y)}q${f(R() * 2 - 1)} ${f(l * .5)} ${f(R() * 3 - 1.5)} ${f(l)}" stroke="#6ab898" stroke-width="${f(1 + R() * 1.6)}" fill="none" opacity=".45" stroke-linecap="round"/>`; }
    b += `<g clip-path="url(#${bc})">${inn}</g>`;
    // the mouth: dark inside with the green glow of the strike; the clapper swung against the left lip
    b += `<ellipse cx="0" cy="83" rx="46" ry="7" fill="url(#${mo})"/><path d="M-46 83Q0 92 46 83" stroke="#c8b878" stroke-width="1" fill="none"/>`;
    b += `<path d="M-10 85L-33 89.6" stroke="#0a0e0c" stroke-width="2.6" stroke-linecap="round"/><path d="M-10 84.2L-33 88.8" stroke="#9effd0" stroke-width=".4" opacity=".6"/>` + K.shadeSphere(u, -37, 90, 5.4, L, 'iron', { outline: .4 });
    // barnacles and shells along the lip, weed hanging down
    for (let i = 0; i < 16; i++) { const t = -.95 + R() * 1.9, x = t * 44, y = 83.4 - Math.abs(t) * 4 - R() * 9, r = .7 + R() * 1.3;
      b += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .75)}" fill="#7a8070" stroke="#2a3028" stroke-width=".3"/><ellipse cx="${f(x - r * .25)}" cy="${f(y - r * .25)}" rx="${f(r * .45)}" ry="${f(r * .3)}" fill="#c8ccb8" opacity=".8"/><circle cx="${f(x + r * .1)}" cy="${f(y)}" r="${f(r * .22)}" fill="#1a1e18"/>`; }
    for (let i = 0; i < 5; i++) { const x = -26 + i * 15 + R() * 6, l = 6 + R() * 10; b += `<path d="M${f(x)} ${f(85 + R())}q${f(R() * 4 - 2)} ${f(l * .5)} ${f(R() * 5 - 1)} ${f(l)}" stroke="#2a5a3c" stroke-width="${f(1 + R())}" fill="none" stroke-linecap="round" opacity=".9"/>`; }
    // the strike: a burst of green light where the clapper hits the lip
    b += K.localGlow(u, { x: -40, y: 84, color: '#b8ffe0', power: .9, radius: 16 }) + `<path d="M-46 82l-8 -4M-46 86l-9 1M-44 92l-6 5M-44 78l-5 -7" stroke="#e8fff4" stroke-width=".6" opacity=".9"/>`;
    fg += `<g transform="translate(${BELL.x} ${BELL.y}) rotate(${BELL.rot})">${b}</g>`;
    // the iron straps from the beam to the crown
    fg += `<path d="M90 9L95 18M106 8L101 18" stroke="#1a1e1c" stroke-width="2.2"/><path d="M90.6 9L95.4 17M106.4 8.4L101.6 17" stroke="#8a9a8a" stroke-width=".4" opacity=".7"/>`;
    // ——— the Dutchman's rail under the glass: weed, shells, cold mist on the deck
    fg += K.bulwark(u, L, { x1: -10, x2: 210, y: 176, h: 34, kind: 'oak', posts: 30, seed: 8 });
    { const dc = nid('dk', u); fg += `<defs><clipPath id="${dc}"><rect x="-10" y="176" width="220" height="120"/></clipPath></defs><g clip-path="url(#${dc})">${K.deck(u, L, { horizon: HZ, top: 176, bottom: 290, vx: 100, kind: 'oak', plank: 14, seed: 4, wet: true })}</g>`; }
    for (let i = 0; i < 14; i++) { const x = -6 + i * 16 + R() * 8, l = 6 + R() * 12; fg += `<path d="M${f(x)} 143q${f(R() * 3 - 1.5)} ${f(l * .5)} ${f(R() * 3 - 1)} ${f(l)}" stroke="#2a5a3c" stroke-width="${f(1 + R())}" fill="none" stroke-linecap="round" opacity=".85"/>`; }
    fg += K.fog(u, L, { y: 150, h: 60, density: .5, seed: 9 });
    const gl = nid('gl', u);
    fg += `<defs>${linGrad(gl, 0, 150, 0, 290, [[0, '#040a08', 0], [.4, '#040a08', .45], [1, '#020504', .8]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${gl})"/>`;
    return [bg, fg];
  } };
