// «Тяжёлый борт» (Месть королевы Анны, РЕАКЦИЯ: Залп по «Мести» наносит на 1 урон меньше, стрелявший получает 1 урон
// по Корпусу), refined from the first-round scene (portrait-revenge.cjs SCENES['Тяжёлый борт']): the same idea — the
// Revenge's thick side close up, the enemy's balls do not go through: one glances off an iron chainplate in sparks and
// flies away, two sit stuck in the planking in rings of crushed wood, old dents beside them; her ports already pour
// out the smoke of the answer. The enemy is out of the frame on the right, in front of her: his next ball comes in
// on its smoke trail.
// Fixed against the first round: the side was a flat brown wedge with an iron band and four red boxes — now the kit's
// Revenge broadside on, close: her wales, red bands, the open ports with the guns run out; the ball and its spark fan
// hung in the air in front of the side — now the hits are in the side (a crater with crushed fibres, the ball in it, the
// cracks running along the grain) and the ricochet leaves its dent; the lone red-sky wash — now a dusk with the sun
// low behind us on the left raking along the side, so every dent catches light on one wall and shadow on the other.
// She is laid over away from us (her own broadside and the blow), her near side lifted out of the water showing the
// foul bottom, and she rides the slope of a swell — the waterline and the near water tilted with her (as in «Буря»).
// Light: the low sun behind us on the left (key, warm, raking); the flashes at two ports and the sparks (local).
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng, clamp } = K;

const HZ = 80;
const SH = { kind: 'revenge', x: 125, y: 124, scale: 4.2, heel: -3, roll: -6, sails: 'reefed', detail: 'near', lights: true, seed: 7 };
const light = { time: 'dusk', haze: .35, key: { type: 'sun', az: 236, el: 13, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 },
  locals: [{ x: 66, y: 83, color: '#ffb050', power: .7, radius: 40 }, { x: 176, y: 88, color: '#ffb050', power: .6, radius: 36 }, { x: 85, y: 72, color: '#ffd890', power: .5, radius: 24 }] };
const skel = { horizon: HZ, eye: 2, light: 'the low sun behind us on the left, raking along the side; two flashes at her ports; the sparks of the ricochet', items: [
  ['revenge side', 0, 124, 200, 64, 'water: her waterline y 124 tilted 3° (bow up, left), laid over away from us; rail y 60-71'],
  ['stuck ball L', 40, 106, 12, 12, 'in her side between ports 1 and 2, under them'],
  ['ricochet', 78, 76, 36, 32, 'the rail band between ports 2 and 3; the ball flies off up and right'],
  ['stuck ball R', 150, 110, 12, 12, 'in her side between ports 4 and 5'],
  ['incoming ball', 168, 66, 48, 34, 'in the air: from the right edge into her side'],
  ['port smoke', 10, 96, 180, 26, 'out of her ports, drifting left (the wind to her bow)']] };

// ——— helpers (as in «Буря» print/burya.cjs) ———
const lin = (id, x1, y1, x2, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${st.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}"${a != null ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</linearGradient>`;
const blur = (id, sd) => `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
function sp(pts, closed) {
  const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : '');
}
// KIT-CANDIDATE heel on a slope (as in «Буря»): the kit cuts the hull at a level line y = waterline; heeled, the cut
// must tilt with the hull. Also the level foam line under her is dropped (the scene lays its own along the slope).
function tiltShip(u, L, o) {
  const s = o.scale, dir = o.flip ? -1 : 1, a = (o.heel || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const pt = (X, H) => [o.x + dir * s * (X * ca - H * sa), o.y - s * (X * sa + H * ca)];
  const wl = [pt(-400, -.2), pt(400, -.2), pt(400, 900), pt(-400, 900)].map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  return K.ship(u, L, o).replace(/<path d="M[-\d.]+ ([-\d.]+)L[-\d.]+ \1" stroke="#[0-9a-f]{6}" stroke-width="[\d.]+" opacity=".45"\/>/, '')
    .replace(/(<clipPath id="khw[^"]+">)<rect x="[-\d.]+" y="[-\d.]+" width="8000" height="4000"\/>/, `$1<path d="M${wl}Z"/>`);
}
// a point on the near side of the kit ship (local X along, H up from the waterline; Z = the hull's half-breadth there),
// with her roll and heel -> picture point
function sidePt(o, G) {
  const s = o.scale, dir = o.flip ? -1 : 1, a = (o.heel || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), ph = (G.phi || 0) * Math.PI / 180;
  return (X, H, dz = 0) => { const Z = G.hullZ(X, Math.max(0, H)) + dz, Hp = H * Math.cos(ph) - Z * Math.sin(ph); return [o.x + dir * s * (X * ca - Hp * sa), o.y - s * (X * sa + Hp * ca)]; };
}
// the gun ports of the main row (SHIP_SPECS.revenge.ports[0], the height following the sheer, as ship.cjs lays them)
function portXH(kind, ri = 0) {
  const sp = K.SHIP_SPECS[kind], hb = sp.len / 2, row = sp.ports[ri], pitch = (row.x1 - row.x0) / (row.n - 1);
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  return Array.from({ length: row.n }, (_, i) => { const X = row.x0 + i * pitch; return [X, row.h + sheer(X) * clamp(row.h / sp.free, 0, 1.25)]; });
}

// KIT-CANDIDATE a ball stuck in a thick wooden side, sunk in it to half its depth: the shallow bruise of the dent round
// it (its shade on the side away from the light), the dark crater ring, the iron ball, then over the ball's edge the
// lip of crushed wood pushed up round it (thicker along the grain `ang`, pale fresh wood on the side to the light) and
// the split slivers peeling off along the grain — pale wood with their own shadow, no dark cracks
function stuckBall(u, L, o) {
  const { x, y, r, ang = 0 } = o, R = rng(o.seed || 1), rp = L.ramp('oak', x, y), lx = L.ux, ly = L.uy, bx = x + (o.dx || 0), by = y + (o.dy || 0);
  const gb = nid('cr', u), gl = nid('cl', u), fresh = mix(rp.lit, '#f2dcae', .6), mid = mix(rp.half, '#c4955e', .5), dark = mix(rp.shadow, '#3a200e', .4);
  // the bruise: the planking pressed in round the hole, its wall towards the light in shade
  let out = `<defs>${radGrad(gb, x + lx * r * .5, y + ly * r * .5, r * 2.4, [[0, '#120804', .85], [.5, '#2a1408', .55], [1, '#2a1408', 0]])}`
    + `${linGrad(gl, x + lx * r * 1.4, y + ly * r * 1.4, x - lx * r * 1.4, y - ly * r * 1.4, [[0, fresh], [.45, mid], [1, dark]])}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 2.3)}" ry="${f(r * 1.9)}" fill="url(#${gb})" transform="rotate(${f(ang)} ${f(x)} ${f(y)})"/>`;
  // the crater: a ragged dark ring just round the ball
  const N = 18, ring = (k0, k1, jit) => Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2, rr = r * (k0 + k1 * Math.pow(Math.abs(Math.cos(a)), 2) + (R() - .5) * jit); return [x + Math.cos(a + ang * Math.PI / 180) * rr, y + Math.sin(a + ang * Math.PI / 180) * rr * .92]; });
  out += `<path d="${sp(ring(1.18, .12, .14), true)}" fill="#120804"/>`;
  // the ball, its own shadow cast into the crater on the side away from the light
  out += `<circle cx="${f(bx - lx * r * .22)}" cy="${f(by - ly * r * .22)}" r="${f(r * 1.04)}" fill="#050302" opacity=".8"/>` + K.shadeSphere(u, bx, by, r, L, 'iron');
  // the lip over the ball's edge: an outer contour wider along the grain, an inner one in teeth that bite into the ball
  { const ao = ang * Math.PI / 180, outer = [], inner = [];
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, c = Math.abs(Math.cos(a)), ro = r * (1.12 + .38 * c * c + (R() - .3) * .16), ri = r * (i % 2 ? .8 + R() * .08 : .9 + R() * .06);
      outer.push([x + Math.cos(a + ao) * ro, y + Math.sin(a + ao) * ro * .92]); inner.push([x + Math.cos(a + ao) * ri, y + Math.sin(a + ao) * ri]); }
    const id = 'M' + inner.slice().reverse().map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';
    out += `<path d="${sp(outer, true)}${id}" fill="url(#${gl})" fill-rule="evenodd"/>`
      + `<path d="${id}" fill="none" stroke="#0a0503" stroke-width="${f(r * .1)}" opacity=".55"/>`; }
  // the slivers split off along the grain both ways, each its own length and curl; a short few elsewhere round the rim
  for (let i = 0; i < 7; i++) { const along = i < 4, a = (along ? (i % 2 ? 0 : Math.PI) + (R() - .5) * .55 : R() * Math.PI * 2) + ang * Math.PI / 180;
    const r0 = r * (1.05 + R() * .2), l = r * (along ? .5 + R() * .9 : .3 + R() * .35), w = r * (.11 + R() * .1), cu = (R() - .5) * l * .35;
    const ax = x + Math.cos(a) * r0, ay = y + Math.sin(a) * r0 * .92, ex = ax + Math.cos(a) * l, ey = ay + Math.sin(a) * l * .92, nx = -Math.sin(a), ny = Math.cos(a);
    const d = `M${f(ax + nx * w)} ${f(ay + ny * w)}Q${f((ax + ex) / 2 + nx * (w * .6 + cu))} ${f((ay + ey) / 2 + ny * (w * .6 + cu))} ${f(ex)} ${f(ey)}Q${f((ax + ex) / 2 - nx * w * .3 + nx * cu)} ${f((ay + ey) / 2 - ny * w * .3 + ny * cu)} ${f(ax - nx * w)} ${f(ay - ny * w)}Z`;
    const lit = Math.cos(a) * lx + Math.sin(a) * ly > .1;
    out += `<path d="${d}" transform="translate(${f(-lx * w * 1.1)} ${f(-ly * w * 1.1)})" fill="#1a0c06" opacity=".45"/><path d="${d}" fill="${lit ? fresh : mid}"/>`; }
  return out;
}
// KIT-CANDIDATE a clump of powder smoke rolling out of a port: billows growing along `dir` (a picture vector), rising
// a little; lit on top, a soft shade under the far billows. tone 'grey' — a duller smoke (far, or the enemy's)
function portSmoke(u, L, o) {
  const { x, y, k = 1, n = 5, seed = 1, dir = [-1, 0], rise = .12, op = .9 } = o, R = rng(90 + seed);
  const c = o.tone === 'grey' ? ['#e2dad4', '#b0a8aa', '#7a7078', '#4e4654'] : ['#fff6ea', '#eadfd4', '#b4a4a8', '#6e5e6a'];
  const pg = nid('ps', u), pd = nid('pq', u), pf = nid('pb', u);
  let sh = '', bl = '';
  for (let j = 0; j < n; j++) { const d = (j ? .8 + j * 2.4 : 0) * k * (.9 + R() * .25), rr = (1.5 + j * .95) * k * (.85 + R() * .3);
    const cx = x + dir[0] * d + (R() - .5) * k, cy = y + dir[1] * d - rise * j * j * .45 * k + (R() - .5) * .8 * k;
    if (j > 1) sh += `<circle cx="${f(cx + .5 * k)}" cy="${f(cy + rr * .5)}" r="${f(rr)}" fill="url(#${pd})"/>`;
    bl += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="url(#${pg})" opacity="${f(.95 - j * .08)}"/>`;
    if (j > 1 && R() > .3) { const s = R() > .5 ? 1 : -1, r2 = rr * (.45 + R() * .3); bl += `<circle cx="${f(cx - dir[1] * s * rr * .7)}" cy="${f(cy + dir[0] * s * rr * .6 - rr * .2)}" r="${f(r2)}" fill="url(#${pg})" opacity=".8"/>`; } }
  return `<defs><radialGradient id="${pg}" cx=".4" cy=".32" r=".68"><stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}" stop-opacity=".95"/><stop offset=".8" stop-color="${c[2]}" stop-opacity=".85"/><stop offset="1" stop-color="${c[3]}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a2030" stop-opacity=".45"/><stop offset="1" stop-color="#3a2030" stop-opacity="0"/></radialGradient>${blur(pf, (.35 * k).toFixed(2))}</defs>`
    + `<g opacity="${f(op)}">${sh}<g filter="url(#${pf})">${bl}</g></g>`;
}
// KIT-CANDIDATE a gun firing out of its port, by `phase` 0..1: 0 — the shot now: the port lit hot inside, a long
// flame out of the muzzle along `dir` (degrees), a small new puff; .3-.6 — a shorter flame half in its own smoke;
// over .6 — the flame gone, only a glow inside the clump of smoke. (x, y) — the muzzle; port — its four corners.
function portFlash(u, L, o) {
  const { x, y, k = 1, seed = 1, dir = 180 } = o, ph = clamp(o.phase || 0, 0, 1), a = dir * Math.PI / 180, sd = o.smokeDir || [Math.cos(a), Math.sin(a)];
  let out = '';
  if (o.port && ph < .75) { const g = nid('ph', u); out += `<defs>${radGrad(g, x, y, 1.6 * k, [[0, '#fff4c0'], [.4, '#ffa830'], [1, '#8a2808']])}</defs><path d="M${o.port.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z" fill="url(#${g})" opacity="${f(1 - ph * 1.1)}"/>`; }
  out += K.localGlow(u, { x, y, color: '#ffb050', power: .85 - ph * .55, radius: (11 - ph * 6) * k }, { core: false });
  const smk = portSmoke(u, L, { x: x + sd[0] * k * .6, y: y + sd[1] * k * .6, k: k * (.4 + ph * .42), n: 2 + Math.round(ph * 3), seed, dir: sd, op: .5 + ph * .45, tone: o.tone });
  const fl = len => K.muzzleFlash(u, { x, y, dir, len, seed, smoke: false, glow: false });
  const heart = s => { const g = nid('pc', u); return `<defs>${radGrad(g, x, y, s, [[0, '#ffffff'], [.35, '#fff0a0'], [.7, '#ffb040', .8], [1, '#ff8020', 0]])}</defs><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * .85)}" fill="url(#${g})"/>`; };
  if (ph < .3) out += smk + fl((o.len || 6) * k) + heart(1.5 * k);
  else if (ph < .65) out += fl((o.len || 6) * k * (1 - ph) * .9) + heart(1 * k) + smk;
  else { const g = nid('pe', u); out += smk + `<defs>${radGrad(g, x + sd[0] * k * 2, y + sd[1] * k * 2, 3 * k, [[0, '#ffb050', .55 * (1.2 - ph)], [1, '#ff8a30', 0]])}</defs><circle cx="${f(x + sd[0] * k * 2)}" cy="${f(y + sd[1] * k * 2)}" r="${f(3 * k)}" fill="url(#${g})" style="mix-blend-mode:screen"/>`; }
  return out;
}
// an old shallow dent where a ball glanced off: a bruise in the planking, lit on the far wall, a few split fibres
function dent(u, L, o) {
  const { x, y, r, ang = 0 } = o, R = rng(o.seed || 2), rp = L.ramp('oak', x, y), g = nid('dn', u);
  let out = `<g transform="rotate(${f(ang)} ${f(x)} ${f(y)})"><defs>${radGrad(g, x - L.ux * r * .4, y - L.uy * r * .4, r * 1.6, [[0, '#120804', .9], [.6, '#2a1408', .55], [1, '#2a1408', 0]])}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.6)}" ry="${f(r * 1.2)}" fill="url(#${g})"/>`
    + `<path d="M${f(x - r * .4)} ${f(y + r * 1.05)}A${f(r * 1.4)} ${f(r * 1.05)} 0 0 0 ${f(x + r * 1.4)} ${f(y - r * .2)}" stroke="${rp.lit}" stroke-width="${f(r * .2)}" fill="none" opacity=".7" stroke-linecap="round"/>`;
  for (let i = 0; i < 4; i++) { const sd = i % 2 ? 1 : -1, yy = y + (R() - .5) * r, l = r * (1.4 + R() * 2);
    out += `<path d="M${f(x + sd * r * 1.2)} ${f(yy)}l${f(sd * l)} ${f((R() - .5) * .6)}" stroke="#0c0604" stroke-width=".35" stroke-linecap="round"/>`; }
  return out + '</g>';
}
// a gun's burst out of a port seen nearly head-on (as in «Залп всей батареей»): an orange heart, a ragged rim, a short
// white blast towards us and down the wind (`wx` its sideways lean)
function burst(u, x, y, k, seed, wx = -.5) {
  const r = rng(70 + seed), g = nid('zb', u), gw = nid('zw', u), n = 7 + seed % 3, tw = (r() - .5) * .8;
  const pts = Array.from({ length: n * 2 }, (_, j) => { const a = j / (n * 2) * Math.PI * 2 + tw, rr = (j % 2 ? 1.7 + r() * .4 : 2.3 + r() * .9) * k; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8]; });
  const d = [wx - r() * .2, .9], Ln = (4.2 + r() * 1.6) * k, nx = -d[1], ny = d[0], tx = x + d[0] * Ln, ty = y + d[1] * Ln, w = 1.6 * k;
  return `<defs>${radGrad(g, x, y, 3.6 * k, [[0, '#fffbe6'], [.28, '#ffd860'], [.6, '#ff8a24'], [.86, '#d0400e'], [1, '#7a1606']])}${linGrad(gw, x, y, tx, ty, [[0, '#ffffff', .95], [.6, '#fff4dc', .7], [1, '#f2ece0', 0]])}</defs>`
    + K.localGlow(u, { x, y, color: '#ffb050', power: .7, radius: 9 * k })
    + `<path d="M${f(x + nx * .8 * k)} ${f(y + ny * .8 * k)}Q${f(x + d[0] * Ln * .55 + nx * w)} ${f(y + d[1] * Ln * .55 + ny * w)} ${f(tx)} ${f(ty)}Q${f(x + d[0] * Ln * .55 - nx * w)} ${f(y + d[1] * Ln * .55 - ny * w)} ${f(x - nx * .8 * k)} ${f(y - ny * .8 * k)}Z" fill="url(#${gw})"/>`
    + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${g})"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.3 * k)}" ry="${f(1 * k)}" fill="#fffdf0"/>`;
}
// a ball in flight with its soft smoke trail from (x0, y0) to the ball at (x1, y1)
function flying(u, L, x0, y0, x1, y1, r) {
  const g = nid('tg', u), fb = nid('tb', u), dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
  return `<defs>${linGrad(g, x0, y0, x1, y1, [[0, '#e8dccc', 0], [.7, '#efe6d8', .55], [1, '#f6f0e4', .85]])}${blur(fb, .8)}</defs>`
    + `<path d="M${f(x0 + nx * .4)} ${f(y0 + ny * .4)}L${f(x1 + nx * r * .9)} ${f(y1 + ny * r * .9)}L${f(x1 - nx * r * .9)} ${f(y1 - ny * r * .9)}L${f(x0 - nx * .4)} ${f(y0 - ny * .4)}Z" fill="url(#${g})" filter="url(#${fb})"/>`
    + K.shadeSphere(u, x1, y1, r, L, 'iron');
}

// the helpers are shared with «Прикрыть бортом» and «Ответный залп» (the same Revenge, the same hits)
const helpers = { lin, blur, sp, tiltShip, sidePt, portXH, stuckBall, dent, burst, flying, portSmoke, portFlash };
module.exports = { helpers, name: 'Тяжёлый борт', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    L.pal = Object.assign({}, L.pal, { sky: ['#1a0e22', '#4a1c30', '#a8462e', '#f09a5a'], sea: ['#b8664a', '#4a2030', '#140a14'], cloudLit: '#f0a070', cloudShade: '#3e1e30' });
    const R = rng(23);
    const tan = Math.tan(-SH.heel * Math.PI / 180), wlY = x => SH.y + (x - SH.x) * tan;   // her tilted waterline
    // ——— the dusk: a red sky ahead, lit clouds, the sea to the horizon over her rail
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 80, 14, 3, .1], [150, 18, 90, 12, 8, .15], [96, 60, 70, 8, 12, .4], [180, 70, 50, 6, 5, .6], [20, 72, 40, 5, 14, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 7, glitter: false });
    // the enemy's smoke drifting in from the right, beyond her stern
    bg += K.smoke(u, L, { x: 196, y: 82, w: 40, h: 30, wind: -.6, seed: 9, opacity: .55 });

    // ——— her: broadside on, close, laid over away from us on the slope of a swell
    const G = K.shipGeom(SH.kind, SH), P = sidePt(SH, G), ang = Math.atan(tan) * 180 / Math.PI;
    let fg = tiltShip(u, L, SH);
    // the near water: the swell's back rising to the left with her, foam along her tilted waterline
    { const g = nid('sw', u), top = [], N = 12; for (let i = 0; i <= N; i++) { const x = -10 + i * 220 / N; top.push([x, wlY(x) + 1.2 + Math.sin(i * 1.7) * .6]); }
      const d = sp(top) + 'L210 290L-10 290Z';
      fg += `<defs>${lin(g, 0, 118, 0, 200, [[0, '#a85a44'], [.12, '#5a2a34'], [.5, '#2a1220'], [1, '#100810']])}</defs><path d="${d}" fill="url(#${g})"/>`;
      const nc = nid('nc', u); fg += `<defs><clipPath id="${nc}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${nc})"><g opacity=".45">${K.water(u, L, { horizon: 92, bottom: 290, swell: 1, seed: 31, glitter: false })}</g></g>`;
      { const band = (h0, h1) => { const a = [], b = []; for (let X = -46; X <= 46; X += 2) { a.push(P(X, h1)); b.unshift(P(X, h0)); } return 'M' + a.concat(b).map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z'; }, bf = nid('bf', u);
        fg += `<defs>${blur(bf, .5)}</defs><g filter="url(#${bf})"><path d="${band(-.4, 1.7)}" fill="#3a2618" opacity=".82"/><path d="${band(1.5, 2.5)}" fill="#3a2618" opacity=".4"/></g>`; }
      fg += `<g transform="rotate(${f(ang)} ${SH.x} ${SH.y})">${K.foam(u, { x: SH.x, y: SH.y, w: 230, h: 3.4, seed: 21, L })}</g>`; }

    // ——— the hits: two balls stuck in the planking, old dents, the ricochet off the chainplate
    const pts = portXH(SH.kind).map(([X, H]) => ({ X, H, p: P(X, H) }));
    const b1 = P(-19, 3.4), b2 = P(7.2, 3.8), rc = P(-10.2, 10.6);
    const at = (X, H) => { const [x, y] = P(X, H); return { x, y }; };
    fg += dent(u, L, { ...at(-1.5, 10.4), r: 3, ang, seed: 4 }) + dent(u, L, { ...at(-26, 4.5), r: 2.8, ang, seed: 6 }) + dent(u, L, { ...at(14, 10), r: 2.6, ang, seed: 8 });
    fg += stuckBall(u, L, { x: b1[0], y: b1[1], r: 3.4, ang, seed: 3, dx: .4, dy: -.3 }) + stuckBall(u, L, { x: b2[0], y: b2[1], r: 3.2, ang, seed: 5, dx: .3, dy: -.4 });
    // the ricochet: a fresh dent on the iron strap, a fan of sparks and splinters, the ball flying off up and right
    { const [x, y] = rc; fg += dent(u, L, { x, y, r: 3.2, ang, seed: 9 });
      let sk = ''; for (let i = 0; i < 26; i++) { const a = -Math.PI * (.05 + R() * .7), d = 6 + R() * 20, x1 = x + Math.cos(a) * d, y1 = y + Math.sin(a) * d * .8;
        sk += `<path d="M${f(x + Math.cos(a) * 1.5)} ${f(y + Math.sin(a) * 1.2)}L${f(x1)} ${f(y1)}" stroke="${R() > .4 ? '#ffe7a0' : '#ffb050'}" stroke-width="${f(.25 + R() * .4)}" stroke-linecap="round" opacity="${f(.6 + R() * .4)}"/>`; }
      for (let i = 0; i < 10; i++) { const a = -Math.PI * (.1 + R() * .8), d = 4 + R() * 14, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d - 2, l = 1.4 + R() * 3, rot = R() * 3;
        sk += `<path d="M${f(cx - Math.cos(rot) * l / 2)} ${f(cy - Math.sin(rot) * l / 2)}l${f(Math.cos(rot) * l)} ${f(Math.sin(rot) * l)}" stroke="${R() > .5 ? '#e8c088' : '#8a5a2a'}" stroke-width=".55" stroke-linecap="round"/>`; }
      fg += K.localGlow(u, { x, y, color: '#ffd890', power: .9, radius: 20 }) + sk + flying(u, L, x + 4, y - 3, x + 30, y - 26, 3) ; }

    // ——— the answer: her guns fire one after another — one now (a long flame out of the hot port), the others a moment
    // earlier, their flame already sinking in its own clump of smoke rolling out of the port and drifting left
    const pq = (X, H, w = 2.4, hh = 2.28) => [P(X - w / 2, H - hh / 2), P(X + w / 2, H - hh / 2), P(X + w / 2, H + hh / 2), P(X - w / 2, H + hh / 2)];
    for (const [i, ph, sd] of [[4, .72, 7], [1, .9, 5], [5, .42, 2], [2, 0, 4]]) { const { X, H } = pts[i], m = P(X, H - .24, 1.9);
      fg += portFlash(u, L, { x: m[0], y: m[1], k: 2.5, phase: ph, seed: sd, dir: 166, len: 6.5, smokeDir: [-.94, -.3], port: pq(X, H) }); }
    fg += K.localGlow(u, { x: pts[2].p[0], y: pts[2].p[1] + 4, color: '#ffb060', power: .45, radius: 60 }, { squash: .35, core: false });
    // the cut of her side in the empty port amidships: the sill and the jamb show the thickness — the outer planking
    // (tarred), the oak frame (end grain), the red-painted ceiling inside
    { const { X, H } = pts[3], w = 2.4, hh = 2.28, b0 = H - hh / 2, xl = X - w / 2, q = (pa) => `M${pa.map(v => f(v[0]) + ' ' + f(v[1])).join('L')}Z`;
      const lay = [[0, .2, '#2c1a10'], [.2, .52, '#a8743e'], [.52, .7, '#8e2c1c']];
      for (const [t0, t1, c] of lay) fg += `<path d="${q([P(xl + t0 * .8, b0 + t0), P(X + w / 2, b0 + t0), P(X + w / 2, b0 + t1), P(xl + t1 * .8, b0 + t1)])}" fill="${c}"/>`
        + `<path d="${q([P(xl + t0 * .8, b0 + t0), P(xl + t1 * .8, b0 + t1), P(xl + t1 * .8, H + hh / 2), P(xl + t0 * .8, H + hh / 2)])}" fill="${mix(c, '#000000', .25)}"/>`;
      for (let j = 0; j < 7; j++) { const xx = xl + .4 + j * .3, a1 = P(xx, b0 + .22), a2 = P(xx + .05, b0 + .5); fg += `<path d="M${f(a1[0])} ${f(a1[1])}L${f(a2[0])} ${f(a2[1])}" stroke="#5a3418" stroke-width=".25" opacity=".7"/>`; }
      const e0 = P(xl, b0), e1 = P(X + w / 2, b0); fg += `<path d="M${f(e0[0])} ${f(e0[1])}L${f(e1[0])} ${f(e1[1])}" stroke="${L.ramp('oak', X, H).lit}" stroke-width=".45" opacity=".8"/>`; }

    // ——— the next ball coming in on its trail from the right edge, the splash of one that fell short
    fg += flying(u, L, 216, 34, 172, 62, 3.2);
    // under the glass: the near swell darkening
    { const g = nid('dk', u); fg += `<defs>${lin(g, 0, 140, 0, 290, [[0, '#0a0410', 0], [1, '#0a0410', .6]])}</defs><rect x="0" y="140" width="200" height="150" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
