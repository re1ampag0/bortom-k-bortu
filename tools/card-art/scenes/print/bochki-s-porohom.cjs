// «Бочки с порохом» (Жемчужина, ПРИКАЗ, 2 Пороха: 4 урона по Корпусу любому вражескому кораблю, это не Залп), refined
// from the first-round scene (portrait-pearl.cjs SCENES['Бочки с порохом']): powder kegs in a wet net at the side of
// the Company ship. Night: the Company ship lies at anchor, sails furled; we are low at the water close under her bow,
// her side a tall dark wall against the moon. The net of five kegs (staves, iron hoops and their rivets) hangs from her
// rail on a line; a fuse hangs out of the lower left keg's bung, not lit; the lower right keg's bung is out and its
// powder trickles through the net into the sea. Her own closed lantern hangs from the rail beside the net — its warm
// light falls on the kegs; the moon is the cold key.
// Step 3 (user, 14.11): the card does not start a Fire (fx: dmg any hull 4) — the first-round flash, the musket's ball
// trail and smoke are gone; no fire anywhere, the lantern is closed (its flame only behind glass).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom } = PK;

const HZ = 114, WL = 132;                          // eye low over the water; the ship's waterline
const SHIP = { kind: 'endeavour', x: 290, y: WL, scale: 4.2, sails: 'furled', lights: true, reflect: true, detail: 'near', seed: 7 };
const SP = require('../kit/ship.cjs').SHIP_SPECS.endeavour;   // her lines (read only): the bands and the sheer carried into the head
const LIFT = 5;                                    // the net hangs this much clear of the water (its foot off the text glass)
const LAMP = { x: 141, y: 77, s: .78, hang: 9 };   // her own closed lantern, hung from the rail on a lanyard (the warm local)
const LAMPL = K.lantern.local(Object.assign({ color: '#ffc070', power: .95, radius: 62 }, LAMP));
const KEGS = [[103, 128, 4], [118, 128.5, 5], [133, 128, 6], [110.5, 106.5, 7], [125.5, 107, 8]].map(k => [k[0], k[1] - LIFT, k[2]]);   // x, base y, seed (lower row first)
const KS = .8;                                     // keg scale: 24 tall, 15 wide
const GATHER = [118, 76 - LIFT];                   // where the net is gathered on its line
const light = { time: 'night', haze: .35, key: { type: 'moon', x: 34, y: 30, el: 18, color: '#c8d8f6', power: .8 }, fill: { color: '#34486c', power: .4 },
  rim: { az: -30, color: '#bfe0ff', power: .55 }, locals: [LAMPL] };
const skel = { horizon: HZ, eye: 1.2, light: 'the moon upper left beyond her bow (cold key) + her closed lantern on the rail right of the net (warm local)', items: [
  ['ship', 60, WL, 140, 100, 'water: bow and fore part, broadside'], ['net + kegs', 93, 126, 50, 55, 'hangs from her rail on a line, clear of the water'],
  ['line', 118, 71, 6, 35, 'from the rail to the net'], ['lantern', 136, 77, 10, 32, 'hangs from her rail on a lanyard'],
  ['fuse', 80, 127, 24, 18, 'out of the lower left keg\'s bung, hanging out of the net (not lit)'], ['powder', 130, 132, 8, 22, 'trickling from the lower right keg\'s bung']] };

// the net over the kegs: a cord mesh hung from the gather point — meridians fanning down round the kegs, rings across
// them sagging under the weight; each cord dark with a wet light line on it (warm near the flash)
function net(u, L, G, kegs) {
  const x0 = Math.min(...kegs.map(k => k[0])) - 9.5, x1 = Math.max(...kegs.map(k => k[0])) + 9.5, yb = Math.max(...kegs.map(k => k[1])) + 1.5, G0 = G[0], G1 = G[1];
  // the bag: a short neck at the gather, full round the kegs, a rounded bottom sagging under them
  const env = `M${f(G0 - 2)} ${G1}C${f(x0 - 1)} ${f(G1 + 6)} ${f(x0 - 5)} ${f(yb - 12)} ${f(x0 + 3)} ${f(yb)}Q${G0} ${f(yb + 5)} ${f(x1 - 3)} ${f(yb)}C${f(x1 + 5)} ${f(yb - 12)} ${f(x1 + 1)} ${f(G1 + 6)} ${f(G0 + 2)} ${G1}Z`, cid = nid('nc', u);
  // the mesh: two families of cords crossing in diamonds, each sagging a little
  let d = ''; for (let c = -90; c <= 90; c += 5.6) for (const sg of [1, -1]) { const ax = G0 + c - sg * 50, ay = G1 - 6, bx = G0 + c + sg * 50, by = G1 + 94;
    d += `M${f(ax)} ${f(ay)}Q${f((ax + bx) / 2 - sg * 2)} ${f((ay + by) / 2 + 2)} ${f(bx)} ${f(by)}`; }
  // the cords from the gather to the bag's mouth
  let neck = ''; for (let i = 0; i < 6; i++) { const t = i / 5, bx = x0 + 2 + (x1 - x0 - 4) * t; neck += `M${G0} ${G1}Q${f(G0 + (bx - G0) * .7)} ${f(G1 + 4)} ${f(bx)} ${f(G1 + 14)}`; }
  return `<defs><clipPath id="${cid}"><path d="${env}"/></clipPath></defs><g clip-path="url(#${cid})"><path d="${d}" stroke="#1a140c" stroke-width=".75" fill="none" opacity=".7"/>`
    + `<path d="${d}" stroke="#e8d098" stroke-width=".3" fill="none" opacity=".55" transform="translate(-.25 -.25)"/>`
    + `<path d="${neck}" stroke="#1a140c" stroke-width=".8" fill="none" opacity=".75"/><path d="${neck}" stroke="#e8d098" stroke-width=".3" fill="none" opacity=".5"/></g>`;
}

// her head as part of her side: the kit draws the knee of the head as a dark separate shape in front of the painted wall
// (it read as a second ship). Inside the knee's own outline we carry on the wall: the same tarred planks, the ochre
// bands and their edge lines, the plank seams and the gilt deck moulding, all along her sheer to the fore edge; only a
// soft dark at the fore edge (the knee turns away) and the moon's rim on it. Colours are the wall's next to the stem.
function bowWall(u, L, beakD) {
  const s = SHIP.scale, hb = SP.len / 2, X2x = X => SHIP.x + s * X, H2y = H => SHIP.y - s * H;
  const Yh = (h, X) => h + SP.sheer[0] * (X / hb) * (X / hb) * Math.min(1.25, Math.max(0, h / SP.free));
  const pts = h => { const a = []; for (let X = -70; X <= -38; X += 1.5) a.push([X2x(X), H2y(Yh(h, X))]); return a; };
  const along = h => 'M' + pts(h).map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  const strip = (h0, h1) => along(h1) + 'L' + pts(h0).reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  const TAR = '#3d4152', OCH = '#4e4c46', DK = '#191820', cid = nid('bwc', u), fid = nid('bwf', u), fg = nid('bwg', u);
  // the mask: the whole knee, and past its back edge a band of her side that fades out, so the two meet without a seam
  // (the head rails, the cathead and the anchor are drawn after this, over it)
  const side = along(SP.free - .3) + 'L' + f(X2x(-40)) + ' ' + f(H2y(-1)) + 'L' + f(X2x(-70)) + ' ' + f(H2y(-1)) + 'Z';
  const fore = beakD.slice(0, beakD.indexOf('L'));            // the fore edge and the top of the knee (the spline before its straight back)
  let out = `<defs>${linGrad(fg, 67, 82, 81.7, 78.9, [[0, '#ffffff', 1], [1, '#ffffff', 0]])}<mask id="${cid}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="140"><path d="${beakD}" fill="#ffffff"/><path d="${side}" fill="url(#${fg})"/></mask><filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>`;
  const bands = SP.bands.map(b => { const id = nid('bwb', u), y0 = H2y(b.h1), y1 = H2y(b.h0); out += linGrad(id, 0, y0, 0, y1, [[0, mix(OCH, '#a89c7c', .08)], [.5, OCH], [1, mix(OCH, '#1c1810', .15)]]); return [b, id]; });
  out += `</defs><g mask="url(#${cid})"><rect x="10" y="10" width="110" height="125" fill="${TAR}"/>`;
  for (const [b, id] of bands) out += `<path d="${strip(b.h0, b.h1)}" fill="url(#${id})"/>`;
  let seams = ''; for (let h = 1.1; h < 26; h += 1.25) seams += along(h);
  out += `<path d="${seams}" stroke="${DK}" stroke-width=".3" fill="none" opacity=".4"/>`;
  for (const b of SP.bands) out += `<path d="${along(b.h0)}" stroke="#1c160e" stroke-width=".92" fill="none" opacity=".55"/><path d="${along(b.h1 - .14)}" stroke="#77715e" stroke-width=".76" fill="none" opacity=".6"/>`;
  // the deck moulding of her upper deck, gilt, carried round into the head
  out += `<path d="${along(SP.free - .1)}" stroke="${DK}" stroke-width="2.1" fill="none" opacity=".7"/><path d="${along(SP.free + .16)}" stroke="#a88a4c" stroke-width=".84" fill="none" opacity=".8"/>`;
  // the fore edge turns away from us: a soft dark along it, the moon's cold rim on the very edge
  out += `<path d="${fore}" stroke="#0c1018" stroke-width="7" fill="none" opacity=".5" filter="url(#${fid})"/><path d="${fore}" stroke="#bfe0ff" stroke-width="1.1" fill="none" opacity=".5"/></g>`;
  return out;
}

// the gun-port lids: hinged at the port's upper edge and swung up and out from the side — the red inner face seen from
// below, the lid's thick edge with the moon on it, two iron hinge knuckles on the hinge line, the lid's shadow on the
// planking beside it (the kit's lids stood over the ports like boxes on strings: they are taken out and drawn again)
function portLids(L, svg) {
  const re = /<path d="[^"]*Z" fill="[^"]*" opacity="\.35"\/><path d="M([\d.]+) ([\d.]+)L([\d.]+) [\d.]+L([\d.]+) ([\d.]+)L[\d.]+ [\d.]+Z" fill="url\(#[^)]+\)" stroke="[^"]*" stroke-width="0?\.59"\/><path d="[^"]*" fill="none" stroke="[^"]*" stroke-width="0?\.84" opacity="\.7"\/><path d="[^"]*" fill="none" stroke="[^"]*" stroke-width="0?\.42" opacity="\.7"\/>/g;
  const red0 = L.tone('paint-red', -.55), red1 = L.tone('paint-red', -.15), edge = L.tone('tar', .1), iron = '#15120f';
  return svg.replace(re, (m, xa, yh, xb, xt, yt) => {
    xa = +xa; yh = +yh; xb = +xb; const w = xb - xa, lean = (+xt - xb) * .5, up = Math.min(3.8, Math.max(2.8, (yh - +yt) * .85)), wd = w * .06;
    const A = [xa, yh], B = [xb, yh], C = [xb + wd + lean, yh - up], D = [xa - wd + lean, yh - up], P = q => f(q[0]) + ' ' + f(q[1]);
    const sh = [A, B, C, D].map(q => [q[0] + 1.6, q[1] + 1.3]);
    return `<path d="M${sh.map(P).join('L')}Z" fill="#0a0c14" opacity=".4"/>`
      + `<path d="M${P(A)}L${P(B)}L${P(C)}L${P(D)}Z" fill="${red0}"/><path d="M${P([xa + w * .12, yh - .6])}L${P([xb - w * .12, yh - .6])}L${P([C[0] - w * .14, C[1] + .7])}L${P([D[0] + w * .14, D[1] + .7])}Z" fill="${red1}" opacity=".55"/>`
      + `<path d="M${P(D)}L${P(C)}L${P([C[0] + .2, C[1] - .95])}L${P([D[0] - .2, D[1] - .95])}Z" fill="${edge}"/><path d="M${P([D[0] - .2, D[1] - .95])}L${P([C[0] + .2, C[1] - .95])}" stroke="#bfe0ff" stroke-width=".45" opacity=".6"/>`
      + `<path d="M${P(A)}L${P(B)}" stroke="${iron}" stroke-width=".7" opacity=".85"/>`
      + [.22, .78].map(t => { const x = xa + w * t; return `<rect x="${f(x - .9)}" y="${f(yh - .75)}" width="1.8" height="1.5" rx=".5" fill="${iron}"/><path d="M${f(x - .7)} ${f(yh - .55)}h1.4" stroke="#8a8a90" stroke-width=".25" opacity=".6"/>`; }).join('');
  });
}

// a keg brought up a little: lighter staves (the lantern on them), the iron hoops with a lit edge and their rivets
function kegHoops(x, y, rot) {
  const H = 30 * KS, r = 9.2 * KS, bulge = .17, rr = t => r * (1 + bulge * 4 * t * (1 - t)), k = .18;
  let out = `<path d="M${f(x - r)} ${f(y)}C${f(x - rr(.5) * 1.12)} ${f(y - H * .3)} ${f(x - rr(.5) * 1.12)} ${f(y - H * .7)} ${f(x - r)} ${f(y - H)}L${f(x + r)} ${f(y - H)}C${f(x + rr(.5) * 1.12)} ${f(y - H * .7)} ${f(x + rr(.5) * 1.12)} ${f(y - H * .3)} ${f(x + r)} ${f(y)}Z" fill="#f0cc90" opacity=".2"/>`;
  for (const t of [.05, .2, .8, .95]) { const q = rr(t), yh = y - H * t, sag = k * q;
    out += `<path d="M${f(x - q)} ${f(yh)}Q${f(x)} ${f(yh + sag * 2)} ${f(x + q)} ${f(yh)}" stroke="#241c16" stroke-width="1.15" fill="none"/>`
      + `<path d="M${f(x - q)} ${f(yh - .45)}Q${f(x)} ${f(yh - .45 + sag * 2)} ${f(x + q)} ${f(yh - .45)}" stroke="#e8d2a4" stroke-width=".32" fill="none" opacity=".75"/>`;
    for (const v of [-.62, 0, .62]) { const px = x + v * q, py = yh + sag * (1 - v * v); out += `<circle cx="${f(px)}" cy="${f(py)}" r=".34" fill="#f2e2bc" stroke="#1a120c" stroke-width=".12" opacity=".9"/>`; } }
  return `<g transform="rotate(${rot} ${x} ${y})">${out}</g>`;
}

module.exports = { name: 'Бочки с порохом', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.2 });
    let bg = K.sky(u, L, { horizon: HZ, stars: 70, seed: 8 }) + K.sunMoon(u, L, { r: 6.4 })
      + K.cloud(u, L, { x: 40, y: 64, w: 52, h: 7, seed: 13, far: .35 }) + K.cloud(u, L, { x: 6, y: 92, w: 40, h: 5, seed: 4, far: .6 }) + K.cloud(u, L, { x: 150, y: 14, w: 60, h: 8, seed: 21, far: .2 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .35, seed: 6, glitter: 34 });
    // the Company ship at anchor: her bow and fore part close over us, sails furled. Her head is painted on as part of
    // her side (laid in right over the kit's knee, under the head rails and the anchor), the port lids drawn again
    { let sh = portLids(L, K.ship(u, L, SHIP));
      const kn = /<path d="([^"]+)" fill="url\(#[^)]+\)"\/><path d="\1" fill="url\(#[^)]+\)"\/><path d="[^"]*" fill="none" stroke="[^"]*" stroke-width="[^"]*" opacity="\.4"\/>/g;
      let m, last = null; while ((m = kn.exec(sh))) last = { end: kn.lastIndex, d: m[1] };
      if (last) sh = sh.slice(0, last.end) + bowWall(u, L, last.d) + sh.slice(last.end);
      bg += sh; }
    // the lantern's warm pool on her planking round it and over the kegs
    bg += glow(u, LAMPL.x - 8, LAMPL.y + 10, 46, 40, '#ffa848', .34) + K.localGlow(u, { x: LAMPL.x - 14, y: WL + 6, color: '#ffb050', power: .4, radius: 40 }, { squash: .22, core: false });
    let fg = '';
    // the net's line from her rail down to the gather; a cleat on the rail
    { const top = [GATHER[0] + 4, 36]; fg += `<path d="M${top[0]} ${top[1]}Q${top[0] + 1.6} ${(top[1] + GATHER[1]) / 2} ${GATHER[0]} ${GATHER[1]}" stroke="#16100a" stroke-width="1.6" fill="none"/>`
        + `<path d="M${top[0] - .5} ${top[1]}Q${top[0] + 1.1} ${(top[1] + GATHER[1]) / 2} ${GATHER[0] - .5} ${GATHER[1]}" stroke="#c8b48a" stroke-width=".4" fill="none" opacity=".6" stroke-dasharray="1 .8"/>`
        + K.shadeCyl(u, top[0] - 4, top[1] + 1, top[0] + 4, top[1] + 1, 1.1, L, 'oak', { outline: .3, cap: 'round', grain: false }); }
    // the lantern: an iron hook driven into her rail, a short lanyard, the closed lantern hanging plumb
    { const top = LAMP.y - (29 + LAMP.hang) * LAMP.s;
      fg += `<path d="M${f(LAMP.x - 1.6)} ${f(top - 2.4)}h3.2v1.2h-1v1.6q0 1.4 -1.4 1.4" stroke="#14100c" stroke-width=".8" fill="none" stroke-linecap="round"/>`
        + K.lantern(u, L, Object.assign({ seed: 3, glow: true }, LAMP)); }
    // the kegs in the net against her side (the lower row hangs a little clear of the water; the upper row stands on it)
    // the mark stencilled on each keg: the broad arrow of the Crown's stores, in black paint
    const brand = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y}) translate(${x} ${f(y - 30 * KS * .5)}) scale(${f(KS * 1.25)})" opacity=".8"><path d="M0 -3.4V3.2M0 -3.4L-2.6 .2M0 -3.4L2.6 .2" stroke="#1a120a" stroke-width="1" fill="none" stroke-linecap="round"/></g>`;
    const kr = sd => sd % 2 ? 3 : -3, ku = sd => sd % 2 ? -4 : 5;
    { const cid = nid('kw', u); let kg = '';
      for (const [x, y, sd] of KEGS.slice(0, 3)) kg += K.barrel(u, L, { x, y, s: KS, kind: 'water', seed: sd, rot: kr(sd), contact: false }) + kegHoops(x, y, kr(sd)) + brand(x, y, kr(sd));
      for (const [x, y, sd] of KEGS.slice(3)) kg += K.barrel(u, L, { x, y, s: KS, kind: 'water', seed: sd, rot: ku(sd), contact: false }) + kegHoops(x, y, ku(sd)) + brand(x, y, ku(sd));
      // the bung holes: the left keg's with the fuse in it, the right keg's open (its bung dangles on a cord)
      for (const [x, y] of [[KEGS[0][0] - 4.2, KEGS[0][1] - 13.4], [KEGS[2][0] + 3.6, KEGS[2][1] - 13]]) kg += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.25" ry="1" fill="#120c08" stroke="#6a4a2a" stroke-width=".3"/>`;
      fg += `<defs><clipPath id="${cid}"><rect x="0" y="0" width="200" height="${WL + 1.2}"/></clipPath></defs><g clip-path="url(#${cid})">${kg}${net(u, L, GATHER, KEGS)}</g>`;
      // the gather: the net's mouth bound to the line with a seizing
      fg += `<ellipse cx="${GATHER[0]}" cy="${GATHER[1] + 1}" rx="2.6" ry="1.8" fill="#2a2016" stroke="#0e0a06" stroke-width=".4"/><path d="M${GATHER[0] - 2} ${GATHER[1] + .4}h4M${GATHER[0] - 2.2} ${GATHER[1] + 1.6}h4.4" stroke="#c8b48a" stroke-width=".3" opacity=".6"/>`;
      // the water under the kegs: warm ripples from the lantern
      fg += `<path d="M98 ${WL + 3.5}q23 3 46 0" stroke="#ffc880" stroke-width=".5" fill="none" opacity=".45"/><path d="M92 ${WL + 7}q30 4 58 0" stroke="#ffc880" stroke-width=".4" fill="none" opacity=".25"/>`; }
    // the fuse: a tarred cord out of the lower left keg's bung, out through the mesh, hanging in a loop, its frayed end
    // turned up — not lit
    { const b0 = [KEGS[0][0] - 4.2, KEGS[0][1] - 13.4], pts = [b0, [b0[0] - 3, b0[1] + 2.6], [b0[0] - 7, b0[1] + 10], [b0[0] - 11, b0[1] + 14.6], [b0[0] - 15.6, b0[1] + 13], [b0[0] - 17.4, b0[1] + 9.4]];
      fg += K.rope(u, L, pts, { r: .55, seed: 6, cap: 'round' });
      const e = pts[pts.length - 1]; for (const [dx, dy] of [[-.9, -1.4], [-.2, -1.7], [.6, -1.4]]) fg += `<path d="M${f(e[0])} ${f(e[1])}l${dx} ${dy}" stroke="#7a6448" stroke-width=".25" stroke-linecap="round"/>`; }
    // the spilt powder: the right keg's bung hangs on its cord; out of the hole the black grains trickle through the net,
    // down her side into the sea — a few grains catching the lantern, a dark scum spreading on the water under it
    { const h = [KEGS[2][0] + 3.6, KEGS[2][1] - 13], R = rng(23);
      fg += `<path d="M${f(h[0] + .9)} ${f(h[1] + .4)}q1.6 2 1.2 4.2" stroke="#3a2a1a" stroke-width=".3" fill="none"/><rect x="${f(h[0] + 1.2)}" y="${f(h[1] + 4.4)}" width="1.6" height="2.2" rx=".5" fill="#6a4a2a" stroke="#1a120a" stroke-width=".25" transform="rotate(14 ${f(h[0] + 2)} ${f(h[1] + 5.5)})"/>`;
      fg += `<path d="M${f(h[0] + .2)} ${f(h[1] + .6)}C${f(h[0] + 1.6)} ${f(h[1] + 2)} ${f(h[0] + 1.8)} ${f(h[1] + 5)} ${f(h[0] + 1.6)} ${f(WL + 3)}" stroke="#0e0a08" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 46; i++) { const t = R(), y = h[1] + 1 + t * (WL + 2 - h[1]), sp = .3 + t * 1.6, x = h[0] + 1.4 + (R() - .5) * sp * 2;
        fg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.16 + R() * .16)}" fill="${R() > .7 ? '#8a8072' : '#0e0a08'}"/>`; }
      fg += `<ellipse cx="${f(h[0] + 2)}" cy="${f(WL + 3.2)}" rx="7" ry="1.1" fill="#0a0806" opacity=".5"/>`; }
    // the lantern's streak on the water under her side
    fg += Array.from({ length: 7 }, (_, i) => { const y = WL + 4 + i * 4.2, w = 4 + i * 2.6; return `<path d="M${f(LAMPL.x - w / 2 + (i % 2) * 2)} ${f(y)}h${f(w)}" stroke="#ffd890" stroke-width="${f(.45 + i * .07)}" stroke-linecap="round" opacity="${f(.5 - i * .05)}"/>`; }).join('');
    // air: the near water falls dark under the glass, the top corners darken a little
    fg += gloom(u, 100, 150, 100, 280, .5, '#04080e') + gloom(u, 110, 60, 200, 0, .25, '#04080e');
    return [bg, fg];
  } };
