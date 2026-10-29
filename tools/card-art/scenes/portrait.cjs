// Portrait card pictures: a full-card scene in a 200 x 280 box (the card's own 63.5 x 88.9 mm proportion).
// Composition rule for the printed card: what the card is about sits in the upper two thirds (y 20..160);
// the lower third is calm ground (deck, sea, floor) because the text plate covers it.
// Reuses the materials and pieces of the landscape scenes; backgrounds are drawn here at the full height.
const { DEFS, P } = require('./art.cjs');
Object.assign(P, require('./pieces4.cjs')); // the pieces (splash, flash, candleTall …) as the landscape scenes use them
const { img, put } = require('./art3.cjs');
const { halo, lantern, cloudBand, woodTex, motes, R } = require('./bg4.cjs');
const { afloat, shadow } = require('./helpers4.cjs');
const W = 200, H = 280;
let fid = 0;

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
const vignette = u => `<radialGradient id="pvig${u}" cx=".5" cy=".42" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140a04" stop-opacity=".45"/></radialGradient><rect width="${W}" height="${H}" fill="url(#pvig${u})"/>`;

// The ghost ship's deck at full height: green fog over a dark sea, the rail hung with weed, a barnacled deck.
const ghostDeck = u => sky(u, 0, 100, [[0, '#0b1715'], [.6, '#1f3a34'], [1, '#365a50']])
  + cloudBand(u, 0, 66, '#7aa094', '#0e1a18', 51, 2.1) + halo(152, 30, 44, '#b8e8d8', .32) + `<circle cx="152" cy="30" r="6" fill="#dff4ec" opacity=".8"/>`
  + `<rect y="80" width="${W}" height="6" fill="#3a3024"/><path d="M0 80h200" stroke="#6a5a44" stroke-width=".6"/>`
  + Array.from({ length: 10 }, (_, k) => `<rect x="${k * 21 + 3}" y="86" width="3.6" height="22" fill="#30281e"/><path d="M${k * 21 + 3.6} 86v22" stroke="#6a5a44" stroke-width=".4"/>`).join('')
  + woodTex(u, 0, 108, W, 172, '#3e3428', '#1a140e', '#100b07', 10, false, 9) + `<path d="M0 108h200" stroke="#5a4a36" stroke-width="2.4"/>`
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

const SCENES = {
  // Hundred years of service: the hourglass of the ghost ship; its sand turns into the souls of an enemy crew.
  'Сто лет службы': u => {
    const glass = shadow(u, 100, 152, 34, .6) + img('hourglass', 100, 98, 2.3, 0, u)
      + halo(100, 104, 46, '#7fe3d8', .32)
      + Array.from({ length: 14 }, (_, k) => { const r = R(k + 40); const x = 100 + (r() - .5) * 46, y = 60 + r() * 84; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.6 + r() * 1.1).toFixed(2)}" fill="#c8fff4" opacity="${(.35 + r() * .5).toFixed(2)}"/>`; }).join('');
    const irons = `<path d="M38 152q6 8 14 6" stroke="url(#iron${u})" stroke-width="1.6" fill="none"/><circle cx="54" cy="158" r="2.6" fill="none" stroke="url(#iron${u})" stroke-width="1.4"/>`
      + shadow(u, 28, 156, 18, .5) + put('shackle', 28, 150, .7, 0, u);
    return [ghostDeck(u), glass + irons];
  },

  // Liar's dice: a barrel is the table; two leather cups, the dice still rolling. A cup and a die fell to the deck.
  'Игра в кости лжеца': u => {
    const x = 100, top = 106;
    const barrel = shadow(u, x, top + 50, 44, .6) + `<path d="M${x - 32} ${top}q-7 24 0 50h64q7 -26 0 -50z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".8"/>${[-20, -7, 7, 20].map(d => `<path d="M${x + d} ${top + 1}q${d * .2} 24 0 49" stroke="#2a1608" stroke-width=".7" fill="none"/>`).join('')}`
      + `<path d="M${x - 35} ${top + 11}q35 5 70 0M${x - 35} ${top + 37}q35 5 70 0" stroke="url(#iron${u})" stroke-width="3.2" fill="none"/>`
      + `<ellipse cx="${x}" cy="${top}" rx="32" ry="7.4" fill="#7a4e2a" stroke="#1a0e06" stroke-width=".8"/><ellipse cx="${x}" cy="${top}" rx="29" ry="6" fill="#a87444"/>${[-15, -5, 5, 15].map(d => `<path d="M${x + d} ${top - 5.6}v11.2" stroke="#5a3418" stroke-width=".6" opacity=".8"/>`).join('')}<ellipse cx="${x - 9}" cy="${top - 1.4}" rx="11" ry="1.7" fill="#e8b880" opacity=".3"/>`;
    const play = `<g transform="translate(0 0) scale(1)">` + cup(u, 76, top + 1, true) + dieP(u, 97, top - 2, 12, [[-1, -1], [0, 0], [1, 1]]) + dieP(u, 110, top, -8, [[-1, -1], [1, -1], [-1, 1], [1, 1]]) + dieP(u, 102, top + 4, 30, [[0, 0]]) + cup(u, 124, top + 2, false) + `</g>`
      + `<path d="M108 ${top - 9}q4 -3 9 -2M95 ${top - 10}q-3 -3 -8 -2" stroke="#f4ecd8" stroke-width=".6" fill="none" opacity=".6"/>`;
    const fallen = cup(u, 40, 176, true) + dieP(u, 58, 174, 20, [[-1, -1], [1, 1]]);
    const lamp = `<path d="M30 52v14" stroke="#2a2418" stroke-width=".8"/>` + lantern(30, 76, 1.05).replace(/#ffb24a/g, '#9ff0d0');
    return [ghostDeck(u) + lamp, barrel + play + fallen];
  },

  // Gun deck in a cut-away: the gun runs out through the port in the hull side (on the right, seen in section);
  // outside are the sea and the enemy ship, the shot flies at it and lifts a splash beside her.
  'Ядра': u => {
    const HX = 128, HW = 14, FL = 152, by = 120; // hull section x, its thickness, the deck line, the bore height
    const out = HX + HW;
    const wall = woodTex(u, 0, 0, HX, FL, '#4e301a', '#26150a', '#120a04', 14, true, 7)
      + beam(u, 0, 0, HX, 11) + `<path d="M0 11h${HX}" stroke="#0a0502" stroke-width="1.2"/>`
      + `<rect x="15" y="0" width="13" height="${FL}" fill="#2a180a"/><path d="M16 0v${FL}" stroke="#7a4e2a" stroke-width=".6"/><path d="M27 0v${FL}" stroke="#0e0804" stroke-width=".8"/>`;
    const floor = plankFloor(u, FL, H - FL, '#5e3a1a', '#2a180a', '#140a04', 8) + `<path d="M0 ${FL}h${HX}" stroke="#0e0804" stroke-width="2"/><path d="M0 ${FL + 2}h${HX}" stroke="#a87444" stroke-width=".5" opacity=".5"/>`;
    // outside the hull: sky, a far coast, the sea, the enemy with the splash of our shot next to her
    const hz = 112;
    const outside = `<clipPath id="pout${u}"><rect x="${out}" y="0" width="${W - out}" height="${H}"/></clipPath><g clip-path="url(#pout${u})">`
      + sky(u, 0, hz, [[0, '#5d97bd'], [.6, '#a8cad8'], [1, '#efe4c4']]) + halo(184, 30, 30, '#fff4cc', .7)
      + cloudBand(u, 20, 30, '#fffaf0', '#b9c4cc', 13, 2.2)
      + `<path d="M150 ${hz}q12 -6 24 -3q10 -4 26 2v1h-50z" fill="#7e9aa0" opacity=".55"/>`
      + sea(u, hz, H, '#5c9aa8', '#2c6a7c', '#0e3442', '#e8fbff', '#fff6d6', 184)
      + afloat('endeavour', 184, hz - 3, .52, 2, u)
      + put('splash', 166, hz + 6, .3, 0, u, false) + `<ellipse cx="166" cy="${hz + 7}" rx="6" ry="1" fill="#f4fcff" opacity=".6"/>`
      + `<path d="M${out + 8} ${by - 4}Q158 ${by - 24} 166 ${hz}" stroke="#ffffff" stroke-width=".6" stroke-dasharray="1.4 1.6" fill="none" opacity=".7"/>`
      + `<circle cx="161" cy="${by - 14}" r="1.6" fill="#1a1a1a"/>`
      + `</g>`;
    // the hull in section: thick frames and planking, the port cut through it, the lid hauled up outside
    const ph = 26, pt = by - ph / 2;
    const hull = `<path d="M${HX} 0h${HW}v${pt}h${-HW}zM${HX} ${pt + ph}h${HW}V${H}h${-HW}z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".8"/>`
      + Array.from({ length: 9 }, (_, k) => k * 31 + 8).filter(y => y < pt - 2 || y > pt + ph + 2).map(y => `<path d="M${HX} ${y}h${HW}" stroke="#2a180a" stroke-width=".7"/>`).join('')
      + `<path d="M${HX + 4} 0v${pt}M${HX + 4} ${pt + ph}V${H}" stroke="#c08a52" stroke-width=".4" opacity=".5"/>`
      + `<path d="M${HX} ${pt}h${HW}M${HX} ${pt + ph}h${HW}" stroke="#0a0502" stroke-width="1.4"/>`
      + `<g filter="url(#drop${u})"><path d="M${out} ${pt}l14 -22l4 3l-14 21z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/></g>`
      + `<path d="M${out + 15} ${pt - 20}L${out - 4} 0" stroke="#a88a5a" stroke-width=".6"/>`;
    // inside: lantern, rammer, the gun run out (its muzzle stands in the port), the shot piled by the carriage
    const lamp = `<path d="M70 11v20" stroke="#2a1a0a" stroke-width=".8"/>` + lantern(70, 42, 1.15);
    const rammer = `<g filter="url(#drop${u})"><path d="M11 ${FL - 4}L20 34" stroke="url(#oakH${u})" stroke-width="2.4"/><ellipse cx="20.3" cy="31.5" rx="5" ry="3.4" fill="#3a2a1a" transform="rotate(5 20.3 31.5)"/></g>`;
    const s = 1.5, w = 64 * s, gx = HX + 13 - .465 * w, gy = by + .149 * w;
    const gun = shadow(u, gx - 2, FL + 2, 46, .55) + img('deck-cannon', gx, gy, s, 0, u);
    const shot = put('flash', out + 7, by, .55, 0, u, false) + put('smokeP', out + 10, by - 16, .34, 0, u, false);
    const balls = shadow(u, 30, FL + 1, 22, .55) + img('deck-balls', 30, FL - 13, 1.1, 0, u);
    const tackle = `<path d="M${gx - 40} ${FL - 6}q-20 -6 -30 -30" stroke="#c9a878" stroke-width="1" fill="none"/><circle cx="${gx - 70}" cy="${FL - 36}" r="2.4" fill="none" stroke="url(#iron${u})" stroke-width="1.3"/>`;
    const bucket = `<g filter="url(#drop${u})" transform="translate(96 206)"><path d="M-9 -12h18l-2 16h-14z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/><path d="M-9.5 -8h19M-8.5 1h17" stroke="url(#iron${u})" stroke-width="1.4"/><ellipse cx="0" cy="-12" rx="9" ry="2" fill="#1e3a44"/></g>`;
    const cartridges = `<g filter="url(#drop${u})" transform="translate(40 226)"><path d="M-16 -8h32v16h-32z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/>${[-10, -2, 6].map(x => `<ellipse cx="${x + 2}" cy="-9" rx="3.4" ry="2" fill="#e8dcc0" stroke="#9a8a6a" stroke-width=".4"/>`).join('')}</g>`;
    return [wall + floor + outside + halo(70, 50, 70, '#ffb050', .3) + lamp + rammer + motes(26, 0, 14, HX, 140, '#ffd8a0', 8),
      gun + balls + hull + shot + bucket + cartridges + halo(out + 10, by, 40, '#ffe0a0', .25)];
  },

  // Captain's cabin at night: the stern window with the moon over the sea; on the table the map, the crossed sabres,
  // the ring she leaves for her ally and a tall candle. The table and the floor fill the lower third.
  'Анжелика': u => {
    const wall = woodTex(u, 0, 0, W, 150, '#5e3a20', '#2e1c0e', '#1a0e06', 16, true, 3);
    const wx = 30, wy = 14, ww = 140, wh = 80;
    const win = `<rect x="${wx - 6}" y="${wy - 6}" width="${ww + 12}" height="${wh + 12}" rx="4" fill="#2a180a" stroke="#120804" stroke-width="1"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#081420"/>`
      + `<clipPath id="pwin${u}"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath><g clip-path="url(#pwin${u})">`
      + sky(u, wy, 54, [[0, '#060e1c'], [.7, '#1a3248'], [1, '#2e4a5e']])
      + Array.from({ length: 26 }, (_, k) => { const r = R(k + 11); return `<circle cx="${(wx + r() * ww).toFixed(1)}" cy="${(wy + r() * 44).toFixed(1)}" r="${(.3 + r() * .6).toFixed(2)}" fill="#fff8e0" opacity="${(.4 + r() * .6).toFixed(2)}"/>`; }).join('')
      + halo(132, 36, 26, '#e8f0ff', .55) + `<circle cx="132" cy="36" r="7" fill="#f6f0d8"/><circle cx="130" cy="34.5" r="1.4" fill="#d8d2b8"/>`
      + sea(u, wy + 54, wy + wh, '#2e4a5e', '#14283a', '#081420', '#9ab8d0', '#e8f0ff', 132)
      + `</g>${[1, 2, 3].map(c => `<path d="M${wx + c * ww / 4} ${wy}v${wh}" stroke="#2a180a" stroke-width="2.6"/>`).join('')}<path d="M${wx} ${wy + wh / 2}h${ww}" stroke="#2a180a" stroke-width="2.6"/>`
      + `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="none" stroke="#c9a048" stroke-width=".9" opacity=".6"/>`
      + `<path d="M${wx - 6} ${wy + wh + 6}h${ww + 12}v5h${-ww - 12}z" fill="url(#oak${u})" stroke="#120804" stroke-width=".6"/>`
      + halo(100, 70, 90, '#8ab0d0', .16);
    const table = woodTex(u, 0, 112, W, 54, '#8a5a30', '#5a3618', '#2a1608', 12, false, 5)
      + `<path d="M0 112h200" stroke="#d4a066" stroke-width="1.4"/><path d="M0 114h200" stroke="#1e1006" stroke-width=".8"/>`
      + `<rect y="166" width="${W}" height="9" fill="#3a2210"/><path d="M0 166h200" stroke="#c08a52" stroke-width=".8"/><path d="M0 175h200" stroke="#0e0804" stroke-width="1.4"/>`
      + woodTex(u, 0, 175, W, 105, '#2e1c0e', '#140a04', '#0a0502', 10, false, 9)
      + [18, 182].map(x => `<rect x="${x - 7}" y="175" width="14" height="105" fill="url(#oak${u})" stroke="#0a0502" stroke-width=".6"/><path d="M${x - 5} 175v105" stroke="#c08a52" stroke-width=".4" opacity=".5"/>`).join('');
    const map = `<g transform="translate(0 -32)"><g transform="rotate(-3 90 176)" filter="url(#drop${u})"><path d="M18 156h132l3 40h-138z" fill="#eedcb0"/>`
      + `<radialGradient id="ppap${u}" cx=".5" cy=".4" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#7a5020" stop-opacity=".35"/></radialGradient><path d="M18 156h132l3 40h-138z" fill="url(#ppap${u})"/>`
      + `<path d="M32 172q14 -10 30 -4q12 -8 22 2q-6 10 -20 8q-16 6 -32 -6z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/><path d="M98 180q10 -8 22 -2q4 8 -8 10q-12 0 -14 -8z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/>`
      + `<path d="M56 186q24 -8 50 -4" stroke="#a8302a" stroke-width=".8" stroke-dasharray="2 1.5" fill="none"/><path d="M104 180l3 3M107 180l-3 3" stroke="#a8302a" stroke-width="1"/>`
      + `<g transform="translate(134 166)">${Array.from({ length: 8 }, (_, k) => `<path d="M0 0L${(Math.cos(k * Math.PI / 4) * 7).toFixed(2)} ${(Math.sin(k * Math.PI / 4) * 7).toFixed(2)}" stroke="#9a7a50" stroke-width=".4"/>`).join('')}</g></g></g>`;
    const blades = shadow(u, 80, 154, 40, .4) + img('cutlasses', 80, 118, 1.55, 0, u);
    const ring = `<g transform="translate(132 154)">${put('ring', 0, 0, 1.05, 0, u)}</g>`;
    const light = put('candleTall', 166, 134, 1.25, 0, u) + halo(166, 96, 70, '#ffb050', .38);
    return [wall + win + table + map + motes(16, 0, 0, 200, 150, '#ffe0b0', 12), blades + ring + light];
  },

  // The Company's yard: the ship stands on the slip, on keel blocks, held by shores on both sides; her sails are
  // off and the masts bare, the shipwrights fit fresh planks into her side while the crane lowers the next one.
  // Behind her the storehouses of the yard and the harbour; the sun is on the left.
  'Верфь Компании': u => {
    const GR = 166, sx = 102, sy = 125, s = 1.75; // ground line; the ship's picture position (hull bottom at 156)
    const back = sky(u, 0, 120, [[0, '#6fa6c8'], [.55, '#b7d4dc'], [.92, '#efe6c8'], [1, '#f6e2b2']])
      + halo(36, 30, 56, '#fff4cc', .85) + `<circle cx="36" cy="30" r="8.5" fill="#fffbe6"/>`
      + cloudBand(u, 6, 46, '#fffaf0', '#b9c4cc', 11, 2.15) + gulls([[150, 30, 1], [162, 24, .8]])
      + isles(116, '#7e9aa0', .5) + sea(u, 116, 132, '#7fb0bc', '#4c8a9a', '#2c6a7c', '#e8fbff', '#fff6d6', 36)
      + afloat('revenge', 30, 114, .34, 0, u);
    // storehouses of the yard: stone walls, tiled roofs, small dark windows, a flagstaff
    const house = (x, y, w, h, roof) => `<g filter="url(#drop${u})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c9b08a" stroke="#6a5030" stroke-width=".5"/><path d="M${x - 3} ${y}L${x + w / 2} ${y - roof}L${x + w + 3} ${y}z" fill="#9a4a32" stroke="#5a2a1a" stroke-width=".5"/>`
      + Array.from({ length: Math.floor(w / 9) }, (_, k) => `<rect x="${x + 4 + k * 9}" y="${y + 5}" width="3.4" height="4.6" fill="#3a2a1a"/>`).join('') + `<rect x="${x + w / 2 - 4}" y="${y + h - 10}" width="8" height="10" fill="#4a3018"/></g>`;
    const yard = house(126, 104, 70, 28, 14) + house(70, 112, 40, 20, 10)
      + `<path d="M192 104V70" stroke="#5a3a1c" stroke-width="1.2"/><path d="M192 71h14v8h-14z" fill="#b8402e"/><path d="M192 74.5h14" stroke="#f4ecd8" stroke-width="1.4"/>`
      + `<rect y="130" width="${W}" height="${GR - 130}" fill="#b49a72"/>` + `<path d="M0 130h200" stroke="#7a6040" stroke-width=".8"/>`
      + Array.from({ length: 8 }, (_, k) => `<path d="M${-20 + k * 30} ${GR}L${10 + k * 26} 130" stroke="#9a8058" stroke-width=".5" opacity=".6"/>`).join('');
    const ground = woodTex(u, 0, GR, W, H - GR, '#a07a4c', '#5e4224', '#2a1a0a', 9, false, 7) + `<path d="M0 ${GR}h200" stroke="#3a2410" stroke-width="2"/><path d="M0 ${GR + 2}h200" stroke="#e0b880" stroke-width=".6" opacity=".6"/>`;
    // the slip: two ways under the keel, blocks the hull rests on
    const slip = `<rect x="30" y="${GR - 4}" width="150" height="4" fill="#5a3a1c"/><path d="M30 ${GR - 4}h150" stroke="#c08a52" stroke-width=".5"/>`
      + [56, 74, 92, 110, 128, 146].map(x => `<rect x="${x - 5}" y="156" width="10" height="${GR - 4 - 156}" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".5"/>`).join('');
    // the hull only: the picture is cut above the rail, so no sails show; bowsprit kept
    const id = 'phc' + u;
    const hull = `<clipPath id="${id}"><path d="M0 136.6H200V200H0zM137 127H170V137H137z"/></clipPath><g clip-path="url(#${id})">${img('endeavour', sx, sy, s, 0, u)}</g>`;
    // bare masts with their yards and shrouds
    const masts = [[79.5, 52, 30], [102.5, 40, 36], [124, 62, 24]].map(([x, top, yd]) => `<path d="M${x} 136V${top}" stroke="#4a2e14" stroke-width="2.2"/><path d="M${x - .6} 136V${top}" stroke="#a87444" stroke-width=".5"/>`
      + [0, .38].map(f => { const y = top + 6 + f * (136 - top); const ww = yd * (1 - f * .5); return `<path d="M${x - ww / 2} ${y.toFixed(1)}h${ww}" stroke="#4a2e14" stroke-width="1.1"/>`; }).join('')
      + `<path d="M${x} ${top + 2}L${x - 12} 137M${x} ${top + 2}L${x + 12} 137M${x} ${top + 14}L${x - 9} 137M${x} ${top + 14}L${x + 9} 137" stroke="#3a2a1a" stroke-width=".35" opacity=".8"/>`).join('')
      + `<path d="M79.5 54L102.5 42L124 64" stroke="#3a2a1a" stroke-width=".4" fill="none"/>`;
    // the repair: a row of fresh light planks let into the dark side, one still missing
    const patch = `<g><path d="M88 142.5h30l-.4 4.6h-29.6z" fill="#e2bc80" stroke="#7a5020" stroke-width=".4"/><path d="M96 142.5v4.6M108 142.5v4.6" stroke="#9a6a30" stroke-width=".4"/>`
      + `<path d="M118 142.6h12v4.4h-12z" fill="#1a0e06"/>${[90, 94, 100, 104, 112, 116].map(x => `<circle cx="${x}" cy="144.8" r=".35" fill="#3a2410"/>`).join('')}</g>`;
    // shores from the ground to the turn of the bilge, a stage plank and ladder at the patch
    const shores = [[34, 64, 146], [50, 72, 150], [176, 140, 146], [160, 132, 150]].map(([gx, hx, hy]) => `<path d="M${gx} ${GR - 3}L${hx} ${hy}" stroke="#6a4424" stroke-width="2.6"/><path d="M${gx} ${GR - 3}L${hx} ${hy}" stroke="#b07a44" stroke-width=".5" transform="translate(-.6 0)"/>`).join('');
    const stage = `<path d="M63 137L42 126" stroke="#3a2410" stroke-width="1.6"/><path d="M42 126L62 112" stroke="#3a2a1a" stroke-width=".35"/>`
      + `<path d="M140 166l6 -30M146 166l6 -30" stroke="#7a5030" stroke-width="1"/>` + Array.from({ length: 6 }, (_, k) => `<path d="M${140.8 + k} ${161 - k * 5}h6" stroke="#7a5030" stroke-width=".8"/>`).join('');
    // the crane on the right lowers the next plank to the gap
    const crane = `<path d="M176 ${GR - 2}V22" stroke="#4a2e14" stroke-width="3.4"/><path d="M175.2 ${GR - 2}V22" stroke="#a87444" stroke-width=".6"/><path d="M176 24H120M176 24l-14 14M176 46l-26 -22" stroke="#4a2e14" stroke-width="2.2"/>`
      + `<path d="M124 24v86" stroke="#8a6a3a" stroke-width=".6"/><g filter="url(#drop${u})"><rect x="108" y="110" width="34" height="4" rx="1" fill="#e2bc80" stroke="#7a5020" stroke-width=".4" transform="rotate(-4 124 112)"/></g><path d="M124 110l-12 -6M124 110l12 -6" stroke="#8a6a3a" stroke-width=".4"/>`;
    const quay = `<g filter="url(#drop${u})" transform="translate(150 214)">${[0, 5, 10].map(d => `<rect x="${-26 + d}" y="${-8 - d}" width="50" height="5" fill="#d8b47e" stroke="#7a5a30" stroke-width=".5"/>`).join('')}</g>`
      + `<g filter="url(#drop${u})" transform="translate(40 214)"><path d="M-12 -16q-5 16 0 32h24q5 -16 0 -32z" fill="url(#oak${u})" stroke="#2a1608"/><path d="M-15 -8h30M-15 8h30" stroke="url(#iron${u})" stroke-width="2.4"/><ellipse cx="0" cy="-16" rx="12" ry="3" fill="#120a04"/></g>`
      + shadow(u, 92, 232, 22, .45) + img('t_repair', 92, 220, .8, -8, u);
    return [back + yard + ground + slip + motes(10, 0, 40, 200, 100, '#fff8e0', 5),
      shadow(u, 102, 160, 66, .5) + masts + hull + patch + shores + stage + crane + quay];
  },

  // Reaction: the black ship runs before a strong wind; the enemy's ball falls short in her wake.
  'Уйти по ветру': u => {
    const back = sky(u, 0, 112, [[0, '#4a86b0'], [.5, '#9cc4d8'], [.88, '#efe6c8'], [1, '#f6e2b2']])
      + halo(158, 36, 64, '#fff4cc', .85) + `<circle cx="158" cy="36" r="9" fill="#fffbe6"/>`
      + cloudBand(u, 2, 50, '#fffaf0', '#a9b8c4', 31, 2.0, '0.02 0.05') + cloudBand(u, 50, 40, '#fff4dc', '#c0bcb0', 17, 2.3, '0.03 0.07')
      + cloudBand(u, 84, 26, '#fffaf0', '#c8c4b8', 5, 2.45, '0.024 0.08');
    const gust = Array.from({ length: 7 }, (_, k) => { const y = 40 + k * 8, x = 196 - k * 3; return `<path d="M${x} ${y}q-36 -5 -74 -1" stroke="#ffffff" stroke-width="${(.5 + k * .06).toFixed(2)}" fill="none" opacity="${(.18 + k * .03).toFixed(2)}"/>`; }).join('');
    const water = isles(112, '#6e8a96', .5) + sea(u, 112, 280, '#5c9aa8', '#2c6a7c', '#0a2a36', '#e8fbff', '#fff6d6', 158) + swell(120, 280, '#dff2f2', .45);
    const miss = put('splash', 184, 150, .5, 0, u, false) + `<ellipse cx="184" cy="154" rx="14" ry="2.4" fill="#f4fcff" opacity=".55"/>`;
    const wake = '';
    const ship = sailing('pearl', 116, 110, 2.2, -2, u);
    const bow = put('splash', 54, 136, .36, 0, u, false) + `<path d="M58 140q-14 1 -34 6" stroke="#ffffff" stroke-width=".9" fill="none" opacity=".7"/>`;
    return [back + gust + water + wake + miss + gulls([[150, 26, 1.1], [138, 20, .8]]), ship + bow];
  }
};

// Card backs: one picture per ship deck, the ship under way in her own light. The back layout (title, crest,
// name) is drawn over it by the card template, so the middle band stays clear for the ship.
const BACKS = {
  pearl: { sky: [[0, '#070d18'], [.6, '#1c2c44'], [1, '#3e5470']], sea: ['#2e4660', '#14263a', '#060e18'], streak: '#9ab8d0', light: '#e8f0ff', moon: [148, 52, '#f6f0d8'], night: true },
  revenge: { sky: [[0, '#2a0806'], [.45, '#7a2416'], [.85, '#d8683a'], [1, '#f2b070']], sea: ['#7a3a28', '#3a1810', '#140604'], streak: '#f2b070', light: '#ffd8a0', moon: [56, 150, '#ffe0a0'] },
  endeavour: { sky: [[0, '#3a76a6'], [.55, '#8ab8d4'], [.9, '#e8e2c8'], [1, '#f6e2b2']], sea: ['#5c9aa8', '#2c6a7c', '#0e3442'], streak: '#e8fbff', light: '#fff6d6', moon: [150, 44, '#fffbe6'] },
  dutch: { sky: [[0, '#06100e'], [.6, '#1a3430'], [1, '#3a6458']], sea: ['#2a4a42', '#122a24', '#040c0a'], streak: '#9ff0d0', light: '#c8fff0', moon: [54, 50, '#dff4ec'], night: true, mist: true }
};
function backArt(k) {
  const u = 'b' + (fid++), c = BACKS[k], hz = 166;
  let body = sky(u, 0, hz, c.sky) + halo(c.moon[0], c.moon[1], 50, c.moon[2], c.night ? .5 : .8) + `<circle cx="${c.moon[0]}" cy="${c.moon[1]}" r="${c.night ? 8 : 10}" fill="${c.moon[2]}" opacity=".95"/>`
    + (c.night ? Array.from({ length: 40 }, (_, i) => { const r = R(i + 3); return `<circle cx="${(r() * 200).toFixed(1)}" cy="${(r() * 110).toFixed(1)}" r="${(.3 + r() * .6).toFixed(2)}" fill="#fff8e0" opacity="${(.3 + r() * .6).toFixed(2)}"/>`; }).join('') : cloudBand(u, 70, 40, '#fff4dc', '#c0bcb0', 17, 2.3, '0.03 0.07'))
    + sea(u, hz, H, c.sea[0], c.sea[1], c.sea[2], c.streak, c.light, c.moon[0]) + swell(hz + 10, H, c.streak, .3)
    + sailing(k, 100, 150, 2.5, 0, u);
  if (c.mist) body += grad('bm' + u, [[0, '#b8f0d8', 0], [.5, '#b8f0d8', .18], [1, '#b8f0d8', 0]]) + `<rect y="140" width="${W}" height="60" fill="url(#bm${u})"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%"><defs>${DEFS(u)}</defs>${body}${vignette(u)}</svg>`;
}

// portrait(name) — the whole picture; portrait(name, {layer: 'fg'}) — only the foreground on transparency
// (for a card frame that lets the foreground step over its border).
function portrait(name, opts = {}) {
  const u = 'q' + (fid++);
  const f = SCENES[name]; if (!f) throw new Error('no portrait scene ' + name);
  const [bg, fg] = f(u);
  const body = opts.layer === 'fg' ? fg : bg + fg + (opts.vignette === false ? '' : vignette(u));
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs>${DEFS(u)}<clipPath id="pc${u}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#pc${u})">${body}</g></svg>`;
}
module.exports = { portrait, backArt, BACKS: Object.keys(BACKS), SCENES: Object.keys(SCENES), W, H };
