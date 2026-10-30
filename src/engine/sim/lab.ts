// The balance lab (docs/TZ.md, «Лаборатория баланса»; docs/tasks/E9b-balance-lab.md): bot games of one data set with
// settings — the number of games, the seed, the variant, who moves first, features turned off as `cfg.off` of sim.py —
// and their numbers with the spread of each, for comparing two sets. The games are those of sim.ts playGame (the same
// seeds as runSims: seed 1 and 3000 games give the 46.5 % of `npm run sim:check`). Pure: runs in Web Workers.
//
// Games go in blocks of BLOCK in seed order. Each block sums its games; the blocks are summed in their order. So the
// numbers do not depend on how many workers played the blocks (the sums of floats are added in the same order).
import { ABILITY } from '../state';
import { createRng } from '../rng';
import type { Variant, Winner } from '../state';
import type { GameData, Side } from '../types';
import { playGame, type GameResult } from './sim';

export const FEATURES = [
  { id: 'souls', name: 'Души «Голландца» за урон по Команде' },
  { id: 'jack', name: 'Легенда «Джек ускользает»' },
  { id: 'bottle', name: 'Легенда «Корабль в бутылке»' },
  { id: 'free_regroup', name: 'Бесплатное Перестроение Пиратов' },
  { id: 'sword', name: 'Меч Тритона' },
  { id: 'plans', name: 'Планы «Жемчужины»' },
  { id: 'dive', name: 'Погружение «Голландца»' },
  { id: 'heart', name: 'Сердце Дейви Джонса' },
] as const;
export type Feature = (typeof FEATURES)[number]['id'];

export interface LabSettings {
  /** 100–5000. */
  games: number;
  seed: number;
  variant: Variant;
  first: Side;
  off: Feature[];
}

export const DEFAULT_LAB: LabSettings = { games: 1000, seed: 1, variant: 'standard', first: 'ПИРАТЫ', off: [] };

/** Games of one block: the unit of work of a worker and of the sums. */
export const BLOCK = 25;

/** A sum over games of a per-game number and of its square: enough for the mean and the spread. */
export interface Agg {
  s: number;
  q: number;
}

export interface LabResult {
  games: number;
  wins: Record<Winner, number>;
  /** Rounds of each game in seed order (for the 10–90 % range). */
  rounds: number[];
  /** Per-game numbers by key, see gameMetrics. */
  m: Record<string, Agg>;
}

export const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];

/**
 * The data the games of the settings are played on. «souls» and «free_regroup» are rules: «Души» are not gained
 * (soulsGain 0), «Быстрее ветра» is taken from the ship. The other features are choices the bots skip (BotOff).
 */
export function labData(data: GameData, off: readonly string[]): GameData {
  if (!off.includes('souls') && !off.includes('free_regroup')) return data;
  return {
    ...data,
    rules: off.includes('souls') ? { ...data.rules, soulsGain: 0 } : data.rules,
    ships: off.includes('free_regroup')
      ? data.ships.map((s) => ({ ...s, abilities: s.abilities.filter((a) => a.name !== ABILITY.fasterThanWind) }))
      : data.ships,
  };
}

/** The seeds of the games: the same sequence as runSims. */
export function labSeeds(seed: number, games: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length: games }, () => rng.int(2 ** 31));
}

export const blockCount = (games: number) => Math.ceil(games / BLOCK);

export function emptyResult(): LabResult {
  return { games: 0, wins: { ПИРАТЫ: 0, КОМПАНИЯ: 0, НИЧЬЯ: 0 }, rounds: [], m: {} };
}

/** Adds `from` to `to` (in place): the order of adding is the order of the blocks. */
export function addResult(to: LabResult, from: LabResult): LabResult {
  to.games += from.games;
  for (const w of Object.keys(to.wins) as Winner[]) to.wins[w] += from.wins[w];
  to.rounds.push(...from.rounds);
  for (const [k, a] of Object.entries(from.m)) {
    const t = (to.m[k] ??= { s: 0, q: 0 });
    t.s += a.s;
    t.q += a.q;
  }
  return to;
}

/** The numbers of one game the lab shows, by key: per turn of the side, per game, per card. */
export function gameMetrics(g: GameResult): Record<string, number> {
  const out: Record<string, number> = { rounds: g.rounds };
  for (const side of SIDES) {
    const st = g.stats[side];
    const per = (x: number) => x / Math.max(1, st.turns);
    const at = (k: string, v: number) => (out[`${side}.${k}`] = v);
    at('win', g.winner === side ? 1 : 0);
    at('income', per(st.income));
    at('volley', per(st.spentVolley));
    at('cards', per(st.spentCards));
    at('reactions', per(st.spentReactions));
    at('abilities', per(st.spentAbilities));
    at('wasted', per(st.wasted));
    at('emptyHold', per(st.turnsPowderZero) * 100);
    at('cardsPlayed', per(st.cardsPlayed));
    at('legends', st.legends);
    for (const [k, n] of Object.entries(st.counts)) {
      if (k.startsWith('card:') || k.startsWith('legend:')) out[k] = (out[k] ?? 0) + n;
      else if (k.startsWith('dmg:') || USE_KEYS.includes(k)) at(k, n);
    }
  }
  return out;
}

/** Counters of the use of features, per game. */
export const USE_KEYS = ['volleys', 'regroups', 'sword', 'heart', 'dived', 'treasury', 'soulsSpent', 'firesOut', 'jackEscape'];

/** Plays one block of games (seeds `from` … `to` − 1 of the list). */
export function runBlock(data: GameData, settings: LabSettings, seeds: number[], from: number, to: number): LabResult {
  const played = labData(data, settings.off);
  const off = new Set<string>(settings.off);
  const r = emptyResult();
  for (let i = from; i < to; i++) {
    const g = playGame(played, seeds[i], settings.variant, undefined, { first: settings.first, off });
    r.games++;
    r.wins[g.winner]++;
    r.rounds.push(g.rounds);
    for (const [k, v] of Object.entries(gameMetrics(g))) {
      const a = (r.m[k] ??= { s: 0, q: 0 });
      a.s += v;
      a.q += v * v;
    }
  }
  return r;
}

/** All the games in one thread, block by block (tests, the console); the workers do the same blocks in parallel. */
export function runLab(data: GameData, settings: LabSettings, onBlock?: (done: number) => void): LabResult {
  const seeds = labSeeds(settings.seed, settings.games);
  const total = emptyResult();
  for (let b = 0; b < blockCount(settings.games); b++) {
    const [from, to] = blockRange(settings.games, b);
    addResult(total, runBlock(data, settings, seeds, from, to));
    onBlock?.(to);
  }
  return total;
}

// ——— Numbers and their spread ———

export interface Stat {
  mean: number;
  /** Variance of one game's number (n − 1 in the denominator). */
  variance: number;
  n: number;
}

export function stat(r: LabResult, key: string): Stat {
  const a = r.m[key] ?? { s: 0, q: 0 };
  const n = r.games;
  const mean = n > 0 ? a.s / n : NaN;
  const variance = n > 1 ? Math.max(0, (a.q - n * mean * mean) / (n - 1)) : 0;
  return { mean, variance, n };
}

/** Wilson's 95 % interval of a share k of n, in shares. */
export function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 0];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const h = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - h) / d), Math.min(1, (c + h) / d)];
}

/** Two-sided p of the z-test of two shares (pooled). Equal shares — 1. */
export function twoProportionP(k1: number, n1: number, k2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 1;
  const p = (k1 + k2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 1;
  const z = (k1 / n1 - k2 / n2) / se;
  return 2 * (1 - normalCdf(Math.abs(z)));
}

/** Two-sided p of Welch's t-test of two means. No spread in either — 1 when equal, 0 when not. */
export function welchP(a: Stat, b: Stat): number {
  if (a.n < 2 || b.n < 2) return 1;
  const va = a.variance / a.n;
  const vb = b.variance / b.n;
  if (va + vb === 0) return a.mean === b.mean ? 1 : 0;
  const t = (a.mean - b.mean) / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.n - 1) + vb ** 2 / (b.n - 1));
  return studentTwoSidedP(Math.abs(t), df);
}

export function normalCdf(x: number): number {
  // Abramowitz–Stegun 7.1.26 for erf: error below 1.5e-7.
  const t = 1 / (1 + (0.3275911 * Math.abs(x)) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** P(|T| ≥ t) for Student's t with df degrees of freedom: the regularized incomplete beta I_{df/(df+t²)}(df/2, 1/2). */
function studentTwoSidedP(t: number, df: number): number {
  return incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

function logGamma(x: number): number {
  // Lanczos approximation (g = 7, n = 9).
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** The regularized incomplete beta function I_x(a, b) (Numerical Recipes, a continued fraction). */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x > (a + 1) / (a + b + 2)) return 1 - (front * betaFraction(1 - x, b, a)) / b;
  return (front * betaFraction(x, a, b)) / a;
}

function betaFraction(x: number, a: number, b: number): number {
  const tiny = 1e-300;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

/** The value at a share of the sorted list (10 % — floor(n / 10), as summarize in sim.ts). */
export function percentile(values: number[], share: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))];
}

/**
 * Plays the blocks of a run on `workers` runners (Web Workers on the site, plain calls in tests): each runner takes the
 * next block when it is free; the results are added in block order, so any number of runners gives the same numbers.
 * `cancelled` stops handing out blocks.
 */
export async function runBlocks(
  games: number,
  workers: number,
  run: (worker: number, block: number) => Promise<LabResult>,
  onProgress?: (gamesDone: number) => void,
  cancelled: () => boolean = () => false,
): Promise<LabResult | null> {
  const count = blockCount(games);
  const results: LabResult[] = new Array(count);
  let next = 0;
  let done = 0;
  const loop = async (w: number) => {
    while (next < count && !cancelled()) {
      const b = next++;
      results[b] = await run(w, b);
      done += results[b].games;
      onProgress?.(done);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(workers, count)) }, (_, w) => loop(w)));
  if (cancelled()) return null;
  return results.reduce((total, r) => addResult(total, r), emptyResult());
}

/** The games of block b: seeds b·BLOCK … min(games, (b + 1)·BLOCK) − 1. */
export const blockRange = (games: number, b: number): [number, number] => [b * BLOCK, Math.min(games, (b + 1) * BLOCK)];
