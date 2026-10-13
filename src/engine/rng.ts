// Seeded random numbers (mulberry32). The only source of randomness in the engine.
// The generator state is a single 32-bit number, so it is stored inside GameState.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** Shuffles the array in place and returns it. */
  shuffle<T>(items: T[]): T[];
  /** Current state; createRng(rng.state) continues the same sequence. */
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const rng: Rng = {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(n) {
      return Math.floor(rng.next() * n);
    },
    shuffle(items) {
      for (let i = items.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        [items[i], items[j]] = [items[j], items[i]];
      }
      return items;
    },
    get state() {
      return s;
    },
  };
  return rng;
}
