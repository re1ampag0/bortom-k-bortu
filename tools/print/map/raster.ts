// The chart → one JPEG (out/print/cache/art), rasterised once per drawing and resolution: its turbulence, blur and
// displacement filters stay inside the picture, the PDF page gets a plain image (README rule: no filters in the PDF).
import fs from 'node:fs';
import path from 'node:path';
import type { Browser, Page } from '@playwright/test';
import { CACHE, fontCss, ROOT, sha1 } from '../kit';

/** Old Standard TT (the period lettering of the chart): only here, not in the PDF's fonts */
function chartFonts(): string {
  const f: string[] = [];
  for (const [w, st] of [[400, 'normal'], [400, 'italic'], [700, 'normal']] as const) for (const sub of ['latin', 'latin-ext', 'cyrillic']) {
    const file = path.join(ROOT, `node_modules/@fontsource/old-standard-tt/files/old-standard-tt-${sub}-${w}-${st}.woff2`);
    if (fs.existsSync(file)) f.push(`@font-face{font-family:'Old Standard TT';font-weight:${w};font-style:${st};src:url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')}) format('woff2')}`);
  }
  return f.join('\n');
}
let page: Page | null = null, fonts = '';
/** svg — a drawing w × h mm; dpi — its resolution. Returns the file's URL relative to an HTML page in out/print/html. */
/** the lettering of a chart in the browser: labels (data-lbl) must not overlap each other or the marked drawings (data-obst) */
export async function chartLabelIssues(browser: Browser, svg: string, w: number, h: number): Promise<string[]> {
  const pw = Math.round(w / 25.4 * 96), ph = Math.round(h / 25.4 * 96), ctx = await browser.newContext({ viewport: { width: pw, height: ph } }), p = await ctx.newPage();
  try {
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss() + chartFonts()}html,body{margin:0}svg{display:block;width:${pw}px;height:${ph}px}</style>${svg}`);
    await p.evaluate(async () => { await document.fonts.ready; });
    return await p.evaluate(() => {
      const box = (e: Element) => e.getBoundingClientRect(), out: string[] = [];
      const ls = Array.from(document.querySelectorAll('text[data-lbl]')), ob = Array.from(document.querySelectorAll('[data-obst]'));
      const meet = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      ls.forEach((a, i) => {
        for (const b of ls.slice(i + 1)) if (meet(box(a), box(b))) out.push(`«${a.getAttribute('data-lbl')}» × «${b.getAttribute('data-lbl')}»`);
        for (const b of ob) if (meet(box(a), box(b))) out.push(`«${a.getAttribute('data-lbl')}» × ${b.getAttribute('data-obst')}`);
      });
      // a label in the sea and the scale keep off the land
      const land = document.querySelector('[data-land]') as SVGGeometryElement | null, svg = land?.ownerSVGElement;
      if (land && svg) {
        const inv = svg.getScreenCTM()!.inverse();
        for (const e of Array.from(document.querySelectorAll('[data-sea]'))) {
          const q = box(e); let wet = true;
          for (let i = 0; i <= 8 && wet; i++) for (let j = 0; j <= 2 && wet; j++) { const pt = new DOMPoint(q.left + q.width * i / 8, q.top + q.height * j / 2).matrixTransform(inv); if (land.isPointInFill(pt)) wet = false; }
          if (!wet) out.push(`«${e.getAttribute('data-lbl') ?? e.getAttribute('data-obst')}» lies on land`);
        }
      }
      return out;
    });
  } finally { await ctx.close(); }
}
export async function rasterJpeg(browser: Browser, key: string, svg: string, w: number, h: number, dpi: number, quality = 0.88): Promise<{ url: string; file: string }> {
  const dir = path.join(CACHE, 'art'), file = `${key}-${sha1(svg + w + 'x' + h + '@' + dpi + 'q' + quality).slice(0, 12)}.jpg`, full = path.join(dir, file);
  fs.mkdirSync(dir, { recursive: true });
  const url = `../cache/art/${file}`;
  if (fs.existsSync(full)) return { url, file: full };
  const pw = Math.round(w / 25.4 * 96), ph = Math.round(h / 25.4 * 96), scale = dpi / 96;
  if (!page) { page = await (await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 })).newPage(); fonts = fontCss() + chartFonts(); }
  // a fresh context per scale: deviceScaleFactor is fixed per context
  const ctx = await browser.newContext({ viewport: { width: pw, height: ph }, deviceScaleFactor: scale }), p = await ctx.newPage();
  try {
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>${fonts}html,body{margin:0;background:#fff}svg{display:block;width:${pw}px;height:${ph}px}</style>${svg}`);
    await p.evaluate(async () => { await document.fonts.ready; });
    await p.waitForTimeout(60);
    fs.writeFileSync(full, await p.screenshot({ type: 'jpeg', quality: Math.round(quality * 100), clip: { x: 0, y: 0, width: pw, height: ph } }));
  } finally { await ctx.close(); }
  return { url, file: full };
}
