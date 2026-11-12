// «Колокол «Голландца»» (Голландец, ПРИКАЗ: каждый противник сбрасывает 1 карту с руки; возьмите 1 карту), variant A
// of the method trial (docs/progress/print-kit.md «Проба способа»): the first-round scene (portrait-dutch.cjs
// SCENES['Колокол «Голландца»']) at its best. On the ghost ship's deck in the green fog the old bell swings in its
// frame between two barnacled posts, the clapper striking the lip; the toll goes out in rings through the fog, and
// the cards it shakes out of the enemies' hands flutter away over the rail towards the sea.
// Fixed against the first round: the bell was bigger than its frame and cut into the post — now it hangs from a
// headstock on the beam and swings inside it; the posts stand on sole plates with knees, with shadows on the deck;
// the deck is in perspective, wet, with puddles that ring (each its own); the bell is cast bronze in green patina
// with barnacles and weed; the moon behind the fog on the left is the one light.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom, motes } = PK;

const HZ = 98, RAIL = 84, DK = 112;                // horizon (behind the rail); the rail cap; the deck at the foot of the bulwark
const POST = [52, 148], PY = 150, BEAM = 40;        // the bell posts: x, their foot on the deck, the beam's underside
const BELL = { x: 100, y: BEAM + 9, s: 3.5, rot: -13 };
const light = { time: 'fog', haze: .7, key: { type: 'moon', x: 66, y: 19, az: 255, el: 32, color: '#cdeedc', power: .8 }, fill: { color: '#3a6a5c', power: .5 },
  rim: { az: 300, color: '#d8fff0', power: .4 } };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon in the fog upper left (from the left and a little behind): lit sides to the left, shadows to the right on the deck', items: [
  ['post L', 46, PY, 12, 112, 'deck (sole plate, knee)'], ['post R', 142, PY, 12, 112, 'deck (sole plate, knee)'], ['beam', 42, BEAM, 116, 10, 'on the posts'],
  ['bell', 74, 100, 52, 56, 'hangs from the headstock on the beam, swinging'], ['rings', 20, 120, 160, 80, 'in the fog round the bell'],
  ['cards', 14, 98, 40, 40, 'in the air over the rail, flying away'], ['rail', 0, DK, 200, 28, 'bulwark on the deck'], ['puddles', 40, 196, 130, 40, 'deck']] };

// a barnacle cluster: cones with dark mouths, lit to the left
function barnacles(u, x, y, n, s, seed) {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const bx = x + (R() - .5) * 6 * s, by = y + (R() - .5) * 5 * s, r = (.8 + R() * .9) * s, g = nid('bn', u);
    out += `<defs>${linGrad(g, bx - r, 0, bx + r, 0, [[0, '#c8ccb4', 1], [.6, '#8a907a', 1], [1, '#3a4034', 1]])}</defs>`
      + `<ellipse cx="${f(bx + r * .4)}" cy="${f(by + r * .5)}" rx="${f(r * 1.2)}" ry="${f(r * .6)}" fill="#050c0a" opacity=".45"/>`
      + `<path d="M${f(bx - r)} ${f(by + r * .5)}L${f(bx - r * .45)} ${f(by - r * .7)}H${f(bx + r * .45)}L${f(bx + r)} ${f(by + r * .5)}Z" fill="url(#${g})" stroke="#3a3c2e" stroke-width=".25"/>`
      + `<ellipse cx="${f(bx)}" cy="${f(by - r * .7)}" rx="${f(r * .45)}" ry="${f(r * .18)}" fill="#1a1c14"/>`; }
  return out;
}
// weed hanging in strands from (x, y): long, thin, green, swaying
function weed(x, y, len, n, seed, col = '#3e7a5a') {
  const R = rng(seed); let out = '';
  for (let i = 0; i < n; i++) { const x0 = x + (R() - .5) * 4, l = len * (.6 + R() * .5), sw = (R() - .5) * 5;
    out += `<path d="M${f(x0)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}t${f(-sw * .4)} ${f(l * .3)}" stroke="${col}" stroke-width="${f(.6 + R() * .7)}" fill="none" stroke-linecap="round" opacity=".85"/>`
      + `<path d="M${f(x0 - .3)} ${f(y)}q${f(sw)} ${f(l * .4)} ${f(sw * .3)} ${f(l * .7)}" stroke="#9ad8b0" stroke-width=".25" fill="none" opacity=".45"/>`; }
  return out;
}
// a card in the air, tumbling: a small cream card (face or back) seen at an angle, lit from the left
function flyingCard(u, x, y, a, s, sy, back, op = 1) {
  const g = nid('fc', u);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)} ${f(s * sy)})" opacity="${op}"><defs>${linGrad(g, -7, 0, 7, 0, [[0, back ? '#3a5a50' : '#e8e2c8', 1], [1, back ? '#142824' : '#9aa890', 1]])}</defs>`
    + `<rect x="-7" y="-10" width="14" height="20" rx="1.2" fill="url(#${g})" stroke="#24342c" stroke-width=".4"/>`
    + (back ? `<rect x="-5.4" y="-8.4" width="10.8" height="16.8" rx=".6" fill="none" stroke="#a8c8a0" stroke-width=".4" opacity=".8"/><circle r="2.6" fill="none" stroke="#a8c8a0" stroke-width=".45"/>`
      : `<rect x="-5.6" y="-8.6" width="11.2" height="8.6" fill="#7a8a70" opacity=".8"/><path d="M-5 2.4h10M-5 4.8h8M-5 7h9" stroke="#5a6a54" stroke-width=".6"/>`)
    + `<path d="M-6.8 -9.8h13.4" stroke="#ffffff" stroke-width=".4" opacity=".6"/></g>`;
}

module.exports = { name: 'Колокол «Голландца»', kind: 'deck', status: 'draft', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // the sky: green fog over a dark sea, the moon low on the left through it, torn clouds
    let bg = K.sky(u, L, { horizon: HZ, stars: 20, seed: 4 }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 26, 70, 9, 21, .2], [70, 58, 60, 7, 8, .45], [176, 70, 50, 6, 14, .55], [20, 78, 46, 5, 3, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 130, swell: .4, seed: 9, glitter: 66 });
    // the enemies far off in the fog, small and pale: the toll reaches them
    bg += `<g data-far="" opacity=".55">${K.ship(u, L, { kind: 'endeavour', x: 176, y: HZ + .8, scale: .2, detail: 'far', lights: true, seed: 2 })}${K.ship(u, L, { kind: 'merchant', x: 24, y: HZ + .6, scale: .16, detail: 'far', flip: true, lights: true, seed: 5 })}</g>`
      + K.fog(u, L, { y: HZ - 16, h: 30, density: .55, seed: 3 });
    // the bulwark: an old grey rail, weed and barnacles; the deck in perspective, wet with the fog
    bg += K.bulwark(u, L, { x1: -4, x2: 204, y: DK, h: DK - RAIL, kind: 'oak', posts: 24, seed: 6 });
    bg += `<rect x="-4" y="${RAIL - 2}" width="208" height="${DK - RAIL + 2}" fill="#2a4a40" opacity=".35" style="mix-blend-mode:multiply"/>`;
    for (const [x, n, sd] of [[18, 4, 1], [64, 3, 2], [118, 5, 3], [172, 4, 4], [196, 2, 5]]) bg += weed(x, RAIL + 1, 16 + n * 2, n, sd);
    bg += barnacles(u, 30, DK - 6, 4, 1.1, 11) + barnacles(u, 132, DK - 8, 3, 1, 12) + barnacles(u, 182, DK - 5, 3, 1.2, 13);
    bg += K.deck(u, L, { horizon: HZ, top: DK, bottom: 290, vx: 104, kind: 'pine-deck', plank: 13, seed: 7, wet: true });
    bg += `<rect x="0" y="${DK}" width="200" height="${290 - DK}" fill="#1c3a34" opacity=".45" style="mix-blend-mode:multiply"/>`;
    bg += K.fog(u, L, { y: DK - 6, h: 26, density: .45, seed: 8 });
    // puddles on the deck: each its own shape, the bell's toll rings on them, the moon's sheen
    let fg = '';
    for (const [x, y, w, sd] of [[70, 204, 26, 1], [140, 222, 34, 2], [104, 172, 16, 3], [40, 246, 22, 4]]) {
      const R = rng(sd), pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2, r = 1 + (R() - .5) * .35; return [x + Math.cos(a) * w * r, y + Math.sin(a) * w * .16 * r]; });
      const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', g = nid('pd', u);
      fg += `<defs>${linGrad(g, x - w, 0, x + w, 0, [[0, '#7ab0a0', .55], [.5, '#3a6a5e', .45], [1, '#1e3a34', .4]])}</defs><path d="${d}" fill="url(#${g})" stroke="#0e2420" stroke-width=".3" stroke-linejoin="round"/>`
        + [.28, .55, .82].map((k, i) => `<ellipse cx="${f(x + 2)}" cy="${f(y)}" rx="${f(w * k)}" ry="${f(w * k * .14)}" fill="none" stroke="#e0fff4" stroke-width="${f(.55 - i * .12)}" opacity="${f(.7 - i * .18)}"/>`).join(''); }
    // the frame: sole plates, posts with knees, the beam with its iron straps; barnacles and weed on the old oak
    for (const x of POST) {
      const e = x < 100 ? -1 : 1;
      fg += K.castShadow(u, L, { x, y: PY, w: 10, h: 110, horizon: HZ, d: .6, opacity: .55 });
      fg += K.shadeBox(u, K.boxFaces(x - 11, PY + 2, 22, 4, 2, 3), L, 'oak', { seed: x });
      // the knee: a diagonal brace from the plate to the post
      fg += K.shadeCyl(u, x - e * 12, PY, x, PY - 22, 1.8, L, 'oak', { outline: .4, seed: x + 1 });
      fg += K.shadeCyl(u, x, PY + 1, x, BEAM - 2, 4.2, L, 'oak', { outline: .5, seed: x + 2 });
      fg += barnacles(u, x + 1, 70, 4, 1.1, x) + barnacles(u, x - 1, 104, 3, 1, x + 3) + barnacles(u, x + 2, 136, 4, 1.2, x + 5) + weed(x, BEAM + 4, 18, 3, x + 7);
      fg += PK.nails([[x - 1.5, BEAM + 3], [x + 1.5, BEAM + 6]], '#0e1612', .7);
    }
    fg += K.shadeCyl(u, 40, BEAM - 4, 160, BEAM - 4, 5, L, 'oak', { outline: .5, ell: .35, face: 1, seed: 21 });
    for (const x of [86, 114]) fg += K.shadeCyl(u, x, BEAM - 9.4, x, BEAM + 1.4, 1.3, L, 'iron', { outline: .3 });
    fg += barnacles(u, 66, BEAM - 8, 3, 1, 31) + barnacles(u, 138, BEAM - 7, 3, .9, 32) + weed(72, BEAM, 14, 3, 33) + weed(128, BEAM, 12, 2, 34);
    // the headstock on the beam, the bell's yoke irons
    fg += K.shadeBox(u, [{ pts: [[90, BEAM + 1], [110, BEAM + 1], [110, BEAM + 7], [90, BEAM + 7]], n: 'front' }], L, 'oak', { seed: 40 })
      + K.shadeCyl(u, 100, BEAM + 6, 100, BEAM + 10, 2.2, L, 'iron', { outline: .35 });
    // the sound: rings going out through the fog from the bell's mouth (soft, wide, fading), the air trembling at the lip
    { const bl = nid('rb', u), cx = 104, cy = 96;
      fg += `<defs><filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1"/></filter></defs><g filter="url(#${bl})" style="mix-blend-mode:screen">`
        + [[40, 14, .55, 1.6], [62, 22, .4, 1.4], [86, 31, .28, 1.2], [112, 40, .18, 1]].map(([rx, ry, op, w]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#c8ffe8" stroke-width="${w}" opacity="${op}"/>`).join('') + '</g>'; }
    // the bell (kit: cast bronze lathe), swinging on its pivot under the headstock
    fg += K.bell(u, L, { ...BELL, frame: false, seed: 5 });
    // patina, weed and barnacles grown on the bronze: in the bell's own frame (crown at 0, mouth at y 13)
    { const prof = [[0, 2.3], [.05, 3.2], [.12, 3.65], [.3, 3.9], [.5, 4.2], [.68, 4.75], [.82, 5.5], [.92, 6.2], [.975, 6.55], [1, 6.6]], H = 13;
      const side = e => prof.map(([t, r]) => [e * r, t * H]), outline = [...side(-1), ...side(1).reverse()], d = 'M' + outline.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', cid = nid('bp', u), pg = nid('pa', u);
      fg += `<g transform="translate(${BELL.x} ${BELL.y}) rotate(${BELL.rot}) scale(${BELL.s})"><defs><clipPath id="${cid}"><path d="${d}"/></clipPath>${linGrad(pg, 0, 0, 0, 13, [[0, '#5ac8a0', .65], [.5, '#3a9a7a', .35], [1, '#2a7a60', .55]])}</defs><g clip-path="url(#${cid})">`
        + `<path d="M-2.2 1.2Q-1.6 6 -3.6 13M1.4 .6Q2.4 5 1.6 9Q1 11.6 2.4 13M3.4 4Q4.4 8 4.2 13M-4 7Q-5 10 -5.6 13" stroke="url(#${pg})" stroke-width=".9" fill="none" stroke-linecap="round"/>`
        + `<path d="M-6.6 11.6Q0 12.8 6.6 11.6V13.4H-6.6Z" fill="#3a9a7a" opacity=".45"/><ellipse cx="2.6" cy="9.4" rx="1.6" ry=".8" fill="#4aa888" opacity=".45"/></g>`
        // we look up into the mouth: the dark inside, the far inner rim catching the moon
        + `<ellipse cx="0" cy="13" rx="6.45" ry="1.25" fill="#0c1410"/><path d="M-6.2 12.8Q0 11.4 6.2 12.8" stroke="#8a7a40" stroke-width=".3" fill="none" opacity=".8"/>`
        + `<path d="M-6.4 13.1Q0 14.5 6.4 13.1" stroke="#f8e0a0" stroke-width=".3" fill="none" opacity=".7"/></g>`;
      // barnacles and a hank of weed on the waist (drawn in picture units at the bell's points)
      const a = BELL.rot * Math.PI / 180, P = (lx, ly) => [BELL.x + (lx * Math.cos(a) - ly * Math.sin(a)) * BELL.s, BELL.y + (lx * Math.sin(a) + ly * Math.cos(a)) * BELL.s];
      const b1 = P(4.4, 8.6), b2 = P(-3.6, 4.2), w1 = P(5.6, 10.5);
      fg += barnacles(u, b1[0], b1[1], 4, 1.1, 51) + barnacles(u, b2[0], b2[1], 2, .9, 52) + weed(w1[0], w1[1], 14, 3, 53, '#2e6a4a');
      // the clapper strikes the lip on the right (the bell swung to the left): a flash, the air trembling
      const hit = P(6.3, 12.6); fg += K.localGlow(u, { x: hit[0], y: hit[1], color: '#eafff4', power: .75, radius: 9 })
        + [6, 10, 14].map((r, i) => `<path d="M${f(hit[0] + r * .3)} ${f(hit[1] - r * .9)}q${f(r * .7)} ${f(r * .9)} 0 ${f(r * 1.8)}" stroke="#d8fff0" stroke-width="${f(.7 - i * .15)}" fill="none" opacity="${f(.75 - i * .2)}"/>`).join('');
      // the lanyard: from the clapper's ring through the mouth, sagging to a cleat on the right post
      const lr = P(.7, 21.2); fg += K.rope(u, L, [lr, [lr[0] + 14, lr[1] + 10], [lr[0] + 30, lr[1] + 6], [POST[1] - 4.2, 104]], { r: .55, seed: 5 })
        + K.shadeCyl(u, POST[1] - 5.6, 101, POST[1] - 5.6, 107, 1.2, L, 'iron', { outline: .3 }); }
    // cards shaken out of the enemies' hands, flying away over the rail on the toll (to the sea, to both sides)
    fg += flyingCard(u, 22, 106, -32, .85, .7, false, .95) + flyingCard(u, 14, 80, 18, .66, .45, true, .85) + flyingCard(u, 34, 64, -64, .6, .8, false, .8)
      + flyingCard(u, 178, 96, 40, .8, .6, true, .95) + flyingCard(u, 186, 124, -12, .72, .75, false, .85);
    // light: the moon's veil, the fog over the deck under the glass, the under-glass dark
    fg += glow(u, 100, 92, 70, 50, '#bff8e0', .12) + motes(26, 10, 40, 180, 100, '#dffff0', 9)
      + K.fog(u, L, { y: 150, h: 60, density: .35, seed: 12 }) + gloom(u, 100, 160, 100, 280, .45, '#020806');
    return [bg, fg];
  } };
