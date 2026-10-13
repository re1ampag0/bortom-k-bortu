// A game on one device (docs/TZ.md, «Транспорт»: the local transport). It keeps the real state, the record of
// actions, the log, Undo and the bots; the interface reads the state only through viewFor. Stage 8 adds a WebSocket
// transport with the same role.
import { botAnswer, botTurn, newBotMemory, type BotMemory } from '../engine/ai/bot';
import { applyAction, createGame } from '../engine/engine';
import { decider, type Decider } from '../engine/hints';
import { describe, rewind, type LogLine } from '../engine/log';
import { makeRecord, revealsInfo, type MatchRecord, type MatchSetup } from '../engine/match';
import { RuleError, type Action, type GameEvent, type GameState } from '../engine/state';
import type { GameData, Side } from '../engine/types';

interface UndoPoint {
  state: GameState;
  actions: number;
  log: number;
}

/** What the last applied action was, for the interface: who made it and what happened. */
export interface LastAction {
  action: Action;
  by: 'human' | 'bot';
  events: GameEvent[];
  before: GameState;
}

const NOTHING_TO_UNDO = 'Нечего отменять: в этом ходу вы ещё ничего не сделали';

export class LocalGame {
  readonly kind = 'local' as const;
  state: GameState;
  readonly actions: Action[] = [];
  readonly log: LogLine[] = [];
  last: LastAction | null = null;
  /** The last actions with their numbers, for the show of each one on the table (ui/game/show.ts). */
  recent: { n: number; action: Action; by: 'human' | 'bot'; events: GameEvent[] }[] = [];
  /** Grows with every change: the interface re-renders by it. */
  version = 0;
  /** Why Undo is not possible now (when the stack is empty). */
  undoReason: string = NOTHING_TO_UNDO;

  private undoStack: UndoPoint[] = [];
  private undoSide: Side | null = null;
  private mem: BotMemory;
  private gen: Generator<Action, void, { state: GameState; error?: string }> | null = null;
  private genTurn = '';
  private genError: string | undefined;
  private listeners = new Set<() => void>();

  constructor(
    readonly data: GameData,
    readonly setup: MatchSetup,
    actions: Action[] = [],
  ) {
    const created = createGame(data, setup.game);
    this.state = created.state;
    this.log.push(...describe(data, rewind(created.state, created.events), null, created.events, -1));
    // The same bot memory as the simulator (sim.ts playGame): a bot match plays the same game as `npm run sim`.
    this.mem = newBotMemory(setup.game.seed ^ 0x2545f491);
    for (const action of actions) this.apply(action);
    this.undoStack = [];
  }

  static fromRecord(data: GameData, record: MatchRecord): LocalGame {
    return new LocalGame(data, record.setup, record.actions);
  }

  record(): MatchRecord {
    return makeRecord(this.data, this.setup, this.actions);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  decider(): Decider | null {
    return decider(this.state);
  }

  isBot(side: Side): boolean {
    return this.setup.players[side] === 'bot';
  }

  /** The game waits for a bot. */
  botToMove(): boolean {
    const d = this.decider();
    return !!d && this.isBot(d.side);
  }

  private apply(action: Action, by: 'human' | 'bot' = 'human'): GameEvent[] {
    const before = this.state;
    const r = applyAction(before, action, this.data);
    const index = this.actions.length;
    this.state = r.state;
    this.actions.push(action);
    this.log.push(...describe(this.data, before, action, r.events, index));
    this.recent = [...this.recent.slice(-9), { n: index, action, by, events: r.events }];
    return r.events;
  }

  /** A human's move. Returns the engine's refusal, or null when the action was applied. */
  act(action: Action): string | null {
    const d = this.decider();
    if (!d) return 'Партия окончена';
    if (this.isBot(d.side) && action.type !== 'concede') return 'Сейчас решает бот';
    const before = this.state;
    const point: UndoPoint = { state: before, actions: this.actions.length, log: this.log.length };
    let events: GameEvent[];
    try {
      events = this.apply(action);
    } catch (e) {
      if (e instanceof RuleError) return e.message;
      throw e;
    }
    if (this.undoSide !== d.side) {
      this.undoStack = [];
      this.undoReason = NOTHING_TO_UNDO;
    }
    this.undoSide = d.side;
    const reveal = revealsInfo(before, this.state, events, d.side);
    if (reveal) {
      this.undoStack = [];
      this.undoReason = `Отменить нельзя: ${reveal}`;
    } else {
      this.undoStack.push(point);
    }
    this.last = { action, by: 'human', events, before };
    this.changed();
    return null;
  }

  /** Why Undo is not possible for the side now, or null. */
  undoRefusal(side: Side | null): string | null {
    if (side === null || this.undoSide !== side) return NOTHING_TO_UNDO;
    return this.undoStack.length > 0 ? null : this.undoReason;
  }

  undo(): boolean {
    const point = this.undoStack.pop();
    if (!point) return false;
    this.state = point.state;
    this.actions.length = point.actions;
    this.log.length = point.log;
    this.last = null;
    this.recent = this.recent.filter((x) => x.n < point.actions);
    if (this.undoStack.length === 0) this.undoReason = NOTHING_TO_UNDO;
    this.changed();
    return true;
  }

  /**
   * One move of a bot, if the game waits for a bot: an answer to a pending decision (botAnswer) or the next action of
   * the bot's turn (botTurn), driven as in sim.ts playGame. Returns false when it is not a bot's move.
   */
  botStep(): boolean {
    const d = this.decider();
    if (!d || !this.isBot(d.side)) return false;
    this.undoStack = [];
    this.undoReason = 'Отменить нельзя: ходил бот';
    this.undoSide = null;
    const before = this.state;
    if (this.state.pending) {
      const action = botAnswer(this.state, this.data, this.mem);
      const events = this.apply(action, 'bot');
      this.last = { action, by: 'bot', events, before };
      this.changed();
      return true;
    }
    const key = `${this.state.round}:${this.state.active}`;
    let next: IteratorResult<Action, void>;
    if (!this.gen || this.genTurn !== key) {
      this.gen = botTurn(this.state, this.data, this.mem.rng);
      this.genTurn = key;
      next = this.gen.next();
    } else {
      next = this.gen.next({ state: this.state, error: this.genError });
    }
    this.genError = undefined;
    // A bot always ends its turn; this only guards against a bot that stops early.
    const action: Action = next.done ? { type: 'endTurn', side: this.state.active } : next.value;
    if (next.done) this.gen = null;
    try {
      const events = this.apply(action, 'bot');
      this.last = { action, by: 'bot', events, before };
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      // A move sim.py allows and RULES.md does not: the bot skips it (RULES.md 21).
      this.genError = e.message;
    }
    this.changed();
    return true;
  }
}
