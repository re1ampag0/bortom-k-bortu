// «Компас Джека» (Жемчужина, ПРИКАЗ: посмотрите 3 верхние карты колоды — одну в руку, одну в План, третью в сброс),
// variant v5. The user: the compass in a BLACK box with its lid open, the needle plainly NOT to the north (not in a palm).
// The shot: night, on the Pearl's rail; we look down at a small black lacquered box standing on the worn rail cap, the
// lid thrown back (lined with dark wine velvet, a brass fillet round it), in the box a brass compass under glass. The
// rose's north — the red lily and the red point — is away from us, to the sea; the blued needle has swung round from
// it (a faint trace of the swing on the glass) and points at about half past four, some 130° from north — off toward us, at the one who holds the card.
// Far below the rail the black sea and the moon's glitter on it; the moon itself is behind us to the right, out of the
// shot: it lays a cold rim on the brass bezel, the hinges and the lacquer's edges, a sheen on the glass, and the box's
// long shadow over the rail toward us. The needle's own light is a faint warm glow (magic, not fire).
// One 3D frame (perspective, eye above and in front, looking down 40°): the box, the lid, the dial, the rail and the
// shadow all project through P(), so they share one eye and one ground.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;

const T = 40 * Math.PI / 180, DC = 34, FL = 255, CX = 100, CY = 110;   // camera: pitch down, distance, focal, where the origin lands
const YAW = -20 * Math.PI / 180;                                          // the box turned so its right end shows
const B = { x: 4.5, z: 4.2, h: 2.8 };                                       // the box: half width, half depth, height (cm)
const LID = { a: 104 * Math.PI / 180, t: .7 };                            // the lid's opening angle, its thickness
const CMP = { z: 0, R: 3.95, ri: 3.4, dy: -.45 };                          // the compass: centre, bezel radius, dial radius, dial below the top
const NEEDLE = 132;                                                       // the needle's bearing, degrees clockwise from the rose's north (kept at twelve in the picture)
const MOON = (() => { const az = 25 * Math.PI / 180, el = 30 * Math.PI / 180; return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();  // toward the moon (behind, right)
const light = { time: 'night', haze: .3, key: { type: 'moon', az: 25, el: 30, color: '#c8d8f6', power: .8 }, fill: { color: '#2e4064', power: .45 },
  rim: { az: 25, color: '#d8e6ff', power: .6 }, locals: [{ x: 108, y: 96, color: '#ffd070', power: .4, radius: 30 }] };
const skel = { horizon: -60, eye: 1.6, light: 'the moon behind us to the right, out of the shot (cold rim on brass and lacquer, glitter on the sea) + the needle (faint warm)', items: [
  ['sea', 0, 76, 200, 80, 'far below the rail'], ['rail cap', 0, 160, 200, 86, 'the Pearl\'s bulwark'], ['box', 64, 128, 76, 62, 'on the rail cap (contact + cast shadow)'],
  ['lid', 64, 66, 70, 64, 'hinged at the box\'s back, thrown back past upright'], ['compass', 70, 112, 62, 40, 'set in the box top']] };

// world (x right, y up, z toward us; origin — the rail top under the box's middle) → picture
function P(x, y, z) { const d = DC - y * Math.sin(T) - z * Math.cos(T), up = y * Math.cos(T) - z * Math.sin(T); return [CX + FL * x / d, CY - FL * up / d]; }
// the box's own frame (turned by YAW) → world → picture
const W = (x, y, z) => { const c = Math.cos(YAW), s = Math.sin(YAW); return P(x * c + z * s, y, -x * s + z * c); };
const toW = (x, y, z) => { const c = Math.cos(YAW), s = Math.sin(YAW); return [x * c + z * s, y, -x * s + z * c]; };
// a point of the lid: across x, along it from the hinge l (0..2·B.z), off its inner face s (0..LID.t, outward)
const Lp = (x, l, s = 0) => { const c = Math.cos(LID.a), sn = Math.sin(LID.a), dz = l * c - s * sn, dy = l * sn + s * c; return W(x, B.h + dy, -B.z + dz); };
const P2 = p => `${f(p[0])} ${f(p[1])}`;
const poly = pts => 'M' + pts.map(P2).join('L') + 'Z';
// a circle in the box's top plane (height y), centre (0, cz), radius r → picture points
const ring = (r, y, n = 72, cz = CMP.z) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return W(Math.cos(a) * r, y, cz + Math.sin(a) * r); });
// a point on the dial: u to the right, v toward us (south), in the dial plane
const Dp = (u, v) => W(u, B.h + CMP.dy, CMP.z + v);
const bear = (deg, r) => { const a = deg * Math.PI / 180; return Dp(Math.sin(a) * r, -Math.cos(a) * r); };

module.exports = { name: 'Компас Джека', variant: 'v5', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: -60, eye: 1.6 });
    // ——— far below: the black sea at night, the moon's glitter running up to the right ———
    let bg = '';
    { const g = nid('sea', u), R = rng(5);
      bg += `<defs>${linGrad(g, 0, -5, 0, 90, [[0, '#1c2c4a', 1], [.5, '#121e36', 1], [1, '#0a1222', 1]])}</defs><rect x="-5" y="-5" width="210" height="100" fill="url(#${g})"/>`;
      // the swell: long low crests, bigger toward us
      for (let i = 0; i < 44; i++) { const y = R() * 92 - 4, k = (y + 4) / 96, x = R() * 240 - 25, w = 20 + k * 40 + R() * 24;
        bg += `<path d="M${f(x)} ${f(y + .8)}q${f(w * .5)} ${f(-.5 - k * .7)} ${f(w)} ${f((R() - .5) * 1.2)}" stroke="#04080e" stroke-width="${f(.8 + k * 1.2)}" fill="none" opacity=".45" stroke-linecap="round"/>`
          + `<path d="M${f(x + w * .15)} ${f(y)}q${f(w * .35)} ${f(-.4 - k * .6)} ${f(w * .7)} 0" stroke="#5a78a8" stroke-width="${f(.3 + k * .3)}" fill="none" opacity="${f(.14 + R() * .16)}" stroke-linecap="round"/>`; }
      // the glitter: a broken band of bright dashes toward the moon (up and to the right), dense along its axis
      for (let i = 0; i < 150; i++) { const t = R(), ax = 150 + t * 60 - (1 - t) * 12, ay = 90 - t * 96, sp = 10 + (1 - t) * 18, off = (R() + R() + R() - 1.5) * sp, x = ax + off, y = ay + (R() - .5) * 3, w = 1 + (1 - t) * 4 * R() + R() * 2;
        const near = Math.abs(off) / sp; bg += `<path d="M${f(x)} ${f(y)}h${f(w)}" stroke="${near < .4 ? '#fff6e0' : '#c8d8f6'}" stroke-width="${f(.35 + (1 - t) * .4)}" opacity="${f(Math.max(.15, .95 - near * .9))}" stroke-linecap="round"/>`; }
      bg += glow(u, 180, 30, 50, 60, '#9ab4e8', .22); }
    // ——— the rail cap: three planks of old black-painted oak, worn grey where hands go; the moon's sheen along it ———
    { const z0 = -8, z1 = 9, xs = [-40, 40], top = [P(xs[0], 0, z0), P(xs[1], 0, z0), P(xs[1], 0, z1), P(xs[0], 0, z1)], g = nid('rc', u), R = rng(9);
      // the outer face of the bulwark under the far edge (it drops away to the sea), then the cap
      const fe = [P(xs[0], 0, z0), P(xs[1], 0, z0), P(xs[1], -2.4, z0 - .4), P(xs[0], -2.4, z0 - .4)];
      bg += `<path d="${poly(fe)}" fill="#05070c"/>`;
      bg += `<defs>${linGrad(g, 0, top[0][1], 0, top[3][1], [[0, '#4a4c56', 1], [.25, '#34343c', 1], [.7, '#22222a', 1], [1, '#16161c', 1]])}</defs><path d="${poly(top)}" fill="url(#${g})"/>`;
      // plank seams and the grain; worn paint showing the grey wood
      for (const z of [-2.4, 3.4]) bg += `<path d="M${P2(P(-40, 0, z))}L${P2(P(40, 0, z))}" stroke="#08080c" stroke-width="${f(.6 + (z + 8) * .03)}"/><path d="M${P2(P(-40, 0, z + .25))}L${P2(P(40, 0, z + .25))}" stroke="#8a8c98" stroke-width=".3" opacity=".35"/>`;
      for (let i = 0; i < 46; i++) { const z = z0 + .3 + R() * (z1 - z0 - .6), x = -30 + R() * 60, l = 2 + R() * 8, a = P(x, 0, z), b = P(x + l, 0, z + (R() - .5) * .2);
        bg += `<path d="M${P2(a)}L${P2(b)}" stroke="${R() > .4 ? '#0a0a10' : '#6a6c76'}" stroke-width="${f(.25 + R() * .3)}" opacity="${f(.3 + R() * .3)}"/>`; }
      for (const [x, z, w, d] of [[-24, 6, 7, 1.6], [16, 7, 9, 1.4], [-10, -6, 6, 1.2], [26, -5, 8, 1.4]]) { const pts = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return P(x + Math.cos(a) * w * (.8 + R() * .3), 0, z + Math.sin(a) * d * (.8 + R() * .3)); });
        bg += `<path d="${poly(pts)}" fill="#5a5850" opacity=".45"/>`; }
      // nail heads along the seams
      for (const z of [-5.2, .5, 6.2]) for (const x of [-30, -16, -2, 12, 26]) { const p = P(x + (z > 0 ? 3 : 0), 0, z); bg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".55" fill="#0a0a0e"/><circle cx="${f(p[0] - .15)}" cy="${f(p[1] - .2)}" r=".2" fill="#b8c4dc" opacity=".6"/>`; }
      // the far edge (rounded nosing) catches the moon; the near edge falls away into the dark
      bg += `<path d="M${P2(P(-40, 0, z0 + .15))}L${P2(P(40, 0, z0 + .15))}" stroke="#c8d6f0" stroke-width=".8" opacity=".7"/>`
        + `<path d="${poly([P(-40, 0, z1), P(40, 0, z1), P(40, -4, z1 + .2), P(-40, -4, z1 + .2)])}" fill="#08080c"/><path d="M${P2(P(-40, 0, z1))}L${P2(P(40, 0, z1))}" stroke="#6a7088" stroke-width=".5" opacity=".6"/>`;
      // the moon's sheen along the cap, right of the box (where the reflection of the sky lies)
      bg += K.localGlow(u, { x: 158, y: 92, color: '#a8bce4', power: .28, radius: 46 }, { squash: .35, core: false });
      // dew on the paint
      for (let i = 0; i < 30; i++) { const p = P(-34 + R() * 68, 0, -7 + R() * 15); bg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.25 + R() * .3)}" fill="#dfe8ff" opacity="${f(.3 + R() * .4)}"/>`; } }

    // ——— the box's shadow: the moon is behind it to the right, so it falls over the cap toward us and to the left ———
    let fg = '';
    { const sh = q => { const w = toW(...q), k = w[1] / MOON[1]; return P(w[0] - MOON[0] * k, 0, w[2] - MOON[2] * k); };
      const pts = [];
      for (const x of [-B.x, B.x]) for (const z of [-B.z, B.z]) { pts.push(sh([x, 0, z]), sh([x, B.h, z])); }
      const lidPts = []; for (const x of [-B.x, B.x]) for (const l of [0, 2 * B.z]) { const c = Math.cos(LID.a), sn = Math.sin(LID.a); lidPts.push(sh([x, B.h + l * sn, -B.z + l * c])); }
      // convex hull of the box's shadow and the lid's (one dark shape on the cap), clipped to the cap
      const hull = ps => { const s = ps.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
        for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of s.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
        return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const cl = nid('sc', u), bl = nid('sb', u), cap = [P(-40, 0, -8), P(40, 0, -8), P(40, 0, 9), P(-40, 0, 9)];
      fg += `<defs><clipPath id="${cl}"><path d="${poly(cap)}"/></clipPath><filter id="${bl}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter></defs>`
        + `<g clip-path="url(#${cl})"><path d="${poly(hull(pts.concat(lidPts)))}" fill="#04040a" opacity=".62" filter="url(#${bl})"/></g>`;
      // the contact shadow along the box's foot
      fg += `<path d="${poly([W(-B.x - .3, 0, B.z + .5), W(B.x + .5, 0, B.z + .5), W(B.x + .5, 0, -B.z), W(-B.x - .3, 0, -B.z)])}" fill="#000000" opacity=".55" filter="url(#${bl})"/>`; }

    // ——— the box: black lacquer, the top and the right end catch the moon; brass on the corners ———
    { const fr = [W(-B.x, 0, B.z), W(B.x, 0, B.z), W(B.x, B.h, B.z), W(-B.x, B.h, B.z)], rt = [W(B.x, 0, B.z), W(B.x, 0, -B.z), W(B.x, B.h, -B.z), W(B.x, B.h, B.z)],
        tp = [W(-B.x, B.h, B.z), W(B.x, B.h, B.z), W(B.x, B.h, -B.z), W(-B.x, B.h, -B.z)], g1 = nid('bf', u), g2 = nid('br', u), g3 = nid('bt', u);
      fg += `<defs>${linGrad(g1, fr[0][0], 0, fr[1][0], 0, [[0, '#0a0a10', 1], [.6, '#121420', 1], [1, '#1a1c2a', 1]])}${linGrad(g2, rt[0][0], 0, rt[1][0], 0, [[0, '#1a1c28', 1], [.7, '#2a2e40', 1], [1, '#3a4058', 1]])}`
        + `${linGrad(g3, tp[0][0], tp[0][1], tp[2][0], tp[2][1], [[0, '#14141c', 1], [.55, '#1e2030', 1], [.8, '#3a4260', 1], [1, '#242838', 1]])}</defs>`
        + `<path d="${poly(fr)}" fill="url(#${g1})" stroke="#000" stroke-width=".4"/><path d="${poly(rt)}" fill="url(#${g2})" stroke="#000" stroke-width=".4"/><path d="${poly(tp)}" fill="url(#${g3})" stroke="#000" stroke-width=".4"/>`;
      // the lacquer: a long soft reflection of the moonlit sky across the top toward the back right; worn edges
      { const cl = nid('tc', u), bl = nid('tb', u);
        fg += `<defs><clipPath id="${cl}"><path d="${poly(tp)}"/></clipPath><filter id="${bl}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`
          + `<g clip-path="url(#${cl})"><path d="${poly([W(1, B.h, -B.z - 1), W(5.6, B.h, -B.z - 1), W(5.6, B.h, 1), W(3.6, B.h, 1)])}" fill="#8aa0d0" opacity=".35" filter="url(#${bl})"/></g>`; }
      fg += `<path d="M${P2(W(-B.x, B.h, -B.z))}L${P2(W(B.x, B.h, -B.z))}L${P2(W(B.x, B.h, B.z))}" stroke="#b8c8ec" stroke-width=".55" fill="none" opacity=".75"/>`
        + `<path d="M${P2(W(B.x, B.h, -B.z))}L${P2(W(B.x, 0, -B.z))}" stroke="#9aaad0" stroke-width=".5" opacity=".6"/>`
        + `<path d="M${P2(W(-B.x, B.h, B.z))}L${P2(W(B.x, B.h, B.z))}" stroke="#5a6080" stroke-width=".4" opacity=".6"/>`
        + `<path d="M${P2(W(-B.x + .4, .35, B.z))}L${P2(W(B.x, .35, B.z))}L${P2(W(B.x, .35, -B.z))}" stroke="#000" stroke-width=".7" opacity=".5"/>`;
      // a few scratches in the lacquer on the front
      { const R = rng(14); for (let i = 0; i < 7; i++) { const x = -4 + R() * 8, y = .6 + R() * 2.6, a = W(x, y, B.z), b = W(x + .6 + R() * 1.6, y + (R() - .5) * .5, B.z); fg += `<path d="M${P2(a)}L${P2(b)}" stroke="#4a4e64" stroke-width=".25" opacity=".6"/>`; } }
      // brass corner caps (three-sided plates on the top front corners and the right back), the hasp hanging open
      const brass = (pts, lit) => `<path d="${poly(pts)}" fill="${lit ? '#c89a40' : '#7a5a1e'}" stroke="#2a1a04" stroke-width=".3"/>`;
      for (const [sx, sz] of [[-1, 1], [1, 1], [1, -1]]) { const x = sx * B.x, z = sz * B.z, k = .9;
        fg += brass([W(x, B.h, z), W(x - sx * k, B.h, z), W(x, B.h, z - sz * k)], true) + brass([W(x, B.h, z), W(x - sx * k, B.h, z), W(x - sx * k, B.h - k * .9, z), W(x, B.h - k * .9, z)], false);
        if (sx > 0) fg += brass([W(x, B.h, z), W(x, B.h, z - sz * k), W(x, B.h - k * .9, z - sz * k), W(x, B.h - k * .9, z)], true);
        const p = W(x, B.h, z); fg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".6" fill="#fff4d0" opacity=".85"/>`; }
      { const a = W(-.7, B.h - .1, B.z + .05), b = W(.7, B.h - .1, B.z + .05), c = W(.7, B.h - 1.4, B.z + .05), d = W(-.7, B.h - 1.4, B.z + .05);
        fg += `<path d="${poly([a, b, c, d])}" fill="#a8802e" stroke="#2a1a04" stroke-width=".3"/>`;
        // the hook hangs down from the plate (unhooked: the lid is open)
        const h0 = W(0, B.h - 1.2, B.z + .1), h1 = W(0, B.h - 3, B.z + .15);
        fg += `<path d="M${P2(h0)}L${P2(h1)}q-.6 1.2 -1.6 .4" stroke="#b88a34" stroke-width=".7" fill="none" stroke-linecap="round"/><circle cx="${f(h0[0])}" cy="${f(h0[1])}" r=".7" fill="#d8b058" stroke="#2a1a04" stroke-width=".25"/>`; } }

    // ——— the lid: thrown back on two brass hinges; its inside lined with dark wine velvet in a brass fillet ———
    { const inner = [Lp(-B.x, 0), Lp(B.x, 0), Lp(B.x, 2 * B.z), Lp(-B.x, 2 * B.z)], side = [Lp(B.x, 0, 0), Lp(B.x, 2 * B.z, 0), Lp(B.x, 2 * B.z, LID.t), Lp(B.x, 0, LID.t)],
        end = [Lp(-B.x, 2 * B.z, 0), Lp(B.x, 2 * B.z, 0), Lp(B.x, 2 * B.z, LID.t), Lp(-B.x, 2 * B.z, LID.t)], g = nid('lv', u), vg = nid('vg', u), cl = nid('vc', u);
      fg += `<path d="${poly(end)}" fill="#24283a" stroke="#000" stroke-width=".35"/><path d="${poly(side)}" fill="#2a3048" stroke="#000" stroke-width=".35"/>`
        + `<path d="M${P2(end[3])}L${P2(end[2])}" stroke="#c8d6f6" stroke-width=".6" opacity=".85"/><path d="M${P2(side[2])}L${P2(side[3])}" stroke="#aabce4" stroke-width=".5" opacity=".7"/>`;
      // the black frame of the lid's inside, then the velvet panel inside the brass fillet
      fg += `<path d="${poly(inner)}" fill="#0c0c12" stroke="#000" stroke-width=".4"/>`;
      const m = .7, vel = [Lp(-B.x + m, m), Lp(B.x - m, m), Lp(B.x - m, 2 * B.z - m), Lp(-B.x + m, 2 * B.z - m)];
      fg += `<defs>${linGrad(g, vel[0][0], vel[3][1], vel[1][0], vel[0][1], [[0, '#3a0c16', 1], [.5, '#5a1622', 1], [.8, '#6e2030', 1], [1, '#4a1420', 1]])}${radGrad(vg, vel[1][0] - 8, vel[1][1] - 20, 40, [[0, '#ffffff', 0], [.7, '#000000', 0], [1, '#000000', .35]])}<clipPath id="${cl}"><path d="${poly(vel)}"/></clipPath></defs>`
        + `<path d="${poly(vel)}" fill="url(#${g})"/><g clip-path="url(#${cl})"><path d="${poly(vel)}" fill="url(#${vg})"/>`;
      // the velvet's nap: a soft sheen in a band, a dent where the compass pressed when shut
      { const c = Lp(0, B.z, 0), R = rng(31); fg += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="22" ry="18" fill="none" stroke="#2a060c" stroke-width="3" opacity=".5"/><ellipse cx="${f(c[0] - .6)}" cy="${f(c[1] - .6)}" rx="22" ry="18" fill="none" stroke="#9a3a48" stroke-width=".6" opacity=".4"/>`;
        for (let i = 0; i < 60; i++) { const p = Lp(-B.x + m + R() * (2 * B.x - 2 * m), m + R() * (2 * B.z - 2 * m)); fg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r=".3" fill="${R() > .5 ? '#8a2a3a' : '#2a0610'}" opacity=".5"/>`; } }
      fg += `</g><path d="${poly(vel)}" fill="none" stroke="#c8a048" stroke-width=".7"/><path d="M${P2(vel[1])}L${P2(vel[2])}L${P2(vel[3])}" stroke="#fff0c0" stroke-width=".35" fill="none" opacity=".8"/>`;
      // the hinges at the back: two short brass barrels
      for (const x of [-3, 3]) fg += K.shadeCyl(u, ...W(x - 1.1, B.h, -B.z - .05), ...W(x + 1.1, B.h, -B.z - .05), 1.1, L, 'brass', { outline: .3, ell: .5, face: 2 });
      // the moon's rim on the lid's top corner
      { const p = Lp(B.x, 2 * B.z, LID.t * .5); fg += `<path d="M${f(p[0] - 3)} ${f(p[1])}h6M${f(p[0])} ${f(p[1] - 3)}v6" stroke="#ffffff" stroke-width=".35" opacity=".8"/>`; } }

    // ——— the compass: a brass bezel round a well, the dial with the rose, the needle, the glass ———
    { const out = ring(CMP.R, B.h + .25), inn = ring(CMP.R - .55, B.h + .25), well = ring(CMP.R - .55, B.h + CMP.dy), dial = ring(CMP.ri, B.h + CMP.dy);
      const c0 = W(0, B.h, CMP.z), bz = nid('bz', u), wl = nid('wl', u), dg = nid('dg', u), dc = nid('dc', u);
      // the bezel: the drum's short side, then the ring's top (lit at the back right by the moon)
      const side = ring(CMP.R, B.h);
      fg += `<path d="${poly(side)}" fill="#5a3e10"/>`
        + `<defs>${linGrad(bz, out[36][0], out[54][1], out[0][0], out[18][1], [[0, '#5a3e10', 1], [.35, '#9a7428', 1], [.62, '#d8b058', 1], [.8, '#fff0c0', 1], [1, '#a07a2c', 1]])}</defs>`
        + `<path d="${poly(out)}${poly(inn).replace('M', 'M')}" fill="url(#${bz})" fill-rule="evenodd" stroke="#2a1a04" stroke-width=".35"/>`;
      // knurl on the bezel
      for (let i = 0; i < 72; i += 2) { const a = out[i], b = inn[i]; fg += `<path d="M${P2(a)}L${f(a[0] + (b[0] - a[0]) * .35)} ${f(a[1] + (b[1] - a[1]) * .35)}" stroke="#3a2606" stroke-width=".25" opacity=".55"/>`; }
      // the well's wall in shadow, then the dial
      fg += `<defs>${linGrad(wl, 0, inn[54][1], 0, inn[18][1], [[0, '#2a1c08', 1], [.5, '#4a3410', 1], [1, '#6a4c18', 1]])}</defs><path d="${poly(inn)}" fill="url(#${wl})"/>`;
      const dc0 = Dp(0, 0);
      fg += `<defs>${radGrad(dg, dc0[0] + 4, dc0[1] + 2, 30, [[0, '#fbf0d4', 1], [.6, '#e8d8b0', 1], [1, '#b89c68', 1]])}<clipPath id="${dc}"><path d="${poly(dial)}"/></clipPath></defs><path d="${poly(dial)}" fill="url(#${dg})"/>`;
      // the rose, drawn in the dial's plane: degree ticks, two rings, 8 points (north red), the lily over north.
      // The box is turned, so the rose is turned back in it to keep its north at twelve o'clock in the picture (N0)
      let N0 = 0, best = 1e9; for (let d = -60; d <= 60; d += .5) { const p = bear(d, CMP.ri), q = Dp(0, 0); if (p[1] < q[1] && Math.abs(p[0] - q[0]) < best) { best = Math.abs(p[0] - q[0]); N0 = d; } }
      const rb = (deg, r) => bear(N0 + deg, r), NB = N0 + NEEDLE;
      let rose = '';
      for (let i = 0; i < 64; i++) { const a = i / 64 * 360, r0 = CMP.ri * .97, r1 = CMP.ri * (i % 8 ? .9 : .84); rose += `<path d="M${P2(rb(a, r0))}L${P2(rb(a, r1))}" stroke="#4a3018" stroke-width="${i % 8 ? .3 : .5}"/>`; }
      rose += `<path d="${poly(Array.from({ length: 64 }, (_, i) => rb(i / 64 * 360, CMP.ri * .8)))}" fill="none" stroke="#4a3018" stroke-width=".3"/>`;
      const point = (deg, r, w, cl, cd) => { const tp = rb(deg, r), l = rb(deg - 90, w), rr = rb(deg + 90, w), o = Dp(0, 0); return `<path d="${poly([o, l, tp])}" fill="${cd}"/><path d="${poly([o, rr, tp])}" fill="${cl}"/>`; };
      for (let i = 0; i < 4; i++) rose += point(45 + i * 90, CMP.ri * .5, .3, '#e4d4ac', '#b49a6a');
      for (let i = 0; i < 4; i++) rose += i === 0 ? point(0, CMP.ri * .66, .34, '#b8483a', '#7a2a1e') : point(i * 90, CMP.ri * .74, .42, '#d8c49a', '#9a7e52');
      { // the lily over north: three petals in the dial plane
        const b = CMP.ri * .84, q = (du, dv) => { const a = N0 * Math.PI / 180, x = du * .65, y = -b + dv * .65; return Dp(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)); };
        rose += `<path d="M${P2(q(0, -.62))}Q${P2(q(.3, -.2))} ${P2(q(0, .1))}Q${P2(q(-.3, -.2))} ${P2(q(0, -.62))}Z" fill="#9a3a2a"/><path d="M${P2(q(0, .05))}Q${P2(q(.5, -.5))} ${P2(q(.6, 0))}Q${P2(q(.3, -.05))} ${P2(q(0, .12))}ZM${P2(q(0, .05))}Q${P2(q(-.5, -.5))} ${P2(q(-.6, 0))}Q${P2(q(-.3, -.05))} ${P2(q(0, .12))}Z" fill="#9a3a2a"/>`; }
      fg += `<g clip-path="url(#${dc})">${rose}`;
      // the trace of the swing: a faint arc on the dial from north round to where the needle stopped
      { const pts = []; for (let a = N0 + 10; a <= NB - 10; a += 4) pts.push(bear(a, CMP.ri * .72)); let d = `M${P2(pts[0])}`; for (const p of pts.slice(1)) d += `L${P2(p)}`;
        fg += `<path d="${d}" stroke="#2c56a8" stroke-width="2.4" fill="none" opacity=".22" stroke-linecap="round"/><path d="${d}" stroke="#2c56a8" stroke-width=".6" fill="none" opacity=".6" stroke-dasharray="1.4 1"/>`; }
      // the needle's warm glow on the card
      fg += `<path d="${poly([Dp(0, 0), bear(NB - 25, CMP.ri), bear(NB + 25, CMP.ri)])}" fill="#ffd060" opacity=".22" style="mix-blend-mode:multiply"/></g>`;
      // the needle: a long raised arrow of blued steel, darkest at the pivot and white-blue at its point, gold glow round
      // the head — the end the eye reads; the tail the other way is short, dark and plain
      { const head = [Dp(0, 0), bear(NB - 90, .46), bear(NB - 6, CMP.ri * .66), bear(NB - 17, CMP.ri * .62), bear(NB, CMP.ri * .97), bear(NB + 17, CMP.ri * .62), bear(NB + 6, CMP.ri * .66), bear(NB + 90, .46)];
        const tail = [bear(NB - 90, .46), bear(NB + 180 + 12, CMP.ri * .3), bear(NB + 180, CMP.ri * .36), bear(NB + 180 - 12, CMP.ri * .3), bear(NB + 90, .46)];
        const lift = 1.8, gn = nid('gn', u), bl = nid('nb', u), tip = bear(NB, CMP.ri * .97), root = Dp(0, 0);
        fg += `<defs><filter id="${bl}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8"/></filter>${linGrad(gn, root[0], root[1], tip[0], tip[1], [[0, '#0e1c3a', 1], [.45, '#1e3e88', 1], [.8, '#5a8ae8', 1], [1, '#e8f2ff', 1]])}</defs>`
          + `<path d="${poly(head.concat(tail.slice(1, 4)))}" fill="#2a1a08" opacity=".4" transform="translate(-1.8 ${lift})"/>`
          + `<path d="${poly(head)}" fill="#ffc848" opacity=".95" filter="url(#${bl})"/>`
          + `<path d="${poly(tail)}" fill="#3a3e4a" stroke="#0a0c12" stroke-width=".3"/><path d="${poly(head)}" fill="url(#${gn})" stroke="#060c20" stroke-width=".45"/>`
          + `<path d="M${P2(head[1])}L${P2(head[4])}" stroke="#ffffff" stroke-width=".5" opacity=".85"/>`
          + K.shadeSphere(u, root[0], root[1] - .3, 1.5, L, 'brass', { outline: .3 })
          + K.localGlow(u, { x: tip[0], y: tip[1], color: '#ffe080', power: .75, radius: 13 }); }
      // the glass: a cool film, the moon's sheen as a curved band on the far right, a sharp glint
      { const gl = ring(CMP.R - .55, B.h + .05), a0 = 300, a1 = 20, arc = []; for (let a = a0; a <= 360 + a1; a += 4) arc.push(bear(a, CMP.ri * .78));
        let d = `M${P2(arc[0])}`; for (const p of arc.slice(1)) d += `L${P2(p)}`;
        fg += `<path d="${poly(gl)}" fill="#cfe0ff" opacity=".07"/><path d="${d}" stroke="#eef6ff" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/>`
          + `<path d="M${P2(bear(210, CMP.ri * .7))}L${P2(bear(235, CMP.ri * .74))}" stroke="#ffffff" stroke-width=".6" opacity=".3" stroke-linecap="round"/>`; }
      // the moon's glint on the bezel at the back right, and its rim along the bezel's far edge
      { const rim = []; for (let i = 52; i <= 72; i++) rim.push(out[i % 72]); let d = `M${P2(rim[0])}`; for (const p of rim.slice(1)) d += `L${P2(p)}`;
        fg += `<path d="${d}" stroke="#fff6d8" stroke-width=".8" fill="none" opacity=".9"/>`;
        const p = out[64]; fg += `<path d="M${f(p[0] - 4)} ${f(p[1])}h8M${f(p[0])} ${f(p[1] - 4)}v8" stroke="#ffffff" stroke-width=".4" opacity=".95"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="1.2" fill="#ffffff" opacity=".9"/>`
          + glow(u, p[0], p[1], 7, 7, '#fff6d8', .6); } }
    // the air: a little of the moon in it; the corners and the near edge fall dark
    fg += glow(u, 175, 20, 60, 50, '#9ab4e0', .1) + gloom(u, 100, 100, -10, 10, .3, '#04060c') + gloom(u, 100, 120, 100, 280, .55, '#04060c');
    return [bg, fg];
  } };
