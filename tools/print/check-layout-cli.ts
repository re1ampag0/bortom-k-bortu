// npx vite-node tools/print/check-layout-cli.ts [-- 03-planshety 04-tryumy-zhetony 02-pamyatki] — see check-layout.ts
import { launch } from './kit';
import { LAYOUT_FILES, checkSheets } from './check-layout';

const files = process.argv.slice(2).filter(a => !a.startsWith('-'));
const list = files.length ? files : LAYOUT_FILES;
const browser = await launch();
const { errors, words } = await checkSheets(browser, list);
await browser.close();
console.log(`check-layout: ${words} words checked in ${list.join(', ')} — ${errors.length} error(s)`);
for (const e of errors.slice(0, 80)) console.log('  ERROR: ' + e);
if (errors.length) process.exitCode = 1;
