// The Volley and Charges (RULES.md 10, 18.11), the extra Volley of «Сердце Дейви Джонса» (14.6).
// Order: declare (pay, Charge) → Reactions «до урона» → damage → the Charge's Fire → Reactions «после Залпа».
import { addFire, dealDamage, pay } from './damage';
import {
  ABILITY,
  RuleError,
  aliveShips,
  cardByCode,
  getShip,
  hasAbility,
  pushSteps,
  seaKey,
  shipData,
  shipName,
  takeCard,
  teamShips,
  type Ctx,
  type ShipState,
  type Step,
  type Term,
  type VolleyState,
} from './state';
import { discard, findCard, payCardCost, requireSeat, useCardPlay } from './turn';
import type { Fx } from './types';

export interface VolleyOrder {
  ship: string;
  target: string;
  charge?: string;
  chargeFrom?: string;
  paid?: number;
  heart?: boolean;
}

/** Steps of one Volley (or one part of «Залп с обоих бортов») after it is declared. */
const VOLLEY_STEPS: Step[] = [
  { k: 'window', window: 'before', subject: 'volley' },
  { k: 'volleyHit' },
  { k: 'volleyFire' },
  { k: 'window', window: 'after', subject: 'volley' },
  { k: 'volleyEnd' },
];

export function volley(ctx: Ctx, order: VolleyOrder): void {
  const { s, data } = ctx;
  const shooter = requireSeat(ctx, order.ship);
  const params = shipData(data, shooter.code);
  const name = shipName(data, shooter.code);
  if (shooter.sunk) throw new RuleError(`${name} утонул и не стреляет`);
  if (shooter.submerged) throw new RuleError(`${name} под водой и не стреляет`);
  if (s.turn.dived.includes(shooter.code)) throw new RuleError(`${name} ушёл под воду вместо Залпа`);
  if (order.heart) {
    // «Сердце Дейви Джонса»: the ally orders one more Volley, once a turn (14.6).
    const commander = teamShips(s, shooter.side).find((x) => x.code !== shooter.code && hasAbility(data, x, ABILITY.heart));
    if (!commander) throw new RuleError('Дополнительный Залп по «Сердцу Дейви Джонса» отдаёт «Индевор» на плаву');
    if (s.turn.heartUsed) throw new RuleError('«Сердце Дейви Джонса» — раз в ход');
  } else if (s.turn.volleys[shooter.code] >= params.volleysPerTurn) {
    throw new RuleError(`${name} уже дал Залп в этот ход`);
  }
  if (shooter.tracks.guns <= 0) throw new RuleError('Пушки 0 — Залп невозможен');

  // The Charge: one per Volley, from the hand or a Plan of the shooter or of a captain on board (10.1, 14.1, 17.3).
  const chargeFrom = order.charge ? (order.chargeFrom ?? shooter.code) : null;
  let fx: Fx = {};
  let fromPlan = false;
  let chargeList: string[] | null = null;
  if (order.charge && chargeFrom) {
    requireSeat(ctx, chargeFrom);
    const found = findCard(ctx, chargeFrom, order.charge);
    const card = cardByCode(data, order.charge);
    if (card.type !== 'ЗАРЯД') throw new RuleError('К Залпу можно добавить только Заряд');
    fromPlan = found.fromPlan;
    chargeList = found.list;
    // The «План:» bonus works only for a card played from a Plan (9.5).
    fx = fromPlan && card.fx.plan ? { ...card.fx, ...card.fx.plan } : card.fx;
  }

  const targets = volleyTargets(ctx, shooter, order.target, fx);
  const paid = order.paid ?? 0;
  if (paid !== 0) {
    if (!fx.paid) throw new RuleError('Доплатить Порох можно только с «Оплаченным залпом»');
    if (!Number.isInteger(paid) || paid < 0 || paid > data.rules.paidChargeMax) {
      throw new RuleError(`Доплатить можно от 0 до ${data.rules.paidChargeMax} Пороха`);
    }
  }
  const need = params.volleyCost + (order.charge ? cardByCode(data, order.charge).cost : 0) + paid;
  if (s.teams[shooter.side].powder < need) {
    throw new RuleError(`Не хватает Пороха: нужно ${need}, в Трюме ${s.teams[shooter.side].powder}`);
  }

  if (order.heart) {
    // The Dutchman loses the Crew at once, before the extra Volley (Q33).
    s.turn.heartUsed = true;
    ctx.events.push({ type: 'heart', ship: shooter.code });
    dealDamage(ctx, shooter.code, 'crew', data.rules.heartCrewLoss);
    if (shooter.sunk) return;
  } else {
    s.turn.volleys[shooter.code]++;
  }
  pay(ctx, shooter.side, params.volleyCost, 'volley');
  if (order.charge && chargeFrom && chargeList) {
    useCardPlay(ctx, chargeFrom, shooter.code);
    payCardCost(ctx, order.charge, shooter);
    takeCard(chargeList, order.charge, 'Этой карты нет на руке');
    discard(ctx, order.charge);
  }
  if (paid > 0) pay(ctx, shooter.side, paid, 'card');

  // The first Volley after surfacing: +1 and no Reactions (14.8).
  const surfaced = shooter.surfaced ? data.rules.surfaceBonus : 0;
  shooter.surfaced = false;
  const v: VolleyState = {
    shooter: shooter.code,
    target: targets[0],
    rest: targets.slice(1),
    both: !!fx.both,
    charge: order.charge ?? null,
    chargeFrom,
    fx,
    fromPlan,
    paid,
    chargeCancelled: false,
    guns: shooter.tracks.guns,
    diagonal: false,
    seaNoDiag: false,
    joint: false,
    storm: 0,
    clear: 0,
    surfaced,
    reduceAll: [],
    ifFire: false,
    ifDamaged: false,
    adjust: [],
    track: fx.track ?? params.defaultTrack,
    noReact: !!fx.no_react || surfaced > 0,
    cancelled: false,
    crewCancelled: false,
    heart: !!order.heart,
  };
  s.volley = v;
  aim(ctx, v, targets[0]);
  pushSteps(s, ...VOLLEY_STEPS);
}

/**
 * Targets of a Volley: an enemy afloat and not under water (10.1, 10.4); not on the diagonal in «Туман».
 * «Залп с обоих бортов» hits every such enemy, the chosen one first; in «Туман» only the one opposite (18.11, Q41).
 */
function volleyTargets(ctx: Ctx, shooter: ShipState, target: string, fx: Fx): string[] {
  const t = getShip(ctx.s, target);
  if (t.side === shooter.side) throw new RuleError('Целью Залпа может быть только вражеский корабль');
  if (t.sunk) throw new RuleError('Этот корабль уже утонул');
  if (t.submerged) throw new RuleError('Корабль под водой нельзя выбрать целью');
  const fog = seaKey(ctx) === 'fog';
  if (fog && t.pos !== shooter.pos) throw new RuleError('Туман: Залпы по диагонали невозможны');
  if (!fx.both) return [target];
  const others = aliveShips(ctx.s, t.side).filter(
    (x) => x.code !== target && !x.submerged && !(fog && x.pos !== shooter.pos),
  );
  return [target, ...others.map((x) => x.code)];
}

/** Fixes everything that depends on the target when the Volley (or its next part) is declared (10.5–10.7). */
function aim(ctx: Ctx, v: VolleyState, code: string): void {
  const { s, data } = ctx;
  const shooter = getShip(s, v.shooter);
  const target = getShip(s, code);
  const key = seaKey(ctx);
  v.target = code;
  v.diagonal = shooter.pos !== target.pos;
  v.seaNoDiag = key === 'maelstrom';
  v.storm = key === 'storm' ? data.rules.seaStorm : 0;
  v.clear = key === 'clear' && !v.diagonal ? data.rules.seaClear : 0;
  v.ifFire = target.fires > 0;
  v.ifDamaged = s.turn.damaged.includes(code);
  v.reduceAll = [...s.turn.reduceAll];
  v.adjust = [];
  v.cancelled = false;
  v.crewCancelled = false;
  setJoint(ctx, v);
  ctx.events.push({
    type: 'volley',
    ship: v.shooter,
    target: code,
    charge: v.charge,
    chargeFrom: v.chargeFrom,
    diagonal: v.diagonal,
    joint: v.joint,
    damage: volleyDamage(ctx, v),
    track: v.track,
  });
}

/**
 * Joint volley: +1 once a turn when the second ship fires at the ship that actually took the team's first Volley
 * (10.7, Q9). «Залп с обоих бортов» neither gets it nor sets the first target (18.11).
 */
function setJoint(ctx: Ctx, v: VolleyState): void {
  const { turn } = ctx.s;
  v.joint = !v.both && !turn.jointUsed && turn.firstTarget === v.target && turn.firstShooter !== v.shooter;
  if (v.joint) turn.jointUsed = true;
}

/** The addends of the Volley's damage, e.g. Пушки 3, диагональ −1, Ядра +1 (10.5). */
export function volleyTerms(ctx: Ctx, v: VolleyState): Term[] {
  const { data } = ctx;
  const params = shipData(data, v.shooter);
  const fx: Fx = v.chargeCancelled ? {} : v.fx;
  const name = v.charge ? cardByCode(data, v.charge).name : '';
  const terms: Term[] = [{ what: 'Пушки', n: v.guns }];
  // Both sides of «Залп с обоих бортов» ignore the diagonal (18.11); some cards and «Мальстрём» remove the penalty (10.6).
  if (v.diagonal && !v.both && !fx.no_diag && !v.seaNoDiag) {
    const n = 'fixed' in params.diagDamage ? params.diagDamage.fixed - v.guns : params.diagDamage.offset;
    terms.push({ what: 'диагональ', n });
  }
  if (fx.dmg) terms.push({ what: name, n: fx.dmg });
  if (fx.paid && v.paid) terms.push({ what: 'доплата Порохом', n: v.paid });
  if (fx.if_fire && v.ifFire) terms.push({ what: name, n: fx.if_fire });
  if (fx.if_damaged && v.ifDamaged) terms.push({ what: name, n: fx.if_damaged });
  if (v.joint) terms.push({ what: 'совместный залп', n: data.rules.jointBonus });
  if (v.storm) terms.push({ what: 'Буря', n: -v.storm });
  if (v.clear) terms.push({ what: 'Ясное небо', n: v.clear });
  if (v.surfaced) terms.push({ what: 'всплытие', n: v.surfaced });
  terms.push(...v.reduceAll, ...v.adjust);
  return terms;
}

/** Damage of the Volley: the sum of its terms, never below 0 (10.5). */
export function volleyDamage(ctx: Ctx, v: VolleyState): number {
  return Math.max(0, volleyTerms(ctx, v).reduce((sum, t) => sum + t.n, 0));
}

/**
 * «Всё по плану»: the Charge is cancelled — no bonus, no Track change, no Fire, the Volley hits the Hull (18.3).
 * «Залп с обоих бортов» becomes a plain Volley at the current target; its other part does not fire (Q42).
 */
export function cancelCharge(ctx: Ctx, v: VolleyState): void {
  v.chargeCancelled = true;
  v.track = shipData(ctx.data, v.shooter).defaultTrack;
  if (v.both) {
    v.both = false;
    v.rest = [];
    setJoint(ctx, v);
  }
}

export function volleyStep(ctx: Ctx, step: Step): void {
  const { s } = ctx;
  const v = s.volley;
  if (!v) return;
  switch (step.k) {
    case 'volleyHit': {
      if (v.cancelled) {
        ctx.events.push({ type: 'volleyCancelled', ship: v.shooter, target: v.target });
        return;
      }
      if (!v.both && s.turn.firstTarget === null) {
        s.turn.firstTarget = v.target;
        s.turn.firstShooter = v.shooter;
      }
      // «Зомби-офицеры», «Морская пехота»: no Crew damage, together with what would go to the Hull (11.6).
      const damage = v.crewCancelled && v.track === 'crew' ? 0 : volleyDamage(ctx, v);
      ctx.events.push({ type: 'hit', ship: v.shooter, target: v.target, damage, track: v.track, terms: volleyTerms(ctx, v) });
      dealDamage(ctx, v.target, v.track, damage, v.shooter);
      return;
    }
    case 'volleyFire':
      // A Fire goes on the ship actually hit, even with damage 0; not when the Volley or the Charge is cancelled (18.13).
      if (v.fx.fire && !v.cancelled && !v.chargeCancelled) addFire(ctx, v.target, v.fx.fire);
      return;
    case 'volleyEnd': {
      let next: string | undefined;
      while ((next = v.rest.shift())) {
        const t = getShip(s, next);
        if (!t.sunk && !t.submerged) break;
      }
      if (next) {
        aim(ctx, v, next);
        pushSteps(s, ...VOLLEY_STEPS);
      } else {
        s.volley = null;
      }
      return;
    }
  }
}
