// Card faces exactly as in the PDF (frame of the deck, glass in the type's colour), as PNG — for the «old | new» sheets the
// user judges and for the reviewers (docs/progress/print-kit.md). Not part of the set.
//   npx vite-node tools/print/shot.ts -- --names "Анжелика,Ром для всех" --out report/print-kit/shots [--px 720]
//        [--mode compare|new|old] [--variant a|b] [--sheet name]
// compare (default) — <slug>.png: the first-round picture | the new scene (draft allowed), side by side, ≤ 1500 px wide;
// new / old — <slug>-new.png / <slug>-old.png, one card. --sheet <name> — also <name>.png: every card of the run on one sheet.
// PRINT_GLASS_CLEAR=10|20 renders a more transparent glass (art.ts); the contrast of the text is printed for each card.
import fs from 'node:fs';
import path from 'node:path';
import { HTML_DIR, data, esc, launch, makeCtx, mm, pageHtml, type Ctx, type Opts } from './kit';
import { CARD, deckSheets, seaSheets, type Item } from './layout';
import { CARD_CSS, itemFace, prepareCards, type CardKit } from './cards';
import { makeIcons } from './icons';
import { ON_GLASS, luminance } from './colors';

const args = process.argv.slice(2);
const opt = (n: string, d: string) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const names = opt('--names', '').split(',').map(s => s.trim()).filter(Boolean);
const out = path.resolve(opt('--out', 'report/print-kit/shots')), px = Number(opt('--px', '720')), mode = opt('--mode', 'compare');
const variant = opt('--variant', ''), sheet = opt('--sheet', '');
if (!names.length) { console.error('--names "Card,Card" is required'); process.exit(2); }

const itemName = (it: Item) => it.kind === 'card' || it.kind === 'legend' || it.kind === 'sea' ? it.card.name : '';
const all = [...deckSheets(data), ...seaSheets(data)].flatMap(s => s.items);
const items = names.map(n => { const it = all.find(i => itemName(i) === n); if (!it) throw new Error(`card not found: ${n}`); return it as Extract<Item, { kind: 'card' | 'legend' | 'sea' }>; });
const keyOf = (it: Item) => it.kind === 'sea' ? 'sea|' + it.card.name : it.kind === 'card' || it.kind === 'legend' ? `${it.deck}|${it.card.name}` : '';
const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const slug = (n: string) => [...n.toLowerCase()].map(c => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const opts: Opts = { glass: 'type', index: true, backs: 1, draft: false, noArt: false, draftArt: false, backShiftX: 0, backShiftY: 0, only: null, check: false, checkPdf: false, samples: false };
const browser = await launch();
const ctx: Ctx = await makeCtx(opts, browser);
await makeIcons(ctx);
const m = { glass: 'type' as const, index: true, backs: 1 as const }, keys = new Set(items.map(keyOf));
async function kitAs(v: string, draftArt: boolean): Promise<CardKit> {
  const prev = process.env.PRINT_VARIANT; if (v) process.env.PRINT_VARIANT = v; else delete process.env.PRINT_VARIANT;
  ctx.opts.draftArt = draftArt; const k = await prepareCards(ctx, m, keys);
  if (prev === undefined) delete process.env.PRINT_VARIANT; else process.env.PRINT_VARIANT = prev; return k;
}
const kOld = mode === 'new' ? null : await kitAs('old', false), kNew = mode === 'old' ? null : await kitAs(variant, true);
const lt = luminance(ON_GLASS.text);
const contrast = (k: CardKit, it: Item) => { const a = k.art.get(keyOf(it))!; return { mean: (lt + .05) / (a.glassMean + .05), p95: (lt + .05) / (a.glassP95 + .05) }; };

const W = CARD.w, H = CARD.h, GAP = 3, k = px / (W * 96 / 25.4);
const cap = (t: string) => `<div style="position:absolute;left:0;right:0;top:${mm(H + 1)};font:600 9pt/1.2 'Alegreya Sans',sans-serif;color:#e8dcc0;text-align:center">${esc(t)}</div>`;
const cell = (kit: CardKit, it: Item, x: number, label: string) => `<div style="position:absolute;left:${mm(x)};top:0;width:${mm(W)};height:${mm(H + 6)}">${itemFace(ctx, kit, it, 'left:0;top:0;')}${label ? cap(label) : ''}</div>`;
const css = CARD_CSS + `html,body{background:#2b2f33}`;
async function shoot(html: string, w: number, h: number, file: string) {
  const htmlFile = path.join(HTML_DIR, '_shot.html'); // the art URLs are relative to it
  fs.writeFileSync(htmlFile, pageHtml({ title: 'shot', css, pages: [] }).replace('</body>', `<div id="b" style="position:relative;width:${mm(w)};height:${mm(h)};background:#2b2f33">${html}</div></body>`));
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: k });
  await page.goto('file://' + htmlFile);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => undefined))); });
  await page.locator('#b').screenshot({ path: file }); await page.close(); fs.rmSync(htmlFile);
}
fs.mkdirSync(out, { recursive: true });
const cells: string[] = [];
for (const [i, it] of items.entries()) {
  const n = itemName(it), s = slug(n);
  const cn = kNew && contrast(kNew, it), co = kOld && contrast(kOld, it);
  if (mode === 'compare') {
    const html = cell(kOld!, it, 0, 'было (первый круг)') + cell(kNew!, it, W + GAP, 'стало');
    await shoot(html, 2 * W + GAP, H + 6, path.join(out, `${s}.png`));
  } else {
    const kit = (mode === 'old' ? kOld : kNew)!;
    await shoot(cell(kit, it, 0, ''), W, H, path.join(out, `${s}-${mode}.png`));
  }
  if (sheet) cells.push(mode === 'compare' ? cell(kOld!, it, i * (2 * W + 2 * GAP + 4), 'было') + cell(kNew!, it, i * (2 * W + 2 * GAP + 4) + W + GAP, 'стало') : cell((mode === 'old' ? kOld : kNew)!, it, i * (W + GAP), (cn ?? co) ? `контраст ${(cn ?? co)!.mean.toFixed(1)} : 1` : ''));
  console.log(`${n}: ${[co && `old ${co.mean.toFixed(1)}:1 (p95 ${co.p95.toFixed(1)})`, cn && `new ${cn.mean.toFixed(1)}:1 (p95 ${cn.p95.toFixed(1)})`].filter(Boolean).join(', ')}`);
}
if (sheet) { const per = mode === 'compare' ? 2 * W + 2 * GAP + 4 : W + GAP; await shoot(cells.join(''), items.length * per - GAP, H + 6, path.join(out, `${sheet}.png`)); }
await browser.close();
console.log(`→ ${path.relative(process.cwd(), out)}`);
