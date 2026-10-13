// Legends (RULES.md 15): they lie open next to the board and are played once for their cost.
// Orders («Корабль в бутылке», «Армада Компании», «Кракен») are cards against the enemy team: the enemy may answer
// with Reactions «на Залп или карту» before the effect (9.7, 12.2). «Это не Залп»: no Volley modifiers apply.
import { pay, sinkShip } from './damage';
import {
  RuleError,
  aliveShips,
  cardByCode,
  getShip,
  otherSide,
  pushSteps,
  requirePending,
  startValue,
  type Ctx,
} from './state';
import { paidSteps } from './cards';
import { payCardCost, requireSeat, useCardPlay } from './turn';

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

  const voodoo = useCardPlay(ctx, seat, seat);
  payCardCost(ctx, code, ship);
  ship.legend = false;
  ctx.events.push({ type: 'legendPlayed', seat, card: code, target: target ?? null });
  s.card = {
    card: code,
    seat,
    ship: seat,
    targets,
    target: target ?? null,
    crew: ops.some((op) => op[0] === 'dmg' && op[2] === 'crew'),
    cancelled: false,
    crewCancelled: false,
    legend: true,
    fromPlan: false,
    params: {},
    stolenBy: null,
    lost: false,
  };
  // The effect is played by cards.ts, as for any card.
  pushSteps(s, ...paidSteps(voodoo), { k: 'window', window: 'before', subject: 'card' }, { k: 'cardEffect' }, { k: 'cardEnd' });
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
