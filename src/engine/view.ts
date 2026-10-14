// What a player may see (docs/TZ.md, «Кто что видит»). The interface on one screen and the server use the same
// function, so hidden cards are cut here and never reach the interface or the network.
import { seatsOf, type GameEvent, type GameState } from './state';

/** A card the viewer may not see: it keeps its place, so counts stay right. */
export const HIDDEN = '?';

/** Seats (ship codes) the view is made for, or 'all' for open hands and tests. */
export type Viewer = readonly string[] | 'all';

export interface ViewOptions {
  /** Allies see each other's hands (on by default, docs/TZ.md). */
  allyHands?: boolean;
}

const hide = (cards: string[]) => cards.map(() => HIDDEN);

/** Seats whose hands the viewer sees: the viewer's own and, by default, their allies'. */
export function seesHand(state: GameState, viewer: Viewer, seat: string, options: ViewOptions = {}): boolean {
  if (viewer === 'all' || viewer.includes(seat)) return true;
  if (options.allyHands === false) return false;
  const side = state.ships[seat].side;
  return viewer.some((v) => v !== seat && state.ships[v]?.side === side);
}

/**
 * The state without what the viewer may not see: enemy hands and Plans (Plans are seen by the whole team), the
 * order of every deck and of the sea deck, cards a choice shows only to the chooser (top of the deck for «Компас
 * Джека», the sea cards for «Тиа Дальма», the enemy's Reactions for «Шпион Мерсер»), the secret pick of «Игра в
 * кости лжеца», and the seed and generator state, from which hidden cards could be computed.
 */
export function viewFor(state: GameState, viewer: Viewer, options: ViewOptions = {}): GameState {
  if (viewer === 'all') return state;
  const s = structuredClone(state);
  s.seed = 0;
  s.rng = 0;
  const sides = new Set(viewer.map((v) => s.ships[v]?.side).filter(Boolean));
  for (const ship of Object.values(s.ships)) {
    ship.deck = hide(ship.deck);
    if (!seesHand(state, viewer, ship.code, options)) ship.hand = hide(ship.hand);
    if (!sides.has(ship.side)) ship.plans = hide(ship.plans);
  }
  if (s.sea) {
    const peek = s.sea.peek;
    const known = peek && viewer.includes(peek.seat) ? peek.n : 0;
    s.sea.deck = s.sea.deck.map((c, i) => (i < known ? c : HIDDEN));
    if (peek && !viewer.includes(peek.seat)) delete s.sea.peek;
  }
  const p = s.pending;
  // Who decides on a Reaction tells which ships hold one: the enemy sees the whole defending team deciding.
  if (p?.kind === 'reactions' && !sides.has(p.side)) p.waiting = defenders(state, p.side);
  if (p?.kind === 'choice') {
    if (!viewer.includes(p.seat) && p.what !== 'bell' && p.what !== 'dice') p.options = hide(p.options);
    for (const seat of Object.keys(p.picks)) if (!viewer.includes(seat)) p.picks[seat] = HIDDEN;
  }
  return s;
}

const defenders = (state: GameState, side: GameState['active']) => seatsOf(state, side).map((x) => x.code);

const onSide = (state: GameState, viewer: Viewer, side: GameState['active']) =>
  viewer === 'all' || viewer.some((v) => state.ships[v]?.side === side);

/**
 * An event as the viewer may see it: a card passed to an ally is hidden from the enemy; the cards drawn — from
 * everyone who does not see that hand; a stolen card — from everyone who sees neither the thief's hand nor the
 * robbed one (that a card was stolen everyone sees).
 */
export function eventFor(state: GameState, viewer: Viewer, event: GameEvent, options: ViewOptions = {}): GameEvent {
  if (event.type === 'passed' && !seesHand(state, viewer, event.to, options)) return { ...event, card: HIDDEN };
  if (event.type === 'drew' && event.cards && !seesHand(state, viewer, event.seat, options)) {
    const { cards: _cards, ...rest } = event;
    return rest;
  }
  if (event.type === 'stolen' && !seesHand(state, viewer, event.seat, options) && !seesHand(state, viewer, event.from, options)) {
    return { ...event, card: HIDDEN };
  }
  if (event.type === 'windowOpened' && !onSide(state, viewer, event.side)) return { ...event, seats: defenders(state, event.side) };
  return event;
}

/**
 * Events as the viewer may see them (eventFor), without the enemy's «без Реакции»: it would tell which ships held
 * a Reaction. `state` is the state the events happened in (after the action).
 */
export function eventsFor(state: GameState, viewer: Viewer, events: GameEvent[], options: ViewOptions = {}): GameEvent[] {
  return events
    .filter((e) => e.type !== 'noReaction' || onSide(state, viewer, state.ships[e.seat].side))
    .map((e) => eventFor(state, viewer, e, options));
}
