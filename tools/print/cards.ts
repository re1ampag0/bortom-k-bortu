// Card faces, card backs and their sheets (3 × 3 on A4), in millimetres. The face follows the approved mock-up
// docs/mockups/print/V2type.html («В-2 стекло») with the print corrections of docs/tasks/print-kit.md 3.3 and the
// reviews: taller deck strip, minimal font sizes, white rule text, the fan index under the medal.
import fs from 'node:fs';
import path from 'node:path';
import { data, esc, mm, rich, read, HERE, ROOT, RICH_CSS, fontCss, BASE_CSS, type Ctx, type PageSpec } from './kit';
import { BRASS, BRASS_DARK, BRASS_LIGHT, DECK_BAND, DECK_KEY, DECK_NAME, DECK_RIM, DECK_TINT, LEGEND, ON_GLASS, SEA, TYPE, cutColor, darken, lighten, type CardType, type DeckCode } from './colors';
import { A4, BLEED, BLEED_BOX, CARD, FACE, GRID, backSheet, cutLines, deckSheets, legendSheets, seaSheets, slot, slug, priceOf, type BackKind, type DeckCard, type Item, type SeaCard, type Sheet } from './layout';
import { emblemSvg } from './parts/boards/emblem';
import { basePalette, type ShipKey } from './parts/boards/frame';
import { iconImg, ROSE_URI, typeIconUri } from './icons';
import { backArtSvg, backSpec, backVariants, hasScene, makeArt, plainSvg, portraitSvg, profiled, type ArtInfo, type BackSpec } from './art';
import { wxSvg } from '../../src/ui/game/art/wx';

export const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/cards.json'), 'utf8'));
/** Back designs that exist (docs/tasks/print-kit.md 4.10): 1 «Корабль в море»; 2 and 3 come with stage Б. */
export const BACK_VARIANTS: (1 | 2 | 3)[] = backVariants();
export interface Mode { glass: 'type' | 'ship'; index: boolean; backs: 1 | 2 | 3 }
/** What the fitting pass decided for one face: sizes in pt, what stayed on the plate, the plate's height in mm. */
export interface Fit { name: number; wrap: boolean; tp: number; big: boolean; flavor: boolean; fvBreak: boolean; h: number; over: boolean; idx: number; idxW: number; idxBottom: number }

const G = FACE.glass, MAX_GLASS = CARD.h - G.minTop - G.bottom, LG = FACE.legend, MAX_GLASS_LEGEND = CARD.h - G.minTop - LG.glass.bottom;

export const CARD_CSS = `${RICH_CSS}
.cd{position:absolute;width:${mm(CARD.w)};height:${mm(CARD.h)};overflow:hidden;background:#1c120a;color:#fff}
.cd .art{position:absolute;left:0;top:0;width:${mm(CARD.w)};height:${mm(CARD.h)}}
.cd .fr{position:absolute;inset:0;border:2mm solid var(--frame);box-sizing:border-box}
.cd .bd{position:absolute;left:0;right:0;bottom:0;height:${mm(FACE.band.h)};background:linear-gradient(rgba(0,0,0,0),var(--band) 26%)}
.cd .bd span{position:absolute;left:0;right:0;bottom:${mm(FACE.band.textCenter)};transform:translateY(50%);text-align:center;font:800 6.5pt/1 'Alegreya Sans',sans-serif;letter-spacing:.14em;color:#f6e7c1;white-space:nowrap}
.cd .bd i{position:absolute;right:4.4mm;bottom:${mm(FACE.band.textCenter)};transform:translateY(50%);font:800 9.5pt/1 'Alegreya Sans',sans-serif;font-style:normal;letter-spacing:.04em;color:#f6e7c1}
.gl{position:absolute;left:${mm(G.inset)};right:${mm(G.inset)};bottom:${mm(G.bottom)};border-radius:${mm(G.radius)};box-sizing:border-box;border:.25mm solid var(--rim);padding:1.9mm 2.1mm 1.7mm;display:flex;flex-direction:column;align-items:center;gap:.95mm;text-align:center;color:${ON_GLASS.text}}
.nm{font:700 14pt/1 'Alegreya SC',serif;color:${ON_GLASS.name};white-space:nowrap;max-width:100%;overflow:hidden;padding-bottom:.2mm}
.nm.wrap{white-space:normal;text-wrap:balance;line-height:1.02;overflow:visible}
.vr{width:19mm;height:.26mm;flex:none;background:linear-gradient(90deg,rgba(226,183,92,0),${BRASS_LIGHT},rgba(226,183,92,0))}
.rb{flex:none;padding:.55mm 3.1mm .85mm;clip-path:polygon(1.7mm 0,calc(100% - 1.7mm) 0,100% 50%,calc(100% - 1.7mm) 100%,1.7mm 100%,0 50%);font:500 7pt/1 'Alegreya Sans',sans-serif;letter-spacing:.05em;white-space:nowrap;color:#fff}
.rb b{font-weight:800;letter-spacing:.14em}
.bg{font:800 11pt/1.08 'Alegreya Sans',sans-serif;color:${ON_GLASS.big}}
.tx{font:500 9pt/1.24 Alegreya,serif;text-wrap:pretty}
.tx b,.pl b{font-weight:800}
.pl{display:flex;align-items:baseline;justify-content:center;gap:1.2mm;font:500 9pt/1.22 Alegreya,serif}
.pl>div{text-align:left}
.pl span{flex:none;padding:.35mm 1.2mm .6mm;border-radius:.6mm;background:#1d1d1f;border:.2mm solid rgba(242,214,138,.7);color:#f2d68a;font:800 6pt/1 'Alegreya Sans',sans-serif;letter-spacing:.14em}
.fv{font:italic 500 7pt/1.18 Alegreya,serif;color:${ON_GLASS.text};border-top:.2mm solid rgba(226,183,92,.55);padding-top:.55mm;width:100%;text-wrap:balance}
.ix{white-space:normal;position:absolute;left:${mm(FACE.index.x)};top:${mm(FACE.index.y)};max-width:${mm(FACE.index.maxW)};box-sizing:border-box;padding:.6mm 1.1mm .8mm;border-radius:1.5mm;background:rgba(14,11,9,${FACE.index.alpha});color:${ON_GLASS.cream};font:700 7pt/1.08 'Alegreya Sans',sans-serif;text-align:left}
.lg{position:absolute;white-space:nowrap}
/* the Legend («ЛЕГЕНДА»): engraved gold frame (SVG), golden glass baked into the picture, dark ink, the medallion, the ship's ribbon */
.cd.lgd .lgf{position:absolute;left:0;top:0;width:${mm(CARD.w)};height:${mm(CARD.h)}}
.cd.lgd .gl{left:${mm(LG.glass.inset)};right:${mm(LG.glass.inset)};bottom:${mm(LG.glass.bottom)};border:.35mm solid ${LEGEND.glass.rim};color:${LEGEND.ink.text}}
.cd.lgd .gl::before{content:'';position:absolute;inset:.55mm;border:.2mm solid rgba(122,82,8,.55);border-radius:${mm(G.radius - .5)};pointer-events:none}
.cd.lgd .nm{color:${LEGEND.ink.name};font-weight:800;text-shadow:-.13mm -.13mm 0 ${LEGEND.ink.light},.17mm .22mm 0 #a8700e}
.cd.lgd .vr{width:28mm;height:.3mm;background:linear-gradient(90deg,rgba(92,58,6,0),${LEGEND.frame.line},rgba(92,58,6,0))}
.cd.lgd .bg{color:${LEGEND.ink.big}}
.cd.lgd .fv{color:${LEGEND.ink.text};border-top-color:rgba(92,58,6,.6)}
.cd.lgd .s-w{color:${LEGEND.ink.soul} !important}
.cd.lgd .bd{left:${mm(LG.ribbon.x - LG.ribbon.tail)};width:${mm(LG.ribbon.w + 2 * LG.ribbon.tail)};top:${mm(LG.ribbon.y)};bottom:auto;height:${mm(LG.ribbon.h + 1)};background:none}
.cd.lgd .bd svg{position:absolute;left:0;top:0;width:100%;height:100%}
.cd.lgd .bd span{bottom:auto;top:${mm(LG.ribbon.h / 2)};transform:translateY(-50%);color:#fff2d0}
.cd.lgd .lg{left:50%;top:${mm(LG.medallion.cy - LG.medallion.h / 2)};width:${mm(LG.medallion.w)};height:${mm(LG.medallion.h)};transform:translateX(-50%);padding:0;background:none;border:0;border-radius:0;font:italic 500 6.5pt/1 Alegreya,serif;color:#f8e6b8;letter-spacing:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.45mm}
.cd.lgd .lg svg{position:absolute;left:0;top:0;width:100%;height:100%}
.cd.lgd .lg b{position:relative;font:800 7.5pt/1 'Alegreya SC',serif;font-style:normal;letter-spacing:.13em;margin-right:-.13em;color:#ffe08a}
.cd.lgd .lg i{position:relative;font-style:italic}
/* the spare card: a parchment plate to write on */
.gl.paper{background:linear-gradient(#faf2de,#e8d6ac);border-color:${BRASS};color:#6e5a3c;justify-content:flex-start}
.gl.paper .nl{width:100%;height:.2mm;background:#b9a274;margin-top:6.2mm}
.gl.paper .sp{font:italic 500 7pt/1 Alegreya,serif}
/* «Как читать карту»: parchment */
.cd.ht{background:linear-gradient(#faf2de,#e6d3a8);color:#33240f}
.ht .in{position:absolute;inset:4.6mm 4.4mm 4.2mm;display:flex;flex-direction:column;gap:1.15mm}
.ht h3{margin:0;text-align:center;font:700 11pt/1 'Alegreya SC',serif;color:#2a180c}
.ht .ld{text-align:center;font:500 7.8pt/1.14 Alegreya,serif;color:#5a4628}
.ht .ln{height:.2mm;background:#9b7a45;flex:none}
.ht .rw{display:flex;align-items:center;gap:1.6mm}
.ht .rw img{flex:none;width:8.4mm;height:8.7mm;margin:-.9mm -.6mm -1.2mm -.9mm;position:static}
.ht .rw div{display:flex;flex-direction:column;gap:.35mm}
.ht .rw b{display:block;font:800 7pt/1 'Alegreya Sans',sans-serif;letter-spacing:.12em}
.ht .rw span{display:block;font:500 7.8pt/1.02 Alegreya,serif}
.ht.sea p{font-size:9pt;line-height:1.2}
.ht.sea .in{gap:1.8mm}
.ht p{margin:0;font:500 8pt/1.17 Alegreya,serif}
.ht p b{font-weight:800}
/* backs */
.bk{position:absolute;width:${mm(CARD.w)};height:${mm(CARD.h)};overflow:hidden;background:var(--ground)}
.bk .art{position:absolute;left:0;top:0;width:${mm(CARD.w)};height:${mm(CARD.h)}}
.bk .tt{position:absolute;left:0;right:0;top:9.6mm;text-align:center;font:700 12pt/1 'Alegreya SC',serif;letter-spacing:.14em;color:#f3dc9d}
.bk .tr{position:absolute;left:50%;top:15.2mm;width:25mm;margin-left:-12.5mm;height:.2mm;background:linear-gradient(90deg,rgba(217,171,82,0),#d9ab52,rgba(217,171,82,0))}
.bk .cr{position:absolute;left:50%;top:57.4mm;width:18.9mm;height:18.9mm;margin-left:-9.45mm}
.bk .bn{position:absolute;left:9mm;right:9mm;top:74.6mm;text-align:center;font:700 9.6pt/1.05 'Alegreya SC',serif;color:#fff2d4;letter-spacing:.04em}
.bk.nt .pp{position:absolute;inset:10mm;border-radius:5mm;background:linear-gradient(#f4e8c8,#e2cfa0)}
.bk.nt .tt{top:26mm;left:10mm;right:10mm;color:#5a3c14;font-size:10.5pt;letter-spacing:.08em}
.bk.nt .rs{position:absolute;left:50%;top:36mm;width:22mm;height:22mm;margin-left:-11mm}
/* the Legend's back: gold on dark, its own SVG */
.bk.lgb svg{position:absolute;left:0;top:0;width:${mm(CARD.w)};height:${mm(CARD.h)}}
/* sheet furniture */
.sh-bleed{position:absolute;left:${mm(BLEED_BOX.x)};top:${mm(BLEED_BOX.y)};width:${mm(BLEED_BOX.w)};height:${mm(BLEED_BOX.h)}}
.sh-blank{position:absolute;width:${mm(CARD.w)};height:${mm(CARD.h)};background:#fff}
.sh-svg{position:absolute;left:0;top:0;width:${mm(A4.w)};height:${mm(A4.h)}}
.sh-lab{background:#fff;padding:.6mm 1.2mm;margin:-.6mm -1.2mm;position:absolute;left:${mm(GRID.x0)};top:6.2mm;font:700 8pt/1 'Alegreya Sans',sans-serif;color:#555;letter-spacing:.03em;white-space:nowrap}
.sh-rul{background:#fff;padding:.4mm 0;margin-top:-.4mm;position:absolute;right:${mm(GRID.x0)};top:5.6mm;width:50mm;font:500 6.5pt/1 'Alegreya Sans',sans-serif;color:#555;text-align:center;white-space:nowrap}
.sh-sub{position:absolute;left:${mm(GRID.x0 + 4)};right:${mm(GRID.x0 + 54)};top:9.4mm;font:500 7pt/1.1 'Alegreya Sans',sans-serif;color:#444;background:#fff}
.sh-shift{position:absolute;left:0;top:0;width:${mm(A4.w)};height:${mm(A4.h)}}
`;

const ribbon = (bold: string, rest: string, t: { t: string; td: string }) => `<div class="rb" style="background:linear-gradient(${darken(t.t, .18)},${t.td})"><b>${esc(bold)}</b>${rest ? ' · ' + esc(rest) : ''}</div>`;
const splitPlan = (text: string): [string, string] => { const [rule, plan = ''] = text.split(/<b>План:<\/b>/); return [rule.replace(/(<br\s*\/?>\s*)+$/, ''), plan.trim()]; };
/** Short lines (big result, flavour): a dash does not start a line, a number stays with its word. */
const typo = (t: string) => esc(t).replace(/ (—|–) /g, '\u00a0$1 ').replace(/(\d) (?=[А-ЯЁа-яё])/g, '$1\u00a0');
const nameStart = (n: string, legend = false) => legend ? (n.length <= 10 ? 16 : n.length <= 14 ? 15.5 : 15) : n.length <= 10 ? 14 : n.length <= 14 ? 13 : 12;

interface FaceSpec { key: string; name: string; art: string; frame: string; band: string; rim: string; tint: string; bandText: string; copies: number; medal: string; ribbon: string; big: string; text: string; flavor: string; price: { powder: number; soul: number }; legend: boolean; index: boolean; sceneName: string | null; artKey: string }

export function faceSpec(item: Extract<Item, { kind: 'card' | 'legend' | 'sea' }>, mode: Mode): FaceSpec {
  if (item.kind === 'sea') {
    const c: SeaCard = item.card;
    return { key: 'sea|' + c.name, name: c.name, art: '', frame: SEA.band, band: SEA.band, rim: SEA.rim, tint: SEA.tint, bandText: TXT.seaBand, copies: 1, medal: 'medal-sea', ribbon: ribbon(c.when.toUpperCase(), '', SEA), big: c.big, text: c.text, flavor: c.flavor, price: { powder: 0, soul: 0 }, legend: false, index: false, sceneName: null, artKey: 'sea-' + c.key };
  }
  const c: DeckCard = item.card, deck: DeckCode = item.deck, t = TYPE[c.type as CardType], legend = item.kind === 'legend';
  const when = legend && c.type === 'РЕАКЦИЯ' ? TXT.ribbonLegendJack : t.when;
  return {
    key: deck + '|' + c.name, name: c.name, art: '', frame: legend ? LEGEND.frame.mid : DECK_BAND[deck], band: DECK_BAND[deck],
    // the Legend's glass is golden in both modes (its own card type), never the ship's colour
    rim: legend ? LEGEND.glass.rim : mode.glass === 'ship' ? DECK_RIM[deck] : t.t, tint: legend ? LEGEND.glass.lo : mode.glass === 'ship' ? DECK_TINT[deck] : t.tint,
    bandText: DECK_NAME[deck].toUpperCase(), copies: legend ? 1 : c.copies ?? 1, medal: 'medal-' + t.key, ribbon: ribbon(c.type, when, t),
    big: c.big, text: c.text, flavor: c.flavor, price: priceOf(c), legend, index: mode.index && !legend,
    sceneName: legend ? null : c.name, artKey: legend ? 'legend-' + DECK_KEY[deck] : slug(c.name)
  };
}

// ——— the Legend: frame, medallion, ribbon, back (own SVG, units mm) ———
const n2 = (v: number) => String(Math.round(v * 100) / 100);
const LF = LEGEND.frame;
/** The engraved gold frame of a Legend face: a flat gold edge (the cut forgives a miss), two engraved rails with a twisted
 *  rope between them, a rosette in every corner and a lozenge in the middle of each long side. */
const LEGEND_FRAME_SVG = (() => {
  const W = CARD.w, H = CARD.h, F = LG.frame, a = 1.1, b = F - .45, c = (a + b) / 2;
  // a rope along a side of length len (local x along the side, y across from the edge inwards): slanted twists
  const rope = (len: number, from: number, to: number, gaps: [number, number][] = []) => {
    let d = '', h = '';
    for (let x = from; x + .8 <= to; x += .95) {
      if (gaps.some(([g0, g1]) => x + .8 > g0 && x < g1)) continue;
      d += `M${n2(x)} ${n2(b - .25)}L${n2(x + .8)} ${n2(a + .25)}`;
      h += `M${n2(x - .2)} ${n2(b - .45)}L${n2(x + .45)} ${n2(a + .55)}`;
    }
    void len;
    return `<path d="${d}" stroke="${LF.deep}" stroke-width=".38" stroke-linecap="round" fill="none"/><path d="${h}" stroke="${LF.light}" stroke-width=".16" stroke-linecap="round" fill="none"/>`;
  };
  const side = (len: number, tf: string, gaps: [number, number][] = []) => `<g transform="${tf}">${rope(len, F + .3, len - F - .3, gaps)}</g>`;
  const mid = H / 2;
  const rosette = (x: number, y: number) => `<g transform="translate(${n2(x)} ${n2(y)})"><circle r="1.25" fill="${LF.deep}"/>`
    + [0, 90, 180, 270].map(r => `<ellipse cx="0" cy="-.62" rx=".38" ry=".62" fill="${LF.light}" transform="rotate(${r + 45})"/>`).join('')
    + `<circle r=".42" fill="${LF.mid}" stroke="${LF.line}" stroke-width=".16"/></g>`;
  const lozenge = (x: number, y: number) => `<path d="M${n2(x)} ${n2(y - 1.5)}L${n2(x + .95)} ${n2(y)}L${n2(x)} ${n2(y + 1.5)}L${n2(x - .95)} ${n2(y)}Z" fill="${LF.deep}" stroke="${LF.light}" stroke-width=".16"/><circle cx="${n2(x)}" cy="${n2(y)}" r=".32" fill="${LF.light}"/>`;
  const ring = `M0 0H${W}V${H}H0Z M${F} ${F + 1}Q${F} ${F} ${F + 1} ${F}H${W - F - 1}Q${W - F} ${F} ${W - F} ${F + 1}V${H - F - 1}Q${W - F} ${H - F} ${W - F - 1} ${H - F}H${F + 1}Q${F} ${H - F} ${F} ${H - F - 1}Z`;
  const rail = (o: number) => `M${n2(o)} ${n2(o)}H${n2(W - o)}V${n2(H - o)}H${n2(o)}Z`;
  return `<svg class="lgf" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lgf-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${LF.light}"/><stop offset=".3" stop-color="${LF.mid}"/><stop offset=".55" stop-color="${LF.light}"/><stop offset=".8" stop-color="${LF.mid}"/><stop offset="1" stop-color="${LF.deep}"/></linearGradient></defs>`
    + `<path d="${ring}" fill-rule="evenodd" fill="${LF.mid}"/>`
    // the channel between the rails carries the metal sheen; the edge outside stays flat (the bleed has its colour)
    + `<path d="${rail(a)} ${rail(F)}" fill-rule="evenodd" fill="url(#lgf-g)"/>`
    + side(W, 'translate(0 0)') + side(W, `translate(${W} ${H}) rotate(180)`)
    + side(H, `translate(0 ${H}) rotate(-90)`, [[mid - 2.2, mid + 2.2]]) + side(H, `translate(${W} 0) rotate(90)`, [[mid - 2.2, mid + 2.2]])
    + `<path d="${rail(a)}" fill="none" stroke="${LF.line}" stroke-width=".22"/><path d="${rail(b)}" fill="none" stroke="${LF.line}" stroke-width=".22"/>`
    + `<path d="M${F} ${F + 1}Q${F} ${F} ${F + 1} ${F}H${W - F - 1}Q${W - F} ${F} ${W - F} ${F + 1}V${H - F - 1}Q${W - F} ${H - F} ${W - F - 1} ${H - F}H${F + 1}Q${F} ${H - F} ${F} ${H - F - 1}Z" fill="none" stroke="${LF.line}" stroke-width=".3"/>`
    + [[c, c], [W - c, c], [c, H - c], [W - c, H - c]].map(([x, y]) => rosette(x, y)).join('') + lozenge(c, mid) + lozenge(W - c, mid)
    + `</svg>`;
})();

/** The «Легенда · раз за игру» medallion: an oval with a laurel wreath on its gold rim, a dark field for the words. */
const MEDALLION_SVG = (() => {
  const { w, h } = LG.medallion, rx = w / 2, ry = h / 2, cx = rx, cy = ry;
  const at = (k: number, t: number) => [cx + rx * k * Math.sin(t), cy - ry * k * Math.cos(t)];
  // the wreath: two branches rising from the bottom to the top, leaves pointing up along the rim
  let leaves = '';
  const N = 15;
  for (const sgn of [1, -1]) for (let i = 0; i < N; i++) {
    const t = Math.PI - sgn * (i + .7) * (Math.PI - .3) / N, [x, y] = at(.86, t), [x2, y2] = at(.86, t - sgn * .05);
    const ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI + (i % 2 ? 22 : -22) * sgn;
    leaves += `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx=".72" ry=".3" transform="rotate(${n2(ang)} ${n2(x)} ${n2(y)})" fill="${LF.deep}"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lgm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LF.light}"/><stop offset=".5" stop-color="${LF.mid}"/><stop offset="1" stop-color="${LF.deep}"/></linearGradient>`
    + `<radialGradient id="lgm-f" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#6a2410"/><stop offset="1" stop-color="#2e0c04"/></radialGradient></defs>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${n2(rx - .05)}" ry="${n2(ry - .05)}" fill="url(#lgm-g)" stroke="${LF.line}" stroke-width=".25"/>${leaves}`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${n2(rx - 1.75)}" ry="${n2(ry - 1.6)}" fill="url(#lgm-f)" stroke="${LF.line}" stroke-width=".3"/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${n2(rx - 2.2)}" ry="${n2(ry - 2.05)}" fill="none" stroke="${LF.mid}" stroke-width=".16"/></svg>`;
})();

/** The ship's ribbon at the bottom of a Legend: a band in the ship's colour with forked tails folded behind it. */
function ribbonSvg(col: string): string {
  const { w, h, tail } = LG.ribbon, W = w + 2 * tail, dk = darken(col, .45), x0 = tail, x1 = tail + w, d = 1;
  const tailL = `M${x0 + 1.2} ${d}H0L${n2(tail * .45)} ${n2(d + h / 2)}L0 ${h + d}H${x0 + 1.2}Z`;
  const tailR = `M${x1 - 1.2} ${d}H${W}L${n2(W - tail * .45)} ${n2(d + h / 2)}L${W} ${h + d}H${x1 - 1.2}Z`;
  return `<svg viewBox="0 0 ${W} ${h + 1}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="${tailL}${tailR}" fill="${dk}" stroke="${LF.deep}" stroke-width=".25"/>`
    + `<path d="M${x0} ${d}L${x0 + .9} 0M${x1} ${d}L${x1 - .9} 0" stroke="${dk}" stroke-width=".25"/><path d="M${x0} 0V${h}H${x1}V0Z" fill="${col}" stroke="${LF.mid}" stroke-width=".3"/>`
    + `<path d="M${x0 + .6} .55H${x1 - .6}M${x0 + .6} ${n2(h - .55)}H${x1 - .6}" stroke="${LF.mid}" stroke-width=".18" fill="none"/></svg>`;
}

/** The Legend's back: gold on a dark ground (the same dark at every edge — the sheet's bleed), an ornamental frame no closer
 *  than BACK_CLEAR to the edge, «ЛЕГЕНДА» on top, the ship's emblem (as on its board) in the middle, the ship's name under it. */
const legendBacks = new Map<DeckCode, string>();
function legendBackSvg(deck: DeckCode): string {
  const done = legendBacks.get(deck); if (done) return done;
  const W = CARD.w, H = CARD.h, B = LEGEND.back, ship = data.ships.find(sh => sh.code === deck)!, pal = basePalette(ship.color), id = 'lgb' + DECK_KEY[deck];
  const core = lighten(darken(DECK_BAND[deck], .35), .06), x0 = 9, y0 = 9, x1 = W - 9, y1 = H - 9, cx = W / 2;
  const gold = `url(#${id}-g)`;
  // the frame: a heavy outer rule and a fine inner one, the corners cut in a quarter circle with a rosette in the notch
  const r = 3.2, frame = (o: number) => `M${x0 + o + r} ${y0 + o}H${x1 - o - r}A${r} ${r} 0 0 0 ${x1 - o} ${y0 + o + r}V${y1 - o - r}A${r} ${r} 0 0 0 ${x1 - o - r} ${y1 - o}H${x0 + o + r}A${r} ${r} 0 0 0 ${x0 + o} ${y1 - o - r}V${y0 + o + r}A${r} ${r} 0 0 0 ${x0 + o + r} ${y0 + o}Z`;
  const corner = (x: number, y: number, sx: number, sy: number) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M.2 2.6Q1.6 1.6 2.6 .2" stroke="${B.gold}" stroke-width=".3" fill="none"/><circle cx="1" cy="1" r=".75" fill="${B.gold}"/><circle cx="1" cy="1" r=".3" fill="${B.edge}"/>`
    + `<path d="M3.6 1.1q1.8 -.2 3 .9q-1.6 .3 -3 -.9ZM1.1 3.6q-.2 1.8 .9 3q.3 -1.6 -.9 -3Z" fill="${B.gold}"/></g>`;
  // a fine gold lattice inside the frame (diagonal: a shifted back shows no line parallel to its edge)
  let lat = ''; for (let k = -90; k < 90; k += 3.2) lat += `M${n2(x0 + k)} ${y0}l${H} ${H}M${n2(x1 - k)} ${y0}l${-H} ${H}`;
  // a divider: a lozenge between two laurel sprigs (a stem, pointed leaves in pairs growing outwards)
  const leaf = (x: number, y: number, ang: number, len = 1.9, w = .62) => `<path d="M0 0Q${n2(len * .45)} ${-w} ${len} 0Q${n2(len * .45)} ${w} 0 0Z" fill="${B.gold}" transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(ang)})"/>`;
  const sprig = (y: number, s: number) => `<path d="M${n2(cx + s * 2.6)} ${y}Q${n2(cx + s * 9)} ${n2(y + .5)} ${n2(cx + s * 16)} ${n2(y - .4)}" stroke="${B.gold}" stroke-width=".28" fill="none"/>`
    + [0, 1, 2, 3].map(i => { const x = cx + s * (4.2 + i * 3), yy = y + .25 - i * .12, out = s > 0 ? 0 : 180; return leaf(x, yy, out - s * 32) + leaf(x + s * .6, yy, out + s * 32); }).join('') + leaf(cx + s * 16, y - .4, s > 0 ? -8 : 188, 1.6, .5);
  const divider = (y: number) => sprig(y, -1) + sprig(y, 1) + `<path d="M${cx} ${y - 1.3}L${cx + 1.5} ${y}L${cx} ${y + 1.3}L${cx - 1.5} ${y}Z" fill="${B.gold}"/><circle cx="${cx}" cy="${y}" r=".38" fill="${B.edge}"/>`;
  const word = (t: string, y: number, size: number, ls: number, w = 800) => [[.3, .38, '#000'], [-.14, -.14, B.goldLight], [0, 0, gold]].map(([dx, dy, f]) =>
    `<text x="${n2(cx + +dx)}" y="${n2(y + +dy)}" text-anchor="middle" font-family="Alegreya SC" font-weight="${w}" font-size="${n2(size * 25.4 / 72)}" letter-spacing="${ls}em" fill="${f}"${f === '#000' ? ' fill-opacity=".7"' : ''}>${esc(t)}</text>`).join('');
  const R = 11.8, ey = 45.6;
  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>`
    + `<radialGradient id="${id}-bg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${core}"/><stop offset=".45" stop-color="${lighten(B.core, .02)}"/><stop offset=".78" stop-color="${B.edge}"/><stop offset="1" stop-color="${B.edge}"/></radialGradient>`
    + `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${B.goldLight}"/><stop offset=".55" stop-color="${B.gold}"/><stop offset="1" stop-color="${B.goldDeep}"/></linearGradient>`
    + `<radialGradient id="${id}-h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${DECK_RIM[deck]}" stop-opacity=".55"/><stop offset=".6" stop-color="${DECK_RIM[deck]}" stop-opacity=".18"/><stop offset="1" stop-color="${DECK_RIM[deck]}" stop-opacity="0"/></radialGradient>`
    + `<clipPath id="${id}-c"><path d="${frame(1.6)}"/></clipPath></defs>`
    + `<rect width="${W}" height="${H}" fill="${B.edge}"/><rect width="${W}" height="${H}" fill="url(#${id}-bg)"/>`
    + `<g clip-path="url(#${id}-c)"><path d="${lat}" stroke="${B.gold}" stroke-width=".16" stroke-opacity=".16" fill="none"/></g>`
    + `<path d="${frame(0)}" fill="none" stroke="${gold}" stroke-width=".7"/><path d="${frame(1.6)}" fill="none" stroke="${B.gold}" stroke-width=".25"/>`
    + corner(x0, y0, 1, 1) + corner(x1, y0, -1, 1) + corner(x0, y1, 1, -1) + corner(x1, y1, -1, -1)
    + `<circle cx="${cx}" cy="${ey}" r="21" fill="url(#${id}-h)"/>` + word(TXT.legendBack, 20.4, 16.5, .1) + divider(24.8)
    + emblemSvg(DECK_KEY[deck] as ShipKey, cx, ey, R, { id, letter: deck, size: 19 * R / 6.9, solid: pal.solid, deep: pal.deep })
    + divider(66.2) + word(DECK_NAME[deck], 72.6, 8.6, .04, 700)
    + `</svg>`;
  legendBacks.set(deck, svg); return svg;
}
/** The colour of a Legend back's edge: the bleed of the Legend sheet's back side. */
export const LEGEND_BACK_EDGE = LEGEND.back.edge;
const legendBackHtml = (deck: DeckCode, pos: string) => `<div class="bk lgb" style="${pos}--ground:${LEGEND.back.edge}">${legendBackSvg(deck)}</div>`;

/** The face. fit = null: the measuring pass (everything on the plate, sizes set by the script). */
export function faceHtml(ctx: Ctx, s: FaceSpec, fit: Fit | null, artUrl: string, pos = ''): string {
  const [rule, plan] = splitPlan(s.text), tp = fit?.tp ?? 9;
  const big = s.big && (!fit || fit.big) ? `<div class="bg">${typo(s.big)}</div>` : '';
  const flavor = s.flavor && (!fit || fit.flavor) ? `<div class="fv">${fit?.fvBreak ? typo(s.flavor).replace(/([.!?…]) /, '$1<br>') : typo(s.flavor)}</div>` : '';
  const P = FACE.price, px = CARD.w - P.right - P.d;
  let price = '', small = '';
  if (s.price.powder) { price += iconImg(ctx, `coin-${s.price.powder}`, px, P.y); }
  if (s.price.soul) { price += iconImg(ctx, `flask-${s.price.soul}`, px, P.y + (s.price.powder ? P.d + P.gap : 0)); }
  if (s.index) {
    const I = FACE.index, x = I.priceCx - I.priceD / 2, y = I.priceCy - I.priceD / 2;
    if (s.price.powder) small = iconImg(ctx, `coin-${s.price.powder}`, x, y, I.priceD, 'ixp');
    else if (s.price.soul) small = iconImg(ctx, `flask-${s.price.soul}`, x, y - .4, I.priceD, 'ixp');
  }
  const idx = ''; // the result plate under the medal is gone (user's decision 12.11): the result stays on the glass, the medal keeps the small price
  const L = s.legend, lg = L ? `<div class="lg">${MEDALLION_SVG}<b>${esc(TXT.legendPlate[0])}</b><i>${esc(TXT.legendPlate[1])}</i></div>` : '';
  const band = L ? `<div class="bd">${ribbonSvg(s.band)}<span>${esc(s.bandText)}</span></div>` : `<div class="bd"><span>${esc(s.bandText)}</span>${s.copies > 1 ? `<i>×${s.copies}</i>` : ''}</div>`;
  return `<div class="cd${L ? ' lgd' : ''}" data-key="${esc(s.key)}" data-index="${s.index ? 1 : 0}" data-maxh="${L ? MAX_GLASS_LEGEND : MAX_GLASS}" style="${pos}--frame:${s.frame};--band:${s.band};--rim:${s.rim}">`
    + (artUrl ? `<img class="art" src="${artUrl}" alt="">` : '')
    + band
    + `<div class="gl"${fit ? ` style="height:${mm(fit.h)}"` : ''}><div class="nm${fit?.wrap ? ' wrap' : ''}" style="font-size:${fit?.name ?? nameStart(s.name, L)}pt">${esc(s.name)}</div><div class="vr"></div>${s.ribbon}${big}`
    + `<div class="tx" style="font-size:${tp}pt">${rich(rule, !L)}</div>${plan ? `<div class="pl" style="font-size:${tp}pt"><span>${esc(TXT.plan)}</span><div>${rich(plan, !L)}</div></div>` : ''}${flavor}</div>`
    + (L ? LEGEND_FRAME_SVG : `<div class="fr"></div>`) + `${iconImg(ctx, s.medal, FACE.medal.x, FACE.medal.y)}${small}${idx}${price}${lg}</div>`;
}

/** The fitting pass: lays every distinct face out once and chooses sizes so the plate does not climb above 40 mm. */
export async function fitFaces(ctx: Ctx, specs: FaceSpec[]): Promise<Map<string, Fit>> {
  const page = await ctx.browser.newPage({ viewport: { width: 1200, height: 900 } });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}${BASE_CSS}${CARD_CSS}.cd{position:relative;display:inline-block;margin:2mm}</style></head><body>${specs.map(s => faceHtml(ctx, s, null, '')).join('')}</body></html>`;
  const f = path.join(ROOT, `out/print/html/_fit-${process.pid}.html`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html);
  await page.goto('file://' + f);
  await page.evaluate(() => document.fonts.ready);
  const res = await page.evaluate(({ maxDefault, I }) => {
    const MM = 96 / 25.4, out: Record<string, unknown> = {};
    for (const cd of Array.from(document.querySelectorAll<HTMLElement>('.cd'))) {
      const maxH = Number(cd.dataset.maxh) || maxDefault; // the Legend's plate sits lower and narrower: its own limit
      const gl = cd.querySelector<HTMLElement>('.gl')!, nm = gl.querySelector<HTMLElement>('.nm')!, tx = gl.querySelector<HTMLElement>('.tx')!, pl = gl.querySelector<HTMLElement>('.pl');
      const bg = gl.querySelector<HTMLElement>('.bg'), fv = gl.querySelector<HTMLElement>('.fv'), ix = cd.querySelector<HTMLElement>('.ix');
      let name = parseFloat(nm.style.fontSize), wrap = false;
      for (; ;) { nm.style.fontSize = name + 'pt'; if (nm.scrollWidth <= nm.clientWidth + .5) break; if (name <= 11) { wrap = true; nm.classList.add('wrap'); break; } name = Math.max(11, name - (name > 12 ? 1 : .5)); }
      // one order for every card (user's decision 12.11): the flavour line goes first, then the text shrinks to 7.5 pt, the big result goes last
      // [text pt, big result, flavour line]
      const steps: [number, boolean, boolean][] = [[9, true, true], [8.5, true, true], [8, true, true], [9, true, false], [8.5, true, false], [8, true, false], [7.5, true, false], [7.5, false, false]];
      let st = steps[0];
      for (st of steps) {
        tx.style.fontSize = st[0] + 'pt'; if (pl) pl.style.fontSize = st[0] + 'pt';
        if (bg) bg.style.display = st[1] ? '' : 'none'; if (fv) fv.style.display = st[2] ? '' : 'none';
        if (gl.getBoundingClientRect().height <= maxH * MM + .5) break;
      }
      // a two-sentence flavour line breaks between the sentences when that takes no more lines
      let fvBreak = false;
      if (fv && st[2] && /[.!?…] /.test(fv.textContent || '')) {
        const h0 = fv.getBoundingClientRect().height, old = fv.innerHTML;
        fv.innerHTML = old.replace(/([.!?…]) /, '$1<br>');
        if (fv.getBoundingClientRect().height <= h0 + .5) fvBreak = true; else fv.innerHTML = old;
      }
      let idx = 7, idxW = 0, idxBottom = 0;
      if (ix) {
        const top = cd.getBoundingClientRect().top, m = () => { const r = ix.getBoundingClientRect(); idxW = r.width / MM; idxBottom = (r.bottom - top) / MM; };
        // the plate is as wide as its text (a wrapped block would keep the full 16 mm)
        const snug = () => { ix.style.width = ''; const rg = document.createRange(); rg.selectNodeContents(ix); const cs = getComputedStyle(ix); ix.style.width = Math.ceil(rg.getBoundingClientRect().width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 1) + 'px'; };
        snug(); m(); if (idxBottom > I.maxBottom || idxW > I.maxW + .01) { idx = 6.5; ix.style.fontSize = '6.5pt'; snug(); m(); }
      }
      const h = gl.getBoundingClientRect().height / MM;
      out[cd.dataset.key!] = { name, wrap, tp: st[0], big: !!bg && st[1], flavor: !!fv && st[2], fvBreak, h: Math.ceil(h * 20) / 20, over: h > maxH + .2, idx, idxW, idxBottom };
    }
    return out;
  }, { maxDefault: MAX_GLASS, I: FACE.index });
  await page.close(); fs.rmSync(f, { force: true });
  return new Map(Object.entries(res) as [string, Fit][]);
}

// ——— pictures ———
/** Stage А stand-ins for cards without a portrait scene yet (review-repo 3). */
function legendTempSvg(deck: DeckCode): string {
  const ship = { 'Ж': 'Main', 'М': 'Revenge', 'И': 'Endeavour', 'Г': 'Dutchman' }[deck];
  const uri = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(ROOT, `src/ui/game/ship-window/art/${ship}-legend.svg`)).toString('base64');
  const c = DECK_BAND[deck];
  return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${darken(c, .45)}"/></linearGradient><linearGradient id="lb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${darken(c, .45)}"/><stop offset="1" stop-color="${darken(c, .7)}"/></linearGradient></defs>`
    + `<rect width="200" height="280" fill="url(#lb)"/><image href="${uri}" x="0" y="0" width="200" height="166" preserveAspectRatio="xMidYMid slice"/><rect y="126" width="200" height="41" fill="url(#lt)"/><rect y="166" width="200" height="114" fill="url(#lb)"/></svg>`;
}
function seaTempSvg(key: string): string {
  const icon = wxSvg(key, 124, 105).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" x="38" y="14" ');
  return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9dfc2"/><stop offset=".55" stop-color="#d3d9c8"/><stop offset="1" stop-color="#9fc0c4"/></linearGradient><linearGradient id="sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7f8e"/><stop offset="1" stop-color="#0e3442"/></linearGradient></defs>`
    + `<rect width="200" height="160" fill="url(#ss)"/><rect y="156" width="200" height="124" fill="url(#sw)"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${-10 + (i % 3) * 14} ${170 + i * 12}q25 -5 50 0t50 0t50 0t50 0t50 0" stroke="#bfe0ea" stroke-width="${(.5 + i * .09).toFixed(2)}" fill="none" opacity="${(.22 + i * .03).toFixed(2)}"/>`).join('')}${icon}</svg>`;
}
/** The sea deck's back until stage Б: sea, sky and the compass rose. */
function seaBackSvg(): string {
  return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12303c"/><stop offset=".6" stop-color="#2f6f7e"/><stop offset="1" stop-color="#9fd0cc"/></linearGradient><linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c7484"/><stop offset="1" stop-color="#0b2c38"/></linearGradient></defs>`
    + `<rect width="200" height="150" fill="url(#bs)"/><rect y="148" width="200" height="132" fill="url(#bw)"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${-12 + (i % 4) * 9} ${158 + i * 11}q25 -${4 + i * .3} 50 0t50 0t50 0t50 0t50 0" stroke="#c8ecf0" stroke-width="${(.5 + i * .1).toFixed(2)}" fill="none" opacity="${(.2 + i * .035).toFixed(2)}"/>`).join('')}`
    + `<image href="${ROSE_URI}" x="40" y="46" width="120" height="120" opacity=".92"/></svg>`;
}
/** A soft fade of the back's picture into the deck colour towards the edges: no line near the edge, a shifted back shows no white. */
const fadeEdges = (svg: string, ground: string) => svg.replace(/<\/svg>\s*$/, `<defs><filter id="fe" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter><mask id="fm"><rect x="-40" y="-40" width="280" height="360" fill="#fff"/><rect x="33" y="33" width="134" height="214" rx="22" fill="#000" filter="url(#fe)"/></mask></defs><rect x="-40" y="-40" width="280" height="360" fill="${ground}" mask="url(#fm)"/></svg>`).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

export interface CardKit { mode: Mode; fits: Map<string, Fit>; art: Map<string, ArtInfo>; specs: Map<string, FaceSpec>; backs: Map<string, string>; crest: Map<string, string>; backSpecs: Map<string, BackSpec> }

/** Fits every face, rasterises every picture (faces with their glass, backs) for one mode. */
export async function prepareCards(ctx: Ctx, mode: Mode, only?: Set<string>): Promise<CardKit> {
  const specs = new Map<string, FaceSpec>();
  for (const sh of [...deckSheets(data), ...legendSheets(data), ...seaSheets(data)]) for (const it of sh.items) if (it.kind === 'card' || it.kind === 'legend' || it.kind === 'sea') { const s = faceSpec(it, mode); if (!specs.has(s.key) && (!only || only.has(s.key))) specs.set(s.key, s); }
  const fits = await fitFaces(ctx, [...specs.values()]);
  const art = new Map<string, ArtInfo>();
  for (const s of specs.values()) {
    const fit = fits.get(s.key)!;
    let svg: string;
    if (ctx.opts.noArt) svg = plainSvg();
    else if (s.sceneName && hasScene(s.sceneName, ctx.opts.draftArt)) svg = portraitSvg(s.sceneName, ctx.opts.draftArt);
    else if (s.key.startsWith('sea|')) { const c = data.sea.find(x => 'sea|' + x.name === s.key)!; svg = hasScene(c.name, ctx.opts.draftArt) ? portraitSvg(c.name, ctx.opts.draftArt) : seaTempSvg(c.key); }
    else { const deck = s.key[0] as DeckCode; svg = hasScene(s.name, ctx.opts.draftArt) ? portraitSvg(s.name, ctx.opts.draftArt) : legendTempSvg(deck); }
    art.set(s.key, await makeArt(ctx, s.artKey, svg, s.legend
      ? { top: CARD.h - LG.glass.bottom - fit.h, tint: s.tint, gold: { lo: LEGEND.glass.lo, hi: LEGEND.glass.hi }, inset: LG.glass.inset, bottom: LG.glass.bottom }
      : { top: CARD.h - G.bottom - fit.h, tint: s.tint }));
  }
  const backs = new Map<string, string>(), crest = new Map<string, string>();
  const crestHtml = (letter: string, col: string) => `<div style="position:absolute;left:10px;top:10px;width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.18),${col} 62%);box-shadow:0 0 0 3px #d9ab52,0 0 0 6px rgba(0,0,0,.5),0 0 0 7.5px rgba(217,171,82,.7),0 6px 12px rgba(0,0,0,.6),inset 0 0 16px rgba(0,0,0,.5);font:700 40px/1 'Alegreya SC',serif;color:#fbe7b0;text-shadow:0 2px 0 rgba(0,0,0,.6)">${letter}<i style="position:absolute;inset:5px;border-radius:50%;border:1px dashed rgba(251,231,176,.55)"></i></div>`;
  // the new backs (backs.cjs) bring their own ground colour and lettering places; without them — the earlier picture
  const backSpecs = new Map<string, BackSpec>(), xmlns = (v: string) => /xmlns=/.test(v.slice(0, 300)) ? v : v.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  for (const k of [...(Object.keys(DECK_KEY) as DeckCode[]), 'sea' as const]) {
    const kind = k === 'sea' ? 'sea' : DECK_KEY[k], col = k === 'sea' ? SEA.band : DECK_BAND[k], spec = ctx.opts.noArt ? null : backSpec(kind, mode.backs);
    if (spec) { backSpecs.set(k, spec); backs.set(k, (await makeArt(ctx, `back${mode.backs}-${kind}`, xmlns(spec.svg), null, spec.bleed ?? 0)).url); }
    else {
      const svg = ctx.opts.noArt ? plainSvg(lighten(col, .2), col) : k === 'sea' ? seaBackSvg() : backArtSvg(kind);
      backs.set(k, (await makeArt(ctx, `back0-${kind}`, fadeEdges(shadeBack(svg), col), null)).url);
    }
    crest.set(k, await ctx.raster(`crest-${kind}`, crestHtml(k === 'sea' ? `<img src="${ROSE_URI}" style="width:52px;height:52px">` : k, col), 90, 92, 6));
  }
  return { mode, fits, art, specs, backs, crest, backSpecs };
}
// the mock-up's dark veils at the top and bottom of a back (under the title and the name), baked into the picture
const shadeBack = (svg: string) => svg.replace(/<\/svg>\s*$/, `<defs><linearGradient id="vt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="vb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity=".62"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient></defs><rect width="200" height="64" fill="url(#vt)"/><rect y="167" width="200" height="113" fill="url(#vb)"/></svg>`);

const HOWTO_FRAME = '#5a3c14';
function howtoHtml(ctx: Ctx, deck: DeckCode | 'sea', mode: Mode, pos: string): string {
  const frame = HOWTO_FRAME;
  if (deck === 'sea') {
    const h = TXT.howtoSea;
    return `<div class="cd ht sea" style="${pos}--frame:${frame}"><div class="in"><h3>${esc(h.title)}</h3><div class="ln"></div><div class="rw"><img src="${ctx.icon('medal-sea')}" style="width:9.6mm;height:9.95mm"><span style="font:800 7.5pt/1 'Alegreya Sans',sans-serif;letter-spacing:.14em">${esc(TXT.seaBand)}</span></div>${h.lines.map((l: string) => `<p>${l}</p>`).join('')}</div><div class="fr"></div></div>`;
  }
  const h = TXT.howto;
  const rows = (['ЗАРЯД', 'ПРИКАЗ', 'РЕМОНТ', 'РЕАКЦИЯ'] as CardType[]).map(t => `<div class="rw"><img src="${ctx.icon('medal-' + TYPE[t].key)}" alt=""><div><b style="color:${TYPE[t].td}">${t}</b><span>${esc(TYPE[t].when)}</span></div></div>`).join('');
  const pic = (name: string, h: number) => `<img src="${ctx.icon(name)}" alt="" style="display:inline-block;height:${h}mm;width:auto;vertical-align:-${(h * .32).toFixed(2)}mm;margin:-1mm .2mm -1mm 0">`;
  const line = (l: string) => rich(l).replace('{coin}', pic('coin-1', 5)).replace('{flask}', pic('flask-2', 5.4));
  return `<div class="cd ht" style="${pos}--frame:${frame}"><div class="in"><h3>${esc(h.title)}</h3><div class="ld">${esc(mode.index ? h.leadIndex : h.leadPlain)}</div><div class="ln"></div><div style="display:grid;grid-template-columns:1fr 1.18fr;gap:1.3mm 1mm;align-items:center">${rows}</div><div class="ln"></div>${h.lines.map((l: string) => `<p>${line(l)}</p>`).join('')}</div><div class="fr"></div></div>`;
}
function spareHtml(deck: DeckCode, pos: string): string {
  const c = DECK_BAND[deck];
  return `<div class="cd" style="${pos}--frame:${c};--band:${c};background:linear-gradient(${lighten(c, .28)},${darken(c, .25)})"><div class="bd"><span>${esc(DECK_NAME[deck].toUpperCase())}</span></div><div class="gl paper" style="height:38mm"><div class="sp">${esc(TXT.spare)}</div><div class="nl"></div><div class="nl"></div><div class="nl"></div><div class="nl"></div></div><svg style="position:absolute;left:0;top:0;width:${mm(CARD.w)};height:${mm(CARD.h)}" viewBox="0 0 ${CARD.w} ${CARD.h}"><circle cx="${FACE.medal.x + 4.6}" cy="${FACE.medal.y + 4.6}" r="4.6" fill="#f4e8c8" stroke="#3a220e" stroke-width=".35"/><circle cx="${CARD.w - FACE.price.right - 4.6}" cy="${FACE.price.y + 4.6}" r="4.6" fill="#f4e8c8" stroke="#3a220e" stroke-width=".35" stroke-dasharray="1 .8"/></svg><div class="fr"></div></div>`;
}

export function itemFace(ctx: Ctx, kit: CardKit, it: Item, pos: string): string {
  switch (it.kind) {
    case 'card': case 'legend': case 'sea': { const s = faceSpec(it, kit.mode); return faceHtml(ctx, s, kit.fits.get(s.key)!, kit.art.get(s.key)!.url, pos); }
    case 'howto': return howtoHtml(ctx, it.deck, kit.mode, pos);
    case 'howto-sea': return howtoHtml(ctx, 'sea', kit.mode, pos);
    case 'spare': return spareHtml(it.deck, pos);
    default: return `<div class="sh-blank" style="${pos}"></div>`;
  }
}
/** ground — the colour of the sheet's backs: the reference card's back keeps it along the edge, so a shifted back side shows no light strip on a neighbour. */
export function backHtml(kit: CardKit, b: BackKind, pos: string, ground = '#3a2c1c', edge = [0, 0, 0, 0]): string {
  if (b.back === 'none') return `<div class="sh-blank" style="${pos}"></div>`;
  if (b.back === 'deck' && b.legend) return legendBackHtml(b.deck, pos);
  if (b.back === 'neutral') return `<div class="bk nt" style="${pos}--ground:${ground}"><div class="pp"></div><div class="tt">${esc(TXT.title)}</div><img class="rs" src="${ROSE_URI}" alt=""></div>`;
  const k = b.back === 'sea' ? 'sea' : b.deck, name = b.back === 'sea' ? TXT.seaBackName : DECK_NAME[b.deck], sp = kit.backSpecs.get(k);
  const tail = (y: string) => `<div class="bn" style="top:${y}">${esc(name)}</div>`;
  if (!sp) return `<div class="bk" style="${pos}--ground:${profiled(b.back === 'sea' ? SEA.band : DECK_BAND[b.deck])}"><img class="art" src="${kit.backs.get(k)}" alt=""><div class="tt">${esc(TXT.title)}</div><div class="tr"></div><img class="cr" src="${kit.crest.get(k)}" alt="" style="left:50%;top:53.6mm;width:18.9mm;height:19.32mm;margin-left:-9.45mm">${tail('')}</div>`.replace(/ style="top:"/g, '');
  // lettering of a new back: places come from the picture (units of 200 × 280 → mm), colours from its tone
  const U = CARD.h / 280, ink = sp.tone === 'dark' ? ['#f3dc9d', '#fff2d4'] : ['#5a3c14', '#3a2410'];
  const title = sp.title ? `<div class="tt" style="top:${mm(sp.title.y * U)};transform:translateY(-50%);color:${ink[0]}">${esc(TXT.title)}</div>` : '';
  const cd = sp.crest ? sp.crest.d * U : 0, crest = sp.crest ? `<img class="cr" src="${kit.crest.get(k)}" alt="" style="left:50%;top:${mm(sp.crest.y * U - cd * 45 / 70)};width:${mm(cd * 90 / 70)};height:${mm(cd * 92 / 70)};margin-left:${mm(-cd * 45 / 70)}">` : '';
  const ls = sp.letter ? sp.letter.size * U : 0, letter = !sp.letter ? '' : k === 'sea' ? `<img src="${ROSE_URI}" alt="" style="position:absolute;left:50%;top:${mm(sp.letter.y * U - ls / 2)};width:${mm(ls)};height:${mm(ls)};margin-left:${mm(-ls / 2)}">`
    : `<div style="position:absolute;left:0;right:0;top:${mm(sp.letter.y * U)};transform:translateY(-50%);text-align:center;font:700 ${(ls * 2.835).toFixed(1)}pt/1 'Alegreya SC',serif;color:${ink[1]}">${k}</div>`;
  // a back with bleed: the picture runs 3 mm past the card on the block's outer sides (edge = left, top, right, bottom), nowhere else
  const bu = sp.bleed ?? 0, art = bu ? ` style="left:${mm(-bu * U)};top:${mm(-bu * U)};width:${mm(CARD.w + 2 * bu * U)};height:${mm(CARD.h + 2 * bu * U)}"` : '',
    clip = bu ? `overflow:visible;clip-path:inset(${[1, 2, 3, 0].map(i => mm(-edge[i] * BLEED)).join(' ')});` : '';
  return `<div class="bk" style="${pos}${clip}--ground:${profiled(sp.ground)}"><img class="art" src="${kit.backs.get(k)}" alt=""${art}>${title}${crest}${letter}`
    + tail(`${mm(sp.name.y * U)};transform:translateY(-50%);color:${ink[1]}`) + `</div>`;
}

const arrowUp = (x: number, y: number) => `<path d="M${x} ${y + 3.2}V${y}M${x - 1.1} ${y + 1.2}L${x} ${y}L${x + 1.1} ${y + 1.2}" stroke="#555" stroke-width=".35" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const sheetName = (sh: Sheet) => sh.deck === 'sea' ? TXT.seaBackName : sh.deck === 'legend' ? TXT.legendSheet : DECK_NAME[sh.deck];
const sheetColor = (sh: Sheet) => sh.deck === 'sea' ? SEA.band : sh.deck === 'legend' ? LEGEND.frame.mid : DECK_BAND[sh.deck];
/** The block's outer bleed next to the slots of a sheet that have their own colour (or are empty, white), on the face or the back. */
const bleedPatches = (colors: (string | null)[]) => colors.map((c, i) => { if (!c) return ''; const s = slot(i), l = s.col === 0 ? BLEED : 0, r = s.col === GRID.cols - 1 ? BLEED : 0, t = s.row === 0 ? BLEED : 0, b = s.row === GRID.rows - 1 ? BLEED : 0;
  return l + r + t + b ? `<div style="position:absolute;left:${mm(s.x - l)};top:${mm(s.y - t)};width:${mm(s.w + l + r)};height:${mm(s.h + t + b)};background:${c}"></div>` : ''; }).join('');
const pos = (i: number) => { const s = slot(i); return `left:${mm(s.x)};top:${mm(s.y)};`; };

/** A sheet of faces: the frame colour bleeds 3 mm past the block; cut lines inside, marks to the sheet's edge; a 50 mm ruler. */
export function faceSheet(ctx: Ctx, kit: CardKit, sh: Sheet, label = '', kitOf: (i: number) => CardKit = () => kit, sub = ''): PageSpec {
  const col = sheetColor(sh), { inner, marks } = cutLines();
  const ln = (l: { x1: number; y1: number; x2: number; y2: number }, c: string, w: number) => `<path d="M${l.x1} ${l.y1}L${l.x2} ${l.y2}" stroke="${c}" stroke-width="${w}"/>`;
  const rx = A4.w - GRID.x0 - 50 - 4; // clear of the cut mark at the block's right edge
  // a Legend (brass) or a reference card (brown) on the block's outer edge: the bleed there takes its frame colour
  const own = (it: Item) => it.kind === 'legend' ? LEGEND.frame.mid : it.kind === 'howto' || it.kind === 'howto-sea' ? HOWTO_FRAME : it.kind === 'empty' ? '#ffffff' : null;
  const patches = bleedPatches(sh.items.map(own));
  return { html: `<div class="sh-bleed" style="background:${col}"></div>${patches}${sh.items.map((it, i) => itemFace(ctx, kitOf(i), it, pos(i))).join('')}`
    + `<svg class="sh-svg" viewBox="0 0 ${A4.w} ${A4.h}">${inner.map(l => ln(l, cutColor(col), .25)).join('')}${marks.map(l => ln(l, '#808080', .3)).join('')}`
    + `<path d="M${rx} 10.6H${rx + 50}M${rx} 9.4V11.8M${rx + 50} 9.4V11.8${[10, 20, 30, 40].map(d => `M${rx + d} 10V11.2`).join('')}" stroke="#555" stroke-width=".25" fill="none"/>${arrowUp(GRID.x0 + 1.2, 1.6)}</svg>`
    + `<div class="sh-lab" style="left:${mm(GRID.x0 + 4)}">${esc(label || `${TXT.sheetFace} · лист ${sh.n} из ${sh.of} · ${sheetName(sh)} · ${TXT.sheetTop}`)}</div><div class="sh-rul" style="left:${mm(rx)}">${esc(TXT.ruler)}</div>${sub ? `<div class="sh-sub">${esc(sub)}</div>` : ''}` };
}
/** The sheet of backs behind a face sheet (mirrored columns); dx, dy shift the whole print, seen from the back. No cut lines: cut from the face. */
export function backSheetPage(kit: CardKit, sh: Sheet, dx = 0, dy = 0, label = '', kitOf: (i: number) => CardKit = () => kit, sub = '', bleed = true): PageSpec {
  // the same colour as the edge of the back pictures in the JPEG (after the print profile): no seam between a card and the bleed
  const col = sh.deck === 'legend' ? LEGEND.back.edge : profiled(kit.backSpecs.get(sh.deck)?.ground ?? sheetColor(sh)), b = BLEED_BOX, L = 5, o = 1;
  // an empty slot is white on the back too, its bleed as well (no dark strip round a blank card place)
  const blanks = bleedPatches(backSheet(sh.items).map(bk => bk.back === 'none' ? '#ffffff' : null));
  const edgeOf = (i: number) => { const s = slot(i); return [+(s.col === 0), +(s.row === 0), +(s.col === GRID.cols - 1), +(s.row === GRID.rows - 1)]; };
  const corner = (x: number, y: number, sx: number, sy: number) => `<path d="M${x + sx * o} ${y}h${sx * L}M${x} ${y + sy * o}v${sy * L}" stroke="#808080" stroke-width=".3" fill="none"/>`;
  return { html: `<div class="sh-shift" style="transform:translate(${mm(dx)},${mm(dy)})">${bleed ? `<div class="sh-bleed" style="background:${col}"></div>${blanks}` : ''}${backSheet(sh.items).map((bk, i) => backHtml(kitOf(i), bk, pos(i), col, edgeOf(i))).join('')}`
    + `<svg class="sh-svg" viewBox="0 0 ${A4.w} ${A4.h}">${corner(b.x, b.y, -1, -1)}${corner(b.x + b.w, b.y, 1, -1)}${corner(b.x, b.y + b.h, -1, 1)}${corner(b.x + b.w, b.y + b.h, 1, 1)}</svg></div>`
    + `<svg class="sh-svg" viewBox="0 0 ${A4.w} ${A4.h}">${arrowUp(GRID.x0 + 1.2, 1.6)}</svg>${sub ? `<div class="sh-sub">${esc(sub)}</div>` : ''}<div class="sh-lab" style="left:${mm(GRID.x0 + 4)}">${esc(label || `${TXT.sheetBack} · лист ${sh.n} из ${sh.of} · ${sheetName(sh)} · ${TXT.sheetTop}`)}</div>` };
}
export { read };
