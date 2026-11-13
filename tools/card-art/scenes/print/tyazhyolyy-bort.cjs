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
function portXH(kind) {
  const sp = K.SHIP_SPECS[kind], hb = sp.len / 2, row = sp.ports[0], pitch = (row.x1 - row.x0) / (row.n - 1);
  const sheer = X => { const t = X / hb; return (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t; };
  return Array.from({ length: row.n }, (_, i) => { const X = row.x0 + i * pitch; return [X, row.h + sheer(X) * clamp(row.h / sp.free, 0, 1.25)]; });
}

// KIT-CANDIDATE a ball stuck in a thick wooden side: the crater of crushed wood (its wall lit on the side away from
// the light), pale fibres torn out round its rim, cracks running along the grain (angle `ang`), the ball half sunk in it
function stuckBall(u, L, o) {
  const { x, y, r, ang = 0 } = o, R = rng(o.seed || 1), rp = L.ramp('oak', x, y), cg = nid('cr', u), lx = L.ux, ly = L.uy;
  let out = `<g transform="rotate(${f(ang)} ${f(x)} ${f(y)})">`;
  // the dent: a wide shallow bowl, darker on the side towards the light (its wall faces away), lit on the far wall
  out += `<defs>${radGrad(cg, x - lx * r * .5, y - ly * r * .5, r * 2.6, [[0, '#0a0503'], [.45, '#2a1408'], [.75, mix(rp.half, '#3a1a0a', .4)], [1, rp.half, 0]])}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 2.5)}" ry="${f(r * 2.1)}" fill="url(#${cg})"/>`
    + `<path d="M${f(x + lx * r * 2.2 - r * .9)} ${f(y + ly * r * 1.6 + r * 1.1)}A${f(r * 2.3)} ${f(r * 1.9)} 0 0 0 ${f(x + r * 2.2)} ${f(y - r * .6)}" stroke="${rp.lit}" stroke-width="${f(r * .22)}" fill="none" opacity=".75" stroke-linecap="round"/>`;
  // cracks along the grain, both ways, each its own length, with a lit lip
  for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, yy = y + (R() - .5) * r * 1.6, l = r * (1.2 + R() * 2.2), x0 = x + sd * r * 1.4;
    const d = `M${f(x0)} ${f(yy)}l${f(sd * l * .5)} ${f((R() - .5) * .8)}l${f(sd * l * .5)} ${f((R() - .5) * .6)}`;
    out += `<path d="${d}" stroke="#0c0604" stroke-width="${f(.35 + R() * .3)}" fill="none" stroke-linecap="round"/><path d="${d}" transform="translate(0 ${f(-.4)})" stroke="${rp.lit}" stroke-width=".18" fill="none" opacity=".55"/>`; }
  // torn fibres standing out of the rim: pale fresh wood
  out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.45)}" ry="${f(r * 1.3)}" fill="#1a0c06" opacity=".85"/>`;
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + R() * .3, rr = r * (1.2 + R() * .25), l = r * (.22 + R() * .35), w = .18 + R() * .2;
    const ax = x + Math.cos(a) * rr, ay = y + Math.sin(a) * rr * .9, bx = ax + Math.cos(a + (R() - .5) * .5) * l, by = ay + Math.sin(a + (R() - .5) * .5) * l * .7;
    const lit = Math.cos(a) * -lx + Math.sin(a) * -ly > 0;
    out += `<path d="M${f(ax - w)} ${f(ay)}L${f(bx)} ${f(by)}L${f(ax + w)} ${f(ay + w * .5)}Z" fill="${lit ? '#e8b878' : '#8a5428'}"/>`; }
  out += '</g>';
  // the ball half sunk: the iron sphere, its shadow in the crater on the side away from the light
  out += `<ellipse cx="${f(x - lx * r * .35)}" cy="${f(y - ly * r * .35 + r * .2)}" rx="${f(r * 1.08)}" ry="${f(r)}" fill="#050302" opacity=".75"/>`
    + K.shadeSphere(u, x + (o.dx || 0), y + (o.dy || 0), r, L, 'iron');
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
const helpers = { lin, blur, sp, tiltShip, sidePt, portXH, stuckBall, dent, burst, flying };
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
      fg += `<g transform="rotate(${f(ang)} ${SH.x} ${SH.y})">${K.foam(u, { x: SH.x, y: SH.y + 1, w: 230, h: 2.2, seed: 21, L })}</g>`; }

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

    // ——— the answer: her guns have fired, the ports wrapped in smoke rolling out and drifting left; two still flash
    { const pg = nid('pg', u), pd = nid('pd', u), pf = nid('pf', u);
      fg += `<defs><radialGradient id="${pg}" cx=".4" cy=".34" r=".66"><stop offset="0" stop-color="#fff4e6"/><stop offset=".45" stop-color="#e8d8cc" stop-opacity=".95"/><stop offset=".8" stop-color="#a89098" stop-opacity=".85"/><stop offset="1" stop-color="#6a5260" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="${pd}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a2030" stop-opacity=".5"/><stop offset="1" stop-color="#3a2030" stop-opacity="0"/></radialGradient>${blur(pf, .8)}</defs>`;
      let sh = '', bl = '';
      pts.forEach((q, i) => { if (i === 0 || i === 4) return; const k = (i === 2 || i === 5 ? 1.2 : 1.6) * (.85 + R() * .3), [x, y] = q.p;
        for (let j = 0; j < 6; j++) { const bx = x - 1 - j * 3.6 * k + (R() - .5) * 1.4, by = y + 3 - j * .7 * k + (R() - .5) * 1.2, rr = (2.4 + j * 1.1) * k;
          if (j > 2) sh += `<circle cx="${f(bx + .8)}" cy="${f(by + rr * .5)}" r="${f(rr)}" fill="url(#${pd})"/>`;
          bl += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(rr)}" fill="url(#${pg})" opacity="${f(.85 - j * .1)}"/>`; } });
      fg += sh + `<g filter="url(#${pf})">${bl}</g>`;
      for (const i of [2, 5]) { const [x, y] = pts[i].p; fg += burst(u, x, y + .6, 2.8, i * 7, -.6); }
      fg += K.localGlow(u, { x: 110, y: 88, color: '#ffb060', power: .4, radius: 90 }, { squash: .25, core: false }); }

    // ——— the next ball coming in on its trail from the right edge, the splash of one that fell short
    fg += flying(u, L, 216, 34, 172, 62, 3.2);
    // under the glass: the near swell darkening
    { const g = nid('dk', u); fg += `<defs>${lin(g, 0, 140, 0, 290, [[0, '#0a0410', 0], [1, '#0a0410', .6]])}</defs><rect x="0" y="140" width="200" height="150" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
