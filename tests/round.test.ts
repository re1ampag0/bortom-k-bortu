// Round order, Hold, Fires at the start of a turn, drawing (RULES.md 4, 5, 6, 9.3, 13).
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/engine';
import { act, data, declineAll, newGame, passTo, setHand } from './helpers';

const types = (events: { type: string }[]) => events.map((e) => e.type);

describe('round', () => {
  it('a round is: sea card → Pirates’ turn → Company’s turn (4.1)', () => {
    // Effects of the sea card come between its reveal and the turn; here only the order of the three parts matters.
    const order = ['roundStarted', 'seaRevealed', 'turnStarted'];
    const first = createGame(data, { seed: 1 }).events.filter((e) => order.includes(e.type));
    expect(types(first).slice(0, 3)).toEqual(order);
    expect(first[2]).toEqual({ type: 'turnStarted', side: 'ПИРАТЫ' });

    let s = newGame({ sea: true });
    const pirates = act(s, { type: 'endTurn', side: 'ПИРАТЫ' });
    expect(pirates.state.round).toBe(1);
    expect(pirates.state.active).toBe('КОМПАНИЯ');
    expect(types(pirates.events)).not.toContain('seaRevealed');

    const company = act(pirates.state, { type: 'endTurn', side: 'КОМПАНИЯ' });
    s = company.state;
    expect(s.round).toBe(2);
    expect(s.active).toBe('ПИРАТЫ');
    const t = types(company.events);
    expect(t.indexOf('roundStarted')).toBeLessThan(t.indexOf('seaRevealed'));
    expect(t.indexOf('seaRevealed')).toBeLessThan(t.lastIndexOf('turnStarted'));
  });

  it('only the active team may end the turn', () => {
    expect(() => act(newGame(), { type: 'endTurn', side: 'КОМПАНИЯ' })).toThrow('ход другой команды');
  });

  it('the previous sea card goes to the sea discard (4.2)', () => {
    const s = declineAll(newGame({ sea: true }));
    const first = s.sea!.current;
    const next = passTo(act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state, 'ПИРАТЫ');
    expect(next.sea!.discard).toEqual([first]);
    expect(next.sea!.current).not.toBe(first);
    expect(next.sea!.deck).toHaveLength(15);
  });

  it('when the sea deck runs out, all 17 cards are shuffled into a new deck (4.3)', () => {
    let s = declineAll(newGame({ sea: true }));
    for (let round = 1; round < 17; round++) s = passTo(act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state, 'ПИРАТЫ');
    expect(s.round).toBe(17);
    expect(s.sea!.deck).toHaveLength(0);
    const last = s.sea!.current;
    const r = act(passTo(act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state, 'КОМПАНИЯ'), { type: 'endTurn', side: 'КОМПАНИЯ' });
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'seaRevealed', reshuffled: true }));
    const sea = r.state.sea!;
    expect(sea.discard).toEqual([]);
    expect(sea.deck).toHaveLength(16);
    expect(new Set([sea.current, ...sea.deck]).size).toBe(17);
    expect([sea.current, ...sea.deck]).toContain(last);
  });

  it('without a winner after 30 rounds the game is a draw (4.4)', () => {
    let s = passTo(newGame(), 'КОМПАНИЯ');
    s.round = 29;
    s = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' }).state;
    expect(s.round).toBe(30);
    expect(s.winner).toBeNull();
    const r = act(passTo(s, 'КОМПАНИЯ'), { type: 'endTurn', side: 'КОМПАНИЯ' });
    expect(r.state.winner).toBe('НИЧЬЯ');
    expect(r.events).toContainEqual({ type: 'gameOver', winner: 'НИЧЬЯ', reason: 'rounds' });
    expect(() => act(r.state, { type: 'endTurn', side: r.state.active })).toThrow('Партия окончена');
  });
});

describe('Hold', () => {
  it('the Pirates get 2 in the very first turn, then 3; the Company gets 3 from its first turn (5.2, 2.6)', () => {
    let s = newGame();
    expect(s.teams['ПИРАТЫ'].powder).toBe(2);
    s = act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    expect(s.teams['КОМПАНИЯ'].powder).toBe(7);
    s = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' }).state;
    expect(s.teams['ПИРАТЫ'].powder).toBe(5);
  });

  it('there is never more than 8 Powder; the rest burns (6.2)', () => {
    let s = act(newGame(), { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    expect(s.teams['КОМПАНИЯ'].powder).toBe(7);
    s = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' }).state;
    const r = act(s, { type: 'endTurn', side: 'ПИРАТЫ' });
    expect(r.state.teams['КОМПАНИЯ'].powder).toBe(8);
    expect(r.events).toContainEqual({ type: 'powderGained', side: 'КОМПАНИЯ', amount: 1, burned: 2, reason: 'hold' });
  });
});

describe('Fires at the start of a turn', () => {
  it('right after the Hold each Fire deals 1 damage to the Hull, before drawing (5.3, 13.2)', () => {
    let s = act(newGame(), { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    s.ships['Ж'].fires = 2;
    setHand(s, 'Ж', ['Ядра']);
    const r = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' });
    expect(r.state.ships['Ж'].tracks.hull).toBe(7);
    expect(r.state.ships['Ж'].fires).toBe(2);
    const t = types(r.events);
    const hold = r.events.findIndex((e) => e.type === 'powderGained' && e.side === 'ПИРАТЫ');
    const fire = t.indexOf('fireDamage');
    const draw = r.events.findIndex((e) => e.type === 'drew' && e.seat === 'Ж');
    expect(hold).toBeGreaterThan(t.indexOf('turnStarted'));
    expect(fire).toBeGreaterThan(hold);
    expect(draw).toBeGreaterThan(fire);
  });

  it('Fires do not burn in the other team’s turn', () => {
    const s = newGame();
    s.ships['Ж'].fires = 3;
    const r = act(s, { type: 'endTurn', side: 'ПИРАТЫ' });
    expect(r.state.ships['Ж'].tracks.hull).toBe(9);
  });

  it('Fires can sink the last ship: the team loses at once (13.2, 19.1)', () => {
    // Without Legends: «Джек ускользает» would save the Black Pearl.
    let s = act(newGame({ legends: false }), { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    s.ships['М'].sunk = true;
    s.ships['М'].tracks.hull = 0;
    s.ships['Ж'].tracks.hull = 1;
    s.ships['Ж'].fires = 1;
    const r = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' });
    expect(r.state.ships['Ж'].sunk).toBe(true);
    expect(r.state.winner).toBe('КОМПАНИЯ');
    expect(types(r.events)).not.toContain('drew');
  });
});

describe('drawing', () => {
  const companyEnds = (s: ReturnType<typeof newGame>) => act(s, { type: 'endTurn', side: 'КОМПАНИЯ' });
  const atCompany = () => act(newGame(), { type: 'endTurn', side: 'ПИРАТЫ' }).state;

  it('each player of the team draws up to 5 at the start of the turn (5.5)', () => {
    const s = atCompany();
    setHand(s, 'Ж', ['Ядра', 'Книппели']);
    setHand(s, 'М', []);
    const r = companyEnds(s);
    expect(r.state.ships['Ж'].hand).toHaveLength(5);
    expect(r.state.ships['М'].hand).toHaveLength(5);
    expect(r.events).toContainEqual({ type: 'drew', seat: 'Ж', count: 3, cards: expect.any(Array) });
    expect(r.events).toContainEqual({ type: 'drew', seat: 'М', count: 5, cards: expect.any(Array) });
  });

  it('a player with 5 or more cards neither draws nor discards (5.5)', () => {
    const s = atCompany();
    s.ships['Ж'].hand.push(s.ships['Ж'].deck.shift()!, s.ships['Ж'].deck.shift()!);
    const r = companyEnds(s);
    expect(r.state.ships['Ж'].hand).toHaveLength(7);
    expect(r.events.some((e) => e.type === 'drew' && e.seat === 'Ж')).toBe(false);
  });

  it('Plans count as cards in hand (5.5)', () => {
    const s = atCompany();
    const plans = setHand(s, 'Ж', ['Ядра', 'Книппели']);
    s.ships['Ж'].hand = [];
    s.ships['Ж'].plans = plans;
    const r = companyEnds(s);
    expect(r.state.ships['Ж'].hand).toHaveLength(3);
    expect(r.state.ships['Ж'].plans).toEqual(plans);
  });

  it('an empty deck is made again from the shuffled discard (9.3)', () => {
    const s = atCompany();
    const ship = s.ships['Ж'];
    const all = [...ship.hand, ...ship.deck];
    ship.hand = all.slice(0, 1);
    ship.discard = all.slice(1, 8);
    ship.deck = [];
    const r = companyEnds(s);
    const after = r.state.ships['Ж'];
    expect(r.events).toContainEqual({ type: 'deckReshuffled', seat: 'Ж' });
    expect(after.hand).toHaveLength(5);
    expect(after.deck).toHaveLength(3);
    expect(after.discard).toHaveLength(0);
    expect(new Set([...after.hand, ...after.deck])).toEqual(new Set(all.slice(0, 8)));
  });

  it('with an empty deck and an empty discard no card is drawn (9.3)', () => {
    const s = atCompany();
    const ship = s.ships['Ж'];
    ship.deck = [];
    ship.discard = [];
    ship.hand = ship.hand.slice(0, 2);
    const r = companyEnds(s);
    expect(r.state.ships['Ж'].hand).toHaveLength(2);
  });

  it('the captain of a sunk ship draws too (5.5, 17.2)', () => {
    const s = atCompany();
    s.ships['М'].sunk = true;
    s.ships['М'].tracks.hull = 0;
    s.ships['М'].hand = [];
    const r = companyEnds(s);
    expect(r.state.ships['М'].hand).toHaveLength(5);
  });
});
