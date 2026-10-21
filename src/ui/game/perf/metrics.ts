export interface Sample { at: number; dt: number }
export interface Stats { fps: number; worst: number; slow: number }
export function stats(samples: readonly Sample[], elapsed?: number): Stats {
  let worst = 0, slow = 0, total = 0;
  for (const {dt} of samples) { total += dt; worst = Math.max(worst, dt); if (dt > 50) slow++; }
  return {fps: total > 0 ? samples.length * 1000 / (elapsed ?? total) : 0, worst, slow};
}
export class FrameWindow {
  samples: Sample[] = [];
  add(at: number, dt: number) {
    this.samples.push({at, dt});
    while (this.samples.length && this.samples[0].at <= at - 10000) this.samples.shift();
  }
  reset() { this.samples = []; }
  read(at: number): Stats {
    return {...stats(this.samples.filter(s => s.at > at - 1000)),
      worst: stats(this.samples).worst, slow: stats(this.samples).slow};
  }
}
