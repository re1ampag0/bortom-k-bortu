// What each player sees (docs/TZ.md, «Кто что видит», «Проверки»: the enemy never gets another team's hand, Plans
// and the order of the decks) and giving up (docs/TZ.md, «Интерфейс → Детали», п. 4).
import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/engine';
import type { Action, GameState } from '../src/engine/state';
import { HIDDEN, eventFor, eventsFor, viewFor } from '../src/engine/view';
import { playGame } from '../src/engine/sim/sim';
import { act, cardIn, data, passTo, turnOf } from './helpers';

const play = (s: GameState, seat: string, name: string, extra: Partial<Extract<Action, { type: 'playCard' }>> = {}) =>
  act(s, { type: 'playCard', seat, card: cardIn(s, seat, name), ...extra });
const PIRATES = ['Ж', 'М'];
const COMPANY = ['И', 'Г'];
const allHidden = (cards: string[]) => cards.every((c) => c === HIDDEN);

/** Codes of real cards in a view: everything the viewer may know. */
function visibleCards(v: GameState, seats: string[]): string[] {
  return seats.flatMap((seat) => [...v.ships[seat].hand, ...v.ships[seat].plans, ...v.ships[seat].deck]).filter((c) => c !== HIDDEN);
}

describe('viewFor', () => {
  it('the enemy sees only the number of cards in hands and Plans; allies see each other', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра', 'Уйти по ветру'], М: ['Ядра'], И: ['Ядра', 'Картечь', 'Подкуп'] });
    s.ships['Ж'].plans = s.ships['Ж'].deck.splice(0, 2);
    const company = viewFor(s, ['И']);
    expect(company.ships['Ж'].hand).toEqual([HIDDEN, HIDDEN]);
    expect(company.ships['Ж'].plans).toEqual([HIDDEN, HIDDEN]);
    expect(company.ships['М'].hand).toEqual([HIDDEN]);
    expect(company.ships['И'].hand).toEqual(s.ships['И'].hand);
    expect(company.ships['Г'].hand).toEqual(s.ships['Г'].hand);
    // Plans of the Pearl are seen by the whole Pirate team.
    expect(viewFor(s, ['М']).ships['Ж'].plans).toEqual(s.ships['Ж'].plans);
    // «Союзники видят руки друг друга» off: the ally's hand is hidden too.
    expect(viewFor(s, ['Ж'], { allyHands: false }).ships['М'].hand).toEqual([HIDDEN]);
  });

  it('nobody sees the order of any deck, the sea deck, the seed or the generator state', () => {
    const s = turnOf('ПИРАТЫ', {}, { sea: true });
    for (const viewer of [PIRATES, COMPANY]) {
      const v = viewFor(s, viewer);
      for (const ship of Object.values(v.ships)) {
        expect(allHidden(ship.deck)).toBe(true);
        expect(ship.deck).toHaveLength(s.ships[ship.code].deck.length);
      }
      expect(allHidden(v.sea!.deck)).toBe(true);
      expect(v.sea!.deck).toHaveLength(s.sea!.deck.length);
      expect(v.seed).toBe(0);
      expect(v.rng).toBe(0);
    }
    // Discards and the current sea card are open to all (docs/TZ.md, «Кто что видит»).
    expect(viewFor(s, COMPANY).sea!.current).toBe(s.sea!.current);
  });

  it('«Компас Джека»: the top of the deck is seen only by the player who looks', () => {
    const s = play(turnOf('ПИРАТЫ', { Ж: ['Компас Джека'] }), 'Ж', 'Компас Джека').state;
    const p = s.pending!;
    expect(p).toMatchObject({ kind: 'choice', what: 'compass' });
    expect(viewFor(s, PIRATES).pending).toEqual(p);
    expect(viewFor(s, COMPANY).pending).toMatchObject({ options: [HIDDEN, HIDDEN, HIDDEN] });
  });

  it('«Тиа Дальма»: the top sea cards are seen only by the player who played her', () => {
    const s = play(turnOf('ПИРАТЫ', { Ж: ['Тиа Дальма'] }, { sea: true }), 'Ж', 'Тиа Дальма').state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'tia' });
    expect(viewFor(s, ['Ж']).pending).toEqual(s.pending);
    expect(viewFor(s, COMPANY).pending).toMatchObject({ options: [HIDDEN, HIDDEN, HIDDEN] });
  });

  it('«Шпион Мерсер»: the enemy hand is shown only to the player who played him', () => {
    let s = turnOf('КОМПАНИЯ', { И: ['Шпион Мерсер'], Ж: ['Уйти по ветру', 'Гиббс за штурвалом'] });
    s = play(s, 'И', 'Шпион Мерсер', { target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ kind: 'choice', what: 'spy' });
    expect(viewFor(s, ['И']).pending).toEqual(s.pending);
    // Hands stay hidden; only the chooser gets the Reactions to choose from.
    expect(allHidden(viewFor(s, ['И']).ships['Ж'].hand)).toBe(true);
  });

  it('«Игра в кости лжеца»: a pick stays hidden from the other player until both picked', () => {
    let s = turnOf('КОМПАНИЯ', { Г: ['Игра в кости лжеца', 'Всплытие'], М: ['Брандер', 'Ядра'] });
    s = play(s, 'Г', 'Игра в кости лжеца', { target: 'М' }).state;
    s = act(s, { type: 'choose', seat: 'Г', cards: [cardIn(s, 'Г', 'Всплытие')] }).state;
    const p = viewFor(s, PIRATES).pending;
    expect(p).toMatchObject({ kind: 'choice', what: 'dice', picks: { Г: HIDDEN } });
    expect(viewFor(s, COMPANY).pending).toMatchObject({ picks: { Г: cardIn(s, 'Г', 'Всплытие') } });
  });

  it('a card passed to the ally is hidden in the events the enemy gets', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра'] });
    const card = cardIn(s, 'Ж', 'Ядра');
    const r = act(s, { type: 'pass', seat: 'Ж', card });
    const passed = r.events.find((e) => e.type === 'passed')!;
    expect(eventFor(r.state, COMPANY, passed)).toMatchObject({ card: HIDDEN });
    expect(eventFor(r.state, PIRATES, passed)).toMatchObject({ card });
  });

  it('the cards drawn are seen by the owner of the hand and, if allies see hands, by the ally', () => {
    const s = turnOf('КОМПАНИЯ', { Ж: ['Ядра', 'Книппели'] });
    const r = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' });
    const drew = r.events.find((e) => e.type === 'drew' && e.seat === 'Ж')!;
    const drawn = r.state.ships['Ж'].hand.slice(2);
    expect(drew).toEqual({ type: 'drew', seat: 'Ж', count: 3, cards: drawn });
    expect(eventFor(r.state, ['Ж'], drew)).toEqual(drew);
    expect(eventFor(r.state, ['М'], drew)).toEqual(drew);
    expect(eventFor(r.state, ['М'], drew, { allyHands: false })).toEqual({ type: 'drew', seat: 'Ж', count: 3 });
    expect(eventFor(r.state, COMPANY, drew)).toEqual({ type: 'drew', seat: 'Ж', count: 3 });
    expect(eventFor(r.state, [], drew)).toEqual({ type: 'drew', seat: 'Ж', count: 3 });
    expect(eventsFor(r.state, COMPANY, r.events).filter((e) => e.type === 'drew').every((e) => !('cards' in e))).toBe(true);
  });

  it('in 50 bot games no view of a team holds a card of the enemy hands, Plans or decks', () => {
    for (let seed = 1; seed <= 50; seed++) {
      playGame(data, seed, 'standard', (s) => {
        for (const [mine, theirs] of [[PIRATES, COMPANY], [COMPANY, PIRATES]]) {
          const v = viewFor(s, mine);
          const leaked = visibleCards(v, theirs);
          if (leaked.length > 0) throw new Error(`seed ${seed}: ${mine.join('')} sees ${leaked.join(', ')}`);
          if (visibleCards(v, mine).some((c) => s.ships[mine[0]].deck.includes(c) || s.ships[mine[1]].deck.includes(c))) {
            throw new Error(`seed ${seed}: own deck order visible`);
          }
        }
      });
    }
  });

  it("'all' is the full state (open hands)", () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра'] });
    expect(viewFor(s, 'all')).toBe(s);
  });
});

describe('concede', () => {
  it('the other team wins at once; the event goes to the log', () => {
    const s = turnOf('ПИРАТЫ');
    const r = applyAction(s, { type: 'concede', side: 'ПИРАТЫ' }, data);
    expect(r.state.winner).toBe('КОМПАНИЯ');
    expect(r.events).toEqual([
      { type: 'conceded', side: 'ПИРАТЫ' },
      { type: 'gameOver', winner: 'КОМПАНИЯ', reason: 'concede' },
    ]);
  });

  it('is allowed while the engine waits for a decision', () => {
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending?.kind).toBe('reactions');
    const r = applyAction(s, { type: 'concede', side: 'КОМПАНИЯ' }, data);
    expect(r.state.winner).toBe('ПИРАТЫ');
    expect(r.state.pending).toBeNull();
    expect(() => applyAction(r.state, { type: 'concede', side: 'ПИРАТЫ' }, data)).toThrow('Партия окончена');
  });
});

describe('network: the Reaction window does not give the hand away (docs/TZ.md, «Одновременные ходы»)', () => {
  it('the attackers see the whole defending team deciding and not who declined', () => {
    // Only the Endeavour holds a Reaction.
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'], Г: ['Ядра'] });
    const r = act(s, { type: 'volley', ship: 'Ж', target: 'И' });
    s = r.state;
    expect(s.pending).toMatchObject({ kind: 'reactions', waiting: ['И'] });
    expect(viewFor(s, PIRATES).pending).toMatchObject({ kind: 'reactions', waiting: ['И', 'Г'] });
    expect(viewFor(s, COMPANY).pending).toMatchObject({ waiting: ['И'] });
    const opened = r.events.find((e) => e.type === 'windowOpened')!;
    expect(eventFor(s, PIRATES, opened)).toMatchObject({ seats: ['И', 'Г'] });
    expect(eventFor(s, COMPANY, opened)).toMatchObject({ seats: ['И'] });
    const declined = act(s, { type: 'noReaction', seat: 'И' });
    expect(eventsFor(declined.state, PIRATES, declined.events).some((e) => e.type === 'noReaction')).toBe(false);
    expect(eventsFor(declined.state, COMPANY, declined.events).some((e) => e.type === 'noReaction')).toBe(true);
  });

  it('with pauseEmptyWindows a window opens with nobody deciding; closeWindow goes on with the Volley', () => {
    const s = turnOf('ПИРАТЫ', { И: ['Ядра'], Г: ['Ядра'] }, { pauseEmptyWindows: true });
    const hull = s.ships['И'].tracks.hull;
    const r = act(s, { type: 'volley', ship: 'Ж', target: 'И' });
    expect(r.state.pending).toMatchObject({ kind: 'reactions', window: 'before', waiting: [] });
    expect(viewFor(r.state, PIRATES).pending).toMatchObject({ waiting: ['И', 'Г'] });
    expect(() => act(r.state, { type: 'noReaction', seat: 'И' })).toThrow();
    const after = act(r.state, { type: 'closeWindow' }).state;
    expect(after.pending).toMatchObject({ kind: 'reactions', window: 'after', waiting: [] });
    const done = act(after, { type: 'closeWindow' }).state;
    expect(done.pending).toBeNull();
    expect(done.ships['И'].tracks.hull).toBeLessThan(hull);
  });

  it('without the option the engine skips an empty window as before', () => {
    const s = turnOf('ПИРАТЫ', { И: ['Ядра'], Г: ['Ядра'] });
    expect(act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state.pending).toBeNull();
  });

  it('closeWindow: every seat still deciding plays no Reaction', () => {
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    const r = act(s, { type: 'closeWindow' });
    expect(r.events[0]).toEqual({ type: 'noReaction', seat: 'И' });
    expect(r.state.pending).toBeNull();
    expect(() => act(r.state, { type: 'closeWindow' })).toThrow();
  });

  it('«Тиа Дальма»: after the choice the player still sees the top of the sea deck, until the cards come out', () => {
    let s = play(turnOf('ПИРАТЫ', { Ж: ['Тиа Дальма'] }, { sea: true }), 'Ж', 'Тиа Дальма').state;
    const top = [...s.sea!.deck.slice(0, 3)].reverse();
    s = act(s, { type: 'choose', seat: 'Ж', cards: top }).state;
    expect(viewFor(s, ['Ж']).sea!.deck.slice(0, 4)).toEqual([...top, HIDDEN]);
    expect(viewFor(s, ['М']).sea!.deck.slice(0, 3)).toEqual([HIDDEN, HIDDEN, HIDDEN]);
    expect(viewFor(s, COMPANY).sea!.peek).toBeUndefined();
    // The next round opens the first of them: two are still known.
    s = passTo(passTo(s, 'КОМПАНИЯ'), 'ПИРАТЫ');
    expect(s.sea!.current).toBe(top[0]);
    expect(viewFor(s, ['Ж']).sea!.deck.slice(0, 3)).toEqual([top[1], top[2], HIDDEN]);
  });
});
