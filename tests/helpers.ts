// Tests of the rules run on the frozen data of version 0.3 (tests/fixtures/game-data.v0.3.json): a change of the site's
// data in data/game-data.json (the admin page) does not break them; tests/main-data.test.ts checks that data.
// Test helpers: a game with known placement and hands. Tests may change the state directly (it is plain JSON).
import raw from './fixtures/game-data.v0.3.json';
import { TRACKS, deckCards, legendCards, loadGameData, seaCards } from '../src/engine/data';
import { choiceFor } from '../src/engine/cards';
import { applyAction, createGame, type GameOptions } from '../src/engine/engine';
import { TRACK_MIN, type Action, type GameEvent, type GameState } from '../src/engine/state';
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

/**
 * Answers every pending decision with «no»: no Reactions, no «Джек ускользает», no cards on «Тортуга».
 * A card choice is answered with the first allowed cards.
 */
export function declineAll(state: GameState, gameData: GameData = data, events: GameEvent[] = []): GameState {
  while (state.pending && !state.winner) {
    const p = state.pending;
    const answer: Action =
      p.kind === 'reactions'
        ? { type: 'noReaction', seat: p.waiting[0] }
        : p.kind === 'jack'
          ? { type: 'jack', play: false }
          : p.kind === 'tortuga'
            ? { type: 'tortuga', side: p.waiting[0], draws: {} }
            : firstChoice(state, p.waiting[0]);
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

/** The first allowed cards of a `choice` decision. */
export function firstChoice(state: GameState, seat: string): Action {
  const c = choiceFor(state, seat)!;
  return { type: 'choose', seat, cards: c.from.slice(0, c.count) };
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
  // A card being played lies on the table until it is resolved.
  if (state.card && !state.card.legend) (out[state.card.card.split('-')[0]] ??= []).push(state.card.card);
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

const SEATS: Record<GameState['active'], string[]> = { ПИРАТЫ: ['Ж', 'М'], КОМПАНИЯ: ['И', 'Г'] };

/**
 * The turn of `side` with 8 Powder in both Holds. Seats named in `hands` hold exactly those cards; the other team's
 * seats hold nothing unless named, so no Reaction window opens by chance.
 */
export function turnOf(side: GameState['active'], hands: Record<string, string[]> = {}, options: Partial<GameOptions> = {}): GameState {
  const s = passTo(newGame(options), side);
  s.teams['ПИРАТЫ'].powder = 8;
  s.teams['КОМПАНИЯ'].powder = 8;
  const enemy = side === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ';
  for (const seat of SEATS[enemy]) setHand(s, seat, []);
  for (const [seat, names] of Object.entries(hands)) setHand(s, seat, names);
  return s;
}

const cardNames = new Map([...deckCards(data), ...legendCards(data)].map((c) => [c.code, c.name]));

/** Name of a card by its code. */
export const nameOf = (code: string): string => cardNames.get(code)!;

/** Code of the named card in the seat's hand or Plans. */
export function cardIn(s: GameState, seat: string, name: string): string {
  const ship = s.ships[seat];
  const code = [...ship.hand, ...ship.plans].find((c) => nameOf(c) === name);
  if (!code) throw new Error(`${seat} has no «${name}»`);
  return code;
}

/** Names of the cards in a list of codes. */
export const namesOf = (codes: string[]): string[] => codes.map(nameOf);

const decks = Object.fromEntries(data.ships.map((x) => [x.code, deckCards(data, x.code).map((c) => c.code).sort()]));
const seaAll = seaCards(data).map((c) => c.code).sort();

/**
 * Broken invariants of a state: Powder 0–8, tracks between the minimum and the start, no card lost or doubled
 * (counted by the deck that owns it). Plain checks keep many games fast.
 */
export function brokenInvariants(s: GameState): string[] {
  const out: string[] = [];
  const check = (ok: boolean, what: string) => {
    if (!ok) out.push(what);
  };
  for (const [side, team] of Object.entries(s.teams)) {
    check(team.powder >= 0 && team.powder <= data.econ.cap, `${side}: Порох ${team.powder}`);
  }
  for (const ship of data.ships) {
    const x = s.ships[ship.code];
    for (const track of TRACKS) {
      const v = x.tracks[track];
      check(v >= TRACK_MIN[track] && v <= ship[track], `${ship.code} ${track} ${v}`);
    }
    // Hull 0 afloat only while the Pirates decide about «Джек ускользает».
    const jack = s.pending?.kind === 'jack' && s.pending.ship === ship.code;
    check(x.sunk === (x.tracks.hull === 0) || (jack && !x.sunk), `${ship.code}: sunk ${x.sunk}, hull ${x.tracks.hull}`);
    check(x.plans.length <= data.rules.plansMax, `${ship.code}: Планов ${x.plans.length}`);
    check(x.fires >= 0 && x.fires <= data.rules.maxFires, `${ship.code}: Пожаров ${x.fires}`);
    check(x.souls >= 0 && x.souls <= (ship.souls ?? 0), `${ship.code}: Душ ${x.souls}`);
  }
  if (!s.pending && !s.winner) {
    check(s.queue.length === 0 && !s.volley && !s.card, 'движок остановился, не доделав шаги');
  }
  const byOwner = cardsByOwner(s);
  for (const code of Object.keys(decks)) {
    check([...(byOwner[code] ?? [])].sort().join() === decks[code].join(), `колода ${code}: карты потеряны или повторяются`);
  }
  if (s.sea) {
    const sea = [...s.sea.deck, ...s.sea.discard, ...(s.sea.current ? [s.sea.current] : [])];
    check(sea.sort().join() === seaAll.join(), 'колода моря: карты потеряны или повторяются');
  }
  return out;
}
