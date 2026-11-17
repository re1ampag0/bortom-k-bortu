// The sheet of the ships' emblems and the sides' ribbons (parts/boards/emblem.ts) for the author and the reviewers:
// each emblem large (40 mm across) and at the size it is printed, both ribbon variants for both sides (real size and
// enlarged), and each ship's header corner as it stands on the board. Not part of the set.
//   npx vite-node tools/print/emblem-sheet.ts -- [--out report/em]
// Writes emblems.png (150 dpi, the whole sheet) and emblems-real.png (300 dpi, the real sizes only).
import fs from 'node:fs';
import path from 'node:path';
import { data, fontCss, launch, type Ctx } from './kit';
import { DECK_KEY } from './colors';
import { basePalette, measureMissing, type ShipKey } from './parts/boards/frame';
import { EMBLEM_EXTENT, emblemSvg, letterBox, ribbonGeo, sideOf, sideRibbonSvg } from './parts/boards/emblem';

const args = process.argv.slice(2);
const opt = (n: string, d: string) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const out = path.resolve(opt('--out', 'report/em'));
interface ShipRow { code: string; name: string; side: string; color: string }
const ships = (data as unknown as { ships: ShipRow[] }).ships;
const PAPER = '#f1e4c2', INK = '#2a1c0c';
const label = (x: number, y: number, s: string, size = 3.2, w = 800, anchor = 'start') => `<text x="${x}" y="${y}" font-family="Alegreya Sans" font-weight="${w}" font-size="${size}" fill="${INK}" text-anchor="${anchor}">${s}</text>`;

function sheet(): { big: string; real: string; W: number; H: number; RW: number; RH: number } {
  const M = 8, CW = 70, big40 = 40 / 2 / EMBLEM_EXTENT.side;
  let s = label(M, M + 4, 'Эмблемы кораблей и ленты сторон — крупно и в размере печати', 5, 800);
  // row 1: the emblems, 40 mm, with the real size beside
  ships.forEach((sh, i) => {
    const key = DECK_KEY[sh.code as keyof typeof DECK_KEY] as ShipKey, pal = basePalette(sh.color), x = M + i * CW, y = M + 10;
    s += `<rect x="${x}" y="${y}" width="${CW - 3}" height="74" rx="2" fill="${PAPER}" stroke="#b9a47a" stroke-width=".25"/>`;
    s += label(x + 3, y + 5, `${sh.name} — ${key}`, 3, 800);
    s += emblemSvg(key, x + 3 + 23, y + 32, big40, { id: `b${i}`, letter: sh.code, size: 19 * big40 / 7, solid: pal.solid, deep: pal.deep });
    s += emblemSvg(key, x + 56, y + 22, 6.9, { id: `r${i}`, letter: sh.code, size: 19, solid: pal.solid, deep: pal.deep });
    s += label(x + 56, y + 36, 'R 6,9 мм (шапка)', 2.2, 500, 'middle');
    s += emblemSvg(key, x + 56, y + 50, 6.5, { id: `w${i}`, letter: sh.code, size: 20, solid: pal.solid, deep: pal.deep });
    s += label(x + 56, y + 63.5, 'R 6,5 мм (оборот)', 2.2, 500, 'middle');
  });
  // row 2: the ribbons — two variants × two sides, real size and ×3
  let y = M + 92;
  s += label(M, y, 'Ленты стороны: вариант A «свиток» (banderole) и вариант B «картуш с флагом»', 4, 800);
  y += 4;
  const variants = [['scroll', 'A — свиток'], ['flag', 'B — картуш с флагом']] as const;
  variants.forEach(([v, title], vi) => {
    const x = M + vi * 140;
    s += `<rect x="${x}" y="${y}" width="137" height="86" rx="2" fill="${PAPER}" stroke="#b9a47a" stroke-width=".25"/>`;
    s += label(x + 3, y + 5, title, 3.2, 800);
    (['ПИРАТЫ', 'КОМПАНИЯ'] as const).forEach((word, wi) => {
      const g = ribbonGeo(word, { variant: v });
      s += `<g transform="translate(${x + 68.5} ${y + 22 + wi * 30}) scale(3) translate(${-x - 68.5} ${-(y + 22 + wi * 30)})">` + sideRibbonSvg(word, sideOf(word), x + 68.5, y + 22 + wi * 30, { id: `rb${vi}${wi}`, variant: v }).svg + '</g>';
      s += sideRibbonSvg(word, sideOf(word), x + 3 + g.total / 2 + 1, y + 78, { id: `rr${vi}${wi}`, variant: v }).svg.replace('<g', `<g transform="translate(${wi * 40} 0)"`);
    });
    s += label(x + 3, y + 85, 'внизу — в размере печати (7 pt)', 2.2, 500);
  });
  // row 3: the header's left part of each ship as on the board (v2.ts: HEAD), ×2 and at the real size
  y += 94;
  s += label(M, y, 'Левая часть шапки, как на планшете: эмблема R 6,9 мм и лента 7 pt (×2 и в размере печати)', 4, 800);
  y += 4;
  const corner = (sh: ShipRow, i: number, left: number, top: number, k: number, tag: string) => {
    const key = DECK_KEY[sh.code as keyof typeof DECK_KEY] as ShipKey, pal = basePalette(sh.color), cx = left + 17.3, my = top + 12.1;
    const lb = letterBox(sh.code, 19, cx, my).box, rg = ribbonGeo(sh.side, {});
    const inner = `<rect x="${left}" y="${top}" width="34" height="26.4" fill="${PAPER}" stroke="#5a4024" stroke-width=".3"/><path d="M${left + 34} ${top + 1.3}H${left + 1.3}V${top + 25.1}H${left + 34}M${left + 34} ${top + 1.9}H${left + 1.9}V${top + 24.5}H${left + 34}" fill="none" stroke="#5a4024" stroke-width=".2"/>` +
      emblemSvg(key, cx, my, 6.9, { id: `h${tag}${i}`, letter: sh.code, size: 19, solid: pal.solid, deep: pal.deep }) +
      sideRibbonSvg(sh.side, sideOf(sh.side), cx, lb.y + lb.h + 0.2 + rg.fh / 2, { id: `hr${tag}${i}` }).svg;
    return k === 1 ? inner : `<g transform="translate(${left} ${top}) scale(${k}) translate(${-left} ${-top})">${inner}</g>`;
  };
  ships.forEach((sh, i) => { s += corner(sh, i, M + i * CW, y, 2, 'b'); });
  y += 58;
  ships.forEach((sh, i) => { s += corner(sh, i, M + i * CW + 17, y, 1, 's'); });
  const W = 2 * M + 4 * CW, H = y + 30;
  // the real-size strip: the four emblems and the four ribbons at print size
  let real = '';
  ships.forEach((sh, i) => {
    const key = DECK_KEY[sh.code as keyof typeof DECK_KEY] as ShipKey, pal = basePalette(sh.color);
    real += emblemSvg(key, 14 + i * 26, 13, 6.9, { id: `q${i}`, letter: sh.code, size: 19, solid: pal.solid, deep: pal.deep });
  });
  (['scroll', 'flag'] as const).forEach((v, vi) => (['ПИРАТЫ', 'КОМПАНИЯ'] as const).forEach((word, wi) => {
    real += sideRibbonSvg(word, sideOf(word), 20 + wi * 40, 34 + vi * 10, { id: `q${vi}${wi}`, variant: v }).svg;
  }));
  return { big: s, real, W, H, RW: 110, RH: 52 };
}

fs.mkdirSync(out, { recursive: true });
const browser = await launch();
// a dry run collects the words to measure, then the real one
sheet();
await measureMissing({ browser } as unknown as Ctx);
const { big, real, W, H, RW, RH } = sheet();
const html = (svg: string, w: number, h: number, bg: string) => `<!doctype html><meta charset="utf-8"><style>${fontCss()}body{margin:0;background:${bg}}</style>` +
  `<svg id="s" xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${svg}</svg>`;
const page = await browser.newPage({ deviceScaleFactor: 150 / 96 });
await page.setContent(html(big, W, H, '#e9dcbc'));
await page.evaluate(async () => { await document.fonts.ready; });
await page.locator('#s').screenshot({ path: path.join(out, 'emblems.png') });
const p2 = await browser.newPage({ deviceScaleFactor: 300 / 96 });
await p2.setContent(html(`<rect width="${RW}" height="${RH}" fill="${PAPER}"/>` + real, RW, RH, PAPER));
await p2.evaluate(async () => { await document.fonts.ready; });
await p2.locator('#s').screenshot({ path: path.join(out, 'emblems-real.png') });
await browser.close();
for (const v of ['scroll', 'flag'] as const) for (const w of ['ПИРАТЫ', 'КОМПАНИЯ']) { const g = ribbonGeo(w, { variant: v }); console.log(`${v} ${w}: face ${g.fw.toFixed(2)} × ${g.fh.toFixed(2)} mm, whole ${g.total.toFixed(2)} mm`); }
console.log(`→ ${path.relative(process.cwd(), out)}/emblems.png, emblems-real.png`);
