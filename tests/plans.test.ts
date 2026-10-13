// «Безумный план» of the Black Pearl (RULES.md 14.1, 7.4, 9.5, 9.8, Q2, Q36).
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { act, give, newGame, passTo, setHand } from './helpers';

/** The Pirates' turn with 8 Powder and an empty hand of the Company (no Reaction windows). */
function piratesTurn(): GameState {
  const s = passTo(newGame(), 'ПИРАТЫ');
  s.teams['ПИРАТЫ'].powder = 8;
  setHand(s, 'И', []);
  setHand(s, 'Г', []);
  return s;
}

describe('Plans of the Black Pearl', () => {
  it('at the end of her turn the Black Pearl puts up to 2 cards from her hand into Plans', () => {
    const s = piratesTurn();
    const [a, b, c] = s.ships['Ж'].hand;
    expect(() => act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans: [a, b, c] })).toThrow('не больше 2');
    expect(() => act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans: [s.ships['М'].hand[0]] })).toThrow('с руки «Жемчужины»');
    const after = act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans: [a, b] }).state;
    expect(after.ships['Ж'].plans).toEqual([a, b]);
    expect(after.ships['Ж'].hand).not.toContain(a);
  });

  it('no more than 2 Plans in all', () => {
    const s = piratesTurn();
    s.ships['Ж'].plans = [s.ships['Ж'].hand.shift()!];
    const [a, b] = s.ships['Ж'].hand;
    expect(() => act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans: [a, b] })).toThrow('не больше 2');
    expect(act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans: [a] }).state.ships['Ж'].plans).toHaveLength(2);
  });

  it('only the Pirates have Plans', () => {
    const s = passTo(newGame(), 'КОМПАНИЯ');
    expect(() => act(s, { type: 'endTurn', side: 'КОМПАНИЯ', plans: [s.ships['И'].hand[0]] })).toThrow('Планы кладёт');
  });

  it('Plans count as cards in hand when drawing (5.5)', () => {
    let s = piratesTurn();
    const plans = s.ships['Ж'].hand.slice(0, 2);
    s = act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans }).state;
    s = passTo(s, 'ПИРАТЫ');
    expect(s.ships['Ж'].hand.length + s.ships['Ж'].plans.length).toBe(5);
    expect(s.ships['Ж'].plans).toEqual(plans);
  });

  it('in her own turn Plans are played as ordinary cards and count toward the Crew limit, Charges too (7.4, Q2)', () => {
    let s = piratesTurn();
    const [balls, chain] = setHand(s, 'Ж', ['Ядра', 'Книппели']);
    s.ships['Ж'].hand = [];
    s.ships['Ж'].plans = [balls, chain];
    s.turn.limit['Ж'] = 1;
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И', charge: balls }).state;
    expect(s.turn.played['Ж']).toBe(1);
    expect(s.ships['Ж'].plans).toEqual([chain]);
    expect(s.ships['Ж'].discard).toContain(balls);
  });

  it('an Order from a Plan is played in her own turn (7.4)', () => {
    let s = piratesTurn();
    const [order] = setHand(s, 'Ж', ['Компас Джека']);
    s.ships['Ж'].hand = [];
    s.ships['Ж'].plans = [order];
    s = act(s, { type: 'playCard', seat: 'Ж', card: order }).state;
    expect(s.ships['Ж'].plans).toEqual([]);
    expect(s.turn.played['Ж']).toBe(1);
  });

  it('a card played from a Plan gets its «План:» bonus: «Ядра» +2 instead of +1 (9.5)', () => {
    let s = piratesTurn();
    const [balls] = setHand(s, 'Ж', ['Ядра']);
    s.ships['Ж'].hand = [];
    s.ships['Ж'].plans = [balls];
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И', charge: balls }).state;
    expect(s.ships['И'].tracks.hull).toBe(12 - 4);
  });

  it('Plans are not the hand: they cannot be sold, passed or discarded to put out a Fire (Q36)', () => {
    const s = piratesTurn();
    const [card] = setHand(s, 'Ж', ['Ядра']);
    s.ships['Ж'].hand = [];
    s.ships['Ж'].plans = [card];
    s.ships['Ж'].fires = 1;
    expect(() => act(s, { type: 'sell', seat: 'Ж', card })).toThrow('нет на руке');
    expect(() => act(s, { type: 'pass', seat: 'Ж', card })).toThrow('нет на руке');
    expect(() => act(s, { type: 'extinguish', seat: 'Ж', card })).toThrow('нет на руке');
  });

  it('a Plan of another ship’s deck goes back to its owner’s discard when played (9.3)', () => {
    let s = piratesTurn();
    const card = give(s, 'Ж', 'Ядра', 'М');
    s.ships['Ж'].hand = s.ships['Ж'].hand.filter((c) => c !== card);
    s.ships['Ж'].plans = [card];
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И', charge: card }).state;
    expect(s.ships['М'].discard).toContain(card);
  });
});
