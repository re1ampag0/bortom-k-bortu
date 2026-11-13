// «Право на переговоры» (Жемчужина, ПРИКАЗ: выбранный вражеский корабль в следующий ход противника не даёт Залпов),
// refined from the first-round scene (portrait-pearl.cjs SCENES['Право на переговоры']): a night beach, a white flag
// on a pole stuck in the sand, the pirate code, a lantern on the sand. The concept stays (a parley under a white flag,
// by the pirates' law); the brief's person joins it: a pirate has come ashore and stands at the pole — his right fist
// round it, the flag streaming over his head; in his left fist the rolled Code with its red seal. He faces us, the
// enemy he has come to talk to: a sly half-smile, a tricorn, a short beard. Behind him in the bay lies the black ship
// at anchor — the brief's find: the white flag against her black sails.
// Fixed against the first round: the flag hung stiff in rigid stripes with nobody to hold it, the book lay flat on a
// grey blob; now a waving flag with folds turning in the moonlight and a frayed fly, a 3D fist round the pole
// (people.cjs hand3, palm side, the fingers over the wood) and another round the scroll. Light: the moon high on the
// right (key: the flag glows, the cold side of his face and coat, the path on the bay); the lantern on the sand by the
// pole (warm, from below on his right side).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { tricorn } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 100, MOON = { x: 82, y: 30 }, LAMP = { x: 34, y: 150, s: 1.3 };
const OFF = [16, 14];                                  // the torso is drawn at the origin of the first draft, moved by OFF
const HEAD = { c: [148, 64], r: 13.6 };
const G1 = [112, 114], G2 = [174, 110];                // the fists: on the pole, on the scroll
const light = { time: 'night', haze: .3, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 26, color: '#dfe8ff', power: .9 }, fill: { color: '#34405e', power: .4 },
  rim: { az: 330, color: '#cfe0ff', power: .5 }, locals: [{ x: LAMP.x, y: LAMP.y - 10, color: '#ffbe6a', power: .6, radius: 55 }] };
const skel = { horizon: HZ, eye: 1.7, light: 'moon behind the flag, upper middle (key: the flag glows, his cold left side, the bay) + lantern on the sand, left (warm, low)', items: [
  ['black ship', 0, 106, 104, 66, 'anchored in the bay'], ['headland', -10, HZ, 80, 8, 'far shore'], ['beach', -10, 280, 220, 162, 'ground from y 118'],
  ['pole', 104, 210, 20, 204, 'stuck in the sand, held in his right fist'], ['flag', 38, 60, 78, 52, 'on the pole'],
  ['pirate', 120, 190, 74, 140, 'stands on the beach'], ['scroll', 168, 128, 14, 34, 'in his left fist'], ['lantern', 26, 150, 16, 30, 'on the sand']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#f0c094', half: '#c4865a', core: '#a46a44', shadow: '#5e3422', outline: '#26120a' };
// a hand placed so the handle across its fist runs at the angle t (deg), through the point g
function handAt(u, base, g, t, a0) { let a = a0, h; for (let k = 0; k < 5; k++) { h = H.hand3(u, { ...base, a, grip: g }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
  let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; } return h; }

module.exports = { name: 'Право на переговоры', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), R = rng(41);
    // ——— the night over the bay ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 41 }) + K.sunMoon(u, L, { r: 6.6 })
      + K.cloud(u, L, { x: 120, y: 18, w: 44, h: 5, seed: 3, far: .5 }) + K.cloud(u, L, { x: 30, y: 74, w: 34, h: 4, seed: 6, far: .7 });
    // the far headland on the left, low and blue in the haze
    bg += `<path d="M-10 ${HZ}L-10 ${HZ - 7}Q8 ${HZ - 12} 26 ${HZ - 8}Q40 ${HZ - 11} 54 ${HZ - 5}Q66 ${HZ - 3} 74 ${HZ}Z" fill="#1e2a40"/><path d="M-10 ${HZ - 7}Q8 ${HZ - 12} 26 ${HZ - 8}Q40 ${HZ - 11} 54 ${HZ - 5}" stroke="#5a6e90" stroke-width=".4" fill="none" opacity=".6"/>`;
    bg += K.water(u, L, { horizon: HZ, bottom: 122, swell: .35, seed: 12, glitter: MOON.x });
    // the black ship at anchor in the bay, sails half taken in, her stern windows lit; the anchor cable from the bow
    bg += K.ship(u, L, { kind: 'pearl', x: 52, y: 107, scale: .6, sails: 'reefed', lights: true, reflect: true, detail: 'mid', seed: 5 });
    bg += `<path d="M-4 104q4 4 8 6" stroke="#0a0c10" stroke-width=".5" fill="none" opacity=".8"/>`;
    // ——— the beach: the wet line of the surf, the sand rising towards us ———
    { const sg = nid('sd', u);
      bg += `<defs>${linGrad(sg, 0, 118, 0, 290, [[0, '#4a4a4a', 1], [.08, '#6a6252', 1], [.4, '#4a4232', 1], [1, '#1a160e', 1]])}</defs>`
        + `<path d="M-10 120Q40 116 100 119T210 117V290H-10Z" fill="url(#${sg})"/>`
        + `<path d="M-10 120Q40 116 100 119T210 117" stroke="#d8e4f4" stroke-width=".8" fill="none" opacity=".6"/>`
        + K.foam(u, { x: 40, y: 119.4, w: 100, h: 1.4, seed: 4, L }) + K.foam(u, { x: 160, y: 118.6, w: 90, h: 1.2, seed: 8, L })
        + `<path d="M-10 124Q50 121 120 124T210 122" stroke="#9aa8b8" stroke-width=".5" fill="none" opacity=".35"/>`;
      for (let k = 0; k < 140; k++) { const y = 124 + R() * 60, x = -10 + R() * 220; bg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.2 + R() * .4)}" fill="${R() > .5 ? '#a89c80' : '#2a2418'}" opacity="${f(.3 + R() * .4)}"/>`; }
      // his footprints from the water
      for (let k = 0; k < 6; k++) { const x = 134 + (k % 2) * 7 - k * 2, y = 124 + k * 6; bg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.4 + k * .3)}" ry="${f(.7 + k * .15)}" fill="#1e1a12" opacity=".5"/>`; }
      // shells and a tangle of weed on the sand
      bg += [[24, 132], [174, 136], [96, 142]].map(([x, y]) => `<path d="M${x - 2.4} ${y}q2.4 -3.4 4.8 0z" fill="#e0d4b8" stroke="#6a5a40" stroke-width=".3"/><path d="M${x} ${y - 2.4}v2.4M${x - 1.2} ${y - 2}l.6 2M${x + 1.2} ${y - 2}l-.6 2" stroke="#8a7a60" stroke-width=".2"/>`).join('')
        + `<path d="M150 128q6 -2 10 1t10 0" stroke="#2a3a24" stroke-width=".9" fill="none"/>`; }

    // ——— the pole: an oar-like spar with a ball at the top, through his right fist ———
    const hp = handAt(u, { s: 2.5, m: 1, roll: 170, pose: 'wrap', r: 1.0, tone: SKIN, light: [-.6, -.75], sw: .32 }, G1, -94, 170);
    const PA = hp.axis[1] < 0 ? hp.axis : [-hp.axis[0], -hp.axis[1]];            // up the pole
    const at = y => { const t = (G1[1] - y) / -PA[1]; return [G1[0] + PA[0] * t, y]; };
    const top = at(6), base = at(210);
    // ——— the flag: hoisted from the top of the pole, streaming left over the black sails; folds turning in the moonlight ———
    let flag = '';
    { const N = 30, len = 74, h0 = at(9), h1 = at(54), A = 3.6, Rf = rng(5);
      const wv = t => A * Math.sin(t * Math.PI * 2 * 2.1 - .6) * (.25 + t);           // the wave across the cloth
      const dx = t => -len * t + Math.sin(t * Math.PI * 2 * 2.1 - .6 + 1.4) * 2.2 * t;   // folds bunch the length a little
      const topE = [], botE = [];
      for (let i = 0; i <= N; i++) { const t = i / N; topE.push([h0[0] + dx(t), h0[1] + wv(t) + t * t * 3]); botE.push([h1[0] + dx(t) + t * 3, h1[1] + wv(t) * 1.1 + t * t * 6 - t * 2]); }
      // the frayed fly: teeth along the last edge
      const fly = []; for (let k = 0; k <= 9; k++) { const t = k / 9, p = [lerp(topE[N][0], botE[N][0], t), lerp(topE[N][1], botE[N][1], t)]; fly.push([p[0] - (k % 2 ? 1 + Rf() * 3 : 0), p[1]]); }
      const out = topE.concat(fly.slice(1, -1), botE.slice().reverse());
      // shadow of the flag thrown faintly on nothing (it is in the air): skip; the cloth body
      flag += `<path d="M${out.map(P2).join('L')}Z" fill="#c8c8cc"/>`;
      // each strip shaded by how its fold turns to the moon, the tone running smoothly across it (no bands)
      const tone = t => { const sl = (wv(t + .02) - wv(t - .02)) / .04, I = Math.max(-1, Math.min(1, sl / 18 + .35)); return I > 0 ? mix('#e2e2e4', '#fffdf6', I) : mix('#e2e2e4', '#a4aabb', -I); };
      for (let i = 0; i < N; i++) { const c0 = tone(i / N), c1 = tone((i + 1) / N), g = nid('fl', u), m0 = [lerp(topE[i][0], botE[i][0], .5), lerp(topE[i][1], botE[i][1], .5)], m1 = [lerp(topE[i + 1][0], botE[i + 1][0], .5), lerp(topE[i + 1][1], botE[i + 1][1], .5)];
        const q = [topE[i], topE[i + 1], botE[i + 1], botE[i]]; if (i === N - 1) q.splice(2, 0, ...fly.slice(1, -1));
        flag += `<defs>${linGrad(g, m0[0], m0[1], m1[0], m1[1], [[0, c0, 1], [1, c1, 1]])}</defs><path d="M${q.map(P2).join('L')}Z" fill="url(#${g})" stroke="url(#${g})" stroke-width=".3"/>`; }
      // the hoist: a sleeve round the pole, stitched; the edges of the cloth; a few stains and a darn
      flag += `<path d="M${P2(topE[0])}L${P2(topE[1])}L${P2(botE[1])}L${P2(botE[0])}Z" fill="#e8e4d8" stroke="#8a8a90" stroke-width=".3"/>`
        + `<path d="M${topE.map(P2).join('L')}" stroke="#ffffff" stroke-width=".6" fill="none"/><path d="M${botE.map(P2).join('L')}" stroke="#5a6070" stroke-width=".5" fill="none"/>`
        + `<path d="M${fly.map(P2).join('L')}" stroke="#8a8e9a" stroke-width=".35" fill="none"/>`
        + `<ellipse cx="${f(lerp(topE[18][0], botE[18][0], .6))}" cy="${f(lerp(topE[18][1], botE[18][1], .6))}" rx="3" ry="1.8" fill="#b0a88e" opacity=".35"/>`
        + `<path d="M${f(lerp(topE[9][0], botE[9][0], .3))} ${f(lerp(topE[9][1], botE[9][1], .3))}l3 1.2m-3 .6l3 1.2" stroke="#9a968a" stroke-width=".3"/>`;
      // the moon through the thin cloth
      flag += glow(u, lerp(topE[10][0], botE[10][0], .4), lerp(topE[10][1], botE[10][1], .4), 30, 20, '#ffffff', .18); }
    let pole = K.shadeCyl(u, base[0], base[1], top[0], top[1], 1.5, L, 'oak', { r1: 1.8, r2: 1.3, outline: .35, seed: 6 })
      + K.shadeSphere(u, top[0] + PA[0] * 2, top[1] + PA[1] * 2, 2.2, L, 'brass', { outline: .3 })
      + `<path d="M${f(top[0] - .4)} ${f(top[1] + 4)}L${f(at(56)[0] - .4)} 56" stroke="#3a2a1a" stroke-width=".5" opacity=".6"/>`;   // the halyard

    // ——— the pirate: coat, waistcoat, shirt; the baldric across his chest ———
    let man = '';
    const coatT = { lit: '#4a4a58', half: '#24222a', shadow: '#0e0c12', outline: '#050408' };
    { const cg = nid('pc', u), wg = nid('pw', u);
      man += `<g transform="translate(${OFF[0]} ${OFF[1]})">`;
      man += `<defs>${linGrad(cg, 104, 0, 166, 0, [[0, '#4c5068', 1], [.25, '#24222c', 1], [.75, '#1e1c22', 1], [1, '#3a2a22', 1]])}${linGrad(wg, 0, 70, 0, 150, [[0, '#6a5a3a', 1], [1, '#2a2214', 1]])}</defs>`
        + `<path d="M104 175L107 92Q109 78 121 74L127 68Q132 72 138 68L146 74Q158 78 161 92L164 175Z" fill="url(#${cg})" stroke="#050408" stroke-width=".5"/>`
        + `<path d="M124 70Q132 80 140 70L144 175H120Z" fill="url(#${wg})" stroke="#1a1408" stroke-width=".4"/>`
        + [84, 94, 104, 114].map(y => K.shadeSphere(u, 132.8, y, .95, L, 'brass', { outline: .2 })).join('')
        // the shirt open at the neck, its loose collar points
        + `<path d="M125 68Q132 78 139 68L136 84Q132 88 128 84Z" fill="#e8e0cc" stroke="#5a5040" stroke-width=".35"/><path d="M125 68l-3 7l6 1zM139 68l3 7l-6 1z" fill="#f4eee0" stroke="#5a5040" stroke-width=".35"/>`
        // lapels, the moon's rim on his left shoulder and side
        + `<path d="M124 70L118 100L122 108L128 78Z" fill="#141218" stroke="#050408" stroke-width=".35"/><path d="M140 70L146 100L142 108L136 78Z" fill="#2a2834" stroke="#050408" stroke-width=".35"/>`
        + `<path d="M121 74Q109 78 107 92L104 175" stroke="#c8d8f4" stroke-width=".8" fill="none" opacity=".7"/>`
        // the baldric from his left shoulder down across to his right hip, a brass buckle
        + `<path d="M150 74L156 78L116 150L110 146Z" fill="#3a2414" stroke="#120804" stroke-width=".4"/><path d="M151 75L113 147" stroke="#8a5a30" stroke-width=".3" opacity=".7"/>`
        + `<rect x="128" y="110" width="7" height="6" rx="1" transform="rotate(-60 131.5 113)" fill="none" stroke="url(#brass${u})" stroke-width="1.2"/>`
        // the sash at the waist (under the glass), creases
        + `<path d="M107 140Q132 146 162 140L163 150Q132 156 106 150Z" fill="#6a1c18" stroke="#2a0806" stroke-width=".4"/><path d="M110 144Q132 149 160 144" stroke="#8a2c24" stroke-width=".5" fill="none"/>`;
      // the neck
      man += `<path d="M125 56L139 56L140 70Q132 75 124 70Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".35"/><path d="M126 64q6 4 12 0" stroke="${SKIN.shadow}" stroke-width=".6" fill="none" opacity=".5"/>`;
      man += '</g>'; }
    // ——— the arms: the right one bent to the pole on our left, the left one to the scroll on our right ———
    const hs = handAt(u, { s: 2.5, m: -1, roll: 12, pose: 'wrap', r: 1.08, tone: SKIN, light: [-.6, -.75], sw: .32 }, G2, -95, 180);
    { const sleeve = (s0, el, w, lt, rimOp) => H.cloth(u, { spine: [s0, [lerp(s0[0], el[0], .55), lerp(s0[1], el[1], .55)], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5)], [w[0], w[1]]],
        w: [14.4, 13.2, 12, 10.6, 9.4], tone: coatT, lit: lt, rim: '#c8d8f4', rimSide: lt, rimOp, seed: 9, drapes: 2, sw: .4,
        cuff: { from: .78, k: 1.22, tone: { lit: '#3a3a48', half: '#1c1a22', shadow: '#08070a', outline: '#050408' } } });
      man += sleeve([131, 94], [138, 126], hp.wrist, -1, .55) + sleeve([169, 94], [186, 126], hs.wrist, 1, .2);
      // lace at the wrists, showing beyond the cuffs
      for (const h of [hp, hs]) { const w = h.wrist; man += `<ellipse cx="${f(w[0])}" cy="${f(w[1])}" rx="3.4" ry="4.4" fill="#ece6d6" stroke="#6a6252" stroke-width=".3"/><path d="M${f(w[0] - 2)} ${f(w[1] - 3)}q1 3 0 6M${f(w[0])} ${f(w[1] - 4)}q1 4 0 8" stroke="#a89e88" stroke-width=".3" fill="none"/>`; } }

    // ——— the head: sly half-smile, eyes on us; long hair tied back, a short beard; the tricorn over it ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .3, dir: -1, nod: 3, tone: SKIN, light: [-.6, -.75], warm: { color: '#ffb46a', op: .16 },
      look: [.35, .05], brow: 'sly', smile: .45, hair: { style: 'tied', color: '#2a1a10', ribbon: '#6a1c18' }, hairColor: '#24160c', beard: 'short', moustache: true, iris: '#3a2416' });
    const hat = tricorn(u, hd, { r: HEAD.r, color: '#16141a', trim: '#a8884a', light: [-.6, -.75], rim: '#a8c0e8', y: -.62 });
    let face = hd.svg + hat.back + hat.front;
    { const e = hd.Q(-.82, .36, -.1); face += `<circle cx="${f(e[0])}" cy="${f(e[1] + 1)}" r="1.1" fill="none" stroke="url(#brass${u})" stroke-width=".55"/>`; }

    // ——— the scroll of the Code: rolled parchment in his left fist, a red ribbon and the seal hanging ———
    let scroll = '';
    { const a = hs.axis[1] < 0 ? hs.axis : [-hs.axis[0], -hs.axis[1]], t0 = [G2[0] - a[0] * 15, G2[1] - a[1] * 15], t1 = [G2[0] + a[0] * 17, G2[1] + a[1] * 17];
      const rr = 2.7, n = [-a[1], a[0]];
      scroll += K.shadeCyl(u, t0[0], t0[1], t1[0], t1[1], rr, L, 'linen', { ell: .35, face: 2, outline: .35, grain: false, seed: 4 })
        // the spiral of the roll at its top end, the loose outer edge of the sheet curling out
        + `<ellipse cx="${f(t1[0])}" cy="${f(t1[1])}" rx="${f(rr)}" ry="${f(rr * .4)}" transform="rotate(${f(Math.atan2(n[1], n[0]) * 180 / Math.PI)} ${f(t1[0])} ${f(t1[1])})" fill="#e8dcbc" stroke="#6a5a3a" stroke-width=".35"/>`
        + `<path d="M${f(t1[0] - n[0] * 1.6)} ${f(t1[1] - n[1] * 1.6 + .2)}q${f(n[0] * 1.6)} -.8 ${f(n[0] * 2.6)} 0q-1 .6 -2 0" stroke="#8a7a58" stroke-width=".3" fill="none"/>`
        + `<path d="M${f(t0[0] + n[0] * rr)} ${f(t0[1] + n[1] * rr + 3)}q${f(n[0] * 4)} 2 ${f(n[0] * 5)} 7q${f(-n[0] * 2)} -1 ${f(-n[0] * 3.4)} -2z" fill="#efe4c4" stroke="#6a5a3a" stroke-width=".3"/>`;
      // the ribbon round the roll below the fist, the wax seal swinging on its ends
      const rb = [G2[0] + a[0] * 9, G2[1] + a[1] * 9];
      scroll += `<path d="M${f(rb[0] - n[0] * rr)} ${f(rb[1] - n[1] * rr)}L${f(rb[0] + n[0] * rr)} ${f(rb[1] + n[1] * rr)}" stroke="#8a1c18" stroke-width="1.4"/>`
        + `<path d="M${f(rb[0] + n[0] * rr * .6)} ${f(rb[1] + 1)}q2 5 1 9M${f(rb[0] + n[0] * rr * .6)} ${f(rb[1] + 1)}q4 4 5 7" stroke="#8a1c18" stroke-width=".9" fill="none"/>`
        + K.shadeSphere(u, rb[0] + n[0] * rr * .6 + 1.2, rb[1] + 10.6, 2.4, L, 'paint-red', { outline: .3 })
        + `<path d="M${f(rb[0] + n[0] * rr * .6 + .2)} ${f(rb[1] + 10)}l2 1.4" stroke="#5a0a08" stroke-width=".4"/>`;
      scroll = hs.back + scroll + hs.front; }
    const poleHand = hp.back + pole + hp.front;

    // ——— the lantern on the sand by the pole ———
    let lamp = K.castShadow(u, L, { x: LAMP.x, y: LAMP.y, w: 12 * LAMP.s, h: 28 * LAMP.s, horizon: HZ }) + K.lantern(u, L, { x: LAMP.x, y: LAMP.y, s: LAMP.s, lit: true, seed: 3 });

    // ——— light: the lantern's pool, its warmth up his right side, the moon's cold on the left; the dark below ———
    let fg = K.localGlow(u, { x: LAMP.x, y: LAMP.y - 10, color: '#ffc070', power: .85, radius: 22 })
      + glow(u, 70, 120, 70, 50, '#ffb060', .12) + glow(u, 120, 70, 40, 60, '#c8d8ff', .08)
      + motes(14, 0, 60, 90, 40, '#e8f0ff', 3)
      + gloom(u, 100, 132, 100, 280, .5, '#04060a');
    return [bg, flag + man + poleHand + face + scroll + lamp + fg];
  } };
