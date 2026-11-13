// «Водоворот» (Летучий голландец, РЕАКЦИЯ: до конца этого хода каждый Залп наносит на 1 урон меньше), method A — a
// detailed copy of the first-round scene (portrait-dutch.cjs SCENES['Водоворот']). The concept stays: a storm at
// night, lightning, the sea opens in a whirlpool, cannon balls and broken planks are drawn round into it, the enemy
// (the Endeavour) heeled at its edge. Brief (card-briefs.md «Водоворот»): a funnel in the sea BETWEEN the ships, the
// balls spiral down and sink in it; unlike the sea card «Мальстрём» (there the ships themselves circle inside a
// giant funnel seen from its rim) — here we stand low over the sea at a distance, the funnel lies between the two
// ships, they stay outside it, and what it swallows is the shot.
// Fixed against the first round: the old whirl was flat white rings on a black blot with a pasted ship on it and one
// ball hanging in the air — now a funnel of water in perspective (its far wall turning down into a dark eye, spiral
// bands of foam, a lit lip), the Endeavour (kit) at its right firing her broadside, the Dutchman a green ghost in the
// rain on the left; each ball shows its own stage: one flies, its trail bending down into a corkscrew over the funnel;
// one runs round the far wall leaving a spiral wake of spray; one drops into the eye with a small splash.
// Review fix (verdict b5): no closed rings any more — 4 open spiral arms of foam tapering into the eye, the rim
// foam broken; the hanging «hoop» (ball 1's first turn) is gone: its trail now swings round the far wall in under
// a turn and goes on down as dots to the eye; ball 2 is half swallowed in the black eye; the funnel is a little
// smaller and the Endeavour a little further right, so the foam stays ~10 units clear of her; the Dutchman is
// drawn mid-detail and toned (lighter on the side towards the lightning, a faint green on her sails and windows,
// kept softer than the Endeavour).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp, clamp } = K;
const { motes } = PK;

const HZ = 78;
const EN = { kind: 'endeavour', x: 169, y: 100, scale: .42, heel: 6 };            // bow left, dipping towards the funnel
const DU = { kind: 'dutch', x: 34, y: 90, scale: .5 };                           // far left, in the rain
const V = { x: 80, y: 105, rx: 44, ry: 13 };                                      // the funnel's rim
const light = { time: 'night', haze: .55, key: { type: 'moon', x: 92, y: 14, el: 40, color: '#d8fff0', power: .7 }, fill: { color: '#20403a', power: .5 },
  rim: { az: 0, color: '#d8fff0', power: .5 }, locals: [{ x: 140, y: 94, color: '#ffb060', power: .45, radius: 26 }] };
const skel = { horizon: HZ, eye: 3, light: 'the lightning in the clouds over the funnel (key from above, a little behind) + the gun flashes on the right', items: [
  ['funnel', V.x - V.rx, V.y + V.ry, 2 * V.rx, 2 * V.ry + 4, 'the sea between the ships'], ['Endeavour, heel 6', 147, 100, 46, 44, 'the sea right of the funnel'],
  ['Dutchman', 10, 90, 48, 34, 'far sea left, in the rain'], ['ball 1 + spiral trail', 56, 86, 80, 22, 'in the air, round over the funnel'],
  ['ball 2 + splash', 80, 106, 10, 8, 'half sunk in the eye'], ['lightning', 82, 46, 16, 46, 'the clouds'],
  ['planks', 56, 112, 80, 14, 'on the funnel wall'], ['near sea', 0, 130, 200, 160, 'under the glass']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
function sp(pts, closed) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${P2(p2)}`; }
  return d + (closed ? 'Z' : '');
}
// the funnel in perspective: contour k = 0 (the rim) .. 1 (the eye); we look over its near lip, so the near halves
// of the inner contours bunch up under it and the far wall faces us, turning down to the eye
const C = k => ({ cx: V.x, cy: V.y + 6 * k, rx: lerp(V.rx, 3.4, Math.pow(k, .7)), up: lerp(V.ry, 1.4, Math.pow(k, .8)), dn: lerp(V.ry, 3.6, Math.pow(k, 1.6)) });
const Pf = (k, t) => { const c = C(k), s = Math.sin(t); return [c.cx + c.rx * Math.cos(t), c.cy + (s < 0 ? c.up : c.dn) * s]; };
const ring = k => { const pts = []; for (let i = 0; i < 36; i++) pts.push(Pf(k, -Math.PI + i / 36 * 2 * Math.PI)); return sp(pts, true); };

// KIT-CANDIDATE bolt: a jagged lightning stroke from (x0, y0) to (x1, y1) with two forks; a blurred glow, a white core
function bolt(u, x0, y0, x1, y1, seed) {
  const R = rng(seed), n = 9, main = [];
  for (let i = 0; i <= n; i++) { const t = i / n; main.push([lerp(x0, x1, t) + (i && i < n ? (R() - .5) * 8 : 0), lerp(y0, y1, t)]); }
  const forks = [3, 6].map((i, j) => { const a = main[i], pts = [a]; let p = a; for (let k = 0; k < 4; k++) { p = [p[0] + (j ? 4 : -4) + (R() - .5) * 3, p[1] + 3.4 + R() * 2]; pts.push(p); } return pts; });
  const gl = nid('bg', u), d = 'M' + main.map(P2).join('L'), fd = forks.map(p => 'M' + p.map(P2).join('L')).join('');
  return `<defs><filter id="${gl}" x="-100%" y="-20%" width="300%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`
    + `<g style="mix-blend-mode:screen"><path d="${d}${fd}" stroke="#9effd8" stroke-width="4" fill="none" opacity=".55" filter="url(#${gl})"/>`
    + `<path d="${d}" stroke="#e8fff6" stroke-width="1.1" fill="none" stroke-linejoin="bevel"/><path d="${fd}" stroke="#e8fff6" stroke-width=".55" fill="none" opacity=".85"/></g>`;
}

module.exports = { name: 'Водоворот', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 }), R = rng(41);
    L.pal = Object.assign({}, L.pal, { sky: ['#050c0b', '#0e1e1b', '#1c3832', '#36584e'], sea: ['#6a9a8a', '#173c34', '#05120f'], cloudLit: '#a8d4c4', cloudShade: '#0c1a17' });
    // ——— the storm: low cloud lit from inside by the lightning over the funnel ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 3 });
    bg += K.localGlow(u, { x: 92, y: 34, color: '#bfffe4', power: .45, radius: 60 }, { core: false });
    for (const [x, y, w, h, sd, fr] of [[40, 24, 110, 14, 4, .2], [160, 30, 110, 14, 9, .25], [96, 52, 90, 9, 2, .45], [20, 64, 60, 7, 14, .6], [176, 66, 70, 7, 6, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += bolt(u, 97, 0, 88, 48, 5);
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .85, seed: 21, glitter: 92 });
    // the Dutchman far on the left: a green ghost in the rain, her lantern lit
    // (mid detail for 2–3 tones; then softened, lit from the lightning side (right), a faint green on sails and windows)
    { const mk = nid('dm', u), lg = nid('dl', u), gg = nid('dg', u);
      bg += `<g opacity=".74">${K.ship(u, L, { ...DU, sails: 'full', detail: 'mid', lights: true, seed: 3 })}</g>`;
      bg += `<defs><mask id="${mk}">${K.shipSilhouette('dutch', { ...DU, sails: 'full', seed: 3, color: '#ffffff', u: u + 'dm' })}</mask>`
        + `${linGrad(lg, DU.x - 24, 0, DU.x + 24, 0, [[0, '#06120f', .38], [.5, '#3a6a5c', .05], [1, '#c8ffe4', .34]])}`
        + `${radGrad(gg, DU.x + 6, 72, 22, [[0, '#8affcc', .3], [1, '#8affcc', 0]])}</defs>`
        + `<g mask="url(#${mk})"><rect x="${DU.x - 26}" y="40" width="52" height="60" fill="url(#${lg})"/><rect x="${DU.x - 26}" y="40" width="52" height="60" fill="url(#${gg})" style="mix-blend-mode:screen"/></g>`;
      bg += K.localGlow(u, { x: DU.x + 18, y: 84, color: '#8affcc', power: .3, radius: 9 }, { core: false }); }
    bg += K.fog(u, L, { y: HZ - 10, h: 20, density: .5, seed: 5 });

    // ——— the funnel ———
    let fun = '';
    { const N = 26, lip = mix(L.pal.sea[0], '#d8fff0', .25);
      let rings = '';
      for (let i = 0; i <= N; i++) { const k = i / N, c = k < .3 ? mix(mix(L.pal.sea[0], '#d8fff0', .3), L.pal.sea[1], k / .3) : mix(L.pal.sea[1], '#010604', Math.pow((k - .3) / .7, .6)); rings += `<path d="${ring(k)}" fill="${c}"/>`; }
      const fb = nid('fb', u); fun += `<defs><filter id="${fb}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><g filter="url(#${fb})">${rings}</g>`;
      // the far wall faces the lightning: a cold sheen across its upper part
      const sh = nid('fs', u); fun += `<defs>${radGrad(sh, V.x, V.y - 6, 40, [[0, '#c8ffe8', .28], [1, '#c8ffe8', 0]])}</defs><ellipse cx="${V.x}" cy="${V.y - 5}" rx="40" ry="6" fill="url(#${sh})" style="mix-blend-mode:screen"/>`;
      // swells running round the far wall: light crests on dark troughs, along the contours
      for (let j = 0; j < 30; j++) { const k = Math.pow((j + R()) / 30, 1.1) * .85, t0 = -Math.PI * (.05 + R() * .9), dt = .3 + R() * .5, up = [], base = [];
        for (let i = 0; i <= 8; i++) { const t = t0 - dt * i / 8, b = Math.sin(Math.PI * i / 8) * (.012 + .03 * (1 - k)); base.push(Pf(k, t)); up.push(Pf(Math.max(0, k - b), t)); }
        fun += `<path d="${sp(up)}${sp(base.slice().reverse()).replace(/^M/, 'L')}Z" fill="${lip}" opacity="${f((.12 + .3 * (1 - k)) * (.6 + R() * .5))}"/>`; }
      // 4 open spiral arms of foam running in to the eye: each a tapering ribbon of under a turn (never a closed ring),
      // broad and bright at the rim, thin at the eye; on the near half they slip under the lip, so each shows as an
      // arm sweeping down across the far wall
      for (let a = 0; a < 4; a++) { const t0 = -a / 4 * Math.PI * 2 + .15 + R() * .2, turns = .52 + R() * .06, n = 80, segs = [];
        let seg = null;
        for (let i = 0; i <= n; i++) { const q = i / n, k = Math.pow(q, .65) * .96, t = t0 - q * turns * 2 * Math.PI, w = (.09 * (1 - k) + .008) * (.75 + .25 * Math.sin(q * 9 + a));
          const hide = Math.sin(t) > .2 && k > .06, brk = Math.sin(q * 15 + a * 2.3) < -.85;
          if (hide || brk) { if (seg) segs.push(seg); seg = null; continue; }
          if (!seg) seg = { a: [], b: [], k: [] }; seg.a.push(Pf(Math.max(0, k - w * .4), t)); seg.b.push(Pf(Math.min(1, k + w * .6), t)); seg.k.push(k); }
        if (seg) segs.push(seg);
        for (const g of segs) { if (g.a.length < 3) continue; const km = g.k[g.k.length >> 1], op = (.95 - km * .55) * (.8 + R() * .2);
          fun += `<path d="${sp(g.a)}${sp(g.b.slice().reverse()).replace(/^M/, 'L')}Z" fill="#dff8ee" opacity="${f(op * .7)}"/><path d="${sp(g.a)}" stroke="#f6fffb" stroke-width="${f(.3 + 1.1 * (1 - km))}" fill="none" opacity="${f(op)}" stroke-linecap="round"/>`;
          // the dark trough on the inner side of each arm: more contrast for the spiral at hand's length
          fun += `<path d="${sp(g.b)}" stroke="#010806" stroke-width="${f(.4 + .8 * (1 - km))}" fill="none" opacity="${f(.3 * op)}" stroke-linecap="round"/>`; } }
      // the eye: black-green, deep
      const ey = nid('fe', u), c1 = C(1); fun += `<defs>${radGrad(ey, c1.cx, c1.cy, 9, [[0, '#000604', 1], [.6, '#02100c', .85], [1, '#02100c', 0]])}</defs><ellipse cx="${c1.cx}" cy="${c1.cy}" rx="10" ry="3.6" fill="url(#${ey})"/>`;
      // the near lip: the sea heaped round the rim, a ragged edge of foam over it; churned water on the outside
      // (broken: three stretches of the near lip, foam in clumps where the arms leave the rim — no closed ring)
      for (const [a0, a1] of [[.12, .9], [1.15, 2.1], [2.35, 3.0]]) fun += `<path d="${sp(Array.from({ length: 9 }, (_, i) => Pf(0, lerp(a0, a1, i / 8))))}" stroke="#effff8" stroke-width="1.5" fill="none" opacity=".6" stroke-linecap="round"/>`;
      for (let i = 0; i < 10; i++) { if (i % 3 === 2 || Math.cos((i + .5) / 10 * Math.PI * 2) > .75) continue; const t = (i + .5) / 10 * Math.PI * 2, p = Pf(0, t), w = 7 + R() * 5 - 3 * Math.abs(Math.cos(t)); fun += K.foam(u, { x: p[0], y: p[1], w, h: Math.sin(t) > 0 ? 1.7 : 1.1, seed: 60 + i, L }); }
      // the sea drawn in towards it: long streaks of foam on the outside, curving in
      for (let a = 0; a < 5; a++) { const t0 = a / 5 * Math.PI * 2 + R() * .5, pts = [];
        for (let i = 0; i <= 18; i++) { const q = i / 18, t = t0 - q * 2.2, kk = lerp(1.7, 1.04, Math.pow(q, .7)); const pp = [V.x + Math.cos(t) * V.rx * kk, V.y + Math.sin(t) * V.ry * kk * (Math.sin(t) > 0 ? 1.3 : 1)]; if (pp[0] < EN.x - 44) pts.push(pp); }
        if (pts.length < 4) continue;
        fun += `<path d="${sp(pts)}" stroke="#d8fff0" stroke-width=".7" fill="none" opacity="${f(.14 + R() * .14)}" stroke-dasharray="${f(14 + R() * 10)} ${f(3 + R() * 4)} ${f(5 + R() * 5)} ${f(2 + R() * 3)}" stroke-linecap="round"/>`; }
      // broken planks drawn round on the far wall, turned along the flow
      for (const [k, t, l] of [[.3, -2.5, 9], [.55, -.6, 7], [.2, -1.4, 6]]) { const p = Pf(k, t), q = Pf(k, t - .15), a = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
        fun += `<g transform="translate(${P2(p)}) rotate(${f(a)})"><path d="M${-l / 2} -1.1L${l / 2 - 1} -1.2L${l / 2} 0L${l / 2 - .6} 1.1L${-l / 2} 1z" fill="#5a4030" stroke="#1a100a" stroke-width=".3"/><path d="M${-l / 2} -.3H${l / 2 - 1}" stroke="#2a1a10" stroke-width=".25"/><path d="M${-l / 2} -1H${l / 2 - 1}" stroke="#c8e8d8" stroke-width=".25" opacity=".6"/></g>`
          + `<path d="M${f(p[0] + 1)} ${f(p[1] + .9)}q${f(-l * .3)} .8 ${f(-l * .8)} .2" stroke="#e8fff6" stroke-width=".4" fill="none" opacity=".6"/>`; } }

    // ——— the Endeavour at its right edge, heeled towards it, her broadside going off ———
    let en = K.ship(u, L, { ...EN, sails: 'reefed', detail: 'mid', lights: true, wake: false, seed: 6 });
    en += K.foam(u, { x: EN.x, y: EN.y + .4, w: 46, h: 1.8, seed: 9, L });
    const G = K.shipGeom(EN.kind, EN), ports = [-34, -26, -18].map(X => { const p = G.nearRail(X); return [p[0] - 1.2, p[1] + 3.2]; });
    en += K.smoke(u, L, { x: ports[2][0] - 4, y: ports[2][1], w: 26, h: 14, wind: -.6, seed: 8, opacity: .7 })
      + K.smoke(u, L, { x: ports[0][0] - 4, y: ports[0][1], w: 18, h: 10, wind: -.8, seed: 3, opacity: .6, glow: { color: '#ffb060', power: .5 } });
    en += K.muzzleFlash(u, { x: ports[0][0], y: ports[0][1], dir: 196, len: 16, seed: 2 }) + K.muzzleFlash(u, { x: ports[1][0], y: ports[1][1], dir: 190, len: 8, seed: 1 })
      + K.localGlow(u, { x: ports[0][0] - 5, y: ports[0][1], color: '#ffb24a', power: .45, radius: 22 }, { core: false });

    // ——— the balls ———
    let sh = '';
    const ball = (p, r) => K.shadeSphere(u, p[0], p[1], r, L, 'iron', { outline: .3 }) + `<path d="M${f(p[0] - r * .7)} ${f(p[1] - r * .5)}a${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(r * 1.1)} ${f(-r * .4)}" stroke="#e8fff4" stroke-width="${f(r * .2)}" fill="none" opacity=".8"/>`;
    // ball 1: out of the first port, over the water, and the whirl takes it: its trail swings round over the far wall
    // (under a turn, descending — no closed loop), the ball low over the left of the funnel, its way on down to the eye in dots
    { const pts = [], far = [], A = [ports[0][0] - 9, ports[0][1] - .6], R0 = 30, Z0 = 15, H0 = [V.x + R0, V.y - Z0], T1 = -1.15 * Math.PI, T2 = -2.3 * Math.PI;
      for (let i = 0; i < 10; i++) { const q = i / 10; pts.push([lerp(A[0], H0[0], q), lerp(A[1], H0[1], q) - Math.sin(q * Math.PI) * 3]); far.push(false); }
      const sw = (t) => { const q = t / T2, r = lerp(R0, 2.5, Math.pow(q, .8)), z = lerp(Z0, 0, Math.pow(q, .7)); return [V.x + Math.cos(t) * r, V.y + 2 * q - z + Math.sin(t) * r * .26]; };
      for (let i = 0; i <= 30; i++) { const t = T1 * i / 30; pts.push(sw(t)); far.push(Math.sin(t) < 0); }
      const nP = pts.length - 1;
      for (let i = 0; i < nP; i++) { const q = i / nP;
        sh += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#f4fffa" stroke-width="${f(.45 + q * 1.7)}" opacity="${f((.3 + q * .65) * (far[i] ? .8 : 1))}" stroke-linecap="round"/>`; }
      sh += K.localGlow(u, { x: pts[nP][0], y: pts[nP][1], color: '#e8fff4', power: .35, radius: 6 }, { core: false }) + ball(pts[nP], 2.8);
      // the rest of its way: faint dots winding down to the eye
      for (let i = 1; i <= 12; i++) { const p = sw(lerp(T1, T2, i / 12)); sh += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.5 - i * .02)}" fill="#effff8" opacity="${f(.45 - i * .02)}"/>`; } }
    // ball 2: it ran round the far wall (its wake a spiral of spray behind it) and is half gone into the black eye
    { const c1 = C(1), e = [c1.cx - 1.5, c1.cy - .3], r = 2.7;
      for (let i = 1; i <= 18; i++) { const kk = .96 - i * .03, tt = -2 * Math.PI * .1 + i * .2, p = Pf(Math.max(.3, kk), tt), w = 2 * Math.sin(Math.PI * i / 19) * (1 - i / 25);
        if (Math.sin(tt) > .2) continue; sh += `<ellipse cx="${f(p[0])}" cy="${f(p[1] - w * .4)}" rx="${f(w * 1.3)}" ry="${f(w * .55)}" fill="#effff8" opacity="${f(.6 * (1 - i / 19))}"/>`; }
      const cp = nid('bc', u); sh += K.localGlow(u, { x: e[0], y: e[1] - 1, color: '#d8fff0', power: .45, radius: 6 }, { squash: .6, core: false }) + `<defs><clipPath id="${cp}"><rect x="${f(e[0] - 5)}" y="${f(e[1] - 6)}" width="10" height="6"/></clipPath></defs><g clip-path="url(#${cp})">${ball([e[0], e[1] + .4], r)}</g>`;
      // the black water closing over it: a dark lip in front and a thin ring of spray thrown up round it
      sh += `<ellipse cx="${f(e[0])}" cy="${f(e[1] + .3)}" rx="${f(r * 1.6)}" ry=".7" fill="#000604" opacity=".85"/><path d="M${f(e[0] - r * 1.5)} ${f(e[1])}q${f(r * 1.5)} 1.2 ${f(r * 3)} 0" stroke="#effff8" stroke-width=".4" fill="none" opacity=".75"/>`;
      sh += `<path d="M${f(e[0] - 2)} ${f(e[1] - .2)}q-.6 -2.4 -.2 -4.4M${f(e[0] + 2.2)} ${f(e[1] - .2)}q.8 -2 1.6 -3.4" stroke="#effff8" stroke-width=".4" fill="none" opacity=".65" stroke-linecap="round"/>`;
      for (let i = 0; i < 8; i++) { const rr = .18 + R() * .25; sh += `<circle cx="${f(e[0] + (R() - .5) * 8)}" cy="${f(e[1] - 1 - R() * 5)}" r="${f(rr)}" fill="#effff8" opacity="${f(.4 + R() * .4)}"/>`; } }

    // ——— rain, spray in the wind, the under-glass dark ———
    let lt = '';
    for (let i = 0; i < 90; i++) { const x = R() * 220 - 10, y = R() * 150, l = 5 + R() * 7; lt += `<path d="M${f(x)} ${f(y)}l${f(-l * .25)} ${f(l)}" stroke="#cfeee4" stroke-width="${f(.2 + R() * .2)}" opacity="${f(.15 + R() * .25)}"/>`; }
    lt += motes(16, 50, 90, 120, 30, '#effff4', 7);
    lt += K.localGlow(u, { x: V.x, y: V.y - 4, color: '#bfffe4', power: .15, radius: 46 }, { squash: .4, core: false });
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 132, 0, 290, [[0, '#04140f', 0], [.35, '#04140f', .55], [1, '#020806', .88]])}</defs><rect x="-10" y="132" width="220" height="158" fill="url(#${gl})"/>`; }
    return [bg, fun + en + sh + lt];
  } };
