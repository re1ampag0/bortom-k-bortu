// «Уйти на глубину» (Летучий голландец, РЕАКЦИЯ: отмените Залп по «Голландцу»; Порох за него не возвращается),
// method A — a detailed copy of the first-round scene (portrait-dutch.cjs SCENES['Уйти на глубину']). The concept
// stays: the Dutchman dives bow first, her stern standing up out of the sea; the enemy far off in the fog has fired,
// and the shot passes over her and only throws up a column of water beyond. Brief (card-briefs.md «Уйти на глубину»):
// where the ship was — foam and a funnel, the shot flies over empty water. Find: the empty place.
// Fixed against the first round: the old ship was a pasted picture with no water on her — now the kit's Dutchman,
// bow right and already deep, cut by the sea; under the surface her drowned hull still shows, green and dim, going
// down; the sea round her turns in a ring of foam with spiral streaks running in to her; the water pours off her
// raised stern in translucent ribbons that tear into threads and spray; the enemy is a real ship with a flash and
// smoke; the ball is a real ball with its trail arcing high over her masts, the second ball's column beyond her.
// Review fix (verdict b5): the stern falls are now 5 thin wavy translucent streams (narrow at the rail, widening
// into spray at the foam, no flat top); the ball flies low over the right of the foam ring (a cubic arc that clears her
// stern and drops steeply to the column beyond), not up by the moon; the foam is no longer closed rings — torn arcs
// and arms twisting in to the centre, a funnel.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const HZ = 90, SEA = 112;                          // the horizon; the sea where she goes down (the kit cuts lower: she is deeper)
const DU = { kind: 'dutch', x: 100, y: 130, scale: 1.2, flip: true, heel: 38, slope: true };   // bow right, down; slope: the kit keeps her whole hull (cut along her own waterline), the scene cuts at the sea
const EN = { kind: 'endeavour', x: 25, y: HZ + 2.4, scale: .27, flip: true };
const FUN = { x: 108, y: SEA + 1, rx: 68, ry: 9 };   // the ring of foam round her
const SHOT = { a: [37, 88.6], c1: [70, 20], c2: [140, 40], b: [168, 97] };   // the ball's path (cubic): the enemy's port → just over her stern → down over the right of the ring → the column beyond
const light = { time: 'fog', haze: .75, key: { type: 'moon', x: 86, y: 24, el: 30, color: '#d4f4e4', power: .75 }, fill: { color: '#2f5a50', power: .45 },
  rim: { az: 20, color: '#d8fff0', power: .5 }, locals: [{ x: 70, y: 84, color: '#9effd0', power: .4, radius: 30 }] };
const skel = { horizon: HZ, eye: 2, light: 'the moon in the fog upper left of centre (key, a little behind her) + the green of her lantern and of the deep', items: [
  ['Dutchman, flip, heel 38 (bow down)', 58, SEA, 126, 60, 'the sea: cut at y 112, the rest under water'],
  ['drowned hull', 90, 150, 80, 36, 'under the surface, dim green'], ['ring of foam + spiral', 48, 124, 132, 18, 'the sea round her'],
  ['falls off the stern', 52, SEA, 36, 34, 'from her stern rail down to the sea'], ['enemy', 12, 92, 28, 30, 'far sea left, firing'],
  ['ball + trail', 37, 90, 150, 70, 'in the air, high over her masts'], ['column of water', 162, 97, 12, 22, 'the sea beyond her (behind her foremast)'], ['near sea', 0, 130, 200, 160, 'under the glass']] };

// a point of the ship in her own frame (X along the hull, + to the stern; H up from the waterline) → the picture
function pt(o, X, Hh) {
  const dir = o.flip ? -1 : 1, s = o.scale, th = -dir * (o.heel || 0) * Math.PI / 180, dx = dir * s * X, dy = -s * Hh;
  return [o.x + dx * Math.cos(th) - dy * Math.sin(th), o.y + dx * Math.sin(th) + dy * Math.cos(th)];
}
const P2 = p => `${f(p[0])} ${f(p[1])}`;
const bez3 = (A, C, D, B, t) => { const a = 1 - t, k = [a * a * a, 3 * a * a * t, 3 * a * t * t, t * t * t]; return [0, 1].map(j => k[0] * A[j] + k[1] * C[j] + k[2] * D[j] + k[3] * B[j]); };

// KIT-CANDIDATE stream: a thin wavy translucent stream of water falling from (x, y0) to y1 — a pointed tip at the
// ledge (no flat top), narrow there, swelling and bending as it falls, breaking into spray at the bottom.
// w0 — width near the top, w1 — at the bottom; drift — sideways at the bottom; wav — the wobble
function stream(u, x, y0, y1, w0, w1, seed, o = {}) {
  const R = rng(seed), h = y1 - y0, drift = o.drift || 0, op = o.op || 1, wav = o.wav == null ? .7 : o.wav, ph = R() * 6, nw = 1.5 + R();
  if (h < 3) return '';
  const id = nid('st', u), n = 18, C = t => [x + drift * t * t + Math.sin(t * Math.PI * nw + ph) * wav * t, y0 + h * t];
  const W = t => (t < .08 ? lerp(.15, w0, t / .08) : lerp(w0, w1, Math.pow((t - .08) / .92, 1.4))) / 2;
  let s = `<defs>${linGrad(id, 0, y0, 0, y1, [[0, '#f4fffa', .42 * op], [.45, '#dcfff2', .3 * op], [.85, '#c8f0e4', .18 * op], [1, '#c8f0e4', .05 * op]])}</defs>`;
  const Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) { const t = i / n * .9, c = C(t), k = W(t) * (1 + Math.sin(i * 2.1 + seed) * .12);
    Lp.push([c[0] - k, c[1]]); Rp.unshift([c[0] + k, c[1]]); }
  s += `<path d="M${f(x)} ${f(y0)}L${Lp.concat(Rp).map(P2).join('L')}Z" fill="url(#${id})"/>`;
  // the lit core and a side strand: fine curving lines down the stream, fading
  for (const [off, sw, oo] of [[-.15, .26, .5], [.3, .16, .35]]) { const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n * (.6 + R() * .25), c = C(t); pts.push([c[0] + off * W(t) * 2, c[1]]); }
    for (let i = 0; i < n; i++) s += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#ffffff" stroke-width="${f(sw)}" opacity="${f(oo * op * (1 - i / n))}" stroke-linecap="round"/>`; }
  // the bottom tears into drops and a puff of spray at the foam
  const e = C(.9);
  for (let i = 0; i < 9; i++) { const r = .2 + R() * .4, dx = (R() - .5) * (w1 + 3), dy = R() * h * .14;
    s += `<ellipse cx="${f(e[0] + dx)}" cy="${f(e[1] + dy)}" rx="${f(r)}" ry="${f(r * 1.4)}" fill="#effff8" opacity="${f((.3 + R() * .4) * op)}"/>`; }
  { const sp = nid('sp', u); s += `<defs>${radGrad(sp, e[0], y1 - 1.5, w1 * .9 + 2, [[0, '#f0fff8', .45 * op], [1, '#d8fff0', 0]])}</defs><ellipse cx="${f(e[0])}" cy="${f(y1 - 1.5)}" rx="${f(w1 * .9 + 2)}" ry="${f(w1 * .5 + 1.2)}" fill="url(#${sp})"/>`; }
  return s;
}

module.exports = { name: 'Уйти на глубину', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 }), R = rng(23);
    // ——— the green fog at night: the moon a pale disc through it, torn cloud, the sea dark under it ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 14, seed: 7 }) + K.sunMoon(u, L, { r: 6.5 });
    for (const [x, y, w, h, sd, fr] of [[150, 56, 90, 9, 4, .3], [40, 62, 70, 8, 9, .45], [116, 74, 80, 6, 2, .6], [12, 82, 50, 5, 14, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 13, glitter: 86 });
    // ——— the enemy far off on the left: her gun has just fired at the Dutchman, the smoke rolling off her side ———
    bg += K.ship(u, L, { ...EN, sails: 'full', detail: 'far', lights: true, seed: 5 });
    bg += K.smoke(u, L, { x: 40, y: 89, w: 22, h: 12, wind: .8, seed: 6, opacity: .7 }) + K.smoke(u, L, { x: 30, y: 89.4, w: 14, h: 8, wind: .6, seed: 2, opacity: .5 });
    bg += K.muzzleFlash(u, { x: SHOT.a[0], y: SHOT.a[1], dir: -14, len: 12, seed: 1 }) + K.localGlow(u, { x: 38, y: 88, color: '#ffc070', power: .35, radius: 10 }, { core: false });
    bg += K.fog(u, L, { y: HZ - 14, h: 22, density: .5, seed: 3 });
    // the second ball has already fallen beyond her, behind her foremast: a column of water on the far sea
    bg += K.splash(u, { x: SHOT.b[0], y: SHOT.b[1], w: 9, h: 24, seed: 0, L, wind: .2 }) + K.foam(u, { x: SHOT.b[0], y: SHOT.b[1] + .5, w: 14, h: 1.1, seed: 3, L });

    // ——— the sea round her: a broad dark hollow where she draws the water down ———
    let mid = '';
    { const hw = nid('hw', u); mid += `<defs>${radGrad(hw, FUN.x, FUN.y + 2, 70, [[0, '#04120e', .85], [.55, '#082420', .55], [1, '#0a2a24', 0]])}</defs>`
      + `<ellipse cx="${FUN.x}" cy="${FUN.y + 2}" rx="${FUN.rx + 8}" ry="${FUN.ry + 6}" fill="url(#${hw})"/>`; }
    // ——— the drowned part of her under the surface: the same ship, dim green, blurred by the water, sinking ———
    { const cu = nid('cu', u), bl = nid('bu', u), tg = nid('tg', u);
      mid += `<defs><clipPath id="${cu}"><rect x="-10" y="${SEA}" width="220" height="80"/></clipPath><filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3"/></filter>`
        + `${linGrad(tg, 0, SEA, 0, SEA + 46, [[0, '#0c2a24', .1], [.5, '#06181a', .35], [1, '#041010', .75]])}</defs>`
        + `<g clip-path="url(#${cu})"><g filter="url(#${bl})" opacity=".75">${K.shipSilhouette('dutch', { ...DU, color: '#5cc8a4', u })}</g>`
        + `<rect x="-10" y="${SEA}" width="220" height="60" fill="url(#${tg})"/></g>`;
      // the ghost-green glow of her drowned lanterns and ports, deep under the hull
      mid += K.localGlow(u, { x: 140, y: 128, color: '#7affc8', power: .35, radius: 26 }, { squash: .4, core: false }); }
    // ——— the Dutchman: above the sea only her stern and her slanting masts ———
    { const cut = nid('ct', u);
      mid += `<defs><clipPath id="${cut}"><rect x="-10" y="-10" width="220" height="${SEA + 10}"/></clipPath></defs>`
        + `<g clip-path="url(#${cut})">${K.ship(u, L, { ...DU, sails: 'full', detail: 'near', lights: true, seed: 4 })}</g>`; }
    // she is soaked: water pours off her raised stern — off the rail, out of the gallery, off the rudder
    let falls = '';
    // 5 streams, each its own width, length and bend: off the rail, out of the gallery port, off the rudder
    for (const [X, Hh, w0, w1, sd, dr, wv] of [[44, 21, 1.1, 4.8, 11, -3.6, 1.8], [35, 18.3, .7, 3.2, 12, -1.8, 1.4], [26, 16.6, .5, 2.4, 14, -.9, 1.1], [41, 9, .9, 3.8, 16, -2.6, 1.6], [46.5, 2, 1.2, 5.4, 17, -3.4, 1.5]]) {
      const p = pt(DU, X, Hh); if (p[1] < SEA - 4) falls += stream(u, p[0], p[1], SEA, w0, w1, sd, { drift: dr, op: .85, wav: wv }); }
    // ——— the foam: no closed ring — torn arcs of the rim, each bending inward, and arms twisting in to the centre ———
    let sea = '';
    { const spir = (t0, span, k0, k1, sw0, sw1, op, gap, ph) => { let o = ''; const N = 30, pts = [];
        for (let i = 0; i <= N; i++) { const q = i / N, t = t0 + q * span, k = lerp(k0, k1, Math.pow(q, .7)); pts.push([FUN.x + Math.cos(t) * FUN.rx * k, FUN.y + Math.sin(t) * FUN.ry * k]); }
        for (let i = 0; i < N; i++) { const q = i / N; if (gap && Math.sin(q * gap + ph) < -.55) continue;
          o += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#effff8" stroke-width="${f(lerp(sw0, sw1, q))}" opacity="${f(op * (1 - q * .55) * (.7 + R() * .3))}" stroke-linecap="round"/>`; }
        return { o, pts }; };
      // the torn rim: 6 arcs with ragged gaps between them, each drifting inward along its length (the start of the twist)
      for (let a = 0; a < 6; a++) { const t0 = a / 6 * Math.PI * 2 + R() * .35, r = spir(t0, .8 + R() * .3, 1.05 + R() * .05, .7, 1.7, .5, .62, 0, 0); sea += r.o;
        sea += K.foam(u, { x: r.pts[4][0], y: r.pts[4][1], w: 12 + R() * 8, h: 1.3, seed: 40 + a, L }); }
      // the arms: 5 streaks winding in towards her, thinning and breaking as they go
      for (let a = 0; a < 5; a++) { const t0 = a / 5 * Math.PI * 2 + .5 + R() * .3; sea += spir(t0, Math.PI * (1.3 + R() * .25), .92, .1, 1.5, .2, .72, 11, a).o; }
      // a few loose flecks between the arms
      for (let i = 0; i < 22; i++) { const t = R() * Math.PI * 2, k = .3 + R() * .7; sea += `<ellipse cx="${f(FUN.x + Math.cos(t) * FUN.rx * k)}" cy="${f(FUN.y + Math.sin(t) * FUN.ry * k)}" rx="${f(.6 + R() * 1.4)}" ry=".25" fill="#effff8" opacity="${f(.25 + R() * .3)}" transform="rotate(${f(Math.cos(t) * 12)} ${f(FUN.x + Math.cos(t) * FUN.rx * k)} ${f(FUN.y + Math.sin(t) * FUN.ry * k)})"/>`; } }
    // where she cuts the surface: churned white water along the line, heaped against her stern
    sea += K.foam(u, { x: 96, y: SEA + .3, w: 76, h: 2.6, seed: 7, L });
    // heaps of churned water against her (low humps of foam, no columns)
    for (const [x, w, sd] of [[60, 18, 4], [86, 14, 1], [116, 16, 2], [140, 12, 5]]) { const hg = nid('hp', u);
      sea += `<defs>${radGrad(hg, x, SEA + 1, w / 2, [[0, '#f0fff8', .75], [.6, '#d8f8ec', .4], [1, '#c8f0e4', 0]])}</defs><ellipse cx="${x}" cy="${SEA}" rx="${f(w / 2)}" ry="${f(w * .14)}" fill="url(#${hg})"/>` + K.foam(u, { x, y: SEA - .6, w: w * .8, h: 1.8, seed: sd + 20, L }); }
    // bubbles boiling up where the bow went down, weed torn off her
    for (let i = 0; i < 46; i++) { const a = R() * Math.PI * 2, r = 8 + R() * 40, x = 140 + Math.cos(a) * r, y = SEA + 3 + Math.sin(a) * r * .14, rr = .4 + R() * 1.3;
      sea += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr)}" ry="${f(rr * .55)}" fill="#c8fff0" fill-opacity=".12" stroke="#effff8" stroke-width=".3" opacity="${f(.45 + R() * .4)}"/>`; }
    for (const [x, y, l] of [[132, 121, 7], [156, 119, 6], [86, 124, 5]]) sea += `<path d="M${x} ${y}q3 -1.6 ${l} .4q-3 1.2 -${l} -.4z" fill="#3e7a5a" opacity=".8"/>`;
    // ——— the shot: the second ball has already struck the sea beyond her (a column); the first is in the air,
    // its trail arcing from the enemy's port high over her masts ———
    let shot = '';
    { const T = .88, B = t => bez3(SHOT.a, SHOT.c1, SHOT.c2, SHOT.b, t), pts = []; for (let i = 0; i <= 34; i++) pts.push(B(i / 34 * T));
      // the trail: a thin streak of disturbed air, fading back towards the gun
      for (let i = 0; i < 34; i++) { const q = i / 34; shot += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#effff8" stroke-width="${f(.3 + q * 1.4)}" opacity="${f(.08 + q * .5)}" stroke-linecap="round"/>`; }
      const b = pts[34], pv = pts[31], ang = Math.atan2(b[1] - pv[1], b[0] - pv[0]);
      // a pale air halo so the iron reads against the rigging and the fog
      shot += K.localGlow(u, { x: b[0], y: b[1], color: '#e8fff4', power: .4, radius: 6 }, { core: false });
      // speed lines behind the ball and the ball itself, iron, the moon on its top
      for (const o of [-1.2, 0, 1.2]) shot += `<path d="M${f(b[0] - Math.cos(ang) * 10 - Math.sin(ang) * o)} ${f(b[1] - Math.sin(ang) * 10 + Math.cos(ang) * o)}L${f(b[0] - Math.cos(ang) * 2.6 - Math.sin(ang) * o)} ${f(b[1] - Math.sin(ang) * 2.6 + Math.cos(ang) * o)}" stroke="#ffffff" stroke-width=".35" opacity=".6"/>`;
      shot += K.shadeSphere(u, b[0], b[1], 2.4, L, 'iron', { outline: .35 }) + `<path d="M${f(b[0] - 1.6)} ${f(b[1] - 1.2)}a2 2 0 0 1 2.6 -.9" stroke="#e8fff4" stroke-width=".45" fill="none" opacity=".8"/>`;
      // the ball's own dotted line on down to where it will fall: beyond the foam, into the empty water
      for (let i = 1; i <= 5; i++) { const p = B(T + i * .022); shot += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".45" fill="#effff8" opacity="${f(.4 - i * .05)}"/>`; } }
    // ——— light: the moon's veil, her green lantern's glow on the fog, motes; the under-glass dark ———
    let lt = K.localGlow(u, { x: 86, y: 24, color: '#e8fff4', power: .25, radius: 60 }, { core: false }) + motes(18, 30, 40, 150, 70, '#effff4', 5);
    lt += K.fog(u, L, { y: SEA + 14, h: 24, density: .2, seed: 8 });
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 138, 0, 290, [[0, '#04140f', 0], [.35, '#04140f', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="138" width="220" height="152" fill="url(#${gl})"/>`; }
    return [bg, mid + falls + sea + shot + lt];
  } };
