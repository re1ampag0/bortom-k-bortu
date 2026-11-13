// «Греческий огонь» (Месть королевы Анны, ЗАРЯД: этот Залп наносит +1 урон и ставит на цель Пожар), refined from the
// first-round scene (portrait-revenge.cjs SCENES['Греческий огонь']): the same idea — a clay pot of fire flying big
// across the picture on a trail of flame and smoke, burning drops falling from it and still burning on the sea, the
// enemy beyond. After the brief: the pot leaves the gun of the Revenge (her bow and crimson foresails at the left
// edge, the flash and smoke at her bow port), and a pot before it has already struck the Company ship: fire licks her
// wet side, the water poured over the rail only hisses into steam — the fire that water does not put out.
// Fixed against the first round: the pot was a flat sausage with a paper label flying sideways — now a round-bellied
// clay pot with a neck, throwing rings, a painted band and a cord, the burning rag in its neck, its flame streaming back
// into the trail; the enemy was a tinted sprite — now the kit's Endeavour against the setting sun; the burning patch was
// a band of flat tongues — now separate fires on the water where the drops fell, each with its reflection; the light
// was a red wash — now the fire lights the pot, the smoke, the water and both hulls.
// Light: the sun on the horizon behind the enemy (key, contre-jour, weak), the fire of the pot (the main light of the
// picture: it lights the Revenge's crimson foresails — her own point light), the fire on her side, the flash at the port.
'use strict';
const K = require('../kit/index.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;

const HZ = 104;
const POT = { x: 98, y: 58, r: 13.5, a: -150 };            // the pot: its middle, belly radius, the neck's direction (deg)
const MZ = { x: 22, y: 120 };                               // the Revenge's bow port: where the pot came from
const REV = { kind: 'revenge', x: -22, y: 131, scale: 1.3, flip: true, sails: 'full', seed: 7 };
const EN = { kind: 'endeavour', x: 160, y: 113, scale: .6, sails: 'full', seed: 4 };
const HIT = { x: 150, y: 104 };                             // the fire on her side
const light = { time: 'dusk', haze: .3, key: { type: 'sun', x: 166, y: 101, color: '#ff9a5a', power: .55 }, fill: { color: '#6e4a70', power: .42 },
  rim: { az: 30, color: '#ffc890', power: .5 },
  locals: [{ x: POT.x, y: POT.y, color: '#ffa040', power: .9, radius: 60 }, { x: HIT.x, y: HIT.y, color: '#ff8a2a', power: .8, radius: 36 }, { x: MZ.x, y: MZ.y, color: '#ffb050', power: .6, radius: 30 }] };
const skel = { horizon: HZ, eye: 6, light: 'the fire of the pot (main); the sun on the horizon behind the enemy; her burning side; the flash at the bow port', items: [
  ['pot', POT.x - 14, POT.y + 14, 28, 28, 'in the air: the top of its arc'],
  ['trail', MZ.x, MZ.y, 80, 72, 'from the Revenge\'s bow port up to the pot'],
  ['revenge', -40, REV.y, 120, 124, 'water: her bow at the left edge, crimson foresails'],
  ['enemy', 108, EN.y, 92, 58, 'water: broadside, against the sun'],
  ['hit fire', HIT.x - 12, HIT.y + 6, 26, 22, 'her side under the rail'],
  ['fires on the sea', 92, 116, 50, 10, 'water, under the arc']] };

// the arc of the shot: a parabola from the port through the pot (its top) on down towards her side
const arc = t => { const x = MZ.x + (POT.x - MZ.x) * t, k = (x - POT.x) / (POT.x - MZ.x); return [x, POT.y + (MZ.y - POT.y) * k * k]; };

// a clay fire-pot (KIT-CANDIDATE): a round belly, a short neck along `a` (deg, screen), throwing rings across the
// axis, a black painted band with a zigzag, a cord round the neck, a rag stuffed in it. Lit by its own fire from the
// neck's side, the sun's rim on the far side. Returns { svg, mouth: [x, y] }
function firePot(u, L, o) {
  const { x, y, r } = o, a = o.a * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const P = (px, py) => [x + ca * px - sa * py, y + sa * px + ca * py], pt = (px, py) => P(px, py).map(f).join(' ');
  // the outline in the pot's own axes: +x to the mouth; the belly a circle, the shoulder runs into the neck
  const nw = r * .36, nx = r * 1.42, lip = r * .46;
  const d = `M${pt(nx, -nw)}C${pt(r * 1.08, -nw)} ${pt(r * .95, -r * .72)} ${pt(r * .5, -r * .93)}`
    + `C${pt(-r * .2, -r * 1.12)} ${pt(-r * 1.06, -r * .74)} ${pt(-r * 1.04, 0)}`
    + `C${pt(-r * 1.06, r * .74)} ${pt(-r * .2, r * 1.12)} ${pt(r * .5, r * .93)}`
    + `C${pt(r * .95, r * .72)} ${pt(r * 1.08, nw)} ${pt(nx, nw)}Z`;
  const id = nid('pb', u), cl = nid('pc', u), hl = nid('ph', u), sh = nid('ps', u);
  const lit = P(r * .55, -r * .2);                          // the fire is behind the mouth: the light comes from there
  let s = `<defs>${radGrad(id, lit[0], lit[1], r * 2.3, [[0, '#ffc488'], [.22, '#e88a4a'], [.48, '#b24e24'], [.78, '#5e2410'], [1, '#2a0e06']])}<clipPath id="${cl}"><path d="${d}"/></clipPath>`
    + `${radGrad(hl, lit[0], lit[1], r * .9, [[0, '#fff0c8', .85], [1, '#fff0c8', 0]])}${linGrad(sh, ...P(0, -r), ...P(0, r), [[0, '#000', 0], [.6, '#000', 0], [1, '#000', .35]])}</defs>`;
  s += `<path d="${d}" fill="url(#${id})"/>`;
  s += `<g clip-path="url(#${cl})">`;
  // the painted band (a little past the middle towards the mouth) with its zigzag and dots
  const band = (c0, c1, col, w) => `<path d="M${pt(c0, -r * 1.2)}Q${pt(c0 + r * .14, 0)} ${pt(c0, r * 1.2)}L${pt(c1, r * 1.2)}Q${pt(c1 + r * .14, 0)} ${pt(c1, -r * 1.2)}Z" fill="${col}" opacity="${w}"/>`;
  s += band(r * .08, r * .34, '#1e0a04', .9);
  { let z = ''; for (let i = 0; i <= 8; i++) { const py = -r * .95 + i * r * .2375, px = r * (.21 + .05 * Math.cos(py / r * 1.4)) + (i % 2 ? -r * .07 : r * .07); z += (i ? 'L' : 'M') + pt(px + r * .04 * (1 - Math.abs(py / r)), py); }
    s += `<path d="${z}" stroke="#e8b060" stroke-width="${f(r * .05)}" fill="none" opacity=".9"/>`; }
  for (const py of [-.62, -.2, .2, .62]) { const c = P(r * -.12 + r * .07 * (1 - Math.abs(py)), py * r); s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .045)}" fill="#e8b060" opacity=".8"/>`; }
  // the throwing rings: shallow ridges across the axis, a light edge towards the fire and a dark one behind
  for (const c of [-.62, -.36, .58, .82]) { const w = Math.sqrt(Math.max(0, 1 - c * c)) * 1.02;
    s += `<path d="M${pt(c * r, -w * r)}Q${pt(c * r + r * .16, 0)} ${pt(c * r, w * r)}" stroke="#ffcf98" stroke-width="${f(r * .035)}" fill="none" opacity=".45"/>`
      + `<path d="M${pt(c * r - r * .05, -w * r)}Q${pt(c * r + r * .11, 0)} ${pt(c * r - r * .05, w * r)}" stroke="#2a0c04" stroke-width="${f(r * .04)}" fill="none" opacity=".5"/>`; }
  // the hot glaze highlight towards the fire, the shade at the bottom, the sun's rim along the far edge
  s += `<path d="${d}" fill="url(#${hl})"/><path d="${d}" fill="url(#${sh})"/>`;
  s += `<path d="M${pt(-r * .2, r * 1.04)}C${pt(-r * .9, r * .8)} ${pt(-r * 1.08, r * .2)} ${pt(-r * .96, -r * .4)}" stroke="#ffd8a0" stroke-width="${f(r * .09)}" fill="none" opacity=".55"/>`;
  s += `</g>`;
  // a burning trickle down the shoulder where the liquid spilled from the mouth
  s += `<path d="M${pt(nx - r * .1, -nw)}Q${pt(r * .9, -r * .7)} ${pt(r * .35, -r * .86)}" stroke="#ff9a2a" stroke-width="${f(r * .1)}" fill="none" stroke-linecap="round" opacity=".9"/><path d="M${pt(nx - r * .1, -nw)}Q${pt(r * .9, -r * .7)} ${pt(r * .4, -r * .84)}" stroke="#fff0b0" stroke-width="${f(r * .04)}" fill="none" stroke-linecap="round"/>`;
  // the lip: a thick rolled ring seen at a slant, the cord wound three times under it, its loose end
  const lp = P(nx, 0), ls = nid('pl', u);
  s += `<defs>${linGrad(ls, ...P(nx, -lip), ...P(nx, lip), [[0, '#ffbe80'], [.5, '#a84a20'], [1, '#3a1206']])}</defs>`;
  for (let i = 0; i < 3; i++) { const cx = nx - r * (.22 + i * .12); s += `<path d="M${pt(cx, -nw * 1.08)}Q${pt(cx + r * .08, 0)} ${pt(cx, nw * 1.08)}" stroke="${i % 2 ? '#8a6a3a' : '#c8a060'}" stroke-width="${f(r * .1)}" fill="none"/>`; }
  s += `<path d="M${pt(nx - r * .3, nw)}q${f(-sa * r * .3 + ca * -r * .2)} ${f(ca * r * .3 + sa * -r * .2)} ${f(-sa * r * .5 - ca * r * .5)} ${f(ca * r * .5 - sa * r * .5)}" stroke="#a08050" stroke-width="${f(r * .07)}" fill="none" stroke-linecap="round"/>`;
  s += `<ellipse cx="${f(lp[0])}" cy="${f(lp[1])}" rx="${f(r * .16)}" ry="${f(lip)}" transform="rotate(${f(o.a)} ${f(lp[0])} ${f(lp[1])})" fill="url(#${ls})"/>`;
  // the rag in the mouth: a bunched cloth, charred and glowing at its end
  const rg = P(nx + r * .22, 0);
  s += `<path d="M${pt(nx + r * .02, -nw * .8)}Q${pt(nx + r * .3, -nw * 1.1)} ${pt(nx + r * .48, -nw * .3)}Q${pt(nx + r * .56, nw * .4)} ${pt(nx + r * .3, nw * .9)}Q${pt(nx + r * .1, nw)} ${pt(nx + r * .02, nw * .8)}Z" fill="#5a3418"/>`
    + `<path d="M${pt(nx + r * .3, -nw * .9)}Q${pt(nx + r * .5, 0)} ${pt(nx + r * .3, nw * .9)}" stroke="#ffb040" stroke-width="${f(r * .08)}" fill="none"/>`;
  return { svg: s, mouth: P(nx + r * .4, 0), rag: rg };
}

// a fire floating on the sea: a low ragged flame on a burning slick, its broken reflection under it (KIT-CANDIDATE)
function seaFire(u, L, o) {
  const R = rng(o.seed || 1), { x, y, w, h } = o;
  let s = `<ellipse cx="${f(x)}" cy="${f(y + .4)}" rx="${f(w * .9)}" ry="${f(w * .14)}" fill="#ff8a2a" opacity=".55"/>`;
  for (let i = 0; i < 6; i++) { const yy = y + 1.4 + i * (1.2 + i * .35), ww = w * (.8 - i * .1) * (.7 + R() * .5), xx = x + (R() - .5) * w * .4;
    s += `<path d="M${f(xx - ww / 2)} ${f(yy)}h${f(ww)}" stroke="${i < 2 ? '#ffd070' : '#ff8a2a'}" stroke-width="${f(.9 - i * .1)}" opacity="${f(.8 - i * .12)}" stroke-linecap="round"/>`; }
  s += K.fire(u, { x, y, w, h, seed: o.seed || 1, wind: o.wind || -.3, glow: false, pool: false });
  s += K.localGlow(u, { x, y, color: '#ff9a3a', power: .55, radius: w * 3 }, { squash: .3, core: false });
  return s;
}

module.exports = { name: 'Греческий огонь', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 6 });
    // a late, deep-red sunset: the fire, not the sky, is the brightest thing in the picture
    L.pal = Object.assign({}, L.pal, { sky: ['#140a16', '#3e1420', '#94341e', '#e0702e'], sea: ['#b05432', '#401a22', '#120810'], cloudLit: '#e07848', cloudShade: '#3a1a28' });
    const R = rng(23);
    // ——— the sunset: the sun on the horizon behind her, bands of cloud lit from below, the sea with its path
    let bg = K.sky(u, L, { horizon: HZ, stars: 12, seed: 5 }) + K.sunMoon(u, L, { r: 8 });
    for (const [x, y, w, h, sd, fr] of [[120, 20, 90, 9, 3, .1], [40, 40, 70, 7, 8, .3], [176, 74, 56, 6, 5, .45], [96, 88, 60, 4, 11, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .5, seed: 6, glitter: light.key.x });

    // ——— the enemy against the sun: the kit's Endeavour broadside, bow to the left, towards the Revenge
    bg += K.ship(u, L, Object.assign({ wake: true, reflect: true, lights: true }, EN));
    // ——— the pot before this one struck her: a charred patch on her side, fire licking up the wet planks and over the
    // rail, a sheet of water poured over the rail onto it — steam, and the fire burns on
    { const { x, y } = HIT;
      bg += `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="9" ry="4.6" fill="#120604" opacity=".75"/>`
        + Array.from({ length: 9 }, () => `<circle cx="${f(x + (R() - .5) * 14)}" cy="${f(y + (R() - .3) * 6)}" r="${f(.3 + R() * .4)}" fill="#ffb040"/>`).join('');
      bg += K.localGlow(u, { x, y: y - 2, color: '#ff8a2a', power: .7, radius: 26 }, { squash: .8, core: false });
      bg += K.fire(u, { x: x - 2, y: y + 4, w: 10, h: 15, seed: 4, wind: -.35, glow: false, pool: false }) + K.fire(u, { x: x + 6, y: y + 2, w: 6, h: 10, seed: 9, wind: -.4, glow: false, pool: false })
        + K.fire(u, { x: x - 8, y: y + 5, w: 5, h: 7, seed: 13, wind: -.3, glow: false, pool: false });
      // the water: a pale sheet from the rail breaking into drops over the flames
      const wg = nid('ww', u);
      bg += `<defs>${linGrad(wg, 0, y - 6, 0, y + 6, [[0, '#dfe8ee', .85], [1, '#dfe8ee', .1]])}</defs><path d="M${f(x + 3)} ${f(y - 5.6)}q2.4 3 1 7.4q-1.6 2.6 -3.4 4.4q1.4 -3 .6 -5.4q-.6 -3 1.8 -6.4z" fill="url(#${wg})"/>`
        + Array.from({ length: 10 }, () => { const dx = x + 1 + (R() - .5) * 7, dy = y + 1 + R() * 7; return `<path d="M${f(dx)} ${f(dy)}l${f(-.2)} ${f(.9 + R())}" stroke="#e6eef2" stroke-width=".45" opacity=".75" stroke-linecap="round"/>`; }).join('');
      // steam (pale, hissing up where the water meets the fire) and the black smoke of the fire beside it
      const Ls = Object.assign({}, L, { pal: Object.assign({}, L.pal, { smoke: '#efe6e0' }) });
      bg += K.smoke(u, L, { x: x - 4, y: y - 6, w: 22, h: 36, wind: -.7, seed: 12, opacity: .8, glow: { color: '#ff8a2a', power: .6 } });
      bg += K.smoke(u, Ls, { x: x + 3, y: y - 3, w: 14, h: 18, wind: -.4, seed: 15, opacity: .6 }); }

    // ——— the Revenge at the left edge: her bow and crimson foresails, the flash and smoke at her bow port
    // her canvas is lit by the fire in front of her (the pot, the flash), not by the sun behind the enemy
    const Lr = K.makeLight({ time: 'dusk', haze: .3, key: { type: 'point', x: POT.x - 10, y: POT.y + 10, h: 14, gy: 120, color: '#ff9a48', power: .95, radius: 150, z: .45 },
      fill: { color: '#4a2a40', power: .4 }, rim: { az: 60, color: '#ffc080', power: .4 } }, { horizon: HZ, eye: 6 });
    Lr.pal = L.pal;
    let rev = K.ship(u, Lr, Object.assign({ wake: true, reflect: true, lights: true }, REV));
    rev += K.localGlow(u, { x: MZ.x + 4, y: MZ.y - 6, color: '#ff9a3a', power: .55, radius: 34 }, { core: false });
    rev += K.muzzleFlash(u, { x: MZ.x, y: MZ.y, dir: -38, len: 22, seed: 1, smoke: false });
    rev += K.smoke(u, L, { x: MZ.x + 6, y: MZ.y - 4, w: 30, h: 34, wind: -.5, seed: 21, opacity: .85, glow: { color: '#ffa040', power: .8 } });

    // ——— the trail: old smoke along the arc from the port, thickening and darker the older it is; nearer the pot it
    // is fire — an orange streak with a yellow core, sparks shed behind
    let trail = '';
    { const tb = nid('tb', u), tf = nid('tf', u);
      trail += `<defs><filter id="${tb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.05"/></filter><filter id="${tf}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".8"/></filter></defs>`;
      let puffs = '', lit = '';
      for (let i = 0; i < 34; i++) { const t = .04 + i / 34 * .86, [px, py] = arc(t), rr = 1.5 + (1 - t) * 4.6 + R() * 1.1, jx = (R() - .5) * 1.6 * (1 - t), jy = (R() - .5) * 1.6 * (1 - t) - (1 - t) * 3;
        puffs += `<circle cx="${f(px + jx)}" cy="${f(py + jy)}" r="${f(rr)}" fill="${mix('#4a3430', '#2a1814', t)}" opacity="${f(.38 + t * .4)}"/>`;
        lit += `<circle cx="${f(px + jx + .6)}" cy="${f(py + jy + rr * .35)}" r="${f(rr * .6)}" fill="#ff8a3a" opacity="${f(.12 + t * t * .5)}"/>`; }
      trail += `<g filter="url(#${tb})">${puffs}${lit}</g>`;
      const pts = Array.from({ length: 13 }, (_, i) => arc(.58 + i / 12 * .4)), line = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
      trail += `<g filter="url(#${tf})"><path d="${line}" stroke="#c83a10" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>`
        + `<path d="M${pts.slice(5).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="#ff9a2a" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".95"/>`
        + `<path d="M${pts.slice(9).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="#fff0b0" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
      for (let i = 0; i < 26; i++) { const t = .4 + R() * .55, [px, py] = arc(t), d = (R() - .5) * 12; trail += `<circle cx="${f(px + (R() - .5) * 6)}" cy="${f(py + d)}" r="${f(.25 + R() * .45)}" fill="${R() > .5 ? '#ffd98a' : '#ff9a3a'}"/>`; } }

    // ——— the pot: its rag burning, the flame streaming back into the trail; burning drops falling from its mouth
    const pot = firePot(u, L, POT);
    let flame = '';
    { const [mx, my] = pot.mouth;
      flame += K.localGlow(u, { x: mx - 3, y: my - 1, color: '#ffa040', power: .85, radius: 46 }, { core: false });
      // the flame of the rag along the neck's direction, bent back by the rush of air
      flame += `<g transform="rotate(${f(POT.a + 90)} ${f(mx)} ${f(my)})">${K.fire(u, { x: mx, y: my + 2, w: 11, h: 30, seed: 5, wind: -.3, glow: false, pool: false })}</g>`; }
    let drops = '';
    for (const [x, y, r, sd] of [[104, 78, 1.5, 1], [110, 87, 1.2, 2], [98, 92, 1.3, 3], [116, 97, .9, 4], [104, 101, .8, 5]]) {
      drops += `<path d="M${x} ${y}q${f(-r * .6)} ${f(-r * 3)} ${f(-r * .2)} ${f(-r * 5.4)}" stroke="#ff8a2a" stroke-width="${f(r * 1.1)}" fill="none" stroke-linecap="round" opacity=".75"/>`
        + `<circle cx="${x}" cy="${y}" r="${f(r)}" fill="#ffd070"/><circle cx="${x}" cy="${y}" r="${f(r * .45)}" fill="#fffbe6"/>` + K.localGlow(u, { x, y, color: '#ff9a3a', power: .55, radius: r * 5 }, { core: false }); }

    // ——— where the earlier drops fell: fires floating on the sea between the ships, each with its reflection
    let sea = '';
    for (const [x, y, w, h, sd] of [[96, 110, 8, 8, 2], [112, 112.5, 11, 11, 6], [126, 109.4, 6, 6, 8], [86, 114, 5, 5, 11]]) sea += seaFire(u, L, { x, y, w, h, seed: sd });
    sea += K.localGlow(u, { x: 106, y: 113, color: '#ff8a2a', power: .5, radius: 40 }, { squash: .25, core: false });
    // the pot's light on the water under it, and on the smoke
    sea += K.localGlow(u, { x: POT.x, y: 112, color: '#ffa040', power: .35, radius: 50 }, { squash: .22, core: false });

    // the sea darkens under the glass
    let dark = '';
    { const g = nid('dk', u); dark += `<defs>${linGrad(g, 0, 140, 0, 290, [[0, '#120610', 0], [1, '#120610', .55]])}</defs><rect x="0" y="140" width="200" height="150" fill="url(#${g})"/>`; }
    // the edges of the evening close in round the fire
    { const g = nid('vg', u); dark += `<defs>${radGrad(g, POT.x, POT.y + 20, 150, [[0, '#0a0408', 0], [.45, '#0a0408', 0], [1, '#0a0408', .6]])}</defs><rect x="0" y="0" width="200" height="290" fill="url(#${g})"/>`; }
    return [bg, sea + rev + trail + drops + pot.svg + flame + dark];
  } };
