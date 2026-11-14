// «Шпион Мерсер» (Индевор, ПРИКАЗ: посмотрите руку игрока-противника; он сбрасывает 1 Реакцию по вашему выбору; если
// Реакций нет — возьмите 1 карту), refined from the first-round scene (portrait-endeavour.cjs SCENES['Шпион Мерсер']):
// night on the harbour rampart. Mercer — a lean man in a broad slouch hat and a dark caped cloak blown back by the
// wind — stands at the parapet in profile and watches the black ship at anchor through a spyglass; her stern windows
// are lit. On the parapet his open notebook (a sketch of her stern and columns of strokes) and a shuttered lantern
// with its door ajar. The lantern throws his shadow — hat, head, the spyglass — big on the tower wall behind him
// (brief's find: тень шпиона на стене).
// Fixed against the first round: the figure was a flat silhouette with a stick for an arm — now a man: a face in
// profile under the hat brim, the eyepiece at his eye, his near hand round the barrel (people.cjs hand3, the forearm
// in a coat sleeve with a linen cuff coming out of the cloak); the walls were flat strips — now a stone tower behind
// him and a parapet in front, block by block; the lantern stood on nothing — now on the parapet, and it is the
// second light of the scene. Light: the moon ahead of him over the sea (key, cold: the rim on his face, hat and
// cloak, the path on the water); the lantern on the parapet (warm, from below: his hand, the notebook, the wall).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, motes } = PK;

const HZ = 96;                                   // the sea horizon = eye level
const MOON = { x: 142, y: 30 };
const WX = 84;                                   // the tower's corner (its wall fills the frame left of it)
const PT = 112, PF = 117;                        // the parapet: the back edge of its top, the front edge
const LAN = { x: 150, y: 115.4, s: .78 };        // the lantern on the parapet
const HEAD = { c: [77, 58], r: 8.6, tilt: 9 };   // Mercer's head (profile, facing right)
const SCOPE_A = 13;                              // the spyglass: degrees below the horizontal
const SHIP = { kind: 'pearl', x: 160, y: 99.5, scale: .44, flip: true };   // her stern (the lit windows) towards him
const LP = K.lantern.local({ ...LAN, horizon: HZ });
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#dfe8ff', power: .85 },
  fill: { color: '#2a3a5c', power: .4 }, rim: { az: 10, color: '#c8dcff', power: .55 }, locals: [LP] };
const SKIN = { lit: '#f0c8a2', half: '#bf8a66', core: '#9c6a4c', shadow: '#5a3426', outline: '#24120a' };
const skel = { horizon: HZ, eye: 1.6, light: 'moon ahead over the sea (key, rim) + shuttered lantern on the parapet (warm, from below)', items: [
  ['tower wall', 0, PT, WX, PT, 'rampart (behind Mercer)'], ['parapet', 0, 280, 200, 280 - PT, 'rampart'], ['Mercer', 44, PT, 58, 70, 'stands behind the parapet'],
  ['spyglass', 80, 74, 50, 14, 'at his eye, his hand round it'], ['ship', 120, 99.5, 72, 50, 'water, at anchor'], ['notebook', 102, 118, 24, 8, 'parapet top'],
  ['lantern', 144, 115.4, 12, 22, 'parapet top'], ['shadow', 0, 70, 84, 60, 'tower wall (from the lantern)']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const add = (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k];
// the point of the head's own frame (as people.cjs head(): a forward, b down, in head radii), turned by the tilt
const tl = HEAD.tilt * Math.PI / 180;
const HQ = (a, b) => { const x = a * HEAD.r, y = b * HEAD.r; return [HEAD.c[0] + x * Math.cos(tl) - y * Math.sin(tl), HEAD.c[1] + x * Math.sin(tl) + y * Math.cos(tl)]; };
const SD = [Math.cos(SCOPE_A * Math.PI / 180), Math.sin(SCOPE_A * Math.PI / 180)], SN = [-SD[1], SD[0]];
const EYE = HQ(.8, -.12);                        // the eyepiece's end, at his eye
const SP = (t, n = 0) => [EYE[0] + SD[0] * t + SN[0] * n, EYE[1] + SD[1] * t + SN[1] * n];
const SEC = [[0, 3.6, 1.05, 1.15, 'brass'], [3.6, 12.6, 1.4, 1.4, 'brass'], [12.6, 21.4, 1.75, 1.75, 'brass'], [21.4, 39, 2.3, 2.3, 'leather'], [39, 42.4, 2.55, 2.65, 'brass']];
const GRIP_T = 30;

// the cloak's outline: collar, the cape over the shoulders, the long cloak blown back to the left, its front edge
const CLOAK = [[70.4, 62.6], [66.6, 69], [60, 76], [52.6, 87], [46, 99], [40.4, 110], [36, 121], [62, 124], [92, 124], [99.6, 116], [98.4, 104], [96.6, 92], [93.6, 82], [88.4, 74], [82.6, 69.6], [81.4, 64]];
const CAPE = [[71, 63.4], [64, 71], [58.6, 79.4], [55.4, 88.6], [60.6, 92.4], [66, 90], [72, 94.4], [79, 92], [86, 96.6], [93, 93.4], [98.6, 95.6], [97.4, 86], [93.4, 77.6], [87.4, 71], [81.6, 66.6]];

module.exports = { name: 'Шпион Мерсер', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 }), R = rng(17);
    const ln = (d, w = .5, c = '#0a0c12', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    // ——— the sky, the moon, a few thin clouds; the sea with the moon's path; a low far shore with lights ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 4 }) + K.sunMoon(u, L, { r: 8.6 })
      + K.cloud(u, L, { x: 178, y: 44, w: 40, h: 5, seed: 6, far: .5 }) + K.cloud(u, L, { x: 110, y: 18, w: 34, h: 4, seed: 11, far: .6 });
    bg += `<path d="M150 ${HZ + .3}Q170 ${HZ - 3.4} 186 ${HZ - 3}T210 ${HZ - 4.4}V${HZ + .4}Z" fill="#141c2c"/>`
      + [[176, HZ - 1.4], [183, HZ - 2], [191, HZ - 2.4], [197, HZ - 2.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".45" fill="#ffd27a"/>`).join('');
    bg += K.water(u, L, { horizon: HZ, bottom: 200, swell: .45, seed: 5, glitter: MOON.x });
    // the black ship at anchor, sails furled, her stern windows lit
    bg += K.ship(u, L, { ...SHIP, sails: 'furled', detail: 'mid', lights: true, reflect: true, seed: 3 });

    // ——— the tower: ashlar courses, the corner lit by the moon, merlons against the sky at the top ———
    let tw = '';
    { const g = nid('tw', u), cid = nid('tc', u);
      tw += `<defs>${linGrad(g, 0, 0, WX, 0, [[0, '#1a1e26'], [.7, '#2a2e36'], [1, '#3a3e48']])}<clipPath id="${cid}"><path d="M-2 14H${WX}V${PT + 2}H-2Z"/></clipPath></defs>`
        // the merlons over the wall-walk of the tower, the sky between them
        + [-2, 26, 56].map(x => `<path d="M${x} 14V2H${x + 20}V14Z" fill="#2a2e38"/><path d="M${x} 2.3H${x + 20}" stroke="#a8bcd8" stroke-width=".5" opacity=".5"/>`).join('')
        + `<g clip-path="url(#${cid})"><path d="M-2 14H${WX}V${PT + 2}H-2Z" fill="url(#${g})"/>`;
      // the warm pool of the lantern on the wall, then the stones over it
      tw += K.localGlow(u, { x: 66, y: 80, color: '#ffb060', power: .95, radius: 78 }, { core: false }) + K.localGlow(u, { x: 60, y: 60, color: '#ff9a40', power: .5, radius: 44 }, { core: false });
      let y = 16, row = 0;
      while (y < PT + 2) { const h = 7 + R() * 2.4; let x = -2 - (row % 2) * 7 - R() * 4;
        while (x < WX) { const w = 12 + R() * 9, sh = (R() - .5) * .16;
          tw += `<path d="M${f(x + .5)} ${f(y + .5)}H${f(x + w - .5)}V${f(y + h - .5)}H${f(x + .5)}Z" fill="${mix('#3a3e48', '#141820', R() * .5)}" opacity="${f(.12 + R() * .16)}"/>`
            + ln(`M${f(x + .6)} ${f(y + .7)}H${f(x + w - .8)}`, .35, '#8a8a90', .25 + sh)
            + ln(`M${f(x + w)} ${f(y)}V${f(y + h)}`, .45, '#0c0e12', .8);
          if (R() > .7) tw += ln(`M${f(x + 2 + R() * (w - 4))} ${f(y + 1)}l${f((R() - .5) * 3)} ${f(2 + R() * 3)}`, .25, '#0c0e12', .6);
          x += w; }
        tw += ln(`M-2 ${f(y)}H${WX}`, .55, '#0a0c10', .85); y += h; row++; }
      // his shadow, thrown by the lantern on the wall: the same shapes, scaled from the lantern's flame
      const k = 1.3, T = `translate(${f(LP.x)} ${f(LP.y)}) scale(${k}) translate(${f(-LP.x)} ${f(-LP.y)})`, bl = nid('sb', u);
      tw += `<defs><filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".55"/></filter></defs>`
        + `<g style="mix-blend-mode:multiply" opacity=".9"><g transform="${T}" filter="url(#${bl})">${silhouette('#14100e')}</g>`
        // the spyglass's shadow is mostly behind his hat: a short stub of it out of the shadow's face, right of the
        // shadow head (above his crown), its far end with the objective's flare going behind the hat
        + `<g filter="url(#${bl})" fill="#14100e"><path d="M62 32.4L77.4 35.9L77.9 40.5L62 36.2Z"/><path d="M75.2 34.9L78.6 35.6L79.2 41.2L75.8 40.4Z"/></g></g>`;
      tw += `<path d="M-2 14H${WX}" stroke="#0a0c10" stroke-width="1.2"/><path d="M-2 15.2H${WX}" stroke="#4a4e58" stroke-width=".5" opacity=".6"/></g>`;
      // the corner: the moon's cold light along it, the side of the tower turned to the sea a narrow lit strip
      tw += `<path d="M${WX} 2V${PT + 2}H${WX + 3}V4Z" fill="#4a5466"/><path d="M${WX + 3} 4V${PT + 2}" stroke="#b8cce8" stroke-width=".7" opacity=".75"/>`
        + `<path d="M${WX - 20} 2H${WX}V14" fill="none" stroke="#0a0c10" stroke-width=".4"/>`; }

    // ——— Mercer ———
    let man = '';
    const coat = { lit: '#4a4a58', half: '#1e1e26', core: '#16161c', shadow: '#08080c', outline: '#030305' };
    // the cloak: one dark mass, the moon along its front edge, the lantern warm low on the front, folds to the left
    { const g = nid('ck', u), cid = nid('cc', u);
      man += `<defs>${linGrad(g, 40, 70, 100, 100, [[0, '#0a0a10'], [.6, '#16161e'], [1, '#262632']])}<clipPath id="${cid}"><path d="${H.sp(CLOAK, true)}"/></clipPath></defs>`
        + `<path d="${H.sp(CLOAK, true)}" fill="url(#${g})" stroke="${coat.outline}" stroke-width=".45"/>`
        + `<g clip-path="url(#${cid})">`
        + [[60, 84, 44, 124], [68, 86, 56, 124], [76, 94, 70, 124], [84, 98, 84, 124]].map(([x0, y0, x1, y1], i) => `<path d="M${x0} ${y0}Q${f(lerp(x0, x1, .5) - 3)} ${f(lerp(y0, y1, .5))} ${x1} ${y1}" stroke="#000" stroke-width="${2.2 - i * .3}" opacity=".45" fill="none"/>`
          + `<path d="M${x0 + 1.6} ${y0}Q${f(lerp(x0, x1, .5) - 1.2)} ${f(lerp(y0, y1, .5))} ${x1 + 1.8} ${y1}" stroke="#3a3a4a" stroke-width=".7" opacity=".5" fill="none"/>`).join('')
        + K.localGlow(u, { x: 104, y: 112, color: '#ffa850', power: .4, radius: 22 }, { core: false })
        + `</g>` + `<path d="${H.sp(CLOAK.slice(9, 15))}" stroke="#a8bce0" stroke-width=".7" fill="none" opacity=".65"/>`
        + `<path d="${H.sp(CLOAK.slice(1, 6))}" stroke="#5a6680" stroke-width=".5" fill="none" opacity=".5"/>`; }
    // the cape over the shoulders, its scalloped hem; the high collar turned up round his neck
    { const g = nid('cp', u);
      man += `<defs>${linGrad(g, 56, 70, 98, 90, [[0, '#0e0e14'], [.65, '#1c1c26'], [1, '#2e2e3c']])}</defs><path d="${H.sp(CAPE, true)}" fill="url(#${g})" stroke="${coat.outline}" stroke-width=".45"/>`
        + `<path d="${H.sp(CAPE.slice(4, 11))}" stroke="#000" stroke-width="1.1" fill="none" opacity=".4" transform="translate(0 1.2)"/>`
        + `<path d="${H.sp(CAPE.slice(10, 15))}" stroke="#b8cce8" stroke-width=".7" fill="none" opacity=".7"/>`
        + ln('M72 70Q70 80 66 90M80 72Q80 82 79 92M88 76Q91 85 92 93', .6, '#000', .5); }
    // the head (profile, his own: a long narrow face, a hooked nose, the lips pressed, dark hair tied back), the eye
    // half shut behind the eyepiece; the lantern warm under the cheek, the moon's rim along the brow and the nose
    { const hd = H.head(u, { c: HEAD.c, r: HEAD.r, dir: 1, tilt: HEAD.tilt, tone: SKIN, detail: true, eye: 'half', brow: 'frown', look: 4,
        warm: { color: '#ffb46a', op: .45 }, rim: '#c8dcff', hairColor: '#1e140e', hair: { style: 'tied', color: '#1e140e', ribbon: '#0e0e14' }, stubble: true, ear: true });
      man += hd.svg !== undefined ? hd.svg : hd; }
    // the collar turned up behind the jaw
    man += `<path d="M69 70.6Q66.6 63 69.6 56.6L74.4 60Q73 65 75.6 70.4Z" fill="#20202a" stroke="${coat.outline}" stroke-width=".4"/><path d="M69.6 57L74.2 60.2" stroke="#6a7690" stroke-width=".4" opacity=".7"/>`
      + `<path d="M75.4 70.4Q80 72.6 84.6 69.4L84 66.6Q80 68.8 76 67.6Z" fill="#2a2a36" stroke="${coat.outline}" stroke-width=".35"/>`;
    // the hat: a broad slouch brim (its underside towards us, the front turned down), a low crown with a band
    { const bc = HQ(.02, -.86), ang = HEAD.tilt * .55, g = nid('hb', u), g2 = nid('hc', u);
      const rx = 2.15 * HEAD.r, ry = .3 * HEAD.r;
      man += `<defs>${linGrad(g, bc[0] - rx, 0, bc[0] + rx, 0, [[0, '#0a0a0e'], [.6, '#1a1a22'], [1, '#30303c']])}${linGrad(g2, bc[0] - 9, 0, bc[0] + 9, 0, [[0, '#0c0c12'], [.7, '#22222c'], [1, '#3a3a48']])}</defs>`
        + `<g transform="rotate(${f(ang)} ${P2(bc)})">`
        // the crown: a low round dome, the dent along the top
        + `<path d="M${f(bc[0] - .86 * HEAD.r)} ${f(bc[1] - .4)}Q${f(bc[0] - .9 * HEAD.r)} ${f(bc[1] - 1.05 * HEAD.r)} ${f(bc[0] + .05 * HEAD.r)} ${f(bc[1] - 1.08 * HEAD.r)}Q${f(bc[0] + .92 * HEAD.r)} ${f(bc[1] - 1.02 * HEAD.r)} ${f(bc[0] + .86 * HEAD.r)} ${f(bc[1] - .4)}Z" fill="url(#${g2})" stroke="#030305" stroke-width=".45"/>`
        + ln(`M${f(bc[0] - .5 * HEAD.r)} ${f(bc[1] - .98 * HEAD.r)}Q${f(bc[0])} ${f(bc[1] - .82 * HEAD.r)} ${f(bc[0] + .5 * HEAD.r)} ${f(bc[1] - .96 * HEAD.r)}`, .5, '#000', .6)
        + `<path d="M${f(bc[0] - .87 * HEAD.r)} ${f(bc[1] - 2.6)}H${f(bc[0] + .87 * HEAD.r)}V${f(bc[1] - .5)}H${f(bc[0] - .87 * HEAD.r)}Z" fill="#3a2a1e"/>`
        + ln(`M${f(bc[0] + .8 * HEAD.r)} ${f(bc[1] - .98 * HEAD.r)}Q${f(bc[0] + .96 * HEAD.r)} ${f(bc[1] - .6 * HEAD.r)} ${f(bc[0] + .86 * HEAD.r)} ${f(bc[1] - .4)}`, .6, '#a8bce0', .7)
        // the brim: the far half above, the near half (underside) below the crown's foot; the front dips
        + `<path d="M${f(bc[0] - rx)} ${f(bc[1] + .6)}Q${f(bc[0] - rx * .5)} ${f(bc[1] - ry * 1.3)} ${f(bc[0])} ${f(bc[1] - ry)}Q${f(bc[0] + rx * .6)} ${f(bc[1] - ry * .9)} ${f(bc[0] + rx)} ${f(bc[1] + 2.4)}`
        + `Q${f(bc[0] + rx * .6)} ${f(bc[1] + ry * 1.6)} ${f(bc[0])} ${f(bc[1] + ry * 1.3)}Q${f(bc[0] - rx * .6)} ${f(bc[1] + ry * 1.2)} ${f(bc[0] - rx)} ${f(bc[1] + .6)}Z" fill="url(#${g})" stroke="#030305" stroke-width=".45"/>`
        + ln(`M${f(bc[0] - rx * .9)} ${f(bc[1] + .4)}Q${f(bc[0])} ${f(bc[1] - ry * .2)} ${f(bc[0] + rx * .92)} ${f(bc[1] + 1.8)}`, .4, '#000', .7)
        + ln(`M${f(bc[0] + rx * .2)} ${f(bc[1] + ry * 1.3)}Q${f(bc[0] + rx * .7)} ${f(bc[1] + ry * 1.3)} ${f(bc[0] + rx)} ${f(bc[1] + 2.4)}`, .7, '#b8cce8', .75)
        + ln(`M${f(bc[0] - rx * .4)} ${f(bc[1] + ry * 1.2)}Q${f(bc[0])} ${f(bc[1] + ry * 1.45)} ${f(bc[0] + rx * .4)} ${f(bc[1] + ry * 1.4)}`, .5, '#ffb468', .4)
        + `</g>`;
      // the brim's shade over the brow and the eye
      const sh = nid('hs', u), c2 = HQ(.5, -.3);
      man += `<defs>${radGrad(sh, c2[0], c2[1], HEAD.r * .9, [[0, '#000', .45], [1, '#000', 0]])}</defs><ellipse cx="${f(c2[0])}" cy="${f(c2[1])}" rx="${f(HEAD.r * .9)}" ry="${f(HEAD.r * .4)}" fill="url(#${sh})"/>`; }

    // ——— the spyglass and the hand round it; the forearm out of the cloak ———
    const tn = SKIN, Lh = [.62, -.5];
    let hd, a = SCOPE_A - 100;
    const G = SP(GRIP_T);
    const ho = { s: 1.72, m: 1, roll: 26, pitch: 38, pose: 'wrap', r: 2.32 / 1.72, tone: tn, light: Lh, sw: .3, tilt: 6, palmW: .8, wristW: .7 };
    for (let k = 0; k < 5; k++) { hd = H.hand3(u, { ...ho, a, grip: G }); const ang = Math.atan2(hd.axis[1], hd.axis[0]) * 180 / Math.PI;
      let d = SCOPE_A - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
    const W = hd.wrist, ua = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
    const EL = [W[0] - 7.4, W[1] + 19.6];
    let arm = H.cloth(u, { spine: [[92.4, 96], EL, [lerp(EL[0], W[0], .55), lerp(EL[1], W[1], .55)], [W[0] - ua[0] * 1.2, W[1] - ua[1] * 1.2]], w: [9.4, 9, 7.6, 6.4],
      tone: coat, lit: 1, rim: '#b8cce8', rimSide: 1, rimOp: .55, cuff: { from: .74, k: 1.22, tone: { lit: '#3a3a48', half: '#1c1c24', shadow: '#060608', outline: '#020203' } }, seed: 4, drapes: 2, sw: .4 });
    // the linen cuff of the shirt at the wrist, lit by the lantern
    { const c0 = add(W, ua, -1.4), nx = [-ua[1], ua[0]];
      arm += `<path d="M${P2(add(c0, nx, 3.2))}Q${P2(add(add(c0, ua, 1.6), nx, 0))} ${P2(add(c0, nx, -3.2))}L${P2(add(add(c0, ua, -1.6), nx, -3))}Q${P2(add(c0, ua, -.4))} ${P2(add(add(c0, ua, -1.6), nx, 3))}Z" fill="#d8d0c0" stroke="#4a443a" stroke-width=".3"/>`
        + ln(`M${P2(add(c0, nx, -2.6))}Q${P2(add(c0, ua, .8))} ${P2(add(c0, nx, 2.6))}`, .5, '#fff4e0', .7); }
    // the spyglass: the eyepiece at his eye, three draws, the leather-bound barrel, the objective with its glass
    let sc = '';
    for (const [t0, t1, r0, r1, kind] of SEC) { const A = SP(t0), B = SP(t1);
      sc += K.shadeCyl(u, A[0], A[1], B[0], B[1], Math.max(r0, r1), L, kind, { r1: r0, r2: r1, ell: .16, face: 2, outline: .35 }); }
    for (const t of [12.6, 21.4, 23, 37.4]) { const A = SP(t - .5), B = SP(t + .5), r = t < 13 ? 1.62 : t < 22 ? 1.95 : 2.42;
      sc += K.shadeCyl(u, A[0], A[1], B[0], B[1], r, L, 'brass', { ell: .16, face: 2, outline: .3 }); }
    { const o = SP(42.4), q = SP(42.6); sc += `<ellipse cx="${f(q[0])}" cy="${f(q[1])}" rx=".5" ry="2.2" transform="rotate(${SCOPE_A} ${P2(q)})" fill="#2a3a5a" stroke="#0a0a0c" stroke-width=".25"/>`
      + `<path d="M${P2(add(o, SN, -1.6))}l.5 1" stroke="#e8f0ff" stroke-width=".4" opacity=".85"/>`; }
    // the moon's line along the top of the barrel, the lantern's warm one under it
    sc += ln(`M${P2(SP(2, -1))}L${P2(SP(21, -1.6))}`, .35, '#e8f0ff', .6) + ln(`M${P2(SP(22, 2))}L${P2(SP(38.6, 2))}`, .45, '#ffb468', .35);
    man += arm + hd.back + sc + hd.front;
    // the eyepiece's rim pressed to the eye socket (over the face)
    man += `<ellipse cx="${f(EYE[0] + .3)}" cy="${f(EYE[1])}" rx=".8" ry="1.3" transform="rotate(${SCOPE_A} ${f(EYE[0] + .3)} ${f(EYE[1])})" fill="none" stroke="#2a1a08" stroke-width=".5"/>`;

    // ——— the parapet: the coping stones (their top towards us), the face block by block ———
    let par = '';
    { const g = nid('pt', u), g2 = nid('pf', u);
      par += `<defs>${linGrad(g, 0, PT, 0, PF, [[0, '#4a4e58'], [1, '#30343c']])}${linGrad(g2, 0, PF, 0, 200, [[0, '#2e323a'], [.3, '#1c2028'], [1, '#0a0c10']])}</defs>`
        + `<path d="M-2 ${PT}H202V${PF}H-2Z" fill="url(#${g})"/><path d="M-2 ${PF}H202V282H-2Z" fill="url(#${g2})"/>`;
      let x = -2; while (x < 202) { const w = 18 + R() * 10; par += ln(`M${f(x)} ${PT}L${f(x - (x - 100) * .04)} ${PF}`, .5, '#0c0e12', .9) + ln(`M${f(x)} ${PF}V${PF + 9}`, .5, '#0c0e12', .8); x += w; }
      par += `<path d="M-2 ${PT}H202" stroke="#a8bcd8" stroke-width=".6" opacity=".55"/><path d="M-2 ${PF}H202" stroke="#08090c" stroke-width="1"/><path d="M-2 ${PF + .9}H202" stroke="#6a6e78" stroke-width=".35" opacity=".5"/>`;
      let y = PF + 9, row = 0;
      while (y < 200) { const h = 9 + R() * 2; let xx = -2 - (row % 2) * 9 - R() * 6;
        par += ln(`M-2 ${f(y)}H202`, .6, '#06070a', .85);
        while (xx < 202) { const w = 16 + R() * 10; par += ln(`M${f(xx)} ${f(y)}V${f(y + h)}`, .55, '#06070a', .8) + ln(`M${f(xx + .8)} ${f(y + .9)}H${f(xx + w - 1)}`, .3, '#7a7e88', .22); xx += w; }
        y += h; row++; }
      // moss in the joints, a few chips; the lantern's pool on the coping and down the face
      for (let i = 0; i < 16; i++) { const mx = R() * 200, my = PF + 2 + R() * 30; par += `<ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(1 + R() * 2)}" ry=".5" fill="#2a3a2a" opacity=".5"/>`; }
      par += K.localGlow(u, { x: LAN.x - 6, y: PT + 3, color: '#ffb060', power: .6, radius: 34 }, { squash: .35, core: false }); }
    // the notebook open on the coping: the sketch of her stern windows, columns of strokes; a pencil across it
    let book = '';
    { const c = [112, 114.4], Pg = (a2, b) => [c[0] + a2 * 11 + b * 2.2, c[1] + b * 2.6 - Math.abs(a2) * .5];
      book += K.contactShadow(u, c[0], c[1] + 2.6, 26, L, { ry: 1.2, opacity: .5 })
        + `<path d="M${P2(Pg(-1, -1))}L${P2(Pg(0, -1.1))}L${P2(Pg(1, -1))}L${P2(Pg(1, 1))}L${P2(Pg(0, 1.1))}L${P2(Pg(-1, 1))}Z" fill="#3a2418" stroke="#120a06" stroke-width=".4"/>`
        + `<path d="M${P2(Pg(-.94, -.86))}Q${P2(Pg(-.5, -1.06))} ${P2(Pg(0, -.94))}L${P2(Pg(0, .96))}Q${P2(Pg(-.5, .86))} ${P2(Pg(-.94, .9))}Z" fill="#e6dcc4"/>`
        + `<path d="M${P2(Pg(.94, -.86))}Q${P2(Pg(.5, -1.06))} ${P2(Pg(0, -.94))}L${P2(Pg(0, .96))}Q${P2(Pg(.5, .86))} ${P2(Pg(.94, .9))}Z" fill="#f2e8d0"/>`
        + ln(`M${P2(Pg(0, -.94))}L${P2(Pg(0, .96))}`, .35, '#8a7a5a', .9);
      // the sketch: the stern seen from behind, a row of windows, the lantern on the taffrail
      const s0 = Pg(-.5, -.1); book += `<path d="M${f(s0[0] - 3.2)} ${f(s0[1] - 1.4)}h6.4l-.8 3.2h-4.8z" fill="none" stroke="#3a3028" stroke-width=".3"/>` + [-2, -.6, .8].map(dx => `<rect x="${f(s0[0] + dx)}" y="${f(s0[1] - .6)}" width=".9" height=".7" fill="#3a3028"/>`).join('') + ln(`M${f(s0[0])} ${f(s0[1] - 1.4)}v-1.6`, .25, '#3a3028');
      for (let i = 0; i < 4; i++) { const p = Pg(.2, -.6 + i * .36); book += ln(`M${P2(p)}h${f(5 + R() * 2)}`, .3, '#3a3028', .8); }
      const p0 = Pg(.3, .7), p1 = Pg(1.3, -.2); book += `<path d="M${P2(p0)}L${P2(p1)}" stroke="#5a3a1a" stroke-width="1" stroke-linecap="round"/><path d="M${P2(p0)}L${P2([lerp(p0[0], p1[0], .08), lerp(p0[1], p1[1], .08)])}" stroke="#1a1410" stroke-width=".8" stroke-linecap="round"/>`; }
    // the lantern on the coping; its door ajar towards the notebook
    const lamp = K.lantern(u, L, { ...LAN, lit: true, seed: 7 }) + K.localGlow(u, { x: LP.x, y: LP.y, color: '#ffc070', power: .85, radius: 20 });
    // ——— the air: the moon's haze, the dark in the corners ———
    const air = gloom(u, 100, 140, 100, 280, .45, '#02040a') + motes(10, 128, 96, 24, 16, '#ffd8a0', 5);
    return [bg + tw, man + par + book + lamp + air];

    // the outline of the man as one dark shape (for his shadow on the wall)
    function silhouette(col) {
      const bc = HQ(.02, -.86), rx = 2.15 * HEAD.r;
      return `<g fill="${col}"><path d="${H.sp(CLOAK, true)}"/><circle cx="${f(HEAD.c[0])}" cy="${f(HEAD.c[1])}" r="${f(HEAD.r * 1.02)}"/>`
        + `<path d="M${P2(HQ(.6, -.6))}L${P2(HQ(1.2, .3))}L${P2(HQ(.9, 1))}L${P2(HQ(.1, .9))}Z"/>`
        + `<ellipse cx="${f(bc[0])}" cy="${f(bc[1])}" rx="${f(rx)}" ry="${f(HEAD.r * .3)}" transform="rotate(${f(HEAD.tilt * .55)} ${P2(bc)})"/>`
        + `<ellipse cx="${f(bc[0])}" cy="${f(bc[1] - HEAD.r * .55)}" rx="${f(HEAD.r * .88)}" ry="${f(HEAD.r * .58)}"/>`
        + `<path d="M${P2(SP(0, -1.2))}L${P2(SP(42, -2.6))}L${P2(SP(42, 2.6))}L${P2(SP(0, 1.2))}Z"/>`
        + `<path d="M${P2(SP(GRIP_T - 3, 1))}L${P2(SP(GRIP_T + 3, 1))}L${f(EL0()[0] + 4)} ${f(EL0()[1])}L${f(EL0()[0] - 4)} ${f(EL0()[1])}Z"/></g>`;
    }
    function EL0() { const g = SP(GRIP_T, 6); return [g[0] - 8, g[1] + 28]; }
  } };
