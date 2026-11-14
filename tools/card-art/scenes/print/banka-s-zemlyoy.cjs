// «Банка с землёй» (Жемчужина, РЕАКЦИЯ: отмените Залп или карту «Летучего голландца» против «Жемчужины» — даже
// Кракена), refined from the first-round scene (portrait-pearl.cjs SCENES['Банка с землёй']): in the rain on the
// Pearl's deck the jar of earth faces the ghost ship; her captain may not set foot on land, and she shies away.
// Brief (card-briefs.md): the glass jar of earth big against the green fog; the Dutchman recoils; the warm tone of the
// earth in the cold green light of Jones.
// Step 3 (the user's note): the jar is a charm hugged to the chest — a sailor of the Pearl (his own face, nobody from
// the film), seen to the waist, presses it to his breastbone with both hands, the fingers spread round the glass from
// its sides (people.cjs hand3 wrapped round a cylinder the jar's size), the elbows in at his sides; he looks warily
// at the Dutchman over his right shoulder, who rears and heels away from him (her bow lifts, her weedy bottom shows),
// a ring of foam where she turned. The key is the moon in the green fog (cold, upper left): the glass, his shirt, his
// shoulders and the rail take its rim; the earth's warmth is a small local glow that lights his hands and his face
// from below, thins the fog and lights the rain round the jar. The jar keeps the first pass's drawing (glass with a
// thickness, a cloth cap tied with twine, the earth in layers with stones, a root and a sprout), drawn smaller.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const PP = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom } = PK;

const HZ = 100;
const JAR0 = { x: 126, y: 104, w: 46, h: 52 };      // the jar as drawn (middle of its bottom, width, body height; the cap above)
const JK = .76;                                     // …drawn at JK round his chest
const MAN = [20, 4];                                // the man (and the jar in his hands) is drawn round x 100, moved by MAN
const JAR = { x: 100, y: 115, w: JAR0.w * JK, h: JAR0.h * JK };   // the jar in the man's frame
const HEAD = { c: [100, 40.4], r: 13.8 };
const TW = .88;                                     // the torso drawn broad round x 100, narrowed to TW
const light = { time: 'fog', haze: .7, key: { type: 'moon', x: 66, y: 22, el: 26, color: '#c8f0dc', power: .75 }, fill: { color: '#3a6a5c', power: .46 },
  rim: { az: -20, color: '#d8fff0', power: .55 }, locals: [{ x: JAR.x + MAN[0], y: JAR.y + MAN[1] - 22, color: '#ffc880', power: .55, radius: 40 }] };
const skel = { horizon: HZ, eye: 3, light: 'the moon in the green fog upper left (cold key) + the jar\'s faint warm glow (local, on his hands and face from below)', items: [
  ['dutchman', 4, 106, 88, 50, 'water: heeled away, bow lifted'], ['foam ring', 10, 108, 70, 6, 'water round her'],
  ['rail', -5, 158, 210, 42, 'the Pearl\'s bulwark behind him'], ['sailor', 82, 170, 78, 140, 'stands on the deck, seen to the waist'],
  ['jar', 120 - JAR.w / 2, 119, JAR.w, JAR.h + 9, 'pressed to his chest'], ['hands', 98, 116, 46, 28, 'round the jar from its sides']] };
const P2 = p => `${f(p[0])} ${f(p[1])}`;

// the jar of earth: glass body with a thick rim and base, earth in layers with stones, a root and a sprout, a cloth
// cap tied with twine over the cork, a paper tag on a string; rain drops on the glass. Returns { body, glass }
function jar(u, L, o) {
  const { x, y, w, h } = o, rx = w / 2, top = y - h, nk = rx * .58, R = rng(7);
  // the outline: base, straight sides, a round shoulder into the neck, the lip
  const out = `M${f(x - rx + 3)} ${f(y)}Q${f(x - rx)} ${f(y)} ${f(x - rx)} ${f(y - 4)}L${f(x - rx)} ${f(top + 12)}Q${f(x - rx)} ${f(top + 3)} ${f(x - nk)} ${f(top + 1)}L${f(x - nk)} ${f(top - 3)}`
    + `L${f(x + nk)} ${f(top - 3)}L${f(x + nk)} ${f(top + 1)}Q${f(x + rx)} ${f(top + 3)} ${f(x + rx)} ${f(top + 12)}L${f(x + rx)} ${f(y - 4)}Q${f(x + rx)} ${f(y)} ${f(x + rx - 3)} ${f(y)}Z`;
  const cid = nid('jc', u), iid = nid('ji', u), eg = nid('je', u), gg = nid('jg', u), wl = 2.4, bt = 8;   // wl, bt: the glass wall and the thick base
  const inner = `M${f(x - rx + wl)} ${f(top)}L${f(x + rx - wl)} ${f(top)}L${f(x + rx - wl)} ${f(y - bt - 1.5)}Q${f(x + rx - wl)} ${f(y - bt)} ${f(x + rx - wl - 2)} ${f(y - bt)}L${f(x - rx + wl + 2)} ${f(y - bt)}Q${f(x - rx + wl)} ${f(y - bt)} ${f(x - rx + wl)} ${f(y - bt - 1.5)}Z`;
  let body = `<defs><clipPath id="${cid}"><path d="${out}"/></clipPath><clipPath id="${iid}"><path d="${inner}"/></clipPath>${linGrad(eg, 0, top + 16, 0, y, [[0, '#7a5232', 1], [.3, '#5a3a20', 1], [.65, '#3e2814', 1], [1, '#2a1a0c', 1]])}`
    + `${linGrad(gg, x - rx, 0, x + rx, 0, [[0, '#9adcc4', .32], [.18, '#e8fff6', .22], [.5, '#bfe8d8', .06], [.85, '#6aa894', .18], [1, '#2a5a4a', .4]])}</defs>`;
  // behind the glass: the fog seen through it (a little greener), then the earth
  body += `<path d="${out}" fill="#3e6a5c" opacity=".35"/>`;
  const es = top + 17; let surf = `M${f(x - rx - 2)} ${f(es + 2)}`; for (let i = 1; i <= 8; i++) surf += `L${f(x - rx - 2 + i * (w + 4) / 8)} ${f(es + Math.sin(i * 1.7) * 1.4 + (i === 4 ? -1.6 : 0))}`;
  body += `<g clip-path="url(#${iid})"><path d="${surf}L${f(x + rx + 2)} ${f(y + 2)}L${f(x - rx - 2)} ${f(y + 2)}Z" fill="url(#${eg})"/>`;
  // layers: a dark band of loam, a pale band of sand, the dark again; stones pressed against the glass
  body += `<path d="M${f(x - rx)} ${f(es + 13)}q${f(rx * .6)} 2 ${f(rx)} -.6t${f(rx)} .8" stroke="#a88a5a" stroke-width="2.2" fill="none" opacity=".6"/>`
    + `<path d="M${f(x - rx)} ${f(es + 22)}q${f(rx * .5)} -1.6 ${f(rx)} .4t${f(rx)} -.6" stroke="#1e120a" stroke-width="2.6" fill="none" opacity=".55"/>`;
  for (let i = 0; i < 11; i++) { const sx = x - rx + 3 + R() * (w - 6), sy = es + 4 + R() * (h - 22), r = 1 + R() * 2.2, c = ['#8a8274', '#6a6458', '#a89a80', '#5a4a3a'][i % 4];
    body += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="${f(r)}" ry="${f(r * .75)}" fill="${c}" stroke="#2a1e12" stroke-width=".25"/><ellipse cx="${f(sx - r * .3)}" cy="${f(sy - r * .3)}" rx="${f(r * .35)}" ry="${f(r * .22)}" fill="#e8e0cc" opacity=".45"/>`; }
  for (let i = 0; i < 40; i++) body += `<circle cx="${f(x - rx + R() * w)}" cy="${f(es + 2 + R() * (h - 18))}" r="${f(.2 + R() * .35)}" fill="${R() > .5 ? '#c8a878' : '#1a0e06'}" opacity=".6"/>`;
  // a pale root through the earth, and a sprout from the top with two leaves
  body += `<path d="M${f(x - 4)} ${f(es + 1)}q-2 6 1 11t-3 10q-1 3 1 6M${f(x - 3)} ${f(es + 9)}q4 2 6 7" stroke="#d8c49a" stroke-width=".55" fill="none" opacity=".75"/>`;
  body += `<path d="M${f(x - 4)} ${f(es)}q-.6 -5 1 -9" stroke="#5a9a3a" stroke-width="1.1" fill="none"/>`
    + `<path d="M${f(x - 3.4)} ${f(es - 6)}q-6 -1 -8 -5q6 -.6 8 4zM${f(x - 3)} ${f(es - 8)}q5 -4 9 -3q-4 5 -9 3z" fill="#7aba4a" stroke="#2a5a1a" stroke-width=".35"/></g>`;
  // the glass over it: tinted, darker and greener at the edges (its thickness), the thick base
  let glass = `<path d="${out}" fill="url(#${gg})"/>`
    + `<g clip-path="url(#${cid})"><path d="M${f(x - rx)} ${f(y - 4)}L${f(x - rx)} ${f(top + 12)}" stroke="#1a3a30" stroke-width="2.6" opacity=".5"/><path d="M${f(x + rx)} ${f(y - 4)}L${f(x + rx)} ${f(top + 12)}" stroke="#0e2a22" stroke-width="3" opacity=".6"/>`
    + `<path d="M${f(x - rx)} ${f(y - bt / 2)}H${f(x + rx)}" stroke="#bfe8d8" stroke-width="${bt}" opacity=".1"/></g>`
    // the inside of the thick base: the earth's foot on it, a bright line where the glass ends
    + `<path d="M${f(x - rx + wl + 1)} ${f(y - bt + .2)}H${f(x + rx - wl - 1)}" stroke="#08140f" stroke-width=".7" opacity=".55"/><path d="M${f(x - rx + wl + 1)} ${f(y - bt + .9)}H${f(x + rx - wl - 1)}" stroke="#e8fff6" stroke-width=".45" opacity=".5"/>`
    + `<path d="${out}" fill="none" stroke="#0e2a22" stroke-width=".6"/>`
    // the moon on the left side: a long highlight and a short one; the warm earth glow on the right side
    + `<path d="M${f(x - rx + 3.4)} ${f(top + 13)}L${f(x - rx + 3.4)} ${f(y - 8)}" stroke="#f2fff8" stroke-width="2" opacity=".55" stroke-linecap="round"/>`
    + `<path d="M${f(x - rx + 6.6)} ${f(top + 15)}L${f(x - rx + 6.6)} ${f(top + 26)}" stroke="#ffffff" stroke-width=".9" opacity=".7" stroke-linecap="round"/>`
    + `<path d="M${f(x - rx + 2)} ${f(top + 8)}Q${f(x - rx + 4)} ${f(top + 3)} ${f(x - nk + 1)} ${f(top + 2)}" stroke="#ffffff" stroke-width="1" fill="none" opacity=".7"/>`
    + `<path d="M${f(x + rx - 2.4)} ${f(top + 16)}L${f(x + rx - 2.4)} ${f(y - 8)}" stroke="#ffc880" stroke-width="1" opacity=".35"/>`;
  // the lip of the neck (a rolled glass ring)
  glass += `<path d="M${f(x - nk - 1.2)} ${f(top - 3)}h${f(2 * nk + 2.4)}v2.6h${f(-2 * nk - 2.4)}z" fill="#9adcc4" opacity=".5" stroke="#0e2a22" stroke-width=".5"/><path d="M${f(x - nk - 1)} ${f(top - 2.6)}h${f(2 * nk + 2)}" stroke="#ffffff" stroke-width=".5" opacity=".7"/>`;
  // the cloth cap over the cork, tied with twine; its skirt falls in folds over the lip
  { const cy = top - 3, rp = L.ramp('linen', x, cy - 4), cg = nid('jcap', u);
    glass += `<defs>${linGrad(cg, x - nk - 4, 0, x + nk + 4, 0, [[0, rp.lit, 1], [.45, rp.half, 1], [1, rp.shadow, 1]])}</defs>`
      + `<path d="M${f(x - nk - 1)} ${f(cy - 7)}Q${x} ${f(cy - 11)} ${f(x + nk + 1)} ${f(cy - 7)}L${f(x + nk + 3.4)} ${f(cy + 4)}q-2 1.6 -3.4 -.2q-2 2 -3.6 .2q-2 1.8 -3.8 0q-2 1.6 -3.6 0q-2 1.8 -3.6 -.2q-1.8 1.6 -3.4 .2z" fill="url(#${cg})" stroke="${rp.outline}" stroke-width=".4"/>`
      + [-.6, -.2, .2, .6].map(k => `<path d="M${f(x + k * nk)} ${f(cy - 6)}q${f(k * 1.6)} 4 ${f(k * 2.6)} 9" stroke="${rp.shadow}" stroke-width=".4" fill="none" opacity=".7"/>`).join('')
      + `<path d="M${f(x - nk - 1.6)} ${f(cy - 1.4)}Q${x} ${f(cy + .4)} ${f(x + nk + 2.4)} ${f(cy - 1.4)}" stroke="#6a4a24" stroke-width="1.2" fill="none"/><path d="M${f(x - nk - 1.6)} ${f(cy - 1.8)}Q${x} ${f(cy)} ${f(x + nk + 2.4)} ${f(cy - 1.8)}" stroke="#d8b878" stroke-width=".4" fill="none" stroke-dasharray=".8 .6"/>`
      + `<path d="M${f(x - nk - 1)} ${f(cy - 7)}Q${x} ${f(cy - 11)} ${f(x + nk + 1)} ${f(cy - 7)}" stroke="#f0fff8" stroke-width=".5" fill="none" opacity=".6"/>`;
    // the twine's ends and the paper tag on the right
    glass += `<path d="M${f(x + nk + 2.2)} ${f(cy - 1.4)}q3 2 4 7" stroke="#8a6a3a" stroke-width=".5" fill="none"/><g transform="translate(${f(x + nk + 7)} ${f(cy + 9)}) rotate(16)"><path d="M-3.6 -2.6h6l1.6 2.6l-1.6 2.6h-6z" fill="#d8ccb0" stroke="#5a4a30" stroke-width=".35"/><circle cx="2" cy="0" r=".5" fill="#5a4a30"/><path d="M-2.4 -.8h3M-2.4 .8h2.4" stroke="#6a5a40" stroke-width=".3"/></g>`; }
  // rain drops on the glass
  for (let i = 0; i < 12; i++) { const dx = x - rx + 3 + R() * (w - 6), dy = top + 8 + R() * (h - 12); glass += `<ellipse cx="${f(dx)}" cy="${f(dy)}" rx=".7" ry="1.1" fill="#e8fff8" opacity=".6"/><circle cx="${f(dx - .2)}" cy="${f(dy - .4)}" r=".25" fill="#ffffff"/>`; }
  return { body, glass };
}

module.exports = { name: 'Банка с землёй', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    const JP = [JAR.x + MAN[0], JAR.y + MAN[1]];                    // the jar's foot in the picture
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 4 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[150, 22, 90, 12, 3, .1], [24, 52, 64, 9, 8, .3], [176, 66, 60, 8, 12, .35], [70, 84, 70, 6, 5, .55]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 12, glitter: 66 });
    // the Dutchman rears and heels away from him and his jar: bow up, her weedy bottom to us; foam where she turned
    bg += K.ship(u, L, { kind: 'dutch', x: 44, y: HZ + 6, scale: .6, heel: -8, roll: -14, sails: 'full', lights: true, reflect: true, wake: true, seed: 4 });
    { const fr = rng(19); for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, x = 44 + Math.cos(a) * 36, y = HZ + 7 + Math.sin(a) * 3.6; bg += K.foam(u, { x, y, w: 10 + fr() * 6, h: 1, seed: 40 + i, L }); } }
    // the water draws back from the Pearl: low swells running out from her side toward the ghost ship, their crests lit
    for (const [rx, op] of [[30, .5], [42, .4], [54, .3]]) { const cx = 120, cy = HZ + 10, ry = rx * .12, a0 = 160 * Math.PI / 180, a1 = 205 * Math.PI / 180, P = a => `${f(cx + Math.cos(a) * rx)} ${f(cy + Math.sin(a) * ry)}`;
      bg += `<path d="M${P(a0)}A${f(rx)} ${f(ry)} 0 0 1 ${P(a1)}" stroke="#0e2a22" stroke-width="1.2" fill="none" opacity="${f(op * .6)}" transform="translate(.8 .6)"/><path d="M${P(a0)}A${f(rx)} ${f(ry)} 0 0 1 ${P(a1)}" stroke="#d8fff0" stroke-width=".5" fill="none" opacity="${op}"/>`; }
    bg += glow(u, 44, 76, 56, 40, '#9ff0d0', .3);
    // the green fog: a bank over the water, thinner round the jar (its warmth pushes it back)
    bg += K.fog(u, L, { y: HZ - 14, h: 32, density: .45, seed: 3 }) + K.fog(u, L, { y: 54, h: 30, density: .3, seed: 9 });
    bg += K.localGlow(u, { x: JP[0], y: JP[1] - 24, color: '#ffd8a0', power: .45, radius: 54 }, { core: false });
    // the rain: slanting streaks, far ones pale and thin; near the jar they are lit warm
    { const R = rng(51); for (let i = 0; i < 110; i++) { const x = R() * 230 - 10, y = R() * 290, l = 5 + R() * 9, d = Math.hypot(x - JP[0], y - (JP[1] - 24)), near = d < 44;
        bg += `<path d="M${f(x)} ${f(y)}l${f(-l * .32)} ${f(l)}" stroke="${near ? '#ffdcaa' : '#cfeee2'}" stroke-width="${near ? .5 : .35}" opacity="${f(near ? .7 : .3 + R() * .25)}" stroke-linecap="round"/>`; } }
    // the Pearl's rail behind him: wet, the moon on the cap rail
    bg += K.bulwark(u, L, { x1: -6, x2: 206, y: 158, h: 42, kind: 'oak', posts: 30, seed: 3 })
      + `<path d="M-6 116.4h212" stroke="#d8fff0" stroke-width=".5" opacity=".45"/>`;

    // ——— the sailor, drawn round x 100 and moved by MAN ———
    const shirtR = L.ramp('linen', 120, 80), shirt = { lit: mix(shirtR.lit, '#e8fff4', .2), half: shirtR.half, shadow: shirtR.shadow, outline: shirtR.outline };
    const vest = { lit: '#4a5a4c', half: '#2a2c22', shadow: '#121410', outline: '#060806' };
    const SKIN = PP.skinTone('dark', { L, x: 120, y: 60 });
    const LT = [-.62, -.72];                                           // to the moon, in the picture
    let man = '';
    // the shirt: shoulders, loose linen, open at the throat; the waistcoat over it, open in front
    { const sg = nid('sh', u), vg = nid('vs', u);
      man += `<g transform="translate(100 0) scale(${TW} 1) translate(-100 0)">`;
      man += `<defs>${linGrad(sg, 62, 0, 138, 0, [[0, shirt.lit, 1], [.35, shirt.half, 1], [.8, mix(shirt.half, shirt.shadow, .5), 1], [1, shirt.shadow, 1]])}`
        + `${linGrad(vg, 62, 0, 138, 0, [[0, vest.lit, 1], [.3, vest.half, 1], [1, vest.shadow, 1]])}</defs>`
        + `<path d="M62 170L64 84Q66 70 78 65L92 59Q100 63 108 59L122 65Q134 70 136 84L138 170Z" fill="url(#${sg})" stroke="${shirt.outline}" stroke-width=".5"/>`
        // the waistcoat: two panels from the shoulder seams down, a gap of shirt between them (behind the jar)
        + `<path d="M76 66L90 61Q88 80 92 100L94 170H63L65 86Q67 72 76 66Z" fill="url(#${vg})" stroke="${vest.outline}" stroke-width=".45"/>`
        + `<path d="M124 66L110 61Q112 80 108 100L106 170H137L135 86Q133 72 124 66Z" fill="url(#${vg})" stroke="${vest.outline}" stroke-width=".45"/>`
        + `<path d="M90 61Q88 80 92 100" stroke="${vest.lit}" stroke-width=".5" fill="none" opacity=".7"/>`
        // the open neck of the shirt: the V of skin, the collar's points; a faded blue kerchief knotted at the throat
        + `<path d="M93 59Q100 64 107 59L103 74Q100 77 97 74Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".35"/><path d="M97 66q3 3 6 0" stroke="${SKIN.shadow}" stroke-width=".5" fill="none" opacity=".6"/>`
        + `<path d="M92 59l-4 9l8 -1zM108 59l4 9l-8 -1z" fill="${shirt.lit}" stroke="${shirt.outline}" stroke-width=".35"/>`
        + `<path d="M91 56Q100 61 109 56L110 59.6Q100 65 90 59.6Z" fill="#3a5a7a" stroke="#0e1a26" stroke-width=".35"/><path d="M92 57.4Q100 62 108 57.4" stroke="#a8c8d8" stroke-width=".35" fill="none" opacity=".5"/>`
        + `<path d="M99 60.6l-2.6 7l2.4 -.6l1.6 2.6l1 -7z" fill="#34506e" stroke="#0e1a26" stroke-width=".3"/>`
        // the seams over the shoulders, the wet cloth clinging in creases; the moon's rim down his right side (our left)
        + `<path d="M78 65Q80 73 76 81M122 65Q120 73 124 81" stroke="${shirt.shadow}" stroke-width=".5" fill="none" opacity=".8"/>`
        + `<path d="M64 150L64 84Q66 70 78 65L92 59" stroke="#d8fff0" stroke-width=".8" fill="none" opacity=".75"/>`;
      // the neck
      man += `<path d="M94 47L106 47L107.4 59Q100 62 92.6 59Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".35"/><path d="M95.5 53q4.5 3 9 0" stroke="${SKIN.shadow}" stroke-width=".6" fill="none" opacity=".6"/>`
        + `<path d="M95.4 48L95.2 58" stroke="#c8f0dc" stroke-width=".5" opacity=".5"/>`;
      // rain beaded on the wet shoulders and the waistcoat
      { const R = rng(33); for (let i = 0; i < 18; i++) { const x = 68 + R() * 64, y = 64 + R() * 14 + Math.abs(x - 100) * .08; man += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.3 + R() * .3)}" fill="#e8fff6" opacity="${f(.45 + R() * .3)}"/>`; } }
      man += '</g>'; }

    // ——— his hands round the jar: each hand at a side of the glass, the palm on it, the fingers spread round the
    // front toward the middle (hand3 wrapped round a cylinder the jar's radius); the right hand (ours left) higher ———
    const jr = JAR.w / 2, hs = 2, HB = { pose: 'wrap', s: hs, r: jr / hs, tone: SKIN, light: LT, sw: .3, roll: 0 };
    const hR = PP.hand3(u, { ...HB, a: 0, pitch: 58, m: 1, grip: [JAR.x, 91] });       // his right hand: on the jar's left side
    const hL = PP.hand3(u, { ...HB, a: 180, pitch: 58, m: -1, grip: [JAR.x, 107] });   // his left hand: on its right side, lower
    // the arms: shirt sleeves, shoulder → elbow (in at his side) → the wrist at the jar's side; a cuff
    // (the elbow bent round in two points, so the sleeve turns as cloth does, without a corner)
    const sleeve = (s0, el, w, lt, rimOp, seed) => PP.cloth(u, { spine: [s0, [lerp(s0[0], el[0], .5) + lt * .8, lerp(s0[1], el[1], .5)], [lerp(el[0], s0[0], .14), lerp(el[1], s0[1], .14)],
      [lerp(el[0], w[0], .22), lerp(el[1], w[1], .22) + 1.2], [lerp(el[0], w[0], .6), lerp(el[1], w[1], .6) + .6], w],
      w: [13, 12.2, 11.6, 11, 9.8, 8.4], tone: shirt, lit: lt, rim: '#d8fff0', rimSide: lt, rimOp, seed, drapes: 2, foldW: .9, sw: .4, capA: true,
      cuff: { from: .84, k: 1.08, tone: { lit: shirt.lit, half: mix(shirt.half, shirt.shadow, .2), shadow: shirt.shadow, outline: shirt.outline } } });
    const sx = d => 100 + d * TW;
    man += sleeve([sx(-31), 74], [sx(-36), 104], hR.wrist, -1, .6, 3) + sleeve([sx(31), 74], [sx(38), 110], hL.wrist, 1, .25, 4);

    // ——— the head: a weathered face turned to his right (our left), eyes on the ghost ship; lit from below by the jar ———
    const hd = PP.head34(u, { c: HEAD.c, r: HEAD.r, turn: .34, dir: -1, nod: -1, skin: 'dark', tone: SKIN, light: LT, warm: { color: '#ffb868', op: .32 },
      look: [-.6, -.02], brow: 'frown', smile: -.12, hair: { style: 'short', color: '#141012' }, hairColor: '#141012', stubble: true, moustache: false, iris: '#2a1a10',
      noseW: 1.25, noseL: .85, jawW: 1.05 });
    let face = '';
    { const Q = hd.Q, dp = hd.depth;
      // the headscarf's knot and tails behind his head (on our right, away from his face), hanging wet
      const kn = Q(.15, -.45, -.95), sc = { lit: '#a8423a', half: '#6a1e1a', shadow: '#2e0a08', outline: '#140404' };
      face += `<path d="M${f(kn[0])} ${f(kn[1])}q4 4 3 12q-1 3 -3.4 2.6q1 -6 -1.6 -12zM${f(kn[0] - 1)} ${f(kn[1] + 1)}q-.6 5 1.6 11q-2.4 1 -3.4 -1q-.4 -6 .4 -9z" fill="${sc.half}" stroke="${sc.outline}" stroke-width=".35"/>`
        + `<path d="M${f(kn[0] + 1)} ${f(kn[1] + 2)}q2.6 4 2 10" stroke="${sc.shadow}" stroke-width=".5" fill="none" opacity=".7"/>`;
      face += hd.svg;
      // the headscarf: a dark red cloth tied tight over the crown, its edge low on the brow; the moon on its left
      const pts = []; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; for (const [y, rr] of [[-.42, 1.04], [-.78, .98], [-1.02, .62]]) pts.push(Q(Math.cos(t) * rr, y + (Math.sin(t) > .3 ? -.04 : .06), Math.sin(t) * rr * .98 - .08)); }
      pts.push(Q(0, -1.16, -.12));
      const hull = P => { const S = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
        for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of S.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const cap = hull(pts), cg = nid('hsc', u), c0 = Q(0, -.8, 0);
      face += `<defs>${linGrad(cg, c0[0] - 12, c0[1] - 8, c0[0] + 12, c0[1] + 6, [[0, sc.lit, 1], [.45, sc.half, 1], [1, sc.shadow, 1]])}</defs><path d="M${cap.map(P2).join('L')}Z" fill="url(#${cg})" stroke="${sc.outline}" stroke-width=".45"/>`;
      // the folds of the cloth pulled back toward the knot, the hem over the brow
      for (const t of [-.5, -.1, .3, .7]) { const a = Q(Math.sin(t) * .9, -.5, Math.cos(t) * .9), b = Q(Math.sin(t + .9) * .6, -.95, Math.cos(t + .9) * .5); if (dp(Math.sin(t) * .9, -.5, Math.cos(t) * .9) > 0) face += `<path d="M${P2(a)}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 - 1)} ${P2(b)}" stroke="${sc.shadow}" stroke-width=".45" fill="none" opacity=".7"/>`; }
      const hem = []; for (let k = 0; k <= 16; k++) { const t = -1.3 + k / 16 * 2.6, q = [Math.sin(t) * 1.04, -.42 + .06, Math.cos(t) * 1.02 - .08]; if (dp(...q) > -.05) hem.push(Q(...q)); }
      if (hem.length > 2) face += `<path d="M${hem.map(P2).join('L')}" stroke="${sc.lit}" stroke-width=".5" fill="none" opacity=".55"/>`;
      face += `<path d="M${P2(Q(.98, -.5, .1))}Q${P2(Q(.9, -1.0, .1))} ${P2(Q(.3, -1.18, .1))}" stroke="#d8fff0" stroke-width=".6" fill="none" opacity=".55"/>`;
      // a gold ring in the near ear
      { const e = Q(.84, .34, -.1); face += `<circle cx="${f(e[0])}" cy="${f(e[1] + .9)}" r="1" fill="none" stroke="url(#brass${u})" stroke-width=".5"/>`; }
      // the jar's warmth from below: under the chin, the jaw, the nose's underside
      face += glow(u, HEAD.c[0] - 2, HEAD.c[1] + 10, 12, 8, '#ffb060', .22); }

    // ——— the jar between his hands ———
    const J = jar(u, L, JAR0), tr = `translate(${f(JAR.x - JAR0.x * JK)} ${f(JAR.y - JAR0.y * JK)}) scale(${JK})`;
    let held = hR.back + hL.back + `<g transform="${tr}">${J.body}${J.glass}</g>` + hR.front + hL.front;
    // the earth's warmth on his fingers and on the shirt round the jar; the jar's shade pressed on his chest
    held = K.contactShadow(u, JAR.x, JAR.y + 1, JAR.w * 1.1, L, { ry: 2.4, opacity: .4 }) + held
      + glow(u, JAR.x - 13, 93, 9, 7, '#ffbe70', .22) + glow(u, JAR.x + 13, 108, 9, 7, '#ffbe70', .22);
    const fgMan = `<g transform="translate(${MAN[0]} ${MAN[1]})">${man}${face}${held}</g>`;

    let fg = fgMan;
    // the warmth round the jar; the moon fills the air a little; rain in front of him; the dark below
    fg += K.localGlow(u, { x: JP[0], y: JP[1] - 22, color: '#ffc880', power: .55, radius: 34 }, { core: false })
      + glow(u, 40, 28, 60, 40, '#d8fff0', .12);
    { const R = rng(77); for (let i = 0; i < 26; i++) { const x = R() * 220 - 10, y = R() * 150, l = 6 + R() * 8; fg += `<path d="M${f(x)} ${f(y)}l${f(-l * .32)} ${f(l)}" stroke="#d8f4ea" stroke-width=".35" opacity="${f(.22 + R() * .2)}" stroke-linecap="round"/>`; } }
    fg += gloom(u, 100, 150, 100, 280, .5, '#04100c') + gloom(u, 120, 120, 0, 0, .2, '#04100c');
    return [bg, fg];
  } };
