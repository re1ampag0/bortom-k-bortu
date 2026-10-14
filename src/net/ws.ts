// The network transport (docs/TZ.md, «Транспорт»): a WebSocket to the game server. NetClient keeps the connection,
// the token of the player's seat and the room; NetGame is the game for the table, with the same role as LocalGame
// but with only the player's view. The connection comes back by itself: after a phone slept or Safari was in the
// background, on `visibilitychange`, `pageshow` and `online` the client reconnects at once with the same token.
import { decider, type Decider } from '../engine/hints';
import type { LogLine } from '../engine/log';
import type { MatchRecord } from '../engine/match';
import type { MatchSetup, SideTotals } from '../engine/match';
import type { Action, GameEvent, GameState } from '../engine/state';
import type { GameData, Side } from '../engine/types';
import type { ChargeOffer, ClientMsg, GameInfo, RoomInfo, RoomSettings, Seat, ServerMsg } from './protocol';

const KEY = 'bortom-k-bortu.net';
/** Without a connection for this long the player is told the server is gone (a laptop asleep, another network). */
export const LOST_MS = 10_000;
/** The client pings the server this often… */
const PING_MS = 5_000;
/** …and a connection silent for this long is dead (a phone woke up with a half-open socket, the network is gone). */
const DEAD_MS = 12_000;

export interface NetSaved {
  url: string;
  token: string;
  code: string;
  name: string;
  /** Log lines the player has seen: «Пока вас не было» after a reload shows the rest. */
  seen: number;
}

export function loadNetSaved(): NetSaved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as NetSaved | null;
    return s && s.token && s.url ? s : null;
  } catch {
    return null;
  }
}

function storeNetSaved(s: NetSaved | null): void {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    // Without storage a reload loses the seat; the creator can give it to a bot.
  }
}

/** The player's name, remembered between games. */
export function loadName(): string {
  try {
    return localStorage.getItem(`${KEY}.name`) ?? '';
  } catch {
    return '';
  }
}

export function storeName(name: string): void {
  try {
    localStorage.setItem(`${KEY}.name`, name);
  } catch {
    // A convenience only.
  }
}

export type Connection = 'connecting' | 'online' | 'offline';

export class NetClient {
  connection: Connection = 'connecting';
  /** When the connection was lost (for «Сервер недоступен» after 10 s), or null. */
  lostAt: number | null = null;
  room: RoomInfo | null = null;
  game: NetGame | null = null;
  /** The last error of the server or of the connection, in Russian. */
  error: { n: number; text: string } | null = null;
  /** «Напомнить» from another player. */
  reminded: { n: number; by: string } | null = null;
  version = 0;

  private ws: WebSocket | null = null;
  private listeners = new Set<() => void>();
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private nextId = 1;
  private saved: NetSaved | null;
  private queue: ClientMsg[] = [];
  private everOnline = false;
  private heard = Date.now();

  constructor(
    readonly data: GameData,
    readonly url: string,
    saved: NetSaved | null = null,
  ) {
    this.saved = saved && saved.url === url ? saved : null;
    this.connect();
    window.addEventListener('visibilitychange', this.wake);
    window.addEventListener('pageshow', this.wake);
    window.addEventListener('online', this.wake);
    this.pingTimer = setInterval(() => this.ping(), PING_MS);
  }

  get code(): string | null {
    return this.room?.code ?? this.saved?.code ?? null;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  changed(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  /** The page is back (Safari from the background, the screen unlocked, the network back): reconnect now. */
  private wake = () => {
    if (document.visibilityState === 'hidden' || this.closed) return;
    // Back from the background with nothing heard for a while: the socket is most likely dead — start again at once.
    const stale = Date.now() - this.heard > PING_MS + 1000;
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING || stale) {
      this.retry = 0;
      this.connect();
    } else {
      this.ping();
    }
  };

  private ping(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    if (Date.now() - this.heard > DEAD_MS) {
      // Nothing came back: the socket is dead even if the browser has not noticed. Start again.
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
      this.dropped();
      return;
    }
    this.ws.send(JSON.stringify({ t: 'ping' }));
  }

  private connect(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.game?.lostConnection();
    }
    this.connection = this.everOnline ? 'offline' : 'connecting';
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.dropped();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.heard = Date.now();
      this.connection = 'online';
      this.everOnline = true;
      this.retry = 0;
      if (this.saved) ws.send(JSON.stringify({ t: 'hello', token: this.saved.token }));
      for (const m of this.queue.splice(0)) ws.send(JSON.stringify(m));
      this.changed();
    };
    ws.onmessage = (e) => this.receive(JSON.parse(String(e.data)) as ServerMsg);
    ws.onclose = () => this.dropped();
    ws.onerror = () => {};
    this.changed();
  }

  private dropped(): void {
    if (this.closed) return;
    this.connection = this.everOnline ? 'offline' : 'connecting';
    this.lostAt ??= Date.now();
    this.game?.lostConnection();
    // 0.5 s, 1 s, 2 s, 4 s, then every 5 s; at once when the page comes back (wake).
    const ms = Math.min(5000, 500 * 2 ** this.retry++);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.connect(), ms);
    this.changed();
  }

  close(): void {
    this.closed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    window.removeEventListener('visibilitychange', this.wake);
    window.removeEventListener('pageshow', this.wake);
    window.removeEventListener('online', this.wake);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
  }

  /** Gets the record of «Скачать партию» (asked with { t: 'record' }). */
  onRecord: ((record: MatchRecord) => void) | null = null;

  send(msg: ClientMsg): number {
    const id = this.nextId++;
    const m = { ...msg, id } as ClientMsg;
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
    else if (msg.t !== 'ping') this.queue.push(m);
    return id;
  }

  create(name: string, settings?: Partial<RoomSettings>): void {
    storeName(name);
    this.send({ t: 'create', name, settings });
  }

  join(code: string, name: string): void {
    storeName(name);
    this.send({ t: 'join', code, name });
  }

  leave(): void {
    this.send({ t: 'leave' });
    this.forget();
  }

  private forget(): void {
    this.saved = null;
    storeNetSaved(null);
    this.room = null;
    this.game = null;
    this.changed();
  }

  /** Remembers how much of the log the player has seen (for «Пока вас не было» after a reload). */
  markSeen(n: number): void {
    if (this.saved && this.saved.seen !== n) {
      this.saved.seen = n;
      storeNetSaved(this.saved);
    }
  }

  private receive(msg: ServerMsg): void {
    this.heard = Date.now();
    if (msg.t !== 'pong' && msg.t !== 'game') this.lostAt = null;
    switch (msg.t) {
      case 'pong':
        this.lostAt = null;
        return;
      case 'welcome': {
        const seen = this.saved?.token === msg.token ? this.saved.seen : 0;
        this.saved = { url: this.url, token: msg.token, code: this.saved?.code ?? '', name: this.saved?.name ?? loadName(), seen };
        storeNetSaved(this.saved);
        break;
      }
      case 'room':
        // «Реванш» began the next game of the room: a new table, its log from the start.
        if (this.room && this.room.match !== msg.room.match) {
          this.game = null;
          if (this.saved) {
            this.saved = { ...this.saved, seen: 0 };
            storeNetSaved(this.saved);
          }
        }
        this.room = msg.room;
        if (this.saved) {
          this.saved = { ...this.saved, code: msg.room.code, name: msg.room.you.name };
          storeNetSaved(this.saved);
        }
        this.game?.roomChanged(msg.room);
        break;
      case 'game':
        this.lostAt = null;
        if (!this.game || !this.room) this.game = new NetGame(this, this.data, msg.game, this.room!, this.saved?.seen ?? null);
        else this.game.update(msg.game);
        break;
      case 'record':
        this.onRecord?.(msg.record);
        this.onRecord = null;
        break;
      case 'left':
        this.forget();
        return;
      case 'refused':
        if (this.game) this.game.refused(msg.reason);
        else this.error = { n: (this.error?.n ?? 0) + 1, text: msg.reason };
        break;
      case 'error':
        this.error = { n: (this.error?.n ?? 0) + 1, text: msg.message };
        this.game?.refused(msg.message);
        break;
      case 'reminded':
        this.reminded = { n: (this.reminded?.n ?? 0) + 1, by: msg.by };
        break;
    }
    this.changed();
  }
}

/** A network game for the table: the player's view, the log, who is a bot, «Ход окончен» of each seat. */
export class NetGame {
  readonly kind = 'net' as const;
  state: GameState;
  log: LogLine[] = [];
  last: { by: 'human' | 'bot'; events: GameEvent[]; action: Action } | null = null;
  recent: GameInfo['recent'] = [];
  actions = 0;
  bots: Seat[] = [];
  ready: Seat[] = [];
  concede: Seat[] = [];
  /** The captains' offers of a Charge for the ally's Volley (only the player's team). */
  offers: ChargeOffer[] = [];
  totals: Record<Side, SideTotals> | null = null;
  /** The last refusal of the server: the table shows it as the engine's refusal on one screen. */
  refusal: { n: number; text: string } | null = null;
  /** Log lines the player missed while away (a reload, the connection lost), for «Пока вас не было». */
  missed: LogLine[] = [];
  private seenAtLoss: number | null;
  private lostTime = 0;

  constructor(
    readonly client: NetClient,
    readonly data: GameData,
    info: GameInfo,
    public room: RoomInfo,
    seenBefore: number | null,
  ) {
    this.state = info.view;
    this.seenAtLoss = seenBefore;
    this.update(info);
  }

  get version(): number {
    return this.client.version;
  }

  subscribe(listener: () => void): () => void {
    return this.client.subscribe(listener);
  }

  /** The setup as the table reads it: who is a person on each side. */
  get setup(): MatchSetup {
    const people = (side: Side) =>
      Object.entries(this.room.seats).some(([code, x]) => this.state.ships[code].side === side && !this.bots.includes(code) && x.player);
    return {
      game: { seed: 0, variant: this.state.variant },
      players: { ПИРАТЫ: people('ПИРАТЫ') ? 'human' : 'bot', КОМПАНИЯ: people('КОМПАНИЯ') ? 'human' : 'bot' },
      openHands: this.room.settings.allOpen,
      hints: this.room.settings.hints,
    };
  }

  update(info: GameInfo): void {
    if (info.logFrom === 0) this.log = [...info.log];
    else this.log = [...this.log.slice(0, info.logFrom), ...info.log];
    // Away for a moment (a blip of Wi-Fi) is not «away»: the lines are simply shown on the table.
    const away = this.lostTime === 0 || Date.now() - this.lostTime > 3000;
    if (this.seenAtLoss !== null && this.seenAtLoss > 0 && away && this.log.length > this.seenAtLoss) this.missed = this.log.slice(this.seenAtLoss);
    this.seenAtLoss = null;
    this.lostTime = 0;
    this.state = info.view;
    this.actions = info.actions;
    this.last = info.last;
    this.recent = info.recent ?? [];
    this.bots = info.bots;
    this.ready = info.ready;
    this.concede = info.concede;
    this.offers = info.offers ?? [];
    this.totals = info.totals;
  }

  roomChanged(room: RoomInfo): void {
    this.room = room;
  }

  lostConnection(): void {
    if (this.seenAtLoss !== null) return;
    this.seenAtLoss = this.log.length;
    this.lostTime = Date.now();
  }

  /** «Пока вас не было» was read. */
  clearMissed(): void {
    this.missed = [];
    this.client.markSeen(this.log.length);
    this.client.changed();
  }

  refused(text: string): void {
    this.refusal = { n: (this.refusal?.n ?? 0) + 1, text };
  }

  /** Seats the player plays now (not given to a bot). */
  get seats(): Seat[] {
    return this.room.you.seats.filter((x) => !this.bots.includes(x));
  }

  get side(): Side | null {
    const seat = this.room.you.seats[0];
    return seat ? this.state.ships[seat].side : null;
  }

  isBotSeat(seat: Seat): boolean {
    return this.bots.includes(seat);
  }

  /** People's names by seat. */
  nameOf(seat: Seat): string | null {
    const x = this.room.seats[seat];
    return x && !this.bots.includes(seat) ? x.name : null;
  }

  decider(): Decider | null {
    return decider(this.state);
  }

  /** Sends the action; a refusal comes back later (see refusal). */
  act(action: Action): string | null {
    this.client.send({ t: 'act', action });
    return null;
  }

  setReady(on: boolean, plans?: string[]): void {
    this.client.send(on ? { t: 'ready', plans } : { t: 'unready' });
  }

  voteConcede(on: boolean): void {
    this.client.send({ t: 'concede', on });
  }

  /** The captain of `seat` offers the Charge `card` for the ally's Volley (the ally fires and decides). */
  offer(seat: Seat, card: string): void {
    this.client.send({ t: 'offer', seat, card });
  }

  unoffer(seat: Seat): void {
    this.client.send({ t: 'unoffer', seat });
  }

  remind(): void {
    this.client.send({ t: 'remind' });
  }

  replace(seat: Seat): void {
    this.client.send({ t: 'replace', seat });
  }

  /** «Реванш» after the end: this player agrees (or takes it back). */
  voteRematch(on: boolean): void {
    this.client.send({ t: 'rematch', on });
  }

  /** «Скачать партию»: the server sends the record after the end of the game. */
  requestRecord(then: (record: MatchRecord) => void): void {
    this.client.onRecord = then;
    this.client.send({ t: 'record' });
  }
}
