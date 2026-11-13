// «Чёрные паруса в ночи» (Жемчужина, РЕАКЦИЯ: Залп по «Жемчужине» по диагонали отменён; из Плана — любой), refined
// from the first-round scene (portrait-pearl.cjs SCENES['Чёрные паруса в ночи']): a black night full of stars; the
// Pearl, black hull and black torn sails, slips away under all sail — she is only a shape cut out of the stars, her
// edges barely touched by the moon hidden behind a cloud bank (no lantern lit aboard). Far on the left the enemy's
// lanterns and lit ports burn and her broadside fires — at nothing: the balls drop into the empty black water between
// the two ships, well short of and away from the Pearl.
// The only warm light in the picture is the enemy's: the flashes, her windows, their streaks on the water.
// Brief: docs/mockups/print/card-briefs.md «Чёрные паруса в ночи» (her almost not seen: dark on dark).
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, lerp, clamp, nid, linGrad, radGrad, rng } = K;

const HZ = 104, WL = 116;
const MOON = { x: 156, y: 30 };              // behind the cloud bank: its glow and the silver edges only
const light = { time: 'night', haze: .4, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 34, color: '#b4c8ee', power: .42 }, fill: { color: '#24325a', power: .34 },
  rim: { az: 24, color: '#a8c4f0', power: .55 }, locals: [{ x: 20, y: HZ - 2, color: '#ffb050', power: .9, radius: 22 }] };
const PEARL = { kind: 'pearl', x: 112, y: WL, scale: .86, flip: true, sails: 'full', heel: 1.2, roll: -5, seed: 4 };
const ENEMY = { kind: 'endeavour', x: 17, y: HZ + .9, scale: .26, flip: true, detail: 'far', lights: true, sails: 'reefed', roll: 4, seed: 2 };
const skel = { horizon: HZ, eye: 3, light: 'the moon behind the cloud bank upper right: silver rims only; the enemy\'s flashes and lanterns warm, far left',
  items: [
    ['pearl', 53, WL, 142, 87, 'water (bow right, all sail)'],
    ['enemy', 4, HZ + .9, 32, 22, 'far water'], ['flashes', 13, HZ - 3, 16, 6, 'the enemy\'s side (her gun ports)'],
    ['splashes', 34, 111, 14, 10, 'empty water between the ships'],
    ['cloud bank + moon', 110, 52, 90, 30, 'sky'],
  ] };
const P2 = p => `${f(p[0])} ${f(p[1])}`;

// the Milky Way: a soft band across the sky, thick with small stars, dark rifts in it
function milkyWay(u) {
  const g = nid('mw', u), R = rng(77);
  let s = `<defs>${radGrad(g, 0, 0, 1, [[0, '#9fb0d8', .26], [.5, '#7088b8', .1], [1, '#4a5a88', 0]])}</defs>`;
  s += `<g transform="translate(96 46) rotate(-28)"><ellipse rx="130" ry="20" fill="url(#${g})" transform="scale(1)"/>`;
  { const d = nid('mr', u); s += `<defs>${radGrad(d, 0, 0, 1, [[0, '#060a16', .5], [1, '#060a16', 0]])}</defs><ellipse cx="-20" cy="3" rx="40" ry="4" fill="url(#${d})"/><ellipse cx="40" cy="-2" rx="30" ry="3" fill="url(#${d})"/>`; }
  for (let i = 0; i < 220; i++) { const x = (R() - .5) * 250, y = (R() + R() + R() - 1.5) * 16; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.12 + R() * .28)}" fill="#e8eeff" opacity="${f(.25 + R() * .5)}"/>`; }
  return s + '</g>';
}
// a few bright stars with small crosses of light
function brightStars(u) {
  let s = '';
  for (const [x, y, r] of [[22, 66, 1.1], [70, 22, .9], [128, 14, 1.2], [182, 70, 1], [100, 64, .8], [58, 84, .7], [190, 16, .8]]) {
    s += `<circle cx="${x}" cy="${y}" r="${r * .7}" fill="#ffffff"/><path d="M${x - r * 3} ${y}h${r * 6}M${x} ${y - r * 3}v${r * 6}" stroke="#dfe8ff" stroke-width="${f(r * .25)}" opacity=".7"/>`
      + K.localGlow(u, { x, y, color: '#cfdcff', power: .35, radius: r * 5 });
  }
  return s;
}
// the warm streaks of the enemy's lights and flashes on the water, broken by the ripples
function warmStreaks(u) {
  const R = rng(15); let s = '';
  for (const [x0, k] of [[17, 1], [23, .8], [8, .45], [12.5, .4]]) for (let i = 0; i < 14; i++) { const y = HZ + 1.6 + i * (1.1 + i * .12), w = (1.4 + i * .3 + R() * 1.6) * k + 1;
    s += `<path d="M${f(x0 - w / 2 + (R() - .5) * (1 + i * .3))} ${f(y)}h${f(w)}" stroke="${i < 4 ? '#ffd890' : '#ffb050'}" stroke-width="${f(.35 + i * .03)}" opacity="${f(clamp((.8 - i * .055) * k, 0, 1))}" stroke-linecap="round"/>`; }
  return s;
}

module.exports = { name: 'Чёрные паруса в ночи', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    // the sky: deep night, the Milky Way, many stars; the moon behind the cloud bank, its glow round the edges
    let bg = K.sky(u, L, { horizon: HZ, stars: 170, seed: 61, density: 1.2 }) + milkyWay(u) + brightStars(u);
    bg += K.sunMoon(u, L, { r: 6.6 });
    for (const [x, y, w, h, sd, fr] of [[152, 40, 86, 16, 4, 0], [182, 50, 50, 9, 9, .1], [116, 52, 44, 7, 13, .2], [196, 84, 34, 4, 21, .6], [86, 96, 40, 3, 27, .8]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    // the black water: a faint silver shimmer under the hidden moon, the swell
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 61, glitter: MOON.x });
    { const g = nid('dk', u); bg += `<defs>${linGrad(g, 0, HZ, 0, 280, [[0, '#04070e', .25], [.2, '#04070e', .45], [1, '#02040a', .7]])}</defs><rect x="0" y="${HZ}" width="200" height="${280 - HZ}" fill="url(#${g})"/>`; }
    // the enemy far left: her lanterns, her bow guns flashing to the right, the smoke drifting away with the wind
    bg += `<g data-far="">${K.ship(u, L, ENEMY)}</g>`;
    bg += K.smoke(u, L, { x: 21, y: HZ - 2.4, w: 18, h: 12, wind: .6, seed: 5, opacity: .55, glow: { color: '#ffb050', power: .7 } });
    bg += warmStreaks(u);
    // her warm lights: the stern lantern, the lit stern windows, two open gun ports
    for (const [x, y, r] of [[4.6, HZ - 6.2, .7], [6.4, HZ - 2.6, .55], [11, HZ - 1, .45], [26.5, HZ - 1.1, .45]]) bg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffd890"/>` + K.localGlow(u, { x, y, color: '#ffb050', power: .55, radius: r * 6 });
    // the broadside fires from her side, flat over the water toward nothing
    bg += K.muzzleFlash(u, { x: 16.5, y: HZ - 1.1, dir: 6, len: 7, seed: 2 }) + K.muzzleFlash(u, { x: 21.5, y: HZ - 1.0, dir: 2, len: 6, seed: 1 });
    bg += K.localGlow(u, { x: 19, y: HZ - 1.6, color: '#ffc070', power: .8, radius: 13 }) + K.localGlow(u, { x: 20, y: HZ + 4, color: '#ffb050', power: .35, radius: 12 }, { squash: .3, core: false });
    // the balls falling into the empty water between the ships, far from the Pearl: small columns lit warm from the left
    let fg = '';
    fg += K.splash(u, { x: 36.5, y: 108.6, w: 5, h: 8, seed: 3, L, wind: .3 }) + K.splash(u, { x: 42, y: 110.2, w: 5.5, h: 9, seed: 4, L, wind: .3 }) + K.splash(u, { x: 39.4, y: 111.4, w: 4, h: 3.4, seed: 5, L });
    fg += K.localGlow(u, { x: 39, y: 106, color: '#ffb050', power: .18, radius: 8 });
    // a low mist over the water between them
    fg += K.fog(u, L, { y: HZ - 2, h: 22, density: .22, seed: 8 });
    // the Pearl: a faint moonlit edge (her silhouette nudged towards the hidden moon), the ship, and the dark over her —
    // she stays a black shape on the dark, the torn sails letting the stars through; only the enemy glows
    const silB = Object.assign({}, PEARL, { u: u + 'r' });
    fg += `<g transform="translate(.45 -.4)" opacity=".26">${K.shipSilhouette('pearl', Object.assign({}, silB, { color: '#6a82ac' }))}</g>`;
    fg += K.ship(u, L, Object.assign({}, PEARL, { wake: true, lights: false }));
    fg += `<g opacity=".8">${K.shipSilhouette('pearl', Object.assign({}, PEARL, { u: u + 'd', color: '#03050b' }))}</g>`;
    // the faint wake behind her (to the left), foam just catching the moon
    for (const [x, y, w, sd] of [[48, WL + 1.2, 16, 41], [34, WL + 2.6, 14, 42], [62, WL + 4, 20, 43]]) fg += `<g opacity=".45">${K.foam(u, { x, y, w, h: .8, L, seed: sd })}</g>`;
    // the near swell under the glass, a few cold glints
    { const R = rng(91); for (let i = 0; i < 40; i++) { const y = 130 + Math.pow(R(), 1.3) * 140, x = R() * 200, w = 2 + (y - 130) * .06 + R() * 4; fg += `<path d="M${f(x)} ${f(y)}h${f(w)}" stroke="#8aa4cc" stroke-width="${f(.3 + (y - 130) * .004)}" opacity="${f(.12 + R() * .2)}" stroke-linecap="round"/>`; } }
    return [bg, fg];
  } };
