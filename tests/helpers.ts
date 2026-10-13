// Test helpers: a game with known placement and hands. Tests may change the state directly (it is plain JSON).
import raw from '../data/game-data.json';
import { deckCards, loadGameData, seaCards } from '../src/engine/data';
import { applyAction, createGame, type GameOptions } from '../src/engine/engine';
import type { Action, GameEvent, GameState } from '../src/engine/state';
import type { GameData } from '../src/engine/types';

export const data = loadGameData(raw);

/** Ж opposite И on the left, М opposite Г on the right. */
export const POSITIONS: GameOptions['positions'] = { ПИРАТЫ: ['Ж', 'М'], КОМПАНИЯ: ['И', 'Г'] };

/**
 * A game with known placement. The sea deck is off unless asked for (`sea: true`): sea cards change Volleys,
 * limits and Powder, and tests of other rules should not depend on which card comes first.
 */
export function newGame(options: Partial<GameOptions> = {}): GameState {
  return createGame(data, { seed: 1, positions: POSITIONS, sea: false, ...options }).state;
}

/** Answers every pending decision with «no»: no Reactions, no «Джек ускользает», no cards on «Тортуга». */
export function declineAll(state: GameState, gameData: GameData = data, events: GameEvent[] = []): GameState {
  while (state.pending && !state.winner) {
    const p = state.pending;
    const answer: Action =
      p.kind === 'reactions'
        ? { type: 'noReaction', seat: p.waiting[0] }
        : p.kind === 'jack'
          ? { type: 'jack', play: false }
          : { type: 'tortuga', side: p.waiting[0], draws: {} };
    const r = applyAction(state, answer, gameData);
    events.push(...r.events);
    state = r.state;
  }
  return state;
}

/** Applies an action, then declines every Reaction window and decision it opened. */
export function actDecline(state: GameState, action: Action): GameState {
  return declineAll(act(state, action).state);
}

/**
 * Like `act`, but the defending team plays no Reactions: every window the action opens is declined.
 * For tests of rules without Reactions (stage 3). Events of the declined windows are included.
 */
export function actDeclining(
  state: GameState,
  action: Action,
  gameData: GameData = data,
): { state: GameState; events: GameEvent[] } {
  const r = applyAction(state, action, gameData);
  const events = [...r.events];
  return { state: declineAll(r.state, gameData, events), events };
}

export function act(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  return applyAction(state, action, data);
}

/** Applies actions one by one, declining every Reaction window and decision, and returns the final state. */
export function run(state: GameState, ...actions: Action[]): GameState {
  for (const action of actions) state = actDeclining(state, action).state;
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
  state = declineAll(state);
  while (state.active !== side) state = declineAll(act(state, { type: 'endTurn', side: state.active }).state);
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

/** Code of the sea card with the given key («storm», «calm» …). */
export function seaCode(key: string): string {
  const card = seaCards(data).find((c) => c.key === key);
  if (!card) throw new Error(`No sea card «${key}»`);
  return card.code;
}

/** Makes the sea card the current one (a «Весь раунд» card acts at once; a «Сразу» card does nothing now). */
export function setSea(state: GameState, key: string): GameState {
  state.sea ??= { deck: [], discard: [], current: null };
  const code = seaCode(key);
  state.sea.deck = state.sea.deck.filter((c) => c !== code);
  state.sea.discard = state.sea.discard.filter((c) => c !== code);
  if (state.sea.current && state.sea.current !== code) state.sea.discard.push(state.sea.current);
  state.sea.current = code;
  return state;
}

/** Puts the sea card on top of the sea deck: it is opened at the start of the next round. */
export function nextSea(state: GameState, key: string): GameState {
  state.sea ??= { deck: [], discard: [], current: null };
  const code = seaCode(key);
  if (state.sea.current === code) state.sea.current = null;
  state.sea.discard = state.sea.discard.filter((c) => c !== code);
  state.sea.deck = [code, ...state.sea.deck.filter((c) => c !== code)];
  return state;
}
