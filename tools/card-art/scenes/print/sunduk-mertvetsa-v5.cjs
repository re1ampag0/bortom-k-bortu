// «Сундук мертвеца» (Летучий голландец, ПРИКАЗ: возьмите 2 карты) — variant v5, made anew (the user: «придумать
// заново»). Two compositions were weighed:
//  A. «На дне»: the chest lies on the sand at the bottom of the sea in the green water, cold shafts of light come
//     down from the surface; the lid has jumped up on its chains, red light beats out of the slit, a column of bubbles
//     tears out of it and rises, the beat has kicked up the silt round its foot and the small fish dart away from it.
//     Mass: the dark sea floor below and the chest in the middle; light: cold shafts from above + the red slit; focus:
//     the slit with the bubbles.
//  B. «Крупно, снизу»: the eye at the sand, the chest across the whole card, looming; the red light from the slit
//     lights the chain taut across it and the barnacles from below; a night beach behind. Close to the old card.
// Chosen: A — a new place (under water, not the beach), and the beat is shown by what it does (bubbles, silt, fleeing
// fish, the lid on the chains), not only by a glow.
// Light: the day far above, through the water — cold, from above and a little from the left and behind (key); the red
// beat inside the chest (local, warm). Under water the weed stands up and sways, it does not hang.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;

const HZ = 96;                                     // where the sea floor fades into the murk
const C = { x0: 44, y0: 144, W: 90, D: 50, Hb: 34, kx: .42, ky: .27, lip: 5, rho: 13, th: 20 };  // the chest (own units)
const light = { time: 'fog', haze: .8, key: { type: 'sun', az: 215, el: 66, color: '#c8f4e8', power: .62 }, fill: { color: '#1e4e4a', power: .55 },
  rim: { az: 330, color: '#b8f8e8', power: .35 }, locals: [{ x: 100, y: 100, h: 2, color: '#ff5a32', power: .85, radius: 70 }] };
const skel = { horizon: HZ, eye: .8, light: 'daylight far above through the water, from above-left (key, cold); the red beat in the chest (local)', items: [
  ['wreck, rocks', 0, HZ, 200, 40, 'sea floor, far, in the murk'], ['kelp', 0, 280, 200, 260, 'sea floor, near, at both edges'],
  ['chest', C.x0, C.y0, 112, 70, 'sand (sunk a little, contact shadow)'], ['red gap', 44, 92, 112, 20, 'between the body and the lid'],
  ['bubbles', 70, 92, 70, 92, 'rising out of the gap'], ['silt', 20, 156, 160, 30, 'round the foot of the chest'],
  ['fish', 10, 30, 190, 50, 'water, darting away'], ['chains, padlock', 50, 160, 100, 20, 'round the chest, slack on the sand']] };

// the chest's own projection (oblique 3/4): x across, z away from us, h up
const Pc = (x, z, h) => [C.x0 + x + z * C.kx, C.y0 - h - z * C.ky];
const P2 = p => `${f(p[0])} ${f(p[1])}`;
const LT = 3;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const TH = C.th * Math.PI / 180;
const lidZH = (z, h) => { const dz = z - C.D, dh = h - C.Hb; return [C.D + dz * Math.cos(TH) + dh * Math.sin(TH), C.Hb + dh * Math.cos(TH) - dz * Math.sin(TH)]; };
const lidN = (nd, nh) => [nd * Math.cos(TH) + nh * Math.sin(TH), nh * Math.cos(TH) - nd * Math.sin(TH)];
const Pl = (x, z, h) => { const q = lidZH(z, h); return Pc(x, q[0], q[1]); };
const PROF = (() => { const out = [[0, C.Hb], [0, C.Hb + C.lip]]; for (let i = 1; i <= 8; i++) { const z = C.D * i / 8; out.push([z, C.Hb + C.lip + C.rho * Math.sin(Math.PI * z / C.D) ** .8]); } out.push([C.D, C.Hb]); return out; })();

// KIT-CANDIDATE (from sunduk-mertvetsa.cjs): a barnacle cluster (cones with dark mouths), lit from above-left
function barnacles(u, x, y, n, s, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, bx - r, 0, bx + r, 0, [[0, '#c8d4c0', 1], [.55, '#86947e', 1], [1, '#2e3a30', 1]])}</defs>`
      + `<ellipse cx="${f(bx + r * .4)}" cy="${f(by + r * .5)}" rx="${f(r * 1.2)}" ry="${f(r * .6)}" fill="#050c0a" opacity=".45"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#26302a" stroke-width=".25"/>`
      + `<path d="M${f(bx - r * .7)} ${f(by + r * .1)}L${f(bx - r * .3)} ${f(by - r * .6)}" stroke="#eef8ea" stroke-width=".25" opacity=".6"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#141c16"/>`; }
  return out;
}
// KIT-CANDIDATE (from sunduk-mertvetsa.cjs): a scallop shell
function scallop(u, x, y, r, a, col = '#d8c8b0') {
  const g = nid('sc', u); let ribs = '';
  for (let i = 0; i <= 8; i++) { const t = (-70 + i * 17.5) * Math.PI / 180; ribs += `<path d="M0 ${f(r * .15)}L${f(Math.sin(t) * r * .95)} ${f(-Math.cos(t) * r * .95)}" stroke="${mix(col, '#3a2a1a', .5)}" stroke-width="${f(r * .05)}" opacity=".7"/>`; }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><defs>${radGrad(g, -r * .3, -r * .6, r * 1.3, [[0, mix(col, '#ffffff', .35), 1], [.6, col, 1], [1, mix(col, '#2a1a10', .55), 1]])}</defs>`
    + `<ellipse cx="${f(r * .1)}" cy="${f(r * .25)}" rx="${f(r * 1.05)}" ry="${f(r * .5)}" fill="#050a08" opacity=".4"/>`
    + `<path d="M0 ${f(r * .2)}L${f(-r * .95)} ${f(-r * .3)}Q${f(-r * .8)} ${f(-r * 1.05)} 0 ${f(-r * 1.05)}Q${f(r * .8)} ${f(-r * 1.05)} ${f(r * .95)} ${f(-r * .3)}Z" fill="url(#${g})" stroke="${mix(col, '#1a100a', .6)}" stroke-width="${f(r * .06)}"/>${ribs}`
    + `<path d="M${f(-r * .35)} ${f(r * .05)}h${f(r * .7)}l${f(-r * .1)} ${f(r * .3)}h${f(-r * .5)}z" fill="${mix(col, '#2a1a10', .3)}"/></g>`;
}
// weed under water: strands growing UP from (x, y), swaying in the current (to the right)
function weedUp(x, y, len, n, seed, col = '#3e7a5a', lit = '#a8e8c0') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 5, l = len * (.6 + R() * .5), sw = 2 + R() * 5;
    const d = `M${f(x0)} ${f(y)}q${f(-sw * .6)} ${f(-l * .35)} ${f(sw * .2)} ${f(-l * .6)}t${f(sw)} ${f(-l * .4)}`;
    out += `<path d="${d}" stroke="${col}" stroke-width="${f(.8 + R() * .9)}" fill="none" stroke-linecap="round" opacity=".92"/>`
      + `<path d="${d}" stroke="${lit}" stroke-width=".28" fill="none" opacity=".45" transform="translate(-.35 0)"/>`; }
  return out;
}
// a kelp stalk near us: a long ribbon up from the floor with leaf blades, dark against the water, a cold rim on the left
function kelp(u, x, y, h, sway, seed) {
  const R = rng(seed), g = nid('kp', u); let o = '', pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([x + Math.sin(t * 3.1 + seed) * sway * t + sway * t * t, y - h * t]); }
  o += `<defs>${linGrad(g, 0, y - h, 0, y, [[0, '#2a5a4a', 1], [.5, '#163a30', 1], [1, '#08140f', 1]])}</defs>`;
  let d = `M${P2(pts[0])}`; for (let i = 1; i < pts.length; i++) d += `L${P2(pts[i])}`;
  o += `<path d="${d}" stroke="url(#${g})" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i < pts.length; i++) { const p = pts[i], s = i % 2 ? 1 : -1, l = 12 + R() * 10, w = 3.4 + R() * 2;
    const tip = [p[0] + s * l * .7 + sway * .3, p[1] - l * .7];
    o += `<path d="M${P2(p)}Q${f(p[0] + s * w * 2)} ${f(p[1] - w)} ${P2(tip)}Q${f(p[0] + s * w * .4)} ${f(p[1] - l * .3)} ${P2(p)}Z" fill="url(#${g})" opacity=".95"/>`
      + `<path d="M${P2(p)}Q${f(p[0] + s * w * .4)} ${f(p[1] - l * .3)} ${P2(tip)}" stroke="#7ac8a8" stroke-width=".35" fill="none" opacity=".4"/>`; }
  return o;
}
// a small fish seen from the side, nose at (x, y), heading by angle a (degrees, 0 — to the right), size s; dark with a
// lit back and a pale belly; a few streaks behind it (it darts)
function fish(x, y, a, s, op = 1) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${f(s)})" opacity="${f(op)}">`
    + `<path d="M3 0L18 0M5 2.4L15 2.6M5 -2.4L13 -2.6" stroke="#bfeee0" stroke-width=".35" opacity=".35" transform="translate(13 0)"/>`
    + `<path d="M0 0Q3 -2.6 8 -2.4Q11 -2 12.6 -.4L15.4 -3L14.8 0L15.4 3L12.6 .4Q11 2 8 2.4Q3 2.6 0 0Z" fill="#183c38"/>`
    + `<path d="M.8 -.6Q4 -2.4 8 -2.2Q10.6 -1.9 12.4 -.6" stroke="#9ad8c8" stroke-width=".45" fill="none" opacity=".8"/>`
    + `<path d="M1.6 .5Q5 1.8 10 1.2" stroke="#6aa898" stroke-width=".5" fill="none" opacity=".6"/><circle cx="2.4" cy="-.5" r=".45" fill="#e8fff8"/></g>`;
}
// a bubble: a thin bright rim, a faint body, a highlight up-left; near the gap its underside takes the red
function bubble(x, y, r, red) {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#d8fff4" fill-opacity=".1" stroke="#e8fff8" stroke-width="${f(Math.min(.45, .18 + r * .1))}" stroke-opacity=".75"/>`
    + `<circle cx="${f(x - r * .38)}" cy="${f(y - r * .4)}" r="${f(Math.max(.18, r * .22))}" fill="#ffffff" opacity=".85"/>`
    + (red > 0 ? `<path d="M${f(x - r * .8)} ${f(y + r * .4)}A${f(r)} ${f(r)} 0 0 0 ${f(x + r * .8)} ${f(y + r * .4)}" stroke="#ff9a68" stroke-width="${f(Math.max(.3, r * .3))}" fill="none" opacity="${f(red)}"/>` : '');
}

module.exports = { name: 'Сундук мертвеца', variant: 'v5', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .8 });
    const Wc = C.W, D = C.D, Hb = C.Hb;
    // ——— the water: bright and green-blue toward the surface far above, dark below; the floor fades into it ———
    let bg = '';
    { const g = nid('wc', u); bg += `<defs>${linGrad(g, 0, 0, 0, HZ + 4, [[0, '#5aa89c', 1], [.22, '#2a7068', 1], [.6, '#16423e', 1], [1, '#143a36', 1]])}</defs><rect x="-5" y="-5" width="210" height="${HZ + 10}" fill="url(#${g})"/>`; }
    // the surface far above: a slow shimmer of light at the very top
    { const R = rng(3); for (let i = 0; i < 26; i++) { const x = R() * 220 - 10, y = R() * 14, w = 8 + R() * 18;
      bg += `<path d="M${f(x)} ${f(y)}q${f(w * .25)} ${f(-1.4)} ${f(w * .5)} 0t${f(w * .5)} 0" stroke="#e8fff4" stroke-width="${f(.4 + R() * .5)}" fill="none" opacity="${f(.18 + R() * .25)}"/>`; } }
    // far: a wreck lying on her side in the murk (the ribs, a broken mast) and rocks — pale, cold, low contrast
    { const col = '#2a5e58', col2 = '#2e6660';
      bg += `<g data-far=""><path d="M126 ${HZ + 1}Q132 ${HZ - 16} 152 ${HZ - 20}Q176 ${HZ - 22} 196 ${HZ - 12}L204 ${HZ - 6}L204 ${HZ + 1}Z" fill="${col}"/>`;
      for (let i = 0; i < 7; i++) { const x = 136 + i * 9; bg += `<path d="M${x} ${HZ - 4}Q${x + 2} ${HZ - 22 - (i % 3) * 3} ${x + 9} ${HZ - 30 + (i % 2) * 4}" stroke="${col2}" stroke-width="1.6" fill="none"/>`; }
      bg += `<path d="M160 ${HZ - 18}L118 ${HZ - 56}" stroke="${col2}" stroke-width="2.2"/><path d="M131 ${HZ - 44}l10 -6M143 ${HZ - 33}l-9 7" stroke="${col2}" stroke-width="1"/>`
        + `<path d="M-4 ${HZ + 1}Q6 ${HZ - 18} 18 ${HZ - 22}Q30 ${HZ - 26} 38 ${HZ - 14}Q46 ${HZ - 8} 58 ${HZ - 4}L62 ${HZ + 1}Z" fill="${col}"/>`
        + `<path d="M8 ${HZ - 18}Q20 ${HZ - 24} 34 ${HZ - 18}" stroke="#4e8a80" stroke-width=".6" fill="none" opacity=".7"/>`;
      // the murk over them (they are far)
      const m = nid('mk', u); bg += `<defs>${linGrad(m, 0, HZ - 60, 0, HZ + 6, [[0, '#2a6a62', 0], [.6, '#20564f', .3], [1, '#1e504a', .5]])}</defs><rect x="-5" y="${HZ - 60}" width="210" height="66" fill="url(#${m})"/></g>`; }
    // the shafts of light from the surface: parallel, slanting down to the right, fading with depth
    { const sg = nid('sg', u), sb = nid('sb', u);
      bg += `<defs>${linGrad(sg, 0, -4, 0, 170, [[0, '#e8fff4', .8], [.45, '#c8f4e8', .38], [1, '#c8f4e8', 0]])}<filter id="${sb}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`
        + `<g style="mix-blend-mode:screen" filter="url(#${sb})">`
        + [[18, 7, .7], [52, 12, 1], [86, 6, .8], [112, 14, 1], [150, 8, .7], [176, 5, .55]].map(([x, w, op]) => `<path d="M${x} -4L${x + w} -4L${f(x + w * 2.4 + 46)} 170L${f(x + 46)} 170Z" fill="url(#${sg})" opacity="${op}"/>`).join('') + `</g>`; }
    // ——— the sea floor: sand in ripples, lit from above, fading into the murk far off ———
    { const g = nid('sd', u), R = rng(21);
      bg += `<defs>${linGrad(g, 0, HZ, 0, 280, [[0, '#1e4c46', 1], [.12, '#36605a', 1], [.32, '#4e6c60', 1], [.6, '#2e443a', 1], [1, '#0e1814', 1]])}</defs><rect x="-5" y="${HZ}" width="210" height="${290 - HZ}" fill="url(#${g})"/>`;
      for (let i = 0; i < 46; i++) { const y = HZ + 3 + R() ** 1.25 * 170, x = R() * 220 - 10, k = (y - HZ) / 170, wd = 6 + k * 26 + R() * 8;
        bg += `<path d="M${f(x)} ${f(y)}q${f(wd * .25)} ${f(-1 - k * 1.6)} ${f(wd * .5)} 0t${f(wd * .5)} 0" stroke="#0e1a16" stroke-width="${f(.3 + k * .6)}" fill="none" opacity=".3"/>`
          + `<path d="M${f(x)} ${f(y - .6 - k * .4)}q${f(wd * .25)} ${f(-1 - k * 1.6)} ${f(wd * .5)} 0" stroke="#cfe8d4" stroke-width="${f(.25 + k * .3)}" fill="none" opacity=".26"/>`; }
      for (let i = 0; i < 60; i++) bg += `<circle cx="${f(R() * 200)}" cy="${f(HZ + 6 + R() * 180)}" r="${f(.2 + R() * .45)}" fill="${R() > .5 ? '#d8eadc' : '#0e1612'}" opacity="${f(.2 + R() * .35)}"/>`;
      // the caustics: the net of light the waves above throw on the sand (squashed by the perspective)
      const cb = nid('cb', u); let net = '';
      for (let i = 0; i < 70; i++) { const cx = R() * 220 - 10, cy = HZ + 8 + R() ** 1.2 * 120, k = (cy - HZ) / 120, r = 3 + k * 8;
        let d = ''; for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2 + R() * .5, rr = r * (.7 + R() * .5); d += (j ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr * (.22 + k * .12)); }
        net += `<path d="${d}Z" stroke="#e0fff0" stroke-width="${f(.3 + k * .4)}" fill="none" stroke-linejoin="round" opacity="${f(.25 + R() * .3)}"/>`; }
      bg += `<defs><filter id="${cb}" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation=".35"/></filter></defs><g style="mix-blend-mode:screen" filter="url(#${cb})">${net}</g>`;
      // a few pebbles and a shell or two
      for (const [x, y, r] of [[22, 168, 2.4], [30, 172, 1.4], [178, 150, 2], [170, 176, 2.8], [14, 128, 1.4], [192, 124, 1.2]]) bg += `<ellipse cx="${x + .6}" cy="${y + r * .4}" rx="${f(r * 1.2)}" ry="${f(r * .5)}" fill="#08100c" opacity=".5"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * .7)}" fill="#4a5a50"/><ellipse cx="${f(x - r * .3)}" cy="${f(y - r * .3)}" rx="${f(r * .45)}" ry="${f(r * .25)}" fill="#b8d0c0" opacity=".6"/>`; }
    // ——— the beat in the sand: the red pool of the slit's light, rings going out over the floor ———
    { const bl = nid('rb', u), cx = 100, cy = 140;
      bg += K.localGlow(u, { x: cx, y: cy + 6, color: '#ff5a32', power: .5, radius: 90 }, { squash: .3, core: false })
        + `<defs><filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1"/></filter></defs><g style="mix-blend-mode:screen">`;
      [[70, .5], [86, .36], [104, .24]].forEach(([r, op], i) => { bg += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r * .26)}" fill="none" stroke="#ff6a40" stroke-width="${f(2.4 - i * .5)}" opacity="${f(op * .6)}" filter="url(#${bl})"/>`
        + `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r * .26)}" fill="none" stroke="#ffc8a0" stroke-width=".4" opacity="${f(op * .7)}" stroke-dasharray="${f(r * .35)} ${f(r * .12)}"/>`; });
      bg += '</g>'; }
    // kelp far behind the chest (paler), swaying
    bg += `<g opacity=".55">${kelp(u, 30, HZ + 10, 60, 6, 3)}${kelp(u, 174, HZ + 8, 52, 5, 8)}</g>`;

    // ——— the chest ———
    let fg = K.castShadow(u, L, { x: 100, y: C.y0 - 6, w: 112, h: 50, horizon: HZ, d: .5, opacity: .4 }) + K.contactShadow(u, 100, C.y0 - 3, 130, L, { ry: 5, opacity: .7 });
    // the body: the right end, then the front (planks of oak)
    fg += K.shadeBox(u, [{ pts: [Pc(Wc, 0, 0), Pc(Wc, D, 0), Pc(Wc, D, Hb), Pc(Wc, 0, Hb)], n: 'right', grain: [C.kx, -C.ky] },
      { pts: [Pc(0, 0, 0), Pc(Wc, 0, 0), Pc(Wc, 0, Hb), Pc(0, 0, Hb)], n: 'front', grain: [1, 0] }], L, 'oak', { seed: 7, outline: .5 });
    for (const h of [11.5, 23]) fg += `<path d="M${P2(Pc(0, 0, h))}L${P2(Pc(Wc, 0, h))}L${P2(Pc(Wc, D, h))}" stroke="#140a04" stroke-width=".6" fill="none" opacity=".7"/><path d="M${P2(Pc(0, 0, h - .6))}L${P2(Pc(Wc, 0, h - .6))}" stroke="#d8c8a0" stroke-width=".3" opacity=".25"/>`;
    // years under water: a green film over the wood, thicker toward the foot
    { const g = nid('al', u), a = Pc(0, 0, Hb), b = Pc(0, 0, 0);
      fg += `<defs>${linGrad(g, 0, a[1], 0, b[1], [[0, '#2a6a52', .12], [1, '#1e5a44', .5]])}</defs><path d="${poly([Pc(0, 0, 0), Pc(Wc, 0, 0), Pc(Wc, D, 0), Pc(Wc, D, Hb), Pc(Wc, 0, Hb), Pc(0, 0, Hb)])}" fill="url(#${g})"/>`; }
    // the inside through the gap: the far wall lit red by what beats in there, white-hot at the middle
    { const g = nid('in', u), hot = Pc(Wc / 2, 6, Hb + 4), hx = f(hot[0]), hy = f(hot[1]);
      fg += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${hx}" cy="${hy}" r="52" gradientTransform="translate(${hx} ${hy}) scale(1 .42) translate(-${hx} -${hy})">`
        + [[0, '#ffffff'], [.1, '#fff2c8'], [.22, '#ffc070'], [.4, '#f0602a'], [.62, '#b0200e'], [.82, '#5a0a06'], [1, '#2a0403']].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + `</radialGradient></defs>`
        + `<path d="${poly([Pc(0, 0, Hb), Pc(Wc, 0, Hb), Pc(Wc, D, Hb), Pl(Wc, 0, Hb), Pl(0, 0, Hb)])}" fill="url(#${g})"/>`
        + `<path d="M${P2(Pc(0, 0, Hb))}L${P2(Pc(Wc, 0, Hb))}L${P2(Pc(Wc, D, Hb))}" stroke="#ffc890" stroke-width="1.1" fill="none" opacity=".9"/>`
        + `<path d="M${P2(Pc(1.6, 1.6, Hb))}L${P2(Pc(Wc - 1.6, 1.6, Hb))}" stroke="#5a1006" stroke-width="1.2" opacity=".6"/>`; }
    // the lid: its right end (the arch), the arch in strips, the front lip — lifted on the back hinges
    { const faces = [{ pts: PROF.map(([z, h]) => Pl(Wc, z, h)), n: 'right', grain: [C.kx, -C.ky] }];
      for (let i = PROF.length - 2; i >= 1; i--) { const [z0, h0] = PROF[i], [z1, h1] = PROF[i + 1]; if (i === PROF.length - 2) continue;
        const td = z1 - z0, tv = h1 - h0, l = Math.hypot(td, tv), n = lidN(-tv / l, td / l);
        faces.push({ pts: [Pl(0, z0, h0), Pl(Wc, z0, h0), Pl(Wc, z1, h1), Pl(0, z1, h1)], n: [0, n[1], -n[0]], grain: [1, 0] }); }
      const nf = lidN(-1, 0); faces.push({ pts: [Pl(0, 0, Hb), Pl(Wc, 0, Hb), Pl(Wc, 0, Hb + C.lip), Pl(0, 0, Hb + C.lip)], n: [0, nf[1], -nf[0]], grain: [1, 0] });
      fg += K.shadeBox(u, faces, L, 'oak', { seed: 9, outline: .5 });
      // the light from above lies on the arch's crown; the caustic net plays over it
      { const cg = nid('lc', u), cr = nid('lr', u), ctr = Pl(Wc * .45, C.D * .5, Hb + C.lip + C.rho), R = rng(61); let net = '';
        for (let i = 0; i < 16; i++) { const cx = Pl(4 + R() * (Wc - 8), 8 + R() * 30, 0)[0], cy = ctr[1] + (R() - .5) * 12, r = 3 + R() * 3;
          let d = ''; for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2 + R() * .5, rr = r * (.7 + R() * .5); d += (j ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr * .4); }
          net += `<path d="${d}Z" stroke="#e8fff4" stroke-width=".4" fill="none" opacity="${f(.25 + R() * .3)}"/>`; }
        const lidPoly = 'M' + PROF.slice(1).map(([z, h]) => P2(Pl(0, z, h))).join('L') + 'L' + PROF.slice(1).reverse().map(([z, h]) => P2(Pl(Wc, z, h))).join('L') + 'Z';
        fg += `<defs><clipPath id="${cr}"><path d="${lidPoly}"/></clipPath>${radGrad(cg, ctr[0], ctr[1], 50, [[0, '#d8fff0', .42], [1, '#d8fff0', 0]])}</defs><g clip-path="url(#${cr})" style="mix-blend-mode:screen"><ellipse cx="${f(ctr[0])}" cy="${f(ctr[1])}" rx="60" ry="14" fill="url(#${cg})"/>${net}</g>`; }
      // the board's thickness: its front edge under the lip, its shadow on the slit
      { const sh = nid('ls', u), bd = nid('lb', u), b0 = Pl(0, 0, Hb), b1 = Pl(0, 0, Hb - LT);
        fg += `<defs><filter id="${sh}" x="-5%" y="-100%" width="110%" height="300%"><feGaussianBlur stdDeviation="1.1"/></filter>${linGrad(bd, 0, b0[1], 0, b1[1], [[0, '#b08452', 1], [.3, '#6a4220', 1], [.7, '#2a1408', 1], [1, '#140802', 1]])}</defs>`
          + `<path d="M${P2(Pl(.5, 0, Hb - LT))}L${P2(Pl(Wc, 0, Hb - LT))}L${P2(Pl(Wc, D, Hb - LT))}L${P2(Pl(Wc, D, Hb - LT - 2.6))}L${P2(Pl(Wc, 0, Hb - LT - 2.6))}L${P2(Pl(.5, 0, Hb - LT - 2.6))}Z" fill="#1a0402" opacity=".55" filter="url(#${sh})"/>`
          + `<path d="${poly([Pl(0, 0, Hb), Pl(Wc, 0, Hb), Pl(Wc, D, Hb), Pl(Wc, D, Hb - LT), Pl(Wc, 0, Hb - LT), Pl(0, 0, Hb - LT)])}" fill="url(#${bd})" stroke="#0e0602" stroke-width=".45"/>`
          + `<path d="M${P2(Pl(0, 0, Hb - LT))}L${P2(Pl(Wc, 0, Hb - LT))}L${P2(Pl(Wc, D, Hb - LT))}" stroke="#ff7a48" stroke-width=".8" fill="none" opacity=".8"/>`; } }
    // the iron: two straps up the front and over the arch, corner angles, rivets
    { const strap = (x, w) => { let o = K.shadeBox(u, [{ pts: [Pc(x - w, 0, 0), Pc(x + w, 0, 0), Pc(x + w, 0, Hb - .2), Pc(x - w, 0, Hb - .2)], n: 'front' }], L, 'iron', { outline: .35 });
        const faces = [];
        for (let i = PROF.length - 2; i >= 1; i--) { const [z0, h0] = PROF[i], [z1, h1] = PROF[i + 1]; if (i === PROF.length - 2) continue; const td = z1 - z0, tv = h1 - h0, l = Math.hypot(td, tv), n = lidN(-tv / l, td / l);
          faces.push({ pts: [Pl(x - w, z0, h0 + .4), Pl(x + w, z0, h0 + .4), Pl(x + w, z1, h1 + .4), Pl(x - w, z1, h1 + .4)], n: [0, n[1], -n[0]] }); }
        const nf = lidN(-1, 0); faces.push({ pts: [Pl(x - w, -.4, Hb - LT), Pl(x + w, -.4, Hb - LT), Pl(x + w, -.4, Hb + C.lip + .4), Pl(x - w, -.4, Hb + C.lip + .4)], n: [0, nf[1], -nf[0]] });
        o += K.shadeBox(u, faces, L, 'iron', { outline: .35 });
        for (const h of [5, 16, 27]) { const p = Pc(x, 0, h); o += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".9" fill="#2a2e2c"/><circle cx="${f(p[0] - .3)}" cy="${f(p[1] - .3)}" r=".35" fill="#c8d4d0" opacity=".8"/>`; }
        return o; };
      fg += strap(9, 3) + strap(Wc - 9, 3);
      for (const [x, h, dx, dh] of [[0, 0, 7, 7], [Wc, 0, -7, 7]]) fg += K.shadeBox(u, [{ pts: [Pc(x, 0, h), Pc(x + dx, 0, h), Pc(x, 0, h + dh)], n: 'front' }], L, 'iron', { outline: .35 });
      { const a = Pc(Wc, 18, 22), b = Pc(Wc, 32, 22), m = Pc(Wc, 25, 15); fg += K.propTube(u, L, 'iron', `M${P2(a)}Q${P2(m)} ${P2(b)}`, 1, m); }
      // the brass lock plate on the front, its hasp torn out and hanging
      { const lk = K.mat('brass', L, { form: 'plane', x1: Pc(Wc / 2 - 6, 0, 0)[0], y1: Pc(0, 0, Hb - 2)[1], x2: Pc(Wc / 2 + 6, 0, 0)[0], y2: Pc(0, 0, Hb - 16)[1], n: 'front', u });
        const a = Pc(Wc / 2 - 5.5, 0, Hb - 2), b = Pc(Wc / 2 + 5.5, 0, Hb - 16);
        fg += `<defs>${lk.defs}</defs><path d="M${f(a[0])} ${f(a[1])}H${f(b[0])}V${f(b[1] - 4)}Q${f((a[0] + b[0]) / 2)} ${f(b[1] + 3)} ${f(a[0])} ${f(b[1] - 4)}Z" fill="${lk.fill}" stroke="${lk.ramp.outline}" stroke-width=".5"/>`
          + `<circle cx="${f((a[0] + b[0]) / 2)}" cy="${f(a[1] + 5.5)}" r="1.5" fill="#1a0e04"/><path d="M${f((a[0] + b[0]) / 2 - .9)} ${f(a[1] + 6.5)}h1.8l.5 3.6h-2.8z" fill="#1a0e04"/>`
          + `<path d="M${f(a[0] + 1)} ${f(a[1] + 1.2)}H${f(b[0] - 1)}" stroke="#ff9a68" stroke-width=".5" opacity=".8"/>`
          // the hasp: torn off the lid, swinging from the plate
          + `<path d="M${f(b[0] - 1)} ${f(a[1] + 1)}l3.4 5.6l-2 1.2l-3.2 -5.4z" fill="#3a3e3a" stroke="#0a0c0a" stroke-width=".35"/>`; } }
    // the growth: barnacles in clusters, scallops, a starfish; weed standing up from the lid's ridge and the foot
    { const at = Pc, atL = Pl;
      for (const [p, n, s, sd] of [[at(4, 0, 4), 6, 1.5, 1], [at(18, 0, 2), 4, 1.2, 2], [at(Wc - 4, 0, 5), 5, 1.4, 3], [at(Wc, 22, 6), 6, 1.3, 4], [at(Wc, 42, 13), 3, 1, 5],
        [at(64, 0, 3), 3, 1, 6], [atL(28, 10, Hb + C.lip + 8), 4, 1.1, 7], [atL(70, 20, Hb + C.lip + 13), 3, 1, 8], [at(34, 0, 26), 3, .95, 9], [atL(Wc - 6, 2, Hb + 2), 3, .9, 10]]) fg += barnacles(u, p[0], p[1], n, s, sd);
      fg += scallop(u, ...at(28, 0, 9), 4.6, -14, '#d8c0a0') + scallop(u, ...at(Wc + 1, 32, 26), 3.6, 20, '#c8b8a8') + scallop(u, ...atL(52, 14, Hb + C.lip + 10), 3.8, -6, '#e0c8b0');
      { const c = at(48, 0, 8), g = nid('sf', u); let d = '';
        for (let i = 0; i < 10; i++) { const a = (-90 + i * 36 + 8) * Math.PI / 180, r = i % 2 ? 2.2 : 6.4; d += (i ? 'L' : 'M') + f(c[0] + Math.cos(a) * r) + ' ' + f(c[1] + Math.sin(a) * r); }
        fg += `<defs>${radGrad(g, c[0] - 2, c[1] - 2, 8, [[0, '#f0a070', 1], [.6, '#c05a38', 1], [1, '#5a2014', 1]])}</defs><path d="${d}Z" fill="url(#${g})" stroke="#3a140a" stroke-width=".45" stroke-linejoin="round"/>`; }
      for (const [x, z, n, l, sd] of [[14, 22, 3, 18, 1], [40, 26, 2, 14, 2], [Wc - 24, 24, 3, 16, 3], [Wc - 4, 30, 2, 20, 4]]) { const k = PROF.findIndex(q => q[0] >= z), p = Pl(x, PROF[k][0], PROF[k][1]); fg += weedUp(p[0], p[1] + .6, l, n, sd, '#2e6a4a'); }
      fg += weedUp(...at(-1, 4, 2), 14, 3, 6, '#2e6a4a') + weedUp(...at(Wc + 1, D - 4, 2), 18, 3, 7, '#2e6a4a'); }
    // the chains: wrapped round the chest over the lid; straining straight across the red gap
    for (const [x, sd] of [[28, 3], [64, 4]]) {
      const top = [Pl(x, 28, PROF[5][1] + .8), Pl(x, 14, PROF[2][1] + .8), Pl(x, 5, PROF[1][1] + 2), Pl(x, -.6, Hb + C.lip), Pl(x, -.6, Hb + .4)];
      const down = [Pc(x + 1, -.6, Hb - .4), Pc(x + 1, -.6, 18), Pc(x + 1.4, -.6, 2)];
      fg += K.chain(u, L, [...top, ...down], { link: 4.8, seed: sd });
      const a = Pl(x, -.6, Hb + .4), b = Pc(x + 1, -.6, Hb - .4); fg += `<path d="M${P2(a)}L${P2(b)}" stroke="#ff8a50" stroke-width="2.4" opacity=".4" stroke-linecap="round"/>`; }
    // the sand banked against the foot (it has sunk in a little), and the silt the beat has kicked up from it
    { const g = nid('sb', u), a = Pc(-6, -2, 0), b = Pc(Wc + 8, -2, 0);
      fg += `<defs>${linGrad(g, 0, a[1] - 4, 0, a[1] + 3, [[0, '#8aa08a', 1], [1, '#4a5e50', 1]])}</defs><path d="M${f(a[0])} ${f(a[1] + 2)}Q${f(a[0] + 8)} ${f(a[1] - 4.6)} ${f(a[0] + 22)} ${f(a[1] - 3)}Q${f((a[0] + b[0]) / 2)} ${f(a[1] - 1.6)} ${f(b[0] - 20)} ${f(a[1] - 3.4)}Q${f(b[0] - 6)} ${f(b[1] - 4.4)} ${f(b[0])} ${f(b[1] + 2)}Z" fill="url(#${g})"/>`
        + `<path d="M${f(a[0] + 4)} ${f(a[1] - 2.6)}Q${f(a[0] + 12)} ${f(a[1] - 4.6)} ${f(a[0] + 24)} ${f(a[1] - 3.2)}" stroke="#d8f0e0" stroke-width=".5" fill="none" opacity=".6"/>`; }
    fg += K.chain(u, L, [Pc(30, -1, 1), Pc(34, -10, 0), Pc(46, -16, 0), Pc(56, -13, 0)], { link: 4.8, seed: 7 }) + K.chain(u, L, [Pc(66, -1, 1), Pc(66, -8, 0), Pc(62, -13, 0)], { link: 4.8, seed: 8 });
    { const p = Pc(59, -15, 0), g = K.mat('iron', L, { form: 'sphere', x1: p[0], y1: p[1] + 4, r: 5, u });
      fg += K.contactShadow(u, p[0], p[1] + 8, 12, L, { ry: 2, opacity: .7 }) + `<defs>${g.defs}</defs><path d="M${f(p[0] - 3)} ${f(p[1] + 1)}V${f(p[1] - 2.6)}A3 3 0 0 1 ${f(p[0] + 3)} ${f(p[1] - 2.6)}V${f(p[1] + 1)}" stroke="#2a2e2c" stroke-width="1.4" fill="none"/>`
        + `<path d="M${f(p[0] - 4.8)} ${f(p[1] + 1)}h9.6v5.4q0 2.6 -4.8 2.6t-4.8 -2.6z" fill="${g.fill}" stroke="#0a0c0a" stroke-width=".5"/><path d="M${f(p[0])} ${f(p[1] + 3.4)}v2.4" stroke="#0a0c0a" stroke-width="1"/>`; }
    // the silt: soft clouds rolling out from the foot on both sides, lit red near the chest, cold further out
    { const sb = nid('st', u); fg += `<defs><filter id="${sb}" x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="3.2"/></filter></defs><g filter="url(#${sb})">`
        + [[30, 140, 22, 7, '#a8b49a', .5], [14, 134, 14, 6, '#98a890', .35], [168, 138, 22, 7, '#a8b49a', .5], [186, 130, 12, 6, '#98a890', .3], [52, 146, 16, 5, '#e09a7a', .4], [150, 142, 16, 5, '#e09a7a', .35], [100, 151, 40, 4, '#c8a888', .3]]
          .map(([x, y, rx, ry, c, op]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${op}"/>`).join('') + `</g>`; }
    // ——— the beat out of the slit: the red heat, a pulse ring in the water, the bubbles tearing out and rising ———
    { const c = Pl(Wc / 2, 0, Hb), rb = nid('ry', u), rg = nid('rg', u), pb = nid('pb', u);
      fg += K.localGlow(u, { x: c[0], y: c[1] + 6, color: '#ff6a3a', power: .75, radius: 36 }, { squash: .32 })
        + K.localGlow(u, { x: c[0] + 4, y: c[1] - 6, color: '#ff8a5a', power: .3, radius: 72 }, { core: false });
      // three beams out of the slit up into the water
      fg += `<defs><filter id="${rb}" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>${linGrad(rg, 0, c[1] + 4, 0, c[1] - 56, [[0, '#ffe0b8', .75], [.4, '#ff9a60', .28], [1, '#ff8a50', 0]])}</defs><g style="mix-blend-mode:screen" filter="url(#${rb})">`
        + [[-26, -36, 5, 9], [2, -2, 4, 11], [26, 36, 4, 8]].map(([dx, tx, w0, w1]) => `<path d="M${f(c[0] + dx - w0)} ${f(c[1] + 4)}L${f(c[0] + tx - w1)} ${f(c[1] - 56)}H${f(c[0] + tx + w1)}L${f(c[0] + dx + w0)} ${f(c[1] + 4)}Z" fill="url(#${rg})"/>`).join('') + `</g>`;
      // the pressure ring of the last beat, going out through the water round the slit
      fg += `<defs><filter id="${pb}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g style="mix-blend-mode:screen" filter="url(#${pb})">`
        + `<ellipse cx="${f(c[0])}" cy="${f(c[1] - 4)}" rx="66" ry="40" fill="none" stroke="#ff7a50" stroke-width="2" opacity=".28"/><ellipse cx="${f(c[0])}" cy="${f(c[1] - 4)}" rx="84" ry="52" fill="none" stroke="#ff9a70" stroke-width="1.2" opacity=".16"/></g>`;
      // the bubbles: out of the whole slit, thick at the middle, drifting right with the current as they rise and grow
      const R = rng(77); let bb = '';
      for (let i = 0; i < 64; i++) { const t = R() ** .8, sx = Pl(6 + R() * (Wc - 12), 0, Hb)[0], y = c[1] - 2 - t * (c[1] + 6), dx = t * t * 22 + Math.sin(t * 9 + i) * 2.4 * t, r = .5 + t * 2.4 + R() * (.6 + t);
        const x = sx + dx + (sx - c[0]) * -.35 * t; bb += bubble(x, y, r, Math.max(0, .8 - t * 2.2)); }
      for (let i = 0; i < 14; i++) { const p = Pl(4 + R() * (Wc - 8), 0, Hb - 1); bb += bubble(p[0] + (R() - .5) * 2, p[1] + 2 + R() * 4, .4 + R() * .6, .9); }
      fg += bb; }
    // the small fish darting away from the beat, both ways
    fg += fish(30, 54, 196, .8) + fish(18, 64, 205, .65) + fish(40, 66, 188, .7) + fish(24, 44, 210, .55, .85) + fish(52, 48, 200, .6, .9)
      + fish(164, 48, -16, .75) + fish(176, 62, -6, .6) + fish(154, 64, -22, .55, .9);
    // kelp near us at both edges, dark, framing
    fg += kelp(u, 4, 290, 230, 8, 5) + kelp(u, 196, 290, 190, -10, 11);
    // the light and the deep: the cold veil of the water, dark under the glass and in the corners
    fg += glow(u, 60, -6, 110, 34, '#e8fff4', .22);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 150, 0, 290, [[0, '#04100c', 0], [.35, '#04100c', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${gl})"/>`; }
    fg += gloom(u, 100, 110, -10, 0, .25, '#021410') + gloom(u, 100, 110, 210, 10, .25, '#021410');
    return [bg, fg];
  } };
