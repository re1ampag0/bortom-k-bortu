// The table on one screen: who sits at the device, what they see (viewFor), what is expected from them, and the
// bots moving one action at a time. The engine answers every question about the rules (hints.ts).
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  abilityButtons,
  cardNeeds,
  hasUsefulMoves,
  heartTargets,
  legendOptions,
  playOptions,
  previewReaction,
  previewVolley,
  refusal,
  tryAction,
  unfiredShips,
  volleyTargets,
  type VolleyTarget,
} from '../../engine/hints';
import { matchTotals, type MatchSetup } from '../../engine/match';
import { createRng } from '../../engine/rng';
import { ABILITY, cardByCode, hasAbility, isCaptain, seatShip, seatsOf, shipData, type Action, type GameState } from '../../engine/state';
import type { Side } from '../../engine/types';
import { HIDDEN, viewFor } from '../../engine/view';
import type { LocalGame } from '../../net/local';
import type { NetGame } from '../../net/ws';
import { download, loadSettings, storeSave, storeSettings, type Speed } from '../storage';
import { Curtain } from './Curtain';
import { Hand, type HandTab } from './Hand';
import { CardDetail, DiscardSheet, EndScreen, LogList, RulesSheet, Sheet as SheetBox, SeaSheet, SettingsSheet, ShipSheet } from './Overlays';
import {
  CardParamsPanel,
  ChoicePanel,
  ConfirmPanel,
  JackPanel,
  PlansPanel,
  ReactionPanel,
  ReactionWaitPanel,
  TortugaPanel,
  VolleyPanel,
  chargeCandidates,
  plateLabel,
  volleyOrder,
  type AimMode,
  type CardMode,
} from './Panels';
import { MissedSheet, NetBar, OfferPanel, netDock } from './NetParts';
import { BannerView, useBanners } from './Banners';
import { ShowLayer, useShowQueue } from './Show';
import { instantUrl } from '../start/motion';
import { playTurnSound } from '../sound';
import { Button, Plank, StatusBar, TeamRow, type Btn, type Plate } from './Table';
import { enemyTurnLines } from './lastTurn';
import { decideVerb, reactionWait } from './clarity';
import { SIDE_LABEL, SPEEDS } from './text';

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
  const version = useSyncExternalStore(
    useCallback((cb) => game.subscribe(cb), [game]),
    () => game.version,
  );
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
  const view = useMemo(() => (net ? s : viewFor(s, viewer)), [version, bottom, openHands]);
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
  const [sheet, setSheet] = useState<Sheet>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [fastTurn, setFastTurn] = useState<string | null>(null);
  /** «Пауза»: the show on this device stops; on one screen the bots wait too (by network the server plays them). */
  const [held, setHeld] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [freshFrom, setFreshFrom] = useState(0);
  const allSeats = Object.values(s.ships).filter((x) => x.side === bottom).map((x) => x.code);
  const [seatPick, setSeatPick] = useState<string | null>(null);
  const seat = seatPick && allSeats.includes(seatPick) ? seatPick : (d && d.side === bottom ? d.seats.find((x) => mySeats.includes(x)) : null) ?? mySeats[0] ?? allSeats[0];

  const act = (action: Action | Action[]): boolean => {
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
    setSheet(null);
    return true;
  };

  // ——— Effects: bots, autosave, title, toast, wake lock ———
  const turnKey = `${s.round}:${s.active}`;
  // Banners one after another: the sea card, «Ваш ход», the summary of the start of the turn (docs/TZ.md, п. 2).
  const banner = useBanners({
    recent: game.recent,
    version,
    data,
    bottom,
    mine: net ? mySeats.length > 0 : game.setup.players[bottom] === 'human',
    enabled: speed !== 'instant' && !instantUrl(),
    // A new game: the first sea card and the first turn too.
    start: (net ? net.actions : local!.actions.length) === 0 && !s.winner ? { sea: s.sea?.current ?? null, active: s.active } : null,
    paused: !!curtainSide,
  });
  const toast = banner?.k === 'summary' ? banner.text : null;
  // The show of the enemy's and the bots' actions, one at a time; the bots wait for it.
  const show = useShowQueue({
    game,
    version,
    viewer,
    mySeats,
    bottom,
    enabled: speed !== 'instant' && !instantUrl() && fastTurn !== turnKey && !curtainSide,
    speed,
    myDecision,
    paused: !!banner && banner.k !== 'summary',
    hold: held,
  });
  useEffect(() => {
    if (!local || curtainSide || s.winner || held || !local.botToMove()) return;
    const instant = speed === 'instant' || fastTurn === turnKey;
    if ((show.busy || (banner && banner.k !== 'summary')) && !instant) return;
    const t = setTimeout(
      () => {
        let n = 0;
        do local.botStep();
        while (instant && ++n < 40 && local.botToMove() && (speed === 'instant' || `${local.state.round}:${local.state.active}` === fastTurn));
      },
      instant ? 0 : SPEEDS[speed].ms,
    );
    return () => clearTimeout(t);
  }, [version, curtainSide, speed, fastTurn, turnKey, local, s.winner, show.busy, banner?.k, held]);

  const botBusy = (!!local && !!d && local.isBot(d.side) && !s.winner) || show.busy;
  // The pause never keeps a decision of this device waiting: it ends as soon as the game asks the player.
  const canHold = botBusy && !myDecision;
  useEffect(() => {
    if (held && !canHold) setHeld(false);
  }, [held, canHold]);

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
    // The lines of the newest action are highlighted in the log.
    const last = game.log.at(-1);
    if (last) setFreshFrom(last.action);
  }, [version, game]);

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
    const t = setTimeout(() => act(mode.action), endMs);
    return () => clearTimeout(t);
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

  // ——— Curtain ———
  if (curtainSide) {
    const summary = game.log
      .slice(seen[curtainSide])
      .filter((l) => l.kind === 'action' || l.kind === 'damage' || l.kind === 'round')
      .map((l) => l.text)
      .slice(-8);
    return (
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
    );
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

  // ——— End of the turn: «Залп не дан…» → Plans of the Pearl → endTurn ———
  const endFlow = (step: 'start' | 'confirmed') => {
    if (!myTurn) return;
    if (step === 'start' && hints) {
      const unfired = unfiredShips(s, data, bottom);
      if (unfired.length > 0) {
        setMode({ k: 'confirmEnd', text: `Залп не дан (${unfired.map(nick).join(', ')}), в Трюме ${s.teams[bottom].powder} Пороха. Закончить ход?` });
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
  const columns = (side: Side) => {
    const ships = Object.values(view.ships).filter((x) => x.side === side);
    const alive = ships.filter((x) => !x.sunk);
    const cols: (typeof ships[number] | null)[] = [null, null];
    for (const x of alive) cols[x.pos] = x;
    for (const x of ships.filter((y) => y.sunk)) cols[cols[x.pos] ? 1 - x.pos : x.pos] = x;
    return cols.filter((x): x is NonNullable<typeof x> => !!x);
  };

  const plateFor = (code: string): Plate | null => {
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

  const plankButtons = (code: string): Btn[] => {
    const ship = s.ships[code];
    if (!myTurn || ship.sunk || ship.side !== bottom || !mySeats.includes(code)) return [];
    const params = shipData(data, code);
    const vt = volleyTargets(s, data, { ship: code });
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

  const regroupBtn = (side: Side): Btn | null => {
    if (side !== bottom || !myTurn) return null;
    const r = tryAction(s, { type: 'regroup', side }, data);
    const cost = r.ok ? r.events.filter((e) => e.type === 'powderSpent').reduce((n, e) => n + (e.type === 'powderSpent' ? e.amount : 0), 0) : data.rules.regroupCost;
    return { key: 'regroup', label: `Перестроение · ${cost}`, disabled: r.ok ? null : r.reason, onClick: () => act({ type: 'regroup', side }) };
  };

  const jointHint = (side: Side): string | null => {
    const t = s.turn;
    if (!myTurn || side !== bottom || !t.firstTarget || t.jointUsed || !t.firstShooter) return null;
    const ally = Object.values(s.ships).find((x) => x.side === side && x.code !== t.firstShooter && !x.sunk);
    if (!ally || (t.volleys[ally.code] ?? 0) > 0 || s.ships[t.firstTarget].sunk) return null;
    return `совместный залп по «${shipData(data, t.firstTarget).nickDative}» даст ${nick(ally.code)} +${data.rules.jointBonus}`;
  };

  // ——— The panel in the middle (laptop) or in place of the hand (phone) ———
  let dock: React.ReactNode = null;
  // Card choices, «Тортуга» and the Plans are bottom sheets on a phone; the Volley and the Reactions stay in the middle.
  let dockSheet = false;
  const cancel = () => setMode({ k: 'idle' });
  /** The enemy decides on a Reaction to this device's Volley or card (a person sits here). */
  const waitReaction =
    !s.winner && !!d && d.kind === 'reactions' && d.side !== bottom && !myDecision && (net ? mySeats.length > 0 : game.setup.players[bottom] === 'human');
  if (s.winner) dock = null;
  else if (myDecision && d!.kind === 'reactions') {
    dock = (
      <ReactionPanel
        s={s}
        data={data}
        seats={myDeciding}
        pick={reactPick}
        memo={!memoSeen.includes(bottom)}
        onAct={(a) => act(a)}
        onPick={setReactPick}
        onInfo={(holder, code) => setSheet({ k: 'card', seat: holder, code })}
      />
    );
  } else if (myDecision && d!.kind === 'jack') {
    dock = <JackPanel s={s} data={data} ship={d!.seats[0]} onAct={(a) => act(a)} />;
  } else if (myDecision && d!.kind === 'tortuga') {
    dockSheet = true;
    dock = <TortugaPanel key={turnKey} s={s} data={data} side={d!.side} onAct={(a) => act(a)} />;
  } else if (myDecision && d!.kind === 'choice') {
    dockSheet = true;
    dock = <ChoicePanel key={`${version}`} s={s} data={data} seat={myDeciding[0]} onAct={(a) => act(a)} onSea={(code) => setSheet({ k: 'sea', code })} />;
  } else if (myTurn) {
    if (mode.k === 'aim') {
      const charges = chargeCandidates(sAim, data, mode.shooter)
        .filter((o) => chargeOk(o.from, o.card, mode.shooter))
        .map((o) => ({ ...o, offered: !mySeats.includes(o.from) }));
      dock = <VolleyPanel s={sAim} data={data} hints={hints} mode={mode} charges={charges} setMode={setMode} onFire={(a) => act(a)} onCancel={cancel} />;
    }
    else if (mode.k === 'card') dock = <CardParamsPanel s={s} data={data} mode={mode} setMode={setMode} onAct={(a) => act(a)} onCancel={cancel} />;
    else if (mode.k === 'legend') {
      const c = cardByCode(data, `${mode.seat}-Л`);
      const opts = legendOptions(s, data, mode.seat);
      const needsTarget = opts.actions.every((a) => a.type === 'playLegend' && a.target);
      dock = !mode.confirmed ? (
        <ConfirmPanel
          title={`Разыграть Легенду «${c.name}»?`}
          sub={`${c.big}. Легенда играется один раз за партию.`}
          yes={`Сыграть · ${c.soul ? `${c.soul} Д` : `${c.cost} П`}`}
          onYes={() => (needsTarget ? setMode({ ...mode, confirmed: true }) : act(opts.actions[0]))}
          onNo={cancel}
          testid="legend-confirm"
        />
      ) : (
        <ConfirmPanel title={`«${c.name}»: выберите цель на столе`} sub={c.big} yes="Отмена" onYes={cancel} onNo={cancel} />
      );
    } else if (mode.k === 'confirmEnd') {
      dock = <ConfirmPanel title={mode.text} yes="Закончить ход" no="Вернуться" onYes={() => endFlow('confirmed')} onNo={cancel} testid="confirm-end" />;
    } else if (mode.k === 'ending') {
      dock = (
        <section className="panel ending" data-testid="ending" style={{ ['--ending-ms' as string]: `${endMs}ms` }}>
          <div className="panel-head">
            <b>Ход окончен</b>
            <span className="panel-sub">
              ход перейдёт к {SIDE_LABEL[other(bottom)].dat} через {endMs / 1000} с
            </span>
            <button className="btn" data-testid="ending-cancel" onClick={cancel}>
              Отменить
            </button>
          </div>
        </section>
      );
    } else if (mode.k === 'plans') {
      dockSheet = true;
      dock = <PlansPanel s={s} data={data} seat={mode.seat} onDone={(plans) => finishTurn({ type: 'endTurn', side: bottom, plans })} onCancel={cancel} />;
    } else if (mode.k === 'idle' && net) {
      const mine = mySeats.map(offerOf).find((o) => !!o);
      if (mine) {
        dock = (
          <OfferPanel title={`Предложено: «${cardByCode(data, mine.card).name}» для Залпа корабля ${nick(mine.to)}`} onWithdraw={() => net.unoffer(mine.from)} />
        );
      }
    }
  } else if (waitReaction) {
    // The attacker sees what was fired and who decides; never which enemy ship holds a Reaction.
    const w = reactionWait(s, data, d!.side, d!.seats.map((x) => ({ bot: botSeat(x), name: net ? net.nameOf(x) : null })));
    dock = <ReactionWaitPanel line={w.line} who={w.who} />;
  } else if (net && !s.winner) {
    dock = netDock(net, mySeats, bottom, nick);
  }
  if (mode.k === 'concede') {
    const allyPeople = net ? Object.values(s.ships).some((x) => x.side === mode.side && !mySeats.includes(x.code) && !net.isBotSeat(x.code)) : false;
    dock = (
      <ConfirmPanel
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
    dock = (
      <ConfirmPanel
        title="Выйти из комнаты?"
        sub={s.winner ? 'Партия окончена.' : 'Ваш корабль останется на месте: создатель комнаты сможет заменить вас ботом.'}
        yes="Выйти"
        onYes={onExit}
        onNo={cancel}
      />
    );
  } else if (mode.k === 'leave') {
    dock = (
      <ConfirmPanel
        title="Начать новую партию?"
        sub="Текущая партия останется в автосохранении, пока вы не начнёте новую."
        yes="Новая партия"
        onYes={onExit}
        onNo={cancel}
      />
    );
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

  // ——— The middle at rest: the last event ———
  const lastEvent = [...game.log].reverse().find((l) => l.kind === 'action' || l.kind === 'damage')?.text ?? null;
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
      return { seat: x, label: `${shipData(data, x).nick}${s.active === bottom && x === seat ? ` · ${played} из ${limit}` : ''}`, dot };
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
    if (d!.kind === 'reactions' && c.type === 'РЕАКЦИЯ' && d!.seats.includes(seat)) {
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
  const undoBtn: Btn = { key: 'undo', label: '↶', disabled: undoWhy, onClick: () => (local?.undo(), setMode({ k: 'idle' })), testid: 'undo' };
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
    label: myTurn || s.winner || !d ? 'Ход окончен' : `Сейчас ход ${SIDE_LABEL[s.active].gen}`,
    primary: true,
    disabled: myTurn ? (mode.k === 'idle' ? null : 'Сначала закончите или отмените текущее действие') : 'Сейчас не ваш ход',
    onClick: () => endFlow('start'),
    testid: 'end-turn',
  };
  // «Пауза», «Быстрее» and «До конца хода» while a bot moves or a move is shown; the last two skip the show.
  const pauseBtn: Btn = {
    key: 'pause',
    label: held ? '▶ Дальше' : '⏸ Пауза',
    short: held ? '▶' : '⏸',
    onClick: () => setHeld(!held),
    testid: 'pause-show',
  };
  const botBtns: Btn[] = botBusy
    ? [
        {
          key: 'faster',
          label: 'Быстрее',
          onClick: () => {
            setHeld(false);
            show.skip();
            setSpeed(speed === 'slow' ? 'normal' : speed === 'normal' ? 'fast' : 'instant');
          },
        },
        {
          key: 'skip',
          label: 'До конца хода',
          onClick: () => {
            setHeld(false);
            show.skip();
            setFastTurn(turnKey);
          },
          testid: 'skip-turn',
        },
        ...(canHold ? [pauseBtn] : []),
      ]
    : [];

  const toolButtons = (
    <>
      <button className="btn small wide log-toggle" onClick={() => setSheet({ k: 'log' })}>
        Журнал
      </button>
      <button className="btn small wide" onClick={() => setSheet({ k: 'rules' })}>
        Правила
      </button>
      <button className="btn small icon" onClick={() => setSheet({ k: 'settings' })} aria-label="Настройки" data-testid="settings-btn">
        ⚙
      </button>
    </>
  );

  /** By network: «Вы», the ally's name, «Бот» on the planks (docs/TZ.md, «Стол»). */
  function netRole(code: string): string | null {
    if (!net) return null;
    if (net.isBotSeat(code)) return 'Бот';
    if (mySeats.includes(code)) return 'Вы';
    return net.nameOf(code);
  }
  const fileName = net ? `bortom-k-bortu-${net.room.code}` : `bortom-k-bortu-${game.setup.game.seed}`;
  const downloadLog = () => download(`${fileName}.txt`, game.log.map((l) => (l.kind === 'round' ? `\n${l.text}` : l.text)).join('\n'));
  // By network the record (every card) comes from the server, and only after the end of the game.
  const downloadGame = local
    ? () => download(`${fileName}.json`, JSON.stringify(local.record(), null, 1), 'application/json')
    : net && s.winner
      ? () => net.requestRecord((r) => download(`${fileName}.json`, JSON.stringify(r, null, 1), 'application/json'))
      : null;
  const vote = net?.room.rematch ?? null;
  const rematchLabel = vote ? (vote.you ? `Отменить реванш (согласны ${vote.agreed} из ${vote.need})` : `Реванш (согласны ${vote.agreed} из ${vote.need})`) : undefined;
  const totalsOf = () => (net ? net.totals : local ? matchTotals(data, local.setup, local.actions) : null);
  const rematch = () => {
    const seed = createRng((Date.now() ^ game.setup.game.seed) >>> 0).int(2 ** 31 - 1) + 1;
    const { positions: _positions, ...rest } = game.setup.game;
    onRestart({ ...game.setup, game: { ...rest, seed } });
  };

  const top = other(bottom);
  const handsOf = (side: Side) => Object.values(view.ships).filter((x) => x.side === side && seatShip(view, x.code)).map((x) => x.hand.length);
  const decidingSeats = d && !s.winner ? d.seats : [];
  const shooter = mode.k === 'aim' ? mode.shooter : (s.volley?.shooter ?? null);
  const targeted = mode.k === 'aim' ? mode.target : mode.k === 'card' ? mode.target : (s.volley?.target ?? null);
  // The ship the card repairs, as the engine decides it: framed green while the card panel is open.
  const repairing = mode.k === 'card' ? cardNeeds(s, data, mode.seat, mode.card, mode.ship ? { ship: mode.ship } : {}).repairShip : null;

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

  const renderPlank = (x: (typeof view.ships)[string]) => (
    <Plank
      key={x.code}
      s={view}
      data={data}
      ship={x}
      own={x.side === bottom}
      selected={x.side === bottom && x.code === seat && tabs.length > 1}
      awaiting={decidingSeats.includes(x.code) && !botSeat(x.code) && !(net && d?.kind === 'turn' && net.ready.includes(x.code))}
      targeted={targeted === x.code}
      shooter={shooter === x.code}
      repairing={repairing === x.code}
      plate={plateFor(x.code)}
      buttons={plankButtons(x.code)}
      role={net ? netRole(x.code) : null}
      ready={readyOf(x.code)}
      onSelect={() => x.side === bottom && mySeats.includes(x.code) && setSeatPick(x.code)}
      onDetails={() => setSheet({ k: 'ship', code: x.code })}
      onLegend={() => legendClick(x.code)}
      flashLegend={hints && x.side === bottom && mySeats.includes(x.code)}
    />
  );

  return (
    <div className={`game ${dock ? 'has-dock' : ''} ${dockSheet ? 'has-sheet' : ''} ${s.winner ? 'over' : ''}`} data-testid="game" data-bottom={bottom}>
      <StatusBar s={s} data={data} instruction={flash ?? instruction} waiting={!myDecision || !!flash} onSea={() => setSheet({ k: 'sea' })} extra={toolButtons} />
      {net && <NetBar game={net} />}
      {net && <MissedSheet game={net} />}
      <ShowLayer data={data} step={show.step} decisionOpen={!!d && (d.kind === 'reactions' || d.kind === 'choice' || d.kind === 'jack' || d.kind === 'tortuga')} />
      <BannerView data={data} banner={banner} />
      <main className="board">
        <TeamRow side={top} s={view} data={data} hands={handsOf(top)} regroup={null} hint={null} />
        <div className="planks top">{columns(top).map(renderPlank)}</div>
        <div className="middle" data-fx-gap>
          {toast && (
            <div className="toast" data-testid="turn-summary">
              {toast}{' '}
              <button className="toast-more" onClick={() => setSheet({ k: 'lastTurn' })} data-testid="summary-more">
                Подробнее
              </button>
            </div>
          )}
          {dock && <div className={`dock ${dockSheet ? 'sheet-dock' : ''}`}>{dock}</div>}
          {!dock && !s.winner && (lastEvent || (myTurn && mode.k === 'idle')) && (
            <p className="middle-info" data-testid="middle-info">
              {offerInfo && (
                <>
                  <b data-testid="offer-info">{offerInfo}</b>
                  <br />
                </>
              )}
              {lastEvent && <>Последнее: {lastEvent}</>}
              {lastEvent && myTurn && mode.k === 'idle' && <br />}
              {myTurn && mode.k === 'idle' && 'Нажмите карту или «Залп».'}
            </p>
          )}
        </div>
        <div className="planks bottom">{columns(bottom).map(renderPlank)}</div>
        <TeamRow side={bottom} s={view} data={data} hands={null} regroup={regroupBtn(bottom)} hint={jointHint(bottom)} />
        <div className="hand-row" data-fx-hand>
          {seat && (
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
              onDiscard={(x) => setSheet({ k: 'discard', seat: x })}
              label={handLabel}
              note={captainNote}
            />
          )}
          <div className="hand-actions">
            {botBtns.map((b) => (
              <Button key={b.key} b={b} className="small" />
            ))}
            {net ? <Button b={remindBtn} className="wide" /> : <Button b={{ ...undoBtn, label: '↶ Отменить' }} className="undo wide" />}
            <Button b={endBtn} className={`end-turn ${myTurn && !useful && mode.k === 'idle' ? 'ready' : ''}`} />
          </div>
        </div>
      </main>
      <aside className="log-col">
        <h2>Журнал</h2>
        <LogList data={data} log={game.log} fresh={freshFrom} onCard={(code) => setSheet({ k: 'info', code })} onSea={(code) => setSheet({ k: 'sea', code })} />
        <div className="log-actions">
          <button className="btn small" onClick={() => setSheet({ k: 'log' })}>
            Весь журнал
          </button>
          <button className="btn small" onClick={downloadLog}>
            Скачать
          </button>
        </div>
      </aside>
      <nav className={`bottom-bar ${canHold ? 'has-pause' : ''}`}>
        <button className="btn" onClick={() => setSheet({ k: 'log' })}>
          Журнал
        </button>
        <button className="btn" onClick={() => setSheet({ k: 'rules' })}>
          Правила
        </button>
        {canHold && <Button b={pauseBtn} className="pause" />}
        {botBusy ? <Button b={botBtns[1]} /> : net ? <Button b={remindBtn} /> : <Button b={undoBtn} className="undo" />}
        <Button b={endBtn} className={`end-turn ${myTurn && !useful && mode.k === 'idle' ? 'ready' : ''}`} />
      </nav>

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
      {sheet?.k === 'ship' && <ShipSheet s={view} data={data} code={sheet.code} onClose={() => setSheet(null)} onDiscard={() => setSheet({ k: 'discard', seat: sheet.code })} />}
      {sheet?.k === 'discard' && <DiscardSheet s={view} data={data} seat={sheet.seat} onClose={() => setSheet(null)} />}
      {sheet?.k === 'sea' && <SeaSheet key={sheet.code ?? ''} s={view} data={data} code={sheet.code} onClose={() => setSheet(sheet.back ? { k: sheet.back } : null)} />}
      {sheet?.k === 'rules' && <RulesSheet data={data} onClose={() => setSheet(null)} />}
      {sheet?.k === 'log' && (
        <div className="sheet-backdrop" onClick={() => setSheet(null)}>
          <section className="sheet sheet-wide" onClick={(e) => e.stopPropagation()} data-testid="log-sheet">
            <header className="sheet-head">
              <b>Журнал</b>
              <span>
                <button className="btn small" onClick={downloadLog}>
                  Скачать
                </button>{' '}
                <button className="btn small close" onClick={() => setSheet(null)} aria-label="Закрыть">
                  ✕
                </button>
              </span>
            </header>
            <div className="sheet-body">
              <LogList
                data={data}
                log={game.log}
                fresh={freshFrom}
                onCard={(code) => setSheet({ k: 'info', code, back: 'log' })}
                onSea={(code) => setSheet({ k: 'sea', code, back: 'log' })}
              />
            </div>
          </section>
        </div>
      )}
      {sheet?.k === 'lastTurn' && (
        <SheetBox title={`Что было за ход ${SIDE_LABEL[other(bottom)].gen}`} onClose={() => setSheet(null)} wide testid="last-turn">
          <LogList
            data={data}
            log={enemyTurnLines(game.log, other(bottom))}
            fresh={freshFrom}
            onCard={(code) => setSheet({ k: 'info', code, back: 'lastTurn' })}
            onSea={(code) => setSheet({ k: 'sea', code, back: 'lastTurn' })}
          />
        </SheetBox>
      )}
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
          onDownloadGame={downloadGame}
          onClose={() => setSheet(null)}
        />
      )}
      {s.winner && !endClosed && (
        <EndScreen
          s={s}
          totals={totalsOf() ?? { ПИРАТЫ: { damage: 0, income: 0, spent: 0 }, КОМПАНИЯ: { damage: 0, income: 0, spent: 0 } }}
          onRematch={net ? (vote ? () => net.voteRematch(!vote.you) : null) : rematch}
          rematchLabel={rematchLabel}
          onNew={onExit}
          newLabel={net ? 'Выйти из комнаты' : undefined}
          onDownloadLog={downloadLog}
          onDownloadGame={downloadGame}
          onClose={() => setEndClosed(true)}
        />
      )}
    </div>
  );

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
