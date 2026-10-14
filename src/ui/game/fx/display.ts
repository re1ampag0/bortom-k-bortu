// The displayed state: what the planks and Holds show while clips play. It lags behind the real state and catches
// up event by event (applyVisible); when the queue is empty it equals the real state (displayFrom).
// A one-to-one port of applyVisible from docs/mockups/anim/level1/planfx.js (see PORTING.md).
import type { GameData, Side, Track } from '../../../engine/types';
import type { GameEvent, GameState } from '../../../engine/state';

export interface DisplayShip {
  pos: number;
  tracks: Record<Track, number>;
  fires: number;
  sunk: boolean;
  submerged: boolean;
  souls: number;
  legend: boolean;
}

export interface Display {
  round: number;
  active: Side;
  /** Code of the current sea card. */
  sea: string | null;
  powder: Record<Side, number>;
  ships: Record<string, DisplayShip>;
}

/** Numbers applyVisible needs: «Джек ускользает» sets the Hull to min(jackHull, the ship's starting Hull). */
export interface DisplayRules {
  jackHull: number;
  startHull: Record<string, number>;
}

export function displayRules(data: GameData): DisplayRules {
  return { jackHull: data.rules.jackHull, startHull: Object.fromEntries(data.ships.map((s) => [s.code, s.hull])) };
}

/** The displayed fields of the real state (a copy). */
export function displayFrom(s: GameState): Display {
  return {
    round: s.round,
    active: s.active,
    sea: s.sea?.current ?? null,
    powder: Object.fromEntries(Object.entries(s.teams).map(([k, t]) => [k, t.powder])) as Record<Side, number>,
    ships: Object.fromEntries(Object.values(s.ships).map((x) => [x.code, {
      pos: x.pos, tracks: { ...x.tracks }, fires: x.fires, sunk: x.sunk, submerged: x.submerged, souls: x.souls, legend: x.legend,
    }])),
  };
}

/** Applies one event the viewer sees to the displayed state (in place) and returns it. */
export function applyVisible(d: Display, e: GameEvent, rules: DisplayRules): Display {
  const sh = (c: string) => d.ships[c];
  switch (e.type) {
    case 'damage': { const s = sh(e.ship); s.tracks[e.track] = Math.max(0, s.tracks[e.track] - e.amount); s.tracks.hull = Math.max(0, s.tracks.hull - e.toHull); break; }
    case 'restored': sh(e.ship).tracks[e.track] += e.amount; break;
    case 'sunk': { const s = sh(e.ship); s.sunk = true; s.fires = 0; s.submerged = false; s.legend = false; s.tracks.hull = 0; break; } // «Корабль в бутылке» sinks without a damage event
    case 'jackEscaped': { const s = sh(e.ship); s.tracks.hull = Math.min(rules.jackHull, rules.startHull[e.ship]); s.legend = false; break; }
    case 'swapped': {
      if (e.ships.length === 2) { const a = sh(e.ships[0]), b = sh(e.ships[1]); const p = a.pos; a.pos = b.pos; b.pos = p; }
      else { const a = sh(e.ships[0]); a.pos = 1 - a.pos; }
      break;
    }
    case 'dived': sh(e.ship).submerged = true; sh(e.ship).fires = 0; break;
    case 'surfaced': sh(e.ship).submerged = false; break;
    case 'fireAdded': sh(e.ship).fires = e.fires; break;
    case 'fireOut': sh(e.seat).fires = e.fires; break;
    case 'powderGained': d.powder[e.side] += e.amount; break;
    case 'powderSpent': case 'powderLost': d.powder[e.side] -= e.amount; break;
    case 'soulsGained': sh(e.ship).souls += e.amount; break;
    case 'soulsSpent': sh(e.ship).souls -= e.amount; break;
    case 'soulsUsed': sh(e.ship).souls -= 1; break;
    case 'legendPlayed': sh(e.seat).legend = false; break;
    case 'seaRevealed': d.sea = e.card; break;
    case 'roundStarted': d.round = e.round; break;
    case 'turnStarted': d.active = e.side; break;
    default: break;
  }
  return d;
}
