// The tempo of the show (P4): how long a card stays, the pause of a bot and the speed factor of animations.
import { describe, expect, it } from 'vitest';
import { ms, type FxCtx } from '../src/ui/game/fx/primitives';
import { SPEEDS, speedFactor } from '../src/ui/game/text';

describe('tempo', () => {
  it('a played card is read 0.55 s × the speed factor (PLAY.card; shorter than the reference 0.9 s): 0.88 / 0.55 / 0.33 s', () => {
    const at = (speed: 'slow' | 'normal' | 'fast' | 'instant') => ms({ speed: speedFactor(speed) } as FxCtx, 550);
    expect([at('slow'), at('normal'), at('fast'), at('instant')]).toEqual([880, 550, 330, 0]);
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
