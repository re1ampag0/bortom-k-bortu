// Ship abilities (RULES.md 14), exactly by the boards. An ability of a sunk ship no longer works (17.1).
// «Безумный план» is in turn.ts (Plans) and reactions.ts; «Быстрее ветра» in turn.ts (regroup);
// «Греческий огонь» is the Fire of the cards; «Сердце Дейви Джонса» is in volley.ts and damage.ts (Jones is free);
// Souls for Crew damage are in damage.ts.
import { pay, restore } from './damage';
import { swapPlaces } from './sea';
import {
  ABILITY,
  RuleError,
  aliveShips,
  getShip,
  hasAbility,
  otherSide,
  shipName,
  teamShips,
  type Ctx,
  type ShipState,
  type Step,
} from './state';
import { requireSeat } from './turn';
import type { Track } from './types';

/** The ship of the active team that has the ability and is afloat; the action is made in its own turn. */
function abilityShip(ctx: Ctx, code: string, ability: string): ShipState {
  const ship = requireSeat(ctx, code);
  if (!hasAbility(ctx.data, ship, ability)) throw new RuleError(`У этого корабля нет особенности «${ability}» или он утонул`);
  return ship;
}

/**
 * «Погружение»: instead of its Volley the Dutchman goes under water and puts out all its Fires (14.8).
 * Possible while it has not fired this turn, even if a Volley is impossible now (Q15); not two own turns in a row.
 */
export function dive(ctx: Ctx, code: string): void {
  const { s } = ctx;
  const ship = abilityShip(ctx, code, ABILITY.dive);
  const name = shipName(ctx.data, code);
  if (ship.submerged || s.turn.dived.includes(code)) throw new RuleError(`${name} уже под водой`);
  if ((s.turn.volleys[code] ?? 0) > 0 || (s.turn.heartUsed && isHeartShip(ctx, ship))) {
    throw new RuleError(`${name} уже дал Залп в этот ход`);
  }
  if (ship.lastDive === s.round - 1) throw new RuleError(`${name} не уходит под воду два своих хода подряд`);
  ship.submerged = true;
  ship.fires = 0;
  ship.lastDive = s.round;
  s.turn.dived.push(code);
  ctx.events.push({ type: 'dived', ship: code });
}

/** The ship the ally's «Сердце Дейви Джонса» orders to fire. */
function isHeartShip(ctx: Ctx, ship: ShipState): boolean {
  return teamShips(ctx.s, ship.side).some((x) => x.code !== ship.code && hasAbility(ctx.data, x, ABILITY.heart));
}

/** Surfacing at the start of the team's turn: the first Volley this turn gets +1 and no Reactions (14.8, 5.4). */
export function abilityStep(ctx: Ctx, step: Extract<Step, { k: 'surface' }>): void {
  for (const ship of teamShips(ctx.s, step.side)) {
    if (!ship.submerged) continue;
    ship.submerged = false;
    ship.surfaced = true;
    ctx.events.push({ type: 'surfaced', ship: ship.code });
  }
}

/**
 * «Меч Тритона»: once a turn for 1 Powder swap the enemy ships, or move a lone enemy to the empty place (14.4).
 * Not a card: no Reactions. Works in «Штиль»; not when an enemy ship is under «Блокада» (18.10, Q20).
 */
export function sword(ctx: Ctx, code: string): void {
  const { s, data } = ctx;
  const ship = abilityShip(ctx, code, ABILITY.sword);
  if (s.turn.swordUsed) throw new RuleError('Меч Тритона — раз в ход');
  const enemies = aliveShips(s, otherSide(ship.side));
  if (enemies.some((x) => x.blockaded)) throw new RuleError('Вражеский корабль под «Блокадой» не меняется местами');
  pay(ctx, ship.side, data.rules.swordCost, 'ability');
  s.turn.swordUsed = true;
  ctx.events.push({ type: 'sword', ship: code });
  swapPlaces(ctx, otherSide(ship.side), 'sword');
}

/** «Казна Компании»: once a turn pay 2 Powder and play one more card beyond the Crew (14.5). */
export function treasury(ctx: Ctx, code: string): void {
  const { s, data } = ctx;
  const ship = abilityShip(ctx, code, ABILITY.treasury);
  if (s.turn.treasuryUsed) throw new RuleError('Казна Компании — раз в ход');
  pay(ctx, ship.side, data.rules.treasuryCost, 'ability');
  s.turn.treasuryUsed = true;
  s.turn.limit[code] += data.rules.treasuryPlays;
  ctx.events.push({ type: 'treasury', ship: code });
}

/** «Вечная служба»: in its own turn 1 Soul restores 1 Hull or 1 Crew of the Dutchman, not above the start (14.7). */
export function useSoul(ctx: Ctx, code: string, track: Track): void {
  const ship = abilityShip(ctx, code, ABILITY.eternalService);
  if (track !== 'hull' && track !== 'crew') throw new RuleError('Души восстанавливают только Корпус или Команду');
  if (ship.souls < 1) throw new RuleError('Нет Душ');
  if (restore(ctx, code, track, 1) === 0) throw new RuleError('Шкала уже на стартовом значении');
  getShip(ctx.s, code).souls--;
  ctx.events.push({ type: 'soulsUsed', ship: code, track });
}
