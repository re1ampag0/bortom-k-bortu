// «Картечь» (общая карта: Месть, Индевор, Голландец; ЗАРЯД: этот Залп бьёт по Команде цели, а не по Корпусу), refined
// from the first-round scene (portrait-revenge.cjs SCENES['Картечь']): a neutral gun deck in a cut-away, at sunset.
// Our gun has just fired out of the port at point-blank range: the enemy's bulwark is right there, a ship's length
// away; the swarm of lead balls fans out of the flash and rakes her rail — splinters, holes in the planks and in her
// backlit course — and her men behind the rail throw themselves down (one crouched with his hands clamped on his head,
// one diving flat, his hat knocked off). Inside, by the gun: the canvas bags of grapeshot, corded like a bunch of grapes.
// Fixed against the first round: the gun was a sprite slanting up 25° into a window in a flat wall — now the kit's
// gun level and recoiling in a cut-away (inside: the deck in perspective, the lantern on the beam; the hull in section
// with the port through it), the outside on the left so the hit shows in the fan of cards; the target was a flat strip
// of planks — now her bulwark and rail, the shrouds, her mast and a course with the sun low behind it, and the crew
// that the card is about; the swarm was a cone of identical dots — balls of different sizes with streaks.
// Fixed against the previous draft: the men were flat black cut-outs (one like a log) — now figures with volume
// (cloth over the body and limbs, heads in profile, hands), dark against the sunset with the flash's orange on their
// edges; the crouched man bigger on the left, the diver flat, face down, over the rail on the right; the swarm went
// low under them — it now fans up across them; the corded grape bags read as cages — canvas sacks tied at the neck,
// as on the first-round card; the red lid on a rope outside our port is gone.
// Light: outside — the sun low behind the enemy (her side, rail and men in silhouette with a warm rim); the flash of
// our gun (orange) on her side and our hull; inside — the lantern on the beam (key), the flash at the port.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, glow, gloom, motes, rope, nails } = PK;

const HZ = 100, FL = 121, HX = 84, HW = 13, IN = HX + HW;   // eye level = the sea horizon; our deck; the hull in section (outside left of HX)
const LAMP = { x: 152, y: 36, s: 1.1 };
const GUN = { s: 1.9, y: 131, len: 50, turn: .08, recoil: .35, seed: 6, flip: true };
const ER = 91;                                   // the enemy's rail (the top of her bulwark)
const light = { time: 'night', haze: .3, key: { type: 'point', x: LAMP.x, y: 25, h: 1.9, gy: 142, color: '#ffc070', power: 1, radius: 130 },
  fill: { color: '#3a3a5c', power: .3 }, locals: [{ x: 76, y: 100, color: '#ffcf7a', power: .8, radius: 40 }] };
const lightOut = { time: 'dusk', haze: .35, key: { type: 'sun', x: 38, y: 97, el: 2, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 },
  locals: [{ x: 70, y: 98, color: '#ffb050', power: .7, radius: 40 }] };
const skel = { horizon: HZ, eye: 1.7, light: 'outside: the sun low behind the enemy (contre-jour) + our flash; inside: the lantern on the beam', items: [
  ['enemy bulwark', -10, 150, 96, 59, 'the sea'], ['enemy course', -10, 40, 100, 40, 'her yard (off the top)'], ['man crouched', 8, ER, 34, 35, 'behind her rail'],
  ['man diving', 44, ER - 2, 36, 32, 'in the air over her rail'], ['hat', 40, 50, 12, 6, 'in the air'], ['swarm', 0, 94, 78, 36, 'in flight, at the men\'s height'],
  ['gun', 80, GUN.y, 110, 44, 'deck'], ['grape bags', 104, 124, 32, 22, 'deck'], ['lantern', 146, 36, 13, 30, 'beam (rope)'], ['crate', 160, 150, 30, 22, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;

// ——— KIT-CANDIDATE: a grapeshot round as on the first-round card: a canvas bag stuffed with balls on its wooden
// bottom — the balls bulge the canvas into soft lumps with creases between them, the neck gathered and tied with a
// cord, the canvas ears flaring over the tie; (x, y) — the middle of the bottom, s — scale (≈ 13 × 20)
function grape(u, L, o) {
  const { x, y, s = 1, seed = 3 } = o, R = rng(seed), rp = L.ramp('canvas', x, y - 8 * s), cord = L.ramp('rope', x, y - 8 * s), cid = nid('gb', u);
  const X = dx => x + dx * s, Y = dy => y - dy * s, P = (dx, dy) => [X(dx), Y(dy)];
  let out = K.shadeCyl(u, x, y, x, y - 2 * s, 6.4 * s, L, 'oak', { ell: .32, face: 2, outline: .35, grain: false });
  // the bag's outline: a lump at each tier of balls on either side, slumped a little, narrowing to the neck
  const jit = () => (R() - .5) * .5;
  const right = [[6.3, 2], [6.9 + jit(), 4.6], [6.2, 7.2], [6.8 + jit(), 9.6], [6, 12], [5.6 + jit(), 14.2], [3.6, 16.2], [1.5, 17.4]];
  const left = right.map(([dx, dy]) => [-dx + jit() * .6, dy + jit() * .4]).reverse();
  const bag = right.concat(left).map(p => P(p[0], p[1])), bd = H.sp(bag, true);
  out += `<defs><clipPath id="${cid}"><path d="${bd}"/></clipPath></defs><path d="${bd}" fill="${rp.half}"/><g clip-path="url(#${cid})">`;
  // the canvas body: lit from the lantern's side (upper right), a few soft lumps where the balls press it, creases
  { const g = nid('gs', u); out += `<defs>${radGrad(g, X(2.6), Y(13), 13 * s, [[0, rp.lit, 1], [.45, rp.half, 1], [1, rp.shadow, 1]])}</defs><path d="${bd}" fill="url(#${g})"/>`; }
  for (const [dx, dy, r] of [[2.6, 13.4, 2.6], [-2.4, 11, 2.4], [3.4, 7, 2.6], [-1.6, 5, 2.8], [.6, 9.4, 2], [-4, 3.6, 2]]) {
    const c = P(dx + (R() - .5) * .6, dy + (R() - .5) * .6); out += `<circle cx="${f(c[0] + .5 * s)}" cy="${f(c[1] - .5 * s)}" r="${f(r * .55 * s)}" fill="${rp.lit}" opacity=".28"/><path d="M${f(c[0] - r * .8 * s)} ${f(c[1] + r * .3 * s)}Q${f(c[0])} ${f(c[1] + r * 1.05 * s)} ${f(c[0] + r * .8 * s)} ${f(c[1] + r * .4 * s)}" stroke="${rp.shadow}" stroke-width="${f(.45 * s)}" fill="none" opacity=".55"/>`; }
  for (let i = 0; i < 5; i++) { const a = P(-4 + R() * 8, 4 + R() * 10), l = (1.6 + R() * 2) * s, an = -Math.PI / 2 + (R() - .5) * 1.2;
    out += `<path d="M${f(a[0])} ${f(a[1])}q${f(Math.cos(an) * l * .5 + .5)} ${f(Math.sin(an) * l * .5)} ${f(Math.cos(an) * l)} ${f(Math.sin(an) * l)}" stroke="${rp.shadow}" stroke-width="${f(.4 * s)}" fill="none" stroke-linecap="round" opacity=".5"/>`; }
  out += `<path d="${H.sp(bag.slice(8), false)}" stroke="${rp.shadow}" stroke-width="${f(1.6 * s)}" fill="none" opacity=".45"/></g>`
    + `<path d="${bd}" fill="none" stroke="${rp.outline}" stroke-width=".45"/>`;
  // the neck: the canvas gathered in folds above the tie, the ears flaring; the cord wound twice round the neck
  const ears = [P(-1.6, 17.2), P(-3.4, 19.6), P(-1.6, 19.2), P(-.4, 21), P(.8, 19.4), P(2.8, 20.2), P(1.6, 17.2)];
  out += `<path d="M${ears.map(P2).join('L')}Z" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".35" stroke-linejoin="round"/>`
    + `<path d="M${P2(P(-.6, 17.6))}L${P2(P(-1.4, 19.4))}M${P2(P(.6, 17.6))}L${P2(P(.6, 19.4))}" stroke="${rp.shadow}" stroke-width=".35"/>`
    + `<path d="M${P2(P(-1.9, 17))}Q${P2(P(0, 16.4))} ${P2(P(1.9, 17.2))}M${P2(P(-1.8, 17.9))}Q${P2(P(0, 17.3))} ${P2(P(1.8, 18.1))}" stroke="${cord.outline}" stroke-width="${f(.8 * s)}" fill="none"/>`
    + `<path d="M${P2(P(-1.9, 17.1))}Q${P2(P(0, 16.5))} ${P2(P(1.9, 17.3))}" stroke="${cord.lit}" stroke-width="${f(.3 * s)}" fill="none" opacity=".8"/>`
    + `<path d="M${P2(P(1.8, 17.6))}q${f(1.4 * s)} ${f(1.2 * s)} ${f(1 * s)} ${f(3.4 * s)}" stroke="${cord.core}" stroke-width="${f(.5 * s)}" fill="none"/>`;
  return out;
}

module.exports = { name: 'Картечь', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ });
    const m0 = K.cannon.muzzle({ ...GUN, x: 0 }), gun = { ...GUN, x: HX - 4 - m0.x }, m = K.cannon.muzzle(gun), by = m.y;
    const ph = 24, pt = by - ph / 2;

    // ——— outside (left of our hull): the sunset sky, her course backlit, her rail and her men, the swarm ———
    let o = K.sky(u, Lo, { horizon: HZ, stars: false }) + K.sunMoon(u, Lo, { r: 6 }) + K.cloud(u, Lo, { x: 20, y: 70, w: 40, h: 5, seed: 3, far: .4 });
    o += K.water(u, Lo, { horizon: HZ, bottom: 290, swell: .4, seed: 4, glitter: false });
    // her mast and the lower yard (off the top), the course hanging from it, glowing with the sun through it
    { const sg = nid('sg', u), sc = nid('sc', u);
      o += `<rect x="62" y="-5" width="7" height="${ER}" fill="#1a0e0a"/><path d="M68.4 -5V${ER}" stroke="#ffb070" stroke-width=".6" opacity=".6"/>`;
      const sail = `M-10 -2L90 -2L88 34Q70 39 52 37Q30 34 12 40Q0 42 -10 41Z`;
      o += `<defs>${radGrad(sg, 42, 60, 70, [[0, '#ffd8a0', 1], [.45, '#e89a5a', 1], [1, '#8a4a3a', 1]])}<clipPath id="${sc}"><path d="${sail}"/></clipPath></defs>`
        + `<path d="${sail}" fill="url(#${sg})" opacity=".96"/><g clip-path="url(#${sc})">`
        // the seams and the mast's shadow through the canvas, the reef band, grapeshot holes with the sky in them
        + [6, 22, 38, 54, 70, 86].map(x => `<path d="M${x} -2L${x - 1} 42" stroke="#a85a3a" stroke-width=".5" opacity=".5"/>`).join('')
        + `<rect x="61" y="-2" width="9" height="44" fill="#5a2a1e" opacity=".45"/><path d="M-10 10Q40 13 90 10" stroke="#a85a3a" stroke-width="1" fill="none" opacity=".6"/>`
        + [[24, 30, 1.3], [36, 25, 1], [46, 32, 1.2], [56, 27, .9], [14, 22, .8], [78, 30, 1.1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffeac0"/><circle cx="${x}" cy="${y}" r="${r + .5}" fill="none" stroke="#5a2a1e" stroke-width=".4"/>`).join('')
        + `</g><path d="M88 34Q70 39 52 37Q30 34 12 40Q0 42 -10 41" stroke="#5a2a1e" stroke-width=".9" fill="none"/>`
        + `<path d="M-10 -2H90" stroke="#140a08" stroke-width="3.4"/>`; }
    // her shrouds from the rail up to the mast, in silhouette
    { for (const [x0, x1] of [[2, 56], [12, 58], [22, 60]]) o += `<path d="M${x0} ${ER - 2}L${x1} -4" stroke="#140a08" stroke-width="1.1"/>`; }
    // her men behind the rail, in profile against the sunset: cloth with volume, dark against the sky, the flash of our
    // gun (low right) lighting their edges orange, the sun behind them rimming the other side. One dives flat, face
    // down, head first away from our port, arms out ahead; one has dropped into a crouch, back hunched, both hands
    // clamped on his head. A hat knocked off the diver, spinning.
    { const SH = { lit: '#c0703c', half: '#3e241a', shadow: '#170c0a', outline: '#070303' }, TR = { lit: '#90583a', half: '#2a1c1c', shadow: '#0e0808', outline: '#050303' };
      const SK = { lit: '#e8986a', half: '#7a4430', core: '#643826', shadow: '#2e1810', outline: '#0a0503' }, RIM = '#ffd090', FL = [1, .45];
      const litOf = sp => { const a = sp[0], b = sp[sp.length - 1]; return (-(b[1] - a[1]) * FL[0] + (b[0] - a[0]) * FL[1]) >= 0 ? 1 : -1; };
      const limb = (spine, w, tone, seed, o = {}) => H.cloth(u, { spine, w, tone, lit: litOf(spine), rim: RIM, rimOp: .6, rimW: .4, seed, drapes: 1, foldW: .45, sw: .35, capA: true, capB: true, ...o });
      const hand = (at, a, m, curl = .25) => { const h = H.hand(u, { at, a, s: .52, m, pose: 'open', tone: SK, spread: 14, curl, sw: .25 }); return h.back + h.front; };
      const shoe = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - 1.8} ${y + 1.2}Q${x - 2.2} ${y - 1.4} ${x} ${y - 1.5}Q${x + 2.8} ${y - 1.3} ${x + 2.6} ${y + .4}Q${x + 2.4} ${y + 1.5} ${x - 1.8} ${y + 1.2}Z" fill="#100806" stroke="#050303" stroke-width=".3"/><path d="M${x - 1.6} ${y + 1.1}Q${x + 1} ${y + 1.4} ${x + 2.5} ${y + .4}" stroke="#ff9a50" stroke-width=".35" fill="none" opacity=".8"/></g>`;
      let men = '', diver = '', crouch = '';
      // the diver: far arm, far leg, the torso, the near leg, the head, the near arm
      diver += limb([[16, 74.4], [10, 76.8], [3.6, 80]], [3.6, 3.1, 2.6], SH, 3) + hand([3.6, 80], 158, 1, .2);
      diver += limb([[30, 69.6], [37.6, 64.4], [43.6, 58.6]], [5.4, 4.3, 3.3], TR, 4) + shoe(44.6, 57.4, -40);
      diver += limb([[13.4, 77], [21, 75], [31, 71]], [7.4, 8.4, 7.2], SH, 5);
      diver += limb([[31, 72], [40, 68.2], [48.6, 64]], [5.8, 4.6, 3.4], TR, 6) + shoe(49.8, 63.2, -24);
      diver += H.head(u, { c: [9.4, 80.6], r: 3.2, dir: -1, tilt: 48, tone: SK, hairColor: '#1c120c', warm: { color: '#ffa860', op: .55 }, eye: 'half' }).svg;
      diver += limb([[17, 77.6], [10.6, 83.6], [4, 87]], [3.8, 3.3, 2.8], SH, 7) + hand([4, 87], 160, -1, .2);
      // the crouched man: far arm (its hand on the back of his head), the thigh, the hunched back, the head, the near arm
      crouch += limb([[59, 72.6], [50.6, 75.4], [52.6, 69.8]], [3.6, 3.1, 2.6], SH, 8) + hand([52.6, 69.8], -14, 1, .5);
      crouch += limb([[68, 86], [58, 84.2], [60, 96]], [7, 5.6, 4.4], TR, 9);
      crouch += limb([[68.4, 88], [67.4, 78.6], [59.6, 72.4]], [8.4, 9.6, 8.4], SH, 10);
      crouch += H.head(u, { c: [54, 74.6], r: 3.3, dir: -1, tilt: 34, tone: SK, hairColor: '#2a1a10', warm: { color: '#ffa860', op: .45 }, eye: 'half' }).svg;
      crouch += limb([[61.4, 73.6], [51.4, 79.4], [51.8, 71.4]], [3.9, 3.4, 2.8], SH, 11) + hand([51.8, 71.4], -26, -1, .45);
      men = `<g transform="translate(36 90) scale(1.4) translate(-68 -90)">${crouch}</g><g transform="translate(50.4 80.6) rotate(-15) scale(.88) translate(-9.4 -80.6)">${diver}</g>`;
      o += men;
      // the hat knocked off the diver's head, spinning up
      const sil = '#140a08';
      o += `<g transform="rotate(-34 46 ${ER - 44})"><path d="M40.4 ${ER - 43}Q46 ${ER - 49} 51.6 ${ER - 43}Q46 ${ER - 41} 40.4 ${ER - 43}Z" fill="${sil}"/><path d="M42 ${ER - 44.4}Q46 ${ER - 48.4} 50 ${ER - 44.4}" stroke="${RIM}" stroke-width=".5" fill="none"/></g>`; }
    // her bulwark and side close to us: dark against the sun, the cap rail with its lit edge, a wale, a closed port;
    // our flash lights it orange where the swarm strikes
    { const sd = nid('sd', u);
      o += `<defs><clipPath id="${sd}"><rect x="-10" y="${ER}" width="${HX + 10}" height="${200 - ER}"/></clipPath></defs><g clip-path="url(#${sd})">`
        + woodTex(u, -10, ER, HX + 10, 160 - ER, '#3a2216', '#20120a', '#0a0503', 5.6, false, 14)
        + `<rect x="-10" y="${ER + 14}" width="${HX + 10}" height="5" fill="#140a06"/><path d="M-10 ${ER + 14}H${HX}" stroke="#a86a3a" stroke-width=".6" opacity=".6"/>`
        + `</g><rect x="-10" y="${ER - 2.6}" width="${HX + 10}" height="3.4" fill="#1a0e08"/><path d="M-10 ${ER - 2.6}H${HX}" stroke="#ffc080" stroke-width=".7" opacity=".9"/>`
        + K.localGlow(u, { x: 66, y: ER + 8, color: '#ffb050', power: .7, radius: 34 });
      // the strikes: holes torn in the bulwark, splinters flying out of each, a notch bitten out of the cap rail
      const RH = rng(9);
      for (const [hx, hy, r] of [[20, ER + 1.4, 1.2], [44, ER - 1.2, 1.5], [70, ER + 1.6, 1.1]]) {
        o += `<circle cx="${hx}" cy="${hy}" r="${f(r + .8)}" fill="#c8884a" opacity=".55"/><circle cx="${hx}" cy="${hy}" r="${r}" fill="#080402"/>`;
        for (let i = 0; i < 6; i++) { const a = -Math.PI + RH() * Math.PI * 1.2 - .2, d = 2 + RH() * 7, l = 1 + RH() * 2.4, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d * .8;
          o += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a + 1) * l)} ${f(Math.sin(a + 1) * l)}" stroke="${RH() > .4 ? '#f0c890' : '#a06a38'}" stroke-width="${f(.5 + RH() * .5)}" stroke-linecap="round"/>`; } } }
    // the swarm: lead balls fanning out of the flash, wider and smaller with the distance, each with a short streak
    { const RS = rng(13), sf = nid('sf', u), mx = m.x - 3, my = by;
      o += `<defs><filter id="${sf}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation=".5"/></filter></defs>`;
      for (let i = 0; i < 50; i++) { const a = Math.PI + (.08 + RS() * .78), d = 8 + Math.pow(RS(), .8) * 80, x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d * 1.05, r = .55 + (1 - d / 80) * .6 + RS() * .25, sl = 3 + RS() * 3.5;
        o += `<path d="M${f(x - Math.cos(a) * sl)} ${f(y - Math.sin(a) * sl)}L${f(x)} ${f(y)}" stroke="#d8c8b0" stroke-width="${f(r * 1.4)}" opacity=".4" stroke-linecap="round" filter="url(#${sf})"/>`
          + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#3a3a3e"/><circle cx="${f(x + r * .3)}" cy="${f(y - r * .3)}" r="${f(r * .35)}" fill="#ffe0b0" opacity=".8"/>`; } }
    // the flash out of our port, the smoke rolling out towards her
    o += K.muzzleFlash(u, { x: m.x, y: by, dir: m.dir, len: 26, seed: 1, smoke: false, glow: false })
      + K.smoke(u, Lo, { x: HX - 14, y: by + 2, w: 34, h: 30, wind: -.6, seed: 6, opacity: .7, glow: { color: '#ffb050', power: .6 } })
      + glow(u, m.x - 6, by, 30, 22, '#ffcf7a', .8) + glow(u, m.x - 4, by, 12, 9, '#fff6d8', 1);
    const oc = nid('oc', u);
    let bg = `<defs><clipPath id="${oc}"><rect x="-10" y="-10" width="${HX + 10}" height="300"/></clipPath></defs><g clip-path="url(#${oc})">${o}</g>`;

    // ——— inside: the frames and planking of the far side, the beam overhead, the deck in perspective ———
    { const ic = nid('ic', u); let i = woodTex(u, IN, 0, 210 - IN, FL, '#4e301a', '#26150a', '#120a04', 14, true, 7);
      for (const x of [118, 176]) { const g = nid('fr', u); i += `<defs>${linGrad(g, x, 0, x + 12, 0, [[0, '#4a2c14', 1], [.4, '#33200e', 1], [1, '#140a04', 1]])}</defs><rect x="${x}" y="0" width="12" height="${FL}" fill="url(#${g})"/><path d="M${x + .6} 0v${FL}" stroke="#7a4e2a" stroke-width=".6"/><path d="M${x + 11.6} 0v${FL}" stroke="#0e0804" stroke-width=".8"/>`; }
      { const g = nid('bm', u); i += `<defs>${linGrad(g, 0, 0, 0, 9, [[0, '#1a0e06', 1], [.6, '#3a2210', 1], [1, '#6a4424', 1]])}</defs><rect x="${IN}" y="-2" width="${210 - IN}" height="11" fill="url(#${g})"/><path d="M${IN} 8.4H210" stroke="#c08a52" stroke-width=".5" opacity=".6"/><path d="M${IN} 9H210" stroke="#0a0502" stroke-width="1.2"/>`; }
      i += nails([[124, 22], [124, 64], [124, 104], [182, 30], [182, 76]], '#140a04', .7);
      i += `<defs><clipPath id="${ic}"><rect x="${IN}" y="${FL}" width="${210 - IN}" height="${290 - FL}"/></clipPath></defs><g clip-path="url(#${ic})">${K.deck(u, L, { horizon: HZ, top: FL, bottom: 290, vx: 150, kind: 'oak', plank: 16, seed: 11 })}</g>`
        + `<path d="M${IN} ${FL}H210" stroke="#0e0804" stroke-width="1.6"/><path d="M${IN} ${FL + 1.4}H210" stroke="#c08a52" stroke-width=".5" opacity=".45"/>`;
      // the rack of grape rounds on the far side, the rammer leaning by it
      i += `<g filter="url(#drop${u})"><path d="M${f(186)} ${FL + 3}L178 24" stroke="url(#oakH${u})" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="177.6" cy="21.6" rx="4.4" ry="3.2" fill="#4a3420" transform="rotate(-6 177.6 21.6)"/><path d="M174 20.4q3.4 -2 6.8 -.4" stroke="#8a6a44" stroke-width=".5" fill="none"/></g>`
        + motes(20, IN, 10, 210 - IN, 110, '#ffd8a0', 8);
      bg += i; }
    // ——— our hull in section: frames and planking, the port through it, the lid hauled up outside ———
    bg += `<path d="M${HX} -10h${HW}v${pt + 10}h${-HW}zM${HX} ${pt + ph}h${HW}V290h${-HW}z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".8"/>`
      + [12, 40, 66, 140, 172, 204].filter(y => y < pt - 2 || y > pt + ph + 2).map(y => `<path d="M${HX} ${y}h${HW}" stroke="#2a180a" stroke-width=".7"/>`).join('')
      + `<path d="M${HX + HW - 4} -10v${pt + 10}M${HX + HW - 4} ${pt + ph}V290" stroke="#c08a52" stroke-width=".4" opacity=".5"/>`
      + `<path d="M${HX} ${pt}h${HW}M${HX} ${pt + ph}h${HW}" stroke="#0a0502" stroke-width="1.4"/><path d="M${HX} ${pt + ph + 1}h${HW}" stroke="#ffcf7a" stroke-width=".6" opacity=".6"/>`
;

    // ——— the deck things: shadows from under the lantern, the gun recoiling, the grape rounds by its muzzle ———
    let fg = '';
    const sh = (x, y, w, h, d) => K.castShadow(u, L, { x, y, w, h, horizon: HZ, d });
    fg += sh(gun.x + 8, GUN.y, 56, 40, .5) + sh(112, 129, 17, 26, .8) + sh(127, 124, 16, 24, .8) + sh(170, 152, 22 * 1.3, 16 * 1.3, .45);
    fg += rope(`M${IN + 8} ${by + 18}Q${gun.x - 10} ${by + 30} ${gun.x + 30} ${by + 6}`, 1.05);
    fg += K.cannon(u, L, { ...gun, breech: false });
    fg += `<circle cx="${IN + 7}" cy="${by + 18}" r="2.2" fill="none" stroke="url(#iron${u})" stroke-width="1.3"/>`;
    fg += grape(u, L, { x: 127, y: 124, s: 1.2, seed: 4 }) + grape(u, L, { x: 112, y: 129, s: 1.3, seed: 7 });
    fg += K.crate(u, L, { x: 170, y: 152, s: 1.3, seed: 7 });
    // the lantern on its rope from the beam, its light; the flash warms the muzzle, the port's sill and the frames
    fg += K.lantern(u, L, { ...LAMP, hang: 2, lit: true, seed: 2 }) + K.localGlow(u, { x: LAMP.x, y: 25, color: '#ffc070', power: .8, radius: 34 });
    fg += glow(u, 152, 50, 70, 62, '#ffb050', .3) + K.localGlow(u, { x: 150, y: 140, color: '#ffb050', power: .4, radius: 56 }, { squash: .3, core: false })
      + K.localGlow(u, { x: IN + 2, y: by, color: '#ffcf7a', power: .7, radius: 24 }) + glow(u, IN + 14, by - 2, 30, 24, '#ffcf7a', .22);
    fg += glow(u, HX - 2, by, 18, 14, '#ffcf7a', .55);
    fg += gloom(u, 150, 60, 210, 150, .4) + gloom(u, 150, 140, 150, 290, .5) + gloom(u, 100, 120, 100, 290, .4) + gloom(u, 60, 60, 0, 0, .2, '#1a0608');
    return [bg, fg];
  } };
