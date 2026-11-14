// The printed set's geometry and composition (tools/print/layout.ts, docs/tasks/print-kit.md 3.10): sizes in mm,
// the count of cards with copies, the face ↔ back correspondence of every slot, unique picture slugs.
import { describe, expect, it } from 'vitest';
import raw from '../data/game-data.json';
import {
  A4, BACK_CLEAR, BLEED, BLEED_BOX, BLOCK, BOARD, CARD, COUNTS, DECKS, FACE, FRAME, GRID, HOLD, SAFE, TOKEN,
  backOf, backSheet, backSlotOf, cutLines, deckList, deckSheets, priceOf, seaSheets, slot, slug, trackCells, trackWidth,
  type GameData
} from '../tools/print/layout';

const data = raw as unknown as GameData;

describe('print layout: the card sheet', () => {
  it('a card is exactly 63 × 88 mm, nine on a sheet without gaps', () => {
    expect(CARD).toEqual({ w: 63, h: 88 });
    expect(BLOCK).toEqual({ x: 10.5, y: 16.5, w: 189, h: 264 });
    for (let i = 0; i < 9; i++) {
      const s = slot(i);
      expect(s.w).toBe(63); expect(s.h).toBe(88);
      expect(s.x).toBeCloseTo(10.5 + s.col * 63, 6); expect(s.y).toBeCloseTo(16.5 + s.row * 88, 6);
    }
  });
  it('margins are 10.5 mm left/right and 16.5 mm top/bottom', () => {
    expect(GRID.x0).toBe(10.5); expect(A4.w - BLOCK.x - BLOCK.w).toBeCloseTo(10.5, 6);
    expect(GRID.y0).toBe(16.5); expect(A4.h - BLOCK.y - BLOCK.h).toBeCloseTo(16.5, 6);
  });
  it('the bleed runs 3 mm past the block and stays inside a home printer’s area', () => {
    expect(BLEED).toBe(3);
    expect(BLEED_BOX).toEqual({ x: 7.5, y: 13.5, w: 195, h: 270 });
    expect(BLEED_BOX.x).toBeGreaterThanOrEqual(5); expect(A4.h - BLEED_BOX.y - BLEED_BOX.h).toBeGreaterThanOrEqual(12);
  });
  it('cut lines: 4 + 4 inside the bleed box, each continued by marks to the sheet edge', () => {
    const { inner, marks } = cutLines();
    expect(inner).toHaveLength(8); expect(marks).toHaveLength(16);
    for (const l of inner) expect(l.x1 === l.x2 || l.y1 === l.y2).toBe(true);
    expect(marks.filter(m => m.y1 === 0 || m.y2 === A4.h || m.x1 === 0 || m.x2 === A4.w)).toHaveLength(16);
  });
  it('the frame, the safe zone and the face plan', () => {
    expect(FRAME).toBe(2); expect(SAFE).toBe(4); expect(BACK_CLEAR).toBe(9);
    expect(FACE.medal.x).toBeGreaterThanOrEqual(SAFE); expect(FACE.medal.y).toBeGreaterThanOrEqual(SAFE); expect(FACE.price.right).toBeGreaterThanOrEqual(SAFE);
    expect(FACE.band.h).toBe(9); expect(FACE.band.textCenter).toBeGreaterThanOrEqual(SAFE + 1);
    expect(FACE.glass.minTop).toBe(40);
    expect(FACE.index.maxW).toBeLessThanOrEqual(16); expect(FACE.index.maxBottom).toBeLessThanOrEqual(25);
    expect(FACE.index.x + FACE.index.maxW).toBeLessThanOrEqual(20);
    expect(FACE.pt).toMatchObject({ name: 11, text: 8, textMin: 7.5, ribbon: 6.5, band: 6.5, flavor: 7, big: 10 });
  });
});

describe('print layout: faces and backs', () => {
  it('the back of slot (row, col) is slot (row, 2 − col)', () => {
    for (let i = 0; i < 9; i++) {
      const f = slot(i), b = slot(backSlotOf(i));
      expect(b.row).toBe(f.row); expect(b.col).toBe(2 - f.col);
      // the two rectangles coincide when the sheet is flipped on its long edge
      expect(A4.w - (b.x + b.w)).toBeCloseTo(f.x, 6); expect(b.y).toBeCloseTo(f.y, 6);
      expect(backSlotOf(backSlotOf(i))).toBe(i);
    }
  });
  it('12 deck sheets: 96 cards with copies, 4 Legends, 4 «Как читать карту», 4 spares', () => {
    const sheets = deckSheets(data);
    expect(sheets).toHaveLength(12);
    const items = sheets.flatMap(s => s.items);
    expect(items).toHaveLength(108);
    expect(items.filter(i => i.kind === 'card')).toHaveLength(96);
    expect(items.filter(i => i.kind === 'legend')).toHaveLength(4);
    expect(items.filter(i => i.kind === 'howto')).toHaveLength(4);
    expect(items.filter(i => i.kind === 'spare')).toHaveLength(4);
    for (const deck of DECKS) {
      expect(deckList(data, deck)).toHaveLength(24);
      const own = sheets.filter(s => s.deck === deck);
      expect(own).toHaveLength(3);
      // every card of a deck sheet belongs to the sheet's deck, the Legend lies on the deck's third sheet
      for (const s of own) for (const it of s.items) if ('deck' in it) expect(it.deck).toBe(deck);
      expect(own[2].items.filter(i => i.kind === 'legend').map(i => i.kind === 'legend' && i.card.name)).toEqual([data.legends[deck].name]);
      // copies as in the data
      for (const c of data.decks[deck]) expect(own.flatMap(s => s.items).filter(i => i.kind === 'card' && i.card.name === c.name)).toHaveLength(c.copies ?? 1);
    }
    expect(sheets.map(s => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('2 sea sheets: 17 cards and «Как читать карту моря»', () => {
    const sheets = seaSheets(data), items = sheets.flatMap(s => s.items);
    expect(sheets).toHaveLength(2);
    expect(items.filter(i => i.kind === 'sea')).toHaveLength(17);
    expect(items.filter(i => i.kind === 'howto-sea')).toHaveLength(1);
    expect(96 + 4 + items.filter(i => i.kind === 'sea').length).toBe(117);
  });
  it('every slot: the back lies behind its face; an empty slot is empty on both sides', () => {
    for (const sh of [...deckSheets(data), ...seaSheets(data)]) {
      const backs = backSheet(sh.items);
      expect(backs).toHaveLength(9);
      sh.items.forEach((it, i) => {
        expect(backs[backSlotOf(i)]).toEqual(backOf(it));
        if (it.kind === 'empty') expect(backs[backSlotOf(i)]).toEqual({ back: 'none' });
      });
    }
  });
  it('backs: a deck’s card, spare and Legend carry the deck’s back; reference cards a neutral one', () => {
    expect(backOf({ kind: 'card', deck: 'Ж', card: data.decks['Ж'][0], copy: 0 })).toEqual({ back: 'deck', deck: 'Ж' });
    expect(backOf({ kind: 'legend', deck: 'Г', card: data.legends['Г'] })).toEqual({ back: 'deck', deck: 'Г', legend: true });
    expect(backOf({ kind: 'spare', deck: 'И' })).toEqual({ back: 'deck', deck: 'И' });
    expect(backOf({ kind: 'howto', deck: 'М' })).toEqual({ back: 'neutral' });
    expect(backOf({ kind: 'sea', card: data.sea[0] })).toEqual({ back: 'sea' });
  });
  it('picture slugs are unique for all 102 names', () => {
    const names = [...new Set(DECKS.flatMap(d => data.decks[d].map(c => c.name))), ...DECKS.map(d => data.legends[d].name), ...data.sea.map(c => c.name)];
    expect(names).toHaveLength(81 + 4 + 17);
    expect(new Set(names.map(slug)).size).toBe(names.length);
    for (const n of names) expect(slug(n)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('the price icon follows cost / soul of the data, a free card has none', () => {
    for (const c of [...DECKS.flatMap(d => data.decks[d]), ...DECKS.map(d => data.legends[d])]) {
      const p = priceOf(c);
      expect(p.powder).toBe(c.cost > 0 ? c.cost : 0); expect(p.soul).toBe(c.soul > 0 ? c.soul : 0);
      expect(p.powder).toBeLessThanOrEqual(4); expect(p.soul).toBeLessThanOrEqual(5); // icons coin-1…4, flask-1…5 exist
    }
    expect(priceOf(data.legends['Г'])).toEqual({ powder: 0, soul: 3 });
    expect(priceOf(data.decks['Ж'][0])).toEqual({ powder: 0, soul: 0 });
  });
});

describe('print layout: tokens, holds, boards', () => {
  it('token sizes', () => {
    expect(TOKEN.powder).toBe(20); expect(TOKEN.fire).toBe(20); expect(TOKEN.marker).toBe(11);
    expect(TOKEN.underwater).toEqual({ w: 50, h: 25 });
    expect(COUNTS).toEqual({ powder: 24, fire: 9, markers: 17 });
    expect(data.ships.length * 4 + 1).toBe(COUNTS.markers);
  });
  it('a hold: 8 cells Ø 22 mm take a token of 20 mm and fit the sheet', () => {
    expect(HOLD.cell).toBe(22); expect(HOLD.cell).toBeGreaterThan(TOKEN.powder);
    expect(HOLD.cells * HOLD.cell + (HOLD.cells - 1) * HOLD.gap).toBe(190);
  });
  it('board tracks: cells Ø 13 mm at 14.5 mm, a marker of 11 mm inside, the longest track fits a landscape A4', () => {
    expect(BOARD.cell).toBe(13); expect(BOARD.pitch).toBe(14.5); expect(BOARD.cell).toBeGreaterThanOrEqual(12);
    expect(TOKEN.marker).toBeLessThan(BOARD.cell);
    const longest = Math.max(...data.ships.map(s => s.hull));
    expect(trackCells(longest)).toHaveLength(longest + 1);
    expect(trackWidth(longest + 1)).toBeCloseTo(12 * 14.5 + 13, 6);
    expect(trackWidth(longest + 1) + BOARD.textCol).toBeLessThanOrEqual(297 - 2 * 8);
    for (const s of data.ships) for (const k of ['hull', 'sails', 'guns', 'crew'] as const) expect(trackCells(s[k])[trackCells(s[k]).length - 1]).toBe(s[k]);
    const dutch = data.ships.find(s => s.code === 'Г')!;
    expect(trackCells(dutch.souls!)).toEqual([0, 1, 2, 3, 4, 5]); expect(dutch.start_souls).toBe(1);
  });
});
