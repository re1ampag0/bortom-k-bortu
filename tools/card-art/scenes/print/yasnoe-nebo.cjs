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
const AIM = [163, 121.6];          // the brig's midship port the shot flies into
const light = { time: 'day', haze: .03, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#fffbea', power: 1 }, fill: { color: '#5d9be0', power: .6 } };
const GUN = { x: 46, y: 133, s: 1.28, turn: .1, elev: -.6, recoil: .35, sideX: 33, seed: 7 };
const BRIG = { kind: 'brig', x: 165, y: WL, scale: .84, flip: true, sails: 'reefed', detail: 'near', reflect: true, seed: 21 };
const skel = { horizon: HZ, eye: 1, light: 'the sun high in front of us over the brig: short shadows towards us and to the left, the glitter path under it; the barrel and the post lit along their tops',
  items: [
    ['gun', 6, GUN.y, 88, 42, 'stands on our deck, the muzzle through the port in the post'],
    ['post', SIDE - 7, 292, 14, 300, 'our side edge-on: rail, port, planking', { edge: 1 }],
    ['brig', 104, WL, 92, 88, 'on the water, broadside to us, guns run out'],
    ['island', 124, 118, 84, 16, 'on the horizon behind the brig, far'],
    ['shot', 8, 214, 40, 26, 'pyramid on the deck'],
    ['linstock', 60, 214, 18, 92, 'stands in a tub on the deck, match smoking'],
  ] };

module.exports = { name: 'Ясное небо', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1 });
    L.pal = Object.assign({}, L.pal, { sea: ['#7fb0c8', '#2f5f74', '#16323f'], sky: ['#1a49a2', '#2c69c0', '#69a5df', '#d3e7f3'] });
    // ——— beyond our side: sky, sun, the far headland and sails, the sea, the brig opposite
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7.5 });
    bg += headland(u, L);
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .25, seed: 14 });
    bg += K.ship(u, L, BRIG) + K.foam(u, { x: BRIG.x, y: WL + .2, w: 58, h: .9, L, seed: 6 });
    // ——— our deck, left of the side: planks running away to the bow, the sky over them through our rigging
    let fg = ourDeck(u, L);
    fg += shrouds(u, L);
    // things on the deck, far to near: the gun, the linstock in its tub, the shot
    fg += post(u, L);
    fg += K.castShadow(u, L, { x: GUN.x + 6, y: GUN.y, w: 30 * GUN.s, h: 21 * GUN.s, horizon: HZ, d: .5 }) + K.cannon(u, L, GUN);
    // the shot: smoke out of the port rolling towards the brig, the ball half way, dead on its side
    const m = K.cannon.muzzle(GUN), ball = [lerp(m.x, AIM[0], .38), lerp(m.y, AIM[1], .38)];
    fg += gunSmoke(u, L, m);
    fg += shotTrail(u, L, [m.x + 16, m.y + .8], ball) + K.shadeSphere(u, ball[0], ball[1], 2, L, 'iron', { outline: .4 });
    fg += linstock(u, L, 14, 198);
    fg += K.shotPile(u, L, { x: 56, y: 216, s: 1.9, seed: 4 });
    fg += K.coil(u, L, { x: 36, y: 262, s: 2.2, seed: 9, tail: false });
    fg += sailShadow(u, L);
    return [bg, fg];
  } };

/** A far island on the horizon behind the brig, sharp in the clear air: a long ridge with a peak, its slopes lit
 *  towards the sun, a white tower on its right cape. */
function headland(u, L) {
  const P = L.pal, far = mix(P.sky[3], '#5a87a2', .55), near = mix(P.sky[3], '#46728a', .66), id = nid('hl', u), y = HZ;
  let s = `<defs>${linGrad(id, 0, y - 16, 0, y, [[0, far], [1, near]])}</defs>`;
  s += `<path d="M124 ${y}C130 ${y - 1.4} 136 ${y - 3.4} 142 ${y - 4.6}C150 ${y - 6.2} 156 ${y - 9.6} 164 ${y - 12.2}C170 ${y - 14} 175 ${y - 15.4} 180 ${y - 14.6}C186 ${y - 13.6} 190 ${y - 10.4} 196 ${y - 8.6}C200 ${y - 7.6} 204 ${y - 7.8} 208 ${y - 7.2}L208 ${y}Z" fill="url(#${id})"/>`;
  // the slopes towards the sun (left, up) catch the light; the gullies are darker
  s += `<path d="M142 ${y - 4.6}C150 ${y - 6.2} 156 ${y - 9.6} 164 ${y - 12.2}C170 ${y - 14} 175 ${y - 15.4} 180 ${y - 14.6}L176 ${y - 12.6}C170 ${y - 12.4} 164 ${y - 9.8} 158 ${y - 7.4}C152 ${y - 5.4} 147 ${y - 4.2} 143 ${y - 3.6}Z" fill="${mix(far, '#ffffff', .42)}" opacity=".55"/>`;
  s += `<path d="M180 ${y - 14.6}C186 ${y - 13.6} 190 ${y - 10.4} 196 ${y - 8.6}L194 ${y - 6}C188 ${y - 7.6} 184 ${y - 10.6} 180 ${y - 14.6}Z" fill="${mix(near, '#1d3a4a', .25)}" opacity=".45"/>`;
  s += `<path d="M199.4 ${y - 7.6}L199.8 ${y - 13.6}L201.6 ${y - 13.6}L202 ${y - 7.8}Z" fill="${mix('#f4f1e6', P.sky[3], .2)}"/><path d="M200.9 ${y - 13.6}L201.6 ${y - 13.6}L202 ${y - 7.8}L201.2 ${y - 7.7}Z" fill="${mix('#9fb2bd', P.sky[3], .25)}"/><path d="M199.5 ${y - 13.5}L201.9 ${y - 13.5}L201.5 ${y - 14.8}L199.9 ${y - 14.8}Z" fill="#5a6870"/>`;
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
  const rp = L.ramp('rope', 40, 60), feet = [[SIDE - 3.4, 83.4], [SIDE, 83.4], [SIDE + 3.4, 83.4]], tops = [[-14, -14], [6, -14], [26, -14]];
  let s = '';
  feet.forEach((a, i) => { const b = tops[i]; s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${rp.outline}" stroke-width="${f(1.25 - i * .2)}" fill="none"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${rp.lit}" stroke-width=".35" opacity=".6" transform="translate(.35 -.3)" fill="none"/>`;
    s += K.shadeSphere(u, a[0], a[1] - .4, 1.9, L, 'oak', { outline: .4 }); });
  // ratlines: short sagging lines between the shrouds, closer together far up
  for (let t = .12; t < .95; t += .085) {
    const p = feet.map((a, i) => [lerp(a[0], tops[i][0], t), lerp(a[1], tops[i][1], t)]);
    for (let i = 0; i < 2; i++) s += `<path d="M${f(p[i][0])} ${f(p[i][1])}Q${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2 + 1.2)} ${f(p[i + 1][0])} ${f(p[i + 1][1])}" stroke="${rp.outline}" stroke-width=".42" fill="none" opacity=".85"/>`;
  }
  return s;
}

/** Our side seen edge-on: the cap rail at the top, the planking down to the bottom; the gun stands at it with the
 *  muzzle run out past the side (the port is turned edge-on and hidden by the barrel). */
function post(u, L) {
  const x0 = SIDE - 6, x1 = SIDE + 6, top = 88;
  const faces = [
    { pts: [[x0, top], [x1, top], [x1 + 1.2, 292], [x0 - 1.2, 292]], n: 'left', kind: 'oak', grain: [0, 1] },
    // the cap rail: its top catches the high sun
    { pts: [[x0 - 1.6, top - 2.4], [x1 + 1.6, top - 2.4], [x1 + 1.6, top], [x0 - 1.6, top]], n: 'top', kind: 'oak', grain: [1, 0] },
  ];
  let s = K.shadeBox(u, faces, L, 'oak', { seed: 17, outline: .5 });
  // the outer planking's edge: a dark strip of tarred wales on the sea side
  s += `<path d="M${f(x1 - 1.8)} ${top}L${f(x1)} ${top}L${f(x1 + 1.2)} 292L${f(x1 - .6)} 292Z" fill="${L.tone('tar', -.2, x1, 200)}"/>`;
  // the port's sill and lintel seen edge-on: the cut of the planking above and below the barrel
  s += `<path d="M${f(x0 - .4)} 102.6L${f(x1 + .4)} 102.6M${f(x0 - .6)} 123.6L${f(x1 + .6)} 123.6" stroke="${L.ramp('oak', x0, 110).outline}" stroke-width=".7"/><path d="M${f(x0)} 103.2L${f(x1)} 103.2L${f(x1)} 123L${f(x0)} 123Z" fill="${L.shadowTint}" opacity=".55"/>`;
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
    + `<path d="M-12 168C10 166 40 160 ${SIDE - 6} 147L${SIDE - 6} 292L-12 292Z" fill="url(#${id})" filter="url(#${bl})" style="mix-blend-mode:multiply"/>`;
}

/** The smoke of the shot rolling out of the port along the bore: one billow of the kit's smoke laid on its side
 *  (it grows from the muzzle towards the brig and lifts a little at its far end). */
function gunSmoke(u, L, m) {
  const a = 80;  // the smoke's "up" turned to point along the bore, a little above it
  return K.smoke(u, L, { x: m.x + 3, y: m.y - 1, w: 16, h: 20, wind: .5, seed: 11, opacity: .9 })
    + `<g transform="translate(${f(m.x - .5)} ${f(m.y + .3)}) rotate(${a})">${K.smoke(u, L, { x: 0, y: 0, w: 26, h: 26, wind: -.2, seed: 8, opacity: 1 })}</g>`;
}
