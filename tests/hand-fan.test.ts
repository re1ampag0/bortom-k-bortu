// V2: the place of a card in the fan of the hand (Hand.tsx fanOf): A5Table.html tilts five cards −7°, −3°, 0, 3°, 7°
// and lays the edges lower than the middle.
import { describe, expect, it } from 'vitest';
import { fanOf } from '../src/ui/game/Hand';

describe('the fan of the hand', () => {
  it('five cards: symmetric tilts up to ±7°, the middle straight and the highest, the edges at the line of the hand', () => {
    const f = Array.from({ length: 5 }, (_, k) => fanOf(k, 5));
    expect(f.map((x) => x.r)).toEqual([-7, -3.5, 0, 3.5, 7]);
    expect(f[0].dy).toBe(0);
    expect(f[4].dy).toBe(0);
    expect(f[2].dy).toBeLessThan(f[1].dy);
    expect(f[1].dy).toBeLessThan(0);
  });

  it('never tilts more than ±7° and never lies below the line of the hand, however many cards', () => {
    for (let n = 1; n <= 12; n++) {
      for (let k = 0; k < n; k++) {
        const { r, dy } = fanOf(k, n);
        expect(Math.abs(r)).toBeLessThanOrEqual(7);
        expect(dy).toBeLessThanOrEqual(0);
        expect(dy).toBeGreaterThanOrEqual(-10);
      }
    }
    expect(fanOf(0, 1)).toEqual({ r: 0, dy: 0 });
  });

  it('«Палуба» on a wide window: a real fan — ±3° at the edges (±8° with 8 cards), 0° in the middle, the edges 12 px lower', () => {
    const five = Array.from({ length: 5 }, (_, k) => fanOf(k, 5, true));
    expect(five.map((f) => f.r)).toEqual([-3, -1.5, 0, 1.5, 3]);
    expect(five.map((f) => f.dy)).toEqual([12, 3, 0, 3, 12]);
    const eight = Array.from({ length: 8 }, (_, k) => fanOf(k, 8, true));
    expect(eight[0].r).toBe(-8);
    expect(eight[7].r).toBe(8);
    expect(eight[0].dy).toBe(12);
  });
});
