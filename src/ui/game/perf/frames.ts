/** Performance-clock samples. Script work and scheduled visual phases are distinct. */
export interface PhaseSample { at: number; end: number; clip: string; name: string; kind: 'work' | 'visual' | 'clip' }
export interface PressSample { at: number; name: string; trigger?: boolean }
export interface ClipProfile { start: number; end: number; frames: number[]; phases: PhaseSample[]; presses: PressSample[]; prepared: PhaseSample[]; dropped: number }
export interface WorstFrame { at: number; ms: number; clips: string[]; stages: string[]; presses: string[]; partial: boolean }
const overlaps = (a: number, b: number, from: number, to: number) => a < to && b > from;
/** Only rank first, then join the five intervals to events (no per-frame DOM reads). */
export function worstFrames(p: ClipProfile, from = p.start, to = p.end): WorstFrame[] {
  const ticks = [p.start, ...p.frames.filter(t => t > p.start && t < p.end), p.end];
  return ticks.slice(1).map((end, i) => ({start: Math.max(from, ticks[i]), end: Math.min(to, end), partial: i === 0 || i === ticks.length - 2 || ticks[i] < from || end > to}))
    .filter(f => f.end > f.start).sort((a,b) => (b.end-b.start)-(a.end-a.start) || a.start-b.start).slice(0,5)
    .map(f => {
      const phases = p.phases.filter(s => overlaps(s.at,s.end,f.start,f.end));
      return {at:f.start-p.start, ms:f.end-f.start, partial:f.partial,
        clips:[...new Set(phases.map(s=>s.clip).filter(Boolean))],
        stages:[...new Set(phases.filter(s=>s.kind!=='clip').map(s=>(s.kind==='work'?'JS: ':'')+s.name))],
        presses:[...new Set(p.presses.filter(s=>(s.at>=f.start&&s.at<f.end)||(s.trigger&&f.start===p.start)).map(s=>(s.trigger?'запуск: ':'')+s.name))]};
    });
}
export function frameText(f: WorstFrame): string {
  return `${f.partial?'≥':''}${f.ms.toFixed(1)} мс; +${(f.at/1000).toFixed(3)} с; ${f.clips.join(' / ')||'очередь'}; ${f.stages.join(' / ')||'между этапами'}; нажатие: ${f.presses.join(', ')||'нет'}`;
}
