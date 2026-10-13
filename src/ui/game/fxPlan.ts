import type { GameEvent, GameState, Term } from '../../engine/state';
import type { GameData, Track } from '../../engine/types';

export type FxMode = 'rich' | 'simple' | 'reduced' | 'instant';

export interface DisplayShip {
  code: string;
  pos: number;
  tracks: Record<Track, number>;
  fires: number;
  sunk: boolean;
  submerged: boolean;
  surfaced: boolean;
}

export interface DisplayState {
  ships: Record<string, DisplayShip>;
  powder: Record<string, number>;
}

export interface Projectile {
  kind: 'core' | 'chain' | 'grape' | 'fire' | 'spectral';
  outcome: 'hit' | 'miss' | 'redirect';
  target: string;
  label?: string;
  units: number;
}

export type FxClip =
  | { kind: 'card' | 'reaction' | 'fallback'; duration: number; card?: string; label?: string }
  | { kind: 'volley'; duration: number; shooter: string; target: string; track: Track; damage: number; terms: Term[]; projectiles: Projectile[] }
  | { kind: 'hit' | 'repair' | 'status' | 'powder' | 'cards' | 'turn-start' | 'heart'; duration: number; ship?: string; label: string; amount?: number }
  | { kind: 'swap'; duration: number; ships: string[]; reason: string };

export interface FxScenario {
  id: string;
  before: DisplayState;
  after: DisplayState;
  clips: FxClip[];
}

export interface FxPlanOptions {
  data: GameData;
  mode?: FxMode;
  id?: string;
}

const displayState = (s: GameState): DisplayState => ({
  ships: Object.fromEntries(
    Object.values(s.ships).map((ship) => [ship.code, {
      code: ship.code,
      pos: ship.pos,
      tracks: { ...ship.tracks },
      fires: ship.fires,
      sunk: ship.sunk,
      submerged: ship.submerged,
      surfaced: ship.surfaced,
    }]),
  ),
  powder: Object.fromEntries(Object.entries(s.teams).map(([side, team]) => [side, team.powder])),
});

const duration = (mode: FxMode, normal: number): number => mode === 'instant' || mode === 'reduced' ? 0 : normal;

function volleyClip(e: Extract<GameEvent, { type: 'volley' }>, hit: Extract<GameEvent, { type: 'hit' }> | undefined, before: GameState, mode: FxMode): FxClip {
  const damage = hit?.damage ?? e.damage;
  const terms = hit?.terms ?? [];
  const guns = before.ships[e.ship]?.tracks.guns ?? 0;
  const positive = terms.filter((term) => term.n > 0 && term.what !== 'Пушки').reduce((n, term) => n + term.n, 0);
  const negative = terms.filter((term) => term.n < 0).reduce((n, term) => n + Math.abs(term.n), 0);
  const base = Math.max(0, guns);
  const count = base + positive;
  const projectiles: Projectile[] = [];
  const hitCount = Math.min(damage, count);
  for (let i = 0; i < count; i++) {
    projectiles.push({ kind: 'core', outcome: i < hitCount ? 'hit' : 'miss', target: e.target, units: 1 });
  }
  for (let i = 0; i < negative; i++) projectiles.push({ kind: 'core', outcome: 'miss', target: e.target, label: terms.find((term) => term.n < 0)?.what, units: 0 });
  if (projectiles.length > 8) {
    const extra = projectiles.length - 8;
    projectiles.splice(7, extra, { ...projectiles[7], label: `×${extra + 1}`, units: projectiles.slice(7, 7 + extra + 1).reduce((n, p) => n + p.units, 0) });
  }
  return { kind: 'volley', duration: duration(mode, 1900), shooter: e.ship, target: hit?.target ?? e.target, track: hit?.track ?? e.track, damage, terms, projectiles };
}

/** Builds presentation-only effects from visible engine facts; it never applies rules or uses RNG. */
export function planFx(events: GameEvent[], before: GameState, after: GameState, options: FxPlanOptions): FxScenario {
  const mode = options.mode ?? 'rich';
  const clips: FxClip[] = [];
  let lastVolley: Extract<GameEvent, { type: 'volley' }> | undefined;
  for (const event of events) {
    if (event.type === 'volley') {
      lastVolley = event;
      clips.push(volleyClip(event, undefined, before, mode));
    } else if (event.type === 'hit') {
      const prior = clips.at(-1);
      if (prior?.kind === 'volley' && lastVolley) {
        clips[clips.length - 1] = volleyClip(lastVolley, event, before, mode);
      }
    } else if (event.type === 'swapped') clips.push({ kind: 'swap', duration: duration(mode, 600), ships: event.ships, reason: event.reason });
    else if (event.type === 'dived' || event.type === 'surfaced') clips.push({ kind: 'status', duration: duration(mode, 700), ship: event.ship, label: event.type === 'dived' ? 'Погружение' : 'Всплытие' });
    else if (event.type === 'sunk') clips.push({ kind: 'status', duration: duration(mode, 1800), ship: event.ship, label: 'Затонул' });
    else if (event.type === 'fireAdded' || event.type === 'fireDamage' || event.type === 'fireOut') clips.push({ kind: 'status', duration: duration(mode, 700), ship: 'ship' in event ? event.ship : event.seat, label: event.type === 'fireOut' ? 'Пожар потушен' : 'Пожар' });
    else if (event.type === 'restored') clips.push({ kind: 'repair', duration: duration(mode, 700), ship: event.ship, label: 'Ремонт', amount: event.amount });
    else if (event.type === 'powderGained' || event.type === 'powderSpent' || event.type === 'powderLost') clips.push({ kind: 'powder', duration: duration(mode, 600), label: 'Порох', amount: event.amount });
    else if (event.type === 'drew' || event.type === 'passed' || event.type === 'stolen') clips.push({ kind: 'cards', duration: duration(mode, 700), label: event.type === 'drew' ? 'Добор' : event.type === 'passed' ? 'Передача' : 'Кража' });
    else if (event.type === 'heart' || event.type === 'jonesFree') clips.push({ kind: 'heart', duration: duration(mode, 900), ship: event.ship, label: event.type === 'heart' ? 'Сердце Дейви Джонса' : 'Джонс свободен' });
    else if (event.type === 'turnStarted') clips.push({ kind: 'turn-start', duration: duration(mode, 500), label: `Ход ${event.side}` });
    else if (event.type === 'cardPlayed' && event.card !== '?') clips.push({ kind: 'card', duration: duration(mode, 700), card: event.card });
    else if (event.type === 'reaction' && event.card !== '?') clips.push({ kind: 'reaction', duration: duration(mode, 700), card: event.card });
  }
  if (clips.length === 0 && events.length > 0) clips.push({ kind: 'fallback', duration: duration(mode, 500), label: 'Действие' });
  return { id: options.id ?? 'fx', before: displayState(before), after: displayState(after), clips };
}
