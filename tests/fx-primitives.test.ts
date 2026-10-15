// A2: the pure parts of the effect primitives (the rest is DOM: e2e).
import { describe, expect, it } from 'vitest';
import { ABORT, cardHTML, curve, ms, wait, type FxCtx } from '../src/ui/game/fx/primitives';
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

  it('a flying card has the markup of a card in the hand', () => {
    const html = cardHTML(data, 'Ж-01');
    expect(html).toMatch(/^<button class="hcard [a-z ]+" tabindex="-1" data-fx-card="Ж-01">/);
    expect(html).toContain('class="hcard-name"');
    expect(cardHTML(data, '?')).toContain('hcard back');
  });
});
