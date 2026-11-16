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
// Fix pass after the print review: the man grown into the planking with a barnacle-covered face read as a film
// character, and at card size the picture was dark. Now he is simply an old sailor of the Dutchman standing in front
// of the hull side — the coat whole (no planks over him, no fade into the wall), sea-worn (a patch, a few barnacles on
// the shoulders and the cap, a strand of weed), the face clean and lit. The card's action: his raised fist holds up a
// glass vial with a glowing soul in it (the Soul he gives); the vial's green light is a second key on his face and
// hand. The rope and the block are gone (one subject); the shaft and the face light are brighter.
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
const HEAD = { c: [106, 75.5], r: 12.6 };               // (his units)
const GRIP = [50, 66];                                // where his fist closes round the vial (his units)
const VIAL_R = 2.9;                                   // the vial's body radius (his units); the fist closes round exactly this
const VIAL_A = -86;                                   // the vial's axis (deg, up)
const light = { time: 'night', haze: .3, key: { type: 'moon', x: 80, y: -20, el: 64, color: '#b8f8dc', power: .95 },
  fill: { color: '#1e3a32', power: .45 }, rim: { az: 330, color: '#9ff0d0', power: .3 } };
const skel = { horizon: VP[1], eye: 1.6, light: 'a narrow green shaft from the hatch grating upper middle-right (key); the hold dark (skel boxes as drawn before the mirror)', items: [
  ['deckhead', 0, WT, 200, WT, 'beams and planks overhead, to the vanishing point'], ['grating', 30, 12, 40, 12, 'deckhead'],
  ['hull side', WL, WB, WR - WL, WB - WT, 'back wall'], ['Bill', 28, 290, 148, 250, 'stands on the floor (feet off the frame), in front of the hull side'],
  ['fist and vial', 8, 70, 30, 44, 'held up in his fist'], ['floor', -10, 290, 220, 290 - WB, 'floor']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#e2e0c4', half: '#aaa88a', core: '#8e8e72', shadow: '#4c5240', outline: '#1a1c12' };   // an old sailor's pale, sea-cold skin
const HAND = { lit: '#d0ceb2', half: '#989878', core: '#7e8066', shadow: '#40463a', outline: '#16180e' };   // the face's tone, a step darker
const COAT = { lit: '#667868', half: '#36463c', shadow: '#141c18', outline: '#040806' };
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
// KIT-CANDIDATE: weed hanging from (x, y), drops below
function weed(x, y, len, n, seed, col = '#2e5a40') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.7 + R() * .8)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${f(x0 + .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#7ac0a0" stroke-width=".3" fill="none" opacity=".5"/>`; }
  return out;
}
module.exports = { name: 'Прихлоп Билл', kind: 'deck', status: 'accepted', cam: { x: 0, y: 0, w: 200 }, light, skel,
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
    // weed hanging from the beams and the deckhead; barnacle clusters on the wall
    const RB = rng(21);
    bg += weed(107, WT, 20, 3, 4) + weed(160, WT, 16, 2, 5) + weed(40, WT, 18, 2, 6)
      + cluster(RB, 150, 32, 22, 22, 7, 2.6) + cluster(RB, 160, 140, 16, 30, 5, 2.4);
    // the green shaft from the grating: down across him to the floor (brighter: the key on his face and shoulders)
    { const fsh = nid('sf', u), gsh = nid('sg', u);
      bg += `<defs><filter id="${fsh}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>${linGrad(gsh, 0, 0, 0, 200, [[0, '#9ff0d0', .46], [.6, '#9ff0d0', .16], [1, '#9ff0d0', 0]])}</defs>`
        + `<path d="M62 6L98 6L160 200L90 200Z" fill="url(#${gsh})" filter="url(#${fsh})" style="mix-blend-mode:screen"/>`; }

    // ——— Bill: an old sailor of the Dutchman, standing in front of the hull side (not grown into it) ———
    let man = '';
    // the coat: his body, whole; the far arm hangs at his side inside the coat's outline
    const coat = [[56, 290], [60, 140], [61, 124], [65, 110], [73, 102], [84, 98], [97, 93], [112, 93], [124, 97], [134, 103], [141, 113], [145, 132], [148, 290]];
    const cg = nid('cg', u);
    man += `<defs>${linGrad(cg, 60, 90, 150, 120, [[0, COAT.lit, 1], [.35, COAT.half, 1], [1, COAT.shadow, 1]])}</defs>`;
    let body = `<path d="${H.sp(coat)}Z" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".6"/>`;
    // the striped shirt in the V of the coat, the lapels, folds, the shaft's light on the left shoulder
    body += `<path d="M96 94L106 99L114 94L118 130L106 140L94 130Z" fill="#c8c8b2"/><path d="M95 104l20 -1M95 112l21 -1M95 120l22 -1M96 128l20 -1" stroke="#2a3a4a" stroke-width="2.2"/>`
      + `<path d="M96 94L86 134L102 140L106 99ZM114 94L124 134L108 140L106 99Z" fill="#34423a" stroke="${COAT.outline}" stroke-width=".5"/>`
      + `<path d="M84 98Q74 100 67 107" stroke="${RIMC}" stroke-width="1" fill="none" opacity=".6"/>`
      // the armhole seam: the coat's edge over the sleeve root runs on as a stitched seam (no closed shoulder)
      + `<path d="M61 124Q62 115 66 109" stroke="#5a7466" stroke-width=".35" fill="none" stroke-dasharray="1 .8" opacity=".7"/><path d="M72 150q4 24 2 50M84 146q8 30 4 60M136 140q-6 30 -2 60" stroke="#040806" stroke-width="1" fill="none" opacity=".7"/>`
      + `<path d="M96 94L86 134" stroke="#7aa898" stroke-width=".6" opacity=".5"/>`
      // the far arm hanging inside the coat: the sleeve's seam from the shoulder down, a fold at the elbow
      + `<path d="M137 108Q133 140 135 176M135 150q4 3 8 1" stroke="#040806" stroke-width=".9" fill="none" opacity=".75"/>`
      // sea-worn: a patch on the far chest with coarse stitches, a frayed lapel edge
      + `<path d="M120 110L130 112L129 123L119 122Z" fill="#4a4436" stroke="#0a0a06" stroke-width=".4"/><path d="M120.6 110.8L129.2 112.6L128.4 122.2L119.6 121.2Z" fill="none" stroke="#a89c78" stroke-width=".35" stroke-dasharray=".9 .9" opacity=".8"/>`
      + `<path d="M117 128l1.4 2.4M118.6 133l1.6 2M120 137l1.2 2.2" stroke="#1a221c" stroke-width=".45" opacity=".8"/>`
      // a few barnacles on the shoulders (the flavour: overgrown with shells, still serving), a strand of weed
      + cluster(rng(5), 64, 118, 10, 16, 3, 1.5) + cluster(rng(6), 128, 99, 8, 5, 3, 1.3) + weed(138, 106, 14, 1, 12, '#2e5a40');
    man += body;

    // ——— the free arm (his right, our left): raised, one sleeve to the cuff; the fist round the soul vial ———
    // the fist: the face's tone, the fingers closed round the vial's body, its axis upright
    const HS = 1.9;
    const hR = handOn(u, { s: HS, m: 1, roll: 24, pitch: 12, pose: 'wrap', r: VIAL_R / HS, tone: HAND, light: [-.4, -.9], sw: .28, tilt: 28, palmW: .8, fingerW: .9, nails: true }, GRIP, VIAL_A, -130);
    // one sleeve from the coat's shoulder corner (its root under the coat, the armhole seam over it) up to the elbow,
    // then up to the wrist, narrowing all the way; the cuff as wide as the forearm
    const SH = [70, 112], EL = [51, 93], W = hR.wrist;
    const sleeve = H.cloth(u, { spine: [SH, [lerp(SH[0], EL[0], .5) - .6, lerp(SH[1], EL[1], .5) + .6], EL, [lerp(EL[0], W[0], .5) - .8, lerp(EL[1], W[1], .5)], W], w: [15.4, 13.2, 11.2, 9.2, 7.6], tone: COAT, lit: 1, rim: RIMC, rimSide: 1, rimOp: .55, seed: 4, drapes: 1, sw: .45, capA: true, roundA: .9,
      cuff: { from: .88, k: 1.0, tone: { lit: '#4e5e52', half: '#28342c', shadow: '#0c120e', outline: '#040806' } } });
    // the vial: a glass phial upright in his fist — a long body, a sloping shoulder, the neck, a cork; the glowing soul
    // inside (bright green-white liquid with a pale wisp curling in it), the glass edge dark, a highlight on the lit side
    let v = hR.axis; if (v[1] > 0) v = [-v[0], -v[1]];
    const g = hR.grip, nv = [-v[1], v[0]], R = VIAL_R, kl = 1.3, at = (t, o) => [g[0] + v[0] * t * kl + nv[0] * o, g[1] + v[1] * t * kl + nv[1] * o];
    let vial = '', vglow = '';
    { const out = `M${P2(at(-7, -R))}Q${P2(at(-9.6, -R))} ${P2(at(-9.6, 0))}Q${P2(at(-9.6, R))} ${P2(at(-7, R))}L${P2(at(6, R))}C${P2(at(8, R))} ${P2(at(8.4, R * .44))} ${P2(at(9.6, R * .44))}L${P2(at(12.4, R * .44))}`
        + `L${P2(at(12.4, -R * .44))}L${P2(at(9.6, -R * .44))}C${P2(at(8.4, -R * .44))} ${P2(at(8, -R))} ${P2(at(6, -R))}Z`;
      const cid = nid('vc', u), gg = nid('vg', u), lq = nid('vl', u), c = at(-2, 0);
      vial += `<defs><clipPath id="${cid}"><path d="${out}"/></clipPath>${linGrad(gg, ...at(0, -R), ...at(0, R), [[0, '#e8fff6', .55], [.18, '#3a8a72', .12], [.7, '#1e5a4a', .1], [1, '#06201a', .7]])}`
        + `${radGrad(lq, c[0], c[1], R * 4.2, [[0, '#ffffff', 1], [.35, '#b8ffe6', 1], [.75, '#4ee0b0', 1], [1, '#1a9a78', 1]])}</defs>`
        + `<path d="${out}" fill="#0a2a22"/>`
        + `<g clip-path="url(#${cid})"><path d="M${P2(at(-11, -R - 1))}L${P2(at(4.4, -R - 1))}L${P2(at(4.4, R + 1))}L${P2(at(-11, R + 1))}Z" fill="url(#${lq})"/>`
        // the liquid's surface, the wisp of the soul curling up in it
        + `<path d="M${P2(at(4.4, -R))}L${P2(at(4.4, R))}" stroke="#e8fff6" stroke-width=".5" opacity=".9"/>`
        + `<path d="M${P2(at(-6.4, .5))}C${P2(at(-4, -1.4))} ${P2(at(-2.4, 1.3))} ${P2(at(0, -.2))}S${P2(at(2.8, -1))} ${P2(at(3.6, .6))}" stroke="#ffffff" stroke-width=".55" fill="none" stroke-linecap="round" opacity=".85"/>`
        + `<path d="${out}" fill="url(#${gg})"/></g>`
        + `<path d="${out}" fill="none" stroke="#03120c" stroke-width=".5"/>`
        // the highlight down the lit side, a glint on the shoulder
        + `<path d="M${P2(at(-6.6, -R * .6))}L${P2(at(5.2, -R * .6))}" stroke="#ffffff" stroke-width=".5" stroke-linecap="round" opacity=".6"/><path d="M${P2(at(7.2, -R * .62))}l${f(v[0] * .8)} ${f(v[1] * .8)}" stroke="#ffffff" stroke-width=".45" stroke-linecap="round" opacity=".7"/>`
        // the lip ring and the cork
        + `<path d="M${P2(at(12.1, -R * .58))}L${P2(at(12.1, R * .58))}L${P2(at(13, R * .58))}L${P2(at(13, -R * .58))}Z" fill="#2a6a58" stroke="#03120c" stroke-width=".35"/>`
        + `<path d="M${P2(at(13, -R * .46))}L${P2(at(13, R * .46))}L${P2(at(15.4, R * .4))}L${P2(at(15.4, -R * .4))}Z" fill="#8a6a42" stroke="#1a1006" stroke-width=".35"/><path d="M${P2(at(13.4, -R * .3))}L${P2(at(15, -R * .26))}" stroke="#d8b888" stroke-width=".4" opacity=".7"/>`;
      // its light: on the fist, the sleeve's cuff and his face (screen, over them)
      vglow += glow(u, ...at(-1, 0), 28, 28, '#9effd0', .42) + glow(u, ...at(-2, 0), 8, 12, '#f0fff8', .55); }

    // ——— the head: 3/4 to our left, turned to the vial he holds up, open weary eyes, stubble; the knitted cap ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .3, dir: -1, nod: 2, tone: SKIN, light: [-.55, -.85], warm: { color: '#bff8e0', op: .3 },
      eye: 'open', look: [-.7, -.35], brow: 'calm', mouth: .05, smile: .1, lips: '#7a6a58', iris: '#6a8a80', hair: { style: 'short', color: '#a8aaa2' }, hairColor: '#a8aaa2', beard: 'short', noseL: 1.1 });
    // the neck: narrower than the head, soft sides flaring into the collar, the chin's shadow on it
    const nkS = nid('nk', u);
    let face = `<defs>${radGrad(nkS, 107, 88.6, 6, [[0, '#1a2016', .8], [1, '#1a2016', 0]])}</defs>`
      + `<path d="M103.4 84Q104.4 90.6 102 95.4L113 95.4Q110.8 90.6 111.2 84Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".4"/>`
      + `<ellipse cx="107" cy="88.8" rx="5.6" ry="3.2" fill="url(#${nkS})"/><path d="M104 92.4q3 1.2 6.4 -.2" stroke="${SKIN.shadow}" stroke-width=".5" fill="none" opacity=".5"/>`
      + hd.svg + rimArc(hd, { r: HEAD.r, light: [-.55, -.85], color: '#1a2a24', span: 50, opacity: .4 });
    { const Q = hd.Q, dp = hd.depth;
      // the knitted cap: a dome over the crown, a turned-up ribbed band (built as in gibbs-za-shturvalom.cjs)
      const capPts = []; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; for (const y of [-.5, -.8, -1.05]) { const rr = y === -1.05 ? .58 : y === -.8 ? .94 : 1.02; capPts.push(Q(Math.cos(t) * rr, y, Math.sin(t) * rr * .98 - .08)); } }
      capPts.push(Q(0, -1.32, -.12));
      const hull = P => { const S = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
        for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of S.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const cap = hull(capPts), cgc = nid('cp', u), c0 = Q(0, -.9, 0);
      face += `<defs>${linGrad(cgc, c0[0] - 12, c0[1] - 8, c0[0] + 12, c0[1] + 6, [[0, '#6a5444', 1], [.4, '#46362a', 1], [1, '#1a120c', 1]])}</defs><path d="M${cap.map(P2).join('L')}Z" fill="url(#${cgc})" stroke="#040806" stroke-width=".45"/>`;
      const ring = (y, rr) => { const a = []; for (let k = 0; k <= 24; k++) { const t = -Math.PI * .5 + k / 24 * Math.PI; a.push([Math.sin(t) * rr, y, Math.cos(t) * rr * .98 - .08]); } return a.filter(p => dp(...p) > -.05).map(p => Q(...p)); };
      const r1 = ring(-.48, 1.05), r2 = ring(-.82, 1.0);
      if (r1.length > 2 && r2.length > 2) {
        face += `<path d="M${r1.map(P2).join('L')}L${r2.slice().reverse().map(P2).join('L')}Z" fill="#584436" stroke="#040806" stroke-width=".4"/>`;
        for (let k = 1; k < Math.min(r1.length, r2.length) - 1; k++) face += `<path d="M${P2(r1[k])}L${P2(r2[k])}" stroke="#20160e" stroke-width=".35" opacity=".8"/>`;
        face += `<path d="M${r2.map(P2).join('L')}" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".5"/>`; }
      for (let k = 0; k < 10; k++) { const t = -1.2 + k * .26, p = Q(Math.sin(t) * .8, -1.0, Math.cos(t) * .7), q = Q(Math.sin(t) * .55, -1.18, Math.cos(t) * .45); face += `<path d="M${P2(p)}L${P2(q)}" stroke="#1a120c" stroke-width=".3" opacity=".6"/>`; }
      face += `<path d="M${P2(Q(-.98, -.6, .1))}Q${P2(Q(-.9, -1.1, .1))} ${P2(Q(-.3, -1.3, .1))}" stroke="${RIMC}" stroke-width=".7" fill="none" opacity=".6"/>`;
      // two small barnacles on the cap's far side (not on the face)
      { const p = Q(.86, -.7, .1); face += barn(p[0], p[1], 1.3, 30) + barn(p[0] + 1.6, p[1] + 2.4, 1, 40); }
      // the green light on the brow and the near cheek (the shaft and the vial)
      face += glow(u, ...Q(-.4, -.3, .8), 10, 8, '#e0fff0', .26) + glow(u, ...Q(-.7, .3, .6), 8, 8, '#bff8e0', .22); }

    // ——— assemble: the wall, the sleeve, the body, the head; the fist round the vial; the vial's light ———
    let fig = sleeve + man + face + hR.back + vial + hR.front + vglow;
    let fg = `<g transform="translate(${ZO[0]} ${ZO[1]}) scale(${ZOOM}) translate(${-ZO[0]} ${-ZO[1]})">${fig}</g>`;
    // ——— light and air: the shaft's dust, the dark of the hold, the under-glass gloom ———
    { const fsh = nid('sf', u), gsh = nid('sg', u);
      fg += `<defs><filter id="${fsh}" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>${linGrad(gsh, 0, 0, 0, 200, [[0, '#9ff0d0', .24], [.5, '#9ff0d0', .1], [1, '#9ff0d0', 0]])}</defs>`
        + `<path d="M62 6L98 6L160 200L90 200Z" fill="url(#${gsh})" filter="url(#${fsh})" style="mix-blend-mode:screen"/>`; }
    fg += motes(26, 40, 10, 90, 150, '#dffff0', 9) + glow(u, 90, 70, 50, 50, '#9ff0d0', .16)
      + gloom(u, 200, 100, 120, 100, .3, '#020604') + gloom(u, 100, 140, 100, 280, .5, '#020604');
    const MIR = s => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
    return [MIR(bg), MIR(fg)];
  } };
