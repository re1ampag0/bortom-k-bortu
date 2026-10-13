// Legends (RULES.md 15): they lie open next to the board and are played once for their cost.
// Orders («Корабль в бутылке», «Армада Компании», «Кракен») are cards against the enemy team: the enemy may answer
// with Reactions «на Залп или карту» before the effect (9.7, 12.2). «Это не Залп»: no Volley modifiers apply.
import { pay, sinkShip } from './damage';
import {
  RuleError,
  aliveShips,
  cardByCode,
  getShip,
  oneEffect,
  otherSide,
  pushSteps,
  requirePending,
  startValue,
  type Ctx,
  type Step,
} from './state';
import { payCardCost, requireSeat, useCardPlay } from './turn';
import type { Op, Track } from './types';

export function playLegend(ctx: Ctx, seat: string, target?: string): void {
  const { s, data } = ctx;
  const ship = requireSeat(ctx, seat);
  if (ship.sunk || !ship.legend) throw new RuleError('Легенды этого корабля больше нет');
  const code = `${seat}-Л`;
  const card = cardByCode(data, code);
  if (card.type !== 'ПРИКАЗ') throw new RuleError(`«${card.name}» играется, когда корабль должен утонуть`);
  const ops = card.fx.ops ?? [];
  const needsTarget = ops.some((op) => op[0] === 'bottle' || (op[0] === 'dmg' && op[1] === 'any'));
  const targets: string[] = [];
  if (needsTarget) {
    if (!target) throw new RuleError('Выберите вражеский корабль');
    const t = getShip(s, target);
    if (t.side === ship.side || t.sunk) throw new RuleError('Целью может быть только вражеский корабль на плаву');
    // Under water the Dutchman cannot be chosen by an enemy card (14.8).
    if (t.submerged) throw new RuleError('Корабль под водой нельзя выбрать целью');
    const bottle = ops.find((op) => op[0] === 'bottle');
    if (bottle && t.tracks.hull > Number(bottle[1])) {
      throw new RuleError(`«${card.name}»: нужен корабль с Корпусом ${bottle[1]} или меньше`);
    }
    targets.push(target);
  } else {
    targets.push(...aliveShips(s, otherSide(ship.side)).filter((x) => !x.submerged).map((x) => x.code));
  }

  useCardPlay(ctx, seat, seat);
  payCardCost(ctx, code, ship);
  ship.legend = false;
  ctx.events.push({ type: 'legendPlayed', seat, card: code, target: target ?? null });
  s.card = {
    card: code,
    seat,
    ship: seat,
    targets,
    crew: ops.some((op) => op[0] === 'dmg' && op[2] === 'crew'),
    cancelled: false,
    crewCancelled: false,
  };
  pushSteps(s, { k: 'window', window: 'before', subject: 'card' }, { k: 'cardEffect' }, { k: 'cardEnd' });
}

export function legendStep(ctx: Ctx, step: Step): void {
  const { s } = ctx;
  const c = s.card;
  if (!c) return;
  if (step.k === 'cardEnd') {
    s.card = null;
    return;
  }
  if (c.cancelled) {
    ctx.events.push({ type: 'cardCancelled', card: c.card });
    return;
  }
  const steps: Step[] = [];
  for (const op of cardByCode(ctx.data, c.card).fx.ops ?? []) steps.push(...opSteps(ctx, op, c.ship, c.targets[0]));
  pushSteps(s, ...oneEffect(steps));
}

/** Steps of one operation of a Legend; the targets are taken as they are when the effect happens. */
function opSteps(ctx: Ctx, op: Op, src: string, chosen: string | undefined): Step[] {
  const { s } = ctx;
  const c = s.card!;
  if (op[0] === 'bottle') {
    const t = chosen ? getShip(s, chosen) : null;
    return t && !t.sunk && t.tracks.hull <= Number(op[1]) ? [{ k: 'sink', ship: t.code }] : [];
  }
  if (op[0] !== 'dmg') return [];
  const [, scope, track, n] = op as [string, string, Track, number];
  // «Зомби-офицеры», «Морская пехота»: all Crew damage of the card is cancelled (11.6).
  if (track === 'crew' && c.crewCancelled) return [];
  const enemies = aliveShips(s, otherSide(getShip(s, src).side)).filter((x) => !x.submerged);
  const ships = scope === 'all' ? enemies.map((x) => x.code) : chosen ? [chosen] : [];
  return ships.map((ship) => ({ k: 'damage', ship, track, n, src }) as Step);
}

/** «Джек ускользает»: the Pearl's Hull becomes 2 and the team swaps places for free (15.2, 16.1, Q22). */
export function jack(ctx: Ctx, play: boolean): void {
  const { s, data } = ctx;
  const { ship: code } = requirePending(s, 'jack');
  const ship = getShip(s, code);
  s.pending = null;
  if (!play) {
    sinkShip(ctx, code);
    return;
  }
  pay(ctx, ship.side, cardByCode(data, `${code}-Л`).cost, 'reaction');
  ship.legend = false;
  ship.tracks.hull = Math.min(data.rules.jackHull, startValue(data, code, 'hull'));
  ctx.events.push({ type: 'jackEscaped', ship: code });
  pushSteps(s, { k: 'swap', side: ship.side, reason: 'jack' });
}
