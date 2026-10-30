// Bot games in the background (a Web Worker) for the admin page, so the page does not freeze. The same engine and bots
// as `npm run sim`. Jobs:
//   check — «Скачать как основной»: N games of the data must end without exceptions;
//   setup + block — the balance lab: a data set with its settings, then blocks of its games (sim/lab.ts runBlock).
// The page stops a job by terminating the worker.
import { DataError, loadGameData } from '../../engine/data';
import { createRng } from '../../engine/rng';
import { labSeeds, runBlock, blockRange, type LabResult, type LabSettings } from '../../engine/sim/lab';
import { playGame } from '../../engine/sim/sim';
import type { GameData } from '../../engine/types';

export type WorkerJob =
  | { kind: 'check'; raw: unknown; games: number; seed: number }
  | { kind: 'setup'; set: number; raw: unknown; settings: LabSettings }
  | { kind: 'block'; set: number; block: number; req: number };

export type WorkerReply =
  | { t: 'progress'; done: number }
  | { t: 'done' }
  | { t: 'fail'; message: string }
  | { t: 'block'; req: number; result: LabResult }
  | { t: 'blockFail'; req: number; message: string };

const post = (msg: WorkerReply) => (self as unknown as Worker).postMessage(msg);
const sets = new Map<number, { data: GameData; settings: LabSettings; seeds: number[] } | { error: string }>();

const text = (err: unknown) => (err instanceof DataError ? err.message : err instanceof Error ? err.message : String(err));

self.onmessage = (e: MessageEvent<WorkerJob>) => {
  const job = e.data;
  if (job.kind === 'setup') {
    try {
      sets.set(job.set, { data: loadGameData(job.raw), settings: job.settings, seeds: labSeeds(job.settings.seed, job.settings.games) });
    } catch (err) {
      sets.set(job.set, { error: text(err) });
    }
    return;
  }
  if (job.kind === 'block') {
    const set = sets.get(job.set);
    if (!set || 'error' in set) return post({ t: 'blockFail', req: job.req, message: set && 'error' in set ? set.error : 'нет набора данных' });
    try {
      post({ t: 'block', req: job.req, result: runBlock(set.data, set.settings, set.seeds, ...blockRange(set.settings.games, job.block)) });
    } catch (err) {
      post({ t: 'blockFail', req: job.req, message: `партия остановилась с ошибкой: ${text(err)}` });
    }
    return;
  }
  let data;
  try {
    data = loadGameData(job.raw);
  } catch (err) {
    post({ t: 'fail', message: text(err) });
    return;
  }
  const seeds = createRng(job.seed);
  for (let i = 0; i < job.games; i++) {
    const seed = seeds.int(2 ** 31);
    try {
      playGame(data, seed);
    } catch (err) {
      post({ t: 'fail', message: `Партия ${i + 1} (seed ${seed}) остановилась с ошибкой: ${text(err)}` });
      return;
    }
    post({ t: 'progress', done: i + 1 });
  }
  post({ t: 'done' });
};
