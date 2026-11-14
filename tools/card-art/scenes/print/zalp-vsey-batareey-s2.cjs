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
// Light: the sun behind us, high on the left (key); the flashes (orange, local) warm the side and the smoke.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, radGrad, linGrad, rng } = K;

const HZ = 112, WL = 132, SX = 113, SS = 1.04;   // the horizon; her waterline, the middle of it, her scale
const light = { time: 'day', haze: .25, key: { type: 'sun', az: 228, el: 30, color: '#fff2d6', power: 1 }, fill: { color: '#8db8e0', power: .5 },
  locals: [{ x: 70, y: 122, color: '#ffb060', power: .45, radius: 34 }, { x: 112, y: 122, color: '#ffb060', power: .45, radius: 34 }, { x: 150, y: 122, color: '#ffb060', power: .45, radius: 30 }] };
const skel = { horizon: HZ, eye: 7.7, light: 'the sun behind us high on the left (key); the orange flashes along her side (local)', items: [
  ['ship', 8, WL, 184, 122, 'water: her waterline y 132, broadside, bow to the left'],
  ['flashes', 54, 117, 108, 13, 'her three rows of ports (y 117 / 123 / 128)'],
  ['smoke band', 44, 118, 140, 17, 'rolled out of her ports along her side, drifting left with the wind'],
  ['far ships', 6, 112.6, 190, 12, 'on the horizon, hull-down']] };

// the gun ports of the kit's Endeavour (SHIP_SPECS.endeavour.ports, ship.cjs: the rows staggered by half a pitch, the
// height following the sheer) -> picture points
function ports() {
  const sp = K.SHIP_SPECS.endeavour, hb = sp.len / 2, out = [];
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  sp.ports.forEach((row, ri) => { const pitch = (row.x1 - row.x0) / (row.n - 1), off = ri % 2 ? pitch / 2 : 0;
    for (let i = 0; i < row.n; i++) { const X = row.x0 + i * pitch + off; if (X > row.x1 + pitch * .4) continue;
      const H = row.h + sheer(X) * Math.min(1.25, row.h / sp.free) + row.w * .45;
      if (X > 30 && H > 12) continue;   // the quarter gallery: no port under it
      out.push({ x: SX + SS * X, y: WL - SS * H, row: ri, i }); } });
  return out;
}

// a gun's burst out of a port seen from the side, close to head-on: an orange heart (4-6 units), a ragged dark-red
// rim, and a short white blast thrown out of the port towards us and down the wind; k — size, seed — its own shape
function burst(u, x, y, k, seed) {
  const r = rng(70 + seed), g = nid('zb', u), gw = nid('zw', u), n = 7 + seed % 3, tw = (r() - .5) * .8;
  const pts = Array.from({ length: n * 2 }, (_, j) => { const a = j / (n * 2) * Math.PI * 2 + tw, rr = (j % 2 ? 1.7 + r() * .4 : 2.3 + r() * .9) * k;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8]; });
  // the white blast: a short tongue out of the port, down and a little left, widening and fading
  const d = [-.45 - r() * .2, .9], L = (4.2 + r() * 1.6) * k, nx = -d[1], ny = d[0], tx = x + d[0] * L, ty = y + d[1] * L, w = 1.6 * k;
  return `<defs>${radGrad(g, x, y, 3.6 * k, [[0, '#fffbe6'], [.28, '#ffd860'], [.6, '#ff8a24'], [.86, '#d0400e'], [1, '#7a1606']])}`
    + `${linGrad(gw, x, y, tx, ty, [[0, '#ffffff', .95], [.6, '#fff4dc', .7], [1, '#f2ece0', 0]])}</defs>`
    + K.localGlow(u, { x, y, color: '#ffb050', power: .6, radius: 8 * k })
    + `<path d="M${f(x + nx * .8 * k)} ${f(y + ny * .8 * k)}Q${f(x + d[0] * L * .55 + nx * w)} ${f(y + d[1] * L * .55 + ny * w)} ${f(tx)} ${f(ty)}Q${f(x + d[0] * L * .55 - nx * w)} ${f(y + d[1] * L * .55 - ny * w)} ${f(x - nx * .8 * k)} ${f(y - ny * .8 * k)}Z" fill="url(#${gw})"/>`
    + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${g})"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.3 * k)}" ry="${f(1 * k)}" fill="#fffdf0"/>`
    + Array.from({ length: 3 }, () => `<circle cx="${f(x + (r() - .6) * 8 * k)}" cy="${f(y + (r() - .3) * 5 * k)}" r="${f(.2 + r() * .22)}" fill="#ffe08a"/>`).join('');
}

module.exports = { name: 'Залп всей батареей', variant: 's2', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 7.7 });
    L.pal = Object.assign({}, L.pal, { sky: ['#2f6aa8', '#5f98cc', '#a8cbe4', '#eee6cc'], sea: ['#7eb0c4', '#2f6a84', '#0f2f3e'] });
    const R = rng(17);
    // ——— the fair sky: a few cumulus lit from behind us, gulls; the sea
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[40, 40, 62, 12, 3, .05], [168, 58, 56, 10, 8, .2], [96, 84, 70, 7, 12, .45], [20, 98, 40, 5, 5, .6], [186, 100, 30, 4, 14, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 7, glitter: false });
    bg += PK.gulls([[30, 64, 1.1], [42, 58, .8], [176, 76, .9]], '#3a4a58');
    // ——— the far ships hull-down on the horizon: the ones she fires at stand with us out of the frame; these two are
    // the rest of the line, grey in the haze
    bg += K.ship(u, L, { kind: 'pearl', x: 20, y: HZ + .6, scale: .12, detail: 'far', flip: true, seed: 3 })
      + K.ship(u, L, { kind: 'revenge', x: 188, y: HZ + .6, scale: .13, detail: 'far', seed: 5 });

    // ——— her: broadside to us, bow to the left, every port open, the guns run out
    let fg = K.ship(u, L, { kind: 'endeavour', x: SX, y: WL, scale: SS, sails: 'full', seed: 4 });
    fg += K.foam(u, { x: SX - 6, y: WL + .3, w: 116, h: 1.2, seed: 5, L });

    // ——— the smoke: out of each port a billow rolling towards us and down the wind (to the left, as her flags fly),
    // merging below into one bank that lies on the water in front of her hull; lit by the sun from the left and above,
    // warm next to the flashes, a cooler shaded underside
    const P = ports();
    { const pg = nid('zp', u), pd = nid('zd', u), pf = nid('zf', u);
      fg += `<defs><radialGradient id="${pg}" cx=".38" cy=".34" r=".66"><stop offset="0" stop-color="#fffdf6"/><stop offset=".45" stop-color="#eeeae2" stop-opacity=".97"/><stop offset=".8" stop-color="#b8bcc4" stop-opacity=".88"/><stop offset="1" stop-color="#8a909c" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4a5260" stop-opacity=".5"/><stop offset="1" stop-color="#4a5260" stop-opacity="0"/></radialGradient>`
        + `<filter id="${pf}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".6"/></filter></defs>`;
      // a billow out of every port, drifting left and spreading as it goes
      let sh = '', bl = '';
      for (const p of P) { const k = .7 + R() * .4;
        for (let j = 0; j < 4; j++) { const x = p.x - 1.6 - j * 2.6 * k + (R() - .5), y = Math.max(117, p.y + .4 - j * .9 + (R() - .5) * .8), r = (1.6 + j * 1.0) * k;
          if (j === 3) sh += `<circle cx="${f(x + .6)}" cy="${f(y + r * .5)}" r="${f(r)}" fill="url(#${pd})"/>`;
          bl += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${pg})" opacity="${f(.8 - j * .1)}"/>`; } }
      { const gb = nid('zbd', u); fg += `<defs>${linGrad(gb, 0, 115, 0, 134, [[0, '#e8e6e0', 0], [.35, '#e4e2dc', .55], [.8, '#c8ccd2', .6], [1, '#9aa2ac', 0]])}</defs>`
        + `<path d="M44 126Q70 114 104 116T176 118Q184 124 178 132Q120 136 50 133Q38 130 44 126Z" fill="url(#${gb})" filter="url(#${pf})"/>`; }
      fg += sh + `<g filter="url(#${pf})">${bl}</g>`;
      // the warm light of the flashes in the smoke
      fg += K.localGlow(u, { x: 108, y: 128, color: '#ffb060', power: .55, radius: 60 }, { squash: .3, core: false }); }

    // ——— the flashes: fewer and larger — every other gun of the upper row and a few of the lower ones, each burst
    // its own shape (the rest of the guns are lost in their own smoke)
    const ry = ri => { const q = P.filter(p => p.row === ri); return q.reduce((a, p) => a + p.y, 0) / q.length; };
    const rows = [...new Set(P.map(p => p.row))].sort((a, b) => ry(a) - ry(b)), top = rows[0], bot = rows[rows.length - 1];
    const fire = P.filter(p => (p.row === top && p.i % 2 === 0) || (p.row === bot && p.i % 4 === 1));
    for (const p of fire) fg += burst(u, p.x, p.y, (p.row === top ? 1.55 : 1.35) * (.9 + R() * .2), p.row * 20 + p.i);
    // the three lines of fire read as one band along her side
    for (const y of [117.6, 123, 128.2]) fg += K.localGlow(u, { x: 106, y, color: '#ffb050', power: .35, radius: 58 }, { squash: .07, core: false });
    // the light of the flashes on the water under her
    fg += K.localGlow(u, { x: 106, y: 152, color: '#ffb050', power: .35, radius: 50 }, { squash: .25, core: false });

    // ——— under the glass: the sea darkening towards us
    { const g = nid('dk', u); fg += `<defs>${linGrad(g, 0, 160, 0, 290, [[0, '#06141c', 0], [1, '#06141c', .55]])}</defs><rect x="0" y="160" width="200" height="130" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
