// «Подробнее» of the turn summary (P4): the log of the enemy's last turn, with its cards as links.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { LogLine } from '../src/engine/log';
import type { Side } from '../src/engine/types';
import { LocalGame } from '../src/net/local';
import { enemyTurnLines } from '../src/ui/game/lastTurn';
import { LogList } from '../src/ui/game/Overlays';
import { data } from './helpers';

const line = (text: string, turn: Side): LogLine => ({ text, kind: 'action', round: 1, turn, action: 0, cards: [] });

describe('enemyTurnLines', () => {
  it('takes the last unbroken run of the enemy, oldest first', () => {
    const log = [line('a', 'ПИРАТЫ'), line('b', 'КОМПАНИЯ'), line('c', 'КОМПАНИЯ'), line('d', 'ПИРАТЫ'), line('e', 'КОМПАНИЯ'), line('f', 'КОМПАНИЯ'), line('g', 'ПИРАТЫ')];
    expect(enemyTurnLines(log, 'КОМПАНИЯ').map((l) => l.text)).toEqual(['e', 'f']);
    expect(enemyTurnLines(log, 'ПИРАТЫ').map((l) => l.text)).toEqual(['g']);
    expect(enemyTurnLines([line('a', 'ПИРАТЫ')], 'КОМПАНИЯ')).toEqual([]);
  });

  it('in a bot game: at the start of the Company turn, the Pirates turn with its cards as links', () => {
    const g = new LocalGame(data, { game: { seed: 1 }, players: { ПИРАТЫ: 'bot', КОМПАНИЯ: 'bot' }, openHands: true });
    let checked = 0;
    for (let i = 0; i < 3000 && !g.state.winner && checked < 6; i++) {
      const before = g.state.active;
      g.botStep();
      if (g.state.active === before || g.state.active !== 'КОМПАНИЯ') continue;
      const lines = enemyTurnLines(g.log, 'ПИРАТЫ');
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.every((l) => l.turn === 'ПИРАТЫ')).toBe(true);
      const at = g.log.lastIndexOf(lines.at(-1)!);
      expect(g.log.slice(at + 1).every((l) => l.turn !== 'ПИРАТЫ')).toBe(true);
      const html = renderToStaticMarkup(createElement(LogList, { data, log: lines, fresh: 0, onCard: () => {}, onSea: () => {} }));
      for (const code of lines.flatMap((l) => l.cards)) expect(html).toContain(`data-card="${code}"`);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(3);
  });
});
