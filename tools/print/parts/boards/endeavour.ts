// «Индевор» — the material of its board (placeholder): the East India Company — ledger paper with ruling, yellow ochre and
// dark blue, brass instruments, a wax seal, an even formal layout. Replace this file only (see the top of frame.ts).
import type { Geo, ShipMaterial } from './frame';
import { simpleMaterial } from './paint';

/** a red wax seal with the Company's letters, in the header's free middle */
const seal = (g: Geo) => { const cx = 274, cy = 162; return `<circle cx="${cx}" cy="${cy}" r="6.4" fill="#9e2a22" stroke="#6a1610" stroke-width=".5"/><circle cx="${cx}" cy="${cy}" r="4.6" fill="none" stroke="#c9564a" stroke-width=".35"/><text x="${cx}" y="${cy + 1.4}" text-anchor="middle" font-family="Alegreya SC" font-weight="800" font-size="4" fill="#f3c9bf">EIC</text>`; void g; };
/** the ledger's ruling across the chart */
const ledger = (g: Geo) => { let d = ''; for (let y = 36; y < 170; y += 6.2) d += `M11.2 ${y.toFixed(1)}H${(g.page.w - 11.2).toFixed(1)}`; return `<path d="${d}" stroke="#9fb3cf" stroke-width=".2"/><line x1="116" y1="11.2" x2="116" y2="197" stroke="#d48a8a" stroke-width=".3"/>`; };
export const material: ShipMaterial = simpleMaterial({
  wood: { base: '#1f3556', seam: '#0f1d33', grain: '#2a4570', nails: '#c9a35a' }, band: '#9C7A2C', hair: '#e0c27a',
  sky: ['#d6dfe6', '#f3f1e8'], sea: ['#6f8ea4', '#355068'], focus: 0,
  dim: '#fdfaf0', dimOpacity: 0.87,
  chart: { paper: '#f4ecd6', line: '#c9c0a2', coast: '#e3d6b0' }, brass: { light: '#f4dc92', mid: '#c9a04a', dark: '#6a4c16' },
  note: '#fffcf2', noteLine: '#9fb3cf', pin: '#1f3556',
  extraA: seal, extraB: g => ledger(g) + seal(g),
  wreck: { water: ['#4c6476', '#1a2733'], sand: '#a99f86', sandDark: '#6a6252' }
});
