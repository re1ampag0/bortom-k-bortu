import {plural} from './game/victoryStats';
// The catalog of ships and cards (stage 2): opened from the setup screen.
import { deckCards, legendCards, seaCards } from '../engine/data';
import type { GameData } from '../engine/types';
import { CardView, SeaCardView } from './CardView';
import { ShipView } from './ShipView';

export function Catalog({ data, onBack }: { data: GameData; onBack: () => void }) {
  const legends = legendCards(data);
  const sea = seaCards(data);
  const deckTotal = deckCards(data).length;

  return (
    <main className="page polish-catalog">
      <button className="btn back" onClick={onBack}>
        ← К игре
      </button>
      <h1>Карты и корабли</h1>
      <p className="summary">
        Данные версии {data.version}. Всего карт: <b>{deckTotal + legends.length + sea.length}</b>: в колодах{' '}
        {deckTotal}, Легенд {legends.length}, карт моря {sea.length}.
      </p>
      <nav className="toc">
        {data.ships.map((s) => (
          <a key={s.code} style={{background:s.color}} href={`#ship-${s.code}`}>
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
              {ship.name} <span className="count">{cards.length} {plural(cards.length,'карта','карты','карт')} + Легенда</span>
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
