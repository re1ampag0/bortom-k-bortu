// Bot games in the background (a Web Worker) for the admin page, so the page does not freeze. The same engine and bots
// as `npm run sim`. Jobs:
//   check — «Скачать как основной»: N games of the data must end without exceptions;
// Every few games the worker posts its progress; the page stops a job by terminating the worker.
import { DataError, loadGameData } from '../../engine/data';
import { createRng } from '../../engine/rng';
import { playGame } from '../../engine/sim/sim';

export type WorkerJob = { kind: 'check'; raw: unknown; games: number; seed: number };

export type WorkerReply =
  | { t: 'progress'; done: number }
  | { t: 'done' }
  | { t: 'fail'; message: string };

const post = (msg: WorkerReply) => (self as unknown as Worker).postMessage(msg);

self.onmessage = (e: MessageEvent<WorkerJob>) => {
  const job = e.data;
  let data;
  try {
    data = loadGameData(job.raw);
  } catch (err) {
    post({ t: 'fail', message: err instanceof DataError ? err.message : String(err) });
    return;
  }
  const seeds = createRng(job.seed);
  for (let i = 0; i < job.games; i++) {
    const seed = seeds.int(2 ** 31);
    try {
      playGame(data, seed);
    } catch (err) {
      post({ t: 'fail', message: `Партия ${i + 1} (seed ${seed}) остановилась с ошибкой: ${err instanceof Error ? err.message : String(err)}` });
      return;
    }
    post({ t: 'progress', done: i + 1 });
  }
  post({ t: 'done' });
};
