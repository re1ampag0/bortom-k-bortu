// The data editor's model (docs/tasks/E9a-data-editor.md): the fields of the raw game data the admin page edits, their
// Russian names and paths, checks with the path in words, changes against the main data, the value / norm / excess of
// PDF page 25. Works on the raw JSON (as in data/game-data.json); loadGameData checks the whole set.
import { CARD_TYPES, DataError, TRACKS, loadGameData } from '../../engine/data';

/** Raw game data as in data/game-data.json. */
export type Raw = Record<string, any>;
export type Path = (string | number)[];
export type Kind = 'int' | 'num' | 'text' | 'long' | 'bool' | 'track' | 'diag';

export interface Field {
  path: Path;
  /** The name of the field in the list of errors: «стоимость». */
  label: string;
  kind: Kind;
  min?: number;
  /** Where the field is, for errors: ['Карты', 'Месть', 'Ядра']. */
  where: string[];
  /** The name of an fx operation (read only in the editor). */
  op?: string;
}

export const TRACK_NAMES: Record<string, string> = { hull: 'Корпус', sails: 'Паруса', guns: 'Пушки', crew: 'Команда' };

export function getAt(o: unknown, path: Path): any {
  let x: any = o;
  for (const key of path) {
    if (x === null || typeof x !== 'object') return undefined;
    x = x[key];
  }
  return x;
}

/** A copy of `o` with `value` at `path`; only the objects on the path are copied. */
export function setAt<T>(o: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const copy: any = Array.isArray(o) ? [...o] : { ...(o as object) };
  copy[key] = setAt(copy[key], rest, value);
  if (value === undefined && rest.length === 0) delete copy[key];
  return copy;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The short name of a ship for paths: «Месть». */
export const shipNick = (raw: Raw, code: string): string => (raw.ships as Raw[]).find((s) => s.code === code)?.nick ?? code;

// ——— Fields ———

export function shipFields(raw: Raw, i: number): Field[] {
  const s = raw.ships[i] as Raw;
  const where = ['Корабли', s.nick ?? s.code];
  const at = (key: string, label: string, kind: Kind, min?: number): Field => ({ path: ['ships', i, key], label, kind, min, where });
  const out = [at('hull', 'Корпус', 'int', 1), at('sails', 'Паруса', 'int', 1), at('guns', 'Пушки', 'int', 1), at('crew', 'Команда', 'int', 1)];
  if (s.souls !== undefined) out.push(at('souls', 'Душ максимум', 'int', 0));
  if (s.start_souls !== undefined) out.push(at('start_souls', 'Душ на старте', 'int', 0));
  out.push(
    at('volleyCost', 'Залп, Пороха', 'int', 0),
    at('volleysPerTurn', 'Залпов за ход', 'int', 1),
    at('diagDamage', 'Урон по диагонали', 'diag'),
    at('defaultTrack', 'Залп без Заряда бьёт по', 'track'),
  );
  return out;
}

export function econFields(): Field[] {
  const where = ['Экономика'];
  return [
    { path: ['econ', 'income'], label: 'Доход за ход', kind: 'int', min: 0, where },
    { path: ['econ', 'first_income'], label: 'Доход в самый первый ход', kind: 'int', min: 0, where },
    { path: ['econ', 'cap'], label: 'Трюм, Пороха максимум', kind: 'int', min: 0, where },
    { path: ['econ', 'second_start'], label: 'Стартовый Порох второй команды', kind: 'int', min: 0, where },
  ];
}

/** A card of a deck or a Legend in the raw data. */
export interface CardRef {
  path: Path;
  deck: string;
  legend: boolean;
}

export function cardRefs(raw: Raw): CardRef[] {
  const out: CardRef[] = [];
  for (const ship of raw.ships as Raw[]) {
    (raw.decks?.[ship.code] as Raw[] | undefined)?.forEach((_, i) => out.push({ path: ['decks', ship.code, i], deck: ship.code, legend: false }));
    if (raw.legends?.[ship.code]) out.push({ path: ['legends', ship.code], deck: ship.code, legend: true });
  }
  return out;
}

/** Numbers of fx by its structure: the names of the operations are shown, not edited. */
export function fxFields(fx: unknown, path: Path, where: string[], prefix = ''): Field[] {
  if (fx === null || typeof fx !== 'object' || Array.isArray(fx)) return [];
  const out: Field[] = [];
  for (const [key, value] of Object.entries(fx as Raw)) {
    if (typeof value === 'number') out.push({ path: [...path, key], label: `${prefix}${key}`, kind: 'num', where, op: `${prefix}${key}` });
    else if (key === 'ops' && Array.isArray(value)) {
      value.forEach((op, i) => {
        if (!Array.isArray(op)) return;
        const numbers = op.map((a, j) => (j > 0 && typeof a === 'number' ? j : -1)).filter((j) => j > 0);
        for (const j of numbers) {
          const extra = op.slice(1).filter((a) => typeof a === 'string');
          const name = `${prefix}${op[0]}${extra.length ? ` (${extra.join(', ')})` : ''}${numbers.length > 1 ? ` №${j}` : ''}`;
          out.push({ path: [...path, 'ops', i, j], label: name, kind: 'num', where, op: name });
        }
      });
    } else if ((key === 'counter' || key === 'counter2' || key === 'boarding') && Array.isArray(value) && typeof value[1] === 'number') {
      const name = `${prefix}${key} (${value[0]})`;
      out.push({ path: [...path, key, 1], label: name, kind: 'num', where, op: name });
    } else if (key === 'plan') out.push(...fxFields(value, [...path, 'plan'], where, `${prefix}plan.`));
  }
  return out;
}

export function cardWhere(raw: Raw, ref: CardRef): string[] {
  const card = getAt(raw, ref.path) as Raw;
  return ['Карты', shipNick(raw, ref.deck), ref.legend ? `Легенда «${card.name}»` : card.name];
}

/** The number fields of a card: cost, Souls, copies, value and the numbers of fx. */
export function cardNumberFields(raw: Raw, ref: CardRef): Field[] {
  const card = getAt(raw, ref.path) as Raw;
  const where = cardWhere(raw, ref);
  const at = (key: string, label: string, kind: Kind, min?: number): Field => ({ path: [...ref.path, key], label, kind, min, where });
  const out = [at('cost', 'стоимость', 'int', 0), at('soul', 'Души', 'int', 0)];
  if (!ref.legend) out.push(at('copies', 'копии', 'int', 1));
  out.push(at('v', 'ценность', 'num'));
  out.push(...fxFields(card.fx, [...ref.path, 'fx'], where));
  return out;
}

export function cardTextFields(raw: Raw, ref: CardRef): Field[] {
  const where = cardWhere(raw, ref);
  return [
    { path: [...ref.path, 'big'], label: 'крупно', kind: 'text', where },
    { path: [...ref.path, 'text'], label: 'текст', kind: 'long', where },
    { path: [...ref.path, 'flavor'], label: 'цитата', kind: 'long', where },
  ];
}

export function seaFields(raw: Raw, i: number): Field[] {
  const card = raw.sea[i] as Raw;
  const where = ['Море', card.name];
  return [
    { path: ['sea', i, 'off'], label: 'в колоде', kind: 'bool', where },
    { path: ['sea', i, 'big'], label: 'крупно', kind: 'text', where },
    { path: ['sea', i, 'text'], label: 'текст', kind: 'long', where },
    { path: ['sea', i, 'flavor'], label: 'цитата', kind: 'long', where },
  ];
}

/** Every field the editor edits. */
export function allFields(raw: Raw): Field[] {
  const out: Field[] = [];
  (raw.ships as Raw[]).forEach((_, i) => out.push(...shipFields(raw, i)));
  out.push(...econFields());
  for (const ref of cardRefs(raw)) out.push(...cardNumberFields(raw, ref), ...cardTextFields(raw, ref));
  (raw.sea as Raw[]).forEach((_, i) => out.push(...seaFields(raw, i)));
  return out;
}

// ——— Changes and checks ———

/** The value of a field compared with the main data: «off» absent is false. */
const norm = (f: Field, x: unknown) => (f.kind === 'bool' ? !!x : x);

export function changed(f: Field, raw: Raw, base: Raw): boolean {
  return !same(norm(f, getAt(raw, f.path)), norm(f, getAt(base, f.path)));
}

export function changedFields(raw: Raw, base: Raw): Field[] {
  return allFields(raw).filter((f) => changed(f, raw, base));
}

/** The problem of one field in words, or null: «должно быть целое ≥ 0». */
export function fieldProblem(f: Field, value: unknown): string | null {
  switch (f.kind) {
    case 'int':
      return Number.isInteger(value) && (value as number) >= (f.min ?? 0) ? null : `должно быть целое ≥ ${f.min ?? 0}`;
    case 'num':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'должно быть числом';
    case 'text':
    case 'long':
      return typeof value === 'string' ? null : 'должно быть текстом';
    case 'track':
      return (TRACKS as readonly string[]).includes(value as string) ? null : 'нужно выбрать шкалу';
    case 'diag': {
      const d = value as Raw;
      if (d && Number.isInteger(d.offset)) return null;
      if (d && Number.isInteger(d.fixed) && d.fixed >= 0) return null;
      return 'должно быть целое число (смещение) или целое ≥ 0 (своё число)';
    }
    case 'bool':
      return null;
  }
}

export const problemText = (f: Field, problem: string) => `${[...f.where, f.label].join(' → ')}: ${problem}`;

/**
 * All problems of a data set in words with the path: first the editor's own checks of each field, then the problems
 * of the data loader (the same loader as the game and the server). Empty — the set is good.
 */
export function problems(raw: Raw): string[] {
  const out: string[] = [];
  try {
    for (const f of allFields(raw)) {
      const p = fieldProblem(f, getAt(raw, f.path));
      if (p) out.push(problemText(f, p));
    }
  } catch {
    // A broken structure: the loader below tells what is wrong.
  }
  if (out.length > 0) return out;
  try {
    loadGameData(raw);
  } catch (e) {
    return e instanceof DataError ? e.problems : [String(e instanceof Error ? e.message : e)];
  }
  return [];
}

/** «Текст карты мог устареть»: numbers of fx were changed, the texts of the card were not. */
export function textMayBeOld(raw: Raw, base: Raw, ref: CardRef): boolean {
  const card = getAt(raw, ref.path) as Raw;
  const was = getAt(base, ref.path) as Raw | undefined;
  if (!was) return false;
  return !same(card.fx, was.fx) && card.text === was.text && card.big === was.big;
}

// ——— Value / norm / excess (PDF page 25) ———

/** Norm of a card: Charge 1, Reaction 1.5, Order and Repair 2; +1 for each Powder or Soul of the cost; +2 for a Legend. */
export const BASE_NORM: Record<(typeof CARD_TYPES)[number], number> = { ЗАРЯД: 1, РЕАКЦИЯ: 1.5, ПРИКАЗ: 2, РЕМОНТ: 2 };

export function cardNorm(card: Raw): number {
  const base = BASE_NORM[card.type as (typeof CARD_TYPES)[number]] ?? 0;
  return base + num(card.cost) + num(card.soul) + (card.legend ? 2 : 0);
}

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

/** Value − norm: green at −0.5 and below, red at +0.5 and above. */
export const excessTone = (excess: number) => (excess <= -0.5 ? 'low' : excess >= 0.5 ? 'high' : 'even');

/** A deck by its copies: value, norm and excess (PDF page 25, table «Колоды»). */
export function deckBalance(raw: Raw, code: string): { value: number; norm: number; excess: number } {
  let value = 0;
  let normSum = 0;
  for (const card of (raw.decks?.[code] ?? []) as Raw[]) {
    const copies = num(card.copies);
    value += num(card.v) * copies;
    normSum += cardNorm(card) * copies;
  }
  return { value, norm: normSum, excess: value - normSum };
}

/** A number in Russian: 1,5; −0,5. */
export function fmt(x: number, digits = 1): string {
  const r = Number(x.toFixed(digits));
  return (r === 0 ? 0 : r).toFixed(digits).replace('.', ',').replace('-', '−');
}

/** What the input field holds: a number, or the text as typed when it is not a number (the check shows the problem). */
export function parseNumber(text: string): number | string {
  const t = text.trim().replace(',', '.').replace('−', '-');
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : text;
}

/** Short Russian names of fx keys and operations, next to the read-only names. */
export const OP_NAMES: Record<string, string> = {
  dmg: 'урон',
  n: 'число',
  fire: 'Пожары',
  if_fire: 'если Пожар',
  if_damaged: 'если ранен',
  counter: 'ответный урон',
  counter2: 'ответный урон 2',
  boarding: 'абордаж',
  ally_draw: 'союзник берёт карты',
  ally_extra_plays: 'союзнику карт сверх лимита',
  bottle: 'потопить с Корпусом ≤',
  compass: 'Компас',
  discard_enemy_each: 'каждый враг сбрасывает',
  draw: 'взять карты',
  draw_to_plan: 'взять в План',
  extra_plays: 'карт сверх лимита',
  extra_volley_free: 'доп. Залп, бонус',
  lose_crew: 'потеря Команды',
  mark: 'метка',
  no_react: 'без Реакций',
  no_repair: 'без Ремонта',
  pass: 'передать карты',
  powder: 'Порох',
  repair_ally: 'ремонт союзника',
  repair_crew_both: 'Команда обоим',
  repair_named: 'ремонт шкалы',
  repair_self: 'ремонт себя',
  repair_track: 'ремонт шкалы',
  repair_track_any: 'ремонт любой шкалы',
  rob: 'украсть Порох',
  sea_look: 'посмотреть море',
  soul: 'Души',
  team_volley_bonus: 'бонус Залпов команды',
  to_plan: 'в План',
  voodoo: 'Кукла вуду',
};

export function opName(op: string): string {
  const bare = op.replace(/^plan\./, '').replace(/ \(.*$/, '').replace(/ №\d+$/, '');
  return OP_NAMES[bare] ?? '';
}
