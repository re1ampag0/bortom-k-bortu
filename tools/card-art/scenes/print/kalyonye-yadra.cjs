// «Калёные ядра» (Месть королевы Анны, ЗАРЯД: если на цели есть Пожар, этот Залп наносит +2 урона), refined from the
// first-round scene (portrait-revenge.cjs SCENES['Калёные ядра']): the Revenge's gun deck at sunset. An iron brazier
// on three legs glows with coals, the shot lies in them red-hot; the gunner's gauntleted hand (from the right) lifts
// one ball with the long tongs. Behind, the gun stands breech-first at the open port, its muzzle glowing and hissing
// steam (the hot shot is already in); out there, through the port, the enemy already burns against the sunset.
// Fixed against the first round: the wall was flat with a picture-like window — now a room in 2.5D (the ship's side
// facing us, painted red inside as on the Revenge, deck beams overhead, the deck running to one vanishing point at eye
// level); the gun was a flat badge — now a truck carriage with the barrel running out of the port; the
// brazier was a flat bowl with balls lying on top — now a bowl in perspective with the coals heaped in it and the
// shot sunk in them; the arm was a stiff tube — now one linen sleeve from the shoulder through the elbow, a leather gauntlet
// whose fingers close round the tongs; the enemy was a sprite with two flames — now the kit's Endeavour hull-up with
// fire on her deck and the smoke drifting.
// Fixed against the previous draft: the gun from straight behind stood its barrel up like a stove pipe — now it is
// built in 3D and turned 35°, the barrel running diagonally away to the port (whose sill is now at the gun's height),
// with real proportions (a slimmer barrel, trucks as big as the breech); the breeching ropes that read as a rammer
// across the breech are gone (the rammer leans on the wall left), so are the brazier's hook-like ring handles.
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
const PORT = [60, 44, 126, 98];             // the port in the side: x0 y0 x1 y1 (its sill at the gun's height)
// the gun in 3D: S — picture units per gun unit at depth 0, D0 — the eye's distance to there, E — the eye's height
// over the deck; the gun stands at (gx, gd), turned yaw° so its muzzle goes away to the right, out through the port
const GUN = { S: 2.15, D0: 41.4, E: (140 - HZ) / 2.15, gx: -16, gd: 6, yaw: 35 };
const BR = { x: 151, y: 101, rx: 30 };      // the brazier: the middle of its rim, its half-width
const BALL = [141, 83], BR_R = 5;           // the ball in the tongs, the radius of the shot
const light = { time: 'dusk', haze: .35, key: { type: 'point', x: BR.x, y: BR.y - 4, h: .8, gy: 130, color: '#ff9440', power: 1, radius: 110, z: .2 },
  fill: { color: '#5a3a5a', power: .32 }, locals: [{ x: VX, y: 60, color: '#ffb070', power: .4, radius: 60 }] };
const lightOut = { time: 'dusk', haze: .45, key: { type: 'sun', x: 116, y: 58, el: 4, color: '#ffb070', power: .95 }, fill: { color: '#6e4a70', power: .42 } };
const skel = { horizon: HZ, eye: 1.5, light: 'the brazier, low right (key, orange point) + the sunset through the port (from the depth)', items: [
  ['ship side', -10, WB, 220, WB - WT, 'the deck / the deck beams'], ['port', 60, 98, 66, 54, 'ship side'],
  ['enemy', 62, 76, 32, 34, 'the sea outside: her waterline y 76'], ['gun', 50, 138, 56, 52, 'deck, in 3/4; the barrel out through the port'],
  ['brazier', 118, 134, 66, 42, 'deck, three legs'], ['tongs+ball', 136, 90, 44, 22, 'the gunner\'s hand'], ['arm', 166, 104, 44, 50, 'from the right edge (shoulder off the frame)'],
  ['tub', 12, 134, 30, 22, 'deck'], ['shot pile', 18, 121, 24, 14, 'deck']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, t) => [lerp(p[0], VX, t), lerp(p[1], HZ, t)];   // a point moved into the depth, towards the VP
const LEATHER = { lit: '#8e5c32', half: '#5a361c', core: '#4a2c16', shadow: '#22120a', outline: '#0e0604' };
const SHIRT = { lit: '#f4dcbc', half: '#c49e78', shadow: '#5e4030', outline: '#24140a' };   // a linen sleeve: it reads against the red wall

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
    { const sx = 76, sy = 76, sc = .32;
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
    const G = gun(u, L);
    let mid = G.svg;
    { const mz = G.muzzle;
      mid += glow(u, mz[0], mz[1] - 1, 16, 10, '#ff8a30', .55) + `<ellipse cx="${f(mz[0])}" cy="${f(mz[1] - 1.6)}" rx="3.2" ry="1.4" fill="#ffb050" opacity=".75"/>`
        + K.smoke(u, Lo, { x: mz[0] + 1, y: mz[1] - 3, w: 18, h: 26, wind: .5, seed: 21, opacity: .5, glow: { color: '#ff9a50', power: .5 } }); }

    // ——— the cold shot in a garland left, the water tub with its steam (the wads are dipped) ———
    let fg = K.castShadow(u, L, { x: 30, y: 121, w: 24, h: 12, horizon: HZ }) + K.shotPile(u, L, { x: 30, y: 121, s: 1.2, n: 3, seed: 4 });
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
    { const grip = [171, 68], tg = Math.atan2(BALL[1] - grip[1], BALL[0] - grip[0]) * 180 / Math.PI;   // the tongs' direction (handles -> jaws)
      const base = { s: 2.25, m: -1, roll: 18, pitch: 14, pose: 'wrap', r: 1.05, tone: LEATHER, light: [-.55, .8], sw: .3, tilt: 4, palmW: 1.08 };
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
      // the linen sleeve from the shoulder off the right edge, the elbow down, the forearm to the gauntlet
      const w = h.wrist, sh = [228, 76], el = [207, 100];
      const arm = H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5) + 2, lerp(sh[1], el[1], .5)], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5) + 2], w],
        w: [20, 18.4, 16, 13.6, 12], tone: SHIRT, lit: -1, rim: '#ffc890', rimSide: 1, rimOp: .3, seed: 4, drapes: 1, foldW: .8, sw: .4, capA: true,
        cuff: { from: .8, k: 1.18, tone: LEATHER } });
      fg += ball + tongs;
      fg += arm + h.back + `<path d="M${P2(at(Math.hypot(BALL[0] - grip[0], BALL[1] - grip[1]) - 3, 0))}L${P2(end)}" stroke="#141010" stroke-width="2.6" stroke-linecap="round"/>` + h.front
        + K.localGlow(u, { x: BALL[0] + 6, y: BALL[1] - 2, color: '#ffb050', power: .45, radius: 26 }); }

    // ——— the air: motes in the sunset from the port, the dark round the edges ———
    const air = motes(22, 60, 40, 70, 50, '#ffc890', 7) + gloom(u, 100, 70, 0, 10, .35) + gloom(u, 100, 60, 100, 0, .3) + gloom(u, 100, 120, 100, 280, .55);
    return [bg, mid + fg + air];
  } };

/** The gun in three-quarter view: built in 3D (gun space: X across, Y up, Z forward from the carriage's rear),
 *  turned GUN.yaw° and projected to the one vanishing point, so the barrel runs diagonally away from us to the port
 *  instead of standing up like a pipe. A truck carriage: the stepped oak cheeks, the axletrees, the bed and the quoin
 *  under the breech, the transom, four solid trucks; the barrel with its reinforce rings, the base ring and the
 *  cascabel towards us, iron capsquares over the trunnions. Faces turned away from the eye are not drawn; the far
 *  side first. Returns { svg, muzzle }. */
function gun(u, L) {
  const { S, D0, E, gx, gd } = GUN, yaw = GUN.yaw * Math.PI / 180, cY = Math.cos(yaw), sY = Math.sin(yaw);
  const Wd = (X, Y, Z) => [gx + X * cY + Z * sY, Y, gd - X * sY + Z * cY];                      // gun space -> world (x, y, depth)
  const kOf = d => D0 / (D0 + d), pr = w => { const k = kOf(w[2]); return [VX + w[0] * S * k, HZ + (E - w[1]) * S * k]; };
  const P = (X, Y, Z) => pr(Wd(X, Y, Z)), scl = (X, Y, Z) => S * kOf(Wd(X, Y, Z)[2]);
  const Nw = n => [n[0] * cY + n[2] * sY, n[1], -n[0] * sY + n[2] * cY];                          // a gun-space normal in the world
  const toKit = n => { const w = Nw(n); return [w[0], w[1], -w[2]]; };                            // -> the kit's (x right, y up, z at us)
  const seen = (n, c) => { const w = Nw(n), q = Wd(...c); return w[0] * -q[0] + w[1] * (E - q[1]) + w[2] * (-D0 - q[2]) > 0; };
  const dir2 = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1; return [d[0] / l, d[1] / l]; };
  const gZ = dir2(P(0, 0, 0), P(0, 0, 10)), gX = dir2(P(0, 0, 0), P(10, 0, 0));
  const iron = L.ramp('iron', VX, 100);
  // a box in gun space: the faces we can see
  const box = (x0, x1, y0, y1, z0, z1, seed, kind = 'oak') => {
    const xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, zm = (z0 + z1) / 2, F = [];
    const add = (pts, n, c, grain) => { if (seen(n, c)) F.push({ pts: pts.map(p => P(...p)), n: toKit(n), grain }); };
    add([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], [xm, y1, zm], gZ);
    add([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], [x0, ym, zm], gZ);
    add([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], [x1, ym, zm], gZ);
    add([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], [xm, ym, z0], gX);
    add([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [xm, ym, z1], gX);
    return K.shadeBox(u, F, L, kind, { seed, outline: .45 });
  };
  // a solid truck: a disc of oak across X, its tread, the face we see, the iron linchpin
  const hull = pts => { const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = []; for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); };
  const truck = (X, Zc, r, th, seed) => {
    const sg = Math.sign(X), ring = Xf => Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return P(Xf, r + r * Math.cos(a), Zc + r * Math.sin(a)); });
    const outerSeen = seen([sg, 0, 0], [X + sg * th / 2, r, Zc]), Xv = X + (outerSeen ? 1 : -1) * sg * th / 2, Xb = X - (outerSeen ? 1 : -1) * sg * th / 2;
    const fv = ring(Xv), fb = ring(Xb), c = P(Xv, r, Zc), rp = L.ramp('oak', c[0], c[1]);
    return `<path d="M${hull(fv.concat(fb)).map(P2).join('L')}Z" fill="${rp.shadow}" stroke="${rp.outline}" stroke-width=".45"/>`
      + K.shadeBox(u, [{ pts: fv, n: toKit([outerSeen ? sg : -sg, 0, 0]), grain: gZ }], L, 'oak', { seed, outline: .45 })
      + `<path d="M${P2(P(Xv, r * 1.7, Zc - r * .7))}L${P2(P(Xv, r * .3, Zc + r * .7))}" stroke="${rp.outline}" stroke-width=".35" opacity=".6"/>`
      + K.shadeSphere(u, c[0], c[1], .9 * scl(Xv, r, Zc), L, 'iron', { outline: .3 }); };
  // the rings round the barrel: the half of each circle that faces us
  const band = (Z, r, w, col, op = 1) => { let d = '', on = false;
    for (let i = 0; i <= 36; i++) { const a = i / 36 * Math.PI * 2, n = [Math.cos(a), Math.sin(a), 0], p = P(r * n[0], 13 + r * n[1], Z), v = seen(n, [r * n[0], 13 + r * n[1], Z]);
      if (v) { d += `${on ? 'L' : 'M'}${P2(p)}`; on = true; } else on = false; }
    return `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`; };
  let s = '';
  // the shadows: the carriage's footprint, dark under it; the brazier throws the rest to the left
  { const fp = [P(-13.5, 0, -1), P(13.5, 0, -1), P(13.5, 0, 27.5), P(-13.5, 0, 27.5)], c = P(0, 0, 13);
    s += K.castShadow(u, L, { x: c[0], y: c[1], w: 44, h: 24, horizon: HZ, d: .8 }) + `<path d="M${fp.map(P2).join('L')}Z" fill="#050202" opacity=".55" filter="url(#soft${u})"/>`; }
  // the far side first: its trucks, the axletrees, the far cheek (front step first)
  s += truck(-11.6, 22.5, 4.4, 3, 21) + truck(-11.6, 2.8, 4, 3, 22);
  s += box(-12.8, 12.8, 3.4, 5.4, 21, 24, 17) + box(-12.8, 12.8, 3, 5, 1.3, 4.3, 18);
  for (const [z0, z1, h, sd] of [[16, 27, 12.6, 3], [8, 16, 10.4, 5], [0, 8, 8.4, 7]]) s += box(-9.6, -5.4, 2.6, h, z0, z1, sd);
  // between the cheeks: the transom, the bed, the quoin with its handle
  s += box(-5.4, 5.4, 3, 5.8, 11, 14.5, 9) + box(-4.6, 4.6, 5.8, 7, 1.5, 12, 13) + box(-2.8, 2.8, 7, 8.8, .6, 6, 15);
  { const a = P(0, 7.9, .6), b = P(0, 7.9, -1.4); s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.1 * scl(0, 7.9, 0), L, 'oak', { ell: .5, face: 2, outline: .35 }); }
  // the barrel: from the breech (towards us) to the muzzle out beyond the port
  const zb = 0, zm = 44, B = P(0, 13, zb), M = P(0, 13, zm);
  { const ax = Nw([0, 0, 1]), q = Wd(0, 13, zb), v = [-q[0], E - q[1], -D0 - q[2]], lv = Math.hypot(...v), ell = Math.abs(ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2]) / lv;
    s += K.shadeCyl(u, B[0], B[1], M[0], M[1], 4.2 * scl(0, 13, zb), L, 'iron', { r1: 4.3 * scl(0, 13, zb), r2: 2.8 * scl(0, 13, zm), ell, face: 1, outline: .5 });
    s += band(1.2, 4.6, 1.4, iron.outline) + band(1.6, 4.6, .5, iron.lit, .6);
    for (const [z, r] of [[9, 4.1], [18, 3.8], [30, 3.3], [42, 3.1]]) s += band(z, r + .25, 1.1, iron.shadow) + band(z + .5, r + .25, .45, iron.lit, .55);
    // the breech's face: the base ring's moulding, the sunset on the barrel's top, the brazier on its near flank
    { const c = P(0, 13, -.2), r = 4.3 * scl(0, 13, 0); s += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r * .6)}" ry="${f(r * .6 * Math.max(ell, .3))}" transform="rotate(${f(Math.atan2(gZ[1], gZ[0]) * 180 / Math.PI + 90)} ${f(c[0])} ${f(c[1])})" fill="none" stroke="${iron.shadow}" stroke-width=".6" opacity=".7"/>`; }
    s += `<path d="M${P2(P(-.5, 17, 3))}L${P2(P(-.4, 15.7, 40))}" stroke="#ffd0a0" stroke-width=".9" opacity=".45" stroke-linecap="round"/>`
      + `<path d="M${P2(P(3.5, 15.2, 3))}L${P2(P(2.4, 14.4, 40))}" stroke="#ff8a3a" stroke-width="1.1" opacity=".5" stroke-linecap="round"/>`; }
  // the cascabel: the neck and the knob towards us
  { const a = P(0, 13, -.2), b = P(0, 13, -2.6), c = P(0, 13, -3.8);
    s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.2 * scl(0, 13, -1), L, 'iron', { outline: .35 }) + K.shadeSphere(u, c[0], c[1], 1.7 * scl(0, 13, -3.8), L, 'iron', { outline: .4 }); }
  // the near cheek (front step first), the iron capsquares over the trunnions, the near trucks
  for (const [z0, z1, h, sd] of [[16, 27, 12.6, 4], [8, 16, 10.4, 6], [0, 8, 8.4, 8]]) s += box(5.4, 9.6, 2.6, h, z0, z1, sd);
  for (const sx of [-1, 1]) s += box(sx > 0 ? 5.2 : -9.8, sx > 0 ? 9.8 : -5.2, 12.6, 13.5, 21.6, 24.6, 30 + sx, 'iron');
  for (const [z, y] of [[3, 5.6], [11, 7], [20, 8.8], [24, 6.4]]) { const b = P(9.65, y, z); s += K.shadeSphere(u, b[0], b[1], .55 * scl(9.6, y, z) * .6, L, 'iron', { outline: .25 }); }
  s += truck(11.6, 22.5, 4.4, 3, 23) + truck(11.6, 2.8, 4, 3, 24);
  return { svg: s, muzzle: P(0, 13, zm) };
}
