import {queueSceneWarm} from '../scene-window/idle';
import {prepareParticles, clearParticles, disposeParticles} from './particles';
import {createFxHint, type FxHintStore} from './hintStore';
import {getPerf, perfOff} from '../perf/state';
import {clipKind, clipShowEnd, clipShowStart, clipPause, perfWorkHook} from '../perf/clip';
// The animation layer on the table and its queue: the port of play / finish / skip / afterRender / keepSet of
// docs/mockups/anim/level1/page.js (PORTING.md, section 4). The planks are drawn from the displayed state D: it lags
// behind the real state, a clip plays → its events are applied to D → the table is drawn again. Buttons and «can I»
// checks always read the real state. The layer never takes input; a press on the table (not on the hand, not on the
// decision panel) shows the result at once.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { GameEvent, GameState } from '../../../engine/state';
import type { GameData, Side } from '../../../engine/types';
import { eventsFor, type Viewer } from '../../../engine/view';
import { saveFxError, type Speed } from '../../storage';
import type { Recent } from '../../../net/local';
import { speedFactor } from '../text';
import { applyVisible, displayFrom, displayRules, type Display } from './display';
import { CARD_SCENE, PLAY_MISC } from './misc';
import type { FxKind } from './planFx';
import {watchMedalGlints} from './medalIdle';
import {prepareTitleWidths,invalidateTitleWidths} from './legendTitles';
import {prepareArmadaSprites} from './armadaSprites';
import {releaseSprites, spritePause, disposeSprites} from './sprites';
import { ABORT, invalidateGeometry, particleDefs, flushClock, pauseClock, resumeClock, wait, type FxCtx } from './primitives';
import { applyClip, applyQuiet, JUMP, logHiddenFrom, pendingFlags, planItem, plannerFor, skipAhead, withDisplay, type PlayClip, type QueueItem } from './queue';
import { tookPress } from '../InfoTip';
import { trace, batchTrace } from './trace';
import { loadSettings, subscribeSettings } from '../../storage';
import { PLAY_LEGENDS,prepareLegendIntro,invalidateLegendIntro } from './legends';
import { dropPlates, setScarClock } from './scars';
import { PLAY_SEA, renderWeather } from './sea';
import { PLAY_VOLLEY, VOLLEY_SCENE, setDamagePlateVisibility } from './volley';
import './fx.css';

export type ClipPlayer = (c: PlayClip, ctx: FxCtx) => Promise<void>;

/**
 * The players of clips by kind (PLAY of the reference). The modules ported from the reference fill it: volley.ts
 * (A2), misc.ts (A3, A4), sea.ts, legends.ts (S1, L1). A clip with no player here plays PLAY.fallback (page.js).
 */
export const PLAY: Partial<Record<FxKind, ClipPlayer>> = {};

/** What a ported module keeps between clips and puts back after the table is drawn again (VS of the Volley …). */
export interface FxScene {
  /** Elements of the layer that live on between clips (keepSet). */
  keep: () => Element[];
  /** After the table is drawn again: classes and leans of the Volley back on the planks (afterRender). */
  afterRender: (ctx: FxCtx) => void;
  /** «Сразу итог»: everything kept is dropped, the frames it put on the planks go (resetFx). */
  reset: (board: HTMLElement | null) => void;
  /** A clip «turn» starts: the effects «till the end of the turn» go (the whirlpool of «Водоворот»). */
  onTurn: (ctx: FxCtx) => void;
  /** The scene is on the table (a Volley declared, not shot yet). */
  alive: () => boolean;
  /** An action is played to its end (page.js: the card at the middle fades once it resolved). */
  afterAction?: (ctx: FxCtx, item: { cardOpen: boolean }) => void;
  /** What still leaves the layer on its own (the card fading out): the show is over when it has gone. */
  settled?: () => Promise<void>;
}
export const SCENES: FxScene[] = [];

// The clips ported: the Volley (A2), the ships in motion (A3), the turn, the cards, the statuses … (A4), the sea (S1),
// the Legends (L1).
Object.assign(PLAY, PLAY_VOLLEY, PLAY_MISC, PLAY_SEA, PLAY_LEGENDS);
SCENES.push(VOLLEY_SCENE, CARD_SCENE);

interface Item extends QueueItem {
  /** The action shown; none for the start of a new game (U1), which has no action. */
  recent?: Recent;
  /** Clips already applied to D. */
  done: number;
  /** All the events of the action are in D. */
  applied: boolean;
}

/**
 * What the table shows while the queue plays, as one snapshot. Only the parts that draw it subscribe (useFxPart): a step
 * of a clip does not render the whole Game.
 */
export interface FxSnapshot {
  /** D while the queue plays; null — the table is drawn from the real state. */
  display: Display | null;
  /** Grows each time D changes: the parts the effects touched are built again (React keys). */
  gen: number;
  /** Grows when a show is cut off (skip, a press, Undo): every imperatively touched part is built again. */
  epoch: number;
  /** Flags of statuses by ship whose clip has not played yet: the chips wait hidden (pendingFlags). */
  hidden: Record<string, string[]>;
  /** The log lines of this action and the later ones wait for their clips (logHiddenFrom); null — none waits. */
  logFrom: number | null;
  busy: boolean;
}

export interface FxStore {
  get: () => FxSnapshot;
  subscribe: (listener: () => void) => () => void;
  set: (next: FxSnapshot) => void;
  cut: () => void;
  /** A state as it is shown: the displayed fields of the snapshot over the real one (cached by gen). */
  shown: (real: GameState) => GameState;
}

export interface FxQueue extends FxSnapshot {
  store: FxStore;
  /** The line of the status bar while a clip plays. */
  hintStore: FxHintStore;
  /** «Сразу итог»: D = the real state, the layer is cleared. */
  skip: () => void;
  /** A press on the table: the result at once, if a clip plays. */
  press: () => void;
  layerRef: RefObject<HTMLDivElement>;
  weatherRef: RefObject<HTMLDivElement>;
  /** A context for the current run (afterRender). */
  ctx: () => FxCtx | null;
  /** The quiet weather of the round (S1): the sea card of the table as it is drawn now, and whether it is drawn at all. */
  weather: () => { ctx: FxCtx | null; on: boolean };
}

export function useFxQueue({
  game,
  version,
  view,
  viewer,
  data,
  bottom,
  own,
  enabled,
  speed,
  rich,
  myDecision,
  jump = false,
  jumpAt = JUMP,
  paused,
  hold,
  start = null,
}: {
  game: { kind: 'local' | 'net'; recent: Recent[]; state: GameState };
  version: number;
  /** The real state as this device sees it. */
  view: GameState;
  viewer: Viewer;
  data: GameData;
  bottom: Side;
  /** The team at the bottom is played from this device (the banner «Ваш ход» of the clip «turn»). */
  own: boolean;
  /** Off at «мгновенно», «?speed=instant», prefers-reduced-motion, behind the curtain and after «До конца хода». */
  enabled: boolean;
  speed: Speed;
  rich: boolean;
  /** The game waits for this device: only the action that caused it is left. */
  myDecision: boolean;
  /** Back after a lost connection («Пока вас не было»): the actions that came are not replayed, only the last one. */
  jump?: boolean;
  /** So many actions at once are a jump too (JUMP); ?fxScene plays all the actions of its scene. */
  jumpAt?: number;
  /** A banner is up: the show waits for it. */
  paused: boolean;
  /** «Пауза» of P4: the clip on screen stops where it is, it and the next ones wait for «Дальше». */
  hold: boolean;
  /**
   * game (U1): a new game without actions — its first round, sea card and turn. They have no action of their own, so
   * the layer plays them as one when the table opens (the sea card with its weather, then the turn), not banners.
   */
  start?: { round: number; sea: string | null; active: Side } | null;
}): FxQueue {
  const [rules] = useState(() => displayRules(data));
  const seats = viewer === 'all' ? data.ships.filter((x) => x.side === bottom).map((x) => x.code) : viewer;
  const planner = useRef<{ bottom: Side; p: ReturnType<typeof plannerFor> } | null>(null);
  if (!planner.current || planner.current.bottom !== bottom) planner.current = { bottom, p: plannerFor(data, seats, game.state.sea?.current ?? null) };

  const shown = useRef((game.recent.at(-1)?.n ?? -1) + 1);
  const queue = useRef<Item[]>([]);
  /** The displayed state of the last action taken in, while the queue is empty. */
  const base = useRef<Display | null>(null);
  if (!base.current) base.current = displayFrom(view);
  const D = useRef<Display | null>(null);
  /** renderWith of a clip: D with some events of the clip applied, drawn instead of D until the clip ends. */
  const preview = useRef<Display | null>(null);
  const RUN = useRef(0);
  const running = useRef(false);
  const traceBatches = useRef(new Map<number, () => void>());
  useEffect(() => () => { traceBatches.current.forEach(end => end()); traceBatches.current.clear(); }, []);
  /** The clip on screen, for the journal of the layer (⚙ → «Журнал анимаций»). */
  const playing = useRef<string | null>(null);
  const [hintStore] = useState(createFxHint);
  const setHint = hintStore.set;
  // busy goes out with the next snapshot (every change of it is followed by bump)
  const busyNow = useRef(false);
  const setBusy = (v: boolean) => { busyNow.current = v; };
  const [store] = useState(createFxStore);
  const layerRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);
  const damageVisible = useRef<boolean | null>(null);
  if (damageVisible.current === null) damageVisible.current = loadSettings().view.damage !== 'hide';

  // The latest values for the loop (it lives across renders).
  const live = useRef({ view, speed, rich, data, bottom, own, hold, paused, myDecision, enabled });
  live.current = { view, speed, rich, data, bottom, own, hold, paused, myDecision, enabled };
  // FX-A: the traces dissolve by the clock of the show (its speed, «Пауза», a banner; half as long when «простые»)
  useEffect(() => setScarClock(() => ({ rate: 1 / speedFactor(live.current.speed), paused: live.current.hold || live.current.paused, rich: live.current.rich })), []);
  const waiters = useRef<(() => void)[]>([]);
  const wake = () => waiters.current.splice(0).forEach((w) => w());
  useEffect(wake, [hold, paused]);
  // «Пауза» of P4 stops the clip in the middle: its timers (at, wait) and its animations on the board stand still (the
  // background weather and plank CSS go on); «Дальше» goes on from there. The traces wait by the scar clock above.
  const frozen = useRef<Animation[]>([]);
  const freezeShow = useCallback(() => {
    const held = live.current.hold || live.current.paused || document.hidden;
    clipPause(held);
    const spriteBoard = layerRef.current?.parentElement;
    if (spriteBoard) spritePause(spriteBoard, held);
    if (!held) {
      frozen.current.splice(0).forEach((a) => a.playState === 'paused' && a.play());
      resumeClock();
      return;
    }
    pauseClock();
    const board = layerRef.current?.parentElement, weather = weatherRef.current;
    if (!board) return;
    for (const a of board.getAnimations({ subtree: true })) {
      if (a.playState !== 'running') continue;
      const target = (a.effect as KeyframeEffect | null)?.target;
      // The animated sea-card face belongs to this clip too. Its rain/cloud/lightning
      // use CSS; only CSS outside the clip layer (quiet weather/planks) keeps going.
      if ((a instanceof CSSAnimation || a instanceof CSSTransition) && (!target || !layerRef.current?.contains(target))) continue;
      if (weather && target && weather.contains(target)) continue;
      a.pause();
      frozen.current.push(a);
    }
  }, []);
  useEffect(freezeShow, [hold, paused, freezeShow]);
  useEffect(() => {
    document.addEventListener('visibilitychange', freezeShow);
    return () => document.removeEventListener('visibilitychange', freezeShow);
  }, [freezeShow]);

  /** The snapshot from the refs of the queue: D (or the renderWith preview), the waiting flags and log lines, busy. */
  const publish = (gen = store.get().gen) => store.set({
    display: D.current ? preview.current ?? D.current : null,
    gen,
    epoch: store.get().epoch,
    hidden: D.current ? pendingFlags(queue.current) : {},
    logFrom: D.current ? logHiddenFrom(queue.current) : null,
    busy: busyNow.current,
  });
  const bump = () => {
    const board = layerRef.current?.parentElement;
    if (board) invalidateGeometry(board);
    publish(store.get().gen + 1);
  };
  const makeCtx = (run: number, display?: Display): FxCtx | null => {
    const layer = layerRef.current;
    const board = layer?.parentElement;
    if (!layer || !board) return null;
    const richAtStart = live.current.rich;
    let narrow: boolean | undefined;
    return {
      board,
      layer,
      // read at the first animation of the clip, then kept for it
      get narrow() { return (narrow ??= board.ownerDocument.defaultView?.matchMedia('(max-width: 700px)').matches); },
      display: display ?? D.current ?? base.current!,
      // game: behind the game (more actions queued than the one on screen) the show catches up — twice as fast — instead
      // of dropping the clips (see skipAhead).
      speed: speedFactor(live.current.speed) * (queue.current.length > 1 ? 0.5 : 1),
      get showDamage() { return damageVisible.current !== false; },
      get rich() { return getPerf().enabled ? live.current.rich : richAtStart; },
      run,
      live: () => RUN.current,
      data: live.current.data,
      bottom: live.current.bottom,
      own: live.current.own,
      hint: (text) => {
        if (run === RUN.current) setHint(text);
      },
      renderWith: (evs) => {
        if (run !== RUN.current || !D.current) return;
        const perfEnd=perfWorkHook?.('renderWith');
        try {
        const p = structuredClone(D.current);
        for (const e of evs) applyVisible(p, e, rules);
        preview.current = p;
        flushSync(bump);
        invalidateGeometry(board);
        } finally {perfEnd?.();}
      },
    };
  };

  useLayoutEffect(() => subscribeSettings(settings => {
    const visible = settings.view.damage !== 'hide';
    if (visible === damageVisible.current) return;
    damageVisible.current = visible;
    const ctx = makeCtx(RUN.current);
    if (ctx) setDamagePlateVisibility(ctx, visible);
  }), []);

  /** clearFx(keepSet()): the effects of the clip go, the scene of the Volley stays. */
  const clearFx = () => {
    const layer = layerRef.current;
    if (!layer) return;
    const keep = new Set(SCENES.flatMap((x) => x.keep()));
    if (layer.parentElement) releaseSprites(layer.parentElement,false,keep);
    for (const el of [...layer.children]) if (!keep.has(el)) el.remove();
    layer.parentElement?.querySelectorAll(':scope > .fx-scars > .fx-temp').forEach((el) => el.remove());
    if (layer.parentElement) clearParticles(layer.parentElement);
  };
  /** resetFx: the layer is empty, the animations of the board are cancelled (the weather and CSS animations stay). */
  const resetFx = () => {
    const layer = layerRef.current;
    SCENES.forEach((x) => x.reset(layer?.parentElement ?? null));
    if (!layer) return;
    if (layer.parentElement) releaseSprites(layer.parentElement);
    if (layer.parentElement) clearParticles(layer.parentElement, true);
    layer.innerHTML = '';
    dropPlates();
    const board = layer.parentElement!;
    board.querySelectorAll(':scope > .fx-scars > .fx-temp').forEach((el) => el.remove());
    const weather = weatherRef.current;
    for (const a of board.getAnimations({ subtree: true })) {
      if (a instanceof CSSAnimation || a instanceof CSSTransition) continue;
      const target = (a.effect as KeyframeEffect | null)?.target;
      if (weather && target && weather.contains(target)) continue;
      a.cancel();
    }
    board.querySelectorAll<HTMLElement>('[data-fx-hand] [data-fx-card]').forEach((c) => (c.style.visibility = ''));
    board.querySelectorAll<HTMLElement>('[data-fx-ship]').forEach((p) => {
      p.classList.remove('hitframe');
      p.style.transform = '';
    });
  };

  /**
   * After a clip: the finished animations of the planks (fill 'forwards' — the tilt of a sinking ship, a Fire badge
   * fading out) are cancelled. The reference draws the table anew after each clip and they go with the old nodes; the
   * steady look is the class of the plank from D (.sunk, .submerged). CSS animations (the pulse of P2) stay.
   */
  const settlePlanks = () => {
    const board = layerRef.current?.parentElement;
    if (!board) return;
    for (const p of board.querySelectorAll('[data-fx-ship]')) {
      for (const a of p.getAnimations({ subtree: true })) {
        if (a instanceof CSSAnimation || a instanceof CSSTransition) continue;
        if (a.playState === 'finished') a.cancel();
      }
    }
  };

  /** Waits while «Пауза» or a banner holds the show; a new run (skip) ends the wait. */
  const gate = async (run: number) => {
    // Nothing plays while the show waits: the status bar gives the real line, not the hint of the clip before.
    if (run === RUN.current && (live.current.hold || live.current.paused)) setHint(null);
    while (run === RUN.current && (live.current.hold || live.current.paused)) await new Promise<void>((res) => waiters.current.push(res));
    if (run !== RUN.current) throw ABORT;
  };
  /** Everything still in the queue goes into D at once (its clips are not played). */
  const fastForward = (items: Item[]) => {
    if (!D.current) return;
    for (const it of items) {
      if (it.applied) continue;
      for (const c of it.clips.slice(it.done)) applyClip(D.current, it, c, rules);
      applyQuiet(D.current, it, rules);
      it.applied = true;
    }
  };

  /** finish of the reference: the table from the real state, the queue and the layer empty. */
  const finish = useCallback((why: string) => {
    if (running.current) trace(`⏹ показ прерван: ${why}${playing.current ? ` (шёл «${playing.current}»)` : ''}, в очереди ${queue.current.length}`);
    playing.current = null;
    RUN.current++;
    // the timers of the cut-off run end now (its wait() with ABORT), not when «Пауза» is lifted
    flushClock();
    queue.current = [];
    D.current = null;
    preview.current = null;
    base.current = displayFrom(live.current.view);
    running.current = false;
    resetFx();
    traceBatches.current.forEach(end => end());
    traceBatches.current.clear();
    setHint(null);
    setBusy(false);
    clipShowEnd();
    store.cut();
    bump();
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loop = async () => {
    const run = ++RUN.current;
    running.current = true;
    setBusy(true);
    clipShowStart();
    if (!D.current) D.current = structuredClone(base.current!);
    bump();
    const endTraceBatch = batchTrace();
    traceBatches.current.set(run, endTraceBatch);
    try {
      while (queue.current.length > 0) {
        await gate(run);
        // The table from D before a clip reads it (shownTrack, the places): the render asked by bump() may not have
        // come yet, and the table would still show the real state the new action brought (the reference draws at once).
        flushSync(bump);
        const item = queue.current[0];
        while (item.done < item.clips.length) {
          await gate(run);
          const clip = item.clips[item.done];
          const ctx = makeCtx(run);
          if (!ctx) throw ABORT;
          if (clip.kind === 'turn') SCENES.forEach((x) => x.onTurn(ctx));
          playing.current = clip.kind;
          clipKind(clip.kind);
          const t0 = performance.now();
          trace(`▶ ${clip.kind}${queue.current.length > 1 ? ` (догоняет, в очереди ${queue.current.length})` : ''}`);
          try {
            await (PLAY[clip.kind] ?? PLAY.fallback)!(clip, ctx);
            trace(`✓ ${clip.kind} ${((performance.now() - t0) / 1000).toFixed(1)} с`);
          } catch (err) {
            // game: a clip that breaks (an element missing on a phone, …) is skipped, not the whole show: its events
            // still go into D below, the next clips play. The error is kept for ⚙ → «Ошибки анимаций».
            if (err === ABORT) throw err;
            console.error(err);
            trace(`✗ ${clip.kind}: ${err instanceof Error ? err.message : String(err)}`);
            saveFxError({ at: new Date().toISOString(), clip: clip.kind, text: err instanceof Error ? `${err.message}\n${(err.stack ?? '').split('\n').slice(0, 3).join('\n')}` : String(err), width: ctx.board.clientWidth });
          }
          if (run !== RUN.current) throw ABORT;
          // The displayed state catches up with the real one: the events of the clip in their order.
          applyClip(D.current!, item, clip, rules);
          preview.current = null;
          item.done++;
          clearFx();
          // The table from D at once, then the planks lose what the clip left on them: the reference draws new nodes.
          const perfEnd=perfWorkHook?.('renderWith: итог клипа');
          try {flushSync(bump);settlePlanks();} finally {perfEnd?.();}
        }
        applyQuiet(D.current!, item, rules);
        item.applied = true;
        const ctx = makeCtx(run);
        if (ctx) SCENES.forEach((x) => x.afterAction?.(ctx, item));
        bump();
        queue.current.shift();
      }
      const ctx = makeCtx(run);
      if (ctx) await wait(ctx, 300);
      // the card at the middle fades for as long (300 ms): the show is over when it has left the layer
      await Promise.all(SCENES.map((x) => x.settled?.()));
      if (run !== RUN.current) return;
      // The queue is empty: D = the real state. The scene of an unfinished Volley stays (its shot comes later).
      base.current = displayFrom(live.current.view);
      D.current = null;
      preview.current = null;
      running.current = false;
      playing.current = null;
      setHint(null);
      setBusy(false);
      clipShowEnd();
      bump();
    } catch (e) {
      if (e !== ABORT) {
        console.error(e);
        trace(`✗ очередь: ${e instanceof Error ? e.message : String(e)}`);
        if (run === RUN.current) finish('ошибка очереди');
      }
    } finally { endTraceBatch(); traceBatches.current.delete(run); }
  };

  // New actions: each is fed to the planner and queued. A layout effect: D is set before the
  // browser paints, so the result the new action brought never flashes on the planks for a frame.
  useLayoutEffect(() => {
    const fresh = game.recent.filter((r) => r.n >= shown.current);
    if (fresh.length === 0) {
      const last = game.recent.at(-1)?.n ?? -1;
      if (last + 1 < shown.current) {
        // Undo: the actions shown are gone.
        shown.current = last + 1;
        if (running.current || D.current) finish('отмена хода');
      }
      if (!running.current) base.current = displayFrom(view);
      return;
    }
    shown.current = fresh.at(-1)!.n + 1;
    const items: Item[] = fresh.map((r) => ({
      ...planItem(planner.current!.p, r.n, game.kind === 'local' ? eventsFor(game.state, viewer, r.events) : r.events, r.action),
      recent: r,
      done: 0,
      applied: false,
    }));
    if (!enabled) {
      // No animations (prefers-reduced-motion, «мгновенно», the curtain, «До конца хода»): the planner has seen the
      // actions (a Volley declared now is known at its shot), the table is at once in the real state.
      base.current = displayFrom(view);
      return;
    }
    queue.current.push(...items);
    if (skipAhead(queue.current.length, myDecision, jump || fresh.length >= jumpAt)) {
      trace(`⏭ пропущено действий: ${queue.current.length - 1} (${jump ? 'возврат после потери связи' : `пришло сразу ${fresh.length}`})${playing.current ? `, оборван «${playing.current}»` : ''}`);
      // The decision of this device is not delayed, a return after a lost connection is not replayed: only the last
      // action is left, the rest goes into D (its log lines and statuses are shown at once).
      if (!D.current) D.current = structuredClone(base.current!);
      fastForward(queue.current.slice(0, -1));
      queue.current = queue.current.slice(-1);
      if (running.current) {
        RUN.current++;
        running.current = false;
        preview.current = null;
        resetFx();
        wake();
      }
    }
    if (!running.current) void loop();
    // the new actions wait in the queue: their status chips and log lines are hidden before the browser paints
    else publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  // game (U1): the start of a new game, read when the table opens. A planner of its own, so the real one does not take
  // in a sea card or a turn twice; n beyond any action, so no log line waits for it. The cleanup takes the item back
  // and stops its run: StrictMode (dev, e2e) mounts the table twice, and a run left behind would keep the queue busy.
  useLayoutEffect(() => {
    if (!start || !start.sea || !enabled) return;
    const events: GameEvent[] = [
      { type: 'roundStarted', round: start.round },
      { type: 'seaRevealed', card: start.sea, reshuffled: false },
      { type: 'turnStarted', side: start.active },
    ];
    const item: Item = { ...planItem(plannerFor(data, seats, null), Number.MAX_SAFE_INTEGER, events, null), done: 0, applied: false };
    queue.current.push(item);
    if (!running.current) void loop();
    return () => {
      if (!queue.current.includes(item)) return;
      queue.current = queue.current.filter((x) => x !== item);
      RUN.current++;
      running.current = false;
      D.current = null;
      preview.current = null;
      wake();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled && (running.current || D.current)) finish('анимации выключены (скорость, «До конца хода», шторка)');
  }, [enabled, finish]);

  // A new device at the table (two people on one screen): another bottom, another planner. Only on a change of the
  // bottom — not when the table opens, or it would drop the show of the start of a new game at once (U1).
  const lastBottom = useRef(bottom);
  useEffect(() => {
    if (lastBottom.current === bottom) return;
    lastBottom.current = bottom;
    if (running.current || D.current) finish('за устройство сел другой игрок');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottom]);

  useEffect(() => () => void RUN.current++, []);

  const skip = useCallback(() => {
    if (running.current || D.current) finish('кнопка «Быстрее» / «До конца хода»');
  }, [finish]);

  const press = useCallback(() => {
    dropPlates();
    if (running.current) finish('нажатие по столу');
  }, [finish]);

  return { ...store.get(), store, hintStore, skip, press, layerRef, weatherRef, ctx: () => makeCtx(RUN.current),
    // game: the weather is off (empty) with prefers-reduced-motion and at «мгновенно»; FX-C: in «простые спецэффекты»
    // it stands still (ctx.rich = false).
    weather: () => ({ ctx: makeCtx(RUN.current, preview.current ?? D.current ?? displayFrom(live.current.view)), on: live.current.enabled }) };
}

function createFxStore(): FxStore {
  let snap: FxSnapshot = { display: null, gen: 0, epoch: 0, hidden: {}, logFrom: null, busy: false };
  const listeners = new Set<() => void>();
  let cache: { real: GameState; gen: number; display: Display; out: GameState } | null = null;
  return {
    get: () => snap,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    set: (next) => { snap = next; listeners.forEach((fn) => fn()); },
    cut: () => { snap = { ...snap, epoch: snap.epoch + 1 }; },
    // D is changed in place between gens: the cache is keyed by gen, never by the identity of D alone.
    shown: (real) => {
      const d = snap.display;
      if (!d) return real;
      if (!cache || cache.real !== real || cache.gen !== snap.gen || cache.display !== d) cache = { real, gen: snap.gen, display: d, out: withDisplay(real, d) };
      return cache.out;
    },
  };
}

/** A part of the table drawn from the shown state subscribes to what it needs of the snapshot (a primitive or a field). */
export function useFxPart<T>(fx: FxQueue, pick: (s: FxSnapshot) => T): T {
  const get = () => pick(fx.store.get());
  return useSyncExternalStore(fx.store.subscribe, get, get);
}

/**
 * The layer: .fx-weather, .fx-scars and .fx-layer, the last children of the board (.board, position: relative). Neither takes a
 * press. A press on the table while a clip plays shows the result at once (not on the hand, not on a decision panel).
 */
export function FxLayer({ fx }: { fx: FxQueue }) {
  // Drawn again with every snapshot, in the same commit as the planks it follows (afterRender, the weather).
  const busy = useFxPart(fx, (x) => x).busy;
  useLayoutEffect(() => {
    // afterRender of the reference: React draws the classes of the planks again, the scene of the Volley puts its own back.
    const ctx = fx.ctx();
    if (ctx) SCENES.forEach((x) => x.afterRender(ctx));
  });
  const { press, layerRef, weatherRef } = fx;
  useLayoutEffect(() => {
    const board = layerRef.current?.parentElement;
    if (!board) return;
    const warm = () => {
      const ctx = fx.ctx();
      if (ctx && !board.closest('.game[data-fx-busy]')) { prepareTitleWidths(ctx); void queueSceneWarm(async()=>{if(board.isConnected&&!board.closest('.game[data-fx-busy]')){prepareArmadaSprites(ctx);prepareLegendIntro(ctx);}}); prepareParticles(board, innerWidth>700?particleDefs(true):undefined); }
    };
    const stopGlints=watchMedalGlints(board);
    warm();
    let alive=true;
    const refresh=()=>{if(!alive)return;invalidateGeometry(board);invalidateTitleWidths(board);invalidateLegendIntro(board);warm();};
    const ro = new ResizeObserver(refresh);ro.observe(board);
    window.addEventListener('resize',refresh);
    const game=board.closest('.game');
    const view=()=>[...(game?.classList??[])].filter(c=>c.startsWith('view-')||c.startsWith('frame-')).join(' ');
    let previous=view();
    const mo=new MutationObserver(()=>{const next=view();if(next!==previous){previous=next;refresh();}});
    if(game)mo.observe(game,{attributes:true,attributeFilter:['class']});
    void board.ownerDocument.fonts?.ready.then(refresh);
    board.ownerDocument.fonts?.addEventListener('loadingdone',refresh);
    return () => {alive=false;stopGlints();ro.disconnect();mo.disconnect();window.removeEventListener('resize',refresh);board.ownerDocument.fonts?.removeEventListener('loadingdone',refresh);invalidateTitleWidths(board);invalidateLegendIntro(board);invalidateGeometry(board);disposeParticles(board);disposeSprites(board);};
  }, [layerRef]);
  useLayoutEffect(() => {const ctx=fx.ctx();if(ctx&&!busy){prepareTitleWidths(ctx);void queueSceneWarm(async()=>{if(ctx.board.isConnected&&!ctx.board.closest('.game[data-fx-busy]')){prepareArmadaSprites(ctx);prepareLegendIntro(ctx);}});}}, [busy]);
  useLayoutEffect(() => {
    // The breakdown plate of a Volley is up (in the layer or left in the traces): data-fx-plate on the board hides the line
    // «Последнее: …» (fx.css). Only the direct children of the two hosts are watched — no :has over the whole board.
    const board = layerRef.current?.parentElement, scars = board?.querySelector(':scope > .fx-scars');
    if (!board || !layerRef.current || typeof MutationObserver === 'undefined') return;
    const sync = () => board.toggleAttribute('data-fx-plate', !!board.querySelector(':scope > .fx-layer > .plate, :scope > .fx-scars > .plate'));
    const mo = new MutationObserver(sync);
    mo.observe(layerRef.current, { childList: true });
    if (scars) mo.observe(scars, { childList: true });
    sync();
    return () => mo.disconnect();
  }, [layerRef]);
  const drawWeather = () => {
    const w = fx.weather();
    if (w.ctx && weatherRef.current) renderWeather(w.ctx, weatherRef.current, w.on);
  };
  // The weather follows the table drawn (the sea card, the places of the ships): it is drawn again only when they change.
  // Its own check reads the size of the board — a forced layout right after the commit — so it runs only when the
  // inputs it shows change; a change of the size comes through the observer below.
  const w = fx.weather(), wd = w.ctx?.display;
  const weatherKey = wd ? `${w.on}|${w.ctx!.rich}|${perfOff('weather')}|${wd.sea}|${Object.keys(wd.ships).map((c) => wd.ships[c].pos + (wd.ships[c].sunk ? 's' : '')).join('')}` : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(drawWeather, [weatherKey]);
  const redraw = useRef(drawWeather);
  redraw.current = drawWeather;
  useEffect(() => {
    // … and the size of the board, of the sea between the rows and of the planks: the glow of «Ясное небо» is masked by the
    // planks and its glints keep clear of them, so a plank that grows or shrinks (its buttons, a badge, an open sheet) while
    // the board keeps its size must draw the weather again. Positions of planks follow the sizes of these boxes.
    const board = layerRef.current?.parentElement;
    if (!board || typeof ResizeObserver === 'undefined') return;
    // A sheet that opens or a plank that grows moves the table at the moment of the press: the weather is drawn again a
    // little later (once the boxes settle), not in that frame — the sea under the planks may lag for a blink.
    let timer = 0;
    const ro = new ResizeObserver(() => { clearTimeout(timer); timer = window.setTimeout(() => redraw.current(), 250); });
    ro.observe(board);
    board.querySelectorAll('[data-fx-gap], [data-fx-ship]').forEach((el) => ro.observe(el));
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [layerRef, weatherKey]);
  useEffect(() => {
    // Always on: press() itself checks that a clip of the layer plays. Waiting for «busy» lost a press that came before
    // React ran the effect (the layer may draw within the same task the queue starts in).
    const board = layerRef.current?.parentElement;
    if (!board) return;
    // game: a tap — a press let go where it began, soon — not any touch: on a phone a finger that scrolls the table or
    // the hand, or rests on the screen, ended the show at once and the clips seemed to break off.
    let down: { id: number; x: number; y: number; at: number } | null = null;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      // S1: a badge or a status chip that explains itself (and the press that closes its window) is not the table; nor a line of a
      // card in the plate of a Volley (fix-ui: a tap shows the card)
      down = t?.closest('[data-fx-hand], .dock, .plate [data-card], [data-testid="settings-btn"]') || tookPress(e) ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp };
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || d.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || e.timeStamp - d.at > 700) return;
      // a finger skips the show only with ⚙ → «Пропуск анимации касанием» (off by default); a mouse click always does
      if (e.pointerType === 'touch' && !loadSettings().tapSkip) return;
      press();
    };
    const onCancel = () => {
      down = null;
    };
    board.addEventListener('pointerdown', onDown);
    board.addEventListener('pointerup', onUp);
    board.addEventListener('pointercancel', onCancel);
    return () => {
      board.removeEventListener('pointerdown', onDown);
      board.removeEventListener('pointerup', onUp);
      board.removeEventListener('pointercancel', onCancel);
    };
  }, [press, layerRef]);
  return (
    <>
      <div className={`fx-weather${busy ? ' wx-paused' : ''}`} ref={fx.weatherRef} aria-hidden />
      {/* FX-A: the traces on the sea (fx/scars.ts) — over the weather, under the planks; the layer never clears it */}
      <div className="fx-scars" aria-hidden />
      <div className="fx-layer" ref={fx.layerRef} aria-hidden />
    </>
  );
}
