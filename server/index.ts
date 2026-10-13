// The game server (docs/TZ.md, «Игровой сервер»): the site from dist/ and the game over a WebSocket at /ws, the same
// code for `npm run lan` and for a VPS. Each player gets only viewFor of the game; actions are checked by
// permissions.ts and the engine; messages are limited in size and rate.
import { randomBytes, randomInt } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import raw from '../data/game-data.json';
import { loadGameData } from '../src/engine/data';
import { createRng } from '../src/engine/rng';
import type { GameData } from '../src/engine/types';
import { DEFAULT_ROOM_SETTINGS, normalizeCode, type ClientMsg, type ServerMsg } from '../src/net/protocol';
import { lanAddresses } from './lan';
import { ROOM_TTL_MS, Room, cleanSettings, newCode, type Player, type RoomHooks } from './rooms';
import { RoomStore } from './store';
import type { Delays } from './table';

/** The site is built with this base (vite.config.ts) and served under it. */
export const BASE = '/bortom-k-bortu/';
const MAX_MESSAGE = 16 * 1024;
const NAME_MAX = 24;

export interface ServerOptions {
  port: number;
  host?: string;
  /** Where rooms are saved (server-data/). */
  dataDir: string;
  /** The built site (dist/); null — the game only. */
  staticDir: string | null;
  delays?: Delays;
  /** Pages of other sites allowed to connect (e.g. https://user.github.io); empty — any. */
  allowedOrigins?: string[];
  /** Messages a connection may send: a burst and then per second. */
  rate?: { burst: number; perSecond: number };
  log?: (text: string) => void;
  data?: GameData;
}

export interface GameServer {
  port: number;
  rooms: Map<string, Room>;
  close(): Promise<void>;
}

interface Conn {
  ws: WebSocket;
  player: Player | null;
  room: Room | null;
  /** Log lines already sent. */
  logSent: number;
  tokens: number;
  refilled: number;
  alive: boolean;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

export async function startServer(options: ServerOptions): Promise<GameServer> {
  const data = options.data ?? loadGameData(raw);
  const log = options.log ?? (() => {});
  const delays: Delays = options.delays ?? { bot: [500, 1000], pause: [700, 1500] };
  const rate = options.rate ?? { burst: 40, perSecond: 20 };
  const rng = createRng(randomInt(1, 2 ** 31 - 1));
  const store = new RoomStore(options.dataDir);
  const rooms = new Map<string, Room>();
  const tokens = new Map<string, { code: string; player: string }>();
  const conns = new Set<Conn>();
  const dirty = new Set<Room>();
  const started = Date.now();

  const send = (c: Conn, msg: ServerMsg) => {
    if (c.ws.readyState === c.ws.OPEN) c.ws.send(JSON.stringify(msg));
  };

  /** Sends the room and the game to everybody in it and saves it; changes of one message go out together. */
  const flush = () => {
    for (const room of dirty) {
      if (!rooms.has(room.code)) continue;
      store.save(room.toRecord());
      for (const c of conns) {
        if (c.room !== room || !c.player || !room.players.has(c.player.id)) continue;
        send(c, { t: 'room', room: room.info(c.player.id) });
        if (room.table) {
          const info = room.table.infoFor(room.seatsOf(c.player.id), c.logSent);
          c.logSent = info.logFrom + info.log.length;
          send(c, { t: 'game', game: info });
        }
      }
    }
    dirty.clear();
  };
  const hooks: RoomHooks = {
    changed(room) {
      if (dirty.size === 0) queueMicrotask(flush);
      dirty.add(room);
    },
    remind(room, players, by) {
      for (const c of conns) if (c.room === room && c.player && players.includes(c.player.id)) send(c, { t: 'reminded', by });
    },
  };

  // ——— Saved rooms ———
  for (const r of store.load((file, e) => log(`Не удалось прочитать комнату ${file}: ${String(e)}`))) {
    if (Date.now() - r.updated > ROOM_TTL_MS) {
      store.remove(r.code);
      continue;
    }
    try {
      const room = Room.fromRecord(data, r, rng, delays, hooks);
      rooms.set(room.code, room);
      for (const p of room.players.values()) tokens.set(p.token, { code: room.code, player: p.id });
    } catch (e) {
      log(`Не удалось восстановить комнату ${r.code}: ${String(e)}`);
    }
  }
  if (rooms.size > 0) log(`Восстановлено комнат: ${rooms.size}`);

  const sweep = setInterval(
    () => {
      for (const room of rooms.values()) {
        if (Date.now() - room.updated < ROOM_TTL_MS) continue;
        if ([...conns].some((c) => c.room === room)) continue;
        removeRoom(room);
      }
    },
    60 * 60 * 1000,
  );
  sweep.unref();

  function removeRoom(room: Room): void {
    room.dispose();
    rooms.delete(room.code);
    for (const p of room.players.values()) tokens.delete(p.token);
    store.remove(room.code);
  }

  // ——— Messages ———

  function attach(c: Conn, room: Room, player: Player): void {
    detach(c);
    c.room = room;
    c.player = player;
    c.logSent = 0;
    send(c, { t: 'welcome', token: player.token, player: player.id });
    room.connected(player.id);
  }

  function detach(c: Conn): void {
    if (c.room && c.player) c.room.disconnected(c.player.id);
    c.room = null;
    c.player = null;
  }

  function newPlayer(room: Room, name: string): Player {
    const player: Player = { id: randomBytes(6).toString('hex'), name, token: randomBytes(18).toString('base64url'), conns: 0, lastRemind: 0 };
    tokens.set(player.token, { code: room.code, player: player.id });
    room.addPlayer(player);
    return player;
  }

  const cleanName = (text: unknown) => (typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '') || 'Игрок';

  function handle(c: Conn, msg: ClientMsg): void {
    switch (msg.t) {
      case 'ping':
        return send(c, { t: 'pong' });
      case 'hello': {
        const t = tokens.get(String(msg.token));
        const room = t && rooms.get(t.code);
        const player = room?.players.get(t!.player);
        if (!room || !player) return send(c, { t: 'left' });
        return attach(c, room, player);
      }
      case 'create': {
        const code = newCode(rng, (x) => rooms.has(x));
        const room = new Room(data, code, '', cleanSettings({ ...DEFAULT_ROOM_SETTINGS, ...(msg.settings ?? {}) }), Date.now(), rng, delays, hooks);
        rooms.set(code, room);
        const player = newPlayer(room, cleanName(msg.name));
        room.creator = player.id;
        log(`Комната ${code} создана`);
        return attach(c, room, player);
      }
      case 'join': {
        const code = normalizeCode(String(msg.code ?? ''));
        const room = rooms.get(code);
        if (!room) return send(c, { t: 'error', id: msg.id, message: `Комнаты с кодом ${code || '—'} нет: проверьте код` });
        return attach(c, room, newPlayer(room, cleanName(msg.name)));
      }
      case 'leave': {
        if (c.room && c.player) {
          const room = c.room;
          tokens.delete(c.player.token);
          room.disconnected(c.player.id);
          room.leave(c.player.id);
          if (room.players.size === 0) removeRoom(room);
        }
        c.room = null;
        c.player = null;
        return send(c, { t: 'left' });
      }
      default: {
        if (!c.room || !c.player) return send(c, { t: 'error', id: msg.id, message: 'Сначала войдите в комнату' });
        const why = c.room.handle(c.player.id, msg);
        if (why) send(c, msg.t === 'act' ? { t: 'refused', id: msg.id, reason: why } : { t: 'error', id: msg.id, message: why });
      }
    }
  }

  // ——— HTTP: /health and the site ———

  const staticRoot = options.staticDir ? resolve(options.staticDir) : null;
  let port = options.port;
  const http = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname === '/health' || url.pathname === `${BASE}health`) {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ ok: true, rooms: rooms.size, connections: conns.size, uptime: Math.round((Date.now() - started) / 1000) }));
      return;
    }
    if (url.pathname === '/lan' || url.pathname === `${BASE}lan`) {
      // Pages for other devices in the same network (for the room's link and QR code when the host is on localhost).
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ urls: lanAddresses().map((a) => `http://${a.address}:${port}${BASE}`) }));
      return;
    }
    if (url.pathname === '/' || url.pathname === BASE.slice(0, -1)) {
      res.writeHead(302, { location: `${BASE}${url.search}` });
      res.end();
      return;
    }
    if (!url.pathname.startsWith(BASE) || !staticRoot) return notFound(res);
    serveStatic(staticRoot, decodeURIComponent(url.pathname.slice(BASE.length)), res);
  });

  // ——— WebSocket ———

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
  const allowed = (options.allowedOrigins ?? []).filter(Boolean);
  http.on('upgrade', (req: IncomingMessage, socket, head) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    const origin = req.headers.origin;
    const sameHost = !!origin && !!req.headers.host && new URL(origin).host === req.headers.host;
    if ((path !== '/ws' && path !== `${BASE}ws`) || (allowed.length > 0 && origin && !sameHost && !allowed.includes(origin))) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws: WebSocket) => {
    const c: Conn = { ws, player: null, room: null, logSent: 0, tokens: rate.burst, refilled: Date.now(), alive: true };
    conns.add(c);
    ws.on('pong', () => (c.alive = true));
    ws.on('message', (raw, isBinary) => {
      const now = Date.now();
      c.tokens = Math.min(rate.burst, c.tokens + ((now - c.refilled) / 1000) * rate.perSecond);
      c.refilled = now;
      if (c.tokens < 1) return send(c, { t: 'error', message: 'Слишком много сообщений: подождите секунду' });
      c.tokens--;
      let msg: ClientMsg;
      try {
        if (isBinary) throw new Error('binary');
        msg = JSON.parse(raw.toString());
        if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') throw new Error('shape');
      } catch {
        return send(c, { t: 'error', message: 'Непонятное сообщение' });
      }
      try {
        handle(c, msg);
      } catch (e) {
        log(`Ошибка при обработке «${msg.t}»: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
        send(c, { t: 'error', id: msg.id, message: 'Ошибка сервера: действие не выполнено' });
      }
    });
    ws.on('close', () => {
      detach(c);
      conns.delete(c);
    });
    ws.on('error', () => {});
  });

  // A connection that does not answer pings for 30 s is closed (a phone that went to sleep).
  const heartbeat = setInterval(() => {
    for (const c of conns) {
      if (!c.alive) {
        c.ws.terminate();
        continue;
      }
      c.alive = false;
      c.ws.ping();
    }
  }, 15_000);
  heartbeat.unref();

  await new Promise<void>((ok, fail) => {
    http.once('error', fail);
    http.listen(options.port, options.host ?? '0.0.0.0', () => {
      http.off('error', fail);
      ok();
    });
  });
  const address = http.address();
  port = typeof address === 'object' && address ? address.port : options.port;

  return {
    port,
    rooms,
    close: async () => {
      clearInterval(sweep);
      clearInterval(heartbeat);
      for (const c of conns) c.ws.terminate();
      for (const room of rooms.values()) room.dispose();
      await new Promise<void>((ok) => wss.close(() => ok()));
      await new Promise<void>((ok) => http.close(() => ok()));
    },
  };
}

function notFound(res: ServerResponse): void {
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Не найдено');
}

function serveStatic(root: string, path: string, res: ServerResponse): void {
  const file = normalize(join(root, path));
  if (file !== root && !file.startsWith(root + sep)) return notFound(res);
  let target = file;
  if (!existsSync(target) || statSync(target).isDirectory()) target = join(root, 'index.html');
  if (!existsSync(target)) {
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Сайт не собран: выполните npm run build и перезапустите сервер');
    return;
  }
  const hashed = target.includes(`${sep}assets${sep}`);
  res.writeHead(200, {
    'content-type': MIME[extname(target)] ?? 'application/octet-stream',
    'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  res.end(readFileSync(target));
}
