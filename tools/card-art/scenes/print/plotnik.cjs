// «Плотник» (общая карта, РЕМОНТ: восстановите 2 клетки на любых шкалах своего корабля), refined from the
// first-round scene (portrait-pearl.cjs SCENES['Плотник']): a breach in the ship's side with the sea showing
// through it, a new light plank laid over it and nailed, the carpenter's arm swinging the hammer. The setting moves
// below (brief: свеча или фонарь в трюме): the hold in 2.5D — the hull side from inside facing us (inner planking,
// frames), the deck beams overhead and the floor running to one vanishing point at eye level. One fresh plank is
// already nailed over the top of the breach, the second is half done: two nails in on the left, the third nail
// half driven on the right, the hammer up for the blow. Below the planks the rest of the breach still shows the
// sunset sea. Brief's find: светлая свежая доска на тёмном борту.
// Fixed against the first round: the plank floated over the hole — now it lies on the frames and is nailed to them;
// the hammer was a stick on a stiff tube arm — now a claw hammer in a fist, the forearm in a rolled sleeve; the
// wall was flat — now a room with depth. Light: a lantern on a hook under the deck beams (key, warm); the low sun
// through the breach (second, orange, shafts into the dusty hold).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, glow, gloom, shafts, motes, nails } = PK;

const HZ = 74, VX = 100;                     // eye level = the sea horizon in the breach; the vanishing point
const WT = 24, WB = 116;                     // the hull side: top (under the deck beams) and foot (the floor)
const LAMP = { x: 86, y: 34, s: 1, hang: 3 };
const FLAME = { x: 86, y: 34 - 7.5 };
const SUN = { x: 94, y: 71 };
const FR = [10, 58, 142, 190];               // the frames (ribs) standing in front of the inner planking
const PL = [{ y: 37, h: 11.4, c: '#e6bc80', seed: 3 }, { y: 49.2, h: 11.8, c: '#eec68c', seed: 5 }];   // the new planks
const PX0 = 51, PX1 = 149;
const BREACH = [[66, 44], [74, 40.5], [84, 43], [92, 39.5], [102, 42], [112, 40], [122, 44], [131, 41], [136, 52], [133, 62], [136, 74], [132, 86], [134, 96],
  [124, 100], [112, 96.5], [102, 101], [92, 98], [80, 101], [70, 97], [65, 88], [67.5, 76], [64, 64], [67, 54]];
const light = { time: 'night', haze: .3, key: { type: 'point', x: FLAME.x, y: FLAME.y, h: 1.6, gy: 150, color: '#ffbe6a', power: 1, radius: 110 },
  fill: { color: '#3a4a6a', power: .3 }, locals: [{ x: 100, y: 82, color: '#ff9a50', power: .7, radius: 50 }] };
const lightOut = { time: 'dusk', haze: .4, key: { type: 'sun', x: SUN.x, y: SUN.y, el: 3, color: '#ffc890', power: .9 }, fill: { color: '#7a6a9a', power: .4 } };
const GRIP = [150, 73], HEADV = [.22, -.975], HS = 3.5;   // where the fist holds the handle, the handle's direction to the head
const skel = { horizon: HZ, eye: 1.6, light: 'lantern on a hook under the beams (key) + the low sun through the breach (shafts)', items: [
  ['hull side', -10, WB, 220, WB - WT, 'floor / the deck beams'], ['breach', 64, 101, 72, 62, 'hull side'], ['plank 1', PX0, 48.4, PX1 - PX0, 11.4, 'frames 58 and 142 (nails)'],
  ['plank 2', PX0, 61, PX1 - PX0, 11.8, 'frames (two nails left, one half driven right)'], ['lantern', 80, 34, 12, 31, 'hook in the deck above'],
  ['hammer', 150, 72, 24, 48, 'in the fist'], ['hand + arm', 150, 90, 60, 34, 'from the near right edge'], ['saw', 18, 86, 26, 40, 'peg on the hull side'],
  ['shavings', 60, 122, 80, 8, 'floor']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, y) => { const t = (y - HZ) / (p[1] - HZ); return [VX + (p[0] - VX) * t, y]; };   // the point on the ray from the VP through p, at height y

module.exports = { name: 'Плотник', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(31);
    const brD = 'M' + BREACH.map(P2).join('L') + 'Z';
    // ——— outside, through the breach: the sunset sea ———
    const oc = nid('oc', u);
    let out = K.sky(u, Lo, { horizon: HZ, stars: false }) + K.sunMoon(u, Lo, { r: 6.4 })
      + K.cloud(u, Lo, { x: 118, y: 58, w: 34, h: 5, seed: 4, far: .3 }) + K.cloud(u, Lo, { x: 78, y: 50, w: 26, h: 4, seed: 9, far: .5 })
      + K.water(u, Lo, { horizon: HZ, bottom: 104, swell: .5, seed: 3, glitter: SUN.x });
    let bg = `<defs><clipPath id="${oc}"><path d="${brD}"/></clipPath></defs><g clip-path="url(#${oc})">${out}</g>`;
    // ——— the ceiling: the deck planks overhead, the beams coming at us from the wall to the vanishing point ———
    { const g = nid('cl', u); bg += `<defs>${linGrad(g, 0, 0, 0, WT, [[0, '#0c0704', 1], [1, '#2a180c', 1]])}</defs><rect x="-10" y="-2" width="220" height="${WT + 2}" fill="url(#${g})"/>`;
      for (const y of [3, 9.5, 15, 19.6, 22.6]) bg += `<path d="M-10 ${y}H210" stroke="#060302" stroke-width=".8"/><path d="M-10 ${y + .6}H210" stroke="#6a4424" stroke-width=".3" opacity=".4"/>`;
      for (const bx of [44, 156]) { const w = 5, dep = 4.6, a = [bx - w, WT], b = [bx + w, WT], a0 = toward(a, -4), b0 = toward(b, -4), a1 = [a[0], WT + dep], b1 = [b[0], WT + dep], a2 = toward(a1, -4 + dep * 1.6), b2 = toward(b1, -4 + dep * 1.6);
        const inner = bx < VX ? [b, b0, b2, b1] : [a, a0, a2, a1], bot = [a1, b1, b2, a2];
        bg += K.shadeBox(u, [{ pts: inner, n: bx < VX ? 'right' : 'left', grain: [b0[0] - b[0], b0[1] - b[1]] }, { pts: bot, n: 'bottom', grain: [b0[0] - b[0], b0[1] - b[1]] }], L, 'oak', { seed: bx, outline: .5 }); }
      // the shelf: the long timber along the top of the side that carries the beams
      bg += `<rect x="-10" y="${WT - 1}" width="220" height="5" fill="url(#oak${u})" opacity=".85"/><path d="M-10 ${WT - 1}H210" stroke="#0a0502" stroke-width=".8"/><path d="M-10 ${WT + 3.8}H210" stroke="#0a0502" stroke-width="1"/><path d="M-10 ${WT + 4.4}H210" stroke="#c08a52" stroke-width=".35" opacity=".45"/>`; }
    // ——— the hull side from inside: the inner planking, with the breach cut out of it ———
    { const m = nid('bm', u), g = nid('wl', u);
      bg += `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="-10" y="0" width="220" height="140"><rect x="-10" y="0" width="220" height="140" fill="#fff"/><path d="${brD}" fill="#000"/></mask>`
        + `${radGrad(g, FLAME.x, FLAME.y + 26, 120, [[0, '#ffc070', .42], [.35, '#ffa040', .2], [1, '#ffa040', 0]])}</defs>`
        + `<g mask="url(#${m})">${woodTex(u, -10, WT + 4.6, 220, WB - WT - 4.6, '#4e301a', '#2a180a', '#0e0804', 7.4, false, 4)}`
        + `<rect x="-10" y="${WT}" width="220" height="${WB - WT}" fill="url(#${g})"/>`
        + [[12, 40], [36, 70], [168, 50], [180, 92], [26, 100]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${2 + R() * 2}" ry="1.2" fill="#1a0e06" opacity=".5"/>`).join('')
        + `</g>`;
      // the thickness of the side round the breach: the inner planking, the space between, the outer planking — lit
      // by the sun along the lower edge; torn plank ends and splinters bent in towards us
      bg += `<path d="${brD}" fill="none" stroke="#120904" stroke-width="2.6"/><path d="${brD}" fill="none" stroke="#5a341a" stroke-width="1" opacity=".9"/>`
        + `<path d="M${BREACH.slice(12, 21).map(P2).join('L')}" stroke="#ffb060" stroke-width=".9" fill="none" opacity=".75"/>`;
      for (let i = 0; i < BREACH.length; i++) { const p = BREACH[i], q = BREACH[(i + 1) % BREACH.length], c = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], dx = 100 - c[0], dy = 70 - c[1], l = Math.hypot(dx, dy);
        for (let k = 0; k < 2; k++) { const s = [lerp(p[0], q[0], .25 + k * .5), lerp(p[1], q[1], .25 + k * .5)], len = 3 + R() * 5, w = .6 + R() * .8, ex = s[0] + dx / l * len + (R() - .5) * 2, ey = s[1] + dy / l * len + (R() - .5) * 2 + 1.2;
          bg += `<path d="M${f(s[0] - w)} ${f(s[1])}L${f(ex)} ${f(ey)}L${f(s[0] + w)} ${f(s[1] + w * .4)}Z" fill="${R() > .45 ? '#d8a868' : '#8a5a30'}" stroke="#2a1608" stroke-width=".25"/>`; } } }
    // ——— the frames: stout ribs in front of the planking, their sides turned to the vanishing point; the middle one
    // broken by the shot (the stub stands up into the breach) ———
    const frame = (x, y0, y1, top) => { const w = 9, side = Math.max(1.4, Math.abs(VX - x) * .03), lft = x < VX, fx = lft ? x + w / 2 : x - w / 2 - side;
      let s = K.shadeBox(u, [{ pts: [[fx, y0], [fx + side, y0], [fx + side, y1], [fx, y1]], n: lft ? 'right' : 'left', grain: [0, 1] }, { pts: [[x - w / 2, y0], [x + w / 2, y0], [x + w / 2, y1], [x - w / 2, y1]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: Math.round(x), outline: .5 });
      if (top) s += top;
      return s; };
    let mid = '';
    for (const x of FR) mid += frame(x, WT + 4.6, WB);
    mid += frame(100, WT + 4.6, 40);
    { const jag = 'M95.5 116L95.5 93L97 89.4L98.2 92L99.6 86.6L101.2 91L102.6 88.4L104.5 92.6L104.5 116Z', g = nid('fr', u);
      mid += `<defs>${linGrad(g, 95, 0, 105, 0, [[0, '#3a2210', 1], [.5, '#6a4224', 1], [1, '#4a2c14', 1]])}</defs><path d="${jag}" fill="url(#${g})" stroke="#140a04" stroke-width=".5"/>`
        + `<path d="M97 89.4L98.2 92L99.6 86.6L101.2 91L102.6 88.4L104.5 92.6" stroke="#f0c890" stroke-width=".6" fill="none"/>`
        + `<path d="M98.6 89l-1.4 -5M101 88l1.6 -6.4M103 89.6l2.4 -4" stroke="#d8a868" stroke-width=".7" stroke-linecap="round"/>`; }
    // ——— the hand saw hanging on a peg on the side, left; its shadow on the planking ———
    { const sx = 30, sy = 52, sh = 'M0 0L5 -1.6L7.4 4L7.4 9.6L2.6 11.4L1 9.4Q3.6 8 3.4 4.8Q3 2 0 2Z';
      mid += `<path d="M${sx - 2} ${sy + 8}L${sx - 9} ${sy + 44}L${sx + 5} ${sy + 46}L${sx + 6.4} ${sy + 9}Z" fill="#000" opacity=".35" transform="translate(-3 3)"/>`
        + `<circle cx="${sx}" cy="${sy - 1}" r="1.4" fill="url(#oak${u})" stroke="#140a04" stroke-width=".4"/>`
        + `<path d="M${sx - 2} ${sy + 8}L${sx - 9} ${sy + 44}L${sx + 5} ${sy + 46}L${sx + 6.4} ${sy + 9}Z" fill="url(#silver${u})" stroke="#3a4248" stroke-width=".4"/>`
        + Array.from({ length: 12 }, (_, k) => { const t = k / 12, x0 = lerp(sx - 9, sx + 5, t), y0 = lerp(sy + 44, sy + 46, t); return `<path d="M${f(x0)} ${f(y0)}l.6 1.3l.6 -1.2" stroke="#5a6268" stroke-width=".4" fill="none"/>`; }).join('')
        + `<path d="M${sx - 1.4} ${sy + 9}L${sx - 8} ${sy + 42}" stroke="#ffffff" stroke-width=".4" opacity=".6"/>`
        + `<g transform="translate(${sx - 4} ${sy - 1})"><path d="${sh}" fill="url(#oakH${u})" stroke="#1a0e06" stroke-width=".5" transform="scale(1.35)"/><ellipse cx="5.4" cy="7.4" rx="1.6" ry="2.6" fill="#1a0e06" transform="rotate(10 5.4 7.4)"/></g>`; }
    // ——— the new planks over the frames: fresh pine, grain, end grain, knots, shadows under them, the nails ———
    let planks = '';
    for (const p of PL) { const g = nid('pk', u), Rp = rng(p.seed), y0 = p.y, y1 = p.y + p.h;
      planks += `<path d="M${PX0 - 1} ${f(y1 + .5)}H${PX1 + 1}L${PX1 + 2} ${f(y1 + 4.5)}H${PX0}Z" fill="#000" opacity=".4" filter="url(#drop${u})"/>`;
      planks += `<defs>${linGrad(g, 0, y0, 0, y1, [[0, mix(p.c, '#fff4dc', .45), 1], [.2, p.c, 1], [.8, mix(p.c, '#a06a36', .3), 1], [1, mix(p.c, '#6a4220', .5), 1]])}</defs>`
        + `<path d="M${PX0} ${f(y0 + .3)}L${PX1} ${f(y0)}L${PX1 + .4} ${f(y1)}L${PX0 + .2} ${f(y1 + .2)}Z" fill="url(#${g})" stroke="#7a4c20" stroke-width=".5"/>`;
      for (let k = 0; k < 6; k++) { const yy = y0 + 1.6 + k * (p.h - 3) / 5 + (Rp() - .5) * .6, a = (Rp() - .5) * 1.4; planks += `<path d="M${PX0 + 1} ${f(yy)}Q${f(lerp(PX0, PX1, .3 + Rp() * .4))} ${f(yy + a)} ${PX1 - 1} ${f(yy + (Rp() - .5))}" stroke="${mix(p.c, '#8a5420', .55)}" stroke-width="${f(.25 + Rp() * .25)}" fill="none" opacity=".75"/>`; }
      { const kx = lerp(PX0, PX1, .35 + Rp() * .3), ky = (y0 + y1) / 2; planks += `<ellipse cx="${f(kx)}" cy="${f(ky)}" rx="2.6" ry="1.5" fill="#a06a34" opacity=".75"/><ellipse cx="${f(kx)}" cy="${f(ky)}" rx="1.1" ry=".7" fill="#6a3e18"/><path d="M${f(kx - 6)} ${f(ky - 2.4)}Q${f(kx)} ${f(ky - 4)} ${f(kx + 6)} ${f(ky - 2.2)}M${f(kx - 6)} ${f(ky + 2.4)}Q${f(kx)} ${f(ky + 4)} ${f(kx + 6)} ${f(ky + 2.2)}" stroke="#a87038" stroke-width=".35" fill="none" opacity=".7"/>`; }
      planks += `<path d="M${PX0} ${f(y0 + .4)}L${PX1} ${f(y0 + .1)}" stroke="#fff6e0" stroke-width=".6" opacity=".9"/>`
        + `<path d="M${PX0} ${f(y0 + .3)}L${PX0 + 1.4} ${f(y0 + .3)}L${PX0 + 1.6} ${f(y1 + .2)}L${PX0 + .2} ${f(y1 + .2)}Z" fill="#f8dca8" opacity=".8"/>`
        + `<path d="M${PX1 - 1.2} ${f(y0)}L${PX1} ${f(y0)}L${PX1 + .4} ${f(y1)}L${PX1 - .9} ${f(y1)}Z" fill="#b07a42" opacity=".8"/>`; }
    const nail = (x, y) => K.shadeSphere(u, x, y, 1, L, 'iron', { outline: .3 }) + `<circle cx="${f(x + .9)}" cy="${f(y + .9)}" r="1.3" fill="#3a2410" opacity=".35"/>`;
    for (const x of [FR[1], FR[2]]) for (const y of [40.4, 45.2]) planks += nail(x + (y > 43 ? .6 : -.4), y);
    planks += nail(FR[1] - .4, 52.6) + nail(FR[1] + .6, 57.6) + nail(FR[2] - .6, 52.6);
    // the third nail, half driven: the shank standing out, its head, chips and dust round it
    { const nx = FR[2] + .6, ny = 57.8; planks += `<path d="M${nx} ${ny}L${nx + 3.2} ${ny - 2.6}" stroke="url(#iron${u})" stroke-width="1.1" stroke-linecap="round"/><path d="M${nx + .3} ${ny - .6}L${nx + 3} ${ny - 2.8}" stroke="#e8eef2" stroke-width=".3"/>`
      + `<ellipse cx="${nx + 3.5}" cy="${ny - 2.9}" rx="1.6" ry=".9" transform="rotate(-40 ${nx + 3.5} ${ny - 2.9})" fill="url(#iron${u})" stroke="#1a1a1c" stroke-width=".3"/>`
      + `<path d="M${nx - 1.2} ${ny + .6}l-2.6 1.4M${nx + 1.4} ${ny + 1}l1.8 2.2M${nx - .6} ${ny - 1}l-2 -1.8" stroke="#fff0d0" stroke-width=".5" stroke-linecap="round"/>` + motes(8, nx - 6, ny - 5, 12, 10, '#ffe8c0', 6); }
    // ——— the floor: deck planks to the vanishing point; shavings and a split offcut at the foot of the side ———
    let floor = '';
    { const id = nid('fc', u); floor += `<defs><clipPath id="${id}"><rect x="-10" y="${WB}" width="220" height="${290 - WB}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: WB, bottom: 290, vx: VX, kind: 'oak', plank: 15, seed: 12 })}</g>`
        + `<path d="M-10 ${WB}H210" stroke="#0a0502" stroke-width="1.4"/><path d="M-10 ${WB + 1.2}H210" stroke="#c08a52" stroke-width=".4" opacity=".4"/>`;
      for (let i = 0; i < 26; i++) { const x = 52 + R() * 100, y = WB + 3 + R() * 18, r = 1.2 + R() * 2.2 * (1 + (y - WB) / 20);
        floor += `<path d="M${f(x - r)} ${f(y)}a${f(r)} ${f(r * .5)} 0 1 1 ${f(r * 1.4)} ${f(r * .3)}a${f(r * .6)} ${f(r * .3)} 0 1 1 ${f(-r * .8)} ${f(-r * .3)}" stroke="${R() > .4 ? '#f2d098' : '#c8945a'}" stroke-width="${f(.4 + R() * .3)}" fill="none" stroke-linecap="round"/>`; }
      floor += `<path d="M114 128l26 -3l1 3l-26 3z" fill="#e2b678" stroke="#7a4c20" stroke-width=".4"/><path d="M140 125l1 3l1.6 -.4l-.8 -3z" fill="#f6dcac"/>`;
    }
    // ——— the hammer: a claw hammer, the head up for the blow; the fist on the handle; the forearm from the right ———
    let arm = '';
    { const hv = HEADV, pv = [-hv[1], hv[0]], fc = [-.97, -.24];   // pv: across the handle; fc: the way the face looks (to the nail)
      const top = [GRIP[0] + hv[0] * 40, GRIP[1] + hv[1] * 40], bot = [GRIP[0] - hv[0] * 12, GRIP[1] - hv[1] * 12];
      // motion: the head's path just behind it, faint arcs
      arm += `<path d="M${f(top[0] + 6)} ${f(top[1] + 12)}Q${f(top[0] + 10)} ${f(top[1] - 2)} ${f(top[0] + 2)} ${f(top[1] - 8)}M${f(top[0] + 9)} ${f(top[1] + 16)}Q${f(top[0] + 14)} ${f(top[1] + 2)} ${f(top[0] + 7)} ${f(top[1] - 7)}" stroke="#ffe8c8" stroke-width=".5" fill="none" opacity=".35"/>`;
      arm += K.shadeCyl(u, bot[0], bot[1], top[0] - hv[0] * 2, top[1] - hv[1] * 2, 2.3, L, 'oak', { r1: 2.5, r2: 1.9, outline: .4, cap: 'round', seed: 2 });
      // the head: the round striking face towards the nail, the cheeks with the eye wedge, the curved split claw
      let head = '';
      const face = [top[0] + fc[0] * 7.4, top[1] + fc[1] * 7.4], neck = [top[0] + fc[0] * 3, top[1] + fc[1] * 3], cb = [top[0] - fc[0] * 3.2, top[1] - fc[1] * 3.2];
      head += K.shadeCyl(u, neck[0], neck[1], face[0], face[1], 2.4, L, 'iron', { r1: 1.9, r2: 2.6, ell: .5, face: 2, outline: .4 });
      head += K.shadeBox(u, [{ pts: [[top[0] - fc[0] * 3.4 - hv[0] * 3.2, top[1] - fc[1] * 3.4 - hv[1] * 3.2], [neck[0] - hv[0] * 3.2, neck[1] - hv[1] * 3.2], [neck[0] + hv[0] * 3.2, neck[1] + hv[1] * 3.2], [top[0] - fc[0] * 3.4 + hv[0] * 3.2, top[1] - fc[1] * 3.4 + hv[1] * 3.2]], n: 'front' }], L, 'iron', { outline: .4 });
      { const c1 = [cb[0] - fc[0] * 5 + hv[0] * 1, cb[1] - fc[1] * 5 + hv[1] * 1], c2 = [cb[0] - fc[0] * 8.6 - hv[0] * 3.4, cb[1] - fc[1] * 8.6 - hv[1] * 3.4];
        const g = K.mat('iron', L, { form: 'cyl', x1: cb[0], y1: cb[1], x2: c2[0], y2: c2[1], r: 2, u });
        head += `<defs>${g.defs}</defs><path d="M${f(cb[0] + hv[0] * 2.6)} ${f(cb[1] + hv[1] * 2.6)}Q${P2(c1)} ${P2(c2)}L${f(c2[0] + hv[0] * .8)} ${f(c2[1] + hv[1] * .8)}Q${f(c1[0] - hv[0] * 1.4)} ${f(c1[1] - hv[1] * 1.4)} ${f(cb[0] - hv[0] * 2.4)} ${f(cb[1] - hv[1] * 2.4)}Z" fill="${g.fill}" stroke="#141618" stroke-width=".4"/>`
          + `<path d="M${f(cb[0] - fc[0] * 1)} ${f(cb[1] - fc[1] * 1)}Q${f(c1[0] - hv[0] * .3)} ${f(c1[1] - hv[1] * .3)} ${f(c2[0] + hv[0] * .3)} ${f(c2[1] + hv[1] * .3)}" stroke="#0a0b0c" stroke-width=".45" fill="none"/>`; }
      head += `<ellipse cx="${f(top[0])}" cy="${f(top[1])}" rx="1.5" ry="1" transform="rotate(${f(Math.atan2(fc[1], fc[0]) * 180 / Math.PI)} ${f(top[0])} ${f(top[1])})" fill="#5a3418" stroke="#1a0e06" stroke-width=".3"/>`
        + `<path d="M${P2([face[0] - hv[0] * 2.4, face[1] - hv[1] * 2.4])}L${P2([face[0] + hv[0] * 2.4, face[1] + hv[1] * 2.4])}" stroke="#f0f4f6" stroke-width=".5" opacity=".8"/>`;
      arm += `<g transform="translate(${f(top[0])} ${f(top[1])}) scale(1.45) translate(${f(-top[0])} ${f(-top[1])})">${head}</g>`;
      // the forearm, the rolled shirt sleeve at the right edge, the fist round the handle (thumb on the head's side)
      const skin = { lit: '#f2bc8c', half: '#b87a50', core: '#a26a44', shadow: '#5c3422', outline: '#2a140a' };
      const shirt = { lit: '#efe4cc', half: '#b8aa8c', shadow: '#5a4a3a', outline: '#22180e' };
      const a = Math.atan2(-hv[0], hv[1]) * 180 / Math.PI, ua = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];   // n = hv: the handle crosses the fist
      const W = [GRIP[0] - ua[0] * 6 * HS, GRIP[1] - ua[1] * 6 * HS], E = [W[0] - ua[0] * 30, W[1] - ua[1] * 30 + 2];
      arm += H.cloth(u, { spine: [[E[0] + 6, E[1] + 1.6], [lerp(E[0], W[0], .5), lerp(E[1], W[1], .5) - 1.2], [W[0] + ua[0] * .6, W[1] + ua[1] * .6]], w: [18.4, 16.4, 11.4], tone: skin, lit: -1, folds: false, capA: true, sw: .4 })
        + Array.from({ length: 14 }, (_, k) => { const t = .15 + R() * .7, p = [lerp(E[0], W[0], t), lerp(E[1], W[1], t) - 2 + R() * 4]; return `<path d="M${f(p[0])} ${f(p[1])}l${f(-1.2 - R())} ${f(-.4 + R() * .3)}" stroke="#5a3420" stroke-width=".25" opacity=".55"/>`; }).join('')
        + `<path d="M${f(lerp(E[0], W[0], .25))} ${f(lerp(E[1], W[1], .25) - 4.2)}Q${f(lerp(E[0], W[0], .55))} ${f(lerp(E[1], W[1], .55) - 5)} ${f(lerp(E[0], W[0], .85))} ${f(lerp(E[1], W[1], .85) - 3.2)}" stroke="#ffd8a8" stroke-width=".6" fill="none" opacity=".6"/>`;
      arm += H.cloth(u, { spine: [[226, E[1] + 4], [214, E[1] + 2.4], [E[0] + 4, E[1] + 1]], w: [22, 21, 20], tone: shirt, lit: -1, cuff: { from: .55, k: 1.12, roll: true }, seed: 8, drapes: 2, sw: .4 });
      const hd = H.hand(u, { at: W, a, s: HS, m: -1, pose: 'grip', tone: skin, sw: .35 });
      arm += hd.back + hd.front;
    }
    // ——— the lantern on its hook; the light: its pool, the sun's shafts into the hold, motes, the dark round it ———
    let fg = K.lantern(u, L, { ...LAMP, lit: true, seed: 3 }) + K.localGlow(u, { x: FLAME.x, y: FLAME.y, color: '#ffc070', power: .9, radius: 26 });
    fg += shafts(u, SUN.x, SUN.y, [[60, 290, 96, 290], [104, 290, 150, 290], [36, 230, 54, 240]], '#ffb070', .1)
      + K.localGlow(u, { x: 100, y: 100, color: '#ff9a50', power: .35, radius: 44 }, { core: false })
      + motes(30, 66, 60, 70, 60, '#ffd8a0', 11) + motes(14, 40, 20, 120, 40, '#ffe0b0', 13)
      + gloom(u, 100, 70, 0, 20, .3) + gloom(u, 100, 70, 210, 0, .2) + gloom(u, 100, 120, 100, 280, .5);
    return [bg, mid + planks + floor + arm + fg];
  } };
