// Seeds of new games: random, or fixed by «?seed=N» in the address (tests, repeating a game).
import { createRng } from '../engine/rng';

let calls = 0;
/** A random seed; the counter keeps two calls in the same millisecond apart. */
export const newSeed = () => createRng((Date.now() ^ (performance.now() * 1000) ^ Math.imul(++calls, 0x9e3779b9)) >>> 0).int(2 ** 31 - 1) + 1;

/** A seed typed in the field or given in the address: a positive integer. */
export function isFixedSeed(text: string | null): text is string {
  const n = Number(text);
  return !!text && text.trim() !== '' && Number.isInteger(n) && n > 0;
}

/** The seed from the text of a field or of the address; random if empty or not a positive integer. */
export function seedFrom(text: string | null): number {
  return isFixedSeed(text) ? Number(text) : newSeed();
}

/** The seed of a coin toss: a fixed seed stays (the same side, the game can be repeated), otherwise a new one each time. */
export const tossSeed = (text: string, current: number) => (isFixedSeed(text) ? current : newSeed());

export const urlSeedText = () => new URLSearchParams(location.search).get('seed') ?? '';
