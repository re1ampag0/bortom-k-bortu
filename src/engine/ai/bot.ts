// Bots: the class AI of reference/sim.py ported without improvements (docs/TZ.md, «Боты»).
// The bot only sends actions to the engine, so it plays by RULES.md; where the engine forbids what sim.py
// allows, the bot skips the move (RULES.md 21).
//
// A bot's turn is a generator of actions: the driver applies each action, answers pending decisions
// (botAnswer) and resumes the generator with the new state. Numbers below are sim.py's weights for its greedy
// estimates, not rule numbers: those come from GameData.
import { legalReactions } from '../reactions';
import { createRng, type Rng } from '../rng';
import {
  ABILITY,
  TRACK_MIN,
  aliveShips,
  cardByCode,
  hasAbility,
  otherSide,
  planFx,
  seaKey,
  shipData,
  startValue,
  teamShips,
  type Action,
  type Ctx,
  type GameState,
  type ShipState,
} from '../state';
import type { CardInstance, Fx, GameData, Op, Side, Track } from '../types';
import { volleyTerms } from '../volley';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const TRACK_W: Record<Track, number> = { hull: 1.0, guns: 1.3, crew: 0.9, sails: 0.5 };
/** Operations a bot plays before its Volleys (sim.py SETUP_OPS). */
const SETUP_OPS = new Set([
  'draw', 'draw_to_plan', 'to_plan', 'powder', 'mark', 'team_volley_bonus', 'no_react_team', 'no_diag_turn',
  'ally_extra_plays', 'extra_plays', 'kill_reaction', 'steal_random', 'rob', 'parley', 'lose_crew', 'pass',
  'ally_draw', 'dice', 'discard_enemy_each', 'soul',
]);
/** Minimum score of a Legend (sim.py Cfg.legend_thr). */
const LEGEND_THR = 4;
/** Reactions one team plays at most against one Volley or card (sim.py Game.react). */
const MAX_REACTIONS = 4;
/** Actions in one turn at most: a guard against a bot that loops. */
const MAX_TURN_ACTIONS = 300;

/** What the driver tells the bot after an action: the new state, or the old one and the refusal. */
export interface BotFeedback {
  state: GameState;
  error?: string;
}

/** Bot memory kept by the driver between answers. */
export interface BotMemory {
  rng: Rng;
  /** Reactions played in the current window (sim.py plays at most 4 against one Volley or card). */
  reactionsInWindow: number;
  /** Which window they were played in, see windowKey. */
  window: string;
}

export function newBotMemory(seed: number): BotMemory {
  return { rng: createRng(seed), reactionsInWindow: 0, window: '' };
}

/** Tells one Reaction window from another: the window, its Volley or card and the turn's counters. */
function windowKey(s: GameState): string {
  const p = s.pending;
  if (p?.kind !== 'reactions') return '';
  const t = s.turn;
  const v = s.volley;
  return [s.round, s.active, p.window, p.subject, JSON.stringify(t.volleys), JSON.stringify(t.played), t.heartUsed,
    t.captainPlayed.length, v?.shooter, v?.target, v?.rest.length, s.card?.card].join('|');
}

/**
 * Card fx as sim.py knows it. The app plays some cards exactly by their text (scripts/convert-data.py
 * FX_OVERRIDES); the bot scores them as sim.py does: «Компас Джека» — draw 1 and 1 to a Plan, «Тиа Дальма» — only
 * the cards, «Строй линии» — no Regroup, «Сто лет службы» — Crew of the ship that plays it.
 */
function simOps(ops: Op[]): Op[] {
  const out: Op[] = [];
  for (const op of ops) {
    if (op[0] === 'compass') out.push(['draw', 1], ['draw_to_plan', 1]);
    else if (op[0] === 'repair_named') out.push(['repair_track', ...op.slice(1)]);
    else if (op[0] !== 'sea_look' && op[0] !== 'regroup_free') out.push(op);
  }
  return out;
}

/** The first item with the largest key, as Python's max(). */
function maxBy<T>(items: T[], key: (x: T) => number): T | undefined {
  let best: T | undefined;
  let bestKey = -Infinity;
  for (const x of items) {
    const k = key(x);
    if (best === undefined || k > bestKey) {
      best = x;
      bestKey = k;
    }
  }
  return best;
}

const minBy = <T>(items: T[], key: (x: T) => number) => maxBy(items, (x) => -key(x));

/** Read-only queries about a game state, shared by the turn and the answers. */
class View {
  constructor(
    public s: GameState,
    public data: GameData,
  ) {}

  get ctx(): Ctx {
    return { s: this.s, data: this.data, rng: createRng(this.s.rng), events: [] };
  }

  card(code: string): CardInstance {
    return cardByCode(this.data, code);
  }

  sea(): string | null {
    return seaKey(this.ctx);
  }

  powder(side: Side): number {
    return this.s.teams[side].powder;
  }

  alive(side: Side): ShipState[] {
    return aliveShips(this.s, side);
  }

  /** Captains of sunk ships while the team still has a ship afloat. */
  captains(side: Side): ShipState[] {
    return this.alive(side).length > 0 ? teamShips(this.s, side).filter((x) => x.sunk) : [];
  }

  players(side: Side): ShipState[] {
    return [...this.alive(side), ...this.captains(side)];
  }

  missing(ship: ShipState, track?: Track): number {
    if (track) return startValue(this.data, ship.code, track) - ship.tracks[track];
    return TRACKS.reduce((n, t) => n + this.missing(ship, t), 0);
  }

  maxSouls(side: Side): number {
    return this.data.ships.find((x) => x.side === side && x.souls !== undefined)?.souls ?? 0;
  }

  /** Value of n damage to a track of the target (sim.py AI.dmg_value). */
  dmgValue(tgt: ShipState, track: Track, n: number, src: ShipState | null): number {
    if (n <= 0 || tgt.sunk) return 0;
    if (track === 'crew' && this.sea() === 'moon') n -= this.data.rules.seaMoon;
    if (track === 'hull') {
      const hull = tgt.tracks.hull;
      let v = Math.min(n, hull) * (1 + 3.0 / (hull + 1));
      if (n >= hull) v += 6;
      return v;
    }
    const room = tgt.tracks[track] - TRACK_MIN[track];
    const take = Math.min(n, room);
    const over = n - take;
    let w = TRACK_W[track];
    if (track === 'crew' && src && hasAbility(this.data, src, ABILITY.eternalService)) w += 0.6;
    let v = take * w + over * (1 + 3.0 / (tgt.tracks.hull + 1));
    if (over >= tgt.tracks.hull) v += 6;
    return v;
  }

  /** How much the bot wants to keep a card (sim.py AI.keep_value). */
  keepValue(p: ShipState, code: string): number {
    const c = this.card(code);
    const alive = this.alive(p.side);
    const ship = !p.sunk ? p : (alive[0] ?? p);
    if (c.type === 'РЕАКЦИЯ') return ship.tracks.sails === 0 && !p.sunk ? 0.6 : c.v * 0.8;
    if (c.type === 'ЗАРЯД') {
      const n = p.hand.filter((x) => this.card(x).type === 'ЗАРЯД').length;
      return c.v * (n <= 2 ? 0.9 : 0.5);
    }
    if (c.cost > this.powder(p.side) + 2) return 0.8;
    return c.v * 0.8;
  }

  /** Which card the Black Pearl puts into a Plan (sim.py AI.make_plans). */
  planValue(code: string): number {
    const c = this.card(code);
    if (c.type === 'РЕАКЦИЯ') return 3 + (c.fx.plan_any ? 2 : 0) + c.v;
    if (c.fx.plan) return 2 + c.v;
    return -1;
  }
}

type Target = ShipState | null;

/** One team's turn (sim.py class AI). */
class TurnBot extends View {
  readonly enemy: Side;
  /** Cards the engine refused this turn: the bot does not try them again. */
  readonly refused = new Set<string>();

  constructor(
    s: GameState,
    data: GameData,
    readonly side: Side,
    readonly rng: Rng,
  ) {
    super(s, data);
    this.enemy = otherSide(side);
  }

  get winner() {
    return this.s.winner;
  }

  ship(code: string): ShipState {
    return this.s.ships[code];
  }

  // ---------- estimates

  pv(): number {
    const p = this.powder(this.side);
    return p >= 6 ? 0.75 : p >= 3 ? 1.0 : 1.25;
  }

  volleyed(ship: ShipState): boolean {
    const t = this.s.turn;
    return (t.volleys[ship.code] ?? 0) >= shipData(this.data, ship.code).volleysPerTurn || t.dived.includes(ship.code);
  }

  pendingVolleys(): number {
    return this.alive(this.side).filter(
      (x) => !this.volleyed(x) && x.tracks.guns > 0 && !x.submerged && !x.parley,
    ).length;
  }

  reactReserve(): number {
    for (const p of this.players(this.side)) {
      for (const code of [...p.hand, ...p.plans]) {
        const c = this.card(code);
        if (c.type === 'РЕАКЦИЯ' && c.cost) return 1;
      }
    }
    return 0;
  }

  reserve(): number {
    return this.pendingVolleys() + this.reactReserve();
  }

  enemies(): ShipState[] {
    return this.alive(this.enemy).filter((x) => !x.submerged);
  }

  allyOf(ship: ShipState): ShipState | null {
    return this.alive(this.side).find((x) => x.code !== ship.code) ?? null;
  }

  playsLeft(ship: ShipState): number {
    const t = this.s.turn;
    return (t.limit[ship.code] ?? 0) - (t.played[ship.code] ?? 0);
  }

  captainCanPlay(cap: ShipState): boolean {
    return !this.s.turn.captainPlayed.includes(cap.code);
  }

  // ---------- Orders and Repairs

  opTarget(s: ShipState, scope: string, track: Track, n: number): [Target, number] {
    let es = this.enemies();
    if (scope === 'opposite') es = es.filter((e) => e.pos === s.pos);
    const best = maxBy(es, (e) => this.dmgValue(e, track, n, s));
    return best ? [best, this.dmgValue(best, track, n, s)] : [null, 0];
  }

  /** Value of playing an Order or a Repair now, without its cost (sim.py AI.card_score). */
  cardScore(s: ShipState, card: CardInstance, phase: 'setup' | 'main'): [number, Target] {
    const ops = simOps(card.fx.ops ?? []);
    if (card.type === 'РЕМОНТ' && s.blockaded) return [-9, null];
    if (card.soul && s.souls < card.soul) return [-9, null];
    if (phase === 'setup' && !ops.every((o) => SETUP_OPS.has(o[0]))) return [-9, null];
    let total = 0;
    let tgt: Target = null;
    const ally = this.allyOf(s);
    const pending = this.pendingVolleys();
    const powder = this.powder(this.side);
    const maxFires = this.data.rules.maxFires;
    for (const op of ops) {
      const k = op[0];
      const a = Number(op[1]);
      switch (k) {
        case 'draw':
          total += a * (s.hand.length < 7 ? 1.0 : 0.4);
          break;
        case 'draw_to_plan':
        case 'ally_draw':
          total += a * 0.9;
          break;
        case 'to_plan':
          total += 0.2;
          break;
        case 'powder':
          total += Math.min(a, this.data.econ.cap - powder) * 0.9;
          break;
        case 'rob':
          total += Math.min(a, this.powder(this.enemy)) * 1.8;
          break;
        case 'parley':
          total += Math.max(0, ...this.enemies().map((e) => e.tracks.guns)) * 0.9;
          break;
        case 'steal_random':
          total += this.players(this.enemy).some((p) => p.hand.length > 0) ? 1.8 : 0;
          break;
        case 'kill_reaction':
          total += 1.3;
          break;
        case 'team_volley_bonus':
          total += pending * a;
          break;
        case 'no_react_team':
          total += 0.8 * pending + (phase === 'setup' ? 0.5 : 0);
          break;
        case 'no_diag_turn':
          total += 0.4 * pending;
          break;
        case 'mark':
          total += Number(op[2]) * pending * 0.9;
          break;
        case 'extra_plays':
          total += Math.min(a, Math.max(0, s.hand.length - 2)) * 0.7;
          break;
        case 'ally_extra_plays':
          total += ally ? Math.min(a, ally.hand.length - 1) * 0.7 : 0;
          break;
        case 'lose_crew':
          total -= s.tracks.crew > 1 ? 0.9 : 1.5;
          break;
        case 'pass':
          total += 0.2;
          break;
        case 'dice':
          total += 0.7;
          break;
        case 'discard_enemy_each':
          total += this.players(this.enemy).filter((p) => p.hand.length > 0).length * 0.9;
          break;
        case 'soul':
          total += Math.min(a, this.maxSouls(this.side) - s.souls) * 0.9;
          break;
        case 'repair_self':
          total += this.repairValue(s, a);
          break;
        case 'repair_track':
          total += Math.min(Number(op[2]), this.missing(s, op[1] as Track)) * TRACK_W[op[1] as Track] * 1.1;
          break;
        case 'repair_track_any': {
          const track = op[1] as Track;
          const cands = ally ? [s, ally] : [s];
          total += Math.max(...cands.map((x) => Math.min(Number(op[2]), this.missing(x, track)) * TRACK_W[track] * 1.1));
          break;
        }
        case 'repair_ally':
          total += ally ? this.repairValue(ally, a) : 0;
          break;
        case 'repair_crew_both':
          total += Math.min(1, this.missing(s, 'crew')) + (ally ? Math.min(1, this.missing(ally, 'crew')) : 0);
          break;
        case 'souls_repair': {
          const k2 = Math.min(s.souls, Math.floor((this.missing(s) + 1) / 2));
          total += k2 * 2 - k2 * 0.9;
          break;
        }
        case 'dmg': {
          const [, scope, track, n] = op as [string, string, Track, number];
          if (scope === 'all') total += this.enemies().reduce((sum, e) => sum + this.dmgValue(e, track, n, s), 0);
          else if (scope === 'same') {
            if (tgt) total += this.dmgValue(tgt, track, n, s);
          } else {
            const [t, v] = this.opTarget(s, scope, track, n);
            if (!t) return [-9, null];
            tgt = t;
            total += v;
          }
          break;
        }
        case 'fire': {
          const es = this.enemies().filter((e) => e.fires < maxFires);
          const t = maxBy(es, (e) => e.tracks.hull);
          if (!t) return [-9, null];
          tgt = t;
          total += Math.min(Number(op[2]), maxFires - t.fires) * 1.5;
          break;
        }
        case 'voodoo': {
          const t = maxBy(this.enemies(), (e) => e.tracks.crew);
          if (!t) return [-9, null];
          tgt = t;
          total += 2.0;
          break;
        }
        case 'no_react':
          total += 0.6;
          break;
        case 'no_repair': {
          const t = maxBy(this.enemies(), (e) => this.missing(e));
          if (!t) return [-9, null];
          tgt = t;
          total += 0.6 + 0.2 * Math.min(4, this.missing(t));
          break;
        }
        case 'extra_volley_free': {
          const es = this.enemies();
          if (es.length === 0 || s.tracks.guns === 0 || s.submerged) return [-9, null];
          const bonus = op.length > 1 ? a : 0;
          total +=
            Math.max(...es.map((e) => this.dmgValue(e, 'hull', s.tracks.guns + bonus - (e.pos !== s.pos ? 1 : 0), s))) + 1.0;
          break;
        }
        case 'bottle': {
          const es = this.enemies().filter((e) => e.tracks.hull <= a);
          if (es.length === 0) return [-9, null];
          tgt = es[0];
          total += 12;
          break;
        }
      }
    }
    return [total, tgt];
  }

  repairValue(s: ShipState | null, n: number): number {
    if (!s) return 0;
    let v = 0;
    let left = n;
    for (const tr of ['guns', 'hull', 'crew', 'sails'] as Track[]) {
      const k = Math.min(left, this.missing(s, tr));
      v += k * TRACK_W[tr] * 1.1;
      left -= k;
    }
    return v;
  }

  /**
   * The choices the engine asks for when a card is played, made as sim.py makes them while playing the card
   * (AI.play_card): the enemy ship or player, the ship to repair.
   */
  cardParams(s: ShipState, card: CardInstance): { target?: string; ship?: string } {
    const ops = card.fx.ops ?? [];
    const out: { target?: string; ship?: string } = {};
    const es = this.enemies();
    const maxFires = this.data.rules.maxFires;
    for (const op of ops) {
      if (out.target) break;
      const k = op[0];
      let t: Target | undefined = null;
      if (k === 'dmg' && op[1] === 'any') t = this.opTarget(s, 'any', op[2] as Track, Number(op[3]))[0];
      else if (k === 'fire') t = maxBy(es.filter((e) => e.fires < maxFires), (e) => e.tracks.hull);
      else if (k === 'voodoo') t = maxBy(es, (e) => e.tracks.crew);
      else if (k === 'parley') t = maxBy(es, (e) => e.tracks.guns);
      else if (k === 'no_repair') t = maxBy(es, (e) => this.missing(e));
      else if (k === 'mark') t = minBy(es, (e) => e.tracks.hull);
      else if (k === 'bottle') t = minBy(es.filter((e) => e.tracks.hull <= Number(op[1])), (e) => e.tracks.hull);
      else if (k === 'extra_volley_free') {
        const bonus = op.length > 1 ? Number(op[1]) : 0;
        t = this.chooseVolley(this.shooterOf(card, s), false, bonus).target;
      } else if (k === 'steal_random' || k === 'dice') {
        const pl = this.players(this.enemy).filter((p) => p.hand.length > 0);
        t = pl.length ? pl[this.rng.int(pl.length)] : null;
      } else if (k === 'kill_reaction') {
        const pl = this.players(this.enemy);
        t = pl.find((p) => p.hand.some((c) => this.card(c).type === 'РЕАКЦИЯ')) ?? pl[0];
      }
      if (t) out.target = t.code;
      if (k === 'repair_track_any') {
        const ally = this.allyOf(s);
        const track = op[1] as Track;
        out.ship = maxBy(ally ? [s, ally] : [s], (x) => this.missing(x, track))!.code;
      }
    }
    return out;
  }

  /** The ship that fires by «Зомби у пушек» or «Всплытие»: the ship the card names, while it is afloat (Q43). */
  shooterOf(card: CardInstance, s: ShipState): ShipState {
    const named = this.s.ships[card.deck];
    return named && named.side === s.side && !named.sunk ? named : s;
  }

  // ---------- Volley

  chargeOptions(s: ShipState): { card: string | null; plan: boolean; holder: ShipState | null }[] {
    const opts: { card: string | null; plan: boolean; holder: ShipState | null }[] = [{ card: null, plan: false, holder: null }];
    for (const c of s.hand) if (this.card(c).type === 'ЗАРЯД') opts.push({ card: c, plan: false, holder: s });
    for (const c of s.plans) if (this.card(c).type === 'ЗАРЯД') opts.push({ card: c, plan: true, holder: s });
    for (const cap of this.captains(this.side)) {
      if (!this.captainCanPlay(cap)) continue;
      for (const c of cap.hand) if (this.card(c).type === 'ЗАРЯД') opts.push({ card: c, plan: false, holder: cap });
    }
    return opts;
  }

  /** The best target and Charge for a Volley (sim.py AI.choose_volley). */
  chooseVolley(
    s: ShipState,
    allowCharge = true,
    extra = 0,
  ): { target: Target; card: string | null; plan: boolean; holder: ShipState | null; paid: number } {
    const sea = this.sea();
    let es = this.enemies();
    if (sea === 'fog') es = es.filter((e) => e.pos === s.pos);
    const none = { target: null, card: null, plan: false, holder: null, paid: 0 };
    if (es.length === 0) return none;
    let best = { v: -99, ...none } as { v: number; target: Target; card: string | null; plan: boolean; holder: ShipState | null; paid: number };
    const res = this.reactReserve();
    const freePowder = this.powder(this.side) - 1 - Math.max(0, this.pendingVolleys() - 1) - res;
    const opts = allowCharge ? this.chargeOptions(s) : [{ card: null, plan: false, holder: null }];
    const turn = this.s.turn;
    const storm = turn.reduceAll.reduce((sum, t) => sum + t.n, 0);
    for (const { card, plan, holder } of opts) {
      const c = card ? this.card(card) : null;
      const fx: Fx = c ? planFx(c.fx, plan) : {};
      const cost = c ? c.cost : 0;
      if (c && cost > freePowder) continue;
      if (c && holder === s && this.playsLeft(s) <= 0 && !plan) continue;
      // A Charge from a Plan uses the Crew limit too (RULES.md 7.4, 21.1): the engine refuses it.
      if (c && plan && this.playsLeft(s) <= 0) continue;
      let paid = 0;
      if (fx.paid) paid = Math.max(0, Math.min(this.data.rules.paidChargeMax, freePowder - cost));
      if (fx.both) {
        let v = this.enemies().reduce((sum, e) => sum + this.dmgValue(e, 'hull', s.tracks.guns, s), 0);
        v -= cost * this.pv() + 0.8;
        if (v > best.v) best = { v, target: this.enemies()[0], card, plan, holder, paid: 0 };
        continue;
      }
      for (const e of es) {
        const track = fx.track ?? 'hull';
        const noDiag = fx.no_diag || turn.noDiag || sea === 'maelstrom';
        let d = s.tracks.guns + (fx.dmg ?? 0) + paid + extra + turn.volleyBonus + (turn.marks[e.code] ?? 0);
        if (e.pos !== s.pos && !noDiag) d -= 1;
        if (e.pos === s.pos && sea === 'clear') d += this.data.rules.seaClear;
        if (sea === 'storm') d -= this.data.rules.seaStorm;
        if (fx.if_fire && e.fires) d += fx.if_fire;
        if (fx.if_damaged && turn.damaged.includes(e.code)) d += fx.if_damaged;
        if (s.surfaced) d += this.data.rules.surfaceBonus;
        if (turn.firstTarget === e.code && turn.firstShooter !== s.code && !turn.jointUsed) d += this.data.rules.jointBonus;
        d += storm;
        let v = this.dmgValue(e, track, d, s);
        if (fx.fire && e.fires < this.data.rules.maxFires) v += 1.5;
        if (fx.no_react) v += 0.6;
        if (c) v -= (cost + paid) * this.pv() + (!plan ? 0.5 : 0.9);
        // Let the second ship finish off the same target.
        if (turn.firstTarget === null && this.alive(this.side).length === 2) v += 0.3 * (1.0 / (e.tracks.hull + 1)) * 10;
        if (v > best.v) best = { v, target: e, card, plan, holder, paid };
      }
    }
    return best;
  }
}

/**
 * One turn of the bot for `side` (sim.py AI.run): Souls → Fires → Regroup → Legends → Orders before the Volleys →
 * Triton's Sword → Volleys (or the dive) → Heart of Davy Jones → Legends → Orders → selling → Plans → end of turn.
 */
export function* botTurn(state: GameState, data: GameData, rng: Rng): Generator<Action, void, BotFeedback> {
  const side = state.active;
  const bot = new TurnBot(state, data, side, rng);
  let actions = 0;
  /** Sends an action; true if the engine accepted it. */
  function* act(action: Action): Generator<Action, boolean, BotFeedback> {
    if (++actions > MAX_TURN_ACTIONS) throw new Error(`Bot made more than ${MAX_TURN_ACTIONS} actions in one turn`);
    const r = yield action;
    bot.s = r.state;
    return !r.error;
  }

  // Souls (sim.py AI.souls).
  const dutch = bot.alive(side).find((x) => hasAbility(data, x, ABILITY.eternalService));
  if (dutch) {
    const keep = dutch.legend && dutch.tracks.hull > 4 ? 3 : 0;
    for (;;) {
      const d = bot.ship(dutch.code);
      if (d.sunk || !(d.souls > keep && (bot.missing(d, 'hull') >= 1 || bot.missing(d, 'crew') >= 1))) break;
      const crew = d.tracks.crew === 1 || (bot.missing(d, 'crew') > 0 && bot.missing(d, 'hull') <= 1);
      if (!(yield* act({ type: 'souls', ship: d.code, track: crew ? 'crew' : 'hull' }))) break;
    }
  }

  // Fires (sim.py AI.extinguish).
  for (const code of bot.alive(side).map((x) => x.code)) {
    for (;;) {
      const x = bot.ship(code);
      if (x.sunk || !x.fires || x.hand.length <= 2) break;
      const c = minBy(x.hand, (card) => bot.keepValue(x, card))!;
      if (bot.keepValue(x, c) > 2.5) break;
      if (!(yield* act({ type: 'extinguish', seat: code, card: c }))) break;
    }
  }
  if (bot.winner) return;

  yield* regroup();
  yield* legends();
  yield* playPhase('setup');
  yield* sword();
  const ships = [...bot.alive(side)].sort((a, b) => b.tracks.guns - a.tracks.guns).map((x) => x.code);
  for (const code of ships) {
    if (bot.winner) return;
    if (bot.ship(code).sunk) continue;
    if (yield* maybeDive(code)) continue;
    yield* doVolley(code, false);
  }
  if (!bot.winner) yield* heart();
  if (!bot.winner) {
    yield* legends();
    yield* playPhase('main');
  }
  if (!bot.winner) {
    yield* sellOne(false);
    yield* act({ type: 'endTurn', side, plans: makePlans() });
  }

  // ---------- parts of the turn

  function* regroup(): Generator<Action, void, BotFeedback> {
    const al = bot.alive(side);
    const sea = bot.sea();
    if (al.length !== 2 || sea === 'calm' || bot.s.turn.regrouped || al.some((x) => x.blockaded)) return;
    if (sea === 'reefs') return;
    const free = bot.alive(side).some((x) => hasAbility(data, x, ABILITY.fasterThanWind)) || sea === 'wind';
    if (!free && bot.powder(side) < data.rules.regroupCost + bot.reactReserve()) return;
    const danger = (pos: Record<string, number>) => {
      let tot = 0;
      for (const x of al) {
        const worst = Math.max(0, ...bot.alive(bot.enemy).map((e) => e.tracks.guns - (e.pos !== pos[x.code] ? 1 : 0)));
        tot += worst / Math.max(1, x.tracks.hull);
      }
      return tot;
    };
    const d0 = danger({ [al[0].code]: al[0].pos, [al[1].code]: al[1].pos });
    const d1 = danger({ [al[0].code]: al[1].pos, [al[1].code]: al[0].pos });
    if (d1 < d0 - 0.12) yield* act({ type: 'regroup', side });
  }

  function* sword(): Generator<Action, void, BotFeedback> {
    const m = bot.alive(side).find((x) => hasAbility(data, x, ABILITY.sword));
    if (!m || bot.s.turn.swordUsed || m.tracks.guns === 0) return;
    const es = bot.enemies();
    const volleyCost = shipData(data, m.code).volleyCost;
    if (es.length === 0 || bot.powder(side) < data.rules.swordCost + volleyCost + bot.reactReserve()) return;
    const weakest = minBy(es, (e) => e.tracks.hull)!;
    const killSoon = weakest.tracks.hull <= m.tracks.guns + 1;
    if (weakest.pos !== m.pos && killSoon && bot.sea() !== 'maelstrom' && !bot.s.turn.noDiag) {
      yield* act({ type: 'sword', ship: m.code });
    }
  }

  function* legends(): Generator<Action, void, BotFeedback> {
    for (const code of bot.alive(side).map((x) => x.code)) {
      const s = bot.ship(code);
      if (s.sunk || !s.legend || bot.playsLeft(s) <= 0) continue;
      const L = bot.card(`${code}-Л`);
      if (L.type !== 'ПРИКАЗ') continue;
      if (L.soul && s.souls < L.soul) continue;
      if (bot.powder(side) < L.cost) continue;
      const [sc] = bot.cardScore(s, L, 'main');
      if (sc - L.cost * bot.pv() - L.soul * 0.5 >= LEGEND_THR) {
        yield* act({ type: 'playLegend', seat: code, target: bot.cardParams(s, L).target });
      }
    }
  }

  function* playPhase(phase: 'setup' | 'main'): Generator<Action, void, BotFeedback> {
    for (let i = 0; i < 12; i++) {
      if (bot.winner) return;
      let best: { net: number; seat: string; card: string; s: ShipState } | null = null;
      const res = bot.reserve();
      const powder = bot.powder(side);
      for (const s of bot.alive(side)) {
        if (bot.playsLeft(s) <= 0) continue;
        for (const code of [...s.hand, ...s.plans]) {
          const c = bot.card(code);
          if ((c.type !== 'ПРИКАЗ' && c.type !== 'РЕМОНТ') || bot.refused.has(code)) continue;
          if (powder - c.cost < res && c.cost > 0) continue;
          const [sc] = bot.cardScore(s, c, phase);
          const net = sc - c.cost * bot.pv() - c.soul * 0.9;
          if (net >= 0.6 && (!best || net > best.net)) best = { net, seat: s.code, card: code, s };
        }
      }
      const al = bot.alive(side);
      for (const cap of bot.captains(side)) {
        if (!bot.captainCanPlay(cap) || al.length === 0) continue;
        for (const code of cap.hand) {
          const c = bot.card(code);
          if ((c.type !== 'ПРИКАЗ' && c.type !== 'РЕМОНТ') || bot.refused.has(code)) continue;
          if (powder - c.cost < res && c.cost > 0) continue;
          const [sc] = bot.cardScore(al[0], c, phase);
          const net = sc - c.cost * bot.pv();
          if (net >= 0.6 && (!best || net > best.net)) best = { net, seat: cap.code, card: code, s: al[0] };
        }
      }
      if (!best) {
        // «Казна Компании»: the Endeavour buys one more card play for 2 Powder.
        const ship = bot.alive(side).find((x) => hasAbility(data, x, ABILITY.treasury));
        const cost = data.rules.treasuryCost;
        if (ship && bot.playsLeft(ship) <= 0 && !bot.s.turn.treasuryUsed && powder >= cost + res) {
          const scores = ship.hand
            .map((code) => bot.card(code))
            .filter((c) => (c.type === 'ПРИКАЗ' || c.type === 'РЕМОНТ') && powder - cost - c.cost >= res)
            .map((c) => bot.cardScore(ship, c, phase)[0] - c.cost * bot.pv());
          if (scores.length > 0 && Math.max(...scores) >= 1.6) {
            if (yield* act({ type: 'treasury', ship: ship.code })) continue;
          }
        }
        return;
      }
      const card = bot.card(best.card);
      const ok = yield* act({ type: 'playCard', seat: best.seat, card: best.card, ...bot.cardParams(best.s, card), regroup: false });
      if (!ok) bot.refused.add(best.card);
    }
  }

  function* maybeDive(code: string): Generator<Action, boolean, BotFeedback> {
    const s = bot.ship(code);
    if (!hasAbility(data, s, ABILITY.dive) || s.submerged) return false;
    const ally = bot.allyOf(s);
    if (!ally) return false;
    // Not two own turns in a row (RULES.md 14.8, 21.10): the engine refuses, the bot fires instead.
    if (s.lastDive === bot.s.round - 1) return false;
    const threat = bot.alive(bot.enemy).reduce((sum, e) => sum + e.tracks.guns, 0) + 2;
    const hull = s.tracks.hull;
    if ((hull <= 4 || (hull <= 6 && threat >= hull)) && hull < ally.tracks.hull) {
      return yield* act({ type: 'dive', ship: code });
    }
    return false;
  }

  function* heart(): Generator<Action, void, BotFeedback> {
    const i = bot.alive(side).find((x) => hasAbility(data, x, ABILITY.heart));
    const d = i && bot.allyOf(i);
    if (!i || !d || d.submerged || bot.s.turn.heartUsed) return;
    if (d.tracks.guns === 0 || (d.tracks.crew <= 1 && d.souls === 0)) return;
    if (bot.powder(side) < shipData(data, d.code).volleyCost + bot.reactReserve()) return;
    yield* doVolley(d.code, true);
  }

  function* doVolley(code: string, heartVolley: boolean): Generator<Action, void, BotFeedback> {
    const s = bot.ship(code);
    if (s.tracks.guns <= 0 || s.submerged || s.parley || s.sunk) return;
    const cost = shipData(data, code).volleyCost;
    if (bot.powder(side) < cost) {
      yield* sellOne(true);
      if (bot.powder(side) < cost) return;
    }
    const v = bot.chooseVolley(bot.ship(code));
    if (!v.target) return;
    const action: Action = { type: 'volley', ship: code, target: v.target.code, heart: heartVolley || undefined };
    if (v.card) Object.assign(action, { charge: v.card, chargeFrom: v.holder!.code, paid: v.paid || undefined });
    if (yield* act(action)) return;
    // The engine refused the Charge (e.g. «Залп с обоих бортов» at a diagonal target in «Туман»): fire without it.
    if (!v.card) return;
    const plain = bot.chooseVolley(bot.ship(code), false);
    if (plain.target) yield* act({ type: 'volley', ship: code, target: plain.target.code, heart: heartVolley || undefined });
  }

  function* sellOne(force: boolean): Generator<Action, boolean, BotFeedback> {
    for (const code of bot.players(side).map((x) => x.code)) {
      const p = bot.ship(code);
      if (bot.s.turn.sold.includes(code) || p.hand.length === 0) continue;
      if (data.econ.cap - bot.powder(side) <= 0) continue;
      const c = minBy(p.hand, (card) => bot.keepValue(p, card))!;
      const kv = bot.keepValue(p, c);
      if (force || (kv < 1.1 && bot.powder(side) < 4)) {
        yield* act({ type: 'sell', seat: code, card: c });
        if (force) return true;
      }
    }
    return false;
  }

  function makePlans(): string[] | undefined {
    const p = bot.alive(side).find((x) => hasAbility(data, x, ABILITY.madPlan));
    if (!p) return undefined;
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

/**
 * The bot's answer to the pending decision: Reactions (sim.py Game.react), «Джек ускользает» (always, when the
 * team can pay), «Тортуга» (sim.py reveal_sea), and the card choices sim.py does not have (see RULES.md 21).
 */
export function botAnswer(state: GameState, data: GameData, mem: BotMemory): Action {
  const p = state.pending;
  if (!p) throw new Error('Nothing to answer');
  const view = new View(state, data);
  switch (p.kind) {
    case 'jack':
      return { type: 'jack', play: true };
    case 'tortuga': {
      const side = p.waiting[0];
      const n = Math.min(data.rules.seaTortuga, Math.max(0, view.powder(side) - 2));
      const pl = view.players(side);
      const draws: Record<string, number> = {};
      for (let i = 0; i < n; i++) draws[pl[i % pl.length].code] = (draws[pl[i % pl.length].code] ?? 0) + 1;
      return { type: 'tortuga', side, draws };
    }
    case 'choice':
      return { type: 'choose', seat: p.waiting[0], cards: choiceAnswer(view, p.waiting[0], mem) };
    case 'reactions': {
      const key = windowKey(state);
      if (key !== mem.window) {
        mem.window = key;
        mem.reactionsInWindow = 0;
      }
      const best = mem.reactionsInWindow < MAX_REACTIONS ? bestReaction(view) : null;
      if (best) {
        mem.reactionsInWindow++;
        return { type: 'react', seat: best.seat, card: best.card };
      }
      return { type: 'noReaction', seat: p.waiting[0] };
    }
  }
}

function choiceAnswer(view: View, seat: string, mem: BotMemory): string[] {
  const p = view.s.pending;
  if (p?.kind !== 'choice') return [];
  const holder = view.s.ships[seat];
  const byV = (code: string) => view.card(code).v;
  switch (p.what) {
    case 'compass':
      // sim.py draws the two top cards.
      return p.options.slice(0, 2);
    case 'tia':
      return [...p.options];
    case 'spy':
      return [maxBy(p.options, byV)!];
    case 'bell':
      return [minBy(holder.hand, byV)!];
    case 'toPlan':
      return [maxBy(holder.hand, (c) => view.planValue(c))!];
    case 'pass':
      return [minBy(holder.hand, (c) => view.keepValue(holder, c))!];
    case 'dice':
      if (seat === p.seat) return [maxBy(holder.hand, (c) => view.card(c).cost)!];
      return [holder.hand[mem.rng.int(holder.hand.length)]];
  }
}

/** The best Reaction of the defending team now, or null (sim.py Game.react: value minus a threshold). */
function bestReaction(view: View): { seat: string; card: string } | null {
  const p = view.s.pending;
  if (p?.kind !== 'reactions') return null;
  const ctx = view.ctx;
  const powder = view.powder(p.side);
  let best: { score: number; seat: string; card: string } | null = null;
  for (const seat of p.waiting) {
    for (const o of legalReactions(ctx, seat)) {
      const c = view.card(o.card);
      const val = reactValue(view, c, o.fromPlan, view.s.ships[o.ship], p.window, p.subject);
      let thr = 0.9 + 1.1 * c.cost;
      if (powder - c.cost < 1 && c.cost) thr += 0.3;
      const score = val - thr;
      if (score > 0 && (!best || score > best.score)) best = { score, seat, card: o.card };
    }
  }
  return best;
}

/** sim.py Game.react_value. `asShip` is the ship the Reaction is played for. */
function reactValue(
  view: View,
  card: CardInstance,
  plan: boolean,
  asShip: ShipState,
  window: 'before' | 'after',
  subject: 'volley' | 'card',
): number {
  const s = view.s;
  const fx = planFx(card.fx, plan);
  const r = fx.r;
  if (subject === 'card') {
    const c = s.card!;
    if (window !== 'before') return 0;
    const att = s.ships[c.ship];
    const tgtCode = c.target ?? c.targets[0] ?? null;
    const ops = planFx(view.card(c.card).fx, c.fromPlan).ops ?? [];
    const crew = ops.reduce((sum, op) => sum + (op[0] === 'dmg' && op[2] === 'crew' ? Number(op[3]) : 0), 0);
    if (r === 'cancel' && fx.cards && tgtCode === asShip.code && att.code === fx.vs) return (c.target ? 4 : 3) + 1;
    if (r === 'cancel_crew' && fx.cards && crew && tgtCode === asShip.code) return crew;
    if (r === 'steal') return 1.6;
    return 0;
  }
  const v = s.volley!;
  const att = s.ships[v.shooter];
  const tgt = s.ships[v.target];
  const raw = volleyTerms(view.ctx, v).reduce((sum, t) => sum + t.n, 0);
  const dmg = Math.max(0, raw);
  const vfx: Fx = v.chargeCancelled ? {} : v.fx;
  if (window === 'after') {
    if (att.sunk || r !== 'counter' || !fx.counter) return 0;
    if (fx.self_only && tgt.code !== asShip.code) return 0;
    const [tr, n0] = fx.counter;
    const n = n0 === 'guns' ? asShip.tracks.guns : n0;
    let val = n * TRACK_W[tr];
    if (fx.counter2) val += Number(fx.counter2[1]) * TRACK_W[fx.counter2[0]];
    if (fx.fire) val += 1.5;
    if (tr === 'hull' && n >= att.tracks.hull) val += 5;
    return val;
  }
  const lethal =
    v.track === 'hull' ? raw >= tgt.tracks.hull : raw - (tgt.tracks[v.track] - TRACK_MIN[v.track]) >= tgt.tracks.hull;
  const lethalBonus = lethal ? 4 : 0;
  const diag = v.diagonal && !v.both && !vfx.no_diag && !v.lineNoDiag && !v.seaNoDiag;
  const n = fx.n ?? 0;
  switch (r) {
    case 'reduce':
      if (!fx.self_only || tgt.code !== asShip.code) return 0;
      return Math.min(n, dmg) + (raw - Math.min(n, dmg) < tgt.tracks.hull || v.track !== 'hull' ? lethalBonus : 0);
    case 'reduce_all':
      return Math.min(n, dmg) + 0.7 + (dmg - n < tgt.tracks.hull ? lethalBonus : 0);
    case 'cancel':
      if (fx.self_only && tgt.code !== asShip.code) return 0;
      if (fx.vs && att.code !== fx.vs) return 0;
      if (fx.diag_only && !(plan && fx.plan_any) && !diag) return 0;
      return dmg + (vfx.fire ? 1.5 : 0) + lethalBonus;
    case 'redirect': {
      if (tgt.code === asShip.code || asShip.sunk || v.track !== 'hull') return 0;
      const nd = Math.max(0, dmg - 1);
      if (nd >= asShip.tracks.hull) return 0;
      return 1 + (dmg / Math.max(1, tgt.tracks.hull) - nd / Math.max(1, asShip.tracks.hull)) * 5 + lethalBonus;
    }
    case 'cancel_charge':
      if (!v.charge) return 0;
      return (vfx.dmg ?? 0) + (vfx.fire ? 1.5 : 0) + (vfx.track ? 0.7 : 0);
    case 'cancel_crew':
      return v.track === 'crew' ? dmg : 0;
    default:
      return 0;
  }
}
