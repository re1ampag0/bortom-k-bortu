// «Весь журнал» — the ship's book (PH, part 5; docs/mockups/a5/A5Phone.html frames 5, 5б–5г; logBook of
// phone/src/phone_tpl.html): a leather binding with stitching, corners, a ribbon bookmark, the page of LogList, the
// signature and the seal; each ship has its own cover (BOOK_COVER). Over a darkened table; the show of the moves goes on.
// Closed by «×», a tap on the darkening or a swipe down (when the page is scrolled to its top).
import { useLayoutEffect, useRef, useState } from 'react';
import type { LogLine } from '../../engine/log';
import { shipData } from '../../engine/state';
import type { GameData } from '../../engine/types';
import { stageK } from '../stage';
import { shipSvg } from './art/ships';
import { BOOK_COVER, BOOK_ROSE, bookSeal } from './logBook';
import { LogList, useEscape } from './Overlays';

/** «Голландец»: barnacles on the corners and the salt of the tide (no weed); «Месть»: burnt holes on the page. */
function CoverDeco({ k }: { k: string }) {
  if (k === 'D') {
    const top: [number, number, number][] = [[10, 26, 1], [22, 16, 0.7], [16, 40, 0.8], [30, 30, 0.55]];
    const bottom: [number, number, number][] = [[18, 22, 0.9], [30, 12, 0.6], [12, 32, 0.7]];
    return (
      <>
        {top.map(([x, y, sc], i) => (
          <span key={`t${i}`} className="barn" style={{ left: x, top: y, transform: `scale(${sc})` }} />
        ))}
        {bottom.map(([x, y, sc], i) => (
          <span key={`b${i}`} className="barn" style={{ right: x, bottom: y, transform: `scale(${sc})` }} />
        ))}
        <span className="tide" />
      </>
    );
  }
  return null;
}

function PageDeco({ k }: { k: string }) {
  if (k === 'D')
    return (
      <>
        <span className="stain" style={{ left: '46%', top: 170, width: 160, height: 110 }} />
        <span className="stain" style={{ left: '16%', top: 430, width: 120, height: 80 }} />
      </>
    );
  if (k === 'R')
    return (
      <>
        <span className="burn" style={{ right: 24, top: 300 }} />
        <span className="burn" style={{ left: 40, top: 520, transform: 'scale(.7)' }} />
      </>
    );
  return null;
}

export function LogBook({
  data,
  log,
  fresh,
  ship,
  onCard,
  onSea,
  onDownload,
  onClose,
}: {
  data: GameData;
  log: LogLine[];
  fresh: number;
  /** The ship whose book it is (the hand open now). */
  ship: string;
  onCard: (code: string) => void;
  onSea: (code: string) => void;
  onDownload: () => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const cover = BOOK_COVER[ship] ?? BOOK_COVER['Ж'];
  const scroll = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(0);
  // a phone: the bottom panel stays over the darkening, working («Быстрее», «До конца хода», «Пауза»); the book above it
  const [bar, setBar] = useState(0);
  useLayoutEffect(() => {
    const el = document.querySelector('.game > .bottom-bar');
    setBar(el && getComputedStyle(el).display !== 'none' ? Math.round(el.getBoundingClientRect().height / stageK()) : 0);
  }, []);
  const start = useRef<{ y: number; id: number } | null>(null);
  // opened at the last line written
  useLayoutEffect(() => {
    const el = scroll.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  const rose = useRef(BOOK_ROSE);
  const seal = useRef(bookSeal(cover.seal));
  const name = shipData(data, ship)?.name ?? '';

  // a swipe down closes the book — from the head, or anywhere while the page is at its top
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('button')) return;
    const inPage = !!(e.target as Element).closest('.lscroll');
    if (inPage && (scroll.current?.scrollTop ?? 0) > 0) return;
    start.current = { y: e.clientY, id: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current || start.current.id !== e.pointerId) return;
    setDrag(Math.max(0, e.clientY - start.current.y));
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    if (drag > 80) onClose();
    setDrag(0);
  };

  return (
    <div className="book-backdrop" onClick={onClose} style={{ ['--bar-h' as string]: `${bar}px` }}>
      <section
        className={`lbook lb-${cover.k}`}
        data-testid="log-sheet"
        role="dialog"
        aria-label={cover.title}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <CoverDeco k={cover.k} />
        <span className="lcorn tl" />
        <span className="lcorn tr" />
        <span className="lcorn bl" />
        <span className="lcorn br" />
        <span className="ribbon2" aria-hidden />
        <button className="bx close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <div className="lpage">
          <i className="lwm" aria-hidden dangerouslySetInnerHTML={{ __html: rose.current }} />
          <span className="lpageno">{cover.page}</span>
          <PageDeco k={cover.k} />
          <header className="lhead">
            <span className="lship" aria-hidden dangerouslySetInnerHTML={{ __html: shipSvg(ship, 58, 28, `book${ship}`) }} />
            <b>{cover.title}</b>
            <span>
              {name} · {cover.sub}
            </span>
          </header>
          <div className="lscroll" ref={scroll}>
            <LogList data={data} log={log} chrono fresh={fresh} onCard={onCard} onSea={onSea} />
            <div className="lsign">
              <span>
                {cover.who}
                <span className="sig">{cover.sig}</span>
              </span>
              <i aria-hidden dangerouslySetInnerHTML={{ __html: seal.current }} />
            </div>
          </div>
          <div className="lbtns">
            <button className="brs-btn" onClick={onDownload}>
              Скачать
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
