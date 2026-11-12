// «Торговый караван» (Колода моря, сразу: каждая команда кладёт в Трюм 2 Пороха). A fair afternoon, the sun behind us
// on the left, a light breeze from the right. A convoy of neutral merchantmen — fat-bellied fluyts, deep with cargo,
// patched cream sails, no ports, no colours of any side — passes slowly to the left: the near one hove-to under
// reefed topsails, bales and casks piled on her deck over the rail; a sling of powder kegs is lowered from her main
// yardarm into a boat alongside, a man in it reaching up for it. Two more boats pull away from the convoy loaded
// with tarred powder kegs: the near one to the left, the far one to the right — to both ships.
// Brief: docs/mockups/print/card-briefs.md «Торговый караван», «Нейтральные суда».
'use strict';
const K = require('../kit/index.cjs');
const H = require('./lib/people.cjs');
const { f, mix, lerp, rng, nid, linGrad } = K;

const HZ = 98;                      // the horizon: raised over the series' 108 — the glass of this card starts at y ~132, the boats must sit above it
const light = { time: 'day', haze: .1, key: { type: 'sun', az: 232, el: 36, color: '#fff0cc', power: 1 }, fill: { color: '#86b8e6', power: .55 } };
const NEAR = { kind: 'merchant', x: 110, y: 116, scale: 1.15, sails: 'reefed', detail: 'near', reflect: true, wake: true, seed: 9 };
const MID = { kind: 'merchant', x: 188, y: 104, scale: .52, sails: 'full', detail: 'mid', reflect: true, wake: true, seed: 23 };
const FAR = [{ kind: 'merchant', x: 18, y: 99.6, scale: .2, sails: 'full', detail: 'far', seed: 13 }, { kind: 'merchant', x: 42, y: 99, scale: .14, sails: 'full', detail: 'far', seed: 17 }];
const BA = { y: 118.8, len: 16, dir: 1 };                // the boat alongside, under the main yardarm (x from the yard)
const BB = { x: 31, y: 129, len: 34, dir: 1 };            // the near boat pulling away to the left
const BC = { x: 174, y: 124, len: 24, dir: -1 };         // the far boat pulling away to the right
const skel = { horizon: HZ, eye: 2, light: 'the afternoon sun behind us on the left: sails and sides lit, shadows to the right and away',
  items: [
    ['near merchant', 52, NEAR.y, 112, 91, 'on the water, broadside, bow left, hove-to'],
    ['mid merchant', 162, MID.y, 40, 40, 'on the water behind, right'],
    ['convoy', 8, 100, 40, 16, 'on the horizon, left'],
    ['sling', 121, 110, 8, 9, 'hangs on the whip from the main yardarm over boat A'],
    ['boat A', 117, BA.y, 17, 6, 'water, alongside the near merchant'],
    ['boat B', 14, BB.y, 34, 22, 'water, near, pulling to the left'],
    ['boat C', 162, BC.y, 24, 12, 'water, pulling to the right'],
  ] };

module.exports = { name: 'Торговый караван', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    L.pal = Object.assign({}, L.pal, { sea: ['#86b6cc', '#3d6f88', '#16323f'], sky: ['#2f6cba', '#5b95d2', '#a6c9e6', '#f3e6c8'] });
    let bg = K.sky(u, L, { horizon: HZ });
    // fair-weather cumulus, lit from behind us on the left, smaller towards the horizon
    for (const [x, y, w, h, sd, fr] of [[156, 30, 84, 16, 11, 0], [40, 54, 50, 10, 4, .15], [198, 58, 40, 8, 6, .35], [84, 80, 44, 6, 7, .55], [12, 88, 30, 5, 15, .7], [150, 92, 30, 4, 23, .85]])
      bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 292, swell: .3, seed: 8, glitter: false });
    // the convoy: far sails on the horizon, then the second fluyt behind on the right
    for (const o of FAR) bg += `<g data-far="">${K.ship(u, L, o)}</g>`;
    bg += K.ship(u, L, MID) + K.foam(u, { x: MID.x, y: MID.y + .2, w: 34, h: .8, L, seed: 3 });
    // the near fluyt (the kit's merchant brings her own deck cargo: bales under a net, casks, a bale on the boom)
    bg += K.ship(u, L, NEAR) + K.foam(u, { x: NEAR.x, y: NEAR.y + .3, w: 78, h: 1.3, L, seed: 5 });
    const g = K.shipGeom(NEAR.kind, NEAR);
    // the whip from the main yardarm and the sling of kegs over boat A
    const s = NEAR.scale, railY = g.nearRail(0)[1], hD = railY + 1.5 * s, top = g.masts[1].top, yardY = lerp(hD, top[1], .46), yardX = top[0] - 1 + 11.27 * s;
    const sling = { x: yardX, top: 101.6 }; BA.x = yardX - 1;
    bg += whip(u, L, [yardX, yardY + .3], sling);
    bg += boatScene(u, L, BA, (gun, clip) => {
      const p = gun(.55);
      return { inside: person(u, L, { hip: [p[0], p[1] - .5], s: .66, dir: 1, lean: -8, reach: [sling.x - .2, sling.top + 8.1], shirt: '#d8d0bc', pants: '#4f4a42', cap: '#3c4a5e' })
        + K.barrel(u, L, { x: gun(.25)[0], y: gun(.25)[1] + .8, s: .085, kind: 'powder', seed: 3, contact: false }), over: '' };
    });
    bg += slingBundle(u, L, sling);
    // boat C: away to the right, one man at the oars, kegs fore and aft
    bg += boatScene(u, L, BC, gun => {
      const r = gun(.5), k = BC.len / 14;
      const man = { hip: [r[0], r[1] + .6], s: 1.05, dir: -1, lean: 12, shirt: '#7c8ea6', pants: '#4a4238', cap: '#6b3e26' };
      return { inside: K.barrel(u, L, { x: gun(.2)[0], y: gun(.2)[1] + 1.4, s: .16, kind: 'powder', seed: 5, contact: false }) + K.barrel(u, L, { x: gun(.82)[0], y: gun(.82)[1] + 1.4, s: .16, kind: 'powder', seed: 6, contact: false })
        + K.barrel(u, L, { x: gun(.7)[0], y: gun(.7)[1] + 1.6, s: .13, kind: 'powder', seed: 7, contact: false }) + person(u, L, man),
        over: oar(u, L, man, [r[0] - 1.2 * man.s, r[1]], BC.y, 8) };
    });
    // boat B: the near boat pulling away to the left, two men at the oars, kegs stacked in the stern sheets and bow
    bg += boatScene(u, L, BB, gun => {
      const r1 = gun(.3), r2 = gun(.54);
      const m1 = { hip: [r1[0], r1[1] + 1.2], s: 1.6, dir: 1, lean: 8, shirt: '#ddd5c2', pants: '#4f4a42', cap: '#3c4a5e', seed: 1 };
      const m2 = { hip: [r2[0], r2[1] + 1.2], s: 1.6, dir: 1, lean: -4, shirt: '#8a6a4a', pants: '#5a6470', cap: '#2e2a26', seed: 2 };
      let inside = '';
      for (const [t, dy, sd, sc] of [[.1, 2.6, 11, .22], [.74, 2.8, 12, .24], [.87, 2.4, 13, .24], [.97, 2.8, 14, .2]]) { const p = gun(t); inside += K.barrel(u, L, { x: p[0], y: p[1] + dy, s: sc, kind: 'powder', seed: sd, contact: false }); }
      { const p = gun(.78); inside += K.barrel(u, L, { x: p[0] + 2.4, y: p[1] - 4.4, s: .2, kind: 'powder', lying: true, seed: 15, contact: false }); }
      inside += person(u, L, m1) + person(u, L, m2);
      return { inside, over: oar(u, L, m1, [r1[0] + 1.4, r1[1]], BB.y, 21) + oar(u, L, m2, [r2[0] + 1.4, r2[1]], BB.y, 22) };
    });
    return [bg, ''];
  } };

// ——— the cargo whip: from a block on the yardarm straight down to the hook of the sling
function whip(u, L, a, sl) {
  const rp = L.ramp('rope', a[0], a[1]), ir = L.ramp('iron', a[0], a[1]);
  return `<path d="M${f(a[0])} ${f(a[1] + 1)}L${f(sl.x)} ${f(sl.top)}" stroke="${rp.outline}" stroke-width=".32" fill="none"/>`
    + `<path d="M${f(a[0] - .7)} ${f(a[1] + .3)}h1.4v1.6h-1.4Z" fill="${L.ramp('oak', a[0], a[1]).core}" stroke="${rp.outline}" stroke-width=".2"/>`
    + `<path d="M${f(sl.x)} ${f(sl.top)}q.6 .5 0 1.1" stroke="${ir.core}" stroke-width=".3" fill="none"/>`;
}
// the sling: three tarred kegs in a rope net, its legs gathered on the hook
function slingBundle(u, L, sl) {
  const x = sl.x, y = sl.top + 1.1, rp = L.ramp('rope', x, y + 3);
  let s = K.barrel(u, L, { x: x - 1.1, y: y + 6.6, s: .09, kind: 'powder', seed: 21, contact: false }) + K.barrel(u, L, { x: x + 1.2, y: y + 6.7, s: .09, kind: 'powder', seed: 22, contact: false })
    + K.barrel(u, L, { x: x + .1, y: y + 5.3, s: .085, kind: 'powder', seed: 23, contact: false });
  s += `<path d="M${f(x)} ${f(y)}L${f(x - 2.8)} ${f(y + 6.8)}M${f(x)} ${f(y)}L${f(x + 3.1)} ${f(y + 6.9)}M${f(x)} ${f(y)}L${f(x - .9)} ${f(y + 6.9)}M${f(x)} ${f(y)}L${f(x + 1.3)} ${f(y + 6.9)}`
    + `M${f(x - 2.2)} ${f(y + 5.2)}Q${f(x)} ${f(y + 6)} ${f(x + 2.5)} ${f(y + 5.3)}M${f(x - 2.8)} ${f(y + 6.8)}Q${f(x)} ${f(y + 7.4)} ${f(x + 3.1)} ${f(y + 6.9)}" stroke="${rp.core}" stroke-width=".22" fill="none" opacity=".9"/>`;
  return s;
}

// ——— KIT-CANDIDATE (from «Штиль»): a ship's boat afloat in profile with clinker strakes, a lit gunwale, a sliver of
// the inside; dir: 1 — bow to the left, -1 — bow to the right. inner(gun) gives what sits in it: `inside` is clipped
// above the near gunwale (the near side hides the kegs' and the men's lower halves), `over` goes over the boat (oars).
function boatScene(u, L, o, inner) {
  const x = o.x, y = o.y, l = o.len, k = l / 14, fb = 2.1 * k, x0 = x - l / 2, x1 = x + l / 2, d = o.dir || 1;
  const M = p => d > 0 ? p : [2 * x - p[0], p[1]], P = a => a.map(M).map(p => f(p[0]) + ' ' + f(p[1]));
  const top = t => y - fb - (1.25 * Math.pow(1 - t, 2.4) + .55 * Math.pow(t, 3)) * k;
  const sideTop = []; for (let i = 0; i <= 12; i++) { const t = i / 12; sideTop.push([lerp(x0 + .6 * k, x1, t), top(t)]); }
  const stem = [[x0 + .6 * k, top(0)], [x0 + .1 * k, top(0) + 1.2 * k], [x0 + .9 * k, y - .4 * k], [x0 + 2.4 * k, y]];
  const hullPts = [...sideTop, [x1 + .25 * k, y - .3 * k], [x1 - .4 * k, y], ...stem.slice().reverse().slice(0, 3), [x0 + .3 * k, top(0) + .5 * k]].map(M);
  const g = K.mat('ship-wood', L, { form: 'plane', x1: x0, y1: y - fb - 1.2 * k, x2: x1, y2: y, n: [0, -.15, 1], u }), rp = g.ramp, gw = L.ramp('oak', x, y - fb);
  // its shadow and a little foam on the water round it
  let out = `<ellipse cx="${f(x)}" cy="${f(y + .5 * k)}" rx="${f(l * .55)}" ry="${f(.7 * k)}" fill="${L.shadowTint}" opacity=".35"/>`;
  out += g.defs + `<path d="${smoothC(hullPts)}" fill="${g.fill}"/>`;
  for (const q of [.32, .58, .8]) { const a = []; for (let i = 0; i <= 10; i++) { const t = i / 10; a.push([lerp(x0 + (1.2 + q * 1.4) * k, x1 - .1 * k, t), lerp(top(t), y, q)]); }
    out += `<path d="M${P(a).join('L')}" stroke="${rp.shadow}" stroke-width="${f(.28 * k)}" fill="none" opacity=".8"/><path d="M${P(a.map(p => [p[0], p[1] - .3 * k])).join('L')}" stroke="${rp.half}" stroke-width="${f(.16 * k)}" fill="none" opacity=".6"/>`; }
  const inner0 = []; for (let i = 0; i <= 10; i++) { const t = i / 10; inner0.push([lerp(x0 + 1.4 * k, x1 - .2 * k, t), top(t) - .55 * k * Math.sin(Math.PI * Math.min(1, t * 1.1))]); }
  out += `<path d="M${P(inner0).join('L')}L${P(sideTop.slice().reverse()).join('L')}Z" fill="${L.ramp('ship-wood', x, y).reflex}"/>`;
  // the gunwale point at t (0 — bow, 1 — stern) on the near side
  const gun = t => M([lerp(x0 + .6 * k, x1, t), top(t)]);
  const cid = nid('bt', u), cl = sideTop.map(M);
  const res = inner(gun);
  out += `<defs><clipPath id="${cid}"><path d="M${cl.map(p => f(p[0]) + ' ' + f(p[1] + .15)).join('L')}L${f(cl[cl.length - 1][0])} ${f(y - 40)}L${f(cl[0][0])} ${f(y - 40)}Z"/></clipPath></defs><g clip-path="url(#${cid})">${res.inside}</g>`;
  out += `<path d="M${P(sideTop).join('L')}" stroke="${gw.lit}" stroke-width="${f(.45 * k)}" fill="none" stroke-linecap="round"/>`;
  out += `<path d="${smoothC(hullPts)}" fill="none" stroke="${rp.outline}" stroke-width="${f(.3 * k)}" stroke-linejoin="round"/>`;
  out += K.foam(u, { x: x - d * l * .42, y: y + .2, w: l * .3, h: .5 + .1 * k, L, seed: Math.round(x) }) + K.foam(u, { x: x + d * l * .5, y: y + .4, w: l * .4, h: .4 + .08 * k, L, seed: Math.round(x) + 7 });
  return out + res.over;
}
function smoothC(pts) { const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
  d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d + 'Z'; }

// ——— the men: small contours (lib/people.cjs). o.hip — where he sits; s — size (the torso 3.6·s); dir — the way he
// faces (oarsmen face the stern); lean — degrees, back from upright; reach — both hands up to this point.
function tones(L, c) { return { lit: mix(c, mix(L.keyColor, '#ffffff', .3), .45), half: c, core: c, shadow: mix(c, '#162230', .45), outline: '#1a140e' }; }
function frame(o) {
  const s = o.s, d = o.dir, a = (o.lean || 0) * Math.PI / 180, up = [-d * Math.sin(a), -Math.cos(a)], fr = [d * Math.cos(a), -Math.sin(a)];
  const P = (t, n) => [o.hip[0] + up[0] * t * s + fr[0] * n * s, o.hip[1] + up[1] * t * s + fr[1] * n * s];
  const hands = o.reach || [o.hip[0] + d * 3 * s, o.hip[1] - 1.9 * s];
  return { P, up, fr, hands };
}
function person(u, L, o) {
  const s = o.s, d = o.dir, { P, fr, hands } = frame(o), sh = tones(L, o.shirt), tr = tones(L, o.pants), skin = { lit: '#f0c8a0', half: '#c99470', core: '#b07a54', shadow: '#7a4a32', outline: '#3a2014' };
  const litSide = fr[0] * L.ux + fr[1] * L.uy >= 0 ? 1 : -1;      // does his front face the sun?
  const shN = P(3.2, .1), shF = P(3.25, -.25), arm = (a, w, tone, op) => { const el = [lerp(a[0], w[0], .5) + (o.reach ? fr[0] * .5 * s : -d * .2 * s), lerp(a[1], w[1], .5) + (o.reach ? 0 : .9 * s)];
    return `<g opacity="${op}">${H.cloth(u, { spine: [a, el, w], w: [1.05 * s, .9 * s, .75 * s], tone, lit: litSide * d, folds: false, capA: true })}</g>`; };
  let out = '';
  // legs: the thigh forward and the knee up, the shin down into the boat
  const kn = P(1.1, 2.5), ft = [kn[0] + d * .5 * s, kn[1] + 2.6 * s];
  out += H.cloth(u, { spine: [P(.2, .3), kn, ft], w: [1.6 * s, 1.3 * s, 1.1 * s], tone: tr, lit: 1, folds: false, capA: true });
  // the far arm (darker), the torso, the near arm
  out += arm(shF, [hands[0] - d * .3 * s, hands[1] + .2 * s], { lit: sh.half, half: sh.shadow, core: sh.shadow, shadow: mix(sh.shadow, '#0e141c', .4), outline: sh.outline }, 1);
  const T = [P(0, -1), P(1.3, -1.05), P(2.5, -1.08), P(3.3, -.95), P(3.75, -.5), P(3.75, .45), P(3.3, .9), P(2.4, .95), P(1.2, .85), P(0, 1)];
  const gid = nid('tr', u), A = P(1.8, 1.1 * litSide), B = P(1.8, -1.1 * litSide);
  out += `<defs>${linGrad(gid, A[0], A[1], B[0], B[1], [[0, sh.lit], [.45, sh.half], [1, sh.shadow]])}</defs><path d="${H.sp(T, true)}" fill="url(#${gid})" stroke="${sh.outline}" stroke-width="${f(.16 * s)}"/>`;
  out += `<path d="${H.sp([P(.9, -.2), P(2.1, .2), P(2.9, -.1)])}" stroke="${sh.shadow}" stroke-width="${f(.14 * s)}" fill="none" opacity=".6"/>`;
  // the neck, the head, the knitted cap
  const hc = P(4.6, .2), r = .78 * s, nk = P(3.7, .1);
  out += `<path d="M${f(nk[0])} ${f(nk[1])}L${f(lerp(nk[0], hc[0], .6))} ${f(lerp(nk[1], hc[1], .6))}" stroke="${skin.core}" stroke-width="${f(.7 * s)}" stroke-linecap="round"/>`;
  { const hid = nid('hd', u), a = [hc[0] + L.ux * r, hc[1] + L.uy * r], b = [hc[0] - L.ux * r, hc[1] - L.uy * r];
    out += `<defs>${linGrad(hid, a[0], a[1], b[0], b[1], [[0, skin.lit], [.5, skin.half], [1, skin.shadow]])}</defs><ellipse cx="${f(hc[0])}" cy="${f(hc[1])}" rx="${f(r * .92)}" ry="${f(r)}" fill="url(#${hid})" stroke="${skin.outline}" stroke-width="${f(.12 * s)}"/>`
      + `<path d="M${f(hc[0] + d * r * .85)} ${f(hc[1] - r * .05)}l${f(d * .28 * s)} ${f(.22 * s)}l${f(-d * .3 * s)} ${f(.08 * s)}" fill="${skin.half}" stroke="${skin.outline}" stroke-width="${f(.1 * s)}"/>`; }
  { const c = tones(L, o.cap), cp = [P(4.75, -1.0), P(5.4, -.75), P(5.6, .05), P(5.3, .75), P(4.75, .95)];
    out += `<path d="${H.sp(cp)}Z" fill="${c.half}" stroke="${c.outline}" stroke-width="${f(.12 * s)}"/><path d="${H.sp([P(5.35, -.6), P(5.55, .1)])}" stroke="${c.lit}" stroke-width="${f(.18 * s)}" fill="none" opacity=".7"/>`; }
  out += arm(shN, hands, sh, 1);
  out += `<ellipse cx="${f(hands[0])}" cy="${f(hands[1])}" rx="${f(.42 * s)}" ry="${f(.36 * s)}" fill="${skin.half}" stroke="${skin.outline}" stroke-width="${f(.1 * s)}"/>`;
  return out;
}
// an oar: from his hands over the thole on the near gunwale down into the water, the blade dipped, a ring of foam
function oar(u, L, o, thole, wy, seed) {
  const { hands } = frame(o), s = o.s, dx = thole[0] - hands[0], dy = thole[1] - hands[1], l = Math.hypot(dx, dy), D = [dx / l, dy / l];
  const t = (wy + 2.2 - hands[1]) / D[1], end = [hands[0] + D[0] * t, hands[1] + D[1] * t], st = [hands[0] - D[0] * .9 * s, hands[1] - D[1] * .9 * s];
  const ok = { outline: '#5a3e22', lit: '#f2e2bc', half: '#cdb084' }, bl = [end[0] - D[0] * 2.2 * s, end[1] - D[1] * 2.2 * s];
  let out = `<path d="M${f(st[0])} ${f(st[1])}L${f(end[0])} ${f(end[1])}" stroke="${ok.outline}" stroke-width="${f(.62 * s)}" stroke-linecap="round"/>`
    + `<path d="M${f(st[0])} ${f(st[1])}L${f(end[0])} ${f(end[1])}" stroke="${ok.half}" stroke-width="${f(.36 * s)}" stroke-linecap="round" transform="translate(${f(-.08 * s)} ${f(-.08 * s)})"/>`;
  // the blade, widening to its tip at the water
  const n = [-D[1], D[0]], w = .45 * s;
  out += `<path d="M${f(bl[0])} ${f(bl[1])}L${f(end[0] + n[0] * w)} ${f(end[1] + n[1] * w)}L${f(end[0] - n[0] * w)} ${f(end[1] - n[1] * w)}Z" fill="${ok.half}" stroke="${ok.outline}" stroke-width="${f(.12 * s)}"/>`;
  // the thole pin, the hand over the loom again (he grips it)
  out += `<path d="M${f(thole[0])} ${f(thole[1] + .3)}l0 ${f(-.9 * s)}" stroke="${L.ramp('iron').core}" stroke-width="${f(.2 * s)}"/>`;
  out += `<ellipse cx="${f(hands[0])}" cy="${f(hands[1])}" rx="${f(.42 * s)}" ry="${f(.36 * s)}" fill="#c99470" stroke="#3a2014" stroke-width="${f(.1 * s)}"/>`;
  out += K.foam(u, { x: end[0], y: end[1] + .1, w: 3 * s, h: .4 * s, L, seed });
  return out;
}
