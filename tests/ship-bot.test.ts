// The bot on one ship next to a person (stage 8, network games): it plays only its own seat, after the person
// pressed «Ход окончен», and games with it end with the rules kept. The team bot (bot.ts) is not used for its ship.
import { describe, expect, it } from 'vitest';
import { botAnswer, botTurn, newBotMemory } from '../src/engine/ai/bot';
import { seatAnswer, shipBotStep, refusedShipBot, type ShipBots } from '../src/engine/ai/shipBot';
import { applyAction, createGame } from '../src/engine/engine';
import { RuleError, type Action, type GameState } from '../src/engine/state';
import { act, brokenInvariants, data, turnOf } from './helpers';

/** Seats of the actions that act for a seat or a ship. */
function seatOf(a: Action): string | null {
  if ('seat' in a) return a.seat;
  if ('ship' in a) return a.ship;
  return null;
}

/**
 * The Pirates: «Жемчужина» is a person who does nothing but say no, «Месть» is the ship bot. The Company: the
 * team bot. Returns the seats the ship bot acted for and the final state.
 */
function play(seed: number): { state: GameState; botSeats: Set<string>; botActions: number } {
  let s = createGame(data, { seed }).state;
  const mem = newBotMemory(seed);
  const botSeats = new Set<string>();
  let botActions = 0;
  let runs: ShipBots = {};
  let team: { key: string; gen: ReturnType<typeof botTurn>; error?: string } | null = null;
  const apply = (a: Action) => {
    s = applyAction(s, a, data).state;
    for (const p of brokenInvariants(s)) throw new Error(`seed ${seed}: ${p}`);
  };
  for (let i = 0; i < 20000 && !s.winner; i++) {
    const p = s.pending;
    if (p) {
      if (p.kind === 'reactions' && p.side === 'ПИРАТЫ') {
        apply(p.waiting[0] === 'Ж' ? { type: 'noReaction', seat: 'Ж' } : seatAnswer(s, data, mem, p.waiting[0]));
      } else if (p.kind === 'choice' && p.waiting[0] === 'Ж') {
        const a = botAnswer(s, data, mem);
        apply(a);
      } else if (p.kind === 'choice' && p.waiting[0] === 'М') {
        apply(seatAnswer(s, data, mem, 'М'));
      } else {
        apply(botAnswer(s, data, mem));
      }
      continue;
    }
    const key = `${s.round}:${s.active}`;
    if (s.active === 'ПИРАТЫ') {
      // The person pressed «Ход окончен» at once; the ship bot moves, then the turn ends.
      const action = shipBotStep(runs, s, data, mem.rng, 'М');
      if (!action) {
        apply({ type: 'endTurn', side: 'ПИРАТЫ', plans: runs['М']?.plans });
        runs = {};
        continue;
      }
      botActions++;
      const seat = seatOf(action);
      if (seat) botSeats.add(seat);
      try {
        apply(action);
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
        refusedShipBot(runs, 'М', e.message);
      }
      continue;
    }
    if (!team || team.key !== key) team = { key, gen: botTurn(s, data, mem.rng) };
    const next = team.gen.next({ state: s, error: team.error });
    team.error = undefined;
    const action: Action = next.done ? { type: 'endTurn', side: 'КОМПАНИЯ' } : next.value;
    try {
      apply(action);
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      team.error = e.message;
    }
  }
  return { state: s, botSeats, botActions };
}

describe('ship bot', () => {
  it('in 200 games it plays only its own ship, keeps the rules, and the games end within 30 rounds', () => {
    let actions = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const r = play(seed);
      expect(r.state.winner).not.toBeNull();
      expect(r.state.round).toBeLessThanOrEqual(30);
      for (const seat of r.botSeats) expect(['М']).toContain(seat);
      actions += r.botActions;
    }
    // It does play: Volleys, cards, selling.
    expect(actions / 200).toBeGreaterThan(5);
  });

  it('answers a Reaction window only for its own seat', () => {
    let s = turnOf('КОМПАНИЯ', { Ж: ['Уйти по ветру'], М: ['Прикрыть бортом'] });
    s = act(s, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions', waiting: ['Ж', 'М'] });
    const a = seatAnswer(s, data, newBotMemory(1), 'М');
    expect(seatOf(a)).toBe('М');
  });
});
