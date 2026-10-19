// FX-D: the durations of the A5 clips (src/ui/game/fx/timing.ts) — one table, a factor per clip, every stage a positive
// number of milliseconds (a clip is made shorter by its K alone).
import { describe, expect, it } from 'vitest';
import * as timing from '../src/ui/game/fx/timing';

describe('the timings of the A5 clips', () => {
  it('every factor is 1 for now (as long as in the prototype, the user\'s call) and every stage is a positive time', () => {
    const ks = Object.entries(timing).filter(([n]) => /_K$/.test(n));
    expect(ks.length).toBeGreaterThanOrEqual(7);
    for (const [n, v] of ks) expect(`${n} ${v}`).toBe(`${n} 1`);
    for (const [clip, stages] of Object.entries(timing.T)) {
      for (const [stage, ms] of Object.entries(stages as Record<string, number>)) expect(ms, `${clip}.${stage}`).toBeGreaterThan(0);
    }
    expect(timing.SMOKE_LIFE).toBeGreaterThan(0);
  });

  it('the Volley of the prototype: the fuse, then the guns, a hit flies longer than a miss', () => {
    const v = timing.T.volley;
    expect(v.fuse).toBe(420);
    expect(v.flyHit).toBeGreaterThan(v.fly);
  });

  it('the entrance of a Legend of the prototype: ≈ 4.6 s from the medallion to the orb at the target', () => {
    const l = timing.T.legend;
    const total = l.cardAt + l.land + l.hit + l.sealHit + l.hold + l.orbAt + l.orbEnd;
    expect(total).toBe(4600);
    expect(l.flip).toBeGreaterThan(l.fly);
  });
});
