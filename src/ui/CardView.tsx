import type { CardInstance, SeaCardInstance } from '../engine/types';
import { RichText } from './RichText';

const TYPE_CLASS: Record<string, string> = {
  ЗАРЯД: 'charge',
  РЕАКЦИЯ: 'reaction',
  ПРИКАЗ: 'order',
  РЕМОНТ: 'repair',
};

export function CardView({ card }: { card: CardInstance }) {
  return (
    <article className={`card ${TYPE_CLASS[card.type]}${card.legend ? ' legend' : ''}`}>
      <header className="card-head">
        <span className="card-type">{card.legend ? `Легенда · ${card.type}` : card.type}</span>
        <span className="card-cost" title="Стоимость">
          {card.cost > 0 && <span className="powder">{card.cost} П</span>}
          {card.soul > 0 && <span className="soul">{card.soul} Д</span>}
          {card.cost === 0 && card.soul === 0 && <span className="free">0</span>}
        </span>
      </header>
      <h3 className="card-name">{card.name}</h3>
      <div className="card-big">{card.big}</div>
      <p className="card-text">
        <RichText html={card.text} />
      </p>
      <p className="card-flavor">{card.flavor}</p>
      <footer className="card-foot">
        <span>{card.code}</span>
        <span title="Ценность по шкале баланса">v {card.v}</span>
      </footer>
    </article>
  );
}

export function SeaCardView({ card }: { card: SeaCardInstance }) {
  return (
    <article className="card sea">
      <header className="card-head">
        <span className="card-type">Море · {card.when}</span>
      </header>
      <h3 className="card-name">{card.name}</h3>
      <div className="card-big">{card.big}</div>
      <p className="card-text">
        <RichText html={card.text} />
      </p>
      <p className="card-flavor">{card.flavor}</p>
      <footer className="card-foot">
        <span>{card.code}</span>
        <span>{card.key}</span>
      </footer>
    </article>
  );
}
