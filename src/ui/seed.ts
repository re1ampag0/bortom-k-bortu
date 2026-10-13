// Seeds of new games: random, or fixed by «?seed=N» in the address (tests, repeating a game).
import { createRng } from '../engine/rng';

export const newSeed = () => createRng((Date.now() ^ (performance.now() * 1000)) >>> 0).int(2 ** 31 - 1) + 1;

/** The seed from the text of a field or of the address; random if empty or not a positive integer. */
export function seedFrom(text: string | null): number {
  const n = Number(text);
  return text && text.trim() !== '' && Number.isInteger(n) && n > 0 ? n : newSeed();
}

export const urlSeedText = () => new URLSearchParams(location.search).get('seed') ?? '';
