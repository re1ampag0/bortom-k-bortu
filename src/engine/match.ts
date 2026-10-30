// A game record: the options and the list of actions. The game is replayed from it exactly (docs/TZ.md,
// «Архитектура»: seed + actions), so the record is enough for saving, loading, the autosave and Undo.
import { applyAction, createGame, type GameOptions } from './engine';
import type { Action, GameEvent, GameState } from './state';
import type { GameData, Side } from './types';

export type Controller = 'human' | 'bot';

export interface MatchSetup {
  game: GameOptions;
  /** Who plays each team on this screen (stage 7: a whole team is a human or a bot). */
  players: Record<Side, Controller>;
  /** «Открытые руки»: all hands are seen, no hand-over screens. */
  openHands: boolean;
  /**
   * «Подсказки»: damage of each Charge and on the targets, the green «Ход окончен», «Залп не дан…». Off — «как за
   * столом», the default; records without the field play without hints.
   */
  hints?: boolean;
  /**
   * A preset of the admin page: the game is played on its data, kept in the record so «Загрузить партию» replays it
   * exactly. Absent — the main data of the site.
   */
  preset?: { name: string; data: Record<string, unknown> };
}

export interface MatchRecord {
  format: 'bortom-k-bortu/match';
  version: 1;
  dataVersion: string;
  setup: MatchSetup;
  actions: Action[];
}

export interface ReplayStep {
  before: GameState;
  action: Action | null;
  events: GameEvent[];
  after: GameState;
}

/** Replays a record step by step; `onStep` gets every state (index -1 — the game as created). */
export function replay(data: GameData, setup: MatchSetup, actions: Action[], onStep?: (step: ReplayStep, index: number) => void): GameState {
  const created = createGame(data, setup.game);
  let state = created.state;
  onStep?.({ before: state, action: null, events: created.events, after: state }, -1);
  actions.forEach((action, i) => {
    const r = applyAction(state, action, data);
    onStep?.({ before: state, action, events: r.events, after: r.state }, i);
    state = r.state;
  });
  return state;
}

export function makeRecord(data: GameData, setup: MatchSetup, actions: Action[]): MatchRecord {
  return { format: 'bortom-k-bortu/match', version: 1, dataVersion: data.version, setup, actions };
}

/** Checks a loaded file; throws an Error in Russian if it is not a game record. */
export function parseRecord(json: unknown): MatchRecord {
  const r = json as Partial<MatchRecord>;
  if (!r || r.format !== 'bortom-k-bortu/match' || r.version !== 1) throw new Error('Это не файл партии «Бортом к борту»');
  if (!r.setup?.game || typeof r.setup.game.seed !== 'number' || !Array.isArray(r.actions)) throw new Error('Файл партии повреждён');
  return r as MatchRecord;
}

/**
 * New information the action opened, or null: Undo may not go back over it (docs/TZ.md, «Интерфейс → Undo»):
 * a draw, a look at a deck, chance, a decision the other team now has to make.
 */
export function revealsInfo(before: GameState, after: GameState, events: GameEvent[], side: Side): string | null {
  for (const e of events) {
    switch (e.type) {
      case 'drew':
        return 'добраны карты';
      case 'deckReshuffled':
        return 'колода перемешана';
      case 'seaRevealed':
      case 'seaLooked':
        return 'открылись карты моря';
      case 'shown':
        return 'открылась рука противника';
      case 'stolen':
        return 'взята случайная карта';
      case 'dice':
        return 'кости вскрыты';
      case 'turnEnded':
        return 'ход окончен';
      case 'gameOver':
        return 'партия окончена';
    }
  }
  if (after.rng !== before.rng) return 'сработала случайность';
  const p = after.pending;
  if (p?.kind === 'choice' && p.options.length > 0) return 'открылись карты';
  if (p?.kind === 'reactions' && p.side !== side) return 'противник решает, ответить ли Реакцией';
  if (p?.kind === 'choice' && p.waiting.some((seat) => after.ships[seat].side !== side)) return 'выбирает противник';
  return null;
}

export interface SideTotals {
  /** Damage dealt to the enemy's ships. */
  damage: number;
  income: number;
  spent: number;
}

/** Damage and Powder of each team over the game, for the end screen. */
export function matchTotals(data: GameData, setup: MatchSetup, actions: Action[]): Record<Side, SideTotals> {
  const t: Record<Side, SideTotals> = { ПИРАТЫ: { damage: 0, income: 0, spent: 0 }, КОМПАНИЯ: { damage: 0, income: 0, spent: 0 } };
  replay(data, setup, actions, ({ before, events }) => {
    for (const e of events) {
      if (e.type === 'damage') {
        const hurt = before.ships[e.ship].side;
        t[hurt === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ'].damage += e.amount + e.toHull;
      }
      if (e.type === 'powderGained') t[e.side].income += e.amount;
      if (e.type === 'powderSpent') t[e.side].spent += e.amount;
    }
  });
  return t;
}
