// Presentational parts of the table: the status bar, a team row with its Hold, a ship board (plank).
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { cardByCode, seaCardByCode, shipData, startValue, type GameState, type ShipState } from '../../engine/state';
import type { GameData, Side, Track } from '../../engine/types';
import { cardsWord } from '../../engine/log';
import { deckCards } from '../../engine/data';
import {noFxHint, type FxHintStore} from './fx/hintStore';
import { InfoTip } from './InfoTip';
import { plainText, roman, SIDE_LABEL } from './text';
import { cellUrl, CELLS, type CellIcon } from './art/cells';
import { shipSvg } from './art/ships';
import { legendMedal } from './art/medals';
import { fanSvg } from './art/fan';
import { ALARM_SEAL, TARGET_SEAL } from './art/seal';
import type { Loss } from './alarm';
import { hourglassSvg } from './art/table';
import { wxSvg } from './art/wx';
import { KNOT_SVG, KNOT_THIN_SVG } from './art/knot';
import { oakMedal, type OakSign } from './art/oak';
import { MARK_BLOT_SVG, MARK_PIN_SVG, READY_SVG, SOULS_SVG, tridentSvg, statusSvg, type StatusIcon } from './art/status';
import { ST3, stBadge } from './art/status3';
import { FLAME } from './art/fire';
import { usePhoneLayout } from './Alarm';
import diveIcon from './art/icons/dive.svg';
import soulIcon from './art/icons/soul.svg';
import { TRACK_RULE } from './memo';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const TRACK_LABEL: Record<Track, string> = { hull: 'Корпус', sails: 'Паруса', guns: 'Пушки', crew: 'Команда' };
/** The icons of a track (A5, art/cells2.json): a cell that is there and a lost one. */
const TRACK_ICON: Record<Track, [CellIcon, CellIcon]> = { hull: ['HULL', 'HULL_X'], sails: ['SAIL', 'SAIL_X'], guns: ['CANNON', 'CANNON_X'], crew: ['CREW', 'CREW_X'] };
const TRACK_ICON_STYLE = Object.fromEntries(
  TRACKS.map((t) => [t, { ['--on' as string]: cellUrl(TRACK_ICON[t][0]), ['--off' as string]: cellUrl(TRACK_ICON[t][1]) }]),
) as Record<Track, Record<string, string>>;
const svg = (html: string) => ({ __html: html });
const HOURGLASS = hourglassSvg();

export interface Btn {
  key: string;
  label: string;
  onClick: () => void;
  /** Grey with this reason as the hint. */
  disabled?: string | null;
  primary?: boolean;
  testid?: string;
  /** A shorter label for the phone. */
  short?: string;
  /** A small green tag on a plank button («+1 совместно»). */
  tag?: string;
  /** The full text of the tag: a paper pop on hover (a tap on a phone). */
  tip?: string;
}

export function Button({ b, className = '' }: { b: Btn; className?: string }) {
  return (
    <button
      className={`btn ${b.primary ? 'primary' : ''} ${className}`}
      onClick={b.disabled ? undefined : b.onClick}
      aria-disabled={!!b.disabled}
      title={b.disabled ?? undefined}
      data-testid={b.testid}
    >
      {b.short ? (
        <>
          <span className="wide">{b.label}</span>
          <span className="narrow">{breakAfterArrow(b.short)}</span>
        </>
      ) : (
        breakAfterArrow(b.label)
      )}
    </button>
  );
}

/**
 * The oak board with the wine panel and the brass medallion (A5Rig «Ход окончен»): «Ход окончен», «Огонь!» and «Реванш».
 * The label is the text of the button (the sign is a picture; CSS sets the capitals), `sub` — a small line under it.
 */
export function OakButton({ b, className = '', sign = 'anchor', sub }: { b: Btn; className?: string; sign?: OakSign; sub?: ReactNode }) {
  // each button gets its own copy of the picture: the ids inside are unique to it
  const medal = useRef<string>();
  medal.current ??= oakMedal(sign);
  return (
    <button
      className={`btn oak-btn ${b.label.length > 11 ? 'oak-long' : ''} ${className}`}
      onClick={b.disabled ? undefined : b.onClick}
      aria-disabled={!!b.disabled}
      title={b.disabled ?? undefined}
      data-testid={b.testid}
    >
      <span className="oak-in">
        <span className="oak-med" aria-hidden dangerouslySetInnerHTML={svg(medal.current)} />
        <span className="oak-pan">
          <b>{b.label}</b>
          {sub && <small>{sub}</small>}
        </span>
      </span>
    </button>
  );
}

/**
 * «Душа→Корп»: a label may go to a second line after «→» (<wbr>) — on a phone the buttons of a plank are a third of the
 * row; where the text does not wrap (white-space: nowrap) the break is ignored.
 */
function breakAfterArrow(text: string): ReactNode {
  const i = text.indexOf('→');
  if (i < 0 || i === text.length - 1) return text;
  return (
    <>
      {text.slice(0, i + 1)}
      <wbr />
      {text.slice(i + 1)}
    </>
  );
}


/**
 * ≥ 1280 px: the log is on the screen and the tools of the top row (the sea plaque, «Правила», «Настройки») stand over it,
 * in line with the row; narrower — in the row itself. One plaque of the sea in the page at any time (data-fx-sea-chip).
 */
const WIDE_LOG = '(min-width: 1280px)';
export function useWideLog(): boolean {
  return useSyncExternalStore(
    (on) => {
      const m = typeof matchMedia === 'function' ? matchMedia(WIDE_LOG) : null;
      m?.addEventListener('change', on);
      return () => m?.removeEventListener('change', on);
    },
    () => (typeof matchMedia === 'function' ? matchMedia(WIDE_LOG).matches : false),
    () => false,
  );
}

export function StatusBar({
  s,
  data,
  instruction,
  fxHint = noFxHint,
  waiting,
  onSea,
  extra,
  chip = true,
  hold,
  alarm,
}: {
  s: GameState;
  data: GameData;
  instruction: string;
  fxHint?: FxHintStore;
  waiting: boolean;
  onSea: () => void;
  /** The buttons of the row («Журнал», «Правила», «Настройки») when they stand in it, not over the log. */
  extra: ReactNode;
  /** The sea plaque stands in this row (false: over the log, see useWideLog). */
  chip?: boolean;
  /** The Hold of the top team (V1c): in the row, after the plate. */
  hold?: ReactNode;
  /** «Тревога!» (U2): the bar in place of the line of the status (the line stays in it for the reader and the tests). */
  alarm?: ReactNode;
}) {
  const phone = usePhoneLayout();
  const clipHint = useSyncExternalStore(fxHint.subscribe, fxHint.getSnapshot, () => null);
  const alarmNow = clipHint ? undefined : alarm;
  return (
    <header className="status" data-testid="status">
      <div className="status-turn">
        <span className={`dot ${s.active === 'ПИРАТЫ' ? 'pirates' : 'company'}`} aria-hidden />
        {/* the brass plate of A5 (a phone too, A5Phone «ПИРАТЫ · II»); for a screen reader — «Раунд 2 · Ход Пиратов» */}
        <span className="turn-plate">
          {/* a phone: «ПИРАТЫ · II» (A5Phone), without the word */}
          <span aria-hidden>{phone ? `${SIDE_LABEL[s.active].name} · ${roman(s.round)}` : `${SIDE_LABEL[s.active].name} · раунд ${roman(s.round)}`}</span>
          <span className="sr-only">
            Раунд {s.round} · Ход {SIDE_LABEL[s.active].gen}
          </span>
        </span>
      </div>
      {hold}
      <div className={`status-text ${waiting ? 'waiting' : ''} ${alarmNow ? 'alarm' : ''}`} data-testid="instruction" data-fx-instruction>
        {clipHint?.startsWith('Море:')?<button className="polish-sea-strip" data-testid="sea-strip" onClick={onSea}>{clipHint}<span className="sea-info-icon" aria-hidden="true">i</span></button>:(alarmNow ?? clipHint ?? instruction)}
      </div>
      {(chip || extra) && (
        <div className="status-tools">
          {chip && <SeaChip s={s} data={data} onSea={onSea} />}
          {extra}
        </div>
      )}
    </header>
  );
}

/**
 * The plaque of the sea: the picture of the card (still, no animation inside), «Море · весь раунд» and the card with its
 * effect; a press opens the sea card.
 */
export function SeaChip({ s, data, onSea }: { s: GameState; data: GameData; onSea: () => void }) {
  const sea = s.sea?.current ? seaCardByCode(data, s.sea.current) : null;
  if (!sea) return null;
  return (
    <button className="chip sea" onClick={onSea} title={`${sea.name}: ${sea.big}`} data-testid="sea-info" data-fx-sea-chip>
      <span className="sea-icon" dangerouslySetInnerHTML={svg(wxSvg(sea.key, 40, 34))} />
      <span className="sea-words">
        <span className="sea-cap"><span className="sea-phone">Море · {sea.when.toLowerCase()}</span><span className="sea-desktop">Море:</span></span>
        <span className="sea-name">
          «{sea.name}»<span className="sea-desktop"> | {sea.big}</span>
        </span>
      </span><span className="sea-info-icon" aria-hidden="true">i</span>
    </button>
  );
}

/** The icons of the round brass buttons (A5): the rules, the settings, the log, the tempo of the show, «Отменить». */
export const ROUND_ICON: Record<string, string> = {
  rules:
    '<svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true"><path d="M10 3.4 C7.6 1.8 4.6 1.6 1.6 2.4 V15.6 C4.6 14.8 7.6 15 10 16.6 C12.4 15 15.4 14.8 18.4 15.6 V2.4 C15.4 1.6 12.4 1.8 10 3.4 Z" fill="#f4ead6" stroke="#2a1a0c" stroke-width="1.2" stroke-linejoin="round"/><path d="M10 3.4 V16.6" stroke="#2a1a0c" stroke-width="1.1"/><path d="M3.6 5.4 Q6 5 8.2 5.8 M3.6 8.2 Q6 7.8 8.2 8.6 M11.8 5.8 Q14 5 16.4 5.4 M11.8 8.6 Q14 7.8 16.4 8.2" stroke="#8a7550" stroke-width=".8" fill="none"/></svg>',
  settings:
    '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M8.6 1.6 H11.4 L11.9 4.1 L13.6 4.8 L15.7 3.4 L17.6 5.3 L16.2 7.4 L16.9 9.1 L19.4 9.6 V12.4 L16.9 12.9 L16.2 14.6 L17.6 16.7 L15.7 18.6 L13.6 17.2 L11.9 17.9 L11.4 20.4 H8.6 L8.1 17.9 L6.4 17.2 L4.3 18.6 L2.4 16.7 L3.8 14.6 L3.1 12.9 L.6 12.4 V9.6 L3.1 9.1 L3.8 7.4 L2.4 5.3 L4.3 3.4 L6.4 4.8 L8.1 4.1 Z" transform="translate(0 -1) scale(1 .96)" fill="#2a1a0c"/><circle cx="10" cy="10" r="3.2" fill="#e0bd62" stroke="#2a1a0c" stroke-width="1"/></svg>',
  log: '<svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M3 1.5 H13.5 Q15.5 1.5 15.5 3.5 V18.5 H4.5 Q2.5 18.5 2.5 16.5 V2 Z" fill="#f4ead6" stroke="#2a1a0c" stroke-width="1.2"/><path d="M5.5 6 H12.5 M5.5 9 H12.5 M5.5 12 H10.5" stroke="#8e2b22" stroke-width="1"/></svg>',
  faster: '<svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true"><path d="M2 2 L10 8 L2 14 Z M10 2 L18 8 L10 14 Z" fill="#2a1a0c"/></svg>',
  skip: '<svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true"><path d="M1.5 2 L8.5 8 L1.5 14 Z M8.5 2 L15.5 8 L8.5 14 Z" fill="#2a1a0c"/><rect x="15.6" y="2" width="2.6" height="12" fill="#2a1a0c"/></svg>',
  pause: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.6" height="12" rx=".6" fill="#2a1a0c"/><rect x="9.4" y="2" width="3.6" height="12" rx=".6" fill="#2a1a0c"/></svg>',
  play: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2 L13.5 8 L4 14 Z" fill="#2a1a0c"/></svg>',
  undo: '<svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true"><path d="M7 3 L2.5 7 L7 11" fill="none" stroke="#2a1a0c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 7 H12 Q17.5 7 17.5 11.5 Q17.5 16 12 16 H8" fill="none" stroke="#2a1a0c" stroke-width="2" stroke-linecap="round"/></svg>',
};

/**
 * A round brass button with a caption under it (A5, the bottom right and the icons of the top row). The label of the
 * button stays its accessible name and its text (`.wide`, hidden from sight); the caption is the label without its
 * leading symbol («⏸ Пауза» → «Пауза»).
 */
export function RoundButton({ b, icon, className = '', thin = false, capNarrow }: { b: Btn; icon: string; className?: string; thin?: boolean; capNarrow?: string }) {
  const caption = b.label.replace(/^[^\p{L}]+/u, '');
  return (
    <button
      className={`btn round ${b.primary ? 'primary' : ''} ${className}`}
      onClick={b.disabled ? undefined : b.onClick}
      aria-disabled={!!b.disabled}
      aria-label={caption}
      title={b.disabled ?? caption}
      data-testid={b.testid}
    >
      {/* A5Rig «турецкий узел»: the woven ring (art/knot.ts) round the brass disc with the icon */}
      <span className="round-disc" aria-hidden>
        <span className="round-knot" dangerouslySetInnerHTML={svg(thin ? KNOT_THIN_SVG : KNOT_SVG)} />
        <span className="round-core" dangerouslySetInnerHTML={svg(ROUND_ICON[icon] ?? '')} />
      </span>
      <span className={`round-cap ${capNarrow ? 'wide' : ''}`} aria-hidden>
        {caption}
      </span>
      {/* fix-ui: a phone, the bottom bar — a shorter caption («До конца») */}
      {capNarrow && (
        <span className="round-cap cap-short" aria-hidden>
          {capNarrow}
        </span>
      )}
      <span className="wide sr-only">{b.label}</span>
      {b.short && <span className="narrow sr-only">{b.short}</span>}
    </button>
  );
}

export function PowderDots({ n, cap, side }: { n: number; cap: number; side?: Side }) {
  return (
    <span className="powder-dots" aria-label={`${n} Пороха`} data-fx-hold={side}>
      {Array.from({ length: cap }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} data-fx-keg />
      ))}
      <b>{n}</b>
    </span>
  );
}

/**
 * The Hold of the top team in the top row (V1c, A5 «Трюм Компании · 5 из 8»): the caption over a brass tray of kegs; on a
 * phone a row over the sea — «ТРЮМ КОМПАНИИ», the tray, «5/8» (A5Phone). The Powder clips fly here (data-fx-hold).
 */
export function TopHold({ side, s, data, fxGen = 0 }: { side: Side; s: GameState; data: GameData; fxGen?: number }) {
  const n = s.teams[side].powder,
    cap = data.econ.cap;
  return (
    <div className="top-hold" data-testid={`team-${side}`} title={`Трюм ${SIDE_LABEL[side].gen}: ${n} Пороха из ${cap}`}>
      <span className="hold-label">
        <span className="wide">
          Трюм {SIDE_LABEL[side].gen} · {n} из {cap}
        </span>
        <span className="narrow">Трюм {SIDE_LABEL[side].gen}</span>
      </span>
      <PowderDots key={fxGen} n={n} cap={cap} side={side} />
      <span className="narrow hold-n">
        {n}/{cap}
      </span>
    </div>
  );
}

export function TeamRow({
  side,
  s,
  data,
  hands,
  regroup,
  hint,
  fxGen = 0,
}: {
  side: Side;
  s: GameState;
  data: GameData;
  hands: number[] | null;
  regroup: Btn | null;
  hint: string | null;
  /** The animation layer changed the displayed state: the kegs it touched are built again. */
  fxGen?: number;
}) {
  const n = s.teams[side].powder;
  return (
    <div className="team-row" data-testid={`team-${side}`}>
      <b className="team-name">{SIDE_LABEL[side].upper}</b>
      {/* laptop (A5): «Трюм пиратов · 2 из 8» over the kegs; phone: «ТРЮМ ПИРАТОВ», the tray, «2/8» and «Перестроение» right */}
      <span className="muted hold-label">
        <span className="wide">
          Трюм {SIDE_LABEL[side].gen} · {n} из {data.econ.cap}
        </span>
        <span className="narrow">Трюм {SIDE_LABEL[side].gen}</span>
      </span>
      <PowderDots key={fxGen} n={n} cap={data.econ.cap} side={side} />
      <span className="narrow hold-n">
        {n}/{data.econ.cap}
      </span>
      {/* A5: the hourglass beside the tray of the bottom Hold (laptop only, game.css) */}
      <span className="hold-glass" aria-hidden dangerouslySetInnerHTML={svg(HOURGLASS)} />
      {hands && hands.length > 0 && <span className="muted wide">· в руках {hands.join(' и ')} {cardsWord(hands[hands.length - 1]).split(' ')[1]}</span>}
      {regroup && <PlankButton b={regroup} className="small regroup" />}
      {hint && <span className="muted wide hint">· {hint}</span>}
    </div>
  );
}

/** The plank is a target to choose (a Volley, a card or a Legend with a target): the whole plank is the button. */
export interface Plate {
  /** «Подсказки»: the damage, as a small tag in the corner (not a button). */
  tip: string | null;
  onClick: () => void;
  chosen: boolean;
}

export interface Status {
  label: string;
  hint: string;
  /** «Чёрная метка»: the chip carries the blot (the Volley's cannonballs «в метку» hit it). */
  mark?: boolean;
  /** The flag of the event that sets it (flagSet / surfaced): the chip waits hidden for its clip (A4). */
  flag?: string;
  /** The window of the chip (S1), when it says more than `hint`: «Чёрная метка» — the text of its card. */
  info?: string;
  /** The icon of the chip (A5, art/status.ts). */
  icon?: StatusIcon;
}

// The windows of the badges (S1): the rules of RULES.md 13.2–13.3 (Fires) and 3.6, 6.3, 14.7 (Souls).
const FIRE_INFO = 'В начале хода своей команды теряется 1 Корпус за каждый Пожар. Чтобы потушить 1 Пожар, сбросьте 1 карту с руки. В свой ход это можно делать сколько угодно раз.';
const SOULS_INFO = 'Только у «Голландца», не больше 5. +1 Душа за каждый вражеский корабль, получивший от «Голландца» урон по Команде. Тратятся на карты с бирюзовой ценой; в свой ход 1 Душа = +1 Корпус или +1 Команда «Голландца».';
/** The text of the card «Чёрная метка» (the card with the operation «mark»), without its markup. */
function markText(data: GameData): string {
  const card = deckCards(data).find((c) => (c.fx.ops || []).some((o) => o[0] === 'mark'));
  return card ? `Карта «${card.name}»: ${plainText(card.text)}` : '';
}

/**
 * «Чёрная метка» on the plank of the marked ship, on the drawing of the ship in the head: on a laptop the torn leaf blackened
 * with soot, pinned with a dagger (A5, MARK_PIN); on a phone a black blot (A5Phone). It appears when the blot of the clip
 * lands (statusFx) and goes with the status.
 */
function MarkStamp({ cls, hidden, art = MARK_PIN_SVG }: { cls: string; hidden: boolean; art?: string }) {
  return <span className={`mark-stamp ${cls}`} data-fx-mark-stamp aria-hidden style={hidden ? { visibility: 'hidden' } : undefined} dangerouslySetInnerHTML={svg(art)} />;
}

/** The colours of the enamel of a status badge (ST3): the pill of a chip on a phone. */
const chipColours = (icon?: StatusIcon) => {
  const t = icon ? ST3[icon] : undefined;
  return t ? { ['--chip-a' as string]: t.bg[0], ['--chip-b' as string]: t.bg[1] } : {};
};

/** A phone: «Пожар» is small flames on the drawing of the ship in the head (still flames; CSS makes them flicker). */
function HeadFire({ n }: { n: number }) {
  const art = useMemo(() => Array.from({ length: Math.min(3, n) }, () => FLAME(11, false)).join(''), [n]);
  return <span className="head-fire" aria-hidden dangerouslySetInnerHTML={svg(art)} />;
}

/** Statuses of a ship with the moment they end (docs/TZ.md, «Принципы стола», п. 2). */
export function statuses(s: GameState, data: GameData, ship: ShipState): Status[] {
  const out: Status[] = [];
  if (ship.sunk) {
    const ally = Object.values(s.ships).find((x) => x.side === ship.side && x.code !== ship.code);
    return [
      ally && !ally.sunk
        ? { label: 'Утонул', hint: 'Капитан на борту союзника: 1 карта и 1 Реакция за ход за союзника', icon: 'sunk' }
        : { label: 'Утонул', hint: 'Корабль потоплен', icon: 'sunk' },
    ];
  }
  if (ship.submerged) out.push({ label: 'Под водой', hint: 'До своего хода: нельзя выбрать целью, не играет Реакции', icon: 'under' });
  if (ship.surfaced) out.push({ label: 'Всплыл', hint: 'Первый Залп в этот ход: +1 и без Реакций', flag: 'surfaced', icon: 'surfaced' });
  if (ship.blockaded) out.push({ label: 'Блокада', hint: 'До конца своего следующего хода: без Ремонта и смены мест', flag: 'blockade', icon: 'blockade' });
  if (ship.parley) out.push({ label: 'Переговоры', hint: 'В свой следующий ход не даёт Залпы', flag: 'parley', icon: 'parley' });
  if (ship.voodoo) {
    out.push({ label: 'Кукла вуду', hint: `В свой следующий ход теряет 1 Команду за каждую сыгранную карту (кукла «${shipData(data, ship.voodoo).nick}»)`, flag: 'voodoo', icon: 'voodoo' });
  }
  const mark = s.turn.marks[ship.code];
  if (mark) out.push({ label: `Чёрная метка +${mark}`, hint: 'До конца этого хода: каждый Залп по кораблю сильнее', info: markText(data), mark: true, flag: 'mark', icon: 'mark' });
  if (s.turn.noReact.includes(ship.code) || (s.turn.noReactTeam && ship.side !== s.active)) {
    out.push({ label: 'Без Реакций', hint: 'До конца этого хода не играет Реакции', flag: 'noReact', icon: 'noReact' });
  }
  return out;
}

function PlankView({
  captainOnBoard=false,
  s,
  data,
  ship,
  own,
  selected,
  awaiting,
  targeted,
  shooter,
  alarm = null,
  repairing = false,
  aimOff = false,
  ready = false,
  plate,
  buttons,
  role,
  onSelect,
  onDetails,
  onLegend,
  flashLegend = false,
  fxGen = 0,
  fxHidden,
  reactionWait,
}: {
  /**
   * The inputs of the game this plank was built from (Game: tableInteraction). With the same stamp only what the plank
   * shows of the displayed state is compared — its handlers and buttons are the same by construction.
   */
  stamp?: object;
  captainOnBoard?: boolean;
  reactionWait?: ReactNode;
  s: GameState;
  data: GameData;
  ship: ShipState;
  own: boolean;
  /** «Подсказки» on: the Legend flashes once when it becomes available. */
  flashLegend?: boolean;
  selected: boolean;
  awaiting: boolean;
  targeted: boolean;
  shooter: boolean;
  /** «Тревога!»: this ship is the target of the Volley the team answers; `loss` — what it loses (only under «Подсказки»). */
  alarm?: { loss: Loss[] | null } | null;
  /** The card being played repairs this ship (green frame while its panel is open). */
  repairing?: boolean;
  /** fix-ui: a target is being chosen and this ship is not one — dimmed. */
  aimOff?: boolean;
  /** The player pressed «Ход окончен» this turn: «✓ готов» in the head, seen by everyone. */
  ready?: boolean;
  plate: Plate | null;
  buttons: Btn[];
  role: string | null;
  onSelect: () => void;
  onDetails: () => void;
  onLegend: (() => void) | null;
  /** The animation layer changed the displayed state: the tracks it touched (setTrack) are built again. */
  fxGen?: number;
  /** Flags of statuses whose clip has not played yet: their chips are there, hidden (statusFx shows them as it lands). */
  fxHidden?: readonly string[];
}) {
  const d = shipData(data, ship.code);
  const phone = usePhoneLayout();
  const buttonsRef = useMoreSides<HTMLDivElement>();
  const st = statuses(s, data, ship);
  const marked = st.some((x) => x.mark);
  const markHidden = !!fxHidden?.includes('mark');
  const legendCard = cardByCode(data, `${ship.code}-Л`);
  const legendName = legendCard.name;
  // Grey when the team lacks the Powder or the Souls for it (docs/TZ.md, «Принципы стола», п. 9).
  const keeper = Object.values(s.ships).find((x) => x.side === ship.side && !x.sunk && shipData(data, x.code).souls !== undefined);
  const affordable = s.teams[ship.side].powder >= legendCard.cost && (legendCard.soul === 0 || (keeper?.souls ?? 0) >= legendCard.soul);
  const legendState = ship.legend ? (affordable ? 'ready' : 'poor') : 'gone';
  const flash = useLegendFlash(legendState, flashLegend) ? 'legend-flash' : '';
  const handLabel = cardsWord(ship.hand.length);
  const cls = [
    'plank',
    buttons.length > 0 ? 'has-buttons' : '',
    own ? 'own' : 'enemy',
    selected ? 'selected' : '',
    awaiting ? 'awaiting' : '',
    targeted ? 'targeted' : '',
    alarm ? 'alarmed' : '',
    shooter ? 'shooter' : '',
    repairing ? 'repairing' : '',
    ship.sunk ? 'sunk' : '',
    ship.submerged ? 'submerged' : '',
    plate ? (plate.chosen ? 'chosen' : 'aimable') : '',
    aimOff ? 'aim-off' : '',
  ].join(' ');
  // While a target is chosen, a press anywhere on the target (the head too) chooses it; «i» opens the ship card,
  // the star and the Legend badge are a part of the target.
  const aim = plate
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `Цель: «${d.nick}»${plate.tip ? `, ${plate.tip}` : ''}`,
        'aria-pressed': plate.chosen,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          plate.onClick();
        },
      }
    : {};
  const fireLabel = `Пожар ${ship.fires}`;
  const soulsLabel = `Души ${ship.souls}/${d.souls}`;
  // A phone (A5Phone, frame 1): the statuses are a row of coloured chips under the tracks, «Пожар ×N» among them; three and
  // more — only the badges (the name stays for the reader and in the window of the rule).
  const fireChip = phone && ship.fires > 0;
  const iconsOnly = phone && st.length + (fireChip ? 1 : 0) >= 3;
  const chipText = (label: string) => (phone ? <span className={iconsOnly ? 'sr-only' : 'chip-label'}>{label}</span> : label);
  const statusRow = (st.length > 0 || fireChip) && (
    <div className={`plank-statuses${iconsOnly ? ' icons' : ''}`} data-fx-statuses>
      {st.map((x) => (
        <InfoTip
          key={x.label}
          className={`status-chip${x.mark ? ' mark' : ''}`}
          title={x.label}
          text={x.info ?? x.hint}
          off={!!plate}
          data={{ 'data-fx-status': x.label, 'data-fx-mark': x.mark || undefined }}
          style={{ ...(phone ? chipColours(x.icon) : {}), ...(x.flag && fxHidden?.includes(x.flag) ? { visibility: 'hidden' } : {}) }}
        >
          {x.icon && <span className="chip-icon" dangerouslySetInnerHTML={svg(stBadge(x.icon, 18) || statusSvg(x.icon))} />}
          {chipText(x.label)}
        </InfoTip>
      ))}
      {fireChip && (
        <InfoTip className="status-chip fire" title={fireLabel} text={FIRE_INFO} off={!!plate} data={{ 'data-fx-fires': true, 'data-testid': `fire-${ship.code}` }} style={chipColours('fire')}>
          <span className="chip-icon" dangerouslySetInnerHTML={svg(stBadge('fire', 18))} />
          {chipText(`Пожар ×${ship.fires}`)}
        </InfoTip>
      )}
    </div>
  );
  const legendTitle = ship.legend
    ? `Легенда «${legendName}»: ${affordable ? 'нажмите, чтобы прочитать' : 'не хватает Пороха или Душ'}`
    : `Легенда «${legendName}» сыграна`;
  return (
    <section
      className={cls}
      data-testid={plate ? `plate-${ship.code}` : `plank-${ship.code}`}
      data-has-souls={d.souls !== undefined ? '' : undefined}
      data-captain-on-board={captainOnBoard?'':undefined}
      data-ship={ship.code}
      data-fx-ship={ship.code}
      style={{ ['--ship' as string]: d.color }}
      onClick={plate ? plate.onClick : onSelect}
      {...aim}
    >
      <header
        className="plank-head"
        onClick={
          plate
            ? undefined
            : (e) => {
                e.stopPropagation();
                onDetails();
              }
        }
        title={plate ? undefined : 'Подробнее о корабле'}
      >
      {captainOnBoard&&<span title={`Капитан «${d.nickGenitive}» на борту`} className="polish-captain-tab" data-testid={`captain-${ship.code}`}>Капитан «{d.nickGenitive}» на борту</span>}
        <span className="ship-art">
          <span className="ship-pic" dangerouslySetInnerHTML={svg(shipSvg(ship.code, 58, 28, `plank-${ship.code}`))} />
          {phone && ship.fires > 0 && <HeadFire n={ship.fires} />}
          {marked && (phone ? <MarkStamp cls="blot" hidden={markHidden} art={MARK_BLOT_SVG} /> : <MarkStamp cls="wide" hidden={markHidden} />)}
        </span>
        <b className="plank-name">
          <span className="wide">{d.name}</span>
          <span className="narrow">{d.nick}</span>
        </b>
        {ship.legend && (
          // On a phone the medallion of the head is hidden: the star opens the same Legend card, not the ship card.
          <button
            className={`star narrow ${affordable ? '' : 'poor'} ${flash}`}
            data-testid={`star-${ship.code}`}
            aria-label={`Легенда «${legendName}»`}
            title={`Легенда «${legendName}»${affordable ? '' : '. Не хватает Пороха или Душ'}`}
            tabIndex={plate ? -1 : undefined}
            onClick={(e) => {
              if (plate) return;
              e.stopPropagation();
              onLegend?.();
            }}
            dangerouslySetInnerHTML={svg(legendMedal(legendName, `md-${ship.code}-n`))}
          />
        )}
        <span className="captain wide">{d.captain}</span>
        {plate?.tip && (
          // In the head on a laptop (the Volley panel covers the bottom of the top planks); in the corner on a phone.
          <span className="aim-tip" data-testid={`aim-tip-${ship.code}`} aria-hidden>
            {plate.tip}
          </span>
        )}
        {reactionWait}
        <span className="plank-role">
          {(targeted || plate?.chosen) && (
            // «Под огнём»: the wax seal of the target, pressed into the head (A5, TARGET_SEAL); it lives in the plank.
            <span
              className="target-seal"
              data-testid={alarm ? `alarm-sabres-${ship.code}` : `target-seal-${ship.code}`}
              title={alarm ? 'Тревога: по кораблю дают Залп' : 'Под огнём'}
              dangerouslySetInnerHTML={svg(alarm ? ALARM_SEAL : TARGET_SEAL)}
            />
          )}
          {/* a phone: the chosen plank is in a gold frame instead (A5Phone), the tag is not shown */}
          {selected && <span className="head-tag mine chosen-tag">ВЫБРАН</span>}
          {role && <span className="head-tag mine">{role}</span>}
          {ready && (
            // On a phone only «✓»: with «ВЫБРАН» next to it the name of the ship stays whole.
            <span className="head-tag ready" data-testid={`ready-${ship.code}`} title="Готов: ход окончен">
              <span className="tick" dangerouslySetInnerHTML={svg(READY_SVG)} />
              <span className="wide">готов</span>
            </span>
          )}
          <span className="hand-count" title={`Карт в руке: ${ship.hand.length}`} aria-label={handLabel} dangerouslySetInnerHTML={svg(fanSvg(ship.hand.length))} />
          {!ship.sunk && (
            <button
              className={`legend-medal wide ${legendState} ${flash}`}
              data-fx-legend
              aria-label={legendTitle}
              tabIndex={plate ? -1 : undefined}
              onClick={(e) => {
                if (plate) return;
                e.stopPropagation();
                onLegend?.();
              }}
              title={legendTitle}
              dangerouslySetInnerHTML={svg(legendMedal(legendName, `md-${ship.code}-w`, (['Ж', 'М', 'И', 'Г'].indexOf(ship.code) * 1.7).toFixed(1)))}
            />
          )}
        </span>
        {plate && (
          <button
            className="ship-info"
            data-testid={`ship-info-${ship.code}`}
            aria-label={`Корабль «${d.nick}»: подробнее`}
            title="Подробнее о корабле"
            onClick={(e) => {
              e.stopPropagation();
              onDetails();
            }}
          >
            i
          </button>
        )}
      </header>
      {!phone && statusRow}
      <div className={`plank-body${d.souls !== undefined ? ' with-souls' : ''}`}>
        <div className="tracks" key={fxGen}>
          {trackEl('hull')}
          <div className="track-row2">{(['sails', 'guns', 'crew'] as const).map(trackEl)}</div>
        </div>
        <div className="badges">
          {ship.fires > 0 && !phone && (
            <InfoTip className="badge fire" title={fireLabel} text={FIRE_INFO} off={!!plate} data={{ 'data-fx-fires': true, 'data-testid': `fire-${ship.code}` }}>
              <span className="chip-icon" dangerouslySetInnerHTML={svg(stBadge('fire', 18))} />
              {fireLabel}
            </InfoTip>
          )}
          {d.souls !== undefined && (
            <InfoTip className="badge souls" title={soulsLabel} text={SOULS_INFO} off={!!plate} data={{ 'data-fx-souls': true, 'data-testid': `souls-${ship.code}` }}>
              <span className="chip-icon" dangerouslySetInnerHTML={svg(SOULS_SVG)} />
              {/* a phone: the skull and «1/5» (the word is hidden there) */}
              {phone ? (
                <>
                  <span className="souls-word">Души</span> {ship.souls}/{d.souls}
                </>
              ) : (
                soulsLabel
              )}
            </InfoTip>
          )}
        </div>
      </div>
      {phone && statusRow}
      {buttons.length > 0 && (
        <div className="plank-buttons-wrap" onClick={(e) => e.stopPropagation()}>
          {/* ui-5: on a laptop the buttons keep their names in one row, only «Погружение» and the Souls are an icon (the name in a
              paper pop) */}
          <div className={`plank-buttons ${buttons.length >= 3 ? 'n3plus' : `n${buttons.length}`} ${buttons.length >= 4 ? 'many' : ''}`} ref={buttonsRef}>
            {buttons.map((b) => (
              <PlankButton key={b.key} b={b} compact={!phone && b.key in ICON_URL} />
            ))}
          </div>
        </div>
      )}
      {/* FX-A: the traces the effects leave on this ship (fx/scars.ts). React never fills it, so they live through the
          renders and ride with the ship when it changes places (the planks are keyed by the ship). */}
      <div className="plank-scars" aria-hidden />
    </section>
  );

  /**
   * A track: the label, the icons (.cells > i.on — the contract of the animations), the bar, «9/11». A phone (A5Phone): no
   * label; the Hull is its planks and the number, the others one icon and «2/3»; a press on the icon opens the rule.
   */
  function trackEl(t: Track) {
    const max = startValue(data, ship.code, t);
    const v = ship.tracks[t];
    const loss = alarm?.loss?.find((x) => x.track === t);
    const low = v <= (t === 'crew' ? 1 : 0) && t !== 'hull';
    return (
      <div key={t} className={`track t-${t}${low ? ' is-low' : ''}`} data-fx-track={t} style={TRACK_ICON_STYLE[t]}>
        <span className="track-label">{TRACK_LABEL[t]}</span>
        {phone && (
          <InfoTip className="track-tip" title={TRACK_LABEL[t]} text={TRACK_RULE[t]} off={!!plate} onPress={onSelect}>
            <span className="track-icon" aria-hidden />
            <span className="sr-only">{TRACK_LABEL[t]}</span>
          </InfoTip>
        )}
        <span className="cells" aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <i key={i} className={`${i < v ? 'on' : ''}${loss && i >= loss.to && i < loss.from ? ' doomed' : ''}`} />
          ))}
        </span>
        <span className="bar" aria-hidden>
          <i style={{ width: `${(100 * v) / max}%` }} />
        </span>
        <b className={`track-num ${low ? 'low' : ''}`} data-fx-value>
          {`${v}/${max}`}
        </b>
        {loss && (
          <b className="al-loss" data-testid={`alarm-loss-${ship.code}-${t}`}>
            −{loss.n}
          </b>
        )}
      </div>
    );
  }
}

type PlankProps = Parameters<typeof PlankView>[0];
/** What a plank shows of the displayed state besides its own ship: the Powder of its side, the active side, its allies. */
const plankSide = (p: PlankProps) =>
  `${p.s.active}|${p.s.teams[p.ship.side].powder}|${Object.values(p.s.ships).filter((x) => x.side === p.ship.side).map((x) => `${x.code}${+x.sunk}${x.souls}`).join()}`;
const plankShip = (x: ShipState) => `${x.pos}|${x.tracks.hull},${x.tracks.sails},${x.tracks.guns},${x.tracks.crew}|${x.fires}|${+x.sunk}${+x.submerged}${+x.legend}|${x.souls}`;
function samePlank(a: PlankProps, b: PlankProps): boolean {
  if (a.stamp === undefined || a.stamp !== b.stamp) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof PlankProps>;
    // (the stamp itself only says the props came from another render of Game: each of them is compared — ui-press)
    for (const k of keys) if (k !== 'stamp' && !Object.is(a[k], b[k])) return false;
    return true;
  }
  return a.fxGen === b.fxGen && a.s.turn === b.s.turn && plankShip(a.ship) === plankShip(b.ship) && plankSide(a) === plankSide(b) &&
    (a.fxHidden ?? []).join() === (b.fxHidden ?? []).join();
}
/** A plank of the table: drawn again when its inputs change, not at every step of a clip (fx-smooth-a). */
export const Plank = memo(PlankView, samePlank);

/** The icons of the buttons of a plank (A5: an icon, the name | the price with a keg). */
const CMD_ICON: Record<string, string> = {
  volley: CELLS.GUN,
  heart: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14 C3 10.4 1.2 7.8 1.2 5.4 C1.2 3.2 2.9 1.6 4.9 1.6 C6.2 1.6 7.3 2.3 8 3.4 C8.7 2.3 9.8 1.6 11.1 1.6 C13.1 1.6 14.8 3.2 14.8 5.4 C14.8 7.8 13 10.4 8 14 Z" fill="#a3271d" stroke="#3a0f0a" stroke-width=".8"/><path d="M4 4 Q5 3 6.2 3.4" stroke="#f3b1a4" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>',
  treasury: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="8" cy="12" rx="6" ry="2.2" fill="#a87c22" stroke="#4a340c" stroke-width=".7"/><ellipse cx="8" cy="9" rx="6" ry="2.2" fill="#c99a3a" stroke="#4a340c" stroke-width=".7"/><ellipse cx="8" cy="6" rx="6" ry="2.2" fill="#e2bf62" stroke="#4a340c" stroke-width=".7"/><path d="M5 5.6 Q8 4.4 11 5.6" stroke="#fff3c4" stroke-width=".6" fill="none"/></svg>',
  regroup: '<svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><path d="M2 4 H13 M10 1 L13 4 L10 7 M14 10 H3 M6 7 L3 10 L6 13" fill="none" stroke="#2a2521" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
/**
 * ui-5: the icons of «Погружение» and the Souls are pictures of their own (art/icons), shown as images: the dive has gradients
 * with fixed ids, which would clash between copies in the markup.
 */
const ICON_URL: Record<string, string> = { dive: diveIcon, soulHull: soulIcon, soulCrew: soulIcon };
/** ui-fixes: what a Soul gives, on the button itself — the icon of its track (a cell of the Hull, a sailor of the Crew). */
const SOUL_TRACK: Record<string, CellIcon> = { soulHull: 'HULL', soulCrew: 'CREW' };

/** «→ [icon] +1» after the skull of a Soul button: the «+1» is the one of its label («Душа → +1 Корпус», engine/hints.ts). */
function SoulGain({ b }: { b: Btn }) {
  const icon = SOUL_TRACK[b.key];
  const plus = /\+\d+/.exec(b.label)?.[0];
  if (!icon || !plus) return null;
  return (
    <span className="soul-gain" aria-hidden>
      <span className="soul-arrow">→</span>
      <span className="soul-track" dangerouslySetInnerHTML={svg(CELLS[icon])} />
      <span className="soul-plus">{plus}</span>
    </span>
  );
}
/** «Залп · 1 П»: the name and the price in Powder. */
const PRICED = /^(.*?) · (\d+) П$/;
/** «Перестроение · бесплатно»: free while «Жемчужина» of the Pirates is afloat. */
const FREE = /^(.*?) · (бесплатно)$/;
/** The keg of a price (KEG_S of art/cells2.json). */
const KEG_SMALL = CELLS.KEG_S;

/** A button of a plank: on a laptop the icon, the name and the price with a keg; on a phone the icon and the short label (U3). */
export function PlankButton({ b, className = '', compact = false }: { b: Btn; className?: string; compact?: boolean }) {
  const m = PRICED.exec(b.label) ?? FREE.exec(b.label);
  // the trident has gradients of its own: one copy for the life of the button, so the picture is not set again on a render
  const trident = useMemo(() => (b.key === 'sword' ? tridentSvg(20) : null), [b.key]);
  const icon = trident ?? CMD_ICON[b.key];
  // fx-smooth-a: the short label of a phone carries the same icon (a trident of its own: its gradient ids are unique)
  const shortTrident = useMemo(() => (b.key === 'sword' ? tridentSvg(20) : null), [b.key]);
  const shortIcon = shortTrident ?? CMD_ICON[b.key];
  const url = ICON_URL[b.key];
  const name = m ? m[1] : b.label;
  const shortName: Record<string,string>={volley:'Залп',heart:'Сердце',treasury:'Казна',sword:'Меч',dive:'Нырок'};
  // compact (a laptop, an icon-only button): the name and, if it cannot be pressed, the reason — in the paper pop of the game
  // (the same as «+1 совместно»), not in the title of the browser; a button without an icon keeps its short name
  const only = compact && !!(icon || url);
  // ui-5: a picture stands for a word (on a laptop the whole name, on a phone «Нырок» and «Душа») — the name goes to the pop
  const pop = only || url ? [name, b.tip, b.disabled].filter(Boolean).join(' — ') : b.tip;
  return (
    <button
      className={`btn cmd ${b.primary ? 'primary' : ''} ${only ? 'compact' : ''} ${url ? `pic${b.key === 'dive' ? '' : ' soul'}` : ''} ${className}`}
      onClick={b.disabled ? undefined : b.onClick}
      aria-disabled={!!b.disabled}
      aria-label={b.label}
      title={b.disabled ?? b.label}
      data-testid={b.testid}
      data-tip={pop}
    >
      {b.tag && (
        <span className="cmd-tag" data-testid={b.testid ? `${b.testid}-tag` : undefined}>
          {b.tag}
        </span>
      )}
      {/* a laptop always; a phone while a plank has one or two buttons (game.css) — else the short label */}
      <span className="cmd-in">
        {url ? (
          <>
            <span className={`cmd-icon cmd-pic i-${b.key === 'dive' ? 'dive' : 'soul'}`}>
              <img src={url} alt="" draggable={false} />
            </span>
            <SoulGain b={b} />
          </>
        ) : (
          icon && <span className="cmd-icon" dangerouslySetInnerHTML={svg(icon)} />
        )}
        <span className="cmd-name" data-phone-name={shortName[b.key] ?? name}>{name}</span>
        {SOUL_TRACK[b.key] && <span className="cost narrow soul-price" aria-label="1 Душа">1 <img src={soulIcon} alt=""/></span>}
        {m && (
          <span className={`cost ${m[2] === 'бесплатно' ? 'free' : ''}`} aria-label={m[2] === 'бесплатно' ? 'бесплатно' : `${m[2]} Пороха`}>
            {m[2]}
            {m[2] !== 'бесплатно' && <span className="cost-keg" dangerouslySetInnerHTML={svg(KEG_SMALL)} />}
          </span>
        )}
      </span>
      <span className="narrow cmd-short">
        {url ? (
          <>
            <img className="short-pic" src={url} alt="" draggable={false} />
            {/* a Soul → the skull, «→», the icon of its track and «+1»; «Нырок» → the picture alone */}
            <SoulGain b={b} />
          </>
        ) : (
          <>
            {shortIcon && <span className="short-icon" aria-hidden dangerouslySetInnerHTML={svg(shortIcon)} />}
            {breakAfterArrow(b.short ?? b.label)}
          </>
        )}
      </span>
    </button>
  );
}

/**
 * A row that scrolls sideways with a finger (the buttons of a plank on a phone, U3, ui-5): «data-more» on its wrapper while
 * there is more of it to the right, «data-more-left» — to the left; the edge with more fades softly.
 */
function useMoreSides<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // on the wrapper of the row: the fades stand there; the last 8 px are the padding of the row
    const check = () => {
      el.parentElement?.toggleAttribute('data-more', el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
      el.parentElement?.toggleAttribute('data-more-left', el.scrollLeft > 8);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      removeEventListener('resize', check);
    };
  });
  return ref;
}

/** One flash when the Legend became available (not on the first render, not again until it was unavailable). */
function useLegendFlash(state: string, on: boolean): boolean {
  const prev = useRef(state);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const became = prev.current !== 'ready' && state === 'ready';
    prev.current = state;
    if (!became || !on) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1500);
    return () => clearTimeout(t);
  }, [state, on]);
  return flash;
}
