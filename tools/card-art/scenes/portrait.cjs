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

  // Gun deck: the gun runs out through a real open port; the port shows sea and sky; the lantern lights the deck.
  'Ядра': u => {
    const wall = woodTex(u, 0, 0, W, 176, '#4e301a', '#26150a', '#120a04', 14, true, 7);
    const ceiling = beam(u, 0, 0, W, 12) + `<path d="M0 12h200" stroke="#0a0502" stroke-width="1.2"/>` + [22, 178].map(x => `<rect x="${x - 7}" y="0" width="14" height="176" fill="#2a180a"/><path d="M${x - 6} 0v176" stroke="#7a4e2a" stroke-width=".6"/><path d="M${x + 6} 0v176" stroke="#0e0804" stroke-width=".8"/>`).join('');
    // the port: thick hull timber around a square opening; the lid hangs open above on its tackle
    const px = 160, py = 104;
    const port = `<rect x="${px - 30}" y="${py - 24}" width="60" height="50" rx="2" fill="#120a04"/>`
      + `<clipPath id="pport${u}"><rect x="${px - 25}" y="${py - 19}" width="50" height="40"/></clipPath><g clip-path="url(#pport${u})">`
      + sky(u, py - 19, 22, [[0, '#7fb2cc'], [1, '#e9e2c6']]) + `<circle cx="${px + 12}" cy="${py - 8}" r="10" fill="#fff6d6" opacity=".55"/>`
      + sea(u, py + 3, py + 21, '#5c9aa8', '#2c6a7c', '#0e3442', '#e8fbff', '#fff6d6', px + 12)
      + `<g transform="translate(${px - 4} ${py + 3}) scale(.42)" opacity=".75"><path d="M-14 0h28l-4 4h-20z" fill="#3a4a50"/><path d="M-6 0v-16M4 0v-18" stroke="#3a4a50" stroke-width=".8"/><path d="M-11 -14q5 2 10 0v10q-5 2 -10 0zM-1 -16q5 2 10 0v12q-5 2 -10 0z" fill="#3a4a50"/></g></g>`
      + `<rect x="${px - 25}" y="${py - 19}" width="50" height="40" fill="none" stroke="#3a2210" stroke-width="2.4"/><path d="M${px - 30} ${py + 26}h60" stroke="#8a5a30" stroke-width="1.6"/>`
      + `<g filter="url(#drop${u})"><path d="M${px - 26} ${py - 24}l-8 -26h66l-6 26z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".7"/><path d="M${px - 22} ${py - 32}h52M${px - 24} ${py - 42}h56" stroke="#2a180a" stroke-width=".8"/><path d="M${px - 30} ${py - 24}h60" stroke="url(#iron${u})" stroke-width="2.2"/></g>`
      + `<path d="M${px - 28} ${py - 50}L${px - 34} 12M${px + 26} ${py - 50}L${px + 30} 12" stroke="#a88a5a" stroke-width=".8"/>`
      + halo(px, py, 46, '#d8eef4', .32);
    // light: the lantern (left, warm) and the daylight from the port (right, cool)
    const lamp = `<path d="M44 12v30" stroke="#2a1a0a" stroke-width=".8"/><path d="M44 12v30" stroke="#6a5a44" stroke-width=".3" stroke-dasharray=".8 .8"/>` + lantern(44, 54, 1.25);
    const rammer = `<g filter="url(#drop${u})"><path d="M20 168L30 40" stroke="url(#oakH${u})" stroke-width="2.4"/><ellipse cx="30.3" cy="37.5" rx="5" ry="3.4" fill="#3a2a1a" transform="rotate(5 30.3 37.5)"/><path d="M26.4 35.2q3.8 -1.2 7.6 .8" stroke="#8a6a4a" stroke-width=".6" fill="none"/><path d="M17 120h12M18 76h13" stroke="url(#iron${u})" stroke-width="2"/></g>`;
    const floor = plankFloor(u, 176, 104, '#5e3a1a', '#2a180a', '#140a04', 8) + `<path d="M0 176h200" stroke="#0e0804" stroke-width="2"/><path d="M0 178h200" stroke="#a87444" stroke-width=".5" opacity=".5"/>`;
    const ringbolts = [70, 132].map(x => `<circle cx="${x}" cy="168" r="3" fill="none" stroke="url(#iron${u})" stroke-width="1.6"/><path d="M${x} 171v4" stroke="#1a1a1a" stroke-width="1.6"/>`).join('');
    const tackle = `<path d="M70 170q24 6 44 2M132 170q-6 4 -10 3" stroke="#c9a878" stroke-width="1.1" fill="none"/>`;
    const gun = img('deck-cannon', 132, 150, 2.05, 0, u) + shadow(u, 128, 186, 62, .55);
    const shot = put('flash', 178, py + 4, 1.05, 0, u, false) + put('smokeP', 192, py - 4, .7, 0, u, false);
    const balls = shadow(u, 44, 196, 26, .55) + img('deck-balls', 44, 182, 1.25, 0, u);
    const bucket = `<g filter="url(#drop${u})" transform="translate(160 206)"><path d="M-9 -12h18l-2 16h-14z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/><path d="M-9.5 -8h19M-8.5 1h17" stroke="url(#iron${u})" stroke-width="1.4"/><ellipse cx="0" cy="-12" rx="9" ry="2" fill="#1e3a44"/></g>`;
    const cartridges = `<g filter="url(#drop${u})" transform="translate(98 232)"><path d="M-16 -8h32v16h-32z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/>${[-10, -2, 6].map(x => `<ellipse cx="${x + 2}" cy="-9" rx="3.4" ry="2" fill="#e8dcc0" stroke="#9a8a6a" stroke-width=".4"/>`).join('')}</g>`;
    return [wall + ceiling + port + halo(44, 60, 80, '#ffb050', .32) + lamp + rammer + floor + ringbolts + tackle + motes(26, 0, 14, 200, 160, '#ffd8a0', 8),
      gun + shot + balls + bucket + cartridges + halo(150, 110, 60, '#cfe8f0', .12)];
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

  // The Company's dry dock: the flagship sits high on the keel blocks inside tall scaffolding, a crane lowers
  // a new spar, fresh planks and a tar barrel wait on the quay. The sun is on the left.
  'Верфь Компании': u => {
    const back = sky(u, 0, 150, [[0, '#6fa6c8'], [.55, '#b7d4dc'], [.92, '#efe6c8'], [1, '#f6e2b2']])
      + halo(40, 34, 60, '#fff4cc', .85) + `<circle cx="40" cy="34" r="9" fill="#fffbe6"/>`
      + cloudBand(u, 6, 54, '#fffaf0', '#b9c4cc', 11, 2.15) + cloudBand(u, 70, 40, '#fff4dc', '#c8c0b0', 23, 2.4, '0.016 0.06')
      + isles(150, '#7e9aa0', .5) + sea(u, 150, 176, '#5c9aa8', '#2c6a7c', '#0e3442', '#e8fbff', '#fff6d6', 40) + gulls([[120, 40, 1], [132, 34, .8], [70, 60, .7]]);
    const dock = woodTex(u, 0, 176, W, 104, '#a07a4c', '#5e4224', '#2a1a0a', 9, false, 7) + `<path d="M0 176h200" stroke="#3a2410" stroke-width="2"/><path d="M0 178h200" stroke="#e0b880" stroke-width=".6" opacity=".6"/>`;
    const posts = Array.from({ length: 6 }, (_, k) => { const x = 14 + k * 34.4; return `<path d="M${x} 44v134" stroke="#5a3a1c" stroke-width="3"/><path d="M${x - .8} 44v134" stroke="#a87444" stroke-width=".7"/>`; }).join('')
      + `<path d="M14 52h172M14 96h172M14 140h172" stroke="#5a3a1c" stroke-width="2"/>`
      + Array.from({ length: 5 }, (_, k) => { const x = 14 + k * 34.4; return `<path d="M${x} 52l34.4 44M${x + 34.4} 52l-34.4 44M${x} 96l34.4 44M${x + 34.4} 96l-34.4 44" stroke="#6a4a24" stroke-width=".7"/>`; }).join('')
      + `<path d="M14 140h172" stroke="#c08a52" stroke-width=".5" opacity=".6"/>`;
    const crane = `<path d="M180 176V14" stroke="#4a2e14" stroke-width="3.6"/><path d="M180 18L112 18M180 18l-14 14M180 40l-24 -22" stroke="#4a2e14" stroke-width="2.4"/><path d="M118 18v46" stroke="#8a6a3a" stroke-width=".7"/>`
      + `<g filter="url(#drop${u})"><rect x="72" y="62" width="92" height="5" rx="2" fill="url(#oakH${u})" stroke="#2a180a" stroke-width=".5" transform="rotate(-3 118 64)"/></g><path d="M118 64l-18 -4M118 64l18 -4" stroke="#8a6a3a" stroke-width=".5"/>`;
    const blocks = [60, 82, 104, 126, 148].map(x => `<rect x="${x - 6}" y="160" width="12" height="16" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".5"/>`).join('')
      + `<path d="M38 176L60 156M164 176L142 156M24 176L50 148M178 176L152 148" stroke="#6a4424" stroke-width="2.4"/>`;
    const ship = img('endeavour', 102, 131, 1.75, 0, u);
    const quay = `<g filter="url(#drop${u})" transform="translate(150 214)">${[0, 5, 10].map(d => `<rect x="${-26 + d}" y="${-8 - d}" width="50" height="5" fill="#d8b47e" stroke="#7a5a30" stroke-width=".5"/>`).join('')}</g>`
      + `<g filter="url(#drop${u})" transform="translate(40 214)"><path d="M-12 -16q-5 16 0 32h24q5 -16 0 -32z" fill="url(#oak${u})" stroke="#2a1608"/><path d="M-15 -8h30M-15 8h30" stroke="url(#iron${u})" stroke-width="2.4"/><ellipse cx="0" cy="-16" rx="12" ry="3" fill="#120a04"/></g>`
      + shadow(u, 92, 232, 22, .45) + img('t_repair', 92, 220, .8, -8, u);
    return [back + posts + dock + blocks + crane + motes(10, 0, 40, 200, 120, '#fff8e0', 5), ship + quay];
  },

  // Reaction: the black ship runs before a strong wind; the enemy's ball falls short in her wake.
  'Уйти по ветру': u => {
    const back = sky(u, 0, 112, [[0, '#4a86b0'], [.5, '#9cc4d8'], [.88, '#efe6c8'], [1, '#f6e2b2']])
      + halo(158, 36, 64, '#fff4cc', .85) + `<circle cx="158" cy="36" r="9" fill="#fffbe6"/>`
      + cloudBand(u, 2, 50, '#fffaf0', '#a9b8c4', 31, 2.0, '0.02 0.05') + cloudBand(u, 50, 40, '#fff4dc', '#c0bcb0', 17, 2.3, '0.03 0.07')
      + cloudBand(u, 84, 26, '#fffaf0', '#c8c4b8', 5, 2.45, '0.024 0.08');
    const gust = Array.from({ length: 7 }, (_, k) => { const y = 40 + k * 8, x = 4 + k * 3; return `<path d="M${x} ${y}q36 -5 74 -1" stroke="#ffffff" stroke-width="${(.5 + k * .06).toFixed(2)}" fill="none" opacity="${(.18 + k * .03).toFixed(2)}"/>`; }).join('');
    const water = isles(112, '#6e8a96', .5) + sea(u, 112, 280, '#5c9aa8', '#2c6a7c', '#0a2a36', '#e8fbff', '#fff6d6', 158) + swell(120, 280, '#dff2f2', .45);
    const miss = put('splash', 36, 146, .55, 0, u, false) + `<ellipse cx="36" cy="150" rx="14" ry="2.4" fill="#f4fcff" opacity=".55"/>`;
    const wake = `<path d="M24 140q50 4 92 -4M24 146q60 6 96 -2" stroke="#f4fcff" stroke-width="1.2" fill="none" opacity=".55"/>`;
    const ship = afloat('pearl', 120, 108, 2.2, -5, u);
    const bow = put('splash', 178, 136, .5, 0, u, false) + `<path d="M166 140q12 -1 30 -5M166 142q16 3 30 6" stroke="#ffffff" stroke-width="1" fill="none" opacity=".75"/>`;
    return [back + gust + water + wake + miss + gulls([[48, 30, 1.1], [60, 24, .8]]), ship + bow];
  }
};

// portrait(name) — the whole picture; portrait(name, {layer: 'fg'}) — only the foreground on transparency
// (for a card frame that lets the foreground step over its border).
function portrait(name, opts = {}) {
  const u = 'q' + (fid++);
  const f = SCENES[name]; if (!f) throw new Error('no portrait scene ' + name);
  const [bg, fg] = f(u);
  const body = opts.layer === 'fg' ? fg : bg + fg + (opts.vignette === false ? '' : vignette(u));
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs>${DEFS(u)}<clipPath id="pc${u}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#pc${u})">${body}</g></svg>`;
}
module.exports = { portrait, SCENES: Object.keys(SCENES), W, H };
