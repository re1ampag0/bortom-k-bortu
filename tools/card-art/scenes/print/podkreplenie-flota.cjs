// «Подкрепление флота» (Индевор, РЕМОНТ: восстановите 2 Команды своему кораблю или кораблю союзника), refined from
// the first-round scene (portrait-endeavour.cjs SCENES['Подкрепление флота']): a longboat full of the Company's men
// pulls towards the flagship at anchor — the oars dipping in step, the same uniform on every man (the brief's find:
// identical figures): a row of rowers in blue jackets and between them a row of redcoats with their bayonets upright,
// an officer at the stern under the striped Company flag. Under her side the first boat is already alongside and the
// new men go up the rope ladder one after another; a third boat comes from the ships of the line on the horizon.
// Fixed against the first round: the boat was a flat brown wedge with the men standing on its rim and the oars
// starting in mid-air — now a clinker-built boat seen a little from above (the far gunwale, the thwarts inside, the
// men sitting on them), each oar in its rowlock, the blades in the water with a ring of foam; the ships were sprites
// with the sun in front of them — now the kit's Endeavour at anchor (sails furled, the cable out of the hawse), lit by
// the sun behind us; the scale between the boat, the men and the ship is one; the sea under the glass is quiet.
// Light: the sun behind us high on the left (key), the blue sky (fill).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, rng } = K;

const HZ = 84, SWL = 93, SX = 130, SS = .66;   // the horizon; the flagship's waterline, middle, scale
const light = { time: 'day', haze: .25, key: { type: 'sun', az: 226, el: 34, color: '#fff2d6', power: 1 }, fill: { color: '#8db8e0', power: .5 } };
const B1 = { x0: 13, x1: 111, y: 125, s: 1.12 };       // the near boat: stern, bow, waterline, scale (men ~12 units sitting)
const B2 = { x0: 114, x1: 140, y: 95.5, s: .3 };   // the boat alongside under the ladder
const B3 = { x0: 170, x1: 185, y: 89, s: .17 };  // the far boat coming from the line
const skel = { horizon: HZ, eye: 2.5, light: 'the sun behind us high on the left', items: [
  ['flagship', 72, SWL, 112, 74, 'water: at anchor, sails furled, bow to the left'],
  ['ladder', 125, 93, 5, 16, 'hangs from her rail (X -2) to the water'],
  ['boat alongside', B2.x0, B2.y, B2.x1 - B2.x0, 8, 'water, under the ladder'],
  ['near boat', B1.x0, B1.y, B1.x1 - B1.x0, 34, 'water: heading right, towards her side'],
  ['far boat', B3.x0, B3.y, B3.x1 - B3.x0, 4, 'water'], ['far line', 6, HZ + .6, 60, 10, 'horizon, hull-down']] };

// a clinker-built longboat in profile, bow to the right, seen a little from above: o = { x0 (stern), x1 (bow), y
// (waterline), s (scale: 1 — 90 units long) } -> { far, inner, hull, gun(t) [near gunwale point], fgun(t), row(t) }
function boatGeom(o) {
  const { x0, x1, y, s } = o, Lh = x1 - x0;
  const fb = t => 7.5 * s + 3.2 * s * Math.pow(Math.max(0, t - .7) / .3, 1.6) + 1.6 * s * Math.pow(Math.max(0, .25 - t) / .25, 2) - .8 * s * Math.sin(t * Math.PI);
  const gun = t => [x0 + Lh * t + (t > .92 ? (t - .92) * 30 * s : 0), y - fb(t)];          // the near gunwale
  const open = t => 4.4 * s * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - .02) / .94)));  // how much of the far side shows
  const fgun = t => { const g = gun(t); return [g[0] - open(t) * .3, g[1] - open(t)]; };
  return { gun, fgun, fb, Lh, s, x0, x1, y };
}
function boat(u, L, o, opts = {}) {
  const G = boatGeom(o), { s, y } = G, N = 26, ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const P = a => a.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('');
  const near = ts.map(G.gun), far = ts.map(G.fgun);
  const keel = ts.map(t => { const g = G.gun(t); return [g[0] - (t > .95 ? (t - .95) * 40 * s : 0), y + (t < .05 ? 0 : .6 * s)]; });
  const rO = L.ramp('ship-ochre', (G.x0 + G.x1) / 2, y), rK = L.ramp('oak', (G.x0 + G.x1) / 2, y), rT = L.ramp('tar', G.x0, y);
  const gi = nid('bi', u), gh = nid('bh', u);
  let out = `<defs>${linGrad(gi, 0, y - 12 * s, 0, y - 4 * s, [[0, rK.shadow], [1, rK.core]])}${linGrad(gh, 0, y - 9 * s, 0, y + 1, [[0, rO.lit], [.45, rO.half], [1, rO.shadow]])}</defs>`;
  // the inside: the far planking (lit from the left), the bottom boards in shadow
  out += `<path d="${P(far)}${P(near.slice().reverse()).replace('M', 'L')}Z" fill="url(#${gi})"/>`;
  out += `<path d="${P(far)}" stroke="${rK.half}" stroke-width="${f(1.1 * s)}" fill="none"/><path d="${P(far)}" stroke="${rK.lit}" stroke-width="${f(.35 * s)}" fill="none" transform="translate(0 ${f(-.4 * s)})"/>`;
  // the far side's inner strakes and its timbers (ribs) — lines inside the open part
  for (const k of [.35, .65]) out += `<path d="${P(ts.map((t, i) => [far[i][0] * (1 - k) + near[i][0] * k, far[i][1] * (1 - k * .55) + near[i][1] * k * .55]))}" stroke="${rK.shadow}" stroke-width="${f(.3 * s)}" fill="none" opacity=".7"/>`;
  for (let i = 2; i < N - 1; i += 2) out += `<path d="M${f(far[i][0])} ${f(far[i][1] + .6 * s)}L${f((far[i][0] + near[i][0]) / 2)} ${f((far[i][1] + near[i][1]) / 2 + .8 * s)}" stroke="${rK.core}" stroke-width="${f(.35 * s)}" opacity=".6"/>`;
  // the thwarts: planks across, their upper face lit
  for (const t of opts.thwarts || []) { const a = G.fgun(t), b = G.gun(t);
    out += `<path d="M${f(a[0] + .4 * s)} ${f(a[1] + 1.2 * s)}L${f(b[0])} ${f(b[1] - .2 * s)}L${f(b[0] + 2.2 * s)} ${f(b[1] - .2 * s)}L${f(a[0] + 2.4 * s)} ${f(a[1] + 1.2 * s)}Z" fill="${rK.half}" stroke="${rK.outline}" stroke-width="${f(.2 * s)}"/>`; }
  out += opts.inside || '';
  // the hull: ochre topsides with a black sheer strake, clinker lands following the sheer, the bow lit
  out += `<path d="${P(near)}${P(keel.slice().reverse()).replace('M', 'L')}Z" fill="url(#${gh})"/>`;
  for (const k of [.22, .44, .66, .84]) out += `<path d="${P(ts.map((t, i) => [near[i][0] * (1 - k) + keel[i][0] * k, near[i][1] * (1 - k) + keel[i][1] * k]))}" stroke="${rO.outline}" stroke-width="${f(.3 * s)}" fill="none" opacity=".55"/>`
    + `<path d="${P(ts.map((t, i) => [near[i][0] * (1 - k) + keel[i][0] * k, near[i][1] * (1 - k) + keel[i][1] * k - .35 * s]))}" stroke="${rO.lit}" stroke-width="${f(.2 * s)}" fill="none" opacity=".5"/>`;
  out += `<path d="${P(near)}" stroke="${rT.half}" stroke-width="${f(1.5 * s)}" fill="none" transform="translate(0 ${f(.75 * s)})"/><path d="${P(near)}" stroke="${rK.lit}" stroke-width="${f(.45 * s)}" fill="none"/>`;
  // the stem and the transom
  { const b = G.gun(1), k = keel[N]; out += `<path d="M${f(b[0])} ${f(b[1])}Q${f(b[0] + .4 * s)} ${f((b[1] + k[1]) / 2)} ${f(k[0])} ${f(k[1])}" stroke="${rK.half}" stroke-width="${f(1 * s)}" fill="none"/>`;
    const a = G.gun(0), fa = G.fgun(0); out += `<path d="M${f(fa[0])} ${f(fa[1])}L${f(a[0] - 1.2 * s)} ${f(a[1])}L${f(a[0] - .4 * s)} ${f(y)}" stroke="${rK.half}" stroke-width="${f(1 * s)}" fill="none"/>`; }
  // the water along her: a dark contact line, a bow wave, foam
  out += `<path d="M${f(G.x0 - 2 * s)} ${f(y + .3 * s)}H${f(G.x1 + 3 * s)}" stroke="#0e3442" stroke-width="${f(.9 * s)}" opacity=".6"/>`;
  return { svg: out, G };
}

// ——— the same men, drawn small (seated ~12 units at s 1): a rower facing the stern (left) at the catch, a redcoat
// sitting with his musket upright, the officer standing. (x, y) — the seat. Tones from the scene's light.
function rower(L, x, y, s, R) {
  const r = L.ramp('skin', x, y), j = { lit: '#3c5a8c', half: '#24385e', shadow: '#16223c' }, w = L.ramp('linen', x, y);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`
    + `<path d="M0 0L-4.6 -1.6L-7 2.6" stroke="${w.half}" stroke-width="2.1" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`   // thigh, shin
    + `<path d="M-1.2 .6Q-2.6 -4 -4.3 -7.6L-1.4 -8.6Q.8 -4.6 1.4 -.4Z" fill="${j.half}"/><path d="M-4.3 -7.6L-1.4 -8.6" stroke="${j.lit}" stroke-width=".7"/><path d="M-3.4 -7.2Q-2 -4 -1 -.2" stroke="${j.lit}" stroke-width=".5" fill="none"/>`
    + `<path d="M-3 -7.6Q-5.4 -6.2 -7.4 -4.4" stroke="${j.half}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="-7.6" cy="-4.2" r=".75" fill="${r.half}"/>`   // arm to the loom
    + `<circle cx="-3.9" cy="-10" r="1.65" fill="${r.half}"/><path d="M-5.3 -10.4a1.6 1.6 0 0 1 2.4 -1.3" stroke="${r.lit}" stroke-width=".5" fill="none"/>`
    + `<path d="M-6 -11.2h4.4l-.5 -1.6h-3.4z" fill="#1a1a20"/><path d="M-6 -11.2h4.4" stroke="#f0ece2" stroke-width=".35"/></g>`;
}
function redcoat(L, x, y, s) {
  const r = L.ramp('skin', x, y), c = L.ramp('paint-red', x, y), w = L.ramp('linen', x, y), m = L.ramp('oak', x, y);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`
    + `<path d="M0 0L3.6 -.6L4.4 3.4" stroke="${w.half}" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
    + `<path d="M-1.8 .4Q-2.2 -5 -.8 -8.8L1.8 -8.8Q2.8 -5 2.2 .4Z" fill="${c.half}"/><path d="M-1.6 -.2Q-2 -5 -.8 -8.6" stroke="${c.lit}" stroke-width=".8" fill="none"/>`
    + `<path d="M-1 -8.2L1.9 -1M1.7 -8.4L-1.4 -1.2" stroke="${w.lit}" stroke-width=".55"/>`
    + `<path d="M3.2 3V-15.4" stroke="${m.half}" stroke-width=".8"/><path d="M3.2 -15.4V-18.6" stroke="#dfe6ea" stroke-width=".35"/><path d="M3.2 -3.4V-15" stroke="#6a7378" stroke-width=".3" transform="translate(-.35 0)"/>`
    + `<path d="M1.6 -6.4L3.2 -5.6" stroke="${c.half}" stroke-width="1.3" stroke-linecap="round"/><circle cx="3.2" cy="-5.6" r=".7" fill="${r.half}"/>`
    + `<circle cx=".5" cy="-10.6" r="1.6" fill="${r.half}"/><path d="M-.9 -11a1.6 1.6 0 0 1 2.4 -1.2" stroke="${r.lit}" stroke-width=".5" fill="none"/>`
    + `<path d="M-1.8 -11.6Q.5 -14.4 2.8 -11.6Q.5 -12.4 -1.8 -11.6Z" fill="#141216"/><path d="M-1.8 -11.6Q.5 -12.4 2.8 -11.6" stroke="#f0ece2" stroke-width=".3" fill="none"/></g>`;
}
function officer(L, x, y, s) {
  const r = L.ramp('skin', x, y), c = L.ramp('paint-red', x, y), w = L.ramp('linen', x, y);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">`
    + `<path d="M-.8 0V-7M1 0V-7" stroke="${w.half}" stroke-width="1.5"/><path d="M-.8 -2.6V0M1 -2.6V0" stroke="#16141a" stroke-width="1.6"/>`
    + `<path d="M-2 -6.4Q-2.4 -11 -1.2 -14.4L1.8 -14.4Q3 -11 2.6 -6.4Q.3 -5.8 -2 -6.4Z" fill="${c.half}"/><path d="M-1.9 -7Q-2.2 -11 -1.2 -14.2" stroke="${c.lit}" stroke-width=".8" fill="none"/>`
    + `<path d="M-1.2 -14.2L2 -7.2" stroke="${w.lit}" stroke-width=".5"/><path d="M-2 -7.4h4.6" stroke="#c9a048" stroke-width=".6"/>`
    + `<path d="M-1 -13.6Q-3 -11.6 -2.6 -9" stroke="${c.half}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
    + `<circle cx=".4" cy="-16.2" r="1.6" fill="${r.half}"/><path d="M-1 -16.6a1.6 1.6 0 0 1 2.4 -1.2" stroke="${r.lit}" stroke-width=".5" fill="none"/>`
    + `<path d="M-2.2 -17.2Q.4 -20.4 3 -17.2Q.4 -18 -2.2 -17.2Z" fill="#141216"/><path d="M-2.2 -17.2Q.4 -18 3 -17.2" stroke="#c9a048" stroke-width=".35" fill="none"/></g>`;
}
// the Company's flag, red and white stripes, flying to the left (the wind blows the flags towards the ships' bows)
function companyFlag(u, x, y, w, h, seed) {
  const id = nid('cf', u), R = rng(seed), wav = k => (R() - .5) * .6 + Math.sin(k) * h * .08;
  const d = `M${f(x)} ${f(y)}Q${f(x - w * .5)} ${f(y - h * .12 + wav(1))} ${f(x - w)} ${f(y + h * .06)}L${f(x - w * .98)} ${f(y + h * 1.04)}Q${f(x - w * .5)} ${f(y + h * .9 + wav(2))} ${f(x)} ${f(y + h)}Z`;
  let s = `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="#f4ece0"/><g clip-path="url(#${id})">`;
  for (let k = 0; k < 7; k += 2) s += `<path d="M${f(x - w * 1.1)} ${f(y + h * (k + .5) / 7)}Q${f(x - w * .5)} ${f(y + h * (k + .5) / 7 - h * .14)} ${f(x + 1)} ${f(y + h * (k + .5) / 7)}" stroke="#c0302a" stroke-width="${f(h / 7)}" fill="none"/>`;
  s += `<path d="M${f(x - w * .55)} ${f(y - h)}V${f(y + h * 2)}" stroke="#000" stroke-width="${f(w * .25)}" opacity=".12"/></g>`;
  return s;
}

module.exports = { name: 'Подкрепление флота', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2.5 });
    L.pal = Object.assign({}, L.pal, { sky: ['#2f6aa8', '#5f98cc', '#a8cbe4', '#eee6cc'], sea: ['#7eb0c4', '#2f6a84', '#0f2f3e'] });
    const R = rng(23);
    // ——— the fair day: cumulus lit from behind us, the sea, gulls; the rest of the line hull-down on the horizon
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[44, 30, 66, 12, 4, .1], [176, 22, 50, 9, 9, .2], [98, 58, 60, 7, 13, .5], [20, 74, 40, 5, 6, .65], [184, 78, 34, 4, 15, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .4, seed: 9, glitter: false });
    bg += K.ship(u, L, { kind: 'endeavour', x: 22, y: HZ + .5, scale: .12, sails: 'furled', detail: 'far', seed: 12 })
      + K.ship(u, L, { kind: 'warship', x: 52, y: HZ + .6, scale: .1, sails: 'furled', detail: 'far', seed: 13 })
      + K.ship(u, L, { kind: 'warship', x: 190, y: HZ + .6, scale: .11, sails: 'furled', detail: 'far', flip: true, seed: 14 });
    bg += PK.gulls([[92, 40, 1], [102, 34, .7], [70, 50, .8]], '#3a4a58');

    // ——— the flagship at anchor: broadside, bow to the left, sails furled; the cable from her hawse into the sea
    let mid = K.ship(u, L, { kind: 'endeavour', x: SX, y: SWL, scale: SS, sails: 'furled', seed: 6 });
    mid += K.foam(u, { x: SX + 4, y: SWL + .2, w: 96, h: .7, seed: 3, L });
    { const g = K.shipGeom('endeavour', { x: SX, y: SWL, scale: SS, seed: 6 }), h = g.nearRail(-47);
      mid += K.rope(u, L, [[h[0] + 1, h[1] + 7], [h[0] - 5, h[1] + 12], [h[0] - 9, SWL + .4]], { r: .45, seed: 4 });
      // the rope ladder from her entry port to the water: two side ropes, wooden rungs; the new men climbing it
      const top = g.nearRail(-2), lx = top[0], ly = top[1] + 1, rl = L.ramp('rope', lx, ly), rk = L.ramp('oak', lx, ly);
      let lad = `<path d="M${f(lx - 1.3)} ${f(ly)}Q${f(lx - 1.5)} ${f((ly + SWL) / 2)} ${f(lx - 1.1)} ${f(SWL + .3)}M${f(lx + 1.3)} ${f(ly)}Q${f(lx + 1.1)} ${f((ly + SWL) / 2)} ${f(lx + 1.5)} ${f(SWL + .3)}" stroke="${rl.half}" stroke-width=".3" fill="none"/>`;
      for (let yy = ly + 1.2; yy < SWL; yy += 1.25) lad += `<path d="M${f(lx - 1.5)} ${f(yy)}h3" stroke="${rk.lit}" stroke-width=".4"/>`;
      mid += `<path d="M${f(lx + 1.6)} ${f(ly)}V${f(SWL)}" stroke="#000" stroke-width="1.6" opacity=".12"/>` + lad;
      // the climbers: three redcoats on the ladder, one at the rail stepping in (the same small figure)
      for (const [dy, k] of [[4.2, 0], [9.6, 1], [14.6, 2]]) { const cy = ly + dy, c = L.ramp('paint-red', lx, cy), r = L.ramp('skin', lx, cy);
        mid += `<g transform="translate(${f(lx + .2)} ${f(cy)})"><path d="M-.6 0v2.2M.7 0l.4 ${k === 1 ? 1.4 : 2.2}" stroke="#f0ece2" stroke-width=".7"/><path d="M-1 0.2q-.3 -2.2 .2 -3.4h1.6q.6 1.2 .2 3.4z" fill="${c.half}"/>`
          + `<path d="M-.8 -2.8l-.6 -1.6M.9 -2.8l.6 -${k === 1 ? 2.2 : 1.4}" stroke="${c.half}" stroke-width=".6" stroke-linecap="round"/><circle cx=".1" cy="-4.2" r=".7" fill="${r.half}"/><path d="M-.8 -4.6q.9 -1.1 1.8 0z" fill="#141216"/></g>`; }
      { const c = L.ramp('paint-red', lx, ly), r = L.ramp('skin', lx, ly);
        mid += `<g transform="translate(${f(lx + 3)} ${f(ly - .8)})"><path d="M-1 0q-.3 -2.4 .2 -3.6h1.6q.6 1.2 .2 3.6z" fill="${c.half}"/><circle cx=".1" cy="-4.4" r=".7" fill="${r.half}"/><path d="M-.8 -4.8q.9 -1.1 1.8 0z" fill="#141216"/></g>`; } }
    // the first boat, already alongside: the same redcoats waiting their turn, two boatkeepers with the oars tossed
    { const ins = [.3, .44, .58, .72].map((t, k) => { const G = boatGeom(B2), g = G.gun(t); return redcoat(L, g[0] - .6, g[1] - .6, B2.s * 1.05); }).join('');
      const b = boat(u, L, B2, { thwarts: [.3, .44, .58, .72], inside: ins });
      mid += b.svg + K.foam(u, { x: (B2.x0 + B2.x1) / 2, y: B2.y + .2, w: 32, h: .5, seed: 8, L }); }
    // the far boat coming from the line
    { const ins = [.35, .55, .75].map(t => { const g = boatGeom(B3).gun(t); return rower(L, g[0] + 1, g[1] - .4, B3.s); }).join('');
      mid += boat(u, L, B3, { thwarts: [.35, .55, .75], inside: ins }).svg + K.foam(u, { x: 177, y: B3.y + .1, w: 20, h: .4, seed: 11, L }); }

    // ——— the near boat: heading right to her side; on each thwart a rower facing the stern at the catch, and beside
    // him a redcoat sitting with his musket upright; the officer standing at the stern under the flag, the coxswain
    // at the tiller. All the oars at one angle, every blade in the water with its ring of foam.
    const TH = [.3, .43, .56, .69, .82];
    const G1 = boatGeom(B1), S = B1.s;
    let fg = '';
    // the far oars: from the far rowlocks out and down beyond the boat (their blades on the water behind her)
    for (const t of TH) { const a = G1.fgun(t), b = [a[0] + 15, a[1] + 1.4];
      fg += `<path d="M${f(a[0] - 4)} ${f(a[1] - 3.2)}L${f(b[0])} ${f(b[1])}" stroke="${L.ramp('oak', a[0], a[1]).half}" stroke-width=".8"/>`
        + `<path d="M${f(b[0] - 1.2)} ${f(b[1] - .5)}l4.4 1.2l-.4 1l-4.4 -1.2z" fill="${L.ramp('oak', b[0], b[1]).lit}"/>`
        + `<ellipse cx="${f(b[0] + 1.5)}" cy="${f(b[1] + 1)}" rx="4" ry=".9" fill="none" stroke="#ffffff" stroke-width=".4" opacity=".7"/>`; }
    // the men inside: the redcoat beside the rower (further from us, so first), then the rower
    let men = '';
    for (const t of TH) { const a = G1.fgun(t), b = G1.gun(t), sx = a[0] * .55 + b[0] * .45, sy = a[1] * .55 + b[1] * .45;
      men += redcoat(L, sx + 3.4 * S, sy - .8 * S, .98 * S) + rower(L, sx + .4 * S, sy + 1.2 * S, S); }
    // the stern sheets: the officer, the flagstaff in its socket, the coxswain
    { const a = G1.gun(.1), b = G1.fgun(.1), ox = (a[0] + b[0]) / 2 + 2 * S, oy = (a[1] + b[1]) / 2 + S;
      men += rower(L, ox - 4 * S, oy + S, .95 * S).replace(/Q-5.4 -6.2 -7.4 -4.4/, 'Q-2 -5 1 -4.6').replace(/cx="-7.6" cy="-4.2"/, 'cx="1.2" cy="-4.6"');
      const st = G1.gun(.04), fx = st[0] + 1, fy = st[1] + 1;
      men += `<path d="M${f(fx)} ${f(fy)}L${f(fx - 1)} ${f(fy - 26 * S)}" stroke="${L.ramp('oak', fx, fy).half}" stroke-width=".8"/><circle cx="${f(fx - 1)}" cy="${f(fy - 26.4 * S)}" r=".8" fill="#e0b040"/>`
        + companyFlag(u, fx - 1.2, fy - 25.6 * S, 15 * S, 9 * S, 7) + officer(L, ox + 6 * S, oy + 3 * S, 1.02 * S); }
    const b1 = boat(u, L, B1, { thwarts: TH, inside: men });
    fg += b1.svg;
    // the near oars: from the rower's hands over the near rowlock down to the blade in the water ahead of him
    for (const t of TH) { const g = G1.gun(t), a = G1.fgun(t), hx = (a[0] * .55 + g[0] * .45) + (.4 - 7.6) * S, hy = (a[1] * .55 + g[1] * .45) + (1.2 - 4.2) * S;
      const rl = [g[0] - 1.6, g[1] - .2], dx = rl[0] - hx, dy = rl[1] - hy, k = (B1.y + 5 - hy) / dy, bx = hx + dx * k, by = hy + dy * k, ro = L.ramp('oak', rl[0], rl[1]);
      fg += `<path d="M${f(hx)} ${f(hy)}L${f(bx)} ${f(by)}" stroke="${ro.half}" stroke-width="1"/><path d="M${f(hx)} ${f(hy)}L${f(rl[0])} ${f(rl[1])}" stroke="${ro.lit}" stroke-width=".35" transform="translate(0 -.35)"/>`
        + `<path d="M${f(rl[0] - .8)} ${f(rl[1] - .6)}v1.4M${f(rl[0] + .8)} ${f(rl[1] - .6)}v1.4" stroke="#2a2a2e" stroke-width=".5"/>`;
      // the blade half under the surface, the water heaped and foaming round it
      fg += `<path d="M${f(bx - 2.6)} ${f(by - 2.4)}L${f(bx + 2.4)} ${f(by + 2)}" stroke="${ro.lit}" stroke-width="2" opacity=".55"/>`
        + `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="5.4" ry="1.3" fill="#e8f6fa" opacity=".5"/><ellipse cx="${f(bx)}" cy="${f(by)}" rx="5.4" ry="1.3" fill="none" stroke="#ffffff" stroke-width=".55"/>`
        + Array.from({ length: 5 }, () => `<circle cx="${f(bx + (R() - .5) * 8)}" cy="${f(by - R() * 2.4)}" r="${f(.25 + R() * .35)}" fill="#ffffff" opacity=".85"/>`).join(''); }
    // the bow wave and her wake
    fg += K.foam(u, { x: (B1.x0 + B1.x1) / 2 + 4, y: B1.y + .4, w: 92, h: 1.4, seed: 5, L });
    { const bx = B1.x1 + 3, by = B1.y; fg += `<path d="M${f(bx - 6)} ${f(by - .4)}q5 -3 9 -1q-2 2 -9 2.6z" fill="#ffffff" opacity=".85"/>` + Array.from({ length: 10 }, () => `<circle cx="${f(bx + R() * 7)}" cy="${f(by - 1 - R() * 3)}" r="${f(.25 + R() * .4)}" fill="#ffffff" opacity=".8"/>`).join(''); }
    // the sea darkens under the glass
    { const g = nid('dk', u); fg += `<defs>${linGrad(g, 0, 136, 0, 290, [[0, '#06141c', 0], [1, '#06141c', .55]])}</defs><rect x="0" y="136" width="200" height="154" fill="url(#${g})"/>`; }
    return [bg + mid, fg];
  } };
