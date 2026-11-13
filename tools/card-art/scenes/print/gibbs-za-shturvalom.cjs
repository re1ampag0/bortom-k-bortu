// «Гиббс за штурвалом» (Жемчужина, ПРИКАЗ: возьмите 2 карты), refined from the first-round scene
// (portrait-pearl.cjs SCENES['Гиббс за штурвалом']): the old mate at the wheel at night, his weathered hands on the
// spokes, the binnacle beside the wheel, a flask, the moon. The first round stood behind him and showed only two stiff
// forearms; now we stand forward of the wheel and look aft at him, so the brief's helmsman shows: an older sailor with
// grey mutton-chop sideburns joined to his moustache, a knitted watch cap, a neckerchief, a worn coat; his fists close
// round two handles of the wheel (people.cjs hand3, the fingers round the turned grips), the elbows out. Behind him
// the brief's find — dangerous water passed calmly: two black sea stacks close on both sides with surf at their feet,
// a third rock further off, the moon's path on the sea between them; he keeps his eye on the near rock.
// Fixed against the first round: the arms were flat tubes from the bottom corners with mitten hands — now jointed hands
// gripping the handles, sleeves bent at the elbow; the hat on a spoke and the flask on the binnacle become his cap and
// the flask on his belt. Light: the moon high on the right behind him (key: cold side light and rim on his left, on
// the rocks' edges, the path on the water); the binnacle lamp, lower left in front (warm fill on his face and hands).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const H = require('./lib/people.cjs');
const { rimArc } = require('./lib/hat.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 86, MOON = { x: 150, y: 22 };
const FIG = { k: 1.32, o: [100, 30] };              // the man and the wheel are drawn at 1, then scaled about o
const WC = [100, 110], RIM = 33, RG = 43;            // the wheel: centre, rim radius, where the fists hold the handles
const TH = [-144, -36];                              // the two handles he holds (10 spokes: one every 36°)
const BIN = { x: 22, y: 124 };                       // the binnacle's lamp (in front of the wheel, lower left)
const HEAD = { c: [100, 37], r: 12.6 };
const light = { time: 'night', haze: .3, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 18, color: '#dfe8ff', power: .85 },
  fill: { color: '#34405e', power: .35 }, rim: { az: 330, color: '#cfe0ff', power: .6 }, locals: [{ x: BIN.x, y: BIN.y, color: '#ffbe6a', power: .7, radius: 70 }] };
const skel = { horizon: HZ, eye: 1.7, light: 'moon high right behind him (key, cold side light and rim) + the binnacle lamp lower left (warm fill)', items: [
  ['sea stack L', -10, 100, 58, 70, 'sea'], ['sea stack R', 156, 100, 54, 80, 'sea'], ['rock far', 118, 88, 26, 8, 'sea'],
  ['taffrail', -10, 121, 220, 20, 'deck'], ['Gibbs', 50, 200, 100, 176, 'stands on the deck behind the wheel (drawn at 1, scaled ×1.32 about 100,30)'],
  ['wheel', 35, 201, 130, 130, 'on its post'], ['hands', 40, 118, 120, 34, 'on the handles'],
  ['binnacle', 8, 170, 28, 52, 'deck'], ['flask', 134, 182, 14, 18, 'on his belt']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const dirOf = t => [Math.cos(t * Math.PI / 180), Math.sin(t * Math.PI / 180)];
const SKIN = { lit: '#eab68c', half: '#b87a54', core: '#9a6040', shadow: '#5a3222', outline: '#24100a' };

module.exports = { name: 'Гиббс за штурвалом', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), R = rng(23);
    // ——— the night: sky, moon, the sea with the moon's path ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 60, seed: 17 }) + K.sunMoon(u, L, { r: 6.4 })
      + K.cloud(u, L, { x: 150, y: 30, w: 46, h: 6, seed: 5, far: .5 }) + K.cloud(u, L, { x: 18, y: 50, w: 30, h: 4, seed: 8, far: .6 })
      + K.water(u, L, { horizon: HZ, bottom: 122, swell: .55, seed: 9, glitter: MOON.x });
    // ——— the rocks: a far one on the horizon, two sea stacks close on both sides with surf ———
    bg += K.rock(u, L, { x: 130, y: 88.6, w: 26, h: 7, wet: true, seed: 3 }) + K.foam(u, { x: 130, y: 88.6, w: 28, h: .8, seed: 2, L });
    { // a stack: a tall column of rock, faceted, the edges towards the moon silvered, wet and dark at its foot
      const stack = (pts, seed) => { const id = nid('st', u), xs = pts.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
        let s = `<defs>${linGrad(id, x0, 0, x1, 0, [[0, '#080b12', 1], [.55, '#141a26', 1], [1, '#2a3346', 1]])}</defs><path d="M${pts.map(P2).join('L')}Z" fill="url(#${id})"/>`;
        const Rs = rng(seed);
        // facets: cracks down the face, each with a lit lip on the moon side
        for (let k = 0; k < 9; k++) { const i = 1 + Math.floor(Rs() * (pts.length - 3)), p = pts[i], dx = (Rs() - .5) * 8, len = 10 + Rs() * 26;
          s += `<path d="M${f(p[0] + (x0 < 100 ? 4 : -4))} ${f(p[1] + 3)}q${f(dx)} ${f(len * .5)} ${f(dx * .4)} ${f(len)}" stroke="#05070c" stroke-width=".7" fill="none" opacity=".8"/>`
            + `<path d="M${f(p[0] + (x0 < 100 ? 4.6 : -3.4))} ${f(p[1] + 3)}q${f(dx)} ${f(len * .5)} ${f(dx * .4)} ${f(len)}" stroke="#7a8ca8" stroke-width=".35" fill="none" opacity=".45"/>`; }
        // ledges: short dark bands across
        for (let k = 0; k < 6; k++) { const y = Math.min(...pts.map(p => p[1])) + 8 + Rs() * 50, x = lerp(x0, x1, .2 + Rs() * .6);
          s += `<path d="M${f(x - 6)} ${f(y)}q6 ${f(1 + Rs())} 12 0" stroke="#04060a" stroke-width="1" fill="none" opacity=".6"/><path d="M${f(x - 6)} ${f(y - .6)}q6 ${f(.6 + Rs())} 12 0" stroke="#8a9cb8" stroke-width=".3" fill="none" opacity=".4"/>`; }
        return s; };
      // the silver rim along the edges that face the moon (up and to the right)
      const rimLine = (pts, a, b) => `<path d="M${pts.slice(a, b + 1).map(P2).join('L')}" stroke="#d8e4ff" stroke-width=".6" fill="none" opacity=".7" stroke-linejoin="round"/>`
        + `<path d="M${pts.slice(a, b + 1).map(P2).join('L')}" stroke="#a8c0ec" stroke-width="2.2" fill="none" opacity=".14" stroke-linejoin="round"/>`;
      const SL = [[-12, 104], [-12, 40], [-4, 36], [2, 26], [9, 22], [15, 25], [19, 33], [25, 38], [28, 50], [33, 62], [36, 76], [42, 88], [48, 104]];
      const SR = [[158, 104], [162, 92], [165, 80], [170, 68], [174, 58], [180, 50], [186, 42], [193, 38], [200, 40], [212, 36], [212, 104]];
      bg += stack(SL, 4) + rimLine(SL, 3, 10) + stack(SR, 7) + rimLine(SR, 6, 9);
      // the near stacks stand in the water: a dark wet band, surf breaking at their feet, spray
      bg += `<path d="M-12 98Q20 95 46 99L48 104H-12z" fill="#05080e" opacity=".6"/><path d="M154 99Q180 95 212 97V104H154z" fill="#05080e" opacity=".6"/>`
        + K.foam(u, { x: 20, y: 99, w: 62, h: 2.2, seed: 6, L }) + K.foam(u, { x: 184, y: 99, w: 60, h: 2.4, seed: 11, L })
        + K.splash(u, { x: 46, y: 99, w: 10, h: 9, seed: 2, L, wind: 1 }) + K.splash(u, { x: 162, y: 99, w: 9, h: 8, seed: 5, L, wind: -1 }); }
    // ——— the stern: the taffrail across behind him, balusters, the cap rail catching the moon ———
    { const y0 = 104, y1 = 118;
      bg += `<rect x="-10" y="${y0}" width="220" height="${y1 - y0 + 4}" fill="#1a110a"/>`;
      for (let x = -6; x < 210; x += 9) bg += K.shadeCyl(u, x, y0 + 3, x, y1, 1.7, L, 'oak', { r1: 1.4, r2: 1.9, outline: .3, seed: Math.round(x + 20) });
      bg += `<rect x="-10" y="${y0 - 2.6}" width="220" height="4" fill="url(#oak${u})" stroke="#0a0604" stroke-width=".4"/><path d="M-10 ${y0 - 2.4}H210" stroke="#c8d8f4" stroke-width=".6" opacity=".7"/>`
        + `<rect x="-10" y="${y1}" width="220" height="3" fill="#120a06"/>`;
      // the deck coming at us from the rail (under the glass)
      const dc = nid('dk', u);
      bg += `<defs><clipPath id="${dc}"><rect x="-10" y="${y1 + 3}" width="220" height="${290 - y1}"/></clipPath></defs><g clip-path="url(#${dc})">${K.deck(u, L, { horizon: HZ, top: y1 + 3, bottom: 290, vx: 100, kind: 'oak', plank: 13, seed: 4 })}</g>`; }

    // ——— Gibbs: the body behind the wheel ———
    let man = '';
    const coat = { lit: '#6e5a48', half: '#3e2f24', shadow: '#1a120c', outline: '#0a0604' };
    { const id = nid('ct', u), wid = nid('wc', u);
      // the coat: broad shoulders, the collar turned down, open over a waistcoat
      man += `<defs>${linGrad(id, 60, 0, 140, 0, [[0, '#3a2618', 1], [.3, '#2a1e16', 1], [.82, '#3c2e24', 1], [1, '#5a4c44', 1]])}${linGrad(wid, 0, 60, 0, 160, [[0, '#6a2a1c', 1], [1, '#3a140c', 1]])}</defs>`
        + `<path d="M62 160L64 82Q66 68 78 64L92 58Q100 62 108 58L122 64Q134 68 136 82L138 160Z" fill="url(#${id})" stroke="#0a0604" stroke-width=".5"/>`
        // the waistcoat in the opening, its buttons, the shirt at the neck
        + `<path d="M90 62Q100 70 110 62L114 160H86Z" fill="url(#${wid})" stroke="#1a0806" stroke-width=".4"/>`
        + [74, 84, 94, 104].map(y => K.shadeSphere(u, 100.6, y, .95, L, 'brass', { outline: .2 })).join('')
        + `<path d="M93 60Q100 67 107 60L104 74Q100 76 96 74Z" fill="#cfc2a6" stroke="#4a3e2e" stroke-width=".35"/><path d="M96 63q4 6 8 0" stroke="#8a7c62" stroke-width=".35" fill="none"/>`
        // the lapels: the coat's front edges turned back, lit edge on the moon side
        + `<path d="M90 60L84 92L88 100L94 70Z" fill="#2e2219" stroke="#0a0604" stroke-width=".35"/><path d="M110 60L116 92L112 100L106 70Z" fill="#241a12" stroke="#0a0604" stroke-width=".35"/>`
        + `<path d="M110 60L116 92" stroke="#a8b8d4" stroke-width=".4" opacity=".55"/>`
        // the seams over the shoulders and a few creases where the arms pull
        + `<path d="M78 64Q80 72 76 80M122 64Q120 72 124 80" stroke="#0e0a06" stroke-width=".5" fill="none"/><path d="M72 92q6 4 10 12M128 92q-6 4 -10 12" stroke="#0e0a06" stroke-width=".45" fill="none" opacity=".7"/>`
        // the moon's rim down his left side
        + `<path d="M136 150L134 82Q132 70 121 65" stroke="#c8d8f4" stroke-width=".8" fill="none" opacity=".7"/>`;
      // the neck and the neckerchief knotted at the throat
      man += `<path d="M93 44L107 44L108 60Q100 64 92 60Z" fill="${SKIN.half}" stroke="${SKIN.outline}" stroke-width=".35"/><path d="M93 52q7 4 14 0" stroke="${SKIN.shadow}" stroke-width=".6" fill="none" opacity=".6"/>`
        + `<path d="M91 56Q100 62 109 56L110 60Q100 66 90 60Z" fill="#7a2418" stroke="#2a0806" stroke-width=".35"/><path d="M98 60l-3 9l3 -1l2 3l1 -9z" fill="#8a2a1c" stroke="#2a0806" stroke-width=".3"/><path d="M92 57.4Q100 62.6 108 57.4" stroke="#d8a088" stroke-width=".35" fill="none" opacity=".5"/>`; }

    // ——— his hands on the handles: solve each hand's direction so the handle across its fist runs along the spoke ———
    const grips = TH.map(t => [WC[0] + Math.cos(t * Math.PI / 180) * RG, WC[1] + Math.sin(t * Math.PI / 180) * RG]);
    const hands = TH.map((t, i) => {
      const m = i ? -1 : 1, base = { s: 2.05, m, roll: 14, pitch: 18, pose: 'wrap', r: .95, tone: SKIN, light: [.8, -.55], sw: .3, tilt: 6 };
      let a = i ? -126 : -54, h;
      for (let k = 0; k < 4; k++) { h = H.hand3(u, { ...base, a, grip: grips[i] }); const ang = Math.atan2(h.axis[1], h.axis[0]) * 180 / Math.PI;
        let d = t - ang; while (d > 90) d -= 180; while (d < -90) d += 180; a += d; }
      return h; });
    // the arms: shoulder -> elbow (out and down) -> the wrist; coat sleeves with a turned-back cuff
    { const sh = [[76, 68], [124, 68]], el = [[54, 116], [146, 116]];
      hands.forEach((h, i) => { const w = h.wrist, e = el[i], s0 = sh[i], sd = i ? 1 : -1;
        man += H.cloth(u, { spine: [[s0[0] - sd * 2, s0[1]], [lerp(s0[0], e[0], .55) + sd * 2, lerp(s0[1], e[1], .55)], e, [lerp(e[0], w[0], .55), lerp(e[1], w[1], .55)], [w[0] - sd * .6, w[1] + 1.4]],
          w: [15.4, 13.8, 12.6, 10.8, 9.2], tone: coat, lit: i ? 1 : -1, rim: '#c8d8f4', rimSide: i ? 1 : -1, rimOp: i ? .55 : .25, seed: 3 + i, drapes: 2, sw: .4,
          cuff: { from: .8, k: 1.18, tone: { lit: '#5a4636', half: '#33261c', shadow: '#140e08', outline: '#0a0604' } } }); }); }

    // ——— the head: a weathered face turned a little to his right, watching the near rock ———
    const hd = H.head34(u, { c: HEAD.c, r: HEAD.r, turn: .34, dir: -1, nod: -2, tone: SKIN, light: [.85, -.45], warm: { color: '#ffb46a', op: .3 },
      look: [-.55, -.05], brow: 'frown', smile: .12, hair: { style: 'short', color: '#9e9a92' }, hairColor: '#8e8a84', moustache: true, stubble: true, iris: '#3a4a5a' });
    let face = hd.svg + rimArc(hd, { r: HEAD.r, light: [-.9, .35], color: '#cfe0ff', span: 50, opacity: .55 });
    { const Q = hd.Q, dp = hd.depth;
      // grey mutton chops down both cheeks into the moustache (the far one only where it shows)
      for (const sd of [1, -1]) { if (dp(sd * .55, .3, .4) < -.15) continue;
        const pts = [[sd * .76, -.22, .14], [sd * .8, .08, .08], [sd * .76, .4, .08], [sd * .62, .64, .3], [sd * .42, .7, .6], [sd * .32, .64, .74], [sd * .44, .54, .66], [sd * .6, .34, .5], [sd * .68, .04, .38], [sd * .7, -.22, .3]].map(p => Q(...p));
        face += H.hairMass(u, pts, { r: HEAD.r, color: '#8e8a84', seed: 31 + sd, n: 18, light: [.85, -.45], flow: () => [0, 1], tufts: [2, 3, 4], tuftLen: .08 }); }
      // the knitted watch cap: a soft dome over the crown, a turned-up ribbed band; the moon on its left
      const capPts = []; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; for (const y of [-.52, -.8, -1.05]) { const rr = y === -1.05 ? .55 : y === -.8 ? .92 : 1.0; capPts.push(Q(Math.cos(t) * rr, y, Math.sin(t) * rr * .98 - .08)); } }
      capPts.push(Q(0, -1.3, -.12));
      const hull = (P) => { const S = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
        for (const p of S) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of S.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const cap = hull(capPts), cg = nid('cp', u), c0 = Q(0, -.9, 0);
      face += `<defs>${linGrad(cg, c0[0] - 12, c0[1] - 6, c0[0] + 12, c0[1] + 6, [[0, '#121824', 1], [.65, '#2a3446', 1], [1, '#4a5a72', 1]])}</defs><path d="M${cap.map(P2).join('L')}Z" fill="url(#${cg})" stroke="#06080e" stroke-width=".45"/>`;
      // the band: between two rings, front half only; ribs across it
      const ring = (y, rr) => { const a = []; for (let k = 0; k <= 24; k++) { const t = -Math.PI * .5 + k / 24 * Math.PI; a.push([Math.sin(t) * rr, y, Math.cos(t) * rr * .98 - .08]); } return a.filter(p => dp(...p) > -.05).map(p => Q(...p)); };
      const r1 = ring(-.5, 1.03), r2 = ring(-.82, .99);
      if (r1.length > 2 && r2.length > 2) {
        face += `<path d="M${r1.map(P2).join('L')}L${r2.slice().reverse().map(P2).join('L')}Z" fill="#3a465c" stroke="#06080e" stroke-width=".4"/>`;
        for (let k = 1; k < Math.min(r1.length, r2.length) - 1; k++) face += `<path d="M${P2(r1[k])}L${P2(r2[k])}" stroke="#141a26" stroke-width=".35" opacity=".8"/>`;
        face += `<path d="M${r2.map(P2).join('L')}" stroke="#8a9cb8" stroke-width=".4" fill="none" opacity=".6"/>`; }
      // a few stitches of knit on the dome, and the cold sheen on its left
      for (let k = 0; k < 10; k++) { const t = -1.2 + k * .26, p = Q(Math.sin(t) * .8, -1.0, Math.cos(t) * .7), q = Q(Math.sin(t) * .55, -1.18, Math.cos(t) * .45); face += `<path d="M${P2(p)}L${P2(q)}" stroke="#121824" stroke-width=".3" opacity=".6"/>`; }
      face += `<path d="M${P2(Q(.98, -.6, .1))}Q${P2(Q(.9, -1.1, .1))} ${P2(Q(.3, -1.3, .1))}" stroke="#c8d8f4" stroke-width=".6" fill="none" opacity=".6"/>`;
      // a small gold ring in the near ear
      { const e = Q(.84, .34, -.1); face += `<circle cx="${f(e[0])}" cy="${f(e[1] + .8)}" r=".9" fill="none" stroke="url(#brass${u})" stroke-width=".45"/>`; } }

    // ——— the flask on his belt (right hip, below the rim) ———
    let flask = `<path d="M118 124q4 4 9 7" stroke="#3a2a1a" stroke-width=".7" fill="none"/>`
      + `<g transform="translate(130 136) rotate(-10)"><path d="M-5 -6Q-6 2 -4 7Q0 9 4 7Q6 2 5 -6Q0 -8 -5 -6Z" fill="url(#silver${u})" stroke="#2a3238" stroke-width=".4"/><rect x="-1.6" y="-9" width="3.2" height="3" fill="#5a6268" stroke="#2a3238" stroke-width=".3"/><path d="M-3 -2q-1 4 0 7" stroke="#ffffff" stroke-width=".5" opacity=".6" fill="none"/><path d="M1 -1l2 2" stroke="#2a3238" stroke-width=".4"/></g>`;

    // ——— the wheel: ten spokes running out into turned handles, the oak rim with a brass band, the brass hub ———
    let wheel = '';
    const handle = (t) => { const d = dirOf(t), a = [WC[0] + d[0] * (RIM + 2), WC[1] + d[1] * (RIM + 2)], b = [WC[0] + d[0] * 50, WC[1] + d[1] * 50];
      return K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.9, L, 'oak', { r1: 1.5, r2: 1.6, bulge: .3, cap: 'round', outline: .35, seed: Math.round(t + 400) }); };
    for (let k = 0; k < 10; k++) { const t = TH[0] + k * 36, d = dirOf(t), a = [WC[0] + d[0] * 6, WC[1] + d[1] * 6], b = [WC[0] + d[0] * (RIM + 1), WC[1] + d[1] * (RIM + 1)];
      wheel += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.7, L, 'oak', { r1: 2.1, r2: 1.4, outline: .35, seed: k + 3 });
      if (k !== 0 && k !== 3) wheel += handle(t); }
    { const g = K.mat('oak', L, { form: 'cyl', x1: WC[0] - RIM, y1: WC[1], x2: WC[0] + RIM, y2: WC[1], r: RIM, u });
      wheel += `<defs>${g.defs}</defs><circle cx="${WC[0]}" cy="${WC[1]}" r="${RIM}" fill="none" stroke="#0e0804" stroke-width="7.4"/><circle cx="${WC[0]}" cy="${WC[1]}" r="${RIM}" fill="none" stroke="${g.fill}" stroke-width="6"/>`
        + `<circle cx="${WC[0]}" cy="${WC[1]}" r="${RIM - .2}" fill="none" stroke="url(#brass${u})" stroke-width="1.1"/><circle cx="${WC[0]}" cy="${WC[1]}" r="${RIM - .2}" fill="none" stroke="#3a2808" stroke-width=".25" stroke-dasharray="1 4"/>`
        + `<path d="M${f(WC[0] - RIM * .96)} ${f(WC[1] - RIM * .3)}A${RIM + 2.4} ${RIM + 2.4} 0 0 1 ${f(WC[0] - RIM * .2)} ${f(WC[1] - RIM - 2.2)}" stroke="#d8e4f8" stroke-width=".8" fill="none" opacity=".75" transform="translate(${2 * WC[0]} 0) scale(-1 1)"/>`
        + `<path d="M${f(WC[0] + RIM * .5)} ${f(WC[1] + RIM * .7)}A${RIM + 2.6} ${RIM + 2.6} 0 0 0 ${f(WC[0] + RIM * .98)} ${f(WC[1] + RIM * .1)}" transform="translate(${2 * WC[0]} 0) scale(-1 1)" stroke="#ffc888" stroke-width=".7" fill="none" opacity=".55"/>`; }
    wheel += K.shadeSphere(u, WC[0], WC[1], 7.4, L, 'brass', { outline: .45 }) + `<circle cx="${WC[0]}" cy="${WC[1]}" r="3.2" fill="#2a1c08" stroke="#120a02" stroke-width=".3"/>`
      + K.shadeSphere(u, WC[0], WC[1], 2.2, L, 'brass', { outline: .3 });
    // the two handles in his fists: the back of each fist, the handle, the fingers round it
    hands.forEach((h, i) => { wheel += h.back + handle(TH[i]) + h.front; });
    // the knuckles catch the binnacle's warmth on the right hand, the moon on the left one
    { const k0 = hands[0].P(4.6, -.4, .2), k1 = hands[1].P(4.6, -.4, .2);
      wheel += glow(u, k0[0], k0[1], 10, 8, '#ffbe6a', .2) + glow(u, k1[0], k1[1], 9, 7, '#c8d8ff', .14); }

    // ——— the binnacle in front of the wheel, lower right: post, brass hood, the lit card ———
    let binn = '';
    { const x = BIN.x, y = BIN.y;
      binn += K.shadeBox(u, [{ pts: [[x - 10, y + 6], [x + 10, y + 6], [x + 12, y + 44], [x - 12, y + 44]], n: 'front', grain: [0, 1] }], L, 'oak', { seed: 9, outline: .5 })
        + `<ellipse cx="${x}" cy="${y + 4}" rx="12" ry="4" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".5"/>`
        + `<path d="M${x - 11} ${y + 3}Q${x - 11} ${y - 10} ${x} ${y - 11}Q${x + 11} ${y - 10} ${x + 11} ${y + 3}" fill="url(#brass${u})" stroke="#4a3008" stroke-width=".5"/>`
        + `<path d="M${x - 7} ${y + 1}Q${x - 7} ${y - 6} ${x} ${y - 7}Q${x + 7} ${y - 6} ${x + 7} ${y + 1}Z" fill="#fff0c8"/>`
        + `<g transform="translate(${x} ${y - 2}) scale(1 .62)">${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return `<path d="M0 0L${f(Math.cos(a) * 5.6)} ${f(Math.sin(a) * 5.6)}" stroke="${k % 2 ? '#6a4a24' : '#a8302a'}" stroke-width="${k % 2 ? .45 : .8}"/>`; }).join('')}</g>`
        + `<path d="M${x - 9} ${y - 6}Q${x - 6} ${y - 10} ${x - 1} ${y - 10.4}" stroke="#fff8d8" stroke-width=".6" fill="none" opacity=".8"/>`; }

    // ——— light: the binnacle's pool and its warmth on him; the moon's cold on the left; spray in the air; the dark below ———
    let fg = K.localGlow(u, { x: BIN.x, y: BIN.y - 3, color: '#ffc070', power: .8, radius: 18 })
      + glow(u, 64, 96, 70, 60, '#ffb060', .12) + glow(u, 176, 40, 60, 70, '#a8c0ff', .08)
      + motes(16, 0, 70, 50, 30, '#e8f0ff', 9) + motes(12, 150, 74, 50, 26, '#e8f0ff', 12)
      + gloom(u, 100, 120, 100, 280, .5, '#04060a');
    return [bg, `<g transform="translate(${FIG.o[0]} ${FIG.o[1]}) scale(${FIG.k}) translate(${-FIG.o[0]} ${-FIG.o[1]})">${man + face + flask + wheel}</g>` + binn + fg];
  } };
