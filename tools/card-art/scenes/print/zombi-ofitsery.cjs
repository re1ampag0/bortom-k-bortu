// «Зомби-офицеры» (Месть королевы Анны, РЕАКЦИЯ: отмените весь урон по Команде от этого Залпа или карты), refined
// from the first-round scene (portrait-revenge.cjs SCENES['Зомби-офицеры']): night on the Revenge's deck in a red
// haze, the moon high behind. A dead officer stands close to us, chest up, unmoved: a round shot has just gone
// clean through his chest — through the ragged hole we see the sky and the sea behind him, and the ball itself
// flies on away over the rail; grapeshot holes smoulder in his coat. He only touches the brim of his tricorn with
// bony fingers. He stands alone: nothing draws the eye from him (the far officer of round one is left out).
// Kept: the idea (hit, and nobody falls), the night and the red haze, the moon, the near officer chest up with the
// hole you look through, the ball flying away, the hand at the hat.
// Fixed against the first round: the raised arm was a stiff tube with a flat glove — now one sleeve from the shoulder
// through the elbow to the cuff and a hand (people.cjs hand3) round the brim left of the front corner (a salute); the
// head was a flat green mask — now a 3/4 head (head34) with sunken cheeks, dark sockets, dull glowing eyes, bared
// teeth, lank grey hair, the tricorn turned with it (hat.cjs); he is drawn at 110 units/m and zoomed ×1.4 about his
// point on the horizon (as if 30 % nearer), so he fills the space above the glass; the hole was a ring on the coat
// — now cut through: the background is drawn again inside it; the rail and the deck share his eye level. Light: the moon high behind, upper right (key, contre-jour: cold-red rims
// on the hair, shoulders and the right edges); the red haze of the sky in front (fill). No blood, no wounds inside.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { tricorn, rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 112, EYE = 1.2;                         // a low eye: we look up at him
const MOON = { x: 150, y: 22 };
const RAIL = { top: 116, foot: 158 };              // the far bulwark ~3.5 m away (38 units/m)
const HEAD = { c: [107, 63.5], r: 11 };            // the near officer ~1.2 m away (110 units/m); the head sits low: a short neck
const ZOOM = 1.4;                                  // he is drawn at 110 units/m and moved closer: scaled about his point on the horizon
const TZ = p => [107 + (p[0] - 107) * ZOOM, HZ + (p[1] - HZ) * ZOOM];
const HOLE = { x: 115.4, y: 103.6, r: 11.6 };      // the shot hole through his chest (in the picture, after the zoom)
const BALL = { x: 176, y: 100, r: 2.6 };           // the ball flying away behind him
const light = { time: 'night', haze: .4, key: { type: 'moon', x: MOON.x, y: MOON.y, color: '#ffc8a8', power: .85 },
  fill: { color: '#6a2430', power: .5 }, rim: { az: 330, color: '#ffb08a', power: .7 } };
const skel = { horizon: HZ, eye: EYE, light: 'the moon high behind, upper left (key, contre-jour) + the red haze in front (fill)', items: [
  ['bulwark', -10, RAIL.foot, 220, RAIL.foot - RAIL.top, 'deck, ~3.5 m behind the near officer', 1.1, { bg: 1 }],
  ['near officer', 54, 280, 100, 250, 'deck (feet off the frame), 1.2 m away', { edge: 1 }],
  ['hand at the hat', 74, 62, 22, 26, 'his raised arm'], ['hole', HOLE.x - 9, HOLE.y + 9, 18, 18, 'through his chest'],
  ['ball', BALL.x - 3, BALL.y + 3, 6, 6, 'in the air behind him, flying away'], ['moon', MOON.x - 8, MOON.y + 8, 16, 16, 'sky']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const RIMC = '#ffb08a';
const DEAD = { lit: '#a2ae8a', half: '#6e7a5e', core: '#566048', shadow: '#2c3426', outline: '#11160c' };      // grey-green dry skin
const DEADH = { lit: '#9aa684', half: '#68745a', core: '#525c44', shadow: '#2a3224', outline: '#10140a' };
const COAT = { lit: '#3a4470', half: '#1c2240', shadow: '#0c0f1e', outline: '#05060c' };
const RED = { lit: '#a8301e', half: '#6e1812', shadow: '#360806', outline: '#1e0402' };
const BUFF = { lit: '#cbbf98', half: '#968a68', shadow: '#4e4634', outline: '#22200c' };
const smooth = (pts, closed) => H.sp(pts, closed);
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// a hand round a cylinder whose axis must run at t degrees (from na-abordazh.cjs)
function handOn(u, base, grip, t, a0) {
  let a = a0, h;
  for (let k = 0; k < 6; k++) { h = H.hand3(u, { ...base, a, grip }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
    let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
  return h;
}
// the knuckles and tendons over a hand3 hand: what makes it read as bony (no wounds — just skin over bone)
function bony(h, tn, k = 1) {
  let s = '';
  for (const J of h.joints) for (let j = 1; j < J.length - 1; j++) s += `<circle cx="${f(J[j][0])}" cy="${f(J[j][1])}" r="${f(.42 * k)}" fill="${tn.lit}" opacity=".55"/><circle cx="${f(J[j][0] + .25 * k)}" cy="${f(J[j][1] + .3 * k)}" r="${f(.3 * k)}" fill="${tn.shadow}" opacity=".5"/>`;
  for (const J of h.joints.slice(0, 4)) s += `<path d="M${P2(h.wrist)}L${P2(J[0])}" stroke="${tn.shadow}" stroke-width="${f(.3 * k)}" opacity=".45"/>`;
  return s;
}

// the background: the night sky in the red haze, the moon, the sea, the far bulwark and the deck — drawn twice
// (once for the scene, once inside the hole through his chest)
function background(u, L) {
  let s = K.sky(u, L, { horizon: HZ, stars: 40, seed: 3 }) + K.sunMoon(u, L, { r: 7.5 });
  for (const [x, y, w, h, sd, fr] of [[150, 40, 90, 8, 4, .35], [40, 58, 70, 6, 9, .5], [176, 84, 60, 5, 2, .65], [96, 92, 50, 4, 12, .75]]) s += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
  s += glow(u, MOON.x, MOON.y, 46, 34, '#ffb090', .35) + K.water(u, L, { horizon: HZ, bottom: RAIL.top + 4, swell: .4, seed: 6, glitter: MOON.x });
  // a far ship of the enemy low on the horizon, dark, the smoke of her broadside drifting
  s += K.ship(u, L, { kind: 'endeavour', x: 176, y: HZ + .6, scale: .16, sails: 'reefed', detail: 'far', flip: true, seed: 5 });
  s += K.smoke(u, L, { x: 160, y: HZ - 1, w: 30, h: 12, wind: -.8, seed: 7, opacity: .45 });
  s += K.bulwark(u, L, { x1: -10, x2: 210, y: RAIL.foot, h: RAIL.foot - RAIL.top, kind: 'oak', posts: 30, seed: 5 });
  s += `<path d="M-10 ${RAIL.top + .4}H210" stroke="${RIMC}" stroke-width=".6" opacity=".55"/>`;
  { const id = nid('dk', u); s += `<defs><clipPath id="${id}"><rect x="-10" y="${RAIL.foot}" width="220" height="${290 - RAIL.foot}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: RAIL.foot, bottom: 290, vx: 104, kind: 'oak', plank: 16, seed: 9 })}</g>`; }
  return s;
}

module.exports = { name: 'Зомби-офицеры', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE });
    L.pal = Object.assign({}, L.pal, { sky: ['#0a0306', '#2a0a10', '#6a1e16', '#b04a2a'], sea: ['#7a2c1c', '#3a1210', '#140606'], cloudLit: '#e88a68', cloudShade: '#2a0a10', smoke: '#5a3a3a' });
    const bg = background(u, L);

    // ——— the near officer ———
    let man = '';
    // the coat skirts and the body: shoulders 82–132, open in front over the buff waistcoat, down out of the frame
    const cg = nid('cg', u);
    const coat = [[84, 82], [79, 90], [77, 110], [79, 134], [74, 180], [68, 240], [64, 292], [150, 292], [146, 240], [140, 180], [135, 134], [137, 110], [135, 90], [130, 82], [116, 78], [98, 78]];
    man += `<defs>${linGrad(cg, 70, 70, 140, 130, [[0, COAT.lit, 1], [.35, COAT.half, 1], [1, COAT.shadow, 1]])}</defs><path d="${smooth(coat, true)}" fill="url(#${cg})" stroke="${COAT.outline}" stroke-width=".6"/>`;
    // the waistcoat between the lapels, its buttons, the buff breeches below its pointed hem
    man += `<path d="M99 84L115 84L119 140L112 148L104 148L96 140Z" fill="${BUFF.half}" stroke="${BUFF.outline}" stroke-width=".4"/><path d="M99 84L96 140L104 148" stroke="${BUFF.lit}" stroke-width="1" fill="none" opacity=".35"/>`
      + [94, 104, 114, 124, 134].map(y => `<circle cx="${f(107.4 + (y - 94) * .04)}" cy="${y}" r=".8" fill="#8a7a4a" stroke="${BUFF.outline}" stroke-width=".2"/>`).join('')
      + `<path d="M96 140L104 148L112 148L119 140L122 200L92 200Z" fill="${BUFF.shadow}"/><path d="M107 150V200" stroke="${BUFF.outline}" stroke-width=".5"/>`;
    // the red lapels turned back, gold buttons on them; the skirt's front edges
    man += `<path d="M98 80L104 84L97 138L90 136Q91 104 98 80Z" fill="${RED.half}" stroke="${RED.outline}" stroke-width=".45"/>`
      + `<path d="M116 80L110 84L118 138L126 136Q124 104 116 80Z" fill="${RED.shadow}" stroke="${RED.outline}" stroke-width=".45"/>`
      + [92, 102, 112, 122, 132].map((y, i) => K.shadeSphere(u, 93.6 - i * .5, y, 1.25, L, 'brass', { outline: .25 }) + K.shadeSphere(u, 121 + i * .6, y, 1.2, L, 'brass', { outline: .25 })).join('')
      + `<path d="M90 136Q86 200 82 292M126 136Q130 200 134 292" stroke="${COAT.outline}" stroke-width=".9" fill="none"/><path d="M89 140Q85 200 81 292" stroke="${COAT.lit}" stroke-width=".5" fill="none" opacity=".5"/>`
      // folds of the coat, the rim of the moon on its left edge and the left shoulder
      + `<path d="M82 140q-3 30 -8 70M88 150q-2 40 -5 90M132 146q3 40 8 90M138 112q1 14 -2 24" stroke="${COAT.shadow}" stroke-width=".9" fill="none" opacity=".7"/>`
      + `<path d="${smooth([[130, 82], [135, 90], [137, 110], [135, 134], [140, 180]])}" stroke="${RIMC}" stroke-width=".9" fill="none" opacity=".55"/>`
      + `<path d="M122 140q4 10 2 22M128 150q2 14 4 30" stroke="#0a0d1a" stroke-width=".7" fill="none" opacity=".6"/>`;
    // the white stock round the neck, the short neck under the jaw
    man += `<path d="M101 70L101.6 79L112.4 79L113 70Z" fill="${DEAD.half}" stroke="${DEAD.outline}" stroke-width=".35"/><path d="M103.4 72q.8 3 0 6M110.6 72q-.8 3 0 6" stroke="${DEAD.shadow}" stroke-width=".5" fill="none" opacity=".7"/>`
      + `<path d="M100.4 77.4Q107 75.6 113.6 77.4L112.8 81.4Q107 83 101.2 81.4Z" fill="#c8c0aa" stroke="#4a4436" stroke-width=".35"/><path d="M104.6 81.6L106.4 88L107.6 88L109.4 81.6Z" fill="#b8b098" stroke="#4a4436" stroke-width=".3"/><path d="M102.6 79.4q4.4 1.6 8.8 0M106.2 83l.6 4" stroke="#7a7262" stroke-width=".35" fill="none"/>`;
    // the torn epaulettes: gold boards on both shoulders, the fringe with strands missing
    const epaulette = (x, y, dir, R) => { let s = `<g transform="rotate(${dir * 14} ${x} ${y})"><path d="M${x - 10} ${y + 1}q10 -6.4 20 0l-1 3.4h-18z" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".4"/><path d="M${x - 9} ${y}q9 -5 18 0" stroke="#fff0c0" stroke-width=".4" fill="none" opacity=".55"/>`;
      for (let k = 0; k < 10; k++) { if (k === 3 || k === 4 || k === 8) continue; s += `<path d="M${f(x - 9 + k * 2)} ${y + 4.2}q${f(dir * .5)} ${f(3 + R() * 2)} ${f(dir * .9)} ${f(5 + R() * 2.4)}" stroke="#c8a040" stroke-width=".85" fill="none"/>`; }
      return s + `<path d="M${x - 2} ${y + 4.4}l1 3.4l1.2 -2" stroke="#3a2808" stroke-width=".4" fill="none"/></g>`; };
    const Re = rng(13);
    // ——— the hole through his chest (picture coordinates, over the zoomed figure): the background again inside it,
    // a ragged rim of cloth, the cloth's layers at the edge — dark and dry, nothing inside ———
    const holePts = []; { const R = rng(21); const ph = R() * 6; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, rr = HOLE.r * (.92 + .07 * Math.sin(a * 3 + ph) + .05 * Math.sin(a * 7 + ph * 2) + (R() - .5) * .08); holePts.push([HOLE.x + Math.cos(a) * rr, HOLE.y + Math.sin(a) * rr * 1.06]); } }
    const hp = 'M' + holePts.map(P2).join('L') + 'Z', hc = nid('hc', u);
    let through = `<defs><clipPath id="${hc}"><path d="${hp}"/></clipPath></defs><g clip-path="url(#${hc})">${background(u, L)}</g>`;
    through += `<path d="${hp}" fill="none" stroke="#0e0a0c" stroke-width="2"/><path d="${hp}" fill="none" stroke="#4a4232" stroke-width="1.1" transform="translate(-.9 -.7)" opacity=".8"/>`
      + `<path d="${hp}" fill="none" stroke="${RED.half}" stroke-width=".6" transform="translate(1.1 .9)" opacity=".7"/>`;
    { const R = rng(5); for (let i = 0; i < 40; i += 2) { const p = holePts[i], d = unit([p[0] - HOLE.x, p[1] - HOLE.y]), l = .8 + R() * 1.4;
      through += `<path d="M${P2(p)}l${f(d[0] * l + (R() - .5) * .8)} ${f(d[1] * l + (R() - .5) * .8)}" stroke="${p[0] < HOLE.x + 2 ? '#c0b490' : '#8a2418'}" stroke-width=".45" opacity=".8"/>`; } }
    through += `<path d="M${f(HOLE.x - 11)} ${f(HOLE.y - 5)}l-4 -3l1.4 5.2z" fill="${BUFF.half}" stroke="${BUFF.outline}" stroke-width=".3"/><path d="M${f(HOLE.x + 10.4)} ${f(HOLE.y + 7)}l4 4.2l-.4 -5.6z" fill="${RED.half}" stroke="${RED.outline}" stroke-width=".3"/>`;
    through += K.smoke(u, L, { x: HOLE.x + 8, y: HOLE.y - 6, w: 18, h: 20, wind: .8, seed: 3, opacity: .3 });
    // grapeshot holes in the coat (figure coordinates): small, the haze glowing through them
    let holes = '';
    for (const [x, y, r] of [[84, 120, 1.5], [129, 140, 1.4]]) {
      holes += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 1.1)}" fill="#8a3424"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 1.1)}" fill="none" stroke="#06040a" stroke-width=".55"/>`
        + `<path d="M${f(x - r)} ${y}l-.8 -.6M${f(x + r)} ${f(y + .4)}l.8 .5M${x} ${f(y - r)}l.3 -.8" stroke="#7a7a90" stroke-width=".25"/>`
        + `<path d="M${x} ${f(y - r)}q-1.6 -3 .4 -5.6q2 -2.6 .2 -6" stroke="#b8a8a8" stroke-width=".7" fill="none" opacity=".35" stroke-linecap="round"/>`; }
    // ——— his left arm (our right): the sleeve down along his side, the hand on the sword's hilt at his hip ———
    const GH = [139, 151], hiltAng = -58;
    const hH = handOn(u, { s: 2, m: 1, roll: 30, pitch: 6, pose: 'wrap', r: 1, tone: DEADH, light: [-.6, -.7], sw: .3, tilt: 6, fingerW: .82, palmW: .94 }, GH, hiltAng, 120);
    const sleeve = (sh, el, w, sd, rimOp, seed) => H.cloth(u, { spine: [sh, [lerp(sh[0], el[0], .5), lerp(sh[1], el[1], .5)], el, [lerp(el[0], w[0], .5), lerp(el[1], w[1], .5)], w],
      w: [13, 12, 11, 10, 9.4], tone: COAT, lit: -1, rim: RIMC, rimSide: sd, rimOp, seed, drapes: 0, folds: false, sw: .45, capA: true,
      cuff: { from: .88, k: 1.12, tone: RED } });
    let swordArm = '';
    { const v = [Math.cos(hiltAng * Math.PI / 180), Math.sin(hiltAng * Math.PI / 180)], nn = [-v[1], v[0]], g = hH.grip, at = (t, o) => [g[0] + v[0] * t + nn[0] * o, g[1] + v[1] * t + nn[1] * o];
      swordArm += K.shadeCyl(u, ...at(-6, 0), ...at(-48, 2), 1.8, L, 'leather', { outline: .35, r2: 1.5 }) + `<path d="M${P2(at(-46, 2))}l${f(-v[0] * 4)} ${f(-v[1] * 4)}" stroke="url(#brass${u})" stroke-width="3.4"/>`;
      swordArm += `<path d="M${P2(at(-5, -4))}Q${P2(at(-7, 0))} ${P2(at(-5, 4.4))}" stroke="url(#brass${u})" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      swordArm += sleeve([132, 88], [143, 122], hH.wrist, 1, .6, 7) + hH.back + K.shadeCyl(u, ...at(-4.6, 0), ...at(5, 0), 1.3, L, 'leather', { outline: .3 }) + K.shadeSphere(u, ...at(6, 0), 1.8, L, 'brass', { outline: .3 }) + hH.front + bony(hH, DEADH, 2); }
    // ——— the head: 3/4 to our left, chin up; lank grey hair, the dead face, the tricorn ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .32, dir: -1, nod: -5, tone: DEAD, light: [-.55, -.8], warm: { color: '#ff8a6a', op: .14 },
      eye: 'half', white: '#161a10', iris: '#d0f080', look: [.2, 0], brow: 'calm', mouth: .42, smile: .08, lips: '#2e3026', hair: { style: 'long', color: '#7e7e76' }, hairColor: '#6a6a62', noseL: 1.15, noseW: .8, eyeH: .9 });
    let head = hd.svg;
    { const Q = hd.Q, r = HEAD.r, soft = (p, rx, ry, col, op) => { const g = nid('dz', u); return `<defs>${radGrad(g, p[0], p[1], Math.max(rx, ry), [[0, col, op], [1, col, 0]])}</defs><ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})"/>`; };
      // sunken cheeks and temples, the sockets deep and dark round the eyes, the cheekbone's hard edge
      for (const sd of [-1, 1]) if (hd.depth(sd * .5, .4, .6) > 0) head += soft(Q(sd * .46, .44, .64), r * .3, r * .24, '#141a0e', .7) + soft(Q(sd * .62, -.3, .5), r * .2, r * .24, '#141a0e', .5) + soft(Q(sd * .34, -.07, .82), r * .24, r * .17, '#080a04', .75)
        + `<path d="M${P2(Q(sd * .7, .14, .42))}Q${P2(Q(sd * .5, .24, .7))} ${P2(Q(sd * .26, .3, .86))}" stroke="${DEAD.lit}" stroke-width=".45" fill="none" opacity=".55"/>`;
      for (const sd of [-1, 1]) { const e = Q(sd * .34, -.05, .84); if (hd.depth(sd * .45, 0, .9) > .1) head += glow(u, e[0], e[1], 2.8, 2, '#d0f080', .6); }
      // the teeth bared between thin lips, a split in the dry skin on the brow and down the cheek
      { const a = Q(-.17, .64, .93), b = Q(.17, .64, .93); head += `<path d="M${P2(a)}L${P2(b)}" stroke="#cfc6a6" stroke-width="1" opacity=".85"/>` + [-.1, -.03, .04, .11].map(x => { const p = Q(x, .6, .96), q = Q(x, .68, .96); return `<path d="M${P2(p)}L${P2(q)}" stroke="#2a2a20" stroke-width=".25"/>`; }).join(''); }
      head += `<path d="M${P2(Q(.42, -.62, .62))}L${P2(Q(.5, -.42, .66))}L${P2(Q(.44, -.3, .72))}" stroke="${DEAD.shadow}" stroke-width=".35" fill="none" opacity=".8"/>`
        + `<path d="M${P2(Q(-.62, .28, .5))}Q${P2(Q(-.52, .5, .58))} ${P2(Q(-.44, .66, .6))}" stroke="${DEAD.shadow}" stroke-width=".4" fill="none" opacity=".6"/>`; }
    const HATR = 1.7, HATUP = .75;                     // the brim's reach (wide: a big officer's hat) and how high it is turned up
    const hat = tricorn(u, hd, { r: HEAD.r, color: '#120e14', trim: '#c9a048', light: [-.55, -.8], size: HATR, turnUp: HATUP });
    // a grapeshot hole through the hat's crown
    const hatHole = (() => { const p = hd.Q(.3, -1.25, .45); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".9" fill="#d0663e" stroke="#050304" stroke-width=".45"/>`; })();
    // ——— his right arm (our left), raised: one sleeve from the shoulder out to the elbow and up to the cuff; his bony
    // fingers round the front of the brim left of the corner, the thumb under it (touching the hat: all is well) ———
    // points on the brim's outer edge (hat.cjs tricorn's own formula) at t degrees from the front corner
    const brim = (t, dy = 0) => { t *= Math.PI / 180; const k = Math.pow(Math.sin(1.5 * t), 2), rr = 1 + (HATR - 1) * (1 - k) + .08 * k; return hd.Q(Math.sin(t) * rr, -.68 - HATUP * k + .08 * (1 - k) + dy, Math.cos(t) * rr * .98 - .1); };
    const E0 = brim(-35), E1 = brim(-15), brimAng = Math.atan2(E1[1] - E0[1], E1[0] - E0[0]) * 180 / Math.PI, GR = brim(-25, .035);
    const hR = handOn(u, { s: 1.9, m: 1, roll: 0, pitch: 10, pose: 'wrap', r: .45, tone: DEADH, light: [-.6, -.7], sw: .3, tilt: 4, fingerW: .82, palmW: .92 }, GR, brimAng, -40);
    // the elbow up at the level of his ear: a short upper arm and forearm (≈ 1.2 head each), no long curve
    const raisedSleeve = sleeve([86, 87], [73.5, 66], hR.wrist, -1, .3, 9);
    man += epaulette(126, 84, 1, Re) + swordArm + holes;
    man += head + rimArc(hd, { r: HEAD.r, light: [-.4, .9], color: RIMC, span: 40, opacity: .5 }) + hat.back + hR.back + hat.front + hatHole + raisedSleeve + epaulette(88, 85, -1, Re) + hR.front + bony(hR, DEADH, 1.9);
    // the ball beyond him, flying away over the rail: its trail back towards the hole
    const bt = nid('bt', u);
    const ball = `<defs>${linGrad(bt, BALL.x - 24, BALL.y, BALL.x, BALL.y, [[0, '#ffd8b0', 0], [1, '#ffd8b0', .5]])}</defs><path d="M${f(BALL.x - 24)} ${f(BALL.y + 1.6)}L${f(BALL.x)} ${f(BALL.y - BALL.r * .8)}L${f(BALL.x)} ${f(BALL.y + BALL.r * .8)}L${f(BALL.x - 24)} ${f(BALL.y + 2.6)}Z" fill="url(#${bt})"/>`
      + K.shadeSphere(u, BALL.x, BALL.y, BALL.r, L, 'iron', { outline: .3 });
    // ——— the air: the moon's haze, motes, the dark coming up from the deck and the corners ———
    const air = motes(16, 0, 20, 200, 80, '#ffc8a8', 5) + gloom(u, 100, 120, 100, 280, .55, '#0a0204') + gloom(u, 100, 90, -10, 30, .25, '#0a0204') + glow(u, MOON.x, MOON.y + 20, 60, 50, '#ff9070', .12);
    return [bg, ball + `<g transform="translate(107 ${HZ}) scale(${ZOOM}) translate(-107 -${HZ})">${man}</g>` + through + air];
  } };
