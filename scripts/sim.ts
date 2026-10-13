// Console simulator: npm run sim -- --games 3000 --seed 1 [--variant first]
// Bots of both teams play by the engine; the result is printed next to the PDF (page 26).
import raw from '../data/game-data.json';
import { loadGameData } from '../src/engine/data';
import { PDF_REFERENCES, formatReport, runSims, summarize } from '../src/engine/sim/sim';
import type { Variant } from '../src/engine/state';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const games = Number(arg('games', '1000'));
const seed = Number(arg('seed', '1'));
const variant = arg('variant', 'standard') as Variant;
if (!Number.isInteger(games) || games < 1 || !Number.isInteger(seed) || !['standard', 'first', 'quick'].includes(variant)) {
  console.error('Использование: npm run sim -- --games 3000 --seed 1 [--variant standard|first|quick]');
  process.exit(1);
}

const data = loadGameData(raw);
const started = Date.now();
const result = runSims(data, { games, seed, variant });
const label = `${games} партий, seed ${seed}, вариант ${variant} (${((Date.now() - started) / 1000).toFixed(1)} с)`;
console.log(formatReport(summarize(result), label, PDF_REFERENCES[variant] ?? null));
