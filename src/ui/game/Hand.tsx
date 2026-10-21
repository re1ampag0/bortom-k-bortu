// The hand strip: tabs of the ships one person leads, «Колода 14 · Сброс 6», the cards and, after a divider,
// the Plans of the Pearl. A5 (V2): on a laptop the cards lie as a fan and always fit (they overlap as much as the width
// needs); on a phone the fan scrolls sideways and snaps, a tap lifts a card (a5-phone, A5Phone frame 6: it grows, shows its
// whole text and «Сыграть» or the reason why not, the other actions under it — no window of the card).
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { cardByCode, shipData, type GameState } from '../../engine/state';
import type { CardInstance, GameData } from '../../engine/types';
import { HIDDEN } from '../../engine/view';
import type { Btn } from './Table';
import { reducedMotion } from '../start/motion';
import { plainText } from './text';

// Before the paint in the browser; the tests render the cards to markup, where only useEffect is quiet.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The text of a card is cut by whole lines with «…» (U3): as many lines as the height left under the name and the
 * effect holds — a name of one or two lines leaves a different room, so the number is measured, not fixed in CSS.
 */
function useWholeLines(key: string) {
  const ref = useRef<HTMLSpanElement>(null);
  // fix-ui (5а): measured when the card (its text, its look) changes and on resize — not on every render of the hand: each fit
  // writes the style and reads the layout, and the hand renders many times a second while the clips run
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
    // the fonts of the cards may come after the first fit (their lines are of another height)
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    addEventListener('resize', fit);
    return () => {
      live = false;
      removeEventListener('resize', fit);
    };
  }, [key]);
  return ref;
}

/**
 * The lifted card of a phone grows upwards: a margin over it as tall as it grew, so its bottom stays at the line of the fan and
 * the strip of the hand keeps its height (phone.css gives it the room above the cards).
 */
function useLiftMargin(on: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useBeforePaint(() => {
    const el = ref.current;
    if (!on || !el) return;
    const near = [el.previousElementSibling, el.nextElementSibling].find((x): x is HTMLElement => !!x?.classList.contains('hcard'));
    el.style.marginTop = `${(near?.offsetHeight ?? 160) - el.offsetHeight}px`;
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
export function fanOf(k: number, n: number, wide = false): { r: number; dy: number } {
  const o = k - (n - 1) / 2, m = (n - 1) / 2;
  if (wide && m > 0) {
    // «Палуба» on a wide window (1600–1920): a real fan — the edges tilt ±3° (up to ±8° with 8 cards) through 0° in the middle
    // and lie 12 px lower than the middle (an arc)
    const edge = n <= 5 ? 3 : Math.min(8, 3 + ((n - 5) * 5) / 3);
    return { r: Math.round((o / m) * edge * 10) / 10, dy: Math.round((o / m) ** 2 * 12 * 10) / 10 };
  }
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
  // the fan of a wide window (game.css --fan-wide: «Палуба», 1600 px and wider)
  const [wide, setWide] = useState(false);
  useBeforePaint(() => {
    const row = ref.current;
    if (!row) return;
    const fit = () => {
      if (isPhone()) return void row.style.removeProperty('--ov');
      setWide(getComputedStyle(row).getPropertyValue('--fan-wide').trim() === '1');
      const kids = [...row.children] as HTMLElement[];
      const cards = kids.filter((x) => x.classList.contains('hcard'));
      if (cards.length < 2) return void row.style.removeProperty('--ov');
      const cs = getComputedStyle(row);
      const gap = parseFloat(cs.columnGap) || 0;
      const room = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const natural = kids.reduce((w, x) => w + x.offsetWidth, 0) + gap * (kids.length - 1);
      // --fan-max-step (game.css, «Палуба»): the step of the fan is at most that part of a card — the cards always overlap a little
      const maxStep = parseFloat(cs.getPropertyValue('--fan-max-step'));
      const w = cards[0].offsetWidth;
      const capped = maxStep > 0 ? Math.ceil(w + gap - maxStep * w) : 0;
      const ov = Math.max(0, capped, Math.ceil((natural - room) / (cards.length - 1)));
      row.style.setProperty('--ov', `${ov}px`);
    };
    fit();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    ro?.observe(row);
    return () => ro?.disconnect();
  }, [n]);
  return [ref, wide] as const;
}

/**
 * The phone: the further a card is from the middle of the strip, the more it tilts and fades (--pr, --pf); the card in
 * the middle is straight. A scroll handler, one frame at a time.
 */
function usePhoneFan(ref: { current: HTMLDivElement | null }, n: number): number {
  // the card nearest to the middle of the strip (the dots under the fan, A5Phone)
  const [middle, setMiddle] = useState(0);
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const phone = isPhone();
      const box = row.getBoundingClientRect(), mid = row.clientWidth / 2;
      // Layout centres do not include rotation/arc: measuring the transformed bounding box
      // feeds yesterday's tilt back into the next frame and makes the fan drift while scrolling.
      const centreX = (c: HTMLElement) => {
        const parent = c.offsetParent;
        const origin = parent === row ? 0 : (parent?.getBoundingClientRect().left ?? 0) - box.left;
        return origin + c.offsetLeft + c.offsetWidth / 2 - row.scrollLeft;
      };
      let near = 0,
        best = Infinity;
      row.querySelectorAll<HTMLElement>(':scope > .hcard').forEach((c, i) => {
        const off = Math.abs(centreX(c) - mid);
        if (off < best) [near, best] = [i, off];
      });
      if (phone) setMiddle(near);
      for (const c of row.querySelectorAll<HTMLElement>(':scope > .hcard')) {
        if (!phone) {
          c.style.removeProperty('--pr');
          c.style.removeProperty('--pf');
          c.style.removeProperty('--pdy');
          continue;
        }
        const d = Math.max(-1, Math.min(1, (centreX(c) - mid) / Math.max(1, row.clientWidth / 2)));
        c.style.setProperty('--pr', `${(d * 13).toFixed(1)}deg`);
        c.style.setProperty('--pdy', `${(18 * d * d - 18).toFixed(1)}px`);
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
  return middle;
}

/** Scrolls the strip of the hand (and nothing round it) so that the card stands in its middle. */
function centre(row: HTMLElement, card: Element, behavior: ScrollBehavior) {
  const r = row.getBoundingClientRect(),
    c = card.getBoundingClientRect();
  row.scrollTo({ left: row.scrollLeft + (c.left + c.width / 2) - (r.left + r.width / 2), behavior });
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

/** «Тревога!» (U2): a Reaction that can be played now (`ok`, with the green strip only under «Подсказки»), one that cannot
 *  (`why`: the reason on the grey strip), the other cards are dimmed (`dim`). */
export interface AlarmCard {
  kind: 'ok' | 'no' | 'dim';
  strip?: { top: string; bottom: string };
  why?: string;
}

/**
 * A phone: what the lifted card can do now (Game.tsx, the buttons of the old window of the card) — «Сыграть» (`play`; grey
 * with the reason when it cannot be played) and, under it, the other actions that can be pressed now (Продать, Передать,
 * Потушить). null — the card is only read (not this player's move).
 */
export interface LiftActions {
  play: Btn | null;
  more: Btn[];
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
  alarm,
  actions,
  onDrop,
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
  alarm?: AlarmCard;
  /** A phone, the lifted card: its strip «Сыграть» and the actions under it (no window of the card). */
  actions?: LiftActions | null;
  /** The lifted card goes back into the fan (a press on its strip). */
  onDrop?: () => void;
}) {
  const textRef = useWholeLines(`${code}|${note ?? ''}|${plan ? 1 : 0}|${lifted ? 1 : 0}|${alarm?.kind ?? ''}|${alarm?.why ?? ''}|${alarm?.strip?.top ?? ''}`);
  const liftRef = useLiftMargin(!!lifted && actions !== undefined);
  if (code === HIDDEN) {
    return <div className={`hcard back ${plan ? 'plan' : ''}`} style={style} data-lift={liftKey} aria-label="Закрытая карта" data-fx-card={HIDDEN} />;
  }
  const c = cardByCode(data, code);
  if (lifted && actions !== undefined) {
    // a5-phone (A5Phone, frame 6): the lifted card is a group with buttons of its own (not a button in a button)
    const run = (b: Btn) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (b.disabled) return;
      onDrop?.();
      b.onClick();
    };
    const play = actions?.play ?? null;
    return (
      <div
        ref={liftRef}
        className={`hcard ${cardClass(c)} ${plan ? 'plan' : ''} ${off ? 'off' : ''} ${chosen ? 'chosen' : ''} lifted lift-open`}
        style={style}
        data-lift={liftKey}
        onClick={onClick}
        role="group"
        aria-label={`${c.name}: ${c.big}`}
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
        <span className="hcard-text">{plainText(c.text)}</span>
        {play &&
          (play.disabled ? (
            <span className="lift-strip no" data-testid="lift-why">
              {play.disabled}
            </span>
          ) : (
            <button type="button" className={`lift-strip play ${play.label.length > 10 ? 'long' : ''}`} data-testid="lift-play" onClick={run(play)}>
              {play.label}
            </button>
          ))}
        {actions && actions.more.length > 0 && (
          <span className="lift-more">
            {actions.more.map((b) => (
              <button key={b.key} type="button" className="lift-btn" data-testid={`lift-${b.key}`} onClick={run(b)}>
                {b.label}
              </button>
            ))}
          </span>
        )}
      </div>
    );
  }
  return (
    <button
      className={`hcard ${cardClass(c)} ${plan ? 'plan' : ''} ${off ? 'off' : ''} ${chosen ? 'chosen' : ''} ${lifted ? 'lifted' : ''} ${alarm ? `al-${alarm.kind}` : ''}`}
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
      <span className="hcard-text" ref={textRef}>{plainText(c.text)}</span>
      {alarm?.kind === 'ok' && alarm.strip && (
        <span className="hcard-strip ok" data-testid="hcard-strip">
          <b>{alarm.strip.top}</b>
          {alarm.strip.bottom && <i>{alarm.strip.bottom}</i>}
        </span>
      )}
      {alarm?.kind === 'no' && (
        <span className="hcard-strip no" data-testid="hcard-strip">
          <b>нельзя</b>
          <i>{alarm.why}</i>
        </span>
      )}
    </button>
  );
}

export interface HandTab {
  seat: string;
  label: string;
  /** «Подсказки»: this ship has a Reaction to play now. */
  dot?: boolean;
  /** «0 из 3»: the cards played this turn of the limit (the line «Колода · Сброс · сыграно» of «Палуба» on a laptop). */
  played?: string;
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
  alarmOf,
  folded = false,
  actionsOf,
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
  /** «Тревога!»: how each card looks while the Reaction window is open (null — the window is closed). */
  alarmOf?: ((seat: string, code: string) => AlarmCard | null) | null;
  /** «Свернуть, посмотреть стол»: the hand goes down. */
  folded?: boolean;
  /** A phone: the actions of the lifted card (a5-phone); without it the second tap opens the window of the card. */
  actionsOf?: (seat: string, code: string) => LiftActions | null;
}) {
  const holder = s.ships[seat];
  const n = holder.hand.length + holder.plans.length;
  const [rowRef, wideFan] = useFanFit(n);
  const middle = usePhoneFan(rowRef, n);
  // The phone: the lifted card (its key in the strip); a tap beside it, another ship's tab or a new hand drops it.
  const [lifted, setLifted] = useState<string | null>(null);
  useEffect(() => setLifted(null), [seat, n]);
  // the lifted card to the middle of the strip (after it has grown: its neighbours stepped aside) — only the strip scrolls, not the
  // table round it (fix-ui: scrollIntoView moved the whole table when the last card was lifted)
  useEffect(() => {
    if (!lifted) return;
    const row = rowRef.current;
    const card = [...(row?.children ?? [])].find((x) => x.getAttribute('data-lift') === lifted);
    if (row && card) centre(row, card, reducedMotion() ? 'auto' : 'smooth');
  }, [lifted, rowRef]);
  // a phone: the fan opens on the first card that can be played (a new hand, another ship)
  const firstOk = holder.hand.findIndex((code) => offOf(seat, code) === null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !isPhone() || firstOk < 0) return;
    const card = row.querySelectorAll(':scope > .hcard')[firstOk];
    if (card) centre(row, card, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seat, n]);
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
    const f = fanOf(k, n, wideFan);
    const press = () => {
      // a5-phone: a press on the lifted card itself keeps it up (its strip plays it); no window of the card
      if (lifted === key && actionsOf && isPhone()) return;
      if (!isPhone() || lifted === key || code === HIDDEN || direct?.(seat, code)) {
        setLifted(null);
        onCard(seat, code);
        return;
      }
      setLifted(key);
    };
    return (
      <HandCard
        key={key}
        data={data}
        code={code}
        plan={plan}
        off={offOf(seat, code)}
        alarm={alarmOf?.(seat, code) ?? undefined}
        chosen={chosen === code}
        note={noteOf(code)}
        onClick={press}
        lifted={lifted === key}
        liftKey={key}
        actions={lifted === key && actionsOf && isPhone() ? actionsOf(seat, code) : undefined}
        onDrop={() => setLifted(null)}
        style={{ ['--r' as string]: `${f.r}deg`, ['--dy' as string]: `${f.dy}px` } as CSSProperties}
      />
    );
  };
  return (
    <div className={`hand ${alarmOf ? 'alarm' : ''} ${alarmOf && folded ? 'folded' : ''}`} data-testid="hand">
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
        {/* a phone (A5Phone): «РУКА «ЖЕМЧУЖИНЫ»» instead of the tabs — a ship is chosen by a press on its plank */}
        <span className="hand-label narrow phone-hand-label">Рука «{shipData(data, seat).nickGenitive}»</span>
        <button className="link deck-info" onClick={() => onDiscard(seat)} title="Открыть сброс" data-fx-deck>
          Колода {holder.deck.length} · Сброс {holder.discard.length}
          {tabs.find((t) => t.seat === seat)?.played && <span className="deck-played"> · сыграно {tabs.find((t) => t.seat === seat)!.played}</span>}
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
      {/* a phone: where the card in the middle is in the hand (A5Phone) */}
      {n > 1 && (
        <div className="hand-dots" aria-hidden>
          {Array.from({ length: n }, (_, i) => (
            <i key={i} className={i === middle ? 'on' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}

export const seatLabel = (data: GameData, seat: string) => shipData(data, seat).nick;
