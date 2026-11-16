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
//     data-frame="<frame>" (a circle: within its radius; anything else, e.g. the rect of a nest's plate: within its box),
//     a stroked outline counted with half its stroke width — the ribbon of a header, the drawing of a medallion, the flags
//     of a battle nest on the scheme (04b).
// on every sheet with a frame (a path marked data-sheet-edge: the torn edge of the chart's paper, map/chart.ts):
//   - nothing but the frame itself (the picture marked data-sheet-art, and what holds it) reaches out of that outline —
//     every element's box, its corners and the middles of its sides, lies inside it;
//   - every outer plate keeps ≥ SHEET_GAP (5 mm) of the paper from the outline.
// Used by `npm run print -- --check` (check.ts) and on its own:
//   npx vite-node tools/print/check-layout-cli.ts [-- 03-planshety 04-tryumy-zhetony 02-pamyatki]
// Exit code 1 and the element names on an error.
import fs from 'node:fs';
import path from 'node:path';
import type { Browser } from '@playwright/test';
import { HTML_DIR } from './kit';
import { MIN_STROKE } from './strokes';
import { SHEET_GAP } from './map/chart';

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
      const res: { issues: Issue[]; words: number } = await page.evaluate(({ gaps, sheetGap }) => {
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
          // the frame of the sheet: the torn edge of the paper; everything inside it, the plates SHEET_GAP from it
          const edge = sh.querySelector<SVGPathElement>('path[data-sheet-edge]');
          if (edge && edge.getAttribute('d')) {
            const em = edge.getScreenCTM(), inv = em ? DOMMatrix.fromMatrix(em).inverse() : null;
            const inside = (x: number, y: number) => { const q = new DOMPoint(o.left + x * MM, o.top + y * MM).matrixTransform(inv!); return edge.isPointInFill(new DOMPoint(q.x, q.y)); };
            const art = sh.querySelector('[data-sheet-art]');
            const nameOf = (e: Element) => { const w = e.closest('[data-name],[data-deco],[data-icon],[data-plate],[data-in]'); return (w ? (w.getAttribute('data-name') ?? w.getAttribute('data-deco') ?? w.getAttribute('data-icon') ?? w.getAttribute('data-plate') ?? w.getAttribute('data-in')) + ' — ' : '') + e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class') : ''); };
            const out = new Map<string, number>();
            for (const e of Array.from(sh.querySelectorAll('*'))) {
              if (e === edge || e === art || e.contains(edge) || (art && e.contains(art)) || e.closest('defs,clipPath,mask,pattern,symbol,marker,style,title')) continue;
              if (e instanceof SVGElement && !(e instanceof SVGGraphicsElement)) continue;
              const q = e.getBoundingClientRect(); if (q.width < 0.5 && q.height < 0.5) continue;
              const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') continue;
              const b = R(e), xs = [b.x, b.x + b.w / 2, b.x + b.w], ys = [b.y, b.y + b.h / 2, b.y + b.h];
              let worst = 0;
              for (const x of xs) for (const y of ys) if (!(x === xs[1] && y === ys[1]) && !inside(x, y)) worst++;
              if (worst) { const k = nameOf(e); out.set(k, (out.get(k) ?? 0) + 1); }
            }
            for (const [k, n] of out) issues.push({ page: si + 1, msg: `«${k}» reaches out of the sheet's frame (the torn edge)${n > 1 ? ` — ${n} elements` : ''}` });
            // the outline's points (densified) and the distance from each outer plate to them
            const L = edge.getTotalLength(), pts: { x: number; y: number }[] = [];
            for (let t = 0; t <= L; t += 0.4) { const p = edge.getPointAtLength(t), q = new DOMPoint(p.x, p.y).matrixTransform(em!); pts.push({ x: (q.x - o.left) / MM, y: (q.y - o.top) / MM }); }
            const all = [...P].filter(([, b]) => b.w > 0.01 && b.h > 0.01);
            const outer = all.filter(([k, b]) => !all.some(([k2, b2]) => k2 !== k && holds(b2, b) && !(holds(b, b2) && k2 > k)));
            for (const [k, b] of outer) {
              let d = 1e9;
              for (const p of pts) { const dx = Math.max(b.x - p.x, 0, p.x - b.x - b.w), dy = Math.max(b.y - p.y, 0, p.y - b.y - b.h); d = Math.min(d, Math.hypot(dx, dy)); }
              if (d < sheetGap - 0.05) issues.push({ page: si + 1, msg: `plate «${k}» is ${d.toFixed(2)} mm from the sheet's torn edge (need ≥ ${sheetGap})` });
            }
          }
          // the ornaments inside their frames
          const frames = new Map<string, Element>();
          for (const e of Array.from(sh.querySelectorAll('[data-frame]'))) frames.set(e.getAttribute('data-frame')!, e);
          for (const d of Array.from(sh.querySelectorAll('[data-deco]'))) {
            const k = d.getAttribute('data-deco')!, f = frames.get(k);
            if (!f) { issues.push({ page: si + 1, msg: `ornament of «${k}»: no data-frame «${k}»` }); continue; }
            const fb = R(f), circ = f instanceof SVGCircleElement;
            const cx = fb.x + fb.w / 2, cy = fb.y + fb.h / 2, rr = Math.min(fb.w, fb.h) / 2;
            const pts: { x: number; y: number; e?: Element; pad?: number }[] = [];
            const geo = [d, ...Array.from(d.querySelectorAll('*'))];
            // a clipped shape shows only where all its clips (each in the user space of the element that names it) let it
            type Clip = { shapes: SVGGeometryElement[]; inv: DOMMatrix };
            const clipsOf = (g: Element): Clip[] => {
              const cs: Clip[] = [];
              for (let a: Element | null = g; a && a !== d.parentElement; a = a.parentElement) {
                const id = (a.getAttribute('clip-path') ?? '').match(/url\(#([^)]+)\)/)?.[1], cp = id ? document.getElementById(id) : null, hm = a instanceof SVGGraphicsElement ? a.getScreenCTM() : null;
                if (cp && hm) cs.push({ shapes: Array.from(cp.querySelectorAll('*')).filter((e): e is SVGGeometryElement => e instanceof SVGGeometryElement), inv: DOMMatrix.fromMatrix(hm).inverse() });
              }
              return cs;
            };
            const shows = (q: DOMPoint, cs: Clip[]) => cs.every(c => c.shapes.some(sh => {
              const t = sh.transform.baseVal.consolidate(), lp = q.matrixTransform(t ? DOMMatrix.fromMatrix(t.matrix).inverse().multiply(c.inv) : c.inv);
              const rule = sh.getAttribute('clip-rule') ?? getComputedStyle(sh).getPropertyValue('clip-rule'), old = sh.getAttribute('fill-rule');
              if (rule) sh.setAttribute('fill-rule', rule);
              const inn = sh.isPointInFill(new DOMPoint(lp.x, lp.y));
              if (old == null) sh.removeAttribute('fill-rule'); else sh.setAttribute('fill-rule', old);
              return inn;
            }));
            const sample = (g: SVGGeometryElement, m: DOMMatrix) => {
              const cs = clipsOf(g), st = getComputedStyle(g);
              // a stroked outline reaches half its width beyond the path (in mm on the sheet)
              const pad = st.stroke !== 'none' ? (parseFloat(st.strokeWidth) || 0) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / MM / 2 : 0;
              let len = 0; try { len = g.getTotalLength(); } catch { len = 0; }
              const n = Math.max(8, Math.min(400, Math.ceil(len / 0.5)));
              for (let i = 0; i <= n; i++) {
                const p = g.getPointAtLength(len * i / n), q = new DOMPoint(p.x, p.y).matrixTransform(m);
                if (cs.length && !shows(q, cs)) continue;
                pts.push({ x: (q.x - o.left) / MM, y: (q.y - o.top) / MM, e: g, pad });
              }
            };
            for (const g of geo) {
              // only what is painted: not the shapes of defs, clip paths, masks, patterns; not unpainted shapes
              if (g.closest('defs,clipPath,mask,pattern,symbol,marker')) continue;
              const st = getComputedStyle(g);
              if (st.display === 'none' || st.visibility === 'hidden' || (st.fill === 'none' && st.stroke === 'none')) continue;
              if (g instanceof SVGGeometryElement) {
                const m = g.getScreenCTM(); if (m) sample(g, m);
              } else if (g instanceof SVGTextElement || g instanceof SVGImageElement) {
                const b = R(g); pts.push({ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x, y: b.y + b.h }, { x: b.x + b.w, y: b.y + b.h });
              }
            }
            let worst = 0, we: Element | undefined;
            for (const p of pts) {
              const out = (circ ? Math.hypot(p.x - cx, p.y - cy) - rr : Math.max(fb.x - p.x, p.x - fb.x - fb.w, fb.y - p.y, p.y - fb.y - fb.h)) + (p.pad ?? 0);
              if (out > worst) { worst = out; we = p.e; }
            }
            if (worst > 0.15) issues.push({ page: si + 1, msg: `an ornament of «${k}» (${d.getAttribute('data-name') ?? d.tagName}) runs ${worst.toFixed(2)} mm out of its frame${we ? ` (${we.outerHTML.slice(0, 90)})` : ''}` });
          }
        });
        return { issues, words };
      }, { gaps, sheetGap: SHEET_GAP });
      words += res.words;
      for (const i of res.issues) errors.push(`${file} p.${i.page}: ${i.msg}`);
    }
  } finally { await page.close(); }
  return { errors, words };
}

/** the thinnest line a copier's laser keeps (strokes.ts, tools/print/README.md): every stroke on these sheets is at least it */
export const STROKE_FILES = ['03-planshety', '04-tryumy-zhetony', '04b-skhema-boya'];
/** The stroke widths of every painted SVG shape on the sheets (vector only: the rasters are not seen), at their real size
 *  on the sheet — the width times the scale of all the transforms over it. Groups the thin ones by where they are (the
 *  nearest data-name / data-deco / data-plate / icon) so the message says what to fix. */
export async function checkStrokes(browser: Browser, files = STROKE_FILES, min = MIN_STROKE): Promise<{ errors: string[]; strokes: number; thinnest: number }> {
  const errors: string[] = []; let strokes = 0, thinnest = 99;
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  try {
    for (const file of files) {
      const f = path.join(HTML_DIR, file + '.html');
      if (!fs.existsSync(f)) { errors.push(`${file}.html is missing`); continue; }
      await page.goto('file://' + f);
      await page.evaluate(async () => { await document.fonts.ready; });
      const res = await page.evaluate((min) => {
        const MM = 96 / 25.4, bad = new Map<string, { n: number; w: number; sample: string }>(); let n = 0, thin = 99;
        Array.from(document.querySelectorAll<HTMLElement>('section.sheet')).forEach((sh, si) => {
          for (const g of Array.from(sh.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse'))) {
            if (!(g instanceof SVGGeometryElement) || g.closest('defs,clipPath,mask,pattern,symbol,marker')) continue;
            const st = getComputedStyle(g);
            if (st.stroke === 'none' || st.display === 'none' || st.visibility === 'hidden') continue;
            const sw = parseFloat(st.strokeWidth); if (!(sw > 0) || parseFloat(st.strokeOpacity) === 0) continue;
            const m = g.getScreenCTM(); if (!m) continue;
            const w = sw * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / MM; n++; thin = Math.min(thin, w);
            if (w >= min - 0.004) continue;
            const owner = g.closest('[data-name],[data-deco],[data-plate],[data-icon]');
            const where = owner ? (owner.getAttribute('data-name') ?? owner.getAttribute('data-deco') ?? owner.getAttribute('data-icon') ?? owner.getAttribute('data-plate')) : g.parentElement?.tagName ?? '?';
            const key = `p.${si + 1} ${where}`, b = bad.get(key) ?? { n: 0, w: 99, sample: '' };
            b.n++; if (w < b.w) { b.w = w; b.sample = g.outerHTML.slice(0, 110); } bad.set(key, b);
          }
        });
        return { n, thin, bad: [...bad].map(([k, v]) => `${k}: ${v.n} stroke(s) down to ${v.w.toFixed(3)} mm (${v.sample})`) };
      }, min);
      strokes += res.n; thinnest = Math.min(thinnest, res.thin);
      for (const b of res.bad) errors.push(`${file} ${b} — need ≥ ${min} mm`);
    }
  } finally { await page.close(); }
  return { errors, strokes, thinnest };
}
