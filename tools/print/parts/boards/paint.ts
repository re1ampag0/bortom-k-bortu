// Shared painting helpers for the board materials (tools/print/parts/boards/<ship>.ts). Pure SVG strings in page mm,
// except closeUp(), engraving() and wreckArt(), which bake the kit ship into a JPEG through the print profile (g.art).
// Nothing here is read during play: the frame (frame.ts) draws the cells, numbers and words on top.
import { ENGRAVING, type Geo, type Layers, type Rect, type ShipMaterial, type WreckGeo } from './frame';

const r = (n: number) => Math.round(n * 100) / 100;
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
/** a small deterministic random (the materials must give the same picture on every build) */
export function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
const rect = (b: Rect, fill: string, extra = '') => `<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="${fill}"${extra}/>`;

/** The sheet: the outer frame band 8.5 mm from the edge (a printer's margin), its inner hairline, a ground inside. */
export function sheet(g: { page: { w: number; h: number } }, o: { band: string; line: string; ground: string; hair?: string; w?: number }): string {
  const W = g.page.w, H = g.page.h;
  return `<rect x="8.5" y="8.5" width="${W - 17}" height="${H - 17}" rx="3.4" fill="${o.ground}" stroke="${o.band}" stroke-width="${o.w ?? 1}"/>` +
    `<rect x="9.6" y="9.6" width="${r(W - 19.2)}" height="${r(H - 19.2)}" rx="2.4" fill="none" stroke="${o.hair ?? o.line}" stroke-width=".25"/>`;
}
/** Planks: horizontal boards with seams, a little grain and nails — dark wood, tarred wood, sea-worn wood. */
export function planks(b: Rect, o: { base: string; seam: string; grain?: string; h?: number; seed?: number; nails?: string }): string {
  const R = rng(o.seed ?? 7), h = o.h ?? 9, out: string[] = [rect(b, o.base)];
  for (let y = b.y, i = 0; y < b.y + b.h; y += h, i++) {
    const shade = mix(o.base, i % 2 ? '#000000' : '#ffffff', 0.04 + R() * 0.03);
    out.push(rect({ x: b.x, y, w: b.w, h: Math.min(h, b.y + b.h - y) }, shade));
    out.push(`<line x1="${r(b.x)}" y1="${r(y)}" x2="${r(b.x + b.w)}" y2="${r(y)}" stroke="${o.seam}" stroke-width=".35"/>`);
    let x = b.x + R() * 60;
    while (x < b.x + b.w) { out.push(`<line x1="${r(x)}" y1="${r(y)}" x2="${r(x)}" y2="${r(Math.min(y + h, b.y + b.h))}" stroke="${o.seam}" stroke-width=".3"/>`); if (o.nails) out.push(`<circle cx="${r(x + 1.4)}" cy="${r(y + h / 2)}" r=".45" fill="${o.nails}"/><circle cx="${r(x - 1.4)}" cy="${r(y + h / 2)}" r=".45" fill="${o.nails}"/>`); x += 55 + R() * 50; }
    if (o.grain) for (let k = 0; k < 3; k++) { const gy = y + 1.5 + R() * (h - 3), gx = b.x + R() * b.w * 0.8; out.push(`<path d="M${r(gx)} ${r(gy)}q${r(10 + R() * 20)} ${r((R() - 0.5) * 1.2)} ${r(30 + R() * 40)} 0" fill="none" stroke="${o.grain}" stroke-width=".22" stroke-linecap="round"/>`); }
  }
  return `<g clip-path="url(#${clip(b)})">${out.join('')}</g>` + clipDefs(b);
}
const clips = new Map<string, string>();
let CLIP = 0;
function clip(b: Rect): string { const k = `${r(b.x)},${r(b.y)},${r(b.w)},${r(b.h)}`; if (!clips.has(k)) clips.set(k, `bo2c${++CLIP}`); return clips.get(k)!; }
function clipDefs(b: Rect): string { return `<defs><clipPath id="${clip(b)}"><rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="2"/></clipPath></defs>`; }
/** A laid rope from a to b: the body and slanted strands. */
export function rope(x1: number, y1: number, x2: number, y2: number, o: { color: string; dark: string; w?: number }): string {
  const w = o.w ?? 1.6, len = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(len / (w * 0.9)), ux = (x2 - x1) / len, uy = (y2 - y1) / len, px = -uy, py = ux;
  let d = '';
  for (let i = 0; i < n; i++) { const t = i * w * 0.9, cx = x1 + ux * t, cy = y1 + uy * t; d += `M${r(cx + px * w / 2 - ux * w * 0.3)} ${r(cy + py * w / 2 - uy * w * 0.3)}L${r(cx - px * w / 2 + ux * w * 0.3)} ${r(cy - py * w / 2 + uy * w * 0.3)}`; }
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.dark}" stroke-width="${r(w + 0.4)}" stroke-linecap="round"/><line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.color}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" stroke="${o.dark}" stroke-width=".3" stroke-opacity=".7"/>`;
}
/** A brass ruler under a track row: a bar with ticks, rivets at the ends. */
export function brassRuler(x: number, y: number, w: number, h: number, o: { light: string; mid: string; dark: string; id: string }): string {
  let ticks = '';
  for (let t = 2; t < w - 1; t += 2.9) ticks += `M${r(x + t)} ${r(y + h)}v${t % 14.5 < 2.9 ? -1.8 : -0.9}`;
  return `<defs><linearGradient id="${o.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.light}"/><stop offset=".45" stop-color="${o.mid}"/><stop offset="1" stop-color="${o.dark}"/></linearGradient></defs>` +
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx=".8" fill="url(#${o.id})" stroke="${o.dark}" stroke-width=".3"/><path d="${ticks}" stroke="${o.dark}" stroke-width=".25"/>` +
    [x + 2, x + w - 2].map(cx => `<circle cx="${r(cx)}" cy="${r(y + h / 2)}" r=".7" fill="${o.light}" stroke="${o.dark}" stroke-width=".2"/>`).join('');
}
/** A sea chart: the paper, a grid of degrees, rhumb lines from a rose, a strip of coast. */
export function chart(b: Rect, o: { paper: string; line: string; coast: string; rose: [number, number]; seed?: number }): string {
  const R = rng(o.seed ?? 3), out: string[] = [rect(b, o.paper)];
  for (let x = b.x + 18; x < b.x + b.w; x += 24) out.push(`<line x1="${r(x)}" y1="${r(b.y)}" x2="${r(x)}" y2="${r(b.y + b.h)}" stroke="${o.line}" stroke-width=".22"/>`);
  for (let y = b.y + 14; y < b.y + b.h; y += 24) out.push(`<line x1="${r(b.x)}" y1="${r(y)}" x2="${r(b.x + b.w)}" y2="${r(y)}" stroke="${o.line}" stroke-width=".22"/>`);
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; out.push(`<line x1="${o.rose[0]}" y1="${o.rose[1]}" x2="${r(o.rose[0] + Math.cos(a) * 400)}" y2="${r(o.rose[1] + Math.sin(a) * 400)}" stroke="${o.line}" stroke-width=".18" stroke-dasharray="${i % 2 ? '1.2 1.4' : 'none'}"/>`); }
  let d = `M${r(b.x)} ${r(b.y + b.h * 0.18)}`;
  for (let x = b.x; x < b.x + b.w * 0.55; x += 6) d += `L${r(x + 6)} ${r(b.y + b.h * 0.12 + R() * 9 + Math.sin(x / 13) * 5)}`;
  d += `L${r(b.x + b.w * 0.55)} ${r(b.y)}L${r(b.x)} ${r(b.y)}Z`;
  out.push(`<path d="${d}" fill="${o.coast}" stroke="${mix(o.coast, '#000000', 0.35)}" stroke-width=".3"/>`);
  return `<g clip-path="url(#${clip(b)})">${out.join('')}</g>` + clipDefs(b);
}
/** A compass rose (engraved), for the chart, the deck, the medal of a board. */
export function compass(cx: number, cy: number, R: number, o: { line: string; fill: string; accent: string }): string {
  const at = (a: number, d: number) => `${r(cx + d * Math.cos(a))},${r(cy + d * Math.sin(a))}`, out: string[] = [];
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${R}" fill="${o.fill}" stroke="${o.line}" stroke-width=".35"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.84)}" fill="none" stroke="${o.line}" stroke-width=".25"/>`);
  for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16; out.push(`<line x1="${at(a, R * 0.84).replace(',', '" y1="')}" x2="${at(a, R * (i % 4 ? 0.92 : 1)).replace(',', '" y2="')}" stroke="${o.line}" stroke-width=".22"/>`); }
  for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, l = i % 2 ? 0.5 : 0.8, wd = R * 0.12; out.push(`<polygon points="${at(a, 0)} ${at(a - Math.PI / 2, wd)} ${at(a, R * l)}" fill="${i ? o.line : o.accent}"/><polygon points="${at(a, 0)} ${at(a + Math.PI / 2, wd)} ${at(a, R * l)}" fill="${o.fill}" stroke="${o.line}" stroke-width=".2"/>`); }
  return out.join('');
}
// ---- the kit ship, baked ----
interface ShipOpts { light?: Record<string, unknown>; sails?: string; heel?: number; seed?: number; flip?: boolean }
/** A close-up of the own ship's side for concept A: the rail at the Crew row, the waterline under the Hull row, the
 *  bow and the stern beyond the picture's edges, the mast tops beyond its top. Returns SVG in page mm, clipped to
 *  g.zones.picture: sky and sea of the given colours, the JPEG. focus — the hull's X (scene units of a ship at scale 1,
 *  0 = midships, negative = towards the bow) under the picture's centre. */
export async function closeUp(g: Geo, o: ShipOpts & { sky: [string, string]; sea: [string, string]; focus?: number; wl?: number; k?: number } ): Promise<string> {
  const P = g.zones.picture, kind = g.kind, K = g.kit, k = o.k ?? 0.7, crew = g.rows.find(rw => rw.key === 'crew')!;
  const focus = o.focus ?? 0, geo = K.shipGeom(kind, { x: 0, y: 0, scale: 1 }), railH = -geo.nearRail(focus)[1];
  const wl = o.wl ?? 177, rail = crew.cy + 3.5, sMM = (wl - rail) / railH;
  const b = Math.ceil(Math.max(0, (P.w / k - 200) / 2, (P.h / k - 280) / 2)) + 2, toU = (mmX: number, mmY: number) => [(mmX - P.x) / k - b, (mmY - P.y) / k - b];
  const [sx, sy] = toU(P.x + P.w / 2 - focus * sMM, wl), [, hy] = toU(0, wl);
  const L = K.makeLight(o.light ?? K.LIGHTS.endeavour, { horizon: hy - 30 });
  const shipSvg = K.ship('bo2' + kind, L, { kind, x: sx, y: sy, scale: sMM / k, sails: o.sails ?? 'full', heel: o.heel ?? 0, seed: o.seed ?? 11, flip: o.flip ?? false, detail: 'near' });
  const W = 200 + 2 * b, H = 280 + 2 * b;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.sky[0]}"/><stop offset="1" stop-color="${o.sky[1]}"/></linearGradient><linearGradient id="bo2sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.sea[0]}"/><stop offset="1" stop-color="${o.sea[1]}"/></linearGradient></defs><rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2sky)"/><rect x="${-b}" y="${r(hy)}" width="${W}" height="${r(H - hy - b)}" fill="url(#bo2sea)"/>${shipSvg}</svg>`;
  const url = await g.art(`board-close-${kind}`, svg, b);
  const id = `${g.uid}pc`;
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>`;
}
/** B: the ship as an engraving — the kit ship baked in sepia (an SVG feColorMatrix inside the scene, before the JPEG;
 *  never a CSS filter in the PDF page) on paper, in a frame. SVG in ENGRAVING's viewBox. */
export async function engraving(g: Geo, o: ShipOpts & { paper: string; ink: string; frame: string; frameDark: string }): Promise<string> {
  const kind = g.kind, K = g.kit, box = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), wl = 200, s = Math.min(176 / box.w, 150 / box.h);
  const L = K.makeLight(o.light ?? K.LIGHTS.endeavour, { horizon: wl - 10 });
  const body = K.ship('bo2e' + kind, L, { kind, x: 100 - s * (box.x0 + box.x1) / 2, y: wl, scale: s, sails: o.sails ?? 'full', heel: o.heel ?? 0, seed: o.seed ?? 5 });
  const [pr, pg, pb] = hex(o.paper).map(v => v / 255), [ir, ig, ib] = hex(o.ink).map(v => v / 255);
  // luminance → a mix of ink (dark) and paper (light)
  const row = (a: number, c: number) => `${r((c - a) * 0.2126)} ${r((c - a) * 0.7152)} ${r((c - a) * 0.0722)} 0 ${r(a)}`;
  const m = [row(ir, pr), row(ig, pg), row(ib, pb), '0 0 0 1 0'].join(' ');
  let hatch = '';
  for (let x = -20; x < 220; x += 1.6) hatch += `M${x} ${wl + 2}l14 ${16}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280"><defs><filter id="bo2sep" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${m}"/></filter></defs><rect width="200" height="280" fill="${o.paper}"/><g filter="url(#bo2sep)">${body}</g><path d="${hatch}" stroke="${o.ink}" stroke-width=".35" stroke-opacity=".55"/><rect y="${wl + 18}" width="200" height="80" fill="${o.paper}"/></svg>`;
  const url = await g.art(`board-engr-${kind}`, svg);
  const E = ENGRAVING, top = wl - s * box.h - 6, h = s * box.h + 24, kx = (E.w - 8) / 200, ky = (E.h - 8) / h, kk = Math.min(kx, ky), iw = 200 * kk, ih = h * kk, ix = (E.w - iw) / 2, iy = (E.h - ih) / 2;
  return `<rect x=".6" y=".6" width="${E.w - 1.2}" height="${E.h - 1.2}" rx="1.4" fill="${o.frame}" stroke="${o.frameDark}" stroke-width=".5"/><rect x="2.6" y="2.6" width="${E.w - 5.2}" height="${E.h - 5.2}" fill="${o.paper}" stroke="${o.frameDark}" stroke-width=".3"/>` +
    `<svg x="${r(ix)}" y="${r(iy)}" width="${r(iw)}" height="${r(ih)}" viewBox="0 ${r(top)} 200 ${r(h)}"><image href="${url}" width="200" height="280"/></svg>`;
}
/** The back: the ship lying on the sea floor, heeled over, its masts broken off by the picture's top; sand and murk. */
export async function wreckArt(w: WreckGeo, o: { water: [string, string]; sand: string; sandDark: string; light?: Record<string, unknown>; heel?: number; k?: number }): Promise<string> {
  // k mm per scene unit; the bleed widens the 200 × 280 scene to the art's width at the same density (≈ 140 ppi at 0.9)
  const A = w.zones.art, kind = w.kind, K = w.kit, k = o.k ?? 0.9, b = Math.ceil(Math.max(0, (A.w / k - 200) / 2)) + 1, box = K.shipBox(kind, { x: 0, y: 0, scale: 1 });
  const W = 200 + 2 * b, H = 280 + 2 * b, vh = A.h / k, floor = -b + vh * 0.86, s = 150 / box.w * (A.w / k) / 200;
  const L = K.makeLight(o.light ?? K.LIGHTS.dutchman, { horizon: -b + 10 });
  const body = K.ship('bo2w' + kind, L, { kind, x: -b + W * 0.58, y: floor + 6, scale: s, sails: 'furled', heel: o.heel ?? 16, seed: 23 });
  const Rr = rng(5); let sand = '';
  for (let i = 0; i < 60; i++) sand += `<ellipse cx="${r(-b + Rr() * W)}" cy="${r(floor + 4 + Rr() * 30)}" rx="${r(2 + Rr() * 6)}" ry="${r(0.4 + Rr())}" fill="${o.sandDark}" fill-opacity=".35"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.water[0]}"/><stop offset="1" stop-color="${o.water[1]}"/></linearGradient></defs><rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2wat)"/>${body}<path d="M${-b} ${r(floor + 4)}q${r(W / 4)} -5 ${r(W / 2)} -1t${r(W / 2)} 1V${H}H${-b}Z" fill="${o.sand}"/>${sand}<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="${o.water[1]}" fill-opacity=".28"/></svg>`;
  const url = await w.art(`board-wreck-${kind}`, svg, b), id = `${w.uid}wa`;
  return `<defs><clipPath id="${id}"><rect x="${r(A.x)}" y="${r(A.y)}" width="${r(A.w)}" height="${r(A.h)}" rx="2.4"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(A.x)}" y="${r(A.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>`;
}

// ---- a simple material from a few colours (the placeholders of the four ships; a real material may use any of this) ----
export interface SimpleCfg {
  /** A: the wood round the picture and the frame band */ wood: { base: string; seam: string; grain: string; nails?: string };
  band: string; hair: string;
  sky: [string, string]; sea: [string, string]; light?: Record<string, unknown>; focus?: number; sails?: string;
  /** B: the chart and its brass */ chart: { paper: string; line: string; coast: string }; brass: { light: string; mid: string; dark: string };
  note: string; noteLine: string; pin: string; extraA?(g: Geo): string; extraB?(g: Geo): string;
  /** the back */ wreck: { water: [string, string]; sand: string; sandDark: string; light?: Record<string, unknown> };
}
export function simpleMaterial(c: SimpleCfg): ShipMaterial {
  return {
    async a(g: Geo): Promise<Layers> {
      const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 };
      const under = sheet(g, { band: c.band, line: c.hair, ground: c.wood.base, w: 1.2 }) + planks(F, { ...c.wood, h: 10.5, seed: g.ship.hull * 7 }) +
        await closeUp(g, { sky: c.sky, sea: c.sea, light: c.light, focus: c.focus, sails: c.sails }) + (c.extraA ? c.extraA(g) : '');
      return { under, css: `${g.scope} .bo2-box{box-shadow:.5mm .7mm 0 rgba(0,0,0,.35)}` };
    },
    async b(g: Geo): Promise<Layers> {
      const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 }, br = c.brass;
      const rulers = g.rows.map((rw, i) => brassRuler(rw.x0 - 1.2, rw.cells[0].y - 1.2, rw.cells[rw.cells.length - 1].x + rw.cells[0].w - rw.x0 + 2.4, 15.4, { ...br, id: `${g.uid}br${i}` })).join('');
      const mf = g.zones.midFree, rose = mf ? compass(mf.x + mf.w / 2, mf.y + mf.h / 2, Math.min(mf.w, mf.h) / 2 - 3, { line: c.chart.line, fill: c.chart.paper, accent: c.band }) : '';
      const under = sheet(g, { band: c.band, line: c.hair, ground: c.chart.paper, w: 1.2 }) + chart(F, { ...c.chart, rose: [158, 120], seed: g.ship.hull }) + (c.extraB ? c.extraB(g) : '') + rose + rulers;
      const engr = await engraving(g, { paper: c.note, ink: '#3a2a18', frame: br.mid, frameDark: br.dark, light: c.light });
      const s = g.scope;
      const css = `${s} .bo2-box{background:${c.note};border-color:${c.noteLine};box-shadow:.5mm .8mm 0 rgba(60,40,10,.22)}${s} .bo2-ab{transform:rotate(-.35deg)}${s} .bo2-legend{transform:rotate(.4deg)}` +
        `${s} .bo2-box::before{content:'';position:absolute;left:50%;top:-1.2mm;width:2.6mm;height:2.6mm;margin-left:-1.3mm;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff 0,${c.pin} 45%,${mix(c.pin, '#000000', 0.5)} 100%)}`;
      return { under, css, engraving: engr };
    },
    async wreck(w: WreckGeo): Promise<Layers> {
      const under = await wreckArt(w, c.wreck);
      return { under };
    }
  };
}
