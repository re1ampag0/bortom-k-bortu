// A stand-alone sheet of the chart (A4 landscape) for looking at the drawing without a board:
//   npx vite-node tools/print/map/preview.ts -- --style pearl --dpi 110 --out report/print-kit/boards2/map.jpg
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../kit';
import { chartPoint, chartSvg, type ChartStyle } from './chart';
import { rasterJpeg } from './raster';

const args = process.argv.slice(2), opt = (n: string, d: string) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const style = opt('--style', 'plain') as ChartStyle, dpi = Number(opt('--dpi', '110')), out = opt('--out', 'out/print/obrazcy/karta.jpg');
const W = 297, H = 210;
const view = { w: W, h: H, center: [-73.5, 18.6] as [number, number], mmPerDeg: 11.2 }, at = (lon: number, lat: number) => chartPoint(view, lon, lat);
const tortuga = at(-72.8, 20.15);
const svg = chartSvg({
  style, ...view, inset: 5, seed: 11,
  roses: [{ x: 196, y: 52, r: 22 }, { x: 62, y: 172, r: 11 }],
  ships: [{ x: 156, y: 38, s: 0.9 }, { x: 228, y: 150, s: 0.8, flip: true }, { x: 98, y: 140, s: 0.7 }],
  serpent: { x: 262, y: 128, s: 0.75, flip: true }, whale: { x: 36, y: 128, s: 0.6 },
  course: [at(-76.4, 17.4), at(-75.0, 18.4), at(-74.0, 19.6), { x: tortuga.x - 5, y: tortuga.y + 2 }], cross: { x: tortuga.x + 1, y: tortuga.y },
  note: [{ x: at(-77.6, 17.0).x, y: at(-77.6, 17.0).y, text: 'здесь Пороху не жалеть', rot: -8 }],
  cartouche: { x: 18, y: 14, w: 78, h: 22 }, scale: { x: 200, y: 190 }
});
const browser = await launch();
const res = await rasterJpeg(browser, 'map-preview-' + style, svg, W, H, dpi);
await browser.close();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.copyFileSync(res.file, out);
console.log(out);
