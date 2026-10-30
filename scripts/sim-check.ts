// The balance reference of version 0.3 (PDF page 26) on the frozen data of the tests, not on data/game-data.json:
// the site's data may be changed by the editor, the reference may not.
import raw from '../tests/fixtures/game-data.v0.3.json';
import { loadGameData } from '../src/engine/data';
import { runSims, summarize } from '../src/engine/sim/sim';

const data = loadGameData(raw);
const summary = summarize(runSims(data, { games: 3000, seed: 1, variant: 'standard' }));
const pirates = Math.round(summary.pirates * 10) / 10;

console.log(`Победы Пиратов: ${pirates.toFixed(1).replace('.', ',')} %`);
if (pirates !== 46.5) {
  console.error(`Ожидалось 46,5 %, получено ${pirates.toFixed(1).replace('.', ',')} %`);
  process.exitCode = 1;
}
