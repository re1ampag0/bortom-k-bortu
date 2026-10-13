// The Volley and simple Charges (RULES.md 10).
import { addFire, dealDamage, pay } from './damage';
import { RuleError, cardByCode, getShip, shipData, shipName, takeCard, type Ctx } from './state';
import { discard, payCardCost, requireSeat, useCardPlay } from './turn';
import type { Fx } from './types';

export interface VolleyOrder {
  ship: string;
  target: string;
  charge?: string;
  chargeFrom?: string;
  paid?: number;
}

export function volley(ctx: Ctx, order: VolleyOrder): void {
  const { s, data } = ctx;
  const shooter = requireSeat(ctx, order.ship);
  const params = shipData(data, shooter.code);
  const name = shipName(data, shooter.code);
  if (shooter.sunk) throw new RuleError(`${name} утонул и не стреляет`);
  if (shooter.submerged) throw new RuleError(`${name} под водой и не стреляет`);
  if (s.turn.volleys[shooter.code] >= params.volleysPerTurn) throw new RuleError(`${name} уже дал Залп в этот ход`);
  if (shooter.tracks.guns <= 0) throw new RuleError('Пушки 0 — Залп невозможен');

  const target = getShip(s, order.target);
  if (target.side === shooter.side) throw new RuleError('Целью Залпа может быть только вражеский корабль');
  if (target.sunk) throw new RuleError('Этот корабль уже утонул');
  if (target.submerged) throw new RuleError('Корабль под водой нельзя выбрать целью');

  pay(ctx, shooter.side, params.volleyCost, 'volley');

  // Charge: one per Volley, counts toward the Crew limit, its cost is paid (RULES.md 10.1).
  let fx: Fx = {};
  const chargeFrom = order.charge ? (order.chargeFrom ?? shooter.code) : null;
  if (order.charge && chargeFrom) {
    const holder = requireSeat(ctx, chargeFrom);
    if (!holder.hand.includes(order.charge)) throw new RuleError('Этой карты нет на руке');
    const card = cardByCode(data, order.charge);
    if (card.type !== 'ЗАРЯД') throw new RuleError('К Залпу можно добавить только Заряд');
    if (card.fx.both) throw new RuleError('«Залп с обоих бортов» пока не реализован (этап 4)');
    useCardPlay(ctx, chargeFrom, shooter.code);
    payCardCost(ctx, order.charge, shooter);
    fx = card.fx;
    takeCard(holder.hand, order.charge, 'Этой карты нет на руке');
    discard(ctx, order.charge);
  }
  const paid = order.paid ?? 0;
  if (paid !== 0) {
    if (!fx.paid) throw new RuleError('Доплатить Порох можно только с «Оплаченным залпом»');
    if (!Number.isInteger(paid) || paid < 0 || paid > data.rules.paidChargeMax) {
      throw new RuleError(`Доплатить можно от 0 до ${data.rules.paidChargeMax} Пороха`);
    }
    pay(ctx, shooter.side, paid, 'card');
  }

  // Damage = Guns, −1 on the diagonal, ± the Charge, +1 joint volley, never below 0 (RULES.md 10.5–10.7).
  const diagonal = shooter.pos !== target.pos;
  let damage = shooter.tracks.guns;
  if (diagonal && !fx.no_diag) {
    damage = 'fixed' in params.diagDamage ? params.diagDamage.fixed : damage + params.diagDamage.offset;
  }
  damage += (fx.dmg ?? 0) + paid;
  if (fx.if_fire && target.fires > 0) damage += fx.if_fire;
  if (fx.if_damaged && s.turn.damaged.includes(target.code)) damage += fx.if_damaged;
  const joint =
    !s.turn.jointUsed && s.turn.firstTarget === target.code && s.turn.firstShooter !== shooter.code;
  if (joint) {
    damage += data.rules.jointBonus;
    s.turn.jointUsed = true;
  }
  damage = Math.max(0, damage);
  const track = fx.track ?? params.defaultTrack;

  s.turn.volleys[shooter.code]++;
  ctx.events.push({
    type: 'volley',
    ship: shooter.code,
    target: target.code,
    charge: order.charge ?? null,
    chargeFrom,
    diagonal,
    joint,
    damage,
    track,
  });
  // The window "before damage" for Reactions comes here in stage 4 (RULES.md 12.2).

  dealDamage(ctx, target.code, track, damage);
  // A Fire is put even when the damage is 0 (RULES.md 18.13).
  if (fx.fire) addFire(ctx, target.code, fx.fire);
  if (s.turn.firstTarget === null) {
    s.turn.firstTarget = target.code;
    s.turn.firstShooter = shooter.code;
  }
  // The window "after the Volley" comes here in stage 4 (RULES.md 12.3).
}
