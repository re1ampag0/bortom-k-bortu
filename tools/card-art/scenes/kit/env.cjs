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
 * sky(u, L, { horizon, stars, seed, top, w }) — the sky from `top` (0) down to the horizon by L.time: a gradient to
 * the tone at the horizon, lighter round the source, stars at night (stars: a number, or false).
 */
function sky(u, L, o = {}) {
  const hz = o.horizon != null ? o.horizon : L.cam.horizon, w = o.w || W, top = o.top || 0, P = L.pal, id = nid('sk', u), cid = nid('skc', u), R = rng(o.seed != null ? o.seed : 7);
  let defs = linGrad(id, 0, top, 0, hz, [[0, P.sky[0]], [.42, P.sky[1]], [.78, P.sky[2]], [1, P.sky[3]]]) + `<clipPath id="${cid}"><rect x="0" y="${f(top)}" width="${w}" height="${f(hz - top + .6)}"/></clipPath>`;
  let body = `<rect x="0" y="${f(top)}" width="${w}" height="${f(hz - top + .6)}" fill="url(#${id})"/>`;
  const s = L.source && L.front ? L.source : null;
  if (s) { // the air glows round the sun or moon and along the horizon under it
    const g = nid('ska', u), k = L.time === 'dusk' ? .62 : L.time === 'day' ? .5 : L.time === 'fog' ? .34 : .3, c = mix(L.keyColor, P.sky[3], .25);
    defs += `<radialGradient id="${g}"><stop offset="0" stop-color="${c}" stop-opacity="${k}"/><stop offset=".4" stop-color="${c}" stop-opacity="${f(k * .4)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
    const gx = clamp(s.x, -60, w + 60);
    body += `<ellipse cx="${f(gx)}" cy="${f(Math.min(Math.max(s.y, top - 40), hz))}" rx="${L.time === 'fog' ? 120 : 96}" ry="${L.time === 'fog' ? 96 : 78}" fill="url(#${g})"/><ellipse cx="${f(gx)}" cy="${f(hz)}" rx="${L.time === 'dusk' ? 190 : 150}" ry="${L.time === 'dusk' ? 34 : 18}" fill="url(#${g})" opacity="${L.time === 'dusk' ? 1 : .7}"/>`;
  }
  const n = o.stars === false ? 0 : typeof o.stars === 'number' ? o.stars : L.time === 'night' ? 70 : 0;
  if (n) {
    const sd = nid('sks', u); defs += softDot(sd);
    for (let i = 0; i < n; i++) {
      const x = R() * w, t = Math.pow(R(), 1.35), y = top + t * (hz - top) * .92, r = .16 + R() * R() * .5, near = s ? Math.hypot(x - s.x, y - s.y) : 99;
      const op = (.35 + R() * .6) * (1 - t * .75) * clamp((near - 14) / 30), col = ['#ffffff', '#dfe8ff', '#fff0d2'][i % 3];
      if (op < .05) continue;
      body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="${f(op)}"/>` + (i % 11 === 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 4)}" fill="url(#${sd})" opacity="${f(op * .3)}"/>` : '');
    }
  }
  return `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}</g>`;
}

/** sunMoon(u, L, { r }) — the disc of the sun or moon with its halo at the key light's place (L.source). */
function sunMoon(u, L, o = {}) {
  const s = L.source; if (!s || L.point) return '';
  const moon = L.key.type === 'moon', fog = L.time === 'fog', dusk = L.time === 'dusk', r = o.r || (moon ? 8 : 7), h1 = nid('sm', u), h2 = nid('sn', u), d = nid('sd', u), c = nid('so', u);
  const hc = mix(L.keyColor, '#ffffff', .3), big = r * (fog ? 13 : dusk ? 11 : moon ? 8 : 10), kb = fog ? .5 : moon ? .36 : .6;
  const disc = moon ? (fog ? ['#eefaf0', '#cfe8dc', '#9fc4b4'] : ['#fbf8e8', '#efe9d0', '#d2ceb8']) : dusk ? ['#fff6c8', '#ffd27a', '#ff9a4a'] : ['#ffffff', '#fffbe6', '#fff0b8'];
  let out = `<defs><radialGradient id="${h1}"><stop offset="0" stop-color="${hc}" stop-opacity="${kb}"/><stop offset=".25" stop-color="${hc}" stop-opacity="${f(kb * .42)}"/><stop offset=".6" stop-color="${hc}" stop-opacity="${f(kb * .12)}"/><stop offset="1" stop-color="${hc}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="${h2}"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".45" stop-color="${hc}" stop-opacity=".5"/><stop offset="1" stop-color="${hc}" stop-opacity="0"/></radialGradient>`
    + (dusk ? linGrad(d, s.x, s.y - r, s.x, s.y + r, [[0, disc[0]], [.5, disc[1]], [1, disc[2]]]) : radGrad(d, s.x, s.y, r, [[0, disc[0]], [.7, disc[1]], [1, disc[2]]]))
    + `<clipPath id="${c}"><circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r)}"/></clipPath></defs>`
    + `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(big)}" fill="url(#${h1})" style="mix-blend-mode:screen"/><circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r * (fog ? 3.4 : 2.3))}" fill="url(#${h2})" style="mix-blend-mode:screen"/>`
    + `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(r)}" fill="url(#${d})"${fog ? ' opacity=".9"' : ''}/>`;
  if (moon) { // the grey seas of the moon: soft patches inside the disc
    const R = rng(o.seed != null ? o.seed : 5), sea = fog ? '#8fb4a4' : '#b9b5a2';
    const sf = nid('sf', u);
    out += `<defs>${blurFilter(sf, [s.x - r * 1.5, s.y - r * 1.5, r * 3, r * 3], f(r * .07))}</defs><g clip-path="url(#${c})" opacity="${fog ? .26 : .42}"><g filter="url(#${sf})">` + [[-.32, -.22, .4, .3], [.3, .12, .3, .36], [-.02, .46, .34, .2], [.3, -.46, .22, .14], [-.56, .28, .16, .24]].map(([a, b, q, q2]) => `<ellipse cx="${f(s.x + a * r)}" cy="${f(s.y + b * r)}" rx="${f(q * r * (.9 + R() * .3))}" ry="${f(q2 * r * (.9 + R() * .3))}" transform="rotate(${f(R() * 60 - 30)} ${f(s.x + a * r)} ${f(s.y + b * r)})" fill="${sea}" opacity="${f(.5 + R() * .4)}"/>`).join('') + '</g></g>';
  }
  return out;
}

const stops = list => list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${f(clamp(a))}"` : ''}/>`).join('');
// the key light's direction in the picture plane at (x, y): to the disc of the sun or moon when it is in the
// picture, otherwise L.at; back — the light comes from behind the thing, towards the viewer
function lightSide(L, x, y) {
  const a = L.at(x, y); let ux = a.ux || 0, uy = a.uy || 0;
  if (L.source && L.front && !L.point) { const dx = L.source.x - x, dy = L.source.y - y, l = Math.hypot(dx, dy); if (l > 1) { ux = dx / l; uy = dy / l; } }
  const l = Math.hypot(ux, uy) || 1; return { ux: ux / l, uy: uy / l, dz: a.dz, back: a.dz < -.2 };
}

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
  if (o.fade) { const [a, b, c, d, a0, a1] = o.fade; defs += linGrad(F, a, b, c, d, [[0, '#fff', a0], [.45, '#fff', lerp(a0, a1, .3)], [1, '#fff', a1]]); }
  defs += `<mask id="${M}" maskUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}"><g filter="url(#${E})"><g${o.flat != null ? ` clip-path="url(#${C})"` : ''} fill="${o.fade ? `url(#${F})` : '#fff'}">${shapes}</g></g></mask>`;
  // 1. the whole form's tone towards the light
  defs += linGrad(A, cx + ux * ext, cy + uy * ext, cx - ux * ext, cy - uy * ext, back ? [[0, col.mid], [.3, mix(col.shade, col.mid, .5)], [1, mix(col.shade, col.mid, .2)]] : [[0, col.lit], [.45, mix(col.lit, col.mid, .55)], [1, col.mid]]);
  let body = `<rect x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}" fill="url(#${A})"/>`;
  // 3. lit caps on the swells that face the source; each fades out before its edge, so they melt into one another
  if (!back && (o.puffs == null || o.puffs > 0)) {
    defs += `<radialGradient id="${G}" cx="${f(.5 + ux * .16)}" cy="${f(.5 + uy * .16)}" r=".5" fx="${f(.5 + ux * .26)}" fy="${f(.5 + uy * .26)}">${stops([[0, col.knob || col.lit, .95], [.4, col.lit, .6], [1, col.lit, 0]])}</radialGradient>`;
    const pr = cs.map(q => q[0] * ux + q[1] * uy), pmin = Math.min(...pr), pmax = Math.max(...pr), po = o.puffs != null ? o.puffs : .75;
    body += `<g filter="url(#${B})">` + cs.map((q, i) => { const t = pmax - pmin > .1 ? (pr[i] - pmin) / (pmax - pmin) : 1, op = po * (.3 + .7 * Math.pow(t, 1.2)); return op > .04 ? el(q, ` fill="url(#${G})" opacity="${f(op)}"`, 1.08) : ''; }).join('') + '</g>';
  }
  // creases: every swell's own side away from the light, very soft, so the swells read without a seam between them
  if (!back && o.crease !== 0) { const CR = nid('bk', u), kk = o.crease != null ? o.crease : .3;
    defs += blurFilter(CR, box, f(clamp(rm * .3, .5, 3.5)));
    body += `<g filter="url(#${CR})" opacity="${f(kk)}">` + cs.filter(q => ex(q)[1] > rm * .7).map(q => { const [rx, ry] = ex(q), k = nid('bn', u);
      defs += `<mask id="${k}" maskUnits="userSpaceOnUse" x="${f(box[0])}" y="${f(box[1])}" width="${f(box[2])}" height="${f(box[3])}">${el(q, ' fill="#fff"')}${el([q[0] + ux * ry * .45, q[1] + uy * ry * .45 - ry * .12, q[2], q[3]], ' fill="#000"', 1.02)}</mask>`;
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
    if (env > .5 && R() > .2 && ry > step * .6) { const r2 = ry * (.6 + R() * .3); cs.push([cx + (R() - .5) * ry, y - ry * 1.3 - r2 * (.25 + R() * .5), r2]); }
  }
  // under a lamp the clouds are lit by the sky from above; otherwise by the source, with the sky adding light from above
  const ls = L.point ? { ux: 0, uy: -1, back: false } : lightSide(L, x, y - h / 2), back = ls.back && L.time !== 'fog';
  const lit = mix(mix(P.cloudLit, L.keyColor, .3), P.sky[3], far * .45), shade = mix(P.cloudShade, P.sky[2], far * .6);
  const col = { lit, mid: mix(lit, shade, back ? .5 : .26), shade, rim: mix(lit, '#ffffff', back ? .35 : .5), knob: mix(lit, '#ffffff', L.time === 'fog' ? 0 : .45) };
  return billow(u, L, cs, col, { dir: { ux: ls.ux, uy: ls.uy - (back ? .15 : .4) }, back, flat: y, under: lerp(back ? .7 : .62, .35, far), uh: .55, seed: (o.seed || 1) + 3,
    disp: lerp(2.6, 2, far), blur: lerp(.35, .7, far), seam: clamp(h * lerp(.045, .06, far), .5, 2.2) });
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
  // rows of crests: a light crescent on the top of each wave, a dark one under it
  let d = .8, rows = 0;
  while (d < H && rows < 90) {
    const t = d / H, y = hz + d, lam = (4 + (9 + 44 * sw) * t) * (1 + 2.2 * Math.pow(1 - t, 5)), amp = .1 + 2.7 * t * (.35 + sw), base = seaAt(t), light = mix(base, sheen, .62), dark = mix(base, deep, .7);
    const opL = .1 + .34 * Math.pow(t, .6), opD = .14 + .3 * Math.pow(t, .7), hwp = gx != null ? pathHw(d) * 1.5 : 0;
    let x = -R() * lam;
    while (x < w) {
      const fw = lam * (.5 + R() * .9), gap = lam * (.2 + R() * 1.1), yy = y + (R() - .5) * amp * .8, a = amp * (.7 + R() * .6);
      if (R() > .2) { // crests near the glitter path catch more light, fading off softly to the sides (no hard band)
        const kq = gx != null ? Math.exp(-Math.pow((x + fw / 2 - gx) / (hwp * (.7 + R() * .6) + .01), 2)) * (1 - .6 * t) : 0;
        body += `<path d="M${f(x)} ${f(yy + a * .5)}q${f(fw / 2)} ${f(a * 1.5)} ${f(fw)} 0q${f(-fw / 2)} ${f(a * .35)} ${f(-fw)} 0z" fill="${dark}" opacity="${f(opD * (.6 + R() * .4))}"/>`
          + `<path d="M${f(x)} ${f(yy)}q${f(fw * .45)} ${f(-a * 1.25)} ${f(fw)} 0q${f(-fw * .5)} ${f(-a * .2)} ${f(-fw)} 0z" fill="${kq > .05 ? mix(light, L.keyColor, .5 * kq) : light}" opacity="${f(clamp(opL * (.6 + R() * .5) * (1 + .7 * kq)))}"/>`;
      }
      x += fw + gap;
    }
    d += (.8 + 6.4 * t * (.55 + sw * .8)) * (.85 + R() * .3); rows++;
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
    q = .5;
    while (q < H) {
      const t = q / H, hw = pathHw(q) * (.75 + R() * .5), n = R() < .1 * t ? 0 : 2 + Math.floor(R() * 3 + t * 2), fade = 1 - .7 * Math.pow(t, 1.3);
      for (let i = 0; i < n; i++) {
        const px = gx + (R() + R() + R() - 1.5) / 1.5 * hw, len = (1.1 + R() * (1.8 + 10 * t)) * (.8 + sw * .5), th = .22 + 1.1 * t * (.4 + R() * .6), cen = 1 - Math.abs(px - gx) / (hw + .01) * .5;
        body += `<path d="M${f(px - len / 2)} ${f(hz + q)}q${f(len / 2)} ${f(-th)} ${f(len)} 0q${f(-len / 2)} ${f(th)} ${f(-len)} 0z" fill="${gc}" opacity="${f(clamp((.45 + R() * .55) * fade * cen * (.55 + pk * .5)))}"/>`;
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
  // clumps of different size, sometimes parted by gaps; each clump is a few bubbles of foam
  let t = R() * .03, under = '', top = '', lace = '', dots = '';
  while (t < 1) {
    const env = Math.pow(Math.sin(Math.PI * clamp(t, .02, .98)), .6), cw = w * (.03 + R() * R() * .2), ch = h * (.45 + R() * 1.1) * (.3 + .7 * env), n = 2 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) {
      const bx = x - w / 2 + (t + R() * cw / w) * w, rx = cw * (.25 + R() * .4) + h * .15, ry = Math.max(.25, ch * (.3 + R() * .45)), by = y + (R() - .5) * h * .5 - ry * .2;
      under += `<ellipse cx="${f(bx)}" cy="${f(by + ry * .3)}" rx="${f(rx)}" ry="${f(ry)}" fill="${tone(bx, .35)}"/>`;
      top += `<ellipse cx="${f(bx + sx * rx * .14)}" cy="${f(by - ry * .22)}" rx="${f(rx * (.6 + R() * .2))}" ry="${f(ry * (.55 + R() * .2))}" fill="${tone(bx, 1)}"/>`;
    }
    if (R() > .5) lace += `<ellipse cx="${f(x - w / 2 + t * w)}" cy="${f(y + h * (.2 + R() * .4))}" rx="${f(cw * (1 + R()))}" ry="${f(h * (.12 + R() * .12))}" fill="${tone(x - w / 2 + t * w, .7)}"/>`;
    if (R() > .45) dots += `<circle cx="${f(x - w / 2 + t * w + (R() - .5) * 3)}" cy="${f(y + h * (.6 + R() * 1.4))}" r="${f(.2 + R() * .3 * h * .5)}" fill="${tone(x - w / 2 + t * w, .8)}" opacity="${f(.35 + R() * .5)}"/>`;
    if (R() > .62) { const l = 1.5 + R() * w * .14, px = x - w / 2 + t * w; dots += `<path d="M${f(px)} ${f(y + h * (.7 + R()))}q${f(l / 2)} ${f(-.4 - R() * .6)} ${f(l)} 0" stroke="${tone(px, .8)}" stroke-width="${f(.22 + R() * .3)}" fill="none" opacity="${f(.3 + R() * .4)}"/>`; }
    t += cw / w + (R() < .3 ? R() * .08 : 0);
  }
  const fr = clamp(.55 / h, .16, .5);
  return `<defs>${edgeFilter(e, box, (o.seed || 4) + 17, clamp(h * .9, .6, 2.4), `${f(fr)} ${f(clamp(fr * 1.6, .25, .62))}`, .12)}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y + h * .7)}" rx="${f(w * .5)}" ry="${f(h * .7)}" fill="${sh}" opacity=".22"/>`
    + `<g filter="url(#${e})"><g opacity=".75">${lace}</g>${under}${top}</g>${dots}`;
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
  const gid = nid('sg', u), bid = nid('sb', u), mid = nid('sm', u), cid = nid('sc', u), pad = Math.max(w, h) * .8;
  const box = `filterUnits="userSpaceOnUse" x="${f(x - w * 2 - pad)}" y="${f(y - h * 1.4 - pad)}" width="${f(w * 4 + 2 * pad)}" height="${f(h * 1.6 + 2 * pad)}"`;
  const bw = w * .4;
  let defs = linGrad(gid, x + sx * bw, y, x - sx * bw, y, back ? [[0, lit, .95], [.14, mix(lit, shade, .45), .85], [.5, shade, .72], [1, mix(shade, sea, .35), .6]] : [[0, lit, .97], [.35, mix(lit, shade, .3), .9], [.7, shade, .8], [1, mix(shade, sea, .3), .68]])
    + `<filter id="${bid}" ${box}><feGaussianBlur stdDeviation="${f(clamp(w * .02, .15, .6))}"/></filter><filter id="${mid}" ${box}><feGaussianBlur stdDeviation="${f(clamp(w * .12, .8, 3))}"/></filter>` + softDot(cid);
  let veil = '', backS = '', body = '', hl = '', front = '', drops = '';
  const jet = (p0, c, p1, wd, op, col) => `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(c[0])} ${f(c[1])} ${f(p1[0])} ${f(p1[1])}" stroke="${col}" stroke-width="${f(wd)}" fill="none" stroke-linecap="round" opacity="${f(op)}"/>`;
  const bez = (p0, c, p1, t) => [(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1]];
  const taper = (p0, c, p1, w0, w1, op, col) => { const A = [], B = []; // a sheet of water thinning from w0 to w1 along a curve
    for (let i = 0; i <= 8; i++) { const t = i / 8, q = bez(p0, c, p1, t), dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]), l = Math.hypot(dx, dy) || 1, hw = lerp(w0, w1, Math.pow(t, .8)) / 2;
      A.push([q[0] - dy / l * hw, q[1] + dx / l * hw]); B.unshift([q[0] + dy / l * hw, q[1] - dx / l * hw]); }
    return `<path d="${sm(A.concat(B), true)}" fill="${col}" opacity="${f(op)}"/>`; };
  const drop = (p, r, op) => { drops += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(r * .8)}" ry="${f(r)}" fill="${(p[0] - x) * sx >= 0 ? lit : far}" opacity="${f(op)}"/>`; if (r > .45) drops += `<circle cx="${f(p[0] + ls.ux * r * .32)}" cy="${f(p[1] + ls.uy * r * .32)}" r="${f(r * .35)}" fill="#ffffff" opacity="${f(op * .85)}"/>`; };
  // a sheet from p0 to p1 through c: lit if it leans to the source's side; a glint on its lit edge; drops beyond its end
  const sheet = (p0, c, p1, w0, op, nd, toFront = true) => {
    const toLight = (p1[0] - p0[0]) * sx > 0, col = toLight ? lit : far, s = taper(p0, c, p1, w0, w * .02, op, col)
      + jet(bez(p0, c, p1, .15), bez(p0, c, p1, .55), bez(p0, c, p1, .92), clamp(w0 * .18, .15, .55), toLight ? .7 : back ? .45 : .2, '#ffffff');
    const dx = p1[0] - c[0], dy = p1[1] - c[1], l = Math.hypot(dx, dy) || 1;
    for (let j = 1; j <= nd; j++) drop([p1[0] + dx / l * w * .09 * j + (R() - .5) * w * .05, p1[1] + dy / l * w * .09 * j + h * .025 * j * j], clamp(w * (.045 - .008 * j) * (.7 + R() * .6), .2, 1.2), .55 + R() * .35);
    if (toFront) front += s; else backS += s;
  };
  let top;
  if (v === 0) { // a column that bursts at the top into a crown of spikes of different length
    const ty = y - h * .58, n = 8, Lp = [], Rp = [], cx = t => x + (R() - .5) * w * .02 + sx * w * .03 * t;
    const hw = t => w * (.17 + .07 * t + .12 * Math.pow(t, 5)) * (.92 + R() * .16);
    for (let i = 0; i <= n; i++) { const t = i / n, yy = y - (y - ty) * t, c = cx(t), d = hw(t); Lp.push([c - d, yy]); Rp.unshift([c + d, yy]); }
    const tw = w * .36, rim = [[x - tw * .7, ty - h * .03], [x - tw * .25, ty - h * .07], [x + tw * .2, ty - h * .05], [x + tw * .65, ty - h * .02]];
    body += `<path d="${sm(Lp.concat(rim, Rp), true)}" fill="url(#${gid})"/>`;
    veil += `<path d="${sm(Lp.map(p => [p[0] - w * .1, p[1]]).concat(rim.map(p => [p[0], p[1] - h * .06]), Rp.map(p => [p[0] + w * .1, p[1]])), true)}" fill="${lit}" opacity=".16"/>`;
    const edge = sx > 0 ? Rp.slice().reverse() : Lp; hl += `<path d="${sm(edge.slice(1, n).map(p => [p[0] - sx * w * .035, p[1]]))}" stroke="#ffffff" stroke-width="${f(clamp(w * .03, .25, .8))}" fill="none" opacity="${back ? .85 : .65}" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) { const t0 = .05 + R() * .3, t1 = t0 + .25 + R() * .3, off = sx * (.15 + R() * .6), p0 = [cx(t0) + off * hw(t0), y - (y - ty) * t0], p1 = [cx(t1) + off * hw(t1), y - (y - ty) * t1];
      hl += jet(p0, [lerp(p0[0], p1[0], .5), lerp(p0[1], p1[1], .5)], p1, clamp(w * (.015 + R() * .02), .15, .5), .3 + R() * .3, '#ffffff'); }
    const m = 9;
    for (let k = 0; k < m; k++) { // the spikes fan out from the rim; the middle ones the longest, none alike; they bend over at the ends
      const a = lerp(-1.25, 1.25, k / (m - 1)) + (R() - .5) * .22, b = [x + Math.sin(a) * tw * .75, ty + Math.abs(Math.sin(a)) * h * .05], len = h * (.14 + .3 * Math.pow(Math.cos(a), 2)) * (.6 + R() * .7);
      const tip = [b[0] + Math.sin(a) * len * .95, b[1] - Math.cos(a) * len + len * .3 * Math.sin(a) * Math.sin(a)], c = [b[0] + Math.sin(a) * len * .3, b[1] - Math.cos(a) * len * .8 - len * .12];
      sheet(b, c, tip, w * (.08 + R() * .07), .85, 1 + Math.floor(R() * 3), Math.abs(a) > .5 || R() > .5);
    }
    for (let i = 0; i < 4; i++) { const side = i % 2 ? 1 : -1, st = [x + side * tw * (.45 + R() * .3), ty + h * .02], en = [st[0] + side * w * (.4 + R() * .35), y - h * (.08 + R() * .2)];
      sheet(st, [st[0] + side * w * .32, ty - h * (.05 + R() * .06)], en, w * (.14 + R() * .08), .7, 2, true); }
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
    top = [x, y - h * .45];
  } else { // a fan of sheets thrown aside by the wind, the spray carried on downwind
    const wd = o.wind ? Math.sign(o.wind) : 1, m = 8;
    const md = sm([[x - wd * w * .3, y], [x - wd * w * .14, y - h * .1], [x + wd * w * .1, y - h * .16], [x + wd * w * .36, y - h * .08], [x + wd * w * .5, y]], false) + 'Z';
    body += `<path d="${md}" fill="url(#${gid})"/>`;
    for (let k = 0; k < m; k++) {
      const q = k / (m - 1), a = wd * (lerp(-.2, 1.05, q) + (R() - .5) * .16), len = h * (1.02 - .5 * q) * (.75 + R() * .35), b = [x + wd * w * lerp(-.18, .3, q) + (R() - .5) * w * .08, y - h * .03];
      const tip = [b[0] + Math.sin(a) * len, b[1] - Math.cos(a) * len * .92 + len * .2 * Math.sin(a) * Math.sin(a)], c = [b[0] + Math.sin(a) * len * .2, b[1] - Math.cos(a) * len * .78 - len * .1];
      sheet(b, c, tip, w * (.18 + R() * .14) * (1 - .35 * q), k % 3 === 1 ? .62 : .86, 1 + Math.floor(R() * 2), k % 3 !== 1);
      if (k < 4) veil += jet(tip, [tip[0] + wd * w * .35, tip[1] - h * .05], [tip[0] + wd * w * (.7 + R() * .6), tip[1] + h * (.08 + R() * .18)], clamp(w * (.1 + R() * .1), .7, 3.5), .22, lit);
    }
    for (let i = 0; i < 16; i++) drop([x + wd * w * (.3 + R() * 1.4), y - h * (.25 + R() * .7)], clamp(w * (.012 + R() * .028), .2, .8), .35 + R() * .45);
    top = [x + wd * w * .3, y - h * .6];
  }
  for (let i = 0; i < 9 + seed % 5; i++) { const a = (R() - .5) * 2.8, dd = w * (.4 + R() * R() * 1.1); drop([top[0] + Math.sin(a) * dd, top[1] - Math.cos(a) * dd * .7 + R() * h * .3], clamp(w * (.012 + R() * R() * .05), .2, 1.1), .4 + R() * .45); }
  const rw = w * (v === 1 ? .85 : .62);
  // against the light the spray glows through on the source's side; with light from the front only a faint mist
  return `<defs>${defs}</defs><ellipse cx="${f(top[0] + sx * w * .3)}" cy="${f(top[1] + h * .1)}" rx="${f(w * (back ? 1.1 : .8))}" ry="${f(h * .42)}" fill="url(#${cid})" opacity="${f(back ? .32 : .1)}"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y + .6)}" rx="${f(rw * 1.25)}" ry="${f(Math.max(.8, rw * .22))}" fill="${mix(sea, L.shadowTint, .3)}" opacity=".45"/>` // the churned dark ring at the foot
    + `<g filter="url(#${mid})">${veil}</g><g filter="url(#${bid})">${backS}</g>${body}${hl}<g filter="url(#${bid})">${front}</g>${drops}`
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
  const n = Math.max(6, Math.round(5 + h / 7)), cs = [], dw = wind >= 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), [px, py] = at(t), r = wd(t) * (.62 + R() * .3);
    if (t > .7 && t < 1 && R() < .3) continue; // the top breaks into clumps
    cs.push([px + (R() - .5) * r * .3, py, r, t < .2 ? 1.35 : .8 + R() * .25]);
    const k = t < .22 ? 0 : 1 + (R() > .55 ? 1 : 0);
    for (let j = 0; j < k; j++) { const side = R() < .5 + wind * .3 ? 1 : -1; cs.push([px + side * r * (.45 + R() * .5), py + (R() - .4) * r * .7, r * (.38 + R() * .38), .8 + R() * .3]); }
  }
  const [tx, ty] = at(1);
  for (let i = 0; i < 2 + seed % 2; i++) cs.push([tx + dw * wd(1) * (.75 + R() * .6), ty + wd(1) * (R() - .5) * .7, wd(1) * (.2 + R() * .18), .6 + R() * .3]); // wisps torn off downwind
  const ls = L.point ? Object.assign({}, L.at(x, y - h / 2), { back: L.at(x, y - h / 2).dz < -.2 }) : lightSide(L, x, y - h / 2), back = ls.back, k = DIM[L.time] || 1;
  const lit = back ? mix(L.keyColor, '#ffffff', .2) : scale(mix(P.smoke, L.keyColor, .45), .9 + k * .25), shade = mix(P.smoke, L.shadowTint, back ? .45 : .62);
  let inner = '', defs = '';
  if (o.glow) { const g = nid('sg', u), c = o.glow.color || '#ff9a3a', p = o.glow.power != null ? o.glow.power : .7; defs += radGrad(g, x, y, Math.max(w, h * .6), [[0, c, p], [.4, c, p * .4], [1, c, 0]]); inner = `<rect x="${f(x - w - h)}" y="${f(y - h * 1.2)}" width="${f(2 * (w + h))}" height="${f(h * 1.4)}" fill="url(#${g})"/>`; }
  const op = o.opacity != null ? o.opacity : back ? .8 : .92;
  return (defs ? `<defs>${defs}</defs>` : '') + billow(u, L, cs, { lit, mid: mix(lit, shade, back ? .3 : .42), shade, rim: mix(lit, '#ffffff', .3), knob: mix(lit, '#ffffff', .25) },
    { dir: { ux: ls.ux * .6, uy: ls.uy * .6 - .75 }, back, fade: [x, y, tx, ty - wd(1) * .5, 1, .22], seed: seed + 7, disp: 2.6, freq: '0.06 0.07', blur: .5, opacity: op, inner, seam: clamp(w * .06, .6, 2.6) });
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
  const tongue = (cx, by, bw, th, lean, curl) => { const tx = cx + lean * th, ty = by - th, a = .7 + R() * .6, b = .7 + R() * .6;
    return `M${f(cx - bw)} ${f(by)}C${f(cx - bw * (1.05 + .3 * a))} ${f(by - th * .26 * a)} ${f(cx - bw * .3 + lean * th * .38 + curl)} ${f(by - th * (.48 + .12 * b))} ${f(tx)} ${f(ty)}`
      + `C${f(cx + bw * .3 + lean * th * .6 - curl * .6)} ${f(by - th * (.5 + .12 * a))} ${f(cx + bw * (1.05 + .3 * b))} ${f(by - th * .24 * b)} ${f(cx + bw)} ${f(by)}Z`; };
  // one layer: its own count and places of tongues, the tallest near the peak (off the middle), none alike
  const layer = (span, h0, h1, n, col, op) => { let s = '';
    for (let i = 0; i < n; i++) { const t = (i + .5 + (R() - .5) * .7) / n, env = clamp(1 - Math.abs(t - peak) * 1.6, .12, 1), th = h * lerp(h0, h1, env * (.5 + R() * .6)), bw = w * span / n * (.62 + R() * .5);
      s += `<path d="${tongue(x + (t - .5) * w * span, y + (R() - .3) * h * .02, bw, th, lean0 + (R() - .5) * .34, (R() - .5) * bw * 1.4)}"/>`; }
    return `<g fill="${col}" opacity="${op}">${s}</g>`; };
  let wisps = '';
  for (let i = 0; i < 2 + seed % 2; i++) { const by = y - h * (.5 + R() * .3), th = h * (.1 + R() * .14); wisps += `<path d="${tongue(x + (peak - .5) * w + lean0 * h * .55 + (R() - .5) * w * .35, by, w * (.035 + R() * .035), th, lean0 * 1.2, 0)}" fill="${i % 2 ? '#e2581a' : '#9a240a'}" opacity="${f(.55 + R() * .3)}"/>`; }
  const e1 = nid('fe', u), e2 = nid('ff', u), box = [x - w * 1.4, y - h * 1.6, w * 2.8, h * 1.8];
  const flames = `<defs>${edgeFilter(e1, box, seed + 2, clamp(w * .16, 1.2, 3), '0.1 0.06', .35)}${edgeFilter(e2, box, seed + 5, clamp(w * .09, .8, 1.8), '0.12 0.07', .25)}</defs>`
    + `<g filter="url(#${e1})">${layer(1.05, .38, 1, 5 + seed % 3, '#8a1c08', .84)}${wisps}</g>`
    + `<g filter="url(#${e2})">${layer(.86, .3, .78, 4 + seed % 3, '#e2581a', .95)}${layer(.66, .2, .52, 3 + seed % 2, '#ffae2c', 1)}${layer(.46, .12, .32, 3, '#ffe080', 1)}${layer(.3, .05, .15, 2, '#fffbe6', .9)}</g>`;
  let sparks = '';
  for (let i = 0; i < 9 + seed % 5; i++) { const sx = x + (R() - .5) * w * 1.3 + wind * h * .4, sy = y - h * (.65 + R() * .85), l = .6 + R() * 1.6, a = (R() - .5) * .8 + wind * .5; sparks += `<path d="M${f(sx)} ${f(sy)}l${f(Math.sin(a) * l)} ${f(-Math.cos(a) * l)}" stroke="${R() > .5 ? '#ffd98a' : '#ff9a3a'}" stroke-width="${f(.25 + R() * .35)}" stroke-linecap="round" opacity="${f(.45 + R() * .5)}"/>`; }
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
