// The show of an action, one at a time (docs/TZ.md, «Очередь хода и ожидание», п. 4): the card played large in the
// middle, a Volley as an arrow from the shooter to the target with the breakdown of its damage, «−3 Корпус» over a
// plank. Built only from events the viewer may see (viewFor / eventsFor): a hidden card is never shown.
import { TRACK_NAME } from '../../engine/hints';
import type { Action, GameEvent, Term } from '../../engine/state';
import type { Track } from '../../engine/types';
import { HIDDEN } from '../../engine/view';

export interface Float {
  ship: string;
  text: string;
  /** Damage is red; the rest (a repair, a cancelled Volley) is neutral. */
  bad: boolean;
}

export type ShowStep =
  | { k: 'card'; card: string; ship: string; target: string | null; kind: 'card' | 'reaction' | 'legend'; floats: Float[] }
  | { k: 'volley'; shooter: string; target: string; damage: number; track: Track; terms: Term[] | null; diagonal: boolean; floats: Float[] }
  | { k: 'effect'; effect: 'swap' | 'dive' | 'surface' | 'sink'; ship: string; label: string; floats: Float[] }
  /** Only numbers over the planks (a Fire, the sea, the result of a Volley resolved by someone's answer). */
  | { k: 'floats'; floats: Float[] };

/** A recent action as the table receives it: its number in the game, who made it and what the viewer saw. */
export interface Recent {
  n: number;
  action: Action;
  by: 'human' | 'bot';
  events: GameEvent[];
}

/**
 * Steps of one action. `full` — the card and the Volley are shown (an action of the enemy or of a bot); otherwise only
 * the numbers over the planks (the player saw their own action being made).
 */
export function showSteps(events: GameEvent[], full: boolean): ShowStep[] {
  const steps: ShowStep[] = [];
  let floats: Float[] | null = null;
  const current = (): Float[] => {
    if (floats) return floats;
    const step: ShowStep = { k: 'floats', floats: [] };
    steps.push(step);
    floats = step.floats;
    return floats;
  };
  const add = (f: Float) => current().push(f);

  for (const e of events) {
    switch (e.type) {
      case 'cardPlayed':
      case 'reaction':
      case 'legendPlayed': {
        if (!full || e.card === HIDDEN) break;
        const ship = e.type === 'legendPlayed' ? e.seat : e.ship;
        const target = e.type === 'legendPlayed' ? e.target : null;
        const step: ShowStep = { k: 'card', card: e.card, ship, target, kind: e.type === 'cardPlayed' ? 'card' : e.type === 'reaction' ? 'reaction' : 'legend', floats: [] };
        steps.push(step);
        floats = step.floats;
        break;
      }
      case 'volley': {
        if (!full) break;
        const step: ShowStep = { k: 'volley', shooter: e.ship, target: e.target, damage: e.damage, track: e.track, terms: null, diagonal: e.diagonal, floats: [] };
        steps.push(step);
        floats = step.floats;
        break;
      }
      case 'hit': {
        const last = steps.at(-1);
        if (last?.k === 'volley' && last.shooter === e.ship) {
          // The breakdown of the damage that hit (a Reaction may have changed it since the declaration).
          last.target = e.target;
          last.damage = e.damage;
          last.track = e.track;
          last.terms = e.terms;
        } else if (full) {
          const step: ShowStep = { k: 'volley', shooter: e.ship, target: e.target, damage: e.damage, track: e.track, terms: e.terms, diagonal: false, floats: [] };
          steps.push(step);
          floats = step.floats;
        }
        break;
      }
      case 'damage':
        if (e.amount > 0) add({ ship: e.ship, text: `−${e.amount} ${TRACK_NAME[e.track]}`, bad: true });
        if (e.toHull > 0) add({ ship: e.ship, text: `−${e.toHull} Корпус`, bad: true });
        break;
      case 'fireDamage':
        add({ ship: e.ship, text: `Пожар −${e.fires} Корпус`, bad: true });
        break;
      case 'fireAdded':
        add({ ship: e.ship, text: `Пожар ${e.fires}`, bad: true });
        break;
      case 'fireOut':
        add({ ship: e.seat, text: 'Пожар потушен', bad: false });
        break;
      case 'powderGained':
        if (full) steps.push({ k: 'effect', effect: 'swap', ship: e.side === 'ПИРАТЫ' ? 'Ж' : 'И', label: `+${e.amount} Порох`, floats: [] });
        break;
      case 'powderSpent':
      case 'powderLost':
        if (full) steps.push({ k: 'effect', effect: 'swap', ship: e.side === 'ПИРАТЫ' ? 'Ж' : 'И', label: `−${e.amount} Порох`, floats: [] });
        break;
      case 'drew':
        if (full) add({ ship: e.seat, text: `Добор +${e.count}`, bad: false });
        break;
      case 'passed':
        if (full && e.card !== HIDDEN) add({ ship: e.to, text: 'Передача карты', bad: false });
        break;
      case 'stolen':
        if (full && e.card !== HIDDEN) add({ ship: e.seat, text: 'Карта украдена', bad: true });
        break;
      case 'restored':
        if (e.amount > 0) add({ ship: e.ship, text: `+${e.amount} ${TRACK_NAME[e.track]}`, bad: false });
        break;
      case 'sunk':
        add({ ship: e.ship, text: 'Затонул', bad: true });
        if (full) steps.push({ k: 'effect', effect: 'sink', ship: e.ship, label: 'Затонул', floats: [] });
        break;
      case 'volleyCancelled':
        add({ ship: e.target, text: 'Залп отменён', bad: false });
        break;
      case 'jackEscaped':
        add({ ship: e.ship, text: 'Джек ускользнул', bad: false });
        break;
      case 'dived':
        if (full) steps.push({ k: 'effect', effect: 'dive', ship: e.ship, label: 'Погружение', floats: [] });
        break;
      case 'surfaced':
        if (full) steps.push({ k: 'effect', effect: 'surface', ship: e.ship, label: 'Всплытие', floats: [] });
        break;
      case 'swapped':
        if (full && e.ships[0]) steps.push({ k: 'effect', effect: 'swap', ship: e.ships[0], label: 'Смена мест', floats: [] });
        break;
      default:
        break;
    }
  }
  return steps.filter((x) => x.k !== 'floats' || x.floats.length > 0);
}

/** Is the action one of the seats or the side played from this device? */
export function actorOf(action: Action): { seat?: string; side?: string } {
  switch (action.type) {
    case 'volley':
      return { seat: action.ship };
    case 'dive':
    case 'sword':
    case 'treasury':
    case 'souls':
      return { seat: action.ship };
    case 'endTurn':
    case 'regroup':
    case 'tortuga':
    case 'concede':
      return { side: action.side };
    case 'jack':
    case 'closeWindow':
      return {};
    default:
      return { seat: action.seat };
  }
}
