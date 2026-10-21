// «Тревога!» (U2): the bar at the top, the arrow with the pill over the sea, the buttons of the Reaction window (a laptop)
// and its sheet (a phone). The Reaction cards are the cards of the hand (Hand.tsx, `alarm`); nothing here blocks the input.
import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react';
import { reactionNow } from '../../engine/hints';
import { cardByCode, type Action, type GameState } from '../../engine/state';
import type { GameData } from '../../engine/types';
import { fuseLeft, type AlarmInfo } from './alarm';
import { HandCard, type AlarmCard } from './Hand';
import { T } from './fx/timing';
import { stageK } from '../stage';

const BELL = `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M17 4 C10 4 8 10 8 16 V22 L5 26 H29 L26 22 V16 C26 10 24 4 17 4 Z" fill="#e0bd62" stroke="#3a2412" stroke-width="1"/><path d="M13 27 Q17 32 21 27" fill="#e0bd62" stroke="#3a2412" stroke-width="1"/><path d="M17 1 V4" stroke="#3a2412" stroke-width="2"/><path d="M3 12 Q1 17 3 22 M31 12 Q33 17 31 22" stroke="#e0bd62" stroke-width="1.6" fill="none"/></svg>`;

const PHONE = '(max-width: 700px)';
const onPhone = (cb: () => void) => {
  const m = matchMedia(PHONE);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
/** A phone: the Reaction window is a sheet from below; a laptop: the hand and the buttons under the log. */
export const usePhoneLayout = (): boolean =>
  useSyncExternalStore(
    onPhone,
    () => matchMedia(PHONE).matches,
    () => false,
  );

/** The durations of the window as custom properties (fx/timing.ts is the one place of the numbers). */
export const alarmVars = { ['--alarm-in' as string]: `${T.ui.alarmIn}ms`, ['--bell' as string]: `${T.ui.bell}ms` } as CSSProperties;

/** The bar in place of the line of the status: the bell, «ТРЕВОГА!», what is fired at whom. */
export function AlarmBar({ info }: { info: AlarmInfo }) {
  return (
    <div className="alarm-bar" data-testid="alarm" style={alarmVars}>
      <span className="alarm-bell" aria-hidden dangerouslySetInnerHTML={{ __html: BELL }} />
      <div className="alarm-words">
        <b className="alarm-title">ТРЕВОГА!</b>
        <span className="alarm-line">{info.line}</span>
      </div>
    </div>
  );
}

interface Geo {
  w: number;
  h: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The dashed arrow from the attacker to the target over the sea, a red pill «4 по Корпусу» on it. */
export function AlarmArrow({ box, from, to, label }: { box: RefObject<HTMLElement | null>; from: string; to: string; label: string | null }) {
  const [g, setG] = useState<Geo | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      // in the px of the stage (stage.ts)
      const sk = stageK();
      const inStage = (r: DOMRect) => ({ left: r.left / sk, top: r.top / sk, right: r.right / sk, bottom: r.bottom / sk, width: r.width / sk, height: r.height / sk });
      const b = inStage(el.getBoundingClientRect());
      const a0 = el.querySelector(`[data-ship="${from}"]`)?.getBoundingClientRect();
      const t0 = el.querySelector(`[data-ship="${to}"]`)?.getBoundingClientRect();
      const a = a0 && inStage(a0),
        t = t0 && inStage(t0);
      if (!a || !t) return;
      const down = a.top < t.top;
      const next: Geo = {
        w: Math.round(b.width),
        h: Math.round(b.height),
        x1: Math.round(a.left + a.width / 2 - b.left),
        y1: Math.round((down ? a.bottom : a.top) - b.top + (down ? 4 : -4)),
        x2: Math.round(t.left + t.width / 2 - b.left),
        y2: Math.round((down ? t.top : t.bottom) - b.top + (down ? -6 : 6)),
      };
      setG((o) => (o && o.w === next.w && o.h === next.h && o.x1 === next.x1 && o.y1 === next.y1 && o.x2 === next.x2 && o.y2 === next.y2 ? o : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      removeEventListener('resize', measure);
    };
  });
  if (!g) return null;
  const ang = Math.atan2(g.y2 - g.y1, g.x2 - g.x1);
  const head = (da: number) => `${(g.x2 - 14 * Math.cos(ang + da)).toFixed(1)} ${(g.y2 - 14 * Math.sin(ang + da)).toFixed(1)}`;
  const mx = (g.x1 + g.x2) / 2;
  const my = (g.y1 + g.y2) / 2;
  const pw = label ? Math.max(96, label.length * 9.2 + 30) : 0;
  return (
    <svg className="alarm-arrow" data-testid="alarm-arrow" width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden>
      <path d={`M${g.x1} ${g.y1} L${g.x2} ${g.y2}`} stroke="#ffb35c" strokeWidth="7" opacity=".25" strokeLinecap="round" />
      <path d={`M${g.x1} ${g.y1} L${g.x2} ${g.y2}`} stroke="#ffd18a" strokeWidth="2" strokeDasharray="7 5" strokeLinecap="round" />
      <path d={`M${head(0.5)} L${g.x2} ${g.y2} L${head(-0.5)}`} fill="none" stroke="#ffd18a" strokeWidth="2.2" strokeLinejoin="round" />
      {label && (
        <g className="alarm-pill" data-testid="alarm-pill" transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)})`}>
          <rect x={-pw / 2} y="-17" width={pw} height="34" rx="17" fill="#a3271d" stroke="#f4ead6" strokeWidth="1.5" />
          <text x="0" y="6" textAnchor="middle" fontFamily="Old Standard TT, serif" fontWeight="700" fontSize="16" fill="#fff">
            {label}
          </text>
        </g>
      )}
    </svg>
  );
}

/** The burning fuse above «Пропустить»: only when the window has a real timer; the length is the time left. */
export function Fuse({ seconds, k }: { seconds: number; k: string }) {
  const [left, setLeft] = useState(1);
  useEffect(() => {
    const t0 = Date.now();
    setLeft(1);
    const id = setInterval(() => setLeft(fuseLeft(seconds * 1000, Date.now() - t0)), 200);
    return () => clearInterval(id);
  }, [seconds, k]);
  return (
    <div
      className="alarm-fuse"
      data-testid="alarm-fuse"
      role="timer"
      aria-label={`Осталось ${Math.ceil(left * seconds)} с`}
      style={{ ['--left' as string]: left } as CSSProperties}
    >
      <i className="wick" />
      <i className="burnt" />
      <svg className="spark" width="18" height="18" viewBox="-9 -9 18 18" aria-hidden>
        <circle r="8" fill="#ff9a3c" opacity=".35" />
        <circle r="4.6" fill="#ffcf6b" />
        <path d="M0 0 l-6 -6 M0 0 l7 -5 M0 0 l2 -8" stroke="#ffcf6b" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const MEMO = 'Реакция — карта, которую играют в ход противника в ответ на его Залп. Можно пропустить.';

/** A laptop: the buttons under the log, where «Ход окончен» stands — the Reaction is chosen in the hand, then played here. */
export function AlarmActions({
  memo,
  pickName,
  now,
  folded,
  fuse,
  onSkip,
  onPlay,
  onInfo,
  onFold,
}: {
  memo: boolean;
  pickName: string | null;
  /** What the chosen Reaction does now (the engine's words), with or without «Подсказки». */
  now: string | null;
  folded: boolean;
  fuse: { seconds: number; k: string } | null;
  onSkip: () => void;
  onPlay: () => void;
  onInfo: () => void;
  onFold: (folded: boolean) => void;
}) {
  return (
    <div className="alarm-actions" data-testid="reaction-panel">
      {folded ? (
        <button className="alarm-back" data-testid="alarm-expand" onClick={() => onFold(false)}>
          Вернуться к Тревоге
        </button>
      ) : (
        <>
          {memo && (
            <p className="reaction-memo" data-testid="reaction-memo">
              {MEMO}
            </p>
          )}
          {pickName && (
            <div className="alarm-pick">
              <button className="alarm-play" data-testid="play-reaction" onClick={onPlay}>
                Сыграть «{pickName}»
              </button>
              <button className="alarm-info info" data-testid="reaction-info" aria-label={`Карта «${pickName}» целиком`} onClick={onInfo}>
                i
              </button>
              {now && (
                <b className="ro-effect alarm-now" data-testid="reaction-now">
                  {now}
                </b>
              )}
            </div>
          )}
          {fuse && <Fuse {...fuse} />}
          <button className="alarm-skip" data-testid="skip-reaction" onClick={onSkip}>
            Пропустить
          </button>
          <button className="alarm-fold" data-testid="alarm-collapse" onClick={() => onFold(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M2 5 L7 10 L12 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Свернуть, посмотреть стол
          </button>
        </>
      )}
    </div>
  );
}

/** A phone: the sheet from below — only the Reactions as cards, «Пропустить», the fuse. */
export function ReactionSheet({
  s,
  data,
  seats,
  hints,
  memo,
  pick,
  folded,
  fuse,
  alarmOf,
  onPick,
  onAct,
  onInfo,
  onFold,
}: {
  s: GameState;
  data: GameData;
  seats: string[];
  hints: boolean;
  memo: boolean;
  pick: { seat: string; card: string } | null;
  folded: boolean;
  fuse: { seconds: number; k: string } | null;
  alarmOf: (seat: string, code: string) => AlarmCard | null;
  onPick: (pick: { seat: string; card: string } | null) => void;
  onAct: (a: Action[]) => void;
  onInfo: (seat: string, card: string) => void;
  onFold: (folded: boolean) => void;
}) {
  if (folded) {
    return (
      <section className="panel alarm-sheet folded" data-testid="reaction-panel">
        <button className="alarm-back" data-testid="alarm-expand" onClick={() => onFold(false)}>
          Вернуться к Тревоге
        </button>
      </section>
    );
  }
  const items: { seat: string; card: string; plan: boolean }[] = [];
  for (const seat of seats) {
    const h = s.ships[seat];
    for (const card of [...h.hand, ...h.plans]) {
      if (card === '?' || cardByCode(data, card).type !== 'РЕАКЦИЯ') continue;
      items.push({ seat, card, plan: h.plans.includes(card) });
    }
  }
  items.sort((a, b) => Number(!!alarmOf(a.seat, a.card)?.why) - Number(!!alarmOf(b.seat, b.card)?.why));
  const side = s.ships[seats[0]]?.side;
  const picked = (it: { seat: string; card: string }) => pick?.seat === it.seat && pick.card === it.card;
  return (
    <section className="panel alarm-sheet" data-testid="reaction-panel" style={alarmVars}>
      <div className="as-head">
        <span className="as-title">Ответить Реакцией</span>
        <span className="as-count">
          {side ? `Порох ${s.teams[side].powder} из ${data.econ.cap}` : ''}
        </span>
      </div>
      <div className="as-mid">
        {hints && memo && (
          <p className="reaction-memo" data-testid="reaction-memo">
            {MEMO}
          </p>
        )}
        <div className="as-cards">
          {items.map((it) => {
            const a = alarmOf(it.seat, it.card);
            const now = reactionNow(s, data, it.seat, it.card);
            return (
              <div key={`${it.seat}-${it.card}`} className={`as-card ${a?.why ? 'off' : ''} ${picked(it) ? 'on' : ''}`} data-card={it.card}>
                <HandCard
                  data={data}
                  code={it.card}
                  plan={it.plan}
                  off={a?.why ?? null}
                  chosen={picked(it)}
                  alarm={a ?? undefined}
                  onClick={() => !a?.why && onPick(picked(it) ? null : { seat: it.seat, card: it.card })}
                />
                <button className="alarm-play" data-testid="play-reaction" disabled={!!a?.why}
                  onClick={() => onAct([{ type: 'react', seat: it.seat, card: it.card }])}>
                  Сыграть «{cardByCode(data, it.card).name}»
                </button>
                {!hints && now.ok && <b className="ro-effect as-now">{now.text}</b>}
                <button
                  className="info"
                  data-testid="reaction-info"
                  aria-label={`Карта «${cardByCode(data, it.card).name}» целиком`}
                  onClick={() => onInfo(it.seat, it.card)}
                >
                  i
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {fuse && <Fuse {...fuse} />}
      <div className="as-btns">
        <button className="alarm-skip" data-testid="skip-reaction" onClick={() => onAct(seats.map((seat) => ({ type: 'noReaction', seat })))}>
          Пропустить
        </button>
      </div>
      <button className="alarm-fold" data-testid="alarm-collapse" onClick={() => onFold(true)}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M2 5 L7 10 L12 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Свернуть, посмотреть стол
      </button>
    </section>
  );
}
