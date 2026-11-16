// The lettering of the boards, sheet 04 and the memos in the browser (boards v2 task, item 1): on the built HTML pages
// (out/print/html/<file>.html) every word marked data-in="<plate>" must
//   - lie inside its plate (the element marked data-plate with that name) with ≥ 1.5 mm to spare (data-inset overrides),
//   - not touch another word, nor any other plate (cells, slots, icons, the Legend nest) unless that plate holds its own,
//   - and an HTML block must not overflow itself (scrollWidth/scrollHeight within clientWidth/clientHeight).
// Used by `npm run print -- --check` (check.ts) and on its own:
//   npx vite-node tools/print/check-layout-cli.ts [-- 03-planshety 04-tryumy-zhetony 02-pamyatki]
// Exit code 1 and the element names on an error.
import fs from 'node:fs';
import path from 'node:path';
import type { Browser } from '@playwright/test';
import { HTML_DIR } from './kit';

export const LAYOUT_FILES = ['03-planshety', '04-tryumy-zhetony', '04b-skhema-boya', '02-pamyatki'];
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
      const res: { issues: Issue[]; words: number } = await page.evaluate(() => {
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
        });
        return { issues, words };
      });
      words += res.words;
      for (const i of res.issues) errors.push(`${file} p.${i.page}: ${i.msg}`);
    }
  } finally { await page.close(); }
  return { errors, words };
}
