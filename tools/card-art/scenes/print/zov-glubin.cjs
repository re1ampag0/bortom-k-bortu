// «Зов глубин» (Голландец, ЗАРЯД: если цель в этот ход уже получила урон, этот Залп наносит +2 урона), method A: the
// first-round scene (portrait-dutch.cjs SCENES['Зов глубин']) at its best. The concept stays: a stormy night, the
// already wounded enemy, and the sea itself rising out of the dark to take her. Brief (card-briefs.md «Зов глубин»):
// the enemy is already holed and heels over; out of the black water round her pale ghostly arms rise and reach for
// the breach, dark shapes gather under the surface; the Dutchman fires after her from the fog. Find: the breach and
// the reaching hands. Unlike «Калёные ядра» — no fire: here it is the wound and the sea.
// Fixed against the first round: the tentacle was one rubber hose wound round a pasted ship, and the enemy burned
// (fire is «Калёные ядра») — now the kit's ship lists towards us with a ragged breach in her side at the waterline,
// splintered planks bent inward, the sea pouring in; the deep reaches for it with drowned ghostly arms (proper
// hands, each its own gesture), the biggest in front; the Dutchman is a real ship in the fog behind, her gun flashing.
// Review fix (verdict-b1): the breach read as a mouth with teeth — now 1.5× bigger, forward on her lower side, its
// edge stepped and uneven (planks broken at different lengths), the torn ends dark brown, bent inward at different
// angles, only the fresh break at each tip pale; dark sea runs in over the lower lip. She is down by the head 10°
// (heel 10), the holed side lower. The arms (ghostArm redone): an elbow, broad blurred base melting into mist at the
// water, a wrist thinner than the forearm, more transparent towards the sea, a light rim; fingers hooked to grab
// the breach. Four big planks (a port or two long) afloat between the arms.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const HZ = 86;
const EN = { kind: 'endeavour', x: 120, y: 106, scale: .8, flip: true, heel: 10, roll: 18 };  // the enemy, bow right, listing to us and down by the head (the holed side)
const DU = { kind: 'dutch', x: 36, y: HZ + 1.6, scale: .42, flip: true };                      // the Dutchman behind in the fog
const HOLE = { x: 135, y: 101.6, w: 25, h: 11, a: 10 };   // a: the planks' slope (her heel)
const light = { time: 'fog', haze: .7, key: { type: 'moon', x: 82, y: 30, el: 34, color: '#cfeee0', power: .55 }, fill: { color: '#1e3e38', power: .45 },
  rim: { az: 20, color: '#d8fff0', power: .45 }, locals: [{ x: HOLE.x, y: HOLE.y + 10, color: '#9effd0', power: .55, radius: 46 }, { x: 52, y: 82, color: '#ffb060', power: .4, radius: 20 }] };
const skel = { horizon: HZ, eye: 2, light: 'the moon in a rift of the storm clouds, upper middle (behind the ships); the arms glow green of themselves', items: [
  ['enemy, listing (roll 18, heel 10)', 62, 17, 134, 89, 'water'], ['breach', 122, 95, 26, 13, 'her near side at the waterline, forward'],
  ['Dutchman + flash', 10, 56, 60, 32, 'far water, in the fog'], ['arm (front)', 66, 100, 50, 44, 'out of the water to the elbow'],
  ['arm (at the hull)', 134, 90, 24, 32, 'out of the water by her side'], ['arms (far)', 56, 86, 136, 30, 'water by the hull'],
  ['slick', 76, 104, 54, 26, 'water under the breach'], ['shadows', 30, 112, 160, 28, 'under the surface'], ['near sea', 0, 150, 200, 130, 'under the glass']] };

const GHOST = { lit: '#eafff6', half: '#9cecc8', core: '#5cc0a0', shadow: '#2e7c68', outline: '#123c32' };
// a smooth open curve through points (Catmull-Rom as cubic Béziers)
function sp(pts) {
  const n = pts.length, g = i => pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d;
}
// KIT-CANDIDATE ghostArm: a drowned pale arm rising out of the water at `base`, bent at the `elbow`, the forearm to
// the `wrist`. It is broad and blurred where it leaves the sea (melting into a skirt of mist), narrows at the elbow
// (a crease on the inner side), swells a little below it and tapers to a wrist thinner than the forearm; it is most
// transparent at the water and firmest at the hand; a light rim runs along its lit edge; the hand (H.hand3) is set
// along the forearm's last direction. o: { base, elbow, wrist, w0 (the upper arm), w1 (the wrist), s (hand size),
// m (±1 mirror), bend (deg, the wrist's turn), roll, flex, spread, op, seed }
function ghostArm(u, o) {
  const [b, e, w] = [o.base, o.elbow, o.wrist], n = 24, P = [], Lp = [], Rp = [];
  // the centre line: a Catmull-Rom curve base → elbow → wrist (the elbow a soft bend)
  const seg = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return [0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)); };
  const b0 = [2 * b[0] - e[0], 2 * b[1] - e[1]], w2 = [2 * w[0] - e[0], 2 * w[1] - e[1]], l1 = Math.hypot(e[0] - b[0], e[1] - b[1]), l2 = Math.hypot(w[0] - e[0], w[1] - e[1]), te = l1 / (l1 + l2);
  for (let i = 0; i <= n; i++) { const t = i / n; P.push(t <= te ? seg(b0, b, e, w, t / te) : seg(b, e, w, w2, (t - te) / (1 - te))); }
  const wid = t => t < te ? lerp(o.w0 * 1.25, o.w0 * .8, Math.pow(t / te, .8)) : t < te + .15 ? lerp(o.w0 * .8, o.w0 * .86, (t - te) / .15) : lerp(o.w0 * .86, o.w1, Math.pow((t - te - .15) / (1 - te - .15), 1.2));
  for (let i = 0; i <= n; i++) { const t = i / n, a = P[Math.max(0, i - 1)], c = P[Math.min(n, i + 1)], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = wid(t) / 2;
    Lp.push([P[i][0] - dy / l * hw, P[i][1] + dx / l * hw]); Rp.push([P[i][0] + dy / l * hw, P[i][1] - dx / l * hw]); }
  const d = sp(Lp) + 'L' + sp(Rp.slice().reverse()).slice(1) + 'Z', id = nid('ga', u), fb = nid('gb', u), mb = nid('gm', u);
  // which edge is lit (the moon above): the one with the smaller y on the forearm
  const litR = Rp[n - 4][1] < Lp[n - 4][1], lit = litR ? Rp : Lp, dark = litR ? Lp : Rp;
  const ang = Math.atan2(w[1] - P[n - 2][1], w[0] - P[n - 2][0]) * 180 / Math.PI + (o.bend || 0);
  let out = `<defs>${linGrad(id, b[0], b[1], w[0], w[1], [[0, '#2e7c68', 0], [.18, '#5cc0a0', .3], [.45, '#8ae0bc', .62], [.8, '#b4f4d8', .82], [1, '#d8fff0', .9]])}`
    + `<filter id="${fb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(o.w0 * .45)}"/></filter>`
    + `<filter id="${mb}" x="-60%" y="-100%" width="220%" height="300%"><feGaussianBlur stdDeviation="${f(o.w0 * .35)}"/></filter></defs>`;
  // the skirt of mist where it leaves the sea, the glow round the whole arm, then the arm itself
  out += `<ellipse cx="${f(b[0])}" cy="${f(b[1] - o.w0 * .2)}" rx="${f(o.w0 * 1.5)}" ry="${f(o.w0 * .55)}" fill="#9cecc8" opacity=".38" filter="url(#${mb})" style="mix-blend-mode:screen"/>`
    + `<path d="${d}" fill="#7effc8" opacity=".32" filter="url(#${fb})" style="mix-blend-mode:screen"/><path d="${d}" fill="url(#${id})"/>`;
  // the shaded underside (its round), the crease on the inner side of the elbow, the light rim along the lit edge
  const ie = Math.round(te * n);
  out += `<path d="${sp(dark.slice(Math.round(n * .2)))}" stroke="#123c32" stroke-width="${f(o.w1 * .3)}" fill="none" opacity=".32" stroke-linecap="round"/>`
    + `<path d="${sp(dark.slice(Math.max(0, ie - 2), ie + 3))}" stroke="#0e3028" stroke-width="${f(o.w1 * .22)}" fill="none" opacity=".45" stroke-linecap="round"/>`
    + `<path d="${sp(lit.slice(Math.round(n * .25)))}" stroke="#f0fff8" stroke-width="${f(o.w1 * .14)}" fill="none" opacity=".6" stroke-linecap="round"/>`;
  // wisps of mist trailing off the lower arm, thinning upward
  { const Rr = rng(o.seed || 3); for (let i = 0; i < 6; i++) { const t = .02 + Rr() * .25, p = P[Math.round(t * n)], l = 4 + Rr() * 7;
      out += `<path d="M${f(p[0] + (Rr() - .5) * o.w0)} ${f(p[1] + 1)}q${f((Rr() - .5) * 6)} ${f(-l * .5)} ${f((Rr() - .5) * 5)} ${f(-l)}" stroke="#a8f4d8" stroke-width="${f(.5 + Rr() * .9)}" fill="none" opacity=".3" stroke-linecap="round"/>`; } }
  const h = H.hand3(u, { at: w, a: ang, s: o.s, m: o.m || 1, roll: o.roll || 0, pitch: o.pitch || 0, pose: 'custom', tone: GHOST, light: [-.2, -1], sw: .25,
    palmW: .8, fingerW: .9, wristW: .9, flex: o.flex || [[30, 44, 30], [28, 42, 30], [30, 46, 30], [34, 50, 32]], spread: o.spread != null ? o.spread : 8, thumbFlex: [10, 24, 20], thumbSpread: 10, yaw: [-6, -2, 3, 8] });
  const hf = nid('hf', u);
  out += `<defs><filter id="${hf}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(o.s * 1.3)}"/></filter></defs>`
    + `<g filter="url(#${hf})" opacity=".5" style="mix-blend-mode:screen">${h.back}${h.front}</g><g opacity="${f(o.op || .92)}">${h.back}${h.front}</g>`;
  return out;
}

module.exports = { name: 'Зов глубин', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    L.pal = Object.assign({}, L.pal, { sky: ['#06100e', '#0e1e1a', '#1a302a', '#2e4a42'], sea: ['#2a4a44', '#122a26', '#040c0a'], cloudLit: '#7a9a90', cloudShade: '#0a1412' });
    // ——— the sky: low storm clouds, the moon in a rift; rain ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 3 });
    bg += K.localGlow(u, { x: 82, y: 30, color: '#d8fff0', power: .55, radius: 50 }, { core: false });
    bg += K.cloud(u, L, { x: 150, y: 18, w: 170, h: 30, seed: 5 }) + K.sunMoon(u, L, { r: 5.5 });
    bg += K.cloud(u, L, { x: 24, y: 44, w: 110, h: 30, seed: 23 }) + K.cloud(u, L, { x: 176, y: 62, w: 90, h: 22, seed: 31, far: .4 });
    bg += K.cloudBank(u, L, { y: HZ - 4, h: 10, x0: -20, x1: 220, n: 5, seed: 12, far: .7 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: 1, seed: 7, glitter: 82 });
    // ——— the Dutchman in the fog behind, her bow gun flashing: she fires after the enemy ———
    bg += `<g opacity=".85">${K.ship(u, L, { ...DU, sails: 'full', detail: 'mid', lights: true, wake: true, seed: 4 })}</g>`;
    bg += K.fog(u, L, { y: HZ - 20, h: 26, density: .5, seed: 3 });
    { const m = [58.5, 81.8]; bg += K.smoke(u, L, { x: m[0] + 6, y: m[1] + 1, w: 18, h: 14, wind: 1, seed: 5, opacity: .7, glow: { color: '#ffb060', power: .5 } })
      + K.muzzleFlash(u, { x: m[0], y: m[1], dir: 4, len: 12, seed: 1 });
      // the shot's thin trail, low over the sea at the enemy's stern
      const tl = nid('tl', u); bg += `<defs>${linGrad(tl, 70, 80, 94, 92, [[0, '#e8f4ec', 0], [1, '#f4fff8', .6]])}</defs><path d="M70 81Q82 82 92 90" stroke="url(#${tl})" stroke-width=".9" fill="none" stroke-linecap="round"/>`; }
    // ——— the shadows under the surface: dark shapes gathering towards her from both sides ———
    { const R = rng(9); let sh = ''; const fb = nid('sb', u);
      for (const [x, y, w, a] of [[60, 128, 30, -12], [92, 134, 24, -20], [160, 126, 28, 16], [184, 136, 22, 10], [36, 120, 18, -6], [132, 136, 26, -4]]) {
        sh += `<ellipse cx="${x}" cy="${y}" rx="${f(w)}" ry="${f(w * .22)}" transform="rotate(${a} ${x} ${y})" fill="#010806" opacity="${f(.5 + R() * .25)}"/>`
          + `<ellipse cx="${x}" cy="${f(y - 1)}" rx="${f(w * .8)}" ry="${f(w * .1)}" transform="rotate(${a} ${x} ${y})" fill="none" stroke="#5cc0a0" stroke-width=".6" opacity=".25"/>`; }
      bg += `<defs><filter id="${fb}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g filter="url(#${fb})">${sh}</g>`; }
    // ——— the enemy: listing towards us, bow down a little, holed at the waterline ———
    let mid = K.ship(u, L, { ...EN, sails: 'reefed', detail: 'near', lights: true, wake: false, seed: 6 });
    // the breach: a ragged hole; the hull planks broken off at different lengths (a stepped, uneven edge), their
    // torn ends bent INTO the dark at different angles — dark brown, only the fresh break at each tip pale; the dark
    // sea running in over the lower lip
    { const R = rng(41), ph = 1.45, hw = HOLE.w / 2, hh = HOLE.h / 2, rows = [], hg = nid('hg', u), hc = nid('hc', u), wc = nid('wc', u), wg = nid('wg', u);
      for (let v = -hh; v < hh - .01; v += ph) { const vm = Math.min(hh, v + ph / 2), e = hw * Math.sqrt(Math.max(.08, 1 - Math.pow(vm / hh, 2)));
        rows.push({ v0: v, v1: Math.min(hh, v + ph), l: -e * (.72 + R() * .42), r: e * (.72 + R() * .42) }); }
      const outline = [];
      rows.forEach(r => { outline.push([r.r, r.v0], [r.r + (R() - .5) * .6, r.v1]); });
      rows.slice().reverse().forEach(r => { outline.push([r.l + (R() - .5) * .6, r.v1], [r.l, r.v0]); });
      const d = 'M' + outline.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', T = `translate(${HOLE.x} ${HOLE.y}) rotate(${HOLE.a})`;
      let br = `<defs>${radGrad(hg, 0, -1, hw * 1.1, [[0, '#000000', 1], [.65, '#050302', 1], [1, '#140c06', 1]])}<clipPath id="${hc}"><path d="${d}"/></clipPath></defs>`;
      // the torn rim of raw wood round it (dark), the hole
      br += `<path d="${d}" transform="scale(1.1 1.16)" fill="#2e1c0e" opacity=".9"/><path d="${d}" fill="url(#${hg})"/>`;
      // the broken plank ends: from each side of each row, bent into the hole, foreshortened as they turn away
      rows.forEach((r, i) => { for (const side of [-1, 1]) { if (R() < .22) continue;
        const x0 = side < 0 ? r.l : r.r, len = .8 + R() * 3.6, tilt = (R() - .5) * 1.2, th = (r.v1 - r.v0) * (.75 + R() * .2), y0 = (r.v0 + r.v1) / 2;
        const tipX = x0 - side * len, tipY = y0 + tilt * len * .5, tw = th * (.35 + R() * .25), j = (R() - .5) * .5;
        const pts = [[x0, y0 - th / 2], [tipX + side * .3, tipY - tw / 2], [tipX + j, tipY - tw * .1], [tipX + side * .4, tipY + tw * .2], [tipX - j * .6, tipY + tw / 2], [x0, y0 + th / 2]];
        const gid = nid('pk', u);
        br += `<defs>${linGrad(gid, x0, 0, tipX, 0, [[0, '#4a3020', 1], [.6, '#32200f', 1], [1, '#1e1208', 1]])}</defs>`
          + `<path d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${gid})" stroke="#120a04" stroke-width=".15"/>`
          + `<path d="M${f(pts[1][0])} ${f(pts[1][1])}L${f(pts[2][0])} ${f(pts[2][1])}L${f(pts[3][0])} ${f(pts[3][1])}L${f(pts[4][0])} ${f(pts[4][1])}" stroke="#c09468" stroke-width=".22" fill="none" opacity=".75" stroke-linejoin="round"/>`; } });
      // the seams of the planks round the hole, the cracks running out along them
      for (let i = 0; i < 8; i++) { const r = rows[Math.floor(R() * rows.length)], side = R() < .5 ? -1 : 1, x0 = side < 0 ? r.l : r.r, l = 2 + R() * 6, y = R() < .5 ? r.v0 : r.v1;
        br += `<path d="M${f(x0)} ${f(y)}l${f(side * l * .5)} ${f((R() - .5) * .5)}l${f(side * l * .5)} ${f((R() - .5) * .5)}" stroke="#0e0804" stroke-width="${f(.25 + R() * .25)}" fill="none" opacity=".8"/>`; }
      // the sea running in over the lower lip: dark water, a few pale threads curling inward
      br += `<defs>${linGrad(wg, 0, hh - 3.2, 0, hh, [[0, '#0e2a24', .5], [.5, '#0a201c', .85], [1, '#06140f', .95]])}</defs>`
        + `<g clip-path="url(#${hc})"><path d="M${f(-hw - 1)} ${f(hh - 2.2)}Q${f(-hw * .3)} ${f(hh - 3.4)} 0 ${f(hh - 2.8)}T${f(hw + 1)} ${f(hh - 2)}L${f(hw + 1)} ${f(hh + 1)}L${f(-hw - 1)} ${f(hh + 1)}Z" fill="url(#${wg})"/>`;
      for (let i = 0; i < 5; i++) { const x = -hw * .6 + i * hw * .3 + (R() - .5); br += `<path d="M${f(x)} ${f(hh - .2)}q${f(-.3 + R() * .6)} ${f(-1.4)} ${f(-.8 + R() * 1.6)} ${f(-2.6 - R())}" stroke="#7fb8a6" stroke-width="${f(.18 + R() * .15)}" fill="none" opacity=".45" stroke-linecap="round"/>`; }
      br += '</g>';
      // only above the sea (the kit cuts her at the waterline)
      mid += `<defs><clipPath id="${wc}"><rect x="-10" y="-10" width="220" height="${EN.y + 10.3}"/></clipPath></defs><g clip-path="url(#${wc})"><g transform="${T}">${br}</g></g>`;
      mid += K.foam(u, { x: HOLE.x, y: EN.y - .4, w: 30, h: 1.6, seed: 12, L }); }
    // the wound bleeds into the sea: a dark wine-tinted slick spreading from under the breach towards the arms
    { const sl = nid('sl', u), sb = nid('slb', u); mid += `<defs>${radGrad(sl, HOLE.x - 8, EN.y + 8, 34, [[0, '#3a0c0c', .7], [.6, '#2a0a0a', .35], [1, '#2a0a0a', 0]])}<filter id="${sb}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`
      + `<path d="M${HOLE.x + 6} ${EN.y}C${HOLE.x - 4} ${EN.y + 4} ${HOLE.x - 30} ${EN.y + 10} ${HOLE.x - 44} ${EN.y + 22}C${HOLE.x - 30} ${EN.y + 18} ${HOLE.x - 10} ${EN.y + 14} ${HOLE.x + 14} ${EN.y + 4}Z" fill="url(#${sl})" filter="url(#${sb})"/>`; }
    // the ripples round her and the wreckage of the hit afloat by her side: big planks, a port or two long
    mid += K.foam(u, { x: EN.x + 6, y: EN.y + .6, w: 100, h: 1.1, seed: 22, L });
    { const R = rng(77);
      for (const [x, y, l, a] of [[121, 113.5, 16, -8], [141, 117, 13, 14], [112, 121, 18, 4], [131, 124, 11, -20]]) {
        const w = 2.1, j = () => (R() - .5) * .9, top = [[-l / 2 + j(), -w / 2], [l / 2 - .6, -w / 2], [l / 2 + .8, -w * .1], [l / 2 - .2, w * .2], [l / 2 + .5, w / 2], [-l / 2 + j(), w / 2], [-l / 2 - .7, w * .1]];
        const td = 'M' + top.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', T = `translate(${x} ${y}) scale(1 .5) rotate(${a})`;
        mid += `<ellipse cx="${x}" cy="${f(y + .9)}" rx="${f(l * .5)}" ry=".8" fill="#04100c" opacity=".25"/>`
          + `<path d="${td}" transform="translate(0 .9) ${T}" fill="#1e1208"/>`
          + `<path d="${td}" transform="${T}" fill="#5a3e26" stroke="#1a0e06" stroke-width=".25"/>`
          + `<path d="M${f(-l / 2 + 1)} ${f(-w * .1)}L${f(l / 2 - 1)} ${f(w * .05)}" transform="${T}" stroke="#2e1c0e" stroke-width=".3" opacity=".7"/>`
          + `<path d="M${f(l / 2 - .6)} ${f(-w / 2)}L${f(l / 2 + .8)} ${f(-w * .1)}L${f(l / 2 - .2)} ${f(w * .2)}L${f(l / 2 + .5)} ${f(w / 2)}" transform="${T}" stroke="#c09468" stroke-width=".3" fill="none" opacity=".8"/>`
          + `<path d="M${f(-l / 2 + 1.5)} ${f(-w * .35)}L${f(l / 2 - 2)} ${f(-w * .3)}" transform="${T}" stroke="#d8f4ea" stroke-width=".3" opacity=".4"/>`
          + `<ellipse cx="${x}" cy="${f(y + .8)}" rx="${f(l * .6)}" ry="1.2" fill="none" stroke="#bfe8d8" stroke-width=".3" opacity=".3"/>`; R(); } }
    // ——— the arms of the deep: the far ones faint, by her hull; the big one in front reaches for the breach ———
    let fg = '';
    fg += `<g opacity=".7">${ghostArm(u, { base: [62, 114], elbow: [58, 104], wrist: [65, 96], w0: 5.4, w1: 2.6, s: .95, m: -1, bend: 4, seed: 4, roll: 40 })}</g>`;
    fg += `<g opacity=".75">${ghostArm(u, { base: [186, 115], elbow: [190, 105], wrist: [181, 97], w0: 5.4, w1: 2.6, s: .95, m: 1, bend: -6, seed: 5, roll: 40 })}</g>`;
    // by her side: out of the sea at her bow, the hand clawing at the breach's forward edge
    fg += ghostArm(u, { base: [157, 121], elbow: [160, 109], wrist: [150, 101], w0: 7.6, w1: 3.6, s: 1.3, m: 1, bend: -14, seed: 6, roll: 55, spread: 6 });
    // their rings on the water where they rose
    for (const [x, y, r] of [[62, 114, 7], [186, 115, 7], [157, 121, 10]]) fg += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * .2)}" fill="none" stroke="#bff8e0" stroke-width=".6" opacity=".6"/>`;
    // the big one in front: out of the sea to the elbow, the forearm reaching up to the breach, the fingers hooked to grab
    fg += ghostArm(u, { base: [82, 142], elbow: [91, 123], wrist: [115, 109.5], w0: 13, w1: 5.4, s: 2, m: -1, bend: -6, seed: 7, roll: 50, spread: 9,
      flex: [[26, 40, 28], [24, 38, 28], [28, 42, 30], [32, 46, 30]] });
    fg += `<ellipse cx="82" cy="142" rx="16" ry="3" fill="none" stroke="#bff8e0" stroke-width=".8" opacity=".55"/>` + K.foam(u, { x: 82, y: 142, w: 22, h: 1.4, seed: 31, L });
    // the green light of the arms on the water and on her side
    fg += K.localGlow(u, { x: 120, y: 112, color: '#9effd0', power: .35, radius: 40 }, { squash: .4, core: false });
    // rain, slanting, the near sea's dark under the glass
    { const R = rng(51); let st = ''; for (let i = 0; i < 110; i++) { const x = R() * 240 - 20, y = R() * 290, l = 5 + R() * 10;
        st += `<path d="M${f(x)} ${f(y)}l${f(l * .28)} ${f(l)}" stroke="#c8dcd8" stroke-width="${f(.2 + R() * .3)}" opacity="${f(.15 + R() * .3)}"/>`; }
      fg += `<g stroke-linecap="round">${st}</g>`; }
    fg += motes(16, 60, 80, 120, 50, '#c8fff0', 3);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 140, 0, 290, [[0, '#020806', 0], [.4, '#020806', .5], [1, '#010403', .85]])}</defs><rect x="-10" y="140" width="220" height="150" fill="url(#${gl})"/>`; }
    return [bg, mid + fg];
  } };
