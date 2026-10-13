// The Volley (RULES.md 10). Placement: Ж opposite И on the left, М opposite Г on the right.
import { describe, expect, it } from 'vitest';
import raw from '../data/game-data.json';
import { loadGameData } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/engine';
import type { Action, GameState } from '../src/engine/state';
import { POSITIONS, act, newGame, passTo, run } from './helpers';

const v = (ship: string, target: string): Action => ({ type: 'volley', ship, target });

describe('Volley', () => {
  it('costs 1 Powder and deals Guns damage to the Hull of the ship opposite (10.1, 10.5, 10.8)', () => {
    const s = newGame();
    const r = act(s, v('Ж', 'И'));
    expect(r.state.ships['И'].tracks).toEqual({ hull: 10, sails: 1, guns: 3, crew: 2 });
    expect(r.state.teams['ПИРАТЫ'].powder).toBe(1);
    expect(r.events).toContainEqual(
      expect.objectContaining({ type: 'volley', ship: 'Ж', target: 'И', diagonal: false, damage: 2, track: 'hull' }),
    );
  });

  it('on the diagonal deals 1 less (10.5)', () => {
    const r = act(newGame(), v('Ж', 'Г'));
    expect(r.state.ships['Г'].tracks.hull).toBe(10);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'volley', diagonal: true, damage: 1 }));
  });

  it('damage is never below 0 (10.5)', () => {
    const s = newGame();
    s.ships['Ж'].tracks.guns = 1;
    const r = act(s, v('Ж', 'Г'));
    expect(r.state.ships['Г'].tracks.hull).toBe(11);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'volley', damage: 0 }));
  });

  it('each ship gives one Volley a turn (10.2)', () => {
    const s = act(newGame(), v('Ж', 'И')).state;
    expect(() => act(s, v('Ж', 'Г'))).toThrow('уже дал Залп');
    expect(act(s, v('М', 'Г')).state.turn.volleys).toMatchObject({ Ж: 1, М: 1 });
    // A new turn gives a new Volley.
    const next = passTo(passTo(s, 'КОМПАНИЯ'), 'ПИРАТЫ');
    expect(() => act(next, v('Ж', 'И'))).not.toThrow();
  });

  it('Guns 0 — no Volley (3.4, 10.3)', () => {
    const s = newGame();
    s.ships['Ж'].tracks.guns = 0;
    expect(() => act(s, v('Ж', 'И'))).toThrow('Пушки 0');
  });

  it('needs Powder (6.5)', () => {
    const s = newGame();
    s.teams['ПИРАТЫ'].powder = 0;
    expect(() => act(s, v('Ж', 'И'))).toThrow('Не хватает Пороха');
  });

  it('targets only an enemy ship afloat', () => {
    const s = newGame();
    expect(() => act(s, v('Ж', 'М'))).toThrow('вражеский');
    s.ships['И'].sunk = true;
    expect(() => act(s, v('Ж', 'И'))).toThrow('утонул');
  });

  it('a sunk ship does not fire', () => {
    const s = newGame();
    s.ships['Ж'].sunk = true;
    expect(() => act(s, v('Ж', 'И'))).toThrow('утонул');
  });

  it('only in your own turn', () => {
    expect(() => act(newGame(), v('И', 'Ж'))).toThrow('ход другой команды');
  });

  it('the diagonal depends only on positions: after a regroup the other ship is opposite (10.6)', () => {
    const s = act(newGame(), { type: 'regroup', side: 'ПИРАТЫ' }).state;
    const r = act(s, v('Ж', 'Г'));
    expect(r.state.ships['Г'].tracks.hull).toBe(9);
  });
});

describe('joint volley (10.7)', () => {
  it('+1 when the second ship of the team fires at the target of the first', () => {
    const r = act(act(newGame(), v('Ж', 'И')).state, v('М', 'И'));
    // Ж: 2; М on the diagonal: 3 − 1 + 1.
    expect(r.state.ships['И'].tracks.hull).toBe(12 - 2 - 3);
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'volley', ship: 'М', joint: true, damage: 3 }));
  });

  it('no bonus at another target', () => {
    const s = run(newGame(), v('Ж', 'И'), v('М', 'Г'));
    expect(s.ships['Г'].tracks.hull).toBe(8);
    expect(s.turn.jointUsed).toBe(false);
  });

  it('works for the Company too', () => {
    const s = passTo(newGame(), 'КОМПАНИЯ');
    const after = run(s, v('Г', 'М'), v('И', 'М'));
    // Г: 2; И on the diagonal: 3 − 1 + 1.
    expect(after.ships['М'].tracks.hull).toBe(11 - 2 - 3);
  });

  describe('with two Volleys a turn (data volleysPerTurn = 2)', () => {
    const custom = structuredClone(raw) as any;
    for (const ship of custom.ships) ship.volleysPerTurn = 2;
    const data2 = loadGameData(custom);
    const play = (s: GameState, ...actions: Action[]) => {
      for (const a of actions) s = applyAction(s, a, data2).state;
      return s;
    };
    const start = () => {
      const s = createGame(data2, { seed: 1, positions: POSITIONS }).state;
      s.teams['ПИРАТЫ'].powder = 8;
      return s;
    };

    it('the bonus is given once a turn', () => {
      const s = play(start(), v('Ж', 'И'), v('М', 'И'), v('М', 'И'));
      // 2 + (3 − 1 + 1) + (3 − 1).
      expect(s.ships['И'].tracks.hull).toBe(12 - 2 - 3 - 2);
    });

    it('a second Volley of the same ship gets no bonus', () => {
      const s = play(start(), v('Ж', 'И'), v('Ж', 'И'));
      expect(s.ships['И'].tracks.hull).toBe(12 - 2 - 2);
      expect(s.turn.jointUsed).toBe(false);
    });

    it('the first target is the ship that took the first Volley', () => {
      const s = play(start(), v('Ж', 'Г'), v('М', 'И'), v('М', 'Г'));
      expect(s.turn.firstTarget).toBe('Г');
      // Ж → Г: 1; М → И: 2, no bonus; М → Г: 3 + 1.
      expect(s.ships['И'].tracks.hull).toBe(10);
      expect(s.ships['Г'].tracks.hull).toBe(11 - 1 - 4);
    });
  });
});

describe('Volley parameters of a ship (docs/TZ.md, «Данные»)', () => {
  const withShip = (change: (ship: any) => void) => {
    const custom = structuredClone(raw) as any;
    change(custom.ships.find((x: any) => x.code === 'Ж'));
    const data2 = loadGameData(custom);
    const s = createGame(data2, { seed: 1, positions: POSITIONS }).state;
    s.teams['ПИРАТЫ'].powder = 8;
    return (a: Action) => applyAction(s, a, data2).state;
  };

  it('volleyCost', () => {
    expect(withShip((x) => (x.volleyCost = 2))(v('Ж', 'И')).teams['ПИРАТЫ'].powder).toBe(6);
  });

  it('diagDamage as a fixed number', () => {
    expect(withShip((x) => (x.diagDamage = { fixed: 4 }))(v('Ж', 'Г')).ships['Г'].tracks.hull).toBe(7);
  });

  it('diagDamage as another offset', () => {
    expect(withShip((x) => (x.diagDamage = { offset: 0 }))(v('Ж', 'Г')).ships['Г'].tracks.hull).toBe(9);
  });

  it('defaultTrack', () => {
    expect(withShip((x) => (x.defaultTrack = 'sails'))(v('Ж', 'Г')).ships['Г'].tracks.sails).toBe(2);
  });
});
