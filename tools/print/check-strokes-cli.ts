// npx vite-node tools/print/check-strokes-cli.ts [-- 03-planshety …] — see checkStrokes in check-layout.ts
import { launch } from './kit';
import { STROKE_FILES, checkStrokes } from './check-layout';

const files = process.argv.slice(2).filter(a => !a.startsWith('-'));
const browser = await launch();
const r = await checkStrokes(browser, files.length ? files : STROKE_FILES);
await browser.close();
console.log(`check-strokes: ${r.strokes} strokes, thinnest ${r.thinnest.toFixed(3)} mm — ${r.errors.length} place(s) under the floor`);
for (const e of r.errors.slice(0, 400)) console.log('  ' + e);
if (r.errors.length) process.exitCode = 1;
