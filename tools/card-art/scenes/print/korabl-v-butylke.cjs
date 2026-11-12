// «Корабль в бутылке» (Месть, Легенда, ПРИКАЗ: вражеский корабль с Корпусом 3 или меньше тонет. Это не Залп).
// Blackbeard's cabin at sunset: on the wall shelves his collection — bottles lying in their cradles, a ship in each;
// on the table the new bottle, big, in its two cradles: inside, on a sea of blue putty, a tiny battered Company ship
// (scorched holes in her sails), and the captain's hand pushes the cork home into the neck. The candle behind the
// bottle is the light of the scene: it shines through the glass, lights the little ship from behind and throws the
// shadows of the bottle and the cradles towards us; the red sunset in the stern window is the rim.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, motes, tableTop } = PK;

const HZ = 48;                                    // eye level = the sea horizon in the window
const WX = 128, WY = -4, WW = 68, WH = 70;         // the window glass
const TB = 104, TF = 150;                         // the table top: back edge, front edge
const BA = [8, 88], BB = [160, 88], BR = 28;   // the new bottle: the axis (base to mouth), the body radius
const CAN = { x: 112, y: TB + 2, s: 2.2, len: 22 };
const flameY = CAN.y - (3.4 + CAN.len + 3) * CAN.s;
const light = { time: 'night', haze: .25, key: { type: 'point', x: CAN.x, y: flameY, z: .12, h: .9, gy: CAN.y, color: '#ffb860', power: 1, radius: 140 },
  fill: { color: '#5a3448', power: .38 }, rim: { az: 20, color: '#ff9a60', power: .45 } };
const lightOut = { time: 'dusk', haze: .45, key: { type: 'sun', x: 146, y: 42, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 } };
const skel = { horizon: HZ, eye: 1.3, light: 'the candle behind the bottle shoulder + the sunset in the window as the rim', items: [
  ['window', WX, WY + WH, WW, WH, 'stern wall'], ['shelf', -2, 50, 124, 6, 'wall brackets'], ['bottles', 2, 50, 118, 18, 'cradles on the shelf'],
  ['bottle', 8, 116, 156, 56, 'two cradles on the table'], ['ship in it', 20, 102, 60, 38, 'putty sea inside'],
  ['candle', 104, TB + 2, 16, 62, 'table, behind the bottle'], ['hand', 156, 92, 44, 60, 'from the upper right edge, fist on the cork']] };

// a smooth path through points
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// ——— KIT-CANDIDATE: a ship-in-a-bottle bottle lying on its side: a long clear body, a short shoulder, a long neck
// with a string rim. Returns the glass (to draw over what is inside) and the clip of the inside.
const PROF = [[0, .9], [.025, 1], [.6, 1], [.66, .9], [.74, .5], [.79, .32], [.93, .3], [.945, .38], [.965, .38], [.975, .31], [1, .31]];
function shipBottle(u, L, A, B, r, o = {}) {
  const g = K.propLathe(u, L, 'glass', A, B, PROF.map(q => [q[0], q[1] * r]), { ell: .2, opacity: o.opacity || .32, spec: [.04, .62], outline: o.outline || .5 });
  return g;
}
// the putty sea inside the bottle: a wavy blue mass along its bottom, white crests painted on
function puttySea(u, A, B, r, top, seed) {
  const R = rng(seed), x0 = A[0] + 1, x1 = A[0] + (B[0] - A[0]) * .66, n = 9, pts = [];
  for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, top + Math.sin(i * 1.7 + seed) * 2.2 + (R() - .5) * 1.6]);
  const d = smooth(pts) + `Q${f(x1 + 5)} ${f(pts[n][1] + 2)} ${f(x1 + 9)} ${f(A[1] + r + 2)}L${f(x0)} ${f(A[1] + r + 2)}Z`, g = nid('ps', u);
  let s = `<defs>${linGrad(g, 0, top - 3, 0, A[1] + r, [[0, '#4a8a96', 1], [.3, '#245a6a', 1], [1, '#10283a', 1]])}</defs><path d="${d}" fill="url(#${g})"/>`;
  s += `<path d="${smooth(pts)}" stroke="#e8f4f8" stroke-width="${f(r * .045)}" stroke-dasharray="${f(r * .5)} ${f(r * .2)} ${f(r * .2)} ${f(r * .3)}" fill="none" stroke-linecap="round" opacity=".7"/>`;
  for (let i = 1; i < n; i += 2) s += `<path d="M${f(pts[i][0] - 3)} ${f(pts[i][1] + 1.6)}q3 -1.6 6 0" stroke="#d8ecf2" stroke-width="${f(r * .025)}" fill="none" opacity=".5"/>`;
  return s;
}
// scorched shot holes in a sail: a ragged dark hole with a burnt brown ring
function holes(list) {
  return list.map(([x, y, s]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 1.3)}" ry="${f(s)}" fill="#5a3010" opacity=".55"/><path d="M${f(x - s * .8)} ${f(y)}l${f(s * .4)} ${f(-s * .7)}l${f(s * .5)} ${f(s * .2)}l${f(s * .5)} ${f(-s * .3)}l${f(s * .2)} ${f(s * .8)}l${f(-s * .5)} ${f(s * .6)}l${f(-s * .7)} ${f(-s * .1)}Z" fill="#1a0c06"/>`).join('');
}
// a cradle for a bottle: an oak block with a round notch on top, standing on (x, y)
function cradle(u, L, x, y, w, h, notchR, seed) {
  const top = y - h, d = `M${f(x - w / 2)} ${f(y)}V${f(top)}H${f(x - notchR)}A${f(notchR)} ${f(notchR * .55)} 0 0 0 ${f(x + notchR)} ${f(top)}H${f(x + w / 2)}V${f(y)}Z`;
  const m = K.mat('oak', L, { form: 'plane', x1: x - w / 2, y1: top, x2: x + w / 2, y2: y, n: 'front', u }), side = [[x + w / 2, y], [x + w / 2 + 3, y - 2], [x + w / 2 + 3, top - 2], [x + w / 2, top]];
  return K.contactShadow(u, x + 1.5, y + .5, w + 4, L, { ry: 1.4, opacity: .6 })
    + K.shadeBox(u, [{ pts: side, n: 'right' }], L, 'oak', { seed })
    + `<defs>${m.defs}</defs><path d="${d}" fill="${m.fill}" stroke="${m.ramp.outline}" stroke-width=".45"/><path d="M${f(x - w / 2 + .6)} ${f(top + .5)}H${f(x - notchR - .4)}M${f(x + notchR + .4)} ${f(top + .5)}H${f(x + w / 2 - .6)}" stroke="${m.ramp.lit}" stroke-width=".5" opacity=".7"/>`
    + `<path d="M${f(x - w / 2 + 1.5)} ${f(y - h * .35)}h${f(w - 3)}" stroke="${m.ramp.outline}" stroke-width=".3" opacity=".4"/>`;
}
// a bottle of the collection with its ship: on the shelf at (cx, shelfY), length len
function trophy(u, L, cx, shelfY, len, kind, seed, flipShip) {
  const r = len * .2, ay = shelfY - 3 - r, A = [cx - len / 2, ay], B = [cx + len / 2, ay], g = shipBottle(u, L, A, B, r, { opacity: .4, outline: .35 });
  const sx = A[0] + len * .32, wl = ay + r * .52, bx = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), sc = Math.min((r * 2 - r * .55 - 1.5) / bx.h, len * .62 / bx.w);
  let s = `<g clip-path="url(#${g.clip})">${puttySea(u, A, B, r, wl, seed)}${K.ship(u, L, { kind, x: sx, y: wl + .4, scale: sc, detail: 'far', flip: flipShip, seed })}</g>`;
  s += g.svg + cradle(u, L, cx - len * .26, shelfY, len * .14, 3.6, r * .5, seed) + cradle(u, L, cx + len * .12, shelfY, len * .14, 3.6, r * .5, seed + 1);
  return s;
}
// a wall shelf: a plank with its lit front edge, two iron brackets under it
function shelf(u, L, x0, x1, y) {
  const g = nid('sh', u);
  return `<defs>${linGrad(g, 0, y, 0, y + 5, [[0, '#a8743e', 1], [.3, '#5a3418', 1], [1, '#24140a', 1]])}</defs>`
    + `<path d="M${x0} ${y - 2.4}H${x1 + 2}L${x1} ${y}H${x0}Z" fill="#6a4424"/><rect x="${x0}" y="${y}" width="${x1 - x0}" height="4.6" fill="url(#${g})" stroke="#140a04" stroke-width=".4"/>`
    + `<rect x="${x0}" y="${y + 4.6}" width="${x1 - x0}" height="5" fill="#0e0804" opacity=".35"/>`
    + [x0 + 22, x1 - 18].map(x => `<path d="M${x} ${y + 4.6}v9l7 -9z" fill="#1a1410" stroke="#0a0806" stroke-width=".4"/><path d="M${x + .6} ${y + 5.2}v6" stroke="#6a5a4a" stroke-width=".4" opacity=".6"/>`).join('');
}

module.exports = { name: 'Корабль в бутылке', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.3 }), Lo = K.makeLight(lightOut, { horizon: HZ });
    // the stern wall: dark planking, warm round the candle, red from the window
    let bg = woodTex(u, 0, 0, 200, TB + 2, '#5a3420', '#2a160c', '#120804', 15, true, 5)
      + K.localGlow(u, { x: CAN.x, y: flameY, color: '#ff9a40', power: .45, radius: 70 }, { core: false });
    // the window: the sun going down red into the sea, the sky on fire, a long glitter path
    { const cid = nid('win', u); let o = K.sky(u, Lo, { horizon: HZ, stars: false, seed: 11, top: WY }) + K.sunMoon(u, Lo, { r: 8 })
        + K.cloud(u, Lo, { x: 146, y: 26, w: 50, h: 7, seed: 4, far: .3 }) + K.cloud(u, Lo, { x: 188, y: 42, w: 34, h: 5, seed: 9, far: .55 }) + K.cloud(u, Lo, { x: 130, y: 50, w: 28, h: 4, seed: 2, far: .7 })
        + K.water(u, Lo, { horizon: HZ, bottom: WY + WH + 2, swell: .35, seed: 6, glitter: 164 });
      // far away a burning sail on the horizon: the last of her prey
      o += K.ship(u, Lo, { kind: 'merchant', x: 180, y: HZ + 2.5, scale: .16, detail: 'far', seed: 3 }) + K.smoke(u, Lo, { x: 180, y: HZ - 3, w: 12, h: 22, wind: .4, seed: 5, opacity: .7 })
        + K.localGlow(u, { x: 180, y: HZ - 1, color: '#ffb050', power: .7, radius: 4 });
      bg += `<defs><clipPath id="${cid}"><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}"/></clipPath></defs><rect x="${WX - 7}" y="${WY - 6}" width="${WW + 14}" height="${WH + 13}" rx="3" fill="#24120a"/>`
        + `<g clip-path="url(#${cid})">${o}</g>`;
      const gs = nid('gs', u); bg += `<defs>${linGrad(gs, WX, WY, WX + WW, WY + WH, [[0, '#ffd0a0', .07], [.45, '#ffd0a0', 0], [.6, '#ffd0a0', .06], [1, '#ffd0a0', 0]])}</defs><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}" fill="url(#${gs})"/>`;
      for (const x of [WX + WW / 3, WX + 2 * WW / 3]) bg += `<rect x="${f(x - 1.6)}" y="${WY}" width="3.2" height="${WH}" fill="#2a140a"/><path d="M${f(x - 1.6)} ${WY}v${WH}" stroke="#08040a" stroke-width=".5"/><path d="M${f(x + 1.3)} ${WY}v${WH}" stroke="#d07a4a" stroke-width=".45" opacity=".7"/>`;
      { const y = WY + WH * .5; bg += `<rect x="${WX}" y="${f(y - 1.6)}" width="${WW}" height="3.2" fill="#2a140a"/><path d="M${WX} ${f(y - 1.6)}h${WW}" stroke="#d08050" stroke-width=".45" opacity=".7"/><path d="M${WX} ${f(y + 1.6)}h${WW}" stroke="#08040a" stroke-width=".5"/>`; }
      const fr = nid('fr', u); bg += `<defs>${linGrad(fr, WX - 7, 0, WX + WW + 7, 0, [[0, '#8a5a30', 1], [.3, '#4a2c14', 1], [1, '#2a1608', 1]])}</defs>`
        + `<path d="M${WX - 7} ${WY - 6}h${WW + 14}v${WH + 13}h${-WW - 14}zM${WX} ${WY}v${WH}h${WW}v${-WH}z" fill="url(#${fr})" fill-rule="evenodd"/>`
        + `<rect x="${WX - .6}" y="${WY - .6}" width="${WW + 1.2}" height="${WH + 1.2}" fill="none" stroke="#c9a048" stroke-width=".8" opacity=".7"/>`; }
    // the red light of the sunset falls into the room from the window
    bg += glow(u, 160, 40, 70, 50, '#ff7040', .12);
    // the collection: two shelves of bottles in cradles, each with her ship (the old prey)
    bg += shelf(u, L, -2, 122, 50);
    bg += trophy(u, L, 20, 50, 36, 'brig', 21, false) + trophy(u, L, 60, 50, 38, 'merchant', 22, true) + trophy(u, L, 101, 50, 36, 'warship', 23, false);
    // the table: an oak top in perspective, the light pool of the candle, the edge and the dark front under the glass
    bg += `<g>${tableTop(u, TB, TF - TB, '#7a4a28', '#341e0e', 7)}</g>`
      + K.localGlow(u, { x: CAN.x, y: CAN.y + 6, color: '#ffb050', power: .55, radius: 80 }, { squash: .4, core: false })
      + `<path d="M0 ${TB}h200" stroke="#0a0502" stroke-width="1.4"/>`;
    { const ed = nid('ed', u), ap = nid('ap', u);
      bg += `<defs>${linGrad(ed, 0, TF, 0, TF + 6, [[0, '#b07a44', 1], [.35, '#5a3418', 1], [1, '#24120a', 1]])}${linGrad(ap, 0, TF + 6, 0, 280, [[0, '#24140a', 1], [1, '#0c0604', 1]])}</defs>`
        + `<rect x="0" y="${TF}" width="200" height="6" fill="url(#${ed})"/><path d="M0 ${TF}h200" stroke="#d89a5a" stroke-width=".6" opacity=".7"/>`
        + `<rect x="0" y="${TF + 6}" width="200" height="${280 - TF - 6}" fill="url(#${ap})"/>` + woodTex(u, 0, TF + 7, 200, 40, '#2e1a0c', '#1a0e06', '#080402', 17, true, 9); }
    // the candle behind the bottle (its foot is hidden by the bottle): stick, flame, its light
    let fg = K.candle(u, L, { ...CAN, seed: 4 });
    // the shadows of the bottle and its cradles fall towards us, away from the candle
    fg += K.castShadow(u, L, { x: 56, y: 122, w: 80, h: 50, horizon: HZ, d: .5, opacity: .55 }) + K.castShadow(u, L, { x: 146, y: 112, w: 12, h: 16, horizon: HZ, d: .5, opacity: .45 });
    // the new bottle on the table: inside, the battered little Company ship on her putty sea
    { const g = shipBottle(u, L, BA, BB, BR, { opacity: .2, outline: .6 }), wl = BA[1] + 14;
      // the inside: the far wall of the glass dark, lit by the candle through it
      let inn = `<rect x="0" y="0" width="200" height="280" fill="#2a1408" opacity=".2"/>`;
      inn += puttySea(u, BA, BB, BR, wl, 5);
      const sc = .34, sx = 52;
      inn += K.ship(u, L, { kind: 'endeavour', x: sx, y: wl + .5, scale: sc, detail: 'mid', heel: -3, seed: 6 });
      // her sails holed by the Revenge's shot, a smashed top on the main
      inn += holes([[sx - 6, wl - 23, 1.2], [sx + 7, wl - 18, 1.4], [sx - 14, wl - 13, 1], [sx + 2, wl - 30, .9], [sx + 13, wl - 27, 1.1]]);
      inn += `<path d="M${sx - 26} ${wl - 3}q2 -2 4 0" stroke="#1a0c06" stroke-width=".8" fill="none"/>`;
      fg += `<g clip-path="url(#${g.clip})">${inn}</g>` + g.svg;
      // the glass: the candle's highlight along the top, the bright inner edge, a cold glint at the base
      const hp = smooth([g.P(.12, -.8), g.P(.28, -.84), g.P(.44, -.83)]);
      fg += `<path d="${g.d}" fill="#c8f0dc" opacity=".08"/><path d="${g.d}" fill="none" stroke="#f0fff6" stroke-width=".8" opacity=".5" stroke-linejoin="round"/>`
        + `<path d="${hp}" stroke="#fff0d0" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".35"/><path d="${hp}" stroke="#ffffff" stroke-width=".45" fill="none" stroke-linecap="round" opacity=".7"/>`;
      // the window mirrored in the glass on the shoulder: two small warm panes, bent round the curve
      { const P = (t, sg) => g.P(t, sg), q = (t0, t1, s0, s1) => { const a = P(t0, s0), b = P(t1, s0 - .04), c = P(t1, s1 - .04), d = P(t0, s1); return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}Z`; };
        fg += `<path d="${q(.5, .53, -.72, -.5)}${q(.54, .57, -.72, -.5)}" fill="#ffd8b0" opacity=".45"/><path d="${q(.5, .53, -.44, -.26)}${q(.54, .57, -.44, -.26)}" fill="#ffb080" opacity=".3"/>`; }
      fg += ''
        + `<path d="${smooth([g.P(.08, .78), g.P(.3, .82), g.P(.55, .8)])}" stroke="#ffb070" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".45"/>`
        + `<ellipse cx="${BA[0] + 2}" cy="${BA[1]}" rx="${f(BR * .2)}" ry="${f(BR * .9)}" fill="none" stroke="#ffd8a8" stroke-width=".6" opacity=".45"/>`
        + K.localGlow(u, { x: BA[0] + 80, y: BA[1] - 16, color: '#ffd8a0', power: .2, radius: 26 }, { core: false });
      // the cradles in front of the shadow (the bottle lies in their notches)
      fg += cradle(u, L, 30, 122, 16, 8, 9, 1) + cradle(u, L, 84, 122, 16, 8, 9, 2) + cradle(u, L, 146, 112, 10, 6, 3.6, 3); }
    // the cork going in: half of it still out of the neck
    { const c0 = [BB[0] - 4, BB[1]], c1 = [BB[0] + 5, BB[1]];
      const ck = nid('ck', u);
      fg += `<defs>${linGrad(ck, 0, BB[1] - 8, 0, BB[1] + 8, [[0, '#e0b07a', 1], [.3, '#b07a44', 1], [.75, '#6a4020', 1], [1, '#3a200c', 1]])}</defs>`
        + `<path d="M${c0[0]} ${BB[1] - 7.2}L${c1[0]} ${BB[1] - 7.8}V${BB[1] + 7.8}L${c0[0]} ${BB[1] + 7.2}Z" fill="url(#${ck})" stroke="#2a1606" stroke-width=".4"/>`
        + `<ellipse cx="${c1[0]}" cy="${BB[1]}" rx="1.6" ry="7.8" fill="#c8945a" stroke="#2a1606" stroke-width=".4"/>`
        + [[-3, -3], [1, 2], [-1, 5], [2, -5]].map(([dx, dy]) => `<circle cx="${c0[0] + 6 + dx}" cy="${BB[1] + dy}" r=".45" fill="#3a200c" opacity=".6"/>`).join(''); }
    // the captain's hand comes in from the upper right: a dark leather sleeve with a linen cuff, the fist on the
    // cork, pushing it home into the neck
    { const skin = { lit: '#e8a878', half: '#b0704a', shadow: '#5a3022', outline: '#2a1208' }, coat = { lit: '#7a2c22', half: '#4a1812', shadow: '#200806', outline: '#0a0302' },
        lace = { lit: '#f4e6cc', half: '#c8b496', shadow: '#6a5a46', outline: '#2a2014' }, wr = [173, 75], a = 124;
      fg += H.cloth(u, { spine: [[220, 34], [199, 55], wr], w: [21, 17, 12.5], tone: coat, lit: -1, folds: true, cuff: { from: .72, tone: lace, k: 1.35, roll: false }, seed: 4 });
      const h = H.hand(u, { at: wr, a, s: 2.3, m: 1, pose: 'grip', tone: skin, sw: .35 });
      fg += h.back + h.front + K.localGlow(u, { x: 164, y: 80, color: '#ffc080', power: .22, radius: 14 }, { core: false }); }
    // the light: the flame's glow, warm motes, dark corners and the dark under the glass
    fg += K.localGlow(u, { x: CAN.x, y: flameY, color: '#ffd080', power: .85, radius: 24 }) + K.localGlow(u, { x: CAN.x, y: flameY + 12, color: '#ffa040', power: .4, radius: 80 }, { core: false })
      + motes(20, 80, 30, 100, 80, '#ffe0b0', 12)
      + gloom(u, 40, 30, 0, 30, .3) + gloom(u, 100, 130, 100, 280, .55);
    return [bg, fg];
  } };
