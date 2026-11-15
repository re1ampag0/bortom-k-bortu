// «Чёрная жемчужина» — the material of its board (placeholder): tarred dark wood, rope, a worn sea chart, a compass.
// Replace this file only; the interface is described at the top of frame.ts, the helpers are in paint.ts.
import type { ShipMaterial } from './frame';
import { rope, simpleMaterial } from './paint';

export const material: ShipMaterial = simpleMaterial({
  wood: { base: '#2b2420', seam: '#120e0b', grain: '#3d342e', nails: '#5a5048' }, band: '#26221F', hair: '#b8893a',
  sky: ['#c9cfd2', '#eef0ea'], sea: ['#5d7880', '#2f444c'], focus: 4,
  dim: '#fdf9ec', dimOpacity: 0.87,
  chart: { paper: '#efe2c4', line: '#c7b48a', coast: '#e0cfa2' }, brass: { light: '#f2d58a', mid: '#c49a45', dark: '#6e4f1c' },
  note: '#fffaf0', noteLine: '#c9b27a', pin: '#3a3a40',
  extraA: g => rope(g.zones.col.x - 1.8, 30, g.zones.col.x - 1.8, 172, { color: '#b99a66', dark: '#4a3a24', w: 1.8 }),
  extraB: g => rope(g.zones.col.x - 1.8, 30, g.zones.col.x - 1.8, 172, { color: '#c4a676', dark: '#5a4630', w: 1.6 }),
  wreck: { water: ['#4f6b70', '#1d2c31'], sand: '#a99a7a', sandDark: '#6e6250' }
});
