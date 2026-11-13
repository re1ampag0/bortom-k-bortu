// «Вербовка утопленников» (Летучий голландец, РЕМОНТ: восстановите 2 Команды), method A — a detailed copy of the
// first-round scene (portrait-dutch.cjs SCENES['Вербовка утопленников']). The concept stays: under the Dutchman's dark
// hull a rope ladder hangs, grown with weed, and a drowned sailor climbs it, hair and coat floating up; deeper, more
// rise towards it. Now, as the brief asks (card-briefs.md: the drowned rise, the contract is held out to them, they
// climb aboard), the offer is in the picture: from a second port in the hull a sleeve and a hand hold a contract out
// into the sea, its seal glowing; the climber, seen from behind, holds the rung over his head with one fist and
// reaches up for the contract with the other open hand, his face turned up to it. Below him, in the dark, the other
// drowned come up out of the deep — hands and arms reaching up through the murk.
// Fixed against the first round: the man was a flat silhouette with sticks for arms and no hands — now a whole figure
// (head 3/4 from behind looking up, a neck of a third of the head, two arms each one sleeve from the shoulder through
// the elbow to the cuff, people.cjs hand3 hands with slim palms — the fist round the rung, the rung through the grip,
// legs to bare feet on a lower rung); the ladder hangs from the port with its own weight and weed; the light is the
// surface's, from above: shafts past the hull, a rim on his shoulders, hair and hands.
// Correction pass after review (verdict-b4): the left hand really grips the rung (back of the hand to us, the
// knuckles on top, the fingers curling over and away behind the rung, the thumb under it); the figure is no longer a
// marionette — a back with deltoids and a waist, turned 15–20° after the reaching arm, that shoulder raised, the arms
// shorter (elbows at chest level): the left bent on the ladder, the right reaching with a slight bend; the head +20%
// on a short neck turned with it, shaded; the contract is held out from a second port by a sleeve and a hand (no face),
// bigger and below the hull's edge, the climber's fingers just short of its seal; the far drowned are three different
// readable figures (one on a second ladder, one rising with an arm up, a small one deeper) instead of five V-shapes.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HULL = 26;                                     // the hull's bottom at the middle (the keel line curves up to the sides)
const LAD = { x1: 64, x2: 124, top: 22, step: 13.4, y0: 44 };   // the ladder: side ropes, its top at the port, the first rung under the fist
const HEAD = { c: [103, 83], r: 12.5 };
const SHL = [86, 107], ELL = [66, 125], GRL = [73, LAD.y0 + LAD.step * 3]; // his left arm (our left): shoulder, elbow out at chest level, the grip on the rung at his brow
const SHR = [117, 102], ELR = [131, 84], WRR = [145, 67];         // his right arm (our right), reaching, the shoulder raised: shoulder, elbow, wrist
const DOC = { x: 159, y: 29 };                                    // the contract: the middle of its top roller, held out from the second port
const PORT2 = { x1: 170, x2: 187, y1: 9, y2: 20 };                // the second port, where the hand comes out
const light = { time: 'day', haze: .5, key: { type: 'sun', x: 150, y: -40, el: 70, color: '#c8fff0', power: .6 }, fill: { color: '#0e3a32', power: .5 },
  rim: { az: 180, color: '#c8fff0', power: .4 }, locals: [{ x: DOC.x, y: DOC.y + 8, color: '#ffd890', power: .35, radius: 18 }] };
const skel = { horizon: 0, eye: 0, light: 'under water: the light from the surface above, in shafts past the hull; a rim on everything from above; the seal of the contract glows warm', items: [
  ['hull bottom', 0, HULL + 4, 200, HULL + 4, 'the ship over us, the surface at its sides'], ['port', 86, 22, 22, 10, 'hull'], ['ladder', LAD.x1 - 2, 230, LAD.x2 - LAD.x1 + 4, 208, 'hangs from the port'],
  ['contract', DOC.x - 8, DOC.y + 22, 16, 22, 'held out from the second port by a sleeve and a hand'], ['climber', 60, 210, 90, 190, 'feet on a lower rung, fist on the rung over his head'],
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
    // the drowned below, further off in the murk: three different figures, each with a head and hands — one climbing
    // a second ladder on the left, one rising with an arm up on the right, a small one deeper
    { const fb = nid('db', u), C = '#082a24', RC = '#5aa898';
      // a hand at the end of an arm (local units, head radius 1): palm, thumb, three finger strokes, along direction a
      const fh = (x, y, a, open) => { const c = Math.cos(a), sn = Math.sin(a), P = (px, py) => P2([x + px * c - py * sn, y + px * sn + py * c]);
        return `<path d="M${P(-.2, -.45)}L${P(.9, -.5)}L${P(1, .45)}L${P(-.2, .45)}Z" fill="${C}"/>` + `<path d="M${P(.1, -.45)}L${P(.7, open ? -1.3 : -.9)}" stroke="${C}" stroke-width=".32" stroke-linecap="round"/>`
          + `<path d="M${P(.9, -.32)}L${P(open ? 2.1 : 1.5, -.5)}M${P(.95, 0)}L${P(open ? 2.25 : 1.6, 0)}M${P(.9, .3)}L${P(open ? 2 : 1.4, .5)}" stroke="${C}" stroke-width=".26" stroke-linecap="round"/>`; };
      const limb = (pts, w0, w1) => `<path d="M${pts.map(P2).join('L')}" stroke="${C}" stroke-width="${w0}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + (w1 ? `<path d="M${pts.slice(1).map(P2).join('L')}" stroke="${C}" stroke-width="${w1}" fill="none" stroke-linecap="round"/>` : '');
      const body = (lean = 0) => `<ellipse cx="${lean * .3}" cy="0" rx=".88" ry="1.02" fill="${C}"/><path d="M-.32 .8L-.4 1.5H.4L.32 .8Z" fill="${C}"/>`
        + `<path d="M-1.8 1.9Q-2 1.4 -1.2 1.4H1.2Q2 1.4 1.8 1.9L1.3 4.6Q1.2 5.4 1.4 6.4H-1.4Q-1.2 5.4 -1.3 4.6Z" fill="${C}"/>`
        + `<path d="M-1.6 1.5Q0 1.1 1.6 1.5" stroke="${RC}" stroke-width=".22" fill="none" opacity=".7"/><path d="M-.7 -.8Q${lean * .3} -1.15 .7 -.8" stroke="${RC}" stroke-width=".22" fill="none" opacity=".8"/>`;
      let deep = `<defs><filter id="${fb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".45"/></filter></defs>`;
      // the second ladder, hanging from the hull further left, and a drowned man on it from behind
      { let l2 = ''; const lx = [14, 38]; for (const x of lx) l2 += `<path d="M${x} ${HULL - 8}Q${x + 1.4} 80 ${x - .6} 160" stroke="#3a5a44" stroke-width=".9" fill="none" opacity=".7"/>`;
        for (let y = 34; y < 150; y += 9) l2 += `<path d="M${lx[0]} ${y}H${lx[1]}" stroke="#2e4434" stroke-width="1.1" opacity=".7"/>`;
        deep += `<g opacity=".75">${l2}</g>`;
        const x = 26, y = 80, sc = 4.2, M = `translate(${x} ${y}) scale(${sc})`;
        deep += `<g filter="url(#${fb})" opacity=".92"><g transform="${M}">${body(-.4)}`
          + limb([[-1.5, 1.8], [-2.4, .2], [-2.1, -1.4]], .62) + fh(-2.1, -1.4, -Math.PI / 2 - .1, false)      // left hand on the rung over his head
          + limb([[1.5, 1.8], [2.5, 3.2], [2.4, 1.4]], .62) + fh(2.4, 1.4, -Math.PI / 2 + .2, false)           // right hand on a lower rung, elbow out
          + limb([[-.8, 6.2], [-1.9, 8.2], [-1.2, 10.4]], .8) + limb([[.8, 6.2], [1, 9.4], [1.1, 12.6]], .8)
          + `</g></g>`; }
      // one rising, his face turned up, an arm stretched up with the hand open, the other trailing
      { const x = 176, y = 92, sc = 4, M = `translate(${x} ${y}) rotate(6) scale(${sc})`;
        deep += `<g filter="url(#${fb})" opacity=".88"><g transform="${M}">${body(.6)}`
          + limb([[-1.5, 1.8], [-1.9, -.6], [-2.1, -3.2]], .6) + fh(-2.1, -3.2, -Math.PI / 2 - .12, true)
          + limb([[1.5, 1.8], [2.1, 4.2], [2.3, 6.4]], .6) + fh(2.3, 6.4, Math.PI / 2 - .1, false)
          + limb([[-.7, 6.2], [-.9, 9.4], [-.4, 12.4]], .8) + limb([[.7, 6.2], [1.2, 9.2], [1.6, 12]], .8)
          + `</g></g>` + bubbles(171, 84, 6, 4, 26, 4); }
      // a small one deeper, rising head up, both arms lifting
      { const x = 146, y = 128, sc = 2.6, M = `translate(${x} ${y}) rotate(-4) scale(${sc})`;
        deep += `<g filter="url(#${fb})" opacity=".6"><g transform="${M}">${body(0)}`
          + limb([[-1.5, 1.8], [-2.6, .4], [-2.8, -1.6]], .6) + fh(-2.8, -1.6, -Math.PI / 2 - .25, true)
          + limb([[1.5, 1.8], [2.6, .6], [2.9, -1.4]], .6) + fh(2.9, -1.4, -Math.PI / 2 + .25, true)
          + limb([[-.7, 6.2], [-.8, 9.6]], .8) + limb([[.7, 6.2], [.9, 9.6]], .8) + `</g></g>`; }
      bg += deep + bubbles(30, 66, 6, 5, 26, 3); }

    // ——— the hull overhead: her bottom as a dark curve, planks, barnacles, weed; the open entry port ———
    { const hg = nid('hl', u), d = `M-10 -10H210V${HULL - 14}Q160 ${HULL + 2} 100 ${HULL + 4}Q40 ${HULL + 2} -10 ${HULL - 14}Z`;
      bg += `<defs>${linGrad(hg, 0, -10, 0, HULL + 4, [[0, '#0c1814', 1], [.75, '#14241e', 1], [1, '#24382f', 1]])}</defs><path d="${d}" fill="url(#${hg})"/>`;
      for (let k = 1; k < 6; k++) bg += `<path d="M-10 ${HULL - 14 - k * 3}Q${100} ${HULL + 4 - k * 4.4} 210 ${HULL - 14 - k * 3}" stroke="#040a08" stroke-width=".7" fill="none" opacity=".8"/>`;
      bg += `<path d="M-10 ${HULL - 14}Q40 ${HULL + 2} 100 ${HULL + 4}Q160 ${HULL + 2} 210 ${HULL - 14}" stroke="#8ad8c0" stroke-width=".8" fill="none" opacity=".55"/>`;
      const R = rng(9); for (let i = 0; i < 18; i++) { const x = 6 + i * 11 + R() * 4, y = HULL + 3 - Math.pow((x - 100) / 100, 2) * 18 - R() * 3; bg += barn(x, y, 1.2 + R() * 1.1, 180 + (R() - .5) * 30); }
      bg += weedDown(30, HULL - 4, 22, 3, 2) + weedDown(152, HULL, 26, 4, 6) + weedDown(182, HULL - 8, 18, 3, 8);
      // the port: a dark square opening in the hull, its lid hanging down, the ladder's ropes coming out of it
      bg += `<path d="M86 ${HULL - 4}H110V${HULL + 3.6}H86Z" fill="#020605"/><path d="M86 ${HULL + 3.6}H110" stroke="#4a8a78" stroke-width=".6" opacity=".7"/>`
        + `<path d="M110 ${HULL + 3}L118 ${HULL + 14}L120 ${HULL + 12}L112 ${HULL + 1}Z" fill="#1a2a24" stroke="#040a08" stroke-width=".4"/>` + glow(u, 98, HULL + 1, 14, 6, '#9effd0', .25);
      // the second port, further aft: a dark opening at the hull's edge, its lid swung up, a green glow inside
      { const { x1, x2, y1, y2 } = PORT2; bg += `<path d="M${x1} ${y1}H${x2}L${x2 - .6} ${y2}H${x1 + .8}Z" fill="#020605"/><path d="M${x1 + .8} ${y2}H${x2 - .6}" stroke="#4a8a78" stroke-width=".6" opacity=".7"/>`
        + `<path d="M${x1} ${y1}L${x1 - 7} ${y1 - 5}L${x1 - 6} ${y1 - 7}L${x1 + 1} ${y1 - 2}Z" fill="#1a2a24" stroke="#040a08" stroke-width=".4"/>` + glow(u, (x1 + x2) / 2, y2 - 2, 12, 6, '#9effd0', .3); } }

    // ——— the ladder: two ropes from the port, rungs of wood, weed and a barnacle or two; it hangs on down out of sight ———
    let lad = '';
    const sideX = (x0, y) => x0 + Math.sin(y / 40) * 1.4;
    const rope = (x0, xs) => K.rope(u, L, [[xs, LAD.top + 4], [sideX(x0, 40), 40], [sideX(x0, 100), 100], [sideX(x0, 180), 180], [sideX(x0, 290), 290]], { r: 1.1, seed: x0 });
    lad += rope(LAD.x1, 90) + rope(LAD.x2, 106);
    const rung = y => { const a = sideX(LAD.x1, y), b = sideX(LAD.x2, y); return K.shadeCyl(u, a, y, b, y, 1.5, L, 'oak', { outline: .3 }) + `<path d="M${f(a + 1)} ${f(y - 1.2)}H${f(b - 1)}" stroke="${RIMC}" stroke-width=".35" opacity=".6"/>`; };
    const rungs = []; for (let y = LAD.y0; y < 290; y += LAD.step) rungs.push(y);
    for (const y of rungs) lad += rung(y);
    lad += weedUp(LAD.x1 + 2, 140, 18, 2, 3) + weedUp(LAD.x2 - 2, 98, 14, 2, 5) + barn(LAD.x2 - 4, LAD.y0 + LAD.step * 2 + 1, 1.3) + barn(LAD.x1 + 6, LAD.y0 + LAD.step * 4 + 1, 1.1);

    // ——— the contract: a scroll held out from the second port by a sleeve and a hand (no face, only the arm) ———
    let doc = '';
    { const pg = nid('pg', u), x = DOC.x, y = DOC.y, w = 8.4, hgt = 19;
      doc += `<defs>${linGrad(pg, x - w, 0, x + w, 0, [[0, '#c8c0a0', 1], [.5, '#ece4c8', 1], [1, '#9a9278', 1]])}</defs>`
        + `<path d="M${x - w} ${y + 1}L${x - w + .4} ${y + hgt}Q${x} ${y + hgt + 1.6} ${x + w + .4} ${y + hgt - .4}L${x + w} ${y + 1}Z" fill="url(#${pg})" stroke="#4a4430" stroke-width=".4"/>`
        + [5, 7.6, 10.2, 12.8].map(dy => `<path d="M${x - w + 2.4} ${y + dy}q${f(w - 2.4)} -.6 ${f(2 * w - 4.8)} 0" stroke="#5a5040" stroke-width=".4" fill="none" opacity=".75"/>`).join('')
        + `<path d="M${x - w + 2.4} ${y + 15.2}q4 .8 7 -.4" stroke="#5a5040" stroke-width=".4" fill="none" opacity=".75"/>`
        // the bottom curl, the wax seal on its ribbon hanging under it
        + `<path d="M${x - w + .4} ${y + hgt}q-1.4 1.6 .2 2.8q${f(w)} 1.2 ${f(2 * w)} -.4q1.4 -1.4 -.2 -2.8" fill="#d8d0b4" stroke="#4a4430" stroke-width=".35"/>`
        + `<path d="M${x + 2} ${y + hgt + 1.8}l-1.2 4.6M${x + 2} ${y + hgt + 1.8}l1.6 4.2" stroke="#8a1c14" stroke-width=".8"/>`
        + `<circle cx="${x + 2}" cy="${y + hgt + 2}" r="2.3" fill="#a8241a" stroke="#4a0c08" stroke-width=".3"/><circle cx="${x + 1.5}" cy="${y + hgt + 1.5}" r=".7" fill="#ff8a6a"/>`
        // the top roller, its knobs
        + K.shadeCyl(u, x - w - 1.6, y, x + w + 1.6, y, 1.3, L, 'oak', { outline: .3 }) + `<circle cx="${x - w - 2}" cy="${y}" r="1.4" fill="#3a2a16" stroke="#0a0604" stroke-width=".3"/><circle cx="${x + w + 2}" cy="${y}" r="1.4" fill="#3a2a16" stroke="#0a0604" stroke-width=".3"/>`
        + glow(u, x + 2, y + hgt + 2, 10, 10, '#ffd890', .45) + glow(u, x, y + 10, 16, 16, '#e8fff0', .2); }
    // the arm from the port: a dark old sleeve with a wide frayed cuff, barnacled; a long pale hand round the roller
    const GIV = { lit: '#9aa898', half: '#5e6c5c', core: '#4e5c4c', shadow: '#24302a', outline: '#0a100c' };
    const hG = handOn(u, { s: 2.1, m: 1, roll: 0, pitch: 0, pose: 'wrap', r: .75, tone: GIV, light: [.1, -1], sw: .3, tilt: 0, palmW: .8, fingerW: .9, nails: true }, [DOC.x + 3, DOC.y], 0, 115);
    const armG = H.cloth(u, { spine: [[(PORT2.x1 + PORT2.x2) / 2 + 1, PORT2.y2 - 4], [lerp((PORT2.x1 + PORT2.x2) / 2, hG.wrist[0], .5) + 1.4, lerp(PORT2.y2 - 4, hG.wrist[1], .5)], hG.wrist], w: [9.4, 8.4, 6.8],
      tone: { lit: '#4a3a2e', half: '#2a2018', shadow: '#0e0a06', outline: '#030202' }, lit: 1, rim: RIMC, rimSide: -1, rimOp: .5, seed: 9, drapes: 0, sw: .4,
      cuff: { from: .62, k: 1.3, tone: { lit: '#6a5a40', half: '#3a2e1e', shadow: '#140e08', outline: '#040302' } } })
      + barn(PORT2.x1 + 9, PORT2.y2 + 1, 1.2, 20) + weedDown(PORT2.x1 + 6, PORT2.y2 + 2, 10, 2, 12, '#2e6a4a');

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
    // the coat from behind, the body turned 15–20° after the reaching arm: the right shoulder raised, the spine seam off
    // to the right, the deltoids round, the back narrowing to the waist at the belt, the tails floating out below
    { const cg = nid('cg', u), back = [[77, 116], [78, 108], [84, 103], [94, 101], [104, 100], [113, 97], [121, 96], [127, 100], [127, 108], [123, 120], [118, 132], [116, 141], [118, 154], [126, 166], [134, 172], [124, 175], [114, 163], [104, 167], [94, 163], [84, 176], [74, 172], [82, 158], [87, 146], [86, 138], [82, 126]];
      man += `<defs>${linGrad(cg, 84, 96, 122, 170, [[0, COAT.lit, 1], [.4, COAT.half, 1], [1, COAT.shadow, 1]])}</defs><path d="${H.sp(back, true)}" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".55"/>`
        // the spine seam (turned: right of the middle), the shoulder blades under the cloth, the drag folds to the raised arm
        + `<path d="M108 99Q106 120 104 140Q103 152 104 166" stroke="#040a08" stroke-width=".8" fill="none"/>`
        + `<path d="M88 110q6 6 8 16M120 108q-6 4 -9 14M96 104q8 4 14 2M113 101q4 4 10 4M88 150q6 -4 10 4M112 150q-4 -2 -8 6" stroke="#040a08" stroke-width=".6" fill="none" opacity=".7"/>`
        + `<path d="M90 126q6 3 12 0M92 133q5 2 10 0" stroke="#040a08" stroke-width=".45" fill="none" opacity=".55"/>`
        + `<path d="M79 106Q90 99 104 100Q116 97 126 97" stroke="${RIMC}" stroke-width=".9" fill="none" opacity=".6"/><path d="M78 116q2 12 8 22M82 146q-2 14 -8 26M120 146q4 14 14 24" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".45"/>`
        + `<path d="M85 140Q101 142 117 139" stroke="#2a1a10" stroke-width="3" fill="none" opacity=".85"/><rect x="101" y="138.6" width="5" height="4" fill="none" stroke="#8a7a4a" stroke-width=".6"/>`
        + barn(90, 106, 1.5, 10) + barn(93, 109, 1.1) + barn(116, 103, 1.3, -10) + weedUp(122, 104, 10, 1, 7); }
    // the neck: short (a third of the head), turned up and right with the head, its shadow side to the left and under the jaw
    { const ng = nid('ng', u);
      man += `<defs>${linGrad(ng, 96, 0, 112, 0, [[0, SKIN.shadow, 1], [.45, SKIN.half, 1], [1, SKIN.lit, 1]])}</defs>`
        + `<path d="M96.6 101.6Q96 95 99 89.6L107 90Q110.6 92.6 111 95Q110 98 110.6 100.2Q104 102.6 96.6 101.6Z" fill="url(#${ng})" stroke="${SKIN.outline}" stroke-width=".35"/>`
        + `<path d="M99.4 91Q104 94.4 110.4 93.8" stroke="${SKIN.shadow}" stroke-width="2.2" fill="none" opacity=".5"/>`
        // the hair at the nape, over the back of the neck
        + `<path d="M96.4 86Q96 91 97.8 94.6Q98.6 91.6 99.4 94Q100 90.4 101.4 92.4Q101.4 88.6 100 86Z" fill="#141c18"/>`
        + `<path d="M99 100Q100.4 95 104.6 91.4" stroke="${SKIN.shadow}" stroke-width=".7" fill="none" opacity=".6"/><path d="M110 92q.8 3.6 .4 6.6" stroke="${RIMC}" stroke-width=".5" fill="none" opacity=".5"/>`
        + `<path d="M94 101.4Q103 98 112 99.4L112.4 102Q103 100.4 94 104Z" fill="#3e4840" stroke="#0a100c" stroke-width=".3"/><path d="M95 101.6Q103 98.6 111.6 99.8" stroke="${RIMC}" stroke-width=".35" fill="none" opacity=".5"/>`; }

    // the left arm (our left): one sleeve from the shoulder through the elbow out to the side, the fist round the rung
    // (back of the hand to us, the knuckles on top of the rung, the fingers over it and away behind; the thumb under it)
    const hL = handOn(u, { s: 2.4, m: -1, roll: 25, pitch: 0, pose: 'wrap', r: .75, tone: SKIN, light: [.1, -1], sw: .3, tilt: 4, palmW: .8, fingerW: .9, nails: true }, GRL, 0, -88);
    const sleeve = (sh, el, wr, sd, rs) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5)], el, [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5)], wr],
      w: [12.4, 11, 9.8, 8.8, 7.8], tone: COAT, lit: rs, rim: RIMC, rimSide: rs, rimOp: .65, seed: sd, drapes: 0, foldW: .7, sw: .4, capA: true, roundA: .9,
      cuff: { from: .86, k: 1.12, tone: { lit: '#5a6a5a', half: '#2a362e', shadow: '#0c1410', outline: '#030806' } } });
    const armL = sleeve(SHL, ELL, hL.wrist, 4, -1);
    // the right arm (our right): up past the ladder's rope to the contract, the open hand reaching, fingers just short of its seal
    const hR = H.hand3(u, { at: WRR, a: -64, s: 2.1, m: 1, roll: -10, pose: 'open', spread: 7, tone: SKIN, light: [.1, -1], sw: .3, palmW: .8, fingerW: .9, nails: true });
    const armR = sleeve(SHR, ELR, WRR, 6, 1);
    // the head: 3/4 from behind, turned up to the contract; the hair floating up off it in locks
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .8, dir: 1, nod: -22, tone: SKIN, light: [.1, -1], warm: { color: '#c8fff0', op: .25 }, eye: 'half', look: [.4, -.8], brow: 'calm', mouth: .25,
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
    let fg = lad + man + armL + hL.back + rung(GRL[1]) + hL.front + hair + hd.svg + armR + hR.back + hR.front + doc + armG + hG.back + hG.front + bub;
    // ——— light and water: the shafts over him, the surface's light on his shoulders, motes, the dark below ———
    fg += PK.shafts(u, 100, -20, [[60, 200, 90, 200], [120, 220, 150, 220]], '#c8fff0', .08) + motes(30, 10, 30, 180, 120, '#c8fff0', 6)
      + glow(u, 100, 60, 60, 40, '#c8fff0', .1) + gloom(u, 100, 120, 100, 280, .6, '#010806');
    return [bg, fg];
  } };
