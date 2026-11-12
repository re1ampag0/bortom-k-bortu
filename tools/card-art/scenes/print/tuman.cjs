// «Туман» (Колода моря): white day fog. Straight across from us one warship lies broadside on, sharp and dark, ports
// open — the only target; off on the diagonal, in the glare of the sun behind the fog, a second ship is all but gone:
// a grey ghost of masts and one warm stern lantern. The sun is a pale disc in the white upper right, its rays slant
// down through the fog; the sea is grey-green and dulls into the white; under the glass only the fogged sea (no wood of ours).
// All round only the one straight ahead may be fired at. Brief: docs/mockups/print/card-briefs.md «Туман».
// Not night (that is «Чёрные паруса в ночи»), not green (that is the Dutchman's murk): whitish, by day.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, rng, nid, linGrad } = K;

const HZ = 116;   // horizon (lost in the fog); the clear ship's waterline is a little below it
const WL = 121;
// the key: the sun high ahead and right, hidden in the fog (a pale disc); shadows fill with the fog's own white
const light = { time: 'day', key: { type: 'sun', x: 152, y: 34, el: 26, color: '#fff3dc', power: .7 }, fill: { color: '#c9cfcd', power: .55 },
  rim: { az: 30, color: '#fffaf0', power: .55 }, haze: .9, shadowTint: '#4a5256' };
const skel = { horizon: HZ, eye: 4, light: 'sun behind the fog ahead-right (152, 34); rays slant down-left; the clear ship rim-lit on its right edges',
  items: [
    ['warship (straight across)', 96, WL, 140, 100, 'water, waterline y 121, broadside to us'],
    ['ghost ship (diagonal)', 172, 112, 70, 54, 'water far off right, in the glare'],
    ['ghost lantern', 150, 100, 6, 6, 'on the ghost ship\'s stern'],
  ] };

const PAL = { sky: ['#8b959a', '#b3babb', '#dbdbd4', '#ecebe3'], sea: ['#d6d6cd', '#76858a', '#283a41'], fog: '#f1efe8', cloudLit: '#f4f2ea', cloudShade: '#a3abae', smoke: '#d9d9d2' };
const blur = (id, sd) => `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

module.exports = { name: 'Туман', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, PAL);
    const R = rng(23), white = '#f6f4ee';
    // ——— the white sky and the sun as a pale disc in it
    let bg = K.sky(u, L, { horizon: HZ + 4, stars: false });
    { const g = nid('sg', u), d = nid('sd', u);
      bg += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="152" cy="34" r="96"><stop offset="0" stop-color="#fffdf6" stop-opacity=".95"/><stop offset=".22" stop-color="#fbf7ec" stop-opacity=".7"/><stop offset=".6" stop-color="#f2efe6" stop-opacity=".3"/><stop offset="1" stop-color="#eeece4" stop-opacity="0"/></radialGradient>${blur(d, 1.4)}</defs>`
        + `<rect x="0" y="0" width="200" height="${HZ + 6}" fill="url(#${g})"/><circle cx="152" cy="34" r="11" fill="#fffef9" opacity=".92" filter="url(#${d})"/>`; }
    // the sea: grey-green, dulling into the white towards the horizon
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: .3, seed: 14, glitter: 150 });
    // the line of the horizon drowned in a band of fog
    bg += K.fog(u, L, { y: HZ - 26, h: 40, density: 1, seed: 2 });
    // ——— the ghost on the diagonal: far, in the glare, its colours almost the fog's
    // not a ship but its shadow: one grey tone, blurred, sinking into the white towards the sun
    { const b = nid('gs', u), b2 = nid('gs', u);
      bg += `<defs>${blur(b, 1.25)}${blur(b2, 2.2)}</defs>`
        // a third, fainter still, far off on the left diagonal
        + `<g filter="url(#${b2})" opacity=".3">${K.shipSilhouette('merchant', { x: 14, y: 112, scale: .52, sails: 'reefed', seed: 12, color: '#8a9496', u })}</g>`; }
    // the fog swallows the ghost: a thick white veil over the right, densest at the sun
    { const g = nid('gv', u), b = nid('gb', u);
      bg += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="172" cy="62" r="66"><stop offset="0" stop-color="${white}" stop-opacity=".5"/><stop offset=".55" stop-color="${white}" stop-opacity=".22"/><stop offset="1" stop-color="${white}" stop-opacity="0"/></radialGradient>${blur(b, 3)}</defs>`
        + `<ellipse cx="166" cy="80" rx="70" ry="54" fill="url(#${g})"/>`
        + `<g filter="url(#${b})" fill="${white}">`
        + [[196, 84, 22, 8, .3], [20, 102, 36, 6, .35], [178, 118, 40, 3, .4]].map(([x, y, rx, ry, o]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('') + '</g>'; }
    // the ghost itself, over the veil: a dark hull and masts at a third of their strength, the small things lost in the blur
    { const b = nid('gh', u), b2 = nid('gh', u);
      bg += `<defs>${blur(b, .75)}${blur(b2, 2.4)}</defs>`
        + `<g filter="url(#${b2})" opacity=".18">${K.shipSilhouette('brig', { x: 176, y: 114, scale: .8, flip: true, sails: 'reefed', seed: 4, color: '#3c464b', u })}</g>`
        + `<g filter="url(#${b})" opacity=".33">${K.shipSilhouette('brig', { x: 176, y: 114, scale: .8, flip: true, sails: 'reefed', seed: 4, color: '#2c3438', u })}</g>`
        // a skin of fog lying on her waterline
        + `<g filter="url(#${b2})" fill="${white}"><ellipse cx="170" cy="115" rx="34" ry="3.4" opacity=".5"/></g>`; }
    // the ghost's stern lantern: a small warm smudge in the white, the one thing that says «a ship is there»
    bg += K.localGlow(u, { x: 146, y: 99, color: '#ffb866', power: .9, radius: 18 }, { core: false })
      + `<circle cx="146" cy="99" r="1.4" fill="#ffd59a" opacity=".95"/>`;
    // the sun's rays through the fog: pale wedges fanning down-left from the disc, behind the clear ship
    { const b = nid('rb', u); let rays = '';
      for (const [a, w, o] of [[116, 6, .4], [129, 10, .34], [143, 5, .28], [157, 8, .3], [99, 5, .24]]) {
        const r1 = 12, r2 = 230, t = a * Math.PI / 180, tw = w * Math.PI / 180;
        const p = (r, d) => [152 + Math.cos(t + d) * r, 34 + Math.sin(t + d) * r];
        const [a1, a2, b1, b2] = [p(r1, -tw / 4), p(r1, tw / 4), p(r2, tw / 2), p(r2, -tw / 2)];
        const g = nid('rg', u);
        rays += `<defs>${linGrad(g, 152, 34, p(r2, 0)[0], p(r2, 0)[1], [[0, white, o], [.45, white, o * .7], [.75, white, 0]])}</defs><path d="M${f(a1[0])} ${f(a1[1])}L${f(a2[0])} ${f(a2[1])}L${f(b1[0])} ${f(b1[1])}L${f(b2[0])} ${f(b2[1])}Z" fill="url(#${g})"/>`;
      }
      bg += `<defs>${blur(b, 2.2)}</defs><g filter="url(#${b})">${rays}</g>`; }
    // ——— the one straight across: a warship broadside on, ports open, sharp and dark against the white
    bg += K.castShadow(u, L, { x: 96, y: WL + 1, w: 120, h: 40, horizon: HZ, d: .2, onto: 'water', opacity: .5 });
    bg += K.ship(u, L, { kind: 'warship', x: 96, y: WL, scale: .94, sails: 'reefed', detail: 'near', reflect: true, wake: false, seed: 8 });
    bg += K.foam(u, { x: 96, y: WL + .6, w: 112, h: 1.2, seed: 5, L });
    // the low fog in front, lying on the water: it does not reach the ship's hull
    bg += K.fog(u, L, { y: WL + 10, h: 22, density: .3, seed: 8 }) + K.fog(u, L, { y: 156, h: 40, density: .35, seed: 9 });
    { const b = nid('wb', u); bg += `<defs>${blur(b, 2.4)}</defs><g filter="url(#${b})" fill="${white}">`
      + Array.from({ length: 5 }, (_, i) => `<ellipse cx="${f(R() * 200)}" cy="${f(134 + i * 8 + R() * 6)}" rx="${f(18 + R() * 22)}" ry="${f(1.2 + R() * 1.6)}" opacity="${f(.22 + R() * .2)}"/>`).join('') + '</g>'; }

    // the fog is heavier away from the sun: the corners close in grey (the frame filled, the eye kept on the middle)
    { const g = nid('vg', u); bg += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="120" cy="80" r="150"><stop offset=".45" stop-color="#5d686d" stop-opacity="0"/><stop offset="1" stop-color="#4c565b" stop-opacity=".5"/></radialGradient></defs><rect x="0" y="0" width="200" height="280" fill="url(#${g})"/>`; }

    // ——— under the glass: only the fogged sea — no wood of ours at the edges of the plate
    let fg = '';
    { const id = nid('dk', u), sh = mix(L.shadowTint, '#1d1f20', .5); fg += `<defs>${linGrad(id, 0, 170, 0, 280, [[0, sh, 0], [.5, sh, .35], [1, sh, .6]])}</defs><rect x="-10" y="170" width="220" height="110" fill="url(#${id})"/>`; }
    // a last wisp drifting low over the water
    { const b = nid('fb', u); fg += `<defs>${blur(b, 3)}</defs><ellipse cx="40" cy="186" rx="60" ry="5" fill="${white}" opacity=".35" filter="url(#${b})"/>`; }
    return [bg, fg];
  } };
