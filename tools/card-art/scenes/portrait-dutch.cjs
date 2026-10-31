// Portrait scenes of the «Летучий голландец» deck (docs/tasks/card-art-portrait.md): cold green light, water, shells;
// the day is pale in a greenish haze. Picture units (camera {0, 0, 200}: p % is y = 2.8 p).
const K = require('./portrait-kit.cjs');
const sea = K.seaG;
const { img, put, woodTex, R, shadow, uid, grad, sky, swell, sailing, beam, lantern, motes, glow, gloom, shafts, flame, smoke, rope, coil, nails, blurF, ghostDeck,
  f1, f2, stars, moon, tint, lit, GHOSTLY, ball, shot, muzzle, arm, hand, cardBack, sand, bubbles, weed, fish, tableTop, W, H } = K;

const HAZE = [[0, '#6a8a84'], [.55, '#a8c4b8'], [1, '#d8e4d0']];
const haze = (u, hz, sx, sy, seed = 3) => sky(u, 0, hz + 1, HAZE) + glow(u, sx, sy, 40, 40, '#f4fff0', .7) + `<circle cx="${sx}" cy="${sy}" r="7" fill="#f4fff4" opacity=".85"/>`
  + K.cloudBand(u, Math.max(0, hz - 60), 40, '#e8f4ec', '#7a9a90', 43 + seed, 2.2) + sea(u, hz, H, '#5a8a80', '#2a5a54', '#0a2420', '#d8fff0', '#f4fff4', sx, seed);
const storm = (u, hz, seed = 5) => sky(u, 0, hz + 1, [[0, '#0a1210'], [.5, '#1e2e2a'], [1, '#3a5048']]) + K.cloudBand(u, 0, hz - 10, '#5a6e68', '#0a1210', 37 + seed, 2.2)
  + sea(u, hz, H, '#2a4a44', '#122a26', '#040c0a', '#a8d0c0', '', 100, seed) + swell(hz + 6, H, '#c8e0d8', .35, seed);
const rain = (n, seed, col = '#c8dcd8') => { const r = R(seed); return Array.from({ length: n }, () => { const x = r() * 220, y = r() * 280, l = 6 + r() * 8; return `<path d="M${f1(x)} ${f1(y)}l${f1(-l * .3)} ${f1(l)}" stroke="${col}" stroke-width=".45" opacity=".45"/>`; }).join(''); };
const bolt = (x, y, l = 40) => `<path d="M${x} ${y}l-6 ${l * .3}l7 1l-9 ${l * .35}l4 1l-5 ${l * .3}" stroke="#e8fff8" stroke-width="1.4" fill="none"/><path d="M${x} ${y}l-6 ${l * .3}l7 1l-9 ${l * .35}l4 1l-5 ${l * .3}" stroke="#9ff0d0" stroke-width="4" fill="none" opacity=".3"/>`;
// under the sea: the surface seen from below (a bright wavy ceiling), the light fanning down, deep teal below
function underwater(u, top = 0, seed = 3) {
  const g = uid('puw' + u), r = R(seed);
  return grad(g, [[0, '#9ad8c8'], [.12, '#3a8a7a'], [.5, '#14463e'], [1, '#03100e']]) + `<rect width="200" height="${H}" fill="url(#${g})"/>`
    + Array.from({ length: 14 }, (_, k) => `<path d="M${f1(-10 + k * 16 + r() * 6)} ${f1(top + 6 + r() * 6)}q8 -4 16 0" stroke="#e8fff8" stroke-width="${f2(.8 + r())}" fill="none" opacity=".6"/>`).join('')
    + shafts(u, 100, top - 20, [[20, 260, 50, 260], [70, 280, 96, 280], [118, 270, 140, 270], [160, 250, 190, 250]], '#c8fff0', .14) + motes(40, 0, 20, 200, 240, '#c8fff0', seed);
}
// a tentacle along a smooth line through pts: thick at the start, tapering to the tip; suckers along one side
function tentacle(u, pts, w0, w1, side = 1, col = ['#5a7a5a', '#2a4a34', '#1a2a20']) {
  const cr = (p0, p1, p2, p3, t) => [0, 1].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t));
  const P = [pts[0], ...pts, pts[pts.length - 1]], S = [];
  for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 10; k++) S.push(cr(P[i - 1], P[i], P[i + 1], P[i + 2], k / 10));
  S.push(pts[pts.length - 1]);
  const n = S.length, L = [], Rr = [], nrm = [];
  for (let i = 0; i < n; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / (n - 1)) / 2; nrm.push([-dy / l, dx / l, w]);
    L.push([S[i][0] - dy / l * w, S[i][1] + dx / l * w]); Rr.push([S[i][0] + dy / l * w, S[i][1] - dx / l * w]); }
  const g = uid('ptn' + u), d = 'M' + L.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'L' + Rr.reverse().map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'z';
  let out = `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset=".6" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[2]}"/></linearGradient><g filter="url(#drop${u})"><path d="${d}" fill="url(#${g})" stroke="#0a140e" stroke-width=".6"/>`;
  out += `<path d="M${S.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L')}" stroke="#b8e8c8" stroke-width="${f2(w0 * .12)}" fill="none" opacity=".35" transform="translate(${f1(-side * 1.2)} -1)"/>`;
  for (let i = 2; i < n - 2; i += 2) { const [nx, ny, w] = nrm[i], x = S[i][0] + nx * w * .62 * side, y = S[i][1] + ny * w * .62 * side, r = Math.max(.6, w * .32); out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f2(r)}" fill="#d8b0a0" stroke="#5a3a30" stroke-width=".3"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f2(r * .45)}" fill="#7a4a40"/>`; }
  return out + '</g>';
}
// a ship heeled or pitched by a degrees about her waterline point: the cut at the waterline turns with her; foam ring
function tilted(k, x, y, s, a, u, bowLeft = true, ring = true) {
  const w = 64 * s, wl = y + .205 * w, id = uid('ptl' + u), d = bowLeft ? 1 : -1;
  return `<g transform="rotate(${a} ${x} ${f1(wl)})"><clipPath id="${id}"><rect x="${x - w}" y="${y - w * 1.5}" width="${2 * w}" height="${f1(wl - y + w * 1.5)}"/></clipPath><g clip-path="url(#${id})"><g transform="translate(${x} 0) scale(${d} 1) translate(${-x} 0)">${img(k, x, y, s, 0, u)}</g></g></g>`
    + (ring ? `<ellipse cx="${x}" cy="${f1(wl)}" rx="${f1(w * .36)}" ry="${f1(w * .05)}" fill="none" stroke="#f4fff8" stroke-width="1.4" opacity=".8"/><ellipse cx="${x}" cy="${f1(wl + 1)}" rx="${f1(w * .44)}" ry="${f1(w * .07)}" fill="none" stroke="#e8fff8" stroke-width=".7" opacity=".5"/>` : '');
}
// the Dutchman's bell: bronze with green patina, a band of waves in relief, the clapper; tilted by a degrees
function bell(u, x, y, s = 1, a = 0) {
  const g = uid('pbl' + u);
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})" filter="url(#drop${u})"><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a14"/><stop offset=".25" stop-color="#e8b860"/><stop offset=".5" stop-color="#a8762a"/><stop offset="1" stop-color="#3a2408"/></linearGradient>`
    + `<rect x="-5" y="-4" width="10" height="5" rx="1.4" fill="url(#${g})"/><path d="M-12 0q-2 10 -4 22q-2 8 -8 12h48q-6 -4 -8 -12q-2 -12 -4 -22q-12 -4 -24 0z" fill="url(#${g})" stroke="#2a1a06" stroke-width=".6"/>`
    + `<path d="M-23 33q23 4 46 0" stroke="#3a2408" stroke-width="2" fill="none"/><ellipse cx="0" cy="34" rx="24" ry="3" fill="#1a1006"/><path d="M-15 16q15 3 30 0" stroke="#5a3a14" stroke-width="2.4" fill="none"/>`
    + `<path d="M-15 16q2.5 -2 5 0t5 0t5 0t5 0t5 0t5 0" stroke="#f0c878" stroke-width=".6" fill="none"/><path d="M-10 4q-4 12 -10 26" stroke="#fff0c0" stroke-width="1.2" fill="none" opacity=".6"/>`
    + `<path d="M6 2q4 10 2 20M14 8q2 8 -2 18M-6 22q-4 4 -2 8" stroke="#4a9a7a" stroke-width="1.6" fill="none" opacity=".55"/><ellipse cx="10" cy="26" rx="5" ry="2" fill="#4a9a7a" opacity=".4"/>`
    + `<path d="M0 6v26" stroke="#2a1a06" stroke-width="1.2"/><circle cx="0" cy="33" r="3" fill="url(#iron${u})"/></g>`;
}
const spray = (x, y, w, h, n, seed, col = '#f4fff8') => { const r = R(seed); return Array.from({ length: n }, () => `<circle cx="${f1(x + r() * w)}" cy="${f1(y + r() * h)}" r="${f2(.25 + r() * .7)}" fill="${col}" opacity="${f2(.4 + r() * .5)}"/>`).join(''); };
// pale green wisp of a soul from (x0,y0) curving along pts
const soul = (u, d, w = 4) => { const f = uid('psf' + u); return blurF(f, 2) + `<path d="${d}" stroke="#bff8e0" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".45" filter="url(#${f})"/><path d="${d}" stroke="#ffffff" stroke-width="${f2(w * .25)}" fill="none" stroke-linecap="round" opacity=".6"/>`; };
const barn = (x, y, r) => `<path d="M${f1(x - r)} ${f1(y + r * .6)}l${f1(r * .4)} ${f1(-r * 1.4)}h${f1(r * 1.2)}l${f1(r * .4)} ${f1(r * 1.4)}z" fill="#c8c4b0" stroke="#5a5a48" stroke-width=".3"/><ellipse cx="${x}" cy="${f1(y - r * .8)}" rx="${f1(r * .5)}" ry="${f1(r * .2)}" fill="#3a3a2a"/>`;

// a ship pitched by a degrees (bow up or down), cut by the level sea surface at seaY (what is under the sea is hidden)
function pitched(k, x, y, s, a, u, seaY, flip = false) {
  const id = uid('ppt' + u);
  return `<clipPath id="${id}"><rect x="-50" y="-200" width="300" height="${seaY + 200}"/></clipPath><g clip-path="url(#${id})"><g transform="rotate(${a} ${x} ${y})"><g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1) translate(${-x} 0)">${img(k, x, y, s, 0, u)}</g></g></g>`;
}

const SCENES = {
  // The call of the deep: in a storm a tentacle rises from the sea and wraps once round the already burning enemy.
  'Зов глубин': u => {
    const hz = 96;
    const back = storm(u, hz, 3) + bolt(108, 4, 40) + glow(u, 104, 20, 40, 30, '#c8fff0', .25);
    const ship = tilted('endeavour', 112, 98, 1.5, 7, u, true, false) + `<path d="M74 122q38 4 76 -6" stroke="#f4fff8" stroke-width="1.4" fill="none" opacity=".8"/>`
      + flame(u, 122, 106, .5, 3) + flame(u, 96, 102, .4, 6) + flame(u, 88, 62, .4, 9) + smoke(u, 112, 96, .8, 7, 1.4, 4, '#3a3a36', 30);
    // the tentacle: out of the sea on the left, up in an arc and once round the hull under the rail
    const t = tentacle(u, [[36, 250], [24, 160], [26, 90], [52, 64], [80, 82], [100, 110], [128, 116], [146, 104], [140, 94], [130, 98]], 26, 4, -1)
      + [[100, 116], [128, 120], [70, 80]].map(([x, y]) => `<path d="M${x} ${y}q1 6 0 10" stroke="#c8fff0" stroke-width=".7" fill="none" opacity=".7"/>`).join('');
    const ring = `<ellipse cx="34" cy="250" rx="30" ry="5" fill="none" stroke="#f4fff8" stroke-width="1.4" opacity=".7"/>` + spray(10, 240, 50, 12, 20, 5);
    const light = rain(80, 7) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [back + ship, t + ring + light];
  },

  // Out of the depths: under the sea the Dutchman rises bow up at the small dark hull of the enemy above; her guns fire
  // green flashes and the shot runs up in cones of bubbles; the fish scatter.
  'Из пучины': u => {
    const back = underwater(u, 0, 5) + `<path d="M64 30q36 -10 72 0q-6 10 -36 14q-30 -4 -36 -14z" fill="#0a1a18"/><path d="M68 30q32 -8 64 0" stroke="#6aa898" stroke-width=".6" fill="none"/><path d="M98 44l2 6" stroke="#0a1a18" stroke-width="2"/>`;
    const ship = `<g transform="rotate(-35 100 108)">${tint(`<g transform="translate(100 0) scale(-1 1) translate(-100 0)">${img('dutch', 100, 108, 2.1, 0, u)}</g>`, [.45, .75, .66], [0, .05, .04], .5)}</g>`
      + gloom(u, 120, 90, 60, 200, .55, '#02100e') + [[150, 86], [138, 100], [124, 110]].map(([x, y]) => weed(x, y + 20, 18, '#2a5a3a', x, -1)).join('');
    // the shot: a ball at the head of each trail, bubbles behind growing larger and sparser
    const trail = (x0, y0, x1, y1, seed) => { const r = R(seed); let o = glow(u, x0, y0, 10, 10, '#9fffd0', .8); for (let i = 0; i < 16; i++) { const t = i / 15, x = x1 + (x0 - x1) * t + (r() - .5) * t * 10, y = y1 + (y0 - y1) * t + (r() - .5) * t * 6, rr = .5 + t * 2.4; if (r() > .2) o += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f2(rr)}" fill="none" stroke="#d8fff4" stroke-width=".4" opacity="${f2(.9 - t * .4)}"/>`; } return o + ball(u, x1, y1, 2.4); };
    const shots = trail(144, 58, 116, 48, 3) + trail(150, 74, 92, 50, 7) + trail(136, 72, 76, 46, 11);
    const fishes = fish(40, 80, 1.2, -1, '#7aa8a0') + fish(30, 90, 1, -1, '#6a9890') + fish(176, 120, 1.1, 1, '#7aa8a0') + fish(170, 132, .9, 1, '#6a9890') + bubbles(16, 40, 90, 120, 60, 9);
    const light = gloom(u, 100, 140, 100, 280, .5, '#020a08');
    return [back, ship + shots + fishes + light];
  },

  // The fishmen board: on the enemy's lantern-lit deck one of them crouches with his pike, about to spring; another
  // climbs over the rail from the sea dripping water; behind, close aboard in the fog, the ghost ship's masts.
  'Абордаж рыболюдей': u => {
    const back = sky(u, 0, 100, [[0, '#0a1412'], [1, '#2a4a42']]) + `<g opacity=".7">${tint(img('dutch', 100, 50, 3.2, 0, u), [.35, .6, .52], [0, .04, .03], .4)}</g>` + glow(u, 100, 40, 90, 50, '#9ff0d0', .2)
      + grad('pff' + u, [[0, '#a8d8c8', 0], [1, '#a8d8c8', .35]]) + `<rect y="40" width="200" height="60" fill="url(#pff${u})"/>`;
    const rail = `<rect y="95" width="200" height="22" fill="#4a3424"/>` + woodTex(u, 0, 95, W, 22, '#6a4a2c', '#3a2414', '#140a04', 5, false, 4) + `<path d="M0 95h200" stroke="#c8f0e0" stroke-width="1" opacity=".7"/><path d="M0 92h200v3h-200z" fill="#7a5434"/>`
      + K.tableTop(u, 117, H - 117, '#8a6440', '#4a3020', 9);
    const lamp = `<path d="M170 92v-30" stroke="#3a2a1a" stroke-width="1"/>` + lantern(170, 70, 1.1);
    // the far one climbing over the rail, water running off him
    const climber = `<g transform="translate(150 92) scale(-.72 .72)">${put('fishman', 0, 0, 1, 0, u)}</g>` + [[140, 96], [156, 98], [148, 100]].map(([x, y]) => `<path d="M${x} ${y}q1 8 0 14" stroke="#c8fff0" stroke-width=".6" fill="none" opacity=".7"/>`).join('');
    // the near one crouched to spring, pike held across in both hands
    const near = `<g transform="translate(66 118) rotate(8) scale(1.12)">${put('fishman', 0, 0, 1, 0, u)}</g>` + `<path d="M24 120L124 96" stroke="#5a3a1c" stroke-width="2"/><path d="M124 96l12 -3l-9 7z" fill="url(#silver${u})" stroke="#2a3034" stroke-width=".4"/>`
      + [[58, 100], [78, 94]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="2.6" fill="#3a6a5a" stroke="#14301e" stroke-width=".4"/>`).join('');
    const cap = `<g transform="translate(110 132) rotate(-14)" filter="url(#drop${u})"><path d="M-8 2q0 -10 8 -10t8 10z" fill="#3a4a6a"/><path d="M-8 2h16" stroke="#e8e0d0" stroke-width="1.4"/><circle cy="-8" r="1.4" fill="#c8302a"/></g>`
      + [[30, 150], [44, 166], [36, 184], [130, 150]].map(([x, y]) => `<path d="M${x} ${y}l-3 -4M${x} ${y}l0 -5M${x} ${y}l3 -4" stroke="#2a4a3a" stroke-width="1.2" opacity=".6"/>`).join('') + `<ellipse cx="90" cy="160" rx="26" ry="3" fill="#9ab8b0" opacity=".2"/>` + weed(160, 140, 10, '#2a6a4a', 3);
    const light = glow(u, 170, 70, 60, 50, '#ffb050', .3) + glow(u, 100, 60, 100, 40, '#9ff0d0', .15) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [back + rail + lamp, climber + near + cap + light];
  },

  // Surfacing: the Dutchman bursts out of the sea bow up, water pouring off her decks and out of her ports; the first
  // gun of her broadside flashes towards the pale enemy in the fog on the horizon; a pale sun behind.
  'Всплытие': u => {
    const hz = 104;
    const back = haze(u, hz, 150, 50, 7) + `<g opacity=".45">${sailing('endeavour', 34, 98, .5, 0, u)}</g>`;
    const ship = pitched('dutch', 106, 96, 2.3, 30, u, 124);
    const pour = Array.from({ length: 12 }, (_, k) => { const x = 60 + k * 8, y = 64 + k * 5; return `<path d="M${x} ${y}q3 10 -1 20t1 ${f1(124 - y - 20)}" stroke="#e8fff8" stroke-width="${f2(.6 + (k % 3) * .3)}" fill="none" opacity=".55"/>`; }).join('')
      + spray(56, 50, 100, 70, 80, 9) + `<g opacity=".5">${put('splash', 76, 116, .6, -10, u, false)}${put('splash', 130, 122, .5, 10, u, false)}</g>`;
    const fire = muzzle(u, 70, 74, 200, .7) + smoke(u, 70, 78, .5, 5, -1.2, 5, '#e8f4ec', 10);
    const ring = `<ellipse cx="112" cy="124" rx="56" ry="7" fill="#e8fff8" opacity=".35"/><ellipse cx="112" cy="124" rx="50" ry="5" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".8"/>` + spray(60, 118, 110, 12, 40, 3);
    const light = glow(u, 150, 50, 50, 50, '#f4fff0', .25) + gloom(u, 100, 140, 100, 280, .45, '#04140f');
    return [back, ship + pour + fire + ring + light];
  },

  // The harvest: low on the ghost ship's deck three heaps lie apart — a cutlass and a red kerchief, an officer's sword
  // and a hat with a cockade, a hatchet and a knitted cap; from each a pale green soul streams to the still bell.
  'Жатва': u => {
    const deck0 = ghostDeck(u);
    const frame = `<path d="M60 108V44M140 108V44" stroke="#2a2016" stroke-width="5"/><path d="M60 108V44M140 108V44" stroke="#6a5a44" stroke-width="3.4"/><path d="M54 42h92" stroke="#2a2016" stroke-width="6"/><path d="M54 42h92" stroke="#6a5a44" stroke-width="4.6"/>`
      + shadow(u, 60, 109, 7, .5, 1.6) + shadow(u, 140, 109, 7, .5, 1.6) + barn(64, 60, 2) + barn(138, 80, 2.4) + bell(u, 100, 46, 1.05, 0);
    // three heaps on the wet planks, each with its stream of soul rising to the bell's mouth
    const heap1 = `<g transform="translate(40 128)" filter="url(#drop${u})"><path d="M-14 4q8 -6 22 -2q-6 6 -22 2z" fill="#b8201a"/><path d="M-16 0l26 -6" stroke="url(#silver${u})" stroke-width="2"/><path d="M8 -6q4 -4 8 -1" stroke="url(#brass${u})" stroke-width="1.4" fill="none"/></g>`;
    const heap2 = `<g transform="translate(100 132)" filter="url(#drop${u})"><path d="M-20 0l40 -3" stroke="url(#silver${u})" stroke-width="1.4"/><path d="M16 -4q4 -3 6 1" stroke="url(#brass${u})" stroke-width="1.6" fill="none"/><path d="M-12 0q12 -12 24 0q-12 3 -24 0z" fill="#141210"/><circle cx="4" cy="-4" r="2" fill="#e8e0d0" stroke="#b8302a" stroke-width=".6"/></g>`;
    const heap3 = `<g transform="translate(160 128)" filter="url(#drop${u})"><path d="M-8 2q0 -10 8 -10t8 10z" fill="#5a3a2a"/><path d="M-8 2h16" stroke="#8a6a4a" stroke-width="1.6"/><path d="M-14 -2l20 6" stroke="url(#oakH${u})" stroke-width="2"/><path d="M-16 -6l4 0l0 6l-6 -1z" fill="url(#iron${u})"/></g>`;
    const souls = soul(u, 'M40 122Q36 96 58 92Q78 90 90 84', 5) + soul(u, 'M100 124Q104 104 100 92Q99 86 100 82', 5) + soul(u, 'M160 122Q166 96 142 92Q122 90 110 84', 5);
    const fog = grad('phf' + u, [[0, '#b8f0d8', 0], [.5, '#b8f0d8', .2], [1, '#b8f0d8', 0]]) + `<rect y="120" width="200" height="40" fill="url(#phf${u})"/>` + [[60, 150, 20], [140, 160, 24]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .12}" fill="#a8c8c0" opacity=".2"/>`).join('');
    const light = glow(u, 100, 84, 30, 20, '#bff8e0', .3) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [deck0, frame + heap1 + heap2 + heap3 + souls + fog + light];
  },

  // The Dutchman's bell: the bronze bell swings on its beam between two old barnacled posts, the clapper striking the
  // raised edge; the air trembles round its lip; rings spread on the puddles below.
  'Колокол «Голландца»': u => {
    const deck0 = ghostDeck(u);
    const post = x => `<path d="M${x - 4} 130V30h8v100z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M${x - 2} 30v100" stroke="#a8906a" stroke-width=".5" opacity=".6"/>` + barn(x, 60, 2.4) + barn(x - 1, 92, 2) + barn(x + 2, 110, 1.6) + shadow(u, x, 131, 9, .55, 2);
    const frame = post(50) + post(150) + `<path d="M42 30h116v8h-116z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/><path d="M42 30h116" stroke="#c8e8d8" stroke-width=".6" opacity=".6"/>` + barn(80, 34, 1.6) + barn(124, 34, 1.8)
      + `<path d="M150 70l6 0l0 3l-6 0z" fill="url(#iron${u})"/>`;
    const f = uid('pbt' + u);
    const theBell = `<path d="M100 38v6" stroke="url(#iron${u})" stroke-width="3"/>` + bell(u, 100, 44, 1.65, -15)
      + `<path d="M118 52Q140 58 150 72" stroke="#c8b898" stroke-width=".9" fill="none"/>` + blurF(f, 1.6) + `<path d="M58 92q30 22 70 6" stroke="#c8fff0" stroke-width="3" fill="none" opacity=".25" filter="url(#${f})"/>`
      + glow(u, 116, 92, 12, 8, '#fff0c0', .6);
    const puddles = [[80, 124, 22], [124, 128, 18]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f1(w * .16)}" fill="#7aa8a0" opacity=".35"/>` + [.4, .7].map(k => `<ellipse cx="${x}" cy="${y}" rx="${f1(w * k)}" ry="${f1(w * k * .14)}" fill="none" stroke="#e8fff8" stroke-width=".5" opacity=".7"/>`).join('')).join('');
    const fog = grad('pkf' + u, [[0, '#b8f0d8', 0], [.5, '#b8f0d8', .2], [1, '#b8f0d8', 0]]) + `<rect y="126" width="200" height="40" fill="url(#pkf${u})"/>`;
    const light = glow(u, 100, 70, 60, 50, '#bff8e0', .15) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [deck0, frame + theBell + puddles + fog + light];
  },

  // Bootstrap Bill: the old sailor, grown with shells, still at his work in the flooded hold, hauling on a rope; a
  // shackle on his wrist, the chain sagging to a ringbolt in the side; a green shaft of light from the grating.
  'Прихлоп Билл': u => {
    const back = `<rect width="200" height="${H}" fill="#0a1412"/>` + woodTex(u, 0, 0, W, 170, '#2a2a22', '#121410', '#060806', 12, false, 3) + beam(u, 0, 0, W, 10) + beam(u, 0, 22, W, 6)
      + `<rect x="80" y="2" width="40" height="18" fill="#2a2a22"/>` + [0, 1, 2].map(k => `<rect x="${83 + k * 12}" y="5" width="9" height="12" fill="#c8f0e0"/>`).join('') + shafts(u, 100, 18, [[80, 100, 120, 100]], '#c8fff0', .22);
    const water = grad('pbw' + u, [[0, '#1a3a34'], [1, '#040c0a']]) + `<rect y="150" width="200" height="${H - 150}" fill="url(#pbw${u})"/><path d="M0 150q20 -2 40 0t40 0t40 0t40 0t40 0" stroke="#9ff0d0" stroke-width=".8" fill="none" opacity=".6"/>`;
    // the ringbolt in the side, the chain sagging to his wrist
    const chain0 = `<circle cx="172" cy="96" r="3.4" fill="none" stroke="url(#iron${u})" stroke-width="1.8"/>` + Array.from({ length: 10 }, (_, k) => { const t = k / 9, x = 170 - t * 42, y = 98 + Math.sin(t * Math.PI) * 12 + t * 14; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="2.2" ry="1.4" fill="none" stroke="#6a4a2a" stroke-width="1.1"/>`; }).join('');
    // the old man: knitted cap, short grey beard, deep lines, shells on shoulder, sleeve and cheek
    const sk = uid('pbs' + u);
    const man = `<radialGradient id="${sk}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#a8a888"/><stop offset=".7" stop-color="#6a705a"/><stop offset="1" stop-color="#3a4030"/></radialGradient>`
      + `<path d="M64 160q-2 -50 8 -78q10 -14 28 -16q18 2 28 16q10 28 8 78z" fill="#3a3a2e" stroke="#0a0c08" stroke-width=".6"/><path d="M72 82q-6 30 -6 78" stroke="#9ff0d0" stroke-width=".8" fill="none" opacity=".5"/>`
      + `<path d="M76 90l20 60M120 90l-14 60" stroke="#2a2a20" stroke-width="1" opacity=".7"/><path d="M88 150h24v12h-24z" fill="#2a2018"/>`
      + `<path d="M92 66h16v10h-16z" fill="url(#${sk})"/><path d="M86 52q0 -16 14 -16t14 16q0 10 -5 15q-4 4 -9 4t-9 -4q-5 -5 -5 -15z" fill="url(#${sk})" stroke="#1a1c14" stroke-width=".5"/>`
      + `<path d="M85 46q15 -14 30 0q-2 -10 -15 -11q-13 1 -15 11z" fill="#5a2a22"/><path d="M85 46q15 -5 30 0" stroke="#3a1a14" stroke-width="2" fill="none"/>${[88, 92, 96, 100, 104, 108, 112].map(x => `<path d="M${x} 38v6" stroke="#3a1a14" stroke-width=".4"/>`).join('')}`
      + `<path d="M90 52q3 -2 6 0M104 52q3 -2 6 0" stroke="#1a1a12" stroke-width="1.1" fill="none"/><path d="M89 49q4 -2 7 -1M104 48q4 -1 7 1" stroke="#d8dcc8" stroke-width=".8" fill="none"/><path d="M100 54q-2 5 0 8h2" stroke="#3a3a2a" stroke-width=".6" fill="none"/>`
      + `<path d="M88 56q-1 3 0 6M112 56q1 3 0 6M94 58l-3 2M106 58l3 2M92 47h4M104 47h4" stroke="#3a3a2a" stroke-width=".4" fill="none"/>`
      + `<path d="M88 62q12 16 24 0q-2 10 -12 12q-10 -2 -12 -12z" fill="#c8c8c0"/><path d="M92 64q8 4 16 0" stroke="#5a5a50" stroke-width=".6" fill="none"/>${[92, 96, 100, 104, 108].map(x => `<path d="M${x} 66q0 3 -1 5" stroke="#8a8a80" stroke-width=".4" fill="none"/>`).join('')}`
      + barn(110, 58, 1.6) + barn(113, 61, 1.2) + barn(76, 82, 2.4) + barn(82, 79, 1.8) + barn(70, 90, 2) + `<path d="M120 86q4 -6 2 -10M122 86q4 -4 6 -2" stroke="#e88a7a" stroke-width="1.2" fill="none"/>`;
    // his arms on the rope he hauls, which runs up to the hatch
    const ropeUp = rope('M118 18L108 102', 1.4);
    const arms = `<path d="M72 92q-6 18 22 14M126 92q8 10 -14 8" stroke="#3a3a2e" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M72 92q-6 18 22 14" stroke="#9ff0d0" stroke-width=".6" fill="none" opacity=".5"/>`
      + `<circle cx="104" cy="104" r="5" fill="url(#${sk})" stroke="#1a1c14" stroke-width=".4"/><circle cx="112" cy="98" r="5" fill="url(#${sk})" stroke="#1a1c14" stroke-width=".4"/><rect x="117" y="96" width="6" height="5" rx="1" fill="none" stroke="url(#iron${u})" stroke-width="1.6"/>` + barn(122, 92, 1.4);
    const weedW = weed(60, 170, 12, '#2a5a3a', 3) + weed(140, 172, 14, '#2a5a3a', 7, -1) + spray(70, 140, 60, 14, 14, 9, '#c8fff0');
    const light = glow(u, 104, 56, 30, 30, '#c8fff0', .35) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [back + water + chain0, man + ropeUp + arms + weedW + light];
  },

  // The dead man's chest: on a pale beach the iron-bound chest, lid shut but not quite; red light leaks from the gap,
  // sand trickles off the lid; coins and the key lie in front of it.
  'Сундук мертвеца': u => {
    const hz = 62;
    const back = haze(u, hz, 160, 30, 11) + `<path d="M40 64q20 -12 60 -8q14 2 24 8z" fill="#5a7a6a"/>` + lit(K.palm ? '' : '', GHOSTLY) + tint(require('./art3.cjs').palm(64, 62, .5) + require('./art3.cjs').palm(84, 60, .44, -1), [.7, .9, .82], [0, .03, .02], .6)
      + `<path d="M0 74q50 -4 100 0t100 -2V80H0z" fill="#7aa098"/><path d="M0 74q50 -4 100 0t100 -2" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".8"/>` + sand(u, 78, H, '#c8bc98', '#6a6450', 21, '#fff8e8');
    // the chest in three quarters: front, the side running back, the lid with its gap
    const cx = 92;
    const chest = shadow(u, 76, 126, 50, .5, 5) + `<g filter="url(#drop${u})"><path d="M44 86h86v38h-86z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".7"/><path d="M130 86l24 -10v38l-24 10z" fill="#5a3a1c" stroke="#140a04" stroke-width=".6"/>`
      + `<path d="M42 86q44 -26 90 0l24 -10q-44 -24 -88 -2z" fill="#7a5028" stroke="#140a04" stroke-width=".6"/><path d="M42 86h90" stroke="#ff4a3a" stroke-width="1.6"/>`
      + [56, 86, 116].map(x => `<path d="M${x} 66q2 10 0 58" stroke="url(#iron${u})" stroke-width="4" fill="none"/>` + [76, 92, 106, 118].map(y => `<circle cx="${x}" cy="${y}" r=".8" fill="#c8d0d8"/>`).join('')).join('')
      + `<path d="M140 80v40M150 77v40" stroke="url(#iron${u})" stroke-width="3"/><rect x="${cx - 6}" y="88" width="12" height="12" rx="1" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><path d="M${cx} 92v4" stroke="#1a0e06" stroke-width="1.6"/></g>`
      + barn(48, 120, 2) + barn(52, 122, 1.4) + barn(146, 112, 1.8)
      + glow(u, 88, 84, 50, 10, '#ff3a2a', .7) + glow(u, 88, 76, 30, 16, '#ff6a4a', .35)
      + [[46, 88], [130, 88], [70, 88]].map(([x, y]) => `<path d="M${x} ${y}q-1 6 -2 12" stroke="#e8dcb8" stroke-width=".8" fill="none" opacity=".8"/>` + spray(x - 4, y + 6, 6, 10, 6, x, '#e8dcb8')).join('');
    const loose = [[72, 132], [82, 130], [124, 134]].map(([x, y]) => shadow(u, x, y + 1.6, 4, .5, 1) + `<ellipse cx="${x}" cy="${y}" rx="4" ry="1.6" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".4"/>`).join('')
      + shadow(u, 104, 133, 8, .5, 1.4) + `<g transform="translate(100 130) rotate(-8)"><circle r="3" fill="none" stroke="url(#iron${u})" stroke-width="1.4"/><path d="M3 0h12v2.4M12 0v3" stroke="url(#iron${u})" stroke-width="1.4" fill="none"/></g>`;
    const light = glow(u, 160, 30, 60, 40, '#f4fff0', .2) + gloom(u, 100, 140, 100, 280, .4, '#141a14');
    return [back, chest + loose + light];
  },

  // Part of the ship, part of the crew: a calm wooden face, eyes closed, comes up out of the planks of the ghost ship's
  // bulwark, the grain flowing round brow, cheek and nose; two pale souls sink into the wood on either side.
  'Часть корабля — часть команды': u => {
    const wall = woodTex(u, 0, 26, W, 140, '#5a4a36', '#2a2018', '#0e0a06', 9, false, 11) + `<rect y="18" width="200" height="8" fill="url(#oak${u})"/><path d="M0 18h200" stroke="#c8e8d8" stroke-width=".7" opacity=".7"/>`
      + sky(u, 0, 18, [[0, '#1a2e2a'], [1, '#4a6a60']]).replace('<rect', '<rect') + `<path d="M40 0L60 18M160 0L140 18" stroke="#2a2a20" stroke-width=".6"/>` + woodTex(u, 0, 166, W, H - 166, '#4a3e2e', '#1e180e', '#0a0806', 9, false, 4);
    // the face: carved relief in the planks' own wood — brow, closed lids, nose, cheekbones, lips, chin
    const fg = uid('pwf' + u);
    const face = `<radialGradient id="${fg}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#9a7a54"/><stop offset=".6" stop-color="#6a5034"/><stop offset="1" stop-color="#3a2a18" stop-opacity="0"/></radialGradient>`
      + `<ellipse cx="100" cy="80" rx="36" ry="44" fill="url(#${fg})"/>`
      + `<path d="M72 64q12 -8 24 -2M104 62q12 -6 24 2" stroke="#2a1a0c" stroke-width="2.4" fill="none"/><path d="M72 62q12 -8 24 -2M104 60q12 -6 24 2" stroke="#c8a070" stroke-width=".8" fill="none"/>`
      + `<path d="M76 72q8 5 16 0M108 72q8 5 16 0" stroke="#1a1006" stroke-width="1.4" fill="none"/><path d="M76 70q8 -3 16 0M108 70q8 -3 16 0" stroke="#b08a5a" stroke-width=".8" fill="none"/>`
      + `<path d="M100 66q-4 14 -6 24q6 4 12 0q-2 -10 -6 -24" fill="#8a6a44" stroke="#2a1a0c" stroke-width=".6"/><path d="M99 68q-3 12 -4 20" stroke="#e0c090" stroke-width=".8" fill="none"/>`
      + `<path d="M74 84q4 8 10 10M126 84q-4 8 -10 10" stroke="#2a1a0c" stroke-width="1" fill="none"/><path d="M90 100q10 4 20 0M92 104q8 3 16 0" stroke="#1a1006" stroke-width="1.2" fill="none"/><path d="M94 112q6 6 12 0" stroke="#2a1a0c" stroke-width="1" fill="none"/>`
      + Array.from({ length: 9 }, (_, k) => `<path d="M38 ${50 + k * 7}q${30 + k} ${k < 4 ? -8 : 8} 62 ${k < 4 ? -6 : 6}t62 ${k < 4 ? 6 : -6}" stroke="#2a1a0c" stroke-width=".4" fill="none" opacity=".5"/>`).join('')
      + `<path d="M84 50l-4 -12M118 104l6 10" stroke="#140a04" stroke-width=".8"/>`;
    const growth = barn(58, 60, 2.4) + barn(62, 64, 1.6) + barn(144, 96, 2.2) + barn(140, 100, 1.4) + barn(150, 58, 1.8) + `<path d="M54 100q-2 -6 2 -10M54 100q4 -4 6 -2" stroke="#e88a7a" stroke-width="1.2" fill="none"/>`;
    const souls = [[30, 80], [172, 76]].map(([x, y]) => soul(u, `M${x} ${y - 16}q4 8 0 16`, 4) + glow(u, x, y, 8, 8, '#bff8e0', .7)).join('');
    const ropes = `<rect x="16" y="50" width="30" height="5" fill="url(#oak${u})"/>` + rope('M26 54Q40 140 172 152', 1.2) + rope('M36 54Q50 136 172 156', 1.1) + `<circle cx="174" cy="154" r="3.4" fill="none" stroke="url(#iron${u})" stroke-width="1.6"/>` + coil(150, 196, 16, 4) + weed(40, 200, 10, '#2a5a3a', 5);
    const fog = grad('ppf' + u, [[0, '#b8f0d8', .3], [1, '#b8f0d8', 0]]) + `<rect y="0" width="200" height="30" fill="url(#ppf${u})"/>`;
    const light = glow(u, 100, 70, 70, 60, '#bff8e0', .15) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [wall + fog, face + growth + souls + ropes + light];
  },

  // The black spot: a right palm held up to us, fingers up; in its middle a burnt black spot with a charred rim, dark
  // veins creeping out from it towards the fingers; sea water runs down to the wrist; the ghost ship's rail in fog.
  'Чёрная метка': u => {
    const back = sky(u, 0, H, [[0, '#2a4a42'], [.5, '#14261f'], [1, '#060c0a']]) + `<path d="M0 104h200v12h-200z" fill="#2a2a20" opacity=".7"/>` + Array.from({ length: 10 }, (_, k) => `<rect x="${k * 21 + 3}" y="116" width="4" height="22" fill="#1e1a14" opacity=".6"/>`).join('')
      + grad('pmf' + u, [[0, '#a8d8c8', 0], [.5, '#a8d8c8', .25], [1, '#a8d8c8', 0]]) + `<rect y="80" width="200" height="80" fill="url(#pmf${u})"/>` + woodTex(u, 0, 180, W, H - 180, '#3a3226', '#141008', '#060402', 9, false, 3);
    const sk = uid('pps' + u);
    const skin = `<linearGradient id="${sk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b494"/><stop offset=".6" stop-color="#b08868"/><stop offset="1" stop-color="#7a5a40"/></linearGradient>`;
    const finger = (x, y0, len, w, a) => `<g transform="rotate(${a} ${x} ${y0})"><rect x="${x - w / 2}" y="${y0 - len}" width="${w}" height="${len + 6}" rx="${w / 2}" fill="url(#${sk})" stroke="#5a3a24" stroke-width=".6"/><path d="M${x - w * .3} ${y0 - len * .35}q${w * .3} 1.4 ${w * .6} 0M${x - w * .3} ${y0 - len * .7}q${w * .3} 1.2 ${w * .6} 0" stroke="#8a5a40" stroke-width=".5" fill="none"/><path d="M${x - w * .32} ${y0 - len + 2}q${w * .32} -1.6 ${w * .64} 0v${w * .5}q${w * .32} 1 ${-w * .64} 0z" fill="#e8c8b0" stroke="#a87a5a" stroke-width=".3" opacity=".7"/></g>`;
    const handBig = skin + `<path d="M84 196l-2 -60h40l-2 60z" fill="#2a3a4a" stroke="#0a1018" stroke-width=".6"/><path d="M80 140h44v10h-44z" fill="#e8e0d0" stroke="#8a8270" stroke-width=".5"/>`
      + `<path d="M64 74q0 -8 8 -8h56q8 0 8 8l-4 46q-2 18 -32 20q-30 -2 -32 -20z" fill="url(#${sk})" stroke="#5a3a24" stroke-width=".7"/>`
      + finger(74, 72, 30, 13, -6) + finger(91, 70, 38, 14, -2) + finger(108, 70, 36, 14, 2) + finger(124, 74, 28, 12, 7)
      + `<g transform="rotate(-38 70 110)"><rect x="63" y="76" width="14" height="38" rx="7" fill="url(#${sk})" stroke="#5a3a24" stroke-width=".6"/><path d="M66 80q4 -2 8 0v6q-4 1 -8 0z" fill="#e8c8b0" opacity=".7"/></g>`
      + `<path d="M74 96q26 10 52 -2M80 112q20 6 40 -4M104 78q-4 20 -2 40" stroke="#8a5a40" stroke-width=".6" fill="none"/>`;
    const spot = `<path d="M90 94q4 -8 12 -6q10 0 10 10q-2 10 -12 10q-10 -2 -10 -14z" fill="#0a0604"/><path d="M90 94q4 -8 12 -6q10 0 10 10q-2 10 -12 10q-10 -2 -10 -14z" fill="none" stroke="#5a2a10" stroke-width="2.4" opacity=".8"/>`
      + [[100, 88, 92, 70], [108, 90, 112, 68], [94, 92, 76, 74], [110, 98, 126, 80], [96, 104, 80, 116]].map(([a, b, c, d]) => `<path d="M${a} ${b}Q${(a + c) / 2 + 3} ${(b + d) / 2} ${c} ${d}" stroke="#2a1a14" stroke-width=".9" fill="none" opacity=".75"/>`).join('');
    const drops = [[70, 120], [126, 116], [86, 136], [116, 136]].map(([x, y]) => `<path d="M${x} ${y}q1 8 0 14" stroke="#c8fff0" stroke-width=".8" fill="none" opacity=".7"/><ellipse cx="${x}" cy="${y + 16}" rx=".9" ry="1.4" fill="#c8fff0" opacity=".8"/>`).join('');
    const light = glow(u, 100, 50, 60, 40, '#c8fff0', .2) + gloom(u, 100, 160, 100, 280, .5, '#020806');
    return [back, handBig + spot + drops + light];
  },

  // Recruiting the drowned: under the Dutchman's dark hull a rope ladder hangs, grown with weed; a drowned sailor climbs
  // it, his hat in his other hand, hair and coat floating up; deeper, a second one rises towards it.
  'Вербовка утопленников': u => {
    const back = underwater(u, 0, 13);
    const hull = `<path d="M10 0h180q-20 30 -90 40q-70 -10 -90 -40z" fill="#14201c" stroke="#06100c" stroke-width=".8"/><path d="M96 38h8v10h-8z" fill="#0a1410"/><path d="M20 4q80 40 160 0" stroke="#6aa898" stroke-width=".7" fill="none" opacity=".6"/>`
      + Array.from({ length: 14 }, (_, k) => barn(30 + k * 11, 14 + Math.sin(k) * 4 + (k > 6 ? (13 - k) * 2 : k * 2), 1.6)).join('') + weed(60, 30, -14, '#3a6a4a', 3) + weed(140, 30, -16, '#3a6a4a', 5);
    // the rope ladder from the side down to its weight, weed on it streaming up
    const ladder = `<path d="M118 30V150M134 30V150" stroke="#6a5a3a" stroke-width="1.2"/>` + Array.from({ length: 10 }, (_, k) => `<path d="M118 ${40 + k * 11}h16" stroke="#7a6a44" stroke-width="1.6"/>`).join('') + `<rect x="120" y="150" width="12" height="7" rx="2" fill="url(#iron${u})"/>`
      + [[120, 60], [132, 92], [119, 120]].map(([x, y]) => `<path d="M${x} ${y}q4 -8 0 -16q-4 -6 2 -12" stroke="#3a7a5a" stroke-width="1.2" fill="none"/>`).join('');
    // the drowned man: dark against the light, rim lit from above, hair and coat tails floating up, bubbles at his mouth
    const man = (x, y, s, a, hat) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(${a})" filter="url(#drop${u})"><path d="M-8 -20q-2 -14 8 -16q10 2 8 16l4 30q-12 6 -24 0z" fill="#16201e"/><path d="M-8 -20q-2 -14 8 -16" stroke="#9ff0d0" stroke-width=".8" fill="none"/>`
      + `<path d="M-12 10q-6 -10 -10 -26M12 10q8 -8 10 -24" stroke="#16201e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-4 10l-4 26M4 10l6 24" stroke="#16201e" stroke-width="5" stroke-linecap="round"/>`
      + `<circle cx="0" cy="-42" r="7" fill="#2a3a36"/><path d="M-6 -46q-4 -8 0 -16M0 -48q0 -10 4 -14M5 -46q4 -8 8 -10" stroke="#2a3a36" stroke-width="1.4" fill="none"/><path d="M-6 -45q6 -6 12 0" stroke="#9ff0d0" stroke-width=".6" fill="none"/>`
      + `<path d="M-8 -26l-14 -20M8 -26l12 -22" stroke="#16201e" stroke-width="3.6" stroke-linecap="round"/>` + barn(-8, -28, 1.4) + barn(8, -27, 1.2)
      + (hat ? `<path d="M20 -48q8 -8 16 0q-4 -6 -8 -6t-8 6z" fill="#0e1412"/>` : '') + `</g>`;
    const drowned = man(112, 104, 1.05, 4, true) + bubbles(8, 106, 50, 10, 18, 3) + `<g opacity=".55">${man(70, 140, .6, -10, false)}</g>`;
    const life = fish(30, 80, 1.1, 1, '#7aa8a0') + fish(40, 92, .9, 1, '#6a9890') + fish(172, 120, 1, -1, '#7aa8a0') + weed(30, 200, 30, '#2a5a3a', 9) + weed(170, 210, 26, '#2a5a3a', 11, -1)
      + grad('pbt' + u, [[0, '#0a1a16', 0], [1, '#0a1a16', .8]]) + `<rect y="160" width="200" height="${H - 160}" fill="url(#pbt${u})"/>`;
    const light = gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [back + hull, ladder + drowned + life + light];
  },

  // Sea growth: under water, close to the Dutchman's side: a breach in her planks is closing up as fresh coral and
  // barnacles grow out of the wood round its edges; the last dark crack lets out a stream of bubbles.
  'Морские наросты': u => {
    const back = underwater(u, -6, 17);
    const planks = woodTex(u, 0, 40, W, 200, '#3a4a40', '#1a2620', '#08100c', 9, false, 7) + nails(Array.from({ length: 36 }, (_, k) => [8 + (k % 9) * 23, 44 + Math.floor(k / 9) * 18]), '#0a1410', .8)
      + `<path d="M0 40h200" stroke="#9ff0d0" stroke-width="1" opacity=".5"/>` + Array.from({ length: 12 }, (_, k) => { const r = R(k + 4); return `<path d="M${f1(r() * 180)} ${f1(46 + r() * 70)}q6 -2 12 0" stroke="#c8fff0" stroke-width=".6" fill="none" opacity=".4"/>`; }).join('');
    // the breach: broken plank ends, the dark crack in the middle, coral and barnacles closing it from the edges
    const breach = `<path d="M54 76l14 -10l20 4l18 -8l20 6l16 -4l10 16l-8 14l6 12l-14 10l-20 -4l-18 6l-20 -6l-18 4l-10 -14l6 -12z" fill="#0a1410"/>`
      + `<path d="M54 76l14 -10l20 4l18 -8l20 6l16 -4l10 16" stroke="#8aa898" stroke-width="1" fill="none"/>` + [[56, 78, -20], [146, 76, 20], [62, 110, 30], [144, 112, -20]].map(([x, y, a]) => `<path d="M${x} ${y}l${a > 0 ? 8 : -8} ${a > 0 ? -4 : 4}" stroke="#a89878" stroke-width="2"/>`).join('');
    const coral = (x, y, a, s) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M-5 0q-2 -5 0 -8q2 -3 4 -1q1 -4 4 -3q3 1 2 5q3 0 3 3q0 3 -3 4z" fill="#c86a5a" stroke="#6a2a20" stroke-width=".4"/>${[[-3, -7], [2, -9], [5, -4]].map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="1.1" fill="#ffd8c8"/>`).join('')}<path d="M-4 -1q4 2 8 0" stroke="#4a1a14" stroke-width=".5" fill="none" opacity=".6"/></g>`;
    const growth = [[62, 82, 30, 1.1], [80, 70, 10, 1], [104, 66, -10, 1.2], [128, 70, 20, 1], [148, 84, 60, 1.1], [140, 108, 150, 1], [112, 114, 180, 1.1], [84, 112, 200, 1], [62, 104, 230, 1.1]].map(([x, y, a, s]) => coral(x, y, a, s)).join('')
      + [[70, 78, 2.4], [92, 70, 2], [118, 68, 2.6], [138, 78, 2.2], [150, 96, 2], [128, 112, 2.4], [96, 114, 2.2], [68, 106, 2]].map(([x, y, r]) => barn(x, y, r)).join('')
      + `<path d="M74 90q26 -6 54 2q-2 6 -20 6q-20 -2 -34 -8z" fill="#020606"/>`;
    const bub = bubbles(22, 104, 30, 60, 60, 13, '#e8fff8');
    const life = weed(20, 260, 30, '#2a5a3a', 3) + weed(180, 270, 26, '#2a5a3a', 5, -1) + fish(176, 140, 1, -1, '#7aa8a0');
    const light = glow(u, 100, 70, 80, 40, '#c8fff0', .15) + gloom(u, 100, 140, 100, 280, .55, '#020806');
    return [back + planks, breach + growth + bub + life + light];
  },

  // Norrington aboard: on a barrel head, one on another: the folded uniform with an epaulette hanging over the edge,
  // the wig, the admiral's hat; his sword leans against the barrel; a cobweb, fog, a soft beam from above.
  'Норрингтон на борту': u => {
    const deck0 = ghostDeck(u) + shafts(u, 100, -10, [[60, 120, 140, 120]], '#c8fff0', .16);
    const barrel = shadow(u, 100, 150, 46, .55, 5) + `<g filter="url(#drop${u})"><path d="M60 106q-6 24 0 48h80q6 -24 0 -48z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".7"/>${[-26, -9, 9, 26].map(d => `<path d="M${100 + d} 108q${d * .15} 22 0 46" stroke="#2a1608" stroke-width=".6" fill="none"/>`).join('')}`
      + `<path d="M58 116q42 6 84 0M58 144q42 6 84 0" stroke="url(#iron${u})" stroke-width="3" fill="none"/><ellipse cx="100" cy="106" rx="40" ry="8" fill="#6a4a2c" stroke="#140a04" stroke-width=".6"/></g>` + barn(64, 132, 2) + barn(136, 128, 1.8);
    // the folded coat, an epaulette hanging over the edge; the wig on it; the hat on top
    const coat = `<g filter="url(#drop${u})"><path d="M66 104q34 -10 68 0l-2 -10q-32 -8 -64 0z" fill="#1e2a4a" stroke="#0a1020" stroke-width=".6"/><path d="M68 94q32 -8 64 0" stroke="#c9a048" stroke-width="1.2" fill="none"/>${[78, 88, 98, 108, 118].map(x => `<circle cx="${x}" cy="${f1(97 - Math.sin((x - 66) / 68 * Math.PI) * 2)}" r="1" fill="#b8963a"/>`).join('')}</g>`
      + `<g transform="translate(132 98)" filter="url(#drop${u})"><ellipse rx="7" ry="3" fill="#b8963a"/>${Array.from({ length: 8 }, (_, k) => `<path d="M${-5 + k * 1.4} 1v${8 + (k % 2) * 3}" stroke="#a8862a" stroke-width=".7"/>`).join('')}</g>`;
    const wig = `<g filter="url(#drop${u})"><path d="M74 92q-4 -14 26 -18q30 4 26 18q-10 -4 -26 -4t-26 4z" fill="#e8e4dc" stroke="#9a948a" stroke-width=".5"/>${[78, 84, 90, 110, 116, 122].map(x => `<path d="M${x} 90q-2 -4 2 -6q4 2 0 6" stroke="#b8b2a8" stroke-width=".6" fill="none"/>`).join('')}<path d="M120 90q8 4 6 10" stroke="#e8e4dc" stroke-width="3" fill="none"/></g>`;
    const hat = `<g filter="url(#drop${u})"><path d="M62 74q38 -26 76 0q-10 6 -38 6t-38 -6z" fill="#14161c" stroke="#06080a" stroke-width=".6"/><path d="M62 74q38 -26 76 0" stroke="#b8963a" stroke-width="1.8" fill="none"/><path d="M84 64q16 -10 32 0" stroke="#1e2026" stroke-width="5" fill="none"/>`
      + `<circle cx="100" cy="58" r="3.4" fill="#2a3a6a" stroke="#b8963a" stroke-width=".8"/><path d="M76 62q24 -16 48 0" stroke="#c8e8d8" stroke-width=".6" fill="none" opacity=".6"/></g>`;
    const sword = `<g transform="translate(150 100) rotate(18)" filter="url(#drop${u})"><path d="M0 4v80" stroke="url(#silver${u})" stroke-width="2.4"/><path d="M-6 4h12" stroke="#a8862a" stroke-width="2.4"/><path d="M-5 4q-4 -8 4 -12" stroke="#a8862a" stroke-width="1.2" fill="none"/><rect x="-1.6" y="-10" width="3.2" height="13" rx="1" fill="#e8e0d0"/><circle cy="-11" r="2.2" fill="#a8862a"/></g>`;
    const web = `<path d="M138 74L142 104M138 74L150 92M142 84q4 2 6 -2M140 92q5 2 8 -2" stroke="#e8f8f0" stroke-width=".3" fill="none" opacity=".7"/>` + spray(70, 100, 60, 10, 8, 5, '#c8fff0');
    const fog = grad('pnf' + u, [[0, '#b8f0d8', 0], [.5, '#b8f0d8', .2], [1, '#b8f0d8', 0]]) + `<rect y="130" width="200" height="40" fill="url(#pnf${u})"/>`;
    const light = glow(u, 100, 70, 50, 40, '#c8fff0', .18) + gloom(u, 100, 150, 100, 280, .5, '#020806');
    return [deck0, barrel + coat + wig + hat + sword + web + fog + light];
  },

  // The heart beats: close and from above, the chest open across the whole picture; on the dark velvet inside lies the
  // heart itself, bound with a strap and a small lock, wet and shining, its beat a soft double outline.
  'Сердце бьётся': u => {
    const hz = 34;
    const back = haze(u, hz, 150, 16, 19) + sand(u, 46, H, '#d8cca8', '#7a705a', 23, '#fff8e8') + `<path d="M0 46q60 -4 120 0t80 -2" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".8"/>`
      + tint(require('./art3.cjs').palm(30, 60, .55), [.7, .9, .82], [0, .03, .02], .6);
    // the chest: the lid raised behind with a pattern inside, the box open, velvet lining
    const lid = `<path d="M34 86L44 50h112l10 36z" fill="#5a3a1c" stroke="#140a04" stroke-width=".7"/><path d="M40 82L48 54h104l8 28z" fill="#3a1410"/>`
      + `<g opacity=".6">${[0, 1, 2].map(k => `<path d="M${60 + k * 30} 60q10 8 0 18q-10 -10 0 -18z" fill="none" stroke="#c9a048" stroke-width=".7"/>`).join('')}</g>` + [70, 130].map(x => `<path d="M${x} 50l-2 36" stroke="url(#iron${u})" stroke-width="3"/>`).join('');
    const box = shadow(u, 92, 136, 72, .5, 6) + `<path d="M30 86h140l-6 46h-128z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".7"/><path d="M36 88h128l-4 10h-120z" fill="#4a0e14"/><path d="M38 96q62 8 124 0l-4 30h-116z" fill="#5a1418"/>`
      + [56, 100, 144].map(x => `<path d="M${x} 86v46" stroke="url(#iron${u})" stroke-width="3.4"/>`).join('') + `<path d="M30 86h140" stroke="url(#brass${u})" stroke-width="1.6"/>`;
    // the heart: an organ, not a sign: the great vessels at the top, the coronary veins, a wet shine; bound
    const hg = uid('pht' + u);
    const heart = `<radialGradient id="${hg}" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#e86a5a"/><stop offset=".55" stop-color="#a8201a"/><stop offset="1" stop-color="#4a0606"/></radialGradient>`
      + `<path d="M98 80q-4 -8 2 -12q6 2 4 10M108 80q2 -10 10 -12q4 4 -2 12M88 82q-6 -6 -4 -12q6 0 8 10" fill="#8a2a2a" stroke="#3a0606" stroke-width=".5"/>`
      + `<path d="M74 92q2 -14 22 -12q10 0 14 4q12 -6 22 2q12 10 2 26q-12 14 -32 16q-22 -6 -28 -36z" fill="url(#${hg})" stroke="#3a0606" stroke-width=".7"/>`
      + `<path d="M106 86q-4 16 -14 32M114 90q4 12 -2 24M92 90q-6 6 -8 14" stroke="#5a0a0a" stroke-width="1.2" fill="none"/><path d="M80 94q8 -10 18 -8" stroke="#ffd0c8" stroke-width="2" fill="none" opacity=".75"/><circle cx="122" cy="96" r="1.6" fill="#ffffff" opacity=".7"/>`
      + `<path d="M72 106q34 8 66 -4" stroke="#3a2010" stroke-width="5" fill="none"/><path d="M72 104q34 8 66 -4" stroke="#7a5030" stroke-width="1" fill="none"/><rect x="100" y="104" width="8" height="8" rx="1.4" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>`
      + `<path d="M74 92q2 -14 22 -12q10 0 14 4q12 -6 22 2q12 10 2 26q-12 14 -32 16q-22 -6 -28 -36z" fill="none" stroke="#ff8a7a" stroke-width="3" opacity=".25" transform="translate(-103 -107) scale(1.06) translate(97.2 101)" filter="url(#soft${u})"/>`
      + glow(u, 104, 104, 60, 40, '#ff3a2a', .45);
    const key = shadow(u, 154, 128, 8, .5, 1.6) + `<g transform="translate(150 124) rotate(-10)"><circle r="3" fill="none" stroke="url(#iron${u})" stroke-width="1.4"/><path d="M3 0h12v2.4M12 0v3" stroke="url(#iron${u})" stroke-width="1.4" fill="none"/></g>`;
    const light = glow(u, 150, 16, 50, 30, '#f4fff0', .25) + gloom(u, 100, 140, 100, 280, .4, '#141a14');
    return [back + lid, box + heart + key + light];
  },

  // The maelstrom: from above, a funnel of water the width of the picture spirals down to a black pit; the enemy
  // ship heels over on its slope and slides in; a shot flying from the upper left is blown aside and falls short.
  'Водоворот': u => {
    const hz = 42;
    const back = storm(u, hz, 23) + bolt(96, 2, 36);
    const mg = uid('pmg' + u);
    const funnel = `<radialGradient id="${mg}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000604"/><stop offset=".25" stop-color="#0a1e1a"/><stop offset=".7" stop-color="#2a5a50"/><stop offset="1" stop-color="#3a6a60" stop-opacity="0"/></radialGradient>`
      + `<ellipse cx="100" cy="95" rx="100" ry="44" fill="url(#${mg})"/>` + `<g transform="translate(100 95) scale(1 1.4)">${put('maelstrom', 0, 0, 1, 0, u, false)}</g>`
      + [[60, 84, 10], [140, 104, -20], [96, 112, 40]].map(([x, y, a]) => `<rect x="${x - 5}" y="${y - 1.4}" width="10" height="2.8" fill="#5a4030" transform="rotate(${a} ${x} ${y})"/>`).join('') + glow(u, 140, 70, 40, 20, '#c8fff0', .2);
    const ship = tilted('endeavour', 146, 84, .85, -24, u, true, true);
    const ballT = shot(u, 22, 50, 82, 82, 2.4, '#d8e8e0');
    const light = rain(60, 3) + gloom(u, 100, 150, 100, 280, .5, '#020806');
    return [back, funnel + ship + ballT + light];
  },

  // The answer from the deep: on the enemy's deck a thick tentacle comes over the rail out of the foaming sea and sweeps
  // the deck: two barrels topple, a third flies overboard, a coil of rope unrolls, a sailor's cap flies.
  'Ответ из пучины': u => {
    const hz = 70;
    const back = haze(u, hz, 160, 20, 29).replace(/#a8c4b8/g, '#98aca4') + `<path d="M30 0L60 80M170 0L140 80" stroke="#3a3a30" stroke-width=".7"/>`;
    const rail = `<rect y="84" width="200" height="16" fill="#4a3a28"/>` + woodTex(u, 0, 84, W, 16, '#6a5038', '#3a2a1a', '#140a04', 4, false, 2) + `<path d="M0 84h200" stroke="#e8f4ec" stroke-width="1" opacity=".7"/><path d="M0 81h200v3h-200z" fill="#7a5c40"/>`
      + K.tableTop(u, 100, H - 100, '#8a6a48', '#4a3424', 31);
    const t = tentacle(u, [[176, 60], [160, 66], [140, 86], [110, 110], [80, 116], [56, 108], [48, 96]], 30, 6, 1) + `<path d="M150 74q18 -4 34 4" stroke="#ffffff" stroke-width="2" fill="none" opacity=".8"/>` + spray(140, 62, 50, 20, 30, 7)
      + [[120, 112], [96, 118], [70, 116]].map(([x, y]) => `<path d="M${x} ${y}q1 6 0 10" stroke="#e8fff8" stroke-width=".7" fill="none" opacity=".7"/>`).join('');
    const bar = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})" filter="url(#drop${u})"><path d="M-10 10q-3 -10 0 -20h20q3 10 0 20z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M-11 4h22M-11 -4h22" stroke="url(#iron${u})" stroke-width="1.6"/></g>`;
    const bf = uid('pab' + u);
    const chaos = bar(40, 116, -40) + bar(150, 120, 30) + blurF(bf, 1.4) + `<g filter="url(#${bf})" opacity=".85">${bar(176, 70, 60)}</g>` + `<path d="M150 82l20 -8" stroke="#e8f4ec" stroke-width="3" opacity=".3"/>`
      + rope('M120 130q-20 6 -30 -2q-8 -8 4 -12q14 -2 10 10', 1.2) + `<g transform="translate(70 70) rotate(-30)"><path d="M-6 2q0 -8 6 -8t6 8z" fill="#3a4a6a"/><path d="M-6 2h12" stroke="#e8e0d0" stroke-width="1.2"/></g>`
      + spray(30, 100, 140, 30, 30, 11, '#e8fff8') + [[60, 150, 20], [140, 160, 24]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .12}" fill="#a8c8c0" opacity=".25"/>`).join('');
    const light = gloom(u, 100, 150, 100, 280, .45, '#0a120e');
    return [back + rail, chaos + t + light];
  },

  // Go deep: the Dutchman's stern stands up out of the sea, her bow already under; the enemy's shot passes over and
  // throws up a column of water astern of her; the enemy far off in the fog with the smoke of her gun.
  'Уйти на глубину': u => {
    const hz = 96;
    const back = haze(u, hz, 120, 40, 37) + `<g opacity=".5">${sailing('endeavour', 32, 82, .5, 0, u)}</g>` + smoke(u, 44, 80, .35, 4, 1, 5, '#e8f0ec', 10)
      + `<path d="M110 52q20 -4 34 -2" stroke="#d8e8e0" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
    const ship = pitched('dutch', 98, 100, 2.2, -32, u, 124) + `<circle cx="140" cy="62" r="1.4" fill="#d8ffe8"/>` + glow(u, 140, 62, 6, 6, '#9ff0d0', .7);
    const ring = `<ellipse cx="100" cy="124" rx="52" ry="7" fill="#e8fff8" opacity=".35"/><ellipse cx="100" cy="124" rx="46" ry="5" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".8"/>` + spray(50, 116, 100, 12, 40, 7);
    const col = put('splash', 162, 116, .5, 0, u, false) + `<ellipse cx="162" cy="120" rx="10" ry="2" fill="#ffffff" opacity=".6"/>`;
    const floaters = bubbles(20, 30, 132, 140, 40, 9, '#e8fff8') + weed(60, 140, 8, '#3a6a4a', 3) + barn(130, 142, 2);
    const light = glow(u, 120, 40, 50, 40, '#f4fff0', .25) + gloom(u, 100, 140, 100, 280, .45, '#04140f');
    return [back, ship + ring + col + floaters + light];
  }
};

const CAM = {};
for (const k of Object.keys(SCENES)) CAM[k] = { x: 0, y: 0, w: 200 };
module.exports = { SCENES, CAM };
