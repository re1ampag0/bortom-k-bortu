// tools/card-art/scenes/backs-pilot.cjs — pilot of a full-bleed card back (docs/tasks/print-kit-agents.md А.4), from
// the back of the first round (portrait.cjs backArt('pearl')): «Чёрная жемчужина» at night under all sail, the moon
// behind her (black sails lit through at the edges, a silver kant), the moon's glitter path, a far dark island, low
// moonlit clouds; her stern lantern is the one warm light. The picture runs to the card's edge and 10 units past it
// on every side (svg viewBox -10 -10 220 300, the card is 0 0 200 280): no frame, no dissolving into a flat ground.
// Contract — that of backs.cjs (see its head): draw(kind) -> { svg, ground, tone, title, crest, letter, name, bleed }.
// Only kind 'pearl' is drawn here. No letters in the picture: the generator lays the title, the crest and the name
// over the calm places returned (the sky above the masts, the dark water under the ship).
'use strict';
const K = require('./kit/index.cjs');
const { nid, f } = K;

const W = 200, H = 280, B = 10;
const HZ = 170;   // the horizon: low, so the ship stands in the sky
const PLACES = { title: { y: 30 }, crest: { y: 214, d: 36 }, letter: null, name: { y: 248 } };

function pearl() {
  const u = 'bp' + (pearl.n = (pearl.n || 0) + 1);
  // the deck's night light with the moon put into the picture, upper right, behind the ship
  const base = K.LIGHTS.pearl, light = Object.assign({}, base, { key: { type: base.key.type, color: base.key.color, power: base.key.power, x: 150, y: 72 }, fill: Object.assign({}, base.fill, { power: (base.fill.power || .4) * .5 }), rim: Object.assign({}, base.rim, { power: .75 }) });
  const L = K.makeLight(light, { horizon: HZ });
  let s = K.sky(u, L, { horizon: HZ, stars: 90, seed: 4 });
  s += K.sunMoon(u, L, { r: 9 });
  // low clouds lit by the moon from behind, a thin veil crossing under the moon, a bank on the horizon
  s += K.cloud(u, L, { x: 52, y: 118, w: 120, h: 24, seed: 9, far: .55 });
  s += K.cloudBank(u, L, { y: HZ - 3, h: 10, x0: -30, x1: 230, n: 6, seed: 11, far: .8 });
  // a far island under the clouds on the left, dark against the sky
  s += `<path d="M-14 ${HZ + .5}C0 ${HZ - 7} 10 ${HZ - 10} 20 ${HZ - 9}C28 ${HZ - 13} 36 ${HZ - 12} 42 ${HZ - 6}C48 ${HZ - 4} 54 ${HZ - 2} 60 ${HZ + .5}Z" fill="${K.mix(L.pal.sky[3], '#0b0f1c', .62)}"/>`;
  s += K.localGlow(u, { x: 146, y: 80, color: '#cfe0ff', power: .55, radius: 92 }, { core: false });   // a bright moonlit sky behind the rig
  s += K.water(u, L, { horizon: HZ, bottom: 300, swell: .8, seed: 6, glitter: 150 });
  // the glitter path dies out before the near water: under the name the sea is dark and calm
  { const gw = nid('gw', u); s += `<defs><linearGradient id="${gw}" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="232"><stop offset="0" stop-color="#060a16" stop-opacity="0"/><stop offset="1" stop-color="#060a16" stop-opacity=".7"/></linearGradient></defs><rect x="-20" y="196" width="240" height="110" fill="url(#${gw})"/>`; }
  // the Pearl: under all sail, pitching a little bow up on the swell, her wake and her reflection
  const bx = K.shipBox('pearl', { x: 0, y: 0, scale: 1 }), sc = Math.min(170 / bx.w, 116 / bx.h);
  // she is lit by the same moon, but seen against it: the cloth and the tarred side stay black, the kant silver
  const Ls = K.makeLight(Object.assign({}, light, { key: Object.assign({}, light.key, { power: light.key.power * .55 }), fill: Object.assign({}, light.fill, { power: light.fill.power * .6 }), rim: Object.assign({}, light.rim, { power: .9 }) }), { horizon: HZ });
  const po = { kind: 'pearl', x: 100, y: HZ + 6, scale: sc, heel: -2, roll: 6, sails: 'full', wake: true, reflect: true, lights: true, seed: 3 };
  // the moon's kant, as in the first round: the same silhouette in pale moonlight, shifted towards the moon, laid
  // under the ship — it shows only along the edges turned to the moon
  s += `<g transform="translate(.7 -.55)">${K.shipSilhouette('pearl', Object.assign({}, po, { color: '#c4d4f2', u: u + 'm' }))}</g>`;
  s += K.ship(u, Ls, po);
  // her black: the same silhouette multiplied over her (the holes stay open — the sky shows through them), then the
  // cold kant of the moon (the ship's rim light, kept strong) on the edges turned to it
  s += `<g style="mix-blend-mode:multiply" opacity=".72">${K.shipSilhouette('pearl', Object.assign({}, po, { color: '#16130f', u: u + 's' }))}</g>`;
  // a bow wave thrown up and spray: she runs fast
  { const st = [100 - 61 * sc, HZ + 6]; s += K.splash(u, { x: st[0] + 2, y: st[1], w: 16, h: 9, seed: 2, L, wind: -1 }) + K.foam(u, { x: st[0] + 14, y: st[1] + .3, w: 30, h: 1.6, seed: 8, L }); }
  // night air: the corners of the sky and the near water go a little darker (no frame: the dark runs past the edge)
  const g = nid('vg', u);
  s += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="118" cy="120" r="210"><stop offset=".55" stop-color="#05070e" stop-opacity="0"/><stop offset="1" stop-color="#05070e" stop-opacity=".42"/></radialGradient></defs><rect x="-10" y="-10" width="220" height="300" fill="url(#${g})"/>`;
  // the scene is drawn for 200 x 280 and scaled by 1.1 round the card's middle: it then covers -10..210 x -14..294
  const body = `<g transform="translate(100 140) scale(1.1) translate(-100 -140)">${s}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" width="100%" height="100%">${body}</svg>`;
  return Object.assign({ svg, ground: '#26262a', tone: 'dark', bleed: B }, PLACES);
}

function draw(kind) {
  if (kind !== 'pearl') throw new Error('backs-pilot: only pearl is drawn');
  return pearl();
}

module.exports = { draw };
