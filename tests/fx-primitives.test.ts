// A2: the pure parts of the effect primitives (the rest is DOM: e2e).
import { describe, expect, it, vi } from 'vitest';
import { ABORT, at, cardHTML, curve, flushClock, ms, pauseClock, resumeClock, wait, type FxCtx } from '../src/ui/game/fx/primitives';
import { speedFactor } from '../src/ui/game/text';
import { data } from './helpers';

function ctx(speed: number, run = 1, live = () => 1): FxCtx {
  return { speed, run, live } as unknown as FxCtx;
}

describe('effect primitives', () => {
  it('curve: from p0 to p1 in n + 1 points, bent aside', () => {
    const pts = curve({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.2, 10);
    expect(pts).toHaveLength(11);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[10].x).toBeCloseTo(100);
    expect(pts[10].y).toBeCloseTo(0);
    expect(pts[5].y).toBeGreaterThan(0);
    expect(curve({ x: 0, y: 0 }, { x: 0, y: 50 }, 0)).toHaveLength(19);
  });

  it('every duration × the speed factor of P4', () => {
    expect(ms(ctx(speedFactor('slow')), 1000)).toBe(1600);
    expect(ms(ctx(speedFactor('normal')), 1000)).toBe(1000);
    expect(ms(ctx(speedFactor('fast')), 1000)).toBe(600);
  });

  it('wait resolves in its run and rejects with ABORT when the run changed', async () => {
    await expect(wait(ctx(0.01), 10)).resolves.toBeUndefined();
    await expect(wait(ctx(0.01, 1, () => 2), 10)).rejects.toBe(ABORT);
  });

  it('«Пауза» stops the clock of a clip in the middle, «Дальше» goes on with the time left; a cut-off run ends at once', async () => {
    vi.useFakeTimers();
    try {
      const fired: number[] = [];
      at(ctx(1), 1000, () => fired.push(1));
      vi.advanceTimersByTime(600);
      pauseClock();
      vi.advanceTimersByTime(5000);
      expect(fired, 'nothing fires while paused').toEqual([]);
      resumeClock();
      vi.advanceTimersByTime(399);
      expect(fired).toEqual([]);
      vi.advanceTimersByTime(1);
      expect(fired, 'the 400 ms left').toEqual([1]);
      // «До конца хода» while paused: the old run's wait ends with ABORT now, its at() does nothing
      let run = 1;
      const old = ctx(1, 1, () => run);
      pauseClock();
      const w = wait(old, 1000);
      at(old, 500, () => fired.push(2));
      run = 2;
      flushClock();
      await expect(w).rejects.toBe(ABORT);
      expect(fired).toEqual([1]);
      resumeClock();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a flying card has the markup of a card in the hand', () => {
    const html = cardHTML(data, 'Ж-01');
    expect(html).toMatch(/^<button class="hcard charge has-card-art" tabindex="-1" data-fx-card="Ж-01">/);
    expect(html).toContain('class="hcard-name"');
    expect(html).toContain('/thumb/yadra.webp');
    expect(html).toContain('background-size:contain');
    expect(cardHTML(data, 'Ж-Л')).not.toContain('/thumb/');
    expect(cardHTML(data, '?')).toContain('hcard back');
  });
});
