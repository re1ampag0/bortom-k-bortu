// The look of sheet 04 (parts/tokens.ts) in the world of the boards v2 (parts/boards/v2.ts) and the battle scheme
// (parts/scheme.ts): brass gradients, parchment slips with a double rule, brass-rimmed cells and coins, the engraved icons
// of parts/icons.ts, the flags of the sides. The words are HTML blocks marked data-in="<plate>" whose boxes are set here
// (line height in mm), so tools/print/check-layout.ts measures exactly what is printed.
import { esc } from '../kit';
import { contrast, darken } from '../colors';
import { icon, type IconName, type IconTone } from './icons';

export interface Rect { x: number; y: number; w: number; h: number }
export const LOOK = {
  paper: '#f1e4c2', paperLine: '#5a4024', ink: '#2a1c0c', soft: '#4f3d28', cell: '#f7eed6', cellDeep: '#e3d1a6',
  brass: ['#f3d68c', '#c4954a', '#5e4214'] as [string, string, string], engrave: '#2a1a08'
};
/** the light lettering on dark grounds (ship colours, the Dutchman's sea) */
export const CREAM = '#fff4d8';
export const r = (n: number) => Math.round(n * 100) / 100;
export const pt = (n: number) => n * 25.4 / 72;
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
/** the ship's colour darkened until CREAM on it has a contrast of `min` : 1 */
export function deepOf(color: string, min = 7): string {
  let c = color;
  for (let k = 0.05; contrast(CREAM, c) < min && k < 0.9; k += 0.05) c = darken(color, k);
  return c;
}

// ---- SVG ----
/** the gradients of one page (ids prefixed by `id`) */
export function defs(id: string, extra = ''): string {
  const [bl, bm, bd] = LOOK.brass;
  return `<defs>
<linearGradient id="${id}br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".42" stop-color="${bm}"/><stop offset=".55" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${id}brh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".5" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${id}well" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.cellDeep}"/><stop offset=".35" stop-color="${LOOK.cell}"/><stop offset="1" stop-color="${LOOK.cell}"/></linearGradient>
<linearGradient id="${id}rwell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(LOOK.cell, LOOK.cellDeep, 0.7)}"/><stop offset=".3" stop-color="${LOOK.cell}"/><stop offset="1" stop-color="${mix(LOOK.cell, '#ffffff', 0.3)}"/></linearGradient>
<linearGradient id="${id}paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.paper}"/><stop offset="1" stop-color="${mix(LOOK.paper, '#8a6a3a', 0.08)}"/></linearGradient>
${extra}</defs>`;
}
export const shadow = (b: Rect, rx: number, op = 0.26) => `<rect x="${r(b.x + 0.45)}" y="${r(b.y + 0.65)}" width="${r(b.w)}" height="${r(b.h)}" rx="${rx}" fill="#1a0e04" fill-opacity="${op}"/>`;
export const plateRect = (id: string, b: Rect) => `<rect data-plate="${id}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="none" stroke="none"/>`;
/** a slip of parchment: a soft shadow, a double rule */
export function slip(pid: string, b: Rect, id: string, o: { shadow?: boolean; rule?: boolean; op?: number } = {}): string {
  return (o.shadow === false ? '' : shadow(b, 1.4, 0.22)) +
    `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="url(#${id}paper)"${o.op != null ? ` fill-opacity="${o.op}"` : ''} stroke="${LOOK.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    (o.rule === false ? '' : `<rect x="${r(b.x + 1)}" y="${r(b.y + 1)}" width="${r(b.w - 2)}" height="${r(b.h - 2)}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".6" stroke-width=".18"/>`);
}
/** a cartouche: a slip with flourishes in its corners */
export function cartouche(pid: string, b: Rect, id: string): string {
  const c = LOOK.paperLine, curl = (x: number, y: number, sx: number, sy: number) => `<path d="M${r(x + sx * 1.6)} ${r(y + sy * 5.5)}C${r(x + sx * 1.6)} ${r(y + sy * 2.6)} ${r(x + sx * 2.6)} ${r(y + sy * 1.6)} ${r(x + sx * 5.5)} ${r(y + sy * 1.6)}M${r(x + sx * 2.9)} ${r(y + sy * 2.9)}m${r(sx * -0.7)} 0a.7 .7 0 1 0 ${r(sx * 1.4)} 0a.7 .7 0 1 0 ${r(sx * -1.4)} 0" fill="none" stroke="${c}" stroke-width=".3" stroke-opacity=".75"/>`;
  return slip(pid, b, id) + curl(b.x, b.y, 1, 1) + curl(b.x + b.w, b.y, -1, 1) + curl(b.x, b.y + b.h, 1, -1) + curl(b.x + b.w, b.y + b.h, -1, -1);
}
/** a brass plaque (a tag): the plate, its highlight and inner rule */
export function plaque(pid: string, b: Rect, id: string): string {
  return shadow(b, 1.2, 0.28) + `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.2" fill="url(#${id}br)" stroke="${LOOK.brass[2]}" stroke-width=".28"/>` +
    `<path d="M${r(b.x + 1.2)} ${r(b.y + 0.45)}H${r(b.x + b.w - 1.2)}" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".25"/>` +
    `<rect x="${r(b.x + 0.8)}" y="${r(b.y + 0.8)}" width="${r(b.w - 1.6)}" height="${r(b.h - 1.6)}" rx=".7" fill="none" stroke="${LOOK.brass[2]}" stroke-opacity=".7" stroke-width=".18"/>`;
}
export const rivet = (x: number, y: number, R = 0.7) => `<circle cx="${r(x)}" cy="${r(y)}" r="${R}" fill="${LOOK.brass[0]}" stroke="${LOOK.brass[2]}" stroke-width=".2"/><circle cx="${r(x - R * 0.3)}" cy="${r(y - R * 0.3)}" r="${r(R * 0.3)}" fill="#fff8e0" fill-opacity=".7"/>`;
/** an engraved icon that the words keep clear of (its own plate) */
export const ico = (name: IconName, cx: number, cy: number, s: number, tone: IconTone, pid?: string, op = 1) =>
  (pid ? `<rect data-plate="${pid}" x="${r(cx - s / 2)}" y="${r(cy - s / 2)}" width="${r(s)}" height="${r(s)}" fill="none"/>` : '') +
  (op < 1 ? `<g opacity="${op}">${icon(name, cx, cy, s, tone)}</g>` : icon(name, cx, cy, s, tone));
/** a square cell: a brass rim (flat paint, lit from the upper left) round a clean recessed well (a mark lies in it) */
export function brassCell(pid: string, x: number, y: number, s: number, _id: string, o: { inner?: string; tint?: string; rx?: number } = {}): string {
  const rx = o.rx ?? 1.8, [bl, bm, bd] = LOOK.brass, e = 0.4, wr = Math.max(0.6, rx - 0.7);
  return `<rect x="${r(x + 0.35)}" y="${r(y + 0.5)}" width="${s}" height="${s}" rx="${rx}" fill="#1a0e04" fill-opacity=".28"/>` +
    `<rect data-plate="${pid}" x="${r(x)}" y="${r(y)}" width="${s}" height="${s}" rx="${rx}" fill="${bm}" stroke="${bd}" stroke-width=".22"/>` +
    `<path d="M${r(x + e)} ${r(y + s - rx)}V${r(y + rx)}Q${r(x + e)} ${r(y + e)} ${r(x + rx)} ${r(y + e)}H${r(x + s - rx)}" fill="none" stroke="${bl}" stroke-width=".5" stroke-linecap="round"/>` +
    `<path d="M${r(x + rx)} ${r(y + s - e)}H${r(x + s - rx)}Q${r(x + s - e)} ${r(y + s - e)} ${r(x + s - e)} ${r(y + s - rx)}V${r(y + rx)}" fill="none" stroke="${bd}" stroke-opacity=".4" stroke-width=".4" stroke-linecap="round"/>` +
    `<rect x="${r(x + 0.85)}" y="${r(y + 0.85)}" width="${r(s - 1.7)}" height="${r(s - 1.7)}" rx="${r(wr)}" fill="${o.tint ?? WELL}" stroke="${bd}" stroke-width=".2"/>` +
    `<path d="M${r(x + 1.25)} ${r(y + 1.25 + wr)}Q${r(x + 1.25)} ${r(y + 1.25)} ${r(x + 1.25 + wr)} ${r(y + 1.25)}H${r(x + s - 1.25 - wr)}" fill="none" stroke="${LOOK.cellDeep}" stroke-width=".6" stroke-linecap="round"/>` + (o.inner ?? '');
}
/** an arc of radius R round (cx, cy) from angle a0 to a1 (degrees, clockwise from +x) */
const arc = (cx: number, cy: number, R: number, a0: number, a1: number) => {
  const p = (a: number) => `${r(cx + R * Math.cos(a * Math.PI / 180))} ${r(cy + R * Math.sin(a * Math.PI / 180))}`;
  return `M${p(a0)}A${r(R)} ${r(R)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
};
/** a brass disc in flat colours: light on the upper left, shade on the lower right (no gradients: many of them repeat on
 *  a page, and flat paint looks the same in every PDF reader and RIP) */
export function brassDisc(cx: number, cy: number, R: number, rim: number, pid?: string | null): string {
  const [bl, bm, bd] = LOOK.brass, m = R - rim / 2;
  return `<circle${pid ? ` data-plate="${pid}"` : ''} cx="${r(cx)}" cy="${r(cy)}" r="${r(R)}" fill="${bm}" stroke="${bd}" stroke-width=".22"/>` +
    `<path d="${arc(cx, cy, m, 145, 305)}" fill="none" stroke="${bl}" stroke-width="${r(rim * 0.62)}" stroke-linecap="round"/>` +
    `<path d="${arc(cx, cy, m, 330, 470)}" fill="none" stroke="${bd}" stroke-opacity=".38" stroke-width="${r(rim * 0.5)}" stroke-linecap="round"/>` +
    `<path d="${arc(cx, cy, R - 0.28, 200, 250)}" fill="none" stroke="#fffbe8" stroke-opacity=".8" stroke-width=".22" stroke-linecap="round"/>`;
}
/** a round brass rim of radius R (rim mm wide) round a flat well, a little shade under its upper edge */
export function brassRing(pid: string | null, cx: number, cy: number, R: number, rim: number, _id: string, well: string): string {
  const w = R - rim;
  return brassDisc(cx, cy, R, rim, pid) +
    `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(w)}" fill="${well}" stroke="${LOOK.brass[2]}" stroke-width=".2"/>` +
    `<path d="${arc(cx, cy, w - 0.4, 200, 340)}" fill="none" stroke="${LOOK.cellDeep}" stroke-opacity=".8" stroke-width="${r(Math.min(0.7, w * 0.08))}" stroke-linecap="round"/>`;
}
/** the well colour of the cells and coins */
export const WELL = '#f9f2df';

// ---- the flags of the sides (own drawings, as on the battle scheme): Pirates — black with crossed sabres; Company — red
// and white stripes with a cross in the canton ----
export function flag(side: 'pirates' | 'company', x: number, y: number, dir: 1 | -1, h: number, uid: string, pid?: string): string {
  const fw = h * 0.62, fh = h * 0.42, top = y - h + 0.6, x1 = x + dir * fw, wave = (yy: number) => `Q${r(x + dir * fw * 0.5)} ${r(yy - fh * 0.16)} ${r(x1)} ${r(yy + fh * 0.06)}`;
  const outline = `M${r(x)} ${r(top)}${wave(top)}L${r(x1)} ${r(top + fh + fh * 0.06)}Q${r(x + dir * fw * 0.5)} ${r(top + fh - fh * 0.16)} ${r(x)} ${r(top + fh)}Z`;
  let body = '';
  if (side === 'pirates') {
    const cx = x + dir * fw * 0.52, cy = top + fh * 0.5, s = fh * 0.34;
    body = `<path d="${outline}" fill="#181512"/>` +
      `<path d="M${r(cx - s)} ${r(cy - s)}Q${r(cx)} ${r(cy - s * 0.2)} ${r(cx + s)} ${r(cy + s)}M${r(cx + s)} ${r(cy - s)}Q${r(cx)} ${r(cy - s * 0.2)} ${r(cx - s)} ${r(cy + s)}" fill="none" stroke="#f3ead6" stroke-width="${r(h * 0.035)}" stroke-linecap="round"/>`;
  } else {
    let stripes = '';
    for (let i = 0; i < 7; i += 2) stripes += `<rect x="${r(Math.min(x, x1) - 1)}" y="${r(top - 1 + i * (fh + 2) / 7)}" width="${r(fw + 2)}" height="${r((fh + 2) / 7)}" fill="#a8261c"/>`;
    const cw = fw * 0.4, ch = fh * 0.5, cx0 = dir > 0 ? x : x - cw;
    body = `<clipPath id="${uid}"><path d="${outline}"/></clipPath><path d="${outline}" fill="#f6efe0"/><g clip-path="url(#${uid})">${stripes}` +
      `<rect x="${r(cx0)}" y="${r(top - 1)}" width="${r(cw)}" height="${r(ch + 1)}" fill="#f6efe0"/><path d="M${r(cx0 + cw / 2)} ${r(top - 1)}V${r(top + ch)}M${r(cx0)} ${r(top + ch * 0.55)}H${r(cx0 + cw)}" stroke="#a8261c" stroke-width="${r(fh * 0.12)}"/></g>`;
  }
  return `<g${pid ? ` data-plate="${pid}"` : ''}>${body}<path d="${outline}" fill="none" stroke="#1a120a" stroke-width=".16"/>` +
    `<path d="M${r(x)} ${r(y)}V${r(top - 0.4)}" stroke="#3a2412" stroke-width="${r(Math.max(0.3, h * 0.04))}" stroke-linecap="round"/><circle cx="${r(x)}" cy="${r(top - 0.6)}" r="${r(h * 0.05)}" fill="${LOOK.brass[1]}" stroke="${LOOK.brass[2]}" stroke-width=".12"/></g>`;
}

// ---- words (HTML) ----
export interface WO {
  font?: 'Alegreya' | 'Alegreya SC' | 'Alegreya Sans'; w?: number; size: number; color?: string; italic?: boolean; ls?: string; upper?: boolean;
  anchor?: 'start' | 'middle' | 'end'; lh?: number; name?: string; width?: number; align?: 'left' | 'center' | 'right'; inset?: number; style?: string;
}
/** the cap centre of a line box lies at its middle for Alegreya / Alegreya SC (baseline at lh/2 + 0.33 em, cap 0.655 em);
 *  Alegreya Sans sits 0.0275 em higher */
const sansShift = (o: WO) => (o.font ?? 'Alegreya Sans') === 'Alegreya Sans' ? 0.0275 * pt(o.size) : 0;
/** a block of words: its box is the line box (lh mm a line) and the width of its words (or `width`) */
export function word(plate: string, x: number, top: number, s: string, o: WO): string {
  const lh = o.lh ?? pt(o.size) * 1.2, tx = o.anchor === 'middle' ? 'translateX(-50%)' : o.anchor === 'end' ? 'translateX(-100%)' : '';
  const font = `${o.italic ? 'italic ' : ''}${o.w ?? 500} ${o.size}pt/${r(lh)}mm '${o.font ?? 'Alegreya Sans'}',serif`;
  return `<div data-in="${plate}"${o.name ? ` data-name="${esc(o.name)}"` : ''}${o.inset != null ? ` data-inset="${o.inset}"` : ''} class="tk-w" style="left:${r(x)}mm;top:${r(top)}mm;font:${font};color:${o.color ?? LOOK.ink}` +
    `${o.ls ? `;letter-spacing:${o.ls}` : ''}${o.upper ? ';text-transform:uppercase' : ''}${o.width != null ? `;width:${r(o.width)}mm;white-space:normal` : ''}${o.align ? `;text-align:${o.align}` : ''}${tx ? `;transform:${tx}` : ''}${o.style ? ';' + o.style : ''}">${s.includes('<') ? s : esc(s)}</div>`;
}
/** one line of words with its caps centred on cy */
export const wordAt = (plate: string, x: number, cy: number, s: string, o: WO) => { const lh = o.lh ?? pt(o.size) * 1.2; return word(plate, x, cy - lh / 2 + sansShift(o), s, { ...o, lh }); };
/** advance widths (em) of the big letters in Alegreya SC 800 (measured in Chromium) */
const ADV: Record<string, number> = { Ж: 0.992, М: 0.838, И: 0.75, Г: 0.539 };
/** a big capital (a ship's letter, a number) centred on (cx, cy): cap height capH mm, at most maxW mm wide (narrowed
 *  if needed); its box is the cap with 0.3 mm round it. The line box is smaller than the font's own (ascent + descent),
 *  so the letter sits in a clipping span (the cap and its overshoot stay inside) and the box is what is printed; lifted
 *  0.019 em, the measured sag of the caps in the line box. */
export function capWord(plate: string, cx: number, cy: number, s: string, capH: number, o: { color: string; maxW?: number; inset?: number; name?: string }): string {
  const em = capH / 0.655, lh = capH + 0.6, adv = [...s].reduce((a, c) => a + (ADV[c] ?? 0.5), 0) * em, sx = o.maxW ? Math.min(1, o.maxW / adv) : 1;
  return `<div data-in="${plate}"${o.name ? ` data-name="${esc(o.name)}"` : ''}${o.inset != null ? ` data-inset="${o.inset}"` : ''} class="tk-w" style="left:${r(cx)}mm;top:${r(cy - lh / 2 - 0.019 * em)}mm;font:800 ${r(em)}mm/${r(lh)}mm 'Alegreya SC',serif;color:${o.color};transform-origin:0 50%;transform:scaleX(${r(sx)}) translateX(-50%);height:${r(lh)}mm"><span class="tk-cap">${esc(s)}</span></div>`;
}
export const ART_CSS = `.tk-w{position:absolute;white-space:nowrap;font-variant-numeric:lining-nums}.tk-cap{display:block;height:100%;overflow:hidden}`;
