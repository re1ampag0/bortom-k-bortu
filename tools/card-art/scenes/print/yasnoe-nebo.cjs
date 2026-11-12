// «Ясное небо» (Колода моря): not a cloud in the sky, the sun high over the sea, the air clear to the far headland.
// Two ships lie broadside to broadside straight opposite each other: from the side of the near one (we stand at its
// rail) a gun has just fired — the smoke rolls out over the water and the shot flies dead straight into the brig
// opposite, whose guns are run out at us. Card: shots at the ship straight opposite deal +1 damage.
// Brief: docs/mockups/print/card-briefs.md «Ясное небо»; docs/tasks/print-kit-cards.md «Ясное небо».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;

const HZ = 120, WL = 129;        // horizon; the brig's waterline
const SUN = { x: 86, y: 20 };    // the sun in the picture: high over the brig's bow, clear of the medal corner
const light = { time: 'day', haze: .03, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#fffbea', power: 1 }, fill: { color: '#5d9be0', power: .6 }, rim: { az: 0, color: '#fff6dc', power: .5 } };
const BRIG = { kind: 'brig', x: 116, y: WL, scale: 1.02, sails: 'reefed', detail: 'near', reflect: true, seed: 21 };
const AIM = { x: 112, y: 125.2 };  // the port in the brig's side the shot flies into
const skel = { horizon: HZ, eye: 3, light: 'the sun in the picture, high over the brig: the brig and our rail lit from behind, short shadows towards us; the glitter path under the sun runs to our side',
  items: [
    ['brig', 64, WL, 104, 98, 'on the water, broadside to us, guns run out'],
    ['headland', 150, 121, 56, 10, 'on the horizon, far'],
    ['smoke', 4, 176, 100, 70, 'rolls out of our side below the rail'],
    ['shot', 100, 132, 6, 6, 'in flight, on the line from our port to the brig\'s port'],
    ['rail', -10, 290, 220, 116, 'our bulwark, its top y 174', { edge: 1 }],
  ] };

module.exports = { name: 'Ясное небо', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    L.pal = Object.assign({}, L.pal, { sea: ['#7fb0c8', '#2f5f74', '#16323f'], sky: ['#1d4fa8', '#2f6fc4', '#6aa6e0', '#cfe4f2'] });
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7.5 });
    bg += headland(u, L) + farSails(u, L);
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: .25, seed: 14 });
    bg += K.ship(u, L, BRIG) + K.foam(u, { x: BRIG.x, y: WL + .2, w: 64, h: .9, L, seed: 6 });
    bg += runOut(u, L);
    // ——— the shot: smoke out of our side, the ball on its way, its thin wake of smoke
    let fg = K.smoke(u, L, { x: 34, y: 178, w: 64, h: 48, wind: .55, seed: 8, opacity: .95 });
    fg += K.smoke(u, L, { x: 70, y: 176, w: 34, h: 26, wind: .7, seed: 13, opacity: .8 });
    fg += shotTrail(u, L, [78, 150], [AIM.x - 7, AIM.y + 5.4]);
    fg += K.shadeSphere(u, AIM.x - 7, AIM.y + 5.4, 1.5, L, 'iron', { outline: .35 });
    // ——— our rail across the bottom: dark, calm, lit from behind
    fg += K.bulwark(u, L, { x1: -10, x2: 210, y: 292, h: 118, kind: 'oak', posts: 34, seed: 5 });
    fg += K.coil(u, L, { x: 150, y: 171, s: 1.6, seed: 3 });
    return [bg, fg];
  } };

/** A far headland on the horizon, sharp in the clear air: a long ridge, a cliff to the sea, a white tower on the cape. */
function headland(u, L) {
  const P = L.pal, far = mix(P.sky[3], '#5f8fa8', .55), near = mix(P.sky[3], '#4d7b92', .7), id = nid('hl', u);
  let s = `<defs>${linGrad(id, 0, 108, 0, HZ, [[0, far], [1, near]])}</defs>`;
  s += `<path d="M146 ${HZ}C150 118.6 154 116.8 158 116.2C163 115.4 166 113 171 112.4C176 111.8 180 113.4 184 112.6C189 111.6 194 110.4 202 111L202 ${HZ}Z" fill="url(#${id})"/>`;
  // the lit faces of the ridge towards the sun (left) and the cliff over the sea
  s += `<path d="M158 116.2C163 115.4 166 113 171 112.4L170.4 114.2C166 114.6 162 116.6 158.6 117.4Z" fill="${mix(far, '#ffffff', .35)}" opacity=".6"/>`;
  s += `<path d="M146 ${HZ}C148.6 119.2 151 118.2 153 117.6L153.6 ${HZ}Z" fill="${mix(near, '#1d3a4a', .3)}" opacity=".7"/>`;
  // the tower: a white shaft with its shadow side and the dark lantern on top
  s += `<path d="M176.2 112.2L176.6 106.4L178.4 106.4L178.8 112Z" fill="${mix('#f4f1e6', P.sky[3], .2)}"/><path d="M177.8 106.4L178.4 106.4L178.8 112L178 112.1Z" fill="${mix('#9fb2bd', P.sky[3], .2)}"/><path d="M176.3 106.5L178.7 106.5L178.3 105.2L176.7 105.2Z" fill="#5a6870"/>`;
  return s;
}
/** Two sails far off on the horizon: the other pair of the line, seen to their hulls in the clear air. */
function farSails(u, L) {
  return `<g data-far="">${K.ship(u, L, { kind: 'merchant', x: 26, y: 121.2, scale: .2, detail: 'far', seed: 4 })}${K.ship(u, L, { kind: 'brig', x: 44, y: 121, scale: .17, detail: 'far', flip: true, seed: 8 })}</g>`;
}
/** The brig's guns run out at us: the muzzles stand out of the open ports, seen almost end on. */
function runOut(u, L) {
  let s = '';
  const xs = [94, 101.5, 109, 116.5, 124, 131.5];
  for (const x of xs) {
    const y = 125.2;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.05" ry=".95" fill="#22262b"/><ellipse cx="${f(x - .15)}" cy="${f(y - .2)}" rx=".8" ry=".7" fill="none" stroke="#5c646c" stroke-width=".28"/><circle cx="${f(x)}" cy="${f(y)}" r=".42" fill="#07080a"/>`;
  }
  return s;
}
/** The thin smoke the shot drags behind it from the muzzle cloud: a soft line narrowing towards the ball. */
function shotTrail(u, L, a, b) {
  const id = nid('st', u), bl = nid('sb', u), c = mix(L.pal.smoke, '#ffffff', .4);
  const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny), w0 = 2.6, w1 = .5;
  const p = [[a[0] + nx / nl * w0, a[1] + ny / nl * w0], [b[0] + nx / nl * w1, b[1] + ny / nl * w1], [b[0] - nx / nl * w1, b[1] - ny / nl * w1], [a[0] - nx / nl * w0, a[1] - ny / nl * w0]];
  return `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, c, .55], [.7, c, .3], [1, c, .05]])}<filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".7"/></filter></defs><path d="M${p.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
}
