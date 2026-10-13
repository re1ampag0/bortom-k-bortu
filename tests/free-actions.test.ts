// Free actions: sell, give a card, regroup, put out a Fire (RULES.md 8, 14.2, 17.4).
import { describe, expect, it } from 'vitest';
import { act, newGame, passTo, run, setHand } from './helpers';

const atCompany = () => passTo(newGame(), 'КОМПАНИЯ');
const sink = (s: ReturnType<typeof newGame>, code: string) => {
  s.ships[code].sunk = true;
  s.ships[code].tracks.hull = 0;
};

describe('sell a card (8.1)', () => {
  it('discards a card from the hand and puts 1 Powder into the Hold', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Ядра', 'Картечь']);
    const after = act(s, { type: 'sell', seat: 'И', card }).state;
    expect(after.teams['КОМПАНИЯ'].powder).toBe(s.teams['КОМПАНИЯ'].powder + 1);
    expect(after.ships['И'].hand).not.toContain(card);
    expect(after.ships['И'].discard).toContain(card);
    expect(after.turn.played['И']).toBe(0);
  });

  it('once a turn for each player', () => {
    const s = atCompany();
    const [a, b] = setHand(s, 'И', ['Ядра', 'Картечь']);
    const [c] = setHand(s, 'Г', ['Ядра']);
    s.teams['КОМПАНИЯ'].powder = 3;
    const after = run(s, { type: 'sell', seat: 'И', card: a }, { type: 'sell', seat: 'Г', card: c });
    expect(after.teams['КОМПАНИЯ'].powder).toBe(5);
    expect(() => act(after, { type: 'sell', seat: 'И', card: b })).toThrow('один раз за ход');
    // Next turn it is allowed again.
    const next = passTo(passTo(after, 'ПИРАТЫ'), 'КОМПАНИЯ');
    expect(() => act(next, { type: 'sell', seat: 'И', card: next.ships['И'].hand[0] })).not.toThrow();
  });

  it('Powder above 8 burns (6.2)', () => {
    const s = atCompany();
    s.teams['КОМПАНИЯ'].powder = 8;
    const r = act(s, { type: 'sell', seat: 'И', card: s.ships['И'].hand[0] });
    expect(r.state.teams['КОМПАНИЯ'].powder).toBe(8);
    expect(r.events).toContainEqual({ type: 'powderGained', side: 'КОМПАНИЯ', amount: 0, burned: 1, reason: 'sell' });
  });

  it('only in your own turn (8, Q4)', () => {
    const s = newGame();
    expect(() => act(s, { type: 'sell', seat: 'И', card: s.ships['И'].hand[0] })).toThrow('ход другой команды');
  });

  it('the captain of a sunk ship can sell (17.3)', () => {
    const s = atCompany();
    sink(s, 'И');
    expect(act(s, { type: 'sell', seat: 'И', card: s.ships['И'].hand[0] }).state.turn.sold).toEqual(['И']);
  });
});

describe('give a card to the ally (8.2)', () => {
  it('moves 1 card to the ally’s hand, once a turn for each player', () => {
    const s = atCompany();
    const [a, b] = setHand(s, 'И', ['Ядра', 'Картечь']);
    const [c] = setHand(s, 'Г', ['Зов глубин']);
    const after = run(s, { type: 'pass', seat: 'И', card: a }, { type: 'pass', seat: 'Г', card: c });
    expect(after.ships['Г'].hand).toContain(a);
    expect(after.ships['И'].hand).toContain(c);
    expect(after.turn.played).toMatchObject({ И: 0, Г: 0 });
    expect(() => act(after, { type: 'pass', seat: 'И', card: b })).toThrow('один раз за ход');
  });

  it('only in your own turn', () => {
    const s = newGame();
    expect(() => act(s, { type: 'pass', seat: 'И', card: s.ships['И'].hand[0] })).toThrow('ход другой команды');
  });

  it('the captain of a sunk ship can give a card (17.3)', () => {
    const s = atCompany();
    sink(s, 'И');
    const card = s.ships['И'].hand[0];
    expect(act(s, { type: 'pass', seat: 'И', card }).state.ships['Г'].hand).toContain(card);
  });
});

describe('regroup (8.3)', () => {
  it('swaps the team’s ships for 1 Powder, once a turn', () => {
    const s = atCompany();
    const after = act(s, { type: 'regroup', side: 'КОМПАНИЯ' }).state;
    expect([after.ships['И'].pos, after.ships['Г'].pos]).toEqual([1, 0]);
    expect(after.teams['КОМПАНИЯ'].powder).toBe(s.teams['КОМПАНИЯ'].powder - 1);
    expect(() => act(after, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('один раз за ход');
  });

  it('is not possible without Powder', () => {
    const s = atCompany();
    s.teams['КОМПАНИЯ'].powder = 0;
    expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('Не хватает Пороха');
  });

  it('is free for the Pirates while the Black Pearl is afloat (14.2)', () => {
    const s = newGame();
    s.teams['ПИРАТЫ'].powder = 0;
    const after = act(s, { type: 'regroup', side: 'ПИРАТЫ' }).state;
    expect([after.ships['Ж'].pos, after.ships['М'].pos]).toEqual([1, 0]);
    expect(after.teams['ПИРАТЫ'].powder).toBe(0);
  });

  it('costs 1 Powder for the Pirates after the Black Pearl sank; the lone ship moves to the empty place (17.1, 17.4)', () => {
    const s = newGame();
    sink(s, 'Ж');
    const after = act(s, { type: 'regroup', side: 'ПИРАТЫ' }).state;
    expect(after.ships['М'].pos).toBe(0);
    expect(after.teams['ПИРАТЫ'].powder).toBe(s.teams['ПИРАТЫ'].powder - 1);
  });

  it('a lone Black Pearl moves for free (8.3)', () => {
    const s = newGame();
    sink(s, 'М');
    s.teams['ПИРАТЫ'].powder = 0;
    expect(act(s, { type: 'regroup', side: 'ПИРАТЫ' }).state.ships['Ж'].pos).toBe(1);
  });

  it('is not possible if either ship has Sails 0', () => {
    for (const code of ['И', 'Г']) {
      const s = atCompany();
      s.ships[code].tracks.sails = 0;
      expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('Паруса 0');
    }
  });

  it('a lone ship with Sails 0 does not move (8.3, Q23)', () => {
    const s = atCompany();
    sink(s, 'Г');
    s.ships['И'].tracks.sails = 0;
    expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('Паруса 0');
  });

  it('only in your own turn', () => {
    expect(() => act(newGame(), { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('ход другой команды');
  });
});

describe('put out a Fire (8.4)', () => {
  it('discard 1 card — remove 1 Fire, any number of times', () => {
    const s = atCompany();
    s.ships['И'].fires = 3;
    const hand = [...s.ships['И'].hand];
    const after = run(s, ...hand.slice(0, 3).map((card) => ({ type: 'extinguish' as const, seat: 'И', card })));
    expect(after.ships['И'].fires).toBe(0);
    expect(after.ships['И'].discard).toEqual(expect.arrayContaining(hand.slice(0, 3)));
    expect(after.turn.played['И']).toBe(0);
    expect(() => act(after, { type: 'extinguish', seat: 'И', card: hand[3] })).toThrow('нет Пожаров');
  });

  it('only Fires of your own ship', () => {
    const s = atCompany();
    sink(s, 'И');
    s.ships['Г'].fires = 1;
    expect(() => act(s, { type: 'extinguish', seat: 'И', card: s.ships['И'].hand[0] })).toThrow('своего корабля');
  });

  it('only in your own turn', () => {
    const s = newGame();
    s.ships['И'].fires = 1;
    expect(() => act(s, { type: 'extinguish', seat: 'И', card: s.ships['И'].hand[0] })).toThrow('ход другой команды');
  });
});
