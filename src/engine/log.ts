// The game log in words (docs/TZ.md, «Журнал»): every event with its numbers, e.g.
// «„Месть“: Залп по „Голландцу“. 3 Пушки + 1 Ядра − 1 Водоворот = 3 по Корпусу. Корпус 5 → 2».
import { formatTerms, TRACK_DATIVE, TRACK_NAME } from './hints';
import { cardByCode, seaCardByCode, shipData, type Action, type GameEvent, type GameState } from './state';
import type { GameData, Side, Track } from './types';
import { HIDDEN } from './view';

export type LogKind = 'round' | 'turn' | 'action' | 'damage' | 'info' | 'end';

export interface LogLine {
  text: string;
  kind: LogKind;
  round: number;
  /** The team whose turn it was. */
  turn: Side;
  /** Index of the action in the game record that caused the line (-1 — the start of the game). */
  action: number;
  /**
   * Codes of the cards the text names («Название»), in the order of the text. Only cards printed in the text: a card
   * the reader may not see is «карту» there and is not listed, so the codes tell nothing beyond the text.
   */
  cards: string[];
  /** The sea card the line reveals («Море: …»). */
  sea?: string;
}

const SIDE_NAME: Record<Side, string> = { ПИРАТЫ: 'Пираты', КОМПАНИЯ: 'Компания' };
const SIDE_GEN: Record<Side, string> = { ПИРАТЫ: 'Пиратов', КОМПАНИЯ: 'Компании' };
export const sideName = (side: Side) => SIDE_NAME[side];
export const sideGenitive = (side: Side) => SIDE_GEN[side];

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
export const cardsWord = (n: number) => `${n} ${plural(n, 'карта', 'карты', 'карт')}`;
export const powderWord = (n: number) => `${n} ${plural(n, 'Порох', 'Пороха', 'Пороха')}`;

/**
 * Describes the events of one action. `before` is the state the action was applied to: the describer follows the
 * tracks and the Hold from it, so each line can say «Корпус 8 → 5».
 */
export function describe(data: GameData, before: GameState, action: Action | null, events: GameEvent[], index: number): LogLine[] {
  const ships: Record<string, { tracks: Record<Track, number>; souls: number }> = {};
  for (const x of Object.values(before.ships)) ships[x.code] = { tracks: { ...x.tracks }, souls: x.souls };
  const powder: Record<Side, number> = { ПИРАТЫ: before.teams.ПИРАТЫ.powder, КОМПАНИЯ: before.teams.КОМПАНИЯ.powder };
  let round = before.round;
  let turn = before.active;
  const out: LogLine[] = [];
  const name = (code: string) => `«${shipData(data, code).nick}»`;
  const to = (code: string) => `«${shipData(data, code).nickDative}»`;
  /** Cards named by `card` for the line being made: the template literal names them left to right. */
  let named: string[] = [];
  const card = (code: string) => {
    if (code === HIDDEN) return 'карту';
    named.push(code);
    return `«${cardByCode(data, code).name}»`;
  };
  const push = (text: string, kind: LogKind = 'info', sea?: string) => {
    out.push({ text, kind, round, turn, action: index, cards: named, ...(sea ? { sea } : {}) });
    named = [];
  };
  /** Appends to the last line (a hit and its damage read as one sentence). */
  const append = (text: string) => {
    const last = out[out.length - 1];
    if (last) {
      last.text += text;
      last.cards.push(...named);
      named = [];
    } else push(text.trim(), 'damage');
  };
  let lastHit: string | null = null;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    switch (e.type) {
      case 'roundStarted':
        round = e.round;
        push(`Раунд ${e.round}.`, 'round');
        break;
      case 'seaRevealed': {
        const sea = seaCardByCode(data, e.card);
        push(`Море: ${sea.name} (${sea.when.toLowerCase()}) — ${sea.big}${e.reshuffled ? ' Колода моря перемешана.' : ''}`, 'round', e.card);
        break;
      }
      case 'turnStarted':
        turn = e.side;
        push(`Ход ${SIDE_GEN[e.side]}.`, 'turn');
        break;
      case 'powderGained': {
        powder[e.side] += e.amount;
        const why = e.reason === 'hold' ? 'Трюм' : e.reason === 'sell' ? 'продажа' : e.reason === 'sea' ? 'море' : 'карта';
        if (e.reason === 'sell') {
          append(` +${e.amount} Порох → ${powder[e.side]}.`);
          break;
        }
        push(`${SIDE_NAME[e.side]}: +${e.amount} Пороха (${why}) → ${powder[e.side]}${e.burned ? `, сгорело ${e.burned}` : ''}.`);
        break;
      }
      case 'powderSpent':
        powder[e.side] -= e.amount;
        break;
      case 'powderLost':
        powder[e.side] -= e.amount;
        push(`${SIDE_NAME[e.side]}: −${e.amount} Пороха → ${powder[e.side]}.`);
        break;
      case 'soulsSpent':
        ships[e.ship].souls -= e.amount;
        push(`${name(e.ship)}: −${e.amount} ${plural(e.amount, 'Душа', 'Души', 'Душ')} → ${ships[e.ship].souls}.`);
        break;
      case 'soulsGained':
        ships[e.ship].souls += e.amount;
        append(` ${name(e.ship)}: +${e.amount} ${plural(e.amount, 'Душа', 'Души', 'Душ')} → ${ships[e.ship].souls}.`);
        break;
      case 'soulsUsed':
        ships[e.ship].souls -= 1;
        push(`${name(e.ship)}: Душа → +1 ${TRACK_NAME[e.track]}.`, 'action');
        break;
      case 'fireDamage':
        push(`${name(e.ship)}: Пожар (${e.fires}) —`, 'damage');
        lastHit = e.ship;
        break;
      case 'fireAdded':
        push(`${name(e.ship)}: Пожар → ${e.fires}.`, 'damage');
        break;
      case 'fireOut':
        push(`${name(e.seat)} тушит Пожар, сбросив ${card(e.card)}. Пожаров: ${e.fires}.`, 'action');
        break;
      case 'drew':
        push(`${name(e.seat)} добирает ${cardsWord(e.count)}.`);
        break;
      case 'deckReshuffled':
        push(`${name(e.seat)}: колода собрана из сброса.`);
        break;
      case 'damage': {
        const t = ships[e.ship].tracks;
        const parts: string[] = [];
        if (e.amount > 0) {
          parts.push(`${TRACK_NAME[e.track]} ${t[e.track]} → ${t[e.track] - e.amount}`);
          t[e.track] -= e.amount;
        }
        if (e.toHull > 0) {
          parts.push(`Корпус ${t.hull} → ${t.hull - e.toHull} (перенос)`);
          t.hull -= e.toHull;
        }
        const text = parts.join(', ') || 'без урона';
        if (lastHit === e.ship) append(` ${text}.`);
        else push(`${name(e.ship)}: −${e.amount + e.toHull} ${TRACK_NAME[e.track]}. ${text}.`, 'damage');
        lastHit = null;
        break;
      }
      case 'restored': {
        const t = ships[e.ship].tracks;
        push(`${name(e.ship)}: +${e.amount} ${TRACK_NAME[e.track]} (${t[e.track]} → ${t[e.track] + e.amount}).`);
        t[e.track] += e.amount;
        break;
      }
      case 'sunk':
        push(`${name(e.ship)} тонет!`, 'damage');
        break;
      case 'volley': {
        const charge = e.charge ? ` с ${card(e.charge)}` : '';
        push(`${name(e.ship)}: Залп по ${to(e.target)}${charge}${e.diagonal ? ' (по диагонали)' : ''} — ${e.damage} по ${TRACK_DATIVE[e.track]}.`, 'action');
        break;
      }
      case 'hit':
        push(`Попадание по ${to(e.target)}: ${formatTerms(e.terms)} = ${e.damage} по ${TRACK_DATIVE[e.track]}.`, 'damage');
        lastHit = e.target;
        if (e.damage === 0) lastHit = null;
        break;
      case 'volleyCancelled':
        push(`Залп ${name(e.ship)} по ${to(e.target)} отменён.`, 'damage');
        break;
      case 'cardPlayed': {
        const target = action?.type === 'playCard' && action.target && before.ships[action.target] ? ` по ${to(action.target)}` : '';
        const forAlly = e.seat !== e.ship ? ` (капитан утонувшего корабля)` : '';
        push(`${name(e.seat)}: ${card(e.card)}${target}${forAlly}.`, 'action');
        break;
      }
      case 'legendPlayed':
        push(`${name(e.seat)}: Легенда ${card(e.card)}${e.target ? ` по ${to(e.target)}` : ''}.`, 'action');
        break;
      case 'sold':
        push(`${name(e.seat)} продаёт ${card(e.card)}:`, 'action');
        break;
      case 'passed':
        push(`${name(e.seat)} передаёт карту союзнику.`, 'action');
        break;
      case 'regrouped':
        push(`${SIDE_NAME[e.side]}: Перестроение.`, 'action');
        break;
      case 'swapped': {
        const why = { regroup: '', sword: ' (Меч Тритона)', jack: ' (Джек ускользает)', current: ' (Течение)', maelstrom: ' (Мальстрём)' }[e.reason];
        push(`${SIDE_NAME[e.side]}: корабли поменялись местами${why}.`);
        break;
      }
      case 'windowOpened':
        break;
      case 'reaction':
        push(`${name(e.seat)}: Реакция ${card(e.card)}${e.fromPlan ? ' из Плана' : ''}.`, 'action');
        break;
      case 'noReaction':
        push(`${name(e.seat)}: без Реакции.`);
        break;
      case 'jackEscaped':
        push(`${name(e.ship)}: Джек ускользает! Корпус → 2.`, 'action');
        break;
      case 'cardCancelled':
        push(`${card(e.card)} отменена.`);
        break;
      case 'cardLost':
        push(`${card(e.card)} не сработала: корабль утонул.`);
        break;
      case 'planned':
        push(`${name(e.seat)} откладывает в Планы: ${cardsWord(e.count)}.`, 'action');
        break;
      case 'dived':
        push(`${name(e.ship)} уходит под воду.`, 'action');
        break;
      case 'surfaced':
        push(`${name(e.ship)} всплывает: первый Залп +1 и без Реакций.`);
        break;
      case 'sword':
        push(`${name(e.ship)}: Меч Тритона.`, 'action');
        break;
      case 'treasury':
        push(`${name(e.ship)}: Казна — ещё одна карта сверх Команды.`, 'action');
        break;
      case 'heart':
        push(`${name(e.ship)}: Сердце Дейви Джонса — дополнительный Залп.`, 'action');
        break;
      case 'jonesFree':
        push(`Джонс свободен: ${name(e.ship)} восстанавливает Пушки и Команду.`);
        break;
      case 'seaEffect':
        break;
      case 'cardResolved':
        if (e.to === 'stolen' && e.seat) push(`${name(e.seat)} забирает ${card(e.card)} себе в руку.`);
        break;
      case 'stolen':
        push(`${name(e.seat)} забирает случайную карту из руки противника — ${name(e.from)}.`);
        break;
      case 'discarded':
        push(`${name(e.seat)} сбрасывает ${card(e.card)}.`);
        break;
      case 'shown':
        push(`${name(e.to)} смотрит руку игрока ${name(e.seat)}.`);
        break;
      case 'seaLooked':
        push(`${name(e.seat)} смотрит верх колоды моря.`);
        break;
      case 'dice': {
        const [a, b] = Object.entries(e.cards);
        const win = e.winner ? `обе карты забирает ${name(e.winner)}` : 'ничья — обе в сброс';
        push(`Кости лжеца: ${name(a[0])} ${card(a[1])}, ${name(b[0])} ${card(b[1])} — ${win}.`);
        break;
      }
      case 'flagSet': {
        const what = { parley: 'Право на переговоры', voodoo: 'Кукла вуду', blockade: 'Блокада', mark: 'Чёрная метка', noReact: 'без Реакций в этот ход' }[e.flag];
        push(`${name(e.ship)}: ${what}.`);
        break;
      }
      case 'turnFlag': {
        const what = { volleyBonus: `Залпы +${e.n} в этот ход`, noDiag: 'Залпы без штрафа за диагональ', noReactTeam: 'противник без Реакций в этот ход' }[e.flag];
        push(`${SIDE_NAME[e.side]}: ${what}.`);
        break;
      }
      case 'limitRaised':
        push(`${name(e.ship)}: ещё ${cardsWord(e.n)} сверх Команды.`);
        break;
      case 'turnEnded':
        break;
      case 'conceded':
        push(`${SIDE_NAME[e.side]} сдаются.`, 'end');
        break;
      case 'gameOver': {
        const who = e.winner === 'НИЧЬЯ' ? 'Ничья' : `Победа: ${SIDE_NAME[e.winner]}`;
        const why = e.reason === 'rounds' ? ' (предел раундов)' : '';
        push(`${who}${why}.`, 'end');
        break;
      }
      default: {
        const never: never = e;
        void never;
      }
    }
  }
  return out;
}

/**
 * The state before the events, as far as the log needs it (the Hold, the tracks, the Souls): for the events of
 * createGame, whose state before is not kept.
 */
export function rewind(after: GameState, events: GameEvent[]): GameState {
  const s = structuredClone(after);
  for (const e of [...events].reverse()) {
    switch (e.type) {
      case 'powderGained':
        s.teams[e.side].powder -= e.amount;
        break;
      case 'powderSpent':
      case 'powderLost':
        s.teams[e.side].powder += e.amount;
        break;
      case 'damage':
        s.ships[e.ship].tracks[e.track] += e.amount;
        s.ships[e.ship].tracks.hull += e.toHull;
        break;
      case 'restored':
        s.ships[e.ship].tracks[e.track] -= e.amount;
        break;
      case 'soulsGained':
        s.ships[e.ship].souls -= e.amount;
        break;
      case 'soulsSpent':
        s.ships[e.ship].souls += e.amount;
        break;
      case 'soulsUsed':
        s.ships[e.ship].souls += 1;
        break;
    }
  }
  return s;
}

/**
 * The start of a turn in one line: «+3 Пороха, Пожар: −1 Корпус „Индевору“, добрано 2 карты»
 * (docs/TZ.md, «Детали», п. 3). Null when the events have no start of a turn.
 */
export function turnSummary(data: GameData, events: GameEvent[]): { side: Side; text: string } | null {
  const start = events.findIndex((e) => e.type === 'turnStarted');
  if (start < 0) return null;
  const side = (events[start] as Extract<GameEvent, { type: 'turnStarted' }>).side;
  const parts: string[] = [];
  let fire: string | null = null;
  let drew = 0;
  for (const e of events.slice(start + 1)) {
    if (e.type === 'turnStarted') break;
    if (e.type === 'powderGained' && e.reason === 'hold') parts.push(`+${powderWord(e.amount)}${e.burned ? ` (сгорело ${e.burned})` : ''}`);
    if (e.type === 'fireDamage') fire = e.ship;
    if (e.type === 'damage' && fire === e.ship) {
      parts.push(`Пожар: −${e.amount + e.toHull} Корпус «${shipData(data, e.ship).nick}»`);
      fire = null;
    }
    if (e.type === 'surfaced') parts.push(`«${shipData(data, e.ship).nick}» всплывает`);
    if (e.type === 'drew') drew += e.count;
  }
  if (drew) parts.push(`добрано ${cardsWord(drew)}`);
  return { side, text: parts.join(', ') };
}
