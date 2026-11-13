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
// Light: the sun behind us, high on the left (key); the flashes (orange, local) warm the side and the smoke.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, radGrad, linGrad, rng } = K;

const HZ = 112, WL = 132, SX = 112.4, SS = 1.1;   // the horizon; her waterline, the middle of it, her scale
const light = { time: 'day', haze: .25, key: { type: 'sun', az: 228, el: 30, color: '#fff2d6', power: 1 }, fill: { color: '#8db8e0', power: .5 },
  locals: [{ x: 70, y: 122, color: '#ffb060', power: .45, radius: 34 }, { x: 112, y: 122, color: '#ffb060', power: .45, radius: 34 }, { x: 150, y: 122, color: '#ffb060', power: .45, radius: 30 }] };
const skel = { horizon: HZ, eye: 7.7, light: 'the sun behind us high on the left (key); the orange flashes along her side (local)', items: [
  ['ship', 8, WL, 184, 122, 'water: her waterline y 132, broadside, bow to the left'],
  ['flashes', 54, 117, 108, 13, 'her three rows of ports (y 117 / 123 / 128)'],
  ['smoke bank', 20, 150, 170, 26, 'on the water in front of her hull, drifting left with the wind'],
  ['far ships', 6, 112.6, 190, 12, 'on the horizon, hull-down'],
  ['splashes', 22, 152, 170, 30, 'water between her and us: the shots that fall short']] };

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

// a burst out of a port seen head-on: an uneven star of tongues (dark red edge, orange body), a white-yellow heart,
// sparks; k — size, each one its own shape from its seed (the first-round burst, kept and tuned)
function burst(u, x, y, k, seed) {
  const r = rng(70 + seed), g = nid('zb', u), n = 8 + seed % 3, tw = (r() - .5) * .8;
  const pts = Array.from({ length: n * 2 }, (_, j) => { const a = j / (n * 2) * Math.PI * 2 + tw, rr = (j % 2 ? 1.3 + r() * .5 : 2.6 + r() * 3.4) * k * (Math.sin(a) < -.3 ? .7 : 1) * (Math.cos(a) < 0 ? 1.25 : .95);
    return [x + Math.cos(a) * rr * 1.15, y + Math.sin(a) * rr * .85]; });
  return `<defs>${radGrad(g, x, y, 6.6 * k, [[0, '#fffbe6'], [.3, '#ffe27a'], [.62, '#ff8a24'], [.9, '#c8320c'], [1, '#7a1606']])}</defs>`
    + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${g})"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.5 * k)}" ry="${f(1.05 * k)}" fill="#fffdf0"/>`
    + Array.from({ length: 4 }, () => `<circle cx="${f(x + (r() - .6) * 12 * k)}" cy="${f(y + (r() - .5) * 6 * k)}" r="${f(.18 + r() * .25)}" fill="#ffe08a"/>`).join('');
}

module.exports = { name: 'Залп всей батареей', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
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
    // the bank on the water: low wide bodies of smoke rolled out of the lower ports, lying along her side and
    // drifting left, their tops warm next to the flashes
    for (const [x, y, w, h, sd, op] of [[186, 152, 30, 16, 3, .8], [160, 152, 40, 20, 4, .86], [130, 154, 44, 22, 6, .9], [100, 154, 46, 24, 8, .9], [70, 152, 44, 24, 9, .9], [42, 150, 40, 22, 11, .86], [16, 148, 34, 18, 13, .8]])
      fg += K.smoke(u, L, { x, y, w, h, wind: -.45, seed: sd, opacity: op, glow: { color: '#ffb050', power: .35 } });
    { const pg = nid('zp', u), pd = nid('zd', u), pf = nid('zf', u);
      fg += `<defs><radialGradient id="${pg}" cx=".38" cy=".34" r=".66"><stop offset="0" stop-color="#fffdf6"/><stop offset=".45" stop-color="#eeeae2" stop-opacity=".97"/><stop offset=".8" stop-color="#b8bcc4" stop-opacity=".88"/><stop offset="1" stop-color="#8a909c" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4a5260" stop-opacity=".5"/><stop offset="1" stop-color="#4a5260" stop-opacity="0"/></radialGradient>`
        + `<filter id="${pf}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".6"/></filter></defs>`;
      // a billow out of every port, drifting left and spreading as it goes
      let sh = '', bl = '';
      for (const p of P) { const k = .7 + R() * .4;
        for (let j = 0; j < 3; j++) { const x = p.x - 2.2 - j * 2.4 * k + (R() - .5), y = p.y + 1.2 + j * 1.1 + (R() - .5) * .8, r = (1.1 + j * 1.1) * k;
          if (j === 2) sh += `<circle cx="${f(x + .6)}" cy="${f(y + r * .5)}" r="${f(r)}" fill="url(#${pd})"/>`;
          bl += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${pg})" opacity="${f(.85 - j * .12)}"/>`; } }
      fg += sh + `<g filter="url(#${pf})">${bl}</g>`;
      // the warm light of the flashes in the smoke
      fg += K.localGlow(u, { x: 108, y: 128, color: '#ffb060', power: .55, radius: 60 }, { squash: .3, core: false }); }

    // ——— the flashes: every gun of the three rows at once, a straight line along each row (even intervals, each
    // burst its own shape), the upper rows a touch smaller
    for (const p of P) fg += burst(u, p.x, p.y, (p.row === 0 ? .7 : p.row === 1 ? .66 : .6) * (.9 + R() * .22), p.row * 20 + p.i);
    for (const p of P) if (p.i % 3 === 1) fg += K.localGlow(u, { x: p.x, y: p.y, color: '#ffc070', power: .55, radius: 9 });
    // the light of the flashes on the water under her
    fg += K.localGlow(u, { x: 106, y: 152, color: '#ffb050', power: .35, radius: 50 }, { squash: .25, core: false });

    // ——— the shots that fall short: columns of water between her and us
    fg += K.splash(u, { x: 28, y: 158, w: 14, h: 30, seed: 3, L, wind: -1 }) + K.splash(u, { x: 176, y: 154, w: 12, h: 26, seed: 7, L, wind: -1 })
      + K.splash(u, { x: 58, y: 166, w: 14, h: 32, seed: 5, L, wind: -1 });
    // ——— under the glass: the sea darkening towards us
    { const g = nid('dk', u); fg += `<defs>${linGrad(g, 0, 160, 0, 290, [[0, '#06141c', 0], [1, '#06141c', .55]])}</defs><rect x="0" y="160" width="200" height="130" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
