// The print-and-play set: HTML → PDF with Chromium (docs/tasks/print-kit.md, stage А).
//   npm run print [-- --only 05,07] [--glass type|ship] [--index on|off] [--backs 1|2|3] [--draft] [--no-art]
//                 [--draft-art] [--back-shift-x mm] [--back-shift-y mm] [--no-samples] [--check] [--check-pdf]
// Writes out/print/*.pdf and the sample pictures out/print/obrazcy/. See tools/print/README.md.
import path from 'node:path';
import fs from 'node:fs';
import { HERE, OUT, SAMPLES, esc, launch, makeCtx, type Opts, type Part } from './kit';
import { mergePdf, writePdf } from './pdf';
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
// `--only obrazcy` (alone or with part numbers): the sample pictures without the full set
if (opts.only?.some(o => o.startsWith('obr'))) await (await import('./samples')).buildSamples(ctx);
// vse.pdf: everything in order, to look through on a screen (not for printing: one- and two-sided pages are mixed)
if (!opts.only) {
  const main = done.filter(p => !/^05[ab]|^obrazcy/.test(p.file) && !p.file.includes('-v'));
  await mergePdf(main.map(p => path.join(OUT, p.file + '.pdf')), path.join(OUT, 'vse.pdf'), 'Бортом к борту — печатный набор (для просмотра)');
  console.log(`vse.pdf — ${main.reduce((n, p) => n + p.pages.length, 0)} стр.`);
  if (opts.samples) await (await import('./samples')).buildSamples(ctx);
  // index.html for the site (dist/print/): the files in plain words
  const site = JSON.parse(fs.readFileSync(path.join(HERE, 'text/site.json'), 'utf8')) as { title: string; lead: string; files: string[][]; shift: string; samples: string };
  const li = (f: string, t: string, n = '') => `<li><a href="${esc(f)}">${esc(t)}</a>${n ? ` <small>— ${esc(n)}</small>` : ''}</li>`;
  const shifts = fs.readdirSync(OUT).filter(f => /^05b-rubashki-.+\.pdf$/.test(f)).sort(), pngs = fs.existsSync(SAMPLES) ? fs.readdirSync(SAMPLES).filter(f => f.endsWith('.png')).sort() : [];
  fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(site.title)}</title><style>body{font:18px/1.5 Georgia,serif;max-width:46em;margin:2em auto;padding:0 1em;color:#2a1c0c;background:#f6ecd4}small{color:#6e5a3c}li{margin:.35em 0}</style></head><body><h1>${esc(site.title)}</h1><p>${esc(site.lead)}</p><ul>${site.files.filter(f => fs.existsSync(path.join(OUT, f[0]))).map(f => li(f[0], f[1], f[2])).join('')}</ul>${shifts.length ? `<p>${esc(site.shift)}</p><ul>${shifts.map(f => li(f, f)).join('')}</ul>` : ''}${pngs.length ? `<p>${esc(site.samples)}</p><ul>${pngs.map(f => li('obrazcy/' + f, f)).join('')}</ul>` : ''}</body></html>`);
  const pruned = pruneArt(); if (pruned) console.log(`cache: removed ${pruned} unused file(s)`);
}
if (opts.check && !(await (await import('./check')).checkLayout(ctx))) process.exitCode = 1;
await browser.close();
if (opts.checkPdf && !(await (await import('./check')).checkPdf())) process.exitCode = 1;
console.log(`готово за ${((Date.now() - t0) / 1000).toFixed(0)} с → ${OUT}`);
