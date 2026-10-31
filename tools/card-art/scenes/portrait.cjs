// Portrait card pictures: a full-card scene in a 200 x 280 box (the card's own 63.5 x 88.9 mm proportion).
// Composition rule for the printed card (view В-2, docs/tasks/card-art-portrait.md): what the card is about sits in
// the open top, 0-45 % of the picture height; 45-50 % is the edge of the glass text plate; below it (50-90 %) the
// picture runs on blurred and darkened, so there is only calm ground (deck, sea, floor). The top corners (16 %)
// carry the type medal and the price: only background there.
// Reuses the materials and pieces of the landscape scenes; backgrounds are drawn here at the full height.
const K = require('./portrait-kit.cjs');
const { DEFS, img, put, halo, lantern, cloudBand, woodTex, motes, R, afloat, shadow, grad, sky, sea, swell, isles, gulls, plankFloor, beam, vignette, ghostDeck, sailing, cup, dieP, glow, gloom, shafts, flame, smoke, rope, coil, nails } = K;
const { W, VH, H } = K;
let fid = 0;

const SCENES = {
  // Hundred years of service: the hourglass of the ghost ship; its sand turns into the souls of an enemy crew.
  'Сто лет службы': u => {
    const glass = shadow(u, 100, 152, 34, .6) + img('hourglass', 100, 98, 2.3, 0, u)
      + halo(100, 104, 46, '#7fe3d8', .32)
      + Array.from({ length: 14 }, (_, k) => { const r = R(k + 40); const x = 100 + (r() - .5) * 46, y = 60 + r() * 84; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.6 + r() * 1.1).toFixed(2)}" fill="#c8fff4" opacity="${(.35 + r() * .5).toFixed(2)}"/>`; }).join('');
    const irons = `<path d="M38 152q6 8 14 6" stroke="url(#iron${u})" stroke-width="1.6" fill="none"/><circle cx="54" cy="158" r="2.6" fill="none" stroke="url(#iron${u})" stroke-width="1.4"/>`
      + shadow(u, 28, 156, 18, .5) + put('shackle', 28, 150, .7, 0, u);
    // souls drawn out of the enemy crew stream in from the left as pale wisps, fall through the glass as sand
    // and rise again on the right, the Dutchman's new hands; a low fog creeps over the deck
    const f = 'pws' + u, r = R(31);
    const wisp = (d, w, op) => `<path d="${d}" stroke="#bff8ee" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}" filter="url(#${f})"/><path d="${d}" stroke="#ffffff" stroke-width="${(w * .3).toFixed(2)}" fill="none" stroke-linecap="round" opacity="${(op * .8).toFixed(2)}"/>`;
    const souls = blurF(f, 2.2)
      + wisp('M0 46q30 -6 46 6t40 4q10 -2 14 4', 5, .5) + wisp('M0 66q24 8 44 -2t36 -10q12 -2 20 6', 4, .42)
      + wisp('M100 150q16 -10 30 -4t26 -14q8 -6 10 -18', 4.4, .45) + wisp('M104 154q24 2 40 -8t30 -2', 3.4, .38)
      + Array.from({ length: 18 }, () => { const x = 120 + r() * 60, y = 96 + r() * 56; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.4 + r() * .8).toFixed(2)}" fill="#c8fff4" opacity="${(.3 + r() * .5).toFixed(2)}"/>`; }).join('');
    const fog = grad('pfg' + u, [[0, '#b8f0d8', 0], [.55, '#b8f0d8', .22], [1, '#b8f0d8', 0]]) + `<rect y="132" width="${W}" height="34" fill="url(#pfg${u})"/>`;
    const light = glow(u, 100, 104, 56, 64, '#7fe3d8', .35) + glow(u, 100, 152, 50, 10, '#7fe3d8', .3)
      + gloom(u, 100, 100, 0, 0, .45, '#020806') + gloom(u, 100, 120, 100, 280, .5, '#020806');
    return [ghostDeck(u), souls + glass + irons + fog + light];
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
    const lamp = `<path d="M52 52v14" stroke="#2a2418" stroke-width=".8"/>` + lantern(52, 76, 1.05).replace(/#ffb24a/g, '#9ff0d0');
    // the stake: two cards face down on the barrel head, as the card's rule says; a coil of rope, a low green fog
    const back = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})" filter="url(#drop${u})"><rect x="-6" y="-4" width="12" height="8" rx="1" fill="#2f6b4a" stroke="#e8d6aa" stroke-width=".6"/><rect x="-4.4" y="-2.6" width="8.8" height="5.2" rx=".6" fill="none" stroke="#c9a048" stroke-width=".4"/><circle r="1.2" fill="#c9a048"/></g>`;
    const stake = `<g transform="translate(0 0)">${back(88, top - 1, -14).replace('translate(88 ' + (top - 1) + ')', 'translate(88 ' + (top - 1) + ') scale(1 .5)')}${back(114, top + 1, 10).replace('translate(114 ' + (top + 1) + ')', 'translate(114 ' + (top + 1) + ') scale(1 .5)')}</g>`;
    const rope0 = coil(160, 156, 13, 4);
    const fog = grad('pfk' + u, [[0, '#b8f0d8', 0], [.55, '#b8f0d8', .2], [1, '#b8f0d8', 0]]) + `<rect y="140" width="${W}" height="30" fill="url(#pfk${u})"/>`;
    const light = glow(u, 52, 80, 60, 50, '#9ff0d0', .3) + glow(u, 100, top, 44, 12, '#9ff0d0', .22)
      + gloom(u, 40, 80, 200, 40, .45, '#020806') + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [ghostDeck(u) + lamp, barrel + stake + play + fallen + rope0 + fog + light];
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
      + shafts(u, 184, 30, [[150, 112, 162, 112], [176, 112, 190, 112]], '#fff4cc', .18)
      + smoke(u, 182, hz - 9, .22, 4, 1, 11) // smoke of her own gun: she has fired back
      + `<filter id="pbl${u}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4 .3"/></filter><path d="M${out + 10} ${by - 7}L159 ${by - 15}" stroke="#2a2a2a" stroke-width="2.4" opacity=".35" filter="url(#pbl${u})"/>`
      + `<circle cx="160" cy="${by - 15.3}" r="1.5" fill="#1a1a1a"/><circle cx="159.6" cy="${by - 15.7}" r=".5" fill="#8a8a8a"/>`
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
    // the breeching rope: from a ringbolt in the hull, round the breech of the gun, back to the hull
    const ring = (x, y) => `<circle cx="${x}" cy="${y}" r="2.2" fill="none" stroke="url(#iron${u})" stroke-width="1.3"/><rect x="${x + 1.6}" y="${y - 1}" width="2.4" height="2" fill="#2a2a2a"/>`;
    const breeching = ring(HX - 3, by + 18) + rope(`M${HX - 4} ${by + 18}Q${gx - 10} ${by + 30} ${gx - 46} ${by + 4}`, 1.1)
      + rope(`M${gx - 46} ${by + 4}Q${gx - 30} ${by + 22} ${gx - 6} ${FL - 2}`, 1) + coil(gx - 8, FL + 4, 8, 3);
    const horn = `<path d="M44 64v8" stroke="#2a1a0a" stroke-width=".8"/><circle cx="44" cy="63" r="1.2" fill="url(#iron${u})"/>`
      + `<g filter="url(#drop${u})"><path d="M40 72q-6 10 2 20q4 4 9 2l1 -3q-6 -2 -8 -8q-2 -6 2 -11z" fill="#e8d6aa" stroke="#6a5a3a" stroke-width=".5"/><path d="M41 86q4 4 9 4" stroke="#b89a6a" stroke-width=".5" fill="none"/><path d="M50 92l3 -1" stroke="#3a2a14" stroke-width="1.6"/></g>`;
    const pegs = nails(Array.from({ length: 6 }, (_, k) => [8 + k * 22, FL + 9]).concat(Array.from({ length: 6 }, (_, k) => [18 + k * 22, FL + 21])), '#1a0e06', .55);
    const tackle = `<path d="M${gx - 40} ${FL - 6}q-20 -6 -30 -30" stroke="#c9a878" stroke-width="1" fill="none"/><circle cx="${gx - 70}" cy="${FL - 36}" r="2.4" fill="none" stroke="url(#iron${u})" stroke-width="1.3"/>`;
    const bucket = `<g filter="url(#drop${u})" transform="translate(96 206)"><path d="M-9 -12h18l-2 16h-14z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/><path d="M-9.5 -8h19M-8.5 1h17" stroke="url(#iron${u})" stroke-width="1.4"/><ellipse cx="0" cy="-12" rx="9" ry="2" fill="#1e3a44"/></g>`;
    const cartridges = `<g filter="url(#drop${u})" transform="translate(40 226)"><path d="M-16 -8h32v16h-32z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/>${[-10, -2, 6].map(x => `<ellipse cx="${x + 2}" cy="-9" rx="3.4" ry="2" fill="#e8dcc0" stroke="#9a8a6a" stroke-width=".4"/>`).join('')}</g>`;
    const fire = glow(u, out + 8, by, 30, 22, '#ffcf7a', .75) + glow(u, out + 6, by, 10, 7, '#fff6d8', .9)
      + smoke(u, out + 8, by - 4, .5, 6, 1, 7, '#e8e2d6', 24);
    const light = glow(u, 70, 46, 60, 52, '#ffb050', .32) + glow(u, HX - 18, by - 4, 46, 30, '#cfe8f0', .22)
      + glow(u, gx + 20, by - 2, 40, 10, '#ffd8a0', .18) // the barrel catches the flash along its top
      + gloom(u, 90, 70, 0, 160, .45) + gloom(u, 64, 150, 64, 280, .5);
    return [wall + floor + pegs + outside + lamp + horn + rammer + motes(26, 0, 14, HX, 140, '#ffd8a0', 8),
      breeching + gun + balls + hull + shot + fire + bucket + cartridges + light];
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
      + woodTex(u, 0, 175, W, H - 175, '#2e1c0e', '#140a04', '#0a0502', 10, false, 9)
      + [18, 182].map(x => `<rect x="${x - 7}" y="175" width="14" height="${H - 175}" fill="url(#oak${u})" stroke="#0a0502" stroke-width=".6"/><path d="M${x - 5} 175v${H - 175}" stroke="#c08a52" stroke-width=".4" opacity=".5"/>`).join('');
    const map = `<g transform="translate(0 -32)"><g transform="rotate(-3 90 176)" filter="url(#drop${u})"><path d="M18 156h132l3 40h-138z" fill="#eedcb0"/>`
      + `<radialGradient id="ppap${u}" cx=".5" cy=".4" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#7a5020" stop-opacity=".35"/></radialGradient><path d="M18 156h132l3 40h-138z" fill="url(#ppap${u})"/>`
      + `<path d="M32 172q14 -10 30 -4q12 -8 22 2q-6 10 -20 8q-16 6 -32 -6z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/><path d="M98 180q10 -8 22 -2q4 8 -8 10q-12 0 -14 -8z" fill="#d8c08a" stroke="#9a7a50" stroke-width=".5"/>`
      + `<path d="M56 186q24 -8 50 -4" stroke="#a8302a" stroke-width=".8" stroke-dasharray="2 1.5" fill="none"/><path d="M104 180l3 3M107 180l-3 3" stroke="#a8302a" stroke-width="1"/>`
      + `<g transform="translate(134 166)">${Array.from({ length: 8 }, (_, k) => `<path d="M0 0L${(Math.cos(k * Math.PI / 4) * 7).toFixed(2)} ${(Math.sin(k * Math.PI / 4) * 7).toFixed(2)}" stroke="#9a7a50" stroke-width=".4"/>`).join('')}</g></g></g>`;
    const blades = shadow(u, 80, 154, 40, .4) + img('cutlasses', 80, 118, 1.55, 0, u);
    const ring = `<g transform="translate(132 154)">${put('ring', 0, 0, 1.05, 0, u)}</g>`;
    const light = put('candleTall', 166, 134, 1.25, 0, u) + halo(166, 96, 70, '#ffb050', .38);
    // heavy curtains drawn aside and tied, folds shaded away from the candle
    const curtain = (x, dir) => { const id = 'pcu' + u + (fid++); const d = dir; return grad(id, [[0, '#4a0e12'], [.5, '#8e2420'], [1, '#3a0a0c']], 1, 0)
      + `<g filter="url(#drop${u})"><path d="M${x} 2h${16 * d}q${-2 * d} 40 ${-6 * d} 58q${8 * d} 22 ${4 * d} 46h${-12 * d}q${-4 * d} -30 ${-2 * d} -46q${-2 * d} -30 0 -58z" fill="url(#${id})"/>`
      + [3, 7, 11].map(k => `<path d="M${x + k * d} 4q${-1 * d} 30 ${-3 * d} 56q${3 * d} 22 ${1 * d} 44" stroke="#2a0608" stroke-width=".7" fill="none" opacity=".7"/>`).join('')
      + `<path d="M${x - 1 * d} 60q${8 * d} 3 ${14 * d} -1" stroke="#c9a048" stroke-width="2"/><circle cx="${x + 14 * d}" cy="59" r="1.6" fill="#e8c46a"/></g>`; };
    const inkwell = `<g filter="url(#drop${u})"><path d="M22 150q-1 -7 4 -8h6q5 1 4 8z" fill="#1a2430" stroke="#0a0e14" stroke-width=".5"/><ellipse cx="29" cy="142" rx="3.4" ry="1.1" fill="#3a4a5a"/><path d="M24 145q2 -2 3 0" stroke="#8ab0d0" stroke-width=".5" fill="none" opacity=".7"/>`
      + `<path d="M29 142L46 104" stroke="#e8e0d0" stroke-width=".8"/><path d="M46 104q-6 6 -10 16q4 -3 8 -4q-2 -3 2 -12z" fill="#f4ecdc" stroke="#b8a888" stroke-width=".3"/><path d="M45 106q-4 7 -7 13" stroke="#c8b898" stroke-width=".3"/></g>`;
    const moon = shafts(u, 132, 36, [[60, 150, 100, 160], [118, 150, 150, 156]], '#c8dcf0', .16) + glow(u, 100, 138, 70, 22, '#a8c4e0', .2);
    const candle = glow(u, 166, 112, 70, 56, '#ffb050', .42) + glow(u, 166, 98, 14, 18, '#fff0c0', .5)
      + glow(u, 92, 116, 26, 10, '#ffd8a0', .3) // the blades catch the candle
      + gloom(u, 150, 110, 0, 40, .5) + gloom(u, 100, 160, 100, 280, .5);
    return [wall + win + curtain(18, -1) + curtain(182, 1) + table + map + motes(16, 0, 0, 200, 150, '#ffe0b0', 12),
      inkwell + blades + ring + light + moon + candle];
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
    // a stack of timber on the yard behind, a tar kettle boiling on a fire in front, its smoke drifting with the wind
    const timber = `<g filter="url(#drop${u})">${[0, 1, 2, 3].map(k => `<rect x="${4 + k * 1.5}" y="${136 - k * 3.2}" width="34" height="3.2" fill="${k % 2 ? '#c49a62' : '#b08850'}" stroke="#6a4a24" stroke-width=".3"/>`).join('')}${[0, 1, 2, 3, 4].map(k => `<circle cx="${6 + k * 6.6}" cy="139.4" r="1.6" fill="#d8b47e" stroke="#7a5a30" stroke-width=".3"/>`).join('')}</g>`;
    const kettle = shadow(u, 24, GR, 14, .45) + flame(u, 24, GR - 1, .38, 9)
      + `<path d="M15 ${GR}l4 -7M33 ${GR}l-4 -7M24 ${GR}v-7" stroke="#2a1a0a" stroke-width="1.2"/>`
      + `<g filter="url(#drop${u})"><path d="M14 ${GR - 18}h20l-2 9q-8 3 -16 0z" fill="#2a2a2a" stroke="#111" stroke-width=".5"/><ellipse cx="24" cy="${GR - 18}" rx="10" ry="2" fill="#0a0a0a"/><path d="M16 ${GR - 16}h3" stroke="#6a6a6a" stroke-width=".6"/></g>`
      + smoke(u, 26, GR - 24, .7, 8, 1.2, 13, '#6e6860', 46) + glow(u, 24, GR - 4, 18, 10, '#ffb050', .5);
    const sun = shafts(u, 36, 30, [[60, 166, 96, 166], [110, 166, 140, 166], [0, 120, 0, 150]], '#fff4cc', .14)
      + glow(u, 70, 140, 50, 20, '#fff0c8', .25) + gloom(u, 60, 100, 200, 160, .35);
    return [back + yard + timber + ground + slip + motes(10, 0, 40, 200, 100, '#fff8e0', 5),
      shadow(u, 102, 160, 66, .5) + masts + hull + patch + shores + stage + crane + kettle + quay + sun];
  },

  // Reaction «Уйти по ветру»: the black ship runs before a strong wind and leaves the chaser behind. The wind is
  // shown by what it does: every sail full, the long pennant and the flags streaming aft, spume torn off
  // the crests, low clouds racing; she pitches bow-up over a big bow wave and draws a long white wake; far astern
  // the chaser's shot drops short into that wake.
  'Уйти по ветру': u => {
    const hz = 112;
    const back = sky(u, 0, hz, [[0, '#3e7aa6'], [.5, '#94bed4'], [.88, '#efe6c8'], [1, '#f6e2b2']])
      + halo(166, 34, 60, '#fff4cc', .8) + `<circle cx="166" cy="34" r="8.5" fill="#fffbe6"/>`
      + cloudBand(u, 4, 40, '#fffaf0', '#a9b8c4', 31, 2.0, '0.012 0.09') + cloudBand(u, 46, 34, '#fff4dc', '#b8b4a8', 17, 2.3, '0.016 0.11')
      + cloudBand(u, 80, 26, '#fffaf0', '#c8c4b8', 5, 2.45, '0.02 0.12')
      + shafts(u, 166, 34, [[110, hz, 136, hz], [184, hz, 200, 100]], '#fff4cc', .15);
    const chaser = afloat('endeavour', 186, hz - 1, .3, 2, u) + smoke(u, 178, hz - 2, .2, 4, -1, 21, '#f2eee6', 12);
    const water = isles(hz, '#6e8a96', .45) + sea(u, hz, H, '#5a96a6', '#2a6678', '#0a2a36', '#e8fbff', '#fff6d6', 166) + swell(hz + 8, H, '#e8f8f8', .5, 9);
    // white caps with spume blown aft, the way her flags stream (the wind she makes with her speed)
    const r = R(23);
    const caps = Array.from({ length: 16 }, () => { const x = 8 + r() * 184, y = hz + 14 + r() * 50, w = 6 + (y - hz) * .18; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(w / 2).toFixed(1)} -2.2 ${w.toFixed(1)} 0" stroke="#ffffff" stroke-width="1.1" fill="none" opacity=".8"/><path d="M${(x + w).toFixed(1)} ${(y - 1).toFixed(1)}q5 -1 ${(8 + r() * 6).toFixed(1)} -0.4" stroke="#ffffff" stroke-width=".5" fill="none" opacity=".55"/>`; }).join('');
    // her wake: two diverging lines of foam from the stern to the right edge, churned water between
    const sx = 168, sy = 140;
    const wake = `<path d="M${sx} ${sy}Q186 ${sy + 2} 204 ${sy + 4}M${sx} ${sy + 1}Q188 ${sy + 8} 204 ${sy + 14}" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".75"/>`
      + `<path d="M${sx} ${sy}Q188 ${sy + 4} 204 ${sy + 8}" stroke="#d8f4f4" stroke-width="5" fill="none" opacity=".35"/>`;
    const miss = put('splash', 192, sy + 8, .42, 0, u, false) + `<ellipse cx="192" cy="${sy + 11}" rx="11" ry="2" fill="#f4fcff" opacity=".55"/>`;
    const ship = sailing('pearl', 112, 108, 2.2, 4, u);
    // the long pennant from the main truck and the spray at the bow, both blown ahead of her
    const pennant = `<path d="M122 60q10 -3 20 1t20 0t18 3l-2 2q-8 -3 -17 -2t-20 -1t-19 -1z" fill="#1d1d1f" stroke="#0a0a0a" stroke-width=".3"/><path d="M122 60q10 -1 20 2" stroke="#8e2420" stroke-width=".8" fill="none"/>`;
    const r2 = R(17);
    const spray = Array.from({ length: 30 }, () => { const x = 22 + r2() * 34, y = 118 + r2() * 20; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.3 + r2() * .7).toFixed(2)}" fill="#ffffff" opacity="${(.4 + r2() * .5).toFixed(2)}"/>`; }).join('');
    const bow = put('splash', 46, 134, .5, -14, u, false) + `<path d="M52 140q-16 0 -40 8M54 142q-10 4 -30 12" stroke="#ffffff" stroke-width="1" fill="none" opacity=".75"/>` + spray;
    const light = glow(u, 150, 70, 60, 50, '#fff0c8', .2) + glow(u, 166, 150, 46, 14, '#fff6d6', .25) + gloom(u, 100, 120, 100, 280, .38, '#06202a');
    return [back + chaser + water + caps + wake + miss + gulls([[150, 26, 1.1], [138, 20, .8]]), ship + pennant + bow + light];
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
  return `<svg viewBox="0 0 ${W} ${VH}" width="100%" height="100%"><defs>${DEFS(u)}</defs>${body}${vignette(u)}</svg>`;
}

// portrait(name, {vh}) — vh: the picture's height for another card shape (343 for a 70 × 120 mm tarot card);
// portrait(name) — the whole picture; portrait(name, {layer: 'fg'}) — only the foreground on transparency
// (for a card frame that lets the foreground step over its border).
// The camera of each card: the part of the scene {x, y, w} (w wide, w × 1.4 high) that fills the whole picture
// 200 × 280. Chosen so that what the card is about is large and sits in the open top (0-45 %, above the plate).
const CAM = {
  'Ядра': { x: 0, y: 14, w: 200 },
  'Верфь Компании': { x: 10, y: 38, w: 176 },
  'Анжелика': { x: 0, y: 14, w: 200 },
  'Уйти по ветру': { x: 0, y: 4, w: 200 },
  'Сто лет службы': { x: 0, y: 24, w: 200 },
  'Игра в кости лжеца': { x: 8, y: 42, w: 184 }
};
// the other 75 cards, one file per deck: each exports { SCENES, CAM } in the same shape as above
for (const d of ['pearl', 'revenge', 'endeavour', 'dutch']) { const m = require(`./portrait-${d}.cjs`); Object.assign(SCENES, m.SCENES); Object.assign(CAM, m.CAM); }
function portrait(name, opts = {}) {
  const u = 'q' + (fid++);
  const f = SCENES[name]; if (!f) throw new Error('no portrait scene ' + name);
  const [bg, fg] = f(u);
  const c = opts.cam || CAM[name] || { x: 0, y: 0, w: W }, k = W / c.w, vh = opts.vh || VH;
  const cam = b => `<g transform="scale(${k.toFixed(4)}) translate(${-c.x} ${-c.y})">${b}</g>`;
  const body = opts.layer === 'fg' ? cam(fg) : cam(bg + fg) + (opts.vignette === false ? '' : vignette(u, vh));
  return `<svg viewBox="0 0 ${W} ${vh}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs>${DEFS(u)}<clipPath id="pc${u}"><rect width="${W}" height="${vh}"/></clipPath></defs><g clip-path="url(#pc${u})">${body}</g></svg>`;
}
module.exports = { portrait, backArt, BACKS: Object.keys(BACKS), SCENES: Object.keys(SCENES), W, H: VH };
