// Over the network a player has only their view (viewFor): the hints of the interface run on it (docs/TZ.md,
// «Видимость»). They must not fail on hidden cards and must give the same answers as on the full state wherever
// the answer does not depend on what is hidden.
import { describe, expect, it } from 'vitest';
import {
  abilityButtons,
  decider,
  hasUsefulMoves,
  legendOptions,
  playOptions,
  previewReaction,
  reactionNow,
  unfiredShips,
  volleyTargets,
} from '../src/engine/hints';
import { playGame } from '../src/engine/sim/sim';
import type { GameState } from '../src/engine/state';
import { viewFor } from '../src/engine/view';
import { data } from './helpers';

/** Every hint the table asks for the deciding team, on a state. */
function hintsOf(s: GameState, seats: string[]) {
  const d = decider(s);
  if (!d) return [];
  const out: unknown[] = [];
  for (const seat of seats) {
    const ship = s.ships[seat];
    for (const card of [...ship.hand, ...ship.plans]) {
      out.push(playOptions(s, data, seat, card).reason);
      if (d.kind === 'reactions') {
        const r = previewReaction(s, data, seat, card);
        out.push(r.ok ? r.label : r.reason);
        const n = reactionNow(s, data, seat, card);
        out.push(n.ok ? n.text : n.reason);
      }
    }
    out.push(volleyTargets(s, data, { ship: seat }).reason, abilityButtons(s, data, seat).map((b) => b.key), legendOptions(s, data, seat).reason);
  }
  out.push(hasUsefulMoves(s, data, d.side), unfiredShips(s, data, d.side));
  return out;
}

describe('hints on a view', () => {
  it('in 20 bot games every hint on the deciding team’s view works and matches the full state', () => {
    let compared = 0;
    let differ = 0;
    for (let seed = 1; seed <= 20; seed++) {
      playGame(data, seed, 'standard', (s) => {
        const d = decider(s);
        if (!d) return;
        const seats = Object.values(s.ships).filter((x) => x.side === d.side).map((x) => x.code);
        const onView = hintsOf(viewFor(s, seats), seats);
        const onFull = hintsOf(s, seats);
        compared++;
        if (JSON.stringify(onView) !== JSON.stringify(onFull)) differ++;
      });
    }
    // A hidden card may change an answer (e.g. «Шпион Мерсер» against a hand without Reactions), but only rarely.
    expect(compared).toBeGreaterThan(500);
    expect(differ / compared).toBeLessThan(0.02);
  }, 60_000);
});
