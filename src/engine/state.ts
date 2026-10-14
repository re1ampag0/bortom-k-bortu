// Game state, actions and events. The state is plain JSON: cards are stored by their codes ("Ж-07", "С-03").
import { deckCards, legendCards, seaCards } from './data';
import type { Rng } from './rng';
import type { CardInstance, Fx, GameData, SeaCardInstance, Ship, Side, Track } from './types';

/** "first" — «Первая партия», "quick" — «Быстрый бой» (RULES.md 20). */
export type Variant = 'standard' | 'first' | 'quick';
export type Winner = Side | 'НИЧЬЯ';
/** Left or right place of a team's row (RULES.md 2.1). */
export type Pos = 0 | 1;

/** Lowest value of each track (RULES.md 3.2–3.5). */
export const TRACK_MIN: Record<Track, number> = { hull: 0, sails: 0, guns: 0, crew: 1 };

/** Ship abilities the engine looks up by name. */
export const ABILITY = {
  madPlan: 'Безумный план',
  fasterThanWind: 'Быстрее ветра',
  sword: 'Меч Тритона',
  treasury: 'Казна Компании',
  heart: 'Сердце Дейви Джонса',
  eternalService: 'Вечная служба',
  dive: 'Погружение',
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
  /** Plans of the Black Pearl (RULES.md 14.1). */
  plans: string[];
  /** Round of the last dive (RULES.md 14.8: not two own turns in a row). */
  lastDive: number | null;
  /** Surfaced this turn: the first Volley gets +1 and no Reactions (14.8). */
  surfaced: boolean;
  /** Under «Блокада» until the end of its next turn: no Repair, no change of places (RULES.md 18.10, Q20, Q21). */
  blockaded: boolean;
  /** «Право на переговоры»: no Volleys in its next turn (18.15). */
  parley: boolean;
  /** «Кукла вуду»: the ship that played it; in its next turn the ship loses 1 Crew for each card played (Q44). */
  voodoo: string | null;
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
  /** Reactions played by each defending ship against the Sails limit (RULES.md 7.2). */
  reactions: Record<string, number>;
  /** Captains of sunk ships that already played their Reaction for the ally (17.3). */
  captainReacted: string[];
  /** Ships that may not play Reactions this turn («Ужас Карибского моря»). */
  noReact: string[];
  /** The defending team may not play Reactions this turn («Подкуп»). */
  noReactTeam: boolean;
  /** «Водоворот»: every Volley this turn deals less (one term per card played). */
  reduceAll: Term[];
  swordUsed: boolean;
  treasuryUsed: boolean;
  /** «Сердце Дейви Джонса» was ordered this turn. */
  heartUsed: boolean;
  /** Ships that dived instead of their Volley this turn. */
  dived: string[];
  /** «Поднять флаги!»: extra damage of the team's Volleys this turn. */
  volleyBonus: number;
  /** «Строй линии»: the team's Volleys have no diagonal penalty this turn. */
  noDiag: boolean;
  /** «Чёрная метка»: extra damage of each Volley at the ship this turn. */
  marks: Record<string, number>;
}

/** One addend of a Volley's damage, e.g. { what: 'Пушки', n: 3, src: { kind: 'guns' } }. */
export interface Term {
  what: string;
  n: number;
  /** Where the addend comes from (for the animations); missing in terms saved before it was added. */
  src?: TermSrc;
}

/** The source of a Volley's addend: `card` — card code, `ally` — the ship that fired first at the target. */
export type TermSrc =
  | { kind: 'guns' }
  | { kind: 'diag' }
  | { kind: 'charge'; card: string | null }
  | { kind: 'sea'; card: string }
  | { kind: 'reaction'; card: string }
  | { kind: 'joint'; ally: string }
  | { kind: 'surface' }
  | { kind: 'flags' }
  | { kind: 'mark' }
  | { kind: 'paid' }
  | { kind: 'clear' }
  | { kind: 'extra'; card: string };

/** A Volley being resolved (RULES.md 10.1). */
export interface VolleyState {
  shooter: string;
  /** Ship the Volley hits now (after «Прикрыть бортом» — the covering ship). */
  target: string;
  /** «Залп с обоих бортов»: targets still to hit. */
  rest: string[];
  both: boolean;
  charge: string | null;
  chargeFrom: string | null;
  /** The Charge's fx with the «План:» bonus applied; {} when there is no Charge. */
  fx: Fx;
  fromPlan: boolean;
  paid: number;
  chargeCancelled: boolean;
  /** Fixed when the Volley is declared and not recalculated later (RULES.md 18.1, Q40). */
  guns: number;
  diagonal: boolean;
  /** «Мальстрём»: no diagonal penalty. */
  seaNoDiag: boolean;
  joint: boolean;
  storm: number;
  clear: number;
  surfaced: number;
  reduceAll: Term[];
  ifFire: boolean;
  ifDamaged: boolean;
  /** Changes made by Reactions. */
  adjust: Term[];
  track: Track;
  noReact: boolean;
  cancelled: boolean;
  crewCancelled: boolean;
  heart: boolean;
  /** «Поднять флаги!» and «Чёрная метка», fixed when the Volley is declared (18.1). */
  bonus: number;
  mark: number;
  /** «Строй линии»: no diagonal penalty. */
  lineNoDiag: boolean;
  /** The bonus of an extra Volley given by a card («Всплытие»). */
  extra: Term | null;
}

/** Choices a player makes when playing an Order or a Repair. */
export interface CardParams {
  /** An enemy ship, or an enemy seat for cards that take from a player («Обезьянка Джек», «Шпион Мерсер», «Игра в кости лжеца»). */
  target?: string;
  /** Own ship or the ally's: «Живые снасти», «Фонтан молодости», «Подкрепление флота». */
  ship?: string;
  /** How to split «N клеток на любых шкалах». Without it the cells go to the tracks in the order Пушки, Корпус, Команда, Паруса. */
  repair?: Partial<Record<Track, number>>;
  /** «Сердце бьётся»: Souls to spend. */
  souls?: number;
  /** «Строй линии»: make the free Regroup (Q46). */
  regroup?: boolean;
}

/** An Order, a Repair or a Legend being resolved (RULES.md 9.7, 12.2). */
export interface CardResolution {
  card: string;
  seat: string;
  /** The ship the card is played for. */
  ship: string;
  /** Ships (seats) the card chose or affects, for Reactions against it. */
  targets: string[];
  /** The ship or seat the card chose; for «Только по кораблю напротив» — the ship opposite. */
  target: string | null;
  /** The card deals damage to the Crew. */
  crew: boolean;
  cancelled: boolean;
  crewCancelled: boolean;
  /** The card goes from the table: a Legend leaves the game (15.1). */
  legend: boolean;
  fromPlan: boolean;
  params: CardParams;
  /** «Ловкость рук»: after the card is played it goes to this seat's hand (18.4). */
  stolenBy: string | null;
  /** «Кукла вуду» sank the ship when the card was played: no effect, the card goes to the discard (18.19, Q47). */
  lost: boolean;
}

/**
 * What a player chooses after a card has shown something: «Компас Джека» (a card to the hand, a card to a Plan),
 * «Безумный план» (a card to a Plan), «Анжелика» (a card to the ally), «Шпион Мерсер» (an enemy Reaction),
 * «Тиа Дальма» (the order of the sea cards), «Колокол» (each enemy discards), «Игра в кости лжеца» (both pick a card).
 */
export type ChoiceWhat = 'compass' | 'toPlan' | 'pass' | 'spy' | 'tia' | 'bell' | 'dice';

export type ReactionWindow = 'before' | 'after';

/** A decision the engine waits for. Only answering actions are allowed meanwhile. */
export type Pending =
  | { kind: 'reactions'; window: ReactionWindow; subject: 'volley' | 'card'; side: Side; waiting: string[] }
  | { kind: 'jack'; ship: string }
  | { kind: 'tortuga'; waiting: Side[] }
  | {
      kind: 'choice';
      what: ChoiceWhat;
      /** The seat that played the card. */
      seat: string;
      /** Seats that still have to choose. */
      waiting: string[];
      /** Cards to choose from when they are not in the chooser's hand (top of a deck, the enemy's Reactions). */
      options: string[];
      /** «Игра в кости лжеца»: the cards picked so far, secret until both have picked. */
      picks: Record<string, string>;
    };

export type SwapReason = 'regroup' | 'sword' | 'jack' | 'current' | 'maelstrom';

/**
 * A piece of work left to do. A step deals damage at most once, as its last action, so «Джек ускользает» can pause
 * after it. `same` marks a step of the same effect as the step before: the end of the game is checked after the
 * whole effect, so the last ships of both teams sunk by one effect make a draw (RULES.md 19.2).
 */
export type Step = StepKind & { same?: boolean };

type StepKind =
  | { k: 'startRound' }
  | { k: 'startTurn'; side: Side }
  | { k: 'fire'; ship: string }
  | { k: 'surface'; side: Side }
  | { k: 'turnReady'; side: Side }
  | { k: 'damage'; ship: string; track: Track; n: number; src: string | null }
  | { k: 'addFire'; ship: string; n: number }
  | { k: 'sink'; ship: string }
  | { k: 'swap'; side: Side; reason: SwapReason }
  | { k: 'tortuga' }
  /** Only reports a «весь раунд» sea effect as it acts («Девятый вал» before its damage). */
  | { k: 'seaEffect'; key: string }
  | { k: 'window'; window: ReactionWindow; subject: 'volley' | 'card' }
  | { k: 'volleyPaid' }
  | { k: 'volleyHit' }
  | { k: 'volleyFire' }
  | { k: 'volleyEnd' }
  | { k: 'cardEffect' }
  | { k: 'cardOp'; i: number }
  | { k: 'cardPaid' }
  | { k: 'cardEnd' };

export interface SeaState {
  deck: string[];
  discard: string[];
  current: string | null;
  /** «Тиа Дальма»: the top `n` cards of the sea deck are known to the seat that looked (docs/TZ.md, «Кто что видит»). */
  peek?: { seat: string; n: number };
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
  /** Work left to do, see queue.ts. */
  queue: Step[];
  pending: Pending | null;
  volley: VolleyState | null;
  card: CardResolution | null;
  /**
   * Network games: a Reaction window opens even when the defenders have no Reaction to play, so a pause does not
   * give their hands away (`waiting` is empty; the server closes it with `closeWindow`).
   */
  pauseEmptyWindows?: boolean;
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
      /** The extra Volley of the Flying Dutchman by «Сердце Дейви Джонса» (RULES.md 14.6). */
      heart?: boolean;
    }
  | ({ type: 'playCard'; seat: string; card: string } & CardParams)
  /** An answer to a `choice` decision; see ChoiceWhat for what the cards mean. */
  | { type: 'choose'; seat: string; cards: string[] }
  | { type: 'playLegend'; seat: string; target?: string }
  | { type: 'sell'; seat: string; card: string }
  | { type: 'pass'; seat: string; card: string }
  | { type: 'regroup'; side: Side }
  | { type: 'extinguish'; seat: string; card: string }
  | { type: 'dive'; ship: string }
  | { type: 'sword'; ship: string }
  | { type: 'treasury'; ship: string }
  | { type: 'souls'; ship: string; track: Track }
  /** At the end of the turn the Black Pearl may put cards from her hand into Plans (RULES.md 14.1). */
  | { type: 'endTurn'; side: Side; plans?: string[] }
  | { type: 'react'; seat: string; card: string }
  | { type: 'noReaction'; seat: string }
  /** The Reaction window closes: every seat still deciding plays no Reaction (the server: an empty window, a timer). */
  | { type: 'closeWindow' }
  | { type: 'jack'; play: boolean }
  /** «Тортуга»: how many cards each seat of the team takes (RULES.md 16.2). */
  | { type: 'tortuga'; side: Side; draws: Record<string, number> }
  /** The team gives up (docs/TZ.md, «Интерфейс → Детали», п. 4); allowed at any moment, also while the engine waits. */
  | { type: 'concede'; side: Side };

export type PowderReason = 'hold' | 'sell' | 'sea' | 'card';
export type SpendReason = 'volley' | 'card' | 'regroup' | 'reaction' | 'ability' | 'sea';

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
  /** `cards` — the cards drawn; eventFor leaves them only to those who see the hand. */
  | { type: 'drew'; seat: string; count: number; cards?: string[] }
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
      /** The breakdown of `damage` when the Volley is declared, before Reactions. */
      terms: Term[];
    }
  | { type: 'cardPlayed'; seat: string; ship: string; card: string }
  | { type: 'sold'; seat: string; card: string }
  | { type: 'passed'; seat: string; to: string; card: string }
  | { type: 'regrouped'; side: Side; ships: string[] }
  | { type: 'swapped'; side: Side; reason: SwapReason; ships: string[] }
  | { type: 'hit'; ship: string; target: string; damage: number; track: Track; terms: Term[] }
  | { type: 'volleyCancelled'; ship: string; target: string }
  | { type: 'windowOpened'; window: ReactionWindow; side: Side; seats: string[] }
  | { type: 'reaction'; seat: string; ship: string; card: string; fromPlan: boolean }
  | { type: 'noReaction'; seat: string }
  | { type: 'jackEscaped'; ship: string }
  | { type: 'legendPlayed'; seat: string; card: string; target: string | null }
  | { type: 'cardCancelled'; card: string }
  | { type: 'cardLost'; card: string }
  | { type: 'planned'; seat: string; count: number }
  | { type: 'dived'; ship: string }
  | { type: 'surfaced'; ship: string }
  | { type: 'sword'; ship: string }
  | { type: 'treasury'; ship: string }
  | { type: 'heart'; ship: string }
  | { type: 'jonesFree'; ship: string }
  | { type: 'soulsGained'; ship: string; amount: number }
  | { type: 'soulsUsed'; ship: string; track: Track }
  | { type: 'seaEffect'; key: string }
  | { type: 'powderLost'; side: Side; amount: number }
  | { type: 'restored'; ship: string; track: Track; amount: number }
  | { type: 'cardResolved'; card: string; to: 'discard' | 'stolen' | 'gone'; seat: string | null }
  | { type: 'stolen'; seat: string; from: string; card: string }
  | { type: 'discarded'; seat: string; card: string }
  | { type: 'shown'; seat: string; to: string }
  | { type: 'seaLooked'; seat: string }
  | { type: 'dice'; cards: Record<string, string>; winner: string | null }
  | { type: 'flagSet'; ship: string; flag: 'parley' | 'voodoo' | 'blockade' | 'mark' | 'noReact' }
  | { type: 'turnFlag'; side: Side; flag: 'volleyBonus' | 'noDiag' | 'noReactTeam'; n: number }
  | { type: 'limitRaised'; ship: string; n: number }
  | { type: 'conceded'; side: Side }
  | { type: 'gameOver'; winner: Winner; reason: 'sunk' | 'rounds' | 'concede' };

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
    reactions: {},
    captainReacted: [],
    noReact: [],
    noReactTeam: false,
    reduceAll: [],
    swordUsed: false,
    treasuryUsed: false,
    heartUsed: false,
    dived: [],
    volleyBonus: 0,
    noDiag: false,
    marks: {},
  };
}

/** Marks the steps as one effect (see Step.same). */
export function oneEffect(steps: Step[]): Step[] {
  return steps.map((step, i) => (i === 0 ? step : { ...step, same: true }));
}

/** Puts steps at the front of the queue, keeping their order: they run before the work already queued. */
export function pushSteps(s: GameState, ...steps: Step[]): void {
  s.queue.unshift(...steps);
}

/** Key of the current sea card («calm», «storm» …) or null. */
export function seaKey(ctx: Ctx): string | null {
  const current = ctx.s.sea?.current;
  return current ? seaCardByCode(ctx.data, current).key : null;
}

/** The current pending decision or a RuleError if the engine waits for something else. */
export function requirePending<K extends Pending['kind']>(s: GameState, kind: K): Extract<Pending, { kind: K }> {
  if (s.pending?.kind !== kind) throw new RuleError('Сейчас нечего решать');
  return s.pending as Extract<Pending, { kind: K }>;
}

/**
 * The ship a card names («Залп по «Жемчужине»», «„Месть" даёт Залп», «Голландец»): the named ship while it is afloat;
 * when it sank — the ship the card is played for, where the captain is (Q7, Q43). A card that names an enemy ship
 * (stolen by «Ловкость рук» or «Обезьянка Джек») means the ship that plays it (Q43).
 */
export function namedShip(ctx: Ctx, card: string, ship: string): string {
  const named = ctx.s.ships[cardByCode(ctx.data, card).deck];
  if (!named || named.side !== getShip(ctx.s, ship).side || named.sunk) return ship;
  return named.code;
}

/** The card's fx with its «План:» bonus when it is played from a Plan (9.5): numbers are replaced, ops are added. */
export function planFx(fx: Fx, fromPlan: boolean): Fx {
  if (!fromPlan || !fx.plan) return fx;
  const { plan, ...rest } = fx;
  const out: Fx = { ...rest, ...plan };
  if (fx.ops || plan.ops) out.ops = [...(fx.ops ?? []), ...(plan.ops ?? [])];
  return out;
}

/** Removes a card from a list or throws a RuleError with the given message. */
export function takeCard(list: string[], card: string, message: string): void {
  const i = list.indexOf(card);
  if (i < 0) throw new RuleError(message);
  list.splice(i, 1);
}
