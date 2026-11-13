// «Калёные ядра» (Месть королевы Анны, ЗАРЯД: если на цели есть Пожар, этот Залп наносит +2 урона), refined from the
// first-round scene (portrait-revenge.cjs SCENES['Калёные ядра']): the Revenge's gun deck at sunset. An iron brazier
// on three legs glows with coals, the shot lies in them red-hot; the gunner's gauntleted hand (from the right) lifts
// one ball with the long tongs. Behind, the gun stands breech-first at the open port, its muzzle glowing and hissing
// steam (the hot shot is already in); out there, through the port, the enemy already burns against the sunset.
// Fixed against the first round: the wall was flat with a picture-like window — now a room in 2.5D (the ship's side
// facing us, painted red inside as on the Revenge, deck beams overhead, the deck running to one vanishing point at eye
// level); the gun was a flat badge — now a truck carriage from behind with the barrel running out of the port; the
// brazier was a flat bowl with balls lying on top — now a bowl in perspective with the coals heaped in it and the
// shot sunk in them; the arm was a stiff tube — now one sleeve from the shoulder through the elbow, a leather gauntlet
// whose fingers close round the tongs; the enemy was a sprite with two flames — now the kit's Endeavour hull-up with
// fire on her deck and the smoke drifting.
// Light: the brazier is the key (a point light low on the right: orange, hard shadows away from it); the sunset in
// the port is the second, cool-warm light from the depth (rims on the breech and the gun's top).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, gloom, motes, glow } = PK;

const HZ = 66, VX = 92;                     // eye level, the vanishing point
const WT = 15, WB = 108;                    // the ship's side: under the deck beams, its foot on the deck
const PORT = [54, 33, 130, 85];             // the port in the side: x0 y0 x1 y1
const GUN = { Y0: 140, Y1: WB + 1, S: 2.15 }; // the deck under the rear and the front of the carriage; the gun's scale
const BR = { x: 151, y: 101, rx: 30 };      // the brazier: the middle of its rim, its half-width
const BALL = [141, 83], BR_R = 5;           // the ball in the tongs, the radius of the shot
const light = { time: 'dusk', haze: .35, key: { type: 'point', x: BR.x, y: BR.y - 4, h: .8, gy: 130, color: '#ff9440', power: 1, radius: 110, z: .2 },
  fill: { color: '#5a3a5a', power: .32 }, locals: [{ x: VX, y: 60, color: '#ffb070', power: .4, radius: 60 }] };
const lightOut = { time: 'dusk', haze: .45, key: { type: 'sun', x: 116, y: 58, el: 4, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 } };
const skel = { horizon: HZ, eye: 1.5, light: 'the brazier, low right (key, orange point) + the sunset through the port (from the depth)', items: [
  ['ship side', -10, WB, 220, WB - WT, 'the deck / the deck beams'], ['port', 54, 85, 76, 52, 'ship side'],
  ['enemy', 60, 72, 36, 36, 'the sea outside: her waterline y 72'], ['gun', 64, GUN.Y0, 56, 40, 'deck; the barrel out through the port'],
  ['brazier', 118, 134, 66, 42, 'deck, three legs'], ['tongs+ball', 136, 90, 44, 22, 'the gunner\'s hand'], ['arm', 166, 104, 44, 50, 'from the right edge (shoulder off the frame)'],
  ['tub', 12, 134, 30, 22, 'deck'], ['shot pile', 34, 124, 24, 14, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, t) => [lerp(p[0], VX, t), lerp(p[1], HZ, t)];   // a point moved into the depth, towards the VP
const LEATHER = { lit: '#a8743e', half: '#6a4222', core: '#5a361a', shadow: '#26140a', outline: '#100804' };
const COAT = { lit: '#8e3a28', half: '#5a1e14', shadow: '#24080a', outline: '#100404' };

// ——— KIT-CANDIDATE: a red-hot round shot: white-yellow heart, orange body, a cherry-red edge, its own glow ———
function hotShot(u, x, y, r, heat = 1) {
  const g = nid('hs', u), c = heat > .8 ? ['#fffbe0', '#ffe080', '#ff9a30', '#d8400e', '#6a1004'] : heat > .5 ? ['#ffd890', '#ffa040', '#e8601a', '#a8240a', '#4a0a04'] : ['#ff9a4a', '#e8601e', '#b0300c', '#6a1406', '#2a0604'];
  return `<defs>${radGrad(g, x - r * .25, y - r * .3, r * 1.15, [[0, c[0], 1], [.3, c[1], 1], [.62, c[2], 1], [.86, c[3], 1], [1, c[4], 1]])}</defs>`
    + glow(u, x, y, r * 3.4, r * 3.4, c[2], .55 * heat + .15) + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${g})"/>`
    + `<path d="M${f(x - r * .9)} ${f(y + r * .2)}A${f(r)} ${f(r * .35)} 0 0 0 ${f(x + r * .9)} ${f(y + r * .2)}" stroke="${c[3]}" stroke-width=".35" fill="none" opacity=".6"/>`;
}

module.exports = { name: 'Калёные ядра', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(31);
    const [px0, py0, px1, py1] = PORT;
    // ——— outside, through the port: the sunset, the sea, the enemy hull-up and burning ———
    const oc = nid('oc', u);
    let out = K.sky(u, Lo, { horizon: HZ, stars: false }) + K.sunMoon(u, Lo, { r: 5 })
      + K.cloud(u, Lo, { x: 82, y: 48, w: 46, h: 6, seed: 4, far: .3 }) + K.cloud(u, Lo, { x: 126, y: 40, w: 30, h: 5, seed: 7, far: .4 })
      + K.water(u, Lo, { horizon: HZ, bottom: 100, swell: .4, seed: 5, glitter: 116 });
    { const sx = 76, sy = 72.5, sc = .36;
      out += K.smoke(u, Lo, { x: sx + 4, y: sy - 12, w: 34, h: 40, wind: -.7, seed: 12, opacity: .85, glow: { color: '#ff8a30', power: .6 } });
      out += K.ship(u, Lo, { kind: 'endeavour', x: sx, y: sy, scale: sc, sails: 'reefed', detail: 'mid', flip: true, seed: 4 });
      out += K.fire(u, { x: sx + 6, y: sy - 7.4, w: 9, h: 11, seed: 3, wind: -.5, pool: false }) + K.fire(u, { x: sx - 9, y: sy - 6.2, w: 6, h: 7, seed: 8, wind: -.5, pool: false })
        + K.fire(u, { x: sx + 15, y: sy - 8.6, w: 4, h: 5, seed: 5, wind: -.5, pool: false, glow: false });
      out += K.localGlow(u, { x: sx + 4, y: sy + 2, color: '#ff8a30', power: .7, radius: 16 }, { squash: .3, core: false }); }
    let bg = `<defs><clipPath id="${oc}"><rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}"/></clipPath></defs><g clip-path="url(#${oc})">${out}`
      // the lifted lid outside: its red underside just showing along the top of the opening, the tackle
      + `<path d="M${px0 - 2} ${py0}L${px1 + 2} ${py0}L${px1 - 1} ${py0 + 3.2}L${px0 + 1} ${py0 + 3.2}Z" fill="#8a2018"/><path d="M${px0} ${py0 + 3.2}H${px1}" stroke="#3a0806" stroke-width=".8"/>`
      + `<path d="M${px0 + 8} ${py0 + 3.2}L${px0 + 4} ${py0 + 11}M${px1 - 8} ${py0 + 3.2}L${px1 - 4} ${py0 + 11}" stroke="#2a1410" stroke-width=".5" opacity=".7"/></g>`;
    // ——— the ceiling: deck planks overhead running to the VP, two beams across ———
    { const g = nid('cl', u); bg += `<defs>${linGrad(g, 0, 0, 0, WT, [[0, '#0c0504'], [1, '#2a140c']])}</defs><rect x="-10" y="-2" width="220" height="${WT + 2}" fill="url(#${g})"/>`;
      for (let x = -120; x <= 320; x += 22) bg += `<path d="M${f(x)} -2L${f(lerp(x, VX, (WT + 2) / (HZ + 2)))} ${WT}" stroke="#070302" stroke-width=".7"/>`;
      for (const [y, h] of [[1, 8], [16.5, 5]]) bg += K.shadeBox(u, [{ pts: [[-10, y + h], [210, y + h], [210, y + h + h * .5], [-10, y + h + h * .5]], n: 'bottom', grain: [1, 0] }, { pts: [[-10, y], [210, y], [210, y + h], [-10, y + h]], n: 'front', grain: [1, 0] }], L, 'oak', { seed: y + 3, outline: .5 });
      bg += `<rect x="-10" y="${WT + 6.5}" width="220" height="2.4" fill="#2a160c"/><path d="M-10 ${WT + 8.9}H210" stroke="#0a0502" stroke-width="1"/>`; }
    // ——— the ship's side from inside: red-painted planking (the Revenge), the port cut out, the side's thickness ———
    const W0 = WT + 8.9;
    { const m = nid('pm', u), g = nid('wl', u);
      bg += `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="-10" y="0" width="220" height="160"><rect x="-10" y="0" width="220" height="160" fill="#fff"/><rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" fill="#000"/></mask>`
        + `${radGrad(g, BR.x, BR.y, 120, [[0, '#ffb060', .3], [.45, '#ff9040', .1], [1, '#ff9040', 0]])}</defs>`
        + `<g mask="url(#${m})">${woodTex(u, -10, W0, 220, WB - W0, '#6a2418', '#34100a', '#120504', 7.4, false, 9)}<rect x="-10" y="${W0}" width="220" height="${WB - W0}" fill="url(#${g})"/></g>`;
      // the paint worn off along the edges of the planks near the port, soot above the brazier
      bg += Array.from({ length: 14 }, () => { const x = R() * 200, y = W0 + 3 + R() * (WB - W0 - 6); return (x > px0 - 4 && x < px1 + 4 && y > py0 - 4 && y < py1 + 4) ? '' : `<path d="M${f(x)} ${f(y)}h${f(3 + R() * 8)}" stroke="#7a5a3a" stroke-width=".5" opacity=".35"/>`; }).join('')
        + `<ellipse cx="${BR.x - 4}" cy="${W0 + 18}" rx="30" ry="22" fill="#0a0404" opacity=".35" filter="url(#soft${u})"/>`;
      // the frames: a dark oak rider either side of the port, knees under the beam
      for (const x of [22, 176]) bg += K.shadeBox(u, [{ pts: [[x - 4.4, W0], [x + 4.4, W0], [x + 4.4, WB], [x - 4.4, WB]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: x, outline: .5 })
        + K.shadeBox(u, [{ pts: [[x - 4.4, W0], [x + 4.4, W0], [x + (x < 100 ? 14 : -14), W0], [x + (x < 100 ? 4.4 : -4.4), W0 + 10]], n: 'front', grain: [1, 1] }], L, 'oak', { seed: x + 1, outline: .4 });
      for (const x of [px0 - 7, px1 + 7]) bg += `<circle cx="${x}" cy="${py1 - 4}" r="2.2" fill="none" stroke="#141414" stroke-width="1.1"/>` + K.shadeSphere(u, x, py1 - 6.2, 1.1, L, 'iron', { outline: .3 });
      // the thickness: four faces from the opening into the depth; the sill catches the sunset
      const t = .1, A = [px0, py0], B = [px1, py0], C = [px1, py1], D = [px0, py1], a = toward(A, t), b = toward(B, t), c = toward(C, t), d = toward(D, t);
      bg += `<path d="M${P2(A)}L${P2(B)}L${P2(b)}L${P2(a)}Z" fill="#160a06"/><path d="M${P2(D)}L${P2(C)}L${P2(c)}L${P2(d)}Z" fill="#b8703e"/><path d="M${P2(A)}L${P2(a)}L${P2(d)}L${P2(D)}Z" fill="#5a3420"/><path d="M${P2(B)}L${P2(b)}L${P2(c)}L${P2(C)}Z" fill="#8a4a28"/>`
        + `<path d="M${P2(d)}L${P2(c)}" stroke="#ffc890" stroke-width=".6"/><path d="M${P2(D)}L${P2(C)}" stroke="#2a1006" stroke-width=".8"/>`
        + `<rect x="${px0 - 2.4}" y="${py0 - 2.4}" width="${px1 - px0 + 4.8}" height="${py1 - py0 + 4.8}" fill="none" stroke="#1a0a06" stroke-width="2.6"/>`
        + `<path d="M${px1 + 1.4} ${py0 - 1}V${py1 + 1}" stroke="#ff9a50" stroke-width=".6" opacity=".55"/>`; }
    // the rammer and the sponge leaning on the wall left
    bg += `<g filter="url(#drop${u})"><path d="M8 ${WB + 10}L17 ${W0 + 4}" stroke="url(#oakH${u})" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="17.4" cy="${W0 + 2}" rx="4.2" ry="3" fill="#3a2418" transform="rotate(6 17.4 ${W0 + 2})"/><path d="M13.8 ${W0 + 1}q3.4 -1.8 6.6 -.4" stroke="#7a5a3a" stroke-width=".5" fill="none"/></g>`;
    // ——— the deck: planks to the VP, the brazier's light on it, the sunset's pool under the port ———
    { const id = nid('fc', u); bg += `<defs><clipPath id="${id}"><rect x="-10" y="${WB}" width="220" height="${290 - WB}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: WB, bottom: 290, vx: VX, kind: 'oak', plank: 17, seed: 11 })}</g>`
      + `<path d="M-10 ${WB}H210" stroke="#0a0502" stroke-width="1.3"/>` + K.localGlow(u, { x: VX, y: WB + 6, color: '#ffb070', power: .3, radius: 40 }, { squash: .3, core: false }); }

    // ——— the gun from behind, the barrel out through the port; the muzzle hot, steam from the wet wad ———
    let mid = K.castShadow(u, L, { x: VX, y: GUN.Y0 - 6, w: 54, h: 30, horizon: HZ, d: .8 }) + gun(u, L);
    { const mz = [VX, 84.6];
      mid += glow(u, mz[0], mz[1] - 1, 16, 10, '#ff8a30', .55) + `<ellipse cx="${f(mz[0])}" cy="${f(mz[1] - 1.6)}" rx="3.2" ry="1.4" fill="#ffb050" opacity=".75"/>`
        + K.smoke(u, Lo, { x: mz[0] + 1, y: mz[1] - 3, w: 18, h: 26, wind: .5, seed: 21, opacity: .5, glow: { color: '#ff9a50', power: .5 } }); }

    // ——— the cold shot in a garland left, the water tub with its steam (the wads are dipped) ———
    let fg = K.castShadow(u, L, { x: 38, y: 126, w: 24, h: 12, horizon: HZ }) + K.shotPile(u, L, { x: 38, y: 126, s: 1.25, n: 3, seed: 4 });
    fg += K.castShadow(u, L, { x: 16, y: 142, w: 26, h: 20, horizon: HZ, d: .9 }) + K.barrel(u, L, { x: 16, y: 142, s: 1.05, kind: 'water', open: true, seed: 6 })
      + K.smoke(u, L, { x: 16, y: 112, w: 16, h: 26, wind: .3, seed: 5, opacity: .35 });

    // ——— the brazier: three iron legs, the bowl, the coals heaped in it, the shot sunk in them ———
    { const { x: bx, y: by, rx } = BR, ry = rx * L.ellipse(by, HZ) * 1.05, dep = 14;
      fg += K.castShadow(u, L, { x: bx, y: 132, w: 52, h: 20, horizon: HZ, d: .9 });
      // the legs: the back one first, the front two splayed, each with a foot
      const leg = (x0, y0, x1, y1, seed) => K.shadeCyl(u, x0, y0, x1, y1, 1.35, L, 'iron', { outline: .35, seed }) + `<ellipse cx="${f(x1)}" cy="${f(y1)}" rx="2.6" ry=".9" fill="#1a1414"/>`;
      fg += leg(bx + 4, by + dep * .6, bx + 6, 121, 1);
      const iron = K.mat('iron', L, { form: 'sphere', x1: bx, y1: by - 2, r: rx * 1.15, u });
      const bowl = `M${f(bx - rx)} ${f(by)}C${f(bx - rx)} ${f(by + dep * .9)} ${f(bx - rx * .5)} ${f(by + dep * 1.25)} ${f(bx)} ${f(by + dep * 1.25)}C${f(bx + rx * .5)} ${f(by + dep * 1.25)} ${f(bx + rx)} ${f(by + dep * .9)} ${f(bx + rx)} ${f(by)}Z`;
      fg += iron.defs + `<path d="${bowl}" fill="${iron.fill}" stroke="#0a0808" stroke-width=".6"/>`
        // the bowl's bands and rivets; the heat's glow round its upper edge
        + `<path d="M${f(bx - rx * .97)} ${f(by + 4)}Q${f(bx)} ${f(by + 4 + ry * 1.5)} ${f(bx + rx * .97)} ${f(by + 4)}" stroke="#0e0c0c" stroke-width="1.1" fill="none"/><path d="M${f(bx - rx * .97)} ${f(by + 3.3)}Q${f(bx)} ${f(by + 3.3 + ry * 1.5)} ${f(bx + rx * .97)} ${f(by + 3.3)}" stroke="#8a7a72" stroke-width=".4" fill="none" opacity=".6"/>`
        + [-.7, -.35, 0, .35, .7].map(t => { const x = bx + t * rx * .97, y = by + 4 + ry * 1.5 * (1 - t * t) * .5 + .2; return `<circle cx="${f(x)}" cy="${f(y)}" r=".55" fill="#2a2222"/><circle cx="${f(x - .15)}" cy="${f(y - .2)}" r=".2" fill="#c8b0a0"/>`; }).join('')
        + `<path d="M${f(bx - rx + 1)} ${f(by + 1)}C${f(bx - rx + 1)} ${f(by + 6)} ${f(bx - rx * .6)} ${f(by + 9)} ${f(bx - rx * .3)} ${f(by + 10.5)}" stroke="#ff7a30" stroke-width=".7" fill="none" opacity=".5"/>`;
      fg += leg(bx - rx * .72, by + dep * .7, bx - rx * .96, 131, 2) + leg(bx + rx * .7, by + dep * .75, bx + rx * 1.1, 133, 3);
      // the ring handles on the sides
      for (const sx of [-1, 1]) fg += `<path d="M${f(bx + sx * rx * 1.0)} ${f(by + 2)}q${f(sx * 4.4)} 1 ${f(sx * 3.6)} 5.4q${f(-sx * .8)} 2.6 ${f(-sx * 3.4)} 1.2" stroke="#141010" stroke-width="1.2" fill="none"/><path d="M${f(bx + sx * rx * 1.0)} ${f(by + 1.6)}q${f(sx * 4.4)} 1 ${f(sx * 3.6)} 5.4" stroke="#a08070" stroke-width=".35" fill="none" opacity=".6"/>`;
      // the mouth: the thick lip, inside it the heaped coals glowing from below, cracks of fire between them
      const cg = nid('cg', u), cc = nid('cc', u);
      fg += `<defs>${radGrad(cg, bx, by - 1, rx, [[0, '#ffb040', 1], [.35, '#e8601a', 1], [.7, '#8a1e08', 1], [1, '#2a0804', 1]])}<clipPath id="${cc}"><path d="M${f(bx - rx + 1.4)} ${f(by)}A${f(rx - 1.4)} ${f(ry - .6)} 0 0 1 ${f(bx + rx - 1.4)} ${f(by)}A${f(rx - 1.4)} ${f(ry - .6)} 0 0 1 ${f(bx - rx + 1.4)} ${f(by)}Z"/></clipPath></defs>`
        + `<ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${f(ry)}" fill="#1a0a06"/><ellipse cx="${bx}" cy="${by}" rx="${rx - 1.4}" ry="${f(ry - .6)}" fill="url(#${cg})"/>`;
      // the heap rises over the rim: lumps of charcoal, each dark on top and glowing at its lower edge
      { const RC = rng(17); let coals = '';
        for (let i = 0; i < 60; i++) { const a = RC() * Math.PI * 2, d = Math.sqrt(RC()), x = bx + Math.cos(a) * d * (rx - 3), y = by + Math.sin(a) * d * (ry - 1) - (1 - d) * 4.2 - 1, r = 1.4 + RC() * 1.8;
          const hot = RC(), top = hot > .55 ? '#3a1408' : '#1e0a06', edge = hot > .7 ? '#ffb040' : hot > .4 ? '#e8501a' : '#8a1e08';
          coals += `<path d="M${f(x - r)} ${f(y + r * .3)}L${f(x - r * .4)} ${f(y - r * .55)}L${f(x + r * .6)} ${f(y - r * .5)}L${f(x + r)} ${f(y + r * .2)}L${f(x + r * .2)} ${f(y + r * .55)}Z" fill="${top}" stroke="${edge}" stroke-width="${f(.35 + hot * .3)}"/>`; }
        fg += coals; }
      // the shot sunk in the coals: four balls, hotter towards the middle
      for (const [x, y, h] of [[bx - 18, by - 2.4, .45], [bx + 16, by - 2.8, .7], [bx - 4, by + 1.4, .95], [bx + 5, by - 5, .85], [bx - 13, by + 3.6, .6]]) fg += hotShot(u, x, y, BR_R, h);
      // the lip of the bowl in front of the coals (its near half), lit from inside on top
      fg += `<path d="M${f(bx - rx)} ${f(by)}A${rx} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by)}" stroke="#1a1212" stroke-width="2.2" fill="none"/><path d="M${f(bx - rx + .6)} ${f(by - .6)}A${rx - .6} ${f(ry - .4)} 0 0 0 ${f(bx + rx - .6)} ${f(by - .6)}" stroke="#ff9a50" stroke-width=".5" fill="none" opacity=".8"/>`
        + `<path d="M${f(bx - rx)} ${f(by)}A${rx} ${f(ry)} 0 0 1 ${f(bx + rx)} ${f(by)}" stroke="#2a1a16" stroke-width="1.6" fill="none"/>`;
      // the heat: sparks going up, a glow over the coals, the deck lit round the legs
      { const RS = rng(41); for (let i = 0; i < 30; i++) { const x = bx - rx * .8 + RS() * rx * 1.6, y = by - 6 - RS() * 46, r = .25 + RS() * .55; fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${RS() > .5 ? '#ffe090' : '#ff9a3a'}" opacity="${f(.5 + RS() * .5)}"/>`; } }
      fg += glow(u, bx, by - 4, rx * 2.4, 20, '#ff8a30', .5) + glow(u, bx, by - 2, rx * 1.1, 8, '#ffd070', .55)
        + K.localGlow(u, { x: bx, y: 130, color: '#ff8a30', power: .55, radius: 46 }, { squash: .3, core: false }); }

    // ——— the gunner's arm from the right: one sleeve shoulder -> elbow -> wrist, the gauntlet round the tongs ———
    { const grip = [175, 69], tg = Math.atan2(BALL[1] - grip[1], BALL[0] - grip[0]) * 180 / Math.PI;   // the tongs' direction (handles -> jaws)
      const base = { s: 2.05, m: -1, roll: 18, pitch: 14, pose: 'wrap', r: 1.05, tone: LEATHER, light: [-.55, .8], sw: .3, tilt: 4, palmW: 1.08 };
      let a = 250, h;
      for (let k = 0; k < 5; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
        let d = tg - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
      // the tongs: two long iron rods crossing at a rivet; the jaws curl round the ball and glow dull red from it
      const ux = Math.cos(tg * Math.PI / 180), uy = Math.sin(tg * Math.PI / 180), nx = -uy, ny = ux;
      const at = (t, o) => [BALL[0] - ux * t + nx * o, BALL[1] - uy * t + ny * o];   // t — back along the tongs from the ball
      const piv = at(13, 0), end = at(Math.hypot(BALL[0] - grip[0], BALL[1] - grip[1]) + 6.5, 0), jg = nid('jg', u);
      const rod = (side) => { const j0 = at(-BR_R * .3, side * (BR_R + .6)), j1 = at(BR_R * .9, side * (BR_R + 1.1)), e = [end[0] + nx * side * .9, end[1] + ny * side * .9];
        return `M${P2(j0)}Q${P2(at(BR_R * .4, side * (BR_R + 2)))} ${P2(j1)}L${P2(piv)}L${P2(e)}`; };
      const tongs = `<defs>${linGrad(jg, BALL[0], BALL[1], piv[0], piv[1], [[0, '#ff6a20', 1], [.35, '#8a2a12', 1], [.7, '#2a2020', 1], [1, '#2a2424', 1]])}</defs>`
        + [-1, 1].map(sd => `<path d="${rod(sd)}" stroke="#0a0808" stroke-width="2.1" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${rod(sd)}" stroke="url(#${jg})" stroke-width="1.3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`).join('')
        + `<path d="M${P2(at(16, -.5))}L${P2(end)}" stroke="#a89890" stroke-width=".4" opacity=".55"/>` + K.shadeSphere(u, piv[0], piv[1], 1.2, L, 'iron', { outline: .3 });
      const ball = hotShot(u, BALL[0], BALL[1], BR_R, 1) + glow(u, BALL[0], BALL[1], 22, 22, '#ffb040', .45);
      // the sleeve of a dark red coat from the shoulder off the right edge, the elbow down, the forearm to the gauntlet
      const w = h.wrist, sh = [228, 66], el = [206, 98];
      const arm = H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5) + 2, lerp(sh[1], el[1], .5)], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5) + 2], w],
        w: [21, 19, 16.5, 14, 12.4], tone: COAT, lit: 1, rim: '#ffb070', rimSide: 1, rimOp: .45, seed: 4, drapes: 1, foldW: .8, sw: .4, capA: true,
        cuff: { from: .74, k: 1.3, tone: LEATHER } });
      fg += ball + tongs;
      fg += arm + h.back + `<path d="M${P2(at(Math.hypot(BALL[0] - grip[0], BALL[1] - grip[1]) - 3, 0))}L${P2(end)}" stroke="#141010" stroke-width="2.6" stroke-linecap="round"/>` + h.front
        + K.localGlow(u, { x: BALL[0] + 6, y: BALL[1] - 2, color: '#ffb050', power: .45, radius: 26 }); }

    // ——— the air: motes in the sunset from the port, the dark round the edges ———
    const air = motes(22, 60, 40, 70, 50, '#ffc890', 7) + gloom(u, 100, 70, 0, 10, .35) + gloom(u, 100, 60, 100, 0, .3) + gloom(u, 100, 120, 100, 280, .55);
    return [bg, mid + fg + air];
  } };

/** The gun from behind and a little above (after pritselnyy-ogon.cjs gun(), scaled, without the quadrant): a truck
 *  carriage — the oak cheeks stepped down towards us, the transom, the bed and the quoin, the axletrees and four low
 *  trucks; the barrel from its breech (base ring, cascabel) running away out through the port; the breeching. */
function gun(u, L) {
  const { Y0, Y1, S } = GUN;
  const P = (X, Y, Z) => { const yg = lerp(Y0, Y1, Z), k = (yg - HZ) / (Y0 - HZ); return [VX + X * S * k, yg - Y * S * k]; };
  const iron = L.ramp('iron', VX, 100), rp = L.ramp('rope', VX, 110);
  let s = K.contactShadow(u, VX, Y0 + 1, 60, L, { ry: 3, opacity: .7 });
  const box = (x0, x1, y0, y1, z0, z1, seed, skip = {}) => {
    const F = [];
    if (!skip.top) F.push({ pts: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], n: 'top', grain: [0, -1] });
    const cx = (x0 + x1) / 2;
    if (cx > .5) F.push({ pts: [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], n: 'left', grain: [0, -1] });
    else if (cx < -.5) F.push({ pts: [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], n: 'right', grain: [0, -1] });
    F.push({ pts: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], n: 'front', grain: [1, 0] });
    return K.shadeBox(u, F, L, 'oak', { seed, outline: .45 });
  };
  const truck = (X, Z, r, th, seed) => { const c = P(X, r, Z), k = (lerp(Y0, Y1, Z) - HZ) / (Y0 - HZ), w = th * S * k, h = r * S * k, oak = L.ramp('oak', c[0], c[1]);
    return K.shadeBox(u, [{ pts: [[c[0] - w / 2, c[1] - h * .96], [c[0] + w / 2, c[1] - h * .96], [c[0] + w / 2, c[1] + h], [c[0] - w / 2, c[1] + h]], n: 'front', grain: [0, 1] }], L, 'oak', { seed, outline: .4 })
      + `<ellipse cx="${f(c[0])}" cy="${f(c[1] - h * .96)}" rx="${f(w / 2)}" ry="${f(w * .22)}" fill="${oak.lit}" stroke="${oak.outline}" stroke-width=".35"/>`
      + `<path d="M${f(c[0] - w / 2)} ${f(c[1] + h * .3)}h${f(w)}M${f(c[0] - w / 2)} ${f(c[1] - h * .35)}h${f(w)}" stroke="${oak.shadow}" stroke-width=".4" opacity=".7"/>`
      + K.shadeSphere(u, c[0], c[1] - h * .1, w * .28, L, 'iron', { outline: .3 }); };
  s += box(-9.4, 9.4, 2.2, 4.4, .78, .9, 11, { top: true });
  for (const sx of [-1, 1]) s += truck(sx * 11, .84, 3, 3, 20 + sx);
  // the barrel's chase runs away from us out of the port (drawn before the cheeks, it lies between them)
  { const z1 = 1.4, a = P(0, 13, z1), b = P(0, 13, .02), ka = (lerp(Y0, Y1, z1) - HZ) / (Y0 - HZ);
    s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 5.4 * S, L, 'iron', { r1: 3.4 * S * ka, r2: 5.4 * S, ell: .3, outline: .5 });
    s += `<ellipse cx="${f(a[0])}" cy="${f(a[1])}" rx="${f(3.9 * S * ka)}" ry="${f(1.4 * S * ka)}" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".4"/>`;
    for (const z of [.35, .7, 1.05]) { const q = P(0, 13, z), kq = (lerp(Y0, Y1, z) - HZ) / (Y0 - HZ), r = (5.4 - z * 1.6) * S * kq;
      s += `<path d="M${f(q[0] - r)} ${f(q[1])}A${f(r)} ${f(r * .35)} 0 0 0 ${f(q[0] + r)} ${f(q[1])}" stroke="${iron.shadow}" stroke-width="1" fill="none"/><path d="M${f(q[0] - r)} ${f(q[1] - .7)}A${f(r)} ${f(r * .35)} 0 0 0 ${f(q[0] + r)} ${f(q[1] - .7)}" stroke="${iron.lit}" stroke-width=".5" fill="none" opacity=".7"/>`; }
    // the sunset along the top of the barrel, from the port; the brazier's orange on its right flank
    s += `<path d="M${P2(P(-.6, 13 + 5.2, .1))}L${P2(P(-.4, 13 + 3.6, 1.3))}" stroke="#ffd0a0" stroke-width="1" opacity=".5" stroke-linecap="round"/>`
      + `<path d="M${P2(P(4.9, 13 + 1, .1))}L${P2(P(3.2, 13 + .6, 1.3))}" stroke="#ff8a3a" stroke-width="1.1" opacity=".55" stroke-linecap="round"/>`; }
  const cas = P(0, 13, -.1), rb = [[PORT[0] - 7, PORT[3] - 4], [PORT[2] + 7, PORT[3] - 4]];
  const rope = d => `<path d="${d}" stroke="${rp.outline}" stroke-width="1.8" fill="none"/><path d="${d}" stroke="${rp.core}" stroke-width="1.05" fill="none"/><path d="${d}" stroke="${rp.lit}" stroke-width=".4" fill="none" opacity=".6" transform="translate(0 -.4)"/>`;
  s += rope(`M${P2(rb[1])}Q${f(cas[0] + 26)} ${f(cas[1] + 4)} ${f(cas[0] + 3)} ${f(cas[1] + 3.4)}`);
  for (const sx of [-1, 1]) {
    const xi = sx * 5.4, xo = sx * 9.6, x0 = Math.min(xi, xo), x1 = Math.max(xi, xo);
    s += box(x0, x1, 1.6, 12.6, .62, 1, 3 + sx) + box(x0, x1, 1.6, 10, .32, .62, 5 + sx) + box(x0, x1, 1.6, 7.4, 0, .32, 7 + sx);
    for (const [Y, Z] of [[3.4, 0], [5.8, 0], [8.6, .32], [11, .62]]) { const b = P((x0 + x1) / 2, Y, Z); s += K.shadeSphere(u, b[0], b[1], .5 * S * .6, L, 'iron', { outline: .25 }); }
    { const a = P(x0 - .2, 12.9, .62), b = P(x1 + .2, 12.9, .8); s += `<rect x="${f(a[0])}" y="${f(b[1] - 1.4)}" width="${f(b[0] - a[0])}" height="${f(a[1] - b[1] + 2)}" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".35"/>`; }
  }
  s += box(-5.4, 5.4, 1.6, 5.2, .34, .5, 9) + box(-4.6, 4.6, 5.2, 6.6, .05, .4, 13) + box(-2.8, 2.8, 6.6, 8.2, -.02, .2, 15);
  { const a = P(0, 7.4, -.02), b = P(0, 7.4, -.16); s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.4, L, 'oak', { r1: 1.4, r2: 1.7, ell: .6, face: 2, outline: .35 }); }
  s += box(-12.8, 12.8, 1.6, 3.4, .04, .16, 17, { top: false });
  for (const sx of [-1, 1]) s += truck(sx * 11.6, .08, 2.8, 3.4, 30 + sx);
  { const c = P(0, 13, 0), r = 5.4 * S;
    s += K.shadeSphere(u, c[0], c[1], r, L, 'iron', { outline: .5 });
    s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="none" stroke="${iron.outline}" stroke-width=".8"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .78)}" fill="none" stroke="${iron.lit}" stroke-width=".5" opacity=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .66)}" fill="none" stroke="${iron.shadow}" stroke-width=".7" opacity=".8"/>`
      + `<path d="M${f(c[0] - r * .9)} ${f(c[1] - r * .42)}A${f(r)} ${f(r)} 0 0 1 ${f(c[0] + r * .9)} ${f(c[1] - r * .42)}" stroke="#ffc890" stroke-width=".8" fill="none" opacity=".55"/>`; }
  s += rope(`M${P2(rb[0])}Q${f(lerp(rb[0][0], cas[0] - 3, .5))} ${f(lerp(rb[0][1], cas[1] + 3.4, .5) + 2.2)} ${f(cas[0] - 3)} ${f(cas[1] + 3.4)}`);
  s += K.shadeSphere(u, cas[0], cas[1] + .4, 3.6, L, 'iron', { outline: .45 }) + `<path d="M${f(cas[0] - 3.2)} ${f(cas[1] + 3.2)}Q${f(cas[0])} ${f(cas[1] + 5)} ${f(cas[0] + 3.2)} ${f(cas[1] + 3.2)}" stroke="${rp.outline}" stroke-width="1.8" fill="none"/><path d="M${f(cas[0] - 3.2)} ${f(cas[1] + 3.2)}Q${f(cas[0])} ${f(cas[1] + 5)} ${f(cas[0] + 3.2)} ${f(cas[1] + 3.2)}" stroke="${rp.core}" stroke-width="1.05" fill="none"/>`;
  return s;
}
