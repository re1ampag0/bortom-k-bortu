import type { Ship } from '../engine/types';
import { RichText } from './RichText';

const STATS: [keyof Ship, string][] = [
  ['hull', 'Корпус'],
  ['sails', 'Паруса'],
  ['guns', 'Пушки'],
  ['crew', 'Команда'],
];

export function ShipView({ ship }: { ship: Ship }) {
  return (
    <div className="ship" style={{ borderColor: ship.color }}>
      <div className="ship-title" style={{ background: ship.color }}>
        <span className="ship-name">{ship.name}</span>
        <span className="ship-side">{ship.side}</span>
      </div>
      <div className="ship-body">
        <p className="ship-captain">
          {ship.captain}. <i>{ship.motto}</i>
        </p>
        <ul className="ship-stats">
          {STATS.map(([key, label]) => (
            <li key={key}>
              <b>{ship[key] as number}</b> {label}
            </li>
          ))}
          {ship.souls !== undefined && (
            <li>
              <b>
                {ship.start_souls ?? 0}/{ship.souls}
              </b>{' '}
              Души
            </li>
          )}
        </ul>
        {ship.abilities.map((a) => (
          <p key={a.name} className="ship-ability">
            <b>{a.name}.</b> <RichText html={a.text} />
          </p>
        ))}
        <p className="ship-legend">
          Легенда: <b>{ship.legend}</b>
        </p>
        <details>
          <summary>Подсказки</summary>
          <ul>
            {ship.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
