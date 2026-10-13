// The show of an action (docs/TZ.md, «Очередь хода и ожидание», п. 4): the card played large, a Volley with the
// breakdown of its damage, «−3 Корпус» over the plank; a card hidden from the viewer is never shown.
import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../src/engine/state';
import { HIDDEN } from '../src/engine/view';
import { showSteps } from '../src/ui/game/showSteps';

const volley: GameEvent = { type: 'volley', ship: 'М', target: 'И', charge: null, chargeFrom: null, diagonal: false, joint: false, damage: 3, track: 'hull' };
const hit: GameEvent = { type: 'hit', ship: 'М', target: 'И', damage: 3, track: 'hull', terms: [{ what: 'Пушки', n: 3 }] };
const damage: GameEvent = { type: 'damage', ship: 'И', track: 'hull', amount: 3, toHull: 0 };

describe('show of an action', () => {
  it('a Volley of the enemy: an arrow with the breakdown and «−3 Корпус» over the target', () => {
    const steps = showSteps([volley, hit, damage], true);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ k: 'volley', shooter: 'М', target: 'И', damage: 3, terms: [{ what: 'Пушки', n: 3 }] });
    expect(steps[0].floats).toEqual([{ ship: 'И', text: '−3 Корпус', bad: true }]);
  });

  it('a Volley declared before a Reaction window: shown at once, without the breakdown yet', () => {
    const steps = showSteps([volley, { type: 'windowOpened', window: 'before', side: 'КОМПАНИЯ', seats: ['И', 'Г'] }], true);
    expect(steps).toEqual([{ k: 'volley', shooter: 'М', target: 'И', damage: 3, track: 'hull', terms: null, diagonal: false, floats: [] }]);
  });

  it('a card played by the enemy is shown large', () => {
    const steps = showSteps([{ type: 'cardPlayed', seat: 'И', ship: 'И', card: 'И-06' }], true);
    expect(steps).toMatchObject([{ k: 'card', card: 'И-06', ship: 'И', kind: 'card' }]);
  });

  it('a Reaction and a Legend are shown as cards too', () => {
    const steps = showSteps(
      [
        { type: 'reaction', seat: 'Г', ship: 'Г', card: 'Г-20', fromPlan: false },
        { type: 'legendPlayed', seat: 'И', card: 'И-Л', target: 'Ж' },
      ],
      true,
    );
    expect(steps.map((x) => x.k === 'card' && x.kind)).toEqual(['reaction', 'legend']);
  });

  it('a hidden card is never shown', () => {
    expect(showSteps([{ type: 'cardPlayed', seat: 'И', ship: 'И', card: HIDDEN }], true)).toEqual([]);
    expect(showSteps([{ type: 'passed', seat: 'И', to: 'Г', card: HIDDEN }], true)).toEqual([]);
  });

  it('own actions: only the numbers over the planks', () => {
    expect(showSteps([volley, hit, damage], false)).toEqual([{ k: 'floats', floats: [{ ship: 'И', text: '−3 Корпус', bad: true }] }]);
    expect(showSteps([{ type: 'cardPlayed', seat: 'Ж', ship: 'Ж', card: 'Ж-06' }], false)).toEqual([]);
  });

  it('damage that goes over to the Hull shows both numbers', () => {
    const steps = showSteps([{ type: 'damage', ship: 'Ж', track: 'sails', amount: 1, toHull: 2 }], false);
    expect(steps[0].floats.map((f) => f.text)).toEqual(['−1 Паруса', '−2 Корпус']);
  });
});
