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
