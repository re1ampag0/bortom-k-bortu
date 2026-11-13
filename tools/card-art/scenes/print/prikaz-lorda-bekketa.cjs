// «Приказ лорда Беккета» (Индевор, ПРИКАЗ: в этот ход корабль союзника может разыграть на 2 карты больше), refined from
// the first-round scene (portrait-endeavour.cjs SCENES['Приказ лорда Беккета']): a bright day on the Company ship's
// deck. The lord's order is pinned to the mainmast with a dirk — a big sheet curling round the mast, a flourish at its
// head, lines of a fair hand, the Company's red seal on a ribbon, its lower corner lifting in the wind; above it the
// Company's striped ensign. From the mast a hoist of signal flags runs down to the rail, passing the order on to the
// allied ship on the horizon, who answers with a small hoist of her own; and a file of redcoats marches off across the
// deck to carry it out. Brief's find: the signal flags to the ally — an order to the other ship.
// Fixed against the first round: the soldiers were paper dolls of one size stacked on a strip — now a file in true
// perspective on a planked deck (each one's height from his distance, cast shadows on the planks), seen from behind
// marching: tricorns, queues, crossbelts, turned-back coat skirts, gaiters, muskets on the shoulder, a stride; the
// order and the flag were flat stickers — now the sheet bends round the mast and the ensign flies in folds; the
// signal hoist and the ally are new (the brief's find).
// Light: the sun high behind us on the left (key): the backs of the soldiers and the sheet lit, shadows thrown ahead
// and to the right; a blue sky fill.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom } = PK;

const HZ = 92, FOC = 55, EYE = 1.6;              // the horizon, the focal length (units per m at 1 m), the eye's height (m)
const dY = d => HZ + FOC * EYE / d;              // the deck's y at distance d (m)
const BW = 8;                                    // the bulwark's distance (m)
const BT = HZ + FOC * (EYE - 1.15) / BW, BF = dY(BW);   // the bulwark's top and foot
const MAST = { x: 43, r: 12.5 };                  // the mainmast near us on the left
const ALLY = { x: 124, y: 91.6, scale: .3 };    // the allied ship on the horizon
// the file: from the nearest (deck distance 1.5 m) to the farthest (7.2 m), on a line to the entry port at the right
const FILE = [7.2, 5.6, 4.3, 3.2, 2.3, 1.55].map((d, i) => ({ d, y: dY(d), h: FOC * 1.76 / d, x: lerp(188, 104, Math.pow((7.2 - d) / 5.65, .8)), i }));
const light = { time: 'day', haze: .3, key: { type: 'sun', az: 236, el: 42, color: '#fff4dc', power: 1 }, fill: { color: '#8ab4d8', power: .5 }, rim: { az: 200, color: '#fff8e8', power: .3 } };
const skel = { horizon: HZ, eye: EYE, light: 'the sun high behind us on the left (key) + the blue sky (fill)', items: [
  ['bulwark', -10, BF, 220, BF - BT, 'the deck at 8 m'], ['ally', ALLY.x - 20, HZ, 44, 26, 'the sea, the horizon'], ['mast', MAST.x - MAST.r, 160, MAST.r * 2, 170, 'the deck at 1.8 m'],
  ['order', 22, 102, 54, 60, 'pinned to the mast with a dirk'], ['ensign', 55, 36, 70, 34, 'its halyard on the mast'], ['signal hoist', 56, 98, 140, 60, 'mast → the rail at the right'],
  ...FILE.map(p => [`soldier ${p.i}`, p.x - p.h * .2, p.y, p.h * .4, p.h, `the deck at ${p.d} m`])] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const RED = { lit: '#e0584a', half: '#b4302a', shadow: '#5a1410', outline: '#2a0806' };
const WHT = { lit: '#ffffff', half: '#e4e0d6', shadow: '#9a968c', outline: '#4a4842' };
const BLK = { lit: '#5a5a62', half: '#25252a', shadow: '#0c0c10', outline: '#050508' };
const SKIN = { lit: '#f2c8a2', half: '#cc9670', shadow: '#7a4a32', outline: '#3a2014' };

module.exports = { name: 'Приказ лорда Беккета', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE }), R = rng(37);
    // ——— the day: sky, clouds, the sea to the bulwark, the ally on the horizon answering ———
    let bg = K.sky(u, L, { horizon: HZ });
    for (const [x, y, w, h, sd, fr] of [[150, 26, 60, 9, 4, .25], [40, 58, 46, 6, 7, .5], [176, 64, 40, 5, 2, .6], [96, 78, 50, 4, 9, .75]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: BT + 2, swell: .3, seed: 5, glitter: false });
    bg += K.ship(u, L, { kind: 'dutch', x: ALLY.x, y: ALLY.y, scale: ALLY.scale, flip: true, sails: 'full', detail: 'mid', air: .12, seed: 4 });   // less haze: the ally must read
    { const b = K.shipBox('dutch', { x: ALLY.x, y: ALLY.y, scale: ALLY.scale, flip: true }), top = [ALLY.x + 1, b.top + 4];
      bg += hoist(u, top, [ALLY.x + 17, ALLY.y - 7], 3, 3.3, 3, 1, 1); }   // her answering hoist, big enough to read
    // ——— the deck: the bulwark across, the planks in perspective, the entry port at the right ———
    bg += deck(u, L, R);
    // ——— the soldiers, far to near, each with his shadow on the planks ———
    let mid = '';
    for (const p of FILE) mid += K.castShadow(u, L, { x: p.x, y: p.y, w: p.h * .26, h: p.h, horizon: HZ, d: .5, opacity: .7 }) + soldier(u, L, p.x, p.y, p.h, { seed: p.i, step: p.i % 2 });
    // ——— the mast, the ensign, the signal hoist, the order ———
    let fg = mast(u, L) + ensign(u, L) + hoist(u, [MAST.x + MAST.r - 1, 38], [199, BT - 4], 5, 7.6, 0, 1, 1) + order(u, L, R);
    fg += gloom(u, 100, 130, 100, 280, .45, '#1a0e06') + gloom(u, 200, 40, 120, 60, .12, '#2a3a5a');
    return [bg, mid + fg];
  } };

/** The deck seen across the ship: the bulwark (planking, a capping rail, the stanchions) with the entry port at the
 *  right, the waterway, the deck planks as horizontal seams spaced by distance, their butts running to the VP. */
function deck(u, L, R) {
  let s = '';
  // the planks: each seam at its distance, butts staggered and pointing to the VP
  { const rp = L.ramp('pine-deck', 100, 130), g = nid('dk', u);
    s += `<defs>${linGrad(g, 0, BF, 0, 280, [[0, rp.half], [.3, rp.lit], [1, mix(rp.lit, '#fff8e8', .2)]])}</defs><rect x="-10" y="${f(BF)}" width="220" height="${f(290 - BF)}" fill="url(#${g})"/>`;
    for (let d = BW - .22; d > .5; d -= .22) { const y = dY(d), y2 = dY(d - .22), w = Math.max(.25, .7 / d * 2);
      s += `<path d="M-10 ${f(y)}H210" stroke="${rp.outline}" stroke-width="${f(w * .6)}" opacity=".55"/>`;
      // a few butts per strake, staggered
      for (let k = 0; k < 4; k++) { const x = -20 + ((k * 61 + d * 137) % 240), bx = x + (x - 100) * ((y2 - y) / (y - HZ)); if (y2 < 300) s += `<path d="M${f(x)} ${f(y)}L${f(bx)} ${f(y2)}" stroke="${rp.outline}" stroke-width="${f(w * .5)}" opacity=".4"/>`; }
      // the trenails: two dots at each butt end
      if (R() < .5) { const x = R() * 200; s += `<circle cx="${f(x)}" cy="${f((y + y2) / 2)}" r="${f(w * .5)}" fill="${rp.shadow}" opacity=".5"/>`; } }
    s += `<path d="M-10 ${f(BF + 1)}H210" stroke="#000" stroke-width="1.6" opacity=".3"/>`; }
  // the bulwark: the inner planking in shade (the sun is behind us: lit), the capping rail, stanchions; the entry port
  { const rp = L.ramp('oak', 100, (BT + BF) / 2), ep = [170, 186];
    s += `<rect x="-10" y="${f(BT)}" width="220" height="${f(BF - BT)}" fill="${rp.half}"/>`;
    for (let k = 1; k < 4; k++) { const y = lerp(BT, BF, k / 4); s += `<path d="M-10 ${f(y)}H210" stroke="${rp.outline}" stroke-width=".35" opacity=".6"/>`; }
    for (let x = -4; x < 210; x += 11) if (x < ep[0] - 2 || x > ep[1] + 2) s += `<rect x="${f(x)}" y="${f(BT + 1)}" width="1.6" height="${f(BF - BT - 1)}" fill="${rp.lit}" opacity=".6"/><rect x="${f(x + 1.6)}" y="${f(BT + 1)}" width=".5" height="${f(BF - BT - 1)}" fill="${rp.shadow}"/>`;
    // the entry port: a gap with the sea showing, the man-ropes, a stanchion each side
    s += `<rect x="${ep[0]}" y="${f(BT - .5)}" width="${ep[1] - ep[0]}" height="${f(BF - BT + .5)}" fill="#6a9ab0"/><path d="M${ep[0]} ${f(BF - 2)}H${ep[1]}" stroke="#3a6a80" stroke-width="1"/>`
      + [ep[0], ep[1]].map(x => `<rect x="${x - 1.2}" y="${f(BT - 3.4)}" width="2.4" height="${f(BF - BT + 3.4)}" fill="${rp.half}" stroke="${rp.outline}" stroke-width=".3"/><circle cx="${x}" cy="${f(BT - 3.6)}" r="1.3" fill="${rp.lit}" stroke="${rp.outline}" stroke-width=".3"/>`).join('')
      + `<path d="M${ep[0] + 1} ${f(BT - 2.4)}Q${(ep[0] + ep[1]) / 2} ${f(BT + 2)} ${ep[1] - 1} ${f(BT - 2.4)}" stroke="#d8c8a0" stroke-width=".5" fill="none"/>`;
    // the capping rail: a lit top face, a dark lip
    s += `<rect x="-10" y="${f(BT - 1.6)}" width="${ep[0] + 10}" height="1.9" fill="${rp.lit}"/><rect x="${ep[1]}" y="${f(BT - 1.6)}" width="${30}" height="1.9" fill="${rp.lit}"/><path d="M-10 ${f(BT + .3)}H${ep[0]}M${ep[1]} ${f(BT + .3)}H210" stroke="${rp.outline}" stroke-width=".5"/>`;
    // the waterway at the foot with a coil of rope and a few belaying pins on the pin rail
    s += `<rect x="-10" y="${f(BF - 1.2)}" width="220" height="1.6" fill="${rp.shadow}"/>`
      + K.coil(u, L, { x: 150, y: BF + 1.2, r: 5, turns: 4, rr: .6, seed: 3 });
    for (let x = 76; x < 160; x += 7) s += `<path d="M${x} ${f(BT + 2)}v${f(BF - BT - 4)}" stroke="#c8a878" stroke-width=".9"/>`; }
  return s;
}

/** A redcoat from behind, marching away: feet at (x, y), height h. Local units: the figure 60 tall (hat included),
 *  feet at 0. Tricorn and queue, the stock at the neck, the red coat with white crossbelts over the back, the
 *  skirts turned back white at the sides, the black cartridge box at the right hip, white breeches, black gaiters
 *  buttoned to the knee, shoes; a musket at the slope on the left shoulder (bayonet fixed); the right arm swinging;
 *  one heel lifted in the stride (step 0 | 1: which). Light from the left. */
function soldier(u, L, x, y, h, o = {}) {
  const k = h / 60, st = o.step ? -1 : 1;     // st: +1 — the right foot pushing off (heel up), −1 — the left
  const g = (id, c) => { const n = nid(id, u); return { id: n, defs: linGrad(n, -9, 0, 9, 0, [[0, c.lit], [.4, c.half], [1, c.shadow]]) }; };
  const gR = g('sr', RED), gW = g('sw', WHT), gB = g('sb', BLK), gS = g('ss', SKIN);
  let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><defs>${gR.defs}${gW.defs}${gB.defs}${gS.defs}</defs>`;
  const ol = `stroke="${RED.outline}" stroke-width="${f(.45 / Math.max(.4, k))}"`, olB = `stroke="#050508" stroke-width="${f(.4 / Math.max(.4, k))}"`;
  // the legs: the standing one straight, the other bent at the knee with the heel lifted and the sole showing
  const leg = (sx, up) => {
    const hipX = sx * 3, kneeX = sx * 3.1, footX = sx * 2.6;
    if (!up) return `<path d="M${hipX - 2.6} -30L${kneeX - 2.3} -16L${footX - 1.9} -1.4H${footX + 1.9}L${kneeX + 2.2} -16L${hipX + 2.8} -30Z" fill="url(#${gW.id})" stroke="${WHT.outline}" stroke-width=".3"/>`
      + `<path d="M${kneeX - 2.4} -16.4L${footX - 2} -1.2H${footX + 2}L${kneeX + 2.3} -16.4Z" fill="url(#${gB.id})" ${olB}/>`
      + `<path d="M${kneeX - 2.4} -16.4h4.7" stroke="#050508" stroke-width="1"/>`
      + `<path d="M${footX - 2.4} -1.6h4.8l.4 1.6h-5.6z" fill="#0c0c10"/>`
      + [-13, -10, -7, -4].map(yy => `<circle cx="${f(kneeX + sx * 1.6 + (footX - kneeX) * ((-16 - yy) / -15))}" cy="${yy}" r=".35" fill="#8a8a90"/>`).join('');
    // the lifted leg: the knee bent forward (away from us: higher), the lower leg back toward us, the sole up
    return `<path d="M${hipX - 2.6} -30L${kneeX - 2.3} -17.6L${kneeX + 2.2} -17.6L${hipX + 2.8} -30Z" fill="url(#${gW.id})" stroke="${WHT.outline}" stroke-width=".3"/>`
      + `<path d="M${kneeX - 2.4} -18L${footX - 1.6} -5.2H${footX + 2}L${kneeX + 2.3} -18Z" fill="url(#${gB.id})" ${olB}/><path d="M${kneeX - 2.4} -18h4.7" stroke="#050508" stroke-width="1"/>`
      + `<path d="M${footX - 1.8} -5.4h3.8l.6 3.6q-2.6 1 -5 0z" fill="#2a2420" stroke="#050508" stroke-width=".3"/><path d="M${footX - 1.2} -3.4h2.6" stroke="#5a5048" stroke-width=".4"/>`;
  };
  s += leg(-1, st < 0) + leg(1, st > 0);
  // the musket's butt and the left hand at the hip, under the coat's edge (the stock shows below the left skirt)
  s += `<path d="M-9.6 -26l2.6 -.4l1.4 7.6l-3.4 .8z" fill="#6a3e1c" stroke="#2a1608" stroke-width=".3"/>`;
  // the coat's skirts: the back with its vent and pleats, the turned-back white facings at the sides
  s += `<path d="M-8.4 -36L-9.6 -19.6Q-5 -18 0 -18.6Q5 -18 9.6 -19.6L8.4 -36Z" fill="url(#${gR.id})" ${ol}/>`
    + `<path d="M-9.6 -19.6L-8.6 -33L-6.4 -19z" fill="url(#${gW.id})" stroke="${WHT.outline}" stroke-width=".25"/><path d="M9.6 -19.6L8.6 -33L6.4 -19z" fill="${WHT.shadow}" stroke="${WHT.outline}" stroke-width=".25"/>`
    + `<path d="M0 -33V-18.6M-2.2 -33.4q-.6 7 -1 14.6M2.2 -33.4q.6 7 1 14.6" stroke="${RED.shadow}" stroke-width=".5" fill="none"/><circle cx="-1.6" cy="-33.6" r=".55" fill="#d8c070"/><circle cx="1.6" cy="-33.6" r=".55" fill="#d8c070"/>`;
  // the cartridge box at the right hip (black leather, a brass badge) and the bayonet scabbard at the left
  s += `<path d="M2.4 -33.4h6.4l.4 4.8h-7.2z" fill="url(#${gB.id})" ${olB}/><circle cx="5.8" cy="-31" r=".7" fill="#d8b050"/>`
    + `<path d="M-8.6 -33.6l-1.2 9.6l1 .2l1.6 -9.6z" fill="#1a1410"/>`;
  // the body of the coat: shoulders, the back seam, the crossbelts in an X, the waist
  s += `<path d="M-7.8 -48.6Q-8.6 -42 -8.4 -35.6Q0 -34 8.4 -35.6Q8.6 -42 7.8 -48.6Q0 -50.6 -7.8 -48.6Z" fill="url(#${gR.id})" ${ol}/>`
    + `<path d="M-7.2 -48.4L6.8 -35.4M7.2 -48.4L-6.8 -35.4" stroke="${WHT.half}" stroke-width="1.7"/><path d="M-7.2 -48.4L6.8 -35.4" stroke="${WHT.lit}" stroke-width=".7" transform="translate(-.4 -.3)"/>`
    + `<rect x="-1.2" y="-43.2" width="2.4" height="2" fill="#d8b050" stroke="#6a5010" stroke-width=".2"/>`
    + `<path d="M-8.4 -35.6Q0 -34 8.4 -35.6" stroke="${RED.outline}" stroke-width=".5" fill="none"/>`;
  // the arms: the left bent (the hand at the musket's butt, hidden), the right swinging, cuffs turned back
  s += `<path d="M-7.6 -48Q-10.6 -46.6 -10.6 -42L-10.4 -33Q-9.2 -31.6 -7.8 -33L-7.6 -42Z" fill="url(#${gR.id})" ${ol}/>`
    + `<path d="M7.6 -48Q10.6 -46.6 10.8 -42L11.4 -31.6Q10.2 -30.4 8.8 -31.6L7.8 -42Z" fill="${RED.half}" ${ol}/>`
    + `<path d="M8.6 -32l2.9 -.4l.3 2.6l-2.9 .4z" fill="${WHT.half}" stroke="${WHT.outline}" stroke-width=".25"/>`
    + `<path d="M8.9 -29.6q1.6 -.4 2.8 0l.2 2.6q-1.4 1.4 -3 .2z" fill="url(#${gS.id})" stroke="${SKIN.outline}" stroke-width=".3"/>`;
  // the musket at the slope: the barrel rising from behind the left shoulder, the bayonet at its top
  s += `<path d="M-8.6 -44L-13.4 -64" stroke="#5a3418" stroke-width="1.6" stroke-linecap="round"/><path d="M-11.2 -54L-13.6 -64.6" stroke="#9aa4ac" stroke-width=".8"/>`
    + `<path d="M-13.6 -64.6L-15.6 -73.4" stroke="#d8e0e6" stroke-width=".5"/>`;
  // the neck and the black stock, the head from behind: dark hair gathered into a queue tied with a black ribbon,
  // the ears showing at the sides
  s += `<path d="M-2.2 -51.6h4.4v-2.4h-4.4z" fill="url(#${gS.id})"/><path d="M-2.8 -50.8h5.6v1.8h-5.6z" fill="#0c0c10"/>`
    + `<ellipse cx="-3.7" cy="-55" rx="1" ry="1.6" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".25"/><ellipse cx="3.7" cy="-55" rx="1" ry="1.6" fill="${SKIN.shadow}" stroke="${SKIN.outline}" stroke-width=".25"/>`
    + `<path d="M-3.6 -57.4Q-4 -53.6 -1.4 -52.4Q0 -51.8 1.4 -52.4Q4 -53.6 3.6 -57.4Z" fill="#4a3220" stroke="#1a1008" stroke-width=".3"/>`
    + `<path d="M-2.4 -57q-.6 2.6 .6 4.2M0 -57.2v4.6M2.4 -57q.6 2.6 -.6 4.2" stroke="#7a5a3a" stroke-width=".35" fill="none" opacity=".8"/>`
    + `<path d="M0 -53L.3 -47.6" stroke="#3a2416" stroke-width="1.5" stroke-linecap="round"/><path d="M-1.6 -53.4l1.6 .8l1.6 -.8l-.2 1.8l-1.4 -.4l-1.4 .4z" fill="#0c0c10"/>`;
  // the tricorn from behind: the cocked-up back of the brim with its white tape, its two side corners sticking out
  s += `<path d="M-9.2 -58.4Q-4 -56 0 -55.8Q4 -56 9.2 -58.4L8 -59.4Q6.4 -62.4 3.6 -63.2Q0 -64 -3.6 -63.2Q-6.4 -62.4 -8 -59.4Z" fill="url(#${gB.id})" ${olB}/>`
    + `<path d="M-9.2 -58.4Q-4 -56 0 -55.8Q4 -56 9.2 -58.4" stroke="#f0ece4" stroke-width=".7" fill="none"/>`
    + `<path d="M-8 -59.4Q-6.4 -62.4 -3.6 -63.2Q0 -64 3.6 -63.2Q6.4 -62.4 8 -59.4" stroke="#f0ece4" stroke-width=".55" fill="none" opacity=".9"/>`
    + `<path d="M-5 -60.4Q0 -58.4 5 -60.4" stroke="#3a3a42" stroke-width=".5" fill="none"/>`;
  return s + '</g>';
}

/** The mainmast near us: a shaded oak column with iron hoops, the halyards running down it, a cleat. */
function mast(u, L) {
  const { x, r } = MAST, base = dY(1.8);
  let s = K.castShadow(u, L, { x, y: base, w: r * 2, h: 220, horizon: HZ, d: 1, opacity: .5 })
    + K.shadeCyl(u, x, base + 6, x, -10, r, L, 'oak', { r1: r, r2: r * .96, outline: .5, seed: 8 });
  for (const y of [22, 118]) s += K.shadeCyl(u, x - r - .4, y, x + r + .4, y, 1.4, L, 'iron', { outline: .3 }).replace(/^/, '');
  // the halyards and a cleat on the right side
  s += `<path d="M${x + r - 3} -10V${base}M${x + r - 5.4} -10V${base}" stroke="#7a6040" stroke-width=".7"/><path d="M${x + r - 6} 128h7" stroke="#5a3a1a" stroke-width="2" stroke-linecap="round"/>`;
  return s;
}

/** The Company's ensign flying from a halyard on the mast: red and white stripes, the canton with the cross, in folds. */
function ensign(u, L) {
  const x0 = MAST.x + MAST.r - 1, y0 = 5, w = 66, h = 30, cid = nid('en', u);
  const top = t => [x0 + w * t, y0 + Math.sin(t * Math.PI * 1.6) * 2.4 + t * 3], bot = t => [x0 + w * t * .97, y0 + h + Math.sin(t * Math.PI * 1.6 + .5) * 2.6 + t * 4];
  let d = `M${P2(top(0))}`; for (let i = 1; i <= 12; i++) d += `L${P2(top(i / 12))}`;
  d += `L${P2(bot(1))}`; for (let i = 11; i >= 0; i--) d += `L${P2(bot(i / 12))}`; d += 'Z';
  let s = `<path d="M${x0} ${y0 - 3}v${h + 6}" stroke="#d8c8a0" stroke-width=".5"/><defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="#f4ece0"/><g clip-path="url(#${cid})">`;
  for (let k = 0; k < 13; k += 2) { let p = ''; for (let i = 0; i <= 12; i++) { const a = top(i / 12), b = bot(i / 12), q = [lerp(a[0], b[0], k / 13), lerp(a[1], b[1], k / 13)]; p += (i ? 'L' : 'M') + P2(q); }
    for (let i = 12; i >= 0; i--) { const a = top(i / 12), b = bot(i / 12), q = [lerp(a[0], b[0], (k + 1) / 13), lerp(a[1], b[1], (k + 1) / 13)]; p += 'L' + P2(q); }
    s += `<path d="${p}Z" fill="#b8302a"/>`; }
  s += `<rect x="${x0 - 1}" y="${y0 - 2}" width="24" height="${h * .55}" fill="#f4ece0"/><path d="M${x0 + 11} ${y0 - 2}v${f(h * .55)}M${x0 - 1} ${f(y0 + h * .55 / 2 - 2)}h24" stroke="#b8302a" stroke-width="3"/>`;
  // the folds: light on the crests, shade in the troughs, running down the flag
  for (let i = 0; i < 6; i++) { const t = (i + .5) / 6, a = top(t), b = bot(t), gg = nid('ef', u);
    s += `<defs>${linGrad(gg, a[0] - 5, 0, a[0] + 5, 0, [[0, '#ffffff', .25], [.45, '#000', 0], [.8, '#000', .22], [1, '#000', 0]])}</defs><path d="M${f(a[0] - 5)} ${f(a[1] - 3)}L${f(a[0] + 5)} ${f(a[1] - 3)}L${f(b[0] + 5)} ${f(b[1] + 3)}L${f(b[0] - 5)} ${f(b[1] + 3)}Z" fill="url(#${gg})"/>`; }
  s += `</g><path d="${d}" fill="none" stroke="#5a1410" stroke-width=".35"/>`;
  return s;
}

/** Signal flags on a halyard from A down to B, each hanging by its hoist edge and flying downwind (dir +1 — to the
 *  right). From stroy-linii.cjs (the same flags), with the wind's side as a parameter. */
const COLS = [['#c62a2a', '#f6f0e2', 'h'], ['#1e3a8a', '#f6f0e2', 'x'], ['#e8b030', '#c62a2a', 'v'], ['#f6f0e2', '#1e3a8a', 'c'], ['#c62a2a', '#e8b030', 'd'],
  ['#2a6a3a', '#f6f0e2', 'h'], ['#1e3a8a', '#e8b030', 'c'], ['#f6f0e2', '#c62a2a', 'x'], ['#e8b030', '#1e3a8a', 'h']];
function hoist(u, A, B, n, size, seed, op = 1, dir = 1) {
  const R = rng(seed + 11);
  let out = `<path d="M${f(A[0])} ${f(A[1])}Q${f((A[0] + B[0]) / 2 - dir * size * .3)} ${f((A[1] + B[1]) / 2 + size * .6)} ${f(B[0])} ${f(B[1])}" stroke="#3a2a1a" stroke-width="${f(Math.max(.18, size * .07))}" fill="none" opacity="${op}"/>`;
  for (let k = 0; k < n; k++) {
    const t0 = (k + .25) / (n + .2), t1 = t0 + .55 / (n + .2), sag = t => Math.sin(t * Math.PI) * size * .3;
    const p0 = [A[0] + (B[0] - A[0]) * t0 - dir * sag(t0) * .3, A[1] + (B[1] - A[1]) * t0 + sag(t0)], p1 = [A[0] + (B[0] - A[0]) * t1 - dir * sag(t1) * .3, A[1] + (B[1] - A[1]) * t1 + sag(t1)];
    const w = size * (1.4 + R() * .3), fl = R() * .6 - .3, [c1, c2, pat] = COLS[(k + seed) % COLS.length], cid = nid('sf', u);
    const q0 = [p0[0] + dir * w, p0[1] + fl * size + size * .2], q1 = [p1[0] + dir * w, p1[1] + fl * size + size * .25];
    const d = `M${f(p0[0])} ${f(p0[1])}Q${f(p0[0] + dir * w * .5)} ${f(p0[1] - size * .25)} ${f(q0[0])} ${f(q0[1])}L${f(q1[0])} ${f(q1[1])}Q${f(p1[0] + dir * w * .5)} ${f(p1[1] + size * .2)} ${f(p1[0])} ${f(p1[1])}Z`;
    out += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><g opacity="${op}"><path d="${d}" fill="${c1}"/><g clip-path="url(#${cid})">`;
    const mx = (p0[0] + q1[0]) / 2, my = (p0[1] + q1[1]) / 2;
    if (pat === 'h') out += `<rect x="${f(mx - w)}" y="${f(my)}" width="${f(w * 2)}" height="${f(size * 2)}" fill="${c2}"/>`;
    else if (pat === 'v') out += `<rect x="${f(dir > 0 ? mx : mx - w)}" y="${f(my - size * 2)}" width="${f(w)}" height="${f(size * 4)}" fill="${c2}"/>`;
    else if (pat === 'x') out += `<path d="M${f(p0[0])} ${f(p0[1])}L${f(q1[0])} ${f(q1[1])}M${f(p1[0])} ${f(p1[1])}L${f(q0[0])} ${f(q0[1])}" stroke="${c2}" stroke-width="${f(size * .32)}"/>`;
    else if (pat === 'c') out += `<path d="M${f(mx)} ${f(my - size)}V${f(my + size)}M${f(mx - w)} ${f(my)}H${f(mx + w)}" stroke="${c2}" stroke-width="${f(size * .3)}"/>`;
    else out += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(size * .32)}" fill="${c2}"/>`;
    out += `<path d="M${f(mx)} ${f(my - size)}V${f(my + size)}" stroke="#000" stroke-width="${f(size * .35)}" opacity=".16"/></g>`
      + `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p0[0] + dir * w * .5)} ${f(p0[1] - size * .25)} ${f(q0[0])} ${f(q0[1])}" stroke="#fff8e8" stroke-width="${f(size * .1)}" fill="none" opacity=".6"/></g>`;
  }
  return out;
}

/** The order pinned to the mast: a sheet wider than the mast, its sides bending round it (the edges darker as they
 *  turn away), a flourish at the head, lines of a fair hand (strokes, no letters), the Company's seal on a red and
 *  white ribbon at the foot; the lower right corner lifting in the wind; a dirk through its head into the wood. */
function order(u, L, R) {
  const cx = MAST.x, y0 = 44, y1 = 100, hw = 25, g = nid('or', u), sh = nid('os', u);
  // the sheet's outline: the top and bottom edges curve (they wrap round the mast), the lower right corner lifted
  const T = t => [cx - hw + 2 * hw * t, y0 + Math.pow(2 * t - 1, 2) * 3.2], Bt = t => [cx - hw + 2 * hw * t, y1 + Math.pow(2 * t - 1, 2) * 3.2];
  let d = `M${P2(T(0))}`; for (let i = 1; i <= 10; i++) d += `L${P2(T(i / 10))}`;
  d += `L${f(cx + hw)} ${f(y1 - 14)}Q${f(cx + hw + 7)} ${f(y1 - 4)} ${f(cx + hw + 4)} ${f(y1 + 6)}Q${f(cx + hw - 6)} ${f(y1 + 1)} ${f(cx + hw - 12)} ${f(y1 + 1.4)}`;
  for (let i = 5; i >= 0; i--) d += `L${P2(Bt(i / 10))}`; d += 'Z';
  let s = `<defs>${linGrad(g, cx - hw, 0, cx + hw, 0, [[0, '#a89a7a'], [.18, '#f2e8cc'], [.45, '#fffaea'], [.75, '#e8dcbc'], [1, '#9a8c6c']])}<filter id="${sh}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter></defs>`;
  s += `<path d="${d}" fill="#2a1608" opacity=".45" filter="url(#${sh})" transform="translate(2.4 2)"/><path d="${d}" fill="url(#${g})" stroke="#7a6a4a" stroke-width=".4"/>`;
  // the lifted corner shows its back (darker), with the wind's light on its edge
  s += `<path d="M${f(cx + hw)} ${f(y1 - 14)}Q${f(cx + hw + 7)} ${f(y1 - 4)} ${f(cx + hw + 4)} ${f(y1 + 6)}Q${f(cx + hw - 2)} ${f(y1 - 4)} ${f(cx + hw - 3)} ${f(y1 - 11)}Z" fill="#cfc2a0" stroke="#7a6a4a" stroke-width=".3"/>`;
  // the head: a broad flourish and the crest of the Company (a shield with a cross)
  const S = (a, b) => { const t = T(a), q = Bt(a); return [lerp(t[0], q[0], b), lerp(t[1], q[1], b)]; };
  s += `<path d="M${P2(S(.16, .08))}Q${P2(S(.5, -.02))} ${P2(S(.84, .08))}" stroke="#3a2a18" stroke-width="1.3" fill="none"/><path d="M${P2(S(.26, .14))}Q${P2(S(.5, .1))} ${P2(S(.74, .14))}" stroke="#5a4a30" stroke-width=".45" fill="none"/>`;
  { const c = S(.5, .22); s += `<path d="M${f(c[0] - 4)} ${f(c[1] - 3)}h8v2.6q0 3.4 -4 4.8q-4 -1.4 -4 -4.8z" fill="#f4ecdc" stroke="#7a1a14" stroke-width=".5"/><path d="M${f(c[0])} ${f(c[1] - 3)}v7.4M${f(c[0] - 4)} ${f(c[1] - .6)}h8" stroke="#a8261e" stroke-width=".9"/>`; }
  // the lines: following the sheet's curve round the mast
  for (let k = 0; k < 8; k++) { const b = .36 + k * .057, a1 = k === 7 ? .55 : .88 - (k % 3) * .04; let p = '';
    for (let i = 0; i <= 10; i++) { const a = lerp(.12, a1, i / 10), q = S(a, b); p += (i ? 'L' : 'M') + P2(q); }
    s += `<path d="${p}" stroke="#4a3a28" stroke-width=".45" fill="none" stroke-dasharray="${f(1.6 + R() * 2)} ${f(.6 + R() * .5)}" opacity=".85"/>`; }
  // the signature flourish and the seal on its ribbon at the foot, left of the lifted corner
  { const c = S(.36, .9); s += `<path d="M${f(c[0] + 8)} ${f(c[1] - 2)}q6 -4 12 -1q-4 2 -8 1" stroke="#2a1a10" stroke-width=".55" fill="none"/>`
      + `<path d="M${f(c[0] - 2)} ${f(c[1])}l-2 10l2 -1.6l1.4 2.2l.6 -10.4zM${f(c[0] + 2)} ${f(c[1])}l3 9.6l1 -2.2l2 1.4l-3.4 -9.4z" fill="#b8302a" stroke="#4a0a06" stroke-width=".3"/><path d="M${f(c[0] - 3)} ${f(c[1] + 2)}l-1.2 6.4M${f(c[0] + 3)} ${f(c[1] + 2)}l1.8 6" stroke="#f4ece0" stroke-width=".7"/>`
      + `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="5.2" fill="#a81a14" stroke="#4a0806" stroke-width=".4"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="3.2" fill="none" stroke="#e86a5a" stroke-width=".45"/>`
      + `<path d="M${f(c[0])} ${f(c[1] - 2.2)}v4.4M${f(c[0] - 2.2)} ${f(c[1])}h4.4" stroke="#e86a5a" stroke-width=".8"/><path d="M${f(c[0] - 3.6)} ${f(c[1] - 2)}q2 -2.4 5 -2.4" stroke="#ffc0b0" stroke-width=".6" fill="none"/>`; }
  // the edges turning away round the mast: a soft shade along both sides
  s += `<path d="M${P2(T(0))}L${P2(Bt(0))}" stroke="#6a5a3a" stroke-width="1.2" opacity=".5"/>`;
  // the dirk through the sheet's head into the mast: the blade's stub, the cross-guard, the grip, the pommel
  { const p = S(.6, .05), a = 142 * Math.PI / 180,   // the hilt hangs down to the right, clear of the corner badge
    ux = Math.sin(a), uy = -Math.cos(a), q = [p[0] + ux * 15, p[1] + uy * 15];
    s += `<path d="M${f(p[0] + 1)} ${f(p[1] + 1.4)}L${f(q[0] + 2.6)} ${f(q[1] + 1.6)}" stroke="#2a1608" stroke-width="2.4" opacity=".35" stroke-linecap="round"/>`
      + `<path d="M${P2(p)}L${f(p[0] + ux * 2)} ${f(p[1] + uy * 2)}" stroke="#c8d0d6" stroke-width="1.4"/>`
      + `<path d="M${f(p[0] + ux * 2 - uy * 4.6)} ${f(p[1] + uy * 2 + ux * 4.6)}L${f(p[0] + ux * 2 + uy * 4.6)} ${f(p[1] + uy * 2 - ux * 4.6)}" stroke="#7a5a18" stroke-width="2.4" stroke-linecap="round"/><path d="M${f(p[0] + ux * 1.6 - uy * 4.2)} ${f(p[1] + uy * 1.6 + ux * 4.2)}L${f(p[0] + ux * 1.6 + uy * 4.2)} ${f(p[1] + uy * 1.6 - ux * 4.2)}" stroke="#f0d070" stroke-width=".7" stroke-linecap="round"/>`
      + K.shadeCyl(u, p[0] + ux * 2.8, p[1] + uy * 2.8, p[0] + ux * 12.8, p[1] + uy * 12.8, 1.7, L, 'leather', { r1: 1.5, r2: 1.9, outline: .35 })
      + [5, 8, 11].map(t => `<path d="M${f(p[0] + ux * t - uy * 1.7)} ${f(p[1] + uy * t + ux * 1.7)}L${f(p[0] + ux * t + uy * 1.7)} ${f(p[1] + uy * t - ux * 1.7)}" stroke="#c9a048" stroke-width=".45"/>`).join('')
      + K.shadeSphere(u, q[0], q[1], 2.5, L, 'brass', { outline: .35 }); }
  return s;
}

module.exports.parts = { soldier, order, mast, light, HZ, EYE };
