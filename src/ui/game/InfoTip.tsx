// The badges and the status chips of a plank explain themselves (S1): a press opens a small window with the short rule
// (its text comes from RULES.md or from the card), a press outside it or «×» closes it; on a laptop the same on hover.
// A press on them is not a press on the table: the show of the animation layer goes on (FxLayer.tsx asks tookPress).
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { stageK } from '../stage';

/** The window open now: one at a time. */
let closeOpen: (() => void) | null = null;
/** The press that closed a window (outside it): it closes the window and nothing else. */
let closingPress: Event | null = null;

/** A press that opens, closes or lands in a window of an explanation — the layer does not take it as a press on the table. */
export function tookPress(e: Event): boolean {
  const t = e.target as Element | null;
  return e === closingPress || !!t?.closest?.('[data-info], .info-pop');
}

const canHover = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function InfoTip({
  className,
  title,
  text,
  off = false,
  style,
  data,
  children,
}: {
  className: string;
  /** The head of the window: what it is («Пожар», «Под водой»). */
  title: string;
  /** The short rule. */
  text: string;
  /** A target is being chosen: the badge is a part of the target, it explains nothing. */
  off?: boolean;
  style?: CSSProperties;
  /** data-* attributes of the badge (data-fx-fires …). */
  data?: Record<`data-${string}`, string | boolean | undefined>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<null | 'hover' | 'press'>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const anchor = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  const show = (how: 'hover' | 'press') => {
    if (closeOpen) closeOpen();
    const close = () => {
      setOpen(null);
      if (closeOpen === close) closeOpen = null;
    };
    closeOpen = close;
    setOpen(how);
  };
  const hide = () => {
    if (closeOpen) closeOpen();
    setOpen(null);
  };

  useLayoutEffect(() => {
    if (!open || !anchor.current || !pop.current) {
      setPos(null);
      return;
    }
    // Under the badge if it fits, else above it; never past the edges of the screen (8 px).
    // in the px of the stage (stage.ts): the pop lives in #stage
    const sk = stageK();
    const a0 = anchor.current.getBoundingClientRect(), p0 = pop.current.getBoundingClientRect();
    const a = { left: a0.left / sk, top: a0.top / sk, bottom: a0.bottom / sk, width: a0.width / sk };
    const p = { width: p0.width / sk, height: p0.height / sk };
    const W = window.innerWidth / sk, Hh = window.innerHeight / sk;
    const left = Math.max(8, Math.min(W - p.width - 8, a.left + a.width / 2 - p.width / 2));
    const below = a.bottom + 6;
    const top = below + p.height <= Hh - 8 ? below : Math.max(8, a.top - 6 - p.height);
    setPos({ left, top });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchor.current?.contains(t) || pop.current?.contains(t)) return;
      closingPress = e;
      hide();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    const onMove = () => hide();
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => void (open && hide()), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (off) {
    return (
      <span className={className} style={style} {...data}>
        {children}
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        ref={anchor}
        className={`${className} info-hit`}
        style={style}
        {...data}
        data-info
        aria-expanded={!!open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          if (open === 'press') hide();
          else show('press');
        }}
        onMouseEnter={() => canHover() && !open && show('hover')}
        onMouseLeave={() => open === 'hover' && hide()}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <div
            ref={pop}
            className="info-pop"
            role="dialog"
            aria-label={title}
            data-testid="info-pop"
            style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
          >
            <b className="info-title">{title}</b>
            <p className="info-text">{text}</p>
            <button type="button" className="info-close" aria-label="Закрыть" data-testid="info-close" onClick={hide}>
              ×
            </button>
          </div>,
          document.getElementById('stage') ?? document.body,
        )}
    </>
  );
}
