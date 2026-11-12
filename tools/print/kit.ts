// Shared pieces of the print generator: paths, the game data, embedded fonts, the page shell, rich text of the data,
// and the icon rasteriser. Every part (tools/print/parts/*.ts) builds its pages with these.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from '@playwright/test';
import type { GameData } from './layout';
import { ON_GLASS } from './colors';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const OUT = path.join(ROOT, 'out/print');
export const CACHE = path.join(OUT, 'cache');
export const HTML_DIR = path.join(OUT, 'html');
export const SAMPLES = path.join(OUT, 'obrazcy');

export const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/game-data.json'), 'utf8')) as GameData;

export interface Opts {
  glass: 'type' | 'ship';
  index: boolean;
  backs: 1 | 2 | 3;
  draft: boolean;
  noArt: boolean;
  draftArt: boolean;
  backShiftX: number;
  backShiftY: number;
  only: string[] | null;
  check: boolean;
  checkPdf: boolean;
  samples: boolean;
}
export interface PageSpec { html: string; land?: boolean }
/** One PDF: its file name (without .pdf), CSS of its own, pages; duplex — printed on both sides, flip on the long edge. */
export interface Part { file: string; title: string; css: string; pages: PageSpec[]; duplex?: boolean }
export interface Ctx {
  opts: Opts;
  browser: Browser;
  /** Rasterises a piece of HTML (its own box w × h CSS px) to a PNG in the cache; returns the URL for a page in out/print/html. */
  raster(name: string, html: string, w: number, h: number, scale?: number, css?: string): Promise<string>;
  /** Ready icons (see icons.ts): the URL for a page in out/print/html. */
  icon(name: string): string;
}

export const sha1 = (s: string | Buffer) => crypto.createHash('sha1').update(s).digest('hex');
export const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const mm = (v: number) => `${Math.round(v * 1000) / 1000}mm`;
export const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
export const dataUri = (rel: string, mime = 'image/svg+xml') => `data:${mime};base64,${fs.readFileSync(path.join(ROOT, rel)).toString('base64')}`;

// A machine whose preinstalled Chromium does not match the project's Playwright: CHROMIUM_PATH points at it
// (the cloud container: /opt/pw-browsers/chromium), as in tools/card-art/export.mjs.
export async function launch(): Promise<Browser> {
  const guess = '/opt/pw-browsers/chromium';
  const exe = process.env.CHROMIUM_PATH || (fs.existsSync(guess) && !fs.existsSync(chromium.executablePath()) ? guess : '');
  return chromium.launch(exe ? { executablePath: exe } : {});
}

// Fonts embedded from node_modules/@fontsource (base64, cyrillic + latin): the PDF must not depend on the machine.
const FONTS: [family: string, pkg: string, weight: number, style: 'normal' | 'italic'][] = [
  ['Alegreya', 'alegreya', 400, 'normal'], ['Alegreya', 'alegreya', 500, 'normal'], ['Alegreya', 'alegreya', 700, 'normal'], ['Alegreya', 'alegreya', 800, 'normal'],
  ['Alegreya', 'alegreya', 400, 'italic'], ['Alegreya', 'alegreya', 500, 'italic'],
  ['Alegreya SC', 'alegreya-sc', 400, 'normal'], ['Alegreya SC', 'alegreya-sc', 700, 'normal'], ['Alegreya SC', 'alegreya-sc', 800, 'normal'],
  ['Alegreya Sans', 'alegreya-sans', 500, 'normal'], ['Alegreya Sans', 'alegreya-sans', 700, 'normal'], ['Alegreya Sans', 'alegreya-sans', 800, 'normal']
];
const RANGE = {
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
};
let fontCache = '';
export function fontCss(): string {
  if (fontCache) return fontCache;
  const css: string[] = [];
  for (const [family, pkg, w, style] of FONTS) for (const sub of ['cyrillic', 'latin'] as const) {
    const f = path.join(ROOT, `node_modules/@fontsource/${pkg}/files/${pkg}-${sub}-${w}-${style}.woff2`);
    if (!fs.existsSync(f)) throw new Error(`font file missing: ${f} (run npm ci)`);
    css.push(`@font-face{font-family:'${family}';font-weight:${w};font-style:${style};unicode-range:${RANGE[sub]};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2')}`);
  }
  return (fontCache = css.join('\n'));
}

/** The page shell: A4 portrait sheets, .land — landscape. No filter, backdrop-filter, blurred shadows: Chromium would
 * re-rasterise them into the PDF (review-print 10). */
export const BASE_CSS = `
@page{size:210mm 297mm;margin:0}
@page land{size:297mm 210mm;margin:0}
html,body{margin:0;padding:0}
body{font-family:Alegreya,serif;font-weight:400;color:#2a1c0c;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-variant-numeric:lining-nums}
.sheet{position:relative;width:210mm;height:297mm;overflow:hidden;box-sizing:border-box;break-after:page;break-inside:avoid}
.sheet.land{width:297mm;height:210mm;page:land}
.sheet:last-child{break-after:auto}
img{display:block}
b,strong{font-weight:700}
`;
export const pageHtml = (part: Pick<Part, 'css' | 'pages' | 'title'>) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(part.title)}</title><style>${fontCss()}${BASE_CSS}${part.css}</style></head><body>${part.pages.map(p => `<section class="sheet${p.land ? ' land' : ''}">${p.html}</section>`).join('\n')}</body></html>`;

/** The Soul flask as an inline picture of text height (set by icons.ts). */
export let FLASK_INLINE = '';
export const setFlaskInline = (url: string) => { FLASK_INLINE = url; };
/**
 * Rule text of the data → HTML: keeps <b> and <br/>, «2 Души» becomes the digit, a small flask and the teal word
 * (decision 0.4). dark: on the glass (light teal), else on parchment (dark teal).
 */
export function rich(text: string, dark = false): string {
  const col = dark ? ON_GLASS.soul : '#0f6e64';
  const safe = text.replace(/<br\s*\/?>/g, '\n').replace(/<(\/?)b>/g, '\u0001$1b\u0002').replace(/</g, '&lt;').replace(/\u0001/g, '<').replace(/\u0002/g, '>').replace(/\n/g, '<br>');
  // a number stays with its word («на 1 урон», «до 2 Пороха»); «Это не Залп» is not broken
  return safe.replace(/(\d) (?=[А-ЯЁа-яё])/g, '$1\u00a0').replace(/ (—|–) /g, '\u00a0$1 ').replace(/(^|[ («>])([ВвКкСсУуОоИиАа]) (?=[А-ЯЁа-яё«<])/g, '$1$2\u00a0').replace(/Это не Залп/g, 'Это\u00a0не\u00a0Залп')
    .replace(/(?:(\d+)\s+)?(?<![А-Яа-яЁё])(Душ[а-яё]*)/g, (_, n, w) => (n ? `${n}\u00a0<img class="s-i" src="${FLASK_INLINE}" alt="">` : '') + `<span class="s-w" style="color:${col}">${w}</span>`);
}
export const RICH_CSS = `.s-i{display:inline-block;height:1.05em;width:auto;vertical-align:-0.2em;margin:0 .12em 0 0}.s-w{font-weight:700}`;

/** A context for the parts: one raster page, icons by name. */
export async function makeCtx(opts: Opts, browser: Browser): Promise<Ctx> {
  const dir = path.join(CACHE, 'icons');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const icons = new Map<string, string>();
  const ctx: Ctx = {
    opts, browser,
    async raster(name, html, w, h, scale = 6, css = '') {
      const file = `${name}-${sha1(html + css + w + 'x' + h + '@' + scale).slice(0, 10)}.png`, full = path.join(dir, file), url = `../cache/icons/${file}`;
      icons.set(name, url);
      if (fs.existsSync(full)) return url;
      const page = await (await browser.newContext({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: scale })).newPage();
      await page.setContent(`<style>${fontCss()}html,body{margin:0;background:transparent}${css}</style><div id="b" style="width:${w}px;height:${h}px;position:relative;overflow:hidden">${html}</div>`);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => undefined))); });
      await page.waitForTimeout(80);
      fs.writeFileSync(full, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } }));
      await page.context().close();
      return url;
    },
    icon(name) { const u = icons.get(name); if (!u) throw new Error(`icon ${name} is not rasterised yet`); return u; }
  };
  return ctx;
}
