// The test set (out/print/test/): the set as it is, but without the card backs — the user tests the game this way first
// (the user's decision 17.11). Pages are taken from the PDFs of the full set (no second rendering):
//   test-2storony.pdf — TWO-sided, flipped on the short edge (landscape): the memos (a ship face, «Справка» on its
//     back; 02 pages 1–4) and the boards (face, «Затонул» on its back; all of 03);
//   test-odnostoronnij.pdf — ONE side: «Подготовка к игре» (02, the last page), 04 holds and tokens, 04b the battle
//     scheme, 05a the faces of the deck cards with the Legends' sheet last, 07 the sea deck — the faces (odd pages).
// Not in it: 00 (how to print, calibration), 01 rules, 08 report, the trial print, the card backs.
// + PECHAT-test.txt (text/PECHAT-test.txt with the counts filled in).
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, type PDFDict } from 'pdf-lib';
import { HERE, OUT } from './kit';

export const TEST_DIR = path.join(OUT, 'test');
export const TEST_TWO = 'test-2storony.pdf', TEST_ONE = 'test-odnostoronnij.pdf';
/** the parts the test set needs (main.ts --test-set builds only these) */
export const TEST_PARTS = ['02', '03', '04', '05a', '07'];

/** which pages of a file: all, the odd ones (the faces of a two-sided file), all but the last, the last */
type Pick = 'all' | 'odd' | 'butLast' | 'last';
interface Take { file: string; pick: Pick; key: string }
const TWO: Take[] = [
  { file: '02-pamyatki', pick: 'butLast', key: 'memo' },
  { file: '03-planshety', pick: 'all', key: 'boards' }
];
const ONE: Take[] = [
  { file: '02-pamyatki', pick: 'last', key: 'setup' },
  { file: '04-tryumy-zhetony', pick: 'all', key: 'tokens' },
  { file: '04b-skhema-boya', pick: 'all', key: 'scheme' },
  { file: '05a-lica', pick: 'all', key: 'cards' },
  { file: '07-more', pick: 'odd', key: 'sea' }
];
const pick = (n: number, p: Pick) => [...Array(n).keys()].filter(i => p === 'all' || (p === 'odd' ? i % 2 === 0 : p === 'butLast' ? i < n - 1 : i === n - 1));

/** One PDF from the takes; vals gets <key> (pages), <key>From/<key>To (page numbers in it). */
async function compose(takes: Take[], out: string, title: string, duplex: boolean, vals: Record<string, number>): Promise<number> {
  const doc = await PDFDocument.create();
  for (const t of takes) {
    const file = path.join(OUT, t.file + '.pdf');
    if (!fs.existsSync(file)) throw new Error(`test set: ${t.file}.pdf is not built (npm run print -- --test-set builds ${TEST_PARTS.join(', ')})`);
    const src = await PDFDocument.load(fs.readFileSync(file)), idx = pick(src.getPageCount(), t.pick);
    if (duplex && idx.length % 2) throw new Error(`test set: ${t.file} gives ${idx.length} pages to a two-sided file — the sides would slip`);
    for (const p of await doc.copyPages(src, idx)) doc.addPage(p);
    vals[t.key] = idx.length; vals[t.key + 'From'] = doc.getPageCount() - idx.length + 1; vals[t.key + 'To'] = doc.getPageCount();
  }
  doc.setTitle(title); doc.setAuthor('Бортом к борту'); doc.setLanguage('ru');
  doc.catalog.set(PDFName.of('ViewerPreferences'), doc.context.obj({ PrintScaling: 'None', ...(duplex ? { Duplex: 'DuplexFlipShortEdge' } : {}) }) as PDFDict);
  fs.writeFileSync(path.join(TEST_DIR, out), await doc.save());
  return doc.getPageCount();
}

/** Writes the test set from the PDFs in out/print; returns the sheets of each file. */
export async function buildTestSet(): Promise<{ two: number; one: number }> {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  const vals: Record<string, number> = {};
  const twoPages = await compose(TWO, TEST_TWO, 'Бортом к борту — тестовый набор: памятки и планшеты, с двух сторон (по короткому краю)', true, vals);
  const one = await compose(ONE, TEST_ONE, 'Бортом к борту — тестовый набор: с одной стороны (без рубашек карт)', false, vals);
  const two = twoPages / 2;
  Object.assign(vals, { twoPages, two, one, all: two + one, memoSheets: vals.memo / 2, boardsSheets: vals.boards / 2 });
  const memo = fs.readFileSync(path.join(HERE, 'text/PECHAT-test.txt'), 'utf8').replace(/\{(\w+)\}/g, (m, k: string) => k in vals ? String(vals[k]) : m);
  if (/\{\w+\}/.test(memo)) throw new Error('PECHAT-test.txt: a placeholder without a value');
  fs.writeFileSync(path.join(TEST_DIR, 'PECHAT-test.txt'), memo);
  return { two, one };
}
