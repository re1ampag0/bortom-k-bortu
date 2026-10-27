// V7: the numbers of the victory sheet — what each ship did in the game, its title and the best captain. Pure functions
// over the record of the game (setup + actions, replayed): the events say who did what. The engine does not change:
// a number the events do not give is not shown (TASKS-2.md, V7). The same record gives the same sheet on every device.
import { replay, type MatchSetup } from '../../engine/match';
import { cardByCode, shipData, type Action, type GameEvent, type Winner } from '../../engine/state';
import type { GameData, Side, Track } from '../../engine/types';
import { roman } from './text';

export interface Kill {
  ship: string;
  round: number;
  /** The damage of the Volley that sank it; null — it went down otherwise (a card, a Fire). */
  volley: number | null;
}

export interface ShipStats {
  code: string;
  side: Side;
  /** Damage to the enemy's ships (all tracks, the overflow to the Hull too). */
  dmgOut: number;
  /** Of it — to the Hull. */
  hullDmg: number;
  /** Of it — to the Crew. */
  crewDmg: number;
  /** Volleys declared. */
  volleys: number;
  /** Fires put on the enemy's ships. */
  fires: number;
  /** Volleys at its side cancelled or weakened by its Reactions. */
  softened: number;
  /** Damage taken, from anything. */
  dmgIn: number;
  /** Cells of the Hull lost. */
  hullLost: number;
  /** Hull and Sails restored by its cards and abilities. */
  repair: number;
  /** Powder it put in the Hold (cards, selling, abilities). */
  powder: number;
  souls: number;
  kills: Kill[];
  /** Its Legend: the card and the round; `worked` — it was not cancelled. */
  legend: { card: string; round: number; worked: boolean } | null;
  sunk: boolean;
}

export interface MatchStats {
  ships: Record<string, ShipStats>;
  /** The ships in the order of the data (Pirates first). */
  order: string[];
  /** Damage to the ships of a side that no enemy ship dealt (the sea, its own cards, the start of a turn). */
  unowned: Record<Side, number>;
  rounds: number;
  turns: number;
  /** The ships in the order they sank. */
  sunkOrder: string[];
}

const enemy = (a: Side, b: Side) => a !== b;

/** Who did what over the whole game: one pass over the events of the record. */
export function matchStats(data: GameData, setup: MatchSetup, actions: Action[]): MatchStats {
  const ships: Record<string, ShipStats> = {};
  const order: string[] = [];
  const unowned: Record<Side, number> = { ПИРАТЫ: 0, КОМПАНИЯ: 0 };
  const sunkOrder: string[] = [];
  let round = 1;
  let turns = 0;
  // The source of what happens now: the ship whose Volley, card or Legend it is; a Reaction answers on top of it.
  let src: { ship: string; volley: number | null } | null = null;
  let react: string | null = null;
  // The Volley declared and not yet resolved: who answered it with a Reaction.
  let open: { ship: string; damage: number; reactors: string[] } | null = null;
  // The owners of the Fires of each ship, in the order they were set; the damage of a Fire goes to them.
  const fireOwners: Record<string, (string | null)[]> = {};
  let fireOf: string | null = null;
  const lastBy: Record<string, string | null> = {};
  const sideOf = (code: string) => ships[code].side;

  const credit = (by: string | null, hurt: string, n: number, track: Track | 'hull', toHull: number, onTrack: number) => {
    if (by && enemy(sideOf(by), sideOf(hurt))) {
      const st = ships[by];
      st.dmgOut += n;
      st.hullDmg += (track === 'hull' ? onTrack : 0) + toHull;
      st.crewDmg += track === 'crew' ? onTrack : 0;
      lastBy[hurt] = by;
    } else {
      unowned[sideOf(hurt)] += n;
      lastBy[hurt] = null;
    }
  };
  const soften = (target: string) => {
    if (!open) return;
    for (const r of new Set(open.reactors)) if (!enemy(sideOf(r), sideOf(target))) ships[r].softened++;
  };

  replay(data, setup, actions, ({ before, action, events }) => {
    if (order.length === 0) {
      for (const sh of data.ships) {
        if (!before.ships[sh.code]) continue;
        order.push(sh.code);
        ships[sh.code] = { code: sh.code, side: before.ships[sh.code].side, dmgOut: 0, hullDmg: 0, crewDmg: 0, volleys: 0, fires: 0, softened: 0, dmgIn: 0, hullLost: 0, repair: 0, powder: 0, souls: 0, kills: [], legend: null, sunk: false };
        fireOwners[sh.code] = [];
      }
    }
    let treasury: string | null = null;
    for (const e of events as GameEvent[]) {
      switch (e.type) {
        case 'roundStarted':
          round = e.round;
          src = react = null;
          break;
        case 'turnStarted':
          turns++;
          src = react = null;
          break;
        case 'turnEnded':
        case 'seaRevealed':
        case 'seaEffect':
          src = react = null;
          break;
        case 'volley':
          ships[e.ship].volleys++;
          open = { ship: e.ship, damage: e.damage, reactors: [] };
          src = { ship: e.ship, volley: e.damage };
          react = null;
          break;
        case 'hit':
          if (open && open.ship === e.ship && e.damage < open.damage) soften(e.target);
          open = null;
          src = { ship: e.ship, volley: e.damage };
          react = null;
          break;
        case 'volleyCancelled':
          soften(e.target);
          open = null;
          break;
        case 'cardPlayed':
          src = { ship: e.ship, volley: null };
          react = null;
          break;
        case 'legendPlayed':
          src = { ship: e.seat, volley: null };
          react = null;
          ships[e.seat].legend = { card: e.card, round, worked: true };
          break;
        case 'cardCancelled':
          for (const st of Object.values(ships)) if (st.legend?.card === e.card) st.legend.worked = false;
          break;
        case 'reaction':
          react = e.ship;
          open?.reactors.push(e.ship);
          break;
        case 'fireAdded': {
          const own = fireOwners[e.ship];
          const by = react ?? src?.ship ?? null;
          while (own.length < e.fires) {
            own.push(by);
            if (by && enemy(sideOf(by), sideOf(e.ship))) ships[by].fires++;
          }
          break;
        }
        case 'fireOut':
          fireOwners[e.seat].length = e.fires;
          break;
        case 'fireDamage':
          fireOf = e.ship;
          break;
        case 'damage': {
          const n = e.amount + e.toHull;
          ships[e.ship].dmgIn += n;
          ships[e.ship].hullLost += (e.track === 'hull' ? e.amount : 0) + e.toHull;
          if (fireOf === e.ship) {
            // one unit a Fire: each to its owner
            const own = fireOwners[e.ship];
            for (let k = 0; k < n; k++) credit(own[k % Math.max(1, own.length)] ?? null, e.ship, 1, 'hull', 0, 1);
            fireOf = null;
            break;
          }
          const hurt = sideOf(e.ship);
          const by = react && enemy(sideOf(react), hurt) ? react : src && enemy(sideOf(src.ship), hurt) ? src.ship : null;
          credit(by, e.ship, n, e.track, e.toHull, e.amount);
          break;
        }
        case 'sunk': {
          ships[e.ship].sunk = true;
          fireOwners[e.ship] = [];
          sunkOrder.push(e.ship);
          const by = lastBy[e.ship];
          if (by) ships[by].kills.push({ ship: e.ship, round, volley: src && src.ship === by ? src.volley : null });
          break;
        }
        case 'restored': {
          if (e.track !== 'hull' && e.track !== 'sails') break;
          const by = src && !enemy(sideOf(src.ship), sideOf(e.ship)) ? src.ship : e.ship;
          ships[by].repair += e.amount;
          break;
        }
        case 'treasury':
          treasury = e.ship;
          break;
        case 'powderGained': {
          let by: string | null = null;
          if (e.reason === 'sell' && action?.type === 'sell') by = action.seat;
          else if (e.reason === 'card' && src && sideOf(src.ship) === e.side) by = src.ship;
          else if (treasury && sideOf(treasury) === e.side) by = treasury;
          if (by && ships[by]) ships[by].powder += e.amount;
          break;
        }
        case 'soulsGained':
          ships[e.ship].souls += e.amount;
          break;
      }
    }
  });
  return { ships, order, unowned, rounds: round, turns, sunkOrder };
}

/** «2 Залпа», «5 Залпов»: the word after a number. */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export interface Title {
  key: string;
  name: string;
  /** One line without a verb of gender: «Залп на 6 — «Индевор» на дне», «7 Залпов». */
  fact: string;
}

const nick = (data: GameData, code: string) => `«${shipData(data, code).nick}»`;

/**
 * The titles in the order of TASKS-2.md (V7, 5), without «Штурман» (the record of a Regroup has no ship). Each gives
 * the ships that hold it; a ship gets the first title that only it holds.
 */
function titleList(data: GameData, m: MatchStats): { key: string; name: string; holders: string[]; fact: (code: string) => string }[] {
  const all = m.order.map((c) => m.ships[c]);
  const most = (f: (s: ShipStats) => number, among = all) => {
    const top = Math.max(0, ...among.map(f));
    return top > 0 ? among.filter((s) => f(s) === top).map((s) => s.code) : [];
  };
  const last = m.sunkOrder[m.sunkOrder.length - 1];
  const decider = last ? all.find((s) => s.kills.some((k) => k.ship === last && k.volley !== null)) : undefined;
  const st = (c: string) => m.ships[c];
  return [
    {
      key: 'decisive',
      name: 'Решающий залп',
      holders: decider ? [decider.code] : [],
      fact: (c) => `Залп на ${st(c).kills.find((k) => k.ship === last)!.volley}. ${nick(data, last)} на дне`,
    },
    { key: 'caliber', name: 'Главный калибр', holders: most((s) => s.hullDmg), fact: (c) => `${st(c).hullDmg} по Корпусу за партию` },
    { key: 'gunner', name: 'Канонир', holders: most((s) => s.volleys), fact: (c) => `${st(c).volleys} ${plural(st(c).volleys, 'Залп', 'Залпа', 'Залпов')}` },
    { key: 'grape', name: 'Картечь', holders: most((s) => s.crewDmg), fact: (c) => `${st(c).crewDmg} ${plural(st(c).crewDmg, 'матрос', 'матроса', 'матросов')} за борт` },
    { key: 'fireship', name: 'Брандер', holders: most((s) => s.fires), fact: (c) => `${st(c).fires} ${plural(st(c).fires, 'Пожар', 'Пожара', 'Пожаров')}` },
    {
      key: 'maneuver',
      name: 'Мастер манёвра',
      holders: most((s) => s.softened),
      fact: (c) => `Реакции ослабили ${st(c).softened} ${plural(st(c).softened, 'Залп', 'Залпа', 'Залпов')}`,
    },
    { key: 'oak', name: 'Дубовый борт', holders: most((s) => s.dmgIn, all.filter((s) => !s.sunk)), fact: (c) => `${st(c).dmgIn} урона, и на плаву` },
    { key: 'scratch', name: 'Ни царапины', holders: all.filter((s) => s.hullLost === 0).map((s) => s.code), fact: () => 'ни одной доски' },
    { key: 'carpenter', name: 'Плотник', holders: most((s) => s.repair), fact: (c) => `+${st(c).repair} ремонта` },
    { key: 'purser', name: 'Казначей', holders: most((s) => s.powder), fact: (c) => `+${st(c).powder} Пороха в Трюм` },
    {
      key: 'souls',
      name: 'Собиратель душ',
      holders: most((s) => (s.souls >= 2 ? s.souls : 0)),
      fact: (c) => `${st(c).souls} ${plural(st(c).souls, 'Душа', 'Души', 'Душ')} за партию`,
    },
    {
      key: 'trump',
      name: 'Козырь',
      holders: all.filter((s) => s.legend?.worked).map((s) => s.code),
      fact: (c) => `«${cardByCode(data, st(c).legend!.card).name}» в раунде ${roman(st(c).legend!.round)}`,
    },
  ];
}

/** One title for each ship: the first of the list it alone holds; else «Флагман» (the winners afloat) or «Бился до конца». */
export function awardTitles(data: GameData, m: MatchStats, winner: Winner | null): Record<string, Title> {
  const list = titleList(data, m);
  const out: Record<string, Title> = {};
  for (const code of m.order) {
    const t = list.find((x) => x.holders.length === 1 && x.holders[0] === code);
    const s = m.ships[code];
    const dmg = `${s.dmgOut} урона по врагу`;
    out[code] = t
      ? { key: t.key, name: t.name, fact: t.fact(code) }
      : s.side === winner && !s.sunk
        ? { key: 'flagship', name: 'Флагман', fact: dmg }
        : { key: 'tothend', name: 'Бился до конца', fact: dmg };
  }
  return out;
}

export interface BestCaptain {
  code: string;
  dmg: number;
  /** Its damage is the most of all the ships (no tie). */
  most: boolean;
  /** Its share of the damage of its side, %. */
  share: number;
  /** The last ship it sank and the round; null — it sank none. */
  kill: Kill | null;
}

/** The ship of the winning side (of all on a draw) with the most damage; a tie — more kills, then the order of the data. */
export function bestCaptain(m: MatchStats, winner: Winner | null): BestCaptain | null {
  const pool = m.order.map((c) => m.ships[c]).filter((s) => winner === 'НИЧЬЯ' || !winner || s.side === winner);
  if (pool.length === 0) return null;
  const best = pool.reduce((a, b) => (b.dmgOut > a.dmgOut || (b.dmgOut === a.dmgOut && b.kills.length > a.kills.length) ? b : a));
  const all = m.order.map((c) => m.ships[c]);
  const side = all.filter((s) => s.side === best.side).reduce((n, s) => n + s.dmgOut, 0);
  return {
    code: best.code,
    dmg: best.dmgOut,
    most: best.dmgOut > 0 && all.every((s) => s === best || s.dmgOut < best.dmgOut),
    share: side > 0 ? Math.round((best.dmgOut / side) * 100) : 0,
    kill: best.kills[best.kills.length - 1] ?? null,
  };
}
