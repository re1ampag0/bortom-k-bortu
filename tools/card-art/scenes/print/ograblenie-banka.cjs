// «Ограбление банка» (Жемчужина, ПРИКАЗ: заберите 1 Порох из Трюма противника в свой), variant A of the method trial
// (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-pearl.cjs SCENES['Ограбление банка'])
// at its best. Night in a colonial port: a breach torn in the bank's ground floor, and the whole safe — with a
// chunk of the wall still clinging to it — is dragged out over the cobbles by a team of horses (whole, pulling away
// to the right, heads into the collars, the chains taut to the hames); coins trickle from the sprung door all the way from the hole; the watchman
// runs up the street with his lantern. The moon over the roofs on the right is the light; the lantern is a warm
// second one on the left.
// Fixed against the first round: the horses were stick figures — now they have rumps, hocks, tails and harness, one
// hind leg pushing, one swinging; the safe floated in front of the hole — it sits on the cobbles, its feet scrape
// sparks; the coin column stood in the air — the coins lie in a trail; the cobbles were one stamp in rows — each
// stone its own, in perspective, wet under the moon; the facade has plaster, brick under it, quoins and a lit corner.
// Second pass: the stars as in the first round (a warm scatter over the roofs, a few with a cross); the moon is a sharp
// disc with relief (maria, craters, Tycho's rays), no blurred spot; the light is set by where it stands in the
// picture (low, a little right, in front of us): long shadows towards us and to the left, rims on the right. More gold,
// muted: coins in the trail and spilling from the door, ingots on the vault shelves and one fallen on the cobbles.
// Step 3 pass (print kit): the bank's sign is bolted to the wall under the eaves (it hung over the windows), the
// windows come down behind the balcony rail, a clerk in a nightcap in the lit one; the far horse stands in the side
// street round the corner (ground under it, the corner hides its tail); the watchman keeps his pose but has form —
// a coat lit by his lantern, a face in its light, his fist on the lantern's ring; a wanted bill on the wall and the
// burglars' pick leaning by the breach.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;
const MOON = { x: 172, y: 52, r: 7.5 };

const HZ = 100, ST = 128, CORNER = 148;                // eye level; the foot of the facade (the street begins); the building's corner
const SAFE = { x: 98, y: 127, w: 54, h: 42 };          // the safe: middle of its foot on the cobbles
const GUARD = { x: 22, y: 128 };
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#d4e0f6', power: .85 }, fill: { color: '#34486c', power: .4 },
  rim: { az: 30, color: '#cfe0ff', power: .5 }, locals: [{ x: GUARD.x + 8, y: GUARD.y - 14, color: '#ffc060', power: .7, radius: 40 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon low over the roofs on the right, in front of us (az and el follow from its place in the picture): rims on the right, long shadows towards us and a little to the left; the watchman\'s lantern a warm local light on the left', items: [
  ['facade', -4, ST, 152, 128, 'street'], ['breach', 42, ST, 84, 58, 'facade ground floor'], ['safe', 71, SAFE.y, 54, 52, 'cobbles (castors), wall chunk on its back'],
  ['horse near', 138, 129, 56, 40, 'cobbles (hooves)'], ['horse far', 144, 120, 48, 38, 'cobbles'], ['chains', 124, 96, 62, 16, 'safe → swingletree → collars'],
  ['watchman', 10, GUARD.y, 26, 36, 'cobbles'], ['coins', 40, 150, 100, 20, 'cobbles'], ['moon', 164, 44, 16, 16, 'sky']] };

const lerp = (a, b, t) => a + (b - a) * t;
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// cobbles in perspective: rows growing towards us, every stone its own rounded shape, a wet sheen on the moon side
// and a glitter path under the moon
function cobbles(u, L, y0, y1) {
  const R = rng(17), g = nid('cb', u);
  // four stone tones, each a gradient over the stone (lit top, darker foot) — the stones differ by tone and shape
  const sg = [0, 1, 2, 3].map(i => { const id = nid('cs', u), b = mix('#3a3c48', '#5c5e6a', i / 3); return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${mix(b, '#8a92a8', .3)}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${mix(b, '#0c0d12', .45)}"/></linearGradient>` }; });
  let out = `<defs>${linGrad(g, 0, y0, 0, y1, [[0, '#2a2c36', 1], [1, '#121318', 1]])}${sg.map(q => q.def).join('')}</defs><rect x="-5" y="${y0}" width="210" height="${y1 - y0 + 5}" fill="url(#${g})"/>`;
  for (let y = y0 + .6, k = 0; y < y1; k++) {
    const h = 1.6 + (y - HZ) * .085, w = h * (1.7 + R() * .3);
    for (let x = -8 - R() * w; x < 206; x += w * (.95 + R() * .2)) {
      const ww = w * (.8 + R() * .18), hh = h * (.78 + R() * .15), cx = x + ww / 2, cy = y + hh / 2, d = 160 - Math.abs(cx - 170) * .9;   // glitter under the moon (x 170)
      const pts = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2, r = 1 + (R() - .5) * .22; return [cx + Math.cos(a) * ww / 2 * r, cy + Math.sin(a) * hh / 2 * r]; });
      const tone = R(), base = mix('#3c3e4a', '#5a5c68', tone), top = mix(base, '#a8b4cc', .25 + Math.max(0, d) / 400);
      out += `<path d="${smooth(pts, true)}" fill="url(#${sg[Math.floor(tone * 3.999)].id})" stroke="#0c0d12" stroke-width="${f(.25 + h * .03)}"/>`
        + `<path d="M${f(cx - ww * .32)} ${f(cy - hh * .2)}Q${f(cx)} ${f(cy - hh * .52)} ${f(cx + ww * .36)} ${f(cy - hh * .18)}" stroke="${top}" stroke-width="${f(.25 + h * .07)}" fill="none" opacity="${f(.45 + Math.max(0, d) / 300)}" stroke-linecap="round"/>`;
      if (d > 120 && R() > .35) out += `<ellipse cx="${f(cx + ww * .1)}" cy="${f(cy - hh * .22)}" rx="${f(ww * .16)}" ry="${f(hh * .08)}" fill="#e8f0ff" opacity="${f((d - 120) / 80)}"/>`;
    }
    y += h;
  }
  return out;
}
// one draught horse seen from the side, whole, pulling away to the right: the head low and forward into the collar,
// the near fore reaching, the far fore and the near hind driving back; the collar with its hames round the neck, the
// back band, the bridle; tail streaming back. (x, y) — the ground under the buttock; lift — the head raised (degrees)
function limb(pts, ws) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    L.push([pts[i][0] + nx * ws[i] / 2, pts[i][1] + ny * ws[i] / 2]); R.push([pts[i][0] - nx * ws[i] / 2, pts[i][1] - ny * ws[i] / 2]); }
  return L.concat(R.reverse());
}
// the neck and head turn about the neck's base (lift in degrees: + raised, - lowered); also used for the hame points
function bend(lx, ly, liftDeg) { const lift = (liftDeg || 0) * Math.PI / 180; if (!lift || lx < 37) return [lx, ly]; const dx = lx - 38, dy = ly + 28, c0 = Math.cos(-lift), s0 = Math.sin(-lift); return [38 + dx * c0 - dy * s0, -28 + dx * s0 + dy * c0]; }
function horse(u, L, x, y, s, c, o = {}) {
  const g = nid('hs', u), lg = nid('hl', u), R = rng(o.seed || 3);
  const hp = (lx, ly) => bend(lx, ly, o.lift);
  const P = (lx, ly) => { const q = hp(lx, ly); return [x + q[0] * s, y + q[1] * s]; };
  const pd = (pts, cl) => smooth(pts.map(([a, b]) => P(a, b)), cl);
  const leg = (pts, ws, fill) => { const q = pts[pts.length - 1], h0 = P(q[0] - 2.2, 0), h1 = P(q[0] + 2.4, 0), h2 = P(q[0] + 1.8, -2.6), h3 = P(q[0] - 1.8, -2.6);
    return `<path d="${pd(limb(pts, ws), true)}" fill="${fill}" stroke="#0a0604" stroke-width=".45"/>`
      + `<path d="M${f(h0[0])} ${f(h0[1])}L${f(h1[0])} ${f(h1[1])}L${f(h2[0])} ${f(h2[1])}L${f(h3[0])} ${f(h3[1])}Z" fill="#141010" stroke="#000" stroke-width=".3"/>`
      + `<path d="M${f(h3[0])} ${f(h3[1])}q${f(1.8 * s)} ${f(-1.2 * s)} ${f(3.6 * s)} 0" stroke="${c[0]}" stroke-width="${f(.9 * s)}" fill="none" opacity=".5"/>`; };
  let out = `<defs>${linGrad(g, x + 50 * s, y - 44 * s, x, y - 16 * s, [[0, c[0], 1], [.5, c[1], 1], [1, c[2], 1]])}${linGrad(lg, 0, y - 24 * s, 0, y, [[0, c[1], 1], [1, c[2], 1]])}</defs>`;
  // the far legs (darker): the far fore driving back, the far hind under the belly
  out += leg([[34, -22], [33, -12], [30.6, -4.4], [29.6, -1.2]], [7, 4, 3, 3.2], c[2]) + leg([[14, -27], [15.4, -17], [12.4, -10.4], [14, -3.2], [14.8, -1.2]], [9, 6, 3.6, 2.8, 3], c[2]);
  // the tail streaming back and down from the croup
  const t0 = P(1.4, -31.6); for (let i = 0; i < 9; i++) { const sw = (i - 4) * .8, len = 20 + R() * 6;
    out += `<path d="M${f(t0[0])} ${f(t0[1])}C${f(t0[0] - 6 * s)} ${f(t0[1] - 1 * s + sw)} ${f(t0[0] - 9 * s)} ${f(t0[1] + 6 * s + sw)} ${f(t0[0] - (11 + R() * 4) * s)} ${f(t0[1] + (len * .6 + sw) * s)}" stroke="${i % 3 ? '#140c08' : '#3a2416'}" stroke-width="${f((1.1 - Math.abs(i - 4) * .1) * s)}" fill="none" stroke-linecap="round"/>`; }
  // the body, the neck and the head stretched forward and down into the pull
  const body = [[1, -32], [6, -35.5], [13, -35], [21, -33], [29, -34.5], [34, -37], [39, -40.5], [44, -42.5], [47.5, -42], [51, -39.5], [55.5, -33], [58.5, -29.6], [58, -27.4], [55, -27], [51.5, -29.4], [47.5, -32], [44, -30], [41, -25], [38.5, -20.5], [32, -18.4], [22, -18], [12, -19], [6, -21], [1.5, -25], [0, -29]];
  out += `<path d="${pd(body, true)}" fill="url(#${g})" stroke="#0a0604" stroke-width=".5"/>`;
  // the ears, the eye, the nostril; the mane along the crest
  out += `<path d="${pd([[45.4, -42.2], [45, -46.6], [47.6, -42.6]], true)}" fill="${c[1]}" stroke="#0a0604" stroke-width=".35"/>`;
  { const e = P(50.4, -37.6), n = P(57.4, -29.4); out += `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${f(.9 * s)}" ry="${f(.6 * s)}" fill="#0a0604"/><circle cx="${f(e[0] + .3 * s)}" cy="${f(e[1] - .2 * s)}" r="${f(.25 * s)}" fill="#cfe0ff"/><ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="${f(.6 * s)}" ry="${f(.4 * s)}" fill="#0a0604"/>`; }
  for (let i = 0; i < 8; i++) { const t = i / 7, a = P(33 + t * 13, -37 - t * 5.4), b = P(32 + t * 12.4, -33.4 - t * 5); out += `<path d="M${f(a[0])} ${f(a[1])}Q${f(a[0] - 1.6 * s)} ${f((a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}" stroke="#140c08" stroke-width="${f(1.3 * s)}" stroke-linecap="round" fill="none"/>`; }
  // the near legs: the fore reaching forward, the hind driving back (hock bent behind)
  out += leg([[37, -22], [41, -12.4], [44.4, -4.6], [45.8, -1.2]], [7.4, 4.2, 3.2, 3.4], `url(#${lg})`) + leg([[5, -28], [8, -18.4], [2, -11.4], [-2, -3.4], [-3, -1.2]], [12, 7.4, 4, 3.2, 3.4], `url(#${lg})`);
  out += `<path d="${pd([[2, -26], [6, -21], [8.4, -18.6]])}" stroke="${c[0]}" stroke-width="${f(.5 * s)}" fill="none" opacity=".5"/>`;
  // the moon on the top line: croup, back, crest, poll
  out += `<path d="${pd([[4, -35], [13, -35.2], [21, -33.2], [29, -34.7], [34, -37.2], [39, -40.7], [44, -42.7]])}" stroke="${o.rim || '#d8e4f8'}" stroke-width="${f(.55 * s)}" fill="none" opacity=".75"/>`;
  // harness: the bridle, the collar padded round the neck with its brass-tipped hames, the back band, the hame rein
  out += `<path d="${pd([[48.6, -41.2], [52.6, -33.4], [55.4, -29.6]])}M${pd([[53.6, -32.6], [56.6, -31.2], [58.2, -29.2]]).slice(1)}" stroke="#1a0e08" stroke-width="${f(.9 * s)}" fill="none"/>`;
  // the collar: a thick band of dark leather lying on the neck at the shoulder, from just over the crest down to the
  // chest point, edged with brass (the hames) along both sides, the hame tips standing up over the crest
  { const mid = [[37.6, -42.2], [39.4, -32], [41.4, -22.6]], off = d => mid.map(([a, b]) => [a + d, b + d * .18]);
    out += `<path d="${pd(mid)}" stroke="#0a0604" stroke-width="${f(4.6 * s)}" fill="none" stroke-linecap="round"/><path d="${pd(mid)}" stroke="#2e1a0e" stroke-width="${f(3.8 * s)}" fill="none" stroke-linecap="round"/>`
      + `<path d="${pd(off(.7))}" stroke="#5a3820" stroke-width="${f(1.1 * s)}" fill="none" stroke-linecap="round" opacity=".8"/>`
      + `<path d="${pd(off(1.9))}" stroke="#c9a048" stroke-width="${f(.6 * s)}" fill="none"/><path d="${pd(off(-1.9))}" stroke="#a8843a" stroke-width="${f(.5 * s)}" fill="none"/>`;
    const tip = P(37.2, -44.2); out += `<circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="${f(.75 * s)}" fill="#e8c46a" stroke="#4a320a" stroke-width=".2"/>`; }
  out += `<path d="${pd([[24, -34], [24.6, -26], [24, -18.4]])}" stroke="#1a0e08" stroke-width="${f(1.8 * s)}" fill="none"/>` + [[24.4, -30], [24.4, -23]].map(([a, b]) => { const p = P(a, b); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.6 * s)}" fill="#d8b050"/>`; }).join('')
    + `<path d="${pd([[55, -30], [46, -37], [38, -38.6], [30, -36.4]])}" stroke="#1a0e08" stroke-width="${f(.6 * s)}" fill="none" opacity=".9"/>`;
  return out;
}
// the watchman running up the street from the left, coat flying, lantern swinging forward
function watchman(u, L, x, y) {
  const cg = nid('wm', u), lgc = nid('wl', u), sk = nid('ws', u), c = `url(#${cg})`, lc = `url(#${lgc})`, hat = '#0e0e16';
  let out = K.contactShadow(u, x + 1, y, 18, L, { ry: 1.2, opacity: .6 });
  out += `<defs>${linGrad(cg, x - 8, 0, x + 8, 0, [[0, '#101320', 1], [.55, '#22263a', 1], [1, '#4a3a38', 1]])}${linGrad(lgc, x - 8, 0, x + 9, 0, [[0, '#0c0c12', 1], [1, '#2e2a2e', 1]])}`
    + `${radGrad(sk, x + 4, y - 32, 4.2, [[0, '#f0b888', 1], [.55, '#b87a52', 1], [1, '#4a2c1e', 1]])}</defs>`;
  out += `<path d="M${x - 3} ${y - 22}C${x - 6} ${y - 18} ${x - 10} ${y - 12} ${x - 12} ${y - 9}L${x - 6} ${y - 10}C${x - 4} ${y - 14} ${x - 2} ${y - 17} ${x} ${y - 19}Z" fill="${c}"/>`     // coat tail flying back
    + `<path d="M${x - 2} ${y - 13}L${x - 7} ${y - 6}L${x - 10} ${y - 1}L${x - 8} ${y}L${x - 4} ${y - 5}L${x + 1} ${y - 11}Z" fill="${lc}"/>`                                        // back leg
    + `<path d="M${x + 1} ${y - 13}L${x + 6} ${y - 7}L${x + 6} ${y - .6}L${x + 9.4} ${y - .4}L${x + 9} ${y - 1.8}L${x + 8} ${y - 8}L${x + 4} ${y - 14}Z" fill="${lc}"/>`                    // front leg
    + `<path d="M${x + 5.6} ${y - 7.4}L${x + 8.2} ${y - 8}" stroke="#6a5a4a" stroke-width=".7"/><path d="M${x + 6} ${y - .6}L${x + 9.4} ${y - .4}" stroke="#05050a" stroke-width="1"/>`   // stocking top, shoe
    + `<path d="M${x - 4} ${y - 24}C${x - 4} ${y - 30} ${x + 4} ${y - 31} ${x + 5} ${y - 25}L${x + 4} ${y - 13}C${x + 1} ${y - 12} ${x - 2} ${y - 12} ${x - 4} ${y - 14}Z" fill="${c}"/>`   // body leaning forward
    + `<path d="M${x - 3.6} ${y - 16.4}C${x - 1} ${y - 15.4} ${x + 2} ${y - 15.6} ${x + 4.3} ${y - 16.6}" stroke="#2a1a10" stroke-width="1.1" fill="none"/><path d="M${x + 2.8} ${y - 16.4}h1" stroke="#c9a048" stroke-width=".7"/>`   // belt, buckle
    + [y - 26, y - 22.6, y - 19.2].map(by => `<circle cx="${x + 3.6}" cy="${by}" r=".45" fill="#b8954a"/>`).join('')
    + `<path d="M${x - 2} ${y - 26}L${x - 7} ${y - 22}" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><circle cx="${x - 7.2}" cy="${y - 21.8}" r=".9" fill="#5a3a28"/>`   // the free arm swinging back, the fist
    + `<path d="M${x + .2} ${y - 30.2}q1.6 .8 3.4 -.2l-.4 1.6q-1.4 .6 -2.8 0z" fill="#d8d0c0"/>`   // neck stock
    + `<circle cx="${x + 2.4}" cy="${y - 33}" r="2.9" fill="url(#${sk})"/><path d="M${x + 5} ${y - 33.6}q1.1 .7 .2 1.5" fill="#d89a6a" stroke="#4a2c1e" stroke-width=".2"/>`   // face, nose toward the light
    + `<circle cx="${x + 3.9}" cy="${y - 34}" r=".32" fill="#140a06"/><path d="M${x + 3.6} ${y - 31.6}h1" stroke="#6a3a26" stroke-width=".3"/><path d="M${x} ${y - 34.2}q-1.4 1.6 -.8 3.6" stroke="#1a120c" stroke-width="1" fill="none"/>`   // eye, mouth, hair at the back
    + `<path d="M${x - 2.6} ${y - 34.6}L${x + 7.6} ${y - 35.6}L${x + 5.6} ${y - 38}L${x + 2.6} ${y - 37}L${x - .4} ${y - 38}Z" fill="${hat}"/><path d="M${x - 2.6} ${y - 34.6}L${x + 7.6} ${y - 35.6}" stroke="#4a4050" stroke-width=".35"/>`   // tricorne
    + `<path d="M${x + 3} ${y - 26}L${x + 9} ${y - 21}L${x + 11} ${y - 18.6}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;                                        // arm with the lantern
  // the lantern's light catching the front edges of him, the moon's cold rim on his back
  out += `<path d="M${x + 5} ${y - 25}L${x + 4} ${y - 14}M${x + 6} ${y - 7}L${x + 6} ${y - 1}M${x + 4.6} ${y - 27}l3.8 4" stroke="#ffb050" stroke-width=".55" fill="none" opacity=".85"/>`
    + `<path d="M${x - 4} ${y - 24}C${x - 4} ${y - 28} ${x - 2} ${y - 30} ${x + .4} ${y - 30.4}" stroke="#8a9ab8" stroke-width=".35" fill="none" opacity=".5"/>`;
  // the lantern: a little box with a bright window hanging from his fist by its ring
  out += `<path d="M${x + 11.2} ${y - 18}v1.2" stroke="#2a2a2a" stroke-width=".5"/><rect x="${x + 9.4}" y="${y - 16.8}" width="3.6" height="4.6" rx=".6" fill="#ffd27a" stroke="#3a2a10" stroke-width=".4"/><path d="M${x + 9} ${y - 17}h4.4" stroke="#3a2a10" stroke-width=".6"/>`
    + `<path d="M${x + 11.2} ${y - 16.8}v4.6" stroke="#3a2a10" stroke-width=".35"/><ellipse cx="${x + 11.1}" cy="${y - 18.6}" rx="1.1" ry=".95" fill="#c08458" stroke="#3a2016" stroke-width=".25"/>`;
  return out;
}

// the moon: a sharp disc, limb a little darker, the maria where they are on the real moon, craters with a lit rim on
// the far side from the sun, Tycho's rays; only a faint tight corona (no blurred spot)
function moonDisc(u, { x, y, r }) {
  const g = nid('md', u), c = nid('mc', u), h = nid('mh', u), R = rng(83);
  const blob = (bx, by, rx, ry, sd) => { const q = rng(sd); return smooth(Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, k = 1 + (q() - .5) * .45; return [x + (bx + Math.cos(a) * rx * k) * r, y + (by + Math.sin(a) * ry * k) * r]; }), true); };
  let out = `<defs>${radGrad(g, x - r * .15, y - r * .15, r * 1.05, [[0, '#fbf8ec', 1], [.7, '#ece8d6', 1], [1, '#c8c4b0', 1]])}${radGrad(h, x, y, r * 2.6, [[.36, '#dfe8ff', .22], [.6, '#c8d8f0', .07], [1, '#c8d8f0', 0]])}<clipPath id="${c}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath></defs>`
    + `<circle cx="${x}" cy="${y}" r="${f(r * 2.6)}" fill="url(#${h})"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/><g clip-path="url(#${c})">`;
  // the maria: Imbrium, Serenitatis, Tranquillitatis, Crisium, Procellarum, Nubium, Fecunditatis
  for (const [bx, by, rx, ry, sd, op] of [[-.24, -.36, .3, .24, 1, .5], [.2, -.3, .17, .16, 2, .5], [.3, -.02, .22, .19, 3, .48], [.7, -.22, .1, .12, 4, .55], [-.56, .06, .28, .44, 5, .4], [-.1, .36, .2, .13, 6, .38], [.5, .26, .12, .19, 7, .42]])
    out += `<path d="${blob(bx, by, rx, ry, sd)}" fill="#9a9a90" opacity="${op}"/>`;
  // craters: a dark bowl, a light rim on the lower right
  for (let i = 0; i < 11; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * .85, cx = x + Math.cos(a) * d * r, cy = y + Math.sin(a) * d * r, cr = (.04 + R() * .07) * r;
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="#a8a69a" opacity=".7"/><path d="M${f(cx + cr)} ${f(cy)}A${f(cr)} ${f(cr)} 0 0 1 ${f(cx)} ${f(cy + cr)}" stroke="#fffaf0" stroke-width="${f(cr * .45)}" fill="none" opacity=".8"/>`; }
  // Tycho and Copernicus: bright craters, Tycho's rays
  const ty = [x - .12 * r, y + .7 * r], co = [x - .36 * r, y - .02 * r];
  out += [0, 1, 2, 3, 4, 5, 6].map(k => { const a = -Math.PI / 2 + (k - 3) * .5 + (R() - .5) * .2, l = (.5 + R() * .7) * r; return `<path d="M${f(ty[0])} ${f(ty[1])}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="#fffaf0" stroke-width="${f(r * .035)}" opacity=".45"/>`; }).join('')
    + `<circle cx="${f(ty[0])}" cy="${f(ty[1])}" r="${f(r * .07)}" fill="#fffef6"/><circle cx="${f(co[0])}" cy="${f(co[1])}" r="${f(r * .06)}" fill="#f8f4e6" stroke="#b0ae9e" stroke-width="${f(r * .02)}"/>`;
  // the limb: a crisp edge, a touch darker
  return out + `</g><circle cx="${x}" cy="${y}" r="${f(r - .15)}" fill="none" stroke="#bab6a2" stroke-width=".3" opacity=".7"/>`;
}
// a gold ingot: a trapezoid bar seen from the front and above, muted gold, the moon glinting on its right edge
function ingot(u, x, y, s, rot = 0) {
  const g = nid('ig', u), t = nid('it', u);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><defs>${linGrad(g, -5, 0, 5, 0, [[0, '#5a4214', 1], [.55, '#9a7a34', 1], [1, '#c8a656', 1]])}${linGrad(t, 0, -3.6, 0, -2, [[0, '#d8bc72', 1], [1, '#a8883e', 1]])}</defs>`
    + `<ellipse cx="0" cy=".3" rx="5.6" ry=".8" fill="#08080c" opacity=".6"/><path d="M-5 0L-3.8 -2.4H3.8L5 0Z" fill="url(#${g})" stroke="#3a2808" stroke-width=".25"/>`
    + `<path d="M-3.8 -2.4L-3 -3.4H3L3.8 -2.4Z" fill="url(#${t})" stroke="#3a2808" stroke-width=".2"/><path d="M3.8 -2.4L5 0" stroke="#f0dca0" stroke-width=".35" opacity=".8"/><path d="M-2.6 -2.9h4" stroke="#7a5a1c" stroke-width=".2"/></g>`;
}

module.exports = { name: 'Ограбление банка', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // the sky over the roofs on the right: stars, the moon, a cloud; the far roofs and a palm in silhouette
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 6 }) + PK.stars(30, 140, 0, 60, 80, 6) + moonDisc(u, MOON) + K.cloud(u, L, { x: 184, y: 30, w: 30, h: 5, seed: 7, far: .4 });
    bg += `<path d="M${CORNER} 104L156 96L164 98L168 90L184 92L188 86L200 88V${ST}H${CORNER}Z" fill="#141a28"/><rect x="170" y="94" width="3" height="3" fill="#ffc870" opacity=".75"/>${(() => { const sgd = nid('sd', u); return `<defs>${linGrad(sgd, 0, 106, 0, ST, [[0, '#1a2030', 1], [1, '#2a2e3c', 1]])}</defs><path d="M${CORNER} 108.6L200 106.4V${ST}H${CORNER}Z" fill="url(#${sgd})"/><path d="M${CORNER} 108.6L200 106.4" stroke="#05070c" stroke-width=".6"/>` + [111, 114.6, 118.8, 123.4].map(yy => `<path d="M${CORNER} ${yy}L200 ${f(yy - 2.2 * (128 - yy) / 20)}" stroke="#10131c" stroke-width=".4" opacity=".8"/>`).join('') + `<ellipse cx="172" cy="116" rx="16" ry="3.2" fill="#c8d4ec" opacity=".14"/><ellipse cx="174" cy="121" rx="10" ry="1.6" fill="#e8f0ff" opacity=".18"/>`; })()}`
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
      { const R = rng(71); for (let x = -6; x < CORNER + 4; x += 9.6) { const w = 9.4 + R() * .4, hh = 5.4 + R() * 1.4, dy = (R() - .5) * .8; bg += `<path d="M${f(x)} ${f(15.6 + dy)}q${f(w / 2)} ${f(-hh)} ${f(w)} ${f(-dy * .5)}v-12h${f(-w)}z" fill="url(#${tg})" stroke="#1a0a06" stroke-width=".5"/>`; } }
      bg += `<path d="M-6 16.4H${CORNER + 4}" stroke="#0e0604" stroke-width="1.8"/><path d="M-6 19H${CORNER}" stroke="#000" stroke-width="2.4" opacity=".35"/>`; }
    // the upper floor: two windows (one lit — a sleepy clerk), the balcony on brackets, its wrought rail, the patterned sign
    bg += `<rect x="78" y="31" width="18" height="20" fill="#0c0e16" stroke="#2a2c36" stroke-width="1.6"/><path d="M87 31v20M78 40h18" stroke="#2a2c36" stroke-width=".9"/>`
      + `<rect x="108" y="31" width="18" height="20" fill="#e8a850" opacity=".85" stroke="#2a2c36" stroke-width="1.6"/><path d="M110.6 51C110.8 46.6 112 45 114.2 44.8C116.4 45 117.6 46.6 117.8 51Z" fill="#2a1a10"/><circle cx="114.2" cy="41.8" r="2.5" fill="#2a1a10"/><path d="M111.8 41.2Q113 37 117.4 37.6Q119.4 39.6 119.6 42.6" stroke="#2a1a10" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="119.8" cy="43.4" r="1" fill="#2a1a10"/><path d="M117 31v20M108 40h18" stroke="#3a2c1a" stroke-width=".9"/>` + K.localGlow(u, { x: 117, y: 41, color: '#ffb050', power: .4, radius: 14 }, { core: false })
      + `<path d="M58 52h88v3.6h-88z" fill="#3a3a46"/><path d="M58 55.6h88" stroke="#0a0a10" stroke-width="2"/>` + [64, 104, 140].map(x => `<path d="M${x} 55.6l3 6v-6z" fill="#2a2a34"/>`).join('')
      + `<path d="M60 44h84" stroke="#1a1a22" stroke-width="1.3"/>` + Array.from({ length: 14 }, (_, k) => `<path d="M${62 + k * 6} 52v-8" stroke="#1a1a22" stroke-width=".8"/>` + (k % 2 ? `<path d="M${62 + k * 6} 48q3 -3 6 0" stroke="#1a1a22" stroke-width=".5" fill="none"/>` : '')).join('')
      + `<rect x="58" y="56" width="88" height="10" fill="#08080e" opacity=".45"/>`;
    { const sg = nid('sg', u); bg += `<defs>${linGrad(sg, 0, 20, 0, 30, [[0, '#7a5030', 1], [1, '#3a2210', 1]])}</defs><rect x="68" y="20.4" width="64" height="9.4" rx="1.5" fill="url(#${sg})" stroke="#1a0e06" stroke-width=".6"/>`
        + Array.from({ length: 6 }, (_, k) => `<path d="M${74 + k * 9.4} 25.6q2.3 -2.6 4.6 0t4.6 0" stroke="#e8c46a" stroke-width=".8" fill="none"/>`).join('') + `<rect x="71" y="22.2" width="58" height="5.8" fill="none" stroke="#c9a048" stroke-width=".5"/><path d="M68.6 29.6H131.4" stroke="#000" stroke-width="1.2" opacity=".35"/><path d="M131.6 20.6v9" stroke="#c8d4ec" stroke-width=".5" opacity=".6"/>${[69.8, 130.2].map(bx => `<circle cx="${bx}" cy="25.1" r=".7" fill="#1a1a1a"/><circle cx="${bx - .2}" cy="24.9" r=".25" fill="#8a8a8a"/>`).join('')}`; }
    // a wanted bill pasted on the wall by the breach: a rough face, lines of type (no letters), one corner torn
    { const pg = nid('wp', u); bg += `<defs>${linGrad(pg, 124, 0, 134, 0, [[0, '#8a8270', 1], [1, '#c8c0a8', 1]])}</defs><g transform="rotate(4 129 72)">`
        + `<path d="M124 65.4H134V78.6H126.6L124 76Z" fill="url(#${pg})" stroke="#2a2820" stroke-width=".3"/><path d="M124 76L126.6 76.6V78.6" fill="#5a5444" stroke="#2a2820" stroke-width=".25"/>`
        + `<circle cx="129" cy="70" r="2" fill="none" stroke="#2a2418" stroke-width=".45"/><path d="M126.6 68.4L131.4 68.2L130.4 66.8L128.8 67.2L127.4 66.8Z" fill="#2a2418"/><path d="M128.2 70.6q.8 .5 1.6 0" stroke="#2a2418" stroke-width=".3" fill="none"/>`
        + `<path d="M125.6 73.4h7M125.6 75h7M127.4 76.8h5" stroke="#3a3428" stroke-width=".45"/><path d="M133.8 65.6V78.4" stroke="#e8eef8" stroke-width=".4" opacity=".7"/>`
        + [[124.8, 66.2], [133.2, 66.2], [133.2, 77.8]].map(([nx, ny]) => `<circle cx="${nx}" cy="${ny}" r=".35" fill="#1a1a1a"/>`).join('') + '</g>'; }
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
        // gold in the vault's open left side (the safe hides the rest): a stack of ingots on the upper shelf, a burst
        // bag and coins on the lower one, a heap on the floor — warmed by the dropped lamp
        + ingot(u, 54, 96, 1) + ingot(u, 63.6, 96, 1) + ingot(u, 58.8, 92.8, 1)
        + `<path d="M48 108q-1 -6 3 -8q5 -1 6 3q1 3 -1 5z" fill="#4a3418" stroke="#1a1006" stroke-width=".3"/><path d="M50.6 100.4l1.4 -1.6l1.6 1.4" stroke="#1a1006" stroke-width=".5" fill="none"/>`
        + [[57.6, 107.4], [60.4, 107.6], [62.8, 107.2], [59, 106.4], [65.2, 107.6]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="1.3" ry=".5" fill="${i % 2 ? '#b8954a' : '#8a6a2a'}" stroke="#3a2808" stroke-width=".2"/>`).join('')
        + `<path d="M56 128q6 -7 13 0z" fill="#7a5c24"/>` + [[58, 125.6], [61.6, 123.8], [64.6, 125.4], [62, 126.8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry=".55" fill="#c0a050" stroke="#3a2808" stroke-width=".2"/>`).join('')
        + K.localGlow(u, { x: 58, y: 98, color: '#ffc060', power: .3, radius: 10 }, { core: false })
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
    // the pick the burglars left leaning on the wall at the foot of the breach, against the dust, its iron head catching the lantern
    fg += K.contactShadow(u, 46.6, ST, 5, L, { ry: .7, opacity: .6 }) + `<path d="M46.4 ${ST}L50.6 107.6" stroke="#1a0e06" stroke-width="1.5" stroke-linecap="round"/><path d="M46.4 ${ST}L50.6 107.6" stroke="#8a5a30" stroke-width=".9" stroke-linecap="round"/>`
      + `<path d="M45.2 105.4Q50.4 106 55.6 110.6L55 111.2Q50.6 108 46 107.4Q44.6 107 45.2 105.4Z" fill="#3a3c46" stroke="#0c0c10" stroke-width=".3"/><path d="M46 106.2Q50.6 106.8 55 110.6" stroke="#ffb860" stroke-width=".35" fill="none" opacity=".7"/>`;
    // dust from the breach drifting left in the moonlight
    fg += K.smoke(u, L, { x: 52, y: ST - 2, w: 34, h: 26, wind: -.6, seed: 9, opacity: .45 });
    // the coins: a trail from the hole to the safe's sprung door, glinting
    { const R = rng(31), cg = nid('co', u); fg += `<defs>${linGrad(cg, 0, 0, 3, 0, [[0, '#6a4a18', 1], [.55, '#b8954a', 1], [1, '#e2cc8a', 1]])}</defs>`;
      for (let i = 0; i < 34; i++) { const t = R(), x = lerp(50, 132, t) + (R() - .5) * 10, y = ST + 4 + R() * 16 + t * 4, r = 1.1 + (y - ST) * .05;
        fg += `<ellipse cx="${f(x)}" cy="${f(y + .4)}" rx="${f(r)}" ry="${f(r * .38)}" fill="#3a2a0a"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .38)}" fill="url(#${cg})" stroke="#4a320a" stroke-width=".2"/>` + (i % 5 === 0 ? `<path d="M${f(x + r * .3)} ${f(y - r * .2)}h${f(r * .6)}" stroke="#fff4d0" stroke-width=".3" opacity=".75"/>` : ''); }
      fg += ingot(u, 60, ST + 7, 1.15, -8); }
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
      { const R = rng(51); for (let i = 0; i < 8; i++) { const cx = x0 + w - 6 + i * 1.8 + R() * 2, cy = y - h * .5 + i * 3.6; fg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="1.5" ry=".7" fill="${i % 2 ? '#c8a656' : '#a8883e'}" stroke="#4a320a" stroke-width=".25" transform="rotate(${f(R() * 60 - 30)} ${f(cx)} ${f(cy)})"/>`; } }
      // the chains: from the safe's straps to the swingletree behind the team (taut, straight-ish)
      fg += K.chain(u, L, [[x0 + w + 2, y - h + 8], [129, 97], [137, 101]], { link: 2.4, seed: 3 }) + K.chain(u, L, [[x0 + w + 2, y - 16], [129, 112], [137, 112]], { link: 2.4, seed: 7 });
      fg += K.shadeCyl(u, 137, 98, 137, 115, 1.4, L, 'oak', { outline: .35 }); }
    // the horses, whole, pulling away to the right: the far one first (darker, a little higher, its head up), then
    // the near one; from the swingletree the trace chains run along their flanks to the hames of the collars
    const NH = { x: 141, y: 129, s: .9, lift: -8 }, FH = { x: 147, y: 118, s: .8, lift: 24 };
    const hm = (H, lx, ly) => { const q = bend(lx, ly, H.lift); return [H.x + q[0] * H.s, H.y + q[1] * H.s]; };
    { const fc = nid('fhc', u); fg += `<defs><clipPath id="${fc}"><rect x="${CORNER}" y="0" width="60" height="300"/></clipPath></defs><g clip-path="url(#${fc})">` + K.castShadow(u, L, { x: 165, y: 121, w: 40, h: 30, horizon: HZ, d: .5, opacity: .45 }) + horse(u, L, FH.x, FH.y, FH.s, ['#3a2a20', '#2a1c14', '#140c08'], { seed: 5, rim: '#a8b8d0', lift: FH.lift }) + '</g>'; }
    { const a = hm(FH, 38.6, -31); fg += K.chain(u, L, [[137, 104], [156, 102.4], [a[0], a[1]]], { link: 1.8, seed: 11 }); }
    fg += K.castShadow(u, L, { x: 167, y: 129, w: 46, h: 34, horizon: HZ, d: .5, opacity: .55 }) + horse(u, L, NH.x, NH.y, NH.s, ['#7a4a2a', '#4a2a16', '#1e120a'], { seed: 3, lift: NH.lift });
    { const a = hm(NH, 38.6, -30); fg += K.chain(u, L, [[137, 108], [158, 107.6], [a[0], a[1]]], { link: 1.8, seed: 13 }); }
    // the watchman
    fg += watchman(u, L, GUARD.x, GUARD.y) + K.localGlow(u, { x: GUARD.x + 11.2, y: GUARD.y - 14.5, color: '#ffd080', power: .85, radius: 9 });
    // light: the moon's veil, the dark under the glass
    fg += gloom(u, 160, 40, 0, 100, .3, '#04060c') + gloom(u, 100, 140, 100, 280, .62, '#020408');
    return [bg, fg];
  } };
