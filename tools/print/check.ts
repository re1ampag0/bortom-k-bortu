// Checks of the printed set (docs/tasks/print-kit.md 3.10, review-repo 18, review-print 9, 11):
//   --check      layout in the browser: every card 63.0 × 88.0 mm, nothing overflows the glass plate, font sizes,
//                the fan index box, and the contrast of every text line against the baked glass under it
//                → report/print/check.json; false on an error.
//   --check-pdf  the PDFs with poppler (pdfinfo, pdffonts, pdfimages): pages, A4, fonts embedded and only Alegreya,
//                no Type 3, card pictures JPEG ≥ 350 ppi, PrintScaling None (Duplex on the two-sided files).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { CACHE, HTML_DIR, OUT, ROOT, data, type Ctx } from './kit';
import { CARD, FACE, deckSheets, seaSheets } from './layout';
import { ON_GLASS, TYPE, SEA, contrast, darken, luminance } from './colors';
import { defaultMode, kitFor } from './parts/cards';

interface Line { cls: string; x: number; y: number; w: number; h: number; color: string; pt: number }
interface CardDom { key: string; w: number; h: number; glassTop: number; glassOver: number; lines: Line[]; pts: Record<string, number>; art: string; ix: { w: number; bottom: number } | null; smallPrice: boolean; bigPrice: boolean }

export async function checkLayout(ctx: Ctx): Promise<boolean> {
  const errors: string[] = [], notes: string[] = [], rows: Record<string, unknown>[] = [];
  const kit = await kitFor(ctx, defaultMode(ctx));
  const page = await ctx.browser.newPage({ viewport: { width: 900, height: 1200 } });
  const seen = new Set<string>();
  let minMean = 99, minP95 = 99, cards = 0;
  for (const file of ['05a-lica', '07-more']) {
    const f = path.join(HTML_DIR, file + '.html');
    if (!fs.existsSync(f)) { errors.push(`${file}.html is missing: build the cards first (npm run print)`); continue; }
    await page.goto('file://' + f);
    await page.evaluate(() => document.fonts.ready);
    const dom: CardDom[] = await page.evaluate(() => {
      const MM = 96 / 25.4, out: CardDom[] = [];
      for (const cd of Array.from(document.querySelectorAll<HTMLElement>('.cd[data-key]'))) {
        const r = cd.getBoundingClientRect(), gl = cd.querySelector<HTMLElement>('.gl')!, g = gl.getBoundingClientRect();
        const lines: Line[] = [], pts: Record<string, number> = {};
        const pt = (el: Element) => parseFloat(getComputedStyle(el).fontSize) * 0.75;
        for (const [cls, sel] of [['name', '.nm'], ['big', '.bg'], ['text', '.tx'], ['plan', '.pl > div'], ['flavor', '.fv'], ['index', '.ix']] as const) {
          const el = cd.querySelector<HTMLElement>(sel); if (!el || getComputedStyle(el).display === 'none') continue;
          pts[cls] = pt(el);
          const range = document.createRange(); range.selectNodeContents(el);
          for (const q of Array.from(range.getClientRects())) if (q.width > 1) lines.push({ cls, x: (q.left - r.left) / MM - .5, y: (q.top - r.top) / MM - .5, w: q.width / MM + 1, h: q.height / MM + 1, color: getComputedStyle(el).color, pt: pts[cls] });
        }
        for (const [cls, sel] of [['ribbon', '.rb'], ['band', '.bd span'], ['planChip', '.pl span'], ['legend', '.lg']] as const) { const el = cd.querySelector(sel); if (el) pts[cls] = pt(el); }
        let over = 0; for (const ch of Array.from(gl.children)) { const q = ch.getBoundingClientRect(); over = Math.max(over, q.bottom - (g.bottom - 1), g.top + 1 - q.top, q.right - g.right, g.left - q.left); }
        const ix = cd.querySelector('.ix')?.getBoundingClientRect();
        out.push({ key: cd.dataset.key!, w: r.width / MM, h: r.height / MM, glassTop: (g.top - r.top) / MM, glassOver: over / MM, lines, pts, art: cd.querySelector<HTMLImageElement>('img.art')?.getAttribute('src') ?? '',
          ix: ix ? { w: ix.width / MM, bottom: (ix.bottom - r.top) / MM } : null, smallPrice: !!cd.querySelector('img.ixp'), bigPrice: cd.querySelectorAll('img.ic:not(.ixp)').length > 1 });
      }
      return out;
    });
    for (const c of dom) {
      cards++;
      if (Math.abs(c.w - CARD.w) > .1 || Math.abs(c.h - CARD.h) > .1) errors.push(`${c.key}: card is ${c.w.toFixed(2)} × ${c.h.toFixed(2)} mm`);
      if (seen.has(c.key)) continue; seen.add(c.key);
      const P = FACE.pt, min: Record<string, number> = { name: P.name, big: P.big, text: P.textMin, plan: P.textMin, flavor: P.flavor, ribbon: P.ribbon, band: P.band, planChip: P.plan, index: 6.5, legend: 6.5 };
      for (const [k, v] of Object.entries(c.pts)) if (v < min[k] - .01) errors.push(`${c.key}: ${k} is ${v.toFixed(2)} pt, less than ${min[k]}`);
      if (c.pts.text < P.text - .01) notes.push(`${c.key}: текст правила ${c.pts.text} pt`);
      if (c.glassTop < FACE.glass.minTop - .2) errors.push(`${c.key}: the glass plate's top is at ${c.glassTop.toFixed(1)} mm, above ${FACE.glass.minTop}`);
      if (c.glassOver > .3) errors.push(`${c.key}: text overflows the glass plate by ${c.glassOver.toFixed(2)} mm`);
      if (c.ix && (c.ix.w > FACE.index.maxW + .05 || c.ix.bottom > FACE.index.maxBottom + .05)) errors.push(`${c.key}: the fan index is ${c.ix.w.toFixed(1)} mm wide, bottom at ${c.ix.bottom.toFixed(1)} mm`);
      const spec = kit.specs.get(c.key);
      if (spec) {
        const paid = spec.price.powder > 0 || spec.price.soul > 0;
        if (paid !== c.bigPrice) errors.push(`${c.key}: the price icon does not match the data (cost ${spec.price.powder}, soul ${spec.price.soul})`);
        if (spec.index && paid !== c.smallPrice) errors.push(`${c.key}: the small price on the medal does not match the data`);
        const fit = kit.fits.get(c.key)!;
        if (fit.over) errors.push(`${c.key}: the text does not fit the glass plate even at the minimal sizes`);
        if (spec.big && !fit.big) notes.push(`${c.key}: крупный итог убран со стекла`);
        if (spec.flavor && !fit.flavor) notes.push(`${c.key}: подпись курсивом убрана`);
      }
      // contrast against the picture under each line (the text is vector, the JPEG has no letters in it)
      if (!c.art || ctx.opts.noArt) continue;
      const b64 = fs.readFileSync(path.join(HTML_DIR, c.art)).toString('base64');
      const stats: { mean: number; p95: number }[] = await page.evaluate(async ({ b64, lines, W, H, A }) => {
        const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const g = cv.getContext('2d', { willReadFrequently: true })!; g.drawImage(img, 0, 0);
        const kx = cv.width / W, ky = cv.height / H, lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
        return lines.map(l => {
          const x = Math.max(0, Math.round(l.x * kx)), y = Math.max(0, Math.round(l.y * ky)), w = Math.max(1, Math.min(cv.width - x, Math.round(l.w * kx))), h = Math.max(1, Math.min(cv.height - y, Math.round(l.h * ky)));
          const d = g.getImageData(x, y, w, h).data, ls: number[] = [];
          for (let i = 0; i < d.length; i += 4) {
            let [r, gg, b] = [d[i], d[i + 1], d[i + 2]];
            if (l.cls === 'index') { r = r * (1 - A) + 14 * A; gg = gg * (1 - A) + 11 * A; b = b * (1 - A) + 9 * A; } // the index plate: dark, semi-transparent over the picture
            ls.push(0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b));
          }
          ls.sort((a, b) => a - b);
          return { mean: ls.reduce((a, b) => a + b, 0) / ls.length, p95: ls[Math.floor(ls.length * .95)] };
        });
      }, { b64, lines: c.lines, W: CARD.w, H: CARD.h, A: FACE.index.alpha });
      c.lines.forEach((l, i) => {
        const m = l.color.match(/\d+/g)!.map(Number), lt = luminance('#' + m.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join(''));
        const cMean = (lt + .05) / (stats[i].mean + .05), cP95 = (lt + .05) / (stats[i].p95 + .05);
        minMean = Math.min(minMean, cMean); minP95 = Math.min(minP95, cP95);
        rows.push({ card: c.key, line: l.cls, pt: l.pt, bgMean: +stats[i].mean.toFixed(4), bgP95: +stats[i].p95.toFixed(4), contrastMean: +cMean.toFixed(2), contrastP95: +cP95.toFixed(2) });
        if (cMean < 7 || cP95 < 4.5) errors.push(`${c.key}: ${l.cls} contrast ${cMean.toFixed(1)} : 1 on the mean background, ${cP95.toFixed(1)} : 1 on its lightest 5 %`);
      });
    }
  }
  await page.close();
  // ribbons: white lettering on the type colour
  for (const [name, t] of [...Object.entries(TYPE), ['МОРЕ', SEA] as const]) { const c = contrast('#ffffff', darken(t.t, .18)); rows.push({ ribbon: name, contrast: +c.toFixed(2) }); if (c < 4.5) errors.push(`ribbon ${name}: contrast ${c.toFixed(2)} : 1`); }
  if (contrast(ON_GLASS.cream, '#26262a') < 4.5) errors.push('deck strip lettering: contrast below 4.5 : 1');
  const expected = deckSheets(data).length * 9 + seaSheets(data).flatMap(s => s.items).filter(i => i.kind === 'sea').length;
  const dark = [...kit.art.entries()].map(([k, a]) => ({ card: k, dark: a.dark, glassMean: a.glassMean, glassP95: a.glassP95 })).sort((a, b) => b.dark - a.dark);
  // the «dark above the glass ≤ 30 %» note is gone: user's decision 12.11 — dark pictures are the game's style, a print shop holds them
  const dir = path.join(ROOT, 'report/print'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'check.json'), JSON.stringify({ cards, distinct: seen.size, minContrastMean: +minMean.toFixed(2), minContrastP95: +minP95.toFixed(2), errors, notes, dark, lines: rows }, null, 1));
  console.log(`check: ${cards} card faces on the sheets (${seen.size} distinct, ${expected} slots expected with reference cards), each 63 × 88 mm`);
  console.log(`check: contrast of text lines — min ${minMean.toFixed(2)} : 1 on the mean background (need ≥ 7), min ${minP95.toFixed(2)} : 1 on the lightest 5 % (need ≥ 4.5)`);
  console.log(`check: ${notes.length} note(s), ${errors.length} error(s) → report/print/check.json`);
  for (const n of notes) console.log('  note: ' + n);
  for (const e of errors.slice(0, 40)) console.log('  ERROR: ' + e);
  return errors.length === 0;
}

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 << 20 });
/** file → [pages, landscape?] */
const EXPECT: Record<string, [number | [number, number], boolean?]> = {
  '00-kak-pechatat': [4], '01-pravila': [[3, 4]], '02-pamyatki': [[1, 2], true], '03-planshety': [4, true], '04-tryumy-zhetony': [[2, 3]],
  '05-karty': [24], '05a-lica': [12], '05b-rubashki': [12], '07-more': [4], '08-otchet': [1]
};
export async function checkPdf(): Promise<boolean> {
  const errors: string[] = [], table: string[] = [];
  const draft = fs.existsSync(path.join(CACHE, 'art')) && fs.readdirSync(path.join(CACHE, 'art')).length > 0 && process.argv.includes('--draft');
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.pdf')).sort();
  for (const name of Object.keys(EXPECT)) if (!files.includes(name + '.pdf') && !process.argv.includes('--only')) errors.push(`${name}.pdf is missing`);
  for (const f of files) {
    const full = path.join(OUT, f), base = f.replace(/\.pdf$/, ''), size = fs.statSync(full).size;
    const info = run('pdfinfo', ['-l', '999', full]);
    const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1] ?? 0);
    table.push(`${f.padEnd(28)} ${String(pages).padStart(3)} стр. ${(size / 1048576).toFixed(1).padStart(6)} МБ`);
    const exp = EXPECT[base] ?? (base.startsWith('05b-rubashki-') ? [12] : undefined);
    if (exp) { const [n, land] = exp; if (Array.isArray(n) ? pages < n[0] || pages > n[1] : pages !== n) errors.push(`${f}: ${pages} pages, expected ${Array.isArray(n) ? n.join('–') : n}`);
      for (const m of info.matchAll(/Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+) pts/g)) { const w = +m[2] * 25.4 / 72, h = +m[3] * 25.4 / 72, [ew, eh] = land ? [297, 210] : [210, 297]; if (Math.abs(w - ew) > .5 || Math.abs(h - eh) > .5) errors.push(`${f}: page ${m[1]} is ${w.toFixed(1)} × ${h.toFixed(1)} mm, expected ${ew} × ${eh}`); } }
    if (size > 60 * 1048576) errors.push(`${f}: ${(size / 1048576).toFixed(0)} MB — over 60 MB, some picture is not a JPEG`);
    const fonts = run('pdffonts', [full]).split('\n').slice(2).filter(Boolean);
    for (const l of fonts) { if (/Type 3/.test(l)) errors.push(`${f}: Type 3 font: ${l.trim()}`); if (!/Alegreya/.test(l)) errors.push(`${f}: a font that is not Alegreya: ${l.trim()}`); if (!/\byes\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l)) errors.push(`${f}: font not embedded: ${l.trim()}`); }
    // images: page num type width height color comp bpc enc interp object ID x-ppi y-ppi size ratio
    const cardFile = /^(05|07)/.test(base);
    for (const l of run('pdfimages', ['-list', full]).split('\n').slice(2).filter(Boolean)) {
      const c = l.trim().split(/\s+/), [type, w, h, enc, xppi] = [c[2], +c[3], +c[4], c[8], +c[12]], sz = c[14] ?? '';
      const bytes = /M$/.test(sz) ? parseFloat(sz) * 1048576 : /K$/.test(sz) ? parseFloat(sz) * 1024 : parseFloat(sz);
      if (type === 'image' && enc !== 'jpeg' && bytes > 300 * 1024) errors.push(`${f}: a ${w} × ${h} raster that is not a JPEG, ${sz} (a CSS filter or opacity on a picture?)`);
      if (cardFile && enc === 'jpeg' && w >= 400 && !draft && xppi < 350) errors.push(`${f}: card picture ${w} × ${h} at ${xppi} ppi, need ≥ 350`);
    }
    table[table.length - 1] += `  шрифтов ${fonts.length}`;
  }
  // viewer hints written by pdf-lib (main.ts): read them back
  for (const f of files) {
    const doc = await PDFDocument.load(fs.readFileSync(path.join(OUT, f))), vp = doc.catalog.lookupMaybe(PDFName.of('ViewerPreferences'), PDFDict);
    const scaling = vp?.get(PDFName.of('PrintScaling'))?.toString(), duplex = vp?.get(PDFName.of('Duplex'))?.toString();
    if (scaling !== '/None') errors.push(`${f}: no /PrintScaling /None`);
    if (/^(05-karty|07-more)\.pdf$/.test(f) && duplex !== '/DuplexFlipLongEdge') errors.push(`${f}: no /Duplex /DuplexFlipLongEdge`);
  }
  console.log(table.join('\n'));
  console.log(`check-pdf: ${files.length} PDF, ${errors.length} error(s)`);
  for (const e of errors.slice(0, 40)) console.log('  ERROR: ' + e);
  return errors.length === 0;
}
