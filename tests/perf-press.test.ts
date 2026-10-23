// ui-press: the window «нажатие» of ?perf=1 — the frames after a press, its renders, the clips that began in it.
import {afterEach, describe, expect, it, vi} from 'vitest';
import {lastPresses, pressOpen, pressPhases, pressRender, pressStop, pressText} from '../src/ui/game/perf/press';

describe('the window «нажатие»', () => {
  afterEach(() => { pressStop(); pressPhases(null); vi.unstubAllGlobals(); });

  it('ranks the frames of 1.5 s after the press and names the show that began in it', () => {
    const queue: ((t: number) => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (fn: (t: number) => void) => queue.push(fn));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    pressPhases((from, to) => [{at: 300, end: Infinity, clip: 'announce', name: 'announce', kind: 'clip' as const}].filter((p) => p.at < to && p.end > from));
    pressOpen('fire', 100);
    pressRender(40);
    pressRender(12);
    // the frames: 16 ms to the first, one of 117 ms, then even 50-ms steps past the end of the window
    for (const t of [116, 133, 250, ...Array.from({length: 30}, (_, i) => 300 + i * 50)]) queue.shift()?.(t);
    const [p] = lastPresses();
    expect(p).toMatchObject({name: 'fire', firstFrameMs: 16, worstFrameMs: 117, framesOver50: 1, renders: 2, renderMaxMs: 40, clips: ['announce']});
    expect(p.worstFrames[0]).toMatchObject({at: 33, ms: 117});
    expect(pressText(p)).toContain('fire → показ: announce');
    expect(queue).toHaveLength(0);
  });

  it('a press inside a window starts a new one; without a window nothing reads the clock', () => {
    const now = vi.spyOn(performance, 'now');
    pressRender(5);
    expect(now).not.toHaveBeenCalled();
    expect(lastPresses()).toEqual([]);
    now.mockRestore();
    const queue: ((t: number) => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (fn: (t: number) => void) => queue.push(fn));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    pressOpen('volley-Ж', 0);
    queue.shift()?.(16);
    pressOpen('lift-play', 20);
    expect(lastPresses().map((p) => p.name)).toEqual(['volley-Ж']);
  });
});
