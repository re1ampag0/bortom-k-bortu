// «Ловкость рук» (Жемчужина, РЕАКЦИЯ: карта противника после розыгрыша уходит вам в руку), refined from the
// accepted second-round scene (portrait-pearl.cjs SCENES['Ловкость рук']): a tavern at night, the brick wall with a
// lantern on an iron bracket and a shelf of bottles, a window on the moonlit harbour, the counter with stacks of coins.
// Jack's hand in a wide lace cuff rises from below with a card caught between the index and the middle finger — the
// card has just flown from the fan of an enemy officer at the counter. From the first round and the brief we take
// the find of the two hands: the officer's hand in a red coat sleeve with a blue facing still holds his fan — three
// cards and a wide gap where the fourth was; he has not noticed. The card's path runs from that gap: a blurred streak
// with two fading after-images.
// Fixed against the accepted scene: the hand was hand-drawn flat with stiff straight fingers — now a jointed hand
// (people.cjs hand3) seen from the palm: slim, narrowing to the wrist, the ring and little finger curled onto the
// palm with their nails to us, the thumb laid along the palm from the wrist to them; the officer's hand is larger,
// the fan open with the gap; the light: the lantern (key, warm, upper left) and the moon through the window (cold
// rim on the right edges, a pale patch on the counter).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes, blurF } = PK;

const HZ = 72, CT = 106, CF = 129;                    // eye level; the counter top: back edge (at the wall), front edge
const LAMP = { x: 36, y: 76, s: 1.05, hang: 2 };
const FLAME = { x: 36.1, y: 76 - 7.5 * 1.05 };
const WIN = { x: 136, y: 40, w: 50, h: 52 };
const light = { time: 'night', haze: .25, key: { type: 'point', x: FLAME.x, y: FLAME.y, h: 1.2, gy: CT + 8, color: '#ffbe6a', power: 1, radius: 120 },
  fill: { color: '#3a4664', power: .35 }, rim: { az: 60, color: '#b8ccff', power: .4 } };
const lightOut = { time: 'night', haze: .2, key: { type: 'moon', x: 170, y: 52, el: 18, color: '#e8eeff', power: .8 } };
const skel = { horizon: HZ, eye: 1.6, light: 'lantern on a bracket, upper left (key, warm) + the moon through the window (cold rim, patch on the counter)', items: [
  ['wall', 0, CT, 200, CT, 'behind the counter', { bg: 1 }], ['counter', 0, 134, 200, 28, 'ground: top y 106–129, front edge to 134', { edge: 1 }],
  ['lantern', 26, 78, 20, 36, 'hangs from the iron bracket in the wall'], ['shelf', 8, 100, 48, 24, 'two iron brackets in the wall'],
  ['window', WIN.x - 3, WIN.y + WIN.h + 4, WIN.w + 6, WIN.h + 7, 'set in the wall'], ['coins', 14, 126, 44, 14, 'on the counter'],
  ['officer hand + cards', 136, 122, 64, 40, 'his sleeve from the right edge, the forearm on the counter'],
  ['card', 76, 66, 42, 54, "in Jack's hand, between the index (in front) and the middle finger (behind)"],
  ['trail', 106, 104, 50, 60, 'from his fan to the card, in the air'], ['hand + sleeve', 52, 280, 92, 230, 'from the bottom edge, in front of the counter', { edge: 1 }]] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
// a playing card seen face down: ivory border, the deck's maroon back with gold waves and a rosette; paper shading
// from the lantern side, a lit edge, its thickness on the shadow side
function card(u, c, a, s, o = {}) {
  const id = nid('cd', u), sh = o.shade == null ? .5 : o.shade;
  let r = `<g transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(a)}) scale(${f(s)})"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}>`;
  r += `<defs>${linGrad(id, -9, -13, 9, 13, [[0, '#fff8e6', 1], [.5, '#ecdcb6', 1], [1, '#b8a47e', 1]])}</defs>`;
  if (o.shadow !== false) r += `<rect x="-8.2" y="-12" width="18" height="26" rx="1.6" fill="#000" opacity=".3"/>`;
  r += `<rect x="-9" y="-13" width="18" height="26" rx="1.6" fill="url(#${id})" stroke="#5a4a30" stroke-width=".35"/>`
    + `<rect x="-7.5" y="-11.5" width="15" height="23" rx="1" fill="#6a1c1c"/><rect x="-7.5" y="-11.5" width="15" height="23" rx="1" fill="#2a0606" opacity="${f(sh * .5)}"/>`
    + [-8, -4.6, -1.2, 2.2, 5.6, 9].map(y => `<path d="M-7 ${y}q1.75 -1.3 3.5 0t3.5 0t3.5 0t3.5 0" stroke="#d8ac52" stroke-width=".32" fill="none" opacity=".7"/>`).join('')
    + `<circle r="3.6" fill="#6a1c1c" stroke="#d8ac52" stroke-width=".55"/><path d="M0 -2.8L.85 0L0 2.8L-.85 0zM-2.8 0L0 -.85L2.8 0L0 .85z" fill="#f0cc72"/>`
    + `<rect x="-6.6" y="-10.6" width="13.2" height="21.2" rx=".7" fill="none" stroke="#d8ac52" stroke-width=".38"/>`
    + `<path d="M-8.4 -12.6h16.4" stroke="#ffffff" stroke-width=".55" opacity=".7"/><path d="M-8.7 -12.2v24.6" stroke="#fff4dc" stroke-width=".45" opacity=".6"/>`
    + `<path d="M9 -12.4v25" stroke="#4a3a24" stroke-width=".6" opacity=".7"/></g>`;
  return r;
}

module.exports = { name: 'Ловкость рук', variant: 's2', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: WIN.y + 38 }), R = rng(17);
    // ——— the brick wall: bricks of different fire, recessed mortar, the edge facing the lantern lit ———
    let bg = `<rect x="-10" y="-10" width="220" height="${CT + 10}" fill="#1e1009"/>`;
    for (let row = 0, y = -2; y < CT; row++, y += 7.4) for (let c = -1; c < 12; c++) {
      const x = c * 19 + (row % 2) * 9.5 + (R() - .5) * .8, w = 17.6 + (R() - .5) * .8, h = 6.3, cx = x + w / 2, cy = y + h / 2;
      const d = Math.hypot(cx - FLAME.x, cy - FLAME.y), k = Math.max(0, 1 - d / 150), base = ['#6e3a22', '#7a442a', '#62321c', '#86492c', '#70402a'][Math.floor(R() * 5)];
      bg += `<rect x="${f(x + .6)}" y="${f(y + .6)}" width="${f(w)}" height="${f(h)}" rx="1.1" fill="${mix(base, '#1a0c06', .45 - k * .45)}"/>`;
      const up = cy > FLAME.y;   // which edge faces the lamp
      bg += `<path d="M${f(x + 1.4)} ${f(up ? y + 1 : y + h + .2)}h${f(w - 1.8)}" stroke="${mix('#e0a070', '#ffd6a0', k)}" stroke-width="${f(.35 + k * .4)}" opacity="${f(.15 + k * .55)}"/>`
        + `<path d="M${f(x + 1)} ${f(up ? y + h + .2 : y + 1)}h${f(w - 1)}" stroke="#120804" stroke-width=".5" opacity=".55"/>`;
      if (R() < .25) bg += `<circle cx="${f(x + 2 + R() * (w - 4))}" cy="${f(y + 1.5 + R() * 4)}" r="${f(.4 + R() * .9)}" fill="#1a0c06" opacity=".35"/>`;
    }
    bg += glow(u, FLAME.x, FLAME.y + 6, 96, 80, '#ffb660', .38) + gloom(u, 120, 0, 200, 40, .45, '#0a0503') + gloom(u, 100, 50, 200, 108, .3, '#0a0503');
    // ——— the window: a deep reveal, the night harbour, the moon, a cross frame, the sill catching moonlight ———
    { const { x, y, w, h } = WIN, cl = nid('wc', u);
      bg += `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="#120a06"/>`
        + `<path d="M${x - 4} ${y - 4}h${w + 8}l-3.4 3.4h${-w - 1.2}z" fill="#3a2414"/><path d="M${x - 4} ${y - 4}v${h + 8}l3.4 -3.4v${-h - 1.2}z" fill="#2a180c"/>`
        + `<defs><clipPath id="${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${cl})">`
        + K.sky(u, Lo, { horizon: y + 38, stars: true, seed: 5 }) + K.sunMoon(u, Lo, { r: 4.6 })
        + K.water(u, Lo, { horizon: y + 38, bottom: y + h + 2, swell: .3, seed: 6, glitter: 170 })
        // a ship at anchor in the harbour, her lamp lit
        + `<path d="M${x + 8} ${y + 37.4}h14l-2 2h-10.6z" fill="#060a12"/><path d="M${x + 15} ${y + 37.4}v-14M${x + 11} ${y + 37.4}v-10M${x + 19.5} ${y + 37.4}v-11" stroke="#060a12" stroke-width=".7"/><path d="M${x + 9} ${y + 30}h4M${x + 12.6} ${y + 27}h5M${x + 17.6} ${y + 30}h4" stroke="#060a12" stroke-width=".5"/>`
        + `<circle cx="${x + 21}" cy="${y + 36.4}" r=".6" fill="#ffd890"/>` + glow(u, x + 21, y + 36.4, 3, 3, '#ffb050', .8)
        + `</g>`;
      bg += `<path d="M${x} ${y + h * .5}h${w}M${x + w / 2} ${y}v${h}" stroke="#2a180c" stroke-width="2.4"/><path d="M${x} ${f(y + h * .5 - 1)}h${w}M${f(x + w / 2 - 1)} ${y}v${h}" stroke="#6a4428" stroke-width=".45"/>`
        + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#2a180c" stroke-width="2.6"/><path d="M${x + 1.3} ${y + 1.3}h${w - 2.6}" stroke="#6a4428" stroke-width=".45"/>`
        + `<path d="M${x + 3} ${y + 5}l8 -1.2M${x + w / 2 + 3} ${y + h / 2 + 5}l7 -1" stroke="#d8e4ff" stroke-width=".45" opacity=".35"/>`
        + `<path d="M${x - 6} ${y + h + 3}h${w + 12}l-2.4 3.4h${-w - 7.2}z" fill="#4a2c16"/><path d="M${x - 6} ${y + h + 3}h${w + 12}" stroke="#b8ccf0" stroke-width=".55" opacity=".7"/>`
        + `<path d="M${x - 3.6} ${y + h + 6.4}h${w + 7.2}" stroke="#0a0604" stroke-width=".8"/>`; }
    // ——— the lantern on its iron bracket (a scroll under the arm), the shelf with bottles below ———
    { const by = LAMP.y - 29 * LAMP.s - LAMP.hang;
      bg += `<rect x="12.6" y="${f(by - 4)}" width="3.6" height="9" rx=".6" fill="#16110e"/><path d="M15.6 ${f(by)}H${LAMP.x + 1.4}" stroke="#16110e" stroke-width="1.5" stroke-linecap="round"/>`
        + `<path d="M16 ${f(by + 3.6)}q8 1 12 -3.4" stroke="#16110e" stroke-width=".9" fill="none"/><path d="M28 ${f(by + .2)}q-4 3.6 -7 1.6q-2.4 -2 .4 -3" stroke="#16110e" stroke-width=".7" fill="none"/>`
        + `<path d="M15.6 ${f(by - .5)}H${LAMP.x + 1}" stroke="#7a6a5a" stroke-width=".3" opacity=".6"/>`
        + `<path d="M${f(LAMP.x + 6)} ${f(by + 4)}l10 40l-26 0z" fill="#000" opacity=".0"/>`; }
    bg += K.lantern(u, L, { ...LAMP, lit: true, seed: 4 });
    { const sy = 97;
      bg += `<path d="M14 ${sy + 2}l4 7.4M50 ${sy + 2}l-4 7.4" stroke="#16110e" stroke-width="1.5"/>`
        + `<rect x="8" y="${sy - 2.6}" width="48" height="3.2" fill="url(#oak${u})" stroke="#1a0e06" stroke-width=".4"/><path d="M8 ${sy - 2.4}h48" stroke="#f0b878" stroke-width=".45" opacity=".75"/><rect x="8" y="${sy + .6}" width="48" height="2.4" fill="#000" opacity=".35"/>`
        + K.bottle(u, L, { x: 15.5, y: sy - 2.6, s: .62, kind: 'rum', seed: 3 }) + K.bottle(u, L, { x: 26, y: sy - 2.6, s: .7, kind: 'rum', seed: 5 })
        + K.bottle(u, L, { x: 37, y: sy - 2.6, s: .52, kind: 'empty', seed: 7 }) + K.bottle(u, L, { x: 47.5, y: sy - 2.6, s: .6, kind: 'rum', seed: 9 }); }
    // ——— the counter: planks across, the seams wider towards us, a rounded front edge, the panel below ———
    let mid = '';
    { const g = nid('ct', u);
      mid += `<defs>${linGrad(g, 0, CT, 0, CF, [[0, '#2e1a0c', 1], [1, '#6a4226', 1]])}</defs><rect x="-10" y="${CT}" width="220" height="${CF - CT}" fill="url(#${g})"/><path d="M-10 ${CT}H210" stroke="#0a0604" stroke-width="1.6"/>`;
      [110.6, 116.4, 123.4].forEach((y, i) => { mid += `<path d="M-10 ${y}H210" stroke="#160c06" stroke-width="${.5 + i * .25}"/><path d="M-10 ${f(y + .6 + i * .1)}H210" stroke="#d09658" stroke-width=".3" opacity="${.3 + i * .08}"/>`; });
      for (let k = 0; k < 26; k++) { const y = CT + 2 + R() * (CF - CT - 4), x = R() * 200, w = 8 + R() * 26 * (y - HZ) / 40; mid += `<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(R() - .5)} ${f(w)} 0" stroke="#24140a" stroke-width=".3" fill="none" opacity=".6"/>`; }
      // wet rings of mugs, a spill
      mid += `<ellipse cx="72" cy="113" rx="5.6" ry="1.5" fill="none" stroke="#1a0c06" stroke-width=".5" opacity=".6"/><ellipse cx="122" cy="125" rx="6.4" ry="1.7" fill="none" stroke="#1a0c06" stroke-width=".5" opacity=".5"/>`
        + glow(u, 40, 116, 70, 14, '#ffb860', .32);
      { const bf = blurF('cm' + u, 3); mid += bf + `<path d="M140 ${CT + 1.4}L180 ${CT + 1.4}L196 ${CF - 1.4}L146 ${CF - 1.4}z" fill="#a8c0f0" opacity=".14" filter="url(#cm${u})"/>`; }
      mid += `<rect x="-10" y="${CF}" width="220" height="5.4" fill="url(#oak${u})"/><path d="M-10 ${CF + .5}H210" stroke="#f0b878" stroke-width=".8" opacity=".75"/><path d="M-10 ${CF + 5.4}H210" stroke="#0a0604" stroke-width="1.4"/>`
        + `<rect x="-10" y="${CF + 5.4}" width="220" height="${280 - CF}" fill="#22130a"/>`
        + Array.from({ length: 6 }, (_, k) => `<rect x="${4 + k * 33}" y="${CF + 12}" width="27" height="130" rx="1" fill="#2c180c" stroke="#120804" stroke-width=".8"/><path d="M${5 + k * 33} ${CF + 13}h25" stroke="#6a4224" stroke-width=".5"/>`).join('')
        + `<path d="M-10 250H210" stroke="url(#brass${u})" stroke-width="2.4"/>`;
      // coins: stacks and a few loose, with their shadows, in the lantern light
      mid += K.coins(u, L, { x: 22, y: 122, n: 8, r: 3, seed: 3 }) + K.coins(u, L, { x: 38, y: 117, n: 6, r: 2.8, seed: 8 }) + K.coins(u, L, { x: 52, y: 125, n: 4, r: 2.8, seed: 12 });
    }
    // ——— the officer's arm on the counter from the right edge: red coat, blue cuff with gilt buttons, a white shirt
    // frill at the wrist; his hand holds the fan — two cards left, a gap between the fingers where the third one was ———
    let off = '', PIV = null;
    const FAN = [-56, -34, -10, 14], GAP = -10;   // the fan's cards (degrees from upright); the one at GAP is gone
    const OW = [178, 114], OA = 198, OS = 7.2, OK = 1.36;   // his wrist, the hand's direction and size, the sleeve's scale
    { const red = { lit: '#c84a3a', half: '#8a2a20', shadow: '#3e0e0c', outline: '#1a0606' }, blue = { lit: '#4a5a9a', half: '#26305e', shadow: '#0e1230', outline: '#06081a' };
      const shirt = { lit: '#fff8ec', half: '#d8ccb8', shadow: '#7a6e5e', outline: '#2a2218' };
      const skin = { lit: '#f0c6a0', half: '#c48a64', shadow: '#6a3e2a', outline: '#2a160c' };
      // the sleeve along the counter and the facing (cuff) turned back, its buttons (drawn at the old size, scaled up
      // about the old wrist onto the new one)
      off += `<g transform="translate(${OW[0]} ${OW[1]}) scale(${OK}) translate(-170 -106)">`;
      off += `<path d="M178 ${CT + 18}Q194 ${CT + 21} 214 ${CT + 18}" stroke="#000" stroke-width="7" opacity=".28" fill="none"/>`;
      off += H.cloth(u, { spine: [[218, 116], [196, 112], [178.6, 108.2]], w: [16, 14.6, 13], tone: red, lit: -1, rim: '#b8ccff', rimSide: 1, rimOp: .45, seed: 5, drapes: 2 });
      off += H.cloth(u, { spine: [[184.6, 109.6], [176, 107.2]], w: [16.6, 16], tone: blue, lit: -1, folds: false, sw: .45 })
        + [[181.6, 102.6], [180.6, 113.2]].map(([x, y]) => K.shadeSphere(u, x, y, 1.1, L, 'brass', { outline: .25 })).join('')
        + `<path d="M183.4 101.2Q180 108.6 182.6 116.6" stroke="#d8ac52" stroke-width=".7" fill="none"/>`;
      // the shirt frill at the wrist
      { let fr = ''; for (let k = 0; k < 7; k++) { const t = k / 6, y = lerp(100.4, 112.2, t), x = 175.4 + Math.sin(t * Math.PI) * 1.4;
          fr += `<path d="M${f(x)} ${f(y)}q-3.4 ${f(.6 - R() * .4)} -4.4 ${f(1.6)}q2.2 .8 4.4 .2z" fill="${k % 2 ? shirt.half : shirt.lit}" stroke="${shirt.shadow}" stroke-width=".25"/>`; }
        off += fr; }
      off += `</g>`;
      // his hand holds the fan as a card player does: the palm towards the backs of the cards (and us), the fingers
      // curled over the foot of the fan, the thumb behind it on the faces. Three cards and a wide gap in the fan where
      // the fourth was a moment ago
      const hd = H.hand3(u, { at: OW, a: OA, s: OS, m: 1, roll: 160, pitch: 0, pose: 'custom', flex: [[46, 66, 40], [52, 72, 44], [58, 78, 46], [62, 84, 50]], yaw: [-6, 0, 4, 8],
        thumbFlex: [10, 16, 10], thumbSpread: 0, tone: skin, light: [-.6, -.8], backFingers: ['thumb'], trueDorsal: true, sw: .36 });
      PIV = hd.P(3.3, -.9, -1.2);
      let fan = '';
      for (const a of FAN) if (a !== GAP) fan += card(u, [PIV[0] + Math.sin(a * Math.PI / 180) * 19, PIV[1] - Math.cos(a * Math.PI / 180) * 19], a, .96, { shade: .25 + (a + 50) / 300 });
      off += hd.back + fan + hd.front;
      // a gold signet ring on his little finger
      { const p = hd.joints[3][1]; off += K.shadeSphere(u, p[0] + .4, p[1] + .6, 1.3, L, 'brass', { outline: .25 }); }
    }
    // ——— the card's flight from his fan to Jack's fingers: a soft streak and two fading after-images ———
    // Jack's (left) hand, the palm towards us: a slim hand narrowing to the wrist, the index and middle finger straight
    // with the card between them, the ring and little finger curled down onto the palm, their nails to us, and the
    // thumb laid across the palm from the wrist, its tip against the ring finger's nail
    const JW = [98, 118], JA = -94, JS = 9.2;
    const jh = H.hand3(u, { at: JW, a: JA, s: JS, m: -1, roll: 172, pitch: 6, pose: 'scissor', yaw: [-8, 5, 4, 8], tone: { lit: '#f6cca6', half: '#d29a72', shadow: '#7a4430', outline: '#3a1c10' },
      light: [-.62, -.78], backFingers: [1], sw: .5, trueDorsal: true, palmW: .84, wristW: .8, fingerW: .92, flex: [[4, 8, 6], [8, 10, 6], [64, 96, 58], [70, 94, 56]],
      thumbJ: [[.5, -1.4, -.8], [1.8, -1.05, -1.5], [2.6, -.4, -2.15], [3.15, .3, -2.75]], thumbOut: [0, 0, -1] });
    const CC0 = jh.P(7.6, -.8, -.42), CA = -12, CSC = 1.56, CC = [CC0[0] + 1, CC0[1] - 14];   // the card: centre, angle, scale
    let fly = '';
    { const ga = GAP * Math.PI / 180, a0 = [PIV[0] + Math.sin(ga) * 27, PIV[1] - Math.cos(ga) * 27], a1 = [CC[0] + 8, CC[1] + 10], bf = blurF('fl' + u, 1.6), g = nid('fg', u);
      fly += bf + `<defs>${linGrad(g, a0[0], a0[1], a1[0], a1[1], [[0, '#f0dcb0', 0], [1, '#f0dcb0', .5]])}</defs>`
        + `<path d="M${a0[0] - 2} ${a0[1] + 3}Q${f(lerp(a0[0], a1[0], .5) + 10)} ${f(lerp(a0[1], a1[1], .5) + 2)} ${f(a1[0] - 10)} ${f(a1[1] + 4)}L${f(a1[0] + 8)} ${f(a1[1] - 6)}Q${f(lerp(a0[0], a1[0], .5) + 18)} ${f(lerp(a0[1], a1[1], .5) - 8)} ${a0[0] + 3} ${a0[1] - 3}z" fill="url(#${g})" filter="url(#fl${u})"/>`
        + `<g filter="url(#fl${u})">${card(u, [lerp(a0[0], CC[0], .38) + 6, lerp(a0[1], CC[1], .38)], lerp(-70, CA, .38), lerp(.62, CSC, .38), { opacity: .12, shadow: false })}${card(u, [lerp(a0[0], CC[0], .68) + 5, lerp(a0[1], CC[1], .68)], lerp(-70, CA, .68), lerp(.62, CSC, .68), { opacity: .2, shadow: false })}</g>`
        + [[0, 0], [5, 4], [-4, 6]].map(([dx, dy]) => `<path d="M${f(a0[0] - 12 + dx)} ${f(a0[1] - 10 + dy)}q-8 -10 -18 -16" stroke="#fff0d0" stroke-width=".45" fill="none" opacity=".35" stroke-linecap="round"/>`).join(''); }
    // ——— Jack's arm: the dark blue coat sleeve from the bottom, the gold-braided cuff, the lace frills; the hand ———
    let arm = '';
    { const g = nid('sv', u); arm += `<g transform="translate(0 -12)">`;
      arm += `<defs>${linGrad(g, 70, 0, 132, 0, [[0, '#3c4c80', 1], [.38, '#1e2a50', 1], [1, '#080c1e', 1]])}</defs>`
        + `<path d="M76 146Q98 141 122 146L136 290H58z" fill="url(#${g})" stroke="#04060e" stroke-width=".6"/>`
        + `<path d="M64 196q22 -8 50 -2q-20 2 -32 8zM60 236q26 -10 60 -2q-26 2 -42 9z" fill="#04060e" opacity=".45"/><path d="M66 194q22 -7 46 -3M62 234q26 -8 56 -2" stroke="#5a6aa0" stroke-width=".8" fill="none" opacity=".4"/>`;
      // the turned-back cuff with two rows of braid and three buttons
      arm += `<path d="M74 140Q98 134 124 140L127 160Q98 154 71 160z" fill="#1a2650" stroke="#04060e" stroke-width=".5"/>`
        + `<path d="M73.4 143.4Q98 137.6 124.6 143.4M72.2 156.6Q98 151 126.2 156.6" stroke="url(#brass${u})" stroke-width="1.4" fill="none"/><path d="M73.4 142.8Q98 137 124.6 142.8" stroke="#fff0b0" stroke-width=".35" fill="none" opacity=".7"/>`
        + [84, 98, 112].map(x => K.shadeSphere(u, x, 150.4 - Math.sin((x - 72) / 54 * Math.PI) * 2.2, 1.8, L, 'brass', { outline: .3 })).join('');
      // three tiers of lace round the wrist, the top one fine, with its scalloped edge and the holes of the pattern
      const frill = (y0, w0, col, edge, ph, n) => { let d = `M${98 - w0} ${y0 + 3}`; for (let k = 0; k < n; k++) { const x = 98 - w0 + (k + .5) * 2 * w0 / n, yy = y0 - 1.4 - Math.sin(k * 1.7 + ph) * .9; d += `Q${f(x)} ${f(yy - 2)} ${f(x + w0 / n)} ${f(yy + .4)}`; }
        return `<path d="${d}L${98 + w0} ${y0 + 4.6}Q98 ${y0 + 2.4} ${98 - w0} ${y0 + 3}z" fill="${col}" stroke="${edge}" stroke-width=".3"/>`; };
      arm += frill(139.4, 23, '#e4dcc8', '#8a806a', 0, 16) + frill(135.6, 21.4, '#f2ecdc', '#a0967e', 1.3, 15) + frill(131.6, 19.6, '#fbf7ec', '#b0a690', 2.6, 14)
        + Array.from({ length: 22 }, (_, k) => `<circle cx="${f(81 + k * 1.6)}" cy="${f(134.2 + (k % 2) * 1.2)}" r=".35" fill="#9a907a" opacity=".7"/>`).join('')
        + Array.from({ length: 16 }, (_, k) => `<path d="M${f(80 + k * 2.4)} ${f(130.8 + (k % 2) * .5)}q.6 2.4 .1 4.8" stroke="#c4baa4" stroke-width=".3" fill="none"/>`).join('');
      arm += `</g>`;
      // the hand over the lace: its back, the middle finger behind the card, the card, then the index finger and thumb
      arm += jh.back + card(u, CC, CA, CSC) + jh.front;
      // rings: a gold band with a red stone on the index finger, a plain one on the ring finger's knuckle
      { const a = jh.P(5.9, -1.22, -.02), b = jh.P(5.9, -1.22, -.95); const c = [lerp(a[0], b[0], .5), lerp(a[1], b[1], .5)];
        arm += `<path d="M${f(c[0] - 5.2)} ${f(c[1] + .6)}Q${f(c[0])} ${f(c[1] + 2.6)} ${f(c[0] + 4.8)} ${f(c[1] + .2)}" stroke="url(#brass${u})" stroke-width="1.7" fill="none" stroke-linecap="round"/>`
          + `<path d="M${f(c[0] - 4.4)} ${f(c[1] + .2)}Q${f(c[0])} ${f(c[1] + 1.9)} ${f(c[0] + 4)} ${f(c[1] - .2)}" stroke="#fff4c0" stroke-width=".4" fill="none"/>`
          ; }
    }
    // ——— light: the lantern's glow and motes, the cold moonlight from the right, the dark round the edges ———
    let fg = K.localGlow(u, { x: FLAME.x, y: FLAME.y, color: '#ffc070', power: .9, radius: 24 })
      + glow(u, CC[0] - 4, CC[1] - 6, 30, 36, '#ffe8c0', .12) + glow(u, 196, 70, 30, 60, '#a8c0ff', .1)
      + motes(18, 10, 40, 70, 60, '#ffd8a0', 21)
      + gloom(u, 100, 10, 0, 0, .3) + gloom(u, 100, 140, 100, 280, .35);
    return [bg, mid + off + fly + arm + fg];
  } };
