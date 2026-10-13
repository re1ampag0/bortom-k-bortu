// Damage, Repair, sinking and the end of the game (RULES.md 11, 13.1, 17, 19, 20.2).
import { describe, expect, it } from 'vitest';
import { addFire, checkGameOver, dealDamage, restore } from '../src/engine/damage';
import { createRng } from '../src/engine/rng';
import type { Ctx, GameState } from '../src/engine/state';
import { actDeclining as act, data, newGame, passTo } from './helpers';
// Stage 3 rules without Reactions: `act` here declines every Reaction window the action opens (helpers.actDeclining).

const ctxOf = (s: GameState): Ctx => ({ s, data, rng: createRng(s.rng), events: [] });

describe('damage', () => {
  it('moves the marker down', () => {
    const ctx = ctxOf(newGame());
    dealDamage(ctx, 'И', 'guns', 2);
    expect(ctx.s.ships['И'].tracks).toEqual({ hull: 12, sails: 1, guns: 1, crew: 2 });
  });

  it('damage a track at its minimum cannot take goes to the Hull: Sails 0, Guns 0, Crew 1 (11.1)', () => {
    const ctx = ctxOf(newGame());
    dealDamage(ctx, 'И', 'sails', 3); // Sails 1 → 0, 2 to the Hull.
    expect(ctx.s.ships['И'].tracks).toMatchObject({ sails: 0, hull: 10 });
    dealDamage(ctx, 'И', 'sails', 1);
    expect(ctx.s.ships['И'].tracks).toMatchObject({ sails: 0, hull: 9 });
    dealDamage(ctx, 'И', 'guns', 4); // Guns 3 → 0, 1 to the Hull.
    expect(ctx.s.ships['И'].tracks).toMatchObject({ guns: 0, hull: 8 });
    dealDamage(ctx, 'И', 'crew', 3); // Crew 2 → 1, 2 to the Hull.
    expect(ctx.s.ships['И'].tracks).toMatchObject({ crew: 1, hull: 6 });
    dealDamage(ctx, 'И', 'crew', 1); // Crew 1: everything to the Hull (11.5).
    expect(ctx.s.ships['И'].tracks).toMatchObject({ crew: 1, hull: 5 });
    expect(ctx.events.at(-1)).toEqual({ type: 'damage', ship: 'И', track: 'crew', amount: 0, toHull: 1 });
  });

  it('Hull 0 — the ship sinks: Fires and the Legend leave, the seat keeps hand and deck, Plans go to the hand (11.2, 17.1, 17.2, 17.5)', () => {
    const s = newGame();
    s.teams['ПИРАТЫ'].powder = 0; // no Powder for «Джек ускользает»
    const ship = s.ships['Ж'];
    ship.fires = 2;
    const plan = ship.deck.shift()!;
    ship.plans = [plan];
    const hand = [...ship.hand];
    const deck = [...ship.deck];
    const ctx = ctxOf(s);
    dealDamage(ctx, 'Ж', 'hull', 20);
    expect(ship.sunk).toBe(true);
    expect(ship.tracks.hull).toBe(0);
    expect(ship.fires).toBe(0);
    expect(ship.legend).toBe(false);
    expect(ship.plans).toEqual([]);
    expect(ship.hand).toEqual([...hand, plan]);
    expect(ship.deck).toEqual(deck);
    expect(ctx.events).toContainEqual({ type: 'sunk', ship: 'Ж' });
  });

  it('overflow from another track can sink the ship (11.1, 11.2)', () => {
    const s = newGame();
    s.ships['И'].tracks.hull = 1;
    s.ships['И'].tracks.sails = 0;
    const ctx = ctxOf(s);
    dealDamage(ctx, 'И', 'sails', 2);
    expect(s.ships['И'].sunk).toBe(true);
  });

  it('a sunk ship takes no more damage', () => {
    const s = newGame();
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    const ctx = ctxOf(s);
    expect(dealDamage(ctx, 'И', 'hull', 3)).toBe(0);
    expect(ctx.events).toEqual([]);
  });

  it('Fires: no more than 3 on a ship (13.1)', () => {
    const ctx = ctxOf(newGame());
    addFire(ctx, 'И', 2);
    addFire(ctx, 'И', 2);
    expect(ctx.s.ships['И'].fires).toBe(3);
  });
});

describe('repair', () => {
  it('never above the starting value; the rest is lost (3.7, 11.3)', () => {
    const s = newGame();
    s.ships['И'].tracks.hull = 10;
    s.ships['И'].tracks.crew = 1;
    const ctx = ctxOf(s);
    expect(restore(ctx, 'И', 'hull', 5)).toBe(2);
    expect(s.ships['И'].tracks.hull).toBe(12);
    expect(restore(ctx, 'И', 'crew', 1)).toBe(1);
    expect(restore(ctx, 'И', 'crew', 1)).toBe(0);
    expect(s.ships['И'].tracks.crew).toBe(2);
  });
});

describe('end of the game', () => {
  it('a team with both ships sunk loses at once, in the middle of a turn (19.1)', () => {
    const s = newGame();
    s.ships['Г'].sunk = true;
    s.ships['Г'].tracks.hull = 0;
    s.ships['И'].tracks.hull = 2;
    const r = act(s, { type: 'volley', ship: 'Ж', target: 'И' });
    expect(r.state.ships['И'].sunk).toBe(true);
    expect(r.state.winner).toBe('ПИРАТЫ');
    expect(r.events.at(-1)).toEqual({ type: 'gameOver', winner: 'ПИРАТЫ', reason: 'sunk' });
    expect(() => act(r.state, { type: 'volley', ship: 'М', target: 'И' })).toThrow('Партия окончена');
  });

  it('one ship sunk does not end the standard game (17.2)', () => {
    const s = newGame();
    s.ships['И'].tracks.hull = 2;
    const r = act(s, { type: 'volley', ship: 'Ж', target: 'И' });
    expect(r.state.ships['И'].sunk).toBe(true);
    expect(r.state.winner).toBeNull();
    expect(passTo(r.state, 'КОМПАНИЯ').turn.limit).toEqual({ Г: 3 });
  });

  it('the last ships of both teams sunk by one effect — a draw (19.2)', () => {
    const s = newGame();
    s.ships['М'].sunk = true;
    s.ships['Г'].sunk = true;
    s.teams['ПИРАТЫ'].powder = 0; // no Powder for «Джек ускользает»
    s.ships['Ж'].tracks.hull = 1;
    s.ships['И'].tracks.hull = 1;
    const ctx = ctxOf(s);
    dealDamage(ctx, 'Ж', 'hull', 1);
    dealDamage(ctx, 'И', 'hull', 1);
    expect(checkGameOver(ctx)).toBe(true);
    expect(s.winner).toBe('НИЧЬЯ');
  });

  it('«Быстрый бой»: the first sunk ship ends the game, its opponents win (20.2)', () => {
    const s = newGame({ variant: 'quick' });
    s.ships['И'].tracks.hull = 2;
    const r = act(s, { type: 'volley', ship: 'Ж', target: 'И' });
    expect(r.state.winner).toBe('ПИРАТЫ');
  });

  it('«Быстрый бой»: a team losing its own ship loses too (20.2)', () => {
    let s = act(newGame({ variant: 'quick' }), { type: 'endTurn', side: 'ПИРАТЫ' }).state;
    s.ships['М'].tracks.hull = 1;
    s.ships['М'].fires = 1;
    s = act(s, { type: 'endTurn', side: 'КОМПАНИЯ' }).state;
    expect(s.winner).toBe('КОМПАНИЯ');
  });

  it('«Быстрый бой»: ships of both teams sunk by one effect — a draw (20.2)', () => {
    const s = newGame({ variant: 'quick' });
    s.teams['ПИРАТЫ'].powder = 0; // no Powder for «Джек ускользает»
    s.ships['Ж'].tracks.hull = 1;
    s.ships['Г'].tracks.hull = 1;
    const ctx = ctxOf(s);
    dealDamage(ctx, 'Ж', 'hull', 1);
    dealDamage(ctx, 'Г', 'hull', 1);
    checkGameOver(ctx);
    expect(s.winner).toBe('НИЧЬЯ');
  });
});
