// «Ничего личного» (Индевор, ПРИКАЗ: нанесите 3 урона по Корпусу любому вражескому кораблю. Это не Залп), refined from
// the first-round scene (portrait-endeavour.cjs SCENES['Ничего личного']): the lord's stern cabin. Through the tall
// stern windows, far off on a bright sea, the black-sailed pirate ship burns — a blast tears her side at the waterline,
// fire on her deck, a black column of smoke leaning away; nobody of ours fires (it is not a volley: somebody else's
// work). In here it is quiet: on the polished table a porcelain cup of tea on its saucer, a silver spoon, the steam
// rising; the silver teapot behind it and an open ledger at the side. Brief's find: the contrast — the cup and the blast.
// Fixed against the first round: the window was a flat frame on a flat wall with the cup and the book on a strip of
// sill — now the cabin in 2.5D: the table top runs to one vanishing point (eye level = the sea's horizon), the side
// panelling and the window's posts recede, the stern lights are many small leaded panes; the cup is big and in the
// window's light; the Company ship that fired in the first round is gone (the card is "not a volley").
// Light: the day through the stern windows (key, from behind: contre-jour — rims on the porcelain and the silver, the
// windows mirrored in the polished table), the fire's orange in the window; the cabin dark round the edges.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { gloom } = PK;

const VX = 100, VY = 60, FOC = 150;                // the vanishing point (= the sea's horizon), the focal length
const pr = (X, Y, Z) => [VX + FOC * X / Z, VY + FOC * Y / Z];
const XW = .86, ZW = 1.5, YT = .25;                 // the cabin's half width, the window wall's depth, the table top (m below the eye)
const WT = pr(0, YT, ZW)[1];                        // the table's far edge against the windows (y 85)
const CUP = { x: 84, y: 118, s: 1 };                // the saucer's centre on the table
const POT = { x: 146, y: 102 };                     // the teapot's foot
const SHIP = { x: 118, y: 73, scale: .56 };          // the burning ship outside
const light = { time: 'day', haze: .3, key: { type: 'sun', az: 15, el: 28, color: '#fff2dc', power: 1 }, fill: { color: '#5a4a44', power: .42 },
  rim: { az: 10, color: '#fff4e0', power: .8 } };
const lightOut = { time: 'day', haze: .35, key: { type: 'sun', x: 30, y: 6, color: '#fff4d8', power: 1 }, fill: { color: '#8ab4d4', power: .5 } };
const skel = { horizon: VY, eye: .25, light: 'daylight through the stern windows from behind (key, contre-jour) + the burning ship outside (warm, weak)', items: [
  ['stern windows', 15, 85, 170, 80, 'the back wall at 1.5 m'], ['burning ship', 72, 72, 82, 52, 'the sea outside'], ['table top', -10, 160, 220, 75, 'its far edge at the window (y 85)'],
  ['teacup + saucer', 66, 124, 40, 30, 'table, 0.65 m'], ['steam', 74, 98, 22, 40, 'over the cup'], ['teapot', 128, 102, 36, 34, 'table, 0.9 m'], ['ledger', 132, 134, 60, 22, 'table, front right'],
  ['curtain', 176, 104, 30, 104, 'hangs at the right of the windows'], ['sealed note', 19, 121, 34, 12, 'table, left']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
// the window's lights: [x0, x1] of each opening between the posts (picture x at the window wall)
const LIGHTS = [[17, 52], [58, 142], [148, 183]];
const WTOP = 8;                                      // the window head

module.exports = { name: 'Ничего личного', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: VY, eye: .25 }), Lo = K.makeLight(lightOut, { horizon: VY, eye: 3 }), R = rng(31);
    return [outside(u, Lo) + cabin(u, L, R), table(u, L, R) + air(u)];
  } };

/** The sea outside the stern windows: sky, clouds, the sea, the pirate ship burning and blown open at her side. */
function outside(u, Lo) {
  let s = K.sky(u, Lo, { horizon: VY }) + K.sunMoon(u, Lo, { r: 6 });
  for (const [x, y, w, h, sd, fr] of [[48, 30, 44, 6, 3, .3], [168, 22, 40, 6, 8, .4], [90, 48, 40, 4, 5, .65]]) s += K.cloud(u, Lo, { x, y, w, h, seed: sd, far: fr });
  s += K.water(u, Lo, { horizon: VY, bottom: 90, swell: .4, seed: 7, glitter: 30 });
  // the ship: listing towards us a little, her sails full, the hull opened by the blast; the smoke behind her
  // the smoke of burning tar and canvas is dark: the same light with a sooty smoke colour
  const Ls = Object.assign({}, Lo, { pal: Object.assign({}, Lo.pal, { smoke: '#3a3430' }) });
  s += K.smoke(u, Ls, { x: SHIP.x + 10, y: 46, w: 70, h: 60, wind: .7, seed: 3, opacity: .9, glow: { color: '#ff8a3a', power: .5 } });
  s += K.ship(u, Lo, { kind: 'pearl', ...SHIP, roll: -6, heel: 2, sails: 'full', detail: 'mid', seed: 9 });
  // fire on her deck and in her rigging, the black smoke rising off it
  for (const [x, y, w, h, sd] of [[SHIP.x - 6, 63, 14, 14, 2], [SHIP.x + 14, 62, 10, 11, 4], [SHIP.x + 26, 61, 8, 8, 6]]) s += K.fire(u, { x, y, w, h, seed: sd, wind: .4, pool: false });
  s += K.smoke(u, Ls, { x: SHIP.x + 4, y: 58, w: 40, h: 50, wind: .8, seed: 6, opacity: .85, glow: { color: '#ff9040', power: .8 } });
  // the blast at the waterline: a ball of fire, the burst of spray and splinters, the hole's glow
  { const bx = SHIP.x - 14, by = 70, g = nid('bl', u), id = nid('bf', u);
    s += K.splash(u, { x: bx, y: by + 1.4, w: 22, h: 20, seed: 4, L: Lo, wind: .3 });
    s += `<defs>${radGrad(g, bx, by - 4, 16, [[0, '#ffffff', 1], [.2, '#fff2b0', 1], [.45, '#ffb030', .95], [.75, '#ff6010', .6], [1, '#c02008', 0]])}<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".5"/></filter></defs>`
      + `<path d="M${bx - 15} ${by - 2}Q${bx - 12} ${by - 14} ${bx - 4} ${by - 17}Q${bx + 2} ${by - 24} ${bx + 8} ${by - 15}Q${bx + 16} ${by - 12} ${bx + 14} ${by - 2}Q${bx} ${by + 3} ${bx - 15} ${by - 2}Z" fill="url(#${g})" filter="url(#${id})"/>`
      + K.localGlow(u, { x: bx, y: by - 6, color: '#ffc060', power: 1, radius: 30 });
    const Rs = rng(12); for (let k = 0; k < 16; k++) { const a = -Math.PI * (.1 + Rs() * .8), d = 10 + Rs() * 14, l = 1 + Rs() * 2.4, x = bx + Math.cos(a) * d, y = by - 6 + Math.sin(a) * d;
      s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="#2a1a0e" stroke-width="${f(.4 + Rs() * .5)}" stroke-linecap="round"/>`; } }
  return s;
}

/** The cabin: the stern windows (posts, small leaded panes, the window head), the panelled sides receding, the
 *  curtain on the right. Everything but the openings is the room's dark wood, lit from the windows. */
function cabin(u, L, R) {
  let s = '';
  // the wall round the openings: the posts and the head, dark against the day, a lit edge on each post
  { let d = `M-10 -10H210V${WT + 2}H-10Z`; for (const [a, b] of LIGHTS) d += `M${a} ${WTOP}V${WT + 2}H${b}V${WTOP}Z`;
    const g = nid('ww', u); s += `<defs>${linGrad(g, 0, 0, 0, WT, [[0, '#24160c'], [1, '#3a2614']])}</defs><path d="${d}" fill="url(#${g})" fill-rule="evenodd"/>`;
    // the head beam over the windows with a carved moulding, a lantern hook
    s += `<rect x="-10" y="0" width="220" height="${WTOP - 1.5}" fill="#1a0e06"/><path d="M-10 ${WTOP - 1.5}H210" stroke="#6a4424" stroke-width="1"/><path d="M-10 ${WTOP - 3.6}H210" stroke="#3a2412" stroke-width=".6"/>`;
    for (let x = 4; x < 200; x += 9) s += `<path d="M${x} ${WTOP - 3.2}q2 -1.6 4 0" stroke="#5a3a1e" stroke-width=".5" fill="none"/>`;
    // the posts: turned columns, a lit edge towards the opening on each side
    for (const [a, b] of [[LIGHTS[0][1], LIGHTS[1][0]], [LIGHTS[1][1], LIGHTS[2][0]]]) { const m = (a + b) / 2;
      s += `<path d="M${a} ${WTOP}V${WT}M${b} ${WTOP}V${WT}" stroke="#d8b890" stroke-width=".6" opacity=".8"/>`
        + [WTOP + 4, WT - 6].map(y => `<ellipse cx="${m}" cy="${y}" rx="${f((b - a) / 2 + .8)}" ry="1.4" fill="#2a180a" stroke="#7a5430" stroke-width=".4"/>`).join(''); }
    for (const [a, b] of LIGHTS) s += `<path d="M${a} ${WTOP}H${b}" stroke="#8a6438" stroke-width=".6"/>`;
  }
  // the leaded panes: a lattice over every opening, a faint tint and the glass's sheen
  for (const [a, b] of LIGHTS) { const cid = nid('lc', u), g = nid('gl', u);
    s += `<defs><clipPath id="${cid}"><rect x="${a}" y="${WTOP}" width="${b - a}" height="${WT - WTOP}"/></clipPath>${linGrad(g, a, WTOP, b, WT, [[0, '#ffffff', .1], [.45, '#e8f0f4', 0], [.55, '#ffffff', .12], [1, '#c8d8e0', .06]])}</defs><g clip-path="url(#${cid})"><rect x="${a}" y="${WTOP}" width="${b - a}" height="${WT - WTOP}" fill="url(#${g})"/>`;
    const n = Math.max(2, Math.round((b - a) / 14)), pw = (b - a) / n, ph = 15.4;
    for (let k = 1; k < n; k++) s += `<path d="M${f(a + k * pw)} ${WTOP}V${WT}" stroke="#2a2420" stroke-width=".5" opacity=".7"/>`;
    for (let y = WTOP + ph; y < WT; y += ph) s += `<path d="M${a} ${f(y)}H${b}" stroke="#2a2420" stroke-width=".5" opacity=".7"/>`;
    // a few panes catching a white glint
    for (let k = 0; k < 3; k++) { const x = a + R() * (b - a - 6), y = WTOP + R() * (WT - WTOP - 10); s += `<path d="M${f(x)} ${f(y + 5)}l3 -4" stroke="#ffffff" stroke-width=".5" opacity=".5"/>`; }
    s += `</g>`; }
  // the panelled sides: the panelling and the rail running to the VP, from the window wall out to the frame
  for (const sd of [-1, 1]) { const X = sd * XW, a = pr(X, -1.2, ZW), b = pr(X, YT, ZW), c = pr(X, YT, .4), d = pr(X, -1.2, .4), g = nid('sd', u);
    s += `<defs>${linGrad(g, a[0], 0, a[0] + sd * 40, 0, [[0, '#3a2414'], [1, '#140a04']])}</defs><path d="${poly([a, b, c, d])}" fill="url(#${g})"/>`;
    for (const y of [-.6, -.1]) s += `<path d="M${P2(pr(X, y, ZW))}L${P2(pr(X, y, .4))}" stroke="#6a4424" stroke-width=".8" opacity=".7"/>`;
    for (const z of [1.2, .95]) { const p = pr(X, -1.2, z), q = pr(X, YT, z); s += `<path d="M${P2(p)}L${P2(q)}" stroke="#0a0603" stroke-width="1"/>`; }
    s += `<path d="M${P2(a)}L${P2(b)}" stroke="#0a0603" stroke-width="1.4"/>`; }
  // the curtain at the right: heavy claret velvet in deep folds, tied back, its edge lit by the window
  { const x0 = 176, x1 = 204, y1 = 104, g = nid('cu', u), cid = nid('cc', u);
    const d = `M${x0 + 4} 0C${x0 - 2} 30 ${x0 + 6} 52 ${x0 + 14} 64C${x0 + 6} 74 ${x0 + 2} 92 ${x0 - 2} ${y1}H${x1}V0Z`;
    s += `<defs>${linGrad(g, x0, 0, x1, 0, [[0, '#8a2028'], [.3, '#5a1018'], [1, '#2a0408']])}<clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${g})"/><g clip-path="url(#${cid})">`;
    for (let k = 0; k < 6; k++) { const x = x0 + 4 + k * 4.4; s += `<path d="M${f(x)} 0Q${f(x + 6 - k)} 40 ${f(x + 9 - k * .6)} 64Q${f(x + 2)} 86 ${f(x - 3 + k)} ${y1}" stroke="${k % 2 ? '#1a0206' : '#a8343a'}" stroke-width="${k % 2 ? 1.6 : .8}" fill="none" opacity=".6"/>`; }
    s += `</g><path d="M${x0 + 4} 0C${x0 - 2} 30 ${x0 + 6} 52 ${x0 + 14} 64C${x0 + 6} 74 ${x0 + 2} 92 ${x0 - 2} ${y1}" stroke="#ff9a8a" stroke-width=".7" fill="none" opacity=".7"/>`
      + `<path d="M${x0 + 10} 61q8 4 16 2" stroke="#c9a048" stroke-width="2" fill="none"/><path d="M${x0 + 10} 60.4q8 4 16 2" stroke="#fff0b0" stroke-width=".5" fill="none" opacity=".7"/>`; }
  return s;
}

/** The polished table, the windows mirrored in it; the teapot, the ledger, the cup on its saucer and the steam. */
function table(u, L, R) {
  let s = '';
  { const g = nid('tb', u), rf = nid('rf', u), bf = nid('rb', u);
    s += `<defs>${linGrad(g, 0, WT, 0, 200, [[0, '#4a2a16'], [.3, '#2e180a'], [1, '#120804']])}<filter id="${bf}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>`
      + `${linGrad(rf, 0, WT, 0, WT + 34, [[0, '#fff4e0', .55], [1, '#fff4e0', 0]])}</defs><rect x="-10" y="${f(WT)}" width="220" height="${f(300 - WT)}" fill="url(#${g})"/>`;
    // the stern lights mirrored in the polish: soft bright panels running towards us, broken by the posts
    for (const [a, b] of LIGHTS) { const pa = [a, WT], pb = [b, WT], qa = [VX + (a - VX) * 1.5, WT + 34], qb = [VX + (b - VX) * 1.5, WT + 34];
      s += `<path d="${poly([pa, pb, qb, qa])}" fill="url(#${rf})" filter="url(#${bf})" opacity=".55"/>`; }
    // the grain running to the VP, the far edge's moulding against the window
    for (let i = 0; i < 26; i++) { const x = -80 + i * 14 + R() * 4, a = [VX + (x - VX) * (WT - VY) / (220 - VY), WT]; s += `<path d="M${P2(a)}L${f(x)} 220" stroke="#0e0602" stroke-width=".3" opacity=".45"/>`; }
    s += `<path d="M-10 ${f(WT)}H210" stroke="#1a0e06" stroke-width="1.2"/><path d="M-10 ${f(WT + .9)}H210" stroke="#c89060" stroke-width=".4" opacity=".7"/>`;
    // the fire's orange glow mirrored under the ship
    s += K.localGlow(u, { x: SHIP.x - 10, y: WT + 8, color: '#ff9a40', power: .35, radius: 24 }, { squash: .3, core: false }); }
  // ——— the teapot (silver), behind the cup at the right ———
  s += teapot(u, L);
  // ——— the ledger, open at the front right: two pages in the table's perspective, columns of strokes ———
  { const Q = [[124, 122], [176, 120], [186, 140], [116, 143]], m0 = [150, 121], m1 = [151, 141.5], g = nid('lg', u);
    s += `<path d="${poly(Q.map(p => [p[0] + 2, p[1] + 2.4]))}" fill="#000" opacity=".45"/><path d="${poly([[Q[0][0] - 1, Q[0][1] + 1], [Q[1][0] + 1, Q[1][1] + 1], [Q[2][0] + 1.4, Q[2][1] + 1.6], [Q[3][0] - 1.4, Q[3][1] + 1.6]])}" fill="#3a1410"/>`
      + `<defs>${linGrad(g, 0, 120, 0, 143, [[0, '#fff6e2'], [1, '#d8c8a8']])}</defs><path d="M${P2(Q[0])}Q${f((Q[0][0] + m0[0]) / 2)} ${f(Q[0][1] - 2.2)} ${P2(m0)}Q${f((m0[0] + Q[1][0]) / 2)} ${f(Q[1][1] - 2.2)} ${P2(Q[1])}L${P2(Q[2])}Q${f((Q[2][0] + m1[0]) / 2)} ${f(Q[2][1] - 1.4)} ${P2(m1)}Q${f((m1[0] + Q[3][0]) / 2)} ${f(Q[3][1] - 1.4)} ${P2(Q[3])}Z" fill="url(#${g})" stroke="#8a7a5a" stroke-width=".3"/>`
      + `<path d="M${P2(m0)}L${P2(m1)}" stroke="#a89878" stroke-width=".6"/>`;
    for (let k = 0; k < 6; k++) { const t = .15 + k * .13, y0 = lerp(121.4, 142, t);
      s += `<path d="M${f(lerp(126, 118.6, t) + 3)} ${f(y0)}L${f(lerp(148, 149, t) - 2)} ${f(y0 - .3)}" stroke="#4a3a2a" stroke-width=".35" stroke-dasharray="${f(1 + R() * 2)} .6" opacity=".8"/>`
        + `<path d="M${f(lerp(153, 154, t))} ${f(y0 - .4)}L${f(lerp(172, 182, t) - 4)} ${f(y0 - .8)}" stroke="#4a3a2a" stroke-width=".35" stroke-dasharray="${f(1 + R() * 2)} .6" opacity=".8"/>`; }
    s += `<path d="M${f(150.4)} 121.4q.6 8 -1 22" stroke="#a81a14" stroke-width=".7" fill="none"/>`; }
  // ——— a folded note at the left, sealed with the Company's red wax: somebody has been paid for this ———
  { const c = [36, 112], g = nid('nt', u);
    s += `<path d="M${c[0] - 15} ${c[1] + 2.6}L${c[0] + 13} ${c[1] + 1.6}L${c[0] + 17} ${c[1] + 10}L${c[0] - 13} ${c[1] + 11.4}Z" fill="#000" opacity=".45"/>`
      + `<defs>${linGrad(g, 0, c[1] - 4, 0, c[1] + 10, [[0, '#fff6e2'], [1, '#c8b896']])}</defs><path d="M${c[0] - 17} ${c[1] + 1}L${c[0] + 11} ${c[1] - .4}L${c[0] + 15} ${c[1] + 8}L${c[0] - 15} ${c[1] + 9.4}Z" fill="url(#${g})" stroke="#8a7a5a" stroke-width=".3"/>`
      + `<path d="M${c[0] - 16} ${c[1] + 5}L${c[0] + 13} ${c[1] + 3.8}" stroke="#a89878" stroke-width=".4"/><path d="M${c[0] - 16.6} ${c[1] + 1.2}L${c[0] - 1} ${c[1] + 5}L${c[0] + 11} ${c[1] - .2}" stroke="#d8c8a8" stroke-width=".4" fill="none"/>`
      + `<ellipse cx="${c[0] - 1}" cy="${c[1] + 5}" rx="3.6" ry="2" fill="#a81a14" stroke="#4a0806" stroke-width=".35"/><ellipse cx="${c[0] - 1}" cy="${c[1] + 4.8}" rx="2" ry="1" fill="none" stroke="#e86a54" stroke-width=".35"/><path d="M${c[0] - 2.6} ${c[1] + 4.2}q1.6 -1 3 -.6" stroke="#ffc0b0" stroke-width=".4" fill="none"/>`; }
  // ——— the cup on its saucer, the spoon, the steam ———
  s += cup(u, L);
  return s;
}

/** A silver teapot: a pear-shaped body, a domed lid with a finial, a curved spout to the left, an ebony handle; dark
 *  with the windows' bright streaks on it (contre-jour). */
function teapot(u, L) {
  const { x, y } = POT, g = nid('tp', u), g2 = nid('tl', u);
  const body = `M${x - 4} ${y}Q${x - 15} ${y - 2} ${x - 14} ${y - 13}Q${x - 13} ${y - 22} ${x - 6} ${y - 24}H${x + 6}Q${x + 13} ${y - 22} ${x + 14} ${y - 13}Q${x + 15} ${y - 2} ${x + 4} ${y}Z`;
  let s = `<ellipse cx="${x}" cy="${y + .6}" rx="15" ry="2.6" fill="#000" opacity=".5"/>`
    + `<defs>${linGrad(g, x - 15, 0, x + 15, 0, [[0, '#e8eef2'], [.12, '#5a6068'], [.35, '#2a2e34'], [.55, '#8a949c'], [.7, '#2a2e34'], [.92, '#4a5058'], [1, '#f4f8fa']])}${linGrad(g2, x - 8, 0, x + 8, 0, [[0, '#d8e0e6'], [.3, '#3a4048'], [.6, '#9aa4ac'], [1, '#e8eef2']])}</defs>`;
  // the spout from the lower body up to the left, the handle on the right
  s += `<path d="M${x - 12} ${y - 7}Q${x - 20} ${y - 9} ${x - 24} ${y - 22}l-2.4 -1.2l1.2 3Q${x - 22} ${y - 6} ${x - 12} ${y - 2}Z" fill="url(#${g2})" stroke="#1a1c20" stroke-width=".4"/><path d="M${x - 23} ${y - 20}q2 8 9 12" stroke="#ffffff" stroke-width=".5" fill="none" opacity=".7"/>`
    + `<path d="M${x + 13} ${y - 19}q9 -1 8 8q-1 6 -9 7" stroke="#0e0a08" stroke-width="2.6" fill="none"/><path d="M${x + 13.4} ${y - 19.6}q8.4 -1 7.6 7.4" stroke="#6a5a50" stroke-width=".5" fill="none"/>`;
  s += `<path d="${body}" fill="url(#${g})" stroke="#14161a" stroke-width=".45"/>`
    + `<path d="M${x - 14} ${y - 13}Q${x} ${y - 9} ${x + 14} ${y - 13}" stroke="#d8e0e6" stroke-width=".5" fill="none" opacity=".6"/>`
    // the lid and the finial
    + `<path d="M${x - 6} ${y - 24}Q${x - 5} ${y - 30} ${x} ${y - 30.6}Q${x + 5} ${y - 30} ${x + 6} ${y - 24}Z" fill="url(#${g2})" stroke="#14161a" stroke-width=".4"/>`
    + `<ellipse cx="${x}" cy="${y - 24}" rx="6.2" ry="1.2" fill="none" stroke="#c8d0d6" stroke-width=".5"/>`
    + K.shadeSphere(u, x, y - 32, 1.7, L, 'brass', { outline: .25 })
    // the windows mirrored as bright vertical streaks; the fire's orange on the left flank
    + `<path d="M${x - 9} ${y - 20}q-2 8 0 16" stroke="#ffffff" stroke-width="1" fill="none" opacity=".8"/><path d="M${x + 3} ${y - 21}q1 9 0 18" stroke="#ffffff" stroke-width=".6" fill="none" opacity=".5"/>`
    + `<path d="M${x - 12.6} ${y - 14}q.4 6 3 11" stroke="#ffa050" stroke-width=".7" fill="none" opacity=".5"/>`;
  return s;
}

/** The teacup on its saucer, seen a little from above: white porcelain with a cobalt band and a gilt rim, the tea
 *  inside mirroring the window, a silver spoon on the saucer, the steam rising in three wisps. Contre-jour: the
 *  porcelain glows at its rims and is soft grey towards us; a warm reflected light from the table under it. */
function cup(u, L) {
  const { x, y } = CUP, gS = nid('cs', u), gB = nid('cb', u), gT = nid('ct', u), gI = nid('ci', u);
  const srx = 21, sry = 7.4, rr = 12.6, rry = 4.4, top = y - 19.6, foot = y - 2;
  let s = `<defs>${radGrad(gS, x - 3, y - 2, srx, [[0, '#f4f2ec'], [.7, '#c8c6c0'], [1, '#8a8884']])}`
    + `${linGrad(gB, x - rr, 0, x + rr, 0, [[0, '#fbfaf6'], [.14, '#d6d4ce'], [.5, '#b4b2ac'], [.82, '#cfcdc6'], [1, '#fdfcf8']])}`
    + `${radGrad(gT, x + 2, top - .6, rr, [[0, '#c87a30'], [.5, '#8a4a18'], [1, '#3a1a08']])}${linGrad(gI, x - rr, 0, x + rr, 0, [[0, '#a8a6a0'], [.5, '#f8f6f0'], [1, '#c8c6c0']])}</defs>`;
  // the saucer: its shadow on the table, the underside rim, the well and the raised lip
  s += `<ellipse cx="${x + 2}" cy="${y + 2.6}" rx="${srx + 1}" ry="${sry}" fill="#000" opacity=".45"/>`
    + `<ellipse cx="${x}" cy="${y + 1}" rx="${srx}" ry="${sry}" fill="#9a9892"/><ellipse cx="${x}" cy="${y}" rx="${srx}" ry="${sry}" fill="url(#${gS})" stroke="#5a5854" stroke-width=".4"/>`
    + `<ellipse cx="${x}" cy="${y}" rx="${srx - 3}" ry="${f(sry - 1.2)}" fill="none" stroke="#2a4a8a" stroke-width=".9"/><ellipse cx="${x}" cy="${y}" rx="${srx - .4}" ry="${f(sry - .2)}" fill="none" stroke="#c9a048" stroke-width=".5"/>`
    + `<path d="M${x - srx + 1} ${y - 1}A${srx - 1} ${sry - 1} 0 0 1 ${x + srx - 1} ${y - 1}" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".9"/>`;
  // the spoon lying on the saucer in front of the cup, its bowl to the left
  s += `<path d="M${x - 16} ${y + 1.6}Q${x} ${y + 4.6} ${x + 18} ${y + 2.6}" stroke="#3a3e44" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M${x - 16} ${y + 1.2}Q${x} ${y + 4} ${x + 18} ${y + 2}" stroke="#e8eef2" stroke-width=".5" fill="none"/>`
    + `<ellipse cx="${x - 17.6}" cy="${y + 1.2}" rx="3.4" ry="1.7" transform="rotate(-8 ${x - 17.6} ${y + 1.2})" fill="#4a5058" stroke="#1a1c20" stroke-width=".3"/><path d="M${x - 19.6} ${y + .6}q2 -1 4 0" stroke="#ffffff" stroke-width=".5" fill="none"/>`;
  // the foot ring and the bowl, the handle on the right (behind its far half the bowl, in front its near half)
  s += `<ellipse cx="${x}" cy="${foot + .6}" rx="6.4" ry="2" fill="#6a6864"/>`;
  s += `<path d="M${x + rr - 1.4} ${top + 4}C${x + rr + 8} ${top + 1} ${x + rr + 9} ${top + 11} ${x + rr - 3.4} ${foot - 4}" stroke="#7a7872" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + `<path d="M${x + rr - 1.4} ${top + 4}C${x + rr + 8} ${top + 1} ${x + rr + 9} ${top + 11} ${x + rr - 3.4} ${foot - 4}" stroke="#f4f2ec" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M${x + rr + 2} ${top + 3.2}q4 2 3 7" stroke="#ffffff" stroke-width=".5" fill="none"/>`;
  const bowl = `M${x - rr} ${top}C${x - rr} ${top + 9} ${x - 8} ${foot - 1} ${x - 6} ${foot}Q${x} ${foot + 1.6} ${x + 6} ${foot}C${x + 8} ${foot - 1} ${x + rr} ${top + 9} ${x + rr} ${top}Z`;
  s += `<path d="${bowl}" fill="url(#${gB})" stroke="#5a5854" stroke-width=".4"/>`;
  // the cobalt band below the rim with a small leaf pattern, the gilt line under it
  { const cid = nid('cc', u); s += `<defs><clipPath id="${cid}"><path d="${bowl}"/></clipPath></defs><g clip-path="url(#${cid})">`
      + `<path d="M${x - rr - 1} ${top + 2.2}Q${x} ${top + 2.2 + rry * 2} ${x + rr + 1} ${top + 2.2}V${top + 5.4}Q${x} ${top + 5.4 + rry * 1.9} ${x - rr - 1} ${top + 5.4}Z" fill="#2a4a96"/>`
      + Array.from({ length: 7 }, (_, k) => { const t = (k + .5) / 7, px = x - rr + t * rr * 2, py = top + 3.8 + Math.sin(t * Math.PI) * rry * 1.95; return `<path d="M${f(px - 1)} ${f(py)}q1 -1.2 2 0q-1 1.2 -2 0z" fill="#e8eef8" opacity=".85"/>`; }).join('')
      + `<path d="M${x - rr - 1} ${top + 6.4}Q${x} ${top + 6.4 + rry * 1.85} ${x + rr + 1} ${top + 6.4}" stroke="#c9a048" stroke-width=".5" fill="none"/>`
      // a sprig painted on the belly in cobalt
      + `<path d="M${x - 3} ${top + 13}q3 -3 6 -1M${x - 1} ${top + 12.4}q-1 -2 1 -3M${x + 2} ${top + 12}q1 -2 3 -1.6" stroke="#2a4a96" stroke-width=".5" fill="none"/>`
      // the rim light down both flanks (the window behind)
      + `<path d="M${x - rr + .5} ${top + 1}C${x - rr + .6} ${top + 9} ${x - 8} ${foot - 1.4} ${x - 6.2} ${foot - .4}" stroke="#ffffff" stroke-width="1" fill="none" opacity=".9"/>`
      + `<path d="M${x + rr - .5} ${top + 1}C${x + rr - .6} ${top + 9} ${x + 8} ${foot - 1.4} ${x + 6.2} ${foot - .4}" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".8"/></g>`; }
  // the mouth: the inside wall lit, the tea mirroring the window, the gilt rim
  s += `<ellipse cx="${x}" cy="${top}" rx="${rr}" ry="${rry}" fill="url(#${gI})" stroke="#5a5854" stroke-width=".35"/>`
    + `<ellipse cx="${x}" cy="${top + .9}" rx="${rr - 1.4}" ry="${rry - 1.2}" fill="url(#${gT})"/>`
    + `<path d="M${x - 6} ${top + 1.6}q6 -1.6 12 -.6" stroke="#fff2d8" stroke-width=".8" fill="none" opacity=".8"/><path d="M${x - 2} ${top + 2.4}l5 -.2" stroke="#ffd8a0" stroke-width=".5" opacity=".6"/>`
    + `<ellipse cx="${x}" cy="${top}" rx="${rr}" ry="${rry}" fill="none" stroke="#d8b050" stroke-width=".55"/><path d="M${x - rr + 2} ${top - 2.2}Q${x} ${top - rry - .6} ${x + rr - 2} ${top - 2.2}" stroke="#ffffff" stroke-width=".6" fill="none" opacity=".9"/>`;
  // the steam: three soft wisps rising and leaning left, thinning out
  { const id = nid('st', u), g = nid('sg', u);
    s += `<defs><filter id="${id}" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter>${linGrad(g, 0, top, 0, top - 40, [[0, '#ffffff', .85], [.6, '#ffffff', .45], [1, '#ffffff', 0]])}</defs><g filter="url(#${id})" fill="none" stroke="url(#${g})" stroke-linecap="round">`
      + `<path d="M${x - 4} ${top - 1}C${x - 9} ${top - 8} ${x + 1} ${top - 14} ${x - 4} ${top - 22}S${x - 6} ${top - 34} ${x - 12} ${top - 40}" stroke-width="2.2"/>`
      + `<path d="M${x + 2} ${top - 1}C${x + 6} ${top - 9} ${x - 3} ${top - 15} ${x + 1} ${top - 24}S${x - 1} ${top - 31} ${x - 4} ${top - 36}" stroke-width="1.6"/>`
      + `<path d="M${x + 6} ${top - 1}C${x + 9} ${top - 6} ${x + 3} ${top - 10} ${x + 6} ${top - 17}" stroke-width="1.2"/></g>`; }
  // the warm light the table throws back up under the cup
  s += K.localGlow(u, { x: x - 2, y: y + 1, color: '#ffd8a0', power: .2, radius: 22 }, { squash: .35, core: false });
  return s;
}

/** The day pouring in: a soft glow at the windows, the room's dark round the edges and under the glass. */
function air(u) {
  return K.localGlow(u, { x: 100, y: 50, color: '#fff4e0', power: .2, radius: 90 }, { core: false })
    + gloom(u, 100, 70, 0, 150, .5, '#050302') + gloom(u, 100, 70, 200, 150, .45, '#050302') + gloom(u, 100, 120, 100, 280, .55, '#050302');
}
