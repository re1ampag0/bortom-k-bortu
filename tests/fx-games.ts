// Bot games for the tests of the animation layer: every action with the events each team sees
// (as scripts/dump-fx-events.ts plays them).
import { botAnswer, botTurn, newBotMemory, type BotFeedback } from '../src/engine/ai/bot';
import { applyAction, createGame } from '../src/engine/engine';
import { RuleError, type Action, type GameEvent, type GameState } from '../src/engine/state';
import { eventsFor } from '../src/engine/view';
import { data } from './helpers';

export const SIDES = { P: ['Ж', 'М'], C: ['И', 'Г'] } as const;

export interface Step {
  n: number;
  action: Action;
  events: Record<'P' | 'C', GameEvent[]>;
  after: GameState;
}

/** A bot game as scripts/dump-fx-events.ts plays it: every action with the events each team sees. */
export function playGame(seed: number, net: boolean): { start: GameState; steps: Step[] } {
  const mem = newBotMemory(seed ^ 0x2545f491);
  let state = createGame(data, { seed, variant: 'standard', ...(net ? { pauseEmptyWindows: true } : {}) } as never).state;
  const start = state;
  const steps: Step[] = [];
  const apply = (action: Action) => {
    const r = applyAction(state, action, data);
    state = r.state;
    steps.push({ n: steps.length + 1, action, events: { P: eventsFor(state, SIDES.P, r.events), C: eventsFor(state, SIDES.C, r.events) }, after: state });
  };
  const settle = () => {
    while (state.pending && !state.winner) {
      const p = state.pending as { kind: string; waiting?: string[] };
      apply(p.kind === 'reactions' && p.waiting && p.waiting.length === 0 ? ({ type: 'closeWindow' } as Action) : botAnswer(state, data, mem));
    }
  };
  settle();
  for (let guard = 0; !state.winner && guard < 400; guard++) {
    const turn = botTurn(state, data, mem.rng);
    let next = turn.next();
    while (!next.done && !state.winner) {
      let fb: BotFeedback;
      try {
        apply(next.value);
        fb = { state };
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
        fb = { state, error: (e as Error).message };
      }
      settle();
      fb.state = state;
      next = turn.next(fb);
    }
  }
  return { start, steps };
}
