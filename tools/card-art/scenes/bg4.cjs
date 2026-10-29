// Painted backgrounds, fourth pass: depth (far / middle / near), one light per scene, procedural textures
// (feTurbulence) for clouds, water, wood, stone, paper; haze, light shafts, reflections. 200 x 120.
const { palm } = require('./art3.cjs');
const R = s => () => (s = (s * 9301 + 49297) % 233280) / 233280;
let fid = 0;
// a band of painted clouds: turbulence turned into soft alpha, a lit top and a shaded underside
function cloudBand(u, y, h, lit, shade, seed, dens = 2.1, freq = '0.011 0.034') {
  const f = 'cb' + u + (fid++);
  return `<filter id="${f}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="5" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.2 0 0 0 -${dens}" result="a"/><feGaussianBlur in="a" stdDeviation=".6" result="ab"/>
    <feFlood flood-color="${shade}" result="c1"/><feComposite in="c1" in2="ab" operator="in" result="sh"/>
    <feOffset in="ab" dy="-1.6" result="ao"/><feFlood flood-color="${lit}" result="c2"/><feComposite in="c2" in2="ao" operator="in" result="li"/>
    <feComposite in="li" in2="ab" operator="in" result="li2"/><feMerge><feMergeNode in="sh"/><feMergeNode in="li2"/></feMerge></filter>
    <linearGradient id="${f}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff"/><stop offset=".75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${f}k"><rect x="0" y="${y}" width="200" height="${h}" fill="url(#${f}m)"/></mask>
    <rect x="0" y="${y}" width="200" height="${h}" filter="url(#${f})" mask="url(#${f}k)"/>`;
}
// sea surface: base gradient, turbulence streaks (perspective: finer near the horizon), glitter column under the light
function sea(u, y0, c1, c2, c3, streak, light, lx, seed = 3) {
  const f = 'sw' + u + (fid++);
  return `<linearGradient id="${f}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".35" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
    <filter id="${f}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.16" numOctaves="3" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3.4 0 0 0 -1.9"/></filter>
    <filter id="${f}d" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.09" numOctaves="3" seed="${seed + 9}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 .05  0 0 0 0 .1  3 0 0 0 -1.5"/></filter>
    <rect y="${y0}" width="200" height="${120 - y0}" fill="url(#${f}g)"/>
    <rect y="${y0}" width="200" height="${120 - y0}" filter="url(#${f}d)" opacity=".55"/>
    <g opacity=".5" style="mix-blend-mode:screen"><rect y="${y0}" width="200" height="${120 - y0}" filter="url(#${f})" fill="${streak}"/></g>
    ${light ? `<linearGradient id="${f}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}" stop-opacity=".9"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></linearGradient>
      ${Array.from({ length: 16 }, (_, k) => { const r = R(k + 5); const yy = y0 + 1 + k * k * .18 + r() * 1.5, w = 4 + k * 1.6 + r() * 6; return `<path d="M${lx - w / 2 + (r() - .5) * k * 1.4} ${yy.toFixed(1)}h${w.toFixed(1)}" stroke="${light}" stroke-width="${(.5 + k * .06).toFixed(2)}" opacity="${(.9 - k * .05).toFixed(2)}"/>`; }).join('')}` : ''}
    <path d="M0 ${y0 + .4}h200" stroke="${streak}" stroke-width=".6" opacity=".7"/>`;
}
function grainOverlay(u, op = .07, col = '#3a2410') {
  const f = 'gr' + u + (fid++);
  return `<filter id="${f}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -1.1"/></filter>
    <rect width="200" height="120" filter="url(#${f})" fill="${col}" opacity="${op}"/>`;
}
function woodTex(u, x, y, w, h, base1, base2, seam, plank = 12, vertical = false, seed = 2) {
  const f = 'wd' + u + (fid++);
  const freq = vertical ? '0.45 0.012' : '0.012 0.45';
  const seams = vertical ? Array.from({ length: Math.ceil(w / plank) + 1 }, (_, k) => `<path d="M${x + k * plank} ${y}v${h}" stroke="${seam}" stroke-width="1.1"/><path d="M${x + k * plank + 1.2} ${y}v${h}" stroke="#ffe0b0" stroke-width=".4" opacity=".25"/>`).join('')
    : Array.from({ length: Math.ceil(h / plank) + 1 }, (_, k) => `<path d="M${x} ${y + k * plank}h${w}" stroke="${seam}" stroke-width="1.1"/><path d="M${x} ${y + k * plank + 1.2}h${w}" stroke="#ffe0b0" stroke-width=".4" opacity=".25"/>${Array.from({ length: 3 }, (_, j) => `<path d="M${x + ((k * 53 + j * 71) % w)} ${y + k * plank}v${plank}" stroke="${seam}" stroke-width=".8" opacity=".8"/>`).join('')}`).join('');
  return `<linearGradient id="${f}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${base1}"/><stop offset="1" stop-color="${base2}"/></linearGradient>
    <filter id="${f}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .1  0 0 0 0 .05  0 0 0 0 0  2.6 0 0 0 -1.15"/></filter>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${f}g)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${f})" opacity=".55"/>${seams}`;
}
function stoneTex(u, x, y, w, h, c1, c2, mortar, bw = 18, bh = 8) {
  const f = 'st' + u + (fid++);
  let blocks = ''; for (let r = 0; r * bh < h; r++) for (let c = -1; c * bw < w; c++) { const xx = x + c * bw + (r % 2) * bw / 2; blocks += `<rect x="${xx + .6}" y="${y + r * bh + .6}" width="${bw - 1.2}" height="${bh - 1.2}" rx="1" fill="${(r * 7 + c * 3) % 3 ? c1 : c2}"/><path d="M${xx + 1} ${y + r * bh + 1.2}h${bw - 3}" stroke="#fff" stroke-width=".4" opacity=".2"/>`; }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mortar}"/>${blocks}
    <filter id="${f}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".25" numOctaves="3" seed="8" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2 0 0 0 -.9"/></filter><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${f})" opacity=".25"/>`;
}
const skyGrad = (u, id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient><rect width="200" height="120" fill="url(#${id})"/>`;
const halo = (x, y, r, col, op = .9) => `<radialGradient id="h${x}${y}${r}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset=".35" stop-color="${col}" stop-opacity="${op * .35}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient><circle cx="${x}" cy="${y}" r="${r}" fill="url(#h${x}${y}${r})"/>`;
const shafts = (x, y, list, col, op = .1) => list.map(([a, w]) => `<path d="M${x} ${y}l${a - w} 130h${2 * w}z" fill="${col}" opacity="${op}"/>`).join('');
const land = (pts, fill, op = 1) => `<path d="${pts}" fill="${fill}" opacity="${op}"/>`;
const motes = (n, x, y, w, h, col, seed = 6) => { const r = R(seed); return Array.from({ length: n }, () => `<circle cx="${(x + r() * w).toFixed(1)}" cy="${(y + r() * h).toFixed(1)}" r="${(.3 + r() * .6).toFixed(2)}" fill="${col}" opacity="${(.3 + r() * .5).toFixed(2)}"/>`).join(''); };
const starsF = (n, h, seed = 7) => { const r = R(seed); return Array.from({ length: n }, () => { const s = r(); return `<circle cx="${(r() * 200).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(.25 + s * .7).toFixed(2)}" fill="#fff8e0" opacity="${(.3 + s * .7).toFixed(2)}"/>`; }).join(''); };
const farIsles = (y, col, op = .55) => land(`M0 ${y}q8 -5 18 -3t20 -2q6 -3 12 1t10 4z`, col, op) + land(`M120 ${y}q10 -9 22 -7q8 -5 16 -1q10 1 14 8z`, col, op * .8) + land(`M170 ${y}q6 -3 14 -2t16 2z`, col, op * .6);
const ship = (x, y, s, col = '#4a5a64', op = .55) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="M-14 0h28l-4 4h-20z" fill="${col}"/><path d="M-6 0v-16M4 0v-18" stroke="${col}" stroke-width=".8"/><path d="M-11 -14q5 2 10 0v10q-5 2 -10 0zM-1 -16q5 2 10 0v12q-5 2 -10 0z" fill="${col}"/></g>`;
const gulls = (list, col = '#3a3a3a') => list.map(([x, y, s]) => `<path d="M${x - 3 * s} ${y}q${1.5 * s} ${-1.6 * s} ${3 * s} 0q${1.5 * s} ${-1.6 * s} ${3 * s} 0" stroke="${col}" stroke-width="${.5 * s}" fill="none"/>`).join('');
const lantern = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${halo(0, 4, 26, '#ffb24a', .55)}<path d="M0 -14v6" stroke="#2a1a0a" stroke-width=".8"/><path d="M-5 -8h10l-1 3h-8z" fill="#3a2a14"/><rect x="-4" y="-5" width="8" height="12" rx="1" fill="#ffd27a" stroke="#3a2a14" stroke-width="1"/><path d="M0 -5v12M-4 1h8" stroke="#3a2a14" stroke-width=".6"/><path d="M0 -1q2 2 0 5q-2 -3 0 -5z" fill="#fff6c8"/><path d="M-5 7h10l-1 2h-8z" fill="#3a2a14"/></g>`;
const candle = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${halo(0, -10, 22, '#ffc060', .6)}<path d="M-3 -6h6v14h-6z" fill="#efe2c4"/><path d="M-3 -6q1 4 0 8" stroke="#d6c4a0" stroke-width=".9" fill="none"/><path d="M0 -6v-2" stroke="#2a1a0a" stroke-width=".6"/><path d="M0 -14q3 4 0 7q-3 -3 0 -7z" fill="#ffc23a"/><path d="M0 -12q1.5 2 0 4q-1.5 -2 0 -4z" fill="#fff6c8"/><ellipse cx="0" cy="8" rx="6" ry="1.6" fill="#8a6a3a"/></g>`;

const BG = {
  seaDay: (u, o = {}) => { const sx = o.sx || 160; return skyGrad(u, 'sk' + u, [[0, '#6fa6c8'], [.45, '#b7d4dc'], [.62, '#efe6c8'], [.64, '#f6e2b2']])
    + halo(sx, 22, 46, '#fff4cc', .85) + `<circle cx="${sx}" cy="22" r="7.5" fill="#fffbe6"/>`
    + cloudBand(u, 4, 40, '#fffaf0', '#b9c4cc', 11, 2.15) + cloudBand(u, 36, 26, '#fff4dc', '#c8c0b0', 23, 2.4, '0.016 0.06')
    + (o.island ? '' : farIsles(76, '#7e9aa0', .55)) + (o.ships !== false ? ship(40, 75, .45) + ship(176, 75.5, .3) : '')
    + (o.island ? `<path d="M${o.island - 40} 77q12 -16 30 -18q14 -12 26 -2q14 2 24 20z" fill="#7a9a7a"/><path d="M${o.island - 40} 77q14 -11 30 -13q14 -8 26 -1q14 2 24 14z" fill="#5a7c5a"/><path d="M${o.island - 40} 77h80" stroke="#e8e0c0" stroke-width="1.6"/>${palm(o.island - 8, 66, .3)}${palm(o.island + 4, 67, .24, -1)}` : '')
    + sea(u, 76.5, '#5c9aa8', '#2c6a7c', '#0e3442', '#e8fbff', '#fff6d6', sx)
    + gulls([[60, 30, 1], [70, 26, .8], [130, 40, .7]], '#4a5a64'); },
  seaSunset: (u, o = {}) => skyGrad(u, 'sk' + u, [[0, '#2e2440'], [.3, '#7a3a50'], [.5, '#d0684a'], [.62, '#f6b060'], [.64, '#ffd890']])
    + halo(100, 74, 70, '#ffcf80', .8) + `<path d="M86 76.5a14 14 0 0 1 28 0z" fill="#ffe8b0"/>`
    + cloudBand(u, 10, 34, '#ffb080', '#5a2a3a', 17, 2.2) + cloudBand(u, 44, 22, '#ffd0a0', '#8a3a3a', 29, 2.5, '0.02 0.08')
    + farIsles(76.5, '#4a2a3a', .8) + sea(u, 76.5, '#c06a4a', '#5a3040', '#1a1424', '#ffc890', '#ffe0a0', 100)
    + gulls([[60, 50, 1], [70, 46, .8]], '#2a1a24'),
  seaNight: (u, o = {}) => { const mx = o.mx || 156; return skyGrad(u, 'sk' + u, [[0, '#060e1c'], [.5, '#14283e'], [.64, '#2e4a5e']])
    + starsF(70, 70) + halo(mx, 24, 44, '#e8f0ff', .55) + `<circle cx="${mx}" cy="24" r="8" fill="#f6f2e0"/><circle cx="${mx + 2.6}" cy="21.6" r="2" fill="#e2d8c0"/><circle cx="${mx - 2}" cy="27" r="1.4" fill="#e2d8c0"/><circle cx="${mx - 3}" cy="21" r=".9" fill="#e2d8c0"/>`
    + cloudBand(u, 8, 40, '#8aa0b8', '#1a2a3e', 13, 2.35) + farIsles(76.5, '#0e1a26', .9)
    + sea(u, 76.5, '#2a4a60', '#12283a', '#04090e', '#9ab8d0', '#fff6dc', mx); },
  seaStorm: (u) => skyGrad(u, 'sk' + u, [[0, '#141a22'], [.5, '#3a4650'], [.64, '#6a7680']])
    + cloudBand(u, 0, 60, '#8a96a0', '#1a2028', 31, 1.7, '0.009 0.028') + cloudBand(u, 30, 40, '#6a7680', '#20262e', 41, 1.9)
    + `<path d="M150 0l-6 18 5 -1 -8 20 4 -1 -6 18" stroke="#e8f4ff" stroke-width="1.4" fill="none" opacity=".9"/>${halo(146, 30, 40, '#cfe8ff', .35)}`
    + farIsles(74, '#2a3238', .7) + sea(u, 74, '#4a6068', '#22363e', '#0a1418', '#e8f4f4', null, 0)
    + Array.from({ length: 11 }, (_, k) => { const x = (k * 37) % 210 - 8, y = 80 + (k * 13) % 34, w = 12 + (k % 4) * 5; return `<path d="M${x} ${y}q${w * .3} ${-2.6 - (k % 3)} ${w * .6} -.6q${w * .25} 1.6 ${w * .4} 2.4q${-w * .5} -.8 ${-w} -1.8z" fill="#eef6f6" opacity=".55"/><path d="M${x + w * .5} ${y - 1}q${w * .4} 2 ${w * .7} 2.8" stroke="#ffffff" stroke-width=".5" fill="none" opacity=".6"/>`; }).join('')
    + (() => { const r = R(5); return Array.from({ length: 90 }, () => { const x = r() * 230 - 15, y = r() * 120; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l-2.6 8" stroke="#d8e6ee" stroke-width=".45" opacity="${(.25 + r() * .4).toFixed(2)}"/>`; }).join(''); })(),
  fireSea: (u) => skyGrad(u, 'sk' + u, [[0, '#120604'], [.35, '#4a160a'], [.62, '#c8501c'], [.68, '#f2a050']])
    + halo(100, 70, 90, '#ff8a30', .55) + cloudBand(u, 0, 50, '#c86030', '#1a0806', 37, 1.9, '0.012 0.04') + cloudBand(u, 30, 30, '#e88040', '#2a0e08', 43, 2.2)
    + farIsles(80, '#1a0806', .85) + sea(u, 80, '#a0441c', '#4a1a0e', '#100404', '#ffb060', '#ffd080', 100)
    + motes(40, 0, 0, 200, 80, '#ffcf6a', 11),
  underwater: (u) => skyGrad(u, 'sk' + u, [[0, '#9ad6c8'], [.15, '#4a9a8e'], [.6, '#1a5650'], [1, '#06201e']])
    + (() => { const f = 'uw' + u; return `<filter id="${f}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.02" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 .95  4 0 0 0 -2.3"/></filter><linearGradient id="${f}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${f}k"><rect width="200" height="20" fill="url(#${f}m)"/></mask><rect y="0" width="200" height="20" filter="url(#${f})" opacity=".55" mask="url(#${f}k)"/>`; })()
    + shafts(110, -10, [[-70, 8], [-30, 6], [10, 9], [50, 7], [90, 6]], '#eafff6', .08)
    + `<path d="M0 98q30 -14 60 -8t70 -6t70 10v26h-200z" fill="#3e3a28"/><path d="M0 104q40 -10 80 -2t120 -6v24h-200z" fill="#2a2a1c"/>`
    + [[12, 100, 1], [180, 98, 1.3], [146, 104, .8], [44, 104, .7], [96, 106, .6]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q-6 -12 2 -24q-8 10 -6 24M3 0q8 -10 0 -26M6 0q10 -8 6 -18" stroke="#2f6a4a" stroke-width="2" fill="none"/><path d="M3 0q8 -10 0 -26" stroke="#5a9a6a" stroke-width=".6" fill="none"/></g>`).join('')
    + motes(30, 0, 10, 200, 90, '#dffaf2', 9),
  dutchDeck: (u) => skyGrad(u, 'sk' + u, [[0, '#0e1a18'], [.6, '#24403a'], [1, '#3a5a50']])
    + cloudBand(u, 0, 50, '#7aa094', '#0e1a18', 51, 2.1) + halo(160, 20, 40, '#b8e8d8', .3)
    + woodTex(u, 0, 64, 200, 56, '#3e3428', '#1e1810', '#120c08', 9)
    + `<rect x="0" y="40" width="200" height="6" fill="#3a3024"/>${Array.from({ length: 10 }, (_, k) => `<rect x="${k * 22 + 3}" y="44" width="3.4" height="21" fill="#30281e"/><path d="M${k * 22 + 3.6} 44v21" stroke="#6a5a44" stroke-width=".4"/>`).join('')}<path d="M0 64h200" stroke="#5a4a36" stroke-width="2.4"/>`
    + (() => { const r = R(4); return Array.from({ length: 9 }, () => { const x = r() * 200, y = 70 + r() * 46, s = .5 + r() * .5; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" opacity=".75"><ellipse cx="0" cy="1.4" rx="5" ry="1.4" fill="#2a3a22" opacity=".6"/><path d="M-2 1l.8 -3h2.4l.8 3z" fill="#8a8c74"/><ellipse cy="-2" rx="1" ry=".4" fill="#2a2a20"/></g>`; }).join(''); })()
    + [24, 96, 170].map(x => `<path d="M${x} 46q3 8 -1 14q4 3 1 6" stroke="#3a7a5a" stroke-width="1.2" fill="none" opacity=".8"/>`).join('')
    + `<rect width="200" height="120" fill="#b8f0d8" opacity=".06"/>` + motes(16, 0, 0, 200, 60, '#c8f8e8', 3),
  gunDeck: (u, o = {}) => { const ports = o.ports || [[150, 46]]; return woodTex(u, 0, 0, 200, 96, '#4a2e18', '#24140a', '#120a04', 14, true, 7)
    + `<rect width="200" height="10" fill="#1a0e06"/>${[30, 110, 190].map(x => `<rect x="${x - 6}" y="0" width="12" height="96" fill="#2a180a"/><path d="M${x - 5} 0v96" stroke="#7a4e2a" stroke-width=".6"/>`).join('')}`
    + ports.map(([x, y]) => `<rect x="${x - 19}" y="${y - 15}" width="38" height="30" fill="#0e0804"/><g><clipPath id="pc${u}${x}"><rect x="${x - 16}" y="${y - 12}" width="32" height="24"/></clipPath><g clip-path="url(#pc${u}${x})">${skyGrad(u, 'ps' + u + x, [[0, '#8ab8cc'], [.5, '#e8e0c4'], [.55, '#4a8494'], [1, '#14404c']]).replace('<rect width="200" height="120"', `<rect x="${x - 16}" y="${y - 12}" width="32" height="24"`)}${ship(x + 6, y + 1, .4, '#3a4a50', .7)}</g></g><rect x="${x - 16}" y="${y - 12}" width="32" height="24" fill="none" stroke="#3a2210" stroke-width="2"/><path d="M${x - 19} ${y - 15}h38" stroke="#8a5a30" stroke-width="1.4"/>${halo(x, y + 10, 34, '#cfe8f0', .25)}`).join('')
    + woodTex(u, 0, 96, 200, 24, '#5a3818', '#2e1c0c', '#140a04', 8)
    + (o.lamp !== false ? lantern(o.lx || 24, 22, 1.1) : '') + motes(20, 0, 0, 200, 90, '#ffd8a0', 8); },
  shipDeck: (u, o = {}) => BG.seaDay(u, { sx: o.sx || 160 }) + BG.deckFront(u),
  deckFront: (u) => woodTex(u, 0, 86, 200, 34, '#a87444', '#5e3a1c', '#2a1608', 8)
    + `<path d="M0 70h200v4h-200z" fill="#6e4526"/><path d="M0 70h200" stroke="#c79260" stroke-width=".8"/>${Array.from({ length: 13 }, (_, k) => `<path d="M${k * 16 + 4} 74v12" stroke="#4a2c14" stroke-width="2.6"/><path d="M${k * 16 + 3.4} 74v12" stroke="#a87444" stroke-width=".6"/>`).join('')}<path d="M0 86h200" stroke="#3a2210" stroke-width="2"/>`
    + `<path d="M6 0L58 70M194 0L148 70M18 0L64 70" stroke="#3a2a18" stroke-width=".7" opacity=".8"/>`,
  cabin: (u, o = {}) => woodTex(u, 0, 0, 200, 72, '#5e3a20', '#2e1c0e', '#1a0e06', 16, true, 3)
    + (o.window !== false ? (() => { const wx = o.wx ?? 118; return `<g transform="translate(${wx} 6)"><rect x="-4" y="-4" width="80" height="58" rx="3" fill="#2a180a"/><rect width="72" height="50" fill="#140c06"/>
      ${skyGrad(u, 'cw' + u, o.night ? [[0, '#0a1626'], [.6, '#22405a'], [.62, '#1a3448'], [1, '#081420']] : [[0, '#8ab8cc'], [.6, '#efe6c8'], [.62, '#4a8494'], [1, '#14404c']]).replace('<rect width="200" height="120"', '<rect x="1" y="1" width="70" height="48"')}
      ${o.night ? `${halo(52, 14, 16, '#e8f0ff', .6)}<circle cx="52" cy="14" r="3.6" fill="#f6f0d8"/>${Array.from({ length: 6 }, (_, k) => `<circle cx="${8 + k * 11}" cy="${6 + (k % 3) * 5}" r=".4" fill="#fff"/>`).join('')}` : `<circle cx="54" cy="14" r="4" fill="#fffbe6"/>`}
      ${[0, 1, 2].map(c => `<path d="M${1 + c * 23.5} 1v48" stroke="#2a180a" stroke-width="2"/>`).join('')}<path d="M1 25h70" stroke="#2a180a" stroke-width="2"/><rect x="1" y="1" width="70" height="48" fill="none" stroke="#c9a048" stroke-width=".8" opacity=".6"/></g>${halo(wx + 36, 40, 60, o.night ? '#8ab0d0' : '#fff0c8', .18)}`; })() : '')
    + woodTex(u, 0, 72, 200, 48, '#7a4e2a', '#3e2412', '#1e1006', 12, false, 5) + `<path d="M0 72h200" stroke="#c08a52" stroke-width="1.6"/><path d="M0 74h200" stroke="#1e1006" stroke-width="1"/>`
    + (o.map !== false ? `<g transform="rotate(-4 60 98)" filter="url(#drop${u})"><path d="M4 76h116l2 44h-120z" fill="#eedcb0"/><path d="M4 76h116l2 44h-120z" fill="url(#vigpaper${u})"/>
      <path d="M18 92q14 -10 30 -4q12 -8 22 2q-6 10 -20 8q-16 6 -32 -6z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/><path d="M78 100q10 -8 22 -2q4 8 -8 10q-12 0 -14 -8z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/>
      <path d="M40 104q20 -8 44 -4" stroke="#a8302a" stroke-width=".7" stroke-dasharray="2 1.5" fill="none"/><path d="M84 98l3 3M87 98l-3 3" stroke="#a8302a" stroke-width=".9"/>
      <g transform="translate(108 86)">${Array.from({ length: 8 }, (_, k) => `<path d="M0 0L${Math.cos(k * Math.PI / 4) * 7} ${Math.sin(k * Math.PI / 4) * 7}" stroke="#9a7a50" stroke-width=".4"/>`).join('')}</g></g>
      <radialGradient id="vigpaper${u}" cx=".5" cy=".4" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#7a5020" stop-opacity=".35"/></radialGradient>` : '')
    + halo(o.gx ?? 30, 44, 70, '#ffb050', .3) + motes(14, 0, 0, 200, 70, '#ffe0b0', 12),
  town: (u) => skyGrad(u, 'sk' + u, [[0, '#7ab4d4'], [.7, '#d4e4e0'], [1, '#f2e6c8']]) + halo(30, 18, 40, '#fff4cc', .8)
    + cloudBand(u, 2, 30, '#fffaf0', '#b9c4cc', 61, 2.3)
    + land('M0 40q20 -12 44 -8t40 -6t50 8t66 -4v30h-200z', '#8aa8a0', .5) + `<path d="M150 30v-14l4 -4 4 4v14z" fill="#c8b898"/><path d="M150 16h8" stroke="#8a6a4a"/>`
    + [[-4, 34, 50, '#e8c89a', '#b85a3a'], [44, 26, 46, '#d8a8a0', '#9a4a3a'], [88, 38, 42, '#e6d4a8', '#b8603a'], [128, 22, 76, '#b8ccb4', '#8a4a30']].map(([x, y, w, c, roof], k) => `<rect x="${x}" y="${y}" width="${w}" height="${96 - y}" fill="${c}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${96 - y}" fill="url(#vigwall${u})"/><path d="M${x - 3} ${y}h${w + 6}l-5 -7h${-w + 4}z" fill="${roof}"/>${Array.from({ length: Math.floor(w / 6) }, (_, j) => `<path d="M${x - 1 + j * 6} ${y - 1}l2 -5" stroke="#6a2a1a" stroke-width=".5" opacity=".6"/>`).join('')}
      ${[0, 1, 2].map(i2 => `<g transform="translate(${x + 7 + i2 * (w - 14) / 3} ${y + 10})"><rect width="${(w - 24) / 3}" height="13" rx="${(w - 24) / 6}" fill="#2a1e14"/><rect x="1" y="1" width="${(w - 24) / 3 - 2}" height="11" rx="${(w - 24) / 6 - 1}" fill="#3a2e24"/><path d="M-1 13.5h${(w - 24) / 3 + 2}" stroke="#7a5a3a" stroke-width="1.2"/><path d="M0 0v13M${(w - 24) / 3} 0v13" stroke="${['#3a6a5a', '#2a5a7a', '#6a3a2a', '#3a6a5a'][k]}" stroke-width="2"/></g>`).join('')}
      <path d="M${x + w / 2 - 7} 96v-15a7 7 0 0 1 14 0v15z" fill="#3a2414"/><path d="M${x + w / 2} 81v15" stroke="#1a0e06" stroke-width=".6"/>`).join('')
    + `<linearGradient id="vigwall${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".15"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <g transform="translate(67 21)"><rect x="-16" y="-5" width="32" height="10" fill="#3a2414"/><rect x="-15" y="-4" width="30" height="8" fill="#e8d8b0"/><text x="0" y="2.2" font-family="Alegreya SC,serif" font-size="6" text-anchor="middle" fill="#3a2414" letter-spacing=".8">БАНК</text></g>`
    + palm(198, 96, .62, -1) + palm(6, 98, .5)
    + `<path d="M0 96h200v24h-200z" fill="#c8ac80"/>${(() => { const r = R(9); return Array.from({ length: 60 }, () => `<ellipse cx="${(r() * 200).toFixed(1)}" cy="${(97 + r() * 22).toFixed(1)}" rx="${(3 + r() * 4).toFixed(1)}" ry="${(1 + r() * 1.2).toFixed(1)}" fill="${r() > .5 ? '#b8986c' : '#d8c094'}" opacity=".8"/>`).join(''); })()}`
    + `<path d="M0 96h200" stroke="#8a7050" stroke-width="1"/>` + gulls([[110, 12, 1], [118, 9, .8]], '#3a4a54'),
  tavern: (u) => stoneTex(u, 0, 0, 200, 80, '#7a4a30', '#8a5638', '#3a2414', 24, 9)
    + halo(36, 26, 80, '#ffb050', .45) + lantern(36, 20, 1.2)
    + `<g transform="translate(150 6)"><rect width="44" height="44" fill="#3a2414"/><rect x="2" y="2" width="40" height="40" fill="#1a2a3a"/>${halo(30, 12, 12, '#e8f0ff', .5)}<circle cx="30" cy="12" r="3" fill="#f6f0d8"/><path d="M22 2v40M2 22h40" stroke="#3a2414" stroke-width="2"/></g>`
    + `<g transform="translate(70 30)"><path d="M-30 0h60" stroke="#4a2e16" stroke-width="3"/>${[-22, -10, 2, 14, 24].map((x, k) => `<g transform="translate(${x} -1)"><path d="M-3 0v-10h6v10z" fill="${['#3e5a2a', '#6a2a1a', '#2a3a4a', '#5a4a1a', '#3a2a1a'][k]}" stroke="#1a0e06" stroke-width=".4"/><path d="M-1 -10v-3h2v3z" fill="#2a1a0a"/><path d="M-2 -8v6" stroke="#fff" stroke-width=".6" opacity=".4"/></g>`).join('')}</g>`
    + woodTex(u, 0, 80, 200, 40, '#7a4e2a', '#3e2412', '#1e1006', 13, false, 9) + `<path d="M0 80h200" stroke="#c08a52" stroke-width="1.8"/><path d="M0 82h200" stroke="#1e1006" stroke-width="1.2"/>`
    + `<g transform="translate(186 70) scale(.7)" filter="url(#drop${u})"><path d="M-12 -16q-5 16 0 32h24q5 -16 0 -32z" fill="url(#oak${u})" stroke="#2a1608"/><path d="M-15 -7h30M-15 7h30" stroke="url(#iron${u})" stroke-width="2.2"/></g>`
    + motes(16, 0, 0, 200, 80, '#ffd8a0', 14),
  swamp: (u) => skyGrad(u, 'sk' + u, [[0, '#0e1a12'], [.5, '#1e2e1c'], [1, '#141c10']])
    + woodTex(u, 0, 0, 200, 92, '#3a2a18', '#1a1208', '#0e0804', 20, true, 11)
    + `<g transform="translate(150 12)"><rect width="40" height="34" fill="#0e1a10"/>${skyGrad(u, 'sw' + u, [[0, '#2a3a2a'], [1, '#4a5a3a']]).replace('<rect width="200" height="120"', '<rect x="2" y="2" width="36" height="30"')}${[4, 14, 26].map(x => `<path d="M${x} 32q2 -14 -2 -28" stroke="#1a2414" stroke-width="2" fill="none"/>`).join('')}<path d="M2 26q18 -4 36 0" stroke="#5a6a4a" stroke-width=".6" fill="none"/><path d="M20 2v30" stroke="#1a1208" stroke-width="2"/></g>`
    + Array.from({ length: 16 }, (_, k) => { const x = 6 + k * 12.5, h = 8 + (k % 4) * 4; return `<g transform="translate(${x} 0)"><path d="M0 0v${h}" stroke="#6a5a3a" stroke-width=".5"/><g transform="translate(0 ${h})" filter="url(#drop${u})"><path d="M-3.4 0h6.8v9q0 3 -3.4 3t-3.4 -3z" fill="${['#5a8a5a', '#8a6a3a', '#4a7a7a', '#7a4a5a'][k % 4]}" opacity=".9" stroke="#1a140c" stroke-width=".5"/><path d="M-2 1v8" stroke="#fff" stroke-width=".6" opacity=".35"/><rect x="-2.2" y="-1.6" width="4.4" height="2" fill="#5a3a1a"/></g></g>`; }).join('')
    + woodTex(u, 0, 92, 200, 28, '#4a3a22', '#241a0e', '#0e0804', 9, false, 13) + `<path d="M0 92h200" stroke="#7a6a3a" stroke-width="1.6"/>`
    + halo(40, 80, 60, '#ffb24a', .35) + halo(160, 84, 50, '#ffb24a', .3) + motes(20, 0, 0, 200, 90, '#e8f0a0', 15) + `<rect width="200" height="120" fill="#4a7a3a" opacity=".07"/>`,
  fort: (u, o = {}) => (o.night ? skyGrad(u, 'sk' + u, [[0, '#0a1424'], [1, '#2e4054']]) + starsF(40, 44) + halo(164, 18, 26, '#e8f0ff', .5) + `<circle cx="164" cy="18" r="6" fill="#f6f0d8"/>` + cloudBand(u, 4, 30, '#5a6e84', '#14202e', 71, 2.4)
      : skyGrad(u, 'sk' + u, [[0, '#8aaabc'], [1, '#e4e0d0']]) + halo(170, 16, 40, '#fff4cc', .7) + cloudBand(u, 0, 40, '#fbf8f0', '#a8b0b4', 73, 2.1))
    + stoneTex(u, 0, 52, 200, 52, o.night ? '#5a5a58' : '#bdb4a0', o.night ? '#4e4e4c' : '#aca490', o.night ? '#2e2e2c' : '#7a7262', 20, 8.5)
    + Array.from({ length: 10 }, (_, k) => `<rect x="${k * 21 + 2}" y="43" width="13" height="10" fill="${o.night ? '#525250' : '#b0a894'}" stroke="${o.night ? '#2e2e2c' : '#7a7262'}" stroke-width=".6"/>`).join('')
    + `<path d="M0 104h200v16h-200z" fill="${o.night ? '#2a2620' : '#9a8a64'}"/>${(() => { const r = R(17); return Array.from({ length: 30 }, () => `<ellipse cx="${(r() * 200).toFixed(1)}" cy="${(106 + r() * 12).toFixed(1)}" rx="${(2 + r() * 4).toFixed(1)}" ry="1" fill="${o.night ? '#3a342c' : '#8a7a56'}"/>`).join(''); })()}`
    + `<path d="M0 104h200" stroke="${o.night ? '#1a1814' : '#6a5a40'}" stroke-width="1"/>`
    + (o.night ? `<rect width="200" height="120" fill="#1a2a44" opacity=".25"/>` : ''),
  office: (u, o = {}) => woodTex(u, 0, 0, 200, 72, '#5a301e', '#3a1e12', '#1e0e06', 20, true, 21)
    + Array.from({ length: 10 }, (_, k) => `<rect x="${k * 20 + 2.5}" y="6" width="15" height="58" fill="none" stroke="#8a5a34" stroke-width=".6" opacity=".7"/>`).join('')
    + `<g transform="translate(12 8)" filter="url(#drop${u})"><rect x="-3" y="-3" width="92" height="58" fill="url(#brass${u})"/><rect width="86" height="52" fill="#ead8ac"/>
      <path d="M8 16q8 -8 20 -2t14 12q-4 8 -14 8t-22 -6zM48 10q14 -6 28 4q4 12 -6 20q-14 4 -20 -6zM34 38q6 -4 12 0t-2 8q-8 0 -10 -8z" fill="#c8ac78" stroke="#8a6a3a" stroke-width=".5"/>
      ${Array.from({ length: 6 }, (_, k) => `<path d="M0 ${k * 9 + 4}h86M${k * 15 + 6} 0v52" stroke="#a88a5a" stroke-width=".25"/>`).join('')}<path d="M22 24q20 -10 46 -4" stroke="#a8302a" stroke-width=".8" stroke-dasharray="2 1.5" fill="none"/>
      <g transform="translate(76 42)">${Array.from({ length: 8 }, (_, k) => `<path d="M0 0L${Math.cos(k * Math.PI / 4) * 6} ${Math.sin(k * Math.PI / 4) * 6}" stroke="#8a6a3a" stroke-width=".4"/>`).join('')}</g></g>`
    + `<g transform="translate(118 6)"><rect x="-3" y="-3" width="76" height="58" fill="#2a160a"/>${skyGrad(u, 'ow' + u, [[0, '#8ab8cc'], [.55, '#efe6c8'], [.57, '#4a8494'], [1, '#14404c']]).replace('<rect width="200" height="120"', '<rect width="70" height="52"')}
      ${ship(28, 30, .8, '#3a4a54', .7)}${ship(52, 31, .5, '#4a5a64', .6)}<path d="M35 0v52M0 26h70" stroke="#2a160a" stroke-width="2.4"/></g>${halo(152, 30, 60, '#fff0c8', .2)}`
    + woodTex(u, 0, 72, 200, 48, '#6a3c1e', '#341c0c', '#1a0c04', 16, false, 23) + `<path d="M0 72h200" stroke="url(#brassH${u})" stroke-width="2"/><path d="M0 74.4h200" stroke="#1a0c04" stroke-width="1"/>`
    + `<rect x="0" y="74" width="200" height="46" fill="#1e5a3a" opacity=".22"/>`,
  singapore: (u) => skyGrad(u, 'sk' + u, [[0, '#120a14'], [1, '#341820']])
    + [0, 1, 2, 3].map(k => `<g transform="translate(${k * 52 + 2} 6)"><rect width="48" height="80" fill="#3a1a12"/><rect x="2" y="2" width="44" height="76" fill="#e8c88a" opacity=".3"/>${Array.from({ length: 5 }, (_, j) => `<path d="M2 ${2 + j * 19}h44M${2 + j * 11} 2v76" stroke="#2a1008" stroke-width=".9"/>`).join('')}${halo(24, 40, 30, '#ffb060', .25)}</g>`).join('')
    + [[28, 14], [96, 8], [168, 16]].map(([x, y]) => `<path d="M${x} 0v${y}" stroke="#1a0e08" stroke-width=".6"/>${halo(x, y + 11, 22, '#ff8a3a', .5)}<g filter="url(#drop${u})"><ellipse cx="${x}" cy="${y + 11}" rx="8.5" ry="10.5" fill="url(#red${u})"/>${[-5, -1.5, 1.5, 5].map(d => `<path d="M${x + d} ${y + 1}q${d * .5} 10 0 20" stroke="#5a1008" stroke-width=".5" fill="none"/>`).join('')}<path d="M${x - 4} ${y}h8v2h-8zM${x - 4} ${y + 20}h8v2h-8z" fill="url(#brass${u})"/><path d="M${x} ${y + 22}v6" stroke="#c9a048" stroke-width=".7"/></g>`).join('')
    + woodTex(u, 0, 86, 200, 34, '#4a2418', '#1e0c08', '#0e0604', 11, false, 31) + `<path d="M0 86h200" stroke="#8a3a24" stroke-width="2"/>`
    + `<g opacity=".35">${(() => { const r = R(2); return Array.from({ length: 6 }, () => `<ellipse cx="${(r() * 200).toFixed(1)}" cy="${(40 + r() * 40).toFixed(1)}" rx="${(20 + r() * 20).toFixed(1)}" ry="6" fill="#f0e0d0" opacity=".25"/>`).join(''); })()}</g>`,
  cave: (u) => skyGrad(u, 'sk' + u, [[0, '#1a2620'], [.5, '#0e1612'], [1, '#060a08']])
    + halo(100, 10, 70, '#f0ffe8', .35) + shafts(100, -6, [[-20, 6], [0, 9], [20, 6]], '#f6ffe8', .12)
    + stoneTex(u, 0, 0, 200, 120, '#2a3630', '#24302a', '#121a16', 26, 14).replace(/<rect x="0" y="0" width="200" height="120" fill="#121a16"\/>/, '<rect x="0" y="0" width="200" height="120" fill="#121a16" opacity=".0"/>')
    + `<path d="M0 0q34 30 22 70t-22 50zM200 0q-38 26 -24 72t24 48zM40 0q10 14 30 16t40 -4t40 4t50 -16z" fill="#0c140f"/>`
    + Array.from({ length: 9 }, (_, k) => `<path d="M${36 + k * 16} 0q2 ${8 + (k % 3) * 6} -1 ${14 + (k % 3) * 8}q-2 4 -3 0" fill="#1a241e"/>`).join('')
    + `<ellipse cx="100" cy="100" rx="74" ry="16" fill="#1e4e4c"/><ellipse cx="100" cy="98" rx="62" ry="10" fill="#4aa8a0" opacity=".5"/>${halo(100, 98, 50, '#bff8ee', .35)}`
    + Array.from({ length: 8 }, (_, k) => `<path d="M${50 + k * 13} ${96 + (k % 2) * 3}q4 -1.6 8 0" stroke="#e8fff8" stroke-width=".7" fill="none" opacity=".6"/>`).join('')
    + `<path d="M0 112q50 -12 100 -6t100 -2v16h-200z" fill="#1a1e16"/>` + motes(26, 40, 0, 120, 100, '#f0ffe8', 18),
  beach: (u) => BG.seaDay(u, { ships: true }) + `<path d="M0 88q60 -12 120 -4t80 4v32h-200z" fill="#e6cfa0"/><path d="M0 88q60 -12 120 -4t80 4" stroke="#fff8e4" stroke-width="2" fill="none"/><path d="M0 90q60 -10 120 -3t80 4" stroke="#c8ae80" stroke-width=".6" fill="none"/>`
    + (() => { const r = R(21); return Array.from({ length: 70 }, () => `<circle cx="${(r() * 200).toFixed(1)}" cy="${(92 + r() * 28).toFixed(1)}" r="${(.3 + r() * .5).toFixed(2)}" fill="${r() > .5 ? '#a8906a' : '#fff4dc'}"/>`).join(''); })()
    + palm(18, 100, 1) + palm(40, 104, .7, -1) + `<path d="M140 108q8 -3 14 0" stroke="#8a7050" stroke-width=".8" fill="none"/>`,
  cove: (u) => BG.seaNight(u, { mx: 44 }) + `<path d="M118 120l12 -44q12 -20 32 -18q22 -6 38 8v54z" fill="#121c24"/><path d="M128 78q12 -18 32 -16q20 -4 40 8" stroke="#4a6070" stroke-width="1" fill="none"/><path d="M130 80q6 10 0 22M170 70q4 16 -4 30" stroke="#22323c" stroke-width="1" fill="none"/><path d="M0 120l6 -28q10 -10 22 -4l8 32z" fill="#121c24"/>`
    + halo(44, 24, 30, '#e8f0ff', .2),
  shipyard: (u) => BG.seaDay(u, { sx: 36, ships: false }) + woodTex(u, 0, 92, 200, 28, '#a07a4c', '#5e4224', '#2a1a0a', 7)
    + Array.from({ length: 7 }, (_, k) => `<path d="M${22 + k * 26} 30v64" stroke="#5a3a1c" stroke-width="2.6"/><path d="M${21.4 + k * 26} 30v64" stroke="#a87444" stroke-width=".6"/>`).join('')
    + `<path d="M22 36h156M22 60h156" stroke="#5a3a1c" stroke-width="1.8"/>${Array.from({ length: 6 }, (_, k) => `<path d="M${22 + k * 26} 36l26 24M${48 + k * 26} 36l-26 24" stroke="#6a4a24" stroke-width=".7"/>`).join('')}
    <path d="M190 0v40" stroke="#5a3a1c" stroke-width="2"/><path d="M190 4l-30 0M190 4l-6 6" stroke="#5a3a1c" stroke-width="1.6"/><path d="M162 4v20" stroke="#8a6a3a" stroke-width=".6"/>`,
};
module.exports = { BG, grainOverlay, halo, lantern, candle, cloudBand, woodTex, stoneTex, sea, motes, R };
