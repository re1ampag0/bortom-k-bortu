// «Админка → Данные»: the tables of the editor — ships, the economy, the cards (search, deck and type filters, value /
// norm / excess), the sea deck. The fields of fx are made by the structure of fx; the names of operations are read only.
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { CARD_TYPES } from '../../engine/data';
import { Bound, FieldInput, type Edit } from './fields';
import {
  cardNorm,
  cardRefs,
  deckBalance,
  econFields,
  excessTone,
  fmt,
  fxFields,
  getAt,
  seaFields,
  shipFields,
  textMayBeOld,
  type CardRef,
  type Field,
  type Kind,
  type Raw,
} from './model';

type Sub = 'ships' | 'econ' | 'cards' | 'sea';
const SUBS: { id: Sub; label: string }[] = [
  { id: 'ships', label: 'Корабли' },
  { id: 'econ', label: 'Экономика' },
  { id: 'cards', label: 'Карты' },
  { id: 'sea', label: 'Море' },
];
const TYPE_NAMES: Record<string, string> = { ЗАРЯД: 'Заряд', РЕАКЦИЯ: 'Реакция', ПРИКАЗ: 'Приказ', РЕМОНТ: 'Ремонт' };

export interface DataTabProps {
  raw: Raw;
  base: Raw;
  readOnly: boolean;
  onEdit: Edit;
}

export function DataTables(props: DataTabProps) {
  const [sub, setSub] = useState<Sub>('cards');
  return (
    <>
      <nav className="admin-subtabs" role="tablist" aria-label="Таблицы данных">
        {SUBS.map((s) => (
          <button key={s.id} role="tab" aria-selected={sub === s.id} className={sub === s.id ? 'on' : ''} data-testid={`data-${s.id}`} onClick={() => setSub(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>
      {sub === 'ships' && <Ships {...props} />}
      {sub === 'econ' && <Econ {...props} />}
      {sub === 'cards' && <Cards {...props} />}
      {sub === 'sea' && <Sea {...props} />}
    </>
  );
}

function Ships({ raw, base, readOnly, onEdit }: DataTabProps) {
  return (
    <div className="admin-grid">
      {(raw.ships as Raw[]).map((ship, i) => (
        <section key={ship.code} className="admin-panel" style={{ borderLeftColor: ship.color }}>
          <h3>
            {ship.name} <small>{ship.side === 'ПИРАТЫ' ? 'Пираты' : 'Компания'}</small>
          </h3>
          <div className="admin-fields">
            {shipFields(raw, i).map((f) => (
              <Bound key={f.path.join('.')} field={f} raw={raw} base={base} readOnly={readOnly} onEdit={onEdit} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Econ({ raw, base, readOnly, onEdit }: DataTabProps) {
  return (
    <section className="admin-panel">
      <h3>Порох</h3>
      <div className="admin-fields">
        {econFields().map((f) => (
          <Bound key={f.path.join('.')} field={f} raw={raw} base={base} readOnly={readOnly} onEdit={onEdit} />
        ))}
      </div>
      <p className="admin-note">Первой ходит команда Пиратов: «самый первый ход» — её первый ход, «вторая команда» — Компания.</p>
    </section>
  );
}

function Cards({ raw, base, readOnly, onEdit }: DataTabProps) {
  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState('');
  const [type, setType] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());
  const refs = useMemo(() => cardRefs(raw), [raw.decks, raw.legends, raw.ships]);
  const shown = refs.filter((ref) => {
    const card = getAt(raw, ref.path) as Raw;
    if (deck && ref.deck !== deck) return false;
    if (type === 'legend' ? !ref.legend : type && card.type !== type) return false;
    if (q && !`${card.name} ${card.big} ${card.text}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return (
    <>
      <section className="admin-panel admin-decks">
        <h3>Колоды: ценность, норма, перевес</h3>
        <table>
          <thead>
            <tr>
              <th>Колода</th>
              <th>Ценность</th>
              <th>Норма</th>
              <th>Перевес</th>
            </tr>
          </thead>
          <tbody>
            {(raw.ships as Raw[]).map((ship) => {
              const b = deckBalance(raw, ship.code);
              return (
                <tr key={ship.code}>
                  <td>{ship.name}</td>
                  <td>{fmt(b.value)}</td>
                  <td>{fmt(b.norm)}</td>
                  <td>{(b.excess > 0 ? '+' : '') + fmt(b.excess)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="admin-note">Норма карты: Заряд 1, Реакция 1,5, Приказ и Ремонт 2; +1 за каждый Порох или Душу в стоимости; +2 у Легенды (PDF, с. 25). Перевес = ценность − норма, по копиям.</p>
      </section>
      <div className="admin-filters">
        <input type="search" placeholder="Поиск по названию и тексту" aria-label="Поиск карты" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="card-search" />
        <select aria-label="Колода" value={deck} onChange={(e) => setDeck(e.target.value)} data-testid="card-deck">
          <option value="">Все колоды</option>
          {(raw.ships as Raw[]).map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <select aria-label="Тип" value={type} onChange={(e) => setType(e.target.value)} data-testid="card-type">
          <option value="">Все типы</option>
          {CARD_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_NAMES[t]}
            </option>
          ))}
          <option value="legend">Легенды</option>
        </select>
        <span className="admin-count">{shown.length} из {refs.length}</span>
      </div>
      <div className="admin-cards">
        {shown.map((ref) => (
          <CardRow
            key={ref.path.join('.')}
            cardRef={ref}
            card={getAt(raw, ref.path)}
            was={getAt(base, ref.path)}
            nick={(raw.ships as Raw[]).find((s) => s.code === ref.deck)?.nick ?? ref.deck}
            color={(raw.ships as Raw[]).find((s) => s.code === ref.deck)?.color ?? '#c9a048'}
            readOnly={readOnly}
            onEdit={onEdit}
          />
        ))}
        {shown.length === 0 && <p className="admin-note">Ничего не найдено.</p>}
      </div>
    </>
  );
}

/** One card: the head with value / norm / excess, its numbers, the texts folded. */
const CardRow = memo(function CardRow({
  cardRef,
  card,
  was,
  nick,
  color,
  readOnly,
  onEdit,
}: {
  cardRef: CardRef;
  card: Raw;
  was: Raw | undefined;
  nick: string;
  color: string;
  readOnly: boolean;
  onEdit: Edit;
}) {
  const where = ['Карты', nick, cardRef.legend ? `Легенда «${card.name}»` : card.name];
  const at = (key: string, label: string, kind: Kind, min?: number): Field => ({ path: [...cardRef.path, key], label, kind, min, where });
  const numbers = [at('cost', 'стоимость', 'int', 0), at('soul', 'Души', 'int', 0)];
  if (!cardRef.legend) numbers.push(at('copies', 'копии', 'int', 1));
  numbers.push(at('v', 'ценность', 'num'), ...fxFields(card.fx, [...cardRef.path, 'fx'], where));
  const texts = [at('big', 'крупно', 'text'), at('text', 'текст', 'long'), at('flavor', 'цитата', 'long')];
  const norm = cardNorm(card);
  const v = typeof card.v === 'number' ? card.v : NaN;
  const excess = v - norm;
  const old = was && textMayBeOld({ x: card }, { x: was }, { ...cardRef, path: ['x'] });
  const rel = (f: Field) => f.path.slice(cardRef.path.length);
  return (
    <article className="admin-card" style={{ borderLeftColor: color }} data-testid={`card-${nick}-${card.name}`}>
      <header>
        <b>{card.name}</b>
        <small>
          {nick} · {cardRef.legend ? 'Легенда' : TYPE_NAMES[card.type] ?? card.type}
        </small>
        <span className="admin-balance">
          <span>
            ценность <b>{Number.isNaN(v) ? '—' : fmt(v)}</b>
          </span>
          <span>
            норма <b>{fmt(norm)}</b>
          </span>
          <span className={`admin-excess ${Number.isNaN(excess) ? '' : excessTone(excess)}`} data-testid="excess">
            перевес <b>{Number.isNaN(excess) ? '—' : (excess > 0 ? '+' : '') + fmt(excess)}</b>
          </span>
        </span>
        {old && (
          <span className="admin-warn" data-testid="text-old">
            Текст карты мог устареть: числа в fx изменены, а текст нет
          </span>
        )}
      </header>
      <div className="admin-fields">
        {numbers.map((f) => (
          <FieldInput key={f.path.join('.')} field={f} value={getAt(card, rel(f))} was={getAt(was, rel(f))} readOnly={readOnly} onEdit={onEdit} />
        ))}
      </div>
      <details className="admin-texts">
        <summary>Тексты карты</summary>
        <p className="admin-big">{card.big}</p>
        {texts.map((f) => (
          <FieldInput key={f.path.join('.')} field={f} value={getAt(card, rel(f))} was={getAt(was, rel(f))} readOnly={readOnly} onEdit={onEdit} />
        ))}
      </details>
    </article>
  );
});

function Sea({ raw, base, readOnly, onEdit }: DataTabProps) {
  const on = (raw.sea as Raw[]).filter((c) => !c.off).length;
  return (
    <>
      <p className="admin-note">
        В колоде моря {on} из {(raw.sea as Raw[]).length} карт. Выключенная карта не выходит в партиях с этим набором данных.
      </p>
      <div className="admin-cards">
        {(raw.sea as Raw[]).map((card, i) => {
          const [off, ...texts] = seaFields(raw, i);
          return (
            <article key={card.key} className={`admin-card sea${card.off ? ' off' : ''}`} data-testid={`sea-${card.key}`}>
              <header>
                <b>{card.name}</b>
                <small>{card.when}</small>
                <Bound field={off} raw={raw} base={base} readOnly={readOnly} onEdit={onEdit} />
              </header>
              <div className="admin-fields texts">
                {texts.map((f) => (
                  <Bound key={f.path.join('.')} field={f} raw={raw} base={base} readOnly={readOnly} onEdit={onEdit} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
