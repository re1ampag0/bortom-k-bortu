// «Морские наросты» (Летучий голландец, РЕМОНТ: восстановите 3 Корпуса), method A: the first-round scene
// (portrait-dutch.cjs SCENES['Морские наросты']) at its best. Under water, close along the Dutchman's side: a shot
// hole in her planks is closing up by itself — a crust of coral, barnacles and mussels has grown over the broken
// plank ends, and from it branching coral reaches in from every side towards the middle, the young tips pale and
// glowing; only a last dark slit is left in the middle, and the hold's air escapes from it in a stream of bubbles
// up to the light of the surface. The ship is alive.
// Fixed against the first round: the hull was a flat wall of planks seen square-on with a grey lump in the hole —
// now the side runs away from us to the left into the murk (strakes to one vanishing point, butts and nails
// closing up with distance), lit from the surface above (light shafts, caustics); the hole has a real broken edge
// (splinters bent inwards) and the growth is seen growing: an old crust on the rim, branches reaching in, young
// tips at the gap (the brief: «видно, как они растут по краям дыры»).
// Light: the surface overhead (key, cold, from above and a little behind); the tips' own faint glow.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, shafts } = PK;
const { sp } = require('./lib/people.cjs');

const VP = [-230, 62], NX = 214;             // the hull's vanishing point (far left, at eye level); the near edge (off the right)
const TOP = 20, BOT = 168;                   // the hull's top (her waterline, the surface above it) and its lower edge (the bilge), at the near edge
const BC = [108, 84], SQ = .75;             // the hole's middle; how much narrower across it looks (the side is turned from us)
const light = { time: 'fog', haze: .5, key: { type: 'sun', x: 120, y: -70, el: 62, color: '#c8fff0', power: .75 }, fill: { color: '#1a4a44', power: .5 },
  rim: { az: 10, color: '#c8fff0', power: .35 }, locals: [{ x: BC[0], y: BC[1], color: '#9effd8', power: .3, radius: 30 }] };
const skel = { horizon: VP[1], eye: 0, light: 'the surface overhead (key, from above, a little behind); the tips\' faint glow', items: [
  ['surface', 0, 14, 200, 14, 'the ceiling of the water'], ['hull side', 0, BOT, 200, BOT - TOP, 'runs away left into the murk'],
  ['hole', BC[0] - 34, BC[1] + 46, 68, 92, 'in the planks'], ['coral, barnacles', 70, 120, 86, 82, 'growing from the rim inwards'],
  ['bubbles', 96, 76, 40, 76, 'out of the last slit, up'], ['murk', 0, 290, 200, 290 - BOT, 'under the hull'], ['fish, weed', 0, 280, 200, 140, 'water']] };

// the hull side: a point at height y0 on the near edge, carried along the strake to the abscissa x
const strY = (y0, x) => VP[1] + (y0 - VP[1]) * (x - VP[0]) / (NX - VP[0]);
const P2 = p => `${f(p[0])} ${f(p[1])}`;
// KIT-CANDIDATE: a barnacle cluster (cones with dark mouths), lit from above
function barnacles(u, x, y, n, s, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, 0, by - r, 0, by + r, [[0, '#d8dcc8', 1], [.45, '#8a947e', 1], [1, '#2a3430', 1]])}</defs>`
      + `<ellipse cx="${f(bx)}" cy="${f(by + r * .6)}" rx="${f(r * 1.2)}" ry="${f(r * .55)}" fill="#020a08" opacity=".5"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#1a2420" stroke-width=".25"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#0e1612"/>`; }
  return out;
}
// a mussel: a dark blue-black shell, a pale lip, lit on top
function mussel(x, y, r, a) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="M${f(-r)} 0Q${f(-r * .6)} ${f(-r * .62)} ${f(r * .2)} ${f(-r * .5)}Q${f(r)} ${f(-r * .3)} ${f(r)} 0Q${f(r * .4)} ${f(r * .5)} ${f(-r)} 0Z" fill="#1a2232" stroke="#05080e" stroke-width=".3"/>`
    + `<path d="M${f(-r * .8)} ${f(-r * .12)}Q${f(-r * .2)} ${f(-r * .52)} ${f(r * .6)} ${f(-r * .3)}" stroke="#7a9ab8" stroke-width=".4" fill="none" opacity=".7"/><path d="M${f(-r)} 0Q${f(r * .2)} ${f(r * .2)} ${f(r)} 0" stroke="#c8b898" stroke-width=".3" fill="none" opacity=".5"/></g>`;
}

// KIT-CANDIDATE: a scallop shell (fan with ribs), r — its radius, a — rotation, col — its colour
function scallop(u, x, y, r, a, col = '#d8c8b0') {
  const g = nid('sc', u); let ribs = '';
  for (let i = 0; i <= 8; i++) { const t = (-70 + i * 17.5) * Math.PI / 180; ribs += `<path d="M0 ${f(r * .15)}L${f(Math.sin(t) * r * .95)} ${f(-Math.cos(t) * r * .95)}" stroke="${mix(col, '#3a2a1a', .5)}" stroke-width="${f(r * .05)}" opacity=".7"/>`; }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><defs>${radGrad(g, -r * .3, -r * .6, r * 1.3, [[0, mix(col, '#ffffff', .35), 1], [.6, col, 1], [1, mix(col, '#2a1a10', .55), 1]])}</defs>`
    + `<path d="M0 ${f(r * .2)}L${f(-r * .95)} ${f(-r * .3)}Q${f(-r * .8)} ${f(-r * 1.05)} 0 ${f(-r * 1.05)}Q${f(r * .8)} ${f(-r * 1.05)} ${f(r * .95)} ${f(-r * .3)}Z" fill="url(#${g})" stroke="${mix(col, '#1a100a', .6)}" stroke-width="${f(r * .06)}"/>${ribs}`
    + `<path d="M${f(-r * .35)} ${f(r * .05)}h${f(r * .7)}l${f(-r * .1)} ${f(r * .3)}h${f(-r * .5)}z" fill="${mix(col, '#2a1a10', .3)}"/></g>`;
}

module.exports = { name: 'Морские наросты', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VP[1], eye: 2 }), R = rng(5);
    // ——— the water: bright surface overhead, deep teal below; the hull runs into the murk on the left ———
    let bg = '';
    { const g = nid('uw', u); bg += `<defs>${linGrad(g, 0, 0, 0, 290, [[0, '#a8e8d8', 1], [.06, '#4a9a88', 1], [.3, '#1c5c52', 1], [.62, '#0a2a26', 1], [1, '#020a08', 1]])}</defs><rect x="-10" y="-10" width="220" height="310" fill="url(#${g})"/>`;
      // the surface from below: a wavy bright skin, broken into cells
      // the surface from below, above her waterline: a bright silver skin broken into wave cells
      { const s = nid('sf', u); bg += `<defs>${linGrad(s, 0, 0, 0, 44, [[0, '#e8fff8', 1], [.5, '#9ad8c8', 1], [1, '#4a9a88', 1]])}</defs><rect x="-10" y="-10" width="220" height="56" fill="url(#${s})"/>`; }
      for (let i = 0; i < 46; i++) { const x = -8 + (i % 23) * 9.6 + R() * 5, y = 2 + Math.floor(i / 23) * 9 + R() * 6, w = 5 + R() * 6; bg += `<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-w * .3)} ${f(w)} 0q${f(-w / 2)} ${f(w * .22)} ${f(-w)} 0z" fill="${R() > .4 ? '#ffffff' : '#3a8a7a'}" opacity="${f(.25 + R() * .35)}"/>`; } }

    // the hull side: strakes from the near edge (off the right) to the vanishing point; a light from above on each,
    // the lap's shadow under it; darker and greener with distance
    { const ys = []; for (let y = TOP; y <= BOT + .1; y += 13.6) ys.push(y);
      const butts = [200, 171, 146, 124, 105, 88, 73, 60, 48, 37, 27, 18, 10, 3];
      for (let k = 0; k < ys.length - 1; k++) { const y0 = ys[k], y1 = ys[k + 1], g = nid('st', u), sd = rng(k + 3);
        const base = mix('#4e5a48', '#22302a', k / (ys.length - 1));
        bg += `<defs>${linGrad(g, 0, strY(y0, 150), 0, strY(y1, 150), [[0, mix(base, '#a8c8b0', .35), 1], [.18, base, 1], [.8, mix(base, '#0a1410', .35), 1], [1, '#0a1410', 1]])}</defs>`
          + `<path d="M-10 ${f(strY(y0, -10))}L${NX} ${f(y0)}L${NX} ${f(y1)}L-10 ${f(strY(y1, -10))}Z" fill="url(#${g})"/>`
          + `<path d="M-10 ${f(strY(y1, -10))}L${NX} ${f(y1)}" stroke="#040a08" stroke-width="${f(.9 + k * .03)}"/>`
          + `<path d="M-10 ${f(strY(y0, -10) + .4)}L${NX} ${f(y0 + .6)}" stroke="#bfe0cc" stroke-width=".4" opacity=".35"/>`;
        // the grain: a few long fibres along the strake
        for (let j = 0; j < 4; j++) { const t = .2 + sd() * .6, x0 = -10 + sd() * 120, x1 = x0 + 40 + sd() * 90; bg += `<path d="M${f(x0)} ${f(strY(lerp(y0, y1, t), x0))}L${f(x1)} ${f(strY(lerp(y0, y1, t), x1))}" stroke="#0e1612" stroke-width=".35" opacity=".45"/>`; }
        // the butts (staggered strake to strake) with their nails
        butts.forEach((x, i) => { if ((i + k) % 3) return; const a = strY(y0, x), b = strY(y1, x), w = .5 + (x + 20) / 220;
          bg += `<path d="M${f(x)} ${f(a)}L${f(x)} ${f(b)}" stroke="#060c0a" stroke-width="${f(w)}"/>` + [.3, .7].map(t => `<circle cx="${f(x + 1.4 * w)}" cy="${f(lerp(a, b, t))}" r="${f(.4 * w + .2)}" fill="#0a100c"/><circle cx="${f(x + 1.4 * w - .2)}" cy="${f(lerp(a, b, t) - .2)}" r="${f(.15 * w + .1)}" fill="#8aa898" opacity=".6"/>`).join(''); }); }
      // her waterline: a dark band of slime and weed where the side meets the surface, the light's edge on it
      bg += `<path d="M-10 ${f(strY(TOP, -10))}L${NX} ${TOP}L${NX} ${TOP + 3}L-10 ${f(strY(TOP + 3, -10))}Z" fill="#0e1e18" opacity=".8"/><path d="M-10 ${f(strY(TOP, -10))}L${NX} ${TOP}" stroke="#e8fff8" stroke-width=".7" opacity=".8"/>`;
      for (let i = 0; i < 26; i++) { const x = -6 + i * 8.6 + R() * 4, y = strY(TOP + 2, x), l = 4 + R() * 9; bg += `<path d="M${f(x)} ${f(y)}q${f(1 + R() * 2)} ${f(l * .5)} ${f(-.5)} ${f(l)}" stroke="#2a5a3a" stroke-width="${f(.6 + R() * .6)}" fill="none" opacity=".8"/>`; }
      // the lower edge: the bilge turns away under her; dark water below it
      bg += `<path d="M-10 ${f(strY(BOT, -10))}L${NX} ${BOT}" stroke="#a8d8c8" stroke-width=".6" opacity=".35"/>`;
      // caustics: wavering nets of light on the planks, stronger near the surface
      for (let i = 0; i < 36; i++) { const x = R() * 210, y = TOP + 2 + R() ** 1.6 * 110, w = 4 + R() * 8, op = .1 + (1 - y / 140) * .25; if (y < strY(TOP, x) + 2) continue;
        bg += `<path d="M${f(x)} ${f(y)}q${f(w * .3)} ${f(-w * .2)} ${f(w * .6)} ${f(w * .05)}t${f(w * .5)} ${f(-w * .1)}" stroke="#d8fff0" stroke-width="${f(.4 + R() * .5)}" fill="none" opacity="${f(op)}"/>`; }
      // weed and small barnacles over the old planks; weed streaming down from the bilge
      for (let i = 0; i < 18; i++) { const x = R() * 200, y = 10 + R() * 150, dx = Math.hypot(x - BC[0], y - BC[1]); if (dx < 52 || y < strY(TOP, x) + 5) continue; bg += barnacles(u, x, y, 2 + Math.floor(R() * 3), .7 + x / 300, 40 + i); }
      for (const [x, n, l, sd] of [[18, 3, 34, 1], [52, 4, 40, 2], [96, 3, 46, 3], [140, 4, 52, 4], [184, 3, 44, 5]]) { const y = strY(BOT, x); bg += PK.weed(x, y + l, l, '#2a5a3a', sd); }
      // the murk: the far part of her side fades into the water
      { const g = nid('mk', u); bg += `<defs>${linGrad(g, -10, 0, 160, 0, [[0, '#1c5248', .85], [.35, '#1c5248', .45], [1, '#1c5248', 0]])}</defs><rect x="-10" y="-10" width="220" height="${BOT + 10}" fill="url(#${g})"/>`; } }

    // ——— the hole, in the plane of her side: everything below is drawn in the side's own coordinates (a along the
    // strakes, b down, units of the picture at the hole's middle) and carried to the picture by Hp — narrower across
    // (the side is turned from us) and leaning along the strakes to their vanishing point ———
    const kC = (BC[0] - VP[0]) / (NX - VP[0]), y0C = VP[1] + (BC[1] - VP[1]) / kC;
    const Hp = (a, b) => { const x = BC[0] + a * SQ; return [x, strY(y0C + b / kC, x)]; };
    const path = (pts, closed = true) => sp(pts.map(p => Hp(p[0], p[1])), closed);
    const polar = (th, r) => [Math.cos(th * Math.PI / 180) * r, Math.sin(th * Math.PI / 180) * r];
    // the broken edge: jagged, plank by plank; the open part of the breach is low on the right (GAP: its arc of the rim)
    const RH = 38, GAP = [12, 92];
    const rim = []; { const Rr = rng(11); for (let i = 0; i < 40; i++) { const th = i * 9, r = RH * (.9 + Rr() * .16) * (i % 2 ? .96 : 1.03); rim.push(polar(th, r)); } }
    const inGap = th => th >= GAP[0] && th <= GAP[1];
    let fg = '';
    // the breach: the cut through the planks (raw torn wood, seen on its lower and left side), the black hold behind
    { const g = nid('hl', u), wd = nid('wd', u), inner = rim.map(([a, b]) => [a * .9 + 1.8, b * .9 - 1.6]);
      fg += `<defs>${linGrad(wd, 0, BC[1] - RH, 0, BC[1] + RH, [[0, '#6a5a3c', 1], [1, '#3a3020', 1]])}${radGrad(g, BC[0] + 8, BC[1] + 10, 40, [[0, '#000201', 1], [.6, '#020806', 1], [1, '#0a1c16', 1]])}</defs>`
        + `<path d="${path(rim)}" fill="url(#${wd})" stroke="#030805" stroke-width=".9"/>`
        + `<path d="${path(inner)}" fill="url(#${g})"/>`;
      // a rib of her frame dimly seen inside, across the gap
      { const r0 = Hp(22, -6), r1 = Hp(26, 40); fg += `<path d="M${P2(r0)}L${P2(r1)}" stroke="#16302a" stroke-width="5" opacity=".7"/><path d="M${f(r0[0] - 2)} ${f(r0[1])}L${f(r1[0] - 2)} ${f(r1[1])}" stroke="#3a6a5a" stroke-width=".6" opacity=".5"/>`; }
      // the strake seams cut through the raw edge
      for (let y = TOP; y <= BOT; y += 13.6) { const b = (strY(y, BC[0]) - BC[1]); if (Math.abs(b) > RH) continue; const a = Math.sqrt(RH * RH - b * b);
        for (const s of [-1, 1]) { const p = Hp(s * a * .97, b), q = Hp(s * a * .86, b); fg += `<path d="M${P2(p)}L${P2(q)}" stroke="#030805" stroke-width=".7"/>`; } } }
    // the torn plank ends at the open part: long splinters, some bent in towards the hold, the torn grain pale
    { const Rs = rng(13);
      for (let th = GAP[0] + 4; th <= GAP[1] - 2; th += 9) { const p = polar(th, RH * .93), dir = th + 180 + (Rs() - .5) * 30, len = 7 + Rs() * 8, w = 1.4 + Rs() * 1.4, bent = Rs() < .5;
        const tip = [p[0] + Math.cos(dir * Math.PI / 180) * len, p[1] + Math.sin(dir * Math.PI / 180) * len], nx = -Math.sin(dir * Math.PI / 180), ny = Math.cos(dir * Math.PI / 180);
        const pts = [[p[0] + nx * w, p[1] + ny * w], [lerp(p[0], tip[0], .6) + nx * w * .5, lerp(p[1], tip[1], .6) + ny * w * .5], tip, [p[0] - nx * w, p[1] - ny * w]].map(q => Hp(q[0], q[1]));
        fg += `<path d="M${pts.map(P2).join('L')}Z" fill="${bent ? '#4a4030' : '#8a7a56'}" stroke="#0a0e08" stroke-width=".35"/>`
          + `<path d="M${P2(Hp(p[0], p[1]))}L${P2(Hp(lerp(p[0], tip[0], .85), lerp(p[1], tip[1], .85)))}" stroke="${bent ? '#7a6a4a' : '#d8c898'}" stroke-width=".35" opacity=".8"/>`; } }
    // cracks run out from the breach along and across the planks
    { const Rk = rng(19); for (const th of [30, 140, 200, 260, 330]) { const p = polar(th, RH + 4), d = polar(th + (Rk() - .5) * 30, 1), len = 8 + Rk() * 9;
        fg += `<path d="M${P2(Hp(p[0], p[1]))}L${P2(Hp(p[0] + d[0] * len * .5 + (Rk() - .5) * 3, p[1] + d[1] * len * .5))}L${P2(Hp(p[0] + d[0] * len, p[1] + d[1] * len + (Rk() - .5) * 4))}" stroke="#040a08" stroke-width=".8" fill="none"/>`; } }
    // ——— the growth: grown in from the edges over half the breach ———
    // the crust closing it: a sheet of coral from the rim, its growth fronts in bands round the gap, its young lumpy
    // edge at the gap (lighter); the gap is what is left of the breach, low on the right
    const gapIn = [[3.6, 34], [1, 27], [3.4, 19], [9.6, 12.6], [17, 8.6], [25, 6.4], [32, 7]];
    const gapRim = []; for (let th = GAP[1] - 3; th >= GAP[0] + 3; th -= 6) gapRim.push(polar(th, RH * .92));
    { const g = nid('cs', u), Rl = rng(23);
      // the sheet runs over the rim (all but the gap's arc) and across to the gap's inner edge
      const k0 = rim.findIndex((_, i) => i * 9 > GAP[1]), pts = [];
      for (let i = 0; i < rim.length; i++) { const j = (k0 + i) % rim.length; if (!inGap(j * 9)) pts.push([rim[j][0] * .97, rim[j][1] * .97]); }
      const cover = [...pts, ...gapIn.slice().reverse()];
      fg += `<defs>${radGrad(g, BC[0] + 4, BC[1] + 6, 46, [[0, '#a85a4a', 1], [.45, '#7e4a3c', 1], [1, '#4a3428', 1]])}</defs>`
        + `<path d="${path(cover)}" fill="url(#${g})" stroke="#1a0c08" stroke-width=".5"/>`;
      // growth bands round the gap
      for (const r of [10, 18, 27, 36]) { const arc = []; for (let th = 120; th <= 330; th += 10) { const q = polar(th, r); arc.push([18 + q[0] * 1.1, 22 + q[1]]); }
        fg += `<path d="${path(arc.filter(q => Math.hypot(q[0], q[1]) < RH * .9), false)}" stroke="#3a1e18" stroke-width=".5" fill="none" opacity=".5"/>`; }
      // polyp texture: small soft bumps, a shade lighter, over the sheet
      for (let i = 0; i < 70; i++) { const th = Rl() * 360, r = Math.sqrt(Rl()) * RH * .9, q = polar(th, r);
        if (inGap(th) && r > 12) continue; if (q[0] > 2 && q[1] > 6 && Math.hypot(q[0] - 18, q[1] - 22) < 16) continue;
        const p = Hp(q[0], q[1]); fg += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(.9 * SQ)}" ry=".9" fill="#c87a62" opacity=".35"/>`; }
      // the young edge at the gap: a lip of lighter lumps
      const Rg = rng(29); for (let i = 0; i < gapIn.length - 1; i++) for (let k = 0; k < 3; k++) { const t = k / 3, q = [lerp(gapIn[i][0], gapIn[i + 1][0], t) - 1, lerp(gapIn[i][1], gapIn[i + 1][1], t) - 1], p = Hp(q[0], q[1]), r = 1.3 + Rg() * .8;
        fg += `<ellipse cx="${f(p[0] + .3)}" cy="${f(p[1] + .8)}" rx="${f(r * SQ)}" ry="${f(r * .8)}" fill="#020806" opacity=".4"/><ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r * SQ)}" ry="${f(r)}" fill="#e09478"/><ellipse cx="${f(p[0] - .3)}" cy="${f(p[1] - r * .4)}" rx="${f(r * .4 * SQ)}" ry="${f(r * .3)}" fill="#f6c8a8" opacity=".7"/>`; } }
    // the coral, lying on her side: two plates and eight branching heads from the rim, reaching in over the breach;
    // each casts a short shadow down on the planks (the light is overhead). Three colours: coral red, orange, ochre.
    const CR = { red: ['#d8604c', '#8a2a20', '#f29a84'], orange: ['#e48c48', '#94481a', '#f8c088'], ochre: ['#c8a46a', '#6a5030', '#ecd4a0'] };
    const shadowOf = d => `<path d="${d}" fill="#020806" opacity=".45" transform="translate(.8 2.2)" filter="url(#${SHB})"/>`;
    const SHB = nid('shb', u); fg += `<defs><filter id="${SHB}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`;
    // the plates: flat fans grown from the rim inwards, wavy growing edges, concentric growth lines
    for (const [th, rr, span, col] of [[218, 19, 120, 'ochre'], [286, 16, 110, 'ochre']]) {
      const root = polar(th, RH * .96), facing = th + 180, pts = [root];
      for (let k = 0; k <= 12; k++) { const a = facing - span / 2 + span * k / 12, r = rr * (1 + .07 * Math.sin(k * 2.3)); pts.push([root[0] + Math.cos(a * Math.PI / 180) * r, root[1] + Math.sin(a * Math.PI / 180) * r]); }
      const d = path(pts), c = CR[col], g = nid('pt', u), cp = Hp(root[0], root[1]);
      fg += shadowOf(d) + `<defs>${radGrad(g, cp[0], cp[1], rr, [[0, c[1], 1], [.55, c[0], 1], [1, c[2], 1]])}</defs><path d="${d}" fill="url(#${g})" stroke="#2a1a0c" stroke-width=".45"/>`;
      for (const k of [.4, .62, .82]) { const arc = []; for (let j = 1; j < 12; j++) { const a = facing - span / 2 + span * j / 12, r = rr * k * (1 + .07 * Math.sin(j * 2.3)); arc.push([root[0] + Math.cos(a * Math.PI / 180) * r, root[1] + Math.sin(a * Math.PI / 180) * r]); }
        fg += `<path d="${path(arc, false)}" stroke="${c[1]}" stroke-width=".4" fill="none" opacity=".6"/>`; }
      // its upper growing edge catches the light
      const up = pts.slice(1).filter(q => q[1] < root[1] + 2); if (up.length > 2) fg += `<path d="${path(up, false)}" stroke="${c[2]}" stroke-width=".6" fill="none" opacity=".8"/>`; }
    // the branching heads: tapered branches forking twice, the tips a lighter tint of their own colour
    { const Rb = rng(37), segs = [];
      const grow = (p, ang, len, r, depth, col) => { const e = [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len]; segs.push({ p, e, r1: r, r2: r * .72, depth, col });
        if (depth >= 2) return; const s2 = .38 + Rb() * .2;
        grow(e, ang - s2, len * (.66 + Rb() * .1), r * .72, depth + 1, col); grow(e, ang + s2 * (.8 + Rb() * .4), len * (.6 + Rb() * .12), r * .7, depth + 1, col); };
      for (const [th, aim, len, r, col] of [[200, [10, 14], 15, 2.6, 'red'], [236, [8, 6], 14, 2.5, 'orange'], [268, [12, 10], 13, 2.4, 'red'], [308, [18, 8], 11, 2.2, 'orange'],
        [345, [24, 6], 8, 2, 'red'], [150, [4, 22], 10, 2.3, 'orange'], [118, [6, 28], 8, 2.1, 'red'], [52, [16, 20], 5.5, 1.6, 'orange']]) {
        const p = polar(th, RH * .98), a = Math.atan2(aim[1] - p[1], aim[0] - p[0]); grow(p, a, len, r, 0, col); }
      const cap = s => { const dx = s.e[0] - s.p[0], dy = s.e[1] - s.p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, pts = [];
        pts.push([s.p[0] + nx * s.r1, s.p[1] + ny * s.r1], [lerp(s.p[0], s.e[0], .5) + nx * (s.r1 + s.r2) / 2, lerp(s.p[1], s.e[1], .5) + ny * (s.r1 + s.r2) / 2], [s.e[0] + nx * s.r2, s.e[1] + ny * s.r2]);
        for (let k = 1; k < 5; k++) { const t = Math.PI * k / 5; pts.push([s.e[0] + (nx * Math.cos(t) + dx / l * Math.sin(t)) * s.r2, s.e[1] + (ny * Math.cos(t) + dy / l * Math.sin(t)) * s.r2]); }
        pts.push([s.e[0] - nx * s.r2, s.e[1] - ny * s.r2], [lerp(s.p[0], s.e[0], .5) - nx * (s.r1 + s.r2) / 2, lerp(s.p[1], s.e[1], .5) - ny * (s.r1 + s.r2) / 2], [s.p[0] - nx * s.r1, s.p[1] - ny * s.r1]);
        for (let k = 1; k < 5; k++) { const t = Math.PI * k / 5; pts.push([s.p[0] + (-nx * Math.cos(t) - dx / l * Math.sin(t)) * s.r1, s.p[1] + (-ny * Math.cos(t) - dy / l * Math.sin(t)) * s.r1]); }
        return path(pts); };
      const ds = segs.map(cap);
      fg += ds.map(shadowOf).join('') + ds.map(d => `<path d="${d}" fill="none" stroke="#1a0806" stroke-width=".9"/>`).join('')
        + segs.map((s, i) => `<path d="${ds[i]}" fill="${mix(CR[s.col][0], CR[s.col][2], s.depth * .3)}"/>`).join('')
        // the shaded underside and the lit top of each branch (the light is overhead)
        + segs.map(s => { const lo = [[s.p[0], s.p[1] + s.r1 * .45], [s.e[0], s.e[1] + s.r2 * .45]].map(q => Hp(q[0], q[1])), hi = [[s.p[0], s.p[1] - s.r1 * .45], [s.e[0], s.e[1] - s.r2 * .45]].map(q => Hp(q[0], q[1]));
          return `<path d="M${P2(lo[0])}L${P2(lo[1])}" stroke="${CR[s.col][1]}" stroke-width="${f((s.r1 + s.r2) * .4)}" stroke-linecap="round" opacity=".45"/><path d="M${P2(hi[0])}L${P2(hi[1])}" stroke="${CR[s.col][2]}" stroke-width="${f((s.r1 + s.r2) * .22)}" stroke-linecap="round" opacity=".8"/>`; }).join(''); }
    // the old crust on the rim: a few big lumps, barnacles, mussels, a scallop — fewer and bigger
    const LUMP = [CR.red, CR.ochre, ['#7aa888', '#2a4a3a', '#b8dcc0']];
    const lg = LUMP.map((c, i) => { const id = nid('lp' + i, u); fg += `<defs><radialGradient id="${id}" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="${c[2]}"/><stop offset=".55" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></radialGradient></defs>`; return id; });
    { const Rc = rng(17);
      for (let i = 0; i < 22; i++) { const th = i * 16.4 + Rc() * 8; if (inGap(th) && Rc() < .6) continue; const q = polar(th, RH + 1 + Rc() * 4), p = Hp(q[0], q[1]), r = 2.2 + Rc() * 1.8;
        fg += `<ellipse cx="${f(p[0] + .5)}" cy="${f(p[1] + 1.6)}" rx="${f(r * SQ * 1.1)}" ry="${f(r * .8)}" fill="#020806" opacity=".4"/><ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r * SQ)}" ry="${f(r)}" fill="url(#${lg[i % 3]})" stroke="#0a120e" stroke-width=".3"/>`; }
      for (const th of [20, 75, 165, 250, 320]) { const q = polar(th, RH + 6), p = Hp(q[0], q[1]); fg += barnacles(u, p[0], p[1], 4, 1.3, 60 + th); }
      for (const th of [100, 190, 300]) { const q = polar(th, RH + 5), p = Hp(q[0], q[1]); fg += mussel(p[0], p[1], 3.8, th + 90) + mussel(p[0] + 3, p[1] + 1.2, 3.2, th + 70); }
      for (const [th, r, a, c] of [[60, 4.4, -20, '#f0d8c0'], [228, 4, 160, '#f4e0c8']]) { const q = polar(th, RH + 3), p = Hp(q[0], q[1]); fg += scallop(u, p[0], p[1], r, a, c); } }
    // the air of the hold: a short stream of bubbles out of the gap, gone before it reaches the cost mark
    { const Rq = rng(31), s0 = Hp(18, 20);
      for (let i = 0; i < 11; i++) { const t = i / 10, y = s0[1] - 4 - t * (s0[1] - 52), x = s0[0] + Math.sin(t * 5 + 1) * 3 * t + (Rq() - .5) * 3 + t * 4, r = .6 + Rq() * (.8 + t * 1.2);
        fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#d8fff4" fill-opacity=".12" stroke="#e8fff8" stroke-width=".35" opacity="${f(.75 - t * .35)}"/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .3)}" fill="#ffffff" opacity=".7"/>`; } }
    // ——— the life round her: a small school far off in the murk, one fish near, weed ———
    { const Rf = rng(41); for (let i = 0; i < 9; i++) fg += `<g opacity=".55">${PK.fish(14 + Rf() * 40, 120 + Rf() * 30, .55 + Rf() * .2, 1, '#5a8a84')}</g>`; }
    fg += PK.fish(174, 132, 1.4, -1, '#8ab8b0') + PK.weed(10, 290, 60, '#1e4a34', 7) + PK.weed(192, 290, 54, '#1e4a34', 9, -1);
    // ——— the light: the shafts' veil, motes in the water, the under-glass dark ———
    fg += shafts(u, 130, -20, [[40, 290, 66, 290], [150, 290, 176, 290], [196, 280, 220, 280]], '#c8fff0', .07);
    fg += glow(u, 130, 10, 120, 40, '#e8fff8', .2) + motes(40, 0, 10, 200, 260, '#c8fff0', 6);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 140, 0, 290, [[0, '#020806', 0], [.4, '#020806', .45], [1, '#010403', .85]])}</defs><rect x="-10" y="140" width="220" height="150" fill="url(#${gl})"/>`; }
    fg += gloom(u, 100, 100, -40, 100, .25, '#020806');
    return [bg, fg];
  } };
