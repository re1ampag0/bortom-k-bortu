// Review pictures of card scenes for the drawing and the checking agents (docs/tasks/print-kit.md 4.6-4.7,
// review-art 6, 16, 25). Takes draft print scenes too. Writes into --out (never into out/print/*.pdf):
//   <slug>-x5.png     the picture 1000 × 1400, as it goes to print (before the print profile)
//   <slug>-card.png   the mock-up of the printed card: text plate, medal, price, deck strip (as in the PDF)
//   <slug>-print.png  left: the tone sketch, 120 px grey; right: the card as seen at arm's length, 250 px
//   <slug>-grid.png   the picture with a 3 × 4 grid and coordinates in picture units (200 × 280)
//   <slug>-light.png  the light scheme over the picture: key arrow, local lights, skeleton boxes, horizon
//   <slug>-lint.txt   machine warnings: flat shapes, stamps, polylines, dark share, missing light scheme
//   npx vite-node tools/print/review.ts -- --only "Имя, Имя" --out report/print/agents/<batch> [--glass ship]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, data, launch, makeCtx, fontCss, BASE_CSS, type Opts } from './kit';
import { makeIcons } from './icons';
import { CARD_CSS, faceHtml, prepareCards } from './cards';
import { hasScene, portraitSvg } from './art';
import { CARD, DECKS, slug } from './layout';
const CARD_H = CARD.h;

const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'tools/card-art/scenes/portrait.cjs')) as { skelOf(name: string, o: { draftArt: boolean }): Skel | undefined; PRINT: Record<string, { light?: Light; status?: string }> };
interface Light { key?: { type?: string; az?: number; el?: number; x?: number; y?: number; color?: string }; locals?: { x: number; y: number; radius?: number; color?: string }[]; time?: string }
interface Skel { horizon?: number; eye?: number; light?: Light | string; items?: [string, number, number, number, number, string?, ...unknown[]][] }

const args = process.argv.slice(2), opt = (n: string, d: string) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const names = opt('--only', '').split(',').map(s => s.trim()).filter(Boolean), out = path.resolve(opt('--out', 'report/print/review-tmp'));
if (!names.length) { console.error('usage: review.ts -- --only "Имя, Имя" --out <dir>'); process.exit(1); }
const opts: Opts = { glass: opt('--glass', 'type') === 'ship' ? 'ship' : 'type', index: true, backs: 1, draft: false, noArt: false, draftArt: true, backShiftX: 0, backShiftY: 0, only: null, check: false, checkPdf: false, samples: false };
const keyOf = (name: string): string | null => { for (const d of DECKS) { if (data.decks[d].some(c => c.name === name) || data.legends[d].name === name) return `${d}|${name}`; } return data.sea.some(c => c.name === name) ? `sea|${name}` : null; };

fs.mkdirSync(out, { recursive: true });
const browser = await launch(), ctx = await makeCtx(opts, browser);
await makeIcons(ctx);
for (const n of names) if (!hasScene(n, true)) { console.error(`«${n}»: нет сцены (ни прежней, ни tools/card-art/scenes/print/<slug>.cjs)`); process.exit(1); }
const keys = names.map(n => { const k = keyOf(n); if (!k) { console.error(`no card named «${n}» in the data`); process.exit(1); } return k!; });
const kit = await prepareCards(ctx, { glass: opts.glass, index: true, backs: 1 }, new Set(keys));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

for (let n = 0; n < names.length; n++) {
  const name = names[n], key = keys[n], sl = slug(name), svg = portraitSvg(name, true), lint: string[] = [];
  // 1. the picture ×5 and the lint in the same page
  const pg = await (await browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: 5 })).newPage();
  await pg.setContent(`<style>html,body{margin:0;background:#101010}#p{width:200px;height:280px;overflow:hidden;position:relative}#p>svg{display:block;width:200px;height:280px}</style><div id="p">${svg}</div>`);
  await pg.waitForTimeout(250);
  const x5 = await pg.screenshot({ clip: { x: 0, y: 0, width: 200, height: 280 } });
  fs.writeFileSync(path.join(out, `${sl}-x5.png`), x5);
  lint.push(...await pg.evaluate(() => {
    const out: string[] = [], root = document.querySelector('#p svg')!, shapes = Array.from(root.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse,polygon'));
    const vis = (e: Element) => { for (let p: Element | null = e; p && p !== root; p = p.parentElement) { if (p.tagName === 'defs' || p.tagName === 'clipPath' || p.tagName === 'mask' || p.tagName === 'pattern' || p.tagName === 'symbol') return false; if (p.getAttribute('data-far') !== null) return false; } return true; };
    const flat: string[] = [], byD = new Map<string, number>(), poly: string[] = [];
    for (const e of shapes) {
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect(), x = Math.max(0, r.left), y = Math.max(0, r.top), w = Math.min(200, r.right) - x, h = Math.min(280, r.bottom) - y;
      if (w <= 0 || h <= 0) continue;
      const fill = e.getAttribute('fill') || '', op = parseFloat(e.getAttribute('opacity') || '1') * parseFloat(e.getAttribute('fill-opacity') || '1');
      const at = `x ${x.toFixed(0)}–${(x + w).toFixed(0)}, y ${y.toFixed(0)}–${(y + h).toFixed(0)}`;
      if (/^#[0-9a-f]{3,8}$/i.test(fill) && op >= .8 && w * h > 150 && w > 6 && h > 6 && !e.getAttribute('filter') && !e.closest('[filter]')) flat.push(`${fill} ${at}`);
      const d = e.getAttribute('d');
      if (d && w > 4 && h > 4) { const rel = d.replace(/^M\s*[-\d.]+[\s,]+[-\d.]+/, 'M'); byD.set(rel, (byD.get(rel) || 0) + 1); if (/(?:[Ll][-\d.\s,]+){7,}/.test(d) && !/[CcQqSsTtAa]/.test(d) && w * h > 120) poly.push(at); }
    }
    for (const f of flat.slice(0, 12)) out.push(`плоский предмет: одноцветная заливка ${f} (нужен переход по форме или пометка data-far у дальнего плана)`);
    if (flat.length > 12) out.push(`… и ещё ${flat.length - 12} плоских заливок`);
    for (const [d, k] of byD) if (k >= 3) out.push(`штамп: ${k} одинаковых контуров (${d.slice(0, 40)}…)`);
    for (const p of poly.slice(0, 6)) out.push(`ломаная: контур из одних отрезков, ${p}`);
    const big = Array.from(root.querySelectorAll('feTurbulence')).filter(t => { const f = t.closest('filter'); if (!f) return false; return Array.from(root.querySelectorAll(`[filter="url(#${f.id})"]`)).some(u => { const r = u.getBoundingClientRect(); return r.width >= 190 && r.height >= 120 && !u.closest('[clip-path]'); }); });
    if (big.length) out.push(`шум на всю картинку: ${big.length} фильтр(ов) feTurbulence на слое шире 190 ед. без clipPath предмета`);
    if (root.querySelector('text')) out.push('на картинке есть текст (<text>): букв и цифр быть не должно');
    return out;
  }));
  // 4. the grid with coordinates
  const grid = `<svg viewBox="0 0 200 280" style="position:absolute;left:0;top:0;width:200px;height:280px">${[1, 2].map(i => `<path d="M${i * 200 / 3} 0V280" stroke="#fff" stroke-width=".35" opacity=".8"/>`).join('')}${[1, 2, 3].map(i => `<path d="M0 ${i * 70}H200" stroke="#fff" stroke-width=".35" opacity=".8"/>`).join('')}`
    + `${[0, 50, 100, 150].map(x => `<text x="${x + 1}" y="4.5" font-size="4" font-family="monospace" fill="#fff" stroke="#000" stroke-width=".8" paint-order="stroke">x${x}</text>`).join('')}${[50, 100, 150, 200, 250].map(y => `<text x="1" y="${y - 1}" font-size="4" font-family="monospace" fill="#fff" stroke="#000" stroke-width=".8" paint-order="stroke">y${y}</text><path d="M0 ${y}h6" stroke="#fff" stroke-width=".4"/>`).join('')}</svg>`;
  await pg.evaluate(g => { document.getElementById('p')!.insertAdjacentHTML('beforeend', `<div id="ov">${g}</div>`); }, grid);
  const gp = await (await browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: 8 })).newPage();
  await gp.setContent(await pg.content()); await gp.waitForTimeout(250);
  fs.writeFileSync(path.join(out, `${sl}-grid.png`), await gp.screenshot({ clip: { x: 0, y: 0, width: 200, height: 280 } }));
  await gp.context().close();
  // 5. the light scheme and the skeleton
  const sk = P.skelOf(name, { draftArt: true }), light = (P.PRINT[name]?.light ?? (sk && typeof sk.light === 'object' ? sk.light : undefined)) as Light | undefined;
  if (!P.PRINT[name]) lint.push('сцена прежняя (нет файла scenes/print/<slug>.cjs)');
  if (!light) lint.push('нет схемы света light (4.4)'); if (!sk) lint.push('нет скелета skel');
  const cols = ['#ff5a6a', '#5ab0ff', '#5ae07a', '#ffb040', '#c080ff', '#40e0e0'];
  let ov = '';
  if (sk?.horizon !== undefined) ov += `<path d="M0 ${sk.horizon}H200" stroke="#7cff6a" stroke-width=".7" stroke-dasharray="4 2"/><text x="3" y="${sk.horizon - 1.5}" font-size="4" font-family="monospace" fill="#7cff6a" stroke="#000" stroke-width=".7" paint-order="stroke">horizon y${sk.horizon}${sk.eye ? ' eye ' + sk.eye + ' m' : ''}</text>`;
  for (const [i, it] of (sk?.items ?? []).entries()) { const [id, x, y, w, h, sup = ''] = it, c = cols[i % cols.length]; ov += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width=".6"/><path d="M${x} ${y}h${w}" stroke="${c}" stroke-width="1.4"/><text x="${x + 1}" y="${y - h + 4.5}" font-size="3.8" font-family="monospace" fill="${c}" stroke="#000" stroke-width=".7" paint-order="stroke">${esc(String(id))} · ${esc(String(sup))}</text>`; }
  if (light?.key) { const k = light.key, az = (k.az ?? 135) * Math.PI / 180, cx = k.x ?? 100 + 80 * Math.sin(az), cy = k.y ?? 30, dx = -Math.sin(az) * 26, dy = 12 + 14 * Math.sin((k.el ?? 30) * Math.PI / 180);
    ov += `<circle cx="${cx}" cy="${cy}" r="5" fill="${k.color ?? '#ffe9a0'}" stroke="#000" stroke-width=".5"/><path d="M${cx} ${cy}l${dx.toFixed(1)} ${dy.toFixed(1)}" stroke="#ffe23c" stroke-width="1.2" marker-end="url(#ah)"/><text x="${Math.min(150, cx + 7)}" y="${cy + 1.5}" font-size="4" font-family="monospace" fill="#ffe23c" stroke="#000" stroke-width=".7" paint-order="stroke">key ${esc(k.type ?? '')} az ${k.az ?? '?'} el ${k.el ?? '?'}</text>`; }
  for (const l of light?.locals ?? []) ov += `<circle cx="${l.x}" cy="${l.y}" r="${l.radius ?? 40}" fill="none" stroke="${l.color ?? '#ffb24a'}" stroke-width=".7" stroke-dasharray="2 2"/><circle cx="${l.x}" cy="${l.y}" r="2.2" fill="${l.color ?? '#ffb24a'}" stroke="#000" stroke-width=".4"/>`;
  await pg.evaluate(o => { document.getElementById('ov')!.innerHTML = `<svg viewBox="0 0 200 280" style="position:absolute;left:0;top:0;width:200px;height:280px"><defs><marker id="ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6z" fill="#ffe23c"/></marker></defs>${o}</svg>`; }, ov);
  await pg.waitForTimeout(100);
  fs.writeFileSync(path.join(out, `${sl}-light.png`), await pg.screenshot({ clip: { x: 0, y: 0, width: 200, height: 280 } }));
  await pg.context().close();
  // 2. the mock-up of the printed card, 3. the tone sketch and the arm's-length view
  const spec = kit.specs.get(key)!, fit = kit.fits.get(key)!, art = kit.art.get(key)!;
  if (art.dark > .3) lint.push(`тёмное: ${(art.dark * 100).toFixed(0)} % пикселей выше стекла темнее Y 40 (порог 30 %)`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}${BASE_CSS}${CARD_CSS}body{background:#2a2622}.cd{position:relative}</style></head><body><div id="c" style="display:inline-block">${faceHtml(ctx, spec, fit, art.url)}</div></body></html>`;
  const hf = path.join(ROOT, `out/print/html/_review-${process.pid}.html`); fs.writeFileSync(hf, html);
  const cp = await (await browser.newContext({ viewport: { width: 400, height: 500 }, deviceScaleFactor: 2.5 })).newPage();
  await cp.goto('file://' + hf); await cp.evaluate(() => document.fonts.ready); await cp.waitForTimeout(150);
  const cardPng = await cp.locator('.cd').screenshot();
  fs.writeFileSync(path.join(out, `${sl}-card.png`), cardPng);
  const both = await cp.evaluate(async ({ a, b }) => {
    const load = async (s: string) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
    const [pic, card] = [await load(a), await load(b)], c = document.createElement('canvas'); c.width = 120 + 16 + 250; c.height = 350; const g = c.getContext('2d')!;
    g.fillStyle = '#777'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high';
    g.filter = 'grayscale(1)'; g.drawImage(pic, 0, 0, 120, 168); g.filter = 'none'; g.drawImage(card, 136, 0, 250, 349);
    return c.toDataURL('image/png').split(',')[1];
  }, { a: x5.toString('base64'), b: cardPng.toString('base64') });
  fs.writeFileSync(path.join(out, `${sl}-print.png`), Buffer.from(both, 'base64'));
  await cp.context().close(); fs.rmSync(hf, { force: true });
  fs.writeFileSync(path.join(out, `${sl}-lint.txt`), lint.length ? lint.join('\n') + '\n' : 'предупреждений нет\n');
  console.log(`${name}: ${lint.length} предупр. → ${sl}-{x5,card,print,grid,light}.png, ${sl}-lint.txt` + (fit.over ? ' (текст не влез в стекло!)' : '') + ` · стекло с y ${((CARD_H - 10.3 - fit.h) / CARD_H * 280).toFixed(0)} ед.`);
}
await browser.close();
