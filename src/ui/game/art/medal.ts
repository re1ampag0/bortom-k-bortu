// V7: the drawings of the victory sheet from docs/mockups/a5/phone/src/phone_tpl.html — the medal of the best captain
// (medalClean: a ribbon, a gold disc with a milled edge, a star), the anchor of the «Реванш» medallion (ANCHOR_S) and the
// icons of the paper buttons (VI_NEW, VI_DL, VI_EYE). The ids are unique for each drawing.
let n = 0;
const r1 = (v: number) => Math.round(v * 10) / 10;

export function medalSvg(size = 60): string {
  const id = `mc${++n}`;
  const teeth =
    Array.from({ length: 72 }, (_, i) => {
      const a = (i / 72) * Math.PI * 2, r = i % 2 ? 18.6 : 18;
      return (i ? 'L' : 'M') + r1(Math.cos(a) * r) + ' ' + r1(Math.sin(a) * r);
    }).join(' ') + 'Z';
  return `<svg width="${size}" height="${r1(size * 1.3)}" viewBox="-24 -32 48 62" aria-hidden="true"><defs>
    <linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="#4a0e09"/><stop offset=".35" stop-color="#9e2a1e"/><stop offset=".65" stop-color="#9e2a1e"/><stop offset="1" stop-color="#4a0e09"/></linearGradient>
    <radialGradient id="${id}f" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#e2bf62"/><stop offset=".75" stop-color="#a77a26"/><stop offset="1" stop-color="#6e4c14"/></radialGradient>
    <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".5" stop-color="#b8892e"/><stop offset="1" stop-color="#6e4c14"/></linearGradient></defs>
    <path d="M-9 -32 H-1 L1 -13 L-5 -9 Z" fill="url(#${id}r)"/><path d="M9 -32 H1 L-1 -13 L5 -9 Z" fill="url(#${id}r)"/><path d="M-5 -32 L-2 -14 M5 -32 L2 -14" stroke="#e2bf62" stroke-width=".8" opacity=".7"/>
    <rect x="-6" y="-14.4" width="12" height="3.6" rx="1.4" fill="url(#${id}e)" stroke="#5e4210" stroke-width=".4"/>
    <circle cx="1" cy="3.4" r="19" fill="#000" opacity=".35"/>
    <path d="${teeth}" fill="url(#${id}e)" stroke="#4a3208" stroke-width=".4"/><circle r="16.6" fill="url(#${id}f)" stroke="#5e4210" stroke-width=".5"/>
    <circle r="13.6" fill="none" stroke="#7a5a1a" stroke-width=".5" opacity=".7"/><circle r="13" fill="none" stroke="#fff3c4" stroke-width=".4" opacity=".6"/>
    <g transform="translate(.5 .7)"><path d="M0 -8.6 L2.4 -2.8 L8.4 -2.6 L3.8 1.2 L5.4 7.2 L0 3.8 L-5.4 7.2 L-3.8 1.2 L-8.4 -2.6 L-2.4 -2.8 Z" fill="#6e4c14" opacity=".55"/></g>
    <path d="M0 -8.6 L2.4 -2.8 L8.4 -2.6 L3.8 1.2 L5.4 7.2 L0 3.8 L-5.4 7.2 L-3.8 1.2 L-8.4 -2.6 L-2.4 -2.8 Z" fill="url(#${id}e)" stroke="#7a5a1a" stroke-width=".4"/>
    <path d="M-12 -8 A15 15 0 0 1 1 -15" stroke="#fffbe6" stroke-width="1.8" fill="none" opacity=".55" stroke-linecap="round"/></svg>`;
}

/** The gold anchor of the medallion of «Реванш». */
export function anchorSvg(): string {
  const id = `anB${++n}`;
  return `<svg width="24" height="26" viewBox="-3 -1 32 32" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#e2bf62"/><stop offset=".7" stop-color="#9a7020"/><stop offset="1" stop-color="#d8b05a"/></linearGradient></defs><g fill="url(#${id})" stroke="#4a3208" stroke-width=".7"><circle cx="13" cy="3.2" r="2.6" fill="none" stroke="url(#${id})" stroke-width="1.8"/><path d="M2.6 7.2 Q13 6.4 23.4 7.2 L23.4 9.4 Q13 8.6 2.6 9.4 Z"/><path d="M11.5 5.6 H14.5 L15.1 24.6 H10.9 Z"/><path d="M1.4 16.8 Q1.6 26.4 13 28.8 Q24.4 26.4 24.6 16.8 L21.8 19 Q21 24.8 13 26 Q5 24.8 4.2 19 Z"/><path d="M1.4 16.8 L-1.8 18.6 Q-1.4 21.8 0.8 23.8 L4.6 20.4 Z M24.6 16.8 L27.8 18.6 Q27.4 21.8 25.2 23.8 L21.4 20.4 Z"/></g></svg>`;
}

/** «Новая партия» — a flag. */
export const ICON_NEW = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 16 V2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4.6 2.6 H14 L12 5.6 L14 8.6 H4.6" fill="currentColor"/></svg>';
/** «Скачать партию» — a sheet with an arrow down. */
export const ICON_DOWNLOAD = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 2 H11 L14 5 V16 H4 Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 7 V13 M6.4 10.6 L9 13.2 L11.6 10.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
/** «Посмотреть стол» — an eye. */
export const ICON_EYE = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M1.6 9 Q9 1.6 16.4 9 Q9 16.4 1.6 9 Z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="9" r="2.6" fill="currentColor"/></svg>';
