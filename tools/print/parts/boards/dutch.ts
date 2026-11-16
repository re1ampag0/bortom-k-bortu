// «Летучий голландец» — the material of its board: the sea floor. Turquoise-green sea-worn wood overgrown with barnacles
// and weed, corals; the close-up of the Dutchman's own side (A) with the rows lying on her parts: the Sails on the fore
// course, the Souls as glass flasks, the Crew on the cap rail, the Guns and the Volley cells in painted open ports (the
// kit's ports and bare ribs are off for this picture: at the cells' pitch they read as a fence), the Hull on the planking. A wisp of a soul runs from the Souls
// to the Crew and the Hull (the frame prints the words). The back: her wreck on the sea floor in the same style.
// B — the captain's table drowned on the sea floor: a waterlogged sea chart, tarnished brass rulers under the Guns and the
// Hull, knotted lines under the Sails and the Crew, the Souls as flasks on a sea-worn shelf, the engraving in a barnacled
// brass frame, notes pinned on the chart, dividers and shells beside the engraving.
// The interface is at the top of frame.ts; the helpers in paint.ts.
import type { Geo, Layers, Pal, Rect, ShipMaterial, WreckGeo } from './frame';
import { brassRuler, chart, compass, engraving, mix, planks, rng, rope, sheet, wreckArt } from './paint';

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
  const LIGHT = { time: 'fog', haze: 0.35, key: { type: 'moon', az: 210, el: 34, color: '#d6f2e4', power: 0.75 }, fill: { color: '#4f8676', power: 0.55 } };
  const L = K.makeLight(LIGHT, { horizon: hy - 30 });
  // this picture only: no kit ports and no bare ribs — the ribs at the cells' pitch over the whole side read as a fence;
  // the ports are painted round the Guns and the Volley cells (ports()), the side is planking, wales and growth
  const spec = K.SHIP_SPECS[kind] as unknown as { ports: { n: number }[]; ribs?: number[] }, saved = spec.ports, ribs = spec.ribs;
  spec.ports = saved.map(p => ({ ...p, n: 0 })); spec.ribs = undefined;
  let shipSvg: string;
  try { shipSvg = K.ship('bo2' + kind, L, { kind, x: sx, y: sy, scale: sMM / k, sails: 'full', heel: 0, seed: 11, flip: false, detail: 'near' }); }
  finally { spec.ports = saved; spec.ribs = ribs; }
  const W = 200 + 2 * b, H = 280 + 2 * b;
  // the haze behind: a green moonlit fog, a glow behind the fore course, fog banks low over the sea
  const fog = (K.fog as (u: string, L: unknown, o: Record<string, number>) => string)('bo2d', L, { y: hy - 40, h: 60, density: 0.3, seed: 4 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16302a"/><stop offset=".55" stop-color="#2b4d44"/><stop offset="1" stop-color="#4d7468"/></linearGradient>` +
    `<radialGradient id="bo2dglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e6f7ea" stop-opacity=".45"/><stop offset=".5" stop-color="#cfe9da" stop-opacity=".16"/><stop offset="1" stop-color="#cfe9da" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="bo2dsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6f66"/><stop offset="1" stop-color="#112d28"/></linearGradient></defs>` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2dsky)"/><ellipse cx="${r(sx + 60)}" cy="${r(hy - 120)}" rx="120" ry="90" fill="url(#bo2dglow)"/><rect x="${-b}" y="${r(hy)}" width="${W}" height="${r(H - hy - b)}" fill="url(#bo2dsea)"/>${fog}${shipSvg}</svg>`;
  const url = await g.art(`board-close-${kind}-a`, svg, b), id = `${g.uid}pc`;
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>`;
}

/** the Dutchman's side close up, over the picture (mm): the cap rail at the foot of the Crew cells (it also closes the
 *  gap between «Под водой» and «Всплыл»), the planking below it with its seams and butts, a wale under the Guns, weed
 *  hanging off the rail */
function hullSide(g: Geo): string {
  const P = g.zones.picture, crew = g.rows.find(x => x.key === 'crew')!, guns = g.rows.find(x => x.key === 'guns')!, hull = g.rows.find(x => x.key === 'hull')!, R = rng(53);
  const rail = crew.cy + 3.5, top = rail + 2.2, bottom = P.y + P.h, out: string[] = [];
  // the planking: strakes of sea-worn wood, a shade apart, dark seams, butt joints with treenails, slime at the seams
  for (let y = top, i = 0; y < bottom; y += 4.4, i++) {
    out.push(`<rect x="${r(P.x)}" y="${r(y)}" width="${r(P.w)}" height="4.4" fill="${i % 2 ? '#0c1f1b' : '#3d5e55'}" fill-opacity="${r(0.12 + R() * 0.1)}"/>`);
    out.push(`<path d="M${r(P.x)} ${r(y)}H${r(P.x + P.w)}" stroke="${C.woodSeam}" stroke-width=".35" stroke-opacity=".75"/><path d="M${r(P.x)} ${r(y + 0.4)}H${r(P.x + P.w)}" stroke="#a9c7b8" stroke-width=".18" stroke-opacity=".3"/>`);
    for (let x = P.x + R() * 40; x < P.x + P.w; x += 38 + R() * 30) out.push(`<path d="M${r(x)} ${r(y)}v4.4" stroke="${C.woodSeam}" stroke-width=".3" stroke-opacity=".7"/><circle cx="${r(x + 1.2)}" cy="${r(y + 2.2)}" r=".35" fill="${C.nails}"/>`);
  }
  // the wale under the Guns: a heavy timber, lit on top
  const wy = guns.cells[0].y + guns.cells[0].h + (hull.top - guns.cells[0].y - guns.cells[0].h) / 2 - 1.4;
  out.push(`<rect x="${r(P.x)}" y="${r(wy)}" width="${r(P.w)}" height="2.8" fill="#1f3a33"/><path d="M${r(P.x)} ${r(wy + 0.35)}H${r(P.x + P.w)}" stroke="#a9c7b8" stroke-width=".35" stroke-opacity=".65"/><path d="M${r(P.x)} ${r(wy + 2.8)}H${r(P.x + P.w)}" stroke="${C.woodSeam}" stroke-width=".5"/>`);
  // the cap rail: pale weathered timber, a dark shadow under it, weed hanging off it
  out.push(`<rect x="${r(P.x)}" y="${r(rail - 2.6)}" width="${r(P.w)}" height="4.8" fill="#8fa596"/><path d="M${r(P.x)} ${r(rail - 2.2)}H${r(P.x + P.w)}" stroke="#d6e6dc" stroke-width=".45"/><path d="M${r(P.x)} ${r(rail + 2.2)}H${r(P.x + P.w)}" stroke="${C.woodSeam}" stroke-width=".7"/>`);
  for (let x = P.x + R() * 9; x < P.x + P.w; x += 9 + R() * 14) out.push(`<path d="M${r(x)} ${r(rail - 2.6)}v4.8" stroke="#5f7a6c" stroke-width=".25"/>`);
  for (let i = 0; i < 16; i++) out.push(strand(R, P.x + 4 + R() * (P.w - 8), rail + 2.2, 3 + R() * 6, 1, C.weed[i % 4], 0.4 + R() * 0.3));
  return out.join('');
}

/** the open port round every Guns cell: a dark opening, a heavy rotten frame on the sides and below (thin on top —
 *  the number stands there), the ring bolts of the gun tackle */
function ports(g: Geo): string {
  const rw = g.rows.find(x => x.key === 'guns')!, R = rng(31), cells: Rect[] = [...rw.cells, ...g.slots.filter(s => s.kind === 'volley' || s.kind === 'volley2')];
  return cells.map(c => {
    const cy = c.y + c.h / 2;
    const m = 2.3, x = Math.max(10.2, c.x - m), y = c.y - 0.55, w = c.x + c.w + m - x, h = c.h + 0.55 + 0.7;
    const frame = `<path d="M${r(x)} ${r(y)}H${r(x + w)}V${r(y + h - 1)}q0 1 -1 1H${r(x + 1)}q-1 0 -1 -1Z" fill="${C.portWood}" stroke="${C.iron}" stroke-width=".3"/>` +
      `<path d="M${r(x + 0.4)} ${r(y + 0.6)}V${r(y + h - 0.6)}M${r(x + w - 0.4)} ${r(y + 0.6)}V${r(y + h - 0.6)}" stroke="${C.portEdge}" stroke-width=".3" stroke-linecap="round"/>` +
      `<rect x="${r(c.x - 0.6)}" y="${r(c.y - 0.3)}" width="${r(c.w + 1.2)}" height="${r(c.h + 0.75)}" rx="2.2" fill="${C.port}"/>`;
    const rings = [(x + c.x - 0.6) / 2, (x + w + c.x + c.w + 0.6) / 2].map(cx => `<circle cx="${r(cx)}" cy="${r(cy + 2.2)}" r=".55" fill="none" stroke="${C.iron}" stroke-width=".4"/><circle cx="${r(cx)}" cy="${r(cy + 1.4)}" r=".3" fill="${C.iron}"/>`).join('');
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
  wreck: { water: ['#3a6a62', '#0f2a26'] as [string, string], sand: '#a6a488', sandDark: '#5e6250' }
};

async function faceA(g: Geo): Promise<Layers> {
  const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 };
  // no dimming of the side: the frame lays tight plates under its words; the wisp starts where the Souls' label line ends
  const souls = g.rows.find(rw => rw.key === 'souls');
  const under = sheet(g, { band: C.band, line: C.hair, ground: C.wood, w: 1.4 }) + planks(F, { ...CFG.wood, h: 10.5, seed: 41 }) +
    await sideArt(g) + hullSide(g) + moulding(g.zones.picture) + growth(g) + ports(g) + (souls ? wisp(g, souls.lineEnd) : '');
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

// ---- B: the drowned captain's table ----
const T = {
  paper: '#e1e9dc', chartLine: '#a2bbae', coast: '#d8e2d2', stain: '#d6dfcd', stainLine: '#b2c1a6',
  brass: { light: '#d8cf96', mid: '#9a9150', dark: '#424420' }, verd: ['#5f9f88', '#7dbca3', '#4b8571'],
  rope: '#a3a07a', ropeDark: '#3f4531', ring: '#8fa596',
  shelf: '#2a4a42', shelfTop: '#4f7a6c', shelfDark: '#0f221d',
  note: '#f6f8ef', noteLine: '#93b5a6', pin: '#6f9a82', pinDark: '#22392f', shadow: '#0c2420',
  shell: '#efe2cc', shellLine: '#9c7f62', conch: '#e7c7a4', ink: '#173630'
};

/** verdigris on tarnished brass: soft blotches along a bar */
function verdigris(R: () => number, x: number, y: number, w: number, h: number, n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) { const cx = x + R() * w, cy = y + R() * h, rx = 0.8 + R() * 2.4; out += `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(Math.min(h / 2, rx * (0.4 + R() * 0.4)))}" fill="${T.verd[i % 3]}" fill-opacity="${r(0.45 + R() * 0.35)}"/>`; }
  return out;
}
/** a tarnished brass ruler under a row: the cells stand on it, it shows between them and at its ends */
function oldRuler(g: Geo, key: string, i: number): string {
  const rw = g.rows.find(x => x.key === key);
  if (!rw) return '';
  const c0 = rw.cells[0], cl = rw.cells[rw.cells.length - 1], x = rw.x0 - 1.4, y = c0.y - 0.7, w = cl.x + cl.w + 2.2 - x, h = c0.h + 1.6, R = rng(60 + i);
  return brassRuler(x, y, w, h, { ...T.brass, id: `${g.uid}or${i}` }) + verdigris(R, x + 0.5, y + 0.4, w - 1, h - 0.8, Math.round(w / 6)) + barnacles(R, x + w - 1.2, y + h - 2, 4, 1.4, 0.55);
}
/** a knotted line behind a row (a sounding line): from an iron ring on the frame's band to a whipped end */
function line(g: Geo, key: string): { under: string; over: string } {
  const rw = g.rows.find(x => x.key === key);
  if (!rw) return { under: '', over: '' };
  const cy = rw.cy, cl = rw.cells[rw.cells.length - 1], x2 = cl.x + cl.w + 1.6, o = { color: T.rope, dark: T.ropeDark, w: 1.7 };
  const ring = `<circle cx="9.9" cy="${r(cy)}" r="1.15" fill="none" stroke="${T.ring}" stroke-width=".55"/>`;
  const whip = `<path d="M${r(x2 - 1.2)} ${r(cy - 0.95)}v1.9M${r(x2 - 0.6)} ${r(cy - 0.95)}v1.9" stroke="${T.ropeDark}" stroke-width=".35"/><path d="M${r(x2)} ${r(cy)}l.8 -.5M${r(x2)} ${r(cy)}l.9 .1M${r(x2)} ${r(cy)}l.7 .6" stroke="${T.rope}" stroke-width=".3" stroke-linecap="round"/>`;
  const knots = rw.cells.slice(1).map((c, j) => {
    const kx = (rw.cells[j].x + rw.cells[j].w + c.x) / 2;
    return `<g transform="translate(${r(kx)} ${r(cy)})"><ellipse rx="1.3" ry="1.65" fill="${T.rope}" stroke="${T.ropeDark}" stroke-width=".28"/><path d="M-1.1 -.7q1.1 -.4 2.2 .3M-1.15 .2q1.15 -.45 2.3 .35M-.9 1q.9 -.3 1.8 .2" fill="none" stroke="${T.ropeDark}" stroke-width=".22" stroke-linecap="round"/></g>`;
  }).join('');
  return { under: rope(10.6, cy, x2, cy, o) + ring + whip, over: knots };
}
/** the sea-worn shelf the Souls' flasks stand on */
function shelf(g: Geo): string {
  const rw = g.rows.find(x => x.key === 'souls');
  if (!rw) return '';
  const c0 = rw.cells[0], cl = rw.cells[rw.cells.length - 1], x = rw.x0 - 1.2, y = c0.y + c0.h - 1.4, w = cl.x + cl.w + 2.2 - x, h = 2.5, R = rng(71);
  return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${h}" rx=".5" fill="${T.shelf}" stroke="${T.shelfDark}" stroke-width=".3"/><path d="M${r(x + 0.4)} ${r(y + 0.45)}H${r(x + w - 0.4)}" stroke="${T.shelfTop}" stroke-width=".45" stroke-linecap="round"/>` +
    `<path d="M${r(x + 8)} ${r(y + 1.5)}q14 .4 30 -.1M${r(x + 46)} ${r(y + 1.7)}q12 -.3 26 .2" fill="none" stroke="${C.woodGrain}" stroke-width=".25"/>` +
    barnacles(R, x + w - 1.6, y + 1.2, 4, 1.2, 0.5) + barnacles(R, x + 1.6, y + 1.4, 2, 0.8, 0.45) + strand(R, x + w - 0.8, y + h - 0.2, 3.8, 1, C.weed[1], 0.45);
}
/** a tide mark on the waterlogged chart: a pale blot with a darker ring */
function tideMark(R: () => number, cx: number, cy: number, rx: number, ry: number): string {
  let d = '';
  const n = 14;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = 0.86 + R() * 0.24; d += `${i ? 'L' : 'M'}${r(cx + Math.cos(a) * rx * k)} ${r(cy + Math.sin(a) * ry * k)}`; }
  return `<path d="${d}Z" fill="${T.stain}" fill-opacity=".55" stroke="${T.stainLine}" stroke-width=".35" stroke-linejoin="round"/>`;
}
/** tarnished brass dividers lying on the chart */
function dividers(x: number, y: number, k: number): string {
  const leg = (ex: number, ey: number) => `<path d="M${r(x)} ${r(y)}L${r(ex)} ${r(ey)}" stroke="${T.brass.dark}" stroke-width="${r(1.5 * k)}" stroke-linecap="round"/><path d="M${r(x)} ${r(y)}L${r(ex)} ${r(ey)}" stroke="${T.brass.mid}" stroke-width="${r(1 * k)}" stroke-linecap="round"/><path d="M${r(x)} ${r(y)}L${r(x + (ex - x) * 0.7)} ${r(y + (ey - y) * 0.7)}" stroke="${T.brass.light}" stroke-width="${r(0.3 * k)}" stroke-linecap="round"/>`;
  const R = rng(83);
  return `<g>${leg(x + 9 * k, y + 19 * k)}${leg(x + 16 * k, y + 15 * k)}<circle cx="${r(x)}" cy="${r(y)}" r="${r(1.9 * k)}" fill="${T.brass.mid}" stroke="${T.brass.dark}" stroke-width=".3"/><circle cx="${r(x)}" cy="${r(y)}" r="${r(0.6 * k)}" fill="${T.brass.dark}"/>${verdigris(R, x - 1 * k, y + 1 * k, 8 * k, 6 * k, 4)}</g>`;
}
/** a scallop shell (hinge at the bottom) */
function scallop(x: number, y: number, s: number, rot: number): string {
  let ribs = '';
  for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.86 + i * Math.PI * 0.72 / 8; ribs += `M0 0L${r(Math.cos(a) * 5 * s)} ${r(Math.sin(a) * 5 * s)}`; }
  const fan = `M0 0L${r(Math.cos(-Math.PI * 0.88) * 5.2 * s)} ${r(Math.sin(-Math.PI * 0.88) * 5.2 * s)}A${r(5.2 * s)} ${r(5.2 * s)} 0 0 1 ${r(Math.cos(-Math.PI * 0.12) * 5.2 * s)} ${r(Math.sin(-Math.PI * 0.12) * 5.2 * s)}Z`;
  return `<g transform="translate(${r(x)} ${r(y)}) rotate(${rot})"><path d="${fan}" fill="${T.shell}" stroke="${T.shellLine}" stroke-width=".3" stroke-linejoin="round"/><path d="${ribs}" stroke="${T.shellLine}" stroke-width=".22"/><path d="M${r(-1.4 * s)} ${r(0.2 * s)}h${r(2.8 * s)}l${r(-0.5 * s)} ${r(-1.1 * s)}h${r(-1.8 * s)}Z" fill="${T.shell}" stroke="${T.shellLine}" stroke-width=".25"/></g>`;
}
/** a conch: a cone with a spiral */
function conch(x: number, y: number, s: number, rot: number): string {
  return `<g transform="translate(${r(x)} ${r(y)}) rotate(${rot}) scale(${s})"><path d="M0 -4C2.6 -3.4 3.6 -1 3 1.2C2.4 3 .6 4 -.4 6.4L-1.2 3.2C-2.8 2.4 -3.4 .2 -2.4 -1.8C-1.8 -3.2 -1 -3.9 0 -4Z" fill="${T.conch}" stroke="${T.shellLine}" stroke-width=".3" stroke-linejoin="round"/>` +
    `<path d="M-2.2 -1.4q2.2 -1.2 4.8 .2M-2.3 .6q2.4 -.7 5 .4M-1.3 2.6q1.6 -.4 3.4 .2" fill="none" stroke="${T.shellLine}" stroke-width=".22"/><path d="M-.2 -4q-.8 -1 .2 -1.6q.9 .5 .2 1.6" fill="${T.conch}" stroke="${T.shellLine}" stroke-width=".22"/></g>`;
}
/** a pin in a note (Layers.over: only on an edge of a field, where no word stands) */
const pin = (x: number, y: number) => `<circle cx="${r(x + 0.35)}" cy="${r(y + 0.45)}" r="1.2" fill="${T.shadow}" fill-opacity=".35"/><circle cx="${r(x)}" cy="${r(y)}" r="1.15" fill="${T.pin}" stroke="${T.pinDark}" stroke-width=".3"/><circle cx="${r(x - 0.35)}" cy="${r(y - 0.35)}" r=".35" fill="#ffffff" fill-opacity=".8"/>`;

async function faceB(g: Geo): Promise<Layers> {
  const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 }, W = g.page.w, R = rng(91), z = g.zones, s = g.scope;
  const crew = g.rows.find(rw => rw.key === 'crew'), guns = g.rows.find(rw => rw.key === 'guns');
  // the rose sits in the free chart right of the Crew (between its label line and the Guns' label)
  const rose: [number, number] = crew && guns ? [z.mid.x - 14, (crew.labelY + 1 + guns.labelY - 3.4) / 2] : [158, 120];
  const roseR = crew && guns ? Math.min(9.5, (guns.labelY - 3.4 - crew.labelY - 1) / 2) : 0;
  const stains = tideMark(R, 86, 72, 13, 6) + tideMark(R, 160, 96, 30, 22) + tideMark(R, 70, 140, 16, 5) + tideMark(R, 254, 158, 26, 9);
  const soundings = [0, 1, 2].map(i => `<path d="M${r(60 + i * 9)} 31${'q3 -1.2 6 0t6 0'.repeat(8)}" fill="none" stroke="${T.chartLine}" stroke-width=".25" stroke-dasharray="1.6 1"/>`).join('');
  // the free rest of the right column, round the engraving: dividers on the left, shells and a coral on the right
  // (the column's boxes are HTML on top: if they grow, they cover these, never the other way round)
  const cb = z.col.y + z.col.h;
  const table = dividers(205, cb - 19, 0.95) + scallop(273, cb - 4.5, 1.05, -14) + conch(282.5, cb - 7, 0.85, 24) + coral(R, 266, cb - 0.6, 9, C.coral[0]) + barnacles(R, 279, cb - 1.4, 4, 1.6, 0.55) + star(214, cb - 3, 2.2, 0.4, C.coral[4]);
  // the frame's light fields lie on the chart as notes: a hard shadow under each
  const m = z.mid, fire = g.boxes[0], side = g.boxes.filter(b => b.w < 60 && b !== fire), st = z.strip, ft = z.footer;
  const shadowed = [fire, ...side, { x: z.header.x - 0.4, y: z.header.y - 0.4, w: z.header.w + 0.8, h: z.header.h + 0.8 }, { x: st.x - 0.6, y: st.y - 1.2, w: st.w + 1.2, h: st.h + 2.4 },
    { x: ft.x + 29.4, y: ft.y - 0.8, w: ft.w - 58.8, h: ft.h + 1.6 }, { x: m.x - 0.4, y: m.y - 1, w: m.w + 0.8, h: 6.4 }];
  const shadows = shadowed.map(b => `<rect x="${r(b.x + 0.6)}" y="${r(b.y + 0.8)}" width="${r(b.w)}" height="${r(b.h)}" rx="2" fill="${T.shadow}" fill-opacity=".3"/>`).join('');
  // the sea-worn edge: barnacles along the band, crusts in the corners, weed and a little reef at the bottom corners
  let edge = '';
  for (let i = 0; i < 90; i++) { const t = R(), side4 = Math.floor(R() * 4), x = side4 < 2 ? 9 + t * (W - 18) : side4 === 2 ? 9.2 : W - 9.2, y = side4 < 2 ? (side4 ? 200.9 : 9.5) : 9 + t * 192; edge += barnacle(side4 === 2 ? 9.5 : side4 === 3 ? W - 9.5 : x, y, 0.3 + R() * 0.4, R() * 180); }
  for (const [x, y, n, sp] of [[10.5, 10.5, 10, 3.2], [W - 10.5, 10.5, 10, 3.2], [11.5, 198, 12, 4], [W - 11.5, 198, 14, 4.5]] as const) edge += barnacles(R, x, y, n, sp);
  for (let i = 0; i < 6; i++) edge += kelp(R, 14 + i * 4 + R() * 2, 197.5, 4.5 + R() * 3, 0.55, -1, C.weed[i % 4]);
  for (let i = 0; i < 6; i++) edge += kelp(R, W - 36 + i * 4 + R() * 2, 197.5, 4.5 + R() * 3, 0.55, -1, C.weed[(i + 2) % 4]);
  edge += coral(R, 34, 197.4, 6.5, C.coral[1]) + coral(R, W - 16, 197.4, 6, C.coral[3]) + scallop(25, 195.6, 0.55, 18) + star(W - 27, 195.4, 1.7, 0.9, C.coral[4]);
  // the rim of the drowned table between the band and the chart: dark sea-worn wood (no word stands there)
  const H = g.page.h, rim = `<path d="M12 8.5H${W - 12}A3.5 3.5 0 0 1 ${W - 8.5} 12V${H - 12}A3.5 3.5 0 0 1 ${W - 12} ${H - 8.5}H12A3.5 3.5 0 0 1 8.5 ${H - 12}V12A3.5 3.5 0 0 1 12 8.5Z` +
    `M12.4 10.5A1.9 1.9 0 0 0 10.5 12.4V${H - 12.4}A1.9 1.9 0 0 0 12.4 ${H - 10.5}H${W - 12.4}A1.9 1.9 0 0 0 ${W - 10.5} ${H - 12.4}V12.4A1.9 1.9 0 0 0 ${W - 12.4} 10.5Z" fill="${C.wood}" fill-rule="evenodd"/>` +
    `<rect x="10.5" y="10.5" width="${W - 21}" height="${H - 21}" rx="1.9" fill="none" stroke="${C.hair}" stroke-width=".25" stroke-opacity=".8"/>`;
  const L1 = line(g, 'sails'), L2 = line(g, 'crew');
  const under = sheet(g, { band: C.band, line: C.hair, ground: T.paper, w: 1.6 }) + chart(F, { paper: T.paper, line: T.chartLine, coast: T.coast, rose, seed: 13 }) + soundings + stains + rim +
    (roseR > 4 ? compass(rose[0], rose[1], roseR, { line: '#5d8274', fill: T.paper, accent: g.pal.ship }) : '') + shadows + table + edge +
    L1.under + L2.under + oldRuler(g, 'guns', 0) + oldRuler(g, 'hull', 1) + shelf(g);
  // pins: at the top right corner of the frame's SVG notes (no words there); the flasks in the Souls' cells as in A
  const over = [fire, ...side].map(b => pin(b.x + b.w - 2.6, b.y + 0.2)).join('') + L1.over + L2.over + flasks(g);
  // the engraving: the Dutchman in sea-green ink, a tarnished brass frame with verdigris, barnacles and a strand of weed
  const E = { w: 84, h: 52 }, RE = rng(97);
  const engr = await engraving(g, { paper: '#eef1e4', ink: T.ink, frame: T.brass.mid, frameDark: T.brass.dark, light: g.kit.LIGHTS.dutchman as Record<string, unknown>, sails: 'full', seed: 5 }) +
    verdigris(RE, 1, 0.8, E.w - 2, 1.6, 9) + verdigris(RE, 1, E.h - 2.4, E.w - 2, 1.6, 9) + verdigris(RE, 0.8, 3, 1.6, E.h - 6, 4) + verdigris(RE, E.w - 2.4, 3, 1.6, E.h - 6, 4) +
    barnacles(RE, 3.4, 3.4, 6, 2.4, 1.3) + barnacles(RE, E.w - 3.6, E.h - 3.6, 7, 2.8, 1.4) + barnacles(RE, E.w - 3, 3, 3, 1.6, 1.1) +
    kelp(RE, 4, E.h - 0.6, 12, 1.1, -1, C.weed[0]) + kelp(RE, 7, E.h - 0.6, 9, 0.9, -1, C.weed[2]);
  // the notes of the right column: sea-glass paper, a hard shadow, a slight tilt, a pin in the top right corner
  // (CSS: Layers.over lies under the HTML boxes); the Legend keeps the frame's brass card, pinned in the middle
  const pinCss = `content:'';position:absolute;top:.5mm;width:2.4mm;height:2.4mm;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff 0,${T.pin} 40%,${T.pinDark} 100%)`;
  const css = `${s} .bo2-box:not(.bo2-legend){background:${T.note};border-color:${T.noteLine}}${s} .bo2-box{box-shadow:.6mm .8mm 0 rgba(12,36,32,.32)}` +
    `${s} .bo2-ab{transform:rotate(-.3deg)}${s} .bo2-powder{transform:rotate(.45deg)}${s} .bo2-legend{transform:rotate(-.25deg)}` +
    `${s} .bo2-box::before{${pinCss};right:2.4mm}${s} .bo2-legend::before{right:auto;left:50%;margin-left:-1.2mm}`;
  return { under, over, css, engraving: engr };
}

export const material: ShipMaterial = {
  /** a sea-glass field, teal-black ink: the words still ≥ 7 : 1 */
  palette(base: Pal): Pal { return { ...base, field: '#f6f8ef', fieldLine: '#93b5a6', ink: '#12231f', soft: '#30463f', cell: '#fdfdf7' }; },
  a: faceA,
  b: faceB,
  wreck: back
};
