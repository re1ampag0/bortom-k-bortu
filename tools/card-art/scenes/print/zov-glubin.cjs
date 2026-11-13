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
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const HZ = 86;
const EN = { kind: 'endeavour', x: 120, y: 106, scale: .8, flip: true, heel: 5, roll: 18 };   // the enemy, bow right, listing to us
const DU = { kind: 'dutch', x: 36, y: HZ + 1.6, scale: .42, flip: true };                      // the Dutchman behind in the fog
const HOLE = { x: 123, y: 100, w: 17, h: 9.5 };
const light = { time: 'fog', haze: .7, key: { type: 'moon', x: 82, y: 30, el: 34, color: '#cfeee0', power: .55 }, fill: { color: '#1e3e38', power: .45 },
  rim: { az: 20, color: '#d8fff0', power: .45 }, locals: [{ x: HOLE.x, y: HOLE.y + 10, color: '#9effd0', power: .55, radius: 46 }, { x: 52, y: 82, color: '#ffb060', power: .4, radius: 20 }] };
const skel = { horizon: HZ, eye: 2, light: 'the moon in a rift of the storm clouds, upper middle (behind the ships); the arms glow green of themselves', items: [
  ['enemy, listing (roll 18)', 62, 17, 134, 89, 'water'], ['breach', 114, 95, 18, 11, 'her near side at the waterline'],
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
// KIT-CANDIDATE ghostArm: a drowned pale arm rising out of the water at `base` through `mid` to the wrist, the forearm
// tapering, dissolving into wisps where it leaves the sea; the hand (H.hand3) set along the arm's last direction.
// o: { base, mid, wrist, w0, w1, s (hand size), m (±1 mirror), bend (deg, the wrist's turn), roll, flex, op }
function ghostArm(u, o) {
  const [b, c, w] = [o.base, o.mid, o.wrist], n = 16, L = [], R = [];
  const q = t => { const a = 1 - t; return [a * a * b[0] + 2 * a * t * c[0] + t * t * w[0], a * a * b[1] + 2 * a * t * c[1] + t * t * w[1]]; };
  for (let i = 0; i <= n; i++) { const t = i / n, p = q(t), p2 = q(Math.min(1, t + .02)), p1 = q(Math.max(0, t - .02)), dx = p2[0] - p1[0], dy = p2[1] - p1[1], l = Math.hypot(dx, dy) || 1;
    // the forearm: thick at the elbow end, a slight swell of the muscle, narrow at the wrist
    const hw = lerp(o.w0, o.w1, t) * (1 + .12 * Math.sin(Math.PI * Math.min(1, t * 1.6))) / 2;
    L.push([p[0] - dy / l * hw, p[1] + dx / l * hw]); R.unshift([p[0] + dy / l * hw, p[1] - dx / l * hw]); }
  const d = sp(L) + 'L' + sp(R).slice(1) + 'Z', id = nid('ga', u), fb = nid('gb', u), hl = nid('gh', u);
  const ang = Math.atan2(w[1] - c[1], w[0] - c[0]) * 180 / Math.PI + (o.bend || 0);
  let out = `<defs>${linGrad(id, b[0], b[1], w[0], w[1], [[0, '#2e7c68', 0], [.25, '#5cc0a0', .45], [.7, '#9cecc8', .75], [1, '#d8fff0', .85]])}`
    + `<filter id="${fb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(o.w0 * .5)}"/></filter>`
    + `${linGrad(hl, 0, 0, 1, 0, [[0, '#ffffff', 0], [1, '#ffffff', .7]])}</defs>`;
  // the glow round the whole arm, then the arm itself
  out += `<path d="${d}" fill="#7effc8" opacity=".35" filter="url(#${fb})" style="mix-blend-mode:screen"/><path d="${d}" fill="url(#${id})"/>`;
  // the lit edge along the upper side of the forearm (the moon), the dark one under it
  out += `<path d="${sp(R.slice(0, Math.round(n * .7)).reverse())}" stroke="#f0fff8" stroke-width="${f(o.w1 * .12)}" fill="none" opacity=".55"/>`;
  // the shaded underside: a darker band along the lower edge gives the forearm its round
  out += `<path d="${sp(L.slice(Math.round(n * .15)))}" stroke="#123c32" stroke-width="${f(o.w1 * .35)}" fill="none" opacity=".35" stroke-linecap="round"/>`;
  // wisps where it leaves the sea: rags of pale mist trailing down
  { const Rr = rng(o.seed || 3); for (let i = 0; i < 5; i++) { const t = .05 + Rr() * .3, p = q(t), l = 4 + Rr() * 6;
      out += `<path d="M${f(p[0] + (Rr() - .5) * o.w0)} ${f(p[1])}q${f((Rr() - .5) * 6)} ${f(l * .5)} ${f((Rr() - .5) * 4)} ${f(l)}" stroke="#a8f4d8" stroke-width="${f(.5 + Rr() * .8)}" fill="none" opacity=".35" stroke-linecap="round"/>`; } }
  const h = H.hand3(u, { at: w, a: ang, s: o.s, m: o.m || 1, roll: o.roll || 0, pitch: o.pitch || 0, pose: 'custom', tone: GHOST, light: [-.2, -1], sw: .25,
    palmW: .8, fingerW: .9, wristW: .95, flex: o.flex || [[14, 22, 14], [12, 20, 12], [16, 24, 14], [22, 30, 18]], spread: o.spread != null ? o.spread : 9, thumbFlex: [6, 12, 10], thumbSpread: 12, yaw: [-8, -2, 4, 10] });
  const hf = nid('hf', u);
  out += `<defs><filter id="${hf}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(o.s * 1.4)}"/></filter></defs>`
    + `<g filter="url(#${hf})" opacity=".55" style="mix-blend-mode:screen">${h.back}${h.front}</g><g opacity="${f(o.op || .9)}">${h.back}${h.front}</g>`;
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
    // the breach: a ragged black hole, the planks round it splintered and bent inward, the sea pouring in at its lip
    { const R = rng(41), n = 14, pts = [];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = .75 + R() * .4 + (i % 3 === 0 ? .25 : 0); pts.push([HOLE.x + Math.cos(a) * HOLE.w / 2 * r, HOLE.y + Math.sin(a) * HOLE.h / 2 * r]); }
      const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', hg = nid('hg', u);
      mid += `<path d="${d}" fill="#3a2414" transform="translate(${f(HOLE.x * -.18)} ${f(HOLE.y * -.18)}) scale(1.18)" opacity=".85"/>`   // the torn, raw wood round the hole
        + `<defs>${radGrad(hg, HOLE.x, HOLE.y - 1, HOLE.w * .6, [[0, '#000000', 1], [.7, '#060403', 1], [1, '#1a100a', 1]])}</defs><path d="${d}" fill="url(#${hg})"/>`;
      // splinters: plank ends broken inward, pale raw wood, pointing into the dark
      // cracks running out from the hole along the planks
      for (let i = 0; i < 7; i++) { const p = pts[Math.floor(R() * n)], sgn = p[0] < HOLE.x ? -1 : 1, l = 3 + R() * 6;
        mid += `<path d="M${f(p[0])} ${f(p[1])}l${f(sgn * l * .5)} ${f((R() - .5) * 1.2)}l${f(sgn * l * .5)} ${f((R() - .5) * 1.4)}" stroke="#0e0804" stroke-width="${f(.3 + R() * .3)}" fill="none" opacity=".8"/>`; }
      for (let i = 0; i < 8; i++) { const p = pts[Math.floor(R() * n)], dx = HOLE.x - p[0], dy = HOLE.y - p[1], l = Math.hypot(dx, dy) || 1, len = 1.4 + R() * 1.8, w = .4 + R() * .5;
        const ex = p[0] + dx / l * len, ey = p[1] + dy / l * len;
        mid += `<path d="M${f(p[0] - dy / l * w)} ${f(p[1] + dx / l * w)}L${f(ex)} ${f(ey)}L${f(p[0] + dy / l * w)} ${f(p[1] - dx / l * w)}Z" fill="${R() < .5 ? '#8a6a44' : '#6a4c2e'}" stroke="#2a1608" stroke-width=".2"/>`; }
      // the sea pouring in over the lower lip, white
      for (let i = 0; i < 9; i++) { const x = HOLE.x - 4 + i, y = HOLE.y + 2.6 + R() * .8;
        mid += `<path d="M${f(x)} ${f(y + 1.2)}q${f(.4)} ${f(-1.6)} ${f(-.2)} ${f(-3.2 - R() * 1.2)}" stroke="#e8fff4" stroke-width="${f(.3 + R() * .4)}" fill="none" opacity="${f(.5 + R() * .4)}" stroke-linecap="round"/>`; }
      mid += K.foam(u, { x: HOLE.x, y: EN.y - .6, w: 26, h: 1.6, seed: 12, L }); }
    // the wound bleeds into the sea: a dark wine-tinted slick spreading from under the breach towards the arms
    { const sl = nid('sl', u), sb = nid('slb', u); mid += `<defs>${radGrad(sl, HOLE.x - 8, EN.y + 8, 34, [[0, '#3a0c0c', .7], [.6, '#2a0a0a', .35], [1, '#2a0a0a', 0]])}<filter id="${sb}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`
      + `<path d="M${HOLE.x + 6} ${EN.y}C${HOLE.x - 4} ${EN.y + 4} ${HOLE.x - 30} ${EN.y + 10} ${HOLE.x - 44} ${EN.y + 22}C${HOLE.x - 30} ${EN.y + 18} ${HOLE.x - 10} ${EN.y + 14} ${HOLE.x + 14} ${EN.y + 4}Z" fill="url(#${sl})" filter="url(#${sb})"/>`; }
    // the ripples round her and the wreckage of the hit afloat by her side
    mid += K.foam(u, { x: EN.x + 6, y: EN.y + .6, w: 100, h: 1.1, seed: 22, L });
    { const R = rng(77); for (const [x, y, l, a] of [[86, 116, 12, 8], [146, 114, 9, -14], [104, 122, 7, 30], [166, 119, 6, -4]]) {
        mid += `<g transform="rotate(${a} ${x} ${y})">${K.shadeCyl(u, x - l / 2, y, x + l / 2, y, .9, L, 'oak', { outline: .3, seed: x })}</g>`
          + `<ellipse cx="${x}" cy="${f(y + 1)}" rx="${f(l * .7)}" ry="1" fill="none" stroke="#bfe8d8" stroke-width=".35" opacity=".5"/>`; R(); } }
    // ——— the arms of the deep: the far ones faint, by her hull; the big one in front reaches for the breach ———
    let fg = '';
    fg += `<g opacity=".7">${ghostArm(u, { base: [64, 113], mid: [62, 104], wrist: [66, 95], w0: 6, w1: 3.4, s: .95, m: -1, bend: 6, seed: 4, flex: [[30, 40, 22], [28, 38, 22], [32, 42, 24], [36, 46, 26]] })}</g>`;
    fg += `<g opacity=".75">${ghostArm(u, { base: [184, 114], mid: [182, 104], wrist: [176, 95], w0: 6, w1: 3.4, s: .95, m: 1, bend: -8, seed: 5 })}</g>`;
    fg += ghostArm(u, { base: [154, 120], mid: [152, 110], wrist: [144, 100], w0: 8.4, w1: 4.6, s: 1.35, m: 1, bend: -18, seed: 6, flex: [[8, 12, 8], [6, 10, 6], [8, 12, 8], [12, 16, 10]], spread: 12 });
    // their rings on the water where they rose
    for (const [x, y, r] of [[64, 113, 7], [184, 114, 7], [154, 120, 10]]) fg += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * .2)}" fill="none" stroke="#bff8e0" stroke-width=".6" opacity=".6"/>`;
    // the big one in front: out of the sea to the elbow, the hand open, reaching for the breach
    fg += ghostArm(u, { base: [80, 142], mid: [84, 128], wrist: [100, 114], w0: 15, w1: 7, s: 2.05, m: -1, bend: -12, seed: 7, flex: [[10, 16, 10], [6, 12, 8], [10, 14, 10], [16, 22, 14]], spread: 13 });
    fg += `<ellipse cx="80" cy="142" rx="16" ry="3" fill="none" stroke="#bff8e0" stroke-width=".8" opacity=".55"/>` + K.foam(u, { x: 80, y: 142, w: 22, h: 1.4, seed: 31, L });
    // the green light of the arms on the water and on her side
    fg += K.localGlow(u, { x: 112, y: 112, color: '#9effd0', power: .35, radius: 40 }, { squash: .4, core: false });
    // rain, slanting, the near sea's dark under the glass
    { const R = rng(51); let st = ''; for (let i = 0; i < 110; i++) { const x = R() * 240 - 20, y = R() * 290, l = 5 + R() * 10;
        st += `<path d="M${f(x)} ${f(y)}l${f(l * .28)} ${f(l)}" stroke="#c8dcd8" stroke-width="${f(.2 + R() * .3)}" opacity="${f(.15 + R() * .3)}"/>`; }
      fg += `<g stroke-linecap="round">${st}</g>`; }
    fg += motes(16, 60, 80, 120, 50, '#c8fff0', 3);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 140, 0, 290, [[0, '#020806', 0], [.4, '#020806', .5], [1, '#010403', .85]])}</defs><rect x="-10" y="140" width="220" height="150" fill="url(#${gl})"/>`; }
    return [bg, mid + fg];
  } };
