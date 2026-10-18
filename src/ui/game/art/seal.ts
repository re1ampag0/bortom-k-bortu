// «Под огнём»: the red wax seal of a Volley target, pressed into its plank head (docs/mockups/a5/fx/src/fx3.js,
// TARGET_SEAL): a wax blob with a drip over the edge of the head, a pressed ring, an embossed cannon, two ribbon tails
// hanging onto the paper of the plank. One target at a time — its gradient ids are fixed.

const R1 = (n: number) => Math.round(n * 10) / 10;

export const TARGET_SEAL = (() => {
  const blob = Array.from({length: 30}, (_, i: number) => { const a = i / 30 * Math.PI * 2, r = 14.2 + Math.sin(i * 2.3) * .9 + (i % 7 === 0 ? 1.2 : 0); return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
  const cannon = `<path d="M-7.6 -1.6 L4.4 -3.2 Q6.6 -3.4 6.8 -1.4 L6.8 -.6 Q6.6 1.2 4.4 1 L-7.6 .6 Q-8.6 .4 -8.6 -.5 Q-8.6 -1.4 -7.6 -1.6 Z M6.8 -2.6 H8 V.4 H6.8 Z M-5.4 1 L1.6 1 L.6 4.2 H-4.6 Z"/><circle cx="-3.4" cy="4.6" r="2.2"/><circle cx="1" cy="4.6" r="2.2"/><path d="M-2 -2.2 V.6 M1.2 -2.6 V.8" stroke-width=".5"/>`;
  return `<svg width="44" height="62" viewBox="-22 -20 44 62" aria-hidden="true"><defs>
      <radialGradient id="pgTsW" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#e2533e"/><stop offset=".55" stop-color="#a81f17"/><stop offset="1" stop-color="#5e0e09"/></radialGradient>
      <radialGradient id="pgTsP" cx=".62" cy=".7" r=".7"><stop offset="0" stop-color="#b8271d"/><stop offset="1" stop-color="#7a140e"/></radialGradient>
      <linearGradient id="pgTsR" x1="0" x2="1"><stop offset="0" stop-color="#6e120c"/><stop offset=".45" stop-color="#b8271d"/><stop offset="1" stop-color="#7e150e"/></linearGradient></defs>
    <g class="tails"><path d="M-3 4 L-9 38 L-6 34.6 L-3.4 39 L1.6 6 Z" fill="url(#pgTsR)" stroke="#4a0a06" stroke-width=".6"/><path d="M3 4 L8.4 37 L5.4 33.8 L2.8 38.4 L-1.4 6 Z" fill="url(#pgTsR)" stroke="#4a0a06" stroke-width=".6"/>
      <path d="M-5.6 14 L-7.6 30 M5.2 14 L7 29" stroke="#e86a5a" stroke-width=".5" opacity=".6"/></g>
    <ellipse cx="1.4" cy="3" rx="15" ry="14" fill="#000" opacity=".3"/>
    <path d="${blob}" fill="url(#pgTsW)" stroke="#4a0a06" stroke-width=".7"/>
    <path d="M9.6 9.6 Q11.4 12 10.6 16.4 Q10.2 18.6 9 18.4 Q7.8 18.2 8.2 15.6 Q8.6 12.8 7.4 11 Z" fill="#9a1c15" stroke="#4a0a06" stroke-width=".5"/><ellipse cx="9.4" cy="16.6" rx=".7" ry="1.2" fill="#f08a78" opacity=".55"/>
    <circle r="10.6" fill="url(#pgTsP)"/><path d="M-7.6 -7.4 A10.6 10.6 0 0 1 7.4 -7.6" fill="none" stroke="#4a0a06" stroke-width="1.2" opacity=".75"/><path d="M-7.4 7.6 A10.6 10.6 0 0 0 7.6 7.4" fill="none" stroke="#f08a78" stroke-width="1" opacity=".7"/>
    <g transform="translate(.4 -.4) scale(1.12)"><g transform="translate(.5 .6)" fill="#ffb3a4" stroke="#ffb3a4" opacity=".6">${cannon}</g><g fill="#2e0503" stroke="#2e0503">${cannon}</g></g>
    <path d="M-11 -7 Q-6 -13 2 -13.4" fill="none" stroke="#ffb3a4" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
    ${[[-13, -4], [12, -8], [-9, 11]].map(([x, y]: number[]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#a81f17" stroke="#4a0a06" stroke-width=".3"/>`).join('')}</svg>`;
})();
