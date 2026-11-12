// «Корабль в бутылке» (Месть, Легенда, ПРИКАЗ: вражеский корабль с Корпусом 3 или меньше тонет. Это не Залп).
// Blackbeard's cabin at sunset: on the wall shelves his collection — bottles lying in their cradles, a ship in each;
// on the table the new bottle, big, in its two cradles: inside, on a sea of blue putty, a tiny battered Company ship
// (dark torn sails, the foremast snapped, a hole in her side), and the captain's hand — his forearm in the dark coat
// sleeve from the upper right, thumb and forefinger pinching the cork — pushes the cork home into the neck, along the
// bottle. A candle stub on the table in front, right of the neck, clear of the bottle, is the light of the scene: it
// lights the hand and the cork from below and shines into the glass; the red sunset in the stern window is the rim.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
// the enemy in the bottle: the kit's Company ship beaten — dark torn sails with holes, yards askew, the foremast
// snapped to a stump
const WRECK = 'endeavour-bottled';
if (!K.SHIP_SPECS[WRECK]) { const e = K.SHIP_SPECS.endeavour;
  K.SHIP_SPECS[WRECK] = Object.assign({}, e, { sail: 'ship-sail-coal', cond: 'torn', holeK: 1.2, broken: 1, jibs: 0, masts: e.masts.map((m, i) => i === 0 ? Object.assign({}, m, { H: 56, n: 2, Q: [.5, .9] }) : m) }); }
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, motes, tableTop } = PK;

const HZ = 48;                                    // eye level = the sea horizon in the window
const WX = 128, WY = -4, WW = 68, WH = 70;         // the window glass
const TB = 104, TF = 150;                         // the table top: back edge, front edge
const BA = [8, 88], BB = [160, 88], BR = 28;   // the new bottle: the axis (base to mouth), the body radius
const CAN = { x: 184, y: 124, s: 1.5, len: 4 };
const flameY = CAN.y - (3.4 + CAN.len + 3) * CAN.s;
const light = { time: 'night', haze: .25, key: { type: 'point', x: CAN.x, y: flameY, z: .12, h: .9, gy: CAN.y, color: '#ffb860', power: 1, radius: 140 },
  fill: { color: '#5a3448', power: .38 }, rim: { az: 20, color: '#ff9a60', power: .45 } };
const lightOut = { time: 'dusk', haze: .45, key: { type: 'sun', x: 146, y: 42, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 } };
const skel = { horizon: HZ, eye: 1.3, light: 'the candle stub on the table right of the neck + the sunset in the window as the rim', items: [
  ['window', WX, WY + WH, WW, WH, 'stern wall'], ['shelf', -2, 50, 124, 6, 'wall brackets'], ['bottles', 2, 50, 118, 18, 'cradles on the shelf'],
  ['bottle', 8, 116, 156, 56, 'two cradles on the table'], ['ship in it', 40, 102, 34, 22, 'putty sea inside'],
  ['candle', 174, 124, 20, 18, 'table, right of the neck, under the hand'], ['hand', 158, 100, 50, 56, 'from the upper right edge, pinching the cork']] };

// a smooth path through points
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// ——— KIT-CANDIDATE: a ship-in-a-bottle bottle lying on its side: a long clear body, a short shoulder, a long neck
// with a string rim. Returns the glass (to draw over what is inside) and the clip of the inside.
const PROF = [[0, .9], [.025, 1], [.6, 1], [.66, .9], [.74, .5], [.79, .32], [.93, .3], [.945, .38], [.965, .38], [.975, .31], [1, .31]];
function shipBottle(u, L, A, B, r, o = {}) {
  const g = K.propLathe(u, L, 'glass', A, B, PROF.map(q => [q[0], q[1] * r]), { ell: .2, opacity: o.opacity || .32, spec: o.spec != null ? o.spec : [.04, .62], outline: o.outline || .5 });
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
    let fg = '';
    // the shadows of the bottle and its cradles fall towards us, away from the candle
    fg += K.castShadow(u, L, { x: 56, y: 122, w: 80, h: 50, horizon: HZ, d: .5, opacity: .55 }) + K.castShadow(u, L, { x: 146, y: 112, w: 12, h: 16, horizon: HZ, d: .5, opacity: .45 });
    // the new bottle on the table: inside, the battered little Company ship on her putty sea
    { const g = shipBottle(u, L, BA, BB, BR, { opacity: .2, outline: .6, spec: false }), wl = BA[1] + 14;
      // the inside: the far wall of the glass dark, lit by the candle through it
      let inn = `<rect x="0" y="0" width="200" height="280" fill="#2a1408" opacity=".2"/>`;
      inn += puttySea(u, BA, BB, BR, wl, 5);
      // the tiny beaten enemy: half the old size, dark torn sails, the foremast snapped (a splintered stump), a shot
      // hole in her side with a scorched ring
      const sc = .19, sx = 56, sh = { kind: WRECK, x: sx, y: wl + .5, scale: sc, detail: 'mid', heel: -4, seed: 6 }, mt = K.shipGeom(WRECK, sh).masts[0].top;
      inn += K.ship(u, L, sh);
      inn += `<path d="M${f(mt[0] - .45)} ${f(mt[1] + .6)}l.2 -1.4l.4 .7l.3 -1.2l.4 1l.1 1.2Z" fill="#e0c090"/>`
        + `<path d="M${f(mt[0] - 1)} ${f(mt[1] - 1.5)}l-3.6 -2.2M${f(mt[0] + .6)} ${f(mt[1] - 1.2)}l2 -3" stroke="#3a2a1a" stroke-width=".4" fill="none"/>`;
      inn += `<ellipse cx="${sx - 3.4}" cy="${wl - 3.6}" rx="1.5" ry="1.1" fill="#5a3010" opacity=".7"/><path d="M${sx - 4.4} ${wl - 3.7}l.5 -.8l.6 .3l.6 -.4l.3 .9l-.6 .7l-.9 0Z" fill="#0c0604"/>`;
      fg += `<g clip-path="url(#${g.clip})">${inn}</g>` + g.svg;
      // the glass: the bright edge, and one diagonal glint on the left of the body (a narrow tapered streak)
      fg += `<path d="${g.d}" fill="#c8f0dc" opacity=".08"/><path d="${g.d}" fill="none" stroke="#f0fff6" stroke-width=".8" opacity=".5" stroke-linejoin="round"/>`
        + `<path d="M17 81.5L30.5 64.6Q31.6 63.6 31.9 64.6L19.6 82.6Q18 83.6 17 81.5Z" fill="#fffaf0" opacity=".5"/><path d="M18.4 81.4L30.9 65" stroke="#ffffff" stroke-width=".4" stroke-linecap="round" opacity=".7"/>`;
      fg += ''
        + `<path d="${smooth([g.P(.08, .78), g.P(.3, .82), g.P(.55, .8)])}" stroke="#ffb070" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".45"/>`
        + `<ellipse cx="${BA[0] + 2}" cy="${BA[1]}" rx="${f(BR * .2)}" ry="${f(BR * .9)}" fill="none" stroke="#ffd8a8" stroke-width=".6" opacity=".45"/>`
        + K.localGlow(u, { x: BB[0] - 14, y: BB[1] + 4, color: '#ffd8a0', power: .18, radius: 18 }, { core: false });
      // the cradles in front of the shadow (the bottle lies in their notches)
      fg += cradle(u, L, 30, 122, 16, 8, 9, 1) + cradle(u, L, 84, 122, 16, 8, 9, 2) + cradle(u, L, 146, 112, 10, 6, 3.6, 3); }
    // the candle stub on the table, in front and right of the neck (clear of the bottle)
    fg += K.candle(u, L, { ...CAN, seed: 4 });
    // the cork going in: half of it already in the neck (seen through the glass), half out; a little tapered
    { const y = BB[1], xi = BB[0] - 7, xo = BB[0] + 7, ck = nid('ck', u);
      fg += `<defs>${linGrad(ck, 0, y - 9, 0, y + 9, [[0, '#e8bc84', 1], [.3, '#b88050', 1], [.75, '#6a4020', 1], [1, '#3a200c', 1]])}</defs>`
        + `<path d="M${xi} ${f(y - 7.6)}L${xo} ${f(y - 8.7)}V${f(y + 8.7)}L${xi} ${f(y + 7.6)}Z" fill="url(#${ck})" stroke="#2a1606" stroke-width=".4"/>`
        + `<rect x="${xi - .5}" y="${f(y - 9)}" width="${BB[0] - xi + .5}" height="18" fill="#c8f0dc" opacity=".12"/>`
        + `<path d="M${xi - 2} ${f(y - 8.7)}H${BB[0]}M${xi - 2} ${f(y + 8.7)}H${BB[0]}" stroke="#f0fff6" stroke-width=".6" opacity=".55"/>`
        + `<path d="M${BB[0]} ${f(y - 9)}V${f(y + 9)}" stroke="#2a1a10" stroke-width=".5" opacity=".6"/>`
        + `<ellipse cx="${xo}" cy="${y}" rx="1.8" ry="8.7" fill="#c8945a" stroke="#2a1606" stroke-width=".4"/>`
        + [[-3, -3], [1, 2], [-1, 5], [2, -5], [-2, 1]].map(([dx, dy]) => `<circle cx="${BB[0] + 3.5 + dx * .7}" cy="${y + dy}" r=".45" fill="#3a200c" opacity=".6"/>`).join(''); }
    // the captain's right hand: the forearm in the dark coat sleeve from the upper right edge, a linen ruffle at the
    // wrist, the back of the hand turned up; the forefinger lies along the top of the cork, the thumb presses its
    // near side, the other fingers curl with their tips on the cork's end — the whole hand pushes left, along the bottle
    { const sk = { lit: '#f0b888', half: '#c08058', shadow: '#6a3a26', outline: '#2a1208' }, sp = pts => smooth(pts, true), op = pts => smooth(pts, false);
      const sg = nid('slv', u), hg = nid('hb', u), fg2 = nid('hf', u), y = BB[1];
      fg += `<defs>${linGrad(sg, 182, 50, 204, 60, [[0, '#34262a', 1], [.45, '#1c1418', 1], [1, '#08060a', 1]])}`
        + `${linGrad(hg, 0, y - 16, 0, y + 12, [[0, sk.lit, 1], [.4, sk.half, 1], [.85, sk.shadow, 1], [1, '#d08a5a', 1]])}`
        + `${linGrad(fg2, 0, y - 13, 0, y - 7, [[0, sk.lit, 1], [.55, sk.half, 1], [1, sk.shadow, 1]])}</defs>`;
      // the curled middle, ring and little fingers behind: their backs in a row, the tips on the cork's end face
      for (const [cy, w] of [[83, 4.6], [87.6, 4.4], [91.8, 3.8]]) fg += `<path d="${sp([[184, cy - w / 2 - .6], [176, cy - w / 2 - .4], [170, cy - w / 2], [167.6, cy - w * .3], [167.2, cy + w * .2], [168.6, cy + w / 2], [176, cy + w / 2 + .3], [184, cy + w / 2 + .6]])}" fill="${sk.half}" stroke="${sk.outline}" stroke-width=".4"/>`
        + `<path d="M${f(170.4)} ${f(cy - w / 2 + .3)}Q${f(168.6)} ${f(cy)} ${f(170)} ${f(cy + w / 2 - .4)}" stroke="${sk.shadow}" stroke-width=".35" fill="none"/>`;
      // the back of the hand: from the wrist to the knuckles, turned up towards us
      fg += `<path d="${sp([[184.6, 76.4], [178, 74.2], [172.4, 74.4], [169.2, 76.6], [168.8, 80.6], [171.4, 82.4], [178, 83.4], [183.6, 84.6]])}" fill="url(#${hg})" stroke="${sk.outline}" stroke-width=".45"/>`
        + `<path d="M171.6 76.2Q170.4 78.4 171.6 80.6M175 75.2Q174.2 77.6 175.4 80.2" stroke="${sk.shadow}" stroke-width=".3" fill="none" opacity=".7"/>`
        + `<path d="M178 75Q174 74.4 171 75.8" stroke="#ffe0c0" stroke-width=".5" fill="none" opacity=".6" stroke-linecap="round"/>`;
      // the forefinger along the top of the cork, its tip bent down onto the lip of the neck
      fg += `<path d="${sp([[171.4, 75], [166, 74.4], [161.8, 74.6], [159.4, 75.8], [158.6, 77.8], [159.4, 79.4], [161.4, 79.2], [166, 79.4], [170.6, 80.4]])}" fill="url(#${fg2})" stroke="${sk.outline}" stroke-width=".45"/>`
        + `<path d="M166.2 74.8Q165.4 77 166.4 79.2M161.6 75Q160.8 76.8 161.6 78.8" stroke="${sk.shadow}" stroke-width=".3" fill="none" opacity=".7"/>`
        + `<path d="M159.6 75.6Q160.6 74.8 161.8 75.2L161.4 77.2Q160.2 77.4 159.6 75.6Z" fill="#f4d0b0" opacity=".85"/>`;
      // the thumb: from the ball of the hand by the wrist, across the near side of the cork, the pad pressing it
      fg += `<path d="${sp([[185, 86], [180, 90.8], [174, 93.8], [168, 94.8], [164, 94.8], [161.8, 93.4], [161.8, 91.2], [163.6, 90], [167, 89.8], [172, 88.6], [178, 85]])}" fill="url(#${hg})" stroke="${sk.outline}" stroke-width=".45"/>`
        + `<path d="M167.4 90.4Q166.6 92.4 167.6 94.2" stroke="${sk.shadow}" stroke-width=".3" fill="none" opacity=".7"/>`
        + `<path d="M162.6 91.4Q163.6 90.4 165.6 90.6L165.4 92.6Q163.4 93 162.6 91.4Z" fill="#f4d0b0" opacity=".85" stroke="#a06a48" stroke-width=".25"/>`
        + `<path d="${op([[183, 89.2], [176, 93], [168, 94.2]])}" stroke="#ffc890" stroke-width=".6" fill="none" opacity=".7" stroke-linecap="round"/>`;
      // the linen ruffle at the wrist, out of the cuff, over the wrist
      { const E = t => [177.8 + 16.4 * t, 76.2 + 7.6 * t], o = [-.42, .91]; let d = '';
        const e0 = E(0), e1 = E(1); d = `M${f(e0[0] + 1)} ${f(e0[1] - 2)}L${f(e0[0] + o[0])} ${f(e0[1] + o[1])}`;
        for (let i = 0; i < 5; i++) { const p0 = E(i / 5), q = E((i + 1) / 5), k = 3.4 + (i % 2) * .8; d += `C${f(p0[0] + o[0] * (1 + k))} ${f(p0[1] + o[1] * (1 + k))} ${f(q[0] + o[0] * (1 + k))} ${f(q[1] + o[1] * (1 + k))} ${f(q[0] + o[0])} ${f(q[1] + o[1])}`; }   // round scallops
        d += `L${f(e1[0] + 1)} ${f(e1[1] - 2)}Z`;
        fg += `<path d="${d}" fill="#efe4cc" stroke="#6a5a46" stroke-width=".4" stroke-linejoin="round"/>`
          + [.2, .4, .6, .8].map(t => { const e = E(t); return `<path d="M${f(e[0])} ${f(e[1])}l${f(o[0] * 2.6)} ${f(o[1] * 2.6)}" stroke="#a8967a" stroke-width=".35" stroke-linecap="round"/>`; }).join(''); }
      // the forearm in the dark coat sleeve, coming down steeply from the upper right edge (out of frame above), folds
      // across it, the sunset on its outer edge; the broad turned-back cuff with two brass buttons
      fg += `<path d="M177.8 76.2L197.9 30.3L218 39L194.2 83.8Z" fill="url(#${sg})" stroke="#050304" stroke-width=".6"/>`
        + [.2, .37, .54, .7].map(t => { const A = [177.8 + 20.1 * t, 76.2 - 45.9 * t], B = [194.2 + 23.8 * (t + .04), 83.8 - 44.8 * (t + .04)], C = [(A[0] + B[0]) / 2 - 1.7, (A[1] + B[1]) / 2 + 3.6];
          return `<path d="M${f(A[0])} ${f(A[1])}Q${f(C[0])} ${f(C[1])} ${f(B[0])} ${f(B[1])}" stroke="#000" stroke-width="1" fill="none" opacity=".5"/><path d="M${f(A[0] + .3)} ${f(A[1] - 1)}Q${f(C[0] + .3)} ${f(C[1] - 1)} ${f(B[0] + .3)} ${f(B[1] - 1)}" stroke="#7a5a60" stroke-width=".45" fill="none" opacity=".45"/>`; }).join('')
        + `<path d="M178.4 75.2L198.2 30" stroke="#ff9a60" stroke-width=".7" opacity=".6"/>`
        + `<path d="M177.2 77L180.9 68.6L199 76.8L194.6 85.2Z" fill="#2a1c20" stroke="#050304" stroke-width=".5"/><path d="M180.9 68.6L199 76.8" stroke="#c9a048" stroke-width=".6" opacity=".8"/><path d="M177.6 76.6L194.4 84.6" stroke="#c9a048" stroke-width=".45" opacity=".6"/>`
        + [[185.4, 74.8], [190.6, 77.2]].map(([x0, y0]) => K.shadeSphere(u, x0, y0, .9, L, 'brass', { outline: .25 })).join('');
      fg += K.localGlow(u, { x: 172, y: 96, color: '#ffc080', power: .25, radius: 16 }, { core: false }); }
    // the light: the flame's glow, warm motes, dark corners and the dark under the glass
    fg += K.localGlow(u, { x: CAN.x, y: flameY, color: '#ffd080', power: .85, radius: 24 }) + K.localGlow(u, { x: CAN.x, y: flameY + 12, color: '#ffa040', power: .4, radius: 80 }, { core: false })
      + motes(20, 80, 30, 100, 80, '#ffe0b0', 12)
      + gloom(u, 40, 30, 0, 30, .3) + gloom(u, 100, 130, 100, 280, .55);
    return [bg, fg];
  } };
