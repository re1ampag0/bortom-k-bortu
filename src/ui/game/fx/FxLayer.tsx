// The animation layer on the table and its queue: the port of play / finish / skip / afterRender / keepSet of
// docs/mockups/anim/level1/page.js (PORTING.md, section 4). The planks are drawn from the displayed state D: it lags
// behind the real state, a clip plays → its events are applied to D → the table is drawn again. Buttons and «can I»
// checks always read the real state. The layer never takes input; a press on the table (not on the hand, not on the
// decision panel) shows the result at once.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { GameEvent, GameState } from '../../../engine/state';
import type { GameData, Side } from '../../../engine/types';
import { eventsFor, type Viewer } from '../../../engine/view';
import type { Speed } from '../../storage';
import type { Recent } from '../../../net/local';
import { speedFactor } from '../text';
import { applyVisible, displayFrom, displayRules, type Display } from './display';
import { CARD_SCENE, PLAY_MISC } from './misc';
import type { FxKind } from './planFx';
import { ABORT, wait, type FxCtx } from './primitives';
import { applyClip, applyQuiet, JUMP, logHiddenFrom, pendingFlags, planItem, plannerFor, skipAhead, type PlayClip, type QueueItem } from './queue';
import { tookPress } from '../InfoTip';
import { PLAY_LEGENDS } from './legends';
import { PLAY_SEA, renderWeather } from './sea';
import { PLAY_VOLLEY, VOLLEY_SCENE } from './volley';
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

export interface FxQueue {
  /** D while the queue plays; null — the table is drawn from the real state. */
  display: Display | null;
  /** Grows each time D changes: the parts the effects touched are built again (React keys). */
  gen: number;
  /** The line of the status bar while a clip plays. */
  hint: string | null;
  /** Flags of statuses by ship whose clip has not played yet: the chips wait hidden (pendingFlags). */
  hidden: Record<string, string[]>;
  /** The log lines of this action and the later ones wait for their clips (logHiddenFrom); null — none waits. */
  logFrom: number | null;
  busy: boolean;
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
  /** «Пауза» of P4: the clip on screen plays to its end, the next one waits for «Дальше». */
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
  const [gen, setGen] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);

  // The latest values for the loop (it lives across renders).
  const live = useRef({ view, speed, rich, data, bottom, own, hold, paused, myDecision, enabled });
  live.current = { view, speed, rich, data, bottom, own, hold, paused, myDecision, enabled };
  const waiters = useRef<(() => void)[]>([]);
  const wake = () => waiters.current.splice(0).forEach((w) => w());
  useEffect(wake, [hold, paused]);

  const bump = () => setGen((g) => g + 1);
  const makeCtx = (run: number, display?: Display): FxCtx | null => {
    const layer = layerRef.current;
    const board = layer?.parentElement;
    if (!layer || !board) return null;
    return {
      board,
      layer,
      display: display ?? D.current ?? base.current!,
      speed: speedFactor(live.current.speed),
      rich: live.current.rich,
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
        const p = structuredClone(D.current);
        for (const e of evs) applyVisible(p, e, rules);
        preview.current = p;
        flushSync(bump);
      },
    };
  };

  /** clearFx(keepSet()): the effects of the clip go, the scene of the Volley stays. */
  const clearFx = () => {
    const layer = layerRef.current;
    if (!layer) return;
    const keep = new Set(SCENES.flatMap((x) => x.keep()));
    for (const el of [...layer.children]) if (!keep.has(el)) el.remove();
  };
  /** resetFx: the layer is empty, the animations of the board are cancelled (the weather and CSS animations stay). */
  const resetFx = () => {
    const layer = layerRef.current;
    SCENES.forEach((x) => x.reset(layer?.parentElement ?? null));
    if (!layer) return;
    layer.innerHTML = '';
    const board = layer.parentElement!;
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
  const finish = useCallback(() => {
    RUN.current++;
    queue.current = [];
    D.current = null;
    preview.current = null;
    base.current = displayFrom(live.current.view);
    running.current = false;
    resetFx();
    setHint(null);
    setBusy(false);
    bump();
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loop = async () => {
    const run = ++RUN.current;
    running.current = true;
    setBusy(true);
    if (!D.current) D.current = structuredClone(base.current!);
    bump();
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
          await (PLAY[clip.kind] ?? PLAY.fallback)!(clip, ctx);
          if (run !== RUN.current) throw ABORT;
          // The displayed state catches up with the real one: the events of the clip in their order.
          applyClip(D.current!, item, clip, rules);
          preview.current = null;
          item.done++;
          clearFx();
          // The table from D at once, then the planks lose what the clip left on them: the reference draws new nodes.
          flushSync(bump);
          settlePlanks();
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
      setHint(null);
      setBusy(false);
      bump();
    } catch (e) {
      if (e !== ABORT) {
        console.error(e);
        if (run === RUN.current) finish();
      }
    }
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
        if (running.current || D.current) finish();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  // game (U1): the start of a new game, read once when the table opens. A planner of its own, so the real one does
  // not take in a sea card or a turn twice; n beyond any action, so no log line waits for it.
  const started = useRef(false);
  useLayoutEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!start || !start.sea || !enabled) return;
    const events: GameEvent[] = [
      { type: 'roundStarted', round: start.round },
      { type: 'seaRevealed', card: start.sea, reshuffled: false },
      { type: 'turnStarted', side: start.active },
    ];
    queue.current.push({ ...planItem(plannerFor(data, seats, null), Number.MAX_SAFE_INTEGER, events, null), done: 0, applied: false });
    if (!running.current) void loop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled && (running.current || D.current)) finish();
  }, [enabled, finish]);

  useEffect(() => {
    // A new device at the table (two people on one screen): another bottom, another planner.
    if (running.current || D.current) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottom]);

  useEffect(() => () => void RUN.current++, []);

  const skip = useCallback(() => {
    if (running.current || D.current) finish();
  }, [finish]);

  const press = useCallback(() => {
    if (running.current) finish();
  }, [finish]);

  return { display: D.current ? preview.current ?? D.current : null, gen, hint: D.current ? hint : null, hidden: D.current ? pendingFlags(queue.current) : {}, logFrom: D.current ? logHiddenFrom(queue.current) : null, busy, skip, press, layerRef, weatherRef, ctx: () => makeCtx(RUN.current),
    // game: the weather is off (empty) in «простые спецэффекты», with prefers-reduced-motion and at «мгновенно».
    weather: () => ({ ctx: makeCtx(RUN.current, preview.current ?? D.current ?? displayFrom(live.current.view)), on: live.current.enabled && live.current.rich }) };
}

/**
 * The layer: .fx-weather and .fx-layer, the last children of the board (.board, position: relative). Neither takes a
 * press. A press on the table while a clip plays shows the result at once (not on the hand, not on a decision panel).
 */
export function FxLayer({ fx }: { fx: FxQueue }) {
  useLayoutEffect(() => {
    // afterRender of the reference: React draws the classes of the planks again, the scene of the Volley puts its own back.
    const ctx = fx.ctx();
    if (ctx) SCENES.forEach((x) => x.afterRender(ctx));
  });
  const { press, layerRef, weatherRef } = fx;
  const drawWeather = () => {
    const w = fx.weather();
    if (w.ctx && weatherRef.current) renderWeather(w.ctx, weatherRef.current, w.on);
  };
  // The weather follows the table drawn (the sea card, the places of the ships): it is drawn again only when they change.
  useLayoutEffect(drawWeather);
  const redraw = useRef(drawWeather);
  redraw.current = drawWeather;
  useEffect(() => {
    // … and the size of the board.
    const board = layerRef.current?.parentElement;
    if (!board || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => redraw.current());
    ro.observe(board);
    return () => ro.disconnect();
  }, [layerRef]);
  useEffect(() => {
    // Always on: press() itself checks that a clip of the layer plays. Waiting for «busy» lost a press that came before
    // React ran the effect (the layer may draw within the same task the queue starts in).
    const board = layerRef.current?.parentElement;
    if (!board) return;
    const onPress = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest('[data-fx-hand], .dock')) return;
      // S1: a badge or a status chip that explains itself (and the press that closes its window) is not the table
      if (tookPress(e)) return;
      press();
    };
    board.addEventListener('pointerdown', onPress);
    return () => board.removeEventListener('pointerdown', onPress);
  }, [press, layerRef]);
  return (
    <>
      <div className="fx-weather" ref={fx.weatherRef} aria-hidden />
      <div className="fx-layer" ref={fx.layerRef} aria-hidden />
    </>
  );
}
