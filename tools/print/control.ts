// The first page of every PDF of the set (the user's decision, v8): a 50 × 50 mm square to check that the printer prints
// at 100 %, the file's name and how to print it (from text/howto.json). A two-sided file gets a blank back after it, so its
// faces and backs keep their pairs. Added when the PDF is written (pdf.ts): the parts' own pages and the sample pictures
// keep their numbering.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, esc, type Part } from './kit';

const T = JSON.parse(fs.readFileSync(path.join(HERE, 'text/control.json'), 'utf8')) as Record<string, string>;
const H = JSON.parse(fs.readFileSync(path.join(HERE, 'text/howto.json'), 'utf8')) as { p1: { files: { file: string[]; what: string; sheets: string; sides: string }[] } };
/** **bold** and `name` of the texts */
const fmt = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<span style="font-family:\'Alegreya Sans\';font-weight:700">$1</span>');
/** the side of the square, mm */
export const CONTROL_MM = 50;

/** the row of the file in the table of 00 */
function rowOf(file: string) {
  const name = file + '.pdf', shift = /^05b-rubashki-.+$/.test(file) ? '05b-rubashki-A…I.pdf' : '';
  return H.p1.files.find(f => f.file.includes(name) || (shift && f.file.includes(shift)));
}

export function controlPages(part: Part): Part['pages'] {
  const land = !!part.pages[0]?.land, W = land ? 297 : 210, s = CONTROL_MM, x = (W - s) / 2, y = land ? 62 : 92;
  const row = rowOf(part.file), ink = '#2a1c0c', soft = '#6e5a3c';
  const ticks = Array.from({ length: 6 }, (_, i) => i * 10).map(d => `M${d} ${-1.2}V0M${d} ${s}V${s + 1.2}M${-1.2} ${d}H0M${s} ${d}H${s + 1.2}`).join('');
  const square = `<svg style="position:absolute;left:${x - 2}mm;top:${y - 2}mm;width:${s + 4}mm;height:${s + 4}mm" viewBox="-2 -2 ${s + 4} ${s + 4}">` +
    `<rect x="0" y="0" width="${s}" height="${s}" fill="none" stroke="${ink}" stroke-width=".3"/><path d="${ticks}" stroke="${ink}" stroke-width=".25" fill="none"/></svg>` +
    `<div style="position:absolute;left:${x}mm;top:${y + s / 2 - 4}mm;width:${s}mm;text-align:center;font:800 14pt/8mm 'Alegreya Sans',sans-serif;color:${ink}">${esc(T.square)}</div>`;
  const block = (top: number, html: string, size = 11) => `<div style="position:absolute;left:25mm;top:${top}mm;width:${W - 50}mm;font:500 ${size}pt/1.35 Alegreya,serif;color:${ink};text-align:center">${html}</div>`;
  const two = !!part.duplex;
  const face = `<div style="position:absolute;inset:0;background:#fff">` +
    block(land ? 16 : 24, `<div style="font:700 9pt 'Alegreya Sans',sans-serif;letter-spacing:.08em;color:${soft};text-transform:uppercase">${esc(T.kicker)}</div><div style="font:800 24pt/1.2 'Alegreya SC',serif;margin-top:2mm">${esc(T.title)}</div><div style="font:700 13pt 'Alegreya Sans',sans-serif;margin-top:2mm">${esc(part.file)}.pdf</div>`) +
    square +
    block(y + s + 10, fmt(T.check)) +
    (row ? block(y + s + (land ? 32 : 40), `<div style="font:800 11pt 'Alegreya SC',serif;letter-spacing:.04em">${esc(T.howH)}</div><div>${fmt(row.what)}</div><div><b>${fmt(row.sides)}</b> · листов: ${fmt(row.sheets)}</div>${two ? `<div style="color:${soft};font-style:italic">${fmt(T.back)}</div>` : ''}`, 10.5) : '') +
    `</div>`;
  const pages: Part['pages'] = [{ html: face, land }];
  if (two) pages.push({ html: `<div style="position:absolute;left:0;right:0;bottom:12mm;text-align:center;font:italic 500 8pt Alegreya,serif;color:#9a8a70">${esc(T.blank)}</div>`, land });
  return pages;
}
