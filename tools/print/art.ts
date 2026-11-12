// Card pictures for print: an SVG scene → one JPEG in out/print/cache/art, rasterised once.
// Baked into the JPEG (never CSS filters in the PDF page, review-print 9-10, summary 0а.7):
//   1. the print profile for a print shop's colour laser on coated matt stock (user's decision 12.11; the home-inkjet profile lifted
//      the shadows much more) — the tone curve 0→8, 32→38, 64→68, 128→130, 192→193, 255→255 and saturation +2 %;
//   2. the smoked glass under the text plate — the picture blurred, darkened to a target luminance and tinted.
// The text over it stays vector. The cache key is the scene's SVG with ids renumbered in order of appearance
// (portrait() numbers its ids by a call counter), the glass box, the tint and the size.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';
import { CACHE, ROOT, sha1, type Ctx } from './kit';
import { CARD, FACE } from './layout';

const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'tools/card-art/scenes/portrait.cjs')) as {
  portrait(name: string, opts?: { draftArt?: boolean }): string; backArt(k: string): string; SCENES: string[]; has(name: string, draftArt?: boolean): boolean;
  PRINT: Record<string, { name: string; status?: string; file: string }>;
};
export const hasScene = (name: string, draftArt = false) => P.has(name, draftArt);
export const printScenes = () => P.PRINT;
export const portraitSvg = (name: string, draftArt = false) => P.portrait(name, { draftArt });
export const backArtSvg = (k: string) => P.backArt(k);
/** The new card backs (tools/card-art/scenes/backs.cjs, three designs): the picture and where the lettering goes, in picture units. */
export interface BackSpec { svg: string; bleed?: number; ground: string; tone: 'dark' | 'light'; title: { y: number } | null; crest: { y: number; d: number } | null; letter: { y: number; size: number } | null; name: { y: number } }
let B: { back(kind: string, variant: number): BackSpec; variants?: number[] } | null = null;
try { if (fs.existsSync(path.join(ROOT, 'tools/card-art/scenes/backs.cjs'))) B = require(path.join(ROOT, 'tools/card-art/scenes/backs.cjs')); } catch (e) { console.warn('warning: backs.cjs skipped: ' + (e as Error).message); }
export const hasBacks = () => !!B;
/** The designs backs.cjs has drawn so far (its `variants`); without the file — only the first, in the old drawing. */
export const backVariants = (): (1 | 2 | 3)[] => { const v = (B?.variants ?? (B ? [1, 2, 3] : [1])).filter(n => n === 1 || n === 2 || n === 3) as (1 | 2 | 3)[]; return v.length ? v : [1]; };
export const backSpec = (kind: string, variant: number): BackSpec | null => {return {...require(path.join(ROOT,'tools/card-art/scenes/backs-pilot.cjs')).draw('pearl'), title:null,crest:null,letter:null,name:{y:260}} as any; try { return B ? B.back(kind, variant) : null; } catch (e) { console.warn(`warning: back ${kind} v${variant}: ${(e as Error).message}`); return null; } };

export const PROFILE_VERSION = 'p8';
/** The print profile's curve points (review-print 10). */
// user's decision 12.11 (evening): no lifting of the shadows and no change of colour — a print shop holds the dark tones
export const CURVE: [number, number][] = [[0, 0], [64, 64], [128, 128], [192, 192], [255, 255]];
/** Saturation of the print profile: a print shop's colour laser on coated matt stock needs almost no compensation (an inkjet at home had +5 %). */
export const PROFILE_SAT = 1;
/** The glass keeps its colour (user's decision 12.11, mock-ups V2type / V2ship): the plate is darkened to the target, then its
 *  saturation is raised by this factor — the darkness under the text is solved with it, so the contrast stays. */
export const GLASS_SAT = 1.2;
/** Target mean relative luminance under the text. The mock-ups stand at 0.007-0.016 (text 12-16 : 1); 0.02 is as dark as a
 *  laser on matt coated stock still prints without a black slab — text about 12 : 1. */
export const GLASS_TARGET = 0.02;

export interface GlassBox { top: number; tint: string }
export interface ArtInfo { url: string; file: string; dark: number; glassMean: number; glassP95: number }

export function normalizeIds(svg: string): string {
  const map = new Map<string, string>();
  for (const m of svg.matchAll(/\bid="([^"]+)"/g)) if (!map.has(m[1])) map.set(m[1], 'i' + map.size);
  return svg.replace(/\bid="([^"]+)"/g, (_, a) => `id="${map.get(a)}"`).replace(/url\(#([^)]+)\)/g, (_, a) => `url(#${map.get(a) ?? a})`).replace(/href="#([^"]+)"/g, (_, a) => `href="#${map.get(a) ?? a}"`);
}

/** Monotone cubic through the curve points → a 256-entry table. */
export function curveLut(): number[] {
  const xs = CURVE.map(p => p[0]), ys = CURVE.map(p => p[1]), n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => i === 0 ? d[0] : i === n - 1 ? d[n - 2] : (d[i - 1] + d[i]) / 2);
  return Array.from({ length: 256 }, (_, v) => {
    let i = 0; while (i < n - 2 && v > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (v - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return Math.round(Math.max(0, Math.min(255, (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1])));
  });
}

/** A flat colour after the print profile: what the JPEG holds where the scene was painted with this colour. */
export function profiled(hex: string): string {
  const lut = curveLut(), [r, g, b] = [1, 3, 5].map(i => lut[parseInt(hex.slice(i, i + 2), 16)]), y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, y + (v - y) * PROFILE_SAT))).toString(16).padStart(2, '0')).join('');
}

let page: Page | null = null;
const used = new Set<string>();
export const usedArt = () => used;

/**
 * Rasterises one picture. svg — a 200 × 280 scene (any SVG that fills its box); glass — the text plate's top in mm
 * from the card's top and its tint, or null for a picture without a plate (card backs).
 */
export async function makeArt(ctx: Ctx, key: string, svg: string, glass: GlassBox | null, bleed = 0): Promise<ArtInfo> {
  // bleed — extra picture units (of 200 × 280) beyond each edge: the raster grows with the same density
  const uw = 200 + 2 * bleed, uh = 280 + 2 * bleed, W = Math.round((ctx.opts.draft ? 400 : 1000) * uw / 200), H = Math.round((ctx.opts.draft ? 400 : 1000) * 1.4 * uh / 280), dir = path.join(CACHE, 'art');
  fs.mkdirSync(dir, { recursive: true });
  const hash = sha1([normalizeIds(svg), JSON.stringify(glass), W, PROFILE_VERSION, GLASS_TARGET, GLASS_SAT, PROFILE_SAT, CURVE.join(';')].join('|')).slice(0, 12);
  const file = `${key}-${hash}.jpg`, full = path.join(dir, file), meta = full + '.json', url = `../cache/art/${file}`;
  used.add(file); used.add(file + '.json');
  if (fs.existsSync(full) && fs.existsSync(meta)) return { url, file, ...JSON.parse(fs.readFileSync(meta, 'utf8')) };
  if (!page) {
    page = await (await ctx.browser.newContext({ viewport: { width: 200, height: 280 }, deviceScaleFactor: 5 })).newPage();
    await page.setContent(`<style>html,body{margin:0;background:#101010}#p{width:var(--w,200px);height:var(--h,280px);overflow:hidden}#p>svg{display:block;width:var(--w,200px);height:var(--h,280px)}</style><div id="p"></div>`);
  }
  if (bleed) { await page.setViewportSize({ width: Math.ceil(uw), height: Math.ceil(uh) }); await page.evaluate(([w, h]) => { document.documentElement.style.setProperty('--w', w + 'px'); document.documentElement.style.setProperty('--h', h + 'px'); }, [uw, uh]); }
  await page.evaluate(s => { document.getElementById('p')!.innerHTML = s; }, svg);
  await page.evaluate(() => Promise.all(Array.from(document.querySelectorAll('image')).map(i => (i as unknown as HTMLImageElement).decode?.().catch(() => undefined))));
  await page.waitForTimeout(150); // embedded <image> pieces decode asynchronously
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: uw, height: uh } });
  const k = W / CARD.w, g = FACE.glass;
  const box = glass && { x: Math.round(g.inset * k), y: Math.round(glass.top * k), w: Math.round((CARD.w - 2 * g.inset) * k), h: Math.round((CARD.h - g.bottom - glass.top) * k), r: g.radius * k, tint: glass.tint };
  const res = await page.evaluate(async ({ b64, W, H, box, lut, target, sat, gsat }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true })!; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, W, H);
    const id = g.getImageData(0, 0, W, H), d = id.data;
    // share of near-black (Rec.709 Y < 40) above the plate, before the profile
    const rows = box ? box.y : H; let dark = 0;
    for (let i = 0, n = rows * W * 4; i < n; i += 4) if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 40) dark++;
    // the print profile: tone curve, then saturation (PROFILE_SAT)
    for (let i = 0; i < d.length; i += 4) {
      const r = lut[d[i]], gg = lut[d[i + 1]], b = lut[d[i + 2]], y = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
      d[i] = y + (r - y) * sat; d[i + 1] = y + (gg - y) * sat; d[i + 2] = y + (b - y) * sat;
    }
    g.putImageData(id, 0, 0);
    let mean = 0, p95 = 0;
    if (box) {
      const bc = document.createElement('canvas'); bc.width = W; bc.height = H;
      const bg = bc.getContext('2d', { willReadFrequently: true })!;
      bg.drawImage(c, 0, 0); // an unblurred copy under the blur keeps the canvas edge from fading to transparent
      // blurred; the picture keeps its colour under the glass
      bg.filter = `blur(${(W * 0.0233).toFixed(1)}px)`; bg.drawImage(c, 0, 0);
      const src = bg.getImageData(box.x, box.y, box.w, box.h).data, dst = g.getImageData(box.x, box.y, box.w, box.h), o = dst.data;
      const lin = Float32Array.from({ length: 256 }, (_, v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      const tint = [1, 3, 5].map(i => parseInt(box.tint.slice(i, i + 2), 16));
      // one tint strength over the whole plate; the darkening is solved per horizontal band, so a bright sky under
      // the card's name ends as dark as calm water under the last line
      // the glass takes its hue from the tint, not from the picture (layout review 12.11: «Приказ» was blue over a blue sea, and
      // the ship's colour was lost): the blurred picture keeps its light and shade and 1 − K of its colour, K is the tint's
      // hue at the pixel's own brightness. A near-neutral tint («Жемчужина») gives a charcoal glass and is not saturated.
      const luma = (r: number, gr: number, b: number) => 0.2126 * r + 0.7152 * gr + 0.0722 * b;
      const Yt = Math.max(1, luma(tint[0], tint[1], tint[2])), ts = (Math.max(...tint) - Math.min(...tint)) / Math.max(1, ...tint);
      const K = ts < 0.3 ? 0.8 : 0.65, gs = ts < 0.3 ? 1 : gsat, hue = tint.map(v => v / Yt), FL = 6;
      const px = (i: number, f: number) => { const r = src[i] * f, gr = src[i + 1] * f, b = src[i + 2] * f, m = luma(r, gr, b) * K + FL, p = [r * (1 - K) + hue[0] * m, gr * (1 - K) + hue[1] * m, b * (1 - K) + hue[2] * m], y = luma(p[0], p[1], p[2]); return p.map(v => Math.max(0, Math.min(255, y + (v - y) * gs))); };
      const lum = (p: number[]) => 0.2126 * lin[Math.min(255, Math.round(p[0]))] + 0.7152 * lin[Math.min(255, Math.round(p[1]))] + 0.0722 * lin[Math.min(255, Math.round(p[2]))];
      const BANDS = 10, bh = box.h / BANDS, fb: number[] = [];
      for (let b = 0; b < BANDS; b++) {
        const y0 = Math.floor(b * bh), y1 = Math.min(box.h, Math.ceil((b + 1) * bh));
        const meanAt = (f: number) => { let s = 0, n = 0; for (let y = y0; y < y1; y += 2) for (let x = 0; x < box.w; x += 3) { s += lum(px((y * box.w + x) * 4, f)); n++; } return s / n; };
        let lo = 0.05, hi = 3.2; // a dark picture is lifted to the target too: no black slab
        if (meanAt(hi) > target) { for (let it = 0; it < 16; it++) { const mid = (lo + hi) / 2; if (meanAt(mid) > target) hi = mid; else lo = mid; } } else lo = hi;
        fb.push(lo);
      }
      const fAt = (y: number) => { const t = Math.max(0, Math.min(BANDS - 1, y / bh - .5)), i = Math.min(BANDS - 2, Math.floor(t)); return fb[i] + (fb[i + 1] - fb[i]) * (t - i); };
      const cap = 0.085, hist = new Uint32Array(1001); let s = 0, n = 0;
      for (let y = 0; y < box.h; y++) for (let x = 0, f = fAt(y); x < box.w; x++) {
        // rounded corners of the plate
        const cx = x < box.r ? box.r : x > box.w - box.r ? box.w - box.r : x, cy = y < box.r ? box.r : y > box.h - box.r ? box.h - box.r : y;
        if ((x - cx) ** 2 + (y - cy) ** 2 > box.r * box.r) continue;
        const i = (y * box.w + x) * 4; let p = px(i, f), L = lum(p);
        if (L > cap) { const q = (cap / L) ** 0.32; p = p.map(v => v * q); L = lum(p); } // a bright spot (moon, flash) is pressed down, not left under the letters
        o[i] = p[0]; o[i + 1] = p[1]; o[i + 2] = p[2]; s += L; n++; hist[Math.min(1000, Math.round(L * 1000))]++;
      }
      g.putImageData(dst, box.x, box.y);
      mean = s / n; let acc = 0; for (let b = 1000; b >= 0; b--) { acc += hist[b]; if (acc >= n * 0.05) { p95 = b / 1000; break; } }
    }
    return { jpeg: c.toDataURL('image/jpeg', 0.9).split(',')[1], dark: dark / (rows * W), glassMean: mean, glassP95: p95 };
  }, { b64: png.toString('base64'), W, H, box, lut: curveLut(), target: GLASS_TARGET, sat: PROFILE_SAT, gsat: GLASS_SAT });
  const info = { dark: +res.dark.toFixed(4), glassMean: +res.glassMean.toFixed(4), glassP95: +res.glassP95.toFixed(4) };
  fs.writeFileSync(full, Buffer.from(res.jpeg, 'base64')); fs.writeFileSync(meta, JSON.stringify(info));
  return { url, file, ...info };
}

/** Drops cache files no picture of this run used (only after a full build). */
export function pruneArt(): number {
  const dir = path.join(CACHE, 'art'); let n = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const f of fs.readdirSync(dir)) if (!used.has(f)) { fs.rmSync(path.join(dir, f)); n++; }
  return n;
}

/** A calm placeholder for --no-art. */
export const plainSvg = (a = '#3a4652', b = '#141a20') => `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="200" height="280" fill="url(#pl)"/></svg>`;
