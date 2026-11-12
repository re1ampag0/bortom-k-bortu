// «Уйти по ветру» (Жемчужина, РЕАКЦИЯ, Залп по «Жемчужине» −3 урона), refined from the first-round scene
// (portrait.cjs SCENES['Уйти по ветру']): the black ship runs before a strong wind to the left and leaves the
// chaser behind. Brief (card-briefs.md): sails full, foam along the side, the enemy's shot falls into the water
// astern — columns of splashes where she has just been. Night, the moon ahead of us on the right: the sails glow
// through against it. The wind is seen by what it does: every sail full, the pennant and the flags streaming ahead
// of her, spume torn off the crests, low clouds racing, the bow lifted over a big bow wave, a long wake.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;

const HZ = 110, WL = 124;   // horizon; the Pearl's waterline
const light = { time: 'night', haze: .35, key: { type: 'moon', x: 122, y: 54, el: 20, color: '#c8d8f6', power: .8 }, fill: { color: '#3d5680', power: .4 },
  rim: { az: 14, color: '#bfe0ff', power: .6 }, locals: [{ x: 183, y: 109, color: '#ffc070', power: .6, radius: 18 }] };
const SHIP = { kind: 'pearl', x: 98, y: WL, scale: .9, heel: -3, sails: 'full', wake: true, lights: true, seed: 4 };   // roll (heel towards us) — when kit/ship.cjs has it
const skel = { horizon: HZ, eye: 4, items: [['pearl', 30, WL, 124, 94, 'water'], ['chaser', 176, 111, 24, 18, 'water'],
  ['splash', 164, 127, 13, 24, 'water (astern)'], ['splash2', 182, 131, 9, 11, 'water'], ['splash3', 168, 138, 8, 9, 'water']] };

// the long pennant from the main truck, streaming ahead of her (to the bow, the way the wind blows)
function pennant(u, L, x, y, len) {
  const R = rng(9), id = nid('pn', u), n = 6, pts = [], bot = [];
  for (let i = 0; i <= n; i++) { const t = i / n, w = 2.6 * (1 - t * .85), wave = Math.sin(t * 8 + .6) * 2.6 * t; pts.push([x - len * t, y + wave - t * 1.5]); bot.push([x - len * t + .6, y + wave - t * 1.5 + w]); }
  const p = a => a.map(q => f(q[0]) + ' ' + f(q[1]));
  const top = p(pts), bt = p(bot).reverse();
  let d = `M${top[0]}`; for (let i = 1; i < top.length; i++) { const m = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2]; d += `Q${p([pts[i - 1]])[0]} ${f(m[0])} ${f(m[1])}`; }
  d += `L${top[top.length - 1]}L${bt[0]}`; for (let i = 1; i < bt.length; i++) d += `L${bt[i]}`; d += 'Z';
  return `<defs>${linGrad(id, x, y, x - len, y, [[0, '#1d1d22', 1], [1, '#2a2a34', 1]])}</defs><path d="${d}" fill="url(#${id})" stroke="#bfd4f0" stroke-width=".25" stroke-opacity=".5"/>`
    + `<path d="M${top.join('L')}" stroke="#8e2420" stroke-width=".7" fill="none" opacity=".9"/>`;
}
// spume blown off the crests ahead of her: short pale streaks with a tail torn off to the left
function spume(u, L, n, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const y = HZ + 6 + Math.pow(R(), 1.4) * 150, k = (y - HZ) / 150, x = R() * 210 - 5, w = 3 + k * 16;
    if (x > 28 && x < 160 && y < WL + 8) continue;
    out += `<path d="M${f(x)} ${f(y)}q${f(-w * .4)} ${f(-1 - k * 2)} ${f(-w)} ${f(-.4)}" stroke="#e8f2ff" stroke-width="${f(.4 + k * 1.1)}" fill="none" opacity="${f(.35 + R() * .35)}" stroke-linecap="round"/>`
      + `<path d="M${f(x - w)} ${f(y - .6)}q${f(-4 - k * 8)} ${f(-.6)} ${f(-8 - k * 14)} ${f(-1.6 - k * 2)}" stroke="#e8f2ff" stroke-width="${f(.25 + k * .5)}" fill="none" opacity="${f(.12 + R() * .14)}" stroke-linecap="round"/>`; }
  return out;
}

module.exports = { name: 'Уйти по ветру', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 60, seed: 5 }) + K.sunMoon(u, L, { r: 6.8 });
    // low clouds racing with the wind: long, flat, torn, lit by the moon from behind (bright edges to the moon)
    for (const [x, y, w, h, sd, fr] of [[44, 26, 70, 9, 31, 0], [176, 20, 46, 7, 12, .15], [98, 60, 64, 8, 17, .25], [20, 84, 52, 6, 5, .5], [170, 76, 50, 6, 23, .45], [70, 100, 60, 5, 9, .75]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .8, seed: 7, glitter: 122 });
    // the chaser far astern on the right: her bow guns flash, the smoke goes ahead with the wind
    bg += `<g data-far="">${K.ship(u, L, { kind: 'endeavour', x: 194, y: HZ + 1.2, scale: .2, detail: 'far', lights: true, seed: 2 })}</g>`;
    bg += K.smoke(u, L, { x: 183, y: HZ - 1.5, w: 18, h: 14, wind: -.9, seed: 4, opacity: .6, glow: { color: '#ffb050', power: .5 } })
      + K.muzzleFlash(u, { x: 183, y: HZ - 1, dir: 182, len: 6, seed: 2 }) + K.localGlow(u, { x: 183, y: HZ - .5, color: '#ffc070', power: .55, radius: 9 });
    // the wake she leaves astern, the shot falling into it: the columns stand where she has just been
    bg += K.foam(u, { x: 172, y: WL + 3, w: 40, h: 1.6, seed: 12, L }) + K.foam(u, { x: 190, y: WL + 7, w: 30, h: 1.4, seed: 14, L });
    // her wake: two arms of churned water spreading astern to the right and towards us, foam along them
    { const id = nid('wk', u), bl = nid('wb', u), c = mix(L.pal.sea[0], '#dfeaff', .35);
      bg += `<defs>${linGrad(id, 150, 125, 205, 140, [[0, c, .55], [1, c, .08]])}<filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>`
        + `<path d="M148 ${WL + .5}Q178 ${WL + 1} 206 ${WL + 3}L206 ${WL + 22}Q176 ${WL + 9} 148 ${WL + 2.5}Z" fill="url(#${id})" filter="url(#${bl})"/>`;
      const R = rng(41); for (let t = .05; t < 1; t += .08 + R() * .1) { bg += K.foam(u, { x: 150 + t * 56, y: WL + 1 + t * 2.4 + (R() - .5), w: 4 + t * 8, h: .5 + t * .7, seed: 50 + Math.round(t * 90), L }) + K.foam(u, { x: 150 + t * 56, y: WL + 3 + t * 18 + (R() - .5) * 2, w: 3 + t * 9, h: .5 + t * .9, seed: 70 + Math.round(t * 90), L }); } }
    bg += spume(u, L, 46, 21);
    // whitecaps on the near crests, their spray torn off to the left by the wind (under the glass, calm and dark)
    for (const [x, y, w] of [[30, 166, 18], [118, 180, 22], [176, 192, 20]]) bg += K.foam(u, { x, y, w, h: .9 + w * .025, seed: Math.round(x + y), L }) + K.foam(u, { x: x - w * .5, y: y - 1.2, w: w * .4, h: .7, seed: Math.round(x * 3 + y), L });
    // the body of a big near swell under the glass: its back catches the moon, foam breaks along the crest and is
    // torn off to the left by the wind; the trough in front of it is dark
    { const g = nid('sw', u), g2 = nid('sw', u), bl = nid('swb', u), R = rng(61), crest = x => 214 - 9 * Math.sin((x + 30) / 70) - 3 * Math.sin(x / 23);
      const top = Array.from({ length: 23 }, (_, i) => { const x = -10 + i * 10; return [x, crest(x)]; });
      const d = 'M' + top.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'L210 292L-10 292Z';
      const lit = mix(L.pal.sea[0], L.keyColor, .5), dark = mix(L.pal.sea[2], '#050a14', .35);
      bg += `<defs>${linGrad(g, 0, 196, 0, 262, [[0, lit, 1], [.12, mix(lit, L.pal.sea[1], .5), .95], [.4, L.pal.sea[2], .95], [1, dark, 1]])}${linGrad(g2, 0, 150, 0, 214, [[0, L.pal.sea[1], 0], [1, dark, .6]])}<filter id="${bl}" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`
        + `<path d="M-10 170L210 170L210 ${f(crest(210))}${top.slice().reverse().map(p => 'L' + f(p[0]) + ' ' + f(p[1])).join('')}Z" fill="url(#${g2})" filter="url(#${bl})"/>`
        + `<path d="${d}" fill="url(#${g})"/>` + `<path d="M${top.map(p => f(p[0]) + ' ' + f(p[1] + .4)).join('L')}" stroke="${mix(lit, '#ffffff', .4)}" stroke-width=".7" fill="none" opacity=".6"/>`;
      for (let x = -4; x < 206; x += 12 + R() * 16) bg += K.foam(u, { x, y: crest(x) + .6, w: 8 + R() * 14, h: 1.2 + R() * .8, seed: 80 + Math.round(x), L });
      for (let i = 0; i < 40; i++) { const x = R() * 200, y = crest(x) - 1 - R() * 7; bg += `<circle cx="${f(x - R() * 6)}" cy="${f(y)}" r="${f(.25 + R() * .55)}" fill="#e8f2ff" opacity="${f(.3 + R() * .45)}"/>`; }
      // a nearer crest at the bottom: a lit back, foam along it, spray torn off to the left
      { const c2 = x => 258 - 6 * Math.sin((x + 90) / 60) - 2.4 * Math.sin(x / 17), g3 = nid('sw', u), pts = Array.from({ length: 23 }, (_, i) => [-10 + i * 10, c2(-10 + i * 10)]);
        bg += `<defs>${linGrad(g3, 0, 246, 0, 292, [[0, lit, .85], [.2, L.pal.sea[2], .9], [1, dark, 1]])}</defs><path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}L210 292L-10 292Z" fill="url(#${g3})"/>`
          + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1] + .4)).join('L')}" stroke="${mix(lit, '#ffffff', .4)}" stroke-width=".8" fill="none" opacity=".55"/>`;
        for (let x = -6; x < 206; x += 10 + R() * 14) bg += K.foam(u, { x, y: c2(x) + .7, w: 10 + R() * 16, h: 1.5 + R() * 1, seed: 300 + Math.round(x), L });
        for (let i = 0; i < 46; i++) { const x = R() * 200, y = c2(x) - 1 - R() * 9; bg += `<circle cx="${f(x - R() * 8)}" cy="${f(y)}" r="${f(.3 + R() * .7)}" fill="#e8f2ff" opacity="${f(.3 + R() * .45)}"/>`; } }
      // the wake running back from her towards us on the right, over the swell
      for (let t = 0; t < 1; t += .06 + R() * .05) bg += K.foam(u, { x: 156 + t * 50 + (R() - .5) * 4, y: WL + 6 + t * 74, w: 4 + t * 12, h: .6 + t * .9, seed: 120 + Math.round(t * 100), L });
      for (let t = 0; t < 1; t += .07 + R() * .06) bg += K.foam(u, { x: 150 + t * 20 + (R() - .5) * 3, y: WL + 8 + t * 80, w: 3 + t * 10, h: .5 + t * .8, seed: 160 + Math.round(t * 100), L }); }
    bg += K.ship(u, L, SHIP) + pennant(u, L, 100.4, 30.4, 52);
    let fg = '';
    fg += K.splash(u, { x: 170, y: WL + 3, w: 11, h: 24, seed: 3, L, wind: -.3 }) + K.splash(u, { x: 186, y: WL + 7, w: 8, h: 11, seed: 4, L, wind: -.3 })
      + K.splash(u, { x: 172, y: WL + 14, w: 7, h: 9, seed: 5, L, wind: -.3 });
    // spray thrown up and blown ahead at the bow, the bow wave
    fg += K.splash(u, { x: 46, y: WL, w: 16, h: 15, seed: 2, L, wind: -1 });
    { const R = rng(17); for (let i = 0; i < 34; i++) { const x = 22 + R() * 30, y = WL - 18 + R() * 18; fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.25 + R() * .6)}" fill="#eaf4ff" opacity="${f(.35 + R() * .5)}"/>`; } }
    fg += K.localGlow(u, { x: 140, y: 150, color: '#9ab8e0', power: .18, radius: 70 }, { squash: .3, core: false });
    return [bg, fg];
  } };
