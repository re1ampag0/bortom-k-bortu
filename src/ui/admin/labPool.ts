// The balance lab's Web Workers (docs/tasks/E9b, step 2): navigator.hardwareConcurrency − 1 workers play the blocks of
// games of each data set in the background, with progress and «Отмена». The numbers do not depend on the number of
// workers (sim/lab.ts runBlocks adds the blocks in their order).
import { runBlocks, type LabResult, type LabSettings } from '../../engine/sim/lab';
import type { RawData } from '../presets';
import type { WorkerJob, WorkerReply } from './sim.worker';

export interface LabRun {
  /** The results of the sets in their order; null — cancelled. Rejects with a message in Russian. */
  result: Promise<LabResult[] | null>;
  cancel(): void;
}

export const workerCount = () => Math.max(1, (navigator.hardwareConcurrency || 2) - 1);

export function startLab(sets: { raw: RawData; settings: LabSettings }[], onProgress: (done: number, total: number) => void): LabRun {
  const n = workerCount();
  const workers = Array.from({ length: n }, () => new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' }));
  const waiting = new Map<number, { ok: (r: LabResult) => void; fail: (e: Error) => void }>();
  let req = 0;
  let cancelled = false;
  let broken: ((e: Error) => void) | null = null;
  const stopped = new Promise<never>((_, fail) => (broken = fail));
  stopped.catch(() => {});
  for (const w of workers) {
    w.onmessage = (e: MessageEvent<WorkerReply>) => {
      const m = e.data;
      if (m.t !== 'block' && m.t !== 'blockFail') return;
      const p = waiting.get(m.req);
      waiting.delete(m.req);
      if (m.t === 'block') p?.ok(m.result);
      else p?.fail(new Error(m.message));
    };
    w.onerror = (e) => broken?.(new Error(`воркер остановился: ${e.message || 'ошибка'}`));
  }
  const send = (w: number, job: WorkerJob) => workers[w].postMessage(job);
  const total = sets.reduce((sum, s) => sum + s.settings.games, 0);
  sets.forEach((s, set) => workers.forEach((_, w) => send(w, { kind: 'setup', set, raw: s.raw, settings: s.settings })));

  const result = (async () => {
    try {
      const out: LabResult[] = [];
      let before = 0;
      for (const [set, s] of sets.entries()) {
        const r = await Promise.race([
          runBlocks(
            s.settings.games,
            n,
            (w, block) =>
              new Promise<LabResult>((ok, fail) => {
                const id = ++req;
                waiting.set(id, { ok, fail });
                send(w, { kind: 'block', set, block, req: id });
              }),
            (done) => onProgress(before + done, total),
            () => cancelled,
          ),
          stopped,
        ]);
        if (!r) return null;
        out.push(r);
        before += s.settings.games;
      }
      return out;
    } catch (e) {
      if (cancelled) return null;
      throw e;
    } finally {
      for (const w of workers) w.terminate();
    }
  })();
  return {
    result,
    cancel() {
      cancelled = true;
      for (const w of workers) w.terminate();
      for (const p of waiting.values()) p.fail(new Error('cancelled'));
      waiting.clear();
    },
  };
}
