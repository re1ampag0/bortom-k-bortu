// The game server in one process (docs/TZ.md, «Проверки», «Сервер»): the server and 2–4 clients over ws play a
// game to the end, a client reconnects in the middle, and no client ever gets an enemy hand, the Plans or the order
// of the decks. Also: whose actions are refused, «Сдаться» by the whole team, a restart of the server, «Заменить
// ботом», the ship bot and the limits of the server.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { choiceFor } from '../src/engine/cards';
import { applyAction, createGame } from '../src/engine/engine';
import { decider, playOptions, volleyTargets } from '../src/engine/hints';
import type { MatchRecord } from '../src/engine/match';
import { replay } from '../src/engine/match';
import type { Action, GameState } from '../src/engine/state';
import { HIDDEN } from '../src/engine/view';
import type { ClientMsg, GameInfo, RoomInfo, RoomSettings, ServerMsg } from '../src/net/protocol';
import { startServer, type GameServer } from '../server/index';
import { data } from './helpers';

const DELAYS = { bot: [0, 0] as [number, number], pause: [5, 5] as [number, number] };
const dirs: string[] = [];
const servers: GameServer[] = [];
const clients: Client[] = [];

afterEach(async () => {
  for (const c of clients.splice(0)) c.close();
  for (const s of servers.splice(0)) await s.close();
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

async function server(dir?: string, extra: Partial<Parameters<typeof startServer>[0]> = {}): Promise<{ srv: GameServer; dir: string }> {
  const d = dir ?? mkdtempSync(join(tmpdir(), 'bortom-'));
  if (!dir) dirs.push(d);
  const srv = await startServer({ port: 0, host: '127.0.0.1', dataDir: d, staticDir: null, delays: DELAYS, ...extra });
  servers.push(srv);
  return { srv, dir: d };
}

/** Seats the client's views may see the hands of: its own team. */
function checkView(info: GameInfo, room: RoomInfo, problems: string[]): void {
  const v = info.view;
  const mine = room.you.seats;
  const side = mine.length > 0 ? v.ships[mine[0]].side : null;
  const where = `${room.you.name}, действие ${info.actions}`;
  if (v.seed !== 0 || v.rng !== 0) problems.push(`${where}: seed`);
  for (const ship of Object.values(v.ships)) {
    if (ship.deck.some((c) => c !== HIDDEN)) problems.push(`${where}: колода ${ship.code}`);
    if (ship.side !== side && ship.hand.some((c) => c !== HIDDEN)) problems.push(`${where}: рука ${ship.code}`);
    if (ship.side !== side && ship.plans.some((c) => c !== HIDDEN)) problems.push(`${where}: Планы ${ship.code}`);
  }
  const peek = v.sea?.peek;
  const known = peek && mine.includes(peek.seat) ? peek.n : 0;
  if (v.sea && v.sea.deck.slice(known).some((c) => c !== HIDDEN)) problems.push(`${where}: колода моря`);
  const p = v.pending;
  if (p?.kind === 'choice') {
    if (!mine.includes(p.seat) && p.what !== 'bell' && p.what !== 'dice' && p.options.some((c) => c !== HIDDEN)) problems.push(`${where}: выбор`);
    for (const [seat, card] of Object.entries(p.picks)) if (!mine.includes(seat) && card !== HIDDEN) problems.push(`${where}: Кости`);
  }
  if (p?.kind === 'reactions' && p.side !== side) {
    const defenders = Object.values(v.ships).filter((x) => x.side === p.side).map((x) => x.code);
    if (p.waiting.length !== defenders.length) problems.push(`${where}: кто решает о Реакции`);
  }
  const last = info.last;
  if (last && side) {
    const a = last.action;
    const enemySeat = (seat: string) => v.ships[seat].side !== side;
    if (a.type === 'pass' && enemySeat(a.seat) && a.card !== HIDDEN) problems.push(`${where}: переданная карта`);
    if (a.type === 'choose' && enemySeat(a.seat) && a.cards.some((c) => c !== HIDDEN)) problems.push(`${where}: выбранные карты`);
    for (const e of last.events) {
      if (e.type === 'noReaction' && enemySeat(e.seat)) problems.push(`${where}: «без Реакции» противника`);
      if (e.type === 'passed' && enemySeat(e.seat) && e.card !== HIDDEN) problems.push(`${where}: событие передачи`);
    }
  }
  if (last) {
    // Hands the client sees: its own seats and, by default, its allies' (spectators — none).
    const sees = (seat: string) => mine.includes(seat) || (side !== null && v.ships[seat].side === side);
    for (const e of last.events) {
      if (e.type === 'drew' && e.cards && !sees(e.seat)) problems.push(`${where}: добранные карты ${e.seat}`);
    }
  }
}

/** A player in a browser, as a test sees it: messages, the room, the game and a simple way to play. */
class Client {
  ws!: WebSocket;
  token = '';
  room: RoomInfo | null = null;
  game: GameInfo | null = null;
  log: string[] = [];
  errors: string[] = [];
  refused: string[] = [];
  reminded: string[] = [];
  problems: string[] = [];
  record: MatchRecord | null = null;
  messages = 0;
  private waiters: (() => void)[] = [];
  /** Plays by itself after every message (see autoplay). */
  auto = false;
  private tried = new Set<string>();
  private busy = false;

  constructor(
    private readonly url: string,
    readonly name: string,
  ) {
    clients.push(this);
  }

  async open(): Promise<this> {
    this.ws = new WebSocket(this.url);
    this.ws.on('message', (raw) => this.receive(JSON.parse(raw.toString()) as ServerMsg));
    await new Promise<void>((ok, fail) => {
      this.ws.once('open', () => ok());
      this.ws.once('error', fail);
    });
    return this;
  }

  close(): void {
    this.ws?.terminate();
  }

  send(msg: ClientMsg): void {
    this.ws.send(JSON.stringify(msg));
  }

  private receive(msg: ServerMsg): void {
    this.messages++;
    switch (msg.t) {
      case 'welcome':
        this.token = msg.token;
        break;
      case 'room':
        this.room = msg.room;
        break;
      case 'game':
        if (msg.game.logFrom === 0) this.log = [];
        expect(msg.game.logFrom).toBe(this.log.length);
        this.log.push(...msg.game.log.map((l) => l.text));
        this.game = msg.game;
        if (this.room) checkView(msg.game, this.room, this.problems);
        this.busy = false;
        break;
      case 'refused':
        this.refused.push(msg.reason);
        this.busy = false;
        break;
      case 'error':
        this.errors.push(msg.message);
        this.busy = false;
        break;
      case 'reminded':
        this.reminded.push(msg.by);
        break;
      case 'record':
        this.record = msg.record;
        break;
    }
    for (const w of this.waiters.splice(0)) w();
    if (this.auto) setTimeout(() => this.autoplay(), 0);
  }

  /** Waits until the condition holds after some message. */
  async until(cond: () => boolean, what: string, ms = 20_000): Promise<void> {
    const end = Date.now() + ms;
    while (!cond()) {
      if (Date.now() > end) throw new Error(`${this.name}: не дождались — ${what}`);
      await new Promise<void>((ok) => {
        this.waiters.push(ok);
        setTimeout(ok, 50);
      });
    }
  }

  get view(): GameState {
    return this.game!.view;
  }

  act(action: Action): void {
    this.busy = true;
    this.send({ t: 'act', action });
  }

  /**
   * A simple player: a Volley of each own ship at the first target, then «Ход окончен»; the first Reaction that can
   * be played; the first cards of a choice; «Джек ускользает» — yes; «Тортуга» — no cards.
   */
  autoplay(): void {
    if (!this.game || !this.room || this.busy || this.view.winner) return;
    const s = this.view;
    const mine = this.room.you.seats.filter((x) => !this.game!.bots.includes(x));
    if (mine.length === 0) return;
    const side = s.ships[mine[0]].side;
    const d = decider(s);
    if (!d || d.side !== side && d.kind !== 'choice') return;
    const p = s.pending;
    const key = (x: string) => `${this.game!.actions}:${x}`;
    if (p?.kind === 'reactions') {
      for (const seat of p.waiting.filter((x) => mine.includes(x))) {
        if (this.tried.has(key(seat))) continue;
        this.tried.add(key(seat));
        const card = [...s.ships[seat].hand, ...s.ships[seat].plans].find((c) => !playOptions(s, data, seat, c).reason);
        return this.act(card ? { type: 'react', seat, card } : { type: 'noReaction', seat });
      }
      return;
    }
    if (p?.kind === 'choice') {
      const seat = p.waiting.find((x) => mine.includes(x) && !this.tried.has(key(x)));
      if (!seat) return;
      this.tried.add(key(seat));
      const c = choiceFor(s, seat)!;
      return this.act({ type: 'choose', seat, cards: c.from.slice(0, c.count) });
    }
    if (p?.kind === 'jack') {
      if (mine.includes(p.ship) && !this.tried.has(key('jack'))) {
        this.tried.add(key('jack'));
        this.act({ type: 'jack', play: true });
      }
      return;
    }
    if (p?.kind === 'tortuga') {
      if (p.waiting[0] === side && !this.tried.has(key('tortuga'))) {
        this.tried.add(key('tortuga'));
        this.act({ type: 'tortuga', side, draws: {} });
      }
      return;
    }
    if (s.active !== side || mine.every((x) => this.game!.ready.includes(x))) return;
    const turn = `${s.round}:${s.active}`;
    for (const seat of mine) {
      if (s.ships[seat].sunk || this.tried.has(`${turn}:${seat}`)) continue;
      this.tried.add(`${turn}:${seat}`);
      const t = volleyTargets(s, data, { ship: seat }).targets[0];
      if (t) return this.act({ type: 'volley', ship: seat, target: t.target });
    }
    this.busy = true;
    this.send({ t: 'ready' });
  }
}

async function enter(srv: GameServer, name: string, code?: string, settings: Partial<RoomSettings> = {}): Promise<Client> {
  const c = await new Client(`ws://127.0.0.1:${srv.port}/ws`, name).open();
  c.send(code ? { t: 'join', code, name } : { t: 'create', name, settings });
  await c.until(() => !!c.room, 'комната');
  return c;
}

/** A room where each client sits on the given seats; empty seats get bots; the creator starts. */
async function table(srv: GameServer, seating: Record<string, string[]>, settings: Partial<RoomSettings> = { seed: 7 }) {
  const names = Object.keys(seating);
  const host = await enter(srv, names[0], undefined, settings);
  const code = host.room!.code;
  const all = [host];
  for (const name of names.slice(1)) all.push(await enter(srv, name, code));
  for (const c of all) for (const seat of seating[c.name]) c.send({ t: 'sit', seat });
  await host.until(() => Object.values(seating).flat().every((seat) => host.room!.seats[seat].player), 'все сели');
  host.send({ t: 'start' });
  await host.until(() => host.room!.phase !== 'lobby', 'старт');
  // Secret placement: one person of each team.
  for (const side of ['ПИРАТЫ', 'КОМПАНИЯ'] as const) {
    const placer = all.find((c) => c.room!.you.seats.some((x) => data.ships.find((d) => d.code === x)!.side === side));
    const codes = data.ships.filter((x) => x.side === side).map((x) => x.code) as [string, string];
    placer?.send({ t: 'place', side, positions: codes });
  }
  for (const c of all) await c.until(() => !!c.game, 'партия');
  return { code, all };
}

const finished = (c: Client) => !!c.game?.view.winner;

describe('game server', () => {
  it('/health answers', async () => {
    const { srv } = await server();
    const r = await fetch(`http://127.0.0.1:${srv.port}/health`);
    expect(await r.json()).toMatchObject({ ok: true, rooms: 0 });
  });

  it('2 на 2: four clients play a game to the end; one reconnects in the middle; nobody sees enemy cards', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж'], Боря: ['М'], Вера: ['И'], Гоша: ['Г'] });
    const [a, b, v, g] = all;
    for (const c of all) c.auto = true;
    for (const c of all) c.autoplay();
    // A few rounds, then Вера's phone loses the connection and comes back with her token.
    await v.until(() => v.view.round >= 3 || finished(v), 'третий раунд', 60_000);
    const token = v.token;
    const seenLog = v.log.length;
    v.close();
    const v2 = await new Client(`ws://127.0.0.1:${srv.port}/ws`, 'Вера').open();
    v2.send({ t: 'hello', token });
    await v2.until(() => !!v2.game, 'возвращение');
    expect(v2.room!.you.seats).toEqual(['И']);
    expect(v2.log.length).toBeGreaterThanOrEqual(seenLog);
    v2.auto = true;
    v2.autoplay();
    for (const c of [a, b, v2, g]) await c.until(() => finished(c), 'конец партии', 120_000);
    expect(new Set([a, b, v2, g].map((c) => c.view.winner)).size).toBe(1);
    // Every log line of the end is the same for the two teams up to «без Реакции» lines, which the enemy does not get.
    expect(a.log.at(-1)).toBe(v2.log.at(-1));
    for (const c of [a, b, v, v2, g]) expect(c.problems).toEqual([]);
    // Both allies pressed «Ход окончен»: the server ended every turn only then (the game went on, it did not hang).
    expect(a.view.round).toBeGreaterThan(1);
    // The game had Volleys and Reactions.
    expect(a.log.some((l) => l.includes('Залп по'))).toBe(true);
    expect(a.log.some((l) => l.includes('Реакция'))).toBe(true);
  }, 180_000);

  it('1 на 1 with two seats each, and a spectator: the spectator sees no hand', async () => {
    const { srv } = await server();
    const { code, all } = await table(srv, { Аня: ['Ж', 'М'], Боря: ['И', 'Г'] });
    const watcher = await enter(srv, 'Зритель', code);
    await watcher.until(() => !!watcher.game, 'вид зрителя');
    for (const c of all) {
      c.auto = true;
      c.autoplay();
    }
    for (const c of all) await c.until(() => finished(c), 'конец партии', 120_000);
    await watcher.until(() => finished(watcher), 'конец у зрителя');
    for (const c of [...all, watcher]) expect(c.problems).toEqual([]);
    expect(watcher.view.ships['Ж'].hand.every((x) => x === HIDDEN)).toBe(true);
    watcher.act({ type: 'concede', side: 'ПИРАТЫ' });
    await watcher.until(() => watcher.refused.length > 0, 'отказ зрителю');
  }, 180_000);

  it('a person and a ship bot against two people: the bot plays only its ship, the game ends', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж'], Вера: ['И'], Гоша: ['Г'] });
    const [a] = all;
    expect(a.game!.bots).toEqual(['М']);
    for (const c of all) {
      c.auto = true;
      c.autoplay();
    }
    for (const c of all) await c.until(() => finished(c), 'конец партии', 120_000);
    // The bot moved: lines of «Месть» appear in the log of its team.
    expect(a.log.some((l) => l.startsWith('«Месть»'))).toBe(true);
    for (const c of all) expect(c.problems).toEqual([]);
  }, 180_000);

  it('actions of another seat, after «Ход окончен» and «Ход окончен» of the enemy are refused', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж'], Боря: ['М'], Вера: ['И', 'Г'] });
    const [a, b, v] = all;
    const card = a.view.ships['Ж'].hand[0];
    v.act({ type: 'sell', seat: 'Ж', card: '?' });
    await v.until(() => v.refused.length === 1, 'отказ');
    expect(v.refused[0]).toBe('Это не ваш корабль');
    b.act({ type: 'sell', seat: 'Ж', card });
    await b.until(() => b.refused.length === 1, 'отказ союзнику');
    v.send({ t: 'ready' });
    await v.until(() => v.errors.length === 1, 'не ваш ход');
    expect(v.errors[0]).toBe('Сейчас ход противника');
    a.send({ t: 'ready' });
    await a.until(() => a.game!.ready.includes('Ж'), 'готов');
    a.act({ type: 'sell', seat: 'Ж', card });
    await a.until(() => a.refused.length === 1, 'отказ после «Ход окончен»');
    expect(a.refused[0]).toContain('Вернуться к ходу');
    a.send({ t: 'unready' });
    await a.until(() => !a.game!.ready.includes('Ж'), 'вернулся к ходу');
    a.act({ type: 'sell', seat: 'Ж', card });
    await a.until(() => a.view.ships['Ж'].hand.length === 4, 'продал');
    // The turn passes only when both allies pressed «Ход окончен».
    a.send({ t: 'ready' });
    await a.until(() => a.game!.ready.includes('Ж'), 'готов снова');
    expect(a.view.active).toBe('ПИРАТЫ');
    b.send({ t: 'ready' });
    await a.until(() => a.view.active === 'КОМПАНИЯ', 'ход перешёл');
  });

  it('«Сдаться»: the team gives up only when both of its people pressed it', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж'], Боря: ['М'], Вера: ['И', 'Г'] });
    const [a, b] = all;
    a.send({ t: 'concede', on: true });
    await a.until(() => a.game!.concede.includes('Ж'), 'голос');
    expect(a.view.winner).toBeNull();
    b.send({ t: 'concede', on: true });
    await a.until(() => a.view.winner === 'КОМПАНИЯ', 'сдались');
    expect(a.log.some((l) => l.includes('сдаются') || l.includes('сдал'))).toBe(true);
  });

  it('«Реванш»: starts when every person at the table agreed; the same seats and bots, a new seed, the placement again', async () => {
    const { srv } = await server();
    // A fixed seed of the room: the rematch still gets a new one.
    const { all } = await table(srv, { Аня: ['Ж', 'М'], Боря: ['И'] }, { seed: 7 });
    const [a, b] = all;
    const first = a.game!.view;
    a.send({ t: 'rematch', on: true });
    await a.until(() => a.errors.length > 0, 'отказ до конца партии');
    expect(a.errors.at(-1)).toContain('после конца партии');
    a.send({ t: 'concede', on: true });
    await a.until(() => !!a.room!.rematch, 'голосование');
    expect(a.room!.rematch).toEqual({ agreed: 0, need: 2, you: false });
    a.send({ t: 'rematch', on: true });
    await b.until(() => b.room!.rematch?.agreed === 1, 'один голос');
    expect(a.room!.phase).toBe('game');
    expect(b.room!.rematch).toEqual({ agreed: 1, need: 2, you: false });
    b.send({ t: 'rematch', on: true });
    await a.until(() => a.room!.match === 2, 'реванш');
    expect(a.room!.phase).toBe('placement');
    expect(a.room!.rematch).toBeNull();
    expect(a.room!.seats.Г.bot).toBe(true);
    expect(a.room!.you.seats).toEqual(['Ж', 'М']);
    expect(b.room!.you.seats).toEqual(['И']);
    a.game = null;
    b.game = null;
    a.send({ t: 'place', side: 'ПИРАТЫ', positions: ['Ж', 'М'] });
    b.send({ t: 'place', side: 'КОМПАНИЯ', positions: ['И', 'Г'] });
    for (const c of all) await c.until(() => !!c.game && !c.game.view.winner, 'новая партия');
    expect(a.game!.actions).toBe(0);
    expect(a.game!.bots).toEqual(['Г']);
    // A new seed: the hands of the new game differ from the first one's.
    expect(a.game!.view.ships.Ж.hand).not.toEqual(first.ships.Ж.hand);
  });

  it('«Скачать партию» by network: only after the end, and the record replays the game', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж', 'М'], Боря: ['И', 'Г'] });
    const [a] = all;
    a.send({ t: 'record' });
    await a.until(() => a.errors.length > 0, 'отказ');
    expect(a.errors.at(-1)).toContain('после её конца');
    expect(a.record).toBeNull();
    a.send({ t: 'concede', on: true });
    await a.until(() => finished(a), 'конец');
    a.send({ t: 'record' });
    await a.until(() => !!a.record, 'запись');
    const r = a.record!;
    expect(r.format).toBe('bortom-k-bortu/match');
    expect(replay(data, r.setup, r.actions).winner).toBe('КОМПАНИЯ');
  });

  it('after a restart of the server the game goes on; players come back by their tokens', async () => {
    const first = await server();
    const { code, all } = await table(first.srv, { Аня: ['Ж', 'М'], Боря: ['И', 'Г'] });
    const [a, b] = all;
    a.act({ type: 'sell', seat: 'Ж', card: a.view.ships['Ж'].hand[0] });
    await a.until(() => a.game!.actions === 1, 'действие');
    const view = a.view;
    for (const c of all) c.close();
    await first.srv.close();
    servers.splice(servers.indexOf(first.srv), 1);
    const second = await server(first.dir);
    expect([...second.srv.rooms.keys()]).toEqual([code]);
    const a2 = await new Client(`ws://127.0.0.1:${second.srv.port}/ws`, 'Аня').open();
    a2.send({ t: 'hello', token: a.token });
    await a2.until(() => !!a2.game, 'вернулась');
    expect(a2.view).toEqual(view);
    expect(a2.room!.you.seats).toEqual(['Ж', 'М']);
    const b2 = await new Client(`ws://127.0.0.1:${second.srv.port}/ws`, 'Боря').open();
    b2.send({ t: 'hello', token: 'чужой' });
    await b2.until(() => b2.messages > 0, 'ответ на чужой токен');
    expect(b2.room).toBeNull();
    b2.send({ t: 'hello', token: b.token });
    await b2.until(() => !!b2.game, 'вернулся');
  });

  it('«Заменить ботом»: the creator gives a player who left to a bot; the player comes back to the seat', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж', 'М'], Боря: ['И', 'Г'] });
    const [a, b] = all;
    a.send({ t: 'replace', seat: 'И' });
    await a.until(() => a.errors.length === 1, 'игрок в сети');
    expect(a.errors[0]).toBe('Этот игрок в сети');
    const token = b.token;
    b.close();
    await a.until(() => !a.room!.seats['И'].online, 'Боря вышел');
    a.send({ t: 'replace', seat: 'И' });
    await a.until(() => a.game!.bots.includes('И') && a.game!.bots.includes('Г'), 'боты');
    // The bots play the Company's turn after the Pirates end theirs (Аня answers the Reaction windows).
    a.auto = true;
    a.autoplay();
    await a.until(() => a.view.round >= 2 || !!a.view.winner, 'ход ботов прошёл', 30_000);
    a.auto = false;
    const b2 = await new Client(`ws://127.0.0.1:${srv.port}/ws`, 'Боря').open();
    b2.send({ t: 'hello', token });
    await b2.until(() => !!b2.game && b2.game.bots.length === 0, 'место вернулось');
    expect(b2.room!.seats['И']).toMatchObject({ bot: false, replaced: false, online: true });
  });

  it('«Напомнить» reaches the people the game waits for, not more often than every 10 s', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж'], Боря: ['М'], Вера: ['И', 'Г'] });
    const [a, b, v] = all;
    a.send({ t: 'ready' });
    await a.until(() => a.game!.ready.includes('Ж'), 'готов');
    v.send({ t: 'remind' });
    await b.until(() => b.reminded.length === 1, 'напоминание');
    expect(b.reminded[0]).toBe('Вера');
    expect(a.reminded).toEqual([]);
    v.send({ t: 'remind' });
    await v.until(() => v.errors.length === 1, 'не чаще раза в 10 с');
  });

  it('the lobby: seats of one team only, the coin, bots by the creator, a wrong code', async () => {
    const { srv } = await server();
    const host = await enter(srv, 'Аня');
    const code = host.room!.code;
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
    host.send({ t: 'sit', seat: 'Ж' });
    host.send({ t: 'sit', seat: 'И' });
    await host.until(() => host.errors.length === 1, 'другая команда');
    const b = await enter(srv, 'Боря', code.toLowerCase());
    b.send({ t: 'sit', seat: 'Ж' });
    await b.until(() => b.errors.length === 1, 'занято');
    b.send({ t: 'bot', seat: 'Г', on: true });
    await b.until(() => b.errors.length === 2, 'не создатель');
    b.send({ t: 'sit', seat: 'И' });
    host.send({ t: 'coin' });
    await host.until(() => !!host.room!.coin, 'жребий');
    expect(host.room!.coin).toMatch(/Аня — за (Пиратов|Компанию), Боря — за (Пиратов|Компанию)|Боря — за .*, Аня — за/);
    const lost = await new Client(`ws://127.0.0.1:${srv.port}/ws`, 'Гость').open();
    lost.send({ t: 'join', code: 'ZZZZZ', name: 'Гость' });
    await lost.until(() => lost.errors.length === 1, 'нет комнаты');
    expect(lost.errors[0]).toContain('ZZZZZ');
  });

  it('too many messages and too big messages are refused', async () => {
    const { srv } = await server(undefined, { rate: { burst: 10, perSecond: 1 } });
    const c = await new Client(`ws://127.0.0.1:${srv.port}/ws`, 'Спамер').open();
    for (let i = 0; i < 20; i++) c.send({ t: 'ping' });
    await c.until(() => c.errors.length > 0, 'ограничение частоты');
    expect(c.errors[0]).toContain('Слишком много сообщений');
    const closed = new Promise<number>((ok) => c.ws.once('close', (code) => ok(code)));
    c.ws.send('x'.repeat(20_000));
    expect(await closed).toBe(1009);
  });
});

/** A seed where the first Volley of «Жемчужина» at «Индевор» finds the Company with (or without) a Reaction. */
function seedWhere(withReaction: boolean): number {
  for (let seed = 1; seed < 3000; seed++) {
    const s = createGame(data, { seed, positions: { ПИРАТЫ: ['Ж', 'М'], КОМПАНИЯ: ['И', 'Г'] }, pauseEmptyWindows: true }).state;
    const r = applyAction(s, { type: 'volley', ship: 'Ж', target: 'И' }, data).state;
    if (r.pending?.kind === 'reactions' && r.pending.waiting.length > 0 === withReaction) return seed;
  }
  throw new Error('no seed');
}

describe('game server: the Reaction window', () => {
  it('no Reaction to play: the attackers wait the pause like a real window, the window closes by itself', async () => {
    const { srv } = await server(undefined, { delays: { bot: [0, 0], pause: [300, 300] } });
    const { all } = await table(srv, { Аня: ['Ж', 'М'], Боря: ['И', 'Г'] }, { seed: seedWhere(false) });
    const [a, b] = all;
    const start = Date.now();
    a.act({ type: 'volley', ship: 'Ж', target: 'И' });
    await a.until(() => a.view.pending?.kind === 'reactions', 'окно у нападающих');
    // The attackers see the whole team deciding; the defenders know they have nothing.
    expect(a.view.pending).toMatchObject({ waiting: ['И', 'Г'] });
    await b.until(() => b.view.pending?.kind === 'reactions', 'окно у защищающихся');
    expect(b.view.pending).toMatchObject({ waiting: [] });
    // The window «до урона» closes by itself after the pause; then the Volley hits.
    await a.until(() => a.log.some((l) => l.startsWith('Попадание')), 'попадание', 5000);
    expect(Date.now() - start).toBeGreaterThanOrEqual(250);
    expect(a.problems).toEqual([]);
  }, 15_000);

  it('against bots only there is no pause', async () => {
    const { srv } = await server(undefined, { delays: { bot: [0, 0], pause: [5000, 5000] } });
    const { all } = await table(srv, { Аня: ['Ж', 'М'] }, { seed: seedWhere(false) });
    const [a] = all;
    const start = Date.now();
    a.act({ type: 'volley', ship: 'Ж', target: 'И' });
    await a.until(() => a.log.some((l) => l.startsWith('Попадание')), 'попадание', 3000);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it('the timer of the room closes a window nobody answers', async () => {
    const { srv } = await server();
    const { all } = await table(srv, { Аня: ['Ж', 'М'], Боря: ['И', 'Г'] }, { seed: seedWhere(true), reactionTimer: 1 });
    const [a, b] = all;
    a.act({ type: 'volley', ship: 'Ж', target: 'И' });
    await b.until(() => b.view.pending?.kind === 'reactions' && b.view.pending.waiting.length > 0, 'окно');
    const start = Date.now();
    await a.until(() => a.log.some((l) => l.startsWith('Попадание')), 'окно закрылось по таймеру', 5000);
    expect(Date.now() - start).toBeGreaterThanOrEqual(800);
  });
});
