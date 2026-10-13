// Rooms (docs/TZ.md, «Мультиплеер»): a code of 5 characters, players with tokens, seats (ships), bots, the coin,
// the secret placement and the game. A room is saved after every change and removed after 24 hours without one.
import type { MatchRecord } from '../src/engine/match';
import type { GameOptions } from '../src/engine/engine';
import { decider } from '../src/engine/hints';
import type { Rng } from '../src/engine/rng';
import type { GameData, Side } from '../src/engine/types';
import {
  CODE_CHARS,
  CODE_LENGTH,
  DEFAULT_ROOM_SETTINGS,
  type ClientMsg,
  type Phase,
  type RoomInfo,
  type RoomSettings,
  type Seat,
} from '../src/net/protocol';
import { refusal } from './permissions';
import { Table, type Delays, type TableRecord } from './table';

const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];
const SIDE_ACC: Record<Side, string> = { ПИРАТЫ: 'Пиратов', КОМПАНИЯ: 'Компанию' };
/** «Напомнить» — not more often than this. */
const REMIND_MS = 10_000;
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export interface Player {
  id: string;
  name: string;
  token: string;
  /** Open connections of the player; 0 — offline. */
  conns: number;
  lastRemind: number;
}

interface SeatState {
  player: string | null;
  bot: boolean;
  /** A bot plays for the player who left; they take the seat back when they return. */
  replaced: boolean;
}

export interface RoomRecord {
  format: 'bortom-k-bortu/room';
  version: 1;
  code: string;
  created: number;
  updated: number;
  creator: string;
  settings: RoomSettings;
  phase: Phase;
  players: Omit<Player, 'conns' | 'lastRemind'>[];
  seats: Record<Seat, SeatState>;
  placement: Partial<Record<Side, [string, string]>>;
  coin: string | null;
  game: TableRecord | null;
  /** The number of the game in the room (absent in rooms saved before «Реванш»). */
  match?: number;
}

/** What the room tells the server: something changed (save and send), a reminder for players. */
export interface RoomHooks {
  changed(room: Room): void;
  remind(room: Room, players: string[], by: string): void;
}

export class Room {
  updated: number;
  readonly players = new Map<string, Player>();
  readonly seats: Record<Seat, SeatState> = {};
  placement: Partial<Record<Side, [string, string]>> = {};
  coin: string | null = null;
  phase: Phase = 'lobby';
  table: Table | null = null;
  /** The number of the game in the room: «Реванш» starts the next one. */
  match = 1;
  /** People who agreed to «Реванш» after the end of the game. */
  private rematch = new Set<string>();
  /** «Реванш»: a new seed even if the room fixed one. */
  private freshSeed = false;

  constructor(
    readonly data: GameData,
    readonly code: string,
    public creator: string,
    public settings: RoomSettings,
    readonly created: number,
    private readonly rng: Rng,
    private readonly delays: Delays,
    private readonly hooks: RoomHooks,
  ) {
    this.updated = created;
    for (const ship of data.ships) this.seats[ship.code] = { player: null, bot: false, replaced: false };
  }

  // ——— Saving ———

  toRecord(): RoomRecord {
    return {
      format: 'bortom-k-bortu/room',
      version: 1,
      code: this.code,
      created: this.created,
      updated: this.updated,
      creator: this.creator,
      settings: this.settings,
      phase: this.phase,
      players: [...this.players.values()].map(({ id, name, token }) => ({ id, name, token })),
      seats: this.seats,
      placement: this.placement,
      coin: this.coin,
      game: this.table?.record() ?? null,
      match: this.match,
    };
  }

  static fromRecord(data: GameData, r: RoomRecord, rng: Rng, delays: Delays, hooks: RoomHooks): Room {
    const room = new Room(data, r.code, r.creator, { ...DEFAULT_ROOM_SETTINGS, ...r.settings }, r.created, rng, delays, hooks);
    room.updated = r.updated;
    for (const p of r.players) room.players.set(p.id, { ...p, conns: 0, lastRemind: 0 });
    Object.assign(room.seats, r.seats);
    room.placement = r.placement ?? {};
    room.coin = r.coin;
    room.phase = r.phase;
    room.match = r.match ?? 1;
    if (r.game) room.table = room.newTable(r.game.options, r.game);
    return room;
  }

  dispose(): void {
    this.table?.dispose();
  }

  private newTable(options: GameOptions, record?: TableRecord): Table {
    const bots = Object.keys(this.seats).filter((x) => this.seats[x].bot);
    return new Table(this.data, options, this.settings, bots, this.delays, () => this.changed(), record);
  }

  private changed(): void {
    this.updated = Date.now();
    this.hooks.changed(this);
  }

  // ——— What a player sees ———

  seatsOf(playerId: string): Seat[] {
    return Object.keys(this.seats).filter((x) => this.seats[x].player === playerId);
  }

  /** Seats the player plays now (not given to a bot). */
  playing(playerId: string): Seat[] {
    return this.seatsOf(playerId).filter((x) => !this.seats[x].bot);
  }

  sideOf(seat: Seat): Side {
    return this.data.ships.find((x) => x.code === seat)!.side;
  }

  info(playerId: string): RoomInfo {
    const me = this.players.get(playerId)!;
    const seats: RoomInfo['seats'] = {};
    for (const [code, x] of Object.entries(this.seats)) {
      const p = x.player ? this.players.get(x.player) : undefined;
      seats[code] = { player: x.player, name: p?.name ?? null, bot: x.bot, online: !!p && p.conns > 0, replaced: x.replaced };
    }
    const seated = new Set(Object.values(this.seats).map((x) => x.player));
    return {
      code: this.code,
      phase: this.phase,
      creator: this.creator,
      creatorOnline: (this.players.get(this.creator)?.conns ?? 0) > 0,
      settings: this.settings,
      seats,
      spectators: [...this.players.values()].filter((p) => !seated.has(p.id)).map((p) => p.name),
      you: { id: me.id, name: me.name, seats: this.seatsOf(playerId), creator: this.creator === playerId },
      coin: this.coin,
      placed: SIDES.filter((side) => this.placement[side]),
      match: this.match,
      rematch: this.rematchOpen() ? { agreed: this.rematchPeople().filter((p) => this.rematch.has(p)).length, need: this.rematchPeople().length, you: this.rematch.has(playerId) } : null,
    };
  }

  // ——— Players come and go ———

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.changed();
  }

  /** A player connected: they take back seats a bot played for them. */
  connected(playerId: string): void {
    const p = this.players.get(playerId);
    if (!p) return;
    p.conns++;
    for (const seat of this.seatsOf(playerId)) {
      if (!this.seats[seat].replaced) continue;
      this.seats[seat].bot = false;
      this.seats[seat].replaced = false;
      this.table?.setBot(seat, false);
    }
    this.changed();
  }

  disconnected(playerId: string): void {
    const p = this.players.get(playerId);
    if (!p) return;
    p.conns = Math.max(0, p.conns - 1);
    this.changed();
  }

  // ——— Messages ———

  /** Handles a message of a player in the room. Returns the refusal in Russian, or null. */
  handle(playerId: string, msg: ClientMsg): string | null {
    const creator = this.creator === playerId;
    const lobby = this.phase === 'lobby';
    switch (msg.t) {
      case 'sit': {
        if (!lobby) return 'Партия уже началась: можно только смотреть';
        const seat = this.seats[msg.seat];
        if (!seat) return 'Нет такого корабля';
        if (seat.player === playerId) return null;
        if (seat.player || seat.bot) return 'Место занято';
        const mine = this.seatsOf(playerId);
        if (mine.some((x) => this.sideOf(x) !== this.sideOf(msg.seat))) return 'Можно сесть только на корабли одной команды';
        seat.player = playerId;
        break;
      }
      case 'stand': {
        if (!lobby) return 'Партия уже началась';
        const seat = this.seats[msg.seat];
        if (!seat || seat.player !== playerId) return 'Это не ваше место';
        seat.player = null;
        break;
      }
      case 'bot': {
        if (!lobby) return 'Партия уже началась';
        if (!creator) return 'Ботов сажает создатель комнаты';
        const seat = this.seats[msg.seat];
        if (!seat) return 'Нет такого корабля';
        if (msg.on && seat.player) return 'Место занято';
        seat.bot = msg.on;
        break;
      }
      case 'settings': {
        if (!lobby) return 'Партия уже началась';
        if (!creator) return 'Настройки меняет создатель комнаты';
        this.settings = cleanSettings({ ...this.settings, ...msg.settings });
        break;
      }
      case 'coin':
        if (!lobby) return 'Партия уже началась';
        if (!creator) return 'Жребий бросает создатель комнаты';
        this.tossCoin();
        break;
      case 'start':
        if (!lobby) return 'Партия уже началась';
        if (!creator) return 'Начинает создатель комнаты';
        this.start();
        break;
      case 'place':
        return this.place(playerId, msg.side, msg.positions);
      case 'act':
      case 'ready':
      case 'unready':
      case 'concede':
        return this.gameMessage(playerId, msg);
      case 'remind':
        return this.remind(playerId);
      case 'replace':
        return this.replace(playerId, msg.seat);
      case 'rematch':
        return this.voteRematch(playerId, msg.on);
      default:
        return 'Неизвестная команда';
    }
    this.changed();
    return null;
  }

  /** The coin decides which people play which team: the seats of the two teams are swapped or not. */
  private tossCoin(): void {
    const pirates = this.data.ships.filter((x) => x.side === 'ПИРАТЫ').map((x) => x.code);
    const company = this.data.ships.filter((x) => x.side === 'КОМПАНИЯ').map((x) => x.code);
    if (this.rng.int(2) === 1) {
      pirates.forEach((p, i) => {
        const c = company[i];
        [this.seats[p], this.seats[c]] = [this.seats[c], this.seats[p]];
      });
    }
    const names = (side: Side) =>
      [...new Set(Object.entries(this.seats).filter(([code, x]) => this.sideOf(code) === side && x.player).map(([, x]) => this.players.get(x.player!)!.name))];
    const parts = SIDES.filter((side) => names(side).length > 0).map((side) => `${names(side).join(' и ')} — за ${SIDE_ACC[side]}`);
    this.coin = parts.length > 0 ? `Жребий: ${parts.join(', ')}. Первыми ходят Пираты.` : 'Жребий: за столом пока никого нет.';
  }

  private needsPlacement(side: Side): boolean {
    return Object.entries(this.seats).some(([code, x]) => this.sideOf(code) === side && !x.bot);
  }

  private start(): void {
    for (const seat of Object.values(this.seats)) if (!seat.player) seat.bot = true;
    this.phase = 'placement';
    this.placement = {};
    this.startIfPlaced();
  }

  private place(playerId: string, side: Side, positions: [string, string]): string | null {
    if (this.phase !== 'placement') return 'Сейчас не расстановка';
    if (!this.playing(playerId).some((x) => this.sideOf(x) === side)) return 'Это расстановка другой команды';
    if (this.placement[side]) return 'Расстановку уже выбрал союзник';
    const codes = this.data.ships.filter((x) => x.side === side).map((x) => x.code);
    if (!Array.isArray(positions) || positions.length !== 2 || !codes.every((c) => positions.includes(c))) return 'Неверная расстановка';
    this.placement[side] = [positions[0], positions[1]];
    this.startIfPlaced();
    this.changed();
    return null;
  }

  private startIfPlaced(): void {
    if (!SIDES.every((side) => this.placement[side] || !this.needsPlacement(side))) return;
    const random = this.rng.int(2 ** 31 - 1) + 1;
    const seed = this.freshSeed ? random : (this.settings.seed ?? random);
    this.freshSeed = false;
    const { variant, sea, legends } = this.settings;
    this.table = this.newTable({ seed, variant, sea, legends, positions: this.placement });
    this.phase = 'game';
  }

  private gameMessage(playerId: string, msg: Extract<ClientMsg, { t: 'act' | 'ready' | 'unready' | 'concede' }>): string | null {
    const t = this.table;
    if (!t || this.phase !== 'game') return 'Партия ещё не началась';
    const seats = this.playing(playerId);
    if (seats.length === 0) return 'Вы зритель: в этой партии у вас нет корабля';
    if (msg.t === 'ready' || msg.t === 'unready') return t.setReady(seats, msg.t === 'ready', msg.t === 'ready' ? msg.plans : undefined);
    if (msg.t === 'concede') return t.setConcede(seats, msg.on);
    const s = t.state;
    if (s.winner) return 'Партия окончена';
    const done = s.active === t.state.ships[seats[0]].side && seats.every((x) => t.ready.has(x));
    const why = refusal(s, this.data, seats, msg.action, done);
    if (why) return why;
    return t.act(msg.action);
  }

  // ——— «Реванш» ———

  private rematchOpen(): boolean {
    return this.phase === 'game' && !!this.table?.state.winner;
  }

  /** The people at the table: they all must agree to «Реванш» (bots stay, spectators do not vote). */
  private rematchPeople(): string[] {
    return [...new Set(Object.values(this.seats).filter((x) => x.player && !x.bot).map((x) => x.player!))];
  }

  private voteRematch(playerId: string, on: boolean): string | null {
    if (!this.rematchOpen()) return 'Реванш — после конца партии';
    const people = this.rematchPeople();
    if (!people.includes(playerId)) return 'Реванш решают игроки за столом';
    if (on) this.rematch.add(playerId);
    else this.rematch.delete(playerId);
    if (people.every((p) => this.rematch.has(p))) {
      // The same room, seats and bots; a new seed; the secret placement again.
      this.rematch.clear();
      this.table?.dispose();
      this.table = null;
      this.match++;
      this.freshSeed = true;
      this.phase = 'placement';
      this.placement = {};
      this.startIfPlaced();
    }
    this.changed();
    return null;
  }

  /** «Скачать партию»: the record after the end of the game, or the refusal. */
  matchRecord(): MatchRecord | string {
    return this.table && this.phase === 'game' ? this.table.matchRecord() : 'Партии ещё нет';
  }

  /** People the game waits for now (bots and the asker aside). */
  awaited(by: string): string[] {
    const t = this.table;
    if (!t || t.state.winner) return [];
    const d = decider(t.state);
    if (!d) return [];
    let seats = d.seats;
    if (d.kind === 'turn') seats = seats.filter((x) => !t.ready.has(x));
    const players = seats.filter((x) => !this.seats[x].bot).map((x) => this.seats[x].player).filter((p): p is string => !!p && p !== by);
    return [...new Set(players)];
  }

  private remind(playerId: string): string | null {
    const p = this.players.get(playerId)!;
    const now = Date.now();
    if (now - p.lastRemind < REMIND_MS) return 'Напомнить можно раз в 10 секунд';
    const to = this.awaited(playerId);
    if (to.length === 0) return 'Сейчас ждут не людей';
    p.lastRemind = now;
    this.hooks.remind(this, to, p.name);
    return null;
  }

  /** «Заменить ботом» a player who left; the creator decides, or anybody seated when the creator left too. */
  private replace(playerId: string, seat: Seat): string | null {
    if (this.phase !== 'game' || !this.table) return 'Заменить ботом можно во время партии';
    const x = this.seats[seat];
    if (!x || !x.player || x.bot) return 'На этом месте нет игрока';
    const owner = this.players.get(x.player);
    if (x.player === playerId) return 'Себя заменить нельзя';
    if (owner && owner.conns > 0) return 'Этот игрок в сети';
    const creatorHere = (this.players.get(this.creator)?.conns ?? 0) > 0;
    const allowed = this.creator === playerId || (!creatorHere && this.seatsOf(playerId).length > 0);
    if (!allowed) return 'Заменить ботом может создатель комнаты';
    // Both seats of the player go to the bot: they come back together.
    for (const code of this.seatsOf(x.player)) {
      this.seats[code].bot = true;
      this.seats[code].replaced = true;
      this.table.setBot(code, true);
    }
    this.changed();
    return null;
  }

  /** The player leaves the room for good: in the lobby the seats are freed, in a game they wait for a bot. */
  leave(playerId: string): void {
    if (this.phase === 'lobby') for (const seat of this.seatsOf(playerId)) this.seats[seat].player = null;
    this.players.delete(playerId);
    if (this.creator === playerId) {
      const next = [...this.players.values()].find((p) => this.seatsOf(p.id).length > 0) ?? [...this.players.values()][0];
      if (next) this.creator = next.id;
    }
    this.changed();
  }
}

/** Settings from a client, checked: unknown values fall back to the defaults. */
export function cleanSettings(s: Partial<RoomSettings>): RoomSettings {
  const d = DEFAULT_ROOM_SETTINGS;
  const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
  const timer = Number(s.reactionTimer);
  const seed = Number(s.seed);
  return {
    variant: s.variant === 'first' || s.variant === 'quick' || s.variant === 'standard' ? s.variant : d.variant,
    sea: bool(s.sea, d.sea),
    legends: bool(s.legends, d.legends),
    allyHands: bool(s.allyHands, d.allyHands),
    allOpen: bool(s.allOpen, d.allOpen),
    hints: bool(s.hints, d.hints),
    reactionTimer: Number.isFinite(timer) ? Math.max(0, Math.min(300, Math.round(timer))) : 0,
    seed: s.seed !== null && Number.isInteger(seed) && seed > 0 ? seed : null,
  };
}

export function newCode(rng: Rng, taken: (code: string) => boolean): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[rng.int(CODE_CHARS.length)];
    if (!taken(code)) return code;
  }
}
