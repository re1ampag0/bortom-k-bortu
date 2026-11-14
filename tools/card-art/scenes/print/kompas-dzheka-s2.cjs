// «Компас Джека» (Жемчужина, ПРИКАЗ: посмотрите 3 верхние карты колоды — одну в руку, одну в План, третью в сброс),
// refined from the first-round scene (portrait-pearl.cjs SCENES['Компас Джека']): the captain's table by the stern
// window at night. The compass lies open on the chart, big and in front: a brass box, the lid thrown back (inside it
// an engraved sky — stars and a crescent), the card with its rose; the rose's north (the red point and the lily) is at
// twelve o'clock, and the blued needle does not look to it but plainly aside, to about four o'clock, at the ink cross
// on the chart beside the compass, and it glows: the glow runs over the bezel and the chart to the cross. Beside it three
// cards lie face down in a fan, the middle one pushed out. The moon in the window is the one light (cold, from the
// back right: brass catches it on the rims); the needle's glow is a small warm local light on the dial and the chart.
// Fixed against the first round: the compass was small and flat on the table — now it is the main thing, a box
// with a thickness, a bezel, glass and a lid; the chart was a sheet over the whole table — now it lies in perspective;
// the window and the table share one eye level (the sea horizon), the moon lights the table through the window.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, glow, gloom, shafts, motes, tableTop } = PK;

const HZ = 40;                                   // eye level = the sea horizon in the window
const WX = 98, WY = 4, WW = 92, WH = 64;         // the stern window's glass (right half of the back wall)
const TB = 78, TF = 168;                         // the table top: back edge at the wall, front edge
const C = { x: 82, y: 110, r: 35, k: .5, h: 8 };  // the compass: centre of the dial, radius, squash of the circle, box height
const CROSS = [124, 121];                         // the ink cross on the chart where the needle points (about four o'clock on the dial)
const light = { time: 'night', haze: .3, key: { type: 'moon', x: 160, y: 18, el: 24, color: '#c8d8f6', power: .85 }, fill: { color: '#34486c', power: .45 },
  rim: { az: 20, color: '#cfe2ff', power: .55 }, locals: [{ x: C.x + 10, y: C.y + 3, color: '#ffd070', power: .55, radius: 40 }] };
const skel = { horizon: HZ, eye: 1.2, light: 'the moon in the stern window (cold, back right) + the needle glow (warm local)', items: [
  ['window', WX, WY + WH, WW, WH, 'stern wall'], ['sill', WX - 6, 76, WW + 12, 6, 'window frame'], ['chart', 8, 150, 150, 58, 'table top'],
  ['compass', C.x - C.r, C.y + C.h + C.r * C.k, C.r * 2, C.r * 2.6, 'on the chart'], ['lid', C.x - C.r, C.y - C.r * C.k, C.r * 2, C.r * 1.7, 'hinged to the box, thrown back'],
  ['cards', 130, 140, 60, 34, 'table top, face down'], ['bottle', 18, 98, 9, 20, 'table top'], ['cross', 119, 124, 10, 6, 'ink on the chart, right of the compass']] };

// where the needle's gold tip is in the picture (the needle points from the dial's centre to the cross)
function needleTip() { const cc = [C.x, C.y + .4], d = [CROSS[0] - cc[0], (CROSS[1] - cc[1]) / C.k], l = Math.hypot(d[0], d[1]), len = C.r * .84 * .96 * .86;
  return [cc[0] + d[0] / l * len, cc[1] + d[1] / l * len * C.k]; }
const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }
// a point on the table plane: (lx, ly) in table units round (x0, y0), squashed by k (ly + toward us)
const onTable = (x0, y0, k, a = 0) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return (lx, ly) => [x0 + lx * c - ly * s, y0 + (lx * s + ly * c) * k]; };

// a playing card lying face down on the table: a cream border, a navy field, gold frame and a rose in the middle
function cardDown(u, L, x, y, a, k, lift = 0) {
  const P = onTable(x, y, k, a), w = 13, h = 19, rc = 1.6, rp = L.ramp('linen', x, y);
  const out = [];
  const rr = (hw, hh, r) => { const pts = []; for (const [cx, cy, a0] of [[hw - r, -hh + r, -90], [hw - r, hh - r, 0], [-hw + r, hh - r, 90], [-hw + r, -hh + r, 180]])
    for (let i = 0; i <= 3; i++) { const t = (a0 + i * 30) * Math.PI / 180; pts.push(P(cx + Math.cos(t) * r, cy + Math.sin(t) * r)); } return pts; };
  const sh = nid('cds', u);
  out.push(`<defs><filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${f(.7 + lift * .5)}"/></filter></defs>`
    + `<path d="${poly(rr(w, h, rc).map(p => [p[0] - 1.2 - lift, p[1] + 1.4 + lift]))}" fill="#120804" opacity=".55" filter="url(#${sh})"/>`);
  const lifted = pts => pts.map(p => [p[0], p[1] - lift]);
  // the card's thickness on the near edge, the face, the field, the frame, the rose
  out.push(`<path d="${poly(lifted(rr(w, h, rc)).map(p => [p[0], p[1] + .7]))}" fill="${rp.shadow}"/>`);
  out.push(`<path d="${poly(lifted(rr(w, h, rc)))}" fill="${mix(rp.half, '#e8dcc0', .4)}" stroke="#4a3a24" stroke-width=".3"/>`);
  out.push(`<path d="${poly(lifted(rr(w - 1.5, h - 1.5, 1)))}" fill="#1c2a44"/>`);
  out.push(`<path d="${poly(lifted(rr(w - 2.6, h - 2.6, .6)))}" fill="none" stroke="#c9a048" stroke-width=".35" opacity=".85"/>`);
  for (let i = -3; i <= 3; i++) { const p = lifted([P(-w + 2.6, i * 5), P(w - 2.6, i * 5)]); out.push(`<path d="M${f(p[0][0])} ${f(p[0][1])}L${f(p[1][0])} ${f(p[1][1])}" stroke="#2c3e5e" stroke-width=".5"/>`); }
  const star = []; for (let i = 0; i < 16; i++) { const r = i % 4 === 0 ? 6 : i % 2 ? 2 : 3.6, t = i / 16 * Math.PI * 2 - Math.PI / 2; star.push(P(Math.cos(t) * r, Math.sin(t) * r)); }
  out.push(`<path d="${poly(lifted(star))}" fill="#d8b058" stroke="#6a4a14" stroke-width=".2"/>`);
  { const c = lifted([P(0, 0)])[0]; out.push(`<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="1.4" ry="${f(1.4 * k)}" fill="#1c2a44" stroke="#e8c46a" stroke-width=".3"/>`); }
  // the moon on the far edge (it comes from behind)
  { const e = lifted([P(-w + .6, -h + .4), P(w - .6, -h + .4)]); out.push(`<path d="M${f(e[0][0])} ${f(e[0][1])}L${f(e[1][0])} ${f(e[1][1])}" stroke="#e8f0ff" stroke-width=".45" opacity=".55"/>`); }
  return out.join('');
}

module.exports = { name: 'Компас Джека', variant: 's2', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 });
    // the stern wall: dark planking; a beam overhead
    let bg = woodTex(u, 0, 0, 200, TB + 2, '#4e301a', '#24140a', '#120a04', 15, true, 8)
      + K.localGlow(u, { x: 150, y: 40, color: '#8aa8d8', power: .25, radius: 80 }, { core: false });
    // the window: the night sea, the moon and its path on the water
    { const cid = nid('win', u); let o = K.sky(u, L, { horizon: HZ, stars: 40, seed: 3, top: WY }) + K.sunMoon(u, L, { r: 5.6 })
        + K.cloud(u, L, { x: 118, y: 22, w: 30, h: 4, seed: 6, far: .4 }) + K.cloud(u, L, { x: 184, y: 34, w: 22, h: 3, seed: 2, far: .7 })
        + K.water(u, L, { horizon: HZ, bottom: WY + WH + 2, swell: .3, seed: 9, glitter: 160 });
      o += `<g data-far="">${K.ship(u, L, { kind: 'brig', x: 118, y: HZ + 1, scale: .16, detail: 'far', seed: 4 })}</g>`;
      bg += `<defs><clipPath id="${cid}"><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}"/></clipPath></defs><rect x="${WX - 6}" y="${WY - 5}" width="${WW + 12}" height="${WH + 11}" rx="2" fill="#22130a"/><g clip-path="url(#${cid})">${o}</g>`;
      const gs = nid('gs', u); bg += `<defs>${linGrad(gs, WX, WY, WX + WW, WY + WH, [[0, '#cfe0ff', .07], [.45, '#cfe0ff', 0], [.62, '#cfe0ff', .05], [1, '#cfe0ff', 0]])}</defs><rect x="${WX}" y="${WY}" width="${WW}" height="${WH}" fill="url(#${gs})"/>`;
      for (const x of [WX + WW / 3, WX + WW * 2 / 3]) bg += `<rect x="${f(x - 1.4)}" y="${WY}" width="2.8" height="${WH}" fill="#24140a"/><path d="M${f(x - 1.4)} ${WY}v${WH}" stroke="#9ab4d8" stroke-width=".4" opacity=".5"/><path d="M${f(x + 1.4)} ${WY}v${WH}" stroke="#08040a" stroke-width=".5"/>`;
      bg += `<rect x="${WX}" y="${WY + WH / 2 - 1.4}" width="${WW}" height="2.8" fill="#24140a"/><path d="M${WX} ${WY + WH / 2 - 1.4}h${WW}" stroke="#9ab4d8" stroke-width=".4" opacity=".5"/>`;
      const fr = nid('fr', u); bg += `<defs>${linGrad(fr, WX - 6, 0, WX + WW + 6, 0, [[0, '#3a2210', 1], [.5, '#2a1608', 1], [1, '#1a0e06', 1]])}</defs>`
        + `<path d="M${WX - 6} ${WY - 5}h${WW + 12}v${WH + 11}h${-WW - 12}zM${WX} ${WY}v${WH}h${WW}v${-WH}z" fill="url(#${fr})" fill-rule="evenodd" stroke="#0e0804" stroke-width=".6"/>`
        + `<rect x="${WX - .6}" y="${WY - .6}" width="${WW + 1.2}" height="${WH + 1.2}" fill="none" stroke="#c9a048" stroke-width=".7" opacity=".6"/>`
        + `<path d="M${WX - 5.4} ${WY - 4}v${WH + 9}" stroke="#a8c0e0" stroke-width=".5" opacity=".45"/>`; }
    // the sill under the window, lit by the moon on its top
    { const sl = nid('sl', u); bg += `<defs>${linGrad(sl, WX - 8, 0, WX + WW + 8, 0, [[0, '#6a5a58', 1], [1, '#3a2a1e', 1]])}</defs>`
        + `<path d="M${WX - 8} 72L${WX + WW + 8} 72L${WX + WW + 10} 75L${WX - 10} 75Z" fill="url(#${sl})" stroke="#0e0804" stroke-width=".45"/><path d="M${WX - 10} 75h${WW + 20}v3.6h${-WW - 20}z" fill="#1a0e06"/>`
        + `<path d="M${WX - 9} 72.4h${WW + 18}" stroke="#c8daf4" stroke-width=".4" opacity=".55"/>`; }
    // the table: oak planks running to the window, the moon lies on it in two panes; front edge and apron (under the glass)
    bg += tableTop(u, TB, TF - TB, '#6a4424', '#2e1a0c', 9) + `<path d="M0 ${TB}h200" stroke="#0a0502" stroke-width="1.3"/>`;
    bg += shafts(u, 160, 18, [[58, TB + 12, 112, TB + 54], [118, TB + 8, 166, TB + 44]], '#b8d0f0', .13);
    { const ed = nid('ed', u), ap = nid('ap', u);
      bg += `<defs>${linGrad(ed, 0, TF, 0, TF + 6, [[0, '#9a7a62', 1], [.35, '#5a3a20', 1], [1, '#24140a', 1]])}${linGrad(ap, 0, TF + 6, 0, 280, [[0, '#24140a', 1], [1, '#0c0703', 1]])}</defs>`
        + `<rect x="0" y="${TF}" width="200" height="6" fill="url(#${ed})"/><path d="M0 ${TF}h200" stroke="#c8d4e8" stroke-width=".5" opacity=".5"/><rect x="0" y="${TF + 6}" width="200" height="${280 - TF - 6}" fill="url(#${ap})"/>`
        + woodTex(u, 0, TF + 7, 200, 40, '#33200e', '#1a1006', '#080402', 15, true, 4); }
    let fg = '';
    // the chart: a big sheet in perspective, its far corner curled; coasts, islands, depth marks, a rhumb fan
    { const rp = { lit: '#e4d6b4', half: '#bca274', shadow: '#7a6040', outline: '#4a3418' }, g = nid('ch', u), v = nid('cv', u);
      const d = smooth([[14, 96], [86, 92], [158, 94], [162, 124], [168, 152], [88, 155], [6, 152], [10, 124]], true);
      fg += K.contactShadow(u, 88, 154, 158, L, { ry: 2, opacity: .45 })
        + `<defs>${linGrad(g, 0, 92, 0, 156, [[0, rp.lit, 1], [.35, mix(rp.half, rp.lit, .45), 1], [1, mix(rp.half, rp.shadow, .4), 1]])}${radGrad(v, 86, 124, 84, [[.45, '#6a4a20', 0], [1, '#4a2e10', .6]])}</defs>`
        + `<path d="${d}" fill="url(#${g})" stroke="${rp.outline}" stroke-width=".45"/><path d="${d}" fill="url(#${v})"/>`;
      const ink = rp.outline, land = mix(rp.half, '#b89060', .5);
      fg += `<path d="M10 128q8 -6 18 -2q8 -4 14 2q2 8 -10 10q-6 6 -16 2q-8 -4 -6 -12z" fill="${land}" stroke="${ink}" stroke-width=".4" opacity=".9"/>`
        + `<path d="M118 100q14 -4 26 1q10 2 12 8q-8 4 -20 2q-14 0 -18 -11z" fill="${land}" stroke="${ink}" stroke-width=".4" opacity=".85"/>`
        + `<path d="M136 138q8 -4 14 0q2 5 -6 6q-8 0 -8 -6z" fill="${land}" stroke="${ink}" stroke-width=".4" opacity=".85"/>`
        + [[40, 104], [56, 100], [128, 124], [146, 148], [60, 146], [110, 144], [34, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".35" fill="${ink}" opacity=".6"/>`).join('')
        + Array.from({ length: 9 }, (_, i) => { const a = (-60 + i * 15) * Math.PI / 180; return `<path d="M150 104L${f(150 - Math.cos(a) * 46)} ${f(104 + Math.sin(a) * 22)}" stroke="${ink}" stroke-width=".22" opacity=".35"/>`; }).join('')
        // the far edge curls up a little and catches the moon
        + `<path d="M14 96Q86 90.6 158 94" stroke="${mix(rp.lit, '#e8f0ff', .4)}" stroke-width="1.2" fill="none" opacity=".75"/>`;
      // the ink cross, where the needle points
      fg += `<path d="M${CROSS[0] - 5} ${CROSS[1] - 3}l10 6M${CROSS[0] + 5} ${CROSS[1] - 3}l-10 6" stroke="#8a1a10" stroke-width="1.9" stroke-linecap="round"/>`; }
    // a bottle of rum at the back left, dark against the wall
    fg += K.castShadow(u, L, { x: 22, y: 98, w: 9, h: 20, horizon: HZ, d: 1 }) + K.bottle(u, L, { x: 22, y: 98, s: 1, kind: 'rum', seed: 3 });
    // the three cards face down in a fan on the right, the middle one pushed out toward us
    fg += cardDown(u, L, 148, 116, -22, .5) + cardDown(u, L, 176, 116, 20, .5) + cardDown(u, L, 160, 127, -2, .5, .6);
    // the glow of the needle running over the chart to the cross: a soft warm path
    { const gf = nid('gf', u), tip = needleTip();
      fg += `<defs><filter id="${gf}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.6"/></filter><filter id="${gf}s" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`
        + `<g style="mix-blend-mode:screen"><path d="M${f(tip[0])} ${f(tip[1])}Q${f((tip[0] + CROSS[0]) / 2)} ${f((tip[1] + CROSS[1]) / 2 + 2.4)} ${CROSS[0] - 2} ${CROSS[1]}" stroke="#ffb838" stroke-width="8" fill="none" opacity=".95" filter="url(#${gf})"/>`
        + `<path d="M${f(tip[0])} ${f(tip[1])}Q${f((tip[0] + CROSS[0]) / 2)} ${f((tip[1] + CROSS[1]) / 2 + 2.4)} ${CROSS[0] - 2} ${CROSS[1]}" stroke="#fff4c0" stroke-width="2" fill="none" opacity="1" stroke-linecap="round" filter="url(#${gf}s)"/></g>`
        + K.localGlow(u, { x: CROSS[0], y: CROSS[1], color: '#ffd870', power: .8, radius: 14 }, { squash: .55 });
      const R = rng(12); for (let i = 0; i < 16; i++) { const t = R(), x = tip[0] + (CROSS[0] - 2 - tip[0]) * t + (R() - .5) * 3, y = tip[1] + (CROSS[1] - tip[1]) * t + Math.sin(t * Math.PI) * 1.2 - R() * 4;
        fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.3 + R() * .5)}" fill="#fff2b8" opacity="${f(.4 + R() * .5)}"/>`; } }
    // ——— the compass ———
    const { x: cx, y: cy, r: Rr, k, h: Hb } = C, hy = cy - Rr * k;
    // its cast shadow (the moon is behind: it falls toward us and to the left) and the contact shadow
    fg += K.castShadow(u, L, { x: cx, y: cy + Hb + Rr * k * .2, w: Rr * 2, h: Hb + 4, horizon: HZ, d: 1 }) + K.contactShadow(u, cx, cy + Hb + Rr * k * .55, Rr * 2.1, L, { ry: 3, opacity: .55 });
    // the lid, thrown back past upright: a brass dish seen from inside; an engraved night sky on it
    { const lc = [cx + 2, hy - Rr * .86 + 1.5], lr = Rr * 1.02, lk = .86, g = nid('ld', u), gi = nid('li', u), ci = nid('lc', u);
      fg += `<defs>${linGrad(g, lc[0] - lr, lc[1] - lr, lc[0] + lr, lc[1] + lr, [[0, '#4a3410', 1], [.45, '#9a7428', 1], [.7, '#e8c46a', 1], [.85, '#fff0b8', 1], [1, '#8a6420', 1]])}`
        + `${radGrad(gi, lc[0] + lr * .2, lc[1] - lr * .3, lr * 1.1, [[0, '#3a3a40', 1], [.7, '#1e2028', 1], [1, '#121218', 1]])}<clipPath id="${ci}"><ellipse cx="${f(lc[0])}" cy="${f(lc[1])}" rx="${f(lr * .86)}" ry="${f(lr * lk * .86)}"/></clipPath></defs>`
        + `<ellipse cx="${f(lc[0] - 1.2)}" cy="${f(lc[1] + 1.6)}" rx="${f(lr)}" ry="${f(lr * lk)}" fill="#3a2608"/>`
        + `<ellipse cx="${f(lc[0])}" cy="${f(lc[1])}" rx="${f(lr)}" ry="${f(lr * lk)}" fill="url(#${g})" stroke="#2a1a04" stroke-width=".5"/>`
        + `<ellipse cx="${f(lc[0])}" cy="${f(lc[1])}" rx="${f(lr * .86)}" ry="${f(lr * lk * .86)}" fill="url(#${gi})" stroke="#5a4010" stroke-width=".5"/>`;
      // the engraving: stars joined in figures, a crescent, a ring of degree ticks (gold lines on the dark inlay)
      let e = ''; const R = rng(21), st = [];
      for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * lr * .78; st.push([lc[0] + Math.cos(a) * d, lc[1] + Math.sin(a) * d * lk]); }
      for (const [i, j] of [[0, 3], [3, 7], [7, 9], [2, 5], [5, 11], [11, 14], [14, 2], [17, 19], [19, 22], [8, 12]]) e += `<path d="M${f(st[i][0])} ${f(st[i][1])}L${f(st[j][0])} ${f(st[j][1])}" stroke="#c9a048" stroke-width=".25" opacity=".55"/>`;
      st.forEach((p, i) => { const r = i % 5 === 0 ? 1.4 : .7; e += `<path d="M${f(p[0] - r)} ${f(p[1])}L${f(p[0])} ${f(p[1] - r)}L${f(p[0] + r)} ${f(p[1])}L${f(p[0])} ${f(p[1] + r)}Z" fill="#f0d27a" opacity="${f(.6 + R() * .4)}"/>`; });
      e += `<path d="M${f(lc[0] + 10)} ${f(lc[1] - 14)}a6 6 0 1 0 6 9a4.6 4.6 0 1 1 -6 -9z" fill="#f0d27a" opacity=".85"/>`;
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r0 = lr * .82, r1 = lr * (i % 4 ? .79 : .76); e += `<path d="M${f(lc[0] + Math.cos(a) * r0)} ${f(lc[1] + Math.sin(a) * r0 * lk)}L${f(lc[0] + Math.cos(a) * r1)} ${f(lc[1] + Math.sin(a) * r1 * lk)}" stroke="#c9a048" stroke-width=".25" opacity=".7"/>`; }
      // the moon's reflection sliding across the polished inlay
      e += `<path d="M${f(lc[0] + lr * .1)} ${f(lc[1] - lr * lk * .8)}Q${f(lc[0] + lr * .72)} ${f(lc[1] - lr * lk * .3)} ${f(lc[0] + lr * .62)} ${f(lc[1] + lr * lk * .4)}" stroke="#c8daf8" stroke-width="2.4" fill="none" opacity=".16"/>`;
      fg += `<g clip-path="url(#${ci})">${e}</g>`
        // the moon on the lid's rim (top right) — the brass glint
        + `<path d="M${f(lc[0] + lr * .2)} ${f(lc[1] - lr * lk * .98)}A${f(lr)} ${f(lr * lk)} 0 0 1 ${f(lc[0] + lr * .96)} ${f(lc[1] - lr * lk * .2)}" stroke="#fff8e0" stroke-width=".9" fill="none" opacity=".9"/>`
        + `<path d="M${f(lc[0] + lr * .74)} ${f(lc[1] - lr * lk * .62)}h3.6M${f(lc[0] + lr * .74 + 1.8)} ${f(lc[1] - lr * lk * .62 - 1.8)}v3.6" stroke="#ffffff" stroke-width=".35" opacity=".9"/>`; }
    // the hinge at the back
    fg += K.shadeCyl(u, cx - 7, hy - 1, cx + 9, hy - 1, 1.8, L, 'brass', { outline: .3, ell: .5, face: 2 });
    // the box: a short brass drum; its top face is the bezel round the dial
    fg += K.shadeCyl(u, cx, cy + Hb, cx, cy, Rr, L, 'brass', { ell: k, face: 2, outline: .45, grain: false });
    { const b1 = nid('bz', u); fg += `<defs>${linGrad(b1, cx - Rr, cy - Rr * k, cx + Rr, cy + Rr * k, [[0, '#6a4a14', 1], [.4, '#b88a30', 1], [.62, '#f0cc70', 1], [.75, '#fff2c0', 1], [1, '#7a5418', 1]])}</defs>`
        + `<ellipse cx="${cx}" cy="${cy}" rx="${Rr}" ry="${f(Rr * k)}" fill="url(#${b1})" stroke="#3a2606" stroke-width=".45"/>`
        // knurled bezel: little ticks round the top edge
        + Array.from({ length: 60 }, (_, i) => { const a = i / 60 * Math.PI * 2; return `<path d="M${f(cx + Math.cos(a) * Rr * .97)} ${f(cy + Math.sin(a) * Rr * k * .97)}L${f(cx + Math.cos(a) * Rr * .9)} ${f(cy + Math.sin(a) * Rr * k * .9)}" stroke="#5a3e0e" stroke-width=".25" opacity=".55"/>`; }).join(''); }
    // the well: the inner wall in shadow, then the card
    const ri = Rr * .84;
    { const w = nid('wl', u); fg += `<defs>${linGrad(w, 0, cy - ri * k, 0, cy + ri * k, [[0, '#2a1c08', 1], [.5, '#5a4012', 1], [1, '#8a6420', 1]])}</defs><ellipse cx="${cx}" cy="${cy}" rx="${f(ri)}" ry="${f(ri * k)}" fill="url(#${w})" stroke="#2a1a04" stroke-width=".4"/>`; }
    const cc = [cx, cy + 1.6], rc = ri * .96, cid = nid('cc', u);
    fg += `<defs><clipPath id="${cid}"><ellipse cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${f(rc)}" ry="${f(rc * k)}"/></clipPath></defs>`;
    { const pc = nid('pc', u); let d = `<defs>${radGrad(pc, cc[0] - 6, cc[1] + 2, rc * 1.1, [[0, '#fff2cc', 1], [.55, '#e8d6a8', 1], [1, '#a88a58', 1]])}</defs><ellipse cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${f(rc)}" ry="${f(rc * k)}" fill="url(#${pc})"/>`;
      // the rose in the plane of the card (squashed), north at twelve o'clock (the far side): the red point and the lily
      const nA = -90, G = `<g transform="translate(${f(cc[0])} ${f(cc[1])}) scale(1 ${k})">`;
      let rose = '';
      for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, r0 = rc * .97, r1 = rc * (i % 6 ? .9 : .84); rose += `<path d="M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)}L${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)}" stroke="#4a3018" stroke-width="${i % 6 ? .3 : .5}"/>`; }
      rose += `<circle r="${f(rc * .82)}" fill="none" stroke="#4a3018" stroke-width=".35"/><circle r="${f(rc * .5)}" fill="none" stroke="#4a3018" stroke-width=".25"/>`;
      const pt = (a, r, w) => { const t = a * Math.PI / 180, n = t + Math.PI / 2; return [[Math.cos(t) * r, Math.sin(t) * r], [Math.cos(n) * w, Math.sin(n) * w], [-Math.cos(n) * w, -Math.sin(n) * w]]; };
      for (let i = 0; i < 4; i++) { const [tp, l, r] = pt(nA + 45 + i * 90, rc * .55, 2.4);
        rose += `<path d="M0 0L${f(l[0])} ${f(l[1])}L${f(tp[0])} ${f(tp[1])}Z" fill="#8a6a3a"/><path d="M0 0L${f(r[0])} ${f(r[1])}L${f(tp[0])} ${f(tp[1])}Z" fill="#d8c08a"/>`; }
      for (let i = 0; i < 4; i++) { const a = nA + i * 90, [tp, l, r] = pt(a, rc * .8, 3.4), col = i === 0 ? ['#7a1a12', '#c83a2a'] : ['#2a2a3a', '#7a7a8a'];
        rose += `<path d="M0 0L${f(l[0])} ${f(l[1])}L${f(tp[0])} ${f(tp[1])}Z" fill="${col[0]}"/><path d="M0 0L${f(r[0])} ${f(r[1])}L${f(tp[0])} ${f(tp[1])}Z" fill="${col[1]}"/>`; }
      // the lily over north
      { const t = nA * Math.PI / 180, x = Math.cos(t) * rc * .9, y = Math.sin(t) * rc * .9; rose += `<g transform="translate(${f(x)} ${f(y)}) rotate(${nA + 90})"><path d="M0 -3.2q1.4 1.6 0 3.6q-1.4 -2 0 -3.6zM0 .4q2.6 -2.6 3 .6q-1.6 -.6 -3 .8zM0 .4q-2.6 -2.6 -3 .6q1.6 -.6 3 .8z" fill="#b82a1e"/></g>`; }
      d += `<g clip-path="url(#${cid})">${G}${rose}</g>`;
      // the warm glow of the needle on the card
      d += `<ellipse cx="${f(cc[0] + 9)}" cy="${f(cc[1] + 2)}" rx="${f(rc * .8)}" ry="${f(rc * k * .8)}" fill="#ffd060" opacity=".22" style="mix-blend-mode:screen"/></g>`;
      fg += d; }
    // the needle: an arrow of blued steel, long and plain, its head toward the cross (about four o'clock), a short brass
    // tail; it glows gold toward the cross. The red point and the lily at twelve stay apart from it
    { const tgt = [CROSS[0] - cc[0], (CROSS[1] - cc[1]) / k], na = Math.atan2(tgt[1], tgt[0]) * 180 / Math.PI, len = rc * .86, tl = len * .55, gN = nid('gn', u), gT = nid('gt', u), bl = nid('nb', u);
      const head = `M0 -2.4L${f(len * .66)} -1.4L${f(len * .62)} -3.6L${f(len)} 0L${f(len * .62)} 3.6L${f(len * .66)} 1.4L0 2.4Z`, tail = `M0 -2.4L${f(-tl)} -1L${f(-tl - 1.6)} 0L${f(-tl)} 1L0 2.4Z`;
      fg += `<defs><filter id="${bl}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="2"/></filter>${linGrad(gN, 0, 0, len, 0, [[0, '#14284e', 1], [.45, '#2c56a8', 1], [.85, '#5a8ae8', 1], [1, '#a8c8ff', 1]])}${linGrad(gT, -tl, 0, 0, 0, [[0, '#5a3e10', 1], [1, '#b88a30', 1]])}</defs>`
        + `<g transform="translate(${f(cc[0])} ${f(cc[1] - 1.2)}) scale(1 ${k}) rotate(${f(na)})">`
        + `<path d="${head}${tail}" fill="#1a1006" opacity=".4" transform="translate(-1.4 4)"/>`
        + `<path d="${head}" fill="#ffc848" opacity=".9" filter="url(#${bl})" transform="translate(3 0) scale(1.1 1.8)"/>`
        + `<path d="${tail}" fill="url(#${gT})" stroke="#2a1a06" stroke-width=".35"/><path d="${head}" fill="url(#${gN})" stroke="#0a1430" stroke-width=".4"/>`
        + `<path d="M0 -2.4L${f(len * .66)} -1.4M${f(len * .62)} -3.6L${f(len)} 0" stroke="#e0ecff" stroke-width=".45" opacity=".85"/></g>`
        + K.shadeSphere(u, cc[0], cc[1] - 1.2, 1.8, L, 'brass', { outline: .3 })
        + K.localGlow(u, { x: needleTip()[0], y: needleTip()[1], color: '#ffe080', power: .9, radius: 12 });
      // the glow leaves the needle's head over the glass and the bezel toward the cross (the rest runs on the chart, under the box)
      const tip = needleTip(), g2 = nid('gg', u), q = `M${f(tip[0])} ${f(tip[1])}Q${f((tip[0] + CROSS[0]) / 2)} ${f((tip[1] + CROSS[1]) / 2 + 2.4)} ${CROSS[0] - 2} ${CROSS[1]}`;
      fg += `<defs><filter id="${g2}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="1.8"/></filter><filter id="${g2}s" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation=".6"/></filter></defs>`
        + `<g style="mix-blend-mode:screen"><path d="${q}" stroke="#ffb838" stroke-width="6" fill="none" opacity=".6" filter="url(#${g2})"/><path d="${q}" stroke="#fff4c0" stroke-width="1.3" fill="none" opacity=".75" stroke-linecap="round" filter="url(#${g2}s)"/></g>`; }
    // the glass over the dial: a cool sheen and the moon's highlight on the far side
    fg += `<ellipse cx="${f(cc[0])}" cy="${f(cc[1] - .6)}" rx="${f(rc)}" ry="${f(rc * k)}" fill="#cfe0ff" opacity=".06"/>`
      + `<path d="M${f(cx + rc * .1)} ${f(cy - rc * k * .9)}A${f(rc)} ${f(rc * k)} 0 0 1 ${f(cx + rc * .86)} ${f(cy - rc * k * .3)}" stroke="#eef6ff" stroke-width="1.4" fill="none" opacity=".55"/>`
      + `<path d="M${f(cx - rc * .7)} ${f(cy + rc * k * .2)}q${f(rc * .1)} ${f(rc * k * .4)} ${f(rc * .4)} ${f(rc * k * .62)}" stroke="#ffffff" stroke-width=".6" fill="none" opacity=".3"/>`;
    // the moon's rim on the near edge of the drum and the bezel (brass glint)
    fg += `<path d="M${f(cx + Rr * .3)} ${f(cy - Rr * k * .95)}A${Rr} ${f(Rr * k)} 0 0 1 ${f(cx + Rr)} ${f(cy)}" stroke="#fff6d8" stroke-width=".7" fill="none" opacity=".85"/>`
      + `<path d="M${f(cx + Rr * .78)} ${f(cy - Rr * k * .62)}h4M${f(cx + Rr * .78 + 2)} ${f(cy - Rr * k * .62 - 2)}v4" stroke="#ffffff" stroke-width=".4" opacity=".95"/>`;
    // light and air: the moon fills the room a little, dust in the beam, the corners and the table front fall dark
    fg += glow(u, 150, 50, 70, 46, '#9ab8e0', .1) + motes(16, 60, 50, 110, 60, '#d8e6ff', 5)
      + gloom(u, 120, 60, 0, 120, .4) + gloom(u, 100, 150, 100, 280, .55) + gloom(u, 120, 90, 200, 180, .25);
    return [bg, fg];
  } };
