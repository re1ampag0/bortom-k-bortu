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

// ——— KIT-CANDIDATE: a near swell with a breaking top: a long back rising from the left, the crest, a steeper face
// downwind in its own shade; the body melts into the sea below (no edge); foam on the crest, spindrift blown off
function swellCrest(u, L, o) {
  const R = rng(o.seed || 5), x0 = o.x0, x1 = o.x1, y = o.y, h = o.h, px = o.px, wind = o.wind || 1, P = L.pal;
  // the top line: a slow rise to the crest at px, a quick fall on the face, then back to the level of the sea
  const H = X => X < px ? h * Math.pow(Math.sin(Math.PI / 2 * clamp((X - x0) / (px - x0))), 1.8) : h * Math.pow(Math.cos(Math.PI / 2 * clamp((X - px) / (x1 - px))), .9);
  const top = []; for (let X = x0; X <= x1 + .1; X += (x1 - x0) / 28) top.push([X, y - H(X) + Math.sin(X * .21 + 1) * .5]);
  top.push([x1 + 40, y + 1], [x1 + 80, y + 2]);   // the face runs out into the sea beyond the edge of the picture
  const sp = top.map(p => f(p[0]) + ' ' + f(p[1])), crest = y - h;
  const g = nid('sw', u), m = nid('sm', u), mk = nid('sk', u), face = nid('sf', u);
  const back = mix(P.sea[1], L.keyColor, .12), dark = mix(P.sea[2], L.shadowTint, .3);
  let out = `<defs>${linGrad(g, 0, crest, 0, y + 6, [[0, mix(back, P.sea[0], .45)], [.25, back], [.7, P.sea[2]], [1, P.sea[2]]])}`
    + `${linGrad(face, px, 0, x1, 0, [[0, dark, .0], [.12, dark, .55], [.6, dark, .25], [1, dark, 0]])}`
    + `${linGrad(m, 0, crest, 0, y + 8, [[0, '#fff', 1], [.7, '#fff', 1], [1, '#fff', 0]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="${f(x0 - 5)}" y="${f(crest - 5)}" width="${f(x1 - x0 + 90)}" height="${f(h + 20)}"><rect x="${f(x0 - 5)}" y="${f(crest - 5)}" width="${f(x1 - x0 + 90)}" height="${f(h + 20)}" fill="url(#${m})"/></mask></defs>`;
  const body = `M${f(x0)} ${f(y + 10)}L${sp.join('L')}L${f(x1 + 80)} ${f(y + 10)}Z`;
  out += `<g mask="url(#${mk})"><path d="${body}" fill="url(#${g})"/><path d="${body}" fill="url(#${face})"/>`;
  // streaks on the back of the swell, following its slope, lighter on the side of the sun
  for (let i = 0; i < 8; i++) { const X = lerp(x0 + 6, px - 4, R()), l = 5 + R() * 9, yy = y - H(X) + 2 + R() * Math.min(10, H(X) * .7); out += `<path d="M${f(X - l / 2)} ${f(yy + (H(X - l / 2) - H(X)) * .9)}Q${f(X)} ${f(yy - 1)} ${f(X + l / 2)} ${f(yy - (H(X + l / 2) - H(X)) * .9)}" stroke="${mix(P.sea[0], '#ffffff', .25)}" stroke-width="${f(.35 + R() * .35)}" fill="none" opacity="${f(.2 + R() * .25)}"/>`; }
  out += '</g>';
  // the crest breaks: foam along the top, thick at the crest, thinning back; spindrift blown off downwind
  out += K.foam(u, { x: px - 4, y: crest + 1.6, w: 22, h: 2.4, seed: (o.seed || 5) + 3, L }) + K.foam(u, { x: px - 22, y: y - H(px - 22) + 1.6, w: 14, h: 1.2, seed: (o.seed || 5) + 8, L });
  return out;
}
// the spreading arm of the wake astern (a Kelvin arm): a pale band of churned water widening towards the viewer,
// with short broken crests of foam of their own length at uneven steps along its outer edge
function wakeArm(u, L, a, b, seed) {
  const R = rng(seed), id = nid('wa', u), bl = nid('wb', u), c = mix(L.pal.sea[0], '#ffffff', .35);
  const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny), wA = t => 1 + t * 9;
  const P = (t, k) => [lerp(a[0], b[0], t) + nx / nl * wA(t) * k, lerp(a[1], b[1], t) + ny / nl * wA(t) * k];
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(P(i / 10, 1)); for (let i = 10; i >= 0; i--) pts.push(P(i / 10, -1));
  let out = `<defs>${linGrad(id, a[0], a[1], b[0], b[1], [[0, c, .45], [.5, c, .22], [1, c, 0]])}<filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
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
    bg += swellCrest(u, L, { x0: -14, x1: 120, px: 64, y: 244, h: 22, seed: 6, wind: 1 });
    return [bg, ''];
  } };
