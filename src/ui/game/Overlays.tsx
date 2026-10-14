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
      <section className={`sheet ${wide ? 'sheet-wide' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title} data-testid={testid}>
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

/** The sea: the current card or, by `code`, any sea card (from the log, from «Тиа Дальма»). */
export function SeaSheet({ s, data, code, onClose }: { s: GameState; data: GameData; code?: string; onClose: () => void }) {
  const current = s.sea?.current ?? null;
  const [shown, setShown] = useState(code ?? current);
  const sea = shown ? seaCardByCode(data, shown) : null;
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
      {current && shown !== current && (
        <p className="muted" data-testid="sea-current">
          Сейчас в море:{' '}
          <button className="cref" data-sea={current} onClick={() => setShown(current)}>
            {seaCardByCode(data, current).name}
          </button>
          .
        </p>
      )}
      {s.sea?.peek && s.sea.deck.slice(0, s.sea.peek.n).every((c) => c !== HIDDEN) && (
        <p data-testid="sea-peek">
          Следующие карты моря («Тиа Дальма», их знаете только вы):{' '}
          {s.sea.deck.slice(0, s.sea.peek.n).map((c, i) => (
            <span key={c}>
              {i > 0 && ', '}
              <button className="cref" data-sea={c} onClick={() => setShown(c)}>
                «{seaCardByCode(data, c).name}»
              </button>
            </span>
          ))}
          .
        </p>
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
    <Sheet title={`Сброс «${shipData(data, seat).nick}» · ${ship.discard.length}`} onClose={onClose} wide testid="discard">
      <div className="choice-cards">
        {ship.discard.length === 0 && <p className="muted">Сброс пуст.</p>}
        {[...ship.discard].reverse().map((code, i) => (
          <HandCard key={`${code}-${i}`} data={data} code={code} off={null} />
        ))}
      </div>
    </Sheet>
  );
}

/** A piece of a log line: plain text, or the name of a card or a sea card that opens it. */
export type LogPart = string | { card: string; text: string } | { sea: string; text: string };

/**
 * A log line cut into text and names. Each card of `line.cards` is found as «Название» by an exact search from the
 * end of the previous one (names may hold quotes: «Колокол «Голландца»»); the sea card by its name. A name not found
 * stays plain text.
 */
export function logParts(data: GameData, line: LogLine): LogPart[] {
  const marks: { at: number; part: Exclude<LogPart, string> }[] = [];
  let from = 0;
  for (const code of line.cards) {
    const text = `«${cardByCode(data, code).name}»`;
    const at = line.text.indexOf(text, from);
    if (at < 0) continue;
    marks.push({ at, part: { card: code, text } });
    from = at + text.length;
  }
  if (line.sea) {
    const text = seaCardByCode(data, line.sea).name;
    const at = line.text.indexOf(text);
    if (at >= 0 && !marks.some((m) => at < m.at + m.part.text.length && m.at < at + text.length)) marks.push({ at, part: { sea: line.sea, text } });
  }
  marks.sort((a, b) => a.at - b.at);
  const parts: LogPart[] = [];
  let pos = 0;
  for (const m of marks) {
    if (m.at > pos) parts.push(line.text.slice(pos, m.at));
    parts.push(m.part);
    pos = m.at + m.part.text.length;
  }
  if (pos < line.text.length) parts.push(line.text.slice(pos));
  return parts;
}

export function LogList({
  data,
  log,
  fresh,
  onCard,
  onSea,
}: {
  data: GameData;
  log: LogLine[];
  fresh: number;
  onCard: (code: string) => void;
  onSea: (code: string) => void;
}) {
  const lines = [...log].reverse();
  return (
    <ol className="log-list" data-testid="log">
      {lines.map((l, i) => (
        <li key={log.length - i} className={`log-${l.kind} ${l.action >= fresh ? 'fresh' : ''}`}>
          {logParts(data, l).map((p, j) =>
            typeof p === 'string' ? (
              p
            ) : 'card' in p ? (
              <button key={j} className="cref" data-card={p.card} onClick={() => onCard(p.card)}>
                {p.text}
              </button>
            ) : (
              <button key={j} className="cref" data-sea={p.sea} onClick={() => onSea(p.sea)}>
                {p.text}
              </button>
            ),
          )}
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
          <p className="muted">Учебный фанатский прототип по мотивам «Пиратов Карибского моря». Не для продажи.</p>
        </div>
      )}
    </Sheet>
  );
}

export function SettingsSheet({
  speed,
  setSpeed,
  effects,
  setEffects,
  sound,
  setSound,
  openHands,
  setOpenHands,
  hints,
  setHints,
  canConcede = null,
  onConcede,
  newLabel = 'Новая партия',
  onNew,
  onDownloadLog,
  onDownloadGame = null,
  onClose,
}: {
  /** null — not shown (a network game: the server moves the bots). */
  speed: Speed | null;
  setSpeed: (s: Speed) => void;
  effects: 'rich' | 'simple';
  setEffects: (v: 'rich' | 'simple') => void;
  /** The short sound «ваш ход». */
  sound: boolean;
  setSound: (v: boolean) => void;
  openHands: boolean | null;
  setOpenHands: (v: boolean) => void;
  /** null — the room does not allow hints. */
  hints: boolean | null;
  setHints: (v: boolean) => void;
  canConcede?: Side | null;
  onConcede?: () => void;
  newLabel?: string;
  /** Not given on the start screen (no game yet): the game buttons are not shown. */
  onNew?: () => void;
  onDownloadLog?: () => void;
  onDownloadGame?: (() => void) | null;
  onClose: () => void;
}) {
  return (
    <Sheet title="Настройки" onClose={onClose} testid="settings">
      {speed !== null && (
        <label className="row">
          <span>Скорость показа ходов</span>
          <select value={speed} onChange={(e) => setSpeed(e.target.value as Speed)}>
            {Object.entries(SPEEDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="row">
        <span>Спецэффекты</span>
        <select value={effects} onChange={(e) => setEffects(e.target.value as 'rich' | 'simple')}>
          <option value="rich">Богатые</option>
          <option value="simple">Простые</option>
        </select>
      </label>
      <label className="row check">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} data-testid="sound" /> Звук «ваш ход»
      </label>
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
      {onDownloadLog && (
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
      )}
      {onNew && (
        <div className="row buttons">
          {canConcede && onConcede && (
            <button className="btn danger" onClick={onConcede}>
              Сдаться ({SIDE_LABEL[canConcede].name})
            </button>
          )}
          <button className="btn" onClick={onNew}>
            {newLabel}
          </button>
        </div>
      )}
    </Sheet>
  );
}

export function EndScreen({
  s,
  totals,
  onRematch,
  rematchLabel = 'Реванш',
  onNew,
  newLabel = 'Новая партия',
  onDownloadLog,
  onDownloadGame,
  onClose,
}: {
  s: GameState;
  totals: Record<Side, SideTotals>;
  onRematch: (() => void) | null;
  /** By network: «Реванш (согласны 1 из 2)», or «Отменить реванш» after agreeing. */
  rematchLabel?: string;
  onNew: () => void;
  newLabel?: string;
  onDownloadLog: () => void;
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
              {rematchLabel}
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
