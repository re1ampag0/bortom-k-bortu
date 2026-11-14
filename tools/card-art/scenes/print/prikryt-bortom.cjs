// «Прикрыть бортом» (общая: Месть королевы Анны ×1, Летучий Голландец ×2; РЕАКЦИЯ: противник объявил Залп по
// союзнику — Залп попадает в ваш корабль, урон −1), refined from the first-round scene (portrait-revenge.cjs
// SCENES['Прикрыть бортом']): the same idea — the Revenge has put herself broadside between the enemy's guns and her
// ally and takes the salvo meant for him; the Black Pearl beyond her stern is untouched. After the brief: three ships
// in the frame — the shooter far on the left (the Company's Endeavour, her side in flashes and smoke), the Revenge
// near and big in the middle, the Pearl further off on the right, half behind her stern, against the setting sun.
// The find: the balls sit stuck in the Revenge's thick planking (rings of crushed wood), one strikes now in a burst of
// splinters, two more are on their way along their smoke trails.
// Fixed against the first round: the ships were sprites (one ball coming out of the corner at nobody) — now the kit's
// ships, the shooter in the frame; the hit was a yellow star stuck on the hull — now craters, splinters and a flash of
// the impact on her side; the Revenge rides the slope of a swell, laid over away from the blows (her roll with the
// heel on the slope, as in «Буря»).
// Light: the low sun ahead on the right behind the Pearl (key, contre-jour: the Revenge's side in shadow, its rim
// lit); the flashes of the enemy's guns and the impacts on the Revenge's side (local, warm).
'use strict';
const K = require('../kit/index.cjs');
const { helpers: Hx } = require('./tyazhyolyy-bort.cjs');
const { f, mix, nid, rng } = K;

const HZ = 98, SUN = { x: 182, y: 50 };
const REV = { kind: 'revenge', x: 96, y: 118, scale: .95, heel: 0, roll: -6, sails: 'full', detail: 'near', lights: true, seed: 7 };
const ALLY = { kind: 'pearl', x: 190, y: 100.5, scale: .36, flip: true, sails: 'reefed', detail: 'mid', lights: true, wake: true, seed: 3 };
const EN = { kind: 'endeavour', x: 23, y: 99.5, scale: .42, flip: true, sails: 'full', detail: 'mid', seed: 4 };
const light = { time: 'dusk', haze: .35, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffa860', power: .6 }, fill: { color: '#6e4a70', power: .45 },
  rim: { az: 20, color: '#ffc890', power: .55 },
  locals: [{ x: 70, y: 106, color: '#ffc070', power: .8, radius: 30 }, { x: 18, y: 95, color: '#ffb050', power: .6, radius: 22 }] };
const skel = { horizon: HZ, eye: 4, light: 'the low sun ahead right behind the Pearl (contre-jour); the enemy\'s flashes; the impacts on the Revenge\'s side', items: [
  ['revenge', 5, 118, 158, 108, 'water: the near swell, waterline y 118 level, laid over away from the blows'],
  ['enemy (Endeavour)', 2, 99.5, 50, 44, 'water on the horizon, left, under the Revenge\'s bowsprit'],
  ['ally (Pearl)', 160, 100.5, 40, 42, 'water on the horizon, right, half behind the Revenge\'s stern, against the sun'],
  ['hits', 50, 112, 40, 16, 'the Revenge\'s side at her bow quarter, round the forward ports'],
  ['shot trails', 20, 108, 50, 16, 'in the air between the enemy and the Revenge']] };

module.exports = { name: 'Прикрыть бортом', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 4 });
    L.pal = Object.assign({}, L.pal, { sky: ['#160a18', '#40162a', '#9a3a24', '#ec8240'], sea: ['#b8603a', '#44182a', '#120810'], cloudLit: '#f08a50', cloudShade: '#3a1a2c' });
    const R = rng(11);
    const tan = Math.tan(-REV.heel * Math.PI / 180), wlY = x => REV.y + (x - REV.x) * tan;
    // ——— the sky at sunset, the sun low ahead on the right, the sea with its path of light
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[40, 22, 90, 12, 4, .1], [150, 36, 80, 10, 9, .2], [70, 64, 60, 7, 13, .45], [190, 66, 40, 5, 6, .55], [120, 86, 50, 4, 2, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 5, glitter: SUN.x });
    // ——— the ally beyond, against the sun: whole, quiet, her lanterns lit
    bg += K.ship(u, L, ALLY);
    { const g = nid('av', u); bg += `<defs><radialGradient id="${g}" cx="${ALLY.x - 4}" cy="${ALLY.y - 14}" r="38" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd8a8" stop-opacity=".55"/><stop offset=".6" stop-color="#ffc890" stop-opacity=".3"/><stop offset="1" stop-color="#ffc890" stop-opacity="0"/></radialGradient></defs><rect x="140" y="30" width="60" height="76" fill="url(#${g})"/>`; }
    // ——— the shooter far on the left: her side in flashes, the smoke of her salvo rolling out and down the wind
    const Le = Object.assign(K.makeLight(Object.assign({}, light, { haze: .1 }), { horizon: HZ, eye: 4 }), { pal: L.pal });
    bg += K.smoke(u, L, { x: 14, y: 96, w: 30, h: 20, wind: -.8, seed: 3, opacity: .5 }) + K.ship(u, Le, EN);
    const Pe = Hx.sidePt(EN, K.shipGeom(EN.kind, EN)), ep = Hx.portXH(EN.kind, 1);
    for (const [i, ph, sd] of [[8, 0, 2], [10, .45, 7], [12, .7, 4], [14, .9, 9]]) { const [X, H] = ep[i], m = Pe(X, H - .2, 1.5);
      bg += Hx.portFlash(u, Le, { x: m[0], y: m[1], k: .75, phase: ph, seed: sd, dir: 4, len: 8, smokeDir: [.5, -.6], tone: 'grey' }); }
    const shot = Pe(ep[8][0], ep[8][1] - .2, 1.5);

    // ——— the Revenge between them: broadside, laid over away from the blows, on the slope of the near swell
    const G = K.shipGeom(REV.kind, REV), P = Hx.sidePt(REV, G), ang = Math.atan(tan) * 180 / Math.PI;
    let fg = '';
    { const g = nid('sw', u), top = [], N = 12; for (let i = 0; i <= N; i++) { const x = -10 + i * 220 / N; top.push([x, wlY(x) + .8 + Math.sin(i * 1.9) * .5]); }
      const d = Hx.sp(top) + 'L210 290L-10 290Z', nc = nid('nc', u);
      fg += `<defs>${Hx.lin(g, 0, 108, 0, 200, [[0, '#c0704a'], [.1, '#6a2c30'], [.45, '#2c1220'], [1, '#100810']])}<clipPath id="${nc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${g})"/>`
        + `<g clip-path="url(#${nc})"><g opacity=".5">${K.water(u, L, { horizon: 96, bottom: 290, swell: 1, seed: 33, glitter: SUN.x - 6 })}</g></g>`; }
    fg += Hx.tiltShip(u, L, REV);
    fg += `<g transform="rotate(${f(ang)} ${REV.x} ${REV.y})">${K.foam(u, { x: REV.x - 4, y: REV.y + .6, w: 104, h: 1.8, seed: 21, L })}</g>`;
    // the sea breaking on her raised bow
    { const st = P(-46, 0); fg += K.splash(u, { x: st[0] + 1, y: st[1] + 1.5, w: 8, h: 6, seed: 2, L, wind: -1 }); }

    // ——— the blows on her bow quarter: two balls already stuck in the planking, a fresh one striking now
    const at = (X, H) => { const [x, y] = P(X, H); return { x, y }; };
    fg += Hx.dent(u, L, { ...at(-10.5, 9.8), r: 1.1, ang, seed: 4 });
    const stuck = [[-28, 3.8, 3, 3], [-37, 8.4, 2.8, 5], [-9.5, 3.6, 2.6, 6]];
    for (const [X, H, r, sd] of stuck) fg += Hx.stuckBall(u, L, { ...at(X, H), r, ang, seed: sd, dx: .25, dy: -.2 });
    const hit = at(-19.2, 10.2);
    { const { x, y } = hit; let sk = '';
      for (let i = 0; i < 30; i++) { const a = Math.PI * (.6 + R() * .9), d = 2 + R() * 15, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .7 - R() * 2.5, l = 1 + R() * 2.8, rot = R() * 3;
        sk += `<path d="M${f(cx - Math.cos(rot) * l / 2)} ${f(cy - Math.sin(rot) * l / 2)}l${f(Math.cos(rot) * l)} ${f(Math.sin(rot) * l)}" stroke="${R() > .45 ? '#f0c88a' : '#9a6232'}" stroke-width="${f(.35 + R() * .3)}" stroke-linecap="round"/>`; }
      fg += Hx.dent(u, L, { x, y, r: 1.8, ang, seed: 7 }) + K.smoke(u, L, { x: x - 2, y: y - 1, w: 18, h: 20, wind: -.6, seed: 8, opacity: .7, glow: { color: '#ffb050', power: .8 } })
        + K.localGlow(u, { x, y, color: '#ffd890', power: 1, radius: 20 })
        + `<g transform="translate(${f(x)} ${f(y)}) scale(1.5) translate(${f(-x)} ${f(-y)})"><path d="M${f(x)} ${f(y - 4.2)}l1 3.2l3.4 -1.2l-2.2 2.4l3.2 1.4l-3.6 .2l.6 3.4l-2.4 -2.4l-2.2 2.6l.4 -3.4l-3.4 -.6l3 -1.6l-1.8 -2.8l2.8 1.4z" fill="#fff2c0" opacity=".95"/></g>` + sk; }
    // the next balls on their way from the enemy's side, along their trails (low arcs)
    fg += Hx.flying(u, L, shot[0] + 4, shot[1] - 1, shot[0] + 16, shot[1] + 1.5, 1.6);
    for (const [tx, ty] of [[hit.x - 2, hit.y], [at(-28, 3.8).x - 3.5, at(-28, 3.8).y]]) { const g = nid('tr', u), [sx, sy] = [shot[0] + 3, shot[1] - 1];
      fg += `<defs>${Hx.lin(g, sx, sy, tx, ty, [[0, '#f0e4d0', 0], [.5, '#f4ecdc', .45], [1, '#fbf6ec', .85]])}</defs><path d="M${f(sx)} ${f(sy)}Q${f((sx + tx) / 2)} ${f(Math.min(sy, ty) - 3)} ${f(tx)} ${f(ty)}" stroke="url(#${g})" stroke-width="1.3" fill="none" stroke-linecap="round"/>`; }
    // the impact's light on the water under her bow
    fg += K.localGlow(u, { x: hit.x, y: wlY(hit.x) + 4, color: '#ffb050', power: .4, radius: 22 }, { squash: .3, core: false });
    // under the glass: the near swell darkening
    { const g = nid('dk', u); fg += `<defs>${Hx.lin(g, 0, 140, 0, 290, [[0, '#0a0410', 0], [1, '#0a0410', .6]])}</defs><rect x="0" y="140" width="200" height="150" fill="url(#${g})"/>`; }
    return [bg, fg];
  } };
