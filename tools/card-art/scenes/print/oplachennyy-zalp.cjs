// «Оплаченный залп» (Индевор, ЗАРЯД: потратьте до 3 Пороха — Залп наносит +1 урон и ещё +1 за каждый Порох), refined
// from the first-round scene (portrait-endeavour.cjs SCENES['Оплаченный залп']): on the Company's gun deck a gun fires
// out of its port and right beside it business goes on — the open ledger lies on a powder keg branded with the
// Company's mark, coins on its page, and the clerk's hand in a black sleeve ticks off the shot just fired. Brief's
// find (card-briefs.md): the account book at the gun — every ball paid for.
// Fixed against the first round: the gun stood side-on and fired into a port in the wall facing us (it could not) —
// now we look along the gun deck in 2.5D: the ship's side on the left with its row of ports running to one vanishing
// point, the guns side-on at them, the deck beams overhead, the deck to the bulkhead far away; the near gun fires out of
// its port, the fire filling the opening, smoke spurting from its vent and rolling back in. The bill, coins and
// quill floated on a crate — now the ledger lies on the keg's head and the hand holds the quill (fingers round it);
// the brand and the ticks are marks, no letters. Light: the flash in the port (key, orange-white), daylight in the
// far ports, a lantern under the beams (warm).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom, shafts, motes } = PK;

const HZ = 64, VX = 140, FOC = 100;                 // eye level, the vanishing point, the focal length (units per m at 1 m)
const XL = -1.4, XR = 2.6, YF = 1.6, YC = -.4, ZB = 11;   // the side (left), the far side (right), the deck, the beams, the bulkhead (m)
const PORTS = [[1.9, 2.6], [4.2, 4.9], [6.5, 7.2], [8.8, 9.5]];   // the ports in the left side: from .. to (depth, m)
const PY = [.3, 1.15];                              // the port's head and sill (m under the eye)
const pr = (X, Y, Z) => [VX + FOC * X / Z, HZ + FOC * Y / Z];
const GA = { Z: 2.25, s: 1.7, recoil: .3 };         // the near gun: its depth, scale, recoil
const MZ = pr(-1.45, 0, GA.Z)[0];                   // the muzzle's x: in the port
const FL = { x: MZ, y: 108.2 };                     // the flash at the muzzle
const KEG = { x: 166, y: 170.6, s: 1.9 };           // the powder keg the ledger lies on (its foot; its head at y ~113)
const LAMP = { x: 160, y: 66, s: .78, hang: 3 };
const light = { time: 'night', haze: .3, key: { type: 'point', x: FL.x, y: FL.y, h: .7, gy: 135, color: '#ffc47a', power: 1, radius: 150 },
  fill: { color: '#4a5a7a', power: .35 }, locals: [{ x: LAMP.x, y: LAMP.y - 8, color: '#ffbe6a', power: .5, radius: 50 }] };
const lightOut = { time: 'day', haze: .35, key: { type: 'sun', az: 200, el: 30, color: '#fff2d8', power: 1 }, fill: { color: '#8db8e0', power: .5 } };
const skel = { horizon: HZ, eye: 1.6, light: 'the flash in the near port (key, orange) + daylight in the far ports + a lantern under the beams', items: [
  ['ship side', -140, 291, 268, 307, 'left, x = -1.4 m: its foot on the deck, its head under the beams'], ['port A', 66, 121, 20, 48, 'ship side, 1.9–2.6 m'],
  ['gun A', 75, 135, 120, 37, 'the deck at 2.25 m, muzzle in port A'], ['guns B–D', 100, 99, 40, 24, 'the deck at 4.5 / 6.9 / 9.1 m, at their ports'],
  ['keg', 148, 170.6, 36, 58, 'the deck at 1.5 m'], ['ledger', 138, 125, 60, 16, 'the keg head'], ['hand + quill', 160, 124, 56, 30, 'from the right edge, the nib on the page'],
  ['lantern', 155, 66, 10, 24, 'a beam overhead'], ['bulkhead', 127, 78.5, 37, 18, 'the deck at 11 m']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
const SKIN = { lit: '#f0c49a', half: '#c48a62', core: '#ae7650', shadow: '#6a402c', outline: '#2e180c' };

// cam: the frame starts 20 units down — this card's glass is taller (three lines of text), the ledger and the port
// stand clear of it
module.exports = { name: 'Оплаченный залп', kind: 'deck', status: 'draft', cam: { x: 0, y: 20, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(41);
    let bg = `<rect x="-10" y="-10" width="220" height="340" fill="#140c08"/>`;
    // ——— the deck: planks to the VP, clipped to the floor between the two sides ———
    { const id = nid('fl', u), fp = [pr(XL, YF, .4), pr(XL, YF, ZB), pr(XR, YF, ZB), pr(XR, YF, .4)];
      bg += `<defs><clipPath id="${id}"><path d="${poly(fp)}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: pr(0, YF, ZB)[1], bottom: 320, vx: VX, kind: 'oak', plank: 14, seed: 6 })}</g>`; }
    // ——— the far bulkhead with a door; the far side (right) with a lit port ———
    { const a = pr(XL, YC, ZB), b = pr(XR, YF, ZB);
      bg += K.shadeBox(u, [{ pts: [a, [b[0], a[1]], b, [a[0], b[1]]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: 3, outline: .4 })
        + `<rect x="${f(VX - 4)}" y="${f(b[1] - 12)}" width="8" height="12" fill="#0a0604" stroke="#3a2412" stroke-width=".4"/>`
        + `<rect x="${f(VX - 3.4)}" y="${f(b[1] - 11.2)}" width="6.8" height="2.4" fill="#ffd090" opacity=".55"/>`;
      const rw = [pr(XR, YC, .5), pr(XR, YC, ZB), pr(XR, YF, ZB), pr(XR, YF, .5)];
      bg += `<path d="${poly(rw)}" fill="#2e1c10"/>`;
      for (let y = YC; y < YF; y += .2) bg += `<path d="M${P2(pr(XR, y, 4))}L${P2(pr(XR, y, ZB))}" stroke="#120a06" stroke-width=".4"/>`;
      { const [z0, z1] = [6.5, 7.2], q = [pr(XR, PY[0], z0), pr(XR, PY[0], z1), pr(XR, PY[1], z1), pr(XR, PY[1], z0)], g = nid('rp', u);
        bg += `<defs>${linGrad(g, 0, q[0][1], 0, q[3][1], [[0, '#cfe2ee'], [.5, '#e8eee6'], [1, '#7aa6b8']])}</defs><path d="${poly(q)}" fill="url(#${g})"/>`
          + K.localGlow(u, { x: (q[0][0] + q[2][0]) / 2, y: pr(XR, YF, 6.8)[1], color: '#e8f0ff', power: .3, radius: 12 }, { squash: .3, core: false }); } }
    // ——— the ship's side on the left: inner planking running to the VP, frames between the ports, the ports ———
    const wall = [pr(XL, YC, .5), pr(XL, YC, ZB), pr(XL, YF, ZB), pr(XL, YF, .5)];
    { const g = nid('wg', u);
      bg += `<defs>${linGrad(g, 0, 0, 130, 0, [[0, '#4a2e18'], [.6, '#38220f'], [1, '#22150a']])}</defs><path d="${poly(wall)}" fill="url(#${g})"/>`;
      for (let y = YC + .2; y < YF; y += .2) bg += `<path d="M${P2(pr(XL, y, .5))}L${P2(pr(XL, y, ZB))}" stroke="#140a04" stroke-width="${f(.5 + (y + .4) * .1)}"/><path d="M${P2(pr(XL, y + .015, .5))}L${P2(pr(XL, y + .015, ZB))}" stroke="#8a5a32" stroke-width=".3" opacity=".35"/>`;
      // the waterway along the foot and the shelf under the beams
      bg += `<path d="${poly([pr(XL, YF - .14, .5), pr(XL, YF - .14, ZB), pr(XL + .14, YF, ZB), pr(XL + .14, YF, .5)])}" fill="#5a3a20" stroke="#140a04" stroke-width=".4"/>`;
      // the frames (riders) standing between the ports
      for (const z of [1.45, 3.3, 5.6, 7.95, 10.2]) { const a = pr(XL, YC, z), b = pr(XL, YF, z), w = Math.max(.6, FOC * .14 / z);
        bg += K.shadeBox(u, [{ pts: [[a[0], a[1]], [a[0] + w, a[1]], [b[0] + w, b[1]], [b[0], b[1]]], n: 'right', grain: [0, 1] }], L, 'oak', { seed: Math.round(z * 10), outline: .3 }); } }
    // the ports: the near one shows the fire outside; the far ones the bright day; their sills and far jambs lit
    const portQ = ([z0, z1]) => [pr(XL, PY[0], z0), pr(XL, PY[0], z1), pr(XL, PY[1], z1), pr(XL, PY[1], z0)];
    PORTS.forEach((pz, i) => {
      const q = portQ(pz), cid = nid('pc', u), [z0, z1] = pz, th = -.22;
      let view;
      if (i === 0) {
        view = K.sky(u, Lo, { horizon: HZ, stars: false }) + K.water(u, Lo, { horizon: HZ, bottom: 130, swell: .5, seed: 9, glitter: false })
          // the fire outside: the flash rolls out of the muzzle and fills the opening, its smoke behind it
          + K.smoke(u, L, { x: 64, y: 112, w: 30, h: 40, wind: -.5, seed: 4, opacity: .85, glow: { color: '#ffb050', power: .9 } })
          + (() => { const g = nid('bz', u); return `<defs>${radGrad(g, FL.x - 4, FL.y - 2, 30, [[0, '#ffffff', 1], [.18, '#fff4b8', 1], [.42, '#ffc23a', .95], [.7, '#ff7a1a', .75], [1, '#c83a0a', .35]])}</defs><rect x="${f(q[0][0] - 4)}" y="${f(q[1][1] - 4)}" width="30" height="56" fill="url(#${g})"/>`; })()
          + K.muzzleFlash(u, { x: FL.x + 2, y: FL.y, dir: 186, len: 52, seed: 1, smoke: false })
          + K.muzzleFlash(u, { x: FL.x + 1, y: FL.y - 3, dir: 166, len: 40, seed: 2, smoke: false });
      } else {
        const g = nid('pv', u); view = `<defs>${linGrad(g, 0, q[0][1], 0, q[3][1], [[0, '#d8e8f0'], [.35, '#eef2ea'], [.5, '#9ac0cc'], [1, '#3e7a8e']])}</defs><rect x="${f(q[0][0] - 2)}" y="${f(q[1][1] - 2)}" width="${f(q[2][0] - q[0][0] + 4)}" height="${f(q[3][1] - q[1][1] + 4)}" fill="url(#${g})"/>`;
      }
      bg += `<defs><clipPath id="${cid}"><path d="${poly(q)}"/></clipPath></defs><g clip-path="url(#${cid})">${view}</g>`;
      // the side's thickness: the sill seen from above and the far jamb seen in front, lit from outside
      const s0 = pr(XL, PY[1], z0), s1 = pr(XL, PY[1], z1), s2 = pr(XL + th, PY[1], z1), s3 = pr(XL + th, PY[1], z0);
      const j0 = pr(XL, PY[0], z1), j1 = pr(XL + th, PY[0], z1), j2 = pr(XL + th, PY[1], z1), j3 = pr(XL, PY[1], z1);
      const hot = i === 0, sillC = hot ? '#ffd28a' : '#b89a78', jambC = hot ? '#ff9a3a' : '#7a6248';
      bg += `<path d="${poly([s0, s1, s2, s3])}" fill="${sillC}" stroke="#1a0c06" stroke-width=".3"/><path d="${poly([j0, j1, j2, j3])}" fill="${jambC}" stroke="#1a0c06" stroke-width=".3"/>`
        + `<path d="${poly(q)}" fill="none" stroke="#0e0703" stroke-width="${f(Math.max(.5, 6 / z0))}"/>`;
      // daylight on the deck in front of the far ports
      if (!hot) { const c = pr(XL + .5, YF, (z0 + z1) / 2); bg += K.localGlow(u, { x: c[0], y: c[1], color: '#e0ecff', power: .35, radius: 30 / z0 * 2 }, { squash: .3, core: false }); }
    });
    // ——— the ceiling: deck planks overhead to the VP and the beams across ———
    { const cp = [pr(XL, YC, .4), pr(XL, YC, ZB), pr(XR, YC, ZB), pr(XR, YC, .4)];
      bg += `<path d="${poly(cp)}" fill="#1e120a"/>`;
      for (let x = XL; x <= XR; x += .26) bg += `<path d="M${P2(pr(x, YC, .4))}L${P2(pr(x, YC, ZB))}" stroke="#0a0503" stroke-width=".5"/>`;
      for (const z of [10.2, 7.95, 5.6, 3.9, 2.8, 2.0, 1.4, .95]) { const d = .22, a = pr(XL, YC, z), b = pr(XR, YC, z), c = pr(XR, YC + d, z), e = pr(XL, YC + d, z), a2 = pr(XL, YC + d, z + .26), b2 = pr(XR, YC + d, z + .26);
        bg += K.shadeBox(u, [{ pts: [e, c, b2, a2], n: 'bottom', grain: [1, 0] }, { pts: [a, b, c, e], n: 'front', grain: [1, 0] }], L, 'oak', { seed: Math.round(z * 7), outline: .35 }); } }

    // ——— the far guns at their ports (run out, waiting), small to the depth ———
    let mid = '';
    for (const z of [6.85, 4.55]) { const s = GA.s * GA.Z / z, base = pr(0, YF, z)[1], xm = pr(-1.35, 0, z)[0];
      mid += K.castShadow(u, L, { x: xm + 34 * s, y: base, w: 36 * s, h: 18 * s, horizon: HZ, d: .5 }) + K.cannon(u, L, { x: xm + 42 * s, y: base, s, flip: true, seed: Math.round(z) }); }
    // ——— the near gun: fired, recoiling; smoke from the muzzle back into the deck, a spurt from the vent ———
    { const x = MZ + 66.3 * GA.s / 1.7, y = pr(0, YF, GA.Z)[1];
      mid += K.castShadow(u, L, { x: x + 4, y, w: 36 * GA.s, h: 21 * GA.s, horizon: HZ, d: .5 }) + K.cannon(u, L, { x, y, s: GA.s, flip: true, recoil: GA.recoil, seed: 2 });
      mid += K.smoke(u, L, { x: MZ + 6, y: FL.y - 2, w: 34, h: 30, wind: .55, seed: 7, opacity: .7, glow: { color: '#ffb050', power: .8 } });
      const vx = x + 34, vy = 99;
      mid += K.smoke(u, L, { x: vx, y: vy, w: 16, h: 34, wind: .25, seed: 9, opacity: .75, glow: { color: '#ffb050', power: .6 } })
        + K.muzzleFlash(u, { x: vx, y: vy, dir: -92, len: 9, seed: 0, smoke: false }) + K.localGlow(u, { x: vx, y: vy - 2, color: '#ffd080', power: .7, radius: 8 }); }

    // ——— the keg (powder, branded) with the ledger open on its head; coins on the page; the clerk's hand ticking ———
    let fg = K.castShadow(u, L, { x: KEG.x, y: KEG.y, w: 21 * KEG.s, h: 30 * KEG.s, horizon: HZ, d: 1 }) + K.barrel(u, L, { x: KEG.x, y: KEG.y, s: KEG.s, kind: 'powder', seed: 4 });
    // the Company's brand burnt into the keg: a ring, a cross in it, four dots (a mark, not letters)
    { const c = [KEG.x - 2, KEG.y - 36], r = 6;
      fg += `<g opacity=".85"><circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="none" stroke="#0e0604" stroke-width="1.1"/><path d="M${c[0] - r * .66} ${c[1]}h${r * 1.32}M${c[0]} ${c[1] - r * .66}v${r * 1.32}" stroke="#0e0604" stroke-width="1"/>`
        + [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => `<circle cx="${f(c[0] + a * r * .38)}" cy="${f(c[1] + b * r * .38)}" r=".8" fill="#0e0604"/>`).join('') + `</g>`
        + `<circle cx="${c[0]}" cy="${c[1]}" r="${r + .8}" fill="none" stroke="#c88a50" stroke-width=".3" opacity=".4"/>`; }
    fg += ledger(u, L, R);
    fg += hand(u, L);
    // ——— the lantern under a beam; the flash's light over the deck; smoke haze; the dark round the edges ———
    let air = K.lantern(u, L, { ...LAMP, lit: true, seed: 6 }) + K.localGlow(u, { x: LAMP.x, y: LAMP.y - 8, color: '#ffc070', power: .75, radius: 18 });
    { const Rs = rng(5); air += Array.from({ length: 22 }, () => { const x = FL.x + 2 + Rs() * 40, y = FL.y - 16 + Rs() * 30, l = .8 + Rs() * 2; return `<path d="M${f(x)} ${f(y)}l${f(l)} ${f(-l * .3)}" stroke="${Rs() > .5 ? '#ffe9a0' : '#ffb050'}" stroke-width="${f(.3 + Rs() * .3)}" stroke-linecap="round"/>`; }).join(''); }
    air += K.localGlow(u, { x: FL.x - 2, y: FL.y - 6, color: '#ffd890', power: 1, radius: 30 }) + K.localGlow(u, { x: FL.x + 6, y: FL.y - 4, color: '#ffc070', power: .95, radius: 60 }) + K.localGlow(u, { x: FL.x + 30, y: 136, color: '#ffa850', power: .45, radius: 60 }, { squash: .3, core: false })
      + shafts(u, FL.x, FL.y, [[100, 290, 150, 290]], '#ffc080', .06) + motes(24, 80, 70, 70, 60, '#ffd8a0', 5)
      + gloom(u, 100, 100, 210, 20, .25) + gloom(u, 100, 130, 100, 280, .55);
    return [bg, mid + fg + air];
  } };

/** The ledger: a thick account book lying open on the keg's head, seen from above at an angle — boards, the block of
 *  pages, ruled columns, lines of strokes (no letters), a column of ticks with the newest wet; coins on the left page,
 *  an inkwell on the keg's rim behind. */
function ledger(u, L, R) {
  const Lp = [[138, 111.6], [164, 109.6], [165.6, 121.4], [134.6, 124.4]], Rp = [[164, 109.6], [190, 111], [194.6, 124], [165.6, 121.4]];
  let s = '';
  // the boards and the page block under the open pages
  s += `<path d="${poly([[Lp[0][0] - 1.2, Lp[0][1] + .2], [Rp[1][0] + 1.2, Rp[1][1] + .2], [Rp[2][0] + 1.6, Rp[2][1] + 3.6], [165.6, 125.4], [Lp[3][0] - 1.6, Lp[3][1] + 3.6]])}" fill="#3a1a10" stroke="#120604" stroke-width=".4"/>`
    + `<path d="${poly([Lp[3], [165.6, 121.4], Rp[2], [Rp[2][0], Rp[2][1] + 2.6], [165.6, 124], [Lp[3][0], Lp[3][1] + 2.6]])}" fill="#d8ccae" stroke="#7a6a50" stroke-width=".25"/>`
    + [.9, 1.8].map(d => `<path d="M${P2([Lp[3][0], Lp[3][1] + d])}L${P2([165.6, 121.4 + d])}L${P2([Rp[2][0], Rp[2][1] + d])}" stroke="#a09070" stroke-width=".2" fill="none"/>`).join('');
  const page = (Q, a, b) => { const g = nid('lp', u); return `<defs>${linGrad(g, Q[0][0], Q[0][1], Q[2][0], Q[2][1], [[0, a], [1, b]])}</defs><path d="M${P2(Q[0])}Q${f((Q[0][0] + Q[1][0]) / 2)} ${f(Math.min(Q[0][1], Q[1][1]) - 1.4)} ${P2(Q[1])}L${P2(Q[2])}Q${f((Q[2][0] + Q[3][0]) / 2)} ${f(Math.max(Q[2][1], Q[3][1]) - .6)} ${P2(Q[3])}Z" fill="url(#${g})" stroke="#8a7a5a" stroke-width=".3"/>`; };
  s += page(Lp, '#efe4c8', '#fff4dc') + page(Rp, '#fff6e2', '#ead9b8');
  const at = (Q, u2, v) => [lerp(lerp(Q[0][0], Q[1][0], u2), lerp(Q[3][0], Q[2][0], u2), v), lerp(lerp(Q[0][1], Q[1][1], u2), lerp(Q[3][1], Q[2][1], u2), v)];
  // ruled columns (red) and the rows; on the left page lines of strokes, on the right the tally column of ticks
  for (const [Q, cols] of [[Lp, [.12, .7, .84]], [Rp, [.08, .34, .48]]]) { for (const c of cols) s += `<path d="M${P2(at(Q, c, .08))}L${P2(at(Q, c, .94))}" stroke="#b03a2a" stroke-width=".25" opacity=".7"/>`;
    for (let k = 1; k < 9; k++) s += `<path d="M${P2(at(Q, .04, k / 9))}L${P2(at(Q, .96, k / 9))}" stroke="#8aa0b0" stroke-width=".15" opacity=".6"/>`; }
  for (let k = 1; k < 9; k++) { const a = at(Lp, .15, k / 9 - .03), b = at(Lp, .2 + R() * .45, k / 9 - .03); s += `<path d="M${P2(a)}L${P2(b)}" stroke="#3a2a1c" stroke-width=".3" stroke-dasharray="${f(.8 + R())} .4 ${f(.5 + R())} .4" opacity=".8"/>`;
    const c = at(Lp, .73, k / 9 - .03); s += `<path d="M${P2(c)}l1.6 -.1" stroke="#3a2a1c" stroke-width=".3"/>`; }
  for (let k = 1; k < 8; k++) { const a = at(Rp, .52, k / 9 - .03), b = at(Rp, .6 + R() * .3, k / 9 - .03); s += `<path d="M${P2(a)}L${P2(b)}" stroke="#3a2a1c" stroke-width=".3" stroke-dasharray="${f(.8 + R())} .4 ${f(.5 + R())} .4" opacity=".8"/>`;
    // a tick in the column for every ball fired; the newest (row 7) still wet and glossy
    const t = at(Rp, .41, k / 9 - .03); s += `<path d="M${f(t[0] - .9)} ${f(t[1] - .4)}l.7 .9l1.6 -1.9" stroke="${k === 7 ? '#0a0604' : '#3a2a1c'}" stroke-width="${k === 7 ? .5 : .35}" fill="none" stroke-linecap="round"/>`; }
  // the ribbon, the coins on the left page, the inkwell on the keg's rim behind the book
  s += `<path d="M164.6 110q.4 6 -1 13.6l1.2 -.6l.6 1.4" stroke="#a81a14" stroke-width=".8" fill="none"/>`;
  s += K.coins(u, L, { x: 146, y: 116.8, s: .9, n: 6, seed: 3 });
  { const ix = 182, iy = 109.6; s += `<path d="M${ix - 3.4} ${iy}q-.6 -4.6 2 -5.2h2.8q2.6 .6 2 5.2z" fill="#14202c" stroke="#05080c" stroke-width=".4"/><ellipse cx="${ix}" cy="${iy - 5.2}" rx="1.8" ry=".6" fill="#05080c"/><path d="M${ix - 2.4} ${iy - 1.6}q.6 -2.4 1.4 -3" stroke="#9ab8d8" stroke-width=".35" fill="none" opacity=".6"/>`; }
  return s;
}

/** The clerk's hand from the right edge: a black sleeve with a white cuff and a frill, the fingers round a goose quill,
 *  its nib on the newest tick, the feather up behind the hand. */
function hand(u, L) {
  const wr = [185.2, 115.1], a = 196, s = 1.2;
  const sleeve = { lit: '#4a4e5a', half: '#22242c', core: '#1a1c22', shadow: '#0a0a0e', outline: '#050506' }, cuff = { lit: '#fffaf0', half: '#e8e0d0', shadow: '#a8a090', outline: '#5a5448' };
  let o = H.cloth(u, { spine: [[226, 136], [210, 128], [wr[0] + 3, wr[1] + .6]], w: [17, 15, 12], tone: sleeve, lit: -1, rim: '#ffcf96', rimSide: -1, cuff: { from: .74, k: 1.18, tone: cuff }, seed: 5, drapes: 2, sw: .4 });
  // the frill of the shirt falling over the back of the hand
  o += `<path d="M${f(wr[0] + 4)} ${f(wr[1] - 5)}q-3 1 -4 3.6q2 .4 3 2.2q-2.4 .6 -3 3q3 .4 4.6 -1.6z" fill="#f4eee0" stroke="#7a7466" stroke-width=".3"/>`;
  const hd = H.hand(u, { at: wr, a, s, m: 1, pose: 'grip', tone: SKIN, sw: .35 });
  // the quill across the fist: the nib down on the page at the newest tick, the barrel up through the fingers, the
  // feather sweeping up and right
  const g = hd.P(6, 0), ang = (a + 90) * Math.PI / 180, ux = -Math.cos(ang), uy = -Math.sin(ang);   // u: from the fist down to the nib
  const nib = [g[0] + ux * 6.4, g[1] + uy * 6.4], top = [g[0] - ux * 20, g[1] - uy * 20];
  const qs = `<path d="M${P2(nib)}L${P2(g)}L${P2(top)}" stroke="#e8dcc0" stroke-width=".8" fill="none" stroke-linecap="round"/><path d="M${P2(nib)}l${f(-ux * 1.6)} ${f(-uy * 1.6)}" stroke="#2a1c10" stroke-width=".7"/>`
    + `<path d="M${P2([g[0] - ux * 6, g[1] - uy * 6])}Q${f(top[0] + 5)} ${f(top[1] + 6)} ${f(top[0] + 1.6)} ${f(top[1] - 1)}Q${f(top[0] - 2)} ${f(top[1] + 3)} ${P2([g[0] - ux * 7, g[1] - uy * 7])}Z" fill="#f6f0e2" stroke="#a8a090" stroke-width=".3"/>`
    + Array.from({ length: 6 }, (_, k) => { const t = .3 + k * .12, p = [lerp(g[0] - ux * 6, top[0], t), lerp(g[1] - uy * 6, top[1], t)]; return `<path d="M${P2(p)}l${f(2.6 - k * .2)} ${f(1 - k * .1)}" stroke="#c8c0b0" stroke-width=".2"/>`; }).join('');
  o += hd.back + qs + hd.front;
  return o;
}
