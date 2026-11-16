// The Legend's back (user's decision 16.11, second round): the normal back of its deck (backs.cjs) at the same size and
// framing — the picture to the cut, the ship as large and where she is on the deck back — with «ЛЕГЕНДА» in gold in
// place of the game's title and a thin gold frame along the card edge. The frame runs from the cut (and on through the
// bleed, like the frame of a face) LB_FRAME.w mm inwards; a shifted back shows a wider or narrower gold edge, never a
// neighbour's colour. It must not touch the ship: checkLegendShips measures every ship against its inner edge.
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Page } from 'playwright';
import { ROOT } from './kit';
import { BLEED, CARD } from './layout';
import { DECK_KEY, LEGEND, type DeckCode } from './colors';

const require = createRequire(import.meta.url);
const LF = LEGEND.frame;
/** The medallion with the deck's letter on a Legend back, as on the deck back; PRINT_LEGEND_CREST=off renders without. */
export const LEGEND_BACK_CREST = process.env.PRINT_LEGEND_CREST !== 'off';
/** The gold frame: w — from the cut to its inner edge (mm); corner — how far the corner ornaments reach along each edge
 *  from the corner (they lie in the sky and the near water, away from the ship); gap — the least air between the ship
 *  and the frame (--check). */
export const LB_FRAME = { w: 1.5, corner: 5.4, gap: .3 };
/** Picture units (of 200 × 280) the deck back's picture moves right on a Legend back. The Pearl's jib runs 2.5 mm past the
 *  cut on her deck back: her whole picture (sky, moon, ship, wake) moves 5 mm right so she lies whole inside the frame,
 *  as much air on both sides; the picture's bleed ends 0.4 mm inside the frame there — that strip is the night sky's
 *  edge colour (LB_FILL). The others stay where they are. */
export const LB_DX: Record<DeckCode, number> = { 'Ж': 16, 'М': 0, 'И': 0, 'Г': 0 };
/** What fills the strip a moved picture leaves (under the frame and just inside it): the colour of that picture's edge. */
export const LB_FILL: Record<DeckCode, string> = { 'Ж': '#0d1220', 'М': '#5a1410', 'И': '#173560', 'Г': '#10261c' };
/** The gold of the frame: also the ground and the bleed of the Legend sheet's back side. */
export const LB_GOLD = LF.mid;

const n2 = (v: number) => String(Math.round(v * 100) / 100);
/** The deck back's picture moved dx units right (the raster keeps its size and bleed); the ground fills what it leaves. */
export function shiftBack(svg: string, dx: number, ground: string): string {
  if (!dx) return svg;
  const m = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/); if (!m) throw new Error('legend back: no viewBox');
  const [x, y, w, h] = m.slice(1).map(Number);
  return svg.replace(m[0], `viewBox="${n2(x - dx)} ${y} ${w} ${h}"`).replace(/(<svg[^>]*>)/, `$1<rect x="${n2(x - dx - 1)}" y="${y - 1}" width="${n2(dx + 2)}" height="${h + 2}" fill="${ground}"/>`);
}

/** The frame (SVG, units mm, over the card and its bleed): a flat gold band from beyond the cut to w, a fine engraved line
 *  in it, a dark hairline on its inner edge with a light one beside it; in each corner a concave gold fillet with a dot
 *  and two small leaves along the edges. Lines ≥ 0.2 mm, no filters. */
export const LB_FRAME_SVG = (() => {
  const W = CARD.w, H = CARD.h, B = BLEED, w = LB_FRAME.w, o = .7, r = 2.3;
  const rect = (i: number) => `M${n2(i)} ${n2(i)}H${n2(W - i)}V${n2(H - i)}H${n2(i)}Z`;
  const ring = `M${-B} ${-B}H${W + B}V${H + B}H${-B}Z` + rect(w);
  const leaf = (x: number, y: number, ang: number, len = 2.1, lw = .62) => `<path d="M0 0Q${n2(len * .45)} ${-lw} ${len} 0Q${n2(len * .45)} ${lw} 0 0Z" transform="translate(${n2(x)} ${n2(y)}) rotate(${ang})"/>`;
  // one corner (top left); the others are its mirror images
  const corner = `<path d="M${w} ${w}H${n2(w + r)}A${r} ${r} 0 0 0 ${w} ${n2(w + r)}Z" fill="${LF.mid}"/>`
    + `<path d="M${n2(w + r)} ${w}A${r} ${r} 0 0 0 ${w} ${n2(w + r)}" fill="none" stroke="${LF.line}" stroke-width=".25"/>`
    + `<circle cx="${n2(w + .62)}" cy="${n2(w + .62)}" r=".34" fill="${LF.deep}"/>`
    + `<g fill="${LF.mid}" stroke="${LF.line}" stroke-width=".2">${leaf(w + r + .25, w + .55, 0)}${leaf(w + .55, w + r + .25, 90)}</g>`;
  const at = (sx: number, sy: number) => `<g transform="translate(${sx < 0 ? W : 0} ${sy < 0 ? H : 0}) scale(${sx} ${sy})">${corner}</g>`;
  return `<svg class="lbf" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" xmlns="http://www.w3.org/2000/svg">`
    + `<path d="${ring}" fill-rule="evenodd" fill="${LF.mid}"/>`
    + `<path d="${rect(o)}" fill="none" stroke="${LF.deep}" stroke-width=".2"/>`
    + `<path d="${rect(w - .22)}" fill="none" stroke="${LF.light}" stroke-width=".2"/>`
    + `<path d="${rect(w)}" fill="none" stroke="${LF.line}" stroke-width=".25"/>`
    + at(1, 1) + at(-1, 1) + at(1, -1) + at(-1, -1) + `</svg>`;
})();

interface Box { x0: number; x1: number; y0: number; y1: number }
/** The box of each deck's ship on its Legend back (mm, card coordinates): the union of the kit's geometry (K.shipBox) and the ship drawn alone (no wake, no reflection) and measured in the browser; both through the scene's
 *  own scale and LB_DX. The ship's placement is read from the back itself: K.ship is watched while backs.cjs draws it. */
export async function legendShipBoxes(page: Page, dxOf: Record<DeckCode, number> = LB_DX): Promise<{ deck: DeckCode; box: Box }[]> {
  const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs'));
  const Bk = require(path.join(ROOT, 'tools/card-art/scenes/backs.cjs'));
  const out: { deck: DeckCode; box: Box }[] = [];
  for (const deck of Object.keys(DECK_KEY) as DeckCode[]) {
    const kind = DECK_KEY[deck], orig = K.ship, calls: [unknown, Record<string, unknown>][] = [];
    K.ship = function (u: string, L: unknown, o: Record<string, unknown>) { calls.push([L, o]); return orig.apply(this, [u, L, o]); };
    let svg: string; try { svg = Bk.back(kind, 1).svg; } finally { K.ship = orig; }
    const hit = calls.find(c => c[1].kind === kind); if (!hit) throw new Error(`legend back ${deck}: the ship was not drawn`);
    const [L, o] = hit, sm = svg.match(/translate\(100 140\) scale\(([\d.]+)\) translate\(-100 -140\)/), s = sm ? +sm[1] : 1, dx = dxOf[deck];
    const toMm = (x: number, y: number): [number, number] => [(100 + s * (x - 100) + dx) * CARD.w / 200, (140 + s * (y - 140)) * CARD.h / 280];
    // the kit's box (it reaches past the jib-boom's end; the heel, a degree or two, it leaves to the measured picture)
    const b = K.shipBox(kind, o), pts = [toMm(b.x0, b.top), toMm(b.x1, b.y)];
    // the drawn ship, measured
    const body = orig('lbm', L, Object.assign({}, o, { wake: false, reflect: false }));
    const pic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 240 320" width="960" height="1280"><g transform="translate(100 140) scale(${s}) translate(-100 -140)">${body}</g></svg>`;
    const px = await page.evaluate(async (svg: string) => {
      const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); await img.decode();
      const c = document.createElement('canvas'); c.width = 960; c.height = 1280; const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, 960, 1280).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let y = 0; y < 1280; y++) for (let x = 0; x < 960; x++) if (d[(y * 960 + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return [x0, x1, y0, y1].map(v => v / 4 - 20);
    }, pic);
    // (measured through the scene's scale already: only the shift and mm)
    pts.push(...[[px[0], px[2]], [px[1], px[3]]].map(([x, y]) => [(x + dx) * CARD.w / 200, y * CARD.h / 280] as [number, number]));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    out.push({ deck, box: { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } });
  }
  return out;
}

/** --check: each Legend back's ship stays inside the frame's inner edge and clear of the corner ornaments, with LB_FRAME.gap of air. */
export async function checkLegendShips(page: Page, dxOf: Record<DeckCode, number> = LB_DX): Promise<{ errors: string[]; lines: string[] }> {
  const { w, corner: c, gap } = LB_FRAME, W = CARD.w, H = CARD.h, errors: string[] = [], lines: string[] = [];
  for (const { deck, box: b } of await legendShipBoxes(page, dxOf)) {
    const side = { left: b.x0 - w, right: W - w - b.x1, top: b.y0 - w, bottom: H - w - b.y1 };
    // a corner ornament (c × c from the card's corner) is hit when the box reaches into that square
    const inCorner = [[0, 0], [W - c, 0], [0, H - c], [W - c, H - c]].some(([x, y]) => b.x0 < x + c && b.x1 > x && b.y0 < y + c && b.y1 > y);
    const min = Math.min(...Object.values(side)), worst = Object.entries(side).find(([, v]) => v === min)![0];
    lines.push(`${deck}: ship ${b.x0.toFixed(2)}–${b.x1.toFixed(2)} × ${b.y0.toFixed(2)}–${b.y1.toFixed(2)} mm, frame inner edge ${w} mm — air ${Object.entries(side).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}${inCorner ? ', IN A CORNER ORNAMENT' : ''}`);
    if (min < gap) errors.push(`Legend back ${deck}: the ship ${min < 0 ? 'crosses' : 'comes within ' + min.toFixed(2) + ' mm of'} the gold frame on the ${worst} (${min.toFixed(2)} mm, need ≥ ${gap})`);
    if (inCorner) errors.push(`Legend back ${deck}: the ship reaches into a corner ornament of the frame`);
  }
  return { errors, lines };
}
