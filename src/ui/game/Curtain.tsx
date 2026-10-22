// «Передайте устройство» (docs/TZ.md, «Очередь хода», п. 7): full screen in the team's colour with the reason and
// what happened while the team was away. Nothing hidden is rendered under it: the table is not mounted at all.
import type { Side } from '../../engine/types';
import { SIDE_LABEL } from './text';
import { useTableBody } from './tableBody';

export function Curtain({
  side,
  title,
  reason,
  summary,
  onReady,
}: {
  side: Side;
  title: string;
  reason: string;
  summary: string[];
  onReady: () => void;
}) {
  useTableBody('curtain');
  return (
    <main className={`curtain side-${side === 'ПИРАТЫ' ? 'pirates' : 'company'}`} data-testid="curtain">
      <div className="curtain-body">
        <p className="curtain-kicker">Игра на одном экране</p>
        <h1>{title}</h1>
        <p className="curtain-reason">{reason}</p>
        {summary.length > 0 && (
          <section className="curtain-summary">
            <h2>Пока вас не было</h2>
            <ul>
              {summary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}
        <button className="btn curtain-btn" data-testid="curtain-ready" onClick={onReady} autoFocus>
          Я — {SIDE_LABEL[side].name}, показать карты
        </button>
      </div>
    </main>
  );
}
