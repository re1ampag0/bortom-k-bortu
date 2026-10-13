// Words of the interface that depend on the side, the track or the speed.
import type { Side } from '../../engine/types';
import type { Speed } from '../storage';

export const SIDE_LABEL: Record<Side, { name: string; gen: string; acc: string; dat: string; upper: string }> = {
  ПИРАТЫ: { name: 'Пираты', gen: 'Пиратов', acc: 'Пиратов', dat: 'Пиратам', upper: 'ПИРАТЫ' },
  КОМПАНИЯ: { name: 'Компания', gen: 'Компании', acc: 'Компанию', dat: 'Компании', upper: 'КОМПАНИЯ' },
};

/** Pause after each bot move. «Мгновенно» is for tests: no pause at all. */
export const SPEEDS: Record<Speed, { label: string; ms: number }> = {
  slow: { label: 'медленно (1 с)', ms: 1000 },
  normal: { label: 'обычно (0,6 с)', ms: 600 },
  fast: { label: 'быстро (0,25 с)', ms: 250 },
  instant: { label: 'мгновенно', ms: 0 },
};
