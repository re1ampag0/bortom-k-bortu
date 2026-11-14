// «Ответный огонь» (Индевор, РЕАКЦИЯ: после Залпа по вашей команде стрелявший получает 1 урон по Корпусу и 1 по
// Парусам; это не Залп), refined from the first-round scene (portrait-endeavour.cjs SCENES['Ответный огонь']): the
// ship that fired at us, close, at the moment our answer strikes home — in two places at once (the brief's find): a
// fresh hole burnt through her main course, its edge still smouldering with the sun showing through, and a breach in
// her side with fire inside and splinters flying. In the near corner the answer itself: two swivel guns on our rail,
// one laid high at her canvas, one low at her hull, their flashes and smoke still hanging — no full broadside.
// Fixed against the first round: the sail and the side were a flat grey band and a black strip with nothing holding
// them — now the kit's black ship (her own masts, yards, rigging), sails backlit by the sun behind her; the hole was
// a pasted white patch — now a burnt ring with embers, smoke and sky through it; the breach was a square of fire on
// a plain strip — now smashed planks, fire in the dark inside, splinters out the way the shot went; who fired and
// how was not shown — now our two swivel guns, aimed at the two hits.
// After the review: the swivels larger and ~10 higher, each in a socket on the cap rail; the right one held by its
// gunner (people.cjs hand3 round the tiller, his sleeve from the corner); the kit's small pale tear in her course
// darkened into a scorched rent; our hole's edge charred into sharp teeth instead of curled scraps.
// Light: the sun high behind her (key, contre-jour: her canvas glows, rims on the yards), the fire and the flashes.
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, nid, linGrad, radGrad, rng, mix } = K;

const HZ = 118, EN = { kind: 'pearl', x: 92, y: 128, scale: 1.45, sails: 'full', seed: 7 };
const SAILHIT = { x: 122, y: 70 }, HULLHIT = { x: 70, y: 118 };
const RAIL = [[108, 145], [200, 93]], railY = x => RAIL[0][1] + (RAIL[1][1] - RAIL[0][1]) * (x - RAIL[0][0]) / (RAIL[1][0] - RAIL[0][0]);
// the left (lower) one laid level at her hull, the right (higher) one up at her canvas, its gunner's hand on the tiller
const SW = [{ x: 146, y: railY(146) - 2.2, aim: HULLHIT, len: 24, seed: 2 }, { x: 171, y: railY(171) - 2.2, aim: SAILHIT, len: 24, seed: 4, tiller: 12, gunner: true }];
const light = { time: 'day', haze: .3, key: { type: 'sun', x: 150, y: 22, color: '#fff2d0', power: 1 }, fill: { color: '#7fa4c8', power: .5 },
  rim: { az: 20, color: '#fff4dc', power: .6 },
  locals: [{ x: HULLHIT.x, y: HULLHIT.y, color: '#ff9a3a', power: .7, radius: 28 }, { x: SAILHIT.x, y: SAILHIT.y, color: '#ffb050', power: .4, radius: 18 }] };
const skel = { horizon: HZ, eye: 4, light: 'the sun high behind her (contre-jour); the fire in her side; the flashes of our guns', items: [
  ['enemy', -48, EN.y, 239, 146, 'water: broadside, bow to the left, close'],
  ['sail hole', SAILHIT.x - 11, SAILHIT.y + 9, 22, 18, 'in her main course'],
  ['breach', HULLHIT.x - 12, HULLHIT.y + 8, 24, 16, 'her side, between the ports'],
  ['our rail', 120, 150, 80, 50, 'the near corner: our bulwark and cap rail'],
  ['swivels', 128, 124, 70, 34, 'on our cap rail, in their yokes; the gunner\'s arm from the near corner']] };

// ——— KIT-CANDIDATE (as in zalp-s-oboih-bortov.cjs): a hit on a ship's side — the smashed hole, torn plank ends,
// splinters out the way the shot went (dir +1 right, -1 left), fire inside, smoke
function breach(u, L, o) {
  const R = rng(o.seed || 3), { x, y, s = 1, dir = -1 } = o, rp = L.ramp('oak', x, y);
  let out = '';
  // the hole: a dark ragged mouth, the fire inside lighting its back
  const pts = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, r = (i % 2 ? 4.4 : 6.4 + R() * 2.4) * s; return [x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * .9]; });
  out += `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="#160604"/>`;
  out += K.localGlow(u, { x, y: y + 1.5 * s, color: '#ff8a2a', power: .9, radius: 7 * s });
  out += K.fire(u, { x: x - 1 * s, y: y + 3 * s, w: 9 * s, h: 9 * s, seed: (o.seed || 3) + 2, wind: -.4, pool: false, glow: false });
  // the plank ends torn outwards round the mouth, lit by the fire from inside
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + R() * .3, r0 = 5.2 * s, r1 = r0 + (2 + R() * 3.6) * s, w = (.5 + R() * .5) * s;
    const ax = x + Math.cos(a) * r0 * 1.2, ay = y + Math.sin(a) * r0 * .85, bx = x + Math.cos(a + .2) * r1 * 1.25, by = y + Math.sin(a + .2) * r1 * .9;
    out += `<path d="M${f(ax - w)} ${f(ay)}L${f(bx)} ${f(by)}L${f(ax + w)} ${f(ay + w * .6)}Z" fill="${Math.sin(a) > 0 ? rp.half : '#d8904a'}" stroke="${rp.outline}" stroke-width=".2"/>`; }
  // splinters flying out the way the shot went, some burning at the ends
  for (let i = 0; i < 26; i++) { const a = (dir > 0 ? 0 : Math.PI) + (R() - .5) * 2.6, d = (6 + R() * 18) * s, len = (1.2 + R() * 3.4) * s, rot = a + (R() - .5) * 1.6, w = (.3 + R() * .35) * s;
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .7 - R() * 4 * s, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * w * 2, ny = dx / len * w * 2;
    out += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .4 ? '#f0c88a' : '#b07a42'}" stroke="#3a1e0c" stroke-width=".15"/>`
      + (R() > .7 ? `<circle cx="${f(cx + dx)}" cy="${f(cy + dy)}" r="${f(.5 * s)}" fill="#ffb040"/>` : ''); }
  return out;
}
// a fresh hole burnt through a sail: the sky through it, a charred ring, glowing embers along the edge, curled scraps
function sailHole(u, L, o) {
  const R = rng(o.seed || 5), { x, y, r = 9 } = o, n = 22;
  const pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, rr = r * (.8 + R() * .38) * (i % 3 === 0 ? .86 : 1); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]; });
  const d = `M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z`, g = nid('sh', u);
  let out = `<defs>${radGrad(g, x + r * .3, y - r * .3, r * 1.3, [[0, '#fffdf2'], [.55, '#eef0e6'], [1, '#c8d8e2']])}</defs>`;
  // the scorch round the hole on the canvas, then the hole with the bright sky in it
  { const sc = Array.from({ length: n * 2 }, (_, i) => { const a = i / (n * 2) * Math.PI * 2, rr = r * (1.18 + R() * .3 + (i % 2 ? .12 : 0)); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]; });
    out += `<path d="M${sc.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="#0c0806" opacity=".5"/>`; }
  out += `<path d="${d}" fill="#0c0806" stroke="#0c0806" stroke-width="${f(r * .3)}" stroke-linejoin="round" opacity=".8"/>`;
  out += `<path d="${d}" fill="url(#${g})"/>`;
  // the charred edge torn into small sharp teeth pointing into the hole, all round, none of them curled
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, a = Math.atan2(my - y, mx - x), l = r * (.08 + R() * .16), w = r * (.05 + R() * .05);
    out += `<path d="M${f(mx - Math.sin(a) * w)} ${f(my + Math.cos(a) * w)}L${f(mx - Math.cos(a + (R() - .5) * .5) * l)} ${f(my - Math.sin(a + (R() - .5) * .5) * l)}L${f(mx + Math.sin(a) * w)} ${f(my - Math.cos(a) * w)}Z" fill="#120a06"/>`; }
  // the ember edge: a glowing ring, broken, brighter on the lower side where it still burns
  out += `<path d="${d}" fill="none" stroke="#ff7a1a" stroke-width="${f(r * .08)}" stroke-dasharray="${f(r * .5)} ${f(r * .3)}" opacity=".95"/>`
    + `<path d="${d}" fill="none" stroke="#ffe08a" stroke-width="${f(r * .035)}" stroke-dasharray="${f(r * .3)} ${f(r * .4)}"/>`;
  // sparks drifting down the wind (to the left), smoke from the edge
  for (let i = 0; i < 12; i++) out += `<circle cx="${f(x - R() * r * 2.6)}" cy="${f(y + (R() - .3) * r * 2)}" r="${f(.25 + R() * .4)}" fill="${R() > .5 ? '#ffd070' : '#ff8a2a'}"/>`;
  out += K.smoke(u, L, { x: x - r * .5, y: y - r * .7, w: r * 2.2, h: r * 2.2, wind: -.8, seed: (o.seed || 5) + 3, opacity: .38, glow: { color: '#ff9a3a', power: .3 } });
  return out;
}
// a swivel gun on our rail: the barrel in an iron yoke, its pin in the rail, a tiller at the breech; (x, y) — the
// pin's head on the rail; aimed at `aim`. Returns { svg, muzzle: { x, y, dir } }
function swivel(u, L, o) {
  const { x, y, len } = o, k = 1.55, a = Math.atan2(o.aim.y - y + 3, o.aim.x - x), ca = Math.cos(a), sa = Math.sin(a), ri = L.ramp('iron', x, y);
  const tr = [x, y - 3.4 * k];   // the trunnions on the yoke
  const m = [tr[0] + ca * len * .62, tr[1] + sa * len * .62], b = [tr[0] - ca * len * .38, tr[1] - sa * len * .38];
  let out = '';
  // the post out of the rail and the yoke on it: two prongs up to the trunnions
  out += `<ellipse cx="${f(x + .4)}" cy="${f(railY(x) + .9)}" rx="${f(2.6 * k)}" ry="${f(.8 * k)}" fill="#000" opacity=".35"/><ellipse cx="${f(x)}" cy="${f(railY(x) + .3)}" rx="${f(2 * k)}" ry="${f(.6 * k)}" fill="${ri.half}" stroke="${ri.outline}" stroke-width=".25"/>`;
  out += K.shadeCyl(u, x, railY(x) + .3, x, y - 1, 1.1 * k, L, 'iron', { seed: 3 });
  out += `<path d="M${f(x - 2.6 * k)} ${f(y - .6)}Q${f(x - 2.8 * k)} ${f(y - 3 * k)} ${f(tr[0] - 1.6 * k)} ${f(tr[1])}M${f(x + 2.6 * k)} ${f(y - .6)}Q${f(x + 2.8 * k)} ${f(y - 3 * k)} ${f(tr[0] + 1.6 * k)} ${f(tr[1])}M${f(x - 2.6 * k)} ${f(y - .6)}H${f(x + 2.6 * k)}" stroke="${ri.half}" stroke-width="${f(1.1 * k)}" fill="none"/>`;
  // the barrel: thick at the breech, a ring at the muzzle, a reinforce, the knob and the tiller behind
  out += K.shadeCyl(u, b[0], b[1], m[0], m[1], 2.3 * k, L, 'iron', { r1: 2.8 * k, r2: 1.9 * k, seed: o.seed });
  out += K.shadeCyl(u, m[0] - ca * 1.4 * k, m[1] - sa * 1.4 * k, m[0], m[1], 2.4 * k, L, 'iron', { seed: o.seed + 1 }) + K.shadeCyl(u, b[0] - ca * .8 * k, b[1] - sa * .8 * k, b[0] + ca * 1.2 * k, b[1] + sa * 1.2 * k, 3 * k, L, 'iron', { seed: o.seed + 2 });
  out += `<circle cx="${f(tr[0])}" cy="${f(tr[1])}" r="${f(.9 * k)}" fill="${ri.shadow}"/>`;
  const tl = o.tiller || 6, t = [b[0] - ca * tl * k + sa * 1.2 * k, b[1] - sa * tl * k - ca * 1.2 * k];
  out += K.shadeCyl(u, b[0], b[1], t[0], t[1], .55 * k, L, 'iron', { seed: 5 }) + `<circle cx="${f(t[0])}" cy="${f(t[1])}" r="${f(1.1 * k)}" fill="${L.ramp('oak', x, y).half}"/>`;
  // where a hand takes the tiller: a little short of the knob, and the tiller's direction there
  const gl = Math.hypot(t[0] - b[0], t[1] - b[1]), grip = [b[0] + (t[0] - b[0]) * .78, b[1] + (t[1] - b[1]) * .78], gax = [(t[0] - b[0]) / gl, (t[1] - b[1]) / gl];
  return { svg: out, muzzle: { x: m[0], y: m[1], dir: a * 180 / Math.PI }, grip, gax, r: .55 * k };
}

module.exports = { name: 'Ответный огонь', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, { sky: ['#3a6a9c', '#76a2c8', '#c8d8e0', '#f2e8cc'] });
    const R = rng(51);
    // ——— the sky with the sun behind her, a few clouds, the sea
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[40, 28, 60, 10, 3, .2], [178, 60, 44, 7, 8, .4], [26, 92, 40, 5, 6, .6], [180, 104, 36, 4, 12, .75]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 13, glitter: 150 });

    // ——— her: the black ship broadside, close, the masts and sails rising out of the frame
    let fg = K.ship(u, L, Object.assign({ x: EN.x, y: EN.y, scale: EN.scale, wake: false }, EN));
    fg += K.foam(u, { x: EN.x + 10, y: EN.y + .4, w: 150, h: 1.6, seed: 4, L });
    // the old smoke of her own broadside still drifting off her side to the left
    for (const [x, y, w, h, sd] of [[24, 132, 44, 18, 2], [60, 134, 40, 16, 5]]) fg += K.smoke(u, L, { x, y, w, h, wind: -.6, seed: sd, opacity: .5 });

    // ——— the two hits: the sail and the side
    // the kit's own small tear in her main course, left of our hit (a clean pale triangle): darkened into a ragged
    // scorched rent, so the one bright hole in the sail is ours
    { const R2 = rng(77), cx = 94, cy = 79, n = 20, sc = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, rr = (5.6 + R2() * 2.2) * (i % 2 ? .82 : 1); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .95]; });
      fg += `<path d="M${sc.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="#0d0a08" opacity=".93"/>`
        + `<path d="M${f(cx - 3.6)} ${f(cy - 2.4)}L${f(cx - 1.4)} ${f(cy - 1.6)}L${f(cx - .6)} ${f(cy - 2.6)}L${f(cx + 1.2)} ${f(cy - .2)}L${f(cx + 3.4)} ${f(cy + .6)}L${f(cx + 2.6)} ${f(cy + 1.6)}L${f(cx + .4)} ${f(cy + .9)}L${f(cx - .8)} ${f(cy + 1.8)}L${f(cx - 2.2)} ${f(cy - .4)}Z" fill="#9aa8b0" opacity=".45"/>`; }
    fg += sailHole(u, L, { x: SAILHIT.x, y: SAILHIT.y, r: 12, seed: 5 });
    fg += breach(u, L, { x: HULLHIT.x, y: HULLHIT.y, s: 1.2, dir: -1, seed: 9 });
    fg += K.smoke(u, L, { x: HULLHIT.x - 2, y: HULLHIT.y - 4, w: 26, h: 30, wind: -.8, seed: 11, opacity: .7, glow: { color: '#ff8a2a', power: .5 } });
    fg += K.localGlow(u, { x: HULLHIT.x, y: HULLHIT.y, color: '#ff9a3a', power: .55, radius: 24 }, { squash: .7, core: false });

    // ——— our rail in the near corner: the inside of the bulwark (in its own shade, the sun is ahead), the cap rail
    // on top with its lit edge; two swivel guns in their yokes, just fired — flashes and smoke drifting left
    { const rK = L.ramp('oak', 170, 140), rI = L.ramp('paint-red', 170, 150);
      const top = RAIL, th = 5;
      fg += `<path d="M${top[0][0]} ${top[0][1] + th}L${top[1][0]} ${top[1][1] + th}V280H${top[0][0] - 30}Z" fill="${rI.shadow}"/>`
        + Array.from({ length: 6 }, (_, k) => { const t = .12 + k * .17, x = top[0][0] + (top[1][0] - top[0][0]) * t, y = top[0][1] + (top[1][1] - top[0][1]) * t + th; return `<path d="M${f(x)} ${f(y)}L${f(x - 10)} 280" stroke="${rK.shadow}" stroke-width="4"/><path d="M${f(x + 1.8)} ${f(y)}L${f(x - 8.2)} 280" stroke="${rK.half}" stroke-width=".6" opacity=".7"/>`; }).join('')
        + `<path d="M${top[0][0]} ${top[0][1]}L${top[1][0]} ${top[1][1]}L${top[1][0]} ${top[1][1] + th}L${top[0][0]} ${top[0][1] + th}Z" fill="${rK.half}"/>`
        + `<path d="M${top[0][0]} ${top[0][1]}L${top[1][0]} ${top[1][1]}" stroke="${L.rimColor}" stroke-width=".9"/><path d="M${top[0][0]} ${top[0][1] + th}L${top[1][0]} ${top[1][1] + th}" stroke="${rK.core}" stroke-width=".7"/>`; }
    for (const s of SW) { const g = swivel(u, L, s);
      let arm = '', hb = '', hf = '';
      if (s.gunner) {
        // the gunner's hand on the tiller (the fingers round it from below, the back of the hand to us, in the shade of
        // the contre-jour with the sun's rim on the knuckles), his forearm and shoulder coming in from the near corner
        const SK = Object.assign({}, L.ramp('skin', 185, 120)), tn = { lit: mix(SK.lit, SK.half, .3), half: mix(SK.half, SK.shadow, .25), shadow: SK.shadow, outline: SK.outline || '#2a140a' };
        const want = Math.atan2(g.gax[1], g.gax[0]) * 180 / Math.PI, base = { s: 1.45, m: 1, roll: 18, pitch: 12, pose: 'wrap', r: g.r / 1.45, tone: tn, light: [-.4, -.9], sw: .3, tilt: 6, grip: g.grip };
        let a = want + 90, h;
        for (let it = 0; it < 5; it++) { h = H.hand3(u, { ...base, a }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
          let d = want - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
        const w = h.wrist, coat = { lit: '#3e5a8a', half: '#23365a', shadow: '#121c30', outline: '#080c16' };
        const el = [w[0] + 11, w[1] + 11], sh = [214, 124];
        arm = H.cloth(u, { spine: [sh, [(sh[0] + el[0]) / 2 + 2, (sh[1] + el[1]) / 2], el, [(el[0] + w[0]) / 2 + .6, (el[1] + w[1]) / 2], [w[0] + .8, w[1] + 1.2]],
          w: [22, 16, 11.4, 9.2, 7.4], tone: coat, lit: -1, rim: L.rimColor, rimSide: -1, rimOp: .6, seed: 6, drapes: 2, sw: .35,
          cuff: { from: .8, k: 1.14, tone: { lit: '#e8e0cc', half: '#b8ae98', shadow: '#6a6250', outline: '#2a2618' } } });
        hb = h.back; hf = h.front;
      }
      fg += arm + hb + g.svg + hf + K.muzzleFlash(u, { x: g.muzzle.x, y: g.muzzle.y, dir: g.muzzle.dir, len: s.len, seed: s.seed, smoke: false })
        + K.smoke(u, L, { x: g.muzzle.x + Math.cos(g.muzzle.dir * Math.PI / 180) * 8, y: g.muzzle.y + Math.sin(g.muzzle.dir * Math.PI / 180) * 8, w: 22, h: 18, wind: -.8, seed: s.seed + 20, opacity: .55 })
        + K.localGlow(u, { x: g.muzzle.x, y: g.muzzle.y, color: '#ffc070', power: .6, radius: 16 }); }
    // the sea darkens under the glass
    { const g = nid('dk', u); fg += `<defs>${linGrad(g, 0, 150, 0, 290, [[0, '#06141c', 0], [1, '#06141c', .5]])}</defs><rect x="0" y="150" width="200" height="140" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
