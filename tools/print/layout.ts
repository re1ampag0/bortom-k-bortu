// The geometry of the printed set in millimetres: pure functions, no node:* and no browser (the Vitest test
// tests/print-layout.test.ts imports this file). docs/tasks/print-kit.md 3.2-3.6 with the reviews' numbers.
import type { DeckCode } from './colors';

export const A4 = { w: 210, h: 297 };
export const CARD = { w: 63, h: 88 };
/** 3 × 3 cards without gaps: the block is 189 × 264, margins 10.5 left/right and 16.5 top/bottom. */
export const GRID = { cols: 3, rows: 3, x0: 10.5, y0: 16.5 };
export const BLOCK = { x: GRID.x0, y: GRID.y0, w: GRID.cols * CARD.w, h: GRID.rows * CARD.h };
/** The frame (faces) and the ground (backs) run 3 mm past the block's outer edge. */
export const BLEED = 3;
export const BLEED_BOX = { x: BLOCK.x - BLEED, y: BLOCK.y - BLEED, w: BLOCK.w + 2 * BLEED, h: BLOCK.h + 2 * BLEED };
/** The forgiving frame along every card edge. */
export const FRAME = 2;
/** Nothing that matters is closer to the card edge. */
export const SAFE = 4;
/** No line parallel to the edge on a card back closer than this (the back may shift by 3 mm). */
export const BACK_CLEAR = 9;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Slot extends Rect { i: number; row: number; col: number }
export const slot = (i: number): Slot => { const row = Math.floor(i / GRID.cols), col = i % GRID.cols; return { i, row, col, x: GRID.x0 + col * CARD.w, y: GRID.y0 + row * CARD.h, w: CARD.w, h: CARD.h }; };
/** The back of the card in face slot i (flip on the long edge of a portrait sheet): same row, column 2 − col. */
export const backSlotOf = (i: number): number => { const s = slot(i); return s.row * GRID.cols + (GRID.cols - 1 - s.col); };

export interface Line { x1: number; y1: number; x2: number; y2: number }
/** Cut lines: inside the bleed box along every card edge; marks from the bleed box to the sheet edge. */
export function cutLines(): { inner: Line[]; marks: Line[] } {
  const inner: Line[] = [], marks: Line[] = [], b = BLEED_BOX;
  for (let c = 0; c <= GRID.cols; c++) { const x = GRID.x0 + c * CARD.w; inner.push({ x1: x, y1: b.y, x2: x, y2: b.y + b.h }); marks.push({ x1: x, y1: 0, x2: x, y2: b.y }, { x1: x, y1: b.y + b.h, x2: x, y2: A4.h }); }
  for (let r = 0; r <= GRID.rows; r++) { const y = GRID.y0 + r * CARD.h; inner.push({ x1: b.x, y1: y, x2: b.x + b.w, y2: y }); marks.push({ x1: 0, y1: y, x2: b.x, y2: y }, { x1: b.x + b.w, y1: y, x2: A4.w, y2: y }); }
  return { inner, marks };
}

/** The card face (mm from the card's own top-left corner). */
export const FACE = {
  medal: { x: 4, y: 4, d: 9.2 },
  price: { right: 4, y: 4, d: 9.2, gap: 1.9 },
  /** fan index (review-player 1.1): the small price on the medal's lower right rim and the plate under the medal */
  index: { priceD: 5.5, priceCx: 12, priceCy: 12, x: 4, y: 14.7, maxW: 16, maxBottom: 25, alpha: 0.8 },
  /** the glass text plate: side inset, its bottom above the card's bottom, and how high its top may climb */
  glass: { inset: 3.4, bottom: 10.3, minTop: 40, radius: 2.1 },
  /** the deck strip: 9 mm high, its lettering centred 5 mm above the card's bottom edge */
  band: { h: 9, textCenter: 5 },
  /** minimal font sizes, pt (review-print 9) */
  pt: { name: 11, ribbon: 6.5, big: 10, text: 8, textMin: 7.5, flavor: 7, band: 6.5, plan: 6 }
};

/** Tokens, holds, boards (review-print 13-14, review-player 3.1, summary 0а.8). */
export const TOKEN = { powder: 20, fire: 20, marker: 11, underwater: { w: 50, h: 25 }, shipToken: 30 };
export const HOLD = { cells: 8, cell: 22, gap: 2 };
export const BOARD = { cell: 13, pitch: 14.5, textCol: 85, fireSlot: 20, underwaterSlot: { w: 52, h: 27 } };
export const COUNTS = { powder: 24, fire: 9, markers: 17 };

const T: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
/** The same slug as tools/card-art/export.mjs. */
export const slug = (n: string): string => n.toLowerCase().split('').map(c => T[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface DeckCard { name: string; type: string; cost: number; soul: number; big: string; text: string; flavor: string; copies?: number; legend?: boolean }
export interface SeaCard { name: string; when: string; big: string; text: string; flavor: string; key: string }
export interface Ship { code: DeckCode; name: string; short: string; captain: string; side: string; color: string; motto: string; hull: number; sails: number; guns: number; crew: number; souls?: number; start_souls?: number; legend: string; tips: string[]; abilities: { name: string; text: string }[]; nick: string; [k: string]: unknown }
export interface GameData { ships: Ship[]; decks: Record<DeckCode, DeckCard[]>; legends: Record<DeckCode, DeckCard>; sea: SeaCard[]; [k: string]: unknown }

/** What lies in one slot of a card sheet. */
export type Item =
  | { kind: 'card'; deck: DeckCode; card: DeckCard; copy: number }
  | { kind: 'legend'; deck: DeckCode; card: DeckCard }
  | { kind: 'howto'; deck: DeckCode }
  | { kind: 'spare'; deck: DeckCode }
  | { kind: 'sea'; card: SeaCard }
  | { kind: 'howto-sea' }
  | { kind: 'empty' };
export interface Sheet { deck: DeckCode | 'sea'; n: number; of: number; items: Item[] }
export const DECKS: DeckCode[] = ['Ж', 'М', 'И', 'Г'];

/** A deck's cards with their copies, in the data's order (24 per deck). */
export const deckList = (data: GameData, deck: DeckCode): { card: DeckCard; copy: number }[] =>
  data.decks[deck].flatMap(card => Array.from({ length: card.copies ?? 1 }, (_, copy) => ({ card, copy })));

/** 12 sheets: three per deck (9 + 9 + 6 cards); the third also carries the deck's Legend, «Как читать карту» and a spare. */
export function deckSheets(data: GameData): Sheet[] {
  const out: Sheet[] = [];
  for (const deck of DECKS) {
    const items: Item[] = deckList(data, deck).map(c => ({ kind: 'card' as const, deck, ...c }));
    items.push({ kind: 'legend', deck, card: data.legends[deck] }, { kind: 'howto', deck }, { kind: 'spare', deck });
    for (let i = 0; i < items.length; i += 9) out.push({ deck, n: 0, of: 0, items: items.slice(i, i + 9) });
  }
  out.forEach((s, i) => { s.n = i + 1; s.of = out.length; while (s.items.length < 9) s.items.push({ kind: 'empty' }); });
  return out;
}
/** 2 sheets of the sea deck: 9 + 8 cards and «Как читать карту моря». */
export function seaSheets(data: GameData): Sheet[] {
  const items: Item[] = data.sea.map(card => ({ kind: 'sea' as const, card }));
  items.push({ kind: 'howto-sea' });
  const out: Sheet[] = [];
  for (let i = 0; i < items.length; i += 9) out.push({ deck: 'sea', n: 0, of: 0, items: items.slice(i, i + 9) });
  out.forEach((s, i) => { s.n = i + 1; s.of = out.length; while (s.items.length < 9) s.items.push({ kind: 'empty' }); });
  return out;
}
/** Which back lies behind an item: the deck's back, the deck's back with the Legend plaque, the neutral one, the sea's, or nothing. */
export type BackKind = { back: 'deck'; deck: DeckCode; legend?: boolean } | { back: 'sea' } | { back: 'neutral' } | { back: 'none' };
export function backOf(item: Item): BackKind {
  switch (item.kind) {
    case 'card': case 'spare': return { back: 'deck', deck: item.deck };
    case 'legend': return { back: 'deck', deck: item.deck, legend: true };
    case 'sea': return { back: 'sea' };
    case 'howto': case 'howto-sea': return { back: 'neutral' };
    default: return { back: 'none' };
  }
}
/** The back sheet of a face sheet: the item of face slot i lies in back slot backSlotOf(i). */
export function backSheet(items: Item[]): BackKind[] {
  const out: BackKind[] = Array.from({ length: 9 }, () => ({ back: 'none' as const }));
  items.forEach((it, i) => { out[backSlotOf(i)] = backOf(it); });
  return out;
}

/** The cells of a board track: 0 … start (repairs never go above the start, RULES 3.7). Souls: 0 … max, start marked by a word. */
export const trackCells = (start: number): number[] => Array.from({ length: start + 1 }, (_, i) => i);
export const trackWidth = (cells: number): number => (cells - 1) * BOARD.pitch + BOARD.cell;

/** The price icon of a card: Powder coin, Soul flask, both, or none for a free card (review-player 1.5, 6.2). */
export const priceOf = (c: { cost: number; soul: number }): { powder: number; soul: number } => ({ powder: c.cost > 0 ? c.cost : 0, soul: c.soul > 0 ? c.soul : 0 });
