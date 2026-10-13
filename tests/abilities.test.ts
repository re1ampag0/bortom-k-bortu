// Ship abilities (RULES.md 14) and «Блокада» for changing places (18.10, Q20).
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { act, actDecline, nextSea, newGame, passTo, setHand, setSea } from './helpers';

/** The turn of `side` with 8 Powder in both Holds and empty hands of the other team (no Reaction windows). */
function turnOf(side: GameState['active'], options: Parameters<typeof newGame>[0] = {}): GameState {
  const s = passTo(newGame(options), side);
  s.teams['ПИРАТЫ'].powder = 8;
  s.teams['КОМПАНИЯ'].powder = 8;
  for (const ship of Object.values(s.ships)) if (ship.side !== side) setHand(s, ship.code, []);
  return s;
}

/** The Company’s next turn after the Dutchman dived in this one. */
const nextCompanyTurn = (s: GameState) => passTo(passTo(s, 'ПИРАТЫ'), 'КОМПАНИЯ');

const positions = (s: GameState) => Object.fromEntries(Object.values(s.ships).map((x) => [x.code, x.pos]));

describe('«Меч Тритона» (14.4)', () => {
  it('once a turn for 1 Powder the enemy ships swap places', () => {
    let s = turnOf('ПИРАТЫ');
    s = act(s, { type: 'sword', ship: 'М' }).state;
    expect(positions(s)).toMatchObject({ И: 1, Г: 0, Ж: 0, М: 1 });
    expect(s.teams['ПИРАТЫ'].powder).toBe(7);
    expect(() => act(s, { type: 'sword', ship: 'М' })).toThrow('раз в ход');
  });

  it('a lone enemy is moved to the empty place', () => {
    let s = turnOf('ПИРАТЫ');
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    s = act(s, { type: 'sword', ship: 'М' }).state;
    expect(s.ships['Г'].pos).toBe(0);
  });

  it('works in «Штиль»', () => {
    let s = turnOf('ПИРАТЫ', { sea: true });
    setSea(s, 'calm');
    s = act(s, { type: 'sword', ship: 'М' }).state;
    expect(s.ships['Г'].pos).toBe(0);
  });

  it('is not a card: no Reactions', () => {
    let s = turnOf('ПИРАТЫ');
    setHand(s, 'Г', ['Прикрыть бортом', 'Водоворот', 'Уйти на глубину']);
    setHand(s, 'И', ['Морская пехота', 'Двойная обшивка']);
    s = act(s, { type: 'sword', ship: 'М' }).state;
    expect(s.pending).toBeNull();
  });

  it('does not work when an enemy ship is under «Блокада» (18.10, Q20)', () => {
    const s = turnOf('ПИРАТЫ');
    s.ships['Г'].blockaded = true;
    expect(() => act(s, { type: 'sword', ship: 'М' })).toThrow('Блокадой');
  });

  it('is only the ability of «Месть» afloat (17.1)', () => {
    const s = turnOf('ПИРАТЫ');
    expect(() => act(s, { type: 'sword', ship: 'Ж' })).toThrow('нет особенности');
    s.ships['М'].sunk = true;
    expect(() => act(s, { type: 'sword', ship: 'М' })).toThrow('нет особенности');
  });
});

describe('«Казна Компании» (14.5)', () => {
  it('once a turn pay 2 Powder and play one more card beyond the Crew', () => {
    let s = turnOf('КОМПАНИЯ');
    expect(s.turn.limit['И']).toBe(2);
    s = act(s, { type: 'treasury', ship: 'И' }).state;
    expect(s.turn.limit['И']).toBe(3);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(6);
    expect(() => act(s, { type: 'treasury', ship: 'И' })).toThrow('раз в ход');
  });

  it('a sunk «Индевор» has no Treasury (17.1)', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['И'].sunk = true;
    expect(() => act(s, { type: 'treasury', ship: 'И' })).toThrow('нет особенности');
  });
});

describe('«Сердце Дейви Джонса» (14.6)', () => {
  const heart = (s: GameState, target = 'М', charge?: string) =>
    act(s, { type: 'volley', ship: 'Г', target, heart: true, charge });

  it('once a turn the Dutchman fires one more Volley for 1 Powder and loses 1 Crew at once, before it (Q33)', () => {
    let s = act(turnOf('КОМПАНИЯ'), { type: 'volley', ship: 'Г', target: 'М' }).state;
    const r = heart(s);
    s = r.state;
    expect(s.ships['Г'].tracks.crew).toBe(2);
    // Г: 2, then 2 + nothing; the Crew is lost before the extra Volley is declared.
    expect(s.ships['М'].tracks.hull).toBe(11 - 2 - 2);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(6);
    const types = r.events.map((e) => e.type);
    expect(types.indexOf('damage')).toBeLessThan(types.indexOf('volley'));
    expect(() => heart(s)).toThrow('раз в ход');
  });

  it('the order may come before the Dutchman’s own Volley', () => {
    let s = heart(turnOf('КОМПАНИЯ')).state;
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(s.ships['М'].tracks.hull).toBe(11 - 4);
  });

  it('a Charge may be played on the extra Volley; it counts toward the Dutchman’s Crew limit (Q10)', () => {
    let s = turnOf('КОМПАНИЯ');
    const [balls] = setHand(s, 'Г', ['Ядра']);
    s = heart(s, 'М', balls).state;
    expect(s.ships['М'].tracks.hull).toBe(11 - 3);
    expect(s.turn.played['Г']).toBe(1);
  });

  it('with Crew 1 the Dutchman takes 1 Hull damage instead (11.5)', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].tracks.crew = 1;
    s = heart(s).state;
    expect(s.ships['Г'].tracks).toMatchObject({ crew: 1, hull: 10 });
  });

  it('not when the Dutchman is under water or has Guns 0', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['Г'].tracks.guns = 0;
    expect(() => heart(s)).toThrow('Пушки 0');
    s.ships['Г'].tracks.guns = 2;
    s.ships['Г'].submerged = true;
    expect(() => heart(s)).toThrow('под водой');
  });

  it('when «Индевор» sank, there is no order; Jones is free: the Dutchman’s Guns and Crew go back to the start', () => {
    let s = turnOf('ПИРАТЫ');
    s.ships['Г'].tracks = { ...s.ships['Г'].tracks, guns: 0, crew: 1 };
    s.ships['И'].tracks.hull = 2;
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.ships['И'].sunk).toBe(true);
    expect(s.ships['Г'].tracks).toMatchObject({ guns: 2, crew: 3 });
    s = passTo(s, 'КОМПАНИЯ');
    expect(() => heart(s)).toThrow('«Индевор» на плаву');
  });
});

describe('«Вечная служба» (14.7, 3.6)', () => {
  it('the Dutchman starts with 1 Soul and has at most 5', () => {
    let s = turnOf('КОМПАНИЯ');
    expect(newGame().ships['Г'].souls).toBe(1);
    s.ships['Г'].souls = 5;
    const [grape] = setHand(s, 'Г', ['Картечь']);
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: grape }).state;
    expect(s.ships['Г'].souls).toBe(5);
  });

  it('a Soul for an enemy ship damaged on the Crew by the Dutchman', () => {
    let s = turnOf('КОМПАНИЯ');
    const [grape] = setHand(s, 'Г', ['Картечь']);
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: grape }).state;
    expect(s.ships['М'].tracks.crew).toBe(1);
    expect(s.ships['Г'].souls).toBe(2);
  });

  it('Crew damage that went to the Hull still gives a Soul (Q12)', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['М'].tracks.crew = 1;
    const [grape] = setHand(s, 'Г', ['Картечь']);
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: grape }).state;
    expect(s.ships['М'].tracks).toMatchObject({ crew: 1, hull: 9 });
    expect(s.ships['Г'].souls).toBe(2);
  });

  it('a Soul for each hit of each ship: two «Картечь» at one ship — 2 Souls (Q13)', () => {
    let s = turnOf('КОМПАНИЯ');
    const [a, b] = setHand(s, 'Г', ['Картечь', 'Картечь']);
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: a }).state;
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: b, heart: true }).state;
    expect(s.ships['Г'].souls).toBe(3);
  });

  it('Crew damage by another ship gives no Soul', () => {
    let s = turnOf('КОМПАНИЯ');
    const [grape] = setHand(s, 'И', ['Картечь']);
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж', charge: grape }).state;
    expect(s.ships['Ж'].tracks.crew).toBe(1);
    expect(s.ships['Г'].souls).toBe(1);
  });

  it('in its own turn 1 Soul restores 1 Hull or 1 Crew, not above the start, any number of times', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 3;
    s.ships['Г'].tracks = { ...s.ships['Г'].tracks, hull: 9, crew: 2 };
    s = act(s, { type: 'souls', ship: 'Г', track: 'hull' }).state;
    s = act(s, { type: 'souls', ship: 'Г', track: 'crew' }).state;
    expect(s.ships['Г']).toMatchObject({ souls: 1, tracks: expect.objectContaining({ hull: 10, crew: 3 }) });
    expect(() => act(s, { type: 'souls', ship: 'Г', track: 'crew' })).toThrow('стартовом');
    expect(() => act(s, { type: 'souls', ship: 'Г', track: 'guns' })).toThrow('Корпус или Команду');
    expect(() => act(passTo(s, 'ПИРАТЫ'), { type: 'souls', ship: 'Г', track: 'hull' })).toThrow('ход другой команды');
  });
});

describe('«Погружение» (14.8)', () => {
  it('instead of the Volley: no Volley after a dive, no dive after a Volley', () => {
    const s = turnOf('КОМПАНИЯ');
    const dived = act(s, { type: 'dive', ship: 'Г' }).state;
    expect(dived.ships['Г'].submerged).toBe(true);
    expect(() => act(dived, { type: 'volley', ship: 'Г', target: 'М' })).toThrow('под водой');
    const fired = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(() => act(fired, { type: 'dive', ship: 'Г' })).toThrow('уже дал Залп');
  });

  it('puts out all Fires and costs no Powder', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['Г'].fires = 3;
    const after = act(s, { type: 'dive', ship: 'Г' }).state;
    expect(after.ships['Г'].fires).toBe(0);
    expect(after.teams['КОМПАНИЯ'].powder).toBe(8);
  });

  it('possible even when a Volley is impossible: Guns 0, no Powder (Q15)', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['Г'].tracks.guns = 0;
    s.teams['КОМПАНИЯ'].powder = 0;
    expect(act(s, { type: 'dive', ship: 'Г' }).state.ships['Г'].submerged).toBe(true);
  });

  it('till its next turn the Dutchman cannot be chosen as a target of a Volley', () => {
    const s = passTo(act(turnOf('КОМПАНИЯ'), { type: 'dive', ship: 'Г' }).state, 'ПИРАТЫ');
    expect(s.ships['Г'].submerged).toBe(true);
    expect(() => act(s, { type: 'volley', ship: 'М', target: 'Г' })).toThrow('под водой');
  });

  it('under water it plays no Reactions', () => {
    let s = passTo(act(turnOf('КОМПАНИЯ'), { type: 'dive', ship: 'Г' }).state, 'ПИРАТЫ');
    setHand(s, 'Г', ['Прикрыть бортом', 'Водоворот']);
    setHand(s, 'И', []);
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['И'].tracks.hull).toBe(10);
  });

  it('surfaces at the start of the Company’s turn; its first Volley gets +1 and no Reactions', () => {
    let s = nextCompanyTurn(act(turnOf('КОМПАНИЯ'), { type: 'dive', ship: 'Г' }).state);
    expect(s.ships['Г']).toMatchObject({ submerged: false, surfaced: true });
    s.teams['КОМПАНИЯ'].powder = 8;
    setHand(s, 'М', ['Тяжёлый борт', 'Ответный залп']);
    setHand(s, 'Ж', []);
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(s.pending).toBeNull();
    expect(s.ships['М'].tracks.hull).toBe(11 - 3);
    // The next Volley of the Dutchman is an ordinary one: «Тяжёлый борт» may answer it.
    s = act(s, { type: 'volley', ship: 'Г', target: 'М', heart: true }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions', waiting: ['М'] });
  });

  it('not two own turns in a row (v0.3 change, Q15)', () => {
    let s = nextCompanyTurn(act(turnOf('КОМПАНИЯ'), { type: 'dive', ship: 'Г' }).state);
    expect(() => act(s, { type: 'dive', ship: 'Г' })).toThrow('два своих хода подряд');
    s = nextCompanyTurn(s);
    expect(act(s, { type: 'dive', ship: 'Г' }).state.ships['Г'].submerged).toBe(true);
  });

  it('only the Dutchman dives', () => {
    expect(() => act(turnOf('КОМПАНИЯ'), { type: 'dive', ship: 'И' })).toThrow('нет особенности');
  });
});

describe('abilities of a sunk ship no longer work (17.1)', () => {
  it('«Безумный план»: a sunk Black Pearl makes no Plans', () => {
    const s = turnOf('ПИРАТЫ');
    s.ships['Ж'].sunk = true;
    s.ships['Ж'].tracks.hull = 0;
    expect(() => act(s, { type: 'endTurn', side: 'ПИРАТЫ', plans: [s.ships['Ж'].hand[0]] })).toThrow('Планы кладёт');
  });

  it('«Быстрее ветра»: with the Black Pearl sunk, the Pirates pay for a regroup', () => {
    const s = turnOf('ПИРАТЫ');
    s.ships['Ж'].sunk = true;
    s.ships['Ж'].tracks.hull = 0;
    expect(act(s, { type: 'regroup', side: 'ПИРАТЫ' }).state.teams['ПИРАТЫ'].powder).toBe(7);
  });
});

describe('«Блокада»: a blockaded ship does not change places at all (18.10, Q20)', () => {
  it('no regroup with it, for its ally too; a lone blockaded ship does not move', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['Г'].blockaded = true;
    expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('Блокадой');
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('Блокадой');
  });

  it('«Течение» and «Мальстрём» do not move a team with a blockaded ship', () => {
    let s = passTo(newGame({ sea: true }), 'КОМПАНИЯ');
    s.ships['Ж'].blockaded = true;
    nextSea(s, 'current');
    s = actDecline(s, { type: 'endTurn', side: 'КОМПАНИЯ' });
    expect(positions(s)).toMatchObject({ Ж: 0, М: 1, И: 1, Г: 0 });

    let t = passTo(newGame({ sea: true }), 'КОМПАНИЯ');
    t.ships['М'].blockaded = true;
    nextSea(t, 'maelstrom');
    t = actDecline(t, { type: 'endTurn', side: 'КОМПАНИЯ' });
    expect(positions(t)).toMatchObject({ Ж: 0, М: 1 });
  });
});
