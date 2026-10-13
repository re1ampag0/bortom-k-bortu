// «По сети» (docs/TZ.md, «Мультиплеер»): enter a name, create a room or enter one by its code; in the room — the code,
// the link with «Скопировать» and a QR code, the four seats (who sits, online), bots, the coin, the options and
// «Начать» for the creator; then the secret placement of each team; then the table.
import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Variant } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import { normalizeCode, type RoomInfo, type RoomSettings } from '../../net/protocol';
import { chooseServer, storedServer, storeServer } from '../../net/server-url';
import { LOST_MS, NetClient, loadName, loadNetSaved } from '../../net/ws';
import { Game } from '../game/Game';
import { SIDE_LABEL } from '../game/text';

const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];
const BASE = import.meta.env.BASE_URL;

/** The room code from the link «…?room=ABCDE». */
export function roomFromUrl(): string {
  return normalizeCode(new URLSearchParams(location.search).get('room') ?? '');
}

/** The saved seat, unless the link leads to another room: then the link wins. */
function savedFor() {
  const saved = loadNetSaved();
  const link = roomFromUrl();
  return !link || saved?.code === link ? saved : null;
}

export function NetScreen({ data, onBack }: { data: GameData; onBack: () => void }) {
  const [typed, setTyped] = useState(storedServer());
  const choice = useMemo(() => chooseServer(typed), [typed]);
  const [client, setClient] = useState<NetClient | null>(() => (choice.url ? new NetClient(data, choice.url, savedFor()) : null));
  useEffect(() => () => client?.close(), [client]);
  const connectTo = (text: string) => {
    storeServer(text);
    setTyped(text);
    const c = chooseServer(text);
    setClient(c.url ? new NetClient(data, c.url, savedFor()) : null);
  };

  if (!client) return <Entry data={data} client={null} error={choice.error} onBack={onBack} onServer={connectTo} typed={typed} />;
  return <Connected data={data} client={client} onBack={onBack} onServer={connectTo} typed={typed} />;
}

function Connected({
  data,
  client,
  onBack,
  onServer,
  typed,
}: {
  data: GameData;
  client: NetClient;
  onBack: () => void;
  onServer: (text: string) => void;
  typed: string;
}) {
  useSyncExternalStore(
    useCallback((cb: () => void) => client.subscribe(cb), [client]),
    () => client.version,
  );
  const room = client.room;
  if (room?.phase === 'game' && client.game) {
    return (
      <Game
        key={room.code}
        game={client.game}
        onExit={() => client.leave()}
        onRestart={() => {}}
      />
    );
  }
  if (!room) return <Entry data={data} client={client} error={null} onBack={onBack} onServer={onServer} typed={typed} />;
  if (room.phase === 'placement') return <NetPlacement data={data} client={client} room={room} />;
  return <RoomLobby data={data} client={client} room={room} />;
}

/** The state of the connection in words; after 10 s without it — the hint about the sleeping laptop. */
function ConnectionLine({ client }: { client: NetClient }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (client.connection === 'online') return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [client.connection]);
  if (client.connection === 'online') return null;
  const long = client.lostAt !== null && Date.now() - client.lostAt > LOST_MS;
  return (
    <p className={`net-line ${long ? 'bad' : ''}`} data-testid="net-status">
      {long
        ? 'Сервер недоступен: проверьте, что ноутбук с игрой не уснул и вы в той же сети.'
        : client.connection === 'connecting'
          ? 'Подключаемся к серверу…'
          : 'Нет связи с сервером — переподключаемся…'}
    </p>
  );
}

function Entry({
  data,
  client,
  error,
  onBack,
  onServer,
  typed,
}: {
  data: GameData;
  client: NetClient | null;
  error: string | null;
  onBack: () => void;
  onServer: (text: string) => void;
  typed: string;
}) {
  const [name, setName] = useState(loadName());
  const [code, setCode] = useState(roomFromUrl());
  const [server, setServer] = useState(typed);
  const [more, setMore] = useState(!!error);
  const saved = loadNetSaved();
  const fromLink = roomFromUrl();
  // A link «…?room=ABCDE» and a name remembered from before: straight into the room (unless the saved seat is in it).
  const [known] = useState(() => loadName().trim());
  const [autoJoined, setAutoJoined] = useState(false);
  useEffect(() => {
    if (!client || autoJoined || !fromLink || !known || client.connection !== 'online') return;
    if (saved?.code === fromLink) return;
    setAutoJoined(true);
    client.join(fromLink, known);
  }, [client, client?.connection, autoJoined, fromLink, known, saved?.code]);
  void data;
  const okName = name.trim().length > 0;
  return (
    <main className="setup net" data-testid="net-entry">
      <header className="setup-head">
        <h1>Игра по сети</h1>
        <p className="muted">У каждого игрока своё устройство. Один создаёт комнату, остальные входят по коду или ссылке.</p>
      </header>
      {client && <ConnectionLine client={client} />}
      {(error || client?.error) && <p className="error">{error ?? client?.error?.text}</p>}
      {saved && client?.connection === 'online' && !client.room && saved.code && (
        <p className="muted">Возвращаемся в комнату {saved.code}…</p>
      )}
      <label className="row">
        <span>Ваше имя</span>
        <input data-testid="net-name" value={name} maxLength={24} placeholder="Например, Аня" onChange={(e) => setName(e.target.value)} />
      </label>
      <section className="quick">
        <button className="quick-btn" data-testid="net-create" disabled={!client || !okName} onClick={() => client?.create(name.trim())}>
          <b>Создать комнату</b>
          <span>Получите код и ссылку для остальных.</span>
        </button>
        <div className="quick-btn join-box">
          <b>Войти по коду</b>
          <span className="row">
            <input
              data-testid="net-code"
              value={code}
              placeholder="ABCDE"
              maxLength={5}
              autoCapitalize="characters"
              onChange={(e) => setCode(normalizeCode(e.target.value))}
            />
            <button className="btn primary" data-testid="net-join" disabled={!client || !okName || code.length !== 5} onClick={() => client?.join(code, name.trim())}>
              Войти
            </button>
          </span>
        </div>
      </section>
      <section className="more">
        <button className="link" onClick={() => setMore(!more)} aria-expanded={more}>
          {more ? '▾' : '▸'} Адрес сервера
        </button>
        {more && (
          <div className="more-body">
            <p className="muted">
              Если сайт открыт с адреса сервера (например, http://192.168.1.23:8080), ничего вписывать не нужно. С GitHub Pages — адрес
              сервера с https, например wss://game.example.ru (подробнее — DEPLOY.md).
            </p>
            <label className="row">
              <span>Сервер</span>
              <input value={server} placeholder="тот же адрес, что у сайта" onChange={(e) => setServer(e.target.value)} />
            </label>
            <div className="row buttons">
              <button className="btn" onClick={() => onServer(server)}>
                Подключиться
              </button>
            </div>
          </div>
        )}
      </section>
      <footer className="setup-foot">
        <button className="link" onClick={onBack}>
          ← Назад
        </button>
      </footer>
    </main>
  );
}

/** The link to the room for other devices: on localhost — the address of this computer in the Wi-Fi network. */
function useRoomLink(code: string): string {
  const local = `${location.origin}${BASE}?room=${code}`;
  const [link, setLink] = useState(local);
  useEffect(() => {
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    fetch(`${BASE}lan`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { urls?: string[] } | null) => {
        if (j?.urls?.[0]) setLink(`${j.urls[0]}?room=${code}`);
      })
      .catch(() => {});
  }, [code]);
  return link;
}

function Qr({ text }: { text: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [text]);
  return svg ? <div className="qr" data-testid="room-qr" aria-label={`QR-код: ${text}`} dangerouslySetInnerHTML={{ __html: svg }} /> : null;
}

function RoomLobby({ data, client, room }: { data: GameData; client: NetClient; room: RoomInfo }) {
  const link = useRoomLink(room.code);
  const [copied, setCopied] = useState(false);
  const creator = room.you.creator;
  const mySide = room.you.seats.length > 0 ? data.ships.find((x) => x.code === room.you.seats[0])!.side : null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Скопируйте ссылку:', link);
    }
  };
  const set = (patch: Partial<RoomSettings>) => client.send({ t: 'settings', settings: patch });
  const st = room.settings;
  const people = Object.values(room.seats).filter((x) => x.player).length;
  return (
    <main className="setup net room" data-testid="room">
      <header className="setup-head">
        <h1>
          Комната <span className="room-code" data-testid="room-code">{room.code}</span>
        </h1>
        <ConnectionLine client={client} />
        {client.error && <p className="error">{client.error.text}</p>}
      </header>
      <section className="room-link">
        <div>
          <p className="muted">Остальные открывают ссылку или вводят код на экране «По сети»:</p>
          <p className="link-row">
            <code data-testid="room-link">{link}</code>
            <button className="btn small" onClick={copy}>
              {copied ? 'Скопировано' : 'Скопировать'}
            </button>
          </p>
        </div>
        {creator && <Qr text={link} />}
      </section>

      <section className="seats">
        {SIDES.map((side) => (
          <div key={side} className={`seat-col side-${side === 'ПИРАТЫ' ? 'pirates' : 'company'}`}>
            <h2>{SIDE_LABEL[side].name}</h2>
            {data.ships
              .filter((x) => x.side === side)
              .map((ship) => {
                const seat = room.seats[ship.code];
                const mine = seat.player === room.you.id;
                const free = !seat.player && !seat.bot;
                const canSit = free && (!mySide || mySide === side);
                return (
                  <div key={ship.code} className={`seat ${mine ? 'mine' : ''}`} style={{ borderColor: ship.color }} data-testid={`seat-${ship.code}`}>
                    <b style={{ color: ship.color }}>{ship.name}</b>
                    <span className="seat-who">
                      {seat.bot ? 'Бот' : seat.player ? `${seat.online ? '●' : '○'} ${seat.name}${mine ? ' (вы)' : ''}` : 'свободно'}
                    </span>
                    <span className="seat-btns">
                      {canSit && (
                        <button className="btn small" data-testid={`sit-${ship.code}`} onClick={() => client.send({ t: 'sit', seat: ship.code })}>
                          Сесть
                        </button>
                      )}
                      {mine && (
                        <button className="btn small" onClick={() => client.send({ t: 'stand', seat: ship.code })}>
                          Встать
                        </button>
                      )}
                      {creator && free && (
                        <button className="btn small" data-testid={`bot-${ship.code}`} onClick={() => client.send({ t: 'bot', seat: ship.code, on: true })}>
                          Посадить бота
                        </button>
                      )}
                      {creator && seat.bot && (
                        <button className="btn small" onClick={() => client.send({ t: 'bot', seat: ship.code, on: false })}>
                          Убрать бота
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
          </div>
        ))}
      </section>
      {room.spectators.length > 0 && <p className="muted">Смотрят: {room.spectators.join(', ')}</p>}
      {room.coin && (
        <p className="note" data-testid="coin">
          {room.coin}
        </p>
      )}

      <section className="more-body room-settings">
        <label className="row">
          <span>Вариант</span>
          <select
            disabled={!creator}
            value={st.variant}
            onChange={(e) => {
              const v = e.target.value as Variant;
              // «Первая партия» plays without the sea and the Legends (RULES.md 20.1); the boxes can turn them back on.
              set({ variant: v, sea: v !== 'first', legends: v !== 'first' });
            }}
          >
            <option value="standard">обычная партия</option>
            <option value="first">«Первая партия»</option>
            <option value="quick">«Быстрый бой»</option>
          </select>
        </label>
        <Check disabled={!creator} value={st.sea} label="Колода моря" onChange={(v) => set({ sea: v })} />
        <Check disabled={!creator} value={st.legends} label="Легенды" onChange={(v) => set({ legends: v })} />
        <Check disabled={!creator} value={st.allyHands} label="Союзники видят руки друг друга" onChange={(v) => set({ allyHands: v })} />
        <Check disabled={!creator} value={st.hints} label="Разрешить подсказки (каждый включает их у себя в ⚙)" onChange={(v) => set({ hints: v })} />
        <Check disabled={!creator} value={st.allOpen} label="Всё открыто — все руки видны всем (для тестов)" onChange={(v) => set({ allOpen: v })} />
        <label className="row">
          <span>Окно Реакций ждёт не дольше, с (0 — без таймера)</span>
          <input
            disabled={!creator}
            inputMode="numeric"
            value={st.reactionTimer}
            onChange={(e) => set({ reactionTimer: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="row">
          <span>Seed</span>
          <input
            disabled={!creator}
            inputMode="numeric"
            placeholder="случайный"
            data-testid="room-seed"
            value={st.seed ?? ''}
            onChange={(e) => set({ seed: Number(e.target.value) || null })}
          />
        </label>
      </section>

      <div className="row buttons">
        {creator ? (
          <>
            <button className="btn" onClick={() => client.send({ t: 'coin' })} data-testid="coin-btn">
              Жребий
            </button>
            <button className="btn primary" data-testid="room-start" disabled={people === 0} onClick={() => client.send({ t: 'start' })}>
              Начать{Object.values(room.seats).some((x) => !x.player && !x.bot) ? ' (на пустые места — боты)' : ''}
            </button>
          </>
        ) : (
          <p className="muted">Начинает создатель комнаты.</p>
        )}
        <button className="link" onClick={() => client.leave()}>
          Выйти из комнаты
        </button>
      </div>
    </main>
  );
}

function Check({ value, label, disabled, onChange }: { value: boolean; label: string; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row check">
      <input type="checkbox" disabled={disabled} checked={value} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

/** The secret placement (RULES.md 2.2): any person of the team chooses; the other team does not see it. */
function NetPlacement({ data, client, room }: { data: GameData; client: NetClient; room: RoomInfo }) {
  const side = room.you.seats.length > 0 ? data.ships.find((x) => x.code === room.you.seats[0])!.side : null;
  const ships = side ? data.ships.filter((x) => x.side === side) : [];
  const [order, setOrder] = useState<[string, string]>(ships.length === 2 ? [ships[0].code, ships[1].code] : ['', '']);
  const ship = (code: string) => data.ships.find((x) => x.code === code)!;
  const placed = side ? room.placed.includes(side) : true;
  const playing = side && room.you.seats.some((x) => !room.seats[x].bot);
  return (
    <main className="setup placement" data-testid="placement">
      <header className="setup-head">
        <h1>{side ? `${SIDE_LABEL[side].name}: расстановка` : 'Команды расставляют корабли'}</h1>
        <ConnectionLine client={client} />
        {client.error && <p className="error">{client.error.text}</p>}
        {room.coin && <p className="note">{room.coin}</p>}
        {side && !placed && (
          <p className="muted">
            Кто слева, кто справа? Корабли напротив друг друга стреляют без штрафа. Решает любой игрок команды; противник увидит
            расстановку только в начале партии.
          </p>
        )}
      </header>
      {side && playing && !placed ? (
        <>
          <div className="slots">
            {order.map((code, i) => (
              <div key={code} className="slot" style={{ borderColor: ship(code).color }}>
                <span className="muted">{i === 0 ? 'Слева' : 'Справа'}</span>
                <b style={{ color: ship(code).color }}>{ship(code).name}</b>
                <span className="muted">{ship(code).captain}</span>
              </div>
            ))}
          </div>
          <div className="row buttons">
            <button className="btn" onClick={() => setOrder([order[1], order[0]])}>
              ⇄ Поменять местами
            </button>
            <button className="btn primary" data-testid="placement-done" onClick={() => client.send({ t: 'place', side, positions: order })}>
              Готово
            </button>
          </div>
        </>
      ) : (
        <p className="muted" data-testid="placement-wait">
          {side && placed ? 'Расстановка выбрана. Ждём противника…' : 'Ждём, пока команды расставят корабли…'}
        </p>
      )}
    </main>
  );
}
