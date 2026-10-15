// The pure part of the show queue (docs/mockups/anim/level1/PORTING.md, section 4): which layer shows an action, how
// the displayed state D catches up with it, and the table drawn from D. The queue itself is useFxQueue (FxLayer.tsx).
import { deckCards, legendCards, seaCards } from '../../../engine/data';
import type { Action, GameEvent, GameState, ShipState } from '../../../engine/state';
import type { GameData } from '../../../engine/types';
import { applyVisible, type Display, type DisplayRules } from './display';
import { createPlanner, type FxCards, type FxClip, type FxKind, type FxPlan } from './planFx';

/** A clip with its events (clip.ev → the events of the action), as page.js of the reference passes it to PLAY. */
export type PlayClip = FxClip & { events: GameEvent[] };

/**
 * One action in the queue. `fx` — the animation layer plays its clips; `show` — the whole action goes to the old
 * ShowLayer (the transition: until A4 moves every clip, an action with a clip not yet ported is shown the old way, so
 * the two layers never play one action together).
 */
export interface QueueItem {
  n: number;
  route: 'fx' | 'show';
  events: GameEvent[];
  clips: PlayClip[];
  quiet: number[];
  /** A card is still being played after this action (planner.state.card: a Reaction window came between). */
  cardOpen: boolean;
}

/** `fx` when every clip of the action has a player; an action without clips (only quiet events) — `fx` too (A4): the
 *  layer takes its events into D, there is nothing to play. */
export function routeAction(clips: readonly FxClip[], has: (kind: FxKind) => boolean): 'fx' | 'show' {
  return clips.every((c) => has(c.kind)) ? 'fx' : 'show';
}

/** The planner's options from the game data: the same as the test of A1 and scripts/dump-fx-events.ts. */
export function plannerFor(data: GameData, viewer: readonly string[], sea: string | null) {
  const cards: FxCards = Object.fromEntries([...deckCards(data), ...legendCards(data)].map((c) => [c.code, c]));
  const seaKeyOf: Record<string, string> = Object.fromEntries(seaCards(data).map((c) => [c.code, c.key]));
  const ships = Object.fromEntries(data.ships.map((s) => [s.code, { side: s.side }]));
  return createPlanner({ cards, ships, viewer, sea, seaKey: (code) => seaKeyOf[code] });
}

/** Feeds one action to the planner (always, so a Volley declared in one action is known at its shot) and routes it. */
export function planItem(
  planner: ReturnType<typeof createPlanner>,
  n: number,
  events: GameEvent[],
  action: Action | null,
  has: ((kind: FxKind) => boolean) | null,
): QueueItem {
  const plan: FxPlan = planner.feed(events, action);
  const clips = plan.map((c) => ({ ...c, events: c.ev.map((i) => events[i]) })) as PlayClip[];
  return { n, route: has ? routeAction(plan, has) : 'show', events, clips, quiet: plan.quiet, cardOpen: planner.state.card != null };
}

/** The events of one clip in their order in the action: what D takes in after the clip played. */
export function applyClip(d: Display, item: QueueItem, clip: PlayClip, rules: DisplayRules): void {
  for (const i of [...clip.ev].sort((x, y) => x - y)) applyVisible(d, item.events[i], rules);
}

/** The quiet events of an action (no clip of their own): after its clips. */
export function applyQuiet(d: Display, item: QueueItem, rules: DisplayRules): void {
  for (const i of item.quiet) applyVisible(d, item.events[i], rules);
}

/** An action shown by ShowLayer: D takes in all its events at once (the planks show its result, ShowLayer the numbers). */
export function applyAll(d: Display, item: QueueItem, rules: DisplayRules): void {
  for (const e of item.events) applyVisible(d, e, rules);
}

/**
 * The state the table is drawn from while the queue plays: the displayed fields from D (tracks, places, Fires, sunk,
 * under water, Souls, Legend, Powder, sea, round, turn), the rest — hands, Plans, decisions, statuses of the turn —
 * from the real state. Buttons and «can I» checks never read it.
 */
export function withDisplay(s: GameState, d: Display): GameState {
  return {
    ...s,
    round: d.round,
    active: d.active,
    sea: s.sea ? { ...s.sea, current: d.sea } : s.sea,
    teams: Object.fromEntries(Object.entries(s.teams).map(([side, t]) => [side, { ...t, powder: d.powder[side as keyof Display['powder']] }])) as GameState['teams'],
    ships: Object.fromEntries(
      Object.entries(s.ships).map(([code, x]) => {
        const y = d.ships[code];
        return [code, y ? { ...x, pos: y.pos as ShipState['pos'], tracks: { ...y.tracks }, fires: y.fires, sunk: y.sunk, submerged: y.submerged, souls: y.souls, legend: y.legend } : x];
      }),
    ),
  };
}

/**
 * The statuses the table keeps hidden until their clip plays (A4): flags set by the events of clips not played yet
 * (flagSet, surfaced), by ship. Only the queue of the layer gives them: when it is empty — «Сразу итог», the layer off,
 * Undo, a jump over many actions — nothing is hidden.
 */
export function pendingFlags(items: readonly (QueueItem & { done: number; applied: boolean })[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const it of items) {
    if (it.applied) continue;
    for (const c of it.clips.slice(it.done)) {
      for (const e of c.events) {
        if (e.type === 'flagSet') (out[e.ship] ??= []).push(e.flag);
        else if (e.type === 'surfaced') (out[e.ship] ??= []).push('surfaced');
      }
    }
  }
  return out;
}
