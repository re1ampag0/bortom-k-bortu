// A game in a room (docs/TZ.md, «Игровой сервер», «Одновременные ходы»): the real state, the record, the logs each
// team may read, «Ход окончен» of each seat, «Сдаться» votes and the bots. Players get only viewFor of the state.
import { botAnswer, botTurn, newBotMemory, type BotMemory } from '../src/engine/ai/bot';
import { applyAction, createGame, type GameOptions } from '../src/engine/engine';
import { decider } from '../src/engine/hints';
import { describe, rewind, type LogLine } from '../src/engine/log';
import { matchTotals, type SideTotals } from '../src/engine/match';
import { ABILITY, RuleError, hasAbility, seatsOf, type Action, type GameEvent, type GameState } from '../src/engine/state';
import type { GameData, Side } from '../src/engine/types';
import { HIDDEN, eventsFor, viewFor, type Viewer } from '../src/engine/view';
import type { GameInfo, LastSeen, RoomSettings, Seat } from '../src/net/protocol';
import { fallbackAnswer, refusedShipBot, seatAnswer, shipBotStep, type ShipBots } from '../src/engine/ai/shipBot';

/** Who reads a log: a team, the spectators, or everybody («Всё открыто»). */
export type LogKey = Side | 'spectator' | 'all';

const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];

export interface Delays {
  /** A bot's move: random between the two, ms (docs/TZ.md: 0.5–1 s). */
  bot: [number, number];
  /** «Противник может ответить…» when the defenders have no Reaction: random between the two, ms. */
  pause: [number, number];
}

export interface TableRecord {
  options: GameOptions;
  actions: Action[];
  bots: Seat[];
  ready: Seat[];
  plans: string[] | null;
  concede: Seat[];
}

const randomIn = ([a, b]: [number, number]) => a + Math.random() * (b - a);

export class Table {
  state: GameState;
  readonly actions: Action[] = [];
  readonly logs: Record<LogKey, LogLine[]> = { ПИРАТЫ: [], КОМПАНИЯ: [], spectator: [], all: [] };
  readonly last: Partial<Record<LogKey, LastSeen>> = {};
  /** Seats played by bots now. */
  readonly bots = new Set<Seat>();
  /** Seats that pressed «Ход окончен» this turn. */
  readonly ready = new Set<Seat>();
  /** Plans of the Black Pearl given with her «Ход окончен». */
  plans: string[] | null = null;
  /** Seats whose players voted «Сдаться». */
  readonly concede = new Set<Seat>();

  private mem: BotMemory;
  private teamGen: { key: string; gen: Generator<Action, void, { state: GameState; error?: string }>; error?: string } | null = null;
  private shipBots: ShipBots = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private windowDeadline: { key: number; at: number } | null = null;
  private disposed = false;
  private totals: Record<Side, SideTotals> | null = null;

  constructor(
    readonly data: GameData,
    readonly options: GameOptions,
    readonly settings: RoomSettings,
    bots: Seat[],
    readonly delays: Delays,
    /** Called after every change: the room sends the new views and saves the game. */
    private readonly onChange: () => void,
    record?: Pick<TableRecord, 'actions' | 'ready' | 'plans' | 'concede'>,
  ) {
    for (const seat of bots) this.bots.add(seat);
    const created = createGame(data, { ...options, pauseEmptyWindows: true });
    this.state = created.state;
    for (const key of this.logKeys()) {
      const evs = eventsFor(created.state, this.viewerOf(key), created.events);
      this.logs[key].push(...describe(data, rewind(created.state, created.events), null, evs, -1));
    }
    this.mem = newBotMemory(options.seed ^ 0x2545f491);
    for (const action of record?.actions ?? []) this.apply(action, 'human');
    for (const seat of record?.ready ?? []) this.ready.add(seat);
    for (const seat of record?.concede ?? []) this.concede.add(seat);
    this.plans = record?.plans ?? null;
  }

  record(): TableRecord {
    return {
      options: this.options,
      actions: this.actions,
      bots: [...this.bots],
      ready: [...this.ready],
      plans: this.plans,
      concede: [...this.concede],
    };
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private logKeys(): LogKey[] {
    return this.settings.allOpen ? ['all'] : [...SIDES, 'spectator'];
  }

  private viewerOf(key: LogKey): Viewer {
    if (key === 'all') return 'all';
    if (key === 'spectator') return [];
    return Object.values(this.state.ships).filter((x) => x.side === key).map((x) => x.code);
  }

  /** The log a player with these seats reads. */
  keyOf(seats: readonly Seat[]): LogKey {
    if (this.settings.allOpen) return 'all';
    return seats.length > 0 ? this.state.ships[seats[0]].side : 'spectator';
  }

  /** What the player with `seats` gets: the view, the new log lines from `logFrom`, the last action. */
  infoFor(seats: readonly Seat[], logFrom: number): GameInfo {
    const key = this.keyOf(seats);
    const viewer: Viewer = this.settings.allOpen ? 'all' : seats;
    const log = this.logs[key];
    return {
      view: viewFor(this.state, viewer, { allyHands: this.settings.allyHands }),
      actions: this.actions.length,
      logFrom: Math.min(logFrom, log.length),
      log: log.slice(logFrom),
      last: this.last[key] ?? null,
      bots: [...this.bots],
      ready: [...this.ready],
      concede: [...this.concede],
      totals: this.state.winner ? (this.totals ??= matchTotals(this.data, { game: { ...this.options, pauseEmptyWindows: true }, players: { ПИРАТЫ: 'human', КОМПАНИЯ: 'human' }, openHands: false }, this.actions)) : null,
    };
  }

  // ——— Applying actions ———

  /** Applies an action to the game (the engine checks the rules: RuleError on a forbidden one). */
  private apply(action: Action, by: 'human' | 'bot'): GameEvent[] {
    const before = this.state;
    const turnBefore = `${before.round}:${before.active}`;
    const r = applyAction(before, action, this.data);
    const index = this.actions.length;
    this.state = r.state;
    this.actions.push(action);
    for (const key of this.logKeys()) {
      const viewer = this.viewerOf(key);
      const evs = eventsFor(r.state, viewer, r.events, { allyHands: this.settings.allyHands });
      const seen = redact(action, viewer, before);
      this.logs[key].push(...describe(this.data, before, seen, evs, index));
      this.last[key] = { action: seen, by, events: evs };
    }
    if (`${r.state.round}:${r.state.active}` !== turnBefore) {
      this.ready.clear();
      this.plans = null;
      this.shipBots = {};
    }
    if (r.state.winner) this.concede.clear();
    return r.events;
  }

  /** A player's action. Returns the refusal of the engine, or null. */
  act(action: Action): string | null {
    try {
      this.apply(action, 'human');
    } catch (e) {
      if (e instanceof RuleError) return e.message;
      throw e;
    }
    this.changed();
    return null;
  }

  // ——— «Ход окончен» of each seat ———

  setReady(seats: readonly Seat[], on: boolean, plans?: string[]): string | null {
    const s = this.state;
    if (s.winner) return 'Партия окончена';
    const side = s.ships[seats[0]].side;
    if (s.active !== side) return 'Сейчас ход противника';
    for (const seat of seats) {
      if (on) this.ready.add(seat);
      else this.ready.delete(seat);
    }
    if (on && plans && seats.some((x) => hasAbility(this.data, s.ships[x], ABILITY.madPlan))) this.plans = plans;
    this.changed();
    return null;
  }

  /** «Сдаться»: the team gives up when every human seat of it voted. */
  setConcede(seats: readonly Seat[], on: boolean): string | null {
    if (this.state.winner) return 'Партия окончена';
    for (const seat of seats) {
      if (on) this.concede.add(seat);
      else this.concede.delete(seat);
    }
    const side = this.state.ships[seats[0]].side;
    const humans = Object.values(this.state.ships).filter((x) => x.side === side && !this.bots.has(x.code)).map((x) => x.code);
    if (on && humans.every((x) => this.concede.has(x))) {
      this.apply({ type: 'concede', side }, 'human');
    }
    this.changed();
    return null;
  }

  // ——— Bots ———

  setBot(seat: Seat, on: boolean): void {
    if (on) this.bots.add(seat);
    else this.bots.delete(seat);
    delete this.shipBots[seat];
    this.teamGen = null;
    this.changed();
  }

  /** Both teams have people: only then the empty Reaction window pauses (bots do not read hands). */
  private peopleOnBothSides(): boolean {
    return SIDES.every((side) => Object.values(this.state.ships).some((x) => x.side === side && !this.bots.has(x.code)));
  }

  private teamSeats(side: Side): Seat[] {
    return seatsOf(this.state, side).map((x) => x.code);
  }

  private changed(): void {
    if (this.disposed) return;
    this.drive();
    this.onChange();
  }

  private later(ms: number, fn: () => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.disposed) return;
      try {
        fn();
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
      }
      this.changed();
    }, ms);
  }

  /** What the game waits for next: a bot's move, the end of a pause, the end of the turn. */
  private drive(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const s = this.state;
    if (s.winner) return;
    const p = s.pending;
    const d = decider(s)!;
    if (p?.kind === 'reactions') {
      if (p.waiting.length === 0) {
        const ms = this.peopleOnBothSides() ? randomIn(this.delays.pause) : 0;
        if (ms === 0) this.closeNow();
        else this.later(ms, () => this.apply({ type: 'closeWindow' }, 'bot'));
        return;
      }
      const bots = p.waiting.filter((x) => this.bots.has(x));
      if (bots.length > 0) {
        // A team of two bots answers as in the simulator; a bot next to a person answers for its own seat.
        const team = this.teamSeats(p.side).every((x) => this.bots.has(x));
        this.later(randomIn(this.delays.bot), () => this.answer(bots[0], team));
        return;
      }
      if (this.settings.reactionTimer > 0) {
        const key = this.actions.length;
        if (this.windowDeadline?.key !== key) this.windowDeadline = { key, at: Date.now() + this.settings.reactionTimer * 1000 };
        this.later(Math.max(0, this.windowDeadline.at - Date.now()), () => this.apply({ type: 'closeWindow' }, 'bot'));
      }
      return;
    }
    if (p) {
      // A choice — by its seat; «Джек ускользает» — by the Pearl's seat; «Тортуга» — by a team without people.
      const seat = p.kind === 'choice' ? p.waiting.find((x) => this.bots.has(x)) : d.seats.every((x) => this.bots.has(x)) ? d.seats[0] : undefined;
      if (seat) this.later(randomIn(this.delays.bot), () => this.answer(seat, p.kind !== 'choice'));
      return;
    }
    // The turn: people move at once; it ends when every person pressed «Ход окончен» (docs/TZ.md).
    const side = s.active;
    const seats = this.teamSeats(side);
    const humans = seats.filter((x) => !this.bots.has(x));
    if (humans.length === 0) {
      this.later(randomIn(this.delays.bot), () => this.teamBotStep());
      return;
    }
    if (!humans.every((x) => this.ready.has(x))) return;
    // A bot playing one ship moves after its human ally pressed «Ход окончен».
    const bot = seats.find((x) => this.bots.has(x) && !this.shipBots[x]?.done);
    if (bot) {
      this.later(randomIn(this.delays.bot), () => {
        const action = shipBotStep(this.shipBots, this.state, this.data, this.mem.rng, bot);
        if (!action) return;
        try {
          this.apply(action, 'bot');
        } catch (e) {
          if (!(e instanceof RuleError)) throw e;
          // A move sim.py allows and RULES.md does not: the bot skips it (RULES.md 21).
          refusedShipBot(this.shipBots, bot, e.message);
        }
      });
      return;
    }
    const plans = this.plans ?? Object.values(this.shipBots).find((r) => r.plans)?.plans;
    this.apply({ type: 'endTurn', side, plans }, 'human');
    this.drive();
  }

  /** A bot's answer to the pending decision for its seat; a refused answer is replaced by a safe one. */
  private answer(seat: Seat, team: boolean): void {
    const action = team ? botAnswer(this.state, this.data, this.mem) : seatAnswer(this.state, this.data, this.mem, seat);
    try {
      this.apply(action, 'bot');
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      const safe = fallbackAnswer(this.state, seat);
      if (!safe) throw e;
      this.apply(safe, 'bot');
    }
  }

  /** Closes an empty window at once (a game without people on one side): no pause, nothing to hide. */
  private closeNow(): void {
    this.apply({ type: 'closeWindow' }, 'bot');
    this.drive();
  }

  /** One move of a bot playing a whole team (the sim.py bot, as in LocalGame.botStep). */
  private teamBotStep(): void {
    const key = `${this.state.round}:${this.state.active}`;
    let next: IteratorResult<Action, void>;
    if (!this.teamGen || this.teamGen.key !== key) {
      this.teamGen = { key, gen: botTurn(this.state, this.data, this.mem.rng) };
      next = this.teamGen.gen.next();
    } else {
      next = this.teamGen.gen.next({ state: this.state, error: this.teamGen.error });
    }
    const gen = this.teamGen;
    gen.error = undefined;
    const action: Action = next.done ? { type: 'endTurn', side: this.state.active } : next.value;
    if (next.done) this.teamGen = null;
    try {
      this.apply(action, 'bot');
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      gen.error = e.message;
    }
  }
}

/** The action as a viewer may see it: cards passed, chosen or put into Plans are hidden from the enemy. */
function redact(action: Action, viewer: Viewer, before: GameState): Action {
  if (viewer === 'all') return action;
  const ally = (side: Side) => viewer.some((v) => before.ships[v]?.side === side);
  const sees = (seat: string) => ally(before.ships[seat].side);
  switch (action.type) {
    case 'pass':
      return sees(action.seat) ? action : { ...action, card: HIDDEN };
    case 'choose':
      return sees(action.seat) ? action : { ...action, cards: action.cards.map(() => HIDDEN) };
    case 'endTurn':
      return action.plans && !ally(action.side) ? { ...action, plans: action.plans.map(() => HIDDEN) } : action;
    default:
      return action;
  }
}
