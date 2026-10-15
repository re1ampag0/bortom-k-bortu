// The show of the enemy's and the bots' actions one at a time (docs/TZ.md, «Очередь хода и ожидание», п. 4) and its
// queue. The overlay never takes input: the table under it works, and a decision window opens right after the show of
// the Volley or card that caused it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatTerms, TRACK_DATIVE } from '../../engine/hints';
import { cardByCode, shipData } from '../../engine/state';
import type { GameData } from '../../engine/types';
import { eventsFor, type Viewer } from '../../engine/view';
import type { Speed } from '../storage';
import { HandCard } from './Hand';
import { actorOf, showSteps, type Recent, type ShowStep } from './showSteps';

/** How long a card or a Volley stays on screen at each show speed. */
export const SHOW_MS: Record<Speed, number> = { slow: 2600, normal: 1800, fast: 1000, instant: 0 };

interface ShowSource {
  kind: 'local' | 'net';
  recent: Recent[];
  state: { ships: Record<string, { side: string }> };
}

/**
 * The queue of steps to show. New actions come from `game.recent` (each with its number, so a message carrying several
 * loses none); the enemy's and the bots' actions are shown in full, the player's own — only the numbers on the planks.
 */
export function useShowQueue({
  game,
  version,
  viewer,
  mySeats,
  bottom,
  enabled,
  speed,
  myDecision,
  paused,
  hold = false,
}: {
  game: ShowSource;
  version: number;
  viewer: Viewer;
  mySeats: string[];
  bottom: string;
  /** Off at the instant speed, at «?speed=instant» and for the rest of the turn after «До конца хода». */
  enabled: boolean;
  speed: Speed;
  /** The game waits for this device: only the step that caused it is left, the decision is not delayed. */
  myDecision: boolean;
  /** A banner is up: the show waits for it (one thing at a time). */
  paused: boolean;
  /** «Пауза»: the step on screen stays until «Дальше». */
  hold?: boolean;
}) {
  const shown = useRef((game.recent.at(-1)?.n ?? -1) + 1);
  const [queue, setQueue] = useState<{ id: number; step: ShowStep }[]>([]);
  const ids = useRef(0);

  useEffect(() => {
    const fresh = game.recent.filter((r) => r.n >= shown.current);
    if (fresh.length === 0) return;
    shown.current = fresh.at(-1)!.n + 1;
    if (!enabled) return;
    const steps: ShowStep[] = [];
    for (const r of fresh) {
      // On one screen the game keeps every event: the viewer sees only what viewFor allows (the server cut them already).
      const events = game.kind === 'local' ? eventsFor(game.state as never, viewer, r.events) : r.events;
      steps.push(...showSteps(events, isOthers(r, game, mySeats, bottom)));
    }
    if (steps.length === 0) return;
    setQueue((q) => {
      const next = [...q, ...steps.map((step) => ({ id: ++ids.current, step }))];
      return myDecision ? next.slice(-1) : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    if (!enabled) setQueue([]);
  }, [enabled]);

  const head = queue[0] ?? null;
  useEffect(() => {
    if (!head || paused || hold) return;
    const full = SHOW_MS[speed] || 0;
    const ms = head.step.k === 'floats' ? Math.min(900, Math.max(500, full)) : full;
    const t = setTimeout(() => setQueue((q) => (q[0]?.id === head.id ? q.slice(1) : q)), ms);
    return () => clearTimeout(t);
  }, [head, speed, paused, hold]);

  const skip = useCallback(() => setQueue([]), []);
  return { step: paused ? null : head, busy: queue.length > 0, skip };
}

function isOthers(r: Recent, game: ShowSource, mySeats: string[], bottom: string): boolean {
  if (game.kind === 'local') return r.by === 'bot';
  const who = actorOf(r.action);
  if (who.seat) return !mySeats.includes(who.seat);
  if (who.side) return who.side !== bottom;
  return true;
}

interface Box {
  x: number;
  y: number;
  top: number;
}

function plankBox(code: string): Box | null {
  const e = document.querySelector(`[data-ship="${code}"]`);
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, top: b.top };
}

export function ShowLayer({ data, step, decisionOpen = false }: { data: GameData; step: { id: number; step: ShowStep } | null; decisionOpen?: boolean }) {
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [middle, setMiddle] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    if (!step) return;
    const out: Record<string, Box> = {};
    for (const ship of data.ships) {
      const b = plankBox(ship.code);
      if (b) out[ship.code] = b;
    }
    setBoxes(out);
    const board = document.querySelector('.board')?.getBoundingClientRect();
    setMiddle(board ? { x: board.left + board.width / 2, y: board.top + board.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 });
  }, [step, data]);
  if (!step || !middle) return null;
  const s = step.step;
  const nick = (code: string) => `«${shipData(data, code).nick}»`;

  return (
    <div className="show-layer" aria-live="polite" key={step.id}>
      {s.k === 'card' && (
        <div className="show-card" data-testid="show-card" style={{ left: middle.x, top: middle.y }}>
          <span className="show-caption">
            {s.kind === 'reaction' ? `${nick(s.ship)}: Реакция` : s.kind === 'legend' ? `${nick(s.ship)}: Легенда` : `${nick(s.ship)} играет`}
            {s.target && data.ships.some((x) => x.code === s.target) ? ` → ${nick(s.target)}` : ''}
          </span>
          <HandCard data={data} code={s.card} off={null} />
          <span className="sr-only">{cardByCode(data, s.card).name}</span>
        </div>
      )}
      {s.k === 'effect' && boxes[s.ship] && (
        <div className={`show-effect show-effect-${s.effect}`} data-testid="show-effect" style={{ left: boxes[s.ship].x, top: boxes[s.ship].y }}>
          {s.label}
        </div>
      )}
      {s.k === 'volley' && boxes[s.shooter] && boxes[s.target] && (
        <>
          {!decisionOpen && Array.from({ length: Math.min(8, Math.max(0, s.damage)) }, (_, i) => (
            <span
              key={i}
              className="show-projectile"
              data-testid="show-projectile"
              style={{
                left: boxes[s.shooter].x,
                top: boxes[s.shooter].y,
                ['--to-x' as string]: `${boxes[s.target].x - boxes[s.shooter].x}px`,
                ['--to-y' as string]: `${boxes[s.target].y - boxes[s.shooter].y}px`,
                animationDelay: `${i * 0.14}s`,
              }}
            />
          ))}
          {!decisionOpen && <div
            className="show-plate show-plate-side"
            data-testid="show-plate"
            style={{ left: Math.max(180, Math.min(innerWidth - 180, boxes[s.target].x + 150)), top: boxes[s.target].y }}
          >
            <b>{s.damage} по {TRACK_DATIVE[s.track]}</b>
            {s.terms && s.terms.length > 0 && <span>{formatTerms(s.terms)}</span>}
          </div>}
        </>
      )}
      {s.k === 'floats' && s.floats.map((f, i) =>
        boxes[f.ship] ? (
          <span key={i} className={`show-float ${f.bad ? 'bad' : ''}`} data-testid="show-float" style={{ left: boxes[f.ship].x, top: boxes[f.ship].y - 14 + 26 * countBefore(s.floats, i) }}>
            {f.text}
          </span>
        ) : null,
      )}
    </div>
  );
}

/** Several numbers over one plank stack under each other. */
function countBefore(floats: { ship: string }[], i: number): number {
  return floats.slice(0, i).filter((f) => f.ship === floats[i].ship).length;
}
