// Questions the interface asks the engine: may this be done and why not, what a card needs, what a Volley or a
// Reaction will do. Every answer comes from a dry run of applyAction, so the rules exist in one place; the dry run
// works on a copy and its result is never shown, only the numbers the player may know anyway.
import { repairShipOf, targetKind } from './cards';
import { applyAction } from './engine';
import { createRng } from './rng';
import {
  ABILITY,
  RuleError,
  TRACK_MIN,
  aliveShips,
  cardByCode,
  hasAbility,
  otherSide,
  planFx,
  seatShip,
  seatsOf,
  shipData,
  teamShips,
  type Action,
  type CardParams,
  type Ctx,
  type GameEvent,
  type GameState,
  type ShipState,
  type Term,
  type VolleyState,
} from './state';
import type { GameData, Side, Track } from './types';
import { HIDDEN } from './view';
import { volleyDamage, volleyTerms } from './volley';

export type Tried = { ok: true; state: GameState; events: GameEvent[] } | { ok: false; reason: string };

/**
 * Applies the action to a copy: the new state, or the refusal of the rules. On a player's view (viewFor: the seed
 * is cut) the dry run may meet a hidden card ('?') after all the checks have passed: the action is then allowed,
 * the server decides what happens, and the view stays as it is.
 */
export function tryAction(state: GameState, action: Action, data: GameData): Tried {
  try {
    return { ok: true, ...applyAction(state, action, data) };
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, reason: e.message };
    if (state.seed === 0) return { ok: true, state, events: [] };
    throw e;
  }
}

/** Why the action is not allowed now, or null. */
export function refusal(state: GameState, action: Action, data: GameData): string | null {
  const r = tryAction(state, action, data);
  return r.ok ? null : r.reason;
}

const ctxOf = (s: GameState, data: GameData): Ctx => ({ s, data, rng: createRng(s.rng), events: [] });

export { TRACK_NAME } from './state';
/** «4 по Корпусу». */
export const TRACK_DATIVE: Record<Track, string> = { hull: 'Корпусу', sails: 'Парусам', guns: 'Пушкам', crew: 'Команде' };

/** «2 Пушки + 1 Ядра − 1 диагональ». */
export function formatTerms(terms: Term[]): string {
  return terms
    .filter((t) => t.n !== 0)
    .map((t, i) => (i === 0 ? `${t.n} ${t.what}` : `${t.n < 0 ? '−' : '+'} ${Math.abs(t.n)} ${t.what}`))
    .join(' ');
}

// ——— Who decides ———

export type DecisionKind = 'turn' | 'reactions' | 'jack' | 'tortuga' | 'choice';

export interface Decider {
  kind: DecisionKind;
  side: Side;
  /** Seats whose decision is awaited (for a turn — the seats of the active team). */
  seats: string[];
}

/** Whose decision the game waits for now, or null when it is over. */
export function decider(s: GameState): Decider | null {
  if (s.winner) return null;
  const p = s.pending;
  const sideOf = (seat: string) => s.ships[seat].side;
  if (!p) return { kind: 'turn', side: s.active, seats: seatsOf(s, s.active).map((x) => x.code) };
  switch (p.kind) {
    case 'reactions':
      return { kind: 'reactions', side: p.side, seats: [...p.waiting] };
    case 'jack':
      return { kind: 'jack', side: sideOf(p.ship), seats: [p.ship] };
    case 'tortuga':
      return { kind: 'tortuga', side: p.waiting[0], seats: seatsOf(s, p.waiting[0]).map((x) => x.code) };
    case 'choice': {
      const side = sideOf(p.waiting[0]);
      return { kind: 'choice', side, seats: p.waiting.filter((seat) => sideOf(seat) === side) };
    }
  }
}

// ——— Cards ———

export interface CardNeeds {
  /** The player chooses an enemy ship or an enemy player (seat). */
  target: 'ship' | 'seat' | null;
  /** «Живые снасти», «Фонтан молодости»: own ship or the ally's. */
  ship: boolean;
  /** «N клеток на любых шкалах»: cells to split (for «Сердце бьётся» — 2 per Soul). */
  cells: number;
  /** «Сердце бьётся»: Souls to spend, up to this number. */
  souls: number | null;
  /** «Строй линии»: the free Regroup by choice. */
  regroup: boolean;
  /** The ship the card repairs (engine: repairTarget), with the player's choice of ship if given; null — no repair. */
  repairShip: string | null;
}

export const isHidden = (card: string) => card === HIDDEN;

/** Where the seat holds the card: in a Plan of the Pearl or in the hand. */
const fromPlan = (s: GameState, seat: string, card: string) => !s.ships[seat].hand.includes(card) && s.ships[seat].plans.includes(card);

export function cardNeeds(s: GameState, data: GameData, seat: string, card: string, params: CardParams = {}): CardNeeds {
  const c = cardByCode(data, card);
  const ops = planFx(c.fx, fromPlan(s, seat, card)).ops ?? [];
  const kind = targetKind(ops);
  const ship = seatShip(s, seat);
  const keeper = ship ? aliveShips(s, ship.side).find((x) => shipData(data, x.code).souls !== undefined) : undefined;
  let cells = 0;
  for (const op of ops) if (op[0] === 'repair_self' || op[0] === 'repair_ally') cells = Number(op[1]);
  const souls = ops.some((op) => op[0] === 'souls_repair') ? (keeper?.souls ?? 0) : null;
  return {
    target: kind === 'ship' || kind === 'seat' ? kind : ops.some((op) => op[0] === 'extra_volley_free') ? 'ship' : null,
    ship: ops.some((op) => op[0] === 'repair_track_any'),
    cells: souls !== null ? 2 * souls : cells,
    souls,
    regroup: ops.some((op) => op[0] === 'regroup_free'),
    repairShip: ship ? (repairShipOf(ctxOf(s, data), { card, seat, ship: ship.code, params }, ops)?.code ?? null) : null,
  };
}

/** Candidate targets: enemy ships afloat, or enemy seats that still play. */
function candidateTargets(s: GameState, seat: string, kind: 'ship' | 'seat'): string[] {
  const ship = seatShip(s, seat);
  if (!ship) return [];
  const enemy = otherSide(ship.side);
  return kind === 'ship' ? aliveShips(s, enemy).map((x) => x.code) : seatsOf(s, enemy).map((x) => x.code);
}

export interface PlayOptions {
  /** Allowed actions with default choices, one per possible target. */
  actions: Action[];
  /** Why the card cannot be played now, when there is no allowed action. */
  reason: string | null;
}

/**
 * Ways to play a card of the seat now: an Order or a Repair (`playCard`), a Charge (a Volley of the seat's ship
 * with it), a Reaction (only in the open window). Cards whose targets are chosen get one action per target.
 */
export function playOptions(s: GameState, data: GameData, seat: string, card: string): PlayOptions {
  if (isHidden(card)) return { actions: [], reason: 'Карта скрыта' };
  const c = cardByCode(data, card);
  const ship = seatShip(s, seat);
  if (!ship) return { actions: [], reason: 'Этот игрок больше не играет' };
  if (c.type === 'РЕАКЦИЯ') {
    if (s.pending?.kind === 'reactions' && s.pending.waiting.includes(seat)) {
      const r = tryAction(s, { type: 'react', seat, card }, data);
      return r.ok ? { actions: [{ type: 'react', seat, card }], reason: null } : { actions: [], reason: r.reason };
    }
    return { actions: [], reason: 'Реакцию играют в ход противника, когда он объявит Залп или карту' };
  }
  const tries: Action[] = [];
  if (c.type === 'ЗАРЯД') {
    for (const target of candidateTargets(s, seat, 'ship')) {
      tries.push({ type: 'volley', ship: ship.code, target, charge: card, ...(seat !== ship.code ? { chargeFrom: seat } : {}) });
    }
  } else {
    const needs = cardNeeds(s, data, seat, card);
    const targets: (string | undefined)[] = needs.target ? candidateTargets(s, seat, needs.target) : [undefined];
    if (targets.length === 0) targets.push(undefined);
    for (const target of targets) {
      const base: Action = { type: 'playCard', seat, card, ...(target ? { target } : {}) };
      tries.push(needs.regroup ? { ...base, regroup: true } : base);
      if (needs.regroup) tries.push(base);
    }
  }
  const actions: Action[] = [];
  let reason: string | null = null;
  const seen = new Set<string>();
  for (const a of tries) {
    const key = a.type === 'playCard' || a.type === 'volley' ? (a.target ?? '') : '';
    if (seen.has(key)) continue;
    const r = tryAction(s, a, data);
    if (r.ok) {
      actions.push(a);
      seen.add(key);
    } else reason ??= r.reason;
  }
  return { actions, reason: actions.length > 0 ? null : (reason ?? 'Сейчас эту карту сыграть нельзя') };
}

// ——— Volleys ———

export interface TrackChange {
  track: Track;
  from: number;
  to: number;
  hullFrom: number;
  hullTo: number;
}

/** What n damage to a track does to the ship, with the rest going to the Hull (RULES.md 11.1). */
export function damageResult(ship: ShipState, track: Track, n: number): TrackChange {
  const take = Math.max(0, Math.min(n, ship.tracks[track] - TRACK_MIN[track]));
  const toHull = track === 'hull' ? 0 : Math.min(Math.max(0, n - take), ship.tracks.hull);
  return {
    track,
    from: ship.tracks[track],
    to: ship.tracks[track] - take,
    hullFrom: ship.tracks.hull,
    hullTo: track === 'hull' ? ship.tracks.hull - take : ship.tracks.hull - toHull,
  };
}

export interface VolleyPreview {
  ok: true;
  target: string;
  damage: number;
  track: Track;
  terms: Term[];
  diagonal: boolean;
  /** The Volley allows no Reactions (a Charge «без Реакций», the first Volley after surfacing). */
  noReact: boolean;
  change: TrackChange;
}

export type VolleyOrder = Omit<Extract<Action, { type: 'volley' }>, 'type'>;

/** The Volley as declared: damage with its addends, before any Reaction. */
export function previewVolley(s: GameState, data: GameData, order: VolleyOrder): VolleyPreview | { ok: false; reason: string } {
  const r = tryAction(s, { type: 'volley', ...order }, data);
  if (!r.ok) return r;
  const declared = r.events.find((e) => e.type === 'volley');
  if (!declared || declared.type !== 'volley') return { ok: false, reason: 'Залп не состоялся' };
  let terms: Term[];
  const v = r.state.volley;
  if (v && v.shooter === order.ship && v.target === declared.target) terms = volleyTerms(ctxOf(r.state, data), v);
  else {
    const hit = r.events.find((e) => e.type === 'hit');
    terms = hit?.type === 'hit' ? hit.terms : [];
  }
  const damage = Math.max(0, terms.reduce((sum, t) => sum + t.n, 0));
  const shooter = s.ships[order.ship];
  const fx = order.charge ? planFx(cardByCode(data, order.charge).fx, fromPlan(s, order.chargeFrom ?? order.ship, order.charge)) : {};
  return {
    ok: true,
    target: declared.target,
    damage,
    track: declared.track,
    terms,
    diagonal: declared.diagonal,
    noReact: !!fx.no_react || shooter.surfaced,
    change: damageResult(s.ships[declared.target], declared.track, damage),
  };
}

export interface VolleyTarget {
  target: string;
  preview: VolleyPreview;
}

/** Targets the ship may fire at now with the Charge (or without), each with its damage. */
export function volleyTargets(s: GameState, data: GameData, order: Omit<VolleyOrder, 'target'>): { targets: VolleyTarget[]; reason: string | null } {
  const ship = s.ships[order.ship];
  const targets: VolleyTarget[] = [];
  let reason: string | null = null;
  for (const enemy of aliveShips(s, otherSide(ship.side))) {
    const p = previewVolley(s, data, { ...order, target: enemy.code });
    if (p.ok) targets.push({ target: enemy.code, preview: p });
    else reason ??= p.reason;
  }
  if (aliveShips(s, otherSide(ship.side)).length === 0) reason = 'Нет целей';
  return { targets, reason: targets.length > 0 ? null : reason };
}

// ——— Reactions ———

interface Strike {
  target: string;
  damage: number;
  track: Track;
  cancelled: boolean;
}

function strikeOf(s: GameState, data: GameData, v: VolleyState): Strike {
  return { target: v.target, damage: volleyDamage(ctxOf(s, data), v), track: v.track, cancelled: v.cancelled };
}

/** What the volley being resolved does after the action: from the state if it still waits, or from the events. */
function strikeAfter(r: Extract<Tried, { ok: true }>, data: GameData, before: VolleyState): Strike | null {
  const v = r.state.volley;
  if (v && v.shooter === before.shooter && (v.target === before.target || r.state.pending?.kind === 'reactions')) {
    return strikeOf(r.state, data, v);
  }
  for (const e of r.events) {
    if (e.type === 'volleyCancelled') return { target: e.target, damage: 0, track: before.track, cancelled: true };
    if (e.type === 'hit') return { target: e.target, damage: e.damage, track: e.track, cancelled: false };
  }
  return null;
}

/** The Volley or card the defending team answers now, in words: «„Месть“ стреляет по „Индевору“ · 4 по Корпусу». */
export function threat(s: GameState, data: GameData): { title: string; detail: string } | null {
  const p = s.pending;
  if (p?.kind !== 'reactions') return null;
  const name = (code: string) => `«${shipData(data, code).nick}»`;
  const to = (code: string) => `«${shipData(data, code).nickDative}»`;
  if (p.subject === 'volley' && s.volley) {
    const v = s.volley;
    const terms = volleyTerms(ctxOf(s, data), v);
    const damage = volleyDamage(ctxOf(s, data), v);
    if (p.window === 'after') {
      return { title: `${name(v.shooter)} выстрелил по ${to(v.target)}`, detail: 'Ответ после Залпа' };
    }
    return {
      title: `${name(v.shooter)} стреляет по ${to(v.target)} · ${damage} по ${TRACK_DATIVE[v.track]}`,
      detail: formatTerms(terms),
    };
  }
  if (s.card) {
    const c = cardByCode(data, s.card.card);
    const target = s.card.target && s.ships[s.card.target] ? ` по ${to(s.card.target)}` : '';
    return { title: `${name(s.card.ship)}: «${c.name}»${target}`, detail: c.big };
  }
  return null;
}

/** The Volley the defending team answers, nominative: «Залп «Месть» → «Индевор»: 4 по Корпусу» (seen by everyone). */
export function threatLine(s: GameState, data: GameData): string | null {
  const p = s.pending;
  if (p?.kind !== 'reactions') return null;
  const name = (code: string) => `«${shipData(data, code).nick}»`;
  if (p.subject === 'volley' && s.volley) {
    const v = s.volley;
    if (p.window === 'after') return `Залп ${name(v.shooter)} → ${name(v.target)} нанесён`;
    return `Залп ${name(v.shooter)} → ${name(v.target)}: ${volleyDamage(ctxOf(s, data), v)} по ${TRACK_DATIVE[v.track]}`;
  }
  if (s.card) {
    const c = cardByCode(data, s.card.card);
    const target = s.card.target && s.ships[s.card.target] ? ` → ${name(s.card.target)}` : '';
    return `${name(s.card.ship)}: «${c.name}»${target}`;
  }
  return null;
}

/** What a Reaction does to the Volley or the card, from one dry run (previewReaction and reactionNow word it). */
type Outcome =
  | { k: 'refused'; reason: string }
  | { k: 'answer'; total: number; shooter: string }
  | { k: 'cancel'; before: Strike }
  | { k: 'redirect'; before: Strike; after: Strike }
  | { k: 'track'; before: Strike; after: Strike }
  | { k: 'damage'; before: Strike; after: Strike }
  | { k: 'cardCancelled' }
  | { k: 'stolen' }
  | { k: 'noCrew' }
  | { k: 'unknown' };

function reactionOutcome(s: GameState, data: GameData, seat: string, card: string): Outcome {
  const r = tryAction(s, { type: 'react', seat, card }, data);
  if (!r.ok) return { k: 'refused', reason: r.reason };
  const p = s.pending;
  if (p?.kind === 'reactions' && p.subject === 'volley' && s.volley) {
    const before = strikeOf(s, data, s.volley);
    if (p.window === 'after') {
      const hits = r.events.filter((e) => e.type === 'damage' && e.ship === s.volley!.shooter);
      const total = hits.reduce((n, e) => n + (e.type === 'damage' ? e.amount + e.toHull : 0), 0);
      return { k: 'answer', total, shooter: s.volley.shooter };
    }
    const after = strikeAfter(r, data, s.volley);
    if (!after) return { k: 'unknown' };
    if (after.cancelled) return { k: 'cancel', before };
    if (after.target !== before.target) return { k: 'redirect', before, after };
    if (after.track !== before.track) return { k: 'track', before, after };
    return { k: 'damage', before, after };
  }
  if (r.events.some((e) => e.type === 'cardCancelled') || r.state.card?.cancelled) return { k: 'cardCancelled' };
  if (r.state.card?.stolenBy === seat) return { k: 'stolen' };
  if (r.state.card?.crewCancelled) return { k: 'noCrew' };
  return { k: 'unknown' };
}

/** What a Reaction would change: «4 → 2», «4 → 0 · отмена», «удар примет „Голландец“», «ответ: −2 Корпус „Мести“». */
export function previewReaction(s: GameState, data: GameData, seat: string, card: string): { ok: true; label: string } | { ok: false; reason: string } {
  const o = reactionOutcome(s, data, seat, card);
  const name = (code: string) => `«${shipData(data, code).nick}»`;
  switch (o.k) {
    case 'refused':
      return { ok: false, reason: o.reason };
    case 'answer':
      return { ok: true, label: o.total > 0 ? `ответ: −${o.total} ${name(o.shooter)}` : 'ответ' };
    case 'cancel':
      return { ok: true, label: `${o.before.damage} → 0 · отмена` };
    case 'redirect':
      return { ok: true, label: `${o.after.damage} → ${name(o.after.target)}` };
    case 'track':
      return { ok: true, label: `${o.before.damage} → ${o.after.damage} по ${TRACK_DATIVE[o.after.track]}` };
    case 'damage':
      return { ok: true, label: `${o.before.damage} → ${o.after.damage}` };
    case 'cardCancelled':
      return { ok: true, label: 'карта отменена' };
    case 'stolen':
      return { ok: true, label: 'карта уйдёт к вам' };
    case 'noCrew':
      return { ok: true, label: 'без урона Команде' };
    case 'unknown':
      return { ok: true, label: 'сыграть' };
  }
}

/**
 * «What happens now» in the Reaction window, in a sentence, shown without «Подсказки» too: «Залп 4 → 2»,
 * «Залп уйдёт в «Голландец»: 4 по Корпусу», «Залп отменён». The numbers are those of previewReaction.
 */
export function reactionNow(s: GameState, data: GameData, seat: string, card: string): { ok: true; text: string } | { ok: false; reason: string } {
  const o = reactionOutcome(s, data, seat, card);
  const name = (code: string) => `«${shipData(data, code).nick}»`;
  switch (o.k) {
    case 'refused':
      return { ok: false, reason: o.reason };
    case 'answer':
      return { ok: true, text: o.total > 0 ? `Ответ: −${o.total} ${name(o.shooter)}` : 'Ответ после Залпа — по тексту карты' };
    case 'cancel':
      return { ok: true, text: 'Залп отменён' };
    case 'redirect':
      return { ok: true, text: `Залп уйдёт в ${name(o.after.target)}: ${o.after.damage} по ${TRACK_DATIVE[o.after.track]}` };
    case 'track':
      return { ok: true, text: `Залп ${o.before.damage} → ${o.after.damage} по ${TRACK_DATIVE[o.after.track]}` };
    case 'damage':
      return { ok: true, text: `Залп ${o.before.damage} → ${o.after.damage}` };
    case 'cardCancelled':
      return { ok: true, text: 'Карта отменена' };
    case 'stolen':
      return { ok: true, text: 'Карта уйдёт к вам' };
    case 'noCrew':
      return { ok: true, text: 'Без урона Команде' };
    case 'unknown':
      return { ok: true, text: 'Эффект — по тексту карты' };
  }
}

// ——— Abilities, Legends, the end of the turn ———

export interface AbilityButton {
  key: string;
  label: string;
  /** A shorter label for narrow screens. */
  short: string;
  action: Action;
}

/** Abilities of the ship that can be used right now: shown as buttons only then (docs/TZ.md, «Принципы стола», п. 3). */
export function abilityButtons(s: GameState, data: GameData, code: string): AbilityButton[] {
  const ship = s.ships[code];
  const r = data.rules;
  const out: AbilityButton[] = [];
  const add = (key: string, label: string, short: string, action: Action) => {
    if (tryAction(s, action, data).ok) out.push({ key, label, short, action });
  };
  if (hasAbility(data, ship, ABILITY.sword)) add('sword', `Меч Тритона · ${r.swordCost} П`, `Меч · ${r.swordCost}`, { type: 'sword', ship: code });
  if (hasAbility(data, ship, ABILITY.treasury)) add('treasury', `Казна · ${r.treasuryCost} П`, `Казна · ${r.treasuryCost}`, { type: 'treasury', ship: code });
  if (hasAbility(data, ship, ABILITY.dive)) add('dive', 'Погружение', 'Нырок', { type: 'dive', ship: code });
  if (hasAbility(data, ship, ABILITY.eternalService)) {
    add('soulHull', 'Душа → +1 Корпус', 'Душа→Корп', { type: 'souls', ship: code, track: 'hull' });
    add('soulCrew', 'Душа → +1 Команда', 'Душа→Ком', { type: 'souls', ship: code, track: 'crew' });
  }
  return out;
}

/** «Сердце Дейви Джонса»: the extra Volley of the ally ordered by the Endeavour — its possible targets. */
export function heartTargets(s: GameState, data: GameData, code: string): VolleyTarget[] {
  const ship = s.ships[code];
  const commander = teamShips(s, ship.side).find((x) => x.code !== code && hasAbility(data, x, ABILITY.heart));
  if (!commander || ship.sunk) return [];
  return volleyTargets(s, data, { ship: code, heart: true }).targets;
}

/** The Legend of the seat as an Order: possible targets (null — needs none) or why not. */
export function legendOptions(s: GameState, data: GameData, seat: string): { actions: Action[]; reason: string | null } {
  const ship = s.ships[seat];
  if (!ship.legend || ship.sunk) return { actions: [], reason: 'Легенда уже сыграна или ушла из игры' };
  const card = cardByCode(data, `${seat}-Л`);
  if (card.type !== 'ПРИКАЗ') return { actions: [], reason: `«${card.name}» играется, когда «${shipData(data, seat).nick}» должна утонуть` };
  const tries: Action[] = [{ type: 'playLegend', seat }];
  for (const enemy of aliveShips(s, otherSide(ship.side))) tries.push({ type: 'playLegend', seat, target: enemy.code });
  const actions: Action[] = [];
  let reason: string | null = null;
  for (const a of tries) {
    const r = tryAction(s, a, data);
    if (r.ok) actions.push(a);
    else if (!reason || reason === 'Выберите вражеский корабль') reason = r.reason;
  }
  return { actions, reason: actions.length > 0 ? null : reason };
}

/**
 * Whether the team still has something useful to do: a card to play, a Volley, a Legend. Free actions and
 * abilities do not count. When nothing is left, «Ход окончен» turns green (docs/TZ.md, «Очередь хода», п. 3).
 */
export function hasUsefulMoves(s: GameState, data: GameData, side: Side): boolean {
  if (s.pending || s.winner || s.active !== side) return false;
  for (const seat of seatsOf(s, side)) {
    const holder = s.ships[seat.code];
    const ship = seatShip(s, seat.code);
    if (!ship) continue;
    if (!holder.sunk && legendOptions(s, data, seat.code).actions.length > 0) return true;
    if (seat.code === ship.code && volleyTargets(s, data, { ship: ship.code }).targets.length > 0) return true;
    for (const card of [...holder.hand, ...holder.plans]) {
      if (cardByCode(data, card).type === 'РЕАКЦИЯ') continue;
      if (playOptions(s, data, seat.code, card).actions.length > 0) return true;
    }
  }
  return false;
}

/** Ships of the team that may still fire this turn and the team has Powder for it: «Залп не дан…» before the end. */
export function unfiredShips(s: GameState, data: GameData, side: Side): string[] {
  return aliveShips(s, side)
    .filter((x) => (s.turn.volleys[x.code] ?? 0) === 0 && !s.turn.dived.includes(x.code))
    .filter((x) => volleyTargets(s, data, { ship: x.code }).targets.length > 0)
    .map((x) => x.code);
}
