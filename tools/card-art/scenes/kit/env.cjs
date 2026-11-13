// kit/env.cjs — the surroundings of a print scene drawn from its light L (kit/light.cjs, makeLight): sky, sun and
// moon, clouds, the sea in perspective with the glitter path under the source, foam, reflections, splashes, fog,
// smoke, fire, a gun's flash, a deck in perspective. Pure functions that return SVG strings; no Node API.
// Noise (feTurbulence) is used only to move the EDGE of a form (cloud, smoke, fire, foam, a reflection torn by
// ripples), never as a layer over the picture or over the whole sea. Rules: docs/mockups/print/STYLE.md.
'use strict';
const { nid, f, clamp, lerp, rng, mix, scale, linGrad, radGrad, localGlow } = require('./light.cjs');
const W = 200;
const DIM = { night: .8, fog: .78, dusk: .96, day: 1 };
// a light for the pieces that may be drawn without the scene's light: from the upper left, white
const FLAT = { point: false, keyColor: '#ffffff', shadowTint: '#2b4262', time: 'day', at: () => ({ dx: -.5, dy: -.7, dz: .5, ux: -.58, uy: -.81, p: .86, k: 1 }) };
// the edge of a soft form: noise moves the outline by up to `disp` units (<= 3), then a slight blur
const edgeFilter = (id, box, seed, disp = 2.4, freq = '0.055 0.085', blur = .35) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${f(Math.min(3, disp))}" xChannelSelector="R" yChannelSelector="G"/>${blur ? `<feGaussianBlur stdDeviation="${f(blur)}"/>` : ''}</filter>`;
const blurFilter = (id, box, sd) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
const softDot = id => `<radialGradient id="${id}"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

/**
 * sky(u, L, { horizon, stars, seed, top, w, avoid, clear }) — the sky from `top` (0) down to the horizon by L.time: a
 * gradient from the zenith to the tone at the horizon (at sunset: the deep zenith, the rose belt, the orange band and
 * the bright strip at the horizon), lighter round the source, stars at night (stars: a number, or false). The stars
 * differ in size and brightness (most faint, a few large ones with rays), crowd to the zenith and dim, warm and
 * vanish towards the horizon; none on the sun or moon or inside its bright halo (`clear` — that radius, by default
 * from a moon of r 8), none inside `avoid` (a list of { x, y, w, h } as given to cloud(): x — the middle, y — the
 * flat underside).
 */
function sky(u, L, o = {}) {
  const hz = o.horizon != null ? o.horizon : L.cam.horizon, w = o.w || W, top = o.top || 0, P = L.pal, id = nid('sk', u), cid = nid('skc', u), R = rng(o.seed != null ? o.seed : 7), dusk = L.time === 'dusk';
  let defs = linGrad(id, 0, top, 0, hz, [[0, P.sky[0]], [.42, P.sky[1]], [.78, P.sky[2]], [1, P.sky[3]]]) + `<clipPath id="${cid}"><rect x="0" y="${f(top)}" width="${w}" height="${f(hz - top + .6)}"/></clipPath>`;
  let body = `<rect x="0" y="${f(top)}" width="${w}" height="${f(hz - top + .6)}" fill="url(#${id})"/>`;
  if (dusk) { // at sunset the last tenth over the horizon burns across the whole width, brightest at the horizon
    const hb = nid('skh', u), bh = (hz - top) * .14;
    defs += linGrad(hb, 0, hz - bh, 0, hz, [[0, P.sky[3], 0], [.7, mix(P.sky[3], L.keyColor, .3), .32], [1, mix(P.sky[3], '#fff4d8', .4), .5]]);
    body += `<rect x="0" y="${f(hz - bh)}" width="${w}" height="${f(bh + .6)}" fill="url(#${hb})"/>`;
  }
  const s = L.source && L.front ? L.source : null;
  if (s) { // the air glows round the sun or moon and along the horizon under it
    const g = nid('ska', u), k = L.time === 'dusk' ? .62 : L.time === 'day' ? .5 : L.time === 'fog' ? .34 : .3, c = mix(L.keyColor, P.sky[3], .25);
    defs += `<radialGradient id="${g}"><stop offset="0" stop-color="${c}" stop-opacity="${k}"/><stop offset=".4" stop-color="${c}" stop-opacity="${f(k * .4)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
    const gx = clamp(s.x, -60, w + 60);
    body += `<ellipse cx="${f(gx)}" cy="${f(Math.min(Math.max(s.y, top - 40), hz))}" rx="${L.time === 'fog' ? 120 : 96}" ry="${L.time === 'fog' ? 96 : 78}" fill="url(#${g})"/><ellipse cx="${f(gx)}" cy="${f(hz)}" rx="${L.time === 'dusk' ? 190 : 150}" ry="${L.time === 'dusk' ? 34 : 18}" fill="url(#${g})" opacity="${L.time === 'dusk' ? 1 : .7}"/>`;
  }
  const n = o.stars === false ? 0 : typeof o.stars === 'number' ? o.stars : L.time === 'night' ? 70 : 0;
  if (n) {
    const sd = nid('sks', u), H = hz - top, clear = o.clear != null ? o.clear : 19, avoid = o.avoid || [], cap = Math.max(2, Math.round(n / 14)), night = L.time === 'night';
    defs += softDot(sd);
    let big = 0;
    for (let i = 0; i < n; i++) {
      // the same number of draws for every star, so a star skipped below does not move the others
      const x = R() * w, t = Math.pow(R(), 1.55), y = top + t * H * .97, m = Math.pow(R(), 2.6), kc = R(), ka = R();
      const ext = Math.pow(clamp((1 - t) / .5), 1.3) * (night ? 1 : clamp(1 - t * 1.5)); // the thick air at the horizon
      const near = s ? Math.hypot(x - s.x, y - s.y) : 1e3, halo = clamp((near - clear) / (clear * 1.2 + 6));
      const hid = avoid.some(a => Math.abs(x - a.x) < (a.w || 0) / 2 + 2 && y > a.y - (a.h || 0) * 1.25 - 2 && y < a.y + 2);
      const op = (.34 + .66 * m) * ext * halo;
      if (op < .06 || hid) continue;
      const r = .2 + .42 * m, col = mix(['#ffffff', '#dde6ff', '#fff0d6', '#e6edff'][Math.floor(kc * 4)], '#ffd9b0', t * .45);
      body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="${f(op)}"/>`;
      if (m > .2) body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.4)}" fill="url(#${sd})" opacity="${f(op * (.18 + .3 * m))}"/>`;
      if (m > .6 && op > .45 && big < cap) { // a few large stars with thin rays: a long cross and a short diagonal one
        big++;
        const l = 1.6 + 3.2 * m, a = ka * 14 - 7, ray = (len, th, ang, q) => `<path d="M${f(-len)} 0Q0 ${f(-th)} ${f(len)} 0Q0 ${f(th)} ${f(-len)} 0Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})" fill="${col}" opacity="${f(op * q)}"/>`;
        body += ray(l, .2, a, .8) + ray(l, .2, a + 90, .8) + ray(l * .42, .14, a + 45, .5) + ray(l * .42, .14, a - 45, .5);
      }
    }
  }
  return `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}</g>`;
}

/**
 * sunMoon(u, L, { r, seed, phase, lit, rays }) — the disc of the sun or moon with its halo at the key light's place
 * (L.source), where makeLight also puts the source of the scene's light and shadows.
 * Moon: a crisp disc a little darker at the limb, its own grey seas (soft-edged irregular patches, darker cores) and
 * small craters; `phase` 0..1 — the lit share (1, full, by default): the dark part is laid over softly, a faint
 * earthshine left in it; `lit` — the angle to the lit limb (degrees: 0 — right, 90 — down; 60 by default).
 * Sun: a white-hot disc, the glow, a bright bloom round the disc and soft rays of different length above the horizon
 * (`rays: false` — none; none in fog; fewer and shorter at sunset).
 */
function sunMoon(u, L, o = {}) {
  const s = L.source; if (!s || L.point) return '';
  const moon = L.key.type === 'moon', fog = L.time === 'fog', dusk = L.time === 'dusk', r = o.r || (moon ? 8 : 7), h1 = nid('sm', u), h2 = nid('sn', u), d = nid('sd', u), c = nid('so', u);
  const hc = mix(L.keyColor, '#ffffff', .3), big = r * (fog ? 13 : dusk ? 11 : moon ? 8 : 10), kb = fog ? .5 : moon ? .36 : .6, R = rng(o.seed != null ? o.seed : 5);
  const disc = moon ? (fog ? ['#f0fbf2', '#dcefe2', '#bcd8ca', '#9fc4b4'] : ['#fdfbef', '#f4f0dc', '#e4dfc6', '#cdc7ab']) : dusk ? ['#fff6c8', '#ffd27a', '#ff9a4a'] : ['#ffffff', '#fffbe6', '#fff0b8'];
  let defs = `<radialGradient id="${h1}"><stop offset="0" stop-color="${hc}" stop-opacity="${kb}"/><stop offset=".25" stop-color="${hc}" stop-opacity="${f(kb * .42)}"/><stop offset=".6" stop-color="${hc}" stop-opacity="${f(kb * .12)}"/><stop offset="1" stop-color="${hc}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="${h2}"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".45" stop-color="${hc}" stop-opacity=".5"/><stop offset="1" stop-color="${hc}" stop-opacity="0"/></radialGradient>`
    + (moon ? radGrad(d, s.x, s.y, r, [[0, disc[0]], [.55, disc[1]], [.9, disc[2]], [1, disc[3]]]) : dusk ? linGrad(d, s.x, s.y - r, s.x, s.y + r, [[0, disc[0]], [.5, disc[1]], [1, disc[2]]]) : radGrad(d, s.x, s.y, r, [[0, disc[0]], [.7, disc[1]], [1, disc[2]]]))
    + `<clipPath id="${c}"><circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r)}"/></clipPath>`;
  let out = `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(big)}" fill="url(#${h1})" style="mix-blend-mode:screen"/><circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r * (fog ? 3.4 : 2.3))}" fill="url(#${h2})" style="mix-blend-mode:screen"/>`;
  if (!moon) {
    if (o.rays !== false && !fog) { // soft rays of different length, only above the horizon; a bloom round the disc
      const rg = nid('sr', u), rb = nid('sb', u), rc = nid('sq', u), n = dusk ? 11 : 16, lmax = r * (dusk ? 6 : 9.5), hz = L.cam.horizon, ph = R() * 360;
      defs += radGrad(rg, s.x, s.y, lmax, [[0, hc, dusk ? .5 : .6], [r / lmax, hc, dusk ? .45 : .52], [.5, hc, dusk ? .12 : .16], [1, hc, 0]])
        + blurFilter(rb, [s.x - lmax - 4, s.y - lmax - 4, lmax * 2 + 8, lmax * 2 + 8], f(Math.max(.25, r * .05)))
        + `<clipPath id="${rc}"><rect x="${f(s.x - lmax - 4)}" y="${f(s.y - lmax - 4)}" width="${f(lmax * 2 + 8)}" height="${f(Math.max(0, hz - (s.y - lmax - 4)))}"/></clipPath>`;
      let rays = '';
      for (let i = 0; i < n; i++) {
        const a = (ph + i * 360 / n + (R() - .5) * 360 / n * .5) * Math.PI / 180, len = r * (i % 2 ? 1.6 + R() * 1.8 : 2.8 + R() * 3.2) * (dusk ? .8 : 1), dl = (.1 + R() * .09) * (i % 2 ? .75 : 1);
        const p = (ang, q) => `${f(s.x + Math.cos(ang) * q)} ${f(s.y + Math.sin(ang) * q)}`;
        rays += `<path d="M${p(a - dl, r * .7)}L${p(a, Math.min(len, lmax))}L${p(a + dl, r * .7)}Z" fill="url(#${rg})"/>`;
      }
      out += `<g clip-path="url(#${rc})"><g filter="url(#${rb})" style="mix-blend-mode:screen">${rays}</g></g>`;
    }
    out += `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r * 1.35)}" fill="url(#${h2})" style="mix-blend-mode:screen"/>`;
  }
  out += `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r)}" fill="url(#${d})"${fog ? ' opacity=".9"' : ''}/>`;
  if (moon) { // the grey seas of the moon: soft irregular patches with darker cores, and small craters
    const sea = fog ? '#86ab9b' : '#a9a48d', core = fog ? '#7a9e8f' : '#9a957e', sf = nid('sf', u);
    const blob = (cx, cy, rx, ry, rot, col, op) => { const k = 9, pts = [], cr = Math.cos(rot), sr = Math.sin(rot);
      for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2, q = .78 + R() * .4, px = Math.cos(a) * rx * q, py = Math.sin(a) * ry * q; pts.push([s.x + (cx + px * cr - py * sr) * r, s.y + (cy + px * sr + py * cr) * r]); }
      return `<path d="${smoothPath(pts, true)}" fill="${col}" opacity="${f(op)}"/>`; };
    // [x, y, rx, ry, rotation] in the disc's radii: a large sea upper left joined to a chain, two round seas on the right, a few small ones below
    const SEAS = [[-.3, -.26, .36, .27, .5], [-.02, -.36, .2, .16, -.3], [.3, -.1, .26, .3, .2], [.36, .38, .2, .15, -.6], [-.42, .14, .22, .3, .1], [-.08, .2, .2, .13, .7], [.04, .58, .14, .1, 0]];
    let seas = '';
    for (const [x0, y0, rx, ry, rt] of SEAS) {
      const jx = (R() - .5) * .06, jy = (R() - .5) * .06;
      seas += blob(x0 + jx, y0 + jy, rx * (.92 + R() * .2), ry * (.92 + R() * .2), rt + (R() - .5) * .5, sea, .55 + R() * .25)
        + blob(x0 + jx + (R() - .5) * rx * .3, y0 + jy + (R() - .5) * ry * .3, rx * .55, ry * .55, rt, core, .35 + R() * .25);
    }
    let craters = '';
    if (r >= 9) { // a small crater: a darker floor and a light rim on the far side from the light; one bright young crater below
      for (const [x0, y0, q] of [[.16, -.56, .07], [-.56, -.36, .06], [.58, .1, .05], [-.24, .52, .06], [.12, .06, .045]]) {
        const cx = s.x + x0 * r, cy = s.y + y0 * r, cr = Math.max(.25, q * r);
        craters += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="${core}" opacity=".45"/><path d="M${f(cx - cr)} ${f(cy)}A${f(cr)} ${f(cr)} 0 0 0 ${f(cx + cr)} ${f(cy)}" fill="none" stroke="${disc[0]}" stroke-width="${f(Math.max(.12, cr * .35))}" opacity=".7"/>`;
      }
    }
    if (r >= 5) craters += `<circle cx="${f(s.x - .14 * r)}" cy="${f(s.y + .7 * r)}" r="${f(Math.max(.22, r * .045))}" fill="#ffffff" opacity=".85"/>`;
    defs += blurFilter(sf, [s.x - r * 1.5, s.y - r * 1.5, r * 3, r * 3], f(Math.max(.1, r * .035)));
    out += `<g clip-path="url(#${c})"><g opacity="${fog ? .5 : .66}"><g filter="url(#${sf})">${seas}</g>${craters}</g>`;
    const ph = o.phase != null ? clamp(o.phase) : 1;
    if (ph < .995) { // the night side: between the dark limb and the terminator (a half-ellipse), soft at the terminator
      const tf = nid('st', u), e = r * (1 - 2 * ph), ang = o.lit != null ? o.lit : 60, dark = mix(P0(L), '#000000', .25);
      defs += blurFilter(tf, [-r * 1.6, -r * 1.6, r * 3.2, r * 3.2], f(Math.max(.2, r * .09)));
      out += `<path d="M0 ${f(-r * 1.04)}A${f(r * 1.04)} ${f(r * 1.04)} 0 0 0 0 ${f(r * 1.04)}A${f(Math.abs(e))} ${f(r * 1.04)} 0 0 ${e < 0 ? 1 : 0} 0 ${f(-r * 1.04)}Z" transform="translate(${f(s.x)} ${f(s.y)}) rotate(${f(ang)})" fill="${dark}" opacity=".88" filter="url(#${tf})"/>`;
    }
    out += '</g>';
  }
  return `<defs>${defs}</defs>` + out;
}
// the colour the night side of the moon takes: the sky round it
const P0 = L => L.pal.sky[1];

const stops = list => list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${f(clamp(a))}"` : ''}/>`).join('');
// the key light's direction in the picture plane at (x, y): to the disc of the sun or moon when it is in the
// picture, otherwise L.at; back — the light comes from behind the thing, towards the viewer
function lightSide(L, x, y) {
  const a = L.at(x, y); let ux = a.ux || 0, uy = a.uy || 0;
  if (L.source && L.front && !L.point) { const dx = L.source.x - x, dy = L.source.y - y, l = Math.hypot(dx, dy); if (l > 1) { ux = dx / l; uy = dy / l; } }
  const l = Math.hypot(ux, uy) || 1; return { ux: ux / l, uy: uy / l, dz: a.dz, back: a.dz < -.2 };
}

// a smooth path through points (Catmull-Rom as cubic Béziers); closed — back to the first point
function smoothPath(pts, closed) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// A soft form of round puffs (cloud, smoke), seen as ONE volume: the puffs only make its outline (their union, torn
// by noise at the edge); the light and shade are laid over the whole union, so no seam shows between the puffs.
// cs: [cx, cy, rx, ry/rx]. o.dir — the light's direction in the picture plane; front light: the whole form runs
// lit → half tone away from the source, the union moved away from the light (blurred) lays the shade on the far side
// and below, the puffs that face the source get soft lit caps that fade into the half tone (no dark ring round them);
// against the light (o.back): a dark body, a bright crescent only on the edge that faces the source. o.flat — y of a
// flat underside; o.under — how dark the underside is; o.fade [x0, y0, x1, y1, a0, a1] — the form thins along that
// line; o.inner — more SVG inside the form (a glow from below).
function billow(u, L, cs, col, o = {}) {
  const ex = q => [q[2], q[2] * (q[3] || 1)];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const q of cs) { const [rx, ry] = ex(q); x0 = Math.min(x0, q[0] - rx); x1 = Math.max(x1, q[0] + rx); y0 = Math.min(y0, q[1] - ry); y1 = Math.max(y1, q[1] + ry); }
  if (o.flat != null) y1 = Math.min(y1, o.flat);
  const hh = y1 - y0, ww = x1 - x0, pad = 10 + (o.pad || 0), box = [x0 - pad, y0 - pad, ww + 2 * pad, hh + 2 * pad];
  const dl = Math.hypot(o.dir.ux, o.dir.uy) || 1, ux = o.dir.ux / dl, uy = o.dir.uy / dl, back = !!o.back;
  const G = nid('bg', u), M = nid('bm', u), E = nid('be', u), B = nid('bb', u), S = nid('bs', u), U = nid('bu', u), F = nid('bf', u), C = nid('bc', u), A = nid('ba', u);
  const el = (q, extra = '', k = 1) => { const [rx, ry] = ex(q); return `<ellipse cx="${f(q[0])}" cy="${f(q[1])}" rx="${f(rx * k)}" ry="${f(ry * k)}"${extra}/>`; };
  const shapes = cs.map(q => el(q)).join('');
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ext = Math.max(ww, hh) / 2;
  // the size of one swell of the form: the shade's shift and softness follow it, not the whole cloud
  const rs = cs.map(q => ex(q)[1]).sort((a, b) => a - b), rm = rs[Math.floor(rs.length * .6)] || hh / 2;
  let defs = edgeFilter(E, box, o.seed || 1, o.disp != null ? o.disp : 2.4, o.freq, o.blur != null ? o.blur : .35)
    + blurFilter(B, box, f(o.seam != null ? o.seam : clamp(rm * .22, .5, 3)))
    + blurFilter(S, box, f(clamp(rm * (back ? .32 : .42), .6, 5)));
  if (o.flat != null) defs += `<clipPath id="${C}"><rect x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(o.flat - box[1])}"/></clipPath>`;
  // the fade is a black veil over the opaque union (not a translucent fill of every puff, whose overlaps would show)
  if (o.fade) { const [a, b, c, d, a0, a1] = o.fade; defs += linGrad(F, a, b, c, d, [[0, '#000', 1 - a0], [.45, '#000', 1 - lerp(a0, a1, .3)], [1, '#000', 1 - a1]]); }
  defs += `<mask id="${M}" maskUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><g filter="url(#${E})"><g${o.flat != null ? ` clip-path="url(#${C})"` : ''} fill="#fff">${shapes}</g></g>${o.fade ? `<rect x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}" fill="url(#${F})"/>` : ''}</mask>`;
  // 1. the whole form's tone towards the light
  defs += linGrad(A, cx + ux * ext, cy + uy * ext, cx - ux * ext, cy - uy * ext, back ? [[0, col.mid], [.3, mix(col.shade, col.mid, .5)], [1, mix(col.shade, col.mid, .2)]] : [[0, col.lit], [.45, mix(col.lit, col.mid, .55)], [1, col.mid]]);
  let body = `<rect x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}" fill="url(#${A})"/>`;
  // 3. lit caps on the swells that face the source; each fades out before its edge, so they melt into one another.
  // Against the light the caps are the thin tops of the swells the light shines through: dimmer, only near the source
  if (o.puffs == null || o.puffs > 0) {
    const cc = back ? mix(col.mid, col.rim || col.lit, .45) : col.knob || col.lit, cl = back ? mix(col.mid, col.rim || col.lit, .2) : col.lit;
    // the cap is its own soft disc moved towards the light, transparent at its rim: it never shows the puff's edge
    defs += `<radialGradient id="${G}" fx="${f(.5 + ux * .14)}" fy="${f(.5 + uy * .14)}">${stops([[0, cc, .95], [.4, cl, .55], [.75, cl, .16], [1, cl, 0]])}</radialGradient>`;
    const pr = cs.map(q => q[0] * ux + q[1] * uy), pmin = Math.min(...pr), pmax = Math.max(...pr), po = o.puffs != null ? o.puffs : back ? .55 : .8;
    body += `<g filter="url(#${B})">` + cs.map((q, i) => { const t = pmax - pmin > .1 ? (pr[i] - pmin) / (pmax - pmin) : 1, cw = o.capFlat != null ? o.capFlat : .3, op = po * (back ? Math.pow(t, 2) : cw + (1 - cw) * Math.pow(t, 1.2)); const [rx, ry] = ex(q); return op > .04 ? el([q[0] + ux * rx * .28, q[1] + uy * ry * .28, q[2], q[3]], ` fill="url(#${G})" opacity="${f(op)}"`, .92) : ''; }).join('') + '</g>';
  }
  // creases: every swell's own side away from the light, very soft, so the swells read without a seam between them
  if (o.crease !== 0) { const CR = nid('bk', u), kk = o.crease != null ? o.crease : back ? .35 : .45;
    defs += blurFilter(CR, box, f(clamp(rm * (o.creaseSoft || .2), .4, 4)));
    body += `<g filter="url(#${CR})" opacity="${f(kk)}">` + cs.filter(q => ex(q)[1] > rm * (o.creaseMin != null ? o.creaseMin : .7)).map(q => { const [rx, ry] = ex(q), k = nid('bn', u);
      defs += `<mask id="${k}" maskUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}">${el(q, ' fill="#fff"')}${el([q[0] + ux * ry * .55, q[1] + uy * ry * .55 - ry * .1, q[2], q[3]], ' fill="#000"', 1.02)}</mask>`;
      return `<g mask="url(#${k})">${el(q, ` fill="${col.shade}"`)}</g>`; }).join('') + '</g>'; }
  // 2. the shade: the union moved away from the light and down, blurred — the edge towards the source stays lit
  const sh = rm * (back ? .4 : .62), so = o.shadeOp != null ? o.shadeOp : back ? .7 : .62;
  body += `<g filter="url(#${S})" fill="${col.shade}" opacity="${f(so)}"><g transform="translate(${f(-ux * sh)} ${f(-uy * sh * .7 + sh * .45)})">${shapes}</g></g>`;
  // 4. the underside: a band of shade up from the flat bottom (or the lowest edge)
  if (o.under) { const yb = o.flat != null ? o.flat : y1, yt = yb - hh * (o.uh || .5); defs += linGrad(U, 0, yt, 0, yb, [[0, col.shade, 0], [.55, col.shade, o.under * .5], [1, col.shade, o.under]]); body += `<rect x="${f(box[0])}" y="${f(yt)}" width="${f(box[2])}" height="${f(yb - yt + 1)}" fill="url(#${U})"/>`; }
  // 5. against the light: the outline minus itself moved away from the light — a crescent only on the edge to the source
  if (back && col.rim) { const ins = o.rimW != null ? o.rimW : clamp(hh * .07, .5, 2.4), ro = o.rimOp != null ? o.rimOp : .85;
    const crescent = (k, op) => { const RM = nid('br', u), ER = nid('bq', u);
      defs += edgeFilter(ER, box, o.seed || 1, o.disp != null ? o.disp : 2.4, o.freq, ins * k * .3) + `<mask id="${RM}" maskUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><g filter="url(#${ER})"><g fill="#fff">${shapes}</g><g fill="#000" transform="translate(${f(-ux * ins * k)} ${f(-uy * ins * k)})">${shapes}</g></g></mask>`;
      return `<g mask="url(#${RM})"><rect x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}" fill="${col.rim}" opacity="${f(op)}"/></g>`; };
    body += crescent(2.6, ro * .3) + crescent(1, ro * .8); }
  return `<defs>${defs}</defs><g mask="url(#${M})"${o.opacity != null ? ` opacity="${f(o.opacity)}"` : ''}>${body}${o.inner || ''}</g>`;
}

/**
 * cloud(u, L, { x, y, w, h, seed, far }) — a cloud with volume: x — the middle, y — its flat underside, w, h — the
 * size. Every puff is lit from the side of the source, the underside is flat and in shadow; against the light (the
 * moon or sun beyond the cloud) — a dark body with a bright rim on the side towards the source only.
 * far 0..1 — aerial perspective: paler and nearer to the tone of the sky at the horizon.
 */
function cloud(u, L, o = {}) {
  const x = o.x != null ? o.x : 100, y = o.y != null ? o.y : 50, w = o.w || 60, h = o.h || 22, far = o.far || 0, R = rng(o.seed != null ? o.seed : 1), P = L.pal;
  const n = Math.max(4, Math.round(w / 9)), cs = [[x, y - h * .14, w * .46, h * .2 / (w * .46)]], step = w * .9 / n;
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n + (R() - .5) * .08, env = Math.pow(Math.sin(Math.PI * clamp(t, .03, .97)), .75), ry = h * (.2 + .34 * env * (.65 + .5 * R())), rx = Math.max(step * (.72 + R() * .3), ry);
    const cx = x + (t - .5) * w * .9; cs.push([cx, y - ry * .72 - h * .06, rx, ry / rx]);
    if (env > .5 && R() > .2 && ry > step * .6) { const r2 = ry * (.6 + R() * .3), k2 = h / w < .3 ? .62 + R() * .2 : .85 + R() * .15; cs.push([cx + (R() - .5) * ry, y - ry * 1.15 - r2 * k2 * (.1 + R() * .4), r2 * (1.1 + (1 - k2) * .6), k2]); } // a swell on top grown into the body; flatter on a flat cloud
  }
  // under a lamp the clouds are lit by the sky from above; otherwise by the source, with the sky adding light from above
  const ls = L.point ? { ux: 0, uy: -1, back: false } : lightSide(L, x, y - h / 2), back = ls.back && L.time !== 'fog';
  const lit = mix(mix(P.cloudLit, L.keyColor, .3), P.sky[3], far * .45), shade = mix(P.cloudShade, P.sky[2], far * .6);
  const col = { lit, mid: mix(lit, shade, back ? .5 : .26), shade, rim: mix(lit, '#ffffff', back ? .35 : .5), knob: mix(lit, '#ffffff', L.time === 'fog' ? 0 : .45) };
  return billow(u, L, cs, col, { dir: { ux: ls.ux, uy: ls.uy - (back ? .15 : .4) }, back, flat: y, under: lerp(back ? .7 : .62, .35, far), uh: .55, seed: (o.seed || 1) + 3, crease: lerp(back ? .35 : .45, .06, far), puffs: lerp(back ? .55 : .8, back ? .12 : .45, far), rimOp: lerp(.85, .38, far),
    disp: lerp(2.8, 2, far), freq: far > .5 ? '0.06 0.12' : '0.075 0.1', blur: lerp(.22, .6, far), seam: clamp(h * lerp(.045, .06, far), .5, 2.2) });
}
/** cloudBank(u, L, { y, h, x0, x1, n, seed, far }) — a row of n clouds of different size with undersides near y. */
function cloudBank(u, L, o = {}) {
  const y = o.y != null ? o.y : 60, h = o.h || 16, x0 = o.x0 != null ? o.x0 : -10, x1 = o.x1 != null ? o.x1 : W + 10, n = o.n || 4, R = rng(o.seed != null ? o.seed : 2), far = o.far != null ? o.far : .5;
  let out = '';
  for (let i = 0; i < n; i++) { const cw = (x1 - x0) / n * (.9 + R() * .8), ch = h * (.5 + R() * .5); out += cloud(u, L, { x: lerp(x0, x1, (i + .2 + R() * .6) / n), y: y - R() * h * .25, w: cw, h: ch, seed: Math.floor(R() * 900) + i, far }); }
  return out;
}

/**
 * water(u, L, { horizon, bottom, swell, seed, glitter, w }) — the sea from the horizon down to `bottom` (280): the
 * colour runs from the sky's tone at the horizon to deep near the viewer; rows of swell crowd to the horizon and
 * grow larger and stronger towards the viewer; the glitter path lies under the source and narrows to the horizon.
 * swell 0..1 (0.5). glitter: false — no path; a number — its x.
 */
function water(u, L, o = {}) {
  const hz = o.horizon != null ? o.horizon : L.cam.horizon, bot = o.bottom || 280, w = o.w || W, sw = o.swell != null ? o.swell : .5, R = rng(o.seed != null ? o.seed : 3), P = L.pal, H = bot - hz;
  const id = nid('wt', u), cid = nid('wc', u), hid = nid('wh', u);
  const seaAt = t => t < .45 ? mix(P.sea[0], P.sea[1], Math.pow(t / .45, .7)) : mix(P.sea[1], P.sea[2], (t - .45) / .55);
  const sheen = mix(P.sky[3], L.keyColor, .35), deep = scale(P.sea[2], .9);
  const gx = typeof o.glitter === 'number' ? o.glitter : L.source && L.front && o.glitter !== false ? L.source.x : null, el = L.key.el || 30;
  const pathHw = d => 1.4 + d * (.11 + .13 * (1 - el / 90));
  let defs = linGrad(id, 0, hz, 0, bot, [[0, P.sea[0]], [.12, seaAt(.12)], [.45, P.sea[1]], [1, P.sea[2]]]) + `<clipPath id="${cid}"><rect x="0" y="${f(hz)}" width="${w}" height="${f(H)}"/></clipPath>`
    + linGrad(hid, 0, hz, 0, hz + 5, [[0, P.sky[3], .6], [1, P.sky[3], 0]]);
  let body = `<rect x="0" y="${f(hz)}" width="${w}" height="${f(H)}" fill="url(#${id})"/><rect x="0" y="${f(hz)}" width="${w}" height="5" fill="url(#${hid})"/>`;
  // long backs of the swell in the near water: wide soft bands, dark below a lighter top
  for (const t0 of [.3, .46, .63, .8, .95]) {
    const y = hz + H * t0, lam = 40 + 90 * t0, A = (1 + 5 * t0) * (.4 + sw), th = (2 + 11 * t0) * (.5 + sw * .8), ph = R() * lam;
    const wave = (yy, dir) => { let s = '', x = dir > 0 ? -ph : w + lam, i = 0; const st = lam / 2 * dir; while (dir > 0 ? x < w + lam : x > -lam) { s += `${i ? 'T' : 'Q' + f(x + st / 2) + ' ' + f(yy - A) + ' '}${f(x + st)} ${f(yy)}`; x += st; i++; } return { s, x0: dir > 0 ? -ph : w + lam, x1: x }; };
    const a = wave(y, 1), b = wave(y + th, -1), g1 = nid('wb', u);
    defs += linGrad(g1, 0, y - A, 0, y + th + A, [[0, sheen, .16 * (.5 + t0)], [.3, seaAt(t0), 0], [.62, deep, .3 * (.4 + t0)], [1, deep, 0]]);
    body += `<path d="M${f(a.x0)} ${f(y)}${a.s}L${f(b.x0)} ${f(y + th)}${b.s}Z" fill="url(#${g1})"/>`;
  }
  // crests: a light crescent on the top of each wavelet, a dark trough under it. Not in rows: every crest has its own
  // height, length, skew and tilt, and a smooth noise in perspective (patches wider and taller near the viewer) makes
  // rough and calm patches of the wind — the crests grow longer, stronger and denser in the rough ones
  const NR = rng((o.seed != null ? o.seed : 3) + 101), NG = 11, grid = Array.from({ length: NG * NG }, () => NR());
  const sm3 = q => q * q * (3 - 2 * q), vn = (p, q) => { const i = Math.floor(p), j = Math.floor(q), fx = sm3(p - i), fy = sm3(q - j), g = (a, b) => grid[((a % NG) + NG) % NG + (((b % NG) + NG) % NG) * NG];
    return lerp(lerp(g(i, j), g(i + 1, j), fx), lerp(g(i, j + 1), g(i + 1, j + 1), fx), fy); };
  const patch = (px, dd, tt) => clamp((vn(px / (16 + 70 * tt) + 3.1, dd / (2.5 + 24 * tt)) * .7 + vn(px / (6 + 26 * tt), dd / (1.2 + 9 * tt) + 5.7) * .3 - .2) * 1.6);
  let d = .6, rows = 0;
  while (d < H && rows < 160) {
    const t = d / H, y = hz + d, lam = (4 + (9 + 44 * sw) * t) * (1 + 2.2 * Math.pow(1 - t, 5)), amp = (.1 + 2.7 * t * (.35 + sw)) * (1 + 1.1 * t * t), base = seaAt(t), light = mix(base, sheen, .62), dark = mix(base, deep, .7);
    const opL = .1 + .36 * Math.pow(t, .6), opD = .14 + .32 * Math.pow(t, .7), hwp = gx != null ? pathHw(d) * 1.5 : 0;
    // each crest is sharp at its top and melts away below (no flat cut-out lens): a gradient per row of crests
    const gl = nid('wl', u), gd = nid('wd', u);
    defs += `<linearGradient id="${gl}" x1="0" y1="0" x2="0" y2="1">${stops([[0, light, 1], [.45, light, .7], [1, light, 0]])}</linearGradient><linearGradient id="${gd}" x1="0" y1="0" x2="0" y2="1">${stops([[0, dark, .5], [.35, dark, 1], [1, dark, .1]])}</linearGradient>`;
    let x = -R() * lam * 2;
    while (x < w) {
      const pn = patch(x, d, t), fw = lam * (.35 + R() * 1.1) * (.65 + .7 * pn), gap = lam * (.15 + R() * 1.3) * (1.5 - pn);
      if (R() < .2 + .75 * pn) { // crests near the glitter path catch more light, fading off softly to the sides (no hard band)
        const yy = y + (R() - .5) * amp * 1.7, a = amp * (.55 + R() * .8) * (.55 + .75 * pn), sk = .3 + R() * .4, tl = (R() - .5) * a * .9, k = .45 + .8 * pn;
        const kq = gx != null ? Math.exp(-Math.pow((x + fw / 2 - gx) / (hwp * (.7 + R() * .6) + .01), 2)) * (1 - .6 * t) : 0;
        body += `<path d="M${f(x)} ${f(yy + a * .1)}q${f(fw * (sk + .08))} ${f(a * (1.3 + R() * .7))} ${f(fw)} ${f(tl)}q${f(-fw * (.92 - sk))} ${f(a * .35)} ${f(-fw)} ${f(-tl)}z" fill="url(#${gd})" opacity="${f(clamp(opD * (.6 + R() * .4) * k))}"/>`
          + `<path d="M${f(x)} ${f(yy)}q${f(fw * sk)} ${f(-a * (.95 + R() * .45))} ${f(fw)} ${f(tl)}q${f(-fw * (1 - sk) * (.9 + R() * .2))} ${f(-a * (.42 + R() * .25))} ${f(-fw)} ${f(-tl)}z" fill="${kq > .05 ? mix(light, L.keyColor, .5 * kq) : `url(#${gl})`}" opacity="${f(clamp(opL * (.6 + R() * .5) * k * (1 + .7 * kq)))}"/>`;
      }
      x += fw + gap;
    }
    d += (.8 + 6.4 * t * (.55 + sw * .8)) * (.55 + R() * .8); rows++;
  }
  // the glitter path under the sun or moon: a halo of soft blots, each row of its own width and offset, narrow at
  // the horizon and dying out unevenly towards the viewer (no straight edge), and broken glints over it
  if (gx != null) {
    const hd = nid('wg', u), gc = mix(L.keyColor, '#ffffff', L.time === 'dusk' ? .25 : .5), pk = clamp(.5 + L.key.power * .5) * (1 - .35 * el / 90);
    defs += `<radialGradient id="${hd}">${stops([[0, gc, 1], [.45, gc, .5], [1, gc, 0]])}</radialGradient>`;
    let q = .3, drift = 0;
    while (q < H) {
      const t = q / H, hw = pathHw(q); drift = drift * .7 + (R() - .5) * hw * .35;
      if (R() > .15) body += `<ellipse cx="${f(gx + drift)}" cy="${f(hz + q)}" rx="${f(hw * (1.1 + R() * 1.1))}" ry="${f((.5 + 2.4 * t) * (.7 + R() * .6))}" fill="url(#${hd})" opacity="${f(clamp(pk * (.34 * Math.pow(1 - t, 1.4) + .02) * (.45 + R() * .8)))}"/>`;
      q += (.45 + 2.4 * t) * (.7 + R() * .6);
    }
    // the glints: torn — the rows wander a little from side to side, some rows are weaker (a wave turned away),
    // a long glint often breaks into two pieces with a gap of dark water
    q = .5; let dg = 0;
    const lens = (x0, y0, len, th, op) => `<path d="M${f(x0)} ${f(y0)}q${f(len / 2)} ${f(-th)} ${f(len)} 0q${f(-len / 2)} ${f(th)} ${f(-len)} 0z" fill="${gc}" opacity="${f(clamp(op))}"/>`;
    while (q < H) {
      const t = q / H, hw = pathHw(q) * (.75 + R() * .5), n = R() < .1 * t ? 0 : 2 + Math.floor(R() * 3 + t * 2), fade = 1 - .7 * Math.pow(t, 1.3), rk = R() < .22 ? .4 : 1;
      dg = dg * .75 + (R() - .5) * hw * .4;
      for (let i = 0; i < n; i++) {
        const px = gx + dg + (R() + R() + R() - 1.5) / 1.5 * hw, len = (1.1 + R() * (1.8 + 10 * t)) * (.8 + sw * .5), th = .22 + 1.1 * t * (.4 + R() * .6), cen = 1 - Math.abs(px - gx) / (hw + .01) * .5;
        const op = (.45 + R() * .55) * fade * cen * (.55 + pk * .5) * rk, cut = len > 3 && R() < .5 ? .3 + R() * .4 : 0;
        if (!cut) body += lens(px - len / 2, hz + q, len, th, op);
        else { const gp = Math.min(len * .25, .6 + R() * 1.6), a = (len - gp) * cut, b = len - gp - a;
          body += lens(px - len / 2, hz + q, a, th, op) + lens(px - len / 2 + a + gp, hz + q + (R() - .5) * th, b, th * .85, op * (.7 + R() * .3)); }
      }
      q += (.5 + 3.4 * t) * (.8 + R() * .4);
    }
  }
  return `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}</g>`;
}

/**
 * foam(u, { x, y, w, seed, h, L }) — foam where something touches the water: a lace of white along the contact
 * line with the middle at (x, y) and the width w; h — its thickness. L tints it by the time of day.
 */
function foam(u, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 30, h = o.h || clamp(w * .05, .8, 3), R = rng(o.seed != null ? o.seed : 4), L = o.L;
  const lit = L ? scale(mix('#f6fcff', L.keyColor, .3), DIM[L.time] || 1) : '#f4fbff', sea = L ? L.pal.sea[1] : '#2f6478', sh = L ? L.shadowTint : '#12303c';
  const shade = mix(lit, mix(sea, sh, .35), .5), sx = L ? (lightSide(L, x, y).ux >= 0 ? 1 : -1) : -1;
  // the tone across the foam: lit at the end towards the source, greyer at the far end
  const tone = (px, k) => mix(shade, lit, clamp(k * (.62 + .38 * clamp(.5 + (px - x) / w * sx * 1.2))));
  const e = nid('fo', u), pad = h * 3 + 4, box = [x - w / 2 - pad, y - h * 2 - pad, w + 2 * pad, h * 4 + 2 * pad];
  // the foam lies in pieces of different length parted by gaps; each piece is one band with a lumpy top (clots of
  // foam grown into it, no separate bubbles) and a flatter bottom; its top catches the light; from it threads of lace
  // trail out over the water and break off
  const sp = smoothPath, e2 = nid('fl', u);
  let t = R() * .02, body = '', top = '', lace = '', dots = '';
  while (t < .98) {
    const lw = Math.max(.02, Math.min(1 - t, .06 + R() * R() * .34)), n = Math.max(4, Math.round(lw * w / Math.max(1.1, h * .9))), up = [], lo = [], ph = R() * 9, ph2 = R() * 9;
    for (let i = 0; i <= n; i++) {
      const q = i / n, xx = x - w / 2 + (t + q * lw) * w, env = Math.pow(Math.sin(Math.PI * clamp(t + q * lw, .02, .98)), .5) * Math.pow(Math.sin(Math.PI * q), .8);
      const lump = .7 + .14 * Math.sin(q * 9 + ph) + .1 * Math.sin(q * 21 + ph2) + (R() - .5) * .34;
      up.push([xx, y - h * (.15 + .85 * env * clamp(lump, .15, 1.2))]); lo.unshift([xx + (R() - .5) * .4, y + h * (.2 + .35 * env * (.6 + R() * .6))]);
    }
    const mx = x - w / 2 + (t + lw / 2) * w;
    body += `<path d="${sp(up.concat(lo), true)}" fill="${tone(mx, .5)}"/>`;
    // the lit top: the upper edge and the same edge let down by a part of the thickness
    top += `<path d="${sp(up.concat(up.slice().reverse().map(([px, py]) => [px, py + (y - py) * (.45 + R() * .2) + h * .08])), true)}" fill="${tone(mx, 1)}"/>`;
    // holes in the lace: the sea shows through the thicker pieces
    for (let k = 0, m = lw * w > h * 5 ? Math.floor(R() * (lw * w / (h * 4))) : 0; k < Math.min(m, 4); k++) { const hx = x - w / 2 + (t + (.15 + R() * .7) * lw) * w, hl = h * (.8 + R() * 1.6), ht = h * (.12 + R() * .14), hy = y + h * (.05 + R() * .15);
      top += `<path d="M${f(hx - hl / 2)} ${f(hy)}q${f(hl / 2)} ${f(-ht)} ${f(hl)} 0q${f(-hl / 2)} ${f(ht * 1.2)} ${f(-hl)} 0z" fill="${mix(sea, sh, .2)}" opacity="${f(.45 + R() * .3)}"/>`; }
    // lace: streaks of foam lying flat on the water before and behind the piece, tapered at both ends, in broken chains
    for (let k = 0; k < 1 + Math.floor(R() * 3); k++) {
      const behind = R() < .35, ly = y + (behind ? -h * (.5 + R() * .7) : h * (.55 + R() * 2.2)), lx = x - w / 2 + (t + R() * lw) * w;
      let cx0 = lx - w * (.02 + R() * .05);
      for (let j = 0, m = 1 + Math.floor(R() * 3); j < m; j++) {
        const ln = w * (.025 + R() * .09) * (behind ? .6 : 1), th = clamp(h * (.1 + R() * .16), .18, .8) * (behind ? .7 : 1), yy = ly + (R() - .5) * h * .3;
        lace += `<path d="M${f(cx0)} ${f(yy)}q${f(ln * .5)} ${f(-th)} ${f(ln)} ${f((R() - .5) * th)}q${f(-ln * .5)} ${f(th * .8)} ${f(-ln)} ${f(0)}z" fill="${tone(cx0, behind ? .6 : .8)}" opacity="${f(.3 + R() * .4)}"/>`;
        cx0 += ln + w * (.005 + R() * .025);
      }
    }
    t += lw + (R() < .25 ? .004 + R() * R() * .05 : -lw * (.25 + R() * .2)); // a gap, or the next piece overlaps this one
  }
  const fr = clamp(.5 / h, .14, .45);
  return `<defs>${edgeFilter(e, box, (o.seed || 4) + 17, clamp(h * .55, .5, 1.8), `${f(fr)} ${f(clamp(fr * 1.6, .25, .62))}`, .1)}${edgeFilter(e2, box, (o.seed || 4) + 29, clamp(h * .5, .4, 1.4), `${f(fr * 1.4)} ${f(fr * 1.4)}`, 0)}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y + h * .5)}" rx="${f(w * .5)}" ry="${f(h * .6)}" fill="${sh}" opacity=".18"/>`
    + `<g filter="url(#${e2})">${lace}${dots}</g><g filter="url(#${e})">${body}${top}</g>`;
}

/**
 * reflection(u, svgBody, { y, h, L, opacity, stretch, seed }) — the reflection of a thing in the water: `svgBody`
 * (the SVG of the thing as drawn above the water) mirrored straight down about the waterline y, h units deep,
 * blurred, torn by ripples, fading with depth; light things come out darker, dark ones lighter. Ids inside the
 * body are renamed, so the same body may also be drawn above.
 */
function reflection(u, body, o = {}) {
  const y = o.y || 0, h = o.h || 40, st = o.stretch || 1.15, op = o.opacity != null ? o.opacity : .6, R = rng(o.seed != null ? o.seed : 5), L = o.L;
  let b = body;
  for (const id of new Set([...body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))) { const n = nid('rf', u); b = b.split(`id="${id}"`).join(`id="${n}"`).split(`url(#${id})`).join(`url(#${n})`).split(`href="#${id}"`).join(`href="#${n}"`); }
  const fi = nid('rr', u), mk = nid('rm', u), mg = nid('rg', u), cl = nid('rc', u), wc = L ? L.pal.sea[1] : '#2e6a7c', [r0, g0, b0] = [1, 3, 5].map(i => parseInt(wc.slice(i, i + 2), 16) / 255 * .34);
  let gaps = ''; for (let q = 2 + R() * 2; q < h; q += 1.6 + q * .12 + R() * 2) gaps += `<rect x="-40" y="${f(y + q)}" width="280" height="${f(.5 + q * .035)}" fill="#000" opacity="${f(.35 + R() * .4)}"/>`;
  return `<defs><filter id="${fi}" filterUnits="userSpaceOnUse" x="-40" y="${f(y - 2)}" width="280" height="${f(h + 6)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.26" numOctaves="2" seed="${o.seed != null ? o.seed : 5}" result="n"/><feColorMatrix in="n" type="matrix" values="1 0 0 0 0  0 0 0 0 .5  0 0 1 0 0  0 0 0 1 0" result="m"/><feDisplacementMap in="SourceGraphic" in2="m" scale="3" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".7 1.1"/><feColorMatrix type="matrix" values=".66 0 0 0 ${f(r0)}  0 .66 0 0 ${f(g0)}  0 0 .66 0 ${f(b0)}  0 0 0 1 0"/></filter>`
    + linGrad(mg, 0, y, 0, y + h, [[0, '#fff', 1], [.5, '#fff', .6], [1, '#fff', 0]]) + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="-40" y="${f(y)}" width="280" height="${f(h)}"><rect x="-40" y="${f(y)}" width="280" height="${f(h)}" fill="url(#${mg})"/>${gaps}</mask><clipPath id="${cl}"><rect x="-40" y="${f(y)}" width="280" height="${f(h)}"/></clipPath></defs>`
    + `<g clip-path="url(#${cl})"><g mask="url(#${mk})" opacity="${f(op)}"><g filter="url(#${fi})"><g transform="translate(0 ${f(y * (1 + st))}) scale(1 ${f(-st)})">${b}</g></g></g></g>`;
}

/**
 * splash(u, { x, y, w, h, seed, L, wind }) — the water thrown up where a shot falls, at (x, y) on the surface, w wide
 * and h high. Water, not cotton: a translucent body and sheets that thin into jets and break into drops; no cap of
 * puffs. Front light: the side towards the source white, the far side grey-blue with the sea showing through;
 * against the light: the thick body darker, its edge towards the source bright and the thin sheets glowing through.
 * Three shapes by seed % 3: a column that bursts at the top into a crown of spikes; a low ring of jets round a crater
 * with a thin jet rising from its middle; a fan of sheets thrown aside by the wind (wind: its sign, default to the
 * right) with spray carried downwind. A churned ring and foam at the foot.
 */
function splash(u, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 16, h = o.h || 30, seed = o.seed != null ? o.seed : 0, R = rng(seed + 11), L = o.L || FLAT, v = ((seed % 3) + 3) % 3;
  const ls = lightSide(L, x, y - h / 2), back = ls.back, sx = Math.abs(ls.ux) > .06 ? Math.sign(ls.ux) : 1;
  const dim = o.L ? DIM[L.time] || 1 : 1, white = o.L ? scale(mix('#ffffff', L.keyColor, .3), .55 + .45 * dim) : '#f6fcff', sea = o.L ? L.pal.sea[1] : '#2f6478', glowC = mix(L.keyColor, '#ffffff', .45);
  const lit = back ? mix(white, glowC, .3) : white, shade = back ? mix(sea, white, .34) : mix(mix(sea, white, .5), L.shadowTint, .15);
  const far = back ? mix(lit, shade, .4) : shade; // a thin sheet on the far side: against the light it glows through
  const sm = (pts, closed) => { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
    return d + (closed ? 'Z' : ''); };
  const gid = nid('sg', u), bid = nid('sb', u), mid = nid('sm', u), cid = nid('sc', u), rid = nid('sr', u), pad = Math.max(w, h) * .8;
  const box = `filterUnits="userSpaceOnUse" x="${f(x - w * 2 - pad)}" y="${f(y - h * 1.4 - pad)}" width="${f(w * 4 + 2 * pad)}" height="${f(h * 1.6 + 2 * pad)}"`;
  const bw = w * .4;
  let defs = linGrad(gid, x + sx * bw, y, x - sx * bw, y, back ? [[0, lit, .95], [.14, mix(lit, shade, .45), .85], [.5, shade, .72], [1, mix(shade, sea, .35), .6]] : [[0, lit, .97], [.35, mix(lit, shade, .3), .9], [.7, shade, .8], [1, mix(shade, sea, .3), .68]])
    + edgeFilter(rid, [x - w * 2 - pad, y - h * 1.4 - pad, w * 4 + 2 * pad, h * 1.6 + 2 * pad], seed + 31, clamp(w * .12, .8, 2.6), `${f(clamp(2.2 / w, .12, .5))} ${f(clamp(1.6 / w, .1, .4))}`, 0)
    + `<filter id="${bid}" ${box}><feGaussianBlur stdDeviation="${f(clamp(w * .02, .15, .6))}"/></filter><filter id="${mid}" ${box}><feGaussianBlur stdDeviation="${f(clamp(w * .12, .8, 3))}"/></filter>` + softDot(cid);
  let veil = '', backS = '', body = '', hl = '', front = '', drops = '';
  const jet = (p0, c, p1, wd, op, col) => `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(c[0])} ${f(c[1])} ${f(p1[0])} ${f(p1[1])}" stroke="${col}" stroke-width="${f(wd)}" fill="none" stroke-linecap="round" opacity="${f(op)}"/>`;
  const bez = (p0, c, p1, t) => [(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1]];
  const taper = (p0, c, p1, w0, w1, op, col) => { const A = [], B = []; // a sheet of water thinning from w0 to w1 along a curve
    for (let i = 0; i <= 8; i++) { const t = i / 8, q = bez(p0, c, p1, t), dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]), l = Math.hypot(dx, dy) || 1, hw = lerp(w0, w1, Math.pow(t, .8)) / 2;
      A.push([q[0] - dy / l * hw, q[1] + dx / l * hw]); B.unshift([q[0] + dy / l * hw, q[1] - dx / l * hw]); }
    return `<path d="${sm(A.concat(B), true)}" fill="${col}" opacity="${f(op)}"/>`; };
  // a drop: drawn out along its flight (away from the burst), a rounded head and a tail; only big ones get a glint
  const drop = (p, r, op) => { const ax = p[0] - x, ay = p[1] - (y - h * .45), an = Math.atan2(ay, ax) * 180 / Math.PI + 90, el = 1 + R() * .7, c = (p[0] - x) * sx >= 0 ? lit : far;
    drops += `<path transform="translate(${f(p[0])} ${f(p[1])}) rotate(${f(an)})" d="M0 ${f(-r * el)}C${f(r * .5)} ${f(-r * el * .4)} ${f(r * .9)} ${f(r * .25)} 0 ${f(r)}C${f(-r * .9)} ${f(r * .25)} ${f(-r * .5)} ${f(-r * el * .4)} 0 ${f(-r * el)}Z" fill="${c}" opacity="${f(op)}"/>`;
    if (r > .7) drops += `<ellipse cx="${f(p[0] + ls.ux * r * .3)}" cy="${f(p[1] + ls.uy * r * .3)}" rx="${f(r * .28)}" ry="${f(r * .2)}" fill="#ffffff" opacity="${f(op * .7)}"/>`; };
  // a sheet from p0 to p1 through c: lit if it leans to the source's side; a glint on its lit edge; drops beyond its end
  const sheet = (p0, c, p1, w0, op, nd, toFront = true) => {
    // the sheet does not run out into a needle: it ends blunt, in a ragged clot of water that breaks into drops
    const toLight = (p1[0] - p0[0]) * sx > 0, col = toLight ? lit : far, w1 = w0 * (.25 + R() * .3), dx = p1[0] - c[0], dy = p1[1] - c[1], l = Math.hypot(dx, dy) || 1;
    let s = taper(p0, c, p1, w0, w1, op, col) + `<ellipse cx="${f(p1[0] + dx / l * w1 * .3)}" cy="${f(p1[1] + dy / l * w1 * .3)}" rx="${f(w1 * (.7 + R() * .5))}" ry="${f(w1 * (.5 + R() * .3))}" transform="rotate(${f(Math.atan2(dy, dx) * 180 / Math.PI)} ${f(p1[0])} ${f(p1[1])})" fill="${col}" opacity="${f(op * .9)}"/>`;
    if (toLight && R() > .45) s += jet(bez(p0, c, p1, .2), bez(p0, c, p1, .55), bez(p0, c, p1, .8), clamp(w0 * .16, .15, .5), .45, '#ffffff');
    for (let j = 1; j <= nd; j++) drop([p1[0] + dx / l * w * .09 * j + (R() - .5) * w * .05, p1[1] + dy / l * w * .09 * j + h * .025 * j * j], clamp(w * (.045 - .008 * j) * (.7 + R() * .6), .2, 1.2), .55 + R() * .35);
    if (toFront) front += s; else backS += s;
  };
  // a ragged mass of thrown water: a closed outline of uneven lobes round (cx, cy), not a ball
  const mass = (cx, cy, rx, ry, op = .92) => { const n = 9 + Math.floor(R() * 4), pts = [], a0 = R() * 6.3;
    for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI * 2, k = (i % 2 ? .62 : .9) + R() * .4; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (Math.sin(a) > 0 ? .7 : 1)]); }
    return `<path d="${smoothPath(pts, true)}" fill="url(#${gid})" opacity="${f(op)}"/>`; };
  let top;
  if (v === 0) { // a column that bursts at the top into a crown of spikes of different length
    const ty = y - h * .58, n = 8, Lp = [], Rp = [], cx = t => x + (R() - .5) * w * .02 + sx * w * .03 * t;
    const hw = t => w * (.17 + .07 * t + .12 * Math.pow(t, 5)) * (.92 + R() * .16);
    for (let i = 0; i <= n; i++) { const t = i / n, yy = y - (y - ty) * t, c = cx(t), d = hw(t); Lp.push([c - d, yy]); Rp.unshift([c + d, yy]); }
    const tw = w * .36, rim = [[x - tw * .7, ty - h * .03], [x - tw * .25, ty - h * .07], [x + tw * .2, ty - h * .05], [x + tw * .65, ty - h * .02]];
    body += `<path d="${sm(Lp.concat(rim, Rp), true)}" fill="url(#${gid})"/>`;
    veil += `<path d="${sm(Lp.map(p => [p[0] - w * .1, p[1]]).concat(rim.map(p => [p[0], p[1] - h * .06]), Rp.map(p => [p[0] + w * .1, p[1]])), true)}" fill="${lit}" opacity=".16"/>`;
    const edge = sx > 0 ? Rp.slice().reverse() : Lp; hl += `<path d="${sm(edge.slice(1, n).map(p => [p[0] - sx * w * .035, p[1]]))}" stroke="#ffffff" stroke-width="${f(clamp(w * .03, .25, .8))}" fill="none" opacity="${back ? .85 : .65}" stroke-linecap="round"/>`;
    for (let i = 0; i < 2; i++) { const t0 = .05 + R() * .3, t1 = t0 + .25 + R() * .3, off = sx * (.15 + R() * .6), p0 = [cx(t0) + off * hw(t0), y - (y - ty) * t0], p1 = [cx(t1) + off * hw(t1), y - (y - ty) * t1];
      hl += jet(p0, [lerp(p0[0], p1[0], .5), lerp(p0[1], p1[1], .5)], p1, clamp(w * (.015 + R() * .02), .15, .5), .3 + R() * .3, '#ffffff'); }
    const m = 7;
    for (let k = 0; k < m; k++) { // the spikes fan out from the rim; the middle ones the longest, none alike; they bend over at the ends
      const a = lerp(-1.25, 1.25, k / (m - 1)) + (R() - .5) * .22, b = [x + Math.sin(a) * tw * .75, ty + Math.abs(Math.sin(a)) * h * .05], len = h * (.14 + .3 * Math.pow(Math.cos(a), 2)) * (.6 + R() * .7);
      const tip = [b[0] + Math.sin(a) * len * .95, b[1] - Math.cos(a) * len + len * .3 * Math.sin(a) * Math.sin(a)], c = [b[0] + Math.sin(a) * len * .3, b[1] - Math.cos(a) * len * .8 - len * .12];
      sheet(b, c, tip, w * (.12 + R() * .1), .85, 1 + Math.floor(R() * 3), Math.abs(a) > .5 || R() > .5);
    }
    for (let i = 0; i < 4; i++) { const side = i % 2 ? 1 : -1, st = [x + side * tw * (.45 + R() * .3), ty + h * .02], en = [st[0] + side * w * (.4 + R() * .35), y - h * (.08 + R() * .2)];
      sheet(st, [st[0] + side * w * .32, ty - h * (.05 + R() * .06)], en, w * (.14 + R() * .08), .7, 2, true); }
    body += mass(x + sx * w * .03, ty - h * .02, tw * .85, h * .09); // the burst at the top of the column
    top = [x, ty - h * .15];
  } else if (v === 1) { // a low ring of jets round a crater, and a thin jet rising from its middle with a drop on it
    const ring = [];
    for (let i = 0; i < 13; i++) { const a = (i / 13) * Math.PI * 2 + R() * .3, ex = Math.cos(a), ez = Math.sin(a); ring.push({ ex, ez, hh: h * (.22 + R() * .3) * (ez > 0 ? 1 : .8) }); }
    const draw = (r, fr) => { const b = [x + r.ex * w * .32, y + r.ez * w * .07], t = [x + r.ex * w * (.7 + R() * .35), y - r.hh * .75 + r.ez * w * .08], c = [lerp(b[0], t[0], .25), y - r.hh];
      sheet(b, c, t, w * (.14 + R() * .08), fr ? .88 : .55, 1 + Math.floor(R() * 2), fr); };
    ring.filter(r => r.ez <= 0).forEach(r => draw(r, false));
    const md = sm([[x - w * .46, y], [x - w * .3, y - h * .12], [x - w * .08, y - h * .2], [x + w * .12, y - h * .19], [x + w * .32, y - h * .1], [x + w * .46, y]], false) + 'Z';
    body += `<path d="${md}" fill="url(#${gid})"/>`; veil += `<ellipse cx="${f(x)}" cy="${f(y - h * .18)}" rx="${f(w * .6)}" ry="${f(h * .22)}" fill="${lit}" opacity=".14"/>`;
    ring.filter(r => r.ez > 0).forEach(r => draw(r, true));
    const j0 = [x + (R() - .5) * w * .06, y - h * .12], jt = [x + sx * w * .05 + (R() - .5) * w * .06, y - h * (.82 + R() * .12)];
    front += taper(j0, [lerp(j0[0], jt[0], .3), lerp(j0[1], jt[1], .55)], jt, w * .16, w * .05, .9, mix(lit, shade, .25)) + jet([j0[0] + sx * w * .03, j0[1] - h * .05], [jt[0] + sx * w * .03, lerp(j0[1], jt[1], .5)], [jt[0] + sx * w * .015, jt[1] + h * .04], clamp(w * .02, .15, .45), .7, '#ffffff');
    drop([jt[0], jt[1] - h * .06], clamp(w * .07, .4, 1.6), .9); drop([jt[0] + sx * w * .02, jt[1] - h * .15], clamp(w * .04, .25, 1), .7);
    body += mass(x, y - h * .12, w * .5, h * .12, .85); // the heaped water over the crater
    top = [x, y - h * .45];
  } else { // a fan of sheets thrown aside by the wind, the spray carried on downwind
    const wd = o.wind ? Math.sign(o.wind) : 1, m = 8;
    const md = sm([[x - wd * w * .3, y], [x - wd * w * .14, y - h * .1], [x + wd * w * .1, y - h * .16], [x + wd * w * .36, y - h * .08], [x + wd * w * .5, y]], false) + 'Z';
    body += `<path d="${md}" fill="url(#${gid})"/>`;
    for (let k = 0; k < m; k++) {
      const q = k / (m - 1), a = wd * (lerp(-.2, 1.05, q) + (R() - .5) * .16), len = h * (1.02 - .5 * q) * (.75 + R() * .35), b = [x + wd * w * lerp(-.18, .3, q) + (R() - .5) * w * .08, y - h * .03];
      const tip = [b[0] + Math.sin(a) * len, b[1] - Math.cos(a) * len * .92 + len * .2 * Math.sin(a) * Math.sin(a)], c = [b[0] + Math.sin(a) * len * .2, b[1] - Math.cos(a) * len * .78 - len * .1];
      sheet(b, c, tip, w * (.22 + R() * .16) * (1 - .35 * q), k % 3 === 1 ? .62 : .86, 1 + Math.floor(R() * 2), k % 3 !== 1);
      if (k < 4) veil += jet(tip, [tip[0] + wd * w * .35, tip[1] - h * .05], [tip[0] + wd * w * (.7 + R() * .6), tip[1] + h * (.08 + R() * .18)], clamp(w * (.1 + R() * .1), .7, 3.5), .22, lit);
    }
    for (let i = 0; i < 16; i++) drop([x + wd * w * (.3 + R() * 1.4), y - h * (.25 + R() * .7)], clamp(w * (.012 + R() * .028), .2, .8), .35 + R() * .45);
    body += mass(x + wd * w * .1, y - h * .14, w * .42, h * .14, .9); // the heap at the root of the fan
    top = [x + wd * w * .3, y - h * .6];
  }
  for (let i = 0; i < 9 + seed % 5; i++) { const a = (R() - .5) * 2.8, dd = w * (.4 + R() * R() * 1.1); drop([top[0] + Math.sin(a) * dd, top[1] - Math.cos(a) * dd * .7 + R() * h * .3], clamp(w * (.012 + R() * R() * .05), .2, 1.1), .4 + R() * .45); }
  const rw = w * (v === 1 ? .85 : .62);
  // against the light the spray glows through on the source's side; with light from the front only a faint mist
  return `<defs>${defs}</defs><ellipse cx="${f(top[0] + sx * w * .3)}" cy="${f(top[1] + h * .1)}" rx="${f(w * (back ? 1.1 : .8))}" ry="${f(h * .42)}" fill="url(#${cid})" opacity="${f(back ? .32 : .1)}"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y + .6)}" rx="${f(rw * 1.25)}" ry="${f(Math.max(.8, rw * .22))}" fill="${mix(sea, L.shadowTint, .3)}" opacity=".45"/>` // the churned dark ring at the foot
    + `<g filter="url(#${mid})">${veil}</g><g filter="url(#${rid})"><g filter="url(#${bid})">${backS}</g>${body}${hl}<g filter="url(#${bid})">${front}</g></g>${drops}`
    + foam(u, { x, y: y + .4, w: rw * 2.1, h: clamp(w * .1, .8, 2.4), seed: seed + 5, L: o.L });
}

/** fog(u, L, { y, h, density, seed }) — a band of fog from y down h units: dense in the middle, uneven, with soft
 *  swells. density 0..1 (default L.haze). The far plan sinks in it. */
function fog(u, L, o = {}) {
  const y = o.y != null ? o.y : 100, h = o.h || 40, dn = o.density != null ? o.density : L.haze, R = rng(o.seed != null ? o.seed : 6), col = mix(L.pal.fog, L.keyColor, .2), g = nid('fg', u), b = nid('fb', u);
  let out = `<defs>${linGrad(g, 0, y, 0, y + h, [[0, col, 0], [.4, col, dn * .75], [.68, col, dn * .62], [1, col, 0]])}<radialGradient id="${b}"><stop offset="0" stop-color="${col}" stop-opacity="${f(dn * .5)}"/><stop offset=".6" stop-color="${col}" stop-opacity="${f(dn * .2)}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><rect x="0" y="${f(y)}" width="${W}" height="${f(h)}" fill="url(#${g})"/>`;
  for (let i = 0; i < 6; i++) out += `<ellipse cx="${f(R() * W)}" cy="${f(y + h * (.3 + R() * .4))}" rx="${f(26 + R() * 50)}" ry="${f(h * (.16 + R() * .2))}" fill="url(#${b})"/>`;
  return out;
}

/**
 * smoke(u, L, { x, y, w, h, seed, wind, opacity, glow }) — smoke rising from its source at (x, y): w — its width at
 * the top, h — how high it rises, wind -1..1 — how far the top is carried sideways. A narrow dense stem at the
 * source grows into billows that drift downwind and break into clumps at the top, thinning out upwards; every billow
 * is lit from the source's side and above, in shadow below; against the light it glows at the edge towards the
 * source. glow: { color, power } — lit from inside by the fire at its foot.
 */
function smoke(u, L, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 24, h = o.h || 50, wind = o.wind || 0, seed = o.seed != null ? o.seed : 5, R = rng(seed), P = L.pal;
  const at = t => [x + wind * h * .7 * Math.pow(t, 1.5) + Math.sin(t * 4.2 + seed) * w * .07 * t, y - h * Math.pow(t, .92)], wd = t => w * (.09 + .42 * Math.pow(t, .85));
  // the puffs overlap by at least a third, so the union is one body with a lobed edge, never a string of beads
  const cs = [], dw = wind >= 0 ? 1 : -1;
  for (let t = 0; t <= 1;) {
    const [px, py] = at(t), big = R(), r = wd(t) * (.5 + Math.pow(big, .6) * .48);
    cs.push([px + (R() - .5) * wd(t) * .5 * clamp(t * 4), py, r, t < .15 ? 1.45 : t > .8 ? .74 + R() * .16 : .82 + R() * .24]);
    if (t > .32 && R() > .2) { const side = R() < .5 + wind * .35 ? 1 : -1, r2 = r * (.4 + R() * .45); // a swell on the side, mostly downwind
      cs.push([px + side * r * (.55 + R() * .35), py + r * (R() - .3) * .6, r2, .8 + R() * .25]); }
    t += Math.max(.035, r * (.5 + R() * .4) / h); // the next billow overlaps this one by a third to a half
  }
  const [tx, ty] = at(1);
  // the top leans and spreads downwind in two or three swells that still touch the column
  for (let i = 0; i < 2 + seed % 2; i++) { const r = wd(1) * (.42 - i * .08 + R() * .12); cs.push([tx + dw * wd(1) * (.45 + i * .38 + R() * .12), ty + wd(1) * (.08 + i * .1 + (R() - .5) * .2), r, .62 + R() * .2]); }
  const ls = L.point ? Object.assign({}, L.at(x, y - h / 2), { back: L.at(x, y - h / 2).dz < -.2 }) : lightSide(L, x, y - h / 2), back = ls.back, k = DIM[L.time] || 1;
  const lit = back ? mix(L.keyColor, '#ffffff', .2) : scale(mix(P.smoke, L.keyColor, .45), .9 + k * .25), shade = mix(P.smoke, L.shadowTint, back ? .45 : .62);
  let inner = '', defs = '';
  if (o.glow) { const g = nid('sg', u), c = o.glow.color || '#ff9a3a', p = o.glow.power != null ? o.glow.power : .7; defs += radGrad(g, x, y, Math.max(w, h * .6), [[0, c, p], [.4, c, p * .4], [1, c, 0]]); inner = `<rect x="${f(x - w - h)}" y="${f(y - h * 1.2)}" width="${f(2 * (w + h))}" height="${f(h * 1.4)}" fill="url(#${g})"/>`; }
  const op = o.opacity != null ? o.opacity : back ? .86 : .97;
  return (defs ? `<defs>${defs}</defs>` : '') + billow(u, L, cs, { lit, mid: mix(lit, shade, back ? .6 : .42), shade, rim: mix(lit, '#ffffff', .3), knob: mix(lit, '#ffffff', .25) },
    { dir: { ux: ls.ux * .6, uy: ls.uy * .6 - .75 }, back, capFlat: .4, shadeOp: back ? .72 : .7, crease: back ? .5 : .75, creaseMin: .5, creaseSoft: .36, fade: [x, y, tx, ty - wd(1) * .5, 1, .3], seed: seed + 7, disp: 2.6, freq: '0.06 0.07', blur: .5, opacity: op, inner, seam: clamp(w * .06, .6, 2.6) });
}

/**
 * fire(u, { x, y, w, h, seed, glow, wind, fuel, pool }) — a fire standing on (x, y), w wide and h high. Tongues of
 * different length and lean, bent by the wind (wind -1..1, the same sign as the smoke's), in layers drawn each on its
 * own: a dark red mantle with a ragged edge, an orange body, a yellow core, a pale heart low down; tongues torn off
 * above, sparks downwind. Its own light round it and a warm pool on the support under it (glow: false — no light;
 * pool: false — no pool). fuel: true — burning planks under it on a charred patch.
 */
function fire(u, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 16, h = o.h || 26, seed = o.seed != null ? o.seed : 3, R = rng(seed), wind = o.wind || 0;
  const lean0 = wind * .45 + (R() - .5) * .16, peak = .5 + (R() - .5) * .35 + wind * .12;
  // a tongue: a wide root, a waist pushed aside by `curl` and a thin tip bent back the other way — an S, not a drop
  const tongue = (cx, by, bw, th, lean, curl) => { const tx = cx + lean * th, ty = by - th, a = .7 + R() * .6, b = .7 + R() * .6;
    const mx = cx + lean * th * .45 + curl, my = by - th * (.45 + .1 * a), wl = bw * (.34 + .14 * b), wr = bw * (.34 + .14 * a), tb = -curl * .35;
    return `M${f(cx - bw)} ${f(by)}C${f(cx - bw * (1.05 + .25 * a))} ${f(by - th * .2)} ${f(mx - wl * 1.5)} ${f(my + th * .14)} ${f(mx - wl)} ${f(my)}`
      + `C${f(mx - wl * .6)} ${f(my - th * .16)} ${f(tx + tb - bw * .12)} ${f(ty + th * .22)} ${f(tx)} ${f(ty)}`
      + `C${f(tx + tb + bw * .1)} ${f(ty + th * .2 * b)} ${f(mx + wr * .7)} ${f(my - th * .14)} ${f(mx + wr)} ${f(my)}`
      + `C${f(mx + wr * 1.5)} ${f(my + th * .14)} ${f(cx + bw * (1.05 + .25 * b))} ${f(by - th * .2)} ${f(cx + bw)} ${f(by)}Z`; };
  // one layer: its own count and places of tongues, the tallest near the peak (off the middle), none alike
  // one layer: its own count and places of tongues, the tallest near the peak (off the middle), none alike; its colour
  // runs up the tongues from the hot base to the cooler tips, which thin out (no flat fill, no hard tip)
  const layer = (span, h0, h1, n, cols, op = 1) => { let s = ''; const g = nid('fl', u), top = y - h * h1 * 1.1;
    for (let i = 0; i < n; i++) { const t = (i + .5 + (R() - .5) * .7) / n, env = clamp(1 - Math.abs(t - peak) * 1.6, .12, 1), th = h * lerp(h0, h1, env * (.5 + R() * .6)), bw = w * span / n * (.62 + R() * .5);
      s += `<path d="${tongue(x + (t - .5) * w * span, y + (R() - .3) * h * .02, bw, th, lean0 + (R() - .5) * .34, (R() - .5) * bw * 1.4)}"/>`; }
    return `<defs>${linGrad(g, 0, y + h * .02, 0, top, cols)}</defs><g fill="url(#${g})" opacity="${op}">${s}</g>`; };
  let wisps = '';
  for (let i = 0; i < 2 + seed % 2; i++) { const by = y - h * (.5 + R() * .3), th = h * (.1 + R() * .14); wisps += `<path d="${tongue(x + (peak - .5) * w + lean0 * h * .55 + (R() - .5) * w * .35, by, w * (.035 + R() * .035), th, lean0 * 1.2, 0)}" fill="${i % 2 ? '#e2581a' : '#9a240a'}" opacity="${f(.4 + R() * .3)}"/>`; }
  const e1 = nid('fe', u), e2 = nid('ff', u), e3 = nid('fh', u), e0 = nid('fs', u), hb = nid('fb', u), box = [x - w * 1.4, y - h * 1.9, w * 2.8, h * 2.1];
  const flames = `<defs>${edgeFilter(e0, box, seed + 8, clamp(w * .18, 1.4, 3), '0.07 0.05', clamp(w * .07, .8, 2.2))}${edgeFilter(e1, box, seed + 2, clamp(w * .16, 1.2, 3), '0.1 0.06', .4)}${edgeFilter(e2, box, seed + 5, clamp(w * .09, .8, 1.8), '0.12 0.07', clamp(w * .018, .3, .7))}${edgeFilter(e3, box, seed + 6, clamp(w * .06, .6, 1.4), '0.14 0.08', clamp(w * .03, .4, 1.1))}${blurFilter(hb, box, f(clamp(w * .1, .8, 3)))}</defs>`
    // soot: the tips of the flame go over into dark, soft smoke above the fire
    + `<g filter="url(#${e0})">${layer(.9, .55, 1.3, 4 + seed % 2, [[0, '#2a1810', 0], [.42, '#2a1810', 0], [.64, '#2e1d16', .62], [.86, '#3a2c26', .32], [1, '#3a2c26', 0]])}</g>`
    // the mantle: dark red at the edge of the fire, thinning to its tips
    + `<g filter="url(#${e1})">${layer(1.05, .38, 1, 5 + seed % 3, [[0, '#c4300c', .95], [.5, '#a2240a', .88], [.82, '#701a0a', .55], [1, '#5a140a', .1]])}${wisps}</g>`
    // the body and the core: orange tongues yellow at the root, a yellow core, a white heart low down glowing out
    + `<g filter="url(#${e2})">${layer(.86, .3, .78, 4 + seed % 3, [[0, '#ffb43a', 1], [.4, '#f47020', .96], [.78, '#d8460e', .75], [1, '#c0360c', .15]])}</g>`
    + `<g filter="url(#${e3})">${layer(.66, .2, .52, 3 + seed % 2, [[0, '#fff2a8', 1], [.5, '#ffc640', .95], [1, '#ff9a24', .2]])}${layer(.42, .1, .28, 3, [[0, '#ffffff', 1], [.55, '#fff4c4', .9], [1, '#ffe07a', .2]])}</g>`
    + `<ellipse cx="${f(x + (peak - .5) * w * .3)}" cy="${f(y - h * .1)}" rx="${f(w * .3)}" ry="${f(h * .13)}" fill="#fffbe6" opacity=".7" filter="url(#${hb})"/>`;
  let sparks = '';
  for (let i = 0; i < 9 + seed % 5; i++) { const sx = x + (R() - .5) * w * 1.3 + wind * h * .4, sy = y - h * (.65 + R() * .85), ks = clamp(h / 28, .35, 1.2), l = (.5 + R() * 1.4) * ks, a = (R() - .5) * .8 + wind * .5; sparks += `<path d="M${f(sx)} ${f(sy)}l${f(Math.sin(a) * l)} ${f(-Math.cos(a) * l)}" stroke="${R() > .5 ? '#ffd98a' : '#ff9a3a'}" stroke-width="${f((.2 + R() * .3) * Math.sqrt(ks))}" stroke-linecap="round" opacity="${f(.45 + R() * .5)}"/>`; }
  let under = '', backF = '', frontF = '';
  if (o.fuel) { // a charred patch and burning planks: black, glowing along the edges the fire licks, embers in the cracks
    const cg = nid('fc', u), pg = nid('fp', u), th = clamp(w * .11, 1, 4);
    under += `<defs><radialGradient id="${cg}">${stops([[0, '#120a06', .8], [.6, '#1e120c', .5], [1, '#1e120c', 0]])}</radialGradient>${linGrad(pg, 0, -th / 2, 0, th / 2, [[0, '#b4501c'], [.22, '#4a2414'], [1, '#170c07']])}</defs>`
      + `<ellipse cx="${f(x)}" cy="${f(y + h * .02)}" rx="${f(w * 1.15)}" ry="${f(w * .34)}" fill="url(#${cg})"/>`;
    const k = 4;
    for (let i = 0; i < k; i++) {
      const cx = x + (i - (k - 1) / 2) / k * w * .75 + (R() - .5) * w * .15, cy = y + (i % 2 ? -h * .015 : h * .02) + (R() - .5) * h * .02, len = w * (.55 + R() * .35), ang = (R() - .5) * 30 + (i % 2 ? 16 : -12);
      let p = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(ang)})"><rect x="${f(-len / 2)}" y="${f(-th / 2)}" width="${f(len)}" height="${f(th)}" rx="${f(th * .3)}" fill="url(#${pg})"/>`
        + `<path d="M${f(-len * .38)} ${f(-th * .42)}H${f(len * (.2 + R() * .2))}" stroke="#ff8a2a" stroke-width="${f(th * .2)}" stroke-linecap="round" opacity=".85"/>`;
      for (let j = 0; j < 3; j++) { const q = (R() - .5) * len * .8; p += `<path d="M${f(q)} ${f(-th * .3)}l${f((R() - .5) * th * .5)} ${f(th * .55)}" stroke="${R() > .5 ? '#ff9a30' : '#0e0704'}" stroke-width="${f(th * .12)}" stroke-linecap="round" opacity=".8"/>`; }
      p += `<path d="M${f(len / 2 - th * .5)} ${f(-th / 2)}h${f(th * .5)}v${f(th)}h${f(-th * .5)}Z" fill="#0e0704" opacity=".7"/></g>`;
      if (i === 2) frontF += p; else backF += p;
    }
  }
  const r = Math.max(w, h);
  return (o.glow === false ? '' : localGlow(u, { x, y: y - h * .42, radius: r * 2.1, color: '#ff9a3a', power: .6 }, { core: false })
      + (o.pool === false ? '' : localGlow(u, { x, y: y + h * .03, radius: r * 1.7, color: '#ff8a30', power: .7 }, { squash: .32, core: false })))
    + under + backF + flames + frontF + sparks;
}

/**
 * muzzleFlash(u, { x, y, dir, len, seed, smoke, glow }) — the flash of a gun at the muzzle (x, y) along `dir`
 * (degrees: 0 — to the right, 90 — down, as SVG rotate), `len` units long: a cone of fire along the bore with a
 * white heart, tongues of different length, sparks ahead, smoke lit from inside. Three shapes by seed % 3: a long
 * lance, a short wide burst, a forked flame with side jets at the muzzle. smoke: false, glow: false to drop them.
 */
function muzzleFlash(u, o = {}) {
  const x = o.x || 0, y = o.y || 0, dir = o.dir || 0, Ln = o.len || 30, seed = o.seed != null ? o.seed : 0, v = ((seed % 3) + 3) % 3, R = rng(seed + 21);
  // tips: [x, y] of the tongues in the gun's own axes (x along the bore), from the upper side to the lower one
  const tips = v === 0 ? [[.78, -.1], [1, .01], [.84, .09]] : v === 1 ? [[.58, -.27], [.74, -.1], [.8, .06], [.6, .25]] : [[1, -.2], [.62, -.02], [.86, .17]];
  const w0 = Ln * .035, wM = Ln * (v === 0 ? .1 : v === 1 ? .24 : .15), xs = Ln * (v === 1 ? .34 : .3);
  const shape = (k, kw) => {
    const T = tips.map(([a, b]) => [a * Ln * k * (.94 + R() * .1), b * Ln * kw]), wm = wM * kw, s = xs * k;
    let d = `M0 ${f(-w0 * kw)}Q${f(s * .45)} ${f(-wm * 1.08)} ${f(s)} ${f(-wm)}Q${f((s + T[0][0]) / 2)} ${f(Math.min(-wm, T[0][1]) * 1.02)} ${f(T[0][0])} ${f(T[0][1])}`;
    for (let i = 0; i + 1 < T.length; i++) { const a = T[i], b = T[i + 1], vx = Math.min(a[0], b[0]) * (.6 + R() * .12), vy = (a[1] + b[1]) / 2; d += `Q${f(a[0] * .82)} ${f(a[1] + (vy - a[1]) * .8)} ${f(vx)} ${f(vy)}Q${f(b[0] * .82)} ${f(vy + (b[1] - vy) * .2)} ${f(b[0])} ${f(b[1])}`; }
    const z = T[T.length - 1]; return d + `Q${f((s + z[0]) / 2)} ${f(Math.max(wm, z[1]) * 1.02)} ${f(s)} ${f(wm)}Q${f(s * .45)} ${f(wm * 1.08)} 0 ${f(w0 * kw)}Z`;
  };
  const g1 = nid('z1', u), g2 = nid('z2', u), e = nid('ze', u), se = nid('zs', u), sg = nid('zg', u), a = dir * Math.PI / 180, upx = -Math.sin(a), upy = -Math.cos(a); // screen "up" in the gun's axes
  let jets = '';
  if (v === 2) for (const sgn of [-1, 1]) jets += `<path d="M${f(Ln * .02)} ${f(sgn * w0)}Q${f(Ln * .1)} ${f(sgn * Ln * .08)} ${f(Ln * (.1 + R() * .05))} ${f(sgn * Ln * (.2 + R() * .06))}Q${f(Ln * .16)} ${f(sgn * Ln * .07)} ${f(Ln * .12)} ${f(sgn * w0)}Z" fill="url(#${g2})" opacity=".9"/>`;
  let sparks = '';
  for (let i = 0; i < 7 + seed % 4; i++) { const r = Ln * (.5 + R() * .75), an = (R() - .5) * (v === 1 ? 1 : .55), l = Ln * (.03 + R() * .06); sparks += `<path d="M${f(Math.cos(an) * r)} ${f(Math.sin(an) * r)}l${f(Math.cos(an) * l)} ${f(Math.sin(an) * l)}" stroke="${R() > .4 ? '#ffe2a0' : '#ff9a3a'}" stroke-width="${f(Ln * (.008 + R() * .012))}" stroke-linecap="round" opacity="${f(.5 + R() * .45)}"/>`; }
  // smoke pushed out round the flame: small puffs at its sides, larger ones ahead, more of it on the upper side
  let puffs = '';
  if (o.smoke !== false) { // one billow: puffs overlap along both sides of the flame, close ahead of it and rise a little
    const reach = Math.max(...tips.map(t => t[0])) * Ln, P = (px, py, r) => { puffs += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r)}"/>`; };
    for (const side of [-1, 1]) for (let j = 0; j < 6; j++) { const t = j / 5; P(Ln * .16 + reach * .78 * t + (R() - .5) * Ln * .04 + upx * Ln * .08 * t, side * wM * (.5 + .8 * t) + upy * Ln * .08 * t, Ln * (.065 + .065 * t) * (.85 + R() * .4)); }
    for (let j = 0; j < 5; j++) { const an = (j - 2) * (v === 1 ? .26 : .15) + (R() - .5) * .08, rr = reach * (.86 + R() * .14); P(Math.cos(an) * rr + upx * Ln * .08, Math.sin(an) * rr + upy * Ln * .08, Ln * (.11 + R() * .05)); }
    for (let j = 0; j < 3; j++) { const t = .5 + j * .22, q = wM / Ln + .1 + j * .05; P(reach * t + upx * Ln * q, upy * Ln * q, Ln * (.1 + R() * .04)); }
    puffs = `<g filter="url(#${se})" fill="url(#${sg})" opacity=".8">${puffs}</g>`;
  }
  const box = [-Ln * .5, -Ln * .8, Ln * 2.2, Ln * 1.6];
  return (o.glow === false ? '' : localGlow(u, { x: x + Math.cos(a) * Ln * .32, y: y + Math.sin(a) * Ln * .32, radius: Ln * 1.5, color: '#ffc070', power: .8 }, { core: false }))
    + `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(dir)})"><defs>${linGrad(g1, 0, 0, Ln, 0, [[0, '#fff3c0', 1], [.22, '#ffc040', .96], [.55, '#ff7a1e', .85], [.85, '#d8380c', .55], [1, '#a82408', .2]])}${linGrad(g2, 0, 0, Ln * .8, 0, [[0, '#fffbe8', 1], [.4, '#ffe07a', .98], [.8, '#ffab32', .8], [1, '#ff8a22', .35]])}`
    + radGrad(sg, Ln * .45, 0, Ln * .95, [[0, '#ffe0a8', .95], [.25, '#e8b888', .92], [.55, '#b0a59a', .85], [1, '#857f7a', .6]]) + edgeFilter(e, box, seed + 4, 1.6, '0.1 0.08', .3) + edgeFilter(se, box, seed + 9, 2.6, '0.07 0.07', .7) + `</defs>`
    + `${puffs}<g filter="url(#${e})"><path d="${shape(1, 1)}" fill="url(#${g1})"/>${jets}<path d="${shape(.74, .62)}" fill="url(#${g2})"/><path d="M0 ${f(-w0 * .85)}Q${f(Ln * .2)} ${f(-w0 * 1.9)} ${f(Ln * (v === 1 ? .34 : .46))} 0Q${f(Ln * .2)} ${f(w0 * 1.9)} 0 ${f(w0 * .85)}Z" fill="#fffdf2"/></g>${sparks}</g>`;
}

/**
 * deck(u, L, { horizon, top, bottom, vx, seed, kind, plank, wet }) — a deck in perspective from the line y = top
 * down to `bottom`: the planks run from the viewer to the vanishing point (vx, horizon), wider and stronger near
 * the viewer; seams, butt joints with nails, fibre; lighter and hazier far away. kind — the material (pine-deck),
 * plank — the plank's width at the bottom edge (22), wet — a streak of light under the source.
 */
function deck(u, L, o = {}) {
  const hz = o.horizon != null ? o.horizon : L.cam.horizon, top = o.top != null ? o.top : hz + 30, bot = o.bottom || 280, vx = o.vx != null ? o.vx : L.cam.cx, kind = o.kind || 'pine-deck', pwd = o.plank || 22, R = rng(o.seed != null ? o.seed : 8);
  const X = (xb, y) => vx + (xb - vx) * (y - hz) / (bot - hz), sT = (top - hz) / (bot - hz), d = L.at(100, (top + bot) / 2);
  // the deck looks up: its tone follows the height of the light; a lamp lights a pool round its foot (below)
  const I = L.point ? -.2 : clamp(-d.dy * .8 + .08, -.2, .9);
  const id = nid('dk', u), cid = nid('dc', u), far = mix(L.tone(kind, I, 100, top), L.pal.sky[3], clamp(L.haze * .4)), near = L.tone(kind, I - .2, 100, bot), seam = mix(L.tone(kind, -.1, 100, bot), '#1c0f08', .4), lit = L.tone(kind, Math.min(1, I + .4), 100, bot);
  let defs = linGrad(id, 0, top, 0, bot, [[0, far], [.5, L.tone(kind, I - .06, 100, (top + bot) / 2)], [1, near]]) + `<clipPath id="${cid}"><rect x="0" y="${f(top)}" width="${W}" height="${f(bot - top)}"/></clipPath>`;
  let body = `<rect x="0" y="${f(top)}" width="${W}" height="${f(bot - top)}" fill="url(#${id})"/>`;
  if (L.point) { // the pool of the lamp's light on the planks, fading with distance
    const b = L.keyBase(hz), pg = nid('dp', u), c = L.tone(kind, .9, b.x, b.y), rr = L.key.radius * 1.05, k = clamp(L.ellipse(b.y, hz) * 1.5, .3, .8);
    defs += `<radialGradient id="${pg}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".3" stop-color="${c}" stop-opacity=".62"/><stop offset=".65" stop-color="${c}" stop-opacity=".2"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
    body += `<ellipse cx="${f(b.x)}" cy="${f(b.y)}" rx="${f(rr)}" ry="${f(rr * k)}" fill="url(#${pg})"/>`;
  }
  const i0 = Math.floor((-vx / sT) / pwd) - 1, i1 = Math.ceil(((W - vx) / sT) / pwd) + 1, off = R() * pwd;
  for (let i = i0; i <= i1; i++) {
    const xa = vx + i * pwd + off, xb = xa + pwd, v = (R() - .5) * .14;
    body += `<path d="M${f(X(xa, top))} ${f(top)}L${f(X(xb, top))} ${f(top)}L${f(xb)} ${f(bot)}L${f(xa)} ${f(bot)}Z" fill="${v > 0 ? lit : seam}" opacity="${f(Math.abs(v))}"/>`;
    for (let k = 0; k < 3; k++) { const gx = xa + pwd * (.15 + R() * .7), s0 = lerp(sT, 1, R() * .7), s1 = Math.min(1.05, s0 + .1 + R() * .4), y0 = hz + (bot - hz) * s0, y1 = hz + (bot - hz) * s1; body += `<path d="M${f(X(gx, y0))} ${f(y0)}L${f(X(gx + (R() - .5) * 2, y1))} ${f(y1)}" stroke="${k % 2 ? seam : lit}" stroke-width="${f(.2 + .3 * s1)}" opacity="${f(.12 + .12 * R())}"/>`; }
    for (let k = 0; k < 2; k++) if (R() > .4) { const s = lerp(sT, 1.05, R()), y = hz + (bot - hz) * s, t = (y - top) / (bot - top), nr = .22 + .42 * t;
      body += `<path d="M${f(X(xa, y))} ${f(y)}L${f(X(xb, y))} ${f(y)}" stroke="${seam}" stroke-width="${f(.2 + .55 * t)}" opacity=".75"/><path d="M${f(X(xa, y))} ${f(y + .3 + .4 * t)}L${f(X(xb, y))} ${f(y + .3 + .4 * t)}" stroke="${lit}" stroke-width="${f(.15 + .25 * t)}" opacity=".3"/>`
        + [.2, .8].map(q => `<ellipse cx="${f(X(xa + pwd * q, y))}" cy="${f(y - 1 - 2.4 * t)}" rx="${f(nr)}" ry="${f(nr * .6)}" fill="${seam}" opacity=".7"/><ellipse cx="${f(X(xa + pwd * q, y))}" cy="${f(y + 1 + 2.4 * t)}" rx="${f(nr)}" ry="${f(nr * .6)}" fill="${seam}" opacity=".7"/>`).join(''); }
    body += `<path d="M${f(X(xa, top) - .07)} ${f(top)}L${f(X(xa, top) + .07)} ${f(top)}L${f(xa + .42)} ${f(bot)}L${f(xa - .42)} ${f(bot)}Z" fill="${seam}" opacity=".8"/><path d="M${f(X(xa, top) + .1)} ${f(top)}L${f(xa + .85)} ${f(bot)}L${f(xa + .5)} ${f(bot)}Z" fill="${lit}" opacity=".3"/>`;
  }
  if (o.wet && L.source && L.front) { // a wet deck: the source's light lies in a streak straight under it, towards the viewer
    const g = nid('dw', u), fl = nid('df', u), sx = L.source.x, c = mix(L.keyColor, '#ffffff', .3); defs += linGrad(g, 0, top, 0, bot, [[0, c, .4], [.5, c, .2], [1, c, .08]]) + blurFilter(fl, [sx - 60, top - 6, 120, bot - top + 12], '3.5 1');
    body += `<path d="M${f(sx - 2.5)} ${f(top)}L${f(sx + 2.5)} ${f(top)}L${f(sx + 20)} ${f(bot)}L${f(sx - 20)} ${f(bot)}Z" fill="url(#${g})" filter="url(#${fl})"/>`; }
  return `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}</g><path d="M0 ${f(top)}h${W}" stroke="${seam}" stroke-width=".7"/><path d="M0 ${f(top + .7)}h${W}" stroke="${lit}" stroke-width=".4" opacity=".4"/>`;
}

module.exports = { sky, sunMoon, cloud, cloudBank, water, foam, reflection, splash, fog, smoke, fire, muzzleFlash, deck };
