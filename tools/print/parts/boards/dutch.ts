// «Летучий голландец» — the material of its board (placeholder): the sea floor — turquoise-green, wood overgrown with
// barnacles and weed, corals. Replace this file only; the interface is at the top of frame.ts, the helpers in paint.ts.
import type { Geo, ShipMaterial } from './frame';
import { rng, simpleMaterial } from './paint';

/** barnacles along the frame band and a few strands of weed up from the bottom edge */
function growth(g: Geo): string {
  const R = rng(17), out: string[] = [];
  for (let i = 0; i < 70; i++) { const side = i % 4, t = R(), x = side < 2 ? 11.2 + t * (g.page.w - 22.4) : side === 2 ? 12.4 : g.page.w - 12.4, y = side === 0 ? 12.4 : side === 1 ? 195.8 : 11.2 + t * 186; const rr = 0.5 + R() * 0.9; out.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${rr.toFixed(2)}" fill="#cfd9c8" stroke="#5c6e60" stroke-width=".2"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(rr * 0.4).toFixed(2)}" fill="#46574b"/>`); }
  for (let i = 0; i < 9; i++) { const x = 14 + R() * 180, h = 10 + R() * 18; out.push(`<path d="M${x.toFixed(1)} 171q${(R() * 6 - 3).toFixed(1)} -${(h / 2).toFixed(1)} ${(R() * 4 - 2).toFixed(1)} -${h.toFixed(1)}" fill="none" stroke="#3f7a52" stroke-width=".9" stroke-linecap="round" stroke-opacity=".8"/>`); }
  return out.join('');
}
export const material: ShipMaterial = simpleMaterial({
  wood: { base: '#24423c', seam: '#0f221e', grain: '#33584f', nails: '#7a8a70' }, band: '#2C6658', hair: '#8fc2b0',
  sky: ['#a9c4bc', '#dfe9e2'], sea: ['#3d6e66', '#173832'], focus: 0, sails: 'full',
  light: { time: 'fog', haze: 0.6, key: { type: 'sun', az: 200, el: 30, color: '#e4f2e8', power: 0.8 }, fill: { color: '#5f8f80', power: 0.5 } },
  dim: '#f9fbf3', dimOpacity: 0.88,
  chart: { paper: '#e8eadb', line: '#a9bfb2', coast: '#cbd6c0' }, brass: { light: '#e0d39a', mid: '#a89448', dark: '#4e4418' },
  note: '#fbfcf4', noteLine: '#8fb8a8', pin: '#2C6658',
  extraA: growth, extraB: growth,
  wreck: { water: ['#3a6a62', '#0f2a26'], sand: '#a6a488', sandDark: '#5e6250' }
});
