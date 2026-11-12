// Card faces, card backs and their sheets (3 × 3 on A4), in millimetres. The face follows the approved mock-up
// docs/mockups/print/V2type.html («В-2 стекло») with the print corrections of docs/tasks/print-kit.md 3.3 and the
// reviews: taller deck strip, minimal font sizes, white rule text, the fan index under the medal.
import fs from 'node:fs';
import path from 'node:path';
import { data, esc, mm, rich, read, HERE, ROOT, RICH_CSS, fontCss, BASE_CSS, type Ctx, type PageSpec } from './kit';
import { BRASS, BRASS_DARK, BRASS_LIGHT, DECK_BAND, DECK_KEY, DECK_NAME, DECK_RIM, DECK_TINT, ON_GLASS, SEA, TYPE, cutColor, darken, lighten, type CardType, type DeckCode } from './colors';
import { A4, BLEED, BLEED_BOX, CARD, FACE, GRID, backSheet, cutLines, deckSheets, seaSheets, slot, slug, priceOf, type BackKind, type DeckCard, type Item, type SeaCard, type Sheet } from './layout';
import { iconImg, ROSE_URI, typeIconUri } from './icons';
import { backArtSvg, hasScene, makeArt, plainSvg, portraitSvg, profiled, type ArtInfo } from './art';
import { wxSvg } from '../../src/ui/game/art/wx';

export const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/cards.json'), 'utf8'));
/** Back designs that exist (docs/tasks/print-kit.md 4.10): 1 «Корабль в море»; 2 and 3 come with stage Б. */
export const BACK_VARIANTS: (1 | 2 | 3)[] = [1];
export interface Mode { glass: 'type' | 'ship'; index: boolean; backs: 1 | 2 | 3 }
/** What the fitting pass decided for one face: sizes in pt, what stayed on the plate, the plate's height in mm. */
export interface Fit { name: number; wrap: boolean; tp: number; big: boolean; flavor: boolean; fvBreak: boolean; h: number; over: boolean; idx: number; idxW: number; idxBottom: number }

const G = FACE.glass, MAX_GLASS = CARD.h - G.minTop - G.bottom;

export const CARD_CSS = `${RICH_CSS}
.cd{position:absolute;width:${mm(CARD.w)};height:${mm(CARD.h)};overflow:hidden;background:#1c120a;color:#fff}
.cd .art{position:absolute;left:0;top:0;width:${mm(CARD.w)};height:${mm(CARD.h)}}
.cd .fr{position:absolute;inset:0;border:2mm solid var(--frame);box-sizing:border-box}
.cd .fr2{position:absolute;inset:1.55mm;border:.25mm solid ${BRASS_DARK};box-sizing:border-box}
.cd .bd{position:absolute;left:0;right:0;bottom:0;height:${mm(FACE.band.h)};background:linear-gradient(rgba(0,0,0,0),var(--band) 26%)}
.cd .bd span{position:absolute;left:0;right:0;bottom:${mm(FACE.band.textCenter)};transform:translateY(50%);text-align:center;font:800 6.5pt/1 'Alegreya Sans',sans-serif;letter-spacing:.14em;color:#f6e7c1;white-space:nowrap}
.cd .bd i{position:absolute;right:4.4mm;bottom:${mm(FACE.band.textCenter)};transform:translateY(50%);font:800 8pt/1 'Alegreya Sans',sans-serif;font-style:normal;letter-spacing:.04em;color:#f6e7c1}
.gl{position:absolute;left:${mm(G.inset)};right:${mm(G.inset)};bottom:${mm(G.bottom)};border-radius:${mm(G.radius)};box-sizing:border-box;border:.25mm solid var(--rim);padding:1.9mm 2.1mm 1.7mm;display:flex;flex-direction:column;align-items:center;gap:.95mm;text-align:center;color:${ON_GLASS.text}}
.nm{font:700 14pt/1 'Alegreya SC',serif;color:${ON_GLASS.name};white-space:nowrap;max-width:100%;overflow:hidden;padding-bottom:.2mm}
.nm.wrap{white-space:normal;text-wrap:balance;line-height:1.02;overflow:visible}
.vr{width:19mm;height:.2mm;flex:none;background:linear-gradient(90deg,rgba(226,183,92,0),${BRASS_LIGHT},rgba(226,183,92,0))}
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
.lg{position:absolute;left:50%;top:5.2mm;transform:translateX(-50%);padding:.7mm 1.8mm .95mm;background:linear-gradient(${BRASS_LIGHT},${BRASS});border:.25mm solid ${BRASS_DARK};border-radius:.8mm;font:500 6.5pt/1 'Alegreya Sans',sans-serif;letter-spacing:.04em;color:#2a180c;white-space:nowrap}
.lg b{font-weight:800;letter-spacing:.12em}
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
.bk .bn{position:absolute;left:8mm;right:8mm;top:76.6mm;text-align:center;font:700 9.6pt/1.05 'Alegreya SC',serif;color:#fff2d4;letter-spacing:.04em}
.bk .bl{position:absolute;left:50%;top:76.2mm;transform:translateX(-50%);padding:.7mm 2.4mm .95mm;background:linear-gradient(${BRASS_LIGHT},${BRASS});border:.25mm solid ${BRASS_DARK};border-radius:.8mm;font:800 7pt/1 'Alegreya Sans',sans-serif;letter-spacing:.16em;color:#2a180c}
.bk.nt .pp{position:absolute;inset:10mm;border-radius:5mm;background:linear-gradient(#f4e8c8,#e2cfa0)}
.bk.nt .tt{top:26mm;left:10mm;right:10mm;color:#5a3c14;font-size:10.5pt;letter-spacing:.08em}
.bk.nt .rs{position:absolute;left:50%;top:36mm;width:22mm;height:22mm;margin-left:-11mm}
/* sheet furniture */
.sh-bleed{position:absolute;left:${mm(BLEED_BOX.x)};top:${mm(BLEED_BOX.y)};width:${mm(BLEED_BOX.w)};height:${mm(BLEED_BOX.h)}}
.sh-blank{position:absolute;width:${mm(CARD.w)};height:${mm(CARD.h)};background:#fff}
.sh-svg{position:absolute;left:0;top:0;width:${mm(A4.w)};height:${mm(A4.h)}}
.sh-lab{background:#fff;padding:.6mm 1.2mm;margin:-.6mm -1.2mm;position:absolute;left:${mm(GRID.x0)};top:6.2mm;font:700 8pt/1 'Alegreya Sans',sans-serif;color:#555;letter-spacing:.03em;white-space:nowrap}
.sh-rul{background:#fff;padding:.4mm 0;margin-top:-.4mm;position:absolute;right:${mm(GRID.x0)};top:5.6mm;width:50mm;font:500 6.5pt/1 'Alegreya Sans',sans-serif;color:#555;text-align:center;white-space:nowrap}
.sh-shift{position:absolute;left:0;top:0;width:${mm(A4.w)};height:${mm(A4.h)}}
`;

const ribbon = (bold: string, rest: string, t: { t: string; td: string }) => `<div class="rb" style="background:linear-gradient(${darken(t.t, .18)},${t.td})"><b>${esc(bold)}</b>${rest ? ' · ' + esc(rest) : ''}</div>`;
const splitPlan = (text: string): [string, string] => { const [rule, plan = ''] = text.split(/<b>План:<\/b>/); return [rule.replace(/(<br\s*\/?>\s*)+$/, ''), plan.trim()]; };
const nameStart = (n: string) => n.length <= 10 ? 14 : n.length <= 14 ? 13 : 12;

interface FaceSpec { key: string; name: string; art: string; frame: string; band: string; rim: string; tint: string; bandText: string; copies: number; medal: string; ribbon: string; big: string; text: string; flavor: string; price: { powder: number; soul: number }; legend: boolean; index: boolean; sceneName: string | null; artKey: string }

export function faceSpec(item: Extract<Item, { kind: 'card' | 'legend' | 'sea' }>, mode: Mode): FaceSpec {
  if (item.kind === 'sea') {
    const c: SeaCard = item.card;
    return { key: 'sea|' + c.name, name: c.name, art: '', frame: SEA.band, band: SEA.band, rim: SEA.rim, tint: SEA.tint, bandText: TXT.seaBand, copies: 1, medal: 'medal-sea', ribbon: ribbon(c.when.toUpperCase(), '', SEA), big: c.big, text: c.text, flavor: c.flavor, price: { powder: 0, soul: 0 }, legend: false, index: false, sceneName: null, artKey: 'sea-' + c.key };
  }
  const c: DeckCard = item.card, deck: DeckCode = item.deck, t = TYPE[c.type as CardType], legend = item.kind === 'legend';
  const when = legend && c.type === 'РЕАКЦИЯ' ? TXT.ribbonLegendJack : t.when;
  return {
    key: deck + '|' + c.name, name: c.name, art: '', frame: legend ? BRASS : DECK_BAND[deck], band: DECK_BAND[deck],
    rim: mode.glass === 'ship' ? DECK_RIM[deck] : t.t, tint: mode.glass === 'ship' ? DECK_TINT[deck] : t.tint,
    bandText: DECK_NAME[deck].toUpperCase(), copies: legend ? 1 : c.copies ?? 1, medal: 'medal-' + t.key, ribbon: ribbon(c.type, when, t),
    big: c.big, text: c.text, flavor: c.flavor, price: priceOf(c), legend, index: mode.index && !legend,
    sceneName: legend ? null : c.name, artKey: legend ? 'legend-' + DECK_KEY[deck] : slug(c.name)
  };
}

/** The face. fit = null: the measuring pass (everything on the plate, sizes set by the script). */
export function faceHtml(ctx: Ctx, s: FaceSpec, fit: Fit | null, artUrl: string, pos = ''): string {
  const [rule, plan] = splitPlan(s.text), tp = fit?.tp ?? 9;
  const big = s.big && (!fit || fit.big) ? `<div class="bg">${esc(s.big)}</div>` : '';
  const flavor = s.flavor && (!fit || fit.flavor) ? `<div class="fv">${fit?.fvBreak ? esc(s.flavor).replace(/([.!?…]) /, '$1<br>') : esc(s.flavor)}</div>` : '';
  const P = FACE.price, px = CARD.w - P.right - P.d;
  let price = '', small = '';
  if (s.price.powder) { price += iconImg(ctx, `coin-${s.price.powder}`, px, P.y); }
  if (s.price.soul) { price += iconImg(ctx, `flask-${s.price.soul}`, px, P.y + (s.price.powder ? P.d + P.gap : 0)); }
  if (s.index) {
    const I = FACE.index, x = I.priceCx - I.priceD / 2, y = I.priceCy - I.priceD / 2;
    if (s.price.powder) small = iconImg(ctx, `coin-${s.price.powder}`, x, y, I.priceD, 'ixp');
    else if (s.price.soul) small = iconImg(ctx, `flask-${s.price.soul}`, x, y - .4, I.priceD, 'ixp');
  }
  const idx = s.index && s.big ? `<div class="ix"${fit ? ` style="font-size:${fit.idx}pt;width:${mm(fit.idxW)}"` : ''}>${esc(s.big)}</div>` : '';
  const lg = s.legend ? `<div class="lg"><b>${esc(TXT.legendPlate[0])}</b> · ${esc(TXT.legendPlate[1])}</div>` : '';
  return `<div class="cd" data-key="${esc(s.key)}" data-index="${s.index ? 1 : 0}" style="${pos}--frame:${s.frame};--band:${s.band};--rim:${s.rim}">`
    + (artUrl ? `<img class="art" src="${artUrl}" alt="">` : '')
    + `<div class="bd"><span>${esc(s.bandText)}</span>${s.copies > 1 ? `<i>×${s.copies}</i>` : ''}</div>`
    + `<div class="gl"${fit ? ` style="height:${mm(fit.h)}"` : ''}><div class="nm${fit?.wrap ? ' wrap' : ''}" style="font-size:${fit?.name ?? nameStart(s.name)}pt">${esc(s.name)}</div><div class="vr"></div>${s.ribbon}${big}`
    + `<div class="tx" style="font-size:${tp}pt">${rich(rule, true)}</div>${plan ? `<div class="pl" style="font-size:${tp}pt"><span>${esc(TXT.plan)}</span><div>${rich(plan, true)}</div></div>` : ''}${flavor}</div>`
    + `<div class="fr"></div>${s.legend ? '<div class="fr2"></div>' : ''}${iconImg(ctx, s.medal, FACE.medal.x, FACE.medal.y)}${small}${idx}${price}${lg}</div>`;
}

/** The fitting pass: lays every distinct face out once and chooses sizes so the plate does not climb above 40 mm. */
export async function fitFaces(ctx: Ctx, specs: FaceSpec[]): Promise<Map<string, Fit>> {
  const page = await ctx.browser.newPage({ viewport: { width: 1200, height: 900 } });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}${BASE_CSS}${CARD_CSS}.cd{position:relative;display:inline-block;margin:2mm}</style></head><body>${specs.map(s => faceHtml(ctx, s, null, '')).join('')}</body></html>`;
  const f = path.join(ROOT, `out/print/html/_fit-${process.pid}.html`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html);
  await page.goto('file://' + f);
  await page.evaluate(() => document.fonts.ready);
  const res = await page.evaluate(({ maxH, I }) => {
    const MM = 96 / 25.4, out: Record<string, unknown> = {};
    for (const cd of Array.from(document.querySelectorAll<HTMLElement>('.cd'))) {
      const gl = cd.querySelector<HTMLElement>('.gl')!, nm = gl.querySelector<HTMLElement>('.nm')!, tx = gl.querySelector<HTMLElement>('.tx')!, pl = gl.querySelector<HTMLElement>('.pl');
      const bg = gl.querySelector<HTMLElement>('.bg'), fv = gl.querySelector<HTMLElement>('.fv'), ix = cd.querySelector<HTMLElement>('.ix');
      let name = parseFloat(nm.style.fontSize), wrap = false;
      for (; ;) { nm.style.fontSize = name + 'pt'; if (nm.scrollWidth <= nm.clientWidth + .5) break; if (name <= 11) { wrap = true; nm.classList.add('wrap'); break; } name = Math.max(11, name - (name > 12 ? 1 : .5)); }
      // with the fan index the big result leaves the plate first (it stays in the index), else the flavour line
      const index = cd.dataset.index === '1';
      const steps: [number, boolean, boolean][] = index ? [[9, true, true], [8.5, true, true], [8, true, true], [8, false, true], [8, false, false], [7.5, false, false]] : [[9, true, true], [8.5, true, true], [8, true, true], [8, true, false], [7.5, true, false], [7.5, false, false]];
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
  }, { maxH: MAX_GLASS, I: FACE.index });
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

export interface CardKit { mode: Mode; fits: Map<string, Fit>; art: Map<string, ArtInfo>; specs: Map<string, FaceSpec>; backs: Map<string, string>; crest: Map<string, string> }

/** Fits every face, rasterises every picture (faces with their glass, backs) for one mode. */
export async function prepareCards(ctx: Ctx, mode: Mode, only?: Set<string>): Promise<CardKit> {
  const specs = new Map<string, FaceSpec>();
  for (const sh of [...deckSheets(data), ...seaSheets(data)]) for (const it of sh.items) if (it.kind === 'card' || it.kind === 'legend' || it.kind === 'sea') { const s = faceSpec(it, mode); if (!specs.has(s.key) && (!only || only.has(s.key))) specs.set(s.key, s); }
  const fits = await fitFaces(ctx, [...specs.values()]);
  const art = new Map<string, ArtInfo>();
  for (const s of specs.values()) {
    const fit = fits.get(s.key)!;
    let svg: string;
    if (ctx.opts.noArt) svg = plainSvg();
    else if (s.sceneName && hasScene(s.sceneName, ctx.opts.draftArt)) svg = portraitSvg(s.sceneName, ctx.opts.draftArt);
    else if (s.key.startsWith('sea|')) { const c = data.sea.find(x => 'sea|' + x.name === s.key)!; svg = hasScene(c.name, ctx.opts.draftArt) ? portraitSvg(c.name, ctx.opts.draftArt) : seaTempSvg(c.key); }
    else { const deck = s.key[0] as DeckCode; svg = hasScene(s.name, ctx.opts.draftArt) ? portraitSvg(s.name, ctx.opts.draftArt) : legendTempSvg(deck); }
    art.set(s.key, await makeArt(ctx, s.artKey, svg, { top: CARD.h - G.bottom - fit.h, tint: s.tint }));
  }
  const backs = new Map<string, string>(), crest = new Map<string, string>();
  const crestHtml = (letter: string, col: string) => `<div style="position:absolute;left:10px;top:10px;width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.18),${col} 62%);box-shadow:0 0 0 3px #d9ab52,0 0 0 6px rgba(0,0,0,.5),0 0 0 7.5px rgba(217,171,82,.7),0 6px 12px rgba(0,0,0,.6),inset 0 0 16px rgba(0,0,0,.5);font:700 40px/1 'Alegreya SC',serif;color:#fbe7b0;text-shadow:0 2px 0 rgba(0,0,0,.6)">${letter}<i style="position:absolute;inset:5px;border-radius:50%;border:1px dashed rgba(251,231,176,.55)"></i></div>`;
  for (const deck of Object.keys(DECK_KEY) as DeckCode[]) {
    const svg = ctx.opts.noArt ? plainSvg(lighten(DECK_BAND[deck], .2), DECK_BAND[deck]) : backArtSvg(DECK_KEY[deck]);
    backs.set(deck, (await makeArt(ctx, `back${mode.backs}-${DECK_KEY[deck]}`, fadeEdges(shadeBack(svg), DECK_BAND[deck]), null)).url);
    crest.set(deck, await ctx.raster(`crest-${DECK_KEY[deck]}`, crestHtml(deck, DECK_BAND[deck]), 90, 92, 6));
  }
  backs.set('sea', (await makeArt(ctx, `back${mode.backs}-sea`, fadeEdges(shadeBack(ctx.opts.noArt ? plainSvg('#2f6f7e', '#0b2c38') : seaBackSvg()), SEA.band), null)).url);
  crest.set('sea', await ctx.raster('crest-sea', crestHtml(`<img src="${ROSE_URI}" style="width:52px;height:52px">`, SEA.band), 90, 92, 6));
  return { mode, fits, art, specs, backs, crest };
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
export function backHtml(kit: CardKit, b: BackKind, pos: string, ground = '#3a2c1c'): string {
  if (b.back === 'none') return `<div class="sh-blank" style="${pos}"></div>`;
  if (b.back === 'neutral') return `<div class="bk nt" style="${pos}--ground:${ground}"><div class="pp"></div><div class="tt">${esc(TXT.title)}</div><img class="rs" src="${ROSE_URI}" alt=""></div>`;
  const k = b.back === 'sea' ? 'sea' : b.deck, name = b.back === 'sea' ? TXT.seaBackName : DECK_NAME[b.deck];
  return `<div class="bk" style="${pos}--ground:${profiled(b.back === 'sea' ? SEA.band : DECK_BAND[b.deck])}"><img class="art" src="${kit.backs.get(k)}" alt=""><div class="tt">${esc(TXT.title)}</div><div class="tr"></div><img class="cr" src="${kit.crest.get(k)}" alt="" style="left:50%;top:55.3mm;width:18.9mm;height:19.32mm;margin-left:-9.45mm">`
    + (b.back === 'deck' && b.legend ? `<div class="bl">${esc(TXT.legendBack)}</div>` : `<div class="bn">${esc(name)}</div>`) + `</div>`;
}

const arrowUp = (x: number, y: number) => `<path d="M${x} ${y + 3.2}V${y}M${x - 1.1} ${y + 1.2}L${x} ${y}L${x + 1.1} ${y + 1.2}" stroke="#555" stroke-width=".35" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const sheetName = (sh: Sheet) => sh.deck === 'sea' ? TXT.seaBackName : DECK_NAME[sh.deck];
const sheetColor = (sh: Sheet) => sh.deck === 'sea' ? SEA.band : DECK_BAND[sh.deck];
const pos = (i: number) => { const s = slot(i); return `left:${mm(s.x)};top:${mm(s.y)};`; };

/** A sheet of faces: the frame colour bleeds 3 mm past the block; cut lines inside, marks to the sheet's edge; a 50 mm ruler. */
export function faceSheet(ctx: Ctx, kit: CardKit, sh: Sheet, label = '', kitOf: (i: number) => CardKit = () => kit): PageSpec {
  const col = sheetColor(sh), { inner, marks } = cutLines();
  const ln = (l: { x1: number; y1: number; x2: number; y2: number }, c: string, w: number) => `<path d="M${l.x1} ${l.y1}L${l.x2} ${l.y2}" stroke="${c}" stroke-width="${w}"/>`;
  const rx = A4.w - GRID.x0 - 50;
  // a Legend (brass) or a reference card (brown) on the block's outer edge: the bleed there takes its frame colour
  const own = (it: Item) => it.kind === 'legend' ? BRASS : it.kind === 'howto' || it.kind === 'howto-sea' ? HOWTO_FRAME : it.kind === 'empty' ? '#ffffff' : null;
  const patches = sh.items.map((it, i) => { const c = own(it); if (!c) return ''; const s = slot(i), l = s.col === 0 ? BLEED : 0, r = s.col === GRID.cols - 1 ? BLEED : 0, t = s.row === 0 ? BLEED : 0, b = s.row === GRID.rows - 1 ? BLEED : 0;
    return l + r + t + b ? `<div style="position:absolute;left:${mm(s.x - l)};top:${mm(s.y - t)};width:${mm(s.w + l + r)};height:${mm(s.h + t + b)};background:${c}"></div>` : ''; }).join('');
  return { html: `<div class="sh-bleed" style="background:${col}"></div>${patches}${sh.items.map((it, i) => itemFace(ctx, kitOf(i), it, pos(i))).join('')}`
    + `<svg class="sh-svg" viewBox="0 0 ${A4.w} ${A4.h}">${inner.map(l => ln(l, cutColor(col), .25)).join('')}${marks.map(l => ln(l, '#808080', .3)).join('')}`
    + `<path d="M${rx} 10.6H${rx + 50}M${rx} 9.4V11.8M${rx + 50} 9.4V11.8${[10, 20, 30, 40].map(d => `M${rx + d} 10V11.2`).join('')}" stroke="#555" stroke-width=".25" fill="none"/>${arrowUp(GRID.x0 + 1.2, 1.6)}</svg>`
    + `<div class="sh-lab" style="left:${mm(GRID.x0 + 4)}">${esc(label || `${TXT.sheetFace} · лист ${sh.n} из ${sh.of} · ${sheetName(sh)} · ${TXT.sheetTop}`)}</div><div class="sh-rul" style="left:${mm(rx)}">${esc(TXT.ruler)}</div>` };
}
/** The sheet of backs behind a face sheet (mirrored columns); dx, dy shift the whole print, seen from the back. No cut lines: cut from the face. */
export function backSheetPage(kit: CardKit, sh: Sheet, dx = 0, dy = 0, label = '', kitOf: (i: number) => CardKit = () => kit): PageSpec {
  // the same colour as the edge of the back pictures in the JPEG (after the print profile): no seam between a card and the bleed
  const col = profiled(sheetColor(sh)), b = BLEED_BOX, L = 5, o = 1;
  const corner = (x: number, y: number, sx: number, sy: number) => `<path d="M${x + sx * o} ${y}h${sx * L}M${x} ${y + sy * o}v${sy * L}" stroke="#808080" stroke-width=".3" fill="none"/>`;
  return { html: `<div class="sh-shift" style="transform:translate(${mm(dx)},${mm(dy)})"><div class="sh-bleed" style="background:${col}"></div>${backSheet(sh.items).map((bk, i) => backHtml(kitOf(i), bk, pos(i), col)).join('')}`
    + `<svg class="sh-svg" viewBox="0 0 ${A4.w} ${A4.h}">${corner(b.x, b.y, -1, -1)}${corner(b.x + b.w, b.y, 1, -1)}${corner(b.x, b.y + b.h, -1, 1)}${corner(b.x + b.w, b.y + b.h, 1, 1)}</svg></div>`
    + `<svg class="sh-svg" viewBox="0 0 ${A4.w} ${A4.h}">${arrowUp(GRID.x0 + 1.2, 1.6)}</svg><div class="sh-lab" style="left:${mm(GRID.x0 + 4)}">${esc(label || `${TXT.sheetBack} · лист ${sh.n} из ${sh.of} · ${sheetName(sh)} · ${TXT.sheetTop}`)}</div>` };
}
export { read };
