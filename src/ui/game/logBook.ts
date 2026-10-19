// «Судовой журнал» as a ship's book (PH, part 5; docs/mockups/a5/phone/src/phone_tpl.html, logBook): the margin of a line —
// «раунд·ход» — counted from the log the client already has, no new field in the engine.
import type { LogLine } from '../../engine/log';
import { roman } from './text';

/**
 * The mark on the margin of each line: «II·3» — the round in roman numbers and the turn of the round (the lines «Ход …»
 * counted from the round's start); a line before the first turn of its round (the round, the sea) — the round alone, «II»;
 * the deal before the first round — nothing.
 */
export function logMarks(log: LogLine[]): string[] {
  let round = -1;
  let turn = 0;
  return log.map((l) => {
    if (l.round !== round) {
      round = l.round;
      turn = 0;
    }
    if (l.kind === 'turn') turn++;
    if (l.round < 1) return '';
    const r = roman(l.round);
    return turn > 0 ? `${r}·${turn}` : r;
  });
}
