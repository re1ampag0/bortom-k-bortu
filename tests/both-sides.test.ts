// «Залп с обоих бортов» (RULES.md 18.11, Q27, Q41, Q42). The Black Pearl (Guns 2) is opposite «Индевор»,
// on the diagonal from the Dutchman.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/engine/state';
import { act, give, newGame, setHand, setSea } from './helpers';

/** The Pirates' turn with 8 Powder each, «Залп с обоих бортов» in the Black Pearl's hand and empty Company hands. */
function prepare(): { s: GameState; both: string } {
  const s = newGame();
  s.teams['ПИРАТЫ'].powder = 8;
  s.teams['КОМПАНИЯ'].powder = 8;
  setHand(s, 'И', []);
  setHand(s, 'Г', []);
  const [both] = setHand(s, 'Ж', ['Залп с обоих бортов']);
  return { s, both };
}

const fire = (s: GameState, both: string, target = 'И') => act(s, { type: 'volley', ship: 'Ж', target, charge: both });

describe('«Залп с обоих бортов»', () => {
  it('hits every enemy ship that can be chosen: Guns damage to each, the diagonal does not count', () => {
    const { s, both } = prepare();
    const r = fire(s, both);
    expect(r.state.ships['И'].tracks.hull).toBe(12 - 2);
    expect(r.state.ships['Г'].tracks.hull).toBe(11 - 2);
    // 1 for the Volley and 1 for the Charge.
    expect(r.state.teams['ПИРАТЫ'].powder).toBe(6);
    expect(r.events.filter((e) => e.type === 'hit')).toHaveLength(2);
  });

  it('every other Volley modifier counts: «Ясное небо» only for the ship opposite (Q27)', () => {
    const { s, both } = prepare();
    s.sea = { deck: [], discard: [], current: null };
    setSea(s, 'clear');
    const after = fire(s, both).state;
    expect(after.ships['И'].tracks.hull).toBe(12 - 3);
    expect(after.ships['Г'].tracks.hull).toBe(11 - 2);
  });

  it('takes no part in the joint volley: it neither gets the bonus nor sets the first target', () => {
    const { s, both } = prepare();
    let after = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    after = fire(after, both).state;
    expect(after.ships['Г'].tracks.hull).toBe(11 - 3 - 2);

    const { s: t, both: b } = prepare();
    let next = fire(t, b).state;
    expect(next.turn.firstTarget).toBeNull();
    next = act(next, { type: 'volley', ship: 'М', target: 'И' }).state;
    // 3 − 1 (diagonal), no bonus.
    expect(next.ships['И'].tracks.hull).toBe(12 - 2 - 2);
  });

  it('each target gets its own Reaction window, as for a separate Volley', () => {
    const { s, both } = prepare();
    setHand(s, 'И', ['Двойная обшивка']);
    setHand(s, 'Г', ['Уйти на глубину']);
    let after = fire(s, both).state;
    expect(after.pending).toMatchObject({ kind: 'reactions', waiting: ['И'] });
    after = act(after, { type: 'react', seat: 'И', card: after.ships['И'].hand[0] }).state;
    expect(after.ships['И'].tracks.hull).toBe(12);
    expect(after.pending).toMatchObject({ kind: 'reactions', waiting: ['Г'] });
    after = act(after, { type: 'react', seat: 'Г', card: after.ships['Г'].hand[0] }).state;
    expect(after.ships['Г'].tracks.hull).toBe(11);
    expect(after.pending).toBeNull();
    expect(after.volley).toBeNull();
  });

  it('does not hit the Dutchman under water (14.8, Q14)', () => {
    const { s, both } = prepare();
    s.ships['Г'].submerged = true;
    const after = fire(s, both).state;
    expect(after.ships['И'].tracks.hull).toBe(10);
    expect(after.ships['Г'].tracks.hull).toBe(11);
  });

  it('in «Туман» it hits only the ship opposite; without one it cannot be fired (Q41)', () => {
    const { s, both } = prepare();
    s.sea = { deck: [], discard: [], current: null };
    setSea(s, 'fog');
    expect(() => fire(s, both, 'Г')).toThrow('Туман');
    const after = fire(s, both, 'И').state;
    expect(after.ships['И'].tracks.hull).toBe(10);
    expect(after.ships['Г'].tracks.hull).toBe(11);
    s.ships['И'].sunk = true;
    s.ships['И'].tracks.hull = 0;
    expect(() => fire(s, both, 'Г')).toThrow('Туман');
  });

  it('«Всё по плану» cancels it: a plain Volley at the current target remains, the other part does not fire (Q42)', () => {
    const { s, both } = prepare();
    const plan = give(s, 'И', 'Всё по плану', 'Ж');
    let after = fire(s, both, 'Г').state;
    after = act(after, { type: 'react', seat: 'И', card: plan }).state;
    // A plain Volley at the Dutchman on the diagonal: 2 − 1.
    expect(after.ships['Г'].tracks.hull).toBe(11 - 1);
    expect(after.ships['И'].tracks.hull).toBe(12);
    expect(after.volley).toBeNull();
    // Now it is an ordinary Volley: it sets the first target for the joint volley.
    after = act(after, { type: 'volley', ship: 'М', target: 'Г' }).state;
    expect(after.ships['Г'].tracks.hull).toBe(10 - 4);
  });
});
