// «Туман» (Колода моря): in grey fog before dawn only the ship straight ahead is clear — dark, against the glow;
// the two standing off to the left and the right have all but melted away. Our own rail in front, a coil on it and
// a lantern on its stanchion with a big halo in the fog. Brief: docs/tasks/print-kit-cards.md «Туман».
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, clamp, lerp, rng, nid, linGrad, radGrad } = K;
// The dawn glow right behind the middle ship (brief: «предрассветное зарево прямо за средним кораблём»; kit az —
// where the light comes FROM: 0 = from the depth, at us), low. The kit's 'fog' palette is the Dutchman's green, which
// the brief forbids here, so the scheme is 'day' (neutral light) and the scene sets a grey palette below.
const light = { time: 'day', key: { type: 'sun', az: 0, el: 8, color: '#e9e2d0', power: .55 }, fill: { color: '#aeb6bd', power: .42 },
  locals: [{ x: 31, y: 158, h: 1.4, color: '#ffb866', power: .5, radius: 40 }], haze: .85, shadowTint: '#3a3f45' };   // grey fog: neutral shadows, not the day's blue
const HZ = 124, WL = 134;   // horizon (no line: the sea goes into the fog); waterline of the middle ship
const skel = { horizon: HZ, eye: 4, items: [
  ['ship', 42, WL, 118, 92, 'water'], ['ghostL', 0, 129, 34, 38, 'water'], ['ghostR', 160, 130, 40, 42, 'water'],
  ['rail', 0, 186, 200, 18, 'our side'], ['coil', 109, 176, 24, 7, 'rail'], ['post', 23, 182, 4, 54, 'rail'], ['lantern', 26, 163, 13, 30, 'post hook']] };

module.exports = { name: 'Туман', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    // grey dawn fog: the sky darker grey above, pale at the sea; the sea grey-blue (the series' water dimmed by fog)
    L.pal = Object.assign({}, L.pal, { sky: ['#737c82', '#8f979a', '#b3b6b1', '#cdcabd'], sea: ['#c3c2b6', '#7f8b8e', '#3a4a52'], fog: '#cfcfc6', cloudLit: '#d8d6cc', cloudShade: '#8b9196' });
    let bg = K.sky(u, L, { horizon: HZ + 8 });
    bg += K.water(u, L, { horizon: HZ, bottom: 280, swell: .25, seed: 14 });
    // the line of the horizon is lost in the fog
    bg += K.fog(u, L, { y: HZ - 22, h: 34, density: .95, seed: 2 });
    // the two ships standing off: almost gone, contrast about a tenth, softened by the fog laid over them
    const gL = K.ship(u, L, { kind: 'brig', x: 18, y: 129, scale: .46, detail: 'far', air: .9, sails: 'reefed', seed: 4 });
    const gR = K.ship(u, L, { kind: 'merchant', x: 186, y: 130, scale: .48, detail: 'far', air: .9, sails: 'reefed', flip: true, seed: 12 });
    bg += `<g data-far="">${gL}${gR}</g>`;
    bg += K.fog(u, L, { y: 74, h: 62, density: .9, seed: 5 });
    // the dawn glow behind the middle ship: the fog shines against it, the water under it pales
    bg += K.localGlow(u, { x: 104, y: 84, color: '#f5e8cc', power: .85, radius: 74 }, { core: false }) + K.localGlow(u, { x: 104, y: 140, color: '#efe2c6', power: .35, radius: 50 }, { squash: .25, core: false });
    // the middle ship: dark against the glow, sails lit through; a soft dark reflection under it
    bg += K.ship(u, L, { kind: 'merchant', x: 102, y: WL, scale: 1.22, sails: 'reefed', reflect: true, seed: 8 });
    // strips of fog lying across, low on the water and thin over the sea in front: they do not hide the middle ship
    bg += K.fog(u, L, { y: WL - 8, h: 16, density: .45, seed: 8 }) + K.fog(u, L, { y: 146, h: 30, density: .4, seed: 9 });

    // ——— our side, under the glass: the bulwark slanting across, its rail, a coil on it, the lantern on a stanchion
    let fg = '';
    const ang = -4, cx = 100, cy = 182, rot = (x, y) => { const a = ang * Math.PI / 180, dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
    const top = 176;   // the top of the rail before the slant (y 168..182 after it)
    fg += `<g transform="rotate(${ang} ${cx} ${cy})">` + K.bulwark(u, L, { x1: -30, x2: 230, y: top + 74, h: 74, kind: 'oak', posts: 38, seed: 6 })
      + K.coil(u, L, { x: 121, y: top + 1.6, s: 1.05, turns: 4, tail: true, seed: 3 }) + '</g>';
    // the stanchion on the rail and its iron hook; the lantern hangs from the hook
    const foot = rot(25, top + 1), head = [foot[0] + .6, 128], hook = [head[0] + 7, head[1] + 1.5];
    fg += K.contactShadow(u, foot[0], foot[1], 6, L) + K.shadeCyl(u, foot[0], foot[1], head[0], head[1], 1.6, L, 'oak', { ell: .25, face: 2, seed: 4 });
    fg += K.shadeCyl(u, head[0] - .5, head[1] + 1.4, hook[0], hook[1], .55, L, 'iron', { cap: 'round' })
      + `<path d="M${f(hook[0])} ${f(hook[1])}q1.4 .4 1 2.2q-.4 1.2 -1.4 .6" stroke="${L.ramp('iron', hook[0], hook[1]).core}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
    // below the rail our side goes down into its own shade: no deck, only the dark of the waist (calm under the glass)
    { const id = nid('dk', u), sh = mix(L.shadowTint, '#1d1a17', .5); fg += `<defs>${linGrad(id, 0, 196, 0, 262, [[0, sh, 0], [.45, sh, .62], [1, mix(sh, '#151311', .4), .96]])}</defs><rect x="-10" y="190" width="220" height="100" fill="url(#${id})"/>`; }
    const lamp = { x: hook[0] + .4, y: hook[1] + 33, s: 1.05, hang: 3, seed: 5 };
    fg += K.lantern(u, L, lamp);
    // the lantern's light: a big halo in the fog, a warm pool on the rail and the coil
    const lp = K.lantern.local(lamp);
    fg += K.localGlow(u, { x: lp.x, y: lp.y, color: '#ffb866', power: .85, radius: 40 }) + K.localGlow(u, { x: lp.x, y: lp.y, color: '#ffd9a0', power: .5, radius: 16 }, { core: false }) + K.localGlow(u, { x: lp.x + 4, y: rot(lp.x, top)[1] + 2, color: '#ffb866', power: .35, radius: 34 }, { squash: .3, core: false });
    return [bg, fg];
  } };
