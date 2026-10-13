// Test helpers: a game with known placement and hands. Tests may change the state directly (it is plain JSON).
import raw from '../data/game-data.json';
import { deckCards, loadGameData } from '../src/engine/data';
import { applyAction, createGame, type GameOptions } from '../src/engine/engine';
import type { Action, GameEvent, GameState } from '../src/engine/state';

export const data = loadGameData(raw);

/** Ж opposite И on the left, М opposite Г on the right. */
export const POSITIONS: GameOptions['positions'] = { ПИРАТЫ: ['Ж', 'М'], КОМПАНИЯ: ['И', 'Г'] };

export function newGame(options: Partial<GameOptions> = {}): GameState {
  return createGame(data, { seed: 1, positions: POSITIONS, ...options }).state;
}

export function act(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  return applyAction(state, action, data);
}

/** Applies actions one by one and returns the final state. */
export function run(state: GameState, ...actions: Action[]): GameState {
  for (const action of actions) state = act(state, action).state;
  return state;
}

/** Codes of all copies of a card in a ship's deck. */
export function codesOf(deck: string, name: string): string[] {
  const codes = deckCards(data, deck)
    .filter((c) => c.name === name)
    .map((c) => c.code);
  if (codes.length === 0) throw new Error(`No card «${name}» in deck ${deck}`);
  return codes;
}

/** Removes a card from wherever it lies (any deck, hand, discard or plan). */
function pull(state: GameState, code: string): void {
  for (const ship of Object.values(state.ships)) {
    for (const list of [ship.deck, ship.hand, ship.discard, ship.plans]) {
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1);
    }
  }
}

/** Puts a copy of the named card from deck `from` (by default the seat's own) into the seat's hand. Returns its code. */
export function give(state: GameState, seat: string, name: string, from = seat): string {
  const inHand = new Set(Object.values(state.ships).flatMap((s) => s.hand));
  const code = codesOf(from, name).find((c) => !inHand.has(c)) ?? codesOf(from, name)[0];
  pull(state, code);
  state.ships[seat].hand.push(code);
  return code;
}

/** Replaces the seat's hand with the named cards; the old hand goes to the bottom of its owner's deck. */
export function setHand(state: GameState, seat: string, names: string[]): string[] {
  const ship = state.ships[seat];
  for (const code of ship.hand.splice(0)) state.ships[code.split('-')[0]].deck.push(code);
  return names.map((name) => give(state, seat, name));
}

/** Ends turns until it is the given team's turn. */
export function passTo(state: GameState, side: GameState['active']): GameState {
  while (state.active !== side) state = act(state, { type: 'endTurn', side: state.active }).state;
  return state;
}

/** Total number of card codes of each deck over all piles; used to check that cards are not lost or doubled. */
export function cardsByOwner(state: GameState): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const ship of Object.values(state.ships)) {
    for (const code of [...ship.deck, ...ship.hand, ...ship.discard, ...ship.plans]) {
      (out[code.split('-')[0]] ??= []).push(code);
    }
  }
  return out;
}
