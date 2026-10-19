// Panels of decisions: on a laptop in the middle of the table, on a phone as a bottom sheet in place of the hand.
// Every number in them comes from the engine (hints.ts); a choice the rules refuse is grey with the reason.
import { useState } from 'react';
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
import { SEA_BG, seaSvg } from './fx/seaArt';
import { HandCard } from './Hand';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const nick = (data: GameData, code: string) => `«${shipData(data, code).nick}»`;
/** «восстановить 1 клетку / 2 клетки / 5 клеток». */
const cellsWord = (n: number) => `${n} ${n === 1 ? 'клетку' : n < 5 ? 'клетки' : 'клеток'}`;

function Panel({ title, sub, children, tone, testid }: { title: string; sub?: string; children: React.ReactNode; tone?: string; testid?: string }) {
  return (
    <section className={`panel ${tone ?? ''}`} data-testid={testid}>
      <header className="panel-head">
        <b>{title}</b>
        {sub && <span className="panel-sub">{sub}</span>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

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

export function VolleyPanel({
  s,
  data,
  hints,
  mode,
  charges,
  setMode,
  onFire,
  onCancel,
}: {
  s: GameState;
  data: GameData;
  /** Off — «как за столом»: no damage of each Charge; on a laptop the Charge is chosen in the hand. */
  hints: boolean;
  /** The Charges allowed for this Volley (chargeCandidates, by network only the offered ones of another person). */
  charges: ChargeChoice[];
  mode: AimMode;
  setMode: (m: AimMode) => void;
  onFire: (action: Action) => void;
  onCancel: () => void;
}) {
  const p = mode.target ? previewVolley(s, data, volleyOrder(mode, mode.target)) : null;
  const cost = shipData(data, mode.shooter).volleyCost + (mode.charge ? cardByCode(data, mode.charge).cost : 0) + mode.paid;
  const paidCharge = mode.charge && cardByCode(data, mode.charge).fx.paid;
  const title = !mode.target
    ? `${nick(data, mode.shooter)}: выберите цель на столе`
    : p?.ok
      ? `${p.damage} по ${TRACK_DATIVE[p.track]} ${nick(data, p.target)}`
      : `Залп невозможен`;
  const sub = p?.ok
    ? `${formatTerms(p.terms)} · ${TRACK_NAME[p.change.track]} ${p.change.from} → ${p.change.to}${
        p.change.track !== 'hull' && p.change.hullTo !== p.change.hullFrom ? `, Корпус ${p.change.hullFrom} → ${p.change.hullTo}` : ''
      }${p.noReact ? ' · без Реакций' : ''}`
    : p && !p.ok
      ? p.reason
      : mode.heart
        ? 'Сердце Дейви Джонса: дополнительный Залп, «Голландец» теряет Команду'
        : hints
          ? 'Цели подсвечены плашками с уроном'
          : 'Цели подсвечены';
  /** The Volley with this Charge (null — without): its preview when a target is chosen. */
  const previewWith = (o: { card: string | null; from: string }) =>
    mode.target ? previewVolley(s, data, volleyOrder({ ...mode, charge: o.card, chargeFrom: o.from, paid: 0 }, mode.target)) : null;
  const damageLabel = (pv: ReturnType<typeof previewWith>) =>
    pv?.ok ? `${pv.damage}${pv.track !== 'hull' ? ` по ${TRACK_DATIVE[pv.track]}` : ''}${pv.noReact ? ', без Реакций' : ''}` : pv ? '—' : undefined;
  const choose = (o: { card: string | null; from: string }) => setMode({ ...mode, charge: o.card, chargeFrom: o.from, paid: 0 });
  const none: { card: string | null; from: string; offered?: boolean } = { card: null, from: mode.shooter };
  // Without hints a laptop shows only «Без Заряда», the chosen Charge and the captain's offer: the Charge is chosen
  // in the hand or the Plans.
  const chips = hints ? [none, ...charges] : [none, ...charges.filter((o) => o.card === mode.charge || o.offered)];
  return (
    <Panel title={title} sub={sub} tone="volley" testid="volley-panel">
      <div className="choices wide-block">
        {chips.map((o) => {
          const pv = previewWith(o);
          const c = o.card ? cardByCode(data, o.card) : null;
          const fromPlan = o.card ? s.ships[o.from].plans.includes(o.card) : false;
          const on = mode.charge === o.card;
          return (
            <button
              key={o.card ?? 'none'}
              className={`choice ${on ? 'on' : ''} ${pv && !pv.ok ? 'off' : ''}`}
              title={pv && !pv.ok ? pv.reason : undefined}
              onClick={() => (pv && !pv.ok ? undefined : choose(o))}
              data-testid={o.offered ? 'captain-charge' : undefined}
            >
              <span>
                {c ? `${o.offered ? 'Заряд капитана: ' : ''}${c.name}` : 'Без Заряда'}
                {fromPlan ? ' · План' : ''}
                {c && c.cost > 0 ? ` · ${c.cost} П` : ''}
              </span>
              <b>{hints ? (damageLabel(pv) ?? (c ? c.big : '')) : c ? c.big : ''}</b>
            </button>
          );
        })}
      </div>
      {paidCharge && (
        <div className="stepper">
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
      <div className="panel-actions">
        <button className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button
          className="btn primary"
          data-testid="fire"
          aria-disabled={!p?.ok}
          onClick={() => p?.ok && mode.target && onFire({ type: 'volley', ...volleyOrder(mode, mode.target) })}
        >
          Огонь · {powderWord(cost)}
        </button>
      </div>
    </Panel>
  );
}

// ——— Reactions: the window is «Тревога!» (Alarm.tsx) ———

/** The attacker while the enemy decides on a Reaction (P8): what was fired, who decides, a calm waiting sign. */
export function ReactionWaitPanel({ line, who }: { line: string; who: string }) {
  return (
    <section className="panel reaction-wait" data-testid="reaction-wait" aria-live="polite">
      <div className="panel-head">
        <b>{line}</b>
        <span className="wait-who">
          <span className="wait-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          {who}
        </span>
      </div>
    </section>
  );
}

// ——— «Джек ускользает», «Тортуга» ———

export function JackPanel({ s, data, ship, onAct }: { s: GameState; data: GameData; ship: string; onAct: (a: Action) => void }) {
  const legend = cardByCode(data, `${ship}-Л`);
  return (
    <Panel
      title={`${nick(data, ship)} тонет! Сыграть «${legend.name}»?`}
      sub={`${legend.big}. Стоимость ${powderWord(legend.cost)}, в Трюме ${s.teams[s.ships[ship].side].powder}.`}
      tone="reaction"
      testid="jack-panel"
    >
      <div className="panel-actions">
        <button className="btn" onClick={() => onAct({ type: 'jack', play: false })}>
          Нет — утонуть
        </button>
        <button className="btn primary legend-btn" onClick={() => onAct({ type: 'jack', play: true })}>
          Сыграть · {powderWord(legend.cost)}
        </button>
      </div>
    </Panel>
  );
}

export function TortugaPanel({ s, data, side, onAct }: { s: GameState; data: GameData; side: Side; onAct: (a: Action) => void }) {
  const seats = Object.values(s.ships).filter((x) => x.side === side && seatShip(s, x.code));
  const [draws, setDraws] = useState<Record<string, number>>({});
  const total = Object.values(draws).reduce((a, b) => a + b, 0);
  const max = Math.min(data.rules.seaTortuga, s.teams[side].powder);
  return (
    <Panel title="Тортуга: сколько карт взять?" sub={`1 Порох за карту, не больше ${data.rules.seaTortuga}. В Трюме ${s.teams[side].powder}.`} testid="tortuga-panel">
      {seats.map((x) => (
        <div key={x.code} className="stepper">
          <span>{nick(data, x.code)}</span>
          <button className="btn small" onClick={() => setDraws({ ...draws, [x.code]: Math.max(0, (draws[x.code] ?? 0) - 1) })}>
            −
          </button>
          <b>{draws[x.code] ?? 0}</b>
          <button className="btn small" onClick={() => total < max && setDraws({ ...draws, [x.code]: (draws[x.code] ?? 0) + 1 })}>
            +
          </button>
        </div>
      ))}
      <div className="panel-actions">
        <button className="btn" onClick={() => onAct({ type: 'tortuga', side, draws: {} })}>
          Не брать
        </button>
        <button className="btn primary" onClick={() => onAct({ type: 'tortuga', side, draws })}>
          Взять {total} · {powderWord(total)}
        </button>
      </div>
    </Panel>
  );
}

// ——— Choices after a card has shown something ———

const CHOICE_TEXT: Record<string, { title: string; sub: string }> = {
  compass: { title: 'Компас Джека', sub: 'Выберите карту в руку, затем карту в План. Третья уйдёт в сброс.' },
  toPlan: { title: 'Безумный план', sub: 'Выберите карту с руки в План.' },
  pass: { title: 'Анжелика', sub: 'Выберите карту, которую получит союзник.' },
  spy: { title: 'Шпион Мерсер', sub: 'Выберите Реакцию противника — он её сбросит.' },
  tia: { title: 'Тиа Дальма', sub: 'Разложите карты моря: первая выбранная откроется первой. «i» — карта целиком.' },
  bell: { title: 'Колокол «Голландца»', sub: 'Выберите карту с руки и сбросьте её.' },
  dice: { title: 'Игра в кости лжеца', sub: 'Втайне выберите карту с руки. Дороже в Порохе — забирает обе.' },
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
      <div className="a" style={sea ? { background: SEA_BG[sea.key] } : undefined} dangerouslySetInnerHTML={{ __html: sea ? seaSvg(sea.key, 70, 42) : '' }} />
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
    <Panel title={`${nick(data, seat)}: ${text.title}`} sub={text.sub} testid="choice-panel">
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
      <div className="panel-actions">
        <button className="btn" onClick={() => setPicks([])}>
          Сбросить выбор
        </button>
        <button
          className="btn primary"
          aria-disabled={picks.length !== allowed.count}
          onClick={() => picks.length === allowed.count && onAct({ type: 'choose', seat, cards: picks })}
        >
          Готово ({picks.length} из {allowed.count})
        </button>
      </div>
    </Panel>
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
  const title = repairShip
    ? `${c.name} → ${nick(data, repairShip.code)}${cells > 0 ? `: восстановить ${cellsWord(cells)}` : ''}`
    : `${nick(data, mode.seat)}: «${c.name}»`;
  const split = mode.repair ?? {};
  const used = TRACKS.reduce((n, t) => n + (split[t] ?? 0), 0);
  const canRegroup = needs.regroup && refusal(s, { ...action, regroup: true }, data) === null;
  return (
    <Panel title={title} sub={c.big} testid="card-panel">
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
        <div className="stepper">
          <span>Потратить Души (2 клетки за каждую)</span>
          <button className="btn small" onClick={() => setMode({ ...mode, souls: Math.max(0, (mode.souls ?? needs.souls!) - 1), repair: null })}>
            −
          </button>
          <b>{mode.souls ?? needs.souls}</b>
          <button className="btn small" onClick={() => setMode({ ...mode, souls: Math.min(needs.souls!, (mode.souls ?? needs.souls!) + 1), repair: null })}>
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
              <div key={t} className="stepper" data-track={t}>
                <span>
                  {TRACK_NAME[t]} {repairShip.tracks[t]}/{startValue(data, repairShip.code, t)}
                </span>
                <button className="btn small" onClick={() => setMode({ ...mode, repair: { ...split, [t]: Math.max(0, n - 1) } })}>
                  −
                </button>
                <b>{n}</b>
                <button
                  className="btn small"
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
      <div className="panel-actions">
        <button className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button className="btn primary" data-testid="play-card" aria-disabled={!!why} onClick={() => !why && onAct(action)}>
          Сыграть{c.cost ? ` · ${c.cost} П` : ''}
          {c.soul ? ` · ${c.soul} Д` : ''}
        </button>
      </div>
    </Panel>
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
}: {
  title: string;
  sub?: string;
  yes: string;
  no?: string;
  onYes: () => void;
  onNo: () => void;
  testid?: string;
}) {
  return (
    <Panel title={title} sub={sub} testid={testid}>
      <div className="panel-actions">
        <button className="btn" onClick={onNo}>
          {no}
        </button>
        <button className="btn primary" data-testid="confirm-yes" onClick={onYes}>
          {yes}
        </button>
      </div>
    </Panel>
  );
}

export function PlansPanel({ s, data, seat, onDone, onCancel }: { s: GameState; data: GameData; seat: string; onDone: (plans: string[]) => void; onCancel: () => void }) {
  const holder = s.ships[seat];
  const room = data.rules.plansMax - holder.plans.length;
  const [picks, setPicks] = useState<string[]>([]);
  return (
    <Panel
      title={`${nick(data, seat)}: отложить карты в Планы?`}
      sub={`До ${room} ${room === 1 ? 'карты' : 'карт'} с руки. Реакцию из Плана можно сыграть сверх лимита Парусов, бонус «План:» действует.`}
      testid="plans-panel"
    >
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
      <div className="panel-actions">
        <button className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button className="btn" data-testid="no-plans" onClick={() => onDone([])}>
          Без Планов
        </button>
        <button className="btn primary" aria-disabled={picks.length === 0} onClick={() => picks.length > 0 && onDone(picks)}>
          Отложить {picks.length} и закончить ход
        </button>
      </div>
    </Panel>
  );
}

/** A Reaction or Order card the player opened: is it playable now and why not. */
export function playHint(s: GameState, data: GameData, seat: string, card: string): string | null {
  return playOptions(s, data, seat, card).reason;
}
