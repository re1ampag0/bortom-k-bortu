// Orders and Repairs (RULES.md 9, 18) and the resolution of every card on the table, Legends included.
// Order: checks → card play (Crew limit, «Кукла вуду») → cost → Reactions «на карту» if the card is against the enemy
// team (9.7, 12.2) → the effect, operation by operation → the card goes to its owner's discard, or to the hand of the
// seat that played «Ловкость рук» (18.4), or out of the game for a Legend (15.1).
// A part of a card that cannot be done is skipped; a card none of whose parts can be done cannot be played (9.9).
import { addFire, addPowder, losePowder, restore } from './damage';
import { swapPlaces } from './sea';
import {
  ABILITY,
  RuleError,
  aliveShips,
  allyOf,
  cardByCode,
  getShip,
  hasAbility,
  namedShip,
  otherSide,
  ownerOf,
  planFx,
  pushSteps,
  requirePending,
  seaKey,
  seatShip,
  seatsOf,
  shipData,
  startValue,
  takeCard,
  type CardParams,
  type CardResolution,
  type ChoiceWhat,
  type Ctx,
  type GameState,
  type ShipState,
  type Step,
} from './state';
import { discard, drawCards, findCard, payCardCost, regroupRefusal, requireSeat, useCardPlay } from './turn';
import type { GameData, Op, Track } from './types';
import { volley } from './volley';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
/** Order of the tracks when a player does not split «N клеток на любых шкалах» himself (as sim.py repairs). */
const REPAIR_ORDER: Track[] = ['guns', 'hull', 'crew', 'sails'];

/** Operations that choose an enemy ship («любой вражеский корабль», «выберите вражеский корабль»). */
const SHIP_TARGET = new Set(['fire', 'voodoo', 'parley', 'no_repair', 'mark', 'bottle']);
/** Operations that choose an enemy player: a seat with its hand (1.4, Q45). */
const SEAT_TARGET = new Set(['steal_random', 'kill_reaction', 'dice']);
/** Operations against the whole enemy team. */
const TEAM_WIDE = new Set(['rob', 'no_react_team', 'discard_enemy_each']);

export type TargetKind = 'ship' | 'seat' | 'opposite' | null;

export function targetKind(ops: Op[]): TargetKind {
  for (const op of ops) {
    if ((op[0] === 'dmg' && op[1] === 'any') || SHIP_TARGET.has(op[0])) return 'ship';
    if (SEAT_TARGET.has(op[0])) return 'seat';
    if (op[0] === 'dmg' && op[1] === 'opposite') return 'opposite';
  }
  return null;
}

/** Enemy ships a card can hit or choose: afloat and not under water (14.8, Q14). */
export function enemyTargets(s: GameState, ship: ShipState): ShipState[] {
  return aliveShips(s, otherSide(ship.side)).filter((x) => !x.submerged);
}

/** The ship of the seat's ally, or null when it sank. For a captain it is the ship the captain is on. */
function allyShip(s: GameState, seat: string): ShipState | null {
  const ally = allyOf(s, seat);
  return ally.sunk ? null : ally;
}

/** The team's Flying Dutchman afloat: the keeper of the Souls (6.3, Q39). */
function soulKeeper(ctx: Ctx, ship: ShipState): ShipState | null {
  return aliveShips(ctx.s, ship.side).find((x) => shipData(ctx.data, x.code).souls !== undefined) ?? null;
}

const missing = (data: GameData, ship: ShipState | null, track: Track) =>
  ship && !ship.sunk ? startValue(data, ship.code, track) - ship.tracks[track] : 0;
const missingAll = (data: GameData, ship: ShipState | null) => TRACKS.reduce((n, t) => n + missing(data, ship, t), 0);

/** Plays an Order or a Repair from the hand or a Plan (7.4, 9.1). */
export function playCard(ctx: Ctx, seat: string, card: string, params: CardParams = {}): void {
  const { s, data } = ctx;
  requireSeat(ctx, seat);
  const { list, fromPlan } = findCard(ctx, seat, card);
  const c = cardByCode(data, card);
  if (c.type === 'ЗАРЯД') throw new RuleError('Заряд играется только вместе с Залпом своего корабля');
  if (c.type === 'РЕАКЦИЯ') throw new RuleError('Реакцию можно сыграть только в ход противника');
  const ship = seatShip(s, seat)!;
  // «Блокада»: the ship itself plays no Repair; the ally may repair it (18.10, Q21).
  if (c.type === 'РЕМОНТ' && ship.blockaded) throw new RuleError('Корабль под «Блокадой» не может разыгрывать Ремонт');

  const ops = planFx(c.fx, fromPlan).ops ?? [];
  const res: CardResolution = {
    card,
    seat,
    ship: ship.code,
    targets: [],
    target: null,
    crew: ops.some((op) => op[0] === 'dmg' && op[2] === 'crew'),
    cancelled: false,
    crewCancelled: false,
    legend: false,
    fromPlan,
    params,
    stolenBy: null,
    lost: false,
  };
  // Limit and cost first; the action is undone as a whole if a later check fails (applyAction works on a copy).
  const voodoo = useCardPlay(ctx, seat, ship.code);
  payCardCost(ctx, card, ship);
  takeCard(list, card, 'Этой карты нет на руке');
  res.target = chooseTarget(ctx, ops, ship, params.target);
  checkParams(ctx, res, ops);
  if (!ops.some((op) => doable(ctx, res, op))) throw new RuleError(`«${c.name}» сейчас ничего не сделает`);
  const against = againstTeam(ctx, res, ops);

  ctx.events.push({ type: 'cardPlayed', seat, ship: ship.code, card });
  s.card = res;
  const window: Step[] = against ? [{ k: 'window', window: 'before', subject: 'card' }] : [];
  pushSteps(s, ...paidSteps(voodoo), ...window, { k: 'cardEffect' }, { k: 'cardEnd' });
}

/**
 * The damage of «Кукла вуду» is a payment for playing the card: if the ship did not survive it, the card has no
 * effect (18.19, Q47, as Q33). When «Джек ускользает» saves the Pearl, the card acts.
 */
export function paidSteps(voodoo: Step[]): Step[] {
  return voodoo.length > 0 ? [...voodoo, { k: 'cardPaid' }] : [];
}

/** The chosen enemy ship or seat; the ship opposite for «напротив» (10.4). Null when the card has nothing to choose. */
function chooseTarget(ctx: Ctx, ops: Op[], ship: ShipState, target: string | undefined): string | null {
  const { s } = ctx;
  const kind = targetKind(ops);
  const volleyOp = ops.some((op) => op[0] === 'extra_volley_free');
  if (kind === 'opposite') {
    return enemyTargets(s, ship).find((x) => x.pos === ship.pos)?.code ?? null;
  }
  if (kind === 'seat') {
    const seats = seatsOf(s, otherSide(ship.side)).map((x) => x.code);
    if (target === undefined) throw new RuleError('Выберите игрока-противника');
    if (!seats.includes(target)) throw new RuleError('Выбрать можно только игрока-противника');
    return target;
  }
  if (kind === 'ship' || volleyOp) {
    const enemies = enemyTargets(s, ship);
    if (target === undefined) {
      if (enemies.length > 0) throw new RuleError('Выберите вражеский корабль');
      return null;
    }
    const t = getShip(s, target);
    if (t.side === ship.side || t.sunk) throw new RuleError('Целью может быть только вражеский корабль на плаву');
    if (t.submerged) throw new RuleError('Корабль под водой нельзя выбрать целью');
    return target;
  }
  return null;
}

/** Checks the player's choices: the ship to repair, the split of cells, Souls, Regroup. */
function checkParams(ctx: Ctx, res: CardResolution, ops: Op[]): void {
  const { s } = ctx;
  const { params } = res;
  const ship = getShip(s, res.ship);
  let cells = 0;
  for (const op of ops) {
    if (op[0] === 'repair_self' || op[0] === 'repair_ally') cells = Number(op[1]);
    if (op[0] === 'repair_track_any' && params.ship !== undefined) {
      const ally = allyShip(s, res.seat);
      if (params.ship !== ship.code && params.ship !== ally?.code) {
        throw new RuleError('Восстановить можно свой корабль или корабль союзника на плаву');
      }
    }
    if (op[0] === 'souls_repair') {
      const keeper = soulKeeper(ctx, ship);
      const souls = params.souls ?? 0;
      if (params.souls !== undefined && (!Number.isInteger(souls) || souls < 0 || souls > (keeper?.souls ?? 0))) {
        throw new RuleError(`Потратить можно от 0 до ${keeper?.souls ?? 0} Душ`);
      }
      cells = 2 * (params.souls ?? keeper?.souls ?? 0);
    }
    if (op[0] === 'regroup_free' && params.regroup) {
      const refusal = regroupRefusal(ctx, ship.side);
      if (refusal) throw new RuleError(refusal);
    }
    if (op[0] === 'extra_volley_free') checkExtraVolley(ctx, res);
  }
  if (params.repair) {
    let sum = 0;
    for (const [track, n] of Object.entries(params.repair)) {
      if (!TRACKS.includes(track as Track)) throw new RuleError(`Нет шкалы «${track}»`);
      if (!Number.isInteger(n) || n! < 0) throw new RuleError('Число клеток — целое, не меньше 0');
      sum += n!;
    }
    if (sum > cells) throw new RuleError(`Восстановить можно не больше ${cells} клеток`);
  }
}

/** «Зомби у пушек», «Всплытие»: the named ship must be able to fire at the chosen target (10.1, 18.15, Q43). */
function checkExtraVolley(ctx: Ctx, res: CardResolution): void {
  const { s } = ctx;
  const shooter = getShip(s, namedShip(ctx, res.card, res.ship));
  if (!res.target) return;
  const why =
    shooter.submerged || s.turn.dived.includes(shooter.code)
      ? 'под водой'
      : shooter.parley
        ? 'не может давать Залпы: «Право на переговоры»'
        : shooter.tracks.guns <= 0
          ? 'с Пушками 0 не стреляет'
          : seaKey(ctx) === 'fog' && getShip(s, res.target).pos !== shooter.pos
            ? 'не стреляет по диагонали в Туман'
            : null;
  if (why) throw new RuleError(`${shipData(ctx.data, shooter.code).name} ${why}`);
}

/** Whether a part of the card can be done now (9.9). */
function doable(ctx: Ctx, res: CardResolution, op: Op): boolean {
  const { s, data } = ctx;
  const ship = getShip(s, res.ship);
  const seat = getShip(s, res.seat);
  const enemySeats = seatsOf(s, otherSide(ship.side));
  const target = res.target ? getShip(s, res.target) : null;
  const n = Number(op[op.length - 1]);
  switch (op[0]) {
    case 'draw':
    case 'ally_draw':
    case 'powder':
    case 'no_react_team':
    case 'team_volley_bonus':
    case 'no_diag_turn':
    case 'extra_plays':
    case 'lose_crew':
      return true;
    case 'compass':
      return seat.deck.length + seat.discard.length > 0;
    case 'sea_look':
      return !!s.sea && s.sea.deck.length > 0;
    case 'to_plan':
    case 'pass':
      return false;
    case 'rob':
      return s.teams[otherSide(ship.side)].powder > 0;
    case 'soul': {
      const keeper = soulKeeper(ctx, ship);
      return !!keeper && keeper.souls < (shipData(data, keeper.code).souls ?? 0);
    }
    case 'dmg':
      return op[1] === 'all' ? enemyTargets(s, ship).length > 0 : target !== null;
    case 'bottle':
      return target !== null && target.tracks.hull <= n;
    case 'fire':
    case 'voodoo':
    case 'parley':
    case 'no_repair':
    case 'mark':
    case 'no_react':
    case 'kill_reaction':
      return target !== null;
    case 'regroup_free':
      return !!res.params.regroup;
    case 'ally_extra_plays':
      return allyShip(s, res.seat) !== null;
    case 'steal_random':
      return target !== null && target.hand.length > 0;
    case 'dice':
      return target !== null && target.hand.length > 0 && seat.hand.length > 0;
    case 'discard_enemy_each':
      return enemySeats.some((x) => x.hand.length > 0);
    case 'repair_self':
      return missingAll(data, ship) > 0;
    case 'repair_track':
      return missing(data, ship, op[1] as Track) > 0;
    case 'repair_named':
      return missing(data, getShip(s, namedShip(ctx, res.card, ship.code)), op[1] as Track) > 0;
    case 'repair_track_any':
      return missing(data, repairChoice(ctx, res, op[1] as Track), op[1] as Track) > 0;
    case 'repair_ally':
      return missingAll(data, allyShip(s, res.seat)) > 0;
    case 'repair_crew_both':
      return missing(data, ship, 'crew') + missing(data, allyShip(s, res.seat), 'crew') > 0;
    case 'souls_repair': {
      const keeper = soulKeeper(ctx, ship);
      return !!keeper && keeper.souls > 0 && missingAll(data, getShip(s, namedShip(ctx, res.card, ship.code))) > 0;
    }
    case 'extra_volley_free':
      return target !== null;
    default:
      return false;
  }
}

/** Whether the card is against the enemy team (9.7, Q19); fills the ships Reactions see as its targets. */
function againstTeam(ctx: Ctx, res: CardResolution, ops: Op[]): boolean {
  const { s } = ctx;
  const ship = getShip(s, res.ship);
  const kind = targetKind(ops);
  if (kind && res.target) {
    res.targets = [res.target];
    return true;
  }
  if (ops.some((op) => op[0] === 'dmg' && op[1] === 'all')) {
    res.targets = enemyTargets(s, ship).map((x) => x.code);
    return res.targets.length > 0;
  }
  if (ops.some((op) => TEAM_WIDE.has(op[0]))) {
    res.targets = seatsOf(s, otherSide(ship.side)).map((x) => x.code);
    return true;
  }
  return false;
}

/** The ship «своему кораблю или кораблю союзника» repairs: the player's choice, by default the own ship. */
function repairChoice(ctx: Ctx, res: CardResolution, track: Track): ShipState | null {
  const { s, data } = ctx;
  if (res.params.ship) return getShip(s, res.params.ship);
  const own = getShip(s, res.ship);
  const ally = allyShip(s, res.seat);
  return missing(data, own, track) > 0 || !ally ? own : ally;
}

/** Restores n cells split by the player, or in REPAIR_ORDER (11.3, 11.4). */
function repairCells(ctx: Ctx, ship: ShipState | null, n: number, split?: Partial<Record<Track, number>>): void {
  if (!ship || ship.sunk) return;
  if (split) {
    for (const track of TRACKS) if (split[track]) restore(ctx, ship.code, track, split[track]!);
    return;
  }
  let left = n;
  for (const track of REPAIR_ORDER) left -= restore(ctx, ship.code, track, left);
}

export function cardStep(ctx: Ctx, step: Step): void {
  const { s } = ctx;
  const c = s.card;
  if (!c) return;
  if (step.k === 'cardEnd') {
    endCard(ctx, c);
    return;
  }
  if (step.k === 'cardPaid') {
    if (getShip(s, c.ship).sunk) {
      c.lost = true;
      ctx.events.push({ type: 'cardLost', card: c.card });
    }
    return;
  }
  if (c.lost) return;
  if (step.k === 'cardEffect') {
    if (c.cancelled) {
      ctx.events.push({ type: 'cardCancelled', card: c.card });
      return;
    }
    const ops = planFx(cardByCode(ctx.data, c.card).fx, c.fromPlan).ops ?? [];
    pushSteps(s, ...ops.map((_, i) => ({ k: 'cardOp', i, same: true }) as Step));
    return;
  }
  if (step.k === 'cardOp') {
    const op = (planFx(cardByCode(ctx.data, c.card).fx, c.fromPlan).ops ?? [])[step.i];
    if (op) cardOp(ctx, c, op);
  }
}

function endCard(ctx: Ctx, c: CardResolution): void {
  ctx.s.card = null;
  if (c.legend) {
    ctx.events.push({ type: 'cardResolved', card: c.card, to: 'gone', seat: null });
  } else if (c.stolenBy) {
    getShip(ctx.s, c.stolenBy).hand.push(c.card);
    ctx.events.push({ type: 'cardResolved', card: c.card, to: 'stolen', seat: c.stolenBy });
  } else {
    discard(ctx, c.card);
    ctx.events.push({ type: 'cardResolved', card: c.card, to: 'discard', seat: ownerOf(ctx.data, c.card) });
  }
}

/** A target chosen when the card was played, if it can still be hit: afloat and not under water. */
function liveTarget(s: GameState, code: string | null): ShipState | null {
  const t = code ? getShip(s, code) : null;
  return t && !t.sunk && !t.submerged ? t : null;
}

/** One operation of the card. A step deals damage at most once, so damage is queued as separate steps. */
function cardOp(ctx: Ctx, c: CardResolution, op: Op): void {
  const { s, data } = ctx;
  const ship = getShip(s, c.ship);
  const side = ship.side;
  const enemy = otherSide(side);
  const n = Number(op[op.length - 1]);
  const target = liveTarget(s, c.target);
  const later: Step[] = [];
  switch (op[0]) {
    case 'draw':
      drawCards(ctx, c.seat, n);
      break;
    case 'ally_draw':
      drawCards(ctx, allyOf(s, c.seat).code, n);
      break;
    case 'powder':
      addPowder(ctx, side, n, 'card');
      break;
    case 'rob': {
      const amount = Math.min(n, s.teams[enemy].powder);
      losePowder(ctx, enemy, amount);
      if (amount > 0) addPowder(ctx, side, amount, 'card');
      break;
    }
    case 'soul': {
      const keeper = soulKeeper(ctx, ship);
      if (!keeper) break;
      const amount = Math.min(n, (shipData(data, keeper.code).souls ?? 0) - keeper.souls);
      if (amount <= 0) break;
      keeper.souls += amount;
      ctx.events.push({ type: 'soulsGained', ship: keeper.code, amount });
      break;
    }
    case 'dmg': {
      const [, scope, track, amount] = op as [string, string, Track, number];
      // «Зомби-офицеры», «Морская пехота»: all Crew damage of the card is cancelled (11.6).
      if (track === 'crew' && c.crewCancelled) break;
      const ships = scope === 'all' ? enemyTargets(s, ship) : target ? [target] : [];
      for (const x of ships) later.push({ k: 'damage', ship: x.code, track, n: amount, src: c.ship, same: true });
      break;
    }
    case 'bottle':
      if (target && target.tracks.hull <= n) later.push({ k: 'sink', ship: target.code, same: true });
      break;
    case 'fire':
      if (target) addFire(ctx, target.code, n);
      break;
    case 'voodoo':
      if (target) {
        target.voodoo = c.ship;
        ctx.events.push({ type: 'flagSet', ship: target.code, flag: 'voodoo' });
      }
      break;
    case 'parley':
      if (target) {
        target.parley = true;
        ctx.events.push({ type: 'flagSet', ship: target.code, flag: 'parley' });
      }
      break;
    case 'no_repair':
      if (target) {
        target.blockaded = true;
        ctx.events.push({ type: 'flagSet', ship: target.code, flag: 'blockade' });
      }
      break;
    case 'mark':
      if (target) {
        s.turn.marks[target.code] = (s.turn.marks[target.code] ?? 0) + n;
        ctx.events.push({ type: 'flagSet', ship: target.code, flag: 'mark' });
      }
      break;
    case 'no_react':
      if (target && !s.turn.noReact.includes(target.code)) {
        s.turn.noReact.push(target.code);
        ctx.events.push({ type: 'flagSet', ship: target.code, flag: 'noReact' });
      }
      break;
    case 'no_react_team':
      s.turn.noReactTeam = true;
      ctx.events.push({ type: 'turnFlag', side, flag: 'noReactTeam', n: 1 });
      break;
    case 'team_volley_bonus':
      s.turn.volleyBonus += n;
      ctx.events.push({ type: 'turnFlag', side, flag: 'volleyBonus', n });
      break;
    case 'no_diag_turn':
      s.turn.noDiag = true;
      ctx.events.push({ type: 'turnFlag', side, flag: 'noDiag', n: 1 });
      break;
    case 'regroup_free':
      // «Строй линии»: the team's Regroup of this turn, free (18.16, Q34, Q46).
      if (c.params.regroup && !regroupRefusal(ctx, side)) {
        s.turn.regrouped = true;
        ctx.events.push({ type: 'regrouped', side, ships: aliveShips(s, side).map((x) => x.code) });
        swapPlaces(ctx, side, 'regroup');
      }
      break;
    case 'extra_plays':
      raiseLimit(ctx, ship, n);
      break;
    case 'ally_extra_plays':
      raiseLimit(ctx, allyShip(s, c.seat), n);
      break;
    case 'lose_crew':
      later.push({ k: 'damage', ship: ship.code, track: 'crew', n, src: null, same: true });
      break;
    case 'repair_self':
      repairCells(ctx, ship, n, c.params.repair);
      break;
    case 'repair_ally':
      repairCells(ctx, allyShip(s, c.seat), n, c.params.repair);
      break;
    case 'repair_track':
      restore(ctx, ship.code, op[1] as Track, n);
      break;
    case 'repair_named':
      restore(ctx, namedShip(ctx, c.card, ship.code), op[1] as Track, n);
      break;
    case 'repair_track_any': {
      const x = repairChoice(ctx, c, op[1] as Track);
      if (x) restore(ctx, x.code, op[1] as Track, n);
      break;
    }
    case 'repair_crew_both':
      for (const x of new Set([ship, allyShip(s, c.seat)])) if (x) restore(ctx, x.code, 'crew', n);
      break;
    case 'souls_repair': {
      // «Сердце бьётся»: 2 cells of the Dutchman for each Soul spent.
      const keeper = soulKeeper(ctx, ship);
      const named = getShip(s, namedShip(ctx, c.card, ship.code));
      if (!keeper) break;
      const souls = c.params.souls ?? Math.min(keeper.souls, Math.ceil(missingAll(data, named) / 2));
      if (souls <= 0) break;
      keeper.souls -= souls;
      ctx.events.push({ type: 'soulsSpent', ship: keeper.code, amount: souls });
      repairCells(ctx, named, 2 * souls, c.params.repair);
      break;
    }
    case 'extra_volley_free': {
      // «Зомби у пушек», «Всплытие»: the named ship fires at once; no Powder, no Charge; with a bonus — no Reactions.
      if (!target) break;
      const bonus = op.length > 1 ? Number(op[1]) : 0;
      try {
        volley(ctx, {
          ship: namedShip(ctx, c.card, ship.code),
          target: target.code,
          free: { card: c.card, bonus, noReact: bonus > 0 },
        });
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
      }
      break;
    }
    case 'steal_random': {
      const from = c.target ? getShip(s, c.target) : null;
      if (!from || from.hand.length === 0) break;
      const [card] = from.hand.splice(ctx.rng.int(from.hand.length), 1);
      getShip(s, c.seat).hand.push(card);
      ctx.events.push({ type: 'stolen', seat: c.seat, from: from.code, card });
      break;
    }
    case 'kill_reaction': {
      // «Шпион Мерсер»: look at the hand; the enemy discards a Reaction of your choice, or you draw 1 card.
      const from = c.target ? getShip(s, c.target) : null;
      if (!from) break;
      ctx.events.push({ type: 'shown', seat: from.code, to: c.seat });
      const reactions = from.hand.filter((card) => cardByCode(data, card).type === 'РЕАКЦИЯ');
      if (reactions.length === 0) drawCards(ctx, c.seat, 1);
      else ask(ctx, c, 'spy', [c.seat], reactions);
      break;
    }
    case 'discard_enemy_each': {
      const seats = seatsOf(s, enemy).filter((x) => x.hand.length > 0).map((x) => x.code);
      if (seats.length > 0) ask(ctx, c, 'bell', seats, []);
      break;
    }
    case 'dice': {
      const other = c.target ? getShip(s, c.target) : null;
      if (other && other.hand.length > 0 && getShip(s, c.seat).hand.length > 0) ask(ctx, c, 'dice', [c.seat, other.code], []);
      break;
    }
    case 'pass':
      if (getShip(s, c.seat).hand.length > 0) ask(ctx, c, 'pass', [c.seat], []);
      break;
    case 'to_plan':
      if (planHolder(ctx, c) && getShip(s, c.seat).hand.length > 0) ask(ctx, c, 'toPlan', [c.seat], []);
      break;
    case 'compass': {
      const top = peekDeck(ctx, c.seat, n);
      if (top.length > 0) ask(ctx, c, 'compass', [c.seat], top);
      break;
    }
    case 'sea_look': {
      const top = s.sea ? s.sea.deck.slice(0, n) : [];
      if (top.length === 0) break;
      ctx.events.push({ type: 'seaLooked', seat: c.seat });
      if (top.length > 1) ask(ctx, c, 'tia', [c.seat], top);
      break;
    }
  }
  pushSteps(s, ...later);
}

function raiseLimit(ctx: Ctx, ship: ShipState | null, n: number): void {
  if (!ship || ship.sunk || ctx.s.turn.limit[ship.code] === undefined) return;
  ctx.s.turn.limit[ship.code] += n;
  ctx.events.push({ type: 'limitRaised', ship: ship.code, n });
}

/**
 * The Black Pearl whose Plans the card fills: only when the card is played for the Pearl afloat (Q43а).
 * Null when another ship plays it (the card was passed or stolen) or the Pearl sank.
 */
function planHolder(ctx: Ctx, c: CardResolution): ShipState | null {
  const ship = getShip(ctx.s, c.ship);
  return hasAbility(ctx.data, ship, ABILITY.madPlan) ? ship : null;
}

/** Top n cards of a seat's deck, making a new deck from the discard as drawing does (9.3). The cards stay in the deck. */
function peekDeck(ctx: Ctx, seat: string, n: number): string[] {
  const ship = getShip(ctx.s, seat);
  if (ship.deck.length < n && ship.discard.length > 0) {
    ship.deck.push(...ctx.rng.shuffle(ship.discard));
    ship.discard = [];
    ctx.events.push({ type: 'deckReshuffled', seat });
  }
  return ship.deck.slice(0, n);
}

function ask(ctx: Ctx, c: CardResolution, what: ChoiceWhat, waiting: string[], options: string[]): void {
  ctx.s.pending = { kind: 'choice', what, seat: c.seat, waiting, options, picks: {} };
}

/** What a seat chooses from now and how many cards: for bots, tests and the interface. */
export function choiceFor(s: GameState, seat: string): { from: string[]; count: number } | null {
  const p = s.pending;
  if (p?.kind !== 'choice' || !p.waiting.includes(seat)) return null;
  switch (p.what) {
    case 'compass':
      return { from: p.options, count: Math.min(2, p.options.length) };
    case 'tia':
      return { from: p.options, count: p.options.length };
    case 'spy':
      return { from: p.options, count: 1 };
    default:
      return { from: s.ships[seat].hand, count: 1 };
  }
}

/** An answer to a `choice` decision. */
export function choose(ctx: Ctx, seat: string, cards: string[]): void {
  const { s } = ctx;
  const p = requirePending(s, 'choice');
  const allowed = choiceFor(s, seat);
  if (!allowed) throw new RuleError('Этому игроку сейчас нечего выбирать');
  if (cards.length !== allowed.count || new Set(cards).size !== cards.length) {
    throw new RuleError(`Выберите ${allowed.count} карт(ы)`);
  }
  if (!cards.every((card) => allowed.from.includes(card))) throw new RuleError('Эту карту выбрать нельзя');
  const c = s.card!;
  const holder = getShip(s, seat);
  switch (p.what) {
    case 'compass': {
      // One to the hand, one to a Plan (to the hand when there is no Plan for it, 9.8, Q43а), the rest to the discard.
      for (const card of p.options) takeCard(holder.deck, card, 'Карты нет в колоде');
      holder.hand.push(cards[0]);
      if (cards[1]) toPlanOrHand(ctx, c, cards[1], holder);
      for (const card of p.options.filter((x) => !cards.includes(x))) discard(ctx, card);
      break;
    }
    case 'toPlan': {
      takeCard(holder.hand, cards[0], 'Этой карты нет на руке');
      toPlanOrHand(ctx, c, cards[0], holder);
      break;
    }
    case 'pass': {
      // «Анжелика»: not the free action «Передать карту» (18.7).
      takeCard(holder.hand, cards[0], 'Этой карты нет на руке');
      const ally = allyOf(s, seat);
      ally.hand.push(cards[0]);
      ctx.events.push({ type: 'passed', seat, to: ally.code, card: cards[0] });
      break;
    }
    case 'spy': {
      const from = getShip(s, c.target!);
      takeCard(from.hand, cards[0], 'Этой карты нет на руке');
      discard(ctx, cards[0]);
      ctx.events.push({ type: 'discarded', seat: from.code, card: cards[0] });
      break;
    }
    case 'tia': {
      const sea = s.sea!;
      sea.deck = [...cards, ...sea.deck.slice(cards.length)];
      break;
    }
    case 'bell':
      takeCard(holder.hand, cards[0], 'Этой карты нет на руке');
      discard(ctx, cards[0]);
      ctx.events.push({ type: 'discarded', seat, card: cards[0] });
      break;
    case 'dice':
      p.picks[seat] = cards[0];
      break;
  }
  p.waiting = p.waiting.filter((x) => x !== seat);
  if (p.waiting.length > 0) return;
  if (p.what === 'dice') resolveDice(ctx, [c.seat, c.target!], p.picks);
  s.pending = null;
}

function toPlanOrHand(ctx: Ctx, c: CardResolution, card: string, holder: ShipState): void {
  const pearl = planHolder(ctx, c);
  if (pearl && pearl.plans.length < ctx.data.rules.plansMax) {
    pearl.plans.push(card);
    ctx.events.push({ type: 'planned', seat: pearl.code, count: 1 });
  } else {
    holder.hand.push(card);
  }
}

/** «Игра в кости лжеца»: the card dearer in Powder takes both; equal — both go to their owners' discards (18.8). */
function resolveDice(ctx: Ctx, [a, b]: string[], picks: Record<string, string>): void {
  const { s, data } = ctx;
  for (const seat of [a, b]) takeCard(getShip(s, seat).hand, picks[seat], 'Этой карты нет на руке');
  const costA = cardByCode(data, picks[a]).cost;
  const costB = cardByCode(data, picks[b]).cost;
  const winner = costA > costB ? a : costB > costA ? b : null;
  if (winner) getShip(s, winner).hand.push(picks[a], picks[b]);
  else for (const seat of [a, b]) discard(ctx, picks[seat]);
  ctx.events.push({ type: 'dice', cards: { ...picks }, winner });
}
