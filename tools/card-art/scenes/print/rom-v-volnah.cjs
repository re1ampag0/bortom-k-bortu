// «Ром в волнах» (Колода моря): a rum cask rides the crest of a swell, a mug tied to it, a boathook from our boat
// already has it by the rope becket; two more casks bob in the trough on the way to the far ship, a third one is
// half under water near us. Breakdown: docs/tasks/print-kit-cards.md «Ром в волнах».
'use strict';
const K = require('../kit/index.cjs');

const HZ = 126;
// warm afternoon sun behind the viewer's right shoulder (kit az: where the light comes FROM — 90 right, 180 behind)
const light = { time: 'day', haze: .2, key: { type: 'sun', az: 140, el: 40, color: '#ffe2a8', power: 1 }, fill: { color: '#6fb7b0', power: .5 } };
const skel = { horizon: HZ, eye: .6, light: 'warm sun behind the right shoulder: the wet oak lit upper right, the cask shadow falls left on the wave',
  items: [
    ['ship', 14, 127, 38, 37, 'merchant on the water, waterline y 126.6'],
    ['cask', 62, 122, 74, 48, 'on the crest of the swell, a third in the water, tilted'],
    ['mug', 50, 128, 14, 14, 'floats beside the cask on its cord'],
    ['casks-far', 40, 139, 30, 9, 'two casks on the water in the trough'],
    ['cask-near', 14, 214, 52, 30, 'half under water on the near slope'],
    ['gunwale', 120, 280, 80, 46, 'our boat, from the bottom right edge', { edge: 1 }],
    ['boathook', 128, 262, 76, 168, 'rests on the gunwale by the oarlock, the hook in the becket of the cask', { edge: 1 }],
  ] };

// the swell: its crest line from the left edge (below the horizon: the far sea shows over it) up to the top under
// the cask and down to the right edge
const CREST = [[-6, 152], [18, 149], [38, 144], [52, 134], [62, 121], [72, 112], [86, 109], [100, 108], [114, 109], [128, 107], [140, 111], [152, 120], [166, 128], [186, 132], [206, 134]];

module.exports = { name: 'Ром в волнах', kind: 'sea', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: .6 });
    let bg = K.sky(u, L, { horizon: HZ }) + K.cloud(u, L, { x: 150, y: 52, w: 60, h: 16, seed: 14, far: .4 }) + K.cloud(u, L, { x: 34, y: 98, w: 46, h: 9, seed: 6, far: .8 });
    bg += K.water(u, L, { horizon: HZ, bottom: 160, swell: .5, seed: 8, glitter: false });
    // the far ship and the two casks in the trough
    bg += K.ship(u, L, { kind: 'merchant', x: 34, y: 126.6, scale: .38, detail: 'far', flip: true, sails: 'reefed', seed: 3 });
    bg += farCask(u, L, 47, 135.5, .34, 2, -8) + farCask(u, L, 62, 138, .4, 5, 10);
    // the swell itself: the near sea drawn with its own (high) horizon, cut to the swell's outline
    const swell = id => `<clipPath id="${id}"><path d="${crestPath()}"/></clipPath>`;
    const sid = 'kswl' + u, sea = K.water(u, L, { horizon: 98, bottom: 280, swell: .85, seed: 5, glitter: false });
    // the swell is drawn once (in defs) and shown three times: behind the cask, in front of its lower third and in front
    // of the near cask — one copy on the picture each time, cut by its own clip
    const seaId = 'kswg' + u, show = `<g clip-path="url(#${sid})"><use href="#${seaId}"/></g>`;
    bg += `<defs>${swell(sid)}<g id="${seaId}">${sea}${crestGlow(u, L)}</g></defs>${show}`;
    for (const [x, y, w, sd] of [[44, 150, 22, 41], [86, 132, 30, 42], [132, 140, 26, 43], [64, 168, 34, 44], [150, 162, 30, 45], [108, 186, 38, 46]]) bg += K.foam(u, { x, y, w, h: 1.1, L, seed: sd });
    bg += K.foam(u, { x: 30, y: 146, w: 40, h: 1.6, L, seed: 12 }) + K.foam(u, { x: 168, y: 129.5, w: 50, h: 1.4, L, seed: 13 });
    // the cask on the crest: its shadow on the slope to the left, the cask, then the water in front of its lower third
    const cask = { x: 98, y: 122, s: 2.1, kind: 'rum', lying: true, rot: -8, ell: .5, seed: 7, contact: false };
    let fg = K.castShadow(u, L, { x: 98, y: 127, w: 66, h: 46, horizon: HZ - 16, onto: 'water', d: .6 });
    fg += mugOnCord(u, L) + K.barrel(u, L, cask) + becket(u, L);
    const fid = 'kswf' + u;
    fg += `<defs><clipPath id="${fid}"><path d="M40 280V116C52 112 60 110 70 111C80 112 88 108 98 109.5C108 111 116 107 126 108C134 108.5 140 110 150 113V280Z"/></clipPath></defs>`
      + `<g clip-path="url(#${fid})">${show}</g>`;
    fg += K.foam(u, { x: 72, y: 108.5, w: 26, h: 2, L, seed: 21 }) + K.foam(u, { x: 100, y: 108, w: 30, h: 2.4, L, seed: 22 }) + K.foam(u, { x: 128, y: 106.5, w: 22, h: 2, L, seed: 23 });
    // the third cask, half under water on the near slope
    fg += nearCask(u, L, show);
    // our boat and the boathook
    fg += boathook(u, L) + gunwale(u, L);
    return [bg, fg];
  } };

function crestPath() {
  const P = CREST; let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; d += `Q${a[0]} ${a[1]} ${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`; }
  return d + `L206 133L206 290L-6 290Z`;
}

// KIT-CANDIDATE: the crest of a swell on the light — a band of turquoise where the thin top of the wave lets the
// light through, fading down the slope
function crestGlow(u, L) {
  const id = 'kcg' + u, gid = 'kcgg' + u;
  let d = ''; const P = CREST;
  const Q = P.map(p => [p[0], p[1] + 9 + (p[1] < 125 ? 3 : 0)]).reverse(), curve = (pts, d) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; d += `Q${a[0]} ${a[1]} ${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`; } return d; };
  d = curve(Q, curve(P, `M${P[0][0]} ${P[0][1]}`) + `L${Q[0][0]} ${Q[0][1]}`);
  return `<defs><linearGradient id="${gid}" x1="0" y1="104" x2="0" y2="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a8eadc" stop-opacity=".7"/><stop offset=".3" stop-color="#5fc0b4" stop-opacity=".35"/><stop offset="1" stop-color="#2f5f74" stop-opacity="0"/></linearGradient>`
    + `<filter id="${id}" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs><path d="${d}Z" fill="url(#${gid})" filter="url(#${id})"/>`;
}

function farCask(u, L, x, y, s, seed, rot) {
  return K.barrel(u, L, { x, y, s, kind: 'rum', lying: true, rot, ell: .4, seed, contact: false }) + K.foam(u, { x, y: y - .6, w: 30 * s * 1.05, h: .7, L, seed: seed + 30 });
}

/** The tin mug on its cord: tied to the hoop of the cask, floating beside it. */
function mugOnCord(u, L) {
  // a plain tin mug (KIT-CANDIDATE: the kit's mug is a cooper's one): a tinned cylinder, rolled rim, a strap handle
  const b = [55, 127], t = [58, 115], r = 4.4;
  let s = K.rope(u, L, [[75, 101], [69, 105], [64, 110], [61.5, 116]], { r: .45, seed: 3 });
  s += K.propTube(u, L, 'iron', `M${t[0] + 3.6} ${t[1] + 1.5}C${t[0] + 9} ${t[1] + 1} ${b[0] + 9} ${b[1] - 3} ${b[0] + 3.8} ${b[1] - 3.5}`, .7, [t[0] + 7, t[1] + 5]);
  s += K.shadeCyl(u, b[0], b[1], t[0], t[1], r, L, 'iron', { ell: .42, face: 2, r1: r * .94 });
  s += K.foam(u, { x: 55.5, y: 124.5, w: 13, h: 1.3, L, seed: 9 });
  return s;
}

/** The rope becket round the right end of the cask, the boathook's hook goes through it. */
function becket(u, L) {
  return K.rope(u, L, [[120, 107], [117.5, 97], [118, 86], [121, 78]], { r: .8, seed: 11 }) + K.rope(u, L, [[121, 78], [125, 71], [131, 71], [132, 77], [126, 80], [121.5, 79]], { r: .75, seed: 12 });
}

function nearCask(u, L, show) {
  const c = { x: 36, y: 214, s: 1.75, kind: 'rum', lying: true, rot: 12, ell: .38, seed: 13, contact: false }, id = 'kswn' + u;
  return K.barrel(u, L, c) + `<defs><clipPath id="${id}"><path d="M0 280V195Q20 191 36 195Q54 199 76 202V280Z"/></clipPath></defs><g clip-path="url(#${id})">${show}</g>`
    + K.foam(u, { x: 37, y: 195.5, w: 52, h: 2.6, L, seed: 31 });
}

/** The boathook: an ash pole lying on our gunwale, the iron head — a spike and a hook — in the cask's becket. */
function boathook(u, L) {
  const A = [214, 262], B = [133, 79];
  let s = K.shadeCyl(u, A[0], A[1], B[0], B[1], 2.6, L, 'oak', { r2: 1.9, seed: 5 });
  // the iron ferrule, the spike and the hook
  const ax = (B[0] - A[0]), ay = (B[1] - A[1]), l = Math.hypot(ax, ay), ux = ax / l, uy = ay / l, nx = -uy, ny = ux;
  const F = [B[0] - ux * 6, B[1] - uy * 6], T = [B[0] + ux * 9, B[1] + uy * 9];
  s += K.shadeCyl(u, F[0], F[1], B[0] + ux, B[1] + uy, 1.9, L, 'iron', { r2: 1.5 });
  s += K.propTube(u, L, 'iron', `M${B[0]} ${B[1]}L${T[0].toFixed(1)} ${T[1].toFixed(1)}`, .8, B);
  const H0 = [B[0] + ux * 2, B[1] + uy * 2], hk = `M${H0[0].toFixed(1)} ${H0[1].toFixed(1)}C${(H0[0] - nx * 6).toFixed(1)} ${(H0[1] - ny * 6).toFixed(1)} ${(H0[0] - nx * 7 + ux * 6).toFixed(1)} ${(H0[1] - ny * 7 + uy * 6).toFixed(1)} ${(H0[0] - nx * 3 + ux * 6).toFixed(1)} ${(H0[1] - ny * 3 + uy * 6).toFixed(1)}`;
  s += K.propTube(u, L, 'iron', hk, .75, H0);
  return s;
}

/** Our boat's gunwale in the bottom right corner, with an iron oarlock. */
function gunwale(u, L) {
  const top = K.mat('oak', L, { form: 'plane', x1: 120, y1: 236, x2: 200, y2: 262, n: 'top', u });
  const side = K.mat('oak', L, { form: 'plane', x1: 120, y1: 246, x2: 200, y2: 280, n: 'front', u });
  let s = top.defs + side.defs;
  s += `<path d="M118 280Q150 252 204 236L204 246Q156 262 132 280Z" fill="${top.fill}" stroke="${top.ramp.outline}" stroke-width=".6"/>`;
  s += `<path d="M132 280Q156 262 204 246V280Z" fill="${side.fill}" stroke="${side.ramp.outline}" stroke-width=".6"/>`;
  s += `<path d="M140 280Q162 264 204 252" stroke="${side.ramp.outline}" stroke-width=".5" fill="none" opacity=".6"/><path d="M152 280Q170 268 204 260" stroke="${side.ramp.outline}" stroke-width=".45" fill="none" opacity=".5"/>`;
  // the oarlock: an iron fork in the gunwale, the boathook rests in it
  s += K.propTube(u, L, 'iron', 'M181 246C178 238 180 232 186 233M193 243C196 236 193 231 188 232', 1, [186, 238]);
  s += K.propTube(u, L, 'iron', 'M186 246L187 252', 1.2, [186, 249]);
  return s;
}
