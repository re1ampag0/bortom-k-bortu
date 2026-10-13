// A bot playing one ship of a team whose other ship a person plays (network games, stage 8). It moves after its
// human ally pressed «Ход окончен», spends what Powder is left, and decides Reactions and choices for its own seat.
// It uses the estimates of the sim.py bot (TurnBot) in the same order of a turn, but only for its ship; the team
// bot of bot.ts is left as it is, for the simulator and the balance. Its games are not counted in any statistics.
import { choiceFor } from '../cards';
import type { Rng } from '../rng';
import { ABILITY, aliveShips, hasAbility, shipData, type Action, type GameState, type ShipState } from '../state';
import type { GameData, Side } from '../types';
import { botAnswer, minBy, maxBy, TurnBot, type BotFeedback, type BotMemory } from './bot';

/** Most actions in one turn of the ship bot: a guard against a loop. */
const MAX_ACTIONS = 150;
/** Minimum score of a Legend (sim.py Cfg.legend_thr). */
const LEGEND_THR = 4;

/** The ship bot of one seat this turn. */
export interface ShipBotRun {
  gen: Generator<Action, void, BotFeedback>;
  done: boolean;
  error?: string;
  /** Plans of the Black Pearl given at the end of her turn. */
  plans?: string[];
}

export type ShipBots = Record<string, ShipBotRun>;

/** The bot sees the team's captains only through its own seat: it does not play the cards of a person. */
class ShipTurnBot extends TurnBot {
  constructor(
    s: GameState,
    data: GameData,
    side: Side,
    rng: Rng,
    readonly seat: string,
  ) {
    super(s, data, side, rng);
  }

  override captains(side: Side): ShipState[] {
    return super.captains(side).filter((x) => x.code === this.seat);
  }
}

/**
 * The next action of the ship bot of `seat`, or null when its turn is over. The caller applies the action and calls
 * again; a refusal of the engine goes in `runs[seat].error` (see refusedShipBot).
 */
export function shipBotStep(runs: ShipBots, state: GameState, data: GameData, rng: Rng, seat: string): Action | null {
  let run = runs[seat];
  let next: IteratorResult<Action, void>;
  if (!run) {
    run = runs[seat] = { gen: shipTurn(state, data, rng, seat), done: false };
    next = run.gen.next();
  } else {
    if (run.done) return null;
    next = run.gen.next({ state, error: run.error });
  }
  run.error = undefined;
  if (next.done) {
    run.done = true;
    return null;
  }
  if (next.value.type === 'endTurn') {
    run.plans = next.value.plans;
    run.done = true;
    return null;
  }
  return next.value;
}

/** The engine refused the last action of the ship bot: it goes on without it. */
export function refusedShipBot(runs: ShipBots, seat: string, reason: string): void {
  if (runs[seat]) runs[seat].error = reason;
}

/**
 * The bot's answer to the pending decision for its own seat only: a Reaction or a choice of that seat («Тортуга»
 * and «Джек ускользает» are answered as by the team bot). Uses botAnswer on the decision narrowed to the seat.
 */
export function seatAnswer(state: GameState, data: GameData, mem: BotMemory, seat: string): Action {
  const p = state.pending;
  if (p?.kind === 'reactions' || p?.kind === 'choice') {
    return botAnswer({ ...state, pending: { ...p, waiting: [seat] } }, data, mem);
  }
  return botAnswer(state, data, mem);
}

/** A safe answer when the bot's answer was refused: no Reaction, or the first allowed cards. */
export function fallbackAnswer(state: GameState, seat: string): Action | null {
  const p = state.pending;
  if (p?.kind === 'reactions') return { type: 'noReaction', seat };
  if (p?.kind === 'choice') {
    const c = choiceFor(state, seat);
    return c ? { type: 'choose', seat, cards: c.from.slice(0, c.count) } : null;
  }
  if (p?.kind === 'jack') return { type: 'jack', play: false };
  if (p?.kind === 'tortuga') return { type: 'tortuga', side: p.waiting[0], draws: {} };
  return null;
}

/**
 * The turn of one ship, in the order of the team bot (bot.ts botTurn): Souls → Fires → Legend → Orders before the
 * Volley → Triton's Sword → the Volley (or the dive) → Heart of Davy Jones → Legend → Orders → selling → Plans.
 * No Regroup: it is the team's decision, and the person has made theirs. The last action is `endTurn` with the
 * Plans; the driver ends the turn of the team, not the bot.
 */
export function* shipTurn(state: GameState, data: GameData, rng: Rng, seat: string): Generator<Action, void, BotFeedback> {
  const side = state.ships[seat].side;
  const bot = new ShipTurnBot(state, data, side, rng, seat);
  let actions = 0;
  function* act(action: Action): Generator<Action, boolean, BotFeedback> {
    if (++actions > MAX_ACTIONS) return false;
    const r = yield action;
    bot.s = r.state;
    return !r.error;
  }
  const me = () => bot.ship(seat);
  const afloat = () => !me().sunk && !bot.winner;

  // Souls of the Flying Dutchman.
  if (afloat() && hasAbility(data, me(), ABILITY.eternalService)) {
    const keep = me().legend && me().tracks.hull > 4 ? 3 : 0;
    for (;;) {
      const d = me();
      if (d.sunk || !(d.souls > keep && (bot.missing(d, 'hull') >= 1 || bot.missing(d, 'crew') >= 1))) break;
      const crew = d.tracks.crew === 1 || (bot.missing(d, 'crew') > 0 && bot.missing(d, 'hull') <= 1);
      if (!(yield* act({ type: 'souls', ship: seat, track: crew ? 'crew' : 'hull' }))) break;
    }
  }

  // Fires.
  for (;;) {
    const x = me();
    if (x.sunk || !x.fires || x.hand.length <= 2) break;
    const c = minBy(x.hand, (card) => bot.keepValue(x, card))!;
    if (bot.keepValue(x, c) > 2.5) break;
    if (!(yield* act({ type: 'extinguish', seat, card: c }))) break;
  }
  if (bot.winner) return;

  yield* legend();
  yield* playPhase('setup');
  if (afloat()) yield* sword();
  if (afloat() && !(yield* maybeDive())) yield* doVolley(seat, false);
  if (afloat()) yield* heart();
  if (!bot.winner) {
    yield* legend();
    yield* playPhase('main');
  }
  if (bot.winner) return;
  yield* sellOne(false);
  yield { type: 'endTurn', side, plans: makePlans() };

  function* legend(): Generator<Action, void, BotFeedback> {
    const s = me();
    if (s.sunk || !s.legend || bot.playsLeft(s) <= 0) return;
    const L = bot.card(`${seat}-Л`);
    if (L.type !== 'ПРИКАЗ' || (L.soul && s.souls < L.soul) || bot.powder(side) < L.cost) return;
    const [sc] = bot.cardScore(s, L, 'main');
    if (sc - L.cost * bot.pv() - L.soul * 0.5 >= LEGEND_THR) {
      yield* act({ type: 'playLegend', seat, target: bot.cardParams(s, L).target });
    }
  }

  function* playPhase(phase: 'setup' | 'main'): Generator<Action, void, BotFeedback> {
    for (let i = 0; i < 12; i++) {
      if (bot.winner) return;
      const res = bot.reserve();
      const powder = bot.powder(side);
      const holder = me();
      // Afloat — plays for itself; a captain — one card for the ally (RULES.md 17.3).
      const forShip = holder.sunk ? (aliveShips(bot.s, side)[0] ?? null) : holder;
      if (!forShip) return;
      if (holder.sunk ? !bot.captainCanPlay(holder) : bot.playsLeft(holder) <= 0) return yield* treasury(phase);
      let best: { net: number; card: string } | null = null;
      for (const code of holder.sunk ? holder.hand : [...holder.hand, ...holder.plans]) {
        const c = bot.card(code);
        if ((c.type !== 'ПРИКАЗ' && c.type !== 'РЕМОНТ') || bot.refused.has(code)) continue;
        if (powder - c.cost < res && c.cost > 0) continue;
        const [sc] = bot.cardScore(forShip, c, phase);
        const net = sc - c.cost * bot.pv() - (holder.sunk ? 0 : c.soul * 0.9);
        if (net >= 0.6 && (!best || net > best.net)) best = { net, card: code };
      }
      if (!best) return yield* treasury(phase);
      const card = bot.card(best.card);
      const ok = yield* act({ type: 'playCard', seat, card: best.card, ...bot.cardParams(forShip, card), regroup: false });
      if (!ok) bot.refused.add(best.card);
    }
  }

  /** «Казна Компании»: the Endeavour buys one more card play for 2 Powder. */
  function* treasury(phase: 'setup' | 'main'): Generator<Action, void, BotFeedback> {
    const ship = me();
    const cost = data.rules.treasuryCost;
    const powder = bot.powder(side);
    const res = bot.reserve();
    if (ship.sunk || !hasAbility(data, ship, ABILITY.treasury) || bot.playsLeft(ship) > 0 || bot.s.turn.treasuryUsed || powder < cost + res) return;
    const scores = ship.hand
      .map((code) => bot.card(code))
      .filter((c) => (c.type === 'ПРИКАЗ' || c.type === 'РЕМОНТ') && powder - cost - c.cost >= res)
      .map((c) => bot.cardScore(ship, c, phase)[0] - c.cost * bot.pv());
    if (scores.length > 0 && Math.max(...scores) >= 1.6 && (yield* act({ type: 'treasury', ship: seat }))) yield* playPhase(phase);
  }

  function* sword(): Generator<Action, void, BotFeedback> {
    const m = me();
    if (!hasAbility(data, m, ABILITY.sword) || bot.s.turn.swordUsed || m.tracks.guns === 0) return;
    const es = bot.enemies();
    if (es.length === 0 || bot.powder(side) < data.rules.swordCost + shipData(data, seat).volleyCost + bot.reactReserve()) return;
    const weakest = minBy(es, (e) => e.tracks.hull)!;
    if (weakest.pos !== m.pos && weakest.tracks.hull <= m.tracks.guns + 1 && bot.sea() !== 'maelstrom' && !bot.s.turn.noDiag) {
      yield* act({ type: 'sword', ship: seat });
    }
  }

  function* maybeDive(): Generator<Action, boolean, BotFeedback> {
    const s = me();
    if (!hasAbility(data, s, ABILITY.dive) || s.submerged || s.lastDive === bot.s.round - 1) return false;
    const ally = bot.allyOf(s);
    if (!ally) return false;
    const threat = bot.alive(bot.enemy).reduce((sum, e) => sum + e.tracks.guns, 0) + 2;
    const hull = s.tracks.hull;
    if ((hull <= 4 || (hull <= 6 && threat >= hull)) && hull < ally.tracks.hull) return yield* act({ type: 'dive', ship: seat });
    return false;
  }

  /** «Сердце Дейви Джонса»: the Dutchman fires once more when the Endeavour holds the Heart. */
  function* heart(): Generator<Action, void, BotFeedback> {
    const d = me();
    const i = bot.allyOf(d);
    if (!i || !hasAbility(data, i, ABILITY.heart) || d.submerged || bot.s.turn.heartUsed) return;
    if (d.tracks.guns === 0 || (d.tracks.crew <= 1 && d.souls === 0)) return;
    if (bot.powder(side) < shipData(data, seat).volleyCost + bot.reactReserve()) return;
    yield* doVolley(seat, true);
  }

  function* doVolley(code: string, heartVolley: boolean): Generator<Action, void, BotFeedback> {
    const s = bot.ship(code);
    if (s.tracks.guns <= 0 || s.submerged || s.parley || s.sunk || (!heartVolley && bot.volleyed(s))) return;
    const cost = shipData(data, code).volleyCost;
    if (bot.powder(side) < cost) {
      yield* sellOne(true);
      if (bot.powder(side) < cost) return;
    }
    const v = bot.chooseVolley(bot.ship(code));
    if (!v.target) return;
    const action: Action = { type: 'volley', ship: code, target: v.target.code, heart: heartVolley || undefined };
    if (v.card) Object.assign(action, { charge: v.card, chargeFrom: v.holder!.code, paid: v.paid || undefined });
    if ((yield* act(action)) || !v.card) return;
    const plain = bot.chooseVolley(bot.ship(code), false);
    if (plain.target) yield* act({ type: 'volley', ship: code, target: plain.target.code, heart: heartVolley || undefined });
  }

  function* sellOne(force: boolean): Generator<Action, boolean, BotFeedback> {
    const p = me();
    if (bot.s.turn.sold.includes(seat) || p.hand.length === 0 || data.econ.cap - bot.powder(side) <= 0) return false;
    const c = minBy(p.hand, (card) => bot.keepValue(p, card))!;
    if (force || (bot.keepValue(p, c) < 1.1 && bot.powder(side) < 4)) {
      yield* act({ type: 'sell', seat, card: c });
      return true;
    }
    return false;
  }

  function makePlans(): string[] | undefined {
    const p = me();
    if (p.sunk || !hasAbility(data, p, ABILITY.madPlan)) return undefined;
    const hand = [...p.hand];
    const out: string[] = [];
    while (p.plans.length + out.length < data.rules.plansMax && hand.length > 0) {
      const c = maxBy(hand, (x) => bot.planValue(x))!;
      if (bot.planValue(c) < 0) break;
      hand.splice(hand.indexOf(c), 1);
      out.push(c);
    }
    return out.length > 0 ? out : undefined;
  }
}
