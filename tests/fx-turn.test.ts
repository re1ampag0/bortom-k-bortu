// A4: the start and the end of a turn, the card, repairs, Powder, Souls, statuses, drawing (src/ui/game/fx/misc.ts).
// The actions of the reference scenes go through the FX layer; the flights are DOM: e2e/fx-turn.spec.ts.
import { describe, expect, it } from 'vitest';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { clipsOf, play } from './fx-scenes';

const route = (id: string) => play(id).map((x) => x.route);
const all = (id: string, r: 'fx' | 'show') => play(id).map(() => r);

describe('the start and the end of a turn', () => {
  it('the clips are in PLAY', () => {
    for (const k of ['turn', 'turnEnd', 'draw', 'round', 'sea'] as FxKind[]) expect(typeof PLAY[k], k).toBe('function');
  });

  it('turn: through the layer; the Plan, then the start of the turn with its effects in the order of the events', () => {
    expect(route('turn')).toEqual(all('turn', 'fx'));
    const clips = clipsOf('turn');
    expect(clips.map((c) => c.kind)).toEqual(['turnEnd', 'turn']);
    expect(clips[0]).toMatchObject({ kind: 'turnEnd', plans: { count: 1 } });
    const turn = clips[1];
    if (turn.kind !== 'turn') throw new Error('turn');
    // income → Fire (its damage right after it) → surfacing → drawing
    expect(turn.effects.map((e) => e.type)).toEqual(['powderGained', 'fireDamage', 'damage', 'surfaced', 'drew']);
    // the scene draws for «Голландец», the hand at the device is «Индевор»'s: the backs fly to the ship
    expect(turn.effects.at(-1)).toMatchObject({ type: 'drew', seat: 'Г', count: 2 });
  });
});
