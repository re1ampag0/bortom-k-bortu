// The lettering of the boards, sheet 04 and the memos in the browser (boards v2 task, item 1): on the built HTML pages
// (out/print/html/<file>.html) every word marked data-in="<plate>" must
//   - lie inside its plate (the element marked data-plate with that name) with ≥ 1.5 mm to spare (data-inset overrides),
//   - not touch another word, nor any other plate (cells, slots, icons, the Legend nest) unless that plate holds its own,
//   - and an HTML block must not overflow itself (scrollWidth/scrollHeight within clientWidth/clientHeight);
// on the sheets of GAP_FILES (the boards and their backs) the plates themselves:
//   - two plates (data-plate, all elements of one name together) that do not hold one another keep ≥ 3 mm of the chart
//     between them, and every plate keeps ≥ 5 mm from the edge of the sheet;
// on every sheet the ornaments:
//   - every outline of an element marked data-deco="<frame>" (sampled along its path) lies inside the element marked
//     data-frame="<frame>" (a circle: within its radius; anything else: within its box) — the ribbon of a header, the
//     drawing of a medallion.
// Used by `npm run print -- --check` (check.ts) and on its own:
//   npx vite-node tools/print/check-layout-cli.ts [-- 03-planshety 04-tryumy-zhetony 02-pamyatki]
// Exit code 1 and the element names on an error.
import fs from 'node:fs';
import path from 'node:path';
import type { Browser } from '@playwright/test';
import { HTML_DIR } from './kit';

export const LAYOUT_FILES = ['03-planshety', '04-tryumy-zhetony', '04b-skhema-boya', '02-pamyatki'];
/** the sheets whose plates lie on a picture: the plates keep PLATE_GAP between them and EDGE_GAP from the sheet's edge */
export const GAP_FILES = ['03-planshety'];
export const PLATE_GAP = 3, EDGE_GAP = 5;
interface Issue { page: number; msg: string }

export async function checkSheets(browser: Browser, files = LAYOUT_FILES): Promise<{ errors: string[]; words: number }> {
  const errors: string[] = []; let words = 0;
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  try {
    for (const file of files) {
      const f = path.join(HTML_DIR, file + '.html');
      if (!fs.existsSync(f)) { errors.push(`${file}.html is missing: build it first (npm run print -- --only ${file.slice(0, 2)})`); continue; }
      await page.goto('file://' + f);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => undefined))); });
      const gaps = GAP_FILES.includes(file) ? { plate: PLATE_GAP, edge: EDGE_GAP } : null;
      const res: { issues: Issue[]; words: number } = await page.evaluate((gaps) => {
        const MM = 96 / 25.4, issues: Issue[] = []; let words = 0;
        const sheets = Array.from(document.querySelectorAll<HTMLElement>('section.sheet'));
        sheets.forEach((sh, si) => {
          const o = sh.getBoundingClientRect();
          const R = (e: Element) => { const q = e.getBoundingClientRect(); return { x: (q.left - o.left) / MM, y: (q.top - o.top) / MM, w: q.width / MM, h: q.height / MM }; };
          type B = { x: number; y: number; w: number; h: number };
          const plates = new Map<string, B[]>();
          for (const e of Array.from(sh.querySelectorAll('[data-plate]'))) { const k = e.getAttribute('data-plate')!; if (!plates.has(k)) plates.set(k, []); plates.get(k)!.push(R(e)); }
          const union = (bs: B[]): B => { const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h)); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
          const P = new Map([...plates].map(([k, v]) => [k, union(v)]));
          const meet = (a: B, b: B, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
          const holds = (a: B, b: B) => a.x <= b.x + 0.01 && a.y <= b.y + 0.01 && a.x + a.w >= b.x + b.w - 0.01 && a.y + a.h >= b.y + b.h - 0.01;
          const items = Array.from(sh.querySelectorAll('[data-in]')).map(e => ({ e, name: (e.getAttribute('data-name') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48), plate: e.getAttribute('data-in')!, b: R(e), inset: Number(e.getAttribute('data-inset') ?? 1.5) }));
          words += items.length;
          for (const t of items) {
            const p = P.get(t.plate);
            if (!p) { issues.push({ page: si + 1, msg: `«${t.name}»: no plate «${t.plate}»` }); continue; }
            const m = Math.min(t.b.x - p.x, t.b.y - p.y, p.x + p.w - t.b.x - t.b.w, p.y + p.h - t.b.y - t.b.h);
            if (m < t.inset - 0.01) issues.push({ page: si + 1, msg: `«${t.name}» is ${m.toFixed(2)} mm from the edge of «${t.plate}» (need ≥ ${t.inset})` });
            if (t.e instanceof HTMLElement && (t.e.scrollWidth > t.e.clientWidth + 1 || t.e.scrollHeight > t.e.clientHeight + 1)) issues.push({ page: si + 1, msg: `«${t.name}» overflows its box (${t.e.scrollWidth}×${t.e.scrollHeight} px in ${t.e.clientWidth}×${t.e.clientHeight})` });
            for (const [k, q] of P) if (k !== t.plate && !holds(q, p) && meet(t.b, q)) issues.push({ page: si + 1, msg: `«${t.name}» (in «${t.plate}») touches «${k}»` });
          }
          items.forEach((a, i) => { for (const b of items.slice(i + 1)) if (meet(a.b, b.b, -0.05)) issues.push({ page: si + 1, msg: `«${a.name}» touches «${b.name}»` }); });
          // the plates: the outer ones (held by no other plate) apart from each other and from the sheet's edge
          if (gaps) {
            const all = [...P].filter(([, b]) => b.w > 0.01 && b.h > 0.01);
            const outer = all.filter(([k, b]) => !all.some(([k2, b2]) => k2 !== k && holds(b2, b) && !(holds(b, b2) && k2 > k)));
            const W = o.width / MM, H = o.height / MM;
            for (const [k, b] of outer) {
              const e = Math.min(b.x, b.y, W - b.x - b.w, H - b.y - b.h);
              if (e < gaps.edge - 0.01) issues.push({ page: si + 1, msg: `plate «${k}» is ${e.toFixed(2)} mm from the edge of the sheet (need ≥ ${gaps.edge})` });
            }
            outer.forEach(([ka, a], i) => {
              for (const [kb, b] of outer.slice(i + 1)) {
                const dx = Math.max(b.x - a.x - a.w, a.x - b.x - b.w), dy = Math.max(b.y - a.y - a.h, a.y - b.y - b.h);
                const d = dx > 0 && dy > 0 ? Math.hypot(dx, dy) : Math.max(dx, dy);
                if (d < gaps.plate - 0.01) issues.push({ page: si + 1, msg: d < 0 ? `plates «${ka}» and «${kb}» overlap (${(-d).toFixed(2)} mm)` : `plates «${ka}» and «${kb}» are ${d.toFixed(2)} mm apart (need ≥ ${gaps.plate})` });
              }
            });
          }
          // the ornaments inside their frames
          const frames = new Map<string, Element>();
          for (const e of Array.from(sh.querySelectorAll('[data-frame]'))) frames.set(e.getAttribute('data-frame')!, e);
          for (const d of Array.from(sh.querySelectorAll('[data-deco]'))) {
            const k = d.getAttribute('data-deco')!, f = frames.get(k);
            if (!f) { issues.push({ page: si + 1, msg: `ornament of «${k}»: no data-frame «${k}»` }); continue; }
            const fb = R(f), circ = f instanceof SVGCircleElement;
            const cx = fb.x + fb.w / 2, cy = fb.y + fb.h / 2, rr = Math.min(fb.w, fb.h) / 2;
            const pts: { x: number; y: number }[] = [];
            const geo = [d, ...Array.from(d.querySelectorAll('*'))];
            for (const g of geo) {
              if (g instanceof SVGGeometryElement) {
                const m = g.getScreenCTM(); if (!m) continue;
                let len = 0; try { len = g.getTotalLength(); } catch { len = 0; }
                const n = Math.max(8, Math.min(400, Math.ceil(len / 0.5)));
                for (let i = 0; i <= n; i++) {
                  const p = g.getPointAtLength(len * i / n), q = new DOMPoint(p.x, p.y).matrixTransform(m);
                  pts.push({ x: (q.x - o.left) / MM, y: (q.y - o.top) / MM });
                }
              } else if (g instanceof SVGTextElement || g instanceof SVGImageElement) {
                const b = R(g); pts.push({ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x, y: b.y + b.h }, { x: b.x + b.w, y: b.y + b.h });
              }
            }
            let worst = 0;
            for (const p of pts) {
              const out = circ ? Math.hypot(p.x - cx, p.y - cy) - rr : Math.max(fb.x - p.x, p.x - fb.x - fb.w, fb.y - p.y, p.y - fb.y - fb.h);
              worst = Math.max(worst, out);
            }
            if (worst > 0.15) issues.push({ page: si + 1, msg: `an ornament of «${k}» (${d.getAttribute('data-name') ?? d.tagName}) runs ${worst.toFixed(2)} mm out of its frame` });
          }
        });
        return { issues, words };
      }, gaps);
      words += res.words;
      for (const i of res.issues) errors.push(`${file} p.${i.page}: ${i.msg}`);
    }
  } finally { await page.close(); }
  return { errors, words };
}
