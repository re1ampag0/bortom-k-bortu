// «Выкуп за пленников» (Месть королевы Анны, ПРИКАЗ: положите 2 Пороха в Трюм), refined from the first-round scene
// (portrait-revenge.cjs SCENES['Выкуп за пленников']): the ransom laid out on the harbour battery at sunset — an open
// chest of gold and two kegs of powder, the signed agreement weighted with a stone, the empty irons and the ring of
// keys hanging on a hook in the merlon (the prisoners are gone: the deal is done), the governor's flag over the wall,
// the masts of the ship waiting in the harbour beyond. Kept: all of that and the low view along the battery floor.
// Fixed against the first round: the wall was a flat brick strip and the things stood on its top edge in a row —
// now a 2,5D battery: the flagstone floor running to one vanishing point, the parapet of dressed stone and the two
// merlons with their inner faces in depth, the things standing on the floor at their own distances (the chest
// nearest, the kegs a little further), each with its shadow away from the sun; the masts were sticks — now the kit's
// Revenge at anchor, her hull just over the parapet, sails furled, stern lanterns lit; the flag stood on nothing —
// now on its staff in the right merlon, flying towards her bow. Light: the setting sun low behind her stern, right
// (key, contre-jour: rims on the chest, the gold, the kegs, the stone, long shadows towards us); the sunset sky (fill).
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, mix, nid, linGrad, radGrad, rng, lerp } = K;
const { glow, gloom, motes } = PK;

const HZ = 84, FOC = 140, EYE = .9, ZW = 5;                  // horizon; a low eye over the battery floor; the parapet's distance
const SUN = { x: 156, y: 72 };
const REV = { kind: 'revenge', x: 92, y: 88, scale: 1.0, sails: 'furled', seed: 6 };
const CHEST = { x: 96, y: 125, s: 1.7 }, KEGS = [{ x: 149, y: 118.6, s: 1.0, seed: 3 }, { x: 173, y: 122.4, s: 1.08, seed: 7 }];
const DEED = { x: 46, y: 126.4, s: 1.6 };
const light = { time: 'dusk', haze: .45, key: { type: 'sun', x: SUN.x, y: SUN.y, color: '#ffb46c', power: .9 },
  fill: { color: '#5e2c3a', power: .48 }, rim: { az: 40, color: '#ffc890', power: .65 } };
const skel = { horizon: HZ, eye: EYE, light: 'the setting sun low right behind her stern (key, contre-jour) + the sunset sky (fill)', items: [
  ['Revenge', 14, 88, 156, 90, 'harbour beyond the parapet, at anchor'], ['parapet', -10, 109, 220, 23, 'z = 5 m'],
  ['merlon L', -18, 109, 40, 45, 'on the parapet'], ['merlon R + flagstaff', 172, 109, 40, 100, 'on the parapet'],
  ['irons + keys', 0, 102, 30, 32, 'on a hook in merlon L'], ['chest', 76, CHEST.y, 48, 34, 'floor, z ≈ 3.5 m'],
  ['kegs', 136, 120, 42, 26, 'floor, z ≈ 3.7 m'], ['deed + stone', 36, DEED.y, 34, 12, 'floor, z ≈ 3.3 m'], ['flag', 146, 48, 46, 28, 'on its staff']] };

const P2 = p => `${f(p[0])} ${f(p[1])}`;
const pr = (X, Y, z) => [100 + X * FOC / z, HZ + (EYE - Y) * FOC / z];

module.exports = { name: 'Выкуп за пленников', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: EYE }), R = rng(43);
    L.pal = Object.assign({}, L.pal, { sky: ['#2a0c14', '#6a1e1e', '#c65a2c', '#f4b468'], sea: ['#e08a4a', '#5a2420', '#1a0a0a'], cloudLit: '#ffb878', cloudShade: '#4e1c26' });
    // ——— the sunset sky, the sun low over the harbour, the sea up to the parapet ———
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 4 }) + glow(u, SUN.x, SUN.y, 80, 46, '#ffd090', .4) + K.sunMoon(u, L, { r: 8 });
    for (const [x, y, w, h, sd, fr] of [[60, 30, 90, 8, 5, .3], [150, 44, 70, 6, 2, .45], [30, 66, 60, 4, 8, .65], [120, 74, 50, 3, 13, .75]]) bg += K.cloud(u, L, { x, y, w, h, seed: sd, far: fr });
    bg += K.water(u, L, { horizon: HZ, bottom: 112, swell: .4, seed: 7, glitter: SUN.x });
    // ——— the Revenge at anchor beyond the wall: sails furled, her stern lanterns lit ———
    bg += K.ship(u, L, Object.assign({ wake: false, reflect: true, lights: true }, REV));
    bg += K.localGlow(u, { x: SUN.x, y: SUN.y, color: '#ffc070', power: .45, radius: 40 }, { core: false });

    // ——— the battery: the parapet of dressed stone, the coping lit along its top by the sun behind ———
    let wall = '';
    const PH = .8, MH = 1.62;                                   // parapet and merlon heights (m)
    const stone = (pts, sd, tone) => { const Rs = rng(sd), t = tone || (.45 + Rs() * .3), c = mix('#4a3428', '#8a6a52', t), id = nid('st', u), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      return `<defs>${linGrad(id, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), [[0, mix(c, '#2a1810', .2), 1], [.6, c, 1], [1, mix(c, '#ffb070', .18), 1]])}</defs>`
        + `<path d="M${pts.map(P2).join('L')}Z" fill="url(#${id})" stroke="#1e120c" stroke-width=".45" stroke-linejoin="round"/>`
        + (Rs() < .6 ? `<path d="M${f(lerp(pts[0][0], pts[1][0], .2 + Rs() * .5))} ${f(pts[0][1] + 1)}l${f((Rs() - .5) * 3)} ${f(2 + Rs() * 3)}" stroke="#2a1810" stroke-width=".3" opacity=".7"/>` : ''); };
    // the face of the parapet: three courses of blocks, each course offset
    { const courses = [[0, .28], [.28, .55], [.55, PH]];
      courses.forEach(([y0, y1], ci) => { let X = -4.6 + (ci % 2) * .35;
        while (X < 4.6) { const w = .55 + R() * .45, a = pr(X, y0, ZW), b = pr(Math.min(X + w, 4.8), y1, ZW); wall += stone([[a[0], b[1]], [b[0], b[1]], [b[0], a[1]], [a[0], a[1]]], Math.round(X * 100 + ci * 7)); X += w; } }); }
    // the coping: a top slab standing a little proud, its top face seen from just below the eye, the sun along its edge
    { const a = pr(-4.8, PH, ZW - .08), b = pr(4.8, PH, ZW - .08), c = pr(4.8, PH + .1, ZW - .08), d = pr(-4.8, PH + .1, ZW - .08), e = pr(4.8, PH + .1, ZW + .5), g = pr(-4.8, PH + .1, ZW + .5);
      wall += `<path d="M${P2(d)}L${P2(c)}L${P2(e)}L${P2(g)}Z" fill="#5a3e2e"/><path d="M${P2(a)}L${P2(b)}L${P2(c)}L${P2(d)}Z" fill="#6a4a36" stroke="#1e120c" stroke-width=".4"/>`
        + `<path d="M${P2(g)}L${P2(e)}" stroke="#ffd09a" stroke-width=".8" opacity=".8"/>`;
      for (let X = -4.4; X < 4.8; X += .9 + R() * .3) { const p = pr(X, PH, ZW - .08), q = pr(X, PH + .1, ZW - .08); wall += `<path d="M${P2(p)}L${P2(q)}" stroke="#1e120c" stroke-width=".35"/>`; } }
    // the merlons: front face in blocks, the inner side face running into depth; the hook, the irons, the keys
    const merlon = (X0, X1, inner) => { let s = '', y = .9;
      const sideX = inner > 0 ? X1 : X0, sf = [pr(sideX, PH + .1, ZW - .08), pr(sideX, MH, ZW - .08), pr(sideX, MH, ZW + .6), pr(sideX, PH + .1, ZW + .6)];
      s += `<path d="M${sf.map(P2).join('L')}Z" fill="${inner > 0 ? '#3a2820' : '#7a5a44'}" stroke="#1e120c" stroke-width=".4"/>`;
      for (const yy of [1.15, 1.4]) { const p = pr(sideX, yy, ZW - .08), q = pr(sideX, yy, ZW + .6); s += `<path d="M${P2(p)}L${P2(q)}" stroke="#1e120c" stroke-width=".35"/>`; }
      for (const [y0, y1] of [[PH + .1, 1.15], [1.15, 1.4], [1.4, MH]]) { let X = X0 + (y0 > 1.1 && y0 < 1.3 ? -.3 : 0); while (X < X1) { const w = .6 + R() * .4, a = pr(Math.max(X, X0), y0, ZW - .1), b = pr(Math.min(X + w, X1), y1, ZW - .1); s += stone([[a[0], b[1]], [b[0], b[1]], [b[0], a[1]], [a[0], a[1]]], Math.round(X * 90 + y0 * 50)); X += w; } }
      const t0 = pr(X0, MH, ZW - .1), t1 = pr(X1, MH, ZW - .1), t2 = pr(X1, MH, ZW + .6), t3 = pr(X0, MH, ZW + .6);
      s += `<path d="M${P2(t0)}L${P2(t1)}L${P2(t2)}L${P2(t3)}Z" fill="#7a5a44"/><path d="M${P2(t0)}L${P2(t1)}" stroke="#ffc890" stroke-width=".7" opacity=".75"/>`;
      return s; };
    wall += merlon(-4.9, -2.7, 1) + merlon(2.7, 4.9, -1);
    // the flagstaff stepped in the right merlon and the governor's flag (its own pattern: a pale field, a blue cross,
    // a gold ring) flying to the left, rippling, lit through from the sun behind
    let flag = '';
    { const st = pr(3.75, MH, ZW + .25), top = [st[0] + .4, 14];
      flag += K.shadeCyl(u, st[0], st[1], top[0], top[1], 1.15, L, 'oak', { r1: 1.2, r2: .8, outline: .3, seed: 2 }) + K.shadeSphere(u, top[0], top[1] - 1, 1.6, L, 'brass', { outline: .25 });
      const fx0 = top[0] - 1, fy0 = 17, fw = 44, fh = 26, wav = (x, k) => Math.sin((fx0 - x) / fw * Math.PI * 2.2 + k) * 2.2 * ((fx0 - x) / fw);
      const edge = (y) => { const p = []; for (let i = 0; i <= 16; i++) { const x = fx0 - fw * i / 16; p.push([x, y + wav(x, 0) + (fx0 - x) * .06]); } return p; };
      const topE = edge(fy0), botE = edge(fy0 + fh), id = nid('fl', u), body = `M${topE.map(P2).join('L')}L${botE.slice().reverse().map(P2).join('L')}Z`, cid = nid('fc', u);
      flag += `<defs>${linGrad(id, fx0 - fw, 0, fx0, 0, [[0, '#e8d8b8', 1], [1, '#f4e6c8', 1]])}<clipPath id="${cid}"><path d="${body}"/></clipPath></defs>`
        + `<path d="${body}" fill="url(#${id})" stroke="#4a3a2a" stroke-width=".35"/><g clip-path="url(#${cid})">`;
      const mid = edge(fy0 + fh / 2), crossX = fx0 - fw * .42;
      flag += `<path d="M${mid.map(P2).join('L')}" stroke="#2a4a8a" stroke-width="4.6" fill="none"/>`
        + `<path d="M${f(crossX)} ${f(fy0 - 4)}L${f(crossX + .4)} ${f(fy0 + fh + 6)}" stroke="#2a4a8a" stroke-width="4.6"/>`;
      { const cy = fy0 + fh / 2 + wav(crossX, 0) + (fx0 - crossX) * .06; flag += `<ellipse cx="${f(crossX)}" cy="${f(cy)}" rx="5.4" ry="5.8" fill="none" stroke="#d8a840" stroke-width="1.5"/>`; }
      // the folds: light and shade across the cloth with the ripple, the sun shining through the near half
      for (let i = 0; i < 6; i++) { const x = fx0 - fw * (i + .5) / 6; flag += `<path d="M${f(x)} ${f(fy0 - 4)}V${f(fy0 + fh + 8)}" stroke="${i % 2 ? '#3a2410' : '#fff4d8'}" stroke-width="${f(fw / 9)}" opacity="${i % 2 ? .22 : .2}"/>`; }
      flag += `</g><path d="M${topE.map(P2).join('L')}" stroke="#ffe0b0" stroke-width=".5" fill="none" opacity=".7"/>`
        + `<path d="M${f(fx0)} ${fy0}L${f(top[0])} ${f(top[1] + 1)}M${f(fx0)} ${fy0 + fh}L${f(st[0] + .3)} ${f(fy0 + fh + 4)}" stroke="#2a1a10" stroke-width=".35"/>`; }

    // ——— the battery floor: flagstones in rows to the vanishing point, worn edges lit, a crack ———
    let floor = '';
    { const rows = [ZW - .05, 4.5, 4.05, 3.65, 3.3, 2.98, 2.7, 2.45, 2.2];
      for (let r = 0; r < rows.length - 1; r++) { const za = rows[r], zb = rows[r + 1]; let X = -6 + (r % 2) * .4;
        while (X < 6) { const w = .7 + R() * .5, a = pr(X, 0, za), b = pr(X + w, 0, za), c = pr(X + w, 0, zb), d = pr(X, 0, zb), t = .35 + R() * .35, col = mix('#3e2a20', '#7a5a46', t), id = nid('fs', u);
          floor += `<defs>${linGrad(id, 0, a[1], 0, d[1], [[0, mix(col, '#ffb070', .25), 1], [1, mix(col, '#1a0e0a', .3), 1]])}</defs><path d="M${P2(a)}L${P2(b)}L${P2(c)}L${P2(d)}Z" fill="url(#${id})" stroke="#1a0e0a" stroke-width="${f(.25 + .5 / zb)}"/>`
            + `<path d="M${P2(a)}L${P2(b)}" stroke="#ffc890" stroke-width=".35" opacity="${f(.25 + R() * .3)}"/>`;
          X += w; } }
      floor += `<path d="M${P2(pr(-1.2, 0, 3.4))}l4 3l-1 4l5 6" stroke="#1a0e0a" stroke-width=".4" fill="none" opacity=".7"/>`;
      // the parapet's shadow along its foot, and the long light from the embrasure between the merlons
      floor += `<path d="M${P2(pr(-6, 0, ZW))}L${P2(pr(6, 0, ZW))}L${P2(pr(6, 0, 4.4))}L${P2(pr(-6, 0, 4.4))}Z" fill="#1a0a0a" opacity=".35"/>`; }

    // ——— the things, nearest last: the kegs, the deed under its stone, the chest of gold, spilt coins ———
    let things = '';
    const shadowTo = (x, y, w, h, d) => K.castShadow(u, L, { x, y, w, h, horizon: HZ, d, opacity: .7 });
    for (const k of KEGS) things += shadowTo(k.x, k.y, 21 * k.s, 30 * k.s, 1);
    for (const k of KEGS) { things += K.barrel(u, L, { x: k.x, y: k.y, s: k.s, kind: 'powder', seed: k.seed });
      // a red mark painted on the stave: a burst (powder), no letters
      const c = [k.x - 1.6 * k.s, k.y - 15 * k.s];
      things += `<path d="M${f(c[0])} ${f(c[1] - 4 * k.s)}l${f(1.2 * k.s)} ${f(2.6 * k.s)}l${f(2.6 * k.s)} ${f(-.8 * k.s)}l${f(-1.6 * k.s)} ${f(2.2 * k.s)}l${f(2 * k.s)} ${f(2 * k.s)}l${f(-2.8 * k.s)} 0l${f(-1.4 * k.s)} ${f(2.6 * k.s)}l${f(-1 * k.s)} ${f(-2.6 * k.s)}l${f(-2.8 * k.s)} ${f(.4 * k.s)}l${f(1.8 * k.s)} ${f(-2 * k.s)}l${f(-1.6 * k.s)} ${f(-2.2 * k.s)}l${f(2.8 * k.s)} ${f(.6 * k.s)}Z" fill="#a82a1a" opacity=".85"/>`; }
    // the agreement, half unrolled, its seal on a ribbon; a fist-sized stone holding it down
    things += shadowTo(DEED.x, DEED.y, 19 * DEED.s, 3, .5) + K.scroll(u, L, { ...DEED, seal: true, rot: -4, seed: 5 })
      + shadowTo(DEED.x - 9, DEED.y - 1, 11, 7, 1) + K.rock(u, L, { x: DEED.x - 9, y: DEED.y - .6, w: 11, h: 7.6, seed: 4 });
    things += shadowTo(CHEST.x, CHEST.y, 30 * CHEST.s, 17 * CHEST.s, .35) + K.chest(u, L, { ...CHEST, open: true, gold: true, seed: 8 })
      + K.coins(u, L, { x: 134, y: 127.2, s: 1.35, n: 7, seed: 3 }) + K.coins(u, L, { x: 64, y: 127.6, s: 1.2, n: 4, seed: 9 });
    // the gold's glint back at the sun
    things += K.localGlow(u, { x: CHEST.x + 6, y: CHEST.y - 30, color: '#ffd878', power: .45, radius: 24 }, { core: false });
    // the hook in the left merlon: the empty irons on their chain, the ring of keys
    { const hk = [10, 78]; let hs = '';
      hs += `<rect x="${hk[0] - 2}" y="${hk[1] - 2}" width="4" height="3.4" rx=".6" fill="#241c1a" stroke="#0a0808" stroke-width=".3"/><path d="M${hk[0]} ${hk[1] + 1}q0 4 3 4.4q3 0 3 -3" stroke="#1a1414" stroke-width="1.4" fill="none"/><path d="M${hk[0]} ${hk[1] + 1}q0 4 3 4.4q3 0 3 -3" stroke="#6a5a54" stroke-width=".5" fill="none"/>`;
      const hang = [hk[0] + 3, hk[1] + 5.2];
      hs += K.chain(u, L, [hang, [hang[0] - 1, hang[1] + 6], [hang[0] - 3, hang[1] + 12]], { link: 3, seed: 2 })
        + K.chain(u, L, [hang, [hang[0] + 2, hang[1] + 7], [hang[0] + 5, hang[1] + 13]], { link: 3, seed: 4 });
      const cuff = (c, rx, ry, rot, open) => { const id = nid('cf', u), arc = open ? `M${f(c[0] - rx)} ${f(c[1])}A${rx} ${ry} 0 1 1 ${f(c[0] + rx * .2)} ${f(c[1] + ry * .98)}` : `M${f(c[0] - rx)} ${f(c[1])}A${rx} ${ry} 0 1 1 ${f(c[0] - rx)} ${f(c[1] + .01)}`;
        return `<defs>${linGrad(id, c[0] - rx, c[1] - ry, c[0] + rx, c[1] + ry, [[0, '#2a2220', 1], [.6, '#4a3e3a', 1], [1, '#b08a6a', 1]])}</defs><g transform="rotate(${rot} ${f(c[0])} ${f(c[1])})"><path d="${arc}" fill="none" stroke="#080606" stroke-width="2.6"/><path d="${arc}" fill="none" stroke="url(#${id})" stroke-width="1.7"/></g>`
          + K.shadeSphere(u, c[0] - rx * .9, c[1] - ry * .3, .8, L, 'iron', { outline: .15 }); };
      hs += cuff([hang[0] - 3.4, hang[1] + 16], 3, 3.6, 10, false) + cuff([hang[0] + 6, hang[1] + 17], 3, 3.6, -16, true);
      // the key ring on its own nail, three big keys
      const kr = [hk[0] + 14, hk[1] + 6];
      hs += `<circle cx="${kr[0]}" cy="${kr[1] - 4}" r=".9" fill="#241c1a"/><circle cx="${kr[0]}" cy="${kr[1]}" r="3" fill="none" stroke="#4a3010" stroke-width="1.2"/><circle cx="${kr[0]}" cy="${kr[1]}" r="3" fill="none" stroke="url(#brass${u})" stroke-width=".7"/>`;
      for (const [a, l] of [[-22, 11], [6, 13], [30, 10]]) hs += `<g transform="translate(${kr[0]} ${kr[1] + 3}) rotate(${a})"><circle cx="0" cy="1.6" r="1.6" fill="none" stroke="#4a3010" stroke-width="1"/><circle cx="0" cy="1.6" r="1.6" fill="none" stroke="url(#brass${u})" stroke-width=".55"/>`
        + `<path d="M0 3.2V${l}" stroke="#4a3010" stroke-width="1.1"/><path d="M0 3.2V${l}" stroke="url(#brass${u})" stroke-width=".55"/><path d="M0 ${l - 2.6}h2.4v1.2h-1.2v1.4h-1.2" fill="url(#brass${u})" stroke="#4a3010" stroke-width=".3"/></g>`;   things += `<g transform="translate(${hk[0]} ${hk[1]}) scale(1.45) translate(${-hk[0]} ${-hk[1]})">${hs}</g>`; }

    // ——— the air: the sun's haze over the wall, motes, the dark coming up from the floor ———
    const air = glow(u, SUN.x, SUN.y + 6, 90, 30, '#ffb070', .18) + motes(16, 120, 60, 80, 40, '#ffe0b0', 7)
      + gloom(u, 100, 60, 0, 0, .3) + gloom(u, 100, 120, 100, 280, .5, '#140608');
    return [bg + wall + flag, floor + things + air];
  } };
