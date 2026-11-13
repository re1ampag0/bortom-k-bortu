// «Фонтан молодости» (Месть королевы Анны, РЕМОНТ: восстановите 4 Корпуса своему кораблю или кораблю союзника),
// refined from the first-round scene (portrait-revenge.cjs SCENES['Фонтан молодости']): a high grotto, a shaft of
// sunset light falls through a hole in the vault onto a rock ledge over a glowing pool. Two different silver chalices
// stand on the ledge; a glowing drop falls from a stalactite into the left one (its water lit from within, rings
// spreading), the right one waits empty.
// Fixed against the first round: the cave was a flat backdrop with a row of teeth along the top — now a grotto in
// 2.5D (the ledge's top in perspective, the back wall, the vault with stalactites big near us and small far away);
// the chalices were flat cut-outs — now turned silver with the light of the shaft on them, engraved bands, the water
// in the left one lit from within; the drop now hangs on its way down from the stalactite right over the cup.
// Light: the sunset through the hole in the vault (key, warm, from above); the water — cold turquoise glow from
// below (the pool) and in the cup.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, motes } = PK;

const HZ = 70, VX = 100;                          // eye level, the vanishing point
const HOLE = { x: 100, y: 11, rx: 17, ry: 5 };     // the hole in the vault
const LB = 92, LF = 116, LL = 124;                // the ledge: back edge, front edge (its top), the foot of its lip
const C1 = { x: 76, y: 111, h: 52, s: 1 }, C2 = { x: 127, y: 110, h: 42, s: 1 };   // the chalices: foot centre, height
const DROP = { x: 76.6, y: 44 };
const light = { time: 'dusk', haze: .5, key: { type: 'sun', x: HOLE.x, y: -40, el: 58, color: '#ffc488', power: .95 }, fill: { color: '#2e6a70', power: .5 },
  rim: { az: 20, color: '#9ff0e0', power: .45 }, locals: [{ x: C1.x, y: C1.y - C1.h, color: '#9ff0e0', power: .5, radius: 30 }] };
const skel = { horizon: HZ, eye: 1.4, light: 'sunset through the hole in the vault (key, warm, from above) + the glowing water (cold, from below and in the cup)', items: [
  ['back wall', 14, LB, 172, LB - 18, 'side walls, vault'], ['hole', HOLE.x - HOLE.rx, HOLE.y + HOLE.ry, HOLE.rx * 2, HOLE.ry * 2, 'vault'],
  ['ledge', 0, LL, 200, LL - LB, 'rock over the pool'], ['chalice 1', C1.x - 16, C1.y + 2, 32, C1.h + 6, 'ledge'], ['chalice 2', C2.x - 18, C2.y + 2, 36, C2.h + 6, 'ledge'],
  ['drip stalactite', 72, 34, 10, 30, 'vault'], ['drop', DROP.x - 2, DROP.y + 4, 4, 7, 'falling into chalice 1'], ['pool', 0, 290, 200, 290 - LL, 'below the ledge']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const toward = (p, y) => { const t = (y - HZ) / (p[1] - HZ); return [VX + (p[0] - VX) * t, y]; };

// a stalactite: a wet, slightly crooked cone from (x, y0), lit from the left and above
function stal(u, x, y0, len, w, R, tone = '#4a3a30') {
  const g = nid('st', u), bend = (R() - .5) * w * .5, tip = [x + bend, y0 + len];
  const d = `M${f(x - w / 2)} ${f(y0)}C${f(x - w * .42)} ${f(y0 + len * .4)} ${f(tip[0] - w * .12)} ${f(y0 + len * .75)} ${P2(tip)}C${f(tip[0] + w * .14)} ${f(y0 + len * .72)} ${f(x + w * .44)} ${f(y0 + len * .4)} ${f(x + w / 2)} ${f(y0)}Z`;
  return `<defs>${linGrad(g, x - w / 2, 0, x + w / 2, 0, [[0, mix(tone, '#ffd8a8', .35), 1], [.35, tone, 1], [.8, mix(tone, '#000000', .5), 1], [1, mix(tone, '#2e6a70', .3), 1]])}</defs><path d="${d}" fill="url(#${g})" stroke="#140c08" stroke-width=".35"/>`
    + `<path d="M${f(x - w * .22)} ${f(y0 + 1)}Q${f(x - w * .18)} ${f(y0 + len * .5)} ${f(tip[0] - w * .03)} ${f(y0 + len * .9)}" stroke="#ffe8c8" stroke-width="${f(Math.max(.25, w * .06))}" fill="none" opacity=".55"/>`
    + [.3, .55, .78].map(t => `<path d="M${f(x - w * (1 - t) * .5)} ${f(y0 + len * t)}q${f(w * (1 - t) * .5)} ${f(w * .08)} ${f(w * (1 - t))} 0" stroke="#140c08" stroke-width=".3" fill="none" opacity=".45"/>`).join('');
}
// rock: a surface of facets and cracks over a base fill, lit from above
function rockFace(u, d, box, base, R, n, seed) {
  const cl = nid('rk', u), [x0, y0, w, h] = box; let o = `<defs><clipPath id="${cl}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${base}"/><g clip-path="url(#${cl})">`;
  for (let i = 0; i < n; i++) { const cx = x0 + R() * w, cy = y0 + R() * h, r = 4 + R() * 12, k = R(), pts = Array.from({ length: 5 }, (_, j) => { const a = j / 5 * Math.PI * 2 + R() * .8; return [cx + Math.cos(a) * r * (.6 + R() * .5), cy + Math.sin(a) * r * .6 * (.6 + R() * .5)]; });
    o += `<path d="${poly(pts)}" fill="${k > .5 ? '#ffd8b0' : '#000000'}" opacity="${f(.04 + R() * .08)}"/>`; }
  for (let i = 0; i < n * .8; i++) { const x = x0 + R() * w, y = y0 + R() * h, l = 3 + R() * 9, a = (R() - .5) * 1.2;
    o += `<path d="M${f(x)} ${f(y)}l${f(l * Math.cos(a))} ${f(l * Math.sin(a) + (R() - .5) * 3)}" stroke="#0e0806" stroke-width="${f(.35 + R() * .4)}" opacity=".6"/><path d="M${f(x)} ${f(y - .5)}l${f(l * Math.cos(a))} ${f(l * Math.sin(a))}" stroke="#d8b090" stroke-width=".25" opacity=".25"/>`; }
  return o + '</g>';
}

module.exports = { name: 'Фонтан молодости', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.4 }), R = rng(13);
    // ——— the grotto: the vault, the side walls, the back wall (lit where the shaft spills), the hole in the vault ———
    const BW = [16, 184], BT = 26;
    let bg = `<rect x="-5" y="-5" width="210" height="300" fill="#120c0a"/>`;
    bg += rockFace(u, `M-10 -10H210V${BT}H-10Z`, [-10, -10, 220, BT + 10], '#2a1e18', R, 18);
    { const lt = toward([BW[0], BT], -10), rt = toward([BW[1], BT], -10), lb = toward([BW[0], LB], 140), rb = toward([BW[1], LB], 140);
      bg += rockFace(u, `M${P2(lt)}L${BW[0]} ${BT}L${BW[0]} ${LB}L${P2(lb)}L-20 140L-20 -10Z`, [-20, -10, 40, 150], '#21170f', R, 10)
        + rockFace(u, `M${P2(rt)}L${BW[1]} ${BT}L${BW[1]} ${LB}L${P2(rb)}L220 140L220 -10Z`, [180, -10, 40, 150], '#1c140e', R, 10);
      const wg = nid('bw', u);
      bg += rockFace(u, `M${BW[0]} ${BT}L${BW[1]} ${BT}L${BW[1]} ${LB}L${BW[0]} ${LB}Z`, [BW[0], BT, BW[1] - BW[0], LB - BT], '#3a2a20', R, 30)
        + `<defs>${radGrad(wg, 100, 78, 90, [[0, '#ffb070', .38], [.45, '#e07a4a', .14], [1, '#e07a4a', 0]])}</defs><rect x="${BW[0]}" y="${BT}" width="${BW[1] - BW[0]}" height="${LB - BT}" fill="url(#${wg})"/>`
        + `<path d="M${BW[0]} ${BT}V${LB}M${BW[1]} ${BT}V${LB}" stroke="#0a0604" stroke-width="1.4" opacity=".7"/>`; }
    // the pool's light thrown up on the back wall: wavering turquoise lines
    for (let i = 0; i < 14; i++) { const x = 24 + R() * 152, y = 50 + R() * 38, l = 6 + R() * 12;
      bg += `<path d="M${f(x)} ${f(y)}q${f(l / 4)} ${f(-1.2)} ${f(l / 2)} 0t${f(l / 2)} 0" stroke="#9ff0e0" stroke-width=".55" fill="none" opacity="${f(.15 + R() * .2)}"/>`; }
    // the hole in the vault: the sunset sky beyond it, its rim
    { const g = nid('hl', u);
      bg += `<defs>${radGrad(g, HOLE.x, HOLE.y, HOLE.rx * 1.3, [[0, '#fff2d0', 1], [.6, '#ffc888', 1], [1, '#e07a4a', 1]])}</defs>`
        + `<path d="M${HOLE.x - HOLE.rx} ${HOLE.y}C${HOLE.x - HOLE.rx + 2} ${HOLE.y - 6} ${HOLE.x + HOLE.rx - 3} ${HOLE.y - 7} ${HOLE.x + HOLE.rx} ${HOLE.y - 1}C${HOLE.x + HOLE.rx - 2} ${HOLE.y + HOLE.ry + 1} ${HOLE.x - HOLE.rx + 4} ${HOLE.y + HOLE.ry + 2} ${HOLE.x - HOLE.rx} ${HOLE.y}Z" fill="url(#${g})" stroke="#1a100a" stroke-width="1.2"/>`
        + K.localGlow(u, { x: HOLE.x, y: HOLE.y + 2, color: '#ffd8a0', power: .7, radius: 34 }); }
    // the far stalactites along the top of the back wall: small; then the middle ones
    for (let i = 0; i < 14; i++) { const x = BW[0] + 6 + i * 12 + (R() - .5) * 6; if (Math.abs(x - HOLE.x) < 14) continue; bg += stal(u, x, BT - 1, 5 + R() * 9, 2.4 + R() * 2, R, '#3a2c24'); }
    // ——— the ledge: its top in perspective, the lip falling to the pool; the pool below ———
    { const pg = nid('pl', u);
      bg += `<defs>${linGrad(pg, 0, LL, 0, 290, [[0, '#2a8a86', 1], [.2, '#0e4a4c', 1], [1, '#04100e', 1]])}</defs><rect x="-5" y="${LL - 2}" width="210" height="${300 - LL}" fill="url(#${pg})"/>`
        + K.localGlow(u, { x: 100, y: LL + 10, color: '#9ff0e0', power: .5, radius: 90 }, { squash: .3, core: false })
        + [0, 1, 2, 3, 4].map(k => `<path d="M-5 ${LL + 4 + k * 5}q25 -1.6 50 0t50 0t50 0t55 0" stroke="#c8fff0" stroke-width="${f(.35 + k * .1)}" fill="none" opacity="${f(.45 - k * .07)}"/>`).join(''); }
    const top = `M${BW[0] - 6} ${LB}L${BW[1] + 6} ${LB}Q${BW[1] + 18} ${LB + 12} 206 ${LF - 1}L-6 ${LF + 1}Q${BW[0] - 14} ${LB + 12} ${BW[0] - 6} ${LB}Z`;
    let mid = rockFace(u, top, [-6, LB, 212, LF - LB + 2], '#5a4636', R, 24);
    { const g = nid('lt', u), lg = nid('ll', u);
      mid += `<defs>${radGrad(g, 100, 106, 62, [[0, '#ffc890', .55], [.5, '#ffa860', .2], [1, '#ffa860', 0]])}</defs><path d="${top}" fill="url(#${g})"/>`
        + `<defs>${linGrad(lg, 0, LF, 0, LL, [[0, '#3a2c22', 1], [1, '#12100e', 1]])}</defs><path d="M-6 ${LF + 1}L206 ${LF - 1}L206 ${LL}Q150 ${LL + 3} 100 ${LL + 1}T-6 ${LL + 1}Z" fill="url(#${lg})"/>`
        + `<path d="M-6 ${LF + 1}L206 ${LF - 1}" stroke="#ffd0a0" stroke-width=".7" opacity=".55"/>`
        + Array.from({ length: 10 }, (_, i) => { const x = 8 + i * 20 + R() * 8; return `<path d="M${f(x)} ${LF + 1}q-1 ${f(3 + R() * 3)} 0 ${f(6 + R() * 2)}" stroke="#9ff0e0" stroke-width=".4" fill="none" opacity=".35"/>`; }).join(''); }
    // ——— the shaft of light from the hole down onto the ledge ———
    { const g = nid('sf', u), fl = nid('sb', u);
      mid += `<defs>${linGrad(g, 0, HOLE.y, 0, LF, [[0, '#ffe2b0', .7], [.6, '#ffc890', .36], [1, '#ffb070', .2]])}<filter id="${fl}" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`
        + `<path d="M${HOLE.x - HOLE.rx + 3} ${HOLE.y + 2}L${HOLE.x + HOLE.rx - 3} ${HOLE.y + 2}L148 ${LF - 4}L50 ${LF - 4}Z" fill="url(#${g})" filter="url(#${fl})" style="mix-blend-mode:screen"/>`
        + motes(26, 56, 14, 88, 90, '#ffe8c0', 5); }
    // ——— the chalices: turned silver, engraved bands; the left full of glowing water, the right empty ———
    const chalice = (c, prof, full, seed) => {
      const A = [c.x, c.y], B = [c.x, c.y - c.h], k = .26, rRim = prof[prof.length - 1][1];
      let o = K.castShadow(u, L, { x: c.x, y: c.y, w: 26, h: c.h, horizon: HZ, d: 1 }) + K.contactShadow(u, c.x, c.y + 1, 28, L, { ry: 2.4, opacity: .9 });
      const g = K.propLathe(u, L, 'iron', A, B, prof, { ell: k, spec: [.55, .97], outline: .45 });
      o += g.svg;
      // the silver: bright bands of the shaft and the cave round the turned form, warm from above
      { const rmax = Math.max(...prof.map(q => q[1])), sg = nid('ag', u), wg = nid('aw', u);
        o += `<defs>${linGrad(sg, c.x - rmax, 0, c.x + rmax, 0, [[0, '#5a6266', 1], [.18, '#c8d0d4', 1], [.3, '#ffffff', 1], [.42, '#b4bcc0', 1], [.62, '#6a7276', 1], [.82, '#3c4448', 1], [.94, '#8ad8d0', 1], [1, '#4a5a5c', 1]])}`
          + `${linGrad(wg, 0, c.y - c.h, 0, c.y, [[0, '#ffd8a8', .35], [.5, '#ffd8a8', .08], [1, '#1a2a2a', .3]])}</defs>`
          + `<g clip-path="url(#${g.clip})"><rect x="${f(c.x - rmax - 1)}" y="${f(c.y - c.h - 2)}" width="${f(rmax * 2 + 2)}" height="${f(c.h + 4)}" fill="url(#${sg})" opacity=".8"/><rect x="${f(c.x - rmax - 1)}" y="${f(c.y - c.h - 2)}" width="${f(rmax * 2 + 2)}" height="${f(c.h + 4)}" fill="url(#${wg})"/></g>`
          + `<path d="${g.d}" fill="none" stroke="#1e2426" stroke-width=".5"/>`; }
      // the engraving: bands round the bowl and a row of chevrons; a band on the foot
      const at = t => { const q = prof.reduce((b, p) => Math.abs(p[0] - t) < Math.abs(b[0] - t) ? p : b); return [c.y - c.h * t, q[1]]; };
      for (const t of [.68, .86]) { const [y, r] = at(t); o += `<path d="M${f(c.x - r * .98)} ${f(y)}A${f(r * .98)} ${f(r * .98 * k)} 0 0 0 ${f(c.x + r * .98)} ${f(y)}" stroke="#2a3034" stroke-width=".45" fill="none"/><path d="M${f(c.x - r * .96)} ${f(y + .5)}A${f(r * .96)} ${f(r * .96 * k)} 0 0 0 ${f(c.x + r * .96)} ${f(y + .5)}" stroke="#ffffff" stroke-width=".3" fill="none" opacity=".45"/>`; }
      { const [y, r] = at(.77); for (let i = -3; i <= 3; i++) { const x = c.x + i * r * .26, yy = y + Math.sqrt(Math.max(0, 1 - (i * .26) ** 2)) * r * k; o += `<path d="M${f(x - 1.4)} ${f(yy - 1.2)}l1.4 1.8l1.4 -1.8" stroke="#2a3034" stroke-width=".4" fill="none"/>`; } }
      { const [y, r] = at(.04); o += `<path d="M${f(c.x - r * .9)} ${f(y)}A${f(r * .9)} ${f(r * .9 * k)} 0 0 0 ${f(c.x + r * .9)} ${f(y)}" stroke="#2a3034" stroke-width=".4" fill="none"/>`; }
      // the mouth: the rim, the inside, the water
      const y = B[1], rr = rRim;
      o += `<ellipse cx="${c.x}" cy="${f(y)}" rx="${f(rr)}" ry="${f(rr * k)}" fill="${full ? '#0c3a3a' : '#1a1c1e'}" stroke="#e8eef2" stroke-width=".8"/>`;
      if (full) { const wg = nid('wt', u);
        o += `<defs>${radGrad(wg, c.x, y + .4, rr, [[0, '#e8fff8', 1], [.35, '#8ff0dc', 1], [.8, '#2a9a92', 1], [1, '#126a66', 1]])}</defs><ellipse cx="${c.x}" cy="${f(y + .6)}" rx="${f(rr * .9)}" ry="${f(rr * k * .82)}" fill="url(#${wg})"/>`
          + [.62, .36].map(q => `<ellipse cx="${f(c.x + .6)}" cy="${f(y + .6)}" rx="${f(rr * q)}" ry="${f(rr * k * q * .8)}" fill="none" stroke="#ffffff" stroke-width=".45" opacity=".7"/>`).join('')
          + K.localGlow(u, { x: c.x, y: y, color: '#9ff0e0', power: .55, radius: 26 }, { squash: .6, core: false }); }
      else o += `<path d="M${f(c.x - rr * .9)} ${f(y + .4)}A${f(rr * .9)} ${f(rr * k * .8)} 0 0 0 ${f(c.x + rr * .9)} ${f(y + .4)}" stroke="#6a7276" stroke-width="1" fill="none" opacity=".7"/>`;
      return o; };
    const P1 = [[0, 12], [.03, 12.2], [.06, 10.5], [.1, 5], [.14, 2.6], [.24, 2.1], [.3, 2.6], [.34, 4.4], [.38, 2.6], [.44, 2.2], [.5, 3], [.56, 7.6], [.66, 11.6], [.8, 13.6], [.92, 14.4], [1, 14.8]];
    const P2c = [[0, 14], [.04, 14.2], [.08, 12], [.13, 6], [.18, 3], [.3, 2.6], [.36, 5.2], [.42, 5.2], [.47, 2.8], [.54, 3.4], [.6, 10], [.72, 15.4], [.88, 17.6], [1, 18]];
    mid += chalice(C2, P2c, false, 2) + chalice(C1, P1, true, 1);
    // ——— the drip: the stalactite over the left chalice, the glowing drop on its way down, a faint trail ———
    mid += stal(u, 77, -6, 36, 10, rng(4), '#a08468') + K.localGlow(u, { x: 77, y: 22, color: '#ffc890', power: .3, radius: 14 }, { core: false });
    mid += `<path d="M${DROP.x} 31L${DROP.x} ${DROP.y - 3}" stroke="#c8fff0" stroke-width=".5" opacity=".35" stroke-dasharray="1.2 1.6"/>`
      + `<path d="M${DROP.x} ${DROP.y - 3.6}C${DROP.x + .6} ${DROP.y - 1.4} ${DROP.x + 2.2} ${DROP.y} ${DROP.x + 2.2} ${DROP.y + 1.6}A2.2 2.2 0 0 1 ${DROP.x - 2.2} ${DROP.y + 1.6}C${DROP.x - 2.2} ${DROP.y} ${DROP.x - .6} ${DROP.y - 1.4} ${DROP.x} ${DROP.y - 3.6}Z" fill="#e8fff8" stroke="#6adcc8" stroke-width=".3"/>`
      + `<circle cx="${DROP.x - .7}" cy="${DROP.y + 1}" r=".55" fill="#ffffff"/>` + K.localGlow(u, { x: DROP.x, y: DROP.y + 1, color: '#b8fff0', power: .8, radius: 9 });
    // ——— the near vault: big stalactites at the top corners, framing the grotto ———
    { const Rn = rng(21); for (const [x, len, w] of [[4, 40, 14], [20, 26, 9], [150, 22, 8], [168, 38, 13], [190, 30, 12], [134, 14, 6]]) mid += stal(u, x, -6, len, w, Rn, '#2e221c'); }
    // ——— the air: the dark round the edges, the shaft's warmth ———
    const fg = gloom(u, 100, 60, -10, 0, .45, '#0a0608') + gloom(u, 100, 60, 210, 0, .45, '#0a0608') + gloom(u, 100, 110, 100, 240, .5, '#020606');
    return [bg, mid + fg];
  } };
