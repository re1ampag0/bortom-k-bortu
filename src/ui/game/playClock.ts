// V7: how long the game went, for the victory sheet («58 минут», «1 ч 12 мин»). The device counts it, only while the tab
// is open; a gap of more than 5 minutes (the computer asleep, the tab forgotten) does not count. The clock is kept next to
// the autosave (storage.ts); a game whose clock is lost (another device, a cleared browser) shows no minutes.
import { useEffect, useRef } from 'react';
import { loadClock, storeClock } from '../storage';

export interface PlayClock {
  /** The game it counts: «local:<seed>», «net:<room>:<seed>». */
  id: string;
  ms: number;
}

/** A gap longer than this between two ticks is a pause: it does not count. */
export const PAUSE_MAX = 5 * 60_000;
/** How often the open tab ticks. */
export const TICK = 15_000;

/** The time from the last tick to `now`, if it is not a pause. */
export function addGap(c: PlayClock, last: number | null, now: number): PlayClock {
  if (last === null) return c;
  const gap = now - last;
  return gap > 0 && gap <= PAUSE_MAX ? { ...c, ms: c.ms + gap } : c;
}

/** «меньше минуты», «58 минут», «1 ч», «1 ч 12 мин». */
export function formatPlayTime(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 1) return 'меньше минуты';
  if (m < 60) {
    const m10 = m % 10, m100 = m % 100;
    const w = m10 === 1 && m100 !== 11 ? 'минута' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'минуты' : 'минут';
    return `${m} ${w}`;
  }
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} ч ${r} мин` : `${h} ч`;
}

/**
 * The clock of the game `id` while it goes (`running`); returns a getter of the minutes so far (null — no clock).
 * `fresh` — the game starts now: no clock of it yet is a clock at 0; otherwise (a game loaded half-way) there is none.
 */
export function usePlayClock(id: string, fresh: boolean, running: boolean): () => number | null {
  const clock = useRef<PlayClock | null>(null);
  const last = useRef<number | null>(null);
  if (clock.current?.id !== id) {
    const kept = loadClock();
    clock.current = kept?.id === id ? kept : fresh ? { id, ms: 0 } : null;
    last.current = null;
  }
  useEffect(() => {
    if (!running || !clock.current) return;
    const tick = () => {
      const now = Date.now();
      if (clock.current) clock.current = addGap(clock.current, last.current, now);
      last.current = document.visibilityState === 'visible' ? now : null;
      if (clock.current) storeClock(clock.current);
    };
    last.current = document.visibilityState === 'visible' ? Date.now() : null;
    const t = setInterval(tick, TICK);
    document.addEventListener('visibilitychange', tick);
    addEventListener('pagehide', tick);
    return () => {
      tick();
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
      removeEventListener('pagehide', tick);
    };
  }, [id, running]);
  return () => {
    const c = clock.current;
    if (!c) return null;
    return running ? addGap(c, last.current, Date.now()).ms : c.ms;
  };
}
