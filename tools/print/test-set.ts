// The test set (out/print/test/): everything needed to play, printed on ONE side of the paper, no backs — the user
// tests the game this way first. Pages are taken from the PDFs of the full set (no second rendering):
//   02 memos: every page (the ship faces and the «Справка» backs as separate sheets, «Подготовка к игре»);
//   03 boards: the faces only (odd pages, no «Затонул»); 04 holds and tokens, 04b the battle scheme: as they are;
//   05a faces of the deck cards with the Legends' sheet last; 07 the sea deck: the faces only (odd pages).
// Not in it: 00 (how to print, calibration), 01 rules, 08 report, the trial print, any back.
// One file test-odnostoronnij.pdf in that order + PECHAT-test.txt (text/PECHAT-test.txt with the counts filled in).
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, type PDFDict } from 'pdf-lib';
import { HERE, OUT } from './kit';

export const TEST_DIR = path.join(OUT, 'test');
export const TEST_FILE = 'test-odnostoronnij.pdf';
/** the parts the test set needs (main.ts --test-set builds only these) */
export const TEST_PARTS = ['02', '03', '04', '05a', '07'];

type Pick = 'all' | 'odd';
/** file → which pages, and how the sheet is named in PECHAT-test.txt */
export const TEST_PLAN: { file: string; pick: Pick; key: string }[] = [
  { file: '02-pamyatki', pick: 'all', key: 'memo' },
  { file: '03-planshety', pick: 'odd', key: 'boards' },
  { file: '04-tryumy-zhetony', pick: 'all', key: 'tokens' },
  { file: '04b-skhema-boya', pick: 'all', key: 'scheme' },
  { file: '05a-lica', pick: 'all', key: 'cards' },
  { file: '07-more', pick: 'odd', key: 'sea' }
];

/** Writes the test set from the PDFs in out/print; returns the number of sheets of each group and in all. */
export async function buildTestSet(): Promise<{ counts: Record<string, number>; total: number }> {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  const doc = await PDFDocument.create(), counts: Record<string, number> = {}, vals: Record<string, number> = {};
  for (const t of TEST_PLAN) {
    const file = path.join(OUT, t.file + '.pdf');
    if (!fs.existsSync(file)) throw new Error(`test set: ${t.file}.pdf is not built (npm run print -- --test-set builds ${TEST_PARTS.join(', ')})`);
    const src = await PDFDocument.load(fs.readFileSync(file));
    const idx = src.getPageIndices().filter(i => t.pick === 'all' || i % 2 === 0);
    for (const p of await doc.copyPages(src, idx)) doc.addPage(p);
    counts[t.key] = idx.length;
    vals[t.key] = idx.length; vals[t.key + 'From'] = doc.getPageCount() - idx.length + 1; vals[t.key + 'To'] = doc.getPageCount();
  }
  const total = doc.getPageCount();
  doc.setTitle('Бортом к борту — тестовый набор, печать с одной стороны'); doc.setAuthor('Бортом к борту'); doc.setLanguage('ru');
  doc.catalog.set(PDFName.of('ViewerPreferences'), doc.context.obj({ PrintScaling: 'None' }) as PDFDict);
  fs.writeFileSync(path.join(TEST_DIR, TEST_FILE), await doc.save());
  const memo = fs.readFileSync(path.join(HERE, 'text/PECHAT-test.txt'), 'utf8')
    .replace(/\{(\w+)\}/g, (m, k: string) => k === 'total' ? String(total) : k in vals ? String(vals[k]) : m);
  if (/\{\w+\}/.test(memo)) throw new Error('PECHAT-test.txt: a placeholder without a value');
  fs.writeFileSync(path.join(TEST_DIR, 'PECHAT-test.txt'), memo);
  return { counts, total };
}
