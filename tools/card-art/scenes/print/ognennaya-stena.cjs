// «Огненная стена» (Месть королевы Анны, РЕАКЦИЯ: после Залпа по вашей команде поставьте на стрелявшего Пожар и
// нанесите ему 1 урон по Корпусу; это не Залп), refined from the first-round scene (portrait-revenge.cjs
// SCENES['Огненная стена']): the same idea — a wall of fire standing up out of the sea between us and the ship that
// has just fired, tall at the sides, low in the middle where her hull shows through, its tongues already on her bow.
// Kept: the composition (the Company ship big and broadside behind the wall, the wall across the whole width), the
// night red with fire. Fixed against the first round: the wall was rows of flat paper tongues standing on a ruled
// line — now two rows of real fire on a burning slick of tar (the far row lower and dimmer, the near row taller), the
// slick spreading towards us in burning patches, every fire with its reflection; the ship was a tinted sprite with
// pale glued-on sails — now the kit's Endeavour lit from below by the wall (warm undersides of the sails and yards),
// the smoke of her own broadside still hanging at her ports; the flames on her bow were two dabs — now her head and
// stem are burning and the fire climbs her jib. The pitch smoke of the wall goes up in columns lit from below.
// Light: the wall of fire (key, point, low in front of her); the sky's last red at the horizon (palette only).
'use strict';
const K = require('../kit/index.cjs');
const { f, nid, linGrad, radGrad, rng } = K;

const HZ = 96;
const EN = { kind: 'endeavour', x: 118, y: 106, scale: .84, sails: 'full', seed: 6 };   // bow to the left, at us
const WALL = 117;                                                                       // the near row of the wall on the water
const light = { time: 'dusk', haze: .3, key: { type: 'point', x: 100, y: WALL - 14, h: 4, gy: WALL, color: '#ff9440', power: 1, radius: 170, z: .4 },
  fill: { color: '#3a2440', power: .36 }, rim: { az: 180, color: '#ffb070', power: .3 } };
const skel = { horizon: HZ, eye: 3, light: 'the wall of fire in front of her (key, point, low); the sky\'s last red (palette)', items: [
  ['enemy', 38, EN.y, 140, 93, 'water: broadside, bow to the left'],
  ['wall far row', 0, WALL - 5, 200, 40, 'water, against her hull'],
  ['wall near row', 0, WALL, 200, 70, 'water: tall at the sides, low in the middle'],
  ['bow fire', 40, 100, 34, 44, 'her head, stem and bowsprit, above the wall'],
  ['slick', 0, 132, 200, 16, 'water towards us: burning patches']] };

module.exports = { name: 'Огненная стена', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, { sky: ['#0c0810', '#22101a', '#561c1c', '#9a3a1e'], sea: ['#8a3a22', '#301218', '#0c060c'], cloudLit: '#b85032', cloudShade: '#24101c' });
    const R = rng(47);
    const Ls = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#3e2c2a' }) });   // pitch smoke
    const Lg = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#b8aaa0' }) });   // gun smoke
    // ——— the night: a few stars, low cloud, the sea
    let bg = K.sky(u, L, { horizon: HZ, stars: 40, seed: 7 });
    for (const [x, y, w, h, sd, fr] of [[60, 24, 80, 7, 4, .3], [170, 60, 50, 5, 10, .5]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .45, seed: 21, glitter: 100 });
    // ——— the ship that fired: broadside behind the wall, lit from below by it
    bg += K.ship(u, L, Object.assign({ wake: false, reflect: false, lights: true }, EN));
    // the smoke of her broadside still hanging along her ports, drifting left
    for (const [x, y, w, h, sd] of [[100, 98, 22, 15, 3], [124, 98, 26, 15, 6], [154, 97, 20, 13, 9]]) bg += K.smoke(u, Lg, { x, y, w, h, wind: -.7, seed: sd, opacity: .4, glow: { color: '#ff8a3a', power: .45 } });
    // the wall's light on her side and on the undersides of her sails
    bg += K.localGlow(u, { x: 108, y: 92, color: '#ff8a30', power: .5, radius: 70 }, { squash: .6, core: false })
      + K.localGlow(u, { x: 110, y: 60, color: '#ff9a48', power: .3, radius: 60 }, { core: false });
    // ——— the fire has jumped to her bow: her head and stem burning, the fire climbing her jib
    // tall tongues standing well above the wall's line there, against a soot-dark cloud behind them that outlines them
    const Lk = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#1a1210' }) });
    bg += K.smoke(u, Lk, { x: 58, y: 84, w: 34, h: 48, wind: -.45, seed: 14, opacity: .92, glow: { color: '#ff7a2a', power: .35 } })
      + K.localGlow(u, { x: 60, y: 80, color: '#ffa040', power: .75, radius: 30 }, { core: false })
      + K.fire(u, { x: 66, y: 100, w: 14, h: 34, seed: 33, wind: -.2, glow: false, pool: false })
      + K.fire(u, { x: 57, y: 91, w: 11, h: 30, seed: 36, wind: -.25, glow: false, pool: false })
      + K.fire(u, { x: 48, y: 82, w: 8, h: 22, seed: 39, wind: -.3, glow: false, pool: false });

    // ——— the wall. Its pitch smoke first, in columns lit from below, rising out of the top
    let fg = '';
    for (const [x, w, h, wind, sd] of [[14, 40, 96, 0.15, 2], [52, 30, 70, -.2, 5], [168, 38, 90, -.15, 8], [196, 30, 70, -.3, 11]])
      fg += K.smoke(u, Ls, { x, y: WALL - 26, w, h, wind, seed: sd, opacity: .9, glow: { color: '#ff6a20', power: .9 } });
    // the far row: lower and dimmer, against her hull; the slick under it glowing
    fg += K.localGlow(u, { x: 100, y: WALL - 2, color: '#ff8a30', power: .8, radius: 120 }, { squash: .12, core: false });
    // low in the middle, tall at the sides; on the left ~10 lower, so the burning bow stands above it
    const height = x => { const t = Math.abs(x - 108) / 100; return 13 + 54 * Math.pow(Math.min(1, t * 1.3), 1.5) - (x < 60 ? 10 : x < 80 ? (80 - x) / 2 : 0); };
    for (let i = 0; i < 12; i++) { const x = -6 + i * 18.6 + (R() - .5) * 5, h = height(x) * .7 * (.8 + R() * .3);
      fg += K.fire(u, { x, y: WALL - 4, w: 15 + R() * 6, h, seed: 50 + i, wind: (R() - .5) * .3, glow: false, pool: false }); }
    // the wall's dense body: an opaque band of fire at its foot, so it plainly stands IN FRONT of her hull (the tongues
    // over it are light, not glass: nothing of the hull shows through below its ragged top)
    { const g = nid('wb', u), b = nid('wf', u), pts = [];
      for (let x = -4; x <= 204; x += 4) pts.push([x, WALL + 2 - height(x) * .4 - 10 * Math.max(0, 1 - Math.abs(x - 58) / 22) + Math.sin(x * .7) * 1.6 + Math.sin(x * 1.9) * 1.1]);
      fg += `<defs>${linGrad(g, 0, WALL - 28, 0, WALL + 4, [[0, '#b83816'], [.5, '#ec7426'], [1, '#ffc458']])}<filter id="${b}" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`
        + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}L204 ${WALL + 5}L-4 ${WALL + 5}Z" fill="url(#${g})" filter="url(#${b})"/>`; }
    // the near row: taller, wider tongues, the gap in the middle where her hull shows
    for (let i = 0; i < 12; i++) { const x = -4 + i * 18.6 + (R() - .5) * 6, h = height(x) * (.85 + R() * .3);
      fg += K.fire(u, { x, y: WALL + 1 + (R() - .5) * 2, w: 20 + R() * 8, h, seed: 70 + i, wind: (R() - .5) * .35, glow: false, pool: false }); }
    // the burning slick spreading towards us: low fires in patches, each lighting the water under it
    for (const [x, y, w, h, sd] of [[20, 126, 10, 8, 91], [64, 124, 8, 6, 93], [140, 125, 9, 7, 95], [182, 128, 12, 9, 97], [104, 129, 6, 4, 99]]) {
      fg += `<ellipse cx="${f(x)}" cy="${f(y + .5)}" rx="${f(w * 1.2)}" ry="${f(w * .16)}" fill="#ff8a2a" opacity=".5"/>` + K.fire(u, { x, y, w, h, seed: sd, wind: (R() - .5) * .3, glow: false, pool: false })
        + K.localGlow(u, { x, y, color: '#ff9a3a', power: .45, radius: w * 3 }, { squash: .3, core: false }); }
    // the reflection of the wall on the water in front: broken streaks of orange running down to us
    for (let i = 0; i < 26; i++) { const y = WALL + 4 + i * (1.1 + i * .16), n = 3 + (i % 3);
      for (let k = 0; k < n; k++) { const x = R() * 200, w = (6 + R() * 18) * (1 - i / 34); fg += `<path d="M${f(x - w / 2)} ${f(y)}h${f(w)}" stroke="${i < 6 ? '#ffc060' : '#ff7a2a'}" stroke-width="${f(1 - i * .025)}" opacity="${f(.7 - i * .022)}" stroke-linecap="round"/>`; } }
    fg += K.localGlow(u, { x: 100, y: WALL + 12, color: '#ff8a30', power: .55, radius: 110 }, { squash: .18, core: false });
    // sparks thrown up out of the wall, carried a little to the left
    for (let i = 0; i < 46; i++) { const x = R() * 200, y = 30 + R() * 80, l = .5 + R() * 1.3; fg += `<path d="M${f(x)} ${f(y)}l${f(-l * .4)} ${f(-l)}" stroke="${R() > .5 ? '#ffd98a' : '#ff8a2a'}" stroke-width="${f(.25 + R() * .3)}" stroke-linecap="round"/>`; }
    // the sea darkens under the glass, the top corners close in
    { const g = nid('dk', u), v = nid('vg', u);
      fg += `<defs>${linGrad(g, 0, 146, 0, 290, [[0, '#0c050c', 0], [1, '#0c050c', .55]])}${radGrad(v, 100, 110, 150, [[0, '#08040a', 0], [.5, '#08040a', 0], [1, '#08040a', .5]])}</defs>`
        + `<rect x="0" y="146" width="200" height="144" fill="url(#${g})"/><rect x="0" y="0" width="200" height="290" fill="url(#${v})"/>`; }
    return [bg, fg];
  } };
