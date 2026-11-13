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

const VP = [-230, 62], NX = 214;             // the hull's vanishing point (far left, at eye level); the near edge (off the right)
const TOP = 20, BOT = 168;                   // the hull's top (her waterline, the surface above it) and its lower edge (the bilge), at the near edge
const BC = [108, 84], BR = [39, 37];         // the hole: its middle and radii (narrower across: the side is turned from us)
const light = { time: 'fog', haze: .5, key: { type: 'sun', x: 120, y: -70, el: 62, color: '#c8fff0', power: .75 }, fill: { color: '#1a4a44', power: .5 },
  rim: { az: 10, color: '#c8fff0', power: .35 }, locals: [{ x: BC[0], y: BC[1], color: '#9effd8', power: .3, radius: 30 }] };
const skel = { horizon: VP[1], eye: 0, light: 'the surface overhead (key, from above, a little behind); the tips\' faint glow', items: [
  ['surface', 0, 14, 200, 14, 'the ceiling of the water'], ['hull side', 0, BOT, 200, BOT - TOP, 'runs away left into the murk'],
  ['hole', BC[0] - BR[0] - 6, BC[1] + BR[1] + 6, 2 * BR[0] + 12, 2 * BR[1] + 12, 'in the planks'], ['coral, barnacles', 70, 120, 86, 82, 'growing from the rim inwards'],
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

    // ——— the hole: a jagged broken edge, splinters bent inwards, the dark hold behind ———
    const rim = []; { const Rr = rng(11); for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = .82 + Rr() * .3; rim.push([BC[0] + Math.cos(a) * BR[0] * r, BC[1] + Math.sin(a) * BR[1] * r]); } }
    let fg = '';
    { const g = nid('hl', u); fg += `<defs>${radGrad(g, BC[0] + 4, BC[1] + 4, 36, [[0, '#000403', 1], [.6, '#04100c', 1], [1, '#0e2620', 1]])}</defs><path d="M${rim.map(P2).join('L')}Z" fill="url(#${g})" stroke="#020604" stroke-width="1"/>`;
      // splinters: the broken plank ends, bent in, their torn grain lighter
      const Rs = rng(13);
      for (let i = 0; i < 26; i += 2) { const p = rim[i], dx = BC[0] - p[0], dy = BC[1] - p[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, len = 5 + Rs() * 6, w = 2 + Rs() * 2.4;
        const tip = [p[0] + ux * len + (Rs() - .5) * 3, p[1] + uy * len + (Rs() - .5) * 3];
        fg += `<path d="M${f(p[0] - uy * w)} ${f(p[1] + ux * w)}L${P2(tip)}L${f(p[0] + uy * w)} ${f(p[1] - ux * w)}Z" fill="#5a5a40" stroke="#0a0e08" stroke-width=".4"/><path d="M${P2(p)}L${P2(tip)}" stroke="#a8a07a" stroke-width=".4" opacity=".7"/>`; } }
    // ——— the growth ———
    // cracks run out from the hole along and across the planks
    { const Rk = rng(19); for (const i of [1, 6, 10, 15, 20, 24]) { const p = rim[i], dx = p[0] - BC[0], dy = p[1] - BC[1], l = Math.hypot(dx, dy), len = 8 + Rk() * 10;
        fg += `<path d="M${P2(p)}l${f(dx / l * len * .5 + (Rk() - .5) * 3)} ${f(dy / l * len * .5 + (Rk() - .5) * 3)}l${f(dx / l * len * .5 + (Rk() - .5) * 4)} ${f(dy / l * len * .5 + (Rk() - .5) * 4)}" stroke="#040a08" stroke-width=".8" fill="none"/>`; } }
    // reusable lumps: each colour a small radial ramp (object box), so a lump is lit from above whatever its size
    const LUMP = [['#f2a090', '#c85a4c', '#4a1a1a'], ['#f6c27a', '#d0843a', '#4a2a10'], ['#e0a8d0', '#a0588a', '#3a1430'], ['#f4ead2', '#c8b48e', '#4a4030'], ['#a8d8b8', '#4a8a6a', '#0e2a1e']];
    const lg = LUMP.map((c, i) => { const id = nid('lp' + i, u); fg += `<defs><radialGradient id="${id}" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="${mix(c[0], '#2a6a60', .15)}"/><stop offset=".55" stop-color="${mix(c[1], '#2a6a60', .2)}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient></defs>`; return id; });
    const lump = (x, y, r, k) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${lg[k]})" stroke="#0a120e" stroke-width=".25"/>` + (r > 1.6 ? `<circle cx="${f(x - r * .1)}" cy="${f(y - r * .1)}" r="${f(r * .22)}" fill="#1a1010" opacity=".5"/>` : '');
    // the old crust over the rim: lumps of coral, sponge and weed packed on the broken ends; barnacles, mussels, shells
    { const Rc = rng(17);
      for (let i = 0; i < 150; i++) { const k = i % rim.length, a = rim[k], b = rim[(k + 1) % rim.length], t = Rc(), p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], dx = p[0] - BC[0], dy = p[1] - BC[1], l = Math.hypot(dx, dy), out = (Rc() - .35) * 9;
        fg += lump(p[0] + dx / l * out, p[1] + dy / l * out, .8 + Rc() * 1.7, Rc() < .45 ? 0 : Rc() < .4 ? 1 : Rc() < .45 ? 2 : Rc() < .6 ? 3 : 4); }
      for (let i = 0; i < 26; i += 3) { const p = rim[i], dx = p[0] - BC[0], dy = p[1] - BC[1], l = Math.hypot(dx, dy); fg += barnacles(u, p[0] + dx / l * 6, p[1] + dy / l * 6, 4, 1.2, 60 + i); }
      for (const i of [2, 8, 13, 19, 23]) { const p = rim[i], dx = p[0] - BC[0], dy = p[1] - BC[1], l = Math.hypot(dx, dy), an = Math.atan2(dy, dx) * 180 / Math.PI;
        fg += mussel(p[0] + dx / l * 7, p[1] + dy / l * 7, 3.6, an + 90) + mussel(p[0] + dx / l * 9 + 3, p[1] + dy / l * 9 + 1, 3, an + 70); }
      for (const [i, r, a, c] of [[5, 4.2, -20, '#f0d8c0'], [11, 3.6, 30, '#e8c0a8'], [17, 4, 160, '#f4e0c8'], [21, 3.2, -60, '#d8c0b0']]) { const p = rim[i], dx = p[0] - BC[0], dy = p[1] - BC[1], l = Math.hypot(dx, dy); fg += scallop(u, p[0] + dx / l * 4, p[1] + dy / l * 4, r, a, c); } }
    // branching coral reaching in from the rim towards the middle: thick and deep-coloured at the root, thin and
    // pale at the young tips; a few of the tips glow faintly; the branches nearly meet, leaving the last slit
    { const Rb = rng(23), COL = ['#e2786a', '#e89a5a', '#c8689a', '#ec8a78']; let tips = '', n = 0;
      const seg = (p, e, r1, r2, col) => { const dx = e[0] - p[0], dy = e[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const body = `M${f(p[0] + nx * r1)} ${f(p[1] + ny * r1)}L${f(e[0] + nx * r2)} ${f(e[1] + ny * r2)}A${f(r2)} ${f(r2)} 0 0 0 ${f(e[0] - nx * r2)} ${f(e[1] - ny * r2)}L${f(p[0] - nx * r1)} ${f(p[1] - ny * r1)}A${f(r1)} ${f(r1)} 0 0 0 ${f(p[0] + nx * r1)} ${f(p[1] + ny * r1)}Z`;
        const up = ny < 0 ? 1 : -1;   // the side of the branch that faces up, to the light
        return `<path d="${body}" fill="${mix(col, '#2a0e10', .3)}" stroke="#1a0808" stroke-width=".3"/>`
          + `<path d="M${f(p[0] + up * nx * r1 * .35)} ${f(p[1] + up * ny * r1 * .35)}L${f(e[0] + up * nx * r2 * .35)} ${f(e[1] + up * ny * r2 * .35)}" stroke="${col}" stroke-width="${f((r1 + r2) * .62)}" stroke-linecap="round"/>`
          + `<path d="M${f(p[0] + up * nx * r1 * .62)} ${f(p[1] + up * ny * r1 * .62)}L${f(e[0] + up * nx * r2 * .62)} ${f(e[1] + up * ny * r2 * .62)}" stroke="${mix(col, '#fff4e8', .55)}" stroke-width="${f((r1 + r2) * .16)}" stroke-linecap="round" opacity=".8"/>`; };
      const grow = (p, ang, len, r, depth, col) => {
        const e = [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len], c = mix(mix(col, '#2a6a60', .12), '#fff0e4', depth * .2);
        fg += seg(p, e, r, r * .74, c);
        // polyps: tiny pale dots along it
        for (let j = 1; j < 3; j++) { const t = j / 3; fg += `<circle cx="${f(lerp(p[0], e[0], t) + (Rb() - .5) * r)}" cy="${f(lerp(p[1], e[1], t) + (Rb() - .5) * r)}" r="${f(r * .28)}" fill="#fff0e8" opacity=".75"/>`; }
        if (depth >= 3) { n++; tips += `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(r * .9)}" fill="#fffaf0"/>` + (n % 6 === 0 ? `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(r * 2.8)}" fill="#bfffe8" opacity=".28"/>` : ''); return; }
        const sp = .3 + Rb() * .26, a1 = ang - sp + (Rb() - .5) * .2, a2 = ang + sp * (.7 + Rb() * .5);
        grow(e, a1, len * (.68 + Rb() * .14), r * .72, depth + 1, col); if (depth < 2 || Rb() < .7) grow(e, a2, len * (.6 + Rb() * .14), r * .68, depth + 1, col); };
      for (let i = 0; i < rim.length; i++) { if (Rb() < .12) continue; const p = rim[i], dx = BC[0] - p[0], dy = BC[1] - p[1], l = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + (Rb() - .5) * .6;
        grow([p[0] - dx / l * 2, p[1] - dy / l * 2], a, l * (i % 2 ? .2 + Rb() * .08 : .27 + Rb() * .1), 1.7 + Rb() * .7, 0, COL[i % COL.length]); }
      fg += tips; }
    // the last slit in the middle: dark, with the hold's air streaming out of it, up to the surface
    { const s = [[BC[0] - 7, BC[1] + 1], [BC[0] - 2, BC[1] - 2.4], [BC[0] + 4, BC[1] - 1], [BC[0] + 8, BC[1] + 1.6], [BC[0] + 2, BC[1] + 2.6], [BC[0] - 3, BC[1] + 2]];
      fg += `<path d="M${s.map(P2).join('L')}Z" fill="#000302"/>` + K.localGlow(u, { x: BC[0], y: BC[1], color: '#9effd8', power: .35, radius: 26 }, { core: false });
      const Rq = rng(31);
      for (let i = 0; i < 34; i++) { const t = Rq() ** .7, y = BC[1] - 2 - t * (BC[1] + 4), x = BC[0] + Math.sin(t * 5 + 1) * 6 * t + (Rq() - .5) * (2 + t * 10) + t * 8, r = .5 + Rq() * (1 + t * 1.8);
        fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#d8fff4" fill-opacity=".12" stroke="#e8fff8" stroke-width=".35" opacity="${f(.5 + Rq() * .4)}"/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .3)}" fill="#ffffff" opacity=".7"/>`; } }
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
