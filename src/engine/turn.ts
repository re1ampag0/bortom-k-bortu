// Round and turn order, drawing, card limits and free actions (RULES.md 4, 5, 7, 8).
import { addPowder, dealDamage, pay } from './damage';
import { seaAtOnce, swapPlaces } from './sea';
import {
  ABILITY,
  RuleError,
  aliveShips,
  allyOf,
  cardByCode,
  getShip,
  hasAbility,
  isCaptain,
  newTurn,
  ownerOf,
  pushSteps,
  seaKey,
  seatShip,
  seatsOf,
  shipData,
  shipName,
  takeCard,
  teamShips,
  type Ctx,
  type ShipState,
  type SpendReason,
  type Step,
} from './state';
import type { Side } from './types';

/** A new round: open the next sea card, then the Pirates' turn (RULES.md 4.1–4.4). */
export function startRound(ctx: Ctx): void {
  const { s, data } = ctx;
  if (s.round >= data.rules.maxRounds) {
    s.winner = 'НИЧЬЯ';
    ctx.events.push({ type: 'gameOver', winner: 'НИЧЬЯ', reason: 'rounds' });
    return;
  }
  s.round++;
  ctx.events.push({ type: 'roundStarted', round: s.round });
  pushSteps(s, { k: 'startTurn', side: 'ПИРАТЫ' });
  if (s.sea) revealSea(ctx);
}

/** The previous card goes to the discard; an empty deck is made again from all 17 cards (RULES.md 4.2, 4.3). */
function revealSea(ctx: Ctx): void {
  const sea = ctx.s.sea!;
  if (sea.current) sea.discard.push(sea.current);
  let reshuffled = false;
  if (sea.deck.length === 0) {
    sea.deck = ctx.rng.shuffle(sea.discard);
    sea.discard = [];
    reshuffled = true;
  }
  sea.current = sea.deck.shift() ?? null;
  // «Тиа Дальма»: the looked-at cards come out one by one.
  if (sea.peek) {
    if (reshuffled || sea.peek.n <= 1) delete sea.peek;
    else sea.peek.n--;
  }
  if (!sea.current) return;
  ctx.events.push({ type: 'seaRevealed', card: sea.current, reshuffled });
  seaAtOnce(ctx);
}

/**
 * Start of a team's turn: Hold → Fires → surfacing of the Dutchman → «Девятый вал» → «Мальстрём» →
 * draw → card limits (RULES.md 5.2–5.5, 7.3). Everything after the Hold is queued.
 */
export function startTurn(ctx: Ctx, side: Side): void {
  const { s, data } = ctx;
  s.active = side;
  s.turn = newTurn();
  ctx.events.push({ type: 'turnStarted', side });

  const firstTurn = s.round === 1 && side === 'ПИРАТЫ';
  addPowder(ctx, side, firstTurn ? data.econ.first_income : data.econ.income, 'hold');

  const ships = aliveShips(s, side);
  const key = seaKey(ctx);
  const steps: Step[] = ships.filter((x) => x.fires > 0).map((x) => ({ k: 'fire', ship: x.code }) as Step);
  steps.push({ k: 'surface', side });
  if (key === 'wave') {
    for (const x of ships) steps.push({ k: 'damage', ship: x.code, track: 'sails', n: data.rules.seaWave, src: null });
  }
  if (key === 'maelstrom') steps.push({ k: 'swap', side, reason: 'maelstrom' });
  steps.push({ k: 'turnReady', side });
  pushSteps(s, ...steps);
}

/** Fires: 1 damage to the Hull for each Fire, right after the Hold (RULES.md 5.3). */
export function fireStep(ctx: Ctx, code: string): void {
  const ship = getShip(ctx.s, code);
  if (ship.sunk || ship.fires === 0) return;
  ctx.events.push({ type: 'fireDamage', ship: code, fires: ship.fires });
  dealDamage(ctx, code, 'hull', ship.fires);
}

/** Draw, then fix the card limits of the turn (RULES.md 5.5, 7.3); «Флот на горизонте» adds to them. */
export function turnReady(ctx: Ctx, side: Side): void {
  const { s } = ctx;
  for (const seat of seatsOf(s, side)) drawUp(ctx, seat.code);
  const fleet = seaKey(ctx) === 'fleet' ? ctx.data.rules.seaFleet : 0;
  for (const ship of aliveShips(s, side)) {
    s.turn.limit[ship.code] = ship.tracks.crew + fleet;
    s.turn.played[ship.code] = 0;
    s.turn.volleys[ship.code] = 0;
  }
}

/** Draw up to the hand size; Plans count as cards in hand (RULES.md 5.5). */
export function drawUp(ctx: Ctx, seat: string): void {
  const ship = getShip(ctx.s, seat);
  drawCards(ctx, seat, ctx.data.rules.hand - ship.hand.length - ship.plans.length);
}

/** Draws n cards; an empty deck is made from the discard, both empty — no card (RULES.md 9.3). */
export function drawCards(ctx: Ctx, seat: string, n: number): void {
  const ship = getShip(ctx.s, seat);
  const cards: string[] = [];
  let count = 0;
  while (count < n) {
    if (ship.deck.length === 0) {
      if (ship.discard.length === 0) break;
      ship.deck = ctx.rng.shuffle(ship.discard);
      ship.discard = [];
      ctx.events.push({ type: 'deckReshuffled', seat });
    }
    const card = ship.deck.shift()!;
    ship.hand.push(card);
    cards.push(card);
    count++;
  }
  if (count > 0) ctx.events.push({ type: 'drew', seat, count, cards });
}

/** «Ход окончен». The Black Pearl may put up to 2 cards from her hand into Plans first (RULES.md 5.7, 14.1). */
export function endTurn(ctx: Ctx, side: Side, plans: string[] = []): void {
  requireActive(ctx, side);
  const { s, data } = ctx;
  if (plans.length > 0) {
    const pearl = teamShips(s, side).find((x) => hasAbility(data, x, ABILITY.madPlan));
    if (!pearl) throw new RuleError('Планы кладёт только «Чёрная жемчужина» на плаву');
    if (new Set(plans).size !== plans.length) throw new RuleError('Одна карта не может лечь в План дважды');
    if (pearl.plans.length + plans.length > data.rules.plansMax) {
      throw new RuleError(`Планов не больше ${data.rules.plansMax}`);
    }
    if (!plans.every((c) => pearl.hand.includes(c))) throw new RuleError('В План кладут карты с руки «Жемчужины»');
    for (const card of plans) takeCard(pearl.hand, card, 'Этой карты нет на руке');
    pearl.plans.push(...plans);
    ctx.events.push({ type: 'planned', seat: pearl.code, count: plans.length });
  }
  for (const ship of teamShips(s, side)) {
    ship.surfaced = false;
    // «Блокада», «Право на переговоры», «Кукла вуду» last until the end of the ship's next turn (18.10, 18.15, Q44).
    ship.blockaded = false;
    ship.parley = false;
    ship.voodoo = null;
  }
  ctx.events.push({ type: 'turnEnded', side });
  pushSteps(s, side === 'ПИРАТЫ' ? { k: 'startTurn', side: 'КОМПАНИЯ' } : { k: 'startRound' });
}

export function requireActive(ctx: Ctx, side: Side): void {
  if (ctx.s.active !== side) throw new RuleError('Сейчас ход другой команды');
}

/** A seat of the active team that still plays. Free actions are only in your own turn (RULES.md 8). */
export function requireSeat(ctx: Ctx, seat: string): ShipState {
  const ship = getShip(ctx.s, seat);
  requireActive(ctx, ship.side);
  if (!seatShip(ctx.s, seat)) throw new RuleError('Этот игрок больше не играет');
  return ship;
}

/** Puts a card into its owner's discard (RULES.md 9.3, 9.4). */
export function discard(ctx: Ctx, card: string): void {
  getShip(ctx.s, ownerOf(ctx.data, card)).discard.push(card);
}

/**
 * Uses one card play of `seat` for ship `forShip`: the ship's Crew limit, or the captain's one extra card
 * on the ally's board (RULES.md 7.1, 17.3). Returns the steps the play causes: under «Кукла вуду» the ship
 * loses 1 Crew for each card played for it, before the card acts (Q44). The caller queues them first.
 */
export function useCardPlay(ctx: Ctx, seat: string, forShip: string): Step[] {
  const { turn } = ctx.s;
  if (seat === forShip) {
    if (turn.played[forShip] >= turn.limit[forShip]) {
      throw new RuleError(`${shipName(ctx.data, forShip)} уже разыграл ${turn.limit[forShip]} карт(ы) — это лимит Команды`);
    }
    turn.played[forShip]++;
  } else {
    if (!isCaptain(ctx.s, seat) || allyOf(ctx.s, seat).code !== forShip) {
      throw new RuleError('Играть карты за чужой корабль может только капитан утонувшего корабля');
    }
    if (turn.captainPlayed.includes(seat)) throw new RuleError('Капитан уже разыграл свою карту в этот ход');
    turn.captainPlayed.push(seat);
  }
  const ship = getShip(ctx.s, forShip);
  return ship.voodoo ? [{ k: 'damage', ship: forShip, track: 'crew', n: 1, src: ship.voodoo }] : [];
}

/**
 * Pays the card's cost: Powder from the Hold (RULES.md 9.2), Souls always from the team's Flying Dutchman
 * while it is afloat — whichever ship the card is played for (6.3, Q39). A team without the Dutchman afloat
 * cannot pay Souls.
 */
export function payCardCost(ctx: Ctx, card: string, forShip: ShipState, reason: SpendReason = 'card'): void {
  const c = cardByCode(ctx.data, card);
  if (c.soul > 0) {
    const keeper = aliveShips(ctx.s, forShip.side).find((x) => shipData(ctx.data, x.code).souls !== undefined);
    if (!keeper) throw new RuleError('Заплатить Душами нельзя: в вашей команде нет «Летучего голландца» на плаву');
    if (c.soul > keeper.souls) throw new RuleError(`Не хватает Душ: нужно ${c.soul}, есть ${keeper.souls}`);
    pay(ctx, forShip.side, c.cost, reason);
    keeper.souls -= c.soul;
    ctx.events.push({ type: 'soulsSpent', ship: keeper.code, amount: c.soul });
    return;
  }
  pay(ctx, forShip.side, c.cost, reason);
}

/**
 * Where a seat holds a card: its hand or, for the Black Pearl afloat, its Plans (RULES.md 14.1).
 * Throws a RuleError if the card is in neither.
 */
export function findCard(ctx: Ctx, seat: string, card: string): { list: string[]; fromPlan: boolean } {
  const holder = getShip(ctx.s, seat);
  if (holder.hand.includes(card)) return { list: holder.hand, fromPlan: false };
  if (holder.plans.includes(card) && !holder.sunk) return { list: holder.plans, fromPlan: true };
  throw new RuleError('Этой карты нет на руке');
}

/** Sell a card: once a turn per seat, +1 Powder (RULES.md 8.1). */
export function sell(ctx: Ctx, seat: string, card: string): void {
  const holder = requireSeat(ctx, seat);
  if (ctx.s.turn.sold.includes(seat)) throw new RuleError('Продать карту можно один раз за ход');
  takeCard(holder.hand, card, 'Этой карты нет на руке');
  ctx.s.turn.sold.push(seat);
  discard(ctx, card);
  ctx.events.push({ type: 'sold', seat, card });
  addPowder(ctx, holder.side, ctx.data.rules.sellGain, 'sell');
}

/** Give a card to the ally: once a turn per seat (RULES.md 8.2). */
export function passCard(ctx: Ctx, seat: string, card: string): void {
  const holder = requireSeat(ctx, seat);
  if (ctx.s.turn.passed.includes(seat)) throw new RuleError('Передать карту можно один раз за ход');
  takeCard(holder.hand, card, 'Этой карты нет на руке');
  const ally = allyOf(ctx.s, seat);
  ally.hand.push(card);
  ctx.s.turn.passed.push(seat);
  ctx.events.push({ type: 'passed', seat, to: ally.code, card });
}

/**
 * Regroup: once a turn per team, swap the ships or move a lone ship to the empty place (RULES.md 8.3, 17.4).
 * Not when a ship has Sails 0, not in «Штиль», not with a ship under «Блокада» (18.10, Q20).
 * Free for the Pirates while the Black Pearl is afloat (14.2) and for everyone in «Попутный ветер».
 */
export function regroup(ctx: Ctx, side: Side): void {
  requireActive(ctx, side);
  const { s, data } = ctx;
  const refusal = regroupRefusal(ctx, side);
  if (refusal) throw new RuleError(refusal);
  const ships = aliveShips(s, side);
  const free =
    seaKey(ctx) === 'wind' || teamShips(s, side).some((x) => hasAbility(data, x, ABILITY.fasterThanWind));
  if (!free) pay(ctx, side, data.rules.regroupCost, 'regroup');
  s.turn.regrouped = true;
  ctx.events.push({ type: 'regrouped', side, ships: ships.map((x) => x.code) });
  swapPlaces(ctx, side, 'regroup');
}

/** Why the team cannot regroup now, or null (RULES.md 8.3, 16, 18.10, 18.16). */
export function regroupRefusal(ctx: Ctx, side: Side): string | null {
  const { s } = ctx;
  if (s.turn.regrouped) return 'Перестроение — один раз за ход';
  const ships = aliveShips(s, side);
  if (ships.some((x) => x.tracks.sails === 0)) return 'Перестроение невозможно: у корабля Паруса 0';
  if (seaKey(ctx) === 'calm') return 'Штиль: корабли не меняются местами';
  if (ships.some((x) => x.blockaded)) return 'Корабль под «Блокадой» не меняется местами';
  return null;
}

/** Put out a Fire on your own ship by discarding a card, any number of times (RULES.md 8.4). */
export function extinguish(ctx: Ctx, seat: string, card: string): void {
  const holder = requireSeat(ctx, seat);
  if (holder.sunk) throw new RuleError('Тушить можно только Пожары своего корабля');
  if (holder.fires === 0) throw new RuleError('На корабле нет Пожаров');
  takeCard(holder.hand, card, 'Этой карты нет на руке');
  discard(ctx, card);
  holder.fires--;
  ctx.events.push({ type: 'fireOut', seat, card, fires: holder.fires });
}
