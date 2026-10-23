// ui-press: the table of docs/progress/ui-press.md from the JSON of measure.mjs (LABEL.json and LABEL-profile.json).
// node scripts/ui-press/table.mjs LABEL [BEFORE]   — with BEFORE: «до → после» in each cell
import {readFileSync, existsSync} from 'node:fs';
const DIR = 'docs/screenshots/ui-press/measure';
const load = (l) => JSON.parse(readFileSync(`${DIR}/${l}.json`, 'utf8'));
const prof = (l) => existsSync(`${DIR}/${l}-profile.json`) ? load(`${l}-profile`) : [];
const [label, before] = process.argv.slice(2);
const now = load(label), was = before ? load(before) : null, pNow = prof(label), pWas = before ? prof(before) : [];
const pair = (a, b, f = (x) => x.toFixed(0)) => (b === undefined ? f(a) : `${f(b)} → ${f(a)}`);
const sum = (o) => Object.values(o ?? {}).reduce((n, v) => n + v, 0);
const js = (p) => Object.entries(p?.components ?? {}).filter(([k]) => !['Shown', 'ShownLog'].includes(k)).reduce((n, [, v]) => n + v, 0);
console.log('| Сцена | До кадра, мс | Худший кадр, мс | Рендер Game, мс | Рендеров компонентов | JS компонентов, мс | Style, мс | элементов | из них принуд., мс | Layout, мс | Paint, мс |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of now) {
  const w = was?.find((x) => x.scene === r.scene);
  const rend = (x) => x.renders.reduce((n, y) => n + y.ms, 0);
  console.log(`| ${r.scene} | ${pair(r.firstFrameMs, w?.firstFrameMs)} | ${pair(r.worstFrameMs, w?.worstFrameMs)} | ${pair(rend(r), w && rend(w))} | ${pair(sum(r.count), w && sum(w.count))} | ${pair(js(pNow.find((x) => x.scene === r.scene)), w && js(pWas.find((x) => x.scene === r.scene)), (x) => x.toFixed(1))} | ${pair(r.style.ms, w?.style.ms)} | ${pair(r.style.elements, w?.style.elements)} | ${pair(r.forced.style, w?.forced.style)} | ${pair(r.layout.ms, w?.layout.ms)} | ${pair(r.paint.ms, w?.paint.ms)} |`);
}
