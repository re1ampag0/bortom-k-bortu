// Game state, actions and events. The state is plain JSON: cards are stored by their codes ("Ж-07", "С-03").
import { deckCards, legendCards, seaCards } from './data';
import type { Rng } from './rng';
import type { CardInstance, GameData, SeaCardInstance, Ship, Side, Track } from './types';

/** "first" — «Первая партия», "quick" — «Быстрый бой» (RULES.md 20). */
export type Variant = 'standard' | 'first' | 'quick';
export type Winner = Side | 'НИЧЬЯ';
/** Left or right place of a team's row (RULES.md 2.1). */
export type Pos = 0 | 1;

/** Lowest value of each track (RULES.md 3.2–3.5). */
export const TRACK_MIN: Record<Track, number> = { hull: 0, sails: 0, guns: 0, crew: 1 };

/** Ship abilities the engine looks up by name. */
export const ABILITY = {
  fasterThanWind: 'Быстрее ветра',
} as const;

/**
 * A ship and its seat: the player's hand, deck and discard belong to the seat
 * and stay with the captain after the ship sinks (RULES.md 1.4, 17.2).
 */
export interface ShipState {
  code: string;
  side: Side;
  pos: Pos;
  tracks: Record<Track, number>;
  souls: number;
  fires: number;
  sunk: boolean;
  submerged: boolean;
  /** The Legend still lies next to the board. */
  legend: boolean;
  /** Top of the deck is index 0. */
  deck: string[];
  hand: string[];
  discard: string[];
  /** Plans of the Black Pearl (stage 4). */
  plans: string[];
}

export interface TeamState {
  powder: number;
}

/** Counters of the current turn; reset when a turn starts. Keys are ship codes. */
export interface TurnState {
  /** Card limit fixed at the start of the turn (RULES.md 7.3). */
  limit: Record<string, number>;
  played: Record<string, number>;
  volleys: Record<string, number>;
  /** Captains of sunk ships that already played their card for the ally (RULES.md 17.3). */
  captainPlayed: string[];
  sold: string[];
  passed: string[];
  regrouped: boolean;
  /** Ship that actually took the team's first volley this turn and who fired it (RULES.md 10.7). */
  firstTarget: string | null;
  firstShooter: string | null;
  jointUsed: boolean;
  /** Ships that took damage this turn. */
  damaged: string[];
}

export interface SeaState {
  deck: string[];
  discard: string[];
  current: string | null;
}

export interface GameState {
  seed: number;
  /** Generator state, see rng.ts. */
  rng: number;
  variant: Variant;
  round: number;
  active: Side;
  ships: Record<string, ShipState>;
  teams: Record<Side, TeamState>;
  /** null when the variant plays without the sea deck. */
  sea: SeaState | null;
  turn: TurnState;
  winner: Winner | null;
}

export type Action =
  | {
      type: 'volley';
      ship: string;
      target: string;
      /** Charge card from the hand of `chargeFrom` (by default the shooting ship's seat). */
      charge?: string;
      chargeFrom?: string;
      /** Extra Powder for a paid Charge. */
      paid?: number;
    }
  | { type: 'playCard'; seat: string; card: string }
  | { type: 'sell'; seat: string; card: string }
  | { type: 'pass'; seat: string; card: string }
  | { type: 'regroup'; side: Side }
  | { type: 'extinguish'; seat: string; card: string }
  | { type: 'endTurn'; side: Side };

export type PowderReason = 'hold' | 'sell';
export type SpendReason = 'volley' | 'card' | 'regroup';

export type GameEvent =
  | { type: 'roundStarted'; round: number }
  | { type: 'seaRevealed'; card: string; reshuffled: boolean }
  | { type: 'turnStarted'; side: Side }
  | { type: 'turnEnded'; side: Side }
  | { type: 'powderGained'; side: Side; amount: number; burned: number; reason: PowderReason }
  | { type: 'powderSpent'; side: Side; amount: number; reason: SpendReason }
  | { type: 'soulsSpent'; ship: string; amount: number }
  | { type: 'fireDamage'; ship: string; fires: number }
  | { type: 'fireAdded'; ship: string; fires: number }
  | { type: 'fireOut'; seat: string; card: string; fires: number }
  | { type: 'drew'; seat: string; count: number }
  | { type: 'deckReshuffled'; seat: string }
  | { type: 'damage'; ship: string; track: Track; amount: number; toHull: number }
  | { type: 'sunk'; ship: string }
  | {
      type: 'volley';
      ship: string;
      target: string;
      charge: string | null;
      chargeFrom: string | null;
      diagonal: boolean;
      joint: boolean;
      damage: number;
      track: Track;
    }
  | { type: 'cardPlayed'; seat: string; ship: string; card: string }
  | { type: 'sold'; seat: string; card: string }
  | { type: 'passed'; seat: string; to: string; card: string }
  | { type: 'regrouped'; side: Side; ships: string[] }
  | { type: 'gameOver'; winner: Winner; reason: 'sunk' | 'rounds' };

/** A move the rules forbid. The message is shown to the player. */
export class RuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleError';
  }
}

/** Everything a rule handler needs; handlers change `s` in place (applyAction works on a copy). */
export interface Ctx {
  s: GameState;
  data: GameData;
  rng: Rng;
  events: GameEvent[];
}

const cardIndex = new WeakMap<GameData, Map<string, CardInstance>>();
const seaIndex = new WeakMap<GameData, Map<string, SeaCardInstance>>();

export function cardByCode(data: GameData, code: string): CardInstance {
  let index = cardIndex.get(data);
  if (!index) {
    index = new Map([...deckCards(data), ...legendCards(data)].map((c) => [c.code, c]));
    cardIndex.set(data, index);
  }
  const card = index.get(code);
  if (!card) throw new Error(`Unknown card code ${code}`);
  return card;
}

export function seaCardByCode(data: GameData, code: string): SeaCardInstance {
  let index = seaIndex.get(data);
  if (!index) {
    index = new Map(seaCards(data).map((c) => [c.code, c]));
    seaIndex.set(data, index);
  }
  const card = index.get(code);
  if (!card) throw new Error(`Unknown sea card code ${code}`);
  return card;
}

export function shipData(data: GameData, code: string): Ship {
  const ship = data.ships.find((s) => s.code === code);
  if (!ship) throw new Error(`Unknown ship ${code}`);
  return ship;
}

/** Seat whose discard the card goes to (RULES.md 9.3, 9.4). */
export function ownerOf(data: GameData, card: string): string {
  return cardByCode(data, card).deck;
}

export const otherSide = (side: Side): Side => (side === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ');

export function teamShips(s: GameState, side: Side): ShipState[] {
  return Object.values(s.ships).filter((x) => x.side === side);
}

export function aliveShips(s: GameState, side: Side): ShipState[] {
  return teamShips(s, side).filter((x) => !x.sunk);
}

export function allyOf(s: GameState, code: string): ShipState {
  const ship = getShip(s, code);
  const ally = teamShips(s, ship.side).find((x) => x.code !== code);
  if (!ally) throw new Error(`Ship ${code} has no ally`);
  return ally;
}

export function getShip(s: GameState, code: string): ShipState {
  const ship = s.ships[code];
  if (!ship) throw new RuleError(`Нет корабля «${code}»`);
  return ship;
}

/** Name of a ship for messages. */
export const shipName = (data: GameData, code: string) => shipData(data, code).name;

/** Seats that still play: all seats of a team with at least one ship afloat (RULES.md 17.2). */
export function seatsOf(s: GameState, side: Side): ShipState[] {
  return aliveShips(s, side).length > 0 ? teamShips(s, side) : [];
}

/** The ship a seat plays for: its own, or the ally's when the seat is a captain of a sunk ship. */
export function seatShip(s: GameState, seat: string): ShipState | null {
  const own = getShip(s, seat);
  if (!own.sunk) return own;
  const ally = allyOf(s, seat);
  return ally.sunk ? null : ally;
}

export const isCaptain = (s: GameState, seat: string) => getShip(s, seat).sunk && seatShip(s, seat) !== null;

export function hasAbility(data: GameData, ship: ShipState, name: string): boolean {
  return !ship.sunk && shipData(data, ship.code).abilities.some((a) => a.name === name);
}

export function startValue(data: GameData, code: string, track: Track): number {
  return shipData(data, code)[track];
}

export function newTurn(): TurnState {
  return {
    limit: {},
    played: {},
    volleys: {},
    captainPlayed: [],
    sold: [],
    passed: [],
    regrouped: false,
    firstTarget: null,
    firstShooter: null,
    jointUsed: false,
    damaged: [],
  };
}

/** Removes a card from a list or throws a RuleError with the given message. */
export function takeCard(list: string[], card: string, message: string): void {
  const i = list.indexOf(card);
  if (i < 0) throw new RuleError(message);
  list.splice(i, 1);
}
