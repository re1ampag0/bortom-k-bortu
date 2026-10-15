// The checks of the old show (tests/show.test.ts, ShowLayer — removed in A4) on the clips of the animation layer:
// a Volley with its breakdown, a Volley declared before a Reaction window, a card of the enemy, a Reaction and a
// Legend, a hidden card, own actions, damage over to the Hull.
import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../src/engine/state';
import { HIDDEN } from '../src/engine/view';
import { layoutShots, type FxCards } from '../src/ui/game/fx/planFx';
import { cardHTML } from '../src/ui/game/fx/primitives';
import { planItem, plannerFor } from '../src/ui/game/fx/queue';
import { deckCards, legendCards } from '../src/engine/data';
import { data } from './helpers';

const volley: GameEvent = { type: 'volley', ship: 'М', target: 'И', charge: null, chargeFrom: null, diagonal: false, joint: false, damage: 3, track: 'hull', terms: [{ what: 'Пушки', n: 3 }] };
const hit: GameEvent = { type: 'hit', ship: 'М', target: 'И', damage: 3, track: 'hull', terms: [{ what: 'Пушки', n: 3 }] };
const damage: GameEvent = { type: 'damage', ship: 'И', track: 'hull', amount: 3, toHull: 0 };
const cards: FxCards = Object.fromEntries([...deckCards(data), ...legendCards(data)].map((c) => [c.code, c]));
/** The clips of one action as the Company (И, Г) sees it. */
const clips = (events: GameEvent[], viewer: string[] = ['И', 'Г']) => planItem(plannerFor(data, viewer, null), 1, events, null).clips;

describe('the show of an action on the animation layer', () => {
  it('a Volley of the enemy: the shot with its breakdown, three balls arrive, −3 Корпус', () => {
    const cs = clips([volley, hit, damage]);
    expect(cs.map((c) => c.kind)).toEqual(['announce', 'shot']);
    const shot = cs[1];
    if (shot.kind !== 'shot') throw new Error('shot');
    expect(shot).toMatchObject({ shooter: 'М', target: 'И', damage: 3, track: 'hull', amount: 3, toHull: 0, terms: [{ what: 'Пушки', n: 3 }] });
    expect(layoutShots(shot, cards).filter((b) => b.out === 'hit' && b.to === 'track')).toHaveLength(3);
  });

  it('a Volley declared before a Reaction window: the declaration and the window, no shot yet', () => {
    const cs = clips([volley, { type: 'windowOpened', window: 'before', side: 'КОМПАНИЯ', seats: ['И', 'Г'] }]);
    expect(cs.map((c) => c.kind)).toEqual(['announce', 'window']);
    expect(cs[0]).toMatchObject({ shooter: 'М', target: 'И', damage: 3 });
  });

  it('a card played by the enemy: the clip of the card with its code and its ship', () => {
    expect(clips([{ type: 'cardPlayed', seat: 'И', ship: 'И', card: 'И-06' }], ['Ж', 'М'])).toMatchObject([{ kind: 'card', card: 'И-06', ship: 'И', seat: 'И' }]);
  });

  it('a Reaction and a Legend are shown as cards too', () => {
    const cs = clips([{ type: 'reaction', seat: 'Г', ship: 'Г', card: 'Г-20', fromPlan: false }, { type: 'legendPlayed', seat: 'И', card: 'И-Л', target: 'Ж' }], ['Ж', 'М']);
    expect(cs.map((c) => [c.kind, 'card' in c ? c.card : null])).toEqual([['reaction', 'Г-20'], ['legend', 'И-Л']]);
  });

  it('a hidden card is never shown: it flies face down, without its name', () => {
    const [card] = clips([{ type: 'cardPlayed', seat: 'И', ship: 'И', card: HIDDEN }], ['Ж', 'М']);
    expect(card).toMatchObject({ kind: 'card', card: HIDDEN });
    const [pass] = clips([{ type: 'passed', seat: 'И', to: 'Г', card: HIDDEN }], ['Ж', 'М']);
    expect(pass).toMatchObject({ kind: 'pass', card: HIDDEN });
    const back = cardHTML(data, HIDDEN);
    expect(back).toContain('hcard back');
    for (const c of deckCards(data)) expect(back).not.toContain(c.name);
  });

  it('own actions: the layer shows them in full too (A2, the decision of the user) — the Volley and the card', () => {
    expect(clips([volley, hit, damage], ['Ж', 'М']).map((c) => c.kind)).toEqual(['announce', 'shot']);
    expect(clips([{ type: 'cardPlayed', seat: 'Ж', ship: 'Ж', card: 'Ж-06' }], ['Ж', 'М']).map((c) => c.kind)).toEqual(['card']);
  });

  it('damage that goes over to the Hull: both numbers — on the track and in the Hull', () => {
    const [impact] = clips([{ type: 'damage', ship: 'Ж', track: 'sails', amount: 1, toHull: 2 }]);
    expect(impact).toMatchObject({ kind: 'impact', ship: 'Ж', track: 'sails', amount: 1, toHull: 2 });
  });
});
