// Cards of the Flying Dutchman deck (RULES.md 6.3, 9, 10.2, 12.6, 14.7, 18.1, 18.8, 18.15, 18.18, Q12, Q39, Q43, Q45).
// Charges and most Reactions are tested in charges, reactions and abilities.
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '../src/engine/state';
import { act, cardIn, give, namesOf, turnOf } from './helpers';

const play = (s: GameState, seat: string, name: string, extra: Partial<Extract<Action, { type: 'playCard' }>> = {}) =>
  act(s, { type: 'playCard', seat, card: cardIn(s, seat, name), ...extra });
const choose = (s: GameState, seat: string, cards: string[]) => act(s, { type: 'choose', seat, cards }).state;
const react = (s: GameState, seat: string, name: string) => act(s, { type: 'react', seat, card: cardIn(s, seat, name) }).state;

describe('Orders of the Dutchman', () => {
  it('«Всплытие»: 2 Powder, one more Volley of the Dutchman at once, +2, no Reactions, no Powder for it (10.2, 12.6)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Всплытие'], М: ['Тяжёлый борт'] });
    s = act(s, { type: 'volley', ship: 'Г', target: 'Ж' }).state;
    s = play(s, 'Г', 'Всплытие', { target: 'М' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['М'].tracks.hull).toBe(11 - (2 + 2));
    // 8 − 1 (Volley) − 2 (card).
    expect(s.teams['КОМПАНИЯ'].powder).toBe(5);
  });

  it('«Всплытие» played by the Endeavour: the Dutchman fires (Q43)', () => {
    let s = turnOf('КОМПАНИЯ', {});
    const card = give(s, 'И', 'Всплытие', 'Г');
    s = act(s, { type: 'playCard', seat: 'И', card, target: 'М' }).state;
    // Guns 2 of the Dutchman opposite + 2; «Индевор» would deal 3 − 1 + 2.
    expect(s.ships['М'].tracks.hull).toBe(11 - 4);
    expect(s.turn.volleys).toMatchObject({ И: 0, Г: 0 });
  });

  it('«Всплытие»: no Volley under «Право на переговоры» (18.15)', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Всплытие'] });
    s.ships['Г'].parley = true;
    expect(() => play(s, 'Г', 'Всплытие', { target: 'М' })).toThrow('Право на переговоры');
  });

  it('«Сундук мертвеца»: draw 2 cards', () => {
    expect(play(turnOf('КОМПАНИЯ', { Г: ['Сундук мертвеца'] }), 'Г', 'Сундук мертвеца').state.ships['Г'].hand).toHaveLength(2);
  });

  it('«Абордаж рыболюдей»: only the ship opposite, 2 Crew damage; the Dutchman gets a Soul (14.7)', () => {
    const r = play(turnOf('КОМПАНИЯ', { Г: ['Абордаж рыболюдей'] }), 'Г', 'Абордаж рыболюдей').state;
    expect(r.ships['М'].tracks.crew).toBe(1);
    expect(r.ships['Г'].souls).toBe(2);
    expect(r.teams['КОМПАНИЯ'].powder).toBe(7);
  });

  it('«Колокол «Голландца»»: each enemy player discards 1 card of his choice; draw 1 (Q45)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Колокол «Голландца»'], Ж: ['Ядра', 'Книппели'], М: ['Брандер'] });
    s.ships['Ж'].plans = s.ships['Ж'].deck.splice(0, 1);
    s = play(s, 'Г', 'Колокол «Голландца»').state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'bell', waiting: ['Ж', 'М'] });
    expect(() => choose(s, 'Г', [s.ships['Г'].hand[0]])).toThrow('нечего выбирать');
    s = choose(s, 'М', [cardIn(s, 'М', 'Брандер')]);
    s = choose(s, 'Ж', [cardIn(s, 'Ж', 'Книппели')]);
    expect(s.pending).toBeNull();
    expect(namesOf(s.ships['Ж'].hand)).toEqual(['Ядра']);
    expect(s.ships['Ж'].plans).toHaveLength(1);
    expect(s.ships['М'].hand).toEqual([]);
    expect(namesOf(s.ships['М'].discard)).toContain('Брандер');
    expect(s.ships['Г'].hand).toHaveLength(1);
  });

  it('«Колокол «Голландца»»: a player with an empty hand discards nothing', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Колокол «Голландца»'], Ж: ['Ядра'] });
    s = play(s, 'Г', 'Колокол «Голландца»').state;
    expect(s.pending).toMatchObject({ waiting: ['Ж'] });
  });

  it('«Чёрная метка»: until the end of the turn each Volley at the ship deals +2; not cards «Это не Залп» (9.6)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Чёрная метка'], И: ['Ничего личного'] });
    s = play(s, 'Г', 'Чёрная метка', { target: 'Ж' }).state;
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 5);
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(s.ships['М'].tracks.hull).toBe(11 - 2);
    s.ships['Ж'].tracks.hull = 9;
    s = play(s, 'И', 'Ничего личного', { target: 'Ж' }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(6);
  });

  it('«Чёрная метка» and «Прикрыть бортом»: the mark of the first target stays (18.1)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Чёрная метка'] });
    give(s, 'М', 'Прикрыть бортом', 'М');
    s = play(s, 'Г', 'Чёрная метка', { target: 'Ж' }).state;
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    s = react(s, 'М', 'Прикрыть бортом');
    expect(s.ships['М'].tracks.hull).toBe(11 - (3 + 2 - 1));
  });

  it('«Сто лет службы»: 2 Souls; the enemy ship loses 2 Crew, the Dutchman restores 2 Crew (Q39)', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Сто лет службы'] });
    s.ships['Г'].souls = 2;
    s.ships['Г'].tracks.crew = 1;
    const r = play(s, 'Г', 'Сто лет службы', { target: 'Ж' }).state;
    expect(r.ships['Ж'].tracks.crew).toBe(1);
    expect(r.ships['Г'].tracks.crew).toBe(3);
    expect(r.ships['Г'].souls).toBe(1);
  });

  it('«Сто лет службы» played by the Endeavour: the Dutchman restores the Crew (Q43)', () => {
    const s = turnOf('КОМПАНИЯ', {});
    const card = give(s, 'И', 'Сто лет службы', 'Г');
    s.ships['Г'].souls = 2;
    s.ships['Г'].tracks.crew = 1;
    s.ships['И'].tracks.crew = 1;
    const r = act(s, { type: 'playCard', seat: 'И', card, target: 'Ж' }).state;
    expect(r.ships['Г'].tracks.crew).toBe(3);
    expect(r.ships['И'].tracks.crew).toBe(1);
  });

  it('«Прихлоп Билл»: draw 1 card and get 1 Soul, no more than 5 (14.7)', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Прихлоп Билл'] });
    const r = play(s, 'Г', 'Прихлоп Билл').state;
    expect(r.ships['Г'].souls).toBe(2);
    expect(r.ships['Г'].hand).toHaveLength(1);
    s.ships['Г'].souls = 5;
    expect(play(s, 'Г', 'Прихлоп Билл').state.ships['Г'].souls).toBe(5);
  });

  it('«Прихлоп Билл» played by the Endeavour: the Soul goes to the Dutchman (6.3)', () => {
    const s = turnOf('КОМПАНИЯ', {});
    const card = give(s, 'И', 'Прихлоп Билл', 'Г');
    expect(act(s, { type: 'playCard', seat: 'И', card }).state.ships['Г'].souls).toBe(2);
  });

  it('«Жатва»: 1 Powder, each enemy ship takes 1 Crew damage; a Soul for each (Q12, Q13)', () => {
    const r = play(turnOf('КОМПАНИЯ', { Г: ['Жатва'] }), 'Г', 'Жатва').state;
    expect(r.ships['Ж'].tracks.crew).toBe(2);
    expect(r.ships['М'].tracks.crew).toBe(2);
    expect(r.ships['Г'].souls).toBe(3);
  });

  it('«Игра в кости лжеца»: both pick a card in secret; the dearer card in Powder takes both (18.8)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Игра в кости лжеца', 'Всплытие'], М: ['Брандер', 'Ядра'] });
    s = play(s, 'Г', 'Игра в кости лжеца', { target: 'М' }).state;
    // The Pirates may answer the card first (9.7); nothing to answer with.
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'dice', waiting: ['Г', 'М'] });
    s = choose(s, 'М', [cardIn(s, 'М', 'Брандер')]);
    expect(s.pending).toMatchObject({ waiting: ['Г'] });
    s = choose(s, 'Г', [cardIn(s, 'Г', 'Всплытие')]);
    expect(s.pending).toBeNull();
    // «Всплытие» costs 2, «Брандер» 1.
    expect(namesOf(s.ships['Г'].hand)).toEqual(['Всплытие', 'Брандер']);
    expect(namesOf(s.ships['М'].hand)).toEqual(['Ядра']);
  });

  it('«Игра в кости лжеца»: equal cost — both cards go to their owners’ discards; Souls do not count (18.8)', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Игра в кости лжеца', 'Сто лет службы'], М: ['Ядра'] });
    s = play(s, 'Г', 'Игра в кости лжеца', { target: 'М' }).state;
    s = choose(s, 'Г', [cardIn(s, 'Г', 'Сто лет службы')]);
    s = choose(s, 'М', [cardIn(s, 'М', 'Ядра')]);
    expect(s.ships['Г'].hand).toEqual([]);
    expect(namesOf(s.ships['Г'].discard)).toContain('Сто лет службы');
    expect(namesOf(s.ships['М'].discard)).toContain('Ядра');
  });

  it('«Игра в кости лжеца»: nothing to put on the table — the card cannot be played (9.9)', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Игра в кости лжеца', 'Ядра'] });
    expect(() => play(s, 'Г', 'Игра в кости лжеца', { target: 'М' })).toThrow('ничего не сделает');
  });

  it('«Часть корабля — часть команды»: 1 Powder, 2 Souls and 1 Crew', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Часть корабля — часть команды'] });
    s.ships['Г'].tracks.crew = 2;
    const r = play(s, 'Г', 'Часть корабля — часть команды').state;
    expect(r.ships['Г'].souls).toBe(3);
    expect(r.ships['Г'].tracks.crew).toBe(3);
    expect(r.teams['КОМПАНИЯ'].powder).toBe(7);
  });
});

describe('Repairs of the Dutchman', () => {
  it('«Вербовка утопленников»: 2 Crew', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Вербовка утопленников'] });
    s.ships['Г'].tracks.crew = 1;
    expect(play(s, 'Г', 'Вербовка утопленников').state.ships['Г'].tracks.crew).toBe(3);
  });

  it('«Морские наросты»: 1 Powder, 3 Hull', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Морские наросты'] });
    s.ships['Г'].tracks.hull = 5;
    const r = play(s, 'Г', 'Морские наросты').state;
    expect(r.ships['Г'].tracks.hull).toBe(8);
    expect(r.teams['КОМПАНИЯ'].powder).toBe(7);
  });

  it('«Норрингтон на борту»: 2 cells on any tracks of the ally’s ship', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Норрингтон на борту'] });
    s.ships['И'].tracks = { hull: 10, sails: 0, guns: 3, crew: 2 };
    expect(play(s, 'Г', 'Норрингтон на борту', { repair: { sails: 1, hull: 1 } }).state.ships['И'].tracks).toEqual({
      hull: 11,
      sails: 1,
      guns: 3,
      crew: 2,
    });
    s.ships['И'].tracks = { hull: 12, sails: 1, guns: 3, crew: 2 };
    expect(() => play(s, 'Г', 'Норрингтон на борту')).toThrow('ничего не сделает');
  });

  it('«Норрингтон на борту»: the split goes to the ally’s tracks, not to the own damaged ship', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Норрингтон на борту'] });
    s.ships['Г'].tracks.sails = 1;
    s.ships['И'].tracks = { hull: 10, sails: 0, guns: 3, crew: 2 };
    const r = play(s, 'Г', 'Норрингтон на борту', { repair: { hull: 1, sails: 1 } }).state;
    expect(r.ships['И'].tracks).toEqual({ hull: 11, sails: 1, guns: 3, crew: 2 });
    expect(r.ships['Г'].tracks.sails).toBe(1);
  });

  it('«Норрингтон на борту»: no more cells on a track than the ally’s ship misses there', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Норрингтон на борту'] });
    // The own Dutchman misses Sails, the Endeavour does not.
    s.ships['Г'].tracks.sails = 1;
    s.ships['И'].tracks.hull = 10;
    expect(() => play(s, 'Г', 'Норрингтон на борту', { repair: { hull: 1, sails: 1 } })).toThrow(
      '«Индевор»: на шкале «Паруса» можно восстановить не больше',
    );
  });

  it('«Сердце бьётся»: spend any number of Souls, 2 cells of the Dutchman for each', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Сердце бьётся'] });
    s.ships['Г'].souls = 3;
    s.ships['Г'].tracks = { hull: 5, sails: 3, guns: 1, crew: 3 };
    expect(() => play(s, 'Г', 'Сердце бьётся', { souls: 4 })).toThrow('от 0 до 3');
    expect(() => play(s, 'Г', 'Сердце бьётся', { souls: 1, repair: { hull: 3 } })).toThrow('не больше 2');
    const r = play(s, 'Г', 'Сердце бьётся', { souls: 2, repair: { hull: 3, guns: 1 } }).state;
    expect(r.ships['Г'].tracks).toMatchObject({ hull: 8, guns: 2 });
    expect(r.ships['Г'].souls).toBe(1);
  });

  it('«Сердце бьётся» played by the Endeavour repairs the Dutchman (Q43)', () => {
    const s = turnOf('КОМПАНИЯ', {});
    const card = give(s, 'И', 'Сердце бьётся', 'Г');
    s.ships['Г'].souls = 1;
    s.ships['Г'].tracks.hull = 5;
    s.ships['И'].tracks.hull = 5;
    const r = act(s, { type: 'playCard', seat: 'И', card, souls: 1, repair: { hull: 2 } }).state;
    expect(r.ships['Г'].tracks.hull).toBe(7);
    expect(r.ships['И'].tracks.hull).toBe(5);
  });
});

describe('Reactions of the Dutchman', () => {
  it('«Уйти на глубину» passed to the Endeavour still guards the Dutchman (Q43)', () => {
    let s = turnOf('ПИРАТЫ', {});
    give(s, 'И', 'Уйти на глубину', 'Г');
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending).toBeNull();
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    s = react(s, 'И', 'Уйти на глубину');
    expect(s.ships['Г'].tracks.hull).toBe(11);
  });
});
