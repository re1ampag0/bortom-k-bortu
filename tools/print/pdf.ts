// Writing PDFs: HTML file → Chromium page.pdf → viewer hints with pdf-lib; merging; PNG shots of a sheet for samples.
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { OUT, HTML_DIR, pageHtml, type Ctx, type Part } from './kit';

/** Writes one PDF; printing hints for viewers: actual size, and long-edge duplex for the two-sided files. */
export async function writePdf(ctx: Ctx, part: Part, dir = OUT): Promise<string> {
  const htmlFile = path.join(HTML_DIR, part.file + '.html'), pdfFile = path.join(dir, part.file + '.pdf');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(htmlFile, pageHtml(part));
  const page = await ctx.browser.newPage();
  await page.goto('file://' + htmlFile);
  const bad = await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => undefined))); return Array.from(document.images).filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.src.slice(0, 120)); });
  if (bad.length) throw new Error(`${part.file}: ${bad.length} picture(s) did not load: ${bad.slice(0, 3).join(', ')}`);
  const raw = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  await page.close();
  const doc = await PDFDocument.load(raw);
  doc.setTitle(part.title); doc.setAuthor('Бортом к борту'); doc.setLanguage('ru');
  const prefs = doc.context.obj({ PrintScaling: 'None', ...(part.duplex ? { Duplex: 'DuplexFlipLongEdge' } : {}) });
  doc.catalog.set(PDFName.of('ViewerPreferences'), prefs as PDFDict);
  fs.writeFileSync(pdfFile, await doc.save());
  return pdfFile;
}

export async function mergePdf(files: string[], out: string, title: string) {
  const doc = await PDFDocument.create();
  for (const f of files) { const src = await PDFDocument.load(fs.readFileSync(f)); for (const p of await doc.copyPages(src, src.getPageIndices())) doc.addPage(p); }
  doc.setTitle(title); doc.catalog.set(PDFName.of('ViewerPreferences'), doc.context.obj({ PrintScaling: 'None' }) as PDFDict);
  fs.writeFileSync(out, await doc.save());
}


/** PNG of one sheet of a part (for the sample pictures): dpi 150 by default. filter — a CSS filter over the sheet (perception checks). */
export async function shotSheet(ctx: Ctx, part: Part, index: number, out: string, dpi = 150, filter = '', extraHtml = ''): Promise<void> {
  const htmlFile = path.join(HTML_DIR, `_shot-${part.file}.html`);
  fs.writeFileSync(htmlFile, pageHtml(part).replace('</body>', extraHtml + '</body>'));
  const page = await ctx.browser.newPage({ viewport: { width: 1200, height: 1700 }, deviceScaleFactor: dpi / 96 });
  await page.goto('file://' + htmlFile);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => undefined))); });
  const el = page.locator('section.sheet').nth(index);
  if (filter) await el.evaluate((e, f) => { (e as HTMLElement).style.filter = f; }, filter);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await el.screenshot({ path: out });
  await page.close();
}
