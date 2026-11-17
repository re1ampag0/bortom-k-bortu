// The sheet of every engraved icon (parts/icons.ts) for the author and the reviewers: each icon large (32 mm) and at the
// sizes it is printed (13, 8 and 6 mm) in the five tones and on brass. Not part of the set.
//   npx vite-node tools/print/icon-sheet.ts -- [--out report/print-kit/icons] [--only fire,hull]
// Writes icons.png (110 dpi, the whole sheet) and icons-real.png (300 dpi crop of the real sizes, for the 8 mm check).
import fs from 'node:fs';
import path from 'node:path';
import { esc, fontCss, launch } from './kit';
import { ICON_NAMES, ICON_TITLES, icon, TONE, type IconName } from './parts/icons';

const args = process.argv.slice(2);
const opt = (n: string, d: string) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const out = path.resolve(opt('--out', 'report/print-kit/icons'));
const only = opt('--only', '').split(',').map(s => s.trim()).filter(Boolean) as IconName[];
const names = only.length ? only : ICON_NAMES;

const COLS = 4, CW = 70, CH = 62, M = 8;
const rows = Math.ceil(names.length / COLS), W = COLS * CW + 2 * M, H = rows * CH + 2 * M + 8;
const tones = ['sepia', 'charcoal', 'navy', 'red', 'verdigris'] as const;
let svg = '';
names.forEach((n, i) => {
  const x = M + (i % COLS) * CW, y = M + 8 + Math.floor(i / COLS) * CH;
  svg += `<rect x="${x + 1}" y="${y}" width="${CW - 2}" height="${CH - 2}" rx="2" fill="#f3e6c4" stroke="#b9a47a" stroke-width=".25"/>`;
  svg += `<text x="${x + 3}" y="${y + 5}" font-family="Alegreya Sans" font-weight="800" font-size="3.4" fill="#2a1c0c">${esc(ICON_TITLES[n] ?? n)}</text>`;
  svg += `<text x="${x + CW - 3}" y="${y + 5}" font-family="Alegreya Sans" font-size="2.6" fill="#6e5a3c" text-anchor="end">${n}</text>`;
  svg += icon(n, x + 19, y + 25, 32, TONE.sepia);
  // 13 mm and 8 mm in sepia, 8 mm in the other tones, 6 mm, 8 mm on brass
  svg += icon(n, x + 46, y + 15.5, 13, TONE.sepia);
  svg += `<text x="${x + 46}" y="${y + 24.6}" font-family="Alegreya Sans" font-size="2.2" fill="#6e5a3c" text-anchor="middle">13 мм</text>`;
  svg += icon(n, x + 60, y + 15.5, 8, TONE.sepia) + icon(n, x + 60, y + 23, 6, TONE.sepia);
  tones.slice(1).forEach((t, j) => { svg += `<rect x="${x + 36 + j * 8.4}" y="${y + 28}" width="8.2" height="8.2" fill="${TONE[t].paper}"/>` + icon(n, x + 40.1 + j * 8.4, y + 32.1, 8, TONE[t]); });
  svg += `<rect x="${x + 36}" y="${y + 38.6}" width="10" height="10" rx="1.4" fill="#c4954a" stroke="#5e4214" stroke-width=".3"/>` + icon(n, x + 41, y + 43.6, 8, { ...TONE.sepia, paper: '#c4954a' });
  svg += `<rect x="${x + 48}" y="${y + 38.6}" width="10" height="10" rx="1.4" fill="#2a3a44"/>` + icon(n, x + 53, y + 43.6, 8, { ink: '#f4e6c4', mid: '#8fa4ae', light: '#2a3a44', paper: '#2a3a44' });
  svg += `<text x="${x + 36}" y="${y + 54}" font-family="Alegreya Sans" font-size="2.2" fill="#6e5a3c">8 мм: тона, латунь, тёмный</text>`;
});
const title = `<text x="${M}" y="${M + 4}" font-family="Alegreya SC" font-weight="800" font-size="5" fill="#2a1c0c">Значки набора — крупно и в размерах печати</text>`;
const html = `<!doctype html><meta charset="utf-8"><style>${fontCss()}body{margin:0;background:#e9dcbc}</style>` +
  `<svg id="s" xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}" fill-rule="evenodd">${title}${svg}</svg>`;
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const page = await browser.newPage({ deviceScaleFactor: 110 / 96 });
await page.setContent(html);
await page.evaluate(async () => { await document.fonts.ready; });
await page.locator('#s').screenshot({ path: path.join(out, 'icons.png') });
// the real sizes at 300 dpi: a strip of every icon at 8 mm and 13 mm
const real = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#f3e6c4}</style><svg id="s" xmlns="http://www.w3.org/2000/svg" width="${names.length * 10 + 4}mm" height="26mm" viewBox="0 0 ${names.length * 10 + 4} 26" fill-rule="evenodd">` +
  names.map((n, i) => icon(n, 7 + i * 10, 6, 8, TONE.sepia) + icon(n, 7 + i * 10, 18, 8, TONE.navy)).join('') + '</svg>';
const p2 = await browser.newPage({ deviceScaleFactor: 300 / 96 });
await p2.setContent(real);
await p2.locator('#s').screenshot({ path: path.join(out, 'icons-real.png') });
await browser.close();
console.log(`→ ${path.relative(process.cwd(), out)}/icons.png, icons-real.png (${names.length} icons)`);
