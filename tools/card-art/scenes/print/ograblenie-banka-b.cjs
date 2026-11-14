// «Ограбление банка» (Жемчужина, ПРИКАЗ: заберите 1 Порох из Трюма противника) — variant B of the method trial:
// a new shot. A night street in a colonial port, low on the cobbles: the bank's wall has a ragged hole in it, and
// out of it, towards us, comes the huge iron safe — with a chunk of the brick wall still stuck to its back. Two
// taut ropes run from it to the bottom corners (the pirates pulling are behind the camera); it scrapes the cobbles
// with sparks. Its door has swung open on the way: inside, kegs of powder (that is what is taken). Far left, in the
// alley, the torches of the guard are coming. The one key light: a street lamp on the bank wall; the moon is a cold fill.
'use strict';
const K = require('../kit/index.cjs');
const { f, nid, linGrad, radGrad, rng, mix } = K;

const HZ = 100, ST = 104;   // eye level; the foot of the bank's wall (the street at the back)
const LAMP = { x: 186, y: 44, s: 1.15, hang: 4 };
const lamp = K.lantern.local({ ...LAMP });
const light = { time: 'night', haze: .4, key: { type: 'point', ...lamp, h: 3.2, gy: ST, color: '#ffbe6a', power: 1, radius: 150 },
  fill: { color: '#34486c', power: .4 }, locals: [{ x: 14, y: 92, color: '#ff9a40', power: .5, radius: 28 }] };
const SAFE = { x: 26, y: 134, w: 78, h: 72, ox: 20, oy: 11 };
const skel = { horizon: HZ, eye: .9, light: 'the street lamp on the bank wall (key) + the guard\'s torches far left', items: [
  ['safe', 50, 43, 92, 81, 'cobbles (skids)'], ['bricks', 50, 34, 92, 20, 'stuck to the safe'], ['hole', 64, 44, 84, 60, 'bank wall'],
  ['lamp', 150, 30, 20, 36, 'iron bracket on the wall'], ['guard', 0, 70, 30, 34, 'alley, far'], ['ropes', 0, 110, 200, 170, 'safe → bottom corners']] };

module.exports = { name: 'Ограбление банка', variant: 'b', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .9 });
    const Lm = K.makeLight({ time: 'night', haze: .4, key: { type: 'moon', x: 182, y: 14, el: 40, color: '#b9cff6', power: .6 }, fill: { color: '#3d5680', power: .4 } }, { horizon: HZ });
    const R = rng(51);
    // ——— sky over the roofs, the moon; the bank's stone front with a cornice and pilasters
    let bg = K.sky(u, Lm, { horizon: HZ, stars: 40, seed: 2 }) + K.sunMoon(u, Lm, { r: 5 });
    const wg = nid('wl', u), wc = nid('wc', u);
    bg += `<defs>${radGrad(wg, LAMP.x, LAMP.y, 150, [[0, '#8a6a4c'], [.35, '#4e4440'], [1, '#1c1e26']])}<clipPath id="${wc}"><rect x="-10" y="16" width="220" height="${ST - 16}"/></clipPath></defs>`
      + `<rect x="-10" y="16" width="220" height="${ST - 16}" fill="url(#${wg})"/>`;
    // ashlar courses, offset joints, a few chipped stones; the cornice and the roof edge
    let st = '';
    for (let y = 22, r = 0; y < ST; y += 7, r++) { st += `<path d="M-10 ${y}H210" stroke="#14141a" stroke-width=".55" opacity=".7"/><path d="M-10 ${y + .6}H210" stroke="#c8a888" stroke-width=".3" opacity=".25"/>`;
      for (let x = (r % 2) * 9 - 10; x < 210; x += 18) st += `<path d="M${x} ${y}v7" stroke="#14141a" stroke-width=".5" opacity=".6"/>`; }
    for (let i = 0; i < 10; i++) { const x = R() * 200, y = 24 + R() * 76; st += `<path d="M${f(x)} ${f(y)}l${f(2 + R() * 3)} ${f(1 + R() * 2)}l${f(-1 - R() * 2)} ${f(1 + R())}" stroke="#101016" stroke-width=".4" fill="none" opacity=".7"/>`; }
    for (const x of [30, 174]) { const pg = nid('pl', u); st += `<defs>${linGrad(pg, x - 7, 0, x + 7, 0, [[0, '#2a2a30'], [.5, '#6a5a4c'], [1, '#22242c']])}</defs><rect x="${x - 7}" y="18" width="14" height="${ST - 18}" fill="url(#${pg})"/><path d="M${x - 7} 18v${ST - 18}M${x + 7} 18v${ST - 18}" stroke="#0e0e14" stroke-width=".6"/>`; }
    bg += `<g clip-path="url(#${wc})">${st}</g>`;
    bg += `<rect x="-10" y="10" width="220" height="8" fill="#3a3436"/><path d="M-10 18H210" stroke="#0a0a0e" stroke-width="1.2"/><path d="M-10 10.6H210" stroke="#d8b890" stroke-width=".6" opacity=".6"/>`
      + Array.from({ length: 22 }, (_, i) => `<rect x="${-8 + i * 10}" y="13" width="5" height="4" fill="#24222a"/>`).join('');
    // a lit window upper right, shutters, behind the lamp (the bank is awake now)
    bg += `<rect x="116" y="22" width="18" height="20" fill="#ffb860" opacity=".85"/><path d="M125 22v20M116 32h18" stroke="#2a1a0c" stroke-width="1.2"/><rect x="114" y="21" width="22" height="22" fill="none" stroke="#1a1418" stroke-width="1.6"/>`
      + `<path d="M114 21l-7 3v20l7 -1z" fill="#2a3a30" stroke="#0a0e0c" stroke-width=".5"/>` + K.localGlow(u, { x: 125, y: 32, color: '#ffb050', power: .3, radius: 22 }, { core: false });
    // ——— the hole in the wall: ragged edge of broken stones, dark inside with a faint warm glow, rubble at the foot
    const hole = 'M108 104L111 90L107 80L113 68L111 58L121 52L133 54L143 48L155 51L165 48L173 54L178 62L176 74L182 84L178 94L182 104Z';
    bg += `<path d="${hole}" fill="#07070a"/>` + K.localGlow(u, { x: 146, y: 76, color: '#c06a30', power: .25, radius: 34 }, { core: false });
    for (let i = 0; i < 26; i++) { const t = i / 25, a = Math.PI * (1.05 + t * .9), x = 144 + Math.cos(a) * (37 + R() * 3), y = 106 + Math.sin(a) * (57 + R() * 3);
      bg += `<path d="M${f(x)} ${f(y)}l${f(3 + R() * 3)} ${f(-1 + R() * 2)}l${f(-1 + R() * 2)} ${f(3 + R() * 2)}l${f(-4 - R() * 2)} ${f(R())}z" fill="${R() > .5 ? '#6a5a4a' : '#3a3434'}" stroke="#121216" stroke-width=".35"/>`; }
    // ——— the alley at the far left: the guard coming with torches (small silhouettes, warm glow)
    // the guard coming through the bank with torches: small silhouettes deep in the hole, a warm glow round them
    bg += K.localGlow(u, { x: 158, y: 84, color: '#ff9a40', power: .6, radius: 26 });
    for (const [x, h] of [[150, 24], [160, 22], [168, 20]]) bg += `<path d="M${x - 2.8} 104L${x - 2.6} ${104 - h + 6}Q${x} ${104 - h + 3.4} ${x + 2.6} ${104 - h + 6}L${x + 2.8} 104Z" fill="#050508"/><path d="M${x - 3.8} ${104 - h + 3.4}h7.6l-1.4 -2.4h-4.8z" fill="#050508"/><circle cx="${x}" cy="${104 - h + 2}" r="1.7" fill="#050508"/><path d="M${x + 3} ${104 - h + 8}l1.4 -14" stroke="#050508" stroke-width=".7"/><path d="M${x + 4.4} ${104 - h - 6}l.4 -3" stroke="#c8d0d8" stroke-width=".4"/>`;
    bg += K.fire(u, { x: 156, y: 84, w: 4, h: 8, seed: 3, glow: { color: '#ff9a40', power: .6 }, pool: false }) + K.fire(u, { x: 171, y: 86, w: 3.4, h: 7, seed: 5, glow: false, pool: false });
    // ——— the street: cobbles in perspective, wet, the lamp's light pooled on them; scrape marks from the hole to us
    { const sg = nid('sg', u); bg += `<defs>${linGrad(sg, 0, ST, 0, 290, [[0, '#26242a'], [.3, '#1c1a20'], [1, '#0c0b0e']])}</defs><rect x="-10" y="${ST}" width="220" height="190" fill="url(#${sg})"/>`;
      let cb = '';
      for (let row = 0, y = ST; y < 292 && row < 40; row++) { const d = 1 + (y - HZ) * .07, h = 1.6 * d, w = 4.2 * d; y += h;
        for (let x = -12 + (row % 2) * w / 2; x < 214; x += w) { const v = R(); cb += `<rect x="${f(x + .3 * d)}" y="${f(y - h + .25 * d)}" width="${f(w - .6 * d)}" height="${f(h - .5 * d)}" rx="${f(.5 * d)}" fill="${mix('#2e2b34', '#46424c', v)}" stroke="#0a090c" stroke-width="${f(.18 * d)}" transform="translate(${f((R() - .5) * .8 * d)} ${f((R() - .5) * .4 * d)})"/><path d="M${f(x + .8 * d)} ${f(y - h + .5 * d)}h${f(w - 1.8 * d)}" stroke="#c8b49a" stroke-width="${f(.16 * d)}" opacity=".35"/>`; } }
      bg += cb + K.localGlow(u, { x: 150, y: 128, color: '#ffb050', power: .5, radius: 80 }, { squash: .35, core: false }); }
    // scrape grooves from the hole to the skids, rubble trail
    bg += `<path d="M126 104L60 134M168 104L112 134" stroke="#9a8a7a" stroke-width=".9" opacity=".55"/><path d="M127 104.6L62 135M169 104.6L114 135" stroke="#0a0a0c" stroke-width=".9" opacity=".7"/>`;
    for (let i = 0; i < 14; i++) bg += `<path d="M${f(70 + R() * 110)} ${f(104 + R() * 26)}l2 -1l1 1.6l-2 .8z" fill="#5a4e44" stroke="#121214" stroke-width=".25"/>`;
    // ——— the safe: iron box in three faces, lit from the lamp (upper right), riveted; the brick chunk on its back
    let fg = K.castShadow(u, L, { x: SAFE.x + SAFE.w / 2 + 8, y: SAFE.y, w: SAFE.w + 20, h: SAFE.h, horizon: HZ, d: .4 });
    fg += K.contactShadow(u, SAFE.x + SAFE.w / 2 + 8, SAFE.y, SAFE.w + 18, L);
    const F = K.boxFaces(SAFE.x, SAFE.y, SAFE.w, SAFE.h, SAFE.ox, SAFE.oy);
    // the chunk of the bank's wall stuck on its back: a jagged slab of the same ashlar, lit by the lamp on its edge,
    // stones still falling off it
    { const top = SAFE.y - SAFE.h, x0 = SAFE.x + 2, x1 = SAFE.x + SAFE.w + SAFE.ox + 6, yb = top - SAFE.oy + 2;
      const slab = `M${x0} ${top + 2}L${x0 + 2} ${top - 14}L${x0 + 12} ${top - 20}L${x0 + 20} ${top - 15}L${x0 + 30} ${top - 27}L${x0 + 44} ${top - 22}L${x0 + 56} ${top - 31}L${x0 + 68} ${top - 23}L${x0 + 80} ${top - 28}L${x1 - 6} ${top - 19}L${x1} ${top - 8}L${x1 + 2} ${yb + 18}L${x1 - 8} ${yb + 24}Z`;
      const sg = nid('sb', u), sc = nid('sc', u);
      fg += `<defs>${linGrad(sg, x0, 0, x1, 0, [[0, '#2a2a32'], [.6, '#5a4e48'], [1, '#9a7e62']])}<clipPath id="${sc}"><path d="${slab}"/></clipPath></defs><path d="${slab}" fill="url(#${sg})" stroke="#0a0a0e" stroke-width=".8"/>`;
      let ln = '';
      for (let y = top - 30, r = 0; y < yb + 24; y += 7, r++) { ln += `<path d="M${x0 - 4} ${y}H${x1 + 4}" stroke="#121218" stroke-width=".55" opacity=".8"/><path d="M${x0 - 4} ${y + .6}H${x1 + 4}" stroke="#d8b890" stroke-width=".3" opacity=".3"/>`;
        for (let x = x0 - 4 + (r % 2) * 9; x < x1 + 4; x += 18) ln += `<path d="M${x} ${y}v7" stroke="#121218" stroke-width=".5" opacity=".7"/>`; }
      fg += `<g clip-path="url(#${sc})">${ln}</g>` + `<path d="M${x0 + 30} ${top - 27}L${x0 + 44} ${top - 22}L${x0 + 56} ${top - 31}L${x0 + 68} ${top - 23}L${x0 + 80} ${top - 28}L${x1 - 6} ${top - 19}L${x1} ${top - 8}" stroke="#e8c090" stroke-width=".7" fill="none" opacity=".8"/>`;
      for (const [dx, dy, r] of [[34, -36, 1.8], [62, -40, 1.3], [92, -30, 2.2], [104, -12, 1.5]]) fg += `<path d="M${f(x0 + dx - r)} ${f(top + dy)}l${f(r * 1.4)} ${f(-r * .6)}l${f(r * .9)} ${f(r * 1.2)}l${f(-r * 1.3)} ${f(r * .8)}z" fill="#4a4442" stroke="#121216" stroke-width=".3"/><path d="M${f(x0 + dx)} ${f(top + dy - r - 1)}v-3" stroke="#8a8a90" stroke-width=".3" opacity=".5"/>`; }
    fg += K.shadeBox(u, F, L, 'iron', { outline: .7 });
    // gilt pinstripe round the front and brass corner caps (an old bank safe)
    { const x0 = SAFE.x, y0 = SAFE.y, w = SAFE.w, h = SAFE.h;
      fg += `<rect x="${x0 + 5}" y="${y0 - h + 5}" width="${w - 10}" height="${h - 10}" fill="none" stroke="#d8a848" stroke-width=".7" opacity=".85"/>`
        + [[x0, y0 - h], [x0 + w, y0 - h], [x0, y0], [x0 + w, y0]].map(([x, y]) => `<path d="M${x} ${y}m${x > x0 ? -6 : 6} 0h${x > x0 ? 6 : -6}v${y > y0 - h ? -6 : 6}z" fill="#c8963e" stroke="#4a3010" stroke-width=".4"/>`).join(''); }
    // rivets along the edges of the front and the side
    { const x0 = SAFE.x, y0 = SAFE.y, w = SAFE.w, h = SAFE.h;
      for (let i = 0; i <= 10; i++) { const x = x0 + 3 + i * (w - 6) / 10; fg += `<circle cx="${f(x)}" cy="${f(y0 - h + 3)}" r=".8" fill="#2a2c30"/><circle cx="${f(x - .25)}" cy="${f(y0 - h + 2.7)}" r=".3" fill="#c8c0b0"/><circle cx="${f(x)}" cy="${f(y0 - 3)}" r=".8" fill="#2a2c30"/><circle cx="${f(x - .25)}" cy="${f(y0 - 3.3)}" r=".3" fill="#c8c0b0"/>`; }
      for (let i = 0; i <= 8; i++) { const y = y0 - h + 3 + i * (h - 6) / 8; fg += `<circle cx="${x0 + 3}" cy="${f(y)}" r=".8" fill="#2a2c30"/><circle cx="${x0 + w - 3}" cy="${f(y)}" r=".8" fill="#2a2c30"/><circle cx="${f(x0 + w - 3.25)}" cy="${f(y - .3)}" r=".3" fill="#e8d8c0"/>`; } }
    // the open door: the dark inside with the powder kegs and a few coins, the door swung out to the left
    { const ix = SAFE.x + 9, iy = SAFE.y - SAFE.h + 9, iw = SAFE.w - 18, ih = SAFE.h - 17;
      fg += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#0a0a0c" stroke="#3a3c42" stroke-width="1"/>`
        + `<path d="M${ix} ${iy}l5 5h${iw - 10}l5 -5M${ix} ${iy + ih}l5 -5h${iw - 10}l5 5" stroke="#1e2024" stroke-width=".8" fill="none"/>`
        + `<path d="M${ix + 3} ${iy + ih * .55}h${iw - 6}" stroke="#4a4c52" stroke-width="1.2"/>`;
      fg += K.localGlow(u, { x: ix + iw * .6, y: iy + 10, color: '#ffb050', power: .25, radius: 30 }, { core: false });
      fg += K.barrel(u, L, { x: ix + 13, y: iy + ih * .55 - .6, s: .78, kind: 'powder', seed: 3 }) + K.barrel(u, L, { x: ix + 32, y: iy + ih * .55 - .6, s: .78, kind: 'powder', seed: 4 })
        + K.barrel(u, L, { x: ix + 22, y: iy + ih - 1, s: .9, kind: 'powder', lying: true, seed: 6 })
        + K.coins(u, L, { x: ix + 44, y: iy + ih - 1.5, s: .9, n: 6, seed: 2 });
      // the door: thick plate seen edge-on-ish, swung to the left, the wheel and the dial on it
      const dg = nid('dr', u), dx0 = ix, dx1 = ix - 22;
      fg += `<defs>${linGrad(dg, dx1, 0, dx0, 0, [[0, '#2a2c32'], [.5, '#5a5c64'], [1, '#8a8c92']])}</defs>`
        + `<path d="M${dx0} ${iy - 1}L${dx1} ${iy + 6}L${dx1} ${iy + ih - 4}L${dx0} ${iy + ih + 1}Z" fill="url(#${dg})" stroke="#0a0a0e" stroke-width=".8"/>`
        + `<path d="M${dx0 - 1.6} ${iy}L${dx0 - 1.6} ${iy + ih}" stroke="#c8c4bc" stroke-width=".6" opacity=".6"/>`
        + `<ellipse cx="${dx1 + 11}" cy="${iy + ih / 2}" rx="4" ry="9" fill="none" stroke="#c89a48" stroke-width="1.4"/><ellipse cx="${dx1 + 11}" cy="${iy + ih / 2}" rx="1.4" ry="3" fill="#a87a30"/>`
        + [0, 60, 120].map(a => `<path d="M${dx1 + 11} ${iy + ih / 2}l${f(Math.cos(a * Math.PI / 180) * 3.6)} ${f(Math.sin(a * Math.PI / 180) * 8.6)}M${dx1 + 11} ${iy + ih / 2}l${f(-Math.cos(a * Math.PI / 180) * 3.6)} ${f(-Math.sin(a * Math.PI / 180) * 8.6)}" stroke="#c89a48" stroke-width=".8"/>`).join('')
        + [iy + 8, iy + ih - 8].map(y => `<rect x="${dx0 - 2}" y="${y - 3}" width="4" height="6" rx="1" fill="#1a1c20" stroke="#6a6c72" stroke-width=".4"/>`).join(''); }
    // the skids under it and the sparks where iron scrapes stone
    fg += `<rect x="${SAFE.x - 2}" y="${SAFE.y - 1}" width="${SAFE.w + 24}" height="3.4" rx="1.4" fill="#1a1a1e" stroke="#5a5a60" stroke-width=".4"/>`;
    for (let i = 0; i < 20; i++) { const x0 = SAFE.x + R() * (SAFE.w + 20), y0 = SAFE.y + 1, a = -Math.PI * (.15 + R() * .7), l = 3 + R() * 8;
      fg += `<path d="M${f(x0)} ${f(y0)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l * .6)}" stroke="${R() > .4 ? '#ffd890' : '#ff9a40'}" stroke-width="${f(.3 + R() * .4)}" stroke-linecap="round"/>`; }
    fg += K.localGlow(u, { x: SAFE.x + 40, y: SAFE.y, color: '#ffb050', power: .45, radius: 24 }, { squash: .35 });
    fg += K.smoke(u, Lm, { x: SAFE.x + 92, y: SAFE.y, w: 30, h: 22, wind: .6, seed: 4, opacity: .35 });
    // ——— the two taut ropes to the bottom corners (the pulling crew is behind us), around the safe's corners
    { const yb = SAFE.y - 24, x0 = SAFE.x, x1 = SAFE.x + SAFE.w;
      // a lashing round the safe (front and side), the two pulling lines from its front corners
      fg += K.rope(u, L, [[x0 - 1.5, yb], [(x0 + x1) / 2, yb + 1.6], [x1 + .5, yb]], { r: 1.5, seed: 2 })
        + K.rope(u, L, [[x1 + .5, yb], [x1 + SAFE.ox / 2, yb - SAFE.oy / 2 + .8], [x1 + SAFE.ox - .5, yb - SAFE.oy]], { r: 1.4, seed: 7 })
        + K.rope(u, L, [[x0 - 1.5, yb], [x0 - 18, yb + 70], [-20, 300]], { r: 1.9, seed: 3 })
        + K.rope(u, L, [[x1 + .5, yb], [x1 + 40, yb + 80], [222, 300]], { r: 1.9, seed: 5 }); }
    // ——— the street lamp on its iron bracket: the key light
    fg += `<path d="M204 28H186M204 24v8" stroke="#141418" stroke-width="1.6" fill="none"/><path d="M204 34Q194 32 188 28" stroke="#141418" stroke-width=".8" fill="none"/>`;
    fg += K.lantern(u, L, { ...LAMP, lit: true, seed: 5 }) + K.localGlow(u, { x: lamp.x, y: lamp.y, color: '#ffbe6a', power: .75, radius: 48 });
    // under the glass: darken the near cobbles
    const gl = nid('gl', u);
    fg += `<defs>${linGrad(gl, 0, 140, 0, 290, [[0, '#06060a', 0], [.35, '#06060a', .5], [1, '#030305', .85]])}</defs><rect x="-10" y="140" width="220" height="150" fill="url(#${gl})"/>`;
    return [bg, fg];
  } };
