// Every colour of the printed set (docs/tasks/print-kit.md 0.7, review-repo 10). Cards and backs use the colours of
// the approved mock-up (docs/mockups/print/V2type.html, Backs2.html); boards, track markers and ship tokens use the
// ship colours of data/game-data.json.
export type DeckCode = 'Ж' | 'М' | 'И' | 'Г';
export type CardType = 'ЗАРЯД' | 'ПРИКАЗ' | 'РЕМОНТ' | 'РЕАКЦИЯ';

/** Deck strip, the 2 mm forgiving frame and the back's ground. */
export const DECK_BAND: Record<DeckCode, string> = { 'Ж': '#26262a', 'М': '#8e2420', 'И': '#24497a', 'Г': '#2f6b4a' };
/** Glass rim «в цвет корабля». */
export const DECK_RIM: Record<DeckCode, string> = { 'Ж': '#9a9aa4', 'М': '#c8523a', 'И': '#5a86c0', 'Г': '#5ea47e' };
/** Glass tint «в цвет корабля» (V2ship.html). */
export const DECK_TINT: Record<DeckCode, string> = { 'Ж': '#0c0c10', 'М': '#3a0c0a', 'И': '#0e2240', 'Г': '#0e2a1c' };
export const DECK_NAME: Record<DeckCode, string> = { 'Ж': 'Чёрная жемчужина', 'М': 'Месть королевы Анны', 'И': 'Индевор', 'Г': 'Летучий голландец' };
export const DECK_KEY: Record<DeckCode, 'pearl' | 'revenge' | 'endeavour' | 'dutch'> = { 'Ж': 'pearl', 'М': 'revenge', 'И': 'endeavour', 'Г': 'dutch' };

/** Type colours: t — the ring and ribbon, td — dark, tl — light, tint — the glass «в цвет типа». */
export const TYPE: Record<CardType, { key: string; t: string; td: string; tl: string; tint: string; when: string }> = {
  'ЗАРЯД': { key: 'charge', t: '#c4602f', td: '#8a3c1c', tl: '#f0a070', tint: '#3a160a', when: 'к своему Залпу' },
  'ПРИКАЗ': { key: 'order', t: '#7a5c9c', td: '#4f3868', tl: '#b9a0d8', tint: '#24163a', when: 'в свой ход' },
  'РЕМОНТ': { key: 'repair', t: '#4a8f56', td: '#2c5e35', tl: '#90d09a', tint: '#0f2a16', when: 'в свой ход' },
  'РЕАКЦИЯ': { key: 'reaction', t: '#3a7aa2', td: '#1f5070', tl: '#88c0e6', tint: '#0e2238', when: 'в ход противника' }
};
/** The sea deck: its own medal, ribbon, glass and strip. */
export const SEA = { t: '#2f8a96', td: '#17525c', tl: '#8fd6de', tint: '#08242c', band: '#16404e', rim: '#6fb6c0' };

export const BRASS = '#b8893a';
export const BRASS_LIGHT = '#e2b75c';
export const BRASS_DARK = '#3a220e';
export const PARCHMENT = '#f6ecd4';
export const INK = '#2a1c0c';
/** Text on the dark glass: rule text is pure white (paper), cream and gold only from 10 pt up (review-print 9). */
export const ON_GLASS = { text: '#ffffff', name: '#ffe9b8', big: '#ffd27a', soul: '#8ff0e2', cream: '#f6ecd6' };

const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => '#' + v.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
/** Mix towards white by share k (0-1). */
export const lighten = (c: string, k: number) => toHex(hex(c).map(v => v + (255 - v) * k));
export const darken = (c: string, k: number) => toHex(hex(c).map(v => v * (1 - k)));
/** WCAG relative luminance of an sRGB colour. */
export function luminance(c: string): number {
  const [r, g, b] = hex(c).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** The cut line inside the block: the frame colour 35 % lighter — seen while cutting, lost on the card's edge. */
export const cutColor = (frame: string) => lighten(frame, 0.35);
