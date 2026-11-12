// «Ядра» (Жемчужина, ЗАРЯД, +1 урон к Залпу): the gun deck in a cut-away, refined from the first-round scene
// (portrait.cjs SCENES['Ядра']): the gun has just fired through the port in the hull side on the right; outside,
// close by, the enemy's side takes the shot — a burst of splinters and a smashed plank where the ball went in,
// the next ball already on its way. Inside: one hanging lantern is the light of the deck (shadows fan from under
// it), the flash at the port is a second, brief warm light on the muzzle and the frames. Kit gun, shot pile,
// lantern, deck, cask and crate in the manner of the first round (dark hold, warm light, full frame).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { woodTex, beam, glow, gloom, motes, rope, nails } = PK;

const HZ = 98, FL = 128, HX = 122, HW = 13, OUT = HX + HW;   // eye level = the sea horizon; the deck line; the hull section
const LAMP = { x: 62, y: 40, s: 1.15 };                         // the lantern's base (it hangs from the beam)
const light = { time: 'night', haze: .3, key: { type: 'point', x: 62, y: 29, h: 1.9, gy: 142, color: '#ffc070', power: 1, radius: 130 },
  fill: { color: '#34486c', power: .3 }, locals: [{ x: 134, y: 109, color: '#ffcf7a', power: .7, radius: 34 }] };
const lightOut = { time: 'day', haze: .3, key: { type: 'sun', x: 154, y: 24, el: 34, color: '#fff0c8', power: .95 }, fill: { color: '#8fb8d8', power: .5 } };
const GUN = { s: 1.9, y: 138, len: 50, turn: .08, recoil: .2, seed: 6 };
const skel = { horizon: HZ, eye: 1.7, light: 'lantern on the beam + the flash at the port', items: [
  ['gun', 45, GUN.y, 100, 44, 'deck'], ['shot', 1, 141, 38, 28, 'deck'], ['lantern', 55, 40, 14, 34, 'beam (rope)'], ['rammer', 6, 132, 16, 116, 'deck, leans on the wall'],
  ['horn', 36, 80, 14, 30, 'peg'], ['enemy', 150, 105, 60, 80, 'water'], ['hit', 168, 108, 20, 16, 'enemy hull'], ['ball', 157, 108, 8, 8, 'in flight'],
  ['cask', 91, 200, 18, 27, 'deck'], ['crate', 22, 222, 40, 26, 'deck'], ['coil', 77, 158, 18, 5, 'deck']] };

// ——— KIT-CANDIDATE: a hit on a ship's side: the smashed hole with torn plank ends, splinters flying out of it
// (each a long thin shard, lit on the side of the light, spinning), dust and smoke, small splashes where they fall
function hit(u, L, o) {
  const R = rng(o.seed || 3), { x, y, s = 1 } = o, rp = L.ramp('oak', x, y);
  let out = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4.2 * s)}" ry="${f(3 * s)}" fill="#0c0705"/>`;
  // torn plank ends round the hole, bent outwards (the ball came from the left)
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + R() * .3, r0 = 3.6 * s, r1 = r0 + (1.4 + R() * 2.4) * s, w = (.5 + R() * .5) * s;
    const ax = x + Math.cos(a) * r0, ay = y + Math.sin(a) * r0 * .72, bx = x + Math.cos(a + .25) * r1, by = y + Math.sin(a + .25) * r1 * .72;
    out += `<path d="M${f(ax - w)} ${f(ay)}L${f(bx)} ${f(by)}L${f(ax + w)} ${f(ay + w * .6)}Z" fill="${Math.cos(a) > 0 ? rp.lit : rp.half}" stroke="${rp.outline}" stroke-width=".2"/>`; }
  // the splinters: from the hole outwards and to the right (the way the ball went), long and short, lit on top
  for (let i = 0; i < 16; i++) { const a = -1.5 + R() * 2.6, d = (5 + R() * 12) * s, len = (1.6 + R() * 3.6) * s, rot = a + (R() - .5) * 1.6, w = (.35 + R() * .45) * s;
    const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * .55 - R() * 2 * s, dx = Math.cos(rot) * len / 2, dy = Math.sin(rot) * len / 2, nx = -dy / len * w * 2, ny = dx / len * w * 2;
    out += `<path d="M${f(cx - dx)} ${f(cy - dy)}L${f(cx + nx)} ${f(cy + ny)}L${f(cx + dx)} ${f(cy + dy)}L${f(cx - nx * .6)} ${f(cy - ny * .6)}Z" fill="${R() > .4 ? '#e2b47a' : '#a06a38'}" stroke="#3a1e0c" stroke-width=".18"/>`; }
  out += K.smoke(u, L, { x: x + 2 * s, y: y + 1, w: 16 * s, h: 18 * s, wind: .5, seed: (o.seed || 3) + 4, opacity: .75, glow: { color: '#ffb050', power: .3 } });
  out += K.localGlow(u, { x, y, color: '#ffd890', power: .55, radius: 7 * s });
  return out;
}

module.exports = { name: 'Ядра', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ });
    const m0 = K.cannon.muzzle({ ...GUN, x: 0 }), gun = { ...GUN, x: OUT + 10 - m0.x }, m = K.cannon.muzzle(gun), by = m.y;
    const ph = 24, pt = by - ph / 2, po1 = nid('po', u), po2 = nid('po', u);
    // the inside of the hull: frames and planking (first round), the beam overhead, the deck in perspective
    let bg = woodTex(u, 0, 0, HX, FL, '#4e301a', '#26150a', '#120a04', 14, true, 7)
      + `<defs>${linGrad(po1, 15, 0, 28, 0, [[0, '#4a2c14', 1], [.35, '#33200e', 1], [1, '#140a04', 1]])}${linGrad(po2, HX - 20, 0, HX - 9, 0, [[0, '#120a04', 1], [.5, '#2e1a0c', 1], [1, '#4a2e16', 1]])}</defs>`
      + `<rect x="15" y="0" width="13" height="${FL}" fill="url(#${po1})"/><path d="M16 0v${FL}" stroke="#7a4e2a" stroke-width=".6"/><path d="M27 0v${FL}" stroke="#0e0804" stroke-width=".8"/>`
      + `<rect x="${HX - 20}" y="0" width="11" height="${FL}" fill="url(#${po2})"/><path d="M${HX - 19.4} 0v${FL}" stroke="#8a5a30" stroke-width=".6"/><path d="M${HX - 9.2} 0v${FL}" stroke="#0e0804" stroke-width=".8"/>`
      + (() => { const g = nid('bm', u); return `<defs>${linGrad(g, 0, 0, 0, 9, [[0, '#1a0e06', 1], [.6, '#3a2210', 1], [1, '#6a4424', 1]])}</defs><rect x="0" y="-2" width="${HX}" height="11" fill="url(#${g})"/><path d="M0 8.4h${HX}" stroke="#c08a52" stroke-width=".5" opacity=".6"/><path d="M0 9h${HX}" stroke="#0a0502" stroke-width="1.2"/>`; })()
      + nails([[21.5, 20], [21.5, 60], [21.5, 100], [HX - 14.5, 30], [HX - 14.5, 74], [HX - 14.5, 120]], '#140a04', .7);
    { const id = nid('dkc', u); bg += `<defs><clipPath id="${id}"><rect x="-10" y="${FL}" width="${HX + 10}" height="${290 - FL}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: FL, bottom: 290, vx: 58, kind: 'oak', plank: 16, seed: 11 })}</g>`; }
    bg += `<path d="M0 ${FL}h${HX}" stroke="#0e0804" stroke-width="1.6"/><path d="M0 ${FL + 1.4}h${HX}" stroke="#c08a52" stroke-width=".5" opacity=".45"/>`;
    // outside the hull: a fresh afternoon sea, the sun high on the right; the enemy close by, broadside to us
    { const id = nid('out', u); let o = K.sky(u, Lo, { horizon: HZ }) + K.sunMoon(u, Lo, { r: 6 })
        + K.cloud(u, Lo, { x: 170, y: 52, w: 40, h: 9, seed: 7, far: .3 }) + K.cloud(u, Lo, { x: 196, y: 80, w: 30, h: 6, seed: 9, far: .6 })
        + K.water(u, Lo, { horizon: HZ, bottom: 290, swell: .5, seed: 4, glitter: 154 })
        + K.ship(u, Lo, { kind: 'endeavour', x: 192, y: 105, scale: .5, detail: 'mid', wake: false, seed: 5 });
      o += hit(u, Lo, { x: 177, y: 100.5, s: 1.3, seed: 5 });
      o += K.muzzleFlash(u, { x: m.x + 1, y: m.y, dir: -3, len: 11, seed: 1 }) + K.localGlow(u, { x: m.x + 6, y: m.y, color: '#ffd890', power: .9, radius: 28 })
        + K.smoke(u, Lo, { x: OUT + 5, y: by - 3, w: 30, h: 50, wind: -.5, seed: 6, opacity: .85, glow: { color: '#ffb050', power: .6 } })
        + glow(u, OUT + 6, by, 30, 22, '#ffcf7a', .7) + glow(u, OUT + 4, by, 9, 7, '#fff6d8', .9);
      // the next ball on its way from our port, a faint trail behind it
      { const bx = 161, bY = by - 2.6, tr = nid('tr', u), tb = nid('tb', u);
        o += `<defs>${linGrad(tr, OUT + 4, by, bx, bY, [[0, '#e8e2d6', 0], [1, '#e8e2d6', .7]])}<filter id="${tb}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation=".7"/></filter></defs>`
          + `<path d="M${OUT + 4} ${f(by)}L${bx} ${f(bY)}" stroke="url(#${tr})" stroke-width="5" stroke-linecap="round" filter="url(#${tb})"/>`
          + `<defs>${radGrad(tb + 'g', bx + 1.1, bY - 1.3, 4.8, [[0, '#8a949c', 1], [.35, '#3a3e42', 1], [1, '#0c0d0e', 1]])}</defs><circle cx="${bx}" cy="${f(bY)}" r="3.4" fill="url(#${tb}g)" stroke="#050505" stroke-width=".35"/><circle cx="${bx + 1.2}" cy="${f(bY - 1.3)}" r=".75" fill="#eef6ff" opacity=".85"/>`; }
      bg += `<defs><clipPath id="${id}"><rect x="${OUT}" y="-10" width="${210 - OUT}" height="300"/></clipPath></defs><g clip-path="url(#${id})">${o}</g>`; }
    // the hull in section: thick frames and planking, the port cut through it, the lid hauled up outside (first round)
    bg += `<path d="M${HX} -10h${HW}v${pt + 10}h${-HW}zM${HX} ${pt + ph}h${HW}V290h${-HW}z" fill="url(#oakH${u})" stroke="#140a04" stroke-width=".8"/>`
      + [12, 40, 66, 140, 172, 204, 236, 266].filter(y => y < pt - 2 || y > pt + ph + 2).map(y => `<path d="M${HX} ${y}h${HW}" stroke="#2a180a" stroke-width=".7"/>`).join('')
      + `<path d="M${HX + 4} -10v${pt + 10}M${HX + 4} ${pt + ph}V290" stroke="#c08a52" stroke-width=".4" opacity=".5"/>`
      + `<path d="M${HX} ${pt}h${HW}M${HX} ${pt + ph}h${HW}" stroke="#0a0502" stroke-width="1.4"/><path d="M${HX} ${pt + ph + 1}h${HW}" stroke="#ffcf7a" stroke-width=".6" opacity=".6"/>`
      + `<g filter="url(#drop${u})"><path d="M${OUT} ${pt}l5 -21l4.2 1.2l-5 20.6z" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".6"/><path d="M${OUT + 1.6} ${pt - 1}l4.6 -19" stroke="#8e2420" stroke-width="1.2"/></g>`
      + `<path d="M${OUT + 6} ${pt - 20}L${OUT - 3} -10" stroke="#a88a5a" stroke-width=".6"/>`;
    // on the wall: the rammer leaning on it (stands on the deck), the powder horn on its peg
    bg += `<g filter="url(#drop${u})"><path d="M10 ${FL + 4}L19 22" stroke="url(#oakH${u})" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="19.3" cy="19.5" rx="4.6" ry="3.2" fill="#4a3420" transform="rotate(5 19.3 19.5)"/><path d="M15.4 18.4q3.6 -2 7 -.6" stroke="#8a6a44" stroke-width=".5" fill="none"/></g>`
      + `<path d="M42 50v8" stroke="#2a1a0a" stroke-width=".8"/><circle cx="42" cy="49" r="1.2" fill="url(#iron${u})"/>`
      + `<g filter="url(#drop${u})"><path d="M38 58q-6 10 2 20q4 4 9 2l1 -3q-6 -2 -8 -8q-2 -6 2 -11z" fill="#e8d6aa" stroke="#6a5a3a" stroke-width=".5"/><path d="M45.5 60q-4 8 -1 14q2 4 5 4" stroke="#fff4dc" stroke-width=".7" fill="none" opacity=".7"/><path d="M39 72q4 4 9 4" stroke="#b89a6a" stroke-width=".5" fill="none"/><path d="M48 78l3 -1" stroke="#3a2a14" stroke-width="1.6"/></g>`
      + motes(26, 0, 10, HX, 128, '#ffd8a0', 8);
    // the deck things: shadows fan from under the lantern, then the things, then the light over them
    let fg = '';
    const sh = (x, y, w, h, d) => K.castShadow(u, L, { x, y, w, h, horizon: HZ, d });
    fg += sh(gun.x - 8, GUN.y, 56, 40, .5) + sh(20, 141, 38, 24) + sh(100, 200, 20 * .9, 30 * .9) + sh(40, 222, 22 * 1.3, 16 * 1.3, .45);
    // the breeching rope from a ringbolt in the frames to the gun (first round), the gun itself
    fg += rope(`M${HX - 10} ${by + 18}Q${gun.x + 10} ${by + 30} ${gun.x - 30} ${by + 6}`, 1.05);
    fg += K.cannon(u, L, { ...gun, breech: false });
    fg += K.shotPile(u, L, { x: 20, y: 141, s: 1.95, n: 3, seed: 4 });
    fg += `<circle cx="${HX - 9}" cy="${by + 18}" r="2.2" fill="none" stroke="url(#iron${u})" stroke-width="1.3"/>`;
    fg += K.shot(u, L, { x: 66, y: 182, s: 1.4, seed: 8 }) + K.coil(u, L, { x: 86, y: 158, s: .85, seed: 3 });
    fg += K.barrel(u, L, { x: 100, y: 200, s: .9, kind: 'water', open: true, seed: 5 });
    fg += K.crate(u, L, { x: 40, y: 222, s: 1.3, seed: 7 });
    fg += K.rammer(u, L, { x: 70, y: 250, s: 1.4, rot: -6, head: 'sponge', seed: 3 });
    // the lantern on its rope from the beam, its light; the flash warms the muzzle, the port's sill and the frames
    fg += K.lantern(u, L, { ...LAMP, hang: 2, lit: true, seed: 2 }) + K.localGlow(u, { x: LAMP.x, y: 29, color: '#ffc070', power: .8, radius: 34 });
    fg += glow(u, 62, 52, 74, 66, '#ffb050', .34) + K.localGlow(u, { x: 62, y: 146, color: '#ffb050', power: .4, radius: 60 }, { squash: .3, core: false }) + K.localGlow(u, { x: m.x - 2, y: by, color: '#ffcf7a', power: .7, radius: 26 }) + glow(u, HX - 18, by - 2, 36, 26, '#ffcf7a', .2);
    fg += glow(u, OUT + 3, by, 20, 16, '#ffcf7a', .55) + glow(u, OUT + 1, by, 6, 5, '#fff6d8', .8);
    fg += gloom(u, 70, 60, 0, 150, .4) + gloom(u, 60, 150, 60, 290, .5) + gloom(u, 62, 34, 62, 0, .35);
    return [bg, fg];
  } };
