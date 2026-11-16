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
import { DECK_KEY, darken, lighten, type DeckCode } from './colors';

const require = createRequire(import.meta.url);
/** The medallion with the deck's letter on a Legend back, as on the deck back; PRINT_LEGEND_CREST=off renders without. */
export const LEGEND_BACK_CREST = process.env.PRINT_LEGEND_CREST !== 'off';
/** The face of a Legend back's lettering (user's request 16.11, third round): 'classic' — Alegreya SC (variant A),
 *  'wet' — Rubik Wet Paint (variant B, «злобный шрифт»); PRINT_LEGEND_FONT renders the other for a comparison. */
export const LEGEND_BACK_FONT: LegendFont = process.env.PRINT_LEGEND_FONT === 'wet' ? 'wet' : 'classic';
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
/** The metal of a Legend back (user's request 16.11, third round: «цвет более золотистый»): a warm, rich gold from a pale
 *  highlight to a deep brown-gold, an engraved dark edge. The frame, the star, the lettering and the medallion share it. */
export const LB_METAL = { hi: '#fff7d2', light: '#ffe17a', mid: '#efb02a', warm: '#d9921a', deep: '#a8650c', dark: '#5e3404', edge: '#2b1702' };
/** The gold of the frame: also the ground and the bleed of the Legend sheet's back side. */
export const LB_GOLD = LB_METAL.mid;

const n2 = (v: number) => String(Math.round(v * 100) / 100);
/** The deck back's picture moved dx units right (the raster keeps its size and bleed); the ground fills what it leaves. */
export function shiftBack(svg: string, dx: number, ground: string): string {
  if (!dx) return svg;
  const m = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/); if (!m) throw new Error('legend back: no viewBox');
  const [x, y, w, h] = m.slice(1).map(Number);
  return svg.replace(m[0], `viewBox="${n2(x - dx)} ${y} ${w} ${h}"`).replace(/(<svg[^>]*>)/, `$1<rect x="${n2(x - dx - 1)}" y="${y - 1}" width="${n2(dx + 2)}" height="${h + 2}" fill="${ground}"/>`);
}

const ns = 'xmlns="http://www.w3.org/2000/svg"';
/** Gradients of the metal (SVG defs; the same ids in every Legend back — identical content, so any copy serves). Vertical
 *  for lettering and facets (a bright top, a sharp darker «horizon» in the middle, a warm reflected light below); a diagonal
 *  sheen in card mm for the frame — bright and deep bands along it, as polished gold catches the light. */
const METAL_DEFS = (() => {
  const M = LB_METAL, st = (a: [number, string][]) => a.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  return `<defs>`
    + `<linearGradient id="lbm-text" x1="0" y1="0" x2="0" y2="1">${st([[0, M.hi], [.3, M.light], [.48, M.mid], [.5, M.warm], [.72, M.mid], [.9, M.light], [1, M.deep]])}</linearGradient>`
    + `<linearGradient id="lbm-name" x1="0" y1="0" x2="0" y2="1">${st([[0, '#fffdf2'], [.45, '#fff0c0'], [.55, '#ffe08a'], [1, '#f2c45a']])}</linearGradient>`
    + `<linearGradient id="lbm-lite" x1="0" y1="0" x2="1" y2="1">${st([[0, M.hi], [.55, M.light], [1, M.mid]])}</linearGradient>`
    + `<linearGradient id="lbm-dark" x1="0" y1="0" x2="1" y2="1">${st([[0, M.mid], [.5, M.warm], [1, M.deep]])}</linearGradient>`
    + `<radialGradient id="lbm-boss" cx=".38" cy=".34" r=".7">${st([[0, '#ffffff'], [.25, M.hi], [.6, M.mid], [1, M.deep]])}</radialGradient>`
    + `<linearGradient id="lbm-sheen" gradientUnits="userSpaceOnUse" x1="-3" y1="-3" x2="${CARD.w + 3}" y2="${CARD.h + 3}">`
    + st([[0, '#ffe58a'], [.1, M.warm], [.2, '#fff1b4'], [.32, '#c98412'], [.45, '#f8cf58'], [.57, M.deep], [.7, '#ffe48e'], [.83, '#cf8e16'], [.93, '#fbd96a'], [1, M.warm]]) + `</linearGradient></defs>`;
})();

/** The frame (SVG, units mm, over the card and its bleed): a polished gold band (the sheen) from beyond the cut to w, a fine
 *  engraved line in it, a dark hairline on its inner edge with a light one beside it; in each corner a concave gold fillet
 *  with a boss and two small leaves along the edges. Lines ≥ 0.2 mm, no filters. */
export const LB_FRAME_SVG = (() => {
  const W = CARD.w, H = CARD.h, B = BLEED, w = LB_FRAME.w, o = .7, r = 2.3, M = LB_METAL;
  const rect = (i: number) => `M${n2(i)} ${n2(i)}H${n2(W - i)}V${n2(H - i)}H${n2(i)}Z`;
  const ring = `M${-B} ${-B}H${W + B}V${H + B}H${-B}Z` + rect(w);
  const leaf = (x: number, y: number, ang: number, len = 2.1, lw = .62) => `<path d="M0 0Q${n2(len * .45)} ${-lw} ${len} 0Q${n2(len * .45)} ${lw} 0 0Z" transform="translate(${n2(x)} ${n2(y)}) rotate(${ang})"/>`;
  // one corner (top left); the others are its mirror images
  const corner = `<path d="M${w} ${w}H${n2(w + r)}A${r} ${r} 0 0 0 ${w} ${n2(w + r)}Z" fill="url(#lbm-sheen)"/>`
    + `<path d="M${n2(w + r)} ${w}A${r} ${r} 0 0 0 ${w} ${n2(w + r)}" fill="none" stroke="${M.edge}" stroke-width=".25"/>`
    + `<circle cx="${n2(w + .66)}" cy="${n2(w + .66)}" r=".42" fill="url(#lbm-boss)" stroke="${M.dark}" stroke-width=".15"/>`
    + `<g fill="url(#lbm-lite)" stroke="${M.edge}" stroke-width=".2">${leaf(w + r + .25, w + .55, 0)}${leaf(w + .55, w + r + .25, 90)}</g>`;
  const at = (sx: number, sy: number) => `<g transform="translate(${sx < 0 ? W : 0} ${sy < 0 ? H : 0}) scale(${sx} ${sy})">${corner}</g>`;
  return `<svg class="lbf" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" ${ns}>${METAL_DEFS}`
    + `<path d="${ring}" fill-rule="evenodd" fill="url(#lbm-sheen)"/>`
    + `<path d="${rect(o)}" fill="none" stroke="${M.dark}" stroke-width=".2"/>`
    + `<path d="${rect(o + .2)}" fill="none" stroke="${M.hi}" stroke-width=".15" stroke-opacity=".8"/>`
    + `<path d="${rect(w - .22)}" fill="none" stroke="${M.hi}" stroke-width=".2"/>`
    + `<path d="${rect(w)}" fill="none" stroke="${M.edge}" stroke-width=".25"/>`
    + at(1, 1) + at(-1, 1) + at(1, -1) + at(-1, -1) + `</svg>`;
})();

/** A faceted gold compass star (SVG, units mm, centre cx cy, the long points R): four long and four short points, each
 *  split along its ridge into a lit and a shaded facet, a thin ring between them, a polished boss in the middle and a
 *  small glint on the upper left. Filled shapes with a 0.15 mm engraved edge, no filters. */
export function lbStar(cx: number, cy: number, R: number): string {
  const M = LB_METAL, P = (r: number, a: number) => `${n2(cx + r * Math.sin(a * Math.PI / 180))} ${n2(cy - r * Math.cos(a * Math.PI / 180))}`;
  const point = (a: number, r: number, waist: number) => `<path d="M${n2(cx)} ${n2(cy)}L${P(r, a)}L${P(waist, a - 45)}Z" fill="url(#lbm-lite)"/><path d="M${n2(cx)} ${n2(cy)}L${P(r, a)}L${P(waist, a + 45)}Z" fill="url(#lbm-dark)"/>`;
  const edge = (a: number, r: number, waist: number) => `M${P(waist, a - 45)}L${P(r, a)}L${P(waist, a + 45)}`;
  const shortP = [45, 135, 225, 315], longP = [0, 90, 180, 270], rs = R * .56, w1 = R * .2, w2 = R * .17;
  const glint = (x: number, y: number, l: number) => `<path d="M${n2(x)} ${n2(y - l)}L${n2(x + l * .13)} ${n2(y - l * .13)}L${n2(x + l)} ${n2(y)}L${n2(x + l * .13)} ${n2(y + l * .13)}L${n2(x)} ${n2(y + l)}L${n2(x - l * .13)} ${n2(y + l * .13)}L${n2(x - l)} ${n2(y)}L${n2(x - l * .13)} ${n2(y - l * .13)}Z" fill="#fffbe8"/>`;
  return `<g stroke-linejoin="round">`
    + `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * .62)}" fill="none" stroke="${M.edge}" stroke-width=".36"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * .62)}" fill="none" stroke="url(#lbm-lite)" stroke-width=".18"/>`
    + shortP.map(a => point(a, rs, w2)).join('') + `<path d="${shortP.map(a => edge(a, rs, w2)).join('')}" fill="none" stroke="${M.edge}" stroke-width=".15"/>`
    + longP.map(a => point(a, R, w1)).join('') + `<path d="${longP.map(a => edge(a, R, w1)).join('')}" fill="none" stroke="${M.edge}" stroke-width=".16"/>`
    + `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * .17)}" fill="url(#lbm-boss)" stroke="${M.edge}" stroke-width=".15"/>`
    + glint(cx - R * .42, cy - R * .5, R * .34) + `</g>`;
}

/** The lettering of a Legend back (variant 'classic' — Alegreya SC as on every back; 'wet' — Rubik Wet Paint, the sinister
 *  display face, PRINT_LEGEND_FONT): place and size of «ЛЕГЕНДА» (size, the word's length — textLength, so the stars beside
 *  it always stand at the same air) and of the ship's name. */
export const LB_TYPE = {
  classic: { family: `'Alegreya SC',serif`, weight: 700, title: { size: 4.25, len: 22.4, cap: .62 }, name: { size: 3.39, cap: .5, spacing: .04 } },
  wet: { family: `'Rubik Wet Paint',sans-serif`, weight: 400, title: { size: 4.6, len: 24.6, cap: .7 }, name: { size: 3.1, cap: .72, spacing: .02 } }
} as const;
export type LegendFont = keyof typeof LB_TYPE;
/** The stars beside «ЛЕГЕНДА»: R — the long points, gap — the air between the word and a star's point (mm). */
export const LB_STAR = { R: 3.1, gap: 1.3 };

/** «ЛЕГЕНДА» with a compass star on each side and the ship's name — one SVG over the card (units mm). The metal
 *  gradient fills the letters, a dark engraved edge (stroke behind the fill) and a hard offset shadow (no blur) lift them
 *  off the picture. titleY, nameY — the centres of the lines (mm, from the deck back's places). */
export function legendLetteringSvg(name: string, titleY: number, nameY: number, font: LegendFont): string {
  const T = LB_TYPE[font], M = LB_METAL, W = CARD.w, t = T.title, nm = T.name;
  const tb = titleY + t.size * t.cap / 2, nb = nameY + nm.size * nm.cap / 2, sx = t.len / 2 + LB_STAR.gap + LB_STAR.R;
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const txt = (s: string, y: number, size: number, extra: string) => `<text x="${W / 2}" y="${n2(y)}" text-anchor="middle" font-family="${T.family}" font-weight="${T.weight}" font-size="${size}" ${extra}>${esc(s)}</text>`;
  const title = 'ЛЕГЕНДА', len = `textLength="${t.len}" lengthAdjust="spacing"`;
  return `<svg class="lbl" viewBox="0 0 ${W} ${CARD.h}" ${ns}>${METAL_DEFS}`
    + txt(title, tb + .3, t.size, `${len} fill="#000" fill-opacity=".55"`)
    + txt(title, tb, t.size, `${len} fill="url(#lbm-text)" stroke="${M.edge}" stroke-width=".34" paint-order="stroke" stroke-linejoin="round"`)
    + lbStar(W / 2 - sx, titleY, LB_STAR.R) + lbStar(W / 2 + sx, titleY, LB_STAR.R)
    + txt(name, nb + .26, nm.size, `letter-spacing="${nm.spacing}em" fill="#000" fill-opacity=".6"`)
    + txt(name, nb, nm.size, `letter-spacing="${nm.spacing}em" fill="url(#lbm-name)" stroke="${M.edge}" stroke-width=".3" paint-order="stroke" stroke-linejoin="round"`)
    + `</svg>`;
}

/** Each deck's small sign on its Legend medallion's enamel (px of the 90 × 92 raster, centre 0 0, about 7 px): the sky of its
 *  back — the Pearl's stars, the Revenge's flames, the Endeavour's sun, the Dutchman's moon. Own drawing. */
const CREST_SIGN: Record<DeckCode, string> = {
  'Ж': `<path d="M0 -3.6L.8 -.8L3.6 0L.8 .8L0 3.6L-.8 .8L-3.6 0L-.8 -.8Z"/>`,
  'М': `<path d="M0 -3.8C1.6 -1.9 2.9 -.6 2.6 1.3C2.4 2.9 1.2 3.6 0 3.6C-1.2 3.6 -2.4 2.9 -2.6 1.3C-2.8 -.2 -1.7 -1 -1.2 -2.2C-.6 -1.2 -.3 -.5 0 -.1C.4 -1.2 .4 -2.4 0 -3.8Z"/>`,
  'И': `<circle r="1.7"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M-.55 -2.3L0 -3.9L.55 -2.3Z" transform="rotate(${a})"/>`).join('')}`,
  'Г': `<path d="M1.2 -3.5A3.6 3.6 0 1 0 1.2 3.5A2.9 2.9 0 1 1 1.2 -3.5Z"/>`
};
/** The medallion of a Legend back (HTML for ctx.raster, 90 × 92 px, the disc's centre at 45 45 as on the deck back's
 *  crest): a polished gold rim with a beaded edge, an engraved groove, a bevelled inner ring, the deck-coloured enamel
 *  with a gloss, a dashed engraved line and the deck's four gold signs on it, the letter in gold with a dark edge. Raster: the soft
 *  shadows are baked here. */
export function legendCrestHtml(deck: DeckCode, col: string, font: LegendFont): string {
  const M = LB_METAL, T = LB_TYPE[font], C = 45, st = (a: [number, string][]) => a.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const beads = Array.from({ length: 40 }, (_, i) => i).map(i => { const a = i * Math.PI / 20; return `<circle cx="${n2(C + 39.3 * Math.sin(a))}" cy="${n2(C - 39.3 * Math.cos(a))}" r="1.25"/>`; }).join('');
  const signs = [0, 90, 180, 270].map(a => `<g transform="translate(${n2(C + 28.3 * Math.sin(a * Math.PI / 180))} ${n2(C - 28.3 * Math.cos(a * Math.PI / 180))}) scale(1.3)">${CREST_SIGN[deck]}</g>`).join('');
  // the dashed engraved line round the enamel, broken where a sign stands
  const arc = (a0: number, a1: number) => { const p = (a: number) => `${n2(C + 28.3 * Math.sin(a * Math.PI / 180))} ${n2(C - 28.3 * Math.cos(a * Math.PI / 180))}`; return `M${p(a0)}A28.3 28.3 0 0 1 ${p(a1)}`; };
  const dashes = [0, 90, 180, 270].map(a => arc(a + 11, a + 79)).join('');
  return `<svg width="90" height="92" viewBox="0 0 90 92" ${ns}><defs>`
    + `<linearGradient id="r" x1="0" y1="0" x2="1" y2="1">${st([[0, M.hi], [.22, M.light], [.42, M.warm], [.55, '#ffe48c'], [.75, M.mid], [1, M.deep]])}</linearGradient>`
    + `<linearGradient id="v" x1="0" y1="0" x2="0" y2="1">${st([[0, M.deep], [.5, M.warm], [1, M.light]])}</linearGradient>`
    + `<radialGradient id="e" cx=".5" cy=".38" r=".62">${st([[0, lighten(col, .28)], [.55, col], [.85, darken(col, .35)], [1, darken(col, .6)]])}</radialGradient>`
    + `<radialGradient id="g" cx=".5" cy=".2" r=".55">${st([[0, 'rgba(255,255,255,.34)'], [1, 'rgba(255,255,255,0)']])}</radialGradient>`
    + `<linearGradient id="t" x1="0" y1="0" x2="0" y2="1">${st([[0, M.hi], [.35, M.light], [.5, M.mid], [.52, M.warm], [.8, M.light], [1, M.mid]])}</linearGradient>`
    + `<radialGradient id="b" cx=".35" cy=".3" r=".8">${st([[0, '#fffbe6'], [.5, M.light], [1, M.deep]])}</radialGradient>`
    + `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>`
    + `<filter id="l" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.3" stdDeviation=".8" flood-color="#000" flood-opacity=".7"/></filter></defs>`
    + `<circle cx="${C}" cy="${C + 2.2}" r="43" fill="#000" fill-opacity=".6" filter="url(#s)"/>`
    + `<circle cx="${C}" cy="${C}" r="43" fill="url(#r)" stroke="${M.edge}" stroke-width="1"/>`
    + `<g fill="url(#b)" stroke="${M.deep}" stroke-width=".35">${beads}</g>`
    + `<circle cx="${C}" cy="${C}" r="36.4" fill="none" stroke="${M.edge}" stroke-width="1.2"/><circle cx="${C}" cy="${C}" r="35.5" fill="url(#v)"/>`
    + `<circle cx="${C}" cy="${C}" r="31.8" fill="url(#e)" stroke="${M.edge}" stroke-width="1"/>`
    + `<ellipse cx="${C}" cy="${C - 13}" rx="24" ry="14" fill="url(#g)"/>`
    + `<path d="${dashes}" fill="none" stroke="${M.light}" stroke-opacity=".65" stroke-width=".9" stroke-dasharray="2.2 1.6"/>`
    + `<g fill="${M.light}" stroke="${M.edge}" stroke-width=".3" stroke-linejoin="round" filter="url(#l)">${signs}</g>`
    + `<text x="${C}" y="${C + (font === 'wet' ? 14 : 13)}" text-anchor="middle" font-family="${T.family}" font-weight="${T.weight}" font-size="${font === 'wet' ? 38 : 40}" fill="url(#t)" stroke="${M.edge}" stroke-width="2" paint-order="stroke" stroke-linejoin="round" filter="url(#l)">${deck}</text>`
    + `</svg>`;
}

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
