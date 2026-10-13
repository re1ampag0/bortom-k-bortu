// Reactions (RULES.md 12): two windows — «до урона» after a Volley or a card against the team is declared,
// «после Залпа» after its damage. Limits: Sails (7.2, 7.3); Plans of the Black Pearl and the captain of a sunk ship
// play beyond them (7.5, 14.1, 17.3).
import { payCardCost, discard, findCard } from './turn';
import { cancelCharge } from './volley';
import {
  RuleError,
  cardByCode,
  getShip,
  namedShip,
  oneEffect,
  planFx,
  otherSide,
  pushSteps,
  requirePending,
  seatShip,
  seatsOf,
  shipData,
  takeCard,
  type CardResolution,
  type Ctx,
  type ReactionWindow,
  type ShipState,
  type Step,
  type VolleyState,
} from './state';
import type { CardInstance, Fx, Side } from './types';

type Subject = 'volley' | 'card';

/** A Reaction a seat may play now. */
export interface ReactionOption {
  card: string;
  fromPlan: boolean;
  /** The ship the Reaction is played for: the seat's own, or the ally's for a captain. */
  ship: string;
}

/** Opens a Reaction window for the defending team, or skips it when nobody has a Reaction to play. */
export function openWindow(ctx: Ctx, window: ReactionWindow, subject: Subject): void {
  const side = defendingSide(ctx, window, subject);
  if (!side) return;
  const seats = seatsOf(ctx.s, side)
    .map((x) => x.code)
    .filter((seat) => reactionOptions(ctx, seat, side, window, subject).length > 0);
  if (seats.length === 0) return;
  ctx.s.pending = { kind: 'reactions', window, subject, side, waiting: seats };
  ctx.events.push({ type: 'windowOpened', window, side, seats });
}

/**
 * The team that may react, or null when the window does not open: no window for a cancelled Volley or one
 * «без Реакций» (12.6); no window «после Залпа» when the shooter sank (12.3, Q18). Cards have only the first window.
 */
function defendingSide(ctx: Ctx, window: ReactionWindow, subject: Subject): Side | null {
  const { s } = ctx;
  if (subject === 'card') {
    const c = s.card;
    if (!c || c.cancelled || c.lost || window !== 'before') return null;
    return otherSide(getShip(s, c.ship).side);
  }
  const v = s.volley;
  if (!v || v.cancelled || v.noReact) return null;
  if (window === 'after' && getShip(s, v.shooter).sunk) return null;
  return getShip(s, v.target).side;
}

/** Reactions the seat may play in the open window. */
export function legalReactions(ctx: Ctx, seat: string): ReactionOption[] {
  const pending = ctx.s.pending;
  if (pending?.kind !== 'reactions') return [];
  return reactionOptions(ctx, seat, pending.side, pending.window, pending.subject);
}

function reactionOptions(ctx: Ctx, seat: string, side: Side, window: ReactionWindow, subject: Subject): ReactionOption[] {
  const { s } = ctx;
  const holder = getShip(s, seat);
  if (holder.side !== side || s.active === side) return [];
  const ship = seatShip(s, seat);
  if (!ship) return [];
  // Under water — no Reactions (14.8); «Ужас Карибского моря», «Подкуп» forbid them, also from Plans (12.8, Q17).
  if (ship.submerged || s.turn.noReact.includes(ship.code) || s.turn.noReactTeam) return [];

  const captain = holder.sunk;
  const fromHand = captain ? !s.turn.captainReacted.includes(seat) : (s.turn.reactions[ship.code] ?? 0) < ship.tracks.sails;
  const options: ReactionOption[] = [];
  const consider = (card: string, fromPlan: boolean) => {
    const c = cardByCode(ctx.data, card);
    if (c.type !== 'РЕАКЦИЯ' || !canPay(ctx, c, ship)) return;
    const fx = reactionFx(c, fromPlan);
    if (!applies(ctx, fx, cardShip(ctx, card, fx, ship), window, subject, fromPlan)) return;
    options.push({ card, fromPlan, ship: ship.code });
  };
  if (fromHand) for (const card of holder.hand) consider(card, false);
  if (!captain) for (const card of holder.plans) consider(card, true);
  return options;
}

/**
 * The ship a Reaction acts for: a card that names a ship («Залп по «Жемчужине»…», fx.self_only) — that ship
 * (namedShip, Q43); any other — the ship it is played for («ваш корабль»).
 */
function cardShip(ctx: Ctx, card: string, fx: Fx, ship: ShipState): ShipState {
  return fx.self_only ? getShip(ctx.s, namedShip(ctx, card, ship.code)) : ship;
}

function reactionFx(c: CardInstance, fromPlan: boolean): Fx {
  return planFx(c.fx, fromPlan);
}

function canPay(ctx: Ctx, c: CardInstance, ship: ShipState): boolean {
  if (ctx.s.teams[ship.side].powder < c.cost) return false;
  if (c.soul === 0) return true;
  const keeper = Object.values(ctx.s.ships).find(
    (x) => x.side === ship.side && !x.sunk && shipData(ctx.data, x.code).souls !== undefined,
  );
  return !!keeper && keeper.souls >= c.soul;
}

/**
 * Whether a Reaction can do something now: the card may be played only if a part of it can be done (9.9).
 * `ship` is the ship the card names («Залп по «Жемчужине»»), see namedShip (Q43); for cards without a name — the
 * ship it is played for.
 * «… после Залпа» (counter) — only after the damage; the rest — only before it (12.2, 12.3).
 * Reactions on a Volley do not answer a card; «на Залп или карту» (fx.cards) do (9.6, 12.7).
 */
function applies(ctx: Ctx, fx: Fx, ship: ShipState, window: ReactionWindow, subject: Subject, fromPlan: boolean): boolean {
  if (window === 'after') {
    const v = ctx.s.volley!;
    return fx.r === 'counter' && (!fx.self_only || v.target === ship.code);
  }
  if (subject === 'card') return appliesToCard(fx, ship, ctx.s.card!);
  const v = ctx.s.volley!;
  switch (fx.r) {
    case 'reduce':
      return !fx.self_only || v.target === ship.code;
    case 'reduce_all':
      return true;
    case 'cancel':
      if (fx.self_only && v.target !== ship.code) return false;
      if (fx.vs && v.shooter !== fx.vs) return false;
      // «Чёрные паруса в ночи»: only a diagonal Volley — by position at declaration (10.6, Q8, Q40); any from a Plan.
      if (fx.diag_only && !(fromPlan && fx.plan_any) && !v.diagonal) return false;
      return true;
    case 'cancel_charge':
      return v.charge !== null && !v.chargeCancelled;
    case 'cancel_crew':
      return v.track === 'crew' && !v.crewCancelled;
    case 'redirect':
      return v.target !== ship.code;
    default:
      return false;
  }
}

function appliesToCard(fx: Fx, ship: ShipState, c: CardResolution): boolean {
  // «Ловкость рук»: any card against the team except a Legend (15.1, 18.4); one thief is enough.
  if (fx.r === 'steal') return !c.legend && !c.stolenBy;
  if (!fx.cards) return false;
  switch (fx.r) {
    case 'cancel':
      if (c.cancelled) return false;
      if (fx.self_only && !c.targets.includes(ship.code)) return false;
      return !fx.vs || c.ship === fx.vs;
    case 'cancel_crew':
      return !c.cancelled && c.crew && !c.crewCancelled;
    default:
      return false;
  }
}

/** Plays a Reaction in the open window. It acts at once (12.5); then the window is offered again to everybody. */
export function react(ctx: Ctx, seat: string, card: string): void {
  const { s } = ctx;
  const pending = requirePending(s, 'reactions');
  if (!pending.waiting.includes(seat)) throw new RuleError('Этот игрок сейчас не может играть Реакции');
  const option = legalReactions(ctx, seat).find((o) => o.card === card);
  if (!option) throw new RuleError(reactionRefusal(ctx, seat, card));
  const holder = getShip(s, seat);
  const ship = getShip(s, option.ship);
  const c = cardByCode(ctx.data, card);

  payCardCost(ctx, card, ship, 'reaction');
  if (option.fromPlan) {
    // From a Plan: beyond the Sails limit (14.1).
  } else if (holder.sunk) {
    s.turn.captainReacted.push(seat);
  } else {
    s.turn.reactions[ship.code] = (s.turn.reactions[ship.code] ?? 0) + 1;
  }
  takeCard(findCard(ctx, seat, card).list, card, 'Этой карты нет на руке');
  discard(ctx, card);
  ctx.events.push({ type: 'reaction', seat, ship: ship.code, card, fromPlan: option.fromPlan });

  const fx = reactionFx(c, option.fromPlan);
  const steps = pending.subject === 'volley'
    ? applyToVolley(ctx, fx, c.name, cardShip(ctx, card, fx, ship), pending.window)
    : applyToCard(ctx, fx, s.card!, seat, ship);
  s.pending = null;
  pushSteps(s, ...steps, { k: 'window', window: pending.window, subject: pending.subject });
}

function reactionRefusal(ctx: Ctx, seat: string, card: string): string {
  try {
    findCard(ctx, seat, card);
  } catch {
    return 'Этой карты нет на руке';
  }
  const c = cardByCode(ctx.data, card);
  if (c.type !== 'РЕАКЦИЯ') return 'Это не Реакция';
  return 'Эту Реакцию сейчас сыграть нельзя: не то окно, не та цель, лимит Парусов или не хватает Пороха';
}

function applyToVolley(ctx: Ctx, fx: Fx, name: string, ship: ShipState, window: ReactionWindow): Step[] {
  const v: VolleyState = ctx.s.volley!;
  const steps: Step[] = [];
  const counter = (spec: Fx['counter']) => {
    if (!spec) return;
    const n = spec[1] === 'guns' ? ship.tracks.guns : spec[1];
    steps.push({ k: 'damage', ship: v.shooter, track: spec[0], n, src: ship.code });
  };
  if (window === 'after') {
    // «Ответный залп», «Огненная стена», «Ответный огонь», «Ответ из пучины» — not a Volley (12.3).
    counter(fx.counter);
    counter(fx.counter2);
    if (fx.fire) steps.push({ k: 'addFire', ship: v.shooter, n: fx.fire });
    return oneEffect(steps);
  }
  switch (fx.r) {
    case 'reduce':
      v.adjust.push({ what: name, n: -(fx.n ?? 0) });
      // «Тяжёлый борт»: the shooter takes its damage at once, before the Volley's damage (18.12, Q31).
      counter(fx.counter);
      break;
    case 'reduce_all': {
      const term = { what: name, n: -(fx.n ?? 0) };
      ctx.s.turn.reduceAll.push(term);
      v.adjust.push(term);
      break;
    }
    case 'cancel':
      v.cancelled = true;
      break;
    case 'cancel_charge':
      cancelCharge(ctx, v);
      break;
    case 'cancel_crew':
      v.crewCancelled = true;
      break;
    case 'redirect':
      // «Прикрыть бортом»: the Volley hits the covering ship, −1; nothing else is recalculated (18.1, Q11, Q40).
      v.target = ship.code;
      v.adjust.push({ what: name, n: -(fx.n ?? 0) });
      break;
  }
  return steps;
}

function applyToCard(ctx: Ctx, fx: Fx, c: CardResolution, seat: string, ship: ShipState): Step[] {
  if (fx.r === 'cancel') c.cancelled = true;
  if (fx.r === 'steal') c.stolenBy = seat;
  if (fx.r !== 'cancel_crew') return [];
  c.crewCancelled = true;
  // «Морская пехота»: a boarding beaten off — the boarding ship loses 1 Crew (18.14).
  if (fx.boarding && cardByCode(ctx.data, c.card).tags.includes(BOARDING)) {
    const n = fx.boarding[1] === 'guns' ? ship.tracks.guns : fx.boarding[1];
    return [{ k: 'damage', ship: c.ship, track: fx.boarding[0], n, src: ship.code }];
  }
  return [];
}

/** The tag of boarding cards (18.14). */
const BOARDING = 'абордаж';

/** The seat plays no (more) Reactions in this window. The window closes when every waiting seat has declined. */
export function noReaction(ctx: Ctx, seat: string): void {
  const pending = requirePending(ctx.s, 'reactions');
  if (!pending.waiting.includes(seat)) throw new RuleError('Этот игрок уже ответил');
  pending.waiting = pending.waiting.filter((x) => x !== seat);
  ctx.events.push({ type: 'noReaction', seat });
  if (pending.waiting.length === 0) ctx.s.pending = null;
}
