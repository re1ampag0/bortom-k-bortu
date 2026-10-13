// Who may send which action (docs/TZ.md, «Игровой сервер»: the server checks that an action came from the player it
// is allowed to). The engine checks the rules; this checks only whose decision it is.
import { ABILITY, hasAbility, seatShip, type Action, type GameState } from '../src/engine/state';
import type { GameData } from '../src/engine/types';
import type { Seat } from '../src/net/protocol';

const NOT_YOURS = 'Это не ваш корабль';

/**
 * Why the player with `seats` (all of one team, played by the player now) may not send the action, or null.
 * `done` — the player pressed «Ход окончен»: only answers to decisions are allowed until «Вернуться к ходу».
 */
export function refusal(state: GameState, data: GameData, seats: readonly Seat[], action: Action, done: boolean): string | null {
  if (seats.length === 0) return 'Вы зритель: сядьте на свободный корабль до начала партии';
  const side = state.ships[seats[0]].side;
  const mine = (seat: string | undefined) => !!seat && seats.includes(seat);
  const turnAction = () => (done && state.active === side ? 'Вы уже нажали «Ход окончен» — нажмите «Вернуться к ходу»' : null);
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
      if (action.chargeFrom && !mine(action.chargeFrom) && action.chargeFrom !== action.ship) return 'Заряд — только из своей руки';
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
