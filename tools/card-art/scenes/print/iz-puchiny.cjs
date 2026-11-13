// «Из пучины» (Голландец, ЗАРЯД: Залп из-под воды: +1 урон, без штрафа за диагональ, противник не может отвечать
// Реакциями), method A: the first-round scene (portrait-dutch.cjs SCENES['Из пучины']) at its best. The concept stays:
// the Dutchman, still under the sea, fires up at the enemy above; the shot runs up in trails of bubbles. Now it is a
// split view at the surface (brief, card-briefs.md «Из пучины»): above the wavy waterline the green fog, the far
// enemy on the sea and only the tops of the ghost ship's masts, foaming where they break the surface; below it her
// whole drowned hull in the green murk, rising bow first; her ports flash green under water (each gun in its own
// phase), cones of bubbles burst from them and the balls tear out of the sea in white columns, flying at the enemy.
// Fixed against the first round: the old ship was a pasted picture turned 35° with no water on it — now the kit's
// Dutchman, tinted by the water in depth, light shafts and caustics on her; the enemy was a black lozenge in the
// sky — now a real ship on a real surface; the shot came out nowhere — now each trail ends in a column of water
// with the ball at its head; one flash is a bright fresh burst, one is just lit, one gun is only a cloud of bubbles.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const SY = 60, HZ = 55;                              // the waterline at the lens; the horizon of the far sea above it
const DU = { kind: 'dutch', x: 88, y: 122, scale: 1.07, flip: true, heel: -9 };   // the drowned Dutchman, bow right, rising
const ENEMY = { kind: 'endeavour', x: 133, y: HZ + 2.6, scale: .3 };
const light = { time: 'fog', haze: .8, key: { type: 'moon', x: 58, y: 22, el: 32, color: '#d4f2e4', power: .7 }, fill: { color: '#2f5a50', power: .5 },
  rim: { az: 300, color: '#d8fff0', power: .35 }, locals: [{ x: 122, y: 112, color: '#9effd0', power: .6, radius: 40 }] };
const skel = { horizon: HZ, eye: 0, light: 'the moon low in the fog upper left; under water the light comes down in shafts; green gun flashes in the ports', items: [
  ['waterline (split)', 0, SY - 3, 200, 6, 'the sea at the lens'], ['enemy', 117, 36, 40, 22, 'far sea, clear of the cost badge'],
  ['mast tops', 60, 44, 56, 18, 'out of the water, foaming'], ['Dutchman hull', 32, 92, 144, 36, 'under water, rising'],
  ['flashes + bubble columns', 80, 74, 50, 40, 'her ports up to the surface'], ['columns + balls', 74, 30, 52, 30, 'the surface, in the air'],
  ['deep', 0, 140, 200, 140, 'under the glass']] };

// a point of the ship in her own frame (X along the hull, + to the stern; H up from the waterline) → the picture
function pt(o, X, Hh) {
  const dir = o.flip ? -1 : 1, s = o.scale, th = -dir * (o.heel || 0) * Math.PI / 180, dx = dir * s * X, dy = -s * Hh;
  return [o.x + dx * Math.cos(th) - dy * Math.sin(th), o.y + dx * Math.sin(th) + dy * Math.cos(th)];
}
// a bubble: a thin bright ring with a fleck of light on the up-left side
const bubble = (x, y, r, op) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#bff8e6" fill-opacity="${f(op * .12)}" stroke="#e4fff6" stroke-width="${f(Math.max(.18, r * .22))}" opacity="${f(op)}"/>`
  + (r > .7 ? `<circle cx="${f(x - r * .35)}" cy="${f(y - r * .38)}" r="${f(r * .22)}" fill="#ffffff" opacity="${f(op * .9)}"/>` : '');
// KIT-CANDIDATE bubbleTrail: bubbles along a curve from p0 (the source) to p1, small and dense at the source, larger and
// sparser as they rise, wobbling; returns svg
function bubbleTrail(p0, c, p1, n, seed, k = 1) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const t = Math.pow(R(), .8), a = 1 - t, x = a * a * p0[0] + 2 * a * t * c[0] + t * t * p1[0], y = a * a * p0[1] + 2 * a * t * c[1] + t * t * p1[1];
    const r = (.35 + t * 1.5 + R() * .6) * k; out += bubble(x + (R() - .5) * (2 + t * 6), y + (R() - .5) * 3, r, .45 + R() * .45 - t * .15); }
  return out;
}
// a green ghost flash under water at a port: the glow, a burst of light along `dir`, a churned ball of bubbles;
// phase 0 — fresh and bright, 1 — just lit, 2 — spent (only bubbles and a faint glow)
function wetFlash(u, x, y, dir, len, phase, seed) {
  const R = rng(seed), a = dir * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const pw = [1, .85, .25][phase];
  let out = K.localGlow(u, { x: x + ux * len * .3, y: y + uy * len * .3, color: '#8effc8', power: .9 * pw, radius: len * 1.6 }, { core: false });
  if (phase < 2) {
    // the burst: a few jagged tongues of pale green light along dir, the longest in the middle
    const id = nid('wf', u), fb = nid('wb', u), L2 = len * (phase ? .6 : 1);
    let tongues = '';
    for (let i = 0; i < 7; i++) { const sp = (R() - .5) * .9 * (i ? 1 : .2), l = L2 * (i ? .35 + R() * .5 : 1), w = len * (.1 + R() * .06);
      const ex = x + (ux + nx * sp) * l, ey = y + (uy + ny * sp) * l, mx = x + (ux + nx * sp * .5) * l * .45, my = y + (uy + ny * sp * .5) * l * .45;
      tongues += `<path d="M${f(x + nx * w)} ${f(y + ny * w)}Q${f(mx + nx * w * 1.6)} ${f(my + ny * w * 1.6)} ${f(ex)} ${f(ey)}Q${f(mx - nx * w * 1.6)} ${f(my - ny * w * 1.6)} ${f(x - nx * w)} ${f(y - ny * w)}Z"/>`; }
    out += `<defs>${radGrad(id, x, y, L2, [[0, '#ffffff', 1], [.3, '#effff8', 1], [.65, '#a8ffd8', .85], [1, '#5ae8b0', .15]])}<filter id="${fb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(len * .03)}"/></filter></defs>`
      + `<g fill="url(#${id})" filter="url(#${fb})" style="mix-blend-mode:screen">${tongues}</g>`
      + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(len * .09)}" ry="${f(len * .07)}" fill="#ffffff" opacity="${f(.9 * pw)}"/>`;
  }
  // the churned bubbles round the muzzle, pushed out along dir
  for (let i = 0; i < [26, 18, 30][phase]; i++) { const t = R(), sp = (R() - .5) * (1 + t), d = len * (phase === 2 ? .2 + t * .9 : .5 + t * .9);
    out += bubble(x + (ux + nx * sp * .7) * d, y + (uy + ny * sp * .7) * d - (phase === 2 ? t * 6 : 0), .3 + R() * (phase === 2 ? 1.6 : 1.1), .5 + R() * .4); }
  return out;
}
// KIT-CANDIDATE waterColumn: a column of water torn up by the ball breaking the surface at (x, y): a rising sheet
// of white water, ragged, falling back in drops; the ball at its head (or above it)
function waterColumn(u, L, x, y, h, w, seed, ballY) {
  const R = rng(seed), id = nid('wc', u), fb = nid('wcb', u);
  const lean = 3 + R() * 3, top = y - h;
  let body = `<defs>${linGrad(id, 0, top, 0, y, [[0, '#f4fff8', .2], [.25, '#ecfff6', .75], [.8, '#cfeee2', .85], [1, '#9ccab8', .9]])}`
    + `<filter id="${fb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".35"/></filter></defs>`;
  // the body: a tapering sheet, its sides ragged
  const nL = [], nR = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8, yy = lerp(y, top, t), ww = w * (1 - t * .7) * (1 + (R() - .5) * .25), cx = x + lean * t * t;
    nL.push([cx - ww / 2, yy]); nR.unshift([cx + ww / 2, yy]); }
  body += `<path d="M${nL.concat(nR).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${id})" filter="url(#${fb})"/>`;
  // streams and drops falling back off the edges
  for (let i = 0; i < 18; i++) { const t = .2 + R() * .8, side = R() < .5 ? -1 : 1, yy = lerp(y, top, t), xx = x + lean * t * t + side * w * (1 - t * .7) * .5, l = 3 + R() * 8;
    body += `<path d="M${f(xx)} ${f(yy)}q${f(side * 2)} ${f(l * .3)} ${f(side * (2 + R() * 3))} ${f(l)}" stroke="#eafff6" stroke-width="${f(.3 + R() * .5)}" fill="none" opacity="${f(.5 + R() * .4)}" stroke-linecap="round"/>`; }
  for (let i = 0; i < 22; i++) { const xx = x + (R() - .5) * w * 2.2 + lean, yy = top + R() * h * .9, r = .2 + R() * .55; body += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r)}" ry="${f(r * 1.5)}" fill="#f0fff8" opacity="${f(.45 + R() * .5)}"/>`; }
  body += K.foam(u, { x, y: y + .4, w: w * 2.4, h: 1.5, seed: seed + 5, L });
  if (ballY === false) return body;
  const by = ballY != null ? ballY : top - 2;
  body += K.shot(u, L, { x: x + lean, y: by + 2.6, s: .8, contact: false, seed })
    + `<path d="M${f(x + lean)} ${f(by + 3)}l-.6 6M${f(x + lean - 1.6)} ${f(by + 2.2)}l-1.6 4M${f(x + lean + 1.4)} ${f(by + 2.4)}l1.2 4" stroke="#eafff6" stroke-width=".45" opacity=".8" stroke-linecap="round"/>`;
  return body;
}

module.exports = { name: 'Из пучины', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .4 });
    // ——— above: the green fog over a dark sea, the moon low through it, the far enemy ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 6 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[150, 16, 90, 10, 7, .2], [40, 44, 70, 8, 3, .45], [170, 52, 60, 7, 11, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: SY + 2, swell: .5, seed: 4, glitter: 58 });
    bg += K.ship(u, L, { ...ENEMY, sails: 'full', detail: 'mid', lights: true, wake: true, seed: 8 });
    bg += K.fog(u, L, { y: HZ - 18, h: 24, density: .45, seed: 2 });
    // ——— below: the green murk, bright under the surface, dark in the deep ———
    const uw = nid('uw', u), uc = nid('uc', u);
    bg += `<defs>${linGrad(uw, 0, SY, 0, 280, [[0, '#7cc8b0', 1], [.06, '#3e9a84', 1], [.25, '#1c6052', 1], [.5, '#0c3a32', 1], [1, '#020c0a', 1]])}<clipPath id="${uc}"><rect x="-10" y="${SY}" width="220" height="300"/></clipPath></defs>`
      + `<rect x="-10" y="${SY}" width="220" height="${280 - SY + 10}" fill="url(#${uw})"/>`;
    // the underside of the surface: a bright rippling ceiling right under the line
    { const R = rng(17); let rp = ''; for (let i = 0; i < 26; i++) { const x = -10 + R() * 220, y = SY + 1.5 + Math.pow(R(), 2) * 12, l = 6 + R() * 12;
        rp += `<path d="M${f(x)} ${f(y)}q${f(l / 4)} ${f(-1.2)} ${f(l / 2)} 0t${f(l / 2)} 0" stroke="#e4fff4" stroke-width="${f(.3 + R() * .5)}" fill="none" opacity="${f(.25 + R() * .4)}"/>`; }
      bg += rp; }
    // light shafts slanting down from the moon's side
    { const sh = nid('sh', u), sb = nid('sb', u); let rays = '';
      for (const [x, w, op] of [[18, 10, .5], [44, 16, .6], [86, 8, .45], [120, 14, .5], [164, 9, .4], [190, 12, .35]]) rays += `<path d="M${x} ${SY}h${w}l${f(w * 1.6 + 26)} 150h${f(-w * 2.6)}Z" opacity="${op}"/>`;
      bg += `<defs>${linGrad(sh, 0, SY, 0, SY + 150, [[0, '#d8fff0', .4], [.5, '#a8f0d8', .12], [1, '#a8f0d8', 0]])}<filter id="${sb}" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`
        + `<g fill="url(#${sh})" filter="url(#${sb})" clip-path="url(#${uc})" style="mix-blend-mode:screen">${rays}</g>`; }
    // ——— the Dutchman: the kit ship, her masts' heads above the sea, the rest drowned ———
    let mid = K.ship(u, L, { ...DU, sails: 'full', detail: 'near', lights: true, seed: 4 });
    // her drowned belly under the kit's waterline cut: the foul bottom from stem to stern, weed streaming aft
    { const bl = nid('bl', u), st = pt(DU, -46.5, .6), sn = pt(DU, 44, .6), k1 = pt(DU, -38, -10), k2 = pt(DU, 0, -13), k3 = pt(DU, 34, -10), R = rng(13);
      mid += `<defs>${linGrad(bl, 0, DU.y - 4, 0, DU.y + 16, [[0, '#3a4a3a', 1], [.4, '#26342a', 1], [1, '#0c1612', 1]])}</defs>`
        + `<path d="M${f(st[0])} ${f(st[1])}C${f(k1[0] + 6)} ${f(k1[1] - 4)} ${f(k1[0])} ${f(k1[1])} ${f(k2[0])} ${f(k2[1])}S${f(k3[0] - 4)} ${f(k3[1] + 2)} ${f(sn[0])} ${f(sn[1])}Z" fill="url(#${bl})"/>`;
      for (let i = 0; i < 14; i++) { const X = -40 + R() * 78, p = pt(DU, X, -2 - R() * 8), l = 4 + R() * 7;
        mid += `<path d="M${f(p[0])} ${f(p[1])}q${f(-2 - R() * 2)} ${f(l * .5)} ${f(-1 - R() * 3)} ${f(l)}" stroke="#2e5a40" stroke-width="${f(.5 + R() * .6)}" fill="none" opacity=".8" stroke-linecap="round"/>`; }
      for (let i = 0; i < 26; i++) { const X = -42 + R() * 82, p = pt(DU, X, -.5 - R() * 9); mid += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.4 + R() * .7)}" fill="#7a8070" opacity=".55"/>`; } }
    // the water over her: tint by depth (lighter near the surface), caustics wavering on the hull
    { const wt = nid('wt', u); mid += `<defs>${linGrad(wt, 0, SY, 0, 160, [[0, '#4aa890', .32], [.3, '#1e6a5a', .45], [.65, '#0e3e36', .55], [1, '#041612', .82]])}</defs>`
      + `<rect x="-10" y="${SY}" width="220" height="${280 - SY}" fill="url(#${wt})" clip-path="url(#${uc})"/>`;
      const R = rng(31); let ca = ''; for (let i = 0; i < 40; i++) { const x = 30 + R() * 150, y = SY + 8 + R() * 60, l = 3 + R() * 7;
        ca += `<path d="M${f(x)} ${f(y)}q${f(l / 3)} ${f(-1 - R())} ${f(l * .6)} ${f(R() - .5)}t${f(l * .4)} ${f(.6)}" stroke="#bff8e0" stroke-width="${f(.2 + R() * .35)}" fill="none" opacity="${f(.15 + R() * .25)}"/>`; }
      mid += `<g style="mix-blend-mode:screen" clip-path="url(#${uc})">${ca}</g>`; }
    // the deep under her: she rises out of the dark
    { const dp = nid('dp', u); mid += `<defs>${linGrad(dp, 0, 124, 0, 180, [[0, '#020c0a', 0], [.35, '#020c0a', .7], [1, '#020a08', .95]])}</defs><rect x="-10" y="120" width="220" height="160" fill="url(#${dp})"/>`; }
    // ——— the guns under water: three ports, three phases; cones of bubbles, the balls rising in trails ———
    const ports = [-24.2, -12.7, -1.1].map(X => pt(DU, X, 9.6));
    // each gun: flash → a column of bubbles → a column of water on the surface → the ball. The fresh shot (the
    // forward gun) is just breaking the surface; the one before stands at the head of a tall column; the first has
    // left its falling column behind and flies at the enemy
    const COL = [[119, 9, 8, SY - 11], [80, 24, 7, SY - 28], [96, 9, 11, false]];   // [x, height, width, ball y] per gun
    let fx = '';
    fx += wetFlash(u, ports[0][0], ports[0][1], -66, 33, 0, 3);
    fx += wetFlash(u, ports[1][0], ports[1][1], -98, 21, 1, 7);
    fx += wetFlash(u, ports[2][0], ports[2][1], -84, 17, 1, 11);
    fx += bubbleTrail([ports[0][0] + 2, ports[0][1] - 9], [ports[0][0] + 6, ports[0][1] - 30], [COL[0][0], SY + 2], 46, 41, 1.05);
    fx += bubbleTrail([ports[1][0] - 3, ports[1][1] - 8], [ports[1][0] - 12, ports[1][1] - 26], [COL[1][0], SY + 2], 48, 43, 1.1);
    fx += bubbleTrail([ports[2][0], ports[2][1] - 8], [ports[2][0] + 4, ports[2][1] - 30], [COL[2][0], SY + 2], 46, 47, 1.15);
    // the surface from below where the balls broke out: a boiling white patch
    for (const [x] of COL) fx += K.localGlow(u, { x, y: SY + 2, color: '#e8fff6', power: .55, radius: 12 }, { squash: .4, core: false });
    // fish scattering from the flashes, a few motes in the murk
    { const fish = (x, y, s, d, c) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(d * s)} ${f(s)})"><path d="M-5 0q3 -2.4 7 -.6l3 -2v5.2l-3 -2q-4 1.8 -7 -.6z" fill="${c}"/><circle cx="-3.4" cy="-.4" r=".4" fill="#e8fff4"/></g>`;
      fx += fish(24, 80, 1.1, -1, '#5a8a80') + fish(14, 88, .9, -1, '#4e7e74') + fish(30, 92, .8, -1, '#4e7e74') + fish(180, 92, 1, 1, '#5a8a80') + fish(190, 84, .8, 1, '#4e7e74'); }
    fx += motes(40, 0, SY + 4, 200, 70, '#c8fff0', 5);
    // ——— the waterline at the lens: a bright wavering meniscus; foam where the masts and the balls break it ———
    let top = '';
    { const R = rng(23), pts = []; for (let x = -10; x <= 210; x += 5) pts.push([x, SY + (R() - .5) * 1.6]);
      const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
      top += `<path d="${d}" stroke="#0a2a24" stroke-width="2.2" fill="none" opacity=".5" transform="translate(0 1.2)"/><path d="${d}" stroke="#eafff6" stroke-width=".9" fill="none" opacity=".9"/>`; }
    // the mast heads coming up through the sea: a collar of foam, water streaming off the yards
    const g = K.shipGeom('dutch', { ...DU }), mastX = g.masts.map(m => { const b = pt(DU, m.x, 18.5), t = m.top, k = (SY - b[1]) / (t[1] - b[1]); return [lerp(b[0], t[0], k), t[1] < SY, t]; });
    mastX.forEach(([x, up, t], i) => { if (!up) return; top += K.foam(u, { x, y: SY + .2, w: 18, h: 1.8, seed: 60 + i, L }) + K.splash(u, { x: x + 1, y: SY + .6, w: 8, h: 6, seed: 3 + i * 3, L, wind: 0 });
      const R = rng(71 + i); for (let j = 0; j < 12; j++) { const xx = t[0] - 10 + R() * 20, yy = t[1] + 2 + R() * (SY - t[1] - 4), l = 2 + R() * 4; top += `<path d="M${f(xx)} ${f(yy)}v${f(l)}" stroke="#e4fff6" stroke-width="${f(.25 + R() * .3)}" opacity="${f(.35 + R() * .4)}" stroke-linecap="round"/>`; } });
    // the balls tear out of the sea: the second at the head of a tall fresh column; the first one's column falls back
    COL.forEach(([x, h, w, by], i) => { top += waterColumn(u, L, x, SY + .5, h, w, [7, 5, 9][i], by); });
    // the first ball flies at the enemy: a thin trail of spray from its column, arcing down to her side
    { const tl = nid('tl', u), a = [COL[2][0] + 2, SY - 9], c = [112, 24], e = [ENEMY.x - 8, HZ - .5];
      top += `<defs>${linGrad(tl, a[0], a[1], e[0], e[1], [[0, '#e8fff6', 0], [1, '#f4fff8', .85]])}</defs><path d="M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${f(e[0] - 2.4)} ${f(e[1] - 3.2)}" stroke="url(#${tl})" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
        + K.shot(u, L, { x: e[0] - 1.6, y: e[1] - 1.4, s: .72, contact: false, seed: 4 }); }
    // the fog's veil low over the sea, the under-glass dark
    top += K.fog(u, L, { y: SY - 12, h: 14, density: .3, seed: 9 });
    { const gl = nid('gl', u); top += `<defs>${linGrad(gl, 0, 146, 0, 290, [[0, '#020806', 0], [.4, '#020806', .5], [1, '#010403', .85]])}</defs><rect x="-10" y="146" width="220" height="144" fill="url(#${gl})"/>`; }
    return [bg, mid + fx + top];
  } };
