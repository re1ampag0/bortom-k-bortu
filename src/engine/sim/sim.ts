// Bot games and their statistics (docs/TZ.md, «Проверки → Эталон баланса»; reference/sim.py run and report).
// Pure: the same code runs in the console (scripts/sim.ts), in tests and later in a Web Worker.
import { botAnswer, botTurn, newBotMemory, type BotFeedback } from '../ai/bot';
import { applyAction, createGame } from '../engine';
import { createRng } from '../rng';
import { RuleError, cardByCode, type Action, type GameEvent, type GameState, type Variant, type Winner } from '../state';
import type { GameData, Side } from '../types';

export const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];

/** Counters of one side, summed over games (names as in sim.py Game.stat). */
export interface SideStats {
  turns: number;
  income: number;
  spentVolley: number;
  spentCards: number;
  spentReactions: number;
  spentAbilities: number;
  wasted: number;
  turnsPowderZero: number;
  turnsPowderLeft3: number;
  cardsPlayed: number;
  /** Cards played by their cost in Powder: index 0–3. */
  tiers: number[];
  sold: number;
  reactions: number;
  legends: number;
  /** Detailed counters: «play:<card name>», volleys, abilities. For the balance lab and comparisons with sim.py. */
  counts: Record<string, number>;
}

export interface GameResult {
  seed: number;
  winner: Winner;
  rounds: number;
  actions: number;
  stats: Record<Side, SideStats>;
}

export interface SimOptions {
  games: number;
  seed: number;
  variant?: Variant;
  /** Called with every state of every game: tests check invariants with it. */
  onState?: (state: GameState) => void;
}

export interface SimResult {
  games: number;
  wins: Record<Winner, number>;
  rounds: number[];
  stats: Record<Side, SideStats>;
}

function newSideStats(): SideStats {
  return {
    turns: 0,
    income: 0,
    spentVolley: 0,
    spentCards: 0,
    spentReactions: 0,
    spentAbilities: 0,
    wasted: 0,
    turnsPowderZero: 0,
    turnsPowderLeft3: 0,
    cardsPlayed: 0,
    tiers: [0, 0, 0, 0],
    sold: 0,
    reactions: 0,
    legends: 0,
    counts: {},
  };
}

/** A game too long for bots means a bug in the bots or the engine. */
const MAX_GAME_ACTIONS = 20000;

/** One game of two bot teams. Throws on anything but a refused bot move (RuleError). */
export function playGame(data: GameData, seed: number, variant: Variant = 'standard', onState?: (s: GameState) => void): GameResult {
  const mem = newBotMemory(seed ^ 0x2545f491);
  const stats: Record<Side, SideStats> = { ПИРАТЫ: newSideStats(), КОМПАНИЯ: newSideStats() };
  const created = createGame(data, { seed, variant });
  let state = created.state;
  // The first round starts inside createGame: the Pirates' first Hold is among its events.
  record(data, stats, state, null, created.events);
  onState?.(state);
  let actions = 0;

  const apply = (action: Action) => {
    if (++actions > MAX_GAME_ACTIONS) throw new Error(`Game ${seed}: more than ${MAX_GAME_ACTIONS} actions`);
    const before = state;
    const r = applyAction(state, action, data);
    state = r.state;
    record(data, stats, before, action, r.events);
    onState?.(state);
  };
  /** Bots answer every pending decision. */
  const settle = () => {
    while (state.pending && !state.winner) apply(botAnswer(state, data, mem));
  };

  settle();
  while (!state.winner) {
    const turnOf = `${state.round}:${state.active}`;
    const side = state.active;
    let ended = false;
    const turn = botTurn(state, data, mem.rng);
    let next = turn.next();
    while (!next.done && !state.winner) {
      let feedback: BotFeedback;
      try {
        apply(next.value);
        if (next.value.type === 'endTurn') ended = true;
        feedback = { state };
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
        feedback = { state, error: e.message };
        // Moves the engine refused: sim.py allows them, RULES.md does not (RULES.md 21).
        const c = stats[side].counts;
        const key = `refused:${next.value.type}:${e.message}`;
        c[key] = (c[key] ?? 0) + 1;
      }
      settle();
      feedback.state = state;
      next = turn.next(feedback);
    }
    // The game ended in the middle of the bot's turn: the turn counts, as in sim.py.
    if (state.winner && !ended) turnOver(stats[side], state.teams[side].powder);
    if (!state.winner && `${state.round}:${state.active}` === turnOf) {
      throw new Error(`Game ${seed}: the bot of ${state.active} did not end its turn in round ${state.round}`);
    }
  }
  return { seed, winner: state.winner, rounds: state.round, actions, stats };
}

/** A finished turn and the Powder left in the Hold. */
function turnOver(st: SideStats, powder: number): void {
  st.turns++;
  if (powder >= 3) st.turnsPowderLeft3++;
  if (powder === 0) st.turnsPowderZero++;
}

/** Counts what sim.py counts: Powder by purpose, cards by cost, Reactions, Legends, turns by Powder left. */
function record(data: GameData, stats: Record<Side, SideStats>, before: GameState, action: Action | null, events: GameEvent[]): void {
  const sideOf = (seat: string) => before.ships[seat].side;
  const count = (side: Side, key: string) => {
    const c = stats[side].counts;
    c[key] = (c[key] ?? 0) + 1;
  };
  const tier = (side: Side, code: string) => {
    const st = stats[side];
    const card = cardByCode(data, code);
    st.cardsPlayed++;
    st.tiers[Math.min(3, card.cost)]++;
    count(side, `play:${card.name}`);
  };
  if (action?.type === 'endTurn') turnOver(stats[action.side], before.teams[action.side].powder);
  // A Charge is played with its Volley (sim.py counts it as a card).
  if (action?.type === 'volley' && action.charge) tier(before.ships[action.ship].side, action.charge);
  // «Сырой порох» burns Powder; «Ограбление банка» also takes it, but that Powder is not wasted.
  const wet = events.some((e) => e.type === 'seaEffect' && e.key === 'wet');
  for (const e of events) {
    switch (e.type) {
      case 'powderGained':
        stats[e.side].income += e.amount;
        stats[e.side].wasted += e.burned;
        stats[e.side].counts[`income:${e.reason}`] = (stats[e.side].counts[`income:${e.reason}`] ?? 0) + e.amount;
        break;
      case 'powderLost':
        if (wet) stats[e.side].wasted += e.amount;
        break;
      case 'powderSpent': {
        const st = stats[e.side];
        if (e.reason === 'volley') st.spentVolley += e.amount;
        else if (e.reason === 'card' || e.reason === 'sea') st.spentCards += e.amount;
        else if (e.reason === 'reaction') st.spentReactions += e.amount;
        else st.spentAbilities += e.amount;
        break;
      }
      case 'cardPlayed':
        tier(sideOf(e.seat), e.card);
        break;
      case 'legendPlayed':
        tier(sideOf(e.seat), e.card);
        stats[sideOf(e.seat)].legends++;
        break;
      case 'jackEscaped':
        stats[sideOf(e.ship)].legends++;
        count(sideOf(e.ship), 'jackEscape');
        break;
      case 'reaction':
        stats[sideOf(e.seat)].reactions++;
        count(sideOf(e.seat), `play:${cardByCode(data, e.card).name}`);
        break;
      // A Volley either hits or is cancelled; both count as fired, as in sim.py.
      case 'hit':
        count(sideOf(e.ship), 'volleys');
        break;
      case 'volleyCancelled':
        count(sideOf(e.ship), 'volleys');
        count(sideOf(e.ship), 'volleysCancelled');
        break;
      case 'heart':
      case 'treasury':
      case 'sword':
      case 'dived':
        count(sideOf(e.ship), e.type);
        break;
      case 'regrouped':
        count(e.side, 'regroups');
        break;
      case 'fireOut':
        count(sideOf(e.seat), 'firesOut');
        break;
      case 'soulsUsed':
        count(sideOf(e.ship), 'soulsSpent');
        break;
      case 'sold':
        stats[sideOf(e.seat)].sold++;
        break;
    }
  }
}

function addStats(to: SideStats, from: SideStats): void {
  for (const key of Object.keys(to) as (keyof SideStats)[]) {
    if (key === 'tiers') to.tiers = to.tiers.map((n, i) => n + from.tiers[i]);
    else if (key === 'counts') for (const [k, n] of Object.entries(from.counts)) to.counts[k] = (to.counts[k] ?? 0) + n;
    else to[key] += from[key];
  }
}

/** Many games; each game's seed comes from the main seed, so the run is reproducible. */
export function runSims(data: GameData, options: SimOptions): SimResult {
  const seeds = createRng(options.seed);
  const out: SimResult = {
    games: options.games,
    wins: { ПИРАТЫ: 0, КОМПАНИЯ: 0, НИЧЬЯ: 0 },
    rounds: [],
    stats: { ПИРАТЫ: newSideStats(), КОМПАНИЯ: newSideStats() },
  };
  for (let i = 0; i < options.games; i++) {
    const g = playGame(data, seeds.int(2 ** 31), options.variant, options.onState);
    out.wins[g.winner]++;
    out.rounds.push(g.rounds);
    for (const side of SIDES) addStats(out.stats[side], g.stats[side]);
  }
  return out;
}

/** Numbers of the PDF table (page 26) for one run. */
export interface Summary {
  pirates: number;
  company: number;
  draws: number;
  roundsMean: number;
  rounds10: number;
  rounds90: number;
  /** Per turn of the side, Powder; shares in percent; legends per game. */
  sides: Record<
    Side,
    {
      income: number;
      volley: number;
      cards: number;
      reactions: number;
      abilities: number;
      wasted: number;
      emptyHold: number;
      left3: number;
      cardsPlayed: number;
      paidCards: number;
      sold: number;
      reactionsPlayed: number;
      legends: number;
    }
  >;
}

export function summarize(r: SimResult): Summary {
  const n = r.games;
  const sorted = [...r.rounds].sort((a, b) => a - b);
  const sides = {} as Summary['sides'];
  for (const side of SIDES) {
    const st = r.stats[side];
    const per = (x: number) => x / Math.max(1, st.turns);
    sides[side] = {
      income: per(st.income),
      volley: per(st.spentVolley),
      cards: per(st.spentCards),
      reactions: per(st.spentReactions),
      abilities: per(st.spentAbilities),
      wasted: per(st.wasted),
      emptyHold: per(st.turnsPowderZero) * 100,
      left3: per(st.turnsPowderLeft3) * 100,
      cardsPlayed: per(st.cardsPlayed),
      paidCards: per(st.tiers[1] + st.tiers[2] + st.tiers[3]),
      sold: per(st.sold),
      reactionsPlayed: per(st.reactions),
      legends: st.legends / n,
    };
  }
  return {
    pirates: (r.wins.ПИРАТЫ / n) * 100,
    company: (r.wins.КОМПАНИЯ / n) * 100,
    draws: (r.wins.НИЧЬЯ / n) * 100,
    roundsMean: r.rounds.reduce((a, b) => a + b, 0) / n,
    rounds10: sorted[Math.floor(n / 10)],
    rounds90: sorted[Math.floor((n * 9) / 10)],
    sides,
  };
}

/** The reference of PDF page 26 («Полная игра (версия 0.3)», «Куда уходит Порох»). */
export const PDF_REFERENCE: Summary = {
  pirates: 47,
  company: 53,
  draws: 0,
  roundsMean: 4.6,
  rounds10: 3,
  rounds90: 6,
  sides: {
    ПИРАТЫ: { income: 3.7, volley: 1.5, cards: 1.4, reactions: 0.4, abilities: 0.0, wasted: 0.0, emptyHold: 14, left3: NaN, cardsPlayed: 2.8, paidCards: 1.1, sold: NaN, reactionsPlayed: NaN, legends: 0.7 },
    КОМПАНИЯ: { income: 3.9, volley: 1.5, cards: 2.1, reactions: 0.1, abilities: 0.3, wasted: 0.1, emptyHold: 12, left3: NaN, cardsPlayed: 2.9, paidCards: 1.5, sold: NaN, reactionsPlayed: NaN, legends: 1.2 },
  },
};

const nanSide = Object.fromEntries(Object.keys(PDF_REFERENCE.sides.ПИРАТЫ).map((k) => [k, NaN])) as Summary['sides'][Side];

/** References of PDF page 26 by variant: «Первая партия» has only the winners and the rounds. */
export const PDF_REFERENCES: Partial<Record<Variant, Summary>> = {
  standard: PDF_REFERENCE,
  first: {
    pirates: 50,
    company: 50,
    draws: 0,
    roundsMean: 5.1,
    rounds10: NaN,
    rounds90: NaN,
    sides: { ПИРАТЫ: nanSide, КОМПАНИЯ: nanSide },
  },
};

function fmt(x: number, digits = 1): string {
  if (Number.isNaN(x)) return '—';
  const r = Number(x.toFixed(digits));
  return (r === 0 ? 0 : r).toFixed(digits).replace('.', ',');
}

/** A plain-text table: this run next to the PDF; the difference in points for shares. */
export function formatReport(sum: Summary, label: string, ref: Summary | null = PDF_REFERENCE): string {
  const rows: [string, number, number, number][] = [
    ['Победы Пиратов, %', sum.pirates, ref?.pirates ?? NaN, 1],
    ['Победы Компании, %', sum.company, ref?.company ?? NaN, 1],
    ['Ничьи, %', sum.draws, ref?.draws ?? NaN, 1],
    ['Раундов, среднее', sum.roundsMean, ref?.roundsMean ?? NaN, 1],
    ['Раундов, 10%', sum.rounds10, ref?.rounds10 ?? NaN, 0],
    ['Раундов, 90%', sum.rounds90, ref?.rounds90 ?? NaN, 0],
  ];
  const per: [string, keyof Summary['sides'][Side], number][] = [
    ['пришло (доход, продажа, кража)', 'income', 2],
    ['на Залпы', 'volley', 2],
    ['на карты', 'cards', 2],
    ['на Реакции', 'reactions', 2],
    ['на особенности', 'abilities', 2],
    ['сгорело сверх 8', 'wasted', 2],
    ['ход с пустым Трюмом, %', 'emptyHold', 0],
    ['ход с 3+ Пороха, %', 'left3', 0],
    ['карт за ход', 'cardsPlayed', 2],
    ['из них за Порох', 'paidCards', 2],
    ['продано за ход', 'sold', 2],
    ['Реакций за ход', 'reactionsPlayed', 2],
    ['Легенд за партию', 'legends', 2],
  ];
  for (const side of SIDES) {
    for (const [name, key, digits] of per) {
      rows.push([`${side === 'ПИРАТЫ' ? 'Пираты' : 'Компания'}: ${name}`, sum.sides[side][key], ref?.sides[side][key] ?? NaN, digits]);
    }
  }
  const width = Math.max(...rows.map((r) => r[0].length));
  const lines = [`== ${label}`, `${'Показатель'.padEnd(width)}  ${'наши'.padStart(6)}  ${'PDF'.padStart(6)}  ${'разница'.padStart(7)}`];
  for (const [name, ours, pdf, digits] of rows) {
    const diff = Number.isNaN(pdf) ? NaN : ours - pdf;
    const sign = Number(diff.toFixed(digits)) > 0 ? '+' : '';
    lines.push(
      `${name.padEnd(width)}  ${fmt(ours, digits).padStart(6)}  ${fmt(pdf, digits).padStart(6)}  ${(Number.isNaN(diff) ? '—' : sign + fmt(diff, digits)).padStart(7)}`,
    );
  }
  return lines.join('\n');
}
