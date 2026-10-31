// Shared helpers of the portrait scenes (200 x 420 scene box, the camera cuts the 200 x 280 picture out of it):
// sky, sea, ships under way, light, fire, smoke, rope; and the pieces several cards share (night sky, gun deck,
// arms, underwater light). Used by portrait.cjs and the deck files portrait-*.cjs.
const { DEFS, P } = require('./art.cjs');
Object.assign(P, require('./pieces4.cjs'));
const { img, put } = require('./art3.cjs');
const { halo, lantern, cloudBand, woodTex, motes, R } = require('./bg4.cjs');
const { afloat, shadow } = require('./helpers4.cjs');
const W = 200, VH = 280, H = 420;
let fid = 0;
const uid = p => p + (fid++);

const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const sky = (u, y, h, stops) => { const id = 'psk' + u + (fid++); return grad(id, stops) + `<rect y="${y}" width="${W}" height="${h}" fill="url(#${id})"/>`; };

// Sea from the horizon y0 down to y1: perspective streaks, a glitter path under the light, darker near the viewer.
function sea(u, y0, y1, c1, c2, c3, streak, light, lx, seed = 3) {
  const f = 'psw' + u + (fid++), h = y1 - y0;
  return grad(f + 'g', [[0, c1], [.3, c2], [1, c3]])
    + `<filter id="${f}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.12" numOctaves="3" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3.4 0 0 0 -1.9"/></filter>
    <filter id="${f}d" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.007 0.06" numOctaves="3" seed="${seed + 9}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 .05  0 0 0 0 .1  3 0 0 0 -1.5"/></filter>
    <rect y="${y0}" width="${W}" height="${h}" fill="url(#${f}g)"/><rect y="${y0}" width="${W}" height="${h}" filter="url(#${f}d)" opacity=".55"/>
    <g opacity=".5" style="mix-blend-mode:screen"><rect y="${y0}" width="${W}" height="${h}" filter="url(#${f})" fill="${streak}"/></g>
    ${light ? Array.from({ length: 22 }, (_, k) => { const r = R(k + 5); const yy = y0 + 1 + k * k * .22 + r() * 1.5, w = 4 + k * 1.8 + r() * 6; return yy < y1 ? `<path d="M${(lx - w / 2 + (r() - .5) * k * 1.6).toFixed(1)} ${yy.toFixed(1)}h${w.toFixed(1)}" stroke="${light}" stroke-width="${(.5 + k * .07).toFixed(2)}" opacity="${Math.max(.15, .9 - k * .04).toFixed(2)}"/>` : ''; }).join('') : ''}
    <path d="M0 ${y0 + .4}h${W}" stroke="${streak}" stroke-width=".6" opacity=".7"/>`;
}
// Rolling swell in the foreground: rows of wave crests, larger and further apart towards the viewer.
const swell = (y0, y1, col, op = .5, seed = 4) => { const r = R(seed); let out = ''; for (let y = y0, k = 0; y < y1; k++) { const g = 3 + k * 1.3; for (let x = -10 + r() * 20; x < W; x += 18 + k * 4 + r() * 10) { const w = 8 + k * 2.4; out += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(w / 2).toFixed(1)} ${(-1.2 - k * .25).toFixed(1)} ${w.toFixed(1)} 0" stroke="${col}" stroke-width="${(.5 + k * .08).toFixed(2)}" fill="none" opacity="${op}"/>`; } y += g; } return out; };
const isles = (y, col, op = .55) => `<path d="M0 ${y}q8 -5 18 -3t20 -2q6 -3 12 1t10 4z" fill="${col}" opacity="${op}"/><path d="M128 ${y}q10 -9 22 -7q8 -5 16 -1q10 1 14 8z" fill="${col}" opacity="${op * .8}"/>`;
const gulls = (list, col = '#3a4a54') => list.map(([x, y, s]) => `<path d="M${x - 3 * s} ${y}q${1.5 * s} ${-1.6 * s} ${3 * s} 0q${1.5 * s} ${-1.6 * s} ${3 * s} 0" stroke="${col}" stroke-width="${.5 * s}" fill="none"/>`).join('');
const plankFloor = (u, y, h, c1, c2, seam, seed) => woodTex(u, 0, y, W, h, c1, c2, seam, 10, false, seed);
const beam = (u, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/><path d="M${x} ${y + 1}h${w}" stroke="#c08a52" stroke-width=".5" opacity=".6"/>`;
const vignette = (u, vh = VH) => `<radialGradient id="pvig${u}" cx=".5" cy=".42" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140a04" stop-opacity=".45"/></radialGradient><rect width="${W}" height="${vh}" fill="url(#pvig${u})"/>`;

// The ghost ship's deck at full height: green fog over a dark sea, the rail hung with weed, a barnacled deck.
const ghostDeck = u => sky(u, 0, 100, [[0, '#0b1715'], [.6, '#1f3a34'], [1, '#365a50']])
  + cloudBand(u, 0, 66, '#7aa094', '#0e1a18', 51, 2.1) + halo(152, 30, 44, '#b8e8d8', .32) + `<circle cx="152" cy="30" r="6" fill="#dff4ec" opacity=".8"/>`
  + `<rect y="80" width="${W}" height="6" fill="#3a3024"/><path d="M0 80h200" stroke="#6a5a44" stroke-width=".6"/>`
  + Array.from({ length: 10 }, (_, k) => `<rect x="${k * 21 + 3}" y="86" width="3.6" height="22" fill="#30281e"/><path d="M${k * 21 + 3.6} 86v22" stroke="#6a5a44" stroke-width=".4"/>`).join('')
  + woodTex(u, 0, 108, W, H - 108, '#3e3428', '#1a140e', '#100b07', 10, false, 9) + `<path d="M0 108h200" stroke="#5a4a36" stroke-width="2.4"/>`
  + (() => { const r = R(4); return Array.from({ length: 16 }, () => { const x = r() * 200, y = 116 + r() * 156, s = .5 + r() * .7; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" opacity=".75"><ellipse cx="0" cy="1.4" rx="5" ry="1.4" fill="#2a3a22" opacity=".6"/><path d="M-2 1l.8 -3h2.4l.8 3z" fill="#8a8c74"/><ellipse cy="-2" rx="1" ry=".4" fill="#2a2a20"/></g>`; }).join(''); })()
  + [18, 66, 120, 172].map(x => `<path d="M${x} 86q3 8 -1 14q4 3 1 6" stroke="#3a7a5a" stroke-width="1.2" fill="none" opacity=".8"/>`).join('')
  + grad('pmist' + u, [[0, '#b8f0d8', 0], [.4, '#b8f0d8', .12], [1, '#b8f0d8', 0]]) + `<rect y="90" width="${W}" height="80" fill="url(#pmist${u})"/>`
  + motes(20, 0, 0, 200, 110, '#c8f8e8', 3);
// A ship under way in open water: the hull is cut at the waterline (nothing of it shows under the surface),
// a dark band of shadow and short broken streaks stand in for the reflection, foam runs along the waterline.
function sailing(k, x, y, s, r, u, bowLeft = true) {
  const d = bowLeft ? -1 : 1; // the bow points to x + d * hw
  const w = 64 * s, wl = y + .205 * w, hw = w * .36, id = 'psl' + u + (fid++);
  const cut = `<clipPath id="${id}"><rect x="${x - w}" y="${y - w}" width="${2 * w}" height="${wl - y + w}"/></clipPath>`;
  const shade = `<ellipse cx="${x}" cy="${wl + 2.4}" rx="${hw * 1.02}" ry="${(w * .03).toFixed(2)}" fill="#04121a" opacity=".45" filter="url(#soft${u})"/>`
    + Array.from({ length: 7 }, (_, i) => { const yy = wl + 3 + i * 2.6, ww = hw * (1.5 - i * .16); return `<path d="M${(x - ww / 2 + (i % 2 ? 6 : -4)).toFixed(1)} ${yy.toFixed(1)}h${ww.toFixed(1)}" stroke="#0a1e28" stroke-width="${(1.2 - i * .1).toFixed(2)}" opacity="${(.32 - i * .04).toFixed(2)}"/>`; }).join('');
  const r2 = R(k.length + 3);
  const foam = Array.from({ length: 9 }, (_, i) => { const x0 = x - hw + i * hw * .22 + r2() * 3, ww = 4 + r2() * 7; return `<path d="M${x0.toFixed(1)} ${(wl + r2() * .8).toFixed(1)}q${(ww / 2).toFixed(1)} -1.2 ${ww.toFixed(1)} 0" stroke="#f4fcff" stroke-width="${(.7 + r2() * .6).toFixed(2)}" fill="none" opacity="${(.55 + r2() * .35).toFixed(2)}"/>`; }).join('')
    + `<g transform="translate(${x} 0) scale(${d} 1)"><path d="M${hw - 6} ${wl - 1}q8 -4 16 -3q-4 3 -2 6q-8 1 -14 -3z" fill="#f4fcff" opacity=".8"/>`
    + `<path d="M${-hw + 2} ${wl + .5}q-14 1 -30 4M${-hw + 4} ${wl + 2}q-18 3 -36 9" stroke="#f4fcff" stroke-width=".8" fill="none" opacity=".55"/></g>`;
  return `${cut}${shade}<g clip-path="url(#${id})">${img(k, x, y, s, r, u)}</g>${foam}`;
}
const cup = (u, x, y, flip = false) => `<g transform="translate(${x} ${y}) scale(1.25)" filter="url(#drop${u})">${flip ? `<path d="M-7 0l1.6 -15h10.8l1.6 15z" fill="url(#leather${u})" stroke="#1a0e06" stroke-width=".6"/><ellipse cx="0" cy="-15" rx="5.4" ry="1.4" fill="#5a3418"/><ellipse cx="0" cy="0" rx="7" ry="1.6" fill="#2a1608"/>` : `<path d="M-5.4 0l-1.6 -15h14l-1.6 15z" fill="url(#leather${u})" stroke="#1a0e06" stroke-width=".6"/><ellipse cx="0" cy="-15" rx="7" ry="1.8" fill="#1a0e06"/><ellipse cx="0" cy="0" rx="5.4" ry="1.3" fill="#5a3418"/>`}<path d="M-4 -12v10" stroke="#e8c49a" stroke-width=".8" opacity=".35"/></g>`;
const dieP = (u, x, y, a, pips) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(1.25)" filter="url(#drop${u})"><rect x="-4.4" y="-4.4" width="8.8" height="8.8" rx="1.6" fill="#f4ecd8" stroke="#6a5a40" stroke-width=".5"/>${pips.map(([a2, b2]) => `<circle cx="${a2 * 2.4}" cy="${b2 * 2.4}" r=".8" fill="#2a1a0a"/>`).join('')}</g>`;

// ——— finishing touches: light, fire, smoke, rope (docs/tasks/card-art-polish.md, «Как рисовать») ———
const blurF = (id, sd) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
// light poured over what is already drawn (screen blend): a lantern's pool, daylight from a port, moonlight
const glow = (u, x, y, rx, ry, col, op) => { const id = 'pgl' + u + (fid++); return `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset=".45" stop-color="${col}" stop-opacity="${(op * .35).toFixed(3)}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})" style="mix-blend-mode:screen"/>`; };
// darkness growing away from the light (multiply), from (x1,y1) clear to (x2,y2) dark
const gloom = (u, x1, y1, x2, y2, op, col = '#1a0e06') => { const id = 'pgm' + u + (fid++); return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset="1" stop-color="${col}" stop-opacity="${op}"/></linearGradient><rect width="${W}" height="${H}" fill="url(#${id})" style="mix-blend-mode:multiply"/>`; };
// shafts of light from a window or the sun: soft wedges from (x,y)
const shafts = (u, x, y, list, col, op) => { const f = 'psh' + u + (fid++); return blurF(f, 2.4) + `<g filter="url(#${f})" style="mix-blend-mode:screen">${list.map(([a, b, c, d]) => `<path d="M${x} ${y}L${a} ${b}L${c} ${d}z" fill="${col}" opacity="${op}"/>`).join('')}</g>`; };
// fire in layers: dark red rim, orange body, yellow core, white heart, sparks above
function flame(u, x, y, s, seed = 3) {
  const f = 'pfl' + u + (fid++), r = R(seed);
  const tongue = (w, h, col, op) => `<path d="M${-w} 0q${-w * .25} ${-h * .5} ${w * .1} ${-h}q${w * .3} ${h * .35} ${w * .55} ${h * .12}q${w * .25} ${-h * .3} ${w * .45} ${-h * .62}q${w * .55} ${h * .55} ${w * .9} ${h * 1.5}z" fill="${col}" opacity="${op}"/>`;
  return blurF(f, .45) + `<g transform="translate(${x} ${y}) scale(${s})"><g filter="url(#${f})">${tongue(9, 22, '#7a1a08', .9)}${tongue(7, 18, '#e0601a', .95)}${tongue(4.6, 12.5, '#ffc23a', 1)}${tongue(2.4, 7, '#fff4c8', 1)}</g>`
    + Array.from({ length: 8 }, () => `<circle cx="${((r() - .5) * 18).toFixed(1)}" cy="${(-16 - r() * 20).toFixed(1)}" r="${(.3 + r() * .5).toFixed(2)}" fill="#ffd27a" opacity="${(.5 + r() * .5).toFixed(2)}"/>`).join('') + `</g>`;
}
// smoke: puffs of different size, shaded below, thinning out as the wind carries them (dx: -1 left, 1 right)
function smoke(u, x, y, s, n = 6, dx = 1, seed = 5, col = '#ddd6ca', rise = 30) {
  const f = 'psm' + u + (fid++), g = 'psg' + u + (fid++), r = R(seed);
  let out = `<radialGradient id="${g}" cx=".42" cy=".32" r=".62"><stop offset="0" stop-color="${col}"/><stop offset=".65" stop-color="${col}" stop-opacity=".8"/><stop offset="1" stop-color="#5a544c" stop-opacity="0"/></radialGradient>` + blurF(f, 1) + `<g filter="url(#${f})" transform="translate(${x} ${y}) scale(${s})">`;
  for (let i = 0; i < n; i++) { const t = i / Math.max(1, n - 1); out += `<circle cx="${(dx * t * 26 + (r() - .5) * 6).toFixed(1)}" cy="${(-t * rise + (r() - .5) * 4).toFixed(1)}" r="${(4.5 + t * 7 + r() * 3).toFixed(1)}" fill="url(#${g})" opacity="${(.85 - t * .55).toFixed(2)}"/>`; }
  return out + '</g>';
}
// a laid rope: dark core and light strands twisting round it
const rope = (d, w = 1.2) => `<path d="${d}" stroke="#6a4a24" stroke-width="${(w + .7).toFixed(2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#d4b07a" stroke-width="${w}" fill="none" stroke-dasharray="${(w * .9).toFixed(2)} ${(w * .7).toFixed(2)}"/>`;
const coil = (x, y, r, n = 4) => Array.from({ length: n }, (_, i) => { const rr = r - i * 1.7; return `<ellipse cx="${x}" cy="${(y - i * 1.2).toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * .36).toFixed(2)}" fill="none" stroke="#6a4a24" stroke-width="2"/><ellipse cx="${x}" cy="${(y - i * 1.2).toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * .36).toFixed(2)}" fill="none" stroke="#d4b07a" stroke-width="1.2" stroke-dasharray="1 .8"/>`; }).join('');
// iron nail heads / treenails along a plank seam
const nails = (pts, col = '#2a180a', r = .5) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .35}" fill="#c89868" opacity=".5"/>`).join('');


// ——— pieces many portrait cards share ———
const f1 = v => (+v).toFixed(1), f2 = v => (+v).toFixed(2);
// stars: small dots, a few larger ones with a soft glint
const stars = (n, x, y, w, h, seed = 7, col = '#fff8e0') => { const r = R(seed); return Array.from({ length: n }, (_, k) => { const sx = x + r() * w, sy = y + r() * h, rr = .25 + r() * .55, big = k % 9 === 0; return `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${f2(big ? rr + .4 : rr)}" fill="${col}" opacity="${f2(.35 + r() * .6)}"/>` + (big ? `<path d="M${f1(sx - 2.4)} ${f1(sy)}h4.8M${f1(sx)} ${f1(sy - 2.4)}v4.8" stroke="${col}" stroke-width=".25" opacity=".6"/>` : ''); }).join(''); };
// the moon: a halo, the disc lit from one side, grey seas
const moon = (u, x, y, r = 8, col = '#f6f0d8', haloCol = '#dfe8ff', op = .45) => { const g = uid('pmn' + u); return glow(u, x, y, r * 7, r * 7, haloCol, op)
  + `<radialGradient id="${g}" cx=".38" cy=".36" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="${col}"/><stop offset="1" stop-color="#b8b4a0"/></radialGradient><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/>`
  + `<circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .15)}" r="${f2(r * .22)}" fill="#c8c2aa" opacity=".6"/><circle cx="${f1(x + r * .25)}" cy="${f1(y + r * .3)}" r="${f2(r * .16)}" fill="#c8c2aa" opacity=".5"/><circle cx="${f1(x + r * .1)}" cy="${f1(y - r * .45)}" r="${f2(r * .1)}" fill="#c8c2aa" opacity=".5"/>`; };
// recolour a drawn group to the scene's light: m = [r, g, b] multipliers and a = [r, g, b] added
const tint = (body, m, a = [0, 0, 0], sat = 1) => { const id = uid('ptn'); const [r, g, b] = m, [ar, ag, ab] = a;
  return `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${sat}"/><feColorMatrix type="matrix" values="${r} 0 0 0 ${ar}  0 ${g} 0 0 ${ag}  0 0 ${b} 0 ${ab}  0 0 0 1 0"/></filter><g filter="url(#${id})">${body}</g>`; };
const NIGHT = [[.5, .56, .7], [0, .01, .03], .4], DUSK = [[1, .66, .5], [.06, 0, 0], .9], GHOSTLY = [[.5, .78, .68], [0, .04, .03], .5], DAY = [[1, 1, 1], [0, 0, 0], 1];
const lit = (body, t) => tint(body, t[0], t[1], t[2]);
// a round shot with its cold highlight; a short blurred trail behind it (from x0,y0), a thin smoke tail
const ball = (u, x, y, r = 3) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="url(#ball${u})" stroke="#0a0a0a" stroke-width=".3"/><circle cx="${f1(x - r * .35)}" cy="${f1(y - r * .35)}" r="${f2(r * .3)}" fill="#dfe6ea" opacity=".7"/>`;
function shot(u, x0, y0, x, y, r = 3, smokeCol = '#d8d2c6') {
  const id = uid('pst' + u), g = uid('psg' + u);
  return `<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x}" y2="${y}"><stop offset="0" stop-color="${smokeCol}" stop-opacity="0"/><stop offset="1" stop-color="${smokeCol}" stop-opacity=".55"/></linearGradient>`
    + blurF(id, .8) + `<path d="M${x0} ${y0}L${x} ${y}" stroke="url(#${g})" stroke-width="${f2(r * 1.6)}" stroke-linecap="round" filter="url(#${id})"/>`
    + `<path d="M${f1(x - (x - x0) * .25)} ${f1(y - (y - y0) * .25)}L${x} ${y}" stroke="#2a2a2a" stroke-width="${f2(r * 1.6)}" stroke-linecap="round" opacity=".35" filter="url(#${id})"/>` + ball(u, x, y, r);
}
// a gun's flash: a short bright cone pointing at angle a (degrees), a white heart, a glow, a ring of smoke
function muzzle(u, x, y, a, s = 1, smokeCol = '#e8e2d6') {
  const g = uid('pmz' + u), f = uid('pmf' + u);
  return glow(u, x, y, 26 * s, 20 * s, '#ffcf7a', .7) + blurF(f, .5) + `<radialGradient id="${g}" cx="0" cy=".5" r="1"><stop offset="0" stop-color="#fffbe6"/><stop offset=".35" stop-color="#ffd25a"/><stop offset=".75" stop-color="#ff7a1e" stop-opacity=".7"/><stop offset="1" stop-color="#ff5a10" stop-opacity="0"/></radialGradient>`
    + `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})" filter="url(#${f})"><path d="M0 -3L16 -8Q22 0 16 8L0 3z" fill="url(#${g})"/><path d="M0 -1.6L9 -3Q12 0 9 3L0 1.6z" fill="#fffbe6"/></g>`
    + glow(u, x, y, 7 * s, 6 * s, '#fff6d8', .9);
}
// a hand at the wrist (0,0) pointing along +x; pose: open | fist | pinch | hold (curled round a handle);
// side 1: thumb towards -y (a right hand seen from above with the palm down), -1 the other way
function hand(u, pose = 'open', side = 1, skin) {
  const fl = skin ? skin : `url(#flesh${u})`, st = 'stroke="#6a3a1a" stroke-width=".45"', t = side;
  const palm = `<path d="M0 -5.2C4 -6.6 10 -6.4 13.2 -5.4Q14.6 0 13.4 5.6C9.6 6.8 4 6.6 0 5.2z" fill="${fl}" ${st}/>`;
  const fing = (y, a, l) => `<g transform="translate(12.6 ${y}) rotate(${a})"><rect x="-1" y="-1.45" width="${l}" height="2.9" rx="1.45" fill="${fl}" ${st}/><path d="M${f1(l * .45)} -1.1v2.2M${f1(l * .75)} -1v2" stroke="#a8704c" stroke-width=".3"/><path d="M${f1(l - 2.6)} -.9h1.5" stroke="#f8e2d2" stroke-width=".7" opacity=".8"/></g>`;
  const curl = (y) => `<path d="M12.4 ${f1(y - 1.4)}h3.4a1.45 1.45 0 0 1 0 2.9h-3.4z" fill="${fl}" ${st}/>`;
  const thumb = (a, l) => `<g transform="translate(3.4 ${-4.4 * t}) rotate(${a * t})"><rect x="-1" y="-1.7" width="${l}" height="3.4" rx="1.7" fill="${fl}" ${st}/><path d="M${f1(l - 2.8)} -1v1.4" stroke="#f8e2d2" stroke-width=".6" opacity=".7"/></g>`;
  const ys = [-4.1, -1.4, 1.4, 4.1].map(y => y * t);
  let body;
  if (pose === 'open') body = palm + [[-9, 9], [-3, 10.4], [3, 9.8], [9, 7.6]].map(([a, l], i) => fing(ys[i], a * t, l)).join('') + thumb(-48, 9);
  else if (pose === 'pinch') body = palm + fing(ys[0], -4 * t, 10) + ys.slice(1).map(curl).join('') + thumb(-14, 11.5);
  else if (pose === 'hold') body = palm + ys.map(curl).join('') + thumb(-30, 8.5) + `<path d="M13 ${f1(-5 * t)}q3 ${f1(5 * t)} 0 ${f1(10 * t)}" stroke="#a8704c" stroke-width=".35" fill="none"/>`;
  else body = palm + ys.map(curl).join('') + thumb(-6, 8);
  return body + `<path d="M3 -2.6q4 -1 8 -.6M3 2.4q4 1 8 .6" stroke="#a8704c" stroke-width=".3" fill="none" opacity=".7"/><path d="M1 -4.4q6 -1.6 11.6 -.8" stroke="#ffe4cc" stroke-width=".8" fill="none" opacity=".45"/>`;
}
// an arm from (x0,y0) at the edge of the picture to the wrist (x1,y1): a sleeve with folds and a cuff, then the
// hand. o: { w0, w1 (sleeve widths), cloth, dark (fold colour), cuff (colour or 'lace'), bare (0..1, the rolled-up
// part shows the forearm), pose, side, s (hand scale), twist (extra hand angle) }
function arm(u, x0, y0, x1, y1, o = {}) {
  const w0 = o.w0 || 16, w1 = o.w1 || 10, cl = o.cloth || '#2a2a34', dk = o.dark || '#0e0e14', s = o.s || 1.4;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const bare = o.bare || 0, ex = x0 + dx * (1 - bare), ey = y0 + dy * (1 - bare), we = w0 + (w1 - w0) * (1 - bare);
  const P = (x, y, w, sg) => `${f1(x + nx * w / 2 * sg)} ${f1(y + ny * w / 2 * sg)}`;
  const g = uid('pam' + u);
  let out = `<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${P(x0, y0, w0, 1).replace(' ', '" y1="')}" x2="${P(x0, y0, w0, -1).replace(' ', '" y2="')}"><stop offset="0" stop-color="${o.light || cl}"/><stop offset=".45" stop-color="${cl}"/><stop offset="1" stop-color="${dk}"/></linearGradient>`;
  if (bare) { const wf = w1 * .82; out += `<path d="M${P(ex, ey, we * .78, 1)}L${P(x1, y1, wf, 1)}L${P(x1, y1, wf, -1)}L${P(ex, ey, we * .78, -1)}z" fill="url(#flesh${u})" stroke="#6a3a1a" stroke-width=".45"/>` + (o.hair ? Array.from({ length: 8 }, (_, k) => { const t = .15 + k * .1; return `<path d="M${P(ex + (x1 - ex) * t, ey + (y1 - ey) * t, we * .3 * (k % 2 ? 1 : -1), 1)}l${f1(dx / L * 1.4)} ${f1(dy / L * 1.4)}" stroke="#6a4a2a" stroke-width=".25" opacity=".6"/>`; }).join('') : '') + (o.tattoo ? o.tattoo(ex + (x1 - ex) * .45, ey + (y1 - ey) * .45, ang) : ''); }
  out += `<path d="M${P(x0, y0, w0, 1)}L${P(ex, ey, we, 1)}L${P(ex, ey, we, -1)}L${P(x0, y0, w0, -1)}z" fill="url(#${g})" stroke="${dk}" stroke-width=".5"/>`;
  out += [.25, .5, .72].map((t, i) => { const cx = x0 + (ex - x0) * t, cy = y0 + (ey - y0) * t, w = (w0 + (we - w0) * t) * .45; return `<path d="M${P(cx, cy, w * 2, i % 2 ? 1 : -1)}q${f1(dx / L * 3)} ${f1(dy / L * 3)} ${f1(-nx * w * (i % 2 ? 1 : -1) + dx / L * 2)} ${f1(-ny * w * (i % 2 ? 1 : -1) + dy / L * 2)}" stroke="${dk}" stroke-width=".6" fill="none" opacity=".6"/>`; }).join('');
  if (bare) out += `<path d="M${P(ex, ey, we * 1.08, 1)}L${P(ex, ey, we * 1.08, -1)}" stroke="${o.light || cl}" stroke-width="3.2" stroke-linecap="round"/><path d="M${P(ex, ey, we * 1.08, 1)}L${P(ex, ey, we * 1.08, -1)}" stroke="${dk}" stroke-width=".5" opacity=".7" transform="translate(${f1(dx / L * 1.4)} ${f1(dy / L * 1.4)})"/>`;
  else if (o.cuff === 'lace') out += `<g transform="translate(${f1(x1)} ${f1(y1)}) rotate(${f1(ang)})">${Array.from({ length: 7 }, (_, k) => `<path d="M-3 ${f1(-w1 / 2 - 1.5 + k * (w1 + 3) / 6)}q4.5 -1 6 .6q-3 1.2 -6 .6" fill="#f6f0e2" stroke="#b8ae98" stroke-width=".3"/>`).join('')}<path d="M-4 ${f1(-w1 / 2 - 1)}v${f1(w1 + 2)}" stroke="#f6f0e2" stroke-width="2.2"/></g>`;
  else if (o.cuff) out += `<g transform="translate(${f1(x1)} ${f1(y1)}) rotate(${f1(ang)})"><rect x="-5" y="${f1(-w1 / 2 - .8)}" width="5" height="${f1(w1 + 1.6)}" rx="1" fill="${o.cuff}" stroke="${dk}" stroke-width=".4"/><path d="M-4.2 ${f1(-w1 / 2)}v${f1(w1)}" stroke="#ffffff" stroke-width=".4" opacity=".35"/></g>`;
  return out + `<g transform="translate(${f1(x1)} ${f1(y1)}) rotate(${f1(ang + (o.twist || 0))}) scale(${s})">${o.hand || hand(u, o.pose, o.side, o.skin)}</g>`;
}
// a playing card face down: the deck's back pattern of waves and a rosette, no signs; sx/sy squash it for perspective
function cardBack(u, x, y, a = 0, s = 1, sy = 1, col = '#2a3a5a', edge = '#e8d6aa') {
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s} ${f2(s * sy)})" filter="url(#drop${u})"><rect x="-9" y="-13" width="18" height="26" rx="1.6" fill="${edge}" stroke="#5a4a30" stroke-width=".4"/><rect x="-7.6" y="-11.6" width="15.2" height="23.2" rx="1" fill="${col}"/>`
    + [-7, -3, 1, 5, 9].map(yy => `<path d="M-7 ${yy}q1.9 -1.4 3.8 0t3.8 0t3.8 0t3.4 0" stroke="#c9a048" stroke-width=".35" fill="none" opacity=".6"/>`).join('')
    + `<circle r="3.4" fill="${col}" stroke="#c9a048" stroke-width=".6"/><path d="M0 -2.6L.8 0L0 2.6L-.8 0zM-2.6 0L0 -.8L2.6 0L0 .8z" fill="#e8c46a"/><rect x="-6.6" y="-10.6" width="13.2" height="21.2" rx=".8" fill="none" stroke="#c9a048" stroke-width=".4"/>`
    + `<path d="M-8.6 -12.4h17" stroke="#ffffff" stroke-width=".5" opacity=".5"/></g>`;
}
// sand with ripples and grains from y0 down
const sand = (u, y0, y1, c1, c2, seed = 5, grain = '#fff4d8') => { const g = uid('psd' + u), r = R(seed);
  return grad(g, [[0, c1], [1, c2]]) + `<rect y="${y0}" width="${W}" height="${y1 - y0}" fill="url(#${g})"/>`
    + Array.from({ length: 14 }, () => { const x = r() * 200, y = y0 + 6 + r() * (y1 - y0 - 10), w = 14 + r() * 30; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(w * .14)}" fill="${r() > .5 ? '#000' : grain}" opacity="${f2(.05 + r() * .06)}"/>`; }).join('')
    + Array.from({ length: 46 }, () => { const x = r() * 200, y = y0 + 3 + r() * (y1 - y0), w = 2 + (y - y0) * .05 + r() * 4; return `<path d="M${f1(x)} ${f1(y)}q${f1(w / 2)} ${f1(-.6 - w * .05)} ${f1(w)} 0" stroke="#000" stroke-width="${f2(.3 + (y - y0) * .002)}" fill="none" opacity=".16"/><path d="M${f1(x)} ${f1(y - .5)}q${f1(w / 2)} ${f1(-.6 - w * .05)} ${f1(w)} 0" stroke="${grain}" stroke-width=".3" fill="none" opacity=".25"/>`; }).join('')
    + Array.from({ length: 70 }, () => `<circle cx="${f1(r() * 200)}" cy="${f1(y0 + r() * (y1 - y0))}" r="${f2(.2 + r() * .4)}" fill="${r() > .5 ? grain : '#5a4628'}" opacity="${f2(.25 + r() * .4)}"/>`).join(''); };
// the path of light on the water under the sun or moon: broken glints of different length, narrow and pale at the
// horizon, wider and brighter towards the viewer
const glint = (u, lx, y0, y1, col, seed = 3) => { const r = R(seed + 40); let out = ''; for (let k = 0, y = y0 + 1; y < y1 && k < 40; k++) { const spread = 3 + k * 2.2, n = 1 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const w = 1.5 + r() * (2 + k * .7), x = lx + (r() - .5) * spread * 2; out += `<path d="M${f1(x - w / 2)} ${f1(y)}h${f1(w)}" stroke="${col}" stroke-width="${f2(.35 + k * .045)}" stroke-linecap="round" opacity="${f2(Math.max(.12, (.95 - k * .022) * (.5 + r() * .5)))}"/>`; } y += .8 + k * .32 + r() * .8; } return out; };
const seaG = (u, y0, y1, c1, c2, c3, streak, light, lx, seed = 3) => sea(u, y0, y1, c1, c2, c3, streak, '', lx, seed) + (light ? glint(u, lx, y0, y1, light, seed) : '');
// a table top seen in a high ¾ view: planks running away from us towards a vanishing point, grain, the far edge
const tableTop = (u, y, h, c1 = '#6a4424', c2 = '#3a2410', seed = 5) => { const g = uid('ptt' + u), r = R(seed), vy = y - 300, y2 = y + h;
  const X = (xt, yy) => 100 + (xt - 100) * (yy - vy) / (y - vy);
  let out = grad(g, [[0, c2], [.5, c1], [1, c2]]) + `<rect y="${y}" width="${W}" height="${h}" fill="url(#${g})"/>`;
  for (let xt = -60; xt <= 260; xt += 13) { out += `<path d="M${f1(xt)} ${y}L${f1(X(xt, y2))} ${y2}" stroke="#140a04" stroke-width=".8" opacity=".7"/><path d="M${f1(xt + .8)} ${y}L${f1(X(xt + .8, y2))} ${y2}" stroke="#e0b07a" stroke-width=".35" opacity=".25"/>`;
    for (let i = 0; i < 2; i++) { const t = r() * .8, xx = xt + 3 + r() * 7, yy = y + t * h * .6; out += `<path d="M${f1(X(xx, yy))} ${f1(yy)}q${f1(r() * 2 - 1)} ${f1(10 + r() * 20)} 0 ${f1(20 + r() * 30)}" stroke="#1a0e06" stroke-width=".3" fill="none" opacity=".4"/>`; }
    if (r() > .6) { const yy = y + r() * h * .7; out += `<path d="M${f1(X(xt, yy))} ${f1(yy)}h${f1(13 * (yy - vy) / (y - vy))}" stroke="#140a04" stroke-width=".6" opacity=".6"/>`; } }
  return out + `<path d="M0 ${y}h200" stroke="#0e0804" stroke-width="1.2"/><path d="M0 ${y + 1.2}h200" stroke="#d4a066" stroke-width=".6" opacity=".6"/>`; };
// rising bubbles; seaweed swaying from the bottom; a small fish
const bubbles = (n, x, y, w, h, seed = 3, col = '#d8fff4') => { const r = R(seed); return Array.from({ length: n }, () => { const bx = x + r() * w, by = y + r() * h, rr = .5 + r() * 1.8; return `<circle cx="${f1(bx)}" cy="${f1(by)}" r="${f2(rr)}" fill="none" stroke="${col}" stroke-width=".35" opacity="${f2(.4 + r() * .4)}"/><circle cx="${f1(bx - rr * .35)}" cy="${f1(by - rr * .35)}" r="${f2(rr * .3)}" fill="${col}" opacity=".6"/>`; }).join(''); };
const weed = (x, y, h, col = '#2e6a4a', seed = 2, lean = 1) => { const r = R(seed); return Array.from({ length: 3 }, (_, i) => { const xx = x + (i - 1) * 2.4, hh = h * (.7 + r() * .4), sw = (3 + r() * 3) * lean; return `<path d="M${f1(xx)} ${y}q${f1(sw)} ${f1(-hh * .3)} 0 ${f1(-hh * .55)}t${f1(sw * .6)} ${f1(-hh * .45)}" stroke="${col}" stroke-width="${f2(1.4 - i * .25)}" fill="none" stroke-linecap="round" opacity=".85"/>`; }).join(''); };
const fish = (x, y, s = 1, dir = 1, col = '#7aa8a8') => `<g transform="translate(${x} ${y}) scale(${dir * s} ${s})"><path d="M-6 0q3 -3 8 -2q3 1 4 2q-1 1 -4 2q-5 1 -8 -2zM-6 0l-3 -2.6v5.2z" fill="${col}" opacity=".8"/><circle cx="3.6" cy="-.4" r=".4" fill="#0a1a1a"/><path d="M-4 -1q4 -1.6 8 -.4" stroke="#e8fff8" stroke-width=".3" fill="none" opacity=".6"/></g>`;
// a glass bottle: dark glass, a highlight, the liquid line, a cork or wax seal
function bottle(u, x, y, s = 1, glassCol = '#1e3a24', liquid = '#5a2a0a', level = .5, seal = '#7a1a14') {
  const g = uid('pbt' + u);
  return `<g transform="translate(${x} ${y}) scale(${s})"><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${glassCol}"/><stop offset=".25" stop-color="#9ac8a8" stop-opacity=".9"/><stop offset=".4" stop-color="${glassCol}"/><stop offset="1" stop-color="#050a06"/></linearGradient>`
    + `<ellipse cx="0" cy="0" rx="7" ry="1.6" fill="#000" opacity=".4"/><path d="M-6 0v-20q0 -5 4 -7v-7h4v7q4 2 4 7v20q-6 2 -12 0z" fill="url(#${g})" stroke="#050a06" stroke-width=".5"/>`
    + `<path d="M-5.4 -.6v${f1(-19 * level)}h10.8v${f1(19 * level)}q-5.4 1.6 -10.8 0z" fill="${liquid}" opacity=".55"/><path d="M-4 -19v15" stroke="#e8fff0" stroke-width=".9" opacity=".45"/>`
    + `<path d="M-2.4 -34h4.8v3.4h-4.8z" fill="${seal}"/><path d="M-2.8 -31q2.8 2.2 5.6 0" stroke="${seal}" stroke-width="1.2" fill="none"/></g>`;
}

module.exports = { DEFS, P, img, put, halo, lantern, cloudBand, woodTex, motes, R, afloat, shadow, W, VH, H, uid, grad, sky, sea, swell, isles, gulls, plankFloor, beam, vignette, ghostDeck, sailing, cup, dieP, blurF, glow, gloom, shafts, flame, smoke, rope, coil, nails, f1, f2, stars, moon, tint, lit, NIGHT, DUSK, GHOSTLY, DAY, ball, shot, muzzle, hand, arm, cardBack, sand, bubbles, weed, fish, tableTop, bottle, glint, seaG };
