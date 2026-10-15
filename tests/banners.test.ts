// S1: the sea card of a new round is shown once — by the clip «sea» of the animation layer, or by the banner when the
// layer is off (prefers-reduced-motion, «мгновенно», the curtain, «До конца хода»).
import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../src/engine/state';
import { bannersOf } from '../src/ui/game/Banners';

const events = [
  { type: 'roundStarted', round: 2 },
  { type: 'seaRevealed', card: 'S1', reshuffled: false },
  { type: 'turnStarted', side: 'ПИРАТЫ' },
] as unknown as GameEvent[];

describe('the banners of an action', () => {
  it('the layer plays: no sea banner, no turn banner (the clips draw them)', () => {
    expect(bannersOf(events, { enabled: true, turnBanners: false, seaBanners: false })).toEqual([]);
  });
  it('the layer is off: the sea banner and the turn banner', () => {
    expect(bannersOf(events, { enabled: true, turnBanners: true, seaBanners: true })).toEqual([
      { k: 'sea', card: 'S1' },
      { k: 'turn', side: 'ПИРАТЫ' },
    ]);
  });
  it('«мгновенно»: none', () => {
    expect(bannersOf(events, { enabled: false, turnBanners: true, seaBanners: true })).toEqual([]);
  });
});
