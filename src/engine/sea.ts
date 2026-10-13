// The sea deck (RULES.md 16) and changing places (8.3, 14.4, 15.2, 18.10).
// «Весь раунд» cards are read where they act: volley.ts (Туман, Буря, Ясное небо, Мальстрём), turn.ts
// (Штиль, Попутный ветер, Девятый вал, Мальстрём, Флот на горизонте), damage.ts (Лунный свет), swapPlaces (Рифы).
import { addPowder, losePowder, pay, restore } from './damage';
import {
  RuleError,
  aliveShips,
  oneEffect,
  pushSteps,
  requirePending,
  seaKey,
  seatsOf,
  type Ctx,
  type Step,
  type SwapReason,
} from './state';
import { drawCards } from './turn';
import type { Side } from './types';

const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];

/** «Сразу» cards act once, when the card is opened (RULES.md 4.2). Damage is queued before the Pirates' turn. */
export function seaAtOnce(ctx: Ctx): void {
  const { s, data } = ctx;
  const r = data.rules;
  const key = seaKey(ctx);
  const ships = [...aliveShips(s, 'ПИРАТЫ'), ...aliveShips(s, 'КОМПАНИЯ')];
  const steps: Step[] = [];
  switch (key) {
    case 'mermaids':
      for (const x of ships) {
        if (x.tracks.crew >= r.seaMermaidsMin) steps.push({ k: 'damage', ship: x.code, track: 'crew', n: r.seaMermaids, src: null });
      }
      break;
    case 'rum':
      for (const x of ships) restore(ctx, x.code, 'crew', r.seaRum);
      break;
    case 'caravan':
      for (const side of SIDES) addPowder(ctx, side, r.seaCaravan, 'sea');
      break;
    case 'wet':
      for (const side of SIDES) losePowder(ctx, side, Math.floor(s.teams[side].powder / r.seaWetDivisor));
      break;
    case 'thunder': {
      // The ships with the highest Sails; nobody when all Sails are 0 (Q28).
      const top = Math.max(0, ...ships.map((x) => x.tracks.sails));
      if (top > 0) {
        for (const x of ships) {
          if (x.tracks.sails === top) steps.push({ k: 'damage', ship: x.code, track: 'sails', n: r.seaThunder, src: null });
        }
      }
      break;
    }
    case 'current':
      for (const side of SIDES) steps.push({ k: 'swap', side, reason: 'current' });
      break;
    case 'tortuga':
      steps.push({ k: 'tortuga' });
      break;
    default:
      return;
  }
  ctx.events.push({ type: 'seaEffect', key: key! });
  pushSteps(s, ...oneEffect(steps));
}

/**
 * Swaps the ships of a team or moves a lone ship to the empty place. Returns whether the ships moved.
 * Nothing moves in «Штиль» (except by «Меч Тритона», 16, 14.4) or when a ship of the team is under «Блокада»
 * (18.10, Q20). In «Рифы» every ship that moved takes Hull damage (16).
 */
export function swapPlaces(ctx: Ctx, side: Side, reason: SwapReason): boolean {
  const { s, data } = ctx;
  const ships = aliveShips(s, side);
  if (ships.length === 0) return false;
  if (seaKey(ctx) === 'calm' && reason !== 'sword') return false;
  if (ships.some((x) => x.blockaded)) return false;
  for (const ship of ships) ship.pos = ship.pos === 0 ? 1 : 0;
  ctx.events.push({ type: 'swapped', side, reason, ships: ships.map((x) => x.code) });
  if (seaKey(ctx) === 'reefs') {
    pushSteps(s, ...oneEffect(ships.map((x) => ({ k: 'damage', ship: x.code, track: 'hull', n: data.rules.seaReefs, src: null }))));
  }
  return true;
}

/** «Тортуга»: both teams decide how much Powder to spend (RULES.md 16.2). */
export function tortugaStep(ctx: Ctx): void {
  const waiting = SIDES.filter((side) => seatsOf(ctx.s, side).length > 0);
  if (waiting.length > 0) ctx.s.pending = { kind: 'tortuga', waiting };
}

/** A team's «Тортуга» decision: up to 2 Powder for as many cards, shared between its players as they like. */
export function tortuga(ctx: Ctx, side: Side, draws: Record<string, number>): void {
  const pending = requirePending(ctx.s, 'tortuga');
  if (!pending.waiting.includes(side)) throw new RuleError('Эта команда уже решила');
  const seats = seatsOf(ctx.s, side).map((x) => x.code);
  let total = 0;
  for (const [seat, n] of Object.entries(draws)) {
    if (!seats.includes(seat)) throw new RuleError('Карты берут только игроки своей команды');
    if (!Number.isInteger(n) || n < 0) throw new RuleError('Число карт — целое, не меньше 0');
    total += n;
  }
  const max = ctx.data.rules.seaTortuga;
  if (total > max) throw new RuleError(`Тортуга: не больше ${max} карт`);
  pay(ctx, side, total, 'sea');
  for (const [seat, n] of Object.entries(draws)) drawCards(ctx, seat, n);
  pending.waiting = pending.waiting.filter((x) => x !== side);
  if (pending.waiting.length === 0) ctx.s.pending = null;
}
