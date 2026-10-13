import { useMemo } from 'react';
import raw from '../../data/game-data.json';
import { DataError, deckCards, legendCards, loadGameData, seaCards } from '../engine/data';
import type { GameData } from '../engine/types';
import { CardView, SeaCardView } from './CardView';
import { ShipView } from './ShipView';

function load(): { data: GameData } | { error: string } {
  try {
    return { data: loadGameData(raw) };
  } catch (e) {
    return { error: e instanceof DataError ? e.message : String(e) };
  }
}

export function App() {
  const result = useMemo(load, []);
  if ('error' in result) {
    return (
      <main className="page">
        <h1>Бортом к борту</h1>
        <pre className="error">{result.error}</pre>
      </main>
    );
  }
  const { data } = result;
  const legends = legendCards(data);
  const sea = seaCards(data);
  const deckTotal = deckCards(data).length;

  return (
    <main className="page">
      <h1>Бортом к борту</h1>
      <p className="summary">
        Данные версии {data.version}. Всего карт: <b>{deckTotal + legends.length + sea.length}</b> — в колодах{' '}
        {deckTotal}, Легенд {legends.length}, карт моря {sea.length}.
      </p>
      <nav className="toc">
        {data.ships.map((s) => (
          <a key={s.code} href={`#ship-${s.code}`}>
            {s.name}
          </a>
        ))}
        <a href="#sea">Море</a>
      </nav>
      {data.ships.map((ship) => {
        const cards = deckCards(data, ship.code);
        const legend = legends.find((c) => c.deck === ship.code)!;
        return (
          <section key={ship.code} id={`ship-${ship.code}`}>
            <h2>
              {ship.name} <span className="count">{cards.length} карты + Легенда</span>
            </h2>
            <ShipView ship={ship} />
            <div className="cards">
              {cards.map((c) => (
                <CardView key={c.code} card={c} />
              ))}
              <CardView card={legend} />
            </div>
          </section>
        );
      })}
      <section id="sea">
        <h2>
          Море <span className="count">{sea.length} карт</span>
        </h2>
        <div className="cards">
          {sea.map((c) => (
            <SeaCardView key={c.code} card={c} />
          ))}
        </div>
      </section>
    </main>
  );
}
