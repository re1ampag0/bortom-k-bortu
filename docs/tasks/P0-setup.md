Задача P0: подготовка репозитория к следующим задачам. Правила игры и движок не меняются.
Отвечай по-русски. Работаем на Windows (PowerShell).

Пользователь уже положил в рабочую папку новые файлы (они видны в `git status`):
`CLAUDE.md` (обновлён), `.claude/settings.json`, папку `docs/tasks/` (все файлы задач),
`scripts/dump-fx-events.ts`, папку `docs/mockups/anim/level1/` (эталон анимаций: `anim-demo.html`,
модули `*.js`, `style.css`, `validate.cjs`, `capture.mjs`, `README.md`, `PORTING.md`).

Сделай по шагам, коммит после каждого:

1. Ветка `p0-setup` от свежего `main` (`git switch main`, `git pull`, `git switch -c p0-setup`).
   Закоммить новые файлы как есть, ничего в них не меняя. Если старый `docs/mockups/anim/level1/`
   содержал другие файлы (старый эталон), они заменены — это нормально.
2. Проверка баланса в CI. Добавь `scripts/sim-check.ts` и команду `npm run sim:check`:
   запускает те же 3000 партий с seed 1, что `npm run sim`, печатает процент побед Пиратов
   и завершается с кодом 1, если он не равен 46,5 % (с округлением до 0,1). Добавь шаг
   `npm run sim:check` в job `build` в `.github/workflows/pages.yml` после `npm test`.
3. Проверь инструменты эталона (покажи вывод каждой команды):
   ```
   npx vite-node scripts/dump-fx-events.ts -- --games 100 --seed 1001 --out tmp/fx-games.json
   npx vite-node scripts/dump-fx-events.ts -- --games 50 --seed 2001 --out tmp/fx-net.json --net
   node docs/mockups/anim/level1/validate.cjs tmp/fx-games.json data/game-data.json
   node docs/mockups/anim/level1/validate.cjs tmp/fx-net.json data/game-data.json
   node docs/mockups/anim/level1/capture.mjs kraken 1500,3600 1366x660 tmp/ref
   ```
   Обе проверки должны закончиться строкой «ВСЁ СОВПАЛО», `capture.mjs` — создать 2 PNG.
   Добавь `tmp/` в `.gitignore`, если его там нет. Папку `tmp/` не коммить.
4. Честный `docs/PROGRESS.md`, раздел про анимации. Сейчас там написано, что `ShowLayer` показывает
   эффекты по `planFx`, но это не так: `planFx` и `useFxPlayer` из `src/ui/game/fxPlan.ts` /
   `fxPlayer.tsx` нигде не используются, кроме теста (проверь: `git grep -n "planFx\|useFxPlayer" src`).
   Запиши как есть. Отметь: новый эталон — `docs/mockups/anim/level1/` (62 сцены на событиях движка,
   включая Легенды); старые `fxPlan.ts`/`fxPlayer.tsx` заменит задача A1/A2.

Не делай: не меняй код игры, тесты, данные. Не трогай файлы в `docs/mockups/anim/level1/`.

Готово, когда (покажи вывод каждой команды):
- `npm run typecheck`, `npm test`, `npm run build` — без ошибок;
- `npm run sim:check` печатает 46,5 % и завершается с кодом 0 (покажи `echo $LASTEXITCODE`);
- обе проверки `validate.cjs` — «ВСЁ СОВПАЛО»;
- PR `p0-setup` → `main` создан через `gh pr create`, в описании — список файлов.
