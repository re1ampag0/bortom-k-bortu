// The number of cards in hand in the plank head (docs/mockups/a5/fx/src/fx3.js, FAN_SVG): three navy backs with a white
// compass rose, the count in a white disc.

const R1 = (n: number) => Math.round(n * 10) / 10;

export function fanSvg(n: number | string): string { const rose = Array.from({length: 8}, (_, i: number) => { const a = (i * 45 - 90) * Math.PI / 180, r = i % 2 ? 1.7 : 3, b = a + .21; return `<path d="M14 9.6 L${R1(14 + Math.cos(a) * r)} ${R1(9.6 + Math.sin(a) * r)} L${R1(14 + Math.cos(b) * .7)} ${R1(9.6 + Math.sin(b) * .7)} Z" fill="#e6ecf0"/>`; }).join('');
  const back = `<rect x="9.2" y="2.6" width="9.6" height="14" rx="1.4" fill="#22384c" stroke="#e6ecf0" stroke-width=".8"/><rect x="10.3" y="3.7" width="7.4" height="11.8" rx=".7" fill="none" stroke="#9fb4c2" stroke-width=".4" stroke-dasharray="1 .45"/><circle cx="14" cy="9.6" r="3.3" fill="none" stroke="#9fb4c2" stroke-width=".3"/>${rose}<circle cx="14" cy="9.6" r=".5" fill="#a11d17"/>`;
  return `<svg width="36" height="21" viewBox="0 0 39 23" aria-hidden="true"><g style="filter:drop-shadow(0 1px .8px rgba(0,0,0,.5))">${[-22, 0, 22].map((r) => `<g transform="rotate(${r} 14 21)">${back}</g>`).join('')}</g><g transform="translate(31 12)"><circle r="6.4" fill="#e6ecf0" stroke="#22384c" stroke-width="1.2"/><text y="3.6" text-anchor="middle" font-family="Old Standard TT,Georgia,serif" font-weight="700" font-size="10" fill="#22384c">${n}</text></g></svg>`; }
