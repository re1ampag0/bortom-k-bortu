// A2b: the Reactions and the special Volleys of the reference (docs/mockups/anim/level1/scenes.js) go through the FX
// layer: every clip of every action has a player in PLAY, and the clips carry what the effects choose by (fx.r of the
// Reaction, the second side, «Без Реакций», the kinds of the cannonballs, the Charge of the captain). The flights are
// DOM: e2e/fx-reactions.spec.ts.
import { describe, expect, it } from 'vitest';
import type { Shot } from '../src/ui/game/fx/planFx';
import { clipsOf, play } from './fx-scenes';

const rs = (id: string) => clipsOf(id).filter((c) => c.kind === 'reaction').map((c) => (c as { r?: string }).r);
const balls = (id: string) => new Set(clipsOf(id).flatMap((c) => ('shots' in c && c.shots ? (c.shots as Shot[]).map((b) => b.kind) : [])));

describe('the Reactions and the special Volleys of the reference', () => {
  const ids = ['dbl', 'wind', 'cover', 'whirl', 'night', 'deepcancel', 'plan', 'zombie', 'heavy', 'counter', 'retaliate', 'firewall', 'abyss', 'both', 'deep', 'hot', 'ghost'];
  for (const id of ids) {
    it(`${id}: every action goes through the layer`, () => {
      expect(play(id).map((x) => x.route)).toEqual(play(id).map(() => 'fx'));
    });
  }

  it('the Reactions are shown by fx.r', () => {
    expect(rs('dbl')).toEqual(['reduce']);
    expect(rs('wind')).toEqual(['reduce']);
    expect(rs('cover')).toEqual(['redirect']);
    expect(rs('whirl')).toEqual(['reduce_all']);
    expect(rs('night')).toEqual(['cancel']);
    expect(rs('deepcancel')).toEqual(['cancel']);
    expect(rs('plan')).toEqual(['cancel_charge']);
    expect(rs('zombie')).toEqual(['reduce', 'cancel_crew']);
    for (const id of ['counter', 'retaliate', 'firewall', 'abyss']) {
      expect(rs(id).at(-1), id).toBe('counter');
      expect(clipsOf(id).some((c) => c.kind === 'counter'), id).toBe(true);
    }
    expect(clipsOf('heavy').some((c) => c.kind === 'counter')).toBe(true);
    for (const id of ['night', 'deepcancel']) expect(clipsOf(id).some((c) => c.kind === 'cancel'), id).toBe(true);
  });

  it('the special Volleys: the second side, «Без Реакций», the cannonballs, the captain, the heart', () => {
    const parts = clipsOf('both').filter((c) => c.kind === 'announce').map((c) => (c as { part: number }).part);
    expect(parts).toEqual([1, 2]);
    expect(clipsOf('deep').some((c) => c.kind === 'announce' && (c as { noReact: boolean }).noReact)).toBe(true);
    expect(balls('deep').has('under')).toBe(true);
    expect(balls('hot').has('hot')).toBe(true);
    expect(clipsOf('hot').some((c) => c.kind === 'announce' && (c as { captain: boolean }).captain)).toBe(true);
    expect(balls('ghost').has('ghost')).toBe(true);
    expect(balls('whirl').has('fire')).toBe(true);
    // «Сердце Дейви Джонса» through the layer: the first action of «wind» (heart, announce, window).
    expect(play('wind')[0].route).toBe('fx');
    expect(play('wind')[0].clips.map((c) => c.kind)).toEqual(['heart', 'announce', 'window']);
  });

  it('«heart» goes to ShowLayer while the clip «sink» is not ported (A3)', () => {
    const first = play('heart')[0];
    expect(first.clips.map((c) => c.kind)).toContain('sink');
    expect(first.route).toBe('show');
  });
});
