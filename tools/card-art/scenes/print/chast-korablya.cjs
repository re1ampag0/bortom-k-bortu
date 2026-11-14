// «Часть корабля — часть команды» (Летучий голландец, ПРИКАЗ: получите 2 Души и восстановите 1 Команду), method A —
// a detailed copy of the first-round scene (portrait-dutch.cjs SCENES['Часть корабля — часть команды']). The concept
// stays: a sailor's calm face in the planks of the ghost ship's bulwark, the grain flowing over brow and cheek, two
// pale souls sinking into the wood on either side. Now it is the man himself, caught in the middle of it (brief,
// card-briefs.md: the process of growing in, unlike «Прихлоп Билл» who grew in long ago): a young sailor stands with
// his back to the inside of the bulwark, his right arm (our left) spread along the planking; a plank has wrapped his
// forearm, coral grows over the wrist and his finger tips are already under the strake above; the far half of his face
// (our right) is wood — the grain runs across the cheek, the lid is carved shut, a plank seam crosses his jaw — and
// his right shoulder goes into the planks. Round him the bulwark is whole and tight, the seams pulled in towards him;
// out at the right edge the old planks are still split, the fog showing through.
// Fixed against the first round: the face was a flat egg pasted on a wall, with no body and the ropes hanging from
// nowhere — now a whole figure (head, neck, shoulders, one sleeve from the shoulder through the elbow to the cuff, a
// people.cjs hand3 with a slim palm) lit by one light: the moon in the fog upper left, over the rail.
// Correction pass after review (verdict-b4): the hand ×1.6 (near the face's size), a right hand seen from the back
// with a real thumb set out from the ball of the palm (same tone), longer fingers whose tips turn to wood (the brown
// of the wooden half of the face, grain along the fingers; the splinter strokes over them gone); the ring-plank on the
// forearm replaced by two planks lying along it, their grain running on into the sleeve and the skin, one coral out
// of the seam; the forearm thicker, tapering from the shoulder to the wrist, the elbow's crook with folds; the coat
// given volume (the arm's shadow, folds at the chest and shoulder, buttons, the left soul's green on it) and its
// right edge turned to planking by the grain instead of a dark fill; the strake seam moved off the chin onto the
// wooden cheek, thinner.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, woodTex } = PK;

const RAIL = 30, WB = 262;                            // the rail's underside (the wall's top) and the deck line (off the picture)
const SY = 13.4;                                      // a strake's height
const HEAD = { c: [110, 60], r: 16 };
const SH = [80, 100], EL = [52, 136], WR = [44, 96];  // his right arm (our left): shoulder, elbow down at his side, wrist raised
const light = { time: 'fog', haze: .6, key: { type: 'moon', x: 30, y: -30, el: 50, color: '#cfeee0', power: .7 }, fill: { color: '#1e3a32', power: .4 },
  rim: { az: 300, color: '#bff0dc', power: .3 }, locals: [{ x: 166, y: 62, color: '#9effd0', power: .4, radius: 26 }, { x: 52, y: 122, color: '#9effd0', power: .4, radius: 26 }] };
const skel = { horizon: HEAD.c[1], eye: 1.6, light: 'the moon in the fog upper left, over the rail (key): lit on the left, shadows down-right; the two souls glow green on the planks', items: [
  ['fog over the rail', 0, 0, 200, RAIL - 6, 'sky'], ['rail', 0, RAIL, 200, 8, 'bulwark top'], ['bulwark planking', 0, WB, 200, WB - RAIL, 'wall, on the deck (off the picture)'],
  ['sailor', 62, 290, 100, 250, 'stands on the deck (feet off the frame), back to the wall, half grown into it'], ['arm and hand', 26, 140, 60, 76, 'forearm up, the hand flat on the planking'],
  ['soul R', 160, 80, 20, 24, 'sinking into the planks'], ['soul L', 8, 124, 20, 24, 'sinking into the planks'], ['split planks', 168, 100, 32, 60, 'the wall, right edge']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#c8cfae', half: '#8c9a7e', core: '#728468', shadow: '#3a4a36', outline: '#121a10' };   // pale, sea-cold
const WOOD = { lit: '#b0905e', half: '#76583a', core: '#5e442a', shadow: '#2e2014', outline: '#0e0a04' };     // the face gone to wood
const COAT = { lit: '#4a5a52', half: '#26322c', shadow: '#0e1612', outline: '#040806' };
const RIMC = '#bff0dc';
// KIT-CANDIDATE: a barnacle (as in prihlop-bill.cjs)
const barn = (x, y, r, a = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><ellipse cx="${f(r * .4)}" cy="${f(r * .5)}" rx="${f(r * 1.1)}" ry="${f(r * .6)}" fill="#000" opacity=".45"/>`
  + `<path d="M${f(-r)} ${f(r * .3)}Q${f(-r * .8)} ${f(-r * .5)} ${f(-r * .35)} ${f(-r * .7)}H${f(r * .35)}Q${f(r * .8)} ${f(-r * .5)} ${f(r)} ${f(r * .3)}z" fill="#c8c4b0" stroke="#4a4838" stroke-width=".3"/>`
  + `<path d="M${f(-r * .55)} ${f(r * .2)}L${f(-r * .3)} ${f(-r * .6)}M0 ${f(r * .25)}V${f(-r * .65)}M${f(r * .55)} ${f(r * .2)}L${f(r * .3)} ${f(-r * .6)}" stroke="#7a7660" stroke-width=".3"/>`
  + `<ellipse cy="${f(-r * .66)}" rx="${f(r * .34)}" ry="${f(r * .14)}" fill="#141410"/><path d="M${f(-r * .9)} ${f(r * .1)}Q${f(-r * .7)} ${f(-r * .5)} ${f(-r * .3)} ${f(-r * .66)}" stroke="#f4f0e0" stroke-width=".4" fill="none" opacity=".7"/></g>`;
const cluster = (R, x, y, w, h, n, rmax) => Array.from({ length: n }, () => [x + R() * w, y + R() * h, 1 + R() * rmax]).sort((a, b) => a[1] - b[1]).map(([bx, by, r]) => barn(bx, by, r, (R() - .5) * 30)).join('');
// KIT-CANDIDATE: a branch of red coral from (x, y) at angle a (degrees), forked (as in prihlop-bill.cjs)
function coral(x, y, a, len, seed, w0 = 1.6) {
  const R = rng(seed); let s = '';
  const br = (p, ang, l, w, d) => { const q = [p[0] + Math.cos(ang * Math.PI / 180) * l, p[1] + Math.sin(ang * Math.PI / 180) * l], m = [(p[0] + q[0]) / 2 + (R() - .5) * l * .3, (p[1] + q[1]) / 2 + (R() - .5) * l * .3];
    s += `<path d="M${P2(p)}Q${P2(m)} ${P2(q)}" stroke="#5a1a14" stroke-width="${f(w + .5)}" fill="none" stroke-linecap="round"/><path d="M${P2(p)}Q${P2(m)} ${P2(q)}" stroke="#b8483a" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${P2([p[0] - .3, p[1] - .3])}Q${P2([m[0] - .3, m[1] - .3])} ${P2([q[0] - .3, q[1] - .3])}" stroke="#f0907a" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" opacity=".7"/>`;
    if (d > 0) { br(q, ang - 22 - R() * 14, l * .7, w * .7, d - 1); br(q, ang + 20 + R() * 14, l * .66, w * .7, d - 1); } else s += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(w * .6)}" fill="#ffb0a0"/>`; };
  br([x, y], a, len, w0, 2); return s;
}
function weed(x, y, len, n, seed, col = '#2e5a40') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.7 + R() * .8)}" fill="none" stroke-linecap="round"/>`
      + `<path d="M${f(x0 + .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#7ac0a0" stroke-width=".3" fill="none" opacity=".5"/>`; }
  return out;
}
// a soul sinking into the planks: a pale light, its tail out towards us and up, rings spreading on the wood round it
function sinkingSoul(u, x, y, r) {
  const g = nid('ss', u), t = nid('st', u);
  let s = `<defs>${radGrad(g, x, y, r * 5, [[0, '#e8fff4', .7], [.25, '#9effd0', .35], [1, '#4ae0a8', 0]])}${linGrad(t, x, y, x - r * 2, y - r * 7, [[0, '#d8fff0', .75], [1, '#9effd0', 0]])}</defs>`;
  for (const k of [1.8, 2.8, 3.9]) s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * k)}" ry="${f(r * k * .8)}" fill="none" stroke="#bff8e0" stroke-width=".45" opacity="${f(.7 - k * .13)}"/>`;
  s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 5)}" fill="url(#${g})" style="mix-blend-mode:screen"/>`
    + `<path d="M${f(x - r * .9)} ${f(y)}Q${f(x - r * 2.6)} ${f(y - r * 3.6)} ${f(x - r * 2)} ${f(y - r * 7.4)}Q${f(x - r * .6)} ${f(y - r * 3.4)} ${f(x + r * .9)} ${f(y - r * .2)}Z" fill="url(#${t})" style="mix-blend-mode:screen"/>`
    + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#f4fff8" opacity=".9"/>`;
  return s;
}

module.exports = { name: 'Часть корабля — часть команды', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HEAD.c[1], eye: 1.6 });
    // ——— over the rail: the green fog at night, the moon's glow upper left ———
    let bg = `<defs>${linGrad(nid('fs', u), 0, 0, 0, RAIL, [[0, '#0e1e1a', 1], [1, '#3a5a50', 1]])}</defs>`;
    { const id = nid('fk', u); bg += `<defs>${linGrad(id, 0, -4, 0, RAIL + 2, [[0, '#0c1a16', 1], [.7, '#2e4c44', 1], [1, '#4a6c60', 1]])}</defs><rect x="-10" y="-10" width="220" height="${RAIL + 12}" fill="url(#${id})"/>`; }
    bg += glow(u, 40, 0, 90, 40, '#d8fff0', .35) + K.fog(u, L, { y: 4, h: 26, density: .5, seed: 3 });
    // ——— the bulwark from the inside: strakes, the rail on top, a frame at each side ———
    let wall = '';
    for (let k = 0, y = RAIL + 8; y < WB; k++, y += SY) wall += woodTex(u, -10, y, 220, SY, '#3a4434', '#1e261c', '#0a0e08', SY, false, 60 + k)
      + `<path d="M-10 ${f(y + SY - .4)}H210" stroke="#030504" stroke-width="1"/><path d="M-10 ${f(y + .7)}H210" stroke="#8ab0a0" stroke-width=".45" opacity=".3"/>`
      + PK.nails([[6 + (k * 41) % 30, y + 3.6], [6 + (k * 41) % 30, y + 9.8], [150 + (k * 29) % 26, y + 3.6], [150 + (k * 29) % 26, y + 9.8]], '#0a0e0a', .6);
    // the rail: its underside in shade, the lit front edge, barnacles and weed along it
    { const rg = nid('rl', u); wall += `<defs>${linGrad(rg, 0, RAIL, 0, RAIL + 8, [[0, '#6a7a64', 1], [.35, '#3e4a3a', 1], [1, '#121810', 1]])}</defs>`
      + `<rect x="-10" y="${RAIL}" width="220" height="8" fill="url(#${rg})"/><path d="M-10 ${RAIL + .4}H210" stroke="#d8fff0" stroke-width=".7" opacity=".55"/><path d="M-10 ${RAIL + 8}H210" stroke="#020403" stroke-width="1.2"/>`
      + `<rect x="-10" y="${RAIL - 3}" width="220" height="3" fill="#1a2018"/><path d="M-10 ${RAIL - 3}H210" stroke="#a8c8b8" stroke-width=".5" opacity=".5"/>`
      + weed(22, RAIL + 8, 14, 3, 2) + weed(132, RAIL + 8, 18, 3, 4) + weed(184, RAIL + 8, 12, 2, 6) + cluster(rng(3), 60, RAIL + 2, 30, 4, 5, 1.6) + cluster(rng(4), 168, RAIL + 2, 26, 4, 4, 1.4); }
    // the frames (top timbers) at both edges, darker, with their shadow on the planks
    for (const x of [-4, 192]) wall += `<rect x="${x}" y="${RAIL + 8}" width="12" height="${WB - RAIL}" fill="#1a2018"/><rect x="${x}" y="${RAIL + 8}" width="12" height="${WB - RAIL}" fill="url(#oakH${u})" opacity=".3"/>`
      + `<path d="M${x + .6} ${RAIL + 8}V${WB}" stroke="#8ab0a0" stroke-width=".6" opacity=".4"/><rect x="${x + 12}" y="${RAIL + 8}" width="4" height="${WB - RAIL}" fill="#000" opacity=".3"/>`;
    // out at the right edge the old wall is still broken: a split strake with the fog showing through, a sprung end
    { const y = RAIL + 8 + SY * 4, gap = [[174, y + 5.4], [178, y + 4.6], [183, y + 5.6], [188, y + 4.2], [194, y + 5], [194, y + 8.4], [188, y + 9.2], [183, y + 8], [178, y + 9], [174, y + 7.4]];
      wall += `<path d="M${gap.map(P2).join('L')}Z" fill="#6a8a7e"/><path d="M${gap.slice(0, 5).map(P2).join('L')}" stroke="#020403" stroke-width=".6" fill="none"/><path d="M${gap.slice(5).map(P2).join('L')}" stroke="#a8c8b8" stroke-width=".4" fill="none" opacity=".7"/>`;
      const y2 = RAIL + 8 + SY * 7; wall += `<path d="M180 ${y2 + 4}L194 ${y2 + 3.4}L194 ${y2 + 7}L184 ${y2 + 6.6}Z" fill="#4a6a5e"/><path d="M181 ${y2 + 4.2}l-6 -3.4l3.4 5z" fill="#3a4434" stroke="#0a0e08" stroke-width=".3"/>`; }
    // round him the planks are drawn in tight: their seams bend in towards him (the wall made strong), new treenails
    { const cid = nid('pc', u), c = [112, 116];
      let pull = `<defs><clipPath id="${cid}"><rect x="60" y="${RAIL + 8}" width="120" height="${WB - RAIL}"/></clipPath></defs><g clip-path="url(#${cid})">`;
      for (let y = RAIL + 8 + SY; y < WB; y += SY) { const pts = []; for (let x = 60; x <= 180; x += 4) { const dx = (x - c[0]) / 40, dy = (y - c[1]) / 70, b = 4.4 * Math.exp(-dx * dx - dy * dy); pts.push([x, y - .4 + b * Math.sign(c[1] - y)]); }
        pull += `<path d="${H.sp(pts)}" stroke="#030504" stroke-width="1.2" fill="none"/>`; }
      wall += pull + '</g>' + [[156, 52], [160, 66], [158, 80], [62, 52], [60, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#4a4a30" stroke="#0a0c06" stroke-width=".3"/><circle cx="${x - .3}" cy="${y - .3}" r=".4" fill="#a8a880"/>`).join(''); }

    // ——— the man ———
    let man = '';
    // the coat: shoulders against the wall, the body down out of the picture; his left side (our right) fades into the planks
    const coat = [[62, 290], [64, 160], [66, 118], [72, 104], [86, 96], [100, 92], [120, 92], [138, 96], [152, 106], [160, 124], [164, 160], [168, 290]];
    const mk = nid('mk', u), mg = nid('mg', u), cg = nid('cg', u);
    man += `<defs>${linGrad(mg, 134, 0, 166, 0, [[0, '#ffffff', 1], [1, '#ffffff', 0]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${mg})"/></mask>`
      + `${linGrad(cg, 62, 96, 166, 140, [[0, COAT.lit, 1], [.35, COAT.half, 1], [1, COAT.shadow, 1]])}</defs>`;
    let body = `<path d="${H.sp(coat)}Z" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".6"/>`;
    // the open shirt under the coat, the lapels, folds, a sash low down
    body += `<path d="M100 92L110 104L122 92L127 148L110 158L96 148Z" fill="#a4aa96"/><path d="M103 103q7 7 14 0" stroke="#5a6050" stroke-width=".7" fill="none"/><path d="M110 112v40" stroke="#6a7060" stroke-width=".5" opacity=".6"/>`
      + `<path d="M100 92L91 144L106 152L110 104ZM122 92L131 144L116 152L110 104Z" fill="#26322c" stroke="${COAT.outline}" stroke-width=".5"/>`
      + `<path d="M100 92L91 144" stroke="#7aa898" stroke-width=".7" opacity=".55"/><path d="M80 160q4 30 2 60M94 156q6 36 4 70M140 150q-4 40 -2 70" stroke="#040806" stroke-width="1" fill="none" opacity=".7"/>`;
    // volume: the arm's shadow falling down-right on the chest, folds at the shoulder and the chest, buttons, the left
    // soul's green on the near flank
    { const cc = nid('cc', u), sb = nid('sb', u);
      body += `<defs><clipPath id="${cc}"><path d="${H.sp(coat)}Z"/></clipPath><filter id="${sb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter></defs><g clip-path="url(#${cc})">`
        + `<path d="M${P2([SH[0] + 6, SH[1] + 2])}L${P2([EL[0] + 9, EL[1] - 2])}L${P2([EL[0] + 18, EL[1] + 8])}L${P2([SH[0] + 16, SH[1] + 8])}Z" fill="#000" opacity=".55" filter="url(#${sb})"/>`
        + `<path d="M84 104q6 6 8 16M86 99q8 3 12 9M74 118q8 4 14 2M78 130q6 2 11 0M134 104q-5 8 -6 18M140 112q-4 6 -4 14" stroke="#040806" stroke-width=".8" fill="none" opacity=".7"/>`
        + `<path d="M84.6 103.4q6 6 8 16M86.4 98.4q8 3 12 9M74.4 117.2q8 4 14 2" stroke="#7aa898" stroke-width=".45" fill="none" opacity=".4"/>`
        + [[92.6, 118], [91.6, 128], [90.6, 138], [127.4, 118], [128.4, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.25" fill="#5a5434" stroke="#0a0a04" stroke-width=".3"/><circle cx="${x - .35}" cy="${y - .35}" r=".45" fill="#d8d0a0" opacity=".8"/>`).join('')
        + glow(u, 66, 132, 16, 22, '#9effd0', .16)
        + '</g>'; }
    // the right side of the coat turns to planking: the wall's own grain and seams run in over the cloth, thicker rightwards
    { const wg = nid('cw', u), wk = nid('cwm', u), cc2 = nid('cc2', u); let gr = '';
      for (let y = 92; y < 240; y += 1.7) gr += `<path d="M124 ${f(y)}Q146 ${f(y + Math.sin(y) * .8)} 170 ${f(y + .3)}" stroke="${Math.round(y * 3) % 3 ? '#1e261c' : '#0a0e08'}" stroke-width="${Math.round(y * 3) % 3 ? .3 : .55}" fill="none"/>`;
      for (let y = RAIL + 8 + SY * 5; y < 240; y += SY) gr += `<path d="M124 ${f(y - .4)}H170" stroke="#030504" stroke-width="1"/><path d="M124 ${f(y + .7)}H170" stroke="#8ab0a0" stroke-width=".45" opacity=".3"/>`;
      body += `<defs><clipPath id="${cc2}"><path d="${H.sp(coat)}Z"/></clipPath>${linGrad(wg, 128, 0, 160, 0, [[0, '#fff', 0], [.5, '#fff', .55], [1, '#fff', 1]])}<mask id="${wk}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${wg})"/></mask></defs>`
        + `<g clip-path="url(#${cc2})"><g mask="url(#${wk})"><rect x="120" y="88" width="52" height="200" fill="#3a4434"/>${gr}</g></g>`; }
    man += `<g mask="url(#${mk})">${body}</g>`;
    // the neck: about a third of the head, into the open collar
    man += `<path d="M101 74L102 96Q110 101 119 95L119 74Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".4"/><path d="M102.6 82q2 7 1 13" stroke="${SKIN.lit}" stroke-width=".9" fill="none" opacity=".5"/><path d="M112 88q4 3 7 0" stroke="${SKIN.shadow}" stroke-width=".7" fill="none" opacity=".7"/>`;

    // ——— the arm: one sleeve from the shoulder down to the elbow at his side, the forearm up along the planks to the
    // cuff; the open hand flat on the wood beside his head, back to us, the finger tips already sunk into the strake ———
    // his right hand, back to us, fingers up: the thumb on our left, set out from the ball of the palm in the wall's plane
    const HOPT = { at: WR, a: -97, s: 4.3, m: 1, roll: 0, pose: 'open', spread: 6, light: [-.5, -.86], sw: .42, palmW: .8, fingerW: .95,
      flex: [[3, 5, 3], [3, 5, 3], [4, 6, 3], [5, 7, 4]], thumbJ: [[.9, -1.2, -.35], [2.3, -2.2, -.15], [3.8, -2.9, -.05], [5.0, -3.25, 0]] };
    const hand = H.hand3(u, { ...HOPT, tone: SKIN, nails: true }), handW = H.hand3(u, { ...HOPT, tone: WOOD, nails: false, knuckles: false });
    const sleeve = H.cloth(u, { spine: [SH, [lerp(SH[0], EL[0], .5) - 1.4, lerp(SH[1], EL[1], .5)], EL, [lerp(EL[0], WR[0], .5) - 1.6, lerp(EL[1], WR[1], .5)], WR], w: [18, 16.6, 15.4, 14, 12.6], tone: COAT, lit: 1, rim: RIMC, rimSide: 1, rimOp: .55, seed: 5, drapes: 1, sw: .45, capA: true, roundA: .9,
      cuff: { from: .86, k: 1.1, tone: { lit: '#4a5a50', half: '#24302a', shadow: '#0c120e', outline: '#040806' } } });
    // the elbow's crook: folds of the sleeve gathered on the inside of the bend, a light on the outer edge
    let wrap = '';
    { const c = [EL[0] + 1.6, EL[1] - 7];
      wrap += `<path d="M${P2(c)}q-4 2 -7.4 1.2M${P2([c[0] + 1, c[1] + 2.4])}q-3 2.6 -7 2.6M${P2([c[0] + 2.4, c[1] - 2])}q-2.6 .4 -5 -.8M${P2([c[0] + 3, c[1] + 4.6])}q-1.6 2 -4.4 2.6" stroke="#040806" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".85"/>`
        + `<path d="M${P2([c[0] - .4, c[1] + .9])}q-3.6 1.8 -6.6 1.2M${P2([c[0] + .6, c[1] + 3.3])}q-2.8 2.2 -6 2.4" stroke="#6a8a7e" stroke-width=".4" fill="none" opacity=".45"/>`
        + `<path d="M${P2([EL[0] - 7.4, EL[1] - 6])}Q${P2([EL[0] - 8.4, EL[1] + 2])} ${P2([EL[0] - 4, EL[1] + 8])}" stroke="${RIMC}" stroke-width=".7" fill="none" opacity=".35"/>`; }
    // two planks of the wall grown along the forearm (not round it): lying on the sleeve, their grain runs out past
    // their ends onto the cloth and the skin of the wrist; one coral from the seam between plank and sleeve
    { const d = [(WR[0] - EL[0]), (WR[1] - EL[1])], dl = Math.hypot(d[0], d[1]), ux = d[0] / dl, uy = d[1] / dl, nx = -uy, ny = ux;
      const pt = (t, o) => [EL[0] + d[0] * t + nx * o, EL[1] + d[1] * t + ny * o];
      for (const [t0, t1, o, w, sd] of [[.14, .86, -.8, 5.6, 1], [.3, .72, 3.8, 3, 2]]) {
        const pg = nid('fp', u), fm = nid('fm', u), fg2 = nid('fg', u), a0 = pt(t0, o), a1 = pt(t1, o);
        const poly = [pt(t0 + .02, o - w / 2), pt(t1 - .03, o - w / 2 + .2), pt(t1, o), pt(t1 - .02, o + w / 2), pt(t0, o + w / 2 - .3), pt(t0 - .02, o)];
        let g = `<path d="${H.sp(poly)}Z" fill="url(#${pg})"/>`;
        for (let k = 0; k < (w > 5 ? 5 : 3); k++) { const oo = o - w / 2 + (k + .5) * w / (w > 5 ? 5 : 3), R = rng(sd * 10 + k), wv = (R() - .5) * .8;
          g += `<path d="M${P2(pt(t0 - .1, oo + wv))}Q${P2(pt((t0 + t1) / 2, oo - wv))} ${P2(pt(t1 + .1, oo + wv * .5))}" stroke="${k % 2 ? '#2a1c0e' : '#120a04'}" stroke-width="${k % 2 ? .3 : .45}" fill="none" opacity=".8"/>`; }
        g += `<path d="M${P2(poly[0])}L${P2(poly[1])}" stroke="#c8d8b8" stroke-width=".5" opacity=".55"/><path d="M${P2(poly[3])}L${P2(poly[4])}" stroke="#030504" stroke-width=".7" opacity=".8"/>`
          + `<circle cx="${f(pt((t0 + t1) / 2, o)[0])}" cy="${f(pt((t0 + t1) / 2, o)[1])}" r=".7" fill="#0a0c06"/>`;
        wrap += `<defs>${linGrad(pg, ...pt(.5, o - w / 2), ...pt(.5, o + w / 2), [[0, '#8a7454', 1], [.35, '#6a5232', 1], [1, '#3a2a16', 1]])}`
          + `${linGrad(fg2, ...a0, ...a1, [[0, '#fff', 0], [.18, '#fff', 1], [.82, '#fff', 1], [1, '#fff', 0]])}<mask id="${fm}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${fg2})"/></mask></defs>`
          + `<path d="M${P2(pt(t0 + .06, o + w / 2 + 1.4))}L${P2(pt(t1 - .06, o + w / 2 + 1.4))}" stroke="#000" stroke-width="1.6" opacity=".3"/><g mask="url(#${fm})">${g}</g>`; }
      const cs = pt(.52, -3.8); wrap += coral(cs[0], cs[1], -165, 6, 4, 1.25) + cluster(rng(7), ...pt(.22, 5.4), 3, 3, 2, 1.1); }
    const growth = barn(WR[0] - 3, WR[1] + 4, 1.3, -10);
    // the finger tips turn to wood: the same hand in the brown of the wooden half of his face, shown from the middle
    // joints up, the grain running along each finger to its tip
    let handG = hand.back + hand.front;
    { const J = hand.joints.slice(0, 4), yw = J.reduce((a, j) => a + lerp(j[1][1], j[2][1], .55), 0) / 4, hm = nid('hm', u), hg = nid('hg', u);
      let wood = handW.back + handW.front;
      J.forEach((j, i) => { const a = j[1], b = j[2], c = j[3], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = [1.1, 1.14, 1.08, .94][i] * .95 * 4.3 * .3;
        for (const k of [-1, 0, 1]) wood += `<path d="M${P2([a[0] + nx * w * k, a[1] + ny * w * k])}Q${P2([b[0] + nx * w * k * 1.1, b[1] + ny * w * k * 1.1])} ${P2([c[0] + nx * w * k * .5 + dx / l * -.3, c[1] + ny * w * k * .5 + dy / l * -.3])}" stroke="${k ? '#2a1c0e' : '#120a04'}" stroke-width="${k ? .3 : .45}" fill="none" opacity=".85"/>`;
        wood += `<path d="M${P2([b[0] - nx * w * .8, b[1] - ny * w * .8])}l${f(nx * w * .6)} ${f(ny * w * .6)}" stroke="#d8c090" stroke-width=".3" opacity=".5"/>`; });
      handG += `<defs>${linGrad(hg, 0, yw + 4, 0, yw - 3, [[0, '#fff', 0], [.5, '#fff', .6], [1, '#fff', 1]])}<mask id="${hm}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${hg})"/></mask></defs>`
        + `<g mask="url(#${hm})">${wood}</g>`; }

    // ——— the head: 3/4 to our left, a young sailor, the eyes half shut; the far half gone to wood ———
    const HO = { c: HEAD.c, r: HEAD.r, turn: .3, dir: -1, nod: 4, light: [-.6, -.8], look: [-.2, .1], brow: 'calm', mouth: 0, smile: 0, noseL: 1.05,
      hair: { style: 'long', color: '#1a2420' }, hairColor: '#1a2420', beard: 'short' };
    const hd = H.head34(u, { ...HO, tone: SKIN, warm: { color: '#d8fff0', op: .2 }, eye: 'half', lips: '#5a6450', iris: '#7a9a8a' });
    const hw = H.head34(u, { ...HO, tone: WOOD, eye: 'shut', lips: WOOD.shadow, hair: { style: 'long', color: '#3a2e1c' }, hairColor: '#3a2e1c', beard: 'short' });
    let face = hd.svg + rimArc(hd, { r: HEAD.r, light: [-.6, -.8], color: '#d8fff0', span: 40, opacity: .35 });
    { const Q = hd.Q, mx = Q(0, 0, 1)[0], wm = nid('wm', u), wg = nid('wmg', u), R = rng(8);
      let wood = hw.svg;
      // the grain: lines across the cheek and brow, bending round the eye and the cheekbone
      const eye = Q(.36, -.12, .78), cb = Q(.5, .3, .7);
      for (let i = 0; i < 20; i++) { const y = HEAD.c[1] - HEAD.r * 1.15 + i * HEAD.r * .12, pts = [];
        for (let x = mx - 6; x <= HEAD.c[0] + HEAD.r * 1.4; x += 2) { const d1 = Math.hypot(x - eye[0], y - eye[1]), d2 = Math.hypot(x - cb[0], y - cb[1]); pts.push([x, y + (y < eye[1] ? -1 : 1) * 3.4 * Math.exp(-d1 * d1 / 40) + (y < cb[1] ? -1 : 1) * 2.6 * Math.exp(-d2 * d2 / 50) + (R() - .5) * .3]); }
        wood += `<path d="${H.sp(pts)}" stroke="${i % 3 ? '#2a1c0e' : '#120a04'}" stroke-width="${i % 3 ? .35 : .6}" fill="none" opacity=".75"/>`; }
      wood += `<ellipse cx="${f(cb[0] + 1)}" cy="${f(cb[1] + 1)}" rx="2.4" ry="1.6" fill="#2a1c0e"/><ellipse cx="${f(cb[0] + 1)}" cy="${f(cb[1] + 1)}" rx="3.8" ry="2.6" fill="none" stroke="#2a1c0e" stroke-width=".45"/>`;
      face += `<defs>${linGrad(wg, mx + 1, 0, mx + 6, 0, [[0, '#fff', 0], [1, '#fff', 1]])}<mask id="${wm}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${wg})"/></mask></defs><g mask="url(#${wm})">${wood}</g>`;
      // the line where skin turns to wood: a fine crack with small splits, pale fibres crossing it
      const crack = []; for (let k = 0; k <= 12; k++) { const t = k / 12, p = Q(.12 + .08 * Math.sin(t * 7), -1 + t * 2.05, .95); crack.push([p[0] + 3.2, p[1]]); }
      face += `<path d="${H.sp(crack)}" stroke="#120a04" stroke-width=".6" fill="none" opacity=".75"/>`
        + crack.filter((_, k) => k % 3 === 1).map(p => `<path d="M${P2(p)}l${f(-2 - R() * 2)} ${f((R() - .5) * 2)}" stroke="#120a04" stroke-width=".35" opacity=".7"/><path d="M${P2([p[0] + .4, p[1] + .6])}l3 .4" stroke="#d8c090" stroke-width=".3" opacity=".6"/>`).join('');
      // the strake's seam across the far side of the jaw and on into the wall
      const sy = RAIL + 8 + SY * 2 - .4, seam = []; for (let x = mx + 6; x <= 160; x += 3) seam.push([x, sy + 1.2 * Math.exp(-Math.pow((x - HEAD.c[0] - 8) / 10, 2))]);
      face += `<path d="${H.sp(seam)}" stroke="#030504" stroke-width=".6" fill="none" opacity=".6"/><path d="${H.sp(seam.map(p => [p[0], p[1] + .7]))}" stroke="#c8b890" stroke-width=".3" fill="none" opacity=".3"/>`;
      // barnacles on the wooden temple, coral at the jaw, weed in the hair
      const t1 = Q(.86, -.42, .3), j1 = Q(.62, .72, .4);
      face += barn(t1[0], t1[1], 1.8, 20) + barn(t1[0] + 2.6, t1[1] + 2.8, 1.3, 30) + coral(j1[0] + 1, j1[1] + 2, 20, 4.6, 9, 1.1) + weed(...Q(-.7, -.7, .4), 12, 2, 11);
      face += glow(u, ...Q(-.4, -.25, .8), 10, 8, '#d8fff0', .16); }

    // ——— the souls: one sinking into the planks on either side ———
    const souls = sinkingSoul(u, 170, 84, 2.2) + sinkingSoul(u, 16, 132, 2.2);

    // ——— assemble ———
    let fg = man + sleeve + handG + wrap + growth + face + souls;
    // his right shoulder's edge (our right) under the crust where the coat goes into the planks
    { const R = rng(31); fg += cluster(R, 144, 98, 12, 26, 7, 2.3) + cluster(R, 150, 128, 12, 30, 6, 2.3) + coral(152, 108, -40, 6, 3) + coral(156, 136, -10, 5, 5) + weed(148, 100, 20, 3, 8); }
    // ——— light and air: the moon's light from over the rail, motes, the dark under the glass ———
    fg += glow(u, 70, 50, 70, 50, '#cfeee0', .12) + motes(18, 20, 40, 160, 90, '#dffff0', 4)
      + gloom(u, 40, 60, 210, 120, .22, '#020604') + gloom(u, 100, 130, 100, 280, .55, '#020604');
    return [bg + wall, fg];
  } };
