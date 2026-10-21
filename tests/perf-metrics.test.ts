import {describe, expect, it} from 'vitest';
import {FrameWindow, stats} from '../src/ui/game/perf/metrics';
describe('Performance diagnostics: real frame intervals', () => {
  it('counts FPS by time and uses a strict >50 ms threshold', () => {
    expect(stats([{at:10,dt:10},{at:60,dt:50},{at:120,dt:60}], 200)).toEqual({fps:15,worst:60,slow:1});
    expect(stats([])).toEqual({fps:0,worst:0,slow:0});
  });
  it('expires a stall from the 10-second window while current FPS uses one second', () => {
    const f = new FrameWindow();f.add(100,100);f.add(9500,20);f.add(10000,20);
    expect(f.read(10000)).toEqual({fps:50,worst:100,slow:1});
    f.add(10100,20);expect(f.read(10100)).toEqual({fps:50,worst:20,slow:0});
    f.reset();expect(f.read(10100)).toEqual({fps:0,worst:0,slow:0});
  });
});
