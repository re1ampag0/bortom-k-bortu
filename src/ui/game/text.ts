// Words of the interface that depend on the side, the track or the speed.
import type { Side } from '../../engine/types';
import type { Speed } from '../storage';

export const SIDE_LABEL: Record<Side, { name: string; gen: string; acc: string; dat: string; upper: string }> = {
  ПИРАТЫ: { name: 'Пираты', gen: 'Пиратов', acc: 'Пиратов', dat: 'Пиратам', upper: 'ПИРАТЫ' },
  КОМПАНИЯ: { name: 'Компания', gen: 'Компании', acc: 'Компанию', dat: 'Компании', upper: 'КОМПАНИЯ' },
};

/** Pause before each bot move. «Мгновенно» is for tests: no pause at all. */
export const SPEEDS: Record<Speed, { label: string; ms: number }> = {
  slow: { label: 'медленно (2 с)', ms: 2000 },
  normal: { label: 'обычно (1,2 с)', ms: 1200 },
  fast: { label: 'быстро (0,5 с)', ms: 500 },
  instant: { label: 'мгновенно', ms: 0 },
};

const FACTOR: Record<Speed, number> = { slow: 1.6, normal: 1, fast: 0.6, instant: 0 };

/** How much longer (or shorter) than at «обычно» an animation lasts at the speed; 0 — no animation at all. */
export function speedFactor(speed: Speed): number {
  return FACTOR[speed];
}
