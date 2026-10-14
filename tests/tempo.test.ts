// The tempo of the show (P4): how long a card or a Volley stays, the pause of a bot and the speed factor of animations.
import { describe, expect, it } from 'vitest';
import { SHOW_MS } from '../src/ui/game/Show';
import { SPEEDS, speedFactor } from '../src/ui/game/text';

describe('tempo', () => {
  it('shows a card or a Volley for 2.6 / 1.8 / 1 s', () => {
    expect(SHOW_MS).toEqual({ slow: 2600, normal: 1800, fast: 1000, instant: 0 });
  });

  it('a bot waits 2 / 1.2 / 0.5 s before a move, and the settings say so', () => {
    expect([SPEEDS.slow.ms, SPEEDS.normal.ms, SPEEDS.fast.ms, SPEEDS.instant.ms]).toEqual([2000, 1200, 500, 0]);
    expect(SPEEDS.slow.label).toBe('медленно (2 с)');
    expect(SPEEDS.normal.label).toBe('обычно (1,2 с)');
    expect(SPEEDS.fast.label).toBe('быстро (0,5 с)');
  });

  it('speedFactor: 1.6 / 1 / 0.6 / 0', () => {
    expect([speedFactor('slow'), speedFactor('normal'), speedFactor('fast'), speedFactor('instant')]).toEqual([1.6, 1, 0.6, 0]);
  });
});
