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
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, woodTex } = PK;

const RAIL = 30, WB = 262;                            // the rail's underside (the wall's top) and the deck line (off the picture)
const SY = 13.4;                                      // a strake's height
const HEAD = { c: [104, 64], r: 13 };
const SH = [80, 94], EL = [50, 86], WR = [24, 72];    // his right arm (our left): shoulder, elbow, wrist
const light = { time: 'fog', haze: .6, key: { type: 'moon', x: 30, y: -30, el: 50, color: '#cfeee0', power: .7 }, fill: { color: '#1e3a32', power: .4 },
  rim: { az: 300, color: '#bff0dc', power: .3 }, locals: [{ x: 166, y: 62, color: '#9effd0', power: .4, radius: 26 }, { x: 52, y: 122, color: '#9effd0', power: .4, radius: 26 }] };
const skel = { horizon: HEAD.c[1], eye: 1.6, light: 'the moon in the fog upper left, over the rail (key): lit on the left, shadows down-right; the two souls glow green on the planks', items: [
  ['fog over the rail', 0, 0, 200, RAIL - 6, 'sky'], ['rail', 0, RAIL, 200, 8, 'bulwark top'], ['bulwark planking', 0, WB, 200, WB - RAIL, 'wall, on the deck (off the picture)'],
  ['sailor', 62, 290, 84, 240, 'stands on the deck (feet off the frame), back to the wall, half grown into it'], ['arm and hand', 8, 100, 80, 44, 'pressed to the planking'],
  ['soul R', 156, 74, 20, 24, 'sinking into the planks'], ['soul L', 42, 132, 20, 24, 'sinking into the planks'], ['split planks', 168, 100, 32, 60, 'the wall, right edge']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#c8cfae', half: '#8c9a7e', core: '#728468', shadow: '#3a4a36', outline: '#121a10' };   // pale, sea-cold
const WOOD = { lit: '#9a8a66', half: '#5e543c', core: '#4a422e', shadow: '#2a2618', outline: '#0e0c06' };     // the face gone to wood
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
    // out at the right edge the old wall is still broken: a split plank with the fog through it, a sprung end
    { const sp = [[164, RAIL + 8 + SY * 3 + 4], [192, RAIL + 8 + SY * 3 + 5.6], [192, RAIL + 8 + SY * 3 + 8], [170, RAIL + 8 + SY * 3 + 7]];
      wall += `<path d="M${sp.map(P2).join('L')}Z" fill="#5a7a6e"/><path d="M${P2(sp[0])}L${P2(sp[1])}" stroke="#020403" stroke-width=".6"/><path d="M${P2(sp[3])}L${P2(sp[2])}" stroke="#a8c8b8" stroke-width=".4" opacity=".7"/>`;
      const y2 = RAIL + 8 + SY * 6; wall += `<path d="M176 ${y2 + 2}L192 ${y2 + 1}L192 ${y2 + 5}L180 ${y2 + 4.4}Z" fill="#4a6a5e"/><path d="M178 ${y2 + 2}l-5 -3l3 4z" fill="#3a4434" stroke="#0a0e08" stroke-width=".3"/>`
        + `<path d="M150 ${y2 + 7}l14 -1M140 ${RAIL + 8 + SY * 5 + 6}l22 1" stroke="#020403" stroke-width=".7"/>`; }
    // round him the planks are drawn in tight: their seams bend towards him and the grain swirls round (the wall made strong)
    let pull = '';
    { const cid = nid('pc', u), c = [112, 120];
      pull += `<defs><clipPath id="${cid}"><rect x="70" y="${RAIL + 8}" width="104" height="${WB - RAIL}"/></clipPath></defs><g clip-path="url(#${cid})">`;
      for (let y = RAIL + 8 + SY; y < WB; y += SY) { const pts = []; for (let x = 70; x <= 174; x += 4) { const dx = (x - c[0]) / 34, dy = (y - c[1]) / 60, b = 5 * Math.exp(-dx * dx - dy * dy); pts.push([x, y - .4 + b * Math.sign(c[1] - y)]); }
        pull += `<path d="${H.sp(pts)}" stroke="#030504" stroke-width="1.1" fill="none"/>`; }
      const R = rng(12); for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, rr = 26 + R() * 40, x = c[0] + Math.cos(a) * rr, y = c[1] + Math.sin(a) * rr * 1.5; pull += `<path d="M${f(x)} ${f(y)}q${f(-Math.sin(a) * 8)} ${f(Math.cos(a) * 8)} ${f(-Math.sin(a) * 16)} ${f(Math.cos(a) * 14)}" stroke="#5a6a52" stroke-width=".4" fill="none" opacity=".45"/>`; }
      pull += '</g>' + PK.nails([[150, 104], [150, 118], [146, 146], [86, 140], [84, 168]], '#141a12', .7); }
    wall += pull;

    // ——— the man ———
    let man = '';
    // the coat: shoulders against the wall, the body down out of the picture; his left side (our right) fades into the planks
    const coat = [[68, 290], [70, 150], [70, 112], [74, 98], [86, 90], [98, 86], [110, 86], [122, 89], [134, 96], [142, 112], [146, 150], [150, 290]];
    const mk = nid('mk', u), mg = nid('mg', u), cg = nid('cg', u);
    man += `<defs>${linGrad(mg, 118, 0, 148, 0, [[0, '#ffffff', 1], [1, '#ffffff', 0]])}<mask id="${mk}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${mg})"/></mask>`
      + `${linGrad(cg, 66, 90, 150, 130, [[0, COAT.lit, 1], [.35, COAT.half, 1], [1, COAT.shadow, 1]])}</defs>`;
    let body = `<path d="${H.sp(coat)}Z" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".6"/>`;
    // the open shirt under the coat, the lapels, folds, a sash low down; the light on his right shoulder (our left)
    body += `<path d="M95 87L104 96L114 87L118 138L104 146L92 138Z" fill="#a8ac98"/><path d="M98 96q6 6 12 0" stroke="#5a6050" stroke-width=".6" fill="none"/>`
      + `<path d="M95 87L88 132L100 140L104 96ZM114 87L122 132L108 140L104 96Z" fill="#2a3630" stroke="${COAT.outline}" stroke-width=".5"/>`
      + `<path d="M95 87L88 132" stroke="#7aa898" stroke-width=".6" opacity=".55"/><path d="M76 150q4 30 2 60M88 146q6 36 4 70M134 140q-4 40 -2 70" stroke="#040806" stroke-width="1" fill="none" opacity=".7"/>`
      + `<path d="M70 176q36 8 78 -2l0 10q-40 10 -78 2z" fill="#4a2018" opacity=".85"/><path d="M70 176q36 8 78 -2" stroke="#8a4a3a" stroke-width=".6" fill="none"/>`;
    man += `<g mask="url(#${mk})">${body}</g>`;
    // the neck: about a third of the head, into the open collar
    man += `<path d="M97 74L98 90Q104 94 111 89L111 74Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".4"/><path d="M98 80q2 6 1 10" stroke="${SKIN.lit}" stroke-width=".8" fill="none" opacity=".5"/><path d="M106 84q3 2 5 0" stroke="${SKIN.shadow}" stroke-width=".6" fill="none" opacity=".7"/>`;

    // ——— the arm: one sleeve from the shoulder through the elbow to the cuff, pressed along the planks; the open hand
    // flat on the wood, back to us, finger tips under the strake above ———
    const hand = H.hand3(u, { at: WR, a: -150, s: 2.15, m: 1, roll: 0, pose: 'open', spread: 6, tone: SKIN, light: [-.5, -.86], sw: .3, palmW: .8, fingerW: .92, nails: true });
    const sleeve = H.cloth(u, { spine: [SH, [lerp(SH[0], EL[0], .5), lerp(SH[1], EL[1], .5) + .6], EL, [lerp(EL[0], WR[0], .5) + .4, lerp(EL[1], WR[1], .5) + .6], WR], w: [14, 12.4, 11, 9.6, 8.4], tone: COAT, lit: -1, rim: RIMC, rimSide: -1, rimOp: .55, seed: 5, drapes: 1, sw: .45, capA: true, roundA: .9,
      cuff: { from: .86, k: 1.1, tone: { lit: '#4a5a50', half: '#24302a', shadow: '#0c120e', outline: '#040806' } } });
    // the plank wrapping the forearm: two bands of wood grown out of the wall, curled round it, nailed; a shadow under each
    let wrap = '';
    { const T = (t, s) => { const a = [lerp(EL[0], WR[0], t), lerp(EL[1], WR[1], t)], d = [WR[0] - EL[0], WR[1] - EL[1]], l = Math.hypot(...d), n = [-d[1] / l, d[0] / l]; return [a[0] + n[0] * s, a[1] + n[1] * s]; };
      for (const [t0, t1, sd] of [[.28, .46, 1], [.6, .76, 2]]) {
        const a = T(t0, -7.6), b = T(t0 + .05, 7.4), c = T(t1 + .05, 7.4), d = T(t1, -7.6), wg = nid('wg', u), mid0 = T((t0 + t1) / 2, -9.5), mid1 = T((t0 + t1) / 2 + .05, 9.2);
        wrap += `<path d="M${P2(T(t0 + .02, -7))}L${P2(T(t1 + .02, -7))}L${P2(T(t1 + .07, 8))}L${P2(T(t0 + .07, 8))}Z" fill="#000" opacity=".35"/>`
          + `<defs>${linGrad(wg, a[0], a[1], b[0], b[1], [[0, '#2a2a1c', 1], [.3, '#7a7656', 1], [.55, '#5a5840', 1], [1, '#1e1e14', 1]])}</defs>`
          + `<path d="M${P2(a)}Q${P2(mid0)} ${P2(d)}L${P2(c)}Q${P2(mid1)} ${P2(b)}Z" fill="url(#${wg})" stroke="#0a0c06" stroke-width=".45"/>`
          + `<path d="M${P2(T(t0 + .03, -6))}Q${P2(T((t0 + t1) / 2 + .03, -7.6))} ${P2(T(t1 + .03, -6))}" stroke="#c8d0b0" stroke-width=".4" fill="none" opacity=".6"/>`
          + [-.3, .3].map(k => { const p = T((t0 + t1) / 2 + .02, k * 10); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".6" fill="#0a0c06"/>`; }).join('')
          + Array.from({ length: 3 }, (_, i) => `<path d="M${P2(T(t0 + .04 + i * .05, -6.4))}L${P2(T(t0 + .07 + i * .05, 6.4))}" stroke="#2a2a1c" stroke-width=".3" opacity=".5"/>`).join('') + cluster(rng(sd), ...T(t1 - .04, 3), 4, 3, 2, 1.2); } }
    // coral and barnacles over the wrist and the back of the hand: the sea's growth taking him with the wood
    const growth = coral(WR[0] + 4, WR[1] + 2, -100, 6, 4, 1.4) + coral(WR[0] + 8, WR[1] - 3, -150, 5, 6, 1.2) + barn(WR[0] + 2, WR[1] + 4, 1.6, 20) + barn(WR[0] + 6, WR[1] + 6, 1.2, -10) + barn(WR[0] - 2, WR[1] - 1, 1.1, 30);
    // the finger tips under the strake above: its lower edge grown down over them, splintered
    let tips = '';
    { const y = RAIL + 8 + SY * 2 - .4, yt = Math.min(...hand.joints.slice(0, 4).map(j => j[j.length - 1][1]));
      const top = Math.max(y - 13, yt - 1.2), xs = hand.joints.slice(0, 4).map(j => j[j.length - 1][0]), x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4, wg = nid('tp', u);
      tips += `<defs>${linGrad(wg, 0, top, 0, top + 8, [[0, '#3a4434', 1], [1, '#262e22', 1]])}</defs><path d="M${f(x0 - 6)} ${f(top - 2)}H${f(x1 + 6)}V${f(top + 3)}Q${f(x1 + 2)} ${f(top + 4.4)} ${f(x1)} ${f(top + 5.6)}L${f((x0 + x1) / 2 + 3)} ${f(top + 4)}L${f((x0 + x1) / 2)} ${f(top + 6.4)}L${f(x0 + 2)} ${f(top + 4.6)}Q${f(x0 - 2)} ${f(top + 4)} ${f(x0 - 6)} ${f(top + 3)}Z" fill="url(#${wg})"/>`
        + `<path d="M${f(x1)} ${f(top + 5.6)}L${f((x0 + x1) / 2 + 3)} ${f(top + 4)}L${f((x0 + x1) / 2)} ${f(top + 6.4)}L${f(x0 + 2)} ${f(top + 4.6)}" stroke="#a8b890" stroke-width=".45" fill="none" opacity=".7"/>`
        + `<path d="M${f(x0)} ${f(top + 6.6)}H${f(x1)}" stroke="#000" stroke-width="1.6" opacity=".35"/>`; }

    // ——— the head: 3/4 to our left, a young sailor, the eyes nearly closed; the far half gone to wood ———
    const HO = { c: HEAD.c, r: HEAD.r, turn: .32, dir: -1, nod: 4, light: [-.6, -.8], look: [-.2, .1], brow: 'calm', mouth: 0, smile: 0, noseL: 1.05,
      hair: { style: 'long', color: '#1a2420' }, hairColor: '#1a2420', beard: 'short' };
    const hd = H.head34(u, { ...HO, tone: SKIN, warm: { color: '#d8fff0', op: .2 }, eye: 'half', lips: '#5a6450', iris: '#7a9a8a' });
    const hw = H.head34(u, { ...HO, tone: WOOD, eye: 'shut', lips: WOOD.shadow, hair: { style: 'long', color: '#2a2618' }, hairColor: '#2a2618' });
    let face = hd.svg + rimArc(hd, { r: HEAD.r, light: [-.6, -.8], color: '#d8fff0', span: 40, opacity: .35 });
    // the wood: the same head in wood, masked in from the middle of the face to our right, the grain across it, a seam
    { const Q = hd.Q, mx = Q(0, 0, 1)[0], wm = nid('wm', u), wg = nid('wmg', u), R = rng(8);
      let wood = hw.svg;
      // the grain: lines across the cheek and brow, bending round the eye and the cheekbone
      const eye = Q(.36, -.12, .78), cb = Q(.5, .3, .7);
      for (let i = 0; i < 16; i++) { const y = HEAD.c[1] - HEAD.r * 1.1 + i * HEAD.r * .15, pts = [];
        for (let x = mx - 6; x <= HEAD.c[0] + HEAD.r * 1.3; x += 2) { const d1 = Math.hypot(x - eye[0], y - eye[1]), d2 = Math.hypot(x - cb[0], y - cb[1]); pts.push([x, y + (y < eye[1] ? -1 : 1) * 3 * Math.exp(-d1 * d1 / 30) + (y < cb[1] ? -1 : 1) * 2.4 * Math.exp(-d2 * d2 / 40) + (R() - .5) * .3]); }
        wood += `<path d="${H.sp(pts)}" stroke="${i % 3 ? '#2a2216' : '#14100a'}" stroke-width="${i % 3 ? .3 : .5}" fill="none" opacity=".7"/>`; }
      // a knot on the cheekbone, the strake's seam across the jaw, a crack running in from the boundary
      wood += `<ellipse cx="${f(cb[0] + 1)}" cy="${f(cb[1] + 1)}" rx="2.2" ry="1.5" fill="#2a2216"/><ellipse cx="${f(cb[0] + 1)}" cy="${f(cb[1] + 1)}" rx="3.4" ry="2.4" fill="none" stroke="#2a2216" stroke-width=".4"/>`;
      man += ''; face += `<defs>${linGrad(wg, mx - 2, 0, mx + 7, 0, [[0, '#fff', 0], [1, '#fff', 1]])}<mask id="${wm}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="300"><rect x="-10" y="-10" width="220" height="300" fill="url(#${wg})"/></mask></defs><g mask="url(#${wm})">${wood}</g>`;
      // the line where skin turns to wood: a fine crack with small splits, pale fibres crossing it
      const crack = []; for (let k = 0; k <= 12; k++) { const t = k / 12, p = Q(lerp(.05, .2, Math.sin(t * 7) * .5 + .5), -1 + t * 2.05, .95); crack.push([p[0] + 2.4, p[1]]); }
      face += `<path d="${H.sp(crack)}" stroke="#14100a" stroke-width=".55" fill="none" opacity=".75"/>`
        + crack.filter((_, k) => k % 3 === 1).map(p => `<path d="M${P2(p)}l${f(-2 - R() * 2)} ${f((R() - .5) * 2)}" stroke="#14100a" stroke-width=".35" opacity=".7"/><path d="M${P2([p[0] + .4, p[1] + .6])}l3 .4" stroke="#c8b890" stroke-width=".3" opacity=".6"/>`).join('');
      // the strake's seam across the far side of the head and on into the wall
      const sy = RAIL + 8 + SY * 3 - .4, seam = []; for (let x = mx + 2; x <= 150; x += 3) seam.push([x, sy + 2.4 * Math.exp(-Math.pow((x - HEAD.c[0] - 6) / 10, 2))]);
      face += `<path d="${H.sp(seam)}" stroke="#030504" stroke-width="1" fill="none" opacity=".85"/><path d="${H.sp(seam.map(p => [p[0], p[1] + 1]))}" stroke="#8ab0a0" stroke-width=".4" fill="none" opacity=".3"/>`;
      // barnacles on the wooden temple, coral at the jaw, weed in the hair
      const t1 = Q(.86, -.42, .3), j1 = Q(.62, .72, .4);
      face += barn(t1[0], t1[1], 1.6, 20) + barn(t1[0] + 2.4, t1[1] + 2.6, 1.2, 30) + coral(j1[0] + 1, j1[1] + 2, 20, 4.2, 9, 1) + weed(...Q(-.7, -.7, .4), 10, 2, 11);
      // the green of the fog on his lit cheek and brow
      face += glow(u, ...Q(-.4, -.25, .8), 9, 7, '#d8fff0', .16); }

    // ——— the souls: one sinking into the planks on either side ———
    const souls = sinkingSoul(u, 166, 72, 2.1) + sinkingSoul(u, 52, 124, 2.1);

    // ——— assemble ———
    let fg = man + sleeve + wrap + hand.back + hand.front + growth + tips + face + souls;
    // his right shoulder's edge (our right) under the crust where the coat goes into the planks
    { const R = rng(31); fg += cluster(R, 128, 92, 12, 26, 7, 2.2) + cluster(R, 134, 124, 12, 40, 6, 2.2) + coral(136, 104, -40, 6, 3) + coral(140, 140, -10, 5, 5) + weed(132, 96, 20, 3, 8); }
    // ——— light and air: the moon's light from over the rail, motes, the dark under the glass ———
    fg += glow(u, 70, 50, 70, 50, '#cfeee0', .12) + motes(18, 20, 40, 160, 90, '#dffff0', 4)
      + gloom(u, 40, 60, 210, 120, .4, '#020604') + gloom(u, 100, 130, 100, 280, .55, '#020604');
    return [bg + wall, fg];
  } };
