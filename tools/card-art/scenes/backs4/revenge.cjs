// tools/card-art/scenes/backs4/revenge.cjs — the full-bleed back of «Месть королевы Анны» (user's plan 12.11, п. 14),
// a richer copy of the first round's back (portrait.cjs backArt('revenge')): sunset, a fiery red sky, the sun low on the
// left just above a bank of cloud on the horizon, long streaks of cloud lit red from below, rays fanning out of the sun;
// «Месть» large, bow to the right, heeling on the swell with her deck towards us, the low sun behind her high stern: the
// crimson sails glow through, a hot kant on every edge turned to the sun, her lanterns lit; the sun's path on the water;
// gulls against the glow.
// Contract — that of backs.cjs (see its head). No letters in the picture: the title goes on the calm dark-red sky at the
// top, the crest and the name on the darkened near water.
'use strict';
const K = require('../kit/index.cjs');
const { nid, f } = K;

const W = 200, H = 280, B = 10;
const HZ = 168;
const PLACES = { title: { y: 30 }, crest: { y: 214, d: 36 }, letter: null, name: { y: 248 } };
const SUN = { x: 36, y: 146 };

/** A long thin streak of cloud lit from below by the low sun: a soft lens, dark body, a hot lower edge towards the sun. */
function streak(u, o) {
  const g = nid('st', u), bl = nid('sb', u), x0 = o.x - o.w / 2, x1 = o.x + o.w / 2, y = o.y, h = o.h, R = K.rng(o.seed);
  const top = [], bot = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = K.lerp(x0, x1, t), e = Math.sin(Math.PI * t), wob = (R() - .5) * h * .5;
    top.push([x, y - h * e * (.7 + R() * .5) + wob * .4]); bot.unshift([x, y + h * .35 * e + wob * .2]); }
  const d = 'M' + top.concat(bot).map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  // lit from below and from the sun's side: the gradient runs from the sun's side bottom up
  const lx = (SUN.x - o.x) / Math.max(1, Math.abs(SUN.x - o.x));
  return `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${f(o.x + lx * o.w * .1)}" y1="${f(y + h * .4)}" x2="${f(o.x - lx * o.w * .05)}" y2="${f(y - h)}">`
    + `<stop offset="0" stop-color="${o.lit}" stop-opacity="${f(o.op)}"/><stop offset=".35" stop-color="${K.mix(o.lit, o.dark, .55)}" stop-opacity="${f(o.op * .95)}"/><stop offset="1" stop-color="${o.dark}" stop-opacity="${f(o.op * .85)}"/></linearGradient>`
    + `<filter id="${bl}" filterUnits="userSpaceOnUse" x="${f(x0 - 10)}" y="${f(y - h * 2 - 10)}" width="${f(o.w + 20)}" height="${f(h * 3 + 20)}"><feGaussianBlur stdDeviation="${f(o.blur || .9)}"/></filter></defs>`
    + `<path d="${d}" fill="url(#${g})" filter="url(#${bl})"/>`;
}

function revenge() {
  const u = 'bm' + (revenge.n = (revenge.n || 0) + 1);
  const base = K.LIGHTS.revenge;
  const light = Object.assign({}, base, { haze: .5, key: { type: 'sun', color: '#ffb468', power: 1, x: SUN.x, y: SUN.y }, fill: { color: '#7a3448', power: .4 }, rim: { az: 300, color: '#ffc27a', power: .8 } });
  const L = K.makeLight(light, { horizon: HZ });
  // the fiery palette of the first round's back: dark crimson at the top, red, orange, gold at the horizon
  L.pal = Object.assign({}, L.pal, { sky: ['#2c0a0e', '#7c1a16', '#d4482a', '#ffb45e'], sea: ['#e0844a', '#6e2420', '#1c0a0e'], cloudLit: '#ffa060', cloudShade: '#4a1420' });
  let s = K.sky(u, L, { horizon: HZ, stars: false, seed: 13 });
  // rays fanning out of the sun over the sky (screen, soft)
  { const rg = nid('ry', u), bl = nid('rb', u); let rays = '';
    const R = K.rng(31);
    for (let i = 0; i < 9; i++) { const a = -175 + i * 19 + (R() - .5) * 8, sp = 2.2 + R() * 3, len = 260;
      const p = d => [SUN.x + Math.cos((a + d) * Math.PI / 180) * len, SUN.y + Math.sin((a + d) * Math.PI / 180) * len];
      const [ax, ay] = p(-sp), [bx, by] = p(sp);
      if (Math.min(ay, by) > SUN.y) continue;
      rays += `<path d="M${SUN.x} ${SUN.y}L${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}Z" opacity="${f(.35 + R() * .5)}"/>`; }
    s += `<defs><radialGradient id="${rg}" gradientUnits="userSpaceOnUse" cx="${SUN.x}" cy="${SUN.y}" r="190"><stop offset="0" stop-color="#ffd090" stop-opacity=".46"/><stop offset=".5" stop-color="#ff9a58" stop-opacity=".16"/><stop offset="1" stop-color="#ff9a58" stop-opacity="0"/></radialGradient>`
      + `<filter id="${bl}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="300"><feGaussianBlur stdDeviation="3.2"/></filter></defs>`
      + `<g fill="url(#${rg})" filter="url(#${bl})" style="mix-blend-mode:screen">${rays}</g>`; }
  // long streaks of cloud across the sky, darker and bigger higher up, hot at their lower edges near the sun
  const ST = [[150, 52, 120, 4.5, 3], [52, 70, 110, 3.6, 4], [140, 88, 130, 4, 5], [70, 104, 120, 3.2, 6], [168, 116, 90, 2.6, 7], [30, 124, 70, 2.2, 8], [118, 132, 100, 2.4, 9], [60, 140, 60, 1.6, 10]];
  for (const [x, y, w, h, sd] of ST) { const near = 1 - K.clamp(Math.hypot(x - SUN.x, y - SUN.y) / 170), hi = 1 - y / HZ;
    s += streak(u, { x, y, w, h, seed: sd, lit: K.mix('#ff8a48', '#ffe0a0', near * .7), dark: K.mix('#4a1018', '#8a2a24', 1 - hi), op: .55 + .3 * hi, blur: .6 + hi * .8 }); }
  s += K.sunMoon(u, L, { r: 8.5 });
  // a bank of cloud on the horizon under the sun, dark against it, its tops lit
  s += K.cloudBank(u, L, { y: HZ - 1, h: 9, x0: -30, x1: 230, n: 7, seed: 41, far: .55 });
  s += K.water(u, L, { horizon: HZ, bottom: 300, swell: .75, seed: 6, glitter: SUN.x });
  // gulls against the bright sky near the sun
  for (const [x, y, k] of [[66, 118, 1.2], [78, 110, .9], [58, 104, .7]]) s += `<path d="M${x - 3 * k} ${y}q${1.5 * k} ${-1.6 * k} ${3 * k} ${.1 * k}q${1.5 * k} ${-1.7 * k} ${3 * k} ${-.1 * k}q${-1.5 * k} ${.5 * k} ${-3 * k} ${.9 * k}q${-1.5 * k} ${-.4 * k} ${-3 * k} ${-.9 * k}z" fill="#3a0e12" opacity=".85"/>`;
  // the near water goes dark and calm under the crest and the name
  { const gw = nid('gw', u); s += `<defs><linearGradient id="${gw}" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="236"><stop offset="0" stop-color="#14060a" stop-opacity="0"/><stop offset="1" stop-color="#14060a" stop-opacity=".66"/></linearGradient></defs><rect x="-20" y="196" width="240" height="110" fill="url(#${gw})"/>`; }
  // «Месть»: bow to the right, under all sail, the deck towards us, her bow lifting on the swell
  const bx = K.shipBox('revenge', { x: 0, y: 0, scale: 1 }), sc = Math.min(138 / bx.w, 116 / bx.h);
  const Ls = K.makeLight(Object.assign({}, light, { key: Object.assign({}, light.key, { power: .8 }), rim: Object.assign({}, light.rim, { power: .95 }) }), { horizon: HZ });
  Ls.pal = L.pal;
  const po = { kind: 'revenge', x: 110, y: HZ + 9, scale: sc, flip: true, heel: -2.5, roll: 8, sails: 'full', wake: true, reflect: true, lights: true, seed: 5 };
  // the sun's hot kant: the silhouette in gold shifted towards the sun, shown only in a thin ring round her outline
  { const mk = nid('mk', u), dl = nid('dl', u), sil = (c, k) => K.shipSilhouette('revenge', Object.assign({}, po, { color: c, u: u + k }));
    s += `<defs><filter id="${dl}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="400"><feMorphology operator="dilate" radius="1"/></filter>`
      + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="400"><g filter="url(#${dl})">${sil('#ffffff', 'd')}</g>${sil('#000000', 'e')}</mask></defs>`
      + `<g mask="url(#${mk})"><g transform="translate(-.75 -.4)">${sil('#ffc477', 'm')}</g></g>`; }
  s += K.ship(u, Ls, po);
  // a bow wave and spray: she runs before the wind
  { const st = [110 + 50 * sc, HZ + 9]; s += K.splash(u, { x: st[0] - 2, y: st[1], w: 15, h: 8, seed: 4, L, wind: 1 }) + K.foam(u, { x: st[0] - 14, y: st[1] + .3, w: 28, h: 1.5, seed: 7, L }); }
  // warm air round the sun over everything (the masts near it melt a little into the light)
  s += K.localGlow(u, { x: SUN.x, y: SUN.y, color: '#ffc080', power: .35, radius: 46 }, { core: false });
  // the corners darker; no frame: the dark runs past the edge
  const g = nid('vg', u);
  s += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${SUN.x + 40}" cy="140" r="215"><stop offset=".5" stop-color="#16050a" stop-opacity="0"/><stop offset="1" stop-color="#16050a" stop-opacity=".5"/></radialGradient></defs><rect x="-10" y="-10" width="220" height="300" fill="url(#${g})"/>`;
  const body = `<g transform="translate(100 140) scale(1.1) translate(-100 -140)">${s}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" width="100%" height="100%">${body}</svg>`;
  return Object.assign({ svg, ground: '#8e2420', tone: 'dark', bleed: B }, JSON.parse(JSON.stringify(PLACES)));
}

module.exports = { draw: () => revenge() };
