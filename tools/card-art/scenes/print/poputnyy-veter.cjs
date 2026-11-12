// «Попутный ветер» (Колода моря): a merchantman runs away from us to the right under all sail, the pennant streams
// ahead, the wake spreads out astern; a second ship ahead on the left — the wind carries both. Fresh morning,
// clouds running in slanted rows. Brief: docs/tasks/print-kit-cards.md «Попутный ветер».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;
// Morning sun behind the viewer's left shoulder (brief: «утреннее солнце за левым плечом зрителя»; kit az — where
// the light comes FROM: 180 from behind, 270 from the left → 225). Sails and stern lit full on, shadows in the folds
// and to the right; shadows on the water run right into the depth.
const light = { time: 'day', key: { type: 'sun', az: 225, el: 35, color: '#fff1c8', power: 1 }, fill: { color: '#8fc0e8', power: .5 }, haze: .15 };
const HZ = 120, WL = 127, WF = 123;   // horizon; waterlines of the near and the far ship (the glass of a sea card starts at y 129)
const skel = { horizon: HZ, eye: 3, items: [
  ['ship', 48, WL, 132, 94, 'water'], ['far', 18, WF, 34, 33, 'water'], ['crest', 0, 236, 90, 30, 'water'], ['wake', 0, 200, 60, 70, 'water']] };

// ——— KIT-CANDIDATE: a whitecap on a near crest of the kit's sea: the lit back of the crest and the dark trough in
// front of it as soft blurred lenses (no hard body over the sea), foam breaking along the top, lace sliding down the
// face and torn off downwind
function whitecap(u, L, o) {
  const R = rng(o.seed || 5), x = o.x, y = o.y, w = o.w, h = o.h, wind = o.wind || 1, P = L.pal, bl = nid('wcb', u), g1 = nid('wc1', u), g2 = nid('wc2', u);
  const back = mix(P.sea[1], mix(P.sea[0], L.keyColor, .3), .45), trough = mix(P.sea[2], L.shadowTint, .4);
  const lens = (cx, cy, rw, up, dn, sk) => `M${f(cx - rw)} ${f(cy)}C${f(cx - rw * .4)} ${f(cy - up)} ${f(cx + rw * (.2 + sk))} ${f(cy - up * 1.1)} ${f(cx + rw)} ${f(cy)}C${f(cx + rw * .3)} ${f(cy + dn)} ${f(cx - rw * .5)} ${f(cy + dn * .9)} ${f(cx - rw)} ${f(cy)}Z`;
  let out = `<defs><filter id="${bl}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="${f(h * .22)}"/></filter>${linGrad(g1, 0, y - h, 0, y + h * .2, [[0, back, 1], [.6, back, .55], [1, back, 0]])}${linGrad(g2, 0, y, 0, y + h * 1.2, [[0, trough, .95], [.5, trough, .6], [1, trough, 0]])}</defs>`;
  out += `<g filter="url(#${bl})"><path d="${lens(x, y + h * .15, w * .62, h, h * .25, .15)}" fill="url(#${g1})"/><path d="${lens(x + wind * w * .1, y + h * .45, w * .7, h * .2, h * 1.1, -.1)}" fill="url(#${g2})"/></g>`;
  out += K.foam(u, { x: x + wind * w * .08, y: y - h * .42, w: w * .5, h: h * .2, seed: (o.seed || 5) + 3, L });
  for (let i = 0; i < 4; i++) { const t = .2 + i * .2 + R() * .1; out += K.foam(u, { x: x + wind * w * (.05 + t * .35) + (R() - .5) * w * .1, y: y - h * .2 + t * h * .7, w: w * (.22 - t * .12) * (.7 + R() * .6), h: h * .08, seed: (o.seed || 5) + 11 + i * 7, L }); }
  return out;
}
// the spreading arm of the wake astern (a Kelvin arm): a pale band of churned water widening towards the viewer,
// with short broken crests of foam of their own length at uneven steps along its outer edge
function wakeArm(u, L, a, b, seed) {
  const R = rng(seed), id = nid('wa', u), bl = nid('wb', u), c = mix(L.pal.sea[0], '#ffffff', .35);
  const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny), wA = t => 1 + t * 9;
  const P = (t, k) => [lerp(a[0], b[0], t) + nx / nl * wA(t) * k, lerp(a[1], b[1], t) + ny / nl * wA(t) * k];
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(P(i / 10, 1)); for (let i = 10; i >= 0; i--) pts.push(P(i / 10, -1));
  let out = `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, c, .3], [.4, c, .12], [1, c, 0]])}<filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
  for (let t = .1 + R() * .06; t < .95; t += .07 + R() * .2) { const p = P(t, -.9 + R() * 1.1), w = (3 + t * 14) * (.5 + R() * .9); out += K.foam(u, { x: p[0], y: p[1], w, h: (.4 + t * 1.2) * (.7 + R() * .5), seed: seed + Math.round(t * 100), L }); }
  return out;
}

module.exports = { name: 'Попутный ветер', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    // the sea series' water (print-kit-cards: one blue-turquoise row)
    L.pal = Object.assign({}, L.pal, { sea: ['#7fb0c8', '#3d6f88', '#16323f'] });
    let bg = K.sky(u, L, { horizon: HZ });
    // clouds in slanted rows, running with the wind to the right: a big one high, smaller ones lower and further
    // two rows slanting down to the right, each a chain of long flat clouds, smaller and paler towards the horizon
    for (const [x, y, w, h, sd, fr] of [[94, 22, 44, 12, 11, 0], [128, 31, 40, 10, 4, .1], [160, 42, 34, 8, 6, .25],
      [84, 58, 34, 8, 7, .35], [112, 66, 38, 8, 9, .45], [146, 76, 34, 7, 15, .55], [184, 88, 30, 6, 18, .7], [36, 100, 40, 6, 21, .85], [78, 108, 34, 5, 23, .9]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: .55, seed: 5, glitter: false });
    // the shadow of a cloud on the water, under the glass (multiply, cool)
    { const id = nid('cs', u); bg += `<defs>${radGrad(id, 0, 0, 1, [[0, L.shadowMul, .32], [.55, L.shadowMul, .16], [1, L.shadowMul, 0]])}</defs><ellipse cx="0" cy="0" rx="1" ry="1" transform="translate(132 182) scale(84 15) rotate(0)" fill="url(#${id})" style="mix-blend-mode:multiply"/>`; }
    bg += `<g data-far="">${K.ship(u, L, { kind: 'brig', x: 24, y: WF, scale: .44, flip: true, detail: 'far', wake: true, seed: 3 })}</g>`;
    bg += K.ship(u, L, { kind: 'merchant', x: 110, y: WL, scale: 1.3, flip: true, wake: true, seed: 9 });
    // the arm of the wake spreading from the stern towards the viewer, under the glass
    bg += wakeArm(u, L, [52, 129], [-6, 182], 30);
    bg += whitecap(u, L, { x: 42, y: 232, w: 70, h: 12, seed: 6, wind: 1 });
    return [bg, ''];
  } };
