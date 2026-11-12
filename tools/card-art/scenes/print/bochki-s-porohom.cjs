// «Бочки с порохом» (Жемчужина, ПРИКАЗ, 2 Пороха: 4 урона по Корпусу любому вражескому кораблю, это не Залп), refined
// from the first-round scene (portrait-pearl.cjs SCENES['Бочки с порохом']): powder kegs in a wet net at the side of
// the Company ship, one shot, the first flash. Brief (card-briefs.md): the kegs hang in a net at the enemy's side,
// the shot comes from a boat pulling away («успеть отплыть подальше») — the moment the first keg flashes; a blow
// with no guns. Night: the Company ship lies at anchor, sails furled; we are low at the water close under her bow,
// her side a tall dark wall against the moon. The net of five kegs hangs from her rail on a line to the water; the
// longboat rows off past her bow across the moon's path, a musket's smoke still at its stern; the ball has struck
// the lower left keg — a ball of fire bursts from it, splinters fly, it lights her side, the kegs and the water warm.
// Fixed against the first round: the kegs floated free and the ship stood far behind them at a toy scale — now they
// hang at her side at a true scale (a keg ≈ a lower gun port's height), the boat that fired is in the picture, the
// flash is the one hot light and everything near it takes its colour; the moon is the cold key.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;

const HZ = 114, WL = 132;                          // eye low over the water; the ship's waterline
const SHIP = { kind: 'endeavour', x: 290, y: WL, scale: 4.2, sails: 'furled', lights: true, reflect: true, detail: 'near', seed: 7 };
const FL = { x: 95, y: 114 };                     // the flash: where the ball struck the lower left keg
const KEGS = [[103, 128, 4], [118, 128.5, 5], [133, 128, 6], [110.5, 106.5, 7], [125.5, 107, 8]];   // x, base y, seed (lower row first)
const KS = .8;                                     // keg scale: 24 tall, 15 wide
const GATHER = [118, 76];                          // where the net is gathered on its line
const BOAT = { x: 22, y: 122 };
const light = { time: 'night', haze: .35, key: { type: 'moon', x: 34, y: 30, el: 18, color: '#c8d8f6', power: .8 }, fill: { color: '#34486c', power: .4 },
  rim: { az: -30, color: '#bfe0ff', power: .55 }, locals: [{ x: FL.x, y: FL.y, color: '#ffb050', power: 1, radius: 70 }] };
const skel = { horizon: HZ, eye: 1.2, light: 'the moon upper left beyond her bow (cold key) + the flash at the lower left keg (hot local)', items: [
  ['ship', 60, WL, 140, 100, 'water: bow and fore part, broadside'], ['net + kegs', 93, 131, 50, 55, 'hangs from her rail on a line, just over the water'],
  ['line', 118, 76, 6, 40, 'from the rail to the net'], ['flash', 80, 130, 32, 32, 'on the lower left keg'], ['boat', 8, 125, 30, 12, 'water, beyond her bow, rowing off'],
  ['trail', 34, 120, 70, 4, 'the ball from the boat to the keg']] };

// ——— KIT-CANDIDATE: a rowing longboat seen side-on at a distance: a low hull with a rim of moonlight, the rowers'
// heads and shoulders, the oars in the water with their small splashes, a man standing at the stern who has just fired
function boat(u, L, x, y, s) {
  const rp = L.ramp('oak', x, y), R = rng(5), w = 26 * s, h = 3.6 * s;
  let out = `<path d="M${f(x - w / 2)} ${f(y - h)}Q${f(x - w * .2)} ${f(y + h * .6)} ${f(x + w / 2)} ${f(y - h * .7)}L${f(x + w / 2 - .4)} ${f(y - h * 1.15)}Q${f(x)} ${f(y - h * .5)} ${f(x - w / 2 - .6)} ${f(y - h * 1.5)}Z" fill="${rp.shadow}" stroke="${rp.outline}" stroke-width=".3"/>`
    + `<path d="M${f(x - w / 2 - .6)} ${f(y - h * 1.5)}Q${f(x)} ${f(y - h * .5)} ${f(x + w / 2 - .4)} ${f(y - h * 1.15)}" stroke="#bcd0f0" stroke-width=".45" fill="none" opacity=".75"/>`;
  // rowers: four heads and backs, leaning to the stroke; the oars
  for (let i = 0; i < 4; i++) { const px = x - w * .3 + i * w * .17, py = y - h * 1.1;
    out += `<path d="M${f(px - 1.4 * s)} ${f(py)}q${f(.3 * s)} ${f(-3 * s)} ${f(2 * s)} ${f(-3.4 * s)}l${f(.8 * s)} ${f(3.4 * s)}z" fill="#141a26"/><circle cx="${f(px + 1 * s)}" cy="${f(py - 4.2 * s)}" r="${f(1 * s)}" fill="#141a26"/>`
      + `<path d="M${f(px + .6 * s)} ${f(py - 1.6 * s)}L${f(px - 4.6 * s)} ${f(y + 2.4 * s)}" stroke="#2a2018" stroke-width="${f(.45 * s)}"/>`
      + `<path d="M${f(px - 6.4 * s)} ${f(y + 2.6 * s)}q${f(1.8 * s)} ${f(-1 * s)} ${f(3.6 * s)} 0" stroke="#dfeaff" stroke-width=".35" fill="none" opacity=".65"/>`; }
  // the musketeer standing at the stern (to the right, toward the ship), the musket still raised, its smoke
  { const sx = x + w * .38, sy = y - h * 1.2;
    out += `<path d="M${f(sx - 1.2 * s)} ${f(sy)}l${f(.2 * s)} ${f(-5 * s)}q${f(1 * s)} ${f(-1.4 * s)} ${f(2 * s)} 0l${f(.2 * s)} ${f(5 * s)}z" fill="#141a26"/><circle cx="${f(sx)}" cy="${f(sy - 6.6 * s)}" r="${f(1.05 * s)}" fill="#141a26"/>`
      + `<path d="M${f(sx - 1.4 * s)} ${f(sy - 7.4 * s)}h${f(2.8 * s)}" stroke="#141a26" stroke-width="${f(.6 * s)}"/>`
      + `<path d="M${f(sx + .4 * s)} ${f(sy - 5.4 * s)}L${f(sx + 7.4 * s)} ${f(sy - 6.6 * s)}" stroke="#2a2018" stroke-width="${f(.6 * s)}" stroke-linecap="round"/>`
      + `<path d="M${f(sx - .4 * s)} ${f(sy - 6 * s)}q${f(-.6 * s)} ${f(-1.6 * s)} ${f(.2 * s)} ${f(-2.4 * s)}" stroke="#bcd0f0" stroke-width=".3" fill="none" opacity=".7"/>`
      + K.smoke(u, L, { x: sx + 8 * s, y: sy - 6.6 * s, w: 9 * s, h: 9 * s, wind: -.6, seed: 9, opacity: .55 }); }
  // the wake: the boat pulls away to the left
  for (let i = 0; i < 4; i++) out += `<path d="M${f(x + w / 2 + 1 + i * 4 * s)} ${f(y - .4 + i * .5)}h${f((3 + R() * 3) * s)}" stroke="#dfeaff" stroke-width=".35" opacity="${f(.5 - i * .1)}"/>`;
  return out;
}

// the net over the kegs: a cord mesh hung from the gather point — meridians fanning down round the kegs, rings across
// them sagging under the weight; each cord dark with a wet light line on it (warm near the flash)
function net(u, L, G, kegs) {
  const x0 = Math.min(...kegs.map(k => k[0])) - 9.5, x1 = Math.max(...kegs.map(k => k[0])) + 9.5, yb = Math.max(...kegs.map(k => k[1])) + 1.5, G0 = G[0], G1 = G[1];
  // the bag: a short neck at the gather, full round the kegs, a rounded bottom sagging under them
  const env = `M${f(G0 - 2)} ${G1}C${f(x0 - 1)} ${f(G1 + 6)} ${f(x0 - 5)} ${f(yb - 12)} ${f(x0 + 3)} ${f(yb)}Q${G0} ${f(yb + 5)} ${f(x1 - 3)} ${f(yb)}C${f(x1 + 5)} ${f(yb - 12)} ${f(x1 + 1)} ${f(G1 + 6)} ${f(G0 + 2)} ${G1}Z`, cid = nid('nc', u);
  // the mesh: two families of cords crossing in diamonds, each sagging a little
  let d = ''; for (let c = -90; c <= 90; c += 5.6) for (const sg of [1, -1]) { const ax = G0 + c - sg * 50, ay = G1 - 6, bx = G0 + c + sg * 50, by = G1 + 94;
    d += `M${f(ax)} ${f(ay)}Q${f((ax + bx) / 2 - sg * 2)} ${f((ay + by) / 2 + 2)} ${f(bx)} ${f(by)}`; }
  // the cords from the gather to the bag's mouth
  let neck = ''; for (let i = 0; i < 6; i++) { const t = i / 5, bx = x0 + 2 + (x1 - x0 - 4) * t; neck += `M${G0} ${G1}Q${f(G0 + (bx - G0) * .7)} ${f(G1 + 4)} ${f(bx)} ${f(G1 + 14)}`; }
  return `<defs><clipPath id="${cid}"><path d="${env}"/></clipPath></defs><g clip-path="url(#${cid})"><path d="${d}" stroke="#1a140c" stroke-width=".75" fill="none" opacity=".7"/>`
    + `<path d="${d}" stroke="#e8d098" stroke-width=".3" fill="none" opacity=".55" transform="translate(-.25 -.25)"/>`
    + `<path d="${neck}" stroke="#1a140c" stroke-width=".8" fill="none" opacity=".75"/><path d="${neck}" stroke="#e8d098" stroke-width=".3" fill="none" opacity=".5"/></g>`;
}

// ——— KIT-CANDIDATE: the first flash of a powder keg: a ball of fire bursting out of its side (white heart, gold,
// orange, a torn red-orange edge), short tongues, sparks and splinters flying out, the first smoke over it
function burst(u, L, x, y, r) {
  const R = rng(11), fb = nid('fb', u), fe = nid('fe', u);
  let out = K.localGlow(u, { x, y, color: '#ffb050', power: .95, radius: r * 4.6 }) + glow(u, x, y, r * 3.2, r * 2.6, '#ff8a30', .55);
  // the torn edge: a jagged star of flame
  const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, rr = r * (i % 2 ? .78 + R() * .2 : 1.05 + R() * .55); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9]); }
  out += `<defs>${radGrad(fb, x, y, r * 1.5, [[0, '#ffffff', 1], [.18, '#fff6c0', 1], [.4, '#ffd040', 1], [.66, '#ff8a1e', .95], [.86, '#e8461a', .7], [1, '#c02a10', 0]])}<filter id="${fe}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".6"/></filter></defs>`
    + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${fb})" filter="url(#${fe})"/>`;
  // tongues of flame thrown out to the left (where the ball came from) and up
  for (let i = 0; i < 7; i++) { const a = Math.PI + (-1.3 + i * .38) + (R() - .5) * .2, l = r * (1.4 + R() * 1.1), w = r * (.18 + R() * .12);
    const tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l * .9, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
    out += `<path d="M${f(x + nx)} ${f(y + ny)}Q${f((x + tx) / 2 + nx * 1.4)} ${f((y + ty) / 2 + ny * 1.4)} ${f(tx)} ${f(ty)}Q${f((x + tx) / 2 - nx)} ${f((y + ty) / 2 - ny)} ${f(x - nx)} ${f(y - ny)}Z" fill="${i % 2 ? '#ffb030' : '#ff7a18'}" opacity=".85"/>`; }
  out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .42)}" fill="#ffffff"/>`;
  // splinters of the keg's staves and sparks, flying out in all directions, more to the left
  for (let i = 0; i < 18; i++) { const a = Math.PI + (R() - .5) * 4.4, d = r * (1.5 + R() * 1.6), len = 1.6 + R() * 2.6, rot = a + (R() - .5) * 1.6, w = .3 + R() * .35;
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .8, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * w * 2, ny = dx / len * w * 2;
    out += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .5 ? '#3a2410' : '#e2a058'}" stroke="#1a0e06" stroke-width=".15"/>`; }
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d0 = r * (1 + R() * .4), d1 = d0 + 2 + R() * 6;
    out += `<path d="M${f(x + Math.cos(a) * d0)} ${f(y + Math.sin(a) * d0 * .85)}L${f(x + Math.cos(a) * d1)} ${f(y + Math.sin(a) * d1 * .85)}" stroke="#ffe07a" stroke-width="${f(.3 + R() * .35)}" stroke-linecap="round" opacity="${f(.6 + R() * .4)}"/>`; }
  return out;
}

module.exports = { name: 'Бочки с порохом', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 8 }) + K.sunMoon(u, L, { r: 6.4 })
      + K.cloud(u, L, { x: 40, y: 64, w: 52, h: 7, seed: 13, far: .35 }) + K.cloud(u, L, { x: 6, y: 92, w: 40, h: 5, seed: 4, far: .6 }) + K.cloud(u, L, { x: 150, y: 14, w: 60, h: 8, seed: 21, far: .2 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .35, seed: 6, glitter: 34 });
    // the longboat pulling away past her bow, across the moon's path
    bg += boat(u, L, BOAT.x, BOAT.y, .95);
    // the Company ship at anchor: her bow and fore part close over us, sails furled; the anchor cable from the hawse
    bg += K.ship(u, L, SHIP);
    bg += `<path d="M62 104Q50 120 40 ${WL + 1}" stroke="#1a140e" stroke-width="1.6" fill="none"/><path d="M62 104Q50 120 40 ${WL + 1}" stroke="#a8bcd8" stroke-width=".35" fill="none" opacity=".5" transform="translate(-.5 0)"/>`
      + K.foam(u, { x: 40, y: WL + 1.4, w: 8, h: .8, seed: 9, L });
    // the flash lights her side: a warm wash over the planking round the kegs, the ports' sills catch it
    bg += glow(u, FL.x + 20, FL.y - 18, 80, 58, '#ffa040', .42) + K.localGlow(u, { x: FL.x + 10, y: WL + 6, color: '#ffb050', power: .7, radius: 60 }, { squash: .22, core: false });
    let fg = '';
    // the net's line from her rail down to the gather; a cleat on the rail
    { const top = [GATHER[0] + 4, 36]; fg += `<path d="M${top[0]} ${top[1]}Q${top[0] + 1.6} ${(top[1] + GATHER[1]) / 2} ${GATHER[0]} ${GATHER[1]}" stroke="#16100a" stroke-width="1.6" fill="none"/>`
        + `<path d="M${top[0] - .5} ${top[1]}Q${top[0] + 1.1} ${(top[1] + GATHER[1]) / 2} ${GATHER[0] - .5} ${GATHER[1]}" stroke="#c8b48a" stroke-width=".4" fill="none" opacity=".6" stroke-dasharray="1 .8"/>`
        + K.shadeCyl(u, top[0] - 4, top[1] + 1, top[0] + 4, top[1] + 1, 1.1, L, 'oak', { outline: .3, cap: 'round', grain: false }); }
    // the kegs in the net against her side (the lower row hangs just over the water; the upper row stands on it)
    // the powder mark burnt into each keg: a small red flame
    const brand = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y}) translate(${x} ${f(y - 30 * KS * .52)}) scale(${f(KS * 1.5)})"><path d="M0 3.4q-2.6 -.4 -2.4 -3q.2 -1.8 1.4 -3.2q0 1.6 .9 1.8q-.2 -2 1.4 -3.6q-.2 2 1 3.2q.8 1 .2 2.4q-.6 2.2 -2.5 2.4z" fill="#a82a18" opacity=".85"/><path d="M0 2.2q-1 -.6 -.6 -1.8q.4 .6 1 .4q.2 .8 -.4 1.4z" fill="#e8a040" opacity=".7"/></g>`;
    { const cid = nid('kw', u); let kg = '';
      for (const [x, y, sd] of KEGS.slice(0, 3)) kg += K.barrel(u, L, { x, y, s: KS, kind: 'water', seed: sd, rot: (sd % 2 ? 3 : -3), contact: false }) + brand(x, y, sd % 2 ? 3 : -3);
      for (const [x, y, sd] of KEGS.slice(3)) kg += K.barrel(u, L, { x, y, s: KS, kind: 'water', seed: sd, rot: (sd % 2 ? -4 : 5), contact: false }) + brand(x, y, sd % 2 ? -4 : 5);
      fg += `<defs><clipPath id="${cid}"><rect x="0" y="0" width="200" height="${WL + 1.2}"/></clipPath></defs><g clip-path="url(#${cid})">${kg}${glow(u, FL.x + 14, FL.y - 4, 34, 30, '#ffb050', .5)}${net(u, L, GATHER, KEGS)}</g>`;
      // the gather: the net's mouth bound to the line with a seizing
      fg += `<ellipse cx="${GATHER[0]}" cy="${GATHER[1] + 1}" rx="2.6" ry="1.8" fill="#2a2016" stroke="#0e0a06" stroke-width=".4"/><path d="M${GATHER[0] - 2} ${GATHER[1] + .4}h4M${GATHER[0] - 2.2} ${GATHER[1] + 1.6}h4.4" stroke="#c8b48a" stroke-width=".3" opacity=".6"/>`;
      // the water under the kegs: warm ripples
      fg += `<path d="M98 ${WL + 3.5}q23 3 46 0" stroke="#ffc880" stroke-width=".5" fill="none" opacity=".6"/><path d="M92 ${WL + 7}q30 4 58 0" stroke="#ffc880" stroke-width=".4" fill="none" opacity=".35"/>`; }
    // the ball's trail from the boat's musket to the keg, fading toward the boat
    { const tr = nid('tr', u), a = [BOAT.x + 12, BOAT.y - 10.5], b = [FL.x - 6, FL.y + 1];
      fg += `<defs>${linGrad(tr, a[0], a[1], b[0], b[1], [[0, '#ffe6b0', 0], [.7, '#ffe6b0', .35], [1, '#fff4d0', .8]])}</defs><path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f(Math.min(a[1], b[1]) - 3)} ${f(b[0])} ${f(b[1])}" stroke="url(#${tr})" stroke-width=".9" fill="none" stroke-linecap="round"/>`; }
    // the first flash on the lower left keg, its smoke rising
    fg += K.smoke(u, L, { x: FL.x - 2, y: FL.y - 8, w: 30, h: 40, wind: -.5, seed: 14, opacity: .8, glow: { color: '#ff9a40', power: .75 } });
    fg += burst(u, L, FL.x, FL.y, 11);
    // the flash on the water under it
    fg += K.localGlow(u, { x: FL.x, y: WL + 10, color: '#ffb050', power: .7, radius: 34 }, { squash: .25, core: false })
      + Array.from({ length: 9 }, (_, i) => { const y = WL + 4 + i * 4.2, w = 6 + i * 3.4; return `<path d="M${f(FL.x - w / 2 + (i % 2) * 3)} ${f(y)}h${f(w)}" stroke="#ffd890" stroke-width="${f(.5 + i * .08)}" stroke-linecap="round" opacity="${f(.7 - i * .06)}"/>`; }).join('');
    // air: the near water falls dark under the glass, the top corners darken a little
    fg += gloom(u, 100, 150, 100, 280, .5, '#04080e') + gloom(u, 110, 60, 200, 0, .25, '#04080e');
    return [bg, fg];
  } };
