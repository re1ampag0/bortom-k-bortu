// Legends (RULES.md 15) and «Это не Залп» for them (9.6, 9.7, 12.7).
// Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { act, actDecline, newGame, passTo, setHand, setSea } from './helpers';

/** The turn of `side` with 8 Powder in both Holds and empty hands of the other team. */
function turnOf(side: GameState['active'], options: Parameters<typeof newGame>[0] = {}): GameState {
  const s = passTo(newGame(options), side);
  s.teams['ПИРАТЫ'].powder = 8;
  s.teams['КОМПАНИЯ'].powder = 8;
  for (const ship of Object.values(s.ships)) if (ship.side !== side) setHand(s, ship.code, []);
  return s;
}

const legend = (s: GameState, seat: string, target?: string) => act(s, { type: 'playLegend', seat, target }).state;

describe('Legends are played once for their cost (15.1, docs/TZ.md)', () => {
  it('«Корабль в бутылке»: 3 Powder, an enemy ship with Hull 3 or less sinks', () => {
    let s = turnOf('ПИРАТЫ');
    s.ships['Г'].tracks.hull = 4;
    expect(() => legend(s, 'М', 'Г')).toThrow('Корпусом 3 или меньше');
    s.ships['Г'].tracks.hull = 3;
    s = legend(s, 'М', 'Г');
    expect(s.ships['Г'].sunk).toBe(true);
    expect(s.teams['ПИРАТЫ'].powder).toBe(5);
    expect(s.ships['М'].legend).toBe(false);
  });

  it('«Армада Компании»: 2 Powder, 2 Hull and 1 Sails damage to each enemy ship', () => {
    let s = turnOf('КОМПАНИЯ');
    s = legend(s, 'И');
    expect(s.ships['Ж'].tracks).toMatchObject({ hull: 7, sails: 2 });
    expect(s.ships['М'].tracks).toMatchObject({ hull: 9, sails: 1 });
    expect(s.teams['КОМПАНИЯ'].powder).toBe(6);
  });

  it('«Кракен»: 3 Souls and no Powder; 4 Hull and 2 Crew damage to one enemy ship', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 2;
    expect(() => legend(s, 'Г', 'Ж')).toThrow('Не хватает Душ');
    s.ships['Г'].souls = 3;
    s = legend(s, 'Г', 'Ж');
    expect(s.ships['Ж'].tracks).toMatchObject({ hull: 5, crew: 1 });
    expect(s.teams['КОМПАНИЯ'].powder).toBe(8);
    // 3 Souls spent, 1 Soul back for the Crew damage (14.7).
    expect(s.ships['Г'].souls).toBe(1);
  });

  it('a Legend is played once; it counts toward the Crew limit (7.1)', () => {
    let s = turnOf('КОМПАНИЯ');
    s.turn.played['И'] = s.turn.limit['И'];
    expect(() => legend(s, 'И')).toThrow('лимит Команды');
    s.turn.played['И'] = 0;
    s = legend(s, 'И');
    expect(s.turn.played['И']).toBe(1);
    expect(() => legend(s, 'И')).toThrow('Легенды этого корабля больше нет');
  });

  it('a Legend is played only in its own turn and only by its own ship afloat', () => {
    const s = turnOf('КОМПАНИЯ');
    expect(() => legend(s, 'М', 'И')).toThrow('ход другой команды');
    s.ships['И'].sunk = true;
    s.ships['И'].legend = false;
    expect(() => legend(s, 'И')).toThrow('Легенды этого корабля больше нет');
  });

  it('a ship under water cannot be chosen by a Legend (14.8)', () => {
    const s = turnOf('ПИРАТЫ');
    s.ships['Г'].submerged = true;
    s.ships['Г'].tracks.hull = 2;
    expect(() => legend(s, 'М', 'Г')).toThrow('под водой');
  });
});

describe('«Это не Залп»: Legends and Reactions (9.6, 12.7)', () => {
  it('Reactions to a Volley do not answer a Legend: no window', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 3;
    setHand(s, 'Ж', ['Уйти по ветру', 'Чёрные паруса в ночи', 'Всё по плану']);
    s = legend(s, 'Г', 'Ж');
    expect(s.pending).toBeNull();
    expect(s.ships['Ж'].tracks).toMatchObject({ hull: 5, crew: 1 });
  });

  it('«Банка с землёй» («на Залп или карту») cancels «Кракен» against the Black Pearl', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 3;
    const [jar] = setHand(s, 'Ж', ['Банка с землёй']);
    s = legend(s, 'Г', 'Ж');
    expect(s.pending).toMatchObject({ kind: 'reactions', subject: 'card', waiting: ['Ж'] });
    s = act(s, { type: 'react', seat: 'Ж', card: jar }).state;
    expect(s.ships['Ж'].tracks).toMatchObject({ hull: 9, crew: 3 });
    expect(s.ships['Г']).toMatchObject({ souls: 0, legend: false });
  });

  it('«Зомби-офицеры» cancel the Crew damage of «Кракен»; the Hull damage stays (11.6)', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 3;
    const [zombies] = setHand(s, 'М', ['Зомби-офицеры']);
    s = legend(s, 'Г', 'Ж');
    s = act(s, { type: 'react', seat: 'М', card: zombies }).state;
    expect(s.ships['Ж'].tracks).toMatchObject({ hull: 5, crew: 3 });
    // No Crew damage — no Soul (14.7).
    expect(s.ships['Г'].souls).toBe(0);
  });

  it('«Ловкость рук» cannot take a Legend (15.1)', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 3;
    setHand(s, 'Ж', ['Ловкость рук']);
    s = legend(s, 'Г', 'Ж');
    expect(s.pending).toBeNull();
  });

  it('the damage of «Армада» does not depend on the diagonal, «Буря» or a joint volley', () => {
    let s = turnOf('КОМПАНИЯ', { sea: true });
    setSea(s, 'storm');
    s = act(s, { type: 'volley', ship: 'Г', target: 'М' }).state;
    expect(s.ships['М'].tracks.hull).toBe(11 - 1);
    s = legend(s, 'И');
    expect(s.ships['М'].tracks.hull).toBe(11 - 1 - 2);
    expect(s.ships['Ж'].tracks.hull).toBe(9 - 2);
  });
});

describe('«Джек ускользает» (15.2)', () => {
  /** The Company fires at the Black Pearl with Hull 2: the Volley would sink her. */
  function sinking(options: Parameters<typeof newGame>[0] = {}): GameState {
    const s = turnOf('КОМПАНИЯ', options);
    s.ships['Ж'].tracks.hull = 2;
    return act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
  }

  it('when the Black Pearl must sink, the Pirates may play Jack: Hull 2 and a free swap for 2 Powder', () => {
    let s = sinking();
    expect(s.pending).toEqual({ kind: 'jack', ship: 'Ж' });
    expect(s.ships['Ж']).toMatchObject({ sunk: false, tracks: expect.objectContaining({ hull: 0 }) });
    expect(() => act(s, { type: 'endTurn', side: 'КОМПАНИЯ' })).toThrow('Ждём решения');
    s = act(s, { type: 'jack', play: true }).state;
    expect(s.ships['Ж']).toMatchObject({ sunk: false, legend: false, pos: 1, tracks: expect.objectContaining({ hull: 2 }) });
    expect(s.ships['М'].pos).toBe(0);
    expect(s.teams['ПИРАТЫ'].powder).toBe(6);
  });

  it('declined — the Black Pearl sinks', () => {
    const s = act(sinking(), { type: 'jack', play: false }).state;
    expect(s.ships['Ж'].sunk).toBe(true);
    expect(s.ships['Ж'].legend).toBe(false);
  });

  it('without 2 Powder Jack cannot be played: the ship sinks at once', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['Ж'].tracks.hull = 2;
    s.teams['ПИРАТЫ'].powder = 1;
    const after = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(after.pending).toBeNull();
    expect(after.ships['Ж'].sunk).toBe(true);
  });

  it('Jack goes beyond the Sails limit: it works with Sails 0 and against a Volley without Reactions (Q17)', () => {
    const s = turnOf('КОМПАНИЯ');
    s.ships['Ж'].tracks = { ...s.ships['Ж'].tracks, hull: 2, sails: 0 };
    const [deep] = setHand(s, 'Г', ['Из пучины']);
    const after = act(s, { type: 'volley', ship: 'Г', target: 'Ж', charge: deep }).state;
    expect(after.pending).toEqual({ kind: 'jack', ship: 'Ж' });
    expect(act(after, { type: 'jack', play: true }).state.ships['Ж'].tracks.hull).toBe(2);
  });

  it('in «Штиль» Jack saves the Black Pearl, but the ships stay on their places (16.1, Q22)', () => {
    let s = turnOf('КОМПАНИЯ', { sea: true });
    setSea(s, 'calm');
    s.ships['Ж'].tracks.hull = 2;
    s = act(act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state, { type: 'jack', play: true }).state;
    expect(s.ships['Ж']).toMatchObject({ pos: 0, tracks: expect.objectContaining({ hull: 2 }) });
  });

  it('under «Блокада» Jack saves, but the ships stay on their places (18.10, Q20)', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['М'].blockaded = true;
    s.ships['Ж'].tracks.hull = 2;
    s = act(act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state, { type: 'jack', play: true }).state;
    expect(s.ships['Ж']).toMatchObject({ pos: 0, sunk: false });
  });

  it('Jack works in the Pirates’ own turn too: from Fires at the start of the turn (Q16)', () => {
    let s = passTo(newGame(), 'КОМПАНИЯ');
    s.ships['Ж'].tracks.hull = 1;
    s.ships['Ж'].fires = 1;
    s = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' }).state;
    expect(s.active).toBe('ПИРАТЫ');
    expect(s.pending).toEqual({ kind: 'jack', ship: 'Ж' });
    // The turn waits: no drawing before the decision.
    const hand = s.ships['Ж'].hand.length;
    s = act(s, { type: 'jack', play: true }).state;
    expect(s.ships['Ж'].tracks.hull).toBe(2);
    expect(s.ships['Ж'].hand.length).toBeGreaterThanOrEqual(hand);
    expect(s.turn.limit['Ж']).toBe(3);
  });

  it('Jack in the middle of a card: after «Кракен» sinks the Black Pearl and Jack saves her, the Crew damage still comes', () => {
    let s = turnOf('КОМПАНИЯ');
    s.ships['Г'].souls = 3;
    s.ships['Ж'].tracks.hull = 4;
    s = legend(s, 'Г', 'Ж');
    expect(s.pending).toEqual({ kind: 'jack', ship: 'Ж' });
    s = act(s, { type: 'jack', play: true }).state;
    expect(s.ships['Ж'].tracks).toMatchObject({ hull: 2, crew: 1 });
  });

  it('«Быстрый бой» goes on after Jack (20.2)', () => {
    let s = sinking({ variant: 'quick' });
    expect(s.winner).toBeNull();
    s = act(s, { type: 'jack', play: true }).state;
    expect(s.winner).toBeNull();
    s = actDecline(sinking({ variant: 'quick' }), { type: 'jack', play: false });
    expect(s.winner).toBe('КОМПАНИЯ');
  });

  it('a played Jack is gone: the next time the Black Pearl sinks', () => {
    let s = act(sinking(), { type: 'jack', play: true }).state;
    // After the swap the Black Pearl is opposite the Dutchman: 2 damage.
    s = act(s, { type: 'volley', ship: 'Г', target: 'Ж' }).state;
    expect(s.ships['Ж'].sunk).toBe(true);
  });
});
