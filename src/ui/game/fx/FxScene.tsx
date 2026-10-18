// «?fxScene=<id>»: a scene of the reference (docs/mockups/anim/level1/scenes.js — real moves of bot games, the events
// after eventsFor) played on the table of the game through useFxQueue, without the engine. Only in the dev build and
// the e2e build (App.tsx): the site on GitHub Pages has none of it. The checks of A2 and the next tasks (A2b, A3, A4,
// S1, L1) compare it with the reference frame by frame (capture.mjs).
// «&only=<event types>» (A3): only the events of these types are shown; the others of the actions up to the last one
// with such an event are in the table at the start, the later actions only in the result. So a clip the game cannot
// play yet around it is left out: «surfaced» without «turnStarted» is a clip «surface» of its own (in the reference it
// is a part of the clip «turn», A4). The route of the real game does not change.
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
import type { Recent } from '../../../net/local';
import { Plank, SeaChip, StatusBar, TeamRow, TopHold, useWideLog } from '../Table';
import { TableThings, useSeaClip } from '../TableThings';
import { applyVisible, displayRules, type Display } from './display';
import { FxLayer, useFxQueue } from './FxLayer';
import { markN } from './misc';
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

/**
 * The statuses of the turn as applyExtra of the reference keeps them (its flags); the game reads them from the state:
 * «Чёрная метка», «Без Реакций», «Переговоры», «Блокада», «Кукла вуду», «Всплыл». A new turn ends the first two.
 */
function statusesAfter(data: GameData, s: GameState, events: GameEvent[]) {
  let by: string | null = null;
  for (const e of events) {
    if (e.type === 'cardPlayed') by = e.ship;
    else if (e.type === 'turnStarted') { s.turn.marks = {}; s.turn.noReact = []; }
    else if (e.type === 'surfaced') s.ships[e.ship].surfaced = true;
    else if (e.type === 'flagSet') {
      const ship = s.ships[e.ship];
      if (e.flag === 'mark') s.turn.marks[e.ship] = (s.turn.marks[e.ship] ?? 0) + markN({ data });
      else if (e.flag === 'noReact') s.turn.noReact.push(e.ship);
      else if (e.flag === 'parley') ship.parley = true;
      else if (e.flag === 'blockade') ship.blockaded = true;
      else if (e.flag === 'voodoo') ship.voodoo = by ?? e.ship;
    }
  }
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
    let recent: Recent[] = scene.actions.map((a, n) => ({ n, action: a.a, by: 'bot', events: a.ev }));
    const only = new URLSearchParams(location.search).get('only')?.split(',').filter(Boolean);
    if (only?.length) {
      const last = Math.max(-1, ...recent.map((r, i) => (r.events.some((e) => only.includes(e.type)) ? i : -1)));
      recent = recent.slice(0, last + 1).map((r) => ({ ...r, events: r.events.filter((e) => only.includes(e.type)) }));
      for (const a of scene.actions.slice(0, last + 1)) for (const e of a.ev) if (!only.includes(e.type)) { applyVisible(start, e, rules); handsAfter(start, e); }
    }
    const endState = stateOf(data, end);
    statusesAfter(data, endState, scene.actions.flatMap((a) => a.ev));
    return { start: stateOf(data, start), end: endState, recent, handSeat: start.handSeat ?? scene.viewer[0] };
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
  // «?speed=instant» (S1): the layer is off, as in the game at «мгновенно» — the table is at once the result.
  const enabled = !reducedMotion() && new URLSearchParams(location.search).get('speed') !== 'instant';
  const wideLog = useWideLog();
  const [boardRef, seaRef] = useSeaClip();
  const fx = useFxQueue({
    game: { kind: 'net', recent: started ? setup.recent : [], state: view },
    version: started ? 1 : 0,
    view,
    viewer: scene.viewer,
    data,
    bottom,
    own: true,
    enabled,
    speed,
    rich: new URLSearchParams(location.search).get('rich') !== '0',
    myDecision: false,
    jumpAt: Infinity,
    paused: false,
    hold: false,
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
      fxHidden={fx.hidden[x.code]}
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
  const seat = setup.handSeat;
  const shown = fx.display ? withDisplay(view, fx.display) : view;
  return (
    <div className="game" data-testid="game" data-bottom={bottom} data-fx-scene={scene.id}>
      <TableThings />
      <main className="board" ref={boardRef}>
        <StatusBar s={shown} data={data} instruction={fx.hint ?? scene.title} waiting={false} onSea={() => {}} extra={null} chip={!wideLog} hold={<TopHold side={top} s={tableView} data={data} fxGen={fx.gen} />} />
        <div className="sea-table" ref={seaRef}>
          <div className="sea-water" aria-hidden />
          <div className="planks top">{columns(top).map(renderPlank)}</div>
          <div className="middle" data-fx-gap />
          <div className="planks bottom">{columns(bottom).map(renderPlank)}</div>
        </div>
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
        {wideLog && (
          <div className="log-tools">
            <SeaChip s={shown} data={data} onSea={() => {}} />
          </div>
        )}
        <div className="log-paper">
          <h2>Судовой журнал</h2>
        </div>
      </aside>
      {card && <CardDetail data={data} code={card} status={null} buttons={[]} onClose={() => setCard(null)} />}
    </div>
  );
}
