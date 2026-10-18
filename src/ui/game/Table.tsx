// Presentational parts of the table: the status bar, a team row with its Hold, a ship board (plank).
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cardByCode, seaCardByCode, shipData, startValue, type GameState, type ShipState } from '../../engine/state';
import type { GameData, Side, Track } from '../../engine/types';
import { cardsWord } from '../../engine/log';
import { deckCards } from '../../engine/data';
import { InfoTip } from './InfoTip';
import { SIDE_LABEL } from './text';
import { reducedMotion } from '../start/motion';
import { cellUrl, CELLS, type CellIcon } from './art/cells';
import { shipSvg } from './art/ships';
import { legendMedal } from './art/medals';
import { fanSvg } from './art/fan';
import { TARGET_SEAL } from './art/seal';
import { MARK_PIN_SVG, READY_SVG, SOULS_SVG, TRIDENT_SVG, statusSvg, type StatusIcon } from './art/status';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const TRACK_LABEL: Record<Track, string> = { hull: 'Корпус', sails: 'Паруса', guns: 'Пушки', crew: 'Команда' };
/** The icons of a track (A5, art/cells2.json): a cell that is there and a lost one. */
const TRACK_ICON: Record<Track, [CellIcon, CellIcon]> = { hull: ['HULL', 'HULL_X'], sails: ['SAIL', 'SAIL_X'], guns: ['GUN', 'GUN_X'], crew: ['CREW', 'CREW_X'] };
const TRACK_ICON_STYLE = Object.fromEntries(
  TRACKS.map((t) => [t, { ['--on' as string]: cellUrl(TRACK_ICON[t][0]), ['--off' as string]: cellUrl(TRACK_ICON[t][1]) }]),
) as Record<Track, Record<string, string>>;
const svg = (html: string) => ({ __html: html });

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

export function StatusBar({
  s,
  data,
  instruction,
  waiting,
  onSea,
  extra,
}: {
  s: GameState;
  data: GameData;
  instruction: string;
  waiting: boolean;
  onSea: () => void;
  extra: ReactNode;
}) {
  const sea = s.sea?.current ? seaCardByCode(data, s.sea.current) : null;
  return (
    <header className="status" data-testid="status">
      <div className="status-turn">
        <span className={`dot ${s.active === 'ПИРАТЫ' ? 'pirates' : 'company'}`} aria-hidden />
        <span className="wide">
          Раунд {s.round} · Ход {SIDE_LABEL[s.active].gen}
        </span>
        <span className="narrow">
          Р{s.round} · {SIDE_LABEL[s.active].name}
        </span>
      </div>
      <div className={`status-text ${waiting ? 'waiting' : ''}`} data-testid="instruction" data-fx-instruction>
        {instruction}
      </div>
      <div className="status-tools">
        {sea && (
          <button className="chip sea" onClick={onSea} title={`${sea.name}: ${sea.big}`} data-fx-sea-chip>
            <span className="wide">
              <b>Море:</b> {sea.name} <span className="muted">· {sea.big}</span>
            </span>
            <span className="narrow">{sea.name} ⓘ</span>
          </button>
        )}
        {extra}
      </div>
    </header>
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
  return (
    <div className="team-row" data-testid={`team-${side}`}>
      <b className="team-name">{SIDE_LABEL[side].upper}</b>
      <span className="muted hold-label">Трюм</span>
      <PowderDots key={fxGen} n={s.teams[side].powder} cap={data.econ.cap} side={side} />
      {hands && hands.length > 0 && <span className="muted wide">· в руках {hands.join(' и ')} {cardsWord(hands[hands.length - 1]).split(' ')[1]}</span>}
      {regroup && <Button b={regroup} className="small regroup" />}
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
const FIRE_INFO = 'В начале хода своей команды: −1 Корпус за каждый Пожар. Потушить: сбросьте 1 карту с руки — снимите 1 Пожар (в свой ход, сколько угодно раз).';
const SOULS_INFO = 'Только у «Голландца», не больше 5. +1 Душа за каждый вражеский корабль, получивший от «Голландца» урон по Команде. Тратятся на карты с бирюзовой ценой; в свой ход 1 Душа = +1 Корпус или +1 Команда «Голландца».';
/** The text of the card «Чёрная метка» (the card with the operation «mark»), without its markup. */
function markText(data: GameData): string {
  const card = deckCards(data).find((c) => (c.fx.ops || []).some((o) => o[0] === 'mark'));
  return card ? `Карта «${card.name}»: ${card.text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}` : '';
}

/**
 * «Чёрная метка» on the plank of the marked ship: the torn leaf blackened with soot, pinned with a dagger (A5, MARK_PIN) —
 * on a laptop on the drawing of the ship in the head, on a phone at the right end of the row of statuses. It appears when
 * the blot of the clip lands (statusFx) and goes with the status.
 */
function MarkStamp({ cls, hidden }: { cls: string; hidden: boolean }) {
  return <span className={`mark-stamp ${cls}`} data-fx-mark-stamp aria-hidden style={hidden ? { visibility: 'hidden' } : undefined} dangerouslySetInnerHTML={svg(MARK_PIN_SVG)} />;
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

export function Plank({
  s,
  data,
  ship,
  own,
  selected,
  awaiting,
  targeted,
  shooter,
  repairing = false,
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
}: {
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
  /** The card being played repairs this ship (green frame while its panel is open). */
  repairing?: boolean;
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
  const buttonsRef = useMoreRight<HTMLDivElement>();
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
    own ? 'own' : 'enemy',
    selected ? 'selected' : '',
    awaiting ? 'awaiting' : '',
    targeted ? 'targeted' : '',
    shooter ? 'shooter' : '',
    repairing ? 'repairing' : '',
    ship.sunk ? 'sunk' : '',
    ship.submerged ? 'submerged' : '',
    plate ? (plate.chosen ? 'chosen' : 'aimable') : '',
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
  const legendTitle = ship.legend
    ? `Легенда «${legendName}»: ${affordable ? 'нажмите, чтобы прочитать' : 'не хватает Пороха или Душ'}`
    : `Легенда «${legendName}» сыграна`;
  return (
    <section
      className={cls}
      data-testid={plate ? `plate-${ship.code}` : `plank-${ship.code}`}
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
        <span className="ship-art wide">
          <span className="ship-pic" dangerouslySetInnerHTML={svg(shipSvg(ship.code))} />
          {marked && <MarkStamp cls="wide" hidden={markHidden} />}
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
            title={`Легенда: ${legendName}${affordable ? '' : ' — не хватает Пороха или Душ'}`}
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
        <span className="plank-role">
          {(targeted || plate?.chosen) && (
            // «Под огнём»: the wax seal of the target, pressed into the head (A5, TARGET_SEAL); it lives in the plank.
            <span className="target-seal" data-testid={`target-seal-${ship.code}`} title="Под огнём" dangerouslySetInnerHTML={svg(TARGET_SEAL)} />
          )}
          {selected && <span className="head-tag mine">ВЫБРАН</span>}
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
            aria-label={`Корабль «${d.nick}» — подробнее`}
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
      {st.length > 0 && (
        <div className="plank-statuses" data-fx-statuses>
          {st.map((x) => (
            <InfoTip
              key={x.label}
              className={`status-chip${x.mark ? ' mark' : ''}`}
              title={x.label}
              text={x.info ?? x.hint}
              off={!!plate}
              data={{ 'data-fx-status': x.label, 'data-fx-mark': x.mark || undefined }}
              style={x.flag && fxHidden?.includes(x.flag) ? { visibility: 'hidden' } : undefined}
            >
              {x.icon && <span className="chip-icon" dangerouslySetInnerHTML={svg(statusSvg(x.icon))} />}
              {x.label}
            </InfoTip>
          ))}
          {marked && <MarkStamp cls="narrow" hidden={markHidden} />}
        </div>
      )}
      <div className="plank-body">
        <div className="tracks" key={fxGen}>
          {trackEl('hull')}
          <div className="track-row2">{(['sails', 'guns', 'crew'] as const).map(trackEl)}</div>
        </div>
        <div className="badges">
          {ship.fires > 0 && (
            <InfoTip className="badge fire" title={fireLabel} text={FIRE_INFO} off={!!plate} data={{ 'data-fx-fires': true, 'data-testid': `fire-${ship.code}` }}>
              <span className="chip-icon" dangerouslySetInnerHTML={svg(statusSvg('fire'))} />
              {fireLabel}
            </InfoTip>
          )}
          {d.souls !== undefined && (
            <InfoTip className="badge souls" title={soulsLabel} text={SOULS_INFO} off={!!plate} data={{ 'data-fx-souls': true, 'data-testid': `souls-${ship.code}` }}>
              <span className="chip-icon" dangerouslySetInnerHTML={svg(SOULS_SVG)} />
              {soulsLabel}
            </InfoTip>
          )}
        </div>
      </div>
      {buttons.length > 0 && (
        <div className="plank-buttons-wrap" onClick={(e) => e.stopPropagation()}>
          <div className="plank-buttons" ref={buttonsRef}>
            {buttons.map((b) => (
              <PlankButton key={b.key} b={b} />
            ))}
          </div>
          {/* On a phone, while more buttons are to the right: a press scrolls the row (U3). */}
          <button
            className="buttons-more"
            aria-label="Ещё кнопки"
            tabIndex={-1}
            onClick={() => {
              const row = buttonsRef.current;
              if (row) row.scrollBy({ left: row.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
            }}
          >
            ›
          </button>
        </div>
      )}
    </section>
  );

  /** A track: the label, the icons (.cells > i.on — the contract of the animations), the bar of a phone, «9/11». */
  function trackEl(t: Track) {
    const max = startValue(data, ship.code, t);
    const v = ship.tracks[t];
    return (
      <div key={t} className={`track t-${t}`} data-fx-track={t} style={TRACK_ICON_STYLE[t]}>
        <span className="track-label">{TRACK_LABEL[t]}</span>
        <span className="cells" aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <i key={i} className={i < v ? 'on' : ''} />
          ))}
        </span>
        <span className="bar" aria-hidden>
          <i style={{ width: `${(100 * v) / max}%` }} />
        </span>
        <b className={`track-num ${v <= (t === 'crew' ? 1 : 0) && t !== 'hull' ? 'low' : ''}`} data-fx-value>
          {`${v}/${max}`}
        </b>
      </div>
    );
  }
}

/** The icons of the buttons of a plank (A5: an icon, the name | the price with a keg). */
const CMD_ICON: Record<string, string> = {
  volley: CELLS.GUN,
  sword: TRIDENT_SVG,
  heart: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14 C3 10.4 1.2 7.8 1.2 5.4 C1.2 3.2 2.9 1.6 4.9 1.6 C6.2 1.6 7.3 2.3 8 3.4 C8.7 2.3 9.8 1.6 11.1 1.6 C13.1 1.6 14.8 3.2 14.8 5.4 C14.8 7.8 13 10.4 8 14 Z" fill="#a3271d" stroke="#3a0f0a" stroke-width=".8"/><path d="M4 4 Q5 3 6.2 3.4" stroke="#f3b1a4" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>',
  treasury: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="8" cy="12" rx="6" ry="2.2" fill="#a87c22" stroke="#4a340c" stroke-width=".7"/><ellipse cx="8" cy="9" rx="6" ry="2.2" fill="#c99a3a" stroke="#4a340c" stroke-width=".7"/><ellipse cx="8" cy="6" rx="6" ry="2.2" fill="#e2bf62" stroke="#4a340c" stroke-width=".7"/><path d="M5 5.6 Q8 4.4 11 5.6" stroke="#fff3c4" stroke-width=".6" fill="none"/></svg>',
  dive: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 5 q1.75 -1.6 3.5 0 t3.5 0 t3.5 0 t3.5 0" fill="none" stroke="#2f5f74" stroke-width="1.4" stroke-linecap="round"/><path d="M8 6.6 V14 M5.2 11.2 L8 14 L10.8 11.2" fill="none" stroke="#22384c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  soulHull: SOULS_SVG,
  soulCrew: SOULS_SVG,
};
/** «Залп · 1 П»: the name and the price in Powder. */
const PRICED = /^(.*?) · (\d+) П$/;
/** The keg of a price (KEG_S of art/cells2.json). */
const KEG_SMALL = CELLS.KEG_S;

/** A button of a plank: on a laptop the icon, the name and the price with a keg; on a phone the short label (U3). */
function PlankButton({ b }: { b: Btn }) {
  const m = PRICED.exec(b.label);
  const icon = CMD_ICON[b.key];
  return (
    <button
      className={`btn cmd ${b.primary ? 'primary' : ''}`}
      onClick={b.disabled ? undefined : b.onClick}
      aria-disabled={!!b.disabled}
      title={b.disabled ?? undefined}
      data-testid={b.testid}
    >
      <span className="wide cmd-in">
        {icon && <span className="cmd-icon" dangerouslySetInnerHTML={svg(icon)} />}
        <span className="cmd-name">{m ? m[1] : b.label}</span>
        {m && (
          <span className="cost" aria-label={`${m[2]} Пороха`}>
            {m[2]}
            <span className="cost-keg" dangerouslySetInnerHTML={svg(KEG_SMALL)} />
          </span>
        )}
      </span>
      <span className="narrow">{breakAfterArrow(b.short ?? b.label)}</span>
    </button>
  );
}

/**
 * A row that scrolls sideways (the buttons of a plank on a phone, U3): «data-more» on its wrapper while there is more
 * of it to the right — the right edge fades and the arrow «›» shows then.
 */
function useMoreRight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // on the wrapper of the row: the fade and the arrow «›» stand there; the last 8 px are the padding of the row
    const check = () => el.parentElement?.toggleAttribute('data-more', el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
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
