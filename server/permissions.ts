// Who may send which action (docs/TZ.md, «Игровой сервер»: the server checks that an action came from the player it
// is allowed to). The engine checks the rules; this checks only whose decision it is.
import { playOptions } from '../src/engine/hints';
import { ABILITY, cardByCode, hasAbility, seatShip, type Action, type GameState } from '../src/engine/state';
import type { GameData } from '../src/engine/types';
import type { ChargeOffer, Seat } from '../src/net/protocol';

const NOT_YOURS = 'Это не ваш корабль';
const DONE = 'Вы уже нажали «Ход окончен» — нажмите «Вернуться к ходу»';

/** What the server knows besides the game: who is a bot now, the captains' offers of a Charge. */
export interface TableContext {
  bots: ReadonlySet<Seat>;
  offers: readonly ChargeOffer[];
}

/**
 * Why the player with `seats` (all of one team, played by the player now) may not send the action, or null.
 * `done` — the player pressed «Ход окончен»: only answers to decisions are allowed until «Вернуться к ходу».
 */
export function refusal(state: GameState, data: GameData, seats: readonly Seat[], action: Action, done: boolean, ctx: TableContext): string | null {
  if (seats.length === 0) return 'Вы зритель: сядьте на свободный корабль до начала партии';
  const side = state.ships[seats[0]].side;
  const mine = (seat: string | undefined) => !!seat && seats.includes(seat);
  const turnAction = () => (done && state.active === side ? DONE : null);
  switch (action.type) {
    case 'endTurn':
    case 'concede':
    case 'closeWindow':
      return 'Это действие отправляется отдельной кнопкой';
    case 'react':
    case 'noReaction':
    case 'choose':
      return mine(action.seat) ? null : NOT_YOURS;
    case 'playCard':
    case 'sell':
    case 'pass':
    case 'extinguish':
    case 'playLegend':
      return mine(action.seat) ? turnAction() : NOT_YOURS;
    case 'dive':
    case 'sword':
    case 'treasury':
    case 'souls':
      return mine(action.ship) ? turnAction() : NOT_YOURS;
    case 'volley': {
      const ship = state.ships[action.ship];
      if (!ship) return NOT_YOURS;
      // The captain of a sunk ship adds a Charge to the ally's Volley (RULES.md 17.3).
      const captainCharge = mine(action.chargeFrom) && seatShip(state, action.chargeFrom!)?.code === action.ship;
      // «Сердце Дейви Джонса»: the Endeavour makes the Dutchman fire (RULES.md 14.6).
      const heart = action.heart && seats.some((x) => state.ships[x].side === ship.side && hasAbility(data, state.ships[x], ABILITY.heart));
      if (!mine(action.ship) && !captainCharge && !heart) return NOT_YOURS;
      // The ally's ship is played by another person: they fire, the captain only offers the Charge (P6).
      if (!mine(action.ship) && !heart && !ctx.bots.has(action.ship)) return 'Этим кораблём играет союзник: Залп даёт он, а вы можете предложить ему Заряд';
      const offered = ctx.offers.some((o) => o.from === action.chargeFrom && o.to === action.ship && o.card === action.charge);
      if (action.chargeFrom && !mine(action.chargeFrom) && action.chargeFrom !== action.ship && !offered) return 'Заряд — только из своей руки';
      return turnAction();
    }
    case 'regroup':
      return action.side === side ? turnAction() : 'Это решение другой команды';
    case 'tortuga':
      return action.side === side ? null : 'Это решение другой команды';
    case 'jack': {
      const p = state.pending;
      return p?.kind === 'jack' && mine(p.ship) ? null : NOT_YOURS;
    }
  }
}

/**
 * Why the player with `seats` may not offer the captain's Charge `card` of `seat` for the ally's Volley, or null.
 * Only when another person plays the ally's ship: with a bot or both ships the captain adds the Charge himself.
 */
export function offerRefusal(state: GameState, data: GameData, seats: readonly Seat[], seat: Seat, card: string, done: boolean, ctx: TableContext): string | null {
  if (!seats.includes(seat)) return NOT_YOURS;
  const ally = state.ships[seat].sunk ? seatShip(state, seat) : null;
  if (!ally) return 'Предложить Заряд может только капитан утонувшего корабля';
  if (state.active !== ally.side) return 'Сейчас ход противника';
  if (done) return DONE;
  if (seats.includes(ally.code)) return 'Оба корабля ваши: добавьте Заряд в Залп сами';
  if (ctx.bots.has(ally.code)) return 'Союзным кораблём играет бот: добавьте Заряд в его Залп сами';
  const own = state.ships[seat];
  if (typeof card !== 'string' || ![...own.hand, ...own.plans].includes(card)) return 'Этой карты нет у капитана';
  if (cardByCode(data, card).type !== 'ЗАРЯД') return 'Предложить можно только Заряд';
  // The dry run of the ally's Volley with this Charge (the ally fires; RULES.md 17.3).
  const why = playOptions(state, data, seat, card).reason;
  return why ? `Залп союзника с этим Зарядом сейчас невозможен: ${why}` : null;
}
