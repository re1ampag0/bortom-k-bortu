// The game server (docs/TZ.md, «Игровой сервер»): the site from dist/ and the game over a WebSocket at /ws, the same
// code for `npm run lan` and for a VPS. Each player gets only viewFor of the game; actions are checked by
// permissions.ts and the engine; messages are limited in size and rate.
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import raw from '../data/game-data.json';
import { DataError, loadGameData } from '../src/engine/data';
import { createRng } from '../src/engine/rng';
import type { GameData } from '../src/engine/types';
import { DEFAULT_ROOM_SETTINGS, normalizeCode, type ClientMsg, type ServerMsg } from '../src/net/protocol';
import { lanAddresses } from './lan';
import { PresetStore, nameProblem } from './presets';
import { ROOM_TTL_MS, Room, cleanSettings, newCode, type Player, type RoomHooks, type RoomPreset } from './rooms';
import { RoomStore } from './store';
import type { Delays } from './table';

/** The site is built with this base (vite.config.ts) and served under it. */
export const BASE = '/bortom-k-bortu/';
const MAX_MESSAGE = 16 * 1024;
const NAME_MAX = 24;
/** The largest preset a POST may carry (the data of v0.3 is about 80 KB). */
const MAX_PRESET = 512 * 1024;

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
  /**
   * ADMIN_PASSWORD from the server's .env: uploading and deleting presets (POST/DELETE /admin/presets). Empty — those
   * routes are off (403). Never sent to the site.
   */
  adminPassword?: string;
  /** The wait before «неверный пароль» (ms): guessing the password is slow. */
  adminDelayMs?: number;
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
  /** The game of the room the log was sent for: «Реванш» starts the next one from its first line. */
  match: number;
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
  const presets = new PresetStore(options.dataDir);
  const adminPassword = options.adminPassword ?? '';
  const adminDelay = options.adminDelayMs ?? 1000;
  /** Requests to the preset routes by address: a burst and then per second, as the messages of a connection. */
  const buckets = new Map<string, { tokens: number; refilled: number }>();

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
          if (c.match !== room.match) {
            c.match = room.match;
            c.logSent = 0;
    c.match = room.match;
          }
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
      const room = Room.fromRecord(r.preset ? loadGameData(r.preset.data) : data, r, rng, delays, hooks);
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
        // A preset of the server: the room keeps its data, the game is played on it.
        let roomData = data;
        let preset: RoomPreset | null = null;
        if (msg.preset) {
          let found: ReturnType<PresetStore['gameData']> = null;
          try {
            found = presets.gameData(String(msg.preset));
          } catch (e) {
            log(`Пресет «${String(msg.preset)}» не загружается: ${String(e)}`);
          }
          if (!found) return send(c, { t: 'error', id: msg.id, message: `Пресета «${String(msg.preset)}» на сервере нет или он с ошибками` });
          roomData = found.data;
          preset = { name: found.record.name, hash: found.record.hash, data: found.record.data };
        }
        const code = newCode(rng, (x) => rooms.has(x));
        const room = new Room(roomData, code, '', cleanSettings({ ...DEFAULT_ROOM_SETTINGS, ...(msg.settings ?? {}) }), Date.now(), rng, delays, hooks);
        room.preset = preset;
        rooms.set(code, room);
        const player = newPlayer(room, cleanName(msg.name));
        room.creator = player.id;
        log(`Комната ${code} создана${preset ? ` на пресете «${preset.name}»` : ''}`);
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
      case 'record': {
        if (!c.room || !c.player) return send(c, { t: 'error', id: msg.id, message: 'Сначала войдите в комнату' });
        const r = c.room.matchRecord();
        return send(c, typeof r === 'string' ? { t: 'error', id: msg.id, message: r } : { t: 'record', record: r });
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
    const url = parseUrl(req.url);
    if (!url) return badRequest(res);
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
    const api = apiPath(url.pathname);
    if (api) {
      presetRoute(api, req, res).catch((e) => {
        log(`Ошибка запроса ${req.method} ${api}: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
        if (!res.headersSent) json(res, 500, { error: 'Ошибка сервера' });
        else res.destroy();
      });
      return;
    }
    if (url.pathname === '/' || url.pathname === BASE.slice(0, -1)) {
      res.writeHead(302, { location: `${BASE}${url.search}` });
      res.end();
      return;
    }
    if (!url.pathname.startsWith(BASE) || !staticRoot) return notFound(res);
    const path = decodePath(url.pathname.slice(BASE.length));
    if (path === null) return badRequest(res);
    serveStatic(staticRoot, path, req, res);
  });

  // ——— Presets: GET /presets, GET /presets/:name, POST /admin/presets, DELETE /admin/presets/:name ———

  async function presetRoute(path: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      res.end();
      return;
    }
    const ip = req.socket.remoteAddress ?? '';
    const now = Date.now();
    const b = buckets.get(ip) ?? { tokens: rate.burst, refilled: now };
    b.tokens = Math.min(rate.burst, b.tokens + ((now - b.refilled) / 1000) * rate.perSecond);
    b.refilled = now;
    buckets.set(ip, b);
    if (b.tokens < 1) return json(res, 429, { error: 'Слишком много запросов: подождите секунду' });
    b.tokens--;
    if (buckets.size > 10_000) buckets.clear();

    const name = (prefix: string) => decodePath(path.slice(prefix.length)) ?? '';
    if (path === '/presets' && req.method === 'GET') return json(res, 200, { presets: presets.list() });
    if (path.startsWith('/presets/') && req.method === 'GET') {
      const p = presets.get(name('/presets/'));
      return p ? json(res, 200, p) : json(res, 404, { error: `Пресета «${name('/presets/')}» на сервере нет` });
    }
    const admin = path === '/admin/presets' || path.startsWith('/admin/presets/');
    if (!admin) return json(res, 404, { error: 'Не найдено' });
    if (!adminPassword) {
      return json(res, 403, { error: 'Загрузка пресетов на этом сервере выключена: не задан пароль ADMIN_PASSWORD (файл .env рядом с сервером, см. DEPLOY.md)' });
    }
    if (!passwordOk(req.headers.authorization)) {
      await new Promise((ok) => setTimeout(ok, adminDelay));
      log('Админка: неверный пароль');
      return json(res, 401, { error: 'Неверный пароль администратора' });
    }
    if (path === '/admin/presets' && req.method === 'POST') {
      const body = await readBody(req, MAX_PRESET);
      if (body === null) return json(res, 413, { error: `Пресет больше ${MAX_PRESET / 1024} КБ` });
      let msg: { name?: unknown; data?: unknown };
      try {
        msg = JSON.parse(body);
      } catch {
        return json(res, 400, { error: 'Пресет не принят: это не JSON' });
      }
      const bad = nameProblem(msg?.name);
      if (bad) return json(res, 400, { error: `Пресет не принят: ${bad}` });
      try {
        const info = presets.put(String(msg.name), msg.data);
        log(`Админка: пресет «${info.name}» загружен`);
        return json(res, 200, info);
      } catch (e) {
        const problems = e instanceof DataError ? e.problems : [String(e instanceof Error ? e.message : e)];
        return json(res, 400, { error: `Пресет не принят: ошибки в данных — ${problems.slice(0, 5).join('; ')}`, problems });
      }
    }
    if (path.startsWith('/admin/presets/') && req.method === 'DELETE') {
      const n = name('/admin/presets/');
      if (!presets.remove(n)) return json(res, 404, { error: `Пресета «${n}» на сервере нет` });
      log(`Админка: пресет «${n}» удалён`);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: 'Такой запрос не поддерживается' });
  }

  /**
   * «Authorization: Bearer <password>». A header carries only Latin-1, so the admin page sends the password
   * percent-encoded (encodeURIComponent: a password of Latin letters and digits stays as it is).
   */
  function passwordOk(header: string | undefined): boolean {
    const m = /^Bearer (.+)$/.exec(header ?? '');
    if (!m) return false;
    const digest = (x: string) => createHash('sha256').update(x).digest();
    const typed = decodePath(m[1]) ?? m[1];
    return timingSafeEqual(digest(typed), digest(adminPassword));
  }

  // ——— WebSocket ———

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
  const allowed = (options.allowedOrigins ?? []).filter(Boolean);
  http.on('upgrade', (req: IncomingMessage, socket, head) => {
    const path = parseUrl(req.url)?.pathname;
    const origin = req.headers.origin;
    const sameHost = !!origin && !!req.headers.host && parseUrl(origin, undefined)?.host === req.headers.host;
    if ((path !== '/ws' && path !== `${BASE}ws`) || (allowed.length > 0 && origin && !sameHost && !allowed.includes(origin))) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws: WebSocket) => {
    const c: Conn = { ws, player: null, room: null, logSent: 0, match: 0, tokens: rate.burst, refilled: Date.now(), alive: true };
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

/** Cross-origin calls of the preset routes: the admin page may be on GitHub Pages; the password goes in a header. */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-max-age': '600',
};

/** The preset route of a path («/presets…» or «/admin/presets…», also under the site's base), or null. */
function apiPath(pathname: string): string | null {
  const p = pathname.startsWith(BASE) ? `/${pathname.slice(BASE.length)}` : pathname;
  return p === '/presets' || p.startsWith('/presets/') || p === '/admin/presets' || p.startsWith('/admin/presets/') ? p : null;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS });
  res.end(JSON.stringify(body));
}

/** The request's body as text; null when it is longer than `max` bytes. */
function readBody(req: IncomingMessage, max: number): Promise<string | null> {
  return new Promise((ok) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let over = false;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) over = true;
      else chunks.push(c);
    });
    req.on('end', () => ok(over ? null : Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => ok(null));
  });
}

/** A request URL or an Origin header; null when it cannot be parsed (`//`, `null` from a file:// page). */
function parseUrl(raw: string | undefined, base: string | undefined = 'http://x'): URL | null {
  try {
    return new URL(raw ?? '/', base);
  } catch {
    return null;
  }
}

/** A percent-encoded path; null for a broken escape such as `%E0%A4%A`. */
function decodePath(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

function badRequest(res: ServerResponse): void {
  res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Неверный адрес');
}

function notFound(res: ServerResponse): void {
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Не найдено');
}

function serveStatic(root: string, path: string, req: IncomingMessage, res: ServerResponse): void {
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
  const contentType=MIME[extname(target)]??'application/octet-stream';
  const accepted=String(req.headers['accept-encoding']??'').toLowerCase().split(',').map(part=>{
    const [name,...params]=part.trim().split(';');const param=params.find(p=>p.trim().startsWith('q='));
    const quality=param?Number(param.trim().slice(2)):1;return{name,q:Number.isFinite(quality)&&quality>=0&&quality<=1?quality:0};
  });
  const quality=(name:string)=>accepted.find(x=>x.name===name)?.q??accepted.find(x=>x.name==='*')?.q??0;
  let encoding:string|undefined;
  for(const candidate of ['br','gzip'].sort((a,b)=>quality(b)-quality(a))){
    const file=target+(candidate==='br'?'.br':'.gz');
    if(quality(candidate)>0&&existsSync(file)){target=file;encoding=candidate;break;}
  }
  const st=statSync(target),etag=`W/"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`;
  const headers:Record<string,string|number>={
    'content-type':contentType,'cache-control':hashed?'public, max-age=31536000, immutable':'no-cache',
    'vary':'Accept-Encoding','etag':etag,
  };
  if(encoding)headers['content-encoding']=encoding;
  const validators=String(req.headers['if-none-match']??'').split(',').map(v=>v.trim());
  if(validators.some(v=>v==='*'||v.replace(/^W\//,'')===etag.replace(/^W\//,''))){res.writeHead(304,headers);res.end();return;}
  headers['content-length']=st.size;res.writeHead(200,headers);
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(target);stream.on('error',()=>res.destroy());stream.pipe(res);
}
