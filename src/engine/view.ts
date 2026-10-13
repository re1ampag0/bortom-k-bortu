// What a player may see (docs/TZ.md, «Кто что видит»). The interface on one screen and the server use the same
// function, so hidden cards are cut here and never reach the interface or the network.
import type { GameEvent, GameState } from './state';

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
  if (s.sea) s.sea.deck = hide(s.sea.deck);
  const p = s.pending;
  if (p?.kind === 'choice') {
    if (!viewer.includes(p.seat) && p.what !== 'bell' && p.what !== 'dice') p.options = hide(p.options);
    for (const seat of Object.keys(p.picks)) if (!viewer.includes(seat)) p.picks[seat] = HIDDEN;
  }
  return s;
}

/** An event as the viewer may see it: a card passed to an ally is hidden from the enemy. */
export function eventFor(state: GameState, viewer: Viewer, event: GameEvent, options: ViewOptions = {}): GameEvent {
  if (event.type === 'passed' && !seesHand(state, viewer, event.to, options)) return { ...event, card: HIDDEN };
  return event;
}
