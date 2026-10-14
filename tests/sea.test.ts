// The sea deck: every card (RULES.md 4.2, 16). Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { act, nextSea, newGame, passTo, setHand, setSea } from './helpers';

/** The turn of `side` with a sea deck that is empty until a test puts cards in it, and empty enemy hands. */
function turnOf(side: GameState['active']): GameState {
  const s = passTo(newGame(), side);
  s.sea = { deck: [], discard: [], current: null };
  for (const ship of Object.values(s.ships)) if (ship.side !== side) setHand(s, ship.code, []);
  return s;
}

/** Opens the sea card at the start of round 2: the Company ends its turn of round 1. */
function reveal(key: string, prepare: (s: GameState) => void = () => {}) {
  const s = nextSea(turnOf('КОМПАНИЯ'), key);
  prepare(s);
  return act(s, { type: 'endTurn', side: 'КОМПАНИЯ' });
}

const positions = (s: GameState) => Object.fromEntries(Object.values(s.ships).map((x) => [x.code, x.pos]));

describe('«Сразу» and «Весь раунд» (4.2)', () => {
  it('a «Сразу» card acts once, when it is opened: «Торговый караван» is not repeated in the Company’s turn', () => {
    let s = reveal('caravan', (x) => {
      x.teams['ПИРАТЫ'].powder = 1;
      x.teams['КОМПАНИЯ'].powder = 1;
    }).state;
    // Pirates: 1 + 2 (caravan) + 3 (Hold); Company: 1 + 2.
    expect(s.teams['ПИРАТЫ'].powder).toBe(6);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(3);
    s = act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    expect(s.teams['КОМПАНИЯ'].powder).toBe(6);
  });

  it('a «Весь раунд» card acts in both turns and ends with the next sea card: «Буря»', () => {
    let s = reveal('storm', (x) => nextSea(x, 'storm')).state;
    expect(s.round).toBe(2);
    setHand(s, 'И', []);
    setHand(s, 'Г', []);
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.ships['И'].tracks.hull).toBe(12 - 1);
    s = passTo(s, 'КОМПАНИЯ');
    setHand(s, 'Ж', []);
    setHand(s, 'М', []);
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 2);
    nextSea(s, 'rum');
    s = passTo(act(s, { type: 'endTurn', side: 'КОМПАНИЯ' }).state, 'ПИРАТЫ');
    setHand(s, 'И', []);
    setHand(s, 'Г', []);
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.ships['И'].tracks.hull).toBe(11 - 2);
  });
});

describe('«Весь раунд» cards', () => {
  it('«Штиль»: no regroup', () => {
    const s = setSea(turnOf('КОМПАНИЯ'), 'calm');
    expect(() => act(s, { type: 'regroup', side: 'КОМПАНИЯ' })).toThrow('Штиль');
  });

  it('«Попутный ветер»: regroup is free for both teams', () => {
    const s = setSea(turnOf('КОМПАНИЯ'), 'wind');
    const powder = s.teams['КОМПАНИЯ'].powder;
    expect(act(s, { type: 'regroup', side: 'КОМПАНИЯ' }).state.teams['КОМПАНИЯ'].powder).toBe(powder);
  });

  it('«Туман»: no Volleys on the diagonal', () => {
    const s = setSea(turnOf('КОМПАНИЯ'), 'fog');
    expect(() => act(s, { type: 'volley', ship: 'И', target: 'М' })).toThrow('Туман');
    expect(act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state.ships['Ж'].tracks.hull).toBe(6);
  });

  it('«Девятый вал»: at the start of each turn every ship of the active team takes 1 Sails damage (Sails 0 → Hull)', () => {
    const s = setSea(turnOf('ПИРАТЫ'), 'wave');
    s.ships['И'].tracks.sails = 0;
    const after = act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    expect(after.ships['И'].tracks).toMatchObject({ sails: 0, hull: 11 });
    expect(after.ships['Г'].tracks.sails).toBe(2);
    expect(after.ships['Ж'].tracks.sails).toBe(3);
  });

  it('«Девятый вал» reports seaEffect wave right before its Sails damage, after the Fires', () => {
    const s = setSea(turnOf('ПИРАТЫ'), 'wave');
    s.ships['И'].fires = 1;
    const types = act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).events.map((e) => (e.type === 'seaEffect' ? `seaEffect:${e.key}` : e.type));
    const wave = types.indexOf('seaEffect:wave');
    expect(types.filter((t) => t === 'seaEffect:wave')).toHaveLength(1);
    expect(wave).toBeGreaterThan(types.indexOf('fireDamage'));
    expect(types.slice(wave + 1, wave + 3)).toEqual(['damage', 'damage']);
    const calm = act(setSea(turnOf('ПИРАТЫ'), 'storm'), { type: 'endTurn', side: 'ПИРАТЫ' }).events;
    expect(calm.some((e) => e.type === 'seaEffect')).toBe(false);
  });

  it('«Мальстрём»: at the start of the turn the active team swaps for free; no diagonal penalty', () => {
    const s = setSea(turnOf('ПИРАТЫ'), 'maelstrom');
    const powder = s.teams['КОМПАНИЯ'].powder;
    let after = act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    expect(positions(after)).toMatchObject({ И: 1, Г: 0, Ж: 0, М: 1 });
    expect(after.teams['КОМПАНИЯ'].powder).toBe(powder + 3);
    setHand(after, 'Ж', []);
    setHand(after, 'М', []);
    // Г is now on the left, «Месть» on the right: a diagonal Volley without the penalty.
    after = act(after, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(after.ships['М'].tracks.hull).toBe(11 - 2);
  });

  it('«Ясное небо»: +1 to Volleys at the ship opposite, not on the diagonal', () => {
    const s = setSea(turnOf('ПИРАТЫ'), 'clear');
    expect(act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state.ships['И'].tracks.hull).toBe(12 - 3);
    expect(act(s, { type: 'volley', ship: 'М', target: 'И' }).state.ships['И'].tracks.hull).toBe(12 - 2);
  });

  it('«Рифы»: every ship that changes places takes 1 Hull damage', () => {
    const s = setSea(turnOf('КОМПАНИЯ'), 'reefs');
    const after = act(s, { type: 'regroup', side: 'КОМПАНИЯ' }).state;
    expect(after.ships['И'].tracks.hull).toBe(11);
    expect(after.ships['Г'].tracks.hull).toBe(10);
    expect(after.ships['Ж'].tracks.hull).toBe(9);
  });

  it('«Флот на горизонте»: each ship may play 1 card more', () => {
    const s = setSea(turnOf('ПИРАТЫ'), 'fleet');
    expect(act(s, { type: 'endTurn', side: 'ПИРАТЫ' }).state.turn.limit).toEqual({ И: 3, Г: 4 });
  });

  it('«Лунный свет»: each Crew damage is 1 less', () => {
    const s = setSea(turnOf('КОМПАНИЯ'), 'moon');
    const [grape] = setHand(s, 'Г', ['Картечь']);
    const after = act(s, { type: 'volley', ship: 'Г', target: 'М', charge: grape }).state;
    expect(after.ships['М'].tracks.crew).toBe(2);
  });
});

describe('«Сразу» cards', () => {
  it('«Русалки»: each ship with Crew 3 or more loses 1 Crew', () => {
    const s = reveal('mermaids').state;
    expect(s.ships['Ж'].tracks.crew).toBe(2);
    expect(s.ships['М'].tracks.crew).toBe(2);
    expect(s.ships['И'].tracks.crew).toBe(2);
    expect(s.ships['Г'].tracks.crew).toBe(2);
  });

  it('«Тортуга»: each team may spend up to 2 Powder and take as many cards, shared as it likes (16.2)', () => {
    let s = reveal('tortuga', (x) => {
      x.teams['ПИРАТЫ'].powder = 3;
      x.teams['КОМПАНИЯ'].powder = 1;
    }).state;
    expect(s.pending).toEqual({ kind: 'tortuga', waiting: ['ПИРАТЫ', 'КОМПАНИЯ'] });
    expect(s.active).toBe('КОМПАНИЯ');
    const handЖ = s.ships['Ж'].hand.length;
    expect(() => act(s, { type: 'tortuga', side: 'ПИРАТЫ', draws: { Ж: 3 } })).toThrow('не больше 2');
    expect(() => act(s, { type: 'tortuga', side: 'ПИРАТЫ', draws: { И: 1 } })).toThrow('своей команды');
    expect(() => act(s, { type: 'tortuga', side: 'КОМПАНИЯ', draws: { И: 2 } })).toThrow('Не хватает Пороха');
    s = act(s, { type: 'tortuga', side: 'ПИРАТЫ', draws: { Ж: 2 } }).state;
    expect(s.ships['Ж'].hand.length).toBe(handЖ + 2);
    expect(s.teams['ПИРАТЫ'].powder).toBe(1);
    expect(() => act(s, { type: 'tortuga', side: 'ПИРАТЫ', draws: {} })).toThrow('уже решила');
    s = act(s, { type: 'tortuga', side: 'КОМПАНИЯ', draws: { И: 1 } }).state;
    expect(s.teams['КОМПАНИЯ'].powder).toBe(0);
    // Both decided: the Pirates’ turn begins (Hold +3).
    expect(s.pending).toBeNull();
    expect(s.active).toBe('ПИРАТЫ');
    expect(s.teams['ПИРАТЫ'].powder).toBe(4);
  });

  it('«Ром в волнах»: each ship restores 1 Crew, not above the start', () => {
    const s = reveal('rum', (x) => {
      x.ships['Ж'].tracks.crew = 1;
    }).state;
    expect(s.ships['Ж'].tracks.crew).toBe(2);
    expect(s.ships['И'].tracks.crew).toBe(2);
  });

  it('«Торговый караван»: each team puts 2 Powder into its Hold; above 8 it burns', () => {
    const r = reveal('caravan', (x) => {
      x.teams['ПИРАТЫ'].powder = 7;
      x.teams['КОМПАНИЯ'].powder = 2;
    });
    expect(r.events).toContainEqual({ type: 'powderGained', side: 'ПИРАТЫ', amount: 1, burned: 1, reason: 'sea' });
    expect(r.state.teams['КОМПАНИЯ'].powder).toBe(4);
  });

  it('«Сырой порох»: each team loses half of its Powder, rounded down', () => {
    const s = reveal('wet', (x) => {
      x.teams['ПИРАТЫ'].powder = 5;
      x.teams['КОМПАНИЯ'].powder = 7;
    }).state;
    expect(s.teams['ПИРАТЫ'].powder).toBe(3 + 3);
    expect(s.teams['КОМПАНИЯ'].powder).toBe(4);
  });

  it('«Гроза»: the ship with the highest Sails takes 2 Sails damage; on a tie — all such ships', () => {
    const s = reveal('thunder').state;
    expect(s.ships['Ж'].tracks.sails).toBe(1);
    expect(s.ships['Г'].tracks.sails).toBe(1);
    expect(s.ships['М'].tracks.sails).toBe(2);
    expect(s.ships['И'].tracks.sails).toBe(1);
  });

  it('«Гроза»: when every ship has Sails 0, nobody takes damage (Q28)', () => {
    const r = reveal('thunder', (x) => {
      for (const ship of Object.values(x.ships)) ship.tracks.sails = 0;
    });
    expect(r.events.filter((e) => e.type === 'damage')).toEqual([]);
    expect(r.state.ships['Ж'].tracks.hull).toBe(9);
  });

  it('«Течение»: both teams swap their ships for free', () => {
    const r = reveal('current');
    expect(positions(r.state)).toMatchObject({ Ж: 1, М: 0, И: 1, Г: 0 });
  });

  it('sea cards act on the Dutchman under water as usual (Q14)', () => {
    const s = reveal('mermaids', (x) => {
      x.ships['Г'].submerged = true;
    }).state;
    expect(s.ships['Г']).toMatchObject({ submerged: true, tracks: expect.objectContaining({ crew: 2 }) });
  });

  it('a «Сразу» card can sink ships before the Pirates’ turn; the last ships of both teams at once — a draw (19.2)', () => {
    const r = reveal('thunder', (x) => {
      for (const code of ['М', 'И']) Object.assign(x.ships[code], { sunk: true, tracks: { ...x.ships[code].tracks, hull: 0 } });
      // Sails 1 → 0, the second point of damage goes to the Hull.
      x.ships['Ж'].tracks = { ...x.ships['Ж'].tracks, sails: 1, hull: 1 };
      x.ships['Г'].tracks = { ...x.ships['Г'].tracks, sails: 1, hull: 1 };
      x.ships['Ж'].legend = false;
    });
    expect(r.state.ships['Ж'].sunk).toBe(true);
    expect(r.state.ships['Г'].sunk).toBe(true);
    expect(r.state.winner).toBe('НИЧЬЯ');
  });
});
