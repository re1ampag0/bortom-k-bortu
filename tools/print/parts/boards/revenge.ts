// «Месть королевы Анны» — the material of its board (placeholder): dark red and black, charred wood, forged brass, firelight.
// Replace this file only; the interface is described at the top of frame.ts, the helpers are in paint.ts.
import type { Geo, ShipMaterial } from './frame';
import { simpleMaterial } from './paint';

/** the glow of a fire from below, along the bottom edge of the frame */
const glow = (g: Geo) => `<defs><radialGradient id="${g.uid}gl" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient></defs><rect x="11.2" y="120" width="${g.page.w - 22.4}" height="77" fill="url(#${g.uid}gl)"/>`;
export const material: ShipMaterial = simpleMaterial({
  wood: { base: '#2a1512', seam: '#0d0605', grain: '#3e211b', nails: '#8a6a3a' }, band: '#8A2E1C', hair: '#c8913a',
  sky: ['#d8c2b0', '#f1e4d4'], sea: ['#6a5a56', '#33282a'], focus: 2, light: { time: 'dusk', haze: 0.4, key: { type: 'sun', az: 250, el: 18, color: '#ffc58a', power: 1 }, fill: { color: '#a07a6a', power: 0.45 } },
  dim: '#fdf6ea', dimOpacity: 0.87,
  chart: { paper: '#ecdcc0', line: '#c4a582', coast: '#d9bf98' }, brass: { light: '#e9c27a', mid: '#a8782e', dark: '#4e3010' },
  note: '#fff7ec', noteLine: '#c79a7a', pin: '#8a2e1c',
  extraA: glow, extraB: glow,
  wreck: { water: ['#4a3c3a', '#1a1213'], sand: '#9a8a72', sandDark: '#5e4e40' }
});
