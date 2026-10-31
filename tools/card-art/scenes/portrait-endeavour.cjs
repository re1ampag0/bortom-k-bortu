// Portrait scenes of the «Индевор» deck (docs/tasks/card-art-portrait.md): day, blue and white, order; the night is
// blue and moonlit, a candle or a lamp is allowed indoors. Picture units (camera {0, 0, 200}: p % is y = 2.8 p).
const K = require('./portrait-kit.cjs');
const sea = K.seaG;
const { img, put, woodTex, R, shadow, uid, grad, sky, swell, sailing, beam, lantern, motes, glow, gloom, shafts, flame, smoke, rope, coil, nails, blurF, gulls,
  f1, f2, stars, moon, tint, lit, NIGHT, ball, shot, muzzle, arm, hand, cardBack, sand, tableTop, bottle, W, H } = K;

// the deck's day: blue sky with clouds, the sun, the sea with its glints
const day = (u, hz, sx, sy, seed = 3) => sky(u, 0, hz + 1, [[0, '#3a76a6'], [.55, '#8ab8d4'], [.9, '#e8e2c8'], [1, '#f6e2b2']]) + glow(u, sx, sy, 50, 50, '#fff4cc', .8)
  + `<circle cx="${sx}" cy="${sy}" r="8.5" fill="#fffbe6"/>` + K.cloudBand(u, Math.max(0, hz - 70), 40, '#fffaf0', '#a9b8c4', 31 + seed, 2.1, '0.012 0.09')
  + sea(u, hz, H, '#5c9aa8', '#2c6a7c', '#0e3442', '#e8fbff', '#fff6d6', sx, seed);
const splinters = (x, y, n, seed, col = '#f0d8b0', sp = 14) => { const r = R(seed); return Array.from({ length: n }, () => { const a = r() * Math.PI * 2, d = 3 + r() * sp, l = 1.5 + r() * 3.4; const xx = x + Math.cos(a) * d, yy = y + Math.sin(a) * d * .8; return `<path d="M${f1(xx)} ${f1(yy)}l${f1(Math.cos(a + 1) * l)} ${f1(Math.sin(a + 1) * l)}" stroke="${col}" stroke-width="${f2(.6 + r() * .6)}" stroke-linecap="round"/>`; }).join(''); };
const spray = (x, y, w, h, n, seed, col = '#ffffff') => { const r = R(seed); return Array.from({ length: n }, () => `<circle cx="${f1(x + r() * w)}" cy="${f1(y + r() * h)}" r="${f2(.25 + r() * .6)}" fill="${col}" opacity="${f2(.4 + r() * .5)}"/>`).join(''); };
// paper with lines of strokes instead of letters, a red seal; a ledger page
const lines = (x, y, n, w, gap = 2.6, col = '#5a4a38') => Array.from({ length: n }, (_, k) => `<path d="M${x} ${f1(y + k * gap)}q${f1(w * .25)} -.5 ${f1(w * .5)} 0t${f1(w * (k % 3 === 2 ? .3 : .5))} 0" stroke="${col}" stroke-width=".45" fill="none"/>`).join('');
const seal = (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#a81a14" stroke="#5a0a06" stroke-width=".4"/><circle cx="${x}" cy="${y}" r="${f2(r * .6)}" fill="none" stroke="#e86a5a" stroke-width=".4"/><path d="M${f1(x - r * .3)} ${y}h${f1(r * .6)}M${x} ${f1(y - r * .3)}v${f1(r * .6)}" stroke="#e86a5a" stroke-width=".4"/>`;
const coinStack = (u, x, y, n, rx = 4.6) => Array.from({ length: n }, (_, k) => `<ellipse cx="${x}" cy="${f1(y - k * 1.5)}" rx="${rx}" ry="${f2(rx * .38)}" fill="url(#brassR${u})" stroke="#5e4210" stroke-width=".35"/>`).join('') + `<path d="M${x - rx} ${y}v${-n * 1.5}" stroke="#fff0b8" stroke-width=".4" opacity=".6"/>`;
const quill = (u, x, y, a = -30, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})" filter="url(#drop${u})"><path d="M0 0L0 -32" stroke="#e8e0d0" stroke-width=".8"/><path d="M0 -32q-5 10 -4 24q2 -4 4 -4q2 -8 0 -20z" fill="#f4ecdc" stroke="#b8a888" stroke-width=".3"/></g>`;
const inkwell = (u, x, y, red) => `<g transform="translate(${x} ${y})" filter="url(#drop${u})"><path d="M-6 0q-1 -8 4 -9h4q5 1 4 9z" fill="#1a2430" stroke="#0a0e14" stroke-width=".5"/><ellipse cy="-9" rx="3.4" ry="1.1" fill="${red ? '#8a1010' : '#2a3a4a'}"/><path d="M-4 -5q2 -2 3 0" stroke="#8ab0d0" stroke-width=".5" fill="none" opacity=".7"/></g>`;
// a red-coated soldier of the Company: height h, feet at (x, y). o: { pose: 'stand' | 'kneel' | 'reload' | 'march', hat:
// 'tricorn' | 'shako', drum, face: 'away' | 'side', flip }
function redcoat(u, x, y, h, o = {}) {
  const s = h / 60, hat = o.hat || 'tricorn', red = o.red || '#b8302a';
  const legs = o.pose === 'kneel' ? `<path d="M-3 -24l-2 12l-10 0l0 6M3 -24l6 10l0 14" stroke="#e8e0d0" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="M-17 0h7M7 0h7" stroke="#141010" stroke-width="2.6"/>`
    : `<path d="M-3 -24l-1 24M3 -24l${o.pose === 'march' ? 4 : 1} 24" stroke="#e8e0d0" stroke-width="5"/><path d="M-3 -10l-1 10M3 -10l${o.pose === 'march' ? 2 : 1} 10" stroke="#1a1a1e" stroke-width="5.4"/><path d="M-8 0h7M${o.pose === 'march' ? 5 : 2} 0h7" stroke="#141010" stroke-width="2.4"/>`;
  const ky = o.pose === 'kneel' ? 12 : 0;
  const body = `<g transform="translate(0 ${ky})"><path d="M-8 -48q8 -4 16 0l2 26q-10 4 -20 0z" fill="${red}" stroke="#4a0a06" stroke-width=".5"/><path d="M-7 -47l14 20M7 -47l-14 20" stroke="#f4f0e6" stroke-width="1.6"/><path d="M-8 -26h16" stroke="#f4f0e6" stroke-width="1.4"/>`
    + `<path d="M-8 -48q-2 10 0 22" stroke="#ffb090" stroke-width=".7" fill="none" opacity=".7"/><circle cx="0" cy="-54" r="5" fill="#e8b890" stroke="#6a3a1a" stroke-width=".4"/>`
    + (o.face === 'away' ? `<path d="M-5 -55q5 -4 10 0v4q-5 3 -10 0z" fill="#d8d0c0"/>` : `<circle cx="2.4" cy="-54.6" r=".6" fill="#2a1a10"/>`)
    + (hat === 'shako' ? `<path d="M-5 -58h10l-1 -9h-8z" fill="#1a1a1e" stroke="#000" stroke-width=".3"/><path d="M-5 -58h10" stroke="#c9a048" stroke-width="1"/><circle cx="0" cy="-64" r="1.2" fill="#c9a048"/>` : `<path d="M-8 -57q8 -8 16 0q-3 -6 -8 -6t-8 6z" fill="#1a1612"/><path d="M-8 -57q8 -4 16 0" stroke="#e8e0c0" stroke-width=".6" fill="none"/>`);
  const gun = o.pose === 'kneel' ? `<path d="M-4 -40l34 -4" stroke="#5a3a1c" stroke-width="2"/><path d="M14 -42l16 -2" stroke="url(#iron${u})" stroke-width="1.2"/><path d="M30 -44l8 -1" stroke="#dfe6ea" stroke-width=".6"/><path d="M-6 -44l10 2" stroke="${red}" stroke-width="3.6" stroke-linecap="round"/><path d="M6 -46l10 0" stroke="${red}" stroke-width="3.4" stroke-linecap="round"/>`
    : o.pose === 'reload' ? `<path d="M9 -6l-2 -44" stroke="#5a3a1c" stroke-width="2"/><path d="M7 -50l-.4 -10" stroke="url(#iron${u})" stroke-width="1.2"/><path d="M5 -66l2 -20" stroke="#c8c8c0" stroke-width=".6"/><path d="M-7 -44l12 -16" stroke="${red}" stroke-width="3.4" stroke-linecap="round"/><path d="M7 -44l2 6" stroke="${red}" stroke-width="3.4" stroke-linecap="round"/>`
    : `<path d="M8 -8l2 -42" stroke="#5a3a1c" stroke-width="2"/><path d="M10 -50l.6 -12" stroke="#dfe6ea" stroke-width=".7"/><path d="M7 -44l2 14" stroke="${red}" stroke-width="3.4" stroke-linecap="round"/><path d="M-7 -44l-2 16" stroke="${red}" stroke-width="3.4" stroke-linecap="round"/>`;
  const drum = o.drum ? `<g transform="translate(-6 -26)"><rect x="-7" y="-6" width="14" height="10" rx="1" fill="#e8e0d0" stroke="#5a4a30" stroke-width=".4"/><path d="M-7 -6l14 10M7 -6l-14 10" stroke="#b8302a" stroke-width=".6"/><ellipse cy="-6" rx="7" ry="2" fill="#f4f0e6" stroke="#8a7a60" stroke-width=".4"/></g>` : '';
  return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})" filter="url(#drop${u})">${legs}${body}${gun}${drum}</g></g>`;
}
// a gun from behind, breech towards us: cascabel, base ring, the barrel running off into the port, the carriage
function gunFromBehind(u, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#drop${u})"><path d="M-22 6l4 -24h36l4 24z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M-22 6h44" stroke="#2a1608" stroke-width="2"/>`
    + [-17, 17].map(cx => `<ellipse cx="${cx}" cy="10" rx="5" ry="7" fill="#3a2414" stroke="#140a04" stroke-width=".6"/><ellipse cx="${cx}" cy="10" rx="1.6" ry="2.4" fill="url(#iron${u})"/>`).join('')
    + `<path d="M-9 -16l3 -16h12l3 16z" fill="url(#ironH${u})" stroke="#0e1012" stroke-width=".5"/><ellipse cx="0" cy="-14" rx="12" ry="11" fill="url(#ironH${u})" stroke="#0e1012" stroke-width=".6"/><ellipse cx="0" cy="-14" rx="9" ry="8" fill="none" stroke="#5a6266" stroke-width="1"/>`
    + `<circle cx="0" cy="-14" r="3.6" fill="url(#iron${u})" stroke="#0e1012" stroke-width=".5"/><circle cx="-1" cy="-15" r="1.2" fill="#dfe6ea" opacity=".6"/><rect x="-1.4" y="-27" width="2.8" height="3" fill="#2a2a2a"/></g>`;
}
// the inside of a gun deck: planked side with frames, a port at (px, py, pw, ph) showing `view`, a beam overhead
function gunWall(u, y1, port, view, seed = 7) {
  const [px, py, pw, ph] = port, id = uid('pgw' + u);
  return `<clipPath id="${id}"><rect x="${px}" y="${py}" width="${pw}" height="${ph}"/></clipPath><g clip-path="url(#${id})">${view}</g>`
    + `<mask id="${id}m"><rect width="200" height="${y1}" fill="#fff"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#000"/></mask><g mask="url(#${id}m)">${woodTex(u, 0, 0, W, y1, '#6a4a2c', '#33220f', '#140a04', 12, false, seed)}</g>`
    + `<rect x="${px - 3}" y="${py - 3}" width="${pw + 6}" height="${ph + 6}" fill="none" stroke="#1a0c06" stroke-width="3"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="#e0b880" stroke-width=".6" opacity=".7"/>`;
}

const SCENES = {
  // The whole battery: the Company ship three quarters from the bow fires her whole side at once, a flame from every
  // port; the smoke merges into one wall above the line of fire; the enemy sloop takes it in splashes and splinters.
  'Залп всей батареей': u => {
    const hz = 104;
    const back = day(u, hz, 140, 54, 5);
    const enemy = sailing('pearl', 170, 104, .6, 3, u) + put('splash', 152, 114, .32, 0, u, false) + put('splash', 176, 116, .28, 0, u, false) + splinters(164, 100, 12, 4, '#3a2a1a', 8) + spray(144, 100, 40, 14, 18, 5);
    // her hull in perspective: the bow near on the left, the stern away on the right, two tiers of thirteen ports
    const T = (t, a, b) => a + (b - a) * t;
    const top = t => [T(t, 24, 150), T(t, 86, 98)], mid = t => [T(t, 26, 150), T(t, 104, 108)], wl = t => [T(t, 30, 150), T(t, 130, 118)];
    const hull = `<path d="M10 100Q14 88 24 86L150 98V118L30 130Q16 118 10 100z" fill="#1a1a1e" stroke="#050506" stroke-width=".7"/>`
      + `<path d="M14 100Q22 106 26 104L150 108V112L28 114Q18 110 14 104z" fill="#d8a838"/><path d="M24 86L150 98" stroke="#e8c050" stroke-width="1.2"/><path d="M30 130L150 118" stroke="#f4fcff" stroke-width="1.6" opacity=".8"/>`
      + `<path d="M10 100l-2 -12l4 -1l4 11" fill="#2a2a2e"/><path d="M10 88L50 40" stroke="#3a2a1a" stroke-width="1.4"/>`
      + [[.5, 0], [.5, 1]].map(([, row]) => Array.from({ length: 13 }, (_, k) => { const t = .04 + k * .074, [x, y0] = row ? mid(t) : top(t), sz = 4.6 - t * 2.4, yy = y0 + (row ? 8 : 6);
        return `<rect x="${f1(x - sz / 2)}" y="${f1(yy - sz / 2)}" width="${f1(sz)}" height="${f1(sz * .8)}" fill="#0a0806"/><path d="M${f1(x - sz / 2)} ${f1(yy - sz / 2)}l${f1(sz * .2)} ${f1(-sz * .9)}h${f1(sz * .8)}l${f1(sz * .1)} ${f1(sz * .9)}z" fill="#b8302a"/>`
          + muzzle(u, x + sz * .4, yy, 18, .5 - t * .22); }).join('')).join('');
    // three masts, white sails seen from the front quarter, pennants streaming to the right
    const mast = (x, top0, w, s) => `<path d="M${x} 104V${top0}" stroke="#4a2e14" stroke-width="${f1(2.2 * s)}"/>` + [[0, .28, 1], [.3, .58, .86], [.6, .82, .66]].map(([a, b, k]) => { const y0 = top0 + 8 + a * (96 - top0), y1 = top0 + 8 + b * (96 - top0), hw = w * k;
      return `<path d="M${f1(x - hw * .7)} ${f1(y0)}h${f1(hw * 1.6)}q2 ${f1((y1 - y0) / 2)} -2 ${f1(y1 - y0)}h${f1(-hw * 1.5)}q-3 ${f1(-(y1 - y0) / 2)} 0 ${f1(-(y1 - y0))}z" fill="#f4f2ea" stroke="#9aa4ac" stroke-width=".5"/><path d="M${f1(x - hw * .7)} ${f1(y0)}q-3 ${f1((y1 - y0) / 2)} 0 ${f1(y1 - y0)}" stroke="#b8c4cc" stroke-width="2" fill="none" opacity=".6"/><path d="M${f1(x - hw * .9)} ${f1(y0)}h${f1(hw * 1.9)}" stroke="#4a2e14" stroke-width="1.2"/>`; }).join('')
      + `<path d="M${x} ${top0}q8 0 16 2t14 4l-1 1.4q-7 -3 -13 -4t-16 -1z" fill="#b8302a"/>`;
    const masts = mast(130, 26, 14, .8) + mast(98, 16, 19, 1) + mast(66, 20, 20, 1.1) + `<path d="M66 20L98 16L130 26M12 88L66 30" stroke="#3a2a1a" stroke-width=".5" fill="none"/>`;
    // the smoke: one wall above the line of fire, rising up to the right, shaded below, lit orange inside
    const sm = smoke(u, 60, 84, 1.3, 8, 1.4, 3, '#e8e2d8', 34) + smoke(u, 100, 84, 1.1, 7, 1.2, 7, '#e8e2d8', 30) + glow(u, 110, 96, 60, 14, '#ffb050', .3);
    const foam = `<path d="M10 104q-6 8 0 24" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".8"/>` + spray(0, 112, 40, 20, 20, 7) + glow(u, 90, 128, 80, 10, '#ffd090', .3);
    const light = gloom(u, 100, 140, 100, 280, .4, '#06202a');
    return [back + enemy, masts + sm + hull + foam + light];
  },

  // Paid broadside: on the gun deck the gun fires through the port; in front of it on a crate lies the Company's bill
  // with its seal, solid stacks of coins, a pen in the ink; a pyramid of shot marked in chalk by the wheel.
  'Оплаченный залп': u => {
    const view = day(u, 74, 210, 40, 9) + `<path d="M100 82h50v24h-50z" fill="#2a1a10"/>` + woodTex(u, 100, 82, 50, 22, '#3a2416', '#1a100a', '#060402', 5, false, 2) + `<path d="M100 82h50" stroke="#c9a048" stroke-width="1"/>`
      + glow(u, 128, 90, 16, 10, '#ffd070', .9) + splinters(128, 90, 12, 3, '#f0d8b0', 10);
    const wall = gunWall(u, 132, [100, 46, 50, 58], view, 3) + beam(u, 0, 0, W, 12) + `<g filter="url(#drop${u})"><path d="M100 46l-8 -18h66l-8 18z" fill="#b8302a" stroke="#4a0a06" stroke-width=".6"/></g>`
      + `<path d="M29 46v10" stroke="#2a1a0a" stroke-width=".8"/><path d="M26 46q3 -4 6 0" stroke="#2a1a0a" stroke-width="1" fill="none"/>` + lantern(29, 70, 1.25);
    const deck = woodTex(u, 0, 128, W, H - 128, '#7a5432', '#3a2412', '#120a04', 9, false, 4) + `<path d="M0 128h200" stroke="#120a04" stroke-width="1.6"/>`;
    const gun = shadow(u, 84, 130, 48, .55, 4) + img('deck-cannon', 84, 107, 1.6, -18, u);
    const fire = muzzle(u, 127, 77, -20, 1) + smoke(u, 140, 64, .5, 5, 1, 8, '#e8e2d8', 20);
    // the shot with chalk marks, the crate with the bill, coins, pen; a steelyard and a keg below
    const pyr = [[22, 124], [32, 124], [42, 124], [27, 116], [37, 116], [32, 108]].map(([x, y], k) => ball(u, x, y, 4.8) + `<path d="M${x - 1.6} ${y + 1}${k % 2 ? 'h3' : 'l3 -2.4M' + (x - 1.6) + ' ' + (y - 1.4) + 'l3 2.4'}" stroke="#f4f0e8" stroke-width=".6"/>`).join('');
    const crate = `<g filter="url(#drop${u})"><path d="M108 108h70v20h-70z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/><path d="M108 108l6 -4h70l-6 4z" fill="#a87444" stroke="#140a04" stroke-width=".5"/><path d="M110 118h66" stroke="#4a2e14" stroke-width=".6"/></g>`;
    const bill = `<g transform="translate(140 104) rotate(-6)" filter="url(#drop${u})"><path d="M-18 -3l36 -2l2 6l-36 2z" fill="#f4ecd4"/>${lines(-15, -2.4, 2, 28, 1.6)}</g>` + `<g transform="translate(130 100) skewX(-30) scale(1 .45)">${seal(0, 0, 3.6)}</g>`;
    const coins = coinStack(u, 166, 104, 7) + coinStack(u, 176, 106, 4) + coinStack(u, 116, 106, 3) + inkwell(u, 158, 104) + quill(u, 158, 96, 24, .8);
    const keg = `<g transform="translate(44 150)" filter="url(#drop${u})"><path d="M-12 0q-3 -12 0 -24h24q3 12 0 24z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M-13 -6h26M-13 -18h26" stroke="url(#iron${u})" stroke-width="1.6"/><path d="M-3 -14q3 -4 6 0q-3 4 -6 0z" fill="none" stroke="#3a1a0a" stroke-width=".8"/></g>`
      + `<g transform="translate(150 150) rotate(-10)" filter="url(#drop${u})"><path d="M-24 0h48" stroke="url(#iron${u})" stroke-width="2"/><circle cx="20" cy="2" r="3.4" fill="url(#iron${u})"/><path d="M-20 0l-4 8h8z" fill="url(#brass${u})"/></g>`;
    const light = glow(u, 29, 70, 50, 40, '#ffb050', .35) + glow(u, 127, 77, 50, 40, '#ffd090', .35) + shafts(u, 125, 70, [[60, 130, 100, 130]], '#fff4cc', .12) + gloom(u, 100, 140, 100, 280, .45);
    return [wall + deck, gun + pyr + crate + bill + coins + keg + fire + light];
  },

  // Aimed fire: we look over the breech of the gun along its barrel into the big port; out there the enemy's side in
  // the sun with her ports open and her guns out — the target; the gunner drives the quoin under the breech.
  'Прицельный огонь': u => {
    const view = day(u, 70, 30, 20, 11) + `<path d="M50 66h100v42h-100z" fill="#2a1a10"/>` + woodTex(u, 50, 66, 100, 40, '#4a3424', '#22160c', '#0a0604', 6, false, 5)
      + `<path d="M50 66h100" stroke="#e8c050" stroke-width="1.4"/>` + [64, 88, 112, 136].map(x => `<rect x="${x - 5}" y="80" width="10" height="8" fill="#0a0604"/><path d="M${x - 5} 80l1 -6h8l1 6z" fill="#b8302a"/><path d="M${x - 4} 84h-6" stroke="#1a1c1e" stroke-width="3.4" stroke-linecap="round"/>`).join('')
      + glow(u, 100, 80, 80, 24, '#fff4cc', .3);
    const wall = gunWall(u, 132, [50, 48, 100, 58], view, 9) + beam(u, 0, 26, W, 14) + `<path d="M0 40h200" stroke="#0a0604" stroke-width="1.2"/>`
      + `<g filter="url(#drop${u})"><path d="M50 48l6 -10h88l6 10z" fill="#b8302a" stroke="#4a0a06" stroke-width=".6"/></g>` + `<path d="M24 46v8" stroke="#2a1a0a" stroke-width=".8"/>` + lantern(24, 66, 1.15);
    const deck = woodTex(u, 0, 128, W, H - 128, '#7a5432', '#3a2412', '#120a04', 9, false, 7) + `<path d="M0 128h200" stroke="#120a04" stroke-width="1.6"/>`;
    // the gun from behind, a brass quadrant on the breech; chalk strokes on the carriage
    const gun = gunFromBehind(u, 100, 118, 1.7) + `<g transform="translate(100 82)"><path d="M0 0L12 0A12 12 0 0 0 0 -12z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/>${Array.from({ length: 7 }, (_, k) => { const a = -k * Math.PI / 12; return `<path d="M${f1(Math.cos(a) * 9)} ${f1(Math.sin(a) * 9)}L${f1(Math.cos(a) * 11.4)} ${f1(Math.sin(a) * 11.4)}" stroke="#5a4010" stroke-width=".4"/>`; }).join('')}<path d="M0 0l9 -6" stroke="#2a2a2a" stroke-width=".6"/></g>`
      + `<path d="M76 116l4 0M78 120l4 0M76 124l6 -1" stroke="#f4f0e8" stroke-width=".7"/>`;
    // the gunner on the left: his back and shoulder, the arm down to the quoin under the breech
    const gunner = `<g filter="url(#drop${u})"><path d="M0 120q4 -30 22 -34q14 -2 22 6q6 8 4 28z" fill="#1e2a4a" stroke="#0a1020" stroke-width=".6"/><path d="M22 86q14 -2 22 6" stroke="#8ab0e0" stroke-width=".8" fill="none" opacity=".6"/><circle cx="26" cy="80" r="9" fill="#5a3a24"/><path d="M18 76q8 -6 16 0" stroke="#2a1a0e" stroke-width="3" fill="none"/></g>`
      + arm(u, 40, 96, 72, 114, { w0: 11, w1: 8, cloth: '#1e2a4a', light: '#4a5a8a', dark: '#0a1020', cuff: '#e8e0d0', pose: 'fist', side: 1, s: 1.2 })
      + `<path d="M78 112l12 2l-1 5l-12 -1z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/>`;
    const glass = `<g transform="translate(162 116)" filter="url(#drop${u})"><path d="M-22 6h44v10h-44z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/><g transform="rotate(-6)"><rect x="-20" y="-2" width="16" height="5" rx="1" fill="url(#brass${u})"/><rect x="-5" y="-1.6" width="14" height="4.2" rx="1" fill="url(#leather${u})"/><rect x="8" y="-1.2" width="12" height="3.4" rx="1" fill="url(#brass${u})"/><ellipse cx="-20" cy=".5" rx="1" ry="2.5" fill="#8ab0d0"/></g></g>`;
    const table = `<path d="M178 60v4" stroke="#2a1a0a" stroke-width=".8"/><g transform="translate(178 72)" filter="url(#drop${u})"><rect x="-8" y="-8" width="16" height="16" fill="#efe4c8"/>${[-4, 0, 4].map(d => `<path d="M-8 ${d}h16M${d} -8v16" stroke="#7a6a50" stroke-width=".3"/>`).join('')}</g>`;
    const light = glow(u, 100, 76, 70, 40, '#fff4cc', .3) + glow(u, 24, 66, 40, 34, '#ffb050', .3) + gloom(u, 100, 140, 100, 280, .45);
    return [wall + deck, gun + gunner + glass + table + light];
  },

  // Business is business: in the Company's office the scales stand dead level, a keg of powder in one pan and a stack
  // of coins in the other; the ledger lies open beside them; the window looks out on the harbour and its ships.
  'Бизнес есть бизнес': u => {
    const wall = grad('pbw' + u, [[0, '#d8c8a8'], [1, '#a8946e']], 1, 0) + `<rect width="200" height="112" fill="url(#pbw${u})"/>` + `<path d="M0 100h200v12h-200z" fill="#7a5a3a"/>`;
    const view = day(u, 44, 120, 18, 13) + sailing('endeavour', 80, 40, .4, 0, u) + sailing('endeavour', 124, 42, .32, 0, u) + `<path d="M56 50h88v18h-88z" fill="#8a7a62" opacity=".0"/>`;
    const win = `<rect x="52" y="8" width="96" height="60" rx="2" fill="#5a3a20"/><clipPath id="pbz${u}"><rect x="56" y="12" width="88" height="52"/></clipPath><g clip-path="url(#pbz${u})">${view}</g>`
      + `<path d="M100 12v52M56 38h88" stroke="#5a3a20" stroke-width="2.4"/><path d="M78 12v52M122 12v52" stroke="#5a3a20" stroke-width="1.2"/><path d="M50 68h100v4h-100z" fill="url(#oak${u})"/>`;
    const map = `<g filter="url(#drop${u})"><rect x="152" y="50" width="34" height="42" fill="#efe2c0" stroke="#6a5030" stroke-width=".6"/><path d="M156 62q8 -6 14 0q6 6 12 2M158 80q10 -4 18 2" stroke="#7a6040" stroke-width=".6" fill="none"/><path d="M166 74q4 -4 8 0q-2 4 -8 0z" fill="#c8b080"/></g>`;
    const table = tableTop(u, 112, H - 112, '#8a5a30', '#3a2210', 7);
    // the scales: a turned brass pillar, the beam level, a keg in the left pan, coins in the right
    const sx = 84;
    const scales = shadow(u, sx, 124, 22, .55, 3) + `<g filter="url(#drop${u})"><ellipse cx="${sx}" cy="122" rx="16" ry="4" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".5"/><path d="M${sx - 2} 120V62h4v58z" fill="url(#brassH${u})"/><circle cx="${sx}" cy="60" r="3.4" fill="url(#brassR${u})"/>`
      + `<path d="M${sx - 38} 62h76" stroke="url(#brass${u})" stroke-width="2.6" stroke-linecap="round"/>` + [-38, 38].map(d => `<circle cx="${sx + d}" cy="62" r="1.6" fill="url(#brassR${u})"/><path d="M${sx + d} 62L${sx + d - 12} 92M${sx + d} 62L${sx + d + 12} 92" stroke="#8a6a20" stroke-width=".5"/><path d="M${sx + d - 14} 92q14 7 28 0z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/>`).join('')
      + `</g>`;
    const keg = `<g transform="translate(${sx - 38} 92)" filter="url(#drop${u})"><path d="M-9 0q-3 -9 0 -18h18q3 9 0 18z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".5"/><path d="M-10 -4h20M-10 -14h20" stroke="url(#iron${u})" stroke-width="1.3"/><path d="M-3 -9l3 -3l3 3l-3 3z" fill="none" stroke="#3a1a0a" stroke-width=".7"/><ellipse cy="-18" rx="9" ry="2.2" fill="#6a4424"/></g>`;
    const coinsP = coinStack(u, sx + 34, 92, 6, 5) + coinStack(u, sx + 42, 92, 4, 5);
    // the ledger, columns of strokes; coins, the seal, a pen, the sand shaker, the key of the safe
    const ledger = `<g transform="translate(150 116)" filter="url(#drop${u})"><path d="M-30 6l2 -14l28 -2l28 2l2 14l-30 2z" fill="#f2e8cc" stroke="#7a6a50" stroke-width=".4"/><path d="M0 -10v18" stroke="#b8a888" stroke-width=".6"/>${[-24, -14, 4, 14].map(x => `<g transform="translate(${x} -6)">${lines(0, 0, 4, 8, 2.6)}</g>`).join('')}</g>`
      + coinStack(u, 112, 124, 5) + coinStack(u, 186, 128, 3) + `<g transform="translate(124 130)" filter="url(#drop${u})"><circle r="4" fill="url(#brassR${u})"/><circle r="2.4" fill="none" stroke="#5a4010" stroke-width=".5"/></g>`
      + inkwell(u, 176, 116) + quill(u, 176, 108, -20, .8) + `<g transform="translate(108 112)" filter="url(#drop${u})"><path d="M-3 0v-9h6v9z" fill="url(#oakH${u})"/><ellipse cy="-9" rx="3" ry="1" fill="url(#brass${u})"/></g>`
      + `<g transform="translate(140 132) rotate(-20)" filter="url(#drop${u})"><circle r="2.4" fill="none" stroke="url(#iron${u})" stroke-width="1.2"/><path d="M2.4 0h10v2M10 0v3" stroke="url(#iron${u})" stroke-width="1.2" fill="none"/></g>`;
    const light = shafts(u, 0, 30, [[90, 130, 140, 130]], '#fff4cc', .14) + glow(u, 84, 70, 60, 40, '#fff4cc', .2) + gloom(u, 40, 60, 200, 140, .3) + gloom(u, 100, 140, 100, 280, .45);
    return [wall + win + map + table, scales + keg + coinsP + ledger + light];
  },

  // Blockade: the harbour mouth closed by a boom chain on barrel floats, from the windlass under the watch tower
  // across to the far side; a small boat with planks and a keg lies nose to the chain: no way in for repairs.
  'Блокада': u => {
    const hz = 72;
    const back = day(u, hz, 150, 52, 17) + K.isles(hz, '#7e9aa0', .5);
    const ships = sailing('endeavour', 150, 76, .62, 0, u) + sailing('endeavour', 110, 82, .95, 0, u);
    // the rock with the stone tower: guns on top, the flag to the left, surf at the foot, the windlass
    const tower = `<path d="M0 132q4 -40 14 -60q16 -8 40 -4q10 30 8 64z" fill="#5a6058" stroke="#2a2e2a" stroke-width=".6"/><path d="M54 68q10 30 8 64" stroke="#e8e0c8" stroke-width=".8" fill="none" opacity=".6"/>`
      + `<rect x="16" y="60" width="36" height="44" fill="#a8a090" stroke="#4a463e" stroke-width=".6"/>` + Array.from({ length: 6 }, (_, k) => `<path d="M16 ${66 + k * 7}h36" stroke="#6a6458" stroke-width=".5"/>` + [0, 1, 2].map(i => `<path d="M${16 + i * 12 + (k % 2) * 6} ${66 + k * 7}v7" stroke="#6a6458" stroke-width=".5"/>`).join('')).join('')
      + `<path d="M14 60h40v-6h-40z" fill="#b8b0a0" stroke="#4a463e" stroke-width=".5"/>` + [16, 26, 36, 46].map(x => `<rect x="${x}" y="48" width="6" height="6" fill="#b8b0a0" stroke="#4a463e" stroke-width=".4"/>`).join('')
      + `<path d="M28 54l-8 0" stroke="#2a2a2a" stroke-width="2.4"/><path d="M44 54l8 0" stroke="#2a2a2a" stroke-width="2.4"/><rect x="30" y="72" width="6" height="9" fill="#2a2a30"/>`
      + `<path d="M48 48V30" stroke="#5a3a1c" stroke-width="1"/><path d="M48 31q6 -2 12 1t8 1v8q-6 1 -10 -1t-10 -1z" fill="#f4ece0"/><path d="M48 35q8 0 20 2M48 39q8 0 20 2" stroke="#b8302a" stroke-width="1.6"/><circle cx="58" cy="37" r="1.6" fill="none" stroke="#c9a048" stroke-width=".7"/>`
      + `<path d="M50 112h14v6h-14z" fill="url(#oak${u})"/><path d="M57 106v18M51 115h12" stroke="url(#oakH${u})" stroke-width="2"/>` + spray(0, 126, 60, 8, 20, 3) + `<path d="M0 130q20 -4 40 0t30 0" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".8"/>`;
    // the boom: a chain sagging between barrel floats, up to the windlass, down into the water at the right edge
    const pts = [[60, 114], [86, 120], [116, 118], [146, 121], [176, 118], [200, 124]];
    const chainSeg = (a, b) => { const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3.6); let o = ''; for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 3; o += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 2 ? 2.2 : 1}" ry="${i % 2 ? 1.2 : 1.4}" fill="none" stroke="url(#iron${u})" stroke-width=".9"/>`; } return o; };
    const boom = pts.slice(0, -1).map((p, i) => chainSeg(p, pts[i + 1])).join('') + pts.slice(1, 5).map(([x, y]) => `<g filter="url(#drop${u})"><ellipse cx="${x}" cy="${y}" rx="7" ry="4.6" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".5"/><path d="M${x - 3} ${y - 4.4}v8.8M${x + 3} ${y - 4.4}v8.8" stroke="url(#iron${u})" stroke-width=".9"/></g><path d="M${x - 9} ${y + 3}q9 2 18 0" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".8"/>`).join('');
    const boat = `<g transform="translate(118 136) scale(1.1)">${put('longboat', 0, 0, 1, 0, u)}</g><g transform="translate(112 130)"><rect x="-10" y="-3" width="20" height="2.4" fill="#e8c088" stroke="#7a5020" stroke-width=".3"/><rect x="-8" y="-5.4" width="18" height="2.4" fill="#d8b078" stroke="#7a5020" stroke-width=".3"/></g><g transform="translate(126 130)"><path d="M-3 0v-6h6v6z" fill="url(#oakH${u})"/></g>`;
    const light = gloom(u, 100, 140, 100, 280, .4, '#06202a');
    return [back + ships, tower + boom + boat + light];
  },

  // A good bargain: on the cabin table three sheets of the agreement fan out, the top one signed with a dark red
  // flourish; the pen stands in red ink, one neat drop on its tip; a tall candle; the stern window cold behind.
  'Выгодная сделка': u => {
    const wall = woodTex(u, 0, 0, W, 44, '#5a3a20', '#2a180c', '#0e0804', 13, true, 2) + `<rect x="48" y="4" width="104" height="34" rx="2" fill="#2a180a"/><rect x="52" y="7" width="96" height="28" fill="#1a3a5a"/>`
      + `<clipPath id="pws${u}"><rect x="52" y="7" width="96" height="28"/></clipPath><g clip-path="url(#pws${u})">${sky(u, 7, 18, [[0, '#2a4a74'], [1, '#6a8aac']])}${moon(u, 128, 15, 3.4)}${sea(u, 25, 35, '#3a5a7a', '#1e3a5a', '#0e2034', '#a8c4e0', '#e8f0ff', 128, 4)}</g>`
      + `<path d="M76 7v28M100 7v28M124 7v28M52 21h96" stroke="#2a180a" stroke-width="1.6"/>`;
    const table = tableTop(u, 44, H - 44, '#6a4424', '#2a1608', 11);
    const sheet = (x, y, a, top) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(1 .78)" filter="url(#drop${u})"><path d="M-32 -40h64v80h-64z" fill="${top ? '#f6efdc' : '#ece2c8'}" stroke="#a89878" stroke-width=".4"/>${lines(-26, -32, 18, 52, 3)}`
      + (top ? `<path d="M-14 26q6 -10 12 -2t10 -6q4 -4 8 2q-6 8 -14 6" stroke="#7a1010" stroke-width="1.4" fill="none"/>` + seal(22, 32, 4) : '') + `</g>`;
    const sheets = sheet(70, 86, -14) + sheet(130, 88, 12) + sheet(100, 82, -2, true);
    const candle = put('candleTall', 30, 92, 1.4, 0, u);
    const pen = inkwell(u, 160, 108, true) + `<g transform="translate(158 100) rotate(18)" filter="url(#drop${u})"><path d="M0 0L0 -40" stroke="#e8e0d0" stroke-width=".8"/><path d="M0 -40q-6 12 -5 30q2 -5 5 -5q3 -10 0 -25z" fill="#f4ecdc" stroke="#b8a888" stroke-width=".3"/></g><path d="M158 101q.8 1.6 0 2.4q-.8 -.8 0 -2.4z" fill="#a81010"/>`;
    const bits = `<g transform="translate(60 150)" filter="url(#drop${u})"><path d="M-18 -8h36v16h-36z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".5"/>${[-10, 0, 10].map(x => `<circle cx="${x}" cy="-9" r="3.4" fill="url(#brassR${u})"/>`).join('')}</g>`
      + `<rect x="100" y="146" width="20" height="4" rx="1" fill="#a81a14"/><path d="M130 150q10 -6 20 0t20 0" stroke="#2a4a8a" stroke-width="2" fill="none"/>` + coinStack(u, 160, 166, 2);
    const light = glow(u, 30, 64, 70, 60, '#ffb050', .4) + glow(u, 100, 20, 60, 20, '#a8c4e0', .2) + gloom(u, 30, 70, 200, 140, .35) + gloom(u, 100, 140, 100, 280, .5);
    return [wall + table, sheets + candle + pen + bits + light];
  },

  // Letter of marque: in the recruiter's office the patent lies on the green cloth with its ribbon and red seal, a
  // reading glass over the small print at its foot; the Company's flag hangs still on its pole; the lamp lights it all.
  'Каперский патент': u => {
    const wall = grad('pkw' + u, [[0, '#4a3a2a'], [1, '#2a1e14']], 1, 0) + `<rect width="200" height="96" fill="url(#pkw${u})"/>` + woodTex(u, 0, 60, W, 36, '#5a3a20', '#2a180c', '#0e0804', 14, true, 4);
    // the flag hanging in folds from its pole in a floor stand: red and white stripes, a blue canton with a cross
    const fg = uid('pkf' + u);
    const flag = `<path d="M62 96V22" stroke="url(#oakH${u})" stroke-width="2.6"/><circle cx="62" cy="21" r="2.2" fill="url(#brassR${u})"/>`
      + `<clipPath id="${fg}"><path d="M64 26q14 2 26 0q-2 30 2 58q-14 4 -26 0q-4 -30 -2 -58z"/></clipPath><g clip-path="url(#${fg})"><rect x="60" y="24" width="36" height="64" fill="#f4ece0"/>${[0, 1, 2, 3, 4, 5, 6].map(k => `<rect x="60" y="${26 + k * 9}" width="36" height="4.4" fill="#b8302a"/>`).join('')}<circle cx="78" cy="50" r="7" fill="#f4ece0" stroke="#c9a048" stroke-width="1.6"/>`
      + [70, 78, 86].map(x => `<path d="M${x} 24q2 30 0 64" stroke="#000" stroke-width="3" opacity=".18" fill="none"/>`).join('') + `</g>`;
    const table = `<path d="M0 96h200V${H}H0z" fill="#1e4a2e"/>` + Array.from({ length: 50 }, (_, k) => { const r = R(k + 5); return `<circle cx="${f1(r() * 200)}" cy="${f1(98 + r() * 180)}" r=".3" fill="#5a9a6a" opacity=".4"/>`; }).join('')
      + `<path d="M0 96h200" stroke="#5a3a1c" stroke-width="2.4"/>` + gloom(u, 100, 100, 100, 200, .5, '#04140a');
    const lamp = `<g transform="translate(156 112)" filter="url(#drop${u})"><ellipse cy="0" rx="12" ry="3" fill="url(#brassR${u})"/><path d="M-3 -2v-14h6v14z" fill="url(#brassH${u})"/><path d="M-10 -16q10 -8 20 0q0 10 -10 12q-10 -2 -10 -12z" fill="#ffe8b0" stroke="#8a6a20" stroke-width=".5"/><path d="M-12 -18h24l-4 -10h-16z" fill="#2a5a3a" stroke="#0a2010" stroke-width=".5"/></g>` + glow(u, 156, 100, 50, 40, '#ffc870', .6);
    // the patent: ribbon, red seal, lines of strokes, the band of small print at the foot, the glass lying over it
    const pat = `<g transform="translate(100 112) rotate(-4)" filter="url(#drop${u})"><path d="M-46 -26h92v48h-92z" fill="#f4ecd4" stroke="#a89878" stroke-width=".5"/><path d="M-40 -20q40 -4 80 0" stroke="#5a3a20" stroke-width="1.6" fill="none"/>${lines(-38, -12, 7, 70, 2.6)}`
      + `<path d="M-40 14h80" stroke="#7a6a50" stroke-width="2.4" stroke-dasharray=".6 .5" opacity=".6"/><path d="M28 18l6 14M32 18l-2 14" stroke="#b8302a" stroke-width="2"/>${seal(30, 16, 5)}</g>`
      + `<g transform="translate(86 126) rotate(-30)" filter="url(#drop${u})"><circle r="9" fill="#d8f0f0" opacity=".25" stroke="url(#brass${u})" stroke-width="1.8"/><path d="M-5 -5q4 -3 8 -1" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".8"/><rect x="8" y="-1.4" width="14" height="2.8" rx="1.2" fill="url(#oakH${u})"/></g>`;
    const purse = `<g transform="translate(36 120)" filter="url(#drop${u})"><path d="M-10 4q-2 -12 6 -14l-2 -4h12l-2 4q8 2 6 14q-10 4 -20 0z" fill="url(#leather${u})" stroke="#1a0e06" stroke-width=".5"/><path d="M-4 -10q4 2 8 0" stroke="#c9a048" stroke-width=".8" fill="none"/></g>` + put('coins', 52, 128, .5, 0, u)
      + quill(u, 160, 128, -30, .9) + `<g transform="translate(176 136)" filter="url(#drop${u})"><path d="M-4 0h8v-3h-8z" fill="url(#brass${u})"/><path d="M-1.6 -3v-8h3.2v8z" fill="url(#oakH${u})"/></g>` + `<g transform="translate(24 96) scale(.5)">${img('hourglass', 0, -20, .9, 0, u)}</g>`;
    const fringe = `<path d="M0 252h200" stroke="#c9a048" stroke-width="1.4"/>` + Array.from({ length: 50 }, (_, k) => `<path d="M${k * 4 + 1} 253v5" stroke="#c9a048" stroke-width=".6"/>`).join('');
    const light = glow(u, 120, 112, 90, 40, '#ffc870', .25) + gloom(u, 156, 100, 0, 30, .5) + gloom(u, 100, 140, 100, 280, .45);
    return [wall + flag + table + fringe, pat + purse + lamp + light];
  },

  // Nothing personal: through the tall cabin window the battle far off — the Company ship fires along the black ship's
  // side, holes under her rail, her hull burning; on the sill a cup of tea with its steam and an open book.
  'Ничего личного': u => {
    const wall = woodTex(u, 0, 0, W, H, '#5a3a22', '#2a180c', '#0e0804', 15, true, 8);
    const view = day(u, 70, 170, 24, 21) + sailing('endeavour', 76, 62, .7, 0, u) + sailing('pearl', 128, 72, .9, 0, u, true)
      + muzzle(u, 92, 70, 0, .5) + muzzle(u, 84, 70, 0, .4) + smoke(u, 96, 60, .35, 4, 1, 3, '#e8e2d8', 10) + flame(u, 120, 72, .4, 3) + flame(u, 132, 71, .3, 5) + smoke(u, 126, 62, .5, 5, 1, 9, '#3a3430', 22)
      + [116, 124, 138].map(x => `<circle cx="${x}" cy="75" r="1" fill="#0a0604"/>`).join('');
    const win = `<rect x="38" y="22" width="124" height="96" rx="3" fill="#2a180a" stroke="#120804"/><clipPath id="pnl${u}"><rect x="44" y="28" width="112" height="84"/></clipPath><g clip-path="url(#pnl${u})">${view}</g>`
      + `<path d="M44 40h112M82 28v12M118 28v12" stroke="#2a180a" stroke-width="2.4"/><rect x="44" y="28" width="112" height="84" fill="none" stroke="#c9a048" stroke-width=".7" opacity=".6"/>`
      + [[60, 92], [146, 96], [52, 104], [150, 58]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.3" fill="#e8f8ff" opacity=".7"/>`).join('');
    const sill = `<path d="M30 118h140v8h-140z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/><path d="M30 118h140" stroke="#f0d0a0" stroke-width=".8"/><path d="M30 126h140" stroke="#0a0604" stroke-width="1.6"/>`;
    const cup = `<g transform="translate(58 112) scale(1.3)">${put('teacup', 0, 0, 1, 0, u)}</g><path d="M64 104l8 -6" stroke="url(#silver${u})" stroke-width="1"/>` + smoke(u, 56, 98, .25, 5, .6, 4, '#f4f4f0', 22);
    const book = `<g transform="translate(120 116)" filter="url(#drop${u})"><path d="M-30 2l2 -10l28 -2l28 2l2 10l-30 2z" fill="#f2e8cc" stroke="#7a6a50" stroke-width=".4"/><path d="M0 -10v12" stroke="#b8a888" stroke-width=".6"/><g transform="translate(-24 -6)">${lines(0, 0, 3, 20, 2.4)}</g><g transform="translate(4 -6)">${lines(0, 0, 3, 20, 2.4)}</g></g>` + quill(u, 128, 114, 70, .8);
    const light = glow(u, 100, 70, 80, 60, '#fff4cc', .2) + gloom(u, 100, 140, 100, 280, .5);
    return [wall + win + sill, cup + book + light];
  },

  // Bribery: in a dark corner of the hold, in the one shaft of light from the grating, a hand in a lace cuff lowers a
  // purse by its string, a boatswain's rough tattooed hand reaches for it from the other side; a coin has rolled out.
  'Подкуп': u => {
    const back = `<rect width="200" height="${H}" fill="#140c06"/>` + woodTex(u, 0, 0, W, 130, '#2a1a0e', '#140c06', '#060402', 11, true, 9) + gloom(u, 100, 60, 100, 0, .5, '#020100');
    const barrels = [[18, 70, 1.3], [178, 74, 1.2], [40, 40, .9], [160, 36, .9]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})" opacity=".6"><path d="M-14 20q-4 -20 0 -40h28q4 20 0 40z" fill="url(#oakH${u})" stroke="#060402" stroke-width=".6"/><path d="M-15 -10h30M-15 10h30" stroke="url(#iron${u})" stroke-width="2"/></g>`).join('');
    const hatch = `<rect x="70" y="8" width="60" height="30" fill="#3a2a1a"/>` + [0, 1, 2, 3].map(k => `<rect x="${73 + k * 14}" y="11" width="10" height="24" fill="#d8e8f0"/>`).join('') + `<path d="M70 23h60" stroke="#3a2a1a" stroke-width="2"/>`
      + shafts(u, 100, 30, [[56, 130, 146, 130]], '#fff4d8', .22);
    // the barrel head the deal is struck on
    const head = `<ellipse cx="100" cy="122" rx="62" ry="12" fill="#5a3a20" stroke="#140a04" stroke-width=".8"/><ellipse cx="100" cy="122" rx="56" ry="9.6" fill="#7a5030"/>` + [-30, -10, 10, 30].map(d => `<path d="M${100 + d} 113v18" stroke="#3a2210" stroke-width=".6"/>`).join('')
      + `<path d="M38 124v60q62 20 124 0v-60" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M38 140q62 14 124 0M38 170q62 14 124 0" stroke="url(#iron${u})" stroke-width="2.6" fill="none"/>`
      + ball(u, 0, 0, 0).slice(0, 0) + `<g transform="translate(120 122)"><ellipse rx="4" ry="2" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".4"/></g>`
      + `<g transform="translate(150 120) rotate(80)" filter="url(#drop${u})"><path d="M-6 -7l1.4 14h9.2l1.4 -14z" fill="url(#ironH${u})" stroke="#2a3034" stroke-width=".4"/></g><path d="M146 126q10 0 14 4q-8 4 -14 0z" fill="#3a1a08" opacity=".8"/>`;
    // the purse on its string from the lace-cuffed hand; the boatswain's hand reaching from the right
    const purse = `<path d="M74 66L84 96" stroke="#c9a048" stroke-width=".8"/><g transform="translate(86 104)" filter="url(#drop${u})"><path d="M-10 6q-3 -12 6 -14l-1 -4h10l-1 4q9 2 6 14q-10 5 -20 0z" fill="url(#leather${u})" stroke="#1a0e06" stroke-width=".5"/><path d="M-4 -8q4 2 8 0" stroke="#c9a048" stroke-width="1" fill="none"/><path d="M-6 0q6 3 12 0" stroke="#e8c49a" stroke-width=".6" fill="none" opacity=".4"/></g>`;
    const left = arm(u, -14, 50, 66, 62, { w0: 22, w1: 14, cloth: '#2a2a5a', light: '#5a5a9a', dark: '#0a0a20', cuff: 'lace', pose: 'pinch', side: 1, s: 1.8, twist: 30 })
      + `<g transform="translate(66 62) rotate(39) scale(1.8)"><rect x="14" y="2.6" width="1.6" height="3" rx=".5" fill="url(#brass${u})"/><circle cx="14.8" cy="2.4" r=".9" fill="#1a3a7a"/></g>`;
    const tat = (x, y, a) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a + 90)}) scale(.55)" opacity=".75"><path d="M0 -6v12M-4 -3h8M-6 2q6 8 12 0" stroke="#24384a" stroke-width="1.4" fill="none"/><circle cy="-7.4" r="1.6" fill="none" stroke="#24384a" stroke-width="1"/></g>`;
    const right = arm(u, 216, 100, 124, 98, { w0: 26, w1: 15, cloth: '#5a4a3a', light: '#8a7a68', dark: '#1e1810', bare: .55, hair: true, pose: 'open', side: -1, s: 1.8, tattoo: tat, skin: '#a86a44' });
    const light = glow(u, 100, 96, 50, 34, '#fff4d8', .3) + gloom(u, 100, 140, 100, 280, .5, '#020100');
    return [back + barrels + hatch, head + purse + left + right + light];
  },

  // Lord Beckett's order: the order pinned to the mast with a dirk, its corner lifting in the wind; the Company flag
  // above; a file of redcoats going off to the right, the sergeant half turned to read it.
  'Приказ лорда Беккета': u => {
    const hz = 96;
    const back = day(u, hz, 34, 58, 25);
    const rail = `<path d="M0 100h200v18h-200z" fill="#6a4a2c"/>` + woodTex(u, 0, 100, W, 18, '#7a5434', '#3a2412', '#140a04', 4, false, 3) + `<path d="M0 100h200" stroke="#fff0c8" stroke-width="1"/><path d="M0 97h200v3h-200z" fill="#8a6440"/>`
      + woodTex(u, 0, 118, W, H - 118, '#a87c4c', '#5a3c1e', '#2a1a0a', 9, false, 6) + `<path d="M0 118h200" stroke="#2a1a0a" stroke-width="1.2"/>`;
    const mast = `<rect x="58" y="-4" width="22" height="130" fill="url(#oakH${u})" stroke="#2a1608" stroke-width=".6"/><path d="M63 -4v130" stroke="#f0d0a0" stroke-width=".7" opacity=".6"/>` + [12, 106].map(y => `<rect x="57" y="${y}" width="24" height="4" fill="url(#iron${u})"/>`).join('');
    const flag = `<path d="M80 16h4M80 40h4" stroke="#c8b898" stroke-width=".6"/><path d="M84 16v24" stroke="#c8b898" stroke-width=".5"/><g filter="url(#drop${u})"><path d="M84 17q16 -4 32 1t32 0v22q-16 5 -32 0t-32 -1z" fill="#f4ece0"/>${[0, 1, 2, 3].map(k => `<path d="M84 ${19 + k * 5.4}q16 -4 32 1t32 0" stroke="#b8302a" stroke-width="2.6" fill="none"/>`).join('')}<circle cx="116" cy="28" r="6" fill="#f4ece0" stroke="#c9a048" stroke-width="1.4"/></g>`;
    // the order: wider than the mast, its edges bending round it, held by a dirk, the lower corner flapping
    const order = `<g filter="url(#drop${u})"><path d="M48 50q21 -4 42 0l2 40q-8 2 -14 6l4 -6q-16 2 -34 0z" fill="#f4ecd4" stroke="#a89878" stroke-width=".5"/><path d="M48 50q-2 20 0 40" stroke="#c8b898" stroke-width="1.6" fill="none"/>`
      + `<path d="M78 96q8 -2 14 -6q2 4 8 4q-8 4 -22 2z" fill="#e8dcc0" stroke="#a89878" stroke-width=".4"/><g transform="translate(54 58)">${lines(0, 0, 9, 30, 2.8)}</g><path d="M72 86l2 10M76 86l-1 10" stroke="#b8302a" stroke-width="1.6"/>${seal(74, 85, 3.6)}</g>`
      + `<g transform="translate(69 52) rotate(-20)" filter="url(#drop${u})"><path d="M0 4v-6" stroke="url(#silver${u})" stroke-width="1.6"/><path d="M-4 -2h8" stroke="url(#brass${u})" stroke-width="1.6"/><rect x="-1.4" y="-12" width="2.8" height="10" rx="1" fill="#3a2010"/><circle cy="-13" r="1.8" fill="url(#brassR${u})"/></g>`;
    // the file of soldiers going off to the right and into the picture; the sergeant in front, half turned
    const file = [[188, 104, 14], [176, 106, 18], [162, 109, 24], [146, 113, 32], [126, 118, 44]].map(([x, y, h]) => redcoat(u, x, y, h, { face: 'away' })).join('')
      + redcoat(u, 108, 126, 58, { drum: true, face: 'away' }) + redcoat(u, 92, 134, 50, { face: 'away', hat: 'tricorn', red: '#9a2420' });
    const shadows = [[110, 127, 18], [94, 135, 14], [128, 119, 12]].map(([x, y, r]) => `<ellipse cx="${x + 10}" cy="${y}" rx="${r}" ry="2.4" fill="#1a0e06" opacity=".35"/>`).join('');
    const light = glow(u, 34, 58, 60, 60, '#fff4cc', .3) + gloom(u, 100, 140, 100, 280, .45, '#1a0e06');
    return [back + rail, mast + flag + shadows + file + order + light];
  },

  // The deal with Xiao Feng: red paper lanterns under dark beams, lattice windows; on the low table a silk chart with
  // ship figures, the enemy's pierced by a curved dagger; pearls spilt from a pouch, tea; a hand with an open fan.
  'Сделка с Сяо Фэном': u => {
    const back = `<rect width="200" height="${H}" fill="#2a1410"/>` + [[20, 30, 50, 66], [80, 26, 40, 60], [132, 30, 50, 66]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e8d8b0" opacity=".85"/>` + Array.from({ length: Math.floor(w / 8) }, (_, k) => `<path d="M${x + 8 + k * 8} ${y}v${h}" stroke="#3a1a10" stroke-width="1.2"/>`).join('') + Array.from({ length: Math.floor(h / 8) }, (_, k) => `<path d="M${x} ${y + 8 + k * 8}h${w}" stroke="#3a1a10" stroke-width="1.2"/>`).join('') + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#1a0a06" stroke-width="2.4"/>`).join('')
      + beam(u, 0, 0, W, 10) + beam(u, 0, 20, W, 6) + glow(u, 100, 60, 100, 50, '#ffb070', .2);
    const lamp = (x, len, s) => `<path d="M${x} 26V${26 + len}" stroke="#2a1a10" stroke-width=".6"/><g transform="translate(${x} ${26 + len + 12 * s}) scale(${s})" filter="url(#drop${u})"><ellipse rx="10" ry="12" fill="#c81a14" stroke="#5a0806" stroke-width=".6"/>${[-6, -2, 2, 6].map(d => `<path d="M${d} -11.6q${d * .6} 11.6 0 23.2" stroke="#7a0a06" stroke-width=".6" fill="none"/>`).join('')}<rect x="-5" y="-14" width="10" height="3" fill="#2a1a10"/><rect x="-5" y="11" width="10" height="3" fill="#2a1a10"/><path d="M0 14v8M-1.4 14v7M1.4 14v7" stroke="#e8b040" stroke-width=".8"/></g>` + glow(u, x, 26 + len + 12 * s, 22 * s, 24 * s, '#ff8a4a', .6);
    const lamps = lamp(62, 6, 1.1) + lamp(100, 18, 1.25) + lamp(140, 4, 1);
    const floor = `<rect y="112" width="200" height="${H - 112}" fill="#8a7a50"/>` + Array.from({ length: 10 }, (_, k) => `<path d="M0 ${118 + k * 16}h200" stroke="#5a4a2a" stroke-width="1"/>`).join('') + Array.from({ length: 60 }, (_, k) => `<path d="M${(k % 20) * 10} ${112 + Math.floor(k / 20) * 50}v50" stroke="#6a5a38" stroke-width=".4"/>`).join('');
    // the low table, the chart on silk with islands, the ship figures, the curved dagger through the enemy's
    const table = `<path d="M24 100h152l14 34h-180z" fill="#3a1410" stroke="#140604" stroke-width=".6"/><path d="M10 134h180v6h-180z" fill="#2a0e0a"/><path d="M24 100h152" stroke="#e88a6a" stroke-width=".7" opacity=".6"/>`;
    const chart = `<path d="M44 104h96l8 24h-112z" fill="#e8d8b8" stroke="#9a8a6a" stroke-width=".4"/><path d="M56 112q10 -4 18 0q4 6 -6 7q-10 0 -12 -7zM104 118q12 -6 22 0q2 6 -10 6q-10 0 -12 -6z" fill="#c8b088" stroke="#8a7a5a" stroke-width=".4"/>`
      + [[70, 112], [116, 118], [92, 122]].map(([x, y], k) => `<g transform="translate(${x} ${y})" filter="url(#drop${u})"><path d="M-4 0h8l-1 2h-6z" fill="${k === 1 ? '#1a1a1a' : '#8a5a2a'}"/><path d="M0 0v-7" stroke="#3a2a1a" stroke-width=".5"/><path d="M0 -7l3 3l-3 2z" fill="#f4ece0"/></g>`).join('')
      + `<path d="M116 111l3 2l-2 1z" fill="#f4ece0" opacity=".6"/><g transform="translate(118 116) rotate(-60)" filter="url(#drop${u})"><path d="M0 0q4 -10 2 -20" stroke="url(#silver${u})" stroke-width="2" fill="none"/><path d="M-4 1h8" stroke="url(#brass${u})" stroke-width="1.6"/><rect x="-1.2" y="1" width="2.4" height="8" rx="1" fill="#5a1a10"/></g>`;
    const pearls = `<g transform="translate(150 112)" filter="url(#drop${u})"><path d="M-6 4q-2 -8 4 -10l-1 -3h6l-1 3q6 2 4 10q-6 3 -12 0z" fill="#3a5a8a" stroke="#14203a" stroke-width=".4"/></g>` + Array.from({ length: 12 }, (_, k) => { const r = R(k + 3); return `<circle cx="${f1(140 + r() * 26)}" cy="${f1(116 + r() * 10)}" r="1.3" fill="#f8f4ee"/><circle cx="${f1(139.6 + r() * 0)}" cy="0" r="0"/>`; }).join('');
    const tea = `<g transform="translate(36 112)" filter="url(#drop${u})"><ellipse cx="0" cy="0" rx="9" ry="7" fill="#e8e0d0" stroke="#7a7060" stroke-width=".4"/><path d="M8 -2q6 -4 8 -8" stroke="#e8e0d0" stroke-width="2"/><path d="M-4 -7h8l-1 -2h-6z" fill="#e8e0d0"/><path d="M-6 0q6 3 12 0" stroke="#3a6a8a" stroke-width=".6" fill="none"/></g>` + [[54, 118], [168, 126]].map(([x, y]) => `<path d="M${x - 4} ${y}h8l-1 4h-6z" fill="#efe8d8" stroke="#7a7060" stroke-width=".4"/>`).join('');
    const fan = arm(u, 214, 104, 178, 96, { w0: 18, w1: 13, cloth: '#7a1a14', light: '#c8402a', dark: '#2a0806', cuff: '#e8b040', pose: 'pinch', side: -1, s: 1.4, twist: -10 })
      + `<g transform="translate(164 94)" filter="url(#drop${u})">${Array.from({ length: 13 }, (_, k) => { const a = (-160 + k * 10) * Math.PI / 180; return `<path d="M0 0L${f1(Math.cos(a) * 26)} ${f1(Math.sin(a) * 26)}" stroke="#3a1a10" stroke-width=".5"/>`; }).join('')}<path d="M${f1(Math.cos(-160 * Math.PI / 180) * 26)} ${f1(Math.sin(-160 * Math.PI / 180) * 26)}A26 26 0 0 1 ${f1(Math.cos(-40 * Math.PI / 180) * 26)} ${f1(Math.sin(-40 * Math.PI / 180) * 26)}L0 0z" fill="#c8302a" opacity=".9" stroke="#5a0a06" stroke-width=".5"/><path d="M-20 -8q8 -10 20 -14q10 2 14 8" stroke="#e8b040" stroke-width=".8" fill="none"/></g>`;
    const steam = smoke(u, 10, 150, .7, 6, .6, 9, '#e8e8e0', 10);
    const light = glow(u, 100, 56, 90, 50, '#ff9a5a', .2) + gloom(u, 100, 140, 100, 280, .5, '#140604');
    return [back + floor + lamps, table + chart + pearls + tea + fan + steam + light];
  },

  // Line of battle: the flagship leads the column to the left, a hoist of signal flags from the bow to the main top;
  // the line of ships runs back up to the right to the horizon, each smaller and paler, the same course.
  'Строй линии': u => {
    const hz = 80;
    const back = day(u, hz, 120, 30, 29);
    const column = [[178, 78, .34, .55], [160, 83, .48, .68], [138, 90, .7, .84]].map(([x, y, s, o], k) => `<g opacity="${o}"><g transform="translate(${x} 0) scale(${[1, .92, .86][k]} 1) translate(${-x} 0)">${sailing('endeavour', x, y, s, 0, u)}</g></g>`).join('');
    const flag = sailing('endeavour', 76, 100, 2.0, 0, u);
    // the signal hoist: a line of coloured flags from the bow up to the main top, flying ahead (to the left)
    const cols = ['#b8302a', '#f4ece0', '#1e3a7a', '#e8b040', '#b8302a', '#2a6a3a', '#f4ece0', '#1e3a7a'];
    const hoist = `<path d="M24 110Q50 70 82 52" stroke="#3a2a1a" stroke-width=".5" fill="none"/>` + cols.map((c, k) => { const t = (k + .5) / 8, x = 24 + t * 58 - Math.sin(t * Math.PI) * 4, y = 110 - t * 58 + Math.sin(t * Math.PI) * 4;
      return `<path d="M${f1(x)} ${f1(y)}l-7 1.6l1 2.4l-1 2.4l7 -1.6z" fill="${c}" stroke="#2a2a2a" stroke-width=".3"/>`; }).join('');
    const wake = `<path d="M150 126q20 4 50 12M146 128q20 10 54 24" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".7"/>` + gulls([[120, 50, 1.2], [132, 44, .9], [146, 54, 1]]);
    const light = glow(u, 120, 30, 60, 40, '#fff4cc', .3) + gloom(u, 100, 140, 100, 280, .4, '#06202a');
    return [back + column, flag + hoist + wake + light];
  },

  // The edict of executions: a grey day; the gallows on the fort wall, empty nooses, ravens on the beam; the edict
  // nailed to a post at the wall's foot, a drummer beating his drum; the crowd's heads and hats below.
  'Указ о казнях': u => {
    const back = sky(u, 0, 140, [[0, '#6a7a84'], [.6, '#a8b4b8'], [1, '#c8ccc8']]) + K.cloudBand(u, 0, 80, '#d8dcd8', '#5a6a72', 71, 2.3);
    const wall = `<path d="M0 84h200v50h-200z" fill="#8a8a82"/>` + Array.from({ length: 6 }, (_, k) => `<path d="M0 ${90 + k * 8}h200" stroke="#5a5a54" stroke-width=".6"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M${i * 18 + (k % 2) * 9} ${90 + k * 8}v8" stroke="#5a5a54" stroke-width=".6"/>`).join('')).join('')
      + [0, 1, 2, 3, 4, 5].map(k => `<rect x="${-4 + k * 40}" y="74" width="20" height="12" fill="#8a8a82" stroke="#5a5a54" stroke-width=".6"/>`).join('') + `<path d="M0 84h200" stroke="#3a3a36" stroke-width="1"/>`;
    const flagS = `<path d="M136 74V44" stroke="#4a3a2a" stroke-width="1.2"/><g filter="url(#drop${u})"><path d="M136 46q-10 -2 -18 1t-12 2v14q6 0 12 -2t18 -1z" fill="#f4ece0"/>${[0, 1, 2, 3].map(k => `<path d="M136 ${49 + k * 3.6}q-10 -2 -18 1t-12 2" stroke="#b8302a" stroke-width="1.6" fill="none"/>`).join('')}<circle cx="121" cy="53" r="3.4" fill="#f4ece0" stroke="#c9a048" stroke-width="1"/></g>`;
    // the gallows: rough logs, posts on the platform, the beam, nooses of different length, ravens
    const log = (x1, y1, x2, y2, w) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#3a2a1a" stroke-width="${w + 1}"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#7a5a3a" stroke-width="${w}"/><path d="M${x1 - .8} ${y1}L${x2 - .8} ${y2}" stroke="#a8885a" stroke-width=".6"/>`;
    const gallows = `<rect x="44" y="70" width="112" height="5" fill="#5a4a3a"/>` + log(56, 72, 56, 48, 4) + log(144, 72, 144, 48, 4) + `<path d="M48 48h104" stroke="#3a2a1a" stroke-width="6"/><path d="M48 48h104" stroke="#7a5a3a" stroke-width="5"/><path d="M48 46.6h104" stroke="#a8885a" stroke-width=".6"/>`
      + [[76, 12], [96, 18], [116, 10], [130, 15]].map(([x, l]) => `<path d="M${x} 50v${l}" stroke="#c8b898" stroke-width=".7"/><ellipse cx="${x}" cy="${50 + l + 3}" rx="2.4" ry="3" fill="none" stroke="#c8b898" stroke-width=".7"/>`).join('');
    const raven = (x, y, s, fly) => fly ? `<path d="M${x - 8 * s} ${y}q${4 * s} ${-4 * s} ${8 * s} 0q${4 * s} ${-4 * s} ${8 * s} 0q${-4 * s} ${2 * s} ${-8 * s} ${2 * s}z" fill="#141416"/>`
      : `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-4 0q-2 -6 4 -8q4 0 5 3l3 -1l-2 2q0 4 -4 5z" fill="#141416"/><path d="M-4 0l-5 3" stroke="#141416" stroke-width="1.6"/><circle cx="2" cy="-6" r=".4" fill="#c8c8c8"/><path d="M-1 1v2M1 1v2" stroke="#2a2a2a" stroke-width=".5"/></g>`;
    const ravens = raven(66, 44, 1.1) + raven(126, 44, 1, 0) + raven(112, 30, 1.2, true);
    // the post with the edict nailed to it, the drummer
    const post = `<rect x="42" y="96" width="5" height="40" fill="url(#oakH${u})" stroke="#2a1a0a" stroke-width=".4"/><g filter="url(#drop${u})"><path d="M30 98h28v26h-28z" fill="#f4ecd4"/><g transform="translate(33 102)">${lines(0, 0, 6, 22, 2.6)}</g><path d="M50 118l2 8M52 118l-1 8" stroke="#b8302a" stroke-width="1.2"/>${seal(51, 119, 2.8)}</g>` + nails([[33, 100], [55, 100]], '#2a2a2a', .7);
    const drummer = redcoat(u, 74, 132, 46, { drum: true, hat: 'shako' }) + shadow(u, 76, 133, 10, .4, 2);
    // the crowd: heads and shoulders in hats of all kinds, two looking round
    const r = R(41);
    const crowd = Array.from({ length: 13 }, (_, k) => { const x = 4 + k * 15.6 + r() * 6, y = 142 + r() * 8 + (k % 2) * 4, c = ['#3a3430', '#4a3a2a', '#2a2a34', '#5a4a3a'][k % 4], turn = k === 4 || k === 9;
      const hat = ['<path d="M-8 -12q8 -7 16 0q-3 -5 -8 -5t-8 5z" fill="#1a1612"/>', '<path d="M-7 -12h14l-2 -6h-10z" fill="#2a2420"/><path d="M-9 -12h18" stroke="#2a2420" stroke-width="1.4"/>', '<ellipse cx="0" cy="-13" rx="7" ry="3" fill="#6a5a40"/>', '<path d="M-6 -12q6 -8 12 0" fill="#5a1a14"/>'][k % 4];
      return `<g transform="translate(${f1(x)} ${f1(y)})"><path d="M-12 20q2 -14 12 -16q10 2 12 16z" fill="${c}"/><circle cy="-8" r="6" fill="${turn ? '#d8a882' : '#5a4030'}"/>${turn ? '<circle cx="-2" cy="-9" r=".6" fill="#2a1a10"/><circle cx="2" cy="-9" r=".6" fill="#2a1a10"/>' : ''}${hat}</g>`; }).join('');
    const light = gloom(u, 100, 120, 100, 280, .45, '#1a1e22');
    return [back + flagS + wall, gallows + ravens + post + drummer + crowd + light];
  },

  // Mercer the spy: a figure in a long caped cloak and a low broad hat stands in an embrasure of the fort wall against
  // the moon, a spyglass to the eye on a ship's lights far off; a notebook open on the merlon, a shuttered lantern.
  'Шпион Мерсер': u => {
    const hz = 106;
    const back = sky(u, 0, hz + 1, [[0, '#040a1a'], [.6, '#122a4a'], [1, '#2a4a6a']]) + stars(60, 0, 0, W, 90, 7) + moon(u, 100, 26, 12, '#f4f0dc', '#c8dcff', .5)
      + sea(u, hz, H, '#1e3a5a', '#0e2034', '#040a14', '#8aa8d0', '#e8f0ff', 92, 7) + lit(sailing('endeavour', 172, 98, .5, 0, u), NIGHT) + [[166, 102], [173, 101], [179, 102]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="#ffd890"/>` + glow(u, x, y, 3, 3, '#ffb050', .8)).join('');
    const st = '#3a4a5a';
    const wall = `<path d="M0 126h200V${H}H0z" fill="${st}"/>` + `<rect x="0" y="80" width="56" height="46" fill="${st}"/><rect x="118" y="84" width="34" height="42" fill="${st}"/>`
      + Array.from({ length: 18 }, (_, k) => `<path d="M0 ${130 + k * 9}h200" stroke="#1a2430" stroke-width=".6"/>` + Array.from({ length: 10 }, (_, i) => `<path d="M${i * 22 + (k % 2) * 11} ${130 + k * 9}v9" stroke="#1a2430" stroke-width=".6"/>`).join('')).join('')
      + [[0, 80, 56], [118, 84, 34]].map(([x, y, w]) => [0, 1, 2, 3].map(k => `<path d="M${x} ${y + 10 + k * 10}h${w}" stroke="#1a2430" stroke-width=".6"/>`).join('') + `<path d="M${x} ${y}h${w}" stroke="#a8c4e0" stroke-width=".8" opacity=".7"/>`).join('')
      + `<path d="M0 126h200" stroke="#a8c4e0" stroke-width=".6" opacity=".5"/>` + [[30, 140], [150, 150], [90, 170]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2" fill="#141c26"/>`).join('');
    // the figure in profile facing right: broad low hat, long caped cloak blown out to the left, the spyglass
    const fig = `<g filter="url(#drop${u})"><path d="M78 126l2 -16h14l2 16z" fill="#0a0e14"/><path d="M76 66q-12 20 -22 56q12 2 20 -2q4 -20 6 -30q4 18 14 34h10q-4 -30 -8 -52q-6 -8 -20 -6z" fill="#0e121a"/>`
      + `<path d="M74 64q-8 6 -16 24q10 2 26 -6q6 -10 4 -18z" fill="#141a24"/><path d="M76 66q-12 20 -22 56M74 64q-8 6 -16 24" stroke="#a8c4e8" stroke-width=".8" fill="none" opacity=".8"/>`
      + `<path d="M84 60q-1 -8 6 -8q6 1 6 7z" fill="#0e121a"/><path d="M74 54q16 -6 32 0q-2 2 -16 2t-16 -2z" fill="#0a0e14"/><path d="M80 52q8 -6 16 0" fill="#0e121a"/><path d="M74 54q16 -6 32 0" stroke="#a8c4e8" stroke-width=".6" fill="none" opacity=".8"/>`
      + `<path d="M92 66l14 -4" stroke="#0e121a" stroke-width="4" stroke-linecap="round"/><g transform="translate(96 58) rotate(14)"><rect x="0" y="-2" width="10" height="4" rx="1" fill="url(#brass${u})"/><rect x="9" y="-1.6" width="10" height="3.2" rx="1" fill="#2a2018"/><rect x="18" y="-1.2" width="8" height="2.6" rx="1" fill="url(#brass${u})"/><path d="M1 -1.6h24" stroke="#ffffff" stroke-width=".4" opacity=".8"/></g></g>`;
    const book = `<g transform="translate(136 82)" filter="url(#drop${u})"><path d="M-14 2l1 -6l13 -1l13 1l1 6l-14 1z" fill="#d8dce8"/><path d="M0 -5v8" stroke="#8a90a0" stroke-width=".5"/><g transform="translate(-11 -3)">${lines(0, 0, 2, 9, 2.2, '#3a4250')}</g><g transform="translate(2 -3)">${lines(0, 0, 2, 9, 2.2, '#3a4250')}</g></g>` + quill(u, 148, 82, 60, .6);
    const lamp = `<g transform="translate(104 126)" filter="url(#drop${u})"><path d="M-5 0h10l-1 -3h-8z" fill="#1a1a1e"/><rect x="-4" y="-13" width="8" height="10" rx="1" fill="#2a2a30" stroke="#0a0a0c" stroke-width=".6"/><path d="M-4 -8h8" stroke="#ffb050" stroke-width=".4" opacity=".7"/><path d="M-5 -13h10l-2 -3h-6z" fill="#1a1a1e"/></g>`;
    const light = glow(u, 100, 26, 60, 50, '#c8dcff', .2) + gloom(u, 100, 140, 100, 280, .5, '#02060e');
    return [back + wall, fig + book + lamp + light];
  },

  // Reinforcements: a longboat full of redcoats comes towards us out of the distance, the oars dipping in step, an
  // officer at the stern with the Company's flag; two more boats behind; the ships at anchor on the horizon.
  'Подкрепление флота': u => {
    const hz = 72;
    const back = day(u, hz, 150, 52, 33) + sailing('endeavour', 70, 60, .5, 0, u) + sailing('endeavour', 124, 64, .34, 0, u)
      + [[60, 84, .5], [96, 92, .6]].map(([x, y, s]) => `<g opacity=".7" transform="translate(${x} ${y}) scale(${s})">${put('longboat', 0, 0, 1, 0, u)}</g>`).join('');
    // the boat in three quarters from the bow: bow near on the right, stern far on the left; inside: thwarts
    const hullP = 'M30 104Q90 98 158 112L174 122Q168 130 156 132Q90 128 36 112z';
    const boat = `<path d="${hullP}" fill="#6a4426" stroke="#2a1608" stroke-width=".7"/><path d="M30 104Q90 98 158 112L174 122" stroke="#e8c088" stroke-width="1.2" fill="none"/><path d="M36 112Q90 126 156 132" stroke="#2a1608" stroke-width="1" fill="none"/>`
      + `<path d="M34 106Q90 102 156 114L168 121Q100 118 40 110z" fill="#3a2414"/>` + [52, 76, 100, 124, 146].map((x, k) => `<path d="M${x} ${f1(104 - k * .2 + k * 1.6)}l2 ${f1(5 + k * 1.2)}" stroke="#8a6440" stroke-width="2"/>`).join('')
      + `<path d="M36 112Q90 128 156 132" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".8"/>` + spray(150, 116, 30, 16, 20, 5) + `<path d="M174 122q8 2 14 8M170 128q6 4 14 10" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".8"/>`;
    // rowers (white shirts) facing the stern, each at another phase of the stroke; soldiers with bayonets between
    const rower = (x, y, s, ph) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-4 0q0 -10 4 -12q4 2 4 12z" fill="#e8e4dc" stroke="#7a7468" stroke-width=".4"/><circle cx="-1" cy="-15" r="3.4" fill="#c89a72"/><path d="M-2 -18q2 -2 4 0" stroke="#3a2a1a" stroke-width="1.4"/><path d="M0 -8l${8 + ph * 3} ${2 - ph}" stroke="#e8e4dc" stroke-width="2.2" stroke-linecap="round"/></g>`;
    const oar = (x0, y0, x1, y1) => `<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#c8a070" stroke-width="1.4"/><path d="M${x1 - 3} ${y1}l6 4" stroke="#c8a070" stroke-width="3"/>` + spray(x1 - 6, y1, 12, 6, 8, x0) + `<ellipse cx="${x1 + 1}" cy="${y1 + 3}" rx="5" ry="1.2" fill="none" stroke="#ffffff" stroke-width=".6" opacity=".8"/>`;
    const crew = [[58, 104, .8, 0], [82, 106, .9, 1], [106, 108, 1, 0], [130, 111, 1.1, 1]].map(([x, y, s, ph]) => rower(x, y, s, ph) + oar(x + 6 * s, y - 8 * s, x + 24 * s + ph * 6, y + 24)).join('')
      + [[70, 106, 22], [94, 108, 25], [118, 110, 28], [142, 113, 30]].map(([x, y, h]) => `<g transform="translate(${x} ${y}) scale(${h / 60})"><path d="M-6 0q0 -18 6 -20q6 2 6 20z" fill="#b8302a" stroke="#4a0a06" stroke-width=".4"/><path d="M-5 -18l10 14M5 -18l-10 14" stroke="#f4f0e6" stroke-width="1.2"/><circle cy="-24" r="4" fill="#e8b890"/><path d="M-6 -27q6 -6 12 0q-2 -4 -6 -4t-6 4z" fill="#1a1612"/><path d="M6 -4v-34" stroke="#5a3a1c" stroke-width="1.4"/><path d="M6 -38v-8" stroke="#dfe6ea" stroke-width=".7"/></g>`).join('');
    const officer = `<g transform="translate(38 100) scale(.55)">${redcoat(u, 0, 0, 60, { hat: 'tricorn' })}</g>` + `<path d="M30 102V80" stroke="#5a3a1c" stroke-width=".8"/><g><path d="M30 81q-6 -2 -12 1t-8 1v8q4 0 8 -1t12 -1z" fill="#f4ece0"/>${[0, 1, 2].map(k => `<path d="M30 ${83 + k * 2.6}q-6 -2 -12 1t-8 1" stroke="#b8302a" stroke-width="1.2" fill="none"/>`).join('')}<circle cx="20" cy="85" r="2.4" fill="#f4ece0" stroke="#c9a048" stroke-width=".8"/></g>`;
    const light = glow(u, 150, 52, 60, 40, '#fff4cc', .3) + gloom(u, 100, 140, 100, 280, .4, '#06202a');
    return [back, boat + crew + officer + light];
  },

  // Double hull: the ship's side close up; a round shot stuck in the outer planking, the split planks bent back show
  // the inner layer running crosswise, whole; a fresh plank comes up on a tackle; two iron straps with rivets.
  'Двойная обшивка': u => {
    const side = woodTex(u, 0, 0, W, 240, '#7a5434', '#3a2412', '#140a04', 7, false, 13) + glow(u, 200, 60, 140, 120, '#fff0c8', .25)
      + `<path d="M0 0h200v18h-200z" fill="#5a3a20"/><path d="M0 18h200" stroke="#e8c050" stroke-width="2"/><path d="M0 0h200v6h-200z" fill="url(#oak${u})"/>`
      + Array.from({ length: 30 }, (_, k) => { const y = 22 + k * 7; return `<path d="M0 ${y}h200" stroke="#0a0604" stroke-width="1.2" opacity=".8"/>`; }).join('');
    const straps = [35, 160].map(x => `<rect x="${x - 4}" y="18" width="8" height="222" fill="url(#ironH${u})" stroke="#0a0a0c" stroke-width=".5"/>` + Array.from({ length: 16 }, (_, k) => `<circle cx="${x}" cy="${24 + k * 14}" r="1.2" fill="#c8d0d8"/>`).join('')).join('');
    // the break: outer planks split and bent outwards, the inner layer running diagonally behind, the ball stuck in it
    const id = uid('pdh' + u);
    const brk = 'M70 64l12 -6l16 4l18 -6l14 8l-4 12l6 10l-10 10l-16 -2l-14 6l-12 -6l-10 -10z';
    const inner = `<clipPath id="${id}"><path d="${brk}"/></clipPath><g clip-path="url(#${id})"><rect x="60" y="50" width="90" height="60" fill="#5a3a1c"/>${Array.from({ length: 14 }, (_, k) => `<path d="M${40 + k * 8} 110L${80 + k * 8} 50" stroke="#2a1608" stroke-width="1.4"/><path d="M${41 + k * 8} 110L${81 + k * 8} 50" stroke="#c8925a" stroke-width=".5" opacity=".6"/>`).join('')}</g>`
      + `<path d="${brk}" fill="none" stroke="#e8c090" stroke-width="1.2"/>`
      + [[72, 62, -30], [128, 62, 30], [86, 92, -150], [120, 92, 160]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})" filter="url(#drop${u})"><path d="M0 -3l18 -2l2 3l-18 4z" fill="#8a6040" stroke="#2a1608" stroke-width=".4"/><path d="M2 -2l16 -2" stroke="#e8c090" stroke-width=".4"/></g>`).join('')
      + Array.from({ length: 10 }, (_, k) => { const a = k * .63, d1 = 18, d2 = 30 + (k % 3) * 6; return `<path d="M${f1(100 + Math.cos(a) * d1)} ${f1(76 + Math.sin(a) * d1 * .8)}L${f1(100 + Math.cos(a) * d2)} ${f1(76 + Math.sin(a) * d2 * .8)}" stroke="#0a0604" stroke-width=".7"/>`; }).join('')
      + splinters(100, 76, 22, 5, '#f0d8b0', 26);
    const theBall = `<ellipse cx="90" cy="82" rx="14" ry="6" fill="#140a04" opacity=".55" filter="url(#soft${u})"/>` + ball(u, 102, 76, 13);
    // the fresh plank coming up on its tackle (the davit is above the picture)
    const plank = `<path d="M138 0V110M150 0V110" stroke="#c8b898" stroke-width=".8"/><g transform="translate(144 112)" filter="url(#drop${u})"><circle cy="-8" r="2.6" fill="url(#oak${u})" stroke="#2a1608" stroke-width=".5"/><path d="M-6 0l6 -6l6 6" stroke="#c8b898" stroke-width=".7" fill="none"/><rect x="-22" y="0" width="44" height="6" rx="1" fill="#f0d0a0" stroke="#7a5020" stroke-width=".5"/><path d="M-20 3h40" stroke="#d8a868" stroke-width=".4"/></g>`;
    const water = sea(u, 240, H, '#5c9aa8', '#2c6a7c', '#0e3442', '#e8fbff', '', 100, 3) + `<path d="M0 240q10 -2 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#ffffff" stroke-width="1.4" fill="none"/>`;
    const tar = Array.from({ length: 10 }, (_, k) => `<path d="M${10 + k * 19} ${120 + (k % 4) * 21}h${8 + k % 3 * 4}" stroke="#0a0604" stroke-width="1.8" opacity=".5"/>`).join('');
    const light = glow(u, 160, 50, 80, 60, '#fff4cc', .2) + gloom(u, 100, 140, 100, 280, .4, '#06202a');
    return [side + water + tar, straps + inner + theBall + plank + light];
  },

  // The marines: along the deck from the stern, the rail running away on the right; the front rank kneels and aims
  // over it, the second stands, one reloads; the enemy's boarding grapnel lies cut loose on the rail.
  'Морская пехота': u => {
    const back = day(u, 70, 100, 10, 37) + smoke(u, 120, 40, 1.2, 7, 1.4, 5, '#f4f0e8', 24) + smoke(u, 160, 50, 1, 6, 1.2, 9, '#f4f0e8', 20);
    const enemy = `<path d="M160 60h44v40h-44z" fill="#1a1a1e"/><path d="M160 60h44" stroke="#3a3a3e" stroke-width="2"/><path d="M168 60l-8 -30M184 60l6 -34M176 60q4 10 -2 18M192 60q-6 12 2 20" stroke="#3a2a1a" stroke-width=".8" fill="none"/>`;
    // the rail in perspective: near on the right edge, far towards the middle
    const rail = `<path d="M118 82L200 96V150L118 98z" fill="#6a4a2c" stroke="#2a1608" stroke-width=".6"/><path d="M118 82L200 96" stroke="#fff0c8" stroke-width="1.6"/><path d="M118 80L200 92v4L118 82z" fill="url(#oak${u})"/>`
      + Array.from({ length: 8 }, (_, k) => { const x = 122 + k * 11; return `<path d="M${x} ${f1(82 + (x - 118) * .17)}V${f1(98 + (x - 118) * .63)}" stroke="#2a1608" stroke-width=".7"/>`; }).join('');
    const deck = `<path d="M0 98L118 98L200 150V${H}H0z" fill="#a87c4c"/>` + Array.from({ length: 16 }, (_, k) => `<path d="M${-60 + k * 18} ${H}L${50 + k * 4} 98" stroke="#5a3c1e" stroke-width=".8"/>`).join('');
    const ranks = redcoat(u, 112, 98, 22, { hat: 'tricorn' }) + redcoat(u, 102, 100, 18, { pose: 'kneel', hat: 'shako' })
      + redcoat(u, 132, 108, 32, { hat: 'shako' }) + redcoat(u, 118, 110, 26, { pose: 'kneel', hat: 'tricorn' })
      + redcoat(u, 154, 124, 46, { pose: 'reload', hat: 'tricorn' }) + redcoat(u, 136, 126, 38, { pose: 'kneel', hat: 'shako' })
      + redcoat(u, 168, 140, 54, { pose: 'kneel', hat: 'tricorn' });
    const hook = `<g transform="translate(132 80) rotate(100)" filter="url(#drop${u})"><path d="M0 0v10M0 10q-6 0 -6 -6M0 10q6 0 6 -6M0 10q0 5 -4 6" stroke="url(#iron${u})" stroke-width="1.8" fill="none"/></g>` + rope('M136 86q10 2 16 10q4 8 2 18', 1) + `<path d="M154 114l2 3M154 114l-1 3M154 114l3 1" stroke="#d4b07a" stroke-width=".6"/>`;
    const floor = `<g transform="translate(40 170)" filter="url(#drop${u})"><rect x="-10" y="-6" width="20" height="12" rx="2" fill="#1a1a1e"/><path d="M-10 -6h20" stroke="#e8e0d0" stroke-width="1.6"/></g><g transform="translate(70 200) rotate(-20)" filter="url(#drop${u})"><path d="M0 0h40" stroke="url(#silver${u})" stroke-width="2.4"/><path d="M-2 -4v8" stroke="url(#brass${u})" stroke-width="2"/></g>`;
    const light = gloom(u, 100, 140, 100, 280, .4, '#1a0e06');
    return [back + enemy, deck + rail + ranks + hook + floor + light];
  },

  // Return fire: the enemy ship close up at the moment our shot strikes home: a ragged hole in her bellied course with
  // its edges lit by the sun behind; a breach in her side with splinters and fire inside; the smoke drifts left.
  'Ответный огонь': u => {
    const back = day(u, 150, 100, 40, 41);
    // the course: dark canvas, full of wind, the yard above; the sun behind shows through it
    const sg = uid('pos' + u);
    const sail = `<radialGradient id="${sg}" cx=".6" cy=".3" r=".8"><stop offset="0" stop-color="#6a6258"/><stop offset=".6" stop-color="#3a3630"/><stop offset="1" stop-color="#1e1c1a"/></radialGradient>`
      + `<path d="M-10 4Q100 -2 210 4V96Q100 112 -10 96z" fill="url(#${sg})"/><path d="M-10 6Q100 0 210 6" stroke="#2a1a0e" stroke-width="4"/><path d="M-10 3Q100 -3 210 3" stroke="#c8a070" stroke-width=".8"/>`
      + Array.from({ length: 12 }, (_, k) => `<path d="M${-6 + k * 19} 8q${k < 6 ? -4 : 4} 46 0 ${92 - Math.abs(k - 5.5) * 1.2}" stroke="#141210" stroke-width=".8" fill="none" opacity=".6"/>`).join('');
    const hole = `<path d="M100 46l8 -8l14 2l12 -4l8 10l-4 12l6 10l-12 8l-12 -4l-14 4l-8 -10l2 -12z" fill="#fff8e0"/>` + glow(u, 118, 56, 30, 24, '#fff4cc', .6)
      + Array.from({ length: 24 }, (_, k) => { const a = k * .26, x = 118 + Math.cos(a) * 20, y = 56 + Math.sin(a) * 16; return `<path d="M${f1(x)} ${f1(y)}l${f1(Math.cos(a) * 3)} ${f1(Math.sin(a) * 3 + 1)}" stroke="#ffd890" stroke-width=".4"/>`; }).join('');
    // the rail and her black side, the breach with splinters and layered fire, torn rigging to the left of it
    const hull = `<path d="M-10 98h220v60h-220z" fill="#1a1a1e"/><path d="M-10 98h220" stroke="#5a5a60" stroke-width="2.4"/><path d="M-10 110h220" stroke="#3a3a40" stroke-width="1"/>` + Array.from({ length: 8 }, (_, k) => `<path d="M-10 ${116 + k * 6}h220" stroke="#0a0a0c" stroke-width=".6"/>`).join('')
      + [30, 150].map(x => `<rect x="${x}" y="122" width="14" height="10" fill="#0a0a0c" stroke="#3a3a40" stroke-width=".6"/>`).join('');
    const breach = `<path d="M62 100l10 -4l12 6l14 -4l12 6l-2 12l4 10l-14 4l-12 -4l-14 6l-10 -12z" fill="#140604"/>` + glow(u, 86, 112, 26, 16, '#ff9a3a', .8) + flame(u, 80, 120, .55, 3) + flame(u, 94, 120, .45, 7)
      + splinters(86, 110, 30, 9, '#e8c090', 22);
    const sm = smoke(u, 60, 96, .8, 7, -1.4, 4, '#4a4440', 24);
    const torn = `<path d="M10 140q8 -10 14 2t12 -4M20 132q-4 10 4 16M40 136q8 6 4 14" stroke="#4a3a2a" stroke-width=".8" fill="none"/>`;
    const water = `<path d="M-10 158h220" stroke="#ffffff" stroke-width="1.4" opacity=".8"/>`;
    const light = gloom(u, 100, 160, 100, 280, .4, '#06202a');
    return [back, sail + hole + sm + hull + breach + torn + water + light];
  }
};

const CAM = {};
for (const k of Object.keys(SCENES)) CAM[k] = { x: 0, y: 0, w: 200 };
module.exports = { SCENES, CAM, redcoat, lines, seal, coinStack, quill, inkwell };
