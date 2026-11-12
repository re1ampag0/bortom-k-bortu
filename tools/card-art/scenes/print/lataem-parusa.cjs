// «Латаем паруса» (Жемчужина, РЕМОНТ: +2 Паруса; План — и ещё 1 Корпус), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Латаем паруса']): a shot hole in a black sail, a patch of new light canvas over it,
// the needle in a sailor's hand in a sailmaker's palm, a lantern for light. The setting moves aloft (brief: матрос
// на рее): we are on the yard behind the Pearl's black topsail at night; the patch is sewn along three sides, the
// sailor works up the last one, the loose top corner flaps back and shows the torn hole with the moon in it. The
// moon is behind the sail: the new canvas glows through (brief: заплата светится на просвет луны), the hole's shape
// shows through the patch; a lantern hung from the yard is the light on the hand and the cloth.
// Fixed against the first round: the sail lay flat like a floor with planks seen through the hole — now it hangs
// from the yard (robands, reef band with reef points, cloths and seams, old patches); the hand was a cylinder with
// a mitten — now a forearm in a rolled sleeve, a fist with fingers round the needle, the leather palm strap over it.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 120;                                         // eye level (we are aloft: the sea is far below, out of the frame)
const YD = { x1: -6, y1: 21, x2: 206, y2: 14, r: 4.8 }; // the yard
const yardY = x => lerp(YD.y1, YD.y2, (x - YD.x1) / (YD.x2 - YD.x1));
const LAMP = { x: 170, y: 57, s: 1.15, hang: 4 };
const FLAME = { x: 170, y: 57 - 7.5 * 1.15 };
const MOON = { x: 60, y: 61 };
// the patch (corners TL, TR, BR, BL) and the fold line of its loose corner: A on the left edge, B on the top edge
const PT = { TL: [42, 44], TR: [124, 41], BR: [126, 112], BL: [44, 114] }, FA = [42.4, 84], FB = [92, 42.4];
const light = { time: 'night', haze: .25, key: { type: 'point', x: FLAME.x, y: FLAME.y, h: .4, gy: 140, color: '#ffbe6a', power: 1, radius: 120 },
  fill: { color: '#34486c', power: .4 }, rim: { az: 0, color: '#c8dcff', power: .5 } };
const lightSky = { time: 'night', haze: .3, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 30, color: '#dfe8fa', power: .8 }, fill: { color: '#3d5680', power: .4 } };
const skel = { horizon: HZ, eye: 30, light: 'lantern hung from the yard (key) + the moon behind the sail (glow through the canvas, in the hole)', items: [
  ['yard', -6, 26, 212, 12, 'mast (out of frame)'], ['sail', -6, 290, 212, 270, 'yard (robands)'], ['patch', 42, 114, 84, 73, 'sail (sewn on 3 sides)'],
  ['flap', 42, 84, 50, 42, 'patch (its loose corner)'], ['hole', 50, 104, 60, 56, 'sail, under the patch'], ['lantern', 163, 57, 14, 38, 'yard (lanyard)'],
  ['hand + arm', -10, 140, 56, 60, 'from the near left edge, needle in the edge of the patch'], ['old patch', 140, 104, 26, 20, 'sail']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
// a ragged closed outline round (cx, cy): radii rx, ry, jagged by `j`
function ragged(R, cx, cy, rx, ry, n, j) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 - j * .5 + R() * j * (i % 2 ? .6 : 1.2); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return pts; }

module.exports = { name: 'Латаем паруса', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Ls = K.makeLight(lightSky, { horizon: 150 }), R = rng(23);
    const holeP = ragged(rng(5), 80, 76, 31, 29, 22, .5), holeD = 'M' + holeP.map(P2).join('L') + 'Z';
    const patchD = `M${P2(PT.TL)}L${P2(PT.TR)}L${P2(PT.BR)}L${P2(PT.BL)}Z`;
    // ——— the sail: black canvas hanging from the yard, the lantern's warm pool on it, the moon glowing through ———
    const sg = nid('sl', u), sw = nid('sw', u), sm = nid('sm', u);
    let bg = `<defs>${linGrad(sg, 0, 14, 0, 290, [[0, '#2a2a30', 1], [.35, '#1e1e24', 1], [1, '#0e0e12', 1]])}`
      + `${radGrad(sw, FLAME.x, FLAME.y + 8, 92, [[0, '#8a6a44', .75], [.3, '#5a4632', .45], [.7, '#33291e', .15], [1, '#33291e', 0]])}`
      + `${radGrad(sm, MOON.x + 8, MOON.y + 10, 70, [[0, '#4a5878', .55], [.5, '#2e3a54', .25], [1, '#2e3a54', 0]])}</defs>`
      + `<rect x="-6" y="0" width="212" height="290" fill="url(#${sg})"/><rect x="-6" y="0" width="212" height="290" fill="url(#${sm})"/><rect x="-6" y="0" width="212" height="290" fill="url(#${sw})"/>`;
    // the cloths of the sail: seams bowing a little (the sail bellies away from us), each a dark line and a lit edge
    for (let x = 6; x < 206; x += 17) { const b = (x - 100) * .04; bg += `<path d="M${f(x)} ${f(yardY(x) + 3)}Q${f(x + b)} 150 ${f(x + b * 1.6)} 290" stroke="#08080a" stroke-width=".9" fill="none" opacity=".8"/>`
      + `<path d="M${f(x + 1.1)} ${f(yardY(x) + 3)}Q${f(x + 1.1 + b)} 150 ${f(x + 1.1 + b * 1.6)} 290" stroke="#6a5a48" stroke-width=".35" fill="none" opacity=".45"/>`
      + `<path d="M${f(x - 1.6)} ${f(yardY(x) + 3)}Q${f(x - 1.6 + b)} 150 ${f(x - 1.6 + b * 1.6)} 290" stroke="#000" stroke-width=".3" fill="none" opacity=".4" stroke-dasharray="1 1.2"/>`; }
    // soft folds: the sag between the robands along the head, long creases down from them
    for (let x = 4; x < 206; x += 12) { const y = yardY(x) + 4; bg += `<path d="M${f(x)} ${f(y)}q6 5 12 0" stroke="#050507" stroke-width="1.4" fill="none" opacity=".55"/><path d="M${f(x + 1)} ${f(y + 1.6)}q5 4 10 0" stroke="#5a4c3c" stroke-width=".4" fill="none" opacity=".35"/>`; }
    for (const [x, y, l, a] of [[20, 28, 40, 12], [104, 24, 30, -10], [150, 24, 50, 8], [186, 120, 40, -6], [10, 120, 36, 10]]) { const dx = Math.sin(a * Math.PI / 180) * l, g = nid('cr', u);
      bg += `<defs>${linGrad(g, x, y, x + dx, y + l, [[0, '#000', .45], [1, '#000', 0]])}</defs><path d="M${f(x)} ${f(y)}q${f(dx * .5 + 2)} ${f(l * .5)} ${f(dx)} ${f(l)}" stroke="url(#${g})" stroke-width="2.4" fill="none"/>`; }
    // the reef band across the sail, a doubled strip with its reef points hanging on our (after) side
    { const y0 = 33; bg += `<path d="M-6 ${f(y0 + 1.2)}L206 ${f(y0 - 4)}L206 ${f(y0)}L-6 ${f(y0 + 5.2)}Z" fill="#26262c"/><path d="M-6 ${f(y0 + 1.2)}L206 ${f(y0 - 4)}" stroke="#5a4c3c" stroke-width=".4" opacity=".6"/><path d="M-6 ${f(y0 + 5.2)}L206 ${f(y0)}" stroke="#050507" stroke-width=".8" opacity=".8"/>`;
      for (let x = 2; x < 204; x += 9) { const yy = lerp(y0 + 3.2, y0 - 2, (x + 6) / 212), sw2 = (R() - .5) * 2;
        bg += `<path d="M${f(x)} ${f(yy)}q${f(sw2)} 3 ${f(sw2 * .4 + .6)} ${f(5.6 + R() * 1.4)}" stroke="#8a7a60" stroke-width=".7" fill="none" stroke-linecap="round"/><path d="M${f(x - .2)} ${f(yy)}q${f(sw2)} 3 ${f(sw2 * .4 + .4)} ${f(5.4)}" stroke="#2a2218" stroke-width=".3" fill="none"/>`; } }
    // old patches of the Pearl's sails, darker and coarse-stitched; a few small holes letting the moon through
    { const op = (pts, c) => { let s = `<path d="M${pts.map(P2).join('L')}Z" fill="${c}" stroke="#08080a" stroke-width=".5"/>`;
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3);
          for (let k = 0; k < n; k++) { const p = [lerp(a[0], b[0], (k + .5) / n), lerp(a[1], b[1], (k + .5) / n)]; s += `<path d="M${f(p[0] - .8)} ${f(p[1] - .9)}l1.6 1.8" stroke="#8a7a5e" stroke-width=".35"/>`; } }
        return s; };
      bg += op([[140, 86], [164, 84], [165, 104], [141, 105]], '#2c2a2c') + op([[4, 120], [26, 118], [28, 142], [3, 143]], '#2a282a') + op([[180, 168], [204, 166], [204, 190], [181, 191]], '#2c2a2c');
      for (const [x, y, r] of [[134, 60, 1], [24, 96, .8], [184, 132, 1.1]]) bg += `<circle cx="${x}" cy="${y}" r="${r}" fill="#9ab0d8" opacity=".7"/><circle cx="${x}" cy="${y}" r="${r + .6}" fill="none" stroke="#3a3a44" stroke-width=".4"/>`; }
    // scorching round the hole: the canvas browned and blackened outside the patch's edge
    { const g = nid('sc', u); bg += `<defs>${radGrad(g, 80, 76, 50, [[.55, '#3a2214', .55], [.8, '#2a1a10', .25], [1, '#2a1a10', 0]])}</defs><ellipse cx="80" cy="76" rx="52" ry="48" fill="url(#${g})"/>`; }
    // ——— the hole, seen through the loose corner: the night sky with the moon, the torn and charred canvas ———
    const ocl = nid('oc', u), hcl = nid('hc', u);
    let hole = `<defs><clipPath id="${ocl}"><path d="M${P2(PT.TL)}L${P2(FB)}L${P2(FA)}Z"/></clipPath><clipPath id="${hcl}"><path d="${holeD}"/></clipPath></defs>`;
    { let sky = K.sky(u, Ls, { horizon: 150, stars: 40, seed: 3 }) + K.sunMoon(u, Ls, { r: 6.2 }) + K.cloud(u, Ls, { x: 82, y: 78, w: 40, h: 5, seed: 7, far: .4 });
      hole += `<g clip-path="url(#${ocl})"><g clip-path="url(#${hcl})">${sky}</g>`;
      // the torn edge: frayed threads, the canvas curled and charred round it
      hole += `<path d="${holeD}" fill="none" stroke="#120c08" stroke-width="2.2"/><path d="${holeD}" fill="none" stroke="#5a3418" stroke-width=".7" opacity=".9"/>`;
      for (let i = 0; i < holeP.length; i++) { const p = holeP[i], dx = 80 - p[0], dy = 76 - p[1], l = Math.hypot(dx, dy), k = 2 + R() * 3.4;
        hole += `<path d="M${f(p[0])} ${f(p[1])}l${f(dx / l * k + (R() - .5) * 1.2)} ${f(dy / l * k + R() * 1.4)}" stroke="#2a2016" stroke-width=".35"/>`; }
      hole += '</g>'; }
    // ——— the patch: new light canvas glowing through with the moon behind it, the hole's shape showing through ———
    const pg = nid('pg', u), pc = nid('pc', u), pb = nid('pb', u);
    let patch = `<defs>${linGrad(pg, 126, 50, 42, 110, [[0, '#f6ead0', 1], [.45, '#ddd0b2', 1], [1, '#b8aa8c', 1]])}<clipPath id="${pc}"><path d="${patchD}"/></clipPath><filter id="${pb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`;
    patch += `<g filter="url(#drop${u})"><path d="${patchD}" fill="url(#${pg})"/></g><g clip-path="url(#${pc})">`;
    patch += `<path d="${holeD}" fill="#fff6e0" opacity=".5" filter="url(#${pb})"/>`;
    patch += K.localGlow(u, { x: MOON.x + 4, y: MOON.y + 4, color: '#e8f0ff', power: .5, radius: 40 }, { core: false });
    for (let y = 44; y < 116; y += 1.6) patch += `<path d="M40 ${f(y)}L128 ${f(y - 2.6)}" stroke="#8a7c62" stroke-width=".18" opacity=".35"/>`;
    for (let x = 42; x < 128; x += 1.7) patch += `<path d="M${f(x)} 40L${f(x + 1.8)} 116" stroke="#fff8e8" stroke-width=".16" opacity=".3"/>`;
    // the turned-under hem along each edge
    patch += `<path d="M${P2([45, 47])}L${P2([121, 44])}L${P2([123, 109])}L${P2([47, 111])}Z" fill="none" stroke="#a89878" stroke-width=".5" opacity=".7"/>`;
    patch += `</g><path d="${patchD}" fill="none" stroke="#6a5a40" stroke-width=".55"/><path d="M${P2(PT.TR)}L${P2(PT.BR)}" stroke="#fff8e6" stroke-width=".6" opacity=".7"/>`;
    // the stitches: done along the top (right of the fold), the right side, the bottom and the left side up to the needle
    { const st = (a, b, n, from = 0, to = 1) => { let s = ''; for (let k = 0; k < n; k++) { const t = (k + .5) / n; if (t < from || t > to) continue; const p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
        s += `<circle cx="${f(p[0] + 1.3)}" cy="${f(p[1] + 1.2)}" r=".35" fill="#2a2016"/><path d="M${f(p[0] - 1.4)} ${f(p[1] - 1.5)}L${f(p[0] + 1.3)} ${f(p[1] + 1.2)}" stroke="#f4ecd6" stroke-width=".6" stroke-linecap="round"/><path d="M${f(p[0] - 1.2)} ${f(p[1] - 1.1)}L${f(p[0] + 1.4)} ${f(p[1] + 1.4)}" stroke="#6a5a40" stroke-width=".25"/>`; }
        return s; };
      patch += st(FB, PT.TR, 10) + st(PT.TR, PT.BR, 20) + st(PT.BR, PT.BL, 23) + st(PT.BL, FA, 9, .45, 1); }
    // the loose corner, lifted by the wind and folded back over the patch: its back side, a crease at the fold, its shadow
    { const ft = (() => { const d = [FB[0] - FA[0], FB[1] - FA[1]], l = Math.hypot(...d), e = [d[0] / l, d[1] / l], v = [PT.TL[0] - FA[0], PT.TL[1] - FA[1]], pr = v[0] * e[0] + v[1] * e[1], foot = [FA[0] + e[0] * pr, FA[1] + e[1] * pr];
        return [foot[0] + (foot[0] - PT.TL[0]) * .62, foot[1] + (foot[1] - PT.TL[1]) * .62]; })();
      const flapD = `M${P2(FA)}Q${f(lerp(FA[0], ft[0], .5) - 2)} ${f(lerp(FA[1], ft[1], .5) + 3)} ${P2(ft)}Q${f(lerp(ft[0], FB[0], .5) + 3)} ${f(lerp(ft[1], FB[1], .5) + 1)} ${P2(FB)}Z`, fg2 = nid('fl', u), sh = nid('fs', u);
      patch += `<defs>${linGrad(fg2, FB[0], FB[1], FA[0], FA[1], [[0, '#e8dcbc', 1], [.6, '#c4b694', 1], [1, '#9a8c70', 1]])}<filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`
        + `<g clip-path="url(#${pc})"><path d="${flapD}" transform="translate(-3.4 3.6)" fill="#2a1c10" opacity=".55" filter="url(#${sh})"/></g>`
        + `<path d="${flapD}" fill="url(#${fg2})" stroke="#6a5a40" stroke-width=".5"/>`
        + `<path d="M${P2(FA)}L${P2(FB)}" stroke="#f8eed6" stroke-width=".8" opacity=".8"/>`
        + `<path d="M${P2(lerp2(FA, ft, .3))}Q${f(lerp(FA[0], FB[0], .5))} ${f(lerp(FA[1], FB[1], .5) + 4)} ${P2(lerp2(FB, ft, .3))}" stroke="#8a7a5a" stroke-width=".4" fill="none" opacity=".6"/>`
        + `<path d="M${P2(lerp2(FA, ft, .55))}L${P2(lerp2(FB, ft, .5))}" stroke="#fff6dc" stroke-width=".3" opacity=".5"/>`; }
    // ——— the yard over the head of the sail: the spar, the jackstay, the robands round it ———
    let yard = K.shadeCyl(u, YD.x1, YD.y1, YD.x2, YD.y2, YD.r, L, 'tar', { outline: .4, seed: 3 });
    yard += `<path d="M${YD.x1} ${f(YD.y1 - YD.r - .8)}L${YD.x2} ${f(YD.y2 - YD.r - .8)}" stroke="url(#iron${u})" stroke-width="1"/>`;
    for (let x = 4; x < 206; x += 12) { const y = yardY(x); yard += `<path d="M${f(x - 1)} ${f(y - YD.r - 1)}Q${f(x + 1.6)} ${f(y)} ${f(x + 1)} ${f(y + YD.r + 4)}" stroke="#7a6a50" stroke-width="1" fill="none"/><path d="M${f(x + .4)} ${f(y - YD.r - 1)}Q${f(x + 3)} ${f(y)} ${f(x + 2.4)} ${f(y + YD.r + 4)}" stroke="#7a6a50" stroke-width="1" fill="none"/><path d="M${f(x - .6)} ${f(y - YD.r)}Q${f(x + 2)} ${f(y)} ${f(x + 1.4)} ${f(y + YD.r + 3)}" stroke="#c8b48a" stroke-width=".3" fill="none" opacity=".7"/>`; }
    // ——— the lantern on its lanyard from the yard ———
    let fg = K.lantern(u, L, { ...LAMP, lit: true, seed: 2 }) + K.localGlow(u, { x: FLAME.x, y: FLAME.y, color: '#ffc070', power: .9, radius: 28 });
    // ——— the sailor's left arm from the near left: the wool sleeve rolled back, the bare forearm, the fist with the needle
    { const skin = { lit: '#f2bc8e', half: '#b77a52', core: '#a26a46', shadow: '#5c3424', outline: '#2a140a' };
      const coat = { lit: '#5a6a8a', half: '#2e3a52', shadow: '#10141e', outline: '#06080c' };
      const HS = 2.3, a = -50, ua = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)], n = [-ua[1], ua[0]];
      const tip = [44.6, 97], G = [tip[0] - n[0] * 9, tip[1] - n[1] * 9], W = [G[0] - ua[0] * 6 * HS, G[1] - ua[1] * 6 * HS], E = [W[0] - ua[0] * 25, W[1] - ua[1] * 25 + 3];
      // the thread from the eye of the needle, a loose loop back to the last stitch
      const eye = [G[0] - n[0] * 5.4, G[1] - n[1] * 5.4];
      fg += `<path d="M${P2(eye)}C${f(eye[0] - 12)} ${f(eye[1] - 10)} ${f(eye[0] - 16)} ${f(eye[1] + 12)} ${f(eye[0] - 4)} ${f(eye[1] + 16)}S${f(PT.BL[0] - 1)} ${f(PT.BL[1] - 8)} ${f(lerp(PT.BL[0], FA[0], .5) + 1)} ${f(lerp(PT.BL[1], FA[1], .55))}" stroke="#efe4c8" stroke-width=".55" fill="none"/>`;
      // the needle: through the fist, its point going into the edge of the patch
      fg += `<path d="M${P2(eye)}L${P2(tip)}" stroke="url(#silver${u})" stroke-width="1" stroke-linecap="round"/><path d="M${P2([lerp(eye[0], tip[0], .6), lerp(eye[1], tip[1], .6)])}L${P2(tip)}" stroke="#ffffff" stroke-width=".3" opacity=".8"/>`;
      fg += H.cloth(u, { spine: [E, [lerp(E[0], W[0], .5), lerp(E[1], W[1], .5) - 1], [W[0] + ua[0] * .6, W[1] + ua[1] * .6]], w: [11.4, 10, 7.2], tone: skin, lit: 1, rim: '#c8dcff', rimSide: -1, rimOp: .5, folds: false, capA: true, sw: .4 })
        + `<path d="M${f(E[0] + 9)} ${f(E[1] - 9)}q3 -3 7 -6M${f(E[0] + 11)} ${f(E[1] - 6)}q3 -2 6 -5" stroke="#7a4a30" stroke-width=".35" fill="none" opacity=".55"/>`;
      fg += H.cloth(u, { spine: [[-22, 160], [-8, 146], [E[0] + ua[0] * 2, E[1] + ua[1] * 2]], w: [18, 16, 14.6], tone: coat, lit: 1, rim: '#9ab4e0', rimSide: -1, rimOp: .5, cuff: { from: .74, k: 1.12, roll: true }, seed: 6, drapes: 3, sw: .4 });
      const hd = H.hand(u, { at: W, a, s: HS, m: 1, pose: 'grip', tone: skin, sw: .35 });
      fg += hd.back + hd.front;
      // the sailmaker's palm: a leather strap round the hand, an iron eye at the heel of the thumb, its stitching
      const Q = hd.P, strap = [Q(.8, -2.5), Q(3.8, -2.6), Q(4.1, 2.5), Q(.9, 2.3)];
      fg += `<path d="M${strap.map(P2).join('L')}Z" fill="#6a3e1e" stroke="#22120a" stroke-width=".4"/><path d="M${P2(Q(1.1, -2.2))}L${P2(Q(1.2, 2))}M${P2(Q(3.6, -2.2))}L${P2(Q(3.8, 2.2))}" stroke="#c89a62" stroke-width=".35" stroke-dasharray=".9 .7"/>`
        + `<path d="M${P2(Q(1.4, -2.4))}L${P2(Q(3.5, -2.5))}" stroke="#a87448" stroke-width=".5" opacity=".8"/>` + K.shadeSphere(u, ...Q(2.4, -2.9), 1, L, 'iron', { outline: .3 });
      fg += K.localGlow(u, { x: G[0] + 4, y: G[1] - 2, color: '#ffb060', power: .18, radius: 14 }, { core: false }); }
    // the light: the lantern's pool, motes in it, the dark corners and the dark under the glass
    fg += glow(u, FLAME.x - 20, FLAME.y + 20, 120, 110, '#ffb050', .16) + motes(14, 120, 30, 80, 70, '#ffe0b0', 5)
      + gloom(u, 120, 60, 0, 10, .25, '#04060c') + gloom(u, 100, 118, 100, 280, .55, '#04060c');
    return [bg, hole + patch + yard + fg];
  } };

function lerp2(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
