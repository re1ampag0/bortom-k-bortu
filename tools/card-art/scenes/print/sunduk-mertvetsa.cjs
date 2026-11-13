// «Сундук мертвеца» (Летучий голландец, ПРИКАЗ: возьмите 2 карты), method A: the first-round scene
// (portrait-dutch.cjs SCENES['Сундук мертвеца']) at its best. A heavy iron-bound chest, grown over with barnacles,
// shells and weed, washed up on the beach at dusk in the green fog; it is wrapped in two chains, and still its lid
// has lifted a hand's breadth: out of the slit comes a warm red light that beats — the chains strain across the gap,
// the beat goes out in red rings over the sand. A palm island far behind in the fog, a rusty key in the sand.
// Fixed against the first round: the chest was a flat front with a drawn-on red line — now a box in 3/4 with an
// arched lid really lifted on its back hinges (the gap glows into the inside and down the side wedge); the red light
// is a light (on the lid's edge, the chains, the sand, the fog), not a stroke; the shells and barnacles grow on it
// (the brief), the chains wrap it; the day haze is now the deck's dusk and green fog; the stray coins are gone.
// Light: a low moon in the fog from the left (key, cold); the red beat inside the chest (local, warm).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom, motes } = PK;

const HZ = 70, SHORE = 96;                       // the horizon; the foam line on the beach
const TC = 'translate(4 -3) scale(.96)';         // the chest, its pool and rings: a little smaller and higher (clear of the glass)
const C = { x0: 38, y0: 146, W: 100, D: 60, Hb: 40, kx: .42, ky: .27, lip: 6, rho: 15, th: 13 };  // the chest (own units)
const light = { time: 'fog', haze: .7, key: { type: 'moon', az: 240, el: 34, color: '#cfeee0', power: .7 }, fill: { color: '#2f5a50', power: .5 },
  rim: { az: 300, color: '#d8fff0', power: .3 }, locals: [{ x: 92, y: 98, h: 2, color: '#ff6a3a', power: .85, radius: 70 }] };
const skel = { horizon: HZ, eye: .9, light: 'a low moon in the fog from the left (key); the red beat in the chest (local)', items: [
  ['island, palms', 128, HZ, 72, 30, 'sea, far, in the fog'], ['sea, foam', 0, SHORE, 200, SHORE - HZ, 'beach'],
  ['chest', C.x0, C.y0, 126, 92, 'sand (contact shadow)'], ['red gap', 40, 104, 124, 22, 'between the body and the lifted lid'],
  ['chains', 50, 160, 100, 100, 'round the chest, slack on the sand in front'], ['rings', 10, 150, 180, 80, 'over the sand round the chest'],
  ['key', 12, 162, 26, 10, 'sand']] };

// the chest's own projection (oblique 3/4 like K.chest): x across, z away from us, h up
const Pc = (x, z, h) => [C.x0 + x + z * C.kx, C.y0 - h - z * C.ky];
const P2 = p => `${f(p[0])} ${f(p[1])}`;
const LT = 3;                                  // the lid board's front edge, seen under its lip
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const TH = C.th * Math.PI / 180;
// a point of the lid in its own (z, h) — rotated about the back hinge (z = D, h = Hb) by the lift
const lidZH = (z, h) => { const dz = z - C.D, dh = h - C.Hb; return [C.D + dz * Math.cos(TH) + dh * Math.sin(TH), C.Hb + dh * Math.cos(TH) - dz * Math.sin(TH)]; };
const lidN = (nd, nh) => [nd * Math.cos(TH) + nh * Math.sin(TH), nh * Math.cos(TH) - nd * Math.sin(TH)];
const Pl = (x, z, h) => { const q = lidZH(z, h); return Pc(x, q[0], q[1]); };
// the lid's profile (z, h): the front lip, the arch, down to the back edge
const PROF = (() => { const out = [[0, C.Hb], [0, C.Hb + C.lip]]; for (let i = 1; i <= 8; i++) { const z = C.D * i / 8; out.push([z, C.Hb + C.lip + C.rho * Math.sin(Math.PI * z / C.D) ** .8]); } out.push([C.D, C.Hb]); return out; })();

// KIT-CANDIDATE: a barnacle cluster (cones with dark mouths), lit from the left
function barnacles(u, x, y, n, s, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, bx - r, 0, bx + r, 0, [[0, '#c8ccb4', 1], [.55, '#8a907a', 1], [1, '#363c30', 1]])}</defs>`
      + `<ellipse cx="${f(bx + r * .4)}" cy="${f(by + r * .5)}" rx="${f(r * 1.2)}" ry="${f(r * .6)}" fill="#050c0a" opacity=".45"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#2a2c22" stroke-width=".25"/>`
      + `<path d="M${f(bx - r * .7)} ${f(by + r * .1)}L${f(bx - r * .3)} ${f(by - r * .6)}" stroke="#eef0de" stroke-width=".25" opacity=".6"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#1a1c14"/>`; }
  return out;
}
// KIT-CANDIDATE: a scallop shell (fan with ribs), r — its radius, a — rotation, col — its colour
function scallop(u, x, y, r, a, col = '#d8c8b0') {
  const g = nid('sc', u); let ribs = '';
  for (let i = 0; i <= 8; i++) { const t = (-70 + i * 17.5) * Math.PI / 180; ribs += `<path d="M0 ${f(r * .15)}L${f(Math.sin(t) * r * .95)} ${f(-Math.cos(t) * r * .95)}" stroke="${mix(col, '#3a2a1a', .5)}" stroke-width="${f(r * .05)}" opacity=".7"/>`; }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><defs>${radGrad(g, -r * .3, -r * .6, r * 1.3, [[0, mix(col, '#ffffff', .35), 1], [.6, col, 1], [1, mix(col, '#2a1a10', .55), 1]])}</defs>`
    + `<ellipse cx="${f(r * .1)}" cy="${f(r * .25)}" rx="${f(r * 1.05)}" ry="${f(r * .5)}" fill="#050a08" opacity=".4"/>`
    + `<path d="M0 ${f(r * .2)}L${f(-r * .95)} ${f(-r * .3)}Q${f(-r * .8)} ${f(-r * 1.05)} 0 ${f(-r * 1.05)}Q${f(r * .8)} ${f(-r * 1.05)} ${f(r * .95)} ${f(-r * .3)}Z" fill="url(#${g})" stroke="${mix(col, '#1a100a', .6)}" stroke-width="${f(r * .06)}"/>${ribs}`
    + `<path d="M${f(-r * .35)} ${f(r * .05)}h${f(r * .7)}l${f(-r * .1)} ${f(r * .3)}h${f(-r * .5)}z" fill="${mix(col, '#2a1a10', .3)}"/></g>`;
}
// KIT-CANDIDATE: a hank of weed hanging from (x, y): long thin strands, swaying
function weed(x, y, len, n, seed, col = '#3e7a5a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 5, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.7 + R() * .8)}" fill="none" stroke-linecap="round" opacity=".9"/>`
      + `<path d="M${f(x0 - .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#9ad8b0" stroke-width=".25" fill="none" opacity=".45"/>`; }
  return out;
}
// a palm in silhouette (far, in the fog): a leaning trunk and drooping fronds
function palm(x, y, h, lean, col) {
  const tx = x + lean, ty = y - h; let o = `<path d="M${f(x - 1.2)} ${f(y)}Q${f(x + lean * .2)} ${f(y - h * .6)} ${f(tx)} ${f(ty)}L${f(tx + 1)} ${f(ty + .6)}Q${f(x + lean * .25 + 1.4)} ${f(y - h * .6)} ${f(x + 1.2)} ${f(y)}Z" fill="${col}"/>`;
  for (const [a, l] of [[-160, 1], [-130, .8], [-100, .55], [-60, .7], [-25, 1], [10, .85], [170, .75]]) { const r = a * Math.PI / 180, L = h * .5 * l, ex = tx + Math.cos(r) * L, ey = ty + Math.sin(r) * L * .5 + L * .35;
    o += `<path d="M${f(tx)} ${f(ty)}Q${f(tx + Math.cos(r) * L * .6)} ${f(ty + Math.sin(r) * L * .6 - 2)} ${f(ex)} ${f(ey)}Q${f(tx + Math.cos(r) * L * .5)} ${f(ty + Math.sin(r) * L * .5 + 1.4)} ${f(tx)} ${f(ty + .8)}Z" fill="${col}"/>`; }
  return o;
}

module.exports = { name: 'Сундук мертвеца', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .9 }), Wc0 = C.W, D0 = C.D;
    // ——— the sky: dusk in the green fog, the moon a pale blur low on the left ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 8, seed: 11 }) + glow(u, 62, 40, 70, 44, '#e8fff0', .45) + `<circle cx="62" cy="40" r="6" fill="#f0fff4" opacity=".5"/>`;
    for (const [x, y, w, h, sd, fr] of [[150, 26, 70, 9, 4, .3], [60, 52, 64, 7, 9, .5], [176, 58, 50, 6, 13, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: SHORE + 2, swell: .3, seed: 7, glitter: 30 });
    // the island: a low hump with two palms, half gone in the fog
    bg += K.fog(u, L, { y: HZ - 22, h: 34, density: .6, seed: 3 });
    { const col = '#3e5a52', g = nid('iv', u); bg += `<path d="M112 ${HZ + 1}Q128 ${HZ - 8} 148 ${HZ - 10}Q166 ${HZ - 14} 180 ${HZ - 7}Q192 ${HZ - 3} 200 ${HZ + 1}Z" fill="${col}"/>`
      + `<path d="M126 ${HZ - 4}Q150 ${HZ - 9} 176 ${HZ - 5}" stroke="#7a9a8a" stroke-width=".6" fill="none" opacity=".6"/>`
      + palm(150, HZ - 9, 22, -6, col) + palm(165, HZ - 12, 17, 5, col)
      + `<defs>${linGrad(g, 0, HZ - 8, 0, HZ + 2, [[0, '#9fd0bc', 0], [1, '#9fd0bc', .55]])}</defs><rect x="108" y="${HZ - 8}" width="94" height="10" fill="url(#${g})"/><path d="M110 ${HZ + 1}H200" stroke="#bfe8d8" stroke-width=".5" opacity=".5"/>`; }
    // the beach: wet sand at the foam line (a sheen of the fog), dry sand towards us
    { const g = nid('sd', u), w = nid('ws', u), R = rng(21);
      bg += `<defs>${linGrad(g, 0, SHORE, 0, 290, [[0, '#7c8a74', 1], [.18, '#646852', 1], [.5, '#454334', 1], [1, '#1e1e16', 1]])}${linGrad(w, 0, SHORE, 0, SHORE + 12, [[0, '#9ab8a8', .7], [1, '#9ab8a8', 0]])}</defs>`
        + `<rect y="${SHORE}" width="200" height="${290 - SHORE}" fill="url(#${g})"/><rect y="${SHORE}" width="200" height="12" fill="url(#${w})"/>`;
      for (let i = 0; i < 40; i++) { const x = R() * 210 - 5, y = SHORE + 6 + R() ** 1.3 * 190, wd = 3 + (y - SHORE) * .07 + R() * 5;
        bg += `<path d="M${f(x)} ${f(y)}q${f(wd / 2)} ${f(-.6 - wd * .05)} ${f(wd)} 0" stroke="#0c0c08" stroke-width="${f(.3 + (y - SHORE) * .003)}" fill="none" opacity=".25"/><path d="M${f(x)} ${f(y - .6)}q${f(wd / 2)} ${f(-.6 - wd * .05)} ${f(wd)} 0" stroke="#c8d8c0" stroke-width=".3" fill="none" opacity=".22"/>`; }
      for (let i = 0; i < 80; i++) bg += `<circle cx="${f(R() * 200)}" cy="${f(SHORE + 4 + R() * 190)}" r="${f(.2 + R() * .45)}" fill="${R() > .5 ? '#d8e4cc' : '#16160e'}" opacity="${f(.2 + R() * .35)}"/>`; }
    bg += K.foam(u, { x: 100, y: SHORE, w: 220, h: 2.2, seed: 5, L }) + K.foam(u, { x: 60, y: SHORE - 6, w: 70, h: 1.2, seed: 8, L });
    bg += K.fog(u, L, { y: SHORE - 4, h: 24, density: .35, seed: 6 });
    // the beat: red rings out over the sand round the chest (behind it, so the chest covers their middle), and the
    // red pool of its light on the sand in front
    bg += `<g transform="${TC}">`;
    // the tide pool round the chest: a sheet of still water over the sand, the moon's sheen on it, cold ripple lines
    { const g = nid('pl', u), R = rng(41);
      bg += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="100" cy="142" r="104" gradientTransform="translate(100 142) scale(1 .27) translate(-100 -142)"><stop offset="0" stop-color="#4e6a62" stop-opacity=".95"/><stop offset=".55" stop-color="#5a7a70" stop-opacity=".85"/><stop offset=".85" stop-color="#7a9a8c" stop-opacity=".45"/><stop offset="1" stop-color="#7a9a8c" stop-opacity="0"/></radialGradient></defs>`
        + `<ellipse cx="100" cy="142" rx="104" ry="28" fill="url(#${g})"/>`;
      for (let i = 0; i < 22; i++) { const y = 122 + R() * 42, x = 10 + R() * 180, w = 6 + R() * 14; if (((x - 100) / 100) ** 2 + ((y - 142) / 26) ** 2 > .9) continue;
        bg += `<path d="M${f(x)} ${f(y)}h${f(w)}" stroke="#cfeee0" stroke-width=".35" opacity="${f(.2 + R() * .25)}"/>`; }
      // cold ripples going out from the chest
      for (const [r, op] of [[66, .45], [78, .3], [92, .18]]) bg += `<ellipse cx="100" cy="140" rx="${r}" ry="${f(r * .3)}" fill="none" stroke="#d8fff0" stroke-width=".5" opacity="${op}"/>`; }
    { const bl = nid('rb', u), cx = 100, cy = 136;
      bg += K.localGlow(u, { x: cx - 4, y: cy + 10, color: '#ff5a32', power: .55, radius: 86 }, { squash: .32, core: false })
        + `<defs><filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1"/></filter></defs><g style="mix-blend-mode:screen">`;
      [[74, .55], [82, .42], [104, .3], [113, .2]].forEach(([r, op], i) => { bg += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r * .34)}" fill="none" stroke="#ff6a40" stroke-width="${f(2.6 - i * .4)}" opacity="${f(op * .55)}" filter="url(#${bl})"/>`
        + `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r * .34)}" fill="none" stroke="#ffd0a8" stroke-width=".45" opacity="${f(op * .8)}" stroke-dasharray="${f(r * .4)} ${f(r * .1)}"/>`; });
      bg += '</g>'; }
    bg += '</g>';

    // ——— the chest ———
    let fg = `<g transform="${TC}">` + K.castShadow(u, L, { x: 100, y: C.y0 - 6, w: 120, h: 56, horizon: HZ, d: .5, opacity: .45 }) + K.contactShadow(u, 100, C.y0 - 3, 136, L, { ry: 5, opacity: .7 });
    // the reflection in the pool: the body's foot upside down, short, broken by ripples; a red glimmer of the gap
    { const g = nid('rf', u), cut = nid('rc', u), m = (x, z, h) => Pc(x, z, -h);
      fg += `<defs>${linGrad(g, 0, C.y0, 0, C.y0 + 14, [[0, '#2a2014', .75], [1, '#2a2014', 0]])}</defs>`
        + `<path d="${poly([m(0, 0, 0), m(Wc0, 0, 0), m(Wc0, D0, 0), m(Wc0, D0, 16), m(Wc0, 0, 16), m(0, 0, 16)])}" fill="url(#${g})"/>`;
      const R = rng(52);
      for (let i = 0; i < 9; i++) { const y = C.y0 + 1.5 + i * 1.6, x0 = C.x0 - 2 + R() * 8, x1 = C.x0 + Wc0 + 14 - R() * 10; fg += `<path d="M${f(x0)} ${f(y)}H${f(x1)}" stroke="#5a7a70" stroke-width=".55" opacity=".7"/>`; }
      for (const [x, y, w, op] of [[78, C.y0 + 3, 22, .55], [84, C.y0 + 6.5, 14, .4], [74, C.y0 + 9.5, 10, .3], [104, C.y0 + 5, 8, .3]]) fg += `<path d="M${x} ${f(y)}h${w}" stroke="#ff7a48" stroke-width="1" stroke-linecap="round" opacity="${op}"/>`; }
    const Wc = C.W, D = C.D, Hb = C.Hb;
    // the body: the right end, then the front (planks of oak)
    fg += K.shadeBox(u, [{ pts: [Pc(Wc, 0, 0), Pc(Wc, D, 0), Pc(Wc, D, Hb), Pc(Wc, 0, Hb)], n: 'right', grain: [C.kx, -C.ky] },
      { pts: [Pc(0, 0, 0), Pc(Wc, 0, 0), Pc(Wc, 0, Hb), Pc(0, 0, Hb)], n: 'front', grain: [1, 0] }], L, 'oak', { seed: 7, outline: .5 });
    for (const h of [13.5, 27]) fg += `<path d="M${P2(Pc(0, 0, h))}L${P2(Pc(Wc, 0, h))}L${P2(Pc(Wc, D, h))}" stroke="#140a04" stroke-width=".6" fill="none" opacity=".7"/><path d="M${P2(Pc(0, 0, h - .6))}L${P2(Pc(Wc, 0, h - .6))}" stroke="#d8c8a0" stroke-width=".3" opacity=".25"/>`;
    // the waterline: the foot of the body stands in the pool — under the line it is darker and greener, a cold light edge on it
    { const WL = 3.2;
      fg += `<path d="${poly([Pc(0, 0, 0), Pc(Wc, 0, 0), Pc(Wc, D, 0), Pc(Wc, D, WL), Pc(Wc, 0, WL), Pc(0, 0, WL)])}" fill="#14302a" opacity=".62"/>`
        + `<path d="M${P2(Pc(-.6, 0, WL))}Q${P2(Pc(Wc * .3, 0, WL + .5))} ${P2(Pc(Wc * .5, 0, WL))}T${P2(Pc(Wc, 0, WL))}L${P2(Pc(Wc, D * .5, WL + .3))}L${P2(Pc(Wc, D, WL))}" stroke="#d8fff0" stroke-width=".7" fill="none" opacity=".75"/>`; }
    // the inside through the gap: the far wall lit red by what beats in there, hottest left of the middle
    { const g = nid('in', u), hot = Pc(Wc / 2, 4, Hb + 3), hx = f(hot[0]), hy = f(hot[1]);
      fg += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${hx}" cy="${hy}" r="54" gradientTransform="translate(${hx} ${hy}) scale(1 .42) translate(-${hx} -${hy})">`
        + [[0, '#ffffff'], [.1, '#fff2c8'], [.22, '#ffc070'], [.4, '#f0602a'], [.62, '#b0200e'], [.82, '#5a0a06'], [1, '#2a0403']].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + `</radialGradient></defs>`
        + `<path d="${poly([Pc(0, 0, Hb), Pc(Wc, 0, Hb), Pc(Wc, D, Hb), Pl(Wc, 0, Hb), Pl(0, 0, Hb)])}" fill="url(#${g})"/>`
        // the rim boards' top edges catch it
        + `<path d="M${P2(Pc(0, 0, Hb))}L${P2(Pc(Wc, 0, Hb))}L${P2(Pc(Wc, D, Hb))}" stroke="#ffc890" stroke-width="1.1" fill="none" opacity=".9"/>`
        + `<path d="M${P2(Pc(1.6, 1.6, Hb))}L${P2(Pc(Wc - 1.6, 1.6, Hb))}" stroke="#5a1006" stroke-width="1.2" opacity=".6"/>`; }
    // the lid: its right end (the arch's profile), the front lip and the arch in strips, all lifted on the back hinges
    { const faces = [{ pts: PROF.map(([z, h]) => Pl(Wc, z, h)), n: 'right', grain: [C.kx, -C.ky] }];
      for (let i = PROF.length - 2; i >= 1; i--) { const [z0, h0] = PROF[i], [z1, h1] = PROF[i + 1]; if (i === PROF.length - 2) continue;
        const td = z1 - z0, tv = h1 - h0, l = Math.hypot(td, tv), n = lidN(-tv / l, td / l);
        faces.push({ pts: [Pl(0, z0, h0), Pl(Wc, z0, h0), Pl(Wc, z1, h1), Pl(0, z1, h1)], n: [0, n[1], -n[0]], grain: [1, 0] }); }
      const nf = lidN(-1, 0); faces.push({ pts: [Pl(0, 0, Hb), Pl(Wc, 0, Hb), Pl(Wc, 0, Hb + C.lip), Pl(0, 0, Hb + C.lip)], n: [0, nf[1], -nf[0]], grain: [1, 0] });
      fg += K.shadeBox(u, faces, L, 'oak', { seed: 9, outline: .5 });
      // the board's own thickness: its front edge under the lip, then its shadow on the top of the glowing slit
      { const sh = nid('ls', u), bd = nid('lb', u), b0 = Pl(0, 0, Hb), b1 = Pl(0, 0, Hb - LT);
        fg += `<defs><filter id="${sh}" x="-5%" y="-100%" width="110%" height="300%"><feGaussianBlur stdDeviation="1.1"/></filter>${linGrad(bd, 0, b0[1], 0, b1[1], [[0, '#b08452', 1], [.3, '#6a4220', 1], [.7, '#2a1408', 1], [1, '#140802', 1]])}</defs>`
          + `<path d="M${P2(Pl(.5, 0, Hb - LT))}L${P2(Pl(Wc, 0, Hb - LT))}L${P2(Pl(Wc, D, Hb - LT))}L${P2(Pl(Wc, D, Hb - LT - 2.6))}L${P2(Pl(Wc, 0, Hb - LT - 2.6))}L${P2(Pl(.5, 0, Hb - LT - 2.6))}Z" fill="#1a0402" opacity=".55" filter="url(#${sh})"/>`
          + `<path d="${poly([Pl(0, 0, Hb), Pl(Wc, 0, Hb), Pl(Wc, D, Hb), Pl(Wc, D, Hb - LT), Pl(Wc, 0, Hb - LT), Pl(0, 0, Hb - LT)])}" fill="url(#${bd})" stroke="#0e0602" stroke-width=".45"/>`
          + `<path d="M${P2(Pl(.3, 0, Hb - .25))}L${P2(Pl(Wc, 0, Hb - .25))}L${P2(Pl(Wc, D, Hb - .25))}" stroke="#f0d4a4" stroke-width=".6" fill="none" opacity=".85"/>`
          // its lower edge catches the red from below
          + `<path d="M${P2(Pl(0, 0, Hb - LT))}L${P2(Pl(Wc, 0, Hb - LT))}L${P2(Pl(Wc, D, Hb - LT))}" stroke="#ff7a48" stroke-width=".7" fill="none" opacity=".75"/>`; } }
    // the iron: corner angles on the body, three straps up the front and over the arch, rivets
    { const strap = (x, w) => { let o = K.shadeBox(u, [{ pts: [Pc(x - w, 0, 0), Pc(x + w, 0, 0), Pc(x + w, 0, Hb - .2), Pc(x - w, 0, Hb - .2)], n: 'front' }], L, 'iron', { outline: .35 });
        const faces = [];
        for (let i = PROF.length - 2; i >= 1; i--) { const [z0, h0] = PROF[i], [z1, h1] = PROF[i + 1]; if (i === PROF.length - 2) continue; const td = z1 - z0, tv = h1 - h0, l = Math.hypot(td, tv), n = lidN(-tv / l, td / l);
          faces.push({ pts: [Pl(x - w, z0, h0 + .4), Pl(x + w, z0, h0 + .4), Pl(x + w, z1, h1 + .4), Pl(x - w, z1, h1 + .4)], n: [0, n[1], -n[0]] }); }
        const nf = lidN(-1, 0); faces.push({ pts: [Pl(x - w, -.4, Hb - LT), Pl(x + w, -.4, Hb - LT), Pl(x + w, -.4, Hb + C.lip + .4), Pl(x - w, -.4, Hb + C.lip + .4)], n: [0, nf[1], -nf[0]] });
        o += K.shadeBox(u, faces, L, 'iron', { outline: .35 });
        for (const h of [5, 18, 31]) { const p = Pc(x, 0, h); o += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".9" fill="#2a2e2c"/><circle cx="${f(p[0] - .3)}" cy="${f(p[1] - .3)}" r=".35" fill="#c8d4d0" opacity=".8"/>`; }
        for (const z of [8, 26, 44]) { const k = PROF.findIndex(q => q[0] >= z), q = PROF[k], p = Pl(x, q[0], q[1] + .6); o += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".9" fill="#2a2e2c"/><circle cx="${f(p[0] - .3)}" cy="${f(p[1] - .3)}" r=".35" fill="#c8d4d0" opacity=".8"/>`; }
        return o; };
      fg += strap(10, 3.2) + strap(Wc - 10, 3.2);
      for (const [x, h, dx, dh] of [[0, 0, 8, 8], [Wc, 0, -8, 8]]) fg += K.shadeBox(u, [{ pts: [Pc(x, 0, h), Pc(x + dx, 0, h), Pc(x, 0, h + dh)], n: 'front' }], L, 'iron', { outline: .35 });
      fg += K.shadeBox(u, [{ pts: [Pc(Wc, 0, 0), Pc(Wc, 10, 0), Pc(Wc, 0, 10)], n: 'right' }], L, 'iron', { outline: .35 });
      // the end handle: a drop ring on the right end
      { const a = Pc(Wc, 22, 25), b = Pc(Wc, 38, 25), m = Pc(Wc, 30, 17); fg += K.propTube(u, L, 'iron', `M${P2(a)}Q${P2(m)} ${P2(b)}`, 1, m); }
      // the hasp: torn half-open, a brass lock plate on the front, its staple bent
      { const lk = K.mat('brass', L, { form: 'plane', x1: Pc(Wc / 2 - 7, 0, 0)[0], y1: Pc(0, 0, Hb - 2)[1], x2: Pc(Wc / 2 + 7, 0, 0)[0], y2: Pc(0, 0, Hb - 18)[1], n: 'front', u });
        const a = Pc(Wc / 2 - 6, 0, Hb - 2), b = Pc(Wc / 2 + 6, 0, Hb - 18);
        fg += `<defs>${lk.defs}</defs><path d="M${f(a[0])} ${f(a[1])}H${f(b[0])}V${f(b[1] - 4)}Q${f((a[0] + b[0]) / 2)} ${f(b[1] + 3)} ${f(a[0])} ${f(b[1] - 4)}Z" fill="${lk.fill}" stroke="${lk.ramp.outline}" stroke-width=".5"/>`
          + `<circle cx="${f((a[0] + b[0]) / 2)}" cy="${f(a[1] + 6)}" r="1.6" fill="#1a0e04"/><path d="M${f((a[0] + b[0]) / 2 - .9)} ${f(a[1] + 7)}h1.8l.5 4h-2.8z" fill="#1a0e04"/>`
          + `<path d="M${f(a[0] + 1)} ${f(a[1] + 1.2)}H${f(b[0] - 1)}" stroke="${lk.ramp.spec}" stroke-width=".4" opacity=".7"/>`; } }
    // the growth: barnacles in clusters at the foot and on the lid, scallops, a starfish, weed hanging from the lid edge
    { const at = (x, z, h) => Pc(x, z, h), atL = (x, z, h) => Pl(x, z, h);
      for (const [p, n, s, sd] of [[at(4, 0, 4), 6, 1.6, 1], [at(20, 0, 2), 4, 1.3, 2], [at(Wc - 4, 0, 5), 5, 1.5, 3], [at(Wc, 26, 6), 6, 1.4, 4], [at(Wc, 48, 14), 3, 1.1, 5],
        [at(70, 0, 3), 3, 1.1, 6], [atL(30, 10, Hb + C.lip + 8), 4, 1.2, 7], [atL(78, 20, Hb + C.lip + 14), 3, 1, 8], [at(36, 0, 30), 3, 1, 9]]) fg += barnacles(u, p[0], p[1], n, s, sd);
      fg += scallop(u, ...at(30, 0, 10), 5, -14, '#d8c0a0') + scallop(u, ...at(Wc + 1, 36, 30), 4, 20, '#c8b8a8') + scallop(u, ...atL(56, 14, Hb + C.lip + 11), 4.2, -6, '#e0c8b0')
        + scallop(u, ...at(Wc - 22, 0, 22), 3.4, 12, '#b8a890');
      // a starfish on the front, low on the left
      { const c = at(52, 0, 9), g = nid('sf', u); let d = '';
        for (let i = 0; i < 10; i++) { const a = (-90 + i * 36 + 8) * Math.PI / 180, r = i % 2 ? 2.4 : 7; d += (i ? 'L' : 'M') + f(c[0] + Math.cos(a) * r) + ' ' + f(c[1] + Math.sin(a) * r); }
        fg += `<defs>${radGrad(g, c[0] - 2, c[1] - 2, 8, [[0, '#f0a070', 1], [.6, '#c05a38', 1], [1, '#5a2014', 1]])}</defs><path d="${d}Z" fill="url(#${g})" stroke="#3a140a" stroke-width=".45" stroke-linejoin="round"/>`
          + Array.from({ length: 5 }, (_, i) => { const a = (-90 + i * 72 + 8) * Math.PI / 180; return `<path d="M${f(c[0])} ${f(c[1])}L${f(c[0] + Math.cos(a) * 5.6)} ${f(c[1] + Math.sin(a) * 5.6)}" stroke="#ffd0a0" stroke-width=".5" stroke-dasharray=".5 .7" opacity=".7"/>`; }).join(''); }
      for (const [x, n, l, sd] of [[18, 3, 20, 1], [44, 2, 14, 2], [Wc - 30, 3, 18, 3], [Wc - 2, 2, 22, 4]]) { const p = Pl(x, 0, Hb - LT); fg += weed(p[0], p[1] + .4, l, n, sd, '#2e6a4a')
        + `<g opacity="${f(.75 - Math.abs(x - Wc / 2) / Wc)}" style="mix-blend-mode:screen">${weed(p[0], p[1] + .4, l, n, sd, '#ff7a40')}</g>`; }
      { const p = Pc(Wc, 4, Hb); fg += weed(p[0], p[1], 26, 3, 6, '#2e6a4a'); } }
    // the chains: wrapped round the chest over the lid and under it; taut across the red gap; slack on the sand in front
    for (const [x, sd] of [[30, 3], [72, 4]]) {
      const top = [Pl(x, 30, PROF[4][1] + .8), Pl(x, 16, PROF[2][1] + .8), Pl(x, 6, PROF[1][1] + 2), Pl(x, -.6, Hb + C.lip), Pl(x, -.6, Hb + .4)];
      const down = [Pc(x + 1, -.6, Hb - .4), Pc(x + 1, -.6, 20), Pc(x + 1.4, -.6, 2)];
      fg += K.chain(u, L, [...top, ...down], { link: 5.2, seed: sd });
      // the red light on the links in the gap
      { const a = Pl(x, -.6, Hb + .4), b = Pc(x + 1, -.6, Hb - .4); fg += `<path d="M${P2(a)}L${P2(b)}" stroke="#ff8a50" stroke-width="2.6" opacity=".35" stroke-linecap="round"/>`; } }
    // the loose ends lie slack on the sand, joined by a big padlock
    fg += K.chain(u, L, [Pc(32, -1, 1), Pc(38, -12, 0), Pc(52, -22, 0), Pc(64, -19, 0)], { link: 5.2, seed: 7 }) + K.chain(u, L, [Pc(74, -1, 1), Pc(74, -10, 0), Pc(70, -17, 0)], { link: 5.2, seed: 8 });
    { const p = Pc(67, -20, 0), g = K.mat('iron', L, { form: 'sphere', x1: p[0], y1: p[1] + 4, r: 6, u });
      fg += K.contactShadow(u, p[0], p[1] + 9, 14, L, { ry: 2, opacity: .7 }) + `<defs>${g.defs}</defs><path d="M${f(p[0] - 3.4)} ${f(p[1] + 1)}V${f(p[1] - 3)}A3.4 3.4 0 0 1 ${f(p[0] + 3.4)} ${f(p[1] - 3)}V${f(p[1] + 1)}" stroke="#2a2e2c" stroke-width="1.6" fill="none"/>`
        + `<path d="M${f(p[0] - 5.4)} ${f(p[1] + 1)}h10.8v6q0 3 -5.4 3t-5.4 -3z" fill="${g.fill}" stroke="#0a0c0a" stroke-width=".5"/><path d="M${f(p[0])} ${f(p[1] + 3.6)}v2.6" stroke="#0a0c0a" stroke-width="1.1"/>`
        + `<path d="M${f(p[0] - 4.6)} ${f(p[1] + 2)}h4" stroke="#c8d4d0" stroke-width=".4" opacity=".6"/>`; }
    // a rusty key half in the sand, left in front; a few shells about
    { const k = [22, 166], g = K.mat('iron', L, { form: 'cyl', x1: k[0], y1: k[1], x2: k[0] + 22, y2: k[1] - 2, r: 1.2, u });
      fg += K.contactShadow(u, k[0] + 10, k[1] + 1.4, 30, L, { ry: 1.6, opacity: .6 }) + `<defs>${g.defs}</defs><g transform="rotate(-6 ${k[0]} ${k[1]})"><ellipse cx="${k[0]}" cy="${k[1]}" rx="4" ry="2.6" fill="none" stroke="${g.fill}" stroke-width="1.6"/>`
        + `<path d="M${k[0] + 4} ${k[1]}h18v3.2h-2.6v-1.6h-1.8v1.6h-1.6v-3.2" stroke="${g.fill}" stroke-width="1.4" fill="none"/><path d="M${k[0] + 4} ${k[1] - .5}h17" stroke="#c89a6a" stroke-width=".35" opacity=".6"/></g>`
        + `<path d="M${k[0] + 12} ${k[1] + 1.4}q4 -1.4 9 0" stroke="#646852" stroke-width="1.2" fill="none"/>`; }
    fg += scallop(u, 164, 158, 3.6, 18, '#d0c0a8') + scallop(u, 150, 176, 3, -30, '#c0b098') + barnacles(u, 182, 170, 3, 1.2, 12);
    // sand jolted off the lid by the beat: a few grains in the air over the chest
    { const R = rng(31); for (let i = 0; i < 14; i++) { const p = Pl(10 + R() * 80, 4 + R() * 30, Hb + C.lip + 18 + R() * 10); fg += `<circle cx="${f(p[0])}" cy="${f(p[1] - R() * 8)}" r="${f(.35 + R() * .5)}" fill="#d8d0b0" opacity="${f(.5 + R() * .4)}"/>`; } }
    // ——— the light: the red heat of the gap, its glow in the fog round the lid, the cold veil, the under-glass dark ———
    { const c = Pl(Wc / 2, 0, Hb), rb = nid('ry', u), rg = nid('rg', u);
      fg += K.localGlow(u, { x: c[0], y: c[1] + 5, color: '#ff6a3a', power: .7, radius: 34 }, { squash: .3 })
        + K.localGlow(u, { x: c[0] + 4, y: c[1] - 8, color: '#ff8a5a', power: .3, radius: 70 }, { core: false });
      // three beams out of the slit, up past the lip into the fog over the lid
      fg += `<defs><filter id="${rb}" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>${linGrad(rg, 0, c[1] + 4, 0, c[1] - 52, [[0, '#ffe0b8', .8], [.4, '#ff9a60', .32], [1, '#ff8a50', 0]])}</defs><g style="mix-blend-mode:screen" filter="url(#${rb})">`
        + [[-26, -40, 5, 9], [2, -6, 4, 12], [24, 34, 4, 8]].map(([dx, tx, w0, w1]) => `<path d="M${f(c[0] + dx - w0)} ${f(c[1] + 4)}L${f(c[0] + tx - w1)} ${f(c[1] - 52)}H${f(c[0] + tx + w1)}L${f(c[0] + dx + w0)} ${f(c[1] + 4)}Z" fill="url(#${rg})"/>`).join('') + `</g>`
        // glints of it on the lip's front face and on the iron above the lock
        + [[-14, 2.6, 7], [6, 3.4, 10], [20, 2.4, 6]].map(([dx, dh, w]) => { const a = Pl(Wc / 2 + dx, -.3, Hb + dh); return `<path d="M${f(a[0])} ${f(a[1])}h${w}" stroke="#ffb080" stroke-width=".7" stroke-linecap="round" opacity=".6"/>`; }).join(''); }
    fg += '</g>';
    fg += motes(20, 10, 40, 180, 100, '#dffff0', 9) + K.fog(u, L, { y: 160, h: 60, density: .3, seed: 12 });
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 150, 0, 290, [[0, '#040a08', 0], [.4, '#040a08', .45], [1, '#020504', .8]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${gl})"/>`; }
    fg += gloom(u, 100, 120, 0, -20, .25, '#020806');
    return [bg, fg];
  } };
