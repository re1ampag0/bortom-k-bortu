// Messages between the browser and the game server (docs/TZ.md, «Мультиплеер»). JSON over a WebSocket at /ws.
// Shared by the client (src/net/ws.ts) and the server (server/); no Node or browser API here.
import type { LogLine } from '../engine/log';
import type { SideTotals } from '../engine/match';
import type { Action, GameEvent, GameState, Variant } from '../engine/state';
import type { Side } from '../engine/types';

/** A seat is a ship code: «Ж», «М», «И», «Г». */
export type Seat = string;

export interface RoomSettings {
  variant: Variant;
  sea: boolean;
  legends: boolean;
  /** «Союзники видят руки друг друга» (on by default). */
  allyHands: boolean;
  /** «Всё открыто» — for tests: every hand is seen by everybody. */
  allOpen: boolean;
  /** «Разрешить подсказки»: each player turns them on or off for themselves. */
  hints: boolean;
  /** Seconds the Reaction window waits at most; 0 — no timer (the default). */
  reactionTimer: number;
  /** A fixed seed (tests, repeating a game); null — random. */
  seed: number | null;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  variant: 'standard',
  sea: true,
  legends: true,
  allyHands: true,
  allOpen: false,
  hints: true,
  reactionTimer: 0,
  seed: null,
};

export interface SeatInfo {
  /** The player sitting there, or null. */
  player: string | null;
  name: string | null;
  /** A bot plays the seat (from the start, or replacing a player who left). */
  bot: boolean;
  /** The player is connected. */
  online: boolean;
  /** A bot plays for a player who left; the player takes the seat back when they return. */
  replaced: boolean;
}

export type Phase = 'lobby' | 'placement' | 'game';

export interface RoomInfo {
  code: string;
  phase: Phase;
  creator: string;
  creatorOnline: boolean;
  settings: RoomSettings;
  seats: Record<Seat, SeatInfo>;
  /** Names of the players without a seat. */
  spectators: string[];
  you: { id: string; name: string; seats: Seat[]; creator: boolean };
  /** The coin's verdict in words. */
  coin: string | null;
  /** Teams that finished the secret placement. */
  placed: Side[];
}

/** The last action as the player may see it: for the toast «Ход Пиратов: …» and the highlights. */
export interface LastSeen {
  action: Action;
  by: 'human' | 'bot';
  events: GameEvent[];
}

export interface GameInfo {
  view: GameState;
  /** Number of actions applied: the client knows from it that something happened. */
  actions: number;
  /** New log lines start at this index of the player's log. */
  logFrom: number;
  log: LogLine[];
  last: LastSeen | null;
  /** The last few actions with their numbers (the table shows each one; a message may carry several). */
  recent: (LastSeen & { n: number })[];
  /** Seats played by bots now. */
  bots: Seat[];
  /** Seats that pressed «Ход окончен» this turn. */
  ready: Seat[];
  /** Seats whose players voted «Сдаться». */
  concede: Seat[];
  /** Damage and Powder of each team, when the game is over. */
  totals: Record<Side, SideTotals> | null;
}

export type ClientMsg = { id?: number } & (
  | { t: 'hello'; token: string }
  | { t: 'create'; name: string; settings?: Partial<RoomSettings> }
  | { t: 'join'; code: string; name: string }
  | { t: 'sit'; seat: Seat }
  | { t: 'stand'; seat: Seat }
  | { t: 'bot'; seat: Seat; on: boolean }
  | { t: 'settings'; settings: Partial<RoomSettings> }
  | { t: 'coin' }
  | { t: 'start' }
  | { t: 'place'; side: Side; positions: [string, string] }
  | { t: 'act'; action: Action }
  | { t: 'ready'; plans?: string[] }
  | { t: 'unready' }
  | { t: 'concede'; on: boolean }
  | { t: 'remind' }
  | { t: 'replace'; seat: Seat }
  | { t: 'leave' }
  | { t: 'ping' }
);

export type ServerMsg =
  | { t: 'welcome'; token: string; player: string }
  | { t: 'room'; room: RoomInfo }
  | { t: 'game'; game: GameInfo }
  | { t: 'refused'; id?: number; reason: string }
  | { t: 'reminded'; by: string }
  | { t: 'left' }
  | { t: 'error'; id?: number; message: string }
  | { t: 'pong' };

/** Room codes: 5 characters without the look-alikes 0/O and 1/I. */
export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

export function normalizeCode(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}
