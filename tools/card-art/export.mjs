// Renders the card pictures (one per unique card name in data/game-data.json) from their SVG scenes.
// The scenes are vector (200 x 120 box), so any size is sharp: --scale 3 gives 600 x 360,
// --scale 10 gives 2000 x 1200 for print.
//
//   node tools/card-art/export.mjs --out <dir> [--scale 3] [--no-frame] [--only "Ядра,Анжелика"] [--svg] [--webp]
//   node tools/card-art/export.mjs --portrait [--sheet] --out <dir> [--scale 3] [--only …] [--svg]
//
// --no-frame  drops the type-coloured frame and corner marks (for print, where the card draws its own frame).
// --svg       also writes each picture as a standalone .svg next to the .png.
// --compare   <dir with an earlier PNG export>: also writes <slug>-compare.jpg (before | after, plus thumbnails).
// --webp      the game's files instead of PNG: <slug>.webp 1200 x 720 (the card window, sharp on 2x-3x screens) and thumb/<slug>.webp 240 x 144, on the ivory
//             paper colour (WebP quality 0.82). `--webp --out src/ui/art/cards` updates the pictures in the game.
// --portrait  the printed card's pictures instead (scenes/portrait.cjs): <slug>.png 200 x 280 x scale (3 -> 600 x 840).
// --sheet     with --portrait: sheet-<deck>-<n>.png, six cards per sheet, each a mock-up of the printed card В-2
//             (type medal, price, the glass text plate over the blurred picture, the deck strip) — only for review.
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
// A machine whose preinstalled Chromium does not match the project's Playwright: CHROMIUM_PATH points at it.
const launch = () => chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

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
if (args.includes('--portrait') || args.includes('--sheet')) { await exportPortraits(); process.exit(0); }
if (webp) fs.mkdirSync(path.join(out, 'thumb'), { recursive: true });
const browser = await launch();
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

// ——— portrait pictures and review sheets (the printed card В-2, 300 × 420 px) ———
async function exportPortraits() {
  const { portrait, SCENES } = require('./scenes/portrait.cjs');
  const have = new Set(SCENES), sheet = args.includes('--sheet'), sc = Number(opt('--scale', '3'));
  const list = [...cards].filter(([name]) => have.has(name)), missing = [...cards.keys()].filter(n => !have.has(n));
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: sc })).newPage();
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style><div id="p" style="width:200px;height:280px"></div>`);
  const pngs = new Map();
  for (const [name, c] of list) {
    const svg = portrait(name), file = slug(name) + '.png';
    if (writeSvg) fs.writeFileSync(path.join(out, slug(name) + '.svg'), svg);
    await page.evaluate(s => { document.getElementById('p').innerHTML = s; }, svg);
    await page.waitForTimeout(150); // embedded <image> pieces decode asynchronously
    const png = await page.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(out, file), png); pngs.set(name, png);
  }
  if (!only) fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(Object.fromEntries(list.map(([n, c]) => [n, { file: slug(n) + '.png', type: c.type, decks: c.decks }])), null, 1));
  let sheets = 0;
  if (sheet) {
    const full = new Map(); // the card's texts from the data (first copy of the name)
    for (const [deck, l] of Object.entries(data.decks)) for (const c of l) if (!full.has(c.name)) full.set(c.name, { ...c, deck });
    const sp = await (await browser.newContext({ viewport: { width: 964, height: 888 }, deviceScaleFactor: 2 })).newPage();
    const icon = t => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(root, `docs/mockups/menus/assets/icons/ic_t_${{ 'ЗАРЯД': 'charge', 'ПРИКАЗ': 'order', 'РЕМОНТ': 'repair', 'РЕАКЦИЯ': 'reaction' }[t]}.svg`)).toString('base64');
    const DECK = { 'Ж': ['Чёрная жемчужина', '#16161a', '#c8d0dc'], 'М': ['Месть королевы Анны', '#5a1410', '#f2c08a'], 'И': ['Индевор', '#1e3e66', '#e8f0f8'], 'Г': ['Летучий голландец', '#123a30', '#b8f0d8'] };
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const groups = {};
    for (const [name] of list) { const d = full.get(name).deck; (groups[d] ||= []).push(name); }
    await sp.setContent(`<style>${fontFaces()}html,body{margin:0;background:#2a2622}
      .sh{display:grid;grid-template-columns:repeat(3,300px);gap:16px;padding:16px;width:fit-content}
      .cd{position:relative;width:300px;height:420px;border-radius:12px;overflow:hidden;background-size:300px 420px}
      .med{position:absolute;left:19px;top:19px;width:44px;height:44px;border-radius:50%;border:2px solid #e8d6aa;box-sizing:border-box;display:grid;place-items:center;box-shadow:0 2px 4px #0008}
      .med img{width:30px;height:30px}
      .cost{position:absolute;right:19px;top:19px;display:flex;flex-direction:column;gap:9px}
      .pw,.so{width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#5a4022,#241608);border:2px solid #d8b468;box-sizing:border-box;color:#ffe8b0;font:700 22px/40px 'Alegreya SC';text-align:center;box-shadow:0 2px 4px #0008}
      .so{height:54px;border-radius:22px;background:radial-gradient(circle at 40% 35%,#2a6a5a,#0a2a24);border-color:#9fe8d0;line-height:50px}
      .gl{position:absolute;left:16px;right:16px;bottom:40px;border-radius:10px;overflow:hidden;border:1px solid #ffffff55;box-sizing:border-box}
      .gl .bg{position:absolute;left:-16px;width:300px;height:420px;background-size:300px 420px;filter:blur(7px) brightness(.45)}
      .gl .tx{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 12px 10px;color:#f6ecd4;text-align:center;line-height:1.3}
      .nm{font:700 24px/1.05 'Alegreya SC'}.rb{font:700 12px 'Alegreya SC';letter-spacing:.12em;padding:1px 10px;border-radius:3px;color:#fff}
      .bg2{font:700 19px/1.15 'Alegreya'}.ru{font:15px/1.3 'Alegreya'}.pl{font:13.5px/1.3 'Alegreya'}.fl{font:italic 12px/1.3 'Alegreya';opacity:.85}
      .dk{position:absolute;left:0;right:0;bottom:0;height:34px;font:700 13px/34px 'Alegreya SC';letter-spacing:.1em;text-align:center}
      .tag{position:absolute;left:0;top:0;padding:2px 6px;font:11px monospace;background:#000a;color:#fff;display:none}</style><div id="s"></div>`);
    for (const [deck, names] of Object.entries(groups)) for (let i = 0; i < names.length; i += 6) {
      const html = names.slice(i, i + 6).map(name => {
        const c = full.get(name), bgi = `url(data:image/png;base64,${pngs.get(name).toString('base64')})`, tc = TYPE[c.type];
        const [rule, plan] = c.text.split(/<b>План:<\/b>/), plain = rule.replace(/<[^>]+>/g, '');
        const nl = name.length, rl = plain.length, [dn, dbg, dfg] = DECK[deck];
        const price = c.soul > 0 ? `<div class="so">${c.soul}</div>` : `<div class="pw">${c.cost}</div>`;
        return `<div class="cd" style="background-image:${bgi}"><div class="med" style="background:${tc}"><img src="${icon(c.type)}"></div><div class="cost">${price}</div>
          <div class="gl"><div class="bg" style="background-image:${bgi}"></div><div class="tx">
          <div class="nm" style="font-size:${nl > 14 ? 20 : nl > 10 ? 22 : 24}px">${esc(name)}</div><div class="rb" style="background:${tc}">${esc(c.type)}</div>
          ${rl < 80 && c.big ? `<div class="bg2">${esc(c.big)}</div>` : ''}<div class="ru" style="font-size:${rl > 150 ? 13.5 : rl > 80 ? 14 : 15}px">${rule.replace(/(<br\/?>)+$/, '')}</div>
          ${plan ? `<div class="pl"><b>План:</b>${plan}</div>` : ''}${c.flavor ? `<div class="fl">${esc(c.flavor)}</div>` : ''}</div></div>
          <div class="dk" style="background:${dbg};color:${dfg}">${dn}</div></div>`;
      }).join('');
      await sp.evaluate(h => { document.getElementById('s').innerHTML = `<div class="sh">${h}</div>`; }, html);
      await sp.evaluate(() => document.fonts.ready);
      // the flavour line only if it fits: the plate must not climb above 45 % of the card
      await sp.evaluate(() => document.querySelectorAll('.gl').forEach(g => { const f = g.querySelector('.fl'); if (f && g.offsetHeight > 420 - 40 - .45 * 420) f.remove(); g.querySelector('.bg').style.top = -(420 - 40 - g.offsetHeight) + 'px'; }));
      await sp.waitForTimeout(100);
      const el = await sp.$('.sh');
      fs.writeFileSync(path.join(out, `sheet-${slug(DECK[deck][0])}-${i / 6 + 1}.png`), await el.screenshot());
      sheets++;
    }
  }
  await browser.close();
  console.log(`${list.length} portrait pictures ${200 * sc}x${280 * sc}${sheet ? `, ${sheets} sheets` : ''} -> ${out}`);
  if (missing.length) { console.error(`no portrait scene for ${missing.length}: ${missing.join(', ')}`); process.exit(1); }
}
