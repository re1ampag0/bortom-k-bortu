// «Скачать как основной» (docs/tasks/E9a, step 6): the data loader and 100 bot games in a Web Worker (progress,
// «Отмена»), then the file data/game-data.json and the steps to put it into the repository on GitHub. The site is
// built again by itself after the commit.
import { useEffect, useRef, useState } from 'react';
import { downloadJson, type RawData } from '../presets';
import type { WorkerJob, WorkerReply } from './sim.worker';

const GAMES = 100;
const REPO = 'https://github.com/re1ampag0/bortom-k-bortu';

type Phase = { k: 'idle' } | { k: 'run'; done: number } | { k: 'fail'; message: string } | { k: 'ok' };

export function MakeMain({ raw, name, bad }: { raw: RawData; name: string; bad: boolean }) {
  const [phase, setPhase] = useState<Phase>({ k: 'idle' });
  const worker = useRef<Worker | null>(null);
  const stop = () => {
    worker.current?.terminate();
    worker.current = null;
  };
  useEffect(() => stop, []);
  const run = () => {
    stop();
    const w = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setPhase({ k: 'run', done: 0 });
    w.onmessage = (e: MessageEvent<WorkerReply>) => {
      const m = e.data;
      if (m.t === 'progress') setPhase({ k: 'run', done: m.done });
      else {
        stop();
        if (m.t === 'fail') setPhase({ k: 'fail', message: m.message });
        else {
          downloadJson('game-data.json', raw);
          setPhase({ k: 'ok' });
        }
      }
    };
    w.onerror = (e) => {
      stop();
      setPhase({ k: 'fail', message: `Проверка не запустилась: ${e.message || 'ошибка воркера'}` });
    };
    w.postMessage({ kind: 'check', raw, games: GAMES, seed: 1 } satisfies WorkerJob);
  };

  return (
    <div className="admin-make-main">
      <div className="admin-inline">
        <span>
          <b>Сделать набор «{name}» основным:</b> проверка загрузчиком и {GAMES} партий ботов, затем файл <code>game-data.json</code> и инструкция,
          как положить его в репозиторий.
        </span>
        {phase.k === 'run' ? (
          <>
            <progress max={GAMES} value={phase.done} aria-label="Проверка партиями ботов" data-testid="check-progress" />
            <span className="admin-count">
              {phase.done} из {GAMES}
            </span>
            <button className="admin-btn" onClick={() => (stop(), setPhase({ k: 'idle' }))} data-testid="check-cancel">
              Отмена
            </button>
          </>
        ) : (
          <button className="admin-btn primary" disabled={bad} title={bad ? 'Сначала исправьте ошибки в данных' : undefined} onClick={run} data-testid="make-main">
            Скачать как основной
          </button>
        )}
      </div>
      {phase.k === 'fail' && (
        <p className="admin-error" data-testid="check-fail">
          Файл не скачан. {phase.message}
        </p>
      )}
      {phase.k === 'ok' && <Steps onClose={() => setPhase({ k: 'idle' })} />}
    </div>
  );
}

function Steps({ onClose }: { onClose: () => void }) {
  return (
    <div className="admin-sheet-back" onClick={onClose}>
      <section className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby="make-main-title" onClick={(e) => e.stopPropagation()} data-testid="make-main-steps">
        <h2 id="make-main-title">Как сделать набор основным</h2>
        <p>
          Проверка пройдена: {GAMES} партий ботов без ошибок. Файл <code>game-data.json</code> скачан (обычно в папку «Загрузки»).
        </p>
        <ol>
          <li>
            Откройте репозиторий на GitHub:{' '}
            <a href={`${REPO}/tree/main/data`} target="_blank" rel="noreferrer">
              папка data
            </a>
            .
          </li>
          <li>
            Нажмите «Add file» → «Upload files» и перетащите скачанный файл. Имя должно быть точно <code>game-data.json</code> (если браузер
            назвал его <code>game-data (1).json</code> — переименуйте).
          </li>
          <li>
            Или откройте файл <code>game-data.json</code>, нажмите карандаш «Edit», выделите всё и вставьте содержимое скачанного файла.
          </li>
          <li>Внизу нажмите «Commit changes» (зелёная кнопка).</li>
          <li>
            Дождитесь зелёной галочки у коммита (вкладка{' '}
            <a href={`${REPO}/actions`} target="_blank" rel="noreferrer">
              Actions
            </a>
            ): это проверки и сборка сайта. Красный крестик — в данных ошибка, сайт не изменится.
          </li>
          <li>Через несколько минут сайт обновится: этот набор станет «Основным» у всех.</li>
        </ol>
        <button className="admin-btn primary" onClick={onClose} autoFocus>
          Понятно
        </button>
      </section>
    </div>
  );
}
