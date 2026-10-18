// The flame of A5 (FLAME, flameDefs of docs/mockups/a5/fx/src/template.html; ANIMATIONS.md §4 «fireWall, FLAME»): every
// tongue is three layers — dark red, orange, a white core — on a glowing bed. `live`: the shape keeps changing (SMIL) and
// the edge is torn (feTurbulence) — only with «богатые спецэффекты» and not on a phone; otherwise a still flame.

/** The gradients (and the filter) of the flames, once in the document. */
export function ensureFlameDefs(): void {
  if (typeof document === 'undefined' || document.getElementById('fxFlDefs')) return;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.id = 'fxFlDefs';
  s.setAttribute('width', '0');
  s.setAttribute('height', '0');
  s.setAttribute('aria-hidden', 'true');
  s.style.position = 'absolute';
  s.innerHTML = `<defs><linearGradient id="fxFlO" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a24"/><stop offset=".45" stop-color="#e2461c" stop-opacity=".9"/><stop offset=".8" stop-color="#9a1e0e" stop-opacity=".55"/><stop offset="1" stop-color="#4a0c06" stop-opacity="0"/></linearGradient>
<linearGradient id="fxFlM" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd27a"/><stop offset=".5" stop-color="#ff9a34" stop-opacity=".95"/><stop offset="1" stop-color="#e2461c" stop-opacity="0"/></linearGradient>
<linearGradient id="fxFlC" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#fff2b0"/><stop offset="1" stop-color="#ffc35a" stop-opacity="0"/></linearGradient>
<radialGradient id="fxFlB"><stop offset="0" stop-color="#ffb347" stop-opacity=".7"/><stop offset="1" stop-color="#ff7a24" stop-opacity="0"/></radialGradient>
<filter id="fxFlF" x="-60%" y="-40%" width="220%" height="180%"><feTurbulence type="fractalNoise" baseFrequency=".09 .18" numOctaves="2" seed="2" result="n"><animate attributeName="seed" values="1;2;3;4;5;6;7" dur=".7s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence>
<feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1.4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="d"/></feMerge></filter></defs>`;
  document.body.appendChild(s);
}

const O1 = 'M-8 0 C-9.5 -7 -5 -11 -4 -17 C-2.4 -13 -.6 -15 .4 -25 C3.6 -16 9.4 -11 8 0 Z', O2 = 'M-8 0 C-8.5 -8 -3.6 -12 -4.6 -19 C-1.6 -14 .6 -17 -.8 -26 C4.6 -17 8.6 -10 8 0 Z';
const M1 = 'M-5.4 0 C-6 -6 -2.6 -9 -1.4 -15 C.6 -10 5.8 -8 5.4 0 Z', M2 = 'M-5.4 0 C-5.4 -6.6 -1.8 -9.6 -2.2 -16 C1.4 -10.6 6 -7 5.4 0 Z';
const C1 = 'M-2.8 0 C-3 -3.6 -1 -5.6 0 -9 C1.2 -5.6 3 -3.6 2.8 0 Z', C2 = 'M-2.8 0 C-2.6 -4 -.6 -6 -.4 -10 C1.6 -6 3 -3.4 2.8 0 Z';

/** A flame `h` px tall (its base at the bottom of the svg, a little wider than the tongue). */
export function FLAME(h = 22, live = true): string {
  ensureFlameDefs();
  const r = () => (Math.random() * 0.3 + 0.55).toFixed(2);
  const path = (a: string, b: string, fill: string) => (live ? `<path d="${a}" fill="url(#${fill})"><animate attributeName="d" values="${a};${b};${a}" dur="${r()}s" repeatCount="indefinite"/></path>` : `<path d="${a}" fill="url(#${fill})"/>`);
  return `<svg width="${(h * 0.78).toFixed(1)}" height="${(h * 1.1).toFixed(1)}" viewBox="-10 -27 20 28.5" style="overflow:visible" aria-hidden="true"><ellipse cx="0" cy="-1" rx="10" ry="4.4" fill="url(#fxFlB)"/><g${live ? ' filter="url(#fxFlF)"' : ''}>${path(O1, O2, 'fxFlO')}${path(M1, M2, 'fxFlM')}${path(C1, C2, 'fxFlC')}</g></svg>`;
}
