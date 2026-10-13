// 200 games with random seeds and random actions. Forbidden actions (RuleError) are skipped.
// After every action: no other exceptions, Powder 0–8, tracks between the minimum and the start,
// no card lost or doubled (counted by the deck that owns it).
import { describe, expect, it } from 'vitest';
import { TRACKS, deckCards, seaCards } from '../src/engine/data';
import { createGame } from '../src/engine/engine';
import { createRng, type Rng } from '../src/engine/rng';
import { RuleError, TRACK_MIN, type Action, type GameState } from '../src/engine/state';
import { act, cardsByOwner, data } from './helpers';

const pick = <T>(rng: Rng, items: T[]): T | undefined => (items.length ? items[rng.int(items.length)] : undefined);

function randomAction(s: GameState, rng: Rng, actionsThisTurn: number): Action {
  const side = s.active;
  if (actionsThisTurn > 40 || rng.next() < 0.12) return { type: 'endTurn', side };
  const own = Object.values(s.ships).filter((x) => x.side === side);
  const enemies = Object.values(s.ships).filter((x) => x.side !== side);
  const seat = pick(rng, own)!;
  const card = pick(rng, seat.hand) ?? 'Ж-01';
  switch (rng.int(7)) {
    case 0:
    case 1: {
      const charger = pick(rng, own)!;
      const charge = rng.next() < 0.6 ? pick(rng, charger.hand) : undefined;
      return {
        type: 'volley',
        ship: pick(rng, own)!.code,
        target: pick(rng, enemies)!.code,
        charge,
        chargeFrom: charge && charger.code,
        paid: rng.next() < 0.2 ? rng.int(5) : undefined,
      };
    }
    case 2:
      return { type: 'playCard', seat: seat.code, card };
    case 3:
      return { type: 'sell', seat: seat.code, card };
    case 4:
      return { type: 'pass', seat: seat.code, card };
    case 5:
      return { type: 'regroup', side };
    default:
      return { type: 'extinguish', seat: seat.code, card };
  }
}

const decks = Object.fromEntries(data.ships.map((x) => [x.code, deckCards(data, x.code).map((c) => c.code).sort()]));
const seaAll = seaCards(data).map((c) => c.code).sort();

/** Returns the broken invariants; plain checks keep 200 games fast. */
function brokenInvariants(s: GameState): string[] {
  const out: string[] = [];
  const check = (ok: boolean, what: string) => {
    if (!ok) out.push(what);
  };
  for (const [side, team] of Object.entries(s.teams)) {
    check(team.powder >= 0 && team.powder <= data.econ.cap, `${side}: Порох ${team.powder}`);
  }
  for (const ship of data.ships) {
    const x = s.ships[ship.code];
    for (const track of TRACKS) {
      const v = x.tracks[track];
      check(v >= TRACK_MIN[track] && v <= ship[track], `${ship.code} ${track} ${v}`);
    }
    check(x.sunk === (x.tracks.hull === 0), `${ship.code}: sunk ${x.sunk}, hull ${x.tracks.hull}`);
    check(x.fires >= 0 && x.fires <= data.rules.maxFires, `${ship.code}: Пожаров ${x.fires}`);
    check(x.souls >= 0 && x.souls <= (ship.souls ?? 0), `${ship.code}: Душ ${x.souls}`);
  }
  const byOwner = cardsByOwner(s);
  for (const code of Object.keys(decks)) {
    check([...(byOwner[code] ?? [])].sort().join() === decks[code].join(), `колода ${code}: карты потеряны или повторяются`);
  }
  if (s.sea) {
    const sea = [...s.sea.deck, ...s.sea.discard, ...(s.sea.current ? [s.sea.current] : [])];
    check(sea.sort().join() === seaAll.join(), 'колода моря: карты потеряны или повторяются');
  }
  return out;
}

describe('random games', () => {
  it('200 games keep the invariants and end by round 30', () => {
    const seeds = createRng(20261013);
    const winners: Record<string, number> = {};
    let applied = 0;
    for (let game = 0; game < 200; game++) {
      const seed = seeds.int(2 ** 31);
      const variant = (['standard', 'first', 'quick'] as const)[game % 3];
      const rng = createRng(seed ^ 0x5bd1e995);
      let s = createGame(data, { seed, variant }).state;
      expect(brokenInvariants(s)).toEqual([]);
      let perTurn = 0;
      let turnKey = '';
      for (let step = 0; step < 5000 && !s.winner; step++) {
        const key = `${s.round}:${s.active}`;
        if (key !== turnKey) [turnKey, perTurn] = [key, 0];
        const action = randomAction(s, rng, perTurn++);
        try {
          s = act(s, action).state;
          applied++;
        } catch (e) {
          if (e instanceof RuleError) continue;
          throw new Error(`seed ${seed}, round ${s.round}: ${JSON.stringify(action)} — ${String(e)}`);
        }
        const broken = brokenInvariants(s);
        if (broken.length) throw new Error(`seed ${seed}, after ${JSON.stringify(action)}: ${broken.join('; ')}`);
      }
      expect(s.winner, `seed ${seed}`).not.toBeNull();
      expect(s.round).toBeLessThanOrEqual(data.rules.maxRounds);
      winners[s.winner!] = (winners[s.winner!] ?? 0) + 1;
    }
    // Random play does not have to be balanced, but every outcome should be reachable.
    expect(Object.keys(winners).sort()).toEqual(['КОМПАНИЯ', 'НИЧЬЯ', 'ПИРАТЫ']);
    expect(applied).toBeGreaterThan(10000);
  }, 120_000);
});
