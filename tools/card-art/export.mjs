// Renders the card pictures (one per unique card name in data/game-data.json) from their SVG scenes.
// The scenes are vector (200 x 120 box), so any size is sharp: --scale 3 gives 600 x 360,
// --scale 10 gives 2000 x 1200 for print.
//
//   node tools/card-art/export.mjs --out <dir> [--scale 3] [--no-frame] [--only "Ядра,Анжелика"] [--svg] [--webp]
//
// --no-frame  drops the type-coloured frame and corner marks (for print, where the card draws its own frame).
// --svg       also writes each picture as a standalone .svg next to the .png.
// --compare   <dir with an earlier PNG export>: also writes <slug>-compare.jpg (before | after, plus thumbnails).
// --webp      the game's files instead of PNG: <slug>.webp 1200 x 720 (the card window, sharp on 2x-3x screens) and thumb/<slug>.webp 240 x 144, on the ivory
//             paper colour (WebP quality 0.82). `--webp --out src/ui/art/cards` updates the pictures in the game.
// Writes <slug>.png (or .webp) and, when every card is exported (no --only), manifest.json
// ({ name: { file, type, decks } }, the game's manifest shape).
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
const webp = args.includes('--webp');
const scale = webp ? 6 : Number(opt('--scale', '3'));
const noFrame = args.includes('--no-frame');
const writeSvg = args.includes('--svg');
// --compare <dir>: a PNG export of the same cards made earlier (the "before"); writes <slug>-compare.jpg:
// before | after at the render scale, and under them both at the game's thumbnail size 240 x 144.
const compareDir = opt('--compare', '') ? path.resolve(opt('--compare', '')) : null;
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
  cards.set(c.name, { file: slug(c.name) + (webp ? '.webp' : '.png'), type: c.type, decks: [deck] });
}
if (!cards.size) { console.error('no cards matched'); process.exit(1); }

// PNG screenshot -> the game's WebP pair, encoded by the browser's own canvas (no extra image library).
const PAPER = '#f7f2e6';
async function toWebp(page, png) {
  return page.evaluate(async ({ b64, paper }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const enc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.fillStyle = paper; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/webp', 0.82).split(',')[1]; };
    return { full: enc(1200, 720), thumb: enc(240, 144) };
  }, { b64: png.toString('base64'), paper: PAPER });
}

fs.mkdirSync(out, { recursive: true });
if (webp) fs.mkdirSync(path.join(out, 'thumb'), { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 200, height: 120 }, deviceScaleFactor: scale })).newPage();
await page.setContent(`<style>${fontFaces()} html,body{margin:0;background:transparent}</style><div id="p" style="width:200px;height:120px"></div>`);
for (const [name, c] of cards) {
  let svg = picture3(name, TYPE[c.type]);
  if (noFrame) svg = stripFrame(svg);
  if (writeSvg) fs.writeFileSync(path.join(out, c.file.replace(/\.(png|webp)$/, '.svg')), svg);
  await page.evaluate(s => { document.getElementById('p').innerHTML = s; }, svg);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150); // embedded <image> pieces decode asynchronously
  const png = await page.screenshot({ omitBackground: true });
  if (!webp) {
    fs.writeFileSync(path.join(out, c.file), png);
    const before = compareDir && path.join(compareDir, c.file);
    if (before && fs.existsSync(before)) {
      const jpg = await page.evaluate(async ({ a, b, paper }) => {
        const load = async s => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
        const [x, y] = [await load(a), await load(b)]; const W = y.width, H = y.height, gap = 16;
        const c = document.createElement('canvas'); c.width = 2 * W + gap; c.height = H + gap + 144; const g = c.getContext('2d');
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high';
        for (const [img, x0] of [[x, 0], [y, W + gap]]) {
          g.fillStyle = paper; g.fillRect(x0, 0, W, H); g.drawImage(img, x0, 0, W, H);
          g.fillRect(x0, H + gap, 240, 144); g.drawImage(img, x0, H + gap, 240, 144);
        }
        return c.toDataURL('image/jpeg', 0.85).split(',')[1];
      }, { a: fs.readFileSync(before).toString('base64'), b: png.toString('base64'), paper: PAPER });
      fs.writeFileSync(path.join(out, c.file.replace(/\.png$/, '-compare.jpg')), Buffer.from(jpg, 'base64'));
    }
    continue;
  }
  const { full, thumb } = await toWebp(page, png);
  fs.writeFileSync(path.join(out, c.file), Buffer.from(full, 'base64'));
  fs.writeFileSync(path.join(out, 'thumb', c.file), Buffer.from(thumb, 'base64'));
}
await browser.close();
// A partial export (--only) must not replace the full manifest.
if (!only) fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(Object.fromEntries(cards), null, 1));
console.log(`${cards.size} pictures, ${webp ? '1200x720 + thumb 240x144 WebP' : `${200 * scale}x${120 * scale}`}${noFrame ? ', no frame' : ''} -> ${out}`);
