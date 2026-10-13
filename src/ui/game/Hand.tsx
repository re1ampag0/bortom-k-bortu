// The hand strip: tabs of the ships one person leads, «Колода 14 · Сброс 6», the cards and, after a divider,
// the Plans of the Pearl. Only the hand scrolls, sideways.
import { cardByCode, shipData, type GameState } from '../../engine/state';
import type { CardInstance, GameData } from '../../engine/types';
import { HIDDEN } from '../../engine/view';

const TYPE_CLASS: Record<string, string> = { ЗАРЯД: 'charge', РЕАКЦИЯ: 'reaction', ПРИКАЗ: 'order', РЕМОНТ: 'repair' };

export function cardClass(c: CardInstance): string {
  return `${TYPE_CLASS[c.type]}${c.legend ? ' legend' : ''}`;
}

export function CostBadge({ c }: { c: CardInstance }) {
  return (
    <span className="cost" title={`Стоимость: ${c.cost} Пороха${c.soul ? `, ${c.soul} Души` : ''}`}>
      {c.soul > 0 ? `${c.soul} Д` : c.cost}
    </span>
  );
}

export function HandCard({
  data,
  code,
  plan,
  off,
  chosen,
  onClick,
  note,
}: {
  data: GameData;
  code: string;
  plan?: boolean;
  off: string | null;
  chosen?: boolean;
  onClick?: () => void;
  note?: string;
}) {
  if (code === HIDDEN) {
    return <div className={`hcard back ${plan ? 'plan' : ''}`} aria-label="Закрытая карта" />;
  }
  const c = cardByCode(data, code);
  return (
    <button
      className={`hcard ${cardClass(c)} ${plan ? 'plan' : ''} ${off ? 'off' : ''} ${chosen ? 'chosen' : ''}`}
      onClick={onClick}
      title={off ?? `${c.name}: ${c.big}`}
      data-testid="hand-card"
      data-card={code}
    >
      <span className="hcard-head">
        <span className="hcard-type">{plan ? 'План' : c.type}</span>
        <CostBadge c={c} />
      </span>
      <span className="hcard-name">{c.name}</span>
      <span className="hcard-big">{note ?? c.big}</span>
      <span className="hcard-text">{c.text.replace(/<[^>]+>/g, ' ')}</span>
    </button>
  );
}

export interface HandTab {
  seat: string;
  label: string;
  /** «Подсказки»: this ship has a Reaction to play now. */
  dot?: boolean;
}

export function Hand({
  s,
  data,
  seat,
  tabs,
  onTab,
  offOf,
  chosen,
  noteOf,
  onCard,
  onDiscard,
  label,
}: {
  s: GameState;
  data: GameData;
  seat: string;
  tabs: HandTab[];
  onTab: (seat: string) => void;
  offOf: (seat: string, code: string) => string | null;
  chosen: string | null;
  noteOf: (code: string) => string | undefined;
  onCard: (seat: string, code: string) => void;
  onDiscard: (seat: string) => void;
  label: string;
}) {
  const holder = s.ships[seat];
  return (
    <div className="hand" data-testid="hand">
      <div className="hand-head">
        {tabs.length > 1 ? (
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.seat}
                role="tab"
                aria-selected={t.seat === seat}
                className={`tab ${t.seat === seat ? 'on' : ''}`}
                onClick={() => onTab(t.seat)}
              >
                {t.label}
                {t.dot && <span className="tab-dot" title="Есть Реакция" aria-label="есть Реакция" />}
              </button>
            ))}
          </div>
        ) : (
          <span className="hand-label">{label}</span>
        )}
        <button className="link deck-info" onClick={() => onDiscard(seat)} title="Открыть сброс">
          Колода {holder.deck.length} · Сброс {holder.discard.length}
        </button>
      </div>
      <div className="hand-cards">
        {holder.hand.map((code, i) => (
          <HandCard
            key={`${code}-${i}`}
            data={data}
            code={code}
            off={offOf(seat, code)}
            chosen={chosen === code}
            note={noteOf(code)}
            onClick={() => onCard(seat, code)}
          />
        ))}
        {holder.hand.length === 0 && <span className="muted empty">Рука пуста</span>}
        {holder.plans.length > 0 && (
          <>
            <span className="hand-divider" aria-hidden />
            <span className="plans-label">Планы</span>
            {holder.plans.map((code, i) => (
              <HandCard
                key={`p-${code}-${i}`}
                data={data}
                code={code}
                plan
                off={offOf(seat, code)}
                chosen={chosen === code}
                note={noteOf(code)}
                onClick={() => onCard(seat, code)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export const seatLabel = (data: GameData, seat: string) => shipData(data, seat).nick;
