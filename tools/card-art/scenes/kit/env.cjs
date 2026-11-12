// kit/env.cjs — the surroundings of a print scene drawn from its light L (kit/light.cjs, makeLight): sky, sun and
// moon, clouds, the sea in perspective with the glitter path under the source, foam, reflections, splashes, fog,
// smoke, fire, a gun's flash, a deck in perspective. Pure functions that return SVG strings; no Node API.
// Noise (feTurbulence) is used only to move the EDGE of a form (cloud, smoke, fire, foam, a reflection torn by
// ripples), never as a layer over the picture or over the whole sea. Rules: docs/mockups/print/STYLE.md.
'use strict';
const { nid, f, clamp, lerp, rng, mix, scale, linGrad, radGrad, localGlow } = require('./light.cjs');
const W = 200;
const DIM = { night: .8, fog: .78, dusk: .96, day: 1 };
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
    body += `<ellipse cx="${f(s.x)}" cy="${f(Math.min(s.y, hz))}" rx="${L.time === 'fog' ? 120 : 96}" ry="${L.time === 'fog' ? 96 : 78}" fill="url(#${g})"/><ellipse cx="${f(s.x)}" cy="${f(hz)}" rx="150" ry="${L.time === 'dusk' ? 30 : 18}" fill="url(#${g})" opacity=".7"/>`;
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
    out += `<g clip-path="url(#${c})" opacity="${fog ? .3 : .5}">` + [[-.3, -.25, .34], [.28, .1, .26], [-.05, .42, .22], [.32, -.42, .16], [-.5, .25, .15]].map(([a, b, q]) => `<ellipse cx="${f(s.x + a * r)}" cy="${f(s.y + b * r)}" rx="${f(q * r * (1 + R() * .3))}" ry="${f(q * r * (.75 + R() * .3))}" fill="${sea}" opacity="${f(.5 + R() * .4)}"/>`).join('') + '</g>';
  }
  return out;
}

// A soft form built of round puffs (cloud, smoke): the outline in the lit tone with a gradient towards the light,
// inside it the same outline in the shadow tone moved away from the light and down (so the light's side and the
// top stay lit and the underside is in shadow), lit knobs on the puffs; the edge is torn by noise.
function puffForm(u, L, cs, col, o = {}) {
  const xs = cs.map(c => [c[0] - c[2], c[0] + c[2]]).flat(), ys = cs.map(c => [c[1] - c[2], c[1] + c[2]]).flat();
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), bx = (x0 + x1) / 2, by = (y0 + y1) / 2, ext = Math.max(x1 - x0, y1 - y0) / 2, hh = y1 - y0;
  const d = L.at(bx, by), back = d.dz < -.3, g = nid('pg', u), c = nid('pc', u), e = nid('pe', u), b = nid('pb', u), k = nid('pk', u), pad = 8;
  const shapes = cs.map(q => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(q[2])}"/>`).join('') + (o.base ? `<ellipse cx="${f(o.base[0])}" cy="${f(o.base[1])}" rx="${f(o.base[2])}" ry="${f(o.base[3])}"/>` : '');
  const box = [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad], sh = o.shift != null ? o.shift : hh * .2, sd = o.soft != null ? o.soft : clamp(hh * .07, .8, 3);
  const defs = linGrad(g, bx + d.ux * ext, by + d.uy * ext, bx - d.ux * ext, by - d.uy * ext, [[0, col.lit], [.45, mix(col.lit, col.mid, .6)], [1, col.mid]])
    + `<clipPath id="${c}">${shapes}</clipPath>` + edgeFilter(e, box, o.seed || 1, o.disp != null ? o.disp : 2.4, o.freq, o.blur != null ? o.blur : .35) + blurFilter(b, box, f(sd)) + `<radialGradient id="${k}"><stop offset="0" stop-color="${col.knob || col.lit}" stop-opacity=".85"/><stop offset="1" stop-color="${col.knob || col.lit}" stop-opacity="0"/></radialGradient>`;
  const tr = back ? `translate(${f(bx)} ${f(by + hh * .05)}) scale(.84) translate(${f(-bx)} ${f(-by)})` : `translate(${f(-d.ux * sh * .8)} ${f(-d.uy * sh * .5 + sh * .75)})`;
  const knobs = back ? '' : cs.filter((_, i) => i % 2 === 0).map(q => `<circle cx="${f(q[0] + d.ux * q[2] * .34)}" cy="${f(q[1] + d.uy * q[2] * .34 - q[2] * .12)}" r="${f(q[2] * .62)}" fill="url(#${k})" opacity="${f(o.knob != null ? o.knob : .55)}"/>`).join('');
  return `<defs>${defs}</defs><g filter="url(#${e})"${o.opacity != null ? ` opacity="${f(o.opacity)}"` : ''}><g fill="url(#${g})">${shapes}</g><g clip-path="url(#${c})"><g transform="${tr}" filter="url(#${b})" fill="${col.shade}" opacity="${f(o.shade != null ? o.shade : .9)}">${shapes}</g>${knobs}${o.inner || ''}</g></g>`;
}

/**
 * cloud(u, L, { x, y, w, h, seed, far }) — a cloud with volume: x — the middle, y — its flat underside, w, h — the
 * size. Lit from the side of the source, in shadow below; against the light — a bright edge and a dark body.
 * far 0..1 — aerial perspective: paler and nearer to the tone of the sky at the horizon.
 */
function cloud(u, L, o = {}) {
  const x = o.x != null ? o.x : 100, y = o.y != null ? o.y : 50, w = o.w || 60, h = o.h || 22, far = o.far || 0, R = rng(o.seed != null ? o.seed : 1), P = L.pal;
  const n = Math.max(4, Math.round(w / 9)), cs = [], step = w * .9 / n;
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n + (R() - .5) * .08, env = Math.pow(Math.sin(Math.PI * clamp(t, .03, .97)), .75), r = Math.max(step * .62, h * (.2 + .34 * env * (.65 + .5 * R())));
    const cx = x + (t - .5) * w * .9; cs.push([cx, y - r * .72 - h * .06, r]);
    if (env > .5 && R() > .2 && h > step) { const r2 = r * (.6 + R() * .3); cs.push([cx + (R() - .5) * r, y - r * 1.3 - r2 * (.25 + R() * .5), r2]); }
  }
  const lit = mix(mix(P.cloudLit, L.keyColor, .3), P.sky[3], far * .45), shade = mix(P.cloudShade, P.sky[2], far * .6);
  return puffForm(u, L, cs, { lit, mid: mix(lit, shade, .32), shade, knob: mix(lit, '#ffffff', .5) }, { seed: (o.seed || 1) + 3, base: [x, y - h * .1, w * .47, h * .15], disp: lerp(2.6, 1.6, far), shade: lerp(.9, .6, far), knob: lerp(.55, .3, far) });
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
  const sheen = mix(P.sky[3], L.keyColor, .35), deep = scale(P.sea[2], .8);
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
      if (R() > .2) {
        const inPath = gx != null && Math.abs(x + fw / 2 - gx) < hwp;
        body += `<path d="M${f(x)} ${f(yy + a * .5)}q${f(fw / 2)} ${f(a * 1.5)} ${f(fw)} 0q${f(-fw / 2)} ${f(a * .35)} ${f(-fw)} 0z" fill="${dark}" opacity="${f(opD * (.6 + R() * .4))}"/>`
          + `<path d="M${f(x)} ${f(yy)}q${f(fw * .45)} ${f(-a * 1.25)} ${f(fw)} 0q${f(-fw * .5)} ${f(-a * .2)} ${f(-fw)} 0z" fill="${inPath ? mix(light, L.keyColor, .5) : light}" opacity="${f(clamp(opL * (.6 + R() * .5) * (inPath ? 1.7 : 1)))}"/>`;
      }
      x += fw + gap;
    }
    d += (.8 + 6.4 * t * (.55 + sw * .8)) * (.85 + R() * .3); rows++;
  }
  // the glitter path under the sun or moon: a soft column and broken glints, narrow at the horizon
  if (gx != null) {
    const g2 = nid('wg', u), fl = nid('wf', u), hb = pathHw(H), gc = mix(L.keyColor, '#ffffff', L.time === 'dusk' ? .25 : .5), pk = clamp(.5 + L.key.power * .5) * (1 - .35 * el / 90);
    defs += linGrad(g2, 0, hz, 0, bot, [[0, gc, .5 * pk], [.25, gc, .3 * pk], [1, gc, .1 * pk]]) + blurFilter(fl, [gx - hb - 16, hz - 8, 2 * hb + 32, H + 16], '3.2 1.2');
    body += `<path d="M${f(gx - 1.6)} ${f(hz)}L${f(gx + 1.6)} ${f(hz)}L${f(gx + hb * .8)} ${f(bot)}L${f(gx - hb * .8)} ${f(bot)}Z" fill="url(#${g2})" filter="url(#${fl})"/>`;
    let q = .5;
    while (q < H) {
      const t = q / H, hw = pathHw(q), n = 2 + Math.floor(R() * 3 + t * 2);
      for (let i = 0; i < n; i++) {
        const px = gx + (R() + R() + R() - 1.5) / 1.5 * hw, len = (1.1 + R() * (1.8 + 10 * t)) * (.8 + sw * .5), th = .22 + 1.1 * t * (.4 + R() * .6), cen = 1 - Math.abs(px - gx) / (hw + .01) * .5;
        body += `<path d="M${f(px - len / 2)} ${f(hz + q)}q${f(len / 2)} ${f(-th)} ${f(len)} 0q${f(-len / 2)} ${f(th)} ${f(-len)} 0z" fill="${gc}" opacity="${f(clamp((.45 + R() * .55) * (.98 - .4 * t) * cen * (.55 + pk * .5)))}"/>`;
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
  const col = L ? scale(mix('#f6fcff', L.keyColor, .3), DIM[L.time] || 1) : '#f4fbff', sh = L ? L.shadowTint : '#12303c', n = Math.max(5, Math.round(w / 2));
  let out = `<ellipse cx="${f(x)}" cy="${f(y + h * .7)}" rx="${f(w * .52)}" ry="${f(h * .8)}" fill="${sh}" opacity=".28"/>`, lace = '', dots = '';
  for (let i = 0; i < n; i++) {
    const t = (i + R()) / n, env = Math.pow(Math.sin(Math.PI * clamp(t, .04, .96)), .5), fx = x - w / 2 + t * w, r = h * (.3 + R() * .7) * env;
    lace += `<ellipse cx="${f(fx)}" cy="${f(y + (R() - .5) * h * .5)}" rx="${f(r * (1.1 + R() * 1.4))}" ry="${f(r * .5)}"/>`;
    if (R() > .45) dots += `<circle cx="${f(fx + (R() - .5) * 3)}" cy="${f(y + h * (.5 + R() * 1.4))}" r="${f(.2 + R() * .35 * h * .5)}" opacity="${f(.4 + R() * .5)}"/>`;
    if (R() > .6) { const l = 2 + R() * w * .16; dots += `<path d="M${f(fx)} ${f(y + h * (.6 + R()))}q${f(l / 2)} ${f(-.5 - R() * .6)} ${f(l)} 0" stroke="${col}" stroke-width="${f(.25 + R() * .3)}" fill="none" opacity="${f(.35 + R() * .4)}"/>`; }
  }
  return out + `<g fill="${col}" opacity=".94">${lace}</g><g fill="${col}">${dots}</g>`;
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
 * splash(u, { x, y, w, h, seed, L }) — a column of water thrown up at (x, y) on the surface, w wide and h high:
 * jets of different height, drops, a ring of foam at the foot. Three shapes by seed (a tall column, a low crown,
 * a slanted burst).
 */
function splash(u, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 16, h = o.h || 30, seed = o.seed != null ? o.seed : 0, R = rng(seed + 11), L = o.L, v = ((seed % 3) + 3) % 3;
  const white = L ? scale(mix('#ffffff', L.keyColor, .35), DIM[L.time] || 1) : '#f4fbff', body = L ? mix(L.pal.sea[1], white, .55) : '#a9d0dc', dk = L ? mix(L.pal.sea[1], white, .22) : '#5a94a8', ux = L ? L.at(x, y).ux : -.5;
  const jets = v === 0 ? [[0, 1, .26, 0], [-.3, .58, .2, -.12], [.32, .66, .2, .1], [-.1, .8, .16, -.04]] : v === 1 ? [[-.42, .5, .2, -.42], [-.2, .72, .2, -.16], [.04, .8, .22, .02], [.26, .66, .2, .2], [.44, .44, .18, .46]] : [[-.1, .95, .26, .32], [.16, .7, .2, .5], [-.3, .6, .2, .08], [.3, .36, .16, .7]];
  const g = nid('sp', u), e = nid('se', u);
  let lobes = '', shade = '', drops = '';
  for (const [bx, hh, bw, lean] of jets) {
    const cx = x + bx * w, jh = h * hh * (.9 + R() * .2), jw = w * bw, tx = cx + lean * jh * .5, ty = y - jh;
    lobes += `<path d="M${f(cx - jw)} ${f(y)}Q${f(cx - jw * .95 + lean * jh * .1)} ${f(y - jh * .6)} ${f(tx - jw * .28)} ${f(ty + jw * .3)}Q${f(tx)} ${f(ty - jw * .5)} ${f(tx + jw * .3)} ${f(ty + jw * .34)}Q${f(cx + jw * 1.05 + lean * jh * .14)} ${f(y - jh * .55)} ${f(cx + jw)} ${f(y)}Z"/>`;
    shade += `<path d="M${f(cx - ux * jw * .4)} ${f(y)}Q${f(cx - ux * jw * .5 + lean * jh * .14)} ${f(y - jh * .5)} ${f(tx - ux * jw * .1)} ${f(ty + jw)}" stroke="${dk}" stroke-width="${f(jw * .5)}" fill="none" opacity=".4" stroke-linecap="round"/>`;
    for (let i = 0; i < 3; i++) { const a = (R() - .5) * 1.6 + lean, dd = jw * (.8 + R() * 2.4); drops += `<circle cx="${f(tx + Math.sin(a) * dd + (R() - .5) * jw)}" cy="${f(ty - Math.cos(a) * dd * .7 + R() * jh * .3)}" r="${f(clamp(jw * (.08 + R() * .16), .3, 1.4))}" fill="${white}" opacity="${f(.55 + R() * .4)}"/>`; }
  }
  const rw = w * (v === 1 ? .78 : .6);
  return `<defs>${linGrad(g, 0, y, 0, y - h, [[0, white, .96], [.35, body, .9], [.75, white, .86], [1, white, .6]])}${edgeFilter(e, [x - w * 1.2, y - h * 1.2, w * 2.4, h * 1.3], seed + 3, 1.5, '0.11 0.07', .25)}</defs>`
    + `<ellipse cx="${f(x)}" cy="${f(y + .6)}" rx="${f(rw)}" ry="${f(rw * .2)}" fill="${dk}" opacity=".5"/>`
    + `<g filter="url(#${e})"><g fill="url(#${g})">${lobes}</g>${shade}</g>${drops}` + foam(u, { x, y: y + .4, w: rw * 2, h: clamp(w * .09, .8, 2.4), seed: seed + 5, L });
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
 * smoke(u, L, { x, y, w, h, seed, wind, opacity, glow }) — smoke rising from (x, y): w — its width at the top,
 * h — how high it rises, wind -1..1 — how far the top is carried sideways. Puffs with shadow below and light on
 * the source's side; against the light it glows. glow: { color, power } — lit from inside by the fire at its foot.
 */
function smoke(u, L, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 24, h = o.h || 50, wind = o.wind || 0, seed = o.seed != null ? o.seed : 5, R = rng(seed), P = L.pal;
  const n = Math.max(5, Math.round(6 + h / 9)), cs = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); cs.push([x + wind * h * .65 * Math.pow(t, 1.3) + (R() - .5) * w * .3 * t, y - h * Math.pow(t, .85) + (R() - .5) * 2, w * (.13 + .37 * t) * (.75 + R() * .5)]); if (t > .3 && R() > .5) cs.push([cs[cs.length - 1][0] + (R() - .5) * w * .7 * t, cs[cs.length - 1][1] + (R() - .5) * w * .4 * t, w * (.1 + .26 * t)]); }
  const d = L.at(x, y - h / 2), back = d.dz < -.2, k = DIM[L.time] || 1;
  const lit = back ? mix(L.keyColor, '#ffffff', .2) : scale(mix(P.smoke, L.keyColor, .45), .9 + k * .25), shade = mix(P.smoke, L.shadowTint, back ? .4 : .62);
  let inner = '', defs = '';
  if (o.glow) { const g = nid('sg', u), c = o.glow.color || '#ff9a3a', p = o.glow.power != null ? o.glow.power : .7; defs += radGrad(g, x, y, Math.max(w, h * .6), [[0, c, p], [.4, c, p * .4], [1, c, 0]]); inner = `<rect x="${f(x - w - h)}" y="${f(y - h * 1.2)}" width="${f(2 * (w + h))}" height="${f(h * 1.4)}" fill="url(#${g})"/>`; }
  const mk = nid('sk', u), mg = nid('sj', u), tx = cs[cs.length - 1][0], op = o.opacity != null ? o.opacity : back ? .78 : .9;
  defs += linGrad(mg, x, y, tx, y - h, [[0, '#fff', 1], [.55, '#fff', .8], [1, '#fff', .3]]) + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="${f(Math.min(x, tx) - w * 1.5)}" y="${f(y - h - w)}" width="${f(Math.abs(tx - x) + w * 3)}" height="${f(h + w * 1.6)}"><rect x="${f(Math.min(x, tx) - w * 1.5)}" y="${f(y - h - w)}" width="${f(Math.abs(tx - x) + w * 3)}" height="${f(h + w * 1.6)}" fill="url(#${mg})"/></mask>`;
  return `<defs>${defs}</defs><g mask="url(#${mk})">` + puffForm(u, L, cs, { lit, mid: mix(lit, shade, back ? .25 : .4), shade, knob: mix(lit, '#ffffff', .3) }, { seed: seed + 7, disp: 2.6, freq: '0.06 0.07', blur: .5, opacity: op, shade: back ? .6 : .85, knob: .4, inner }) + '</g>';
}

const tongue = (cx, y, bw, th, lean) => { const tx = cx + lean * th, ty = y - th; return `M${f(cx - bw)} ${f(y)}C${f(cx - bw * 1.3)} ${f(y - th * .3)} ${f(cx - bw * .2 + lean * th * .15)} ${f(y - th * .55)} ${f(tx)} ${f(ty)}C${f(cx + bw * .45 + lean * th * .7)} ${f(y - th * .6)} ${f(cx + bw * 1.35)} ${f(y - th * .28)} ${f(cx + bw)} ${f(y)}Z`; };
/**
 * fire(u, { x, y, w, h, seed, glow, wind }) — a fire standing on (x, y), w wide and h high, in layers: a dark red
 * mantle, an orange body, a yellow core, a white heart, sparks above; and its own light round it (glow: false to
 * leave the light to the scene's locals).
 */
function fire(u, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w || 16, h = o.h || 26, seed = o.seed != null ? o.seed : 3, R = rng(seed), wind = o.wind || 0;
  const n = 3 + seed % 3, ts = [];
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, env = Math.sin(Math.PI * t); ts.push([x + (t - .5) * w * .78 + (R() - .5) * w * .1, w / n * (.62 + R() * .3), h * (.45 + .55 * env) * (.78 + R() * .3), (R() - .5) * .3 + wind * .35]); }
  const e = nid('fe', u), box = [x - w * 1.2, y - h * 1.5, w * 2.4, h * 1.7];
  const layer = (s, col, op) => `<g fill="${col}" opacity="${op}">${ts.map(([cx, bw, th, lean]) => `<path d="${tongue(lerp(x, cx, .5 + s * .5), y, bw * Math.sqrt(s), th * s, lean)}"/>`).join('')}</g>`;
  let sparks = '';
  for (let i = 0; i < 9 + seed % 5; i++) { const sx = x + (R() - .5) * w * 1.3 + wind * h * .4, sy = y - h * (.65 + R() * .85), l = .6 + R() * 1.6, a = (R() - .5) * .8 + wind * .5; sparks += `<path d="M${f(sx)} ${f(sy)}l${f(Math.sin(a) * l)} ${f(-Math.cos(a) * l)}" stroke="${R() > .5 ? '#ffd98a' : '#ff9a3a'}" stroke-width="${f(.25 + R() * .35)}" stroke-linecap="round" opacity="${f(.45 + R() * .5)}"/>`; }
  return (o.glow === false ? '' : localGlow(u, { x, y: y - h * .42, radius: Math.max(w, h) * 2.3, color: '#ff9a3a', power: .72 }, { core: false }))
    + `<defs>${edgeFilter(e, box, seed + 2, 1.8, '0.09 0.05', .3)}</defs><g filter="url(#${e})">${layer(1, '#8e1e0a', .86)}${layer(.84, '#e8601a', .96)}${layer(.63, '#ffb52e', 1)}${layer(.42, '#ffe58a', 1)}${layer(.22, '#fffbe6', .95)}</g>`
    + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w * .42)}" ry="${f(Math.max(.6, h * .045))}" fill="#fff1b8" opacity=".85"/>` + sparks;
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
  let puffs = '';
  if (o.smoke !== false) {
    const n = 6 + seed % 3;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), px = Ln * (.3 + t * .78) + (R() - .5) * Ln * .1, off = Ln * (.12 + R() * .2) * (i % 3 === 2 ? -.7 : 1), r = Ln * (.1 + R() * .1 + t * .05); puffs += `<circle cx="${f(px + upx * off)}" cy="${f(upy * off + (R() - .5) * Ln * .06)}" r="${f(r)}"/>`; }
    puffs = `<g filter="url(#${se})" fill="url(#${sg})" opacity=".88">${puffs}</g>`;
  }
  const box = [-Ln * .5, -Ln * .8, Ln * 2.2, Ln * 1.6];
  return (o.glow === false ? '' : localGlow(u, { x: x + Math.cos(a) * Ln * .32, y: y + Math.sin(a) * Ln * .32, radius: Ln * 1.5, color: '#ffc070', power: .8 }, { core: false }))
    + `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(dir)})"><defs>${linGrad(g1, 0, 0, Ln, 0, [[0, '#fff3c0', 1], [.22, '#ffc040', .96], [.55, '#ff7a1e', .85], [.85, '#d8380c', .55], [1, '#a82408', .2]])}${linGrad(g2, 0, 0, Ln * .8, 0, [[0, '#fffbe8', 1], [.4, '#ffe07a', .98], [.8, '#ffab32', .8], [1, '#ff8a22', .35]])}`
    + radGrad(sg, Ln * .42, 0, Ln * .85, [[0, '#ffd9a0', .95], [.3, '#d8b08a', .9], [.62, '#a39a90', .8], [1, '#7c7670', .55]]) + edgeFilter(e, box, seed + 4, 1.6, '0.1 0.08', .3) + edgeFilter(se, box, seed + 9, 2.6, '0.07 0.07', .7) + `</defs>`
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
  const X = (xb, y) => vx + (xb - vx) * (y - hz) / (bot - hz), sT = (top - hz) / (bot - hz), d = L.at(100, (top + bot) / 2), I = clamp(-d.dy * .9 + .12, -.2, 1);
  const id = nid('dk', u), cid = nid('dc', u), far = mix(L.tone(kind, I, 100, top), L.pal.sky[3], clamp(L.haze * .45)), near = L.tone(kind, I - .22, 100, bot), seam = mix(L.tone(kind, -.1, 100, bot), '#1c0f08', .55), lit = L.tone(kind, 1, 100, bot);
  let defs = linGrad(id, 0, top, 0, bot, [[0, far], [.5, L.tone(kind, I - .06, 100, (top + bot) / 2)], [1, near]]) + `<clipPath id="${cid}"><rect x="0" y="${f(top)}" width="${W}" height="${f(bot - top)}"/></clipPath>`;
  let body = `<rect x="0" y="${f(top)}" width="${W}" height="${f(bot - top)}" fill="url(#${id})"/>`;
  const i0 = Math.floor((vx - vx / sT - vx) / pwd) - 1, i1 = Math.ceil(((W - vx) / sT) / pwd) + 1, off = R() * pwd;
  for (let i = i0; i <= i1; i++) {
    const xa = vx + i * pwd + off, xb = xa + pwd, v = (R() - .5) * .16;
    body += `<path d="M${f(X(xa, top))} ${f(top)}L${f(X(xb, top))} ${f(top)}L${f(xb)} ${f(bot)}L${f(xa)} ${f(bot)}Z" fill="${v > 0 ? lit : seam}" opacity="${f(Math.abs(v))}"/>`;
    for (let k = 0; k < 3; k++) { const gx = xa + pwd * (.15 + R() * .7), s0 = lerp(sT, 1, R() * .7), s1 = Math.min(1.05, s0 + .1 + R() * .4), y0 = hz + (bot - hz) * s0, y1 = hz + (bot - hz) * s1; body += `<path d="M${f(X(gx, y0))} ${f(y0)}L${f(X(gx + (R() - .5) * 2, y1))} ${f(y1)}" stroke="${k % 2 ? seam : lit}" stroke-width="${f(.2 + .3 * s1)}" opacity="${f(.14 + .12 * R())}"/>`; }
    for (let k = 0; k < 2; k++) if (R() > .35) { const s = lerp(sT, 1.05, R()), y = hz + (bot - hz) * s, t = (y - top) / (bot - top), nr = .25 + .5 * t;
      body += `<path d="M${f(X(xa, y))} ${f(y)}L${f(X(xb, y))} ${f(y)}" stroke="${seam}" stroke-width="${f(.25 + .7 * t)}" opacity=".85"/><path d="M${f(X(xa, y))} ${f(y + .3 + .5 * t)}L${f(X(xb, y))} ${f(y + .3 + .5 * t)}" stroke="${lit}" stroke-width="${f(.15 + .25 * t)}" opacity=".3"/>`
        + [.2, .8].map(q => `<ellipse cx="${f(X(xa + pwd * q, y))}" cy="${f(y - 1 - 2.4 * t)}" rx="${f(nr)}" ry="${f(nr * .6)}" fill="${seam}" opacity=".8"/><ellipse cx="${f(X(xa + pwd * q, y))}" cy="${f(y + 1 + 2.4 * t)}" rx="${f(nr)}" ry="${f(nr * .6)}" fill="${seam}" opacity=".8"/>`).join(''); }
    body += `<path d="M${f(X(xa, top) - .08)} ${f(top)}L${f(X(xa, top) + .08)} ${f(top)}L${f(xa + .55)} ${f(bot)}L${f(xa - .55)} ${f(bot)}Z" fill="${seam}" opacity=".88"/><path d="M${f(X(xa, top) + .1)} ${f(top)}L${f(xa + .95)} ${f(bot)}L${f(xa + .6)} ${f(bot)}Z" fill="${lit}" opacity=".28"/>`;
  }
  if (o.wet && L.source && L.front) { const g = nid('dw', u), fl = nid('df', u), sx = L.source.x, c = mix(L.keyColor, '#ffffff', .3); defs += linGrad(g, 0, top, 0, bot, [[0, c, .42], [1, c, .1]]) + blurFilter(fl, [0, top - 6, W, bot - top + 12], '3 1');
    body += `<path d="M${f(X(sx, top) - 2)} ${f(top)}L${f(X(sx, top) + 2)} ${f(top)}L${f(lerp(vx, sx, (bot - hz) / Math.max(1, top - hz)) + 16)} ${f(bot)}L${f(lerp(vx, sx, (bot - hz) / Math.max(1, top - hz)) - 16)} ${f(bot)}Z" fill="url(#${g})" filter="url(#${fl})"/>`; }
  return `<defs>${defs}</defs><g clip-path="url(#${cid})">${body}</g><path d="M0 ${f(top)}h${W}" stroke="${seam}" stroke-width=".8"/><path d="M0 ${f(top + .7)}h${W}" stroke="${lit}" stroke-width=".4" opacity=".4"/>`;
}

module.exports = { sky, sunMoon, cloud, cloudBank, water, foam, reflection, splash, fog, smoke, fire, muzzleFlash, deck };
