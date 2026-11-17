// The identical marks of sheet 04 (page 2): 11 mm brass coins on the 11 mm grid (TOKEN.marker), the same coin drawn small
// in the caption and in the slip «как пользоваться». markArt(cx, cy, id) draws one coin centred at (cx, cy), mm.
import { LOOK, brassDisc } from './tokens-art';

const R = (n: number) => Math.round(n * 1000) / 1000;

// ---- the identical marks: a brass coin on parchment with an engraved compass star (round and brass — unlike the
// coloured square markers with a letter) ----
export function markArt(cx: number, cy: number, id: string): string {
  const ink = LOOK.engrave, star = (R0: number, R1: number, rot: number) => {
    const p: string[] = [];
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, q = i % 2 ? R1 : R0; p.push(`${R(cx + q * Math.cos(a))} ${R(cy + q * Math.sin(a))}`); }
    return `M${p.join('L')}Z`;
  };
  return `<circle cx="${R(cx + 0.25)}" cy="${R(cy + 0.35)}" r="4.25" fill="#1a0e04" fill-opacity=".22"/>`
    + brassDisc(cx, cy, 4.25, 0.8)
    + `<circle cx="${R(cx)}" cy="${R(cy)}" r="3.45" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width=".2"/>`
    + `<path d="${star(3.05, 0.75, -Math.PI / 2)}" fill="${ink}"/><path d="${star(2.1, 0.6, -Math.PI / 4)}" fill="${ink}" fill-opacity=".6"/>`
    + `<circle cx="${R(cx)}" cy="${R(cy)}" r=".45" fill="${LOOK.brass[0]}"/>`;
}
