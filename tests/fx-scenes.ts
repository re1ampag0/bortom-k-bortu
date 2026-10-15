// The scenes of the reference (docs/mockups/anim/level1/scenes.js) as the queue gets them: the route and the clips of
// each action. Shared by the tests of A2b and A3.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import type { Action, GameEvent } from '../src/engine/state';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { planItem, plannerFor, type PlayClip } from '../src/ui/game/fx/queue';
import { data } from './helpers';

interface Scene {
  id: string;
  viewer: string[];
  start?: { sea: string | null };
  actions: { a: Action; ev: GameEvent[] }[];
}
const win: { SCENES?: Scene[] } = {};
runInNewContext(readFileSync('docs/mockups/anim/level1/scenes.js', 'utf8'), { window: win });
const SCENES = win.SCENES!;
const sideOf = (code: string) => data.ships.find((s) => s.code === code)!.side;
const has = (kind: FxKind) => !!PLAY[kind];

/** The actions of a scene as the queue gets them: the route and the clips. */
export function play(id: string) {
  const sc = SCENES.find((s) => s.id === id)!;
  const start = sc.start ?? SCENES.find((s) => s.start && sideOf(s.viewer[0]) === sideOf(sc.viewer[0]))!.start!;
  const planner = plannerFor(data, sc.viewer, start.sea);
  return sc.actions.map((a, n) => planItem(planner, n, a.ev, a.a, has));
}
export const clipsOf = (id: string): PlayClip[] => play(id).flatMap((x) => x.clips);
