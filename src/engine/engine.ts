// The engine entry point: applyAction(state, action, data) → { state, events }.
// Pure: the input state is not changed; randomness comes from the generator state stored in the game state.
import { dive, sword, treasury, useSoul } from './abilities';
import { choose, playCard } from './cards';
import { checkGameOver } from './damage';
import { jack, playLegend } from './legends';
import { runQueue } from './queue';
import { closeWindow, noReaction, react } from './reactions';
import { createRng } from './rng';
import { tortuga } from './sea';
import { RuleError, otherSide, type Action, type Ctx, type GameEvent, type GameState, type Pending } from './state';
import { endTurn, extinguish, passCard, regroup, sell } from './turn';
import type { GameData, Side } from './types';
import { volley } from './volley';

export { createGame, type GameOptions } from './setup';

/** Actions that answer each kind of pending decision; nothing else is allowed meanwhile. */
const ANSWERS: Record<Pending['kind'], Action['type'][]> = {
  reactions: ['react', 'noReaction', 'closeWindow'],
  jack: ['jack'],
  tortuga: ['tortuga'],
  choice: ['choose'],
};

const WAITING_FOR: Record<Pending['kind'], string> = {
  reactions: 'противник решает, играть ли Реакции',
  jack: 'Пираты решают, играть ли «Джек ускользает»',
  tortuga: 'команды решают, сколько карт взять на «Тортуге»',
  choice: 'игрок выбирает карты',
};

/** The team gives up: the other team wins at once, whatever the engine was waiting for. */
function concede(ctx: Ctx, side: Side): void {
  if (side !== 'ПИРАТЫ' && side !== 'КОМПАНИЯ') throw new RuleError(`Нет команды «${side}»`);
  const { s } = ctx;
  s.winner = otherSide(side);
  s.pending = null;
  s.queue = [];
  ctx.events.push({ type: 'conceded', side });
  ctx.events.push({ type: 'gameOver', winner: s.winner, reason: 'concede' });
}

export function applyAction(
  state: GameState,
  action: Action,
  data: GameData,
): { state: GameState; events: GameEvent[] } {
  if (state.winner) throw new RuleError('Партия окончена');
  if (state.pending && action.type !== 'concede' && !ANSWERS[state.pending.kind].includes(action.type)) {
    throw new RuleError(`Ждём решения: ${WAITING_FOR[state.pending.kind]}`);
  }
  const s = structuredClone(state);
  const rng = createRng(s.rng);
  const ctx: Ctx = { s, data, rng, events: [] };

  switch (action.type) {
    case 'volley':
      volley(ctx, action);
      break;
    case 'playCard': {
      const { type: _type, seat, card, ...params } = action;
      playCard(ctx, seat, card, params);
      break;
    }
    case 'choose':
      choose(ctx, action.seat, action.cards);
      break;
    case 'playLegend':
      playLegend(ctx, action.seat, action.target);
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
    case 'dive':
      dive(ctx, action.ship);
      break;
    case 'sword':
      sword(ctx, action.ship);
      break;
    case 'treasury':
      treasury(ctx, action.ship);
      break;
    case 'souls':
      useSoul(ctx, action.ship, action.track);
      break;
    case 'endTurn':
      endTurn(ctx, action.side, action.plans);
      break;
    case 'react':
      react(ctx, action.seat, action.card);
      break;
    case 'noReaction':
      noReaction(ctx, action.seat);
      break;
    case 'closeWindow':
      closeWindow(ctx);
      break;
    case 'jack':
      jack(ctx, action.play);
      break;
    case 'tortuga':
      tortuga(ctx, action.side, action.draws);
      break;
    case 'concede':
      concede(ctx, action.side);
      break;
    default:
      throw new RuleError(`Неизвестное действие ${(action as { type: string }).type}`);
  }
  checkGameOver(ctx);
  runQueue(ctx);
  s.rng = rng.state;
  return { state: s, events: ctx.events };
}
