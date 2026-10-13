// Crew limit and paying for cards (RULES.md 6.4–6.5, 7, 9.1–9.4, 17.3).
import { describe, expect, it } from 'vitest';
import { actDeclining as act, give, newGame, passTo, run, setHand } from './helpers';
// Stage 3 rules without Reactions: `act` here declines every Reaction window the action opens (helpers.actDeclining).

const atCompany = () => passTo(newGame(), 'КОМПАНИЯ');

describe('Crew limit', () => {
  it('a ship plays no more cards in its turn than its Crew (7.1)', () => {
    const s = atCompany();
    const [a, b, c] = setHand(s, 'И', ['Каперский патент', 'Бизнес есть бизнес', 'Шпион Мерсер']);
    const after = run(s, { type: 'playCard', seat: 'И', card: a }, { type: 'playCard', seat: 'И', card: b });
    expect(after.turn.played['И']).toBe(2);
    expect(() => act(after, { type: 'playCard', seat: 'И', card: c })).toThrow('лимит Команды');
  });

  it('a Charge counts toward the limit (7.1)', () => {
    const s = atCompany();
    const [order, charge, other] = setHand(s, 'И', ['Каперский патент', 'Ядра', 'Бизнес есть бизнес']);
    const after = run(
      s,
      { type: 'playCard', seat: 'И', card: order },
      { type: 'volley', ship: 'И', target: 'Ж', charge },
    );
    expect(() => act(after, { type: 'playCard', seat: 'И', card: other })).toThrow('лимит Команды');
  });

  it('a Charge cannot be added when the limit is used up (7.1)', () => {
    const s = atCompany();
    const [a, b, charge] = setHand(s, 'И', ['Каперский патент', 'Бизнес есть бизнес', 'Ядра']);
    const after = run(s, { type: 'playCard', seat: 'И', card: a }, { type: 'playCard', seat: 'И', card: b });
    expect(() => act(after, { type: 'volley', ship: 'И', target: 'Ж', charge })).toThrow('лимит Команды');
    // Without a Charge the Volley is fine.
    expect(act(after, { type: 'volley', ship: 'И', target: 'Ж' }).state.turn.volleys['И']).toBe(1);
  });

  it('the limit is fixed at the start of the turn: Crew damage in the middle of the turn does not change it (7.3, Q1)', () => {
    const s = atCompany();
    const [a, b] = setHand(s, 'И', ['Каперский патент', 'Бизнес есть бизнес']);
    s.ships['И'].tracks.crew = 1;
    const after = run(s, { type: 'playCard', seat: 'И', card: a }, { type: 'playCard', seat: 'И', card: b });
    expect(after.turn.played['И']).toBe(2);
  });

  it('Crew lost before the turn lowers the limit of that turn (7.3)', () => {
    const s = newGame();
    s.ships['И'].tracks.crew = 1;
    const company = act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    expect(company.turn.limit['И']).toBe(1);
    expect(company.turn.limit['Г']).toBe(3);
  });

  it('the limit of each ship is its own', () => {
    const s = atCompany();
    const [a, b] = setHand(s, 'И', ['Каперский патент', 'Бизнес есть бизнес']);
    const [c] = setHand(s, 'Г', ['Сундук мертвеца']);
    const after = run(
      s,
      { type: 'playCard', seat: 'И', card: a },
      { type: 'playCard', seat: 'И', card: b },
      { type: 'playCard', seat: 'Г', card: c },
    );
    expect(after.turn.played).toMatchObject({ И: 2, Г: 1 });
  });
});

describe('playing cards', () => {
  it('a played card goes to the discard of its owner (9.3, 9.4)', () => {
    const s = atCompany();
    const card = give(s, 'Г', 'Каперский патент', 'И');
    const after = act(s, { type: 'playCard', seat: 'Г', card }).state;
    expect(after.ships['Г'].hand).not.toContain(card);
    expect(after.ships['И'].discard).toContain(card);
    expect(after.ships['Г'].discard).not.toContain(card);
  });

  it('the cost is paid in Powder from the team’s Hold (6.3, 9.2)', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Сделка с Сяо Фэном']);
    const before = s.teams['КОМПАНИЯ'].powder;
    const after = act(s, { type: 'playCard', seat: 'И', card }).state;
    expect(after.teams['КОМПАНИЯ'].powder).toBe(before - 2);
  });

  it('without enough Powder the card cannot be played; Powder never goes below 0 (6.5)', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Сделка с Сяо Фэном']);
    s.teams['КОМПАНИЯ'].powder = 1;
    expect(() => act(s, { type: 'playCard', seat: 'И', card })).toThrow('Не хватает Пороха');
    expect(s.teams['КОМПАНИЯ'].powder).toBe(1);
    expect(s.ships['И'].hand).toContain(card);
  });

  it('a Souls cost is paid with the Dutchman’s Souls (6.3, 9.2)', () => {
    const s = atCompany();
    const [card] = setHand(s, 'Г', ['Сто лет службы']);
    expect(s.ships['Г'].souls).toBe(1);
    expect(() => act(s, { type: 'playCard', seat: 'Г', card })).toThrow('Не хватает Душ');
    s.ships['Г'].souls = 3;
    expect(act(s, { type: 'playCard', seat: 'Г', card }).state.ships['Г'].souls).toBe(1);
  });

  it('another Company ship pays Souls with the Dutchman’s Souls too (6.3, Q39)', () => {
    const s = atCompany();
    const card = give(s, 'И', 'Сто лет службы', 'Г');
    s.ships['Г'].souls = 2;
    const r = act(s, { type: 'playCard', seat: 'И', card });
    expect(r.state.ships['Г'].souls).toBe(0);
    expect(r.state.turn.played).toMatchObject({ И: 1, Г: 0 });
    expect(r.events).toContainEqual({ type: 'soulsSpent', ship: 'Г', amount: 2 });
  });

  it('a Souls cost cannot be paid when the Dutchman sank (6.3, Q39)', () => {
    const s = atCompany();
    const card = give(s, 'И', 'Сто лет службы', 'Г');
    s.ships['Г'].souls = 5;
    s.ships['Г'].sunk = true;
    s.ships['Г'].tracks.hull = 0;
    expect(() => act(s, { type: 'playCard', seat: 'И', card })).toThrow('Заплатить Душами нельзя');
    // Neither can the Dutchman's captain on the Endeavour's board.
    const own = give(s, 'Г', 'Сто лет службы', 'Г');
    expect(() => act(s, { type: 'playCard', seat: 'Г', card: own })).toThrow('Заплатить Душами нельзя');
  });

  it('a card with a Souls cost in an enemy hand cannot be played (6.3, Q39)', () => {
    const s = newGame();
    const card = give(s, 'Ж', 'Сто лет службы', 'Г');
    s.ships['Г'].souls = 5;
    expect(() => act(s, { type: 'playCard', seat: 'Ж', card })).toThrow('Заплатить Душами нельзя');
  });

  it('a Reaction cannot be played in your own turn (9.1)', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Двойная обшивка']);
    expect(() => act(s, { type: 'playCard', seat: 'И', card })).toThrow('только в ход противника');
  });

  it('a Charge is played only with a Volley (9.1)', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Ядра']);
    expect(() => act(s, { type: 'playCard', seat: 'И', card })).toThrow('вместе с Залпом');
  });

  it('a Repair is played in your own turn and counts toward the limit (9.1)', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Плотник']);
    expect(act(s, { type: 'playCard', seat: 'И', card }).state.turn.played['И']).toBe(1);
  });

  it('cards are played only in your own turn', () => {
    const s = newGame();
    const [card] = setHand(s, 'И', ['Каперский патент']);
    expect(() => act(s, { type: 'playCard', seat: 'И', card })).toThrow('ход другой команды');
  });

  it('only cards from your own hand', () => {
    const s = atCompany();
    const card = s.ships['И'].deck[0];
    expect(() => act(s, { type: 'playCard', seat: 'И', card })).toThrow('нет на руке');
  });
});

describe('captain of a sunk ship (17.3)', () => {
  const withSunkEndeavour = () => {
    const s = atCompany();
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    return s;
  };

  it('plays 1 card for the ally beyond the ally’s Crew limit; the team pays', () => {
    const s = withSunkEndeavour();
    const own = setHand(s, 'Г', ['Сундук мертвеца', 'Прихлоп Билл', 'Игра в кости лжеца']);
    const [captain, second] = setHand(s, 'И', ['Выгодная сделка', 'Каперский патент']);
    const after = run(
      s,
      ...own.map((card) => ({ type: 'playCard' as const, seat: 'Г', card })),
      { type: 'playCard', seat: 'И', card: captain },
    );
    expect(after.turn.played['Г']).toBe(3);
    expect(after.turn.captainPlayed).toEqual(['И']);
    expect(after.teams['КОМПАНИЯ'].powder).toBe(s.teams['КОМПАНИЯ'].powder - 1);
    expect(after.ships['И'].discard).toContain(captain);
    expect(() => act(after, { type: 'playCard', seat: 'И', card: second })).toThrow('Капитан уже разыграл');
  });

  it('a seat whose ship is afloat cannot play for the ally', () => {
    const s = atCompany();
    const [card] = setHand(s, 'И', ['Ядра']);
    expect(() => act(s, { type: 'volley', ship: 'Г', target: 'М', charge: card, chargeFrom: 'И' })).toThrow(
      'только капитан',
    );
  });
});
