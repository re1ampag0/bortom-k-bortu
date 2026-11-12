// tools/card-art/scenes/backs4/endeavour.cjs — the full-bleed back of the Endeavour deck (backs4.cjs, the user's plan
// 12.11 п. 14), from the back of the first round (portrait.cjs backArt('endeavour')): a clear day, the light sea, the
// Endeavour large under all sail on the swell. The sun stands in the sky upper right, a little behind her: the cream
// sails glow at their edges, the ochre side is lit from the right; cumulus clouds lit from the same side, a hazy
// headland of a far coast on the left horizon, gulls, the sun's glitter path. The zenith deepens to the deck's blue
// (a calm place for the title), the near water darkens to deep teal (calm places for the crest and the name).
// Contract — backs.cjs (see its head); the picture runs 10 units past the card on every side (bleed). No letters.
'use strict';
const K = require('../kit/index.cjs');
const { nid } = K;

const W = 200, H = 280, B = 10;
const HZ = 172;
const PLACES = { title: { y: 30 }, crest: { y: 216, d: 36 }, letter: null, name: { y: 250 } };
const SUN = { x: 166, y: 74 };

function draw() {
  const u = 'bi' + (draw.n = (draw.n || 0) + 1);
  // the deck's day, the sun drawn in the picture; it lights from the right and a little from behind
  const base = K.LIGHTS.endeavour;
  const light = Object.assign({}, base, { haze: .3, key: Object.assign({}, base.key, { x: SUN.x, y: SUN.y, az: 74, el: 30 }), rim: { az: 74, color: '#fff4d8', power: .55 } });
  const L = K.makeLight(light, { horizon: HZ });
  let s = K.sky(u, L, { horizon: HZ, stars: false, seed: 5 });
  // the zenith deepens to the deck's blue: the title lies on a calm dark sky
  { const z = nid('zn', u); s += `<defs><linearGradient id="${z}" gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="96"><stop offset="0" stop-color="#173a6a" stop-opacity=".9"/><stop offset=".45" stop-color="#1f4a7e" stop-opacity=".45"/><stop offset="1" stop-color="#2a5a8e" stop-opacity="0"/></linearGradient></defs><rect x="-20" y="-20" width="240" height="120" fill="url(#${z})"/>`; }
  s += K.sunMoon(u, L, { r: 7 });
  // clouds: a high thin wisp under the title, a big cumulus left of the masts, small ones, a bank on the horizon
  s += K.cloud(u, L, { x: 34, y: 82, w: 70, h: 12, seed: 21, far: .55 });
  s += K.cloud(u, L, { x: 30, y: 136, w: 96, h: 34, seed: 7, far: .15 });
  s += K.cloud(u, L, { x: 128, y: 112, w: 46, h: 14, seed: 13, far: .5 });
  s += K.cloud(u, L, { x: 196, y: 128, w: 54, h: 20, seed: 17, far: .35 });
  s += K.cloudBank(u, L, { y: HZ - 2, h: 12, x0: -30, x1: 230, n: 7, seed: 5, far: .85 });
  // a far headland on the left horizon, blue with distance, a paler ridge behind it
  { const c1 = K.mix(L.pal.sky[3], '#6f8ea0', .55), c2 = K.mix(L.pal.sky[3], '#5d7f8c', .8), lt = K.mix(L.pal.sky[3], '#f4ecd4', .5);
    s += `<path d="M-14 ${HZ + .5}C-4 ${HZ - 9} 6 ${HZ - 14} 16 ${HZ - 15}C24 ${HZ - 18} 30 ${HZ - 19} 36 ${HZ - 15}C42 ${HZ - 12} 52 ${HZ - 8} 66 ${HZ - 4}L78 ${HZ + .5}Z" fill="${c1}" opacity=".75"/>`
      + `<path d="M-14 ${HZ + .5}C-8 ${HZ - 4} -2 ${HZ - 8} 8 ${HZ - 9}C14 ${HZ - 11} 22 ${HZ - 10} 28 ${HZ - 7}C36 ${HZ - 5} 44 ${HZ - 3} 54 ${HZ + .5}Z" fill="${c2}"/>`
      + `<path d="M8 ${HZ - 9}C14 ${HZ - 11} 22 ${HZ - 10} 28 ${HZ - 7}C36 ${HZ - 5} 44 ${HZ - 3} 54 ${HZ + .5}" stroke="${lt}" stroke-width=".7" fill="none" opacity=".55"/>`
      + `<path d="M-14 ${HZ + .1}H70" stroke="#f6f2e0" stroke-width=".6" opacity=".5"/>`; }
  // the sea: a long swell, the glitter path under the sun
  s += K.water(u, L, { horizon: HZ, bottom: 300, swell: .95, seed: 9, glitter: SUN.x });
  // the sun's glitter: a soft bright road on the water and sparkles along it, narrowing to the horizon
  { const gl = nid('gl', u); let r = 77; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    s += `<defs><radialGradient id="${gl}"><stop offset="0" stop-color="#fff6dc" stop-opacity=".42"/><stop offset=".5" stop-color="#e8f6ff" stop-opacity=".14"/><stop offset="1" stop-color="#e8f6ff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${SUN.x}" cy="${HZ + 14}" rx="26" ry="20" fill="url(#${gl})" style="mix-blend-mode:screen"/>`;
    for (let i = 0; i < 46; i++) { const t = Math.pow(rnd(), 1.4), y = HZ + 1 + t * 34, x = SUN.x + (rnd() - .5) * (8 + t * 46), w = .8 + t * 4 * rnd();
      s += `<path d="M${(x - w / 2).toFixed(1)} ${y.toFixed(1)}h${w.toFixed(2)}" stroke="#fffbe8" stroke-width="${(.25 + t * .5).toFixed(2)}" stroke-linecap="round" opacity="${(.5 + rnd() * .45).toFixed(2)}"/>`; } }
  // the near water deepens under the crest and the name: deep teal, calm
  { const gw = nid('gw', u); s += `<defs><linearGradient id="${gw}" gradientUnits="userSpaceOnUse" x1="0" y1="198" x2="0" y2="244"><stop offset="0" stop-color="#082436" stop-opacity="0"/><stop offset="1" stop-color="#082436" stop-opacity=".62"/></linearGradient></defs><rect x="-20" y="198" width="240" height="110" fill="url(#${gw})"/>`; }
  // gulls over the sea, right of the sun, away from the title
  s += [[150, 96, 1.1], [139, 103, .8], [176, 104, .7], [62, 104, .7]].map(([x, y, k]) => `<path d="M${x - 3 * k} ${y}q${1.4 * k} ${-1.8 * k} ${3 * k} 0q${1.6 * k} ${-1.8 * k} ${3 * k} 0" stroke="#3c4c5a" stroke-width="${.55 * k}" fill="none" stroke-linecap="round"/>`).join('');
  // the Endeavour: under all sail, her deck tilted a little to us, bow down on the face of a swell
  const bx = K.shipBox('endeavour', { x: 0, y: 0, scale: 1 }), sc = Math.min(166 / bx.w, 108 / bx.h);
  const po = { kind: 'endeavour', x: 100 - (bx.x0 + bx.x1) / 2 * sc, y: HZ + 7, scale: sc, heel: 1.5, roll: 7, sails: 'full', wake: true, reflect: true, lights: false, seed: 4 };
  s += K.ship(u, L, po);
  // the bow wave and spray: she runs before a fresh breeze
  { const st = [po.x + bx.x0 * sc + 36 * sc, HZ + 7]; s += K.splash(u, { x: st[0], y: st[1], w: 14, h: 8, seed: 5, L, wind: -1 }) + K.foam(u, { x: st[0] + 16, y: st[1] + .4, w: 34, h: 1.8, seed: 3, L }); }
  // the warm air of the sun over the rig, a soft corner darkening (no frame: the dark runs past the edge)
  s += K.localGlow(u, { x: SUN.x, y: SUN.y + 6, color: '#fff2cc', power: .22, radius: 70 }, { core: false });
  { const g = nid('vg', u); s += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="112" cy="128" r="205"><stop offset=".6" stop-color="#0a2238" stop-opacity="0"/><stop offset="1" stop-color="#0a2238" stop-opacity=".38"/></radialGradient></defs><rect x="-20" y="-20" width="240" height="320" fill="url(#${g})"/>`; }
  // drawn for 200 x 280 and scaled by 1.1 round the middle: it covers -10..210 x -14..294
  const body = `<g transform="translate(100 140) scale(1.1) translate(-100 -140)">${s}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" width="100%" height="100%">${body}</svg>`;
  return Object.assign({ svg, ground: '#24497a', tone: 'dark', bleed: B }, PLACES);
}

module.exports = { draw };
