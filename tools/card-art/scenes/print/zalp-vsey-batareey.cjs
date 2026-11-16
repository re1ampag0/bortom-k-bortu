// «Залп всей батареей» (Индевор, ЗАРЯД: этот Залп наносит +3 урона), refined from the first-round scene
// (portrait-endeavour.cjs SCENES['Залп всей батареей']): the Company's ship of the line broadside to us fires her whole
// battery at once — three decks of guns, one order: a straight line of flashes along every row of ports at even
// intervals (each flash of its own shape), the smoke rolling out of the ports and lying on the water as a wall, the
// shots that fall short raising columns of water between her and us. Day, cream-white sails, a fair sky.
// Fixed against the first round: the sprite ship had one row of ports and every other one fired — now the kit's
// Endeavour with her three rows of 15 ports, and every gun fires (brief: «все пушки стреляют разом»); the smoke was a
// row of grey blobs under the hull — now billows out of each port drifting down the wind and one bank on the water;
// the sun stood in the sky ahead and still lit her side from the front — now it is behind us on the left, so her side,
// her sails and the smoke are lit and the flashes burn against the dark hull; the far ships were cut sprites — now
// kit ships hull-down on the horizon; the bottom (under the glass) is quiet water.
// Second pass (review): fewer but larger flashes (an orange heart and a short white blast) along the upper row and
// a few on the lower; the smoke rises as a band straight out of the ports; the short splashes in front are gone; the
// ship a touch smaller (the mizzen royal clear of the corner medal, the jibs clear of the left edge).
// Step 3 (the user): fire from ALL the ports at once — every port of the three rows (15 + 14 + 15, positions by the
// kit's own rule for SHIP_SPECS.endeavour) and the five guns of the open deck flash together, each with its billow
// of smoke; the bursts compact, so the three rows read as strict lines; details: the fire mirrored on the water under
// the lower row, the flashes' light under the courses, gulls put up by the noise.
// Step 3, review: at card size the bursts were a speckled band — each flash now ~1.6× with a white-hot tongue thrown out
// of the port, down and aside, past her side; the halo softer so the fires read one by one on the strict grid; from
// every port a billow blown aside and up to her rail — a wall of smoke over her side, translucent, bow and stern clear.
// Print review: ~60 flashes in a solid grid of 4–5 rows, off the ports, the lowest row below her waterline in the
// smoke — read as glitter. Now ONE flash per real gunport of the three gun decks (none on the open deck), each a compact
// ball of fire on its port with a short tongue down the wind (no tongue thrown down past her side, no embers, no fire
// mirrored on the water), so the three rows read as three strict lines on her ports; the smoke: a puff beside each
// port of the lower two rows, the billows of the upper row rising to her rail, and the bank lying on the water in front
// of her side, drawn over her waterline and kept below the lowest row of ports.
// User's choice (print): between the two — the smoke of the chosen picture (a billow from every port up to her rail and
// the bank on the water), the flashes only on the real ports of her three gun decks but bigger and denser than in the
// print-review pass (the bursts of a row touch, a strong blast down the wind), cut at her waterline; no fire in the air
// (no deck guns, no embers) and none on the water.
// Light: the sun behind us, high on the left (key); the flashes (orange, local) warm the side and the smoke.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, radGrad, linGrad, rng } = K;

const HZ = 112, WL = 132, SX = 113, SS = 1.04, RAIL = 107.5;   // the horizon; her waterline, the middle of it, her scale; her rail amidships
const light = { time: 'day', haze: .25, key: { type: 'sun', az: 228, el: 30, color: '#fff2d6', power: 1 }, fill: { color: '#8db8e0', power: .5 },
  locals: [{ x: 70, y: 122, color: '#ffb060', power: .45, radius: 34 }, { x: 112, y: 122, color: '#ffb060', power: .45, radius: 34 }, { x: 150, y: 122, color: '#ffb060', power: .45, radius: 30 }] };
const skel = { horizon: HZ, eye: 7.7, light: 'the sun behind us high on the left (key); the orange flashes along her side (local)', items: [
  ['ship', 8, WL, 184, 122, 'water: her waterline y 132, broadside, bow to the left'],
  ['flashes', 54, 117, 108, 13, 'on her three rows of ports (y 117 / 123 / 128), one per port, above the waterline'],
  ['smoke band', 44, 118, 140, 17, 'rolled out of her ports along her side up to her rail, drifting left with the wind'],
  ['smoke bank', 44, 140, 140, 17, 'on the water along her waterline'],
  ['far ships', 6, 112.6, 190, 12, 'on the horizon, hull-down']] };

// the gun ports of the kit's Endeavour -> picture points: the same rule as ship.cjs build() (SHIP_SPECS.endeavour: three
// rows of 15 at h 3.6 / 8.8 / 14, the odd row shifted half a pitch and its last port dropped past x1, each row on a line
// along the sheer; the guns of the open deck at deckPortH, none under the channels of the shrouds or by the stern)
function ports() {
  const sp = K.SHIP_SPECS.endeavour, hb = sp.len / 2, out = [], cl = (v, a, b) => Math.max(a, Math.min(b, v)), sm = t => { t = cl(t, 0, 1); return t * t * (3 - 2 * t); };
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  const Y = (h, X) => h + sheer(X) * cl(h / sp.free, 0, 1.25), xAft = hb + sp.over;
  const baseTop = X => sp.free + sp.fc[1] * (1 - sm((X - sp.fc[0] + 1.4) / 2.8)) + sp.tiers.reduce((a, t) => a + t[1] * sm((X - t[0] + 1.4) / 2.8), 0) + sp.taff * sm((X - xAft + 3.5) / 3.5);
  const rail = X => Y(baseTop(X), X), hTop = rail(xAft), hC = Y(sp.free * sp.counter, hb), xC = hb + sp.over * .3, kT = (xAft - xC) / (hTop - hC);
  const gal = sp.gallery, gh0 = hC + .7, gh1 = gh0 + gal[1] * gal[2], gx0 = xC + kT * (gh0 - hC) - gal[0];
  sp.ports.forEach((row, ri) => { const pitch = (row.x1 - row.x0) / (row.n - 1), off = row.off != null ? row.off * pitch : ri % 2 ? pitch / 2 : 0, w = row.w || 2;
    for (let i = 0; i < row.n; i++) { const X = row.x0 + i * pitch + off, H = Y(row.h, X);
      if (X > row.x1 + pitch * .4 || (X > gx0 - w && H > gh0 - 3)) continue;
      out.push({ X, x: SX + SS * X, y: WL - SS * H, row: ri, i }); } });
  const dp = sp.deckPorts; for (let i = 0; i < dp[0]; i++) { const X = dp[1] + (dp[2] - dp[1]) * i / Math.max(1, dp[0] - 1);
    if (Math.abs(rail(X + 1.6) - rail(X - 1.6)) > .7 || X > gx0 - 1 && rail(X) - 1.6 < gh1 + 2.6) continue;
    if (sp.masts.some(m => X > m.x - 1 && X < m.x + 2.4 + .072 * sp.len * cl(m.k, .75, 1.05))) continue;
    out.push({ X, x: SX + SS * X, y: WL - SS * Y(sp.deckPortH, X), row: 'deck', i }); }
  return out;
}

// a gun's burst out of a port seen from the side, close to head-on: a big ragged ball of fire (white heart, gold, orange,
// a dark-red rim) on its port, its spikes touching the neighbours' so each row reads as one dense line of fire, with a
// strong white blast thrown out of the port down the wind (to the left) and only a little down, so it stays above her
// waterline; no embers (nothing burning in the air). k — size, seed — its own shape (lobes, twist, the blast)
function burst(u, x, y, k, seed) {
  const r = rng(70 + seed * 3), g = nid('zb', u), gw = nid('zw', u), gh = nid('zh', u), n = 5 + seed % 3, tw = r() * Math.PI, sq = .8 + r() * .12;
  // the ball of fire: lobes of different size joined by soft curves (not a star)
  const pts = Array.from({ length: n }, (_, j) => { const a = j / n * Math.PI * 2 + tw + (r() - .5) * .5, rr = (1.6 + r() * .95) * k; return [Math.cos(a) * rr, Math.sin(a) * rr * sq]; });
  const lobe = pts.map((p, j) => { const q = pts[(j + 1) % n], m = [(p[0] + q[0]) * .36, (p[1] + q[1]) * .36]; return [p, m]; });
  const d = `M${f(x + lobe[0][1][0])} ${f(y + lobe[0][1][1])}` + lobe.map((_, j) => { const [p] = lobe[(j + 1) % n], m = lobe[(j + 1) % n][1]; return `Q${f(x + p[0] * 1.25)} ${f(y + p[1] * 1.25)} ${f(x + m[0])} ${f(y + m[1])}`; }).join('') + 'Z';
  const ba = 2.75 + r() * .2, bd = [Math.cos(ba), Math.sin(ba)], BL = (4.4 + r() * 1.4) * k, nx = -bd[1], ny = bd[0], tx = x + bd[0] * BL, ty = y + bd[1] * BL, w = 1.05 * k;
  return `<defs>${radGrad(g, x, y, 2.8 * k, [[0, '#fffbe6'], [.25, '#ffe88a'], [.52, '#ffb038'], [.8, '#f06a1e', .92], [1, '#d04a14', .58]])}`
    + `${radGrad(gh, x, y, 4 * k, [[0, '#ff9a3a', .34], [.55, '#e87a3a', .12], [1, '#c8a080', 0]])}`
    + `${linGrad(gw, x, y, tx, ty, [[0, '#fffbe0', 1], [.3, '#ffe070', 1], [.7, '#ff9a30', .8], [1, '#ff7a20', 0]])}</defs>`
    + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4 * k)}" fill="url(#${gh})"/>`
    + `<path d="M${f(x + nx * .8 * k)} ${f(y + ny * .8 * k)}Q${f(x + bd[0] * BL * .5 + nx * w)} ${f(y + bd[1] * BL * .5 + ny * w)} ${f(tx)} ${f(ty)}Q${f(x + bd[0] * BL * .5 - nx * w)} ${f(y + bd[1] * BL * .5 - ny * w)} ${f(x - nx * .8 * k)} ${f(y - ny * .8 * k)}Z" fill="url(#${gw})"/>`
    + `<path d="${d}" fill="url(#${g})"/>`
    + `<ellipse cx="${f(x + (r() - .5) * .3)}" cy="${f(y)}" rx="${f(.8 * k)}" ry="${f(.62 * k)}" fill="#fffdf2"/><ellipse cx="${f(x + bd[0] * .9 * k)}" cy="${f(y + bd[1] * .9 * k)}" rx="${f(.5 * k)}" ry="${f(.36 * k)}" fill="#fffbe8" opacity=".85"/>`;
}

module.exports = { name: 'Залп всей батареей', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 7.7 });
    L.pal = Object.assign({}, L.pal, { sky: ['#2f6aa8', '#5f98cc', '#a8cbe4', '#eee6cc'], sea: ['#7eb0c4', '#2f6a84', '#0f2f3e'] });
    const R = rng(17);
    // ——— the fair sky: a few cumulus lit from behind us, gulls; the sea
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[40, 40, 62, 12, 3, .05], [168, 58, 56, 10, 8, .2], [96, 84, 70, 7, 12, .45], [20, 98, 40, 5, 5, .6], [186, 100, 30, 4, 14, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 7, glitter: false });
    bg += PK.gulls([[30, 64, 1.1], [42, 58, .8], [176, 76, .9], [186, 70, .7], [168, 84, .6]], '#3a4a58');   // gulls put up by the noise, off to the right
    // ——— the far ships hull-down on the horizon: the ones she fires at stand with us out of the frame; these two are
    // the rest of the line, grey in the haze
    bg += K.ship(u, L, { kind: 'pearl', x: 20, y: HZ + .6, scale: .12, detail: 'far', flip: true, seed: 3 })
      + K.ship(u, L, { kind: 'revenge', x: 188, y: HZ + .6, scale: .13, detail: 'far', seed: 5 });

    // ——— her: broadside to us, bow to the left, every port open, the guns run out
    let fg = K.ship(u, L, { kind: 'endeavour', x: SX, y: WL, scale: SS, sails: 'full', seed: 4 });
    fg += K.foam(u, { x: SX - 6, y: WL + .3, w: 116, h: 1.2, seed: 5, L });

    // ——— the smoke (as in the chosen picture): out of every port of the three gun decks a billow rolling out and down
    // the wind (to the left, as her flags fly) up to her rail, merging below into a low bank on the water in front of her
    // hull; lit by the sun from the left and above, warm next to the flashes, a cooler shaded underside
    const P = ports().filter(p => p.row !== 'deck');   // the three gun decks only: one flash per real port
    { const pg = nid('zp', u), pd = nid('zd', u), pf = nid('zf', u);
      fg += `<defs><radialGradient id="${pg}" cx=".38" cy=".34" r=".66"><stop offset="0" stop-color="#fffdf6"/><stop offset=".36" stop-color="#e2ded6" stop-opacity=".98"/><stop offset=".74" stop-color="#959aa6" stop-opacity=".94"/><stop offset="1" stop-color="#6a707e" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a4250" stop-opacity=".6"/><stop offset="1" stop-color="#4a5260" stop-opacity="0"/></radialGradient>`
        + `<filter id="${pf}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".35"/></filter></defs>`;
      // the bank on the water first: low billows along her waterline from her quarter to under her bow, thicker
      // and lower near us, drifting left
      let bank = '', bsh = '';
      { const Rb = rng(53); for (let x = 176; x > 46; x -= 2.6 + Rb() * 3.4) { const t = (176 - x) / 130, big = Rb(), r = 2.2 + big * big * 4.6 + t * 1.4, y = WL + 1.8 - r * .35 - Rb() * 1.6 + t * .6;
          bsh += `<circle cx="${f(x + .8)}" cy="${f(y + r * .55)}" r="${f(r)}" fill="url(#${pd})"/>`;
          bank += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${pg})" opacity="${f(.72 - t * .25)}"/>`;
          // now and then a billow climbs out of the bank
          if (Rb() < .3) bank += `<circle cx="${f(x - r * .4)}" cy="${f(y - r * .9)}" r="${f(r * .6)}" fill="url(#${pg})" opacity="${f(.55 - t * .2)}"/>`; } }
      fg += bsh + `<g filter="url(#${pf})">${bank}</g>`;
      // a billow out of every port, blown aside (left, down the wind) and up as far as her rail, swelling as it goes:
      // together they stand as a wall of smoke over her side; translucent, so her wales and the rail still show through
      let sh = '', bl = '';
      for (const p of P) { const k = .9 + R() * .2, top = RAIL - 2 + R() * 2, n = 7;
        for (let j = 0; j < n; j++) { const t = j / (n - 1), x = p.x - .8 - t * (11 + R() * 3) * k + (R() - .5) * .8, y = p.y - t * (p.y - top) * (.85 + R() * .2) + (R() - .5) * .6, r = (1.7 + t * t * 4.2 + t * .8) * k * (.9 + R() * .2);
          if (j >= n - 2) sh += `<circle cx="${f(x + .6)}" cy="${f(y + r * .55)}" r="${f(r)}" fill="url(#${pd})"/>`;
          bl += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${pg})" opacity="${f(.8 - t * .18)}"/>`; } }
      fg += `<g opacity=".94">${sh}<g filter="url(#${pf})">${bl}</g></g>`;
      // the warm light of the flashes in the smoke and up under the courses
      fg += K.localGlow(u, { x: 108, y: 126, color: '#ffb060', power: .55, radius: 60 }, { squash: .3, core: false })
        + K.localGlow(u, { x: 112, y: 100, color: '#ffc070', power: .18, radius: 50 }, { squash: .22, core: false }); }

    // ——— the flashes: EVERY gun of the three gun decks at once, each on its own port's centre (the strict line, even
    // intervals), each burst its own shape, big enough that the bursts of a row touch; the lower decks carry the heavier
    // guns. Nothing on the open deck above (no fire in the air), and the fire is cut at her waterline (none below it)
    { const SIZE = { 0: 1.3, 1: 1.36, 2: 1.32 }, ORD = { 2: 0, 1: 1, 0: 2 }, cw = nid('zc', u);
      let fl = '';
      for (const p of P.slice().sort((a, b) => ORD[a.row] - ORD[b.row])) fl += burst(u, p.x, p.y, SIZE[p.row] * (.94 + R() * .12), p.row * 17 + p.i);
      fg += `<defs><clipPath id="${cw}"><rect x="0" y="0" width="200" height="${f(WL - .6)}"/></clipPath></defs><g clip-path="url(#${cw})">${fl}</g>`;
      // the three lines of fire read as one band along her side
      for (const y of [117.2, 122.7, 128.2]) fg += K.localGlow(u, { x: 106, y, color: '#ffb050', power: .32, radius: 60 }, { squash: .07, core: false }); }
    // the light of the flashes on the smoke bank and the water under her
    fg += K.localGlow(u, { x: 106, y: 146, color: '#ffb050', power: .32, radius: 50 }, { squash: .25, core: false });

    // ——— under the glass: the sea darkening towards us
    { const g = nid('dk', u); fg += `<defs>${linGrad(g, 0, 160, 0, 290, [[0, '#06141c', 0], [1, '#06141c', .55]])}</defs><rect x="0" y="160" width="200" height="130" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
