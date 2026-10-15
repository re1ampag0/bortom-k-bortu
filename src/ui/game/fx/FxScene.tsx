// «?fxScene=<id>»: a scene of the reference (docs/mockups/anim/level1/scenes.js — real moves of bot games, the events
// after eventsFor) played on the table of the game through useFxQueue, without the engine. Only in the dev build and
// the e2e build (App.tsx): the site on GitHub Pages has none of it. The checks of A2 and the next tasks (A2b, A3, A4,
// S1, L1) compare it with the reference frame by frame (capture.mjs).
import { useEffect, useMemo, useRef, useState } from 'react';
import scenesSrc from '../../../../docs/mockups/anim/level1/scenes.js?raw';
import { createGame } from '../../../engine/setup';
import type { Action, GameEvent, GameState } from '../../../engine/state';
import type { GameData, Side, Track } from '../../../engine/types';
import { HIDDEN } from '../../../engine/view';
import { reducedMotion } from '../../start/motion';
import type { Speed } from '../../storage';
import { Hand, seatLabel } from '../Hand';
import { CardDetail } from '../Overlays';
import type { Recent } from '../showSteps';
import { Plank, StatusBar, TeamRow } from '../Table';
import { applyVisible, displayRules, type Display } from './display';
import { FxLayer, useFxQueue } from './FxLayer';
import { withDisplay } from './queue';

interface SceneShip {
  pos: number;
  tracks: Record<Track, number>;
  fires: number;
  sunk: boolean;
  submerged: boolean;
  souls: number;
  legend: boolean;
  /** The cards of the seat at the device; a number for the others. */
  hand: string[] | number;
}
interface SceneStart extends Display {
  handSeat?: string;
  ships: Record<string, SceneShip>;
}
export interface RefScene {
  id: string;
  title: string;
  viewer: string[];
  start?: SceneStart;
  actions: { a: Action; ev: GameEvent[] }[];
}

/** The scenes of the reference: scenes.js sets window.SCENES. */
export function refScenes(src: string = scenesSrc): RefScene[] {
  const w: { SCENES?: RefScene[] } = {};
  new Function('window', src)(w);
  return w.SCENES ?? [];
}

/** defaultStart of page.js: a scene without a start takes the start of a scene of the same side. */
function startOf(scenes: RefScene[], sc: RefScene, data: GameData): SceneStart {
  const side = (code: string) => data.ships.find((s) => s.code === code)!.side;
  return structuredClone(sc.start ?? scenes.find((s) => s.start && side(s.viewer[0]) === side(sc.viewer[0]))!.start!);
}

/** The hands as applyExtra of the reference (play-misc.js) changes them; the game takes them from the real state. */
function handsAfter(st: SceneStart, e: GameEvent) {
  const ev = e as GameEvent & { ship?: string; seat?: string; card?: string; cards?: string[]; count?: number; fromPlan?: boolean };
  const sh = st.ships[ev.ship || ev.seat || ''];
  const take = (s: SceneShip, n: number) => (s.hand = Array.isArray(s.hand) ? s.hand.slice(0, Math.max(0, s.hand.length - n)) : Math.max(0, s.hand - n));
  switch (e.type) {
    case 'drew':
      if (sh) sh.hand = Array.isArray(sh.hand) ? [...sh.hand, ...(ev.cards || Array(ev.count).fill(HIDDEN))] : sh.hand + (ev.count ?? 0);
      break;
    case 'cardPlayed': case 'sold': case 'discarded':
      if (sh) {
        if (Array.isArray(sh.hand)) {
          const i = sh.hand.indexOf(ev.card!);
          const q = i >= 0 ? i : sh.hand.indexOf(HIDDEN);
          if (q >= 0) sh.hand.splice(q, 1);
        } else sh.hand = Math.max(0, sh.hand - 1);
      }
      break;
    case 'reaction': {
      const s2 = st.ships[ev.seat!];
      if (s2 && !ev.fromPlan) {
        if (Array.isArray(s2.hand)) {
          const i = s2.hand.indexOf(ev.card!);
          if (i >= 0) s2.hand.splice(i, 1);
        } else s2.hand = Math.max(0, s2.hand - 1);
      }
      break;
    }
    case 'planned': { const s2 = st.ships[ev.seat!]; if (s2) take(s2, ev.count ?? 0); break; }
    default: break;
  }
}

/** A GameState for the table from a start of the reference: the displayed fields and the hands, the rest from a new game. */
function stateOf(data: GameData, st: SceneStart): GameState {
  const s = structuredClone(createGame(data, { seed: 1 }).state);
  s.round = st.round;
  s.active = st.active;
  s.pending = null;
  if (s.sea) s.sea.current = st.sea;
  for (const side of Object.keys(s.teams) as Side[]) s.teams[side].powder = st.powder[side];
  for (const [code, x] of Object.entries(st.ships)) {
    const ship = s.ships[code];
    Object.assign(ship, { pos: x.pos, tracks: { ...x.tracks }, fires: x.fires, sunk: x.sunk, submerged: x.submerged, souls: x.souls, legend: x.legend });
    ship.hand = Array.isArray(x.hand) ? [...x.hand] : Array(x.hand).fill(HIDDEN);
  }
  return s;
}

function urlSpeed(): Speed {
  const v = new URLSearchParams(location.search).get('speed');
  return v === 'slow' || v === 'fast' ? v : 'normal';
}

export default function FxScene({ id, data }: { id: string; data: GameData }) {
  const scenes = useMemo(() => refScenes(), []);
  const scene = scenes.find((x) => x.id === id) ?? null;
  const setup = useMemo(() => {
    if (!scene) return null;
    const start = startOf(scenes, scene, data);
    const rules = displayRules(data);
    // The real state: the start + every event of the scene (finalState of page.js).
    const end = structuredClone(start);
    for (const a of scene.actions) for (const e of a.ev) { applyVisible(end, e, rules); handsAfter(end, e); }
    const recent: Recent[] = scene.actions.map((a, n) => ({ n, action: a.a, by: 'bot', events: a.ev }));
    return { start: stateOf(data, start), end: stateOf(data, end), recent, handSeat: start.handSeat ?? scene.viewer[0] };
  }, [scene, scenes, data]);
  // The show starts after 350 ms, as in the reference.
  const [started, setStarted] = useState(false);
  const [card, setCard] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setStarted(true);
      document.body.dataset.fxStart = '1';
    }, 350);
    return () => clearTimeout(t);
  }, []);
  if (!scene || !setup) return <p className="page">Нет сцены «{id}». Сцены: {scenes.map((x) => x.id).join(', ')}</p>;
  return <SceneTable data={data} scene={scene} setup={setup} started={started} card={card} setCard={setCard} />;
}

function SceneTable({
  data,
  scene,
  setup,
  started,
  card,
  setCard,
}: {
  data: GameData;
  scene: RefScene;
  setup: { start: GameState; end: GameState; recent: Recent[]; handSeat: string };
  started: boolean;
  card: string | null;
  setCard: (code: string | null) => void;
}) {
  const view = started ? setup.end : setup.start;
  const bottom = data.ships.find((s) => s.code === scene.viewer[0])!.side;
  const top: Side = bottom === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ';
  const speed = urlSpeed();
  const enabled = !reducedMotion();
  const fx = useFxQueue({
    game: { kind: 'net', recent: started ? setup.recent : [], state: view },
    version: started ? 1 : 0,
    view,
    viewer: scene.viewer,
    data,
    bottom,
    enabled,
    speed,
    rich: new URLSearchParams(location.search).get('rich') !== '0',
    myDecision: false,
    paused: false,
    hold: false,
    show: { push: () => 0, busy: false },
  });
  // The show ended: it was busy and is not any more (or there is no show: reduced motion).
  const seen = useRef(false);
  useEffect(() => {
    if (fx.busy) seen.current = true;
    else if (started && (seen.current || !enabled)) document.body.dataset.fxDone = '1';
  }, [started, fx.busy, enabled]);
  const tableView = fx.display ? withDisplay(view, fx.display) : view;
  const columns = (side: Side) => {
    const ships = Object.values(tableView.ships).filter((x) => x.side === side);
    const cols: (typeof ships[number] | null)[] = [null, null];
    for (const x of ships.filter((y) => !y.sunk)) cols[x.pos] = x;
    for (const x of ships.filter((y) => y.sunk)) cols[cols[x.pos] ? 1 - x.pos : x.pos] = x;
    return cols.filter((x): x is NonNullable<typeof x> => !!x);
  };
  const renderPlank = (x: GameState['ships'][string]) => (
    <Plank
      key={x.code}
      s={tableView}
      fxGen={fx.gen}
      data={data}
      ship={x}
      own={x.side === bottom}
      selected={false}
      awaiting={false}
      targeted={false}
      shooter={false}
      plate={null}
      buttons={[]}
      role={null}
      onSelect={() => {}}
      onDetails={() => {}}
      onLegend={null}
    />
  );
  const handsOf = (side: Side) => Object.values(view.ships).filter((x) => x.side === side).map((x) => x.hand.length);
  const seat = setup.handSeat;
  return (
    <div className="game" data-testid="game" data-bottom={bottom} data-fx-scene={scene.id}>
      <StatusBar s={fx.display ? withDisplay(view, fx.display) : view} data={data} instruction={fx.hint ?? scene.title} waiting={false} onSea={() => {}} extra={null} />
      <main className="board">
        <TeamRow side={top} s={tableView} data={data} hands={handsOf(top)} regroup={null} hint={null} fxGen={fx.gen} />
        <div className="planks top">{columns(top).map(renderPlank)}</div>
        <div className="middle" data-fx-gap />
        <div className="planks bottom">{columns(bottom).map(renderPlank)}</div>
        <TeamRow side={bottom} s={tableView} data={data} hands={null} regroup={null} hint={null} fxGen={fx.gen} />
        <div className="hand-row" data-fx-hand>
          <Hand
            s={view}
            data={data}
            seat={seat}
            tabs={[]}
            onTab={() => {}}
            offOf={() => null}
            chosen={null}
            noteOf={() => undefined}
            onCard={(_holder, code) => setCard(code)}
            onDiscard={() => {}}
            label={`Рука «${seatLabel(data, seat)}»`}
          />
        </div>
        <FxLayer fx={fx} />
      </main>
      <aside className="log-col">
        <h2>Журнал</h2>
      </aside>
      {card && <CardDetail data={data} code={card} status={null} buttons={[]} onClose={() => setCard(null)} />}
    </div>
  );
}
