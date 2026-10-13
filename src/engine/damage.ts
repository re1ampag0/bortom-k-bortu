// Damage, restoring, Powder, Fires, sinking and the end of the game.
import {
  RuleError,
  TRACK_MIN,
  aliveShips,
  getShip,
  otherSide,
  startValue,
  teamShips,
  type Ctx,
  type PowderReason,
  type SpendReason,
} from './state';
import type { Side, Track } from './types';

/**
 * Deals n damage to a track. Damage the track cannot take (it is at its minimum) goes to the Hull
 * (RULES.md 11.1). Hull 0 sinks the ship (11.2). Returns the damage dealt.
 */
export function dealDamage(ctx: Ctx, code: string, track: Track, n: number): number {
  const ship = getShip(ctx.s, code);
  if (n <= 0 || ship.sunk) return 0;
  const take = Math.min(n, ship.tracks[track] - TRACK_MIN[track]);
  ship.tracks[track] -= take;
  let toHull = 0;
  if (track !== 'hull') {
    toHull = Math.min(n - take, ship.tracks.hull);
    ship.tracks.hull -= toHull;
  }
  if (!ctx.s.turn.damaged.includes(code)) ctx.s.turn.damaged.push(code);
  ctx.events.push({ type: 'damage', ship: code, track, amount: take, toHull });
  if (ship.tracks.hull <= 0) sinkShip(ctx, code);
  return take + toHull;
}

/** Restores up to n on a track, never above the starting value (RULES.md 3.7, 11.3). Returns what was restored. */
export function restore(ctx: Ctx, code: string, track: Track, n: number): number {
  const ship = getShip(ctx.s, code);
  if (n <= 0 || ship.sunk) return 0;
  const got = Math.min(n, startValue(ctx.data, code, track) - ship.tracks[track]);
  if (got <= 0) return 0;
  ship.tracks[track] += got;
  return got;
}

/** Puts Powder into the Hold; everything above the cap burns (RULES.md 6.2). */
export function addPowder(ctx: Ctx, side: Side, n: number, reason: PowderReason): void {
  const team = ctx.s.teams[side];
  const amount = Math.max(0, Math.min(n, ctx.data.econ.cap - team.powder));
  team.powder += amount;
  ctx.events.push({ type: 'powderGained', side, amount, burned: n - amount, reason });
}

/** Pays Powder from the Hold; there is no paying with Powder you do not have (RULES.md 6.5). */
export function pay(ctx: Ctx, side: Side, n: number, reason: SpendReason): void {
  if (n <= 0) return;
  const team = ctx.s.teams[side];
  if (team.powder < n) throw new RuleError(`Не хватает Пороха: нужно ${n}, в Трюме ${team.powder}`);
  team.powder -= n;
  ctx.events.push({ type: 'powderSpent', side, amount: n, reason });
}

/** Adds Fires to a ship, no more than the cap (RULES.md 13.1). */
export function addFire(ctx: Ctx, code: string, n: number): void {
  const ship = getShip(ctx.s, code);
  if (ship.sunk || n <= 0) return;
  const fires = Math.min(ctx.data.rules.maxFires, ship.fires + n);
  if (fires === ship.fires) return;
  ship.fires = fires;
  ctx.events.push({ type: 'fireAdded', ship: code, fires });
}

/**
 * The ship sinks (RULES.md 17.1): abilities stop, the unplayed Legend leaves the game,
 * Fires and the "submerged" token are removed, Plans go to the captain's hand (17.5).
 * The seat keeps its hand and deck (17.2).
 */
export function sinkShip(ctx: Ctx, code: string): void {
  const ship = getShip(ctx.s, code);
  if (ship.sunk) return;
  ship.sunk = true;
  ship.tracks.hull = 0;
  ship.fires = 0;
  ship.submerged = false;
  ship.legend = false;
  ship.hand.push(...ship.plans);
  ship.plans = [];
  ctx.events.push({ type: 'sunk', ship: code });
}

/**
 * Ends the game when a team has no ships afloat (RULES.md 19.1); both teams at once is a draw (19.2).
 * «Быстрый бой» ends with the first sunk ship (20.2). Call after every finished effect.
 */
export function checkGameOver(ctx: Ctx): boolean {
  const { s } = ctx;
  if (s.winner) return true;
  const sides: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];
  const lost =
    s.variant === 'quick'
      ? sides.filter((side) => teamShips(s, side).some((x) => x.sunk))
      : sides.filter((side) => aliveShips(s, side).length === 0);
  if (lost.length === 0) return false;
  s.winner = lost.length === 2 ? 'НИЧЬЯ' : otherSide(lost[0]);
  ctx.events.push({ type: 'gameOver', winner: s.winner, reason: 'sunk' });
  return true;
}
