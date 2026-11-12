// «Ограбление банка» (Жемчужина, ПРИКАЗ: заберите 1 Порох из Трюма противника в свой), variant A of the method trial
// (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-pearl.cjs SCENES['Ограбление банка'])
// at its best. Night in a colonial port: a breach torn in the bank's ground floor, and the whole safe — with a
// chunk of the wall still clinging to it — is dragged out over the cobbles by a team of horses (their hindquarters
// in the picture, the chains taut); coins trickle from the sprung door all the way from the hole; the watchman
// runs up the street with his lantern. The moon over the roofs on the right is the light; the lantern is a warm
// second one on the left.
// Fixed against the first round: the horses were stick figures — now they have rumps, hocks, tails and harness, one
// hind leg pushing, one swinging; the safe floated in front of the hole — it sits on the cobbles, its feet scrape
// sparks; the coin column stood in the air — the coins lie in a trail; the cobbles were one stamp in rows — each
// stone its own, in perspective, wet under the moon; the facade has plaster, brick under it, quoins and a lit corner.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;

const HZ = 100, ST = 128, CORNER = 148;                // eye level; the foot of the facade (the street begins); the building's corner
const SAFE = { x: 98, y: 127, w: 54, h: 42 };          // the safe: middle of its foot on the cobbles
const GUARD = { x: 22, y: 128 };
const light = { time: 'night', haze: .35, key: { type: 'moon', x: 174, y: 48, az: 55, el: 30, color: '#d4e0f6', power: .85 }, fill: { color: '#34486c', power: .4 },
  rim: { az: 50, color: '#cfe0ff', power: .5 }, locals: [{ x: GUARD.x + 8, y: GUARD.y - 14, color: '#ffc060', power: .7, radius: 40 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon over the roofs upper right (from the right, a little behind): lit edges on the right, shadows to the left and towards us; the watchman\'s lantern a warm local light on the left', items: [
  ['facade', -4, ST, 152, 128, 'street'], ['breach', 42, ST, 84, 58, 'facade ground floor'], ['safe', 71, SAFE.y, 54, 52, 'cobbles (castors), wall chunk on its back'],
  ['horse near', 148, 128, 56, 54, 'cobbles (hooves)'], ['horse far', 160, 122, 44, 44, 'cobbles'], ['chains', 124, 104, 30, 12, 'safe → whippletree'],
  ['watchman', 10, GUARD.y, 26, 36, 'cobbles'], ['coins', 40, 150, 100, 20, 'cobbles'], ['moon', 166, 56, 16, 16, 'sky']] };

const lerp = (a, b, t) => a + (b - a) * t;
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// cobbles in perspective: rows growing towards us, every stone its own rounded shape, a wet sheen on the moon side
// and a glitter path under the moon
function cobbles(u, L, y0, y1) {
  const R = rng(17), g = nid('cb', u);
  let out = `<defs>${linGrad(g, 0, y0, 0, y1, [[0, '#2a2c36', 1], [1, '#121318', 1]])}</defs><rect x="-5" y="${y0}" width="210" height="${y1 - y0 + 5}" fill="url(#${g})"/>`;
  for (let y = y0 + .6, k = 0; y < y1; k++) {
    const h = 1.6 + (y - HZ) * .085, w = h * (1.7 + R() * .3);
    for (let x = -8 - R() * w; x < 206; x += w * (.95 + R() * .2)) {
      const ww = w * (.8 + R() * .18), hh = h * (.78 + R() * .15), cx = x + ww / 2, cy = y + hh / 2, d = 160 - Math.abs(cx - 170) * .9;   // glitter under the moon (x 170)
      const pts = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2, r = 1 + (R() - .5) * .22; return [cx + Math.cos(a) * ww / 2 * r, cy + Math.sin(a) * hh / 2 * r]; });
      const tone = R(), base = mix('#3c3e4a', '#5a5c68', tone), top = mix(base, '#a8b4cc', .25 + Math.max(0, d) / 400);
      out += `<path d="${smooth(pts, true)}" fill="${base}" stroke="#0c0d12" stroke-width="${f(.25 + h * .03)}"/>`
        + `<path d="M${f(cx - ww * .32)} ${f(cy - hh * .2)}Q${f(cx)} ${f(cy - hh * .52)} ${f(cx + ww * .36)} ${f(cy - hh * .18)}" stroke="${top}" stroke-width="${f(.25 + h * .07)}" fill="none" opacity="${f(.45 + Math.max(0, d) / 300)}" stroke-linecap="round"/>`;
      if (d > 120 && R() > .35) out += `<ellipse cx="${f(cx + ww * .1)}" cy="${f(cy - hh * .22)}" rx="${f(ww * .16)}" ry="${f(hh * .08)}" fill="#e8f0ff" opacity="${f((d - 120) / 80)}"/>`;
    }
    y += h;
  }
  return out;
}
// one horse seen from the side, its hindquarters in the picture, walking away to the right (the forehand cropped by
// the frame): rump, tail streaming back, gaskin, hock, cannon, fetlock, hoof; the breeching strap and the trace
function horse(u, L, x, y, s, c, o = {}) {
  const g = nid('hs', u), hl = nid('hl', u), R = rng(o.seed || 3);
  const P = (lx, ly) => [x + lx * s, y + ly * s];
  const pd = pts => smooth(pts.map(([a, b]) => P(a, b)));
  let out = `<defs>${linGrad(g, x, y - 46 * s, x, y, [[0, c[0], 1], [.45, c[1], 1], [1, c[2], 1]])}${linGrad(hl, x, 0, x + 50 * s, 0, [[0, c[2], 1], [.6, c[1], 1], [1, c[0], 1]])}</defs>`;
  // the far hind leg (darker), reaching forward under the belly
  const far = [[10, -26], [16, -22], [19, -12], [20, -4], [22, -.4], [26, -.4], [25.4, -3], [23.6, -5], [23, -14], [22, -24], [20, -30]];
  out += `<path d="${pd(far)}Z" fill="${c[2]}" stroke="#0a0604" stroke-width=".4"/>`;
  // the body: back line from the croup, the rump's round, the belly running off to the right
  const body = [[46, -44], [24, -45.6], [10, -43], [2, -38], [-.6, -31], [1.4, -24], [6, -20], [12, -19], [24, -18.6], [40, -18], [56, -19], [56, -44]];
  out += `<path d="${pd(body)}Z" fill="url(#${g})" stroke="#0a0604" stroke-width=".5"/>`;
  // the near hind leg, pushing back: gaskin, hock bent backwards, the cannon slanting, the hoof on the cobbles
  const near = [[2, -33], [-1.6, -25], [-4, -17], [-5.4, -13.4], [-7.4, -7], [-9, -2.6], [-10.2, 0], [-4.8, 0], [-4.4, -2.6], [-2.8, -7], [-1.2, -11.6], [3, -15.4], [9, -19], [15, -22.6], [18, -30]];
  out += `<path d="${pd(near)}Z" fill="url(#${hl})" stroke="#0a0604" stroke-width=".5"/>`
    + `<path d="M${f(P(-10.4, -.2)[0])} ${f(P(-10.4, -.2)[1])}L${f(P(-4.4, -.2)[0])} ${f(P(-4.4, -.2)[1])}L${f(P(-5, -2.8)[0])} ${f(P(-5, -2.8)[1])}L${f(P(-9.6, -2.6)[0])} ${f(P(-9.6, -2.6)[1])}Z" fill="#141010" stroke="#000" stroke-width=".3"/>`
    + `<path d="M${f(P(-9.4, -2.8)[0])} ${f(P(-9.4, -2.8)[1])}q${f(1.2 * s)} ${f(-1.6 * s)} ${f(4.2 * s)} ${f(-.2 * s)}" stroke="${c[0]}" stroke-width="${f(.8 * s)}" fill="none" opacity=".6"/>`;   // feathering at the fetlock
  // muscles: the round of the quarter and the hock's point catch the moon on the right... a soft lit line on top
  out += `<path d="${pd([[4, -37], [12, -43], [26, -45], [44, -44]])}" stroke="${o.rim || '#d8e4f8'}" stroke-width="${f(.5 * s)}" fill="none" opacity=".75"/>`
    + `<path d="${pd([[3, -28], [6, -33], [12, -36]])}" stroke="${c[0]}" stroke-width="${f(.5 * s)}" fill="none" opacity=".6"/>`
    + `<path d="${pd([[-3, -13], [-1, -16]])}" stroke="${c[0]}" stroke-width="${f(.7 * s)}" fill="none" opacity=".7"/>`;
  // the tail: a thick dock streaming back and down, strands
  const t0 = P(2, -40); let tail = '';
  for (let i = 0; i < 9; i++) { const sw = (i - 4) * .9, len = 22 + R() * 6; tail += `<path d="M${f(t0[0])} ${f(t0[1])}C${f(t0[0] - 8 * s)} ${f(t0[1] - 2 * s + sw)} ${f(t0[0] - 14 * s)} ${f(t0[1] + 6 * s + sw)} ${f(t0[0] - (16 + R() * 4) * s)} ${f(t0[1] + (len * .6 + sw) * s)}" stroke="${i % 3 ? '#140c08' : '#3a2416'}" stroke-width="${f((1.2 - Math.abs(i - 4) * .1) * s)}" fill="none" stroke-linecap="round"/>`; }
  out += tail;
  // harness: the breeching strap round the quarters, the hip strap, the trace along the flank, brass studs
  out += `<path d="${pd([[1, -30], [10, -28], [24, -28], [40, -29]])}" stroke="#1a0e08" stroke-width="${f(2.2 * s)}" fill="none"/><path d="${pd([[1, -30.6], [10, -28.6], [24, -28.6], [40, -29.6]])}" stroke="#6a4428" stroke-width="${f(.5 * s)}" fill="none" opacity=".8"/>`
    + `<path d="${pd([[22, -45.4], [22.6, -36], [22, -28]])}" stroke="#1a0e08" stroke-width="${f(1.8 * s)}" fill="none"/>`
    + [[10, -28.4], [24, -28.4], [22.4, -38]].map(([a, b]) => { const p = P(a, b); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.6 * s)}" fill="#d8b050"/>`; }).join('');
  return out;
}
// the watchman running up the street from the left, coat flying, lantern swinging forward
function watchman(u, L, x, y) {
  const c = '#141420', e = '#3a3a4a';
  let out = K.contactShadow(u, x + 1, y, 18, L, { ry: 1.2, opacity: .6 });
  out += `<path d="M${x - 3} ${y - 22}C${x - 6} ${y - 18} ${x - 10} ${y - 12} ${x - 12} ${y - 9}L${x - 6} ${y - 10}C${x - 4} ${y - 14} ${x - 2} ${y - 17} ${x} ${y - 19}Z" fill="${c}"/>`     // coat tail flying back
    + `<path d="M${x - 4} ${y - 24}C${x - 4} ${y - 30} ${x + 4} ${y - 31} ${x + 5} ${y - 25}L${x + 4} ${y - 13}C${x + 1} ${y - 12} ${x - 2} ${y - 12} ${x - 4} ${y - 14}Z" fill="${c}"/>`   // body leaning forward
    + `<path d="M${x - 2} ${y - 13}L${x - 7} ${y - 6}L${x - 10} ${y - 1}L${x - 8} ${y}L${x - 4} ${y - 5}L${x + 1} ${y - 11}Z" fill="${c}"/>`                                        // back leg
    + `<path d="M${x + 1} ${y - 13}L${x + 6} ${y - 7}L${x + 6} ${y - .6}L${x + 9.4} ${y - .4}L${x + 9} ${y - 1.8}L${x + 8} ${y - 8}L${x + 4} ${y - 14}Z" fill="${c}"/>`                    // front leg
    + `<circle cx="${x + 2.4}" cy="${y - 33}" r="2.9" fill="${c}"/><path d="M${x - 2.6} ${y - 34.6}L${x + 7.6} ${y - 35.6}L${x + 5.6} ${y - 38}L${x + 2.6} ${y - 37}L${x - .4} ${y - 38}Z" fill="${c}"/>`   // head, tricorne
    + `<path d="M${x + 3} ${y - 26}L${x + 9} ${y - 21}L${x + 11} ${y - 18}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`                                        // arm with the lantern
    + `<path d="M${x - 2} ${y - 26}L${x - 7} ${y - 22}" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
  // the lantern's light catching the front edges of him
  out += `<path d="M${x + 5} ${y - 25}L${x + 4} ${y - 14}M${x + 6} ${y - 7}L${x + 6} ${y - 1}M${x + 5} ${y - 34}q.6 1.6 -.6 3" stroke="#ffb050" stroke-width=".5" fill="none" opacity=".8"/>`;
  // the lantern: a little box with a bright window
  out += `<path d="M${x + 11} ${y - 18}v1.2" stroke="#2a2a2a" stroke-width=".5"/><rect x="${x + 9.4}" y="${y - 16.8}" width="3.6" height="4.6" rx=".6" fill="#ffd27a" stroke="#3a2a10" stroke-width=".4"/><path d="M${x + 9} ${y - 17}h4.4" stroke="#3a2a10" stroke-width=".6"/>`;
  return out;
}

module.exports = { name: 'Ограбление банка', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // the sky over the roofs on the right: stars, the moon, a cloud; the far roofs and a palm in silhouette
    let bg = K.sky(u, L, { horizon: HZ, stars: 40, seed: 6 }) + K.sunMoon(u, L, { r: 6.4 }) + K.cloud(u, L, { x: 184, y: 30, w: 30, h: 5, seed: 7, far: .4 });
    bg += `<path d="M${CORNER} 104L156 96L164 98L168 90L184 92L188 86L200 88V${ST}H${CORNER}Z" fill="#141a28"/><rect x="170" y="94" width="3" height="3" fill="#ffc870" opacity=".75"/>`
      + `<path d="M190 ${ST - 26}q1 -14 -2 -24" stroke="#10141e" stroke-width="1.6" fill="none"/>` + [[-1, -.6], [-.8, .2], [.2, -.9], [.9, -.2], [1, .5]].map(([a, b]) => `<path d="M188 78q${f(a * 6)} ${f(b * 4 - 2)} ${f(a * 12)} ${f(b * 6 + 3)}" stroke="#10141e" stroke-width="1.4" fill="none"/>`).join('');
    // the facade: plaster in moonlight from the side (the right edge lit), cracks, the tiled eaves
    { const fg0 = nid('fc', u); bg += `<defs>${linGrad(fg0, 0, 0, CORNER, 0, [[0, '#22242e', 1], [.6, '#363846', 1], [1, '#4c4e5e', 1]])}</defs><rect x="-4" y="0" width="${CORNER + 4}" height="${ST}" fill="url(#${fg0})"/>`;
      const R = rng(3); for (let i = 0; i < 34; i++) { const x = R() * 140, y = 22 + R() * 100, w = 3 + R() * 7; bg += `<path d="M${f(x)} ${f(y)}h${f(w)}" stroke="${R() > .5 ? '#4a4c5c' : '#16171e'}" stroke-width="${f(.6 + R())}" opacity=".35" stroke-linecap="round"/>`; }
      bg += `<path d="M12 40l3 6l-1 5l4 7M132 70l-4 6l2 5" stroke="#121218" stroke-width=".5" fill="none" opacity=".8"/>`;
      // plaster fallen off in a patch, the bricks under it
      bg += `<path d="M14 92q6 -4 12 -1q4 4 1 9q-7 3 -13 -1z" fill="#3a2420"/>` + [[15, 93], [21, 93], [17, 96], [23, 96]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="2.4" fill="#6a3a2c" stroke="#24140e" stroke-width=".3"/>`).join('');
      // quoins at the corner, lit on their right faces by the moon
      for (let y = 20, k = 0; y < ST; y += 9, k++) { const w = k % 2 ? 9 : 13; bg += `<rect x="${CORNER - w}" y="${y}" width="${w}" height="8.4" fill="#40424e" stroke="#16171e" stroke-width=".4"/><path d="M${CORNER - .5} ${y}v8.4" stroke="#d8e0f0" stroke-width=".9" opacity=".8"/><path d="M${CORNER - w} ${y + .4}h${w}" stroke="#7a7e90" stroke-width=".4" opacity=".6"/>`; }
      // eaves: the roof tiles in a row of half-round ends, each lit on its right
      const tg = nid('tl', u); bg += `<defs>${linGrad(tg, 0, 0, 10, 0, [[0, '#3a1a14', 1], [.6, '#6a3426', 1], [1, '#9a5a40', 1]])}</defs><path d="M-6 0H${CORNER + 4}V15H-6Z" fill="#4a2620"/>`;
      for (let x = -6; x < CORNER + 4; x += 9.6) bg += `<path d="M${f(x)} 15.6q4.8 -6 9.6 0v-12h-9.6z" fill="url(#${tg})" stroke="#1a0a06" stroke-width=".5"/>`;
      bg += `<path d="M-6 16.4H${CORNER + 4}" stroke="#0e0604" stroke-width="1.8"/><path d="M-6 19H${CORNER}" stroke="#000" stroke-width="2.4" opacity=".35"/>`; }
    // the upper floor: two windows (one lit — a sleepy clerk), the balcony on brackets, its wrought rail, the patterned sign
    bg += `<rect x="78" y="24" width="18" height="22" fill="#0c0e16" stroke="#2a2c36" stroke-width="1.6"/><path d="M87 24v22M78 35h18" stroke="#2a2c36" stroke-width=".9"/>`
      + `<rect x="108" y="24" width="18" height="22" fill="#e8a850" opacity=".85" stroke="#2a2c36" stroke-width="1.6"/><path d="M117 24v22M108 35h18" stroke="#3a2c1a" stroke-width=".9"/>` + K.localGlow(u, { x: 117, y: 35, color: '#ffb050', power: .4, radius: 14 }, { core: false })
      + `<path d="M58 52h88v3.6h-88z" fill="#3a3a46"/><path d="M58 55.6h88" stroke="#0a0a10" stroke-width="2"/>` + [64, 104, 140].map(x => `<path d="M${x} 55.6l3 6v-6z" fill="#2a2a34"/>`).join('')
      + `<path d="M60 44h84" stroke="#1a1a22" stroke-width="1.3"/>` + Array.from({ length: 14 }, (_, k) => `<path d="M${62 + k * 6} 52v-8" stroke="#1a1a22" stroke-width=".8"/>` + (k % 2 ? `<path d="M${62 + k * 6} 48q3 -3 6 0" stroke="#1a1a22" stroke-width=".5" fill="none"/>` : '')).join('')
      + `<rect x="58" y="56" width="88" height="10" fill="#08080e" opacity=".45"/>`;
    { const sg = nid('sg', u); bg += `<defs>${linGrad(sg, 0, 30, 0, 46, [[0, '#7a5030', 1], [1, '#3a2210', 1]])}</defs><rect x="68" y="32" width="64" height="12" rx="1.5" fill="url(#${sg})" stroke="#1a0e06" stroke-width=".6"/>`
        + Array.from({ length: 6 }, (_, k) => `<path d="M${74 + k * 9.4} 38q2.3 -3.4 4.6 0t4.6 0" stroke="#e8c46a" stroke-width=".8" fill="none"/>`).join('') + `<rect x="71" y="34.4" width="58" height="7.2" fill="none" stroke="#c9a048" stroke-width=".5"/><path d="M74 32v-6M126 32v-6" stroke="#2a2a2a" stroke-width=".7"/>`; }
    // the torn shutter hanging on one hinge by the ground-floor window on the left
    bg += `<rect x="16" y="50" width="20" height="28" fill="#0c0e16" stroke="#2a2c36" stroke-width="1.4"/><path d="M26 50v28" stroke="#2a2c36" stroke-width=".8"/>`
      + `<g transform="rotate(26 36 52)"><rect x="36" y="52" width="10" height="27" fill="#34503e" stroke="#16241a" stroke-width=".6"/>${[0, 1, 2, 3, 4, 5].map(k => `<path d="M37 ${56 + k * 4}h8" stroke="#16241a" stroke-width=".7"/><path d="M37 ${56.7 + k * 4}h8" stroke="#5a7a62" stroke-width=".3"/>`).join('')}</g>`
      + `<circle cx="36" cy="52" r="1" fill="#2a2a2a"/>`;
    // the breach: a ragged hole, the brick courses showing in its edge, the vault inside (shelves, bags, a dropped lamp)
    { const hole = [[42, ST], [41, 104], [46, 92], [52, 86], [58, 80], [66, 76], [74, 72], [84, 70], [96, 71], [106, 74], [114, 80], [119, 88], [122, 98], [125, 112], [126, ST]], hg = nid('hg', u), hc = nid('hc', u);
      const d = 'M' + hole.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
      bg += `<defs>${radGrad(hg, 84, 112, 46, [[0, '#1a1410', 1], [1, '#040406', 1]])}<clipPath id="${hc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${hg})"/>`
        + `<g clip-path="url(#${hc})"><path d="M44 96h80M44 108h80" stroke="#1e160e" stroke-width="1.6"/>`
        + [[48, 92], [56, 91], [62, 92], [102, 92], [110, 91], [50, 104], [104, 104]].map(([x, y], i) => `<path d="M${x} ${y}q2 -4 4 0z" fill="#3a2a18" opacity="${.6 + i % 2 * .2}"/>`).join('')
        + K.localGlow(u, { x: 60, y: 120, color: '#ff9a40', power: .25, radius: 16 }, { core: false }) + `</g>`;
      // the ragged rim: plaster edge, then broken bricks in courses
      const R = rng(12); let rim = '';
      for (let i = 0; i < hole.length - 1; i++) { const [x0, y0] = hole[i], [x1, y1] = hole[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4.5));
        for (let j = 0; j < n; j++) { const t = (j + .5) / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t), nx = (x - 84), ny = (y - 112), l = Math.hypot(nx, ny) || 1, ox = nx / l * 2.4, oy = ny / l * 2.4, w = 3.6 + R() * 1.6;
          rim += `<rect x="${f(x + ox - w / 2)}" y="${f(y + oy - 1.1)}" width="${f(w)}" height="2.2" fill="${mix('#6a3626', '#9a5a40', R())}" stroke="#24120a" stroke-width=".3" transform="rotate(${f((R() - .5) * 20)} ${f(x + ox)} ${f(y + oy)})"/>`; } }
      bg += rim + `<path d="${d.replace('Z', '')}" fill="none" stroke="#7a7a86" stroke-width=".8" opacity=".7"/>`; }
    // the street: cobbles in perspective, wet under the moon
    bg += cobbles(u, L, ST, 285) + `<path d="M-4 ${ST}H${CORNER}" stroke="#08080c" stroke-width="1.4"/><path d="M-4 ${ST + .6}H${CORNER}" stroke="#4a4c58" stroke-width=".5" opacity=".6"/>`;
    // the watchman's lantern light on the wall and the cobbles at the left
    bg += K.localGlow(u, { x: GUARD.x + 10, y: GUARD.y - 16, color: '#ffb050', power: .55, radius: 34 }, { core: false }) + K.localGlow(u, { x: GUARD.x + 12, y: GUARD.y + 6, color: '#ffb050', power: .45, radius: 26 }, { squash: .35, core: false });
    let fg = '';
    // rubble at the foot of the breach, brick bits on the cobbles
    { const R = rng(21); for (let i = 0; i < 16; i++) { const x = 40 + R() * 90, y = ST + 1 + R() * 18, w = 2 + R() * 3.4, a = R() * 180;
        fg += K.contactShadow(u, x, y + 1, w * 1.4, L, { ry: .7, opacity: .5 }) + `<rect x="${f(x - w / 2)}" y="${f(y - w * .3)}" width="${f(w)}" height="${f(w * .55)}" fill="${mix('#6a3626', '#a86a4a', R())}" stroke="#24120a" stroke-width=".3" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`; } }
    // dust from the breach drifting left in the moonlight
    fg += K.smoke(u, L, { x: 52, y: ST - 2, w: 34, h: 26, wind: -.6, seed: 9, opacity: .45 });
    // the coins: a trail from the hole to the safe's sprung door, glinting
    { const R = rng(31), cg = nid('co', u); fg += `<defs>${linGrad(cg, 0, 0, 3, 0, [[0, '#8a6020', 1], [.5, '#f2c860', 1], [1, '#fff0b0', 1]])}</defs>`;
      for (let i = 0; i < 26; i++) { const t = R(), x = lerp(50, 132, t) + (R() - .5) * 10, y = ST + 4 + R() * 16 + t * 4, r = 1.1 + (y - ST) * .05;
        fg += `<ellipse cx="${f(x)}" cy="${f(y + .4)}" rx="${f(r)}" ry="${f(r * .38)}" fill="#3a2a0a"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .38)}" fill="url(#${cg})" stroke="#5a3a0a" stroke-width=".2"/>`; } }
    // the safe: iron box with a chunk of the brick wall still on its back, on castors, chains round it
    { const { x, y, w, h } = SAFE, x0 = x - w / 2, top = y - h - 4;
      fg += K.castShadow(u, L, { x, y, w: w * .9, h: h, horizon: HZ, d: .6, opacity: .6 });
      // the wall chunk behind the top left: bricks with mortar, plaster on its face
      // the body: front, top and the right side lit by the moon (box faces)
      fg += K.shadeBox(u, K.boxFaces(x0, y - 4, w, h, 6, 5), L, 'iron', { seed: 4 });
      // the chunk of the bank's wall torn out with it, lying on its top: brick courses, a plaster face, a broken edge
      { const cy0 = y - h - 4.6, R = rng(61); let ch = '';
        const rows = [[x0 + 2, 6], [x0 + 4, 5], [x0 + 3, 4], [x0 + 6, 2]];
        rows.forEach(([bx0, n], r) => { for (let c = 0; c < n; c++) { const bx = bx0 + c * 6.8 + (r % 2) * 3.4, by = cy0 - (r + 1) * 3.9; ch += `<rect x="${f(bx)}" y="${f(by)}" width="6.4" height="3.6" fill="${mix('#6a3626', '#a86a4a', R())}" stroke="#2a1410" stroke-width=".45"/><path d="M${f(bx + .3)} ${f(by + .4)}h5.8" stroke="#d89a78" stroke-width=".3" opacity=".6"/>`; } });
        ch += `<path d="M${f(x0 + 1)} ${f(cy0)}L${f(x0 + 1.4)} ${f(cy0 - 9)}L${f(x0 + 5)} ${f(cy0 - 12)}L${f(x0 + 3.6)} ${f(cy0 - 8)}L${f(x0 + 4)} ${f(cy0)}Z" fill="#5a5c6a" stroke="#1a1a20" stroke-width=".4"/>`
          + `<path d="M${f(x0 + 1)} ${f(cy0 + .3)}H${f(x0 + 44)}" stroke="#08080c" stroke-width="1"/>`;
        fg += K.contactShadow(u, x0 + 22, cy0 + .6, 44, L, { ry: 1.2, opacity: .7 }) + ch; }
      // the door: an inset panel, brass edging, the dial, the handle; sprung a little, coins in the gap
      const dg = nid('dg', u); fg += `<defs>${linGrad(dg, x0, 0, x0 + w, 0, [[0, '#1a1e24', 1], [.7, '#2a3038', 1], [1, '#3a424c', 1]])}</defs><rect x="${f(x0 + 4)}" y="${f(y - h)}" width="${f(w - 8)}" height="${f(h - 8)}" rx="1.5" fill="url(#${dg})" stroke="#c9a048" stroke-width="1"/>`
        + `<path d="M${f(x0 + w - 4.2)} ${f(y - h + 1)}v${f(h - 10)}" stroke="#ffd27a" stroke-width=".8" opacity=".7"/>`;
      const dx = x - 6, dy = y - h / 2 - 4; fg += K.shadeCyl(u, dx, dy, dx, dy - 1, 6.4, L, 'brass', { ell: 1, face: 1, outline: .4 }) + `<circle cx="${dx}" cy="${dy - .5}" r="2.6" fill="#2a1e0a"/>`
        + Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<path d="M${f(dx + Math.cos(a) * 4.6)} ${f(dy - .5 + Math.sin(a) * 4.6)}L${f(dx + Math.cos(a) * 5.8)} ${f(dy - .5 + Math.sin(a) * 5.8)}" stroke="#5a4010" stroke-width=".4"/>`; }).join('')
        + K.shadeCyl(u, x + 12, dy - 6, x + 12, dy + 6, 1.1, L, 'brass', { outline: .3 }) + K.shadeSphere(u, x + 12, dy - 6.4, 1.6, L, 'brass') + K.shadeSphere(u, x + 12, dy + 6.4, 1.6, L, 'brass');
      // rivets along the edges
      for (let i = 0; i < 9; i++) { const rx = x0 + 2 + i * (w - 4) / 8; fg += `<circle cx="${f(rx)}" cy="${f(y - h - 2.4)}" r=".6" fill="#6a7480"/><circle cx="${f(rx)}" cy="${f(y - 5.6)}" r=".6" fill="#6a7480"/>`; }
      // castors and the sparks where the iron scrapes the cobbles
      for (const cx of [x0 + 7, x0 + w - 6]) fg += K.contactShadow(u, cx, y + 1, 9, L, { ry: 1.2, opacity: .8 }) + K.shadeCyl(u, cx - 3, y - 2, cx + 3, y - 2, 2.6, L, 'iron', { ell: 1, face: 2, outline: .35 });
      { const R = rng(41); for (let i = 0; i < 12; i++) { const sx = x0 + 3 + R() * 6, sy = y - R() * 2, l = 2 + R() * 4, a = Math.PI + (R() - .5) * 1.2; fg += `<path d="M${f(sx)} ${f(sy)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l - R() * 2)}" stroke="#ffd070" stroke-width=".45" stroke-linecap="round" opacity=".9"/>`; }
        fg += K.localGlow(u, { x: x0 + 4, y: y - 1, color: '#ffc060', power: .5, radius: 7 }); }
      // coins spilling from the door's gap down the front
      { const R = rng(51); for (let i = 0; i < 5; i++) { const cx = x0 + w - 6 + i * 2.6 + R() * 2, cy = y - h * .45 + i * 5.2; fg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.5" ry=".7" fill="#f2c860" stroke="#5a3a0a" stroke-width=".25" transform="rotate(${f(R() * 60 - 30)} ${f(cx)} ${f(cy)})"/>`; } }
      // the chains: round the safe and to the whippletree behind the horses (taut, straight-ish)
      fg += K.chain(u, L, [[x0 + w + 2, y - h + 8], [126, y - h + 9], [140, 102], [152, 104]], { link: 2.4, seed: 3 }) + K.chain(u, L, [[x0 + w + 2, y - 16], [130, y - 18], [146, 110], [154, 108]], { link: 2.4, seed: 7 });
      fg += K.shadeCyl(u, 152, 98, 152, 114, 1.4, L, 'oak', { outline: .35 }); }
    // the horses: the far one first (darker, a little higher), then the near one, both stepping off to the right
    fg += K.castShadow(u, L, { x: 176, y: 124, w: 24, h: 40, horizon: HZ, d: .5, opacity: .5 }) + horse(u, L, 168, 123, .82, ['#3a2a20', '#2a1c14', '#140c08'], { seed: 5, rim: '#a8b8d0' });
    fg += K.castShadow(u, L, { x: 172, y: 128, w: 26, h: 46, horizon: HZ, d: .5, opacity: .55 }) + horse(u, L, 156, 129, 1.02, ['#7a4a2a', '#4a2a16', '#1e120a'], { seed: 3 });
    // the traces from the whippletree to the near horse's breeching
    fg += `<path d="M152 104L157 99.4M152 110L160 101" stroke="#1a0e08" stroke-width="1.2"/>`;
    // the watchman
    fg += watchman(u, L, GUARD.x, GUARD.y) + K.localGlow(u, { x: GUARD.x + 11.2, y: GUARD.y - 14.5, color: '#ffd080', power: .85, radius: 9 });
    // light: the moon's veil, the dark under the glass
    fg += glow(u, 172, 50, 70, 50, '#c8d8f0', .12) + gloom(u, 160, 40, 0, 100, .3, '#04060c') + gloom(u, 100, 140, 100, 280, .62, '#020408');
    return [bg, fg];
  } };
