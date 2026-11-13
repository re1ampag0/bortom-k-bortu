// «Прицельный огонь» (Индевор, ЗАРЯД: этот Залп бьёт по Пушкам цели, +1 урон, без штрафа за диагональ), refined from
// the first-round scene (portrait-endeavour.cjs SCENES['Прицельный огонь']): on the Company's gun deck we look over
// the breech of a gun along its barrel through the port; out there the enemy's black side with her ports open and her
// guns out — the target. The gunner (left, his back to us) eases the quoin under the breech; a brass quadrant stands
// on the barrel. Brief's find added (card-briefs.md): the officer in a tricorn (right, in profile) holds the thick
// open regulations and points the angle with his closed spyglass — order by the book.
// Fixed against the first round: the wall was flat and the gun a flat badge — now a room in 2.5D (the ship's side
// facing us, the deck beams overhead and the deck running to one vanishing point at eye level), the gun a truck
// carriage in perspective with its barrel running out of the port; the gunner was a blob with a stiff tube arm — now
// a figure from behind with a rolled sleeve and a fist round the quoin's handle; the port's red lid hung inside the
// room — now only its edge shows outside at the top of the opening; the spyglass lay idle on a shelf — now in the
// officer's hand. Light: daylight through the port (key, from the depth: rims on the gun and the men), a lantern
// under the beams on the left (warm fill).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, gloom, shafts, motes } = PK;

const HZ = 74, VX = 100;                    // eye level, the vanishing point
const WT = 24, WB = 126;                    // the ship's side: under the deck beams, its foot on the deck
const PORT = [54, 58, 146, 118];            // the port in the side: x0 y0 x1 y1
const GUN = { Y0: 148, Y1: WB + 1, S: 2.9 }; // the deck under the rear and the front of the carriage; the gun's scale
const LAMP = { x: 58, y: 40, s: .9, hang: 3 };
const light = { time: 'day', haze: .3, key: { type: 'point', x: 100, y: 88, h: 1, gy: WB, color: '#fff2dc', power: 1, radius: 140, z: -.25 },
  fill: { color: '#5a6a88', power: .35 }, locals: [{ x: LAMP.x, y: LAMP.y - 6, color: '#ffbe6a', power: .55, radius: 60 }] };
const lightOut = { time: 'day', haze: .3, key: { type: 'sun', az: 165, el: 34, color: '#fff4dc', power: 1 }, fill: { color: '#8db8e0', power: .5 } };
const skel = { horizon: HZ, eye: 1.6, light: 'daylight through the port (key, from the depth) + the lantern under the beams left (warm)', items: [
  ['ship side', -10, WB, 220, WB - WT, 'the deck / the deck beams'], ['port', 54, 118, 92, 60, 'ship side'],
  ['enemy hull', 54, 110.6, 92, 36, 'the sea outside: her waterline y 110.6'], ['gun', 70, GUN.Y0, 60, 42, 'deck; the barrel out through the port'],
  ['quadrant', 100, 95, 12, 12, 'the top of the barrel at the breech'], ['gunner', 0, 170, 66, 84, 'the deck in front of the gun, left'],
  ['officer', 104, 206, 96, 150, 'the deck, right, near us'], ['lantern', 53, 40, 10, 22, 'the beam overhead']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, t) => [lerp(p[0], VX, t), lerp(p[1], HZ, t)];   // a point moved into the depth, towards the VP
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const tone = (L, c, x, y) => { const k = L.keyColor; return { lit: mix(c, mix(k, '#ffffff', .3), .42), half: c, core: c, shadow: mix(c, '#0c121c', .5), outline: '#120c08' }; };
const SKIN = { lit: '#f2c69c', half: '#c98e66', core: '#b47a54', shadow: '#6e4430', outline: '#2e180c' };

module.exports = { name: 'Прицельный огонь', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(23);
    const [px0, py0, px1, py1] = PORT;
    // ——— outside, through the port: the sea, the enemy's black side close by, her ports open, guns out ———
    const oc = nid('oc', u);
    let out = K.sky(u, Lo, { horizon: HZ, stars: false }) + K.cloud(u, Lo, { x: 96, y: 66, w: 50, h: 6, seed: 4, far: .3 })
      + K.water(u, Lo, { horizon: HZ, bottom: 130, swell: .5, seed: 5, glitter: false })
      + K.ship(u, Lo, { kind: 'pearl', x: 104.8, y: 110.6, scale: 2.4, sails: 'full', seed: 6 }) + K.foam(u, { x: 100, y: 110.9, w: 100, h: 1.2, seed: 2, L: Lo });
    let bg = `<defs><clipPath id="${oc}"><rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}"/></clipPath></defs><g clip-path="url(#${oc})">${out}`
      // the lifted lid outside: its red underside and edge just showing along the top of the opening, the tackle
      + `<path d="M${px0 - 2} ${py0}L${px1 + 2} ${py0}L${px1 - 1} ${py0 + 3.6}L${px0 + 1} ${py0 + 3.6}Z" fill="#9a2a20"/><path d="M${px0} ${py0 + 3.6}H${px1}" stroke="#4a0a06" stroke-width=".8"/>`
      + `<path d="M${px0 + 8} ${py0 + 3.6}L${px0 + 4} ${py0 + 12}M${px1 - 8} ${py0 + 3.6}L${px1 - 4} ${py0 + 12}" stroke="#2a1c10" stroke-width=".5" opacity=".7"/></g>`;
    // ——— the ceiling: deck planks overhead running to the VP, two beams across ———
    { const g = nid('cl', u); bg += `<defs>${linGrad(g, 0, 0, 0, WT, [[0, '#0e0805'], [1, '#2c1a0e']])}</defs><rect x="-10" y="-2" width="220" height="${WT + 2}" fill="url(#${g})"/>`;
      for (let x = -120; x <= 320; x += 22) bg += `<path d="M${f(x)} -2L${f(lerp(x, VX, (WT + 2) / (HZ + 2)))} ${WT}" stroke="#080402" stroke-width=".7"/>`;
      for (const [y, h] of [[2, 9], [19, 5.6]]) bg += K.shadeBox(u, [{ pts: [[-10, y + h], [210, y + h], [210, y + h + h * .5], [-10, y + h + h * .5]], n: 'bottom', grain: [1, 0] }, { pts: [[-10, y], [210, y], [210, y + h], [-10, y + h]], n: 'front', grain: [1, 0] }], L, 'oak', { seed: y, outline: .5 });
      bg += `<rect x="-10" y="${WT - 1.6}" width="220" height="4" fill="#3a2414"/><path d="M-10 ${WT + 2.4}H210" stroke="#0a0502" stroke-width="1"/>`; }
    // ——— the ship's side from inside: planking with the port cut out, the thickness of the side round the port ———
    { const m = nid('pm', u), g = nid('wl', u);
      bg += `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="-10" y="0" width="220" height="160"><rect x="-10" y="0" width="220" height="160" fill="#fff"/><rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" fill="#000"/></mask>`
        + `${radGrad(g, VX, 92, 110, [[0, '#ffe8c0', .26], [.4, '#ffd8a0', .1], [1, '#ffd8a0', 0]])}</defs>`
        + `<g mask="url(#${m})">${woodTex(u, -10, WT + 2.4, 220, WB - WT - 2.4, '#5a3c24', '#2e1e10', '#0e0804', 7.6, false, 9)}<rect x="-10" y="${WT}" width="220" height="${WB - WT}" fill="url(#${g})"/></g>`;
      // the frames' knees under the beam, a breeching ringbolt either side of the port
      for (const x of [14, 186]) bg += K.shadeBox(u, [{ pts: [[x - 4, WT + 2.4], [x + 4, WT + 2.4], [x + 4, WB], [x - 4, WB]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: x, outline: .5 });
      for (const x of [px0 - 7, px1 + 7]) bg += `<circle cx="${x}" cy="${py1 - 4}" r="2.2" fill="none" stroke="#141414" stroke-width="1.1"/>` + K.shadeSphere(u, x, py1 - 6.2, 1.1, L, 'iron', { outline: .3 });
      // the thickness: four faces from the opening into the depth; the sill and the jambs catch the daylight
      const t = .1, A = [px0, py0], B = [px1, py0], C = [px1, py1], D = [px0, py1], a = toward(A, t), b = toward(B, t), c = toward(C, t), d = toward(D, t);
      bg += `<path d="M${P2(A)}L${P2(B)}L${P2(b)}L${P2(a)}Z" fill="#1c100a"/><path d="M${P2(D)}L${P2(C)}L${P2(c)}L${P2(d)}Z" fill="#c8945c"/><path d="M${P2(A)}L${P2(a)}L${P2(d)}L${P2(D)}Z" fill="#7a5030"/><path d="M${P2(B)}L${P2(b)}L${P2(c)}L${P2(C)}Z" fill="#6a4228"/>`
        + `<path d="M${P2(d)}L${P2(c)}" stroke="#ffe6b8" stroke-width=".6"/><path d="M${P2(D)}L${P2(C)}" stroke="#2a1608" stroke-width=".8"/>`
        + `<rect x="${px0 - 2.4}" y="${py0 - 2.4}" width="${px1 - px0 + 4.8}" height="${py1 - py0 + 4.8}" fill="none" stroke="#1a0c06" stroke-width="2.6"/>`
        + `<path d="M${px0 - 1} ${py1 + 1.2}H${px1 + 1}" stroke="#e8b880" stroke-width=".7" opacity=".7"/>`; }
    // ——— the deck: planks to the VP, the light of the port on it ———
    { const id = nid('fc', u); bg += `<defs><clipPath id="${id}"><rect x="-10" y="${WB}" width="220" height="${290 - WB}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: WB, bottom: 290, vx: VX, kind: 'oak', plank: 17, seed: 11 })}</g>`
      + `<path d="M-10 ${WB}H210" stroke="#0a0502" stroke-width="1.3"/>` + K.localGlow(u, { x: VX, y: WB + 8, color: '#fff0d0', power: .4, radius: 50 }, { squash: .3, core: false }); }

    // ——— the gun: a truck carriage from behind, the barrel out through the port ———
    let mid = gun(u, L);
    // the brass quadrant standing on the barrel at the breech: a quarter disc with its scale, the plumb line and bob
    { const q = [100, 95.2], r = 12, br = L.ramp('brass', q[0], q[1] - 5);
      mid += `<path d="M${P2(q)}L${f(q[0] + r)} ${f(q[1])}A${r} ${r} 0 0 0 ${f(q[0])} ${f(q[1] - r)}Z" fill="${br.half}" stroke="${br.outline}" stroke-width=".45"/>`
        + `<path d="M${f(q[0] + r * .82)} ${f(q[1])}A${f(r * .82)} ${f(r * .82)} 0 0 0 ${f(q[0])} ${f(q[1] - r * .82)}" stroke="${br.shadow}" stroke-width=".35" fill="none"/>`
        + Array.from({ length: 10 }, (_, k) => { const a = -k * Math.PI / 18, c = Math.cos(a), s = Math.sin(a); return `<path d="M${f(q[0] + c * r * .82)} ${f(q[1] + s * r * .82)}L${f(q[0] + c * r * (k % 3 ? .93 : .98))} ${f(q[1] + s * r * (k % 3 ? .93 : .98))}" stroke="${br.outline}" stroke-width=".3"/>`; }).join('')
        + `<path d="M${f(q[0] + r)} ${f(q[1])}A${r} ${r} 0 0 0 ${f(q[0])} ${f(q[1] - r)}" stroke="${br.lit}" stroke-width=".5" fill="none" opacity=".9"/>`
        + `<path d="M${f(q[0] + .6)} ${f(q[1] - .6)}L${f(q[0] + 6.4)} ${f(q[1] - 6.6)}" stroke="#1a1410" stroke-width=".3"/>` + K.shadeSphere(u, q[0] + 6.6, q[1] - 6.9, .8, L, 'brass', { outline: .2 })
        + `<path d="M${f(q[0] - 1)} ${f(q[1] + .2)}H${f(q[0] + r + 1)}" stroke="${br.outline}" stroke-width=".9"/>`; }
    // chalk marks on the left cheek: the tally of the elevation
    mid += `<path d="M77.6 131.4v4.2M79.4 131.2v4.2M81.2 131v4.2M83 130.8v4.2" stroke="#f2ece0" stroke-width=".55" opacity=".8"/>`;

    // ——— the gunner, his back to us, easing the quoin; the officer pointing with his spyglass, the book in hand ———
    const fg = gunner(u, L, R) + `<g transform="translate(0 6)">${officer(u, L, R)}</g>`;
    // ——— the lantern under the beam, daylight shafts from the port, dust, the dark round the edges ———
    let air = K.lantern(u, L, { ...LAMP, lit: true, seed: 5 }) + K.localGlow(u, { x: LAMP.x, y: LAMP.y - 7, color: '#ffc070', power: .8, radius: 22 });
    air += shafts(u, VX, 90, [[60, 290, 100, 290], [104, 290, 140, 290]], '#fff0d0', .07) + motes(26, 70, 76, 60, 50, '#fff0d0', 7)
      + gloom(u, 100, 80, 0, 20, .3) + gloom(u, 100, 80, 200, 20, .25) + gloom(u, 100, 130, 100, 280, .55);
    return [bg, mid + fg + air];
  } };

/** The gun from behind and a little above (after flot-na-gorizonte.cjs gunFromBehind, scaled): a truck carriage —
 *  the oak cheeks stepped down towards us, the transom, the bed and the quoin with its handle, the axletrees and four
 *  low trucks; the barrel from its breech (base ring, cascabel) running away out through the port; the breeching. */
function gun(u, L) {
  const { Y0, Y1, S } = GUN;
  const P = (X, Y, Z) => { const yg = lerp(Y0, Y1, Z), k = (yg - HZ) / (Y0 - HZ); return [VX + X * S * k, yg - Y * S * k]; };
  const iron = L.ramp('iron', VX, 100), rp = L.ramp('rope', VX, 110);
  let s = K.contactShadow(u, VX, Y0 + 1, 70, L, { ry: 3, opacity: .7 }) + `<ellipse cx="${VX}" cy="${f(Y0 - 4)}" rx="34" ry="10" fill="#000" opacity=".28" filter="url(#drop${u})"/>`;
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
  { const a = P(0, 13, 1.32), b = P(0, 13, .02), ka = (lerp(Y0, Y1, 1.32) - HZ) / (Y0 - HZ);
    s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 5.4 * S, L, 'iron', { r1: 3.4 * S * ka, r2: 5.4 * S, ell: .3, outline: .5 });
    { const m = P(0, 13, 1.32); s += `<ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(3.9 * S * ka)}" ry="${f(1.4 * S * ka)}" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".4"/>`; }
    for (const z of [.35, .7, 1.05]) { const q = P(0, 13, z), kq = (lerp(Y0, Y1, z) - HZ) / (Y0 - HZ), r = (5.4 - z * 1.6) * S * kq;
      s += `<path d="M${f(q[0] - r)} ${f(q[1])}A${f(r)} ${f(r * .35)} 0 0 0 ${f(q[0] + r)} ${f(q[1])}" stroke="${iron.shadow}" stroke-width="1" fill="none"/><path d="M${f(q[0] - r)} ${f(q[1] - .7)}A${f(r)} ${f(r * .35)} 0 0 0 ${f(q[0] + r)} ${f(q[1] - .7)}" stroke="${iron.lit}" stroke-width=".5" fill="none" opacity=".7"/>`; }
    // daylight along the top of the barrel, from the port
    s += `<path d="M${P2(P(-.6, 13 + 5.2, .1))}L${P2(P(-.4, 13 + 3.6, 1.3))}" stroke="#fff4dc" stroke-width="1.1" opacity=".55" stroke-linecap="round"/>`; }
  for (const sx of [-1, 1]) {
    const xi = sx * 5.4, xo = sx * 9.6, x0 = Math.min(xi, xo), x1 = Math.max(xi, xo);
    s += box(x0, x1, 1.6, 12.6, .62, 1, 3 + sx) + box(x0, x1, 1.6, 10, .32, .62, 5 + sx) + box(x0, x1, 1.6, 7.4, 0, .32, 7 + sx);
    for (const [Y, Z] of [[3.4, 0], [5.8, 0], [8.6, .32], [11, .62]]) { const b = P((x0 + x1) / 2, Y, Z); s += K.shadeSphere(u, b[0], b[1], .5 * S * .6, L, 'iron', { outline: .25 }); }
    { const a = P(x0 - .2, 12.9, .62), b = P(x1 + .2, 12.9, .8); s += `<rect x="${f(a[0])}" y="${f(b[1] - 1.4)}" width="${f(b[0] - a[0])}" height="${f(a[1] - b[1] + 2)}" fill="${iron.core}" stroke="${iron.outline}" stroke-width=".35"/>`; }
  }
  // the transom, the bed under the breech and the quoin on it, its handle towards us
  s += box(-5.4, 5.4, 1.6, 5.2, .34, .5, 9) + box(-4.6, 4.6, 5.2, 6.6, .05, .4, 13) + box(-2.8, 2.8, 6.6, 8.2, -.02, .2, 15);
  { const a = P(0, 7.4, -.02), b = P(0, 7.4, -.16); s += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.6, L, 'oak', { r1: 1.6, r2: 1.9, ell: .6, face: 2, outline: .35 }); }
  s += box(-12.8, 12.8, 1.6, 3.4, .04, .16, 17, { top: false });
  for (const sx of [-1, 1]) s += truck(sx * 11.6, .08, 2.8, 3.4, 30 + sx);
  // the breeching from the ringbolts in the side round the cascabel, the breech end with its rings and the knob
  const cas = P(0, 13, -.1), rb = [[PORT[0] - 7, PORT[3] - 4], [PORT[2] + 7, PORT[3] - 4]];
  const br = `M${P2(rb[0])}Q${f(cas[0] - 22)} ${f(cas[1] + 16)} ${f(cas[0] - 3)} ${f(cas[1] + 3.4)}M${P2(rb[1])}Q${f(cas[0] + 22)} ${f(cas[1] + 16)} ${f(cas[0] + 3)} ${f(cas[1] + 3.4)}`;
  { const c = P(0, 13, 0), r = 5.4 * S;
    s += K.shadeSphere(u, c[0], c[1], r, L, 'iron', { outline: .5 });
    s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="none" stroke="${iron.outline}" stroke-width=".8"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .78)}" fill="none" stroke="${iron.lit}" stroke-width=".5" opacity=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .66)}" fill="none" stroke="${iron.shadow}" stroke-width=".7" opacity=".8"/>`
      // the daylight rim round the top of the breech
      + `<path d="M${f(c[0] - r * .9)} ${f(c[1] - r * .42)}A${f(r)} ${f(r)} 0 0 1 ${f(c[0] + r * .9)} ${f(c[1] - r * .42)}" stroke="#fff0d0" stroke-width=".8" fill="none" opacity=".6"/>`; }
  s += `<path d="${br}" stroke="${rp.outline}" stroke-width="1.9" fill="none"/><path d="${br}" stroke="${rp.core}" stroke-width="1.1" fill="none"/><path d="${br}" stroke="${rp.lit}" stroke-width=".4" fill="none" opacity=".6" transform="translate(0 -.4)"/>`;
  s += K.shadeSphere(u, cas[0], cas[1] + .4, 4.2, L, 'iron', { outline: .45 }) + `<path d="M${f(cas[0] - 3.4)} ${f(cas[1] + 3.4)}Q${f(cas[0])} ${f(cas[1] + 5.2)} ${f(cas[0] + 3.4)} ${f(cas[1] + 3.4)}" stroke="${rp.outline}" stroke-width="1.9" fill="none"/><path d="M${f(cas[0] - 3.4)} ${f(cas[1] + 3.4)}Q${f(cas[0])} ${f(cas[1] + 5.2)} ${f(cas[0] + 3.4)} ${f(cas[1] + 3.4)}" stroke="${rp.core}" stroke-width="1.1" fill="none"/>`;
  return s;
}

/** The gunner: his back to us on the left, bent to the gun; the near (right) arm, sleeve rolled, reaches down over the
 *  cheek to the quoin's handle, the fist round it. Linen shirt, a blue waistcoat, a red kerchief, a tarred queue. */
function gunner(u, L, R) {
  const sh = tone(L, '#d8ceb8'), wc = tone(L, '#2c3e66'), kc = tone(L, '#a8382a'), rim = '#fff0d4';
  const hc = [30, 90], hr = 7.4;
  // the far (left) arm hangs on his left side, mostly hidden by his back and the glass
  let s = H.cloth(u, { spine: [[10, 104], [4, 128], [6, 156]], w: [10, 9, 8.4], tone: sh, lit: 1, rim, rimSide: 1, seed: 3, capA: true, drapes: 2 });
  // the back: the waistcoat over the shirt, the shoulders broad, narrowing to the waist; the shirt's sleeve tops
  { const g = nid('gb', u);
    const back = H.sp([[6, 104], [14, 98], [30, 97], [46, 98], [55, 104], [56, 122], [52, 150], [48, 178], [14, 178], [10, 150], [6, 124]], true);
    s += `<defs>${linGrad(g, 56, 100, 6, 130, [[0, wc.lit], [.3, wc.half], [1, wc.shadow]])}</defs><path d="${back}" fill="url(#${g})" stroke="${wc.outline}" stroke-width=".45"/>`
      + `<path d="M31 99Q30 130 31 178" stroke="${wc.shadow}" stroke-width=".7" fill="none" opacity=".8"/><path d="M14 112Q30 118 50 110M12 136Q30 142 52 134" stroke="${wc.shadow}" stroke-width=".45" fill="none" opacity=".55"/>`
      + `<path d="M46 98Q55 102 55 106L56 122" stroke="${rim}" stroke-width=".8" fill="none" opacity=".8"/>`
      // the back strap and its buckle across the waist
      + `<path d="M10 150Q30 154 52 148" stroke="${wc.shadow}" stroke-width="1.2" fill="none"/><rect x="28" y="149.4" width="4" height="2.6" fill="none" stroke="#c8a050" stroke-width=".5"/>`; }
  // the neck, the kerchief knotted round it, the back of the head with its queue
  s += `<path d="M24 96Q30 90 37 96L36 100H25Z" fill="${SKIN.shadow}" stroke="${SKIN.outline}" stroke-width=".35"/>`;
  { const g = nid('gk', u); s += `<defs>${linGrad(g, 38, 96, 20, 100, [[0, kc.lit], [1, kc.shadow]])}</defs><path d="M20 99Q30 93 40 99Q38 102 30 102Q22 102 20 99Z" fill="url(#${g})" stroke="${kc.outline}" stroke-width=".35"/>`
    + `<path d="M36 100l4 5l-2 .6l-3 -4z" fill="${kc.half}" stroke="${kc.outline}" stroke-width=".3"/>`; }
  { const g = nid('gh', u);
    s += `<defs>${radGrad(g, hc[0] + 3, hc[1] - 4, hr * 1.3, [[0, '#5a3c26'], [.55, '#2e1c10'], [1, '#140a06']])}</defs>`
      // the ear on the gun's side, the hair over the skull, the queue tied with a black ribbon
      + `<ellipse cx="${hc[0] + hr * .92}" cy="${hc[1] + 1}" rx="1.6" ry="2.6" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".3"/>`
      + `<ellipse cx="${hc[0]}" cy="${hc[1]}" rx="${hr * .92}" ry="${hr}" fill="url(#${g})" stroke="#0a0604" stroke-width=".4"/>`
      + Array.from({ length: 9 }, (_, k) => { const x = hc[0] - hr * .7 + k * hr * .17; return `<path d="M${f(x)} ${f(hc[1] - hr * .8)}Q${f(x + .4)} ${f(hc[1])} ${f(lerp(x, hc[0], .5))} ${f(hc[1] + hr * .86)}" stroke="#6a4a30" stroke-width=".3" fill="none" opacity=".6"/>`; }).join('')
      + `<path d="M${f(hc[0] - hr * .7)} ${f(hc[1] - hr * .6)}A${f(hr * .92)} ${hr} 0 0 1 ${f(hc[0] + hr * .8)} ${f(hc[1] - hr * .5)}" stroke="${rim}" stroke-width=".7" fill="none" opacity=".75"/>`
      + `<path d="M${hc[0]} ${f(hc[1] + hr * .9)}Q${hc[0] + .6} ${hc[1] + 12} ${hc[0] - .4} ${hc[1] + 16}" stroke="#140a06" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      + `<path d="M${hc[0] - 1.6} ${f(hc[1] + hr * .9 + 1.2)}h3.2l-.4 1.6h-2.4z" fill="#0a0a0c"/>`; }
  // the near (right) arm: the shirt sleeve from the shoulder, rolled to the elbow, the bare forearm to the fist on the quoin
  const shN = [52, 104], el = [70, 116], wr = [92.4, 123.6], HS = 1.12;
  const grip = [100, 128.6];                         // the end of the quoin's handle (gun(): P(0, 7.4, -.16))
  s += H.cloth(u, { spine: [shN, [60, 108], [el[0] + 1, el[1] - 1]], w: [12, 11, 10], tone: sh, lit: 1, rim, rimSide: 1, cuff: { from: .72, k: 1.12, roll: true }, seed: 5, capA: true, drapes: 2 });
  const a = ang(el, wr);
  s += H.cloth(u, { spine: [[el[0] - 1, el[1] - 1], [lerp(el[0], wr[0], .5), lerp(el[1], wr[1], .5) - .8], wr], w: [8.2, 7.4, 5.6], tone: SKIN, lit: 1, rim, rimSide: 1, folds: false, capA: true, sw: .4 });
  void grip;
  const hd = H.hand(u, { at: wr, a: a + 26, s: HS, m: 1, pose: 'grip', tone: SKIN, sw: .35 });
  s += hd.back + hd.front;
  return s;
}

/** The officer: in profile facing left, near us on the right, cut by the glass at the waist — a navy coat with white
 *  facings and gilt buttons, a white stock, a powdered queue under a black tricorn edged with gold. His far hand points
 *  the closed spyglass out of the port, a little up (the elevation); his near hand holds the thick regulations open. */
function officer(u, L, R) {
  const coat = tone(L, '#22305a'), fac = tone(L, '#ece4d2'), rim = '#fff0d4', gold = L.ramp('brass', 160, 90);
  const hc = [164, 60], hr = 7.6;
  let s = '';
  // the far arm (his left), out from behind the chest towards the port: shoulder, elbow, wrist; the spyglass in the fist
  const shF = [160, 84], elF = [146, 86], wrF = [133.6, 79];
  s += H.cloth(u, { spine: [shF, [153, 87], elF, wrF], w: [11, 10, 9, 8], tone: coat, lit: -1, rim, rimSide: -1, cuff: { from: .78, k: 1.25, tone: fac }, seed: 7, capA: true, drapes: 2 });
  { const t0 = [142, 86.6], t1 = [110, 80.6], d = [t1[0] - t0[0], t1[1] - t0[1]], l = Math.hypot(d[0], d[1]), ux = d[0] / l, uy = d[1] / l, at = k => [t0[0] + ux * l * k, t0[1] + uy * l * k];
    // the spyglass: a leather body, two brass draws (thinner), the objective cell forward, the eyepiece behind
    const seg = (k0, k1, r0, r1, kind) => { const a = at(k0), b = at(k1); return K.shadeCyl(u, a[0], a[1], b[0], b[1], r0, L, kind, { r1: r0, r2: r1, outline: .35 }); };
    s += seg(-.04, .02, 1.3, 1.3, 'brass') + seg(.02, .5, 1.9, 1.9, 'leather') + seg(.5, .54, 2.1, 2.1, 'brass') + seg(.54, .8, 1.6, 1.6, 'brass') + seg(.8, .83, 1.75, 1.75, 'brass') + seg(.83, 1, 1.35, 1.35, 'brass') + seg(.98, 1.02, 1.6, 1.6, 'brass');
    // the fist round the leather body
    const hd = H.hand(u, { at: wrF, a: 102, s: 1.15, m: 1, pose: 'grip', tone: SKIN, sw: .35 });
    s += hd.front; }
  // the body: the coat's back and skirt, the chest with the facings and the waistcoat, the buttons
  { const g = nid('ob', u);
    const body = H.sp([[158, 75], [154, 84], [151, 98], [152, 116], [154, 134], [154, 170], [190, 170], [189, 140], [187, 112], [186, 92], [182, 80], [172, 74]], true);
    s += `<defs>${linGrad(g, 150, 90, 190, 100, [[0, coat.lit], [.25, coat.half], [1, coat.shadow]])}</defs><path d="${body}" fill="url(#${g})" stroke="${coat.outline}" stroke-width=".45"/>`;
    // the white facing (lapel) down the chest and the waistcoat edge under it
    s += `<path d="${H.sp([[158, 76], [154.6, 84], [152.2, 98], [153, 116], [158, 117], [158.6, 100], [160, 86], [162, 77]], true)}" fill="${fac.half}" stroke="${fac.outline}" stroke-width=".35"/>`
      + `<path d="M154.6 84L152.2 98L153 116" stroke="${fac.lit}" stroke-width=".7" fill="none"/>`;
    for (let k = 0; k < 5; k++) s += K.shadeSphere(u, 156.4 + k * .05, 84 + k * 7.6, .8, L, 'brass', { outline: .2 });
    // the back seam, the pocket flap and the skirt's fold, the daylight edge along the front
    s += `<path d="M183 86Q186 120 186 170M160 128Q168 131 176 128M170 132Q172 150 171 170" stroke="${coat.shadow}" stroke-width=".6" fill="none" opacity=".8"/>`
      + `<path d="M158 75L154 84L151 98L152 116L154 134" stroke="${rim}" stroke-width=".8" fill="none" opacity=".65"/>`
      // the gold epaulette-less shoulder seam and the cuff lace come later; the white stock at the neck
      + `<path d="M160 70L159.6 77Q166 79.6 172 75L171 69Z" fill="${fac.half}" stroke="${fac.outline}" stroke-width=".35"/><path d="M159.8 74Q164 76 170 73.4" stroke="${fac.shadow}" stroke-width=".4" fill="none"/>`
      + `<path d="M172 74L181 79" stroke="${coat.outline}" stroke-width=".5"/>`; }
  // the head: the face in profile to the left, the powdered hair rolled over the ear, the queue with its black bow
  { const hd = H.head(u, { c: hc, r: hr, dir: -1, tilt: 6, tone: SKIN, faceLit: true, edge: '#ffe6c4', rim, eye: 'open', look: 6, brow: 'frown', mouth: 0, hairColor: '#8a8478' });
    const Q = hd.Q;
    s += hd.svg;
    const hairG = nid('oh', u), a0 = Q(-1, -.6), a1 = Q(.3, .4);
    s += `<defs>${linGrad(hairG, a1[0], a1[1], a0[0], a0[1], [[0, '#f4f0e6'], [.6, '#cfcabe'], [1, '#8e8a80']])}</defs>`
      + `<path d="${H.sp([Q(.42, -.86), Q(-.2, -1.06), Q(-.78, -.84), Q(-1.06, -.3), Q(-1.04, .28), Q(-.74, .56), Q(-.3, .5), Q(-.1, .28), Q(.0, -.2), Q(.36, -.5)], true)}" fill="url(#${hairG})" stroke="#5a564c" stroke-width=".35"/>`
      // the roll over the ear and the queue down the nape, its black bow
      + `<path d="${H.sp([Q(-.36, .02), Q(.1, -.04), Q(.18, .2), Q(-.3, .3)], true)}" fill="#e8e4d8" stroke="#6a665c" stroke-width=".35"/>`
      + `<path d="M${P2(Q(-.92, .44))}Q${P2(Q(-1.2, .9))} ${P2(Q(-1.1, 1.5))}" stroke="#d6d2c6" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      + `<path d="M${P2(Q(-1.02, .56))}l-2.6 -1.6l.2 3.4zM${P2(Q(-1.02, .56))}l2.2 -1.8l.6 3.2z" fill="#0c0c0e"/>`;
    // the tricorn: a low round crown, the brim cocked up in front and behind (seen from the side: a boat with two
    // horns), gold lace along the edge, the black cockade
    const hatG = nid('ot', u), b0 = Q(.9, -1.5), b1 = Q(-.9, -.7);
    s += `<defs>${linGrad(hatG, b0[0], b0[1], b1[0], b1[1], [[0, '#4a4a52'], [.35, '#1e1e24'], [1, '#08080a']])}</defs>`
      + `<path d="${H.sp([Q(-.86, -.86), Q(-.7, -1.36), Q(-.1, -1.56), Q(.5, -1.42), Q(.8, -.96)], true)}" fill="url(#${hatG})" stroke="#000" stroke-width=".35"/>`
      + `<path d="${H.sp([Q(-1.44, -1.58), Q(-1.2, -1.02), Q(-.6, -.78), Q(.3, -.78), Q(1.0, -.9), Q(1.42, -1.42), Q(1.3, -1.1), Q(.9, -.66), Q(.1, -.6), Q(-.7, -.62), Q(-1.3, -.92)], true)}" fill="url(#${hatG})" stroke="#000" stroke-width=".4"/>`
      + `<path d="${H.sp([Q(-1.44, -1.58), Q(-1.2, -1.02), Q(-.6, -.78), Q(.3, -.78), Q(1.0, -.9), Q(1.42, -1.42)])}" stroke="${gold.lit}" stroke-width=".8" fill="none"/>`
      + `<circle cx="${f(Q(.86, -1.06)[0])}" cy="${f(Q(.86, -1.06)[1])}" r="1.4" fill="#0c0c0e" stroke="${gold.half}" stroke-width=".4"/>`
      + `<path d="${H.sp([Q(-.7, -1.36), Q(-.1, -1.56), Q(.5, -1.42)])}" stroke="${rim}" stroke-width=".5" fill="none" opacity=".6"/>`; }
  // the book: the regulations, thick, held open in front of his chest; leather boards, the block of pages, strokes for
  // lines (no letters), a red ribbon; the near hand holds it from below, the near sleeve with its big white cuff
  { const pg = '#f2ead6', ps = '#c8bc9e';
    const Lp = [[138, 100.6], [154, 105], [155, 118.4], [139, 114.6]], Rp = [[154, 105], [170, 99.6], [171.6, 113.4], [155, 118.4]];
    const th = 4.4;   // the thickness of the block of pages under each page
    s += `<path d="M${P2([Lp[0][0] - 1, Lp[0][1] + .6])}L${P2([Lp[3][0] - 1, Lp[3][1] + th])}L${P2([155, 118.4 + th + 1])}L${P2([Rp[2][0] + 1, Rp[2][1] + th])}L${P2([Rp[1][0] + 1, Rp[1][1] + .6])}L${P2(Rp[2])}L${P2(Rp[3])}L${P2(Lp[3])}Z" fill="#5a1e14" stroke="#1a0806" stroke-width=".45"/>`
      + `<path d="M${P2(Lp[3])}L${P2([Lp[3][0] - .4, Lp[3][1] + th - .6])}L${P2([155, 118.4 + th])}L${P2([Rp[2][0] + .4, Rp[2][1] + th - .6])}L${P2(Rp[2])}L${P2([155, 118.4])}Z" fill="${ps}" stroke="#7a6a50" stroke-width=".3"/>`
      + [1.2, 2.4, 3.4].map(d => `<path d="M${P2([Lp[3][0], Lp[3][1] + d])}L${P2([155, 118.4 + d])}L${P2([Rp[2][0], Rp[2][1] + d])}" stroke="#9a8c70" stroke-width=".2" fill="none"/>`).join('');
    const page = (Q, lit) => { const g = nid('pp', u); return `<defs>${linGrad(g, Q[0][0], Q[0][1], Q[1][0], Q[1][1], lit ? [[0, '#fffaf0'], [1, pg]] : [[0, pg], [1, '#d8ccb0']])}</defs><path d="M${P2(Q[0])}Q${f((Q[0][0] + Q[1][0]) / 2)} ${f(Math.min(Q[0][1], Q[1][1]) - 2.2)} ${P2(Q[1])}L${P2(Q[2])}Q${f((Q[2][0] + Q[3][0]) / 2)} ${f(Math.min(Q[2][1], Q[3][1]) - 1.8)} ${P2(Q[3])}Z" fill="url(#${g})" stroke="#8a7a5a" stroke-width=".3"/>`; };
    s += page(Lp, true) + page(Rp, false);
    // the lines of the text as strokes, in two columns' worth per page, and a ruled table on the right page
    for (const [Q, n] of [[Lp, 7], [Rp, 7]]) for (let k = 0; k < n; k++) { const t = (k + 1) / (n + 1), a = [lerp(Q[0][0], Q[3][0], t) + 1.6, lerp(Q[0][1], Q[3][1], t) + .4], b = [lerp(Q[1][0], Q[2][0], t) - 1.6, lerp(Q[1][1], Q[2][1], t) + .4];
      const e = [lerp(a[0], b[0], k % 3 === 2 ? .6 : .92), lerp(a[1], b[1], k % 3 === 2 ? .6 : .92)];
      s += `<path d="M${P2(a)}L${P2(e)}" stroke="#5a4a38" stroke-width=".32" stroke-dasharray="${f(1 + R() * 1.4)} .5 ${f(.6 + R())} .5" opacity=".75"/>`; }
    s += `<path d="M157 108l4 9" stroke="#a81a14" stroke-width="1" /><path d="M157 108l4 9l1.2 1.6" stroke="#a81a14" stroke-width=".6" fill="none"/>`
      + `<path d="M154 105L155 118.4" stroke="#8a7a5a" stroke-width=".5"/>`; }
  // the near arm: from the shoulder down to the elbow and forward to the book, the white cuff; the hand under the book
  const shN = [176, 86], elN = [178, 110], wrN = [165, 121.4];
  s += H.cloth(u, { spine: [shN, [179, 98], elN, wrN], w: [13, 12, 11, 9.4], tone: coat, lit: -1, rim, rimSide: -1, cuff: { from: .72, k: 1.3, tone: fac }, seed: 9, capA: true, drapes: 2 });
  { const hd = H.hand(u, { at: wrN, a: -150, s: 1.15, m: -1, pose: 'grip', tone: SKIN, sw: .35 }); s += hd.front; }
  // a lace frill at the cuff and the gilt buttons on it
  s += K.shadeSphere(u, 172.4, 116.6, .8, L, 'brass', { outline: .2 }) + K.shadeSphere(u, 174, 114, .8, L, 'brass', { outline: .2 });
  return s;
}
