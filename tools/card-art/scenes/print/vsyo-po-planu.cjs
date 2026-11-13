// «Всё по плану» (Жемчужина, РЕАКЦИЯ: отмените Заряд, сыгранный на Залп по вашей команде), refined from the
// first-round scene (portrait-pearl.cjs SCENES['Всё по плану']): the captain's table at night in the stern cabin, the
// chart with the route drawn to a cross, and on it the enemy's special charge, intercepted before it reached the gun —
// a canvas bag of grapeshot tied with twine, and the slow match that was to fire it cut in two by a dagger: the
// burning end has crept up to the cut and is going out with a last thread of smoke, a gap, then the clean end that
// runs on under the bag. Round them the hat, the candle, the compass, the mug and a little spilt rum.
// Fixed against the first round: the bag keeps its old silhouette (a squat sack, the neck gathered and tied) but now
// the balls press their lumps through the canvas and a turn of twine pinches its belly; the flat wall and the table
// seen from nowhere — now a 2.5D cabin seen from above: the stern window and walls small at the top, the table's
// planks run to one vanishing point; the cut is shown plainly in the free space left of the bag, the dagger standing
// at it and throwing its shadow on the chart. Light: the candle on the table (key, warm, right), the moon through the
// stern window (cold rim and fill from behind).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, glow, gloom, motes } = PK;

const HZ = 30, VX = 100;                        // eye level (the sea horizon in the window), the vanishing point
const TB = 52;                                  // the table's far edge (high: the camera looks down on the table)
const CANDLE = { x: 162, y: 90, s: 1.35, len: 13, lit: true, seed: 6 };
const BAG = { x: 102, y: 126, k: 1.18 };                         // the grapeshot bag: the middle of its foot on the chart
const CUT = [[55.5, 102.4], [61.6, 105.4]];    // the slow match's two cut ends: the burnt one (left), the one to the bag
const light = { time: 'night', haze: .3, key: { type: 'point', ...K.candle.local(CANDLE), color: '#ffbc66', power: 1, radius: 110 },
  fill: { color: '#34405e', power: .35 }, rim: { az: 0, color: '#b0c4ff', power: .45 } };
const lightOut = { time: 'night', haze: .2, key: { type: 'moon', x: 122, y: 17, el: 22, color: '#e8eeff', power: .8 } };
const skel = { horizon: HZ, eye: 1.5, light: 'candle on the table, right (key, warm) + the moon through the stern window (rim, fill)', items: [
  ['back wall + stern window', 18, TB, 164, TB, 'the stern, behind the table', { bg: 1 }], ['table top', -10, 290, 220, 220, 'ground: planks to the VP', { edge: 1 }],
  ['chart', 2, 138, 196, 80, 'on the table'], ['grapeshot bag', 66, 127, 72, 86, 'stands on the chart'], ['tag', 132, 126, 16, 12, 'tied to the neck, lies on the chart'],
  ['slow match', 14, 121, 70, 32, 'on the chart: cut in two, the burnt end smoulders out at the gap'], ['dagger', 50, 100, 16, 38, 'point in the table by the cut'],
  ['hat', 8, 80, 44, 24, 'on the table'], ['candle', 152, 90, 20, 34, 'on the table'], ['compass', 150, 126, 32, 14, 'on the chart'], ['mug', 18, 128, 18, 20, 'on the table']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, y) => { const t = (y - HZ) / (p[1] - HZ); return [VX + (p[0] - VX) * t, y]; };

module.exports = { name: 'Всё по плану', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(23);
    const FL = [light.key.x, light.key.y];
    // ——— the cabin: the stern wall facing us, the side walls running to the VP, the deckhead with two beams ———
    const WL = 22, WR = 178, WT = 4;           // the stern wall's sides and top (where it meets the deckhead)
    let bg = woodTex(u, WL, WT, WR - WL, TB - WT, '#4a2e18', '#22140a', '#0c0704', 10, true, 12);
    bg += `<path d="M-10 -10L${WL} ${WT}L${WL} ${TB}L-10 ${TB + 30}Z" fill="#20120a"/><path d="M210 -10L${WR} ${WT}L${WR} ${TB}L210 ${TB + 30}Z" fill="#160c06"/>`;
    // planks of the side walls: lines from the stern wall's edge outwards, away from the vanishing point
    const out = (x, y, X) => { const t = (X - VX) / (x - VX); return [X, HZ + (y - HZ) * t]; };
    for (const y of [12, 22, 32, 42]) { const a = out(WL, y, -10), b = out(WR, y, 210); bg += `<path d="M${WL} ${y}L${P2(a)}" stroke="#0a0503" stroke-width=".7" opacity=".7"/><path d="M${WR} ${y}L${P2(b)}" stroke="#0a0503" stroke-width=".7" opacity=".7"/>`; }
    bg += `<rect x="-10" y="-10" width="220" height="${WT + 10}" fill="#120a05"/><path d="M-10 ${WT}H210" stroke="#3a2412" stroke-width="1.2"/>`
      + `<path d="M${WL} ${WT}V${TB}M${WR} ${WT}V${TB}" stroke="#0a0503" stroke-width="1.6"/><path d="M${WL + .8} ${WT}V${TB}" stroke="#7a5030" stroke-width=".4" opacity=".6"/>`;
    // the stern window: three lights in a heavy frame, the moonlit sea outside, the sill catching the moon
    { const x0 = 64, x1 = 136, y0 = 10, y1 = 38, cl = nid('sw', u);
      bg += `<rect x="${x0 - 5}" y="${y0 - 5}" width="${x1 - x0 + 10}" height="${y1 - y0 + 11}" rx="1.5" fill="#2a180a" stroke="#0a0503" stroke-width=".8"/>`
        + `<defs><clipPath id="${cl}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><g clip-path="url(#${cl})">`
        + K.sky(u, Lo, { horizon: HZ, stars: true, seed: 3 }) + K.sunMoon(u, Lo, { r: 3.6 }) + K.cloud(u, Lo, { x: 86, y: 19, w: 20, h: 2.8, seed: 5, far: .5 })
        + K.water(u, Lo, { horizon: HZ, bottom: y1 + 2, swell: .3, seed: 4, glitter: 122 }) + `</g>`;
      for (const x of [x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3]) bg += `<rect x="${f(x - 2)}" y="${y0}" width="4" height="${y1 - y0}" fill="#2a180a"/><path d="M${f(x - 1.4)} ${y0}V${y1}" stroke="#7a5030" stroke-width=".4" opacity=".7"/>`;
      for (let k = 0; k < 3; k++) { const xa = x0 + k * (x1 - x0) / 3; bg += `<path d="M${f(xa + 2)} ${(y0 + y1) / 2}h${f((x1 - x0) / 3 - 4)}" stroke="#2a180a" stroke-width="1.2"/>`; }
      bg += `<path d="M${x0 + 3} ${y0 + 4}l8 -1.2M${x0 + 28} ${y0 + 4}l6 -1M${x0 + 52} ${y0 + 18}l6 -1" stroke="#dce6ff" stroke-width=".45" opacity=".35"/>`
        + `<path d="M${x0 - 8} ${y1 + 6}H${x1 + 8}l-2 3.4H${x0 - 6}z" fill="#4a2c16"/><path d="M${x0 - 8} ${y1 + 6}H${x1 + 8}" stroke="#b8ccf0" stroke-width=".6" opacity=".75"/>`; }
    // a carved bracket and a hanging lantern, unlit, on the left wall; a pistol on two pegs on the right wall
    bg += `<path d="M6 30q6 -1 9 3l-1 6q-4 -3 -8 -2z" fill="#2a180c" stroke="#0a0503" stroke-width=".4"/>`
      + `<path d="M188 34l10 -2M188 42l10 -2" stroke="#0a0503" stroke-width="1.4"/><path d="M184 36q10 -4 18 -2l1 3q-8 -1 -18 3z" fill="#1e140c" stroke="#0a0503" stroke-width=".4"/>`;
    bg += glow(u, FL[0], FL[1], 90, 70, '#ffb056', .3) + glow(u, 100, 24, 50, 20, '#a8c0f0', .1) + gloom(u, 0, 30, 0, 0, .35) + gloom(u, 200, 30, 200, 0, .4);
    // ——— the table top: oak planks to the VP, the far edge against the stern, the near part darkening ———
    let mid = '';
    { const id = nid('tt', u); mid += `<defs><clipPath id="${id}"><rect x="-10" y="${TB}" width="220" height="${290 - TB}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: TB, bottom: 290, vx: VX, kind: 'oak', plank: 26, seed: 9 })}</g>`
        + `<path d="M-10 ${TB}H210" stroke="#060302" stroke-width="1.6"/><path d="M-10 ${TB + 1.2}H210" stroke="#d09058" stroke-width=".5" opacity=".5"/>`;
      mid += K.localGlow(u, { x: FL[0], y: CANDLE.y + 4, color: '#ffb060', power: .55, radius: 60 }, { squash: .35, core: false }); }
    // ——— the chart: laid across the table in perspective, curling at the corners; coast, rhumb lines, the route ———
    { const C = [[12, 60], [186, 59], [198, 136], [2, 138]], cid = nid('ch', u), g = nid('cg', u);
      mid += `<path d="M14 62L188 61L200 139L4 141Z" fill="#000" opacity=".35"/>`
        + `<defs>${linGrad(g, 0, 60, 0, 138, [[0, '#a89068', 1], [.5, '#c8b084', 1], [1, '#d8c294', 1]])}<clipPath id="${cid}"><path d="M${C.map(P2).join('L')}Z"/></clipPath></defs>`
        + `<path d="M${C.map(P2).join('L')}Z" fill="url(#${g})" stroke="#8a7048" stroke-width=".5"/><g clip-path="url(#${cid})">`;
      // rhumb lines from a rose, a coast with hatching, islands, the route in ink with a cross at its end
      const rose = [124, 74];
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; mid += `<path d="M${P2(rose)}L${f(rose[0] + Math.cos(a) * 160)} ${f(rose[1] + Math.sin(a) * 40)}" stroke="#9a7a50" stroke-width=".25" opacity=".55"/>`; }
      mid += `<circle cx="${rose[0]}" cy="${rose[1]}" r="5" fill="none" stroke="#7a5a30" stroke-width=".4" transform="translate(${rose[0]} ${rose[1]}) scale(1 .4) translate(${-rose[0]} ${-rose[1]})"/>`
        + `<path d="M20 66q14 -4 26 1q12 -3 20 2q-4 6 -16 5q-12 3 -24 -2zM150 108q14 -4 26 0q6 5 -6 7q-14 1 -20 -7zM146 70q6 -2 12 0q-2 3 -12 0z" fill="#d6be8a" stroke="#7a5a30" stroke-width=".5"/>`
        + `<path d="M22 68q12 -3 22 1M154 109q10 -2 18 0" stroke="#9a7a50" stroke-width=".35" fill="none"/>`
        + `<path d="M22 134Q42 122 66 120T112 94T140 74" stroke="#2a1a10" stroke-width="1" fill="none" stroke-dasharray="3 1.6"/>`
        + `<path d="M139 69l8 6M147 69l-8 6" stroke="#8a1a10" stroke-width="1.4" stroke-linecap="round"/>`
        + `</g>`;
      // the near corner curls up
      mid += `<path d="M2 138L18 137.6Q8 133 4 128Z" fill="#f6e6c0" stroke="#8a7048" stroke-width=".4"/><path d="M186 59L176 59.2Q183 62 187 66Z" fill="#c8b080" stroke="#8a7048" stroke-width=".4"/>`; }
    // ——— the hat: a leather tricorn on the left, its brim curled, a braid along the edge ———
    { const hx = 30, hy = 74, g = nid('ht', u);
      mid += K.castShadow(u, L, { x: hx, y: hy + 2, w: 40, h: 10, horizon: HZ, d: .5 })
        + `<defs>${linGrad(g, hx - 20, hy - 14, hx + 20, hy + 4, [[0, '#3a2a1e', 1], [.5, '#22180f', 1], [1, '#0e0906', 1]])}</defs>`
        + `<path d="M${hx - 22} ${hy + 2}Q${hx - 18} ${hy - 9} ${hx - 6} ${hy - 6}Q${hx} ${hy - 12} ${hx + 6} ${hy - 6}Q${hx + 18} ${hy - 9} ${hx + 22} ${hy + 2}Q${hx + 10} ${hy + 7} ${hx} ${hy + 6}Q${hx - 10} ${hy + 7} ${hx - 22} ${hy + 2}Z" fill="url(#${g})" stroke="#060402" stroke-width=".6"/>`
        + `<path d="M${hx - 11} ${hy - 4}Q${hx - 10} ${hy - 16} ${hx} ${hy - 16}Q${hx + 10} ${hy - 16} ${hx + 11} ${hy - 4}Q${hx} ${hy - 1} ${hx - 11} ${hy - 4}Z" fill="#2a1f16" stroke="#060402" stroke-width=".5"/>`
        + `<path d="M${hx + 2} ${hy - 15}Q${hx + 9} ${hy - 14} ${hx + 10} ${hy - 6}" stroke="#7a604a" stroke-width=".7" fill="none" opacity=".7"/>`
        + `<path d="M${hx - 22} ${hy + 2}Q${hx - 18} ${hy - 9} ${hx - 6} ${hy - 6}Q${hx} ${hy - 12} ${hx + 6} ${hy - 6}Q${hx + 18} ${hy - 9} ${hx + 22} ${hy + 2}" stroke="#c9a048" stroke-width=".7" fill="none"/>`
        + `<path d="M${hx + 8} ${hy - 6.4}Q${hx + 17} ${hy - 8} ${hx + 21} ${hy + 1}" stroke="#ffd890" stroke-width=".4" fill="none" opacity=".8"/>`
        + `<path d="M${hx - 9} ${hy - 4.4}Q${hx} ${hy - 2} ${hx + 9} ${hy - 4.4}" stroke="#0a0604" stroke-width="1.2" fill="none" opacity=".7"/>`; }
    // ——— the candle (the key light) and its pool; the mug and the spilt rum; the compass ———
    mid += K.castShadow(u, L, { x: CANDLE.x, y: CANDLE.y, w: 10, h: 30, horizon: HZ, d: 1 }) + K.candle(u, L, CANDLE);
    { const m = { x: 24, y: 129, s: 1.55, fill: 'rum', seed: 4 };
      mid += `<path d="M36 130q10 -3 22 0q8 3 -2 5.4q-12 1.6 -20 -1z" fill="#4a1e06" opacity=".85"/><path d="M40 130.4q8 -1.6 14 0" stroke="#ffc070" stroke-width=".5" fill="none" opacity=".8"/>`
        + K.castShadow(u, L, { x: m.x, y: m.y, w: 9 * m.s, h: 11 * m.s, horizon: HZ, d: 1 }) + K.mug(u, L, m); }
    { const cx = 168, cy = 123, rx = 13, ry = 4.6, g = nid('cp', u), t = nid('cl', u);
      mid += K.contactShadow(u, cx, cy + 3, 30, L) + `<defs>${linGrad(g, cx - rx, 0, cx + rx, 0, [[0, '#6a4a14', 1], [.35, '#e8c060', 1], [.6, '#a07a28', 1], [1, '#3a2808', 1]])}${radGrad(t, cx + 3, cy - 6, 14, [[0, '#fff0b0', 1], [.4, '#d8ac48', 1], [1, '#7a5a18', 1]])}</defs>`
        + `<path d="M${cx - rx} ${cy - 3}V${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}V${cy - 3}Z" fill="url(#${g})" stroke="#3a2808" stroke-width=".45"/>`
        + `<ellipse cx="${cx}" cy="${cy - 3}" rx="${rx}" ry="${ry}" fill="url(#${t})" stroke="#4a3208" stroke-width=".45"/>`
        + `<ellipse cx="${cx}" cy="${cy - 3}" rx="${rx * .7}" ry="${ry * .7}" fill="none" stroke="#8a6420" stroke-width=".5"/><path d="M${cx - 5} ${cy - 3}l5 -1.4l5 1.4l-5 1.4z" fill="none" stroke="#7a5418" stroke-width=".45"/>`
        + `<rect x="${cx + rx - .6}" y="${cy - 3.6}" width="3.4" height="2.4" rx=".6" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".3"/>`
        + `<path d="M${cx - rx + 2} ${cy - 4.4}A${rx - 2} ${ry - 1.4} 0 0 1 ${cx + 4} ${cy - 3 - ry + .6}" stroke="#fff6c8" stroke-width=".55" fill="none" opacity=".8"/>`; }
    // ——— the dagger's shadow on the chart: thrown left by the candle, a thin blade, the cross of the guard, the grip ———
    let low = '';
    { const tip = [58, 99.6], d = [-.968, .25], q = [-d[1] * .35, d[0] * .35], bf = nid('ds', u);
      const at = (t, w) => [tip[0] + d[0] * t + q[0] * w, tip[1] + d[1] * t + q[1] * w];
      low += `<defs><filter id="${bf}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".55"/></filter></defs><g filter="url(#${bf})" style="mix-blend-mode:multiply">`
        + `<path d="M${P2(at(0, -.3))}L${P2(at(19, -2))}L${P2(at(19, 2))}L${P2(at(0, .3))}Z" fill="#2a1404" opacity=".8"/>`
        + `<path d="M${P2(at(19, -6.6))}L${P2(at(21.4, -6.6))}L${P2(at(21.4, 6.6))}L${P2(at(19, 6.6))}Z" fill="#2a1404" opacity=".75"/>`
        + `<path d="M${P2(at(21, -1.7))}L${P2(at(34, -1.7))}L${P2(at(34, 1.7))}L${P2(at(21, 1.7))}Z" fill="#2a1404" opacity=".7"/>`
        + `<ellipse cx="${f(at(36.4, 0)[0])}" cy="${f(at(36.4, 0)[1])}" rx="2.6" ry="1.3" fill="#2a1404" opacity=".65"/></g>`; }
    // ——— the slow match, cut in two: the far piece came burning towards the bag and smoulders out at the cut, a gap,
    // then the clean cut end of the piece that runs on under the bag ———
    { const B = [[16, 80], [27, 88], [37, 94.4], [47, 99.4], CUT[0]], A = [CUT[1], [67, 108.4], [71, 111.6], [77, 116.4], [84, 120]], r = 1.55;
      low += K.contactShadow(u, 36, 93, 44, L, { opacity: .45 }) + K.rope(u, L, B, { r, seed: 7 }) + K.rope(u, L, A, { r, seed: 8 });
      // the burnt last inch: charred black, grey ash flaking, the ember dying at the very end
      const e = CUT[0], b0 = [48.8, 99.8], ash = nid('as', u), em = nid('em', u);
      low += `<defs>${linGrad(ash, b0[0], 0, e[0], 0, [[0, '#2a2018', 0], [.25, '#1e1814', 1], [1, '#3a3430', 1]])}${radGrad(em, e[0] + .2, e[1] - .3, 2.4, [[0, '#fff0b8', 1], [.35, '#ff9a3a', 1], [.75, '#b8380e', .9], [1, '#5a1a08', 0]])}</defs>`
        + `<path d="M${P2(b0)}L${P2(e)}" stroke="url(#${ash})" stroke-width="${f(r * 2.1)}" stroke-linecap="round"/>`
        + [[50.4, 99.8], [52.2, 101.4], [53.6, 100.7]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r=".42" fill="#8a8680" opacity=".8"/>`).join('')
        + glow(u, e[0], e[1], 7, 3.4, '#ff8a30', .4) + `<circle cx="${f(e[0] + .2)}" cy="${f(e[1])}" r="1.9" fill="url(#${em})"/>`;
      // the clean cut of the near piece: the pale fibres of the core, a few strands sprung loose towards the gap
      const c = CUT[1];
      for (let k = 0; k < 6; k++) { const a = Math.PI + .3 - k * .14; low += `<path d="M${P2(c)}l${f(Math.cos(a) * (1.4 + R() * 1.2))} ${f(Math.sin(a) * (1.4 + R() * .9))}" stroke="${R() > .5 ? '#d8bc88' : '#9a7a50'}" stroke-width=".4" stroke-linecap="round"/>`; }
      low += `<ellipse cx="${f(c[0] - .1)}" cy="${f(c[1])}" rx="1" ry="1.5" transform="rotate(-24 ${f(c[0])} ${f(c[1])})" fill="#e4cc98" stroke="#6a4a24" stroke-width=".35"/>`; }
    // ——— the grapeshot bag: a squat sack of canvas, the balls pressing their round lumps through it, the neck gathered
    // and bound with twine, one turn of twine round the belly pinching it; a tag on a string lies on the chart ———
    let shot = '';
    { const { x, y } = BAG, g = nid('cv', u), cl = nid('bc', u), lf = nid('lf', u);
      shot += `<g transform="translate(${x} ${y}) scale(${BAG.k}) translate(${-x} ${-y})">`;
      shot += K.castShadow(u, L, { x, y, w: 56, h: 64, horizon: HZ, d: 1 }) + K.contactShadow(u, x, y + .6, 54, L);
      // the outline: levels (dy, half-width) from the foot to the neck, bulging between the balls, pinched by the twine
      const lv = [[-1, 23], [-11, 28.4], [-21, 29.4], [-30, 26.4], [-39, 28], [-48, 24.4], [-56, 15.6], [-61, 7.2]];
      const bulge = i => i === 3 || i === 4 ? .4 : i === 7 ? -1.6 : 2.2;
      let left = '', right = '';
      for (let i = 1; i < lv.length; i++) { const [y0, w0] = lv[i - 1], [y1, w1] = lv[i];
        left += `Q${f(x - (w0 + w1) / 2 - bulge(i))} ${f(y + (y0 + y1) / 2)} ${f(x - w1)} ${f(y + y1)}`; }
      for (let i = lv.length - 1; i > 0; i--) { const [y0, w0] = lv[i], [y1, w1] = lv[i - 1];
        right += `Q${f(x + (w0 + w1) / 2 + bulge(i) + .6)} ${f(y + (y0 + y1) / 2)} ${f(x + w1 + .6)} ${f(y + y1)}`; }
      const body = `M${f(x - 23)} ${f(y - 1)}${left}L${f(x + 7.8)} ${f(y - 61)}${right}Q${x} ${f(y + 4.4)} ${f(x - 23)} ${f(y - 1)}Z`;
      shot += `<defs>${linGrad(g, x - 30, 0, x + 30, 0, [[0, '#2e2416', 1], [.3, '#5e4c32', 1], [.68, '#a08660', 1], [1, '#d6be8e', 1]])}<clipPath id="${cl}"><path d="${body}"/></clipPath></defs>`
        + `<path d="${body}" fill="url(#${g})"/><g clip-path="url(#${cl})">`;
      // the lumps of the balls: a lit cap towards the candle (upper right), a shadowed crescent below-left
      const rows = [[-9, [-19, -7, 5, 17]], [-21, [-23, -12, -1, 10, 21]], [-40, [-19, -8, 3, 14, 23]], [-50, [-13, -2, 9]]];
      // (soft, uneven: the balls shift inside, so no two lumps sit alike)
      let sh2 = '', hi2 = '';
      for (const [dy, xs] of rows) for (const dx0 of xs) {
        const dx = dx0 + (R() - .5) * 3, rr = 5.8 * (.84 + R() * .32), bx = x + dx, by = y + dy + (R() - .5) * 2.4, k = Math.max(.15, Math.min(1, (dx + 30) / 56)), hg = nid('hb', u);
        sh2 += `<path d="M${f(bx - rr * .9)} ${f(by + rr * .2)}Q${f(bx - rr * .7)} ${f(by + rr * .95)} ${f(bx + rr * .1)} ${f(by + rr)}Q${f(bx + rr * .8)} ${f(by + rr * .9)} ${f(bx + rr * .95)} ${f(by + rr * .4)}" stroke="#241a0e" stroke-width="${f(1.4 + R() * .8)}" fill="none" opacity="${f(.55 - k * .2)}" stroke-linecap="round"/>`;
        hi2 += `<defs>${radGrad(hg, bx + 1.6, by - 1.8, rr, [[0, '#f4e2b4', .75 * k], [.55, '#c8ae7e', .35 * k], [1, '#c8ae7e', 0]])}</defs><circle cx="${f(bx)}" cy="${f(by)}" r="${f(rr)}" fill="url(#${hg})"/>`;
      }
      shot += `<defs><filter id="${lf}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".8"/></filter></defs><g filter="url(#${lf})">${sh2}</g>` + hi2;
      // creases from the gathered neck down over the shoulders
      for (const [dx, ex] of [[-5, -18], [-2.6, -9], [0, 1], [2.6, 10], [5, 19]]) shot += `<path d="M${f(x + dx)} ${f(y - 59)}Q${f(x + (dx + ex) / 2 - 1)} ${f(y - 54)} ${f(x + ex)} ${f(y - 46)}" stroke="#3a2c18" stroke-width=".5" fill="none" opacity=".55"/>`;
      // the canvas puckered under the turn of twine round the belly
      shot += `<path d="M${f(x - 27)} ${f(y - 31.4)}Q${x} ${f(y - 24.6)} ${f(x + 27.4)} ${f(y - 31.4)}" stroke="#2a1e10" stroke-width="2.6" fill="none" opacity=".45"/>`
        + `</g>`
        + `<path d="${body}" fill="none" stroke="#2a2010" stroke-width=".6"/>`
        + `<path d="M${f(x + 26.6)} ${f(y - 44)}Q${f(x + 30)} ${f(y - 36)} ${f(x + 27.4)} ${f(y - 31)}M${f(x + 28.4)} ${f(y - 26)}Q${f(x + 30.4)} ${f(y - 16)} ${f(x + 28)} ${f(y - 8)}" stroke="#ffd8a0" stroke-width=".6" fill="none" opacity=".55"/>`
        + K.rope(u, L, [[x - 26.8, y - 31.2], [x - 14, y - 27.6], [x, y - 26.6], [x + 14, y - 27.6], [x + 27.2, y - 31.2]], { r: .62, seed: 12 });
      // the neck: the canvas gathered above the tie in a ruffle, three turns of twine, the knot and its ends
      const ny = y - 61;
      shot += `<path d="M${f(x - 7)} ${f(ny + .6)}C${f(x - 9.6)} ${f(ny - 3)} ${f(x - 13.4)} ${f(ny - 6)} ${f(x - 11.6)} ${f(ny - 8.6)}Q${f(x - 8.6)} ${f(ny - 10.8)} ${f(x - 5.6)} ${f(ny - 8)}Q${f(x - 2.4)} ${f(ny - 11.6)} ${f(x + .8)} ${f(ny - 8.4)}Q${f(x + 4.2)} ${f(ny - 11.2)} ${f(x + 7.2)} ${f(ny - 7.8)}Q${f(x + 11.6)} ${f(ny - 9.4)} ${f(x + 12.6)} ${f(ny - 6.2)}C${f(x + 12.6)} ${f(ny - 4)} ${f(x + 9.6)} ${f(ny - 1.6)} ${f(x + 7.6)} ${f(ny + .6)}Z" fill="url(#${g})" stroke="#2a2010" stroke-width=".55"/>`
        + [[-9.6, -8.4], [-4.2, -7.6], [-.6, -8], [3.4, -7.6], [8.4, -6.8]].map(([dx, dy]) => `<path d="M${f(x + dx * .55)} ${f(ny)}Q${f(x + dx * .8)} ${f(ny + dy * .5)} ${f(x + dx)} ${f(ny + dy)}" stroke="#3a2c18" stroke-width=".45" fill="none" opacity=".7"/>`).join('')
        + `<path d="M${f(x + 1)} ${f(ny - 8.6)}Q${f(x + 4.4)} ${f(ny - 10.6)} ${f(x + 7)} ${f(ny - 8)}" stroke="#f0dcb0" stroke-width=".5" fill="none" opacity=".7"/>`
        + [0, 1.8, 3.6].map(t => K.rope(u, L, [[x - 7.4, ny - .6 + t], [x, ny + 1 + t], [x + 7.8, ny - .6 + t]], { r: .62, seed: 14 + t })).join('')
        + K.shadeSphere(u, x + 8.6, ny + 1.8, 1.5, L, 'leather', { outline: .3 })
        + K.rope(u, L, [[x + 9.4, ny + 2.6], [x + 11.4, ny + 6.4], [x + 10.8, ny + 10]], { r: .5, seed: 15 })
        + K.rope(u, L, [[x + 9.8, ny + 1.6], [x + 18, ny + 6], [x + 26.4, ny + 22], [x + 30.6, ny + 44], [x + 27.4, y - 4.4]], { r: .4, seed: 11 });
      // the tag on the chart: a pale card with an eyelet and a mark struck through in red
      shot += `<g transform="translate(${x + 32} ${y - 3.4}) rotate(14)"><path d="M-7 -4.4h11l3.4 4.4l-3.4 4.4h-11z" fill="#000" opacity=".3" transform="translate(1.2 1)"/><path d="M-7 -4.4h11l3.4 4.4l-3.4 4.4h-11z" fill="#efe4c8" stroke="#6a5a40" stroke-width=".45"/>`
        + `<circle cx="-5" r="1" fill="#3a2a18"/><circle cx="-5" r=".5" fill="#efe4c8"/><path d="M-2 -2.4l3 1.6l3 -1.6M-2 2.4l3 -1.6l3 1.6" stroke="#2a3a5a" stroke-width=".6" fill="none"/>`
        + `<path d="M-3 -3.4L5 3.4M5 -3.4L-3 3.4" stroke="#a01a10" stroke-width="1.1" stroke-linecap="round"/><path d="M-6.4 -3.8h10.4" stroke="#ffffff" stroke-width=".4" opacity=".7"/></g></g>`;
    }
    // ——— the dagger standing in the chart right at the cut, leaning a little away from the candle ———
    let dag = '';
    { const DS = 1.15, tip = [58, 99.6], ax = [-.075, -.997], nv = [-ax[1], ax[0]];
      const at = (t, w) => [tip[0] + (ax[0] * t + nv[0] * w) * DS, tip[1] + (ax[1] * t + nv[1] * w) * DS], g = nid('bl', u);
      dag += `<defs>${linGrad(g, ...at(8, -1.6), ...at(8, 1.6), [[0, '#3a4248', 1], [.45, '#9aa4ac', 1], [.55, '#e8eef2', 1], [1, '#6a747c', 1]])}</defs>`
        + `<path d="M${P2(at(0, -.4))}L${P2(at(15, -1.6))}L${P2(at(15, 1.6))}L${P2(at(0, .4))}Z" fill="url(#${g})" stroke="#1a1e22" stroke-width=".35"/>`
        + `<path d="M${P2(at(1, .2))}L${P2(at(15, .2))}" stroke="#ffffff" stroke-width=".35" opacity=".75"/>`
        + `<ellipse cx="${tip[0]}" cy="${tip[1] + .2}" rx="1.8" ry=".55" fill="#1a0e06" opacity=".75"/>`
        + `<path d="M${P2(at(15, -4.6))}Q${P2(at(16.6, 0))} ${P2(at(15, 4.6))}L${P2(at(16.6, 4.4))}Q${P2(at(18, 0))} ${P2(at(16.6, -4.4))}Z" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".35"/>`
        + K.shadeCyl(u, ...at(17, 0), ...at(28, 0), 1.3 * DS, L, 'leather', { outline: .35 })
        + [19.5, 22, 24.5].map(t => `<path d="M${P2(at(t, -1.3))}L${P2(at(t + .8, 1.3))}" stroke="#c9a048" stroke-width=".35"/>`).join('')
        + K.shadeSphere(u, ...at(29.6, 0), 1.9 * DS, L, 'brass', { outline: .35 }); }
    // the last thread of smoke from the dying ember, rising and curling away
    { const e = CUT[0], bf = nid('sm', u);
      dag += `<defs><filter id="${bf}" x="-100%" y="-20%" width="300%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`
        + `<path d="M${f(e[0])} ${f(e[1] - 1.4)}C${f(e[0] - 3)} ${f(e[1] - 7)} ${f(e[0] + 3)} ${f(e[1] - 11)} ${f(e[0] - .6)} ${f(e[1] - 16)}S${f(e[0] - 6)} ${f(e[1] - 24)} ${f(e[0] - 3)} ${f(e[1] - 31)}" stroke="#d4d2d8" stroke-width="2.4" fill="none" opacity=".45" filter="url(#${bf})"/>`
        + `<path d="M${f(e[0])} ${f(e[1] - 1.4)}C${f(e[0] - 3)} ${f(e[1] - 7)} ${f(e[0] + 3)} ${f(e[1] - 11)} ${f(e[0] - .6)} ${f(e[1] - 16)}" stroke="#eeeef2" stroke-width=".55" fill="none" opacity=".75"/>`; }
    // ——— light: the candle's glow, motes in the air, the moon's cold rim from behind, the dark corners ———
    const fg = K.localGlow(u, { x: FL[0], y: FL[1], color: '#ffc070', power: .85, radius: 30 })
      + glow(u, 100, 60, 70, 18, '#a8c0f0', .08) + motes(16, 120, 50, 60, 50, '#ffe0b0', 5)
      + gloom(u, 100, 60, 0, 140, .32) + gloom(u, 100, 120, 100, 280, .35);
    return [bg, mid + low + shot + dag + fg];
  } };
