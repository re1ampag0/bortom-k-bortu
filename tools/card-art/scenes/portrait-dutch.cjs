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
    + `<circle cx="0" cy="33" r="3" fill="url(#iron${u})"/></g>`;
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
    const ship = tint(tilted('endeavour', 112, 98, 1.55, 7, u, true, false), [.5, .58, .56], [0, .02, .02], .5) + `<path d="M74 122q38 4 76 -6" stroke="#f4fff8" stroke-width="1.4" fill="none" opacity=".8"/>`
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
    const back = haze(u, hz, 132, 54, 7) + `<g opacity=".45">${sailing('endeavour', 34, 98, .5, 0, u)}</g>`;
    const ship = pitched('dutch', 106, 96, 2.3, 30, u, 124);
    const pour = Array.from({ length: 12 }, (_, k) => { const x = 60 + k * 8, y = 64 + k * 5; return `<path d="M${x} ${y}q3 10 -1 20t1 ${f1(124 - y - 20)}" stroke="#e8fff8" stroke-width="${f2(.6 + (k % 3) * .3)}" fill="none" opacity=".55"/>`; }).join('')
      + spray(56, 50, 100, 70, 80, 9) + `<g opacity=".5">${put('splash', 76, 116, .6, -10, u, false)}${put('splash', 130, 122, .5, 10, u, false)}</g>`;
    const fire = muzzle(u, 70, 74, 200, .7) + smoke(u, 70, 78, .5, 5, -1.2, 5, '#e8f4ec', 10);
    const ring = `<ellipse cx="112" cy="124" rx="56" ry="7" fill="#e8fff8" opacity=".35"/><ellipse cx="112" cy="124" rx="50" ry="5" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".8"/>` + spray(60, 118, 110, 12, 40, 3);
    const light = glow(u, 132, 54, 50, 50, '#f4fff0', .25) + gloom(u, 100, 140, 100, 280, .45, '#04140f');
    return [back, ship + pour + fire + ring + light];
  },

  // The harvest: low on the ghost ship's deck three heaps lie apart — a cutlass and a red kerchief, an officer's sword
  // and a hat with a cockade, a hatchet and a knitted cap; from each a pale green soul streams to the still bell.
  'Жатва': u => {
    const deck0 = ghostDeck(u, 118, 54);
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
    const deck0 = ghostDeck(u, 118, 54);
    const post = x => `<path d="M${x - 4} 130V36h8v94z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M${x - 2} 30v100" stroke="#a8906a" stroke-width=".5" opacity=".6"/>` + barn(x, 60, 2.4) + barn(x - 1, 92, 2) + barn(x + 2, 110, 1.6) + shadow(u, x, 131, 9, .55, 2);
    const frame = post(50) + post(150) + `<path d="M46 36h108v8h-108z" fill="url(#oak${u})" stroke="#140a04" stroke-width=".6"/><path d="M46 36h108" stroke="#c8e8d8" stroke-width=".6" opacity=".6"/>` + barn(80, 34, 1.6) + barn(124, 34, 1.8)
      + `<path d="M150 70l6 0l0 3l-6 0z" fill="url(#iron${u})"/>`;
    const f = uid('pbt' + u);
    const theBell = `<path d="M100 44v4" stroke="url(#iron${u})" stroke-width="3"/>` + bell(u, 100, 48, 1.55, -14)
      + `<path d="M118 52Q140 58 150 72" stroke="#c8b898" stroke-width=".9" fill="none"/>` + blurF(f, 1.6) + `<path d="M58 92q30 22 70 6" stroke="#c8fff0" stroke-width="3" fill="none" opacity=".25" filter="url(#${f})"/>`
      + glow(u, 116, 92, 12, 8, '#fff0c0', .6);
    const puddles = [[80, 124, 22], [124, 128, 18]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f1(w * .16)}" fill="#7aa8a0" opacity=".35"/>` + [.4, .7].map(k => `<ellipse cx="${x}" cy="${y}" rx="${f1(w * k)}" ry="${f1(w * k * .14)}" fill="none" stroke="#e8fff8" stroke-width=".5" opacity=".7"/>`).join('')).join('');
    const fog = grad('pkf' + u, [[0, '#b8f0d8', 0], [.5, '#b8f0d8', .2], [1, '#b8f0d8', 0]]) + `<rect y="126" width="200" height="40" fill="url(#pkf${u})"/>`;
    const light = glow(u, 100, 70, 60, 50, '#bff8e0', .15) + gloom(u, 100, 140, 100, 280, .5, '#020806');
    return [deck0, frame + theBell + puddles + fog + light];
  },

  // skeleton (picture units 0–280): path A, orig k 1.6 tx -68 ty 6; no horizon in the frame: our eye is level with his,
  // y≈75; he stands 0.9 m from us (s≈228 units/m), feet far below the frame; light: a narrow green shaft from the hatch
  // grating upper left onto his face and shoulder, the rest in shadow; shadows fall down and to the right
  // wall: the hull planking behind him (1.15 m, s≈180): strakes 0.2 m high, a frame (rib) at x 168–190 with the ring
  // bolt; the deck beam overhead y 0–17 with a knee down to the frame (all background, corners allowed)
  // him: an old sailor, knitted cap y 40–58, face ¾ to our left, eyes y 72, grey stubble, barnacles grown into the
  // right cheek and the left shoulder; his back touches the planking (a contact shadow on the wall at his sides)
  // pike: held upright in his right hand (our left), fist at y 134–150, the shaft goes down out of the frame (its butt
  // on the floor), the blade y 48–86 at x 28–52 (below the medal corner)
  // chains: the right shackle's chain hangs to the floor (out of the frame bottom); the left shackle (y 198) is
  // chained to the ring bolt in the frame (x 179, y 176)
  // below the glass: his jacket and belt, the left hand holding a bailing bucket by its rope (bucket y 222–280, dark),
  // barnacles on the planking low left
  'Прихлоп Билл': u => {
    const ey = 72;
    // the hull planking, frames and the deck beam; wet, green-black, barnacle clusters with their own shadows
    let wall = `<rect width="200" height="280" fill="#0e1a16"/>`;
    for (let k = 0, y = 17; y < 280; k++, y += 34) wall += woodTex(u, 0, y, 200, 34, '#22352e', '#13211c', '#060c0a', 34, false, 30 + k) + `<path d="M0 ${y + 33}h200" stroke="#040806" stroke-width="1.6"/><path d="M0 ${y + 1.2}h200" stroke="#5a8a78" stroke-width=".6" opacity=".35"/>`
      + K.nails([[22 + (k * 37) % 40, y + 6], [22 + (k * 37) % 40, y + 27], [96 + (k * 23) % 30, y + 6], [96 + (k * 23) % 30, y + 27]], '#0a1210', .9);
    wall += `<rect x="168" y="17" width="24" height="263" fill="url(#oakH${u})" opacity=".55"/><rect x="168" y="17" width="24" height="263" fill="#10201a" opacity=".6"/><path d="M168.6 17v263" stroke="#5a8a78" stroke-width=".7" opacity=".5"/><path d="M191.4 17v263" stroke="#020403" stroke-width="1.2"/>`
      + `<rect width="200" height="17" fill="#1a2a24"/><rect width="200" height="17" fill="url(#oak${u})" opacity=".35"/><path d="M0 16.4h200" stroke="#020403" stroke-width="1.6"/><path d="M0 1.2h200" stroke="#6a9a88" stroke-width=".6" opacity=".4"/>`
      + `<path d="M150 17h42v22q-24 0 -42 -22z" fill="#1c2e28" stroke="#040806" stroke-width=".7"/><path d="M152 18q14 16 38 19" stroke="#6a9a88" stroke-width=".5" fill="none" opacity=".4"/>` + K.nails([[176, 22], [184, 30], [160, 20]], '#0a1210', 1);
    // the grating's light: a narrow green shaft from the upper left
    const f = 'pbs' + u;
    const beamL = blurF(f, 3.4) + `<path d="M40 0L74 0L136 150L84 150z" fill="#9ff0d0" opacity=".16" filter="url(#${f})" style="mix-blend-mode:screen"/>`;
    // barnacles: cones of different size, a dark mouth, a shadow below-right; on the wall and on him
    const barn = (x, y, r, a = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><ellipse cx="${f2(r * .4)}" cy="${f2(r * .5)}" rx="${f2(r * 1.1)}" ry="${f2(r * .6)}" fill="#000" opacity=".45"/>`
      + `<path d="M${f2(-r)} ${f2(r * .3)}Q${f2(-r * .8)} ${f2(-r * .5)} ${f2(-r * .35)} ${f2(-r * .7)}H${f2(r * .35)}Q${f2(r * .8)} ${f2(-r * .5)} ${f2(r)} ${f2(r * .3)}z" fill="#c8c4b0" stroke="#5a5848" stroke-width=".3"/>`
      + `<path d="M${f2(-r * .55)} ${f2(r * .2)}L${f2(-r * .3)} ${f2(-r * .6)}M0 ${f2(r * .25)}V${f2(-r * .65)}M${f2(r * .55)} ${f2(r * .2)}L${f2(r * .3)} ${f2(-r * .6)}" stroke="#8a8670" stroke-width=".3"/>`
      + `<ellipse cy="${f2(-r * .66)}" rx="${f2(r * .34)}" ry="${f2(r * .14)}" fill="#1a1a14"/><path d="M${f2(-r * .9)} ${f2(r * .1)}Q${f2(-r * .7)} ${f2(-r * .5)} ${f2(-r * .3)} ${f2(-r * .66)}" stroke="#f4f0e0" stroke-width=".4" fill="none" opacity=".7"/></g>`;
    const br = R(21);
    const cluster = (x, y, w, h, n, rmax) => Array.from({ length: n }, () => [x + br() * w, y + br() * h, 1 + br() * rmax]).sort((a, b) => a[1] - b[1]).map(([bx, by, r]) => barn(bx, by, r, (br() - .5) * 30)).join('');
    const wallBarn = cluster(156, 58, 30, 50, 9, 3.6) + cluster(170, 118, 16, 30, 4, 2.6) + cluster(10, 150, 24, 46, 7, 3.4) + cluster(140, 26, 16, 10, 3, 2.2)
      // seaweed hanging from the beam and the knee, drops falling from it
      + [[60, 17, 22], [64, 17, 30], [126, 17, 18], [158, 30, 24]].map(([x, y, l], i) => `<path d="M${x} ${y}q${3 - i} ${l * .4} ${-2 + i} ${l * .7}t${1 + i % 2} ${l * .3}" stroke="#2e5a40" stroke-width="${1.4 - i * .15}" fill="none"/><path d="M${x + .4} ${y}q${3 - i} ${l * .4} ${-2 + i} ${l * .7}" stroke="#7ac0a0" stroke-width=".35" fill="none" opacity=".6"/>`).join('')
      + [[60.6, 44], [127, 40], [64, 56]].map(([x, y]) => `<path d="M${x} ${y}q-.9 1.4 0 2.2q.9 -.8 0 -2.2z" fill="#c8fff0" opacity=".7"/>`).join('');
    // the ring bolt in the frame and the chain from his left shackle
    const ringBolt = `<circle cx="179" cy="172" r="3.4" fill="url(#iron${u})" stroke="#020403" stroke-width=".5"/><circle cx="179" cy="172" r="1.4" fill="#060a08"/><path d="M175.4 175q3.6 8 7.2 0" stroke="#3a2a1a" stroke-width="2.4" fill="none"/><path d="M175.4 175q3.6 8 7.2 0" stroke="#8a6a4a" stroke-width=".7" fill="none"/>`;
    const link = (x, y, a, c = '#6a5a4a') => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><rect x="-3.4" y="-1.9" width="6.8" height="3.8" rx="1.9" fill="none" stroke="#1a120c" stroke-width="2"/><rect x="-3.4" y="-1.9" width="6.8" height="3.8" rx="1.9" fill="none" stroke="${c}" stroke-width="1.1"/><path d="M-2.4 -1.4h3" stroke="#c8a888" stroke-width=".35" opacity=".7"/></g>`;
    const chainPts = (x0, y0, x1, y1, sag, n) => Array.from({ length: n }, (_, i) => { const t = (i + .5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t); const dx = (x1 - x0) / n, dy = (y1 - y0) / n + sag * 4 * (1 - 2 * t) / n; return link(x, y, Math.atan2(dy, dx) * 180 / Math.PI + (i % 2 ? 0 : 0), i % 3 ? '#6a5a4a' : '#8a5a3a'); }).join('');
    // the pike: a dark wet shaft, a rusty spearhead with a side blade, barnacles on the socket
    const pike = `<rect x="38.4" y="84" width="4.4" height="206" fill="url(#oakH${u})" stroke="#060a08" stroke-width=".5"/><rect x="38.4" y="84" width="4.4" height="206" fill="#1a2420" opacity=".5"/><path d="M39.2 84v206" stroke="#7a9a88" stroke-width=".5" opacity=".6"/>`
      + `<g transform="translate(0 4)"><path d="M37.6 82h6v-8h-6z" fill="url(#iron${u})" stroke="#020403" stroke-width=".4"/><path d="M40.6 74L36.4 66L40.6 44L44.8 66z" fill="url(#ironH${u})" stroke="#020403" stroke-width=".5"/><path d="M40.6 46v26" stroke="#c8d8d0" stroke-width=".4" opacity=".7"/>`
      + `<path d="M43 70q8 -2 10 -10q-2 6 -10 6z" fill="url(#iron${u})" stroke="#020403" stroke-width=".4"/><path d="M38 68q-6 2 -9 6l1 2q4 -4 8 -4z" fill="url(#iron${u})" stroke="#020403" stroke-width=".4"/>`
      + `<path d="M38 60q2 4 1 9M43 56q-1 6 1 12M44 77q1 3 -1 5" stroke="#7a3a1a" stroke-width=".8" fill="none" opacity=".7"/>` + `</g>` + barn(42.6, 89, 1.6) + barn(38.8, 92, 1.2);
    // his body: a ragged wet jacket, slumped shoulders; the planking shadow at his sides (he leans on it)
    const jacket = `<path d="M44 300L46 160Q46 132 62 124L90 112L100 116L112 112L140 122Q154 130 156 160L158 300z" fill="#000" opacity=".5" transform="translate(5 4)"/>`
      + `<linearGradient id="pbj${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5a4a"/><stop offset=".4" stop-color="#2a3a30"/><stop offset="1" stop-color="#101a14"/></linearGradient>`
      + `<path d="M46 300L48 162Q48 134 62 126L90 112L100 117L112 112L140 122Q152 130 154 160L156 300z" fill="url(#pbj${u})" stroke="#040806" stroke-width=".7"/>`
      + `<path d="M90 112L100 117L112 112L110 140L100 148L92 140z" fill="#c8c8b0"/><path d="M92 120l16 -1M92 127l17 -1M93 134l15 -1" stroke="#3a4a5a" stroke-width="2"/>`
      + `<path d="M90 112L80 150L96 146L100 117zM112 112L122 150L106 146L100 117z" fill="#34443a" stroke="#040806" stroke-width=".5"/>`
      + `<path d="M62 126Q54 140 54 170M140 122Q148 136 150 166M70 160q4 20 2 40M128 158q-4 22 0 44" stroke="#040806" stroke-width=".9" fill="none" opacity=".7"/><path d="M62 126L90 112" stroke="#9ff0d0" stroke-width="1" opacity=".5"/>`
      + `<path d="M46 300L48 162Q48 140 56 130" stroke="#7aa898" stroke-width=".9" fill="none" opacity=".45"/>`
      + `<rect x="48" y="214" width="108" height="8" fill="#1a1410" stroke="#040806" stroke-width=".5"/><rect x="94" y="212" width="12" height="12" fill="none" stroke="url(#brass${u})" stroke-width="2"/>`
      + cluster(124, 116, 26, 16, 8, 3.2) + `<path d="M132 120q4 10 0 22M138 122q6 8 4 18" stroke="#2e5a40" stroke-width="1.1" fill="none"/>` + cluster(52, 150, 10, 30, 3, 1.8);
    // his right arm (our left): the upper arm down, the forearm up to the fist on the shaft; the shackle at the wrist
    const armR = `<path d="M62 126Q50 132 50 160L52 196Q54 202 62 200L68 168Q70 146 66 132z" fill="url(#pbj${u})" stroke="#040806" stroke-width=".6"/>`
      + `<path d="M52 196Q56 204 62 198L50 150L42 152z" fill="#26342c" stroke="#040806" stroke-width=".6"/><path d="M43 153L52 196" stroke="#9ff0d0" stroke-width=".6" opacity=".35"/>`
      + `<rect x="35.6" y="148" width="12" height="7" rx="1.4" fill="url(#iron${u})" stroke="#020403" stroke-width=".5" transform="rotate(-12 41.6 151.5)"/><path d="M36 150.4l11 -2.4" stroke="#8a4a2a" stroke-width=".6" opacity=".7"/>`
      // the fist round the shaft: knuckles to us, four folded fingers stacked, the thumb over them
      + `<path d="M34 148Q32 140 34 134Q38 130 46 131Q50 133 50 140L48 148z" fill="url(#pbk${u})" stroke="#2a3a30" stroke-width=".5"/>`
      + `<linearGradient id="pbk${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8c8b0"/><stop offset=".5" stop-color="#889a84"/><stop offset="1" stop-color="#4a5a4c"/></linearGradient>`
      + [133.4, 137, 140.6, 144.2].map((y, i) => `<path d="M${33.6 + i * .3} ${y}Q${32 + i * .2} ${y + 1.8} ${34 + i * .3} ${y + 3.4}L${44 - i * .4} ${y + 3.2}" stroke="#2a3a30" stroke-width=".45" fill="none"/><path d="M${34 + i * .3} ${y + .6}q-1 1.2 .2 2.2" stroke="#e0ead8" stroke-width=".4" fill="none" opacity=".6"/><path d="M${41 - i * .2} ${y + .4}l1.4 .1" stroke="#e8e0d0" stroke-width=".5" opacity=".7"/>`).join('')
      + `<path d="M44 132Q50 134 50 140Q46 142 42 140Q40 136 44 132z" fill="#9aaa94" stroke="#2a3a30" stroke-width=".45"/><path d="M43 135q3 .6 5 3" stroke="#4a5a4c" stroke-width=".35" fill="none"/>`
      + barn(48, 154, 1.5) + chainPts(42, 156, 30, 290, 6, 17);
    // his left arm (our right) hangs down to the bucket rope; the shackle chained to the ring bolt
    const armL = `<path d="M140 122Q154 130 156 162L160 200Q158 206 150 204L144 170Q140 146 136 132z" fill="url(#pbj${u})" stroke="#040806" stroke-width=".6"/>`
      + `<path d="M150 204L158 200L160 214L152 216z" fill="#1e2a24" stroke="#040806" stroke-width=".5"/><rect x="149" y="196" width="12" height="7" rx="1.4" fill="url(#iron${u})" stroke="#020403" stroke-width=".5" transform="rotate(8 155 199.5)"/>`
      + `<path d="M151 214Q150 222 154 226L160 226Q163 220 161 213z" fill="#7a8a76" stroke="#2a3a30" stroke-width=".5"/>` + chainPts(161, 199, 177, 176, -2, 5);
    const bucket = `<path d="M156 226q-14 4 -26 0" stroke="#5a4a2a" stroke-width="1.4" fill="none"/><path d="M128 232L134 290H178L184 232z" fill="#1a1a14" stroke="#040806" stroke-width=".6"/>`
      + [146, 156, 166].map(x => `<path d="M${x} 232l${(x - 156) * .1} 58" stroke="#040806" stroke-width=".6"/>`).join('') + `<path d="M129 240h54M131 262h50" stroke="url(#iron${u})" stroke-width="2.2"/>`
      + `<ellipse cx="156" cy="232" rx="28" ry="4.2" fill="#24301e" stroke="#040806" stroke-width=".6"/><ellipse cx="156" cy="233" rx="24" ry="2.8" fill="#0a1410"/><path d="M134 233q22 3 44 0" stroke="#9ff0d0" stroke-width=".4" fill="none" opacity=".5"/>`
      + `<path d="M130 228q2 -6 4 -2M182 228q-2 -6 -4 -2" stroke="#5a4a2a" stroke-width="1.2" fill="none"/>`;
    // the head: neck, the face ¾ to our left, downcast; barnacles grown into the right cheek (our right), stubble
    const skinG = `<linearGradient id="pbf${u}" x1="0" y1="0" x2="1" y2=".2"><stop offset="0" stop-color="#c4d4b8"/><stop offset=".45" stop-color="#8a9c84"/><stop offset="1" stop-color="#4a5a4a"/></linearGradient>`;
    const head = skinG + `<path d="M90 112L92 96L112 96L114 112Q104 118 90 112z" fill="#6a7c66" stroke="#2a3a30" stroke-width=".5"/><path d="M95 100q1 7 0 12M107 99q-1 7 1 13" stroke="#3a4a3c" stroke-width=".5" fill="none"/>`
      + `<path d="M80 60Q80 54 86 52L114 51Q122 52 122 60L123 72Q123 84 118 92Q112 101 101 103Q90 102 85 95L82 88L78.4 84Q77.6 80 79.6 79L80 72z" fill="url(#pbf${u})" stroke="#2a3a30" stroke-width=".6"/>`
      // ear, brow, the sockets and heavy lids, bags under the eyes, the nose, a tight down-turned mouth
      + `<path d="M120 66q5 -2 6 4q1 7 -3 11q-2 2 -4 0" fill="#7a8c74" stroke="#2a3a30" stroke-width=".5"/><path d="M121.6 69q2 1.6 .8 5" stroke="#3a4a3c" stroke-width=".45" fill="none"/>`
      + `<path d="M82 66Q88 62.6 95 65M100 64.6Q107 62.4 115 65" stroke="#3a4232" stroke-width="1.5" fill="none"/><path d="M82 64.4Q88 61 95 63.4M100 63Q107 60.8 115 63.4" stroke="#c8ccc0" stroke-width=".6" fill="none" opacity=".8"/>`
      + `<path d="M84 ${ey}Q89 ${ey - 3.4} 94 ${ey}Q89 ${ey + 1.6} 84 ${ey}z" fill="#1e2420"/><path d="M101 ${ey}Q107 ${ey - 3.4} 113 ${ey}Q107 ${ey + 1.6} 101 ${ey}z" fill="#1a201c"/>`
      + `<circle cx="89.4" cy="${ey + .2}" r="1.1" fill="#9ab8a8"/><circle cx="107.6" cy="${ey + .2}" r="1" fill="#8aa898"/><path d="M84 ${ey - .4}Q89 ${ey - 3.6} 94 ${ey - .4}M101 ${ey - .4}Q107 ${ey - 3.6} 113 ${ey - .4}" stroke="#3a4232" stroke-width=".9" fill="none"/>`
      + `<path d="M85 ${ey + 3}q4 2.4 8 0M102 ${ey + 3}q5 2.4 10 0M80.6 ${ey - 2}l-2 -1.4M80.6 ${ey}l-2.4 .4" stroke="#4a5a4a" stroke-width=".5" fill="none"/>`
      + `<path d="M97 66Q96 74 92 81Q90 84 92.6 85.4Q95.6 86.6 98.4 84.6" stroke="#3a4a3c" stroke-width=".7" fill="#9aac92"/><path d="M95.6 70q-1 6 -3.4 10" stroke="#dce6d4" stroke-width=".6" fill="none" opacity=".7"/><ellipse cx="94.6" cy="84.8" rx="1.3" ry=".7" fill="#2a3428"/>`
      + `<path d="M88 92Q95 90.6 104 92.6" stroke="#2a3428" stroke-width="1" fill="none"/><path d="M88 92q-1.4 1 -1.6 2.6M104 92.6q1.2 .8 1.4 2.4" stroke="#3a4a3c" stroke-width=".5" fill="none"/>`
      + `<path d="M86 58q8 -2 14 0M88 61q6 -1.4 10 0M104 58q6 -1.6 11 0" stroke="#5a6a54" stroke-width=".5" fill="none"/>`;
    const sr = R(33);
    const stubble = Array.from({ length: 120 }, () => { const a = sr() * Math.PI, rr = .7 + sr() * .3, x = 101 + Math.cos(a) * 19 * rr, y = 86 + Math.sin(a) * 15 * rr; return x < 86 && y < 90 ? '' : `<path d="M${f1(x)} ${f1(y)}l${f2(sr() - .5)} .9" stroke="#d8dcd0" stroke-width=".35" opacity="${f2(.4 + sr() * .5)}"/>`; }).join('')
      + `<path d="M88 90.6Q95 88 104 90.6Q102 89 96 88.6Q90 88.6 88 90.6z" fill="#c8ccc0" opacity=".85"/>`;
    const cheekBarn = barn(116, 86, 2.1, 20) + barn(119.4, 82, 1.5, 30) + barn(114, 91.4, 1.3, 10) + barn(121, 88, 1.1, 40) + `<path d="M112 84q4 6 10 4" stroke="#3a4a3c" stroke-width=".5" fill="none"/>`;
    // the knitted cap: rolled brim, ribs, wet and dark green-grey
    const cap = `<path d="M79 58Q78 40 100 38Q122 38 123 58z" fill="#2e3c34" stroke="#0a120e" stroke-width=".6"/>` + Array.from({ length: 12 }, (_, k) => `<path d="M${f1(82 + k * 3.4)} ${f1(57)}Q${f1(84 + k * 3)} ${f1(46)} ${f1(92 + k * 1.6)} ${f1(39.6)}" stroke="#18221c" stroke-width=".5" fill="none"/>`).join('')
      + `<path d="M77.6 61Q78 54 82 53L120 52.4Q124.4 53 124.4 60L122.6 63.4Q100 60 79 64z" fill="#3a4a40" stroke="#0a120e" stroke-width=".6"/>` + Array.from({ length: 15 }, (_, k) => `<path d="M${f1(80 + k * 3)} ${f1(53.6)}v${f1(8.8 - Math.abs(k - 7) * .1)}" stroke="#1e2a24" stroke-width=".5"/>`).join('')
      + `<path d="M84 41Q96 36 108 38" stroke="#9ff0d0" stroke-width=".9" fill="none" opacity=".45"/><path d="M78.6 56Q90 52.6 104 52.8" stroke="#9ff0d0" stroke-width=".7" fill="none" opacity=".4"/>`;
    const light = glow(u, 94, 74, 40, 40, '#9ff0d0', .18) + gloom(u, 200, 100, 120, 100, .4, '#020604') + gloom(u, 100, 140, 100, 280, .45, '#020604');
    return [wall + wallBarn + ringBolt + beamL, pike + jacket + armR + armL + bucket + head + stubble + cheekBarn + cap + light];
  },
  'Сундук мертвеца': u => {
    const hz = 62;
    const back = haze(u, hz, 128, 30, 11) + `<path d="M40 64q20 -12 60 -8q14 2 24 8z" fill="#5a7a6a"/>` + lit(K.palm ? '' : '', GHOSTLY) + tint(require('./art3.cjs').palm(64, 62, .5) + require('./art3.cjs').palm(84, 60, .44, -1), [.7, .9, .82], [0, .03, .02], .6)
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
    const light = glow(u, 128, 30, 60, 40, '#f4fff0', .2) + gloom(u, 100, 140, 100, 280, .4, '#141a14');
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
      + `<path d="M62 82q36 -22 82 0q8 16 -4 28q-40 16 -76 0q-10 -12 -2 -28z" fill="#3a4a40" stroke="#1a2620" stroke-width=".6"/>` + [[80, 84], [100, 80], [122, 84], [90, 104], [114, 104]].map(([x, y]) => barn(x, y, 2.2)).join('') + `<path d="M74 94q26 -5 54 1q-2 4 -20 4q-20 -1 -34 -5z" fill="#020606"/>`;
    const bub = bubbles(22, 104, 30, 60, 60, 13, '#e8fff8');
    const life = weed(20, 260, 30, '#2a5a3a', 3) + weed(180, 270, 26, '#2a5a3a', 5, -1) + fish(176, 140, 1, -1, '#7aa8a0');
    const light = glow(u, 100, 70, 80, 40, '#c8fff0', .15) + gloom(u, 100, 140, 100, 280, .55, '#020806');
    return [back + planks, breach + growth + bub + life + light];
  },

  // Norrington aboard: on a barrel head, one on another: the folded uniform with an epaulette hanging over the edge,
  // the wig, the admiral's hat; his sword leans against the barrel; a cobweb, fog, a soft beam from above.
  'Норрингтон на борту': u => {
    const deck0 = ghostDeck(u, 118, 54) + shafts(u, 100, -10, [[60, 120, 140, 120]], '#c8fff0', .16);
    const barrel = shadow(u, 100, 150, 46, .55, 5) + `<g filter="url(#drop${u})"><path d="M60 106q-6 24 0 48h80q6 -24 0 -48z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".7"/>${[-26, -9, 9, 26].map(d => `<path d="M${100 + d} 108q${d * .15} 22 0 46" stroke="#2a1608" stroke-width=".6" fill="none"/>`).join('')}`
      + `<path d="M58 116q42 6 84 0M58 144q42 6 84 0" stroke="url(#iron${u})" stroke-width="3" fill="none"/><ellipse cx="100" cy="106" rx="40" ry="8" fill="#6a4a2c" stroke="#140a04" stroke-width=".6"/></g>` + barn(64, 132, 2) + barn(136, 128, 1.8);
    // the folded coat, an epaulette hanging over the edge; the wig on it; the hat on top
    const coat = `<g filter="url(#drop${u})"><path d="M66 104q34 -10 68 0l-2 -10q-32 -8 -64 0z" fill="#1e2a4a" stroke="#0a1020" stroke-width=".6"/><path d="M68 94q32 -8 64 0" stroke="#c9a048" stroke-width="1.2" fill="none"/>${[78, 88, 98, 108, 118].map(x => `<circle cx="${x}" cy="${f1(97 - Math.sin((x - 66) / 68 * Math.PI) * 2)}" r="1" fill="#b8963a"/>`).join('')}</g>`
      + `<g transform="translate(132 98)" filter="url(#drop${u})"><ellipse rx="7" ry="3" fill="#b8963a"/>${Array.from({ length: 8 }, (_, k) => `<path d="M${-5 + k * 1.4} 1v${8 + (k % 2) * 3}" stroke="#a8862a" stroke-width=".7"/>`).join('')}</g>`;
    const wig = `<g filter="url(#drop${u})"><path d="M74 92q-4 -14 26 -18q30 4 26 18q-10 -4 -26 -4t-26 4z" fill="#e8e4dc" stroke="#9a948a" stroke-width=".5"/>${[78, 84, 90, 110, 116, 122].map(x => `<path d="M${x} 90q-2 -4 2 -6q4 2 0 6" stroke="#b8b2a8" stroke-width=".6" fill="none"/>`).join('')}<path d="M120 90q8 4 6 10" stroke="#e8e4dc" stroke-width="3" fill="none"/></g>`;
    const hat = `<g filter="url(#drop${u})"><path d="M62 74q38 -26 76 0q-10 6 -38 6t-38 -6z" fill="#14161c" stroke="#06080a" stroke-width=".6"/><path d="M62 74q38 -26 76 0" stroke="#b8963a" stroke-width="1.8" fill="none"/><path d="M84 64q16 -10 32 0" stroke="#1e2026" stroke-width="5" fill="none"/>`
      + `<circle cx="100" cy="58" r="3.4" fill="#2a3a6a" stroke="#b8963a" stroke-width=".8"/><path d="M76 62q24 -16 48 0" stroke="#c8e8d8" stroke-width=".6" fill="none" opacity=".6"/></g>`;
    const sword = `<g transform="translate(152 98) rotate(12)" filter="url(#drop${u})"><path d="M0 4v80" stroke="url(#silver${u})" stroke-width="2.4"/><path d="M-6 4h12" stroke="#a8862a" stroke-width="2.4"/><path d="M-5 4q-4 -8 4 -12" stroke="#a8862a" stroke-width="1.2" fill="none"/><rect x="-1.6" y="-10" width="3.2" height="13" rx="1" fill="#e8e0d0"/><circle cy="-11" r="2.2" fill="#a8862a"/></g>`;
    const web = `<path d="M138 74L140 106M138 74L132 106M142 84q4 2 6 -2M140 92q5 2 8 -2" stroke="#e8f8f0" stroke-width=".3" fill="none" opacity=".7"/>` + spray(70, 100, 60, 10, 8, 5, '#c8fff0');
    const fog = grad('pnf' + u, [[0, '#b8f0d8', 0], [.5, '#b8f0d8', .2], [1, '#b8f0d8', 0]]) + `<rect y="130" width="200" height="40" fill="url(#pnf${u})"/>`;
    const light = glow(u, 100, 70, 50, 40, '#c8fff0', .18) + gloom(u, 100, 150, 100, 280, .5, '#020806');
    return [deck0, barrel + coat + wig + hat + sword + web + fog + light];
  },

  // skeleton (picture units 0–280): path B (the original's heart is a ♥ sign standing on the beach with a cardiogram
  // and notes); the idea: close, from above — an open casket on the sand, a real heart bound with a strap on dark velvet.
  // Camera: eye 0.33 m above the sand (we kneel close to it), looking level with a shifted frame, so verticals stay
  // vertical: x = 100 + 104 X / Z, y = 40 + 104 (0.33 − Y) / Z (metres; Z — distance); horizon y=40
  // light: the pale sun upper left (x 92, y 16) in a green haze; shadows fall right and towards us
  // ground: the sand from the shore (foam at y 44–47) to us; one small palm far behind on the left, base y 44
  // casket: 0.30 × 0.20 × 0.16 m, front 0.25 m away: bottom y 177 (contact shadow), front rim y 111, back rim y 79,
  // x 38–162; the lid hinged at the back rim, opened 100° (top y 34, x 68–132), held by two small chains
  // heart: lies on the velvet bed (0.12 m) in the middle, y 76–104, 0.14 m wide; a leather strap round it, both ends
  // tucked under it, a small padlock hanging from the buckle; a soft double red outline — the beat; red glow on the lid
  // music box: open, on the sand in front, right of centre (Z 0.18–0.205), its lid lying open flat on the sand to the
  // right; y 195–230, dark, under the glass; nothing of it rises in front of the casket
  'Сердце бьётся': u => {
    const hz = 40, E = .33, F = 104;
    const P = (X, Y, Z) => `${f1(100 + F * X / Z)} ${f1(hz + F * (E - Y) / Z)}`;
    const W = .3, D = .2, Hc = .16, Z0 = .25, Lb = .12;
    // the sky in a green haze, the pale sun, the sea strip with a far reef, the shore foam
    const back = sky(u, 0, hz + 1, [[0, '#7a9a92'], [.6, '#b4ccc0'], [1, '#dce8d8']]) + glow(u, 92, 16, 46, 36, '#f4fff0', .75) + `<circle cx="92" cy="16" r="6" fill="#f6fff4"/>`
      + K.cloudBand(u, 0, 34, '#eef6ee', '#86a49a', 47, 2.25, '0.014 0.08')
      + grad('phs' + u, [[0, '#5a8a80'], [1, '#2e6058']]) + `<rect y="${hz}" width="200" height="6" fill="url(#phs${u})"/><path d="M0 ${hz + .3}h200" stroke="#e8fff4" stroke-width=".4" opacity=".7"/>`
      + `<path d="M0 ${hz + 4.6}q20 -1.4 40 0t40 -.4t40 .6t40 -.6t40 .4" stroke="#f4fffa" stroke-width=".8" fill="none" opacity=".85"/><path d="M0 ${hz + 6}q30 -1 60 0t60 .3t80 -.3" stroke="#e8fff4" stroke-width=".5" fill="none" opacity=".6"/>`;
    // the palm, small and far (base y 44), leaning to the right, crown x 48–69, y 21–32
    const palmT = `<path d="M55 44.6Q55.4 36 58.6 26" stroke="#3a3a2a" stroke-width="1.6" fill="none"/><path d="M55.6 44q.6 -8 3 -17" stroke="#7a7a5a" stroke-width=".4" fill="none"/>`
      + [[-10, 4], [-7, -3], [0, -5], [7, -3], [10, 4], [4, 6], [-4, 6]].map(([dx, dy]) => `<path d="M58.6 26q${f1(dx * .5)} ${f1(dy * .6 - 3)} ${dx} ${dy}" stroke="#3a5a40" stroke-width="1.3" fill="none"/>`).join('') + `<ellipse cx="55" cy="44.8" rx="4" ry=".7" fill="#4a5a44" opacity=".5"/>`;
    // the sand: a gradient, ripples that widen and spread towards us, grains, a shell
    let sandB = grad('phd' + u, [[0, '#d8d4b0'], [.4, '#c8bc90'], [1, '#8a7a58']]) + `<rect y="${hz + 6}" width="200" height="${280 - hz - 6}" fill="url(#phd${u})"/>`;
    const sr = R(19);
    for (let Z = 2.4; Z > .15; Z *= .9) { const y = hz + F * E / Z, w = F * .05 / Z; for (let x = -sr() * w; x < 205; x += w * (1.6 + sr() * 1.4)) sandB += `<path d="M${f1(x)} ${f1(y)}q${f1(w / 2)} ${f1(-w * .12)} ${f1(w)} 0" stroke="${sr() > .5 ? '#fff4d8' : '#6a5a3a'}" stroke-width="${f2(.2 + .04 * w)}" fill="none" opacity="${f2(.25 + sr() * .3)}"/>`; }
    sandB += Array.from({ length: 90 }, () => { const y = hz + 8 + sr() * 230; return `<circle cx="${f1(sr() * 200)}" cy="${f1(y)}" r="${f2(.15 + (y - hz) * .004 * sr())}" fill="${sr() > .5 ? '#fff8e0' : '#5a4a30'}" opacity="${f2(.3 + sr() * .4)}"/>`; }).join('');
    // the casket's shadow on the sand (to the right and towards us) and its contact line
    const sh = `<path d="M${P(-W / 2, 0, Z0)}L${P(W / 2, 0, Z0)}L${P(W / 2 + .07, 0, Z0 - .03)}L${P(-W / 2 + .1, 0, Z0 - .04)}z" fill="#2a2414" opacity=".4" filter="url(#soft${u})"/><path d="M${P(W / 2, 0, Z0)}L${P(W / 2, 0, Z0 + D)}L${P(W / 2 + .07, 0, Z0 + D - .02)}L${P(W / 2 + .07, 0, Z0 - .03)}z" fill="#2a2414" opacity=".35" filter="url(#soft${u})"/>`
      + `<path d="M${P(-W / 2, 0, Z0)}L${P(W / 2, 0, Z0)}" stroke="#1a140a" stroke-width="2.4" opacity=".7"/>`;
    // the lid: hinged at the back rim, opened 100°; its inside face (wood, iron straps, a carved rosette, no signs)
    const a = 100 * Math.PI / 180, LZ = t => Z0 + D - t * Math.cos(a), LY = t => Hc + t * Math.sin(a);
    const lidP = (lx, t) => P(lx, LY(t), LZ(t));
    const lidIn = `<path d="M${lidP(-W / 2, 0)}L${lidP(W / 2, 0)}L${lidP(W / 2, D)}L${lidP(-W / 2, D)}z" fill="#3a2414" stroke="#120804" stroke-width=".7"/>`
      + `<path d="M${lidP(-W / 2 + .012, .012)}L${lidP(W / 2 - .012, .012)}L${lidP(W / 2 - .012, D - .012)}L${lidP(-W / 2 + .012, D - .012)}z" fill="url(#oak${u})" opacity=".75"/>`
      + [-.1, .1].map(lx => `<path d="M${lidP(lx - .008, 0)}L${lidP(lx + .008, 0)}L${lidP(lx + .008, D)}L${lidP(lx - .008, D)}z" fill="url(#iron${u})" stroke="#0a0a0a" stroke-width=".3"/>`).join('')
      + (() => { const [cx, cy] = lidP(0, D * .55).split(' ').map(Number); return `<g transform="translate(${cx} ${cy}) scale(1 .9)">${Array.from({ length: 8 }, (_, k) => `<path d="M0 0q2 -4 0 -8.6q-2 4.6 0 8.6z" fill="#6a4424" stroke="#1a0e06" stroke-width=".3" transform="rotate(${k * 45})"/>`).join('')}<circle r="2.2" fill="#2a1608" stroke="#c89a5a" stroke-width=".4"/></g>`; })()
      + `<path d="M${lidP(-W / 2, D)}L${lidP(W / 2, D)}" stroke="#c89060" stroke-width=".8" opacity=".7"/>`
      + (() => { const [gx, gy] = lidP(0, D * .45).split(' ').map(Number); return glow(u, gx, gy, 40, 26, '#ff4a3a', .4); })();
    // the casket body: the inside walls, the velvet bed, then (after the heart) the front wall and the rim
    const inner = `<path d="M${P(-W / 2, Hc, Z0 + D)}L${P(W / 2, Hc, Z0 + D)}L${P(W / 2, Lb, Z0 + D)}L${P(-W / 2, Lb, Z0 + D)}z" fill="#24140a"/>`
      + `<path d="M${P(-W / 2, Hc, Z0)}L${P(-W / 2, Hc, Z0 + D)}L${P(-W / 2, Lb, Z0 + D)}L${P(-W / 2, Lb, Z0)}z" fill="#3a2212"/><path d="M${P(W / 2, Hc, Z0)}L${P(W / 2, Hc, Z0 + D)}L${P(W / 2, Lb, Z0 + D)}L${P(W / 2, Lb, Z0)}z" fill="#1e1008"/>`
      + `<path d="M${P(-W / 2, Lb, Z0)}L${P(W / 2, Lb, Z0)}L${P(W / 2, Lb, Z0 + D)}L${P(-W / 2, Lb, Z0 + D)}z" fill="url(#phv${u})"/>`
      + `<radialGradient id="phv${u}" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#5a1418"/><stop offset=".55" stop-color="#2a0a10"/><stop offset="1" stop-color="#10040a"/></radialGradient>`
      + [[-.1, .05], [.08, .14], [-.04, .17], [.11, .04]].map(([lx, lz]) => `<path d="M${P(lx - .03, Lb, Z0 + lz)}Q${P(lx, Lb + .006, Z0 + lz + .01)} ${P(lx + .03, Lb, Z0 + lz)}" stroke="#7a2a2a" stroke-width=".6" fill="none" opacity=".5"/>`).join('');
    // the chains holding the lid: from its sides to the inside walls
    const stay = s => { const [x0, y0] = lidP(s * (W / 2 - .012), D * .5).split(' ').map(Number), [x1, y1] = P(s * (W / 2 - .012), Hc - .02, Z0 + D * .62).split(' ').map(Number);
      const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2.2)), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
      return `<path d="M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}" stroke="#1a1a1a" stroke-width=".5" opacity=".6"/>` + Array.from({ length: n }, (_, i) => { const t = (i + .5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 1.2;
        return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><rect x="-1.3" y="${i % 2 ? -.35 : -.7}" width="2.6" height="${i % 2 ? .7 : 1.4}" rx=".6" fill="none" stroke="#2a2a2a" stroke-width=".7"/><rect x="-1.3" y="${i % 2 ? -.35 : -.7}" width="2.6" height="${i % 2 ? .7 : 1.4}" rx=".6" fill="none" stroke="#a8acb0" stroke-width=".3"/></g>`; }).join('')
        + `<circle cx="${f1(x0)}" cy="${f1(y0)}" r=".9" fill="url(#brass${u})"/><circle cx="${f1(x1)}" cy="${f1(y1)}" r=".9" fill="url(#brass${u})"/>`; };
    // the heart: a dark red muscle with the aorta and vessels, wet highlights, coronary vessels; bound with a strap
    const [hx, hy] = P(0, .175, Z0 + D * .5).split(' ').map(Number);
    const hs = F * .14 / (Z0 + D * .5) / 40; // 40 local units = 0.14 m
    const heart = `<g transform="translate(${f1(hx)} ${f1(hy + 2)}) scale(${f2(hs)}) rotate(-14)">`
      + `<radialGradient id="phh${u}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#d84a40"/><stop offset=".45" stop-color="#9a1e1e"/><stop offset="1" stop-color="#4a0608"/></radialGradient>`
      + `<filter id="phb${u}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>`
      + `<path d="M-19 -6Q-22 8 -8 18Q2 26 6 30Q10 22 18 12Q26 0 20 -10Q14 -18 4 -14Q-2 -20 -10 -16Q-18 -13 -19 -6z" fill="none" stroke="#ff5a4a" stroke-width="3" opacity=".45" filter="url(#phb${u})" transform="scale(1.12)"/>`
      + `<path d="M-19 -6Q-22 8 -8 18Q2 26 6 30Q10 22 18 12Q26 0 20 -10Q14 -18 4 -14Q-2 -20 -10 -16Q-18 -13 -19 -6z" fill="none" stroke="#ff7a5a" stroke-width="1.6" opacity=".35" filter="url(#phb${u})" transform="scale(1.24)"/>`
      // vessels on top: the aorta arching, the pulmonary trunk, veins
      + `<path d="M-4 -14Q-6 -26 2 -28Q10 -30 12 -22L9 -20Q8 -25 3 -24Q-1 -22 1 -14z" fill="#b8423a" stroke="#3a0606" stroke-width=".6"/><ellipse cx="10.6" cy="-21" rx="2.2" ry="1.4" fill="#3a0606"/>`
      + `<path d="M4 -14Q8 -20 14 -18L13 -14Q9 -15 8 -12z" fill="#7a3a5a" stroke="#2a0612" stroke-width=".5"/><path d="M-12 -15Q-16 -22 -12 -24L-9 -22Q-11 -19 -8 -16z" fill="#5a2a4a" stroke="#2a0612" stroke-width=".5"/><ellipse cx="-10.6" cy="-23.2" rx="1.6" ry=".9" fill="#2a0612"/>`
      + `<path d="M-19 -6Q-22 8 -8 18Q2 26 6 30Q10 22 18 12Q26 0 20 -10Q14 -18 4 -14Q-2 -20 -10 -16Q-18 -13 -19 -6z" fill="url(#phh${u})" stroke="#2a0204" stroke-width=".8"/>`
      + `<path d="M2 -13Q0 0 4 12Q6 20 6 28" stroke="#5a1010" stroke-width="1.2" fill="none" opacity=".8"/><path d="M2 -13Q0 0 4 12" stroke="#e8c0a0" stroke-width=".5" fill="none" opacity=".5"/>`
      + `<path d="M-12 -10q2 8 8 14M12 -8q-2 10 -4 18" stroke="#e8d0a0" stroke-width=".7" fill="none" opacity=".45"/><path d="M-12 -10q2 8 8 14" stroke="#3a0606" stroke-width=".4" fill="none" opacity=".5" transform="translate(.6 .6)"/>`
      + `<path d="M-15 -8q2 -5 7 -6M-13 -3q1 -3 4 -4" stroke="#ffe0d0" stroke-width="1.2" fill="none" opacity=".7"/><circle cx="12" cy="-6" r="1.2" fill="#ffe8e0" opacity=".7"/><circle cx="-6" cy="8" r=".8" fill="#ffd8d0" opacity=".55"/>`
      // the strap across, ends tucked under the heart on both sides; a buckle with a small padlock hanging from it
      + `<path d="M-21 2Q-4 -4 22 -2L22 4Q-4 3 -20 8z" fill="#4a2a14" stroke="#1a0a04" stroke-width=".5"/><path d="M-21 2Q-4 -4 22 -2" stroke="#9a6a3a" stroke-width=".5" fill="none"/><path d="M-21 2l-1.4 3.4l1.6 2.6M22 -2l1.4 3l-1.4 3" stroke="#1a0a04" stroke-width=".6" fill="none"/>`
      + `<path d="M-17 4.6l2 -.2M-12 3.2l2 -.1M10 2.4l2 0M15 2.8l2 0" stroke="#c8a070" stroke-width=".5"/>`
      + `<rect x="-2.4" y="-2" width="5.2" height="6" rx=".6" fill="none" stroke="url(#iron${u})" stroke-width="1.2"/>`
      + `<path d="M-1.4 4q0 -3.4 1.6 -3.4q1.6 0 1.6 3.4" stroke="url(#iron${u})" stroke-width="1" fill="none" transform="translate(0 4)"/><rect x="-2.6" y="8" width="5.6" height="4.6" rx=".8" fill="url(#brass${u})" stroke="#4a3410" stroke-width=".4"/><circle cx=".2" cy="10" r=".7" fill="#2a1a08"/><path d="M.2 10v1.6" stroke="#2a1a08" stroke-width=".5"/>`
      + `</g>`;
    // the front wall and the rim: planks with iron bands, corner fittings and studs, in its own shade (the sun is behind it)
    const fl = (lx, ly) => P(lx, ly, Z0);
    const front = `<path d="M${fl(-W / 2, 0)}L${fl(W / 2, 0)}L${fl(W / 2, Hc)}L${fl(-W / 2, Hc)}z" fill="#3a2212" stroke="#100604" stroke-width=".7"/>`
      + `<path d="M${fl(-W / 2, 0)}L${fl(W / 2, 0)}L${fl(W / 2, Hc)}L${fl(-W / 2, Hc)}z" fill="url(#oak${u})" opacity=".55"/>`
      + [.04, .08, .12].map(h => `<path d="M${fl(-W / 2, h)}L${fl(W / 2, h)}" stroke="#140804" stroke-width=".8"/><path d="M${fl(-W / 2, h - .002)}L${fl(W / 2, h - .002)}" stroke="#8a5a34" stroke-width=".35" opacity=".5"/>`).join('')
      + [-.1, .1].map(lx => `<path d="M${fl(lx - .012, 0)}L${fl(lx + .012, 0)}L${fl(lx + .012, Hc)}L${fl(lx - .012, Hc)}z" fill="url(#iron${u})" stroke="#060606" stroke-width=".4"/>` + K.nails([.02, .06, .1, .14].map(h => fl(lx, h).split(' ').map(Number)), '#0a0a0a', .7)).join('')
      + [-1, 1].map(s => `<path d="M${fl(s * W / 2, 0)}L${fl(s * (W / 2 - .03), 0)}L${fl(s * (W / 2 - .03), .03)}L${fl(s * W / 2, .03)}zM${fl(s * W / 2, Hc)}L${fl(s * (W / 2 - .03), Hc)}L${fl(s * (W / 2 - .03), Hc - .03)}L${fl(s * W / 2, Hc - .03)}z" fill="url(#brass${u})" stroke="#4a3410" stroke-width=".4"/>`).join('')
      + `<path d="M${fl(-.03, Hc)}L${fl(.03, Hc)}L${fl(.026, Hc - .045)}L${fl(-.026, Hc - .045)}z" fill="url(#brass${u})" stroke="#4a3410" stroke-width=".4"/><circle cx="${fl(0, Hc - .025).split(' ')[0]}" cy="${fl(0, Hc - .025).split(' ')[1]}" r="1.4" fill="#1a0e04"/>`
      + `<path d="M${P(-W / 2, Hc, Z0)}L${P(W / 2, Hc, Z0)}L${P(W / 2, Hc, Z0 + D)}L${P(-W / 2, Hc, Z0 + D)}z" fill="none" stroke="#1a0c04" stroke-width="2.6"/><path d="M${P(-W / 2, Hc, Z0)}L${P(W / 2, Hc, Z0)}" stroke="#c89060" stroke-width=".9"/><path d="M${P(-W / 2, Hc, Z0)}L${P(-W / 2, Hc, Z0 + D)}" stroke="#e0b07a" stroke-width=".9" opacity=".8"/>`
      + `<path d="M${fl(-W / 2, 0)}L${fl(-W / 2, Hc)}" stroke="#e8c090" stroke-width=".8" opacity=".55"/>` + glow(u, hx, hy + 14, 50, 10, '#ff4a3a', .18);
    // the open music box on the sand in front, right; dark, a brass comb and cylinder, its lid open
    // its lid opened right over and lying flat on the sand, lining up (nothing rises in front of the casket)
    const mb = (X0, X1, Zn, Zf, h) => `<path d="M${P(X1, 0, Zn)}L${P(X1 + (X1 - X0), 0, Zn)}L${P(X1 + (X1 - X0), 0, Zf)}L${P(X1, 0, Zf)}z" fill="#2a1a0e" stroke="#080402" stroke-width=".6"/>`
      + `<path d="M${P(X1 + .006, 0, Zn + .005)}L${P(2 * X1 - X0 - .006, 0, Zn + .005)}L${P(2 * X1 - X0 - .006, 0, Zf - .005)}L${P(X1 + .006, 0, Zf - .005)}z" fill="#5a1418"/>`
      + `<path d="M${P(X0, 0, Zn)}L${P(X1, 0, Zn)}L${P(X1, h, Zn)}L${P(X0, h, Zn)}z" fill="#1e120a" stroke="#080402" stroke-width=".6"/><path d="M${P(X0, h, Zn)}L${P(X1, h, Zn)}L${P(X1, h, Zf)}L${P(X0, h, Zf)}z" fill="#2a1a0e" stroke="#080402" stroke-width=".6"/>`
      + `<path d="M${P(X0 + .006, h, Zn + .005)}L${P(X1 - .006, h, Zn + .005)}L${P(X1 - .006, h, Zf - .005)}L${P(X0 + .006, h, Zf - .005)}z" fill="#120a06"/><path d="M${P(X0 + .012, h, Zf - .01)}L${P(X1 - .012, h, Zf - .01)}" stroke="url(#brass${u})" stroke-width="2.4"/>`
      + Array.from({ length: 8 }, (_, i) => `<path d="M${P(X0 + .014 + i * .0045, h, Zn + .008)}L${P(X0 + .014 + i * .0045, h, Zn + .016)}" stroke="#c8a050" stroke-width=".5"/>`).join('')
      + `<path d="M${P(X1, h, Zn)}L${P(X1, h, Zf)}" stroke="#8a6a4a" stroke-width=".5"/><path d="M${P(X0, 0, Zn)}L${P(2 * X1 - X0, 0, Zn)}" stroke="#000" stroke-width="1.6" opacity=".45"/>`;
    const musicBox = `<path d="M${P(.02, 0, .18)}L${P(.15, 0, .18)}L${P(.17, 0, .19)}L${P(.04, 0, .19)}z" fill="#2a2414" opacity=".3" filter="url(#soft${u})"/>` + mb(.02, .07, .18, .205, .03);
    const light = gloom(u, 100, 150, 100, 280, .3, '#141008');
    return [back + palmT + sandB, sh + lidIn + inner + stay(-1) + stay(1) + heart + front + musicBox + light];
  },
  'Водоворот': u => {
    const hz = 42;
    const back = storm(u, hz, 23) + bolt(96, 2, 36);
    const mg = uid('pmg' + u);
    const funnel = `<radialGradient id="${mg}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000604"/><stop offset=".25" stop-color="#0a1e1a"/><stop offset=".7" stop-color="#2a5a50"/><stop offset="1" stop-color="#3a6a60" stop-opacity="0"/></radialGradient>`
      + `<ellipse cx="100" cy="95" rx="100" ry="44" fill="url(#${mg})"/>` + `<g transform="translate(100 95) scale(1 1.4)">${put('maelstrom', 0, 0, 1, 0, u, false)}</g>`
      + [[60, 84, 10], [140, 104, -20], [96, 112, 40]].map(([x, y, a]) => `<rect x="${x - 5}" y="${y - 1.4}" width="10" height="2.8" fill="#5a4030" transform="rotate(${a} ${x} ${y})"/>`).join('') + glow(u, 140, 70, 40, 20, '#c8fff0', .2);
    const ship = tint(tilted('endeavour', 146, 84, .95, -24, u, true, true), [.55, .64, .62], [0, .02, .02], .5);
    const ballT = shot(u, 22, 50, 82, 82, 2.4, '#d8e8e0');
    const light = rain(60, 3) + gloom(u, 100, 150, 100, 280, .5, '#020806');
    return [back, funnel + ship + ballT + light];
  },

  // The answer from the deep: on the enemy's deck a thick tentacle comes over the rail out of the foaming sea and sweeps
  // the deck: two barrels topple, a third flies overboard, a coil of rope unrolls, a sailor's cap flies.
  'Ответ из пучины': u => {
    const hz = 70;
    const back = haze(u, hz, 112, 22, 29).replace(/#a8c4b8/g, '#98aca4') + `<path d="M30 0L60 80M170 0L140 80" stroke="#3a3a30" stroke-width=".7"/>`;
    const rail = `<rect y="84" width="200" height="16" fill="#4a3a28"/>` + woodTex(u, 0, 84, W, 16, '#6a5038', '#3a2a1a', '#140a04', 4, false, 2) + `<path d="M0 84h200" stroke="#e8f4ec" stroke-width="1" opacity=".7"/><path d="M0 81h200v3h-200z" fill="#7a5c40"/>`
      + K.tableTop(u, 100, H - 100, '#8a6a48', '#4a3424', 31);
    const t = tentacle(u, [[176, 60], [160, 66], [140, 86], [110, 110], [80, 116], [56, 108], [48, 96]], 30, 6, 1) + `<path d="M150 74q18 -4 34 4" stroke="#ffffff" stroke-width="2" fill="none" opacity=".8"/>` + spray(140, 62, 50, 20, 30, 7)
      + [[120, 112], [96, 118], [70, 116]].map(([x, y]) => `<path d="M${x} ${y}q1 6 0 10" stroke="#e8fff8" stroke-width=".7" fill="none" opacity=".7"/>`).join('');
    const bar = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})" filter="url(#drop${u})"><path d="M-10 10q-3 -10 0 -20h20q3 10 0 20z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".6"/><path d="M-11 4h22M-11 -4h22" stroke="url(#iron${u})" stroke-width="1.6"/></g>`;
    const bf = uid('pab' + u);
    const chaos = bar(40, 116, -40) + bar(150, 120, 30) + blurF(bf, 1.4) + `<g filter="url(#${bf})" opacity=".85">${bar(162, 62, 60)}</g>` + `<path d="M150 82l20 -8" stroke="#e8f4ec" stroke-width="3" opacity=".3"/>`
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
// skeletons of the round-2 scenes (docs/tasks/card-art-portrait-2.md): `export.mjs --portrait --skel` checks them.
// item: [id, x of the left side, y of the base, w, h, support, height in m (on the ground), {edge | bg}]
const SKEL = {};
SKEL['Прихлоп Билл'] = { orig: { k: 1.6, tx: -68, ty: 6 }, horizon: 72, eye: 1.6, light: 'narrow green shaft from the grating upper left',
  items: [
    ['planking', 0, 280, 200, 263, 'hull side; behind bill, head, pike, bucket, chain-l', { bg: 1 }],
    ['beam', 0, 17, 200, 17, 'deck beam on the frames', { bg: 1 }],
    ['ring-bolt', 175, 179, 9, 11, 'bolted into the frame of the planking'],
    ['bill', 44, 300, 116, 188, 'ground (feet far below the frame), back against the planking; holds pike', { edge: 1 }],
    ['head', 77, 114, 50, 76, 'on the shoulders of bill (cap top y 38)'],
    ['pike', 28, 300, 26, 252, 'held by bill, butt on the floor below the frame', { edge: 1 }],
    ['chain-l', 160, 200, 20, 24, 'from the shackle of bill to ring-bolt'],
    ['bucket', 128, 290, 56, 64, 'hangs on its rope from the hand of bill', { edge: 1 }]] };
SKEL['Сердце бьётся'] = { orig: null, horizon: 40, eye: .33, light: 'pale sun upper left, green haze',
  items: [
    ['casket', 38, 177, 124, 66, 'ground', .16],
    ['lid', 68, 79, 64, 45, 'hinged on the back rim of casket, held by two chains; behind heart'],
    ['heart', 77, 112, 50, 54, 'on the velvet bed inside casket'],
    ['palm-trunk', 52, 45, 8, 14, 'ground: the sand far behind, at the shore'],
    ['palm-crown', 48, 32, 21, 11, 'on palm-trunk'],
    ['sun', 86, 22, 12, 12, 'sky, far behind'],
    ['music-box', 111, 231, 58, 17, 'ground (its lid lies open flat on the sand)', .03]] };
module.exports = { SCENES, CAM, SKEL };
