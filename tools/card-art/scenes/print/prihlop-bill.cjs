// «Прихлоп Билл» (Летучий голландец, ПРИКАЗ: возьмите 1 карту и получите 1 Душу), method A — a detailed copy of the
// first-round scene (portrait-dutch.cjs SCENES['Прихлоп Билл']): the old sailor in the Dutchman's dark hold against
// the hull planking, a narrow green shaft from the hatch grating on his face; barnacles grown into his cheek and
// shoulder, the knitted cap, grey stubble, weed hanging from the beams with drops.
// Fixed against the first round: the wall was a flat backdrop and he only stood in front of it — now the hold is 2.5D
// (the hull side behind him, the deck beams overhead, the bulkheads at the sides and the floor all run to one
// vanishing point at his eye level) and he is grown into it, as the brief asks: his left side (our right) is no
// longer a body — the coat turns into the planks, the plank seams bend over his shoulder, a crust of barnacles,
// coral and weed covers the seam; the pike becomes the rope of the brief: his one free arm, one sleeve from the
// shoulder through the elbow to the cuff, is raised and his fist (people.cjs hand3) closes round a rope that runs up
// to a block on the beam and away along the deckhead — he still hauls. The face is a 3/4 head (head34): drowned
// grey-green skin, half-shut eyes, the stubble; the bucket and the chains are left out (one subject).
// Light: the green shaft from the grating upper left (key) on his face, the fist and the rope; the rest in the dark.
// Fix pass after review (verdict-b3): the sleeve grows from the coat's shoulder corner (its root under the coat, the
// armhole seam stitched, no closed shoulder), narrows to the wrist, the cuff as wide as the forearm; the fist a quarter
// smaller, the face's tone, closed round a grip of the rope's radius; the rope thicker, paler, dark-edged, taut on a
// diagonal to the block (moved off the frame post), the tail hanging clear of the post; the merge reaches his far
// cheek, the neck and the middle of his body (plank seams and a wood tint, barnacles along the seam); the neck narrower,
// soft, the chin's shadow on it.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, woodTex } = PK;

// The scene is drawn with the grating, the block and his free arm on the left and mirrored at the end (the type
// medallion covers the top left corner; the raised fist and the block go to the free top right).
const VP = [100, 64];                                 // the vanishing point: his eye level
const WT = 22, WB = 178, WL = 12, WR = 188;           // the hull side behind him (the back wall): top, floor line, sides
// Bill is drawn at 1 in his own units and zoomed ×1.35 about ZO (as if a step nearer), so he fills the space over the glass
const ZOOM = 1.35, ZO = [134.6, 100];
const Z = p => [ZO[0] + (p[0] - ZO[0]) * ZOOM, ZO[1] + (p[1] - ZO[1]) * ZOOM];
const HEAD = { c: [106, 72], r: 12.6 };               // (his units)
const GRIP = [50, 64];                                // where his fist closes round the rope (his units)
const BLOCK = [69, 40];                               // the block under the beam (his units): the rope runs to it diagonally, off the frame post
const ROPE_R = 1.9;                                   // the rope's radius (his units); the fist closes round exactly this
const light = { time: 'night', haze: .3, key: { type: 'moon', x: 80, y: -20, el: 64, color: '#a8f4d4', power: .8 },
  fill: { color: '#16302a', power: .35 }, rim: { az: 330, color: '#9ff0d0', power: .3 } };
const skel = { horizon: VP[1], eye: 1.6, light: 'a narrow green shaft from the hatch grating upper middle-right (key); the hold dark (skel boxes as drawn before the mirror)', items: [
  ['deckhead', 0, WT, 200, WT, 'beams and planks overhead, to the vanishing point'], ['grating', 30, 12, 40, 12, 'deckhead'],
  ['hull side', WL, WB, WR - WL, WB - WT, 'back wall'], ['Bill', 28, 290, 148, 250, 'stands on the floor (feet off the frame), grown into the hull side'],
  ['fist and rope', 12, 74, 30, 30, 'rope from the block'], ['block', 16, 30, 16, 22, 'hangs from the deckhead'], ['floor', -10, 290, 220, 290 - WB, 'floor']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#bccaa8', half: '#7e9076', core: '#667a60', shadow: '#33422f', outline: '#121a10' };   // drowned grey-green
const HAND = { lit: '#94a486', half: '#627258', core: '#506248', shadow: '#2a3628', outline: '#10180e' };   // the face's tone, a step darker
const COAT = { lit: '#4e5e52', half: '#28342c', shadow: '#101814', outline: '#040806' };
const RIMC = '#9ff0d0';
const toVP = (p, y) => { const k = (y - VP[1]) / (p[1] - VP[1]); return [VP[0] + (p[0] - VP[0]) * k, y]; };   // along the line to the VP, to height y
const toVPx = (p, x) => { const k = (x - VP[0]) / (p[0] - VP[0]); return [x, VP[1] + (p[1] - VP[1]) * k]; };

// a hand round a cylinder whose axis must run at t degrees (from na-abordazh.cjs)
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// KIT-CANDIDATE: a barnacle — a cone with a dark mouth and a shadow below-right (from the first round)
const barn = (x, y, r, a = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><ellipse cx="${f(r * .4)}" cy="${f(r * .5)}" rx="${f(r * 1.1)}" ry="${f(r * .6)}" fill="#000" opacity=".45"/>`
  + `<path d="M${f(-r)} ${f(r * .3)}Q${f(-r * .8)} ${f(-r * .5)} ${f(-r * .35)} ${f(-r * .7)}H${f(r * .35)}Q${f(r * .8)} ${f(-r * .5)} ${f(r)} ${f(r * .3)}z" fill="#c8c4b0" stroke="#4a4838" stroke-width=".3"/>`
  + `<path d="M${f(-r * .55)} ${f(r * .2)}L${f(-r * .3)} ${f(-r * .6)}M0 ${f(r * .25)}V${f(-r * .65)}M${f(r * .55)} ${f(r * .2)}L${f(r * .3)} ${f(-r * .6)}" stroke="#7a7660" stroke-width=".3"/>`
  + `<ellipse cy="${f(-r * .66)}" rx="${f(r * .34)}" ry="${f(r * .14)}" fill="#141410"/><path d="M${f(-r * .9)} ${f(r * .1)}Q${f(-r * .7)} ${f(-r * .5)} ${f(-r * .3)} ${f(-r * .66)}" stroke="#f4f0e0" stroke-width=".4" fill="none" opacity=".7"/></g>`;
const cluster = (R, x, y, w, h, n, rmax) => Array.from({ length: n }, () => [x + R() * w, y + R() * h, 1 + R() * rmax]).sort((a, b) => a[1] - b[1]).map(([bx, by, r]) => barn(bx, by, r, (R() - .5) * 30)).join('');
// KIT-CANDIDATE: a branch of red coral from (x, y) growing at angle a (degrees), forked
function coral(x, y, a, len, seed) {
  const R = rng(seed); let s = '';
  const br = (p, ang, l, w, d) => { const q = [p[0] + Math.cos(ang * Math.PI / 180) * l, p[1] + Math.sin(ang * Math.PI / 180) * l], m = [(p[0] + q[0]) / 2 + (R() - .5) * l * .3, (p[1] + q[1]) / 2 + (R() - .5) * l * .3];
    s += `<path d="M${P2(p)}Q${P2(m)} ${P2(q)}" stroke="#5a1a14" stroke-width="${f(w + .5)}" fill="none" stroke-linecap="round"/><path d="M${P2(p)}Q${P2(m)} ${P2(q)}" stroke="#b8483a" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${P2([p[0] - .3, p[1] - .3])}Q${P2([m[0] - .3, m[1] - .3])} ${P2([q[0] - .3, q[1] - .3])}" stroke="#f0907a" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" opacity=".7"/>`;
    if (d > 0) { br(q, ang - 22 - R() * 14, l * .7, w * .7, d - 1); br(q, ang + 20 + R() * 14, l * .66, w * .7, d - 1); } else s += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(w * .6)}" fill="#ffb0a0"/>`; };
  br([x, y], a, len, 1.6, 2); return s;
}
// KIT-CANDIDATE: weed hanging from (x, y), drops below
function weed(x, y, len, n, seed, col = '#2e5a40') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.7 + R() * .8)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${f(x0 + .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#7ac0a0" stroke-width=".3" fill="none" opacity=".5"/>`; }
  return out;
}
// KIT-CANDIDATE: a rope that reads on a dark ground — a dark edge under it, K.rope, a pale lit strand along its top
const ropeX = (u, L, pts, r, seed) => `<path d="${H.sp(pts)}" stroke="#030604" stroke-width="${f(r * 2 + 1)}" fill="none" stroke-linecap="round"/>` + K.rope(u, L, pts, { r, seed })
  + `<g transform="translate(${f(-r * .3)} ${f(-r * .35)})"><path d="${H.sp(pts)}" stroke="#d8ecc8" stroke-width="${f(r * .5)}" fill="none" stroke-linecap="round" opacity=".42"/></g>`;
const drop = (x, y) => `<path d="M${f(x)} ${f(y)}q-.9 1.4 0 2.2q.9 -.8 0 -2.2z" fill="#c8fff0" opacity=".75"/>`;

module.exports = { name: 'Прихлоп Билл', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VP[1], eye: 1.6 });
    // ——— the hold in 2.5D: the hull side (back wall), the deckhead with beams, the bulkheads at the sides, the floor ———
    let bg = `<rect x="-10" y="-10" width="220" height="300" fill="#0a1410"/>`;
    // the hull side: wet strakes, a line of nails at each butt, the frames (ribs) standing on it
    for (let k = 0, y = WT; y < WB; k++, y += 15.6) bg += woodTex(u, WL, y, WR - WL, 15.6, '#24382f', '#14221c', '#060c0a', 15.6, false, 40 + k)
      + `<path d="M${WL} ${f(y + 15.2)}H${WR}" stroke="#030605" stroke-width="1.1"/><path d="M${WL} ${f(y + .8)}H${WR}" stroke="#5a8a78" stroke-width=".45" opacity=".3"/>`
      + PK.nails([[WL + 14 + (k * 37) % 50, y + 4], [WL + 14 + (k * 37) % 50, y + 11.6], [WL + 104 + (k * 23) % 30, y + 4], [WL + 104 + (k * 23) % 30, y + 11.6]], '#0a1210', .7);
    for (const x of [16]) bg += `<rect x="${x}" y="${WT}" width="14" height="${WB - WT}" fill="#18281f"/><rect x="${x}" y="${WT}" width="14" height="${WB - WT}" fill="url(#oakH${u})" opacity=".35"/>`
      + `<path d="M${x + .6} ${WT}V${WB}" stroke="#5a8a78" stroke-width=".6" opacity=".45"/><path d="M${x + 13.4} ${WT}V${WB}" stroke="#020403" stroke-width="1.1"/>`;
    // the deckhead: planks parallel to the wall, getting wider towards us; beams across, running to the VP
    { let ch = `<path d="M-10 -10H210V${WT}H-10Z" fill="#101c17"/>`;
      for (let k = 0, y = WT; y > -10; k++) { const y2 = y - (3.2 + k * 1.8); ch += `<path d="M-10 ${f(y2)}H210" stroke="#030605" stroke-width="${f(.6 + k * .2)}"/><path d="M-10 ${f(y2 + .8)}H210" stroke="#3a5a4c" stroke-width=".4" opacity=".35"/>`; y = y2; }
      // the grating: an open square between two beams, upper left — the sky's green light comes through its bars
      const gC = [98, 14], gD = [62, 14];
      const gid = nid('gr', u);
      ch += `<defs>${linGrad(gid, 0, 0, 0, 14, [[0, '#e8fff4', 1], [1, '#7ad8b0', 1]])}</defs><path d="M${P2(toVP(gD, 2))}L${P2(toVP(gC, 2))}L${P2(gC)}L${P2(gD)}Z" fill="url(#${gid})"/>`;
      for (let i = 0; i <= 7; i++) { const x = lerp(62, 98, i / 7); ch += `<path d="M${P2(toVP([x, 14], 2))}L${P2([x, 14])}" stroke="#0a120e" stroke-width="1.3"/>`; }
      for (const y of [5, 8.5, 11.6]) { const b = toVP([62, 14], y), c = toVP([98, 14], y); ch += `<path d="M${P2(b)}L${P2(c)}" stroke="#0a120e" stroke-width="1.1"/>`; }
      // beams: undersides (trapezoids to the VP) and the side face turned to the centre
      for (const [x0, x1] of [[-12, 4], [46, 60], [100, 114], [156, 170], [204, 216]]) {
        const a = [x0, WT], b = [x1, WT], c = toVP(b, -10), d = toVP(a, -10), side = x1 < VP[0] ? 1 : -1, e = side > 0 ? b : a, eTop = toVP(e, -10), dep = 5;
        ch += `<path d="M${P2(a)}L${P2(b)}L${P2(c)}L${P2(d)}Z" fill="#1c2c24"/><path d="M${P2(a)}L${P2(b)}L${P2(c)}L${P2(d)}Z" fill="url(#oak${u})" opacity=".3"/>`
          + `<path d="M${P2(e)}L${P2([e[0], e[1] - dep])}L${P2(toVP([e[0], e[1] - dep], -10))}L${P2(eTop)}Z" fill="#0a120e"/>`
          + `<path d="M${P2(a)}L${P2(d)}" stroke="${side > 0 ? '#5a8a78' : '#020403'}" stroke-width=".6" opacity=".6"/><path d="M${P2(a)}L${P2(b)}" stroke="#020403" stroke-width=".8"/>`; }
      bg += ch; }
    // the bulkheads at the sides: vertical boards running into depth
    for (const [x0, xw] of [[WL, -12], [WR, 212]]) { let s = `<path d="M${x0} ${WT}L${P2(toVPx([x0, WT], xw))}L${P2(toVPx([x0, WB], xw))}L${x0} ${WB}Z" fill="#0e1813"/>`;
      for (let i = 1; i < 4; i++) { const x = lerp(x0, xw, Math.pow(i / 4, .8)); const t = toVPx([x0, WT], x), b = toVPx([x0, WB], x); s += `<path d="M${P2(t)}L${P2(b)}" stroke="#030605" stroke-width=".9"/><path d="M${f(t[0] + (xw < 0 ? .8 : -.8))} ${f(t[1])}L${f(b[0] + (xw < 0 ? .8 : -.8))} ${f(b[1])}" stroke="#4a7a68" stroke-width=".4" opacity=".3"/>`; }
      bg += s + `<path d="M${x0} ${WT}V${WB}" stroke="#020403" stroke-width="1.2"/>`; }
    // the floor: planks running to the VP, wet, under the glass
    { let fl = `<path d="M-10 ${WB}H210V290H-10Z" fill="#14201a"/>`;
      for (let i = -8; i <= 8; i++) { const x = VP[0] + i * 14, b = toVP([x, WB], 290); fl += `<path d="M${x} ${WB}L${P2(b)}" stroke="#040806" stroke-width="${f(.6 + Math.abs(i) * .05)}"/>`; }
      fl += `<path d="M-10 ${WB}H210" stroke="#020403" stroke-width="1.4"/>`; bg += fl; }
    // weed hanging from the beams and the deckhead, drops falling; barnacle clusters on the wall
    const RB = rng(21);
    bg += weed(107, WT, 20, 3, 4) + weed(160, WT, 16, 2, 5) + weed(40, WT, 18, 2, 6)
      + drop(108, 48) + drop(161, 42) + drop(40.6, 50) + drop(108.6, 58)
      + cluster(RB, 150, 32, 22, 22, 7, 2.6) + cluster(RB, 160, 140, 16, 30, 5, 2.4);
    // the green shaft from the grating: down across him to the floor
    { const fsh = nid('sf', u), gsh = nid('sg', u);
      bg += `<defs><filter id="${fsh}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>${linGrad(gsh, 0, 0, 0, 200, [[0, '#9ff0d0', .32], [.6, '#9ff0d0', .1], [1, '#9ff0d0', 0]])}</defs>`
        + `<path d="M62 6L98 6L160 200L90 200Z" fill="url(#${gsh})" filter="url(#${fsh})" style="mix-blend-mode:screen"/>`; }

    // ——— Bill ———
    let man = '';
    // the coat: his body, the left side (our right) running into the wall — a mask fades it into the planks
    const coat = [[56, 290], [60, 140], [61, 124], [65, 110], [73, 102], [84, 98], [97, 93], [112, 93], [126, 98], [140, 104], [152, 118], [160, 150], [164, 290]];
    const mk = nid('mk', u), mg = nid('mg', u), cg = nid('cg', u);
    man += `<defs>${linGrad(mg, 112, 0, 146, 0, [[0, '#ffffff', 1], [1, '#ffffff', 0]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${mg})"/></mask>`
      + `${linGrad(cg, 60, 90, 150, 120, [[0, COAT.lit, 1], [.35, COAT.half, 1], [1, COAT.shadow, 1]])}</defs>`;
    let body = `<path d="${H.sp(coat)}Z" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".6"/>`;
    // the striped shirt in the V of the coat, the lapels, folds, the shaft's light on the left shoulder
    body += `<path d="M96 94L106 99L114 94L118 130L106 140L94 130Z" fill="#b8b8a4"/><path d="M95 104l20 -1M95 112l21 -1M95 120l22 -1M96 128l20 -1" stroke="#2a3a4a" stroke-width="2.2"/>`
      + `<path d="M96 94L86 134L102 140L106 99ZM114 94L124 134L108 140L106 99Z" fill="#2e3a32" stroke="${COAT.outline}" stroke-width=".5"/>`
      + `<path d="M84 98Q74 100 67 107" stroke="${RIMC}" stroke-width="1" fill="none" opacity=".5"/>`
      // the armhole seam: the coat's edge over the sleeve root runs on as a stitched seam (no closed shoulder)
      + `<path d="M61 124Q62 115 66 109" stroke="#5a7466" stroke-width=".35" fill="none" stroke-dasharray="1 .8" opacity=".7"/><path d="M72 150q4 24 2 50M84 146q8 30 4 60M136 140q-6 30 -2 60" stroke="#040806" stroke-width="1" fill="none" opacity=".7"/>`
      + `<path d="M96 94L86 134" stroke="#7aa898" stroke-width=".6" opacity=".5"/>` + cluster(rng(5), 64, 118, 12, 30, 4, 1.8);
    man += `<g mask="url(#${mk})">${body}</g>`;
    // the crust along the seam where he goes into the wood: barnacles, coral, weed
    let crust = '';
    { const R = rng(31); crust += cluster(R, 116, 96, 14, 30, 9, 2.6) + cluster(R, 124, 128, 14, 40, 8, 2.4) + cluster(R, 132, 104, 18, 10, 5, 2) + coral(130, 96, -60, 7, 3) + coral(126, 134, -20, 6, 4)
      + weed(130, 100, 22, 3, 8, '#2e5a40') + cluster(R, 120, 170, 14, 40, 6, 2.6)
      // the seam now runs down the middle of his body: barnacles along it, on the neck and under the jaw
      + cluster(R, 106, 104, 8, 24, 6, 2.2) + cluster(R, 104, 146, 9, 40, 6, 2.4) + cluster(R, 110, 90, 6, 6, 3, 1.6); }

    // the merge (scene units, over the zoomed figure): the strakes of the wall run on over his shoulder and side, the
    // seams bending over the shoulder's swell; wood grain where the coat has turned to wood
    let merge = '';
    // the region: from his far cheek and temple down the neck and the middle of his body to the floor (his left half)
    { const cid = nid('mc', u), wid = nid('mw', u), fm = nid('mf', u), fg2 = nid('mfg', u), tg = nid('mt', u);
      const reg = [[101, 56], [117, 59], [121, 72], [117, 85], [106, 91], [104, 100], [104, 140], [104, 200], [105, 292]].map(Z).concat([[WR + 4, 292], [WR + 4, 30], [Z([112, 50])[0], 30]]);
      const x0 = Z([100, 0])[0], x1 = Z([109, 0])[0];
      merge += `<defs><clipPath id="${cid}"><path d="${H.sp(reg, true)}"/></clipPath><clipPath id="${wid}"><rect x="${WL}" y="${WT}" width="${WR - WL}" height="${290 - WT}"/></clipPath>`
        + `${linGrad(fg2, x0, 0, x1, 0, [[0, '#ffffff', 0], [1, '#ffffff', 1]])}<mask id="${fm}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${fg2})"/></mask>`
        + `${linGrad(tg, x0, 0, Z([150, 0])[0], 0, [[0, '#24382f', .22], [.5, '#24382f', .42], [1, '#24382f', .6]])}</defs><g clip-path="url(#${wid})"><g clip-path="url(#${cid})"><g mask="url(#${fm})">`
        + `<rect x="${f(x0)}" y="20" width="${f(WR - x0 + 6)}" height="272" fill="url(#${tg})"/>`;
      const bc = Z([140, 110]), fc = Z(HEAD.c);
      for (let k = 0, y = WT; y < 290; k++, y += 15.6) {
        // the seams bow over the shoulder's swell and, a little, round his cheek
        const bow = x => { const dx = (x - bc[0]) / 35, dy = (y - bc[1]) / 54, ex = (x - fc[0]) / 16, ey = (y - fc[1]) / 18; return 8 * Math.exp(-dx * dx - dy * dy) + 3 * Math.exp(-ex * ex - ey * ey); };
        const pts = []; for (let x = x0 - 4; x <= WR + 4; x += 3) pts.push([x, y + 15.2 - bow(x) * (y < bc[1] - 10 ? -.5 : 1)]);
        merge += `<path d="${H.sp(pts)}" stroke="#030605" stroke-width="1.5" fill="none"/><path d="${H.sp(pts.map(p => [p[0], p[1] + 1.4]))}" stroke="#7ab09a" stroke-width=".6" fill="none" opacity=".5"/>`; }
      { const R = rng(9); for (let i = 0; i < 44; i++) { const x = x0 + R() * (WR - x0), y = 46 + R() * 240; merge += `<path d="M${f(x)} ${f(y)}q${f(6 + R() * 6)} ${f((R() - .5) * 2)} ${f(12 + R() * 10)} ${f((R() - .5) * 1.4)}" stroke="#3a5a4c" stroke-width=".45" fill="none" opacity=".5"/>`; } }
      merge += `</g></g></g>`; }

    // ——— the free arm (his right, our left): raised, one sleeve to the cuff; the fist round the rope ———
    // the fist: a quarter smaller than before, the face's tone, the fingers closed round a grip of the rope's own radius,
    // its axis laid along the rope's diagonal to the block
    const HS = 1.9, ropeTop = [BLOCK[0] - .4, BLOCK[1] + 7.2], tAx = Math.atan2(ropeTop[1] - GRIP[1], ropeTop[0] - GRIP[0]) * 180 / Math.PI;
    const hR = handOn(u, { s: HS, m: 1, roll: 24, pitch: 12, pose: 'wrap', r: ROPE_R / HS, tone: HAND, light: [-.4, -.9], sw: .28, tilt: 28, palmW: .8, fingerW: .9, nails: true }, GRIP, tAx, -130);
    // one sleeve from the coat's shoulder corner (its root under the coat, the armhole seam over it) up to the elbow,
    // then up to the wrist, narrowing all the way; the cuff as wide as the forearm
    const SH = [70, 112], EL = [51, 93], W = hR.wrist;
    const sleeve = H.cloth(u, { spine: [SH, [lerp(SH[0], EL[0], .5) - .6, lerp(SH[1], EL[1], .5) + .6], EL, [lerp(EL[0], W[0], .5) - .8, lerp(EL[1], W[1], .5)], W], w: [15.4, 13.2, 11.2, 9.2, 7.6], tone: COAT, lit: 1, rim: RIMC, rimSide: 1, rimOp: .55, seed: 4, drapes: 1, sw: .45, capA: true, roundA: .9,
      cuff: { from: .88, k: 1.0, tone: { lit: '#3e4c42', half: '#202a24', shadow: '#0c120e', outline: '#040806' } } });
    // the rope: taut from the block down the diagonal into his fist and out of it, the slack tail hanging clear of the post
    let v = hR.axis; if (v[1] > 0) v = [-v[0], -v[1]];
    const g = hR.grip, top = [g[0] + v[0] * 6, g[1] + v[1] * 6], bot = [g[0] - v[0] * 6, g[1] - v[1] * 6];
    const ropeUp = ropeX(u, L, [ropeTop, top, g], ROPE_R, 3);
    const ropeDn = ropeX(u, L, [g, bot, [bot[0] - 2.4, bot[1] + 9], [41.4, 104], [42, 150], [40.6, 210], [41.6, 292]], ROPE_R, 4);
    // the block on its strop from an eye bolt in the beam; the hauling part away along the deckhead to the right
    let block = ropeX(u, L, [[BLOCK[0] - 3, BLOCK[1] - 4], [56, 33], [30, 27], [-30, 20]], 1.5, 5)
      + K.shadeCyl(u, BLOCK[0], BLOCK[1] - 10, BLOCK[0], BLOCK[1] - 5, 1.2, L, 'iron', { outline: .3 })
      + `<ellipse cx="${BLOCK[0]}" cy="${BLOCK[1] - 11}" rx="2.2" ry="1.2" fill="none" stroke="url(#iron${u})" stroke-width="1"/>`;
    { const bgd = nid('bk', u), x = BLOCK[0], y = BLOCK[1]; block += `<defs>${linGrad(bgd, x - 6, 0, x + 6, 0, [[0, '#8a9c7a', 1], [.35, '#4e5a3e', 1], [1, '#1a2016', 1]])}</defs>`
      // the shell: an oak oval, the iron strop round it, the slot and the sheave's rim, the pin; the rope over the sheave
      + `<ellipse cx="${x}" cy="${y}" rx="5" ry="7.4" fill="url(#${bgd})" stroke="#040806" stroke-width=".5"/><path d="M${x - 5} ${y - .6}Q${x} ${y + 1.4} ${x + 5} ${y - .6}" stroke="url(#iron${u})" stroke-width="1" fill="none"/>`
      + `<path d="M${x} ${y - 7.4}V${y + 7.4}" stroke="url(#iron${u})" stroke-width="1.2"/><circle cx="${x}" cy="${y - 2.4}" r="1" fill="url(#brass${u})" stroke="#2a1a08" stroke-width=".2"/>`
      + `<path d="M${x - 4} ${y - 4}Q${x - 3} ${y - 6.4} ${x - 1} ${y - 6.8}" stroke="#c8e8d0" stroke-width=".5" fill="none" opacity=".6"/>`; }

    // ——— the head: 3/4 to our left, nodding, half-shut eyes, drowned skin, stubble; the knitted cap ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .3, dir: -1, nod: 8, tone: SKIN, light: [-.55, -.85], warm: { color: '#9ff0d0', op: .22 },
      eye: 'half', look: [-.3, .2], brow: 'frown', mouth: .05, smile: -.25, lips: '#4a5444', iris: '#8ab0a0', hair: { style: 'short', color: '#8a8c84' }, hairColor: '#8a8c84', beard: 'short', noseL: 1.1 });
    // the neck: narrower than the head, soft sides flaring into the collar, the chin's shadow on it
    const nkS = nid('nk', u);
    let face = `<defs>${radGrad(nkS, 107, 86, 7, [[0, '#0a1208', .95], [1, '#0a1208', 0]])}</defs>`
      + `<path d="M103.6 81Q104.6 89 102 95.4L113 95.4Q110.6 89 111 81Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".4"/>`
      + `<ellipse cx="107" cy="86.6" rx="6" ry="4" fill="url(#${nkS})"/><path d="M104 91q3 1.4 6.4 -.2" stroke="${SKIN.shadow}" stroke-width=".5" fill="none" opacity=".5"/>`
      + hd.svg + rimArc(hd, { r: HEAD.r, light: [-.55, -.85], color: '#1a2a24', span: 50, opacity: .5 });
    { const Q = hd.Q, dp = hd.depth;
      // barnacles grown into his left cheek and jaw (our right), the skin round them darker and lumpy
      const soft = (p, rx, ry, col, op) => { const gg = nid('dz', u); return `<defs>${radGrad(gg, p[0], p[1], Math.max(rx, ry), [[0, col, op], [1, col, 0]])}</defs><ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${gg})"/>`; };
      face += soft(Q(.6, .45, .5), 6, 7, '#1a2418', .55);
      for (const [x, y, z, r, a] of [[.72, .3, .5, 2.6, 20], [.6, .62, .52, 2.2, 10], [.8, .0, .4, 1.8, 30], [.46, .82, .58, 2.4, -10], [.74, .66, .3, 1.6, 40], [.9, .4, .1, 2, 30]])
        if (dp(x, y, z) > -.2) { const p = Q(x, y, z); face += barn(p[0], p[1], r, a); }
      // the knitted cap: a dome over the crown, a turned-up ribbed band (built as in gibbs-za-shturvalom.cjs)
      const capPts = []; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; for (const y of [-.5, -.8, -1.05]) { const rr = y === -1.05 ? .58 : y === -.8 ? .94 : 1.02; capPts.push(Q(Math.cos(t) * rr, y, Math.sin(t) * rr * .98 - .08)); } }
      capPts.push(Q(0, -1.32, -.12));
      const hull = P => { const S = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
        for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of S.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const cap = hull(capPts), cgc = nid('cp', u), c0 = Q(0, -.9, 0);
      face += `<defs>${linGrad(cgc, c0[0] - 12, c0[1] - 8, c0[0] + 12, c0[1] + 6, [[0, '#4a6a5a', 1], [.4, '#2a3c34', 1], [1, '#0e1612', 1]])}</defs><path d="M${cap.map(P2).join('L')}Z" fill="url(#${cgc})" stroke="#040806" stroke-width=".45"/>`;
      const ring = (y, rr) => { const a = []; for (let k = 0; k <= 24; k++) { const t = -Math.PI * .5 + k / 24 * Math.PI; a.push([Math.sin(t) * rr, y, Math.cos(t) * rr * .98 - .08]); } return a.filter(p => dp(...p) > -.05).map(p => Q(...p)); };
      const r1 = ring(-.48, 1.05), r2 = ring(-.82, 1.0);
      if (r1.length > 2 && r2.length > 2) {
        face += `<path d="M${r1.map(P2).join('L')}L${r2.slice().reverse().map(P2).join('L')}Z" fill="#33463c" stroke="#040806" stroke-width=".4"/>`;
        for (let k = 1; k < Math.min(r1.length, r2.length) - 1; k++) face += `<path d="M${P2(r1[k])}L${P2(r2[k])}" stroke="#141e18" stroke-width=".35" opacity=".8"/>`;
        face += `<path d="M${r2.map(P2).join('L')}" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".5"/>`; }
      for (let k = 0; k < 10; k++) { const t = -1.2 + k * .26, p = Q(Math.sin(t) * .8, -1.0, Math.cos(t) * .7), q = Q(Math.sin(t) * .55, -1.18, Math.cos(t) * .45); face += `<path d="M${P2(p)}L${P2(q)}" stroke="#0e1612" stroke-width=".3" opacity=".6"/>`; }
      face += `<path d="M${P2(Q(-.98, -.6, .1))}Q${P2(Q(-.9, -1.1, .1))} ${P2(Q(-.3, -1.3, .1))}" stroke="${RIMC}" stroke-width=".7" fill="none" opacity=".6"/>`;
      // barnacles on the cap's right side, a strand of weed off it
      { const p = Q(.86, -.7, .1); face += barn(p[0], p[1], 1.6, 30) + barn(p[0] + 2, p[1] + 3, 1.3, 40); }
      // a drop on the nose tip, the green light on the brow and cheekbone (the shaft)
      { const n = Q(-.02, .3, 1.12); face += drop(n[0] - .4, n[1] + 1) + glow(u, ...Q(-.4, -.3, .8), 8, 6, '#c8fff0', .18); } }

    // ——— assemble: the wall and the merge, the body; the rope, the sleeve and fist; the head ———
    let fig = ropeDn + sleeve + man + face + hR.back + ropeUp + hR.front + block;
    { const k = hR.P(4.6, -.4, .2); fig += glow(u, k[0], k[1], 7, 6, '#bff8e0', .08); }
    // the figure's own crust over the merge (his units, after the merge's planks): barnacles, coral, weed on the seam
    let fg = `<g transform="translate(${ZO[0]} ${ZO[1]}) scale(${ZOOM}) translate(${-ZO[0]} ${-ZO[1]})">${fig}</g>` + merge + `<g transform="translate(${ZO[0]} ${ZO[1]}) scale(${ZOOM}) translate(${-ZO[0]} ${-ZO[1]})">${crust}</g>`;
    // ——— light and air: the shaft's dust, the dark of the hold, the under-glass gloom ———
    { const fsh = nid('sf', u), gsh = nid('sg', u);
      fg += `<defs><filter id="${fsh}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>${linGrad(gsh, 0, 0, 0, 200, [[0, '#9ff0d0', .2], [.5, '#9ff0d0', .08], [1, '#9ff0d0', 0]])}</defs>`
        + `<path d="M62 6L98 6L160 200L90 200Z" fill="url(#${gsh})" filter="url(#${fsh})" style="mix-blend-mode:screen"/>`; }
    fg += motes(26, 40, 10, 90, 150, '#dffff0', 9) + glow(u, 90, 70, 50, 50, '#9ff0d0', .12)
      + gloom(u, 200, 100, 120, 100, .45, '#020604') + gloom(u, 100, 140, 100, 280, .55, '#020604');
    const MIR = s => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
    return [MIR(bg), MIR(fg)];
  } };
