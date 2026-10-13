// Damage, restoring, Powder, Fires, sinking and the end of the game.
import {
  ABILITY,
  RuleError,
  TRACK_MIN,
  aliveShips,
  cardByCode,
  getShip,
  hasAbility,
  otherSide,
  seaKey,
  shipData,
  startValue,
  teamShips,
  type Ctx,
  type PowderReason,
  type SpendReason,
} from './state';
import type { Side, Track } from './types';

/**
 * Deals n damage to a track. Damage the track cannot take (it is at its minimum) goes to the Hull
 * (RULES.md 11.1). Hull 0 sinks the ship (11.2) — or waits for «Джек ускользает» (15.2).
 * «Лунный свет» lowers each Crew damage (16). `src` is the ship that deals the damage: the Flying Dutchman
 * gets a Soul for each enemy ship it damages on the Crew (14.7, Q12, Q13). Returns the damage dealt.
 */
export function dealDamage(ctx: Ctx, code: string, track: Track, n: number, src: string | null = null): number {
  const ship = getShip(ctx.s, code);
  if (track === 'crew' && seaKey(ctx) === 'moon') n -= ctx.data.rules.seaMoon;
  if (n <= 0 || ship.sunk || ship.tracks.hull <= 0) return 0;
  const take = Math.min(n, ship.tracks[track] - TRACK_MIN[track]);
  ship.tracks[track] -= take;
  let toHull = 0;
  if (track !== 'hull') {
    toHull = Math.min(n - take, ship.tracks.hull);
    ship.tracks.hull -= toHull;
  }
  if (!ctx.s.turn.damaged.includes(code)) ctx.s.turn.damaged.push(code);
  ctx.events.push({ type: 'damage', ship: code, track, amount: take, toHull });
  if (track === 'crew' && src) gainSouls(ctx, src, code);
  if (ship.tracks.hull <= 0) sinkOrJack(ctx, code);
  return take + toHull;
}

/** «Вечная служба»: a Soul for an enemy ship damaged on the Crew, no more than the maximum (RULES.md 14.7). */
function gainSouls(ctx: Ctx, src: string, target: string): void {
  const dutchman = getShip(ctx.s, src);
  if (!hasAbility(ctx.data, dutchman, ABILITY.eternalService)) return;
  if (getShip(ctx.s, target).side === dutchman.side) return;
  const max = shipData(ctx.data, src).souls ?? 0;
  const amount = Math.min(ctx.data.rules.soulsGain, max - dutchman.souls);
  if (amount <= 0) return;
  dutchman.souls += amount;
  ctx.events.push({ type: 'soulsGained', ship: src, amount });
}

/**
 * The ship must sink. If its Legend is «Джек ускользает» (an escape Reaction) and the team can pay for it,
 * the engine waits for the team's decision with Hull 0 (RULES.md 15.2, Q16, Q17). Otherwise it sinks.
 */
export function sinkOrJack(ctx: Ctx, code: string): void {
  const ship = getShip(ctx.s, code);
  if (ship.sunk) return;
  ship.tracks.hull = 0;
  if (canEscape(ctx, code)) {
    ctx.s.pending = { kind: 'jack', ship: code };
    return;
  }
  sinkShip(ctx, code);
}

function canEscape(ctx: Ctx, code: string): boolean {
  const ship = getShip(ctx.s, code);
  if (!ship.legend) return false;
  const legend = cardByCode(ctx.data, `${code}-Л`);
  return legend.fx.r === 'escape' && ctx.s.teams[ship.side].powder >= legend.cost && !ctx.s.pending;
}

/** Restores up to n on a track, never above the starting value (RULES.md 3.7, 11.3). Returns what was restored. */
export function restore(ctx: Ctx, code: string, track: Track, n: number): number {
  const ship = getShip(ctx.s, code);
  if (n <= 0 || ship.sunk) return 0;
  const got = Math.min(n, startValue(ctx.data, code, track) - ship.tracks[track]);
  if (got <= 0) return 0;
  ship.tracks[track] += got;
  ctx.events.push({ type: 'restored', ship: code, track, amount: got });
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

/** Takes Powder from the Hold without paying for anything («Сырой порох»). */
export function losePowder(ctx: Ctx, side: Side, n: number): void {
  const team = ctx.s.teams[side];
  const amount = Math.min(n, team.powder);
  if (amount <= 0) return;
  team.powder -= amount;
  ctx.events.push({ type: 'powderLost', side, amount });
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
  ship.surfaced = false;
  ctx.events.push({ type: 'sunk', ship: code });
  // «Сердце Дейви Джонса»: when the Endeavour sinks, Jones is free — the Dutchman's Guns and Crew go back to the start (14.6).
  if (shipData(ctx.data, code).abilities.some((a) => a.name === ABILITY.heart)) {
    const dutchman = teamShips(ctx.s, ship.side).find((x) => x.code !== code);
    if (dutchman && !dutchman.sunk) {
      ctx.events.push({ type: 'jonesFree', ship: dutchman.code });
      restore(ctx, dutchman.code, 'guns', Infinity);
      restore(ctx, dutchman.code, 'crew', Infinity);
    }
  }
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
