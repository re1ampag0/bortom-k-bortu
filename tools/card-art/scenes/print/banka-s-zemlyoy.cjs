// «Банка с землёй» (Жемчужина, РЕАКЦИЯ: отмените Залп или карту «Летучего голландца» против «Жемчужины» — даже
// Кракена), refined from the first-round scene (portrait-pearl.cjs SCENES['Банка с землёй']): in the rain a gloved
// hand holds a jar of earth up toward the ghost ship; her captain may not set foot on land, and she shies away.
// Brief (card-briefs.md): the glass jar of earth big in the raised hand against the green fog; the Dutchman recoils;
// the warm tone of the earth in the cold green light of Jones. The hand comes in from the lower right over the
// Pearl's rail, the fingers round the jar; the Dutchman rears and heels away from it (her bow lifts, her weedy bottom
// shows), a ring of foam where she turned. The key is the moon in the green fog beyond her (cold, upper left): the
// glass, the glove and the rail take its rim; the earth's warmth is a small local glow that thins the fog and lights
// the rain round the jar.
// Fixed against the first round: the hand was a cylinder with a fist under the jar — now a sleeve with its folds,
// a leather gauntlet cuff and a gloved hand with four fingers round the jar's body, the thumb behind; the jar was
// small — now it is the main thing, glass with a thickness, a cloth cap tied with twine, the earth in layers with
// stones and a root; the ghost ship is the kit's Dutchman, heeled and turned by the rules of her geometry.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const PP = require('./lib/people.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;

const HZ = 112;
const JAR = { x: 126, y: 104, w: 46, h: 52 };      // the jar: middle of its bottom, width, body height (the cap above)
const WR = [151, 99];                              // the wrist
const light = { time: 'fog', haze: .7, key: { type: 'moon', x: 76, y: 24, el: 26, color: '#c8f0dc', power: .75 }, fill: { color: '#3a6a5c', power: .46 },
  rim: { az: -20, color: '#d8fff0', power: .55 }, locals: [{ x: JAR.x, y: JAR.y - 22, color: '#ffc880', power: .55, radius: 40 }] };
const skel = { horizon: HZ, eye: 3, light: 'the moon in the green fog upper left (cold key) + the jar\'s faint warm glow (local)', items: [
  ['dutchman', 8, 118, 112, 64, 'water: heeled away, bow lifted'], ['foam ring', 30, 120, 76, 6, 'water round her'],
  ['jar', JAR.x - JAR.w / 2, JAR.y, JAR.w, JAR.h + 12, 'held in the hand'], ['hand', 112, 110, 42, 24, 'round the jar, from the wrist'],
  ['sleeve', 146, 240, 70, 140, 'from the lower right corner'], ['rail', -5, 186, 210, 40, 'the Pearl\'s bulwark, near']] };

// the jar of earth: glass body with a thick rim and base, earth in layers with stones, a root and a sprout, a cloth
// cap tied with twine over the cork, a paper tag on a string; rain drops on the glass. Returns { body, glass }
function jar(u, L, o) {
  const { x, y, w, h } = o, rx = w / 2, top = y - h, nk = rx * .58, R = rng(7);
  // the outline: base, straight sides, a round shoulder into the neck, the lip
  const out = `M${f(x - rx + 3)} ${f(y)}Q${f(x - rx)} ${f(y)} ${f(x - rx)} ${f(y - 4)}L${f(x - rx)} ${f(top + 12)}Q${f(x - rx)} ${f(top + 3)} ${f(x - nk)} ${f(top + 1)}L${f(x - nk)} ${f(top - 3)}`
    + `L${f(x + nk)} ${f(top - 3)}L${f(x + nk)} ${f(top + 1)}Q${f(x + rx)} ${f(top + 3)} ${f(x + rx)} ${f(top + 12)}L${f(x + rx)} ${f(y - 4)}Q${f(x + rx)} ${f(y)} ${f(x + rx - 3)} ${f(y)}Z`;
  const cid = nid('jc', u), eg = nid('je', u), gg = nid('jg', u);
  let body = `<defs><clipPath id="${cid}"><path d="${out}"/></clipPath>${linGrad(eg, 0, top + 16, 0, y, [[0, '#7a5232', 1], [.3, '#5a3a20', 1], [.65, '#3e2814', 1], [1, '#2a1a0c', 1]])}`
    + `${linGrad(gg, x - rx, 0, x + rx, 0, [[0, '#9adcc4', .32], [.18, '#e8fff6', .22], [.5, '#bfe8d8', .06], [.85, '#6aa894', .18], [1, '#2a5a4a', .4]])}</defs>`;
  // behind the glass: the fog seen through it (a little greener), then the earth
  body += `<path d="${out}" fill="#3e6a5c" opacity=".35"/>`;
  const es = top + 17; let surf = `M${f(x - rx - 2)} ${f(es + 2)}`; for (let i = 1; i <= 8; i++) surf += `L${f(x - rx - 2 + i * (w + 4) / 8)} ${f(es + Math.sin(i * 1.7) * 1.4 + (i === 4 ? -1.6 : 0))}`;
  body += `<g clip-path="url(#${cid})"><path d="${surf}L${f(x + rx + 2)} ${f(y + 2)}L${f(x - rx - 2)} ${f(y + 2)}Z" fill="url(#${eg})"/>`;
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
    + `<path d="M${f(x - rx)} ${f(y - 2.2)}H${f(x + rx)}" stroke="#bfe8d8" stroke-width="2.6" opacity=".22"/></g>`
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
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 4 }) + K.sunMoon(u, L, { r: 6 });
    for (const [x, y, w, h, sd, fr] of [[150, 22, 90, 12, 3, .1], [30, 56, 70, 9, 8, .3], [176, 70, 60, 8, 12, .35], [96, 90, 80, 6, 5, .55]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .6, seed: 12, glitter: 50 });
    // the Dutchman rears and heels away from the jar: bow up, her weedy bottom to us; foam where she turned
    bg += K.ship(u, L, { kind: 'dutch', x: 62, y: HZ + 6, scale: .8, heel: -8, roll: -14, sails: 'full', lights: true, reflect: true, wake: true, seed: 4 });
    { const fr = rng(19); for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, x = 62 + Math.cos(a) * 46, y = HZ + 7 + Math.sin(a) * 4.6; bg += K.foam(u, { x, y, w: 12 + fr() * 8, h: 1.2, seed: 40 + i, L }); } }
    bg += glow(u, 62, 80, 70, 46, '#9ff0d0', .3);
    // the green fog: a bank over the water, thinner round the jar (its warmth pushes it back)
    bg += K.fog(u, L, { y: HZ - 14, h: 32, density: .45, seed: 3 }) + K.fog(u, L, { y: 58, h: 30, density: .3, seed: 9 });
    bg += K.localGlow(u, { x: JAR.x, y: JAR.y - 24, color: '#ffd8a0', power: .5, radius: 50 }, { core: false });
    // the rain: slanting streaks, far ones pale and thin; near the jar they are lit warm
    { const R = rng(51); for (let i = 0; i < 110; i++) { const x = R() * 230 - 10, y = R() * 290, l = 5 + R() * 9, d = Math.hypot(x - JAR.x, y - (JAR.y - 24)), near = d < 40;
        bg += `<path d="M${f(x)} ${f(y)}l${f(-l * .32)} ${f(l)}" stroke="${near ? '#ffdcaa' : '#cfeee2'}" stroke-width="${near ? .55 : .35}" opacity="${f(near ? .8 : .3 + R() * .25)}" stroke-linecap="round"/>`; } }
    // the Pearl's rail, near (under the glass): wet, the moon on the cap rail
    bg += K.bulwark(u, L, { x1: -6, x2: 206, y: 188, h: 42, kind: 'oak', posts: 30, seed: 3 })
      + `<path d="M-6 146.4h212" stroke="#d8fff0" stroke-width=".5" opacity=".45"/>`;
    let fg = '';
    // the arm from the lower right corner: a dark coat sleeve folding at the elbow, a leather gauntlet cuff
    const coat = { lit: '#4e6468', half: '#25343a', shadow: '#0f171c', outline: '#060a0c' }, gl = L.ramp('leather', 140, 94);
    const glove = { lit: mix(gl.lit, '#d8fff0', .15), half: gl.half, shadow: gl.shadow, outline: gl.outline };
    fg += `<g filter="url(#drop${u})">` + PP.cloth(u, { spine: [[214, 250], [190, 184], [166, 130], [WR[0] + 3, WR[1] + 3]], w: [44, 34, 24, 17], tone: coat, lit: -1, rim: '#bfe8d8', rimSide: -1, rimOp: .6,
      cuff: { from: .78, tone: { lit: mix(gl.lit, '#c8f0dc', .2), half: gl.half, shadow: gl.shadow, outline: gl.outline }, k: 1.22, roll: true }, seed: 5, L }) + '</g>';
    // the hand round the jar: the palm and thumb behind it, the four fingers across its front
    const H = PP.hand(u, { at: WR, a: -174, s: 3.7, m: -1, pose: 'open', split: true, thumb: 'back', spread: 3, curl: .45, tone: glove, nails: false });
    const J = jar(u, L, JAR);
    fg += H.back + J.body + J.glass + H.front;
    // the stitching on the glove's back
    { const a = H.P(1.2, -.6), b = H.P(4.6, -.9), c = H.P(1.2, .7), d = H.P(4.6, .8); fg += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}M${f(c[0])} ${f(c[1])}L${f(d[0])} ${f(d[1])}" stroke="${gl.lit}" stroke-width=".3" stroke-dasharray=".8 .6" opacity=".6"/>`; }
    // the warmth round the jar and on the glove; the moon fills the air a little
    fg += K.localGlow(u, { x: JAR.x - 2, y: JAR.y - 20, color: '#ffc880', power: .65, radius: 36 }, { core: false })
      + glow(u, 50, 30, 60, 40, '#d8fff0', .12)
      + gloom(u, 100, 150, 100, 280, .5, '#04100c') + gloom(u, 120, 120, 0, 0, .2, '#04100c');
    return [bg, fg];
  } };
