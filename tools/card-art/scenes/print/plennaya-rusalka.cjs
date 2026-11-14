// «Пленная русалка» (Месть королевы Анны, ПРИКАЗ: вражеский корабль напротив теряет 1 Команду; возьмите 1 карту),
// refined from the first-round scene (portrait-revenge.cjs SCENES['Пленная русалка']): the same idea — a captive
// mermaid on a rock in the red night, the iron ring of her captors in the stone, singing over the water to the ship
// opposite; the song goes to her. Kept: the rock on the left, the ledge she sits on, the copper tail down the rock into
// the foam, the ash-pale hair with shells and weed, the warm brown skin, the moon, the ship small on the right. Fixed
// against the first round: she was a small doll stuck to the rock with stick arms and no hands, and nothing said she
// was a prisoner — now one big whole figure drawn as contours (lib/people.cjs: a profile head with a fine face, arms
// with hands): she sits up on the ledge, leaning on her far hand, her head lifted in the song, the near arm held out to
// the ship — and an iron cuff on that wrist, its chain sagging down to a ring bolted into the rock: she can reach no
// further. Her long hair falls down her back and over her breast (a band of shells under it): a fairy-tale mermaid.
// The rock was a flat slab — now the kit's rocks, wet at the foot; the trail of dashes on the water — now rings and
// notes of the song in the air and the moon's glitter on the sea.
// Light: the moon low on the right behind the ship (key: her face and arm turned to it, silver-warm rims), the red
// night (fill).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom } = PK;

const HZ = 100;
const MOON = { x: 154, y: 38 };
const EN = { kind: 'endeavour', x: 166, y: 102.4, scale: .3, sails: 'full', flip: true, seed: 4 };
const BOLT = [117.2, 123.4];                                          // the ring bolt in the ledge's flank, right of her tail
const GROW = { at: [120, 138], k: 1.15 };                            // she and her ledge, 15 % bigger, grown up and left
const grow = p => [GROW.at[0] + (p[0] - GROW.at[0]) * GROW.k, GROW.at[1] + (p[1] - GROW.at[1]) * GROW.k];
const light = { time: 'night', haze: .3, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#ffd2b0', power: .75 },
  fill: { color: '#3a1820', power: .45 }, rim: { az: 60, color: '#ffe0c8', power: .7 } };
const skel = { horizon: HZ, eye: 2, light: 'the moon low on the right behind the ship (key): her face, breast and held-out arm turned to it; the red night (fill)', items: [
  ['mermaid', 58, 146, 70, 92, 'sitting on the ledge, the head lifted, the near arm out to the ship'],
  ['chain', 100, 110, 20, 46, 'from the cuff on her wrist down to the ring bolt on the ledge'],
  ['crag', -20, 150, 92, 120, 'the tall rock behind her'], ['ledge', 40, 146, 82, 44, 'she sits on its crown, the tail down its right flank'],
  ['song', 112, 80, 44, 30, 'rings and notes from her mouth to the ship'], ['ship', 150, EN.y, 32, 30, 'water: opposite']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#eab890', half: '#a8704a', core: '#8a5634', shadow: '#4e2c18', outline: '#1a0a04' };
const HAIR = { col: '#e4dccc', hi: '#fff6ea', lo: '#8a8274' };
const RIMC = '#ffe2c8';
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

module.exports = { name: 'Пленная русалка', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    L.pal = Object.assign({}, L.pal, { sky: ['#0a0306', '#2a0a10', '#6a1e16', '#a8442a'], sea: ['#6a2a1e', '#2a0c0a', '#0a0204'], cloudLit: '#d07050', cloudShade: '#2a0a10' });
    // ——— the red night: stars, the moon low on the right, a band of cloud lit from below ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 60, seed: 31 }) + K.sunMoon(u, L, { r: 8 });
    bg += glow(u, MOON.x, MOON.y, 60, 44, '#ffd0a8', .35);
    for (const [x, y, w, h, sd, fr] of [[110, 20, 90, 8, 61, .3], [186, 70, 50, 5, 7, .55], [60, 84, 70, 5, 3, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 200, swell: .3, seed: 9, glitter: MOON.x });
    // ——— the ship opposite, small on the water under the moon ———
    bg += K.ship(u, L, Object.assign({ wake: false, reflect: true, lights: true }, EN));
    // ——— the rocks: the tall crag behind her, the ledge she sits on in front of it ———
    const crag = K.rock(u, L, { x: 24, y: 152, w: 96, h: 124, wet: true, seed: 41 });
    let mid = crag;
    // the moon's light along the crag's crown and its right flank, so it stands off the night sky
    { const sil = (crag.match(/<path d="([^"]+)" fill="none" stroke="[^"]+" stroke-width=".6" stroke-linejoin="round"\/>/) || [])[1];
      if (sil) { const g = nid('cm', u), bl = nid('cb', u);
        mid += `<defs>${linGrad(g, 0, 0, 72, 0, [[0, RIMC, 0], [.42, RIMC, .15], [.8, RIMC, .85], [1, RIMC, 1]])}<filter id="${bl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>`
          + `<path d="${sil}" fill="none" stroke="url(#${g})" stroke-width="3" opacity=".35" filter="url(#${bl})"/><path d="${sil}" fill="none" stroke="url(#${g})" stroke-width=".7" opacity=".85"/>`; } }
    // ——— her ledge, her, the chain, the song: drawn 15 % bigger round GROW.at ———
    const m = mermaid(u, L);
    mid += `<g transform="translate(${GROW.at[0]} ${GROW.at[1]}) scale(${GROW.k}) translate(${-GROW.at[0]} ${-GROW.at[1]})">`
      + K.rock(u, L, { x: 84, y: 148, w: 84, h: 46, wet: true, foam: false, seed: 17 }) + m.svg + fetter(u, L, m) + '</g>';
    mid += K.foam(u, { x: 50, y: 147.5, w: 150, h: 1.4, L, seed: 9 });
    mid += song(u, L, grow(m.mouth));
    // the moon's light round her and on the ledge; the night closing in at the bottom and the left
    let fg = K.localGlow(u, { x: 100, y: 70, color: '#ffc8a0', power: .2, radius: 46 }, { core: false });
    fg += gloom(u, 100, 120, 100, 175, .55, '#0a0204') + gloom(u, 60, 0, 0, 0, .35, '#0a0204');
    return [bg, mid + fg];
  } };

// ——— the mermaid ———
// sits on the crown of the ledge facing right (towards the ship), leaning back a little on her far hand; the head
// lifted in the song, the mouth open; the near arm held out to the ship, palm up, the iron cuff on its wrist and the
// chain sagging from it to the ring bolt; the tail down the ledge's right flank, the fin in the foam.
function mermaid(u, L) {
  const tone = SKIN, R = rng(11);
  let o = '';
  // ——— the far arm: from behind her back down to the hand flat on the stone beside her ———
  const fSh = [81, 71.4], fEl = [75.2, 86], fWr = [71.6, 100.2];
  const ft = dim(tone, .3);
  const fh = H.hand3(u, { at: fWr, a: 182, s: 1.05, m: -1, roll: 62, pitch: 0, pose: 'open', spread: 3, flex: [[2, 2, 0], [2, 2, 0], [2, 2, 0], [2, 2, 0]], tone: ft, light: [.8, -.5], sw: .26 });
  o += `<ellipse cx="${f(fWr[0] - 4.6)}" cy="${f(fWr[1] + 1.6)}" rx="6.4" ry="1.2" fill="#0a0404" opacity=".5"/>`;
  o += fh.back;
  o += H.cloth(u, { spine: [fSh, lerp2(fSh, fEl, .5), fEl, lerp2(fEl, fWr, .5), fWr], w: [5, 4.4, 3.7, 3.1, 2.7], tone: ft, lit: -1, folds: false, rim: RIMC, rimSide: -1, rimOp: .45, capA: true });
  o += fh.front;

  // ——— the hair down her back, behind the torso, to the hips ———
  o += H.hairMass(u, [[84, 52], [90, 50.6], [86, 60], [82.6, 66], [79.6, 74], [78.6, 84], [80.6, 94], [79, 99], [75, 96], [72.4, 88], [72, 78], [74, 68], [77.6, 58]],
    { r: 7, color: HAIR.col, hi: HAIR.hi, lo: HAIR.lo, seed: 5, n: 60, light: [.8, -.5], flow: () => [-.12, 1], tufts: [6, 7, 8], tuftLen: .22 });

  // ——— the tail: from the hips over the ledge's edge and down its face, the fin spread in the foam ———
  const T = H.tube([[83, 101.6], [95, 104.4], [102.4, 111], [104.6, 121], [104, 131], [106.6, 139.4]], [16, 13, 10.4, 8, 5.8, 3.6]);
  const tp = sp(T.outline(0, T.N, 1, true, false), true), tg = nid('mt', u), tc = nid('mc', u);
  o += `<defs>${linGrad(tg, 86, 96, 108, 128, [[0, '#f0b070'], [.35, '#c46c30'], [.75, '#7a3412'], [1, '#4a1e08']])}<clipPath id="${tc}"><path d="${tp}"/></clipPath></defs>`;
  o += `<path d="${tp}" fill="url(#${tg})" stroke="#2a1006" stroke-width=".45"/>`;
  o += `<g clip-path="url(#${tc})">`;
  // the dark side of the tail away from the moon (its underside)
  o += `<path d="${sp(T.edge(1, 0, T.N, 1.05).concat(T.edge(.15, 0, T.N).reverse()), true)}" fill="#3a1406" opacity=".45"/>`;
  // the scales: rows of small arcs across the tail, smaller towards the fin, lit on their upper edge
  for (let i = 2; i < T.N; i++) for (let sv = -.85; sv < .9; sv += .34) { const p = T.at(i, sv + (i % 2) * .17), k = T.S[i].w / 12;
    if (R() < .12) continue;
    o += `<path d="M${f(p[0] - 1.1 * k)} ${f(p[1] - .3 * k)}q${f(1.1 * k)} ${f(1.4 * k)} ${f(2.2 * k)} 0" stroke="#ffd8a0" stroke-width=".3" fill="none" opacity="${f(.3 + R() * .35)}"/>`; }
  { const g = nid('ms', u); o += `<defs>${radGrad(g, 98, 102, 16, [[0, '#ffe0b0', .4], [1, '#ffe0b0', 0]])}</defs><path d="${tp}" fill="url(#${g})"/>`; }
  o += '</g>';
  o += `<path d="${sp(T.edge(-.92, 0, T.N))}" stroke="${RIMC}" stroke-width=".6" fill="none" opacity=".8"/>`;
  // the fin: two lobes spread on the foam, ribbed, the moon through their thin edges
  { const e = T.S[T.N].p, fp = [[e[0] - 1.6, e[1] - 1], [e[0] + 3, e[1] - 3], [e[0] + 9, e[1] - 6.4], [e[0] + 7.6, e[1] - 1.6], [e[0] + 11, e[1] + 2.6], [e[0] + 4, e[1] + 2.4], [e[0], e[1] + 1.6], [e[0] - 4, e[1] + 4.6], [e[0] - 3.6, e[1]]], fg2 = nid('mf', u);
    o += `<defs>${linGrad(fg2, e[0] - 2, e[1], e[0] + 10, e[1] - 4, [[0, '#b0602a', .95], [1, '#ffc888', .75]])}</defs><path d="${sp(fp, true)}" fill="url(#${fg2})" stroke="#2a1006" stroke-width=".4"/>`;
    for (const q of [fp[2], fp[4], fp[5], fp[7]]) o += `<path d="M${P2(e)}L${P2(lerp2(e, q, .88))}" stroke="#7a3412" stroke-width=".3" opacity=".7"/>`;
    o += `<path d="${sp([fp[1], fp[2], fp[3], fp[4]])}" stroke="${RIMC}" stroke-width=".45" fill="none" opacity=".85"/>`;
    o += K.splash(u, { x: e[0] + 3, y: e[1] + 5, w: 12, h: 7, seed: 4, L }); }

  // ——— the torso in profile facing right: the back curving in at the waist, the breast towards the moon ———
  const torso = [[83.4, 64.4], [88.6, 64.6], [91.2, 67.6], [93.2, 72], [94.6, 78], [93.6, 83.6], [91, 88.6], [89.6, 93.6], [91, 99.4], [92.6, 104.6], [78.6, 106], [76.4, 100.6], [78.6, 94.4], [77.4, 87.4], [76.2, 79.4], [77.4, 71.6], [80.2, 66.6]];
  const bid = nid('mb', u), bc = nid('mk', u);
  o += `<defs>${linGrad(bid, 75, 80, 96, 76, [[0, tone.shadow], [.3, tone.core], [.68, tone.half], [1, tone.lit]])}<clipPath id="${bc}"><path d="${sp(torso, true)}"/></clipPath></defs>`;
  // the outline round her back, breast and hips, but not across the bottom, where she runs on into the tail
  o += `<path d="${sp(torso, true)}" fill="url(#${bid})"/><path d="${sp(torso.slice(11).concat(torso.slice(0, 11)))}" fill="none" stroke="${tone.outline}" stroke-width=".45"/>`;
  o += `<g clip-path="url(#${bc})">`;
  // the shoulder blade and the ribs in soft shade, the moon on the breastbone; the scales begin at the hips
  o += `<path d="M78.4 74q3 6 1 12" stroke="${tone.shadow}" stroke-width="1.6" fill="none" opacity=".35"/><path d="M86 90q2 3 5 3.4" stroke="${tone.shadow}" stroke-width=".6" fill="none" opacity=".5"/>`;
  // the skin turns into the tail over the hips: the tail's colour fades in from the waist down, no edge
  { const fm = nid('mm', u), fg = nid('mg', u), gw = nid('mw', u);
    o += `<defs>${linGrad(fg, 0, 89, 0, 103, [[0, '#fff', 0], [.55, '#fff', .55], [1, '#fff', 1]])}<mask id="${fm}" maskUnits="userSpaceOnUse" x="70" y="80" width="30" height="30"><rect x="70" y="80" width="30" height="30" fill="url(#${fg})"/></mask>`
      + `${radGrad(gw, 98, 102, 16, [[0, '#ffe0b0', .4], [1, '#ffe0b0', 0]])}</defs><g mask="url(#${fm})"><rect x="70" y="86" width="30" height="24" fill="url(#${tg})"/><rect x="70" y="86" width="30" height="24" fill="url(#${gw})"/></g>`; }
  // and the scales come with it: a few tiny faint ones at the waist, more, bigger and brighter down to the tail
  for (let row = 0; row < 8; row++) { const y = 91 + row * 1.9, t = row / 7, k = .32 + t * .28;
    for (let x = 76 + (row % 2) * 1.1 * k * 2; x < 94; x += 2.2 * k * 2) { if (R() > .25 + t * .75) continue;
      o += `<path d="M${f(x - 1.1 * k)} ${f(y - .3 * k)}q${f(1.1 * k)} ${f(1.4 * k)} ${f(2.2 * k)} 0" stroke="${t < .5 ? '#7a3412' : '#ffd8a0'}" stroke-width="${f(.2 + t * .12)}" fill="none" opacity="${f((.15 + t * .5) * (.6 + R() * .4))}"/>`; } }
  o += '</g>';
  o += `<path d="${sp([[91.2, 67.6], [93.2, 72], [94.6, 78], [93.6, 83.6], [91, 88.6], [89.6, 93.6]])}" stroke="${RIMC}" stroke-width=".6" fill="none" opacity=".8"/>`;
  // the band of shells over the breast, a strand of weed holding them
  o += `<path d="M77.4 76.6Q86 78.6 94.4 75.6" stroke="#2f5a3a" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M77.4 76.6Q86 78.6 94.4 75.6" stroke="#6a9a6a" stroke-width=".45" fill="none" opacity=".7"/>`;
  for (const [x, y, k] of [[90.6, 77.8, 3], [94.2, 76.6, 2.2]]) {
    o += `<path d="M${f(x - k)} ${f(y + k * .3)}Q${f(x - k)} ${f(y - k)} ${f(x)} ${f(y - k * 1.05)}Q${f(x + k)} ${f(y - k)} ${f(x + k)} ${f(y + k * .3)}Q${f(x)} ${f(y + k * .8)} ${f(x - k)} ${f(y + k * .3)}Z" fill="#f2dcc8" stroke="#8a6a58" stroke-width=".3"/>`;
    for (const dx of [-.5, 0, .5]) o += `<path d="M${f(x)} ${f(y + k * .5)}L${f(x + dx * k * 1.2)} ${f(y - k * .8)}" stroke="#b09080" stroke-width=".25"/>`;
    o += `<path d="M${f(x - k * .6)} ${f(y - k * .7)}Q${f(x)} ${f(y - k * 1.15)} ${f(x + k * .6)} ${f(y - k * .7)}" stroke="#fff" stroke-width=".35" fill="none" opacity=".7"/>`; }

  // ——— the neck and the head lifted in the song, in profile to the right ———
  o += H.cloth(u, { spine: [[85.8, 66.6], [88, 61.6]], w: [5.2, 4.4], tone, lit: 1, folds: false });
  const hc = [89.6, 55.4], hr = 6.6;
  const hd = H.head(u, { c: hc, r: hr, dir: 1, tilt: -16, tone, detail: true, faceLit: true, warm: { color: '#ffd8b8', op: .45 }, rim: RIMC, edge: mix(tone.lit, '#ffe8d0', .3),
    mouth: .7, eye: 'half', brow: 'up', hairColor: HAIR.col, ear: false, iris: '#2a5a4a', lips: '#9a4a40', white: '#e8dcd0' });
  o += hd.svg;
  // the hair over the crown and the back of the head
  o += H.hairMass(u, [hd.Q(-.3, -1.1), hd.Q(.4, -1.08), hd.Q(.84, -.74), hd.Q(.56, -.62), hd.Q(.2, -.52), hd.Q(-.1, -.1), hd.Q(-.32, .4), hd.Q(-.7, .96), hd.Q(-1.14, .6), hd.Q(-1.14, -.1), hd.Q(-.92, -.72)],
    { r: hr, color: HAIR.col, hi: HAIR.hi, lo: HAIR.lo, seed: 8, n: 34, light: [.8, -.5], sheen: hd.Q(.1, -.7), flow: p => [-.3, .7], tufts: [7, 8], tuftLen: .12 });
  // a long lock from behind the ear over the near shoulder and down over her breast to the waist
  const lock = [hd.Q(-.34, .3), hd.Q(-.06, .56), [88.6, 66], [92, 71], [94.4, 78.4], [93, 85.4], [91.6, 91.6], [89.6, 89], [89.2, 82.4], [88.6, 75.6], [85.6, 69.6], [84, 64]];
  o += H.hairMass(u, lock, { r: hr, color: HAIR.col, hi: HAIR.hi, lo: HAIR.lo, seed: 12, n: 36, light: [.8, -.5], flow: () => [.18, 1], tufts: [6, 7], tuftLen: .14 });
  o += `<path d="${sp([hd.Q(-.06, .56), [88.6, 66], [92, 71], [94.4, 78.4], [93, 85.4], [91.6, 91.6]])}" stroke="${RIMC}" stroke-width=".55" fill="none" opacity=".75"/>`;
  // shells and a strand of weed in her hair
  for (const [q, sz] of [[hd.Q(-.2, -.95), 1.3], [hd.Q(-.82, .1), 1.1]]) o += `<path d="M${f(q[0] - sz)} ${f(q[1] + sz * .5)}l${f(sz)} ${f(-sz * 1.6)}l${f(sz)} ${f(sz * 1.6)}z" fill="#f6e8e0" stroke="#a89080" stroke-width=".3"/>`;
  o += `<path d="${sp([hd.Q(-.6, -.6), hd.Q(-.9, -.1), hd.Q(-1.2, .5)])}" stroke="#3a6a44" stroke-width=".9" fill="none" stroke-linecap="round"/><path d="${sp([hd.Q(-.4, -.84), hd.Q(-.92, -.3)])}" stroke="#3a6a44" stroke-width=".7" fill="none"/>`;

  // ——— the near arm held out to the ship, palm up ———
  const nSh = [88.6, 71], nEl = [100.4, 68.8], nWr = [112.2, 60.2];
  o += H.cloth(u, { spine: [nSh, lerp2(nSh, nEl, .5), nEl, lerp2(nEl, nWr, .55), nWr], w: [5.6, 4.6, 3.7, 3.1, 2.7], tone, lit: 1, folds: false, rim: RIMC, rimSide: -1, rimOp: .8, capA: true });
  o += `<path d="M98.6 67.4q1.8 .9 3.6 -.4" stroke="${tone.shadow}" stroke-width=".45" fill="none" opacity=".65"/>`;
  const nh = H.hand3(u, { at: nWr, a: -30, s: 1.1, m: -1, roll: 150, pitch: 10, pose: 'open', spread: 9, tone, light: [.8, -.5], sw: .26 });
  o += nh.back + nh.front;
  return { svg: o, mouth: hd.Q(1.04, .52), wrist: nWr, el: nEl };
}
// the iron cuff on her wrist and the chain from it sagging down to the ring bolt in the rock beside her tail
function fetter(u, L, m) {
  const a = lerp2(m.el, m.wrist, .86), d = [m.wrist[0] - m.el[0], m.wrist[1] - m.el[1]], ang = Math.atan2(d[1], d[0]) * 180 / Math.PI;
  let o = `<g transform="translate(${f(a[0])} ${f(a[1])}) rotate(${f(ang)})"><rect x="-1.9" y="-2.2" width="3.8" height="4.4" rx=".7" fill="#2a2626" stroke="#0a0808" stroke-width=".35"/><path d="M-1.6 -2h3.2" stroke="#e8d0c0" stroke-width=".45" opacity=".85"/><circle cx="0" cy="1.6" r=".55" fill="#6a6260"/></g>`;
  // the ring bolt in the rock: an iron plate set in the stone with four rivets and a rust stain run down from it, the
  // eye standing out of the plate, the ring hanging through the eye — and the chain's last link through the ring
  const B = BOLT, rc = [B[0], B[1] + 3.4], rr = [2.3, 2.7];
  o += `<path d="M${B[0] - .6} ${B[1] + 2}q-.4 3 .2 6.4M${B[0] + .8} ${B[1] + 2}q.3 2.4 -.2 4.6" stroke="#6a2a10" stroke-width=".9" fill="none" opacity=".35" stroke-linecap="round"/>`;
  o += `<ellipse cx="${B[0] + .4}" cy="${B[1] + 2.8}" rx="3" ry=".9" fill="#0a0404" opacity=".4"/>`;
  o += `<g transform="rotate(-8 ${B[0]} ${B[1]})"><rect x="${B[0] - 2.6}" y="${B[1] - 2.4}" width="5.2" height="4.8" rx=".5" fill="#2a2424" stroke="#0a0808" stroke-width=".35"/><path d="M${B[0] - 2.3} ${B[1] - 2.3}h4.8v4.4" stroke="#8a7a72" stroke-width=".3" fill="none" opacity=".7"/>`
    + [[-1.7, -1.5], [1.7, -1.5], [-1.7, 1.5], [1.7, 1.5]].map(([dx, dy]) => `<circle cx="${B[0] + dx}" cy="${B[1] + dy}" r=".42" fill="#4a4240" stroke="#0a0808" stroke-width=".15"/>`).join('') + '</g>';
  // the ring (behind the eye's front) and the chain's last link caught round its lower edge
  const ring = `<ellipse cx="${f(rc[0])}" cy="${f(rc[1])}" rx="${rr[0]}" ry="${rr[1]}" fill="none" stroke="#0a0808" stroke-width="1.5"/><ellipse cx="${f(rc[0])}" cy="${f(rc[1])}" rx="${rr[0]}" ry="${rr[1]}" fill="none" stroke="#6a6260" stroke-width=".7"/><path d="M${f(rc[0] + 1.7)} ${f(rc[1] - 1.8)}q.8 1.6 .2 3" stroke="${RIMC}" stroke-width=".4" fill="none" opacity=".8"/>`;
  o += ring;
  // the eye: a short thick loop out of the plate's middle, over the ring's top
  o += `<ellipse cx="${B[0]}" cy="${B[1] + .5}" rx="1.1" ry="1.3" fill="none" stroke="#0a0808" stroke-width="1.3"/><ellipse cx="${B[0]}" cy="${B[1] + .5}" rx="1.1" ry="1.3" fill="none" stroke="#5a5250" stroke-width=".55"/><path d="M${B[0] + .7} ${B[1] - .3}q.5 .7 .2 1.5" stroke="${RIMC}" stroke-width=".3" fill="none" opacity=".8"/>`;
  const c0 = [a[0] + .8, a[1] + 2.6], c1 = [rc[0] - rr[0] * .7, rc[1] + rr[1] * .75], sag = [lerp(c0[0], c1[0], .5) + 1.2, lerp(c0[1], c1[1], .55)];
  o += K.chain(u, L, [c0, lerp2(c0, sag, .5), sag, lerp2(sag, c1, .5), c1], { link: 2.4, seed: 6 });
  return o;
}
const sp = H.sp;
// a tone a little deeper in shade (the far side of her)
function dim(t, k) { return { lit: mix(t.lit, t.half, k), half: mix(t.half, t.shadow, k), core: mix(t.core || t.half, t.shadow, k), shadow: mix(t.shadow, '#05060c', k * .5), outline: t.outline }; }

// the song: rings of shimmering light from her mouth towards the ship, a few notes floating between (as in rusalki.cjs)
function song(u, L, m) {
  const gid = nid('sg', u), c = '#ffe4cc';
  let s = `<defs><filter id="${gid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".5"/></filter></defs>`, rings = '';
  for (let i = 0; i < 6; i++) { const r = 4 + i * 5.4, a0 = -34 * Math.PI / 180, a1 = 26 * Math.PI / 180;
    const p0 = [m[0] + Math.cos(a0) * r, m[1] + Math.sin(a0) * r], p1 = [m[0] + Math.cos(a1) * r, m[1] + Math.sin(a1) * r];
    rings += `<path d="M${f(p0[0])} ${f(p0[1])}A${f(r)} ${f(r)} 0 0 1 ${f(p1[0])} ${f(p1[1])}" stroke="${c}" stroke-width="${f(.8 - i * .1)}" fill="none" stroke-dasharray="${f(1.6 + i * .3)} ${f(.9 + i * .4)}" stroke-linecap="round" opacity="${f(.85 - i * .12)}"/>`; }
  s += `<g filter="url(#${gid})" opacity=".9">${rings}</g>${rings.replace(/stroke-width="[^"]*"/g, 'stroke-width=".3"').replace(/stroke="#ffe4cc"/g, 'stroke="#ffffff"')}`;
  const note = (x, y, k, two) => { const hr = 1.05 * k;
    let n = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(hr * 1.2)}" ry="${f(hr * .82)}" transform="rotate(-24 ${f(x)} ${f(y)})" fill="${c}"/><path d="M${f(x + hr * 1.05)} ${f(y - .2)}v${f(-4.6 * k)}" stroke="${c}" stroke-width="${f(.42 * k)}"/>`;
    if (two) n += `<ellipse cx="${f(x + 3.2 * k)}" cy="${f(y - .9 * k)}" rx="${f(hr * 1.2)}" ry="${f(hr * .82)}" transform="rotate(-24 ${f(x + 3.2 * k)} ${f(y - .9 * k)})" fill="${c}"/><path d="M${f(x + 3.2 * k + hr * 1.05)} ${f(y - .9 * k - .2)}v${f(-4.6 * k)}" stroke="${c}" stroke-width="${f(.42 * k)}"/><path d="M${f(x + hr * 1.05)} ${f(y - 4.6 * k)}L${f(x + 3.2 * k + hr * 1.05)} ${f(y - 5.5 * k)}" stroke="${c}" stroke-width="${f(.9 * k)}"/>`;
    else n += `<path d="M${f(x + hr * 1.05)} ${f(y - 4.6 * k)}q${f(1.6 * k)} ${f(1.2 * k)} ${f(1.4 * k)} ${f(3 * k)}" stroke="${c}" stroke-width="${f(.4 * k)}" fill="none"/>`;
    return n; };
  const notes = note(m[0] + 22, m[1] - 12, 1.2, false) + note(m[0] + 36, m[1] - 4, 1.1, true) + note(m[0] + 50, m[1] + 6, .95, false) + note(m[0] + 60, m[1] + 16, .8, false);
  s += `<g filter="url(#${gid})" opacity=".8">${notes}</g><g opacity=".95">${notes}</g>`;
  // a faint sinuous glimmer on the air along the way the song goes, down to the ship
  s += `<path d="M${f(m[0] + 8)} ${f(m[1] - 2)}C${f(m[0] + 24)} ${f(m[1] - 14)} ${f(m[0] + 34)} ${f(m[1] + 8)} ${f(m[0] + 48)} ${f(m[1])}S${f(m[0] + 64)} ${f(m[1] + 18)} ${f(EN.x - 8)} ${f(EN.y - 14)}" stroke="${c}" stroke-width=".45" fill="none" stroke-dasharray=".6 1.4" opacity=".6"/>`;
  return s;
}
