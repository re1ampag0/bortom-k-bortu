// «Всё по плану» (Жемчужина, РЕАКЦИЯ: отмените Заряд, сыгранный на Залп по вашей команде), refined from the
// first-round scene (portrait-pearl.cjs SCENES['Всё по плану']): the captain's table at night in the stern cabin, the
// chart with the route drawn to a cross, and on it the enemy's special charge, intercepted before it reached the gun —
// a round of grapeshot in its quilted canvas, the cut slow match lying beside it; round them the hat, the candle, the
// closed compass, the mug and a little spilt rum. The brief's find — the charge lies on the table, not in the barrel.
// Fixed against the first round: the charge was a shapeless sack — now a proper grapeshot round (an oak sabot, the
// iron spindle, the balls bulging the canvas in tiers, the net of cord over them) with the enemy's tag, its mark
// struck through; the flat wall and the table top seen from nowhere — now a 2.5D cabin: the stern window, the side
// walls and the table's planks run to one vanishing point at eye level; a dagger stands in the chart at the cross
// of the route, the cut end of the match frayed beside the round. Light: the candle on the table (key, warm, right),
// the moon through the stern window (cold rim and fill from behind).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { woodTex, glow, gloom, motes } = PK;

const HZ = 30, VX = 100;                        // eye level (the sea horizon in the window), the vanishing point
const TB = 52;                                  // the table's far edge (high: the camera looks down on the table)
const CANDLE = { x: 162, y: 90, s: 1.35, len: 13, lit: true, seed: 6 };
const BAG = { x: 96, y: 126 };                  // the grapeshot bag: the middle of its foot on the chart
const CUT = [[55.5, 102.4], [60.2, 104.8]];    // the slow match's two cut ends: the burnt one (left), the one to the bag
const light = { time: 'night', haze: .3, key: { type: 'point', ...K.candle.local(CANDLE), color: '#ffbc66', power: 1, radius: 110 },
  fill: { color: '#34405e', power: .35 }, rim: { az: 0, color: '#b0c4ff', power: .45 } };
const lightOut = { time: 'night', haze: .2, key: { type: 'moon', x: 122, y: 17, el: 22, color: '#e8eeff', power: .8 } };
const skel = { horizon: HZ, eye: 1.5, light: 'candle on the table, right (key, warm) + the moon through the stern window (rim, fill)', items: [
  ['back wall + stern window', 18, TB, 164, TB, 'the stern, behind the table', { bg: 1 }], ['table top', -10, 290, 220, 220, 'ground: planks to the VP', { edge: 1 }],
  ['chart', 8, 136, 186, 58, 'on the table'], ['grapeshot round', 76, 114, 40, 58, 'stands on the chart (sabot)'], ['tag', 116, 112, 16, 12, 'tied to the spindle, lies on the chart'],
  ['slow match', 40, 124, 56, 12, 'on the chart, cut end frayed'], ['dagger', 128, 104, 16, 34, 'point in the table at the cross'],
  ['hat', 14, 92, 44, 20, 'on the table'], ['candle', 150, 92, 20, 34, 'on the table'], ['compass', 150, 126, 32, 14, 'on the chart'], ['mug', 20, 126, 18, 20, 'on the table']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const toward = (p, y) => { const t = (y - HZ) / (p[1] - HZ); return [VX + (p[0] - VX) * t, y]; };

module.exports = { name: 'Всё по плану', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ }), Lo = K.makeLight(lightOut, { horizon: HZ }), R = rng(23);
    const FL = [light.key.x, light.key.y];
    // ——— the cabin: the stern wall facing us, the side walls running to the VP, the deckhead with two beams ———
    const WL = 22, WR = 178, WT = 4;           // the stern wall's sides and top (where it meets the deckhead)
    let bg = woodTex(u, WL, WT, WR - WL, TB - WT, '#4a2e18', '#22140a', '#0c0704', 10, true, 12);
    bg += `<path d="M-10 -10L${WL} ${WT}L${WL} ${TB}L-10 ${TB + 30}Z" fill="#20120a"/><path d="M210 -10L${WR} ${WT}L${WR} ${TB}L210 ${TB + 30}Z" fill="#160c06"/>`;
    // planks of the side walls: lines from the stern wall's edge outwards, away from the vanishing point
    const out = (x, y, X) => { const t = (X - VX) / (x - VX); return [X, HZ + (y - HZ) * t]; };
    for (const y of [12, 22, 32, 42, 52, 62]) { const a = out(WL, y, -10), b = out(WR, y, 210); bg += `<path d="M${WL} ${y}L${P2(a)}" stroke="#0a0503" stroke-width=".7" opacity=".7"/><path d="M${WR} ${y}L${P2(b)}" stroke="#0a0503" stroke-width=".7" opacity=".7"/>`; }
    bg += `<rect x="-10" y="-10" width="220" height="${WT + 10}" fill="#120a05"/><path d="M-10 ${WT}H210" stroke="#3a2412" stroke-width="1.2"/>`
      + `<path d="M${WL} ${WT}V${TB}M${WR} ${WT}V${TB}" stroke="#0a0503" stroke-width="1.6"/><path d="M${WL + .8} ${WT}V${TB}" stroke="#7a5030" stroke-width=".4" opacity=".6"/>`;
    // the stern window: three lights in a heavy frame, the moonlit sea outside, the sill catching the moon
    { const x0 = 50, x1 = 150, y0 = 12, y1 = 54, cl = nid('sw', u);
      bg += `<rect x="${x0 - 5}" y="${y0 - 5}" width="${x1 - x0 + 10}" height="${y1 - y0 + 11}" rx="1.5" fill="#2a180a" stroke="#0a0503" stroke-width=".8"/>`
        + `<defs><clipPath id="${cl}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><g clip-path="url(#${cl})">`
        + K.sky(u, Lo, { horizon: HZ, stars: true, seed: 3 }) + K.sunMoon(u, Lo, { r: 4.4 }) + K.cloud(u, Lo, { x: 84, y: 26, w: 26, h: 3.4, seed: 5, far: .5 })
        + K.water(u, Lo, { horizon: HZ, bottom: y1 + 2, swell: .3, seed: 4, glitter: 126 }) + `</g>`;
      for (const x of [x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3]) bg += `<rect x="${f(x - 2)}" y="${y0}" width="4" height="${y1 - y0}" fill="#2a180a"/><path d="M${f(x - 1.4)} ${y0}V${y1}" stroke="#7a5030" stroke-width=".4" opacity=".7"/>`;
      for (let k = 0; k < 3; k++) { const xa = x0 + k * (x1 - x0) / 3; bg += `<path d="M${f(xa + 2)} ${(y0 + y1) / 2}h${f((x1 - x0) / 3 - 4)}" stroke="#2a180a" stroke-width="1.2"/>`; }
      bg += `<path d="M${x0 + 3} ${y0 + 4}l10 -1.4M${x0 + 38} ${y0 + 4}l8 -1M${x0 + 72} ${y0 + 25}l8 -1" stroke="#dce6ff" stroke-width=".45" opacity=".35"/>`
        + `<path d="M${x0 - 8} ${y1 + 6}H${x1 + 8}l-2 3.4H${x0 - 6}z" fill="#4a2c16"/><path d="M${x0 - 8} ${y1 + 6}H${x1 + 8}" stroke="#b8ccf0" stroke-width=".6" opacity=".75"/>`; }
    // a carved bracket and a hanging lantern, unlit, on the left wall; a pistol on two pegs on the right wall
    bg += `<path d="M6 30q6 -1 9 3l-1 6q-4 -3 -8 -2z" fill="#2a180c" stroke="#0a0503" stroke-width=".4"/>`
      + `<path d="M188 34l10 -2M188 42l10 -2" stroke="#0a0503" stroke-width="1.4"/><path d="M184 36q10 -4 18 -2l1 3q-8 -1 -18 3z" fill="#1e140c" stroke="#0a0503" stroke-width=".4"/>`;
    bg += glow(u, FL[0], FL[1], 90, 70, '#ffb056', .3) + glow(u, 100, 34, 60, 30, '#a8c0f0', .1) + gloom(u, 0, 30, 0, 0, .35) + gloom(u, 200, 30, 200, 0, .4);
    // ——— the table top: oak planks to the VP, the far edge against the stern, the near part darkening ———
    let mid = '';
    { const id = nid('tt', u); mid += `<defs><clipPath id="${id}"><rect x="-10" y="${TB}" width="220" height="${290 - TB}"/></clipPath></defs><g clip-path="url(#${id})">${K.deck(u, L, { horizon: HZ, top: TB, bottom: 290, vx: VX, kind: 'oak', plank: 26, seed: 9 })}</g>`
        + `<path d="M-10 ${TB}H210" stroke="#060302" stroke-width="1.6"/><path d="M-10 ${TB + 1.2}H210" stroke="#d09058" stroke-width=".5" opacity=".5"/>`;
      mid += K.localGlow(u, { x: FL[0], y: CANDLE.y + 4, color: '#ffb060', power: .55, radius: 60 }, { squash: .35, core: false }); }
    // ——— the chart: laid across the table in perspective, curling at the corners; coast, rhumb lines, the route ———
    { const C = [[12, 78], [186, 77], [198, 136], [2, 138]], cid = nid('ch', u), g = nid('cg', u);
      mid += `<path d="M14 80L188 79L200 139L4 141Z" fill="#000" opacity=".35"/>`
        + `<defs>${linGrad(g, 0, 78, 0, 138, [[0, '#a89068', 1], [.5, '#c8b084', 1], [1, '#d8c294', 1]])}<clipPath id="${cid}"><path d="M${C.map(P2).join('L')}Z"/></clipPath></defs>`
        + `<path d="M${C.map(P2).join('L')}Z" fill="url(#${g})" stroke="#8a7048" stroke-width=".5"/><g clip-path="url(#${cid})">`;
      // rhumb lines from a rose, a coast with hatching, islands, the route in ink with a cross at its end
      const rose = [58, 100];
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; mid += `<path d="M${P2(rose)}L${f(rose[0] + Math.cos(a) * 160)} ${f(rose[1] + Math.sin(a) * 40)}" stroke="#9a7a50" stroke-width=".25" opacity=".55"/>`; }
      mid += `<circle cx="${rose[0]}" cy="${rose[1]}" r="5" fill="none" stroke="#7a5a30" stroke-width=".4" transform="translate(${rose[0]} ${rose[1]}) scale(1 .4) translate(${-rose[0]} ${-rose[1]})"/>`
        + `<path d="M20 86q14 -4 26 1q12 -3 20 2q-4 6 -16 5q-12 3 -24 -2zM150 118q14 -4 26 0q6 5 -6 7q-14 1 -20 -7zM120 84q6 -2 12 0q-2 3 -12 0z" fill="#d6be8a" stroke="#7a5a30" stroke-width=".5"/>`
        + `<path d="M22 88q12 -3 22 1M154 119q10 -2 18 0" stroke="#9a7a50" stroke-width=".35" fill="none"/>`
        + `<path d="M22 132Q46 116 72 118T122 104T140 96" stroke="#2a1a10" stroke-width="1" fill="none" stroke-dasharray="3 1.6"/>`
        + `<path d="M135 92l8 6M143 92l-8 6" stroke="#8a1a10" stroke-width="1.4" stroke-linecap="round"/>`
        + `</g>`;
      // the near corner curls up
      mid += `<path d="M2 138L18 137.6Q8 133 4 128Z" fill="#f6e6c0" stroke="#8a7048" stroke-width=".4"/><path d="M186 77L176 77.2Q183 80 187 84Z" fill="#c8b080" stroke="#8a7048" stroke-width=".4"/>`; }
    // ——— the hat: a leather tricorn on the left, its brim curled, a braid along the edge ———
    { const hx = 34, hy = 90, g = nid('ht', u);
      mid += K.castShadow(u, L, { x: hx, y: hy + 2, w: 40, h: 10, horizon: HZ, d: .5 })
        + `<defs>${linGrad(g, hx - 20, hy - 14, hx + 20, hy + 4, [[0, '#3a2a1e', 1], [.5, '#22180f', 1], [1, '#0e0906', 1]])}</defs>`
        + `<path d="M${hx - 22} ${hy + 2}Q${hx - 18} ${hy - 9} ${hx - 6} ${hy - 6}Q${hx} ${hy - 12} ${hx + 6} ${hy - 6}Q${hx + 18} ${hy - 9} ${hx + 22} ${hy + 2}Q${hx + 10} ${hy + 7} ${hx} ${hy + 6}Q${hx - 10} ${hy + 7} ${hx - 22} ${hy + 2}Z" fill="url(#${g})" stroke="#060402" stroke-width=".6"/>`
        + `<path d="M${hx - 11} ${hy - 4}Q${hx - 10} ${hy - 16} ${hx} ${hy - 16}Q${hx + 10} ${hy - 16} ${hx + 11} ${hy - 4}Q${hx} ${hy - 1} ${hx - 11} ${hy - 4}Z" fill="#2a1f16" stroke="#060402" stroke-width=".5"/>`
        + `<path d="M${hx + 2} ${hy - 15}Q${hx + 9} ${hy - 14} ${hx + 10} ${hy - 6}" stroke="#7a604a" stroke-width=".7" fill="none" opacity=".7"/>`
        + `<path d="M${hx - 22} ${hy + 2}Q${hx - 18} ${hy - 9} ${hx - 6} ${hy - 6}Q${hx} ${hy - 12} ${hx + 6} ${hy - 6}Q${hx + 18} ${hy - 9} ${hx + 22} ${hy + 2}" stroke="#c9a048" stroke-width=".7" fill="none"/>`
        + `<path d="M${hx + 8} ${hy - 6.4}Q${hx + 17} ${hy - 8} ${hx + 21} ${hy + 1}" stroke="#ffd890" stroke-width=".4" fill="none" opacity=".8"/>`
        + `<path d="M${hx - 9} ${hy - 4.4}Q${hx} ${hy - 2} ${hx + 9} ${hy - 4.4}" stroke="#0a0604" stroke-width="1.2" fill="none" opacity=".7"/>`; }
    // ——— the candle (the key light) and its pool; the mug and the spilt rum; the compass ———
    mid += K.castShadow(u, L, { x: CANDLE.x, y: CANDLE.y, w: 10, h: 30, horizon: HZ, d: 1 }) + K.candle(u, L, CANDLE);
    { const m = { x: 26, y: 128, s: 1.55, fill: 'rum', seed: 4 };
      mid += `<path d="M36 130q10 -3 22 0q8 3 -2 5.4q-12 1.6 -20 -1z" fill="#4a1e06" opacity=".85"/><path d="M40 130.4q8 -1.6 14 0" stroke="#ffc070" stroke-width=".5" fill="none" opacity=".8"/>`
        + K.castShadow(u, L, { x: m.x, y: m.y, w: 9 * m.s, h: 11 * m.s, horizon: HZ, d: 1 }) + K.mug(u, L, m); }
    { const cx = 166, cy = 124, rx = 13, ry = 4.6, g = nid('cp', u), t = nid('cl', u);
      mid += K.contactShadow(u, cx, cy + 3, 30, L) + `<defs>${linGrad(g, cx - rx, 0, cx + rx, 0, [[0, '#6a4a14', 1], [.35, '#e8c060', 1], [.6, '#a07a28', 1], [1, '#3a2808', 1]])}${radGrad(t, cx + 3, cy - 6, 14, [[0, '#fff0b0', 1], [.4, '#d8ac48', 1], [1, '#7a5a18', 1]])}</defs>`
        + `<path d="M${cx - rx} ${cy - 3}V${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}V${cy - 3}Z" fill="url(#${g})" stroke="#3a2808" stroke-width=".45"/>`
        + `<ellipse cx="${cx}" cy="${cy - 3}" rx="${rx}" ry="${ry}" fill="url(#${t})" stroke="#4a3208" stroke-width=".45"/>`
        + `<ellipse cx="${cx}" cy="${cy - 3}" rx="${rx * .7}" ry="${ry * .7}" fill="none" stroke="#8a6420" stroke-width=".5"/><path d="M${cx - 5} ${cy - 3}l5 -1.4l5 1.4l-5 1.4z" fill="none" stroke="#7a5418" stroke-width=".45"/>`
        + `<rect x="${cx + rx - .6}" y="${cy - 3.6}" width="3.4" height="2.4" rx=".6" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".3"/>`
        + `<path d="M${cx - rx + 2} ${cy - 4.4}A${rx - 2} ${ry - 1.4} 0 0 1 ${cx + 4} ${cy - 3 - ry + .6}" stroke="#fff6c8" stroke-width=".55" fill="none" opacity=".8"/>`; }
    // ——— the slow match: a coil of cord from under the round, its end cut clean and frayed ———
    { const pts = [[76, 121], [62, 125], [50, 120], [42, 125], [50, 131], [66, 130]];
      mid += K.rope(u, L, pts, { r: .95, seed: 7 });
      const e = pts[pts.length - 1];
      for (let k = 0; k < 6; k++) { const a = -.6 + k * .24; mid += `<path d="M${P2(e)}l${f(Math.cos(a) * (2 + R() * 1.6))} ${f(Math.sin(a) * (1.4 + R()))}" stroke="${R() > .5 ? '#c8a878' : '#8a6a44'}" stroke-width=".35" stroke-linecap="round"/>`; }
      mid += `<ellipse cx="${f(e[0] + .3)}" cy="${f(e[1])}" rx=".9" ry=".8" fill="#2a1a10"/><path d="M${f(e[0] + .4)} ${f(e[1] - .5)}l.6 .9" stroke="#e8d4a8" stroke-width=".3"/>`; }
    // ——— the grapeshot round: the oak sabot, the balls in three tiers bulging the canvas, the net of cord, the
    // spindle with its loop; the tag on a string, its mark struck through ———
    let shot = '';
    { const { x, y, r } = ROUND, k = .3, bw = 20.6;
      shot += K.castShadow(u, L, { x, y, w: bw * 2.2, h: 46, horizon: HZ, d: 1 });
      // the sabot: a short oak disc, its rim lit on the candle side
      shot += K.shadeCyl(u, x, y, x, y - 4.4, bw + 1.8, L, 'oak', { ell: k, face: 2, outline: .45, seed: 3 });
      // the tiers: five balls seen in each ring (back pair, middle pair, front one), canvas over all
      const tiers = [y - 4.4 - r * .92, y - 4.4 - r * 2.62, y - 4.4 - r * 4.3];
      const ring = [[-.62, -1], [.62, -1], [-1, -.2], [1, -.2], [-.5, .9], [.5, .9]];
      const g = nid('cv', u);
      shot += `<defs>${linGrad(g, x - bw, 0, x + bw, 0, [[0, '#2a2418', 1], [.4, '#5a4e38', 1], [.75, '#7a6a4c', 1], [1, '#9a8860', 1]])}</defs>`;
      // the canvas body behind the balls (so the gaps read as cloth, not air)
      { const B8 = bw * .8; shot += `<path d="M${x - B8} ${f(y - 5)}C${x - B8 - 1} ${f(tiers[1])} ${x - B8 + 1} ${f(tiers[2] - r)} ${x - B8 * .7} ${f(tiers[2] - r * 1.1)}L${x + B8 * .7} ${f(tiers[2] - r * 1.1)}C${x + B8 - 1} ${f(tiers[2] - r)} ${x + B8 + 1} ${f(tiers[1])} ${x + B8} ${f(y - 5)}Z" fill="url(#${g})" stroke="#2a2418" stroke-width=".5"/>`; }
      tiers.forEach((ty, ti) => {
        for (const [dx, dz] of ring.slice().sort((a, b) => a[1] - b[1])) {
          const bx = x + dx * (bw - r) * .92 + (ti % 2 ? 1.2 : -1.2) * (dz < 0 ? 1 : 0), by = ty + dz * r * k * 1.5;
          // a ball under the canvas: soft, lit from the candle (upper right), the cloth creasing round it
          const rr = r * (dz > 0 ? 1 : .94), dl = [FL[0] - bx, FL[1] - by], dn = Math.hypot(dl[0], dl[1]) || 1, hx = bx + dl[0] / dn * rr * .38, hy = by + dl[1] / dn * rr * .38, bg2 = nid('bb', u);
          const dim = dz < 0 ? .3 : 0;
          shot += `<defs>${radGrad(bg2, hx, hy, rr * 1.5, [[0, mix('#ecdcb0', '#6a5a40', dim), 1], [.3, mix('#c4ad80', '#5a4a34', dim), 1], [.7, mix('#7e6a48', '#3a3022', dim), 1], [1, '#30281c', 1]])}</defs>`
            + `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(rr)}" fill="url(#${bg2})" stroke="#3a3020" stroke-width=".4"/>`
            + `<path d="M${f(bx - rr * .7)} ${f(by + rr * .5)}q${f(rr * .7)} ${f(rr * .5)} ${f(rr * 1.4)} 0M${f(bx - rr * .2)} ${f(by - rr * .8)}q${f(-rr * .3)} ${f(rr * .4)} ${f(-rr * .2)} ${f(rr * .9)}" stroke="#4a3e2a" stroke-width=".35" fill="none" opacity=".6"/>`;
        }
      });
      // the net: cords round each tier and up between the balls, knotted where they cross
      tiers.forEach(ty => { const yy = ty + r * .55; shot += `<path d="M${x - bw + .4} ${f(yy - 1.4)}Q${x} ${f(yy + 4.2)} ${x + bw - .4} ${f(yy - 1.4)}" stroke="#7a6444" stroke-width="1" fill="none"/><path d="M${x - bw + .4} ${f(yy - 1.8)}Q${x} ${f(yy + 3.6)} ${x + bw - .4} ${f(yy - 1.8)}" stroke="#d8c8a0" stroke-width=".35" fill="none" opacity=".7"/>`; });
      for (const dx of [-12.4, 0, 12.4]) { const xb = x + dx, xt = x + dx * .72; shot += `<path d="M${f(xb)} ${f(y - 4 + Math.abs(dx) * -.1)}Q${f(xb + dx * .08)} ${f(tiers[1])} ${f(xt)} ${f(tiers[2] - r * 1.05)}" stroke="#7a6444" stroke-width=".95" fill="none"/>`
        + `<path d="M${f(xb - .4)} ${f(y - 4)}Q${f(xb + dx * .08 - .4)} ${f(tiers[1])} ${f(xt - .4)} ${f(tiers[2] - r * 1.05)}" stroke="#e0d0a8" stroke-width=".3" fill="none" opacity=".6"/>`;
        tiers.forEach(ty => { const kx = lerp(xb, xt, (y - (ty + r * .55)) / (y - tiers[2] + r)), ky = ty + r * .55 + 2.6 - Math.pow(dx / bw, 2) * 4.4; shot += `<circle cx="${f(kx)}" cy="${f(ky)}" r=".9" fill="#6a5838" stroke="#2a2010" stroke-width=".25"/>`; }); }
      // the top: the canvas gathered round the spindle, the spindle's head and its rope loop
      const tp = tiers[2] - r * 1.1;
      shot += `<path d="M${x - bw * .72} ${f(tp)}Q${x} ${f(tp - 6)} ${x + bw * .72} ${f(tp)}Q${x} ${f(tp + 3)} ${x - bw * .72} ${f(tp)}Z" fill="#b8ac8c" stroke="#2a2418" stroke-width=".45"/>`
        + Array.from({ length: 7 }, (_, i) => { const a = x - bw * .6 + i * bw * .2; return `<path d="M${f(a)} ${f(tp + .6)}Q${f(lerp(a, x, .5))} ${f(tp - 2)} ${f(lerp(a, x, .8))} ${f(tp - 3.6)}" stroke="#6a5e44" stroke-width=".35" fill="none"/>`; }).join('')
        + K.shadeCyl(u, x, tp - 2.4, x, tp - 9, 1.6, L, 'iron', { ell: .3, face: 2, outline: .35 })
        + K.rope(u, L, [[x - .6, tp - 8.6], [x - 4.4, tp - 13], [x + .2, tp - 15.6], [x + 3.6, tp - 12], [x + .6, tp - 8.6]], { r: .55, seed: 9 })
        + K.rope(u, L, [[x + 1.6, tp - 7], [x + 12, tp - 2], [x + 20, y - 8], [x + 24, y - 1]], { r: .32, seed: 11 });
      // the tag on the chart: a pale card with an eyelet and a mark struck through in red
      shot += `<g transform="translate(${x + 26} ${y - .4}) rotate(14)"><path d="M-7 -4.4h11l3.4 4.4l-3.4 4.4h-11z" fill="#000" opacity=".3" transform="translate(1.2 1)"/><path d="M-7 -4.4h11l3.4 4.4l-3.4 4.4h-11z" fill="#efe4c8" stroke="#6a5a40" stroke-width=".45"/>`
        + `<circle cx="4.4" r="1" fill="#3a2a18"/><circle cx="4.4" r=".5" fill="#efe4c8"/><path d="M-5 -2.4l3 1.6l3 -1.6M-5 2.4l3 -1.6l3 1.6" stroke="#2a3a5a" stroke-width=".6" fill="none"/>`
        + `<path d="M-6 -3.4L2 3.4M2 -3.4L-6 3.4" stroke="#a01a10" stroke-width="1.1" stroke-linecap="round"/><path d="M-6.4 -3.8h10.4" stroke="#ffffff" stroke-width=".4" opacity=".7"/></g>`;
    }
    // ——— the dagger standing in the chart at the cross of the route ———
    let dag = '';
    { const tip = [139, 96], top = [147, 56], ax = [(top[0] - tip[0]) / 40.8, (top[1] - tip[1]) / 40.8], nv = [-ax[1], ax[0]];
      const at = (t, w) => [tip[0] + ax[0] * t + nv[0] * w, tip[1] + ax[1] * t + nv[1] * w], g = nid('bl', u);
      dag += K.castShadow(u, L, { x: tip[0], y: tip[1], w: 3, h: 34, horizon: HZ, d: 1 });
      dag += `<defs>${linGrad(g, ...at(8, -1.6), ...at(8, 1.6), [[0, '#5a646c', 1], [.45, '#e8eef2', 1], [.55, '#9aa4ac', 1], [1, '#3a4248', 1]])}</defs>`
        + `<path d="M${P2(at(0, -.4))}L${P2(at(15, -1.6))}L${P2(at(15, 1.6))}L${P2(at(0, .4))}Z" fill="url(#${g})" stroke="#1a1e22" stroke-width=".35"/>`
        + `<path d="M${P2(at(1, 0))}L${P2(at(15, 0))}" stroke="#ffffff" stroke-width=".3" opacity=".7"/>`
        + `<ellipse cx="${tip[0]}" cy="${tip[1] + .2}" rx="1.6" ry=".5" fill="#1a0e06" opacity=".7"/>`
        + `<path d="M${P2(at(15, -4.6))}Q${P2(at(16.6, 0))} ${P2(at(15, 4.6))}L${P2(at(16.6, 4.4))}Q${P2(at(18, 0))} ${P2(at(16.6, -4.4))}Z" fill="url(#brass${u})" stroke="#3a2808" stroke-width=".35"/>`
        + K.shadeCyl(u, ...at(17, 0), ...at(28, 0), 1.3, L, 'leather', { outline: .35 })
        + [19.5, 22, 24.5].map(t => `<path d="M${P2(at(t, -1.3))}L${P2(at(t + .8, 1.3))}" stroke="#c9a048" stroke-width=".35"/>`).join('')
        + K.shadeSphere(u, ...at(29.6, 0), 1.9, L, 'brass', { outline: .35 }); }
    // ——— light: the candle's glow, motes in the air, the moon's cold rim from behind, the dark corners ———
    const fg = K.localGlow(u, { x: FL[0], y: FL[1], color: '#ffc070', power: .85, radius: 30 })
      + glow(u, 100, 60, 70, 18, '#a8c0f0', .08) + motes(16, 120, 50, 60, 50, '#ffe0b0', 5)
      + gloom(u, 100, 60, 0, 140, .32) + gloom(u, 100, 120, 100, 280, .35);
    return [bg, mid + shot + dag + fg];
  } };
