// Партии ботов → события каждого действия глазами каждой команды (как после eventsFor) + состояние после.
// Нужен для проверки слоя анимаций: node docs/mockups/anim/level1/validate.cjs <файл> data/game-data.json
// Запуск: npx vite-node scripts/dump-fx-events.ts -- --games 100 --seed 1001 --out tmp/fx-games.json [--net]
//   --net — окна Реакций открываются и ждут ответа даже без подходящих карт (как в сетевой игре).
import raw from '../data/game-data.json';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadGameData } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/engine';
import { botAnswer, botTurn, newBotMemory, type BotFeedback } from '../src/engine/ai/bot';
import { RuleError, type Action, type GameState } from '../src/engine/state';
import { eventsFor } from '../src/engine/view';

const arg = (name: string, def: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : def; };
const games = Number(arg('games', '100')), seed0 = Number(arg('seed', '1001')), out = arg('out', 'tmp/fx-games.json');
const net = process.argv.includes('--net');
const data = loadGameData(raw as never);
const P = ['Ж', 'М'], C = ['И', 'Г'];
const compact = (s: GameState) => ({
  round: s.round, active: s.active, sea: s.sea?.current ?? null,
  powder: Object.fromEntries(Object.entries(s.teams).map(([k, t]) => [k, t.powder])),
  ships: Object.fromEntries(Object.values(s.ships).map((x) => [x.code, { pos: x.pos, tracks: x.tracks, fires: x.fires, sunk: x.sunk, submerged: x.submerged, souls: x.souls, legend: x.legend, hand: x.hand }])),
});
const result: unknown[] = [];
for (let seed = seed0; seed < seed0 + games; seed++) {
  const mem = newBotMemory(seed ^ 0x2545f491);
  const created = createGame(data, { seed, variant: 'standard', ...(net ? { pauseEmptyWindows: true } : {}) } as never);
  let state = created.state;
  const start = compact(state);
  const steps: unknown[] = [];
  let n = 0;
  const apply = (action: Action) => {
    const r = applyAction(state, action, data);
    state = r.state;
    steps.push({ n: ++n, a: action, P: eventsFor(state, P, r.events), C: eventsFor(state, C, r.events), after: compact(state) });
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
      try { apply(next.value); fb = { state }; } catch (e) { if (!(e instanceof RuleError)) throw e; fb = { state, error: (e as Error).message }; }
      settle();
      fb.state = state;
      next = turn.next(fb);
    }
  }
  result.push({ seed, start, steps });
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result));
console.log(`партий: ${result.length}, действий: ${result.reduce((k: number, g: any) => k + g.steps.length, 0)} → ${out}`);
