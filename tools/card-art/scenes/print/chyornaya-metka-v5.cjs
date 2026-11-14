// «Чёрная метка» (Летучий голландец, ПРИКАЗ: выбранный вражеский корабль до конца хода получает +2 урона от каждого
// Залпа по нему), variant v5. The user: a scrap of paper with a black spot and a torn edge (not a palm with a spot); if
// a hand holds it, a natural hand. The shot (no hand): night on the doomed ship's deck, the mainmast close on the left;
// someone from the sea has been here — a scrap torn from a printed page, folded in four, is pinned to the mast by a
// rusty dagger grown over with barnacles, a strand of weed on its guard, sea water still running down the wood. On the
// scrap — the black spot, a soot-black blot smudged by a thumb. Over the rail on the right, in the luminous green fog,
// the Flying Dutchman's dark shape with her green lanterns: Jones has chosen.
// Light: the moon behind us, high on the right (key, cold) — it lights the paper (the brightest thing, the focus), the
// right side of the mast, the dagger's rust; the fog on the horizon glows behind the Dutchman (her silhouette).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng } = K;
const { glow, gloom, motes } = PK;

const HZ = 100, RAIL = 112, DK = 128;              // the sea horizon; the rail's cap; the deck at the bulwark's foot
const MX = 34, MR = 52;                            // the mast: its axis x, radius (it fills the left of the shot)
const PAP = { th: 22, top: 54, w: 50, h: 62 };     // the paper on the mast: centre angle (deg), top, width (along the surface), height
const light = { time: 'fog', haze: .7, key: { type: 'moon', az: 140, el: 38, color: '#d8f4e8', power: .75 }, fill: { color: '#2a5248', power: .5 },
  rim: { az: 30, color: '#c8ffe8', power: .4 }, locals: [{ x: 150, y: 92, color: '#9effc8', power: .3, radius: 30 }] };
const skel = { horizon: HZ, eye: 1.6, light: 'the moon behind us high right (key, cold); the green fog glowing on the horizon behind the Dutchman', items: [
  ['Dutchman', 108, HZ + 2, 84, 62, 'sea, in the fog over the rail'], ['rail', 60, DK, 146, DK - RAIL, 'his ship\'s bulwark'],
  ['mast', MX - MR, 290, MR * 2, 300, 'deck (out of the shot below)'], ['paper', 16, 106, 50, 56, 'pinned to the mast'],
  ['dagger', 36, 60, 26, 26, 'stuck in the mast through the paper'], ['shrouds', 92, RAIL, 80, 120, 'from the masthead to the channel']] };

// a point on the mast's surface: angle th (deg; 0 — facing us, + to the right), height y → picture x, y; and how much it faces the moon
const onMast = (th, y) => [MX + MR * Math.sin(th * Math.PI / 180), y];
const P2 = p => `${f(p[0])} ${f(p[1])}`;
// a point of the paper: s across (−w/2..w/2, along the mast's surface), t down from the top
const Pp = (s, t) => onMast(PAP.th + s / MR * 180 / Math.PI, PAP.top + t);

module.exports = { name: 'Чёрная метка', variant: 'v5', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 1.6 });
    // ——— the night in the green fog: dark above, the fog glowing low over the sea ———
    let bg = K.sky(u, L, { horizon: HZ, stars: 10, seed: 6 });
    { const g = nid('fg', u); bg += `<defs>${linGrad(g, 0, 30, 0, HZ + 2, [[0, '#9ad8c0', 0], [.6, '#9ad8c0', .25], [1, '#c8f4e0', .55]])}</defs><rect x="-5" y="30" width="210" height="${HZ - 28}" fill="url(#${g})"/>`; }
    for (const [x, y, w, h, sd, fr] of [[150, 24, 70, 8, 5, .4], [110, 52, 60, 6, 11, .6]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: RAIL + 4, swell: .3, seed: 4, glitter: false });
    bg += glow(u, 150, HZ - 6, 70, 26, '#d8fff0', .4);
    // the Dutchman: come up out of the fog, bow toward the mast, her lanterns green
    bg += K.ship(u, L, { kind: 'dutch', x: 150, y: HZ + 2, scale: .66, sails: 'full', detail: 'mid', lights: true, seed: 4 });
    bg += K.fog(u, L, { y: HZ - 16, h: 26, density: .6, seed: 7 }) + glow(u, 150, 90, 40, 18, '#9effc8', .16);
    // shrouds of his own ship: from the masthead (out of the shot) down to the channel at the rail, dark against the fog
    { const sh = [[78, -5, 118, RAIL + 2], [86, -5, 150, RAIL + 2], [92, -5, 182, RAIL + 2]];
      for (const [x1, y1, x2, y2] of sh) bg += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#0a1412" stroke-width="1.1"/><path d="M${x1 + .5} ${y1}L${x2 + .5} ${y2}" stroke="#7ab8a4" stroke-width=".3" opacity=".4"/>`;
      // ratlines between them
      for (let i = 1; i < 12; i++) { const t = i / 12 * .92 + .06, a = [78 + 40 * t, -5 + (RAIL + 7) * t], c = [92 + 90 * t, -5 + (RAIL + 7) * t];
        bg += `<path d="M${P2(a)}Q${f((a[0] + c[0]) / 2)} ${f(a[1] + 1.4)} ${P2(c)}" stroke="#0e1a18" stroke-width=".45" fill="none" opacity=".55"/>`; } }
    // the rail of his ship: wet oak, the moon on the cap; the deck below in the dark (under the glass)
    bg += K.bulwark(u, L, { x1: 40, x2: 206, y: DK, h: DK - RAIL, kind: 'oak', posts: 22, seed: 3 })
      + `<rect x="40" y="${RAIL - 3}" width="166" height="${DK - RAIL + 4}" fill="#123028" opacity=".6" style="mix-blend-mode:multiply"/><path d="M40 ${RAIL + .4}h166" stroke="#e0fff0" stroke-width=".5" opacity=".45"/>`;
    bg += K.deck(u, L, { horizon: HZ, top: DK, bottom: 290, vx: 120, kind: 'pine-deck', plank: 13, seed: 5, wet: true })
      + `<rect x="0" y="${DK}" width="200" height="${290 - DK}" fill="#0e2420" opacity=".5" style="mix-blend-mode:multiply"/>`;
    bg += K.fog(u, L, { y: RAIL - 10, h: 22, density: .3, seed: 9 });

    // ——— the mast: a great round spar of oak close on the left, iron hoops on it; the moon on its right side ———
    let fg = K.shadeCyl(u, MX, -10, MX, 300, MR, L, 'oak', { outline: .6, seed: 12, ell: 0 });
    // the old paint and tar on it darkened toward the left; a wet streak where the sea water ran down from the dagger
    { const g = nid('md', u); fg += `<defs>${linGrad(g, MX - MR, 0, MX + MR, 0, [[0, '#020504', .92], [.3, '#060c0a', .7], [.62, '#0a1210', .4], [.8, '#0a1210', .3], [.93, '#0a1210', .45], [1, '#020504', .8]])}</defs><rect x="${MX - MR}" y="-10" width="${MR * 2}" height="310" fill="url(#${g})"/>`;
      const h1 = onMast(52, 0)[0], h2 = onMast(66, 0)[0], hg = nid('mh', u), R = rng(8);
      fg += `<defs>${linGrad(hg, h1 - 6, 0, h2 + 4, 0, [[0, '#c8f0e0', 0], [.5, '#c8f0e0', .16], [1, '#c8f0e0', 0]])}</defs><rect x="${f(h1 - 6)}" y="-10" width="${f(h2 - h1 + 10)}" height="310" fill="url(#${hg})"/>`
        + `<path d="M${f(MX + MR - .6)} -10V300" stroke="#b8f0dc" stroke-width=".7" opacity=".55"/>`;
      // the grain running up the spar, closer together toward the edges (it turns away)
      for (let i = 0; i < 26; i++) { const th = -80 + R() * 160, x = onMast(th, 0)[0], y0 = R() * 250 - 10, l = 20 + R() * 60; fg += `<path d="M${f(x)} ${f(y0)}q${f((R() - .5) * 1.6)} ${f(l / 2)} 0 ${f(l)}" stroke="${R() > .3 ? '#040806' : '#9ab8a8'}" stroke-width="${f(.3 + R() * .4)}" fill="none" opacity="${f(.2 + R() * .25)}"/>`; } }
    // the hoops: above the eye we see their underside (the front bows up), below it the top (it bows down)
    for (const [y, h] of [[18, 5], [140, 5]]) { const bow = (y - HZ) * .05, a = onMast(-89, y), b = onMast(89, y), m = [MX, y + bow * 4], g = nid('hp', u);
      fg += `<defs>${linGrad(g, MX - MR, 0, MX + MR, 0, [[0, '#0a0c0c', 1], [.5, '#2a3230', 1], [.78, '#6a7a76', 1], [.9, '#b8ccc4', 1], [1, '#3a4442', 1]])}</defs>`
        + `<path d="M${f(a[0] - 1)} ${f(a[1] - h / 2)}Q${f(m[0])} ${f(m[1] - h / 2 + bow * 4)} ${f(b[0] + 1)} ${f(b[1] - h / 2)}L${f(b[0] + 1)} ${f(b[1] + h / 2)}Q${f(m[0])} ${f(m[1] + h / 2 + bow * 4)} ${f(a[0] - 1)} ${f(a[1] + h / 2)}Z" fill="url(#${g})" stroke="#020404" stroke-width=".5"/>`;
      for (const th of [-60, -30, 0, 30, 60]) { const p = onMast(th, y); fg += `<circle cx="${f(p[0])}" cy="${f(p[1] + bow * 4 * Math.cos(th * Math.PI / 180) ** 2)}" r=".9" fill="#1a1e1e"/><circle cx="${f(p[0] - .3)}" cy="${f(p[1] - .3 + bow * 4 * Math.cos(th * Math.PI / 180) ** 2)}" r=".35" fill="#c8dcd4" opacity=".6"/>`; } }
    // the wet run below the dagger: darker wood with a few bright drops on it, down past the paper
    { const R = rng(41), p0 = Pp(10, 6); let d = `M${P2(p0)}`; for (let i = 1; i <= 8; i++) { const p = Pp(14 + Math.sin(i) * 2.4, 6 + i * 17); d += `L${P2(p)}`; }
      fg += `<path d="${d}" stroke="#040806" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#a8e8d0" stroke-width=".4" fill="none" opacity=".35" transform="translate(1.6 0)"/>`;
      for (let i = 0; i < 6; i++) { const p = Pp(13 + R() * 3, 60 + R() * 70); fg += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx=".7" ry="1.1" fill="#d8fff0" opacity=".7"/>`; } }

    // ——— the paper: a scrap torn from a printed page, folded in four and opened, pinned at its top ———
    { const R = rng(17), hw = PAP.w / 2, H = PAP.h;
      // its outline: the left edge cut (nearly straight), the top a little ragged, the right edge and the bottom torn
      const out = [];
      for (let i = 0; i <= 10; i++) out.push([-hw + i / 10 * PAP.w, (R() - .5) * .9 + (i === 6 ? -1.4 : 0)]);
      for (let i = 1; i <= 12; i++) out.push([hw - 1 + (R() - .3) * 2.6 - (i % 4 === 2 ? 3 : 0), i / 12 * H * .82]);
      // the bottom right corner curls away from the mast (drawn separately); the bottom edge torn in bites
      for (let i = 0; i <= 12; i++) out.push([hw - 8 - i / 12 * (PAP.w - 8), H - (R() * 2.2) - (i % 5 === 1 ? 2.6 : 0) - (i < 2 ? 3 : 0)]);
      for (let i = 1; i < 8; i++) out.push([-hw + (R() - .5) * .5, H - i / 8 * H]);
      const pts = out.map(([s, t]) => Pp(s, t));
      // its shadow on the mast (the moon is high and to the right: down and to the left)
      const sb = nid('ps', u), pg = nid('pg', u), cl = nid('pc', u), pb = nid('pb', u);
      fg += `<defs><filter id="${sb}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="${pb}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".5"/></filter></defs>`
        + `<path d="M${pts.map(P2).join('L')}Z" fill="#020604" opacity=".6" filter="url(#${sb})" transform="translate(-2.6 3)"/>`;
      // the paper itself: old rag paper, lit from the right (the mast turns it a little toward the moon), cooler to the left
      const a = Pp(-hw, 0), b = Pp(hw, 0);
      fg += `<defs>${linGrad(pg, a[0], 0, b[0], 0, [[0, '#9a9a88', 1], [.35, '#d8d2ba', 1], [.75, '#f2ecd6', 1], [1, '#e2dcc2', 1]])}<clipPath id="${cl}"><path d="M${pts.map(P2).join('L')}Z"/></clipPath></defs>`
        + `<path d="M${pts.map(P2).join('L')}Z" fill="url(#${pg})" stroke="#3a3628" stroke-width=".45" stroke-linejoin="round"/><g clip-path="url(#${cl})">`;
      // the print of the page it was torn from: rows of small grey words, a ruled margin, a big initial at the top left
      { let tx = ''; for (let t = 7; t < H - 2; t += 3.1) { let s = -hw + 4; while (s < hw - 2) { const l = 1.4 + R() * 4.6, p = Pp(s, t), q = Pp(Math.min(s + l, hw - 1), t); tx += `<path d="M${P2(p)}L${P2(q)}" stroke="#4a463a" stroke-width=".85" opacity="${f(.22 + R() * .14)}"/>`; s += l + 1.1; } }
        tx += `<path d="M${P2(Pp(-hw + 2.6, 2))}L${P2(Pp(-hw + 2.6, H))}" stroke="#7a2a1a" stroke-width=".35" opacity=".35"/>`;
        fg += tx + `<path d="M${P2(Pp(-hw + 4, 2.5))}h4v4.6h-4z" fill="#6a2a1a" opacity=".4"/>`; }
      // the folds: one down the middle, one across — a pale ridge and a shaded valley; damp blotches; foxing spots
      fg += `<path d="M${P2(Pp(0, 0))}L${P2(Pp(.4, H))}" stroke="#7a7460" stroke-width=".8" opacity=".55"/><path d="M${P2(Pp(.9, 0))}L${P2(Pp(1.3, H))}" stroke="#ffffff" stroke-width=".5" opacity=".45"/>`
        + `<path d="M${P2(Pp(-hw, H * .48))}L${P2(Pp(hw, H * .5))}" stroke="#7a7460" stroke-width=".8" opacity=".5"/><path d="M${P2(Pp(-hw, H * .48 + .8))}L${P2(Pp(hw, H * .5 + .8))}" stroke="#ffffff" stroke-width=".45" opacity=".4"/>`;
      for (const [s, t, r] of [[-14, 46, 7], [16, 8, 5], [12, 40, 6]]) { const p = Pp(s, t); fg += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${r}" ry="${f(r * .8)}" fill="#8a7a50" opacity=".14" filter="url(#${sb})"/>`; }
      for (let i = 0; i < 12; i++) { const p = Pp(-hw + R() * PAP.w, R() * H); fg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(.3 + R() * .5)}" fill="#8a5a2a" opacity=".3"/>`; }
      // ——— the black spot: soot and tar pressed on with a thumb — a dense round blot, its rim soaked into the
      // paper, a smear dragged off to the lower right where the thumb lifted, a few spatters ———
      { const c = Pp(-1, H * .5), Rr = rng(5), blob = [];
        for (let i = 0; i < 20; i++) { const a2 = i / 20 * Math.PI * 2, r = 10.5 * (1 + (Rr() - .5) * .22 + Math.sin(a2 * 3) * .04); blob.push([c[0] + Math.cos(a2) * r * .92, c[1] + Math.sin(a2) * r]); }
        const sp = d => { const n = d.length; let o = `M${P2(d[0])}`; for (let i = 0; i < n; i++) { const p0 = d[(i - 1 + n) % n], p1 = d[i], p2 = d[(i + 1) % n], p3 = d[(i + 2) % n];
          o += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${P2(p2)}`; } return o + 'Z'; };
        const bl1 = nid('sk', u);
        fg += `<defs><filter id="${bl1}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>`
          // the halo where the soot soaked into the paper
          + `<path d="${sp(blob)}" fill="#3a3428" opacity=".45" filter="url(#${bl1})" transform="translate(${f(c[0] * -.18)} ${f(c[1] * -.18)}) scale(1.18)"/>`
          // the smear: dragged out to the lower right, thinning
          + `<path d="M${f(c[0] + 4)} ${f(c[1] + 5)}Q${f(c[0] + 12)} ${f(c[1] + 10)} ${f(c[0] + 17)} ${f(c[1] + 17)}" stroke="#1a1814" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round" filter="url(#${pb})"/>`
          + `<path d="M${f(c[0] + 5)} ${f(c[1] + 6)}Q${f(c[0] + 12)} ${f(c[1] + 11)} ${f(c[0] + 15)} ${f(c[1] + 15)}" stroke="#0a0806" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round" filter="url(#${pb})"/>`
          + `<path d="${sp(blob)}" fill="#050403" filter="url(#${pb})"/>`
          // the thumb's whorl pressed into the soot: faint arcs, a little glossier (the tar)
          + Array.from({ length: 5 }, (_, i) => { const r = 2 + i * 1.5; return `<path d="M${f(c[0] - r)} ${f(c[1] + r * .2)}Q${f(c[0])} ${f(c[1] - r * 1.15)} ${f(c[0] + r)} ${f(c[1] + r * .1)}" stroke="#3a3a40" stroke-width=".4" fill="none" opacity=".45"/>`; }).join('')
          + `<path d="M${f(c[0] + 2)} ${f(c[1] - 7.4)}Q${f(c[0] + 6.6)} ${f(c[1] - 6)} ${f(c[0] + 8)} ${f(c[1] - 1.6)}" stroke="#8a9a98" stroke-width=".7" fill="none" opacity=".45" stroke-linecap="round"/>`;
        for (let i = 0; i < 9; i++) { const a2 = Rr() * Math.PI * 2, d = 12 + Rr() * 8, r = .4 + Rr() * 1; fg += `<circle cx="${f(c[0] + Math.cos(a2) * d)}" cy="${f(c[1] + Math.sin(a2) * d)}" r="${f(r)}" fill="#0a0806" opacity=".85"/>`; } }
      // the moon on the paper's right side, the cool fog on its left
      fg += `<rect x="0" y="0" width="200" height="200" fill="#ffffff" opacity="0"/></g>`;
      // the torn fibres along the torn edges: a thin pale fuzz
      { let d = ''; for (let i = 11; i < out.length - 7; i++) { const p = Pp(...out[i]); d += `M${P2(p)}l${f((R() - .5) * 1.4)} ${f((R() - .2) * 1.4)}`; }
        fg += `<path d="${d}" stroke="#f4f0e0" stroke-width=".35" opacity=".7"/>`; }
      // the bottom right corner folded over (a dog-ear): the triangle past the fold line turned onto the front, its back
      // side up (greyer, the print showing through backwards), a soft shadow under it on the paper
      { const A = [hw - 8, H - 1.6], Bq = [hw - 1, H * .82], Cn = [hw, H], dx = Bq[0] - A[0], dy = Bq[1] - A[1], l2 = dx * dx + dy * dy,
          k = ((Cn[0] - A[0]) * dx + (Cn[1] - A[1]) * dy) / l2, foot = [A[0] + dx * k, A[1] + dy * k], tipS = [2 * foot[0] - Cn[0], 2 * foot[1] - Cn[1]];
        const a0 = Pp(...A), b0 = Pp(...Bq), tp = Pp(...tipS), g = nid('pk', u);
        fg += `<path d="M${P2(a0)}L${P2(b0)}L${P2(tp)}Z" fill="#1a1810" opacity=".35" filter="url(#${sb})" transform="translate(-1.2 1.6)"/>`
          + `<defs>${linGrad(g, a0[0], a0[1], tp[0], tp[1], [[0, '#b8b29a', 1], [1, '#d8d2b8', 1]])}</defs><path d="M${P2(a0)}L${P2(b0)}L${P2(tp)}Z" fill="url(#${g})" stroke="#3a3628" stroke-width=".4" stroke-linejoin="round"/>`
          + `<path d="M${P2(a0)}L${P2(b0)}" stroke="#ffffff" stroke-width=".5" opacity=".6"/>`
          + [.3, .55].map(t => { const p = [a0[0] + (tp[0] - a0[0]) * t + (b0[0] - a0[0]) * .2, a0[1] + (tp[1] - a0[1]) * t + (b0[1] - a0[1]) * .2]; return `<path d="M${P2(p)}l3 -1.6" stroke="#6a6450" stroke-width=".6" opacity=".25"/>`; }).join(''); }
      // ——— the dagger: through the top of the paper into the mast, its grip out toward us and up to the right;
      // rusty, the guard crusted with barnacles, a strand of weed hanging off it, dripping ———
      { const e = Pp(3, 5), dir = [.94, -.34], n = [-dir[1], dir[0]], at = (l, w = 0) => [e[0] + dir[0] * l + n[0] * w, e[1] + dir[1] * l + n[1] * w];
        const g = nid('dg', u), gg = nid('dh', u);
        // its shadow on the paper and the mast (down-left)
        fg += `<path d="M${P2(at(0, -1.2))}L${P2(at(24, -1.6))}L${P2(at(24, 1.6))}L${P2(at(0, 1.2))}Z" fill="#020604" opacity=".45" filter="url(#${sb})" transform="translate(-4 6)"/>`;
        // the slit in the paper where the blade went in, the wood split a little round it
        fg += `<path d="M${P2(at(0, -2.8))}L${P2(at(0, 2.8))}" stroke="#0a0806" stroke-width="1.6" stroke-linecap="round"/><path d="M${P2(at(-.6, -3.4))}l-1.4 -1.8M${P2(at(-.6, 3.4))}l-1 2" stroke="#3a3628" stroke-width=".4" opacity=".6"/>`;
        // the blade's root out of the paper (short — the rest is in the wood), then the guard across it
        fg += `<defs>${linGrad(g, ...at(0, -2.4), ...at(0, 2.4), [[0, '#c8d4cc', 1], [.4, '#7a8680', 1], [1, '#2a302c', 1]])}${linGrad(gg, ...at(8, -2.4), ...at(8, 2.4), [[0, '#8a6a4a', 1], [.4, '#5a3a22', 1], [1, '#22140a', 1]])}</defs>`
          + `<path d="M${P2(at(0, -2.2))}L${P2(at(4.6, -2.4))}L${P2(at(4.6, 2.4))}L${P2(at(0, 2.2))}Z" fill="url(#${g})" stroke="#0a0c0a" stroke-width=".35"/>`
          + `<path d="M${P2(at(.4, -1.6))}L${P2(at(4.4, -1.8))}" stroke="#eef8f2" stroke-width=".4" opacity=".7"/>`
          + `<path d="M${P2(at(1.8, .2))}l.8 .5M${P2(at(3, -.8))}l.6 .3" stroke="#8a4a1a" stroke-width=".6" opacity=".7"/>`;
        // the guard: a short iron bar with knobbed ends, rusted
        { const a = at(5.4, -6.4), b = at(5.4, 6.4); fg += K.shadeCyl(u, a[0], a[1], b[0], b[1], 1.3, L, 'iron', { outline: .3, cap: 'round' })
            + `<path d="M${P2(at(5.4, -5))}L${P2(at(5.4, 4))}" stroke="#8a4a1a" stroke-width="1" opacity=".45" stroke-dasharray="1.4 1"/>`
            + K.shadeSphere(u, ...at(5.4, -7), 1.7, L, 'iron', { outline: .3 }) + K.shadeSphere(u, ...at(5.4, 7), 1.7, L, 'iron', { outline: .3 }); }
        // the grip: wound with rotten cord, a ring pommel
        fg += `<path d="M${P2(at(6.4, -2))}L${P2(at(19, -1.7))}L${P2(at(19, 1.7))}L${P2(at(6.4, 2))}Z" fill="url(#${gg})" stroke="#0a0604" stroke-width=".35"/>`;
        for (let l = 7.4; l < 19; l += 1.5) fg += `<path d="M${P2(at(l, -1.9))}L${P2(at(l + .9, 1.9))}" stroke="#1a0e06" stroke-width=".45" opacity=".8"/><path d="M${P2(at(l + .2, -1.9))}L${P2(at(l + .5, -.6))}" stroke="#c8a888" stroke-width=".3" opacity=".6"/>`;
        { const p = at(21.4, 0); fg += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="2.8" ry="2.4" fill="none" stroke="#3a3e3a" stroke-width="1.5"/><path d="M${f(p[0] - 1)} ${f(p[1] - 2.3)}A2.8 2.4 0 0 1 ${f(p[0] + 2.8)} ${f(p[1])}" stroke="#c8dcd4" stroke-width=".5" fill="none" opacity=".75"/>`; }
        // barnacles on the guard and a little up the grip
        { const Rb = rng(23); for (let i = 0; i < 7; i++) { const p = at(5 + Rb() * 4, -6 + Rb() * 12), r = .7 + Rb() * .7;
          fg += `<path d="M${f(p[0] - r)} ${f(p[1] + r * .5)}L${f(p[0] - r * .45)} ${f(p[1] - r * .7)}H${f(p[0] + r * .45)}L${f(p[0] + r)} ${f(p[1] + r * .5)}Z" fill="#a8b0a0" stroke="#2a2e26" stroke-width=".2"/><ellipse cx="${f(p[0])}" cy="${f(p[1] - r * .7)}" rx="${f(r * .4)}" ry="${f(r * .16)}" fill="#141812"/>`; } }
        // the weed hanging off the guard's lower end, a drop at its tip
        { const p = at(5.4, 7.6); fg += `<path d="M${P2(p)}q-1.6 6 .4 11t-1 10" stroke="#1e4a36" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M${f(p[0] + .8)} ${f(p[1])}q1 5 -.6 9" stroke="#2e6a4a" stroke-width=".9" fill="none" stroke-linecap="round"/>`
          + `<path d="M${f(p[0] - .4)} ${f(p[1] + 1)}q-1.4 6 .4 10.6" stroke="#8ad8b0" stroke-width=".3" fill="none" opacity=".5"/><ellipse cx="${f(p[0] - .8)}" cy="${f(p[1] + 23)}" rx=".8" ry="1.2" fill="#d8fff0" opacity=".8"/>`; } } }

    // ——— the air: the cold veil, a few motes; dark under the glass and in the left corner ———
    fg += motes(18, 70, 20, 130, 90, '#dffff0', 4) + glow(u, 60, 70, 60, 60, '#e8fff4', .08);
    { const gl = nid('gl', u); fg += `<defs>${linGrad(gl, 0, 118, 0, 290, [[0, '#040a08', 0], [.3, '#040a08', .5], [1, '#020504', .85]])}</defs><rect x="-10" y="118" width="220" height="180" fill="url(#${gl})"/>`; }
    fg += gloom(u, 80, 70, -20, 10, .35, '#020806');
    return [bg, fg];
  } };
