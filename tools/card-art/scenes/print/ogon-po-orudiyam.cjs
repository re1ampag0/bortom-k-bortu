// «Огонь по орудиям» (Месть королевы Анны, ЗАРЯД: этот Залп бьёт по Пушкам цели, а не по Корпусу), refined from the
// first-round scene (portrait-revenge.cjs SCENES['Огонь по орудиям']): the enemy's side close up at sunset, one row of
// ports. One story: the middle port is smashed — its square frame still there, the lid knocked off (two torn hinge
// straps left), inside the fire, the gun thrown off its carriage, the barrel tipped up and sticking out of the port,
// a truck (wheel) of the carriage flying out with the splinters; our next ball streaks in from behind us straight
// into that port, a torn trail of smoke behind it. The guns either side are still run out, their lids raised.
// Fixed against the previous draft: the ball flew at another (lower) port — the lower row is gone, the ball goes into
// the smashed one; the hole was a ragged blot — now a square port frame; the barrel's breech went through the
// hanging lid — the lid is gone; the side ports' lids were red boxes — now thin boards raised almost level, iron
// straps, lanyards; the planking read as bricks — long planks with rare butt joints; the shrouds, the channel, the
// closed lower port and the rope-like trail behind the wheel are gone.
// Light: the low sun behind us on the left (key: the side glows warm, the wales throw shadows down); the fire in the
// smashed port (local, orange: lights the frame's inner faces and the smoke from below).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { gloom, glow } = PK;

const HZ = 150;                                  // the sea horizon (hidden behind the hull; for the light and the water)
const RAIL = 22, BAND = [42, 79], WALE = [80, 88], LOW = 124, WL = 140;   // the side's levels, top to the waterline
const UP = { y: 74, s: 2.05 };                   // the side ports: their sills, scale
const PORT = { x: 100, y: 77, s: 2.3 };          // the smashed port: the middle of its sill, scale
const FIRE = { x: 100, y: 66 };
const light = { time: 'dusk', haze: .3, key: { type: 'sun', az: 214, el: 12, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 },
  locals: [{ x: FIRE.x, y: FIRE.y, color: '#ff8a30', power: .9, radius: 54 }] };
const skel = { horizon: HZ, eye: 3, light: 'the low sun behind us left (key, warm on the side) + the fire in the smashed port (orange, local)', items: [
  ['hull side', -10, WL, 220, WL - RAIL, 'the sea'],
  ['port L', 6, UP.y, 33, 29, 'the side, gun run out, lid raised'], ['smashed port', 81, PORT.y, 37, 32, 'the side'], ['barrel', 66, 80, 46, 34, 'tipped out of the port'],
  ['wheel', 128, 58, 18, 18, 'in the air'], ['port R', 162, UP.y, 33, 29, 'the side, gun run out, lid raised'],
  ['ball', 112, 100, 9, 9, 'in flight, from behind us, into the smashed port']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const sheer = x => -(x - 100) * .025;   // the side rises a little to the right (towards her stern)

// a gun's muzzle seen end-on in its port: the swell, the face with its rings, the bore; a lit rim on the sun's side
function muzzleEnd(u, L, x, y, r) {
  const rp = L.ramp('iron', x, y);
  return K.shadeSphere(u, x, y + r * .25, r * 1.08, L, 'iron', { outline: .4 }) + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".5"/>`
    + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .78)}" fill="none" stroke="${rp.shadow}" stroke-width=".6"/><path d="M${f(x - r * .9)} ${f(y + r * .3)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r * .1)} ${f(y - r * .95)}" stroke="${rp.lit}" stroke-width=".7" fill="none" opacity=".8"/>`
    + `<circle cx="${f(x + r * .06)}" cy="${f(y + r * .04)}" r="${f(r * .46)}" fill="#050403"/><path d="M${f(x + r * .5)} ${f(y - r * .1)}A${f(r * .46)} ${f(r * .46)} 0 0 1 ${f(x - r * .1)} ${f(y + r * .5)}" stroke="${rp.shadow}" stroke-width=".4" fill="none"/>`;
}
// splinters thrown out of a hit: long thin shards, lit on the side of the light, spinning, flying out
function shards(u, L, x, y, n, sp, seed, a0 = -Math.PI, a1 = Math.PI) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const a = a0 + R() * (a1 - a0), d = sp * (.35 + R() * .75), len = 1.6 + R() * 4.4, rot = a + (R() - .5) * 2, w = .35 + R() * .5;
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .8, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * w * 2, ny = dx / len * w * 2;
    out += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .45 ? '#ecc08a' : '#a06a38'}" stroke="#3a1e0c" stroke-width=".18"/>`; }
  return out;
}
// the side's planking between y0 and y1: long strakes following the sheer, each a little different in tone, a faint
// grain along it, the seam under it; butt joints rare and staggered (70–130 apart), two nails at each
const PH = 6.2;
function planks(y0, y1, light, dark, seed) {
  const R = rng(seed), line = (x0, x1, y) => `M${f(x0)} ${f(y + sheer(x0))}L${f(x1)} ${f(y + sheer(x1))}`;
  let s = '';
  for (let y = y0; y < y1 - .1; y += PH) { const h = Math.min(PH, y1 - y), c = mix(light, dark, .15 + R() * .5);
    s += `<path d="M-10 ${f(y + sheer(-10))}L210 ${f(y + sheer(210))}L210 ${f(y + h + sheer(210))}L-10 ${f(y + h + sheer(-10))}Z" fill="${c}"/>`;
    for (const t of [.3, .62]) s += `<path d="${line(-10, 210, y + h * t + (R() - .5) * .6)}" stroke="${mix(c, '#ffe0b0', .25)}" stroke-width=".3" opacity=".22" stroke-dasharray="${f(20 + R() * 40)} ${f(3 + R() * 8)}"/>`;
    s += `<path d="${line(-10, 210, y + h)}" stroke="${mix(dark, '#000', .5)}" stroke-width=".55"/><path d="${line(-10, 210, y + h + .5)}" stroke="${mix(light, '#ffd0a0', .3)}" stroke-width=".3" opacity=".35"/>`;
    for (let x = -10 + R() * 110; x < 210; x += 70 + R() * 60) s += `<path d="M${f(x)} ${f(y + sheer(x))}V${f(y + h + sheer(x))}" stroke="${mix(dark, '#000', .5)}" stroke-width=".5"/>`
      + `<circle cx="${f(x - 1.3)}" cy="${f(y + h / 2 + sheer(x))}" r=".35" fill="#0a0604"/><circle cx="${f(x + 1.3)}" cy="${f(y + h / 2 + sheer(x))}" r=".35" fill="#0a0604"/>`; }
  return s;
}
// a side port's lid raised almost level, seen from below: a thin board (its underside in shade, the sunset on its
// edge), the iron strap hinges across it, the lanyards up to the rail
function raisedLid(u, x, y, s) {
  const w = 16 * s, h = 14 * s, y0 = y - h, d = 6, wf = w / 2 * 1.08, g = nid('ld', u);
  const face = [[x - w / 2, y0], [x + w / 2, y0], [x + wf, y0 - d], [x - wf, y0 - d]];
  let o = `<defs>${linGrad(g, 0, y0, 0, y0 - d, [[0, '#3a1a10', 1], [1, '#7a3a24', 1]])}</defs>`
    + `<path d="M${face.map(P2).join('L')}Z" fill="url(#${g})" stroke="#140806" stroke-width=".4"/>`
    + `<path d="M${f(x - w / 2 * 1.03)} ${f(y0 - d * .5)}L${f(x + w / 2 * 1.03)} ${f(y0 - d * .5)}" stroke="#1a0a06" stroke-width=".35" opacity=".7"/>`
    + `<path d="M${f(x - wf)} ${f(y0 - d)}L${f(x + wf)} ${f(y0 - d)}L${f(x + wf)} ${f(y0 - d - 1.3)}L${f(x - wf)} ${f(y0 - d - 1.3)}Z" fill="#3a2214" stroke="#140806" stroke-width=".35"/>`
    + `<path d="M${f(x - wf)} ${f(y0 - d - 1.3)}L${f(x + wf)} ${f(y0 - d - 1.3)}" stroke="#ffc890" stroke-width=".5" opacity=".8"/>`;
  for (const a of [-.26, .26]) { const xa = x + w * a, xb = x + wf * 2 * a;
    o += `<path d="M${f(xa - .9)} ${f(y0)}L${f(xa + .9)} ${f(y0)}L${f(xb + .9)} ${f(y0 - d - 1.3)}L${f(xb - .9)} ${f(y0 - d - 1.3)}Z" fill="#141010"/><path d="M${f(xa - .9)} ${f(y0)}L${f(xb - .9)} ${f(y0 - d - 1.3)}" stroke="#c89070" stroke-width=".25" opacity=".6"/>`
      + `<circle cx="${f(xb)}" cy="${f(y0 - d - .7)}" r=".4" fill="#c89070" opacity=".6"/>`
      + `<path d="M${f(xb * .9 + x * .1)} ${f(y0 - d - 1.3)}L${f(xa * .8 + x * .2)} ${RAIL + 1}" stroke="#1a1010" stroke-width=".55"/>`; }
  return o;
}

module.exports = { name: 'Огонь по орудиям', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ });
    // the things inside the smashed port are lit by the fire behind and under them, not by the sun
    const Lf = K.makeLight({ time: 'dusk', haze: .2, key: { type: 'point', x: FIRE.x + 6, y: FIRE.y + 6, h: .6, gy: FIRE.y + 14, color: '#ff8a30', power: 1, radius: 40, z: -.3 }, fill: { color: '#2a1420', power: .25 } }, { horizon: HZ });
    // ——— the sky over her rail: the sunset ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false });
    { const g = nid('sk', u); bg += `<defs>${linGrad(g, 0, 0, 0, 40, [[0, '#4a1e2a', 1], [.5, '#a84a34', 1], [1, '#f09a5a', 1]])}</defs><rect x="-10" y="-5" width="220" height="45" fill="url(#${g})"/>`
      + K.cloud(u, L, { x: 60, y: 10, w: 70, h: 8, seed: 6, far: .3 }) + K.cloud(u, L, { x: 170, y: 6, w: 50, h: 6, seed: 9, far: .5 }); }
    bg += K.water(u, L, { horizon: WL - 4, bottom: 290, swell: .5, seed: 8, glitter: false });
    // ——— the side: long planks, darker and wet low down, the pale band along the ports; tumblehome light ———
    const side = `M-10 ${f(RAIL - 8 + sheer(-10))}L210 ${f(RAIL - 8 + sheer(210))}L212 ${WL + 2}H-12Z`, sc = nid('sc', u);
    bg += `<defs><clipPath id="${sc}"><path d="${side}"/></clipPath></defs><g clip-path="url(#${sc})">`
      + planks(RAIL - 8, BAND[0], '#5a3620', '#2a160a', 12) + planks(BAND[0], BAND[1] + 1, '#c08a46', '#7a4e22', 5) + planks(BAND[1] + 1, WL + 4, '#4a2c18', '#1e1008', 21);
    { const g = nid('tb', u), g2 = nid('tl', u);
      bg += `<defs>${linGrad(g, 0, RAIL, 0, WL, [[0, '#ffd0a0', .26], [.3, '#ffb070', .08], [.65, '#000000', .1], [1, '#000000', .45]])}${linGrad(g2, 0, 0, 200, 0, [[0, '#ffb070', .18], [.5, '#ffb070', 0], [1, '#2a1030', .25]])}</defs>`
        + `<rect x="-10" y="${RAIL - 6}" width="220" height="${WL - RAIL + 14}" fill="url(#${g})"/><rect x="-10" y="${RAIL - 6}" width="220" height="${WL - RAIL + 14}" fill="url(#${g2})"/>`; }
    // the wales: thick black timbers along the side, lit on top, a shadow under each
    const wale = (y0, y1) => { const top = `M-10 ${f(y0 + sheer(-10))}L210 ${f(y0 + sheer(210))}`, bot = `M-10 ${f(y1 + sheer(-10))}L210 ${f(y1 + sheer(210))}`;
      return `<path d="M-10 ${f(y0 + sheer(-10))}L210 ${f(y0 + sheer(210))}L210 ${f(y1 + sheer(210))}L-10 ${f(y1 + sheer(-10))}Z" fill="#1c120c"/>`
        + `<path d="${top}" stroke="#d89a62" stroke-width=".9" opacity=".75"/><path d="M-10 ${f(y0 + 1.3 + sheer(-10))}L210 ${f(y0 + 1.3 + sheer(210))}" stroke="#5a3a26" stroke-width="1.2" opacity=".7"/>`
        + `<path d="${bot}" stroke="#000" stroke-width="2.2" opacity=".35" transform="translate(0 1.6)"/>`; };
    bg += wale(RAIL - 6, RAIL) + wale(WALE[0], WALE[1]) + wale(LOW, LOW + 5) + wale(BAND[0] - 3.2, BAND[0]);
    bg += '</g>';
    // the cap rail along the top
    bg += `<path d="M-10 ${f(RAIL - 7 + sheer(-10))}L210 ${f(RAIL - 7 + sheer(210))}" stroke="#120a06" stroke-width="2.4"/><path d="M-10 ${f(RAIL - 8 + sheer(-10))}L210 ${f(RAIL - 8 + sheer(210))}" stroke="#e8a870" stroke-width=".6" opacity=".7"/>`;

    // ——— the side ports left and right: the guns run out, the lids raised ———
    let ports = '';
    for (const x of [22, 178]) { const y = UP.y + sheer(x);
      ports += raisedLid(u, x, y, UP.s) + K.gunPort(u, L, { x, y, s: UP.s, open: .9, below: 0, kind: 'paint-ochre', seed: x });
      ports += muzzleEnd(u, L, x + 1, y - 7 * UP.s, 4.6) + glow(u, x, y - 7 * UP.s, 10, 8, '#000', .2); }

    // ——— the smashed port: the square frame, the deck inside lit by the fire, the gun thrown off its carriage ———
    let hit = '';
    { const { x: px, s: ps } = PORT, py = PORT.y + sheer(PORT.x), w = 16 * ps, h = 14 * ps, x0 = px - w / 2, x1 = px + w / 2, y0 = py - h, y1 = py;
      const hc = nid('hc', u), hg = nid('hg', u), RH = rng(7), th = 2.6;
      // soot round it on the paint
      hit += `<ellipse cx="${px - 2}" cy="${py - 22}" rx="34" ry="24" fill="#140806" opacity=".5" filter="url(#soft${u})"/><ellipse cx="${px - 8}" cy="${y0 - 2}" rx="26" ry="10" fill="#0a0404" opacity=".5" filter="url(#soft${u})"/>`;
      // the opening: dark, lit from below by the fire; inside a deck beam, the far side's frames, the fire, the carriage on its side
      hit += `<defs>${radGrad(hg, px + 4, y1 - 2, 30, [[0, '#ff9a3a', 1], [.3, '#a8380e', 1], [.65, '#3a1006', 1], [1, '#120604', 1]])}<clipPath id="${hc}"><rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}"/></clipPath></defs>`
        + `<rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}" fill="url(#${hg})"/><g clip-path="url(#${hc})">`
        + `<rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="5" fill="#0e0604"/><path d="M${f(x0)} ${f(y0 + 5)}H${f(x1)}" stroke="#ff9a50" stroke-width=".5" opacity=".6"/>`
        + [-14, 4, 13].map(x => `<rect x="${px + x}" y="${f(y0 + 5)}" width="3.2" height="${f(h)}" fill="#1a0a06" opacity=".7"/>`).join('')
        + K.fire(u, { x: px + 2, y: y1 + 4, w: 36, h: 34, seed: 4, wind: -.3, pool: false, glow: false })
        + K.shadeBox(u, [{ pts: [[px + 2, y1 - 9], [px + 18, y1 - 15], [px + 19, y1 - 11], [px + 3, y1 - 5]], n: 'top', grain: [1, -.4] }, { pts: [[px + 3, y1 - 5], [px + 19, y1 - 11], [px + 19, y1 - 5], [px + 4, y1]], n: 'front', grain: [1, -.4] }], Lf, 'oak', { seed: 3, outline: .45 })
        + `</g>`;
      // the frame's thickness: the left jamb and the sill lit orange by the fire, the lintel dark; the lining round it
      hit += `<path d="M${f(x0)} ${f(y0)}L${f(x0 + th)} ${f(y0 + th)}L${f(x0 + th)} ${f(y1 - th)}L${f(x0)} ${f(y1)}Z" fill="#a0481c"/><path d="M${f(x0)} ${f(y1)}L${f(x0 + th)} ${f(y1 - th)}L${f(x1 - th)} ${f(y1 - th)}L${f(x1)} ${f(y1)}Z" fill="#d8783a"/>`
        + `<path d="M${f(x1)} ${f(y0)}L${f(x1 - th)} ${f(y0 + th)}L${f(x1 - th)} ${f(y1 - th)}L${f(x1)} ${f(y1)}Z" fill="#5a2410"/><path d="M${f(x0)} ${f(y0)}L${f(x0 + th)} ${f(y0 + th)}L${f(x1 - th)} ${f(y0 + th)}L${f(x1)} ${f(y0)}Z" fill="#1a0804"/>`
        + `<rect x="${f(x0 - 1.4)}" y="${f(y0 - 1.4)}" width="${f(w + 2.8)}" height="${f(h + 2.8)}" fill="none" stroke="#1e120a" stroke-width="2.6"/>`
        + `<path d="M${f(x0 - 2.6)} ${f(y1 + 2.6)}H${f(x1 + 2.6)}" stroke="#e8b070" stroke-width=".5" opacity=".6"/><path d="M${f(x0 - .2)} ${f(y0)}V${f(y1)}M${f(x0)} ${f(y1 + .2)}H${f(x1)}" stroke="#ff9a40" stroke-width=".6" opacity=".7"/>`;
      // the sill broken at its right end: a bite out of it and the lining, the plank ends torn
      { const bite = [[x1 - 9, y1 + 2.8], [x1 - 7, y1 - 1.2], [x1 - 4.6, y1 + .2], [x1 - 2, y1 - 2], [x1 + 2.8, y1 - 1], [x1 + 3.4, y1 + 2.4], [x1 + .6, y1 + 4.6], [x1 - 3.4, y1 + 3.4]];
        hit += `<path d="M${bite.map(P2).join('L')}Z" fill="#2a0c04" stroke="#ff8a3a" stroke-width=".4"/>`; }
      // short splinters standing out of the frame's edges, bent outwards, lit on their faces
      hit += Array.from({ length: 16 }, (_, i) => { const side = i % 4, t = .1 + RH() * .8;
          const p = side === 0 ? [x0 + w * t, y0 - 2.6] : side === 1 ? [x1 + 2.6, y0 + h * t] : side === 2 ? [x0 + w * t, y1 + 2.6] : [x0 - 2.6, y0 + h * t];
          const a = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][side] + (RH() - .5) * .9, l = 1.4 + RH() * 2.6, wd = .5 + RH() * .6, q = [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
          return `<path d="M${f(p[0] - Math.sin(a) * wd)} ${f(p[1] + Math.cos(a) * wd)}L${P2(q)}L${f(p[0] + Math.sin(a) * wd)} ${f(p[1] - Math.cos(a) * wd)}Z" fill="${side === 2 ? '#e8b878' : '#a06838'}" stroke="#2a1408" stroke-width=".25"/>`; }).join('');
      // the lid knocked off: its two hinge knuckles left on the lintel, the straps torn and bent out
      for (const [a, bend, len] of [[-.26, -20, 4.6], [.26, 26, 8]]) { const hx = px + w * a, hy = y0 - 2.4, rp = L.ramp('iron', hx, hy);
        hit += K.shadeCyl(u, hx - 2, hy, hx + 2, hy, 1.3, L, 'iron', { outline: .3 })
          + `<g transform="rotate(${bend} ${f(hx)} ${f(hy)})"><path d="M${f(hx - 1)} ${f(hy)}L${f(hx + 1)} ${f(hy)}L${f(hx + 1.2)} ${f(hy + len)}L${f(hx + .2)} ${f(hy + len - 1.2)}L${f(hx - .6)} ${f(hy + len + .4)}L${f(hx - 1.1)} ${f(hy + len - .6)}Z" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".35"/>`
          + `<path d="M${f(hx - .7)} ${f(hy + .4)}V${f(hy + len - 1)}" stroke="${rp.lit}" stroke-width=".3" opacity=".7"/><circle cx="${f(hx)}" cy="${f(hy + 2)}" r=".4" fill="${rp.outline}"/></g>`; }
      // the barrel: thrown up off the carriage, the breech down inside, the chase out of the port, muzzle up-left
      { const br = [px + 9, y1 - 4], mz = [px - 29, y1 - 27];
        hit += K.shadeCyl(u, br[0], br[1], mz[0], mz[1], 6, Lf, 'iron', { r1: 6.6, r2: 4.6, outline: .5, seed: 3 });
        const d = [mz[0] - br[0], mz[1] - br[1]], l = Math.hypot(...d), ux = d[0] / l, uy = d[1] / l, nx = -uy, ny = ux, rp = Lf.ramp('iron', px, y0);
        for (const [t, r] of [[.28, 6.2], [.55, 5.5], [.92, 5]]) { const c = [br[0] + d[0] * t, br[1] + d[1] * t];
          hit += `<path d="M${f(c[0] + nx * r)} ${f(c[1] + ny * r)}L${f(c[0] - nx * r)} ${f(c[1] - ny * r)}" stroke="${rp.outline}" stroke-width="1.6"/><path d="M${f(c[0] + nx * r + ux * .8)} ${f(c[1] + ny * r + uy * .8)}L${f(c[0] - nx * r + ux * .8)} ${f(c[1] - ny * r + uy * .8)}" stroke="${rp.lit}" stroke-width=".5" opacity=".6"/>`; }
        hit += `<ellipse cx="${f(mz[0])}" cy="${f(mz[1])}" rx="5.2" ry="3.4" transform="rotate(${f(Math.atan2(uy, ux) * 180 / Math.PI + 90)} ${f(mz[0])} ${f(mz[1])})" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".5"/>`
          + `<ellipse cx="${f(mz[0] + ux * -.2)}" cy="${f(mz[1])}" rx="2.4" ry="1.6" transform="rotate(${f(Math.atan2(uy, ux) * 180 / Math.PI + 90)} ${f(mz[0])} ${f(mz[1])})" fill="#050403"/>`
          // the sunset on its top where it sticks out of the port; the fire's light along its underside; the trunnion
          + `<path d="M${f(br[0] + d[0] * .55 + nx * 5.2)} ${f(br[1] + d[1] * .55 + ny * 5.2)}L${f(mz[0] + nx * 4.4)} ${f(mz[1] + ny * 4.4)}" stroke="#ffc890" stroke-width=".9" opacity=".75" stroke-linecap="round"/>`
          + `<path d="M${f(br[0] - nx * 5.6)} ${f(br[1] - ny * 5.6)}L${f(mz[0] - nx * 4)} ${f(mz[1] - ny * 4)}" stroke="#ff8a30" stroke-width=".9" opacity=".7"/>`
          + K.shadeCyl(u, br[0] + d[0] * .4 + nx * 5.4, br[1] + d[1] * .4 + ny * 5.4, br[0] + d[0] * .4 + nx * 8, br[1] + d[1] * .4 + ny * 8, 1.6, Lf, 'iron', { outline: .35, ell: .5, face: 2 }); }
      // the flying truck: a solid oak wheel thrown out of the port to the upper right, tumbling — its tread, its face
      // with the grain and the joint of its two halves, the iron-bushed axle hole
      { const c = [139, 52], r = 8.2, cb = [c[0] + 3.2, c[1] - 1.9], ell = .56, ang = Math.atan2(c[1] - cb[1], c[0] - cb[0]), wc = nid('wc', u), rp = L.ramp('oak', c[0], c[1]);
        hit += K.shadeCyl(u, cb[0], cb[1], c[0], c[1], r, L, 'oak', { ell, face: 2, outline: .5, seed: 9 });
        const eg = `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r * ell)}" ry="${f(r)}" transform="rotate(${f(ang * 180 / Math.PI)} ${f(c[0])} ${f(c[1])})"/>`;
        hit += `<defs><clipPath id="${wc}">${eg}</clipPath></defs><g clip-path="url(#${wc})" transform="rotate(${f(ang * 180 / Math.PI)} ${f(c[0])} ${f(c[1])})">`
          + [-.6, -.25, .15, .5].map(t => `<path d="M${f(c[0] - r)} ${f(c[1] + r * t)}q${f(r)} ${f(r * .08)} ${f(r * 2)} 0" stroke="${rp.shadow}" stroke-width=".3" fill="none" opacity=".55"/>`).join('')
          + `<path d="M${f(c[0] - r)} ${f(c[1] - r * .05)}H${f(c[0] + r)}" stroke="${rp.outline}" stroke-width=".45"/></g>`
          + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(1.9 * ell)}" ry="1.9" transform="rotate(${f(ang * 180 / Math.PI)} ${f(c[0])} ${f(c[1])})" fill="#5a5250" stroke="#141010" stroke-width=".4"/>`
          + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(1.1 * ell)}" ry="1.1" transform="rotate(${f(ang * 180 / Math.PI)} ${f(c[0])} ${f(c[1])})" fill="#0a0604"/>`; }
      hit += shards(u, L, px + 2, y0 + 10, 30, 34, 11) + shards(u, L, px + 26, y0, 10, 14, 13, -1.4, .3);
      // flames licking out of the top of the port, smoke rolling up over the paint and into the sky
      hit += K.fire(u, { x: px - 4, y: y0 + 3, w: 22, h: 20, seed: 6, wind: -.4, pool: false })
        + K.smoke(u, L, { x: px - 6, y: y0 - 6, w: 56, h: 80, wind: -.6, seed: 14, opacity: .8, glow: { color: '#ff8a30', power: .7 } })
        + K.localGlow(u, { x: FIRE.x, y: FIRE.y - 4, color: '#ff8a30', power: .9, radius: 46 }, { core: false }); }

    // ——— our ball: from behind us, its trail widening towards us, straight into the smashed port ———
    let shot = '';
    { const b = [114, 96], tail = [148, 146], tb = nid('tb', u), bg2 = nid('bg', u), RT = rng(5);
      const d = [tail[0] - b[0], tail[1] - b[1]], l = Math.hypot(...d), ux = d[0] / l, uy = d[1] / l, nx = -uy, ny = ux;
      shot += `<defs><filter id="${tb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".9"/></filter>`
        + `${radGrad(bg2, b[0] - 1.6, b[1] - 1.8, 6.4, [[0, '#a8b0b8', 1], [.3, '#464a50', 1], [1, '#0c0d0e', 1]])}</defs><g filter="url(#${tb})">`
        + Array.from({ length: 9 }, (_, k) => { const t = (k + 1) / 10, r = 1.6 + t * 6 + RT() * 1.4, o = (RT() - .5) * t * 5; const c = [b[0] + ux * l * t * .8 + nx * o, b[1] + uy * l * t * .8 + ny * o];
            return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="#5a4a48" opacity="${f(.42 * (1 - t) + .05)}"/><circle cx="${f(c[0] - r * .3)}" cy="${f(c[1] - r * .3)}" r="${f(r * .6)}" fill="#e8a070" opacity="${f(.22 * (1 - t))}"/>`; }).join('') + `</g>`
        + [-1, 1].map(sd => `<path d="M${f(b[0] + ux * 6 + nx * sd * 2.4)} ${f(b[1] + uy * 6 + ny * sd * 2.4)}l${f(ux * 9)} ${f(uy * 9)}" stroke="#ffe0b0" stroke-width=".5" opacity=".55"/>`).join('')
        + `<circle cx="${b[0]}" cy="${b[1]}" r="4.4" fill="url(#${bg2})" stroke="#050505" stroke-width=".4"/><circle cx="${b[0] - 1.6}" cy="${b[1] - 1.6}" r=".9" fill="#fff0d8" opacity=".9"/>`
        + `<path d="M${b[0] - 4.1} ${b[1] + 1}A4.4 4.4 0 0 1 ${b[0] - .8} ${b[1] - 4.3}" stroke="#ffb070" stroke-width=".6" fill="none" opacity=".8"/>`; }

    // ——— the sea along her waterline (under the glass), the fire's glow on it ———
    const sea = K.foam(u, { x: 100, y: WL + .6, w: 220, h: 1.6, seed: 3, L })
      + K.localGlow(u, { x: 100, y: WL + 8, color: '#ff8a30', power: .35, radius: 40 }, { squash: .3, core: false });
    const air = gloom(u, 100, 60, 100, 0, .25, '#0a0204') + gloom(u, 100, 120, 100, 280, .55, '#0a0202') + gloom(u, 100, 80, 210, 80, .3, '#0a0204');
    return [bg + sea, ports + hit + shot + air];
  } };
