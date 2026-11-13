// «Всплытие» (Голландец, ПРИКАЗ: «Голландец» сразу даёт ещё один Залп с +2 урона, без Реакций и без платы Порохом),
// method A: the first-round scene (portrait-dutch.cjs SCENES['Всплытие']) at its best. The concept stays: in the pale
// green haze the Dutchman bursts out of the sea bow first, water pouring off her, her broadside already firing at
// the pale enemy on the horizon; the pale sun behind the fog. Brief (card-briefs.md «Всплытие»): the sea boils, the
// whole ship tears upward, waterfalls off her sides, the guns run out and firing. Find: the waterfalls. Unlike
// «Из пучины» (still under water, firing from below) — here she is all out, above the sea.
// Fixed against the first round: the old ship was a pasted picture pitched 30° with no bottom and thin hairs of
// water — now the kit's Dutchman pitched bow up with her weedy bottom shown, sheets of water off her sides, the sea
// boiling in a ring of foam round her; her guns run out and firing along the row of ports.
// Review fix (verdict-b1): she read as «sinking / capsizing». Now: pitched 22° (not 28°), the whole hull out of the
// sea (slope cut + her full bottom to the rudder), only the heel of her stern in the foam, the bow and forefoot hang
// in the air with the keel line rim-lit and its shadow on the sea; the masts stay clear of the water. Under the bow a
// big fountain thrown up and forward in a cluster of drops; a boiling ring of foam with spray shooting UP. `fall` is
// redone: each stream starts at the rail or a port (the tops follow the sloping rail), hugs the side as a wide
// translucent ribbon (bright lip, 30–40 % below, light veins, the dark hull through it), leaves at the bottom line,
// falls in an arc out then down, widening and tearing into 2–4 threads and drops, ending in a cloud of spray; 4 wide
// ribbons, thin ones between at uneven gaps; thin threads drip off the sails and rigging. Three flashes along the ports.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng, mix, lerp } = K;
const { motes } = PK;

const HZ = 100, SEA = 131;                                                                   // the horizon; the sea round her
const DU = { kind: 'dutch', x: 100, y: 0, scale: 1.06, flip: true, heel: -22, roll: -12, slope: true };   // bow right, up out of the sea
const ENEMY = { kind: 'endeavour', x: 176, y: HZ + 2.2, scale: .27 };
// a point of the ship in her own frame (X along the hull, + to the stern; H up from the waterline; Z across, + to us)
// → the picture, with her roll and pitch (the kit's projection: H' = H cos φ − Z sin φ, then the heel in the plane)
const PHI = DU.roll * Math.PI / 180;
function pt(o, X, Hh, Z = 0) {
  const Hp = Hh * Math.cos(PHI) - Z * Math.sin(PHI), dir = o.flip ? -1 : 1, s = o.scale, th = -dir * (o.heel || 0) * Math.PI / 180, dx = dir * s * X, dy = -s * Hp;
  return [o.x + dx * Math.cos(th) - dy * Math.sin(th), o.y + dx * Math.sin(th) + dy * Math.cos(th)];
}
// her keel line (X, H) from the stem's foot to the sternpost; the rudder hangs aft of it
const KEEL = [[-47.5, 1.5], [-46, -1.8], [-43.5, -5.4], [-38.5, -8.6], [-31, -10], [-10, -10.3], [18, -10.2], [31, -9.4], [39, -7.2], [44, -3.6], [46, 1.5]];
// set her so the lowest point of the keel (the heel of the stern) just touches the sea
{ let lo = -1e9; for (const [X, H] of KEEL) lo = Math.max(lo, pt(DU, X, H)[1]); DU.y = SEA - .4 - lo; }
const light = { time: 'fog', haze: .8, key: { type: 'sun', x: 66, y: 34, el: 30, color: '#f2fff0', power: .75 }, fill: { color: '#3a6a60', power: .5 },
  rim: { az: 330, color: '#f4fff8', power: .5 }, locals: [{ x: 124, y: 92, color: '#ffc070', power: .55, radius: 34 }] };
const skel = { horizon: HZ, eye: 2, light: 'the pale sun in the fog upper left, a little behind her (back light): bright rims, the falls lit; the gun flashes warm', items: [
  ['Dutchman, heel -22, roll -12', 30, 26, 150, 106, 'all out of the sea'], ['bow + keel in the air', 120, 78, 40, 26, 'over the fountain'],
  ['falls off the rail / ports', 50, 64, 100, 66, 'down her side to the sea'], ['flashes', 84, 80, 60, 24, 'along the ports'], ['fountain', 116, 70, 60, 62, 'under the bow'],
  ['enemy', 166, 88, 26, 14, 'far sea'], ['ring of foam', 24, 124, 150, 18, 'the sea round her'], ['near sea', 0, 142, 200, 140, 'under the glass']] };

// the bottom line of her hull in the picture: the keel, densely; y at a picture x (null off the hull)
const KP = (() => { const out = []; for (let i = 0; i < KEEL.length - 1; i++) for (let t = 0; t < 1; t += .1) out.push(pt(DU, lerp(KEEL[i][0], KEEL[i + 1][0], t), lerp(KEEL[i][1], KEEL[i + 1][1], t))); out.push(pt(DU, ...KEEL[KEEL.length - 1])); return out; })();
function keelY(x) { let best = null; for (let i = 0; i < KP.length - 1; i++) { const a = KP[i], b = KP[i + 1]; if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) { const y = lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); if (best == null || y > best) best = y; } } return best; }

// KIT-CANDIDATE fall: water pouring off a ship that rises out of the sea. top — where it spills (the rail or a port);
// leave — where it leaves the hull (the bottom line); sea — the y of the sea; w — its width at the top.
// 1) it hugs the side as a broad translucent ribbon (a bright lip at the top, ~30–40 % below, light veins along it,
// the dark hull showing through), bending a little with the turn of the hull; 2) at `leave` it breaks away and falls
// in an arc — a little out, then plumb; 3) it widens and tears into 2–4 threads and drops; 4) it ends in a cloud of
// spray on the sea, never a clean cut. o: { op, out (the arc out), bend }
function fall(u, L, top, leave, sea, w, seed, o = {}) {
  const R = rng(seed), op = o.op || 1, wide = w > 2.6;
  let out = '';
  const ribbon = (P, W, grad) => { const Lp = [], Rp = []; for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = W[i] / 2;
      Lp.push([P[i][0] - dy / l * hw, P[i][1] + dx / l * hw]); Rp.unshift([P[i][0] + dy / l * hw, P[i][1] - dx / l * hw]); }
    return { d: 'M' + Lp.concat(Rp).map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', Lp, Rp: Rp.slice().reverse() }; };
  const polyl = P => 'M' + P.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  // ——— 1) on the hull: from the spill down the side to where it leaves ———
  const h1 = leave[1] - top[1], bend = o.bend != null ? o.bend : .12, n1 = 9, P1 = [], W1 = [];
  const c1 = o.ctrl || [lerp(top[0], leave[0], .35) + h1 * bend * .4, lerp(top[1], leave[1], .5)];
  for (let i = 0; i <= n1; i++) { const t = i / n1, a = 1 - t; P1.push([a * a * top[0] + 2 * a * t * c1[0] + t * t * leave[0], a * a * top[1] + 2 * a * t * c1[1] + t * t * leave[1]]); W1.push(w * (.82 + .38 * t) * (1 + (R() - .5) * .14)); }
  if (h1 > 1) {
    const g1 = nid('fh', u), rb = ribbon(P1, W1);
    out += `<defs>${linGrad(g1, top[0], top[1], leave[0], leave[1], [[0, '#ffffff', .78 * op], [.05, '#f0fff8', .5 * op], [.16, '#e2f8ee', .34 * op], [1, '#d6f2e8', .28 * op]])}</defs>`
      + `<path d="${rb.d}" fill="url(#${g1})"/>`
      // the lit edge (the sun upper left) and a darker far edge give it its round
      + `<path d="${polyl(rb.Lp)}" stroke="#ffffff" stroke-width="${f(Math.min(.4, w * .1))}" fill="none" opacity="${f(.55 * op)}"/>`
      + `<path d="${polyl(rb.Rp)}" stroke="#7aa898" stroke-width="${f(Math.min(.35, w * .08))}" fill="none" opacity="${f(.35 * op)}"/>`;
    // light veins running down it
    for (let k = 0; k < (wide ? 3 : w > 1.4 ? 2 : 1); k++) { const off = (R() - .5) * .7, a0 = Math.floor(R() * 3), a1 = n1 - Math.floor(R() * 2), P = [];
      for (let i = a0; i <= a1; i++) P.push([P1[i][0] + off * W1[i] * (1 + (R() - .5) * .1), P1[i][1]]);
      out += `<path d="${polyl(P)}" stroke="#ffffff" stroke-width="${f(.16 + R() * .2)}" fill="none" opacity="${f((.4 + R() * .3) * op)}" stroke-linecap="round"/>`; }
    // the lip: the water bulging over the edge where it spills
    out += `<path d="M${f(top[0] - w * .55)} ${f(top[1] + .3)}Q${f(top[0])} ${f(top[1] - .45)} ${f(top[0] + w * .55)} ${f(top[1] + .3)}" stroke="#ffffff" stroke-width="${f(Math.min(.45, .2 + w * .05))}" fill="none" opacity="${f(.75 * op)}" stroke-linecap="round"/>`;
  }
  // ——— 2) the free fall from the bottom line to the sea ———
  const h2 = sea - leave[1], w2 = W1[n1];
  if (h2 < 3) return out + K.foam(u, { x: leave[0], y: sea + .3, w: w * 2.4 + 3, h: 1.2, seed: seed % 13, L });
  const ox = o.out != null ? o.out : .8 + w * .3, X = t => leave[0] + ox * (1 - Math.pow(1 - Math.min(1, t / .4), 2)), Yf = t => leave[1] + h2 * t;
  const tb = wide ? .42 + R() * .14 : .22 + R() * .1, n2 = 8, P2 = [], W2 = [];
  for (let i = 0; i <= n2; i++) { const t = tb * i / n2; P2.push([X(t), Yf(t)]); W2.push(w2 * (1 + .45 * t / tb) * (1 + (R() - .5) * .12)); }
  { const g2 = nid('ff', u), rb = ribbon(P2, W2);
    out += `<defs>${linGrad(g2, 0, leave[1], 0, Yf(tb), [[0, '#eefff8', .42 * op], [.6, '#e0f8ee', .34 * op], [1, '#d6f2e8', .2 * op]])}</defs><path d="${rb.d}" fill="url(#${g2})"/>`
      + `<path d="${polyl(rb.Lp)}" stroke="#ffffff" stroke-width="${f(Math.min(.35, w * .08))}" fill="none" opacity="${f(.5 * op)}"/>`;
    for (let k = 0; k < (wide ? 3 : 1); k++) { const off = (R() - .5) * .6, P = P2.map((p, i) => [p[0] + off * W2[i], p[1]]);
      out += `<path d="${polyl(P)}" stroke="#ffffff" stroke-width="${f(.15 + R() * .18)}" fill="none" opacity="${f((.4 + R() * .3) * op)}" stroke-linecap="round"/>`; } }
  // it tears into threads, fanning out a little, some breaking into drops before the sea
  const nt = wide ? 3 + (R() < .5 ? 1 : 0) : w > 1.4 ? 2 : 1 + (R() < .5 ? 1 : 0), wb = W2[n2], y0 = Yf(tb), x0 = X(tb);
  for (let k = 0; k < nt; k++) { const fr = nt > 1 ? k / (nt - 1) - .5 : (R() - .5) * .3, sx = x0 + fr * wb * .8, ex = x0 + ox * 0 + fr * wb * 1.35 + (R() - .5) * 1.2, reach = R() < .65 ? 1 : .55 + R() * .3;
    const ey = lerp(y0, sea - .4, reach), mx = lerp(sx, ex, .5) + (R() - .5) * 1.2, sw = Math.max(.22, Math.min(1.1, wb / nt * (.45 + R() * .3)));
    out += `<path d="M${f(sx)} ${f(y0 - .6)}Q${f(mx)} ${f(lerp(y0, ey, .5))} ${f(ex)} ${f(ey)}" stroke="#e8fff6" stroke-width="${f(sw)}" fill="none" opacity="${f((.45 + R() * .2) * op)}" stroke-linecap="round"/>`
      + `<path d="M${f(sx - sw * .25)} ${f(y0)}Q${f(mx - sw * .25)} ${f(lerp(y0, ey, .5))} ${f(ex - sw * .25)} ${f(ey)}" stroke="#ffffff" stroke-width="${f(sw * .3)}" fill="none" opacity="${f(.55 * op)}" stroke-linecap="round"/>`;
    if (reach < 1) for (let j = 0; j < 4; j++) { const yy = lerp(ey, sea - .5, (j + R()) / 4), r = .2 + R() * .35; out += `<ellipse cx="${f(ex + (R() - .5) * 1.4)}" cy="${f(yy)}" rx="${f(r)}" ry="${f(r * 1.8)}" fill="#f4fff8" opacity="${f(.5 + R() * .4)}"/>`; } }
  // drops shaken off round the lower fall
  for (let i = 0; i < 4 + w * 3; i++) { const t = tb + R() * (1 - tb), r = .18 + R() * .42; out += `<ellipse cx="${f(X(t) + (R() - .5) * wb * 1.9)}" cy="${f(Yf(t))}" rx="${f(r)}" ry="${f(r * 1.7)}" fill="#f4fff8" opacity="${f(.4 + R() * .5)}"/>`; }
  // 4) the cloud of spray where it hits the sea
  { const cb = nid('fc', u), cx = x0 + (R() - .5), cw = wb * 1.5 + 3;
    out += `<defs><filter id="${cb}" x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="${f(.6 + w * .12)}"/></filter></defs>`
      + `<ellipse cx="${f(cx)}" cy="${f(sea - 1.2 - w * .15)}" rx="${f(cw * .7)}" ry="${f(1.6 + w * .35)}" fill="#f4fff8" opacity="${f(.5 * op)}" filter="url(#${cb})"/>`
      + K.splash(u, { x: cx, y: sea + .3, w: cw, h: 2.5 + w * .9, seed: seed % 9, L, wind: 0 });
    for (let i = 0; i < 3 + w * 2; i++) { const r = .2 + R() * .4; out += `<ellipse cx="${f(cx + (R() - .5) * cw * 1.2)}" cy="${f(sea - 1 - R() * (3 + w * 1.4))}" rx="${f(r)}" ry="${f(r * 1.4)}" fill="#f4fff8" opacity="${f(.4 + R() * .45)}"/>`; } }
  return out;
}

module.exports = { name: 'Всплытие', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2 });
    const g = K.shipGeom('dutch', DU);
    const xs = KP.map(p => p[0]), xMin = Math.min(...xs), xMax = Math.max(...xs), xMid = (xMin + xMax) / 2;
    const bow = pt(DU, -43.5, -5.4);                                   // the forefoot, high in the air
    // ——— the pale green haze: the sun a white disc through the fog, the sea dark under it ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 7 }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[150, 20, 110, 12, 4, .2], [30, 70, 70, 9, 9, .45], [168, 70, 70, 8, 14, .5], [100, 88, 90, 6, 2, .65]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .7, seed: 11, glitter: 66 });
    bg += K.ship(u, L, { ...ENEMY, sails: 'full', detail: 'far', seed: 3 });
    bg += K.fog(u, L, { y: HZ - 16, h: 22, density: .55, seed: 5 });
    // the sea darkens and heaves round her: a broad swell of displaced water
    { const sw = nid('sw', u); bg += `<defs>${radGrad(sw, xMid, SEA + 2, 72, [[0, '#0a2420', .6], [.6, '#0e2c26', .3], [1, '#0e2c26', 0]])}</defs><ellipse cx="${f(xMid)}" cy="${SEA + 2}" rx="80" ry="15" fill="url(#${sw})"/>`; }
    // her shadow on the sea under the hull and the hanging bow
    { const hs = nid('hs', u), hb = nid('hsb', u); bg += `<defs>${radGrad(hs, bow[0] - 14, SEA + 1, 36, [[0, '#04120e', .7], [.7, '#04120e', .3], [1, '#04120e', 0]])}<filter id="${hb}" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`
      + `<ellipse cx="${f(bow[0] - 14)}" cy="${SEA + 1.4}" rx="40" ry="4" fill="url(#${hs})" filter="url(#${hb})"/>`; }
    // the fountain she threw up breaking out, under the raised bow: a tall burst flung up and forward
    { const fx0 = bow[0] - 4;
      // KIT-CANDIDATE plume: a burst of white water thrown up from the sea, narrow at the sea, fanning out forward into
      // a lobed crown; light rays inside it, shaded flanks, the edges soft
      { const R = rng(87), pg = nid('pg', u), pb = nid('pb', u), w0 = 16, w1 = 34, h = 46, lean = 6, Lp = [], Rp = [], n = 10, top = SEA - h;
        for (let i = 0; i <= n; i++) { const t = i / n, y = SEA + .5 - h * t, cx = fx0 + lean * Math.pow(t, 1.5), hw = lerp(w0, w1, Math.pow(t, .8)) / 2 * (1 + .08 * Math.sin(t * 9 + R()));
          Lp.push([cx - hw, y]); Rp.unshift([cx + hw, y]); }
        let crown = ''; for (let k = 0; k <= 9; k++) { const a = k / 9, x = fx0 + lean + (a - .5) * w1 * 1.02, y = top + Math.pow(Math.abs(a - .5) * 2, 2) * h * .22 - R() * 3, r = 3.5 + R() * 4.5; crown += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`; }
        bg += `<defs>${linGrad(pg, 0, top - 8, 0, SEA, [[0, '#ffffff', .95], [.45, '#ecfdf6', .85], [1, '#c4e4d8', .78]])}<filter id="${pb}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".8"/></filter></defs>`
          + `<g fill="url(#${pg})" filter="url(#${pb})"><path d="M${Lp.concat(Rp).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z"/>${crown}</g>`;
        // the shaded flanks (the sun is behind her, upper left) and the light rays of the jets inside
        bg += `<path d="M${Rp.map(p => f(p[0] - 2) + ' ' + f(p[1])).join('L')}" stroke="#8fb8aa" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>`;
        for (let i = 0; i < 9; i++) { const a = i / 8, ex = fx0 + lean + (a - .5) * w1 * .9, ey = top + 2 + Math.pow(Math.abs(a - .5) * 2, 2) * h * .2;
          bg += `<path d="M${f(fx0 + (a - .5) * w0 * .6)} ${f(SEA - 1)}Q${f(lerp(fx0, ex, .4))} ${f(lerp(SEA, ey, .6))} ${f(ex)} ${f(ey)}" stroke="#ffffff" stroke-width="${f(.4 + R() * .6)}" fill="none" opacity="${f(.4 + R() * .3)}" stroke-linecap="round"/>`; } }
    }
    // ——— the Dutchman: her bottom (all of it, out of the sea), then the kit ship cut along her own waterline ———
    let mid = '';
    { const bl = nid('bl', u), sc = nid('sc', u), R = rng(13), top = [], bot = KEEL.map(([X, H]) => pt(DU, X, H));
      for (let X = 46; X >= -47.5; X -= 3) top.push(pt(DU, X, 1.6));
      let belly = `<defs>${linGrad(bl, bow[0], bow[1] - 14, bow[0] + 8, bow[1] + 6, [[0, '#5a6a52', 1], [.45, '#34442e', 1], [1, '#121c16', 1]])}<clipPath id="${sc}"><rect x="-10" y="-10" width="220" height="${SEA + 10.2}"/></clipPath></defs>`
        + `<path d="M${bot.concat(top).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="url(#${bl})"/>`;
      // the rudder hanging off the sternpost
      { const a = pt(DU, 46, 3), b = pt(DU, 49.2, 2), c = pt(DU, 48.4, -6.6), d = pt(DU, 45.2, -6.4); belly += `<path d="M${[a, b, c, d].map(p => f(p[0]) + ' ' + f(p[1])).join('L')}Z" fill="#1c2a20" stroke="#0a120c" stroke-width=".3"/>`; }
      // strakes along the bottom, weed hanging straight down, barnacles
      for (const H of [-2.6, -5, -7.4]) { const P = []; for (let X = -44; X <= 42; X += 4) { const kh = KEEL.reduce((m, k, i) => (i && X >= KEEL[i - 1][0] && X <= k[0] ? lerp(KEEL[i - 1][1], k[1], (X - KEEL[i - 1][0]) / (k[0] - KEEL[i - 1][0])) : m), -10); if (H > kh + .6) P.push(pt(DU, X, H)); }
        if (P.length > 1) belly += `<path d="M${P.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="#0e1810" stroke-width=".3" fill="none" opacity=".5"/>`; }
      for (let i = 0; i < 26; i++) { const X = -44 + R() * 86, p = pt(DU, X, -3 - R() * 6.5), l = 3 + R() * 7;
        belly += `<path d="M${f(p[0])} ${f(p[1])}q${f(-.6 + R() * 1.2)} ${f(l * .5)} ${f(-.4 + R() * .8)} ${f(l)}" stroke="#2e5a3a" stroke-width="${f(.45 + R() * .6)}" fill="none" opacity=".85" stroke-linecap="round"/>`; }
      for (let i = 0; i < 36; i++) { const X = -45 + R() * 88, p = pt(DU, X, -.5 - R() * 8.5); belly += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.35 + R() * .7)}" fill="#a8ac94" opacity=".5"/>`; }
      // the keel line: wet, rim-lit by the sun behind her, so the bottom reads hanging in the air
      { const P = KEEL.slice(0, 8).map(([X, H]) => pt(DU, X, H + .3)); belly += `<path d="M${P.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" stroke="#effff6" stroke-width=".8" fill="none" opacity=".6" stroke-linejoin="round"/>`; }
      { const P = KEEL.map(([X, H]) => pt(DU, X, H)); belly += `<path d="M${P.map(p => f(p[0]) + ' ' + f(p[1] + .5)).join('L')}" stroke="#050a07" stroke-width=".9" fill="none" opacity=".6"/>`; }
      mid += `<g clip-path="url(#${sc})">${belly}</g>`; }
    mid += K.ship(u, L, { ...DU, sails: 'full', detail: 'near', lights: true, seed: 4 });
    // ——— the falls: off the rail along her side (the tops follow the sloping rail) and out of the ports ———
    let falls = '';
    { const portH = X => 9 + (g.rail(X) - 18.5) * 9 / 18.5 + 1.2;
      const keelH = X => { for (let i = 1; i < KEEL.length; i++) if (X <= KEEL[i][0]) return lerp(KEEL[i - 1][1], KEEL[i][1], (X - KEEL[i - 1][0]) / (KEEL[i][0] - KEEL[i - 1][0])); return KEEL[KEEL.length - 1][1]; };
      // a stream at the station X from the height Hs: down the hull's own section (slanted with her pitch), easing to plumb
      const from = (X, Hs, w, seed, o = {}) => { const Z = g.hullZ(X, Hs), p = pt(DU, X, Hs, Z), kl = pt(DU, X, keelH(X)), lx = lerp(p[0], kl[0], .7), ly = keelY(lx); if (ly == null) return;
        const mH = lerp(Hs, keelH(X), .5), c = pt(DU, X, mH, g.hullZ(X, Math.max(mH, 0)) + .6);
        falls += fall(u, L, [p[0], p[1] + .2], [lx, ly], SEA, w, seed, Object.assign({ ctrl: [lerp(c[0], p[0], .15), c[1]] }, o)); };
      // over the rail: four broad sheets and thin ones between them, the gaps uneven
      for (const [X, w] of [[-38.5, 4.8], [-34.5, 1.1], [-31.5, .8], [-21, 4.3], [-16.5, 1.2], [-7, 1.5], [1.5, 5.2], [6.5, .9], [12.5, 1.6], [22, 3.6], [29.5, 1], [35, 1.4]]) {
        from(X, g.rail(X), w, 200 + Math.round(X * 10), { op: w > 2.6 ? 1 : .8 }); }
      // out of the ports between the guns: short gushes that bulge out of the port and then run down the side
      for (const [X, w] of [[-24.2, 1.8], [16.2, 1.6]]) from(X, portH(X) - .6, w, 300 + Math.round(X * 10), { op: .75 }); }
    // thin threads dripping off the yards and the rigging
    { const R = rng(61); let dr = '';
      for (const m of g.masts) { const H = m.H; for (const q of [.42, .6, .78]) for (let j = 0; j < 3; j++) { const p = pt(DU, m.x + (R() - .5) * 26 * (1.1 - q), H * q - 2 - R() * 4), l = 3 + R() * 7;
        dr += `<path d="M${f(p[0])} ${f(p[1])}v${f(l)}" stroke="#eafff6" stroke-width="${f(.22 + R() * .16)}" opacity="${f(.45 + R() * .3)}"/><ellipse cx="${f(p[0])}" cy="${f(p[1] + l + .5 + R() * 2)}" rx=".22" ry=".4" fill="#f4fff8" opacity=".7"/>`; } }
      falls += `<g stroke-linecap="round">${dr}</g>`; }
    // ——— the guns along the row of ports: a full flash, a fresh one, one in its smoke ———
    let fx = '';
    { const portH = X => 9 + (g.rail(X) - 18.5) * 9 / 18.5 + 1.2, P = [-30, -12.7, 10.4].map(X => { const p = pt(DU, X, portH(X) + .4, g.hullZ(X, portH(X)) + 1.9); return [p[0] + .6, p[1]]; });
      fx += K.smoke(u, L, { x: P[2][0] + 7, y: P[2][1] + 1, w: 20, h: 13, wind: 1, seed: 8, opacity: .8, glow: { color: '#ffb060', power: .3 } });
      fx += K.smoke(u, L, { x: P[1][0] + 9, y: P[1][1] + 1, w: 22, h: 14, wind: 1, seed: 5, opacity: .7, glow: { color: '#ffb060', power: .45 } });
      fx += K.smoke(u, L, { x: P[0][0] + 11, y: P[0][1] + 2, w: 28, h: 17, wind: 1, seed: 3, opacity: .72, glow: { color: '#ffb060', power: .6 } });
      fx += K.muzzleFlash(u, { x: P[0][0], y: P[0][1], dir: 6, len: 24, seed: 2 }) + K.muzzleFlash(u, { x: P[1][0], y: P[1][1], dir: 10, len: 15, seed: 1 }) + K.muzzleFlash(u, { x: P[2][0], y: P[2][1], dir: 14, len: 8, seed: 3 });
      fx += K.localGlow(u, { x: P[0][0] + 8, y: P[0][1], color: '#ffb24a', power: .5, radius: 30 }, { core: false }) + K.localGlow(u, { x: P[1][0] + 5, y: P[1][1], color: '#ffb24a', power: .35, radius: 18 }, { core: false }); }
    // ——— the sea boils round her: a ring of foam, the spray shooting UP off it, the fountain's flung drops ———
    let sea = '';
    { const R = rng(19), cx = xMid - 4, rx = 66, ry = 7.5;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = cx + Math.cos(a) * rx, y = SEA + 2.5 + Math.sin(a) * ry; sea += K.foam(u, { x, y, w: 16 + R() * 12, h: 1.6, seed: 40 + i, L }); }
      sea += `<ellipse cx="${f(cx)}" cy="${SEA + 2.5}" rx="${rx}" ry="${ry}" fill="none" stroke="#f4fff8" stroke-width="1.3" opacity=".6"/><ellipse cx="${f(cx)}" cy="${SEA + 2.5}" rx="${rx - 8}" ry="${ry - 2}" fill="#e8fff6" opacity=".16"/>`;
      // the churned water where she broke out: a low ragged mound of white along the sea under her
      { const mg = nid('mg', u), tp = [], n = 28, a0 = cx - 60, a1 = cx + 60; for (let i = 0; i <= n; i++) { const t = i / n, hh = 3.2 * Math.pow(Math.sin(Math.PI * t), .7) * (.6 + R() * .6); tp.push([lerp(a0, a1, t), SEA + 1.5 - hh]); }
        sea += `<defs>${linGrad(mg, 0, SEA - 4, 0, SEA + 3, [[0, '#f4fff8', .85], [.5, '#cfeee2', .6], [1, '#6a9a8a', .3]])}</defs><path d="M${f(a0)} ${SEA + 3}L${tp.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}L${f(a1)} ${SEA + 3}Z" fill="url(#${mg})"/>`; }
      sea += K.foam(u, { x: cx, y: SEA + .6, w: 110, h: 2.4, seed: 7, L });
      // spray shooting UP off the ring: tapering spouts with drops over them
      for (let i = 0; i < 22; i++) { const a = R() * Math.PI * 2, x = cx + Math.cos(a) * rx * (.85 + R() * .2), y = SEA + 2.5 + Math.sin(a) * ry, h = 3 + R() * 8 * (Math.sin(a) > 0 ? 1.2 : .8), lean = (Math.cos(a)) * 1.5, w = .5 + R() * .7;
        sea += `<path d="M${f(x - w)} ${f(y)}Q${f(x + lean * .4)} ${f(y - h * .6)} ${f(x + lean)} ${f(y - h)}Q${f(x + lean * .4 + w * .3)} ${f(y - h * .5)} ${f(x + w)} ${f(y)}Z" fill="#f0fff8" opacity="${f(.45 + R() * .35)}"/>`;
        for (let j = 0; j < 3; j++) { const r = .2 + R() * .35; sea += `<ellipse cx="${f(x + lean * 1.2 + (R() - .5) * 2)}" cy="${f(y - h - 1 - R() * 4)}" rx="${f(r)}" ry="${f(r * 1.5)}" fill="#f4fff8" opacity="${f(.45 + R() * .4)}"/>`; } }
      for (const [x, w, h, sd] of [[cx - 30, 14, 9, 2], [cx + 34, 14, 10, 5], [cx - 58, 10, 6, 7], [cx - 6, 16, 7, 0]]) sea += K.splash(u, { x, y: SEA + .8, w, h, seed: sd, L, wind: 0 });
      // boiling: bubbles and blobs of foam on the sea round the ring
      for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, r = 30 + R() * 40, x = cx + Math.cos(a) * r, y = SEA + 2.5 + Math.sin(a) * r * .13, rr = .4 + R() * 1.2;
        sea += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr)}" ry="${f(rr * .5)}" fill="none" stroke="#f0fff8" stroke-width=".3" opacity="${f(.4 + R() * .4)}"/>`; }
      // the fountain's water flung up and forward from under the bow: a cluster of drops and torn ropes
      const fx0 = bow[0] - 4;
      for (let i = 0; i < 70; i++) { const t = Math.pow(R(), .7), ang = (-105 + R() * 60) * Math.PI / 180, d = 10 + t * 44, x = fx0 + 6 + Math.cos(ang) * d * .8, y = SEA - 14 + Math.sin(ang) * d, r = .25 + R() * .8 * (1 - t * .5);
        const vx = Math.cos(ang), vy = Math.sin(ang);
        sea += R() < .3 ? `<path d="M${f(x)} ${f(y)}l${f(-vx * (1.5 + R() * 2.5))} ${f(-vy * (1.5 + R() * 2.5))}" stroke="#f4fff8" stroke-width="${f(r * .8)}" opacity="${f(.45 + R() * .4)}" stroke-linecap="round"/>`
          : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 1.4)}" fill="#f4fff8" opacity="${f(.45 + R() * .45)}"/>`; }
    }
    // light: the sun's veil, motes, the under-glass dark
    let lt = K.localGlow(u, { x: 66, y: 34, color: '#f4fff0', power: .3, radius: 60 }, { core: false }) + motes(20, 20, 60, 160, 60, '#effff4', 6);
    { const gl = nid('gl', u); lt += `<defs>${linGrad(gl, 0, 144, 0, 290, [[0, '#04140f', 0], [.4, '#04140f', .5], [1, '#020806', .85]])}</defs><rect x="-10" y="144" width="220" height="146" fill="url(#${gl})"/>`; }
    return [bg, mid + falls + fx + sea + lt];
  } };
