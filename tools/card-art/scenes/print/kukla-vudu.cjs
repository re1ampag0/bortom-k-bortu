// «Кукла вуду» (Месть королевы Анны, ПРИКАЗ: выбранный вражеский корабль в свой следующий ход получает 1 урон по
// Команде за каждую разыгранную карту), refined from the first-round scene (portrait-revenge.cjs SCENES['Кукла вуду']):
// Blackbeard's cabin at night. A burlap doll with button eyes and twine for hair sits on the table, leaning on a big
// bottle; long pins stand in it, the one with the red head in its chest. A single tallow candle on the left of the
// table is the one light, and it throws the doll's shadow, huge, up the back wall. Glass vials hang on strings from
// the ceiling beam.
// Fixed against the first round: the cabin was a flat wall — now a room in 2.5D (back wall, side walls, ceiling and
// the table top running to one vanishing point at eye level); the vials hung from nothing — now on strings from the
// beam; the doll was a flat cut-out — now it has volume (each part shaded from the candle), seams, a twine collar,
// a crimson sash; its wall shadow is the true projection of the doll and the bottle from the flame; the stray little
// things (bones, dots of salt, herbs, the second candle) are gone.
// Light: the candle (key, warm, low on the left); a dim red-violet fill.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, gloom, motes } = PK;

const HZ = 46, VX = 100;                     // eye level, the vanishing point
const WL = 20, WR = 180, WT = 8, WB = 84;   // the back wall; WB — the table's back edge against it
const CAN = { x: 40, y: 119, s: 2.1, len: 11 };
const FL = K.candle.local(CAN);              // the flame
const D = { x: 94, y: 108, s: 1 };           // the doll: the middle of its seat on the table, its scale
const BOT = { x: 123, y: 96, s: 2.2 };      // the bottle behind it
const SHK = 1.62;                            // how much bigger the shadow is on the wall (the wall is that much further from the flame)
const light = { time: 'night', haze: .3, key: { type: 'point', x: FL.x, y: FL.y, h: .38, gy: CAN.y, color: '#ffb45a', power: 1, radius: 120 },
  fill: { color: '#3a1a30', power: .35 } };
const skel = { horizon: HZ, eye: .9, light: 'one tallow candle on the table, left (key); dim red-violet fill', items: [
  ['back wall', WL, WB, WR - WL, WB - WT, 'side walls, ceiling'], ['table top', 0, 290, 200, 290 - WB, 'the room'],
  ['candle', CAN.x - 9, CAN.y, 18, 46, 'table top'], ['bottle', BOT.x - 10, BOT.y, 20, 46, 'table top'],
  ['doll', D.x - 34, D.y + 14, 66, 98, 'table top, leaning on the bottle'], ['pins', 66, 98, 60, 60, 'stuck in the doll'],
  ['vials', 46, 48, 132, 36, 'strings from the ceiling beam'], ['wall shadow', 80, 84, 100, 84, 'projection from the flame onto the back wall']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, x) => { const t = (x - VX) / (p[0] - VX); return [x, HZ + (p[1] - HZ) * t]; };   // along the ray from the VP through p, to the abscissa x
const T = (lx, ly) => [D.x + lx * D.s, D.y + ly * D.s];                                                // the doll's local point in the picture

// ——— the doll's shapes (local units: x right, y up is negative, the seat at 0, 0) ———
function capsule(p, q, w) {
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), n = [-dy / l * w / 2, dx / l * w / 2], r = w / 2;
  return `M${f(p[0] + n[0])} ${f(p[1] + n[1])}L${f(q[0] + n[0])} ${f(q[1] + n[1])}A${f(r)} ${f(r)} 0 0 0 ${f(q[0] - n[0])} ${f(q[1] - n[1])}L${f(p[0] - n[0])} ${f(p[1] - n[1])}A${f(r)} ${f(r)} 0 0 0 ${f(p[0] + n[0])} ${f(p[1] + n[1])}Z`;
}
const ell = (cx, cy, rx, ry, a = 0) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), p = t => [cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c];
  const a0 = p(0), a1 = p(Math.PI); return `M${P2(a0)}A${f(rx)} ${f(ry)} ${f(a)} 1 1 ${P2(a1)}A${f(rx)} ${f(ry)} ${f(a)} 1 1 ${P2(a0)}Z`; };
const PARTS = {
  armL: { d: capsule([-12, -41], [-29, -24], 9.5), c: [-21, -32], r: 8 },
  armR: { d: capsule([12, -41], [28, -31], 9.5), c: [21, -36], r: 8 },
  torso: { d: 'M-17 -5C-19.5 -22 -17.5 -38 -12 -46C-6 -50.5 6 -50.5 12 -46C17.5 -38 19.5 -22 17 -5C10 -1 -10 -1 -17 -5Z', c: [0, -26], r: 22 },
  legL: { d: ell(-10.5, 1, 7.4, 10.5, 14), c: [-10.5, 1], r: 9 },
  legR: { d: ell(11, 1.6, 7.4, 10.5, -12), c: [11, 1.6], r: 9 },
  head: { d: ell(0, -63, 15.5, 15), c: [0, -63], r: 15.5 },
};
const SOLES = [[-13.4, 9.6, 6.2, 4.6, 14], [14, 10, 6.2, 4.6, -12]];

module.exports = { name: 'Кукла вуду', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .9 }), R = rng(23);
    // ——— the ceiling: dark planks overhead, the beams running to the vanishing point ———
    const cTL = toward([WL, WT], -10), cTR = toward([WR, WT], 210);
    let bg = `<path d="M${P2(cTL)}L${WL} ${WT}L${WR} ${WT}L${P2(cTR)}Z" fill="#140806"/>`;
    for (const x of [34, 67, 100, 133, 166]) { const a = [x, WT], b = [VX + (x - VX) * ((-10 - HZ) / (WT - HZ)), -10], w = 2.4 + Math.abs(x - VX) * .03;
      bg += `<path d="M${P2(a)}L${P2(b)}" stroke="#2c160c" stroke-width="${f(w)}"/><path d="M${f(a[0] + (x < VX ? w * .4 : -w * .4))} ${a[1]}L${f(b[0] + (x < VX ? w * .7 : -w * .7))} ${b[1]}" stroke="#6a3a20" stroke-width=".5" opacity=".6"/>`; }
    // the side walls: dark planking, edges to the vanishing point
    { const lb = toward([WL, WB + 30], -10), rb = toward([WR, WB + 30], 210);
      bg += `<path d="M${P2(cTL)}L${WL} ${WT}L${WL} ${WB + 30}L${P2(lb)}Z" fill="#1e0e08"/><path d="M${P2(cTR)}L${WR} ${WT}L${WR} ${WB + 30}L${P2(rb)}Z" fill="#170a06"/>`;
      for (const y of [32, 48, 64, 80, 96]) { const a = toward([WL, y], -10), b = toward([WR, y], 210); bg += `<path d="M${WL} ${y}L${P2(a)}" stroke="#0a0403" stroke-width=".7"/><path d="M${WR} ${y}L${P2(b)}" stroke="#0a0403" stroke-width=".7"/>`; } }
    // the back wall: vertical planks of dark oak warmed by the candle
    { const g = nid('wl', u);
      bg += woodTex(u, WL, WT, WR - WL, WB + 30 - WT, '#4c2618', '#26120a', '#0c0503', 11, true, 21)
        + `<defs>${radGrad(g, FL.x + 62, FL.y - 34, 150, [[0, '#ffb060', .6], [.4, '#ff9040', .34], [.75, '#ff8a3a', .1], [1, '#ff8a3a', 0]])}</defs><rect x="${WL}" y="${WT}" width="${WR - WL}" height="${WB + 30 - WT}" fill="url(#${g})"/>`
        + `<path d="M${WL} ${WT}V${WB + 30}M${WR} ${WT}V${WB + 30}" stroke="#080302" stroke-width="1.2"/>`; }
    // ——— the doll's (and the bottle's) shadow on the back wall: the doll scaled about the flame, soft-edged ———
    { const cl = nid('ws', u), bl = nid('wb', u), body = Object.values(PARTS).map(p => `<path d="${p.d}"/>`).join('') + SOLES.map(s => `<path d="${ell(...s)}"/>`).join('')
        + [-150, -120, -95, -70, -45, -25].map(a => { const r = a * Math.PI / 180; return `<path d="M${f(Math.cos(r) * 13)} ${f(-63 + Math.sin(r) * 13)}l${f(Math.cos(r) * 8)} ${f(Math.sin(r) * 9)}" stroke="#000" stroke-width="2"/>`; }).join('')
        + `<path d="M-4 -34l-11 -16" stroke="#000" stroke-width="1"/><circle cx="-15.5" cy="-51" r="3.6"/>`;
      const bt = `M${BOT.x - 11} ${BOT.y}V${BOT.y - 26}Q${BOT.x - 10} ${BOT.y - 34} ${BOT.x - 3.4} ${BOT.y - 36}V${BOT.y - 50}H${BOT.x + 3.4}V${BOT.y - 36}Q${BOT.x + 10} ${BOT.y - 34} ${BOT.x + 11} ${BOT.y - 26}V${BOT.y}Z`;
      bg += `<defs><clipPath id="${cl}"><rect x="${WL}" y="${WT}" width="${WR - WL}" height="${WB - WT}"/></clipPath><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>`
        + `<g clip-path="url(#${cl})"><g filter="url(#${bl})" opacity=".85" fill="#0a0302"><g transform="translate(${f(FL.x)} ${f(FL.y)}) scale(${SHK}) translate(${f(-FL.x)} ${f(-FL.y)})">`
        + `<path d="${bt}"/><g transform="translate(${D.x} ${D.y}) scale(${D.s})">${body}</g></g></g></g>`; }
    // the ceiling beam across the room at the top of the back wall: the front face and its underside
    { const y0 = WT - 2, y1 = WT + 5.4; bg += K.shadeBox(u, [{ pts: [[-10, y1], [210, y1], [210, y1 + 2.2], [-10, y1 + 2.2]], n: 'bottom', grain: [1, 0] }, { pts: [[-10, y0], [210, y0], [210, y1], [-10, y1]], n: 'front', grain: [1, 0] }], L, 'oak', { seed: 4, outline: .4 }); }
    // ——— the vials: blown glass on strings from the beam, a cork, something dark inside ———
    const vial = (x, len, s, col, glowC, seed) => {
      const top = [x, WT + 7.6 + len], bot = [x + .4, WT + 7.6 + len + 17 * s];
      let o = `<path d="M${x} ${WT + 6.6}L${x} ${f(top[1] - 1.6 * s)}" stroke="#b09a72" stroke-width=".45"/><circle cx="${x}" cy="${WT + 7.2}" r=".9" fill="url(#iron${u})"/>`;
      o += `<path d="M${f(x - 1.6 * s)} ${f(top[1] - .4 * s)}q${f(1.6 * s)} ${f(-2 * s)} ${f(3.2 * s)} 0" stroke="#b09a72" stroke-width=".4" fill="none"/>`;
      const g = K.propLathe(u, L, 'glass', top, bot, [[0, 1.3 * s], [.22, 1.25 * s], [.3, 1.7 * s], [.44, 3.6 * s], [.62, 4.4 * s], [.9, 4.3 * s], [1, 3.4 * s]], { ell: .3, opacity: .62, spec: [.3, .9] });
      const lt = lerp(top[1], bot[1], .52);
      o += `<g clip-path="url(#${g.clip})"><rect x="${f(x - 6 * s)}" y="${f(lt)}" width="${f(12 * s)}" height="${f(bot[1] - lt + 2)}" fill="${col}" opacity=".85"/><ellipse cx="${f(x)}" cy="${f(lt)}" rx="${f(4.2 * s)}" ry="${f(1 * s)}" fill="${mix(col, '#ffffff', .25)}" opacity=".7"/></g>` + g.svg;
      o += K.shadeCyl(u, x, top[1] + 1.2 * s, x, top[1] - 1.8 * s, 1.15 * s, L, 'pine-deck', { ell: .3, face: 2, outline: .3, grain: false, seed });
      if (glowC) o += K.localGlow(u, { x: x, y: lerp(lt, bot[1], .5), color: glowC, power: .45, radius: 9 * s }, { core: false });
      return o; };
    let mid = vial(52, 8, 1, '#7a1410', null, 1) + vial(146, 16, 1.1, '#2e5a2a', '#7aff8a', 2) + vial(170, 4, 1.25, '#a06a1c', null, 4);
    // ——— the table top: planks to the vanishing point, the candle's pool on them ———
    mid += K.deck(u, L, { horizon: HZ, top: WB, bottom: 290, vx: VX, kind: 'oak', plank: 14, seed: 6 })
      + `<path d="M0 ${WB}H200" stroke="#0a0402" stroke-width="1.6"/>`;
    // cast shadows on the table from the candle, the contact shadows
    mid += K.castShadow(u, L, { x: BOT.x, y: BOT.y, w: 20, h: 44, horizon: HZ, d: 1 }) + K.castShadow(u, L, { x: D.x + 2, y: D.y, w: 36, h: 44, horizon: HZ, d: .8 });
    // the bottle: dark green glass, rum to the shoulder
    mid += K.bottle(u, L, { x: BOT.x, y: BOT.y, s: BOT.s, kind: 'rum', seed: 3 });
    // ——— the doll ———
    { const pat = nid('bp', u), lx = FL.x - D.x, ly = FL.y - D.y, ll = Math.hypot(lx, ly), lv = [lx / ll, ly / ll];   // the light's direction in the doll's frame
      let dl = `<defs><pattern id="${pat}" width="1.5" height="1.5" patternUnits="userSpaceOnUse"><rect width="1.5" height="1.5" fill="#b38e58"/><path d="M0 .4H1.5" stroke="#6e5230" stroke-width=".42"/><path d="M.9 0V1.5" stroke="#7d5e36" stroke-width=".38"/><path d="M0 1.15H1.5" stroke="#d2ae74" stroke-width=".18" opacity=".7"/></pattern></defs>`;
      const shade = (p, k = 1) => { const g = nid('ds', u), c = [p.c[0] + lv[0] * p.r * .45, p.c[1] + lv[1] * p.r * .45];
        return `<defs>${radGrad(g, c[0], c[1], p.r * 1.75 * k, [[0, '#ffd296', .32], [.32, '#ffb060', .06], [.55, '#200a02', .12], [.85, '#160602', .62], [1, '#0c0301', .8]])}</defs><path d="${p.d}" fill="url(#${pat})"/><path d="${p.d}" fill="url(#${g})"/><path d="${p.d}" fill="none" stroke="#2a1606" stroke-width=".55"/>`; };
      const xst = (pts) => pts.map(([x, y]) => `<path d="M${f(x - 1)} ${f(y - 1)}l2 2M${f(x + 1)} ${f(y - 1)}l-2 2" stroke="#2a1606" stroke-width=".42" stroke-linecap="round"/>`).join('');
      // the arms first (their roots under the body), the right one resting on the bottle
      dl += shade(PARTS.armL) + shade(PARTS.armR) + xst([[-20, -36.5], [-24, -32], [-28, -27.4]]) + xst([[19, -40.6], [23.6, -37.6], [27.6, -34.6]]);
      dl += shade(PARTS.torso);
      // the seams down the sides of the body, cross-stitched
      dl += xst(Array.from({ length: 6 }, (_, k) => [-16 + (k < 3 ? -.6 : 0), -42 + k * 6.4])) + xst(Array.from({ length: 6 }, (_, k) => [16.2, -42 + k * 6.4]));
      // the crimson sash round the waist, knotted on the right, two tails
      { const g = nid('sh', u);
        dl += `<defs>${linGrad(g, -18, 0, 18, 0, [[0, '#d2402a', 1], [.35, '#a8221a', 1], [.75, '#5e0e0c', 1], [1, '#3a0806', 1]])}</defs>`
          + `<path d="M-18.6 -24Q0 -19.6 18.4 -24L18.8 -17Q0 -12.4 -18.8 -17Z" fill="url(#${g})" stroke="#2a0604" stroke-width=".5"/>`
          + `<path d="M-17 -21.6Q0 -17.6 17 -21.6" stroke="#ff8a62" stroke-width=".4" fill="none" opacity=".6"/><path d="M-16 -18Q0 -14 16 -18" stroke="#2a0604" stroke-width=".35" fill="none" opacity=".6"/>`
          + `<path d="M12.4 -19.6l4.6 13.6l3.4 -1.4l-4 -12.6z" fill="#7a1410" stroke="#2a0604" stroke-width=".45"/><path d="M14.4 -19.4l9 10.4l2.6 -2.4l-8.6 -9z" fill="#94201a" stroke="#2a0604" stroke-width=".45"/>`
          + `<ellipse cx="14.6" cy="-20" rx="3.4" ry="2.8" fill="#8a1c14" stroke="#2a0604" stroke-width=".5"/><path d="M12.8 -21.2q1.8 -1 3.4 .2" stroke="#ff8a62" stroke-width=".35" fill="none" opacity=".7"/>`; }
      // the legs stretched out towards us, their round soles sewn on
      for (const [k, s] of [['legL', SOLES[0]], ['legR', SOLES[1]]]) {
        dl += shade(PARTS[k]);
        const g = nid('so', u);
        dl += `<defs>${radGrad(g, s[0] - 2, s[1] - 1, 8, [[0, '#cba26a', 1], [.6, '#8a6838', 1], [1, '#4a3418', 1]])}</defs><path d="${ell(...s)}" fill="url(#${g})" stroke="#2a1606" stroke-width=".5"/>`
          + Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, c = Math.cos(s[4] * Math.PI / 180), sn = Math.sin(s[4] * Math.PI / 180), ex = s[2] * .82 * Math.cos(a), ey = s[3] * .82 * Math.sin(a);
            return `<path d="M${f(s[0] + ex * c - ey * sn)} ${f(s[1] + ex * sn + ey * c)}l${f(Math.cos(a) * 1.2)} ${f(Math.sin(a) * 1.2)}" stroke="#2a1606" stroke-width=".4"/>`; }).join(''); }
      // the head: a twine collar at the neck first, then the head
      dl += `<path d="M-8.4 -51.4Q0 -48.4 8.4 -51.4L8.8 -46.4Q0 -43.4 -8.8 -46.4Z" fill="#8a6a3a" stroke="#2a1606" stroke-width=".45"/>`
        + [-6.5, -3.5, -.5, 2.5, 5.5].map(x => `<path d="M${x} -50l2.4 4.2" stroke="#c8a870" stroke-width=".8"/>`).join('');
      dl += shade(PARTS.head) + `<path d="M0 -78Q2.4 -63 0 -48.4" stroke="#2a1606" stroke-width=".35" fill="none" opacity=".5"/>`;
      // the hair: coarse twine, each strand a darker cord with a light lay
      { const Rh = rng(9); for (let i = 0; i < 17; i++) { const a = (-168 + i * 9.5 + (Rh() - .5) * 4) * Math.PI / 180, r0 = 14.4, l = 7 + Rh() * 6, bend = (Rh() - .5) * 6;
          const p0 = [Math.cos(a) * r0, -63 + Math.sin(a) * r0], p2 = [Math.cos(a) * (r0 + l), -63 + Math.sin(a) * (r0 + l) + 2.4], p1 = [(p0[0] + p2[0]) / 2 + bend * -Math.sin(a), (p0[1] + p2[1]) / 2 + bend * Math.cos(a)];
          const d = `M${P2(p0)}Q${P2(p1)} ${P2(p2)}`;
          dl += `<path d="${d}" stroke="#3a2610" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${i < 8 ? '#e2c08a' : '#a8844e'}" stroke-width=".9" fill="none" stroke-linecap="round"/>`
            + `<circle cx="${f(p2[0])}" cy="${f(p2[1])}" r=".7" fill="${i < 8 ? '#e8cc9a' : '#9a7a48'}"/>`; } }
      // the eyes: two odd buttons sewn on with a cross of red thread; the mouth sewn shut
      const button = (x, y, r, c, holes, seed) => { const g = nid('bt', u);
        return `<defs>${radGrad(g, x - r * .4, y - r * .4, r * 1.5, [[0, mix(c, '#ffffff', .35), 1], [.45, c, 1], [1, mix(c, '#000000', .6), 1]])}</defs><circle cx="${x}" cy="${y + .5}" r="${r}" fill="#160a04" opacity=".55"/>`
          + `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="#0a0604" stroke-width=".45"/><circle cx="${x}" cy="${y}" r="${f(r * .72)}" fill="none" stroke="${mix(c, '#000000', .5)}" stroke-width=".4"/>`
          + holes.map(([hx, hy]) => `<circle cx="${f(x + hx * r)}" cy="${f(y + hy * r)}" r="${f(r * .13)}" fill="#050302"/>`).join('')
          + (holes.length === 4 ? `<path d="M${f(x - .3 * r)} ${f(y - .3 * r)}L${f(x + .3 * r)} ${f(y + .3 * r)}M${f(x + .3 * r)} ${f(y - .3 * r)}L${f(x - .3 * r)} ${f(y + .3 * r)}" stroke="#c8281c" stroke-width=".55"/>` : `<path d="M${f(x - .3 * r)} ${f(y)}L${f(x + .3 * r)} ${f(y)}" stroke="#c8281c" stroke-width=".6"/>`)
          + `<path d="M${f(x - r * .7)} ${f(y - r * .2)}A${f(r * .75)} ${f(r * .75)} 0 0 1 ${f(x - r * .1)} ${f(y - r * .72)}" stroke="#ffffff" stroke-width=".45" fill="none" opacity=".55"/>`; };
      dl += button(-6, -64.5, 4, '#26201c', [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) + button(6.4, -63.4, 3.3, '#6a3e1e', [[-.3, 0], [.3, 0]]);
      dl += `<path d="M-6.6 -55Q0 -52.4 6.6 -55.2" stroke="#2a1606" stroke-width=".8" fill="none"/>` + [-5, -2.5, 0, 2.5, 5].map((x, i) => `<path d="M${x} ${f(-55.6 + Math.abs(x) * .05 - (i % 2) * .1 + 1.4)}v-2.8" stroke="#3a1a0a" stroke-width=".55"/>`).join('');
      mid += K.contactShadow(u, D.x, D.y + 12, 40, L, { ry: 3, opacity: .85 }) + `<g transform="translate(${D.x} ${D.y}) scale(${D.s})">${dl}</g>`; }
    // ——— the pins: steel shafts, glass heads; the one with the red head in the doll's chest ———
    const pin = (e, dir, len, kind, r, seed) => { const a = T(...e), l = Math.hypot(...dir), v = [dir[0] / l, dir[1] / l], b = [a[0] + v[0] * len, a[1] + v[1] * len];
      return `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="1" fill="#1a0a02" opacity=".7"/><path d="M${f(a[0] - v[1] * 1.6)} ${f(a[1] + v[0] * 1.6)}L${f(a[0] + v[1] * 1.6)} ${f(a[1] - v[0] * 1.6)}" stroke="#2a1606" stroke-width=".3" opacity=".6"/>`
        + `<path d="M${P2(a)}L${P2(b)}" stroke="#2c3236" stroke-width="1.05" stroke-linecap="round"/><path d="M${P2(a)}L${P2(b)}" stroke="#c8d2d8" stroke-width=".45" stroke-linecap="round" transform="translate(-.25 -.15)"/>`
        + K.shadeSphere(u, b[0], b[1], r, L, kind, { outline: .3, seed }); };
    mid += pin([-21, -30], [-.45, -1], 15, 'bone', 2, 1) + pin([9, -73], [.6, -1], 14, 'tar', 2.1, 2) + pin([11, -26], [1, -.32], 15, 'paint-ochre', 2, 3) + pin([-12, 3], [-1, -.1], 13, 'bone', 1.9, 4);
    mid += pin([-5, -35], [-.62, -1], 26, 'paint-red', 3.8, 5);
    // ——— the candle: tallow in a brass stick on the left of the table, the one light ———
    mid += K.candle(u, L, { ...CAN, seed: 2 });
    // ——— the light: the flame's glow, the dark round the room, a few motes in the warm air ———
    let fg = K.localGlow(u, { x: FL.x, y: FL.y, color: '#ffbe6a', power: .8, radius: 46 }) + K.localGlow(u, { x: D.x - 14, y: D.y - 36, color: '#ff9a4a', power: .2, radius: 60 }, { core: false })
      + motes(16, 24, 60, 60, 50, '#ffd8a0', 7)
      + gloom(u, FL.x, FL.y, 205, -10, .3, '#0c0408') + gloom(u, 100, 100, 100, 200, .45, '#0c0408');
    return [bg, mid + fg];
  } };
