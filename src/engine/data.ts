// Loading and validation of the game data. Pure functions: no React, no Node API.
import type { Card, CardInstance, DeckEntry, GameData, Rules, SeaCard, SeaCardInstance, Ship } from './types';

export const CARD_TYPES = ['ЗАРЯД', 'РЕАКЦИЯ', 'ПРИКАЗ', 'РЕМОНТ'] as const;
export const SIDES = ['ПИРАТЫ', 'КОМПАНИЯ'] as const;
export const TRACKS = ['hull', 'sails', 'guns', 'crew'] as const;
export const SEA_WHEN = ['Весь раунд', 'Сразу'] as const;

/** Operations allowed in fx.ops and the allowed numbers of arguments, as used in data3.py and sim.py. */
export const OPS: Record<string, number[]> = {
  ally_draw: [1],
  ally_extra_plays: [1],
  bottle: [1],
  compass: [1],
  dice: [0],
  discard_enemy_each: [1],
  dmg: [3],
  draw: [1],
  draw_to_plan: [1],
  extra_plays: [1],
  extra_volley_free: [0, 1],
  fire: [2],
  kill_reaction: [0],
  lose_crew: [1],
  mark: [2],
  no_diag_turn: [0],
  no_react: [1],
  no_react_team: [0],
  no_repair: [1],
  parley: [0],
  pass: [1],
  powder: [1],
  regroup_free: [0],
  repair_ally: [1],
  repair_crew_both: [1],
  repair_named: [2],
  repair_self: [1],
  repair_track: [2],
  repair_track_any: [2],
  rob: [1],
  sea_look: [1],
  soul: [1],
  souls_repair: [0],
  steal_random: [0],
  team_volley_bonus: [1],
  to_plan: [1],
  voodoo: [1],
};

/** Reaction kinds (fx.r). */
export const REACTIONS = [
  'cancel',
  'cancel_charge',
  'cancel_crew',
  'counter',
  'escape',
  'redirect',
  'reduce',
  'reduce_all',
  'steal',
] as const;

const FX_NUMBER_KEYS = ['dmg', 'n', 'fire', 'if_fire', 'if_damaged'] as const;
const FX_FLAG_KEYS = ['self_only', 'no_diag', 'cards', 'both', 'diag_only', 'plan_any', 'paid', 'no_react'] as const;
const FX_KEYS = new Set<string>([
  ...FX_NUMBER_KEYS,
  ...FX_FLAG_KEYS,
  'ops',
  'r',
  'track',
  'counter',
  'counter2',
  'boarding',
  'plan',
  'vs',
]);

/** Sea card effects (SeaCard.key). */
export const SEA_KEYS = [
  'calm',
  'wind',
  'fog',
  'storm',
  'wave',
  'maelstrom',
  'clear',
  'mermaids',
  'tortuga',
  'rum',
  'caravan',
  'wet',
  'reefs',
  'thunder',
  'fleet',
  'moon',
  'current',
] as const;

/** Volley parameters of version 0.3, used when a ship does not set its own. */
export const VOLLEY_DEFAULTS = {
  volleyCost: 1,
  diagDamage: { offset: -1 },
  defaultTrack: 'hull',
  volleysPerTurn: 1,
  volleyModes: [],
} as const;

/** Rule numbers of version 0.3, used when the data has no "rules" section or misses a key. */
export const RULES_DEFAULTS: Rules = {
  hand: 5,
  maxRounds: 30,
  maxFires: 3,
  sellGain: 1,
  regroupCost: 1,
  jointBonus: 1,
  firstGameSecondStart: 3,
  paidChargeMax: 3,
  jackHull: 2,
  plansMax: 2,
  treasuryCost: 2,
  treasuryPlays: 1,
  swordCost: 1,
  heartCrewLoss: 1,
  surfaceBonus: 1,
  soulsGain: 1,
  seaStorm: 1,
  seaClear: 1,
  seaWave: 1,
  seaMoon: 1,
  seaFleet: 1,
  seaReefs: 1,
  seaCaravan: 2,
  seaThunder: 2,
  seaTortuga: 2,
  seaMermaidsMin: 3,
  seaMermaids: 1,
  seaRum: 1,
  seaWetDivisor: 2,
};

const RULES_MIN: Record<keyof Rules, number> = {
  hand: 0,
  maxRounds: 1,
  maxFires: 0,
  sellGain: 0,
  regroupCost: 0,
  jointBonus: 0,
  firstGameSecondStart: 0,
  paidChargeMax: 0,
  jackHull: 1,
  plansMax: 0,
  treasuryCost: 0,
  treasuryPlays: 0,
  swordCost: 0,
  heartCrewLoss: 0,
  surfaceBonus: 0,
  soulsGain: 0,
  seaStorm: 0,
  seaClear: 0,
  seaWave: 0,
  seaMoon: 0,
  seaFleet: 0,
  seaReefs: 0,
  seaCaravan: 0,
  seaThunder: 0,
  seaTortuga: 0,
  seaMermaidsMin: 0,
  seaMermaids: 0,
  seaRum: 0,
  seaWetDivisor: 1,
};

export class DataError extends Error {
  constructor(readonly problems: string[]) {
    super(`Ошибки в данных игры:\n${problems.map((p) => `- ${p}`).join('\n')}`);
    this.name = 'DataError';
  }
}

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isInt = (x: unknown): x is number => Number.isInteger(x);
const isNonEmpty = (x: unknown): x is string => typeof x === 'string' && x.trim() !== '';
const show = (x: unknown) => JSON.stringify(x) ?? String(x);

class Checker {
  readonly problems: string[] = [];

  fail(where: string, message: string) {
    this.problems.push(`${where}: ${message}`);
  }

  string(o: Obj, key: string, where: string, nonEmpty = false) {
    const x = o[key];
    if (typeof x !== 'string') this.fail(where, `поле «${key}» должно быть строкой`);
    else if (nonEmpty && x.trim() === '') this.fail(where, `пустое поле «${key}»`);
  }

  int(o: Obj, key: string, where: string, min: number, optional = false) {
    const x = o[key];
    if (x === undefined && optional) return;
    if (!isInt(x)) this.fail(where, `поле «${key}» должно быть целым числом, сейчас ${show(x)}`);
    else if (x < min) {
      this.fail(where, min === 0 ? `отрицательное поле «${key}»: ${x}` : `поле «${key}» меньше ${min}: ${x}`);
    }
  }

  oneOf(o: Obj, key: string, where: string, allowed: readonly string[]) {
    if (!allowed.includes(o[key] as string)) {
      this.fail(where, `поле «${key}» = ${show(o[key])}, допустимо: ${allowed.join(', ')}`);
    }
  }

  stringArray(o: Obj, key: string, where: string) {
    const x = o[key];
    if (!Array.isArray(x) || !x.every((s) => typeof s === 'string')) {
      this.fail(where, `поле «${key}» должно быть списком строк`);
    }
  }

  fx(fx: unknown, where: string) {
    if (!isObj(fx)) {
      this.fail(where, 'поле «fx» должно быть объектом');
      return;
    }
    for (const [key, value] of Object.entries(fx)) {
      if (!FX_KEYS.has(key)) {
        this.fail(where, `неизвестная операция «${key}» в fx`);
      } else if ((FX_NUMBER_KEYS as readonly string[]).includes(key)) {
        if (typeof value !== 'number') this.fail(where, `fx.${key} должно быть числом, сейчас ${show(value)}`);
      } else if ((FX_FLAG_KEYS as readonly string[]).includes(key)) {
        if (typeof value !== 'boolean') this.fail(where, `fx.${key} должно быть true или false`);
      } else if (key === 'r') {
        if (!REACTIONS.includes(value as (typeof REACTIONS)[number])) {
          this.fail(where, `неизвестная Реакция «${String(value)}» в fx.r`);
        }
      } else if (key === 'track') {
        if (!TRACKS.includes(value as (typeof TRACKS)[number])) this.fail(where, `неизвестная шкала ${show(value)} в fx.track`);
      } else if (key === 'counter' || key === 'counter2' || key === 'boarding') {
        const ok =
          Array.isArray(value) &&
          value.length === 2 &&
          TRACKS.includes(value[0]) &&
          (typeof value[1] === 'number' || value[1] === 'guns');
        if (!ok) this.fail(where, `fx.${key} должно быть [шкала, число], сейчас ${show(value)}`);
      } else if (key === 'plan') {
        this.fx(value, `${where}, План`);
      } else if (key === 'vs') {
        if (!isNonEmpty(value)) this.fail(where, 'fx.vs должно быть кодом корабля');
      } else if (key === 'ops') {
        if (!Array.isArray(value)) {
          this.fail(where, 'fx.ops должно быть списком');
          continue;
        }
        for (const op of value) {
          if (!Array.isArray(op) || typeof op[0] !== 'string') {
            this.fail(where, `операция ${show(op)} должна быть списком вида ["имя", ...]`);
          } else if (!(op[0] in OPS)) {
            this.fail(where, `неизвестная операция «${op[0]}» в fx.ops`);
          } else if (!OPS[op[0]].includes(op.length - 1)) {
            this.fail(where, `у операции «${op[0]}» ${op.length - 1} аргументов, нужно ${OPS[op[0]].join(' или ')}`);
          } else if (!op.slice(1).every((a) => typeof a === 'string' || typeof a === 'number')) {
            this.fail(where, `аргументы операции «${op[0]}» должны быть строками или числами`);
          }
        }
      }
    }
  }

  card(c: unknown, where: string) {
    if (!isObj(c)) {
      this.fail(where, 'карта должна быть объектом');
      return;
    }
    const at = isNonEmpty(c.name) ? `${where}, карта «${c.name}»` : where;
    this.string(c, 'name', at, true);
    this.oneOf(c, 'type', at, CARD_TYPES);
    this.int(c, 'cost', at, 0);
    this.int(c, 'soul', at, 0);
    this.string(c, 'big', at);
    this.string(c, 'text', at);
    this.string(c, 'flavor', at);
    if (typeof c.v !== 'number' || !Number.isFinite(c.v)) this.fail(at, `поле «v» должно быть числом, сейчас ${show(c.v)}`);
    if (typeof c.legend !== 'boolean') this.fail(at, 'поле «legend» должно быть true или false');
    this.stringArray(c, 'tags', at);
    this.fx(c.fx, at);
    return at;
  }

  ship(s: unknown, where: string) {
    if (!isObj(s)) {
      this.fail(where, 'корабль должен быть объектом');
      return;
    }
    const at = isNonEmpty(s.name) ? `Корабль ${s.name}` : where;
    for (const key of ['code', 'name', 'short', 'captain', 'legend']) this.string(s, key, at, true);
    for (const key of ['color', 'motto']) this.string(s, key, at);
    this.string(s, 'nick', at, true);
    this.string(s, 'nickDative', at, true);
    this.string(s, 'nickGenitive', at, true);
    this.oneOf(s, 'side', at, SIDES);
    for (const key of ['hull', 'sails', 'guns', 'crew']) this.int(s, key, at, 1);
    this.int(s, 'souls', at, 0, true);
    this.int(s, 'start_souls', at, 0, true);
    if (isInt(s.souls) && isInt(s.start_souls) && s.start_souls > s.souls) {
      this.fail(at, `стартовых Душ (${s.start_souls}) больше максимума (${s.souls})`);
    }
    const abilities = s.abilities;
    if (!Array.isArray(abilities) || !abilities.every((a) => isObj(a) && isNonEmpty(a.name) && typeof a.text === 'string')) {
      this.fail(at, 'поле «abilities» должно быть списком { name, text }');
    }
    this.stringArray(s, 'tips', at);
    this.int(s, 'volleyCost', at, 0);
    const diag = s.diagDamage;
    const diagOk =
      isObj(diag) &&
      Object.keys(diag).length === 1 &&
      (isInt(diag.offset) || (isInt(diag.fixed) && diag.fixed >= 0));
    if (!diagOk) this.fail(at, `поле «diagDamage» должно быть { offset: число } или { fixed: число }, сейчас ${show(diag)}`);
    this.oneOf(s, 'defaultTrack', at, TRACKS);
    this.int(s, 'volleysPerTurn', at, 1);
    if (!Array.isArray(s.volleyModes)) {
      this.fail(at, 'поле «volleyModes» должно быть списком');
    } else {
      s.volleyModes.forEach((m: unknown, i) => {
        if (!isObj(m)) {
          this.fail(at, `режим Залпа №${i + 1} должен быть объектом`);
          return;
        }
        const mat = `${at}, режим Залпа «${String(m.name)}»`;
        this.string(m, 'name', mat, true);
        this.string(m, 'text', mat);
        this.int(m, 'cost', mat, 0);
        this.fx(m.fx, mat);
      });
    }
  }
}

/**
 * Checks raw JSON and returns typed game data. Missing Volley parameters of a ship get the
 * version 0.3 defaults. Throws DataError listing every problem with the name of the card or ship.
 */
export function loadGameData(raw: unknown): GameData {
  const ch = new Checker();
  if (!isObj(raw)) throw new DataError(['данные должны быть JSON-объектом']);

  ch.string(raw, 'version', 'Данные', true);

  if (!isObj(raw.econ)) ch.fail('Экономика', 'нет раздела «econ»');
  else for (const key of ['income', 'first_income', 'cap', 'second_start']) ch.int(raw.econ, key, 'Экономика', 0);

  let rules: Rules = RULES_DEFAULTS;
  if (raw.rules !== undefined && !isObj(raw.rules)) ch.fail('Правила', 'раздел «rules» должен быть объектом');
  else if (isObj(raw.rules)) {
    for (const key of Object.keys(raw.rules)) {
      if (!(key in RULES_DEFAULTS)) ch.fail('Правила', `неизвестное поле «${key}»`);
    }
    const merged: Obj = { ...RULES_DEFAULTS, ...raw.rules };
    for (const key of Object.keys(RULES_DEFAULTS) as (keyof Rules)[]) ch.int(merged, key, 'Правила', RULES_MIN[key]);
    rules = merged as unknown as Rules;
  }

  const ships: Ship[] = [];
  if (!Array.isArray(raw.ships) || raw.ships.length === 0) {
    ch.fail('Корабли', 'нет списка «ships»');
  } else {
    raw.ships.forEach((s: unknown, i) => {
      const ship = isObj(s) ? { ...VOLLEY_DEFAULTS, ...s } : s;
      ch.ship(ship, `Корабль №${i + 1}`);
      ships.push(ship as Ship);
    });
  }
  const codes = ships.map((s) => (isObj(s) ? s.code : undefined));
  codes.forEach((code, i) => {
    if (codes.indexOf(code) !== i) ch.fail('Корабли', `код корабля «${String(code)}» повторяется`);
  });

  if (!isObj(raw.decks)) {
    ch.fail('Колоды', 'нет раздела «decks»');
  } else {
    for (const code of Object.keys(raw.decks)) {
      if (!codes.includes(code)) ch.fail('Колоды', `колода «${code}» без корабля`);
    }
    for (const code of codes) {
      const deck = raw.decks[code as string];
      const where = `Колода ${String(code)}`;
      if (!Array.isArray(deck) || deck.length === 0) {
        ch.fail(where, 'нет карт');
        continue;
      }
      deck.forEach((c: unknown, i) => {
        const at = ch.card(c, `${where}, карта №${i + 1}`);
        if (at && isObj(c)) {
          ch.int(c, 'copies', at, 1);
          if (c.legend === true) ch.fail(at, 'Легенда не может лежать в колоде');
        }
      });
    }
  }

  if (!isObj(raw.legends)) {
    ch.fail('Легенды', 'нет раздела «legends»');
  } else {
    for (const code of Object.keys(raw.legends)) {
      if (!codes.includes(code)) ch.fail('Легенды', `Легенда «${code}» без корабля`);
    }
    for (const s of ships) {
      if (!isObj(s)) continue;
      const legend = raw.legends[s.code];
      const where = `Легенда корабля ${s.name}`;
      if (legend === undefined) {
        ch.fail(where, 'нет карты');
        continue;
      }
      const at = ch.card(legend, where);
      if (at && isObj(legend)) {
        if (legend.legend !== true) ch.fail(at, 'у Легенды должно быть legend: true');
        if (legend.name !== s.legend) ch.fail(at, `у корабля указана Легенда «${s.legend}»`);
      }
    }
  }

  if (!Array.isArray(raw.sea)) {
    ch.fail('Море', 'нет списка «sea»');
  } else {
    raw.sea.forEach((c: unknown, i) => {
      if (!isObj(c)) {
        ch.fail(`Море, карта №${i + 1}`, 'карта должна быть объектом');
        return;
      }
      const at = isNonEmpty(c.name) ? `Море, карта «${c.name}»` : `Море, карта №${i + 1}`;
      ch.string(c, 'name', at, true);
      ch.oneOf(c, 'when', at, SEA_WHEN);
      ch.string(c, 'big', at);
      ch.string(c, 'text', at);
      ch.string(c, 'flavor', at);
      ch.oneOf(c, 'key', at, SEA_KEYS);
    });
  }

  if (ch.problems.length > 0) throw new DataError(ch.problems);
  return { ...(raw as unknown as GameData), rules, ships };
}

/** Every physical deck card, one entry per copy. Codes as in data3.py: "Ж-01" … "Ж-24". */
export function deckCards(data: GameData, shipCode?: string): CardInstance[] {
  const out: CardInstance[] = [];
  for (const ship of data.ships) {
    if (shipCode !== undefined && ship.code !== shipCode) continue;
    let n = 0;
    for (const entry of data.decks[ship.code]) {
      for (let i = 0; i < entry.copies; i++) {
        n++;
        out.push({ ...withoutCopies(entry), deck: ship.code, code: `${ship.code}-${String(n).padStart(2, '0')}` });
      }
    }
  }
  return out;
}

/** Legend cards, code "Ж-Л". */
export function legendCards(data: GameData): CardInstance[] {
  return data.ships.map((ship) => ({ ...data.legends[ship.code], deck: ship.code, code: `${ship.code}-Л` }));
}

/** Sea cards, codes "С-01" … */
export function seaCards(data: GameData): SeaCardInstance[] {
  return data.sea.map((c: SeaCard, i) => ({ ...c, code: `С-${String(i + 1).padStart(2, '0')}` }));
}

function withoutCopies(entry: DeckEntry): Card {
  const { copies: _copies, ...card } = entry;
  return card;
}
