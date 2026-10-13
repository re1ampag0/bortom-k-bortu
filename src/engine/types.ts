// Types of the game data (data/game-data.json). Field names follow reference/data3.py.

export type CardType = 'ЗАРЯД' | 'РЕАКЦИЯ' | 'ПРИКАЗ' | 'РЕМОНТ';
export type Side = 'ПИРАТЫ' | 'КОМПАНИЯ';
export type Track = 'hull' | 'sails' | 'guns' | 'crew';

/** One operation inside fx.ops, e.g. ["dmg", "any", "hull", 4]. */
export type Op = [string, ...(string | number)[]];

/** Machine description of a card effect, as in data3.py. */
export interface Fx {
  ops?: Op[];
  r?: string;
  dmg?: number;
  track?: Track;
  n?: number;
  counter?: [Track, number | 'guns'];
  counter2?: [Track, number | 'guns'];
  plan?: Fx;
  fire?: number;
  if_fire?: number;
  if_damaged?: number;
  vs?: string;
  self_only?: boolean;
  no_diag?: boolean;
  cards?: boolean;
  both?: boolean;
  diag_only?: boolean;
  plan_any?: boolean;
  paid?: boolean;
  no_react?: boolean;
}

export interface Card {
  name: string;
  type: CardType;
  cost: number;
  soul: number;
  big: string;
  text: string;
  flavor: string;
  v: number;
  fx: Fx;
  legend: boolean;
  tags: string[];
}

export interface DeckEntry extends Card {
  copies: number;
}

export type DiagDamage = { offset: number } | { fixed: number };

/** A ship's own Volley mode: works like a Charge (fx plus extra Powder), available every turn. */
export interface VolleyMode {
  name: string;
  text: string;
  cost: number;
  fx: Fx;
}

export interface Ability {
  name: string;
  text: string;
}

export interface Ship {
  code: string;
  name: string;
  short: string;
  captain: string;
  side: Side;
  color: string;
  motto: string;
  hull: number;
  sails: number;
  guns: number;
  crew: number;
  souls?: number;
  start_souls?: number;
  abilities: Ability[];
  legend: string;
  tips: string[];
  volleyCost: number;
  diagDamage: DiagDamage;
  defaultTrack: Track;
  volleysPerTurn: number;
  volleyModes: VolleyMode[];
}

export interface SeaCard {
  name: string;
  when: 'Весь раунд' | 'Сразу';
  big: string;
  text: string;
  flavor: string;
  key: string;
}

export interface Econ {
  income: number;
  first_income: number;
  cap: number;
  second_start: number;
}

/** Rule numbers of version 0.3 that data3.py keeps in code. */
export interface Rules {
  /** Players draw up to this many cards. */
  hand: number;
  /** After this many rounds without a winner the game is a draw. */
  maxRounds: number;
  /** Fires on one ship. */
  maxFires: number;
  /** Powder for selling a card. */
  sellGain: number;
  /** Powder for a regroup. */
  regroupCost: number;
  /** Extra damage of a joint volley. */
  jointBonus: number;
  /** Company's starting Powder in the "first game" variant. */
  firstGameSecondStart: number;
  /** Most Powder a "paid" Charge («Оплаченный залп») may take. */
  paidChargeMax: number;
}

export interface GameData {
  version: string;
  econ: Econ;
  rules: Rules;
  ships: Ship[];
  /** Deck of each ship by ship code. */
  decks: Record<string, DeckEntry[]>;
  /** Legend card of each ship by ship code. */
  legends: Record<string, Card>;
  sea: SeaCard[];
}

/** A single physical card with its code, as in data3.py: "Ж-01", "Ж-Л". */
export interface CardInstance extends Card {
  code: string;
  deck: string;
}

export interface SeaCardInstance extends SeaCard {
  code: string;
}
