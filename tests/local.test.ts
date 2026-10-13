// The game on one device: bots play through it as in the simulator, the record replays the game, Undo goes back
// only over moves that opened nothing new (docs/TZ.md, «Интерфейс → Undo»).
import { describe, expect, it } from 'vitest';
import { replay, type MatchSetup } from '../src/engine/match';
import { playGame } from '../src/engine/sim/sim';
import { cardByCode } from '../src/engine/state';
import { LocalGame } from '../src/net/local';
import { data, POSITIONS } from './helpers';

const bots = (seed: number): MatchSetup => ({ game: { seed }, players: { ПИРАТЫ: 'bot', КОМПАНИЯ: 'bot' }, openHands: true });

function playOut(g: LocalGame): void {
  for (let i = 0; i < 20000 && !g.state.winner; i++) {
    if (!g.botStep()) throw new Error('the game waits for nobody');
  }
}

describe('LocalGame', () => {
  it('a bot match plays the same game as the simulator', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = new LocalGame(data, bots(seed));
      playOut(g);
      const sim = playGame(data, seed);
      expect([g.state.winner, g.state.round]).toEqual([sim.winner, sim.rounds]);
    }
  });

  it('the log describes every event of 20 bot games in words', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = new LocalGame(data, bots(seed));
      playOut(g);
      for (const line of g.log) expect(line.text).not.toMatch(/undefined|NaN|\[object/);
      expect(g.log.at(-1)!.kind).toBe('end');
      expect(g.log.filter((l) => l.text.startsWith('Попадание')).length).toBeGreaterThan(0);
    }
  });

  it('the log of the first round starts from the empty Hold of the Pirates', () => {
    const g = new LocalGame(data, bots(1));
    expect(g.log.map((l) => l.text)).toContain('Пираты: +2 Пороха (Трюм) → 2.');
  });

  it('the record replays the game to the same state', () => {
    const g = new LocalGame(data, bots(7));
    playOut(g);
    const record = g.record();
    expect(replay(data, record.setup, record.actions)).toEqual(g.state);
    expect(LocalGame.fromRecord(data, JSON.parse(JSON.stringify(record))).state).toEqual(g.state);
  });

  it('Undo: a sale is undone; after the end of the turn Undo is grey with the reason', () => {
    const g = new LocalGame(data, {
      game: { seed: 3, positions: POSITIONS, sea: false },
      players: { ПИРАТЫ: 'human', КОМПАНИЯ: 'bot' },
      openHands: false,
    });
    expect(g.undoRefusal('ПИРАТЫ')).toContain('Нечего отменять');
    const before = g.state;
    const card = g.state.ships['Ж'].hand[0];
    expect(g.act({ type: 'sell', seat: 'Ж', card })).toBeNull();
    expect(g.undoRefusal('ПИРАТЫ')).toBeNull();
    expect(g.undo()).toBe(true);
    expect(g.state).toEqual(before);
    expect(g.actions).toEqual([]);
    expect(g.act({ type: 'endTurn', side: 'ПИРАТЫ' })).toBeNull();
    expect(g.undoRefusal('ПИРАТЫ')).toBe('Отменить нельзя: ход окончен');
    // Now the bots of the Company move; the human may not act for them.
    expect(g.botToMove()).toBe(true);
    expect(g.act({ type: 'endTurn', side: 'КОМПАНИЯ' })).toBe('Сейчас решает бот');
    expect(cardByCode(data, card).name).toBeTruthy();
  });

  it('a refused move changes nothing and gives the reason', () => {
    const g = new LocalGame(data, { game: { seed: 3 }, players: { ПИРАТЫ: 'human', КОМПАНИЯ: 'human' }, openHands: false });
    const v = g.version;
    expect(g.act({ type: 'regroup', side: 'КОМПАНИЯ' })).toBe('Сейчас ход другой команды');
    expect(g.version).toBe(v);
  });
});
