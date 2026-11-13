// «Брандер» (Месть королевы Анны, ПРИКАЗ: поставьте 2 Пожара на любой вражеский корабль), refined from the
// first-round scene (portrait-revenge.cjs SCENES['Брандер']): the same idea — an old burning vessel with no one aboard
// running before the wind at the Company ship, its column of fire and pitch smoke going up and bending over towards
// her. Kept: the composition (the fireship big in the middle, the enemy on the right, the column out of the top),
// the tar barrels burning on deck. Fixed against the first round: the fireship was a flat tray with a slab of fire
// on it — now the kit's brig (two masts, set sails, rigging) under full sail, her deck ablaze between the masts, the
// flames climbing into her courses, burnt holes in the canvas, barrels of tar burning at bow and stern; the enemy was a
// tinted sprite — now the kit's Endeavour, lit from the side that faces the fire; the light was a wash — now the
// fire is the one light of the picture: it lights her own sails from below, the smoke, the enemy's bow and the water.
// Far on the left, on the horizon, the Revenge that let her go.
// Light: the fire on the fireship's deck (key, point); the last of the sunset low on the horizon (palette only).
'use strict';
const K = require('../kit/index.cjs');
const { f, nid, linGrad, radGrad, rng } = K;

const HZ = 106;
const FS = { kind: 'brig', x: 64, y: 122, scale: 1.0, flip: true, roll: 8, heel: 1.5, sails: 'full', seed: 11 };   // the fireship, bow to the right
const EN = { kind: 'endeavour', x: 182, y: 111, scale: .52, sails: 'full', seed: 4 };                               // the enemy, bow to the left
const REV = { kind: 'revenge', x: 13, y: 107.4, scale: .2, flip: true, sails: 'full', detail: 'far', seed: 3 };
const FIRE = { x: 66, y: 112 };                                                                                        // the deck fire
const light = { time: 'dusk', haze: .3, key: { type: 'point', x: FIRE.x, y: FIRE.y - 16, h: 5, gy: 116, color: '#ff9440', power: 1, radius: 150, z: .3 },
  fill: { color: '#4a2a44', power: .38 }, rim: { az: 270, color: '#ffb070', power: .35 } };
const skel = { horizon: HZ, eye: 4, light: 'the fire on the fireship\'s deck (key, point); the last of the sunset (palette)', items: [
  ['fireship', 24, FS.y, 104, 87, 'water: broadside, bow to the right, before the wind'],
  ['deck fire', FIRE.x - 22, FIRE.y, 44, 62, 'her deck between the masts'],
  ['barrels', 44, 115, 64, 10, 'her deck at bow and stern'],
  ['smoke column', 40, 70, 160, 74, 'from the fire up out of the top, bending right'],
  ['enemy', 137, EN.y, 63, 58, 'water'],
  ['revenge', 0, REV.y, 28, 23, 'water: on the horizon']] };

// a tar barrel on the deck with fire pouring out of its open head (KIT-CANDIDATE: a burning barrel)
function tarBarrel(u, L, o) {
  const { x, y, s = .3 } = o;
  return K.barrel(u, L, { x, y, s, kind: 'powder', open: true, seed: o.seed })
    + K.fire(u, { x, y: y - 29 * s, w: 18 * s, h: o.h || 40 * s, seed: o.seed + 3, wind: .55, glow: false, pool: false });
}

module.exports = { name: 'Брандер', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, { sky: ['#120a16', '#36121e', '#7e2c1e', '#d0642c'], sea: ['#a8502e', '#3a1820', '#100810'], cloudLit: '#d86a40', cloudShade: '#301626' });
    const R = rng(31);
    // ——— the sky after sunset, dark above, an ember-red band on the horizon; the sea
    let bg = K.sky(u, L, { horizon: HZ, stars: 22, seed: 3 });
    for (const [x, y, w, h, sd, fr] of [[150, 30, 80, 8, 6, .2], [30, 58, 60, 6, 2, .4], [120, 92, 70, 4, 9, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .55, seed: 14, glitter: FIRE.x + 4 });
    // ——— the Revenge on the horizon that let her go, and the enemy ahead of her
    bg += K.ship(u, L, Object.assign({ wake: false }, REV));
    bg += K.ship(u, L, Object.assign({ wake: true, reflect: true, lights: true }, EN));
    // the fire's light on the enemy's bow and her sails' side facing it
    bg += K.localGlow(u, { x: 150, y: 92, color: '#ff9a48', power: .4, radius: 38 }, { core: false });

    // ——— the column of fire and pitch smoke, behind her sails: up out of the deck fire, bending right over the enemy
    const Ls = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#4a3430' }) });   // pitch smoke: dark, lit from below
    bg += K.smoke(u, Ls, { x: FIRE.x + 2, y: FIRE.y - 12, w: 60, h: 92, wind: .95, seed: 8, opacity: .95, glow: { color: '#ff7a2a', power: .9 } });
    bg += K.smoke(u, Ls, { x: FIRE.x + 24, y: FIRE.y - 30, w: 52, h: 80, wind: 1, seed: 17, opacity: .85, glow: { color: '#ff8a2a', power: .6 } });
    bg += K.smoke(u, Ls, { x: FIRE.x - 22, y: FIRE.y - 8, w: 30, h: 50, wind: .9, seed: 5, opacity: .8, glow: { color: '#ff7a2a', power: .7 } });
    bg += K.localGlow(u, { x: FIRE.x + 6, y: FIRE.y - 40, color: '#ff7a2a', power: .55, radius: 60 }, { core: false });

    // ——— the fireship: the kit's brig under full sail, running before the wind, nobody aboard
    let fg = K.ship(u, L, Object.assign({ wake: true, reflect: true }, FS));
    // the deck ablaze between the masts: a big fire standing on the deck, smaller ones along it
    fg += K.fire(u, { x: FIRE.x, y: FIRE.y + 1, w: 30, h: 48, seed: 7, wind: .6, fuel: true, pool: false })
      + K.fire(u, { x: FIRE.x + 16, y: FIRE.y + 1.5, w: 14, h: 24, seed: 12, wind: .6, glow: false, pool: false })
      + K.fire(u, { x: FIRE.x - 16, y: FIRE.y + 1.5, w: 12, h: 20, seed: 15, wind: .6, glow: false, pool: false });
    // the flames climbing into her courses: fire eating up from the foot of each, a black burnt hole above it
    for (const [x, y, w, h, sd] of [[58, 100, 16, 30, 21], [93, 102, 13, 22, 24], [70, 76, 8, 12, 27], [98, 80, 6, 9, 29]]) {
      fg += `<path d="M${f(x - w * .5)} ${f(y)}q${f(w * .2)} ${f(-h * .7)} ${f(w * .5)} ${f(-h * .9)}q${f(w * .35)} ${f(h * .25)} ${f(w * .5)} ${f(h * .9)}z" fill="#120806" opacity=".85"/>`
        + `<path d="M${f(x - w * .5)} ${f(y)}q${f(w * .2)} ${f(-h * .7)} ${f(w * .5)} ${f(-h * .9)}q${f(w * .35)} ${f(h * .25)} ${f(w * .5)} ${f(h * .9)}" stroke="#ff8a2a" stroke-width=".7" fill="none" stroke-dasharray="2 1.4"/>`
        + K.fire(u, { x, y, w, h, seed: sd, wind: .6, glow: false, pool: false }); }
    // the barrels of tar at her bow and stern, burning
    fg += tarBarrel(u, L, { x: 101, y: 115.6, s: .28, seed: 2 }) + tarBarrel(u, L, { x: 40, y: 114.4, s: .26, seed: 5 });
    // sparks and burning scraps carried off downwind
    for (let i = 0; i < 40; i++) { const x = FIRE.x - 10 + R() * 110, y = 20 + R() * 90, l = .6 + R() * 1.4; fg += `<path d="M${f(x)} ${f(y)}l${f(l)} ${f(-l * .3)}" stroke="${R() > .5 ? '#ffd98a' : '#ff8a2a'}" stroke-width="${f(.25 + R() * .35)}" stroke-linecap="round"/>`; }
    // the light of the fire: on her hull and canvas, on the water under her, its broken reflection running to us
    fg += K.localGlow(u, { x: FIRE.x, y: FIRE.y - 6, color: '#ffa040', power: .6, radius: 46 }, { core: false });
    fg += K.localGlow(u, { x: FIRE.x + 10, y: 84, color: '#ff8a3a', power: .45, radius: 40 }, { squash: 1.2, core: false });   // the canvas lit from below
    fg += K.localGlow(u, { x: FIRE.x + 6, y: FS.y + 4, color: '#ff8a30', power: .6, radius: 60 }, { squash: .25, core: false });
    for (let i = 0; i < 16; i++) { const y = FS.y + 3 + i * (1.4 + i * .3), w = (22 - i * .9) * (.6 + R() * .6), x = FIRE.x + 4 + (R() - .5) * 26;
      fg += `<path d="M${f(x - w / 2)} ${f(y)}h${f(w)}" stroke="${i < 4 ? '#ffc060' : '#ff7a2a'}" stroke-width="${f(1.1 - i * .05)}" opacity="${f(.75 - i * .04)}" stroke-linecap="round"/>`; }
    // the sea darkens under the glass, the corners close in round the fire
    { const g = nid('dk', u), v = nid('vg', u);
      fg += `<defs>${linGrad(g, 0, 140, 0, 290, [[0, '#100610', 0], [1, '#100610', .55]])}${radGrad(v, FIRE.x + 10, FIRE.y - 20, 150, [[0, '#0a0408', 0], [.5, '#0a0408', 0], [1, '#0a0408', .55]])}</defs>`
        + `<rect x="0" y="140" width="200" height="150" fill="url(#${g})"/><rect x="0" y="0" width="200" height="290" fill="url(#${v})"/>`; }
    return [bg, fg];
  } };
