// Round and turn order, drawing, card limits and free actions (RULES.md 4, 5, 7, 8).
import { addPowder, checkGameOver, dealDamage, pay } from './damage';
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
  seatShip,
  seatsOf,
  shipData,
  shipName,
  takeCard,
  teamShips,
  type Ctx,
  type ShipState,
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
  if (s.sea) revealSea(ctx);
  // Sea card effects come in stage 4; an "at once" card may end the game.
  if (checkGameOver(ctx)) return;
  startTurn(ctx, 'ПИРАТЫ');
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
  if (sea.current) ctx.events.push({ type: 'seaRevealed', card: sea.current, reshuffled });
}

/** Start of a team's turn: Hold → Fires → draw → card limits (RULES.md 5.2–5.5, 7.3). */
export function startTurn(ctx: Ctx, side: Side): void {
  const { s, data } = ctx;
  s.active = side;
  s.turn = newTurn();
  ctx.events.push({ type: 'turnStarted', side });

  const firstTurn = s.round === 1 && side === 'ПИРАТЫ';
  addPowder(ctx, side, firstTurn ? data.econ.first_income : data.econ.income, 'hold');

  for (const ship of aliveShips(s, side)) {
    if (ship.fires === 0) continue;
    ctx.events.push({ type: 'fireDamage', ship: ship.code, fires: ship.fires });
    dealDamage(ctx, ship.code, 'hull', ship.fires);
  }
  if (checkGameOver(ctx)) return;
  // Surfacing of the Dutchman, «Девятый вал» and «Мальстрём» come here in stage 4 (RULES.md 5.4).

  for (const seat of seatsOf(s, side)) drawUp(ctx, seat.code);
  for (const ship of aliveShips(s, side)) {
    s.turn.limit[ship.code] = ship.tracks.crew;
    s.turn.played[ship.code] = 0;
    s.turn.volleys[ship.code] = 0;
  }
}

/** Draw up to the hand size; Plans count as cards in hand (RULES.md 5.5). An empty deck is made from the discard (9.3). */
export function drawUp(ctx: Ctx, seat: string): void {
  const ship = getShip(ctx.s, seat);
  let count = 0;
  while (ship.hand.length + ship.plans.length < ctx.data.rules.hand) {
    if (ship.deck.length === 0) {
      if (ship.discard.length === 0) break;
      ship.deck = ctx.rng.shuffle(ship.discard);
      ship.discard = [];
      ctx.events.push({ type: 'deckReshuffled', seat });
    }
    ship.hand.push(ship.deck.shift()!);
    count++;
  }
  if (count > 0) ctx.events.push({ type: 'drew', seat, count });
}

export function endTurn(ctx: Ctx, side: Side): void {
  requireActive(ctx, side);
  // Plans of the Black Pearl and end-of-turn effects come here in stage 4 (RULES.md 5.7).
  ctx.events.push({ type: 'turnEnded', side });
  if (side === 'ПИРАТЫ') startTurn(ctx, 'КОМПАНИЯ');
  else startRound(ctx);
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
 * on the ally's board (RULES.md 7.1, 17.3).
 */
export function useCardPlay(ctx: Ctx, seat: string, forShip: string): void {
  const { turn } = ctx.s;
  if (seat === forShip) {
    if (turn.played[forShip] >= turn.limit[forShip]) {
      throw new RuleError(`${shipName(ctx.data, forShip)} уже разыграл ${turn.limit[forShip]} карт(ы) — это лимит Команды`);
    }
    turn.played[forShip]++;
    return;
  }
  if (!isCaptain(ctx.s, seat) || allyOf(ctx.s, seat).code !== forShip) {
    throw new RuleError('Играть карты за чужой корабль может только капитан утонувшего корабля');
  }
  if (turn.captainPlayed.includes(seat)) throw new RuleError('Капитан уже разыграл свою карту в этот ход');
  turn.captainPlayed.push(seat);
}

/**
 * Pays the card's cost: Powder from the Hold (RULES.md 9.2), Souls always from the team's Flying Dutchman
 * while it is afloat — whichever ship the card is played for (6.3, Q39). A team without the Dutchman afloat
 * cannot pay Souls.
 */
export function payCardCost(ctx: Ctx, card: string, forShip: ShipState): void {
  const c = cardByCode(ctx.data, card);
  if (c.soul > 0) {
    const keeper = aliveShips(ctx.s, forShip.side).find((x) => shipData(ctx.data, x.code).souls !== undefined);
    if (!keeper) throw new RuleError('Заплатить Душами нельзя: в вашей команде нет «Летучего голландца» на плаву');
    if (c.soul > keeper.souls) throw new RuleError(`Не хватает Душ: нужно ${c.soul}, есть ${keeper.souls}`);
    pay(ctx, forShip.side, c.cost, 'card');
    keeper.souls -= c.soul;
    ctx.events.push({ type: 'soulsSpent', ship: keeper.code, amount: c.soul });
    return;
  }
  pay(ctx, forShip.side, c.cost, 'card');
}

/** Plays an Order or Repair from the hand. Card effects (fx) come in stage 5. */
export function playCard(ctx: Ctx, seat: string, card: string): void {
  const holder = requireSeat(ctx, seat);
  if (!holder.hand.includes(card)) throw new RuleError('Этой карты нет на руке');
  const c = cardByCode(ctx.data, card);
  if (c.type === 'ЗАРЯД') throw new RuleError('Заряд играется только вместе с Залпом своего корабля');
  if (c.type === 'РЕАКЦИЯ') throw new RuleError('Реакцию можно сыграть только в ход противника');
  const ship = seatShip(ctx.s, seat)!;
  useCardPlay(ctx, seat, ship.code);
  payCardCost(ctx, card, ship);
  takeCard(holder.hand, card, 'Этой карты нет на руке');
  ctx.events.push({ type: 'cardPlayed', seat, ship: ship.code, card });
  discard(ctx, card);
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
 * Not when a ship has Sails 0. Free for the Pirates while the Black Pearl is afloat (14.2).
 */
export function regroup(ctx: Ctx, side: Side): void {
  requireActive(ctx, side);
  const { s, data } = ctx;
  if (s.turn.regrouped) throw new RuleError('Перестроение — один раз за ход');
  const ships = aliveShips(s, side);
  if (ships.some((x) => x.tracks.sails === 0)) throw new RuleError('Перестроение невозможно: у корабля Паруса 0');
  // «Штиль» and «Блокада» forbid it too — stage 4.
  const free = teamShips(s, side).some((x) => hasAbility(data, x, ABILITY.fasterThanWind));
  if (!free) pay(ctx, side, data.rules.regroupCost, 'regroup');
  for (const ship of ships) ship.pos = ship.pos === 0 ? 1 : 0;
  s.turn.regrouped = true;
  ctx.events.push({ type: 'regrouped', side, ships: ships.map((x) => x.code) });
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
