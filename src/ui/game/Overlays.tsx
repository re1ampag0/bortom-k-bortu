import {WeatherWindow} from './weather-window/WeatherWindow';
// Things that appear when needed and go away after (docs/TZ.md, «Принципы стола», п. 1, 8): a card in full,
// a ship, the sea card, a discard, the log, the rules, the settings menu and the end of the game.
import { memo as reactMemo, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {RulesWindow} from '../menus/RulesWindow';
import {Icon} from '../menus/Menus';
import type { LogLine } from '../../engine/log';
import { cardByCode, seaCardByCode, shipData, type GameState } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import { HIDDEN } from '../../engine/view';
import { RichText } from '../RichText';
import { clearFxErrors, loadFxErrors, loadSettings, storeSettings, type TableView, type Speed } from '../storage';
import { clearTrace, loadTrace } from './fx/trace';
import { cardClass, CostBadge, HandCard } from './Hand';
import { type Btn } from './Table';
import { CELLS } from './art/cells';
import { logMarks } from './logBook';
import { roman, SIDE_LABEL, SPEEDS } from './text';
import {loadShipWindow} from './scene-window/loadWindows';
const ShipWindow=lazy(()=>loadShipWindow().then(module=>({default:module.ShipWindow})));
import type {FxStore} from './fx/FxLayer';

/** The windows open now, the last on top: Esc closes the top one only (fix-ui). */
const ESC: { current: () => void }[] = [];
let escOn = false;
function onEsc(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !ESC.length || e.defaultPrevented) return;
  e.preventDefault();
  ESC[ESC.length - 1].current();
}
/** fix-ui: Esc closes this window (a sheet, the book of the log). */
export function useEscape(onClose: () => void) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    ESC.push(ref);
    if (!escOn) addEventListener('keydown', onEsc), (escOn = true);
    return () => {
      ESC.splice(ESC.indexOf(ref), 1);
      if (!ESC.length) removeEventListener('keydown', onEsc), (escOn = false);
    };
  }, []);
}

/** A window over the table: on a laptop in the middle, on a phone a bottom sheet. Closed by the cross, outside or Esc. */
export function Sheet({ title, onClose, children, wide, testid, foot }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; testid?: string; foot?: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className={`sheet ${wide ? 'sheet-wide' : ''} ${foot ? 'with-foot' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title} data-testid={testid}>
        <header className="sheet-head">
          <b>{title}</b>
          <button className="btn small close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {/* fix-ui: the buttons at the bottom stay in sight, the middle scrolls */}
        {foot && <footer className="sheet-foot">{foot}</footer>}
      </section>
    </div>
  );
}

/**
 * ui-fixes: «Начать новую партию?», «Сдаться?», «Выйти из комнаты?» — asked from «Настройки», so they open as a window of the
 * same kind (the backdrop, in the middle on a laptop, a sheet from the bottom on a phone), not as a panel over the sea.
 */
export function ConfirmSheet({ title, sub, yes, onYes, onNo }: { title: string; sub: string; yes: string; onYes: () => void; onNo: () => void }) {
  return (
    <Sheet
      title={title}
      onClose={onNo}
      testid="confirm-sheet"
      foot={
        <div className="row buttons">
          <button className="btn" onClick={onNo}>
            Отмена
          </button>
          <button className="btn primary" data-testid="confirm-yes" onClick={onYes}>
            {yes}
          </button>
        </div>
      }
    >
      <p className="confirm-sub">{sub}</p>
    </Sheet>
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

export function ShipSheet({s,data,code,store,onClose,onDiscard}:{s:GameState;data:GameData;code:string;store:FxStore;onClose:()=>void;onDiscard:()=>void}) {
  useEscape(onClose);
  return <Suspense fallback={null}><ShipWindow s={s} data={data} code={code} store={store} onClose={onClose} onDiscard={onDiscard}/></Suspense>;
}

/** The sea: the current card or, by `code`, any sea card (from the log, from «Тиа Дальма»). */
export function SeaSheet({s,data,code,log=[],store,onClose}:{s:GameState;data:GameData;code?:string;store?:FxStore;log?:readonly LogLine[];onClose:()=>void}){
 useEscape(onClose);return <WeatherWindow store={store} s={s} data={data} code={code} log={log} onClose={onClose}/>;
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

/** The icons of the lines of «Судовой журнал» (A5, LOGICON of docs/mockups/a5/fx/src/template.html). */
const LOG_ICON = {
  volley: ['Залп', CELLS.GUN.replace('width="22" height="14"', 'width="20" height="13"')],
  card: ['Сыгранная карта', '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5 H11.5 Q13 2.5 13 4 V12 Q13 13.5 11.5 13.5 H4.5 Q3 13.5 3 12 Z" fill="#efe3c8" stroke="#8e2b22" stroke-width="1"/><path d="M5 5.5 H11 M5 7.8 H11 M5 10.1 H9" stroke="#8e2b22" stroke-width=".9"/><path d="M2 3.5 Q2 2 3.5 2 H5 V4 H2 Z" fill="#8e2b22"/></svg>'],
  powder: ['Порох', CELLS.KEG.replace('width="22" height="28"', 'width="12" height="15"')],
  reaction: ['Реакция', '<svg width="15" height="16" viewBox="0 0 15 16" aria-hidden="true"><path d="M7.5 1.2 L13.4 3.2 V7.6 Q13.4 12.2 7.5 14.8 Q1.6 12.2 1.6 7.6 V3.2 Z" fill="#efe3c8" stroke="#8e2b22" stroke-width="1.1"/><path d="M7.5 3.6 V12.4 M3.8 6.6 H11.2" stroke="#8e2b22" stroke-width="1"/></svg>'],
  sea: ['Море', '<svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true"><path d="M5 6.5 Q2.4 6.5 2.4 4.6 Q2.4 2.8 4.6 2.9 Q5.3 .9 7.8 1 Q10.1 1.1 10.7 3 Q13.6 2.8 13.8 4.9 Q14 6.5 12 6.5 Z" fill="#4a4d52" stroke="#1f2226" stroke-width=".6"/><path d="M1 10 Q3 8.4 5 10 T9 10 T13 10 T17 10 M1 13 Q3 11.4 5 13 T9 13 T13 13 T17 13" fill="none" stroke="#2f4f66" stroke-width="1.2" stroke-linecap="round"/></svg>'],
  repair: ['Ремонт', '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14 L9 7" stroke="#6b4a24" stroke-width="2.4" stroke-linecap="round"/><path d="M8 3.6 L12.4 2 L14 6.4 L11.4 7.4 Z" fill="#555" stroke="#2a2521" stroke-width=".8"/></svg>'],
  legend: ['Легенда', '<svg width="17" height="15" viewBox="0 0 17 15" aria-hidden="true"><path d="M1.6 4.4 L5 8 L8.5 1.6 L12 8 L15.4 4.4 L14 12 H3 Z" fill="#e0bd62" stroke="#6e4c14" stroke-width=".9" stroke-linejoin="round"/><path d="M3 12 H14 V13.8 H3 Z" fill="#c9a048" stroke="#6e4c14" stroke-width=".8"/><circle cx="8.5" cy="1.6" r="1.1" fill="#a3271d"/><circle cx="1.6" cy="4.4" r=".9" fill="#a3271d"/><circle cx="15.4" cy="4.4" r=".9" fill="#a3271d"/></svg>'],
  other: ['Запись', '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#b9a27a" stroke="#6b5a40" stroke-width=".8"/></svg>'],
} as const;
export type LogIcon = keyof typeof LOG_ICON;

/**
 * The icon of a line of the log, by what the log already tells apart: the sea card of the line, a Legend or a Reaction
 * among its cards, a Repair (the hammer, PH 5), any other card, a Volley or a hit (the words the log itself writes), Powder; the rest — neutral.
 */
export function logIcon(data: GameData, line: LogLine): LogIcon {
  if (line.sea) return 'sea';
  if (/(^|: )Залп |^Попадание |^Залп /.test(line.text)) return 'volley';
  if (line.cards.some((c) => c.endsWith('-Л'))) return 'legend';
  if (line.cards.some((c) => cardByCode(data, c).type === 'РЕАКЦИЯ')) return 'reaction';
  if (line.cards.some((c) => cardByCode(data, c).type === 'РЕМОНТ')) return 'repair';
  if (line.cards.length) return 'card';
  if (/Порох/.test(line.text)) return 'powder';
  return 'other';
}

// memo (ui-press): the column of the log is drawn on every render of the table, also where it is hidden (a phone)
export const LogList = reactMemo(function LogList({
  data,
  log,
  full,
  chrono,
  fresh,
  onCard,
  onSea,
}: {
  data: GameData;
  log: LogLine[];
  /** The whole log the lines come from (a part of it, «Что было за ход»): the turns of «раунд·ход» are counted on it. */
  full?: LogLine[];
  /** The book (LogBook): the oldest line first, as written; otherwise the newest first. */
  chrono?: boolean;
  fresh: number;
  onCard: (code: string) => void;
  onSea: (code: string) => void;
}) {
  const all = full ?? log;
  // the log grows in place (the same array): its length is a dependency too
  const marks = useMemo(() => {
    const m = logMarks(all);
    return new Map(all.map((l, i) => [l, m[i]]));
  }, [all, all.length]);
  const lines = chrono ? log : [...log].reverse();
  // PH 5: a page of the ship's book — on the margin the icon of the line and «раунд·ход», the line in ink, the cards
  // underlined in bordeaux, a vignette between the rounds, the lines shown now under a yellow marker
  return (
    <ol className="log-list" data-testid="log">
      {lines.map((l, i) => (
        <li key={chrono ? i : log.length - i} className={`log-${l.kind} ${l.kind === 'round' && /^Раунд \d+\.?$/.test(l.text) ? 'log-sep' : ''} ${l.action >= fresh ? 'fresh' : ''}`}>
          {l.kind === 'round' && /^Раунд \d+\.?$/.test(l.text) ? (
            <span className="log-round-line">
              <i className="lr-orn" aria-hidden />
              <span className="lr-dash">— </span>
              {l.text.replace(/\.$/, '').replace(/\d+/, (n) => roman(Number(n)))}
              <span className="lr-dash"> —</span>
              <i className="lr-orn flip" aria-hidden />
            </span>
          ) : (
            <>
              <span className="log-mark">
                <i className="log-ico" title={LOG_ICON[logIcon(data, l)][0]} aria-label={LOG_ICON[logIcon(data, l)][0]} dangerouslySetInnerHTML={{ __html: LOG_ICON[logIcon(data, l)][1] }} />
                <span className="log-rt">{marks.get(l) ?? ''}</span>
              </span>
              <span className="log-text">
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
              </span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
});

export function RulesSheet({data,onClose}:{data:GameData;onClose:()=>void}){useEscape(onClose);return <RulesWindow data={data} onClose={onClose}/>;}

/** «Версия: 1a2b3c4 · сборка 17.10, 23:40» — at once visible whether the site or the server is updated. */
function appVersion(): string {
  const built = new Date(__APP_BUILT__).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return __APP_COMMIT__ ? `${__APP_COMMIT__} · сборка ${built}` : `сборка ${built}`;
}

/** A two-way switch of ⚙ «Вид стола» (A5Rig: a pill, the chosen half is dark oak). */
function Switch3<T extends string>({ label, id, value, onChange, options }: { label: string; id: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="row view-row">
      <b>{label}</b>
      <span className="view-switch" role="group" aria-label={label}>
        {options.map(([k, name]) => (
          <button key={k} type="button" aria-pressed={value === k} data-testid={`view-${id}-${k}`} onClick={() => onChange(k)}>
            {name}
          </button>
        ))}
      </span>
    </div>
  );
}

export function SettingsSheet({
  speed,
  setSpeed,
  effects,
  setEffects,
  sound,
  setSound,
  fastEnd,
  setFastEnd,
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
  onView,
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
  /** «Быстрый конец хода»: the countdown of «Ход окончен» is 1 s instead of 3 s. */
  fastEnd: boolean;
  setFastEnd: (v: boolean) => void;
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
  /** The table shows the new «Вид стола» at once (the choice is kept with the settings here). */
  onView?: (v: TableView) => void;
  onClose: () => void;
}) {
  const [view, setViewState] = useState(() => loadSettings().view);
  const setView = (v: TableView) => {
    setViewState(v);
    storeSettings({ ...loadSettings(), view: v });
    onView?.(v);
  };
  // The errors of the animation layer on this device: a player sends a screenshot of them (the show skips a broken clip).
  const [fxErrors, setFxErrors] = useState(loadFxErrors);
  const [fxTrace, setFxTrace] = useState(loadTrace);
  // A finger on the table skips the show only when asked for (a mouse click always does); kept with the settings.
  const [tapSkip, setTapSkipState] = useState(() => loadSettings().tapSkip);
  const setTapSkip = (v: boolean) => {
    setTapSkipState(v);
    storeSettings({ ...loadSettings(), tapSkip: v });
  };
  const foot =
    onDownloadLog || onNew ? (
      <>
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
                Сдаться за {SIDE_LABEL[canConcede].gen}
              </button>
            )}
            <button className="btn" onClick={onNew}>
              {newLabel}
            </button>
          </div>
        )}
      </>
    ) : undefined;
  return (
    <Sheet title={<span className="menu-settings-title"><Icon name="wheel" size={38}/>Настройки</span>} onClose={onClose} testid="settings" foot={foot}>
      <h3 className="menu-settings-section"><Icon name="lantern"/>Показ</h3>
      {speed!==null&&<div className="row"><span>Скорость показа ходов</span><span className="view-switch" role="group" aria-label="Скорость показа ходов">{Object.keys(SPEEDS).map(k=><button key={k} aria-pressed={speed===k} onClick={()=>setSpeed(k as Speed)}>{{slow:'Медленно',normal:'Обычно',fast:'Быстро',instant:'Мгновенно'}[k]}</button>)}</span></div>}
      <div className="row"><span>Спецэффекты</span><span className="view-switch" role="group" aria-label="Спецэффекты">{(['rich','simple']as const).map(v=><button key={v} aria-pressed={effects===v} onClick={()=>setEffects(v)}>{v==='rich'?'Полные':'Простые'}</button>)}</span></div>
      <h3 className="menu-settings-section"><Icon name="bell"/>Игра</h3>

      <label className="row check">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} data-testid="sound" /> Звук «ваш ход»
      </label>
      <label className="row check">
        <input type="checkbox" checked={fastEnd} onChange={(e) => setFastEnd(e.target.checked)} data-testid="fast-end" /> Быстрый конец хода: 1 с вместо 3 с
      </label>
      {openHands !== null && (
        <label className="row check">
          <input type="checkbox" checked={openHands} onChange={(e) => setOpenHands(e.target.checked)} /> Открытые руки (все
          руки видны, без заставок)
        </label>
      )}
      {hints !== null ? (
        <label className="row check">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} />
          <span>Подсказки: урон на целях, «4 → 2» на Реакциях</span>
        </label>
      ) : (
        <p className="row muted">Подсказки в этой комнате выключены.</p>
      )}
      <label className="row check">
        <input type="checkbox" checked={tapSkip} onChange={(e) => setTapSkip(e.target.checked)} data-testid="tap-skip" /> Пропуск
        анимации касанием стола (телефон)
      </label>
      <section className="view-switches" data-testid="table-view" aria-label="Вид стола">
        <h3 className="menu-settings-section"><Icon name="compass"/>Вид стола</h3>
        <Switch3 label="Залп на планшете" id="guns" value={view.guns} onChange={(guns) => setView({ ...view, guns })} options={[['icons', 'Значки'], ['ports', 'Порты']]} />
        <Switch3 label="Фон" id="hand" value={view.hand} onChange={(hand) => setView({ ...view, hand })} options={[['deck', 'Палуба'], ['table', 'Стол капитана']]} />
        <Switch3 label="Разбор урона" id="damage" value={view.damage} onChange={(damage) => setView({ ...view, damage })} options={[['show', 'Показывать'], ['hide', 'Скрыть']]} />
        <Switch3 label="Рамка моря" id="frame" value={view.frame} onChange={(frame) => setView({ ...view, frame })} options={[['bulwark', 'Фальшборт'], ['brass', 'Латунь']]} />
      </section>
      {fxErrors.length > 0 && (
        <div className="row fx-errors" data-testid="fx-errors">
          <b>Ошибки анимаций ({fxErrors.length})</b>
          <span className="muted">Анимация пропустила эти показы. Пришлите скриншот разработчику.</span>
          <ol>
            {fxErrors.map((x, i) => (
              <li key={i}>
                <code>
                  {x.at.slice(5, 16).replace('T', ' ')} · {x.clip} · {x.width}px — {x.text}
                </code>
              </li>
            ))}
          </ol>
          <button
            className="btn small"
            onClick={() => {
              clearFxErrors();
              setFxErrors([]);
            }}
          >
            Очистить
          </button>
        </div>
      )}
      {fxTrace.length > 0 && (
        <details className="row fx-errors" data-testid="fx-trace">
          <summary>Журнал анимаций (для разработчика)</summary>
          <span className="muted">Если анимация оборвалась или не показалась — сразу откройте и пришлите скриншот.</span>
          <ol>
            {fxTrace.map((x, i) => (
              <li key={i}>
                <code>{x}</code>
              </li>
            ))}
          </ol>
          <button
            className="btn small"
            onClick={() => {
              clearTrace();
              setFxTrace([]);
            }}
          >
            Очистить
          </button>
        </details>
      )}
      <p className="row muted" data-testid="app-version">
        <span title="Этот компас показывает не на север, а туда, куда вам действительно нужно"><Icon name="compass" size={28}/></span>Версия: {appVersion()}
      </p>
    </Sheet>
  );
}
