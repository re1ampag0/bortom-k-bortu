// 200 games with random seeds and random actions and answers to Reaction windows, «Джек ускользает» and «Тортуга».
// Forbidden actions (RuleError) are skipped.
// After every action: no other exceptions, Powder 0–8, tracks between the minimum and the start,
// no card lost or doubled (counted by the deck that owns it).
import { describe, expect, it } from 'vitest';
import { TRACKS } from '../src/engine/data';
import { choiceFor } from '../src/engine/cards';
import { createGame } from '../src/engine/engine';
import { createRng, type Rng } from '../src/engine/rng';
import { RuleError, type Action, type GameState } from '../src/engine/state';
import { act, brokenInvariants, data } from './helpers';

const pick = <T>(rng: Rng, items: T[]): T | undefined => (items.length ? items[rng.int(items.length)] : undefined);

/**
 * An answer to the pending decision: a random Reaction or «no», Jack or not, random cards on «Тортуга»,
 * random cards for a card choice (sometimes a wrong number of them).
 */
function randomAnswer(s: GameState, rng: Rng): Action {
  const p = s.pending!;
  if (p.kind === 'choice') {
    const seat = pick(rng, p.waiting)!;
    const c = choiceFor(s, seat)!;
    const count = rng.next() < 0.9 ? c.count : rng.int(3);
    return { type: 'choose', seat, cards: rng.shuffle([...c.from]).slice(0, count) };
  }
  if (p.kind === 'jack') return { type: 'jack', play: rng.next() < 0.7 };
  if (p.kind === 'tortuga') {
    const side = pick(rng, p.waiting)!;
    const seats = Object.values(s.ships).filter((x) => x.side === side);
    return { type: 'tortuga', side, draws: Object.fromEntries(seats.map((x) => [x.code, rng.int(3)])) };
  }
  const seat = s.ships[pick(rng, p.waiting)!];
  const card = pick(rng, [...seat.hand, ...seat.plans]);
  return rng.next() < 0.6 && card ? { type: 'react', seat: seat.code, card } : { type: 'noReaction', seat: seat.code };
}

function randomAction(s: GameState, rng: Rng, actionsThisTurn: number): Action {
  if (s.pending) return randomAnswer(s, rng);
  const side = s.active;
  const own = Object.values(s.ships).filter((x) => x.side === side);
  const enemies = Object.values(s.ships).filter((x) => x.side !== side);
  const seat = pick(rng, own)!;
  if (actionsThisTurn > 40 || rng.next() < 0.12) {
    const pearl = s.ships['Ж'];
    const plans = side === 'ПИРАТЫ' && rng.next() < 0.5 ? pearl.hand.slice(0, rng.int(3)) : undefined;
    return { type: 'endTurn', side, plans };
  }
  const card = pick(rng, [...seat.hand, ...seat.plans]) ?? 'Ж-01';
  switch (rng.int(11)) {
    case 0:
    case 1: {
      const charger = pick(rng, own)!;
      const charge = rng.next() < 0.6 ? pick(rng, [...charger.hand, ...charger.plans]) : undefined;
      return {
        type: 'volley',
        ship: pick(rng, own)!.code,
        target: pick(rng, enemies)!.code,
        charge,
        chargeFrom: charge && charger.code,
        paid: rng.next() < 0.2 ? rng.int(5) : undefined,
        heart: rng.next() < 0.15,
      };
    }
    case 2:
    case 10: {
      const ally = own.find((x) => x.code !== seat.code)!;
      const split = rng.int(3);
      return {
        type: 'playCard',
        seat: seat.code,
        card,
        target: rng.next() < 0.9 ? pick(rng, enemies)!.code : undefined,
        ship: rng.next() < 0.3 ? pick(rng, [seat, ally])!.code : undefined,
        repair: rng.next() < 0.3 ? { [pick(rng, [...TRACKS])!]: split, hull: rng.int(3) } : undefined,
        souls: rng.next() < 0.3 ? rng.int(4) : undefined,
        regroup: rng.next() < 0.5,
      };
    }
    case 3:
      return { type: 'sell', seat: seat.code, card };
    case 4:
      return { type: 'pass', seat: seat.code, card };
    case 5:
      return { type: 'regroup', side };
    case 6:
      return { type: 'extinguish', seat: seat.code, card };
    case 7:
      return { type: 'playLegend', seat: seat.code, target: pick(rng, enemies)!.code };
    case 8:
      return { type: (['dive', 'sword', 'treasury'] as const)[rng.int(3)], ship: seat.code };
    default:
      return { type: 'souls', ship: seat.code, track: rng.next() < 0.5 ? 'hull' : 'crew' };
  }
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
