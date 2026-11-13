// «Огонь по орудиям» (Месть королевы Анны, ЗАРЯД: этот Залп бьёт по Пушкам цели, а не по Корпусу), refined from the
// first-round scene (portrait-revenge.cjs SCENES['Огонь по орудиям']): the enemy's side close up at sunset, two tiers
// of ports. The middle port of the upper tier is smashed: the planking round it torn open, the lid hanging by one
// hinge, and inside the gun is thrown off its carriage — the barrel tipped up and sticking out over the broken sill,
// the carriage on its side, one truck (wheel) flying out with the splinters, fire behind; the guns either side still
// run out. Our next ball streaks in from behind us straight into the lower port, at the muzzle in it.
// Fixed against the first round: the hull was a flat brown plank texture and the ports black boxes — now a ship's
// side with tumblehome (the top leaning away, lighter), a pale band along the upper ports, wales, the channel with
// its deadeyes, chainplates and shrouds going up into the sunset; the kit's gun ports with their lids and tackles,
// guns end-on in them; the overturned gun was a sprite upside down in the flames — now the barrel tipped up out of
// the hole, the carriage on its side, the flying wheel (the brief's find); the ball came in flat from the edge — now
// from behind us in perspective, its trail widening towards us.
// Light: the low sun behind us on the left (key: the side glows warm, the wales throw shadows down); the fire in the
// smashed port (local, orange: lights the hole's edges, the hanging lid and the smoke from below).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, gloom, glow } = PK;

const HZ = 150;                                  // the sea horizon (hidden behind the hull; for the light and the water)
const RAIL = 22, CH = 33, BAND = [42, 79], WALE = [80, 88], LOW = 124, WL = 140;   // the side's levels, top to the waterline
const UP = { y: 74, s: 2.05 }, DN = { y: 118, s: 1.9 };     // the port rows: their sills, the ports' scale
const HOLE = { x: 100, y: 60 };                  // the smashed port's middle
const FIRE = { x: 100, y: 70 };
const light = { time: 'dusk', haze: .3, key: { type: 'sun', az: 214, el: 12, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 },
  locals: [{ x: FIRE.x, y: FIRE.y, color: '#ff8a30', power: .9, radius: 54 }] };
const skel = { horizon: HZ, eye: 3, light: 'the low sun behind us left (key, warm on the side) + the fire in the smashed port (orange, local)', items: [
  ['hull side', -10, WL, 220, WL - RAIL, 'the sea'], ['channel+shrouds', 124, CH, 86, 60, 'the side; the shrouds up out of the frame'],
  ['port L', 6, UP.y, 33, 29, 'the side, gun run out'], ['smashed port', 72, 82, 58, 44, 'the side'], ['barrel', 66, 70, 46, 30, 'tipped out over the sill'],
  ['wheel', 132, 58, 12, 12, 'in the air'], ['lid', 124, 84, 18, 30, 'one hinge'], ['port R', 162, UP.y, 33, 29, 'the side, gun run out'],
  ['port low', 120, DN.y, 30, 27, 'the side, gun run out'], ['ball', 132, 106, 8, 8, 'in flight, from behind us'], ['port low L', 40, DN.y, 30, 27, 'lid closed']] };

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
  const R = rng(seed), rp = L.ramp('oak', x, y); let out = '';
  for (let i = 0; i < n; i++) { const a = a0 + R() * (a1 - a0), d = sp * (.35 + R() * .75), len = 1.6 + R() * 4.4, rot = a + (R() - .5) * 2, w = .35 + R() * .5;
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .8, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * w * 2, ny = dx / len * w * 2;
    out += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .45 ? '#ecc08a' : '#a06a38'}" stroke="#3a1e0c" stroke-width=".18"/>`; }
  return out;
}

module.exports = { name: 'Огонь по орудиям', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), R = rng(19);
    // the things inside the smashed port are lit by the fire behind and under them, not by the sun
    const Lf = K.makeLight({ time: 'dusk', haze: .2, key: { type: 'point', x: FIRE.x + 6, y: FIRE.y + 6, h: .6, gy: FIRE.y + 14, color: '#ff8a30', power: 1, radius: 40, z: -.3 }, fill: { color: '#2a1420', power: .25 } }, { horizon: HZ });
    // ——— the sky over her rail: the sunset; her main course's foot along the top, lit pink-gold ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false });
    { const g = nid('sk', u); bg += `<defs>${linGrad(g, 0, 0, 0, 40, [[0, '#4a1e2a', 1], [.5, '#a84a34', 1], [1, '#f09a5a', 1]])}</defs><rect x="-10" y="-5" width="220" height="45" fill="url(#${g})"/>`
      + K.cloud(u, L, { x: 60, y: 18, w: 70, h: 8, seed: 6, far: .3 }) + K.cloud(u, L, { x: 170, y: 10, w: 50, h: 6, seed: 9, far: .5 }); }
    bg += K.water(u, L, { horizon: WL - 4, bottom: 290, swell: .5, seed: 8, glitter: false });
    // ——— the side: planking, darker and wet low down, the pale band along the upper ports; tumblehome light ———
    const side = `M-10 ${f(RAIL - 8 + sheer(-10))}L210 ${f(RAIL - 8 + sheer(210))}L212 ${WL + 2}H-12Z`, sc = nid('sc', u);
    bg += `<defs><clipPath id="${sc}"><path d="${side}"/></clipPath></defs><g clip-path="url(#${sc})">`
      + woodTex(u, -10, RAIL - 6, 220, WL - RAIL + 14, '#4a2c18', '#28160a', '#0e0604', 6.2, false, 12)
      + woodTex(u, -10, BAND[0], 220, BAND[1] - BAND[0], '#b8823e', '#7a4e22', '#2a1608', 6.2, false, 5);
    { const g = nid('tb', u), g2 = nid('tl', u);
      bg += `<defs>${linGrad(g, 0, RAIL, 0, WL, [[0, '#ffd0a0', .26], [.3, '#ffb070', .08], [.65, '#000000', .1], [1, '#000000', .45]])}${linGrad(g2, 0, 0, 200, 0, [[0, '#ffb070', .18], [.5, '#ffb070', 0], [1, '#2a1030', .25]])}</defs>`
        + `<rect x="-10" y="${RAIL - 6}" width="220" height="${WL - RAIL + 14}" fill="url(#${g})"/><rect x="-10" y="${RAIL - 6}" width="220" height="${WL - RAIL + 14}" fill="url(#${g2})"/>`; }
    // the wales: thick black timbers along the side, lit on top, a shadow under each
    const wale = (y0, y1) => { const top = `M-10 ${f(y0 + sheer(-10))}L210 ${f(y0 + sheer(210))}`, bot = `M-10 ${f(y1 + sheer(-10))}L210 ${f(y1 + sheer(210))}`;
      return `<path d="M-10 ${f(y0 + sheer(-10))}L210 ${f(y0 + sheer(210))}L210 ${f(y1 + sheer(210))}L-10 ${f(y1 + sheer(-10))}Z" fill="#1c120c"/>`
        + `<path d="${top}" stroke="#d89a62" stroke-width=".9" opacity=".75"/><path d="M-10 ${f(y0 + 1.3 + sheer(-10))}L210 ${f(y0 + 1.3 + sheer(210))}" stroke="#5a3a26" stroke-width="1.2" opacity=".7"/>`
        + `<path d="${bot}" stroke="#000" stroke-width="2.2" opacity=".35" transform="translate(0 1.6)"/>`; };
    bg += wale(RAIL - 6, RAIL) + wale(WALE[0], WALE[1]) + wale(LOW, LOW + 5) + wale(BAND[0] - 3.2, BAND[0]);
    // the nails in rows along the planks
    bg += PK.nails(Array.from({ length: 60 }, (_, k) => { const x = 4 + (k % 20) * 10.4, y = [RAIL + 7, 94, 112][Math.floor(k / 20)]; return [x, y + sheer(x)]; }), '#0a0604', .5);
    bg += '</g>';
    // the cap rail along the top, the channel: a ledge standing out of the side with its deadeyes, the chainplates down
    bg += `<path d="M-10 ${f(RAIL - 7 + sheer(-10))}L210 ${f(RAIL - 7 + sheer(210))}" stroke="#120a06" stroke-width="2.4"/><path d="M-10 ${f(RAIL - 8 + sheer(-10))}L210 ${f(RAIL - 8 + sheer(210))}" stroke="#e8a870" stroke-width=".6" opacity=".7"/>`;
    { const x0 = 124, x1 = 210, y = CH + sheer(160);
      bg += `<path d="M${x0} ${f(y + 3.4)}L${x1} ${f(y + 3.4)}" stroke="#000" stroke-width="3" opacity=".35" transform="translate(0 1.5)"/>`
        + K.shadeBox(u, [{ pts: [[x0, y - 1.4], [x1, y - 1.4], [x1 + 2, y - 3.2], [x0 + 2, y - 3.2]], n: 'top', grain: [1, 0] }, { pts: [[x0, y - 1.4], [x1, y - 1.4], [x1, y + 2.6], [x0, y + 2.6]], n: 'front', grain: [1, 0] }], L, 'tar', { seed: 4, outline: .45 });
      for (const x of [132, 144, 156, 168, 180, 192]) {
        bg += `<path d="M${x} ${f(y + 2.6)}L${x - 1.2} ${f(y + 18)}" stroke="#1a1414" stroke-width="1.3"/><path d="M${x - .4} ${f(y + 2.6)}L${x - 1.6} ${f(y + 18)}" stroke="#c89070" stroke-width=".3" opacity=".6"/><circle cx="${x - 1.2}" cy="${f(y + 18.4)}" r=".8" fill="#2a2020"/>`
          + `<ellipse cx="${x}" cy="${f(y - 3.6)}" rx="2.2" ry="1.7" fill="#2a1a10" stroke="#0a0604" stroke-width=".4"/><path d="M${x - 1.7} ${f(y - 4.2)}a2 1.5 0 0 1 3 -.4" stroke="#d89a62" stroke-width=".4" fill="none"/>`
          + `<path d="M${x} ${f(y - 5.3)}V${f(y - 7.8)}" stroke="#1a1010" stroke-width="1.1"/>`; } }

    // the shrouds from the channel up into the sky (behind the smoke), the ratlines across them
    { const dx = [132, 144, 156, 168, 180, 192], top = -40, tx = 214;
      for (const x of dx) bg += `<path d="M${x} ${CH - 3}L${f(lerp(x, tx, .55))} ${top}" stroke="#1a1010" stroke-width="1.3"/><path d="M${x - .5} ${CH - 3}L${f(lerp(x, tx, .55) - .5)} ${top}" stroke="#ffb070" stroke-width=".3" opacity=".5"/>`;
      for (let y = CH - 9; y > -2; y -= 5.2) { const t = (CH - 3 - y) / (CH - 3 - top); bg += `<path d="M${f(lerp(dx[0], lerp(dx[0], tx, .55), t))} ${f(y)}L${f(lerp(dx[5], lerp(dx[5], tx, .55), t))} ${f(y)}" stroke="#1a1010" stroke-width=".45" opacity=".85"/>`; } }

    // ——— the ports: the upper tier on the pale band (the left and right guns run out), the lower tier ———
    let ports = '';
    for (const x of [22, 178]) { const y = UP.y + sheer(x); ports += K.gunPort(u, L, { x, y, s: UP.s, open: .95, kind: 'paint-ochre', seed: x });
      ports += muzzleEnd(u, L, x + 1, y - 7 * UP.s, 4.6) + glow(u, x, y - 7 * UP.s, 10, 8, '#000', .2); }
    { const x = 140, y = DN.y + sheer(x); ports += K.gunPort(u, L, { x, y, s: DN.s, open: .9, kind: 'tar', seed: 9 }) + muzzleEnd(u, L, x - .6, y - 6.6 * DN.s, 4.2); }
    { const x = 52, y = DN.y + sheer(x); ports += K.gunPort(u, L, { x, y, s: DN.s, open: 0, kind: 'tar', seed: 11 }); }

    // ——— the smashed port: the torn hole, the deck inside lit by the fire, the gun thrown off its carriage ———
    let hit = '';
    { const { x: hx, y: hy } = HOLE, RH = rng(7), pts = [];
      // the ragged outline: the port's square opening blown wider, plank ends torn to points
      const n = 30;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), sq = 1 / Math.max(Math.abs(c) / 26, Math.abs(s) / 19.5);
        const r = sq * (i % 2 ? .9 + RH() * .12 : 1.04 + RH() * .2); pts.push([hx + c * r, hy + s * r * (s > 0 ? .9 : 1)]); }
      const hd = 'M' + pts.map(P2).join('L') + 'Z', hc = nid('hc', u), hg = nid('hg', u);
      // soot round it on the paint, then the hole: dark, lit from below by the fire
      hit += `<ellipse cx="${hx - 2}" cy="${hy - 6}" rx="40" ry="26" fill="#140806" opacity=".55" filter="url(#soft${u})"/><ellipse cx="${hx - 8}" cy="${hy - 18}" rx="30" ry="14" fill="#0a0404" opacity=".5" filter="url(#soft${u})"/>`
        + `<defs>${radGrad(hg, hx, hy + 14, 34, [[0, '#ff9a3a', 1], [.3, '#a8380e', 1], [.65, '#3a1006', 1], [1, '#120604', 1]])}<clipPath id="${hc}"><path d="${hd}"/></clipPath></defs>`
        + `<path d="${hd}" fill="url(#${hg})"/><g clip-path="url(#${hc})">`
        // inside: a deck beam overhead and a knee, the far side's frames in silhouette against the fire
        + `<rect x="${hx - 40}" y="${hy - 22}" width="80" height="6" fill="#0e0604"/><path d="M${hx - 40} ${hy - 16}H${hx + 40}" stroke="#ff9a50" stroke-width=".5" opacity=".6"/>`
        + [-18, 6, 22].map(x => `<rect x="${hx + x}" y="${hy - 16}" width="3.4" height="40" fill="#1a0a06" opacity=".75"/>`).join('')
        + K.fire(u, { x: hx + 6, y: hy + 18, w: 34, h: 30, seed: 4, wind: -.3, pool: false, glow: false })
        // the carriage thrown on its side inside, an axle up, one truck still on it
        + K.shadeBox(u, [{ pts: [[hx + 2, hy + 18], [hx + 24, hy + 10], [hx + 26, hy + 14], [hx + 4, hy + 22]], n: 'top', grain: [1, -.4] }, { pts: [[hx + 4, hy + 22], [hx + 26, hy + 14], [hx + 26, hy + 20], [hx + 5, hy + 27]], n: 'front', grain: [1, -.4] }], Lf, 'oak', { seed: 3, outline: .45 })
        + `<path d="M${hx + 8} ${hy + 18}l-1 -8" stroke="#2a1a14" stroke-width="2"/>` + `<circle cx="${hx + 7}" cy="${hy + 9}" r="4.2" fill="#3a2414" stroke="#0e0604" stroke-width=".6"/><circle cx="${hx + 7}" cy="${hy + 9}" r="1.2" fill="#141010"/>`
        + `</g>`
        // the torn plank ends round the hole, bent outwards and lit on their faces
        + Array.from({ length: 22 }, (_, i) => { const p = pts[(i * 3) % n], a = Math.atan2(p[1] - hy, p[0] - hx), l = 2 + RH() * 4.6, w = .8 + RH() * 1.1, q = [p[0] + Math.cos(a + (RH() - .5) * .6) * l, p[1] + Math.sin(a + (RH() - .5) * .6) * l];
            return `<path d="M${f(p[0] - Math.sin(a) * w)} ${f(p[1] + Math.cos(a) * w)}L${P2(q)}L${f(p[0] + Math.sin(a) * w)} ${f(p[1] - Math.cos(a) * w)}Z" fill="${p[1] > hy ? '#e8b878' : '#a06838'}" stroke="#2a1408" stroke-width=".25"/>`; }).join('')
        + `<path d="${hd}" fill="none" stroke="#ff9a40" stroke-width=".6" opacity=".55"/>`;
      // the barrel: thrown up off the carriage, the breech down inside, the chase over the broken sill, muzzle up-left
      { const br = [hx + 12, hy + 14], mz = [hx - 33, hy - 13];
        hit += K.shadeCyl(u, br[0], br[1], mz[0], mz[1], 6, Lf, 'iron', { r1: 6.8, r2: 4.6, outline: .5, seed: 3 });
        // the reinforce rings and the muzzle swell, its face turned towards us a little: the bore
        const d = [mz[0] - br[0], mz[1] - br[1]], l = Math.hypot(...d), ux = d[0] / l, uy = d[1] / l, nx = -uy, ny = ux, rp = Lf.ramp('iron', hx, hy);
        for (const [t, r] of [[.28, 6.4], [.55, 5.6], [.92, 5]]) { const c = [br[0] + d[0] * t, br[1] + d[1] * t];
          hit += `<path d="M${f(c[0] + nx * r)} ${f(c[1] + ny * r)}L${f(c[0] - nx * r)} ${f(c[1] - ny * r)}" stroke="${rp.outline}" stroke-width="1.6"/><path d="M${f(c[0] + nx * r + ux * .8)} ${f(c[1] + ny * r + uy * .8)}L${f(c[0] - nx * r + ux * .8)} ${f(c[1] - ny * r + uy * .8)}" stroke="${rp.lit}" stroke-width=".5" opacity=".6"/>`; }
        hit += `<ellipse cx="${f(mz[0])}" cy="${f(mz[1])}" rx="5.2" ry="3.4" transform="rotate(${f(Math.atan2(uy, ux) * 180 / Math.PI + 90)} ${f(mz[0])} ${f(mz[1])})" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".5"/>`
          + `<ellipse cx="${f(mz[0] + ux * -.2)}" cy="${f(mz[1])}" rx="2.4" ry="1.6" transform="rotate(${f(Math.atan2(uy, ux) * 180 / Math.PI + 90)} ${f(mz[0])} ${f(mz[1])})" fill="#050403"/>`
          // the fire's light along its underside, the trunnion sticking out
          + `<path d="M${f(br[0] - nx * 5.6)} ${f(br[1] - ny * 5.6)}L${f(mz[0] - nx * 4)} ${f(mz[1] - ny * 4)}" stroke="#ff8a30" stroke-width=".9" opacity=".7"/>`
          + K.shadeCyl(u, br[0] + d[0] * .4 + nx * 5.4, br[1] + d[1] * .4 + ny * 5.4, br[0] + d[0] * .4 + nx * 8, br[1] + d[1] * .4 + ny * 8, 1.6, Lf, 'iron', { outline: .35, ell: .5, face: 2 }); }
      // the lid: torn off its upper hinge, hanging by the lower one at the right edge, red inside
      { const h0 = [hx + 26, hy - 18], rp = L.ramp('paint-red', hx + 30, hy);
        hit += `<g transform="rotate(24 ${h0[0]} ${h0[1]})">` + K.shadeBox(u, [{ pts: [[h0[0], h0[1]], [h0[0] + 15, h0[1] + 2], [h0[0] + 14, h0[1] + 31], [h0[0] - 1, h0[1] + 29]], n: [.3, 0, .95], kind: 'paint-red', grain: [0, 1] },
          { pts: [[h0[0] + 15, h0[1] + 2], [h0[0] + 17, h0[1] + 3], [h0[0] + 16, h0[1] + 32], [h0[0] + 14, h0[1] + 31]], n: 'right', grain: [0, 1] }], L, 'paint-red', { seed: 6, outline: .45 })
          + `<path d="M${h0[0] + 1} ${h0[1] + 8}L${h0[0] + 14} ${h0[1] + 10}M${h0[0]} ${h0[1] + 22}L${h0[0] + 13.6} ${h0[1] + 24}" stroke="#1a1414" stroke-width="1.5"/><path d="M${h0[0] + 1} ${h0[1] + 7.4}L${h0[0] + 14} ${h0[1] + 9.4}" stroke="#c8a090" stroke-width=".35" opacity=".6"/>`
          + `<path d="M${h0[0] + 14} ${h0[1] + 31}l-3 4l-2 -3l-3 4l-2 -4l-3 3" stroke="#e8b878" stroke-width=".6" fill="${rp.half}"/></g>`
          + `<circle cx="${h0[0] + 1}" cy="${h0[1] + 1}" r="1.5" fill="url(#iron${u})"/>`; }
      // the flying wheel: a truck thrown out of the hole to the right, spinning, its axle hole, a trail of splinters
      { const c = [hx + 42, hy - 6], r = 5.6;
        hit += `<g transform="rotate(-28 ${c[0]} ${c[1]})">` + K.shadeBox(u, [{ pts: [[c[0] - 1.6, c[1] - r], [c[0] + 1.6, c[1] - r], [c[0] + 1.6, c[1] + r], [c[0] - 1.6, c[1] + r]], n: 'right', grain: [0, 1] }], Lf, 'oak', { seed: 9, outline: .4 })
          + `<ellipse cx="${c[0] - 1.6}" cy="${c[1]}" rx="${f(r * .55)}" ry="${r}" fill="#7a4a24" stroke="#1a0c06" stroke-width=".5"/><ellipse cx="${c[0] - 1.6}" cy="${c[1]}" rx="${f(r * .44)}" ry="${f(r * .82)}" fill="none" stroke="#c08a52" stroke-width=".4"/><ellipse cx="${c[0] - 1.6}" cy="${c[1]}" rx="1" ry="1.6" fill="#120804"/></g>`
          + `<path d="M${c[0] - 6} ${c[1] + 4}q-6 3 -12 4" stroke="#e8b878" stroke-width=".8" fill="none" opacity=".5" stroke-dasharray="1.4 1.6"/>`; }
      hit += shards(u, L, hx + 4, hy - 2, 40, 40, 11) + shards(u, L, hx + 30, hy - 12, 12, 18, 13, -1.6, .4);
      // flames licking out of the top of the hole, smoke rolling up over the paint and into the sky
      hit += K.fire(u, { x: hx - 8, y: hy - 12, w: 18, h: 16, seed: 6, wind: -.4, pool: false })
        + K.smoke(u, L, { x: hx - 6, y: hy - 22, w: 56, h: 80, wind: -.6, seed: 14, opacity: .8, glow: { color: '#ff8a30', power: .7 } })
        + K.localGlow(u, { x: FIRE.x, y: FIRE.y - 4, color: '#ff8a30', power: .9, radius: 46 }); }

    // ——— our ball: from behind us, its trail widening towards us, straight at the muzzle in the lower port ———
    let shot = '';
    { const b = [138.8, 101.4], tail = [96, 190], tr = nid('tr', u), tb = nid('tb', u), bg2 = nid('bg', u);
      const d = [tail[0] - b[0], tail[1] - b[1]], l = Math.hypot(...d), nx = -d[1] / l, ny = d[0] / l;
      shot += `<defs>${linGrad(tr, b[0], b[1], tail[0], tail[1], [[0, '#e8d8c0', .7], [.3, '#b8a490', .25], [.7, '#a89480', 0]])}<filter id="${tb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1"/></filter>`
        + `${radGrad(bg2, b[0] - 1.2, b[1] - 1.4, 5.2, [[0, '#9aa2aa', 1], [.35, '#3e4246', 1], [1, '#0c0d0e', 1]])}</defs>`
        + `<path d="M${f(b[0] + nx * 2.4)} ${f(b[1] + ny * 2.4)}L${f(tail[0] + nx * 6)} ${f(tail[1] + ny * 6)}L${f(tail[0] - nx * 6)} ${f(tail[1] - ny * 6)}L${f(b[0] - nx * 2.4)} ${f(b[1] - ny * 2.4)}Z" fill="url(#${tr})" filter="url(#${tb})"/>`
        + `<circle cx="${b[0]}" cy="${b[1]}" r="3.6" fill="url(#${bg2})" stroke="#050505" stroke-width=".35"/><circle cx="${b[0] - 1.3}" cy="${b[1] - 1.3}" r=".75" fill="#fff0d8" opacity=".85"/>`; }

    // ——— the sea along her waterline (under the glass), the fire's glow on it ———
    const sea = K.foam(u, { x: 100, y: WL + .6, w: 220, h: 1.6, seed: 3, L })
      + K.localGlow(u, { x: 100, y: WL + 8, color: '#ff8a30', power: .35, radius: 40 }, { squash: .3, core: false });
    const air = gloom(u, 100, 60, 100, 0, .25, '#0a0204') + gloom(u, 100, 120, 100, 280, .55, '#0a0202') + gloom(u, 100, 80, 210, 80, .3, '#0a0204');
    return [bg + sea, ports + hit + shot + air];
  } };
