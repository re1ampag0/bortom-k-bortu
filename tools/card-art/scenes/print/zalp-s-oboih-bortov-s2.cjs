// «Залп с обоих бортов» (Жемчужина, ЗАРЯД: Залп по обоим вражеским кораблям), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Залп с обоих бортов']): the black ship seen from astern, between two enemies, fires
// out of both sides at once. Symmetry: two flashes, two clouds of smoke, two targets — each enemy takes a shot in
// her side (splinters, a hole lit by the flash). Night, the moon ahead on the left: her sails stand dark against
// the sky with a silver rim, her stern is lit warm by the gallery windows and the three lanterns.
// The enemies are the kit's profile ships seen at a slant: squeezed across, the bow towards the vanishing point.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;

const HZ = 72, WL = 130, X = 100;   // horizon; the Pearl's waterline under her stern; her centre line
const MOON = { x: 56, y: 30 };
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#d0dcf4', power: .85 }, fill: { color: '#3a5480', power: .42 },
  rim: { az: 340, color: '#cfe4ff', power: .7 }, locals: [{ x: X, y: 76, color: '#ffc070', power: .7, radius: 30 }, { x: 52, y: 106, color: '#ffb050', power: .8, radius: 40 }, { x: 148, y: 106, color: '#ffb050', power: .8, radius: 40 }] };
const EN = [{ kind: 'endeavour', x: 30, y: 117, scale: .72, flip: true, heel: -3, sq: .5, hit: [27, 111], seed: 5 },
  { kind: 'dutch', x: 170, y: 117, scale: .8, flip: false, heel: -3, sq: .5, hit: [173, 112], seed: 3 }];
const GUN = [{ x: 66.5, y: 106, dir: 180 }, { x: 133.5, y: 106, dir: 0 }, { x: 69.5, y: 98.5, dir: 184, s: .7 }, { x: 130.5, y: 98.5, dir: -4, s: .7 }];
const skel = { horizon: HZ, eye: 2.2, light: 'moon ahead left; stern windows and lanterns; the flashes', items: [
  ['pearl', 50, WL, 100, 122, 'water'], ['enemyL', 0, 117, 64, 76, 'water'], ['enemyR', 138, 117, 56, 58, 'water'],
  ['flashL', 44, 106, 22, 12, 'gun'], ['flashR', 134, 106, 22, 12, 'gun'], ['smokeL', 40, 104, 34, 46, 'gun'], ['smokeR', 126, 104, 34, 46, 'gun'],
  ['hitL', 19, 111, 16, 14, 'enemy side'], ['hitR', 165, 112, 16, 14, 'enemy side']] };

// ——— KIT-CANDIDATE (as in yadra.cjs): a hit on a ship's side — the smashed hole, torn plank ends, splinters flying
// out the way the ball went (dir: +1 to the right, -1 to the left), smoke and dust, the brief light of the impact
function hit(u, L, o) {
  const R = rng(o.seed || 3), { x, y, s = 1, dir = 1 } = o, rp = L.ramp('oak', x, y);
  let out = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2.4 * s)}" ry="${f(2.8 * s)}" fill="#0c0705"/>`;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + R() * .3, r0 = 2.2 * s, r1 = r0 + (1 + R() * 2) * s, w = (.4 + R() * .4) * s;
    const ax = x + Math.cos(a) * r0 * .8, ay = y + Math.sin(a) * r0, bx = x + Math.cos(a + .25) * r1 * .8, by = y + Math.sin(a + .25) * r1;
    out += `<path d="M${f(ax - w)} ${f(ay)}L${f(bx)} ${f(by)}L${f(ax + w)} ${f(ay + w * .6)}Z" fill="${Math.cos(a) * -dir > 0 ? rp.lit : rp.half}" stroke="${rp.outline}" stroke-width=".2"/>`; }
  for (let i = 0; i < 18; i++) { const a = (dir > 0 ? 0 : Math.PI) + (R() - .5) * 2.4 - .4 * dir, d = (3 + R() * 12) * s, len = (1.2 + R() * 3) * s, rot = a + (R() - .5) * 1.6, w = (.3 + R() * .35) * s;
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .7 - R() * 3 * s, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * w * 2, ny = dx / len * w * 2;
    out += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .4 ? '#f0c88a' : '#b07a42'}" stroke="#3a1e0c" stroke-width=".15"/>`; }
  out += K.smoke(u, L, { x: x + dir * 2 * s, y: y - 1, w: 14 * s, h: 16 * s, wind: dir * .4, seed: (o.seed || 3) + 4, opacity: .7, glow: { color: '#ffb050', power: .5 } });
  out += K.localGlow(u, { x, y, color: '#ffd890', power: .75, radius: 9 * s });
  return out;
}

module.exports = { name: 'Залп с обоих бортов', variant: 's2', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2.2 });
    const R = rng(17);
    const cyl = (x1, y1, x2, y2, r1, r2 = r1, kind = 'oak') => K.shadeCyl(u, x1, y1, x2, y2, r1, L, kind, { r1, r2, outline: .3 });
    const ln = (d, w = .5, c = '#0c0d10', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    // ——— the night: stars, the moon ahead on the left, torn clouds, the sea with the moon's path
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 8 }) + K.sunMoon(u, L, { r: 6.5 });
    for (const [x, y, w, h, sd, fr] of [[70, 14, 60, 7, 11, .1], [176, 30, 50, 7, 4, .2], [120, 58, 56, 5, 9, .55], [16, 62, 40, 5, 2, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .55, seed: 9, glitter: MOON.x + 4 });
    // ——— the two enemies, abeam of her on both sides, seen at a slant: squeezed across, bow to the middle
    for (const e of EN) { const body = K.ship(u, L, { kind: e.kind, x: e.x, y: e.y, scale: e.scale, flip: e.flip, heel: e.heel, sails: 'full', wake: true, lights: true, seed: e.seed });
      bg += `<g transform="translate(${e.x} 0) scale(${e.sq} 1) translate(${-e.x} 0)">${body}</g>`; }
    for (const [e, d] of [[EN[0], 1], [EN[1], -1]]) bg += hit(u, L, { x: e.hit[0], y: e.hit[1], s: 1.6, dir: -d, seed: 5 + d });

    // ——— the smoke of both broadsides: out of each side and up, drifting away into the picture with the wind
    bg += K.smoke(u, L, { x: 56, y: 104, w: 32, h: 46, wind: .35, seed: 6, opacity: .8, glow: { color: '#ffb050', power: .9 } })
      + K.smoke(u, L, { x: 144, y: 104, w: 32, h: 46, wind: -.35, seed: 7, opacity: .8, glow: { color: '#ffb050', power: .9 } });
    // the balls on their way: a soft streak from each muzzle to its target
    { const tb = nid('tb', u); bg += `<defs><filter id="${tb}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`;
      for (const [a, b] of [[[44, 106], [31, 110.6]], [[156, 106], [169, 111.6]]]) { const g = nid('tg', u); bg += `<defs>${linGrad(g, a[0], a[1], b[0], b[1], [[0, '#f0e6d0', .1], [1, '#f0e6d0', .7]])}</defs><path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="url(#${g})" stroke-width="2.4" stroke-linecap="round" filter="url(#${tb})"/>`; } }

    // ——— the Pearl from astern. Her rig first (behind the stern): the masts in a line, the yards, the black sails
    // seen from behind (bellied away from us, the wind is at her stern), torn; the moon rims their left edges
    const sail = (y0, y1, w0, w1, sd, o = {}) => { // yard at y0 (half-width w0), foot at y1 (half-width w1), a ragged foot and holes
      const Rs = rng(sd), id = nid('ps', u), cid = nid('pc', u), bite = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, x = X - w1 + 2 * w1 * t, yy = y1 - 2.4 * Math.sin(t * Math.PI) - (i % 3 === 1 ? 1.4 + Rs() * 2.4 : Rs() * .8); bite.push([x, yy]); }
      const d = `M${X - w0} ${y0}Q${X} ${y0 - 1.6} ${X + w0} ${y0}Q${f(X + (w0 + w1) / 2 + 2.6)} ${f((y0 + y1) / 2)} ${X + w1} ${y1}` + bite.slice().reverse().map(p => `L${f(p[0])} ${f(p[1])}`).join('') + `Q${f(X - (w0 + w1) / 2 - 2.6)} ${f((y0 + y1) / 2)} ${X - w0} ${y0}Z`;
      const eg = nid('pe', u), tg = nid('pt', u), rb = nid('pr', u);
      let out = `<defs>${linGrad(id, X - w1, 0, X + w1, 0, [[0, '#2a2b30'], [.12, '#18191c'], [.5, '#101013'], [1, '#060607']])}<clipPath id="${cid}"><path d="${d}"/></clipPath>`
        + `${linGrad(eg, X - w1 - 3, 0, X - w1 + 12, 0, [[0, '#c4d4ee', .5], [.35, '#9aaccc', .2], [1, '#9aaccc', 0]])}${linGrad(tg, 0, y0, 0, y0 + 6, [[0, '#b8c8e4', .3], [1, '#b8c8e4', 0]])}`
        + `<filter id="${rb}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter></defs>`
        + `<path d="${d}" fill="url(#${id})"/><g clip-path="url(#${cid})"><rect x="${X - w1 - 6}" y="${y0 - 2}" width="20" height="${y1 - y0 + 4}" fill="url(#${eg})"/><rect x="${X - w1 - 4}" y="${y0 - 2}" width="${2 * w1 + 8}" height="8" fill="url(#${tg})"/>`;
      // the cloths, the belly's shadow under the yard and the light coming through thin canvas near the moon
      for (let i = 1; i < 9; i++) { const t = i / 9, xa = X - w0 + 2 * w0 * t, xb = X - w1 + 2 * w1 * t; out += ln(`M${f(xa)} ${y0}Q${f((xa + xb) / 2 + (t - .5) * 3)} ${f((y0 + y1) / 2)} ${f(xb)} ${y1}`, .4, '#05060a', .7); }
      out += `<rect x="${X - w1 - 4}" y="${y0}" width="${2 * w1 + 8}" height="${f((y1 - y0) * .22)}" fill="#04050a" opacity=".35"/>`;
      for (let i = 0; i < (o.holes || 3); i++) { const hx = X - w1 * .8 + Rs() * w1 * 1.6, hy = y0 + (y1 - y0) * (.3 + Rs() * .5), r = 1 + Rs() * 1.8; out += `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(r)}" ry="${f(r * .8)}" fill="#22324e"/>`; }
      // the moon's rim: a soft glow and a bright line down the left leech and along the head, fainter on the right
      // leech and the ragged foot — the black canvas stands out of the dark sky by its edges
      const lee = `M${X - w0} ${y0}Q${f(X - (w0 + w1) / 2 - 2.6)} ${f((y0 + y1) / 2)} ${X - w1} ${y1}`, head = `M${X - w0} ${y0}Q${X} ${y0 - 1.6} ${X + w0} ${y0}`;
      out += `</g><g filter="url(#${rb})">` + ln(lee, 2.6, '#cfe0f8', .45) + ln(head, 1.6, '#cfe0f8', .3) + `</g>` + ln(lee, 1, '#e8f0fc', .92) + ln(head, .6, '#d4e2f6', .7)
        + ln(`M${X + w0} ${y0}Q${f(X + (w0 + w1) / 2 + 2.6)} ${f((y0 + y1) / 2)} ${X + w1} ${y1}`, .5, '#8a9ab4', .5)
        + ln(bite.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join(''), .5, '#a4b4cc', .6);
      return out; };
    let rig = '';
    // main mast behind (taller), the mizzen in front of it; both on the centre line, the mizzen a touch lower
    rig += cyl(X + .4, 92, X + .3, 8, 2.4, 1.2, 'ship-coal') + K.shadeSphere(u, X + .3, 7, 1.4, L, 'oak');
    const mainYards = [[16, 26], [36, 37], [58, 47]];
    for (const [y, w] of mainYards) rig += cyl(X - w - 2, y, X + w + 2, y, 1.1, 1.1, 'ship-coal');
    rig += sail(17, 34, 25, 33, 3, { holes: 2 }) + sail(37, 56, 36, 44, 5, { holes: 3 }) + sail(59, 84, 46, 52, 7, { holes: 4 });
    // the main top seen from behind, the main shrouds from her channels up to it
    rig += `<path d="M${X - 12} 54h24l-2 3h-20z" fill="#14151a"/><path d="M${X - 12} 54h24" stroke="#9aaccc" stroke-width=".4" opacity=".7"/>`;
    // the mizzen: its topsail and the bare crossjack yard, nearer and lower
    rig += cyl(X, 96, X, 28, 2.1, 1.1, 'ship-coal') + K.shadeSphere(u, X, 27, 1.2, L, 'oak');
    rig += cyl(X - 26, 46, X + 26, 46, 1, 1, 'ship-coal') + sail(47, 66, 24, 30, 9, { holes: 2 }) + cyl(X - 32, 70, X + 32, 70, 1.2, 1.2, 'ship-coal');
    rig += `<path d="M${X - 9} 66h18l-1.6 2.6h-14.8z" fill="#14151a"/><path d="M${X - 9} 66h18" stroke="#9aaccc" stroke-width=".4" opacity=".7"/>`;
    // the shrouds and backstays: from the channels on her sides up to the tops and mastheads, ratlines across
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) rig += ln(`M${X + s * (27 + k * 1.6)} 92L${X + s * (8 + k * .8)} 66`, .45);
      for (let k = 0; k < 6; k++) { const t = (k + 1) / 7; rig += ln(`M${f(X + s * (27 - 19 * t))} ${f(92 - 26 * t)}L${f(X + s * (31.8 - 21.4 * t))} ${f(92 - 26 * t)}`, .3, '#0c0d10', .8); }
      rig += ln(`M${X + s * 33} 92L${X + s * 11} 54M${X + s * 34} 92L${X + s * 2} 18`, .4, '#0c0d10', .9); }
    // the Jolly Roger at the main truck: flying forward, away from us — seen narrow
    rig += `<path d="M${X + .3} 8l1 -.6q3 -2 6 -1q-.6 3 -3 5q-2 .2 -4 -.4z" fill="#141418" stroke="#aabbd6" stroke-width=".25"/>`;

    // ——— her hull from astern: the sides bulging out (tumblehome above the wale), the stern with its galleries
    let hull = '';
    { const side = nid('hs', u), hg = nid('hh', u), cr = L.ramp('ship-coal', X - 30, 105);
      const outline = `M${X - 25} 84Q${X - 33} 96 ${X - 33.5} 106Q${X - 33} 120 ${X - 26} ${WL}L${X + 26} ${WL}Q${X + 33} 120 ${X + 33.5} 106Q${X + 33} 96 ${X + 25} 84Z`;
      hull += `<defs>${linGrad(side, X - 34, 0, X + 34, 0, [[0, mix(cr.lit, '#8a9ab8', .35)], [.08, cr.lit], [.22, cr.half], [.78, cr.shadow], [.93, cr.core], [1, '#07080c']])}</defs><path d="${outline}" fill="url(#${side})"/>`;
      // the wales and the gun deck's line on the sides; the guns run out on both sides
      for (const [y, w] of [[94, 1.2], [104.5, 1.6], [114, 1.2]]) hull += ln(`M${X - 32} ${y}Q${X} ${y + 2} ${X + 32} ${y}`, w, '#07080c', .9) + ln(`M${X - 32} ${y - .8}Q${X - 26} ${y - .3} ${X - 22} ${y - .1}`, .4, '#a8b8d4', .6);
      for (const g of GUN) { const s = g.s || 1, dx = g.dir === 0 || g.dir < 90 ? 1 : -1, x0 = g.x - dx * 4 * s; hull += cyl(x0, g.y, g.x, g.y, 1.4 * s, 1.15 * s, 'iron') + `<rect x="${f(Math.min(x0, x0 - dx * 2) - .2)}" y="${f(g.y - 2.6 * s)}" width="${f(2.2)}" height="${f(5.2 * s)}" fill="#7a1e18" opacity=".8"/>`; }
      // the stern: a flat face from the taffrail to the counter, narrower than the hull, gilded carving
      const tr = `M${X - 22} 80L${X + 22} 80L${X + 20} 112Q${X + 12} 120 ${X} 121Q${X - 12} 120 ${X - 20} 112Z`;
      hull += `<defs>${linGrad(hg, 0, 80, 0, 121, [[0, '#26262c'], [.5, '#18181e'], [1, '#0c0c10']])}</defs><path d="${tr}" fill="url(#${hg})"/>`;
      // the taffrail with its carving and the three lanterns on their posts
      hull += `<path d="M${X - 24} 80Q${X} 72 ${X + 24} 80L${X + 22} 83Q${X} 76.6 ${X - 22} 83Z" fill="#3a2c18"/><path d="M${X - 24} 80Q${X} 72 ${X + 24} 80" stroke="#d8a848" stroke-width=".9" fill="none"/>`
        + [-14, -7, 0, 7, 14].map(k => `<path d="M${X + k - 2.4} 81q2.4 -3 4.8 0" stroke="#c99a40" stroke-width=".6" fill="none" opacity=".85"/>`).join('');
      for (const k of [-20, 0, 20]) { const ly = k ? 72 : 68, x = X + k;
        hull += ln(`M${x} ${ly + 6}V${k ? 79 : 76}`, .8, '#1a1410') + `<path d="M${x - 2.2} ${ly + 6}h4.4l-.8 -5.2h-2.8z" fill="#ffd27a" stroke="#2a1a0a" stroke-width=".45"/><path d="M${x - 2.6} ${ly + .8}h5.2l-2.6 -2.4z" fill="#2a1a0a"/>`
          + K.localGlow(u, { x, y: ly + 3, color: '#ffc060', power: .75, radius: 10 }); }
      // two tiers of gallery windows, warm light in most, a dark one; the balustrade between; quarter galleries
      for (const [y, h] of [[85, 8], [97, 7.4]]) { hull += `<rect x="${X - 19}" y="${y - 1.2}" width="38" height="${h + 2.4}" fill="#0c0a08"/>`;
        for (let i = 0; i < 6; i++) { const x = X - 17.4 + i * 6, lit = !(y === 97 && i === 4), g = nid('wn', u);
          hull += `<defs>${linGrad(g, 0, y, 0, y + h, [[0, lit ? '#ffe6a0' : '#2a2a36'], [1, lit ? '#e09040' : '#14141c']])}</defs><rect x="${f(x)}" y="${y}" width="4.8" height="${h}" rx=".8" fill="url(#${g})"/><path d="M${f(x + 2.4)} ${y}v${h}M${f(x)} ${f(y + h / 2)}h4.8" stroke="#3a2410" stroke-width=".35"/>`; }
        hull += ln(`M${X - 20} ${y + h + 1.4}H${X + 20}`, .9, '#c99a40', .9); }
      hull += [-18, -12, -6, 0, 6, 12, 18].map(k => ln(`M${X + k} ${94.2}v2.4`, .5, '#c99a40', .8)).join('');
      for (const s of [-1, 1]) hull += `<path d="M${X + s * 20} 84Q${X + s * 27} 86 ${X + s * 26} 96Q${X + s * 26} 104 ${X + s * 20} 106Z" fill="#1a1a20" stroke="#0a0a0c" stroke-width=".4"/>`
        + `<rect x="${f(X + s * 23 - 1.4)}" y="88" width="2.8" height="5" rx=".6" fill="#f0b860"/><rect x="${f(X + s * 23 - 1.2)}" y="96" width="2.4" height="4.4" rx=".6" fill="#d89040"/>`
        + `<path d="M${X + s * 20} 106Q${X + s * 23} 109 ${X + s * 22} 112" stroke="#c99a40" stroke-width=".6" fill="none"/>`;
      hull += ln(`M${X - 15} 108.6H${X + 15}`, 2.2, '#3a2c18') + ln(`M${X - 15} 107.6H${X + 15}`, .5, '#d8a848', .8);
      // the rudder down the middle into the water, the moon's rim on the left side of the hull
      hull += `<path d="M${X - 2} 110h4l.6 ${WL - 110}h-5.2z" fill="#121216" stroke="#050506" stroke-width=".35"/><path d="M${X - 1.4} 112v${WL - 113}" stroke="#4a5068" stroke-width=".4"/>`
        + ln(`M${X - 25} 84Q${X - 33} 96 ${X - 33.5} 106Q${X - 33} 120 ${X - 26} ${WL}`, .9, '#c4d4ec', .65);
      hull += K.localGlow(u, { x: X, y: 94, color: '#ffb050', power: .45, radius: 26 }, { core: false }); }

    // ——— the fire out of both sides at the same instant: two big flashes, two smaller ones further forward
    let fire = '';
    // the blast's smoke: big pale billows rolled out level from each side towards its enemy, lit warm by the flash
    // near the muzzle, cooler grey and thinner out towards the target, a darker underside
    { const pg = nid('pp', u), pb = nid('pb', u), pd = nid('pd', u);
      fire += `<defs><radialGradient id="${pg}" cx=".42" cy=".36" r=".64"><stop offset="0" stop-color="#fffaf0"/><stop offset=".4" stop-color="#ece6dc" stop-opacity=".97"/><stop offset=".78" stop-color="#b4b6be" stop-opacity=".9"/><stop offset="1" stop-color="#7a7e8c" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a3e4c" stop-opacity=".5"/><stop offset="1" stop-color="#3a3e4c" stop-opacity="0"/></radialGradient><filter id="${pb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`;
      for (const sd of [-1, 1]) { const Rp = rng(sd + 40); let sh = '', bl = '';
        for (let i = 0; i < 12; i++) { const t = i / 11, x = X + sd * (35 + t * 29 + (Rp() - .5) * 2), r = 3.4 + t * 7.6 + Rp() * 1.6;
          for (const dy of [-r * .45, r * .3]) { const y = 104.5 - t * 3 + dy + (Rp() - .5) * 2, rr = r * (.7 + Rp() * .35);
            sh += `<circle cx="${f(x + sd * 1)}" cy="${f(y + rr * .45)}" r="${f(rr)}" fill="url(#${pd})"/>`;
            bl += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="url(#${pg})" opacity="${f(.97 - t * .3)}"/>`; } }
        fire += sh + `<g filter="url(#${pb})">${bl}</g>`; }
      fire += K.localGlow(u, { x: X - 44, y: 104, color: '#ffc070', power: .55, radius: 16 }, { core: false }) + K.localGlow(u, { x: X + 44, y: 104, color: '#ffc070', power: .55, radius: 16 }, { core: false }); }
    // the fire out of both sides at the same instant: two big flashes, two smaller ones further forward, a ball of
    // flame at each muzzle (white heart, gold, orange edge)
    for (const g of GUN) { const s = (g.s || 1) * 1.5, dx = g.dir === 0 || g.dir < 90 ? 1 : -1, fb = nid('fb', u), cx = g.x + dx * 5 * s;   // 1.5: the flashes half as big again
      fire += `<defs>${radGrad(fb, cx, g.y, 9 * s, [[0, '#ffffff', 1], [.18, '#fff2b0', 1], [.4, '#ffd040', .95], [.66, '#ff8a1e', .7], [1, '#ff5a10', 0]])}</defs><circle cx="${f(cx)}" cy="${f(g.y)}" r="${f(9 * s)}" fill="url(#${fb})"/>`
        + K.muzzleFlash(u, { x: g.x + dx * .6, y: g.y, dir: g.dir, len: 23 * s, seed: g.s ? 0 : 1, smoke: false })
        + K.localGlow(u, { x: g.x + dx * 8 * s, y: g.y, color: '#ffc070', power: .9 * Math.min(1, s), radius: 22 * s }); }
    // the light of the flashes on the water under them
    fire += K.localGlow(u, { x: 54, y: 124, color: '#ffb050', power: .5, radius: 26 }, { squash: .3, core: false }) + K.localGlow(u, { x: 146, y: 124, color: '#ffb050', power: .5, radius: 26 }, { squash: .3, core: false });

    // ——— the water at her stern: foam at the waterline, the wake spreading back towards us
    let wake = K.foam(u, { x: X, y: WL + .4, w: 58, h: 1.8, seed: 3, L });
    for (let k = 0; k < 22; k++) { const y = WL + 4 + k * 6.6, w = 14 + k * 3.2, x = X + (R() - .5) * (10 + k * 2.4); wake += K.foam(u, { x, y, w, h: .8 + k * .08, seed: 30 + k, L }); }
    { const g = nid('dk', u); wake += `<defs>${linGrad(g, 0, 150, 0, 290, [[0, '#02060c', 0], [1, '#02060c', .55]])}</defs><rect x="0" y="150" width="200" height="140" fill="url(#${g})"/>`; }
    return [bg, rig + hull + wake + fire];
  } };
