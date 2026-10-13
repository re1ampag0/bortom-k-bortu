// The step queue: rules that may wait for a decision (a Reaction window, «Джек ускользает», «Тортуга»)
// are split into steps kept in the state, so the state stays plain JSON while the engine waits.
import { abilityStep } from './abilities';
import { cardStep } from './cards';
import { addFire, checkGameOver, dealDamage, sinkOrJack } from './damage';
import { openWindow } from './reactions';
import { swapPlaces, tortugaStep } from './sea';
import type { Ctx, Step } from './state';
import { fireStep, startRound, startTurn, turnReady } from './turn';
import { volleyStep } from './volley';

/** Runs queued steps until the queue is empty, the engine waits for a decision or the game is over. */
export function runQueue(ctx: Ctx): void {
  const { s } = ctx;
  while (s.queue.length > 0 && !s.pending && !s.winner) {
    runStep(ctx, s.queue.shift()!);
    if (!s.queue[0]?.same) checkGameOver(ctx);
  }
  if (s.winner) {
    s.queue = [];
    s.pending = null;
  }
}

function runStep(ctx: Ctx, step: Step): void {
  switch (step.k) {
    case 'startRound':
      return startRound(ctx);
    case 'startTurn':
      return startTurn(ctx, step.side);
    case 'fire':
      return fireStep(ctx, step.ship);
    case 'surface':
      return abilityStep(ctx, step);
    case 'turnReady':
      return turnReady(ctx, step.side);
    case 'damage':
      dealDamage(ctx, step.ship, step.track, step.n, step.src);
      return;
    case 'addFire':
      return addFire(ctx, step.ship, step.n);
    case 'sink':
      return sinkOrJack(ctx, step.ship);
    case 'swap':
      swapPlaces(ctx, step.side, step.reason);
      return;
    case 'tortuga':
      return tortugaStep(ctx);
    case 'window':
      return openWindow(ctx, step.window, step.subject);
    case 'volleyHit':
    case 'volleyFire':
    case 'volleyEnd':
      return volleyStep(ctx, step);
    case 'cardEffect':
    case 'cardOp':
    case 'cardPaid':
    case 'cardEnd':
      return cardStep(ctx, step);
  }
}
