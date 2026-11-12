// «Ясное небо» (Колода моря): not a cloud, a high white sun, the air clear to the far headland. We kneel by a gun on
// our open deck: its barrel lies across the frame and points through the port straight at the brig lying broadside
// opposite, whose own guns are run out at us; the slow match smokes straight up in the still clear air. Every port of
// the brig reads — the day for a straight shot (card: shots at the ship straight opposite deal +1 damage).
// The manner of «Ядра» (first round): the gun in profile, our side seen edge-on as one post, the sea beyond it.
// Brief: docs/mockups/print/card-briefs.md «Ясное небо»; docs/tasks/print-kit-cards.md «Ясное небо».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 118, WL = 127;          // horizon (our eye, kneeling at the gun); the brig's waterline
const SIDE = 84;                   // our side seen edge-on: the post's middle x
const SUN = { x: 126, y: 24 };     // high in the clear sky, between the brig's masts and the price corner
const AIM = [152, 121.4];          // the brig's midship port the shot flies into
const light = { time: 'day', haze: .03, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#fffbea', power: 1 }, fill: { color: '#5d9be0', power: .6 } };
const GUN = { x: 40, y: 133, s: 1.28, turn: .1, elev: -.6, recoil: .35, sideX: 33, seed: 7 };
const BRIG = { kind: 'brig', x: 157, y: WL, scale: .9, flip: true, sails: 'reefed', detail: 'near', reflect: true, seed: 21 };
const skel = { horizon: HZ, eye: 1, light: 'the sun high in front of us over the brig: short shadows towards us and to the left, the glitter path under it; the barrel and the post lit along their tops',
  items: [
    ['gun', 6, GUN.y, 88, 42, 'stands on our deck, the muzzle through the port in the post'],
    ['post', SIDE - 7, 292, 14, 300, 'our side edge-on: rail, port, planking', { edge: 1 }],
    ['brig', 104, WL, 92, 88, 'on the water, broadside to us, guns run out'],
    ['headland', 168, 120, 40, 10, 'on the horizon, far'],
    ['shot', 8, 214, 40, 26, 'pyramid on the deck'],
    ['linstock', 60, 214, 18, 92, 'stands in a tub on the deck, match smoking'],
  ] };

module.exports = { name: 'Ясное небо', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1 });
    L.pal = Object.assign({}, L.pal, { sea: ['#7fb0c8', '#2f5f74', '#16323f'], sky: ['#1a49a2', '#2c69c0', '#69a5df', '#d3e7f3'] });
    // ——— beyond our side: sky, sun, the far headland and sails, the sea, the brig opposite
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7.5 });
    bg += headland(u, L) + `<g data-far="">${K.ship(u, L, { kind: 'merchant', x: 104, y: 119.2, scale: .14, detail: 'far', flip: true, seed: 4 })}</g>`;
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .25, seed: 14 });
    bg += K.ship(u, L, BRIG) + K.foam(u, { x: BRIG.x, y: WL + .2, w: 58, h: .9, L, seed: 6 });
    // ——— our deck, left of the side: planks running away to the bow, the sky over them through our rigging
    let fg = ourDeck(u, L);
    fg += shrouds(u, L);
    fg += post(u, L);
    // things on the deck, far to near: the gun, the linstock in its tub, the shot
    fg += K.castShadow(u, L, { x: GUN.x + 6, y: GUN.y, w: 30 * GUN.s, h: 21 * GUN.s, horizon: HZ, d: .5 }) + K.cannon(u, L, GUN);
    // the shot: smoke out of the port rolling towards the brig, the ball half way, dead on its side
    const m = K.cannon.muzzle(GUN), ball = [lerp(m.x, AIM[0], .52), lerp(m.y, AIM[1], .52)];
    fg += K.smoke(u, L, { x: m.x + 5, y: m.y + 5, w: 30, h: 26, wind: .9, seed: 8 });
    fg += shotTrail(u, L, [m.x + 14, m.y + .6], ball) + K.shadeSphere(u, ball[0], ball[1], 1.7, L, 'iron', { outline: .35 });
    fg += linstock(u, L, 14, 198);
    fg += K.shotPile(u, L, { x: 56, y: 216, s: 1.9, seed: 4 });
    fg += K.coil(u, L, { x: 36, y: 262, s: 2.2, seed: 9, tail: false });
    fg += sailShadow(u, L);
    return [bg, fg];
  } };

/** A far headland on the horizon, sharp in the clear air, with a white tower on the cape. */
function headland(u, L) {
  const P = L.pal, far = mix(P.sky[3], '#5a8aa4', .5), near = mix(P.sky[3], '#46748c', .62), id = nid('hl', u), y = HZ;
  let s = `<defs>${linGrad(id, 0, y - 9, 0, y, [[0, far], [1, near]])}</defs>`;
  s += `<path d="M170 ${y}C173 ${y - 1.2} 176 ${y - 3} 180 ${y - 3.6}C185 ${y - 4.3} 189 ${y - 6.6} 194 ${y - 7.1}C198 ${y - 7.4} 201 ${y - 6.8} 204 ${y - 6.4}L204 ${y}Z" fill="url(#${id})"/>`;
  s += `<path d="M180 ${y - 3.6}C185 ${y - 4.3} 189 ${y - 6.6} 194 ${y - 7.1}L193.4 ${y - 5.2}C189 ${y - 4.8} 185 ${y - 2.8} 181 ${y - 2.4}Z" fill="${mix(far, '#ffffff', .4)}" opacity=".55"/>`;
  s += `<path d="M185.4 ${y - 4.6}L185.8 ${y - 10.6}L187.6 ${y - 10.6}L188 ${y - 5.2}Z" fill="${mix('#f4f1e6', P.sky[3], .2)}"/><path d="M186.9 ${y - 10.6}L187.6 ${y - 10.6}L188 ${y - 5.2}L187.2 ${y - 5}Z" fill="${mix('#9fb2bd', P.sky[3], .25)}"/><path d="M185.5 ${y - 10.5}L187.9 ${y - 10.5}L187.5 ${y - 11.8}L185.9 ${y - 11.8}Z" fill="#5a6870"/>`;
  return s;
}

/** Our deck left of the side: planks converging to the bow (the vanishing point at the post on the horizon), the
 *  sky over the far deck; clipped at the post. */
function ourDeck(u, L) {
  const cid = nid('od', u);
  let s = `<defs><clipPath id="${cid}"><rect x="-12" y="${HZ}" width="${SIDE + 12}" height="${292 - HZ}"/></clipPath></defs>`;
  s += `<g clip-path="url(#${cid})">${K.deck(u, L, { horizon: HZ, top: HZ + 1.2, bottom: 292, vx: SIDE, seed: 12, plank: 30 })}</g>`;
  // the far end of our deck: the forecastle's breastwork across the deck near the horizon, a bell on it
  const fx = [[-12, HZ + 1.6], [SIDE - 3, HZ + 1.6], [SIDE - 3, HZ - 6.4], [-12, HZ - 6.4]];
  s += K.shadeBox(u, [{ pts: fx, n: 'front', kind: 'oak', grain: [1, 0] }, { pts: [[-12, HZ - 6.4], [SIDE - 3, HZ - 6.4], [SIDE - 3.4, HZ - 7.4], [-12, HZ - 7.4]], n: 'top', kind: 'oak', grain: [1, 0] }], L, 'oak', { seed: 31, outline: .4 });
  return s;
}

/** Our main shrouds rising from the chains at the side up and inboard out of the frame, ratlines across. */
function shrouds(u, L) {
  const rp = L.ramp('rope', 40, 60), feet = [[SIDE - 2, 84], [SIDE - 2.4, 78], [SIDE - 2.8, 73]], tops = [[-14, -14], [8, -14], [30, -14]];
  let s = '';
  feet.forEach((a, i) => { const b = tops[i]; s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${rp.outline}" stroke-width="${f(1.25 - i * .2)}" fill="none"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${rp.lit}" stroke-width=".35" opacity=".6" transform="translate(.35 -.3)" fill="none"/>`;
    s += K.shadeSphere(u, a[0] - 2, a[1] - 2.2, 2.2 - i * .3, L, 'oak', { outline: .4 }); });
  // ratlines: short sagging lines between the shrouds, closer together far up
  for (let t = .12; t < .95; t += .085) {
    const p = feet.map((a, i) => [lerp(a[0], tops[i][0], t), lerp(a[1], tops[i][1], t)]);
    for (let i = 0; i < 2; i++) s += `<path d="M${f(p[i][0])} ${f(p[i][1])}Q${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2 + 1.2)} ${f(p[i + 1][0])} ${f(p[i + 1][1])}" stroke="${rp.outline}" stroke-width=".42" fill="none" opacity=".85"/>`;
  }
  return s;
}

/** Our side seen edge-on: the rail cap at the top, the port the gun points through, the planking down to the bottom. */
function post(u, L) {
  const x0 = SIDE - 6, x1 = SIDE + 6, top = 88, pt = 102, pb = 122;
  const faces = [
    { pts: [[x0, top], [x1, top], [x1 + .4, pt], [x0 - .4, pt]], n: 'left', kind: 'oak', grain: [0, 1] },
    { pts: [[x0 - .4, pb], [x1 + .4, pb], [x1 + 1.2, 292], [x0 - 1.2, 292]], n: 'left', kind: 'oak', grain: [0, 1] },
    // the cap rail: its top catches the high sun
    { pts: [[x0 - 1.6, top - 2.4], [x1 + 1.6, top - 2.4], [x1 + 1.6, top], [x0 - 1.6, top]], n: 'top', kind: 'oak', grain: [1, 0] },
    // the sill of the port: lit from the sun beyond it
    { pts: [[x0 - .4, pb - 1.6], [x1 + .4, pb - 1.6], [x1 + .4, pb], [x0 - .4, pb]], n: 'top', kind: 'oak', grain: [1, 0] },
  ];
  let s = K.shadeBox(u, faces, L, 'oak', { seed: 17, outline: .5 });
  // the outer planking's edge: a dark strip of tarred wales on the sea side
  s += `<path d="M${f(x1 - 1.6)} ${pb}L${f(x1 + 1.2)} ${pb}L${f(x1 + 2.2)} 292L${f(x1 - .6)} 292Z" fill="${L.tone('tar', -.2, x1, 200)}"/>`;
  for (const y of [140, 176, 214, 252]) s += `<path d="M${f(x0 - .8)} ${y}L${f(x1 + 1.4)} ${y + .4}" stroke="${L.ramp('oak', x0, y).outline}" stroke-width=".5" opacity=".6"/>`;
  return s;
}

/** A linstock standing in its tub: the forked staff, the slow match glowing at its end, a thin wisp rising straight
 *  up — no wind. (x, y) — the tub's foot. */
function linstock(u, L, x, y) {
  let s = K.barrel(u, L, { x, y, s: .68, kind: 'water', open: true, seed: 5 });
  const top = [x + 4, y - 84];
  s += K.shadeCyl(u, x + .6, y - 12, top[0], top[1], 1.1, L, 'oak', { outline: .4, seed: 3 });
  // the fork at the head and the match wound round it, its glowing end
  const a = [top[0] - 2.6, top[1] - 5.4], b = [top[0] + 2.4, top[1] - 5.8];
  s += `<path d="M${f(top[0])} ${f(top[1])}Q${f(top[0] - 2)} ${f(top[1] - 1.4)} ${f(a[0])} ${f(a[1])}M${f(top[0])} ${f(top[1])}Q${f(top[0] + 2)} ${f(top[1] - 1.8)} ${f(b[0])} ${f(b[1])}" stroke="${L.ramp('iron', top[0], top[1]).core}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  s += K.rope(u, L, [[top[0] + .8, top[1] + 6], [top[0] - 1.6, top[1] + 3], [top[0] + 1.6, top[1] + .4], [top[0] - .8, top[1] - 2.4], [b[0], b[1]]], { r: .55, seed: 6 });
  s += K.localGlow(u, { x: b[0], y: b[1], color: '#ff7a2a', power: .8, radius: 4 }) + `<circle cx="${f(b[0])}" cy="${f(b[1])}" r=".8" fill="#ffd28a"/>`;
  s += K.smoke(u, L, { x: b[0], y: b[1] - .6, w: 7, h: 34, wind: .04, seed: 22, opacity: .55 });
  return s;
}

/** The thin smoke the shot drags behind it out of the muzzle cloud: a soft band narrowing towards the ball. */
function shotTrail(u, L, a, b) {
  const id = nid('st', u), bl = nid('sb', u), c = mix(L.pal.smoke, '#ffffff', .5);
  const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny), w0 = 2.2, w1 = .45;
  const p = [[a[0] + nx / nl * w0, a[1] + ny / nl * w0], [b[0] + nx / nl * w1, b[1] + ny / nl * w1], [b[0] - nx / nl * w1, b[1] - ny / nl * w1], [a[0] - nx / nl * w0, a[1] - ny / nl * w0]];
  return `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, c, .6], [.75, c, .32], [1, c, .08]])}<filter id="${bl}" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation=".6"/></filter></defs><path d="M${p.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
}

/** The shadow of our own sails over the near deck: a cool, sharp-edged shade (the clear sun gives hard edges); the
 *  gun stands in the sun beyond it. */
function sailShadow(u, L) {
  const id = nid('ss', u), bl = nid('sl', u), cid = nid('sc', u);
  return `<defs><clipPath id="${cid}"><rect x="-12" y="${HZ}" width="${SIDE - 6 + 12}" height="${292 - HZ}"/></clipPath><filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".8"/></filter>${linGrad(id, 0, 150, 0, 292, [[0, L.shadowMul, .9], [1, L.shadowMul, 1]])}</defs>`
    + `<g clip-path="url(#${cid})"><path d="M-12 168C10 166 40 160 ${SIDE} 146L${SIDE} 292L-12 292Z" fill="url(#${id})" filter="url(#${bl})" style="mix-blend-mode:multiply"/></g>`;
}
