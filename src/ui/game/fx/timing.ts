// FX-D: the durations of the A5 clips in one table (ms at the normal speed; the queue multiplies them by its speed —
// «Быстрее», the catch-up ×2 — and «Пауза» / «До конца хода» stop or end them, as for every clip). The numbers are the
// prototype's (docs/mockups/a5/fx/src/fx3.js, template.html; ANIMATIONS.md §3.6–3.9, the user's call: as long as there).
// Each clip has its own factor: to make a clip shorter, change its K — every stage of the clip is counted from these
// numbers, the choreography stays. The traces (smoke, wreckage) live by their own clock (scars.ts), not by K.

export const VOLLEY_K = 1;
export const FIRE_K = 1;
export const SINK_K = 1;
export const SWAP_K = 1;
export const REPAIR_K = 1;
export const SOUL_K = 1;
export const DIVE_K = 1;

const scaled = <T extends Record<string, number>>(k: number, o: T): T => Object.fromEntries(Object.entries(o).map(([n, v]) => [n, v * k])) as T;

/** How long the smoke of a shot drifts (a trace: not scaled by VOLLEY_K). */
export const SMOKE_LIFE = 5600;

export const T = {
  /** A shot of the Volley (the volley() of template.html): the fuses, the guns one after another, the balls, the hits. */
  volley: scaled(VOLLEY_K, {
    /** the fuses spit sparks before the first gun */
    fuse: 420,
    /** between two guns of one broadside */
    gunStep: 150,
    /** the flash of a gun (the cone of fire) */
    flash: 420,
    /** the flight of a ball (with its lift); a ball that hits flies a little longer */
    fly: 700,
    flyHit: 820,
    /** a hit: the fireball and the shockwave */
    blast: 520,
    /** a board of the Hull falls off into the sea */
    fall: 1000,
    /** a spout of water of a miss */
    splash: 1700,
    /** after the last ball: the smoke rolls, the marks stay a while */
    linger: 1500,
    /** the plate and the frames fade */
    fade: 450,
  }),
} as const;
