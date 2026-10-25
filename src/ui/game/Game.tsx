// The table on one screen: who sits at the device, what they see (viewFor), what is expected from them, and the
// bots moving one action at a time. The engine answers every question about the rules (hints.ts).
import { cloneElement, isValidElement, lazy, memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  abilityButtons,
  cardNeeds,
  hasUsefulMoves,
  heartTargets,
  legendOptions,
  playOptions,
  previewReaction,
  previewVolley,
  reactionNow,
  refusal,
  tryAction,
  unfiredShips,
  volleyTargets,
  type VolleyTarget,
} from '../../engine/hints';
import { sideGenitive, turnSummary } from '../../engine/log';
import type { MatchRecord, MatchSetup } from '../../engine/match';
import { createRng } from '../../engine/rng';
import { ABILITY, cardByCode, hasAbility, isCaptain, seaCardByCode, seatShip, seatsOf, shipData, type Action, type GameState } from '../../engine/state';
import type { Side } from '../../engine/types';
import { HIDDEN, viewFor } from '../../engine/view';
import type { LocalGame } from '../../net/local';
import type { NetGame } from '../../net/ws';
import { download, loadSettings, storeSave, storeSettings, type Speed } from '../storage';
import { Curtain } from './Curtain';
import { AlarmActions, AlarmArrow, AlarmBar, ReactionSheet, usePhoneLayout } from './Alarm';
import { alarmInfo, lossOf, reactionStrip } from './alarm';
import { Hand, type AlarmCard, type HandTab, type LiftActions } from './Hand';
import { LogBook } from './LogBook';
import { CardDetail, ConfirmSheet, DiscardSheet, LogList, RulesSheet, Sheet as SheetBox, SeaSheet, SettingsSheet, ShipSheet } from './Overlays';
import {
  CardParamsPanel,
  ChoicePanel,
  ConfirmPanel,
  JackPanel,
  PlansPanel,
  ReactionWaitPanel,
  TortugaPanel,
  ChargeButtons,
  ChargeSheet,
  chargeCandidates,
  plateLabel,
  volleyOrder,
  type AimMode,
  type CardMode,
} from './Panels';
import { MissedSheet, missedLines, NetBar, OfferPanel, netDock } from './NetParts';
import { BannerView, useBanners } from './Banners';
import { instantUrl, reducedMotion } from '../start/motion';
import {prepareInfoWindows} from './scene-window/loadWindows';
import { FxLayer, useFxPart, useFxQueue, type FxQueue, type FxSnapshot } from './fx/FxLayer';
import { T } from './fx/timing';
import { playTurnSound } from '../sound';
import { Button, OakButton, Plank, RoundButton, ROUND_ICON, SeaChip, StatusBar, TeamRow, TopHold, useWideLog, type Btn, type Plate } from './Table';
import { TableBackdrop, useSeaClip } from './TableThings';
import { enemyTurnLines } from './lastTurn';
import { decideVerb, reactionWait } from './clarity';
import { SIDE_LABEL, SPEEDS } from './text';
import { usePlayClock } from './playClock';
import { useTableBody } from './tableBody';
import {PerfPanel, usePerf} from './perf/PerfPanel';
import {getPerf} from './perf/state';
import {clipRender} from './perf/clip';
import {pressOpen, pressRender} from './perf/press';

/** V7: the victory sheet is a chunk of its own (the big ships of its panorama). */
const Victory = lazy(() => import('./Victory').then((m) => ({ default: m.Victory })));

type Mode =
  | { k: 'idle' }
  | AimMode
  | CardMode
  | { k: 'legend'; seat: string; target: string | null; confirmed: boolean }
  | { k: 'confirmEnd'; text: string }
  | { k: 'plans'; seat: string }
  | { k: 'concede'; side: Side }
  /** By network: leave the room. */
  | { k: 'exitRoom' }
  | { k: 'leave' }
  /** «Ход окончен» pressed: the turn passes in 3 s unless cancelled. */
  | { k: 'ending'; action: Action };

type Sheet =
  | null
  | { k: 'card'; seat: string; code: string }
  /** A card opened to read (from the log): no status, no buttons. */
  | { k: 'info'; code: string; back?: 'log' | 'lastTurn' }
  | { k: 'ship'; code: string }
  | { k: 'discard'; seat: string }
  | { k: 'sea'; code?: string; back?: 'log' | 'lastTurn' }
  | { k: 'log' }
  /** «Подробнее» of the turn summary: the log of the enemy's last turn. */
  | { k: 'lastTurn' }
  | { k: 'rules' }
  | { k: 'settings' };

const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];
/** A plank without buttons: one array, so the memo of the plank sees no change. */
const NO_BUTTONS: Btn[] = [];
const other = (side: Side): Side => (side === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ');

/** «?speed=instant» in the address: bots without pauses (for the browser test). */
function urlSpeed(): Speed | null {
  const v = new URLSearchParams(location.search).get('speed');
  return v === '0' || v === 'instant' ? 'instant' : v && v in SPEEDS ? (v as Speed) : null;
}

export function Game({
  game,
  onExit,
  onRestart,
}: {
  game: LocalGame | NetGame;
  onExit: () => void;
  onRestart: (setup: MatchSetup) => void;
}) {
  // ?perf=1: how long a render of the table takes (render + commit, up to the layout effect); off — no clock at all
  const perfT0 = getPerf().enabled ? performance.now() : 0;
  useLayoutEffect(() => { if (perfT0) clipRender(performance.now() - perfT0); });
  const version = useSyncExternalStore(
    useCallback((cb) => game.subscribe(cb), [game]),
    () => game.version,
  );
  const perf = usePerf();
  const simpleFx = perf.config.enabled && perf.config.off.includes('simple');
  const data = game.data;
  const s = game.state;
  // By network the state is already the player's view, the server plays the bots and keeps the game.
  const net = game.kind === 'net' ? game : null;
  const local = game.kind === 'local' ? game : null;
  const [speed, setSpeedState] = useState<Speed>(() => urlSpeed() ?? loadSettings().speed);
  const setSpeed = (v: Speed) => {
    setSpeedState(v);
    storeSettings({ ...loadSettings(), speed: v });
  };
  const [effects, setEffectsState] = useState(() => loadSettings().effects);
  const setEffects = (v: 'rich' | 'simple') => {
    setEffectsState(v);
    storeSettings({ ...loadSettings(), effects: v });
  };
  const [look, setLook] = useState(() => loadSettings().view);
  const [sound, setSoundState] = useState(() => loadSettings().sound);
  const setSound = (v: boolean) => {
    setSoundState(v);
    storeSettings({ ...loadSettings(), sound: v });
  };
  const [fastEnd, setFastEndState] = useState(() => loadSettings().fastEnd);
  const setFastEnd = (v: boolean) => {
    setFastEndState(v);
    storeSettings({ ...loadSettings(), fastEnd: v });
  };
  /** «Ход окончен · Отменить»: 3 s, or 1 s with «Быстрый конец хода». */
  const endMs = fastEnd ? 1000 : 3000;
  const [openHands, setOpenHands] = useState(game.setup.openHands);
  // «Подсказки» off — «как за столом»: no damage before choosing, no green «Ход окончен», no «Залп не дан…».
  const [hintsChoice, setHintsState] = useState(net ? (loadSettings().hints ?? false) : (game.setup.hints ?? false));
  // «Подсказки» by network: each player's own setting, if the room allows them.
  const hintsAllowed = !net || net.room.settings.hints;
  const hints = hintsAllowed && hintsChoice;
  const setHints = (v: boolean) => {
    setHintsState(v);
    storeSettings({ ...loadSettings(), hints: v });
  };
  const humans = SIDES.filter((side) => game.setup.players[side] === 'human');
  const d = game.decider();
  /** A bot plays the seat: on one screen a whole team, by network one ship. */
  const botSeat = (seat: string) => (net ? net.isBotSeat(seat) : local!.isBot(s.ships[seat].side));
  const botSide = (side: Side) => (net ? Object.values(s.ships).filter((x) => x.side === side).every((x) => net.isBotSeat(x.code)) : local!.isBot(side));

  // ——— Who sits at the device ———
  const [device, setDevice] = useState<Side | null>(humans.length === 1 ? humans[0] : null);
  const [seen, setSeen] = useState<Record<Side, number>>({ ПИРАТЫ: 0, КОМПАНИЯ: 0 });
  const curtainSide = local && humans.length === 2 && !openHands && d && !s.winner && d.side !== device ? d.side : null;
  const bottom: Side = net
    ? (net.side ?? 'ПИРАТЫ')
    : humans.length === 2
      ? openHands
        ? (d?.side ?? device ?? 'ПИРАТЫ')
        : (device ?? d?.side ?? 'ПИРАТЫ')
      : (humans[0] ?? 'ПИРАТЫ');
  const viewer = openHands || humans.length === 0 ? ('all' as const) : Object.values(s.ships).filter((x) => x.side === bottom).map((x) => x.code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const view = useMemo(() => e2eHand(net ? s : viewFor(s, viewer)), [version, bottom, openHands]);
  /** Seats played from this device: on one screen the team at the device, by network the player's own ships. */
  const mySeats = seatsOf(s, bottom)
    .map((x) => x.code)
    .filter((x) => !net || net.seats.includes(x));
  /** By network each player ends the turn for their ships: then the turn waits for the ally. */
  const iAmDone = !!net && mySeats.length > 0 && mySeats.every((x) => net.ready.includes(x));
  const myDecision = net
    ? !!d && !s.winner && (d.kind === 'turn' ? d.side === bottom && mySeats.length > 0 && !iAmDone : d.seats.some((x) => mySeats.includes(x)))
    : !!d && d.side === bottom && !local!.isBot(bottom) && !curtainSide;
  const myTurn = myDecision && d!.kind === 'turn';
  /** The seats whose decision the game waits for from this device. */
  const myDeciding = d ? d.seats.filter((x) => mySeats.includes(x)) : [];

  // ——— The captain of a sunk ship (RULES.md 17.3): by network the ally's person fires, the captain offers (P6) ———
  const offers = net?.offers ?? [];
  /** Another person plays the captain's ally ship: the captain offers the Charge instead of firing the Volley. */
  const mustOffer = (x: string) => {
    if (!net || !isCaptain(s, x)) return false;
    const ally = seatShip(s, x)!.code;
    return !mySeats.includes(ally) && !net.isBotSeat(ally);
  };
  const offerOf = (x: string) => offers.find((o) => o.from === x) ?? null;
  /** A Charge of this hand may go into the shooter's Volley: an own hand, or offered by another person's captain. */
  const chargeOk = (holder: string, card: string, shooter: string) =>
    !net || mySeats.includes(holder) || offers.some((o) => o.from === holder && o.card === card && o.to === shooter);
  // The Reaction chosen in the hand while the window is open (phone: the panel has only «Пропустить» and «Сыграть»).
  const [reactPickRaw, setReactPick] = useState<{ seat: string; card: string } | null>(null);
  const reactPick =
    reactPickRaw && myDecision && d!.kind === 'reactions' && d!.seats.includes(reactPickRaw.seat) &&
    [...s.ships[reactPickRaw.seat].hand, ...s.ships[reactPickRaw.seat].plans].includes(reactPickRaw.card)
      ? reactPickRaw
      : null;
  // The note «Реакция — карта…» in the first Reaction window of each team at the device; a window offered again
  // after a Reaction (RULES.md 12.5) is the same one. Not saved: after a reload it shows once more.
  const reactOpen = myDecision && d!.kind === 'reactions';
  // ?perf=1: «Тревога!» opens without a press of this device (the enemy's Volley) — its own window «нажатие», from this render
  useLayoutEffect(() => {
    if (!perfT0 || !reactOpen) return;
    pressOpen('«Тревога!» открылась', perfT0);
    pressRender(performance.now() - perfT0);
  }, [reactOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  // «Тревога!»: «Свернуть, посмотреть стол» lowers the hand and hides the buttons; it opens again with the next window.
  const [alarmFolded, setAlarmFolded] = useState(false);
  useEffect(() => {
    if (!reactOpen) setAlarmFolded(false);
  }, [reactOpen]);
  const phone = usePhoneLayout();
  // fix-ui: a phone — the height of the bottom bar (--bar-h): the sheet of «Тревога!» stands over it, not under it.
  // ui-press: on the board (its readers — the sheet and the row of the hand — are in it), from the observer's own size (no
  // read of the layout in the frame of a press), written only when it changes; subscribed again when the table comes back
  // from behind the curtain (not at every opening of «Тревога!»)
  useEffect(() => {
    if (!phone) return;
    const bar = document.querySelector<HTMLElement>('.game > .bottom-bar');
    const board = bar?.parentElement?.querySelector<HTMLElement>(':scope > .board');
    if (!bar || !board || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const h = `${Math.round(e.borderBoxSize?.[0]?.blockSize ?? (e.target as HTMLElement).offsetHeight)}px`;
      if (board.style.getPropertyValue('--bar-h') !== h) board.style.setProperty('--bar-h', h);
    });
    ro.observe(bar);
    return () => ro.disconnect();
  }, [phone, !!curtainSide]); // eslint-disable-line react-hooks/exhaustive-deps
  const [memoSeen, setMemoSeen] = useState<Side[]>([]);
  const [memoSide, setMemoSide] = useState<Side | null>(null);
  useEffect(() => {
    if (reactOpen) setMemoSide(bottom);
    else if (memoSide) {
      setMemoSeen((seen) => (seen.includes(memoSide) ? seen : [...seen, memoSide]));
      setMemoSide(null);
    }
  }, [reactOpen, bottom, memoSide]);

  // ——— Interface state ———
  const [mode, setMode] = useState<Mode>({ k: 'idle' });
  const [endSeconds, setEndSeconds] = useState(endMs / 1000);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [fastTurn, setFastTurn] = useState<string | null>(null);
  /** «Пауза»: the show on this device stops; on one screen the bots wait too (by network the server plays them). */
  const [held, setHeld] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // V7: the minutes of the game (this device counts them) and the record for the numbers of the victory sheet
  const clockId = `${net ? `net:${net.room.code}` : 'local'}:${game.setup.game.seed}`;
  // a game that starts now (not one loaded half-way): its clock starts at 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const freshGame = useMemo(() => (local ? local.actions.length === 0 : s.round === 1), [clockId]);
  const playMs = usePlayClock(clockId, freshGame, !s.winner);
  const [netRecord, setNetRecord] = useState<MatchRecord | null>(null);
  useEffect(() => {
    if (net && s.winner) net.requestRecord(setNetRecord);
    else setNetRecord(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net, !!s.winner, game.setup.game.seed]);
  const actionsAtEnd = local?.actions.length ?? 0;
  const endRecord = useMemo(
    () => (s.winner ? (local ? { setup: local.setup, actions: local.actions.slice() } : netRecord) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!s.winner, actionsAtEnd, netRecord, local],
  );
  const allSeats = Object.values(s.ships).filter((x) => x.side === bottom).map((x) => x.code);
  const [seatPick, setSeatPick] = useState<string | null>(null);
  const seat = seatPick && allSeats.includes(seatPick) ? seatPick : (d && d.side === bottom ? d.seats.find((x) => mySeats.includes(x)) : null) ?? mySeats[0] ?? allSeats[0];

  const act = (action: Action | Action[], { preserveSheet = false } = {}): boolean => {
    const list = Array.isArray(action) ? action : [action];
    // By network «Ход окончен» of a player is a message: the turn ends when the ally pressed it too.
    if (net && list[0].type === 'endTurn') {
      net.setReady(true, list[0].plans);
      setMode({ k: 'idle' });
      return true;
    }
    for (const a of list) {
      const why = game.act(a);
      if (why) {
        // A later part of a multi-answer may become unneeded (the window closed): only the first refusal matters.
        if (a === list[0]) {
          setFlash(why);
          return false;
        }
        break;
      }
    }
    setFlash(null);
    setMode({ k: 'idle' });
    if (!preserveSheet) setSheet(null);
    return true;
  };

  // ——— Effects: bots, autosave, title, toast, wake lock ———
  const turnKey = `${s.round}:${s.active}`;
  // Banners one after another: the sea card, «Ваш ход», the summary of the start of the turn (docs/TZ.md, п. 2).
  const mineBottom = net ? mySeats.length > 0 : game.setup.players[bottom] === 'human';
  // The animation layer plays the actions (A2–A4): off at «мгновенно», after «До конца хода», behind the curtain and
  // with prefers-reduced-motion — then the table is at once in the real state.
  const fxEnabled = speed !== 'instant' && !instantUrl() && fastTurn !== turnKey && !curtainSide && !reducedMotion();
  /** A game without actions yet: its first sea card and first turn are shown when the table opens (read once). */
  const newGame = (net ? net.actions : local!.actions.length) === 0 && !s.winner;
  const banner = useBanners({
    recent: game.recent,
    version,
    bottom,
    mine: mineBottom,
    enabled: speed !== 'instant' && !instantUrl(),
    // «Ваш ход» is drawn by the clip «turn» while the layer plays; the banner of its own — only without the layer.
    turnBanners: !fxEnabled,
    // The sea card of a new round is shown by the clip «sea»; the banner — only without the layer (no two shows).
    seaBanners: !fxEnabled,
    // A new game: the first sea card and the first turn too — as banners only without the layer (U1: the layer plays
    // them as clips, see fx below).
    start: newGame && !fxEnabled ? { sea: s.sea?.current ?? null, active: s.active } : null,
    paused: !!curtainSide,
  });
  // The animation layer on the table (A2–A4): every action is shown by its clips, the planks are drawn from the
  // displayed state while they play; the bots wait for it.
  const fx = useFxQueue({
    game,
    version,
    view,
    viewer,
    data,
    bottom,
    own: mineBottom,
    enabled: fxEnabled,
    speed,
    rich: effects === 'rich' && !simpleFx,
    myDecision,
    // Back after a lost connection: «Пока вас не было» tells what happened, the table does not replay it.
    jump: !!net && net.missed.length > 0,
    paused: !!banner,
    hold: held,
    start: newGame ? { round: s.round, sea: s.sea?.current ?? null, active: s.active } : null,
  });
  // The table, the log and the Hold as they are shown, and «busy», are read by the parts that draw them (useFxPart):
  // a step of a clip renders those parts, not Game. The bots and the show buttons follow «busy» the same way.
  /** A bot decides now (the show of the layer adds to it: see botBusyOf). */
  const botTurn = !!local && !!d && local.isBot(d.side) && !s.winner;
  const botBusyOf = (busy: boolean) => botTurn || busy;
  // The pause never keeps a decision of this device waiting: it ends as soon as the game asks the player.
  const canHoldOf = (busy: boolean) => botBusyOf(busy) && !myDecision;
  /** data-fx-busy on the root, set from the snapshot: the CSS of the show follows it without a render of Game. */
  const gameRef = useBusyAttr(fx);
  useEffect(()=>{
    let alive=true,idle:number|undefined,timer:number|undefined;
    const warm=()=>{
      if(!alive)return;
      if(fx.store.get().busy){timer=window.setTimeout(schedule,500);return;}
      const key=s.sea?.current?seaCardByCode(data,s.sea.current).key:undefined;
      void prepareInfoWindows(key).catch(()=>{}); // An idle failure must not interrupt the game.
    };
    const schedule=()=>{if(typeof window.requestIdleCallback==='function')idle=window.requestIdleCallback(warm);else timer=window.setTimeout(warm,1500);};
    schedule();
    return()=>{alive=false;if(idle!==undefined)window.cancelIdleCallback(idle);if(timer!==undefined)clearTimeout(timer);};
  },[]);
  useTableBody(curtainSide ? null : 'game');

  useEffect(() => {
    if (local) storeSave(s.winner ? null : local.record());
  }, [version, local, s.winner]);

  useEffect(() => {
    // A refusal of the server comes after the action was sent: it is shown as the engine's refusal on one screen.
    if (net?.refusal) setFlash(net.refusal.text);
  }, [net, net?.refusal?.n]);

  useEffect(() => {
    // The log the player has seen: after a reload «Пока вас не было» shows only the rest.
    if (net && net.missed.length === 0) net.client.markSeen(net.log.length);
  }, [net, version]);

  useEffect(() => {
    // The sound «ваш ход» (off by default): when the turn comes to this device.
    if (sound && myTurn) playTurnSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTurn]);

  useEffect(() => {
    document.title = myDecision && (humans.length > 0 || !!net) ? '● Ваш ход — Бортом к борту' : 'Бортом к борту';
    return () => {
      document.title = 'Бортом к борту';
    };
  }, [myDecision, humans.length]);



  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const take = () => {
      if (document.visibilityState === 'visible' && nav.wakeLock) nav.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {});
    };
    take();
    document.addEventListener('visibilitychange', take);
    return () => {
      document.removeEventListener('visibilitychange', take);
      lock?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    // «Ход окончен · Отменить»: the turn passes after 3 s (1 s with «Быстрый конец хода»).
    if (mode.k !== 'ending') return;
    const started = performance.now();
    setEndSeconds(endMs / 1000);
    const counter = setInterval(() => setEndSeconds(Math.max(0, Math.ceil((endMs - performance.now() + started) / 1000))), 200);
    const t = setTimeout(() => act(mode.action, { preserveSheet: true }), endMs);
    return () => { clearTimeout(t); clearInterval(counter); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(t);
  }, [flash]);

  // ——— Hints for the team at the device (dry runs on the real state; only refusals and numbers are shown) ———
  const cardHints = useMemo(() => {
    const out = new Map<string, ReturnType<typeof playOptions>>();
    if (!myDecision || !seat) return out;
    const holder = s.ships[seat];
    for (const card of [...holder.hand, ...holder.plans]) out.set(card, playOptions(s, data, seat, card));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, seat, myDecision]);
  const useful = useMemo(() => (myTurn && hints ? hasUsefulMoves(s, data, bottom) : true), [version, myTurn, bottom, hints]); // eslint-disable-line react-hooks/exhaustive-deps
  /** The view for the Volley previews: an offered card stands for a hidden card of the captain's hand (the server checked it is there). */
  const sAim = useMemo(() => {
    const hidden = offers.filter((o) => !mySeats.includes(o.from) && ![...s.ships[o.from].hand, ...s.ships[o.from].plans].includes(o.card));
    if (hidden.length === 0) return s;
    const v = structuredClone(s);
    for (const o of hidden) {
      const hand = v.ships[o.from].hand;
      const i = hand.indexOf(HIDDEN);
      if (i >= 0) hand[i] = o.card;
    }
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
  const aimTargets = useMemo<VolleyTarget[]>(() => {
    if (mode.k !== 'aim') return [];
    if (mode.heart) return heartTargets(s, data, mode.shooter);
    const order = { ship: mode.shooter, ...(mode.charge ? { charge: mode.charge } : {}), ...(mode.chargeFrom && mode.chargeFrom !== mode.shooter ? { chargeFrom: mode.chargeFrom } : {}) };
    return volleyTargets(sAim, data, order).targets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, mode]);

  const nick = (code: string) => `«${shipData(data, code).nick}»`;

  // the layout of the table (V1b): where the tools stand, the measure of the water for the weather
  const wideLog = useWideLog();
  const [boardRef, seaRef] = useSeaClip();
  // ui-press: «Последнее: …» is in the sea — a class of the sea for the press zones of the stars under it (phone.css), set by
  // the line itself: the line follows the shown log, which never renders the table
  // (the sea from the line itself: the ref of a child is set before the ref of the sea on the first commit)
  const infoSea = useRef<Element | null>(null);
  const infoFlag = useCallback((el: HTMLButtonElement | null) => {
    if (el) infoSea.current = el.closest('.sea-table');
    infoSea.current?.classList.toggle('has-info', !!el);
  }, []);

  const tableInteraction = useMemo(() => ({}), [game, version, data, view, bottom, seat, mode, reactPickRaw,
    hints, alarmFolded, sheet, botTurn, held, fastTurn, openHands, fastEnd, endSeconds, flash,
    curtainSide, banner, endClosed, memoSeen, memoSide, speed, effects, look, sound]);

  // The dry runs of the engine depend only on the real game, not on the frame of a clip: a render the show asks for
  // (the displayed state moved on) reuses them. A ref, not useMemo: the code that fills it runs after the curtain return.
  const engineCache = useRef(new Map<string, { deps: readonly unknown[]; value: unknown }>());
  const cached = <T,>(key: string, deps: readonly unknown[], make: () => T): T => {
    const hit = engineCache.current.get(key);
    if (hit && hit.deps.length === deps.length && hit.deps.every((x, i) => Object.is(x, deps[i]))) return hit.value as T;
    const value = make();
    engineCache.current.set(key, { deps, value });
    return value;
  };
  const engineDeps = [version, game, data, bottom, myTurn, myDecision, mySeats.join(','), mode, hints, sAim, aimTargets] as const;
  // ui-press: handlers that keep their identity from render to render and call the newest function: a memo'd part of the
  // table (a plank, the log) skips a render that changes nothing it shows. Called only from events, after the commit.
  const handlers = useRef(new Map<string, { fn: (...a: never[]) => unknown; call: (...a: never[]) => unknown }>());
  const stable = <F extends (...a: never[]) => unknown>(key: string, fn: F): F => {
    let h = handlers.current.get(key);
    if (!h) {
      const box: { fn: (...a: never[]) => unknown; call: (...a: never[]) => unknown } = { fn, call: (...a) => box.fn(...a) };
      handlers.current.set(key, (h = box));
    }
    h.fn = fn;
    return h.call as F;
  };

  // ——— Curtain ———
  if (curtainSide) {
    const summary = game.log
      .slice(seen[curtainSide])
      .filter((l) => l.kind === 'action' || l.kind === 'damage' || l.kind === 'round')
      .map((l) => l.text)
      .slice(-8);
    return (<>
      {perf.config.enabled && <PerfPanel />}
      <Curtain
        side={curtainSide}
        title={`Передайте устройство ${SIDE_LABEL[curtainSide].dat}`}
        reason={curtainReason(s, data, d!.kind) + ` · раунд ${s.round}`}
        summary={summary}
        onReady={() => {
          setSeen({ ...seen, [curtainSide]: game.log.length });
          setDevice(curtainSide);
          setMode({ k: 'idle' });
          setSheet(null);
          setSeatPick(null);
        }}
      />
    </>);
  }

  // ——— Card flows ———
  const startPlay = (holder: string, card: string) => {
    const c = cardByCode(data, card);
    const opts = playOptions(s, data, holder, card);
    if (opts.actions.length === 0) {
      setFlash(opts.reason);
      return;
    }
    setSheet(null);
    if (c.type === 'ЗАРЯД' && mustOffer(holder)) {
      setFlash('Залп даёт союзник: предложите ему Заряд');
      return;
    }
    if (c.type === 'ЗАРЯД') {
      const shooter = seatShip(s, holder)!.code;
      setMode({ k: 'aim', shooter, charge: card, chargeFrom: holder, heart: false, target: null, paid: 0 });
      return;
    }
    if (c.type === 'РЕАКЦИЯ') {
      act(opts.actions[0]);
      return;
    }
    const needs = cardNeeds(s, data, holder, card);
    if (!needs.target && !needs.ship && !needs.cells && needs.souls === null && !needs.regroup) {
      act(opts.actions[0]);
      return;
    }
    setMode({ k: 'card', seat: holder, card, target: null, ship: null, repair: null, souls: null, regroup: false });
  };

  const cardButtons = (holder: string, code: string): Btn[] => {
    if (!myTurn || !mySeats.includes(holder)) {
      if (myDecision && d!.kind === 'reactions' && cardByCode(data, code).type === 'РЕАКЦИЯ') {
        const o = cardHints.get(code) ?? playOptions(s, data, holder, code);
        return [{ key: 'play', label: 'Сыграть', primary: true, disabled: o.reason, onClick: () => startPlay(holder, code), testid: 'detail-play' }];
      }
      return [];
    }
    const ship = s.ships[holder];
    const inHand = ship.hand.includes(code);
    const o = cardHints.get(code) ?? playOptions(s, data, holder, code);
    const btns: Btn[] = [{ key: 'play', label: 'Сыграть', primary: true, disabled: o.reason, onClick: () => startPlay(holder, code), testid: 'detail-play' }];
    if (cardByCode(data, code).type === 'ЗАРЯД' && isCaptain(s, holder)) {
      const ally = nick(seatShip(s, holder)!.code);
      if (!mustOffer(holder)) btns[0] = { ...btns[0], label: `Сыграть в Залп корабля ${ally}` };
      else if (offerOf(holder)?.card === code) {
        btns[0] = { key: 'unoffer', label: 'Отозвать предложение', onClick: () => (net!.unoffer(holder), setSheet(null)), testid: 'unoffer-charge' };
      } else {
        btns[0] = { key: 'offer', label: `Предложить в Залп корабля ${ally}`, primary: true, disabled: o.reason, onClick: () => (net!.offer(holder, code), setSheet(null)), testid: 'offer-charge' };
      }
    }
    if (inHand) {
      const sell = refusal(s, { type: 'sell', seat: holder, card: code }, data);
      btns.push({ key: 'sell', label: `Продать · +${data.rules.sellGain} П`, disabled: sell, onClick: () => act({ type: 'sell', seat: holder, card: code }) });
      const pass = refusal(s, { type: 'pass', seat: holder, card: code }, data);
      btns.push({ key: 'pass', label: 'Передать союзнику', disabled: pass, onClick: () => act({ type: 'pass', seat: holder, card: code }) });
      if (ship.fires > 0) {
        const ext = refusal(s, { type: 'extinguish', seat: holder, card: code }, data);
        btns.push({ key: 'ext', label: 'Потушить Пожар', disabled: ext, onClick: () => act({ type: 'extinguish', seat: holder, card: code }) });
      }
    }
    return btns;
  };

  /**
   * A phone (a5-phone, A5Phone frame 6): the lifted card in the hand plays itself — the buttons of the window of the card:
   * «Сыграть» (grey with the reason when it cannot), under it only the other actions that can be pressed now.
   */
  const LIFT_SHORT: Record<string, string> = { sell: `Продать +${data.rules.sellGain}\u00a0П`, pass: 'Передать', ext: 'Потушить' };
  const liftActions = (holder: string, code: string): LiftActions | null => {
    if (code === HIDDEN || code.endsWith('-Л')) return null;
    const btns = cardButtons(holder, code);
    if (btns.length === 0) return null;
    return { play: btns[0], more: btns.slice(1).filter((b) => !b.disabled).map((b) => ({ ...b, label: LIFT_SHORT[b.key] ?? b.label })) };
  };

  // ——— End of the turn: «Залп не дан…» → Plans of the Pearl → endTurn ———
  const endFlow = (step: 'start' | 'confirmed') => {
    if (!myTurn) return;
    if (step === 'start' && hints) {
      const unfired = unfiredShips(s, data, bottom);
      if (unfired.length > 0) {
        setMode({ k: 'confirmEnd', text: `Залп не дан: ${unfired.map(nick).join(', ')}. В Трюме ${s.teams[bottom].powder} Пороха.` });
        return;
      }
    }
    const pearl = Object.values(s.ships).find((x) => x.side === bottom && hasAbility(data, x, ABILITY.madPlan));
    if (pearl && pearl.hand.length > 0 && pearl.plans.length < data.rules.plansMax) {
      setMode({ k: 'plans', seat: pearl.code });
      return;
    }
    finishTurn({ type: 'endTurn', side: bottom });
  };
  /** The turn passes in 3 s (or 1 s) with «Отменить» (docs/TZ.md, «Детали», п. 10); at the test speed — at once. */
  const finishTurn = (action: Action) => (speed === 'instant' ? act(action) : setMode({ k: 'ending', action }));

  // ——— Planks ———
  const columns = (side: Side, tableView: GameState) => {
    const ships = Object.values(tableView.ships).filter((x) => x.side === side);
    const alive = ships.filter((x) => !x.sunk);
    const cols: (typeof ships[number] | null)[] = [null, null];
    for (const x of alive) cols[x.pos] = x;
    for (const x of ships.filter((y) => y.sunk)) cols[cols[x.pos] ? 1 - x.pos : x.pos] = x;
    return cols.filter((x): x is NonNullable<typeof x> => !!x);
  };

  const plateFor = (code: string): Plate | null => cached(`plate:${code}`, engineDeps, () => plateNow(code));
  const plateNow = (code: string): Plate | null => {
    if (mode.k === 'aim') {
      const t = aimTargets.find((x) => x.target === code);
      if (!t) return null;
      // Without hints the targets are only framed, the damage shows in the panel after the choice.
      const l = plateLabel(t.preview);
      return { tip: hints ? `${l.label} ${l.sub}` : null, chosen: mode.target === code, onClick: () => setMode({ ...mode, target: code }) };
    }
    if (mode.k === 'card') {
      const needs = cardNeeds(s, data, mode.seat, mode.card);
      if (!needs.target) return null;
      const ok = playOptions(s, data, mode.seat, mode.card).actions.some((a) => a.type === 'playCard' && a.target === code);
      if (!ok) return null;
      return { tip: null, chosen: mode.target === code, onClick: () => setMode({ ...mode, target: code }) };
    }
    if (mode.k === 'legend' && mode.confirmed) {
      const ok = legendOptions(s, data, mode.seat).actions.some((a) => a.type === 'playLegend' && a.target === code);
      return ok ? { tip: null, chosen: mode.target === code, onClick: () => act({ type: 'playLegend', seat: mode.seat, target: code }) } : null;
    }
    return null;
  };

  const plankButtons = (code: string): Btn[] => cached(`buttons:${code}`, engineDeps, () => buttonsNow(code));
  const buttonsNow = (code: string): Btn[] => {
    const ship = s.ships[code];
    if (!myTurn || ship.sunk || ship.side !== bottom || !mySeats.includes(code)) return NO_BUTTONS;
    const params = shipData(data, code);
    const vt = volleyTargets(s, data, { ship: code });
    const joint = jointAlly();
    const btns: Btn[] = [
      {
        key: 'volley',
        label: `Залп · ${params.volleyCost} П`,
        short: `Залп · ${params.volleyCost}`,
        primary: mode.k === 'aim' && mode.shooter === code,
        disabled: vt.reason,
        onClick: () => {
          setSeatPick(code);
          setMode({ k: 'aim', shooter: code, charge: null, chargeFrom: null, heart: false, target: null, paid: 0 });
        },
        testid: `volley-${code}`,
        // «+1 совместно» on the button, the full text as its pop (instead of a line under the Hold)
        ...(joint?.code === code ? { tag: `+${data.rules.jointBonus} совместно`, tip: joint.text } : {}),
      },
    ];
    if (heartTargets(s, data, code).length > 0) {
      btns.push({ key: 'heart', label: 'Сердце: Залп', short: 'Сердце', onClick: () => setMode({ k: 'aim', shooter: code, charge: null, chargeFrom: null, heart: true, target: null, paid: 0 }) });
    }
    for (const a of abilityButtons(s, data, code)) btns.push({ key: a.key, label: a.label, short: a.short, onClick: () => act(a.action) });
    return btns;
  };

  const legendClick = (code: string) => {
    if (!s.ships[code].legend) return;
    setSheet({ k: 'card', seat: code, code: `${code}-Л` });
  };

  const regroupBtn = (side: Side): Btn | null => cached(`regroup:${side}`, engineDeps, () => regroupNow(side));
  const regroupNow = (side: Side): Btn | null => {
    if (side !== bottom) return null;
    // always in its place under the Hold; out of one's turn dimmed, not active, «Только в свой ход», the price still shown
    // (free while a ship of the team is «Быстрее ветра»; the sea «Попутный ветер» is known only by the engine in one's turn)
    const r = myTurn ? tryAction(s, { type: 'regroup', side }, data) : null;
    const freeShip = Object.values(s.ships).some((x) => x.side === side && hasAbility(data, x, ABILITY.fasterThanWind));
    const cost = r?.ok ? r.events.filter((e) => e.type === 'powderSpent').reduce((n, e) => n + (e.type === 'powderSpent' ? e.amount : 0), 0) : freeShip ? 0 : data.rules.regroupCost;
    if (!r) return { key: 'regroup', label: cost ? `Перестроение · ${cost} П` : 'Перестроение · бесплатно', short: `Перестроение · ${cost}`, disabled: 'Только в свой ход', onClick: () => {} };
    // A5: «Перестроение · бесплатно» while it costs nothing, else the price with a keg; the phone keeps «· N»
    return { key: 'regroup', label: cost ? `Перестроение · ${cost} П` : 'Перестроение · бесплатно', short: `Перестроение · ${cost}`, disabled: r.ok ? null : r.reason, onClick: () => act({ type: 'regroup', side }) };
  };

  /** «Совместный залп»: the ally whose Volley at the first target gets +N this turn, and the full text of it (on its «Залп»). */
  const jointAlly = (): { code: string; text: string } | null => {
    const t = s.turn;
    if (!myTurn || !t.firstTarget || t.jointUsed || !t.firstShooter) return null;
    const ally = Object.values(s.ships).find((x) => x.side === bottom && x.code !== t.firstShooter && !x.sunk);
    if (!ally || (t.volleys[ally.code] ?? 0) > 0 || s.ships[t.firstTarget].sunk) return null;
    return { code: ally.code, text: `Совместный залп по «${shipData(data, t.firstTarget).nickDative}» даст ${nick(ally.code)} +${data.rules.jointBonus}` };
  };

  // ——— «Тревога!»: the Reaction window is the bar, the arrow, the hand and the buttons; on a phone — a sheet ———
  const alarm = reactOpen ? alarmInfo(s, data) : null;
  const alarmOn = !!alarm;
  const reactionTimer = net && alarmOn ? Number(net.room.settings.reactionTimer) || 0 : 0;
  const fuse = reactionTimer > 0 ? { seconds: reactionTimer, k: String(version) } : null;
  /** How a card of the hand looks while the window is open: playable (the strip — only under «Подсказки»), not playable, dimmed. */
  function alarmOf(holder: string, code: string): AlarmCard | null {
    if (!alarmOn || code === HIDDEN) return null;
    // the same card of the same window: one dry run per real state (the sheet and the hand ask on every render)
    return cached(`alarmOf:${holder}:${code}`, [version, hints, d], () => alarmNow(holder, code));
  }
  function alarmNow(holder: string, code: string): AlarmCard | null {
    if (cardByCode(data, code).type !== 'РЕАКЦИЯ' || !d!.seats.includes(holder)) return { kind: 'dim' };
    // The sheet includes both ships; the hand cache only covers the selected ship.
    const why = playOptions(s, data, holder, code).reason;
    if (why) return { kind: 'no', why };
    return { kind: 'ok', strip: hints ? (reactionStrip(s, data, holder, code) ?? undefined) : undefined };
  }
  const skipReaction = () => act(myDeciding.map((x) => ({ type: 'noReaction', seat: x }) as Action));

  // ——— The panel in the middle (laptop) or in place of the hand (phone) ———
  let dock: React.ReactNode = null;
  /** «Начать новую партию?», «Сдаться?», «Выйти из комнаты?»: a window like «Настройки», where they are asked from (ui-fixes). */
  let confirm: React.ReactNode = null;
  // Card choices, «Тортуга» and the Plans are bottom sheets on a phone; the Volley and the Reactions stay in the middle.
  let dockSheet = false;
  /** The dock holds the sheet of «Тревога!» (a phone). */
  let alarmDock = false;
  let oakDock = false;
  /** The sheet «Заряд» while aiming (in the place of the hand) and, on a laptop, its buttons in the place of «Ход окончен». */
  let chargeSheet: ReactNode = null;
  let chargeBtns: ReactNode = null;
  const cancel = () => setMode({ k: 'idle' });
  /** The enemy decides on a Reaction to this device's Volley or card (a person sits here). */
  const waitReaction =
    !s.winner && !!d && d.kind === 'reactions' && d.side !== bottom && !myDecision && (net ? mySeats.length > 0 : game.setup.players[bottom] === 'human');
  const waitNote = waitReaction ? reactionWait(s, data, d!.side, d!.seats.map(x => ({bot: botSeat(x), name: net ? net.nameOf(x) : null}))) : null;
  const waitTarget = waitReaction ? alarmInfo(s, data)?.target : null;
  if (s.winner) dock = null;
  else if (myDecision && d!.kind === 'reactions') {
    // A laptop has no panel: the buttons stand where «Ход окончен» does (handActions).
    if (phone && alarm) {
      dockSheet = true;
      alarmDock = true;
      dock = (
        <ReactionSheet
          s={s}
          data={data}
          seats={myDeciding}
          hints={hints}
          memo={!memoSeen.includes(bottom)}
          pick={reactPick}
          folded={alarmFolded}
          fuse={fuse}
          alarmOf={alarmOf}
          onPick={setReactPick}
          onAct={(a) => act(a)}
          onInfo={(holder, code) => setSheet({ k: 'card', seat: holder, code })}
          onFold={setAlarmFolded}
        />
      );
    }
  } else if (myDecision && d!.kind === 'jack') {
    dockSheet = true;
    oakDock = true;
    dock = <JackPanel s={s} data={data} ship={d!.seats[0]} onAct={(a) => act(a)} />;
  } else if (myDecision && d!.kind === 'tortuga') {
    dockSheet = true;
    oakDock = true;
    dock = <TortugaPanel key={turnKey} s={s} data={data} side={d!.side} onAct={(a) => act(a)} />;
  } else if (myDecision && d!.kind === 'choice') {
    dockSheet = true;
    oakDock = true;
    dock = <ChoicePanel key={`${version}`} s={s} data={data} seat={myDeciding[0]} onAct={(a) => act(a)} onSea={(code) => setSheet({ k: 'sea', code })} />;
  } else if (myTurn) {
    if (mode.k === 'aim') {
      // PH 4: the sheet «Заряд» stands in the place of the hand (chargeSheet below), not in the sea
      const charges = chargeCandidates(sAim, data, mode.shooter)
        .filter((o) => chargeOk(o.from, o.card, mode.shooter))
        .map((o) => ({ ...o, offered: !mySeats.includes(o.from) }));
      const btns = <ChargeButtons s={sAim} data={data} mode={mode} onFire={(a) => act(a)} onCancel={cancel} />;
      chargeBtns = phone ? null : btns;
      chargeSheet = (
        <ChargeSheet
          s={sAim}
          data={data}
          hints={hints}
          mode={mode}
          charges={charges}
          buttons={phone ? btns : null}
          setMode={setMode}
        />
      );
    } else if (mode.k === 'card') {
      oakDock = true; dockSheet = true;
      dock = <CardParamsPanel s={s} data={data} mode={mode} setMode={setMode} onAct={(a) => act(a)} onCancel={cancel} />;
    }
    else if (mode.k === 'legend') {
      const c = cardByCode(data, `${mode.seat}-Л`);
      const opts = legendOptions(s, data, mode.seat);
      const needsTarget = opts.actions.every((a) => a.type === 'playLegend' && a.target);
      dock = !mode.confirmed ? (
        <ConfirmPanel
          title={c.name}
          sub={`${c.big}. Легенда играется один раз за партию.`}
          yes={`Сыграть · ${c.soul ? `${c.soul} Д` : `${c.cost} П`}`}
          onYes={() => (needsTarget ? setMode({ ...mode, confirmed: true }) : act(opts.actions[0]))}
          onNo={cancel}
          testid="legend-confirm"
        />
      ) : (
        <ConfirmPanel title={c.name} sub={`Выберите цель на столе. ${c.big}`} yes="Отмена" onYes={cancel} onNo={cancel} />
      );
    } else if (mode.k === 'confirmEnd') {
      dock = <ConfirmPanel title="Закончить ход?" sub={mode.text} yes="Закончить ход" no="Вернуться" onYes={() => endFlow('confirmed')} onNo={cancel} testid="confirm-end" />;
    } else if (mode.k === 'plans') {
      dockSheet = true;
      oakDock = true;
      dock = <PlansPanel s={s} data={data} seat={mode.seat} onDone={(plans) => finishTurn({ type: 'endTurn', side: bottom, plans })} onCancel={cancel} />;
    } else if (mode.k === 'idle' && net) {
      const mine = mySeats.map(offerOf).find((o) => !!o);
      if (mine) {
        dock = (
          <OfferPanel title={`Предложено: «${cardByCode(data, mine.card).name}» для Залпа корабля ${nick(mine.to)}`} onWithdraw={() => net.unoffer(mine.from)} />
        );
      }
    }
  } else if (net && !s.winner) {
    dock = netDock(net, mySeats, bottom, nick);
  }
  if (mode.k === 'concede') {
    const allyPeople = net ? Object.values(s.ships).some((x) => x.side === mode.side && !mySeats.includes(x.code) && !net.isBotSeat(x.code)) : false;
    confirm = (
      <ConfirmSheet
        title={`Сдаться за ${SIDE_LABEL[mode.side].acc}?`}
        sub={allyPeople ? 'Команда сдаётся, когда «Сдаться» нажмут оба игрока.' : 'Партия закончится победой противника.'}
        yes="Сдаться"
        onYes={() => {
          if (net) {
            net.voteConcede(true);
            cancel();
          } else act({ type: 'concede', side: mode.side });
        }}
        onNo={cancel}
      />
    );
  } else if (mode.k === 'exitRoom') {
    confirm = (
      <ConfirmSheet
        title="Выйти из комнаты?"
        sub={s.winner ? 'Партия окончена.' : 'Ваш корабль останется на месте: создатель комнаты сможет заменить вас ботом.'}
        yes="Выйти"
        onYes={onExit}
        onNo={cancel}
      />
    );
  } else if (mode.k === 'leave') {
    confirm = (
      <ConfirmSheet
        title="Начать новую партию?"
        sub="Текущая партия останется в автосохранении, пока вы не начнёте новую."
        yes="Новая партия"
        onYes={onExit}
        onNo={cancel}
      />
    );
  }


  if (isValidElement<Parameters<typeof ConfirmPanel>[0]>(dock) && dock.type === ConfirmPanel) {
    oakDock = true; dockSheet = true;
    dock = cloneElement(dock, {hold: {powder: s.teams[bottom].powder, cap: data.econ.cap}});
  }

  // ——— The instruction in the status bar ———
  const instruction = (() => {
    if (s.winner) return s.winner === 'НИЧЬЯ' ? 'Партия окончена: ничья' : `Партия окончена: победа — ${SIDE_LABEL[s.winner].name}`;
    if (!d) return '';
    if (net && !myDecision) return netWaiting();
    if (botSide(d.side)) {
      // The team, not the ship: the ship deciding would tell who holds a Reaction.
      if (d.kind === 'reactions') return `Ждём: ${SIDE_LABEL[d.side].name} (бот) ${decideVerb(d.side)}, ответить ли Реакцией…`;
      if (d.kind === 'turn') return `Бот: ${SIDE_LABEL[d.side].name} думает…`;
      return `Бот: ${SIDE_LABEL[d.side].name} решает…`;
    }
    if (!myDecision) return `Ждём: ${SIDE_LABEL[d.side].name} — ${curtainReason(s, data, d.kind)}`;
    switch (d.kind) {
      case 'reactions':
        return `${nick(s.volley?.shooter ?? s.card?.ship ?? d.seats[0])}: ${s.volley ? 'Залп' : 'карта'} — ответите Реакцией?`;
      case 'jack':
        return `${nick(d.seats[0])} тонет — сыграть «Джек ускользает»?`;
      case 'tortuga':
        return 'Тортуга: сколько карт взять?';
      case 'choice':
        return `${nick(d.seats[0])}: сделайте выбор`;
    }
    if (mode.k === 'aim') {
      if (!mode.target) return `${nick(mode.shooter)}: выберите цель Залпа`;
      const to = `«${shipData(data, mode.target).nickDative}»`;
      return mode.charge ? `Залп по ${to} — проверьте и нажмите «Огонь»` : `Залп по ${to} — Заряд картой из руки`;
    }
    if (mode.k === 'card') return `${nick(mode.seat)}: «${cardByCode(data, mode.card).name}» — выберите параметры`;
    if (!useful) return 'Полезных действий не осталось — нажмите «Ход окончен»';
    return `${nick(seat)}: выберите карту или действие`;
  })();

  /** By network: whom the game waits for, by name — or «Противник может ответить…» without telling who holds what. */
  function netWaiting(): string {
    const g = net!;
    const who = (seats: string[]) => {
      const people = [...new Set(seats.filter((x) => !g.isBotSeat(x)).map((x) => g.nameOf(x)).filter(Boolean))];
      const bots = seats.filter((x) => g.isBotSeat(x)).map((x) => `бот ${nick(x)}`);
      return [...people, ...bots].join(', ') || SIDE_LABEL[d!.side].name;
    };
    if (d!.kind === 'reactions') {
      if (d!.side !== bottom) return 'Противник может ответить Реакцией…';
      return d!.seats.length === 0 ? `${s.volley ? 'Залп' : 'Карта'} противника: Реакций нет` : `Ждём: ${who(d!.seats)} — Реакция…`;
    }
    if (d!.kind === 'turn') {
      const left = d!.seats.filter((x) => !g.ready.includes(x));
      if (d!.side === bottom) return `Ход окончен — ждём: ${who(left.length > 0 ? left : d!.seats)}`;
      return `Ход ${SIDE_LABEL[d!.side].gen}: ${who(left.length > 0 ? left : d!.seats)}`;
    }
    return `Ждём: ${who(d!.seats)} — ${curtainReason(s, data, d!.kind)}`;
  }

  // ——— The middle at rest: the last event (of the log as it is shown) ———
  const lastEventOf = (shownLog: typeof game.log) => {
    const lastShownAction = shownLog.at(-1)?.action;
    const shownRecent = game.recent.find((r) => r.n === lastShownAction);
    const shownSummary = shownRecent ? turnSummary(data, shownRecent.events) : null;
    return shownSummary?.text
      ? `Ход ${sideGenitive(shownSummary.side)}: ${shownSummary.text}`
      : [...shownLog].reverse().find((l) => l.kind === 'action' || l.kind === 'damage')?.text ?? null;
  };
  /** The ally: «Капитан предлагает Заряд…» (P6). */
  const offerToMe = myTurn && mode.k === 'idle' ? offers.find((o) => mySeats.includes(o.to) && !mySeats.includes(o.from)) : undefined;
  const offerInfo = offerToMe ? `Капитан предлагает Заряд «${cardByCode(data, offerToMe.card).name}» — нажмите «Залп» ${nick(offerToMe.to)}` : null;

  // ——— Hand ———
  const tabs: HandTab[] = allSeats
    .filter((x) => mySeats.includes(x))
    .map((x) => {
      const ship = seatShip(s, x);
      const own = ship?.code === x;
      const played = own ? (s.turn.played[x] ?? 0) : s.turn.captainPlayed.includes(x) ? 1 : 0;
      const limit = own ? (s.turn.limit[x] ?? s.ships[x].tracks.crew) : 1;
      const dot =
        hints && myDecision && d!.kind === 'reactions' && d!.seats.includes(x) && reactionsOf(x).some((c) => !playOptions(s, data, x, c).reason);
      return { seat: x, label: `${shipData(data, x).nick}${s.active === bottom && x === seat ? ` · ${played} из ${limit}` : ''}`, dot, played: s.active === bottom ? `${played} из ${limit}` : undefined };
    });
  // By network the ally's hand is a tab to look at (docs/TZ.md, «Принципы стола», п. 5): another person or a bot plays it.
  if (net) {
    for (const x of allSeats.filter((y) => !mySeats.includes(y) && seatShip(s, y))) {
      tabs.push({ seat: x, label: `${net.isBotSeat(x) ? 'Бот' : 'Союзник'} · ${shipData(data, x).nick}` });
    }
  }
  function reactionsOf(x: string): string[] {
    return [...s.ships[x].hand, ...s.ships[x].plans].filter((c) => c !== '?' && cardByCode(data, c).type === 'РЕАКЦИЯ');
  }
  const offOf = (holder: string, code: string): string | null => {
    const offered = mode.k === 'aim' && code !== HIDDEN && !mySeats.includes(holder) && chargeOk(holder, code, mode.shooter);
    if (net && !mySeats.includes(holder) && !offered) return net.isBotSeat(holder) ? 'Этой рукой играет бот' : 'Это рука союзника: ею играет он';
    if (!myDecision) return s.winner ? 'Партия окончена' : 'Сейчас не ваше решение';
    if (mode.k === 'aim') {
      if (cardByCode(data, code).type !== 'ЗАРЯД' || seatShip(s, holder)?.code !== mode.shooter) return 'Во время Залпа — только Заряды';
      if (mode.target) {
        const p = previewVolley(sAim, data, volleyOrder({ ...mode, charge: code, chargeFrom: holder, paid: 0 }, mode.target));
        return p.ok ? null : p.reason;
      }
      return null;
    }
    if (d!.kind === 'reactions') return cardByCode(data, code).type === 'РЕАКЦИЯ' ? (cardHints.get(code)?.reason ?? null) : 'Сейчас — только Реакции';
    if (d!.kind !== 'turn') return 'Сначала закончите выбор';
    return cardHints.get(code)?.reason ?? null;
  };
  const chosenCard = mode.k === 'aim' ? mode.charge : mode.k === 'card' ? mode.card : (reactPick?.card ?? null);
  /** «Подсказки»: «→ итог 4» on the Charges while aiming, «4 → 2» on the Reactions in the window. */
  const noteOf = (code: string): string | undefined => {
    if (code === HIDDEN) return undefined;
    const c = cardByCode(data, code);
    if (myTurn && mode.k !== 'aim' && c.type === 'ЗАРЯД' && mySeats.includes(seat) && isCaptain(s, seat)) {
      const big = c.big.length <= 8 ? `${c.big} ` : '';
      if (!mustOffer(seat)) return `${big}→ в Залп союзника`;
      return offerOf(seat)?.card === code ? 'предложено союзнику' : `${big}→ предложить в Залп союзника`;
    }
    if (!hints || !myDecision) return undefined;
    if (mode.k === 'aim' && mode.target && c.type === 'ЗАРЯД' && seatShip(s, seat)?.code === mode.shooter) {
      const p = previewVolley(sAim, data, volleyOrder({ ...mode, charge: code, chargeFrom: seat, paid: 0 }, mode.target));
      return p.ok ? `${c.big.length <= 8 ? `${c.big} ` : ''}→ итог ${p.damage}` : undefined;
    }
    if (d!.kind === 'reactions' && c.type === 'РЕАКЦИЯ' && d!.seats.includes(seat) && !alarmOn) {
      const r = previewReaction(s, data, seat, code);
      return r.ok ? r.label : undefined;
    }
    return undefined;
  };
  const handLabel = `${seat ? `Рука · ${nick(seat)}` : 'Рука'}`;
  const captainNote =
    seat && mySeats.includes(seat) && isCaptain(s, seat) ? `Вы капитан на борту корабля ${nick(seatShip(s, seat)!.code)}: 1 карта за ход за него, Порох — команды` : undefined;

  // ——— Bottom buttons ———
  const undoWhy = myTurn && local ? local.undoRefusal(bottom) : 'Отменять можно только свои действия в свой ход';
  const undoBtn: Btn = { key: 'undo', label: '↶', disabled: mode.k === 'ending' ? null : undoWhy, onClick: () => mode.k === 'ending' ? cancel() : (local?.undo(), setMode({ k: 'idle' })), testid: 'undo' };
  // By network instead of Undo: «Напомнить» those the game waits for.
  const waitingPeople = !!net && !!d && !s.winner && !myDecision && (d.kind === 'turn' ? d.seats.filter((x) => !net.ready.includes(x)) : d.seats).some((x) => !net.isBotSeat(x) && !mySeats.includes(x));
  const remindBtn: Btn = {
    key: 'remind',
    label: 'Напомнить',
    disabled: waitingPeople ? null : myDecision ? 'Сейчас ждут вас' : 'Сейчас ждут не людей',
    onClick: () => {
      net?.remind();
      setFlash('Напоминание отправлено');
    },
    testid: 'remind',
  };
  const endBtn: Btn = {
    key: 'end',
    label: mode.k === 'ending' ? `Ход окончен · ${endSeconds}` : myTurn || s.winner || !d ? 'Ход окончен' : `${/ы$/.test(SIDE_LABEL[s.active].name) ? 'Ходят' : 'Ходит'} ${SIDE_LABEL[s.active].name}`,
    primary: true,
    disabled: myTurn ? (mode.k === 'idle' ? null : 'Сначала закончите или отмените текущее действие') : 'Сейчас не ваш ход',
    onClick: () => endFlow('start'),
    testid: 'end-turn',
  };
  // «Пауза», «Быстрее» and «До конца хода» while a bot moves or a move is shown; the last two skip the clips.
  const pauseBtn: Btn = {
    key: 'pause',
    label: held ? '▶ Дальше' : '⏸ Пауза',
    short: held ? '▶' : '⏸',
    onClick: () => setHeld(!held),
    testid: 'pause-show',
  };
  const botBtnsOf = (busy: boolean): Btn[] => botBusyOf(busy)
    ? [
        {
          key: 'faster',
          label: 'Быстрее',
          onClick: () => {
            setHeld(false);
            fx.skip();
            setSpeed(speed === 'slow' ? 'normal' : speed === 'normal' ? 'fast' : 'instant');
          },
        },
        {
          key: 'skip',
          label: 'До конца хода',
          onClick: () => {
            setHeld(false);
            fx.skip();
            setFastTurn(turnKey);
          },
          testid: 'skip-turn',
        },
        ...(canHoldOf(busy) ? [pauseBtn] : []),
      ]
    : [];

  // The round brass buttons of the top row (A5): «Журнал» while the log is off the screen, «Правила», «Настройки».
  const toolButtons = (
    <>
      {!wideLog && <RoundButton b={{ key: 'log', label: 'Журнал', onClick: () => setSheet({ k: 'log' }) }} icon="log" className="tool log-toggle wide" />}
      <RoundButton b={{ key: 'rules', label: 'Правила', onClick: () => setSheet({ k: 'rules' }) }} icon="rules" className="tool wide" />
      <RoundButton b={{ key: 'settings', label: 'Настройки', onClick: () => setSheet({ k: 'settings' }), testid: 'settings-btn' }} icon="settings" className="tool" />
    </>
  );

  /** By network: «Вы», the ally's name, «Бот» on the planks (docs/TZ.md, «Стол»). */
  function netRole(code: string): string | null {
    if (!net) return null;
    if (net.isBotSeat(code)) return 'Бот';
    if (mySeats.includes(code)) return 'Вы';
    return net.nameOf(code);
  }
  // «Весь журнал»: the book of the ship whose hand is open; a spectator — of the first ship of the bottom team
  const bookShip = seat ?? Object.values(s.ships).find((x) => x.side === bottom)?.code ?? 'Ж';
  const fileName = net ? `bortom-k-bortu-${net.room.code}` : `bortom-k-bortu-${game.setup.game.seed}`;
  const downloadLog = () => download(`${fileName}.txt`, game.log.map((l) => (l.kind === 'round' ? `\n${l.text}` : l.text)).join('\n'));
  // By network the record (every card) comes from the server, and only after the end of the game.
  const downloadGame = local
    ? () => download(`${fileName}.json`, JSON.stringify(local.record(), null, 1), 'application/json')
    : net && s.winner
      ? () => {
          const save = (r: MatchRecord) => download(`${fileName}.json`, JSON.stringify(r, null, 1), 'application/json');
          if (netRecord) save(netRecord);
          else
            net.requestRecord((r) => {
              setNetRecord(r);
              save(r);
            });
        }
      : null;
  const vote = net?.room.rematch ?? null;
  const rematchLabel = vote?.you ? 'Отменить реванш' : 'Реванш';
  const rematchNote = vote ? `согласны ${vote.agreed} из ${vote.need}` : undefined;
  const rematch = () => {
    const seed = createRng((Date.now() ^ game.setup.game.seed) >>> 0).int(2 ** 31 - 1) + 1;
    const { positions: _positions, ...rest } = game.setup.game;
    onRestart({ ...game.setup, game: { ...rest, seed } });
  };

  const top = other(bottom);
  const decidingSeats = d && !s.winner ? d.seats : [];
  const shooter = mode.k === 'aim' ? mode.shooter : (s.volley?.shooter ?? null);
  const targeted = mode.k === 'aim' ? mode.target : mode.k === 'card' ? mode.target : (s.volley?.target ?? null);
  // The ship the card repairs, as the engine decides it: framed green while the card panel is open.
  const repairing = mode.k === 'card' ? cardNeeds(s, data, mode.seat, mode.card, mode.ship ? { ship: mode.ship } : {}).repairShip : null;
  // fix-ui (TASKS-2 PH 4): while a target is chosen the targets are framed with a dashed line and the other ships are dimmed
  const choosingTarget = mode.k === 'aim' || (mode.k === 'card' && !!cardNeeds(s, data, mode.seat, mode.card).target) || (mode.k === 'legend' && mode.confirmed);

  /**
   * «✓ готов»: the player of the team whose turn it is pressed «Ход окончен». By network — the seats the server lists
   * as ready (everyone gets them), and this device's seats during the countdown; on one screen — the seats at the
   * device during the countdown.
   */
  const readyOf = (code: string) => {
    const ship = s.ships[code];
    if (s.winner || ship.sunk || ship.side !== s.active) return false;
    if (mode.k === 'ending' && mySeats.includes(code)) return true;
    return !!net && net.ready.includes(code);
  };

  const renderRow = (side: Side) => (tableView: GameState, rev: (code: string) => number, hidden: Record<string, string[]>) =>
    columns(side, tableView).map((x) => renderPlank(x, tableView, rev(x.code), hidden[x.code]));
  const renderPlank = (x: (typeof view.ships)[string], tableView: GameState, fxGen: number, fxHidden: string[] | undefined) => (
    <Plank
      key={x.code}
      stamp={tableInteraction}
      s={tableView}
      fxGen={fxGen}
      fxHidden={fxHidden}
      data={data}
      reactionWait={cached(`wait:${x.code}`, [waitNote?.line, waitNote?.who, waitTarget === x.code], () =>
        waitNote && waitTarget === x.code ? <ReactionWaitPanel line={waitNote.line} who={waitNote.who} /> : undefined)}
      ship={x}
      own={x.side === bottom}
      selected={x.side === bottom && x.code === seat && tabs.length > 1}
      awaiting={decidingSeats.includes(x.code) && !botSeat(x.code) && !(net && d?.kind === 'turn' && net.ready.includes(x.code))}
      targeted={targeted === x.code}
      shooter={shooter === x.code}
      alarm={cached(`alarm:${x.code}`, [version, hints, alarm?.kind === 'volley' && alarm.target === x.code], () =>
        alarm?.kind === 'volley' && alarm.target === x.code ? { loss: hints && alarm.hit ? lossOf(s, x.code, alarm.hit) : null } : null)}
      repairing={repairing === x.code}
      plate={plateFor(x.code)}
      aimOff={choosingTarget && x.code !== shooter && !plateFor(x.code)}
      buttons={plankButtons(x.code)}
      role={net ? netRole(x.code) : null}
      ready={readyOf(x.code)}
      onSelect={stable(`select:${x.code}`, () => x.side === bottom && mySeats.includes(x.code) && setSeatPick(x.code))}
      onDetails={stable(`details:${x.code}`, () => setSheet({ k: 'ship', code: x.code }))}
      onLegend={stable(`legend:${x.code}`, () => legendClick(x.code))}
      flashLegend={hints && x.side === bottom && mySeats.includes(x.code)}
    />
  );

  const handNode = () => seat ? (
    <Hand
      s={view}
      data={data}
      seat={seat}
      tabs={tabs}
      onTab={setSeatPick}
      offOf={offOf}
      chosen={chosenCard}
      noteOf={noteOf}
      onCard={(holder: string, code: string) => {
        if (mode.k === 'aim' && code !== HIDDEN && cardByCode(data, code).type === 'ЗАРЯД' && seatShip(s, holder)?.code === mode.shooter && chargeOk(holder, code, mode.shooter)) {
          setMode({ ...mode, charge: mode.charge === code ? null : code, chargeFrom: holder, paid: 0 });
          return;
        }
        // In the Reaction window a Reaction in the hand is chosen (again — unchosen) instead of opening it.
        if (myDecision && d!.kind === 'reactions' && cardByCode(data, code).type === 'РЕАКЦИЯ' && d!.seats.includes(holder)) {
          if (offOf(holder, code)) setSheet({ k: 'card', seat: holder, code });
          else setReactPick(reactPick?.card === code ? null : { seat: holder, card: code });
          return;
        }
        setSheet({ k: 'card', seat: holder, code });
      }}
      // V2: on a phone the first tap lifts a card, but the two choices above take it at once (the user's call)
      direct={(holder: string, code: string) =>
        code !== HIDDEN &&
        ((mode.k === 'aim' && cardByCode(data, code).type === 'ЗАРЯД' && seatShip(s, holder)?.code === mode.shooter && chargeOk(holder, code, mode.shooter)) ||
          (myDecision && d!.kind === 'reactions' && cardByCode(data, code).type === 'РЕАКЦИЯ' && d!.seats.includes(holder)))
      }
      onDiscard={(x) => setSheet({ k: 'discard', seat: x })}
      label={handLabel}
      note={captainNote}
      alarmOf={alarmOn ? alarmOf : null}
      folded={alarmFolded}
      actionsOf={liftActions}
    />
  ) : null;
  // «‹Союзник› готов — ход закончится, когда нажмёте вы»: by network, an ally of this device already pressed «Ход окончен».
  const allyReady =
    (net && myTurn ? Object.values(s.ships).find((x) => x.side === bottom && !x.sunk && !mySeats.includes(x.code) && net.ready.includes(x.code)) : undefined) ??
    e2eReady(s, bottom, seat);
  const botIcon: Record<string, string> = { faster: 'faster', skip: 'skip', pause: held ? 'play' : 'pause' };

  // «Быстрее · До конца · Пауза · Отменить» and «Ход окончен»: under the log ≥ 1280 px (A5: the hand gets the whole width
  // of the table), at the end of the hand row narrower.
  const pickNow = reactPick ? reactionNow(s, data, reactPick.seat, reactPick.card) : null;
  const handActions = chargeBtns ? (
    <div className="hand-actions charge-mode">{chargeBtns}</div>
  ) : alarmOn && !phone ? (
    <div className="hand-actions alarm-mode" style={{ ['--alarm-in' as string]: `${T.ui.alarmIn}ms` }}>
      <AlarmActions
        memo={!memoSeen.includes(bottom)}
        pickName={reactPick ? cardByCode(data, reactPick.card).name : null}
        now={pickNow?.ok ? pickNow.text : null}
        folded={alarmFolded}
        fuse={fuse}
        onSkip={skipReaction}
        onPlay={() => reactPick && act([{ type: 'react', seat: reactPick.seat, card: reactPick.card }])}
        onInfo={() => reactPick && setSheet({ k: 'card', seat: reactPick.seat, code: reactPick.card })}
        onFold={setAlarmFolded}
      />
    </div>
  ) : (
    <div className="hand-actions">
      {/* A5: «Быстрее · До конца · Пауза» (while a bot moves or a move is shown) and «Отменить» — round brass buttons */}
      <FxBusy fx={fx}>{(busy) => (
        <div className="round-row">
          {botBtnsOf(busy).map((b) => (
            <RoundButton key={b.key} b={b} icon={botIcon[b.key]} />
          ))}
          {net && mode.k !== 'ending' ? <Button b={remindBtn} className="small wide" /> : <RoundButton b={{ ...undoBtn, label: '↶ Отменить' }} icon="undo" className="undo wide" thin />}
        </div>
      )}</FxBusy>
      <OakButton b={endBtn} className={`end-turn ${myTurn && !useful && mode.k === 'idle' ? 'ready' : ''}`} />
      {allyReady && (
        <p className="ally-ready" data-testid="ally-ready">
          {/* A5Table.html: a green ring with a white tick, «„Месть“ готова — …» (the gender of the ship's name) */}
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="#3d8562" />
            <path d="M4.4 8.4 L7 11 L11.8 5.4" fill="none" stroke="#f2fbf4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          «{shipData(data, allyReady.code).nick}» {/[аяь]$/.test(shipData(data, allyReady.code).nick) ? 'готова' : 'готов'} — ход закончится, когда нажмёте вы
        </p>
      )}
    </div>
  );

  return (<>
    {perf.config.enabled && <PerfPanel />}
    <div
      // ui-press: the state of a sheet is a class of the nearest box of what it changes (.board, .middle, .board-bottom), not of
      // the root — only `decision-open` stays here: it is about the root itself (overflow: clip, decision-sheet.css)
      className={`game ${perf.classes} ${s.winner ? 'over' : ''} ${oakDock && dock ? 'decision-open' : ''} ${effects === 'simple' || simpleFx ? 'fx-simple' : ''} ${look.frame === 'bulwark' ? 'frame-bulwark' : ''} view-guns-${look.guns} view-hand-${look.hand} ${sheet?.k === 'log' ? 'book-open' : ''}`}
      data-testid="game"
      data-bottom={bottom}
      ref={gameRef}
    >
      {local && (
        <BotDriver fx={fx} local={local} version={version} stop={!!curtainSide || !!s.winner} held={held} speed={speed} fastTurn={fastTurn} turnKey={turnKey}
          banner={banner?.k ?? null} canHoldOf={canHoldOf} setHeld={setHeld} />
      )}
      {!local && <HoldReset fx={fx} held={held} canHoldOf={canHoldOf} setHeld={setHeld} />}
      <TableBackdrop look={look.hand} />
      <main className={`board ${alarmOn ? 'alarm-open' : ''} ${alarmOn && alarmFolded ? 'alarm-folded' : ''} ${dockSheet ? 'has-sheet' : ''}`} ref={boardRef}>
        <Shown fx={fx} real={s} keyOf={statusKey}>{(shown) => <StatusBar
          s={shown}
          data={data}
          fxHint={fx.hintStore}
          instruction={flash ?? (waitNote ? `Противник может ответить Реакцией… · ${instruction}` : instruction)}
          waiting={!myDecision || !!flash}
          onSea={() => setSheet({ k: 'sea' })}
          extra={wideLog ? null : toolButtons}
          chip={!wideLog}
          hold={<Shown fx={fx} real={view} keyOf={(x) => holdKey(x, top)}>{(shown, rev) => <TopHold side={top} s={shown} data={data} fxGen={rev} />}</Shown>}
          alarm={alarmOn && !flash ? <AlarmBar info={alarm!} /> : undefined}
        />}</Shown>
        {net && <NetBar game={net} />}
        <div className="sea-table" ref={seaRef}>
          <div className="sea-water" aria-hidden />
          <div className="planks top">{/* a plank is built again when what it shows changes (its revision rebuilds the tracks) */}<PlankRow fx={fx} view={view} stamp={tableInteraction} render={renderRow(top)} /></div>
          <div className={`middle ${dock ? 'has-dock' : ''}`} data-fx-gap>
            <BannerView data={data} banner={banner} />
            {dock && !oakDock && <div className={`dock ${dockSheet ? 'sheet-dock' : ''} ${alarmDock ? 'alarm-dock' : ''}`}>{dock}</div>}
            {/* Б1: a translucent line along the bottom of the open sea; the hint «выберите карту или действие» is in the top plaque already */}
            {!dock && !s.winner && !alarmOn && (
              <ShownLog fx={fx} log={game.log} over={!!s.winner}>{(shownLog) => {
                const lastEvent = lastEventOf(shownLog);
                return (lastEvent || offerInfo) && (
                  <button type="button" className="middle-info" ref={infoFlag} data-testid="middle-info" title={lastEvent ?? undefined} onClick={() => setSheet({ k: 'log' })} aria-label={`Открыть журнал. Последнее: ${lastEvent ?? ''}`}>
                    {offerInfo && <b data-testid="offer-info">{offerInfo}</b>}
                    {offerInfo && lastEvent && ' · '}
                    {lastEvent && <>Последнее: {lastEvent}</>}
                  </button>
                );
              }}</ShownLog>
            )}
          </div>
          <div className="planks bottom"><PlankRow fx={fx} view={view} stamp={tableInteraction} render={renderRow(bottom)} /></div>
          {alarm?.kind === 'volley' && alarm.shooter && alarm.target && <AlarmArrow box={seaRef} from={alarm.shooter} to={alarm.target} label={alarm.hit?.pill ?? null} />}
        </div>
        {/* the bottom of the table for the weather and the darkening of FX (sea.ts tableCtx: the last row of the board) — the
            Hold of the bottom team stands beside the hand on a laptop now (V1c), this empty row keeps the old edge */}
        <div className="team-row table-edge" aria-hidden />
        {phone && oakDock && dock && <div className="decision-dock">{dock}</div>}
        {/* under-window: a window (.sheet-backdrop) lies over the sheet «Заряд» — charge.css */}
        <div className={`board-bottom ${chargeSheet ? 'charge-open' : ''} ${chargeSheet && ((sheet && sheet.k !== 'log') || (net && missedLines(net).length > 0)) ? 'under-window' : ''}`}>
          {chargeSheet}
          {!phone && oakDock && dock && <div className="decision-dock">{dock}</div>}
          <Shown fx={fx} real={view} keyOf={(x) => holdKey(x, bottom)}>{(shown, rev) => <TeamRow side={bottom} s={shown} data={data} hands={null} regroup={regroupBtn(bottom)} hint={null} fxGen={rev} />}</Shown>
          <div className="hand-row" data-fx-hand>
            <MemoContent stamp={tableInteraction}>{handNode}</MemoContent>
            {!wideLog && handActions}
          </div>
        </div>
        <FxLayer fx={fx} />
      </main>
      <aside className="log-col">
        {wideLog && (
          <div className="log-tools">
            <Shown fx={fx} real={s} keyOf={statusKey}>{(shown) => <SeaChip s={shown} data={data} onSea={() => setSheet({ k: 'sea' })} />}</Shown>
            {toolButtons}
          </div>
        )}
        <div className="log-paper">
          <h2>Судовой журнал</h2>
          <ShownLog fx={fx} log={game.log} over={!!s.winner}>{(shownLog, freshFrom) => <LogList data={data} log={shownLog} fresh={freshFrom} onCard={stable('log-card', (code: string) => setSheet({ k: 'info', code }))} onSea={stable('log-sea', (code: string) => setSheet({ k: 'sea', code }))} />}</ShownLog>
          <div className="log-actions">
            <button className="brs-btn" onClick={() => setSheet({ k: 'log' })}>
              Весь журнал
            </button>
            <button className="brs-btn" onClick={downloadLog}>
              Скачать
            </button>
          </div>
        </div>
        {wideLog && handActions}
      </aside>
      <FxBusy fx={fx}>{(busy) => (
      <nav className={`bottom-bar ${canHoldOf(busy) ? 'has-pause' : ''}`}>
        {/* A5Phone: «Журнал» and «Правила» are square icons with a caption; «Ход окончен» says who is ready under its name */}
        <button className="btn tile" onClick={() => setSheet({ k: 'log' })}>
          <span className="tile-ic" aria-hidden dangerouslySetInnerHTML={{ __html: ROUND_ICON.log }} />
          Журнал
        </button>
        <button className="btn tile" onClick={() => setSheet({ k: 'rules' })}>
          <span className="tile-ic" aria-hidden dangerouslySetInnerHTML={{ __html: ROUND_ICON.rules }} />
          Правила
        </button>
        {canHoldOf(busy) && <RoundButton b={pauseBtn} icon={held ? 'play' : 'pause'} className="tool pause" capNarrow={held ? 'Дальше' : 'Пауза'} />}
        {botBusyOf(busy) ? <RoundButton b={botBtnsOf(busy)[1]} icon="skip" className="tool" capNarrow="До конца" /> : net && mode.k !== 'ending' ? <Button b={remindBtn} /> : <RoundButton b={undoBtn} icon="undo" className="tool undo" />}
        <OakButton
          b={endBtn}
          className={`end-turn ${myTurn && !useful && mode.k === 'idle' ? 'ready' : ''}`}
          sub={
            allyReady ? (
              <span className="oak-ready" data-testid="ally-ready-oak">
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" fill="#3d8562" />
                  <path d="M4.4 8.4 L7 11 L11.8 5.4" fill="none" stroke="#f2fbf4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                «{shipData(data, allyReady.code).nick}» {/[аяь]$/.test(shipData(data, allyReady.code).nick) ? 'готова' : 'готов'} — ждёт вас
              </span>
            ) : undefined
          }
        />
      </nav>
      )}</FxBusy>
      {net && <MissedSheet game={net} />}

      {sheet?.k === 'card' && (
        <CardDetail
          data={data}
          code={sheet.code}
          status={cardStatus(sheet.seat, sheet.code)}
          buttons={
            sheet.code.endsWith('-Л')
              ? myTurn && sheet.seat && s.ships[sheet.seat].side === bottom
                ? [
                    {
                      key: 'legend',
                      label: 'Разыграть Легенду',
                      primary: true,
                      disabled: legendOptions(s, data, sheet.seat).reason,
                      onClick: () => {
                        setSheet(null);
                        setMode({ k: 'legend', seat: sheet.seat, target: null, confirmed: false });
                      },
                    },
                  ]
                : []
              : cardButtons(sheet.seat, sheet.code)
          }
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.k === 'info' && <CardDetail data={data} code={sheet.code} status={null} buttons={[]} onClose={() => setSheet(sheet.back ? { k: sheet.back } : null)} />}
      {sheet?.k === 'ship' && <ShipSheet store={fx.store} s={view} data={data} code={sheet.code} onClose={() => setSheet(null)} onDiscard={() => setSheet({ k: 'discard', seat: sheet.code })} />}
      {sheet?.k === 'discard' && <DiscardSheet s={view} data={data} seat={sheet.seat} onClose={() => setSheet(null)} />}
      {sheet?.k === 'sea' && <SeaSheet store={fx.store} log={game.log} key={sheet.code ?? ''} s={view} data={data} code={sheet.code} onClose={() => setSheet(sheet.back ? { k: sheet.back } : null)} />}
      {sheet?.k === 'rules' && <RulesSheet data={data} onClose={() => setSheet(null)} />}
      {sheet?.k === 'log' && (
        <ShownLog fx={fx} log={game.log} over={!!s.winner}>{(shownLog, freshFrom) => <LogBook
          data={data}
          log={shownLog}
          fresh={freshFrom}
          ship={bookShip}
          onCard={(code) => setSheet({ k: 'info', code, back: 'log' })}
          onSea={(code) => setSheet({ k: 'sea', code, back: 'log' })}
          onDownload={downloadLog}
          onClose={() => setSheet(null)}
        />}</ShownLog>
      )}
      {sheet?.k === 'lastTurn' && (
        <SheetBox title={`Что было за ход ${SIDE_LABEL[other(bottom)].gen}`} onClose={() => setSheet(null)} wide testid="last-turn">
          <ShownLog fx={fx} log={game.log} over={!!s.winner}>{(shownLog, freshFrom) => <LogList
            data={data}
            log={enemyTurnLines(shownLog, other(bottom))}
            full={shownLog}
            fresh={freshFrom}
            onCard={(code) => setSheet({ k: 'info', code, back: 'lastTurn' })}
            onSea={(code) => setSheet({ k: 'sea', code, back: 'lastTurn' })}
          />}</ShownLog>
        </SheetBox>
      )}
      {confirm}
      {sheet?.k === 'settings' && (
        <SettingsSheet
          speed={speed}
          setSpeed={setSpeed}
          effects={effects}
          setEffects={setEffects}
          sound={sound}
          setSound={setSound}
          fastEnd={fastEnd}
          setFastEnd={setFastEnd}
          openHands={net ? null : openHands}
          setOpenHands={setOpenHands}
          hints={hintsAllowed ? hints : null}
          setHints={setHints}
          canConcede={!s.winner && (net ? mySeats.length > 0 : humans.length > 0) ? (net || humans.includes(bottom) ? bottom : humans[0]) : null}
          onConcede={() => {
            setSheet(null);
            setMode({ k: 'concede', side: net || humans.includes(bottom) ? bottom : humans[0] });
          }}
          newLabel={net ? 'Выйти из комнаты' : 'Новая партия'}
          onNew={() => {
            setSheet(null);
            setMode(net ? { k: 'exitRoom' } : { k: 'leave' });
          }}
          onDownloadLog={downloadLog}
          onView={setLook}
          onDownloadGame={downloadGame}
          onClose={() => setSheet(null)}
        />
      )}
      {s.winner && !endClosed && (
        <Suspense fallback={null}>
          <Victory
            s={s}
            data={data}
            record={endRecord}
            playMs={playMs()}
            onRematch={net ? (vote ? () => net.voteRematch(!vote.you) : null) : rematch}
            rematchLabel={rematchLabel}
            rematchNote={rematchNote}
            onNew={onExit}
            newLabel={net ? 'Выйти из комнаты' : undefined}
            onDownloadLog={downloadLog}
            onDownloadGame={downloadGame}
            onClose={() => setEndClosed(true)}
          />
        </Suspense>
      )}
    </div>
  </>);

  function cardStatus(holder: string, code: string): string | null {
    if (code.endsWith('-Л')) {
      const o = legendOptions(s, data, holder);
      const c = cardByCode(data, code);
      if (c.type !== 'ПРИКАЗ') return `Сыграть: когда ${nick(holder)} должна утонуть. Порох: ${s.teams[s.ships[holder].side].powder} из ${c.cost}`;
      return o.reason ? `Нельзя: ${o.reason}` : 'Можно сыграть сейчас';
    }
    if (!myDecision) return null;
    const o = cardHints.get(code) ?? playOptions(s, data, holder, code);
    return o.reason ? `Нельзя сыграть: ${o.reason}` : 'Можно сыграть сейчас';
  }
}

/** Why the device goes to the team: «ход Компании», «Реакция на Залп по „Мести“», «Тортуга»… */
function curtainReason(s: GameState, data: LocalGame['data'], kind: string): string {
  switch (kind) {
    case 'reactions':
      if (s.volley) return `Реакция на Залп по «${shipData(data, s.volley.target).nickDative}»`;
      return s.card ? `Реакция на «${cardByCode(data, s.card.card).name}»` : 'Реакция';
    case 'jack':
      return 'Джек ускользает?';
    case 'tortuga':
      return 'Тортуга';
    case 'choice': {
      const p = s.pending;
      if (p?.kind === 'choice' && p.what === 'dice') return 'тайный выбор — Кости лжеца';
      if (p?.kind === 'choice' && p.what === 'bell') return 'Колокол «Голландца»: сбросьте карту';
      return 'выбор карты';
    }
    default:
      return `ход ${SIDE_LABEL[s.active].gen}`;
  }
}

/**
 * The e2e build only (vite mode «e2e», as «?fxScene»): «&hand=N» shows N cards in every hand of the bottom team's ships that
 * has cards — taken from its deck, for the layout tests of the hand (3, 5, 8 cards); the game itself does not change.
 */
function e2eHand(v: GameState): GameState {
  if (import.meta.env.MODE !== 'e2e') return v;
  const n = Number(new URLSearchParams(location.search).get('hand'));
  if (!n) return v;
  const out = structuredClone(v);
  for (const ship of Object.values(out.ships)) {
    if (!ship.hand.length || ship.hand.every((c) => c === HIDDEN)) continue;
    const pool = [...ship.hand, ...ship.deck.filter((c) => c !== HIDDEN), ...ship.discard];
    ship.hand = Array.from({ length: n }, (_, i) => pool[i % pool.length]);
  }
  return out;
}

/** The e2e build only: «&ready=1» shows the line «‹Союзник› готов» under «Ход окончен» (the other ship of the bottom team). */
function e2eReady(s: GameState, side: string, seat: string | null) {
  if (import.meta.env.MODE !== 'e2e' || !new URLSearchParams(location.search).get('ready')) return undefined;
  return Object.values(s.ships).find((x) => x.side === side && !x.sunk && x.code !== seat);
}

// The stamp lists all game/interaction inputs above the curtain's early return: a render of Game with the same stamp
// reuses the subtree (the hand is drawn from the real view only).
const MemoContent = memo(function MemoContent({children}: {stamp: object; children: () => ReactNode}) {
  return <>{children()}</>;
}, (a,b) => a.stamp === b.stamp);

type LogLine = LocalGame['log'][number];

/** «busy» of the show as the attribute data-fx-busy of the root of the table: set by the snapshot, not by a render. */
function useBusyAttr(fx: FxQueue) {
  const store = fx.store;
  const off = useRef<(() => void) | null>(null);
  return useCallback((el: HTMLDivElement | null) => {
    off.current?.();
    off.current = null;
    if (!el) return;
    const sync = () => el.toggleAttribute('data-fx-busy', store.get().busy);
    sync();
    off.current = store.subscribe(sync);
  }, [store]);
}

/** A part that changes with «busy» of the show (the buttons «Быстрее», «До конца хода», «Пауза»). */
function FxBusy({ fx, children }: { fx: FxQueue; children: (busy: boolean) => ReactNode }) {
  return <>{children(useFxPart(fx, (x) => x.busy))}</>;
}

/** The bots of one screen move when the show is over: the effect lives here, so the end of a show does not render Game. */
function BotDriver({ fx, local, version, stop, held, speed, fastTurn, turnKey, banner, canHoldOf, setHeld }: {
  fx: FxQueue; local: LocalGame; version: number; stop: boolean; held: boolean; speed: Speed; fastTurn: string | null; turnKey: string;
  banner: string | null; canHoldOf: (busy: boolean) => boolean; setHeld: (v: boolean) => void;
}) {
  const busy = useFxPart(fx, (x) => x.busy);
  useEffect(() => {
    if (stop || held || !local.botToMove()) return;
    const instant = speed === 'instant' || fastTurn === turnKey;
    if ((busy || banner) && !instant) return;
    const t = setTimeout(
      () => {
        let n = 0;
        do local.botStep();
        while (instant && ++n < 40 && local.botToMove() && (speed === 'instant' || `${local.state.round}:${local.state.active}` === fastTurn));
      },
      instant ? 0 : SPEEDS[speed].ms,
    );
    return () => clearTimeout(t);
  }, [version, stop, speed, fastTurn, turnKey, local, busy, banner, held]);
  return <HoldReset fx={fx} held={held} canHoldOf={canHoldOf} setHeld={setHeld} busy={busy} />;
}

/** «Пауза» ends as soon as there is nothing to hold (the game asks this device). */
function HoldReset({ fx, held, canHoldOf, setHeld, busy }: { fx: FxQueue; held: boolean; canHoldOf: (busy: boolean) => boolean; setHeld: (v: boolean) => void; busy?: boolean }) {
  const live = useFxPart(fx, (x) => x.busy);
  const canHold = canHoldOf(busy ?? live);
  useEffect(() => {
    if (held && !canHold) setHeld(false);
  }, [held, canHold, setHeld]);
  return null;
}

/** The displayed fields of the status bar and the sea chip; the Hold of a side. A part is drawn again when they change. */
const statusKey = (x: GameState) => `${x.round}|${x.active}|${x.sea?.current ?? ''}`;
const holdKey = (x: GameState, side: Side) => String(x.teams[side].powder);

/**
 * A part of the table drawn from the shown state: drawn again when its key (what it shows) or the epoch (a cut-off show)
 * changes. `rev` grows with the key: the kegs it rebuilds (PowderDots) lose what a clip did to them by hand.
 */
function Shown({ fx, real, keyOf, children }: { fx: FxQueue; real: GameState; keyOf: (shown: GameState) => string; children: (shown: GameState, rev: number) => ReactNode }) {
  const key = useFxPart(fx, (x) => `${keyOf(fx.store.shown(real))}|${x.epoch}`);
  const rev = useRef({ key, gen: fx.store.get().gen });
  if (rev.current.key !== key) rev.current = { key, gen: fx.store.get().gen };
  return <>{children(fx.store.shown(real), rev.current.gen)}</>;
}

/** The log as it is shown (A4): the lines of an action appear when its clips are played; at the end of the game — all. */
function ShownLog({ fx, log, over, children }: { fx: FxQueue; log: LogLine[]; over: boolean; children: (shown: LogLine[], fresh: number) => ReactNode }) {
  const from = useFxPart(fx, (x) => (over ? null : x.logFrom));
  const shown = useMemo(() => (from == null ? log : log.filter((l) => l.action < from)), [log, from, log.length]);
  // The lines of the newest action shown are highlighted.
  return <>{children(shown, shown.at(-1)?.action ?? 0)}</>;
}

/** The display fields of a ship: its plank is drawn again (and its tracks rebuilt) when they change. */
const shipKey = (x: GameState['ships'][string]) => `${x.pos}|${x.tracks.hull},${x.tracks.sails},${x.tracks.guns},${x.tracks.crew}|${x.fires}|${+x.sunk}${+x.submerged}${+x.legend}|${x.souls}`;

/**
 * A row of planks drawn from the shown state. The row follows every snapshot; a plank (memo, Table.tsx) is drawn again
 * only when what it shows changes. The render function comes from the last render of Game with the same stamp.
 */
const PlankRow = memo(function PlankRow({ fx, view, render }: {
  fx: FxQueue; view: GameState; stamp: object;
  render: (tableView: GameState, rev: (code: string) => number, hidden: Record<string, string[]>) => ReactNode;
}) {
  const snap = useFxPart(fx, (x) => x);
  // the shown state of this row: one object per real state and snapshot (the store keeps one entry for every reader of
  // it, so between two renders of the table it may hand out an equal copy — a plank would take it for a change, ui-press)
  const shownRef = useRef<{ view: GameState; gen: number; display: FxSnapshot['display']; out: GameState } | null>(null);
  const m = shownRef.current;
  if (!m || m.view !== view || m.gen !== snap.gen || m.display !== snap.display) shownRef.current = { view, gen: snap.gen, display: snap.display, out: fx.store.shown(view) };
  const tableView = shownRef.current!.out;
  const revs = useRef(new Map<string, { key: string; gen: number }>());
  const rev = (code: string) => {
    const key = `${shipKey(tableView.ships[code])}|${snap.epoch}`;
    const r = revs.current.get(code);
    if (r && r.key === key) return r.gen;
    revs.current.set(code, { key, gen: snap.gen });
    return snap.gen;
  };
  return <>{render(tableView, rev, snap.hidden)}</>;
}, (a, b) => a.stamp === b.stamp && a.view === b.view);
