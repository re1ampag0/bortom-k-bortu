// The scenes of the reference (docs/mockups/anim/level1/scenes.js) as the queue gets them: the route and the clips of
// each action. Shared by the tests of A2b, A3 and A4.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import type { Action, GameEvent } from '../src/engine/state';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import type { FxKind } from '../src/ui/game/fx/planFx';
import { planItem, plannerFor, type PlayClip, type QueueItem } from '../src/ui/game/fx/queue';
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
/** «fx» when every clip of the action has its own player (A4: ShowLayer is gone; a clip without one plays PLAY.fallback). */
export const routeOf = (item: QueueItem): 'fx' | 'unported' => (item.clips.every((c) => has(c.kind)) ? 'fx' : 'unported');

/** The actions of a scene as the queue gets them: the route and the clips. */
export function play(id: string) {
  const sc = SCENES.find((s) => s.id === id)!;
  const start = sc.start ?? SCENES.find((s) => s.start && sideOf(s.viewer[0]) === sideOf(sc.viewer[0]))!.start!;
  const planner = plannerFor(data, sc.viewer, start.sea);
  return sc.actions.map((a, n) => {
    const item = planItem(planner, n, a.ev, a.a);
    return { ...item, route: routeOf(item) };
  });
}
export const clipsOf = (id: string): PlayClip[] => play(id).flatMap((x) => x.clips);
