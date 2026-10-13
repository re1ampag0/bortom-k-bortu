// Setting up a game (RULES.md 2, 20.1).
import { deckCards, seaCards } from './data';
import { createRng } from './rng';
import { newTurn, type Ctx, type GameEvent, type GameState, type Pos, type ShipState, type Variant } from './state';
import { drawUp, startRound } from './turn';
import type { GameData, Side } from './types';

export interface GameOptions {
  seed: number;
  variant?: Variant;
  /** Ship codes of each team from left to right. A team without it is placed at random, as bots do (RULES.md 2.2). */
  positions?: Partial<Record<Side, [string, string]>>;
}

export function createGame(data: GameData, options: GameOptions): { state: GameState; events: GameEvent[] } {
  const variant = options.variant ?? 'standard';
  const rng = createRng(options.seed);
  const ships: Record<string, ShipState> = {};

  for (const side of ['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]) {
    const codes = data.ships.filter((x) => x.side === side).map((x) => x.code);
    const order = options.positions?.[side] ?? rng.shuffle([...codes]);
    if (order.length !== codes.length || !codes.every((c) => order.includes(c))) {
      throw new Error(`Bad positions for ${side}: ${order.join(', ')}`);
    }
    for (const code of codes) {
      ships[code] = { code, side, pos: order.indexOf(code) as Pos } as ShipState;
    }
  }

  for (const ship of data.ships) {
    Object.assign(ships[ship.code], {
      tracks: { hull: ship.hull, sails: ship.sails, guns: ship.guns, crew: ship.crew },
      souls: ship.start_souls ?? 0,
      fires: 0,
      sunk: false,
      submerged: false,
      legend: variant !== 'first',
      deck: rng.shuffle(deckCards(data, ship.code).map((c) => c.code)),
      hand: [],
      discard: [],
      plans: [],
    });
  }

  const state: GameState = {
    seed: options.seed,
    rng: 0,
    variant,
    round: 0,
    active: 'ПИРАТЫ',
    ships,
    teams: {
      ПИРАТЫ: { powder: 0 },
      КОМПАНИЯ: { powder: variant === 'first' ? data.rules.firstGameSecondStart : data.econ.second_start },
    },
    sea: variant === 'first' ? null : { deck: rng.shuffle(seaCards(data).map((c) => c.code)), discard: [], current: null },
    turn: newTurn(),
    winner: null,
  };

  const ctx: Ctx = { s: state, data, rng, events: [] };
  for (const code of Object.keys(ships)) drawUp(ctx, code);
  startRound(ctx);
  state.rng = rng.state;
  return { state, events: ctx.events };
}
