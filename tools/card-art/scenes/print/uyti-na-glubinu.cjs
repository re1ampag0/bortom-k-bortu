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
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const HZ = 90, SEA = 112;                          // the horizon; the sea where she goes down (the kit cuts lower: she is deeper)
const DU = { kind: 'dutch', x: 100, y: 130, scale: 1.2, flip: true, heel: 38, slope: true };   // bow right, down; slope: the kit keeps her whole hull (cut along her own waterline), the scene cuts at the sea
const EN = { kind: 'endeavour', x: 25, y: HZ + 2.4, scale: .27, flip: true };
const FUN = { x: 108, y: SEA + 1, rx: 68, ry: 9 };   // the ring of foam round her
const SHOT = { a: [37, 88.6], c: [112, -40], b: [168, 97] };   // the ball's path: the enemy's port → over her → the sea beyond
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
const bez = (A, C, B, t) => { const a = 1 - t; return [a * a * A[0] + 2 * a * t * C[0] + t * t * B[0], a * a * A[1] + 2 * a * t * C[1] + t * t * B[1]]; };

// KIT-CANDIDATE pour: water pouring off a ledge at (x, y0) down to y1: a thin translucent veil (never a solid rod)
// that narrows fast and curves away (drift), tears into two or three threads, the threads break into beads and drops;
// a puff of spray where it meets the sea. w — the ribbon's width at the ledge; drift — sideways at the bottom
function pour(u, L, x, y0, y1, w, seed, o = {}) {
  const R = rng(seed), h = y1 - y0, drift = o.drift || 0, op = o.op || 1;
  if (h < 3) return '';
  const id = nid('po', u), X = t => x + drift * t * t;      // the fall curves away as it drops
  let s = `<defs>${linGrad(id, 0, y0, 0, y0 + h * .6, [[0, '#effff8', .34 * op], [.5, '#d8fff0', .2 * op], [1, '#c8f0e4', 0]])}</defs>`;
  // the sheet: a thin veil from the ledge, narrowing fast, gone by about half the fall
  const tear = .3 + R() * .15, n = 8, Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) { const t = i / n * (tear + .12), y = y0 + h * t, k = w * (1 - t / (tear + .14)) / 2 + .1;
    Lp.push([X(t) - k + Math.sin(i * 1.9 + seed) * w * .06, y]); Rp.unshift([X(t) + k + Math.sin(i * 1.3 + seed) * w * .06, y]); }
  s += `<path d="M${Lp.concat(Rp).map(P2).join('L')}Z" fill="url(#${id})"/>`;
  // the lit edge of the veil at the ledge and a couple of fine streaks in it
  s += `<path d="M${f(x - w / 2)} ${f(y0)}Q${f(x)} ${f(y0 + .6)} ${f(x + w / 2)} ${f(y0)}" stroke="#ffffff" stroke-width=".35" fill="none" opacity="${f(.55 * op)}"/>`;
  for (let i = 0; i < 2; i++) { const xx = (R() - .5) * w * .6, b = tear * (.6 + R() * .4);
    s += `<path d="M${f(x + xx)} ${f(y0 + .5)}Q${f(X(b / 2) + xx * .8)} ${f(y0 + h * b / 2)} ${f(X(b) + xx * .5)} ${f(y0 + h * b)}" stroke="#ffffff" stroke-width=".22" fill="none" opacity="${f(.45 * op)}" stroke-linecap="round"/>`; }
  // the threads it tears into: each its own wobble, thinning, broken into beads, then drops
  const nt = 2 + Math.floor(R() * 2);
  for (let j = 0; j < nt; j++) { const sp = (j / (nt - 1 || 1) - .5) * w * .7, t1 = Math.min(.95, tear + .3 + R() * .35), pts = [];
    for (let i = 0; i <= 8; i++) { const t = lerp(tear, t1, i / 8); pts.push([X(t) + sp * (1 + (t - tear) * 1.5) + Math.sin(i * 1.7 + j * 2) * .3, y0 + h * t]); }
    for (let i = 0; i < 8; i++) { if (i > 3 && R() < .35) continue; s += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#e8fff6" stroke-width="${f(Math.max(.14, w * .16 * (1 - i / 9)))}" opacity="${f((.42 - i * .035) * op)}" stroke-linecap="round"/>`; }
    const e = pts[8]; for (let k = 0; k < 4; k++) { const r = .18 + R() * .3; s += `<ellipse cx="${f(e[0] + (R() - .5) * 1.6)}" cy="${f(e[1] + 1 + k * 2.2 + R())}" rx="${f(r)}" ry="${f(r * 1.8)}" fill="#effff8" opacity="${f(.35 + R() * .35)}"/>`; } }
  // spray where it lands: a low puff and drops thrown up
  if (!o.noSplash) { s += K.foam(u, { x: X(1), y: y1 + .2, w: w * 1.6 + 3, h: 1.2, seed: seed % 9, L });
    for (let i = 0; i < 7; i++) { const r = .18 + R() * .35; s += `<circle cx="${f(X(1) + (R() - .5) * (w + 7))}" cy="${f(y1 - R() * 6)}" r="${f(r)}" fill="#f0fff8" opacity="${f(.3 + R() * .4)}"/>`; } }
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
    for (const [X, Hh, w, sd, dr] of [[44, 21, 4.5, 11, -1.5], [38, 19, 3.4, 12, -1], [31, 17.5, 3, 13, -.8], [24, 16.5, 2.6, 14, -.6], [17, 16, 2.2, 15, -.4], [41, 9, 2.6, 16, -1.8], [46.5, 2, 3.6, 17, -2.2]]) {
      const p = pt(DU, X, Hh); if (p[1] < SEA - 4) falls += pour(u, L, p[0], p[1], SEA, w, sd, { drift: dr, op: 1.1 }); }
    // ——— the ring of foam and the spiral of streaks running in to her ———
    let sea = '';
    { const ring = (rx, ry, sw, op, dash) => `<ellipse cx="${FUN.x}" cy="${FUN.y}" rx="${rx}" ry="${ry}" fill="none" stroke="#effff8" stroke-width="${sw}" opacity="${op}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
      // the spiral streaks: arcs of foam winding in towards her, thinning inward
      for (let a = 0; a < 7; a++) { const t0 = a / 7 * Math.PI * 2 + R() * .4, pts = [];
        for (let i = 0; i <= 26; i++) { const q = i / 26, t = t0 + q * Math.PI * 1.25, k = lerp(1.02, .35, Math.pow(q, .8)); pts.push([FUN.x + Math.cos(t) * FUN.rx * k, FUN.y + Math.sin(t) * FUN.ry * k]); }
        for (let i = 0; i < 26; i++) { const q = i / 26; if (Math.sin(q * 9 + a) < -.6) continue;
          sea += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#e8fff6" stroke-width="${f(1.3 * (1 - q * .7))}" opacity="${f((.65 - q * .4) * (.6 + R() * .4))}" stroke-linecap="round"/>`; } }
      sea += ring(FUN.rx, FUN.ry, 1.6, .55) + ring(FUN.rx - 3, FUN.ry - .8, .6, .5, '6 3 10 4') + ring(FUN.rx + 6, FUN.ry + 1.6, .5, .3, '3 6 8 5');
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = FUN.x + Math.cos(a) * FUN.rx, y = FUN.y + Math.sin(a) * FUN.ry; sea += K.foam(u, { x, y, w: 14 + R() * 12, h: 1.4, seed: 40 + i, L }); } }
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
    { const T = .58, pts = []; for (let i = 0; i <= 30; i++) pts.push(bez(SHOT.a, SHOT.c, SHOT.b, i / 30 * T));
      // the trail: a thin streak of disturbed air, fading back towards the gun
      for (let i = 0; i < 30; i++) { const q = i / 30; shot += `<path d="M${P2(pts[i])}L${P2(pts[i + 1])}" stroke="#effff8" stroke-width="${f(.3 + q * 1.4)}" opacity="${f(.08 + q * .5)}" stroke-linecap="round"/>`; }
      const b = pts[30], pv = pts[27], ang = Math.atan2(b[1] - pv[1], b[0] - pv[0]);
      // speed lines behind the ball and the ball itself, iron, the moon on its top
      for (const o of [-1.2, 0, 1.2]) shot += `<path d="M${f(b[0] - Math.cos(ang) * 10 - Math.sin(ang) * o)} ${f(b[1] - Math.sin(ang) * 10 + Math.cos(ang) * o)}L${f(b[0] - Math.cos(ang) * 2.6 - Math.sin(ang) * o)} ${f(b[1] - Math.sin(ang) * 2.6 + Math.cos(ang) * o)}" stroke="#ffffff" stroke-width=".35" opacity=".6"/>`;
      shot += K.shadeSphere(u, b[0], b[1], 2.4, L, 'iron', { outline: .35 }) + `<path d="M${f(b[0] - 1.6)} ${f(b[1] - 1.2)}a2 2 0 0 1 2.6 -.9" stroke="#e8fff4" stroke-width=".45" fill="none" opacity=".8"/>`;
      // the ball's own dotted line on to where it will fall: over the empty water, beyond her
      for (let i = 1; i <= 7; i++) { const p = bez(SHOT.a, SHOT.c, SHOT.b, T + i * .05); shot += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".45" fill="#effff8" opacity="${f(.35 - i * .03)}"/>`; } }
    // ——— light: the moon's veil, her green lantern's glow on the fog, motes; the under-glass dark ———
    let lt = K.localGlow(u, { x: 86, y: 24, color: '#e8fff4', power: .25, radius: 60 }, { core: false }) + motes(18, 30, 40, 150, 70, '#effff4', 5);
    lt += K.fog(u, L, { y: SEA + 14, h: 24, density: .2, seed: 8 });
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 138, 0, 290, [[0, '#04140f', 0], [.35, '#04140f', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="138" width="220" height="152" fill="url(#${gl})"/>`; }
    return [bg, mid + falls + sea + shot + lt];
  } };
