// Кадры эталона для сравнения с игрой.
// Запуск из корня проекта:
//   node docs/mockups/anim/level1/capture.mjs <сцена> <мс,мс,...> <ширина>x<высота> <папка> [--rich=0] [--speed=1.6]
// Пример:
//   node docs/mockups/anim/level1/capture.mjs kraken 1200,2600,3600 1366x660 docs/screenshots/l1/ref
//   node docs/mockups/anim/level1/capture.mjs list            — список всех сцен
// Время — от загрузки страницы (показ начинается через 0,35 с).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [scene, times, size, out, ...rest] = process.argv.slice(2);
const page0 = pathToFileURL(resolve('docs/mockups/anim/level1/anim-demo.html')).href;
const browser = await chromium.launch();
if (scene === 'list') {
  const p = await browser.newPage();
  await p.goto(page0 + '?cap=plain&speed=0');
  console.log((await p.evaluate(() => window.__scenes)).join(' '));
  await browser.close();
  process.exit(0);
}
if (!scene || !times || !size || !out) {
  console.log('node docs/mockups/anim/level1/capture.mjs <сцена> <мс,мс,...> <ширина>x<высота> <папка> [--rich=0] [--speed=1.6]');
  process.exit(1);
}
const extra = rest.map((x) => '&' + x.replace(/^--/, '')).join('');
const [width, height] = size.split('x').map(Number);
mkdirSync(out, { recursive: true });
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${page0}?cap=${scene}&speed=1${extra}`);
let last = 0;
for (const t of times.split(',').map(Number)) {
  await page.waitForTimeout(t - last);
  last = t;
  const file = `${out}/ref-${scene}-${width}x${height}-${t}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
if (errors.length) console.log('ОШИБКИ СТРАНИЦЫ:', errors);
await browser.close();
