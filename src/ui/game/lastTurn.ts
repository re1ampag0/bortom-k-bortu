// «Что было за ход» (P4): the lines of the log of the enemy's last turn, for «Подробнее» of the turn summary.
import type { LogLine } from '../../engine/log';
import type { Side } from '../../engine/types';

/** The last unbroken run of log lines of the enemy's turn, oldest first; empty before the enemy's first turn. */
export function enemyTurnLines(log: LogLine[], enemy: Side): LogLine[] {
  let end = log.length;
  while (end > 0 && log[end - 1].turn !== enemy) end--;
  let start = end;
  while (start > 0 && log[start - 1].turn === enemy) start--;
  return log.slice(start, end);
}
