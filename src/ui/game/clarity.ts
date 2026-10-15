// Words that make the table clear the first time (P8): what the attacker waits for while the enemy decides on a
// Reaction. Nothing here tells which enemy ship holds a Reaction: only the team, the people's names and «бот».
import { threatLine } from '../../engine/hints';
import type { GameState } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import { SIDE_LABEL } from './text';

/** «решает» for the Company, «решают» for the Pirates. */
export const decideVerb = (side: Side) => (side === 'ПИРАТЫ' ? 'решают' : 'решает');
/** «Компания решает», «Пираты решают». */
export const decidesWord = (side: Side) => `${SIDE_LABEL[side].name} ${decideVerb(side)}`;

/** A seat the attacker sees deciding: a person (by network, with a name) or a bot. */
export interface Decider {
  bot: boolean;
  name: string | null;
}

/**
 * The plate of the attacker while the defending team decides on a Reaction: the Volley (or the card) in words and
 * who decides. `deciders` — the seats the attacker sees deciding (by network the view shows the whole team).
 */
export function reactionWait(s: GameState, data: GameData, side: Side, deciders: Decider[]): { line: string; who: string } {
  const what = threatLine(s, data) ?? `Ход ${SIDE_LABEL[s.active].gen}`;
  const people = [...new Set(deciders.filter((x) => !x.bot && x.name).map((x) => x.name!))];
  const bots = deciders.some((x) => x.bot);
  const who =
    people.length > 0
      ? `${people.length > 1 || bots ? 'Решают' : 'Решает'}: ${people.join(', ')}${bots ? ' и бот' : ''}`
      : bots
        ? 'Бот думает…'
        : `${decidesWord(side)}…`;
  return { line: `${what}. ${decidesWord(side)}, ответить ли Реакцией…`, who };
}
