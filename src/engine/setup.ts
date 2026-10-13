// Setting up a game (RULES.md 2, 20.1).
import { deckCards, seaCards } from './data';
import { createRng } from './rng';
import { newTurn, type Ctx, type GameEvent, type GameState, type Pos, type ShipState, type Variant } from './state';
import { runQueue } from './queue';
import { drawUp } from './turn';
import type { GameData, Side } from './types';

export interface GameOptions {
  seed: number;
  variant?: Variant;
  /** Ship codes of each team from left to right. A team without it is placed at random, as bots do (RULES.md 2.2). */
  positions?: Partial<Record<Side, [string, string]>>;
  /** Play with the sea deck and the Legends (docs/TZ.md, setup screen). «Первая партия» plays without both by default (RULES.md 20.1). */
  sea?: boolean;
  legends?: boolean;
  /** Network games: open a Reaction window also when nobody can react (see GameState.pauseEmptyWindows). */
  pauseEmptyWindows?: boolean;
}

export function createGame(data: GameData, options: GameOptions): { state: GameState; events: GameEvent[] } {
  const variant = options.variant ?? 'standard';
  const withSea = options.sea ?? variant !== 'first';
  const withLegends = options.legends ?? variant !== 'first';
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
      legend: withLegends,
      deck: rng.shuffle(deckCards(data, ship.code).map((c) => c.code)),
      hand: [],
      discard: [],
      plans: [],
      lastDive: null,
      surfaced: false,
      blockaded: false,
      parley: false,
      voodoo: null,
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
    sea: !withSea ? null : { deck: rng.shuffle(seaCards(data).map((c) => c.code)), discard: [], current: null },
    turn: newTurn(),
    winner: null,
    queue: [{ k: 'startRound' }],
    pending: null,
    volley: null,
    card: null,
  };
  if (options.pauseEmptyWindows) state.pauseEmptyWindows = true;

  const ctx: Ctx = { s: state, data, rng, events: [] };
  for (const code of Object.keys(ships)) drawUp(ctx, code);
  runQueue(ctx);
  state.rng = rng.state;
  return { state, events: ctx.events };
}
