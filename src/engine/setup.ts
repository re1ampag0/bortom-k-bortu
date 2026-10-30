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
  /**
   * The team that moves first (the balance lab); the Pirates by default. The first team gets `first_income` in the very
   * first turn, the second team starts with `second_start` Powder (RULES.md 4, 5.2: «Пираты» / «Компания» stand for them).
   */
  first?: Side;
}

export function createGame(data: GameData, options: GameOptions): { state: GameState; events: GameEvent[] } {
  const variant = options.variant ?? 'standard';
  const withSea = options.sea ?? variant !== 'first';
  const withLegends = options.legends ?? variant !== 'first';
  const rng = createRng(options.seed);
  const first: Side = options.first ?? 'ПИРАТЫ';
  const second: Side = first === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ';
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
    active: first,
    ships,
    teams: {
      [first]: { powder: 0 },
      [second]: { powder: variant === 'first' ? data.rules.firstGameSecondStart : data.econ.second_start },
    } as GameState['teams'],
    sea: !withSea ? null : { deck: rng.shuffle(seaCards(data).map((c) => c.code)), discard: [], current: null },
    turn: newTurn(),
    winner: null,
    queue: [{ k: 'startRound' }],
    pending: null,
    volley: null,
    card: null,
  };
  if (options.pauseEmptyWindows) state.pauseEmptyWindows = true;
  if (first !== 'ПИРАТЫ') state.first = first;

  const ctx: Ctx = { s: state, data, rng, events: [] };
  for (const code of Object.keys(ships)) drawUp(ctx, code);
  runQueue(ctx);
  state.rng = rng.state;
  return { state, events: ctx.events };
}
