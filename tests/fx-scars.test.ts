// FX-A: the traces of the effects (src/ui/game/fx/scars.ts; docs/mockups/a5/fx/ANIMATIONS.md, §2) — the pure part:
// how long each trace lives, half as long with «простые спецэффекты», the opacity by age, the oldest go beyond six.
import { describe, expect, it } from 'vitest';
import { overflowScars, SCAR_LIFE, SCAR_MAX, scarOpacity, scarSpan } from '../src/ui/game/fx/scars';

describe('the traces of the effects', () => {
  it('the lives of ANIMATIONS.md: short 3 + 9 s, medium 9 + 12 s, long 14 + 14 s; «простые» — half as long', () => {
    expect(SCAR_LIFE).toEqual({ short: [3000, 9000], medium: [9000, 12000], long: [14000, 14000] });
    expect(scarSpan('medium', true)).toEqual([9000, 12000]);
    expect(scarSpan('medium', false)).toEqual([4500, 6000]);
    expect(scarSpan('long', false)).toEqual([7000, 7000]);
  });

  it('a trace holds, then fades evenly and is over at the end of its life', () => {
    const [hold, fade] = SCAR_LIFE.short;
    expect(scarOpacity(0, hold, fade)).toBe(1);
    expect(scarOpacity(hold, hold, fade)).toBe(1);
    expect(scarOpacity(hold + fade / 2, hold, fade)).toBeCloseTo(0.5);
    expect(scarOpacity(hold + fade, hold, fade)).toBeNull();
  });

  it('at most six on the table: a seventh pushes the oldest out', () => {
    expect(SCAR_MAX).toBe(6);
    expect(overflowScars([1, 2, 3, 4, 5, 6])).toEqual([]);
    expect(overflowScars([1, 2, 3, 4, 5, 6, 7])).toEqual([1]);
    expect(overflowScars([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([1, 2]);
  });
});
