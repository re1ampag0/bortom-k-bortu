// The engine entry point: applyAction(state, action, data) → { state, events }.
// Pure: the input state is not changed; randomness comes from the generator state stored in the game state.
import { checkGameOver } from './damage';
import { createRng } from './rng';
import { RuleError, type Action, type Ctx, type GameEvent, type GameState } from './state';
import { endTurn, extinguish, passCard, playCard, regroup, sell } from './turn';
import type { GameData } from './types';
import { volley } from './volley';

export { createGame, type GameOptions } from './setup';

export function applyAction(
  state: GameState,
  action: Action,
  data: GameData,
): { state: GameState; events: GameEvent[] } {
  if (state.winner) throw new RuleError('Партия окончена');
  const s = structuredClone(state);
  const rng = createRng(s.rng);
  const ctx: Ctx = { s, data, rng, events: [] };

  switch (action.type) {
    case 'volley':
      volley(ctx, action);
      break;
    case 'playCard':
      playCard(ctx, action.seat, action.card);
      break;
    case 'sell':
      sell(ctx, action.seat, action.card);
      break;
    case 'pass':
      passCard(ctx, action.seat, action.card);
      break;
    case 'regroup':
      regroup(ctx, action.side);
      break;
    case 'extinguish':
      extinguish(ctx, action.seat, action.card);
      break;
    case 'endTurn':
      endTurn(ctx, action.side);
      break;
    default:
      throw new RuleError(`Неизвестное действие ${(action as { type: string }).type}`);
  }
  checkGameOver(ctx);
  s.rng = rng.state;
  return { state: s, events: ctx.events };
}
