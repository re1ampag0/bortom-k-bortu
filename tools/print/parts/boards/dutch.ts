// «Летучий голландец» — the material of its board: the sea floor. Turquoise-green sea-worn wood overgrown with barnacles
// and weed, corals; the close-up of the Dutchman's own side (A) with the rows lying on her parts: the Sails on the fore
// course, the Souls as glass flasks, the Crew on the rail, the Guns in the open ports of the upper tier (the kit's ports
// are laid at the cells' pitch for this picture only), the Hull on the planking. A wisp of a soul runs from the Souls
// to the Crew and the Hull (the frame prints the words). The back: her wreck on the sea floor in the same style.
// The interface is at the top of frame.ts; the helpers in paint.ts. B stays the simple material for now.
import type { Geo, Layers, Pal, Rect, ShipMaterial, WreckGeo } from './frame';
import { mix, planks, rng, sheet, simpleMaterial, wreckArt } from './paint';

const r = (n: number) => Math.round(n * 100) / 100;

// ---- colours ----
const C = {
  wood: '#1d3833', woodSeam: '#091714', woodGrain: '#2d5149', nails: '#6f8a78',
  band: '#173a33', hair: '#7fb3a0',
  barn: '#d3dbc8', barnSh: '#7d8f80', barnHole: '#22312b',
  weed: ['#2f6b47', '#3f7d4f', '#55854a', '#24543e'], weedRib: '#7fa86a',
  coral: ['#c86f5c', '#d99a63', '#e2c9a6', '#b65468', '#d4836c'], fan: '#9c5a6e',
  glass: '#3e7b6b', glassHi: '#ffffff', soulGlow: '#a6e3c8', wisp: '#c8f2de', wispDark: '#0b231e',
  port: '#08130f', portWood: '#24453d', portEdge: '#5c8c7c', iron: '#16211e'
};

// ---- small painted things (page mm) ----
function barnacle(x: number, y: number, R: number, rot = 0): string {
  return `<g transform="translate(${r(x)} ${r(y)}) rotate(${r(rot)})"><ellipse cx=".18" cy=".22" rx="${r(R)}" ry="${r(R * 0.86)}" fill="${C.barnHole}" fill-opacity=".55"/><ellipse rx="${r(R)}" ry="${r(R * 0.86)}" fill="${C.barnSh}"/><ellipse cx="${r(-R * 0.12)}" cy="${r(-R * 0.12)}" rx="${r(R * 0.82)}" ry="${r(R * 0.7)}" fill="${C.barn}"/>` +
    `<path d="M${r(-R * 0.62)} ${r(-R * 0.1)}L0 0M${r(R * 0.5)} ${r(-R * 0.45)}L0 0M${r(R * 0.3)} ${r(R * 0.55)}L0 0" stroke="${C.barnSh}" stroke-width="${r(R * 0.12)}"/><ellipse rx="${r(R * 0.36)}" ry="${r(R * 0.2)}" fill="${C.barnHole}"/></g>`;
}
/** a cluster of barnacles round (x, y) */
function barnacles(R: () => number, x: number, y: number, n: number, spread: number, size = 1): string {
  let out = '';
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * spread; out += barnacle(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, (0.45 + R() * 0.75) * size, R() * 180); }
  return out;
}
/** a kelp frond: a ribbon from (x, y) of length len, swaying; dir: -1 up, 1 down */
function kelp(R: () => number, x: number, y: number, len: number, wd: number, dir: number, color: string, op = 0.92): string {
  const n = 8, sway = (R() - 0.5) * 2, ph = R() * 6, L: [number, number][] = [], Rt: [number, number][] = [], mid: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, yy = y + dir * t * len, xx = x + Math.sin(t * 3.2 + ph) * 1.6 * t + sway * t * len * 0.25, hw = wd * (0.35 + Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05)) * 0.9) * (1 - t * 0.35);
    L.push([xx - hw, yy]); Rt.unshift([xx + hw, yy]); mid.push([xx, yy]);
  }
  const d = 'M' + L.concat(Rt).map(p => `${r(p[0])} ${r(p[1])}`).join('L') + 'Z';
  return `<path d="${d}" fill="${color}" fill-opacity="${op}" stroke="${mix(color, '#000000', 0.45)}" stroke-width=".18" stroke-linejoin="round"/><path d="M${mid.map(p => `${r(p[0])} ${r(p[1])}`).join('L')}" fill="none" stroke="${C.weedRib}" stroke-width=".16" stroke-opacity=".7"/>`;
}
/** a thin weed strand (stroke) */
function strand(R: () => number, x: number, y: number, len: number, dir: number, color: string, w = 0.5): string {
  const a = (R() - 0.5) * 5, b = (R() - 0.5) * 5;
  return `<path d="M${r(x)} ${r(y)}c${r(a)} ${r(dir * len * 0.35)} ${r(b)} ${r(dir * len * 0.65)} ${r((a + b) / 2)} ${r(dir * len)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}
/** a branching coral growing up from (x, y) */
function coral(R: () => number, x: number, y: number, h: number, color: string): string {
  let d = '', tips = '';
  const grow = (px: number, py: number, ang: number, len: number, w: number, depth: number) => {
    const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len, bend = (R() - 0.5) * len * 0.5;
    d += `<path d="M${r(px)} ${r(py)}q${r(Math.cos(ang) * len / 2 - Math.sin(ang) * bend)} ${r(Math.sin(ang) * len / 2 + Math.cos(ang) * bend)} ${r(ex - px)} ${r(ey - py)}" stroke-width="${r(w)}"/>`;
    if (depth <= 0 || len < 1.2) { tips += `<circle cx="${r(ex)}" cy="${r(ey)}" r="${r(w * 0.62)}"/>`; return; }
    const k = 2 + (R() < 0.35 ? 1 : 0);
    for (let i = 0; i < k; i++) grow(ex, ey, ang + (i - (k - 1) / 2) * (0.5 + R() * 0.35) + (R() - 0.5) * 0.3, len * (0.62 + R() * 0.2), w * 0.72, depth - 1);
  };
  grow(x, y, -Math.PI / 2 + (R() - 0.5) * 0.3, h * 0.36, h * 0.12, 3);
  const dark = mix(color, '#000000', 0.42);
  return `<g fill="none" stroke="${dark}" stroke-linecap="round" transform="translate(.35 .3)">${d}</g><g fill="none" stroke="${color}" stroke-linecap="round">${d}</g><g fill="${mix(color, '#ffffff', 0.35)}">${tips}</g>`;
}
/** a sea fan: a fan of veins with a mesh */
function seaFan(R: () => number, x: number, y: number, h: number, color: string): string {
  let d = '';
  const n = 9, rays: [number, number][][] = [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.17, pts: [number, number][] = []; for (let j = 0; j <= 5; j++) { const t = j / 5, l = h * t * (0.85 + R() * 0.25); pts.push([x + Math.cos(a) * l + Math.sin(t * 4 + i) * 0.4, y + Math.sin(a) * l]); } rays.push(pts); d += 'M' + pts.map(p => `${r(p[0])} ${r(p[1])}`).join('L'); }
  for (let j = 2; j <= 5; j++) { d += 'M' + rays.map(p => `${r(p[j][0])} ${r(p[j][1])}`).join('L'); }
  return `<path d="${d}" fill="none" stroke="${mix(color, '#000000', 0.35)}" stroke-width=".42" stroke-linejoin="round" stroke-linecap="round" transform="translate(.3 .3)"/><path d="${d}" fill="none" stroke="${color}" stroke-width=".3" stroke-linejoin="round" stroke-linecap="round"/>`;
}
/** a brain coral / sponge: a dome with wavy grooves */
function brain(R: () => number, x: number, y: number, w: number, color: string): string {
  const h = w * 0.55;
  let grooves = '';
  for (let i = 1; i < 5; i++) { const yy = y - h * i / 5; let d = `M${r(x - w / 2 * Math.sqrt(1 - (i / 5) ** 2) + 0.4)} ${r(yy)}`; const ww = w * Math.sqrt(1 - (i / 5) ** 2); for (let k = 0; k < 6; k++) d += `q${r(ww / 12)} ${r((R() - 0.5) * 1.4)} ${r(ww / 6 - 0.13)} 0`; grooves += d; }
  return `<path d="M${r(x - w / 2)} ${r(y)}a${r(w / 2)} ${r(h)} 0 0 1 ${r(w)} 0Z" fill="${color}" stroke="${mix(color, '#000000', 0.45)}" stroke-width=".3"/><path d="${grooves}" fill="none" stroke="${mix(color, '#000000', 0.3)}" stroke-width=".22"/>`;
}
/** a sea star */
function star(x: number, y: number, R0: number, rot: number, color: string): string {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? R0 * 0.42 : R0; d += `${i ? 'L' : 'M'}${r(x + Math.cos(a) * rad)} ${r(y + Math.sin(a) * rad)}`; }
  return `<path d="${d}Z" fill="${color}" stroke="${mix(color, '#000000', 0.45)}" stroke-width=".25" stroke-linejoin="round"/><circle cx="${r(x)}" cy="${r(y)}" r="${r(R0 * 0.18)}" fill="${mix(color, '#ffffff', 0.4)}"/>`;
}
/** a reef along a ground line from x0 to x1 at y: corals, fans, brains, kelp, a star, barnacles */
function reef(seed: number, x0: number, x1: number, y: number, h: number, ground: string): string {
  const R = rng(seed), back: string[] = [], mid: string[] = [], front: string[] = [];
  for (let x = x0 + 2; x < x1 - 2; x += 5 + R() * 6) {
    const kind = R();
    if (kind < 0.3) back.push(kelp(R, x, y, h * (0.7 + R() * 0.5), 0.9 + R() * 0.6, -1, C.weed[Math.floor(R() * C.weed.length)]));
    else if (kind < 0.5) back.push(seaFan(R, x, y, h * (0.55 + R() * 0.35), C.fan));
    else if (kind < 0.85) mid.push(coral(R, x, y, h * (0.5 + R() * 0.45), C.coral[Math.floor(R() * C.coral.length)]));
    else front.push(brain(R, x, y + 0.4, 5 + R() * 4, mix(C.coral[2], '#7a8a6a', 0.35)));
  }
  front.push(star(x0 + (x1 - x0) * (0.3 + R() * 0.4), y - 0.6, 2.4, R(), C.coral[4]));
  front.push(`<path d="M${r(x0 - 4)} ${r(y + 3)}C${r(x0 + 4)} ${r(y - 0.6)} ${r(x1 - 4)} ${r(y - 1.2)} ${r(x1 + 4)} ${r(y + 3)}Z" fill="${ground}"/>`);
  front.push(barnacles(R, x0 + 6, y - 0.6, 6, 4, 0.9) + barnacles(R, x1 - 8, y - 0.6, 5, 4, 0.9));
  return back.join('') + mid.join('') + front.join('');
}

// ---- the close-up: the kit ship baked into a JPEG (the logic of paint.ts closeUp, with the ports at the cells' pitch) ----
async function sideArt(g: Geo): Promise<string> {
  const P = g.zones.picture, kind = g.kind, K = g.kit, k = 0.7, crew = g.rows.find(rw => rw.key === 'crew')!, guns = g.rows.find(rw => rw.key === 'guns')!;
  const focus = 0, geo = K.shipGeom(kind, { x: 0, y: 0, scale: 1 }), railH = -geo.nearRail(focus)[1];
  const wl = 177, rail = crew.cy + 3.5, sMM = (wl - rail) / railH;
  const b = Math.ceil(Math.max(0, (P.w / k - 200) / 2, (P.h / k - 280) / 2)) + 2, toU = (mmX: number, mmY: number) => [(mmX - P.x) / k - b, (mmY - P.y) / k - b];
  const [sx, sy] = toU(P.x + P.w / 2 - focus * sMM, wl), [, hy] = toU(0, wl);
  const LIGHT = { time: 'fog', haze: 0.55, key: { type: 'moon', az: 210, el: 34, color: '#d6f2e4', power: 0.75 }, fill: { color: '#4f8676', power: 0.55 } };
  const L = K.makeLight(LIGHT, { horizon: hy - 30 });
  // the ports of both tiers at the pitch of the cells, one port right under every Guns cell (this picture only)
  const spec = K.SHIP_SPECS[kind] as unknown as { ports: { x0: number; x1: number; n: number; off?: number }[] }, saved = spec.ports;
  const pitch = 14.5 / sMM, X0 = focus + (guns.cells[0].cx - (P.x + P.w / 2)) / sMM, lo = Math.min(...saved.map(p => p.x0)), hi = Math.max(...saved.map(p => p.x1));
  const x0 = X0 - Math.floor((X0 - lo) / pitch) * pitch, n = Math.floor((hi - x0) / pitch) + 1;
  spec.ports = saved.map(p => ({ ...p, x0, x1: x0 + (n - 1) * pitch, n, off: 0 }));
  let shipSvg: string;
  try { shipSvg = K.ship('bo2' + kind, L, { kind, x: sx, y: sy, scale: sMM / k, sails: 'full', heel: 0, seed: 11, flip: false, detail: 'near' }); }
  finally { spec.ports = saved; }
  const W = 200 + 2 * b, H = 280 + 2 * b;
  // the haze behind: a green moonlit fog, a glow behind the fore course, fog banks low over the sea
  const fog = (K.fog as (u: string, L: unknown, o: Record<string, number>) => string)('bo2d', L, { y: hy - 40, h: 60, density: 0.5, seed: 4 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b685c"/><stop offset=".55" stop-color="#78a091"/><stop offset="1" stop-color="#a6c4b6"/></linearGradient>` +
    `<radialGradient id="bo2dglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e6f7ea" stop-opacity=".75"/><stop offset=".5" stop-color="#cfe9da" stop-opacity=".3"/><stop offset="1" stop-color="#cfe9da" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="bo2dsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6f66"/><stop offset="1" stop-color="#112d28"/></linearGradient></defs>` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2dsky)"/><ellipse cx="${r(sx + 60)}" cy="${r(hy - 120)}" rx="120" ry="90" fill="url(#bo2dglow)"/><rect x="${-b}" y="${r(hy)}" width="${W}" height="${r(H - hy - b)}" fill="url(#bo2dsea)"/>${fog}${shipSvg}</svg>`;
  const url = await g.art(`board-close-${kind}-a`, svg, b), id = `${g.uid}pc`;
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>`;
}

/** the open port round every Guns cell: a dark opening, a heavy rotten frame on the sides and below (thin on top —
 *  the number stands there), the ring bolts of the gun tackle */
function ports(g: Geo): string {
  const rw = g.rows.find(x => x.key === 'guns')!, R = rng(31);
  return rw.cells.map(c => {
    const m = 2.3, x = Math.max(10.2, c.x - m), y = c.y - 0.55, w = c.x + c.w + m - x, h = c.h + 0.55 + 0.7;
    const frame = `<path d="M${r(x)} ${r(y)}H${r(x + w)}V${r(y + h - 1)}q0 1 -1 1H${r(x + 1)}q-1 0 -1 -1Z" fill="${C.portWood}" stroke="${C.iron}" stroke-width=".3"/>` +
      `<path d="M${r(x + 0.4)} ${r(y + 0.6)}V${r(y + h - 0.6)}M${r(x + w - 0.4)} ${r(y + 0.6)}V${r(y + h - 0.6)}" stroke="${C.portEdge}" stroke-width=".3" stroke-linecap="round"/>` +
      `<rect x="${r(c.x - 0.6)}" y="${r(c.y - 0.3)}" width="${r(c.w + 1.2)}" height="${r(c.h + 0.75)}" rx="2.2" fill="${C.port}"/>`;
    const rings = [(x + c.x - 0.6) / 2, (x + w + c.x + c.w + 0.6) / 2].map(cx => `<circle cx="${r(cx)}" cy="${r(c.cy + 2.2)}" r=".55" fill="none" stroke="${C.iron}" stroke-width=".4"/><circle cx="${r(cx)}" cy="${r(c.cy + 1.4)}" r=".3" fill="${C.iron}"/>`).join('');
    return frame + rings + barnacles(R, x + w - 0.9, c.y + 2.2, 2, 0.6, 0.45) + barnacles(R, x + 0.9, c.y + c.h - 2.5, 2, 0.6, 0.45);
  }).join('');
}

/** the Souls drawn as glass flasks in their cells (over the frame's cells, under the marker; no word or number there) */
function flasks(g: Geo): string {
  const rw = g.rows.find(x => x.key === 'souls')!;
  return rw.cells.map(c => {
    const cx = c.cx, top = c.y, by = top + 8.15, br = 3.75, nw = 1.15, full = c.n === 0 ? 0 : Math.min(1, 0.25 + c.n * 0.15);
    const sh = Math.sqrt(br * br - nw * nw), body = `M${r(cx - nw)} ${r(top + 2.4)}V${r(by - sh)}A${br} ${br} 0 1 0 ${r(cx + nw)} ${r(by - sh)}V${r(top + 2.4)}Z`;
    const lvl = by + br - full * br * 1.55, liquid = full ? `<clipPath id="${g.uid}fl${c.n}"><path d="${body}"/></clipPath><rect clip-path="url(#${g.uid}fl${c.n})" x="${r(cx - br)}" y="${r(lvl)}" width="${r(2 * br)}" height="${r(by + br - lvl)}" fill="${C.soulGlow}" fill-opacity="${r(0.35 + full * 0.25)}"/><path clip-path="url(#${g.uid}fl${c.n})" d="M${r(cx - br)} ${r(lvl)}H${r(cx + br)}" stroke="${C.glass}" stroke-width=".22" stroke-opacity=".6"/>` : '';
    // the Kraken in the flask of the cell 3: a curled tentacle with suckers
    const kraken = c.n === 3 ? `<path d="M${r(cx - 2)} ${r(by + 2.6)}c.3 -2.2 2.9 -2.6 3.1 -.7c.15 1.3 -1.2 1.6 -1.6 .8" fill="none" stroke="${C.glass}" stroke-width=".7" stroke-linecap="round" stroke-opacity=".75"/>` + [[-1.5, 1.4], [-0.6, 0.5], [0.5, 0.4]].map(([dx, dy]) => `<circle cx="${r(cx + dx)}" cy="${r(by + dy)}" r=".18" fill="${C.glassHi}" fill-opacity=".9"/>`).join('') : '';
    return liquid + kraken + `<rect x="${r(cx - nw - 0.35)}" y="${r(top + 1.15)}" width="${r(2 * nw + 0.7)}" height="1.35" rx=".35" fill="#8a6a44" fill-opacity=".8"/>` +
      `<path d="${body}" fill="none" stroke="${C.glass}" stroke-width=".3" stroke-opacity=".8"/><path d="M${r(cx - br * 0.62)} ${r(by - br * 0.1)}a${r(br * 0.66)} ${r(br * 0.66)} 0 0 1 ${r(br * 0.45)} ${r(-br * 0.5)}" fill="none" stroke="${C.glassHi}" stroke-width=".35" stroke-linecap="round" stroke-opacity=".9"/>`;
  }).join('');
}

/** the wisp of a soul from the Souls down to the Crew and on to the Hull (the frame prints «1 Душа = 1 Корпус или 1 Команда») */
function wisp(g: Geo, soulsRight: number): string {
  const souls = g.rows.find(x => x.key === 'souls')!, crew = g.rows.find(x => x.key === 'crew')!, hull = g.rows.find(x => x.key === 'hull')!;
  const X = g.zones.mid.x - 1.7, y0 = souls.labelY - 1.1, xs = soulsRight + 2.2, yc = crew.labelY - 1.1, xc = X - 6, yh = hull.labelY - 0.6;
  const d = `M${r(xs)} ${r(y0)}H${r(X - 2)}q2 0 2 2V${r(yh - 3.6)}M${r(X)} ${r(yc - 2)}q0 2 -2 2H${r(xc + 1.4)}`;
  const head = (x: number, y: number, dir: 'l' | 'd') => dir === 'l' ? `M${r(x)} ${r(y)}l2.2 -1.35v2.7Z` : `M${r(x)} ${r(y)}l-1.35 -2.2h2.7Z`;
  const heads = head(xc, yc, 'l') + head(X, yh, 'd');
  const R = rng(9);
  let motes = '';
  for (let i = 0; i < 9; i++) { const t = R(), yy = y0 + 3 + t * (yh - y0 - 8); motes += `<circle cx="${r(X + (R() - 0.5) * 2.6)}" cy="${r(yy)}" r="${r(0.18 + R() * 0.25)}" fill="${C.wisp}" fill-opacity="${r(0.5 + R() * 0.4)}"/>`; }
  return `<path d="${d}" fill="none" stroke="${C.wispDark}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".8"/><path d="${heads}" fill="${C.wispDark}" stroke="${C.wispDark}" stroke-width=".9" stroke-linejoin="round" stroke-opacity=".8"/>` +
    `<path d="${d}" fill="none" stroke="${C.wisp}" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/><path d="${heads}" fill="${C.wisp}"/>${motes}`;
}

/** the growth on the sea-worn wood round the picture: barnacle crusts along the band, weed, the reef under the column */
function growth(g: Geo): string {
  const R = rng(17), out: string[] = [], W = g.page.w, P = g.zones.picture, col = g.zones.col;
  // barnacle crusts in the corners and along the band
  for (const [x, y, n, s] of [[13, 13, 14, 5], [W - 13, 13, 14, 5], [13, 195, 12, 5], [W - 13, 195, 16, 6], [200.7, 31.6, 6, 2.6], [200.7, 170.6, 7, 3]] as const) out.push(barnacles(R, x, y, n, s));
  for (let i = 0; i < 26; i++) { const t = R(); out.push(barnacle(col.x + 0.6, P.y + t * P.h, 0.4 + R() * 0.5, R() * 180)); }
  // the seam between the picture and the column: a rotten upright with weed hanging
  out.push(`<rect x="${r(P.x + P.w - 0.2)}" y="${r(P.y)}" width="${r(col.x - P.x - P.w + 0.4)}" height="${r(P.h)}" fill="${C.woodSeam}"/>`);
  for (let i = 0; i < 7; i++) out.push(strand(R, 200.6 + (R() - 0.5), P.y + 2 + R() * 18, 6 + R() * 10, 1, C.weed[i % 4], 0.45 + R() * 0.3));
  // weed and barnacles at the bottom corners (round the footer's field)
  for (let i = 0; i < 7; i++) out.push(kelp(R, 14 + i * 3.6 + R() * 2, 197, 5 + R() * 3, 0.55, -1, C.weed[i % 4]));
  for (let i = 0; i < 7; i++) out.push(kelp(R, W - 38 + i * 3.6 + R() * 2, 197, 5 + R() * 3, 0.55, -1, C.weed[(i + 2) % 4]));
  // the reef under the right column (the column's boxes are HTML on top: only the free rest shows)
  out.push(reef(5, col.x + 0.5, col.x + col.w - 0.5, P.y + P.h - 0.5, 30, '#2b443c'));
  return out.join('');
}

/** an outline round the picture: a dark moulding with a light hairline */
const moulding = (P: Rect) => `<rect x="${r(P.x - 0.5)}" y="${r(P.y - 0.5)}" width="${r(P.w + 1)}" height="${r(P.h + 1)}" rx="2.6" fill="none" stroke="${C.woodSeam}" stroke-width="1"/><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2" fill="none" stroke="${C.hair}" stroke-width=".22" stroke-opacity=".7"/>`;

const CFG = {
  wood: { base: C.wood, seam: C.woodSeam, grain: C.woodGrain, nails: C.nails }, band: C.band, hair: C.hair,
  sky: ['#a9c4bc', '#dfe9e2'] as [string, string], sea: ['#3d6e66', '#173832'] as [string, string], focus: 0, sails: 'full',
  chart: { paper: '#e8eadb', line: '#a9bfb2', coast: '#cbd6c0' }, brass: { light: '#e0d39a', mid: '#a89448', dark: '#4e4418' },
  note: '#fbfcf4', noteLine: '#8fb8a8', pin: '#2C6658',
  wreck: { water: ['#3a6a62', '#0f2a26'] as [string, string], sand: '#a6a488', sandDark: '#5e6250' }
};
const simple = simpleMaterial(CFG);

async function faceA(g: Geo): Promise<Layers> {
  const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 };
  // no dimming of the side: the frame lays tight plates under its words; the wisp starts where the Souls' label line ends
  const souls = g.rows.find(rw => rw.key === 'souls');
  const under = sheet(g, { band: C.band, line: C.hair, ground: C.wood, w: 1.4 }) + planks(F, { ...CFG.wood, h: 10.5, seed: 41 }) +
    await sideArt(g) + moulding(g.zones.picture) + growth(g) + ports(g) + (souls ? wisp(g, souls.lineEnd) : '');
  const s = g.scope;
  const css = `${s} .bo2-box{box-shadow:.6mm .8mm 0 rgba(6,22,19,.55);border-color:#93b5a6}`;
  return { under, over: flasks(g), css };
}

/** the back: the wreck on the sea floor; light from above, the reef in front, weed rising, bubbles from the hull */
async function back(w: WreckGeo): Promise<Layers> {
  const A = w.zones.art, R = rng(77), W = w.page.w;
  const art = await wreckArt(w, { water: ['#4b8277', '#0b2420'], sand: '#8f977c', sandDark: '#46503e', light: w.kit.LIGHTS.dutchman as Record<string, unknown>, heel: 18 });
  let rays = `<defs><linearGradient id="${w.uid}ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f8ee" stop-opacity=".4"/><stop offset="1" stop-color="#e6f8ee" stop-opacity="0"/></linearGradient><clipPath id="${w.uid}rc"><rect x="${A.x}" y="${A.y}" width="${A.w}" height="${A.h}" rx="2.4"/></clipPath></defs><g clip-path="url(#${w.uid}rc)">`;
  for (let i = 0; i < 6; i++) { const x = 150 + i * 24 + R() * 10, s0 = 3 + R() * 5; rays += `<path d="M${r(x)} ${A.y}h${r(s0)}l${r(-30 - R() * 20 + s0 * 3)} ${r(150 + R() * 30)}h${r(-s0 * 3)}Z" fill="url(#${w.uid}ray)"/>`; }
  // bubbles rising from the wreck
  for (let i = 0; i < 26; i++) { const x = 175 + R() * 70, y = A.y + 20 + R() * 120, rad = 0.3 + R() * 0.9; rays += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rad)}" fill="#dff5ea" fill-opacity=".18" stroke="#dff5ea" stroke-opacity=".7" stroke-width=".18"/>`; }
  // weed rising from the floor, a reef along the bottom
  for (let i = 0; i < 14; i++) { const x = A.x + 3 + R() * 46; rays += kelp(R, x, A.y + A.h, 30 + R() * 50, 1 + R() * 0.8, -1, C.weed[i % 4], 0.85); }
  for (let i = 0; i < 9; i++) { const x = A.x + A.w - 3 - R() * 30; rays += kelp(R, x, A.y + A.h, 20 + R() * 34, 0.9 + R() * 0.6, -1, C.weed[(i + 1) % 4], 0.85); }
  rays += reef(12, A.x, A.x + 70, A.y + A.h - 4, 28, '#7c8569') + reef(13, A.x + A.w - 64, A.x + A.w, A.y + A.h - 4, 24, '#7c8569') + reef(14, 104, 150, A.y + A.h - 2.5, 16, '#7c8569') + '</g>';
  const crust = barnacles(R, 14, 14, 12, 4.5) + barnacles(R, W - 14, 14, 12, 4.5) + barnacles(R, 14, 196, 12, 4.5) + barnacles(R, W - 14, 196, 14, 5);
  const frame = `<rect x="${r(A.x - 0.4)}" y="${r(A.y - 0.4)}" width="${r(A.w + 0.8)}" height="${r(A.h + 0.8)}" rx="2.6" fill="none" stroke="${C.woodSeam}" stroke-width=".9"/><rect x="${A.x}" y="${A.y}" width="${A.w}" height="${A.h}" rx="2.4" fill="none" stroke="${C.hair}" stroke-width=".22" stroke-opacity=".7"/>`;
  const under = sheet(w, { band: C.band, line: C.hair, ground: C.wood, w: 1.4 }) + art + rays + frame + crust;
  return { under };
}

export const material: ShipMaterial = {
  /** a sea-glass field, teal-black ink: the words still ≥ 7 : 1 */
  palette(base: Pal): Pal { return { ...base, field: '#f6f8ef', fieldLine: '#93b5a6', ink: '#12231f', soft: '#30463f', cell: '#fdfdf7' }; },
  a: faceA,
  b: simple.b,
  wreck: back
};
