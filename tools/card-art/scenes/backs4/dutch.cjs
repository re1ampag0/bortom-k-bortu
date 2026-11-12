// tools/card-art/scenes/backs4/dutch.cjs — the full-bleed back of the Flying Dutchman deck (backs4.cjs, the user's plan
// 12.11 п. 14), from the back of the first round (portrait.cjs backArt('dutch')): night in a green haze, the pale moon
// upper left behind torn clouds, the Dutchman large and close, rolled towards us so her deck and the strong tumblehome of
// her bellied side show, her high stern lifted on a swell. The moon lights her from behind: a pale green kant along her edges, the sky through the rags of
// her sails; her stern lanterns burn pale green. Shafts of moonlight slant through the mist, a dim far cliff on the
// right, banks of fog over the water and round her waterline. The zenith and the near water stay dark and calm for
// the title, the crest and the name. Contract — backs.cjs (see its head); bleed 10 units on every side. No letters.
'use strict';
const K = require('../kit/index.cjs');
const { nid } = K;

const W = 200, H = 280, B = 10;
const HZ = 170;
const PLACES = { title: { y: 30 }, crest: { y: 216, d: 36 }, letter: null, name: { y: 250 } };
const MOON = { x: 50, y: 76 };

function draw() {
  const u = 'bg' + (draw.n = (draw.n || 0) + 1);
  const base = K.LIGHTS.dutchman;
  const light = Object.assign({}, base, { key: Object.assign({}, base.key, { x: MOON.x, y: MOON.y, power: .65 }), fill: Object.assign({}, base.fill, { power: base.fill.power * .7 }), rim: { az: 340, color: '#cff6e2', power: .8 } });
  const L = K.makeLight(light, { horizon: HZ });
  let s = K.sky(u, L, { horizon: HZ, stars: 34, seed: 8 });
  // the zenith goes almost black-green: the title lies on calm dark sky
  { const z = nid('zn', u); s += `<defs><linearGradient id="${z}" gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="92"><stop offset="0" stop-color="#040b09" stop-opacity=".85"/><stop offset=".5" stop-color="#07130f" stop-opacity=".4"/><stop offset="1" stop-color="#0a1a15" stop-opacity="0"/></linearGradient></defs><rect x="-20" y="-20" width="240" height="114" fill="url(#${z})"/>`; }
  s += K.sunMoon(u, L, { r: 9, seed: 3 });
  // torn clouds: one crosses under the moon, others lie low over the sea; a bank on the horizon lost in haze
  s += K.cloud(u, L, { x: 66, y: 96, w: 104, h: 16, seed: 31, far: .3 });
  s += K.cloud(u, L, { x: 170, y: 118, w: 80, h: 22, seed: 12, far: .45 });
  s += K.cloud(u, L, { x: 10, y: 132, w: 60, h: 14, seed: 27, far: .6 });
  s += K.cloudBank(u, L, { y: HZ - 3, h: 10, x0: -30, x1: 230, n: 6, seed: 19, far: .85 });
  // a far cliff on the right, dark and half lost in the mist
  { const c = K.mix(L.pal.sky[3], '#0a1814', .55); s += `<path d="M118 ${HZ + .5}C128 ${HZ - 6} 136 ${HZ - 12} 146 ${HZ - 22}C150 ${HZ - 26} 156 ${HZ - 27} 160 ${HZ - 24}C166 ${HZ - 30} 172 ${HZ - 29} 178 ${HZ - 22}C186 ${HZ - 16} 198 ${HZ - 10} 214 ${HZ - 8}V${HZ + .5}Z" fill="${c}" opacity=".7"/>`; }
  // shafts of moonlight slanting down through the haze, to the right of the moon
  { const sh = nid('sh', u), bl = nid('sb', u);
    s += `<defs><linearGradient id="${sh}" gradientUnits="userSpaceOnUse" x1="${MOON.x}" y1="${MOON.y}" x2="${MOON.x + 80}" y2="${HZ + 10}"><stop offset="0" stop-color="#cff6e2" stop-opacity=".28"/><stop offset=".6" stop-color="#9fd0bc" stop-opacity=".12"/><stop offset="1" stop-color="#9fd0bc" stop-opacity="0"/></linearGradient><filter id="${bl}" filterUnits="userSpaceOnUse" x="-40" y="0" width="300" height="260"><feGaussianBlur stdDeviation="3.2"/></filter></defs>`
      + `<g filter="url(#${bl})" style="mix-blend-mode:screen">` + [[8, 16, 14, 34], [18, 26, 46, 62], [30, 38, 84, 96], [-6, 2, -30, -16]].map(([a, b, c, d]) => `<path d="M${MOON.x + a} ${MOON.y + 4}L${MOON.x + b} ${MOON.y + 4}L${MOON.x + d} ${HZ + 6}L${MOON.x + c} ${HZ + 6}Z" fill="url(#${sh})"/>`).join('') + '</g>'; }
  // the sea: a low swell, the moon's glitter path, then a bank of haze lying on the far water
  s += K.water(u, L, { horizon: HZ, bottom: 300, swell: .6, seed: 12, glitter: MOON.x });
  s += K.fog(u, L, { y: HZ - 16, h: 30, density: .55, seed: 4 });
  // the near water darkens: calm under the crest and the name
  { const gw = nid('gw', u); s += `<defs><linearGradient id="${gw}" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="236"><stop offset="0" stop-color="#030a08" stop-opacity="0"/><stop offset="1" stop-color="#030a08" stop-opacity=".72"/></linearGradient></defs><rect x="-20" y="196" width="240" height="110" fill="url(#${gw})"/>`; }
  // the Dutchman, close and large: rolled towards us so her deck and the tumblehome of the bulging side show (the
  // "pear" that tells her from the long low Pearl), on the slope of a swell with her high stern lifted; rags of sail
  const bx = K.shipBox('dutch', { x: 0, y: 0, scale: 1 }), sc = Math.min(168 / bx.w, 116 / bx.h);
  const po = { kind: 'dutch', x: 101 - (bx.x0 + bx.x1) / 2 * sc, y: HZ + 13, scale: sc, heel: 2.5, roll: 16, sails: 'full', wake: true, reflect: true, lights: true, seed: 6 };
  // the moon's kant, as in the pilot: the same silhouette in pale green moonlight, shifted towards the moon, laid under
  // the ship and masked to a thin ring round her outline
  { const mk = nid('mk', u), dl = nid('dl', u), sil = (c, k) => K.shipSilhouette('dutch', Object.assign({}, po, { color: c, u: u + k }));
    s += `<defs><filter id="${dl}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="400"><feMorphology operator="dilate" radius="1"/></filter>`
      + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="400"><g filter="url(#${dl})">${sil('#ffffff', 'd')}</g>${sil('#000000', 'e')}</mask></defs>`
      + `<g mask="url(#${mk})"><g transform="translate(-.75 -.55)">${sil('#c8f0dc', 'm')}</g></g>`; }
  s += K.ship(u, L, po);
  // mist round her waterline: she rises out of it
  // (the near bank lies below her waterline, so the bulging lower hull stays clear; the high one is thin)
  s += K.fog(u, L, { y: HZ + 11, h: 18, density: .32, seed: 9 }) + K.fog(u, L, { y: HZ - 40, h: 26, density: .15, seed: 15 });
  // a low green glow on the water about her, the ghost light of the ship
  s += K.localGlow(u, { x: 112, y: HZ + 10, color: '#7fe3c0', power: .2, radius: 80 }, { squash: .25, core: false });
  // night air: the corners darker (no frame: the dark runs past the edge)
  { const g = nid('vg', u); s += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="96" cy="126" r="205"><stop offset=".5" stop-color="#020806" stop-opacity="0"/><stop offset="1" stop-color="#020806" stop-opacity=".5"/></radialGradient></defs><rect x="-20" y="-20" width="240" height="320" fill="url(#${g})"/>`; }
  const body = `<g transform="translate(100 140) scale(1.1) translate(-100 -140)">${s}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" width="100%" height="100%">${body}</svg>`;
  return Object.assign({ svg, ground: '#2f6b4a', tone: 'dark', bleed: B }, PLACES);
}

module.exports = { draw };
