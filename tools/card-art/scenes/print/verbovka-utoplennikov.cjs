// «Вербовка утопленников» (Летучий голландец, РЕМОНТ: восстановите 2 Команды), method A — a detailed copy of the
// first-round scene (portrait-dutch.cjs SCENES['Вербовка утопленников']). The concept stays: under the Dutchman's dark
// hull a rope ladder hangs, grown with weed, and a drowned sailor climbs it, hair and coat floating up; deeper, more
// rise towards it. Now, as the brief asks (card-briefs.md: the drowned rise, the contract is held out to them, they
// climb aboard), the offer is in the picture: from the open entry port in the hull a contract on a cord hangs down
// into the sea, its seal glowing; the climber, seen from behind, holds the rung over his head with one fist and
// reaches up for the contract with the other open hand, his face turned up to it. Below him, in the dark, the other
// drowned come up out of the deep — hands and arms reaching up through the murk.
// Fixed against the first round: the man was a flat silhouette with sticks for arms and no hands — now a whole figure
// (head 3/4 from behind looking up, a neck of a third of the head, two arms each one sleeve from the shoulder through
// the elbow to the cuff, people.cjs hand3 hands with slim palms — the fist round the rung, the rung through the grip,
// legs to bare feet on a lower rung); the ladder hangs from the port with its own weight and weed; the light is the
// surface's, from above: shafts past the hull, a rim on his shoulders, hair and hands.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HULL = 26;                                     // the hull's bottom at the middle (the keel line curves up to the sides)
const LAD = { x1: 64, x2: 124, top: 22, step: 13.4, y0: 44 };   // the ladder: side ropes, its top at the port, the first rung under the fist
const HEAD = { c: [100, 82], r: 10.4 };
const SHL = [86, 101], ELL = [64, 88], GRL = [75, LAD.y0 + LAD.step]; // his left arm (our left): shoulder, elbow out and down, the fist's grip on a rung at his brow
const SHR = [116, 101], ELR = [128, 76], WRR = [134, 50];         // his right arm (our right), reaching: shoulder, elbow, wrist
const DOC = { x: 140, y: 24 };                                    // the contract, hanging from the port on its cord
const light = { time: 'day', haze: .5, key: { type: 'sun', x: 150, y: -40, el: 70, color: '#c8fff0', power: .6 }, fill: { color: '#0e3a32', power: .5 },
  rim: { az: 180, color: '#c8fff0', power: .4 }, locals: [{ x: DOC.x, y: DOC.y + 8, color: '#ffd890', power: .35, radius: 18 }] };
const skel = { horizon: 0, eye: 0, light: 'under water: the light from the surface above, in shafts past the hull; a rim on everything from above; the seal of the contract glows warm', items: [
  ['hull bottom', 0, HULL + 4, 200, HULL + 4, 'the ship over us, the surface at its sides'], ['port', 86, 22, 22, 10, 'hull'], ['ladder', LAD.x1 - 2, 230, LAD.x2 - LAD.x1 + 4, 208, 'hangs from the port'],
  ['contract', DOC.x - 7, DOC.y + 20, 14, 18, 'hangs on a cord from the port'], ['climber', 60, 210, 90, 190, 'feet on a lower rung, fist on the rung over his head'],
  ['the drowned below', 0, 280, 200, 120, 'rising from the deep, under the glass']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#b8c8a8', half: '#7a8c72', core: '#64765c', shadow: '#2e3e2c', outline: '#0e1810' };   // drowned grey-green
const COAT = { lit: '#3e5a50', half: '#1e2e28', shadow: '#0a1410', outline: '#030806' };
const BREE = { lit: '#5a5a44', half: '#2e2e22', shadow: '#12120c', outline: '#050504' };
const RIMC = '#c8fff0';
// a hand round a cylinder whose axis must run at t degrees (from na-abordazh.cjs)
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// KIT-CANDIDATE: a barnacle (as in prihlop-bill.cjs)
const barn = (x, y, r, a = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><ellipse cx="${f(r * .4)}" cy="${f(r * .5)}" rx="${f(r * 1.1)}" ry="${f(r * .6)}" fill="#000" opacity=".45"/>`
  + `<path d="M${f(-r)} ${f(r * .3)}Q${f(-r * .8)} ${f(-r * .5)} ${f(-r * .35)} ${f(-r * .7)}H${f(r * .35)}Q${f(r * .8)} ${f(-r * .5)} ${f(r)} ${f(r * .3)}z" fill="#b8c4b0" stroke="#3a4838" stroke-width=".3"/>`
  + `<ellipse cy="${f(-r * .66)}" rx="${f(r * .34)}" ry="${f(r * .14)}" fill="#101810"/><path d="M${f(-r * .9)} ${f(r * .1)}Q${f(-r * .7)} ${f(-r * .5)} ${f(-r * .3)} ${f(-r * .66)}" stroke="#f0fff0" stroke-width=".4" fill="none" opacity=".7"/></g>`;
// weed streaming up and swaying (under water it floats)
function weedUp(x, y, len, n, seed, col = '#2e6a4a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 7, w = .8 + R() * .9;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(-l * .4)} ${f(sw * .3)} ${f(-l * .7)}t${f(-sw * .4)} ${f(-l * .3)}" stroke="${col}" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${f(x0 - .3)} ${f(y)}q${f(sw)} ${f(-l * .4)} ${f(sw * .3)} ${f(-l * .7)}" stroke="#8ad8b0" stroke-width=".3" fill="none" opacity=".5"/>`; }
  return out;
}
// weed hanging down from the hull (under water it still trails, swaying)
function weedDown(x, y, len, n, seed, col = '#2e6a4a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 5, l = len * (.6 + R() * .5), sw = (R() - .5) * 8;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.8 + R() * .9)}" fill="none" stroke-linecap="round"/>`; }
  return out;
}
const bubble = (x, y, r, op) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#bff8e6" fill-opacity="${f(op * .12)}" stroke="#e4fff6" stroke-width="${f(Math.max(.18, r * .22))}" opacity="${f(op)}"/>`
  + (r > .7 ? `<circle cx="${f(x - r * .35)}" cy="${f(y - r * .38)}" r="${f(r * .22)}" fill="#ffffff" opacity="${f(op * .9)}"/>` : '');
function bubbles(x, y, n, w, h, seed) { const R = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const t = R(); s += bubble(x + (R() - .5) * w * (1 + t), y - t * h, .4 + t * 1.4 + R() * .5, .5 + R() * .4); } return s; }
// a bare foot, side view: A — the ankle, d — towards the toes (sole on the lower side)
function foot(A, d, sz, tn) {
  const l = Math.hypot(d[0], d[1]); d = [d[0] / l, d[1] / l]; let n = [-d[1], d[0]]; if (n[1] < 0) n = [-n[0], -n[1]];
  const k = sz / 10, P = (x, y) => [A[0] + (d[0] * x + n[0] * y) * k, A[1] + (d[1] * x + n[1] * y) * k];
  const out = [[-1.6, -2], [-2.6, .4], [-2.4, 2.4], [-1, 3], [3, 3], [7, 3.2], [9.2, 2.8], [10, 2], [9.4, 1], [6.6, .4], [3, -1], [1.4, -2.2]].map(q => P(...q));
  return `<path d="M${out.map(P2).join('L')}Z" fill="${tn.half}" stroke="${tn.outline}" stroke-width=".35"/><path d="M${P2(P(-1.4, -1.6))}L${P2(P(3, -.8))}L${P2(P(6.6, .2))}" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".6"/>`
    + `<path d="M${P2(P(7, 2.6))}L${P2(P(7.4, 1))}M${P2(P(8.4, 2.6))}L${P2(P(8.6, 1.4))}" stroke="${tn.shadow}" stroke-width=".3"/>`;
}

module.exports = { name: 'Вербовка утопленников', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: 0, eye: 1.6 });
    // ——— the sea: bright surface overhead, deep teal below, the light fanning down past the hull ———
    let bg = '';
    { const g = nid('sea', u); bg += `<defs>${linGrad(g, 0, 0, 0, 280, [[0, '#7ad0c0', 1], [.1, '#2e8a7a', 1], [.4, '#124a40', 1], [.75, '#06221e', 1], [1, '#020c0a', 1]])}</defs><rect x="-10" y="-10" width="220" height="300" fill="url(#${g})"/>`; }
    { const R = rng(5); for (let k = 0; k < 14; k++) bg += `<path d="M${f(-10 + k * 16 + R() * 6)} ${f(2 + R() * 5)}q8 -3 16 0" stroke="#e8fff8" stroke-width="${f(.6 + R() * .8)}" fill="none" opacity=".55"/>`; }
    bg += PK.shafts(u, 100, -20, [[4, 230, 26, 230], [30, 250, 52, 250], [150, 250, 172, 250], [176, 240, 198, 240]], '#c8fff0', .16);
    // the drowned below: far down in the murk, arms raised, rising to the ladder — dark, blurred, only their shapes
    { const fb = nid('db', u); let deep = `<defs><filter id="${fb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><g filter="url(#${fb})" fill="#061a16" opacity=".85">`;
      for (const [x, y, s, a] of [[30, 120, .75, -8], [172, 128, .7, 10], [96, 236, 1.1, 0], [146, 196, .8, 6], [48, 196, .85, -4]]) {
        deep += `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><ellipse cx="0" cy="0" rx="6" ry="7"/><path d="M-9 8Q-10 30 -6 50H6Q10 30 9 8Z"/>`
          + `<path d="M-6 4Q-14 -14 -12 -30" stroke="#061a16" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M6 4Q13 -12 10 -32" stroke="#061a16" stroke-width="4" fill="none" stroke-linecap="round"/>`
          + `<path d="M-14 -30q-2 -5 1 -8M-12 -31q0 -6 3 -7M9 -33q-1 -6 2 -7M11 -32q2 -5 5 -5" stroke="#061a16" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
          + `<path d="M-5 -5q5 -4 10 0" stroke="#4a9a88" stroke-width=".9" fill="none" opacity=".6"/></g>`; }
      bg += deep + '</g>' + bubbles(34, 116, 8, 6, 30, 3) + bubbles(168, 126, 7, 6, 30, 4); }

    // ——— the hull overhead: her bottom as a dark curve, planks, barnacles, weed; the open entry port ———
    { const hg = nid('hl', u), d = `M-10 -10H210V${HULL - 14}Q160 ${HULL + 2} 100 ${HULL + 4}Q40 ${HULL + 2} -10 ${HULL - 14}Z`;
      bg += `<defs>${linGrad(hg, 0, -10, 0, HULL + 4, [[0, '#0c1814', 1], [.75, '#14241e', 1], [1, '#24382f', 1]])}</defs><path d="${d}" fill="url(#${hg})"/>`;
      for (let k = 1; k < 6; k++) bg += `<path d="M-10 ${HULL - 14 - k * 3}Q${100} ${HULL + 4 - k * 4.4} 210 ${HULL - 14 - k * 3}" stroke="#040a08" stroke-width=".7" fill="none" opacity=".8"/>`;
      bg += `<path d="M-10 ${HULL - 14}Q40 ${HULL + 2} 100 ${HULL + 4}Q160 ${HULL + 2} 210 ${HULL - 14}" stroke="#8ad8c0" stroke-width=".8" fill="none" opacity=".55"/>`;
      const R = rng(9); for (let i = 0; i < 18; i++) { const x = 6 + i * 11 + R() * 4, y = HULL + 3 - Math.pow((x - 100) / 100, 2) * 18 - R() * 3; bg += barn(x, y, 1.2 + R() * 1.1, 180 + (R() - .5) * 30); }
      bg += weedDown(30, HULL - 4, 22, 3, 2) + weedDown(152, HULL, 26, 4, 6) + weedDown(182, HULL - 8, 18, 3, 8);
      // the port: a dark square opening in the hull, its lid hanging down, the ladder's ropes coming out of it
      bg += `<path d="M86 ${HULL - 4}H110V${HULL + 3.6}H86Z" fill="#020605"/><path d="M86 ${HULL + 3.6}H110" stroke="#4a8a78" stroke-width=".6" opacity=".7"/>`
        + `<path d="M110 ${HULL + 3}L118 ${HULL + 14}L120 ${HULL + 12}L112 ${HULL + 1}Z" fill="#1a2a24" stroke="#040a08" stroke-width=".4"/>` + glow(u, 98, HULL + 1, 14, 6, '#9effd0', .25); }

    // ——— the ladder: two ropes from the port, rungs of wood, weed and a barnacle or two; it hangs on down out of sight ———
    let lad = '';
    const sideX = (x0, y) => x0 + Math.sin(y / 40) * 1.4;
    const rope = (x0, xs) => K.rope(u, L, [[xs, LAD.top + 4], [sideX(x0, 40), 40], [sideX(x0, 100), 100], [sideX(x0, 180), 180], [sideX(x0, 290), 290]], { r: 1.1, seed: x0 });
    lad += rope(LAD.x1, 90) + rope(LAD.x2, 106);
    const rung = y => { const a = sideX(LAD.x1, y), b = sideX(LAD.x2, y); return K.shadeCyl(u, a, y, b, y, 1.5, L, 'oak', { outline: .3 }) + `<path d="M${f(a + 1)} ${f(y - 1.2)}H${f(b - 1)}" stroke="${RIMC}" stroke-width=".35" opacity=".6"/>`; };
    const rungs = []; for (let y = LAD.y0; y < 290; y += LAD.step) rungs.push(y);
    for (const y of rungs) lad += rung(y);
    lad += weedUp(LAD.x1 + 2, 140, 18, 2, 3) + weedUp(LAD.x2 - 2, 98, 14, 2, 5) + barn(LAD.x2 - 4, LAD.y0 + LAD.step * 2 + 1, 1.3) + barn(LAD.x1 + 6, LAD.y0 + LAD.step * 4 + 1, 1.1);

    // ——— the contract: a sheet on a cord from the port, its wax seal glowing ———
    let doc = K.rope(u, L, [[108, HULL + 2], [124, HULL + 4], [DOC.x, DOC.y + 2]], { r: .45, seed: 4 });
    { const pg = nid('pg', u), x = DOC.x, y = DOC.y;
      doc += `<defs>${linGrad(pg, x - 6, 0, x + 6, 0, [[0, '#c8c0a0', 1], [.5, '#e8e0c4', 1], [1, '#9a9278', 1]])}</defs>`
        + `<path d="M${x - 6} ${y + 3}Q${x} ${y + 1.6} ${x + 6} ${y + 3}L${x + 6.6} ${y + 18}Q${x + 1} ${y + 19.6} ${x - 5.4} ${y + 18.4}Z" fill="url(#${pg})" stroke="#4a4430" stroke-width=".4"/>`
        + `<path d="M${x - 6} ${y + 3}q-1.6 2 0 3.6q1.6 -.6 1.4 -2.4" fill="#d8d0b4" stroke="#4a4430" stroke-width=".3"/><path d="M${x - 6} ${y + 3}Q${x} ${y + 1.6} ${x + 6} ${y + 3}" stroke="#8a8468" stroke-width="1.2" fill="none"/>`
        + [6, 8.4, 10.8, 13.2].map(dy => `<path d="M${x - 4} ${y + dy}q4 -.6 8 0" stroke="#5a5040" stroke-width=".35" fill="none" opacity=".75"/>`).join('')
        + `<circle cx="${x + 1.6}" cy="${y + 16}" r="1.9" fill="#a8241a" stroke="#4a0c08" stroke-width=".3"/><circle cx="${x + 1.2}" cy="${y + 15.6}" r=".6" fill="#ff8a6a"/>`
        + `<path d="M${x + 1.6} ${y + 17.6}l-.8 3.4M${x + 1.6} ${y + 17.6}l1.4 3" stroke="#8a1c14" stroke-width=".6"/>`
        + glow(u, x + 1.6, y + 16, 9, 9, '#ffd890', .45) + glow(u, x, y + 10, 14, 16, '#e8fff0', .2); }

    // ——— the climber, from behind ———
    let man = '';
    // the legs: breeches to below the knee, bare shins and feet on a lower rung; his left (our left) higher
    const legs = [[[94, 148], [86, 178], [91, 199], [1, .1], -1], [[108, 148], [114, 182], [111, 212], [-1, .1], 1]];
    const ry = y => rungs.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);
    for (const [hip, knee, ank0, dir, rs] of legs) {
      const ank = [ank0[0], ry(ank0[1]) - 3.4];
      man += H.cloth(u, { spine: [hip, [lerp(hip[0], knee[0], .5), lerp(hip[1], knee[1], .5)], knee, [lerp(knee[0], ank[0], .3), lerp(knee[1], ank[1], .3)]], w: [13, 11.6, 9.4, 8.6], tone: BREE, lit: rs, rim: RIMC, rimSide: rs, rimOp: .5, seed: hip[0], drapes: 1, sw: .4, capA: true })
        + H.cloth(u, { spine: [[lerp(knee[0], ank[0], .26), lerp(knee[1], ank[1], .26)], [lerp(knee[0], ank[0], .6), lerp(knee[1], ank[1], .6)], ank], w: [6.4, 5.6, 4.4], tone: SKIN, lit: rs, rim: RIMC, rimSide: rs, rimOp: .5, seed: 3, folds: false, sw: .35 })
        + foot(ank, dir, 9.6, SKIN); }
    // the coat from behind: the back, a seam down it, the tails floating up and out in the water
    { const cg = nid('cg', u), back = [[84, 100], [100, 95], [116, 100], [122, 116], [120, 140], [124, 158], [134, 170], [126, 174], [116, 162], [104, 166], [94, 162], [84, 176], [74, 172], [82, 156], [82, 132], [80, 114]];
      man += `<defs>${linGrad(cg, 84, 96, 122, 170, [[0, COAT.lit, 1], [.4, COAT.half, 1], [1, COAT.shadow, 1]])}</defs><path d="${H.sp(back, true)}" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".55"/>`
        + `<path d="M100 98Q101 130 100 164" stroke="#040a08" stroke-width=".8" fill="none"/><path d="M86 112q8 4 12 14M114 112q-6 6 -10 16M88 150q6 -4 10 4M112 150q-4 -2 -8 6" stroke="#040a08" stroke-width=".6" fill="none" opacity=".7"/>`
        + `<path d="M84 100Q100 93 116 100" stroke="${RIMC}" stroke-width=".9" fill="none" opacity=".6"/><path d="M82 146q-2 14 -8 26M120 146q4 14 14 24" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".45"/>`
        + `<path d="M84 140H120" stroke="#2a1a10" stroke-width="3" opacity=".8"/><rect x="98" y="138" width="5" height="4" fill="none" stroke="#8a7a4a" stroke-width=".6"/>`
        + barn(90, 104, 1.5, 10) + barn(93, 107, 1.1) + barn(112, 104, 1.3, -10) + weedUp(118, 104, 10, 1, 7); }
    // the neck: about a third of the head, from the collar up into the hair
    man += `<path d="M95 86L94 100Q100 103 107 100L106 86Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".35"/><path d="M95.6 90q1 5 .4 9" stroke="${RIMC}" stroke-width=".5" fill="none" opacity=".5"/>`
      + `<path d="M92 99Q100 95 108 99L108 102Q100 98 92 102Z" fill="#6a7262" stroke="#1a2018" stroke-width=".3"/>`;

    // the left arm (our left): one sleeve from the shoulder through the elbow out to the side, the fist round the rung
    const hL = handOn(u, { s: 1.95, m: 1, roll: 22, pitch: 10, pose: 'wrap', r: 1.6, tone: SKIN, light: [.1, -1], sw: .28, tilt: 6, palmW: .8, fingerW: .9, nails: true }, GRL, 0, -95);
    const sleeve = (sh, el, wr, sd, rs) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5)], el, [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5)], wr],
      w: [11.6, 10.4, 9.4, 8.2, 7.2], tone: COAT, lit: rs, rim: RIMC, rimSide: rs, rimOp: .65, seed: sd, drapes: 0, foldW: .7, sw: .4, capA: true, roundA: .9,
      cuff: { from: .86, k: 1.12, tone: { lit: '#5a6a5a', half: '#2a362e', shadow: '#0c1410', outline: '#030806' } } });
    const armL = sleeve(SHL, ELL, hL.wrist, 4, -1);
    // the right arm (our right): up past the ladder's rope to the contract, the open hand reaching, fingers just short of it
    const hR = H.hand3(u, { at: WRR, a: -84, s: 1.95, m: -1, roll: 0, pose: 'open', spread: 8, tone: SKIN, light: [.1, -1], sw: .28, palmW: .8, fingerW: .9, nails: true });
    const armR = sleeve(SHR, ELR, WRR, 6, 1);
    // the head: 3/4 from behind, turned up to the contract; the hair floating up off it in locks
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .82, dir: 1, nod: -26, tone: SKIN, light: [.1, -1], warm: { color: '#c8fff0', op: .25 }, eye: 'half', look: [.4, -.8], brow: 'calm', mouth: .25,
      lips: '#4a5444', iris: '#9ab8a8', hair: { style: 'short', color: '#141c18' }, hairColor: '#141c18' });
    let hair = '';
    { const R = rng(13), Q = hd.Q;
      for (let i = 0; i < 14; i++) { const t = i / 13, p = Q(lerp(-.7, .5, t), lerp(-.5, -.92, Math.sin(t * Math.PI)), lerp(-.7, -.1, Math.sin(t * Math.PI))), l = 11 + R() * 8, lean = lerp(-8, 4, t) + (R() - .5) * 3, sw = 2.4 + R() * 2, w = .9 + R() * .8;
        // a lock: wide at the root, an S-wave up through the water, tapering to a point
        const c1 = [p[0] + lean * .2 + sw, p[1] - l * .35], c2 = [p[0] + lean * .7 - sw, p[1] - l * .7], e = [p[0] + lean, p[1] - l];
        hair += `<path d="M${P2([p[0] - w, p[1]])}C${P2([c1[0] - w * .8, c1[1]])} ${P2([c2[0] - w * .4, c2[1]])} ${P2(e)}C${P2([c2[0] + w * .4, c2[1]])} ${P2([c1[0] + w * .8, c1[1]])} ${P2([p[0] + w, p[1]])}Z" fill="#101814" opacity=".82"/>`
          + (i % 3 === 1 ? `<path d="M${P2(p)}C${P2(c1)} ${P2(c2)} ${P2(e)}" stroke="${RIMC}" stroke-width=".25" fill="none" opacity=".5"/>` : ''); } }
    // bubbles from his mouth rising past the contract
    const mouth = hd.Q(.1, .62, 1.0);
    const bub = bubbles(mouth[0] + 2, mouth[1] - 2, 10, 4, 40, 7);

    // ——— assemble: the ladder behind him; his arms and hands over it; the fist's fingers over the rung ———
    let fg = lad + man + armL + hL.back + rung(GRL[1]) + hL.front + hair + hd.svg + armR + hR.back + hR.front + doc + bub;
    // ——— light and water: the shafts over him, the surface's light on his shoulders, motes, the dark below ———
    fg += PK.shafts(u, 100, -20, [[60, 200, 90, 200], [120, 220, 150, 220]], '#c8fff0', .08) + motes(30, 10, 30, 180, 120, '#c8fff0', 6)
      + glow(u, 100, 60, 60, 40, '#c8fff0', .1) + gloom(u, 100, 120, 100, 280, .6, '#010806');
    return [bg, fg];
  } };
