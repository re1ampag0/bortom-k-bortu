// V7: the minutes of the game (src/ui/game/playClock.ts).
import { describe, expect, it } from 'vitest';
import { addGap, formatPlayTime, PAUSE_MAX } from '../src/ui/game/playClock';

describe('addGap', () => {
  const c = { id: 'local:1', ms: 60_000 };
  it('adds the time since the last tick', () => {
    expect(addGap(c, 1000, 16_000)).toEqual({ id: 'local:1', ms: 75_000 });
  });
  it('a pause of more than 5 minutes does not count; no last tick (the tab was hidden) — nothing', () => {
    expect(addGap(c, 0, PAUSE_MAX + 1)).toBe(c);
    expect(addGap(c, 0, PAUSE_MAX).ms).toBe(60_000 + PAUSE_MAX);
    expect(addGap(c, null, 99_999)).toBe(c);
    expect(addGap(c, 5000, 4000)).toBe(c);
  });
});

describe('formatPlayTime', () => {
  it('minutes in words, an hour and more — «ч» and «мин»', () => {
    const min = (m: number) => formatPlayTime(m * 60_000);
    expect([0.2, 1, 2, 5, 11, 21, 23, 58].map(min)).toEqual(['меньше минуты', '1 минута', '2 минуты', '5 минут', '11 минут', '21 минута', '23 минуты', '58 минут']);
    expect([60, 72, 125].map(min)).toEqual(['1 ч', '1 ч 12 мин', '2 ч 5 мин']);
  });
});
