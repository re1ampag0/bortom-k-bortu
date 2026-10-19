/* =====================================================================================================================
   FX 3 — the Legends rebuilt (a grand entrance with the card of the Legend, then a big effect of its own), a real
   merchantman, a serious storm and Ninth wave, a new fire, a navigator's Перестроение, a gyre for «Течение».
   ===================================================================================================================== */
const BIG = __BIG__;
/* a detailed ship of the A5 manner (viewBox 120×78, bow to the left, waterline ~71); origin — the middle of the waterline */
let UID3 = 0; const uidSvg = (s) => { const n = ++UID3; return s.replace(/id="([^"]+)"/g, (m, a) => `id="${a}_u${n}"`).replace(/url\(#([^)]+)\)/g, (m, a) => `url(#${a}_u${n})`); }; const bigShip = (kind, x, y, k = 1, flip = false, extra = '') => `<g transform="translate(${R1(x)} ${R1(y)}) scale(${flip ? -k : k} ${k})" ${extra}><g transform="translate(-60 -71)">${uidSvg(BIG[kind])}</g></g>`;
function circRing(svg, x, y, r0, r1, color, d, delay = 0, w = 2){ const c = sv(svg, `<circle cx="0" cy="0" r="${r1}" fill="none" stroke="${color}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`).firstChild;
  A(c, [{transform: `translate(${x}px,${y}px) scale(${R1(r0 / r1 * 100) / 100})`, opacity: 1}, {transform: `translate(${x}px,${y}px) scale(1)`, opacity: 0}], d, delay, 'cubic-bezier(.2,.7,.3,1)'); return c; }
function motes(root, n, x0, x1, y0, y1, colors = ['#ffe9a8', '#ffd27a', '#fff6d8'], z = 34){ for(let i = 0; i < n; i++){ const m = document.createElement('i'); m.className = 'pg-mote'; m.style.zIndex = z; const s = rnd(2, 5); m.style.width = m.style.height = s + 'px'; m.style.background = colors[i % colors.length]; root.appendChild(m);
  const x = rnd(x0, x1), y = rnd(y0, y1); A(m, [{transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 0}, {opacity: 1, offset: .2}, {transform: `translate(${R1(x + rnd(-30, 30))}px,${R1(y - rnd(60, 160))}px)`, opacity: 0}], rnd(1600, 3000), rnd(0, 1600), 'ease-out'); setTimeout(() => m.remove(), 4800 / speed); } }
function goldBurst(svg, x, y, n = 40, r0 = 30, r1 = 140){ for(let i = 0; i < n; i++){ const a = i / n * Math.PI * 2 + rnd(-.1, .1), r = rnd(r0, r1); const p = sv(svg, i % 3 ? `<circle r="${R1(rnd(1.2, 2.8))}" fill="${['#fff6d8', '#ffd27a', '#e0bd62'][i % 3]}"/>` : `<path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#fff6d8"/>`).firstChild;
  A(p, [{transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1}, {transform: `translate(${R1(x + Math.cos(a) * r)}px,${R1(y + Math.sin(a) * r)}px) scale(.4)`, opacity: 0}], rnd(700, 1300), 0, 'cubic-bezier(.1,.8,.3,1)'); } }
function dur(ms){ return ms / speed; }




/* the Legend medallions in the plank heads: an engraved, embossed sign on the gold coin — dark engraving, a light
   lower edge, so it reads like struck metal */
const MEDAL = {
  'Кракен': `<path d="M8 0.6 C10.5 0.6 11.7 2.8 11.6 5.2 C11.5 7.2 10.6 8.6 9.6 9.4 L6.4 9.4 C5.4 8.6 4.5 7.2 4.4 5.2 C4.3 2.8 5.5 0.6 8 0.6 Z M4.9 6.3 L7.7 7.5 L7.2 8.7 Q5.4 8.4 4.9 6.3 Z M11.1 6.3 L8.3 7.5 L8.8 8.7 Q10.6 8.4 11.1 6.3 Z" fill-rule="evenodd" stroke-width=".15"/><path d="M5.64 7.35 L5.00 7.41 L4.47 7.41 L3.99 7.35 L3.56 7.24 L3.19 7.09 L2.87 6.90 L2.60 6.69 L2.39 6.45 L2.22 6.20 L2.10 5.92 L2.04 5.63 L2.02 5.32 L2.06 4.99 L2.16 4.65 L2.22 4.52 L2.31 4.41 L2.39 4.32 L2.48 4.26 L2.58 4.21 L2.67 4.19 L2.76 4.18 L2.84 4.19 L2.91 4.21 L2.97 4.25 L3.02 4.30 L3.05 4.38 L3.07 4.51 L3.05 4.70 L3.04 4.76 L3.03 4.81 L3.02 4.85 L3.01 4.87 L3.01 4.89 L3.00 4.91 L2.99 4.93 L2.97 4.95 L2.94 4.95 L2.90 4.94 L2.86 4.92 L2.83 4.87 L2.80 4.80 L2.78 4.71 L2.62 4.69 L2.58 4.80 L2.57 4.92 L2.58 5.04 L2.62 5.15 L2.68 5.25 L2.77 5.33 L2.88 5.39 L3.01 5.43 L3.15 5.43 L3.30 5.39 L3.43 5.32 L3.56 5.21 L3.66 5.08 L3.75 4.90 L3.84 4.60 L3.86 4.29 L3.81 3.99 L3.68 3.73 L3.49 3.50 L3.26 3.33 L2.99 3.22 L2.70 3.16 L2.40 3.17 L2.09 3.23 L1.79 3.36 L1.51 3.55 L1.26 3.81 L1.04 4.15 L0.83 4.67 L0.72 5.20 L0.70 5.74 L0.78 6.27 L0.95 6.79 L1.21 7.27 L1.55 7.71 L1.97 8.10 L2.46 8.44 L3.01 8.71 L3.63 8.91 L4.31 9.03 L5.03 9.08 L5.76 9.05 Z" stroke-width=".15"/><path d="M10.24 9.05 L10.97 9.08 L11.69 9.03 L12.37 8.91 L12.99 8.71 L13.54 8.44 L14.03 8.10 L14.45 7.71 L14.79 7.27 L15.05 6.79 L15.22 6.27 L15.30 5.74 L15.28 5.20 L15.17 4.67 L14.96 4.15 L14.74 3.81 L14.49 3.55 L14.21 3.36 L13.91 3.23 L13.60 3.17 L13.30 3.16 L13.01 3.22 L12.74 3.33 L12.51 3.50 L12.32 3.73 L12.19 3.99 L12.14 4.29 L12.16 4.60 L12.25 4.90 L12.34 5.08 L12.44 5.21 L12.57 5.32 L12.70 5.39 L12.85 5.43 L12.99 5.43 L13.12 5.39 L13.23 5.33 L13.32 5.25 L13.38 5.15 L13.42 5.04 L13.43 4.92 L13.42 4.80 L13.38 4.69 L13.22 4.71 L13.20 4.80 L13.17 4.87 L13.14 4.92 L13.10 4.94 L13.06 4.95 L13.03 4.95 L13.01 4.93 L13.00 4.91 L12.99 4.89 L12.99 4.87 L12.98 4.85 L12.97 4.81 L12.96 4.76 L12.95 4.70 L12.93 4.51 L12.95 4.38 L12.98 4.30 L13.03 4.25 L13.09 4.21 L13.16 4.19 L13.24 4.18 L13.33 4.19 L13.42 4.21 L13.52 4.26 L13.61 4.32 L13.69 4.41 L13.78 4.52 L13.84 4.65 L13.94 4.99 L13.98 5.32 L13.96 5.63 L13.90 5.92 L13.78 6.20 L13.61 6.45 L13.40 6.69 L13.13 6.90 L12.81 7.09 L12.44 7.24 L12.01 7.35 L11.53 7.41 L11.00 7.41 L10.36 7.35 Z" stroke-width=".15"/><path d="M5.79 8.13 L5.18 8.31 L4.58 8.53 L4.00 8.78 L3.46 9.05 L2.96 9.36 L2.50 9.69 L2.08 10.05 L1.72 10.45 L1.42 10.88 L1.20 11.35 L1.06 11.85 L1.02 12.37 L1.09 12.89 L1.26 13.41 L1.47 13.78 L1.72 14.07 L2.01 14.30 L2.31 14.45 L2.63 14.54 L2.94 14.57 L3.25 14.54 L3.53 14.45 L3.79 14.29 L4.00 14.08 L4.15 13.82 L4.23 13.52 L4.22 13.21 L4.14 12.90 L4.04 12.73 L3.93 12.59 L3.80 12.49 L3.66 12.42 L3.52 12.39 L3.38 12.39 L3.25 12.42 L3.14 12.47 L3.04 12.56 L2.98 12.66 L2.94 12.78 L2.94 12.90 L2.97 13.02 L3.02 13.12 L3.18 13.08 L3.17 12.98 L3.19 12.91 L3.22 12.87 L3.26 12.85 L3.29 12.85 L3.32 12.85 L3.35 12.86 L3.37 12.87 L3.39 12.90 L3.41 12.92 L3.43 12.95 L3.44 12.99 L3.46 13.04 L3.46 13.10 L3.49 13.28 L3.47 13.40 L3.42 13.48 L3.37 13.53 L3.30 13.57 L3.21 13.60 L3.10 13.61 L2.99 13.60 L2.86 13.57 L2.74 13.51 L2.63 13.43 L2.52 13.31 L2.42 13.16 L2.34 12.99 L2.26 12.66 L2.25 12.37 L2.29 12.10 L2.39 11.84 L2.54 11.58 L2.75 11.33 L3.02 11.07 L3.34 10.82 L3.72 10.59 L4.14 10.36 L4.61 10.16 L5.11 9.98 L5.64 9.81 L6.21 9.67 Z" stroke-width=".15"/><path d="M9.79 9.67 L10.36 9.81 L10.89 9.98 L11.39 10.16 L11.86 10.36 L12.28 10.59 L12.66 10.82 L12.98 11.07 L13.25 11.33 L13.46 11.58 L13.61 11.84 L13.71 12.10 L13.75 12.37 L13.74 12.66 L13.66 12.99 L13.58 13.16 L13.48 13.31 L13.37 13.43 L13.26 13.51 L13.14 13.57 L13.01 13.60 L12.90 13.61 L12.79 13.60 L12.70 13.57 L12.63 13.53 L12.58 13.48 L12.53 13.40 L12.51 13.28 L12.54 13.10 L12.54 13.04 L12.56 12.99 L12.57 12.95 L12.59 12.92 L12.61 12.90 L12.63 12.87 L12.65 12.86 L12.68 12.85 L12.71 12.85 L12.74 12.85 L12.78 12.87 L12.81 12.91 L12.83 12.98 L12.82 13.08 L12.98 13.12 L13.03 13.02 L13.06 12.90 L13.06 12.78 L13.02 12.66 L12.96 12.56 L12.86 12.47 L12.75 12.42 L12.62 12.39 L12.48 12.39 L12.34 12.42 L12.20 12.49 L12.07 12.59 L11.96 12.73 L11.86 12.90 L11.78 13.21 L11.77 13.52 L11.85 13.82 L12.00 14.08 L12.21 14.29 L12.47 14.45 L12.75 14.54 L13.06 14.57 L13.37 14.54 L13.69 14.45 L13.99 14.30 L14.28 14.07 L14.53 13.78 L14.74 13.41 L14.91 12.89 L14.98 12.37 L14.94 11.85 L14.80 11.35 L14.58 10.88 L14.28 10.45 L13.92 10.05 L13.50 9.69 L13.04 9.36 L12.54 9.05 L12.00 8.78 L11.42 8.53 L10.82 8.31 L10.21 8.13 Z" stroke-width=".15"/><path d="M6.02 8.72 L5.73 9.10 L5.43 9.51 L5.16 9.94 L4.90 10.38 L4.66 10.84 L4.46 11.31 L4.29 11.79 L4.15 12.27 L4.07 12.75 L4.03 13.24 L4.05 13.73 L4.14 14.20 L4.30 14.66 L4.53 15.08 L4.74 15.34 L4.97 15.55 L5.23 15.70 L5.50 15.80 L5.77 15.84 L6.04 15.83 L6.29 15.78 L6.52 15.67 L6.72 15.52 L6.89 15.32 L6.99 15.08 L7.03 14.81 L7.00 14.54 L6.91 14.29 L6.82 14.14 L6.71 14.02 L6.59 13.94 L6.46 13.89 L6.33 13.87 L6.20 13.88 L6.08 13.92 L5.98 13.99 L5.90 14.07 L5.85 14.18 L5.83 14.29 L5.84 14.40 L5.87 14.52 L5.92 14.62 L6.08 14.58 L6.07 14.48 L6.08 14.41 L6.11 14.36 L6.14 14.33 L6.17 14.32 L6.20 14.32 L6.22 14.33 L6.24 14.34 L6.25 14.36 L6.26 14.38 L6.27 14.40 L6.27 14.43 L6.28 14.47 L6.29 14.51 L6.32 14.67 L6.31 14.76 L6.28 14.83 L6.24 14.87 L6.19 14.89 L6.13 14.91 L6.06 14.92 L5.98 14.92 L5.89 14.90 L5.80 14.87 L5.71 14.81 L5.62 14.74 L5.54 14.64 L5.47 14.52 L5.34 14.23 L5.26 13.94 L5.23 13.63 L5.24 13.30 L5.29 12.95 L5.38 12.59 L5.51 12.21 L5.68 11.84 L5.87 11.46 L6.09 11.08 L6.34 10.71 L6.60 10.35 L6.88 10.01 L7.18 9.68 Z" stroke-width=".15"/><path d="M8.82 9.68 L9.12 10.01 L9.40 10.35 L9.66 10.71 L9.91 11.08 L10.13 11.46 L10.32 11.84 L10.49 12.21 L10.62 12.59 L10.71 12.95 L10.76 13.30 L10.77 13.63 L10.74 13.94 L10.66 14.23 L10.53 14.52 L10.46 14.64 L10.38 14.74 L10.29 14.81 L10.20 14.87 L10.11 14.90 L10.02 14.92 L9.94 14.92 L9.87 14.91 L9.81 14.89 L9.76 14.87 L9.72 14.83 L9.69 14.76 L9.68 14.67 L9.71 14.51 L9.72 14.47 L9.73 14.43 L9.73 14.40 L9.74 14.38 L9.75 14.36 L9.76 14.34 L9.78 14.33 L9.80 14.32 L9.83 14.32 L9.86 14.33 L9.89 14.36 L9.92 14.41 L9.93 14.48 L9.92 14.58 L10.08 14.62 L10.13 14.52 L10.16 14.40 L10.17 14.29 L10.15 14.18 L10.10 14.07 L10.02 13.99 L9.92 13.92 L9.80 13.88 L9.67 13.87 L9.54 13.89 L9.41 13.94 L9.29 14.02 L9.18 14.14 L9.09 14.29 L9.00 14.54 L8.97 14.81 L9.01 15.08 L9.11 15.32 L9.28 15.52 L9.48 15.67 L9.71 15.78 L9.96 15.83 L10.23 15.84 L10.50 15.80 L10.77 15.70 L11.03 15.55 L11.26 15.34 L11.47 15.08 L11.70 14.66 L11.86 14.20 L11.95 13.73 L11.97 13.24 L11.93 12.75 L11.85 12.27 L11.71 11.79 L11.54 11.31 L11.34 10.84 L11.10 10.38 L10.84 9.94 L10.57 9.51 L10.27 9.10 L9.98 8.72 Z" stroke-width=".15"/><path d="M6.80 9.13 L6.77 9.51 L6.73 9.88 L6.69 10.25 L6.66 10.62 L6.62 10.98 L6.60 11.34 L6.58 11.69 L6.57 12.04 L6.59 12.38 L6.62 12.72 L6.67 13.05 L6.75 13.38 L6.86 13.69 L7.00 13.99 L7.13 14.20 L7.28 14.37 L7.45 14.50 L7.63 14.60 L7.82 14.66 L8.01 14.68 L8.20 14.65 L8.38 14.58 L8.53 14.45 L8.64 14.30 L8.70 14.12 L8.73 13.93 L8.72 13.74 L8.67 13.54 L8.62 13.42 L8.55 13.32 L8.47 13.24 L8.38 13.18 L8.28 13.15 L8.18 13.15 L8.08 13.17 L8.00 13.22 L7.93 13.29 L7.89 13.36 L7.87 13.45 L7.87 13.54 L7.89 13.63 L7.92 13.71 L8.08 13.69 L8.08 13.61 L8.10 13.56 L8.12 13.52 L8.14 13.51 L8.16 13.51 L8.17 13.52 L8.17 13.53 L8.16 13.54 L8.15 13.56 L8.14 13.57 L8.13 13.58 L8.13 13.59 L8.13 13.62 L8.13 13.66 L8.14 13.79 L8.13 13.88 L8.11 13.94 L8.08 13.96 L8.06 13.97 L8.05 13.96 L8.05 13.95 L8.04 13.94 L8.02 13.92 L7.99 13.90 L7.95 13.86 L7.90 13.80 L7.85 13.71 L7.80 13.61 L7.71 13.38 L7.65 13.14 L7.61 12.90 L7.59 12.63 L7.59 12.36 L7.60 12.06 L7.62 11.76 L7.66 11.44 L7.71 11.11 L7.76 10.76 L7.82 10.40 L7.88 10.03 L7.94 9.66 L8.00 9.27 Z" stroke-width=".15"/><path d="M8.00 9.27 L8.06 9.66 L8.12 10.03 L8.18 10.40 L8.24 10.76 L8.29 11.11 L8.34 11.44 L8.38 11.76 L8.40 12.06 L8.41 12.36 L8.41 12.63 L8.39 12.90 L8.35 13.14 L8.29 13.38 L8.20 13.61 L8.15 13.71 L8.10 13.80 L8.05 13.86 L8.01 13.90 L7.98 13.92 L7.96 13.94 L7.95 13.95 L7.95 13.96 L7.94 13.97 L7.92 13.96 L7.89 13.94 L7.87 13.88 L7.86 13.79 L7.87 13.66 L7.87 13.62 L7.87 13.59 L7.87 13.58 L7.86 13.57 L7.85 13.56 L7.84 13.54 L7.83 13.53 L7.83 13.52 L7.84 13.51 L7.86 13.51 L7.88 13.52 L7.90 13.56 L7.92 13.61 L7.92 13.69 L8.08 13.71 L8.11 13.63 L8.13 13.54 L8.13 13.45 L8.11 13.36 L8.07 13.29 L8.00 13.22 L7.92 13.17 L7.82 13.15 L7.72 13.15 L7.62 13.18 L7.53 13.24 L7.45 13.32 L7.38 13.42 L7.33 13.54 L7.28 13.74 L7.27 13.93 L7.30 14.12 L7.36 14.30 L7.47 14.45 L7.62 14.58 L7.80 14.65 L7.99 14.68 L8.18 14.66 L8.37 14.60 L8.55 14.50 L8.72 14.37 L8.87 14.20 L9.00 13.99 L9.14 13.69 L9.25 13.38 L9.33 13.05 L9.38 12.72 L9.41 12.38 L9.43 12.04 L9.42 11.69 L9.40 11.34 L9.38 10.98 L9.34 10.62 L9.31 10.25 L9.27 9.88 L9.23 9.51 L9.20 9.13 Z" stroke-width=".15"/>`,
  'Армада Компании': `<path d="M8 .4 L1.2 10.4 M8 .4 L15.2 9.4 M4 2.4 L.8 10.6 M12 2.6 L15.6 9.8 M8 .4 L4 2.4 M8 .4 L12 2.6" stroke-width=".22" fill="none" opacity=".75"/><path d="M2.69 4.2 Q4 3.75 5.31 4.2 Q5.81 5.05 5.34 5.9 Q4 6.25 2.66 5.9 Q2.19 5.05 2.69 4.2 Z M2.53 6.4 Q4 5.95 5.47 6.4 Q5.97 7.35 5.5 8.3 Q4 8.65 2.5 8.3 Q2.03 7.35 2.53 6.4 Z M2.37 8.8 Q4 8.35 5.63 8.8 Q6.13 9.7 5.66 10.6 Q4 10.95 2.34 10.6 Q1.87 9.7 2.37 8.8 Z M6.28 2.2 Q8 1.75 9.72 2.2 Q10.22 3.2 9.76 4.2 Q8 4.55 6.24 4.2 Q5.78 3.2 6.28 2.2 Z M6.07 4.7 Q8 4.25 9.93 4.7 Q10.43 5.8 9.97 6.9 Q8 7.25 6.03 6.9 Q5.57 5.8 6.07 4.7 Z M5.86 7.4 Q8 6.95 10.14 7.4 Q10.64 8.45 10.18 9.5 Q8 9.85 5.82 9.5 Q5.36 8.45 5.86 7.4 Z M10.77 4.4 Q12 3.95 13.23 4.4 Q13.73 5.2 13.25 6 Q12 6.35 10.75 6 Q10.27 5.2 10.77 4.4 Z M10.62 6.5 Q12 6.05 13.38 6.5 Q13.88 7.4 13.41 8.3 Q12 8.65 10.59 8.3 Q10.12 7.4 10.62 6.5 Z M10.47 8.8 Q12 8.35 13.53 8.8 Q14.03 9.65 13.56 10.5 Q12 10.85 10.44 10.5 Q9.97 9.65 10.47 8.8 Z " stroke-width=".15"/><path d="M3.08 4.85 Q4 5.13 4.92 4.85 M2.97 7.12 Q4 7.45 5.03 7.12 M2.86 9.48 Q4 9.79 5.14 9.48 M6.79 2.96 Q8 3.3 9.21 2.96 M6.65 5.54 Q8 5.91 9.35 5.54 M6.5 8.2 Q8 8.55 9.5 8.2 M11.14 5.01 Q12 5.28 12.86 5.01 M11.03 7.18 Q12 7.49 12.97 7.18 M10.93 9.45 Q12 9.74 13.07 9.45 " fill="none" stroke="#fff3c4" stroke-width=".28" opacity=".7"/><path d="M4 2.4 V4.2 M8 .2 V2.2 M12 2.6 V4.4" stroke-width=".5" fill="none"/><path d="M7.6 1.4 H8.4 V1.9 H7.6 Z" stroke-width=".1"/><path d="M8 .3 L11.2 .7 Q10.6 1 11.2 1.3 L8 1.6 Z" stroke-width=".1"/><path d="M8.2 .95 H10.6 M9.3 .45 V1.45" stroke="#fff3c4" stroke-width=".25"/><path d="M4 2.5 L5.8 2.8 L4 3.1 Z M12 2.7 L13.8 3 L12 3.3 Z" stroke-width=".1"/><path d="M.6 9.8 H2.8 V10.8 H14.2 Q15.4 10.8 15 11.6 L13.4 13.6 Q8 14.8 2.6 13.6 L1 11.8 Q.4 10.6 .6 9.8 Z" stroke-width=".15"/><path d="M14.6 11 L16.8 8.8" stroke-width=".55" fill="none" stroke-linecap="round"/><path d="M15.2 11.4 L16.3 11.8 L15.6 12.4 Z" stroke-width=".1"/><rect x="3.6" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="5" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="6.4" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="7.8" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="9.2" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="10.6" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="12" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="13.4" y="11.55" width=".75" height=".65" rx=".1" fill="#fff3c4" stroke="none"/><rect x="1.1" y="10.25" width=".35" height=".45" fill="#e8c76a" stroke="none"/><rect x="1.7" y="10.25" width=".35" height=".45" fill="#e8c76a" stroke="none"/><rect x="2.3" y="10.25" width=".35" height=".45" fill="#e8c76a" stroke="none"/><path d="M2.8 12.9 Q8 13.7 13.6 12.9" stroke="#e8c76a" stroke-width=".35" fill="none" opacity=".9"/><path d="M2.4 11 H14.4" stroke="#e8c76a" stroke-width=".25" fill="none" opacity=".7"/><path d="M-.4 15.3 Q1.2 14.3 2.8 15.3 T6 15.3 T9.2 15.3 T12.4 15.3 T15.6 15.3 T18.8 15.3" fill="none" stroke-width=".8"/><path d="M14 14.2 q1 -.8 2 -.1 M1.6 14.4 q.8 -.6 1.6 0" fill="none" stroke="#fff3c4" stroke-width=".35" opacity=".8"/>`,
  'Корабль в бутылке': `<g transform="rotate(-14 8 8.4)"><path d="M1 6.4 Q1 4.4 3 4.4 H8.6 Q10.4 4.4 11.2 5.9 L11.6 6.7 H13.8 Q14.4 6.7 14.4 7.3 V8.7 Q14.4 9.3 13.8 9.3 H11.6 L11.2 10.1 Q10.4 11.6 8.6 11.6 H3 Q1 11.6 1 9.6 Z" stroke-width=".15"/><path d="M1.9 6.5 Q1.9 5.3 3.1 5.3 H8.5 Q9.8 5.3 10.4 6.4 L10.8 7.3 V8.7 L10.4 9.6 Q9.8 10.7 8.5 10.7 H3.1 Q1.9 10.7 1.9 9.5 Z" fill="#fff3c4" stroke="none" opacity=".22"/><path d="M1.9 9.2 Q3 8.6 4.2 9.2 T6.6 9.2 T9 9.2 T11 9.2 V10 Q9.8 10.7 8.5 10.7 H3.1 Q1.9 10.7 1.9 9.5 Z" fill="#fff3c4" stroke="none" opacity=".5"/><path d="M3.5 8.5 H8.9 L8.3 9.3 Q6.1 9.55 3.9 9.3 Z" fill="#fff3c4" stroke="none"/><path d="M4.17 5.15 Q4.82 5.53 4.17 5.9 H5.22 Q5.47 5.53 5.22 5.15 Z" fill="#fff3c4" stroke="none"/><path d="M4.08 6.01 Q4.82 6.44 4.08 6.86 H5.31 Q5.56 6.44 5.31 6.01 Z" fill="#fff3c4" stroke="none"/><path d="M3.99 6.97 Q4.82 7.35 3.99 7.72 H5.4 Q5.65 7.35 5.4 6.97 Z" fill="#fff3c4" stroke="none"/><path d="M5.57 4.25 Q6.22 4.7 5.57 5.15 H6.62 Q6.88 4.7 6.62 4.25 Z" fill="#fff3c4" stroke="none"/><path d="M5.48 5.26 Q6.22 5.76 5.48 6.26 H6.71 Q6.96 5.76 6.71 5.26 Z" fill="#fff3c4" stroke="none"/><path d="M5.39 6.37 Q6.22 6.82 5.39 7.27 H6.8 Q7.05 6.82 6.8 6.37 Z" fill="#fff3c4" stroke="none"/><path d="M6.97 5.25 Q7.62 5.6 6.97 5.95 H8.03 Q8.28 5.6 8.03 5.25 Z" fill="#fff3c4" stroke="none"/><path d="M6.88 6.06 Q7.62 6.46 6.88 6.86 H8.12 Q8.37 6.46 8.12 6.06 Z" fill="#fff3c4" stroke="none"/><path d="M6.79 6.97 Q7.62 7.32 6.79 7.67 H8.21 Q8.46 7.32 8.21 6.97 Z" fill="#fff3c4" stroke="none"/><path d="M8.8 8.4 L9.9 7.5" stroke="#fff3c4" stroke-width="0.17" fill="none"/><path d="M6.1 4.1 L6.9 4.3 L6.1 4.5 Z" fill="#fff3c4" stroke="none"/><path d="M2.4 5.7 H8.2" stroke="#fff3c4" stroke-width=".5" stroke-linecap="round" opacity=".85" fill="none"/><path d="M12 7.3 V8.7" stroke="#fff3c4" stroke-width=".35" opacity=".7"/><path d="M14.4 6.9 H15.9 V9.1 H14.4 Z" stroke-width=".15"/><path d="M14.6 7.4 H15.7 M14.6 8.1 H15.7 M14.6 8.7 H15.7" stroke="#e8c76a" stroke-width=".22"/><path d="M15.9 6.7 Q17 7.2 16.8 8 Q17 8.8 15.9 9.3 Z" fill="#a11d17" stroke="#5c0f0b" stroke-width=".15"/></g><path d="M-.6 13.2 Q.8 11.9 2.4 12.5 Q3.2 12.9 2.6 13.4 Q4.6 12.2 6.6 13.2 T10.6 13.2 Q12 12 13.6 12.6 Q14.4 13 13.8 13.5 Q15.4 12.6 16.8 13.2" fill="none" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 15.3 Q2.8 14.3 4.6 15.3 T8.2 15.3 T11.8 15.3 T15.4 15.3" fill="none" stroke-width=".7" stroke-linecap="round" opacity=".85"/><path d="M3.6 11.8 l.4 -.9 M12.4 11.7 l.5 -.8" stroke-width=".4" stroke-linecap="round"/><path d="M13.6 1.4 L14 .3 L14.4 1.4 L15.5 1.8 L14.4 2.2 L14 3.3 L13.6 2.2 L12.5 1.8 Z" fill="#e8c76a" stroke="none"/><path d="M1.6 2.6 L1.85 2 L2.1 2.6 L2.7 2.85 L2.1 3.1 L1.85 3.7 L1.6 3.1 L1 2.85 Z" fill="#e8c76a" stroke="none"/>`,
  'Джек ускользает': `<path d="M0.4 8 A7.6 7.6 0 1 0 15.6 8 A7.6 7.6 0 1 0 0.4 8 Z M1.5 8 A6.5 6.5 0 1 0 14.5 8 A6.5 6.5 0 1 0 1.5 8 Z" fill-rule="evenodd" stroke-width=".1"/><path d="M14.55 8 L15.4 8 M14.42 9.28 L14.91 9.38 M14.05 10.51 L14.84 10.83 M13.45 11.64 L13.86 11.92 M12.63 12.63 L13.23 13.23 M11.64 13.45 L11.92 13.86 M10.51 14.05 L10.83 14.84 M9.28 14.42 L9.38 14.91 M8 14.55 L8 15.4 M6.72 14.42 L6.62 14.91 M5.49 14.05 L5.17 14.84 M4.36 13.45 L4.08 13.86 M3.37 12.63 L2.77 13.23 M2.55 11.64 L2.14 11.92 M1.95 10.51 L1.16 10.83 M1.58 9.28 L1.09 9.38 M1.45 8 L0.6 8 M1.58 6.72 L1.09 6.62 M1.95 5.49 L1.16 5.17 M2.55 4.36 L2.14 4.08 M3.37 3.37 L2.77 2.77 M4.36 2.55 L4.08 2.14 M5.49 1.95 L5.17 1.16 M6.72 1.58 L6.62 1.09 M8 1.45 L8 0.6 M9.28 1.58 L9.38 1.09 M10.51 1.95 L10.83 1.16 M11.64 2.55 L11.92 2.14 M12.63 3.37 L13.23 2.77 M13.45 4.36 L13.86 4.08 M14.05 5.49 L14.84 5.17 M14.42 6.72 L14.91 6.62 " stroke="#fff3c4" stroke-width=".35" fill="none" opacity=".85"/><circle cx="8" cy="8" r="3.1" fill="none" stroke-width=".35"/><path d="M8 8 L7.6 7.83 L9 5.59 Z M8 8 L9 5.59 L8.4 8.17 Z" stroke-width=".08"/><path d="M8 8 L9 5.59 L8.4 8.17 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L7.83 7.6 L10.41 7 Z M8 8 L10.41 7 L8.17 8.4 Z" stroke-width=".08"/><path d="M8 8 L10.41 7 L8.17 8.4 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L8.17 7.6 L10.41 9 Z M8 8 L10.41 9 L7.83 8.4 Z" stroke-width=".08"/><path d="M8 8 L10.41 9 L7.83 8.4 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L8.4 7.83 L9 10.41 Z M8 8 L9 10.41 L7.6 8.17 Z" stroke-width=".08"/><path d="M8 8 L9 10.41 L7.6 8.17 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L8.4 8.17 L7 10.41 Z M8 8 L7 10.41 L7.6 7.83 Z" stroke-width=".08"/><path d="M8 8 L7 10.41 L7.6 7.83 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L8.17 8.4 L5.59 9 Z M8 8 L5.59 9 L7.83 7.6 Z" stroke-width=".08"/><path d="M8 8 L5.59 9 L7.83 7.6 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L7.83 8.4 L5.59 7 Z M8 8 L5.59 7 L8.17 7.6 Z" stroke-width=".08"/><path d="M8 8 L5.59 7 L8.17 7.6 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L7.6 8.17 L7 5.59 Z M8 8 L7 5.59 L8.4 7.83 Z" stroke-width=".08"/><path d="M8 8 L7 5.59 L8.4 7.83 Z" fill="#e8c76a" stroke="none" opacity=".6"/><path d="M8 8 L7.47 7.47 L10.89 5.11 Z M8 8 L10.89 5.11 L8.53 8.53 Z" stroke-width=".08"/><path d="M8 8 L10.89 5.11 L8.53 8.53 Z" fill="#e8c76a" stroke="none" opacity=".8"/><path d="M8 8 L8.53 7.47 L10.89 10.89 Z M8 8 L10.89 10.89 L7.47 8.53 Z" stroke-width=".08"/><path d="M8 8 L10.89 10.89 L7.47 8.53 Z" fill="#e8c76a" stroke="none" opacity=".8"/><path d="M8 8 L8.53 8.53 L5.11 10.89 Z M8 8 L5.11 10.89 L7.47 7.47 Z" stroke-width=".08"/><path d="M8 8 L5.11 10.89 L7.47 7.47 Z" fill="#e8c76a" stroke="none" opacity=".8"/><path d="M8 8 L7.47 8.53 L5.11 5.11 Z M8 8 L5.11 5.11 L8.53 7.47 Z" stroke-width=".08"/><path d="M8 8 L5.11 5.11 L8.53 7.47 Z" fill="#e8c76a" stroke="none" opacity=".8"/><path d="M8 8 L6.95 8 L8 1.8 Z M8 8 L8 1.8 L9.05 8 Z" stroke-width=".08"/><path d="M8 8 L8 1.8 L9.05 8 Z" fill="#fff3c4" stroke="none" opacity=".9"/><path d="M8 8 L8 6.95 L14.2 8 Z M8 8 L14.2 8 L8 9.05 Z" stroke-width=".08"/><path d="M8 8 L14.2 8 L8 9.05 Z" fill="#fff3c4" stroke="none" opacity=".9"/><path d="M8 8 L9.05 8 L8 14.2 Z M8 8 L8 14.2 L6.95 8 Z" stroke-width=".08"/><path d="M8 8 L8 14.2 L6.95 8 Z" fill="#fff3c4" stroke="none" opacity=".9"/><path d="M8 8 L8 9.05 L1.8 8 Z M8 8 L1.8 8 L8 6.95 Z" stroke-width=".08"/><path d="M8 8 L1.8 8 L8 6.95 Z" fill="#fff3c4" stroke="none" opacity=".9"/><path d="M8 -.9 Q8.9 .8 8 2 Q7.1 .8 8 -.4 Z M8 1.6 Q6.4 .6 6.2 1.8 Q6.4 2.6 7.6 2.2 Z M8 1.6 Q9.6 .6 9.8 1.8 Q9.6 2.6 8.4 2.2 Z" stroke-width=".1"/><circle cx="8" cy="8" r="1.05" stroke-width=".1"/><circle cx="7.75" cy="7.75" r=".4" fill="#fff3c4" stroke="none"/>`,
};
function legMedals(root){ root.querySelectorAll('.leg').forEach((l, n) => { const name = (l.title || '').replace('Легенда: ', ''), m = MEDAL[name]; if(!m) return;
  const u = 'md' + n, teeth = Array.from({length: 72}, (_, i) => { const a = i / 72 * Math.PI * 2, r = i % 2 ? 13.5 : 13; return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
  l.classList.add('pg-medal');
  l.innerHTML = `<svg width="28" height="28" viewBox="-14 -14 28 28" aria-hidden="true"><defs>
      <radialGradient id="${u}f" cx=".34" cy=".28" r=".8"><stop offset="0" stop-color="#fff6c8"/><stop offset=".3" stop-color="#ecc86a"/><stop offset=".7" stop-color="#b08428"/><stop offset="1" stop-color="#6e4e12"/></radialGradient>
      <linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".45" stop-color="#c99a3a"/><stop offset=".7" stop-color="#7a5414"/><stop offset="1" stop-color="#d8b05a"/></linearGradient>
      <linearGradient id="${u}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${u}c"><circle r="10.6"/></clipPath></defs>
    <path d="${teeth}" fill="url(#${u}r)" stroke="#4a340c" stroke-width=".45"/>
    <circle r="12.1" fill="url(#${u}r)" stroke="#4a340c" stroke-width=".5"/>
    <circle r="10.6" fill="url(#${u}f)" stroke="#4a340c" stroke-width=".6"/>
    <circle r="9.3" fill="none" stroke="#7a5a1a" stroke-width=".45" stroke-dasharray=".6 .9" opacity=".8"/>
    ${[-90, -150, -30].map(d => { const r = d * Math.PI / 180; return `<circle cx="${R1(Math.cos(r) * 11.35)}" cy="${R1(Math.sin(r) * 11.35)}" r=".75" fill="#fff3c4" stroke="#4a340c" stroke-width=".3"/>`; }).join('')}
    <g transform="translate(-8.6 -8.6) scale(1.08)"><g transform="translate(.45 .55)" fill="#fff3c4" stroke="#fff3c4" opacity=".65">${m}</g><g fill="#3a2a0c" stroke="#3a2a0c">${m}</g></g>
    <path d="M-8.6 -4 A9.6 9.6 0 0 1 2 -9.4" fill="none" stroke="#fff8d8" stroke-width="1" stroke-linecap="round" opacity=".7"/>
    <g clip-path="url(#${u}c)"><rect class="gl" x="-4" y="-14" width="8" height="28" fill="url(#${u}g)" style="animation-delay:${(n * 1.7).toFixed(1)}s"/></g></svg>`; }); }


/* the number of cards in hand, in the plank head: three navy backs with a white compass rose, the count in a white disc */
function FAN_SVG(n){ const rose = Array.from({length: 8}, (_, i) => { const a = (i * 45 - 90) * Math.PI / 180, r = i % 2 ? 1.7 : 3, b = a + .21; return `<path d="M14 9.6 L${R1(14 + Math.cos(a) * r)} ${R1(9.6 + Math.sin(a) * r)} L${R1(14 + Math.cos(b) * .7)} ${R1(9.6 + Math.sin(b) * .7)} Z" fill="#e6ecf0"/>`; }).join('');
  const back = `<rect x="9.2" y="2.6" width="9.6" height="14" rx="1.4" fill="#22384c" stroke="#e6ecf0" stroke-width=".8"/><rect x="10.3" y="3.7" width="7.4" height="11.8" rx=".7" fill="none" stroke="#9fb4c2" stroke-width=".4" stroke-dasharray="1 .45"/><circle cx="14" cy="9.6" r="3.3" fill="none" stroke="#9fb4c2" stroke-width=".3"/>${rose}<circle cx="14" cy="9.6" r=".5" fill="#a11d17"/>`;
  return `<svg width="36" height="21" viewBox="0 0 39 23" aria-hidden="true"><g style="filter:drop-shadow(0 1px .8px rgba(0,0,0,.5))">${[-22, 0, 22].map(r => `<g transform="rotate(${r} 14 21)">${back}</g>`).join('')}</g><g transform="translate(31 12)"><circle r="6.4" fill="#e6ecf0" stroke="#22384c" stroke-width="1.2"/><text y="3.6" text-anchor="middle" font-family="Old Standard TT,Georgia,serif" font-weight="700" font-size="10" fill="#22384c">${n}</text></g></svg>`; }
function handFans(root){ root.querySelectorAll('.fan').forEach(f => { const n = (f.textContent.match(/\d+/) || ['0'])[0]; f.innerHTML = FAN_SVG(n); f.classList.add('pg-fan'); }); }


/* ===== «Под огнём»: the wax seal of the target, pressed into the plank head — a wax blob with a drip running over the
   edge of the head, two ribbon tails hanging onto the paper of the plank, a pressed ring and an embossed cannon. It lives
   inside the plank (moves and shakes with it). ===== */
const TARGET_SEAL = (() => {
  const blob = Array.from({length: 30}, (_, i) => { const a = i / 30 * Math.PI * 2, r = 14.2 + Math.sin(i * 2.3) * .9 + (i % 7 === 0 ? 1.2 : 0); return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
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
    ${[[-13, -4], [12, -8], [-9, 11]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#a81f17" stroke="#4a0a06" stroke-width=".3"/>`).join('')}</svg>`;
})();
function targetSeal(mat){ const r = mat.querySelector('.mh .r') || mat.querySelector('.mh'); const s = document.createElement('span'); s.className = 'pg-tseal'; s.title = 'Под огнём'; s.innerHTML = TARGET_SEAL; r.prepend(s);
  const svg = s.firstChild; A(svg, [{transform: 'scale(2.6) rotate(-30deg)', opacity: 0}, {transform: 'scale(.86,.8) rotate(4deg)', opacity: 1, offset: .62}, {transform: 'scale(1.05,1.02) rotate(-1deg)', offset: .82}, {transform: 'scale(1) rotate(0)', opacity: 1}], 420, 0, 'cubic-bezier(.5,0,.8,.4)');
  A(svg.querySelector('.tails'), [{transform: 'scaleY(0)'}, {transform: 'scaleY(0)', offset: .55}, {transform: 'scaleY(1.06)', offset: .85}, {transform: 'scaleY(1)'}], 700, 0, 'ease-out');
  setTimeout(() => { if(!s.isConnected) return; A(mat, [{translate: '0 0'}, {translate: '0 2px', offset: .3}, {translate: '0 0'}], 220); }, dur(270));
  return s; }

/* ===== the guns: a real shot — the fuse spits, the muzzle blasts a cone of fire with a white-hot core, the air rings
   with a shockwave, burning grains fly, and a thick cloud of powder smoke jets out and rolls slowly downwind ===== */
function fxDefs(svg){ if(svg.querySelector('#pgSmk')) return; sv(svg, `<defs>
    <radialGradient id="pgSmk" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e9e5dc" stop-opacity=".92"/><stop offset=".8" stop-color="#c8c1b4" stop-opacity=".55"/><stop offset="1" stop-color="#a59d90" stop-opacity="0"/></radialGradient>
    <radialGradient id="pgSmkD" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#8a847a"/><stop offset=".55" stop-color="#5e5850" stop-opacity=".85"/><stop offset="1" stop-color="#36322c" stop-opacity="0"/></radialGradient>
    <radialGradient id="pgFire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff2b0"/><stop offset=".55" stop-color="#ffb347"/><stop offset=".8" stop-color="#e2561e" stop-opacity=".7"/><stop offset="1" stop-color="#8a2a0c" stop-opacity="0"/></radialGradient>
    <linearGradient id="pgCone" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff0a8"/><stop offset=".6" stop-color="#ffa53c" stop-opacity=".85"/><stop offset="1" stop-color="#d9481a" stop-opacity="0"/></linearGradient>
    <radialGradient id="pgGlow"><stop offset="0" stop-color="#ffc66a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc66a" stop-opacity="0"/></radialGradient>
    <filter id="pgSmkF" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="22" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="2.8"/></filter></defs>`); }
function smokeJet(svg, x, y, ang, k = 1, n = 9, life = 5600, darkAll = false){
  fxDefs(svg); const wind = [26, -10], host = sv(svg, ''); host.setAttribute('filter', 'url(#pgSmkF)'); setTimeout(() => host.remove(), dur(life * 1.2 + 400));
  for(let i = 0; i < n; i++){
    const t = i / n, dist = (18 + t * 70) * k, spread = rnd(-.35, .35), a = ang + spread, r0 = (5 + t * 4) * k, r1 = (16 + t * 22 + rnd(0, 10)) * k;
    const ex = x + Math.cos(a) * dist, ey = y + Math.sin(a) * dist, dark = darkAll ? i % 3 !== 2 : i % 4 === 3;
    const c = sv(host, `<circle r="${R1(r1)}" fill="url(#${dark ? 'pgSmkD' : 'pgSmk'})"/>`).firstChild;
    const L = life * rnd(.8, 1.15);
    A(c, [{transform: `translate(${R1(x)}px,${R1(y)}px) scale(${R1(r0 / r1 * 100) / 100})`, opacity: 0},
          {transform: `translate(${R1(x + (ex - x) * .7)}px,${R1(y + (ey - y) * .7)}px) scale(.7)`, opacity: dark ? .5 : .85, offset: .04},
          {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1)`, opacity: dark ? .5 : .9, offset: .14},
          {transform: `translate(${R1(ex + wind[0] * .5 * k)}px,${R1(ey + wind[1] * .5 * k)}px) scale(1.25)`, opacity: dark ? .35 : .7, offset: .5},
          {transform: `translate(${R1(ex + wind[0] * 1.6 * k)}px,${R1(ey + wind[1] * 1.6 * k)}px) scale(1.7)`, opacity: 0}], L, 90 + i * 18, 'cubic-bezier(.1,.8,.3,1)');
  }
}
function gunFire(svg, x, y, ang, k = 1, opt = {}){
  fxDefs(svg); const deg = ang * 180 / Math.PI;
  // the light it throws on the sea and the planks
  const glow = sv(svg, `<circle r="${R1(90 * k)}" fill="url(#pgGlow)"/>`).firstChild;
  A(glow, [{transform: `translate(${x}px,${y}px) scale(.4)`, opacity: 1}, {transform: `translate(${x}px,${y}px) scale(1.2)`, opacity: 0}], 520);
  // the cone of fire with the white-hot core and side tongues
  const K = n => R1(n * k);
  const cone = sv(svg, `<g><ellipse cx="${K(44)}" cy="0" rx="${K(60)}" ry="${K(26)}" fill="url(#pgGlow)"/>
      <path d="M0 -${K(7)} C${K(20)} -${K(26)} ${K(62)} -${K(20)} ${K(92)} 0 C${K(62)} ${K(20)} ${K(20)} ${K(26)} 0 ${K(7)} Z" fill="url(#pgCone)"/>
      <path d="M0 -${K(4)} C${K(16)} -${K(12)} ${K(40)} -${K(8)} ${K(60)} 0 C${K(40)} ${K(8)} ${K(16)} ${K(12)} 0 ${K(4)} Z" fill="#fff6d0"/>
      <path d="M2 0 L${K(22)} -${K(26)} L${K(16)} -${K(7)} Z M2 0 L${K(22)} ${K(26)} L${K(16)} ${K(7)} Z M2 0 L-${K(8)} -${K(14)} L${K(4)} -${K(4)} Z M2 0 L-${K(8)} ${K(14)} L${K(4)} ${K(4)} Z" fill="#ffc35a"/>
      <circle r="${K(22)}" fill="url(#pgFire)"/><circle r="${K(8)}" fill="#fff"/></g>`).firstChild;
  A(cone, [{transform: `translate(${x}px,${y}px) rotate(${R1(deg)}deg) scale(.15,.4)`, opacity: 1}, {transform: `translate(${x}px,${y}px) rotate(${R1(deg)}deg) scale(1.15,1)`, opacity: 1, offset: .22}, {transform: `translate(${x}px,${y}px) rotate(${R1(deg)}deg) scale(1.3,.7)`, opacity: .6, offset: .5}, {transform: `translate(${x}px,${y}px) rotate(${R1(deg)}deg) scale(1.4,.3)`, opacity: 0}], 420, 0, 'cubic-bezier(.1,.9,.3,1)');
  // the shockwave
  const sw = sv(svg, `<circle r="${R1(60 * k)}" fill="none" stroke="#fff6e0" stroke-width="${R1(2.4 * k)}"/>`).firstChild;
  A(sw, [{transform: `translate(${x}px,${y}px) scale(.05)`, opacity: .9}, {transform: `translate(${x}px,${y}px) scale(1)`, opacity: 0}], 360, 0, 'cubic-bezier(.1,.8,.3,1)');
  // burning grains, falling as they fly
  for(let i = 0; i < (opt.grains ?? 9); i++){ const a = ang + rnd(-.5, .5), v = rnd(30, 80) * k, g = sv(svg, `<circle r="${R1(rnd(.8, 1.8) * k)}" fill="${['#fff3c4', '#ffd27a', '#ff9a3c'][i % 3]}"/>`).firstChild;
    A(g, [{transform: `translate(${x}px,${y}px)`, opacity: 1}, {transform: `translate(${R1(x + Math.cos(a) * v * .6)}px,${R1(y + Math.sin(a) * v * .6)}px)`, opacity: 1, offset: .5}, {transform: `translate(${R1(x + Math.cos(a) * v)}px,${R1(y + Math.sin(a) * v + 14 * k)}px)`, opacity: 0}], rnd(400, 700), 0, 'ease-out'); }
  smokeJet(svg, x, y, ang, k, opt.puffs ?? 9, opt.life ?? 5600);
  // the blast flattens the water under the muzzle: a ring of ripples races out
  const rp = sv(svg, `<ellipse rx="${R1(40 * k)}" ry="${R1(12 * k)}" fill="none" stroke="#eef6f8" stroke-width="${R1(1.6 * k)}"/>`).firstChild;
  A(rp, [{transform: `translate(${x}px,${R1(y + 6 * k)}px) scale(.1)`, opacity: .9}, {transform: `translate(${x}px,${R1(y + 6 * k)}px) scale(1)`, opacity: 0}], 700, 40, 'cubic-bezier(.1,.8,.3,1)');
  // burning scraps of wadding flutter down and go out
  for(let i = 0; i < (opt.wads ?? 4); i++){ const a = ang + rnd(-.4, .4), v = rnd(24, 60) * k, wd = sv(svg, `<path d="M-1.4 -1 L1.6 -.6 L1 1.2 L-1.2 .8 Z" fill="#ffb347" stroke="#7a2a0c" stroke-width=".3"/>`).firstChild;
    A(wd, [{transform: `translate(${x}px,${y}px) rotate(0)`, opacity: 1, fill: '#ffe08a'}, {transform: `translate(${R1(x + Math.cos(a) * v)}px,${R1(y + Math.sin(a) * v)}px) rotate(${R1(rnd(-200, 200))}deg)`, opacity: 1, fill: '#ff8a2a', offset: .4}, {transform: `translate(${R1(x + Math.cos(a) * v * 1.2 + rnd(-10, 10))}px,${R1(y + Math.sin(a) * v + 26 * k)}px) rotate(${R1(rnd(-500, 500))}deg)`, opacity: 0, fill: '#3a2a1c'}], rnd(1400, 2200), 60, 'ease-out'); }
  // a second, smaller burst of smoke a beat later — the powder still burning in the barrel
  setTimeout(() => { if(svg.isConnected) smokeJet(svg, x, y, ang, k * .6, 3, (opt.life ?? 5600) * .8); }, dur(260));
}
/* the cannonball: a dark iron ball with a highlight, a thin smoke trail behind it, its shadow on the sea */
async function ballFly(svg, x0, y0, x1, y1, d = 700, lift = 20){
  const pts = qpts(x0, y0, (x0 + x1) / 2, Math.min(y0, y1) - lift, x1, y1, 28);
  const trail = []; for(let i = 1; i <= 7; i++){ const t = sv(svg, `<circle r="${R1(3.6 - i * .35)}" fill="#cfc8bc" opacity="${R1(.5 - i * .06)}"/>`).firstChild; trail.push(t); A(t, pts.map(([x, y]) => ({transform: `translate(${R1(x)}px,${R1(y)}px)`})), d, i * 22, 'linear'); }
  const shadow = sv(svg, `<ellipse rx="5" ry="2" fill="#000" opacity=".3"/>`).firstChild;
  A(shadow, pts.map((p, i) => { const t = i / 28; return {transform: `translate(${R1(x0 + (x1 - x0) * t)}px,${R1(y0 + (y1 - y0) * t + 8)}px) scale(${R1(1 - Math.sin(Math.PI * t) * .5)})`}; }), d, 0, 'linear');
  const ball = sv(svg, `<g><circle r="5" fill="#1a1714"/><circle cx="-1.4" cy="-1.6" r="1.7" fill="#9a948b"/></g>`).firstChild;
  A(ball, pts.map(([x, y], i) => ({transform: `translate(${R1(x)}px,${R1(y)}px) scale(${R1(1 + Math.sin(Math.PI * i / 28) * .15)})`})), d, 0, 'linear');
  await vwait(d); ball.remove(); shadow.remove(); setTimeout(() => trail.forEach(t => t.remove()), dur(200));
}
/* the hit: a white flash, a fireball, a shockwave, splinters and sparks, black smoke rolling up */
function hitBlast(svg, x, y, k = 1, root = null){
  fxDefs(svg);
  if(root){ const sc = scar(document.createElement('i'), 'short'); sc.className = 'pg-hitmark'; sc.style.cssText = `left:${R1(x - 16 * k)}px;top:${R1(y - 12 * k)}px;width:${R1(32 * k)}px;height:${R1(24 * k)}px`; root.appendChild(sc); }
  const fb = sv(svg, `<circle r="${R1(26 * k)}" fill="url(#pgFire)"/>`).firstChild;
  A(fb, [{transform: `translate(${x}px,${y}px) scale(.1)`, opacity: 1}, {transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1, offset: .25}, {transform: `translate(${x}px,${y - 6 * k}px) scale(1.25)`, opacity: 0}], 520, 0, 'cubic-bezier(.1,.8,.3,1)');
  const sw = sv(svg, `<circle r="${R1(56 * k)}" fill="none" stroke="#ffe7a4" stroke-width="${R1(3 * k)}"/>`).firstChild;
  A(sw, [{transform: `translate(${x}px,${y}px) scale(.05)`, opacity: 1}, {transform: `translate(${x}px,${y}px) scale(1)`, opacity: 0}], 420, 0, 'cubic-bezier(.1,.8,.3,1)');
  splinters(svg, x, y, Math.round(12 * k)); sparks(svg, x, y, Math.round(16 * k));
  for(let i = 0; i < 6; i++){ const c = sv(svg, `<circle r="${R1(rnd(10, 18) * k)}" fill="url(#pgSmkD)"/>`).firstChild; const dx = rnd(-14, 14) * k;
    A(c, [{transform: `translate(${x}px,${y}px) scale(.2)`, opacity: 0}, {transform: `translate(${R1(x + dx)}px,${R1(y - 10 * k)}px) scale(1)`, opacity: .8, offset: .15}, {transform: `translate(${R1(x + dx + 24 * k)}px,${R1(y - rnd(50, 80) * k)}px) scale(1.8)`, opacity: 0}], rnd(2400, 3400), 120 + i * 60, 'ease-out'); }
}
/* the miss: a tall white column of water, a foam ring, spray */
function missSplash(svg, x, y, k = 1){
  waterColumn(svg, x, y, 70 * k); waterColumn(svg, x + 9 * k, y + 2, 40 * k);
  const f = sv(svg, `<ellipse rx="${R1(24 * k)}" ry="${R1(7 * k)}" fill="#f4f9fa" opacity=".85"/>`).firstChild;
  A(f, [{transform: `translate(${x}px,${y + 2}px) scale(.2)`, opacity: .9}, {transform: `translate(${x}px,${y + 2}px) scale(1.4)`, opacity: 0}], 1400, 100, 'ease-out');
}

/* a column of thick smoke over a fire: dark clouds keep rising and leaning downwind */
function smokeColumn(svg, x, y, k = 1, waves = 4, every = 700){ for(let w = 0; w < waves; w++) setTimeout(() => { if(svg.isConnected) smokeJet(svg, x + rnd(-8, 8) * k, y, -Math.PI / 2 - .25, k, 5, 5200, true); }, dur(w * every)); }
/* a wall of fire along a line: overlapping real flames, a taller dimmer back row, a glow under it, embers flying up */
function fireWall(root, svg, x0, x1, y, h = 34, opt = {}){ const out = [], z = opt.z || 13, delay = opt.delay || 0, spread = opt.spread ?? 40;
  fxDefs(svg);
  // the bed of embers: an orange glow along the base that breathes
  const bed = sv(svg, `<g><ellipse cx="${R1((x0 + x1) / 2)}" cy="${R1(y)}" rx="${R1((x1 - x0) / 2 + 10)}" ry="${R1(h * .32)}" fill="url(#pgGlow)"/><path d="M${R1(x0)} ${R1(y + 1)} H${R1(x1)}" stroke="#ffb347" stroke-width="${R1(h * .1)}" stroke-linecap="round" opacity=".55" style="filter:blur(2px)"/></g>`).firstChild;
  A(bed, [{opacity: 0}, {opacity: 1, offset: .2}, {opacity: .75, offset: .45}, {opacity: 1, offset: .7}, {opacity: .85}], 3000, delay);
  out.push({remove: () => bed.remove(), animate: (kf, o) => bed.animate(kf.map(k => ({opacity: k.opacity ?? 1, offset: k.offset})).map(k => (k.offset == null && delete k.offset, k)), o), style: bed.style});
  // clumps: a few strong fires with lower flames between them
  const span = x1 - x0, nC = Math.max(1, Math.round(span / (opt.clump || 70)));
  for(let c = 0; c < nC; c++){ const cx = x0 + span * (c + .5) / nC + rnd(-10, 10), big = rnd(.85, 1.25);
    const parts = [[0, 2.1 * big, .78], [-9, 1.4 * big, .85], [9, 1.5 * big, .85], [-17, .8, .9], [17, .9, .9], [-4, .7, 1], [5, .6, 1]];
    parts.forEach(([dx, hk, op], k) => { const fl = flameAt(root, cx + dx + rnd(-3, 3), y + 2 + (k > 4 ? 1 : 0), h * hk * rnd(.85, 1.1)); fl.style.zIndex = z; fl.style.opacity = op; fl.style.rotate = `${R1(rnd(4, 11))}deg`; out.push(fl);
      A(fl, [{transform: 'scaleY(.05)', opacity: 0}, {transform: 'scaleY(1.2)', opacity: op, offset: .35}, {transform: 'scaleY(1)', opacity: op}], 420, delay + c * spread * 2 + k * 30); }); }
  // low licking flames in the gaps
  for(let x = x0; x <= x1; x += 9){ if(Math.random() < .4) continue; const fl = flameAt(root, x, y + 3, h * rnd(.3, .55)); fl.style.zIndex = z; fl.style.rotate = `${R1(rnd(6, 14))}deg`; out.push(fl); A(fl, [{transform: 'scaleY(.05)', opacity: 0}, {transform: 'scaleY(1)', opacity: .9}], 360, delay + (x - x0) / span * spread * nC * 2); }
  for(let i = 0; i < (opt.embers ?? 30); i++){ const e = sv(svg, `<circle r="${R1(rnd(.8, 1.9))}" fill="${['#fff3c4', '#ffd27a', '#ff8a2a'][i % 3]}"/>`).firstChild; const x = rnd(x0, x1);
    A(e, [{transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 0}, {opacity: 1, offset: .1}, {transform: `translate(${R1(x + rnd(5, 30))}px,${R1(y - h * rnd(1.4, 3))}px)`, opacity: 1, offset: .6}, {transform: `translate(${R1(x + rnd(20, 60))}px,${R1(y - h * rnd(2.6, 4.4))}px)`, opacity: 0}], rnd(1200, 2400), delay + rnd(0, 2400)); }
  return out; }


/* a ricochet: the ball strikes the water, leaps on in a low arc, strikes again, then sinks */
async function ricochet(svg, x0, y0, x1, y1, d = 700){
  const mx = x0 + (x1 - x0) * .62, my = y0 + (y1 - y0) * .62;
  await ballFly(svg, x0, y0, mx, my, d * .62, 16); missSplash(svg, mx, my, .6);
  const hx = mx + (x1 - mx) * .6, hy = my + (y1 - my) * .6;
  await ballFly(svg, mx, my, hx, hy, d * .3, 18); waterColumn(svg, hx, hy, 26); ring(svg, hx, hy + 2, 3, 26, '#eef6f8', 700, 0, 1.2);
  await ballFly(svg, hx, hy, x1, y1, d * .22, 8); missSplash(svg, x1, y1, .8);
}

/* the whole table feels the broadside */
function boom(root, amp = 4, d = 320){ shakeEl(root.querySelector('[data-pg="board"]') || root, amp, d); }


/* ----- Гибель: the last hits, the fire takes hold, the powder room goes up, the hull breaks in two, the halves go down
   in a V while the water closes over them; the captain rows to the ally in a longboat; the wreck stays and fades ----- */
async function fxSink(root, code = 'М', ally = 'Ж'){
  const m = matOf(root, NAMES[code]), al = matOf(root, NAMES[ally]), b = rootBox(root, m), inner = seaInnerOf(root), ib = rootBox(root, inner);
  const top = layerSvg(root, 13), f = facing(root, m), up = f.dir < 0;          // up: the sea around is above (a bottom-row ship)
  // 1. the last hits run along the plank
  for(let i = 0; i < 3; i++){ const x = b.x + b.w * (.22 + i * .28), y = b.y + rnd(24, b.h - 18); hitBlast(top, x, y, .95); boom(root, 5, 300); flashRoot(root, '#fff2d0', .18, 220); A(m, [{scale: '1'}, {scale: '1.02 .98', offset: .2}, {scale: '1'}], 300); await vwait(280); }
  // the fire takes hold, black smoke goes up
  const charS = document.createElement('i'); charS.className = 'pg-char'; m.appendChild(charS); A(charS, [{opacity: 0}, {opacity: 1}], 1400);
  const flames = [...fireWall(root, top, b.x + 8, b.x + b.w - 8, b.y + b.h + 2, 30, {spread: 22}), ...fireWall(root, top, b.x + 40, b.x + 200, b.y + 30, 22, {step: 18, spread: 30, embers: 8, delay: 300})];
  smokeColumn(top, b.cx - 100, b.y + 8, 1.3, 6, 600); smokeColumn(top, b.cx + 90, b.y + 8, 1.2, 6, 650);
  A(m, [{filter: 'none'}, {filter: 'sepia(.6) saturate(1.6) brightness(1.05)'}], 900);
  await vwait(1000);
  // 2. the powder room goes up: a fireball in the middle, two shockwaves, a white flash; wreckage flies into the sea
  const cx = b.cx, cy = b.cy;
  flashRoot(root, '#ffe0b0', .6, 520); boom(root, 11, 650); hitBlast(top, cx, cy, 2.6);
  circRing(top, cx, cy, 20, 260, '#fff2c8', 700, 0, 5); circRing(top, cx, cy, 10, 380, '#ffd27a', 1000, 120, 2);
  const seaY = up ? b.y - rnd(20, 70) : b.y + b.h + rnd(20, 70);
  for(let i = 0; i < 12; i++){ const kind = i % 4, ex = cx + rnd(-260, 260), ey = (up ? b.y - rnd(14, 90) : b.y + b.h + rnd(14, 90));
    const g = sv(top, kind === 0 ? '<rect x="-9" y="-2.4" width="18" height="4.8" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/>' : kind === 1 ? '<g><ellipse rx="6" ry="7.4" fill="#8a5a32" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.4 H6 M-6 2.4 H6" stroke="#3a3530" stroke-width="1.1"/></g>' : kind === 2 ? '<rect x="-16" y="-1.6" width="32" height="3.2" rx="1" fill="#6b4422" stroke="#22190f" stroke-width=".6"/>' : '<path d="M-6 -5 L6 -3 L4 5 L-5 4 Z" fill="#e8dcc0" stroke="#22190f" stroke-width=".6"/>').firstChild;
    const pts = qpts(cx + rnd(-30, 30), cy, (cx + ex) / 2, Math.min(cy, ey) - rnd(80, 170), ex, ey, 18), rot = rnd(-720, 720), d = rnd(900, 1300);
    A(g, pts.map(([x, y], k) => ({transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${R1(rot * k / 18)}deg)`})), d, 0, 'cubic-bezier(.3,.1,.7,1)');
    setTimeout(() => { g.remove(); waterColumn(top, ex, ey, 24); if(i % 3 === 0){ const fl = flameAt(root, ex, ey + 4, rnd(14, 20)); fl.style.zIndex = 12; flames.push(fl); A(fl, [{opacity: 0, transform: 'scaleY(.2)'}, {opacity: 1, transform: 'scaleY(1)', offset: .1}, {opacity: 1, offset: .7}, {opacity: 0, transform: 'scaleY(.3)'}], 3200); } }, dur(d)); }
  await vwait(600);
  // 3. the hull breaks in two along a jagged line; the halves tilt into a V and sink, darkening under the water
  flames.forEach(fl => A(fl, [{opacity: 1}, {opacity: 0, transform: 'scaleY(.3)'}], 900, rnd(0, 400)));
  const jag = '50% 0, 46% 16%, 53% 33%, 46% 50%, 54% 67%, 47% 84%, 52% 100%', jagPts = jag.replace(/%/g, '').split(', ').map(p => p.replace(' ', ',')).join(' ');
  const half = (clip, origin) => { const c = m.cloneNode(true); c.classList.add('pg-half'); c.style.clipPath = clip; c.style.transformOrigin = origin; c.style.zIndex = 6; c.style.pointerEvents = 'none'; c.querySelectorAll('.pg-stamp').forEach(x => x.remove());
    const w = document.createElement('div'); w.className = 'pg-sinkwater'; c.appendChild(w);
    c.insertAdjacentHTML('beforeend', `<svg class="pg-breakedge" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${jagPts}" fill="none" stroke="#1c0c04" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linejoin="round"/><polyline points="${jagPts}" fill="none" stroke="#ff8a2a" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" opacity=".9"><animate attributeName="opacity" values=".9;.5;1;.6;.9" dur=".8s" repeatCount="indefinite"/></polyline></svg>`);
    m.after(c); return c; };
  const L = half(`polygon(0 0, ${jag}, 0 100%)`, '0% 50%'), Rh = half(`polygon(${jag}, 100% 100%, 100% 0)`, '100% 50%');
  m.style.opacity = '0';
  splinters(top, cx, cy, 16); sparks(top, cx, cy, 14); boom(root, 6, 400);
  const D = 2600, sy = up ? -1 : 1;
  A(L, [{translate: '0 0', rotate: '0deg', scale: '1', filter: 'sepia(.6) brightness(1)'}, {translate: '-12px 0', rotate: `${8 * sy}deg`, scale: '1', offset: .25, filter: 'sepia(.4) brightness(.9)'}, {translate: '-20px 10px', rotate: `${14 * sy}deg`, scale: '.9', filter: 'grayscale(.6) brightness(.55)', opacity: 0}], D, 0, 'cubic-bezier(.5,0,.7,1)');
  A(Rh, [{translate: '0 0', rotate: '0deg', scale: '1', filter: 'sepia(.6) brightness(1)'}, {translate: '12px 0', rotate: `${-8 * sy}deg`, scale: '1', offset: .25, filter: 'sepia(.4) brightness(.9)'}, {translate: '20px 10px', rotate: `${-14 * sy}deg`, scale: '.9', filter: 'grayscale(.6) brightness(.55)', opacity: 0}], D, 120, 'cubic-bezier(.5,0,.7,1)');
  [L, Rh].forEach((h, i) => A(h.querySelector('.pg-sinkwater'), [{opacity: 0, backgroundPosition: '0 100%'}, {opacity: 0, offset: .2}, {opacity: .9, backgroundPosition: '0 0'}], D, i * 120, 'ease-in'));
  // the water boils and closes: bubbles, foam rings, a swirl that pulls the debris down
  const swirl = seaSvg(inner, false, 'pg-tmp'); const [scx, scy] = toSea(root, cx, f.y + (up ? -20 : 20));
  swirl.innerHTML = `<g transform="translate(${R1(scx)} ${R1(scy)})" opacity=".85">${[0, 1, 2, 3].map(i => `<path d="${spiral(0, 0, 150 - i * 20, 6, 1.6, i * 1.57, .34)}" fill="none" stroke="#e6f2f4" stroke-width="${2 - i * .3}" stroke-dasharray="14 10" opacity="${.8 - i * .15}"><animate attributeName="stroke-dashoffset" from="0" to="-96" dur="${1.2 + i * .2}s" repeatCount="indefinite"/></path>`).join('')}<ellipse rx="22" ry="7" fill="#06141a" opacity=".6"/></g>`;
  A(swirl, [{opacity: 0}, {opacity: 1, offset: .2}, {opacity: 1, offset: .75}, {opacity: 0}], D + 1400);
  for(let i = 0; i < 40; i++){ const x = b.x + rnd(10, b.w - 10), c = sv(top, `<circle r="${R1(rnd(1.6, 4.4))}" fill="rgba(220,244,248,.18)" stroke="#dff4f8" stroke-width="1"/>`).firstChild;
    A(c, [{transform: `translate(${R1(x)}px,${R1(b.y + rnd(10, b.h))}px)`, opacity: 0}, {opacity: 1, offset: .2}, {transform: `translate(${R1(x + rnd(-8, 8))}px,${R1(b.y + rnd(-30, 20))}px)`, opacity: 0}], rnd(900, 1500), rnd(400, D)); }
  for(let i = 0; i < 4; i++) ring(top, cx, f.y + (up ? -8 : 8), 30, 300 - i * 40, '#cfe8ef', 1600, 700 + i * 380, 2);
  await vwait(D + 200);
  L.remove(); Rh.remove();
  // 4. the plank comes back as a grey record of the loss; the stamp falls with a puff of dust
  m.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(a => a.cancel()); m.style.opacity = ''; m.style.filter = '';
  m.classList.add('pg-sunk'); m.querySelectorAll('.row b').forEach(x => { x.textContent = x.textContent.replace(/^\d+/, '0'); }); const act = m.querySelector('.act'); if(act) act.style.display = 'none';
  A(m, [{opacity: 0}, {opacity: 1}], 700);
  if(!m.querySelector('.pg-stamp')) m.insertAdjacentHTML('beforeend', '<div class="pg-stamp">Потоплен</div>');
  const st = m.querySelector('.pg-stamp');
  A(st, [{transform: 'rotate(-7deg) scale(2.8)', opacity: 0}, {transform: 'rotate(-7deg) scale(.94)', opacity: .9, offset: .7}, {transform: 'rotate(-7deg) scale(1)', opacity: .85}], 380, 500, 'cubic-bezier(.5,0,.8,.4)');
  setTimeout(() => { puffs(top, b.x + 220, b.y + 66, 7, {r0: 6, r1: 12, life: 1000, color: '#d9c9a4', o: .7, drift: [0, -10]}); boom(root, 3, 200); }, dur(800));
  // the wreck stays afloat for a while: a broken mast with a scrap of sail, a barrel, planks, bubbles
  const [wx, wy] = toSea(root, b.cx - 60, f.y + (up ? -34 : 34));
  const deb = scar(seaSvg(inner, false, 'pg-debris'), 'long', code);
  deb.innerHTML = `<g transform="translate(${R1(wx)} ${R1(wy)}) scale(1.5)">${[[0, 0, 'mast', 3.6], [70, 6, 'barrel', 2.8], [-60, 10, 'plank', 3], [130, -4, 'plank', 3.4], [40, -12, 'plank', 2.6]].map(([x, y, k, d2]) => `<g transform="translate(${x} ${y})"><g><animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="${d2}s" repeatCount="indefinite"/>
    <ellipse cx="0" cy="4" rx="16" ry="3.4" fill="none" stroke="#e6f2f4" stroke-width="1" opacity=".6"/>
    ${k === 'mast' ? '<rect x="-24" y="-2" width="48" height="4" rx="1.4" fill="#6b4422" stroke="#22190f" stroke-width=".8"/><path d="M-8 -2 L4 -16 L14 -2 Z" fill="#e8dcc0" stroke="#22190f" stroke-width=".7"/>' : k === 'barrel' ? '<ellipse rx="8" ry="6.4" fill="#8a5a32" stroke="#22190f" stroke-width=".8"/><path d="M-3 -6 V6 M3 -6 V6" stroke="#3a3530" stroke-width="1.2"/>' : '<rect x="-11" y="-2.6" width="22" height="5.2" rx="1" fill="#a8703a" stroke="#22190f" stroke-width=".7"/>'}</g></g>`).join('')}</g>`;
  A(deb, [{opacity: 0}, {opacity: 1}], 900);
  // 5. the captain rows across to the ally in a longboat: a clinker-built boat, two sailors pulling at the oars, the
  //    captain standing in the stern in a coat and a cocked hat, a lantern on the bow, the ship's pennant at the stern;
  //    every stroke leaves rings on the water, a wake spreads behind
  if(al){ const fa = facing(root, al), [x0, y0] = [f.x, f.y + (up ? -30 : 30)], [x1, y1] = [fa.x, fa.y + (fa.dir < 0 ? -30 : 30)], flip = x1 < x0 ? -1 : 1;
    const CREW = CELLS2.CREW.replace(/<svg[^>]*>/, '').replace('</svg>', '');
    const CAPT = CREW.replace('fill="#ece4d0"', 'fill="#8a1c14"').replace(/fill="#3a2a22"/g, 'fill="#5a1410"').replace('fill="#9b2a1f"', 'fill="#1c1814"').replace('fill="#7e1f16"', 'fill="none"').replace('stroke="#4e120c" stroke-width=".25"', 'stroke="none"')
      + `<path d="M1.2 4.8 Q7 -1.8 12.8 4.8 Q10.2 3.4 7 4.2 Q3.8 3.4 1.2 4.8 Z" fill="#1c1814" stroke="#e0bd62" stroke-width=".45"/><path d="M6.4 2.2 L7 1.4 L7.6 2.2 Z" fill="#e0bd62"/>`;
    const man = (x, k, body) => `<g transform="translate(${R1(x - 7 * k)} ${R1(-.6 - 16.8 * k)}) scale(${k})">${body}</g>`;
    const OAR = `<g class="oar"><path d="M0 0 L22 9" stroke="#6b4422" stroke-width="1.6" stroke-linecap="round"/><path d="M19 7.6 L27 11.4 L26 13.4 L18.4 9.6 Z" fill="#8a5a32" stroke="#2a1a0c" stroke-width=".5"/></g>`;
    const boat = sv(top, `<g><g class="pg-rock">
      <path d="M-30 6 Q-2 10 30 4" fill="none" stroke="#eef6f8" stroke-width="2" opacity=".7"/>
      <g transform="translate(-9 1)">${OAR}</g><g transform="translate(5 1)">${OAR}</g>
      ${man(-9, .82, CREW)}${man(5, .82, CREW)}${man(-21, .98, CAPT)}
      <ellipse cx="2" cy="11" rx="32" ry="3" fill="#0b2430" opacity=".35"/>
      <g opacity=".22" transform="matrix(1 0 0 -.35 0 12.2)"><path d="M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z" fill="#5a3418"/></g>
      <defs><linearGradient id="pgBoatH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset=".5" stop-color="#7a4a26"/><stop offset="1" stop-color="#4a2a12"/></linearGradient>
        <linearGradient id="pgBoatL" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
        <clipPath id="pgBoatC"><path d="M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z"/></clipPath></defs>
      <path d="M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z" fill="url(#pgBoatH)" stroke="#2a1a0c" stroke-width="1"/>
      <g clip-path="url(#pgBoatC)">
        <path d="M-27.4 -.6 Q2 2.6 30.2 -2.6 M-26.4 2.4 Q2 5.8 28.6 .6 M-24.6 5.4 Q0 8.4 25.4 3.8" fill="none" stroke="#2a1a0c" stroke-width=".8"/>
        <path d="M-27.4 0 Q2 3.2 30 -2 M-26.2 3 Q2 6.4 28.2 1.2 M-24.2 6 Q0 9 25 4.4" fill="none" stroke="#d9a46c" stroke-width=".45" opacity=".7"/>
        ${[-20, -12, -4, 4, 12, 20].map(x => `<circle cx="${x}" cy="${R1(.6 + Math.abs(x) * .02)}" r=".45" fill="#e0c08a"/><circle cx="${x + 2}" cy="${R1(3.7 + Math.abs(x) * .02)}" r=".45" fill="#e0c08a"/>`).join('')}
        <path d="M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z" fill="url(#pgBoatL)"/></g>
      <path d="M-28.6 -3.4 Q12 -1.4 31.4 -5.6" fill="none" stroke="#3a2210" stroke-width="2.4" stroke-linecap="round"/><path d="M-28 -3.8 Q12 -1.8 31 -6" fill="none" stroke="#e0b07a" stroke-width="1" stroke-linecap="round"/>
      <path d="M-28.4 -3.6 Q-27.6 3 -25 7.2" fill="none" stroke="#3a2210" stroke-width="1.6"/><path d="M31.2 -5.6 Q32.6 -7.6 32 -9.4" fill="none" stroke="#3a2210" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M-10 9.4 L14 9.4" stroke="#2a1a0c" stroke-width="1.4" stroke-linecap="round"/>
      ${[-9, 5].map(x => `<path d="M${x - 1} ${R1(-2.6 - (x + 28) * .006)} v-1.6 M${x + 1} ${R1(-2.8 - (x + 28) * .006)} v-1.6" stroke="#2b2f31" stroke-width=".6"/>`).join('')}
      <path d="M-2 9 q-.6 .8 0 1.6 M20 7.4 q.6 .8 0 1.6" stroke="#eef6f8" stroke-width=".6" fill="none" opacity=".6"/>
      <path d="M-29 -2 V-22" stroke="#4a2a12" stroke-width="1"/><path d="M-29 -22 L-17 -19 L-29 -16 Z" fill="#8a2e1c"><animateTransform attributeName="transform" type="skewY" values="0;-8;0;6;0" dur="1.2s" repeatCount="indefinite"/></path>
      <path d="M28 -5 L33 -14" stroke="#4a2a12" stroke-width="1"/><g transform="translate(33 -15)"><circle r="6" fill="#ffd27a" opacity=".35"><animate attributeName="opacity" values=".35;.2;.4;.25;.35" dur=".9s" repeatCount="indefinite"/></circle><rect x="-1.8" y="-2.6" width="3.6" height="4.6" rx=".8" fill="#ffe7a0" stroke="#3a2412" stroke-width=".6"/><path d="M-1.8 -2.6 H1.8 M0 -2.6 V-4" stroke="#3a2412" stroke-width=".6"/></g>
      </g></g>`).firstChild;
    const D2 = 3200, pts = qpts(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + (up ? -26 : 26), x1, y1, 24);
    A(boat, pts.map(([x, y]) => ({transform: `translate(${R1(x)}px,${R1(y)}px) scale(${flip * 1.7},1.7)`})), D2, 300, 'ease-in-out');
    boat.querySelectorAll('.oar').forEach(o => { const a = o.animate([{transform: 'rotate(-34deg)'}, {transform: 'rotate(26deg)', offset: .55}, {transform: 'rotate(-34deg)'}], {duration: 640 / speed, iterations: 6, delay: 300 / speed, easing: 'ease-in-out'}); VS && VS.anims.push(a); });
    const at = t => { const k = Math.min(23, Math.floor(t * 24)); return pts[k]; };
    for(let k = 0; k < 6; k++) setTimeout(() => { const [x, y] = at((300 + k * 640 + 330) / (D2 + 300)); ring(top, x - flip * 6, y + 12, 3, 22, '#eef6f8', 900, 0, 1.2); ring(top, x - flip * 14, y + 14, 3, 18, '#eef6f8', 800, 80, 1); }, dur(300 + k * 640 + 330));
    for(let i = 0; i < 8; i++){ const w = sv(top, `<path d="M0 0 q-10 3 -22 1 M0 4 q-10 4 -24 6" fill="none" stroke="#eef6f8" stroke-width="1.2" stroke-linecap="round"/>`).firstChild; A(w, pts.map(([x, y]) => ({transform: `translate(${R1(x - flip * 36)}px,${R1(y + 6)}px) scale(${flip},1)`, opacity: R1(.7 - i * .08)})), D2, 300 + i * 90, 'ease-in-out'); }
    await vwait(D2 + 350); A(boat, [{opacity: 1}, {opacity: 0}], 400); await vwait(380); boat.remove();
    const ab = rootBox(root, al.querySelector('.mh')); markAt(root, ab.x + ab.w - 200, ab.y - 14, 'Капитан на борту', true); A(al, [{boxShadow: '0 0 0 3px #e0bd62, 0 0 22px rgba(224,189,98,.7)'}, {boxShadow: '0 0 0 0 rgba(0,0,0,0)'}], 1400);
  }
  flames.forEach(fl => fl.remove()); swirl.remove();
  await vwait(600); top.remove();
}

/* ===== traces: what the effects leave on the table. Everything simply fades away by itself, gradually, so even three
   Legends on top of a whirlpool never turn the table into a mess. Each trace holds, then slowly dissolves:
     short  — smoke, ink, the beast's shadow, sucker marks:      holds 3 s,  fades over 9 s;
     medium — cracks, scorch marks, the flames of a Fire:        holds 9 s,  fades over 12 s;
     long   — a wreck, a bottle with a ship:                      holds 14 s, fades over 14 s.
   At most SCAR_MAX traces at once — when a new one comes, the oldest dissolve quickly (2 s).
   (The numbers on the planks, «Потоплен», statuses are state, not traces — they do not fade.)
   The weather of the round is not a trace: it is a rule and stays the whole round. ===== */
const SCAR_LIFE = {short: [3000, 9000], medium: [9000, 12000], long: [14000, 14000]}, SCAR_MAX = 6;
const SCAR_ALIAS = {turn: 'short', state: 'medium', fire: 'medium', sunk: 'long'};
function scar(el, life = 'short', owner = ''){
  life = SCAR_ALIAS[life] || life; el.dataset.scar = life; if(owner) el.dataset.owner = owner;
  const [hold, fade] = SCAR_LIFE[life] || SCAR_LIFE.short;
  requestAnimationFrame(() => { if(!el.isConnected) return;
    const a = el.animate([{opacity: 1}, {opacity: 1, offset: hold / (hold + fade)}, {opacity: 0}], {duration: hold + fade, easing: 'linear'});
    el._scarAnim = a; a.onfinish = () => el.remove();
    const root = el.closest('.pg-stage > div') || document; const all = [...root.querySelectorAll('[data-scar]')].filter(x => !x.dataset.gone);
    all.slice(0, Math.max(0, all.length - SCAR_MAX)).forEach(fadeScar); });
  return el;
}
function fadeScar(el){ if(!el.isConnected || el.dataset.gone) return; el.dataset.gone = '1'; if(el._scarAnim) el._scarAnim.cancel(); const a = el.animate([{opacity: getComputedStyle(el).opacity}, {opacity: 0}], {duration: 2000, fill: 'forwards'}); a.onfinish = () => el.remove(); }
function clearScars(root, life, owner){ life = SCAR_ALIAS[life] || life; root.querySelectorAll(`[data-scar${life ? `="${life}"` : ''}]${owner ? `[data-owner="${owner}"]` : ''}`).forEach(fadeScar); }

/* ----- the cards of the Legends (data/game-data.json) and their pictures ----- */
const LEG = {
  kraken: {owner: 'Г', name: 'Кракен', type: 'приказ', cost: 3, costKind: 'souls', big: '4 Корпус + 2 Команды', text: 'Потратьте <b>3 Души</b>. Нанесите вражескому кораблю <b>4 урона по Корпусу</b> и <b>2 урона по Команде</b>. Это не Залп.', color: '#2C6658'},
  armada: {owner: 'И', name: 'Армада Компании', type: 'приказ', cost: 2, costKind: 'powder', big: '2 + 1 всем врагам', text: 'Каждый вражеский корабль получает <b>2 урона по Корпусу</b> и <b>1 урон по Парусам</b>. Это не Залп.', color: '#9C7A2C'},
  bottle: {owner: 'М', name: 'Корабль в бутылке', type: 'приказ', cost: 3, costKind: 'powder', big: 'потопить слабого', text: 'Вражеский корабль с Корпусом <b>3 или меньше</b> тонет. Это не Залп.', color: '#8A2E1C'},
  jack: {owner: 'Ж', name: 'Джек ускользает', type: 'реакция', cost: 2, costKind: 'powder', big: 'не тонет', text: 'Сыграйте, когда «Жемчужина» должна утонуть. Вместо этого её Корпус становится <b>2</b>, и ваша команда бесплатно меняет корабли местами.', color: '#26221F'},
};
const NICKS = {'Ж': 'ЖЕМЧУЖИНА', 'М': 'МЕСТЬ', 'И': 'ИНДЕВОР', 'Г': 'ГОЛЛАНДЕЦ'};
const TENT = (uid, k = 1, kx = 1) => `<g transform="scale(${R1(k * kx * 100) / 100} ${k})"><defs><linearGradient id="pgT${uid}" x1="0" x2="1"><stop offset="0" stop-color="#3a2a48"/><stop offset=".5" stop-color="#7a5a90"/><stop offset="1" stop-color="#2a1e36"/></linearGradient></defs>
  <path d="M-14 0 C-20 -40 6 -62 -4 -104 C-10 -126 4 -146 18 -140 C30 -134 24 -118 14 -120 C8 -112 14 -100 14 -84 C14 -56 4 -34 14 0 Z" fill="url(#pgT${uid})" stroke="#1a1022" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M8 -4 C2 -34 12 -60 6 -100" fill="none" stroke="#c9a6d6" stroke-width="5" opacity=".35" stroke-linecap="round"/>
  ${[[9, -12, 4], [10, -28, 3.7], [9, -44, 3.4], [8, -60, 3], [8, -76, 2.7], [8, -92, 2.3], [9, -106, 2], [14, -118, 1.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${R1(r * .8)}" fill="#e9c9d6" stroke="#6a4a6e" stroke-width=".7"/><ellipse cx="${x}" cy="${y}" rx="${R1(r * .45)}" ry="${R1(r * .35)}" fill="#a0708a"/>`).join('')}</g>`;

/* ----- the compass: a pendant bow, a knurled and bevelled brass bezel, a cream card with degrees, a 16-point faceted
   rose, the letters С В Ю З, a blued-steel needle with a red north on a jewelled pivot, the shadow of the glass lip,
   glints. Small sizes (medallion) drop the bow, the numbers and the finest ticks. ----- */
function compassArt(uid, r = 74, o = {}){
  const id = k => `pgC${uid}${k}`, P = a => [Math.cos(a), Math.sin(a)], f = n => R1(n * 100) / 100, big = r >= 24;
  const ticks = Array.from({length: 120}, (_, i) => { const a = i * 3 * Math.PI / 180 - Math.PI / 2, bg = i % 30 === 0, mid = i % 10 === 0, half = i % 5 === 0;
    if(!big && !half) return '';
    const r0 = r * .855, l = r * (bg ? .1 : mid ? .072 : half ? .05 : .03), [c, sn] = P(a);
    return `<path d="M${f(c * r0)} ${f(sn * r0)} L${f(c * (r0 - l))} ${f(sn * (r0 - l))}" stroke="#2a2018" stroke-width="${f(r * (bg ? .02 : mid ? .013 : .008))}"/>`; }).join('');
  const knurl = big ? Array.from({length: 96}, (_, i) => { const [c, sn] = P(i * Math.PI / 48); return `<path d="M${f(c * r * .995)} ${f(sn * r * .995)} L${f(c * r * .952)} ${f(sn * r * .952)}" stroke="#5e400e" stroke-width="${f(r * .011)}" opacity=".7"/>`; }).join('') : '';
  const nums = big ? [30, 60, 120, 150, 210, 240, 300, 330].map(d => { const [x, y] = P(d * Math.PI / 180 - Math.PI / 2), X = f(x * r * .69), Y = f(y * r * .69);
    return `<text x="${X}" y="${f(+Y + r * .028)}" font-family="'Old Standard TT',Georgia,serif" font-size="${f(r * .075)}" text-anchor="middle" fill="#4a3a20" transform="rotate(${d} ${X} ${Y})">${d}</text>`; }).join('') : '';
  const point = (deg, len, wid, light, dark) => { const a = deg * Math.PI / 180 - Math.PI / 2, [c, sn] = P(a), [lc, ls] = P(a - Math.PI / 2);
    return `<path d="M0 0 L${f(lc * wid)} ${f(ls * wid)} L${f(c * len)} ${f(sn * len)} Z" fill="${light}"/><path d="M0 0 L${f(c * len)} ${f(sn * len)} L${f(-lc * wid)} ${f(-ls * wid)} Z" fill="${dark}"/>`; };
  const mute = o.needle !== false;   // with a needle on top the rose steps back, so the needle reads at once
  const fine = big ? Array.from({length: 16}, (_, i) => point(11.25 + i * 22.5, r * .27, r * .028, mute ? '#ede2c4' : '#e2d0a2', mute ? '#cdb784' : '#b29554')).join('') : '';
  const minor = Array.from({length: 8}, (_, i) => point(22.5 + i * 45, r * .36, r * .045, mute ? '#e6d8b2' : '#d9c38e', mute ? '#c4aa6c' : '#a8873e')).join('');
  const inter = [45, 135, 225, 315].map(d => point(d, r * .5, r * .085, mute ? '#f2e8cc' : '#efe2bf', mute ? '#bfa266' : '#8f6e2c')).join('');
  const card = [[0, mute ? '#eab4a6' : '#e0503a', mute ? '#c98a7a' : '#9c2216'], ...[90, 180, 270].map(d => [d, mute ? '#faf5ea' : '#f7f1e3', mute ? '#a8957a' : '#2c241c'])].map(([d, l, dk]) => point(d, r * .6, r * .115, l, dk)).join('');
  const letters = [['С', 0, '#b8281c'], ['В', 90, '#2a2018'], ['Ю', 180, '#2a2018'], ['З', 270, '#2a2018']].map(([t, d, c]) => { const [x, y] = P(d * Math.PI / 180 - Math.PI / 2); return `<text x="${f(x * r * .69)}" y="${f(y * r * .69 + r * .05)}" font-family="'Old Standard TT',Georgia,serif" font-weight="700" font-size="${f(r * .14)}" text-anchor="middle" fill="${c}">${t}</text>`; }).join('');
  const nl = r * .8, nw = r * .062;
  const needle = `<g class="nd"><path d="M${f(r * .03)} ${f(-nl + r * .04)} L${f(nw + r * .03)} ${f(r * .04)} L${f(r * .03)} ${f(nl + r * .04)} L${f(-nw + r * .03)} ${f(r * .04)} Z" fill="#000" opacity=".28"/>
    <path d="M0 ${f(-nl)} L${f(nw)} 0 L0 ${f(nl)} L${f(-nw)} 0 Z" fill="url(#${id('st')})" stroke="#0b1016" stroke-width="${f(r * .006)}"/><path d="M0 ${f(-nl)} L${f(nw)} 0 L${f(-nw)} 0 Z" fill="url(#${id('rd')})" stroke="#5a0c08" stroke-width="${f(r * .006)}"/>
    <path d="M0 ${f(-nl)} L${f(-nw)} 0 L0 0 Z" fill="#fff" opacity=".18"/>
    <circle cy="${f(nl * .78)}" r="${f(r * .045)}" fill="none" stroke="#1f2a34" stroke-width="${f(r * .018)}"/><path d="M0 ${f(-r * .7)} L0 ${f(r * .7)}" stroke="#fff" stroke-width="${f(r * .008)}" opacity=".35"/></g>`;
  const bow = big && o.bow !== false ? `<ellipse cy="${f(-r * 1.17)}" rx="${f(r * .13)}" ry="${f(r * .14)}" fill="none" stroke="#3a2606" stroke-width="${f(r * .075)}"/>
    <ellipse cy="${f(-r * 1.17)}" rx="${f(r * .13)}" ry="${f(r * .14)}" fill="none" stroke="url(#${id('bz')})" stroke-width="${f(r * .05)}"/>
    <rect x="${f(-r * .07)}" y="${f(-r * 1.06)}" width="${f(r * .14)}" height="${f(r * .1)}" rx="${f(r * .02)}" fill="url(#${id('bz')})" stroke="#3a2606" stroke-width="${f(r * .01)}"/>
    <rect x="${f(-r * .11)}" y="${f(-r * 1.1)}" width="${f(r * .22)}" height="${f(r * .07)}" rx="${f(r * .03)}" fill="url(#${id('bz')})" stroke="#3a2606" stroke-width="${f(r * .01)}"/>` : '';
  return `<g><defs>
      <linearGradient id="${id('bz')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".35" stop-color="#d7ac52"/><stop offset=".6" stop-color="#8a6420"/><stop offset=".85" stop-color="#e6c06a"/><stop offset="1" stop-color="#6e4c14"/></linearGradient>
      <linearGradient id="${id('bv')}" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f4d68a"/><stop offset=".45" stop-color="#b8892e"/><stop offset="1" stop-color="#5a3c0c"/></linearGradient>
      <radialGradient id="${id('dl')}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fbf5e6"/><stop offset=".8" stop-color="#efe3c6"/><stop offset="1" stop-color="#dcc9a0"/></radialGradient>
      <radialGradient id="${id('lp')}" r=".5"><stop offset=".84" stop-color="#2a1c06" stop-opacity="0"/><stop offset="1" stop-color="#2a1c06" stop-opacity=".5"/></radialGradient>
      <linearGradient id="${id('st')}" x1="0" x2="1"><stop offset="0" stop-color="#5b6a78"/><stop offset=".5" stop-color="#1f2a34"/><stop offset="1" stop-color="#0e151c"/></linearGradient>
      <linearGradient id="${id('rd')}" x1="0" x2="1"><stop offset="0" stop-color="#ef6a52"/><stop offset=".5" stop-color="#c0291c"/><stop offset="1" stop-color="#7e150c"/></linearGradient>
      <radialGradient id="${id('cp')}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2c2"/><stop offset=".5" stop-color="#d1a24a"/><stop offset="1" stop-color="#6e4c14"/></radialGradient>
      <radialGradient id="${id('jw')}" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ff8a74"/><stop offset=".5" stop-color="#a3201a"/><stop offset="1" stop-color="#4a0a06"/></radialGradient></defs>
    ${o.shadow !== false ? `<ellipse cx="${f(r * .06)}" cy="${f(r * .1)}" rx="${f(r * 1.02)}" ry="${f(r * 1.02)}" fill="#000" opacity=".28"/>` : ''}
    ${bow}
    <circle r="${f(r * 1.015)}" fill="#2e1e06"/><circle r="${f(r)}" fill="url(#${id('bz')})"/>${knurl}
    <circle r="${f(r * .945)}" fill="url(#${id('bv')})"/><circle r="${f(r * .93)}" fill="url(#${id('bz')})"/>
    <path d="M${f(-r * .78)} ${f(-r * .52)} A${f(r * .935)} ${f(r * .935)} 0 0 1 ${f(r * .2)} ${f(-r * .91)}" fill="none" stroke="#fff6d2" stroke-width="${f(r * .018)}" stroke-linecap="round" opacity=".8"/>
    <circle r="${f(r * .9)}" fill="#3a2808"/><circle r="${f(r * .885)}" fill="url(#${id('dl')})"/>
    <circle r="${f(r * .855)}" fill="none" stroke="#2a2018" stroke-width="${f(r * .01)}"/><circle r="${f(r * .755)}" fill="none" stroke="#2a2018" stroke-width="${f(r * .006)}"/>
    ${ticks}${nums}${letters}
    <circle r="${f(r * .44)}" fill="none" stroke="#a8873e" stroke-width="${f(r * .008)}"/><circle r="${f(r * .41)}" fill="none" stroke="#a8873e" stroke-width="${f(r * .004)}" stroke-dasharray="${f(r * .02)} ${f(r * .02)}"/>
    ${fine}${minor}${inter}${card}
    ${o.needle !== false ? needle : ''}
    <circle r="${f(r * .075)}" fill="url(#${id('cp')})" stroke="#5a3e10" stroke-width="${f(r * .01)}"/>${big ? `<circle r="${f(r * .036)}" fill="url(#${id('jw')})"/>` : ''}<circle cx="${f(-r * .02)}" cy="${f(-r * .02)}" r="${f(r * .018)}" fill="#fff8de" opacity=".85"/>
    <circle r="${f(r * .885)}" fill="url(#${id('lp')})"/>
    <path d="M${f(-r * .7)} ${f(-r * .3)} A${f(r * .78)} ${f(r * .78)} 0 0 1 ${f(r * .3)} ${f(-r * .72)}" fill="none" stroke="#fff" stroke-width="${f(r * .06)}" stroke-linecap="round" opacity=".22"/>
    <path d="M${f(-r * .5)} ${f(-r * .62)} A${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(-r * .1)} ${f(-r * .8)}" fill="none" stroke="#fff" stroke-width="${f(r * .025)}" stroke-linecap="round" opacity=".5"/>
    ${big ? `<path d="M${f(r * .58)} ${f(r * .5)} A${f(r * .77)} ${f(r * .77)} 0 0 1 ${f(r * .2)} ${f(r * .74)}" fill="none" stroke="#fff" stroke-width="${f(r * .014)}" stroke-linecap="round" opacity=".3"/>` : ''}</g>`;
}

/* the pictures on the Legend cards: 150×99, many small careful details */
const waves = (y, amp, step, x0 = -10, x1 = 160) => { let d = `M${x0} ${y}`; for(let x = x0; x < x1; x += step) d += ` q${step / 4} ${-amp} ${step / 2} 0 t${step / 2} 0`; return d; };
const gull = (x, y, k = 1) => `<path d="M${x - 4 * k} ${y} q${2 * k} ${-2.4 * k} ${4 * k} 0 q${2 * k} ${-2.4 * k} ${4 * k} 0" fill="none" stroke="#2a2a2a" stroke-width="${R1(.7 * k * 10) / 10}" stroke-linecap="round"/>`;
const puff = (x, y, r, c = '#f4f1ea') => `<g fill="${c}"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x + r * .9}" cy="${y - r * .4}" r="${R1(r * .8)}"/><circle cx="${x - r * .9}" cy="${y - r * .2}" r="${R1(r * .7)}"/><circle cx="${x + r * .2}" cy="${y - r * .9}" r="${R1(r * .7)}"/></g>`;

/* the grand dressing of every Legend picture: rays of light from behind the subject, a deep vignette, gilded corner
   flourishes, a thin gold inner line and a small jewel at the top */
const RAYS = (cx, cy, n, r, c = '#fff2c4', o = .22, a0 = 0) => `<g opacity="${o}">${Array.from({length: n}, (_, i) => { const a = a0 + i / n * Math.PI * 2, w = Math.PI / n * .55; return `<path d="M${cx} ${cy} L${R1(cx + Math.cos(a - w) * r)} ${R1(cy + Math.sin(a - w) * r)} L${R1(cx + Math.cos(a + w) * r)} ${R1(cy + Math.sin(a + w) * r)} Z" fill="${c}"/>`; }).join('')}</g>`;
const ART_FRAME = () => { const corner = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M2 2 H20 M2 2 V16" stroke="#e8c76a" stroke-width="1.6" fill="none"/><path d="M5 5 C11 5 13 9 11 12 C9 14 6 12 8 10" stroke="#e8c76a" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M5 5 C5 10 8 13 11 12" stroke="#b8902e" stroke-width=".8" fill="none"/><circle cx="2" cy="2" r="2" fill="#fff0b8" stroke="#8a6420" stroke-width=".5"/></g>`;
  return `<defs><radialGradient id="pgVig" cx=".5" cy=".46" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140c04" stop-opacity=".55"/></radialGradient></defs>
    <rect width="150" height="99" fill="url(#pgVig)"/><rect x="3" y="3" width="144" height="93" rx="2" fill="none" stroke="#e8c76a" stroke-width=".6" opacity=".8"/>
    ${corner(1, 1, 1, 1)}${corner(149, 1, -1, 1)}${corner(1, 98, 1, -1)}${corner(149, 98, -1, -1)}
    <g transform="translate(75 3.4)"><path d="M-10 0 H-3 M3 0 H10" stroke="#e8c76a" stroke-width=".8"/><path d="M0 -3 L3 0 L0 3 L-3 0 Z" fill="#c0291c" stroke="#e8c76a" stroke-width=".7"/></g>`; };

const EMBLEM = {
  kraken: () => `<defs><linearGradient id="pgKs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a24"/><stop offset="1" stop-color="#2c5466"/></linearGradient>
      <linearGradient id="pgKw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4a5a"/><stop offset="1" stop-color="#06161d"/></linearGradient>
      <radialGradient id="pgKm"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/><stop offset=".35" stop-color="#f2e2a8" stop-opacity=".35"/><stop offset="1" stop-color="#f2e2a8" stop-opacity="0"/></radialGradient>
      <radialGradient id="pgKe" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4a0"/><stop offset=".55" stop-color="#f2b21c"/><stop offset="1" stop-color="#8a4a08"/></radialGradient></defs>
    <rect width="150" height="99" fill="url(#pgKs)"/>
    <circle cx="122" cy="18" r="34" fill="url(#pgKm)"/>${RAYS(122, 18, 14, 60, "#f6ecc6", .07)}<circle cx="122" cy="18" r="8.5" fill="#f6ecc6"/><circle cx="119.5" cy="16" r="1.6" fill="#d9cc9e"/><circle cx="124.5" cy="21" r="1.1" fill="#d9cc9e"/>
    ${[[14, 10], [32, 22], [58, 8], [86, 16], [100, 6], [140, 40], [8, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#e8f0f4"/>`).join('')}
    <path d="M0 30 q20 -8 44 -2 t50 -6 t60 4 V40 H0 Z" fill="#081620" opacity=".55"/>
    <ellipse cx="44" cy="30" rx="40" ry="22" fill="#cfe6ff" opacity=".18"/><path d="M48 4 L41 22 L48 22 L38 44 L52 20 L45 20 L54 4 Z" fill="#fff8d8" stroke="#d6ecff" stroke-width=".6"/><path d="M44 30 L36 36 M42 34 L46 40" stroke="#fff8d8" stroke-width=".8"/>
    <g stroke="#cfe0ea" stroke-width=".5" opacity=".35">${Array.from({length: 26}, (_, i) => `<path d="M${(i * 37) % 150} ${(i * 23) % 60} l-3 9"/>`).join('')}</g>
    <path d="M0 56 H150 V99 H0 Z" fill="url(#pgKw)"/><path d="M96 56 L150 56 L150 60 Z" fill="#f6ecc6" opacity=".12"/>
    ${[60, 66, 74, 84].map((y, i) => `<path d="${waves(y, 1.6 + i * .5, 12 + i * 4)}" fill="none" stroke="#5f97aa" stroke-width="${R1(.6 + i * .2)}" opacity="${R1(.7 - i * .1)}"/>`).join('')}
    ${[[110, 57], [118, 58.6], [126, 57.4], [134, 59]].map(([x, y]) => `<path d="M${x} ${y} h5" stroke="#f6ecc6" stroke-width=".8" opacity=".6"/>`).join('')}
    <g transform="rotate(-7 84 66)">${bigShip('pearl', 84, 66, .5)}</g>
    <path d="M68 68 q8 -4 16 -1 q10 3 18 -1" fill="none" stroke="#e9f3f6" stroke-width="1.6" stroke-linecap="round"/>
    <g transform="translate(28 99)">${TENT('e1', .62, 1.3)}</g><g transform="translate(138 99) scale(-1 1)">${TENT('e2', .5, 1.3)}</g>
    <path d="M62 69 C72 62 86 74 98 67 C106 62 112 66 114 72" fill="none" stroke="#5a3a6e" stroke-width="7" stroke-linecap="round"/><path d="M62 69 C72 62 86 74 98 67 C106 62 112 66 114 72" fill="none" stroke="#9a78b0" stroke-width="2.4" stroke-linecap="round" opacity=".7" transform="translate(0 -1.4)"/>
    ${[[68, 67.5], [76, 66], [84, 69], [92, 69], [100, 65.6], [108, 66.6]].map(([x, y]) => `<circle cx="${x}" cy="${y + 2}" r="1.3" fill="#e9c9d6" stroke="#6a4a6e" stroke-width=".4"/>`).join('')}
    <g fill="#e9f3f6">${[[26, 76], [30, 73], [134, 80], [138, 78], [112, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g>
    <path d="M20 79 q6 -9 12 0 M128 82 q5 -8 11 0" fill="none" stroke="#e9f3f6" stroke-width="1.2" stroke-linecap="round"/>
    <g transform="translate(66 88)"><ellipse rx="19" ry="9.5" fill="#0a1218"/><ellipse rx="16" ry="7.4" fill="url(#pgKe)" stroke="#3a1e04" stroke-width=".8"/>
      ${Array.from({length: 10}, (_, k) => { const a = k / 10 * Math.PI * 2; return `<path d="M${R1(Math.cos(a) * 3)} ${R1(Math.sin(a) * 2.2)} L${R1(Math.cos(a) * 14)} ${R1(Math.sin(a) * 6.6)}" stroke="#a85a0a" stroke-width=".4" opacity=".7"/>`; }).join('')}
      <ellipse rx="2.2" ry="6.8" fill="#070707"/><ellipse cx="-6" cy="-3" rx="2.4" ry="1.4" fill="#fff" opacity=".85"/><path d="M-19 -1 Q0 -14 19 -1" fill="none" stroke="#2a1830" stroke-width="2.2"/></g>
    ${Array.from({length: 9}, (_, k) => `<circle cx="${R1(40 + k * 9 + (k % 2) * 3)}" cy="${R1(76 + (k % 3) * 5)}" r="${R1(.8 + (k % 3) * .4)}" fill="none" stroke="#bfe0ea" stroke-width=".5"/>`).join('')}`,
  armada: () => `<defs><linearGradient id="pgAs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd8e4"/><stop offset=".7" stop-color="#efe6cc"/><stop offset="1" stop-color="#f6dfae"/></linearGradient>
      <linearGradient id="pgAw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa9bc"/><stop offset="1" stop-color="#2f5f74"/></linearGradient>
      <radialGradient id="pgAsun"><stop offset="0" stop-color="#fff6d0"/><stop offset=".4" stop-color="#ffe08a" stop-opacity=".8"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>
    <rect width="150" height="99" fill="url(#pgAs)"/>
    <circle cx="118" cy="30" r="26" fill="url(#pgAsun)"/>${RAYS(118, 30, 16, 140, "#fff6d0", .22, .1)}${Array.from({length: 12}, (_, k) => { const a = k / 12 * Math.PI * 2; return `<path d="M${R1(118 + Math.cos(a) * 11)} ${R1(30 + Math.sin(a) * 11)} L${R1(118 + Math.cos(a) * 17)} ${R1(30 + Math.sin(a) * 17)}" stroke="#f2c25a" stroke-width=".8" opacity=".7"/>`; }).join('')}<circle cx="118" cy="30" r="8" fill="#ffe7a0" stroke="#e8b84a" stroke-width=".6"/>
    ${puff(34, 22, 6, '#fbf8f0')}${puff(70, 14, 4, '#fbf8f0')}${puff(146, 50, 5, '#f6f1e4')}
    ${gull(52, 30, 1.1)}${gull(62, 26, .8)}${gull(88, 34, .9)}
    <path d="M0 60 H150" stroke="#2f5f74" stroke-width=".6"/><rect y="60" width="150" height="39" fill="url(#pgAw)"/>
    <path d="M104 61 L132 61 L126 80 L110 80 Z" fill="#fff4cc" opacity=".2"/>
    ${[64, 70, 78, 88].map((y, i) => `<path d="${waves(y, 1.2 + i * .5, 10 + i * 4)}" fill="none" stroke="#d6e8ee" stroke-width="${R1(.5 + i * .15)}" opacity="${R1(.75 - i * .12)}"/>`).join('')}
    ${bigShip('company', 30, 66, .36)}${bigShip('company', 124, 66, .36)}
    ${puff(46, 63, 4.2)}${puff(53, 61, 3.4)}${puff(106, 63, 4)}${puff(99, 61, 3)}
    ${[[42, 64], [108, 64]].map(([x, y]) => `<path d="M${x} ${y} l3 -1.6 l-.6 1.6 l3 .4 l-3 .8 l.8 1.6 Z" fill="#ffb347"/>`).join('')}
    ${bigShip('company', 76, 72, .5)}
    ${puff(60, 69, 5)}${puff(68, 66, 4.4)}${puff(92, 68, 5)}${[[56, 70], [95, 70]].map(([x, y]) => `<path d="M${x} ${y} l-4 -2 l1 2 l-4 1 l4 1 l-1 2 Z" fill="#ffcf6a"/>`).join('')}
    <path d="M58 76 q18 3 36 0" fill="none" stroke="#f2f8fa" stroke-width="1.2" stroke-linecap="round"/>
    <g transform="translate(20 21)">${[-1, 1].map(sx => `<g transform="scale(${sx} 1)">${Array.from({length: 6}, (_, i) => { const a = Math.PI * (.62 + i * .1); return `<ellipse cx="${R1(Math.cos(a) * 15)}" cy="${R1(Math.sin(a) * 15)}" rx="3.4" ry="1.5" fill="#4f7a3a" stroke="#2a4a1e" stroke-width=".4" transform="rotate(${R1(a * 180 / Math.PI + 90)} ${R1(Math.cos(a) * 15)} ${R1(Math.sin(a) * 15)})"/>`; }).join('')}</g>`).join('')}<path d="M-6 -15 L-3 -19 L0 -15 L3 -19 L6 -15 L6 -12 H-6 Z" fill="#e0bd62" stroke="#8a6420" stroke-width=".5"/></g>
    <g transform="translate(20 21)"><circle r="12" fill="#2f4f66" stroke="#e0bd62" stroke-width="1.6"/><circle r="9.6" fill="none" stroke="#e0bd62" stroke-width=".5"/>
      <g fill="none" stroke="#f6e3a8" stroke-width="1.5" stroke-linecap="round"><path d="M0 -6 V6.4 M-3.6 -3 H3.6 M-6 2.2 Q-5.4 7 0 7.4 Q5.4 7 6 2.2"/><circle cx="0" cy="-7.4" r="1.4"/></g></g>`,
  bottle: () => `<defs><radialGradient id="pgBb" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#f8efd8"/><stop offset="1" stop-color="#e2cfa4"/></radialGradient>
      <radialGradient id="pgBglow"><stop offset="0" stop-color="#fff4c8" stop-opacity=".95"/><stop offset=".6" stop-color="#ffe08a" stop-opacity=".35"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient><linearGradient id="pgBw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87444"/><stop offset="1" stop-color="#5e3a1a"/></linearGradient></defs>
    <rect width="150" height="99" fill="url(#pgBb)"/>
    <g stroke="#b89a64" stroke-width=".4" opacity=".55">${Array.from({length: 16}, (_, k) => { const a = k / 16 * Math.PI * 2; return `<path d="M18 17 L${R1(18 + Math.cos(a) * 170)} ${R1(17 + Math.sin(a) * 170)}"/>`; }).join('')}</g>
    <g stroke="#c9b282" stroke-width=".35" opacity=".5">${Array.from({length: 8}, (_, k) => `<path d="M0 ${k * 14} H150 M${k * 20} 0 V99"/>`).join('')}</g>
    <g transform="translate(18 17)">${compassArt('bb', 10, {needle: false, shadow: false})}</g>
    <circle cx="76" cy="52" r="46" fill="url(#pgBglow)"/>${RAYS(76, 52, 18, 90, "#fff0b0", .28, .2)}
    <ellipse cx="78" cy="86" rx="56" ry="5" fill="#3a2410" opacity=".22"/>
    <path d="M36 86 q-2 -14 8 -16 h4 q8 2 6 16 Z M100 86 q-2 -14 8 -16 h4 q8 2 6 16 Z" fill="url(#pgBw)" stroke="#3a2410" stroke-width=".8"/>
    <rect x="24" y="84" width="110" height="7" rx="2" fill="url(#pgBw)" stroke="#3a2410" stroke-width=".8"/><path d="M28 87 H130" stroke="#c99a64" stroke-width=".6" opacity=".7"/>
    <g transform="translate(76 52) scale(.5)">${bottleArt({ship: true, cork: true})}</g>
    <path d="M128 48 q4 4 0 8 q-4 4 0 8" fill="none" stroke="#8a6a3a" stroke-width="1.6" stroke-linecap="round"/><path d="M126 50 l5 -1 M126 58 l5 -1" stroke="#c9a06a" stroke-width="1.2"/>
    <path d="M136.5 46 q2 3 0 6" fill="#a11d17" stroke="#6a100b" stroke-width=".5"/><circle cx="137" cy="52" r="1.2" fill="#a11d17"/>
    ${Array.from({length: 7}, (_, i) => { const x = [18, 44, 62, 98, 116, 136, 84][i], y = [58, 18, 14, 16, 24, 30, 10][i], r = [2.4, 3, 2, 3.4, 2.2, 2.6, 1.8][i]; return `<path d="M${x} ${y - r} L${R1(x + r * .3)} ${R1(y - r * .3)} L${x + r} ${y} L${R1(x + r * .3)} ${R1(y + r * .3)} L${x} ${y + r} L${R1(x - r * .3)} ${R1(y + r * .3)} L${x - r} ${y} L${R1(x - r * .3)} ${R1(y - r * .3)} Z" fill="#c9a048"/>`; }).join('')}`,
  jack: () => `<defs><linearGradient id="pgJs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2b4"/><stop offset="1" stop-color="#f1d49a"/></linearGradient>
      <radialGradient id="pgJglow"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient><linearGradient id="pgJw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9fb4"/><stop offset="1" stop-color="#244e60"/></linearGradient></defs>
    <rect width="150" height="99" fill="url(#pgJs)"/><circle cx="38" cy="44" r="50" fill="url(#pgJglow)"/>${RAYS(38, 44, 20, 120, "#fff2c0", .32)}${puff(120, 18, 5, '#fbf3e0')}${puff(92, 10, 3.4, '#fbf3e0')}${gull(104, 30, .9)}${gull(114, 26, .7)}
    <rect y="68" width="150" height="31" fill="url(#pgJw)"/><path d="M0 68 H150" stroke="#2f5f74" stroke-width=".6"/>
    ${[71, 77, 85].map((y, i) => `<path d="${waves(y, 1.2 + i * .5, 11 + i * 4)}" fill="none" stroke="#d6e8ee" stroke-width="${R1(.5 + i * .15)}" opacity="${R1(.7 - i * .15)}"/>`).join('')}
    <path d="M66 52 C88 44 100 58 108 74" fill="none" stroke="#c9a048" stroke-width="1.8" stroke-dasharray="4 3" stroke-linecap="round"/><path d="M106 70 l3 5 l1 -6" fill="none" stroke="#c9a048" stroke-width="1.6" stroke-linecap="round"/>
    <g opacity=".18">${bigShip('pearl', 96, 82, .42, true)}</g><g opacity=".32">${bigShip('pearl', 106, 82, .42, true)}</g>${bigShip('pearl', 118, 82, .42, true)}
    <path d="M94 81 q-10 1 -20 -1 M94 84 q-12 2 -24 0" stroke="#eef6f8" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M140 80 q4 -2 6 0" stroke="#fff" stroke-width="1" fill="none"/>
    <g transform="translate(38 44)">${compassArt('je', 32, {needle: true}).replace('<g class="nd">', '<g class="nd" transform="rotate(62)">')}</g>
    ${[[78, 30], [70, 18], [88, 22]].map(([x, y]) => `<path d="M${x} ${y - 2.4} L${x + .7} ${y - .7} L${x + 2.4} ${y} L${x + .7} ${y + .7} L${x} ${y + 2.4} L${x - .7} ${y + .7} L${x - 2.4} ${y} L${x - .7} ${y - .7} Z" fill="#c9a048"/>`).join('')}`,
};
const COST_ICON = {
  powder: `<svg width="15" height="19" viewBox="0 0 27 34" aria-hidden="true"><path d="M5 3 Q13.5 0 22 3 Q26 17 22 31 Q13.5 34 5 31 Q1 17 5 3 Z" fill="#a8703a" stroke="#3a2412" stroke-width="1.6"/><path d="M3.4 10 Q13.5 7.6 23.6 10 M3.4 24 Q13.5 26.4 23.6 24" stroke="#3a3530" stroke-width="2.2" fill="none"/><path d="M10 3 Q8.6 17 10 31 M17 3 Q18.4 17 17 31" stroke="#7a4f24" stroke-width="1"/></svg>`,
  souls: `<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6 C6.6 2.6 3.4 6.4 3.4 10.8 C3.4 13.6 4.8 15.4 6.6 16.4 V19.6 Q6.6 21.2 8.2 21.2 H15.8 Q17.4 21.2 17.4 19.6 V16.4 C19.2 15.4 20.6 13.6 20.6 10.8 C20.6 6.4 17.4 2.6 12 2.6 Z" fill="#dff7e8" stroke="#1e3a2a" stroke-width="1.3"/><ellipse cx="8.8" cy="11.4" rx="2.3" ry="2.6" fill="#1e3a2a"/><ellipse cx="15.2" cy="11.4" rx="2.3" ry="2.6" fill="#1e3a2a"/><path d="M12 14 L10.9 16.4 H13.1 Z" fill="#1e3a2a"/><path d="M9.4 21 V18.6 M12 21 V18.6 M14.6 21 V18.6" stroke="#1e3a2a" stroke-width="1"/></svg>`};
const COST_WORD = (n, k) => k === 'souls' ? `${n} ${n === 1 ? 'Душа' : n < 5 ? 'Души' : 'Душ'}` : `${n} ${n === 1 ? 'Порох' : n < 5 ? 'Пороха' : 'Пороха'}`;
function legendCardHTML(key){
  const L = LEG[key];
  // Russian typesetting: a number stays with its word, a short word stays with the next one
  const text = L.text.replace(/ (<b>)?(\d)/g, '&nbsp;$1$2').replace(/(\d) /g, '$1&nbsp;').replace(/(^|[\s>(«])(и|в|с|к|о|а|по|не|на|за|из|её|их|это|Это) /g, '$1$2&nbsp;');
  return `<div class="pg-lc-back"><svg width="130" height="130" viewBox="-20 -20 40 40" aria-hidden="true">${Array.from({length: 16}, (_, i) => { const a = i * Math.PI / 8 - Math.PI / 2, r = i % 4 === 0 ? 17 : i % 2 === 0 ? 11 : 6; return `<path d="M0 0 L${R1(Math.cos(a - .14) * 3)} ${R1(Math.sin(a - .14) * 3)} L${R1(Math.cos(a) * r)} ${R1(Math.sin(a) * r)} Z" fill="${i % 2 ? '#c9a048' : '#f2d98a'}"/>`; }).join('')}<circle r="18.6" fill="none" stroke="#c9a048" stroke-width=".6"/></svg><b>Легенда</b></div>
  <div class="pg-lc-face"><div class="pg-lc-top"><span class="pg-lc-cost pg-lc-${L.costKind}" title="Цена: ${COST_WORD(L.cost, L.costKind)}" aria-label="Цена: ${COST_WORD(L.cost, L.costKind)}"><b>${L.cost}</b>${COST_ICON[L.costKind]}</span><span class="pg-lc-type">Легенда · ${L.type}</span></div>
    <div class="pg-lc-art"><svg width="212" height="140" viewBox="0 0 150 99" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${EMBLEM[key]()}${ART_FRAME()}</svg></div>
    <div class="pg-lc-name">${L.name}</div><div class="pg-lc-big">${L.big}</div><div class="pg-lc-text"><p>${text}</p></div>
    <div class="pg-lc-foot" style="background:${L.color}"><span>${NICKS[L.owner]}</span></div>
    <i class="pg-lc-shine"></i><svg class="pg-lc-glint" width="248" height="372" viewBox="0 0 248 372"><rect x="3" y="3" width="242" height="366" rx="12" fill="none" stroke="#fff6d8" stroke-width="3" stroke-dasharray="80 1136" stroke-linecap="round"/></svg></div>`;
}

const SEAL_HTML = (() => {
  const blob = Array.from({length: 36}, (_, i) => { const a = i / 36 * Math.PI * 2, r = 40.5 + Math.sin(i * 2.7) * 1.6 + (i % 5 === 0 ? 2.2 : 0); return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
  const star = Array.from({length: 10}, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 4.6 : 10.6; return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
  const dots = [66, 90, 114].map(d => { const a = d * Math.PI / 180; return `<path transform="translate(${R1(Math.cos(a) * 28.5)} ${R1(Math.sin(a) * 28.5)})" d="M0 -3 L2.2 0 L0 3 L-2.2 0 Z" fill="#f2c94c" stroke="#4a0a07" stroke-width=".6"/>`; }).join('');
  return `<svg width="96" height="96" viewBox="-48 -48 96 96" aria-hidden="true"><defs><path id="pgSealTop" d="M-25.6 7 A26.5 26.5 0 1 1 25.6 7"/>
    <radialGradient id="pgWax" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#d8412f"/><stop offset=".55" stop-color="#a41e17"/><stop offset="1" stop-color="#6a100b"/></radialGradient></defs>
    <path d="${blob}" fill="url(#pgWax)" stroke="#560d09" stroke-width="1.2"/>
    <circle r="37" fill="none" stroke="#560d09" stroke-width="1.1" opacity=".75"/><circle cx="-.6" cy="-.6" r="36" fill="none" stroke="#f08a78" stroke-width=".8" opacity=".55"/>
    <circle r="19" fill="#8e1812" stroke="#560d09" stroke-width="1.3"/><circle cx="-.6" cy="-.6" r="18" fill="none" stroke="#e8705e" stroke-width=".8" opacity=".6"/>
    <text font-family="'Old Standard TT',Georgia,serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="#fff3e4" stroke="#43090600" text-anchor="middle"><textPath href="#pgSealTop" startOffset="50%">ЛЕГЕНДА</textPath></text>
    <text font-family="'Old Standard TT',Georgia,serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="none" stroke="#430906" stroke-width="2.6" stroke-linejoin="round" text-anchor="middle" opacity=".9" style="mix-blend-mode:multiply"><textPath href="#pgSealTop" startOffset="50%">ЛЕГЕНДА</textPath></text>
    <text font-family="'Old Standard TT',Georgia,serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="#fff3e4" text-anchor="middle"><textPath href="#pgSealTop" startOffset="50%">ЛЕГЕНДА</textPath></text>
    ${dots}<path d="${star}" fill="#f2c94c" stroke="#5a0c08" stroke-width="1" stroke-linejoin="round"/>
    <path d="M-30 -20 Q-18 -34 2 -34" stroke="#ffb0a0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/></svg>`;
})();
/* ----- the grand entrance: the medallion flares, the table goes dim between cinema bars, rays turn, the card bursts out of the
   medallion, turns over in the middle, the wax seal stamps it with a shockwave, the name unfurls; then the card collapses into
   a golden orb that flies to the target ----- */
async function legendIntro(root, key, target){
  const L = LEG[key], owner = matOf(root, NAMES[L.owner]);
  const medal = owner.querySelector('.leg') || owner.querySelector('.mh'), mb = rootBox(root, medal);
  const hi = layerSvg(root, 38), cx = 532, cy = 262;
  // 1. the medallion flares and calls
  A(medal, [{transform: 'scale(1)', filter: 'none'}, {transform: 'scale(2.2)', filter: 'drop-shadow(0 0 12px #ffd27a) brightness(1.8)', offset: .45}, {transform: 'scale(1.3)', filter: 'drop-shadow(0 0 6px #ffd27a) brightness(1.3)'}], 900);
  for(let i = 0; i < 3; i++) circRing(hi, mb.cx, mb.cy, 4, 70, '#ffd27a', 900, i * 160, 3 - i);
  goldBurst(hi, mb.cx, mb.cy, 24, 10, 60);
  // 2. the stage: dim + vignette, cinema bars with gold lines, slow rays behind the middle
  const back = document.createElement('div'); back.className = 'pg-lback'; root.appendChild(back);
  const barT = document.createElement('div'), barB = document.createElement('div'); barT.className = barB.className = 'pg-lbar'; barT.style.top = '0'; barB.style.bottom = '0'; root.append(barT, barB);
  const rays = document.createElement('div'); rays.className = 'pg-lrays'; root.appendChild(rays);
  A(back, [{opacity: 0}, {opacity: 1}], 500, 200); A(rays, [{opacity: 0, transform: 'translate(-50%,-50%) scale(.6)'}, {opacity: 1, transform: 'translate(-50%,-50%) scale(1)'}], 900, 500);
  A(barT, [{transform: 'translateY(-100%)'}, {transform: 'translateY(0)'}], 450, 250, 'cubic-bezier(.2,.8,.3,1)'); A(barB, [{transform: 'translateY(100%)'}, {transform: 'translateY(0)'}], 450, 250, 'cubic-bezier(.2,.8,.3,1)');
  motes(root, 46, 120, 940, 380, 560);
  // 3. the card bursts out of the medallion along an arc, grows, turns over
  const card = document.createElement('div'); card.className = 'pg-lcard'; card.innerHTML = legendCardHTML(key); root.appendChild(card);
  const trail = []; for(let i = 0; i < 6; i++){ const t = sv(hi, `<circle r="${6 - i * .8}" fill="#ffd27a" opacity="${R1(.7 - i * .1)}"/>`).firstChild; trail.push(t); }
  const path = qpts(mb.cx, mb.cy, (mb.cx + cx) / 2 + (mb.cx < cx ? -60 : 60), Math.max(190, Math.min(mb.cy, cy) - 140), cx, cy, 24);
  await vwait(350);
  A(card, path.map(([x, y], i) => ({transform: `translate(${R1(x - 124)}px,${R1(y - 186)}px) scale(${R1(.08 + .92 * Math.pow(i / 24, 1.6))}) rotate(${R1((1 - i / 24) * -24)}deg)`})), 760, 0, 'cubic-bezier(.3,.1,.2,1)');
  trail.forEach((t, i) => A(t, path.map(([x, y]) => ({transform: `translate(${R1(x)}px,${R1(y)}px)`})), 760, i * 40, 'cubic-bezier(.3,.1,.2,1)'));
  A(card.querySelector('.pg-lc-back'), [{transform: 'rotateY(0)'}, {transform: 'rotateY(0)', offset: .6}, {transform: 'rotateY(180deg)'}], 1150, 0, 'ease-in-out');
  A(card.querySelector('.pg-lc-face'), [{transform: 'rotateY(-180deg)'}, {transform: 'rotateY(-180deg)', offset: .6}, {transform: 'rotateY(0)'}], 1150, 0, 'ease-in-out');
  await vwait(780); trail.forEach(t => t.remove());
  // 4. the landing: a shockwave, a gold burst, the table shakes, a soft gold flash
  flashRoot(root, '#ffe7a4', .28, 380); shakeEl(root.querySelector('[data-pg="board"]'), 5, 420);
  circRing(hi, cx, cy, 40, 420, '#ffe7a4', 900, 0, 5); circRing(hi, cx, cy, 30, 300, '#fff6d8', 700, 120, 2);
  goldBurst(hi, cx, cy, 60, 120, 320);
  await vwait(420);
  // 5. the wax seal «ЛЕГЕНДА» stamps the card
  const seal = document.createElement('div'); seal.className = 'pg-lseal';
  seal.innerHTML = SEAL_HTML;
  root.appendChild(seal);
  A(seal, [{transform: 'translate(-50%,-50%) scale(3.2) rotate(-40deg)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(.86) rotate(6deg)', opacity: 1, offset: .7}, {transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1}], 360, 0, 'cubic-bezier(.6,0,.9,.5)');
  await vwait(300);
  shakeEl(card, 6, 300); circRing(hi, cx + 110, cy + 172, 10, 90, '#f6d9c8', 600, 0, 3); goldBurst(hi, cx + 110, cy + 172, 20, 20, 80);
  // 6. the name unfurls under the card, letter by letter
  const ban = document.createElement('div'); ban.className = 'pg-lban'; ban.innerHTML = [...L.name.toUpperCase()].map((ch, i) => `<span style="animation-delay:${(i * .04 / speed).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  root.appendChild(ban); A(ban, [{transform: 'translateX(-50%) scaleX(.1)', opacity: 0}, {transform: 'translateX(-50%) scaleX(1.04)', opacity: 1, offset: .6}, {transform: 'translateX(-50%) scaleX(1)', opacity: 1}], 520, 0, 'cubic-bezier(.2,.8,.3,1)');
  card.classList.add('pg-shine-on');
  await vwait(1700);
  // 7. the card collapses into a golden orb that flies to the target
  A(ban, [{opacity: 1}, {opacity: 0, transform: 'translateX(-50%) scaleX(.6)'}], 300);
  A(seal, [{opacity: 1}, {opacity: 0, transform: 'translate(-50%,-50%) scale(.4)'}], 300);
  A(card, [{transform: 'translate(408px,76px) scale(1) rotate(0)', filter: 'brightness(1)'}, {transform: 'translate(408px,76px) scale(1.06) rotate(0)', filter: 'brightness(1.4)', offset: .3}, {transform: 'translate(408px,76px) scale(.04) rotate(25deg)', filter: 'brightness(3)'}], 520, 0, 'cubic-bezier(.6,0,.9,.4)');
  await vwait(470); card.remove(); ban.remove(); seal.remove();
  const orb = sv(hi, `<g><circle r="22" fill="#ffd27a" opacity=".35"/><circle r="11" fill="#fff1c0"/><circle r="5" fill="#fff"/></g>`).firstChild;
  const to = target || {x: cx, y: cy};
  const op = qpts(cx, cy, (cx + to.x) / 2, Math.min(cy, to.y) - 80, to.x, to.y, 20);
  A(orb, op.map(([x, y]) => ({transform: `translate(${R1(x)}px,${R1(y)}px)`})), 560, 0, 'cubic-bezier(.5,0,.7,1)');
  for(let i = 1; i <= 6; i++){ const t = sv(hi, `<circle r="${R1(8 - i)}" fill="#ffd27a" opacity="${R1(.6 - i * .08)}"/>`).firstChild; A(t, op.map(([x, y]) => ({transform: `translate(${R1(x)}px,${R1(y)}px)`})), 560, i * 30, 'cubic-bezier(.5,0,.7,1)'); }
  A(back, [{opacity: 1}, {opacity: 0}], 700); A(rays, [{opacity: 1}, {opacity: 0}], 600);
  A(barT, [{transform: 'translateY(0)'}, {transform: 'translateY(-100%)'}], 500, 300); A(barB, [{transform: 'translateY(0)'}, {transform: 'translateY(100%)'}], 500, 300);
  await vwait(580);
  circRing(hi, to.x, to.y, 8, 120, '#ffe7a4', 700, 0, 4); goldBurst(hi, to.x, to.y, 30, 20, 110);
  setTimeout(() => { rays.remove(); barT.remove(); barB.remove(); hi.remove(); back.remove(); }, dur(900));
  return null;
}
const endBack = () => {};


/* a crack in the wood: a tapered jagged split with forks, a lit lower edge, a dark inner shadow, chips at the start; revealed by a growing circle */
function crackArt(uid, x0, y0, len, ang, w0 = 4){
  const walk = (x, y, a0, L) => { const pts = [[x, y]]; let a = a0; for(let d = 0; d < L;){ const kink = Math.random() < .28; a = a0 + Math.max(-.32, Math.min(.32, a - a0 + rnd(-.22, .22))); const aa = kink ? a + (Math.random() < .5 ? -1 : 1) * rnd(.45, .75) : a, st = kink ? rnd(3, 6) : rnd(7, 15); d += st; x += Math.cos(aa) * st; y += Math.sin(aa) * st; pts.push([x, y]); } return pts; };
  const poly = (pts, w) => { const L = [], Rr = []; pts.forEach(([px, py], i) => { const [qx, qy] = pts[Math.min(i + 1, pts.length - 1)], [ox, oy] = pts[Math.max(i - 1, 0)]; const dx = qx - ox, dy = qy - oy, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, ww = w * Math.pow(1 - i / (pts.length - 1), 1.1) + .15;
      const j1 = rnd(.4, 1.4), j2 = rnd(.4, 1.4); L.push([px + nx * ww * j1, py + ny * ww * j1]); Rr.push([px - nx * ww * j2, py - ny * ww * j2]); });
    return 'M' + L.concat(Rr.reverse()).map(([a, b]) => `${R1(a)} ${R1(b)}`).join(' L') + ' Z'; };
  const line = pts => 'M' + pts.map(([a, b]) => `${R1(a)} ${R1(b)}`).join(' L');
  const main = walk(x0, y0, ang, len, w0), parts = [[main, w0]];
  for(let k = 0; k < 3; k++){ const i = Math.floor(rnd(1, main.length * .75)), [bx, by] = main[i], wi = w0 * (1 - i / main.length) * .55; parts.push([walk(bx, by, ang + (k % 2 ? 1 : -1) * rnd(.35, .7), rnd(8, 22)), wi]); }
  const chips = Array.from({length: 5}, () => { const a = rnd(0, Math.PI * 2), r = rnd(3, 9), cx = x0 + Math.cos(a) * r, cy = Math.max(1, y0 + Math.abs(Math.sin(a)) * r); return `<path d="M${R1(cx)} ${R1(cy)} l${R1(rnd(-3, 3))} ${R1(rnd(1, 3))} l${R1(rnd(1, 3))} ${R1(rnd(-1, 2))} Z" fill="#2a1a0c" opacity=".8"/>`; }).join('');
  return `<g><defs><mask id="pgCr${uid}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="${R1(x0 + len + 200)}" height="${R1(len + 200)}"><circle class="rv" r="${R1(len * 1.15)}" fill="#fff" style="transform:translate(${R1(x0)}px,0px) scale(0)"/></mask></defs>
    <g mask="url(#pgCr${uid})">
      <ellipse cx="${R1(x0)}" cy="${R1(y0 + 3)}" rx="${R1(w0 * 3.4)}" ry="${R1(w0 * 1.8)}" fill="#5a3a1c" opacity=".18"/><path d="M${R1(x0 - 6)} ${R1(y0)} L${R1(x0 - 1)} ${R1(y0 + 6)} L${R1(x0 + 2)} ${R1(y0 + 2)} L${R1(x0 + 7)} ${R1(y0)} Z" fill="#1c1006"/>
      ${parts.map(([pts, w]) => `<path d="${line(pts)}" fill="none" stroke="#6b4a2a" stroke-width="${R1(w + 1.2)}" stroke-linecap="round" stroke-linejoin="round" opacity=".16"/>`).join('')}
      ${main.filter((_, i) => i % 2 && i < main.length - 2).map(([px, py], i) => `<path d="M${R1(px + (i % 2 ? 1.5 : -1.5))} ${R1(py)} l${i % 2 ? 3.4 : -3.4} ${R1(rnd(-1, 2))} l${i % 2 ? -1 : 1} ${R1(rnd(2, 4))} Z" fill="#ead6ac" stroke="#9a7444" stroke-width=".4"/>`).join('')}
      ${parts.map(([pts]) => `<path d="${line(pts.map(([a, b]) => [a + 1, b + 1.1]))}" fill="none" stroke="#fffaf0" stroke-width="1" stroke-linejoin="round" opacity=".85"/>`).join('')}
      ${parts.map(([pts, w]) => `<path d="${poly(pts, w)}" fill="#1c1006"/>`).join('')}
      ${parts.map(([pts, w]) => `<path d="${line(pts.map(([a, b]) => [a - w * .25, b - .4]))}" fill="none" stroke="#5a3418" stroke-width="${R1(Math.max(.6, w * .35))}" opacity=".9"/>`).join('')}
      ${chips}</g></g>`;
}

/* ----- Кракен: the beast under the sea, its eye, six arms out of the water, the squeeze, the ink stays ----- */
async function fxKraken(root){
  const m = matOf(root, NAMES['Ж']), d = matOf(root, NAMES['Г']), b = rootBox(root, m), inner = seaInnerOf(root), ib = rootBox(root, inner);
  const skull = [...d.querySelectorAll('svg')].find(s => s.parentNode.textContent.includes('Души')); const sk = rootBox(root, skull);
  soulsSet(d, () => 4);
  // three souls go out of the skull into the sea — the price
  const hi0 = layerSvg(root, 12);
  for(let i = 0; i < 3; i++){ const w = sv(hi0, `<g><circle r="10" fill="#7ff0b0" opacity=".25"/><circle r="4.4" fill="#effff4"/></g>`).firstChild; const p = qpts(sk.cx, sk.cy, sk.cx - 120 + i * 60, sk.cy + 80, b.cx - 100 + i * 100, b.y - 30, 18);
    A(w, p.map(([x, y]) => ({transform: `translate(${R1(x)}px,${R1(y)}px)`, opacity: 1})), 900, i * 150, 'ease-in'); }
  setTimeout(() => { soulsSet(d, () => 1); markAt(root, sk.cx + 10, sk.y - 14, '−3 Души'); }, dur(400));
  const back = await legendIntro(root, 'kraken', {x: b.cx, y: b.y - 24});
  hi0.remove();
  const [tx, ty] = toSea(root, b.cx, b.y);          // the target's sea edge (sea coords)
  const deep = seaSvg(inner, false, 'pg-tmp'), top = layerSvg(root, 14);
  // 1. the sea around the target turns dark and green; the shadow of the beast glides under it
  deep.innerHTML = `<defs><radialGradient id="pgKrDeep"><stop offset="0" stop-color="#05140f" stop-opacity=".85"/><stop offset=".6" stop-color="#0c2a22" stop-opacity=".55"/><stop offset="1" stop-color="#0c2a22" stop-opacity="0"/></radialGradient><filter id="pgKrBlur"><feGaussianBlur stdDeviation="8"/></filter></defs>
    <ellipse cx="${R1(tx)}" cy="${R1(ty - 30)}" rx="330" ry="110" fill="url(#pgKrDeep)"/>`;
  A(deep, [{opacity: 0}, {opacity: 1}], 900);
  const shadow = sv(deep, `<g filter="url(#pgKrBlur)" opacity=".75"><ellipse cx="0" cy="0" rx="130" ry="42" fill="#020806"/>${[-1, 1].map(s => [0, 1, 2].map(i => `<path d="M${s * 90} ${-10 + i * 12} q${s * 60} ${-20 + i * 20} ${s * 120} ${10 + i * 6}" stroke="#020806" stroke-width="${14 - i * 3}" fill="none" stroke-linecap="round"/>`).join('')).join('')}</g>`).firstChild;
  A(shadow, [{transform: `translate(${R1(tx - 520)}px,${R1(ty - 40)}px) scale(.8)`}, {transform: `translate(${R1(tx)}px,${R1(ty - 30)}px) scale(1.1)`}], 1500, 0, 'cubic-bezier(.3,.1,.3,1)');
  // bubbles boil
  for(let i = 0; i < 46; i++){ const x = tx + rnd(-260, 260), y = ty - rnd(4, 80); const c = sv(deep, `<circle r="${R1(rnd(1.4, 4.6))}" fill="rgba(210,240,236,.15)" stroke="#d9f2ec" stroke-width=".9"/>`).firstChild;
    A(c, [{transform: `translate(${R1(x)}px,${R1(y)}px) scale(.4)`, opacity: 0}, {opacity: 1, offset: .2}, {transform: `translate(${R1(x + rnd(-6, 6))}px,${R1(y - rnd(14, 34))}px) scale(1.1)`, opacity: 0}], rnd(700, 1300), rnd(400, 2600)); }
  await vwait(1300);
  // 2. the eye opens in the water by the target, looks, blinks
  const eye = sv(deep, `<g><ellipse rx="40" ry="20" fill="#06100c" opacity=".8"/><ellipse rx="34" ry="16" fill="#0a1a14"/><ellipse class="lid" rx="26" ry="11" fill="#f2c94c" stroke="#3a2a0c" stroke-width="1.4"/><ellipse rx="3.4" ry="10" fill="#060606"/><circle cx="-8" cy="-4" r="2.4" fill="#fff" opacity=".8"/></g>`).firstChild;
  const ex = tx + 40, ey = ty - 56;
  A(eye, [{transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,0)`}, {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,1)`, offset: .2}, {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,1)`, offset: .45}, {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,.08)`, offset: .5}, {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,1)`, offset: .56}, {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,1)`, offset: .92}, {transform: `translate(${R1(ex)}px,${R1(ey)}px) scale(1,0)`}], 5200);
  await vwait(800);
  // 3. arms burst out of the water: three around the target, three right at its edge — those will grip
  const spots = [[b.x + 40, b.y + 8, 0, 1.3, -14], [b.x + b.w - 36, b.y + 8, 1, 1.3, 14], [b.x + b.w + 18, b.y + b.h * .55, 1, 1.15, 26]];
  const arms = spots.map(([x, y, fl, k, rot], i) => { waterColumn(top, x, y, 44);
    const g = sv(top, `<g><g class="pg-arm" style="animation-delay:${(i * .23).toFixed(2)}s"><g transform="scale(${fl ? -1 : 1} 1)">${TENT('a' + i, k, 1.5)}</g></g></g>`).firstChild;
    A(g, [{transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${rot}deg) scale(1,0)`}, {transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${rot}deg) scale(1,1.15)`, offset: .6}, {transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${rot}deg) scale(1,1)`}], 700, i * 160, 'cubic-bezier(.2,1.3,.5,1)');
    return {g, x, y, rot}; });
  const gripX = [b.w * .3, b.w * .55, b.w * .78];                 // where the arms grip — and where the plank will split
  const grips = gripX.map((x0, i) => { const x = b.x + x0, y = b.y + 3; waterColumn(top, x, y - 2, 50);
    const g = sv(top, `<g><g class="gin">${TENT('g' + i, .92, 1.35)}</g></g>`).firstChild;
    A(g, [{transform: `translate(${R1(x)}px,${R1(y)}px) rotate(0deg) scale(1,0)`}, {transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${i % 2 ? 6 : -6}deg) scale(1,1.15)`, offset: .6}, {transform: `translate(${R1(x)}px,${R1(y)}px) rotate(0deg) scale(1,1)`}], 700, 350 + i * 180, 'cubic-bezier(.2,1.3,.5,1)');
    return {g, x, y, s: i % 2 ? 1 : -1}; });
  await vwait(1500);
  // 4. the three arms fall over the plank and lie across it; each squeezes in turn — and right under it the wood splits
  const kY = R1((b.h - 6) / 146 / .92 * 100) / 100;
  grips.forEach((a, i) => A(a.g, [{transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(0deg) scale(1,1)`}, {transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 95}deg) scale(1,.9)`, offset: .55}, {transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 180}deg) scale(1,${kY})`}], 420, i * 110, 'cubic-bezier(.6,0,.9,.5)'));
  await vwait(560);
  grips.forEach((a, i) => { const f = rootBox(root, m); splinters(top, a.x, f.y + 6, 5); sparks(top, a.x, f.y + 4, 4, ['#e9d29a', '#a8703a', '#fff']); });
  const cracks = scar(document.createElementNS(NS, 'svg'), 'state', 'Ж'); cracks.setAttribute('width', R1(b.w)); cracks.setAttribute('height', R1(b.h)); cracks.setAttribute('style', 'position:absolute;left:0;top:0;pointer-events:none;z-index:5'); m.appendChild(cracks);
  const marks = scar(document.createElementNS(NS, 'svg'), 'turn', 'Ж'); marks.setAttribute('width', R1(b.w)); marks.setAttribute('height', R1(b.h)); marks.setAttribute('style', 'position:absolute;left:0;top:0;pointer-events:none;z-index:4;mix-blend-mode:multiply'); m.appendChild(marks);
  for(let k = 0; k < 3; k++){
    const a = grips[k], x0 = gripX[k];
    const g = sv(cracks, crackArt(`k${k}${Date.now() % 1e5}`, x0, 0, b.h * rnd(.82, .98), Math.PI / 2 + rnd(-.14, .14), rnd(2.8, 3.6))).firstChild;
    A(g.querySelector('.rv'), [{transform: `translate(${R1(x0)}px,0px) scale(0)`}, {transform: `translate(${R1(x0)}px,0px) scale(1)`}], 520, 60, 'cubic-bezier(.2,.9,.3,1)');
    A(a.g.querySelector('.gin'), [{transform: 'scale(1,1)'}, {transform: 'scale(1.22,.96)', offset: .4}, {transform: 'scale(1.08,1)'}], 440, 0, 'ease-in-out');
    A(m, [{scale: '1 1'}, {scale: '.97 .92', offset: .4}, {scale: '1 1'}], 440, 0, 'ease-in-out');
    shakeEl(root.querySelector('[data-pg="board"]'), 4, 300); flashRoot(root, '#0b1f18', .16, 300);
    splinters(top, a.x, b.y + b.h * .5, 4);
    await vwait(480);
  }
  // the sucker rings stay along each crack where the arm lay
  sv(marks, gripX.map(x0 => Array.from({length: Math.floor((b.h - 14) / 11)}, (_, k) => `<ellipse cx="${R1(x0 + (k % 2 ? 6 : -6))}" cy="${R1(10 + k * 11)}" rx="${R1(4.2 - k * .3)}" ry="${R1(3.6 - k * .26)}" fill="rgba(120,40,56,.14)" stroke="#6e2a34" stroke-width="1" opacity=".6"/>`).join('')).join(''));
  // 5. the planks of the Hull break off, two sailors are dragged into the sea
  const hc = cellsOf(m, 'корпус'), hn = numOf(m, 'корпус'), hv = parseInt(hn.textContent, 10);
  const cc = cellsOf(m, 'команда'), cn = numOf(m, 'команда'), cv = parseInt(cn.textContent, 10);
  for(const cell of hc.slice(Math.max(0, hv - 4), hv).reverse()){ const cb = rootBox(root, cell); splinters(top, cb.cx, cb.cy, 6);
    const fl = document.createElement('div'); fl.className = 'pg-keg-fly'; fl.innerHTML = cell.outerHTML; root.appendChild(fl); swapIcon(cell, CELLS2.HULL_X);
    A(fl, [{transform: `translate(${cb.x}px,${cb.y}px) rotate(0)`, opacity: 1}, {transform: `translate(${R1(cb.x + rnd(-60, 60))}px,${R1(cb.y - 70)}px) rotate(${R1(rnd(-300, 300))}deg)`, opacity: 1, offset: .45}, {transform: `translate(${R1(cb.x + rnd(-90, 90))}px,${R1(b.y - 20)}px) rotate(${R1(rnd(-600, 600))}deg)`, opacity: 0}], 900, 0, 'cubic-bezier(.3,.1,.7,1)');
    setTimeout(() => fl.remove(), dur(950)); await vwait(170); }
  for(const [j, cell] of cc.slice(Math.max(0, cv - 2), cv).entries()){ const cb = rootBox(root, cell); const a = arms[j];
    const fl = document.createElement('div'); fl.className = 'pg-keg-fly'; fl.innerHTML = cell.outerHTML.replace('width="14" height="17"', 'width="20" height="24"'); root.appendChild(fl); swapIcon(cell, CELLS2.CREW_X);
    A(fl, [{transform: `translate(${cb.x}px,${cb.y}px) rotate(0)`}, {transform: `translate(${R1(a.x)}px,${R1(a.y - 120)}px) rotate(-200deg)`, offset: .6}, {transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(-360deg) scale(.5)`, opacity: 0}], 900, 0, 'cubic-bezier(.4,0,.6,1)');
    setTimeout(() => { fl.remove(); waterColumn(top, a.x, a.y, 36); }, dur(900)); await vwait(220); }
  setNum(hn, Math.max(0, hv - 4)); setNum(cn, Math.max(0, cv - 2));
  const nb = rootBox(root, hn); markAt(root, nb.x + 24, nb.y - 13, '−4 Корпус'); const cnb = rootBox(root, cn); markAt(root, cnb.x + 24, cnb.y - 13, '−2 Команды');
  await vwait(800);
  // 6. the beast lets go: an ink cloud bursts and stays on the sea, the arms slide down into it
  const ink = scar(seaSvg(inner, false, 'pg-debris'), 'turn');
  ink.innerHTML = `<defs><filter id="pgInk" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"><animate attributeName="baseFrequency" values=".035;.045;.035" dur="9s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="26"/><feGaussianBlur stdDeviation="2"/></filter></defs>
    <g filter="url(#pgInk)">${Array.from({length: 7}, (_, i) => `<ellipse cx="${R1(tx + (i - 3) * 62)}" cy="${R1(ty - 28 + (i % 2) * 14)}" rx="${R1(rnd(46, 70))}" ry="${R1(rnd(18, 28))}" fill="#08100e" opacity=".7"/>`).join('')}</g>
    ${Array.from({length: 6}, () => `<circle cx="${R1(tx + rnd(-200, 200))}" cy="${R1(ty - 20)}" r="${R1(rnd(1.5, 3))}" fill="none" stroke="#cfe8e2" stroke-width=".8"><animate attributeName="cy" values="${R1(ty - 10)};${R1(ty - 60)}" dur="${R1(rnd(2, 3.4))}s" begin="${R1(-rnd(0, 3))}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="${R1(rnd(2, 3.4))}s" begin="${R1(-rnd(0, 3))}s" repeatCount="indefinite"/></circle>`).join('')}`;
  A(ink, [{opacity: 0, transform: 'scale(.6)'}, {opacity: 1, transform: 'scale(1)'}], 900, 0, 'cubic-bezier(.2,.8,.3,1)'); ink.style.transformOrigin = `${R1(tx)}px ${R1(ty - 28)}px`;
  arms.forEach((a, i) => { A(a.g, [{opacity: 1, transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.rot}deg) scale(1,1)`}, {opacity: 0, transform: `translate(${R1(a.x)}px,${R1(a.y + 30)}px) rotate(${a.rot}deg) scale(1,0)`}], 700, i * 90, 'ease-in'); setTimeout(() => waterColumn(top, a.x, a.y, 28), dur(500 + i * 90)); });
  grips.forEach((a, i) => { A(a.g, [{transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 180}deg) scale(1,${kY})`}, {transform: `translate(${R1(a.x)}px,${R1(a.y)}px) rotate(${a.s * 20}deg) scale(1,.9)`, offset: .5}, {transform: `translate(${R1(a.x)}px,${R1(a.y + 20)}px) rotate(0deg) scale(1,0)`, opacity: .6}], 800, 150 + i * 100, 'ease-in-out'); setTimeout(() => waterColumn(top, a.x, a.y, 32), dur(700 + i * 100)); });
  scar(deep, 'short');
  endBack(back);
  await vwait(1600); top.remove();
}

/* ----- Армада Компании: a line of battle comes in from the horizon, fires a rippling broadside at both Pirates, the smoke stays ----- */
async function fxArmada(root){
  const inner = seaInnerOf(root), ib = rootBox(root, inner), P = [matOf(root, NAMES['Ж']), matOf(root, NAMES['М'])];
  const back = await legendIntro(root, 'armada', {x: ib.x + 900, y: ib.y + 204});
  const sea = seaSvg(inner, false, 'pg-debris'), top = layerSvg(root, 12);
  const y = 222, xs = [120, 275, 430, 585, 740, 895];
  // the haze of the horizon on the right
  const haze = sv(sea, `<g><ellipse cx="1000" cy="${y - 10}" rx="160" ry="70" fill="#e6eaec" opacity=".7"/><ellipse cx="960" cy="${y + 20}" rx="120" ry="40" fill="#f2f4f5" opacity=".6"/></g>`).firstChild;
  A(haze, [{opacity: 0}, {opacity: 1, offset: .3}, {opacity: 0}], 3600);
  // the line comes in, each ship with its wake and bow wave
  const ships = xs.map((x, i) => { const g = sv(sea, `<g><g class="pg-pitch" style="animation-delay:${(i * .31).toFixed(2)}s">
      <path d="M40 2 C70 4 110 10 160 6 M40 6 C70 10 110 18 160 16" fill="none" stroke="#eef6f8" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      <path d="M-46 1 q-8 2 -12 6 M-46 4 q-6 3 -9 8" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <g class="pg-recoil">${bigShip('company', 0, 0, .86)}</g></g></g>`).firstChild;
    A(g, [{transform: `translate(${1120 + i * 90}px,${y - (i % 2) * 6}px)`, opacity: 0}, {opacity: 1, offset: .15}, {transform: `translate(${x}px,${y - (i % 2) * 6}px)`, opacity: 1}], 2200, i * 160, 'cubic-bezier(.2,.6,.3,1)'); return [g, x, y - (i % 2) * 6]; });
  await vwait(3000);
  // a signal flag goes up on the flagship, then the broadside ripples down the line
  for(const [ti, m] of P.entries()){
    const tb = rootBox(root, m), tf = facing(root, m);
    for(const [j, [g, x, yy]] of ships.entries()){
      await vwait(70);
      const gx = ib.x + x, gy = ib.y + yy - 16;
      // the ship heels from the recoil, her side lit by the flashes; a ring of smoke rolls off the water
      const rc = g.querySelector('.pg-recoil'), dir = ti ? 1 : -1;
      if(rc) A(rc, [{transform: 'rotate(0deg) translate(0,0)', filter: 'brightness(1)'}, {transform: `rotate(${dir * 2.6}deg) translate(${-dir * 3}px,0)`, filter: 'brightness(1.45) saturate(1.2)', offset: .12}, {transform: `rotate(${-dir * .8}deg) translate(0,0)`, filter: 'brightness(1)', offset: .55}, {transform: 'rotate(0deg) translate(0,0)', filter: 'brightness(1)'}], 900, 0, 'ease-out');
      circRing(sea, x, yy + 2, 20, 70, '#eef3f4', 900, 60, 1.6);
      for(let k = 0; k < 3; k++){ const px = gx - 26 + k * 22, hx = tb.x + rnd(30, tb.w - 30), hy = tf.y + rnd(4, 16), miss = Math.random() < .35;
        const ex = miss ? hx + rnd(-30, 30) : hx, ey = miss ? tf.y - rnd(14, 34) : hy, ang = Math.atan2(ey - gy, ex - px);
        setTimeout(() => { gunFire(top, px, gy, ang, .62, {puffs: 5, grains: 5, life: 4800}); if(k === 1) boom(root, 2.4, 220);
          ballFly(top, px, gy, ex, ey, 420, 12).then(() => { if(miss) missSplash(top, ex, ey, .8); else hitBlast(top, ex, ey, .55, root); }); }, dur(k * 40));
      }
    }
    await vwait(500);
    flashRoot(root, '#fff6d8', .22, 300); shakeEl(m, 7, 520);
    const hc = cellsOf(m, 'корпус'), hn = numOf(m, 'корпус'), hv = parseInt(hn.textContent, 10);
    const sc = cellsOf(m, 'паруса'), sn = numOf(m, 'паруса'), s2 = parseInt(sn.textContent, 10);
    hc.slice(Math.max(0, hv - 2), hv).forEach(c => { const cb = rootBox(root, c); splinters(top, cb.cx, cb.cy, 5); swapIcon(c, CELLS2.HULL_X); });
    sc.slice(Math.max(0, s2 - 1), s2).forEach(c => { const cb = rootBox(root, c); sparks(top, cb.cx, cb.cy, 10); swapIcon(c, CELLS2.SAIL_X); });
    setNum(hn, Math.max(0, hv - 2)); setNum(sn, Math.max(0, s2 - 1));
    const nb = rootBox(root, hn); markAt(root, nb.x + 24, nb.y - 13, '−2 Корпус'); const snb = rootBox(root, sn); markAt(root, snb.x + 24, snb.y - 13, '−1 Парус');
    await vwait(700);
  }
  // the smoke of the broadside stays over the sea and drifts; the fleet sails away into it
  const smoke = scar(seaSvg(inner, false, 'pg-debris'), 'turn');
  smoke.innerHTML = `<defs><radialGradient id="pgArmS"><stop offset="0" stop-color="#eeebe4" stop-opacity=".8"/><stop offset="1" stop-color="#eeebe4" stop-opacity="0"/></radialGradient></defs>
    ${Array.from({length: 14}, (_, i) => `<ellipse cx="${100 + i * 64}" cy="${R1(y + rnd(-26, 26))}" rx="${R1(rnd(50, 80))}" ry="${R1(rnd(20, 32))}" fill="url(#pgArmS)"><animate attributeName="cx" values="${100 + i * 64};${100 + i * 64 + 60}" dur="22s" fill="freeze"/></ellipse>`).join('')}`;
  A(smoke, [{opacity: 0}, {opacity: 1}], 1200);
  ships.forEach(([g, x, yy], i) => A(g, [{transform: `translate(${x}px,${yy}px)`, opacity: 1}, {transform: `translate(${x - 1000}px,${yy}px)`, opacity: 0}], 3200, i * 120, 'cubic-bezier(.5,0,.8,.6)'));
  endBack(back);
  await vwait(2400); top.remove(); setTimeout(() => ships.forEach(([g]) => g.remove()), dur(1600));
}

/* ----- Корабль в бутылке: a glass bottle draws itself, a vortex of sparks pulls «Индевор» into it, the cork pops in from «Месть»,
   the bottle falls into the sea and floats there ----- */
/* the bottle lies on its side, the neck to the right; origin — the middle of the body; the mouth is at (112, 0) */
const BOTTLE_PATH = 'M-82 -44 H40 C62 -44 72 -30 80 -15 H103 V-19 H112 V19 H103 V15 H80 C72 30 62 44 40 44 H-82 C-96 44 -100 36 -100 22 V-22 C-100 -36 -96 -44 -82 -44 Z';
const BOTTLE_SEA = 'M-104 26' + ' q9 -5 18 0 t18 0'.repeat(1) + ' t18 0'.repeat(11) + ' V60 H-104 Z';
const CORK = `<g><rect x="-11" y="-13" width="22" height="26" rx="3.5" fill="#c9a06a" stroke="#5a3a1c" stroke-width="1.6"/><path d="M-5 -10 v20 M2 -11 v22" stroke="#9a7444" stroke-width="1"/><path d="M-8 -8 h3 M3 5 h3" stroke="#ead0a4" stroke-width="1"/></g>`;
function bottleArt(o = {}){
  return `<defs><clipPath id="pgBotClip"><path d="${BOTTLE_PATH}"/></clipPath><linearGradient id="pgBotG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0fbf6" stop-opacity=".6"/><stop offset=".45" stop-color="#bfe3d6" stop-opacity=".2"/><stop offset="1" stop-color="#6fae98" stop-opacity=".45"/></linearGradient></defs>
    <path class="gfill" d="${BOTTLE_PATH}" fill="url(#pgBotG)"/>
    <g clip-path="url(#pgBotClip)">${o.ship ? bigShip(o.kind || 'merchant', -24, 28, .62) : ''}<path class="bsea" d="${BOTTLE_SEA}" fill="#4f88a0" opacity=".62"/><path d="M-104 26 q9 -5 18 0${' t18 0'.repeat(12)}" fill="none" stroke="#dff1f4" stroke-width="1.4" opacity=".8"/></g>
    <path class="glass" d="${BOTTLE_PATH}" fill="none" stroke="#e8f7f0" stroke-width="3" stroke-linejoin="round"/>
    <path d="${BOTTLE_PATH}" fill="none" stroke="#2f5a4a" stroke-width=".8" opacity=".55" transform="translate(0 1.4)"/>
    <ellipse cx="-95" cy="0" rx="4" ry="26" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".35"/>
    <g class="hl"><path d="M-82 -35 H38 C52 -35 60 -31 66 -25" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6"/><path d="M-70 35 H-26" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/><path d="M86 -9 H100" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".65"/></g>
    ${o.cork ? `<g transform="translate(118 0)">${CORK}</g>` : ''}`;
}

/* ----- Корабль в бутылке: a glass bottle draws itself on its side, a vortex of sparks pulls «Индевор» in through the neck, the cork
   flies in from «Месть» — «чпок», the bottle drops onto the sea and floats there ----- */
const SHIP_KIND = {'Ж': 'pearl', 'М': 'revenge', 'И': 'endeavour', 'Г': 'dutch'};
async function fxBottle(root, tgt = 'И', by = 'М'){
  const m = matOf(root, NAMES[tgt]), rv = matOf(root, NAMES[by]), inner = seaInnerOf(root), kind = SHIP_KIND[tgt];
  const hn = numOf(m, 'корпус'), hc = cellsOf(m, 'корпус'), hmax = (hn.textContent.split('/')[1] || hc.length);
  hc.slice(3).forEach(c => swapIcon(c, CELLS2.HULL_X)); hn.textContent = '3/' + hmax;
  const b = rootBox(root, m);
  markAt(root, rootBox(root, hn).x + 24, rootBox(root, hn).y - 13, 'Корпус 3 — можно');
  await legendIntro(root, 'bottle', {x: b.cx, y: b.cy});
  const top = layerSvg(root, 40), BS = .82, bx0 = b.cx - 10, by0 = 262;
  const mouth = {x: bx0 + 112 * BS, y: by0};
  // 1. the target glows; sparks orbit it
  m.style.zIndex = 39; A(m, [{boxShadow: '0 0 0 0 rgba(127,240,176,0)'}, {boxShadow: '0 0 0 3px rgba(127,240,176,.9), 0 0 30px rgba(127,240,176,.7)', offset: .5}, {boxShadow: '0 0 0 2px rgba(127,240,176,.6), 0 0 18px rgba(127,240,176,.5)'}], 900);
  for(let i = 0; i < 24; i++){ const s = sv(top, `<path d="M0 -3 L.8 -.8 L3 0 L.8 .8 L0 3 L-.8 .8 L-3 0 L-.8 -.8 Z" fill="${i % 2 ? '#bfffd8' : '#ffe7a4'}"/>`).firstChild;
    const kf = Array.from({length: 13}, (_, k) => { const a = (k / 12 + i / 24) * Math.PI * 2; return {transform: `translate(${R1(b.cx + Math.cos(a) * (b.w * .58))}px,${R1(b.cy + Math.sin(a) * (b.h * .7))}px)`}; });
    A(s, kf, 2200, i * 30, 'linear'); }
  // 2. the bottle draws itself in glass, then fills with light, the painted sea, the glints
  const bot = sv(top, `<g transform="translate(${bx0} ${by0}) scale(${BS})">${bottleArt()}</g>`).firstChild;
  const glass = bot.querySelector('.glass'), L = glass.getTotalLength(); glass.style.strokeDasharray = L;
  A(glass, [{strokeDashoffset: L}, {strokeDashoffset: 0}], 1000, 300, 'ease-in-out');
  [bot.querySelector('.gfill'), bot.querySelector('.hl'), ...bot.querySelectorAll('g[clip-path], ellipse')].forEach(e => A(e, [{opacity: 0}, {opacity: 1}], 500, 1150));
  for(let i = 0; i < 10; i++){ const g = sv(top, `<path d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z" fill="#fff"/>`).firstChild; const x = bx0 + rnd(-90, 100) * BS, y = by0 + rnd(-44, 44) * BS; A(g, [{transform: `translate(${R1(x)}px,${R1(y)}px) scale(0)`}, {transform: `translate(${R1(x)}px,${R1(y)}px) scale(1.2) rotate(45deg)`, offset: .5}, {transform: `translate(${R1(x)}px,${R1(y)}px) scale(0) rotate(90deg)`}], 600, 1100 + i * 70); }
  await vwait(1600);
  // 3. the vortex: the plank spirals and shrinks into the mouth; a funnel of sparks goes with it
  const dx = mouth.x - b.cx, dy = mouth.y - b.cy;
  m.style.transformOrigin = '50% 50%';
  A(m, Array.from({length: 21}, (_, k) => { const t = k / 20, sw = (1 - t) * 60 * Math.sin(t * Math.PI * 3); return {transform: `translate(${R1(dx * t + sw)}px,${R1(dy * t - sw * .4)}px) rotate(${R1(t * 540)}deg) scale(${R1(1 - .97 * Math.pow(t, .8))})`}; }), 1500, 0, 'cubic-bezier(.5,0,.6,1)');
  for(let i = 0; i < 46; i++){ const s = sv(top, `<circle r="${R1(rnd(1.2, 2.8))}" fill="${i % 2 ? '#bfffd8' : '#ffe7a4'}"/>`).firstChild; const r0 = rnd(80, 210), a0 = rnd(0, 6.28);
    A(s, Array.from({length: 11}, (_, k) => { const t = k / 10, a = a0 + t * 9, r = r0 * (1 - t); return {transform: `translate(${R1(mouth.x + 40 * (1 - t) + Math.cos(a) * r)}px,${R1(mouth.y + Math.sin(a) * r * .6)}px)`, opacity: t < .9 ? 1 : 0}; }), 1300, rnd(0, 400), 'ease-in'); }
  await vwait(1480); m.style.opacity = '0';
  // 4. inside: a tiny «Индевор» rocks on the painted waves
  const mini = sv(top, `<g><g class="pg-rock">${bigShip(kind, 0, 0, .62)}</g></g>`).firstChild;
  A(mini, [{transform: `translate(${R1(mouth.x)}px,${R1(mouth.y)}px) scale(.05)`, opacity: 0}, {transform: `translate(${R1(bx0 - 24 * BS)}px,${R1(by0 + 27 * BS)}px) scale(${BS})`, opacity: 1}], 600, 0, 'cubic-bezier(.3,1.2,.6,1)');
  goldBurst(top, mouth.x, mouth.y, 24, 10, 70); circRing(top, mouth.x, mouth.y, 4, 40, '#bfffd8', 500, 0, 2);
  await vwait(650);
  // 5. the cork flies from the medallion of «Месть», spinning, and pops into the mouth
  const rmed = rootBox(root, rv.querySelector('.leg') || rv.querySelector('.mh'));
  const cork = sv(top, CORK).firstChild, cx = bx0 + 118 * BS;
  A(cork, qpts(rmed.cx, rmed.cy, (rmed.cx + cx) / 2 + 60, Math.min(rmed.cy, by0) - 150, cx + 14, by0, 20).map(([x, y], k) => ({transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${k * 36}deg) scale(${R1(BS * (.6 + k / 50))})`})), 800, 0, 'cubic-bezier(.4,0,.7,1)');
  await vwait(800);
  A(cork, [{transform: `translate(${R1(cx + 14)}px,${by0}px) scale(${BS})`}, {transform: `translate(${R1(cx - 3)}px,${by0}px) scale(${BS * 1.08},${BS * .9})`, offset: .5}, {transform: `translate(${R1(cx)}px,${by0}px) scale(${BS})`}], 220, 0, 'cubic-bezier(.6,0,.4,1)');
  await vwait(160);
  const pop = document.createElement('div'); pop.className = 'pg-pop'; pop.textContent = 'чпок!'; pop.style.left = (cx + 30) + 'px'; pop.style.top = (by0 - 54) + 'px'; root.appendChild(pop);
  A(pop, [{transform: 'scale(.3) rotate(-14deg)', opacity: 0}, {transform: 'scale(1.15) rotate(-8deg)', opacity: 1, offset: .25}, {transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: .8}, {transform: 'translateY(-14px) scale(1) rotate(-8deg)', opacity: 0}], 1100);
  setTimeout(() => pop.remove(), dur(1150));
  circRing(top, cx, by0, 6, 80, '#fff6d8', 500, 0, 4); goldBurst(top, cx, by0, 30, 10, 90); shakeEl(bot, 3, 300); flashRoot(root, '#ffffff', .18, 260);
  await vwait(900);
  // 6. the bottle lifts a little and drops onto the sea with a splash
  const all = sv(top, ''); [bot, mini, cork].forEach(e => all.appendChild(e)); all.style.transformOrigin = `${bx0}px ${by0}px`;
  A(all, [{transform: 'translate(0,0) rotate(0) scale(1)'}, {transform: 'translate(0,-34px) rotate(-6deg) scale(1.04)', offset: .45}, {transform: 'translate(0,6px) rotate(3deg) scale(.72)'}], 900, 0, 'cubic-bezier(.4,0,.6,1)');
  await vwait(880); waterColumn(top, bx0 - 50, by0 + 30, 40); waterColumn(top, bx0 + 50, by0 + 30, 34); for(let i = 0; i < 3; i++) circRing(top, bx0, by0 + 24, 10, 120 - i * 26, '#eef6f8', 1000, i * 150, 2);
  // 7. the plank comes back sunk, the bottle stays afloat with the ship inside
  m.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(a => a.cancel()); m.style.opacity = ''; m.style.transformOrigin = ''; m.style.zIndex = ''; m.classList.add('pg-sunk'); m.querySelectorAll('.row b').forEach(x => { x.textContent = x.textContent.replace(/^\d+/, '0'); });
  if(!m.querySelector('.pg-stamp')) m.insertAdjacentHTML('beforeend', '<div class="pg-stamp">Потоплен</div>'); A(m, [{opacity: 0}, {opacity: 1}], 600);
  const [sx, sy] = toSea(root, bx0, by0 + 4);
  const keep = scar(seaSvg(inner, false, 'pg-debris'), 'sunk', tgt);
  keep.innerHTML = `<g transform="translate(${R1(sx)} ${R1(sy)})"><ellipse cx="0" cy="${R1(40 * BS * .72)}" rx="${R1(110 * BS * .72)}" ry="7" fill="#0b2a36" opacity=".28"/>
    <g><animateTransform attributeName="transform" type="rotate" values="-3;3;-3" dur="3.6s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 3;0 0" dur="2.6s" additive="sum" repeatCount="indefinite"/>
      <g transform="scale(${R1(BS * .72 * 100) / 100})">${bottleArt({ship: true, cork: true, kind})}</g></g>
    <ellipse cx="0" cy="${R1(40 * BS * .72)}" rx="${R1(120 * BS * .72)}" ry="6" fill="none" stroke="#e6f2f4" stroke-width="1.4" opacity=".7"><animate attributeName="rx" values="${R1(110 * BS * .72)};${R1(140 * BS * .72)};${R1(110 * BS * .72)}" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;.25;.7" dur="2.6s" repeatCount="indefinite"/></ellipse></g>`;
  A(keep, [{opacity: 0}, {opacity: 1}], 300);
  A(all, [{opacity: 1}, {opacity: 0}], 300);
  await vwait(900); top.remove();
}

/* ----- Джек ускользает: «Жемчужина» sinks — time freezes, a great compass spins and points, she slips away with afterimages ----- */
async function fxJack(root){
  const m = matOf(root, NAMES['Ж']), o = matOf(root, NAMES['М']), hn = numOf(m, 'корпус'), hc = cellsOf(m, 'корпус'), b = rootBox(root, m);
  // 1. she should sink: the last planks break, water rises over the plank, she lists
  const top0 = layerSvg(root, 12);
  const h0 = parseInt(hn.textContent, 10);
  for(let i = h0 - 1; i >= 0; i--){ const c = cellsOf(m, 'корпус')[i]; const cb = rootBox(root, c); if(i >= h0 - 3){ splinters(top0, cb.cx, cb.cy, 5); sparks(top0, cb.cx, cb.cy, 6); } swapIcon(c, CELLS2.HULL_X); if(i >= h0 - 3) await vwait(160); }
  setNum(hn, 0); shakeEl(m, 6, 500);
  const water = document.createElement('div'); water.className = 'pg-jack-water'; m.appendChild(water);
  A(water, [{height: '0%'}, {height: '72%'}], 1300, 0, 'ease-in');
  A(m, [{translate: '0 0', rotate: '0deg'}, {translate: '0 8px', rotate: '1.8deg'}], 1300, 0, 'ease-in');
  for(let i = 0; i < 18; i++){ const x = b.x + rnd(10, b.w - 10), c = sv(top0, `<circle r="${R1(rnd(2, 4))}" fill="none" stroke="#dff4f8" stroke-width="1"/>`).firstChild; A(c, [{transform: `translate(${R1(x)}px,${b.y + b.h}px)`, opacity: 0}, {opacity: 1, offset: .2}, {transform: `translate(${R1(x)}px,${R1(b.y + rnd(0, 40))}px)`, opacity: 0}], rnd(800, 1300), rnd(0, 1100)); }
  await vwait(1300);
  // 2. time freezes: the world goes grey, only she keeps her colour; a tick rolls out
  const frozen = []; for(let e = m; e && e !== root; e = e.parentElement) [...e.parentElement.children].forEach(x => { if(x !== e && !/^(STYLE|SCRIPT)$/.test(x.tagName)) frozen.push(x); });
  const FZ = 'grayscale(1) brightness(.82) contrast(1.15)';
  frozen.forEach(x => A(x, [{filter: 'none'}, {filter: FZ}], 300));
  A(m, [{filter: 'none'}, {filter: 'saturate(1.3) drop-shadow(0 0 10px rgba(255,214,120,.7))'}], 300);
  const hi = layerSvg(root, 40);
  for(let i = 0; i < 3; i++) circRing(hi, b.cx, b.cy, 20, 360, '#e6dcc4', 1200, i * 260, 2);
  // frozen droplets hang in the air
  for(let i = 0; i < 14; i++) sv(hi, `<ellipse cx="${R1(b.x + rnd(0, b.w))}" cy="${R1(b.y - rnd(4, 40))}" rx="1.6" ry="2.6" fill="#dff4f8" opacity=".9"/>`);
  await vwait(300);
  const back = await legendIntro(root, 'jack', {x: b.cx, y: b.cy});
  // 3. the great compass over her: the needle spins wildly, then points to the place of the ally; a golden course is drawn
  const ob = rootBox(root, o);
  const aura = sv(hi, `<g><defs><radialGradient id="pgJkA"><stop offset="0" stop-color="#ffe7a4" stop-opacity=".75"/><stop offset=".55" stop-color="#ffd27a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <radialGradient id="pgJkR"><stop offset=".35" stop-color="#fff2c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient><circle r="150" fill="url(#pgJkA)"/><g class="ry" fill="url(#pgJkR)">${Array.from({length: 12}, (_, i) => { const a1 = i * Math.PI / 6, a2 = a1 + .09; return `<path d="M0 0 L${R1(Math.cos(a1) * 170)} ${R1(Math.sin(a1) * 170)} L${R1(Math.cos(a2) * 170)} ${R1(Math.sin(a2) * 170)} Z"/>`; }).join('')}</g></g>`).firstChild;
  A(aura, [{transform: `translate(${b.cx}px,${b.cy}px) scale(.2)`, opacity: 0}, {transform: `translate(${b.cx}px,${b.cy}px) scale(1)`, opacity: 1}], 600, 0, 'ease-out');
  const ry = aura.querySelector('.ry'); ry.style.transformBox = 'view-box'; ry.style.transformOrigin = '0 0'; A(ry, [{transform: 'rotate(0)'}, {transform: 'rotate(60deg)'}], 3000, 0, 'linear');
  const comp = sv(hi, compassArt('jk', 80)).firstChild;
  A(comp, [{transform: `translate(${b.cx}px,${b.cy}px) scale(.1) rotate(-90deg)`, opacity: 0}, {transform: `translate(${b.cx}px,${b.cy}px) scale(1.1) rotate(8deg)`, opacity: 1, offset: .7}, {transform: `translate(${b.cx}px,${b.cy}px) scale(1) rotate(0)`, opacity: 1}], 600, 0, 'cubic-bezier(.3,1.3,.6,1)');
  const nd = comp.querySelector('.nd'); nd.style.transformBox = 'view-box'; nd.style.transformOrigin = '0 0';
  A(nd, [{transform: 'rotate(0)'}, {transform: 'rotate(900deg)', offset: .55}, {transform: 'rotate(1150deg)', offset: .8}, {transform: 'rotate(1170deg)'}], 2000, 300, 'cubic-bezier(.2,.6,.3,1)');
  await vwait(2100);
  circRing(hi, b.cx, b.cy, 70, 150, '#ffe7a4', 700, 0, 3); goldBurst(hi, b.cx, b.cy - 64, 14, 8, 40);
  const course = sv(hi, `<path d="M${b.cx} ${b.y - 6} C${b.cx + 120} ${b.y - 90} ${ob.cx - 120} ${ob.y - 90} ${ob.cx} ${ob.y - 6}" fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="10 8"/>`).firstChild;
  A(course, [{opacity: 0}, {opacity: 1}], 300); goldBurst(hi, ob.cx, ob.y, 20, 10, 60);
  await vwait(400);
  // 4. the water runs off, colour comes back with a flash, she slips along the course leaving afterimages; the ally goes the other way
  A(water, [{height: '72%'}, {height: '0%'}], 500, 0, 'ease-out'); A(comp, [{opacity: 1}, {opacity: 0, transform: `translate(${b.cx}px,${b.cy}px) scale(1.4)`}], 400); A(aura, [{opacity: 1}, {opacity: 0}], 400);
  frozen.forEach(x => A(x, [{filter: FZ}, {filter: 'none'}], 500)); flashRoot(root, '#ffe7a4', .4, 400);
  const ghosts = [1, 2, 3, 4].map(i => { const g = document.createElement('div'); g.className = 'pg-ghost'; g.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px`; root.appendChild(g); return g; });
  const dxm = parseFloat(o.style.left) - parseFloat(m.style.left);
  m.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(a => a.cancel());
  A(m, [{translate: '0 0', rotate: '0deg', filter: 'blur(0)'}, {translate: `${dxm * .5}px -70px`, rotate: '-2deg', filter: 'blur(1.5px)', offset: .5}, {translate: `${dxm}px 0`, rotate: '0deg', filter: 'blur(0)'}], 800, 0, 'cubic-bezier(.6,0,.3,1)');
  ghosts.forEach((g, i) => A(g, [{transform: 'translate(0,0)', opacity: 0}, {opacity: .5 - i * .1, offset: .2}, {transform: `translate(${R1(dxm * (.5 - i * .1))}px,-60px)`, opacity: 0}], 800, i * 60, 'cubic-bezier(.6,0,.3,1)'));
  A(o, [{translate: '0 0'}, {translate: `${-dxm * .5}px 30px`, offset: .5}, {translate: `${-dxm}px 0`}], 800, 0, 'ease-in-out');
  await vwait(820);
  const t = m.style.left; m.style.left = o.style.left; o.style.left = t; [m, o].forEach(x => x.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(a => a.cancel())); m.style.zIndex = ''; water.remove(); frozen.forEach(x => x.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(a => a.cancel())); ghosts.forEach(g => g.remove()); course.remove();
  // 5. the Hull becomes 2 with a shine; gold coins scatter
  const nb0 = rootBox(root, m);
  cellsOf(m, 'корпус').slice(0, 2).forEach(c => { const n2 = swapIcon(c, CELLS2.HULL); A(n2, [{filter: 'brightness(1.8) drop-shadow(0 0 5px #ffd27a)'}, {filter: 'none'}], 1100); }); setNum(numOf(m, 'корпус'), 2);
  for(let i = 0; i < 18; i++){ const c = sv(hi, `<g><ellipse rx="5" ry="2.2" fill="#9a7020"/><ellipse rx="5" ry="2.2" cy="-1" fill="#f2c94c" stroke="#8a6420" stroke-width=".5"/></g>`).firstChild; const a = rnd(-Math.PI, 0), r = rnd(40, 120);
    A(c, [{transform: `translate(${nb0.cx}px,${nb0.y}px) rotate(0)`}, {transform: `translate(${R1(nb0.cx + Math.cos(a) * r)}px,${R1(nb0.y + Math.sin(a) * r)}px) rotate(${R1(rnd(-400, 400))}deg)`, offset: .5}, {transform: `translate(${R1(nb0.cx + Math.cos(a) * r * 1.3)}px,${R1(nb0.y + 30)}px) rotate(${R1(rnd(-800, 800))}deg)`, opacity: 0}], rnd(900, 1300), 0, 'cubic-bezier(.2,.6,.6,1)'); }
  const hnb = rootBox(root, numOf(m, 'корпус')); markAt(root, hnb.x + 24, hnb.y - 13, 'Корпус 2', true);
  endBack(back);
  await vwait(1300); hi.remove(); top0.remove();
}

/* ----- Пожар: the fire runs over the plank, the air shimmers, scorch marks stay, the Hull chars and breaks, smoke goes up ----- */
async function fxFire(root){
  const m = matOf(root, NAMES['И']), b = rootBox(root, m), top = layerSvg(root, 13);
  // the heat haze filter (once)
  if(!document.getElementById('pgHeat')){ const f = document.createElementNS(NS, 'svg'); f.setAttribute('width', '0'); f.setAttribute('height', '0'); f.style.position = 'absolute';
    f.innerHTML = `<filter id="pgHeat"><feTurbulence type="fractalNoise" baseFrequency=".012 .07" numOctaves="2" seed="3"><animate attributeName="seed" values="1;2;3;4;5;6;7;8" dur=".8s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="5"/></filter>`; document.body.appendChild(f); }
  const pic = m.querySelector('.mh > span'), pb = rootBox(root, pic);
  // 1. the fire starts in the ship picture and runs along the plank
  const glow = document.createElement('div'); glow.className = 'pg-fireglow'; m.appendChild(glow);
  A(glow, [{opacity: 0}, {opacity: 1, offset: .2}, {opacity: .8, offset: .5}, {opacity: 1, offset: .7}, {opacity: .5}], 3600);
  m.style.filter = 'url(#pgHeat)';
  const spots = [[pb.cx, pb.y + pb.h], [pb.x + pb.w + 30, b.y + 32], [b.x + 150, b.y + b.h], [b.x + 230, b.y + 34], [b.x + 300, b.y + b.h], [b.x + 360, b.y + 34], [b.x + 420, b.y + b.h], [b.x + b.w - 20, b.y + 34], [b.x + 90, b.y + 34], [b.x + b.w - 70, b.y + b.h]];
  const flames = [];
  // a wall of fire runs along the bottom edge of the plank from the stern picture to the bow; tongues lick the head
  const charB = scar(document.createElement('i'), 'state', 'И'); charB.className = 'pg-char'; m.appendChild(charB); A(charB, [{opacity: 0}, {opacity: 1}], 1800, 200);
  flames.push(...fireWall(root, top, b.x + 6, b.x + b.w - 6, b.y + b.h + 2, 30, {spread: 26}));
  spots.forEach(([x, y], i) => setTimeout(() => {
    flames.push(...fireWall(root, top, x - 14, x + 14, y + 2, 22, {step: 11, spread: 30, embers: 6}));
    // a scorch mark stays where the fire was
    const sc = scar(document.createElement('i'), 'state', 'И'); sc.className = 'pg-scorch'; const r = rnd(30, 50); sc.style.cssText = `left:${R1(x - b.x - r / 2)}px;top:${R1(y - b.y - r * .7)}px;width:${R1(r)}px;height:${R1(r * .8)}px`; m.appendChild(sc); A(sc, [{opacity: 0, transform: 'scale(.3)'}, {opacity: 1, transform: 'scale(1)'}], 1400); }, dur(300 + i * 160)));
  smokeColumn(top, b.cx - 120, b.y + 10, 1.2, 5, 600); smokeColumn(top, b.cx + 110, b.y + 10, 1.1, 5, 650);
  await vwait(1200);
  // 2. two planks of the Hull glow red-hot, char black, break
  const hc = cellsOf(m, 'корпус'), num = numOf(m, 'корпус'), v = parseInt(num.textContent, 10);
  for(const cell of hc.slice(Math.max(0, v - 2), Math.max(0, v)).reverse()){ A(cell, [{filter: 'none'}, {filter: 'sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.4) drop-shadow(0 0 5px #ff7a2a)', offset: .4}, {filter: 'brightness(.25)'}], 900); await vwait(900); const cb = rootBox(root, cell); sparks(top, cb.cx, cb.cy, 12); splinters(top, cb.cx, cb.cy, 3); swapIcon(cell, CELLS2.HULL_X); }
  setNum(num, Math.max(0, v - 2)); const nb = rootBox(root, num); markAt(root, nb.x + 24, nb.y - 13, '−2 Корпус · Пожар ×2');
  await vwait(1300);
  flames.forEach(f => A(f, [{opacity: 1}, {opacity: 0, transform: 'scale(.4)'}], 500)); A(glow, [{opacity: .5}, {opacity: .18}], 600);
  await vwait(520); flames.forEach(f => f.remove()); m.style.filter = '';
  // 3. what stays: the ship picture burns, smoke goes up, a faint glow, the scorch marks
  [flameAt(root, pb.x + pb.w * .36, pb.y + pb.h + 2, 26, 'pg-flame pg-burn'), flameAt(root, pb.x + pb.w * .66, pb.y + pb.h + 4, 20, 'pg-flame pg-burn'), smolder(root, pb.cx, pb.y, 5), glow].forEach(e => { scar(e, 'fire', 'И'); });
  await vwait(400); top.remove();
}

/* ----- Перестроение: the course is plotted in ink like on a chart, the ships lift, sail along it leaving real wakes, settle ----- */
async function fxSwap(root, codes = ['Ж', 'М']){
  const a = matOf(root, NAMES[codes[0]]), c = matOf(root, NAMES[codes[1]]), inner = seaInnerOf(root), ib = rootBox(root, inner);
  const A0 = rootBox(root, a), C0 = rootBox(root, c), topRow = A0.cy < 263;
  const s = (topRow ? 1 : -1);                                     // into the gap: down for the top row, up for the bottom
  const gapA = s * 110, gapC = -s * 30;
  const seaL = seaSvg(inner, false, 'pg-tmp'), top = sv(seaL, ''); top.setAttribute('transform', `translate(${R1(-ib.x)} ${R1(-ib.y)})`);   // on the sea, under the planks
  // 1. the course in ink with arrowheads and a small compass stamp, drawn as with a pen
  const edge = p => topRow ? p.y + p.h : p.y;
  const curveOf = (P, Q, lift) => [P.cx, edge(P), (P.cx + Q.cx) / 2, edge(P) + lift * 1.6, Q.cx, edge(Q)];
  const ca = curveOf(A0, C0, gapA), cc = curveOf(C0, A0, gapC);
  const pathD = ([x0, y0, x1, y1, x2, y2]) => `M${R1(x0)} ${R1(y0)} Q${R1(x1)} ${R1(y1)} ${R1(x2)} ${R1(y2)}`;
  const course = sv(top, `<g fill="none" stroke="#1f1a14" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="9 7" opacity=".85"><path d="${pathD(ca)}"/><path d="${pathD(cc)}"/></g>`).firstChild;
  course.querySelectorAll('path').forEach((p, i) => { const L = p.getTotalLength(); p.style.strokeDasharray = `${L}`; A(p, [{strokeDashoffset: L}, {strokeDashoffset: 0}], 700, i * 200, 'ease-in-out'); setTimeout(() => { p.style.strokeDasharray = '9 7'; }, dur(950 + i * 200)); });
  const mid = [(ca[0] + ca[4]) / 2, ca[1] + gapA * .8];
  const stamp = sv(top, `<g transform="translate(${R1(mid[0])} ${R1(mid[1])})"><circle r="16" fill="#efe3c8" stroke="#1f1a14" stroke-width="1.4"/><path d="M0 -13 L3 0 L0 13 L-3 0 Z" fill="#1f1a14"/><path d="M-13 0 L0 -3 L13 0 L0 3 Z" fill="#8e2b22"/></g>`).firstChild;
  A(stamp, [{transform: `translate(${R1(mid[0])}px,${R1(mid[1])}px) scale(2.4)`, opacity: 0}, {transform: `translate(${R1(mid[0])}px,${R1(mid[1])}px) scale(1)`, opacity: 1}], 300, 700, 'cubic-bezier(.6,0,.9,.5)');
  stamp.removeAttribute('transform');
  await vwait(1200);
  // 2. the ships lift, heel and sail along the courses; each leaves a wake that follows it
  const D = 1700, ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const q = ([x0, y0, x1, y1, x2, y2], t) => { const u = 1 - t; return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2]; };
  const kfOf = (cv, P) => Array.from({length: 25}, (_, k) => { const t = ease(k / 24), [x, y] = q(cv, t), [x2] = q(cv, Math.min(1, t + .04)); return {translate: `${R1(x - cv[0])}px ${R1(y - cv[1])}px`, rotate: `${R1(Math.max(-3, Math.min(3, (x2 - x) * .25)) * (k > 0 && k < 24 ? 1 : 0))}deg`, scale: k > 0 && k < 24 ? '1.03' : '1'}; });
  [a, c].forEach((m, i) => { m.style.zIndex = i ? 6 : 7; A(m, [{boxShadow: '0 1px 0 #c9b48c,0 3px 0 #a68f66,0 12px 20px rgba(0,0,0,.45)'}, {boxShadow: '0 1px 0 #c9b48c,0 3px 0 #a68f66,0 34px 34px rgba(0,0,0,.5)', offset: .5}, {boxShadow: '0 1px 0 #c9b48c,0 3px 0 #a68f66,0 12px 20px rgba(0,0,0,.45)'}], D); });
  A(a, kfOf(ca, A0), D, 0, 'linear'); A(c, kfOf(cc, C0), D, 0, 'linear');
  const wakes = [ca, cc].map(() => sv(top, `<g><path class="w1" fill="none" stroke="#eef6f8" stroke-width="3" stroke-linecap="round" opacity=".85"/><path class="w2" fill="none" stroke="#cfe4ea" stroke-width="1.4" stroke-linecap="round" opacity=".7"/></g>`).firstChild);
  const t0 = performance.now(); const hist = [[], []];
  const tick = now => { const p = Math.min(1, (now - t0) * speed / D); [ca, cc].forEach((cv, i) => { const [x, y] = q(cv, ease(p)); hist[i].push([x, y]); if(hist[i].length > 26) hist[i].shift();
      const h = hist[i]; if(h.length < 2) return; const d1 = 'M' + h.map(([hx, hy]) => `${R1(hx)} ${R1(hy)}`).join(' L');
      wakes[i].querySelector('.w1').setAttribute('d', d1); wakes[i].querySelector('.w2').setAttribute('d', 'M' + h.map(([hx, hy], j) => `${R1(hx + (j % 2 ? 6 : -6) * (1 - j / h.length))} ${R1(hy + 6)}`).join(' L')); });
    if(p < 1) requestAnimationFrame(tick); else wakes.forEach(w => A(w, [{opacity: 1}, {opacity: 0}], 900)); };
  requestAnimationFrame(tick);
  await vwait(D + 30);
  const la = a.style.left; a.style.left = c.style.left; c.style.left = la; [a, c].forEach(m => { m.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(x => x.cancel()); m.style.zIndex = ''; });
  // 3. they settle with a bob; rings run out on the water; the course fades
  [a, c].forEach(m => { A(m, [{translate: '0 0'}, {translate: `0 ${s * 4}px`}, {translate: `0 ${-s * 1.5}px`}, {translate: '0 0'}], 700, 0, 'ease-out'); const f = facing(root, m); for(let i = 0; i < 2; i++) ring(top, f.x, f.y + s * 10, 20, 200 - i * 50, '#eef6f8', 1100, i * 200, 2); });
  A(course, [{opacity: .85}, {opacity: 0}], 900, 300); A(stamp, [{opacity: 1}, {opacity: 0}], 900, 300);
  await vwait(1300); seaL.remove();
}

/* ----- the storm of the round, without a flat dimming: the sea turns grey-green, cloud shadows sweep over it, curtains of rain,
   whitecaps, the ships pitch, far lightning flickers at the edge ----- */
function stormLayer(root, inner, s){
  const W = 1022, H = 404;
  const base = inner.querySelector(':scope > svg'); if(base) base.style.filter = 'saturate(.5) brightness(.8) hue-rotate(-12deg) contrast(1.08)';
  root.querySelectorAll('.mat').forEach((m, i) => { m.style.animation = `pgpitch 3.6s ease-in-out ${(-i * .9).toFixed(1)}s infinite`; });
  s.innerHTML = `<defs><filter id="pgCloudB" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>
      <linearGradient id="pgCurtain" x1="0" x2="1"><stop offset="0" stop-color="#cfdde2" stop-opacity="0"/><stop offset=".5" stop-color="#cfdde2" stop-opacity=".22"/><stop offset="1" stop-color="#cfdde2" stop-opacity="0"/></linearGradient></defs>
    ${[[0, 120, 260, 22], [1, 300, 200, 30], [2, 40, 300, 26]].map(([i, y, rx, d]) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${R1(rx * .45)}" fill="#0a141a" opacity=".42" filter="url(#pgCloudB)"><animate attributeName="cx" values="${-rx - i * 300};${W + rx}" dur="${d}s" begin="${-i * 8}s" repeatCount="indefinite"/></ellipse>`).join('')}
    ${[0, 1].map(i => `<g><animateTransform attributeName="transform" type="translate" values="-300 0;${W + 100} 0" dur="${9 + i * 4}s" begin="${-i * 5}s" repeatCount="indefinite"/><rect x="0" y="0" width="220" height="${H}" fill="url(#pgCurtain)"/>${Array.from({length: 40}, () => `<path d="M${R1(rnd(10, 210))} ${R1(rnd(-20, H))} l-7 26" stroke="#e6f0f3" stroke-width="1.2" opacity=".6"/>`).join('')}</g>`).join('')}
    ${[0, 1].map(k => `<g opacity="${k ? .4 : .62}"><g><animateTransform attributeName="transform" type="translate" from="0 -60" to="-30 0" dur="${k ? .9 : .55}s" repeatCount="indefinite"/>${Array.from({length: 80}, () => { const x = rnd(-40, W + 60), y = rnd(-60, H); return `<path d="M${R1(x)} ${R1(y)} l-6 ${k ? 16 : 22}" stroke="#d9e8ee" stroke-width="${k ? .8 : 1.1}" stroke-linecap="round"/>`; }).join('')}</g></g>`).join('')}
    ${Array.from({length: 34}, () => { const x = R1(rnd(20, W - 40)), y = R1(rnd(20, H - 10)), w = R1(rnd(10, 24)), dd = R1(rnd(1.6, 3.4)); return `<path d="M${x} ${y} q${R1(w / 2)} -5 ${w} 0 q-${R1(w * .3)} 2 -${R1(w * .6)} 1" fill="#f2f7f8" stroke="#f2f7f8" stroke-width="1" opacity="0"><animate attributeName="opacity" values="0;.9;.6;0" dur="${dd}s" begin="${R1(-rnd(0, 3))}s" repeatCount="indefinite"/></path>`; }).join('')}`;
  const t = seaSvg(inner, true, 'pg-wxl-top');
  const bolts = [[120, 7], [880, 9.5], [520, 12]].map(([x, d], i) => `<g opacity="0"><animate attributeName="opacity" values="0;0;1;.2;1;0;0" keyTimes="0;.9;.905;.915;.925;.94;1" dur="${d}s" begin="${-i * 3}s" repeatCount="indefinite"/>
      <ellipse cx="${x}" cy="0" rx="160" ry="70" fill="#f4f8ff" opacity=".35"/><path d="M${x} -4 l-8 18 l10 2 l-14 26 l6 -18 l-10 -2 Z" fill="#fff8d8"/></g>`).join('');
  t.innerHTML = `<defs><radialGradient id="pgStormV" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05090c" stop-opacity=".45"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#pgStormV)"/>${bolts}`;
}

/* ----- the Ninth wave: a real swell — a lifted back with streaks, a dark front, a torn foam crest throwing spray back; the ships
   ride up and down as it passes under them ----- */
function waveLayer(root, inner, s){
  const W = 1022, H = 404, P = 8, run = .62;
  const off = y => 52 * Math.sin(Math.PI * (y + 30) / (H + 60));          // the crest bows forward in the middle
  const line = (dx, step = 12, jit = 5) => { const pts = []; for(let y = -30; y < H + 40; y += step) pts.push(`${R1(off(y) + dx + rnd(-jit, jit))} ${y}`); return 'M' + pts.join(' L'); };
  const crestD = line(0);
  const blobs = Array.from({length: 90}, () => { const y = rnd(-10, H + 10); return `<ellipse cx="${R1(off(y) + rnd(-10, 8))}" cy="${R1(y)}" rx="${R1(rnd(4, 12))}" ry="${R1(rnd(3, 7))}" fill="#f4f9fa" opacity="${R1(rnd(.6, 1))}"/>`; }).join('');
  const lace = Array.from({length: 12}, (_, i) => `<path d="${line(-22 - i * 16 - rnd(0, 8), 16, 8)}" fill="none" stroke="#e8f4f7" stroke-width="${R1(2.2 - i * .14)}" stroke-dasharray="${R1(rnd(10, 30))} ${R1(rnd(8, 26))}" opacity="${R1(.75 - i * .05)}" stroke-linecap="round"/>`).join('');
  const spray = Array.from({length: 34}, () => { const y = rnd(0, H), x0 = off(y), dx = rnd(30, 80), d = R1(rnd(.6, 1.1)), b = R1(-rnd(0, 1)); return `<circle cx="${R1(x0)}" cy="${R1(y)}" r="${R1(rnd(1.2, 2.8))}" fill="#f4f9fa"><animate attributeName="cx" values="${R1(x0)};${R1(x0 - dx)}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="cy" values="${R1(y)};${R1(y - rnd(6, 18))};${R1(y + 4)}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`; }).join('');
  const band = (dx, w, c, o) => `<path d="${line(dx, 20, 0)}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;
  s.innerHTML = `<defs><filter id="pgFoam" x="-30%" y="-5%" width="160%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="10"/></filter>
      <filter id="pgSoft" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation="14 2"/></filter></defs>
    <g><animateTransform attributeName="transform" type="translate" values="-420 0;${W + 140} 0;${W + 140} 0" keyTimes="0;${run};1" dur="${P}s" repeatCount="indefinite"/>
      <g filter="url(#pgSoft)">${band(-260, 160, '#2a5e72', .35)}${band(-120, 120, '#4c8ca2', .45)}${band(-34, 60, '#86c0d2', .55)}${band(50, 70, '#04141b', .6)}${band(110, 60, '#04141b', .25)}</g>
      ${lace}
      <g filter="url(#pgFoam)"><path d="${crestD}" fill="none" stroke="#f4f9fa" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>${blobs}</g>
      <path d="${crestD}" fill="none" stroke="#ffffff" stroke-width="3.4" transform="translate(9 0)" opacity=".95"/>
      ${spray}</g>`;
  // the ships heave as the crest passes their middle
  const ib = rootBox(root, inner);
  root.querySelectorAll('.mat').forEach(m => { const mb = rootBox(root, m), cx = mb.cx - ib.x; const cy2 = mb.cy - ib.y, crestAt = cx - 52 * Math.sin(Math.PI * (cy2 + 30) / (H + 60)); const tc = P * run * (crestAt + 420) / (W + 560); m.style.animation = `pgheave ${P}s ease-in-out ${R1(tc - .42 * 1)}s infinite`; });
}

/* ----- Торговый караван: a real merchantman crosses the sea, pitching, with a bow wave and a wake, and throws barrels ----- */
async function caravan3(root, svg, ib, pkegs, ckegs, capP, capC, fullOf){
  const inner = seaInnerOf(root), seaL = seaSvg(inner, false, 'pg-tmp'), g0 = sv(seaL, ''); g0.setAttribute('transform', `translate(${R1(-ib.x)} ${R1(-ib.y)})`);
  const y = ib.y + 224, k = 1.1, x0 = ib.x - 140, x1 = ib.x + ib.w + 140, D = 5200;
  const ship = sv(g0, `<g><g class="pg-pitch">${bigShip('merchant', 0, 0, k, true)}</g></g>`).firstChild;
  const wake = sv(g0, `<g fill="none" stroke-linecap="round"><path class="a" stroke="#eef6f8" stroke-width="3" opacity=".85"/><path class="b" stroke="#cfe4ea" stroke-width="1.6" opacity=".7"/><path class="c" stroke="#fff" stroke-width="2"/></g>`).firstChild;
  g0.insertBefore(wake.parentNode, ship.parentNode);
  A(ship, [{transform: `translate(${x0}px,${y}px)`}, {transform: `translate(${x1}px,${y}px)`}], D, 0, 'linear');
  const t0 = performance.now(); const tick = now => { if(!wake.isConnected) return; const p = Math.min(1, (now - t0) * speed / D), x = x0 + (x1 - x0) * p, st = x - 60 * k, bw = x + 62 * k;
    wake.querySelector('.a').setAttribute('d', `M${R1(st)} ${y - 2} C${R1(st - 80)} ${y - 6} ${R1(st - 180)} ${y - 16} ${R1(st - 300)} ${y - 22} M${R1(st)} ${y + 4} C${R1(st - 80)} ${y + 8} ${R1(st - 180)} ${y + 18} ${R1(st - 300)} ${y + 24}`);
    wake.querySelector('.b').setAttribute('d', `M${R1(st - 20)} ${y} q-40 ${R1(Math.sin(now / 200) * 3)} -120 0 q-60 -2 -140 0`);
    wake.querySelector('.c').setAttribute('d', `M${R1(bw)} ${y - 2} q8 -6 14 -2 M${R1(bw)} ${y + 2} q8 6 14 2`);
    if(p < 1) requestAnimationFrame(tick); else A(wake, [{opacity: 1}, {opacity: 0}], 800); }; requestAnimationFrame(tick);
  await vwait(D * .4);
  const from = [x0 + (x1 - x0) * .4, y - 60];
  const throwTo = (list, have, n, delay) => { for(let i = have; i < have + n && i < list.length; i++){ const kk = list[i], b = rootBox(root, kk);
    const fl = document.createElement('div'); fl.className = 'pg-keg-fly'; fl.innerHTML = KEGS.full.replace('width="27" height="34"', `width="${R1(b.w)}" height="${R1(b.h)}"`); root.appendChild(fl);
    const mx = (from[0] + b.x) / 2, my = Math.min(from[1], b.y) - 120;
    A(fl, [{transform: `translate(${from[0]}px,${from[1]}px) rotate(0)`}, {transform: `translate(${R1(mx)}px,${R1(my)}px) rotate(200deg)`, offset: .5}, {transform: `translate(${R1(b.x)}px,${R1(b.y)}px) rotate(360deg)`}], 900, delay + (i - have) * 200, 'cubic-bezier(.35,0,.65,1)');
    setTimeout(() => { fl.remove(); const n2 = swapIcon(kk, fullOf(kk)); const bb = rootBox(root, n2); sparks(svg, bb.cx, bb.cy, 8); }, dur(900 + delay + (i - have) * 200)); } };
  throwTo(ckegs, COMPANY_POWDER, 2, 0); throwTo(pkegs, 2, 2, 250);
  await vwait(1500);
  if(capP) capP.textContent = 'Трюм пиратов · 4 из 8'; if(capC) capC.textContent = `Трюм Компании · ${COMPANY_POWDER + 2} из 8`;
  markAt(root, 110, 550, '+2 Пороха', true); markAt(root, 330, 34, '+2 Пороха', true);
  await vwait(D * .6 - 1500 + 300); seaL.remove();
}

/* ----- Течение: each team's pair rides a gyre of the sea — foam streams circle, debris rides them, the ships follow the arcs ----- */
async function current3(root, svg){
  const inner = seaInnerOf(root), ib = rootBox(root, inner);
  const pairs = [[matOf(root, NAMES['И']), matOf(root, NAMES['Г']), 1], [matOf(root, NAMES['Ж']), matOf(root, NAMES['М']), -1]];
  const seaL = seaSvg(inner, false, 'pg-tmp'); const gy = [];
  pairs.forEach(([a, c, s], i) => { const A0 = rootBox(root, a), C0 = rootBox(root, c); const cx = (A0.cx + C0.cx) / 2 - ib.x, cy = (s > 0 ? A0.y + A0.h + 24 : A0.y - 24) - ib.y; const rx = Math.abs(C0.cx - A0.cx) / 2 + 40, ry = 32;
    gy.push({cx, cy, rx, ry});
    const el = (k, r2) => `M${R1(cx - rx * k)} ${R1(cy)} A${R1(rx * k)} ${R1(ry * k)} 0 1 ${s > 0 ? 1 : 0} ${R1(cx + rx * k)} ${R1(cy)} A${R1(rx * k)} ${R1(ry * k)} 0 1 ${s > 0 ? 1 : 0} ${R1(cx - rx * k)} ${R1(cy)}`;
    seaL.insertAdjacentHTML('beforeend', `<g opacity="0"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="${R1(4.2 / speed)}s" fill="freeze"/>
      <defs><path id="pgGy${i}" d="${el(1)}"/></defs>
      <path d="${el(.9)}" fill="none" stroke="#a8d8e6" stroke-width="22" opacity=".22"/><path d="${el(.9)}" fill="none" stroke="#06222c" stroke-width="6" opacity=".25" transform="translate(0 4)"/>
      ${[1, .82, .64].map((k, j) => `<path d="${el(k)}" fill="none" stroke="${j ? '#bfe0ea' : '#eef6f8'}" stroke-width="${3 - j}" stroke-dasharray="${18 - j * 4} ${12 + j * 2}" stroke-linecap="round" opacity=".85"><animate attributeName="stroke-dashoffset" from="0" to="-${(30 - j * 2) * 4}" dur="${R1(1 + j * .3)}s" repeatCount="indefinite"/></path>`).join('')}
      ${Array.from({length: 8}, (_, k) => `<g><animateMotion dur="2.6s" begin="${R1(-k * .33)}s" repeatCount="indefinite" rotate="auto"><mpath href="#pgGy${i}"/></animateMotion>${k % 3 === 0 ? '<rect x="-7" y="-2" width="14" height="4" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".5"/>' : k % 3 === 1 ? '<path d="M-6 0 l6 -4 l6 4" fill="none" stroke="#f4f9fa" stroke-width="2" stroke-linecap="round"/>' : '<path d="M-6 0 q3 -4 6 0 t6 0" fill="none" stroke="#3f7a5a" stroke-width="2"/>'}</g>`).join('')}</g>`); });
  await vwait(900);
  // the ships ride the arcs: the left one along the gap side, the right one along the outer side
  const D = 1600;
  pairs.forEach(([a, c, s]) => { const la = parseFloat(a.style.left), lc = parseFloat(c.style.left), dx = lc - la;
    const arc = (dir, h) => Array.from({length: 21}, (_, k) => { const t = k / 20, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; return {translate: `${R1(dir * dx * e)}px ${R1(s * h * Math.sin(Math.PI * e))}px`, rotate: `${R1(dir * s * 2.4 * Math.cos(Math.PI * e))}deg`}; });
    const dl = s > 0 ? 0 : 900, gapFirst = s > 0;   // top pair: the right ship dives through the gap; bottom pair: the left one
    a.style.zIndex = gapFirst ? 5 : 7; c.style.zIndex = gapFirst ? 7 : 5;
    A(a, arc(1, gapFirst ? -8 : 64), D, dl, 'linear'); A(c, arc(-1, gapFirst ? 64 : -8), D, dl, 'linear'); });
  await vwait(D + 930);
  pairs.forEach(([a, c]) => { const t = a.style.left; a.style.left = c.style.left; c.style.left = t; [a, c].forEach(x => { x.getAnimations().filter(q => !(q instanceof CSSAnimation)).forEach(z => z.cancel()); x.style.zIndex = ''; }); const f1 = facing(root, a), f2 = facing(root, c); ring(svg, f1.x, f1.y, 20, 160, '#eef6f8', 900); ring(svg, f2.x, f2.y, 20, 160, '#eef6f8', 900); });
  await vwait(1800); seaL.remove();
}
