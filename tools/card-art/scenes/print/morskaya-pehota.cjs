// «Морская пехота» (Индевор, РЕАКЦИЯ: отмените весь урон по Команде от этого Залпа или карты; если это был абордаж —
// нападавший корабль теряет 1 Команду), refined from the first-round scene (portrait-endeavour.cjs SCENES['Морская
// пехота']): on the Company ship's deck a line of marines in red coats stands along the bulwark, bayonets levelled
// over the rail at the black ship lashed alongside by grappling hooks. The concept stays (the deck in perspective, the
// rail, the redcoats along it, the enemy's dark side and the smoke); the brief's find is drawn out: one even wall of
// bayonets — every musket at the same height and the same angle, the line running to one vanishing point — and the
// boarders thrown back: one who got onto our rail reels back off the bayonet points, arms flung up, his cutlass
// spinning away; on their rail the next ones shrink back.
// The picture is mirrored against the first round (the rail on the left): the bayonets and the boarders fall into the
// part of the card that shows in a fanned hand. Fixed against the first round: the figures were flat stickers of
// different sizes standing anywhere — now one rank at one distance from the rail, scaled by depth to the vanishing
// point; the nearest marine is drawn whole (a face in three-quarter view under a tricorn, his near arm one sleeve
// from the shoulder to the hand round the musket's fore-end); the rail was a bent strip — now a bulwark in
// perspective with stanchions and a cap rail; the hooks bite on the cap rail with their lines taut to the enemy.
// Light: the afternoon sun high on the left behind us (key: the marines' near sides, the white belts, the steel);
// the sky (fill); the enemy's side faces away from the sun — dark, the boarders lit only along their left edges.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { tricorn, rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom } = PK;

const HZ = 72, VX = 128, FOC = 120, EYE = 1.7;      // the horizon (eye level), the vanishing point, units per metre at 1 m
const P3 = (X, Y, z) => [VX + FOC * X / z, HZ - FOC * Y / z];   // X right, Y up from the eye (m), z depth (m)
const D = -EYE;                                     // our deck
const XB = -2.6, YR = D + 1.15;                     // our port bulwark (the rail cap), its height
const XE = -3.5, YE = -.1;                          // the enemy's side and her rail
const XM = -1.3;                                    // the rank of marines (their feet)
const RANK = [12, 10, 8.4, 7, 5.8, 4.7, 3.7, 2.8, 2.05];   // far to near
const light = { time: 'day', haze: .3, key: { type: 'sun', az: 245, el: 38, color: '#fff0d8', power: 1 }, fill: { color: '#8ab0d8', power: .45 } };
const SKIN = { lit: '#f2c69c', half: '#c88a60', core: '#a86c48', shadow: '#62382a', outline: '#2a140a' };
const LT = [-.75, -.66];                            // picture direction to the sun
const skel = { horizon: HZ, eye: EYE, light: 'sun high on the left behind us (key) + sky (fill); the enemy in her own shadow', items: [
  ['deck', 0, 280, 200, 190, 'our ship'], ['port bulwark', -10, 290, 130, 214, 'deck, from the left edge to the bow (vp 128, 72)'],
  ['enemy side + rigging', -10, 100, 140, 100, 'water, lashed alongside (her rail y ~74)'], ['marines', 30, 165, 100, 100, 'deck: one rank, X −1.3 m, z 2–12 m'],
  ['bayonets', -10, 112, 120, 40, 'muskets in their hands, over our rail'], ['boarder on the rail', 22, 88, 50, 52, 'our cap rail (z 4.4), thrown back'],
  ['boarders behind', 60, 75, 46, 32, 'the enemy rail'], ['hooks', 18, 96, 70, 14, 'bite on our cap rail, lines to the enemy'], ['mainmast', 122, 95, 12, 95, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = a => 'M' + a.map(P2).join('L') + 'Z';
const ln = (d, w = .5, c = '#0a0604', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${f(w)}" fill="none" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
function handAt(u, base, g, t, a0) { let a = a0, h; for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip: g }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
  let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; } return h; }

module.exports = { name: 'Морская пехота', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE }), R = rng(73);
    // ——— the sky, a few clouds, the sea ahead beyond the bow; smoke drifting from the enemy ———
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[160, 26, 60, 10, 4, .2], [196, 50, 40, 6, 9, .5], [120, 60, 30, 4, 13, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 100, swell: .4, seed: 5, glitter: false });

    // ——— the enemy alongside: her black side between her rail and ours, gunports, the chain-wale; her rigging ———
    let en = '';
    { const zs = [2.2, 40], top = zs.map(z => P3(XE, YE, z)), bot = zs.map(z => P3(XE, D - .4, z));
      const g = nid('es', u);
      en += `<defs>${linGrad(g, 0, 70, 0, 140, [[0, '#2a2a30'], [.4, '#16161a'], [1, '#0a0a0c']])}</defs><path d="${poly([top[0], top[1], bot[1], bot[0]])}" fill="url(#${g})"/>`;
      for (const dy of [.25, .5, .8, 1.1, 1.4]) { const a = P3(XE, YE - dy, 2.2), b = P3(XE, YE - dy, 40); en += ln(`M${P2(a)}L${P2(b)}`, .4, '#050506', .8); }
      // her cap rail lit by the sun along its top, a chain-wale, two gunports with their lids up
      en += ln(`M${P2(top[0])}L${P2(top[1])}`, 1.4, '#3a3634') + ln(`M${P2([top[0][0], top[0][1] - .6])}L${P2([top[1][0], top[1][1] - .2])}`, .5, '#c8b8a0', .7);
      for (const z of [5.2, 9.5]) { const a = P3(XE, YE - .45, z), b = P3(XE, YE - .45, z + .7), c = P3(XE, YE - 1.0, z + .7), d = P3(XE, YE - 1.0, z);
        en += `<path d="${poly([a, b, c, d])}" fill="#050506"/>` + `<path d="${poly([a, b, P3(XE + .1, YE - .2, z + .7), P3(XE + .1, YE - .2, z)])}" fill="#4a1410" opacity=".85"/>`; }
      // the masts: fore and main, shrouds down to her channels, a dark sail half set, all thinning into the smoke
      for (const [z, w] of [[5.6, .5], [13, .45]]) { const b = P3(-6.2, YE, z), t = [b[0] + 2, -10], rr = FOC * w / z / 2;
        en += K.shadeCyl(u, b[0], b[1], t[0], t[1], rr, L, 'oak', { outline: .3, r2: rr * .8 });
        for (let i = 0; i < 5; i++) { const c = P3(XE + .05, YE + .1, z - .9 + i * .45); en += ln(`M${P2(c)}L${f(t[0] + (i - 2) * .6)} ${f(t[1] + 30 + i * 2)}`, .35, '#1a1612', .8); }
      }
      { const a = [-10, 10], b = [56, 4], c = [52, 40], d = [-10, 48], g2 = nid('esl', u);
        en += `<defs>${linGrad(g2, 0, 4, 0, 48, [[0, '#4a4644'], [1, '#2a2826']])}</defs><path d="M${P2(a)}Q${f(26)} ${f(2)} ${P2(b)}Q${f(60)} ${f(22)} ${P2(c)}Q${f(22)} ${f(46)} ${P2(d)}Z" fill="url(#${g2})" opacity=".92"/>`
          + ln(`M${P2(a)}Q26 2 ${P2(b)}`, 1.2, '#2a2420') + ln(`M14 7Q18 26 12 46M34 5Q40 24 34 44`, .4, '#1a1816', .6) + ln(`M${P2(b)}Q60 22 ${P2(c)}`, .6, '#d8d0c0', .6); } }
    // smoke of the first shots drifting between the ships and over her deck (wind from the left)
    let smk = K.smoke(u, L, { x: 30, y: 74, w: 70, h: 50, seed: 4, wind: .6, opacity: .7 }) + K.smoke(u, L, { x: 86, y: 74, w: 44, h: 34, seed: 9, wind: .7, opacity: .55 })
      + K.smoke(u, L, { x: 4, y: 90, w: 50, h: 40, seed: 12, wind: .5, opacity: .5 });

    // ——— our ship: the deck to the bow; the far bulwarks and the forecastle; the mainmast; the starboard rail ———
    let deck = '';
    { const id = nid('dc', u); deck += `<defs><clipPath id="${id}"><path d="${poly([P3(XB, D, 1.2), P3(XB, D, 30), P3(2.6, D, 30), P3(2.6, D, 1.2)])}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: HZ + 6, bottom: 290, vx: VX, kind: 'oak', plank: 12, seed: 6 })}</g>`;
      // the forecastle bulkhead across the deck far ahead, the bow beyond it
      const zb = 24, a = P3(XB, D + 1.4, zb), b = P3(2.6, D + 1.4, zb), c = P3(2.6, D, zb), d = P3(XB, D, zb);
      deck += `<path d="${poly([a, b, c, d])}" fill="#6a4a2c" stroke="#2a1608" stroke-width=".3"/>` + ln(`M${P2(a)}L${P2(b)}`, .6, '#e8c890', .8); }
    // a bulwark: inner planking from the deck to the rail, stanchions, the cap rail on top; side −1 port, +1 starboard
    const bulwark = (X, side) => { const z0 = 1.6, z1 = 24, a = P3(X, YR, z0), b = P3(X, YR, z1), c = P3(X, D, z1), d = P3(X, D, z0), g = nid('bk', u);
      let s = `<defs>${linGrad(g, a[0], 0, b[0], 0, side < 0 ? [[0, '#6a4a2c'], [1, '#5a3e22']] : [[0, '#d0a468'], [1, '#9a7448']])}</defs><path d="${poly([a, b, c, d])}" fill="url(#${g})"/>`;
      for (const t of [.3, .55, .8]) s += ln(`M${P2(P3(X, D + 1.15 * t, z0))}L${P2(P3(X, D + 1.15 * t, z1))}`, .4, '#4a2e16', .7);
      // the waterway along the foot, the shadow under the cap rail
      s += ln(`M${P2(P3(X, D + .05, z0))}L${P2(P3(X, D + .05, z1))}`, 1, '#2a1a0c', .6) + ln(`M${P2(P3(X, YR - .06, z0))}L${P2(P3(X, YR - .06, z1))}`, 1.4, '#2a1608', .45);
      // stanchions: square timbers standing out from the planking, their lit faces to the sun
      for (let z = 2.2; z < 24; z *= 1.22) { const w = .14, p0 = P3(X, YR, z), p1 = P3(X, D, z), q0 = P3(X - side * w, YR, z), q1 = P3(X - side * w, D, z), e0 = P3(X - side * w, YR, z + .12), e1 = P3(X - side * w, D, z + .12);
        s += `<path d="${poly([q0, e0, e1, q1])}" fill="${side < 0 ? '#8a6440' : '#e8bc80'}"/><path d="${poly([p0, q0, q1, p1])}" fill="${side < 0 ? '#4a301a' : '#b08250'}" stroke="#2a1608" stroke-width=".25"/>`; }
      // the cap rail: its top (lit) and its inner edge
      const t0 = P3(X, YR, z0), t1 = P3(X, YR, z1), u0 = P3(X + side * .1, YR, z0), u1 = P3(X + side * .1, YR, z1), v0 = P3(X - side * .1, YR, z0), v1 = P3(X - side * .1, YR, z1);
      s += `<path d="${poly([u0, u1, v1, v0])}" fill="${side < 0 ? '#f0d29c' : '#a8845a'}" stroke="#3a2210" stroke-width=".35"/>` + ln(`M${P2(v0)}L${P2(v1)}`, .5, '#3a2210', .9);
      void t0; void t1; return s; };
    deck += bulwark(2.6, 1);
    // the mainmast: a tall shaft from the deck, its wedges and fife-rail, shrouds to both rails
    { const z = 9.6, b = P3(0, D, z), t = [b[0], -6], rr = FOC * .3 / z;
      for (const X of [-2.55, 2.55]) for (let i = 0; i < 4; i++) { const c = P3(X, YR, z - .6 + i * .4); deck += ln(`M${P2(c)}L${f(t[0] + (X < 0 ? -1 : 1) * (1 + i * .3))} ${f(8 + i * 3)}`, .35, '#3a2a1a', .75); }
      // the mast stands in the shade of the mainsail overhead (out of the picture): dark and cool, so it does not
      // cut the picture in two
      const mf = nid('mf', u);
      deck += K.castShadow(u, L, { x: b[0], y: b[1], w: rr * 2, h: b[1] - t[1], horizon: HZ, opacity: .5 })
        + `<defs><filter id="${mf}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".56 .04 .02 0 .02  .03 .58 .04 0 .03  .02 .05 .66 0 .05  0 0 0 1 0"/></filter></defs><g filter="url(#${mf})">`
        + K.shadeCyl(u, b[0], b[1], t[0], t[1], rr, L, 'oak', { outline: .35, r2: rr * .85, seed: 3 })
        + `<path d="M${f(b[0] - rr * 2.6)} ${f(b[1] - 3.4)}h${f(rr * 5.2)}v1.2h${f(-rr * 5.2)}z" fill="#8a6038" stroke="#2a1608" stroke-width=".3"/>`
        + [-1.8, 1.8].map(dx => K.shadeCyl(u, b[0] + dx * rr, b[1] - 3, b[0] + dx * rr, b[1] - 6.2, .5, L, 'brass', { outline: .2 })).join('') + '</g>'
        // the Company's ensign at the masthead, flying to the right (the wind from the left)
        + (() => { const fx = t[0] + 1, fy = 2; let s = `<path d="M${f(fx)} ${f(fy)}q8 -2 16 1l-.4 9q-8 -2.4 -15.6 0z" fill="#f4ece0"/>`;
          for (let k = 0; k < 5; k += 2) s += `<path d="M${f(fx)} ${f(fy + 1 + k * 1.9)}q8 -2 16 1" stroke="#c0302a" stroke-width="1.8" fill="none" transform="translate(0 ${f(k * .12)})"/>`;
          return s; })(); }
    deck += bulwark(XB, -1);
    // ——— the grappling hooks on our cap rail, their lines taut up to the enemy ———
    const hook = (z, to) => { const c = P3(XB, YR + .02, z), k = FOC / z, s0 = k * .028;
      let s = K.rope(u, L, [[c[0] - .6 * s0, c[1] - 1.4 * s0], [lerp(c[0], to[0], .5), lerp(c[1], to[1], .5) - 1], to], { r: Math.max(.35, s0 * .55), seed: Math.round(z * 3) });
      // the shank across the rail, two flukes biting over its inner edge, a third standing up
      s += K.shadeCyl(u, c[0] - 3 * s0, c[1] - 1.2 * s0, c[0] + 2.4 * s0, c[1] + .2 * s0, s0 * .55, L, 'iron', { outline: .3 })
        + ln(`M${f(c[0] + 2.4 * s0)} ${f(c[1] + .2 * s0)}q${f(2 * s0)} ${f(.3 * s0)} ${f(2.2 * s0)} ${f(2.8 * s0)}l${f(-.8 * s0)} ${f(-.6 * s0)}`, s0 * .9, '#2a2c30')
        + ln(`M${f(c[0] + 2.4 * s0)} ${f(c[1] + .2 * s0)}q${f(.8 * s0)} ${f(-2.4 * s0)} ${f(2.8 * s0)} ${f(-3)}`, s0 * .8, '#3a3c40')
        + ln(`M${f(c[0] + 2.2 * s0)} ${f(c[1] - .1 * s0)}q${f(1.6 * s0)} ${f(.2 * s0)} ${f(1.9 * s0)} ${f(2.2 * s0)}`, s0 * .3, '#c8ccd0', .7);
      return s; };
    let hooks = hook(2.75, [-10, 76]) + hook(6.2, [38, 60]);

    // ——— the boarder: one man who got onto our cap rail, thrown back off the bayonets — falling backwards
    // overboard: the planted foot's heel still on the rail, the body tipped back over the gap, the other leg and his
    // sword arm flung forwards (his cutlass spinning away up to the right), the other arm reaching back for the rail.
    // Lit from behind on the left (the sun): his back and the tops of his limbs; his front in his own shade.
    const litSide = (a, b) => ((-(b[1] - a[1])) * LT[0] + (b[0] - a[0]) * LT[1]) >= 0 ? 1 : -1;
    let brd = '';
    { const z = 3.45, k = FOC / z, ft = P3(XB, YR, z), M = (x, y) => [ft[0] + x * k, ft[1] - y * k];
      const SH = { lit: '#f0e6d4', half: '#b0a28c', shadow: '#5e5244', outline: '#1a140e' };
      const TR = { lit: '#7a8aa0', half: '#3e4a5e', shadow: '#1a2232', outline: '#06080e' };
      const LE = { lit: '#8a6444', half: '#3e2818', shadow: '#1a0e06', outline: '#080402' };
      const SK = { lit: '#e2aa80', half: '#ae7450', core: '#8e5a3a', shadow: '#4e2a1a', outline: '#1a0a04' };
      const J = { hipC: [-.33, .86], hipF: [-.31, .84], hipB: [-.36, .9], kneeB: [-.29, .5], ankleB: [-.2, .085], kneeF: [-.02, 1.1], ankleF: [.3, 1.18],
        shF: [-.64, 1.24], elF: [-.38, 1.3], wrF: [-.12, 1.33], shB: [-.6, 1.3], elB: [-.8, 1.08], wrB: [-.84, .83], neck: [-.69, 1.29], head: [-.8, 1.43] };
      // (the planted heel is 0.2 m to the left in the picture and 0.045 m lower: on the rail line, clear of the nearest marine's face)
      const V = n => M(...J[n]);
      const limb = (pts, w, tn, o = {}) => H.cloth(u, Object.assign({ spine: pts, w, tone: tn, lit: litSide(pts[0], pts[pts.length - 1]), rim: '#fff0d8', rimSide: litSide(pts[0], pts[pts.length - 1]), rimOp: .5, seed: 4, drapes: 1, sw: .35, L, capA: true }, o));
      // a riding boot: the shaft from under the knee to the ankle, its turned-down top, the foot with heel and sole
      const boot = (knee, ankle, fd) => { const kn = M(...knee), an = M(...ankle), sd = [kn[0] - an[0], kn[1] - an[1]], sl = Math.hypot(...sd), dn = [sd[0] / sl, sd[1] / sl];
        const fp = [fd[0], -fd[1]], upv = (() => { const d = dn[0] * fp[0] + dn[1] * fp[1], v = [dn[0] - fp[0] * d, dn[1] - fp[1] * d], l = Math.hypot(...v); return [v[0] / l, v[1] / l]; })();
        const F = (x, y) => [an[0] + (fp[0] * x + upv[0] * y) * k, an[1] + (fp[1] * x + upv[1] * y) * k];
        const top = [lerp(an[0], kn[0], .66), lerp(an[1], kn[1], .66)], mid = [lerp(an[0], kn[0], .33), lerp(an[1], kn[1], .33)];
        let b = limb([top, mid, an], [k * .14, k * .12, k * .105], LE, { drapes: 0, folds: false, rimOp: .35 });
        const foot = [F(-.07, .07), F(-.075, -.03), F(-.06, -.1), F(.16, -.1), F(.22, -.07), F(.235, -.03), F(.19, .0), F(.09, .04), F(.035, .075)], g = nid('bt', u);
        b += `<defs>${linGrad(g, F(.08, .06)[0], F(.08, .06)[1], F(.08, -.1)[0], F(.08, -.1)[1], [[0, LE.lit], [.45, LE.half], [1, LE.shadow]])}</defs>`
          + `<path d="${H.sp(foot, true)}" fill="url(#${g})" stroke="${LE.outline}" stroke-width=".35"/>`
          + `<path d="M${P2(F(-.075, -.085))}L${P2(F(.02, -.085))}L${P2(F(.02, -.125))}L${P2(F(-.07, -.125))}Z" fill="#140a04" stroke="${LE.outline}" stroke-width=".25"/>`
          + ln(`M${P2(F(.03, -.105))}L${P2(F(.2, -.09))}`, .5, '#5a4030', .8) + ln(`M${P2(F(.0, .05))}Q${P2(F(.12, .03))} ${P2(F(.2, -.01))}`, .45, '#c8a07a', .55)
          // creases round the ankle, the turned-down top of the shaft (lighter leather) with its own shadow under it
          + ln(`M${P2(F(-.05, .1))}Q${P2(F(.0, .13))} ${P2(F(.05, .1))}M${P2(F(-.04, .16))}Q${P2(F(.0, .19))} ${P2(F(.05, .16))}`, .3, LE.shadow, .8);
        const n = [-dn[1], dn[0]], cw = k * .085, t1 = [top[0] - dn[0] * k * .07, top[1] - dn[1] * k * .07];
        b += `<path d="M${f(top[0] + n[0] * cw)} ${f(top[1] + n[1] * cw)}Q${f(top[0] + dn[0] * k * .03)} ${f(top[1] + dn[1] * k * .03)} ${f(top[0] - n[0] * cw)} ${f(top[1] - n[1] * cw)}L${f(t1[0] - n[0] * cw * 1.08)} ${f(t1[1] - n[1] * cw * 1.08)}Q${f(t1[0] + dn[0] * k * .02)} ${f(t1[1] + dn[1] * k * .02)} ${f(t1[0] + n[0] * cw * 1.08)} ${f(t1[1] + n[1] * cw * 1.08)}Z" fill="#7a5434" stroke="${LE.outline}" stroke-width=".35"/>`
          + ln(`M${f(t1[0] + n[0] * cw)} ${f(t1[1] + n[1] * cw)}L${f(t1[0] - n[0] * cw)} ${f(t1[1] - n[1] * cw)}`, .4, '#c09068', .6);
        return b; };
      // the far arm reaching back for the rail (behind the body), its open hand
      const hB = H.hand3(u, { at: V('wrB'), a: 98, s: k * .021, m: -1, roll: 40, pose: 'open', spread: 10, tone: SK, light: LT, sw: .3 });
      brd += limb([V('shB'), V('elB'), V('wrB')], [k * .125, k * .115, k * .1], SH, { cuff: { from: .84, k: 1.18, tone: SH } }) + hB.back + hB.front;
      // the planted leg: the trouser leg into the boot, the heel on our cap rail
      brd += limb([V('hipB'), V('kneeB'), M(lerp(J.kneeB[0], J.ankleB[0], .4), lerp(J.kneeB[1], J.ankleB[1], .4))], [k * .17, k * .14, k * .13], TR) + boot(J.kneeB, J.ankleB, [Math.cos(.45), Math.sin(.45)]);
      // the torso along the hip → shoulder axis: the loose shirt, the open waistcoat over his back and side, the sash
      { const A = [J.neck[0] - J.hipC[0], J.neck[1] - J.hipC[1]], al = Math.hypot(...A), Fn = [A[1] / al, -A[0] / al];
        const T = (t, s2) => M(J.hipC[0] + A[0] * t + Fn[0] * s2, J.hipC[1] + A[1] * t + Fn[1] * s2);
        const out = [T(-.06, .13), T(.25, .155), T(.55, .175), T(.8, .15), T(.95, .08), T(1.02, 0), T(.95, -.12), T(.72, -.16), T(.42, -.13), T(.12, -.145), T(-.08, -.12)], g = nid('tb', u), cl = nid('tc', u);
        const b0 = T(.5, -.17), f0 = T(.5, .18);
        brd += `<defs>${linGrad(g, b0[0], b0[1], f0[0], f0[1], [[0, SH.lit], [.35, SH.half], [1, SH.shadow]])}<clipPath id="${cl}"><path d="${H.sp(out, true)}"/></clipPath></defs>`
          + `<path d="${H.sp(out, true)}" fill="url(#${g})"/><g clip-path="url(#${cl})">`
          // the shirt's folds pulled across the chest by the flung arm
          + ln(`M${P2(T(.62, .17))}Q${P2(T(.5, .06))} ${P2(T(.3, .04))}M${P2(T(.75, .15))}Q${P2(T(.66, .08))} ${P2(T(.5, .1))}`, .45, SH.shadow, .6)
          // the waistcoat: the back and the side, its front edge down the side of the chest
          + `<path d="M${P2(T(1.05, -.2))}L${P2(T(.96, .05))}Q${P2(T(.62, .07))} ${P2(T(.2, .06))}L${P2(T(.05, .07))}L${P2(T(-.1, -.2))}Z" fill="#26342a"/>`
          + ln(`M${P2(T(.96, .05))}Q${P2(T(.62, .07))} ${P2(T(.2, .06))}L${P2(T(.05, .07))}`, .55, '#7a8c6a', .7)
          + ln(`M${P2(T(.9, -.14))}Q${P2(T(.55, -.17))} ${P2(T(.1, -.15))}`, 1.2, '#6a8268', .45)
          + ln(`M${P2(T(.7, -.02))}Q${P2(T(.5, -.05))} ${P2(T(.3, -.03))}`, .35, '#0e1610', .6)
          // the sash round the waist
          + `<path d="M${P2(T(.14, .2))}L${P2(T(.16, -.2))}L${P2(T(-.04, -.2))}L${P2(T(-.04, .2))}Z" fill="#8a1c18"/>`
          + ln(`M${P2(T(.1, .2))}L${P2(T(.12, -.2))}M${P2(T(.03, .2))}L${P2(T(.05, -.2))}`, .4, '#4a0a08', .7) + ln(`M${P2(T(.14, -.2))}L${P2(T(.14, .0))}`, .6, '#e0605a', .5)
          + '</g>' + `<path d="${H.sp(out, true)}" fill="none" stroke="${SH.outline}" stroke-width=".4"/>`
          + ln(H.sp([T(.95, -.125), T(.72, -.165), T(.42, -.135), T(.12, -.15)]), .55, '#fff0d8', .6);
        // the sash's knotted ends at his front hip, flying with the fall
        const kn = T(.06, .14);
        brd += `<path d="M${P2(kn)}Q${f(kn[0] + k * .1)} ${f(kn[1] + k * .06)} ${f(kn[0] + k * .2)} ${f(kn[1] + k * .02)}L${f(kn[0] + k * .19)} ${f(kn[1] + k * .07)}Q${f(kn[0] + k * .1)} ${f(kn[1] + k * .1)} ${P2([kn[0] - k * .01, kn[1] + k * .04])}Z" fill="#7a1612" stroke="#2a0404" stroke-width=".3"/>`
          + `<path d="M${P2(kn)}Q${f(kn[0] + k * .06)} ${f(kn[1] + k * .12)} ${f(kn[0] + k * .1)} ${f(kn[1] + k * .2)}L${f(kn[0] + k * .05)} ${f(kn[1] + k * .21)}Q${f(kn[0] + k * .02)} ${f(kn[1] + k * .12)} ${P2([kn[0] - k * .02, kn[1] + k * .02])}Z" fill="#8a1c18" stroke="#2a0404" stroke-width=".3"/>`
          + `<ellipse cx="${f(kn[0])}" cy="${f(kn[1])}" rx="${f(k * .035)}" ry="${f(k * .03)}" fill="#6a1210" stroke="#2a0404" stroke-width=".3"/>`; }
      // the neck (short), the head thrown back — shouting, eyes wide — long hair under a red head-scarf
      { const n0 = V('neck'), hc = V('head'), hr = k * .115;
        brd += ln(`M${P2(n0)}L${P2([lerp(n0[0], hc[0], .75), lerp(n0[1], hc[1], .75)])}`, k * .11 + .7, SK.outline) + ln(`M${P2(n0)}L${P2([lerp(n0[0], hc[0], .75), lerp(n0[1], hc[1], .75)])}`, k * .11, SK.half)
          + ln(`M${P2([n0[0] - k * .03, n0[1] - k * .02])}L${P2([lerp(n0[0], hc[0], .7) - k * .03, lerp(n0[1], hc[1], .7) - k * .02])}`, k * .03, SK.lit, .5);
        const hd = H.head(u, { c: hc, r: hr, dir: 1, tilt: -50, tone: SK, detail: true, mouth: .7, eye: 'wide', brow: 'up', beard: 'short', moustache: true, hairColor: '#1a1008',
          hair: { style: 'long', color: '#1a1008' }, ear: true, warm: { color: '#fff0d8', op: .3 } }), Q = hd.Q;
        brd += hd.svg;
        const sc = [Q(.66, -.6), Q(.6, -.86), Q(.36, -1.12), Q(-.14, -1.24), Q(-.62, -1.1), Q(-.98, -.74), Q(-1.1, -.3), Q(-.86, -.34), Q(-.42, -.56), Q(.12, -.62)];
        brd += `<path d="${H.sp(sc, true)}" fill="#a82420" stroke="#2a0404" stroke-width=".35"/>`
          + ln(H.sp([Q(.5, -.92), Q(.1, -1.14), Q(-.5, -1.08)]), .7, '#e8625a', .6) + ln(H.sp([Q(.3, -.66), Q(-.3, -.62), Q(-.8, -.42)]), .4, '#4a0806', .7)
          // the knot at the back of the head, its two tails fluttering
          + `<ellipse cx="${f(Q(-1.04, -.36)[0])}" cy="${f(Q(-1.04, -.36)[1])}" rx="${f(hr * .18)}" ry="${f(hr * .14)}" fill="#8a1a16" stroke="#2a0404" stroke-width=".3"/>`
          + `<path d="M${P2(Q(-1.04, -.36))}Q${P2(Q(-1.5, -.5))} ${P2(Q(-1.8, -.2))}L${P2(Q(-1.62, -.06))}Q${P2(Q(-1.4, -.28))} ${P2(Q(-1.04, -.3))}Z" fill="#a82420" stroke="#2a0404" stroke-width=".3"/>`
          + `<path d="M${P2(Q(-1.04, -.36))}Q${P2(Q(-1.36, -.08))} ${P2(Q(-1.46, .3))}L${P2(Q(-1.3, .32))}Q${P2(Q(-1.24, .0))} ${P2(Q(-1.0, -.3))}Z" fill="#921e1a" stroke="#2a0404" stroke-width=".3"/>`; }
      // the kicked leg: the trouser leg up and forward, the boot's sole towards the bayonets
      brd += limb([V('hipF'), V('kneeF'), M(lerp(J.kneeF[0], J.ankleF[0], .45), lerp(J.kneeF[1], J.ankleF[1], .45))], [k * .175, k * .145, k * .135], TR) + boot(J.kneeF, J.ankleF, [-.24, .97]);
      // the sword arm flung forwards, the hand open: it has just let go of the cutlass
      const hF = H.hand3(u, { at: V('wrF'), a: -12, s: k * .021, m: 1, roll: 12, pose: 'open', spread: 13, tone: SK, light: LT, sw: .3 });
      brd += limb([V('shF'), V('elF'), V('wrF')], [k * .13, k * .12, k * .105], SH, { cuff: { from: .84, k: 1.2, tone: SH } }) + hF.back + hF.front;
      // the cutlass spinning away up to the right, its arcs of motion
      const cc = [78.3, 39.9];
      brd += `<g transform="rotate(-140 ${P2(cc)})"><path d="M${f(cc[0] - 7)} ${f(cc[1])}q7 -2.2 14 -.5l.3 .9q-7 .3 -14.3 1z" fill="#c8ccd0" stroke="#3a3c40" stroke-width=".3"/><path d="M${f(cc[0] - 7)} ${f(cc[1] - 1.4)}v3.4" stroke="#8a6a30" stroke-width="1"/><path d="M${f(cc[0] - 7)} ${f(cc[1] + .3)}h-3" stroke="#2a1a10" stroke-width="1.1"/></g>`
        + `<path d="M${f(cc[0] - 6)} ${f(cc[1] + 5)}a8 8 0 0 1 2 -10M${f(cc[0] + 6)} ${f(cc[1] - 5)}a8 8 0 0 1 -2 10" stroke="#ffffff" stroke-width=".35" fill="none" opacity=".45"/>`; }
    // ——— the marines: one rank along the rail, the same uniform, muskets levelled, bayonets over the rail ———
    // a marine standing at depth z, facing left (we see his left side); local metres: x forward = −x, y up
    const RED = L.ramp('paint-red', 90, 90), WHT = L.ramp('linen', 90, 90), NAVY = { lit: '#3a4c7a', half: '#1e2a4a', shadow: '#0a1020', outline: '#04060c' };
    const marine = (z, o = {}) => { const k = FOC / z, ft = P3(XM, D, z), M = (x, y) => [ft[0] + x * k, ft[1] - y * k], Rm = rng(o.seed || 1);
      const sw = Math.max(.25, k * .006);
      let back = '', body = '', front = '';
      // the musket: butt at the right hip, the barrel forward and a little up, the bayonet on its socket
      const butt = M(.34, .9), wrist = M(.06, .99), fore = M(-.4, 1.1), muz = M(-1.12, 1.25), tip = M(-1.6, 1.36);
      // the far leg (right, back), the far arm (behind the body)
      back += limbC(M(.06, .9), M(.18, .5), M(.3, .04), k * .14, WHT, sw) + gaiter(M(.18, .5), M(.3, .04), k * .12);
      back += limbC(M(.04, 1.4), M(.18, 1.16), wrist, k * .1, { lit: RED.half, half: RED.core, shadow: RED.shadow, outline: '#1a0404' }, sw);
      // the near leg (left, forward)
      body += limbC(M(-.04, .9), M(-.2, .5), M(-.26, .04), k * .145, WHT, sw) + gaiter(M(-.2, .5), M(-.26, .04), k * .125);
      // the coat: the body, the skirts turned back (white lining), the white crossbelt, the cartridge box behind
      body += `<path d="${H.sp([M(.12, 1.42), M(.14, 1.18), M(.16, .98), M(.24, .62), M(.06, .56), M(-.12, .74), M(-.2, .98), M(-.18, 1.22), M(-.12, 1.44), M(0, 1.5)], true)}" fill="${RED.half}" stroke="#1a0404" stroke-width="${f(sw)}"/>`
        + `<path d="${H.sp([M(-.18, 1.24), M(-.2, .98), M(-.12, .74), M(-.04, .74), M(-.08, .98), M(-.08, 1.3)])}" fill="${RED.lit}" opacity=".6"/>`
        + `<path d="M${P2(M(.16, .96))}L${P2(M(.24, .62))}L${P2(M(.13, .6))}Z" fill="${WHT.half}" stroke="#2a2420" stroke-width="${f(sw * .8)}"/>`
        + `<path d="M${P2(M(-.1, 1.44))}L${P2(M(-.03, 1.47))}L${P2(M(.15, 1.02))}L${P2(M(.09, .98))}Z" fill="${WHT.lit}" stroke="#4a4438" stroke-width="${f(sw * .6)}"/>`
        + `<path d="M${P2(M(.1, 1.1))}L${P2(M(.2, 1.1))}L${P2(M(.2, .96))}L${P2(M(.1, .96))}Z" fill="#141216" stroke="#000" stroke-width="${f(sw * .6)}"/>`
        + `<path d="M${P2(M(-.2, .99))}L${P2(M(.15, .99))}" stroke="${WHT.half}" stroke-width="${f(k * .04)}"/>`
        // the navy lapel on the chest, the brass buttons down it
        + `<path d="M${P2(M(-.13, 1.43))}L${P2(M(-.19, 1.2))}L${P2(M(-.15, 1.06))}L${P2(M(-.11, 1.22))}Z" fill="${NAVY.half}"/>`
        + (k > 20 ? [1.36, 1.27, 1.18].map(y => `<circle cx="${f(M(-.135, y)[0])}" cy="${f(M(-.135, y)[1])}" r="${f(k * .011)}" fill="#e0b848"/>`).join('') : '')
        // the white stock at the neck, the neck
        + `<path d="M${P2(M(-.1, 1.44))}L${P2(M(.04, 1.47))}L${P2(M(.03, 1.53))}L${P2(M(-.1, 1.52))}Z" fill="${WHT.lit}"/>`;
      // the musket
      const mg = nid('mk', u);
      front += `<defs>${linGrad(mg, 0, butt[1] - k * .05, 0, butt[1] + k * .05, [[0, '#a8743e'], [1, '#4a2a12']])}</defs>`
        + `<path d="M${P2(M(.36, .84))}L${P2(M(.34, .96))}L${P2(M(.1, 1.0))}L${P2(M(-.86, 1.215))}L${P2(M(-.86, 1.185))}L${P2(M(.04, .96))}L${P2(M(.2, .9))}Z" fill="url(#${mg})" stroke="#1a0c04" stroke-width="${f(sw)}"/>`
        + ln(`M${P2(M(.02, 1.0))}L${P2(muz)}`, k * .022, '#3a3c42') + ln(`M${P2(M(.02, 1.008))}L${P2(muz)}`, k * .007, '#e8ecf0', .8)
        + ln(`M${P2(M(.02, .985))}L${P2(M(.1, .985))}`, k * .03, '#8a8e94')
        // the bayonet: a socket over the muzzle, a short neck, the blade (a bright edge on its top)
        + ln(`M${P2(M(-1.06, 1.237))}L${P2(muz)}`, k * .03, '#5a5e64') + ln(`M${P2(muz)}L${P2(M(-1.15, 1.275))}`, k * .012, '#5a5e64')
        + `<path d="M${P2(M(-1.15, 1.29))}L${P2(tip)}L${P2(M(-1.15, 1.265))}Z" fill="#b8c0c8" stroke="#3a3e44" stroke-width="${f(sw * .7)}"/>`
        + ln(`M${P2(M(-1.15, 1.285))}L${P2(tip)}`, Math.max(.2, k * .005), '#ffffff', .9);
      // the near arm: shoulder → elbow → the hand under the fore-end (a fist as a lump for the far ones)
      if (!o.nearArm) { const sh = M(-.04, 1.42), el = M(-.14, 1.14);
        front += limbC(sh, el, M(-.36, 1.08), k * .105, { lit: RED.lit, half: RED.half, shadow: RED.shadow, outline: '#1a0404' }, sw)
          + `<path d="M${P2(M(-.31, 1.1))}L${P2(M(-.36, 1.02))}" stroke="${NAVY.half}" stroke-width="${f(k * .11)}"/>`
          + `<ellipse cx="${f(fore[0])}" cy="${f(fore[1] + k * .01)}" rx="${f(k * .05)}" ry="${f(k * .04)}" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width="${f(sw * .7)}"/>`; }
      // the head (profile, facing left) and the tricorn, unless the caller draws them
      if (!o.ownHead) { const hc = M(-.08, 1.62), hr = k * .105;
        if (hr > 3) { const hh = H.head(u, { c: hc, r: hr, dir: -1, tilt: 4, tone: SKIN, detail: hr > 5, eye: 'open', brow: 'frown', hairColor: o.hair || '#3a2414', stubble: !!o.stubble, moustache: !!o.moustache, ear: true, warm: { color: '#fff0d8', op: .25 } }); body += hh.svg !== undefined ? hh.svg : hh; }
        else body += `<circle cx="${f(hc[0])}" cy="${f(hc[1])}" r="${f(hr)}" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width="${f(sw * .7)}"/><path d="M${f(hc[0] - hr)} ${f(hc[1])}l${f(-hr * .3)} ${f(hr * .2)}l${f(hr * .3)} ${f(hr * .1)}" fill="${SKIN.half}"/>`;
        body += hatProfile(hc, hr); }
      return { back, body, front, M, k };
    };
    function limbC(a, b, c, w, tn, sw) { const d = `M${P2(a)}Q${P2(b)} ${P2(c)}`; return ln(d, w + sw * 2, tn.outline || '#1a1410') + ln(d, w, tn.half) + ln(d, w * .35, tn.lit, .7); }
    function gaiter(a, b, w) { const p = [lerp(a[0], b[0], .15), lerp(a[1], b[1], .15)]; return ln(`M${P2(p)}L${P2(b)}`, w, '#141216') + ln(`M${P2(p)}L${P2(b)}`, w * .25, '#4a4a54', .7)
      + `<path d="M${f(b[0] + w * .3)} ${f(b[1] - w * .2)}l${f(-w * 1.6)} ${f(w * .1)}l${f(w * .1)} ${f(w * .45)}l${f(w * 1.6)} 0z" fill="#0e0c0e"/>`; }
    // a tricorn seen from the side on a profile head facing left: the crown, the front corner, the back cocked up
    function hatProfile(hc, hr) { const P = (x, y) => [hc[0] + x * hr, hc[1] + y * hr];
      return `<path d="M${P2(P(-.86, -.5))}Q${P2(P(-.9, -1.4))} ${P2(P(0, -1.42))}Q${P2(P(.92, -1.36))} ${P2(P(.9, -.5))}Z" fill="#1a1820" stroke="#000" stroke-width=".3"/>`
        + `<path d="M${P2(P(-1.5, -.82))}Q${P2(P(-.4, -.38))} ${P2(P(.4, -.5))}L${P2(P(1.18, -1.36))}Q${P2(P(1.3, -.6))} ${P2(P(.8, -.3))}Q${P2(P(-.4, -.18))} ${P2(P(-1.32, -.6))}Z" fill="#141216" stroke="#000" stroke-width=".3"/>`
        + ln(`M${P2(P(-1.5, -.82))}Q${P2(P(-.4, -.38))} ${P2(P(.4, -.5))}L${P2(P(1.18, -1.36))}`, Math.max(.25, hr * .07), '#f0ece2', .9)
        + ln(`M${P2(P(-.8, -1.1))}Q${P2(P(-.5, -1.38))} ${P2(P(0, -1.4))}`, Math.max(.2, hr * .06), '#6a6a78', .7); }

    let ranks = '', ranksNear = '';
    RANK.forEach((z, i) => { if (z < 2.5) return; const m = marine(z, { seed: i + 2, hair: ['#3a2414', '#1a1210', '#6a4a2a', '#2a1a10'][i % 4], moustache: i === 6, stubble: i === 5 });
      const sv = K.castShadow(u, L, { x: m.M(0, 0)[0], y: m.M(0, 0)[1], w: m.k * .5, h: m.k * 1.8, horizon: HZ, opacity: .45 }) + m.back + m.body + m.front;
      if (z > 3.45) ranks += sv; else ranksNear += sv; });

    // ——— the nearest marine, drawn whole: a lean young face, a stern mouth, under a tricorn with white tape ———
    let near = '';
    { const z = RANK[RANK.length - 1], m = marine(z, { seed: 11, ownHead: true, nearArm: true }), k = m.k, M = m.M;
      near += K.castShadow(u, L, { x: M(0, 0)[0], y: M(0, 0)[1], w: k * .5, h: k * 1.8, horizon: HZ, opacity: .45 }) + m.back + m.body;
      const hc = M(-.07, 1.63), hr = k * .108;
      const hd = H.head34(u, { c: hc, r: hr, turn: .78, dir: -1, nod: 4, tone: SKIN, light: LT, warm: { color: '#fff0d8', op: .3 }, eye: 'open', look: [-.8, .05],
        brow: 'frown', mouth: 0, smile: -.15, hair: { style: 'tied', color: '#6a4426', ribbon: '#141216' }, hairColor: '#5a3a20', iris: '#4a5a6a' });
      const hat = tricorn(u, hd, { r: hr, color: '#16141a', trim: '#f0ece2', light: LT, y: -.6, size: 1.4 });
      near += hd.svg + hat.back + hat.front + rimArc(hd, { r: hr, light: LT, color: '#fff4e0', span: 40, opacity: .3 });
      // the musket goes over the near arm's hand; the arm: one sleeve from the shoulder, the navy cuff at the wrist
      const G = M(-.42, 1.105);
      const h = handAt(u, { s: k * .023, m: 1, roll: 155, pitch: 10, pose: 'wrap', r: 1.1, tone: SKIN, light: LT, sw: .3, palmW: .9, wristW: .8 }, G, -171, -110);
      const W = h.wrist, sh = M(-.03, 1.42), el = M(-.12, 1.13);
      near += H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5) + .4, lerp(sh[1], el[1], .5)], el, [lerp(el[0], W[0], .5), lerp(el[1], W[1], .5) + .6], W], w: [k * .13, k * .12, k * .11, k * .095, k * .085],
        tone: { lit: RED.lit, half: RED.half, shadow: RED.shadow, outline: '#1a0404' }, lit: -1, seed: 6, drapes: 1, sw: .35, L,
        cuff: { from: .74, k: 1.18, buttons: k * .009, tone: NAVY } });
      near += h.back + m.front + h.front; }

    // ——— the air: haze over the far end, the sun's warmth on the near rank, the deck darkening under the glass ———
    const air = glow(u, 30, 30, 70, 50, '#fff4dc', .12) + gloom(u, 100, 120, 100, 280, .5, '#140c06');
    return [bg + en + smk, deck + hooks + ranks + brd + ranksNear + near + air];
  } };
