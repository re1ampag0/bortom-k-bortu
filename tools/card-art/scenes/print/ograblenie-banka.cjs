// «Ограбление банка» (Жемчужина, ПРИКАЗ: заберите 1 Порох из Трюма противника в свой), variant A. Our own scene:
// the «bank» robbed is the Company's powder store in a colonial port. Night: the store's tall doors stand forced open
// (the hasp torn out, the padlock on the cobbles, a crowbar against the jamb); inside, the Company's powder kegs lie
// stacked head-out, warm in the pirates' dark lantern on the floor; one pirate comes out of the door hugging a keg,
// another rolls a keg over the cobbles to the right, toward the harbour, where a third keg is already rolling and the
// masts of the Pearl stand over the roofs by the moon. The moon over the roofs on the right is the key (rims on the
// right, shadows towards us and to the left); the lantern is a small warm second light inside the door.
// Replaced against the accepted version (review): a safe dragged out of the bank with its wall by a team of horses is a
// recognisable film scene, and the card takes Powder, not gold — no safe, no horses, no gold; the powder is what goes.
// Kept: the sky with its stars and the sharp moon, the plastered facade with its quoins and tiled eaves, the cobbles.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;
const MOON = { x: 172, y: 52, r: 7.5 };

const HZ = 100, ST = 128, CORNER = 148;                // eye level; the foot of the facade (the street begins); the building's corner
const DOOR = { x0: 56, x1: 112, jamb: 82, top: 70 };   // the store's doorway: its jambs, where the arch springs, the arch's crown
const LAMP = { x: 63, y: 126 };                        // the pirates' dark lantern on the store's floor, inside the door
const KS = .62;                                        // a keg's scale (30 × 21 at 1): about half a man's height
const PA = { x: 124, y: 131.6 }, PB = { x: 92, y: 129.4 }; // the pirate rolling a keg; the pirate coming out with one in his arms
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#d4e0f6', power: .85 }, fill: { color: '#34486c', power: .4 },
  rim: { az: 30, color: '#cfe0ff', power: .5 }, locals: [{ x: LAMP.x, y: LAMP.y - 4, color: '#ffc060', power: .6, radius: 36 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon low over the roofs on the right, in front of us: rims on the right, long shadows towards us and a little to the left; the pirates\' dark lantern on the store\'s floor a warm local light inside the door', items: [
  ['facade', -4, ST, 152, 128, 'street'], ['doorway', DOOR.x0, ST, DOOR.x1 - DOOR.x0, ST - DOOR.top, 'facade ground floor, doors open out'],
  ['kegs inside', 60, 118, 46, 40, 'the store\'s floor, stacked head-out'], ['pirate B + keg', PB.x - 10, PB.y, 26, 36, 'threshold, the keg in his arms'],
  ['pirate A', PA.x - 12, PA.y, 26, 30, 'cobbles, his hands behind the keg'], ['keg A', 140, 135.6, 14, 16, 'cobbles, rolling'], ['keg C', 172, 134.6, 12, 12, 'cobbles, rolling on'],
  ['masts', 156, 104, 30, 46, 'beyond the roofs (the harbour)'], ['moon', 164, 44, 16, 16, 'sky']] };

const lerp = (a, b, t) => a + (b - a) * t;
function smooth(pts, closed = false) { const n = pts.length, g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? 'Z' : ''); }

// cobbles in perspective: rows growing towards us, every stone its own rounded shape, a wet sheen on the moon side
// and a glitter path under the moon
function cobbles(u, L, y0, y1) {
  const R = rng(17), g = nid('cb', u);
  // four stone tones, each a gradient over the stone (lit top, darker foot) — the stones differ by tone and shape
  const sg = [0, 1, 2, 3].map(i => { const id = nid('cs', u), b = mix('#3a3c48', '#5c5e6a', i / 3); return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${mix(b, '#8a92a8', .3)}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${mix(b, '#0c0d12', .45)}"/></linearGradient>` }; });
  let out = `<defs>${linGrad(g, 0, y0, 0, y1, [[0, '#2a2c36', 1], [1, '#121318', 1]])}${sg.map(q => q.def).join('')}</defs><rect x="-5" y="${y0}" width="210" height="${y1 - y0 + 5}" fill="url(#${g})"/>`;
  for (let y = y0 + .6, k = 0; y < y1; k++) {
    const h = 1.6 + (y - HZ) * .085, w = h * (1.7 + R() * .3);
    for (let x = -8 - R() * w; x < 206; x += w * (.95 + R() * .2)) {
      const ww = w * (.8 + R() * .18), hh = h * (.78 + R() * .15), cx = x + ww / 2, cy = y + hh / 2, d = 160 - Math.abs(cx - 170) * .9;   // glitter under the moon (x 170)
      const pts = Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2, r = 1 + (R() - .5) * .22; return [cx + Math.cos(a) * ww / 2 * r, cy + Math.sin(a) * hh / 2 * r]; });
      const tone = R(), base = mix('#3c3e4a', '#5a5c68', tone), top = mix(base, '#a8b4cc', .25 + Math.max(0, d) / 400);
      out += `<path d="${smooth(pts, true)}" fill="url(#${sg[Math.floor(tone * 3.999)].id})" stroke="#0c0d12" stroke-width="${f(.25 + h * .03)}"/>`
        + `<path d="M${f(cx - ww * .32)} ${f(cy - hh * .2)}Q${f(cx)} ${f(cy - hh * .52)} ${f(cx + ww * .36)} ${f(cy - hh * .18)}" stroke="${top}" stroke-width="${f(.25 + h * .07)}" fill="none" opacity="${f(.45 + Math.max(0, d) / 300)}" stroke-linecap="round"/>`;
      if (d > 120 && R() > .35) out += `<ellipse cx="${f(cx + ww * .1)}" cy="${f(cy - hh * .22)}" rx="${f(ww * .16)}" ry="${f(hh * .08)}" fill="#e8f0ff" opacity="${f((d - 120) / 80)}"/>`;
    }
    y += h;
  }
  return out;
}

// a powder keg lying with its head to us (the way kegs are stacked in a store, and the way one rolls away from us across
// the street): the body recedes a little up (we look down on it by `depth`), the chime round the head, the head's
// boards, its bung; tarred dark staves, iron hoops; lit warm by the lantern (warm 0..1, from
// `wa` — the direction it comes from) and the moon on the right edge (moon 0..1)
function kegEnd(u, cx, cy, r, o = {}) {
  const dep = o.depth || 0, warm = o.warm || 0, moon = o.moon == null ? .6 : o.moon, wa = o.wa || [-1, .3], g = nid('ke', u), h = nid('kh', u);
  const bx = cx, by = cy - dep, rb = r * 1.12;   // the back of the body (the far head, and the belly between the heads)
  const lc = mix('#2a1c12', '#d89048', warm * .75), dc = '#0e0805', wl = Math.hypot(wa[0], wa[1]), ux = wa[0] / wl, uy = wa[1] / wl;
  let out = `<defs>${linGrad(h, cx + ux * r, cy + uy * r, cx - ux * r, cy - uy * r, [[0, mix('#4a3420', '#e8a858', warm * .8), 1], [.55, mix('#2e2016', '#9a5a28', warm * .6), 1], [1, '#140c08', 1]])}</defs>`;
  // the body: the belly (bulging past the chime) from the far end to the near one
  out += `<path d="M${f(bx - rb)} ${f(by)}A${f(rb)} ${f(rb)} 0 0 1 ${f(bx + rb)} ${f(by)}L${f(cx + rb)} ${f(cy)}A${f(rb)} ${f(rb)} 0 0 1 ${f(cx - rb)} ${f(cy)}Z" fill="#1c140e" stroke="${dc}" stroke-width=".4"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rb)}" fill="#1c140e" stroke="${dc}" stroke-width=".45"/>`;
  // the staves seen on the body's top (between the heads) and the iron hoop over it
  if (dep > .8) { for (let k = -3; k <= 3; k++) { const a = -Math.PI / 2 + k * .36, x0 = cx + Math.cos(a) * rb, y0 = cy + Math.sin(a) * rb; out += `<path d="M${f(x0)} ${f(y0)}l0 ${f(-dep)}" stroke="${dc}" stroke-width=".35" opacity=".8"/>`; }
    out += `<path d="M${f(bx - rb * .96)} ${f(by + dep * .45)}A${f(rb)} ${f(rb)} 0 0 1 ${f(bx + rb * .96)} ${f(by + dep * .45)}" stroke="#0a0604" stroke-width="1.1" fill="none"/>`
      + `<path d="M${f(bx - rb * .7)} ${f(by + dep * .45 - rb * .72)}A${f(rb)} ${f(rb)} 0 0 1 ${f(bx + rb * .7)} ${f(by + dep * .45 - rb * .72)}" stroke="#8a96a8" stroke-width=".3" fill="none" opacity="${f(.25 + moon * .4)}"/>`; }
  // the near hoop round the belly just behind the chime, then the chime (the stave ends) and the head set into it
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rb - .5)}" fill="none" stroke="#0a0604" stroke-width="1.2"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${lc}" stroke="${dc}" stroke-width=".4"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * .8)}" fill="url(#${h})" stroke="${dc}" stroke-width=".35"/>`;
  // the head's boards and the bung: a small square plug in one board, off the middle
  for (const k of [-.42, 0, .42]) { const e = Math.sqrt(1 - k * k) * r * .8; out += `<path d="M${f(cx + k * r * .8)} ${f(cy - e)}V${f(cy + e)}" stroke="${dc}" stroke-width=".3" opacity=".7"/>`; }
  out += `<rect x="${f(cx + r * .1)}" y="${f(cy - r * .52)}" width="${f(r * .24)}" height="${f(r * .24)}" fill="${mix('#3a2a1a', '#c08048', warm * .6)}" stroke="${dc}" stroke-width=".3"/>`;
  // light on the chime and the belly: the lantern's side warm, the moon's on the right
  if (warm > .05) { const a0 = Math.atan2(uy, ux); out += `<path d="M${f(cx + Math.cos(a0 - .9) * r)} ${f(cy + Math.sin(a0 - .9) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(cx + Math.cos(a0 + .9) * r)} ${f(cy + Math.sin(a0 + .9) * r)}" stroke="#ffc070" stroke-width=".5" fill="none" opacity="${f(Math.min(.9, warm))}"/>`; }
  if (moon > .05) out += `<path d="M${f(cx + rb * Math.cos(-1.1))} ${f(cy - dep * .5 + rb * Math.sin(-1.1))}A${f(rb)} ${f(rb)} 0 0 1 ${f(cx + rb * Math.cos(.5))} ${f(cy + rb * Math.sin(.5))}" stroke="#cfe0ff" stroke-width=".5" fill="none" opacity="${f(moon * .8)}"/>`;
  return out;
}

// a pirate in silhouette against the night (flat dark shapes, as the watchman of the first round), facing right;
// (x, y) — the ground under the pelvis. pose 'push': bent low over a keg, both arms reaching down to its far side
// (the hands are behind it); 'carry': upright, leaning back under a keg hugged to his chest (his hands behind it).
// The moon puts a thin cold rim on his right edges. Returns the figure without the keg.
function pirate(u, L, x, y, pose, o = {}) {
  const c = o.c || '#11121a', band = o.band || '#4a1a1c', rim = '#cfe0ff', P = (a, b) => `${f(x + a)} ${f(y + b)}`;
  const limb = (pts, w, col = c) => `<path d="M${pts.map(([a, b]) => P(a, b)).join('L')}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  let out = '';
  if (pose === 'push') {
    // legs: the back one straight, driving off its toe; the front one bent under him; boots
    out += limb([[-1, -15.6], [-6.4, -8.6], [-11, -2.4]], 3.3) + limb([[-11.4, -2.6], [-9, -.4]], 2.5)
      + limb([[1, -15.6], [6.6, -9], [5, -1.8]], 3.3) + limb([[4.6, -1.4], [8.4, -.5]], 2.5);
    // the far arm (a little darker), reaching to the keg's far side
    out += limb([[9.4, -25.6], [14.4, -18.4], [18.2, -10.6]], 2.2, '#0a0b10');
    // the body bent forward: the hips back, the shoulders low over the keg; a sash at the waist
    out += `<path d="M${P(-3.4, -17)}Q${P(-3, -21.6)} ${P(3, -25.4)}Q${P(7.4, -28.4)} ${P(11.6, -26)}L${P(10.4, -22.4)}Q${P(5, -19.6)} ${P(3, -14.6)}Q${P(-.4, -13.4)} ${P(-3.4, -14.6)}Z" fill="${c}"/>`
      + `<path d="M${P(-3.2, -15.8)}L${P(3.2, -16.6)}" stroke="${band}" stroke-width="1.5"/>`;
    // the head forward and low, a bandana with its knot behind, the profile to the right
    out += `<circle cx="${f(x + 13.6)}" cy="${f(y - 28.6)}" r="2.6" fill="${c}"/><path d="M${P(15.8, -28.2)}l1 .9l-1 .5" fill="${c}"/>`
      + `<path d="M${P(11.2, -29.2)}Q${P(13.4, -32.6)} ${P(16.2, -30)}L${P(15.8, -29.2)}Q${P(13.4, -30.6)} ${P(11.4, -28.2)}Z" fill="${band}"/><path d="M${P(11.4, -29.4)}l-2.6 1.2M${P(11.4, -29.2)}l-2 2.4" stroke="${band}" stroke-width=".7" stroke-linecap="round"/>`;
    // the near arm over it, down to the keg's top (the hand goes behind the keg)
    out += limb([[10.4, -24.6], [15.4, -17.6], [19.4, -9.6]], 2.4);
    // the moon's rim on the right: the shin, the forearm, the face
    out += `<path d="M${P(7.6, -9)}L${P(6.2, -2.4)}M${P(16.4, -17.4)}L${P(19.4, -11.4)}M${P(16.2, -30)}q.9 1.4 .2 3" stroke="${rim}" stroke-width=".45" fill="none" opacity=".7" stroke-linecap="round"/>`;
  } else {
    // legs in a short step out of the door, the weight back under the keg
    out += limb([[-1, -15.6], [-3.4, -8.4], [-5.6, -1.8]], 3.3) + limb([[-6, -1.4], [-2.6, -.5]], 2.5)
      + limb([[1.4, -15.6], [4.4, -8.6], [5.4, -1.6]], 3.3) + limb([[5, -1.2], [8.6, -.5]], 2.5);
    // the body leaning back a little; a sash; the far arm round the keg (behind it)
    out += limb([[1.4, -27], [6, -24.4], [10, -22.4]], 2.2, '#0a0b10');
    out += `<path d="M${P(-3.8, -28.4)}Q${P(.2, -30.6)} ${P(3.6, -28.4)}L${P(3.6, -15.6)}Q${P(0, -14)} ${P(-3.2, -15.4)}Q${P(-4.4, -22)} ${P(-3.8, -28.4)}Z" fill="${c}"/>`
      + `<path d="M${P(-3.4, -16.4)}L${P(3.6, -16.8)}" stroke="${band}" stroke-width="1.5"/>`;
    // the head turned a little back over the shoulder (looking out for the watch), in a tricorn
    out += `<circle cx="${f(x + .6)}" cy="${f(y - 32.4)}" r="2.6" fill="${c}"/><path d="M${P(3, -32)}l1 .8l-1 .5" fill="${c}"/>`
      + `<path d="M${P(-3.8, -34)}L${P(5, -34.8)}L${P(3.4, -37.2)}L${P(.6, -36.2)}L${P(-2, -37.4)}Z" fill="${c}"/>`;
    // the near arm round the keg (the forearm and the hand behind it)
    out += limb([[2.6, -27.4], [4.2, -22], [8.6, -19.8]], 2.4);
    out += `<path d="M${P(3.6, -28.2)}L${P(3.6, -26)}M${P(4.6, -8.6)}L${P(5.6, -2)}M${P(3, -33.6)}q.8 1.2 0 2.4" stroke="${rim}" stroke-width=".45" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  return out;
}

// a keg painted on the sign: the store's mark (a plain keg outline, gilt)
const signKeg = (x, y) => `<path d="M${f(x - 2.4)} ${f(y - 3.4)}Q${f(x - 3.4)} ${f(y)} ${f(x - 2.4)} ${f(y + 3.4)}H${f(x + 2.4)}Q${f(x + 3.4)} ${f(y)} ${f(x + 2.4)} ${f(y - 3.4)}Z" fill="none" stroke="#e8c46a" stroke-width=".7"/><path d="M${f(x - 2.9)} ${f(y - 1.4)}h5.8M${f(x - 2.9)} ${f(y + 1.4)}h5.8" stroke="#e8c46a" stroke-width=".5"/>`;

// the moon: a sharp disc, limb a little darker, the maria where they are on the real moon, craters with a lit rim on
// the far side from the sun, Tycho's rays; only a faint tight corona (no blurred spot)
function moonDisc(u, { x, y, r }) {
  const g = nid('md', u), c = nid('mc', u), h = nid('mh', u), R = rng(83);
  const blob = (bx, by, rx, ry, sd) => { const q = rng(sd); return smooth(Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, k = 1 + (q() - .5) * .45; return [x + (bx + Math.cos(a) * rx * k) * r, y + (by + Math.sin(a) * ry * k) * r]; }), true); };
  let out = `<defs>${radGrad(g, x - r * .15, y - r * .15, r * 1.05, [[0, '#fbf8ec', 1], [.7, '#ece8d6', 1], [1, '#c8c4b0', 1]])}${radGrad(h, x, y, r * 2.6, [[.36, '#dfe8ff', .22], [.6, '#c8d8f0', .07], [1, '#c8d8f0', 0]])}<clipPath id="${c}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath></defs>`
    + `<circle cx="${x}" cy="${y}" r="${f(r * 2.6)}" fill="url(#${h})"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/><g clip-path="url(#${c})">`;
  // the maria: Imbrium, Serenitatis, Tranquillitatis, Crisium, Procellarum, Nubium, Fecunditatis
  for (const [bx, by, rx, ry, sd, op] of [[-.24, -.36, .3, .24, 1, .5], [.2, -.3, .17, .16, 2, .5], [.3, -.02, .22, .19, 3, .48], [.7, -.22, .1, .12, 4, .55], [-.56, .06, .28, .44, 5, .4], [-.1, .36, .2, .13, 6, .38], [.5, .26, .12, .19, 7, .42]])
    out += `<path d="${blob(bx, by, rx, ry, sd)}" fill="#9a9a90" opacity="${op}"/>`;
  // craters: a dark bowl, a light rim on the lower right
  for (let i = 0; i < 11; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * .85, cx = x + Math.cos(a) * d * r, cy = y + Math.sin(a) * d * r, cr = (.04 + R() * .07) * r;
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="#a8a69a" opacity=".7"/><path d="M${f(cx + cr)} ${f(cy)}A${f(cr)} ${f(cr)} 0 0 1 ${f(cx)} ${f(cy + cr)}" stroke="#fffaf0" stroke-width="${f(cr * .45)}" fill="none" opacity=".8"/>`; }
  // Tycho and Copernicus: bright craters, Tycho's rays
  const ty = [x - .12 * r, y + .7 * r], co = [x - .36 * r, y - .02 * r];
  out += [0, 1, 2, 3, 4, 5, 6].map(k => { const a = -Math.PI / 2 + (k - 3) * .5 + (R() - .5) * .2, l = (.5 + R() * .7) * r; return `<path d="M${f(ty[0])} ${f(ty[1])}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="#fffaf0" stroke-width="${f(r * .035)}" opacity=".45"/>`; }).join('')
    + `<circle cx="${f(ty[0])}" cy="${f(ty[1])}" r="${f(r * .07)}" fill="#fffef6"/><circle cx="${f(co[0])}" cy="${f(co[1])}" r="${f(r * .06)}" fill="#f8f4e6" stroke="#b0ae9e" stroke-width="${f(r * .02)}"/>`;
  // the limb: a crisp edge, a touch darker
  return out + `</g><circle cx="${x}" cy="${y}" r="${f(r - .15)}" fill="none" stroke="#bab6a2" stroke-width=".3" opacity=".7"/>`;
}

module.exports = { name: 'Ограбление банка', kind: 'deck', status: 'accepted', variant: 'a', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // the sky over the roofs on the right: stars, the moon, a cloud; beyond the roofs the masts of the Pearl at the
    // quay (furled, dark against the sky); the far roofs and a palm in silhouette
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 6 }) + PK.stars(30, 140, 0, 60, 80, 6) + moonDisc(u, MOON) + K.cloud(u, L, { x: 184, y: 30, w: 30, h: 5, seed: 7, far: .4 });
    for (const [mx, mt, yards] of [[158, 62, [70, 80]], [183, 58, [66, 77]]]) {
      bg += `<path d="M${mx} 100V${mt}" stroke="#0e1220" stroke-width="1.3"/><path d="M${mx} ${mt + 3}v-4" stroke="#0e1220" stroke-width=".7"/>`;
      for (const yy of yards) { const hw = yy < 72 ? 7 : 9.4; bg += `<path d="M${mx - hw} ${yy}h${2 * hw}" stroke="#0e1220" stroke-width=".9"/><path d="M${mx - hw + .6} ${yy + .9}Q${mx} ${yy + 2.6} ${mx + hw - .6} ${yy + .9}" stroke="#0e1220" stroke-width="1.5" fill="none"/>`; }
      bg += `<path d="M${mx} ${mt}L${mx - 12} 96M${mx} ${mt}L${mx + 12} 96" stroke="#0e1220" stroke-width=".35" opacity=".8"/>`; }
    bg += `<path d="M${CORNER} 104L156 96L164 98L168 90L184 92L188 86L200 88V${ST}H${CORNER}Z" fill="#141a28"/><rect x="170" y="94" width="3" height="3" fill="#ffc870" opacity=".75"/>`
      + `<path d="M190 ${ST - 26}q1 -14 -2 -24" stroke="#10141e" stroke-width="1.6" fill="none"/>` + [[-1, -.6], [-.8, .2], [.2, -.9], [.9, -.2], [1, .5]].map(([a, b]) => `<path d="M188 78q${f(a * 6)} ${f(b * 4 - 2)} ${f(a * 12)} ${f(b * 6 + 3)}" stroke="#10141e" stroke-width="1.4" fill="none"/>`).join('');
    // the facade: plaster in moonlight from the side (the right edge lit), cracks, the tiled eaves
    { const fg0 = nid('fc', u); bg += `<defs>${linGrad(fg0, 0, 0, CORNER, 0, [[0, '#22242e', 1], [.6, '#363846', 1], [1, '#4c4e5e', 1]])}</defs><rect x="-4" y="0" width="${CORNER + 4}" height="${ST}" fill="url(#${fg0})"/>`;
      const R = rng(3); for (let i = 0; i < 34; i++) { const x = R() * 140, y = 22 + R() * 100, w = 3 + R() * 7; bg += `<path d="M${f(x)} ${f(y)}h${f(w)}" stroke="${R() > .5 ? '#4a4c5c' : '#16171e'}" stroke-width="${f(.6 + R())}" opacity=".35" stroke-linecap="round"/>`; }
      bg += `<path d="M12 40l3 6l-1 5l4 7M132 70l-4 6l2 5" stroke="#121218" stroke-width=".5" fill="none" opacity=".8"/>`;
      // plaster fallen off in a patch, the bricks under it
      bg += `<path d="M14 92q6 -4 12 -1q4 4 1 9q-7 3 -13 -1z" fill="#3a2420"/>` + [[15, 93], [21, 93], [17, 96], [23, 96]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="2.4" fill="#6a3a2c" stroke="#24140e" stroke-width=".3"/>`).join('');
      // quoins at the corner, lit on their right faces by the moon
      for (let y = 20, k = 0; y < ST; y += 9, k++) { const w = k % 2 ? 9 : 13; bg += `<rect x="${CORNER - w}" y="${y}" width="${w}" height="8.4" fill="#40424e" stroke="#16171e" stroke-width=".4"/><path d="M${CORNER - .5} ${y}v8.4" stroke="#d8e0f0" stroke-width=".9" opacity=".8"/><path d="M${CORNER - w} ${y + .4}h${w}" stroke="#7a7e90" stroke-width=".4" opacity=".6"/>`; }
      // eaves: the roof tiles in a row of half-round ends, each lit on its right
      const tg = nid('tl', u); bg += `<defs>${linGrad(tg, 0, 0, 10, 0, [[0, '#3a1a14', 1], [.6, '#6a3426', 1], [1, '#9a5a40', 1]])}</defs><path d="M-6 0H${CORNER + 4}V15H-6Z" fill="#4a2620"/>`;
      { const R = rng(71); for (let x = -6; x < CORNER + 4; x += 9.6) { const w = 9.4 + R() * .4, hh = 5.4 + R() * 1.4, dy = (R() - .5) * .8; bg += `<path d="M${f(x)} ${f(15.6 + dy)}q${f(w / 2)} ${f(-hh)} ${f(w)} ${f(-dy * .5)}v-12h${f(-w)}z" fill="url(#${tg})" stroke="#1a0a06" stroke-width=".5"/>`; } }
      bg += `<path d="M-6 16.4H${CORNER + 4}" stroke="#0e0604" stroke-width="1.8"/><path d="M-6 19H${CORNER}" stroke="#000" stroke-width="2.4" opacity=".35"/>`; }
    // the upper floor: two barred windows (one lit — the store's clerk asleep upstairs), the sign with the store's mark
    const bars = (x0, y0) => [3, 6, 9, 12, 15].map(d => `<path d="M${x0 + d} ${y0}v22" stroke="#15161c" stroke-width=".8"/>`).join('');
    bg += `<rect x="78" y="24" width="18" height="22" fill="#0c0e16" stroke="#2a2c36" stroke-width="1.6"/>${bars(78, 24)}`
      + `<rect x="108" y="24" width="18" height="22" fill="#e8a850" opacity=".85" stroke="#2a2c36" stroke-width="1.6"/>${bars(108, 24)}` + K.localGlow(u, { x: 117, y: 35, color: '#ffb050', power: .4, radius: 14 }, { core: false })
      + `<path d="M76 47h22M106 47h22" stroke="#4a4c5a" stroke-width="1.4"/>`;
    { const sg = nid('sg', u); bg += `<defs>${linGrad(sg, 0, 52, 0, 64, [[0, '#7a5030', 1], [1, '#3a2210', 1]])}</defs><rect x="70" y="52" width="56" height="11" rx="1.5" fill="url(#${sg})" stroke="#1a0e06" stroke-width=".6"/>`
        + [84, 98, 112].map(x => signKeg(x, 57.5)).join('') + `<rect x="72.6" y="54" width="50.8" height="7" fill="none" stroke="#c9a048" stroke-width=".5"/><path d="M76 52v-3M120 52v-3" stroke="#2a2a2a" stroke-width=".7"/>`; }
    // the barred window on the left of the ground floor
    bg += `<rect x="16" y="56" width="20" height="24" fill="#0c0e16" stroke="#2a2c36" stroke-width="1.4"/>` + [4, 8, 12, 16].map(d => `<path d="M${16 + d} 56v24" stroke="#1a1b22" stroke-width=".9"/>`).join('') + `<path d="M14.4 81h23.2" stroke="#4a4c5a" stroke-width="1.4"/>`;
    // the doorway: a stone arch, the store inside — the back wall, the plank floor, the powder kegs stacked head-out,
    // the lantern on the floor; the moonlight falls in across the floor from the right
    { const { x0, x1, jamb, top } = DOOR, mx = (x0 + x1) / 2, d = `M${x0} ${ST}V${jamb}Q${mx} ${top - 12} ${x1} ${jamb}V${ST}Z`, cid = nid('dc', u), wg = nid('dw', u);
      bg += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath>${linGrad(wg, 0, top, 0, ST, [[0, '#08070a', 1], [1, '#16110e', 1]])}</defs><g clip-path="url(#${cid})"><rect x="${x0}" y="${top - 12}" width="${x1 - x0}" height="${ST - top + 12}" fill="url(#${wg})"/>`;
      // the floor: planks running in, lit a little by the lantern
      bg += `<path d="M${x0} 118.6H${x1}V${ST}H${x0}Z" fill="#241a12"/>` + [121, 123.6, 126.2].map(y => `<path d="M${x0} ${y}H${x1}" stroke="#0e0906" stroke-width=".4"/>`).join('');
      bg += `<path d="M${x1} 118.6L${x1 - 22} 118.6L${x1 - 38} ${ST}H${x1}Z" fill="#9aaccc" opacity=".14"/>`;
      // the kegs: a pyramid of four rows, head-out, lit warm by the lantern on the left, the far ones darker
      const rk = 5.6, rows = [[4, 112.4], [3, 102], [2, 91.6], [1, 81.2]];
      rows.forEach(([n, cy], ri) => { for (let i = 0; i < n; i++) { const cx = mx - (n - 1) * rk * 1.12 + i * rk * 2.24, dl = Math.hypot(cx - LAMP.x, cy - LAMP.y), warm = Math.max(.08, 1 - dl / 46);
        bg += kegEnd(u, cx, cy, rk, { warm, moon: cx > mx ? .25 : 0, wa: [LAMP.x - cx, LAMP.y - cy] }); } });
      bg += `<rect x="${x0}" y="${top - 12}" width="${x1 - x0}" height="${ST - top + 12}" fill="#06050a" opacity=".18"/>`;
      // the dark lantern on the floor: a tin box, its little door open a crack toward the kegs
      bg += K.localGlow(u, { x: LAMP.x, y: LAMP.y - 3, color: '#ffb850', power: .55, radius: 30 }, { core: false })
        + `<path d="M${LAMP.x - 2.4} ${LAMP.y}V${LAMP.y - 5.4}L${LAMP.x} ${LAMP.y - 7}L${LAMP.x + 2.4} ${LAMP.y - 5.4}V${LAMP.y}Z" fill="#1a1612" stroke="#060404" stroke-width=".35"/><rect x="${LAMP.x - 1.2}" y="${LAMP.y - 4.6}" width="2.2" height="3.2" fill="#ffd68a"/><path d="M${LAMP.x} ${LAMP.y - 7}v-1.4" stroke="#1a1612" stroke-width=".5"/></g>`;
      // the arch: dressed stones round it, the keystone; the threshold
      { const R = rng(5); for (let i = 0; i <= 8; i++) { const t = i / 8, ax = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1, ay = (1 - t) * (1 - t) * jamb + 2 * t * (1 - t) * (top - 12) + t * t * jamb, w = i === 4 ? 6.4 : 5;
          bg += `<rect x="${f(ax - w / 2)}" y="${f(ay - 5)}" width="${w}" height="5.2" fill="${mix('#3e404c', '#545664', R())}" stroke="#16171e" stroke-width=".4" transform="rotate(${f((t - .5) * 64)} ${f(ax)} ${f(ay)})"/>`; } }
      for (const jx of [x0 - 2.6, x1 + 2.6]) for (let y = jamb; y < ST; y += 7.6) bg += `<rect x="${jx - 2.8}" y="${y}" width="5.6" height="7.2" fill="#464854" stroke="#16171e" stroke-width=".4"/>`;
      bg += `<path d="M${x1 + 5.4} ${jamb}V${ST}" stroke="#d8e0f0" stroke-width=".6" opacity=".6"/><path d="M${x0 - 4} ${ST - .6}H${x1 + 4}" stroke="#5a5c68" stroke-width="1.6"/>`;
      // the doors thrown open outward: plank leaves with iron straps, the left one swung to us (its edge nearer and
      // lower), the right one the same; the hasp torn out of the right leaf, hanging by a nail
      const leaf = (hx, ox, k) => { const pts = [[hx, ST + .4], [hx, jamb - 2], [ox, jamb - 3.4], [ox, ST + 4.6]], dd = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', lg = nid('lf', u);
        let s = `<defs>${linGrad(lg, hx, 0, ox, 0, [[0, k > 0 ? '#2a2018' : '#3a2c20', 1], [1, k > 0 ? '#4a3a2a' : '#22180f', 1]])}</defs><path d="${dd}" fill="url(#${lg})" stroke="#0c0806" stroke-width=".5"/>`;
        for (let i = 1; i < 4; i++) { const t = i / 4, xa = hx + (ox - hx) * t; s += `<path d="M${f(xa)} ${f(jamb - 2 - 1.4 * t)}V${f(ST + .4 + 4.2 * t)}" stroke="#0c0806" stroke-width=".35"/>`; }
        for (const t of [.18, .78]) { const ya = jamb - 2 + (ST - jamb + 2) * t; s += `<path d="M${hx} ${f(ya)}L${ox} ${f(ya - 1.4 + 5.6 * t)}" stroke="#14141a" stroke-width="1.5"/>`; }
        if (k > 0) s += `<path d="M${ox} ${jamb}V${ST + 4.4}" stroke="#cfe0ff" stroke-width=".5" opacity=".55"/>`;
        return s; };
      bg += leaf(x0 - 5.4, x0 - 16, -1) + leaf(x1 + 5.4, x1 + 16.6, 1);
      bg += `<path d="M${x1 + 15.4} 101.6l.6 4.4" stroke="#2a2a30" stroke-width="1.1"/><rect x="${x1 + 15}" y="105.6" width="2.2" height="5" rx=".4" fill="#2a2a30" transform="rotate(-8 ${x1 + 16} 106)"/>`; }
    // the street: cobbles in perspective, wet under the moon
    bg += cobbles(u, L, ST, 285) + `<path d="M-4 ${ST}H${CORNER}" stroke="#08080c" stroke-width="1.4"/><path d="M-4 ${ST + .6}H${CORNER}" stroke="#4a4c58" stroke-width=".5" opacity=".6"/>`;
    // the lantern's warmth out of the door onto the threshold
    bg += K.localGlow(u, { x: 80, y: ST + 3, color: '#ffb050', power: .3, radius: 26 }, { squash: .3, core: false });
    let fg = '';
    // on the cobbles by the door: the broken padlock (its shackle cut) and the crowbar leant on the left jamb
    fg += K.contactShadow(u, 122, 141, 6, L, { ry: .6, opacity: .6 }) + `<rect x="119.6" y="137.4" width="4.6" height="3.8" rx=".8" fill="#3a3832" stroke="#0c0c0a" stroke-width=".35"/><path d="M120.6 137.6q.2 -2.6 1.8 -2.8M123.6 137.4q.4 -1.4 -.2 -2" stroke="#3a3832" stroke-width=".7" fill="none"/><path d="M124.2 138v3" stroke="#cfe0ff" stroke-width=".35" opacity=".6"/>`
      + `<path d="M52.4 ${ST + 1}L46.4 104.6q-.6 -2.2 1.2 -2.8" stroke="#1a1a20" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M52.8 ${ST + .6}L47 105" stroke="#8a96a8" stroke-width=".3" opacity=".5"/>`;
    // pirate B coming out of the door hugging a keg (the keg drawn over his arms: his hands are behind it)
    fg += K.castShadow(u, L, { x: PB.x + 2, y: PB.y, w: 14, h: 36, horizon: HZ, d: .5, opacity: .45 }) + K.contactShadow(u, PB.x + 1, PB.y, 16, L, { ry: 1.1, opacity: .6 });
    fg += pirate(u, L, PB.x, PB.y, 'carry');
    fg += K.barrel(u, L, { x: PB.x - 4.4, y: PB.y - 23.6, s: KS, kind: 'powder', rot: 90, ell: .3, contact: false, seed: 6 });
    // pirate A rolling a keg over the cobbles to the right (his hands on its far side, behind it)
    fg += K.castShadow(u, L, { x: PA.x + 4, y: PA.y, w: 16, h: 30, horizon: HZ, d: .5, opacity: .45 }) + K.contactShadow(u, PA.x, PA.y, 18, L, { ry: 1.1, opacity: .6 });
    fg += pirate(u, L, PA.x, PA.y, 'push', { band: '#5a1e1a' });
    { const kx = 147, ky = 135.6 - 6.8; fg += K.contactShadow(u, kx, 135.6, 14, L, { ry: 1, opacity: .75 }) + kegEnd(u, kx, ky, 6, { depth: 2.6, moon: .9, warm: 0 }); }
    // keg C rolling on toward the corner and the harbour: a little smaller (further), the cobbles' wet shine round it
    { const kx = 177, ky = 134.6 - 5.6; fg += K.contactShadow(u, kx, 134.6, 12, L, { ry: .9, opacity: .7 }) + kegEnd(u, kx, ky, 5.2, { depth: 2.2, moon: 1, warm: 0 })
        + `<path d="M${kx - 12} 133.2h5M${kx - 14} 135h6" stroke="#cfe0ff" stroke-width=".4" opacity=".45" stroke-linecap="round"/>`; }
    // light: the moon's veil, the dark under the glass
    fg += gloom(u, 160, 40, 0, 100, .3, '#04060c') + gloom(u, 100, 140, 100, 280, .62, '#020408');
    return [bg, fg];
  } };
