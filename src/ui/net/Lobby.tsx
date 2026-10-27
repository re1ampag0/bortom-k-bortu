// «По сети» (docs/TZ.md, «Мультиплеер»): enter a name, create a room or enter one by its code; in the room — the code,
// the link with «Скопировать» and a QR code, the four seats (who sits, online), bots, the coin, the options and
// «Начать» for the creator; then the secret placement of each team; then the table.
import QRCode from 'qrcode';
import {useMenuLayout} from '../menus/layout';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Variant } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import { normalizeCode, type RoomInfo, type RoomSettings } from '../../net/protocol';
import { chooseServer, storedServer, storeServer } from '../../net/server-url';
import { LOST_MS, NetClient, loadName, loadNetSaved } from '../../net/ws';
import { Game } from '../game/Game';
import { SIDE_LABEL } from '../game/text';
import {MenuSurface,Icon,Dock,shipName,Arrow} from '../menus/Menus';
import {PlacementBoard} from '../menus/PlacementBoard';

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
        key={`${room.code}-${room.match}`}
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
          : 'Нет связи с сервером, переподключаемся…'}
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
    <MenuSurface kind="net"><main className="menu-net" data-testid="net-entry"><div className="menu-bunting" aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i}/>)}</div>
      <header className="setup-head">
        <h1 className="menu-title">Игра по сети</h1>
        <p className="muted">У каждого игрока своё устройство. Один создаёт комнату, остальные входят по коду или ссылке.</p>
      </header>
      {client && <ConnectionLine client={client} />}
      
      {saved && client?.connection === 'online' && !client.room && saved.code && (
        <p className="muted">Возвращаемся в комнату {saved.code}…</p>
      )}
      <label className="row menu-name">
        <span>Ваше имя</span><svg className="menu-quill" viewBox="0 0 26 26" aria-hidden="true"><path d="M4 22C8 14 14 6 23 3C21 10 15 17 6 21Z" fill="#f6f0e2" stroke="#8a7a5a"/><path d="M3 24L18 8" stroke="#c9a048"/></svg>
        <input data-testid="net-name" value={name} maxLength={24} placeholder="Например, Аня" onChange={(e) => setName(e.target.value)} />
      </label>
      <section className="quick">
        <section className="quick-btn">
          <span className="menu-medal"><Icon name="bell" size={50}/></span><b>Создать комнату</b>
          <span>Вы получите код и ссылку для друзей, рассадите всех по кораблям и начнёте бой.</span><button className="menu-primary" data-testid="net-create" disabled={!client || !okName} onClick={() => client?.create(name.trim())}>Создать комнату</button>
        </section>
        <div className="quick-btn join-box">
          <span className="menu-medal"><Icon name="key" size={50}/></span><b>Войти по коду</b>
          <span className="menu-code-entry"><span className="menu-code-cells" aria-hidden="true">{Array.from({length:5},(_,i)=><span className={i===Math.min(code.length,4)?'active':''} key={i}>{code[i]??''}</span>)}</span>
            <input aria-label="Код комнаты"
              data-testid="net-code"
              value={code}
              placeholder=""
              maxLength={5}
              autoCapitalize="characters"
              onChange={(e) => setCode(normalizeCode(e.target.value))}
            />
          </span>
            <button className="menu-primary" data-testid="net-join" disabled={!client || !okName || code.length !== 5} onClick={() => client?.join(code, name.trim())}>
              Войти
            </button>
            {(error || client?.error) && <p className="error polish-code-error" role="alert"><b aria-hidden="true">!</b> {error ?? client?.error?.text}</p>}
        </div>
      </section>
      <section className="more">
        <button className="link" onClick={() => setMore(!more)} aria-expanded={more}>
          <Arrow chevron/> Сервер
        </button>
        {more && (
          <div className="more-body">
            <p className="muted">
              Если сайт открыт с адреса сервера (например, http://192.168.1.23:8080), ничего вписывать не нужно. Для GitHub Pages нужен адрес
              сервера с https, например wss://game.example.ru (подробнее: DEPLOY.md).
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
      <span className="menu-server-state"><i className={`menu-status-dot ${client?.connection==='online'?'online':''}`}/>{client?.connection==='online'?'Сервер на связи':'Нет связи с сервером'}</span><footer className="setup-foot">
        <button className="link" onClick={onBack}>
          <Arrow back/> Назад
        </button>
      </footer>
    </main></MenuSurface>
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

export function Qr({ text }: { text: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 4, errorCorrectionLevel: 'H' })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [text]);
  return svg ? <div className="qr menu-qr" data-testid="room-qr" aria-label={`QR-код: ${text}`}><div dangerouslySetInnerHTML={{__html:svg}}/><span className="menu-qr-anchor"><Icon name="coin_back" size={28}/></span></div> : null;
}

function RoomLobby({ data, client, room }: { data: GameData; client: NetClient; room: RoomInfo }) {
  const link = useRoomLink(room.code);
  const [qrOpen,setQrOpen]=useState(false);
  const phone=useMenuLayout().mode==='phone';
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
    <MenuSurface kind="net"><main className={"menu-net room"+(qrOpen?" menu-room-showqr":"")} data-testid="room"><div className="menu-bunting" aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i}/>)}</div>
      <header className="setup-head">
        <button className="menu-link menu-room-exit" onClick={()=>client.leave()}><Arrow back/><span className="menu-desktop">Выйти из комнаты</span><span className="menu-phone">Игра по сети</span></button>
        <ConnectionLine client={client} />
        {client.error && <p className="error">{client.error.text}</p>}
      </header>
      <section className="room-link"><h2><Icon name="key" size={28}/>Код комнаты</h2><span className="room-code" data-testid="room-code">{room.code}</span>
        <div>
          <p className="muted">Друзья открывают ссылку или вводят код в разделе «Игра по сети».</p>
          <p className="link-row">
            <code data-testid="room-link" className="menu-raw-link">{link}</code>
            <button className="btn small" onClick={copy}>
              {copied ? 'Скопировано' : <><span className="menu-desktop">Скопировать ссылку</span><span className="menu-phone">Ссылка</span></>}
            </button>
          </p>
        </div>
        <button className="menu-phone menu-qr-toggle" aria-label="Показать QR-код" aria-expanded={qrOpen} onClick={()=>setQrOpen(!qrOpen)}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 2H9V9H2ZM15 2H22V9H15ZM2 15H9V22H2ZM15 15H18V18H15ZM19 19H22V22H19Z" fill="none" stroke="currentColor" strokeWidth="2"/></svg></button>{(!phone||qrOpen)&&<Qr text={link}/> }
      </section>

      <section className="seats"><div className="menu-seats-heading"><h2 className="menu-seats-title">Кто на каком корабле</h2><p>Сядьте на корабль. Пустые места займут боты.</p></div>
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
                    <Dock name={shipName(ship.code)}/><b>{ship.name}</b>
                    <span className="seat-who">
                      <i className={`menu-status-dot ${seat.online||seat.bot?'online':''}`}/>{seat.bot?<><Icon name="autohelm" size={23}/> Бот у штурвала</>:seat.player?`${seat.name}${mine?' (вы)':''}${seat.online?'':' · не в сети'}`:'Свободно'}
                    </span>
                    <span className="seat-btns">
                      {canSit && (
                        <button className="btn small" data-testid={`sit-${ship.code}`} onClick={() => client.send({ t: 'sit', seat: ship.code })}>
                          На борт
                        </button>
                      )}
                      {mine && (
                        <button className="btn small" onClick={() => client.send({ t: 'stand', seat: ship.code })}>
                          Сойти
                        </button>
                      )}
                      {creator && free && (
                        <button className="btn small" data-testid={`bot-${ship.code}`} onClick={() => client.send({ t: 'bot', seat: ship.code, on: true })}>
                          <span className="menu-desktop">Нанять бота</span><span className="menu-phone">Нанять</span>
                        </button>
                      )}
                      {creator && seat.bot && (
                        <button className="btn small" onClick={() => client.send({ t: 'bot', seat: ship.code, on: false })}>
                          <span className="menu-desktop">Списать бота</span><span className="menu-phone">Списать</span>
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

      <details className="menu-room-options" open={!phone}><summary><Icon name="flags" size={24}/><span>Партия<small>{[st.variant==='standard'?'Обычная':st.variant==='first'?'Первая':'Быстрый бой',st.sea&&'Колода моря',st.legends&&'Легенды',st.hints&&'подсказки'].filter(Boolean).join(', ')}</small></span><Arrow chevron/></summary>
      <section className="more-body room-settings"><h2><Icon name="flags"/> Партия</h2>
        <div className="menu-variants" role="group" aria-label="Вариант партии">{(['standard','first','quick'] as Variant[]).map(v=><button key={v} disabled={!creator} aria-pressed={st.variant===v} className={st.variant===v?'on':''} onClick={()=>set({variant:v,sea:v!=='first',legends:v!=='first'})}>{{standard:'Обычная',first:'Первая',quick:'Быстрый бой'}[v]}</button>)}</div>
        <Check disabled={!creator} value={st.sea} label="Колода моря" onChange={(v) => set({ sea: v })} />
        <Check disabled={!creator} value={st.legends} label="Легенды" onChange={(v) => set({ legends: v })} />
        <Check disabled={!creator} value={st.allyHands} label="Союзники видят руки друг друга" onChange={(v) => set({ allyHands: v })} />
        <Check disabled={!creator} value={st.hints} label={<>Подсказки <span className="menu-hint-per-player">(каждый включает у себя в <Icon name="wheel" size={16}/>)</span></>} onChange={(v) => set({ hints: v })} />
        <div className="menu-reaction-timer"><Icon name="hourglass" size={26}/><span>Время на Реакцию</span><div><button disabled={!creator||st.reactionTimer<=0} aria-label="Уменьшить время на Реакцию" onClick={()=>set({reactionTimer:Math.max(0,st.reactionTimer-15)})}>−</button><output>{st.reactionTimer?st.reactionTimer+' с':'не ограничено'}</output><button disabled={!creator} aria-label="Увеличить время на Реакцию" onClick={()=>set({reactionTimer:st.reactionTimer+15})}>+</button></div></div>
        <p className="menu-room-permissions">Настройки меняет создатель комнаты.</p>
        <details className="menu-advanced"><summary><Arrow chevron/>Ещё</summary>
        <Check disabled={!creator} value={st.allOpen} label="Всё открыто: все руки видны всем (для тестов)" onChange={(v) => set({ allOpen: v })} />
        <label className="row"><span>Адрес сервера</span><input readOnly value={storedServer()||location.origin}/></label>
        <label className="row">
          <span>Номер партии</span>
          <input
            disabled={!creator}
            inputMode="numeric"
            placeholder="случайный"
            data-testid="room-seed"
            value={st.seed ?? ''}
            onChange={(e) => set({ seed: Number(e.target.value) || null })}
          />
        </label>
        </details>

      </section>
      </details>

      <p className="muted menu-room-start-note">Бой начинает создатель комнаты. Пустые места займут боты.</p>
      <div className="row buttons menu-room-actions">
        {creator ? (
          <>
            <button className="btn" onClick={() => client.send({ t: 'coin' })} data-testid="coin-btn">
              Жребий
            </button>
            <button className="btn primary" data-testid="room-start" disabled={people === 0} onClick={() => client.send({ t: 'start' })}>
              <Icon name="sail" size={36}/>Поднять паруса
            </button>
          </>
        ) : (
          <p className="muted">Начинает создатель комнаты.</p>
        )}

      </div>
    </main></MenuSurface>
  );
}

function Check({ value, label, disabled, onChange }: { value: boolean; label: ReactNode; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row check menu-toggle">
      <input type="checkbox" disabled={disabled} checked={value} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span>
    </label>
  );
}

/** The secret placement (RULES.md 2.2): any person of the team chooses; the other team does not see it. */
function NetPlacement({ data, client, room }: { data: GameData; client: NetClient; room: RoomInfo }) {
  const side = room.you.seats.length > 0 ? data.ships.find((x) => x.code === room.you.seats[0])!.side : null;
  const ships = side ? data.ships.filter((x) => x.side === side) : [];
  const [order, setOrder] = useState<[string, string]>(ships.length === 2 ? [ships[0].code, ships[1].code] : ['', '']);
  const placed = side ? room.placed.includes(side) : true;
  const playing = side && room.you.seats.some((x) => !room.seats[x].bot);
  return (
    <MenuSurface kind="prep"><main className="menu-placement" data-testid="placement">
      <header className="setup-head">
        <h1 className="menu-title">{side ? `${SIDE_LABEL[side].name}: кто слева, кто справа?` : 'Команды расставляют корабли'}</h1>
        <ConnectionLine client={client} />
        {client.error && <p className="error">{client.error.text}</p>}
        {room.coin && <p className="note">{room.coin}</p>}
        {side && !placed && (
          <p className="muted">
            Напротив корабль бьёт в полную силу, по диагонали на 1 слабее. Противник увидит расстановку только в начале боя.
          </p>
        )}
      </header>
      {side && playing && !placed ? (
        <>
          <PlacementBoard data={data} side={side} order={order} onSwap={()=>setOrder([order[1],order[0]])}/>
          <div className="row buttons">
            <button className="btn" onClick={() => setOrder([order[1], order[0]])}>
              <Icon name="swap"/>Переставить корабли
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
    </main></MenuSurface>
  );
}
