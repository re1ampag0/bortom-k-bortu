// Guard against a bloated repository (CI, build job). Reports — screenshots, measurements, one-off capture
// scripts — are not kept in git: they go to report/ or e2e-shots/ (both ignored) and to the PR as attachments.
// Fails when a report folder is tracked, a single file is too big, or docs/ grows past its budget.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const FORBIDDEN = ['docs/screenshots/', 'docs/measurements/', 'report/', 'e2e-shots/', 'test-results/'];
const MAX_FILE = 5 * 1024 * 1024; // one file
const MAX_DOCS = 100 * 1024 * 1024; // the whole docs/ folder

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const problems = [];
let docs = 0;
for (const f of files) {
  const dir = FORBIDDEN.find((d) => f.startsWith(d));
  if (dir) {
    problems.push(`${f}: папка ${dir} не хранится в git (отчёты — в report/, к PR — вложением)`);
    continue;
  }
  let size;
  try {
    size = statSync(f).size;
  } catch {
    continue; // not checked out here (sparse checkout)
  }
  if (size > MAX_FILE) problems.push(`${f}: ${(size / 1048576).toFixed(1)} МБ, больше ${MAX_FILE / 1048576} МБ на файл`);
  if (f.startsWith('docs/')) docs += size;
}
if (docs > MAX_DOCS) problems.push(`docs/: ${(docs / 1048576).toFixed(0)} МБ, больше ${MAX_DOCS / 1048576} МБ на папку`);

if (problems.length) {
  console.error('Репозиторий раздувается:\n' + problems.slice(0, 40).map((p) => '  ' + p).join('\n'));
  if (problems.length > 40) console.error(`  … и ещё ${problems.length - 40}`);
  process.exit(1);
}
console.log(`check-size: ${files.length} файлов, docs/ ${(docs / 1048576).toFixed(0)} МБ — в порядке`);
