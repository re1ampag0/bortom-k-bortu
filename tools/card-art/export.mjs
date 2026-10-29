// Renders the card pictures (one per unique card name in data/game-data.json) from their SVG scenes.
// The scenes are vector (200 x 120 box), so any size is sharp: --scale 3 gives the game's 600 x 360,
// --scale 10 gives 2000 x 1200 for print.
//
//   node tools/card-art/export.mjs --out <dir> [--scale 3] [--no-frame] [--only "Ядра,Анжелика"] [--svg]
//
// --no-frame  drops the type-coloured frame and corner marks (for print, where the card draws its own frame).
// --svg       also writes each picture as a standalone .svg next to the .png.
// Writes <slug>.png and manifest.json ({ name: { file, type, decks } }, same shape as the game's manifest).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const { picture3 } = require('./scenes/pic3.cjs');
const { chromium } = (() => { try { return require('@playwright/test'); } catch { return require('playwright'); } })();

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args[i + 1]; };
const out = path.resolve(opt('--out', path.join(root, 'test-results/card-art')));
const scale = Number(opt('--scale', '3'));
const noFrame = args.includes('--no-frame');
const writeSvg = args.includes('--svg');
const only = opt('--only', '') ? new Set(opt('--only', '').split(',').map(s => s.trim())) : null;

const TYPE = { 'ЗАРЯД': '#b5542c', 'ПРИКАЗ': '#6b4f8a', 'РЕМОНТ': '#3f7f4a', 'РЕАКЦИЯ': '#2f6b8f' };
const T = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
export const slug = n => n.toLowerCase().split('').map(c => T[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Frameless: square clip instead of the rounded one, and nothing drawn after the picture group.
export const stripFrame = svg => svg
  .replace('<rect width="200" height="120" rx="4"/></clipPath>', '<rect width="200" height="120"/></clipPath>')
  .replace(/<\/g>\s*<rect x="1" y="1"[\s\S]*<\/svg>$/, '</g></svg>');

// The scenes letter a few signs in Alegreya SC: embed the game's fonts so the render does not depend on the machine.
function fontFaces() {
  const files = [['Alegreya SC', 'alegreya-sc', 400], ['Alegreya SC', 'alegreya-sc', 700], ['Alegreya', 'alegreya', 400], ['Alegreya', 'alegreya', 700]];
  const css = [];
  for (const [family, pkg, w] of files) for (const sub of ['cyrillic', 'latin']) {
    const f = path.join(root, `node_modules/@fontsource/${pkg}/files/${pkg}-${sub}-${w}-normal.woff2`);
    if (fs.existsSync(f)) css.push(`@font-face{font-family:'${family}';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2')}`);
  }
  if (!css.length) console.warn('warning: @fontsource fonts not found (run npm ci); signs use system fonts');
  return css.join('');
}

const data = JSON.parse(fs.readFileSync(path.join(root, 'data/game-data.json'), 'utf8'));
const cards = new Map();
for (const [deck, list] of Object.entries(data.decks)) for (const c of list) {
  if (only && !only.has(c.name)) continue;
  const known = cards.get(c.name);
  if (known) { if (!known.decks.includes(deck)) known.decks.push(deck); continue; }
  cards.set(c.name, { file: slug(c.name) + '.png', type: c.type, decks: [deck] });
}
if (!cards.size) { console.error('no cards matched'); process.exit(1); }

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 200, height: 120 }, deviceScaleFactor: scale })).newPage();
await page.setContent(`<style>${fontFaces()} html,body{margin:0;background:transparent}</style><div id="p" style="width:200px;height:120px"></div>`);
for (const [name, c] of cards) {
  let svg = picture3(name, TYPE[c.type]);
  if (noFrame) svg = stripFrame(svg);
  if (writeSvg) fs.writeFileSync(path.join(out, c.file.replace(/\.png$/, '.svg')), svg);
  await page.evaluate(s => { document.getElementById('p').innerHTML = s; }, svg);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150); // embedded <image> pieces decode asynchronously
  await page.screenshot({ path: path.join(out, c.file), omitBackground: true });
}
await browser.close();
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(Object.fromEntries(cards), null, 1));
console.log(`${cards.size} pictures, ${200 * scale}x${120 * scale}${noFrame ? ', no frame' : ''} -> ${out}`);
