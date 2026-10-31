// Portrait scenes of the «Месть королевы Анны» deck (docs/tasks/card-art-portrait.md): red, fire and sunset; the
// night comes in a reddish haze. Drawn in picture units (camera {0, 0, 200}: a percentage p is y = 2.8 p).
const K = require('./portrait-kit.cjs');
const sea = K.seaG; // broken glints on the water instead of the even streaks
const { img, put, woodTex, R, shadow, uid, grad, sky, swell, sailing, beam, lantern, motes, glow, gloom, shafts, flame, smoke, rope, coil, nails, blurF,
  f1, f2, stars, moon, tint, lit, DUSK, ball, shot, muzzle, arm, cardBack, sand, bubbles, tableTop, bottle, W, H } = K;

// the deck's skies: sunset over a red sea, and the night in a red haze
const dusk = (u, hz, sx, sy, seed = 3) => sky(u, 0, hz + 1, [[0, '#2a0806'], [.45, '#7a2416'], [.85, '#d8683a'], [1, '#f2b070']]) + glow(u, sx, sy, 60, 40, '#ffd8a0', .6)
  + `<circle cx="${sx}" cy="${sy}" r="9" fill="#ffe8b0" opacity=".95"/>` + K.cloudBand(u, hz - 50, 40, '#f2a070', '#5a1a10', 17 + seed, 2.3, '0.02 0.08')
  + sea(u, hz, H, '#7a3a28', '#3a1810', '#140604', '#f2b070', '#ffd8a0', sx, seed);
const redNight = (u, hz, seed = 5, mx, my) => sky(u, 0, hz + 1, [[0, '#0a0204'], [.5, '#2a0a0a'], [.85, '#6a1e12'], [1, '#a03a1e']]) + stars(40, 0, 0, W, hz - 30, seed, '#ffd8c8')
  + (mx ? moon(u, mx, my, 7, '#ffd8b0', '#ff9a6a', .4) : '') + sea(u, hz, H, '#5a2418', '#2a0c08', '#0a0202', '#d86a3a', mx ? '#ffc890' : '', mx || 100, seed);
// fire on water: a band of tongues of different height in layers, with its glow and a short reflection
function fireBand(u, x0, x1, base, hMin, hMax, seed = 3, n = 9) {
  const r = R(seed); let out = glow(u, (x0 + x1) / 2, base - hMax * .4, (x1 - x0) * .7, hMax * 1.2, '#ff8a2a', .45);
  for (let k = 0; k < n; k++) { const x = x0 + (x1 - x0) * (k + .5) / n + (r() - .5) * 6, h = hMin + r() * (hMax - hMin); out += flame(u, x, base, h / 22, seed + k); }
  return out + `<path d="M${x0} ${base}h${x1 - x0}" stroke="#ffd070" stroke-width="1.4" opacity=".7"/>`
    + Array.from({ length: 7 }, (_, k) => `<path d="M${f1(x0 + r() * (x1 - x0) * .8)} ${f1(base + 3 + k * 3)}h${f1(8 + r() * 16)}" stroke="#ffb050" stroke-width="${f2(1.2 - k * .12)}" opacity="${f2(.6 - k * .07)}"/>`).join('');
}
const splinters = (x, y, n, seed, col = '#e8c090', sp = 14) => { const r = R(seed); return Array.from({ length: n }, () => { const a = r() * Math.PI * 2, d = 3 + r() * sp, l = 1.5 + r() * 3.4; const xx = x + Math.cos(a) * d, yy = y + Math.sin(a) * d * .8; return `<path d="M${f1(xx)} ${f1(yy)}l${f1(Math.cos(a + 1) * l)} ${f1(Math.sin(a + 1) * l)}" stroke="${col}" stroke-width="${f2(.6 + r() * .6)}" stroke-linecap="round"/>`; }).join(''); };
const spray = (x, y, w, h, n, seed, col = '#fff0e0') => { const r = R(seed); return Array.from({ length: n }, () => `<circle cx="${f1(x + r() * w)}" cy="${f1(y + r() * h)}" r="${f2(.25 + r() * .6)}" fill="${col}" opacity="${f2(.4 + r() * .5)}"/>`).join(''); };
const sparks = (x, y, w, h, n, seed, col = '#ffd27a') => { const r = R(seed); return Array.from({ length: n }, () => `<circle cx="${f1(x + r() * w)}" cy="${f1(y + r() * h)}" r="${f2(.3 + r() * .6)}" fill="${col}" opacity="${f2(.5 + r() * .5)}"/>`).join(''); };
// a gun deck wall: dark planks, frames, a beam overhead; a port cut through it at (x, y, w, h) showing `view`
function gunWall(u, y0, y1, port, view, seed = 7) {
  const [px, py, pw, ph] = port, id = uid('pgw' + u);
  return `<clipPath id="${id}"><rect x="${px}" y="${py}" width="${pw}" height="${ph}"/></clipPath><g clip-path="url(#${id})">${view}</g>`
    + `<mask id="${id}m"><rect width="200" height="${y1}" fill="#fff"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#000"/></mask><g mask="url(#${id}m)">${woodTex(u, 0, y0, W, y1 - y0, '#4a2a18', '#22120a', '#0e0604', 12, false, seed)}</g>`
    + `<rect x="${px - 3}" y="${py - 3}" width="${pw + 6}" height="${ph + 6}" fill="none" stroke="#1a0c06" stroke-width="3"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="#c08a52" stroke-width=".6" opacity=".6"/>`;
}
// a cannon seen from behind, breech towards us: the cascabel, the base ring, the barrel running away into the port,
// the carriage cheeks and the two rear trucks
function gunFromBehind(u, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#drop${u})"><path d="M-22 6l4 -24h36l4 24z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M-22 6h44" stroke="#2a1608" stroke-width="2"/>`
    + [-17, 17].map(cx => `<ellipse cx="${cx}" cy="10" rx="5" ry="7" fill="#3a2414" stroke="#140a04" stroke-width=".6"/><ellipse cx="${cx}" cy="10" rx="1.6" ry="2.4" fill="url(#iron${u})"/>`).join('')
    + `<path d="M-9 -16l3 -16h12l3 16z" fill="url(#ironH${u})" stroke="#0e1012" stroke-width=".5"/><ellipse cx="0" cy="-14" rx="12" ry="11" fill="url(#ironH${u})" stroke="#0e1012" stroke-width=".6"/><ellipse cx="0" cy="-14" rx="9" ry="8" fill="none" stroke="#5a6266" stroke-width="1"/>`
    + `<circle cx="0" cy="-14" r="3.6" fill="url(#iron${u})" stroke="#0e1012" stroke-width=".5"/><circle cx="-1" cy="-15" r="1.2" fill="#dfe6ea" opacity=".6"/><rect x="-1.4" y="-27" width="2.8" height="3" fill="#2a2a2a"/></g>`;
}

// a dead sailor or officer standing, feet at (x, y), height h: gaunt green-grey skin, sunken eyes with a dull glow,
// a torn coat. o: { coat, trim, hat ('tricorn' | 'cap' | ''), epaulettes, armL/armR: [upper, fore] angles in degrees
// (0 = hanging down, 90 = held out sideways towards that side), itemR/itemL (svg drawn at the hand), hole (chest),
// light: rim colour, back: hands behind the back, flip }
function deadman(u, x, y, h, o = {}) {
  const s = h / 100, id = uid('pdm' + u), coat = o.coat || '#2a2a3a', trim = o.trim || '#c9a048', skin = o.skin || '#7a8a62', rim = o.light || '#ffb070';
  const limb = (x0, y0, a1, a2, l1, l2, w, col, end) => { const r1 = a1 * Math.PI / 180, r2 = a2 * Math.PI / 180, ex = x0 + Math.sin(r1) * l1, ey = y0 + Math.cos(r1) * l1, hx = ex + Math.sin(r2) * l2, hy = ey + Math.cos(r2) * l2;
    return `<path d="M${f1(x0)} ${f1(y0)}L${f1(ex)} ${f1(ey)}L${f1(hx)} ${f1(hy)}" stroke="#0a0a08" stroke-width="${w + 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${f1(x0)} ${f1(y0)}L${f1(ex)} ${f1(ey)}L${f1(hx)} ${f1(hy)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="${f2(w * .55)}" fill="${skin}" stroke="#1a1a10" stroke-width=".4"/>` + (end ? `<g transform="translate(${f1(hx)} ${f1(hy)})">${end}</g>` : ''); };
  const aL = o.armL || [8, 4], aR = o.armR || [-8, -4];
  const armL = o.back ? '' : limb(-11, -82, -aL[0], -aL[1], 22, 20, 6, coat, o.itemL), armR = o.back ? '' : limb(11, -82, aR[0], aR[1], 22, 20, 6, coat, o.itemR);
  const legs = `<path d="M-6 -46L-8 -22L-7 0M6 -46L8 -22L9 0" stroke="#0a0a08" stroke-width="7.4" fill="none" stroke-linejoin="round"/><path d="M-6 -46L-8 -22L-7 0M6 -46L8 -22L9 0" stroke="${o.pants || '#5a4a3a'}" stroke-width="6.4" fill="none" stroke-linejoin="round"/>`
    + `<path d="M-12 0h9v-3h-8zM5 0h10l-1 -3h-8z" fill="#141008"/>`;
  const body = `<path d="M-13 -84q13 -4 26 0l2 34q2 10 4 18l-6 -3l-3 4l-5 -3l-4 4l-4 -4l-5 3l-3 -4l-6 3q2 -8 4 -18z" fill="${coat}" stroke="#0a0a08" stroke-width=".6"/>`
    + `<path d="M-3 -84l-2 30M3 -84l2 30" stroke="${trim}" stroke-width="1" opacity=".8"/>` + [-76, -70, -64, -58].map(yy => `<circle cx="-5" cy="${yy}" r=".9" fill="${trim}"/>`).join('')
    + `<path d="M-4 -84l4 8l4 -8z" fill="#c8c0a8" opacity=".7"/><path d="M-10 -66l4 4M8 -72l-3 5M-8 -56l5 -2" stroke="#0a0a08" stroke-width=".7"/>`
    + `<path d="M-13 -84q-2 20 0 40" stroke="${rim}" stroke-width=".9" fill="none" opacity=".75"/>`
    + (o.epaulettes ? [-1, 1].map(sd => `<ellipse cx="${sd * 13}" cy="-83" rx="5" ry="2" fill="${trim}"/>` + [0, 1, 2, 3].map(k => `<path d="M${sd * 13 - 3 + k * 2} -82v${3 + (k % 2) * 2}" stroke="${trim}" stroke-width=".6"/>`).join('')).join('') : '')
    + (o.back ? `<path d="M-13 -80q-4 14 4 26M13 -80q4 14 -4 26" stroke="${coat}" stroke-width="6" fill="none" stroke-linecap="round"/>` : '');
  const head = `<path d="M-2.4 -88h4.8v5h-4.8z" fill="${skin}"/><path d="M-7 -93q0 -12 7 -12t7 12q0 6 -3 9q-2 2 -4 2t-4 -2q-3 -3 -3 -9z" fill="${skin}" stroke="#1a1a10" stroke-width=".5"/>`
    + `<ellipse cx="-2.8" cy="-95" rx="2" ry="1.7" fill="#14140c"/><ellipse cx="2.8" cy="-95" rx="2" ry="1.7" fill="#14140c"/><circle cx="-2.6" cy="-95" r=".5" fill="#d8e0a0" opacity=".8"/><circle cx="2.9" cy="-95" r=".5" fill="#d8e0a0" opacity=".8"/>`
    + `<path d="M-5 -90q2 2 0 4M5 -90q-2 2 0 4M-2 -87.6h4" stroke="#3a4228" stroke-width=".5" fill="none"/><path d="M0 -94v3" stroke="#3a4228" stroke-width=".5"/>`
    + `<path d="M-7 -96q-2 6 -1 12M7 -97q2 5 0 10" stroke="#2a2418" stroke-width="1" fill="none"/><path d="M-6 -101q6 -5 12 0" stroke="${rim}" stroke-width=".6" fill="none" opacity=".6"/>`
    + (o.hat === 'tricorn' ? `<path d="M-13 -100q13 -10 26 0q-4 -10 -13 -10t-13 10z" fill="#1a1612" stroke="#0a0806" stroke-width=".5"/><path d="M-13 -100q13 -6 26 0" stroke="${trim}" stroke-width=".8" fill="none"/>`
      : o.hat === 'cap' ? `<path d="M-8 -101q8 -8 16 0q-2 3 -8 3t-8 -3z" fill="#6a1a14"/><path d="M7 -101q5 2 6 7" stroke="#6a1a14" stroke-width="2" fill="none"/>` : '');
  let fig = legs + armL + body + armR + head;
  if (o.hole) fig = `<mask id="${id}"><rect x="-40" y="-120" width="80" height="130" fill="#fff"/><path d="${o.hole}" fill="#000"/></mask><g mask="url(#${id})">${fig}</g><path d="${o.hole}" fill="none" stroke="#2a1a10" stroke-width="1.2"/>`;
  return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})" filter="url(#drop${u})">${fig}</g>`;
}

const SCENES = {
  // Greek fire: the clay pot flies down at the enemy with a trail of flame and black smoke; burning drops falling off
  // it have set a patch of sea on fire short of her.
  'Греческий огонь': u => {
    const hz = 110;
    const back = redNight(u, hz, 9) + K.cloudBand(u, 30, 50, '#7a2a1a', '#1a0606', 23, 2.2);
    const enemy = tint(sailing('endeavour', 152, 96, .74, 0, u), [.34, .2, .18], [.04, 0, 0], .3) + glow(u, 150, 100, 30, 14, '#ff8a3a', .2);
    // the burning patch on the sea where the drops fell, steam and smoke carried off to the left
    const patch = fireBand(u, 58, 112, 118, 6, 16, 5, 7) + smoke(u, 70, 104, .55, 6, -1.4, 12, '#5a4a48', 24) + `<ellipse cx="86" cy="119" rx="34" ry="3" fill="#ffb050" opacity=".35"/>`;
    // the trail behind the pot, up to the left and out past the left edge under the medal: smoke outside, flame in
    const tf = uid('pgt' + u);
    const trail = blurF(tf, 2.4) + `<path d="M-10 46Q30 50 74 64" stroke="#1a1210" stroke-width="22" fill="none" opacity=".75" filter="url(#${tf})" stroke-linecap="round"/><path d="M-10 40Q30 46 74 62" stroke="#3a2a26" stroke-width="12" fill="none" opacity=".6" filter="url(#${tf})"/>`
      + `<path d="M12 56Q40 56 80 66" stroke="#c83a10" stroke-width="12" fill="none" opacity=".75" filter="url(#${tf})" stroke-linecap="round"/><path d="M36 60Q56 62 82 68" stroke="#ff9a2a" stroke-width="7" fill="none" opacity=".9" filter="url(#${tf})" stroke-linecap="round"/><path d="M58 64Q70 66 84 69" stroke="#fff0b0" stroke-width="3" fill="none" filter="url(#${tf})" stroke-linecap="round"/>`
      + sparks(10, 40, 70, 30, 30, 4);
    // the pot: red-brown clay, a painted band, the neck stopped with a burning rag; it points down to the right
    const cg = uid('pgc' + u);
    const pot = `<radialGradient id="${cg}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#e8945a"/><stop offset=".55" stop-color="#a84a22"/><stop offset="1" stop-color="#4a1808"/></radialGradient>`
      + `<g transform="translate(96 72) rotate(28)" filter="url(#drop${u})"><path d="M-26 0q0 -15 18 -16q16 -1 28 6l6 -2v6v6l-6 -2q-12 7 -28 6q-18 -1 -18 -16z" fill="url(#${cg})" stroke="#3a1206" stroke-width=".7"/>`
      + `<path d="M-20 -8q12 -4 30 0M-21 7q14 4 30 0" stroke="#2a0c04" stroke-width="1.6" fill="none"/>${[-14, -6, 2, 10].map(x => `<path d="M${x} -6l3 5l-3 5" stroke="#e8c070" stroke-width=".8" fill="none"/>`).join('')}`
      + `<path d="M-22 -6q8 -8 22 -8" stroke="#ffd0a0" stroke-width="1.2" fill="none" opacity=".6"/><path d="M26 -4h5v8h-5z" fill="#d8c8a0" stroke="#5a4020" stroke-width=".4"/><ellipse cx="-26" cy="0" rx="2" ry="5" fill="#5a2210"/></g>`
      + flame(u, 122, 86, .5, 7) + glow(u, 120, 84, 14, 12, '#ffd070', .7);
    const drops = [[84, 88, 1.6], [92, 96, 1.2], [78, 100, 1.4], [100, 104, 1], [70, 108, .9]].map(([x, y, r]) => `<path d="M${x} ${y}q${r} ${-r * 3} ${r * .3} ${-r * 5}" stroke="#ff8a2a" stroke-width="${r}" fill="none" opacity=".7"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd070"/>` + glow(u, x, y, r * 4, r * 4, '#ff9a3a', .6)).join('');
    const light = glow(u, 96, 70, 70, 50, '#ff8a3a', .25) + gloom(u, 100, 130, 100, 280, .55, '#0a0202');
    return [back + enemy, patch + trail + pot + drops + light];
  },

  // Heated shot: a brazier on three iron legs, the shot glowing in the coals, the gunner's gauntleted hand lifts one
  // with the tongs; behind, the gun waits breech-first at the open port, out there the enemy burns at sunset.
  'Калёные ядра': u => {
    const view = dusk(u, 52, 150, 36, 4) + tint(sailing('endeavour', 100, 38, .6, 0, u), [1, .7, .55], [.05, 0, 0], .8) + flame(u, 92, 42, .35, 3) + flame(u, 108, 42, .3, 5) + smoke(u, 100, 30, .3, 5, -1, 6, '#3a2a28', 18);
    const wall = gunWall(u, 0, 140, [62, 22, 76, 46], view, 5) + beam(u, 0, 0, W, 14) + `<path d="M0 14h200" stroke="#0a0402" stroke-width="1.2"/>` + `<path d="M10 0h60q-10 10 -30 12z" fill="#0a0604" opacity=".5"/>`
      + `<g filter="url(#drop${u})"><path d="M138 22l16 -14l3 3l-15 14z" fill="#8a1a10" stroke="#3a0806" stroke-width=".6"/></g>`;
    const gun = gunFromBehind(u, 100, 86, .95);
    const deck = woodTex(u, 0, 128, W, H - 128, '#5a3820', '#2a160a', '#0e0604', 9, false, 6) + `<path d="M0 128h200" stroke="#0e0604" stroke-width="1.6"/>`;
    // the brazier: an iron bowl on three legs, coals and the shot in them, one white hot; heat shimmer and sparks
    const bx = 92, by = 96;
    const brazier = shadow(u, bx, 130, 44, .6, 4) + `<path d="M${bx - 30} ${by + 6}L${bx - 38} 130M${bx + 30} ${by + 6}L${bx + 38} 130M${bx} ${by + 14}L${bx + 2} 131" stroke="#1a1c1e" stroke-width="3.2"/><path d="M${bx - 30} ${by + 6}L${bx - 38} 130M${bx + 30} ${by + 6}L${bx + 38} 130" stroke="#7a8288" stroke-width=".6"/>`
      + `<path d="M${bx - 42} ${by}q42 26 84 0z" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".8"/><ellipse cx="${bx}" cy="${by}" rx="42" ry="8" fill="#1a0a04"/>`
      + Array.from({ length: 24 }, (_, k) => { const r = R(k + 7); const x = bx - 36 + r() * 72, y = by - 3 + r() * 6; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f2(2 + r() * 2.4)}" fill="${['#8a1a08', '#d8401a', '#ff8a2a'][k % 3]}"/>`; }).join('')
      + [[bx - 22, by - 4, '#d84a1a'], [bx - 6, by - 6, '#ff9a3a'], [bx + 14, by - 5, '#ffe8b0'], [bx + 28, by - 2, '#e86a2a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="${c}"/><circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.6" fill="#fff6d8" opacity=".8"/>` + glow(u, x, y, 9, 9, c, .7)).join('')
      + `<path d="M${bx - 40} ${by - 1}q40 10 80 0" stroke="#dfe6ea" stroke-width=".6" fill="none" opacity=".5"/>` + sparks(bx - 30, by - 40, 60, 34, 26, 3) + glow(u, bx, by - 8, 60, 30, '#ff8a2a', .5);
    const hf = uid('phf' + u);
    const shimmer = `<filter id="${hf}"><feTurbulence type="fractalNoise" baseFrequency=".05 .2" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>`;
    // the gunner's arm from the right edge in a leather gauntlet; the tongs hold a ball over the brazier
    const tongs = `<path d="M178 80L118 80M178 84L118 86" stroke="url(#iron${u})" stroke-width="2.4" stroke-linecap="round"/><path d="M118 80q-8 -2 -10 4M118 86q-8 2 -10 -3" stroke="url(#iron${u})" stroke-width="2.2" fill="none"/>`
      + `<circle cx="104" cy="83" r="5.4" fill="#ffd890"/><circle cx="102.4" cy="81.4" r="1.6" fill="#fffbe6"/>` + glow(u, 104, 83, 12, 12, '#ffb040', .9);
    const gauntlet = arm(u, 214, 94, 176, 84, { w0: 24, w1: 18, cloth: '#7a4a24', light: '#b07a44', dark: '#2a160a', cuff: '#5a3418', skin: `url(#leather${u})`, pose: 'fist', side: 1, s: 1.5 });
    const bucket = `<g transform="translate(26 132)" filter="url(#drop${u})"><path d="M-10 -14h20l-2 18h-16z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/><path d="M-10.4 -9h20.8M-9.6 1h19.2" stroke="url(#iron${u})" stroke-width="1.6"/><ellipse cy="-14" rx="10" ry="2.4" fill="#2a3a44"/><ellipse cx="2" cy="-15" rx="4" ry="1.6" fill="#c8b898"/></g>` + smoke(u, 28, 114, .3, 4, .4, 9, '#d8d0c8', 16);
    const light = glow(u, 92, 90, 90, 60, '#ff8a2a', .32) + glow(u, 100, 44, 50, 30, '#ffb070', .2) + gloom(u, 92, 90, 0, 0, .35) + gloom(u, 100, 140, 100, 280, .5);
    return [wall + deck + gun, bucket + brazier + gauntlet + tongs + light];
  },

  // Grapeshot: the gun stands slanting, its muzzle in the port at point blank range of the enemy's rail; the swarm
  // of lead fans out of the flash and tears into her bulwark and sail; the canvas bag of shot by the carriage.
  'Картечь': u => {
    const view = sky(u, 40, 70, [[0, '#7a2416'], [.6, '#d8683a'], [1, '#f2b070']]) + glow(u, 170, 60, 30, 24, '#ffd8a0', .5)
      + `<path d="M96 70h90v40h-90z" fill="#3a1e10"/>` + woodTex(u, 96, 70, 90, 30, '#5a3420', '#2a160a', '#0e0604', 6, false, 3) + `<path d="M96 70h90" stroke="#c9a048" stroke-width="1.4"/><path d="M96 66h90v4h-90z" fill="#4a2a14"/>`
      + `<path d="M120 66L150 40M140 66L160 40M160 66L170 42" stroke="#1a0c06" stroke-width=".8"/><path d="M150 40l40 -2l-4 26q-16 4 -30 2z" fill="#e8c8a0" opacity=".9"/>`
      + [[132, 78, 2.4], [146, 84, 2], [158, 76, 2.6], [170, 88, 1.8], [124, 90, 2], [176, 52, 1.6], [164, 58, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#0a0604"/>`).join('') + splinters(150, 80, 26, 7, '#f0d0a0', 20);
    const wall = gunWall(u, 0, 132, [96, 46, 80, 52], view, 9) + beam(u, 0, 0, W, 12);
    const deck = woodTex(u, 0, 128, W, H - 128, '#5a3820', '#2a160a', '#0e0604', 9, false, 4) + `<path d="M0 128h200" stroke="#0e0604" stroke-width="1.6"/>`;
    // the gun slanting up to the right (the game's deck cannon), its muzzle in the port
    const gun = shadow(u, 74, 130, 44, .55, 4) + img('deck-cannon', 81, 111, 1.7, -25, u);
    // the swarm of balls fanning out from the muzzle with short blurred streaks
    const mf = uid('pmf' + u), r = R(13);
    const swarm = blurF(mf, .6) + Array.from({ length: 30 }, () => { const a = -.75 + r() * .7, d = 12 + r() * 50, x = 121 + Math.cos(a) * d, y = 75 + Math.sin(a) * d; return `<path d="M${f1(x - Math.cos(a) * 5)} ${f1(y - Math.sin(a) * 5)}L${f1(x)} ${f1(y)}" stroke="#8a8a88" stroke-width="1.2" opacity=".45" filter="url(#${mf})"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.1" fill="#3a3a3c"/><circle cx="${f1(x - .3)}" cy="${f1(y - .3)}" r=".35" fill="#dfe6ea"/>`; }).join('');
    const fire = muzzle(u, 121, 75, -32, 1.1) + smoke(u, 134, 58, .5, 6, 1, 8, '#c8b8a8', 26);
    const bag = `<g transform="translate(40 116) scale(1.4)">${put('grapebag', 0, 0, 1, 0, u)}</g>` + [[60, 128], [66, 126], [18, 130]].map(([x, y]) => ball(u, x, y, 2)).join('')
      + `<g transform="translate(24 104) rotate(-70)" filter="url(#drop${u})"><rect x="-1.6" y="-30" width="3.2" height="60" fill="url(#oakH${u})"/><ellipse cx="0" cy="-32" rx="4" ry="5" fill="#3a2a1a"/></g>`;
    const box = `<g filter="url(#drop${u})" transform="translate(150 150)"><path d="M-24 -10h48v22h-48z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/>${[-14, 0, 14].map(x => `<ellipse cx="${x}" cy="-11" rx="6" ry="3" fill="#e0d0b0" stroke="#7a6a50" stroke-width=".4"/>`).join('')}</g>`;
    const light = glow(u, 121, 75, 70, 50, '#ffb050', .35) + glow(u, 140, 70, 50, 40, '#ffc890', .2) + gloom(u, 140, 70, 0, 120, .4) + gloom(u, 100, 140, 100, 280, .5);
    return [wall + deck, gun + bag + box + swarm + fire + light];
  },

  // Fire on the guns: the enemy's side with two tiers of ports; the upper one smashed, its lid hanging by one hinge,
  // the gun inside overturned and burning; our ball flies in from the right straight into the lower port's muzzle.
  'Огонь по орудиям': u => {
    const back = sky(u, 0, 24, [[0, '#5a1a10'], [1, '#d8683a']]) + K.cloudBand(u, 0, 24, '#f2a070', '#5a1a10', 31, 2.3, '0.02 0.08');
    // the hull leans in towards the top (tumblehome): planks, wales, the thickness of the side at the ports
    const hull = `<path d="M-4 20L204 20L208 140H-8z" fill="#3a2414"/>` + woodTex(u, 0, 20, W, 112, '#7a4e2c', '#3a2212', '#120804', 7, false, 12) + glow(u, 30, 30, 80, 60, '#ffb070', .25)
      + `<path d="M-6 20h212v6h-212z" fill="#c9a048"/><path d="M-6 26h212" stroke="#3a2410" stroke-width="1.2"/><path d="M-8 86h216v7h-216z" fill="#1e140c"/><path d="M-8 86h216" stroke="#c9a048" stroke-width="1.2"/>`
      + nails(Array.from({ length: 24 }, (_, k) => [6 + (k % 12) * 17, 40 + Math.floor(k / 12) * 64]), '#0a0604', .6);
    const pv = (x, y, w, h) => `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="#1a0c06"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0a0402"/>`;
    // the smashed upper port: splintered edges, the lid hanging, the gun overturned inside, flames pouring out
    const up = pv(72, 40, 56, 40) + glow(u, 100, 62, 30, 22, '#ff8a2a', .8)
      + `<g transform="translate(100 66) rotate(180) scale(.9)">${img('deck-cannon', 0, 0, 1.05, 0, u)}</g>` + fireBand(u, 74, 126, 80, 12, 30, 6, 6)
      + `<path d="M72 40l6 4l-4 6l6 5l-7 3M128 40l-5 5l4 6l-6 4l6 6M84 40l3 5l4 -4l4 6l5 -6M106 80l4 -5l4 4" stroke="#e8c090" stroke-width="1" fill="none"/>`
      + `<g filter="url(#drop${u})"><path d="M128 40l14 6l-6 34l-14 -6z" fill="#a8241a" stroke="#4a0a06" stroke-width=".6"/><path d="M131 44l-5 30" stroke="#5a0a06" stroke-width=".5"/></g><circle cx="128" cy="40" r="1.6" fill="url(#iron${u})"/>`
      + smoke(u, 92, 30, .7, 7, -1.3, 4, '#3a2e2a', 30) + splinters(100, 56, 20, 3, '#f0d0a0', 26);
    // the lower port: lid hauled up, the muzzle of a gun in it; our ball streaks in from the right edge at it
    const lo = pv(84, 96, 36, 26) + `<g filter="url(#drop${u})"><path d="M83 95l-3 -6h44l-3 6z" fill="#c8402a" stroke="#4a0a06" stroke-width=".6"/><path d="M80 89h44" stroke="#ff9a6a" stroke-width=".5"/></g><path d="M82 89L70 80M122 89L134 80" stroke="#c8b898" stroke-width=".5"/>`
      + `<circle cx="102" cy="109" r="9" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".6"/><circle cx="102" cy="109" r="4.6" fill="#050505"/><circle cx="99" cy="106" r="1.4" fill="#dfe6ea" opacity=".6"/>`
      + shot(u, 206, 102, 118, 106, 3.2, '#d8c8b8');
    const soot = [100, 60, 100, 110].map((x, k) => `<ellipse cx="${x}" cy="${[36, 0, 60, 94][k]}" rx="${[40, 0, 30, 26][k]}" ry="${[14, 0, 20, 10][k]}" fill="#0a0604" opacity=".35" filter="url(#soft${u})"/>`).join('');
    const water = sea(u, 132, H, '#7a3a28', '#3a1810', '#140604', '#f2b070', '#ff9a4a', 100, 8) + `<path d="M0 132q10 -2 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#fff0d8" stroke-width="1.4" fill="none" opacity=".8"/>`
      + glow(u, 100, 140, 40, 8, '#ff8a2a', .4);
    const light = gloom(u, 100, 60, 100, 0, .3, '#0a0402') + gloom(u, 100, 140, 100, 280, .5, '#0a0202');
    return [back + hull + soot, up + lo + water + light];
  },

  // Fireship: the burning schooner runs before the wind at the Company ship; its column of fire and pitch smoke goes
  // up out of the picture and bends over to the right, over the enemy's masts.
  'Брандер': u => {
    const hz = 108;
    const back = dusk(u, hz, 214, 96, 7);
    const enemy = tint(sailing('endeavour', 160, 92, .72, 0, u), [1, .72, .56], [.08, 0, 0], .85) + glow(u, 150, 90, 30, 30, '#ff9a3a', .25)
      + `<path d="M163 66l9 1l-1 4l-8 -1z" fill="#2a3a6a"/><path d="M164 67l7 1" stroke="#f0e0c0" stroke-width=".8"/>`;
    // the column of fire and pitch smoke from the schooner up to the top edge, bending right with the wind
    const col = smoke(u, 66, 54, 1.7, 9, .8, 17, '#5a3e30', 30) + smoke(u, 80, 24, 1.6, 8, 1.6, 23, '#6a4a3a', 14) + smoke(u, 112, 4, 1.4, 7, 2.2, 29, '#7a5a48', 6)
      + flame(u, 70, 96, 1.5, 3) + flame(u, 58, 92, 1.1, 8) + flame(u, 84, 94, 1.2, 12) + glow(u, 72, 40, 40, 60, '#ff7a2a', .3)
      + sparks(60, 0, 120, 70, 50, 11) + glow(u, 74, 60, 40, 50, '#ff8a2a', .35);
    const ship = `<g transform="translate(75 119) scale(1.32)">${put('fireship', 0, 0, 1, 0, u, false)}</g>`;
    // the torn yard hanging on one rope, tar barrels burning on deck
    const extra = `<path d="M56 62L84 92" stroke="#1a0c06" stroke-width="2.6" stroke-linecap="round"/><path d="M56 62L52 52" stroke="#3a2a1a" stroke-width=".6"/>`
      + [[40, 108], [100, 108]].map(([x, y]) => `<rect x="${x - 4}" y="${y - 7}" width="8" height="8" rx="1.4" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".4"/>` + flame(u, x, y - 7, .35, x)).join('')
      + `<path d="M130 124q-6 -3 -2 -8" stroke="#fff0d8" stroke-width="1.4" fill="none"/>`;
    const light = glow(u, 80, 100, 100, 60, '#ff8a2a', .3) + glow(u, 80, 140, 60, 10, '#ffb050', .3) + gloom(u, 100, 140, 100, 280, .5, '#0a0202');
    return [back + enemy, col + ship + extra + light];
  },

  // Ransom: on the fort's wall walk an open chest of coins, two kegs of powder and the agreement under a stone; the
  // empty shackles and the keys hang on a hook in the merlon; the governor's flag, the masts in the harbour behind.
  'Выкуп за пленников': u => {
    const back = sky(u, 0, 112, [[0, '#3a0e0a'], [.4, '#8a3418'], [.85, '#e8884a'], [1, '#f6c080']]) + glow(u, 200, 70, 70, 50, '#ffd8a0', .55) + K.cloudBand(u, 30, 40, '#f2a070', '#5a1a10', 41, 2.3, '0.02 0.08');
    // masts and yards of a ship in the harbour, rising from behind the wall on the right
    const masts = [[130, 30], [152, 24], [172, 40]].map(([x, t]) => `<path d="M${x} 112V${t}" stroke="#2a1410" stroke-width="2"/>` + [0, 1, 2].map(k => `<path d="M${x - 14 + k * 3} ${t + 8 + k * 20}h${28 - k * 6}" stroke="#2a1410" stroke-width="1.3"/>`).join('')).join('')
      + `<path d="M130 30L152 24L172 40M130 30L110 112M172 40L196 112" stroke="#3a1a14" stroke-width=".4" fill="none"/><path d="M152 24l12 2l-12 3z" fill="#5a1a14"/>`;
    // the flagstaff on the left merlon, the governor's flag: own pattern of a quartered field and a ring
    const fl = `<path d="M61 80V20" stroke="url(#oakH${u})" stroke-width="2.4"/><circle cx="61" cy="19" r="1.8" fill="url(#brassR${u})"/>`
      + `<g filter="url(#drop${u})"><path d="M62 22q12 -3 24 1t24 0v24q-12 3 -24 -1t-24 1z" fill="#e8dcc0"/><path d="M62 34.5q12 -3 24 1t24 0" stroke="#2a4a8a" stroke-width="3.4" fill="none"/><path d="M84 22.4v25" stroke="#2a4a8a" stroke-width="3.4"/><circle cx="84" cy="34" r="4" fill="none" stroke="#c9a048" stroke-width="1.4"/></g>`;
    const stone = (x, y, w, h, seed) => K.stoneTex ? '' : '';
    const st = uid('pst' + u);
    const merlon = (x, w) => `<rect x="${x}" y="80" width="${w}" height="32" fill="url(#${st})" stroke="#3a2a20" stroke-width=".6"/>` + [88, 96, 104].map((y, k) => `<path d="M${x} ${y}h${w}" stroke="#5a4636" stroke-width=".5"/>` + Array.from({ length: Math.ceil(w / 12) }, (_, i) => `<path d="M${x + i * 12 + (k % 2) * 6} ${y}v8" stroke="#5a4636" stroke-width=".5"/>`).join('')).join('') + `<path d="M${x} 80h${w}" stroke="#ffd8a0" stroke-width=".8" opacity=".7"/><path d="M${x + w} 80v32" stroke="#ffc890" stroke-width=".8" opacity=".6"/>`;
    const wall = grad(st, [[0, '#a88a6a'], [1, '#6a5240']], 1, 0) + merlon(-4, 40) + merlon(56, 40) + merlon(116, 40) + merlon(176, 40)
      + `<path d="M0 112h200v14h-200z" fill="#8a7058"/><path d="M0 112h200" stroke="#ffe0b0" stroke-width=".8" opacity=".7"/>` + `<rect y="126" width="200" height="${H - 126}" fill="#5a4636"/>`
      + Array.from({ length: 16 }, (_, k) => `<path d="M0 ${130 + k * 9}h200" stroke="#3a2a20" stroke-width=".6"/>` + Array.from({ length: 10 }, (_, i) => `<path d="M${i * 22 + (k % 2) * 11} ${130 + k * 9}v9" stroke="#3a2a20" stroke-width=".6"/>`).join('')).join('')
      + `<path d="M0 126h200" stroke="#2a1e16" stroke-width="1.4"/>` + [[36, 80], [96, 80], [156, 80]].map(([x, y]) => `<path d="M${x} ${y + 2}l-10 30h10z" fill="#2a1a10" opacity=".35"/>`).join('');
    // the hook in the merlon: empty shackles on a chain and a ring of keys
    const hook = `<path d="M70 88q0 6 4 6q4 0 4 -4" stroke="url(#iron${u})" stroke-width="1.6" fill="none"/><rect x="68" y="85" width="4" height="4" fill="#2a2a2a"/>`
      + `<path d="M74 94q-4 6 -10 8M74 94q2 6 8 10" stroke="#2a2e32" stroke-width="1.2" fill="none"/><ellipse cx="62" cy="104" rx="4" ry="3" fill="none" stroke="url(#iron${u})" stroke-width="1.6"/><ellipse cx="84" cy="106" rx="4" ry="3" fill="none" stroke="url(#iron${u})" stroke-width="1.6"/>`
      + `<circle cx="78" cy="96" r="2.4" fill="none" stroke="url(#brass${u})" stroke-width="1"/>${[[-30, 8], [10, 9], [40, 7]].map(([a, l]) => `<g transform="translate(78 98) rotate(${a})"><path d="M0 0v${l}" stroke="url(#brass${u})" stroke-width="1.1"/><path d="M0 ${l}h2.4v1.6" stroke="url(#brass${u})" stroke-width="1" fill="none"/></g>`).join('')}`;
    // the open chest, coins heaped; the two kegs; the agreement held down by a stone
    const chest = shadow(u, 96, 124, 36, .6, 3) + `<g filter="url(#drop${u})"><path d="M68 96l4 -22h52l4 22z" fill="#4a2a14" stroke="#1a0c06" stroke-width=".6"/><path d="M72 76h52" stroke="#c9a048" stroke-width="1.6"/><path d="M71 90l3 -14h48l3 14z" fill="#2a1408"/>`
      + `<rect x="66" y="96" width="64" height="27" rx="1.6" fill="url(#oak${u})" stroke="#1a0c06" stroke-width=".7"/><path d="M66 103h64M66 116h64" stroke="url(#brass${u})" stroke-width="2"/><rect x="94" y="102" width="8" height="9" rx="1" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/><circle cx="98" cy="106" r="1" fill="#2a1a0a"/></g>`
      + Array.from({ length: 22 }, (_, k) => { const r = R(k + 3); return `<ellipse cx="${f1(70 + r() * 56)}" cy="${f1(93 + r() * 5 - Math.sin(r() * 3) * 4)}" rx="3.2" ry="1.4" fill="url(#brassR${u})" stroke="#6a4a10" stroke-width=".3"/>`; }).join('') + glow(u, 98, 92, 30, 8, '#ffd870', .35)
      + put('coins', 120, 124, .45, 0, u);
    const keg = (x, s) => `<g transform="translate(${x} 124) scale(${s})" filter="url(#drop${u})"><path d="M-10 0q-3 -10 0 -22h20q3 12 0 22z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M-11 -5h22M-11 -17h22" stroke="url(#iron${u})" stroke-width="1.6"/><ellipse cy="-22" rx="10" ry="2.6" fill="#5a3a1c"/><path d="M-2 -13q-2 -3 1 -6q1 3 3 3q0 4 -4 3z" fill="#c8301a"/></g>`;
    const kegs = shadow(u, 156, 125, 22, .55, 3) + keg(148, 1.05) + keg(170, .95);
    const deal = `<g transform="translate(34 120) rotate(-6)" filter="url(#drop${u})"><path d="M-20 -6h40v12h-40z" fill="#efe2c4"/><ellipse cx="-20" cy="0" rx="2.4" ry="6" fill="#d8c8a0"/><ellipse cx="20" cy="0" rx="2.4" ry="6" fill="#d8c8a0"/>${[-3, 0, 3].map(y => `<path d="M-14 ${y}q4 -1 8 0t8 0t8 0" stroke="#6a5a40" stroke-width=".4" fill="none"/>`).join('')}<circle cx="10" cy="3" r="3" fill="#a81a14"/><path d="M8 3h4" stroke="#6a0a06" stroke-width=".5"/></g>`
      + shadow(u, 30, 120, 9, .6, 2) + `<path d="M22 118q2 -8 10 -8q8 0 9 7q-8 3 -19 1z" fill="#8a7a6a" stroke="#3a2e24" stroke-width=".5"/><path d="M25 113q5 -3 10 -1" stroke="#ffe0b0" stroke-width=".6" fill="none" opacity=".7"/>`;
    const light = glow(u, 180, 90, 90, 50, '#ffc890', .25) + gloom(u, 180, 90, 0, 120, .35, '#1a0806') + gloom(u, 100, 130, 100, 280, .5, '#140604');
    return [back + masts + fl + wall, hook + deal + chest + kegs + light];
  },

  // Cruel discipline: the mast, a lantern on its bracket; the cat-o'-nine-tails hangs on a forged nail, the shackles
  // on a sagging chain from a ringbolt in the mast; rough notches cut into the wood; a red haze over the moon.
  'Жестокая дисциплина': u => {
    const back = redNight(u, 150, 13) + glow(u, 146, 62, 30, 24, '#ffb08a', .3) + moon(u, 146, 62, 7, '#ffd8b0', '#ff9a6a', .35) + K.cloudBand(u, 40, 40, '#a04a2a', '#2a0806', 51, 2.2);
    const deck = woodTex(u, 0, 132, W, H - 132, '#4a3020', '#1e120a', '#0a0604', 9, false, 3) + `<path d="M0 132h200" stroke="#0a0604" stroke-width="1.4"/>` + `<path d="M0 124h200v8h-200z" fill="#2a1a10"/><path d="M0 124h200" stroke="#d87a4a" stroke-width=".7" opacity=".6"/>`;
    // the mast: round timber, iron hoops, notches cut irregularly
    const mast = `<rect x="80" y="-4" width="24" height="140" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M86 -4v140" stroke="#e0b080" stroke-width=".6" opacity=".5"/>`
      + [18, 58, 104].map(y => `<rect x="79" y="${y}" width="26" height="5" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".4"/>` + [83, 92, 101].map(x => `<circle cx="${x}" cy="${y + 2.5}" r=".7" fill="#c8d0d8"/>`).join('')).join('')
      + [[84, 70, 6, 20], [86, 76, 5, 15], [83, 82, 7, 25], [88, 90, 4, 10], [84, 94, 6, 30], [90, 98, 5, 18]].map(([x, y, l, a]) => `<path d="M${x} ${y}l${l} ${f1(l * Math.tan(a * Math.PI / 180))}" stroke="#2a1608" stroke-width="1" /><path d="M${x} ${y + .8}l${l} ${f1(l * Math.tan(a * Math.PI / 180))}" stroke="#e8c090" stroke-width=".4"/>`).join('');
    // the bracket on a band with the lantern hanging from its hook
    const lampB = `<path d="M80 30h-22l4 6h18" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".5"/><path d="M60 36q0 4 2 6" stroke="url(#iron${u})" stroke-width="1.2" fill="none"/>` + lantern(62, 56, 1.3);
    // the cat: a turned handle, nine tails with knots, hanging free from a forged nail
    const cat = `<g transform="translate(0 -12) translate(108 75) scale(1.55) translate(-108 -75)"><rect x="102" y="74" width="5" height="3" fill="#2a2a2a"/><circle cx="108" cy="75.5" r="1.6" fill="url(#iron${u})"/>`
      + `<g filter="url(#drop${u})"><path d="M108 76q4 2 4 6" stroke="#5a3a1c" stroke-width="1" fill="none"/><rect x="109" y="80" width="7" height="22" rx="2.4" fill="url(#leather${u})" stroke="#1a0c06" stroke-width=".5"/>${[84, 88, 92, 96].map(y => `<path d="M109 ${y}l7 2" stroke="#2a1608" stroke-width=".6"/>`).join('')}`
      + Array.from({ length: 9 }, (_, k) => { const x0 = 110 + k * .6, x1 = 98 + k * 4 + (k % 2) * 2, y1 = 132 - (k % 3) * 3; return `<path d="M${f1(x0)} 102Q${f1((x0 + x1) / 2 + 2)} 116 ${x1} ${f1(y1 - 6)}" stroke="#3a2010" stroke-width="1.1" fill="none"/>` + [.45, .75].map(t => `<circle cx="${f1(x0 + (x1 - x0) * t + 1)}" cy="${f1(102 + (y1 - 102) * t)}" r="1.1" fill="#3a2010"/>`).join('') + `<circle cx="${x1}" cy="${f1(y1 - 6)}" r="1.2" fill="#2a1608"/>`; }).join('') + `</g></g>`;
    // the ringbolt in the mast, the shackles on their sagging chain (to the left, clear of the cat)
    const irons = `<g transform="translate(78 96) scale(1.5) translate(-78 -96)"><circle cx="78" cy="96" r="2.6" fill="none" stroke="url(#iron${u})" stroke-width="1.4"/><rect x="78" y="95" width="3" height="2" fill="#2a2a2a"/>`
      + Array.from({ length: 7 }, (_, k) => { const t = k / 6, x = 76 - t * 30, y = 98 + Math.sin(t * Math.PI) * 10 + t * 8; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="2" ry="1.3" fill="none" stroke="url(#iron${u})" stroke-width="1" transform="rotate(${f1(-20 + t * 40)} ${f1(x)} ${f1(y)})"/>`; }).join('')
      + `<g filter="url(#drop${u})"><path d="M44 106q-6 0 -6 6t6 6h4q6 0 6 -6t-6 -6z" fill="none" stroke="url(#iron${u})" stroke-width="2"/><path d="M34 112q-6 4 -2 10q4 4 10 0" fill="none" stroke="url(#iron${u})" stroke-width="2"/></g></g>`;
    const rope0 = coil(92, 138, 22, 5);
    const light = glow(u, 62, 58, 70, 60, '#ffb050', .45) + glow(u, 92, 140, 50, 12, '#ffb050', .25) + gloom(u, 62, 60, 200, 120, .4) + gloom(u, 100, 140, 100, 280, .55);
    return [back + deck, mast + lampB + irons + cat + rope0 + light];
  },

  // Zombies at the guns: along the gun deck a dead gunner puts his smouldering linstock to the touchhole, the gun
  // fires through the port; deeper in the half dark a second one sponges out the next gun.
  'Зомби у пушек': u => {
    const view = dusk(u, 82, 214, 70, 9) + tint(sailing('endeavour', 168, 74, .5, 0, u), [1, .72, .56], [.06, 0, 0], .85);
    const wall = gunWall(u, 0, 140, [140, 62, 46, 44], view, 11) + beam(u, 0, 0, W, 12) + beam(u, 0, 34, W, 6)
      + `<g filter="url(#drop${u})"><path d="M140 62l14 -16l3 2l-12 16z" fill="#8a1a10" stroke="#3a0806" stroke-width=".6"/></g>` + `<rect x="18" y="66" width="22" height="20" fill="#0a0402" stroke="#1a0c06" stroke-width="2"/>`;
    const deck = woodTex(u, 0, 128, W, H - 128, '#4a3020', '#22140a', '#0a0604', 9, false, 8) + `<path d="M0 128h200" stroke="#0a0604" stroke-width="1.6"/>`;
    // the second dead man deeper in, smaller, sponging out the neighbouring gun, in the half dark with a rim light
    const back2 = lit(img('deck-cannon', 34, 104, .9, 0, u), [[.5, .4, .36], [0, 0, 0], .6])
      + `<g opacity=".8">${deadman(u, 22, 124, 62, { coat: '#3a2a22', trim: '#8a6a3a', skin: '#5a6a4a', armL: [100, 120], armR: [70, 100], hat: 'cap', pants: '#3a3020' })}</g>`
      + `<path d="M40 80L66 92" stroke="url(#oakH${u})" stroke-width="1.6"/><ellipse cx="66.4" cy="92.4" rx="3" ry="2" fill="#3a2a1a" transform="rotate(25 66.4 92.4)"/>`;
    // the dead gunner: head to knees in the picture, a torn coat, his arm out with the linstock to the touchhole
    const linstock = `<path d="M0 0L-26 10" stroke="url(#oakH${u})" stroke-width="1.8"/><path d="M-26 10q-4 2 -6 6" stroke="#3a2a1a" stroke-width="1.2" fill="none"/>` + `<circle cx="-32" cy="16" r="1.2" fill="#ffb040"/>`;
    const gunner = deadman(u, 58, 172, 122, { coat: '#3a2a26', trim: '#a87a3a', skin: '#748a5c', armL: [-10, -6], armR: [62, 104], itemR: linstock, pants: '#4a3a2a' });
    const gun = shadow(u, 126, 130, 54, .6, 4) + img('deck-cannon', 126, 98, 1.6, 0, u) + `<path d="M96 88l2 -4" stroke="#ffd27a" stroke-width=".8"/>` + glow(u, 97, 86, 6, 6, '#ffb040', .9) + sparks(92, 78, 10, 8, 8, 4);
    const fire = muzzle(u, 176, 83, 0, 1.2) + smoke(u, 186, 72, .45, 5, 1, 7, '#c8b8a8', 20);
    const balls = img('deck-balls', 168, 136, 1, 0, u) + `<path d="M108 118l10 6l8 -4M112 118l6 8" stroke="#d8d0c8" stroke-width=".3" opacity=".6" fill="none"/>`;
    const light = glow(u, 176, 84, 60, 40, '#ffb050', .4) + glow(u, 140, 90, 70, 40, '#ffc890', .18) + gloom(u, 160, 80, 0, 100, .45) + gloom(u, 100, 140, 100, 280, .5);
    return [wall + deck + back2, gunner + gun + balls + fire + light];
  },

  // The voodoo doll: a burlap doll with button eyes and rope for hair sits on the cabin table leaning on a big
  // bottle, long pins in it, one with a red head in its chest; the near candle throws its big shadow on the wall.
  'Кукла вуду': u => {
    const wall = woodTex(u, 0, 0, W, 112, '#3a2016', '#1a0e08', '#0a0604', 12, true, 21) + beam(u, 0, 14, W, 9);
    const hang = (x, len, body) => `<path d="M${x} 23V${23 + len}" stroke="#8a7a5a" stroke-width=".5"/><g transform="translate(${x} ${23 + len})" filter="url(#drop${u})">${body}</g>`;
    const vial = (w, h, col) => `<path d="M-1.4 0h2.8v3q${w / 2} 2 ${w / 2} ${h * .4}v${h * .5}q0 ${h * .1} -${w / 2} ${h * .1}h-${w - 2.8}q-${w / 2} 0 -${w / 2} -${h * .1}v-${h * .5}q0 -${h * .4} ${w / 2} -${h * .4}z" fill="url(#glass${u})" stroke="#2a3a34" stroke-width=".4"/><path d="M-${w / 2 - 1} ${h * .55}h${w - 2}v${h * .4}h-${w - 2}z" fill="${col}" opacity=".7"/>`;
    const things = hang(58, 16, vial(10, 16, '#8a2a1a')) + hang(84, 28, vial(7, 20, '#3a6a3a')) + hang(118, 12, vial(12, 12, '#5a3a7a')) + hang(142, 22, vial(8, 14, '#c89a3a'))
      + hang(100, 20, `<path d="M0 0v6M-3 6l3 14l3 -14" stroke="#3a2a1a" stroke-width=".6" fill="#e8e0d0"/>`) + hang(70, 34, `<path d="M-4 0h8M-5 -1v2M5 -1v2" stroke="#e8dcc0" stroke-width="1.4"/>`)
      + hang(130, 30, `<path d="M0 0q-4 10 0 22q4 -10 0 -22z" fill="#2a2a30"/><path d="M0 2v20" stroke="#8a8a90" stroke-width=".3"/>`);
    const table = tableTop(u, 112, H - 112, '#5a3820', '#2a160a', 23);
    // the doll in parts, used twice: as the shadow on the wall and itself
    const dollShape = (fill, stroke) => `<path d="M-14 46q-4 -20 0 -32q14 -6 28 0q4 12 0 32q-14 4 -28 0z" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`
      + `<path d="M-14 18q-10 4 -16 14q2 4 6 2q6 -8 12 -8zM14 18q10 4 16 14q-2 4 -6 2q-6 -8 -12 -8z" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`
      + `<ellipse cx="-8" cy="52" rx="7" ry="5" fill="${fill}" stroke="${stroke}" stroke-width=".6"/><ellipse cx="9" cy="53" rx="7" ry="5" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`
      + `<circle cx="0" cy="0" r="13" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`;
    const bg = uid('pvb' + u);
    const burlap = `<pattern id="${bg}" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="#a8885a"/><path d="M0 1h2M1 0v2" stroke="#7a5e38" stroke-width=".5"/></pattern>`;
    const shadowDoll = glow(u, 120, 50, 90, 60, '#ffb050', .3) + `<g transform="translate(140 28) scale(1.7) rotate(8)" opacity=".75" filter="url(#soft${u})">${dollShape('#0a0402', 'none')}<path d="M0 -12l-6 -10M4 -12l4 -12M-2 -12l1 -12" stroke="#0a0402" stroke-width="1.6"/><path d="M10 20l22 -14M-6 30l-20 -10" stroke="#0a0402" stroke-width=".8"/></g>`;
    const bottle0 = shadow(u, 118, 120, 24, .5) + `<g filter="url(#drop${u})"><path d="M100 120q-8 -34 10 -44v-16h12v16q18 10 10 44z" fill="#2a3a2a" stroke="#0a120a" stroke-width=".6"/><path d="M104 112q-2 -20 6 -26" stroke="#c8e0c0" stroke-width="1.4" fill="none" opacity=".4"/><rect x="109" y="54" width="14" height="6" fill="#6a1a14"/></g>`;
    const doll = `<g transform="translate(94 62) rotate(-6) scale(1.15)" filter="url(#drop${u})">${burlap}${dollShape(`url(#${bg})`, '#3a2a14')}`
      + `<path d="M-14 26q14 4 28 0v8q-14 4 -28 0z" fill="#2a3a6a" stroke="#141e3a" stroke-width=".5"/><path d="M-14 28q14 4 28 0" stroke="#5a6aa8" stroke-width=".5" fill="none"/>`
      + [[-13, 16, -13, 44], [13, 16, 13, 44], [-11, 0, 11, 0]].map(([a, b, c, d]) => Array.from({ length: 6 }, (_, k) => { const t = k / 5, x = a + (c - a) * t, y = b + (d - b) * t; return `<path d="M${f1(x - 1.2)} ${f1(y - 1.2)}l2.4 2.4M${f1(x + 1.2)} ${f1(y - 1.2)}l-2.4 2.4" stroke="#2a1a0a" stroke-width=".5"/>`; }).join('')).join('')
      + `<circle cx="-5" cy="-2" r="3.2" fill="#1a1a1a" stroke="#6a6a6a" stroke-width=".5"/><circle cx="5.4" cy="-1" r="2.6" fill="#3a2a1a" stroke="#8a6a4a" stroke-width=".5"/>${[[-6, -3], [-4, -1], [4.6, -1.6], [6.2, -.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".4" fill="#c8c0b0"/>`).join('')}`
      + `<path d="M-6 7q6 3 12 0" stroke="#2a1a0a" stroke-width=".7" fill="none"/>${[-4, -1, 2, 5].map(x => `<path d="M${x} 6v3" stroke="#2a1a0a" stroke-width=".5"/>`).join('')}`
      + Array.from({ length: 12 }, (_, k) => { const a = -2.8 + k * .22; return `<path d="M${f1(Math.cos(a) * 12)} ${f1(Math.sin(a) * 12)}q${f1(Math.cos(a) * 6 + (k % 2 ? 2 : -2))} ${f1(Math.sin(a) * 4)} ${f1(Math.cos(a) * 10)} ${f1(Math.sin(a) * 10 + 6)}" stroke="#c8a870" stroke-width=".9" fill="none"/>`; }).join('')
      + `</g>`;
    // the pins: long, steel, with coloured heads; the red one in the chest
    const pin = (x, y, a, l, col, r) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0v${-l}" stroke="url(#silver${u})" stroke-width=".8"/><circle cy="${-l}" r="${r}" fill="${col}" stroke="#1a0a0a" stroke-width=".3"/><circle cx="${-r * .3}" cy="${-l - r * .3}" r="${r * .3}" fill="#fff" opacity=".7"/></g>`;
    const pins = pin(98, 90, 32, 26, '#d81a14', 3.2) + pin(86, 66, -40, 22, '#e8e0c8', 1.8) + pin(108, 82, 60, 20, '#2a2a2a', 1.8) + pin(90, 104, -70, 18, '#c9a048', 1.8);
    const near = put('candleTall', 38, 112, 1.2, 0, u) + put('candleTall', 168, 104, .8, 0, u);
    const altar = `<path d="M20 124q10 -4 26 0" stroke="#efe6d0" stroke-width="2" fill="none"/><path d="M34 126q2 6 0 10M44 124q1 4 0 8" stroke="#efe6d0" stroke-width="1.6" fill="none"/>`
      + Array.from({ length: 20 }, (_, k) => { const r = R(k + 9); return `<circle cx="${f1(130 + r() * 30)}" cy="${f1(122 + r() * 6)}" r=".5" fill="#f4f0e8"/>`; }).join('')
      + `<g transform="translate(60 126) rotate(-20)">${[0, 1, 2, 3].map(k => `<path d="M0 0q${-4 + k * 3} -10 ${-2 + k * 2} -16" stroke="#6a7a3a" stroke-width="1" fill="none"/>`).join('')}<path d="M-2 0h6" stroke="#8a6a3a" stroke-width="1.4"/></g>`;
    const light = glow(u, 38, 90, 80, 60, '#ffb050', .45) + glow(u, 168, 92, 30, 24, '#ffb050', .2) + gloom(u, 40, 90, 200, 20, .45) + gloom(u, 100, 140, 100, 280, .55);
    return [wall + shadowDoll + table, things + bottle0 + doll + pins + near + altar + light];
  },

  // Boarding: grapnels bite into the enemy's high rail, the lines taut from ours; men swing across on ropes from our
  // yard against the sunset; sabres stand driven into our deck in front of the rail.
  'На абордаж!': u => {
    const back = sky(u, 0, 140, [[0, '#3a0e0a'], [.4, '#8a3418'], [.8, '#e8884a'], [1, '#f6c080']]) + glow(u, 60, 100, 70, 40, '#ffd8a0', .5) + K.cloudBand(u, 10, 50, '#f2a070', '#5a1a10', 57, 2.3, '0.02 0.08');
    // the enemy's side close on the right: her rail, the planking, a row of ports, shrouds above
    const enemy = `<path d="M100 62L204 58V200H96z" fill="#3a2a1e"/>` + `<g clip-path="url(#pab${u})">${woodTex(u, 96, 58, 110, 140, '#4a3424', '#22160c', '#0a0604', 7, false, 5)}</g><clipPath id="pab${u}"><path d="M100 62L204 58V200H96z"/></clipPath>`
      + `<path d="M98 62L204 57" stroke="#c9a048" stroke-width="2"/><path d="M98 66L204 61" stroke="#1a0e06" stroke-width="1.6"/>` + [126, 162].map(x => `<rect x="${x}" y="78" width="16" height="13" fill="#140a06" stroke="#c9a048" stroke-width=".6"/>`).join('')
      + `<path d="M110 60L140 0M130 59L160 0M150 58L176 0" stroke="#2a1a10" stroke-width=".7"/>`;
    // our yard is above the picture: the swing ropes come down from the upper left to the men's hands
    const man = (x, y, s, legs, arm) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0L0 -20" stroke="#120806" stroke-width="2.4"/><circle cx="0" cy="-2" r="1.6" fill="#120806"/><path d="M-1 0q-2 8 0 16l2 2" stroke="#120806" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="1" cy="-3" r="2.6" fill="#120806" transform="translate(${arm} 3)"/>`
      + `<path d="M-3 5q4 -2 6 0l1 12q-4 2 -8 0z" fill="#120806"/><path d="M-2 17l${legs[0]} ${legs[1]}M2 17l${legs[2]} ${legs[3]}" stroke="#120806" stroke-width="3" stroke-linecap="round"/><path d="M3 8l9 -4" stroke="#120806" stroke-width="2.2" stroke-linecap="round"/><path d="M12 4l8 -6" stroke="#d8c8b0" stroke-width=".9"/></g>`;
    const swing = `<path d="M30 -4L74 34M66 -4L118 22M10 -4L54 60" stroke="#2a1a10" stroke-width="1" fill="none"/>` + man(74, 36, 1.1, [6, 8, 9, 3], -4) + man(118, 24, .8, [7, 5, 3, 9], -2) + man(54, 62, .7, [5, 8, 8, 4], -3)
      + [[74, 36], [118, 24], [54, 62]].map(([x, y]) => `<path d="M${x - 6} ${y + 10}q-2 4 -6 4" stroke="#ffb070" stroke-width=".5" fill="none" opacity=".6"/>`).join('');
    // our rail on the lower left, the grapnel lines taut from it up to the enemy's rail, the hooks biting in
    const rail = `<path d="M-4 112h120v8h-120z" fill="#5a3a20"/><path d="M-4 112h120" stroke="#ffc890" stroke-width="1"/>` + woodTex(u, 0, 120, 116, 16, '#4a2e1a', '#22140a', '#0a0604', 4, false, 8) + `<path d="M116 112v24" stroke="#1a0e06" stroke-width="2"/>`;
    const hook = (x, y) => `<g transform="translate(${x} ${y})" filter="url(#drop${u})"><path d="M0 0v8M0 8q-6 0 -6 -6M0 8q6 0 6 -6M0 8q0 5 -4 6" stroke="url(#iron${u})" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
    const lines = [[34, 112, 120, 66], [62, 112, 140, 66], [92, 112, 164, 64]].map(([a, b, c, d]) => rope(`M${a} ${b}L${c} ${d}`, 1) + hook(c, d - 8)).join('') + splinters(140, 62, 12, 3, '#f0d0a0', 8) + splinters(120, 64, 8, 5, '#f0d0a0', 6);
    const deck = woodTex(u, 0, 136, W, H - 136, '#5a3a22', '#2a180a', '#0a0604', 9, false, 3) + `<path d="M0 136h200" stroke="#0a0604" stroke-width="1.4"/>`;
    // the sabres driven into the deck in front of the rail at different angles, rim lit by the sunset
    const sabre = (x, y, a, l) => `<g transform="translate(${x} ${y}) rotate(${a})" filter="url(#drop${u})"><path d="M0 0q2 ${-l * .5} -1 ${-l}" stroke="url(#silver${u})" stroke-width="3.2" fill="none"/><path d="M1 -2q2 ${-l * .5} -1 ${-l + 2}" stroke="#ffe0b0" stroke-width=".6" fill="none"/>`
      + `<path d="M-6 ${-l}h11" stroke="url(#brass${u})" stroke-width="2.4" stroke-linecap="round"/><path d="M-5 ${-l}q-3 -8 4 -12" stroke="url(#brass${u})" stroke-width="1.2" fill="none"/><rect x="-2.6" y="${-l - 13}" width="4.4" height="13" rx="1.4" fill="#3a1e0e"/><circle cx="-.4" cy="${-l - 14}" r="2.2" fill="url(#brassR${u})"/></g>`;
    const blades = sabre(40, 130, -12, 34) + sabre(84, 131, 8, 36) + sabre(150, 130, 18, 30) + `<path d="M36 130q4 -2 8 0M80 131q4 -2 8 0M146 130q4 -2 8 0" stroke="#1a0e06" stroke-width="1.4" fill="none"/>` + splinters(100, 150, 14, 9, '#d8b080', 30);
    const light = glow(u, 60, 100, 90, 50, '#ffb070', .2) + gloom(u, 60, 100, 200, 140, .4, '#1a0806') + gloom(u, 100, 140, 100, 280, .5, '#140604');
    return [back + enemy, swing + rail + lines + deck + blades + light];
  },

  // The captive mermaid: she sits on a ledge of the sea rock and sings towards the ship on the horizon, a rope from
  // her wrist to an iron ring in the rock; her copper tail hangs down to the water; a path of shimmer runs to the ship.
  'Пленная русалка': u => {
    const hz = 84;
    const back = redNight(u, hz, 31, 66, 50) + K.cloudBand(u, 10, 40, '#8a3a2a', '#1a0606', 61, 2.2);
    const ship = tint(sailing('endeavour', 156, 74, .6, 0, u), [.5, .34, .3], [.04, 0, 0], .4) + `<circle cx="168" cy="80" r="1" fill="#ffe0a0"/>` + glow(u, 168, 80, 6, 6, '#ffb050', .8);
    const path = Array.from({ length: 22 }, (_, k) => { const r = R(k + 77), t = k / 21, x = 100 + t * 64 + (r() - .5) * 8, y = 124 - t * 34 + (r() - .5) * 2, w = 6 - t * 4 + r() * 3; return `<path d="M${f1(x - w / 2)} ${f1(y)}h${f1(w)}" stroke="#ffd8c0" stroke-width="${f2(.4 + (1 - t) * .6)}" stroke-linecap="round" opacity="${f2(.4 + r() * .5)}"/>`; }).join('');
    // the rock: a tall crag on the left, rim lit by the moon behind it; the ledge she sits on; the iron ring
    const rg = uid('prk' + u);
    const rock = grad(rg, [[0, '#2a1a1a'], [1, '#0a0606']], 1, 0) + `<path d="M8 280V100q2 -30 14 -46q10 -10 20 -6q8 -12 18 -4q10 8 12 24q4 12 0 18l-4 2h30q8 2 10 10l-2 24q-6 8 -4 20V280z" fill="url(#${rg})" stroke="#0a0404" stroke-width=".6"/>`
      + `<path d="M22 54q10 -10 20 -6q8 -12 18 -4q10 8 12 24" stroke="#ffc8a8" stroke-width="1" fill="none" opacity=".7"/><path d="M72 88h30q8 2 10 10" stroke="#ffb090" stroke-width=".8" fill="none" opacity=".6"/>`
      + [[30, 110], [50, 140], [80, 120], [24, 170], [60, 190]].map(([x, y]) => `<path d="M${x} ${y}q8 -4 16 0" stroke="#3a2424" stroke-width=".8" fill="none"/>`).join('')
      + `<circle cx="46" cy="96" r="3.4" fill="none" stroke="url(#iron${u})" stroke-width="1.6"/><rect x="44" y="99" width="4" height="3" fill="#1a1a1a"/>`;
    // her tail down the rock face to the water: copper scales with moonlit edges, the fin in the foam
    const tg = uid('ptl' + u);
    const tail = `<linearGradient id="${tg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8a060"/><stop offset=".5" stop-color="#a85a28"/><stop offset="1" stop-color="#5a2a10"/></linearGradient>`
      + `<path d="M74 86q14 4 18 14q4 12 0 20q-2 2 -6 0q2 -10 -2 -18q-4 -6 -14 -10z" fill="url(#${tg})" stroke="#3a1a08" stroke-width=".5"/>`
      + Array.from({ length: 14 }, (_, k) => { const t = k / 13, x = 78 + t * 10 + Math.sin(t * 3) * 3, y = 90 + t * 26; return `<path d="M${f1(x - 2)} ${f1(y)}q2 1.6 4 0" stroke="#ffd8a0" stroke-width=".5" fill="none" opacity=".7"/>`; }).join('')
      + `<path d="M86 118q-10 4 -12 10q8 -2 12 -4q4 4 12 4q-4 -6 -12 -10z" fill="url(#${tg})" stroke="#3a1a08" stroke-width=".5"/>` + spray(70, 120, 34, 8, 14, 5) + `<path d="M66 125q16 -4 34 0" stroke="#fff0e0" stroke-width="1" fill="none" opacity=".7"/>`;
    // her: dark skin, ash-pale hair with shells and weed falling down her back, singing towards the ship
    const sk = uid('pms' + u);
    const maid = `<radialGradient id="${sk}" cx=".6" cy=".3" r=".8"><stop offset="0" stop-color="#b8805a"/><stop offset=".7" stop-color="#7a4a2a"/><stop offset="1" stop-color="#4a2a14"/></radialGradient>`
      + `<path d="M76 62q-14 6 -16 26q4 2 6 -2q2 -14 12 -20z" fill="#d8d0c0" stroke="#7a7060" stroke-width=".4"/>`
      + `<path d="M70 88q-2 -12 2 -20q2 -6 8 -6q6 1 7 6q2 10 0 20z" fill="url(#${sk})" stroke="#2a1408" stroke-width=".5"/>`
      + `<path d="M84 70q8 2 12 -2" stroke="#7a4a2a" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M72 72q-6 8 -16 14" stroke="#6a3a20" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + `<path d="M56 86L48 98" stroke="#c8b898" stroke-width=".8"/><path d="M55 86q2 -1 3 1" stroke="#c8b898" stroke-width="1.4" fill="none"/>`
      + `<path d="M78 62q-2 -10 6 -12q7 0 7 7q0 6 -4 8q-4 1 -9 -3z" fill="url(#${sk})" stroke="#2a1408" stroke-width=".5"/><ellipse cx="89" cy="60" rx="1" ry="1.3" fill="#2a0e08"/><path d="M86 55.6l2 .4" stroke="#1a0a04" stroke-width=".6"/>`
      + `<path d="M84 49q-10 -2 -12 8q-4 10 -10 20q-4 8 -2 14q6 -10 10 -18q4 -8 6 -14q2 -6 8 -10z" fill="#e8e2d0" stroke="#8a8270" stroke-width=".4"/><path d="M80 52q-6 10 -14 30" stroke="#a8a090" stroke-width=".4" fill="none"/>`
      + `<path d="M80 52l2 2l-1 2l-2 -1z" fill="#fff8f0"/><path d="M70 70q-2 6 0 10" stroke="#3a7a4a" stroke-width="1" fill="none"/><path d="M75 58l2.4 -1.6l1 2.6z" fill="#f4e8e0"/>`
      + `<path d="M84 49q6 -1 7 4" stroke="#ffd8b0" stroke-width=".6" fill="none" opacity=".8"/>`;
    const surf = `<path d="M0 132q20 -6 40 -2t60 -2t100 2" stroke="#fff0e0" stroke-width="1.2" fill="none" opacity=".5"/>` + spray(100, 126, 20, 6, 10, 9);
    const light = glow(u, 66, 50, 50, 40, '#ffc8a0', .25) + gloom(u, 100, 140, 100, 280, .55, '#0a0202');
    return [back + ship + path, rock + tail + maid + surf + light];
  },

  // The terror of the Caribbean: his own face lit from below, smouldering fuses under the hat and in the braids of
  // his black beard, the smoke drifting up to the right; pistols in a bandolier; the sea burns behind him.
  'Ужас Карибского моря': u => {
    const hz = 112;
    const back = sky(u, 0, hz + 1, [[0, '#0a0204'], [.6, '#3a0e0a'], [1, '#a03a1a']]) + glow(u, 100, hz, 120, 30, '#ff7a2a', .5)
      + sea(u, hz, H, '#7a2a14', '#2a0a06', '#0a0202', '#ff9a4a', '#ffc070', 100, 13) + fireBand(u, 0, 60, hz + 2, 6, 14, 3, 6) + fireBand(u, 140, 200, hz + 2, 6, 16, 9, 6);
    const coat = `<path d="M30 280L36 140q20 -16 64 -18q44 2 64 18l6 140z" fill="#1a1416" stroke="#050304" stroke-width=".6"/><path d="M36 140q20 -16 64 -18" stroke="#ff9a5a" stroke-width=".8" fill="none" opacity=".5"/>`
      + `<path d="M60 128q-6 50 0 152M140 128q6 50 0 152" stroke="#0a0608" stroke-width="1.2" fill="none"/>`;
    // the face: broad cheekbones, deep shadows, a scowl, a broken nose, a scar through the brow, lit from below
    const fg = uid('pfc' + u);
    const face = `<linearGradient id="${fg}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8945a"/><stop offset=".45" stop-color="#9a5a34"/><stop offset="1" stop-color="#3a1e10"/></linearGradient>`
      + `<path d="M74 58q-2 22 4 36q8 14 22 16q14 -2 22 -16q6 -14 4 -36q-10 -8 -26 -8t-26 8z" fill="url(#${fg})" stroke="#1a0a04" stroke-width=".7"/>`
      + `<path d="M72 70q-5 0 -5 6t5 8M128 70q5 0 5 6t-5 8" fill="url(#${fg})" stroke="#1a0a04" stroke-width=".6"/><circle cx="131" cy="86" r="2.6" fill="none" stroke="url(#brass${u})" stroke-width="1.2"/>`
      + `<path d="M80 68q8 -5 16 0M104 68q8 -5 16 0" stroke="#140804" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      + `<path d="M82 72q5 -2 10 0q-5 3 -10 0zM108 72q5 -2 10 0q-5 3 -10 0z" fill="#f0d8b8"/><circle cx="87" cy="72" r="1.5" fill="#1a0a04"/><circle cx="113" cy="72" r="1.5" fill="#1a0a04"/><circle cx="87.4" cy="72.6" r=".4" fill="#ffd8a0"/><circle cx="113.4" cy="72.6" r=".4" fill="#ffd8a0"/>`
      + `<path d="M106 60l8 18" stroke="#c87a5a" stroke-width="1" opacity=".8"/><path d="M100 70q-2 6 1 9q-3 4 -1 8" stroke="#3a1a0a" stroke-width=".8" fill="none"/><path d="M95 89q5 3 10 0" stroke="#3a1a0a" stroke-width="1" fill="none"/><path d="M96 88q4 -2 8 0" stroke="#ffc890" stroke-width=".6" fill="none" opacity=".8"/>`
      + `<path d="M78 82q3 6 2 12M122 82q-3 6 -2 12" stroke="#2a1006" stroke-width=".7" fill="none" opacity=".7"/>`;
    // the beard: black, down to the chest, in thick braids tied with red ribbons, fuses glowing at the ends
    const braid = (x, l, a, k) => `<g transform="translate(${x} 100) rotate(${a})"><path d="M-3 0q-1 ${l / 2} 0 ${l}h6q1 ${-l / 2} 0 ${-l}z" fill="#141010" stroke="#050404" stroke-width=".4"/>`
      + Array.from({ length: Math.floor(l / 4) }, (_, i) => `<path d="M-3 ${i * 4 + 2}q3 2 6 0" stroke="#3a3436" stroke-width=".6" fill="none"/>`).join('') + `<rect x="-3.4" y="${l - 2}" width="6.8" height="3" fill="#c81a14"/><path d="M0 ${l + 1}q-1 4 1 6" stroke="#3a2a1a" stroke-width="1" fill="none"/></g>`;
    const beard = `<path d="M78 92q22 12 44 0q2 10 -4 16q-18 8 -36 0q-6 -6 -4 -16z" fill="#141010"/><path d="M84 88q16 -6 32 0q-6 4 -16 4t-16 -4z" fill="#1a1414"/>`
      + [[84, 26, 10], [92, 30, 4], [100, 32, 0], [108, 30, -4], [116, 26, -10], [96, 22, 2]].map(([x, l, a], k) => braid(x, l, a, k)).join('')
      + [[89, 134], [94, 138], [100, 140], [106, 138], [111, 134]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#ffd27a"/>` + glow(u, x, y, 4, 4, '#ff9a3a', .8)).join('');
    const smokes = [[89, 134], [100, 140], [111, 134], [80, 52], [122, 52]].map(([x, y], k) => `<path d="M${x} ${y}q4 -10 0 -18q-4 -8 4 -16q6 -8 4 -18" stroke="#bfb0a8" stroke-width="1.2" fill="none" opacity=".35" transform="translate(0 0) rotate(${18} ${x} ${y})"/>`).join('');
    // the tricorn: a simple skull pattern on the front, fuses smouldering under the brim
    const hat = `<g filter="url(#drop${u})"><path d="M52 56q48 -26 96 0q-10 -26 -48 -30q-38 4 -48 30z" fill="#16110e" stroke="#050403" stroke-width=".6"/><path d="M52 56q48 -20 96 0" stroke="#5a4030" stroke-width="1.6" fill="none"/>`
      + `<g transform="translate(100 40) scale(.7)"><path d="M-6 0q0 -8 6 -8t6 8q0 3 -2 4v2h-8v-2q-2 -1 -2 -4z" fill="#e8dcc4"/><circle cx="-2.4" cy="-1" r="1.6" fill="#16110e"/><circle cx="2.4" cy="-1" r="1.6" fill="#16110e"/><path d="M-9 8l18 -4M-9 4l18 4" stroke="#e8dcc4" stroke-width="1.6"/></g></g>`
      + [[70, 54], [80, 56], [120, 56], [130, 54]].map(([x, y]) => `<path d="M${x} ${y}q-1 4 1 7" stroke="#3a2a1a" stroke-width="1" fill="none"/><circle cx="${x + 1}" cy="${y + 7}" r=".9" fill="#ffd27a"/>` + glow(u, x + 1, y + 7, 4, 4, '#ff9a3a', .7)).join('');
    // the bandolier with pistol grips across his chest
    const band = `<path d="M50 120L150 150l-4 10L46 130z" fill="#4a2a14" stroke="#1a0a04" stroke-width=".6"/><path d="M50 122L150 152" stroke="#8a5a30" stroke-width=".5"/>`
      + [[62, 116], [84, 122], [118, 132], [138, 138]].map(([x, y], k) => `<g transform="translate(${x} ${y}) rotate(${-50 + k * 6})"><path d="M0 0q-2 -8 2 -14q3 -2 5 0q0 6 -2 14z" fill="url(#leather${u})" stroke="#1a0a04" stroke-width=".5"/><ellipse cx="3.6" cy="-14" rx="2.4" ry="1.6" fill="url(#brass${u})"/></g>`).join('');
    const light = glow(u, 100, 120, 70, 40, '#ff8a3a', .35) + gloom(u, 100, 20, 100, 0, .4) + gloom(u, 100, 150, 100, 280, .5, '#0a0202');
    return [back, coat + band + beard + face + smokes + hat + light];
  },

  // Living rigging: a broadsword driven into the deck, its green stone glowing; a glowing trail runs over the planks to
  // the pin rail, where the ropes rise by themselves like snakes, wind round the pins and haul the sail up.
  'Живые снасти': u => {
    const back = sky(u, 0, 120, [[0, '#3a0e0a'], [.45, '#8a3418'], [.85, '#e8884a'], [1, '#f6c080']]) + glow(u, 40, 100, 70, 40, '#ffd8a0', .5) + K.cloudBand(u, 50, 40, '#f2a070', '#5a1a10', 67, 2.3, '0.02 0.08');
    // the sail on its yard being hauled up, folds gathering; blocks and taut lines straight down
    const sail = `<path d="M30 24Q100 18 170 24" stroke="#2a1608" stroke-width="3" fill="none"/><path d="M34 26Q100 20 166 26L160 54Q100 66 40 54z" fill="#e8d8b8" stroke="#6a5a40" stroke-width=".6"/>`
      + [50, 70, 90, 110, 130, 150].map(x => `<path d="M${x} 24q${x < 100 ? -3 : 3} 14 0 ${32 + Math.abs(100 - x) * -.08}" stroke="#a8987a" stroke-width="1" fill="none"/>`).join('') + `<path d="M40 54Q100 66 160 54" stroke="#ffd8b0" stroke-width=".8" fill="none"/>`
      + [[60, 20], [140, 20]].map(([x, y]) => `<g filter="url(#drop${u})"><rect x="${x - 3}" y="${y - 2}" width="6" height="9" rx="2.4" fill="url(#oak${u})" stroke="#140a04" stroke-width=".4"/><circle cx="${x}" cy="${y + 2.6}" r="1.4" fill="url(#iron${u})"/></g>`).join('');
    const bulwark = `<path d="M110 84h96v40h-96z" fill="#3a2414"/>` + woodTex(u, 110, 84, 96, 40, '#5a3a20', '#2a180a', '#0a0604', 5, false, 9) + `<path d="M110 84h96" stroke="#ffc890" stroke-width="1"/>`;
    const deck = woodTex(u, 0, 124, W, H - 124, '#6a4424', '#2a160a', '#0a0604', 9, false, 3) + `<path d="M0 124h200" stroke="#0a0604" stroke-width="1.4"/>`;
    // the pin rail with its belaying pins; the ropes rising off them in coils, wound round the pins in figure eights
    const rail = `<rect x="120" y="104" width="66" height="5" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/>` + [128, 142, 156, 170, 182].map(x => `<rect x="${x - 1.4}" y="96" width="2.8" height="18" rx="1" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".3"/><circle cx="${x}" cy="96" r="1.8" fill="url(#oak${u})"/>`).join('');
    const live = [[128, 60, -18], [142, 140, 10], [156, 60, -8], [170, 140, 14]].map(([x, tx, sw], k) => { const d = `M${x} 104q${sw} -8 0 -16t${-sw} -16t${sw * .6} -14L${tx} 22`;
      return `<path d="M${x - 4} 100q4 -3 8 0q-4 3 -8 0" stroke="#d4b07a" stroke-width="1.1" fill="none"/>` + rope(d, 1.1) + `<path d="${d}" stroke="#7aff9a" stroke-width="2.6" fill="none" opacity=".16"/>`; }).join('');
    // the sword: a broadsword with a cup hilt, a green stone in the pommel, driven into the planks
    const sword = shadow(u, 70, 127, 10, .6, 2) + `<g filter="url(#drop${u})"><path d="M68.4 126V80h3.2V126z" fill="url(#silver${u})" stroke="#3a4248" stroke-width=".4"/><path d="M70 82v42" stroke="#ffffff" stroke-width=".5" opacity=".6"/>`
      + `<path d="M58 80q12 -10 24 0q-12 6 -24 0z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><rect x="68" y="62" width="4" height="16" rx="1.4" fill="#3a1e0e"/><circle cx="70" cy="60" r="4" fill="#2a8a4a" stroke="#0a3a1a" stroke-width=".5"/><circle cx="69" cy="59" r="1.2" fill="#d8ffe0"/></g>`
      + glow(u, 70, 60, 16, 16, '#7aff9a', .7) + `<path d="M65 124q2 -2 10 0" stroke="#0a0604" stroke-width="1.6" fill="none"/>`;
    const tf = uid('plt' + u);
    const trail = blurF(tf, 1.6) + `<path d="M74 126Q100 122 120 116T140 110" stroke="#7aff9a" stroke-width="3" fill="none" opacity=".7" filter="url(#${tf})"/><path d="M74 126Q100 122 120 116T140 110" stroke="#e8fff0" stroke-width=".8" fill="none" opacity=".8"/>`
      + glow(u, 150, 104, 40, 20, '#7aff9a', .25);
    const light = glow(u, 40, 100, 70, 50, '#ffc890', .25) + gloom(u, 100, 140, 100, 280, .5, '#0a0402');
    return [back + sail + bulwark + deck, rail + live + trail + sword + coil(36, 150, 18, 5) + light];
  },

  // The fountain of youth: in a high cave a slanting shaft of sunset light falls through a hole in the vault onto a
  // ledge; two different silver chalices stand there, a glowing drop falls from a stalactite into the left one.
  'Фонтан молодости': u => {
    const cg = uid('pcv' + u);
    const cave = grad(cg, [[0, '#1a1210'], [.5, '#2a1e18'], [1, '#0a0806']]) + `<rect width="200" height="${H}" fill="url(#${cg})"/>`
      + `<ellipse cx="100" cy="6" rx="22" ry="8" fill="#ffd8a0"/>` + glow(u, 100, 8, 40, 20, '#ffd8a0', .7)
      + Array.from({ length: 16 }, (_, k) => { const r = R(k + 3), x = k < 8 ? 6 + k * 8 + r() * 4 : 128 + (k - 8) * 9 + r() * 4, l = 14 + r() * 26; return `<path d="M${f1(x - 3)} 0L${f1(x)} ${f1(l)}L${f1(x + 3)} 0z" fill="#3a2a22" stroke="#1a1210" stroke-width=".4"/><path d="M${f1(x - 1)} 2L${f1(x)} ${f1(l - 2)}" stroke="#c8a888" stroke-width=".4" opacity=".6"/>`; }).join('')
      + [[20, 60], [180, 70], [14, 110], [186, 120]].map(([x, y]) => `<path d="M${x} ${y}q4 10 0 20" stroke="#e8d0b0" stroke-width=".6" fill="none" opacity=".4"/>`).join('');
    const beamL = shafts(u, 100, 4, [[50, 120, 110, 120]], '#ffd8a0', .3) + motes(30, 60, 20, 60, 100, '#ffe8c0', 8);
    // the drip: a stalactite over the left cup, a glowing drop falling
    const drip = `<path d="M70 0L74 52L78 0z" fill="#4a362a" stroke="#1a1210" stroke-width=".4"/><path d="M73 6l1 44" stroke="#e8d0b0" stroke-width=".4"/><path d="M74 64q2.4 3 2.4 4.6a2.4 2.4 0 0 1 -4.8 0q0 -1.6 2.4 -4.6z" fill="#e8fff8"/>` + glow(u, 74, 67, 8, 8, '#b8fff0', .8);
    const ledge = `<path d="M10 112q40 -6 90 -4t90 4l6 14q-90 6 -192 0z" fill="#4a3a2e" stroke="#1a1210" stroke-width=".6"/><path d="M10 112q40 -6 90 -4t90 4" stroke="#ffd8a0" stroke-width=".8" fill="none" opacity=".7"/>`;
    const pool = grad('ppl' + u, [[0, '#2a6a6a'], [1, '#04100e']]) + `<rect y="124" width="200" height="${H - 124}" fill="url(#ppl${u})"/>` + glow(u, 100, 130, 90, 20, '#9ff0e0', .4)
      + [0, 1, 2, 3].map(k => `<path d="M0 ${128 + k * 8}q${50} -2 100 0t100 0" stroke="#c8fff0" stroke-width=".5" fill="none" opacity="${.5 - k * .1}"/>`).join('');
    // two chalices of silver, engraved: the left holds water and takes the drop (rings), the right is empty, turned
    const chal = (x, s, full, a) => `<g transform="translate(${x} 110) rotate(${a}) scale(${s})" filter="url(#drop${u})"><path d="M-12 0q12 -4 24 0l-2 -3h-20z" fill="url(#silver${u})" stroke="#3a4248" stroke-width=".5"/><path d="M-2 -3v-14h4v14z" fill="url(#silver${u})"/><ellipse cy="-12" rx="4" ry="1.6" fill="url(#silver${u})"/>`
      + `<path d="M-14 -40q0 22 14 24q14 -2 14 -24z" fill="url(#silver${u})" stroke="#3a4248" stroke-width=".5"/><ellipse cy="-40" rx="14" ry="3.6" fill="${full ? '#2a8a8a' : '#2a3034'}" stroke="#dfe6ea" stroke-width=".6"/>`
      + (full ? `<ellipse cy="-40" rx="8" ry="2" fill="none" stroke="#c8fff8" stroke-width=".5"/><ellipse cy="-40" rx="4" ry="1" fill="none" stroke="#e8fff8" stroke-width=".5"/>` : '')
      + `<path d="M-10 -32q10 4 20 0M-8 -26q8 3 16 0" stroke="#5a6268" stroke-width=".5" fill="none"/>${[-8, -3, 3, 8].map(xx => `<path d="M${xx} -30l1.4 2l1.4 -2" stroke="#5a6268" stroke-width=".4" fill="none"/>`).join('')}<path d="M-12 -38q2 14 8 18" stroke="#ffffff" stroke-width="1" fill="none" opacity=".6"/></g>`;
    const cups = shadow(u, 74, 111, 16, .6, 2) + shadow(u, 128, 111, 16, .6, 2) + chal(74, 1.25, true, 0) + chal(128, 1.15, false, 6) + glow(u, 74, 60, 20, 12, '#b8fff0', .3);
    const light = glow(u, 100, 100, 70, 30, '#ffd8a0', .3) + gloom(u, 100, 140, 100, 280, .5, '#020606');
    return [cave + beamL, drip + ledge + pool + cups + light];
  },

  // Zombie officers: two dead officers stand on the deck, one short and stout with his hands behind his back, the
  // other tall and thin, a hole of a round shot through his chest (the sky shows through it) — he straightens his hat.
  'Зомби-офицеры': u => {
    const hz = 84;
    const back = redNight(u, hz, 41) + moon(u, 100, 26, 7, '#ffe0c0', '#ff9a6a', .45);
    const bulwark = `<rect y="92" width="200" height="16" fill="#3a2414"/>` + woodTex(u, 0, 92, W, 16, '#4a3020', '#22140a', '#0a0604', 4, false, 5) + `<path d="M0 92h200" stroke="#ffb090" stroke-width="1" opacity=".7"/><path d="M0 89h200v3h-200z" fill="#4a3020"/>`
      + woodTex(u, 0, 108, W, H - 108, '#4a3020', '#1e120a', '#0a0604', 9, false, 7);
    const splash = put('splash', 172, 88, .4, 0, u, false) + shot(u, 142, 74, 166, 84, .1, '#d8c8c0').replace(/<circle[^>]*\/>/g, '');
    const fat = `<g transform="translate(70 0) scale(1.25 1) translate(-70 0)">${deadman(u, 70, 126, 66, { coat: '#2a2a40', trim: '#c9a048', skin: '#7a8a62', epaulettes: true, back: true, hat: 'tricorn', light: '#ffb090' })}</g>`;
    const thin = deadman(u, 122, 126, 84, { coat: '#26263a', trim: '#c9a048', skin: '#6a7a58', epaulettes: true, hat: 'tricorn', armL: [6, 2], armR: [150, 228], hole: 'M0 -66m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0', light: '#ffb090' });
    const shadows = shadow(u, 70, 127, 18, .6, 2.4) + shadow(u, 122, 127, 14, .6, 2.4);
    const light = glow(u, 100, 26, 60, 40, '#ffc8a8', .2) + gloom(u, 100, 140, 100, 280, .5, '#0a0202');
    return [back, splash + bulwark + shadows + fat + thin + light];
  },

  // Wall of fire: oil spilled on the sea burns in a wall in front of the enemy who has just fired; the smoke of her
  // broadside still hangs at her ports, her sails smoulder, the forecastle has caught; black smoke drifts up and left.
  'Огненная стена': u => {
    const hz = 96;
    const back = redNight(u, hz, 47) + smoke(u, 20, 60, 1.6, 7, -.6, 3, '#2a1e1c', 40) + smoke(u, 10, 30, 1.4, 6, -1, 9, '#3a2c28', 20);
    const ship = tint(sailing('endeavour', 104, 66, 1.62, 0, u), [1, .7, .52], [.06, 0, 0], .8) + smoke(u, 80, 88, .55, 6, -1, 5, '#8a7a72', 10) + smoke(u, 120, 88, .5, 5, -1, 8, '#8a7a72', 10)
      + flame(u, 66, 82, .5, 3) + flame(u, 72, 80, .35, 4) + [[80, 40], [116, 34], [132, 50]].map(([x, y]) => `<path d="M${x - 8} ${y}q8 3 16 0" stroke="#ff8a2a" stroke-width="1" fill="none" opacity=".8"/>` + glow(u, x, y, 8, 4, '#ff9a3a', .5)).join('');
    // the wall: tongues of different height in layers, from 28 % to 45 %, a wide gap where her hull shows
    const wall = fireBand(u, 0, 70, 126, 20, 46, 5, 8) + fireBand(u, 120, 200, 126, 18, 48, 11, 8) + fireBand(u, 70, 120, 126, 6, 12, 17, 5)
      + sparks(0, 60, 200, 60, 50, 6) + smoke(u, 160, 70, .9, 6, -1.2, 13, '#2a1e1c', 30);
    const water = `<path d="M0 126h200" stroke="#ffd070" stroke-width="1.6" opacity=".8"/>` + glow(u, 100, 132, 110, 14, '#ff8a2a', .45)
      + Array.from({ length: 14 }, (_, k) => { const r = R(k + 3); return `<path d="M${f1(r() * 190)} ${f1(132 + k * 4)}h${f1(10 + r() * 24)}" stroke="#ffb050" stroke-width="${f2(1.2 - k * .06)}" opacity="${f2(.6 - k * .03)}"/>`; }).join('');
    const light = glow(u, 100, 110, 110, 50, '#ff8a2a', .3) + gloom(u, 100, 150, 100, 280, .5, '#0a0202');
    return [back + ship, wall + water + light];
  },

  // Return fire: from the deck of the Revenge behind her guns: their barrels run out through the ports and fire up
  // at the enemy, who is already taking our hits: splinters, a yard shot away, columns of water at her waterline.
  'Ответный залп': u => {
    const hz = 82;
    const back = dusk(u, hz, 30, 50, 13);
    const enemy = tint(sailing('endeavour', 126, 62, 1.0, -3, u), [1, .74, .58], [.05, 0, 0], .85) + smoke(u, 110, 76, .45, 5, -1, 7, '#c8b8b0', 8) + smoke(u, 140, 76, .4, 4, -1, 9, '#c8b8b0', 8)
      + `<path d="M140 38l12 10" stroke="#2a1a10" stroke-width="1.6"/>` + splinters(118, 72, 12, 3, '#ffd8a8', 8) + put('splash', 100, 80, .3, 0, u, false) + put('splash', 150, 81, .26, 0, u, false);
    // the Revenge's bulwark on the inside, three ports, the guns run out at different distances from us
    const bw = `<path d="M-4 86h208v44h-208z" fill="#3a2010"/>` + woodTex(u, 0, 86, W, 44, '#5a3420', '#2a160a', '#0a0402', 6, false, 4) + `<path d="M-4 86h208" stroke="#ffc890" stroke-width="1"/><path d="M-4 83h208v3h-208z" fill="#5a3418"/>`
      + [[22, 94, 28], [84, 92, 30], [150, 94, 30]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="20" fill="#120806" stroke="#1a0a04" stroke-width="2"/>`).join('');
    const guns = img('deck-cannon', 30, 112, 1.1, -16, u) + img('deck-cannon', 96, 114, 1.35, -14, u) + img('deck-cannon', 158, 118, 1.65, -12, u);
    const fire = muzzle(u, 54, 97, -20, .7) + muzzle(u, 124, 98, -18, .8) + muzzle(u, 192, 98, -16, .9);
    const sm = smoke(u, 50, 86, .45, 5, -1, 3, '#d8ccc0', 16) + smoke(u, 118, 86, .5, 5, -1.2, 5, '#d8ccc0', 18) + smoke(u, 184, 86, .55, 5, -1.4, 7, '#d8ccc0', 18);
    const deck = woodTex(u, 0, 130, W, H - 130, '#5a3a22', '#2a180a', '#0a0604', 9, false, 3) + `<path d="M0 130h200" stroke="#0a0604" stroke-width="1.4"/>`
      + [[40, 130], [110, 132], [176, 136]].map(([x, y]) => rope(`M${x} ${y}q-14 6 -26 2`, 1)).join('');
    const light = glow(u, 120, 96, 90, 30, '#ffb050', .3) + gloom(u, 100, 140, 100, 280, .5, '#0a0202');
    return [back + enemy + sm, bw + guns + fire + deck + light];
  },

  // Cover with her side: the Revenge has turned broadside on to the enemy behind us and takes the shot meant for her
  // ally; the Black Pearl further off is untouched; the ball comes in from the near lower left corner.
  'Прикрыть бортом': u => {
    const hz = 70;
    const back = dusk(u, hz, 186, 40, 19);
    const ally = tint(sailing('pearl', 150, 64, .8, 0, u, false), [1, .82, .72], [.04, 0, 0], .9);
    const near = `<g transform="rotate(-3 76 110)">${tint(sailing('revenge', 76, 97, 2.0, 0, u), [1, .86, .76], [.03, 0, 0], .95)}</g>`
      + `<path d="M10 124q30 -6 60 -2t70 0" stroke="#fff0e0" stroke-width="1.4" fill="none" opacity=".7"/>` + put('splash', 80, 120, .3, 0, u, false);
    const hit = shot(u, -4, 230, 70, 112, 3.2, '#d8c8b8') + glow(u, 74, 110, 22, 16, '#ffc060', .9) + `<path d="M74 110l-7 -6l8 2l-1 -9l4 8l6 -6l-2 8l8 1l-8 3l4 7l-6 -4l-2 8l-2 -8l-7 2z" fill="#ffe080" opacity=".9"/>`
      + splinters(76, 106, 22, 7, '#f0d0a0', 18) + smoke(u, 70, 100, .5, 5, -1, 3, '#d8ccc0', 16);
    const light = glow(u, 186, 40, 70, 40, '#ffd8a0', .3) + gloom(u, 100, 140, 100, 280, .5, '#0a0202');
    return [back + ally, near + hit + light];
  },

  // Heavy side: the Revenge's thick side runs away from us into the picture; a ball strikes the iron band and
  // glances off up to the right in sparks and splinters, its splash falls on the water; her guns are already run out.
  'Тяжёлый борт': u => {
    const hz = 92;
    const back = dusk(u, hz, 176, 52, 21) + tint(sailing('endeavour', 162, 88, .5, 0, u), [.8, .56, .46], [.03, 0, 0], .7) + put('splash', 146, 104, .32, 0, u, false);
    // the side in perspective: tall on the left, running to a vanishing point on the right
    const P = (t, y0, y1) => [f1(t * 150), f1(y0 + (y1 - y0) * t)];
    const hg = uid('phl' + u);
    const side = grad(hg, [[0, '#5a3420'], [1, '#2a160a']], 1, 0) + `<path d="M-4 0L150 72L150 130L-4 300z" fill="url(#${hg})" stroke="#140804" stroke-width=".8"/>`
      + Array.from({ length: 16 }, (_, k) => { const a = k * 19, b = 72 + k * 3.8; return `<path d="M-4 ${a}L150 ${f1(b)}" stroke="#140804" stroke-width=".7" opacity=".8"/><path d="M-4 ${a + 1}L150 ${f1(b + .3)}" stroke="#d89a62" stroke-width=".35" opacity=".35"/>`; }).join('')
      + `<path d="M-4 0L150 72" stroke="#c9a048" stroke-width="2.4"/>` + `<path d="M-4 300L150 130" stroke="#fff0e0" stroke-width="1.4" opacity=".6"/>`;
    // the iron band with its rivets, the dent, sparks fanning out, splinters; the ricochet's short streak
    const band = `<path d="M-4 52L150 92L150 97L-4 64z" fill="url(#iron${u})" stroke="#0a0a0c" stroke-width=".5"/>` + Array.from({ length: 12 }, (_, k) => { const t = k / 11, x = -2 + t * 150, y = 58 + t * 36.5; return `<circle cx="${f1(x)}" cy="${f1(y)}" r=".9" fill="#c8d0d8"/>`; }).join('');
    const hit = `<ellipse cx="80" cy="73" rx="5" ry="3.4" fill="#1a1c1e" transform="rotate(15 80 73)"/><path d="M76 71q4 -2 8 1" stroke="#dfe6ea" stroke-width=".5" fill="none"/>`
      + Array.from({ length: 20 }, (_, k) => { const a = -2.6 + k * .14, d = 6 + (k % 5) * 3; return `<path d="M${f1(80 + Math.cos(a) * 3)} ${f1(73 + Math.sin(a) * 3)}l${f1(Math.cos(a) * d)} ${f1(Math.sin(a) * d)}" stroke="#ffe08a" stroke-width=".7" stroke-linecap="round"/>`; }).join('')
      + glow(u, 80, 72, 16, 12, '#ffd070', .8) + splinters(70, 80, 12, 9, '#f0d0a0', 10) + shot(u, 86, 70, 108, 52, 2.8, '#d8c8b8');
    // the ports below with their red lids raised, the muzzles out and turned towards the enemy
    const ports = [[20, 112, 1.2], [62, 118, .95], [100, 122, .75], [130, 124, .58]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-10" y="-8" width="20" height="16" fill="#0e0604" stroke="#1a0a04" stroke-width="1.4"/>`
      + `<path d="M-11 -8l-2 -12h26l-2 12z" fill="#b8301e" stroke="#4a0a06" stroke-width=".6"/><path d="M-10 0l20 -2" stroke="#1a1c1e" stroke-width="7" stroke-linecap="round"/><ellipse cx="11" cy="-2" rx="2.4" ry="3.6" fill="#2a2c2e" stroke="#0a0a0c" stroke-width=".5"/><ellipse cx="11" cy="-2" rx="1.2" ry="2" fill="#050505"/><path d="M-10 -2l20 -2" stroke="#8a9298" stroke-width="1" opacity=".6"/></g>`).join('');
    const water = `<path d="M-4 300L150 130H200V${H}H-4z" fill="#3a1810" opacity=".0"/>` + `<path d="M150 130q20 2 50 0" stroke="#fff0e0" stroke-width="1" opacity=".6" fill="none"/>`;
    const light = glow(u, 176, 52, 60, 40, '#ffd8a0', .3) + gloom(u, 100, 140, 100, 280, .5, '#0a0202');
    return [back, side + band + ports + hit + water + light];
  }
};

const CAM = {};
for (const k of Object.keys(SCENES)) CAM[k] = { x: 0, y: 0, w: 200 };
module.exports = { SCENES, CAM };
