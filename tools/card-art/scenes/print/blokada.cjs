// «Блокада» (Индевор, ПРИКАЗ: выбранный вражеский корабль до конца своего следующего хода не может разыгрывать Ремонт и
// меняться местами; возьмите 1 карту), refined from the first-round scene (portrait-endeavour.cjs SCENES['Блокада']):
// the mouth of a harbour shut. On the left a stone tower on its rock with the Company's flag and a gun, a capstan at
// its foot; from it a heavy chain runs right across the water on tarred barrel floats to a post on a low rock on the
// far side. Beyond the chain two Company ships lie across the entrance under shortened sail, their ports open. On our
// side, stopped at the chain, a boat loaded with fresh planks and a barrel of pitch — the repair stores that cannot
// get through. Brief's find: the chain across the harbour.
// Fixed against the first round: the tower was a flat wall-chart and its rock a lump — now a round tower on a wet
// rock, lit from the sun's side; the chain ended in the air at the right edge — now it is made fast to a post; the
// floats were brown ovals — now barrels sitting in the water with foam; the boat was a flat sticker — now a boat
// with a load, lying against the chain. Light: the sun high ahead right (key), the tower's right side and the floats'
// tops lit, the left in cool shade; glitter on the water between the ships.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, rng, lerp } = K;
const { gloom } = PK;

const HZ = 76;
const SUN = { x: 132, y: 40 };
const light = { time: 'day', haze: .3, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#fff2d6', power: 1 }, fill: { color: '#8ab4d4', power: .5 } };
const TW = { x: 30, top: 57, foot: 100, r: 15 };            // the tower: centre x, parapet top, foot on the rock, radius
const CAP = { x: 54, y: 106 };                              // the capstan on the rock at the tower's foot
const POST = { x: 186, y: 95 };                             // the post on the far rock
// floats along the chain: x, waterline y, scale (smaller as the chain runs away to the right)
const FL = [[78, 108.4, 1], [106, 104.6, .86], [132, 101.4, .74], [156, 98.8, .64]];
const skel = { horizon: HZ, eye: 2.4, light: 'sun high ahead right', items: [
  ['rock + tower', 0, 118, 66, 86, 'sea'], ['flag', 44, 53, 22, 14, 'pole on the tower'], ['capstan', 49, 106, 11, 10, 'rock'],
  ['chain + floats', 54, 110, 134, 16, 'water, capstan → post'], ['far rock + post', 172, 100, 28, 16, 'sea'],
  ['ship 1', 74, 90, 80, 46, 'sea beyond the chain'], ['ship 2', 150, 85, 50, 30, 'sea beyond'], ['boat', 84, 122, 46, 18, 'water against the chain']] };

module.exports = { name: 'Блокада', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 2.4 });
    const R = rng(17);
    const ln = (d, w = .5, c = '#1a1612', op = 1) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
    // ——— the day: sky, clouds, low far hills of the harbour's other shore, the sea
    let bg = K.sky(u, L, { horizon: HZ }) + K.sunMoon(u, L, { r: 7 });
    for (const [x, y, w, h, sd, fr] of [[92, 20, 60, 8, 4, .3], [172, 58, 40, 6, 9, .6], [70, 62, 46, 5, 2, .7]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    { const g = nid('hl', u); bg += `<defs>${linGrad(g, 0, HZ - 10, 0, HZ, [[0, '#8fa8b0'], [1, '#a8bcc0']])}</defs>`
      + `<path d="M60 ${HZ}Q74 ${HZ - 7} 92 ${HZ - 6}T128 ${HZ - 4}T170 ${HZ - 8}T206 ${HZ - 3}V${HZ + .5}H60Z" fill="url(#${g})" opacity=".85"/>`; }
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .38, seed: 7, glitter: SUN.x + 2 });
    // ——— the Company ships beyond the chain: across the entrance, bow right, topsails only, ports open
    bg += K.ship(u, L, { kind: 'endeavour', x: 166, y: 84.5, scale: .27, flip: true, sails: 'reefed', detail: 'far', wake: false, seed: 12 });
    bg += K.ship(u, L, { kind: 'endeavour', x: 110, y: 90, scale: .44, flip: true, sails: 'reefed', detail: 'mid', wake: false, reflect: true, seed: 9 });

    // ——— the far rock with its mooring post (the chain's other end)
    let mid = K.rock(u, L, { x: POST.x + 4, y: POST.y + 4, w: 30, h: 9, wet: true, seed: 21 });
    mid += K.shadeCyl(u, POST.x, POST.y + 1, POST.x, POST.y - 9, 1.7, L, 'oak', { r1: 1.8, r2: 1.6, ell: .3, face: 2, outline: .3, seed: 4 })
      + K.shadeCyl(u, POST.x - 1.9, POST.y - 6.4, POST.x + 1.9, POST.y - 6.4, .5, L, 'iron', { outline: .2 });

    // ——— the near rock and the tower
    let tw = K.rock(u, L, { x: 26, y: 124, w: 78, h: 34, wet: true, seed: 5 }) + K.rock(u, L, { x: 52, y: 118, w: 26, h: 12, wet: true, seed: 8 });
    { const { x, top, foot, r } = TW, x0 = x - r, x1 = x + r, la = L.at(x, (top + foot) / 2);
      // stone: grey with a warm cast, lit on the sun's side (right), cool shade on the left
      const lit = '#d8d0bc', half = '#a8a090', core = '#6a6a68', shade = '#4e5662', g = nid('tg', u), pg = nid('tp', u);
      tw += `<defs>${linGrad(g, x0, 0, x1, 0, [[0, shade], [.25, core], [.55, half], [.82, lit], [.94, '#eee6d2'], [1, half]])}`
        + `${linGrad(pg, x0 - 2.4, 0, x1 + 2.4, 0, [[0, shade], [.3, core], [.6, half], [.85, lit], [1, half]])}</defs>`;
      const e = .26;   // the flatness of the tower's courses (seen a little from above)
      tw += `<path d="M${x0} ${top + 8}V${foot}Q${x} ${foot + r * e * 2} ${x1} ${foot}V${top + 8}Z" fill="url(#${g})"/>`;
      // courses and staggered joints, following the round
      for (let k = 0, y = top + 11; y < foot; k++, y += 4.4) {
        tw += ln(`M${x0} ${f(y)}Q${x} ${f(y + r * e * 2)} ${x1} ${f(y)}`, .35, '#3a3a3a', .55);
        for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j + (k % 2) * .5 + .3) / 7 * Math.PI, xx = x + Math.sin(a) * r * .98, yy = y + (1 - Math.abs(Math.sin(a))) * 0 + Math.cos(a) * r * e * 1 + r * e;
          if (Math.abs(Math.sin(a)) < .93) tw += ln(`M${f(xx)} ${f(yy)}v4.2`, .3, '#3a3a3a', .45); } }
      // weather streaks and a dark damp band at the foot
      for (let k = 0; k < 9; k++) { const xx = x0 + 2 + R() * (2 * r - 4); tw += ln(`M${f(xx)} ${f(top + 12 + R() * 10)}v${f(8 + R() * 18)}`, .6 + R() * .6, '#3a3e40', .18); }
      { const dg = nid('td', u); tw += `<defs>${linGrad(dg, 0, foot - 12, 0, foot + 6, [[0, '#1a2228', 0], [1, '#1a2228', .55]])}</defs><path d="M${x0} ${foot - 12}V${foot}Q${x} ${foot + r * e * 2} ${x1} ${foot}V${foot - 12}Z" fill="url(#${dg})"/>`; }
      // a slit window and the door with its steps
      tw += `<path d="M${x + 3} ${top + 20}h2.2v8h-2.2z" fill="#14181c"/><path d="M${x + 5.2} ${top + 20}v8" stroke="#eee6d2" stroke-width=".4" opacity=".7"/>`
        + `<path d="M${x + 6} ${foot - 1}v-11q2.8 -3 5.6 0v11z" fill="#1c1a18"/><path d="M${x + 11.6} ${foot - 12}v11" stroke="#eee6d2" stroke-width=".4" opacity=".6"/>`;
      // the gun port with a gun run out to the right, towards the entrance
      tw += `<path d="M${x + 8} ${top + 33}h5.6v4.6h-5.6z" fill="#14181c"/>` + K.shadeCyl(u, x + 10, top + 35.3, x + r + 7, top + 35.1, 1.5, L, 'iron', { r1: 1.6, r2: 1.2, outline: .3 })
        + `<ellipse cx="${x + r + 7.2}" cy="${top + 35.1}" rx=".5" ry="1.1" fill="#0a0a0a"/>`;
      // the parapet: a corbelled ring wider than the tower, the merlons (front ones lit by the sun on their right)
      tw += `<path d="M${x0 - 2.4} ${top + 4}V${top + 8.6}Q${x} ${top + 8.6 + (r + 2.4) * e * 2} ${x1 + 2.4} ${top + 8.6}V${top + 4}Z" fill="url(#${pg})"/>`
        + ln(`M${x0 - 2.4} ${top + 8.6}Q${x} ${top + 8.6 + (r + 2.4) * e * 2} ${x1 + 2.4} ${top + 8.6}`, .7, '#2a2c30', .8);
      for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + (j + .5) / 6 * Math.PI, xm = x + Math.sin(a) * (r + 1.6), wm = 4.6 * Math.cos(a) + .6, ym = top + 4 + Math.cos(a) * (r + 2.4) * e * 2 * .5;
        const I = Math.sin(a) * .8 + .2, c = I > .5 ? lit : I > 0 ? half : I > -.4 ? core : shade;
        tw += `<path d="M${f(xm - wm / 2)} ${f(ym)}v-5.2h${f(wm)}v5.2z" fill="${c}" stroke="#2a2c30" stroke-width=".3"/>`; }
      // the flag pole and the Company's ensign blowing out to the right (the wind as on the ships)
      { const px = x + 13.4, py0 = top + 1, py1 = top - 18, fx = px + .6, fy = py1 + 1, w = 21, h = 12, cid = nid('fc', u);
        tw += K.shadeCyl(u, px, py0, px, py1, .8, L, 'oak', { r1: .9, r2: .6, outline: .25 }) + K.shadeSphere(u, px, py1 - .6, 1.1, L, 'brass');
        const wv = (xx, k) => f(Math.sin(xx / w * 6.3 + .8) * 1.1 * (xx / w) + k);
        let top_ = `M${f(fx)} ${f(fy)}`, bot = '';
        for (let j = 1; j <= 10; j++) { const xx = w * j / 10; top_ += `L${f(fx + xx)} ${wv(xx, fy + xx * .1)}`; }
        for (let j = 10; j >= 0; j--) { const xx = w * j / 10; bot += `L${f(fx + xx)} ${wv(xx, fy + h - xx * .08)}`; }
        const d = top_ + bot + 'Z', red = '#c62a2a', wht = '#f6f0e2';
        tw += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${wht}"/><g clip-path="url(#${cid})">`;
        for (let k = 0; k < 9; k += 2) tw += `<rect x="${f(fx - 1)}" y="${f(fy - 1.4 + (h + 2) * k / 9)}" width="${w + 2}" height="${f((h + 2) / 9)}" fill="${red}" transform="skewY(4)" transform-origin="${f(fx)} ${f(fy)}"/>`;
        tw += `<rect x="${f(fx - 1)}" y="${f(fy - 1)}" width="${f(w * .42 + 1)}" height="${f(h * .5 + 1)}" fill="${wht}"/><path d="M${f(fx + w * .21)} ${f(fy - 1)}V${f(fy + h * .5)}M${f(fx - 1)} ${f(fy + h * .25)}H${f(fx + w * .42)}" stroke="${red}" stroke-width="1.5"/>`
          + [.32, .62, .88].map(q => `<rect x="${f(fx + w * q - 1)}" y="${f(fy - 2)}" width="2" height="${h + 5}" fill="#000" opacity=".15"/>`).join('') + `</g><path d="${d}" fill="none" stroke="#6a1414" stroke-width=".3"/>`; }
      // foam where the sea meets the rock
      tw += K.foam(u, { x: 30, y: 121, w: 74, h: 2, seed: 4, L }) + K.foam(u, { x: 56, y: 118.6, w: 24, h: 1.4, seed: 6, L }); }

    // ——— the capstan on the rock: the drum with whelps, two bars, the chain wound on it
    let ch = '';
    { const { x, y } = CAP;
      ch += K.contactShadow(u, x, y, 12, L) + K.shadeCyl(u, x, y, x, y - 8, 4, L, 'oak', { r1: 4.2, r2: 3.4, ell: .32, face: 2, outline: .35, seed: 7 });
      for (let k = 0; k < 3; k++) ch += ln(`M${x - 4} ${y - 2 - k * 1.8}q4 1.6 8 0`, 1, '#3a3e44', .9) + ln(`M${x - 3.6} ${y - 2.5 - k * 1.8}q3.6 1.4 7.2 0`, .35, '#c8ccd0', .6);
      ch += K.shadeCyl(u, x - 9, y - 8.6, x + 9, y - 7.6, .7, L, 'oak', { outline: .25 }) + K.shadeCyl(u, x - 2, y - 10.4, x + 3, y - 6.2, .7, L, 'oak', { outline: .25 }); }
    // ——— the chain: from the capstan down to the water, over each float, sagging between, to the post
    { const pts = [[CAP.x + 3.6, CAP.y - 3.4]];
      let prev = pts[0];
      for (const [x, y, s] of FL) { const top = [x, y - 5 * s], mx = (prev[0] + top[0]) / 2, my = Math.max(prev[1], top[1]) + 2.4 * s;
        pts.push([lerp(prev[0], mx, .5), lerp(prev[1], my, .6)], [mx, my], [lerp(mx, top[0], .5), lerp(my, top[1], .4)], top); prev = top; }
      { const end = [POST.x - .4, POST.y - 6.2], mx = (prev[0] + end[0]) / 2, my = Math.max(prev[1], end[1]) + 1.8; pts.push([mx, my], end); }
      // the chain far → near: the links shrink with distance; draw it in pieces with their own link size
      const pieces = [];
      for (let i = 0; i < pts.length - 1; i++) pieces.push([pts[i], pts[i + 1], 3.2 - (pts[i][0] - 56) / 130 * 1.6]);
      // water where the chain dips: a dark ring and a little foam
      for (let i = 1; i < pts.length; i += 4) { const p = pts[i + 1]; if (!p || i === 0) continue; ch += `<ellipse cx="${f(p[0])}" cy="${f(p[1] + .8)}" rx="${f(4 - p[0] / 80)}" ry=".8" fill="#0c2a36" opacity=".35"/>`; }
      ch += K.chain(u, L, pts.slice(0, 6), { link: 3.3, seed: 3 }) + K.chain(u, L, pts.slice(5, 14), { link: 2.6, seed: 4 }) + K.chain(u, L, pts.slice(13), { link: 2.0, seed: 5 });
      // the sky caught on the upper side of the links, so the chain reads as links and not as one dark band
      { const d = 'M' + pts.map(p => `${f(p[0])} ${f(p[1] - .7)}`).join('L');
        ch += `<path d="${d}" stroke="#c4ced6" stroke-width=".55" fill="none" stroke-dasharray="1.4 1.3" stroke-linecap="round" opacity=".6"/>`
          + `<path d="${d}" stroke="#fff4dc" stroke-width=".35" fill="none" stroke-dasharray=".6 4.4" stroke-dashoffset="1" stroke-linecap="round" opacity=".7"/>`; }
      // the floats: tarred barrels lying across the chain, a third under water, an iron eye on top the chain runs through
      let fl = '';
      for (const [x, y, s] of FL) { const r = 4.4 * s, hl = 7.4 * s, cid = nid('fw', u), body = K.shadeCyl(u, x - hl, y - r * .45, x + hl, y - r * .45, r, L, 'tar', { bulge: .14, ell: .34, face: 1, outline: .35, seed: Math.round(x) })
          + [-.62, -.25, .25, .62].map(t => ln(`M${f(x + hl * t)} ${f(y - r * 1.4)}q${f(r * .2)} ${f(r)} 0 ${f(r * 2)}`, .7 * s, '#4a4e54', .9) + ln(`M${f(x + hl * t + .3)} ${f(y - r * 1.4)}q${f(r * .2)} ${f(r * .6)} ${f(.1)} ${f(r * .9)}`, .3 * s, '#d8dce0', .55)).join('');
        fl += `<defs><clipPath id="${cid}"><rect x="${f(x - hl - 4)}" y="${f(y - r * 3)}" width="${f(hl * 2 + 8)}" height="${f(r * 3)}"/></clipPath></defs><g clip-path="url(#${cid})">${body}</g>`
          + `<ellipse cx="${x}" cy="${f(y + .2)}" rx="${f(hl + 1.6 * s)}" ry="${f(1.3 * s)}" fill="#0e3442" opacity=".45"/>` + K.foam(u, { x, y: y + .3, w: hl * 2 + 4 * s, h: 1.1 * s, seed: Math.round(x) + 1, L })
          + ln(`M${f(x - hl + 1.2 * s)} ${f(y - r * 1.3)}Q${f(x)} ${f(y - r * 1.62)} ${f(x + hl - 1.2 * s)} ${f(y - r * 1.3)}`, 1.1 * s, '#7a868e', .55)
          + ln(`M${f(x + hl * .1)} ${f(y - r * 1.5)}Q${f(x + hl * .5)} ${f(y - r * 1.5)} ${f(x + hl * .8)} ${f(y - r * 1.38)}`, .5 * s, '#e8eef2', .6)
          + `<ellipse cx="${x}" cy="${f(y - r * 1.4 - .6 * s)}" rx="${f(1.4 * s)}" ry="${f(1 * s)}" fill="none" stroke="#3a3e44" stroke-width="${f(.7 * s)}"/>`; }
      ch = fl + ch; }

    // ——— the boat on our side, her bow against the chain: fresh planks and a barrel of pitch, oars shipped
    let boat = '';
    { const bx = 104, by = 121, Lh = 42, rp = L.ramp('oak', bx, by - 5), ip = L.ramp('pine-deck', bx, by - 6), g = nid('bh', u), gi = nid('bi', u);
      const outer = `M${bx - Lh / 2} ${by - 9}Q${bx - Lh / 2 + 3} ${by - 1} ${bx - 6} ${by + .8}L${bx + Lh / 2 - 4} ${by + .6}Q${bx + Lh / 2} ${by - 2} ${bx + Lh / 2 + 1} ${by - 7.4}Q${bx} ${by - 4.4} ${bx - Lh / 2} ${by - 9}Z`;
      const inner = `M${bx - Lh / 2 + 1.4} ${by - 8.6}Q${bx} ${by - 4.6} ${bx + Lh / 2} ${by - 7.2}Q${bx} ${by - 9.6} ${bx - Lh / 2 + 1.4} ${by - 8.6}Z`;
      boat += `<defs>${linGrad(g, 0, by - 9, 0, by + 1, [[0, rp.lit], [.35, rp.half], [1, rp.shadow]])}${linGrad(gi, bx - Lh / 2, 0, bx + Lh / 2, 0, [[0, ip.shadow], [1, ip.half]])}</defs>`
        + `<path d="${inner}" fill="url(#${gi})"/>`;
      // the load: planks stacked along her (light fresh pine, end grain showing), a pitch barrel aft, a coil of rope
      for (let k = 0; k < 4; k++) { const y = by - 8.4 - k * 1.5, x0 = bx - 12 + k * .6, x1 = bx + 9 - k * .4;
        boat += `<path d="M${f(x0)} ${f(y)}L${f(x1)} ${f(y - .5)}l.8 -1.3L${f(x0 + .8)} ${f(y - 1.3)}Z" fill="${['#f0d4a0', '#e8c890', '#f4dcae', '#e4c088'][k]}" stroke="#7a5a30" stroke-width=".25"/>`
          + `<path d="M${f(x0)} ${f(y)}l.8 -1.3" stroke="#b08850" stroke-width=".5"/>`; }
      boat += K.shadeCyl(u, bx + 13.6, by - 6.4, bx + 13.6, by - 15.2, 3.4, L, 'tar', { bulge: .14, ell: .3, face: 2, outline: .3, seed: 3 })
        + ln(`M${bx + 10.2} ${by - 8.4}q3.4 1 6.8 0M${bx + 10.2} ${by - 13.2}q3.4 1 6.8 0`, .6, '#5a5e64');
      boat += `<path d="${outer}" fill="url(#${g})" stroke="${rp.outline}" stroke-width=".4"/>`
        + [3.2, 6].map(k => ln(`M${bx - Lh / 2 + k * .6} ${by - 9 + k * 1.2}Q${bx} ${by - 4.4 + k * 1.05} ${bx + Lh / 2 - k * .2} ${by - 7.4 + k * 1.1}`, .3, rp.outline, .6)).join('')
        + ln(`M${bx - Lh / 2} ${by - 9}Q${bx} ${by - 4.4} ${bx + Lh / 2 + 1} ${by - 7.4}`, .7, '#f4e0b8', .8);
      // the oars shipped along the gunwale, the painter from her stem made fast round the chain
      boat += K.shadeCyl(u, bx - 16, by - 9.8, bx + 22, by - 8.6, .5, L, 'oak', { outline: .2 })
        + ln(`M${bx - Lh / 2 + .6} ${by - 9}Q${bx - Lh / 2 - 3} ${by - 6} ${FL[0][0] + 3} ${FL[0][1] - 1.5}`, .5, '#7a6040', .9);
      boat += K.foam(u, { x: bx - 2, y: by + .8, w: Lh + 4, h: 1, seed: 12, L }); }

    // ——— the sea darkens under the glass; a few gulls over the entrance
    let fg = '';
    for (const [x, y, s] of [[146, 52, 1], [158, 47, .8]]) fg += `<path d="M${f(x - 3 * s)} ${f(y)}q${f(1.5 * s)} ${f(-1.6 * s)} ${f(3 * s)} 0q${f(1.5 * s)} ${f(-1.6 * s)} ${f(3 * s)} 0" stroke="#3a4450" stroke-width="${f(.45 * s)}" fill="none"/>`;
    fg += gloom(u, 100, 128, 100, 280, .45, '#06202a');
    return [bg + mid, tw + ch + boat + fg];
  } };
