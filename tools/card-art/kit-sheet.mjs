// Renders the check sheets of the art kit (tools/card-art/scenes/kit/stands/*.cjs) to PNG for the reviewers.
//   node tools/card-art/kit-sheet.mjs <stands.cjs> [--only a,b] [--out report/print/kit] [--width 1600] [--crop x,y,w,h] [--suffix -zoom]
// A stands file exports { sheets: { <name>: { w, h, bg?, svg: () => '<inner svg>' } } }; --crop is in sheet units.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('@playwright/test'); } catch { return require('playwright'); } })();
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const file = path.resolve(args[0] || ''), out = path.resolve(opt('--out', 'report/print/kit')), width = +opt('--width', 1600);
const only = opt('--only', '').split(',').map(s => s.trim()).filter(Boolean), crop = opt('--crop', '') ? opt('--crop', '').split(',').map(Number) : null, suffix = opt('--suffix', crop ? '-crop' : '');
if (!fs.existsSync(file)) { console.error('usage: kit-sheet.mjs <stands.cjs> [--only a,b] [--out dir] [--width px] [--crop x,y,w,h]'); process.exit(1); }
const { sheets } = require(file);
fs.mkdirSync(out, { recursive: true });
const guess = '/opt/pw-browsers/chromium', exe = process.env.CHROMIUM_PATH || (fs.existsSync(guess) && !fs.existsSync(chromium.executablePath()) ? guess : '');
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
let bad = 0;
for (const [name, sh] of Object.entries(sheets)) {
  if (only.length && !only.includes(name)) continue;
  try {
    const [x, y, w, h] = crop || [0, 0, sh.w, sh.h], H = Math.round(width * h / w);
    const page = await browser.newPage({ viewport: { width, height: H }, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0;background:${sh.bg || '#fff'}"><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="${x} ${y} ${w} ${h}">${sh.svg()}</svg>`);
    const f = path.join(out, name + suffix + '.png');
    await page.screenshot({ path: f }); await page.close();
    console.log(path.relative(process.cwd(), f), `${width}x${H}`);
  } catch (e) { bad++; console.error(`FAIL ${name}: ${e.message}`); }
}
await browser.close();
process.exit(bad ? 1 : 0);
