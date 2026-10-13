// Simple Charges: state before → Volley with the Charge → state after (RULES.md 9.1, 10.1, 10.5–10.8, 18.13).
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { actDeclining as act, newGame, passTo, setHand } from './helpers';
// Stage 3 rules without Reactions: `act` here declines every Reaction window the action opens (helpers.actDeclining).

/** The turn of `side` with 8 Powder and the Charge in the shooter's hand. */
function prepare(side: GameState['active'], shooter: string, charge: string) {
  const s = passTo(newGame(), side);
  s.teams[side].powder = 8;
  const [card] = setHand(s, shooter, [charge]);
  return { s, card };
}

function fire(shooter: string, target: string, charge: string, side: GameState['active'], paid?: number) {
  const { s, card } = prepare(side, shooter, charge);
  const r = act(s, { type: 'volley', ship: shooter, target, charge: card, paid });
  return { before: s, after: r.state, card, events: r.events };
}

describe('simple Charges', () => {
  it('«Ядра»: +1 damage', () => {
    const { after } = fire('И', 'Ж', 'Ядра', 'КОМПАНИЯ');
    expect(after.ships['Ж'].tracks.hull).toBe(9 - 4);
  });

  it('«Ядра» of the Black Pearl outside a Plan: only +1', () => {
    const { after } = fire('Ж', 'И', 'Ядра', 'ПИРАТЫ');
    expect(after.ships['И'].tracks.hull).toBe(12 - 3);
  });

  it('«Книппели»: hits the Sails; what the Sails cannot take goes to the Hull (10.8, 11.1)', () => {
    const { after } = fire('Ж', 'И', 'Книппели', 'ПИРАТЫ');
    expect(after.ships['И'].tracks).toMatchObject({ sails: 0, hull: 11 });
  });

  it('«Картечь»: hits the Crew, not below 1 (10.8, 11.1)', () => {
    const { after } = fire('И', 'Ж', 'Картечь', 'КОМПАНИЯ');
    expect(after.ships['Ж'].tracks).toMatchObject({ crew: 1, hull: 8 });
  });

  it('«Огонь по орудиям»: hits the Guns', () => {
    const { after } = fire('М', 'Г', 'Огонь по орудиям', 'ПИРАТЫ');
    expect(after.ships['Г'].tracks).toMatchObject({ guns: 0, hull: 10 });
  });

  it('«Бросить якорь»: +2 and no diagonal penalty, the Volley is still diagonal (10.6)', () => {
    const { before, after, events } = fire('Ж', 'Г', 'Бросить якорь', 'ПИРАТЫ');
    expect(after.ships['Г'].tracks.hull).toBe(11 - 4);
    expect(events).toContainEqual(expect.objectContaining({ type: 'volley', diagonal: true, damage: 4 }));
    expect(after.teams['ПИРАТЫ'].powder).toBe(before.teams['ПИРАТЫ'].powder - 2);
  });

  it('«Залп всей батареей»: +3, costs 2', () => {
    const { before, after } = fire('И', 'Ж', 'Залп всей батареей', 'КОМПАНИЯ');
    expect(after.ships['Ж'].tracks.hull).toBe(9 - 6);
    expect(after.teams['КОМПАНИЯ'].powder).toBe(before.teams['КОМПАНИЯ'].powder - 3);
  });

  it('«Прицельный огонь»: hits the Guns, +1, no diagonal penalty', () => {
    const { after } = fire('И', 'М', 'Прицельный огонь', 'КОМПАНИЯ');
    expect(after.ships['М'].tracks).toMatchObject({ guns: 0, hull: 10 });
  });

  it('«Калёные ядра»: +2 if the target has a Fire', () => {
    const { s, card } = prepare('ПИРАТЫ', 'М', 'Калёные ядра');
    expect(act(s, { type: 'volley', ship: 'М', target: 'Г', charge: card }).state.ships['Г'].tracks.hull).toBe(8);
    s.ships['Г'].fires = 1;
    expect(act(s, { type: 'volley', ship: 'М', target: 'Г', charge: card }).state.ships['Г'].tracks.hull).toBe(6);
  });

  it('«Зов глубин»: +2 if the target already took damage this turn', () => {
    const { s, card } = prepare('КОМПАНИЯ', 'Г', 'Зов глубин');
    const other = act(act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state, {
      type: 'volley',
      ship: 'Г',
      target: 'М',
      charge: card,
    });
    expect(other.state.ships['М'].tracks.hull).toBe(11 - 2);
    const same = act(act(s, { type: 'volley', ship: 'И', target: 'М' }).state, {
      type: 'volley',
      ship: 'Г',
      target: 'М',
      charge: card,
    });
    // И on the diagonal: 2. Г: 2 + 2 (Зов глубин) + 1 (joint volley).
    expect(same.state.ships['М'].tracks.hull).toBe(11 - 2 - 5);
  });

  it('«Оплаченный залп»: +1 and +1 for each Powder paid, up to 3', () => {
    const { before, after } = fire('И', 'Ж', 'Оплаченный залп', 'КОМПАНИЯ', 3);
    expect(after.ships['Ж'].tracks.hull).toBe(9 - 7);
    expect(after.teams['КОМПАНИЯ'].powder).toBe(before.teams['КОМПАНИЯ'].powder - 4);
    expect(fire('И', 'Ж', 'Оплаченный залп', 'КОМПАНИЯ', 0).after.ships['Ж'].tracks.hull).toBe(9 - 4);
    expect(() => fire('И', 'Ж', 'Оплаченный залп', 'КОМПАНИЯ', 4)).toThrow('от 0 до 3');
    expect(() => fire('И', 'Ж', 'Ядра', 'КОМПАНИЯ', 1)).toThrow('Оплаченным залпом');
  });

  it('«Греческий огонь»: +1 and a Fire on the target, no more than 3 (13.1, 18.13)', () => {
    const { before, after } = fire('М', 'Г', 'Греческий огонь', 'ПИРАТЫ');
    expect(after.ships['Г'].tracks.hull).toBe(11 - 4);
    expect(after.ships['Г'].fires).toBe(1);
    expect(after.teams['ПИРАТЫ'].powder).toBe(before.teams['ПИРАТЫ'].powder - 2);
    const { s, card } = prepare('ПИРАТЫ', 'М', 'Греческий огонь');
    s.ships['Г'].fires = 3;
    expect(act(s, { type: 'volley', ship: 'М', target: 'Г', charge: card }).state.ships['Г'].fires).toBe(3);
  });

  it('«Один выстрел» outside a Plan: +1', () => {
    expect(fire('Ж', 'И', 'Один выстрел', 'ПИРАТЫ').after.ships['И'].tracks.hull).toBe(12 - 3);
  });

  it('«Из пучины»: +1 and no diagonal penalty', () => {
    expect(fire('Г', 'Ж', 'Из пучины', 'КОМПАНИЯ').after.ships['Ж'].tracks.hull).toBe(9 - 3);
  });
});

describe('Charge rules', () => {
  it('the Charge goes to the discard of its owner and counts as a played card (9.3, 7.1)', () => {
    const { after, card } = fire('И', 'Ж', 'Ядра', 'КОМПАНИЯ');
    expect(after.ships['И'].hand).not.toContain(card);
    expect(after.ships['И'].discard).toContain(card);
    expect(after.turn.played['И']).toBe(1);
  });

  it('only a Charge can be added to a Volley (9.1)', () => {
    const { s, card } = prepare('КОМПАНИЯ', 'И', 'Каперский патент');
    expect(() => act(s, { type: 'volley', ship: 'И', target: 'Ж', charge: card })).toThrow('только Заряд');
  });

  it('without Powder for the Charge there is no Volley with it (6.5)', () => {
    const { s, card } = prepare('КОМПАНИЯ', 'И', 'Залп всей батареей');
    s.teams['КОМПАНИЯ'].powder = 2;
    expect(() => act(s, { type: 'volley', ship: 'И', target: 'Ж', charge: card })).toThrow('Не хватает Пороха');
  });

  it('a Charge given by the ally is played by the ship that holds it and goes to its owner’s discard (9.4)', () => {
    const { s, card } = prepare('КОМПАНИЯ', 'И', 'Картечь');
    const after = act(act(s, { type: 'pass', seat: 'И', card }).state, {
      type: 'volley',
      ship: 'Г',
      target: 'М',
      charge: card,
    }).state;
    expect(after.ships['М'].tracks.crew).toBe(1);
    expect(after.ships['И'].discard).toContain(card);
    expect(after.turn.played).toMatchObject({ И: 0, Г: 1 });
  });

  it('a captain adds a Charge to the ally’s Volley as the captain’s card of the turn (17.3, Q6)', () => {
    const { s, card } = prepare('КОМПАНИЯ', 'И', 'Ядра');
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    const [other] = setHand(s, 'Г', ['Сундук мертвеца']);
    s.ships['И'].hand.push(other); // a second card for the captain
    s.ships['Г'].hand = [];
    const after = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: card, chargeFrom: 'И' }).state;
    expect(after.ships['М'].tracks.hull).toBe(11 - 3);
    expect(after.turn.played['Г']).toBe(0);
    expect(after.turn.captainPlayed).toEqual(['И']);
    expect(after.ships['И'].discard).toContain(card);
    expect(() => act(after, { type: 'playCard', seat: 'И', card: other })).toThrow('Капитан уже разыграл');
  });

  it('a captain who already played a card cannot add a Charge (17.3)', () => {
    const { s, card } = prepare('КОМПАНИЯ', 'И', 'Ядра');
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    s.turn.captainPlayed = ['И'];
    expect(() => act(s, { type: 'volley', ship: 'Г', target: 'М', charge: card, chargeFrom: 'И' })).toThrow(
      'Капитан уже разыграл',
    );
  });
});
