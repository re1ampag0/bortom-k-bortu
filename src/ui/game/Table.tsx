// Presentational parts of the table: the status bar, a team row with its Hold, a ship board (plank).
import type { ReactNode } from 'react';
import { cardByCode, seaCardByCode, shipData, startValue, type GameState, type ShipState } from '../../engine/state';
import type { GameData, Side, Track } from '../../engine/types';
import { cardsWord } from '../../engine/log';
import { SIDE_LABEL } from './text';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const TRACK_LABEL: Record<Track, string> = { hull: 'Корпус', sails: 'Паруса', guns: 'Пушки', crew: 'Команда' };

export interface Btn {
  key: string;
  label: string;
  onClick: () => void;
  /** Grey with this reason as the hint. */
  disabled?: string | null;
  primary?: boolean;
  testid?: string;
  /** A shorter label for the phone. */
  short?: string;
}

export function Button({ b, className = '' }: { b: Btn; className?: string }) {
  return (
    <button
      className={`btn ${b.primary ? 'primary' : ''} ${className}`}
      onClick={b.disabled ? undefined : b.onClick}
      aria-disabled={!!b.disabled}
      title={b.disabled ?? undefined}
      data-testid={b.testid}
    >
      {b.short ? (
        <>
          <span className="wide">{b.label}</span>
          <span className="narrow">{b.short}</span>
        </>
      ) : (
        b.label
      )}
    </button>
  );
}

export function StatusBar({
  s,
  data,
  instruction,
  waiting,
  onSea,
  extra,
}: {
  s: GameState;
  data: GameData;
  instruction: string;
  waiting: boolean;
  onSea: () => void;
  extra: ReactNode;
}) {
  const sea = s.sea?.current ? seaCardByCode(data, s.sea.current) : null;
  return (
    <header className="status" data-testid="status">
      <div className="status-turn">
        <span className={`dot ${s.active === 'ПИРАТЫ' ? 'pirates' : 'company'}`} aria-hidden />
        <span className="wide">
          Раунд {s.round} · Ход {SIDE_LABEL[s.active].gen}
        </span>
        <span className="narrow">
          Р{s.round} · {SIDE_LABEL[s.active].name}
        </span>
      </div>
      <div className={`status-text ${waiting ? 'waiting' : ''}`} data-testid="instruction">
        {instruction}
      </div>
      <div className="status-tools">
        {sea && (
          <button className="chip sea" onClick={onSea} title={`${sea.name}: ${sea.big}`}>
            <span className="wide">
              <b>Море:</b> {sea.name} <span className="muted">· {sea.big}</span>
            </span>
            <span className="narrow">{sea.name} ⓘ</span>
          </button>
        )}
        {extra}
      </div>
    </header>
  );
}

export function PowderDots({ n, cap }: { n: number; cap: number }) {
  return (
    <span className="powder-dots" aria-label={`${n} Пороха`}>
      {Array.from({ length: cap }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
      <b>{n}</b>
    </span>
  );
}

export function TeamRow({
  side,
  s,
  data,
  hands,
  regroup,
  hint,
}: {
  side: Side;
  s: GameState;
  data: GameData;
  hands: number[] | null;
  regroup: Btn | null;
  hint: string | null;
}) {
  return (
    <div className="team-row" data-testid={`team-${side}`}>
      <b className="team-name">{SIDE_LABEL[side].upper}</b>
      <span className="muted hold-label">Трюм</span>
      <PowderDots n={s.teams[side].powder} cap={data.econ.cap} />
      {hands && hands.length > 0 && <span className="muted wide">· в руках {hands.join(' и ')} {cardsWord(hands[hands.length - 1]).split(' ')[1]}</span>}
      {regroup && <Button b={regroup} className="small regroup" />}
      {hint && <span className="muted wide hint">· {hint}</span>}
    </div>
  );
}

export interface Plate {
  label: string;
  sub?: string;
  onClick: () => void;
  chosen?: boolean;
}

export interface Status {
  label: string;
  hint: string;
}

/** Statuses of a ship with the moment they end (docs/TZ.md, «Принципы стола», п. 2). */
export function statuses(s: GameState, data: GameData, ship: ShipState): Status[] {
  const out: Status[] = [];
  if (ship.sunk) {
    const ally = Object.values(s.ships).find((x) => x.side === ship.side && x.code !== ship.code);
    return [
      ally && !ally.sunk
        ? { label: 'Утонул', hint: 'Капитан на борту союзника: 1 карта и 1 Реакция за ход за союзника' }
        : { label: 'Утонул', hint: 'Корабль потоплен' },
    ];
  }
  if (ship.submerged) out.push({ label: 'Под водой', hint: 'До своего хода: нельзя выбрать целью, не играет Реакции' });
  if (ship.surfaced) out.push({ label: 'Всплыл', hint: 'Первый Залп в этот ход: +1 и без Реакций' });
  if (ship.blockaded) out.push({ label: 'Блокада', hint: 'До конца своего следующего хода: без Ремонта и смены мест' });
  if (ship.parley) out.push({ label: 'Переговоры', hint: 'В свой следующий ход не даёт Залпы' });
  if (ship.voodoo) {
    out.push({ label: 'Кукла вуду', hint: `В свой следующий ход теряет 1 Команду за каждую сыгранную карту (кукла «${shipData(data, ship.voodoo).nick}»)` });
  }
  const mark = s.turn.marks[ship.code];
  if (mark) out.push({ label: `Чёрная метка +${mark}`, hint: 'До конца этого хода: каждый Залп по кораблю сильнее' });
  if (s.turn.noReact.includes(ship.code) || (s.turn.noReactTeam && ship.side !== s.active)) {
    out.push({ label: 'Без Реакций', hint: 'До конца этого хода не играет Реакции' });
  }
  return out;
}

export function Plank({
  s,
  data,
  ship,
  own,
  selected,
  awaiting,
  targeted,
  shooter,
  plate,
  buttons,
  role,
  onSelect,
  onDetails,
  onLegend,
}: {
  s: GameState;
  data: GameData;
  ship: ShipState;
  own: boolean;
  selected: boolean;
  awaiting: boolean;
  targeted: boolean;
  shooter: boolean;
  plate: Plate | null;
  buttons: Btn[];
  role: string | null;
  onSelect: () => void;
  onDetails: () => void;
  onLegend: (() => void) | null;
}) {
  const d = shipData(data, ship.code);
  const st = statuses(s, data, ship);
  const legendName = cardByCode(data, `${ship.code}-Л`).name;
  const legendState = ship.legend ? 'ready' : 'gone';
  const handLabel = cardsWord(ship.hand.length);
  const cls = [
    'plank',
    own ? 'own' : 'enemy',
    selected ? 'selected' : '',
    awaiting ? 'awaiting' : '',
    targeted ? 'targeted' : '',
    shooter ? 'shooter' : '',
    ship.sunk ? 'sunk' : '',
  ].join(' ');
  return (
    <section className={cls} data-testid={`plank-${ship.code}`} style={{ ['--ship' as string]: d.color }} onClick={onSelect}>
      <header
        className="plank-head"
        onClick={(e) => {
          e.stopPropagation();
          onDetails();
        }}
        title="Подробнее о корабле"
      >
        <b className="plank-name">
          <span className="wide">{d.name}</span>
          <span className="narrow">{d.nick}</span>
          {ship.legend && <span className="star narrow" title={`Легенда: ${legendName}`}>★</span>}
        </b>
        <span className="captain wide">{d.captain}</span>
        <span className="plank-role">
          {selected && <span className="tag">ВЫБРАН</span>}
          {role && <span className="tag">{role}</span>}
          <span className="narrow hand-count">{handLabel}</span>
        </span>
      </header>
      {st.length > 0 && (
        <div className="plank-statuses">
          {st.map((x) => (
            <span key={x.label} className="status-chip" title={x.hint}>
              {x.label}
              <span className="wide"> · {x.hint.split(':')[0].toLowerCase()}</span>
            </span>
          ))}
        </div>
      )}
      <div className="plank-body">
        <div className="tracks">
          {TRACKS.map((t) => {
            const max = startValue(data, ship.code, t);
            const v = ship.tracks[t];
            return (
              <div key={t} className={`track t-${t}`}>
                <span className="track-label">{TRACK_LABEL[t]}</span>
                <span className="cells" aria-hidden>
                  {Array.from({ length: max }, (_, i) => (
                    <i key={i} className={i < v ? 'on' : ''} />
                  ))}
                </span>
                <span className="bar" aria-hidden>
                  <i style={{ width: `${(100 * v) / max}%` }} />
                </span>
                <b className={`track-num ${v <= (t === 'crew' ? 1 : 0) && t !== 'hull' ? 'low' : ''}`}>
                  {v}/{max}
                </b>
              </div>
            );
          })}
        </div>
        <div className="badges">
          {ship.fires > 0 && (
            <span className="badge fire" title="Пожар: в начале хода своей команды −1 Корпус за каждый. Потушить — сбросить карту">
              Пожар {ship.fires}
            </span>
          )}
          {d.souls !== undefined && (
            <span className="badge souls" title="Души: платят за карты «Голландца»; +1 за урон по Команде врага">
              Души {ship.souls} / {d.souls}
            </span>
          )}
          {!ship.sunk && (
            <button
              className={`badge legend ${legendState}`}
              onClick={(e) => {
                e.stopPropagation();
                onLegend?.();
              }}
              title={ship.legend ? `Легенда «${legendName}»: нажмите, чтобы прочитать` : 'Легенда сыграна'}
            >
              <span className="wide">Легенда: </span>
              {legendName}
            </button>
          )}
          <span className="badge wide">Рука {ship.hand.length}</span>
          {ship.plans.length > 0 && <span className="badge">Планы {ship.plans.length}</span>}
        </div>
      </div>
      {buttons.length > 0 && (
        <div className="plank-buttons" onClick={(e) => e.stopPropagation()}>
          {buttons.map((b) => (
            <Button key={b.key} b={b} />
          ))}
        </div>
      )}
      {plate && (
        <button
          className={`plate ${plate.chosen ? 'chosen' : ''}`}
          data-testid={`plate-${ship.code}`}
          onClick={(e) => {
            e.stopPropagation();
            plate.onClick();
          }}
        >
          <b>{plate.label}</b> {plate.sub && <span>{plate.sub}</span>}
        </button>
      )}
    </section>
  );
}
