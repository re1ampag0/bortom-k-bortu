import {CELLS} from './game/art/cells';
import {CardArt} from './CardArt';
import {uiWords} from './uiWords';
import type { CardInstance, SeaCardInstance } from '../engine/types';
import { RichText } from './RichText';

const TYPE_CLASS: Record<string, string> = {
  ЗАРЯД: 'charge',
  РЕАКЦИЯ: 'reaction',
  ПРИКАЗ: 'order',
  РЕМОНТ: 'repair',
};

export function CardView({ card, shipName }: { card: CardInstance;shipName?:string }) {
  return (
    <article className={`card ${TYPE_CLASS[card.type]} ${card.text.length>420?'extra-long':card.text.length>250?'long':''}${card.legend ? ' legend' : ''}`}>
      <header className="card-head">
        <span className="card-type">{card.legend ? `Легенда · ${card.type}` : card.type}</span>
        <span className="card-cost" title="Стоимость">
          {card.cost > 0 && <span className="powder">{card.cost} <span aria-hidden="true" dangerouslySetInnerHTML={{__html:CELLS.KEG_S}}/></span>}
          {card.soul > 0 && <span className="soul">{card.soul} Д</span>}
          {card.cost === 0 && card.soul === 0 && <span className="free">0</span>}
        </span>
      </header>
      {!card.legend&&<CardArt name={card.name}/>} 
      <h3 className="card-name">{card.name}</h3>
      {!card.legend&&<span className="card-orn" aria-hidden="true"/>}
      <div className="card-big">{uiWords(card.big)}</div>
      <p className="card-text">
        <RichText html={card.text} />
      </p>
      <p className="card-flavor">{uiWords(card.flavor)}</p>
      <footer className="card-foot">
        <span>{shipName??card.code}</span>

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
      <div className="polish-card-art" aria-hidden="true"/>
      <h3 className="card-name">{card.name}</h3>
      <div className="card-big">{uiWords(card.big)}</div>
      <p className="card-text">
        <RichText html={card.text} />
      </p>
      <p className="card-flavor">{uiWords(card.flavor)}</p>
      <footer className="card-foot">
        <span>{card.code}</span>

      </footer>
    </article>
  );
}
