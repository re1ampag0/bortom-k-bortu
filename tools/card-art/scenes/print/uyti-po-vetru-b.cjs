// «Уйти по ветру», variant b — the other composition for the user to choose from: the chase seen from behind the
// chaser. The Company ship is near and big on the right, whole in the frame, running before the same strong wind,
// her bow chaser fires — and the shot falls short, into the wake far astern of the Pearl. The Pearl is far ahead on
// the left, small, every black sail full, heeled, the low moon right behind her: she stands black against its glow
// (the sails lit through), the moon path runs to her. The wind blows from behind us to the left: flags, pennants,
// smoke and spume all go the way both ships go; only she is faster. Variant a (uyti-po-vetru.cjs) — the Pearl big.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, rng } = K;

const HZ = 96, PWL = 99, CWL = 121;   // horizon; the Pearl's waterline (far); the chaser's waterline (near)
const MOON = { x: 54, y: 66 };
const light = { time: 'night', haze: .4, key: { type: 'moon', x: MOON.x, y: MOON.y, az: 330, el: 16, color: '#c8d8f6', power: .8 }, fill: { color: '#3d5680', power: .42 },
  rim: { az: 340, color: '#bfe0ff', power: .6 }, locals: [{ x: 121, y: 111, color: '#ffc070', power: .5, radius: 16 }] };
const PEARL = { kind: 'pearl', x: 54, y: PWL, scale: .46, heel: -3, roll: 8, sails: 'full', wake: true, lights: true, detail: 'mid', seed: 4 };
const CHASE = { kind: 'endeavour', x: 152, y: CWL, scale: .54, heel: -1.5, roll: 5, sails: 'full', wake: true, lights: true, seed: 2 };
const skel = { horizon: HZ, eye: 4, light: 'the low moon behind the Pearl (left): she is a silhouette on its glow', items: [
  ['pearl', 10, PWL, 76, 46, 'water (far)'], ['chaser', 101, CWL, 90, 60, 'water (near)'],
  ['splash', 79, 103, 8, 15, 'water (the Pearl\'s wake)'], ['splash2', 89, 105, 6, 8, 'water'], ['smoke', 100, 111, 24, 13, 'air, from the chaser\'s bow']] };

// spume blown off the crests: short pale streaks with a tail torn off to the left (with the wind)
function spume(u, n, seed, skip) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const y = HZ + 4 + Math.pow(R(), 1.4) * 150, k = (y - HZ) / 150, x = R() * 210 - 5, w = 2 + k * 16;
    if (skip(x, y)) continue;
    out += `<path d="M${f(x)} ${f(y)}q${f(-w * .4)} ${f(-1 - k * 2)} ${f(-w)} ${f(-.4)}" stroke="#e8f2ff" stroke-width="${f(.35 + k * 1.1)}" fill="none" opacity="${f(.3 + R() * .35)}" stroke-linecap="round"/>`
      + `<path d="M${f(x - w)} ${f(y - .6)}q${f(-4 - k * 8)} ${f(-.6)} ${f(-8 - k * 14)} ${f(-1.6 - k * 2)}" stroke="#e8f2ff" stroke-width="${f(.25 + k * .5)}" fill="none" opacity="${f(.1 + R() * .14)}" stroke-linecap="round"/>`; }
  return out;
}
// a wake: a band of churned water from the stern back and towards us, foam along it
function wake(u, L, x0, y0, len, spread, k, seed) {
  const id = nid('wk', u), bl = nid('wb', u), c = mix(L.pal.sea[0], '#dfeaff', .35), R = rng(seed);
  let s = `<defs>${linGrad(id, x0, y0, x0 + len, y0 + spread, [[0, c, .5], [1, c, .05]])}<filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${f(1.2 * k)}"/></filter></defs>`
    + `<path d="M${f(x0)} ${f(y0 + .3)}Q${f(x0 + len * .5)} ${f(y0 + spread * .15)} ${f(x0 + len)} ${f(y0 + spread * .3)}L${f(x0 + len)} ${f(y0 + spread)}Q${f(x0 + len * .5)} ${f(y0 + spread * .45)} ${f(x0)} ${f(y0 + 2 * k)}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
  for (let t = .04; t < 1; t += .08 + R() * .1) s += K.foam(u, { x: x0 + t * len, y: y0 + .6 * k + t * spread * .22 + (R() - .5) * k, w: (3 + t * 8) * k, h: (.4 + t * .6) * k, seed: seed + Math.round(t * 90), L })
    + K.foam(u, { x: x0 + t * len, y: y0 + 1.5 * k + t * spread * .8 + (R() - .5) * k, w: (2.5 + t * 8) * k, h: (.4 + t * .7) * k, seed: seed + 100 + Math.round(t * 90), L });
  return s;
}

module.exports = { name: 'Уйти по ветру', variant: 'b', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 60, seed: 8 }) + K.sunMoon(u, L, { r: 8.5 });
    // low clouds racing with the wind, lit by the moon from behind; a clear hole round the moon
    for (const [x, y, w, h, sd, fr] of [[150, 22, 64, 8, 31, .1], [30, 30, 50, 7, 12, .2], [118, 52, 46, 6, 17, .35], [182, 80, 40, 5, 5, .55], [96, 88, 52, 4, 9, .7], [12, 90, 36, 4, 23, .75]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .8, seed: 9, glitter: MOON.x });
    // the Pearl far ahead: her wake runs back to the right, the shot falls into it short of her
    bg += wake(u, L, 79, PWL + .2, 30, 7, .5, 40);
    bg += K.ship(u, L, PEARL);
    bg += K.splash(u, { x: 83, y: PWL + 3.5, w: 7, h: 14, seed: 3, L, wind: -.3 }) + K.splash(u, { x: 92, y: PWL + 5.5, w: 5, h: 7, seed: 4, L, wind: -.3 });
    // spray at her bow, thrown up and blown ahead
    bg += K.splash(u, { x: 30, y: PWL + .2, w: 7, h: 6, seed: 2, L, wind: -1 });
    bg += spume(u, 50, 21, (x, y) => (x > 8 && x < 86 && y < PWL + 3) || (x > 100 && x < 196 && y < CWL + 6));
    // the chaser's own wake, spreading astern to the right and towards us
    bg += wake(u, L, 180, CWL + .4, 28, 20, 1, 60);
    // the chaser: near, big, every sail drawing — and still falling behind
    bg += K.ship(u, L, CHASE);
    // the moon is behind her (far ahead, over the Pearl): the side and the sails we see are in her own shade, the canvas
    // only glows through — a veil of night over the whole ship keeps her below the Pearl in brightness
    bg += `<g opacity=".34">${K.shipSilhouette('endeavour', Object.assign({}, CHASE, { u: u + 'cs', color: '#0a1222' }))}</g>`;
    // her bow chaser fires ahead: the flash only at the muzzle, the smoke blown ahead to the left with the wind
    { const bx = 122.4, by = 110.7;
      bg += K.shadeCyl(u, 127.1, 110.5, bx + .2, by, .8, L, 'iron', { outline: .3 });
      bg += K.smoke(u, L, { x: bx - 4, y: by, w: 22, h: 12, wind: -1, seed: 6, opacity: .6, glow: { color: '#ffb050', power: .45 } })
        + K.muzzleFlash(u, { x: bx, y: by, dir: 186, len: 9, seed: 1 }) + K.localGlow(u, { x: bx - 2, y: by, color: '#ffc070', power: .6, radius: 12 })
        + K.localGlow(u, { x: bx - 2, y: CWL + 2, color: '#ffc070', power: .35, radius: 14 }, { squash: .3, core: false }); }
    let fg = '';
    // whitecaps near us (under the glass), spray torn off to the left
    for (const [x, y, w] of [[34, 150, 18], [120, 170, 22], [60, 200, 20], [170, 214, 22]]) fg += K.foam(u, { x, y, w, h: .9 + w * .025, seed: Math.round(x + y), L }) + K.foam(u, { x: x - w * .5, y: y - 1.2, w: w * .4, h: .7, seed: Math.round(x * 3 + y), L });
    // the moon's air round the Pearl: a soft halo on the sea under her
    fg += K.localGlow(u, { x: MOON.x, y: PWL + 6, color: '#9ab8e0', power: .2, radius: 40 }, { squash: .3, core: false });
    { const g = nid('ng', u); fg += `<defs>${linGrad(g, 0, 140, 0, 280, [[0, '#04070e', 0], [1, '#04070e', .5]])}</defs><rect x="0" y="140" width="200" height="142" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
