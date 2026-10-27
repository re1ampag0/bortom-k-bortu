// Parts of the table that exist only in a network game: the state of the connection, players who left («Заменить
// ботом»), «Напомнить» received, «Ход окончен» of each player («Ждём союзника…», «Вернуться к ходу»), the vote to give
// up, and «Пока вас не было» after the player was away.
import { useEffect, useState, useRef, type ReactNode } from 'react';
import type { Side } from '../../engine/types';
import { LOST_MS, type NetGame } from '../../net/ws';
import { SIDE_LABEL } from './text';
import {Sheet} from './Overlays';

/** The captain offered a Charge for the ally's Volley (P6): the ally decides; «Отозвать». */
export function OfferPanel({ title, onWithdraw }: { title: string; onWithdraw: () => void }) {
  return (
    <section className="panel" data-testid="offer-panel">
      <div className="panel-head">
        <b>{title}</b>
        <span className="panel-sub">Залп даёт союзник: он решит, брать ли Заряд</span>
        <button className="btn" data-testid="offer-cancel" onClick={onWithdraw}>
          Отозвать
        </button>
      </div>
    </section>
  );
}

/** A thin bar over the table, only when there is something to say. */
export function NetBar({ game }: { game: NetGame }) {
  const client = game.client;
  const [now, setNow] = useState(Date.now());
  const offline = client.connection !== 'online';
  useEffect(() => {
    if (!offline && client.lostAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [offline, client.lostAt]);

  const [reminded, setReminded] = useState<string | null>(null);
  useEffect(() => {
    if (!client.reminded) return;
    setReminded(`Вас ждут: напоминает ${client.reminded.by}`);
    try {
      navigator.vibrate?.(200);
    } catch {
      // Not every browser can vibrate.
    }
    const t = setTimeout(() => setReminded(null), 5000);
    return () => clearTimeout(t);
  }, [client.reminded, client.reminded?.n]);

  const room = game.room;
  const me = room.you.id;
  const canReplace = room.you.creator || (!room.creatorOnline && room.you.seats.length > 0);
  const away = [...new Set(Object.values(room.seats).filter((x) => x.player && x.player !== me && !x.bot && !x.online).map((x) => x.player!))];

  const [lost,setLost]=useState<string|null>(null),seen=useRef(new Set<string>());
  const absentKey=away.join('|');
  useEffect(()=>{
    for(const id of away)if(!seen.current.has(id)){seen.current.add(id);if(room.you.creator&&!game.state.winner)setLost(id);}
    for(const id of seen.current)if(!away.includes(id))seen.current.delete(id);
  },[absentKey,room.you.creator,game.state.winner]);
  const missing=Object.entries(room.seats).filter(([,x])=>x.player===lost&&!x.bot&&!x.online);
  const items: ReactNode[] = [];
  if (offline) {
    const long = client.lostAt !== null && now - client.lostAt > LOST_MS;
    items.push(
      <p key="conn" className="net-line bad" data-testid="net-offline">
        {long ? 'Сервер недоступен: проверьте, что ноутбук с игрой не уснул и вы в той же сети. Переподключаемся…' : 'Нет связи с сервером: переподключаемся…'}
      </p>,
    );
  }
  if (reminded) {
    items.push(
      <p key="remind" className="net-line remind" data-testid="reminded">
        {reminded}
      </p>,
    );
  }
  for (const id of away) {
    const seat = Object.entries(room.seats).find(([, x]) => x.player === id)!;
    items.push(
      <p key={id} className="net-line">
        {seat[1].name} не в сети.{' '}
        {canReplace && !game.state.winner && lost!==id && (
          <button className="btn small" onClick={() => game.replace(seat[0])} data-testid={`replace-${seat[0]}`}>
            Заменить ботом
          </button>
        )}
      </p>,
    );
  }
  if (items.length === 0 && !lost) return null;
  return <><div className="net-bar">{items}</div>{lost&&<Sheet title={missing.length?'Друг вышел из игры':'Друг вернулся в игру'} onClose={()=>setLost(null)} testid="friend-left" foot={<div className="row buttons">{missing.length>0&&<button className="btn primary" data-testid={`replace-${missing[0][0]}`} onClick={()=>{for(const [code]of missing)game.replace(code);setLost(null);}}>Занять место ботом</button>}<button className="btn" data-testid="friend-wait" onClick={()=>setLost(null)}>{missing.length?'Подождать':'Продолжить'}</button></div>}><p>{missing.map(([code])=>game.data.ships.find(ship=>ship.code===code)?.name??code).join(', ')}{missing.length?`${missing.length>1?' ждут капитанов.':' ждёт капитана.'} Друг может вернуться по ссылке комнаты.`:'Снова на борту.'}</p></Sheet>}</>;
}

/**
 * The panel in the middle for a network player who is not deciding now: their «Ход окончен» waits for the ally
 * (with «Вернуться к ходу»), or a vote «Сдаться» waits. null — nothing to show (the middle shows the last event).
 */
export function netDock(game: NetGame, mySeats: string[], bottom: Side, nick: (code: string) => string): ReactNode {
  const s = game.state;
  if (s.winner || mySeats.length === 0) return null;
  const allies = Object.values(s.ships).filter((x) => x.side === bottom && !mySeats.includes(x.code)).map((x) => x.code);
  const people = allies.filter((x) => !game.isBotSeat(x));
  const iVoted = mySeats.every((x) => game.concede.includes(x));
  const allyVoted = people.length > 0 && people.every((x) => game.concede.includes(x));
  if (iVoted) {
    return (
      <section className="panel" data-testid="concede-wait">
        <div className="panel-head">
          <b>Вы предложили сдаться</b>
          <span className="panel-sub">команда сдастся, когда «Сдаться» нажмёт и союзник</span>
          <button className="btn" onClick={() => game.voteConcede(false)}>
            Не сдаваться
          </button>
        </div>
      </section>
    );
  }
  if (allyVoted) {
    return (
      <section className="panel" data-testid="concede-ask">
        <div className="panel-head">
          <b>Союзник предлагает сдаться за {SIDE_LABEL[bottom].acc}</b>
          <button className="btn danger" onClick={() => game.voteConcede(true)}>
            Сдаться
          </button>
        </div>
      </section>
    );
  }
  const myTeamTurn = s.active === bottom && !s.pending;
  if (myTeamTurn && mySeats.every((x) => game.ready.includes(x))) {
    const waiting = people.filter((x) => !game.ready.includes(x));
    const bots = allies.filter((x) => game.isBotSeat(x) && !s.ships[x].sunk);
    const text =
      waiting.length > 0
        ? `Ждём союзника: ${waiting.map((x) => game.nameOf(x) ?? nick(x)).join(', ')} ещё ходит…`
        : bots.length > 0
          ? `Ходит бот ${bots.map(nick).join(', ')}…`
          : 'Ход переходит…';
    return (
      <section className="panel ending" data-testid="wait-ally">
        <div className="panel-head">
          <b>Ход окончен</b>
          <span className="panel-sub">{text}</span>
          {waiting.length > 0 && (
            <button className="btn" data-testid="back-to-turn" onClick={() => game.setReady(false)}>
              Вернуться к ходу
            </button>
          )}
        </div>
      </section>
    );
  }
  return null;
}

/** «Пока вас не было»: what happened while the player was away (a reload, the connection lost, Safari asleep). */
/** The lines «Пока вас не было» shows; none — no sheet (Game: the sheet «Заряд» knows a window lies over it). */
export const missedLines = (game: NetGame) => game.missed.filter((l) => l.kind === 'action' || l.kind === 'damage' || l.kind === 'round' || l.kind === 'end');

export function MissedSheet({ game }: { game: NetGame }) {
  const lines = missedLines(game);
  if (lines.length === 0) return null;
  return (
    <div className="sheet-backdrop" onClick={() => game.clearMissed()}>
      <section className="sheet" onClick={(e) => e.stopPropagation()} data-testid="missed">
        <header className="sheet-head">
          <b>Пока вас не было</b>
        </header>
        <div className="sheet-body">
          <ul className="missed-list">
            {lines.slice(-12).map((l, i) => (
              <li key={i}>{l.text}</li>
            ))}
          </ul>
          {lines.length > 12 && <p className="muted">Раньше: ещё {lines.length - 12} в журнале.</p>}
          <button className="btn primary" onClick={() => game.clearMissed()} autoFocus>
            Продолжить
          </button>
        </div>
      </section>
    </div>
  );
}
