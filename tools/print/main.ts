// The print-and-play set: HTML → PDF with Chromium (docs/tasks/print-kit.md, stage А).
//   npm run print [-- --only 05,07] [--glass type|ship] [--index on|off] [--backs 1|2|3] [--draft] [--no-art]
//                 [--draft-art] [--back-shift-x mm] [--back-shift-y mm] [--no-samples] [--check] [--check-pdf]
// Writes out/print/*.pdf and the sample pictures out/print/obrazcy/. See tools/print/README.md.
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { OUT, HTML_DIR, launch, makeCtx, pageHtml, type Ctx, type Opts, type Part } from './kit';
import { makeIcons } from './icons';
import { pruneArt } from './art';
import { cardParts } from './parts/cards';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => { const i = args.indexOf(name); return i < 0 ? def : args[i + 1]; };
const has = (name: string) => args.includes(name);
const opts: Opts = {
  glass: opt('--glass', 'type') === 'ship' ? 'ship' : 'type',
  index: opt('--index', 'on') !== 'off',
  backs: (Number(opt('--backs', '1')) || 1) as 1 | 2 | 3,
  draft: has('--draft'), noArt: has('--no-art'), draftArt: has('--draft-art'),
  backShiftX: Number(opt('--back-shift-x', '0')), backShiftY: Number(opt('--back-shift-y', '0')),
  only: opt('--only', '') ? opt('--only', '').split(',').map(s => s.trim()) : null,
  check: has('--check'), checkPdf: has('--check-pdf'), samples: !has('--no-samples')
};

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

async function mergePdf(files: string[], out: string, title: string) {
  const doc = await PDFDocument.create();
  for (const f of files) { const src = await PDFDocument.load(fs.readFileSync(f)); for (const p of await doc.copyPages(src, src.getPageIndices())) doc.addPage(p); }
  doc.setTitle(title); doc.catalog.set(PDFName.of('ViewerPreferences'), doc.context.obj({ PrintScaling: 'None' }) as PDFDict);
  fs.writeFileSync(out, await doc.save());
}

const t0 = Date.now();
const browser = await launch();
const ctx = await makeCtx(opts, browser);
await makeIcons(ctx);
// The parts in print order. Each module builds its own PDFs; --only filters by the file's number prefix.
const want = (file: string) => !opts.only || opts.only.some(o => file.startsWith(o));
const builders: [string, () => Promise<Part[]>][] = [
  ['00', async () => (await import('./parts/howto')).build(ctx)],
  ['01', async () => (await import('./parts/rules')).build(ctx)],
  ['02', async () => (await import('./parts/memo')).build(ctx)],
  ['03', async () => (await import('./parts/boards')).build(ctx)],
  ['04', async () => (await import('./parts/tokens')).build(ctx)],
  ['05', async () => cardParts(ctx, 'decks')],
  ['07', async () => cardParts(ctx, 'sea')],
  ['08', async () => (await import('./parts/report')).build(ctx)]
];
const done: Part[] = [];
for (const [prefix, build] of builders) {
  if (opts.only && !opts.only.some(o => o.startsWith(prefix) || prefix.startsWith(o.slice(0, 2)))) continue;
  for (const part of await build()) { if (!want(part.file)) continue; await writePdf(ctx, part); done.push(part); console.log(`${part.file}.pdf — ${part.pages.length} стр.`); }
}
// vse.pdf: everything in order, to look through on a screen (not for printing: one- and two-sided pages are mixed)
if (!opts.only) {
  const main = done.filter(p => !/^05[ab]|^obrazcy/.test(p.file) && !p.file.includes('-v'));
  await mergePdf(main.map(p => path.join(OUT, p.file + '.pdf')), path.join(OUT, 'vse.pdf'), 'Бортом к борту — печатный набор (для просмотра)');
  console.log(`vse.pdf — ${main.reduce((n, p) => n + p.pages.length, 0)} стр.`);
  if (opts.samples) await (await import('./samples')).buildSamples(ctx);
  const pruned = pruneArt(); if (pruned) console.log(`cache: removed ${pruned} unused file(s)`);
}
if (opts.check) process.exitCode = await (await import('./check')).checkLayout(ctx) ? 0 : 1;
await browser.close();
if (opts.checkPdf) process.exitCode = (await import('./check')).checkPdf() ? (process.exitCode ?? 0) : 1;
console.log(`готово за ${((Date.now() - t0) / 1000).toFixed(0)} с → ${OUT}`);
