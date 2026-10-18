// The hand strip: tabs of the ships one person leads, «Колода 14 · Сброс 6», the cards and, after a divider,
// the Plans of the Pearl. A5 (V2): on a laptop the cards lie as a fan and always fit (they overlap as much as the width
// needs); on a phone the fan scrolls sideways and snaps, a tap lifts a card, the second tap opens it.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { cardByCode, shipData, type GameState } from '../../engine/state';
import type { CardInstance, GameData } from '../../engine/types';
import { HIDDEN } from '../../engine/view';

// Before the paint in the browser; the tests render the cards to markup, where only useEffect is quiet.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The text of a card is cut by whole lines with «…» (U3): as many lines as the height left under the name and the
 * effect holds — a name of one or two lines leaves a different room, so the number is measured, not fixed in CSS.
 */
function useWholeLines() {
  const ref = useRef<HTMLSpanElement>(null);
  useBeforePaint(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      el.style.removeProperty('-webkit-line-clamp');
      el.style.removeProperty('max-height');
      const line = parseFloat(getComputedStyle(el).lineHeight);
      if (!(line > 0)) return;
      const n = Math.max(1, Math.floor((el.clientHeight + 1) / line));
      el.style.setProperty('-webkit-line-clamp', String(n));
      // no part of the next line under the last one
      el.style.setProperty('max-height', `${n * line}px`);
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  });
  return ref;
}

/** A phone: the hand scrolls and a tap lifts a card (the same width as the phone rules of game.css). */
const PHONE = '(max-width: 700px)';
const isPhone = () => typeof matchMedia !== 'undefined' && matchMedia(PHONE).matches;

/**
 * The place of card k of n in the fan (A5Table.html: −7°, −3°, 0, 3°, 7°; the edges lower than the middle): the tilt
 * and the lift. The middle rises, the edges stay at the line of the hand — the fan never goes below it.
 */
export function fanOf(k: number, n: number): { r: number; dy: number } {
  const o = k - (n - 1) / 2, m = (n - 1) / 2;
  const step = n > 1 ? Math.min(3.5, 14 / (n - 1)) : 0;
  const lift = Math.min(2.5, 10 / Math.max(1, m * m));
  return { r: Math.round(o * step * 10) / 10, dy: Math.round((o * o - m * m) * lift * 10) / 10 };
}

/**
 * The laptop: the overlap of the cards is what the width needs, so the whole hand fits and no card is cut off when it
 * rises (no scrolling there). Measured on resize and when the cards change; --ov is the extra overlap of each card.
 */
function useFanFit(n: number) {
  const ref = useRef<HTMLDivElement>(null);
  useBeforePaint(() => {
    const row = ref.current;
    if (!row) return;
    const fit = () => {
      if (isPhone()) return void row.style.removeProperty('--ov');
      const kids = [...row.children] as HTMLElement[];
      const cards = kids.filter((x) => x.classList.contains('hcard'));
      if (cards.length < 2) return void row.style.removeProperty('--ov');
      const cs = getComputedStyle(row);
      const gap = parseFloat(cs.columnGap) || 0;
      const room = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const natural = kids.reduce((w, x) => w + x.offsetWidth, 0) + gap * (kids.length - 1);
      const ov = Math.max(0, Math.ceil((natural - room) / (cards.length - 1)));
      row.style.setProperty('--ov', `${ov}px`);
    };
    fit();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    ro?.observe(row);
    return () => ro?.disconnect();
  }, [n]);
  return ref;
}

/**
 * The phone: the further a card is from the middle of the strip, the more it tilts and fades (--pr, --pf); the card in
 * the middle is straight. A scroll handler, one frame at a time.
 */
function usePhoneFan(ref: { current: HTMLDivElement | null }, n: number) {
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const phone = isPhone();
      const box = row.getBoundingClientRect(), mid = box.left + box.width / 2;
      for (const c of row.querySelectorAll<HTMLElement>(':scope > .hcard')) {
        if (!phone) {
          c.style.removeProperty('--pr');
          c.style.removeProperty('--pf');
          continue;
        }
        const b = c.getBoundingClientRect();
        const d = Math.max(-1.5, Math.min(1.5, (b.left + b.width / 2 - mid) / Math.max(1, box.width / 2)));
        c.style.setProperty('--pr', `${(d * 7).toFixed(1)}deg`);
        c.style.setProperty('--pf', (1 - Math.max(0, Math.abs(d) - 0.55) * 0.5).toFixed(2));
      }
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    draw();
    row.addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    return () => {
      row.removeEventListener('scroll', ask);
      removeEventListener('resize', ask);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, n]);
}

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
  style,
  lifted,
  liftKey,
}: {
  data: GameData;
  code: string;
  plan?: boolean;
  off: string | null;
  chosen?: boolean;
  onClick?: () => void;
  note?: string;
  /** The place in the fan of the hand (--r, --dy). */
  style?: CSSProperties;
  /** A phone: the card is lifted by the first tap. */
  lifted?: boolean;
  liftKey?: string;
}) {
  const textRef = useWholeLines();
  if (code === HIDDEN) {
    return <div className={`hcard back ${plan ? 'plan' : ''}`} style={style} data-lift={liftKey} aria-label="Закрытая карта" data-fx-card={HIDDEN} />;
  }
  const c = cardByCode(data, code);
  return (
    <button
      className={`hcard ${cardClass(c)} ${plan ? 'plan' : ''} ${off ? 'off' : ''} ${chosen ? 'chosen' : ''} ${lifted ? 'lifted' : ''}`}
      style={style}
      data-lift={liftKey}
      onClick={onClick}
      title={off ?? `${c.name}: ${c.big}`}
      data-testid="hand-card"
      data-card={code}
      data-fx-card={code}
    >
      <span className="hcard-head">
        <span className="hcard-type">{plan ? 'План' : c.type}</span>
        <CostBadge c={c} />
      </span>
      <span className="hcard-name">{c.name}</span>
      <span className="hcard-big">{note ?? c.big}</span>
      <span className="hcard-text" ref={textRef}>{c.text.replace(/<[^>]+>/g, ' ')}</span>
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
  direct,
  onDiscard,
  label,
  note,
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
  /** A phone: a tap on this card chooses it at once (a Charge while aiming, a Reaction in its window), not lifts it. */
  direct?: (seat: string, code: string) => boolean;
  onDiscard: (seat: string) => void;
  label: string;
  /** A line under the head: «Вы капитан на борту…». */
  note?: string;
}) {
  const holder = s.ships[seat];
  const n = holder.hand.length + holder.plans.length;
  const rowRef = useFanFit(n);
  usePhoneFan(rowRef, n);
  // The phone: the lifted card (its key in the strip); a tap beside it, another ship's tab or a new hand drops it.
  const [lifted, setLifted] = useState<string | null>(null);
  useEffect(() => setLifted(null), [seat, n]);
  useEffect(() => {
    if (!lifted) return;
    const drop = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.('[data-lift]')?.getAttribute('data-lift') !== lifted) setLifted(null);
    };
    addEventListener('pointerdown', drop, true);
    return () => removeEventListener('pointerdown', drop, true);
  }, [lifted]);
  const card = (code: string, k: number, key: string, plan = false) => {
    const f = fanOf(k, n);
    const press = () => {
      if (!isPhone() || lifted === key || code === HIDDEN || direct?.(seat, code)) {
        setLifted(null);
        onCard(seat, code);
        return;
      }
      setLifted(key);
      [...(rowRef.current?.children ?? [])].find((x) => x.getAttribute('data-lift') === key)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    };
    return (
      <HandCard
        key={key}
        data={data}
        code={code}
        plan={plan}
        off={offOf(seat, code)}
        chosen={chosen === code}
        note={noteOf(code)}
        onClick={press}
        lifted={lifted === key}
        liftKey={key}
        style={{ ['--r' as string]: `${f.r}deg`, ['--dy' as string]: `${f.dy}px` } as CSSProperties}
      />
    );
  };
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
        <button className="link deck-info" onClick={() => onDiscard(seat)} title="Открыть сброс" data-fx-deck>
          Колода {holder.deck.length} · Сброс {holder.discard.length}
        </button>
      </div>
      {note && (
        <p className="hand-note" data-testid="captain-note">
          {note}
        </p>
      )}
      <div className="hand-cards" ref={rowRef}>
        {holder.hand.map((code, i) => card(code, i, `${code}-${i}`))}
        {holder.hand.length === 0 && <span className="muted empty">Рука пуста</span>}
        {holder.plans.length > 0 && (
          <>
            <span className="hand-divider" aria-hidden />
            <span className="plans-label">Планы</span>
            {holder.plans.map((code, i) => card(code, holder.hand.length + i, `p-${code}-${i}`, true))}
          </>
        )}
      </div>
    </div>
  );
}

export const seatLabel = (data: GameData, seat: string) => shipData(data, seat).nick;
