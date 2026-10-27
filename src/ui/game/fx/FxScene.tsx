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
import { FxLayer, useFxPart, useFxQueue } from './FxLayer';
import { useTableBody } from '../tableBody';
import { markN } from './misc';
import {PerfPanel, usePerf} from '../perf/PerfPanel';
import { clearScars, scar, setScarTestRate, type ScarLife } from './scars';
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
  const found = scenes.find((x) => x.id === id) ?? null;
  // «&diag=1» (checks of A11): the Volley of the scene is weakened by «Диагональ −1», so one ball falls short into the water
  const diag = new URLSearchParams(location.search).get('diag') === '1';
  const scene = useMemo(() => {
    if (!found || !diag) return found;
    const c = structuredClone(found);
    for (const a of c.actions) for (const e of a.ev) {
      if (e.type === 'hit') { e.damage -= 1; e.terms = [...e.terms, { what: 'Диагональ', n: -1 }]; }
      else if (e.type === 'volley') { e.damage -= 1; e.diagonal = true; }
      else if (e.type === 'damage') { e.amount -= 1; }
    }
    return c;
  }, [found, diag]);
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
    if (new URLSearchParams(location.search).has('manual')) return;
    const t = setTimeout(() => {
      setStarted(true);
      document.body.dataset.fxStart = '1';
    }, 350);
    return () => clearTimeout(t);
  }, []);
  if (!scene || !setup) return <p className="page">Нет сцены «{id}». Сцены: {scenes.map((x) => x.id).join(', ')}</p>;
  return <>
    {new URLSearchParams(location.search).has('manual') && !started && <button data-testid="fx-start" style={{position:'fixed',bottom:4,left:4,zIndex:10001}} onClick={() => {setStarted(true);document.body.dataset.fxStart='1';}}>Начать показ</button>}
    <SceneTable data={data} scene={scene} setup={setup} started={started} card={card} setCard={setCard} />
  </>;
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
  const perf = usePerf();
  const hitTest = new URLSearchParams(location.search).has('hitTest');
  const [paused, setPaused] = useState(false);
  const view = started ? setup.end : setup.start;
  // «&viewer=<ship>» (FX-B): the table as that ship's team sees it (e.g. «Кракен» on a target of the top row)
  const viewer = new URLSearchParams(location.search).get('viewer') ?? scene.viewer[0];
  const bottom = (data.ships.find((s) => s.code === viewer) ?? data.ships.find((s) => s.code === scene.viewer[0])!).side;
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
    paused,
    hold: paused,
  });
  // the scene is small: it draws all of itself with every snapshot of the queue
  useFxPart(fx, (x) => x);
  useTableBody('game');
  // FX-A (e2e): «&scarRate=20» runs the clock of the traces faster; window.__fxScars lets a test lay traces of its own.
  useEffect(() => {
    setScarTestRate(Number(new URLSearchParams(location.search).get('scarRate')) || 1);
    (window as unknown as { __fxScars: unknown }).__fxScars = {
      lay: (n: number, life: ScarLife = 'short') => {
        const host = document.querySelector('.fx-scars')!;
        for (let k = 0; k < n; k++) {
          const el = document.createElement('i');
          el.className = 'fx-hitmark';
          el.dataset.test = String(k);
          Object.assign(el.style, { left: `${40 + k * 40}px`, top: '200px', width: '32px', height: '24px' });
          host.appendChild(el);
          scar(el, life);
        }
      },
      /** A soot spot in the middle of the plank of this ship: it must ride with the ship when the places change. */
      layOn: (code: string, life: ScarLife = 'medium') => {
        const host = document.querySelector(`[data-fx-ship="${code}"] > .plank-scars`)!;
        const el = document.createElement('i');
        el.className = 'fx-hitmark';
        el.dataset.test = code;
        Object.assign(el.style, { left: 'calc(50% - 16px)', top: 'calc(50% - 12px)', width: '32px', height: '24px' });
        host.appendChild(el);
        scar(el, life, code);
      },
      clear: clearScars,
    };
    return () => setScarTestRate(1);
  }, []);
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
      buttons={hitTest ? [{key: 'volley', label: 'Залп · 1 П', testid: `probe-${x.code}`, onClick: () => { document.body.dataset.fxButton = x.code; }}] : []}
      role={null}
      onSelect={() => {}}
      onDetails={() => {}}
      onLegend={null}
    />
  );
  const seat = setup.handSeat;
  const shown = fx.display ? withDisplay(view, fx.display) : view;
  return (
    <div className={`game ${perf.classes}`} data-fx-busy={fx.busy ? '' : undefined} data-testid="game" data-bottom={bottom} data-fx-scene={scene.id}>
      {perf.config.enabled && <PerfPanel />}
      {hitTest && <div style={{position:'fixed',bottom:0,left:0,zIndex:10001}}><button data-testid="fx-pause" onClick={() => setPaused(!paused)}>Пауза</button><button data-testid="fx-finish" onClick={fx.skip}>До конца хода</button></div>}
      <TableThings />
      <main className="board" ref={boardRef}>
        <StatusBar s={shown} data={data} instruction={scene.title} fxHint={fx.hintStore} waiting={false} onSea={() => {}} extra={null} chip={!wideLog} hold={<TopHold side={top} s={tableView} data={data} fxGen={fx.gen} />} />
        <div className="sea-table" ref={seaRef}>
          <div className="sea-water" aria-hidden />
          <div className="planks top">{columns(top).map(renderPlank)}</div>
          <div className="middle" data-fx-gap>
            {/* «&strip=1»: the line «Последнее» of the game (e2e: nothing lies over it) */}
            {new URLSearchParams(location.search).get('strip') === '1' && <p className="middle-info" data-testid="middle-info">Последнее: «Жемчужина» откладывает 2 карты в План. Это длинная запись журнала, которую строка обрежет многоточием.</p>}
          </div>
          <div className="planks bottom">{columns(bottom).map(renderPlank)}</div>
        </div>
        {/* the bottom of the table for the weather and the darkening of FX (sea.ts tableCtx: the last row of the board) — the
            Hold of the bottom team stands beside the hand on a laptop now (V1c), this empty row keeps the old edge */}
        <div className="team-row table-edge" aria-hidden />
        <div className="board-bottom">
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
