// Animation planner: the events of one action (as the viewer sees them after eventsFor) → clips.
// A one-to-one port of docs/mockups/anim/level1/planfx.js (see PORTING.md): same function names, same clip
// fields, same order of branches. Every event goes to exactly one clip or to `quiet`; a declared Volley is
// remembered between actions, because the declaration and the shot often come with different actions.
// The engine's planFx (src/engine/state.ts) is a different thing: the effect of a card played from a Plan.
import type { Card, Fx, Side, Track } from '../../../engine/types';
import type { GameEvent, ReactionWindow, SwapReason, Term } from '../../../engine/state';

/** Where an addend of a Volley's damage comes from (the engine sets it from A1; older events have none). */
export type TermSrc =
  | { kind: 'guns' }
  | { kind: 'diag' }
  | { kind: 'charge'; card: string | null }
  | { kind: 'sea'; card?: string }
  | { kind: 'reaction'; card: string }
  | { kind: 'joint'; ally?: string }
  | { kind: 'surface' }
  | { kind: 'flags' }
  | { kind: 'mark' }
  | { kind: 'paid' }
  | { kind: 'clear' }
  | { kind: 'extra'; card?: string };

/** Cards by code: only the name and fx are needed. */
export type FxCards = Record<string, Pick<Card, 'name' | 'fx'> | undefined>;

export type BallKind = 'core' | 'chain' | 'grape' | 'under' | 'keg' | 'joint' | 'mark' | 'gold' | 'flag' | 'fire' | 'hot' | 'ghost';
export type ShotOut = 'hit' | 'overkill' | 'moon' | 'water' | 'wind' | 'bounce' | 'stick' | 'whirl' | 'block' | 'past';

/** One cannonball of a hit. A ball is 1 damage (`units` > 1 only for a merged «×N» ball). */
export interface Shot {
  kind: BallKind;
  out: ShotOut;
  label: string | null;
  units: number;
  to: 'track' | 'hull' | null;
  big?: boolean;
  plus?: TermSrc['kind'];
}

/** A Reaction played against the Volley being resolved. */
export interface VolReaction {
  card: string;
  ship: string;
  r: string | undefined;
}

interface ClipBase {
  /** Indices of the clip's events in the action's event list. */
  ev: number[];
  /** Events taken in by a context clip (ABSORB). */
  effects?: GameEvent[];
  /** Souls gained during the clip. */
  souls?: number;
}

export interface AnnounceClip extends ClipBase {
  kind: 'announce';
  shooter: string;
  target: string;
  track: Track;
  charge: string | null;
  chargeFrom: string | null;
  captain: boolean;
  diagonal: boolean;
  joint: boolean;
  damage: number;
  terms: Term[] | null;
  part: number;
  heart: boolean;
  byCard: string | null;
  cost: { volley: number; card: number };
  noReact: boolean;
  noDiagBy: string | null;
}
export interface WindowClip extends ClipBase {
  kind: 'window';
  side: Side;
  phase: ReactionWindow;
  mine: boolean;
  forCard: boolean;
  seats: string[];
}
export interface ReactionClip extends ClipBase {
  kind: 'reaction';
  seat: string;
  ship: string;
  card: string;
  r: string | undefined;
  fromPlan: boolean;
  cost: number;
  phase: 'before' | 'after' | 'card';
  mine: boolean;
}
export interface ShotClip extends ClipBase {
  kind: 'shot';
  shooter: string;
  declared: string;
  target: string;
  track: Track;
  damage: number;
  terms: Term[];
  charge: string | null;
  chargeCancelled: boolean;
  reactions: VolReaction[];
  part: number;
  amount: number;
  toHull: number;
  souls: number;
  fire: number;
  sea: string | null;
  shots?: Shot[];
}
export interface CancelClip extends ClipBase {
  kind: 'cancel';
  shooter?: string;
  target?: string;
  card?: string;
  lost?: boolean;
  by: string | null;
  r?: string | null;
  charge?: string | null;
}
export interface CounterClip extends ClipBase {
  kind: 'counter';
  from: string;
  to: string;
  card: string;
  hits: { track: Track; amount: number; toHull: number }[];
  fire: number;
}
export interface HeartClip extends ClipBase {
  kind: 'heart';
  ship: string;
  crew: number;
}
export interface CardClip extends ClipBase {
  kind: 'card';
  seat: string;
  ship: string;
  card: string;
  target: string | null;
  cost: number;
  effects: GameEvent[];
  resolvedTo?: 'discard' | 'stolen' | 'gone';
}
export interface LegendClip extends ClipBase {
  kind: 'legend';
  seat: string;
  card: string;
  target: string | null;
  cost: number;
  soulCost: number;
  souls: number;
  effects: GameEvent[];
  resolvedTo?: 'discard' | 'stolen' | 'gone';
}
export interface JackClip extends ClipBase {
  kind: 'jack';
  ship: string;
  cost: number;
}
export interface RoundClip extends ClipBase {
  kind: 'round';
  round: number | null;
}
/** A round clip turned into the sea clip by seaRevealed (round stays: null when no round started). */
export interface SeaClip extends ClipBase {
  kind: 'sea';
  round: number | null;
  card: string;
  key: string;
  reshuffled: boolean;
  effects: GameEvent[];
}
export interface TurnClip extends ClipBase {
  kind: 'turn';
  side: Side;
  mine: boolean;
  effects: GameEvent[];
}
export interface TurnEndClip extends ClipBase {
  kind: 'turnEnd';
  side: Side;
  plans: { seat: string; count: number } | null;
}
export interface SwapClip extends ClipBase {
  kind: 'swap';
  side: Side;
  reason: SwapReason;
  ships: string[];
  cost: number;
}
export interface DiveClip extends ClipBase {
  kind: 'dive';
  ship: string;
}
export interface SurfaceClip extends ClipBase {
  kind: 'surface';
  ship: string;
}
export interface SinkClip extends ClipBase {
  kind: 'sink';
  ship: string;
}
export interface ImpactClip extends ClipBase {
  kind: 'impact';
  ship: string;
  track: Track;
  amount: number;
  toHull: number;
  cause: string | null;
}
export interface FireClip extends ClipBase {
  kind: 'fire';
  ship: string;
  fires: number;
}
export interface RepairClip extends ClipBase {
  kind: 'repair';
  ship: string;
  track: Track;
  amount: number;
  cause: string | null;
}
export interface PowderClip extends ClipBase {
  kind: 'powder';
  side?: Side;
  ship?: string;
  n: number;
  burned?: number;
  reason: string;
}
export interface SoulsClip extends ClipBase {
  kind: 'souls';
  side?: Side;
  ship?: string;
  n: number;
  reason?: string;
}
export interface StatusClip extends ClipBase {
  kind: 'status';
  ship?: string;
  side?: Side;
  flag: string;
  n?: number;
}
export interface DrawClip extends ClipBase {
  kind: 'draw';
  seat: string;
  count: number;
  cards: string[] | null;
}
export interface SellClip extends ClipBase {
  kind: 'sell';
  seat: string;
  card: string;
}
export interface PassClip extends ClipBase {
  kind: 'pass';
  seat: string;
  to: string;
  card: string;
}
export interface StealClip extends ClipBase {
  kind: 'steal';
  seat: string | null;
  from?: string;
  card: string;
  after?: boolean;
}
export interface DiscardClip extends ClipBase {
  kind: 'discard';
  seat: string;
  card: string;
}
export interface PeekClip extends ClipBase {
  kind: 'peek';
  seat: string;
  to?: string;
  sea?: boolean;
}
export interface DiceClip extends ClipBase {
  kind: 'dice';
  cards: Record<string, string>;
  winner: string | null;
}
export interface FireOutClip extends ClipBase {
  kind: 'fireOut';
  seat: string;
  card: string;
  fires: number;
}
export interface AbilityClip extends ClipBase {
  kind: 'ability';
  what: 'sword' | 'treasury' | 'jonesFree';
  ship: string;
  cost: number;
}
export interface EndClip extends ClipBase {
  kind: 'end';
  winner: string | null;
  reason: string;
  side?: Side;
}
export interface FallbackClip extends ClipBase {
  kind: 'fallback';
  type: string;
  key?: string;
}

export type FxClip =
  | AnnounceClip
  | WindowClip
  | ReactionClip
  | ShotClip
  | CancelClip
  | CounterClip
  | HeartClip
  | CardClip
  | LegendClip
  | JackClip
  | SeaClip
  | RoundClip
  | TurnClip
  | TurnEndClip
  | SwapClip
  | DiveClip
  | SurfaceClip
  | SinkClip
  | ImpactClip
  | FireClip
  | RepairClip
  | PowderClip
  | SoulsClip
  | StatusClip
  | DrawClip
  | SellClip
  | PassClip
  | StealClip
  | DiscardClip
  | PeekClip
  | DiceClip
  | FireOutClip
  | AbilityClip
  | EndClip
  | FallbackClip;

export type FxKind = FxClip['kind'];

/** The clips of one action; `quiet` — indices of events that show nothing by themselves. */
export type FxPlan = FxClip[] & { quiet: number[] };

/** Projectile by the target's track. */
export const KIND_BY_TRACK: Record<Track, BallKind> = { hull: 'core', guns: 'core', sails: 'chain', crew: 'grape' };

/** Term → where it comes from, guessed by its text `what` when the event has no `src` (events before A1). */
const SRC_BY_WHAT: Record<string, TermSrc['kind']> = {
  'Пушки': 'guns', 'диагональ': 'diag', 'совместный залп': 'joint', 'всплытие': 'surface',
  'доплата Порохом': 'paid', 'Чёрная метка': 'mark', 'Ясное небо': 'clear', 'Поднять флаги!': 'flags', 'Буря': 'sea',
};

interface TermCtx {
  cards: FxCards;
  charge: string | null;
  chargeName: string | null;
  reactions: VolReaction[];
}

export function termSrc(t: Term & { src?: TermSrc }, ctx: TermCtx): TermSrc {
  if (t.src) return t.src;
  const k = SRC_BY_WHAT[t.what];
  if (k) return { kind: k } as TermSrc;
  if (ctx.chargeName && t.what === ctx.chargeName) return { kind: 'charge', card: ctx.charge };
  const r = ctx.reactions.find((x) => ctx.cards[x.card] && ctx.cards[x.card]!.name === t.what);
  if (r) return { kind: 'reaction', card: r.card };
  return { kind: 'extra' }; // the bonus of an Order («Всплытие», «Зомби у пушек») and anything new
}

/** Kind of an extra ball by the source of the plus. */
function plusKind(src: TermSrc, base: BallKind, chargeFx: Fx | null): BallKind {
  switch (src.kind) {
    case 'surface': return 'under';
    case 'paid': return 'keg';
    case 'joint': return 'joint';
    case 'mark': return 'mark';
    case 'clear': return 'gold';
    case 'flags': return 'flag';
    case 'charge':
      if (!chargeFx) return base;
      if (chargeFx.fire) return 'fire';
      if (chargeFx.if_fire) return 'hot';
      if (chargeFx.if_damaged) return 'ghost';
      if (chargeFx.no_react && chargeFx.no_diag) return 'under';
      return base;
    case 'extra': return 'under';
    default: return base;
  }
}

/** How a ball misses, by the source of the minus. */
function minusOut(src: TermSrc, cards: FxCards): ShotOut {
  if (src.kind === 'diag') return 'water';
  if (src.kind === 'sea') return 'wind';
  if (src.kind === 'reaction') {
    const r = cards[src.card] && cards[src.card]!.fx ? cards[src.card]!.fx.r : null;
    if (r === 'redirect') return 'stick';
    if (r === 'reduce_all') return 'whirl';
    if (r === 'cancel_crew') return 'block';
    return 'bounce';
  }
  return 'water';
}

/** What layoutShots needs of a hit. */
export type ShotInput = Pick<ShotClip, 'track' | 'damage' | 'terms' | 'amount' | 'toHull' | 'charge' | 'reactions' | 'chargeCancelled' | 'sea'>;

/**
 * The balls of one hit; a ball is 1 damage. Balls that arrive (hit + overkill + moon) sum to `damage`,
 * hit with `to: 'track'` to `amount`, with `to: 'hull'` to `toHull`. Minuses are balls that fall short.
 */
export function layoutShots(shot: ShotInput, cards: FxCards): Shot[] {
  const base = KIND_BY_TRACK[shot.track];
  const ctx: TermCtx = { cards, charge: shot.charge, chargeName: shot.charge && cards[shot.charge] ? cards[shot.charge]!.name : null, reactions: shot.reactions || [] };
  const chargeFx = shot.charge && !shot.chargeCancelled && cards[shot.charge] ? cards[shot.charge]!.fx : null;
  const balls: Shot[] = [];
  const terms = shot.terms || [];
  let guns = 0;
  for (const t of terms) if (termSrc(t, ctx).kind === 'guns') guns += t.n;
  for (let i = 0; i < guns; i++) balls.push({ kind: base, out: 'hit', label: null, units: 1, to: null });
  for (const t of terms) {
    const src = termSrc(t, ctx);
    if (t.n <= 0 || src.kind === 'guns') continue;
    const kind = plusKind(src, base, chargeFx);
    for (let j = 0; j < t.n; j++) balls.push({ kind, out: 'hit', label: j === 0 ? `${t.what} +${t.n}` : null, units: 1, to: null, plus: src.kind });
  }
  // Minuses stop the last arriving balls: plain ones first, then the extra ones.
  const knock = (n: number, out: ShotOut, label: string) => {
    for (let j = 0; j < n; j++) {
      let k = -1;
      for (let q = guns - 1; q >= 0; q--) if (balls[q].out === 'hit') { k = q; break; }
      if (k < 0) for (let q = balls.length - 1; q >= 0; q--) if (balls[q].out === 'hit') { k = q; break; }
      if (k < 0) return;
      balls[k].out = out; balls[k].label = j === 0 ? label : null;
    }
  };
  for (const t of terms) {
    if (t.n >= 0) continue;
    const src = termSrc(t, ctx);
    knock(-t.n, minusOut(src, cards), `${t.what} −${-t.n}`);
  }
  // Damage below the sum of the terms — a cancel without a term («Зомби-офицеры», «Морская пехота»).
  const live = () => balls.filter((b) => b.out === 'hit').length;
  const extra = live() - shot.damage;
  if (extra > 0) {
    const cc = [...(shot.reactions || [])].reverse().find((x) => cards[x.card] && cards[x.card]!.fx && cards[x.card]!.fx.r === 'cancel_crew');
    knock(extra, cc ? 'block' : 'water', cc ? `${cards[cc.card]!.name} −${extra}` : `−${extra}`);
  }
  while (live() < shot.damage) balls.push({ kind: base, out: 'hit', label: null, units: 1, to: null });
  // Where the arriving balls go: amount — the track, toHull — the Hull, the rest is overkill (sinking, «Джек», «Лунный свет»).
  let a = shot.amount || 0, h = shot.toHull || 0, moon = shot.sea === 'moon' && shot.track === 'crew' ? 1 : 0;
  for (const b of balls) {
    if (b.out !== 'hit') continue;
    if (a > 0) { b.to = 'track'; a--; }
    else if (h > 0) { b.to = 'hull'; h--; }
    else if (moon > 0) { b.out = 'moon'; b.label = 'Лунный свет −1'; moon--; }
    else { b.out = 'overkill'; }
  }
  // More than 8 balls — the biggest group of equal balls is merged into one big «×N».
  if (balls.length > 8) {
    const key = (b: Shot) => `${b.kind}|${b.out}|${b.to}`;
    const groups: Record<string, number[]> = {};
    balls.forEach((b, i) => { (groups[key(b)] = groups[key(b)] || []).push(i); });
    const big = Object.values(groups).sort((x, y) => y.length - x.length)[0];
    const excess = balls.length - 8;
    const merge = big.slice(big.length - excess - 1);
    const keep = balls[merge[0]];
    keep.units = merge.reduce((n, i) => n + balls[i].units, 0);
    keep.big = true; keep.label = `×${keep.units}`;
    const drop = new Set(merge.slice(1));
    return balls.filter((_, i) => !drop.has(i));
  }
  return balls;
}

/** Events a context clip may take in while it is the last one. */
export const ABSORB: Partial<Record<FxKind, GameEvent['type'][]>> = {
  card: ['damage', 'restored', 'drew', 'powderGained', 'powderLost', 'flagSet', 'turnFlag', 'limitRaised', 'stolen', 'passed', 'discarded', 'shown', 'seaLooked', 'dice', 'fireAdded', 'soulsSpent', 'soulsGained', 'deckReshuffled', 'swapped'],
  legend: ['damage', 'sunk', 'jonesFree', 'restored', 'soulsGained', 'fireAdded'],
  jack: ['swapped'],
  round: ['seaRevealed'],
  sea: ['seaEffect', 'damage', 'restored', 'powderGained', 'powderLost', 'swapped', 'soulsGained'],
  turn: ['powderGained', 'fireDamage', 'damage', 'surfaced', 'seaEffect', 'swapped', 'drew', 'deckReshuffled', 'soulsGained'],
  heart: ['damage'],
  swap: ['swapped'],
  ability: ['swapped', 'limitRaised', 'restored'],
  sell: ['powderGained'],
  repair: ['soulsUsed'],
  turnEnd: ['turnEnded'],
  counter: ['damage', 'fireAdded', 'soulsGained'],
};

/** Events that show nothing by themselves (they belong to neighbouring clips). */
export const QUIET = new Set<GameEvent['type']>(['noReaction', 'cardResolved', 'deckReshuffled']);

export interface PlannerOptions {
  cards: FxCards;
  ships: Record<string, { side: Side }>;
  /** Seats the events are seen by; the first one decides which side is «mine». */
  viewer: readonly string[];
  /** Code of the current sea card. */
  sea?: string | null;
  /** Sea card code → its key («storm», «moon» …). */
  seaKey?: (code: string) => string;
}

interface Vol {
  shooter: string;
  target: string;
  charge: string | null;
  part: number;
  reactions: VolReaction[];
  announce?: AnnounceClip;
}

export interface PlannerState {
  sea: string | null;
  vol: Vol | null;
  lastShot: { shooter: string; target: string; charge: string | null; part: number; cancelled?: boolean } | null;
  card: string | null;
  counter: { from: string; against: string; card: string } | null;
  noReact: Record<string, boolean>;
  noReactSide: Record<string, boolean>;
  shot: ShotClip | null;
  phase: ReactionWindow | null;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type ClipInput = DistributiveOmit<FxClip, 'ev'>;
type Cost = { reason: string; side?: Side; ship?: string; amount: number; i: number };
/** Fields of the action the planner reads. */
type ActionLike = { target?: string } | null | undefined;

export function createPlanner(opts: PlannerOptions) {
  const cards = opts.cards;
  const ships = opts.ships;
  const mySide = ships[opts.viewer[0]].side;
  const st: PlannerState = {
    sea: opts.sea || null, // the key of the current sea card
    vol: null, // a declared Volley waiting for its shot
    lastShot: null, // the last shot (for the «after» window and the second part of «Залп с обоих бортов»)
    card: null, // the card being played (cardPlayed … cardResolved)
    counter: null, // a Reaction's answer: { from, against, card }
    noReact: {}, // ships that may not play Reactions till the end of the turn
    noReactSide: {},
    shot: null, // an open hit: waiting for its damage events
    phase: null, // phase of the last Reaction window: before | after
  };
  const seaKey = opts.seaKey || ((code: string) => code);

  function feed(events: GameEvent[], action?: ActionLike): FxPlan {
    const out = [] as unknown as FxPlan;
    const costs: Cost[] = [];
    const quiet: number[] = [];
    const last = (): FxClip | undefined => out[out.length - 1];
    const push = <T extends ClipInput>(clip: T, i?: number): T & { ev: number[] } => {
      const c = clip as T & { ev: number[] };
      c.ev = i === undefined ? [] : [i];
      out.push(c as unknown as FxClip);
      return c;
    };
    const take = (reason: string) => { const k = costs.findIndex((x) => x.reason === reason); if (k < 0) return null; const c = costs.splice(k, 1)[0]; return c; };
    const absorb = (e: GameEvent, i: number, kinds?: FxKind[]) => {
      const c = last();
      if (!c || !ABSORB[c.kind] || !ABSORB[c.kind]!.includes(e.type)) return null;
      if (kinds && !kinds.includes(c.kind)) return null;
      c.ev.push(i);
      (c.effects = c.effects || []).push(e);
      return c;
    };
    const closeShot = () => {
      const s = st.shot;
      if (!s) return;
      s.shots = layoutShots(s, cards);
      st.shot = null;
    };

    events.forEach((e, i) => {
      if (st.shot && !(e.type === 'damage' && e.ship === st.shot.target) && !(e.type === 'soulsGained') && !(e.type === 'fireAdded' && e.ship === st.shot.target)) closeShot();
      switch (e.type) {
        case 'powderSpent': costs.push({ reason: e.reason, side: e.side, amount: e.amount, i }); return;
        case 'soulsSpent': {
          if (st.card && absorb(e, i, ['card'])) return;
          costs.push({ reason: 'souls', ship: e.ship, amount: e.amount, i });
          return;
        }

        case 'volley': {
          const prev = st.lastShot;
          const fx: Fx = e.charge && cards[e.charge] ? cards[e.charge]!.fx : {};
          const part2 = !!(prev && prev.part === 1 && prev.shooter === e.ship && e.charge && prev.charge === e.charge && fx.both);
          const cv = take('volley'), cc = part2 ? null : take('card');
          const terms = (e as { terms?: Term[] }).terms;
          const clip = push({
            kind: 'announce', shooter: e.ship, target: e.target, track: e.track || 'hull', charge: e.charge, chargeFrom: e.chargeFrom,
            captain: !!(e.chargeFrom && e.chargeFrom !== e.ship), diagonal: e.diagonal, joint: e.joint, damage: e.damage,
            terms: terms || null, part: part2 ? 2 : 1, heart: !!(last() && last()!.kind === 'heart'), byCard: st.card,
            cost: { volley: cv ? cv.amount : 0, card: cc ? cc.amount : 0 },
            noReact: !!(fx.no_react || st.noReact[e.target] || st.noReactSide[ships[e.ship].side]),
            noDiagBy: e.diagonal && fx.no_diag ? e.charge : null,
          }, i);
          if (cv) clip.ev.push(cv.i); if (cc) clip.ev.push(cc.i);
          st.vol = { shooter: e.ship, target: e.target, charge: e.charge, part: clip.part, reactions: [], announce: clip };
          st.counter = null;
          return;
        }
        case 'windowOpened': {
          st.phase = e.window;
          push({ kind: 'window', side: e.side, phase: e.window, mine: e.side === mySide, forCard: !st.vol && !!st.card, seats: e.seats }, i);
          return;
        }
        case 'reaction': {
          const fx: Fx = cards[e.card] ? cards[e.card]!.fx : {};
          const cr = take('reaction');
          const clip = push({ kind: 'reaction', seat: e.seat, ship: e.ship, card: e.card, r: fx.r, fromPlan: e.fromPlan,
            cost: cr ? cr.amount : 0, phase: st.vol ? 'before' : st.phase === 'after' ? 'after' : 'card', mine: ships[e.ship].side === mySide }, i);
          if (cr) clip.ev.push(cr.i);
          if (st.vol) st.vol.reactions.push({ card: e.card, ship: e.ship, r: fx.r });
          if (fx.counter) {
            const against = st.vol ? st.vol.shooter : st.lastShot ? st.lastShot.shooter : null;
            st.counter = against ? { from: e.ship, against, card: e.card } : null;
          }
          return;
        }
        case 'hit': {
          const v: Vol = st.vol || { shooter: e.ship, target: e.target, charge: null, part: 1, reactions: [] };
          const cancelCharge = v.reactions.some((x) => x.r === 'cancel_charge');
          st.shot = push({ kind: 'shot', shooter: e.ship, declared: v.target, target: e.target, track: e.track, damage: e.damage, terms: e.terms,
            charge: v.charge, chargeCancelled: cancelCharge, reactions: v.reactions, part: v.part, amount: 0, toHull: 0, souls: 0, fire: 0, sea: st.sea ? seaKey(st.sea) : null }, i);
          st.lastShot = { shooter: e.ship, target: e.target, charge: v.charge, part: v.part };
          st.vol = null;
          return;
        }
        case 'volleyCancelled': {
          const v: Partial<Vol> & { reactions: VolReaction[] } = st.vol || { reactions: [] };
          const by = v.reactions[v.reactions.length - 1] || null;
          push({ kind: 'cancel', shooter: e.ship, target: e.target, by: by ? by.card : null, r: by ? by.r : null, charge: v.charge || null }, i);
          st.lastShot = { shooter: e.ship, target: e.target, charge: v.charge || null, part: v.part || 1, cancelled: true };
          st.vol = null;
          return;
        }
        case 'damage': {
          if (st.shot && e.ship === st.shot.target) { st.shot.amount += e.amount; st.shot.toHull += e.toHull; st.shot.ev.push(i); return; }
          if (st.counter && e.ship === st.counter.against) {
            const c = last();
            if (c && c.kind === 'counter' && c.to === e.ship) { c.hits.push({ track: e.track, amount: e.amount, toHull: e.toHull }); c.ev.push(i); return; }
            push({ kind: 'counter', from: st.counter.from, to: e.ship, card: st.counter.card, hits: [{ track: e.track, amount: e.amount, toHull: e.toHull }], fire: 0 }, i);
            return;
          }
          const lc = last();
          if (lc && lc.kind === 'heart' && e.ship === lc.ship && e.track === 'crew') { lc.crew += e.amount + e.toHull; lc.ev.push(i); return; }
          if (absorb(e, i, ['card', 'legend', 'sea', 'turn'])) return;
          push({ kind: 'impact', ship: e.ship, track: e.track, amount: e.amount, toHull: e.toHull, cause: st.card || null }, i);
          return;
        }
        case 'fireAdded': {
          if (st.shot && e.ship === st.shot.target) { st.shot.fire = e.fires; st.shot.ev.push(i); return; }
          const c = last();
          if (c && c.kind === 'counter' && c.to === e.ship) { c.fire = e.fires; c.ev.push(i); return; }
          if (absorb(e, i, ['card', 'legend'])) return;
          push({ kind: 'fire', ship: e.ship, fires: e.fires }, i);
          return;
        }
        case 'soulsGained': {
          if (st.shot) { st.shot.souls += e.amount; st.shot.ev.push(i); return; }
          const c = last();
          if (c && (c.kind === 'counter' || c.kind === 'impact' || c.kind === 'card' || c.kind === 'legend' || c.kind === 'sea' || c.kind === 'turn')) { c.souls = (c.souls || 0) + e.amount; c.ev.push(i); return; }
          push({ kind: 'souls', ship: e.ship, n: e.amount }, i);
          return;
        }
        case 'sunk': {
          if (absorb(e, i, ['legend'])) return;
          push({ kind: 'sink', ship: e.ship }, i);
          return;
        }
        case 'jackEscaped': {
          const cr = take('reaction');
          const clip = push({ kind: 'jack', ship: e.ship, cost: cr ? cr.amount : 0 }, i);
          if (cr) clip.ev.push(cr.i);
          return;
        }
        case 'legendPlayed': {
          const cc = take('card'), cs = take('souls');
          // soulCost — Souls spent (the price of «Кракен»); souls — Souls gained by the Legend's effects.
          const clip = push({ kind: 'legend', seat: e.seat, card: e.card, target: e.target, cost: cc ? cc.amount : 0, soulCost: cs ? cs.amount : 0, souls: 0, effects: [] }, i);
          if (cc) clip.ev.push(cc.i); if (cs) clip.ev.push(cs.i);
          return;
        }
        case 'cardPlayed': {
          const cc = take('card');
          const clip = push({ kind: 'card', seat: e.seat, ship: e.ship, card: e.card, target: action && action.target ? action.target : null, cost: cc ? cc.amount : 0, effects: [] }, i);
          if (cc) clip.ev.push(cc.i);
          st.card = e.card;
          return;
        }
        case 'cardResolved': {
          if (e.card === st.card) st.card = null;
          if (e.to === 'stolen') { push({ kind: 'steal', seat: e.seat, card: e.card, after: true }, i); return; }
          const c = last();
          if (c && (c.kind === 'legend' || c.kind === 'card') && c.card === e.card) { c.ev.push(i); c.resolvedTo = e.to; return; }
          quiet.push(i);
          return;
        }
        case 'cardCancelled': case 'cardLost':
          push({ kind: 'cancel', card: e.card, lost: e.type === 'cardLost', by: null }, i);
          return;
        case 'roundStarted': push({ kind: 'round', round: e.round }, i); return;
        case 'seaRevealed': {
          st.sea = e.card;
          const c = last();
          const round = c && c.kind === 'round' ? c : push({ kind: 'round', round: null }, undefined);
          // The round clip becomes the sea clip in place (same object, same field order as the reference).
          const clip = Object.assign(round, { kind: 'sea', card: e.card, key: seaKey(e.card), reshuffled: e.reshuffled, effects: [] }) as unknown as SeaClip;
          clip.ev.push(i);
          const cs = take('sea'); if (cs) clip.ev.push(cs.i);
          return;
        }
        case 'seaEffect': {
          if (absorb(e, i, ['sea', 'turn'])) return;
          push({ kind: 'fallback', type: e.type, key: e.key }, i);
          return;
        }
        case 'turnStarted': st.noReact = {}; st.noReactSide = {}; st.card = null; push({ kind: 'turn', side: e.side, mine: e.side === mySide, effects: [] }, i); return;
        case 'turnEnded': {
          const c = last();
          if (c && c.kind === 'turnEnd') { c.ev.push(i); return; }
          push({ kind: 'turnEnd', side: e.side, plans: null }, i);
          return;
        }
        case 'planned': push({ kind: 'turnEnd', side: ships[e.seat].side, plans: { seat: e.seat, count: e.count } }, i); return;
        case 'heart': push({ kind: 'heart', ship: e.ship, crew: 0 }, i); return;
        case 'regrouped': {
          const cr = take('regroup');
          const clip = push({ kind: 'swap', side: e.side, reason: 'regroup', ships: e.ships, cost: cr ? cr.amount : 0 }, i);
          if (cr) clip.ev.push(cr.i);
          return;
        }
        case 'swapped': {
          if (absorb(e, i, ['swap', 'jack', 'sea', 'turn', 'ability', 'card'])) return;
          push({ kind: 'swap', side: e.side, reason: e.reason, ships: e.ships, cost: 0 }, i);
          return;
        }
        case 'sword': case 'treasury': {
          const ca = take('ability');
          const clip = push({ kind: 'ability', what: e.type, ship: e.ship, cost: ca ? ca.amount : 0 }, i);
          if (ca) clip.ev.push(ca.i);
          return;
        }
        case 'jonesFree': {
          if (absorb(e, i, ['legend'])) return;
          push({ kind: 'ability', what: 'jonesFree', ship: e.ship, cost: 0 }, i);
          return;
        }
        case 'dived': push({ kind: 'dive', ship: e.ship }, i); return;
        case 'surfaced': {
          if (absorb(e, i, ['turn'])) return;
          push({ kind: 'surface', ship: e.ship }, i);
          return;
        }
        case 'fireDamage': {
          if (absorb(e, i, ['turn'])) return;
          push({ kind: 'impact', ship: e.ship, track: 'hull', amount: 0, toHull: 0, cause: 'fire' }, i);
          return;
        }
        case 'restored': {
          if (absorb(e, i, ['card', 'legend', 'sea', 'ability'])) return;
          push({ kind: 'repair', ship: e.ship, track: e.track, amount: e.amount, cause: st.card }, i);
          return;
        }
        case 'soulsUsed': {
          const c = last();
          if (c && c.kind === 'repair' && c.ship === e.ship) { c.ev.push(i); c.cause = 'souls'; return; }
          push({ kind: 'souls', ship: e.ship, n: -1 }, i);
          return;
        }
        case 'powderGained': {
          if (absorb(e, i, ['turn', 'sea', 'card', 'sell'])) return;
          push({ kind: 'powder', side: e.side, n: e.amount, burned: e.burned, reason: e.reason }, i);
          return;
        }
        case 'powderLost': {
          if (absorb(e, i, ['sea', 'card'])) return;
          push({ kind: 'powder', side: e.side, n: -e.amount, reason: 'lost' }, i);
          return;
        }
        case 'drew': {
          if (absorb(e, i, ['turn', 'card'])) return;
          push({ kind: 'draw', seat: e.seat, count: e.count, cards: (e as { cards?: string[] }).cards || null }, i);
          return;
        }
        case 'sold': push({ kind: 'sell', seat: e.seat, card: e.card }, i); return;
        case 'passed': if (absorb(e, i, ['card'])) return; push({ kind: 'pass', seat: e.seat, to: e.to, card: e.card }, i); return;
        case 'stolen': if (absorb(e, i, ['card'])) return; push({ kind: 'steal', seat: e.seat, from: e.from, card: e.card }, i); return;
        case 'discarded': if (absorb(e, i, ['card'])) return; push({ kind: 'discard', seat: e.seat, card: e.card }, i); return;
        case 'shown': if (absorb(e, i, ['card'])) return; push({ kind: 'peek', seat: e.seat, to: e.to }, i); return;
        case 'seaLooked': if (absorb(e, i, ['card'])) return; push({ kind: 'peek', seat: e.seat, sea: true }, i); return;
        case 'dice': if (absorb(e, i, ['card'])) return; push({ kind: 'dice', cards: e.cards, winner: e.winner }, i); return;
        case 'fireOut': push({ kind: 'fireOut', seat: e.seat, card: e.card, fires: e.fires }, i); return;
        case 'flagSet': {
          if (e.flag === 'noReact') st.noReact[e.ship] = true;
          if (absorb(e, i, ['card'])) return;
          push({ kind: 'status', ship: e.ship, flag: e.flag }, i);
          return;
        }
        case 'turnFlag': {
          if (e.flag === 'noReactTeam') st.noReactSide[e.side] = true;
          if (absorb(e, i, ['card'])) return;
          push({ kind: 'status', side: e.side, flag: e.flag, n: e.n }, i);
          return;
        }
        case 'limitRaised': if (absorb(e, i, ['card', 'ability'])) return; push({ kind: 'status', ship: e.ship, flag: 'limit', n: e.n }, i); return;
        case 'gameOver': push({ kind: 'end', winner: e.winner, reason: e.reason }, i); return;
        case 'conceded': push({ kind: 'end', winner: null, reason: 'concede', side: e.side }, i); return;
        default:
          if (QUIET.has(e.type)) { quiet.push(i); return; }
          push({ kind: 'fallback', type: e.type }, i);
      }
    });
    closeShot();
    // Powder and Souls nobody took (the price of an unknown action) — separate clips.
    for (const c of costs) {
      if (c.reason === 'souls') push({ kind: 'souls', side: c.side, ship: c.ship, n: -c.amount, reason: c.reason }, c.i);
      else push({ kind: 'powder', side: c.side, ship: c.ship, n: -c.amount, reason: c.reason }, c.i);
    }
    out.quiet = quiet;
    return out;
  }
  return { feed, state: st };
}

export type Planner = ReturnType<typeof createPlanner>;
