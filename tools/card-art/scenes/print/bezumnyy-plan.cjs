// «Безумный план» (Жемчужина, ПРИКАЗ: возьмите 2 карты, затем положите 1 карту с руки в План), refined from the
// first-round scene (portrait-pearl.cjs SCENES['Безумный план']): the captain's table at night under the stern window,
// a chart with a route drawn and crossed out again and again, red crosses, ink blots, a candle, a bottle, a dagger —
// and a card face down pushed under the edge of the chart. The concept and its find stay (the card hidden under the
// mad plan); the brief's people join it: the captain leans over the table, his left forefinger on the crossed-out
// route — look here — while his right hand, two fingers on a face-down card, slides it under the chart's edge. Across
// the table a sailor stares at the pointing finger, brows up, mouth open; he does not see the card go.
// Fixed against the first round: a flat table seen from above with no room round it — now the cabin in 2.5D (the
// stern window in the back wall, the beams overhead running to one vanishing point, the table top in perspective);
// the chart was a flat strip — now a sheet lying on the table, rolled at its far and near ends; the hidden card was a
// shape cut off by the frame — now it shows half under the chart with the fingers on it. Light: the candle on the
// table between the two men (key, warm: their faces lit from the middle); the moon through the window behind them
// (cold rim on hair, hat and shoulders, a pale patch on the table).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { tricorn } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, blurF } = PK;

const HZ = 72, VX = 112;                               // eye level and the vanishing point
const TF = 86;                                         // the table's far edge
const CAND = { x: 114, y: 95, s: 1.5, len: 12 };
const FL = { x: CAND.x + .2, y: CAND.y - (3.4 + CAND.len + 3) * CAND.s };
const WIN = { x0: 34, x1: 166, y0: 6, y1: 54 };
const CAP = { c: [74, 52], r: 15 }, SAIL = { c: [158, 58], r: 13 };
const MAP = [[72, 92], [164, 90], [176, 130], [66, 134]];   // the chart on the table: far left, far right, near right, near left
const light = { time: 'night', haze: .2, key: { type: 'point', x: FL.x, y: FL.y, h: .45, gy: CAND.y, color: '#ffbe6a', power: 1, radius: 110 },
  fill: { color: '#3a4664', power: .35 }, rim: { az: 0, color: '#b8ccff', power: .5 } };
const lightOut = { time: 'night', haze: .2, key: { type: 'moon', x: 112, y: 20, el: 20, color: '#e8eeff', power: .8 } };
const skel = { horizon: HZ, eye: 1.3, light: 'candle on the table between them (key, warm) + the moon through the stern window behind (cold rim)', items: [
  ['back wall + window', -10, TF, 220, TF, 'the stern'], ['table', -10, 290, 220, 204, 'top from y 86'], ['chart', 58, 134, 118, 44, 'on the table'],
  ['captain', 44, TF, 62, 66, 'behind the table, leaning over it'], ['sailor', 134, TF, 50, 54, 'behind the table'],
  ['hidden card', 38, 132, 44, 26, 'between his index (on it) and middle finger (under it), its far end under the chart'], ['right hand', 22, 130, 34, 20, 'over the table'], ['deck', 38, 106, 18, 10, 'on the table'], ['left hand', 104, 120, 34, 22, 'pointing on the chart'],
  ['candle', 104, CAND.y + 2, 20, 46, 'on the table'], ['bottle', 176, 104, 12, 32, 'on the table'], ['dagger', 150, 106, 8, 20, 'driven into the table']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const SKIN = { lit: '#f2c296', half: '#c4865a', core: '#a46a44', shadow: '#5e3422', outline: '#26120a' };
// each man his own skin under the same light: the captain sunburnt ('tan'), the sailor 'dark'
const CSK = H.skinTone('tan', SKIN), SSK = H.skinTone('dark', SKIN);
// the chart's own coordinates (s across, t from far to near) -> the picture
const mp = (s, t) => [lerp(lerp(MAP[0][0], MAP[1][0], s), lerp(MAP[3][0], MAP[2][0], s), t), lerp(lerp(MAP[0][1], MAP[1][1], s), lerp(MAP[3][1], MAP[2][1], s), t)];
// a playing card face down, lying on the table: the deck's night-blue back with a silver rosette and waves
function card(u, c, a, s, sq = .62) {
  const id = nid('cd', u);
  return `<g transform="translate(${f(c[0])} ${f(c[1])}) scale(1 ${sq}) rotate(${f(a)}) scale(${f(s)})"><defs>${linGrad(id, -9, -13, 9, 13, [[0, '#fff8e6', 1], [.5, '#ecdcb6', 1], [1, '#b8a47e', 1]])}</defs>`
    + `<rect x="-8.2" y="-12" width="18" height="26" rx="1.6" fill="#000" opacity=".35"/><rect x="-9" y="-13" width="18" height="26" rx="1.6" fill="url(#${id})" stroke="#5a4a30" stroke-width=".35"/>`
    + `<rect x="-7.5" y="-11.5" width="15" height="23" rx="1" fill="#1c2a44"/>`
    + [-8, -4.6, -1.2, 2.2, 5.6, 9].map(y => `<path d="M-7 ${y}q1.75 -1.3 3.5 0t3.5 0t3.5 0t3.5 0" stroke="#a8b8d0" stroke-width=".3" fill="none" opacity=".6"/>`).join('')
    + `<circle r="3.6" fill="#1c2a44" stroke="#c8d4e4" stroke-width=".5"/><path d="M0 -2.8L.85 0L0 2.8L-.85 0zM-2.8 0L0 -.85L2.8 0L0 .85z" fill="#e8eef8"/>`
    + `<rect x="-6.6" y="-10.6" width="13.2" height="21.2" rx=".7" fill="none" stroke="#c8d4e4" stroke-width=".35"/><path d="M-8.4 -12.6h16.4" stroke="#ffffff" stroke-width=".5" opacity=".6"/></g>`;
}

module.exports = { name: 'Безумный план', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: 40 }), R = rng(13);
    // ——— the back wall: dark vertical planks, the beams overhead running to the vanishing point ———
    let bg = PK.woodTex(u, -10, 0, 220, TF + 4, '#3a2414', '#1e1008', '#0a0603', 9, true, 6);
    { const g = nid('bw', u); bg += `<defs>${radGrad(g, FL.x, FL.y, 120, [[0, '#ffb060', .3], [.5, '#ff9a40', .1], [1, '#ff9a40', 0]])}</defs><rect x="-10" y="0" width="220" height="${TF + 4}" fill="url(#${g})"/>`; }
    for (const bx of [8, 72, 152, 196]) { const t = 1.7, x0 = bx, x1 = VX + (bx - VX) * .82;
      bg += `<path d="M${x0 - 5} -2L${x0 + 5} -2L${f(x1 + 4)} 5L${f(x1 - 4)} 5Z" fill="url(#oak${u})" stroke="#0a0603" stroke-width=".4"/><path d="M${f(x1 - 4)} 5H${f(x1 + 4)}" stroke="#0a0603" stroke-width="${t}"/>`; }
    bg += `<rect x="-10" y="4" width="220" height="3" fill="#120a05"/>`;
    // ——— the stern window: three lights of small panes, the night sea, the moon; deep frame, a sill ———
    { const { x0, x1, y0, y1 } = WIN, cl = nid('wc', u);
      bg += `<rect x="${x0 - 4}" y="${y0 - 3}" width="${x1 - x0 + 8}" height="${y1 - y0 + 7}" fill="#140c06"/>`
        + `<defs><clipPath id="${cl}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><g clip-path="url(#${cl})">`
        + K.sky(u, Lo, { horizon: 42, stars: 40, seed: 7 }) + K.sunMoon(u, Lo, { r: 4.6 }) + K.water(u, Lo, { horizon: 42, bottom: y1 + 2, swell: .3, seed: 4, glitter: 112 }) + `</g>`;
      // mullions: a heavy frame, two posts between the lights, small panes in each
      const posts = [x0, lerp(x0, x1, 1 / 3), lerp(x0, x1, 2 / 3), x1];
      for (const x of posts) bg += `<rect x="${f(x - 2)}" y="${y0 - 2}" width="4" height="${y1 - y0 + 4}" fill="#2a1a0c" stroke="#0a0603" stroke-width=".4"/><path d="M${f(x + 1.6)} ${y0}V${y1}" stroke="#b8ccf0" stroke-width=".35" opacity=".5"/>`;
      for (let i = 0; i < 3; i++) { const a = posts[i] + 2, b = posts[i + 1] - 2;
        for (const yy of [lerp(y0, y1, 1 / 3), lerp(y0, y1, 2 / 3)]) bg += `<path d="M${f(a)} ${f(yy)}H${f(b)}" stroke="#2a1a0c" stroke-width="1.1"/>`;
        bg += `<path d="M${f((a + b) / 2)} ${y0}V${y1}" stroke="#2a1a0c" stroke-width=".9"/>`
          + `<path d="M${f(a + 2)} ${y0 + 4}l7 -2M${f(a + 4)} ${f(lerp(y0, y1, 2 / 3) + 4)}l6 -1.6" stroke="#e0ecff" stroke-width=".4" opacity=".3"/>`; }
      bg += `<rect x="${x0 - 3}" y="${y0 - 3}" width="${x1 - x0 + 6}" height="2.4" fill="url(#oak${u})"/><path d="M${x0 - 6} ${y1 + 3}h${x1 - x0 + 12}l-2 3h${-(x1 - x0 + 8)}z" fill="#4a2c16" stroke="#0a0603" stroke-width=".4"/><path d="M${x0 - 6} ${y1 + 3}h${x1 - x0 + 12}" stroke="#ffcf96" stroke-width=".5" opacity=".6"/>`; }

    // ——— the two men behind the table: torsos first (the table hides them below its edge) ———
    let back = '';
    const coat = { lit: '#3c4a78', half: '#1e2848', shadow: '#0a0e1e', outline: '#04060e' };
    { const g = nid('cc', u), c = CAP.c[0];
      back += `<defs>${linGrad(g, c - 30, 0, c + 30, 0, [[0, '#141a30', 1], [.55, '#26305a', 1], [1, '#3a4a7a', 1]])}</defs>`
        + `<path d="M${c - 34} 100L${c - 30} 78Q${c - 26} 68 ${c - 14} 66L${c - 7} 62Q${c} 66 ${c + 7} 62L${c + 14} 66Q${c + 26} 68 ${c + 30} 78L${c + 34} 100Z" fill="url(#${g})" stroke="#04060e" stroke-width=".5"/>`
        // the gold-laced edges of the coat, a waistcoat, the shirt's frill at the throat
        + `<path d="M${c - 8} 64L${c - 12} 100M${c + 8} 64L${c + 12} 100" stroke="url(#brass${u})" stroke-width="1.2"/>`
        + `<path d="M${c - 7} 64Q${c} 72 ${c + 7} 64L${c + 11} 100H${c - 11}Z" fill="#6a1a14" stroke="#200604" stroke-width=".4"/>`
        + [74, 82, 90].map(y => K.shadeSphere(u, c + .3, y, 1, L, 'brass', { outline: .2 })).join('')
        + `<path d="M${c - 5} 62q5 6 10 0l-2 9q-3 2 -6 0z" fill="#f0e8d6" stroke="#6a6050" stroke-width=".3"/>`
        + Array.from({ length: 4 }, (_, k) => `<path d="M${c - 3 + k * 2} ${64 + k * .6}q1 2 0 4" stroke="#a8a090" stroke-width=".3" fill="none"/>`).join('')
        // the moon's rim on his shoulders, from behind
        + `<path d="M${c - 30} 78Q${c - 26} 68 ${c - 14} 66M${c + 14} 66Q${c + 26} 68 ${c + 30} 78" stroke="#b8ccff" stroke-width=".7" fill="none" opacity=".6"/>`
        + `<path d="M${c - 4.6} 53L${c + 4.6} 53L${c + 5.6} 63Q${c} 66 ${c - 5.6} 63Z" fill="${CSK.half}" stroke="${CSK.outline}" stroke-width=".35"/>`; }
    { const c = SAIL.c[0], g = nid('sc', u), cl = nid('scl', u);
      // the sailor: a striped shirt under an open sleeveless jerkin
      const body = `M${c - 26} 100L${c - 24} 82Q${c - 21} 72 ${c - 11} 70L${c - 5} 67Q${c} 70 ${c + 5} 67L${c + 11} 70Q${c + 21} 72 ${c + 24} 82L${c + 26} 100Z`;
      back += `<defs>${linGrad(g, c - 26, 0, c + 26, 0, [[0, '#e8e0cc', 1], [.6, '#a8a090', 1], [1, '#6a6458', 1]])}<clipPath id="${cl}"><path d="${body}"/></clipPath></defs>`
        + `<path d="${body}" fill="url(#${g})" stroke="#1a1408" stroke-width=".5"/><g clip-path="url(#${cl})">`
        + Array.from({ length: 8 }, (_, k) => `<path d="M${c - 30} ${71 + k * 4}Q${c} ${73 + k * 4} ${c + 30} ${71 + k * 4}" stroke="#2a3a5a" stroke-width="1.6" fill="none"/>`).join('')
        + `<path d="M${c - 30} 66L${c - 8} 68L${c - 10} 100H${c - 30}ZM${c + 30} 66L${c + 8} 68L${c + 10} 100H${c + 30}Z" fill="#4a3220" stroke="#1a0e06" stroke-width=".4"/></g>`
        + `<path d="M${c - 24} 82Q${c - 21} 72 ${c - 11} 70" stroke="#ffc888" stroke-width=".6" fill="none" opacity=".6"/>`
        + `<path d="M${c - 4} 59L${c + 4} 59L${c + 5} 68Q${c} 71 ${c - 5} 68Z" fill="${SSK.half}" stroke="${SSK.outline}" stroke-width=".35"/>`; }
    // ——— the heads ———
    const ch = H.head34(u, { c: CAP.c, r: CAP.r, turn: .32, dir: 1, nod: 10, skin: 'tan', tone: SKIN, light: [.8, -.4], warm: { color: '#ffb46a', op: .45 },
      look: [.45, .55], brow: 'sly', smile: .55, hair: { style: 'tied', color: '#2a1a10', ribbon: '#1a2a4a' }, hairColor: '#22140a', beard: 'goatee', moustache: true, iris: '#3a2416' });
    const hat = tricorn(u, ch, { r: CAP.r, color: '#1a1820', trim: '#c8a048', light: [.8, -.4], rim: '#b8ccff', y: -.6 });
    const sh = H.head34(u, { c: SAIL.c, r: SAIL.r, turn: .38, dir: -1, nod: 8, skin: 'dark', tone: SKIN, light: [-.85, -.35], warm: { color: '#ffb46a', op: .45 },
      look: [-.6, .45], brow: 'up', eye: 'wide', mouth: .4, hair: { style: 'curly', color: '#5a3a1e' }, hairColor: '#4a2e18', iris: '#4a3a24' });
    // a red kerchief knotted round the sailor's neck, under his chin (drawn before the head: the jaw over its middle,
    // the band showing either side and the knot with its ends below the chin)
    let kerch = '';
    { const c = SAIL.c[0]; kerch = `<path d="M${c - 7.4} 69Q${c} 73.4 ${c + 7.4} 69L${c + 7.8} 72.4Q${c} 77.4 ${c - 7.8} 72.4Z" fill="#8a2a1c" stroke="#2a0806" stroke-width=".3"/>`
        + `<path d="M${c - 6.6} 71.6Q${c} 75.6 ${c + 6.6} 71.6" stroke="#4a1008" stroke-width=".35" fill="none" opacity=".7"/>`
        + `<path d="M${c + .4} 74.4l1.6 6.4l1.8 -4.6z" fill="#7a2418" stroke="#2a0806" stroke-width=".3"/><path d="M${c - .6} 74.6l-2.2 5.4l2.8 -1.8z" fill="#6a1e12" stroke="#2a0806" stroke-width=".3"/>`
        + `<ellipse cx="${c}" cy="74.6" rx="1.7" ry="1.3" fill="#9a3222" stroke="#2a0806" stroke-width=".3"/><path d="M${c - 1} 74.1q1 -.6 2 0" stroke="#d86a4a" stroke-width=".3" fill="none" opacity=".7"/>`; }
    back += ch.svg + hat.back + hat.front + kerch + sh.svg;
    { const e = sh.Q(.84, .36, -.1); back += `<circle cx="${f(e[0])}" cy="${f(e[1] + 1)}" r="1.1" fill="none" stroke="url(#brass${u})" stroke-width=".55"/>`; }


    // ——— the table: the top in perspective (planks running to the vanishing point), the edge catching the candle ———
    let tab = '';
    { const g = nid('tt', u), cl = nid('tcl', u);
      tab += `<defs>${linGrad(g, 0, TF, 0, 200, [[0, '#3a2412', 1], [.3, '#6a4426', 1], [1, '#2a180a', 1]])}<clipPath id="${cl}"><rect x="-10" y="${TF}" width="220" height="210"/></clipPath></defs>`
        + `<rect x="-10" y="${TF}" width="220" height="210" fill="url(#${g})"/><g clip-path="url(#${cl})">`;
      for (let k = -9; k <= 10; k++) { const xb = VX + k * 26, xt = VX + (xb - VX) * ((TF - HZ) / (300 - HZ)); tab += `<path d="M${f(xt)} ${TF}L${f(xb)} 300" stroke="#1a0e06" stroke-width=".7"/><path d="M${f(xt + .5)} ${TF}L${f(xb + 2)} 300" stroke="#b07a48" stroke-width=".3" opacity=".35"/>`; }
      for (let k = 0; k < 40; k++) { const y = TF + 2 + R() * 70, x = R() * 200; tab += `<path d="M${f(x)} ${f(y)}q${f((x - VX) * .02)} ${f(4 + R() * 6)} ${f((x - VX) * .05)} ${f(10 + R() * 10)}" stroke="#24140a" stroke-width=".3" fill="none" opacity=".5"/>`; }
      tab += `</g><path d="M-10 ${TF}H210" stroke="#0a0603" stroke-width="1.4"/><path d="M-10 ${TF + 1}H210" stroke="#ffc078" stroke-width=".5" opacity=".5"/>`;
      // the moon's pale patch on the table under the window; the candle's warm pool
      tab += `<path d="M44 ${TF + 1}L160 ${TF + 1}L190 ${TF + 26}L30 ${TF + 26}Z" fill="#a8c0f0" opacity=".08"/>` + K.localGlow(u, { x: CAND.x, y: CAND.y + 8, color: '#ffb060', power: .55, radius: 60 }, { squash: .35, core: false }); }

    // ——— the hidden card in his right hand (on our left): the hand palm down just over the table, the ring and little
    // finger curled under, the index and middle finger out straight; the card between them — the index finger on it
    // (in front, over the card), the middle finger under it (behind) — its far end already slipped under the chart's
    // left edge. people.cjs hand3: m 1 (a right hand from his side), roll −53 (the back up, seen from above like the table)
    const SQ = .6;
    const hr = H.hand3(u, { at: [27, 117], a: 20, s: 2.75, m: 1, roll: -53, pitch: 0, pose: 'scissor', tone: CSK, light: [.8, -.5], sw: .3,
      flex: [[-4, 4, 2], [8, 6, 4], [70, 96, 56], [74, 96, 56]], yaw: [1, -2, 8, 12], thumbFlex: [0, 6, 8], thumbSpread: 10, backFingers: [1, 2, 3] });
    // the card: its plane is the table's (squashed SQ); its long side along the fingers; its near end clamped between
    // their middle joints
    const hax = [Math.cos(20 * Math.PI / 180), Math.sin(20 * Math.PI / 180) / SQ], th = Math.atan2(hax[1], hax[0]);
    const clamp = [(hr.joints[0][1][0] + hr.joints[1][1][0]) / 2, (hr.joints[0][1][1] + hr.joints[1][1][1]) / 2], CS = 1.5, cl0 = 13 * CS - 2.4;
    // held by its near long edge: the card lies to the far side of the fingers, so the middle finger shows under it
    const off = 13.5 * CS / 1.5 - 3.4, CC = [clamp[0] + Math.cos(th) * cl0 + Math.sin(th) * off, clamp[1] + (Math.sin(th) * cl0 - Math.cos(th) * off) * SQ];
    let hidden = hr.back + card(u, CC, th * 180 / Math.PI - 90, CS, SQ);
    // the deck he drew from: a short stack face down by his elbow, the top two cards pushed askew
    for (let k = 0; k < 5; k++) tab += card(u, [47 + k * .1, 102 - k * .7], -96 + (k > 3 ? 9 : k > 2 ? 4 : 0), .95, SQ);

    // ——— the chart: a sheet of old paper, rolled at its far and near ends; coasts, the route drawn and crossed out ———
    let chart = '';
    { const out = [mp(0, 0), mp(.25, -.01), mp(.5, .005), mp(.75, -.01), mp(1, 0), mp(1, .5), mp(1, 1), mp(.75, 1.01), mp(.5, .995), mp(.25, 1.01), mp(0, 1), mp(-.005, .5)], g = nid('pp', u);
      chart += `<path d="M${out.map(P2).join('L')}Z" fill="#000" opacity=".35" transform="translate(2 2.4)"/>`
        + `<path d="M${P2(mp(0, .55))}L${P2(mp(0, 1))}" stroke="#000" stroke-width="2.4" opacity=".3" transform="translate(-1.2 .4)"/>`
        + `<defs>${radGrad(g, CAND.x, CAND.y + 6, 80, [[0, '#f6e6c0', 1], [.6, '#dcc08a', 1], [1, '#9a7a48', 1]])}</defs><path d="M${out.map(P2).join('L')}Z" fill="url(#${g})" stroke="#6a5030" stroke-width=".4"/>`;
      // stains, a mug's ring
      chart += `<ellipse cx="${f(mp(.72, .3)[0])}" cy="${f(mp(.72, .3)[1])}" rx="7" ry="3" fill="none" stroke="#8a5a30" stroke-width="1" opacity=".35"/><ellipse cx="${f(mp(.3, .7)[0])}" cy="${f(mp(.3, .7)[1])}" rx="9" ry="4" fill="#b08a50" opacity=".2"/>`;
      // the coasts: an island and the mainland, inked and hatched
      const isl = [[.12, .3], [.2, .18], [.32, .2], [.38, .34], [.3, .46], [.18, .44]].map(p => mp(...p));
      chart += `<path d="M${isl.map(P2).join('L')}Z" fill="#c8ac74" stroke="#3a2412" stroke-width=".5"/>`
        + `<path d="M${mp(.62, 0)[0]} ${mp(.62, 0)[1]}L${P2(mp(.6, .12))}L${P2(mp(.7, .2))}L${P2(mp(.68, .32))}L${P2(mp(.82, .4))}L${P2(mp(.9, .3))}L${P2(mp(1, .36))}L${P2(mp(1, 0))}Z" fill="#c8ac74" stroke="#3a2412" stroke-width=".5"/>`
        + Array.from({ length: 9 }, (_, k) => { const p = mp(.62 + k * .04, .06 + (k % 3) * .06); return `<path d="M${P2(p)}l1.6 1" stroke="#5a3a1a" stroke-width=".3"/>`; }).join('');
      // the route: tried again and again, each try crossed out; the last one in bold to a red cross
      const ink = '#2a1608', path = pts => 'M' + pts.map(p => P2(mp(...p))).join('L');
      chart += `<path d="${path([[.06, .9], [.2, .72], [.36, .62], [.48, .5], [.56, .3]])}" stroke="${ink}" stroke-width=".7" fill="none" stroke-dasharray="2 1.4" opacity=".7"/>`
        + `<path d="${path([[.06, .9], [.26, .86], [.44, .76], [.6, .64], [.7, .5]])}" stroke="${ink}" stroke-width=".7" fill="none" stroke-dasharray="2 1.4" opacity=".7"/>`
        + `<path d="${path([[.06, .9], [.16, .6], [.1, .1]])}" stroke="${ink}" stroke-width=".7" fill="none" stroke-dasharray="2 1.4" opacity=".6"/>`
        + `<path d="${path([[.06, .9], [.3, .96], [.5, .86], [.62, .9], [.8, .74], [.84, .56], [.94, .5]])}" stroke="${ink}" stroke-width="1.1" fill="none" stroke-dasharray="3 1.2"/>`;
      for (const [s, t] of [[.48, .5], [.6, .64], [.16, .6], [.36, .62]]) { const p = mp(s, t); chart += `<path d="M${f(p[0] - 3)} ${f(p[1] - 2)}l6 4M${f(p[0] + 3)} ${f(p[1] - 2)}l-6 4" stroke="#3a120a" stroke-width=".8"/>`; }
      { const p = mp(.94, .5); chart += `<path d="M${f(p[0] - 3.4)} ${f(p[1] - 2.4)}l6.8 4.8M${f(p[0] + 3.4)} ${f(p[1] - 2.4)}l-6.8 4.8" stroke="#a81a10" stroke-width="1.4"/>`; }
      // blots, a compass rose in the corner
      chart += `<ellipse cx="${f(mp(.4, .3)[0])}" cy="${f(mp(.4, .3)[1])}" rx="2.6" ry="1.4" fill="${ink}"/><circle cx="${f(mp(.44, .32)[0])}" cy="${f(mp(.44, .32)[1])}" r=".6" fill="${ink}"/>`;
      { const p = mp(.86, .84); chart += `<g transform="translate(${f(p[0])} ${f(p[1])}) scale(1 .5)"><circle r="5" fill="none" stroke="#5a3a1a" stroke-width=".4"/><path d="M0 -6L1 0L0 6L-1 0ZM-6 0L0 -1L6 0L0 1Z" fill="#5a3a1a"/><path d="M0 -6L1 0L0 0Z" fill="#a81a10"/></g>`; }
      // the rolls along the far and the near edge: each a paper cylinder with its spiral end
      const roll = (t, rr, dir) => { const a = mp(-.01, t), b = mp(1.01, t);
        return K.shadeCyl(u, a[0], a[1] - rr * dir * .4, b[0], b[1] - rr * dir * .4, rr, L, 'linen', { ell: .5, face: 2, outline: .35, grain: false, seed: 3 })
          + `<path d="M${f(b[0] - 1)} ${f(b[1] - rr * dir * .4)}m-1 0a1.4 1.6 0 1 0 2 -1" stroke="#7a6040" stroke-width=".3" fill="none"/>`; };
      chart += roll(0, 2.4, 1) + roll(1, 3.0, -1); }

    // ——— the captain's arms: the left (on our right) to the pointing hand, the right (on our left) to the card ———
    let arms = '';
    const hl = H.hand3(u, { at: [114, 112], a: 28, s: 2.3, m: 1, roll: 6, pitch: 8, pose: 'point', tone: CSK, light: [.1, -1], sw: .3, yaw: [-2, 6, 10, 14] });
    { const sleeve = (s0, el, w, lt) => H.cloth(u, { spine: [s0, [lerp(s0[0], el[0], .5), lerp(s0[1], el[1], .5)], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5)], [w[0], w[1]]],
        w: [12.6, 11.8, 11, 9.8, 8.6], tone: coat, lit: lt, rim: '#b8ccff', rimSide: -lt, rimOp: .4, seed: 4, drapes: 1, foldW: .8, sw: .4, capA: true,
        cuff: { from: .86, k: 1.1, tone: { lit: '#4a5a8a', half: '#26305a', shadow: '#0c1022', outline: '#04060e' } } });
      // one sleeve each, from the shoulder down to the elbow on the table and on to the wrist; a single cuff there
      arms += sleeve([52, 75], [16, 100], hr.wrist, -1) + sleeve([96, 76], [101, 98], hl.wrist, 1); }
    arms += hr.front + hl.back + hl.front;
    // a signet ring on the captain's pointing hand
    { const p = hl.P(5.6, 1.4, -.05); arms += K.shadeSphere(u, p[0], p[1], 1.1, L, 'brass', { outline: .2 }); }

    // ——— on the table: the candle (far middle), the bottle (right), the dagger in the wood, two more cards by his hand ———
    let props = '';
    props += K.castShadow(u, L, { x: 180, y: 106, w: 9 * 1.4, h: 20 * 1.4, horizon: HZ }) + K.bottle(u, L, { x: 180, y: 106, s: 1.4, kind: 'rum', seed: 5 });
    props += K.candle(u, L, { x: CAND.x, y: CAND.y, s: CAND.s, len: CAND.len, lit: true, seed: 4 });
    { const x = 152, y = 104; props += `<path d="M${x} ${y}l-1 1.6" stroke="#0a0603" stroke-width="1.2" opacity=".6"/>`
      + K.shadeCyl(u, x, y - .6, x - 1.6, y - 9, .9, L, 'iron', { r1: .3, r2: 1.2, outline: .25 })
      + K.shadeCyl(u, x - 1.6 - 3.4, y - 9.6, x - 1.6 + 3.4, y - 8.6, .8, L, 'brass', { outline: .25 })
      + K.shadeCyl(u, x - 1.7, y - 10, x - 3, y - 18, 1.3, L, 'leather', { outline: .3 }) + K.shadeSphere(u, x - 3.1, y - 19, 1.6, L, 'brass', { outline: .25 }); }

    // a pair of brass dividers left open on the chart, one point on the last red cross (where the plan ends)
    { const a = mp(.94, .5), b = mp(.7, .82), h = [lerp(a[0], b[0], .5) + 1, lerp(a[1], b[1], .5) - 6];
      props += `<path d="M${P2(a)}L${P2(h)}L${P2(b)}" stroke="#2a1a08" stroke-width="1.5" fill="none" opacity=".35" transform="translate(1.2 1.4)"/>`
        + `<path d="M${P2(a)}L${P2(h)}L${P2(b)}" stroke="url(#brass${u})" stroke-width="1.1" fill="none" stroke-linejoin="round"/>`
        + `<path d="M${f(h[0] - .4)} ${f(h[1] + .5)}L${f(a[0] - .3)} ${f(a[1] - .4)}" stroke="#fff0b0" stroke-width=".3" opacity=".7"/>`
        + K.shadeSphere(u, h[0], h[1], 1.3, L, 'brass', { outline: .25 }) + `<circle cx="${P2(a).split(' ')[0]}" cy="${P2(a).split(' ')[1]}" r=".4" fill="#1a1008"/>`; }
    // the inkwell and its quill at the chart's far edge, left of the dagger: a squat dark glass pot, a goose feather
    { const x = 137, y = 95.6;
      props += K.castShadow(u, L, { x, y, w: 7, h: 6, horizon: HZ })
        + `<path d="M${x - 3.6} ${y}Q${x - 4.2} ${y - 4.4} ${x - 2} ${y - 4.8}H${x + 2}Q${x + 4.2} ${y - 4.4} ${x + 3.6} ${y}Q${x} ${y + 1.2} ${x - 3.6} ${y}Z" fill="#141820" stroke="#05070a" stroke-width=".35"/>`
        + `<ellipse cx="${x}" cy="${y - 4.8}" rx="2" ry=".7" fill="#05070a"/><path d="M${x - 2.6} ${y - 3.6}q-.4 2 .2 3" stroke="#ffd8a0" stroke-width=".45" fill="none" opacity=".75"/>`
        + `<path d="M${x + .4} ${y - 5}L${x + 9} ${y - 19}" stroke="#d8ccb4" stroke-width=".35"/>`
        + `<path d="M${x + 3.6} ${y - 10}Q${x + 4} ${y - 17} ${x + 10.6} ${y - 21}Q${x + 9.4} ${y - 14} ${x + 4.6} ${y - 9.6}Z" fill="#ece2cc" stroke="#7a6c54" stroke-width=".3"/>`
        + `<path d="M${x + 4.6} ${y - 11}l1.6 -.4M${x + 5.6} ${y - 13.4}l1.8 -.2M${x + 7} ${y - 15.8}l1.6 0" stroke="#a89878" stroke-width=".25"/>`; }
    // ——— light: the candle's glow, its warmth on both faces; the moon's cold through the window; the dark below ———
    let fg = K.localGlow(u, { x: FL.x, y: FL.y, color: '#ffc070', power: 1, radius: 26 })
      + glow(u, FL.x, FL.y + 10, 90, 50, '#ffb060', .14) + glow(u, 100, 30, 70, 30, '#a8c0ff', .06)
      // dust in the candle's light (none over the faces: there it read as specks on the skin)
      + motes(14, 60, 20, 100, 60, '#ffe0b0', 5).replace(/<circle cx="([\d.]+)" cy="([\d.]+)"[^>]*\/>/g, (m, x, y) => [CAP, SAIL].some(h => Math.hypot(x - h.c[0], y - h.c[1]) < h.r * 1.25) ? '' : m)
      + gloom(u, 100, 120, 100, 280, .45) + gloom(u, 100, 60, 0, 60, .25) + gloom(u, 100, 60, 200, 60, .2);
    return [bg, back + tab + hidden + chart + arms + props + fg];
  } };
