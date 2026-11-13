// «Всплытие» (Голландец, ПРИКАЗ: «Голландец» сразу даёт ещё один Залп с +2 урона, без Реакций и без платы Порохом),
// method A: the first-round scene (portrait-dutch.cjs SCENES['Всплытие']) at its best. The concept stays: in the pale
// green haze the Dutchman bursts out of the sea bow first, water pouring off her, her broadside already firing at
// the pale enemy on the horizon; the pale sun behind the fog. Brief (card-briefs.md «Всплытие»): the sea boils, the
// whole ship tears upward, waterfalls off her sides, the guns run out and firing. Find: the waterfalls. Unlike
// «Из пучины» (still under water, firing from below) — here she is all out, above the sea.
// Fixed against the first round: the old ship was a pasted picture pitched 30° with no bottom and thin hairs of
// water — now the kit's Dutchman pitched bow up with her weedy bottom shown, white sheets of water falling off the
// keel, over the rail and out of the ports (each fall its own width, breaking into drops and spray), the sea boiling
// in a ring of foam round her; three guns run out, each in its own phase (a full flash, a fresh one, only smoke).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const HZ = 100;
const DU = { kind: 'dutch', x: 86, y: 134, scale: 1.22, flip: true, heel: -28, roll: -12 };   // bow right, up out of the sea
const ENEMY = { kind: 'endeavour', x: 176, y: HZ + 2.2, scale: .27 };
const light = { time: 'fog', haze: .8, key: { type: 'sun', x: 66, y: 34, el: 30, color: '#f2fff0', power: .75 }, fill: { color: '#3a6a60', power: .5 },
  rim: { az: 330, color: '#f4fff8', power: .5 }, locals: [{ x: 124, y: 100, color: '#ffc070', power: .55, radius: 34 }] };
const skel = { horizon: HZ, eye: 2, light: 'the pale sun in the fog upper left, a little behind her (back light): bright rims, the falls lit; the gun flash warm', items: [
  ['Dutchman, heel -28, roll -12', 12, 42, 172, 92, 'bursting out of the sea'], ['bottom + keel falls', 108, 104, 40, 30, 'from the keel down to the sea'],
  ['falls off the rail / ports', 60, 84, 72, 50, 'down her side to the sea'], ['flashes', 104, 92, 56, 20, 'the forward ports'],
  ['enemy', 166, 88, 26, 14, 'far sea'], ['ring of foam', 24, 122, 134, 20, 'the sea round her'], ['near sea', 0, 140, 200, 140, 'under the glass']] };

// a point of the ship in her own frame (X along the hull, + to the stern; H up from the waterline) → the picture
function pt(o, X, Hh) {
  const dir = o.flip ? -1 : 1, s = o.scale, th = -dir * (o.heel || 0) * Math.PI / 180, dx = dir * s * X, dy = -s * Hh;
  return [o.x + dx * Math.cos(th) - dy * Math.sin(th), o.y + dx * Math.sin(th) + dy * Math.cos(th)];
}
// KIT-CANDIDATE fall: a sheet of water falling from (x, y0) to the sea at y1: a translucent white curtain of width w,
// narrowing as it falls, streaked, breaking up into ropes and drops low down, a splash of spray where it lands
function fall(u, L, x, y0, y1, w, seed, o = {}) {
  const R = rng(seed), id = nid('fl', u), h = y1 - y0, drift = o.drift || 0;
  if (h < 2) return '';
  let out = `<defs>${linGrad(id, 0, y0, 0, y1, [[0, '#f4fff8', .6 * (o.op || 1)], [.5, '#e4fff4', .38 * (o.op || 1)], [1, '#d8f4ea', .12 * (o.op || 1)]])}</defs>`;
  // the curtain: its edges wavering, it narrows as it falls
  const L1 = [], R1 = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6, y = y0 + h * t, k = w * (1 - t * .35) / 2, dx = drift * t * t;
    L1.push([x + dx - k + (R() - .5) * w * .15, y]); R1.unshift([x + dx + k + (R() - .5) * w * .15, y]); }
  out += `<path d="M${L1.concat(R1).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${id})"/>`;
  // streaks down the curtain
  for (let i = 0; i < Math.max(2, w * 1.2); i++) { const xx = x + (R() - .5) * w * .9, a = R() * .3, b = .6 + R() * .4;
    out += `<path d="M${f(xx)} ${f(y0 + h * a)}q${f((R() - .5) * 1.4)} ${f(h * (b - a) * .5)} ${f(drift * b * b * .6)} ${f(h * (b - a))}" stroke="#ffffff" stroke-width="${f(.2 + R() * .35)}" fill="none" opacity="${f(.35 + R() * .45)}"/>`; }
  // it breaks up low down: ropes and drops
  for (let i = 0; i < 6 + w; i++) { const yy = y0 + h * (.55 + R() * .5), xx = x + drift * .8 + (R() - .5) * w * 1.3, r = .2 + R() * .5;
    out += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r)}" ry="${f(r * 1.8)}" fill="#f4fff8" opacity="${f(.4 + R() * .5)}"/>`; }
  // where it lands: a puff of spray
  if (!o.noSplash) out += K.splash(u, { x: x + drift, y: y1 + .4, w: w * 1.4 + 3, h: 3 + w * .5, seed: seed % 9, L, wind: 0 });
  return out;
}

module.exports = { name: 'Всплытие', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    // ——— the pale green haze: the sun a white disc through the fog, the sea dark under it ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 7 }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 20, 110, 12, 4, .2], [30, 70, 70, 9, 9, .45], [168, 70, 70, 8, 14, .5], [100, 88, 90, 6, 2, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .7, seed: 11, glitter: 66 });
    bg += K.ship(u, L, { ...ENEMY, sails: 'full', detail: 'far', seed: 3 });
    bg += K.fog(u, L, { y: HZ - 16, h: 22, density: .55, seed: 5 });
    // the sea darkens and heaves round her: a broad swell of displaced water, boiling
    { const sw = nid('sw', u); bg += `<defs>${radGrad(sw, DU.x + 6, DU.y + 2, 70, [[0, '#0a2420', .6], [.6, '#0e2c26', .3], [1, '#0e2c26', 0]])}</defs><ellipse cx="${DU.x + 6}" cy="${DU.y + 2}" rx="78" ry="16" fill="url(#${sw})"/>`; }
    // the sea she broke through, thrown up behind her bow: a tall burst of white water, spray flying up and out
    bg += K.splash(u, { x: 122, y: DU.y + .6, w: 34, h: 46, seed: 3, L, wind: .3 }) + K.splash(u, { x: 150, y: DU.y + .6, w: 18, h: 20, seed: 1, L, wind: .6 });
    // ——— the Dutchman: her bottom first (the kit cuts at the waterline), then the ship ———
    let mid = '';
    const cut = nid('ct', u);
    mid += `<defs><clipPath id="${cut}"><rect x="-10" y="-10" width="220" height="${DU.y + 10}"/></clipPath></defs>`;
    { const bl = nid('bl', u), st = pt(DU, -48.5, 1), k1 = pt(DU, -44, -7), k2 = pt(DU, -24, -11), k3 = pt(DU, 6, -11), k4 = pt(DU, 30, -8), w0 = pt(DU, 30, 1), R = rng(13);
      let belly = `<defs>${linGrad(bl, st[0], st[1] - 6, k2[0] + 6, k2[1] + 10, [[0, '#5a6a52', 1], [.4, '#34442e', 1], [1, '#121c16', 1]])}</defs>`
        + `<path d="M${f(st[0])} ${f(st[1])}C${f(k1[0] + 2)} ${f(k1[1] + 2)} ${f(k2[0] + 6)} ${f(k2[1] - 1)} ${f(k2[0])} ${f(k2[1])}C${f(k3[0] + 8)} ${f(k3[1])} ${f(k3[0])} ${f(k3[1])} ${f(k4[0])} ${f(k4[1])}L${f(w0[0])} ${f(w0[1])}Z" fill="url(#${bl})"/>`;
      // weed hanging off the bottom, barnacles, a wet shine along the turn of the bilge
      for (let i = 0; i < 18; i++) { const X = -44 + R() * 60, p = pt(DU, X, -2 - R() * 8), l = 4 + R() * 8;
        belly += `<path d="M${f(p[0])} ${f(p[1])}q${f(-1 + R() * 2)} ${f(l * .5)} ${f(-1 - R() * 2)} ${f(l)}" stroke="#2e5a3a" stroke-width="${f(.5 + R() * .7)}" fill="none" opacity=".85" stroke-linecap="round"/>`; }
      for (let i = 0; i < 30; i++) { const X = -46 + R() * 62, p = pt(DU, X, -.5 - R() * 9); belly += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.4 + R() * .8)}" fill="#a8ac94" opacity=".5"/>`; }
      { const a = pt(DU, -46, -2), b = pt(DU, -20, -9), c = pt(DU, 10, -9); belly += `<path d="M${f(a[0])} ${f(a[1])}Q${f(b[0])} ${f(b[1])} ${f(c[0])} ${f(c[1])}" stroke="#e8fff4" stroke-width=".7" fill="none" opacity=".45"/>`; }
      mid += `<g clip-path="url(#${cut})">${belly}</g>`; }
    mid += K.ship(u, L, { ...DU, sails: 'full', detail: 'near', lights: true, seed: 4 });
    // she is soaked: a cold green sheen of wet over the whole ship
    // ——— the guns: three run out of the forward ports — a full flash, one just fired, one in its smoke ———
    const P = [-31, -19.5, -8].map(X => pt(DU, X, 9.6)), fx0 = [];
    for (const [i, p] of P.entries()) { const e = [p[0] + 3.6, p[1] + .8]; fx0.push(e); mid += K.shadeCyl(u, p[0] - .4, p[1], e[0], e[1], .95, L, 'iron', { r2: .8, outline: .3, seed: i }); }
    let fx = '';
    fx += K.smoke(u, L, { x: fx0[2][0] + 6, y: fx0[2][1] + 1, w: 22, h: 14, wind: 1, seed: 8, opacity: .8 });
    fx += K.smoke(u, L, { x: fx0[0][0] + 10, y: fx0[0][1] + 2, w: 30, h: 18, wind: 1, seed: 3, opacity: .75, glow: { color: '#ffb060', power: .6 } });
    fx += K.muzzleFlash(u, { x: fx0[0][0], y: fx0[0][1], dir: 8, len: 26, seed: 2 }) + K.muzzleFlash(u, { x: fx0[1][0], y: fx0[1][1], dir: 12, len: 12, seed: 1 });
    fx += K.localGlow(u, { x: fx0[0][0] + 8, y: fx0[0][1], color: '#ffb24a', power: .5, radius: 34 }, { core: false });
    // ——— the falls: off the keel, over the rail, out of the ports ———
    let falls = '';
    { const R = rng(29);
      // off the keel: the broadest sheets, where the bow is highest out of the sea
      for (const [X, w] of [[-47.5, 5], [-44, 8], [-39, 9], [-33.5, 8], [-28, 6], [-23.5, 4]]) { const p = pt(DU, X, -9 - R() * 1.5); falls += fall(u, L, p[0], p[1], DU.y, w, 100 + Math.round(X), { drift: -.8, op: 1.5 }); }
      // off the stem and the head: water streaming from the beak down past the bow
      { const p = pt(DU, -49, 6); falls += fall(u, L, p[0] + 1, p[1], DU.y, 2.4, 151, { drift: 1.4, op: .8 }); }
      // over the rail: thin ropes of water off the deck, down her side and on into the sea
      for (let X = -44; X <= 6; X += 5 + R() * 2.5) { const p = pt(DU, X, 18.9), w = 1.6 + R() * 2.2; falls += fall(u, L, p[0] + .6, p[1] - .4, DU.y, w, 200 + Math.round(X * 10), { drift: -.6, noSplash: true, op: 1.1 }); }
      // out of the aft ports (the forward ones fire): short jets curving down
      for (const X of [3.5, 9.3, 15]) { const p = pt(DU, X, 9.6); if (p[1] < DU.y - 2) falls += fall(u, L, p[0] - 1, p[1], DU.y, 1.8, 300 + X * 10, { drift: -2.2, noSplash: true, op: .8 }); } }
    // ——— the sea boils round her: a ring of foam, the masses of water she throws aside, spray in the air ———
    let sea = '';
    { const R = rng(19); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = DU.x + 4 + Math.cos(a) * 62, y = DU.y + 3 + Math.sin(a) * 7; sea += K.foam(u, { x, y, w: 16 + R() * 12, h: 1.5, seed: 40 + i, L }); }
      sea += `<ellipse cx="${DU.x + 4}" cy="${DU.y + 3}" rx="62" ry="7" fill="none" stroke="#f4fff8" stroke-width="1.2" opacity=".55"/><ellipse cx="${DU.x + 4}" cy="${DU.y + 3}" rx="54" ry="5" fill="#e8fff6" opacity=".18"/>`;
      // the sea heaves up round her: a low mound of white, churned water along the waterline, its top ragged
      { const mg = nid('mg', u), top = [], n = 28; for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(18, 168, t), hh = 5.5 * Math.pow(Math.sin(Math.PI * t), .7) * (.7 + R() * .5); top.push([x, DU.y + 2 - hh]); }
        sea += `<defs>${linGrad(mg, 0, DU.y - 6, 0, DU.y + 4, [[0, '#f4fff8', .9], [.5, '#cfeee2', .7], [1, '#6a9a8a', .4]])}</defs>`
          + `<path d="M18 ${DU.y + 4}L${top.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}L168 ${DU.y + 4}Z" fill="url(#${mg})"/>`; }
      // the white water along the waterline where she cuts up through it
      sea += K.foam(u, { x: DU.x - 4, y: DU.y + .4, w: 100, h: 2.6, seed: 7, L });
      for (const [x, w, h, sd] of [[DU.x - 2, 20, 14, 0], [DU.x + 26, 16, 10, 4], [DU.x - 34, 14, 9, 2], [DU.x + 50, 12, 7, 5], [DU.x - 56, 10, 6, 7]]) sea += K.splash(u, { x, y: DU.y + .8, w, h, seed: sd, L, wind: 0 });
      // boiling: bubbles and blobs of foam on the sea round the ring
      for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, r = 30 + R() * 40, x = DU.x + 4 + Math.cos(a) * r, y = DU.y + 3 + Math.sin(a) * r * .14, rr = .4 + R() * 1.2;
        sea += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr)}" ry="${f(rr * .5)}" fill="none" stroke="#f0fff8" stroke-width=".3" opacity="${f(.4 + R() * .4)}"/>`; }
      // spray thrown up round the bow
      for (let i = 0; i < 90; i++) { const x = 96 + R() * 64, y = 70 + R() * 60, r = .2 + R() * .65; sea += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 1.6)}" fill="#f4fff8" opacity="${f(.3 + R() * .5)}"/>`; } }
    // light: the sun's veil, motes, the under-glass dark
    let lt = K.localGlow(u, { x: 66, y: 34, color: '#f4fff0', power: .3, radius: 60 }, { core: false }) + motes(20, 20, 60, 160, 60, '#effff4', 6);
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 142, 0, 290, [[0, '#04140f', 0], [.4, '#04140f', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="142" width="220" height="148" fill="url(#${gl})"/>`; }
    return [bg, mid + falls + fx + sea + lt];
  } };
