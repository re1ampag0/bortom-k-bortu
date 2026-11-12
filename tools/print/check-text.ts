// Text check of the printed rules and memo (docs/tasks/print-kit-review-repo.md, 16):
//   npx vite-node tools/print/check-text.ts
// Every word of pages 2–5 of reference/bortom-k-bortu-demo-v0.3-PnP.txt must be in tools/print/text/rules.md +
// tools/print/text/memo.md the same number of times (the .txt mixes the two columns, so the order is not compared).
// Exit code 0 — the texts match; 1 — they differ (the differing words are printed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Running heads and feet of the PnP pages: not part of the text. page — the page they must be found on, once. */
const HEADERS: { page: number; line: string }[] = [
  { page: 2, line: 'Б О РТОМ К БОРТУ · ПРАВ ИЛ А' },
  { page: 3, line: 'Б О РТОМ К БОРТУ · ПРАВ ИЛ А' },
  { page: 4, line: 'Б О РТОМ К БОРТУ · ПРАВ ИЛ А' },
  { page: 2, line: 'БОРТОМ К БОРТУ · демо-версия 0.3 · правила 2' },
  { page: 3, line: 'БОРТОМ К БОРТУ · демо-версия 0.3 · правила 3' },
  { page: 4, line: 'БОРТОМ К БОРТУ · демо-версия 0.3 · правила 4' },
  { page: 5, line: 'БОРТОМ К БОРТУ · демо-версия 0.3 · памятки 5' }
];

/**
 * The only allowed changes of the PnP text. 1–5: descriptions of components that changed with the new cards (no
 * codes and «circles» on them; print-kit-review-player.md 3.8). 6: the Charge ribbon reads as on the cards
 * (print-kit-review-player.md 1.6). «now» must stand in our text exactly once; it is checked as «was».
 */
const REPLACED: { file: 'rules' | 'memo'; was: string; now: string }[] = [
  { file: 'rules', was: '96 карт кораблей: 4 колоды по 24 карты (код в углу: Ж, М, И, Г)', now: '96 карт кораблей: 4 колоды по 24 карты (чья карта — по полосе внизу и букве на рубашке)' },
  { file: 'rules', was: '4 Легенды — по одной на корабль (код Ж-Л, М-Л, И-Л, Г-Л)', now: '4 Легенды — по одной на корабль (латунная рамка)' },
  { file: 'rules', was: '17 карт Колоды моря (код С)', now: '17 карт Колоды моря (полоса «Колода моря»)' },
  { file: 'rules', was: 'карты с чёрным кружком (число в кружке — стоимость)', now: 'карты с чугунной монетой (число на монете — стоимость)' },
  { file: 'rules', was: 'Бирюзовый кружок — стоимость в Душах «Голландца»', now: 'Бирюзовая склянка — стоимость в Душах «Голландца»' },
  { file: 'memo', was: 'ЗАРЯД · вместе с Залпом', now: 'ЗАРЯД · к своему Залпу' }
];

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
/** Words (letters and digits, lower case) and the signs + − =. */
const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+|[+−=]/gu) ?? [];
const bag = (list: string[]) => { const m = new Map<string, number>(); for (const w of list) m.set(w, (m.get(w) ?? 0) + 1); return m; };
const errors: string[] = [];

// ---- the reference: pages 2–5 of the .txt (pages are separated by \f) ----
const pages = read('reference/bortom-k-bortu-demo-v0.3-PnP.txt').split('\f');
if (!pages[1]?.includes('Правила игры') || !pages[4]?.includes('Памятка') || pages[0]?.includes('Правила игры') || !pages[5]?.includes('капитан Джек Воробей'))
  errors.push('the .txt is not split as expected: pages 2–5 must be the rules (2–4) and the memo (5)');

function pageText(n: number): string {
  let lines = pages[n - 1].split('\n');
  for (const h of HEADERS.filter(x => x.page === n)) {
    const hits = lines.filter(l => squash(l) === h.line).length;
    if (hits !== 1) errors.push(`page ${n}: running line «${h.line}» found ${hits} time(s), expected 1`);
    lines = lines.filter(l => squash(l) !== h.line);
  }
  // a word broken at the end of a line: «сло-\nво» → «слово»
  return lines.join('\n').replace(/(\p{L})-\n\s*(\p{Ll})/gu, '$1$2');
}
const refRules = [2, 3, 4].map(pageText).join('\n');
// Page 5 carries the same memo twice (one per team): both copies must be equal, one is compared.
const memoLines = pageText(5).split('\n');
const starts = memoLines.map((l, i) => (squash(l).startsWith('Памятка') ? i : -1)).filter(i => i >= 0);
if (starts.length !== 2) errors.push(`page 5: «Памятка» starts ${starts.length} time(s), expected 2 copies`);
const copyA = memoLines.slice(starts[0] ?? 0, starts[1] ?? memoLines.length).join('\n'), copyB = memoLines.slice(starts[1] ?? memoLines.length).join('\n');
if (words(copyA).slice().sort().join(' ') !== words(copyB).slice().sort().join(' ')) errors.push('page 5: the two copies of the memo differ');
const reference = words(refRules + '\n' + copyA);

// ---- our texts: mark-up off, «::: add» blocks (not from the PnP) aside, allowed replacements back ----
let added = 0;
function ours(file: 'rules' | 'memo'): string {
  const out: string[] = [];
  let inAdd = false, inBlock = false;
  for (const raw of read(`tools/print/text/${file}.md`).split('\n')) {
    const open = raw.match(/^:::\s*(\w+)\s*(.*)$/);
    if (open) { inBlock = true; inAdd = open[1] === 'add'; if (inAdd) added += words(open[2]).length; else out.push(open[2]); continue; }
    if (/^:::\s*$/.test(raw)) { if (!inBlock) errors.push(`${file}.md: «:::» closes nothing`); inBlock = inAdd = false; continue; }
    if (inAdd) { added += words(raw.replace(/\{\w+\}/g, ' ')).length; continue; }
    out.push(raw.replace(/\{\w+\}/g, ' ').replace(/^\s*(#{1,3}|>|-)\s+/, '').replace(/\*+/g, '').replace(/\\/g, '').replace(/\s\|\s/g, ' '));
  }
  if (inBlock) errors.push(`${file}.md: a «:::» block is not closed`);
  let text = squash(out.join('\n'));
  for (const r of REPLACED.filter(x => x.file === file)) {
    const hits = text.split(r.now).length - 1;
    if (hits !== 1) errors.push(`${file}.md: «${r.now}» found ${hits} time(s), expected 1`);
    text = text.replace(r.now, r.was);
  }
  return text;
}
const mine = words(ours('rules') + '\n' + ours('memo'));

// ---- compare the two bags of words ----
const a = bag(reference), b = bag(mine);
const missing: string[] = [], extra: string[] = [];
for (const [w, n] of a) if ((b.get(w) ?? 0) < n) missing.push(`${w} ×${n - (b.get(w) ?? 0)}`);
for (const [w, n] of b) if ((a.get(w) ?? 0) < n) extra.push(`${w} ×${n - (a.get(w) ?? 0)}`);
if (missing.length) errors.push(`нет в наших текстах (есть в PnP): ${missing.join(', ')}`);
if (extra.length) errors.push(`лишнее в наших текстах (нет в PnP): ${extra.join(', ')}`);

if (errors.length) {
  console.error('check-text: ТЕКСТЫ РАСХОДЯТСЯ');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log(`check-text: сверено слов — ${reference.length} (стр. 2–4 PnP 0.3 → rules.md, стр. 5 → memo.md; различных слов ${a.size}).`);
console.log(`Памятка на стр. 5 напечатана дважды: копии равны, сверена одна. Колонтитулов исключено: ${HEADERS.length}.`);
console.log(`Разрешённых замен: ${REPLACED.length}. Дополнения вне сверки (блоки «::: add»): ${added} слов.`);
