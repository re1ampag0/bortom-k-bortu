// Portrait scenes of the «Чёрная жемчужина» deck (docs/tasks/card-art-portrait.md): night, black and moon silver.
// Drawn in picture units (the camera {0, 0, 200} shows y 0..280): a percentage p of the card height is y = 2.8 p.
const K = require('./portrait-kit.cjs');
const sea = K.seaG; // broken glints on the water instead of the even streaks
const { img, put, woodTex, R, shadow, uid, grad, sky, swell, sailing, beam, plankFloor, lantern, motes, glow, gloom, shafts, flame, smoke, rope, coil, nails, blurF,
  f1, f2, stars, moon, lit, NIGHT, ball, shot, muzzle, arm, cardBack, sand, bubbles, weed, fish, tableTop, bottle, W, H } = K;
const { palm } = require('./art3.cjs');

// the deck's night: sky, stars, the moon and the sea with its silver path
const PSKY = [[0, '#04080f'], [.55, '#121e34'], [1, '#2c4260']], PSEA = ['#2a4260', '#122236', '#050c16'];
const night = (u, hz, mx, my, mr = 6.5, seed = 3) => sky(u, 0, hz + 1, PSKY) + stars(70, 0, 0, W, hz - 8, seed) + moon(u, mx, my, mr)
  + sea(u, hz, H, ...PSEA, '#9ab8d0', '#e8f0ff', mx, seed);
// an iron chain from (x0,y0) to (x1,y1): links turning alternately edge-on and face-on, a cold highlight on each
function chain(u, x0, y0, x1, y1, s = 1, op = 1) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / (5.4 * s)), a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  return `<g opacity="${op}">` + Array.from({ length: n }, (_, i) => { const t = (i + .5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, face = i % 2;
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${s})">${face ? `<ellipse rx="3.6" ry="2.3" fill="none" stroke="#0e1012" stroke-width="2"/><ellipse rx="3.6" ry="2.3" fill="none" stroke="url(#iron${u})" stroke-width="1.2"/><path d="M-2.4 -1.8q2.4 -1 4.6 0" stroke="#dfe6ea" stroke-width=".4" fill="none"/>` : `<rect x="-3.8" y="-.9" width="7.6" height="1.8" rx=".9" fill="#2a3034" stroke="#0e1012" stroke-width=".4"/><path d="M-3 -.4h6" stroke="#a7b0b4" stroke-width=".4"/>`}</g>`; }).join('') + '</g>';
}
// smoke puffs that shrink as they go away into the picture: [x, y, r] each, shaded below, lit from inside by col
function puffs(u, list, col = '#bfc4cc', inner) {
  const g = uid('ppf' + u), f = uid('ppb' + u);
  return `<radialGradient id="${g}" cx=".42" cy=".34" r=".64"><stop offset="0" stop-color="${inner || col}"/><stop offset=".6" stop-color="${col}" stop-opacity=".85"/><stop offset="1" stop-color="#2a2e36" stop-opacity="0"/></radialGradient>` + blurF(f, .9)
    + `<g filter="url(#${f})">${list.map(([x, y, r, o = .85]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" opacity="${o}"/><ellipse cx="${x}" cy="${f1(y + r * .55)}" rx="${f1(r * .8)}" ry="${f1(r * .3)}" fill="#0a0c12" opacity=".18"/>`).join('')}</g>`;
}
const splinters = (x, y, n, seed, col = '#c8a070', sp = 14) => { const r = R(seed); return Array.from({ length: n }, () => { const a = r() * Math.PI * 2, d = 3 + r() * sp, l = 1.5 + r() * 3; const xx = x + Math.cos(a) * d, yy = y + Math.sin(a) * d * .8; return `<path d="M${f1(xx)} ${f1(yy)}l${f1(Math.cos(a + 1) * l)} ${f1(Math.sin(a + 1) * l)}" stroke="${col}" stroke-width="${f2(.5 + r() * .5)}" stroke-linecap="round"/>`; }).join(''); };
// a shoal of tiny moonlit droplets / spray
const spray = (x, y, w, h, n, seed, col = '#e8f4ff') => { const r = R(seed); return Array.from({ length: n }, () => `<circle cx="${f1(x + r() * w)}" cy="${f1(y + r() * h)}" r="${f2(.25 + r() * .6)}" fill="${col}" opacity="${f2(.4 + r() * .5)}"/>`).join(''); };

// a flag on a pole at x, luff from y0 to y1, streaming to the right for len: waves along the fly, folds shaded,
// the fly end frayed; the light behind (moon) shows through as a glow on the thin parts
function cloth(u, x, y0, y1, len, c1, c2, seed = 3, emblem = '') {
  const h = y1 - y0, g = uid('pcf' + u), id = uid('pcc' + u), r = R(seed);
  const top = `M${x} ${y0}q${len * .25} ${-h * .12} ${len * .5} ${h * .04}t${len * .5} ${-h * .02}`;
  const fray = Array.from({ length: 7 }, (_, k) => `l${f1(-1 - r() * 4)} ${f1(h / 14)}l${f1(1 + r() * 4)} ${f1(h / 14)}`).join('');
  const d = `${top}${fray}q${-len * .25} ${h * .14} ${-len * .5} ${-h * .04}t${-len * .5} ${h * .02}z`;
  return `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">${[0, .12, .25, .38, .5, .62, .75, .88, 1].map((o, k) => `<stop offset="${o}" stop-color="${k % 2 ? c2 : c1}"/>`).join('')}</linearGradient>`
    + `<clipPath id="${id}"><path d="${d}"/></clipPath><g filter="url(#drop${u})"><path d="${d}" fill="url(#${g})"/></g><g clip-path="url(#${id})">${emblem}`
    + [.18, .42, .66, .88].map(t => `<path d="M${f1(x + len * t)} ${y0 - 4}q${f1(-3 + r() * 6)} ${f1(h * .5)} 0 ${f1(h + 8)}" stroke="#000" stroke-width="${f1(3 + r() * 3)}" opacity=".18" fill="none"/>`).join('') + `</g>`;
}
// a live crab: shell, eyes on stalks, legs, two claws (one raised)
const crab = (u, x, y, s = 1, a = 0) => { const g = uid('pcr' + u); return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})" filter="url(#drop${u})"><radialGradient id="${g}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#f08050"/><stop offset=".6" stop-color="#b03418"/><stop offset="1" stop-color="#5a1206"/></radialGradient>`
  + [-1, 1].map(sd => [0, 1, 2, 3].map(k => `<path d="M${sd * 6} ${-1 + k * 1.6}q${sd * 5} ${-3 + k} ${sd * 8} ${2 + k * 1.4}" stroke="#7a1e0a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`).join('')).join('')
  + `<path d="M-5 -3q-6 -6 -9 -12" stroke="#8a2410" stroke-width="1.6" fill="none"/><path d="M-14 -15q-4 -3 -1 -6q3 -2 6 1l-3 1l2 2z" fill="url(#${g})" stroke="#3a0e06" stroke-width=".4"/>`
  + `<path d="M5 -3q5 -2 8 -6" stroke="#8a2410" stroke-width="1.6" fill="none"/><path d="M13 -9q4 -3 6 0q1 3 -3 3l2 -2l-3 0z" fill="url(#${g})" stroke="#3a0e06" stroke-width=".4"/>`
  + `<ellipse rx="8" ry="5.6" fill="url(#${g})" stroke="#3a0e06" stroke-width=".5"/><path d="M-5 -2q5 -3 10 0" stroke="#ffc0a0" stroke-width=".6" fill="none" opacity=".7"/>`
  + `<path d="M-2 -5v-3M2 -5v-3" stroke="#7a1e0a" stroke-width=".8"/><circle cx="-2" cy="-8.4" r="1" fill="#120806"/><circle cx="2" cy="-8.4" r="1" fill="#120806"/></g>`; };

const SCENES = {
  // Chain shot: looking up the mainmast of a Company ship; the spinning bar shot has just cut the topsail yard,
  // the yard's end hangs in the rigging, the topsail is torn, splinters, rope ends and a block fall.
  'Книппели': u => {
    const back = sky(u, 0, H, [[0, '#04080f'], [.25, '#12203a'], [.5, '#2a4060'], [1, '#0a1420']]) + stars(50, 0, 0, W, 120, 12) + moon(u, 70, 112, 8, '#f6f0d8', '#dfe8ff', .55);
    const mast = `<path d="M93 280L97 16h6l4 264z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M98 18v262" stroke="#e0c090" stroke-width=".5" opacity=".4"/>`
      + `<rect x="93" y="94" width="14" height="7" fill="#2a1a0a"/><path d="M93 94h14" stroke="#c08a52" stroke-width=".5"/><rect x="95" y="52" width="10" height="5" fill="#2a1a0a"/><circle cx="100" cy="15" r="3.4" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/>`;
    // the Company pennant streaming to the right from the truck: red and white, forked
    const pennant = `<path d="M103 15q8 -2 14 1t12 3t12 6l-6 0.4l5 3q-7 -2 -12 -3t-12 -2.6t-13 -2.6z" fill="#f4ece0" stroke="#8a7a68" stroke-width=".3"/><path d="M103 16q8 -1.4 14 1.6t12 3.2t11 5.4" stroke="#b8302a" stroke-width="1.8" fill="none"/><path d="M103 15q8 -2 14 1" stroke="#ffffff" stroke-width=".4" fill="none"/>`;
    const yard = (y, l, r, w = 2.6) => `<path d="M${l} ${y}Q100 ${y - 3} ${r} ${y}" stroke="#2a1a0e" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="M${l} ${y - .9}Q100 ${y - 3.9} ${r} ${y - .9}" stroke="#d8a868" stroke-width=".55" fill="none" opacity=".7"/>`;
    // sails seen from below, the moon glowing through the canvas behind them
    const sg = uid('psl' + u);
    const S = `url(#${sg})`;
    const defs = `<radialGradient id="${sg}" gradientUnits="userSpaceOnUse" cx="70" cy="112" r="110"><stop offset="0" stop-color="#f4f2e4"/><stop offset=".18" stop-color="#c8c8bc"/><stop offset=".55" stop-color="#6a6e70"/><stop offset="1" stop-color="#2a2e34"/></radialGradient>`;
    const seams = (x0, x1, y0, y1) => Array.from({ length: Math.floor((x1 - x0) / 9) }, (_, k) => { const xx = x0 + 6 + k * 9; return `<path d="M${xx} ${y0 + 1}q${xx < 100 ? -1.4 : 1.4} ${(y1 - y0) / 2} 0 ${y1 - y0 - 2}" stroke="#2a2c30" stroke-width=".35" opacity=".45" fill="none"/>`; }).join('');
    const tg = yard(40, 66, 134, 2) + `<path d="M68 41h64l-5 15h-54z" fill="${S}" stroke="#1a1c20" stroke-width=".5"/>` + seams(68, 132, 41, 56);
    // the topsail: its left part whole, the right part torn away and flogging under the broken yard
    const topsail = yard(62, 44, 112) + `<path d="M46 63h58l2 34h-56z" fill="${S}" stroke="#1a1c20" stroke-width=".5"/>` + seams(46, 104, 63, 97)
      + `<path d="M104 63l10 1l-4 9l10 4l-9 6l7 7l-10 3l-2 4z" fill="${S}" stroke="#1a1c20" stroke-width=".5"/><path d="M106 70l6 3M107 82l6 2" stroke="#2a2c30" stroke-width=".4"/>`
      + `<path d="M112 62l3 -3l2 4l-3 2z" fill="#f0d8a8"/><path d="M110 61l2.4 -3.4l1.8 2.6z" fill="#f0d8a8"/>`
      + `<path d="M117 64L140 92" stroke="#2a1a0e" stroke-width="2.6" stroke-linecap="round"/><path d="M117 63L140 91" stroke="#d8a868" stroke-width=".55" opacity=".7"/><path d="M116 65l3 -3.6l2.4 2.6z" fill="#f0d8a8"/>`
      + `<path d="M134 42L139 90M150 64L138 88M112 60L106 46" stroke="#2a2420" stroke-width=".55" fill="none"/>`;
    const holes = [[62, 118, 5], [128, 114, 3.6], [146, 124, 2.8], [86, 126, 2.4], [70, 80, 2.4]].map(([hx, hy, r]) => `<path d="M${hx - r} ${hy}l${r * .6} ${-r}l${r * .8} ${r * .3}l${r * .6} ${r}l${-r * .4} ${r}l${-r} ${-r * .2}z" fill="#fbfaf2"/>` + glow(u, hx, hy, r * 3, r * 3, '#e8f0ff', .45)).join('');
    const course = yard(100, 24, 176, 3.2) + `<path d="M26 101h148l-7 31h-134z" fill="${S}" stroke="#1a1c20" stroke-width=".6"/>` + seams(26, 174, 101, 132)
      + `<path d="M40 132q-3 8 1 14M160 132q4 10 -2 16M120 132q2 6 -1 10" stroke="#a8a090" stroke-width=".7" fill="none"/>` + holes;
    const shrouds = [[24, 280, 97, 22], [52, 280, 98, 20], [176, 280, 103, 22], [148, 280, 102, 20], [44, 100, 100, 44], [156, 100, 100, 44]].map(([a, b, c, d]) => `<path d="M${a} ${b}L${c} ${d}" stroke="#14120e" stroke-width=".6"/>`).join('')
      + [0, 1, 2, 3, 4, 5].map(k => `<path d="M${26 + k * 7} ${270 - k * 34}h${10 - k}" stroke="#14120e" stroke-width=".4"/>`).join('');
    // the chain shot: two balls on a taut chain, the soft disc of its spin, a short streak where it came from
    const kx = 136, ky = 66, ka = -30, spinF = uid('pks' + u);
    const knip = blurF(spinF, 1.8) + `<circle cx="${kx}" cy="${ky}" r="20" fill="#9aa4ae" opacity=".16" filter="url(#${spinF})"/><circle cx="${kx}" cy="${ky}" r="19" fill="none" stroke="#c8d0d8" stroke-width="5" opacity=".3" filter="url(#${spinF})"/>`
      
      + `<g transform="translate(${kx} ${ky}) rotate(${ka})">${chain(u, -13, 0, 13, 0, .8)}${ball(u, -15, 0, 5.4)}${ball(u, 15, 0, 5.4)}</g>`
      + `<path d="M${kx - 19} ${ky - 4}a19 19 0 0 1 12 -14M${kx + 19} ${ky + 4}a19 19 0 0 1 -12 14" stroke="#dfe6ea" stroke-width=".7" fill="none" opacity=".55"/>`;
    const falling = splinters(120, 74, 22, 5, '#f0d8a8', 22) + `<g transform="translate(124 104) rotate(20)" filter="url(#drop${u})"><rect x="-4" y="-5" width="8" height="10" rx="3" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/><circle r="2" fill="url(#iron${u})"/></g><path d="M124 99q5 -14 -2 -26" stroke="#c8a878" stroke-width=".7" fill="none"/>`
      + `<path d="M130 84q6 4 4 12q-2 4 2 8M108 80q-4 8 0 14q2 4 -1 8" stroke="#c8a878" stroke-width=".8" fill="none"/>`;
    // below the sails: the bulwark and her side running down to the water (under the glass)
    const side = woodTex(u, 0, 150, W, 76, '#2a2016', '#140e08', '#060402', 7, false, 4) + `<path d="M0 150h200" stroke="#c9a048" stroke-width="1.2"/>`
      + [30, 100, 170].map(x => `<rect x="${x - 7}" y="170" width="14" height="11" fill="#5a1a14" stroke="#1a0806" stroke-width=".6"/><path d="M${x - 7} 171h14" stroke="#c9a048" stroke-width=".5"/>`).join('')
      + sea(u, 226, H, ...PSEA, '#9ab8d0', '', 0, 7) + `<path d="M0 226q10 2 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#f4fcff" stroke-width="1" fill="none" opacity=".6"/>`;
    const light = glow(u, 70, 112, 60, 40, '#e8f0ff', .3) + gloom(u, 100, 140, 100, 280, .5, '#02060c');
    return [back + side, defs + shrouds + mast + pennant + tg + course + topsail + knip + falling + light];
  },

  // One shot: on a moonlit beach a flintlock lies on a flat stone, one ball by its muzzle and the powder horn.
  'Один выстрел': u => {
    const hz = 84;
    const back = night(u, hz, 163, 58, 6, 21) + `<path d="M0 ${hz}h200" stroke="#9ab8d0" stroke-width=".5" opacity=".6"/>`
      + `<path d="M120 ${hz}q14 -6 30 -4q14 -4 30 2q8 1 20 2z" fill="#1a2838" opacity=".8"/>`;
    // surf and the wet sand at the water's edge, then the beach
    const shore = `<path d="M0 101q30 -4 60 -1t70 -2t70 2V108H0z" fill="#3a3a38"/>` + sand(u, 104, H, '#5a5244', '#1e1a14', 8, '#d8d0b8')
      + `<path d="M0 101q30 -4 60 -1t70 -2t70 2" stroke="#e8f4ff" stroke-width="1.2" fill="none" opacity=".7"/><path d="M0 104q40 -3 80 0t120 -1" stroke="#c8dcf0" stroke-width=".6" fill="none" opacity=".4"/>`
      + glow(u, 150, 104, 40, 4, '#dfe8ff', .4);
    // the palm leans in from the left edge; fronds lit on the moon side
    const frond = (a, l, c) => `<g transform="translate(70 60) rotate(${a})"><path d="M0 0q${l * .5} -4 ${l} 4q${-l * .5} -1 ${-l} -4z" fill="${c}"/>${Array.from({ length: 7 }, (_, k) => `<path d="M${f1(l * (k + 1) / 8)} ${f1(-.5 + k * .3)}l${f1(l * .06)} ${f1(3 + k * .2)}" stroke="${c}" stroke-width="1.1"/>`).join('')}<path d="M0 0q${l * .5} -4 ${l} 4" stroke="#7a9ab0" stroke-width=".4" fill="none" opacity=".6"/></g>`;
    const palmT = `<path d="M-6 150Q30 120 68 62" stroke="#2a2018" stroke-width="8" fill="none"/><path d="M-2 150Q32 120 70 62" stroke="#6a7a88" stroke-width="1" fill="none" opacity=".5"/>`
      + Array.from({ length: 12 }, (_, k) => { const t = k / 12, x = -6 + t * 74, y = 150 - t * 88 - Math.sin(t * 3.1) * 6; return `<path d="M${f1(x - 3)} ${f1(y)}l6 1.6" stroke="#4a3a2a" stroke-width="1.2"/>`; }).join('')
      + [[-160, 26, '#1a2a22'], [-120, 24, '#22342a'], [-60, 26, '#1e3026'], [-20, 28, '#22342a'], [20, 22, '#1a2a22'], [150, 22, '#1e3026'], [60, 20, '#1a2a22']].map(([a, l, c]) => frond(a, l, c)).join('') + `<circle cx="70" cy="62" r="2.4" fill="#2a2018"/>`;
    // the stone and what lies on it
    const stone = shadow(u, 92, 130, 74, .55, 5) + `<path d="M24 124q10 -9 50 -10q60 -2 86 4q10 3 8 10q-6 4 -70 4q-64 0 -74 -8z" fill="#7a7a72" stroke="#1a1a18" stroke-width=".6"/><path d="M30 120q30 -6 70 -6q40 0 58 4" stroke="#d8e0e8" stroke-width=".9" fill="none" opacity=".6"/>`
      + `<path d="M40 128q30 3 60 2M110 126q20 0 40 -2" stroke="#2a2a26" stroke-width=".5" fill="none"/>`;
    const gun = `<g transform="translate(100 110) scale(-1.38 1.38)">${put('pistol', 0, 0, 1, 0, u)}</g>` + glow(u, 80, 104, 30, 4, '#dfe8ff', .35)
      + `<path d="M58 104l20 -.4M88 104.6l4 0" stroke="#3a4248" stroke-width=".4"/><path d="M110 103q3 -2 6 0q-3 2 -6 0z" fill="none" stroke="#c8d0d8" stroke-width=".35"/>`;
    const bullet = shadow(u, 39, 117.5, 4.4, .6) + ball(u, 39, 114, 3.5);
    const hornG = uid('phn' + u);
    const horn = `<linearGradient id="${hornG}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ead0"/><stop offset=".5" stop-color="#c8b890"/><stop offset="1" stop-color="#6a5a3a"/></linearGradient>`
      + shadow(u, 152, 122, 14, .5) + `<path d="M140 118q6 -8 18 -10q6 0 8 4l-2 3q-6 -2 -12 2q-6 4 -10 4z" fill="url(#${hornG})" stroke="#4a3a20" stroke-width=".5"/><path d="M164 112l3 -1.4v4z" fill="url(#brass${u})"/><path d="M140 118l-2 1.6" stroke="url(#brass${u})" stroke-width="2"/><path d="M146 114q8 -4 14 -4" stroke="#ffffff" stroke-width=".5" opacity=".5" fill="none"/>`
      + `<path d="M141 117q10 -12 24 -6" stroke="#6a4a24" stroke-width=".5" fill="none"/>`;
    const beach = `<g transform="translate(46 170) rotate(-24)">${bottle(u, 0, 0, 1.1, '#1a3020', '#4a2208', .4)}</g>` + `<path d="M22 176q12 -10 26 -10q14 0 24 8q-10 5 -26 5q-16 0 -24 -3z" fill="#4a4436"/><path d="M26 172q12 -6 22 -6q12 0 20 6" stroke="#8a8270" stroke-width=".6" fill="none"/>`
      + [[120, 150, -10], [134, 166, -14], [116, 184, -8], [130, 204, -12]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-3 -6q3 -2 6 0v8q-3 3 -6 0z" fill="#2a2418" opacity=".6"/><path d="M-3 4q3 2 6 0" stroke="#1a140c" stroke-width=".8" fill="none" opacity=".5"/></g>`).join('')
      + [[160, 160], [70, 196], [176, 190]].map(([x, y]) => `<path d="M${x - 4} ${y}q4 -6 8 0z" fill="#d8ccb0" stroke="#6a5a40" stroke-width=".4"/><path d="M${x} ${y}v-4M${x - 2} ${y}l1 -3M${x + 2} ${y}l-1 -3" stroke="#8a7a60" stroke-width=".3"/>`).join('');
    const light = glow(u, 120, 112, 60, 16, '#c8d8f0', .2) + gloom(u, 100, 140, 100, 280, .55, '#020408');
    return [back + shore + palmT, stone + gun + bullet + horn + beach + light];
  },

  // A mad plan: the route on the scroll crossed out three times and drawn again, notes pinned over it, a card
  // face down on it and another pushed under the edge (into the Plan), held down by a bottle, a candle and a dagger.
  'Безумный план': u => {
    const wall = woodTex(u, 0, 0, W, 40, '#3a2414', '#1e1008', '#0e0804', 12, true, 6) + `<rect x="96" y="6" width="34" height="26" rx="2" fill="#0a1424" stroke="#2a1a0a" stroke-width="2.4"/><path d="M113 6v26M96 19h34" stroke="#2a1a0a" stroke-width="1.6"/>`
      + moon(u, 106, 14, 2.6, '#f6f0d8', '#dfe8ff', .4) + stars(6, 98, 8, 30, 22, 4);
    const table = tableTop(u, 38, H - 38, '#6a4424', '#2e1a0c', 3);
    // the scroll: rolled at its top and bottom edges, the paper between
    const pg = uid('ppr' + u);
    const scroll = `<radialGradient id="${pg}" cx=".55" cy=".45" r=".7"><stop offset="0" stop-color="#f2e2b8"/><stop offset=".7" stop-color="#dcc690"/><stop offset="1" stop-color="#a8884e"/></radialGradient>`
      + `<g filter="url(#drop${u})"><path d="M14 52Q100 48 186 52L184 124Q100 128 16 124z" fill="url(#${pg})"/></g>`
      + `<path d="M12 48Q100 44 188 48v6Q100 50 12 54z" fill="#c8b07a" stroke="#6a5030" stroke-width=".5"/><path d="M12 51Q100 47 188 51" stroke="#fff4d0" stroke-width=".6" opacity=".6"/>`
      + `<path d="M14 122Q100 126 186 122v5Q100 131 14 127z" fill="#bca06a" stroke="#6a5030" stroke-width=".5"/>`
      + `<path d="M30 76q14 -10 30 -4q14 -8 24 2q-6 10 -22 8q-18 6 -32 -6z" fill="#cdb67e" stroke="#8a6a40" stroke-width=".5"/><path d="M118 94q12 -8 26 -2q6 8 -8 12q-14 0 -18 -10z" fill="#cdb67e" stroke="#8a6a40" stroke-width=".5"/>`;
    // the route: solid ink, crossed out, drawn again and again; blots and a mug's ring
    const ink = '#2a1a10';
    const route = `<path d="M34 104Q50 84 70 92T104 74" stroke="${ink}" stroke-width=".9" fill="none" opacity=".55"/><path d="M36 106Q60 110 82 96T120 82" stroke="${ink}" stroke-width=".9" fill="none" opacity=".6"/><path d="M38 108Q56 92 88 106T138 96Q150 92 152 80" stroke="${ink}" stroke-width="1.2" fill="none"/>`
      + [[84, 84], [70, 92], [112, 82]].map(([x, y]) => `<path d="M${x - 5} ${y - 5}l10 10M${x + 5} ${y - 5}l-10 10" stroke="#5a1a10" stroke-width="1.1"/>`).join('')
      + `<path d="M149 77l6 6M155 77l-6 6" stroke="#8a1a10" stroke-width="1.4"/><circle cx="62" cy="70" r="2.4" fill="${ink}"/><circle cx="65" cy="72" r=".8" fill="${ink}"/><path d="M128 110q3 -2 5 1q-1 3 -4 2z" fill="${ink}"/>`
      + `<ellipse cx="96" cy="66" rx="9" ry="4.4" fill="none" stroke="#8a5a30" stroke-width="1.2" opacity=".45"/><ellipse cx="100" cy="68" rx="9" ry="4.4" fill="none" stroke="#8a5a30" stroke-width=".6" opacity=".3"/>`;
    const note = (x, y, a, w, h) => `<g transform="translate(${x} ${y}) rotate(${a})" filter="url(#drop${u})"><path d="M${-w / 2} ${-h / 2}h${w}l-1 ${h}h${-w + 2}z" fill="#efe6cc"/>${Array.from({ length: Math.floor(h / 3) - 1 }, (_, k) => `<path d="M${-w / 2 + 2} ${-h / 2 + 3 + k * 3}q${w / 4} -1 ${w / 2} 0t${w / 2 - 5} 0" stroke="#5a4030" stroke-width=".4" fill="none"/>`).join('')}<circle cx="0" cy="${-h / 2 + 1.6}" r="1.3" fill="#b8302a"/><circle cx="-.4" cy="${-h / 2 + 1.2}" r=".4" fill="#ffd0c0"/></g>`;
    const notes = note(84, 64, -8, 26, 18) + note(168, 100, 6, 22, 16) + note(46, 100, 10, 20, 15);
    const cards = `<g transform="translate(0 0)">${cardBack(u, 130, 99, -12, 1.7, .74, '#1e2a40')}</g>`;
    // the card pushed under the scroll's lower edge: only its upper part shows, under the roll
    const under = `<clipPath id="pcl${u}"><rect x="0" y="125" width="200" height="40"/></clipPath><g clip-path="url(#pcl${u})">${cardBack(u, 96, 138, 4, 1.7, .74, '#1e2a40')}</g>`;
    const quill = `<g filter="url(#drop${u})"><path d="M100 118L148 60" stroke="#e8e0d0" stroke-width=".8"/><path d="M148 60q-12 8 -24 26q6 -3 10 -4q-2 -4 14 -22z" fill="#f4ecdc" stroke="#b8a888" stroke-width=".3"/><path d="M146 63q-10 10 -20 22" stroke="#c8b898" stroke-width=".3"/></g>`;
    // weights on the corners: the bottle top left, the candle top right, a dagger driven into the lower left
    const btl = shadow(u, 60, 95, 12, .5) + bottle(u, 59, 93, 1.3, '#1a2a1a', '#4a2208', .35, '#6a1a10');
    const candle = put('candleTall', 160, 74, 1.3, 0, u);
    const dagger = `<g transform="translate(38 116) rotate(-24) scale(1.35)" filter="url(#drop${u})"><path d="M-1.6 0v-18h3.2v18z" fill="url(#silver${u})" stroke="#2a3034" stroke-width=".3"/><path d="M-6 -18h12v2.4h-12z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".3"/><rect x="-1.6" y="-30" width="3.2" height="12" rx="1" fill="#3a2010"/><circle cy="-31" r="2.2" fill="url(#brassR${u})"/></g><path d="M23 120l-3 2" stroke="#2a1a0a" stroke-width="1" opacity=".6"/>`;
    const light = glow(u, 160, 54, 70, 50, '#ffb050', .42) + glow(u, 160, 50, 12, 16, '#fff0c0', .5) + gloom(u, 160, 60, 0, 130, .45) + gloom(u, 100, 130, 100, 280, .5);
    return [wall + table, scroll + route + notes + cards + under + quill + btl + candle + dagger + light];
  },

  // Drop anchor: in a cut-away over and under the water, the black ship swings round on her anchor; the chain runs
  // taut from the hawse into the sea down to the anchor dug into the shoal.
  'Бросить якорь': u => {
    const hz = 70, cut = 87;
    const top = night(u, hz, 172, 60, 6, 5);
    const isle = lit(`<path d="M-4 ${hz + 9}q12 -13 34 -12q22 -3 36 10q6 3 8 5z" fill="#2e4a2a"/><path d="M30 ${hz - 3}q22 -2 36 10" stroke="#a8c0d0" stroke-width=".8" fill="none" opacity=".7"/>` + palm(30, hz + 2, .5) + palm(48, hz + 1, .44, -1), NIGHT)
      + `<path d="M-4 ${hz + 9}h82" stroke="#e8f0ff" stroke-width=".6" opacity=".4"/>`;
    // the water seen from above between the far shore and the cut, the wake curving round from the stern
    const wake = `<path d="M150 82q20 -1 34 -8q8 -5 18 -5" stroke="#e8f4ff" stroke-width="1.6" fill="none" opacity=".8"/><path d="M148 84q24 1 40 -6q6 -3 14 -2" stroke="#e8f4ff" stroke-width=".8" fill="none" opacity=".5"/><path d="M152 83q18 -2 32 -8" stroke="#c8dcf0" stroke-width="4" fill="none" opacity=".2"/>`;
    const shade = `<ellipse cx="96" cy="84" rx="44" ry="2.6" fill="#02060c" opacity=".55" filter="url(#soft${u})"/>`;
    const ship = sailing('pearl', 112, 63, 1.25, -4, u);
    // under the cut: dim water, the moon's rays slanting down, the hull down to the keel, the shoal and the slope
    const ug = uid('pug' + u);
    const under = grad(ug, [[0, '#24566e'], [.35, '#123448'], [1, '#04121c']]) + `<rect y="${cut}" width="${W}" height="${H - cut}" fill="url(#${ug})"/>`
      + shafts(u, 196, cut, [[96, 210, 122, 210], [134, 220, 156, 220], [166, 200, 190, 200]], '#b8d4e8', .2)
      + `<path d="M78 ${cut}q6 9 26 12h28q14 -3 18 -12z" fill="#0a1820" opacity=".7"/><path d="M84 ${cut + 4}q10 7 22 8h26q10 -2 14 -8" stroke="#3a5a6a" stroke-width=".6" fill="none" opacity=".6"/><path d="M104 ${cut + 12}h28" stroke="#2a3a40" stroke-width="1.6" opacity=".7"/>`;
    const shoal = grad(ug + 's', [[0, '#7a7660'], [.25, '#4a4a3a'], [1, '#1a1a14']]) + `<path d="M0 108Q30 112 60 124Q86 133 116 150T200 178V${H}H0z" fill="url(#${ug}s)"/><path d="M0 108Q30 112 60 124Q86 133 116 150T200 178" stroke="#c8ccb0" stroke-width="1" fill="none" opacity=".7"/>`
      + Array.from({ length: 40 }, (_, k) => { const r = R(k + 9); const x = r() * 120, y = 118 + r() * 60 + x * .3; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f2(.3 + r() * .6)}" fill="#a8a888" opacity="${f2(.2 + r() * .3)}"/>`; }).join('')
      + gloom(u, 60, 120, 200, 240, .6, '#020608');
    const life = weed(16, 112, 18, '#3a7a5a', 3) + weed(84, 132, 14, '#3a7a5a', 7, -1) + weed(104, 142, 11, '#2e6a4a', 9) + fish(150, 150, 1.1, -1, '#5a8a98') + fish(166, 158, .9, -1, '#4a7a88') + fish(140, 166, .8, -1, '#4a7a88')
      + bubbles(10, 60, 92, 30, 20, 4, '#9ab8d0');
    // the chain: from the hawse at the bow, taut into the water (a splash where it goes in), on down to the ring
    const anchor = put('anchor', 50, 110, .7, 35, u) + glow(u, 52, 104, 22, 18, '#b8d4e8', .18);
    const ch = chain(u, 80, 77, 70, cut, 1) + chain(u, 70, cut, 63, 93, 1, .8) + put('splash', 70, cut - 1, .2, 0, u, false) + spray(62, cut - 8, 16, 7, 14, 4);
    const dig = `<path d="M46 128q14 -9 28 -1q-6 5 -14 5t-14 -4z" fill="#5a5846"/><path d="M48 127q12 -7 24 -1" stroke="#a8ac90" stroke-width=".6" fill="none"/>` + Array.from({ length: 16 }, (_, k) => { const r = R(k + 31); return `<circle cx="${f1(44 + r() * 30)}" cy="${f1(114 + r() * 12)}" r="${f2(.8 + r() * 1.8)}" fill="#a8a888" opacity="${f2(.1 + r() * .18)}"/>`; }).join('');
    const water = `<path d="M0 ${cut}q10 -2.4 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#bcd4e6" stroke-width="1" fill="none" opacity=".8"/>`
      + glow(u, 140, 80, 60, 10, '#c8dcf0', .18) + gloom(u, 100, 100, 100, 280, .5, '#02060c');
    return [top + isle + wake + shade, ship + under + shoal + life + anchor + dig + ch + water];
  },

  // Broadside both ways: the black ship seen from astern fires out of both sides at once; the nearer enemy on the
  // left takes a hole in her side, the shot meant for the farther one on the right lifts a column of water.
  'Залп с обоих бортов': u => {
    const hz = 62, x = 100, wl = 115;
    const back = night(u, hz, 70, 40, 5.5, 8);
    const left = lit(`<g transform="translate(38 0) scale(.86 1) translate(-38 0)">${sailing('endeavour', 38, 92, .92, 2, u, false)}</g>`, NIGHT)
      + `<path d="M28 104q5 -5 11 -1q2 5 -3 7q-6 1 -8 -6z" fill="#0a0604"/><path d="M29 104l-2 -2M37 102l2 -3M36 108l3 2" stroke="#e0b880" stroke-width=".7"/>` + splinters(34, 104, 16, 3, '#e0b880', 12) + glow(u, 34, 104, 16, 12, '#ffb050', .45);
    const right = lit(sailing('endeavour', 170, 84, .56, -2, u), NIGHT) + put('splash', 154, 94, .42, 0, u, false) + spray(146, 78, 16, 14, 16, 9);
    // the smoke of both sides climbs and drifts off into the picture behind her (smaller further away), lit inside
    const sm = puffs(u, [[64, 102, 8], [62, 92, 9.5], [64, 81, 10], [70, 68, 10], [76, 56, 9], [84, 44, 8, .8], [92, 36, 6.5, .7], [99, 30, 5, .6], [106, 26, 3.8, .5]], '#c4c8d0', '#ffe0b0')
      + puffs(u, [[136, 102, 8], [138, 92, 9.5], [136, 81, 10], [130, 68, 10], [124, 56, 9], [116, 46, 8, .8], [110, 38, 6.5, .7], [104, 33, 5, .6]], '#c4c8d0', '#ffe0b0');
    // her sails seen from aft: the mizzen in front, the main behind and higher, bellied away from us (the wind is
    // at her stern), their edges and yards rimmed by the moon
    const sail = (y0, y1, hw, b) => `<path d="M${x - hw} ${y0}h${2 * hw}q${b} ${(y1 - y0) * .55} ${-3} ${y1 - y0}q${-hw + 3} ${-b * .4} ${-2 * hw + 6} 0q${-b - 3} ${-(y1 - y0) * .45} ${-3} ${-(y1 - y0)}z" fill="#18181e" stroke="#050506" stroke-width=".5"/>`
      + `<path d="M${x - hw} ${y0}q${-b} ${(y1 - y0) * .55} ${3} ${y1 - y0}" stroke="#b8c8dc" stroke-width=".9" fill="none" opacity=".8"/><path d="M${x + hw} ${y0}q${b} ${(y1 - y0) * .55} ${-3} ${y1 - y0}" stroke="#6a7a90" stroke-width=".5" fill="none" opacity=".6"/>`
      + [-.55, -.2, .2, .55].map(k => `<path d="M${f1(x + k * hw)} ${y0 + 1}q${f1(k * b * .8)} ${f1((y1 - y0) * .5)} 0 ${y1 - y0 - 1}" stroke="#08080a" stroke-width=".5" fill="none" opacity=".8"/>`).join('')
      + `<path d="M${x - hw - 3} ${y0}h${2 * hw + 6}" stroke="#2a2420" stroke-width="1.8" stroke-linecap="round"/><path d="M${x - hw - 3} ${y0 - .7}h${2 * hw + 6}" stroke="#b8c8dc" stroke-width=".4" opacity=".7"/>`
      + `<path d="M${x - hw * .5} ${y1 - 1}q${hw * .5} 3 ${hw} 0" stroke="#3a4250" stroke-width=".5" fill="none"/>`;
    const rig = `<path d="M${x} 44V90" stroke="#1a1410" stroke-width="2.2"/><path d="M${x - .7} 44V90" stroke="#8a9ab0" stroke-width=".4"/><circle cx="${x}" cy="44" r="1.4" fill="#2a2018"/>`
      + `<path d="M${x - 42} 88L${x} 46L${x + 42} 88M${x - 34} 88L${x - 2} 58M${x + 34} 88L${x + 2} 58" stroke="#4a5868" stroke-width=".4" fill="none"/>`
      + `<path d="M${x} 46l2 -1.6l12 2l-12 2.6z" fill="#141418"/>`;
    const sails = rig + sail(47, 57, 20, 3) + sail(57, 70, 28, 4) + sail(70, 86, 36, 5) + sail(66, 80, 22, 3);
    // the stern: transom with lit gallery windows, carving, three lanterns, the rudder; the sides catch the moon
    const hullG = uid('pst' + u);
    const hull = `<linearGradient id="${hullG}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5466"/><stop offset=".16" stop-color="#1e1e24"/><stop offset=".84" stop-color="#121216"/><stop offset="1" stop-color="#050506"/></linearGradient>`
      + `<path d="M${x - 22} 85h44l7 19q-3 9 -9 11h-40q-6 -2 -9 -11z" fill="url(#${hullG})" stroke="#050506" stroke-width=".6"/>`
      + `<path d="M${x - 24} 85q24 -6 48 0" stroke="#7a5a28" stroke-width="1.8" fill="none"/><path d="M${x - 20} 88q20 -3 40 0" stroke="#c9a048" stroke-width=".5" fill="none" opacity=".7"/>`
      + [0, 1].map(r => [-1, -.35, .35, 1].map(k => `<rect x="${f1(x + k * 12.6 - 3)}" y="${91 + r * 7}" width="6" height="4.4" rx="1.2" fill="#d89a48" stroke="#3a2410" stroke-width=".6"/><path d="M${f1(x + k * 12.6)} ${91 + r * 7}v4.4M${f1(x + k * 12.6 - 3)} ${93.2 + r * 7}h6" stroke="#5a3a18" stroke-width=".35"/>`).join('')).join('')
      + `<path d="M${x - 2} 103h4v12h-4z" fill="#0a0a0c" stroke="#3a4250" stroke-width=".3"/><path d="M${x - 27} 105h54" stroke="#2a2420" stroke-width=".9"/>`
      + [-15, 0, 15].map(k => `<path d="M${x + k} 85v-3" stroke="#1a1410" stroke-width=".6"/><path d="M${x + k - 2} 81h4l-.6 -4.4h-2.8z" fill="#ffd27a" stroke="#2a1a0a" stroke-width=".45"/>` + glow(u, x + k, 79, 7, 7, '#ffc060', .65)).join('')
      + glow(u, x, 95, 28, 9, '#ffb050', .32);
    const fire = muzzle(u, 74, 98, 180, 1) + muzzle(u, 73, 106, 186, .85) + muzzle(u, 126, 99, 0, 1) + muzzle(u, 128, 107, -6, .85);
    const balls = shot(u, 64, 100, 46, 103, 2) + shot(u, 138, 99, 152, 95, 1.6);
    // her wake: churned foam spreading from under the stern towards us
    const r = R(14);
    const wake = `<path d="M${x - 26} ${wl}q26 5 52 0" stroke="#f4fcff" stroke-width="1.4" fill="none" opacity=".75"/>` + spray(x - 30, wl - 3, 60, 8, 24, 6)
      + Array.from({ length: 26 }, (_, k) => { const y = wl + 4 + k * 5.4, w = 10 + k * 2.2, xx = x + (r() - .5) * (14 + k * 2.6); return `<path d="M${f1(xx - w / 2)} ${f1(y)}q${f1(w / 2)} ${f1(-1 - k * .05)} ${f1(w)} 0" stroke="#dfe8f4" stroke-width="${f2(.6 + k * .03)}" fill="none" opacity="${f2(.6 - k * .018)}"/>`; }).join('')
      ;
    const light = glow(u, 74, 112, 32, 10, '#ffb050', .35) + glow(u, 126, 112, 32, 10, '#ffb050', .35) + gloom(u, 100, 130, 100, 280, .55, '#02060c');
    return [back + right + left + sm, wake + sails + hull + fire + balls + light];
  },

  // Powder kegs: three kegs in a wet net on cork floats drift against the Company ship's side; one musket ball
  // from the left strikes the nearest and the first flash bursts from it.
  'Бочки с порохом': u => {
    const hz = 60;
    const back = night(u, hz, 28, 70, 6, 13);
    const ship = lit(sailing('endeavour', 102, 46, 1.8, 0, u), NIGHT) + [[150, 52], [156, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#ffe0a0"/>` + glow(u, x, y, 7, 7, '#ffc060', .7)).join('')
      + glow(u, 154, 72, 14, 4, '#ffc060', .25);
    // a keg afloat: staves, iron hoops with rivets, the flame brand, the fuse smouldering, ripples round it
    const keg = (x, wl, w, h, seed, front) => {
      const id = uid('pkg' + u), top = wl - h, r = R(seed);
      return `<clipPath id="${id}"><rect x="${x - w}" y="${top - 30}" width="${2 * w}" height="${h + 30}"/></clipPath>`
        + `<ellipse cx="${x}" cy="${wl + 1}" rx="${f1(w * .62)}" ry="${f1(w * .1)}" fill="#02060c" opacity=".5" filter="url(#soft${u})"/>`
        + `<g clip-path="url(#${id})"><path d="M${f1(x - w / 2)} ${top + 4}q${f1(-w * .1)} ${f1(h * .5)} 0 ${h + 6}h${w}q${f1(w * .1)} ${f1(-h * .5)} 0 ${-h - 6}z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/>`
        + [-.3, -.1, .1, .3].map(k => `<path d="M${f1(x + k * w)} ${top + 5}q${f1(k * w * .2)} ${f1(h * .5)} 0 ${h + 4}" stroke="#2a1608" stroke-width=".6" fill="none"/>`).join('')
        + [.16, .5, .84].map(t => `<path d="M${f1(x - w / 2 - w * .05)} ${f1(top + 4 + h * t)}q${f1(w * .55)} ${f1(w * .1)} ${f1(w * 1.1)} 0" stroke="url(#iron${u})" stroke-width="${f2(w * .07)}" fill="none"/>` + [-.4, -.15, .15, .4].map(k => `<circle cx="${f1(x + k * w)}" cy="${f1(top + 4 + h * t + w * .04)}" r="${f2(w * .012 + .3)}" fill="#c8d0d8" opacity=".7"/>`).join('')).join('')
        + `<path d="M${f1(x - w * .06)} ${f1(top + h * .62)}q${f1(-w * .08)} ${f1(-h * .1)} ${f1(w * .02)} ${f1(-h * .2)}q${f1(w * .02)} ${f1(h * .08)} ${f1(w * .06)} ${f1(h * .06)}q${f1(w * .06)} ${f1(h * .06)} ${f1(-w * .02)} ${f1(h * .14)}z" fill="#c8301a" opacity=".85"/>`
        + `<path d="M${f1(x - w * .4)} ${top + 6}q${f1(-w * .06)} ${f1(h * .4)} 0 ${f1(h * .8)}" stroke="#d8a868" stroke-width="${f2(w * .03)}" fill="none" opacity=".45"/></g>`
        + `<ellipse cx="${x}" cy="${top + 4}" rx="${f1(w / 2)}" ry="${f1(w * .12)}" fill="#5a3a1c" stroke="#140a04" stroke-width=".6"/><ellipse cx="${x}" cy="${top + 4}" rx="${f1(w * .4)}" ry="${f1(w * .08)}" fill="#7a5028"/>`
        + `<path d="M${x} ${top + 4}q${f1(w * .1)} -4 ${f1(w * .05)} -8" stroke="#3a2a1a" stroke-width="${f2(.6 + w * .01)}" fill="none"/>` + glow(u, x + w * .05, top - 4, 4, 4, '#ff8a3a', .9) + `<circle cx="${f1(x + w * .05)}" cy="${top - 4}" r="${f2(.5 + w * .008)}" fill="#ffd27a"/>`
        + smoke(u, x + w * .05, top - 6, .12 + w * .002, 5, 1, seed, '#8a929c', 18)
        + `<path d="M${f1(x - w * .7)} ${wl}q${f1(w * .35)} -1.4 ${f1(w * .7)} 0t${f1(w * .7)} 0" stroke="#dfe8f4" stroke-width=".8" fill="none" opacity=".75"/><path d="M${f1(x - w * .9)} ${wl + 3}q${f1(w * .45)} -1 ${f1(w * .9)} 0t${f1(w * .9)} 0" stroke="#9ab8d0" stroke-width=".5" fill="none" opacity=".5"/>`;
    };
    // the net: wet cords over the kegs, cork floats on its rope at the water line
    const net = (x0, x1, y0, y1) => { let d = ''; for (let k = 0; k <= 10; k++) { const t = k / 10; d += `M${f1(x0 + (x1 - x0) * t)} ${y0}L${f1(x0 + (x1 - x0) * (t + .25))} ${y1}M${f1(x0 + (x1 - x0) * t)} ${y0}L${f1(x0 + (x1 - x0) * (t - .25))} ${y1}`; } return `<clipPath id="pnc${u}${x0}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath><g clip-path="url(#pnc${u}${x0})"><path d="${d}" stroke="#2a2418" stroke-width="1" fill="none" opacity=".9"/><path d="${d}" stroke="#b8c8d8" stroke-width=".3" fill="none" opacity=".5"/></g>`; };
    const floats = [[30, 120], [100, 121], [128, 112], [176, 108], [150, 110]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.2" fill="#b89060" stroke="#4a3018" stroke-width=".5"/><path d="M${x - 3} ${y - 1}h5" stroke="#f0d8a8" stroke-width=".5" opacity=".6"/>`).join('')
      + `<path d="M24 120Q60 125 100 121T150 110T182 107" stroke="#2a2418" stroke-width="1.2" fill="none"/>`;
    const kegs = keg(158, 106, 24, 24, 3) + net(146, 170, 84, 106) + keg(124, 110, 32, 32, 5) + net(108, 140, 80, 110) + keg(68, 119, 50, 52, 7) + net(43, 93, 67, 119) + floats;
    // the ball comes in from the left edge with a short blurred streak; sparks and the first flash on the keg
    const hit = shot(u, 6, 86, 44, 90, 1.8) + glow(u, 46, 90, 18, 16, '#ffb040', .8) + glow(u, 46, 90, 6, 6, '#fff6d0', 1)
      + `<path d="M46 90l-8 -6l9 3l-2 -9l5 9l6 -6l-3 8l9 2l-9 2l4 7l-6 -5l-3 8l-1 -8l-8 3z" fill="#ffd060" opacity=".9"/>` + Array.from({ length: 16 }, (_, k) => { const a = -2.6 + k * .32, d = 10 + (k % 4) * 4; return `<path d="M${f1(46 + Math.cos(a) * d * .6)} ${f1(90 + Math.sin(a) * d * .6)}l${f1(Math.cos(a) * 3)} ${f1(Math.sin(a) * 3)}" stroke="#ffe080" stroke-width=".6" stroke-linecap="round"/>`; }).join('');
    const light = glow(u, 60, 128, 40, 8, '#ffb040', .35) + glow(u, 28, 80, 50, 30, '#c8d8f0', .15) + gloom(u, 100, 130, 100, 280, .55, '#02060c');
    return [back + ship, kegs + hit + light];
  },

  // Gibbs at the wheel: we stand behind the helmsman; only his weathered forearms show, hands on the spokes at
  // four and eight o'clock. His hat hangs on the nine o'clock spoke; the binnacle stands to the right.
  'Гиббс за штурвалом': u => {
    const hz = 84;
    const back = night(u, hz, 50, 46, 6, 17);
    // the sails overhead, dark against the stars, the moon catching their edges
    const sails = `<path d="M-10 0h220v20q-30 -10 -110 -8t-110 10z" fill="#1a1c22"/><path d="M-10 22q80 -18 220 -6" stroke="#9ab0c8" stroke-width=".8" fill="none" opacity=".7"/><path d="M-10 3h220" stroke="#2a2420" stroke-width="3"/>`
      + `<path d="M150 0l60 40v-40z" fill="#14161a"/><path d="M150 0l60 40" stroke="#8aa0b8" stroke-width=".6" opacity=".6"/><path d="M30 20L0 70M170 18L200 60" stroke="#2a2c30" stroke-width=".6"/>`;
    // the ship ahead of us: her deck running forward to the bow, the rail
    const deck = `<path d="M-10 96L200 96V280H-10z" fill="#2a2016"/>` + woodTex(u, 0, 96, W, 184, '#3a2c1e', '#1a120a', '#0a0604', 8, false, 3)
      + `<path d="M0 92h200v6h-200z" fill="#3a2a1a"/><path d="M0 92h200" stroke="#a8b8c8" stroke-width=".7" opacity=".6"/>` + [12, 44, 76, 124, 156, 188].map(x => `<path d="M${x} 92v-6" stroke="#2a2016" stroke-width="2"/>`).join('') + `<path d="M0 86h200" stroke="#3a2a1a" stroke-width="1.6"/>`;
    // the wheel: rim, twelve turned spokes, the brass hub; the moon's rim light on its upper left
    const cx = 100, cy = 76, R0 = 38;
    const spokes = Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); const x1 = cx + c * 8, y1 = cy + s * 8, x2 = cx + c * 52, y2 = cy + s * 52, x3 = cx + c * 44, y3 = cy + s * 44;
      return `<path d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}" stroke="#2a1608" stroke-width="3.6" stroke-linecap="round"/><path d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}" stroke="#8a5a30" stroke-width="2.2" stroke-linecap="round"/>`
        + `<ellipse cx="${f1(x3)}" cy="${f1(y3)}" rx="2.6" ry="2.2" fill="#6a4020" transform="rotate(${f1(a * 180 / Math.PI)} ${f1(x3)} ${f1(y3)})"/><path d="M${f1(x1 - s * .8)} ${f1(y1 + c * .8)}L${f1(x2 - s * .8)} ${f1(y2 + c * .8)}" stroke="#d8a868" stroke-width=".5" opacity=".6"/>`; }).join('');
    const wheel = spokes + `<circle cx="${cx}" cy="${cy}" r="${R0}" fill="none" stroke="#1a0e06" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${R0}" fill="none" stroke="url(#oak${u})" stroke-width="5.4"/>`
      + `<circle cx="${cx}" cy="${cy}" r="${R0 - 2}" fill="none" stroke="#c9a048" stroke-width=".6" opacity=".7"/><path d="M${cx - 34} ${cy - 18}A${R0 + 2} ${R0 + 2} 0 0 1 ${cx + 6} ${cy - 40}" stroke="#d8e4f4" stroke-width="1" fill="none" opacity=".8"/>`
      + `<circle cx="${cx}" cy="${cy}" r="9" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".6"/><circle cx="${cx}" cy="${cy}" r="4" fill="#3a2810"/><circle cx="${cx - 3}" cy="${cy - 3}" r="1.6" fill="#fff4c8" opacity=".7"/>`
      + Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return `<circle cx="${f1(cx + Math.cos(a) * R0)}" cy="${f1(cy + Math.sin(a) * R0)}" r=".9" fill="url(#brass${u})"/>`; }).join('');
    const post = `<path d="M90 116h20l4 120h-28z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M86 236h28v6h-28z" fill="#3a2414"/>` + coil(62, 214, 18, 5);
    // the hat on the nine o'clock spoke: a worn felt hat with a frayed brim
    const hat = `<g transform="translate(52 80)" filter="url(#drop${u})"><path d="M-12 4q12 -5 24 0q-2 3 -12 3t-12 -3z" fill="#3a2c20" stroke="#120a04" stroke-width=".5"/><path d="M-7 3q-1 -9 7 -10q8 1 7 10q-7 2 -14 0z" fill="#4a3826" stroke="#120a04" stroke-width=".5"/><path d="M-7 1q7 2 14 0" stroke="#6a1a14" stroke-width="1.4"/><path d="M-6 -2q4 -4 8 -4" stroke="#a8b8c8" stroke-width=".5" fill="none" opacity=".6"/><path d="M10 5l2 2M-11 5l-1 2" stroke="#3a2c20" stroke-width=".6"/></g>`;
    // the binnacle on the right: a wooden post, the brass hood, the card lit inside; a dented flask hangs from it
    const binn = shadow(u, 166, 128, 16, .5) + `<path d="M156 96h20l3 32h-26z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/>`
      + `<ellipse cx="166" cy="96" rx="12" ry="4" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><path d="M154 96q0 -12 12 -13q12 1 12 13" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><ellipse cx="166" cy="92" rx="8" ry="5" fill="#f2e6c4"/>`
      + `<g transform="translate(166 92) scale(1 .62)">${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return `<path d="M0 0L${f1(Math.cos(a) * 6.4)} ${f1(Math.sin(a) * 6.4)}" stroke="${k % 2 ? '#6a4a24' : '#a8302a'}" stroke-width="${k % 2 ? .5 : .9}"/>`; }).join('')}</g>` + glow(u, 166, 92, 10, 7, '#ffd890', .5)
      + `<path d="M176 100q4 6 2 14" stroke="#a8906a" stroke-width=".5" fill="none"/><g transform="translate(178 118) rotate(-8)" filter="url(#drop${u})"><path d="M-5 -6h10v11q-5 3 -10 0z" fill="url(#silver${u})" stroke="#3a4248" stroke-width=".4"/><path d="M-2 -6v-3h4v3" fill="#5a6268"/><path d="M-3 0q2 -2 4 1" stroke="#3a4248" stroke-width=".6" fill="none"/></g>`;
    // his forearms: sleeves rolled to the elbow, sunburnt and scarred, an anchor tattoo on the right
    const tattoo = (x, y, a) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a + 90)}) scale(.5)" opacity=".75"><path d="M0 -6v12M-4 -3h8M-6 2q6 8 12 0" stroke="#24384a" stroke-width="1.4" fill="none"/><circle cy="-7.4" r="1.6" fill="none" stroke="#24384a" stroke-width="1"/></g>`;
    const arms = lit(arm(u, -6, 190, 56, 106, { w0: 26, w1: 13, cloth: '#5a4a3a', light: '#8a7a68', dark: '#1e1810', bare: .6, hair: true, pose: 'fist', side: -1, s: 1.5 })
      + arm(u, 206, 190, 144, 106, { w0: 26, w1: 13, cloth: '#4a3e34', light: '#7a6e60', dark: '#1a140e', bare: .6, hair: true, pose: 'fist', side: 1, s: 1.5, tattoo }), [[.8, .76, .84], [0, 0, .02], .85]);
    const light = glow(u, 76, 58, 60, 40, '#c8d8f0', .18) + glow(u, 166, 96, 24, 16, '#ffd890', .2) + gloom(u, 100, 140, 100, 280, .55, '#020408');
    return [back + sails + deck, post + wheel + hat + binn + arms + light];
  },

  // Jack's compass: on the cabin table by the stern window, the compass open; its needle glows and the glow runs
  // over the chart to the cross; three cards face down in a fan beside it, the middle one pushed out.
  'Компас Джека': u => {
    const wall = woodTex(u, 0, 0, W, 100, '#4a2e18', '#22140a', '#0e0804', 14, true, 8);
    const win = `<rect x="10" y="44" width="54" height="52" rx="3" fill="#2a180a" stroke="#120804"/><rect x="14" y="48" width="46" height="44" fill="#081420"/><clipPath id="pkw${u}"><rect x="14" y="48" width="46" height="44"/></clipPath><g clip-path="url(#pkw${u})">`
      + sky(u, 48, 30, [[0, '#060e1c'], [1, '#22384e']]) + stars(14, 14, 48, 46, 24, 9) + moon(u, 44, 60, 4) + sea(u, 78, 92, '#2e4a5e', '#14283a', '#081420', '#9ab8d0', '#e8f0ff', 44) + `</g><path d="M37 48v44M14 70h46" stroke="#2a180a" stroke-width="2.2"/><rect x="14" y="48" width="46" height="44" fill="none" stroke="#c9a048" stroke-width=".7" opacity=".6"/>`;
    const table = tableTop(u, 100, H - 100, '#6a4424', '#2e1a0c', 9);
    // the chart: paper with a coastline, the cross marked in ink
    const chart = `<g filter="url(#drop${u})"><path d="M8 104l184 -2l4 70l-190 4z" fill="#ead6a8"/></g><path d="M20 120q16 -8 30 -2q12 -6 22 2q-4 10 -20 8q-18 4 -32 -8zM120 150q14 -8 30 -2q8 8 -6 12q-16 2 -24 -10z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/>`
      + `<path d="M47 113l9 9M56 113l-9 9" stroke="#8a1a10" stroke-width="1.6"/><path d="M30 130q20 -4 30 -14" stroke="#4a3020" stroke-width=".6" fill="none"/>`;
    // the glow of the needle running over the chart to the cross: a soft warm path, no line
    const gf = uid('pcg' + u);
    const trail = blurF(gf, 3) + `<path d="M92 104Q72 110 52 117" stroke="#ffcf6a" stroke-width="10" fill="none" opacity=".95"/><path d="M92 104Q72 110 52 117" stroke="#fff0b0" stroke-width="3" fill="none" opacity=".8" filter="url(#${gf})" stroke-linecap="round"/>` + glow(u, 52, 117, 12, 8, '#ffd870', .7) + glow(u, 74, 110, 18, 8, '#ffd870', .3);
    const compass = put('compassJack', 101, 98, 1.2, 0, u, false) + glow(u, 101, 98, 26, 14, '#ffd870', .35);
    // beads on a cord beside the compass, a strap
    const beads = `<path d="M70 120q14 6 30 4q14 -2 22 -8" stroke="#3a2010" stroke-width=".6" fill="none"/>` + Array.from({ length: 9 }, (_, k) => { const t = k / 8, x = 70 + t * 52, y = 120 + Math.sin(t * Math.PI) * 5 - t * 4; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.6" fill="${['#b8302a', '#2a6a8a', '#c9a048'][k % 3]}" stroke="#1a0e06" stroke-width=".3"/><circle cx="${f1(x - .5)}" cy="${f1(y - .5)}" r=".5" fill="#fff" opacity=".6"/>`; }).join('');
    const fan = cardBack(u, 144, 112, -16, 1.35, .82, '#1e2a40') + cardBack(u, 176, 112, 16, 1.35, .82, '#1e2a40') + cardBack(u, 160, 104, 0, 1.35, .82, '#1e2a40');
    const light = glow(u, 40, 70, 50, 40, '#a8c4e0', .22) + shafts(u, 40, 70, [[70, 140, 100, 150]], '#a8c4e0', .1) + glow(u, 101, 96, 40, 22, '#ffd870', .22) + gloom(u, 40, 80, 200, 120, .4) + gloom(u, 100, 130, 100, 280, .55);
    return [wall + win + table, chart + trail + compass + beads + fan + light];
  },

  // Jack the monkey: sitting on the near edge of the table with a gold coin held up and a stolen card in the curl of
  // its tail; the moonbeam from the side window throws the shadow of a monkey skeleton on the back wall.
  'Обезьянка Джек': u => {
    const wall = woodTex(u, 0, 0, W, 92, '#4a2e18', '#22140a', '#0e0804', 15, true, 4) + `<path d="M0 0h200v10h-200z" fill="#1e1208"/>`;
    // the side window on the left: low moon, the beam lying almost level across the room
    const win = `<g transform="translate(0 8)"><path d="M14 46l38 -6v52l-38 4z" fill="#0a1424" stroke="#2a180a" stroke-width="2.4"/><clipPath id="pmw${u}"><path d="M14 46l38 -6v52l-38 4z"/></clipPath><g clip-path="url(#pmw${u})">${sky(u, 40, 56, [[0, '#060e1c'], [1, '#2a4058']])}${moon(u, 30, 80, 4)}${stars(8, 14, 42, 38, 30, 3)}</g><path d="M33 43v51M14 70l38 -4" stroke="#2a180a" stroke-width="1.8"/></g>`
      + shafts(u, 40, 66, [[200, 30, 200, 100], [200, 70, 200, 120]], '#c8dcf0', .1);
    // the shadow: a monkey skeleton in the same pose on the back wall, its foot at the table's far edge
    const sk = `<g transform="translate(146 74) scale(-1.5 1.5)" fill="none" stroke="#08040a" stroke-linecap="round" opacity=".55"><circle cx="0" cy="-22" r="6.4" fill="#08040a"/><path d="M0 -15v22" stroke-width="2.4"/>${[-11, -7, -3, 1].map(yy => `<path d="M-6 ${yy}q6 3 12 0" stroke-width="1.4"/>`).join('')}<path d="M-2 -12l-12 -10M2 -12l8 10l2 6M-3 7l-6 10M3 7l6 10" stroke-width="1.8"/><path d="M4 6q20 4 18 -14q-2 -8 6 -12" stroke-width="1.5"/><circle cx="-14" cy="-22" r="2.6" fill="#08040a"/></g>`;
    const table = tableTop(u, 92, H - 92, '#7a4e2a', '#3a2210', 6) + `<path d="M0 126h200" stroke="#d4a066" stroke-width="1.4"/><rect y="127" width="200" height="8" fill="#3a2210"/><path d="M0 135h200" stroke="#0e0804" stroke-width="1.2"/>`;
    // the opponent's cards spread open on the table, coins, a mug
    const cardF = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(1.1 .7)" filter="url(#drop${u})"><rect x="-9" y="-13" width="18" height="26" rx="1.6" fill="#f2e6c8" stroke="#6a5a40" stroke-width=".4"/><rect x="-7" y="-11" width="14" height="10" fill="#c8a870" opacity=".6"/><path d="M-6 3h12M-6 6h10M-6 9h12" stroke="#7a6a50" stroke-width=".6"/></g>`;
    const spread = cardF(130, 118, -20) + cardF(144, 116, -6) + cardF(158, 118, 8) + cardF(172, 121, 22);
    const coins = put('coins', 160, 104, .7, 0, u) + put('coins', 40, 124, .6, 0, u) + `<g transform="translate(176 104)" filter="url(#drop${u})"><path d="M-7 0l1.4 -14h11.2l1.4 14z" fill="url(#leather${u})" stroke="#1a0e06" stroke-width=".5"/><ellipse cy="-14" rx="5.6" ry="1.6" fill="#2a1608"/><path d="M7 -10q5 0 5 4t-5 4" stroke="#3a2010" stroke-width="1.6" fill="none"/></g>`;
    // the monkey, mirrored so its tail curls to the left round the stolen card; a coin in its raised paw
    const stolen = `<g transform="translate(44 106) rotate(-18)">${cardBack(u, 0, 0, 0, 1.1, 1, '#4a1a1a')}</g>`;
    const monkey = shadow(u, 90, 127, 24, .5) + `<g transform="translate(90 96) scale(-1.05 1.05)">${put('capuchin', 0, 0, 1, 0, u)}</g>`
      + `<path d="M46 90q-8 -2 -10 6q-1 6 5 6" stroke="#3a2410" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M46 90q-8 -2 -10 6q-1 6 5 6" stroke="#7a5030" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
      + `<g transform="translate(116 80)"><circle r="12" fill="url(#glow${u})" opacity=".8"/><circle r="5.2" fill="url(#brassR${u})" stroke="#6a4a10" stroke-width=".6"/><circle r="3.6" fill="none" stroke="#8a6a20" stroke-width=".5"/><path d="M-2 -1l2 -2l2 2l-2 2z" fill="#8a6a20"/></g>`;
    const light = glow(u, 60, 90, 60, 30, '#c8dcf0', .14) + glow(u, 200, 120, 60, 24, '#ffb050', .3) + gloom(u, 40, 60, 200, 60, .3) + gloom(u, 100, 130, 100, 280, .55);
    return [wall + win + sk + table, spread + coins + stolen + monkey + light];
  },

  // Bank robbery: a breach torn in the bank's ground floor; ropes haul the safe on its wheels out to a team of
  // horses (only their hindquarters in the picture); coins trickle from the door, a watchman runs up with a lantern.
  'Ограбление банка': u => {
    const back = sky(u, 0, 140, PSKY) + stars(30, 140, 0, 60, 80, 6) + moon(u, 172, 58, 6) + `<path d="M146 100q10 -10 20 -8l8 -6l12 4l14 -2v20h-54z" fill="#141a26"/>` + lit(palm(184, 104, .5), NIGHT);
    // the facade: stucco, tiled roof, the balcony with its deep shadow, an upper window, the patterned signboard
    const st = uid('pbk' + u);
    const facade = grad(st, [[0, '#262838'], [.6, '#3e4052'], [1, '#6a6e80']], 1, 0) + `<rect x="0" y="0" width="146" height="128" fill="url(#${st})"/>`
      + Array.from({ length: 30 }, (_, k) => { const r = R(k + 3); return `<rect x="${f1(r() * 140)}" y="${f1(20 + r() * 100)}" width="${f1(3 + r() * 6)}" height="${f1(1.4 + r())}" fill="#3a3a48" opacity=".25"/>`; }).join('')
      + `<path d="M-4 0h154v18l-158 0z" fill="#5a2a22"/>` + Array.from({ length: 16 }, (_, k) => `<path d="M${k * 10 - 4} 18q5 -6 10 0" stroke="#2a1410" stroke-width=".8" fill="#6a3428"/>`).join('') + `<path d="M-4 18h154" stroke="#1a0a06" stroke-width="1.6"/><path d="M146 0v128" stroke="#c8d0dc" stroke-width="1.4" opacity=".7"/>`
      + `<rect x="78" y="24" width="18" height="22" fill="#141824" stroke="#2a2a30" stroke-width="1.6"/><path d="M87 24v22" stroke="#2a2a30"/><rect x="108" y="24" width="18" height="22" fill="#1e2232" stroke="#2a2a30" stroke-width="1.6"/>`
      + `<g filter="url(#drop${u})"><rect x="68" y="34" width="64" height="14" rx="1.5" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/>${[0, 1, 2, 3, 4, 5].map(k => `<path d="M${74 + k * 9.4} 41q2.3 -4 4.6 0t4.6 0" stroke="#e8c46a" stroke-width=".9" fill="none"/>`).join('')}<rect x="71" y="36.6" width="58" height="8.8" fill="none" stroke="#c9a048" stroke-width=".5"/></g><path d="M74 34v-6M126 34v-6" stroke="#2a2a2a" stroke-width=".8"/>`
      + `<path d="M58 52h88v4h-88z" fill="#3a3a44"/><path d="M58 56h88" stroke="#0a0a10" stroke-width="2.4"/>` + Array.from({ length: 12 }, (_, k) => `<path d="M${62 + k * 7} 52v-8" stroke="#1a1a20" stroke-width="1"/>`).join('') + `<path d="M60 44h84" stroke="#1a1a20" stroke-width="1.4"/>`
      + `<rect x="58" y="56" width="88" height="10" fill="#0a0a14" opacity=".5"/>`;
    // the shutter torn off one hinge, hanging askew
    const shutter = `<g transform="translate(8 14)"><rect x="28" y="34" width="22" height="30" fill="#141824" stroke="#2a2a30" stroke-width="1.4"/><g transform="rotate(28 30 36)" filter="url(#drop${u})"><rect x="30" y="36" width="12" height="30" fill="#3a5a4a" stroke="#1a2a20" stroke-width=".6"/>${[0, 1, 2, 3, 4, 5].map(k => `<path d="M31 ${40 + k * 4.4}h10" stroke="#1a2a20" stroke-width=".8"/>`).join('')}</g><circle cx="30" cy="36" r="1.2" fill="#2a2a2a"/></g>`;
    // the breach: a ragged hole in the ground floor, broken bricks round it, the dark vault inside
    const hole = `<path d="M44 128L42 96L52 84L60 78L72 72L88 70L104 74L112 82L120 96L124 128z" fill="#06060a"/><path d="M50 128v-30h20v30M78 128v-40h22v40" fill="none" stroke="#14141c" stroke-width="1.2"/>`
      + `<path d="M44 128L42 96L52 84L60 78L72 72L88 70L104 74L112 82L120 96L124 128" fill="none" stroke="#8a7a6a" stroke-width="1.2"/>`
      + [[46, 92], [54, 82], [66, 74], [96, 71], [108, 78], [118, 92], [40, 112], [122, 110]].map(([x, y], k) => `<rect x="${x - 3}" y="${y - 2}" width="6" height="3.4" fill="#9a5a40" stroke="#3a1a10" stroke-width=".4" transform="rotate(${k * 23} ${x} ${y})"/>`).join('');
    const street = `<rect y="128" width="200" height="${H - 128}" fill="#2a2a30"/>` + Array.from({ length: 14 }, (_, k) => { const y = 129 + k * k * .9 + k * 3, w = 7 + k * 1.4; return Array.from({ length: Math.ceil(200 / w) + 1 }, (_, i) => `<rect x="${f1(i * w - (k % 2) * w / 2)}" y="${f1(y)}" width="${f1(w - 1)}" height="${f1(3 + k * .6)}" rx="1.4" fill="#4a4a52" stroke="#16161a" stroke-width=".4"/>`).join(''); }).join('')
      + `<path d="M0 128h200" stroke="#0a0a0e" stroke-width="1.6"/>` + [[52, 136], [64, 140], [118, 134], [30, 146], [100, 150]].map(([x, y], k) => `<rect x="${x}" y="${y}" width="${5 + k % 3}" height="3" fill="#8a5038" stroke="#2a1008" stroke-width=".4" transform="rotate(${k * 31} ${x} ${y})"/>`).join('');
    // the safe on its wheels, the dial without marks, coins spilling from the sprung door
    const sx = 104, sy = 104;
    const safe = shadow(u, sx, 127, 40, .6) + `<g filter="url(#drop${u})"><rect x="${sx - 32}" y="${sy - 26}" width="64" height="44" rx="3" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".8"/><rect x="${sx - 28}" y="${sy - 22}" width="56" height="36" rx="2" fill="#24282c" stroke="url(#brass${u})" stroke-width="1.2"/>`
      + `<circle cx="${sx - 6}" cy="${sy - 4}" r="7" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".6"/><circle cx="${sx - 6}" cy="${sy - 4}" r="3" fill="#3a2a10"/>${Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return `<path d="M${f1(sx - 6 + Math.cos(a) * 5.4)} ${f1(sy - 4 + Math.sin(a) * 5.4)}L${f1(sx - 6 + Math.cos(a) * 6.6)} ${f1(sy - 4 + Math.sin(a) * 6.6)}" stroke="#5a4010" stroke-width=".4"/>`; }).join('')}`
      + `<path d="M${sx + 14} ${sy - 18}v28" stroke="#0a0a0c" stroke-width="2"/><path d="M${sx + 10} ${sy - 10}h7v8h-7z" fill="url(#brass${u})"/><path d="M${sx - 28} ${sy - 21}h56" stroke="#c8d0d8" stroke-width=".6" opacity=".6"/>`
      + [[sx - 22, 1], [sx + 22, -1]].map(([wx]) => `<circle cx="${wx}" cy="${sy + 18}" r="7" fill="#2a2018" stroke="#0a0806" stroke-width=".8"/><circle cx="${wx}" cy="${sy + 18}" r="2" fill="url(#iron${u})"/>${[0, 1, 2, 3].map(k => `<path d="M${wx} ${sy + 18}l${f1(Math.cos(k * .8) * 6)} ${f1(Math.sin(k * .8) * 6)}" stroke="#5a4028" stroke-width="1"/>`).join('')}`).join('') + `</g>`
      + Array.from({ length: 12 }, (_, k) => { const r = R(k + 50); return `<ellipse cx="${f1(sx + 16 + r() * 8)}" cy="${f1(sy + 4 + k * 2)}" rx="2" ry="1" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".3"/>`; }).join('')
      + put('coins', sx + 20, 130, .5, 0, u) + put('coins', sx - 40, 134, .4, 0, u);
    // the team: two horses' hindquarters, tails, hind legs mid-stride; the traces taut to the safe
    const horse = (x, y, s, step, c1, c2) => { const g = uid('phs' + u); return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#drop${u})"><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`
      + `<path d="M0 0q-4 -12 8 -16q14 -2 30 0v18q-6 6 -14 6l-2 22l3 2h-6l-2 -22q-6 0 -10 -4l-4 20l3 2h-6l2 -22q-4 -2 -2 -6z" fill="url(#${g})" stroke="#0a0604" stroke-width=".5"/>`
      + `<path d="M2 -6q-8 6 -8 20q-1 6 3 10q-3 -10 1 -16q2 -6 6 -8z" fill="#1a1210" stroke="#0a0604" stroke-width=".4"/><path d="M6 -14q14 -4 30 -2" stroke="#c8d0dc" stroke-width=".7" fill="none" opacity=".7"/>`
      + `<path d="M${2 + step} 30h5v3h-6zM18 30h5v3h-6z" fill="#1a1410"/></g>`; };
    const team = horse(156, 98, .95, -2, '#5a3a24', '#1e120a') + horse(170, 92, .8, 2, '#3a2a20', '#140c08')
      + `<path d="M${sx + 32} ${sy - 10}L156 96M${sx + 32} ${sy + 4}L158 104" stroke="#2a1a0a" stroke-width="1.4"/><path d="M${sx + 32} ${sy - 10}L156 96M${sx + 32} ${sy + 4}L158 104" stroke="#c8a878" stroke-width=".5"/>`;
    const dust = smoke(u, 74, 126, .55, 7, -1.2, 9, '#6a6670', 16) + smoke(u, 160, 128, .4, 5, -1, 4, '#5a5660', 10);
    // the watchman running up the street from the left, his lantern swinging
    const guard = `<g transform="translate(22 106)"><path d="M-2 -10q2 -3 4 0l1 9l3 9h-2l-3 -7l-3 7h-2l2 -9z" fill="#14141c"/><circle cx="0" cy="-12.6" r="2.4" fill="#1a1a22"/><path d="M-4 -14.6h8l-1 -2h-6z" fill="#14141c"/><path d="M2 -7l5 3" stroke="#14141c" stroke-width="1.4"/><path d="M7 -4v3" stroke="#2a2a2a" stroke-width=".5"/><rect x="5.6" y="-1" width="3" height="4" fill="#ffd27a"/></g>` + glow(u, 29, 107, 12, 12, '#ffc060', .7);
    const light = glow(u, 172, 58, 80, 60, '#c8d8f0', .14) + glow(u, 29, 110, 30, 14, '#ffb050', .25) + gloom(u, 160, 40, 0, 100, .35, '#04060c') + gloom(u, 100, 140, 100, 280, .55, '#020408');
    return [back + facade + shutter + hole + street, dust + safe + team + guard + light];
  },

  // Hoist the colours: the big black flag goes up on the staff in its socket on the rail and streams out against
  // the moon; on both pirate ships at either side the same flags are breaking out in the same wind.
  'Поднять флаги!': u => {
    const hz = 96;
    const back = night(u, hz, 104, 52, 7, 33);
    const ships = lit(sailing('pearl', 166, 84, .72, 0, u, false), NIGHT) + lit(`<g transform="translate(40 0) scale(.85 1) translate(-40 0)">${sailing('revenge', 40, 86, 1, 2, u, false)}</g>`, NIGHT)
      + `<path d="M172 64l9 1l-1 4l-8 0z" fill="#0a0a0c" stroke="#9ab0c8" stroke-width=".3"/><path d="M38 60l10 1.4l-1 5l-9 -.4z" fill="#0a0a0c" stroke="#9ab0c8" stroke-width=".3"/>`;
    const rail = `<rect y="112" width="200" height="20" fill="#2a1e14"/>` + woodTex(u, 0, 112, W, 20, '#3a2a1c', '#1a120a', '#0a0604', 5, false, 4) + `<path d="M0 112h200" stroke="#a8b8c8" stroke-width="1" opacity=".7"/><path d="M0 108h200v4h-200z" fill="#4a3424"/><path d="M0 108h200" stroke="#c8d4e4" stroke-width=".6" opacity=".6"/>`
      + woodTex(u, 0, 132, W, H - 132, '#3a2c1e', '#140e08', '#060402', 9, false, 7);
    // the staff from its socket on the rail to the block at the head; the halyard runs down to a cleat
    const staff = `<path d="M56.6 120V16h2.8v104z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".4"/><rect x="53" y="112" width="10" height="9" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".5"/><circle cx="58" cy="15" r="2.6" fill="url(#oak${u})" stroke="#140a04" stroke-width=".4"/>`
      + `<path d="M60.4 16V114" stroke="#c8b898" stroke-width=".5"/><path d="M62 112h8v2h-8z" fill="url(#iron${u})"/><path d="M60.4 110q4 2 6 2" stroke="#c8b898" stroke-width=".5" fill="none"/>`;
    // the flag: black cloth, skull and crossed bones, worn and frayed at the fly; the moon glows through it
    const skull = `<g transform="translate(100 50)"><path d="M-14 12l28 -10M-14 2l28 10" stroke="#e8e0cc" stroke-width="3.2" stroke-linecap="round"/>${[[-14, 12], [14, 2], [-14, 2], [14, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#e8e0cc"/>`).join('')}`
      + `<path d="M-9 -4q0 -12 9 -12t9 12q0 4 -3 6v4h-12v-4q-3 -2 -3 -6z" fill="#efe8d6"/><ellipse cx="-3.6" cy="-4" rx="2.6" ry="3" fill="#121214"/><ellipse cx="3.6" cy="-4" rx="2.6" ry="3" fill="#121214"/><path d="M0 0l-1.4 2.4h2.8z" fill="#121214"/><path d="M-4 5v1.6M-1.4 5v1.6M1.4 5v1.6M4 5v1.6" stroke="#121214" stroke-width=".6"/></g>`;
    const flag = cloth(u, 60, 22, 82, 86, '#1e1e24', '#0a0a0c', 5, skull) + glow(u, 104, 52, 30, 26, '#c8d8f0', .16) + `<path d="M60 22q22 -3 43 1t43 -1" stroke="#c8d8f0" stroke-width=".8" fill="none" opacity=".7"/>`
      + `<circle cx="72" cy="40" r="1.4" fill="#c8d8f0" opacity=".5"/><circle cx="134" cy="66" r="1" fill="#c8d8f0" opacity=".5"/>`;
    const light = glow(u, 104, 52, 70, 50, '#c8d8f0', .12) + gloom(u, 100, 132, 100, 280, .55, '#020408');
    return [back + ships, rail + staff + flag + light];
  },

  // The right of parley: a white flag on a pole stuck in the sand, the code of the brethren open on a flat stone
  // with the wind lifting its pages, a lantern beside it; the longboat drawn up on the beach.
  'Право на переговоры': u => {
    const hz = 86;
    const back = night(u, hz, 170, 57, 6, 41) + `<path d="M0 ${hz}q20 -6 44 -3q14 -3 30 3z" fill="#1a2838" opacity=".8"/>`;
    const shore = `<path d="M0 97q40 -4 80 -1t120 -2V104H0z" fill="#3a3a40"/>` + sand(u, 100, H, '#6a6252', '#1e1a14', 12, '#e8e0c8')
      + `<path d="M0 97q40 -4 80 -1t120 -2" stroke="#e8f4ff" stroke-width="1.4" fill="none" opacity=".75"/><path d="M0 100q40 -2 80 0t120 -1" stroke="#c8dcf0" stroke-width=".6" fill="none" opacity=".5"/>` + spray(0, 92, 200, 6, 30, 5);
    // the pole stuck in the sand, a little heap round its foot; the flag glowing white under the moon
    const pole = `<path d="M50.8 130V14h2.6v116z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".4"/><path d="M44 130q8 -4 16 0z" fill="#5a5444"/><circle cx="52" cy="13" r="1.8" fill="url(#oak${u})"/>`;
    const flag = cloth(u, 53.4, 22, 76, 92, '#f4f0e6', '#b8b4aa', 9) + glow(u, 100, 48, 60, 36, '#e8f0ff', .2);
    // the stone, the book open on it (patterned lines for text), pages lifting to the right, the lantern
    const stone = shadow(u, 112, 132, 44, .55, 4) + `<path d="M76 128q4 -12 34 -14q34 -1 44 6q6 4 2 9q-20 4 -44 4q-30 0 -36 -5z" fill="#6a6a64" stroke="#1a1a18" stroke-width=".6"/><path d="M82 120q30 -6 66 -2" stroke="#c8d0d8" stroke-width=".8" fill="none" opacity=".6"/>`;
    const lines = (x, y, n, w) => Array.from({ length: n }, (_, k) => `<path d="M${x} ${y + k * 2.4}q${w / 3} -.6 ${w * .66} 0t${w * .34} 0" stroke="#5a4a38" stroke-width=".45" fill="none"/>`).join('');
    const book = `<g filter="url(#drop${u})"><path d="M90 120l22 -4l22 4l-1 3l-21 -3l-21 3z" fill="#5a1a10"/><path d="M92 119q10 -6 20 -3v4q-10 -2 -20 2z" fill="#efe4c8"/><path d="M112 116q10 -3 20 3l0 3q-10 -4 -20 -2z" fill="#e4d8bc"/></g>`
      + `<path d="M92 118q10 -10 20 -8M112 110q8 -8 18 -4" stroke="#d8ccb0" stroke-width=".4" fill="none"/>`
      + `<g filter="url(#drop${u})"><path d="M112 116q6 -14 18 -16q-2 8 2 16q-10 -2 -20 0z" fill="#f2e8d0"/><path d="M112 116q10 -18 26 -12q-6 6 -4 14q-12 -4 -22 -2z" fill="#f8f0dc" opacity=".9"/></g>`
      + `<g transform="translate(94 112) skewY(-14)">${lines(0, 0, 3, 14)}</g><g transform="translate(116 106) skewY(-30)">${lines(0, 0, 3, 14)}</g>`;
    const lamp = `<g transform="translate(150 116)" filter="url(#drop${u})"><path d="M-5 0h10l-1 -3h-8z" fill="#2a2018"/><rect x="-4" y="-13" width="8" height="10" rx="1" fill="#ffd27a" stroke="#2a2018" stroke-width="1"/><path d="M0 -13v10M-4 -8h8" stroke="#2a2018" stroke-width=".6"/><path d="M-5 -13h10l-2 -3h-6z" fill="#2a2018"/><path d="M0 -16q-3 -4 0 -6q3 2 0 6" stroke="#2a2018" stroke-width=".8" fill="none"/></g>` + glow(u, 150, 108, 26, 20, '#ffc060', .65) + glow(u, 122, 112, 22, 8, '#ffc060', .35);
    // the longboat drawn up, oars inside; footprints from the water; shells
    const boat = `<g transform="translate(104 176) scale(1.4)">${put('longboat', 0, 0, 1, 0, u)}</g>`;
    const steps = Array.from({ length: 8 }, (_, k) => `<ellipse cx="${f1(70 - k * 3 + (k % 2) * 6)}" cy="${f1(140 + k * 9)}" rx="2" ry="3.4" fill="#2a2418" opacity=".5" transform="rotate(-10 ${f1(70 - k * 3 + (k % 2) * 6)} ${f1(140 + k * 9)})"/>`).join('')
      + [[40, 150], [168, 156], [150, 200]].map(([x, y]) => `<path d="M${x - 4} ${y}q4 -6 8 0z" fill="#e8dcc0" stroke="#6a5a40" stroke-width=".4"/>`).join('');
    const light = glow(u, 170, 80, 70, 40, '#c8d8f0', .12) + gloom(u, 100, 140, 100, 280, .55, '#020408');
    return [back + shore, steps + boat + pole + flag + stone + book + lamp + light];
  },

  // Tia Dalma: in the swamp hut jars hang from the beams on strings, candles and herbs on the shelf; three sea cards
  // lie face down on the table, two live crabs crawl over them, bones and beads beside; the round window to the fog.
  'Тиа Дальма': u => {
    const wall = woodTex(u, 0, 0, W, 130, '#3a2a1a', '#1a120a', '#0a0604', 9, true, 11) + beam(u, 0, 0, W, 14) + `<path d="M0 22h200" stroke="#0a0604" stroke-width="2"/>`;
    // the round window: fog over the swamp, mangrove roots, the moon
    const win = `<circle cx="160" cy="72" r="24" fill="#2a1a0c" stroke="#120804" stroke-width="1"/><clipPath id="ptw${u}"><circle cx="160" cy="72" r="20"/></clipPath><g clip-path="url(#ptw${u})">`
      + sky(u, 50, 44, [[0, '#0e1a1c'], [1, '#3a5a54']]) + moon(u, 168, 62, 4, '#e8f4ec', '#c8f0e0', .4)
      + `<path d="M140 92q4 -14 2 -24M146 92q-2 -10 4 -18M174 92q2 -12 -2 -20M180 92q-4 -8 2 -16" stroke="#0a1412" stroke-width="2" fill="none"/><path d="M134 76q14 -8 24 -2q12 -8 26 0v10h-50z" fill="#0e1a18"/>`
      + `<rect x="138" y="80" width="46" height="16" fill="#b8e0d0" opacity=".25"/></g><path d="M140 72h40M160 52v40" stroke="#2a1a0c" stroke-width="1.6"/><circle cx="160" cy="72" r="20" fill="none" stroke="#c9a048" stroke-width=".6" opacity=".5"/>`;
    const shelf = `<rect x="12" y="80" width="104" height="4" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/><path d="M20 84l6 6M108 84l-6 6" stroke="#2a1a0a" stroke-width="1.6"/>`
      + put('candleTall', 30, 66, .7, 0, u) + put('candleTall', 52, 68, .6, 0, u) + [70, 82, 96].map((x, k) => `<path d="M${x} 80q-3 -10 -1 -16M${x + 2} 80q2 -10 6 -14M${x + 1} 80q-6 -6 -8 -10" stroke="${['#6a7a3a', '#8a7a4a', '#5a6a3a'][k]}" stroke-width="1" fill="none"/><path d="M${x - 2} 78h6" stroke="#8a6a3a" stroke-width="1.4"/>`).join('');
    // jars on strings from the beams: high ones in the middle, the side ones lower
    const jar = (x, y, s, col, len) => `<path d="M${x} 14V${y - 8 * s}" stroke="#8a7a5a" stroke-width=".5"/><g transform="translate(${x} ${y}) scale(${s})" filter="url(#drop${u})"><path d="M-3 -8h6v2q3 1 3 5v8q-6 2 -12 0v-8q0 -4 3 -5z" fill="url(#glass${u})" stroke="#2a3a34" stroke-width=".4"/><path d="M-5.4 0v6q5.4 2 10.8 0v-6z" fill="${col}" opacity=".75"/><rect x="-3.4" y="-9.4" width="6.8" height="2" fill="#6a4a2a"/><path d="M-4 -2v6" stroke="#fff" stroke-width=".6" opacity=".5"/></g>`;
    const jars = jar(62, 34, 1.3, '#8a3a2a') + jar(80, 42, 1.1, '#3a7a5a') + jar(100, 30, 1.4, '#c89a3a') + jar(120, 40, 1.2, '#5a3a7a') + jar(138, 34, 1.1, '#3a6a8a')
      + jar(22, 66, 1.2, '#6a8a3a') + jar(176, 64, 1.1, '#9a4a2a') + jar(42, 60, .9, '#3a5a8a');
    const table = tableTop(u, 92, H - 92, '#5a3c22', '#2a1a0c', 13) + `<path d="M0 92h200" stroke="#c08a52" stroke-width="1"/>`;
    // three sea cards in a row, face down (the sea back: waves, no signs); two crabs, bones, beads
    const cards = [62, 100, 138].map((x, k) => cardBack(u, x, 108, (k - 1) * 3, 1.5, .7, '#1e4a52', '#d8e8d8')).join('');
    const crabs = crab(u, 50, 100, 1.05, -24) + crab(u, 160, 116, 1.2, 14);
    const bones = `<g filter="url(#drop${u})">${[[150, 100, 30], [166, 104, -20], [176, 98, 70]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-6 0h12" stroke="#e8dcc0" stroke-width="1.6"/><circle cx="-6" cy="-.8" r="1" fill="#e8dcc0"/><circle cx="-6" cy=".8" r="1" fill="#e8dcc0"/><circle cx="6" cy="-.8" r="1" fill="#e8dcc0"/><circle cx="6" cy=".8" r="1" fill="#e8dcc0"/></g>`).join('')}</g>`
      + `<path d="M20 120q14 8 24 0q8 -6 16 2" stroke="#3a2010" stroke-width=".5" fill="none"/>` + Array.from({ length: 10 }, (_, k) => { const t = k / 9; return `<circle cx="${f1(20 + t * 40)}" cy="${f1(120 + Math.sin(t * 6) * 3)}" r="1.5" fill="${['#c8302a', '#e8d6aa', '#2a6a5a'][k % 3]}" stroke="#1a0e06" stroke-width=".3"/>`; }).join('');
    const fog = grad('ptf' + u, [[0, '#b8e0d0', 0], [.6, '#b8e0d0', .16], [1, '#b8e0d0', 0]]) + `<rect y="130" width="${W}" height="80" fill="url(#ptf${u})"/>`;
    const light = glow(u, 40, 56, 70, 56, '#ffb050', .42) + glow(u, 100, 108, 60, 18, '#ffc070', .2) + glow(u, 160, 72, 30, 30, '#b8e0d0', .2) + gloom(u, 40, 60, 200, 30, .35) + gloom(u, 100, 130, 100, 280, .55);
    return [wall + win + shelf + table, jars + cards + crabs + bones + fog + light];
  },

  // Turner and Swann: two different sabres driven into the wet sand crosswise, black against the last of the
  // sunset; a smith's mark on one blade, a silk ribbon on the other hilt; the ring on the sand between them.
  'Тёрнер и Суонн': u => {
    const hz = 92;
    const back = sky(u, 0, hz + 1, [[0, '#04080f'], [.55, '#141e36'], [.8, '#4a2a3a'], [.93, '#c8502a'], [1, '#f2a050']]) + stars(60, 0, 0, W, 70, 23)
      + glow(u, 100, hz, 120, 14, '#ff9a4a', .5) + `<path d="M0 ${hz - 4}q40 -3 90 -1t110 0" stroke="#ffd090" stroke-width=".6" fill="none" opacity=".5"/>`
      + sea(u, hz, H, '#5a3a3a', '#1e1a2a', '#060810', '#f2a050', '#ffc890', 100, 23) + `<path d="M0 98q50 -3 100 0t100 -1V106H0z" fill="#2a2a34"/>`
      + sand(u, 102, H, '#4a3e36', '#141010', 19, '#f2c8a0') + `<path d="M0 98q50 -3 100 0t100 -1" stroke="#ffe0c0" stroke-width="1.3" fill="none" opacity=".7"/><path d="M0 103q60 -2 120 0t80 0" stroke="#ffd0a0" stroke-width=".5" fill="none" opacity=".45"/>`
      + glow(u, 100, 102, 90, 6, '#ffb070', .3);
    // a sabre: curved blade from the hilt (guard at gx, gy) to the point driven into the sand at (tx, ty)
    const sabre = (gx, gy, tx, ty, px, py, kind) => {
      const mx = (gx + tx) / 2 + (ty - gy) * .08 * (tx > gx ? 1 : -1), my = (gy + ty) / 2 - Math.abs(tx - gx) * .05;
      const blade = `M${gx} ${gy}Q${f1(mx)} ${f1(my)} ${tx} ${ty}`;
      return `<path d="${blade}" stroke="#ff9a4a" stroke-width="7" fill="none" opacity=".5"/><path d="${blade}" stroke="#14161c" stroke-width="4.8" fill="none"/><path d="${blade}" stroke="#ffc890" stroke-width=".6" fill="none" transform="translate(.9 .5)" opacity=".8"/>`
        + `<path d="M${gx} ${gy}L${px} ${py}" stroke="#1a1410" stroke-width="5" stroke-linecap="round"/><path d="M${gx} ${gy}L${px} ${py}" stroke="#ff9a4a" stroke-width=".6" transform="translate(.8 .4)" opacity=".7"/><circle cx="${px}" cy="${py}" r="2.4" fill="#1a1410" stroke="#ffb070" stroke-width=".5"/>`
        + (kind === 'smith' ? `<path d="M${gx - 9} ${gy + 6}q-6 -9 6 -15l14 -3" stroke="#1a1410" stroke-width="2.4" fill="none"/><path d="M${gx - 10} ${gy - 1}l20 -6" stroke="#1a1410" stroke-width="4.4" stroke-linecap="round"/><path d="M${gx - 10} ${gy - 2.4}l20 -6" stroke="#ff9a4a" stroke-width=".7" opacity=".7"/>`
          : `<path d="M${gx - 6} ${gy + 3}q12 9 18 -6q-3 -12 -15 -6" stroke="#1a1410" stroke-width="2.2" fill="none"/><path d="M${gx - 10} ${gy + 3}l20 -4" stroke="#1a1410" stroke-width="4.4" stroke-linecap="round"/><path d="M${gx - 10} ${gy + 1.6}l20 -4" stroke="#ff9a4a" stroke-width=".7" opacity=".7"/>`)
        + `<path d="M${tx - 5} ${ty + 1}q5 -3 10 0" stroke="#1a1410" stroke-width="1.2" fill="none" opacity=".6"/>`;
    };
    const a = sabre(66, 60, 118, 121, 58, 50, 'smith'), b = sabre(134, 60, 82, 121, 142, 50, 'swann');
    // the smith's mark on the first blade: a tiny hammer over an anvil, struck into the steel
    const mark = `<g transform="translate(80 76) rotate(48) scale(.9)" opacity=".9"><path d="M-3 2h6l-1 1.6h-4z M-4 .6h8" stroke="#ffd8a8" stroke-width=".6" fill="none"/><path d="M-1 -.4l2.6 -3M.6 -4.4l2.6 1.4" stroke="#ffd8a8" stroke-width=".7"/></g>`;
    const ribbon = `<path d="M136 64q8 4 14 2t12 4t10 2" stroke="#c83a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M137 66q10 8 18 6t14 6" stroke="#a82a4a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M136 64q8 4 14 2" stroke="#ffb0c0" stroke-width=".5" fill="none"/>`;
    const ring = shadow(u, 100, 121, 6, .6) + `<ellipse cx="100" cy="119" rx="5" ry="2.4" fill="none" stroke="url(#brass${u})" stroke-width="1.8"/><path d="M96 118q4 -2 8 0" stroke="#fff6d0" stroke-width=".6" fill="none"/><circle cx="104" cy="118" r=".9" fill="#fff" opacity=".9"/>` + glow(u, 100, 119, 8, 4, '#ffd890', .5);
    const wave = `<path d="M0 132q30 -5 60 -2t70 -1t70 2v6q-40 -4 -70 -2t-70 1t-60 3z" fill="#e8d8c8" opacity=".25"/><path d="M0 132q30 -5 60 -2t70 -1t70 2" stroke="#fff0e0" stroke-width="1" fill="none" opacity=".6"/>`;
    const prints = Array.from({ length: 6 }, (_, k) => `<ellipse cx="${f1(60 - k * 4 + (k % 2) * 6)}" cy="${f1(150 + k * 14)}" rx="2.2" ry="3.6" fill="#0a0808" opacity=".45"/><ellipse cx="${f1(140 + k * 3 - (k % 2) * 5)}" cy="${f1(152 + k * 13)}" rx="1.8" ry="3" fill="#0a0808" opacity=".45"/>`).join('');
    const hammer = `<g transform="translate(150 170) rotate(-20)" filter="url(#drop${u})"><rect x="-1.6" y="-2" width="3.2" height="22" rx="1" fill="url(#oakH${u})"/><rect x="-7" y="-6" width="14" height="6" rx="1" fill="url(#iron${u})"/></g>`;
    const light = gloom(u, 100, 140, 100, 280, .55, '#020408');
    return [back, wave + prints + hammer + ring + a + b + mark + ribbon + light];
  },

  // Patching sails: a tarred old sail spread across the deck, a shot hole with charred edges, the new light patch
  // half sewn over it; the sailmaker's hand in its leather palm drives the needle; a lantern lights the work.
  'Латаем паруса': u => {
    const deck = woodTex(u, 0, 0, W, H, '#3a2a1c', '#1a120a', '#0a0604', 13, false, 6) + nails(Array.from({ length: 30 }, (_, k) => [10 + (k % 10) * 20, 6 + Math.floor(k / 10) * 13 * 6]), '#0a0604', .5);
    const sg = uid('pcv' + u);
    const sail = `<linearGradient id="${sg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a5042"/><stop offset=".5" stop-color="#3e382e"/><stop offset="1" stop-color="#26221c"/></linearGradient>`
      + `<g filter="url(#drop${u})"><path d="M-20 58L180 48L230 210L10 250z" fill="url(#${sg})"/></g>`
      + [[0, 60, 190, 34], [6, 100, 200, 80], [10, 150, 210, 130], [14, 200, 220, 180]].map(([a, b, c, d]) => `<path d="M${a} ${b}Q100 ${(b + d) / 2 + 6} ${c} ${d}" stroke="#1a1610" stroke-width="2.6" fill="none" opacity=".45"/><path d="M${a} ${b - 2}Q100 ${(b + d) / 2 + 4} ${c} ${d - 2}" stroke="#7a7060" stroke-width=".8" fill="none" opacity=".4"/>`).join('')
      + Array.from({ length: 12 }, (_, k) => `<path d="M${f1(-10 + k * 18)} ${f1(40 - k * 1.8)}L${f1(16 + k * 18)} ${f1(240 - k * 3)}" stroke="#1a1610" stroke-width=".4" opacity=".5"/>`).join('')
      + `<path d="M-20 58L180 48" stroke="#6a5030" stroke-width="3"/><path d="M-20 58L180 48" stroke="#b89a6a" stroke-width="1.2" stroke-dasharray="1.6 1"/>` + Array.from({ length: 8 }, (_, k) => `<circle cx="${f1(4 + k * 22)}" cy="${f1(57 - k * 1.2)}" r="2" fill="none" stroke="url(#brass${u})" stroke-width="1"/>`).join('');
    // the shot hole: torn, charred round the edge; through it the deck planks
    const hole = `<path d="M44 70l10 -10l14 2l12 -6l14 10l4 14l-6 12l2 12l-14 6l-10 -6l-14 6l-10 -12l2 -14z" fill="#0e0a06"/><clipPath id="phl${u}"><path d="M44 70l10 -10l14 2l12 -6l14 10l4 14l-6 12l2 12l-14 6l-10 -6l-14 6l-10 -12l2 -14z"/></clipPath>`
      + `<g clip-path="url(#phl${u})">${woodTex(u, 30, 50, 90, 70, '#4a3422', '#2a1c10', '#0a0604', 13, false, 2)}</g>`
      + `<path d="M44 70l10 -10l14 2l12 -6l14 10l4 14l-6 12l2 12l-14 6l-10 -6l-14 6l-10 -12l2 -14z" fill="none" stroke="#120a04" stroke-width="3" opacity=".9"/><path d="M44 70l10 -10l14 2l12 -6l14 10" fill="none" stroke="#8a4a1a" stroke-width=".7" opacity=".7"/>`
      + [[46, 66], [62, 58], [96, 66], [100, 92], [76, 116], [50, 108]].map(([x, y]) => `<path d="M${x} ${y}l-3 -2M${x} ${y}l2 -3" stroke="#3a2a1a" stroke-width=".6"/>`).join('');
    // the patch: new light canvas over the right half of the hole, the left edge sewn, the right still loose
    const patch = `<g filter="url(#drop${u})"><path d="M75 66l55 -4l3 48l-57 4z" fill="#e8dcc0"/><path d="M75 66l55 -4" stroke="#fff6e0" stroke-width=".6"/></g><path d="M84 68q6 20 2 42M104 66q-4 22 2 44M120 64q4 20 -2 46" stroke="#b8a888" stroke-width="2.4" fill="none" opacity=".35"/><path d="M86 68q6 20 2 42" stroke="#fff8e8" stroke-width=".8" fill="none" opacity=".6"/>`
      + Array.from({ length: 9 }, (_, k) => `<path d="M${f1(74 + k * .1)} ${68 + k * 5}l4 1.4" stroke="#3a2a1a" stroke-width=".7"/>`).join('') + Array.from({ length: 4 }, (_, k) => `<path d="M${80 + k * 6} ${112.6 - k * .4}l1 3.6" stroke="#3a2a1a" stroke-width=".7"/>`).join('');
    // the needle through the patch, the thread back to the last stitch; the hand in its leather palm from the right
    const needle = `<path d="M100 108l-12 4" stroke="url(#silver${u})" stroke-width="1.1" stroke-linecap="round"/><path d="M100 108q8 4 6 10q-2 6 -10 -1q-4 -4 -12 -3" stroke="#d8c8a0" stroke-width=".7" fill="none"/>`;
    const palmL = `<path d="M0 -5.6C4 -7 10 -6.8 13.2 -5.8Q14.6 0 13.4 6C9.6 7.2 4 7 0 5.6z" fill="#7a4a24" stroke="#2a160a" stroke-width=".5"/><circle cx="6" cy="0" r="2.2" fill="url(#iron${u})"/><path d="M2 -4h9M2 4h9" stroke="#c89a62" stroke-width=".4" stroke-dasharray="1 .8"/>`;
    const hand = arm(u, 214, 132, 112, 108, { w0: 22, w1: 12, cloth: '#3a3230', light: '#6a6058', dark: '#14100e', bare: .45, pose: 'pinch', side: 1, s: 1.6, twist: 8 }) + `<g transform="translate(112 108) rotate(${f1(Math.atan2(-24, -102) * 180 / Math.PI + 8)}) scale(1.6)">${palmL}</g>`;
    const lamp = shadow(u, 166, 84, 14, .5) + `<g transform="translate(166 80) scale(1.4)" filter="url(#drop${u})"><path d="M-6 0h12l-1 -3h-10z" fill="#2a2018"/><rect x="-5" y="-15" width="10" height="12" rx="1" fill="#ffd27a" stroke="#2a2018" stroke-width="1"/><path d="M0 -15v12M-5 -9h10" stroke="#2a2018" stroke-width=".6"/><path d="M-6 -15h12l-3 -4h-6z" fill="#2a2018"/><path d="M0 -19q-4 -4 0 -7q4 3 0 7" stroke="#2a2018" stroke-width=".8" fill="none"/></g>` + glow(u, 166, 66, 30, 26, '#ffc060', .7);
    const tools = `<g transform="translate(40 170)" filter="url(#drop${u})"><ellipse rx="9" ry="6" fill="#c8b898" stroke="#5a4a30" stroke-width=".5"/><ellipse rx="3" ry="2" fill="#5a4a30"/>${[0, 1, 2].map(k => `<ellipse rx="${7 - k * 1.6}" ry="${4.6 - k}" fill="none" stroke="#a8986a" stroke-width=".4"/>`).join('')}</g>`
      + `<g transform="translate(150 160) rotate(30)" filter="url(#drop${u})"><path d="M0 -14l2 4v24h-4v-24z" fill="url(#silver${u})"/><rect x="-2.6" y="-26" width="5.2" height="12" rx="2" fill="url(#oakH${u})"/></g>`
      + `<g transform="translate(110 190) rotate(-14)" filter="url(#drop${u})"><path d="M0 -2h18l4 2l-4 2h-18z" fill="url(#silver${u})"/><rect x="-12" y="-2.4" width="12" height="4.8" rx="1.4" fill="#3a2010"/></g>`;
    const light = glow(u, 166, 76, 90, 70, '#ffb050', .35) + glow(u, 100, 20, 120, 40, '#a8c4e0', .1) + gloom(u, 166, 70, 0, 200, .45) + gloom(u, 100, 130, 100, 280, .5);
    return [deck, sail + hole + patch + needle + tools + lamp + hand + light];
  },

  // The carpenter: a breach in the bulwark with the sea showing through it; a new light plank held over it, two
  // nails in on the left, the third half driven; his arm swings the hammer; sawhorse, toolbox, shavings.
  'Плотник': u => {
    const sea0 = sky(u, 0, 70, [[0, '#6a7aa0'], [.6, '#e8a070'], [1, '#f8c890']]) + sea(u, 70, 112, '#8aa0b0', '#5a8090', '#3a6070', '#ffd8a8', '#fff0d0', 120, 31);
    // the bulwark seen from inside: tall planks, a rail, timberheads; the breach with its splintered edges
    const id = uid('pbw' + u);
    const hole = 'M56 48l12 -4l10 6l14 -6l12 4l14 -2l12 6l14 -3l3 14l-2 16l3 14l-4 10l-14 3l-12 -4l-14 4l-12 -2l-14 3l-12 -4l-10 3l-4 -12l2 -16l-3 -14z';
    const wallB = `<mask id="${id}"><rect width="200" height="140" fill="#fff"/><path d="${hole}" fill="#000"/></mask><g mask="url(#${id})">${woodTex(u, 0, 18, W, 94, '#7a5434', '#3e2814', '#1a0e06', 11, false, 8)}`
      + `<rect y="12" width="200" height="9" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/>` + [8, 70, 132, 194].map(x => `<rect x="${x - 4}" y="21" width="8" height="91" fill="url(#oakH${u})" stroke="#1a0e06" stroke-width=".5"/>`).join('') + `</g>`
      + `<path d="${hole}" fill="none" stroke="#2a1a0a" stroke-width="1.4"/>` + Array.from({ length: 22 }, (_, k) => { const r = R(k + 70); const a = r() * Math.PI * 2, x = 100 + Math.cos(a) * 44, y = 74 + Math.sin(a) * 28; return `<path d="M${f1(x)} ${f1(y)}l${f1(Math.cos(a) * -(3 + r() * 4))} ${f1(Math.sin(a) * -(3 + r() * 4))}" stroke="#e8c090" stroke-width="${f2(.8 + r() * .8)}" stroke-linecap="round"/>`; }).join('');
    // the new plank pressed over the breach, nails; chips and dust at the half driven one
    const plank = `<g filter="url(#drop${u})"><rect x="46" y="62" width="112" height="26" rx="1" fill="#e8c088" stroke="#7a5020" stroke-width=".6"/><path d="M48 66q50 -1 108 0M48 74q40 1 108 -1M48 82q60 -2 108 0" stroke="#c89a5a" stroke-width=".5" fill="none"/><path d="M46 62h112" stroke="#fff0d0" stroke-width=".8"/><ellipse cx="96" cy="76" rx="3" ry="2" fill="#b07a3a" opacity=".6"/></g>`
      + nails([[54, 69], [54, 81]], '#2a2a2a', 1.1) + `<path d="M144 74l3 -4" stroke="url(#iron${u})" stroke-width="1.6"/><circle cx="147.4" cy="69.6" r="1.6" fill="url(#iron${u})"/>` + splinters(146, 72, 10, 9, '#f0d8a8', 6) + motes(12, 138, 62, 16, 14, '#ffe8c0', 4);
    const hammerArm = arm(u, 214, 52, 160, 60, { w0: 20, w1: 12, cloth: '#7a5a3a', light: '#b08a5a', dark: '#2a1a0a', bare: .55, hair: true, pose: 'fist', side: 1, s: 1.4 })
      + `<g transform="translate(152 59) rotate(-62)" filter="url(#drop${u})"><rect x="-1.6" y="-4" width="3.4" height="24" rx="1" fill="url(#oakH${u})" transform="rotate(180)"/><rect x="-7" y="-26" width="14" height="6" rx="1" fill="url(#iron${u})"/><path d="M-7 -26h14" stroke="#e8f0f4" stroke-width=".5"/></g>`;
    const deck = woodTex(u, 0, 112, W, H - 112, '#5a3c22', '#2a1a0c', '#0e0804', 9, false, 4) + `<path d="M60 112h12l4 ${H - 112}h-18zM76 112h12l6 ${H - 112}h-18z" fill="#c89a62" opacity=".16"/><path d="M0 112h200" stroke="#0e0804" stroke-width="1.6"/>`;
    const horse = `<g filter="url(#drop${u})"><rect x="20" y="102" width="50" height="6" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".5"/><path d="M26 108l-4 26M30 108l4 26M60 108l-4 26M64 108l4 26" stroke="#5a3a1c" stroke-width="2.4"/></g>`
      + `<g transform="translate(44 100) rotate(-8)" filter="url(#drop${u})"><path d="M-18 0h30l4 -8h-34z" fill="url(#silver${u})" stroke="#3a4248" stroke-width=".4"/>${Array.from({ length: 10 }, (_, k) => `<path d="M${-17 + k * 3} 0l1.4 1.6l1.4 -1.6" stroke="#5a6268" stroke-width=".4" fill="none"/>`).join('')}<rect x="14" y="-10" width="8" height="10" rx="2" fill="url(#oakH${u})"/></g>`
      + Array.from({ length: 10 }, (_, k) => { const r = R(k + 3); return `<ellipse cx="${f1(26 + r() * 40)}" cy="${f1(133 + r() * 6)}" rx="${f1(1.6 + r() * 1.6)}" ry=".9" fill="none" stroke="#f0d0a0" stroke-width=".7" transform="rotate(${f1(r() * 60 - 30)} 46 135)"/>`; }).join('');
    const box = `<g filter="url(#drop${u})"><path d="M140 112h44v22h-44z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/><path d="M140 112l6 -6h32l6 6" fill="#5a3a1c" stroke="#1a0e06" stroke-width=".5"/><path d="M162 106v-6" stroke="#3a2412" stroke-width="2"/><path d="M150 108l4 -8M170 108l-2 -9" stroke="url(#iron${u})" stroke-width="1.6"/></g>`;
    const bucket = `<g transform="translate(110 122)" filter="url(#drop${u})"><path d="M-8 -12h16l-2 15h-12z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/><path d="M-8.4 -8h16.8M-7.6 0h15.2" stroke="url(#iron${u})" stroke-width="1.4"/><ellipse cy="-12" rx="8" ry="2" fill="#2a3a44"/></g>`;
    const light = glow(u, 180, 60, 90, 70, '#ffc080', .3) + shafts(u, 160, 70, [[60, 150, 90, 160]], '#ffd8a0', .12) + gloom(u, 180, 60, 0, 120, .35) + gloom(u, 100, 140, 100, 280, .5);
    return [sea0 + wallB, plank + deck + horse + box + bucket + hammerArm + light];
  },

  // Rum for all: two different hands come in from the lower corners and knock their mugs together, the rum
  // leaping up; the crew's quarters behind, hammocks between the beams; a half empty bottle on a barrel.
  'Ром для всех': u => {
    const back = woodTex(u, 0, 0, W, 140, '#3a2616', '#1a1008', '#0a0604', 12, true, 14) + beam(u, 0, 0, W, 10) + beam(u, 0, 40, W, 6);
    const hammock = (x0, x1, y, sag, body) => `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + sag} ${x1} ${y}" stroke="#2a2018" stroke-width="1" fill="none"/><path d="M${x0 + 6} ${y + 2}Q${(x0 + x1) / 2} ${y + sag + 6} ${x1 - 6} ${y + 2}L${x1 - 8} ${y + 4}Q${(x0 + x1) / 2} ${y + sag + 2} ${x0 + 8} ${y + 4}z" fill="#5a4a36" stroke="#1a1208" stroke-width=".5"/>`
      + (body ? `<path d="M${(x0 + x1) / 2 - 14} ${y + sag - 2}q14 -8 28 -2q-12 6 -28 2z" fill="#140c08" opacity=".9"/>` : '');
    const crew = hammock(-4, 56, 52, 10, 1) + hammock(146, 204, 54, 9, 1) + hammock(76, 136, 44, 8, 1) + `<path d="M-4 52v-6M56 52v-6M146 54v-8M204 54v-8M76 44v-4M136 44v-4" stroke="#2a2018" stroke-width=".8"/>`;
    const lamp = `<path d="M60 10v6" stroke="#2a1a0a" stroke-width=".8"/>` + lantern(60, 28, 1.25);
    const table = tableTop(u, 128, H - 128, '#5a3a20', '#2a1a0a', 15) + `<path d="M40 150q20 -4 40 0q10 4 -10 6q-24 2 -30 -6z" fill="#5a2a0a" opacity=".7"/><path d="M46 150q12 -2 24 0" stroke="#ffc070" stroke-width=".6" fill="none" opacity=".7"/>`;
    // the bottle on its barrel, amber light showing through the dark glass
    const barrel = `<g filter="url(#drop${u})"><path d="M140 126q-3 -14 0 -24h32q3 10 0 24z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M139 108h34M139 120h34" stroke="url(#iron${u})" stroke-width="1.8"/><ellipse cx="156" cy="102" rx="16" ry="3" fill="#5a3a1c"/></g>`
      + shadow(u, 156, 103, 8, .5) + bottle(u, 156, 102, 1.25, '#2a1a0a', '#a85a14', .45, '#7a1a14') + glow(u, 156, 90, 8, 12, '#ffb040', .35);
    // the mugs: a dented tin one and a wooden one, knocked together; the rum leaps up in drops
    const tin = `<g transform="translate(84 72) rotate(16) scale(1.45)" filter="url(#drop${u})"><path d="M-9 -12h18v22q-9 3 -18 0z" fill="url(#ironH${u})" stroke="#2a3034" stroke-width=".5"/><path d="M9 -8q7 0 7 6t-7 6" stroke="#5a6268" stroke-width="2" fill="none"/><ellipse cy="-12" rx="9" ry="2.4" fill="#2a1408"/><path d="M-6 -4q2 3 0 6" stroke="#2a3034" stroke-width=".6" fill="none"/><path d="M-7 -10v18" stroke="#e8f0f4" stroke-width=".7" opacity=".6"/></g>`;
    const wood = `<g transform="translate(118 70) rotate(-14) scale(1.45)" filter="url(#drop${u})"><path d="M-10 -14h20l-1 25q-9 3 -18 0z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".5"/><path d="M-10 -8h20M-10 4h19" stroke="url(#iron${u})" stroke-width="1.6"/><path d="M-10 -10q-8 0 -8 7t8 7" stroke="#5a3418" stroke-width="2.6" fill="none"/><ellipse cy="-14" rx="10" ry="2.6" fill="#2a1408"/></g>`;
    const r = R(9);
    const splash = `<path d="M90 56q4 -18 12 -24q6 12 4 24z" fill="#6a2a08" opacity=".85"/><path d="M96 50q2 -10 6 -14" stroke="#ffc070" stroke-width=".8" fill="none" opacity=".8"/><path d="M112 54q-2 -14 -8 -20" stroke="#c87a2a" stroke-width="1.4" fill="none" opacity=".8"/>`
      + Array.from({ length: 22 }, () => { const x = 74 + r() * 54, y = 36 + r() * 26, rr = .6 + r() * 1.8; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f2(rr)}" fill="#7a3208"/><circle cx="${f1(x - rr * .3)}" cy="${f1(y - rr * .3)}" r="${f2(rr * .35)}" fill="#ffd090" opacity=".9"/>`; }).join('');
    const hands = arm(u, -8, 196, 74, 92, { w0: 40, w1: 18, cloth: '#2a2a30', light: '#5a5a64', dark: '#0a0a0e', cuff: '#1a1a1e', pose: 'hold', side: -1, s: 1.6 })
      + arm(u, 208, 196, 128, 90, { w0: 38, w1: 17, cloth: '#6a3a24', light: '#9a6a44', dark: '#2a140a', bare: .45, pose: 'hold', side: 1, s: 1.6 })
      + `<g transform="translate(140 106) rotate(-52)"><rect x="-8" y="-9" width="9" height="18" rx="2" fill="#e8e0cc" stroke="#9a8a6a" stroke-width=".4"/><path d="M-6 -9l2 18M-2 -9l-2 18" stroke="#b8a888" stroke-width=".4"/><path d="M-8 2h9" stroke="#a83a2a" stroke-width=".8" opacity=".5"/></g>`;
    const light = glow(u, 60, 28, 90, 70, '#ffb050', .38) + glow(u, 100, 60, 40, 30, '#ffc070', .25) + gloom(u, 60, 30, 200, 140, .45) + gloom(u, 100, 140, 100, 280, .55);
    return [back + crew + table + barrel, lamp + splash + tin + wood + hands + light];
  },

  // A jar of dirt: in the storm a gloved hand holds the jar of earth up to the ghost ship; its captain may not set
  // foot on land, and she heels and turns away; a faint warm glow round the jar thins the fog and the rain.
  'Банка с землёй': u => {
    const hz = 82;
    const back = sky(u, 0, hz + 1, [[0, '#0a0e14'], [.5, '#1e2a30'], [1, '#3a4a4a']]) + K.cloudBand(u, 0, 70, '#5a6a70', '#0e1418', 37, 2.2)
      + `<path d="M184 46l-5 8l6 1l-8 10l3 1l-4 8" stroke="#e8f4ff" stroke-width="1.6" fill="none"/><path d="M184 46l-5 8l6 1l-8 10l3 1l-4 8" stroke="#9ac8ff" stroke-width="4" fill="none" opacity=".35"/>` + glow(u, 180, 58, 50, 40, '#c8e0ff', .35)
      + sea(u, hz, H, '#3a5050', '#1a2a2c', '#060c0e', '#a8c8c0', '#c8e8ff', 140, 3) + swell(hz + 6, H, '#c8dcd8', .4, 3);
    // the ghost ship heels and turns away, stern three quarters to us: pale green, a ring of foam round her
    const ghost = `<g transform="rotate(-7 70 76)">${K.tint(`<g transform="translate(70 0) scale(.86 1) translate(-70 0)">${sailing('dutch', 70, 62, 1.45, 0, u, false)}</g>`, [.6, .9, .8], [0, .05, .04], .5)}</g>`
      + `<ellipse cx="72" cy="84" rx="40" ry="4" fill="none" stroke="#e8fff8" stroke-width="1" opacity=".5"/>` + glow(u, 70, 60, 50, 40, '#9ff0d0', .18);
    const rail = woodTex(u, 0, 106, W, 14, '#4a3a2a', '#1e160e', '#0a0604', 4, false, 4) + `<path d="M0 106h200" stroke="#c8dcd8" stroke-width="1" opacity=".8"/>` + `<path d="M0 104h200v3h-200z" fill="#3a2c1e"/>`
      + woodTex(u, 0, 120, W, H - 120, '#3a3026', '#141010', '#060404', 9, false, 8) + [[40, 160, 30], [130, 190, 40], [80, 230, 26]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .12}" fill="#9ab8c0" opacity=".2"/>`).join('');
    // the rain: slanting streaks; near the jar they are lit warm and break into drops
    const r = R(51);
    const rain = Array.from({ length: 90 }, () => { const x = r() * 220, y = r() * 280, l = 6 + r() * 8; const near = Math.hypot(x - 140, y - 82) < 34; return `<path d="M${f1(x)} ${f1(y)}l${f1(-l * .3)} ${f1(l)}" stroke="${near ? '#ffd8a0' : '#b8c8d0'}" stroke-width="${near ? .7 : .45}" opacity="${near ? .9 : .45}"/>`; }).join('')
      + Array.from({ length: 16 }, () => { const a = r() * 6.28, d = 24 + r() * 10; return `<circle cx="${f1(140 + Math.cos(a) * d)}" cy="${f1(82 + Math.sin(a) * d)}" r="${f2(.5 + r() * .6)}" fill="#ffe0b0" opacity=".85"/>`; }).join('');
    // the jar: glass, earth and pebbles inside, a green shoot, the cork, a tag on a string; drops on the glass
    const jx = 140, jy = 82;
    const jar = `<g transform="translate(${jx} ${jy})" filter="url(#drop${u})"><path d="M-17 -18q-3 -6 4 -8h26q7 2 4 8q4 2 4 8v30q0 8 -8 8h-26q-8 0 -8 -8v-30q0 -6 4 -8z" fill="#2a3a38" opacity=".25"/>`
      + `<path d="M-20 4q8 -4 20 -2t20 -2v16q0 8 -8 8h-24q-8 0 -8 -8z" fill="#3a2a1a"/>` + [[-10, 12], [4, 14], [12, 8], [-4, 20], [8, 21]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.8" fill="#8a8274"/>`).join('')
      + `<path d="M0 3q-2 -10 -1 -18" stroke="#4a8a3a" stroke-width="1.4" fill="none"/><path d="M-1 -10q-8 -2 -10 -8q8 0 10 6zM0 -14q8 -4 12 -2q-6 6 -12 4z" fill="#6aaa4a" stroke="#2a5a1a" stroke-width=".4"/>`
      + `<path d="M-17 -18q-3 -6 4 -8h26q7 2 4 8q4 2 4 8v30q0 8 -8 8h-26q-8 0 -8 -8v-30q0 -6 4 -8z" fill="url(#glass${u})" stroke="#c8e0d8" stroke-width=".6"/><path d="M-14 -12v30" stroke="#ffffff" stroke-width="1.6" opacity=".5"/>`
      + `<rect x="-12" y="-33" width="24" height="8" rx="2" fill="#b08a5a" stroke="#4a3018" stroke-width=".5"/><path d="M-10 -31h20" stroke="#e8c898" stroke-width=".5"/>`
      + `<path d="M12 -26q10 2 12 10" stroke="#c8b898" stroke-width=".5" fill="none"/><g transform="translate(25 -12) rotate(14)"><path d="M-4 -3h8v6h-8z" fill="#e8dcc0" stroke="#7a6a50" stroke-width=".4"/><path d="M-2.4 -1q2.4 -1 4.8 0M-2.4 1q2.4 -1 4.8 0" stroke="#7a6a50" stroke-width=".4" fill="none"/></g>`
      + [[-8, -6], [10, -2], [6, 10], [-12, 8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.3" fill="#e8f8ff" opacity=".8"/>`).join('') + `</g>`;
    // the gloved hand from the lower right corner, its fingers under the jar
    const handArm = arm(u, 214, 200, 156, 112, { w0: 34, w1: 16, cloth: '#1e2a2e', light: '#4a5a5e', dark: '#080c0e', cuff: '#4a3420', skin: `url(#leather${u})`, pose: 'fist', side: 1, s: 1.7, twist: -40 });
    const warm = glow(u, jx, jy, 44, 44, '#ffc880', .35) + glow(u, jx, jy + 8, 20, 20, '#ffe0a0', .3);
    const fog = grad('pjf' + u, [[0, '#a8c8c0', 0], [.5, '#a8c8c0', .22], [1, '#a8c8c0', 0]]) + `<rect y="60" width="${W}" height="60" fill="url(#pjf${u})"/>`;
    const light = glow(u, 140, 30, 80, 60, '#c8e0ff', .12) + gloom(u, 100, 130, 100, 280, .55, '#020406');
    return [back + ghost + fog, rail + rain + warm + handArm + jar + light];
  },

  // All according to plan: low over the table, closer than the mad plan; on the route lies the enemy's charge we
  // intercepted, a canvas bag of grapeshot with a tag; the hat, the candle, the closed compass, a spilt mug.
  'Всё по плану': u => {
    const wall = woodTex(u, 0, 0, W, 64, '#4a2e18', '#22140a', '#0e0804', 13, true, 12) + `<rect x="68" y="8" width="64" height="38" rx="2" fill="#2a180a" stroke="#120804"/><rect x="72" y="11" width="56" height="32" fill="#0a1424"/>`
      + `<clipPath id="pvw${u}"><rect x="72" y="11" width="56" height="32"/></clipPath><g clip-path="url(#pvw${u})">${sky(u, 11, 24, [[0, '#060e1c'], [1, '#22384e']])}${stars(12, 72, 11, 56, 20, 2)}${moon(u, 116, 20, 4)}${sea(u, 35, 43, '#2e4a5e', '#14283a', '#081420', '#9ab8d0', '#e8f0ff', 116)}</g><path d="M100 11v32M72 27h56" stroke="#2a180a" stroke-width="2"/>`;
    const table = tableTop(u, 64, H - 64, '#6a4424', '#2a1608', 21);
    // the chart in a low view: wide and foreshortened, route in solid ink
    const chart = `<g filter="url(#drop${u})"><path d="M10 70l180 -2l10 70l-200 4z" fill="#ead6a8"/></g><path d="M24 92q16 -6 30 -2q14 -4 22 2q-6 8 -20 6q-18 2 -32 -6zM130 120q16 -6 30 0q4 6 -10 8q-14 0 -20 -8z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/>`
      + `<path d="M30 124Q60 100 96 108T170 84" stroke="#2a1a10" stroke-width="1.2" fill="none"/><path d="M166 80l6 6M172 80l-6 6" stroke="#8a1a10" stroke-width="1.4"/>`;
    // the bag of grapeshot, the balls bulging the canvas, tied with a cord; a tag with a cross drawn on it
    const bag = `<clipPath id="pgbc${u}"><rect x="-18" y="-20" width="40" height="42"/></clipPath><g transform="translate(100 96) scale(2)"><g clip-path="url(#pgbc${u})">${put('grapebag', 0, 0, 1, 0, u)}</g></g>` + `<path d="M110 76q10 4 14 12" stroke="#8a6a3a" stroke-width=".7" fill="none"/>`
      + `<g transform="translate(126 92) rotate(18)" filter="url(#drop${u})"><path d="M-6 -4h10l3 4l-3 4h-10z" fill="#e8dcc0" stroke="#7a6a50" stroke-width=".5"/><circle cx="4" cy="0" r=".8" fill="#5a4a30"/><path d="M-4 -2l5 4M1 -2l-5 4" stroke="#8a1a10" stroke-width=".9"/></g>`;
    const hat = `<g transform="translate(36 76)" filter="url(#drop${u})"><path d="M-22 6q8 -12 22 -12t22 12q-10 6 -22 6t-22 -6z" fill="#1a1410" stroke="#0a0604" stroke-width=".6"/><path d="M-12 0q2 -14 12 -14t12 14q-12 3 -24 0z" fill="#241c16"/><path d="M-22 6q8 -12 22 -12t22 12" stroke="#c9a048" stroke-width=".8" fill="none"/><path d="M-10 -6q6 -6 14 -4" stroke="#6a5a4a" stroke-width=".6" fill="none"/></g>`;
    const candle = put('candleTall', 160, 72, 1.15, 0, u);
    const comp = `<g transform="translate(162 112)" filter="url(#drop${u})"><ellipse cx="0" cy="4" rx="16" ry="6" fill="#3a2212"/><ellipse cx="0" cy="0" rx="16" ry="6" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".6"/><ellipse cx="0" cy="-1" rx="11" ry="4" fill="none" stroke="#8a6a20" stroke-width=".6"/><path d="M-6 -1l6 -2l6 2l-6 2z" fill="none" stroke="#8a6a20" stroke-width=".5"/><rect x="14" y="-1.4" width="4" height="2.8" fill="url(#brass${u})"/></g>`;
    const mug = `<g transform="translate(34 110)" filter="url(#drop${u})"><path d="M-8 0l1.4 -14h13.2l1.4 14z" fill="url(#leather${u})" stroke="#1a0e06" stroke-width=".6"/><ellipse cy="-14" rx="6.6" ry="1.8" fill="#2a1408"/><path d="M8 -11q6 0 6 4t-6 4" stroke="#3a2010" stroke-width="1.8" fill="none"/><path d="M-6 -12v10" stroke="#e8c49a" stroke-width=".7" opacity=".4"/></g>`
      + `<path d="M40 114q14 -2 24 2q4 4 -8 5q-14 0 -16 -7z" fill="#5a2a0a" opacity=".8"/><path d="M46 115q8 -1 14 1" stroke="#ffc070" stroke-width=".5" fill="none"/>`;
    const light = glow(u, 160, 50, 70, 50, '#ffb050', .42) + glow(u, 160, 46, 12, 16, '#fff0c0', .5) + glow(u, 100, 26, 40, 22, '#a8c4e0', .15) + gloom(u, 160, 60, 0, 120, .4) + gloom(u, 100, 130, 100, 280, .55);
    return [wall + table, chart + bag + hat + mug + comp + candle + light];
  },

  // skeleton (picture units 0–280): path A, orig k 1.6 tx -60 ty -22; horizon y=72 (eye 1.6 m, standing at the bar,
  // 0.5 m above its top), focal 104 units at 1 m; light: the lantern upper left (warm, main, shadows to the right),
  // cold moonlight from the window on the right (rim and a pale patch on the counter)
  // ground: the counter top, back edge at the wall y=106 (1.5 m away), front edge y=129 (0.9 m); its planks run across
  // the view, the gaps between seams grow towards us; below it the front panel to the floor (hidden by the sleeve)
  // wall: brick, frontal, behind the counter; lantern hangs from an iron bracket (bracket y 47, x 22–38), a shelf on two
  // brackets with four bottles standing on it (y 96, x 10–54), a window with the moon (x 134–184, y 48–98)
  // on the counter: three cards face down in a fan (x 136–168, y 110–124) and coins in stacks (x 22–56), contact shadows
  // hand: our right hand rises from the bottom edge in front of the counter, 0.2 m from the eye (drawn at 1.6 about the
  // wrist y 150): sleeve from the bottom, lace cuff y 152–168 (under the glass), back of the hand to us, knuckles y ~92,
  // the card (x 78–114, y 12–60) gripped between the index (in front of it) and the middle finger (behind it); ring and
  // little finger curled, thumb out to the left (tip x 61)
  // flying: the card arrived from the fan — a short blurred trail and one faint after-image from the lower right
  'Ловкость рук': u => {
    const hz = 72;
    // brick wall in the lantern light, darker to the right and down; a cold cast near the window
    let wall = `<rect width="200" height="110" fill="#2a160c"/>`;
    for (let r = 0, y = 0; y < 108; r++, y += 7.4) for (let c = -1; c < 11; c++) {
      const x = c * 19 + (r % 2) * 9.5 + ((r * 3 + c * 7) % 3) * .5, k = (r * 5 + c * 3) % 4;
      wall += `<rect x="${f1(x + .6)}" y="${f1(y + .6)}" width="17.6" height="6.2" rx="1" fill="${['#6e3a22', '#7a442a', '#64341e', '#82492c'][k]}"/><path d="M${f1(x + 1.2)} ${f1(y + 1.2)}h16" stroke="#c88a5a" stroke-width=".4" opacity=".35"/><path d="M${f1(x + 1)} ${f1(y + 6.6)}h17" stroke="#1a0c06" stroke-width=".5" opacity=".5"/>`;
    }
    const wr = R(9);
    wall += Array.from({ length: 30 }, () => `<circle cx="${f1(wr() * 200)}" cy="${f1(wr() * 106)}" r="${f2(.6 + wr() * 1.6)}" fill="#1a0c06" opacity="${f2(.1 + wr() * .15)}"/>`).join('')
      + glow(u, 36, 62, 110, 90, '#ffb860', .42) + gloom(u, 60, 0, 200, 60, .55, '#0c0604') + gloom(u, 100, 40, 100, 108, .35, '#0c0604');
    // the window: deep reveal, a frame with a cross, the night sky with the moon and stars, a little light on the sill
    const wx = 134, wy = 48, ww = 50, wh = 50;
    const win = `<rect x="${wx - 3}" y="${wy - 3}" width="${ww + 6}" height="${wh + 7}" fill="#1a0e08"/><path d="M${wx - 3} ${wy - 3}h${ww + 6}l-3 3h${-ww}z" fill="#3a2212"/>`
      + `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#0a1426"/>` + grad('plw' + u, [[0, '#060c1a'], [1, '#1c2e4c']]) + `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#plw${u})"/>`
      + stars(18, wx + 2, wy + 2, ww - 4, wh - 6, 11) + moon(u, 164, 64, 5.2, '#f6f0d8', '#c8d8ff', .35)
      + `<path d="M${wx} ${wy + wh * .52}h${ww}M${wx + ww / 2} ${wy}v${wh}" stroke="#2a180c" stroke-width="2.4"/><path d="M${wx} ${wy + wh * .52 - .9}h${ww}M${wx + ww / 2 - .9} ${wy}v${wh}" stroke="#6a4428" stroke-width=".5"/>`
      + `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="none" stroke="#2a180c" stroke-width="2.6"/><path d="M${wx + 1.4} ${wy + 1.4}h${ww - 2.8}" stroke="#6a4428" stroke-width=".5"/>`
      + `<path d="M${wx + 3} ${wy + 4}l9 -1M${wx + ww / 2 + 3} ${wy + wh * .52 + 4}l8 -1" stroke="#c8d8ff" stroke-width=".5" opacity=".35"/>`
      + `<path d="M${wx - 4} ${wy + wh + 2}h${ww + 8}l-2 3h${-ww - 4}z" fill="#4a2c16"/><path d="M${wx - 4} ${wy + wh + 2}h${ww + 8}" stroke="#a8c0e0" stroke-width=".5" opacity=".6"/>`;
    // the lantern on an iron bracket, the shelf with bottles below it
    const lamp = `<rect x="20" y="46" width="3.4" height="6" fill="#1a1410"/><path d="M23 48.4h15.6" stroke="#1a1410" stroke-width="1.4"/><path d="M23.4 48.4q6 4 12 0" stroke="#1a1410" stroke-width=".8" fill="none"/><circle cx="36" cy="49.2" r="1" fill="none" stroke="#1a1410" stroke-width=".7"/>`
      + lantern(36, 64.6, 1.08);
    const shelf = `<path d="M14 98l4 8M50 98l-4 8" stroke="#1a1410" stroke-width="1.6"/><rect x="10" y="95.4" width="44" height="3" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".4"/><path d="M10 95.6h44" stroke="#e8b070" stroke-width=".4" opacity=".7"/><rect x="10" y="98.4" width="44" height="1.6" fill="#000" opacity=".35"/>`
      + K.bottle(u, 16.5, 95.4, .6, '#1e3a24', '#5a2a0a', .6) + K.bottle(u, 27, 95.4, .62, '#3a1a14', '#6a1a0a', .3, '#3a3a3a') + K.bottle(u, 37.5, 95.4, .46, '#1a2a3a', '#3a2a10', .45) + K.bottle(u, 47.5, 95.4, .54, '#2e2a14', '#6a4a10', .7, '#7a5a1a');
    // the counter: top seen from 0.5 m above, planks across, seams spreading towards us; a rounded front edge, the panel
    const ct = 106, cf = 129;
    let counter = grad('plc' + u, [[0, '#3a2210'], [1, '#6a4024']]) + `<rect y="${ct}" width="200" height="${cf - ct}" fill="url(#plc${u})"/>`
      + `<path d="M0 ${ct}h200" stroke="#0e0804" stroke-width="1.6"/>`;
    [111.4, 117.8, 125.2].forEach((y, i) => { counter += `<path d="M0 ${y}h200" stroke="#1a0e06" stroke-width="${.5 + i * .2}"/><path d="M0 ${y + .6}h200" stroke="#c08850" stroke-width=".3" opacity=".4"/>`; });
    const cr = R(14);
    counter += Array.from({ length: 22 }, () => { const y = ct + 2 + cr() * (cf - ct - 4), x = cr() * 200, w = 10 + cr() * 30 * (y - hz) / 40; return `<path d="M${f1(x)} ${f1(y)}q${f1(w / 2)} ${f1(cr() - .5)} ${f1(w)} 0" stroke="#24140a" stroke-width=".3" fill="none" opacity=".6"/>`; }).join('')
      + glow(u, 52, 114, 80, 16, '#ffb860', .3) + `<path d="M150 ${ct + 1}L174 ${ct + 1}L186 ${cf - 1}L150 ${cf - 1}z" fill="#9ab8e0" opacity=".1"/>`
      + `<rect y="${cf}" width="200" height="5" fill="url(#oak${u})"/><path d="M0 ${cf + .4}h200" stroke="#e0a868" stroke-width=".7" opacity=".7"/><path d="M0 ${cf + 5}h200" stroke="#0a0604" stroke-width="1.4"/>`
      + `<rect y="${cf + 5}" width="200" height="${280 - cf - 5}" fill="#24140a"/>`
      + Array.from({ length: 6 }, (_, k) => `<rect x="${4 + k * 33}" y="${cf + 12}" width="27" height="120" rx="1" fill="#2e1a0c" stroke="#120804" stroke-width=".8"/><path d="M${5 + k * 33} ${cf + 13}h25" stroke="#6a4224" stroke-width=".5"/>`).join('')
      + `<path d="M0 248h200" stroke="url(#brass${u})" stroke-width="2.4"/>`;
    // on the counter: coins in stacks (left) and the fan of three cards (right), all with contact shadows to the right
    const coins = (x, y, n, r = 3.2) => `<ellipse cx="${x + 1.2}" cy="${y + .5}" rx="${r + 1}" ry="${f2(r * .34)}" fill="#000" opacity=".5"/>` + Array.from({ length: n }, (_, k) => `<ellipse cx="${x}" cy="${f1(y - k * 1.1)}" rx="${r}" ry="${f2(r * .32)}" fill="url(#brass${u})" stroke="#5e4210" stroke-width=".3"/>`).join('') + `<path d="M${x - r} ${y}v${f1(-(n - 1) * 1.1)}" stroke="#fff0b8" stroke-width=".4" opacity=".7"/>`;
    const onCounter = coins(26, 121, 6) + coins(33, 118, 9) + coins(40, 123, 4) + coins(48, 117, 3)
      + `<ellipse cx="54" cy="125" rx="3.2" ry="1" fill="url(#brass${u})" stroke="#5e4210" stroke-width=".3"/>`
      + `<ellipse cx="156" cy="121.4" rx="17" ry="2.4" fill="#000" opacity=".45"/>`
      + K.cardBack(u, 146, 117, -26, .7, .42, '#5a1a1a') + K.cardBack(u, 153, 116.4, -4, .7, .42, '#5a1a1a') + K.cardBack(u, 161, 117.2, 20, .7, .42, '#5a1a1a');
    // the flying card's trail from the fan: a soft streak and two fading after-images
    const ft = blurF('plt' + u, 1.4);
    const trail = ft + `<linearGradient id="plg${u}" gradientUnits="userSpaceOnUse" x1="140" y1="78" x2="112" y2="40"><stop offset="0" stop-color="#e8d6aa" stop-opacity="0"/><stop offset="1" stop-color="#e8d6aa" stop-opacity=".5"/></linearGradient>`
      + `<path d="M140 80L108 44L120 30L146 72z" fill="url(#plg${u})" filter="url(#plt${u})"/>`
      + `<g opacity=".16" filter="url(#plt${u})">${K.cardBack(u, 124, 52, 26, 1.7, 1, '#5a1a1a')}</g>`;
    // the hand: back of the right hand, the card between index (in front) and middle finger (behind)
    const skin = `url(#plsk${u})`, st = 'stroke="#5a2e16" stroke-width=".5"';
    const skinG = `<linearGradient id="plsk${u}" gradientUnits="userSpaceOnUse" x1="70" y1="0" x2="114" y2="0"><stop offset="0" stop-color="#f4c8a0"/><stop offset=".45" stop-color="#d89a72"/><stop offset=".8" stop-color="#a0603e"/><stop offset="1" stop-color="#7a4a3a"/></linearGradient>`;
    // a straight finger from the knuckle (x0,y0) to the tip (x1,y1), width w0 → w1, two joint creases, the nail
    const finger = (x0, y0, x1, y1, w0, w1, j1, j2) => {
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const p = (t, w, sg) => `${f1(x0 + dx * t + nx * w / 2 * sg)} ${f1(y0 + dy * t + ny * w / 2 * sg)}`;
      const tip = `${f1(x1 + dx / L * w1 * .5)} ${f1(y1 + dy / L * w1 * .5)}`;
      const crease = t => { const w = w0 + (w1 - w0) * t; return `<path d="M${p(t, w * .7, 1)}Q${f1(x0 + dx * t - dx / L * 1)} ${f1(y0 + dy * t - dy / L * 1)} ${p(t, w * .7, -1)}" stroke="#8a4a2a" stroke-width=".4" fill="none"/><path d="M${p(t + .04, w * .5, 1)}Q${f1(x0 + dx * (t + .04))} ${f1(y0 + dy * (t + .04) - .6)} ${p(t + .04, w * .5, -1)}" stroke="#7a4028" stroke-width=".3" fill="none" opacity=".7"/>`; };
      const nail = `<path d="M${p(.84, w1 * .62, 1)}L${p(.98, w1 * .56, 1)}Q${tip} ${p(.98, w1 * .56, -1)}L${p(.84, w1 * .62, -1)}Q${f1(x0 + dx * .82)} ${f1(y0 + dy * .82)} ${p(.84, w1 * .62, 1)}z" fill="#f0c8b0" stroke="#a0644a" stroke-width=".35"/><path d="M${p(.88, w1 * .3, 1)}L${p(.96, w1 * .3, 1)}" stroke="#ffffff" stroke-width=".45" opacity=".6"/>`;
      return `<path d="M${p(0, w0, 1)}L${p(1, w1, 1)}Q${tip} ${p(1, w1, -1)}L${p(0, w0, -1)}z" fill="${skin}" ${st}/>`
        + `<path d="M${p(.04, w0 * .62, 1)}L${p(.92, w1 * .62, 1)}" stroke="#ffe0c4" stroke-width=".7" opacity=".5"/><path d="M${p(.04, w0 * .78, -1)}L${p(.94, w1 * .76, -1)}" stroke="#6a3220" stroke-width=".7" opacity=".45"/>`
        + crease(j1) + crease(j2) + nail;
    };
    // a curled finger seen from the back: the knuckle, then the bent middle phalanx pointing at us and down
    const curled = (x, y, w, h) => `<path d="M${f1(x - w / 2)} ${y}Q${f1(x - w / 2 - .4)} ${f1(y + h * .8)} ${f1(x - w * .1)} ${f1(y + h)}Q${f1(x + w * .45)} ${f1(y + h + .4)} ${f1(x + w / 2)} ${f1(y + h * .7)}L${f1(x + w / 2)} ${y}z" fill="${skin}" ${st}/>`
      + `<path d="M${f1(x - w * .42)} ${f1(y + h * .46)}q${f1(w * .42)} ${f1(-1.2)} ${f1(w * .84)} 0" stroke="#8a4a2a" stroke-width=".45" fill="none"/><path d="M${f1(x - w * .3)} ${f1(y + h * .52)}q${f1(w * .3)} -.6 ${f1(w * .6)} 0" stroke="#7a4028" stroke-width=".3" fill="none"/>`
      + `<path d="M${f1(x - w * .36)} ${f1(y + 1.5)}q${f1(-.6)} ${f1(h * .5)} ${f1(.4)} ${f1(h * .8)}" stroke="#ffe0c4" stroke-width=".7" fill="none" opacity=".5"/>`;
    const card = K.cardBack(u, 96.5, 63.5, 13, 1.12, 1, '#5a1a1a');
    const middle = finger(93.6, 98, 99.2, 70.4, 6, 5.2, .38, .7);
    const index = finger(85.2, 100, 87.4, 74.6, 5.8, 5, .36, .68);
    const thumb = `<path d="M84.6 129Q78.4 124 74.2 114.6L70.2 106.4Q69.4 103.4 71.6 102.4Q74 101.6 75.6 104.2L80.6 112.4Q83 116.4 87.6 119z" fill="${skin}" ${st}/>`
      + `<path d="M71.2 104.4Q71.6 102.2 73.8 102.6Q75 103.6 75.4 105.4Q73.6 106.8 71.2 104.4z" fill="#f0c8b0" stroke="#a0644a" stroke-width=".35"/><path d="M75.4 113q2 -.4 3.4 1.4" stroke="#8a4a2a" stroke-width=".4" fill="none"/><path d="M73.4 110.4q3 4 9.6 10" stroke="#ffe0c4" stroke-width=".8" fill="none" opacity=".5"/>`;
    const back = `<path d="M85.4 136Q84.2 129 84.6 122Q84 112 83 104.6Q83.6 99.4 87.8 98.8L96.8 96.6Q103 96.6 106.6 99.4Q111.6 101.2 112.2 106Q112 116 109.6 124Q108.6 130 108.4 136z" fill="${skin}" ${st}/>`
      // tendons fanning to the knuckles, a vein, knuckle highlights from the lantern
      + [[95, 134, 86, 102], [97, 134, 94, 100], [100, 134, 101.6, 101.6], [103, 134, 108.6, 105]].map(([a, b, c, d]) => `<path d="M${a} ${b}Q${f1((a + c) / 2 + .6)} ${f1((b + d) / 2)} ${c} ${d}" stroke="#b07250" stroke-width=".6" fill="none" opacity=".55"/><path d="M${a - .7} ${b}Q${f1((a + c) / 2 - .1)} ${f1((b + d) / 2)} ${c - .7} ${d}" stroke="#ffd8b8" stroke-width=".45" fill="none" opacity=".35"/>`).join('')
      + `<path d="M89 132q3 -8 2 -14t4 -10" stroke="#8a6070" stroke-width=".55" fill="none" opacity=".45"/>`
      + [[86.4, 100.6], [94.2, 98.4], [101.6, 99.4], [108.2, 103]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.4" fill="#ffe2c8" opacity=".45"/><path d="M${x - 1.6} ${y + 1.6}q1.6 .8 3.2 0" stroke="#8a4a2a" stroke-width=".35" fill="none"/>`).join('')
      + `<path d="M108 110q2.6 10 .6 22" stroke="#5a2a18" stroke-width="1.2" fill="none" opacity=".35"/><path d="M84.8 108q-.6 12 .8 26" stroke="#ffe4cc" stroke-width="1" fill="none" opacity=".4"/>`;
    const rings = `<rect x="98.6" y="102.6" width="6.2" height="2.2" rx="1" fill="url(#brass${u})" stroke="#5e4210" stroke-width=".3"/><path d="M99.4 103.2h3.6" stroke="#fff6d0" stroke-width=".45"/>`
      + `<rect x="82.2" y="90" width="6.4" height="2.2" rx="1" fill="url(#brass${u})" stroke="#5e4210" stroke-width=".3" transform="rotate(5 85.4 91)"/><circle cx="85.4" cy="90.4" r="1.6" fill="#7a1420" stroke="#3a0a0a" stroke-width=".3"/><circle cx="84.9" cy="89.9" r=".5" fill="#ffb0b8"/>`;
    // the lace cuff and the dark blue sleeve with its gold-braided turn-back, going down out of the picture
    const cuff = Array.from({ length: 9 }, (_, k) => { const x = 82 + k * 3.4, y = 137 + Math.sin(k * 1.3) * .8; return `<path d="M${f1(x)} ${f1(y)}q1.7 -4.2 3.4 0q-.8 2.4 -1.7 3.2q-.9 -.8 -1.7 -3.2z" fill="#f4eee0" stroke="#a89e88" stroke-width=".35"/>`; }).join('')
      + `<path d="M81 139Q96 136 112 139L113 145Q96 142.6 80 145z" fill="#ece4d2" stroke="#a89e88" stroke-width=".35"/>` + Array.from({ length: 10 }, (_, k) => `<circle cx="${82.6 + k * 3.2}" cy="${f1(141.6 - Math.sin(k / 9 * Math.PI) * .6)}" r=".55" fill="none" stroke="#b8ae98" stroke-width=".3"/>`).join('');
    const sleeve = grad('plv' + u, [[0, '#3a4a7a'], [.4, '#1e2a4e'], [1, '#0a1024']], 1, 0)
      + `<path d="M77 146Q96 142 116 146L128 290H50z" fill="url(#plv${u})" stroke="#060a16" stroke-width=".6"/>`
      + `<path d="M76 146Q96 142 117 146L119 162Q96 157 73 162z" fill="#1a2650" stroke="#060a16" stroke-width=".5"/><path d="M75 149Q96 145 118 149M74 159Q96 154.6 119 159" stroke="url(#brass${u})" stroke-width="1.3" fill="none"/>`
      + [84, 96, 108].map(x => `<circle cx="${x}" cy="${f1(154 - Math.sin((x - 74) / 45 * Math.PI) * 2)}" r="1.6" fill="url(#brassR${u})" stroke="#5e4210" stroke-width=".3"/>`).join('')
      + `<path d="M64 200q10 -6 24 -4M60 236q14 -8 30 -4" stroke="#060a16" stroke-width="1.2" fill="none" opacity=".6"/><path d="M80 164q-6 40 -16 116" stroke="#5a6aa0" stroke-width="1.2" fill="none" opacity=".4"/>`;
    // the hand is close to the eye (0.2 m): the whole group is drawn at 1.6 about the wrist, which sits at y 153
    const hand = `<g transform="translate(96 153) scale(1.6) translate(-96 -136)">` + skinG + sleeve + cuff + middle + card + back + curled(101.8, 98.6, 6, 12.6) + curled(108.6, 102, 5.2, 10.4) + index + rings + thumb
      + glow(u, 96, 64, 22, 26, '#ffe8c0', .12) + `</g>`;
    const light = gloom(u, 0, 131, 0, 280, .25, '#0a0604');
    return [wall + win + lamp + shelf + counter + onCounter, trail + hand + light];
  },
  'Чёрные паруса в ночи': u => {
    const hz = 92;
    const back = sky(u, 0, hz + 1, [[0, '#03060c'], [.6, '#101c30'], [1, '#22344c']]) + stars(110, 0, 0, W, 86, 61) + moon(u, 130, 64, 10, '#f8f2dc', '#dfe8ff', .55)
      + sea(u, hz, H, '#22384e', '#0e1c2c', '#03080e', '#8aa8c0', '#f0f4ff', 130, 61);
    // the ship: drawn twice, a light copy nudged towards the moon for the rim, the dark silhouette over it
    const shipImg = img('pearl', 102, 92, 1.8, 0, u);
    const rimF = uid('prf' + u), darkF = uid('pdf' + u), wl = 92 + .205 * 115.2, cut = uid('pcu' + u);
    const ship = `<filter id="${rimF}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .86  0 0 0 0 .9  0 0 0 0 1  0 0 0 1 0"/></filter><filter id="${darkF}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".16 0 0 0 0  0 .17 0 0 0  0 0 .22 0 .01  0 0 0 1 0"/></filter>`
      + `<clipPath id="${cut}"><rect x="0" y="0" width="200" height="${f1(wl)}"/></clipPath><g clip-path="url(#${cut})"><g filter="url(#${rimF})" transform="translate(.9 -.7)" opacity=".85">${shipImg}</g><g filter="url(#${darkF})">${shipImg}</g></g>`
      + `<path d="M56 ${f1(wl)}q46 3 96 0" stroke="#c8d8f0" stroke-width=".8" fill="none" opacity=".5"/>` + glow(u, 96, wl + 2, 60, 4, '#c8d8f0', .3)
      + [[154, 98, 7], [120, 112, 5], [88, 113, 5]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="1" fill="#ffe0a0"/>` + glow(u, x, y, rr, rr, '#ffb050', .8)).join('');
    // the enemy's flash, small on the horizon at the far left; its ball drops into empty water
    const enemy = muzzle(u, 18, hz - 1, 0, .25) + put('splash', 22, 112, .32, 0, u, false) + `<ellipse cx="22" cy="113" rx="8" ry="1.4" fill="#e8f4ff" opacity=".5"/>` + spray(14, 98, 20, 12, 12, 7);
    const fog = grad('pnf' + u, [[0, '#9ab0c8', 0], [.5, '#9ab0c8', .2], [1, '#9ab0c8', 0]]) + `<rect y="110" width="${W}" height="40" fill="url(#pnf${u})"/>`;
    const light = gloom(u, 100, 130, 100, 280, .55, '#010306');
    return [back, ship + enemy + fog + light];
  }
};

const CAM = {};
for (const k of Object.keys(SCENES)) CAM[k] = { x: 0, y: 0, w: 200 };
// skeletons of the round-2 scenes (docs/tasks/card-art-portrait-2.md): `export.mjs --portrait --skel` checks them.
// item: [id, x of the left side, y of the base, w, h, support, height in m (on the ground), {edge}]
const SKEL = {};
SKEL['Ловкость рук'] = { orig: { k: 1.6, tx: -60, ty: -22 }, horizon: 72, eye: 0.5, light: 'lantern upper-left; moon from the window right',
  items: [
    ['wall', 0, 106, 200, 106, 'behind counter, lantern, shelf, window, trail, card, hand', { bg: 1 }],
    ['counter', 0, 134, 200, 28, 'ground: the counter top y 106–129, its front edge to 134', { edge: 1 }],
    ['lantern', 20, 76, 26, 30, 'hangs on an iron bracket in the wall'],
    ['shelf', 10, 100, 44, 24, 'on two iron brackets in the wall'],
    ['window', 131, 101, 56, 56, 'set in the wall'],
    ['coins', 21, 125, 36, 12, 'on counter'],
    ['fan', 136, 124, 32, 12, 'on counter'],
    ['card', 78, 60, 40, 50, 'held by hand, between index and middle finger'],
    ['trail', 112, 80, 34, 46, 'flying from fan up to the card in hand, in front of window'],
    ['hand', 58, 280, 66, 226, 'arm from the bottom edge, in front of counter', { edge: 1 }]] };
module.exports = { SCENES, CAM, SKEL };
