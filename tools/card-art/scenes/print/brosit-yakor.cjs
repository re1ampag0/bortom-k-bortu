// «Бросить якорь» (Жемчужина, ЗАРЯД, +2 урона, без штрафа за диагональ), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Бросить якорь']): a cut-away over and under the water in a shallow bay. The black ship
// has let go her anchor at full way and swings round on it: the chain runs taut from the hawse down into the water
// to the anchor biting into the sand (a furrow where it dragged, a cloud of silt); she heels in the turn, a bow wave
// at her stem, the white arc of her turn round the chain on the water; the side that has come round fires at the enemy
// standing off at an angle on the left (flashes at her ports, the smoke thrown towards the enemy, a shot falls by her).
// Step 3 (the user): the anchor of the right form — the kit's anchor: shank, an oak stock across it, arms with flukes,
// the ring, the chain from the hawse — plunging crown first into the water with a crown of spray, a column of air and
// bubbles round it under the surface; the ship the kit's Pearl as she is (no pitch or roll), her bottom under the
// water drawn to her own lines (forefoot, keel, sternpost, rudder) instead of a slab. Details: the hawse hole, the
// chain smoking with rust as it runs out, a fish darting off, the anchor's shadow on the sand.
// The light: a late afternoon sun high on the right; under the water its shafts slant down to the left.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;

const HZ = 64, WL = 86;   // horizon; the waterline = the cut through the water
const light = { time: 'day', haze: .3, key: { type: 'sun', x: 166, y: 16, color: '#ffe8bc', power: .95 }, fill: { color: '#8fb8d8', power: .5 } };
const SHIP = { kind: 'pearl', x: 126, y: WL, scale: .82, sails: 'reefed', wake: true, seed: 4 };   // the kit's Pearl as she is (step 3: no pitch, no roll)
const HAWSE = [85.8, 77.6];                                       // the hawse hole on her bow (pearl X -49, H 10)
const ANC = { x: 55, y: 111, h: 40, rot: 6 };                      // the anchor plunging crown first: the crown 25 under the surface, the stock over it
// the near gun deck's ports (pearl row h 9.4, X -22 / -2 / 18 on the sheer — the kit's rule), picture points
const PORTS = [-22, -2, 18].map(X => { const sp = K.SHIP_SPECS.pearl, t = X / (sp.len / 2), sh = (t < 0 ? sp.sheer[0] : sp.sheer[1]) * t * t, H = 9.4 + sh * Math.min(1.25, 9.4 / sp.free);
  return [SHIP.x + SHIP.scale * X, WL - SHIP.scale * H]; });
const skel = { horizon: HZ, eye: 3, items: [['pearl', 46, WL, 136, 83, 'water'], ['chain', 58, 74, 30, 8, 'hawse -> ring (running out)'],
  ['anchor', 38, 66, 36, 46, 'plunging: the stock and ring over the surface, the crown in the water'], ['splash', 48, 66, 26, 20, 'water at the shank'], ['enemy', 14, 65, 22, 14, 'water (far)'], ['wake', 2, 86, 184, 20, 'water (round the chain)'], ['flashes', 94, 82, 50, 8, 'near ports'], ['smoke', 60, 82, 84, 26, 'ports -> enemy']] };

module.exports = { name: 'Бросить якорь', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    const R = rng(31);
    const line2 = (d, w, c, op) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    // ——— above the water: sky, clouds, a low green island far on the right, the bay
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[40, 30, 56, 10, 4, .1], [120, 18, 40, 7, 9, .2], [188, 52, 34, 6, 6, .5], [76, 58, 44, 5, 13, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    { const ig = nid('ig', u), sea = L.pal.sky[3];
      bg += `<defs>${linGrad(ig, 0, HZ - 9, 0, HZ, [[0, mix('#5e8a58', sea, .45)], [1, mix('#3e6440', sea, .4)]])}</defs>`
        + `<path d="M140 ${HZ}q6 -6 16 -6q8 -4 18 -1q10 -2 16 2q6 2 12 5z" fill="url(#${ig})"/><path d="M144 ${HZ - .4}q26 -1.4 60 0" stroke="${mix('#f0e2b8', sea, .3)}" stroke-width=".8" fill="none"/>`;
      for (const [x, h, b] of [[160, 10, -2], [168, 12, 1.6], [180, 9, -1]]) { const tx = x + b, ty = HZ - 6 - h, c = mix('#2e4a2c', sea, .4);
        bg += `<path d="M${x} ${HZ - 5}q${f(b * .4)} ${f(-h * .5)} ${f(b)} ${-h}" stroke="${c}" stroke-width=".8" fill="none"/>`
          + [-150, -110, -60, -20, 25].map(a => { const r = a * Math.PI / 180, l = 4.4; return `<path d="M${f(tx)} ${f(ty)}q${f(Math.cos(r) * l * .5)} ${f(Math.sin(r) * l * .5 - 1.2)} ${f(Math.cos(r) * l)} ${f(Math.sin(r) * l + 1.2)}" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round"/>`; }).join(''); } }
    bg += K.water(u, L, { horizon: HZ, bottom: WL + 1, swell: .35, seed: 6, glitter: 166 });
    // the enemy standing off at an angle, far on the left; our shot falls by her
    bg += `<g data-far="">${K.ship(u, L, { kind: 'endeavour', x: 24, y: HZ + 1.4, scale: .21, detail: 'far', flip: true, seed: 3 })}</g>`
      + K.splash(u, { x: 38, y: HZ + 2, w: 7, h: 11, seed: 3, L }) + K.splash(u, { x: 12, y: HZ + 2.4, w: 5, h: 7, seed: 4, L });
    // the wake of her turn, plain on the water: a broad white arc that starts under her stern, swings out to the
    // right and round behind her, comes out again beyond her bow and closes in towards the point where the chain
    // went in — she has spun on the spot round her anchor. Fresh and wide at the stern, older and thinner round the
    // far side; wider near us (perspective)
    { const id = nid('ab', u), C = { x: 96, y: 79, rx: 96, ry: 11 }, th0 = .66, th1 = -3.6, N = 90, foamC = mix(L.pal.sea[0], '#ffffff', .82);
      const P = s => { const th = th0 + (th1 - th0) * s; return [C.x + C.rx * Math.cos(th), C.y + C.ry * Math.sin(th)]; };
      let halo = '', core = '', lip = '';
      for (let i = 0; i < N; i++) { const s0 = i / N, s1 = (i + 1.2) / N, [x0, y0] = P(s0), [x1, y1] = P(s1), k = Math.max(0, (y0 - HZ) / (WL - HZ)), age = 1 - s0 * .45, w = (.7 + 5.2 * k) * age;
        halo += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke-width="${f(w * 1.9)}"/>`; core += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke-width="${f(w)}" opacity="${f(.55 + .4 * age)}"/>`;
        lip += `<path d="M${f(x0)} ${f(y0 + w * .42)}L${f(x1)} ${f(y1 + w * .42)}" stroke-width="${f(Math.max(.25, w * .18))}"/>`; }
      bg += `<defs><filter id="${id}" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>`
        + `<g filter="url(#${id})" stroke="${foamC}" stroke-linecap="round" fill="none" opacity=".5">${halo}</g>`
        + `<g stroke="#f6fffc" stroke-linecap="round" fill="none">${core}</g><g stroke="#ffffff" stroke-linecap="round" fill="none" opacity=".9">${lip}</g>`;
      // churned foam along it: patches and streaks, more and bigger where it is fresh and near
      for (let s = .01; s < 1; s += .018 + R() * .02) { const [x, y] = P(s), k = Math.max(0, (y - HZ) / (WL - HZ)), age = 1 - s * .45;
        bg += K.foam(u, { x: x + (R() - .5) * 2, y: y + (R() - .5) * (.6 + k * 1.6), w: (2.4 + k * 10) * age, h: (.3 + k * 1.3) * age, seed: 40 + Math.round(s * 300), L }); } }

    // ——— the ship: the kit's Pearl, wake and foam at her stem
    bg += K.ship(u, L, SHIP);
    // the hawse hole on her bow: a dark eye with an iron lip, the chain coming out of it
    bg += `<ellipse cx="${HAWSE[0]}" cy="${HAWSE[1]}" rx="1.3" ry="1" fill="#07080a" stroke="#6a6c70" stroke-width=".35"/><path d="M${HAWSE[0] - 1.2} ${HAWSE[1] - .5}q1.2 -.9 2.4 0" stroke="#c8ccd0" stroke-width=".25" fill="none" opacity=".7"/>`
      + `<path d="M${HAWSE[0] - .6} ${HAWSE[1] + 1}q-.4 2 .2 4" stroke="#7a4a2a" stroke-width=".5" fill="none" opacity=".5"/>`;   // a rust streak under it

    // ——— under the water: the body of the water, the shafts of the sun, the sand sloping away to the right
    let fg = '';
    const W0 = '#5cc0c4', W1 = '#1e7c92', W2 = '#0a3a56', W3 = '#04182a';
    { const wg = nid('wg', u); fg += `<defs>${linGrad(wg, 0, WL, 0, 290, [[0, W0], [.12, W1], [.42, W2], [1, W3]])}</defs><rect x="0" y="${WL}" width="200" height="${290 - WL}" fill="url(#${wg})"/>`; }
    { const sg = nid('sg', u), sb = nid('sb', u); fg += `<defs>${linGrad(sg, 0, WL, 0, 220, [[0, '#e8fff4', .5], [.5, '#bff0e8', .16], [1, '#bff0e8', 0]])}<filter id="${sb}" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><g filter="url(#${sb})">`;
      for (const [x, w] of [[46, 9], [92, 14], [126, 6], [158, 16], [188, 8]]) fg += `<path d="M${x} ${WL}h${w}l${f(-48 - w * .5)} 140h${-w * 1.6}z" fill="url(#${sg})" style="mix-blend-mode:screen"/>`;
      fg += `</g>`; }
    // her bottom under the water, to her own lines: the forefoot curving down from the stem, the keel, the run up to
    // the sternpost, the rudder; foul with weed and barnacles, seen through the green water
    const hp = (X, H) => [SHIP.x + SHIP.scale * X, WL - SHIP.scale * H];
    const KEEL = [[-52, 0], [-51.6, -2.6], [-50.4, -5], [-48.2, -7.1], [-45, -8.5], [-40, -9], [30, -9], [40, -8.7], [46, -7.6], [49.6, -5.4], [51.4, -2.6], [52, 0]];
    { const hg = nid('hg', u), hc = nid('hc', u), d = 'M' + KEEL.map(q => hp(...q).map(f).join(' ')).join('L') + 'Z';
      fg += `<defs>${linGrad(hg, 0, WL, 0, WL + 8, [[0, '#2a4c4e'], [.45, '#1c3c40'], [1, '#0e2a32']])}<clipPath id="${hc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${hg})"/>`
        + `<g clip-path="url(#${hc})">` + Array.from({ length: 34 }, () => { const p = hp(-48 + R() * 98, -.4 - R() * 6); return `<path d="M${f(p[0])} ${f(p[1])}q${f((R() - .5) * 2)} ${f(1.4 + R() * 2)} ${f((R() - .5) * 3)} ${f(2.6 + R() * 3)}" stroke="${R() > .5 ? '#3a6a3a' : '#5a7a40'}" stroke-width="${f(.4 + R() * .5)}" fill="none" opacity=".75"/>`; }).join('')
        + Array.from({ length: 22 }, () => { const p = hp(-48 + R() * 98, -.5 - R() * 7.5); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.3 + R() * .5)}" fill="#a8b8a8" opacity=".5"/>`; }).join('')
        + [-2.6, -5.2, -7.6].map(H => { const a = hp(-47, H), b = hp(49, H); return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#0a1e24" stroke-width=".3" opacity=".5"/>`; }).join('')
        + Array.from({ length: 12 }, () => { const p = hp(-46 + R() * 94, -.6 - R() * 4), w = 4 + R() * 6; return `<path d="M${f(p[0])} ${f(p[1])}q${f(w / 2)} ${f(-1 - R())} ${f(w)} 0" stroke="#8ae0d8" stroke-width=".35" fill="none" opacity=".45"/>`; }).join('') + `</g>`
        + `<path d="M${KEEL.slice(5, 8).map(q => hp(...q).map(f).join(' ')).join('L')}" stroke="#06141a" stroke-width="1" fill="none"/>`;
      // the rudder hanging off the sternpost
      { const a = hp(51.6, -.2), b = hp(55.6, -.2), c = hp(55, -8.4), d2 = hp(49.4, -8.2); fg += `<path d="M${[a, b, c, d2].map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="#183438" stroke="#0a1e24" stroke-width=".4"/>`; } }
    // the sand: a slope from the shallows on the left down into the deep on the right; ripples, stones, weed
    { const sg = nid('sd', u), d = 'M-10 134Q20 138 50 148Q90 160 130 172Q170 186 210 196L210 292L-10 292Z';
      fg += `<defs>${linGrad(sg, 0, 134, 0, 260, [[0, '#d6c89a'], [.18, '#a49a74'], [.5, '#4a5a52'], [1, '#0e2230']])}</defs><path d="${d}" fill="url(#${sg})"/>`
        + `<path d="M-10 134Q20 138 50 148Q90 160 130 172Q170 186 210 196" stroke="#f4ecc8" stroke-width=".9" fill="none" opacity=".6"/>`;
      for (let i = 0; i < 14; i++) { const x = R() * 200, y = 136 + x * .3 + 4 + R() * 26, w = 6 + R() * 10; fg += `<path d="M${f(x)} ${f(y)}q${f(w / 4)} -1.2 ${f(w / 2)} 0t${f(w / 2)} 0" stroke="#f0e6c0" stroke-width=".5" fill="none" opacity="${f(.15 + R() * .25)}"/>`; }
      for (let i = 0; i < 9; i++) { const x = 50 + R() * 150, y = 146 + (x - 50) * .32 + R() * 6; fg += K.rock(u, L, { x, y, w: 3 + R() * 6, h: 2 + R() * 3, seed: 60 + i, contact: false }); }
      for (let i = 0; i < 26; i++) { const x = -4 + R() * 120, y = 140 + x * .24 + R() * 10, w = 3 + R() * 6; fg += `<path d="M${f(x)} ${f(y)}q${f(w * .5)} ${f(-1 - R())} ${f(w)} ${f(R() - .5)}" stroke="#fff8d8" stroke-width="${f(.3 + R() * .4)}" fill="none" opacity="${f(.25 + R() * .3)}"/>`; }
      // the anchor's shadow on the sand below it, cast down-left by the high sun: a soft dark blot it is about to hit
      const ab = nid('ab', u); fg += `<defs><filter id="${ab}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><ellipse cx="${ANC.x - 9}" cy="153" rx="15" ry="3.4" fill="#2a3a30" opacity=".4" filter="url(#${ab})"/>`; }
    // the weed and the fish, startled by the anchor: darting away from it to the right, one turning sharply
    { const weed = (x, y, h, c, sd) => { const Rw = rng(sd); let o = ''; for (let k = 0; k < 4; k++) { const hh = h * (.6 + Rw() * .5), bx = x + (k - 1.5) * 1.6; o += `<path d="M${f(bx)} ${f(y)}q${f(-2 - Rw() * 3)} ${f(-hh * .3)} ${f(-1)} ${f(-hh * .6)}t${f(-2 + Rw() * 2)} ${f(-hh * .4)}" stroke="${c}" stroke-width="${f(1 + Rw() * .6)}" fill="none" stroke-linecap="round"/>`; } return o; };
      fg += weed(70, 155, 14, '#3e7a50', 3) + weed(108, 165, 12, '#346a48', 5) + weed(150, 180, 16, '#2e5e44', 7) + weed(4, 140, 9, '#4a8a58', 9);
      const fish = (x, y, s, c, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${-s} ${s})"><path d="M-6 0q3 -3 7 -2.6q2 .6 3.4 2.6q-1.4 2 -3.4 2.6q-4 .4 -7 -2.6zM4 0l3.6 -2.6v5.2z" fill="${c}"/><path d="M-5 -.6q4 -2 8 -.6" stroke="#e8fff8" stroke-width=".4" fill="none" opacity=".6"/><circle cx="-4" cy="-.4" r=".5" fill="#06121a"/></g>`;
      for (const [x, y, s, rot] of [[96, 118, 1, -8], [106, 123, .85, 4], [90, 128, .8, -20], [116, 114, .7, 0], [110, 130, .7, 12]]) fg += fish(x, y, s, '#8ab8c0', rot);
      // the wakes of their dart: a few bubbles behind each
      for (const [x, y] of [[90, 118], [100, 123], [84, 127]]) fg += [0, 1, 2].map(i => `<circle cx="${f(x - i * 2.2)}" cy="${f(y + (R() - .5))}" r="${f(.35 + i * .1)}" fill="none" stroke="#e8fff8" stroke-width=".3" opacity="${f(.6 - i * .15)}"/>`).join(''); }
    // the water's own colour over everything under it, thicker with depth
    { const tg = nid('tg', u); fg += `<defs>${linGrad(tg, 0, WL, 0, 290, [[0, W1, .06], [.25, W1, .18], [.6, W2, .5], [1, W3, .8]])}</defs><rect x="0" y="${WL}" width="200" height="${290 - WL}" fill="url(#${tg})"/>`; }

    // ——— the anchor plunging, crown first (the kit's anchor: shank, the oak stock across it, arms with flukes, ring).
    // Under the water: the column of air dragged down round the shank and the arms, silver bubbles streaming up off it;
    // a light film of water over the iron. Above: the stock and ring in a crown of spray, the chain from the hawse
    const anc = K.anchor(u, L, { x: ANC.x, y: ANC.y, h: ANC.h, rot: ANC.rot, contact: false, seed: 5 }), ring = K.anchor.ring(ANC);
    { const cu = nid('cu', u), ca = nid('ca', u), cv = nid('cv', u);
      fg += `<defs><clipPath id="${cu}"><rect x="-10" y="${WL}" width="220" height="210"/></clipPath><filter id="${cv}" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>`
        + `${linGrad(ca, 0, WL, 0, ANC.y + 4, [[0, '#f4fffc', .75], [.5, '#d8f6f2', .35], [1, '#d8f6f2', .05]])}</defs>`;
      // the column of air: wide at the surface, thinning down to the crown
      fg += `<path d="M${ANC.x - 9} ${WL}Q${ANC.x - 6} ${WL + 14} ${ANC.x - 2.4} ${ANC.y - 6}L${ANC.x + 4.6} ${ANC.y - 6}Q${ANC.x + 9} ${WL + 14} ${ANC.x + 11} ${WL}Z" fill="url(#${ca})" filter="url(#${cv})"/>`;
      // the anchor under the water, its iron dimmed and cooled by the water over it
      fg += `<g clip-path="url(#${cu})"><g opacity=".8">${anc}</g></g>`;
      // bubbles streaming up off the iron: bigger near the surface, a silver rim each
      const Rb = rng(77); for (let i = 0; i < 46; i++) { const t = Rb(), y = WL + 1 + t * (ANC.y - WL - 2), half = 3 + (1 - t) * 6, x = ANC.x + 1 + (Rb() - .5) * 2 * half + (ANC.y - y) * .1, r = .3 + (1 - t) * .9 * Rb() + .2;
        fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#e8fff8" fill-opacity=".18" stroke="#f4fffc" stroke-width=".3" opacity="${f(.45 + Rb() * .45)}"/>`; }
      // off the flukes: small trails where the arms cut the water
      for (const e of [-1, 1]) { const q = ANC.h / 40, tip = [ANC.x + e * 14.9 * q + 1.4, ANC.y - 14.8 * q]; for (let i = 0; i < 5; i++) fg += `<circle cx="${f(tip[0] + (Rb() - .5) * 2)}" cy="${f(tip[1] - 2 - i * 2.6)}" r="${f(.3 + Rb() * .35)}" fill="none" stroke="#f4fffc" stroke-width=".3" opacity=".7"/>`; } }

    // the cut: the surface seen edge-on — a bright wavering line, the underside of the surface mirroring the light
    // (fainter over her bottom, which is dark right up to the surface)
    { const sl = nid('sl', u); let d = `M0 ${WL}`; for (let x = 0; x <= 200; x += 10) d += `Q${x + 5} ${f(WL + (x % 20 ? -1 : 1) * .9)} ${x + 10} ${WL}`;
      const h0 = hp(-52, 0)[0], h1 = hp(52, 0)[0];
      fg += `<defs>${linGrad(sl, 0, WL, 0, WL + 6, [[0, '#e8fff8', .55], [1, '#e8fff8', 0]])}</defs><rect x="0" y="${WL}" width="${f(h0)}" height="6" fill="url(#${sl})"/><rect x="${f(h1)}" y="${WL}" width="${f(200 - h1)}" height="6" fill="url(#${sl})"/>`
        + `<rect x="${f(h0)}" y="${WL}" width="${f(h1 - h0)}" height="3" fill="url(#${sl})" opacity=".3"/><path d="${d}" stroke="#f4fffc" stroke-width="1.1" fill="none" opacity=".85"/>`; }

    // ——— above the water: the spray thrown up round the shank (behind the iron), the anchor's top, the chain
    fg += K.splash(u, { x: ANC.x + 1, y: WL, w: 20, h: 17, seed: 3, L, wind: -.3 }) + K.splash(u, { x: ANC.x - 6, y: WL + .3, w: 9, h: 9, seed: 7, L, wind: -.6 });
    { const ca2 = nid('ca2', u); fg += `<defs><clipPath id="${ca2}"><rect x="-10" y="-10" width="220" height="${WL - 1.2 + 10}"/></clipPath></defs><g clip-path="url(#${ca2})">${anc}</g>`;
      // a film of water streaming off the stock and running down the shank
      fg += `<path d="M${f(ring.x - 8)} ${f(ring.y + 8.6)}q.4 2 -.2 4M${f(ring.x + 7.6)} ${f(ring.y + 4.2)}q.5 2.4 0 4.4" stroke="#e8fff8" stroke-width=".5" fill="none" opacity=".7"/>`; }
    // the chain running out of the hawse to the ring: a slack bight (she is paying it out), rust dust off it
    { const mid = [(HAWSE[0] + ring.x) / 2 + 1, Math.max(HAWSE[1], ring.y) + 3.2];
      fg += K.chain(u, L, [HAWSE, [HAWSE[0] - 6, HAWSE[1] + 2.4], mid, [ring.x + 6, ring.y + 1.6], [ring.x + .6, ring.y + .4]], { link: 3.2, seed: 9 });
      const Rr = rng(5); for (let i = 0; i < 10; i++) { const x = HAWSE[0] - 2 - Rr() * 10, y = HAWSE[1] - 1 - Rr() * 4; fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.25 + Rr() * .35)}" fill="#a8683a" opacity="${f(.3 + Rr() * .3)}"/>`; } }
    // the spray falling in front: drops and a foam ring at the shank
    fg += K.foam(u, { x: ANC.x + 1, y: WL + .2, w: 16, h: 1.4, seed: 5, L })
      + Array.from({ length: 16 }, () => { const a = -Math.PI * (.1 + R() * .8), d = 6 + R() * 12, x = ANC.x + Math.cos(a) * d, y = WL - 4 + Math.sin(a) * d * .9; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(.35 + R() * .35)}" ry="${f(.5 + R() * .5)}" fill="#f4fffc" opacity="${f(.55 + R() * .4)}" transform="rotate(${f(a * 180 / Math.PI + 90)} ${f(x)} ${f(y)})"/>`; }).join('');
    // the side that has come round to the enemy fires: flashes at three ports of her gun deck, the fire and the
    // smoke thrown out towards the enemy (to the left, over her bow and the water)
    for (const [i, [x, y]] of PORTS.entries()) {
      fg += K.smoke(u, L, { x: x - 6, y: y - .5, w: i ? 26 : 20, h: i ? 13 : 10, wind: -2.2, seed: 3 + i * 4, opacity: .95, glow: { color: '#ffb050', power: .5 } }); }   // short, so the smoke stays off the anchor
    for (const [i, [x, y]] of PORTS.entries()) { const fb = nid('fb', u);
      fg += `<defs>${radGrad(fb, x - 1, y, 5, [[0, '#ffffff', 1], [.25, '#fff0b0', 1], [.55, '#ffc040', .85], [1, '#ff7a1e', 0]])}</defs><circle cx="${f(x - 1)}" cy="${f(y)}" r="5" fill="url(#${fb})"/>`
        + K.muzzleFlash(u, { x: x - .6, y, dir: 172, len: 13, seed: i, smoke: false }); }
    return [bg, fg];
  } };
