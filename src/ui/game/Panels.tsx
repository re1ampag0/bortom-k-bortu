// Panels of decisions: on a laptop in the middle of the table, on a phone as a bottom sheet in place of the hand.
// Every number in them comes from the engine (hints.ts); a choice the rules refuse is grey with the reason.
import { useEffect, useRef, useState } from 'react';
import { choiceFor } from '../../engine/cards';
import {
  TRACK_DATIVE,
  TRACK_NAME,
  cardNeeds,
  formatTerms,
  playOptions,
  previewVolley,
  refusal,
  type VolleyPreview,
} from '../../engine/hints';
import { powderWord } from '../../engine/log';
import { cardByCode, seaCardByCode, seatShip, shipData, startValue, type Action, type GameState } from '../../engine/state';
import type { GameData, Side, Track } from '../../engine/types';
import { wxSvg } from './art/wx';
import {PlaySheet,PLAN_LOCK} from './PlaySheet';
import { HandCard } from './Hand';
import { OakButton } from './Table';
import { DecisionSheet, DecisionActions, DecisionStepper } from './DecisionSheet';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const nick = (data: GameData, code: string) => `«${shipData(data, code).nick}»`;
/** «восстановить 1 клетку / 2 клетки / 5 клеток». */
const cellsWord = (n: number) => `${n} ${n === 1 ? 'клетку' : n < 5 ? 'клетки' : 'клеток'}`;

// ——— Volley ———

export interface AimMode {
  k: 'aim';
  shooter: string;
  charge: string | null;
  chargeFrom: string | null;
  heart: boolean;
  target: string | null;
  paid: number;
}

/** A Charge for the Volley; `offered` — the captain (another person) offered it (P6). */
export interface ChargeChoice {
  card: string;
  from: string;
  offered?: boolean;
}

/** The Charges the shooter may add: its hand and Plans, and the hand of a captain on board (RULES.md 17.3). */
export function chargeCandidates(s: GameState, data: GameData, shooter: string): ChargeChoice[] {
  const out: ChargeChoice[] = [];
  for (const x of Object.values(s.ships)) {
    if (x.side !== s.ships[shooter].side || seatShip(s, x.code)?.code !== shooter) continue;
    for (const card of [...x.hand, ...x.plans]) {
      if (card !== '?' && cardByCode(data, card).type === 'ЗАРЯД') out.push({ card, from: x.code });
    }
  }
  return out;
}

export const volleyOrder = (m: AimMode, target: string) => ({
  ship: m.shooter,
  target,
  ...(m.charge ? { charge: m.charge } : {}),
  ...(m.charge && m.chargeFrom && m.chargeFrom !== m.shooter ? { chargeFrom: m.chargeFrom } : {}),
  ...(m.paid ? { paid: m.paid } : {}),
  ...(m.heart ? { heart: true } : {}),
});

/** «4 напротив», «2 диагональ −1». */
export function plateLabel(p: VolleyPreview): { label: string; sub: string } {
  const diag = p.terms.find((t) => t.what === 'диагональ');
  return { label: String(p.damage), sub: p.diagonal ? `диагональ${diag ? ` ${diag.n < 0 ? '−' : '+'}${Math.abs(diag.n)}` : ''}` : 'напротив' };
}

/** The Volley as it would go now: its preview (a target chosen), the Powder, the line under «Огонь!». */
export function volleyNow(s: GameState, data: GameData, mode: AimMode) {
  const p = mode.target ? previewVolley(s, data, volleyOrder(mode, mode.target)) : null;
  const cost = shipData(data, mode.shooter).volleyCost + (mode.charge ? cardByCode(data, mode.charge).cost : 0) + mode.paid;
  // the short result always (the user's call), the sum of the terms only with «Подсказки» (the slip)
  const sub = !mode.target
    ? 'выберите цель на столе'
    : p?.ok
      ? `по «${shipData(data, p.target).nickDative}» · ${p.damage} по ${TRACK_DATIVE[p.track]} · ${powderWord(cost)}`
      : 'Залп невозможен';
  return { p, cost, sub };
}

/** The wax seal with a tick on the chosen Charge (phone_tpl.html, card(…, {chk})). */
const CHECK_SEAL = `<svg viewBox="-15 -15 30 30" aria-hidden="true"><path d="${Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2, r = 13 + Math.sin(i * 2.7) * 0.9;
  return (i ? 'L' : 'M') + (Math.round(Math.cos(a) * r * 10) / 10) + ' ' + (Math.round(Math.sin(a) * r * 10) / 10);
}).join(' ')} Z" fill="#9a1f16" stroke="#4a0a06" stroke-width=".6"/><circle r="9.6" fill="#7e1a12"/><circle r="9.6" fill="none" stroke="#c94a3a" stroke-width=".6" opacity=".7"/><path d="M-5 0.4 L-1.4 4 L5.4 -3.6" fill="none" stroke="#f6dccb" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * PH 4: the sheet «Заряд» — an oak deck with a brass edge over the whole bottom of the table (a phone: from below), as
 * frame 2: the plate «Заряд» and the Hold at the top, only the Charges of this Volley in the middle, the chosen one lifted
 * under a wax seal, a press again — without a Charge; too dear or not allowed — grey; the sum on a slip of paper under the
 * cards only with «Подсказки». The whole card: a laptop — the pointer held on it 0.4 s, a phone — a long press. A laptop
 * puts «Отмена» and «Огонь!» in the place of «Ход окончен» (ChargeButtons), a phone at the foot of the sheet.
 */
export function ChargeSheet({
  s,
  data,
  hints,
  mode,
  charges,
  buttons,
  setMode,
}: {
  s: GameState;
  data: GameData;
  hints: boolean;
  /** The Charges allowed for this Volley (chargeCandidates, by network only the offered ones of another person). */
  charges: ChargeChoice[];
  mode: AimMode;
  /** A phone: «Отмена» and «Огонь!» at the foot of the sheet. */
  buttons: React.ReactNode;
  setMode: (m: AimMode) => void;
}) {
  const { p } = volleyNow(s, data, mode);
  const paidCharge = mode.charge && cardByCode(data, mode.charge).fx.paid;
  const side = s.ships[mode.shooter].side;
  // the whole card under the pointer (0.4 s) or the finger (a long press); a long press does not choose the card
  const [peek, setPeek] = useState<{ card: string; from: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPress = useRef(false);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const later = (o: ChargeChoice, ms: number, long: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPeek({ card: o.card, from: o.from });
      if (long) longPress.current = true;
    }, ms);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPeek(null);
  };
  /** The Volley with this Charge: its preview when a target is chosen. */
  const previewWith = (o: ChargeChoice) =>
    mode.target ? previewVolley(s, data, volleyOrder({ ...mode, charge: o.card, chargeFrom: o.from, paid: 0 }, mode.target)) : null;
  const note = mode.heart
    ? 'Сердце Дейви Джонса: дополнительный Залп'
    : !mode.target
      ? 'выберите цель на столе'
      : charges.length
        ? 'можно без Заряда'
        : '';
  return (
    <section className="panel charge-sheet oak-sheet" data-testid="volley-panel">
      <div className="cs-head">
        <span className="cs-title">Заряд</span>
        <span className="cs-note">
          {note}
          <span className="cs-hold" data-testid="charge-hold">
            Трюм {s.teams[side].powder} из {data.econ.cap}
          </span>
        </span>
      </div>
      <div className="cs-cards">
        {/* fix-ui: no Charges — the words in the middle of the sheet (the head line kept only the Hold) */}
        {charges.length === 0 && !mode.heart && (
          <p className="cs-empty" data-testid="no-charges">
            Зарядов в руке нет: Залп без Заряда
          </p>
        )}
        {charges.map((o) => {
          const pv = previewWith(o);
          const c = cardByCode(data, o.card);
          const on = mode.charge === o.card;
          const why = pv && !pv.ok ? pv.reason : null;
          const plan = s.ships[o.from].plans.includes(o.card);
          const big = c.big.length <= 8 ? `${c.big} ` : '';
          return (
            <div
              key={`${o.from}-${o.card}`}
              className={`cs-card ${on ? 'on' : ''} ${why ? 'off' : ''}`}
              data-testid={o.offered ? 'captain-charge' : undefined}
              onPointerEnter={(e) => e.pointerType === 'mouse' && later(o, 400, false)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && stop()}
              onPointerDown={(e) => {
                longPress.current = false;
                if (e.pointerType !== 'mouse') later(o, 450, true);
              }}
              onPointerUp={(e) => e.pointerType !== 'mouse' && stop()}
              onPointerCancel={stop}
              onContextMenu={(e) => e.preventDefault()}
            >
              {o.offered && <span className="cs-tag">Заряд капитана</span>}
              <HandCard
                data={data}
                code={o.card}
                plan={plan}
                off={why}
                chosen={on}
                note={hints && pv?.ok ? `${big}→ итог ${pv.damage}` : undefined}
                onClick={() => {
                  if (longPress.current) return void (longPress.current = false);
                  if (!why) setMode({ ...mode, charge: on ? null : o.card, chargeFrom: on ? null : o.from, paid: 0 });
                }}
              />
              {on && <i className="cs-seal" title="Заряжено" aria-hidden dangerouslySetInnerHTML={{ __html: CHECK_SEAL }} />}
            </div>
          );
        })}
      </div>
      {peek && (
        <div className="cs-peek" data-testid="charge-peek" aria-hidden>
          <HandCard data={data} code={peek.card} plan={s.ships[peek.from].plans.includes(peek.card)} off={null} />
        </div>
      )}
      {paidCharge && (
        <div className="stepper cs-paid">
          <span>Доплатить Порохом (+1 урон за каждый)</span>
          <button className="btn small" onClick={() => setMode({ ...mode, paid: Math.max(0, mode.paid - 1) })}>
            −
          </button>
          <b>{mode.paid}</b>
          <button className="btn small" onClick={() => setMode({ ...mode, paid: Math.min(data.rules.paidChargeMax, mode.paid + 1) })}>
            +
          </button>
        </div>
      )}
      {p && !p.ok ? (
        <div className="slipw">
          <p className="slip no" data-testid="volley-reason">
            {p.reason}
          </p>
        </div>
      ) : (
        hints &&
        p?.ok && (
          <div className="slipw">
            <p className="slip" data-testid="volley-slip">
              {formatTerms(p.terms)} = <b>{p.damage} по {TRACK_DATIVE[p.track]}</b>
              {p.change.track !== 'hull' && p.change.hullTo !== p.change.hullFrom ? ` · Корпус ${p.change.hullFrom} → ${p.change.hullTo}` : ''}
              {p.noReact ? ' · без Реакций' : ''}
            </p>
          </div>
        )
      )}
      {buttons}
    </section>
  );
}

/** «Отмена» — a brass plate, «Огонь!» — the oak board with the muzzle of a gun (A5Rig «Ход окончен»). */
export function ChargeButtons({
  s,
  data,
  mode,
  onFire,
  onCancel,
}: {
  s: GameState;
  data: GameData;
  mode: AimMode;
  onFire: (action: Action) => void;
  onCancel: () => void;
}) {
  const { p, sub } = volleyNow(s, data, mode);
  return (
    <div className="charge-btns">
      <button className="brs-btn cs-cancel" data-testid="cancel-volley" onClick={onCancel}>
        Отмена
      </button>
      <OakButton
        b={{
          key: 'fire',
          label: 'Огонь!',
          primary: true,
          disabled: !p ? 'Выберите цель' : p.ok ? null : p.reason,
          onClick: () => mode.target && onFire({ type: 'volley', ...volleyOrder(mode, mode.target) }),
          testid: 'fire',
        }}
        sign="muzzle"
        className="fire-btn"
        sub={sub}
      />
    </div>
  );
}

// ——— Reactions: the window is «Тревога!» (Alarm.tsx) ———

/** The attacker while the enemy decides on a Reaction (P8): what was fired, who decides, a calm waiting sign. */
export function ReactionWaitPanel({ line, who }: { line: string; who: string }) {
  return (
    <span className="reaction-wait-pill" data-testid="reaction-wait" role="img" aria-label={`${line} ${who}`} title={`${line} ${who}`}>
      <span className="wait-dots" aria-hidden><i /><i /><i /></span>
    </span>
  );
}

// ——— «Джек ускользает», «Тортуга» ———

export function JackPanel({ s, data, ship, onAct }: { s: GameState; data: GameData; ship: string; onAct: (a: Action) => void }) {
  const legend = cardByCode(data, `${ship}-Л`);
  return (
    <DecisionSheet title={legend.name} sub={`${nick(data, ship)} тонет! ${legend.big}. Стоимость ${powderWord(legend.cost)}.`}
      hold={{powder: s.teams[s.ships[ship].side].powder, cap: data.econ.cap}} testid="jack-panel"
      actions={<DecisionActions
        cancel={<button className="btn" onClick={() => onAct({type: 'jack', play: false})}>Нет: утонуть</button>}
        primary={{key: 'jack-play', label: `Сыграть · ${powderWord(legend.cost)}`, onClick: () => onAct({type: 'jack', play: true})}} />} />
  );
}

export function TortugaPanel({ s, data, side, onAct }: { s: GameState; data: GameData; side: Side; onAct: (a: Action) => void }) {
  const seats = Object.values(s.ships).filter((x) => x.side === side && seatShip(s, x.code));
  const [draws, setDraws] = useState<Record<string, number>>({});
  const total = Object.values(draws).reduce((a, b) => a + b, 0);
  const max = Math.min(data.rules.seaTortuga, s.teams[side].powder);
  return (
    <DecisionSheet title="Море · Тортуга" sub={`1 Порох за карту, не больше ${data.rules.seaTortuga}.`}
      hold={{powder: s.teams[side].powder, cap: data.econ.cap}} testid="tortuga-panel"
      actions={<DecisionActions cancel={<button className="btn" onClick={() => onAct({ type: 'tortuga', side, draws: {} })}>Не брать</button>}
        primary={{key: 'tortuga-take', label: `Взять ${total} ${total===1?'карту':total<5?'карты':'карт'} · ${powderWord(total)}`, disabled: total === 0 ? 'Выберите, сколько карт взять' : null,
          onClick: () => onAct({type: 'tortuga', side, draws})}} />}>
      <p className="polish-tortuga-total">Карт {total} · Пороха {total} из {s.teams[side].powder} в Трюме</p>
      {seats.map(x => <DecisionStepper key={x.code}
        label={<b className="ds-ship" data-ship={x.code} style={{['--ship' as string]: shipData(data, x.code).color}}>{nick(data, x.code)}</b>}
        value={draws[x.code] ?? 0} minusDisabled={!draws[x.code]} plusDisabled={total >= max}
        onMinus={() => setDraws({...draws, [x.code]: Math.max(0, (draws[x.code] ?? 0) - 1)})}
        onPlus={() => total < max && setDraws({...draws, [x.code]: (draws[x.code] ?? 0) + 1})} />)}
    </DecisionSheet>
  );
}

// ——— Choices after a card has shown something ———

const CHOICE_TEXT: Record<string, { title: string; sub: string }> = {
  compass: { title: 'Компас Джека', sub: 'Выберите карту в руку, затем карту в План. Третья уйдёт в сброс.' },
  toPlan: { title: 'Безумный план', sub: 'Выберите карту с руки в План.' },
  pass: { title: 'Анжелика', sub: 'Выберите карту, которую получит союзник.' },
  spy: { title: 'Шпион Мерсер', sub: 'Выберите Реакцию противника: он её сбросит.' },
  tia: { title: 'Тиа Дальма', sub: 'Разложите карты моря: первая выбранная откроется первой. «i»: карта целиком.' },
  bell: { title: 'Колокол «Голландца»', sub: 'Выберите карту с руки и сбросьте её.' },
  dice: { title: 'Игра в кости лжеца', sub: 'Втайне выберите карту с руки. Дороже в Порохе: забирает обе.' },
};

/**
 * A sea card of «Тиа Дальма» in small, as in the reference (docs/mockups/anim/level1, scene «tia»): the picture, the
 * name, the effect, the place in the order. A press on the card puts it in order; «i» opens the card in full.
 */
function SeaMini({ data, code, order, onPick, onInfo }: { data: GameData; code: string; order: number | null; onPick: () => void; onInfo?: () => void }) {
  const sea = code === '?' ? null : seaCardByCode(data, code);
  return (
    <div
      className={`sopt ${order ? 'on' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={!!order}
      data-opt={code}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        onPick();
      }}
    >
      <div className="a" dangerouslySetInnerHTML={{ __html: sea ? wxSvg(sea.key, 54, 46) : '' }} />
      <div className="n">{sea ? sea.name : 'Закрытая карта'}</div>
      {sea && <div className="e">{sea.big}</div>}
      {order && <span className="ord">{order}</span>}
      {sea && onInfo && (
        <button
          className="info"
          data-sea={code}
          aria-label={`Карта «${sea.name}» целиком`}
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
        >
          i
        </button>
      )}
    </div>
  );
}

export function ChoicePanel({
  s,
  data,
  seat,
  onAct,
  onSea,
}: {
  s: GameState;
  data: GameData;
  seat: string;
  onAct: (a: Action) => void;
  /** Opens a sea card in full («i» of «Тиа Дальма»). */
  onSea?: (code: string) => void;
}) {
  const p = s.pending;
  const allowed = choiceFor(s, seat);
  const [picks, setPicks] = useState<string[]>([]);
  if (p?.kind !== 'choice' || !allowed) return null;
  const text = CHOICE_TEXT[p.what];
  const tia = p.what === 'tia';
  const toggle = (card: string) =>
    setPicks(picks.includes(card) ? picks.filter((c) => c !== card) : picks.length < allowed.count ? [...picks, card] : picks);
  const note = (card: string) => {
    const i = picks.indexOf(card);
    if (i < 0) return undefined;
    if (p.what === 'compass') return i === 0 ? 'в руку' : 'в План';
    return 'выбрана';
  };
  return (
    <DecisionSheet title={text.title} sub={`${nick(data, seat)}: ${text.sub}`} testid="choice-panel"
      hold={{powder: s.teams[s.ships[seat].side].powder, cap: data.econ.cap}}
      actions={<DecisionActions
        cancel={<button className="btn" onClick={() => setPicks([])}>Сбросить выбор</button>}
        primary={{key: 'choice-done', label: `Готово (${picks.length} из ${allowed.count})`,
          disabled: picks.length !== allowed.count ? `Выберите ${allowed.count}` : null,
          onClick: () => onAct({type: 'choose', seat, cards: picks})}} />}>
      {tia ? (
        <div className="tia-opts">
          {allowed.from.map((card) => (
            <SeaMini
              key={card}
              data={data}
              code={card}
              order={picks.includes(card) ? picks.indexOf(card) + 1 : null}
              onPick={() => toggle(card)}
              onInfo={onSea && (() => onSea(card))}
            />
          ))}
        </div>
      ) : (
        <div className="choice-cards">
          {allowed.from.map((card) => (
            <HandCard key={card} data={data} code={card} off={null} chosen={picks.includes(card)} note={note(card)} onClick={() => toggle(card)} />
          ))}
        </div>
      )}
    </DecisionSheet>
  );
}

// ——— An Order or a Repair that needs choices ———

export interface CardMode {
  k: 'card';
  seat: string;
  card: string;
  target: string | null;
  ship: string | null;
  repair: Partial<Record<Track, number>> | null;
  souls: number | null;
  regroup: boolean;
}

export function cardAction(m: CardMode): Extract<Action, { type: 'playCard' }> {
  return {
    type: 'playCard',
    seat: m.seat,
    card: m.card,
    ...(m.target ? { target: m.target } : {}),
    ...(m.ship ? { ship: m.ship } : {}),
    ...(m.repair ? { repair: m.repair } : {}),
    ...(m.souls !== null ? { souls: m.souls } : {}),
    ...(m.regroup ? { regroup: true } : {}),
  };
}

export function CardParamsPanel({
  s,
  data,
  mode,
  setMode,
  onAct,
  onCancel,
}: {
  s: GameState;
  data: GameData;
  mode: CardMode;
  setMode: (m: CardMode) => void;
  onAct: (a: Action) => void;
  onCancel: () => void;
}) {
  const c = cardByCode(data, mode.card);
  const needs = cardNeeds(s, data, mode.seat, mode.card, mode.ship ? { ship: mode.ship } : {});
  const action = cardAction(mode);
  const why = needs.target && !mode.target ? `Выберите ${needs.target === 'seat' ? 'игрока-противника' : 'вражеский корабль'} на столе` : refusal(s, action, data);
  const own = seatShip(s, mode.seat)!;
  const ally = Object.values(s.ships).find((x) => x.side === own.side && x.code !== own.code && !x.sunk);
  // The ship the engine repairs (repairTarget): the ally's for «Норрингтон на борту», the Dutchman's for «Сердце бьётся».
  const repairShip = needs.repairShip ? s.ships[needs.repairShip] : null;
  const cells = needs.souls !== null ? 2 * (mode.souls ?? needs.souls) : needs.cells;
  const sub = repairShip
    ? `→ ${nick(data, repairShip.code)}: ${cells > 0 ? `восстановить ${cellsWord(cells)}` : c.big}`
    : `${nick(data, mode.seat)}: ${c.big}`;
  const split = mode.repair ?? {};
  const used = TRACKS.reduce((n, t) => n + (split[t] ?? 0), 0);
  const canRegroup = needs.regroup && refusal(s, { ...action, regroup: true }, data) === null;
  return (
    <PlaySheet title={c.name} sub={sub} card={{data,code:mode.card}}
      target={needs.target? (mode.target?{name:nick(data,seatShip(s,mode.target)?.code??mode.target),color:shipData(data,seatShip(s,mode.target)?.code??mode.target).color}:null):repairShip?{name:nick(data,repairShip.code),color:shipData(data,repairShip.code).color}:undefined} testid="card-panel"
      hold={{powder: s.teams[own.side].powder, cap: data.econ.cap}}
      actions={<DecisionActions cancel={<button className="btn" onClick={onCancel}>Отмена</button>}
        primary={{key:'card-play', testid:'play-card', label:`Сыграть${c.cost ? ` · ${c.cost} П` : ''}${c.soul ? ` · ${c.soul} Д` : ''}`,
          disabled: why, onClick: () => onAct(action)}} />}>
      {needs.ship && ally && (
        <div className="choices">
          {[own, ally].map((x) => (
            <button key={x.code} className={`choice ${needs.repairShip === x.code ? 'on' : ''}`} onClick={() => setMode({ ...mode, ship: x.code })}>
              <span>{x.code === own.code ? 'Свой корабль' : 'Союзник'}</span>
              <b>{nick(data, x.code)}</b>
            </button>
          ))}
        </div>
      )}
      {needs.souls !== null && (
        <div className="stepper ds-stepper">
          <span>Потратить Души (2 клетки за каждую)</span>
          <button className="btn ds-round" onClick={() => setMode({ ...mode, souls: Math.max(0, (mode.souls ?? needs.souls!) - 1), repair: null })}>
            −
          </button>
          <b>{mode.souls ?? needs.souls}</b>
          <button className="btn ds-round" onClick={() => setMode({ ...mode, souls: Math.min(needs.souls!, (mode.souls ?? needs.souls!) + 1), repair: null })}>
            +
          </button>
        </div>
      )}
      {cells > 0 && repairShip && (
        <div className="repair" data-testid="repair-tracks">
          <span className="muted">
            Восстановить {cellsWord(cells)}
            {mode.repair ? ` · распределено ${used}` : ' · по умолчанию: Пушки, Корпус, Команда, Паруса'}
          </span>
          {TRACKS.map((t) => {
            const missing = startValue(data, repairShip.code, t) - repairShip.tracks[t];
            if (missing <= 0) return null;
            const n = split[t] ?? 0;
            return (
              <div key={t} className="stepper ds-stepper" data-track={t}>
                <span>
                  {TRACK_NAME[t]} {repairShip.tracks[t]}/{startValue(data, repairShip.code, t)}
                </span>
                <button className="btn ds-round" onClick={() => setMode({ ...mode, repair: { ...split, [t]: Math.max(0, n - 1) } })}>
                  −
                </button>
                <b>{n}</b>
                <button
                  className="btn ds-round"
                  onClick={() => n < missing && used < cells && setMode({ ...mode, repair: { ...split, [t]: n + 1 } })}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      )}
      {needs.regroup && (
        <label className="row check" title={canRegroup ? undefined : (refusal(s, { ...action, regroup: true }, data) ?? '')}>
          <input type="checkbox" disabled={!canRegroup} checked={mode.regroup} onChange={(e) => setMode({ ...mode, regroup: e.target.checked })} />
          Бесплатное Перестроение
        </label>
      )}
      {why && <p className="why">{why}</p>}
    </PlaySheet>
  );
}

// ——— Confirmations and the Plans at the end of the turn ———

export function ConfirmPanel({
  title,
  sub,
  yes,
  no = 'Отмена',
  onYes,
  onNo,
  testid,
  hold,
  card,
}: {
  hold?: {powder: number; cap: number};
  card?:{data:GameData;code:string};
  title: string;
  sub?: string;
  yes: string;
  no?: string;
  onYes: () => void;
  onNo: () => void;
  testid?: string;
}) {
  return (
    <PlaySheet card={card} title={title} sub={sub} testid={testid} hold={hold}
      actions={<DecisionActions cancel={<button className="btn" onClick={onNo}>{no}</button>}
        primary={{key:'confirm-yes',testid:'confirm-yes',label:yes,onClick:onYes}} />} />
  );
}

export function PlansPanel({ s, data, seat, onDone, onCancel }: { s: GameState; data: GameData; seat: string; onDone: (plans: string[]) => void; onCancel: () => void }) {
  const holder = s.ships[seat];
  const room = data.rules.plansMax - holder.plans.length;
  const [picks, setPicks] = useState<string[]>([]);
  return (
    <PlaySheet plans title="Закрома «Жемчужины»"
      sub={`${nick(data, seat)}: до ${room} ${room === 1 ? 'карты' : 'карт'} с руки. Реакцию из Плана можно сыграть сверх лимита Парусов, бонус «План:» действует.`}
      testid="plans-panel" hold={{powder:s.teams[holder.side].powder,cap:data.econ.cap}}
      tools={<button type="button" className="btn ds-close" aria-label="Отмена" title="Отмена" onClick={onCancel}>×</button>}
      actions={<DecisionActions cancel={<button className="btn" data-testid="no-plans" onClick={() => onDone([])}>Без Планов</button>}
        primary={{key:'plans-done',label:'Закончить ход',
          disabled:null,onClick:()=>onDone(picks)}} />}>
      <div className="plans-count">в руке {holder.hand.length} → {holder.hand.length-picks.length}, в закромах {holder.plans.length+picks.length} из {data.rules.plansMax}</div>
      <div className="plans-vault" aria-label="Закрома"><i className="vault-lid"/><div className="vault-slots">{Array.from({length:data.rules.plansMax},(_,i)=><span key={i} className={i<holder.plans.length+picks.length?'occupied':''}>{i<holder.plans.length+picks.length?<b dangerouslySetInnerHTML={{__html:PLAN_LOCK}}/>:i===0?'I':'II'}</span>)}</div><b className="vault-title">Закрома</b></div>
      <div className="plans-added">{picks.length} {picks.length===1?'карта':picks.length<5?'карты':'карт'} в План</div>
      <div className="choice-cards">
        {holder.hand.map((card) => (
          <HandCard
            key={card}
            data={data}
            code={card}
            off={null}
            chosen={picks.includes(card)}
            note={picks.includes(card) ? 'в План' : undefined}
            onClick={() => setPicks(picks.includes(card) ? picks.filter((c) => c !== card) : picks.length < room ? [...picks, card] : picks)}
          />
        ))}
      </div>
    </PlaySheet>
  );
}

/** A Reaction or Order card the player opened: is it playable now and why not. */
export function playHint(s: GameState, data: GameData, seat: string, card: string): string | null {
  return playOptions(s, data, seat, card).reason;
}
