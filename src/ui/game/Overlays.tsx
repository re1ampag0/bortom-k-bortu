// Things that appear when needed and go away after (docs/TZ.md, «Принципы стола», п. 1, 8): a card in full,
// a ship, the sea card, a discard, the log, the rules, the settings menu and the end of the game.
import { useMemo, useState, type ReactNode } from 'react';
import rulesText from '../../../RULES.md?raw';
import type { SideTotals } from '../../engine/match';
import type { LogLine } from '../../engine/log';
import { cardByCode, seaCardByCode, shipData, type GameState } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import { HIDDEN } from '../../engine/view';
import { RichText } from '../RichText';
import type { Speed } from '../storage';
import { cardClass, CostBadge, HandCard } from './Hand';
import { memo } from './memo';
import { statuses, type Btn } from './Table';
import { SIDE_LABEL, SPEEDS } from './text';

/** A window over the table: on a laptop in the middle, on a phone a bottom sheet. Closed by the cross or outside. */
export function Sheet({ title, onClose, children, wide, testid }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; testid?: string }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className={`sheet ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title} data-testid={testid}>
        <header className="sheet-head">
          <b>{title}</b>
          <button className="btn small close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}

export function CardDetail({
  data,
  code,
  status,
  buttons,
  onClose,
}: {
  data: GameData;
  code: string;
  /** «Сыграть: ✓» or the reason why not. */
  status: string | null;
  buttons: Btn[];
  onClose: () => void;
}) {
  if (code === HIDDEN) return null;
  const c = cardByCode(data, code);
  return (
    <Sheet title={c.name} onClose={onClose} testid="card-detail">
      <article className={`card-full ${cardClass(c)}`}>
        <header className="card-full-head">
          <span>{c.legend ? `Легенда · ${c.type}` : c.type}</span>
          <CostBadge c={c} />
        </header>
        <div className="card-big">{c.big}</div>
        <p>
          <RichText html={c.text} />
        </p>
        <p className="card-flavor">{c.flavor}</p>
        <p className="muted small">
          Стоимость: {c.cost} Пороха{c.soul ? `, ${c.soul} Души` : ''} · {shipData(data, c.deck).nick}
        </p>
      </article>
      {status && <p className={`why ${status.startsWith('Можно') ? 'ok' : ''}`}>{status}</p>}
      {buttons.length > 0 && (
        <div className="panel-actions wrap">
          {buttons.map((b) => (
            <button
              key={b.key}
              className={`btn ${b.primary ? 'primary' : ''}`}
              aria-disabled={!!b.disabled}
              title={b.disabled ?? undefined}
              data-testid={b.testid}
              onClick={() => !b.disabled && b.onClick()}
            >
              {b.label}
              {b.disabled && <span className="btn-why">{b.disabled}</span>}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export function ShipSheet({ s, data, code, onClose, onDiscard }: { s: GameState; data: GameData; code: string; onClose: () => void; onDiscard: () => void }) {
  const d = shipData(data, code);
  const ship = s.ships[code];
  const legend = cardByCode(data, `${code}-Л`);
  return (
    <Sheet title={d.name} onClose={onClose} testid="ship-sheet">
      <p className="muted">
        {d.captain} · {SIDE_LABEL[d.side].name}. <i>{d.motto}</i>
      </p>
      {statuses(s, data, ship).map((x) => (
        <p key={x.label} className="status-line">
          <b>{x.label}:</b> {x.hint}
        </p>
      ))}
      <h3>Особенности</h3>
      {d.abilities.map((a) => (
        <p key={a.name}>
          <b>{a.name}.</b> <RichText html={a.text} />
        </p>
      ))}
      <h3>
        Легенда «{legend.name}» · {legend.cost} {legend.soul ? `П, ${legend.soul} Д` : 'П'}
        {ship.legend ? '' : ' — сыграна или ушла из игры'}
      </h3>
      <p className={ship.legend ? '' : 'struck'}>
        <RichText html={legend.text} />
      </p>
      <p>
        <button className="link" onClick={onDiscard}>
          Сброс: {ship.discard.length} · Колода: {ship.deck.length} · Рука: {ship.hand.length}
          {ship.plans.length ? ` · Планы: ${ship.plans.length}` : ''}
        </button>
      </p>
    </Sheet>
  );
}

export function SeaSheet({ s, data, onClose }: { s: GameState; data: GameData; onClose: () => void }) {
  const sea = s.sea?.current ? seaCardByCode(data, s.sea.current) : null;
  return (
    <Sheet title={sea ? `Море: ${sea.name}` : 'Море'} onClose={onClose}>
      {sea ? (
        <>
          <p className="muted">{sea.when}</p>
          <p className="card-big">{sea.big}</p>
          <p>
            <RichText html={sea.text} />
          </p>
          <p className="card-flavor">{sea.flavor}</p>
        </>
      ) : (
        <p>Партия без колоды моря.</p>
      )}
      {s.sea && (
        <p className="muted">
          В колоде моря {s.sea.deck.length}, в сбросе {s.sea.discard.length}
          {s.sea.discard.length > 0 && `: ${s.sea.discard.map((c) => seaCardByCode(data, c).name).join(', ')}`}.
        </p>
      )}
    </Sheet>
  );
}

export function DiscardSheet({ s, data, seat, onClose }: { s: GameState; data: GameData; seat: string; onClose: () => void }) {
  const ship = s.ships[seat];
  return (
    <Sheet title={`Сброс «${shipData(data, seat).nick}» · ${ship.discard.length}`} onClose={onClose} wide>
      <div className="choice-cards">
        {ship.discard.length === 0 && <p className="muted">Сброс пуст.</p>}
        {[...ship.discard].reverse().map((code, i) => (
          <HandCard key={`${code}-${i}`} data={data} code={code} off={null} />
        ))}
      </div>
    </Sheet>
  );
}

export function LogList({ log, fresh }: { log: LogLine[]; fresh: number }) {
  const lines = [...log].reverse();
  return (
    <ol className="log-list" data-testid="log">
      {lines.map((l, i) => (
        <li key={log.length - i} className={`log-${l.kind} ${l.action >= fresh ? 'fresh' : ''}`}>
          {l.text}
        </li>
      ))}
    </ol>
  );
}

export function RulesSheet({ data, onClose }: { data: GameData; onClose: () => void }) {
  const [q, setQ] = useState('');
  const paragraphs = useMemo(() => rulesText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean), []);
  const query = q.trim().toLowerCase();
  const found = query.length >= 2 ? paragraphs.filter((p) => p.toLowerCase().includes(query)).slice(0, 40) : [];
  return (
    <Sheet title="Правила" onClose={onClose} wide testid="rules">
      <input className="search" placeholder="Поиск по своду правил (RULES.md)…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {query.length >= 2 ? (
        <div className="rules-found">
          {found.length === 0 && <p className="muted">Ничего не найдено.</p>}
          {found.map((p, i) => (
            <p key={i}>{p.replace(/\*\*/g, '').replace(/`/g, '')}</p>
          ))}
        </div>
      ) : (
        <div className="memo">
          {memo(data).map((m) => (
            <section key={m.title}>
              <h3>{m.title}</h3>
              {m.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export function SettingsSheet({
  speed,
  setSpeed,
  openHands,
  setOpenHands,
  hints,
  setHints,
  canConcede,
  onConcede,
  newLabel = 'Новая партия',
  onNew,
  onDownloadLog,
  onDownloadGame,
  onClose,
}: {
  /** null — not shown (a network game: the server moves the bots). */
  speed: Speed | null;
  setSpeed: (s: Speed) => void;
  openHands: boolean | null;
  setOpenHands: (v: boolean) => void;
  /** null — the room does not allow hints. */
  hints: boolean | null;
  setHints: (v: boolean) => void;
  canConcede: Side | null;
  onConcede: () => void;
  newLabel?: string;
  onNew: () => void;
  onDownloadLog: () => void;
  onDownloadGame: (() => void) | null;
  onClose: () => void;
}) {
  return (
    <Sheet title="Настройки" onClose={onClose} testid="settings">
      {speed !== null && (
        <label className="row">
          <span>Скорость показа ходов ботов</span>
          <select value={speed} onChange={(e) => setSpeed(e.target.value as Speed)}>
            {Object.entries(SPEEDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {openHands !== null && (
        <label className="row check">
          <input type="checkbox" checked={openHands} onChange={(e) => setOpenHands(e.target.checked)} /> Открытые руки (все
          руки видны, без заставок)
        </label>
      )}
      {hints !== null ? (
        <label className="row check">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Подсказки (урон Зарядов и на
          целях, «4 → 2» у Реакций, зелёный «Ход окончен», «Залп не дан…»)
        </label>
      ) : (
        <p className="row muted">Подсказки в этой комнате выключены.</p>
      )}
      <div className="row buttons">
        <button className="btn" onClick={onDownloadLog}>
          Скачать журнал
        </button>
        {onDownloadGame && (
          <button className="btn" onClick={onDownloadGame}>
            Скачать партию
          </button>
        )}
      </div>
      <div className="row buttons">
        {canConcede && (
          <button className="btn danger" onClick={onConcede}>
            Сдаться ({SIDE_LABEL[canConcede].name})
          </button>
        )}
        <button className="btn" onClick={onNew}>
          {newLabel}
        </button>
      </div>
    </Sheet>
  );
}

export function EndScreen({
  s,
  totals,
  onRematch,
  onNew,
  newLabel = 'Новая партия',
  onDownloadLog,
  onDownloadGame,
  onClose,
}: {
  s: GameState;
  totals: Record<Side, SideTotals>;
  /** null — no rematch (a network game). */
  onRematch: (() => void) | null;
  onNew: () => void;
  newLabel?: string;
  onDownloadLog: () => void;
  /** null — the record is not available (a network game: hidden cards). */
  onDownloadGame: (() => void) | null;
  onClose: () => void;
}) {
  const w = s.winner;
  const title = w === 'НИЧЬЯ' ? 'Ничья' : w ? `Победа: ${SIDE_LABEL[w].name}` : '';
  return (
    <div className="sheet-backdrop end">
      <section className="sheet end-screen" data-testid="end-screen">
        <h1>{title}</h1>
        <p className="muted">Раундов: {s.round}</p>
        <table className="end-table">
          <thead>
            <tr>
              <th />
              <th>Пираты</th>
              <th>Компания</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Нанесено урона</td>
              <td>{totals.ПИРАТЫ.damage}</td>
              <td>{totals.КОМПАНИЯ.damage}</td>
            </tr>
            <tr>
              <td>Получено Пороха</td>
              <td>{totals.ПИРАТЫ.income}</td>
              <td>{totals.КОМПАНИЯ.income}</td>
            </tr>
            <tr>
              <td>Потрачено Пороха</td>
              <td>{totals.ПИРАТЫ.spent}</td>
              <td>{totals.КОМПАНИЯ.spent}</td>
            </tr>
          </tbody>
        </table>
        <div className="panel-actions wrap">
          {onRematch && (
            <button className="btn primary" onClick={onRematch} data-testid="rematch">
              Реванш
            </button>
          )}
          <button className={`btn ${onRematch ? '' : 'primary'}`} onClick={onNew}>
            {newLabel}
          </button>
          <button className="btn" onClick={onDownloadLog}>
            Скачать журнал
          </button>
          {onDownloadGame && (
            <button className="btn" onClick={onDownloadGame}>
              Скачать партию
            </button>
          )}
          <button className="link" onClick={onClose}>
            Посмотреть стол
          </button>
        </div>
      </section>
    </div>
  );
}
