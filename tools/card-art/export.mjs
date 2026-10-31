// Renders the card pictures (one per unique card name in data/game-data.json) from their SVG scenes.
// The scenes are vector (200 x 120 box), so any size is sharp: --scale 3 gives 600 x 360,
// --scale 10 gives 2000 x 1200 for print.
//
//   node tools/card-art/export.mjs --out <dir> [--scale 3] [--no-frame] [--only "Ядра,Анжелика"] [--svg] [--webp]
//   node tools/card-art/export.mjs --portrait [--sheet] [--skel] [--guides] [--grid] --out <dir> [--scale 3] [--only …] [--svg]
//
// --no-frame  drops the type-coloured frame and corner marks (for print, where the card draws its own frame).
// --svg       also writes each picture as a standalone .svg next to the .png.
// --compare   <dir with an earlier PNG export>: also writes <slug>-compare.jpg (before | after, plus thumbnails).
// --webp      the game's files instead of PNG: <slug>.webp 1200 x 720 (the card window, sharp on 2x-3x screens) and thumb/<slug>.webp 240 x 144, on the ivory
//             paper colour (WebP quality 0.82). `--webp --out src/ui/art/cards` updates the pictures in the game.
// --portrait  the printed card's pictures instead (scenes/portrait.cjs): <slug>.png 200 x 280 x scale (3 -> 600 x 840).
// --sheet     with --portrait: sheet-<deck>-<n>.png, six cards per sheet, each a mock-up of the printed card В-2
//             (type medal, price, the glass text plate over the blurred picture, the deck strip) — only for review;
//             and glass.json { name: top of the glass plate in % of the card }, merged with an earlier file;
//             --mixed puts the --only cards on common sheets in their order (sheet-mixed-<n>.png).
// --skel      with --portrait: skel/<slug>.png, the skeleton SKEL[name] over the original picture, and its warnings.
// --guides    with --portrait: guides/<slug>.png, the picture with the lines y 126, y 140, the glass line, the top
//             corners, the margins and the horizon of SKEL.
// --grid      with --portrait: grid/<slug>-r<row>c<col>-x<x0>-<x1>-y<y0>-<y1>.png, 12 close-ups at device scale 10.
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
// Skeleton check (--skel): the boxes of SKEL[name] (scenes/portrait-<deck>.cjs). An item is
// [id, x, yBase, w, h, support, heightM?, { edge, bg }?]: x is the left side, yBase the bottom, in picture units 0-280;
// edge: a mass that may cross the 10-unit margin (under the glass); bg: background, allowed in the top corners too.
// A support naming another item's id ("on scaffold", "behind wall", "held by hand") allows the two boxes to overlap.
export function skelWarnings(sk) {
  const items = sk.items.map(([id, x, y, w, h, sup = '', ...rest]) => ({ id, x, y, w, h, sup: String(sup), m: rest.find(v => typeof v === 'number'), o: rest.find(v => v && typeof v === 'object') || {} }));
  const out = [], word = (s, id) => new RegExp(`(^|[^\\w-])${id.replace(/[-]/g, '\\-')}($|[^\\w-])`).test(s);
  for (const a of items) {
    if (/^ground\b/.test(a.sup)) {
      if (a.y < sk.horizon) out.push(`${a.id}: base y ${a.y} is above the horizon y ${sk.horizon}`);
      else if (a.m) { const want = a.m * (a.y - sk.horizon) / sk.eye; if (Math.abs(a.h - want) > .15 * want) out.push(`${a.id}: height ${a.h} but ${a.m} m at base y ${a.y} gives ${want.toFixed(1)} (${Math.round(100 * (a.h - want) / want)} %)`); }
    }
    const top = a.y - a.h;
    if (!a.o.bg && top < 45 && ((a.x < 45) || (a.x + a.w > 155))) out.push(`${a.id}: enters a top corner 45 × 45 (box x ${a.x}..${a.x + a.w}, top y ${top})`);
    if (!a.o.edge && !a.o.bg && (a.x < 10 || a.x + a.w > 190 || top < 10)) out.push(`${a.id}: closer than 10 to the edge (box x ${a.x}..${a.x + a.w}, top y ${top}); mark { edge: 1 } for an under-glass mass, { bg: 1 } for the background`);
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    const cross = a.x < b.x + b.w && b.x < a.x + a.w && a.y - a.h < b.y && b.y - b.h < a.y;
    if (cross && !word(a.sup, b.id) && !word(b.sup, a.id)) out.push(`${a.id} and ${b.id} overlap, but neither support names the other (on / behind / in …)`);
  }
  return out;
}

async function exportPortraits() {
  const { portrait, SCENES, SKEL } = require('./scenes/portrait.cjs');
  const have = new Set(SCENES), sheet = args.includes('--sheet'), sc = Number(opt('--scale', '3'));
  const skel = args.includes('--skel'), guides = args.includes('--guides'), grid = args.includes('--grid');
  const list = [...cards].filter(([name]) => have.has(name)), missing = [...cards.keys()].filter(n => !have.has(n));
  const browser = await launch();
  if (skel) { await exportSkel(browser, list, SKEL); await browser.close(); return; }
  const page = await (await browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: sc })).newPage();
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style><div id="p" style="width:200px;height:280px"></div>`);
  const pngs = new Map(), svgs = new Map();
  for (const [name, c] of list) {
    const svg = portrait(name), file = slug(name) + '.png';
    if (writeSvg) fs.writeFileSync(path.join(out, slug(name) + '.svg'), svg);
    await page.evaluate(s => { document.getElementById('p').innerHTML = s; }, svg);
    await page.waitForTimeout(150); // embedded <image> pieces decode asynchronously
    const png = await page.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(out, file), png); pngs.set(name, png); svgs.set(name, svg);
  }
  if (!only) fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(Object.fromEntries(list.map(([n, c]) => [n, { file: slug(n) + '.png', type: c.type, decks: c.decks }])), null, 1));
  let sheets = 0;
  const full = new Map(); // the card's texts from the data (first copy of the name)
  for (const [deck, l] of Object.entries(data.decks)) for (const c of l) if (!full.has(c.name)) full.set(c.name, { ...c, deck });
  const DECK = { 'Ж': ['Чёрная жемчужина', '#16161a', '#c8d0dc'], 'М': ['Месть королевы Анны', '#5a1410', '#f2c08a'], 'И': ['Индевор', '#1e3e66', '#e8f0f8'], 'Г': ['Летучий голландец', '#123a30', '#b8f0d8'] };
  const icon = t => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(root, `docs/mockups/menus/assets/icons/ic_t_${{ 'ЗАРЯД': 'charge', 'ПРИКАЗ': 'order', 'РЕМОНТ': 'repair', 'РЕАКЦИЯ': 'reaction' }[t]}.svg`)).toString('base64');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cardHtml = (name, bgi) => {
    const c = full.get(name), tc = TYPE[c.type];
    const [rule, plan] = c.text.split(/<b>План:<\/b>/), plain = rule.replace(/<[^>]+>/g, '');
    const nl = name.length, rl = plain.length, [dn, dbg, dfg] = DECK[c.deck];
    const price = c.soul > 0 ? `<div class="so">${c.soul}</div>` : `<div class="pw">${c.cost}</div>`;
    return `<div class="cd" data-name="${esc(name)}" style="background-image:${bgi}"><div class="med" style="background:${tc}"><img src="${icon(c.type)}"></div><div class="cost">${price}</div>
      <div class="gl"><div class="bg" style="background-image:${bgi}"></div><div class="tx">
      <div class="nm" style="font-size:${nl > 14 ? 20 : nl > 10 ? 22 : 24}px">${esc(name)}</div><div class="rb" style="background:${tc}">${esc(c.type)}</div>
      ${rl < 80 && c.big ? `<div class="bg2">${esc(c.big)}</div>` : ''}<div class="ru" style="font-size:${rl > 150 ? 13.5 : rl > 80 ? 14 : 15}px">${rule.replace(/(<br\/?>)+$/, '')}</div>
      ${plan ? `<div class="pl"><b>План:</b>${plan}</div>` : ''}${c.flavor ? `<div class="fl">${esc(c.flavor)}</div>` : ''}</div></div>
      <div class="dk" style="background:${dbg};color:${dfg}">${dn}</div></div>`;
  };
  // lays the cards out like the printed card; returns { name: top of the glass plate in % of the card height }
  const layout = async (sp, html) => {
    await sp.evaluate(h => { document.getElementById('s').innerHTML = `<div class="sh">${h}</div>`; }, html);
    await sp.evaluate(() => document.fonts.ready);
    // the flavour line only if it fits: the plate must not climb above 45 % of the card
    return sp.evaluate(() => Object.fromEntries([...document.querySelectorAll('.cd')].map(cd => { const g = cd.querySelector('.gl'), f = g.querySelector('.fl'); if (f && g.offsetHeight > 420 - 40 - .45 * 420) f.remove(); const top = 420 - 40 - g.offsetHeight; g.querySelector('.bg').style.top = -top + 'px'; return [cd.dataset.name, Math.round(1000 * top / 420) / 10]; })));
  };
  let glass = {};
  if (sheet || guides) {
    const sp = await (await browser.newContext({ viewport: { width: 964, height: 888 }, deviceScaleFactor: 2 })).newPage();
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
      .dk{position:absolute;left:0;right:0;bottom:0;height:34px;font:700 13px/34px 'Alegreya SC';letter-spacing:.1em;text-align:center}</style><div id="s"></div>`);
    const groups = {};
    // --mixed: the listed cards on common sheets in the --only order (a pilot of cards from several decks)
    const mixed = args.includes('--mixed');
    for (const [name] of (mixed && only ? [...only].filter(n => have.has(n)).map(n => [n]) : list)) { const d = mixed ? 'mix' : full.get(name).deck; (groups[d] ||= []).push(name); }
    for (const [deck, names] of Object.entries(groups)) for (let i = 0; i < names.length; i += 6) {
      const part = names.slice(i, i + 6);
      Object.assign(glass, await layout(sp, part.map(name => cardHtml(name, `url(data:image/png;base64,${pngs.get(name).toString('base64')})`)).join('')));
      if (!sheet) continue;
      await sp.waitForTimeout(100);
      const el = await sp.$('.sh');
      fs.writeFileSync(path.join(out, `sheet-${deck === 'mix' ? 'mixed' : slug(DECK[deck][0])}-${i / 6 + 1}.png`), await el.screenshot());
      sheets++;
    }
    if (sheet) { // merged with an earlier file, so a partial run (--only) keeps the other cards
      const gf = path.join(out, 'glass.json'); let old = {}; try { old = JSON.parse(fs.readFileSync(gf, 'utf8')); } catch {}
      fs.writeFileSync(gf, JSON.stringify({ ...old, ...glass }, null, 1));
    }
  }
  // --guides: the review lines over the picture: y 126 (45 %), y 140 (50 %), this card's glass line, the 45 × 45 top
  // corners, the 10-unit margins and the horizon of SKEL
  if (guides) {
    fs.mkdirSync(path.join(out, 'guides'), { recursive: true });
    for (const [name] of list) {
      const gy = 2.8 * glass[name], hz = SKEL[name] && SKEL[name].horizon;
      const ln = (y, col, dash, label) => `<path d="M0 ${y}H200" stroke="${col}" stroke-width=".6" ${dash ? 'stroke-dasharray="3 2"' : ''}/><text x="196" y="${y - 1.2}" font-size="4.5" text-anchor="end" fill="${col}" font-family="monospace">${label}</text>`;
      const over = `<svg viewBox="0 0 200 280" width="200" height="280" style="position:absolute;left:0;top:0">`
        + `<rect x="10" y="10" width="180" height="260" fill="none" stroke="#ffffff" stroke-width=".4" stroke-dasharray="1.5 1.5" opacity=".8"/>`
        + `<rect x="0" y="0" width="45" height="45" fill="#ff3cdc" opacity=".18" stroke="#ff3cdc" stroke-width=".5"/><rect x="155" y="0" width="45" height="45" fill="#ff3cdc" opacity=".18" stroke="#ff3cdc" stroke-width=".5"/>`
        + ln(126, '#ffe23c', false, 'y126 45%') + ln(140, '#ff9a3c', true, 'y140 50%') + ln(gy, '#3cf0ff', false, `glass y${gy.toFixed(0)} ${glass[name]}%`)
        + (hz !== undefined ? ln(hz, '#7cff6a', true, `horizon y${hz}`) : '') + `</svg>`;
      await page.evaluate(([s, o]) => { const p = document.getElementById('p'); p.style.position = 'relative'; p.innerHTML = s + o; }, [svgs.get(name), over]);
      await page.waitForTimeout(150);
      fs.writeFileSync(path.join(out, 'guides', slug(name) + '.png'), await page.screenshot({ omitBackground: true }));
    }
  }
  // --grid: twelve close-ups of each picture, 3 × 4 cells of 66.7 × 70 units, 4 units more on every side (neighbours
  // overlap by 8, so a rope or a post broken on a seam is seen), at device scale 10
  if (grid) {
    fs.mkdirSync(path.join(out, 'grid'), { recursive: true });
    const gp = await (await browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: 10 })).newPage();
    await gp.setContent(`<style>html,body{margin:0;background:transparent}</style><div id="p" style="width:200px;height:280px"></div>`);
    for (const [name] of list) {
      await gp.evaluate(s => { document.getElementById('p').innerHTML = s; }, svgs.get(name));
      await gp.waitForTimeout(200);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const x0 = Math.max(0, c * 200 / 3 - 4), x1 = Math.min(200, (c + 1) * 200 / 3 + 4), y0 = Math.max(0, r * 70 - 4), y1 = Math.min(280, (r + 1) * 70 + 4);
        const file = `${slug(name)}-r${r + 1}c${c + 1}-x${Math.round(x0)}-${Math.round(x1)}-y${Math.round(y0)}-${Math.round(y1)}.png`;
        fs.writeFileSync(path.join(out, 'grid', file), await gp.screenshot({ clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, omitBackground: true }));
      }
    }
  }
  await browser.close();
  console.log(`${list.length} portrait pictures ${200 * sc}x${280 * sc}${sheet ? `, ${sheets} sheets, glass.json` : ''}${guides ? ', guides/' : ''}${grid ? ', grid/' : ''} -> ${out}`);
  if (missing.length) { console.error(`no portrait scene for ${missing.length}: ${missing.join(', ')}`); process.exit(1); }
}

// --skel: the skeleton instead of the scene, skel/<slug>.png: the original landscape picture as an underlay at
// SKEL.orig {k, tx, ty} (path А), the horizon, the item boxes with their id and support; prints the warnings.
async function exportSkel(browser, list, SKEL) {
  const { DEFS } = require('./scenes/art.cjs'), S = require('./scenes/specs3.cjs');
  const sc = Number(opt('--scale', '3'));
  const page = await (await browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: sc })).newPage();
  await page.setContent(`<style>html,body{margin:0;background:#fff}</style><div id="p" style="width:200px;height:280px"></div>`);
  fs.mkdirSync(path.join(out, 'skel'), { recursive: true });
  let n = 0, warned = 0;
  for (const [name] of list) {
    const sk = SKEL[name]; if (!sk) { console.log(`skel ${name}: no SKEL`); continue; }
    const u = 'k' + (n++), o = sk.orig;
    const under = o ? `<g opacity=".35" transform="translate(${o.tx} ${o.ty}) scale(${o.k})"><defs>${DEFS(u + 'o')}<clipPath id="oc${u}"><rect width="200" height="120"/></clipPath></defs><g clip-path="url(#oc${u})">${S[name](u + 'o')}</g></g>` : '';
    const cols = ['#d0203a', '#1f6fd0', '#1a9a3a', '#c06a00', '#8a2ad0', '#008a8a', '#a0a000', '#d02090'];
    const boxes = sk.items.map(([id, x, y, w, h, sup = ''], i) => { const col = cols[i % cols.length];
      return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-width=".7"/><path d="M${x} ${y}h${w}" stroke="${col}" stroke-width="1.6"/>`
        + `<text x="${x + 1.5}" y="${y - h + 5}" font-size="4.2" font-family="monospace" fill="${col}" font-weight="700">${id}</text><text x="${x + 1.5}" y="${y - 1.6}" font-size="3.4" font-family="monospace" fill="${col}">${String(sup).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`; }).join('');
    const hz = sk.horizon;
    const svg = `<svg viewBox="0 0 200 280" width="200" height="280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="#f4f2ee"/>${under}`
      + `<rect width="45" height="45" fill="#ff3cdc" opacity=".15"/><rect x="155" width="45" height="45" fill="#ff3cdc" opacity=".15"/><rect x="10" y="10" width="180" height="260" fill="none" stroke="#888" stroke-width=".4" stroke-dasharray="1.5 1.5"/>`
      + `<path d="M0 126H200" stroke="#c8a000" stroke-width=".6"/><path d="M0 140H200" stroke="#e07000" stroke-width=".5" stroke-dasharray="3 2"/>`
      + (hz !== undefined ? `<path d="M0 ${hz}H200" stroke="#0a8a0a" stroke-width=".8" stroke-dasharray="4 2"/><text x="3" y="${hz - 1.5}" font-size="4" font-family="monospace" fill="#0a8a0a">horizon y${hz} eye ${sk.eye} m · light ${sk.light || '?'}</text>` : '')
      + boxes + `</svg>`;
    await page.evaluate(s => { document.getElementById('p').innerHTML = s; }, svg);
    await page.waitForTimeout(150);
    fs.writeFileSync(path.join(out, 'skel', slug(name) + '.png'), await page.screenshot());
    const w = skelWarnings(sk); warned += w.length;
    console.log(`skel ${name}: ${w.length ? w.length + ' warning(s)' : 'ok'}`); for (const s of w) console.log('  - ' + s);
  }
  console.log(`${n} skeletons, ${warned} warnings -> ${path.join(out, 'skel')}`);
}
