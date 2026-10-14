Задача A1: данные для анимаций — поля событий, планировщик и отображаемое состояние. Без рисования.
Отвечай по-русски. Правила, решения ботов и баланс не меняются (`npm run sim:check` = 46,5 %).

**Сначала прочитай** `docs/mockups/anim/level1/PORTING.md` целиком, затем `planfx.js` из той же папки
(482 строки, всё нужное внутри). Открой `anim-demo.html` в браузере и посмотри 3–4 сцены: справа видно,
какие события приходят и какие клипы из них строятся. Переноси `planfx.js` в TypeScript **один к одному**
(имена функций и полей клипов те же), не переписывай по-своему.

Что есть сейчас: `src/ui/game/fxPlan.ts` (старый `planFx`, ошибка — промахи считаются дважды),
`src/ui/game/fxPlayer.tsx`, тест `tests/fx-plan.test.ts`. Они нигде не подключены.

Ветка `a1-fx-data`. Сначала покажи план (режим плана), потом шаги, коммит после каждого:

1. **Порт планировщика** → `src/ui/game/fx/planFx.ts`:
   `createPlanner`, `layoutShots`, `termSrc`, `KIND_BY_TRACK`, `ABSORB`, `QUIET`; типы `FxClip`
   (объединение по `kind`: `announce | window | reaction | shot | cancel | counter | heart | card | legend |
   jack | sea | round | turn | turnEnd | swap | dive | surface | sink | impact | fire | repair | powder |
   souls | status | draw | sell | pass | steal | discard | peek | dice | fireOut | ability | end | fallback`),
   `Shot` (`kind, out, label, units, to, big?`). Входные события — тип `GameEvent` из движка.
2. **Порт отображаемого состояния** → `src/ui/game/fx/display.ts`: `applyVisible(display, event, rules)`
   и `displayFrom(state)` (берёт из `GameState` поля `round, active, sea, powder, ships{pos, tracks,
   fires, sunk, submerged, souls, legend}`).
3. **Тест эквивалентности** `tests/fx-plan.test.ts` (перепиши старый): прямо в тесте сыграй 60 партий
   ботов (как в `scripts/dump-fx-events.ts`; 30 обычных и 30 с `pauseEmptyWindows`), для каждой стороны:
   - каждое событие попадает ровно в один клип или в `quiet`;
   - у каждого `shot`: долетевших (`hit`+`overkill`+`moon`, с учётом `units`) = `damage`,
     `hit` с `to: 'track'` = `amount`, с `to: 'hull'` = `toHull`;
   - `applyVisible` по всем событиям = `displayFrom(after)` после каждого действия;
   - нет клипов `fallback`.
   Плюс тест «как эталон»: для 3 сцен эталона (`plain`, `wind`, `kraken`) — те же `kind` клипов и та же
   раскладка ядер, что выдаёт `planfx.js` (события сцены возьми из `scenes.js` через `require` в тесте
   или скопируй в `tests/fixtures/fx-scenes.json` скриптом — выбери сам и объясни).
4. **Поля событий** (движок; правила не меняются; тексты журнала не меняются):
   а) `Term.src` — откуда слагаемое: `{kind:'guns'} | {kind:'diag'} | {kind:'charge',card} |
      {kind:'sea',card} | {kind:'reaction',card} | {kind:'joint',ally} | {kind:'surface'} | {kind:'flags'} |
      {kind:'mark'} | {kind:'paid'} | {kind:'clear'} | {kind:'extra',card}`. Заполняется в `volley.ts`
      (`volleyTerms`) и `reactions.ts`. `termSrc` в планировщике берёт `t.src`, если он есть.
   б) Событие `volley` получает `terms: Term[]` — разбор при объявлении (плашка до Реакций).
   в) `drew.cards?: string[]` — видно только владельцу руки (и союзнику, если видит руки) — в `eventsFor`.
   г) `stolen`: лицо карты видят только укравший и обокраденный (и их союзники, если видят руки).
   д) «Девятый вал» в начале хода шлёт `seaEffect { key: 'wave' }` перед уроном (планировщик готов).
   Тесты утечек в `tests/view.test.ts` и `tests/server.test.ts` расширь на в)–г).
5. Удали старые `src/ui/game/fxPlan.ts` и `fxPlayer.tsx` (проверь `git grep`, что их никто не импортирует).

Не делай: никакого рисования, CSS и подключения к `ShowLayer` (это A2). Не меняй `planfx.js` в эталоне.

Готово, когда (покажи вывод):
- `npm test`, `npm run typecheck`, `npm run build`, `npm run build:server`, `npm run sim:check` (46,5 %) —
  без ошибок; новый тест проходит, в его выводе — сколько клипов каждого вида встретилось;
- `node docs/mockups/anim/level1/validate.cjs tmp/fx-games.json data/game-data.json` после изменений
  движка (перегенерируй дамп) — по-прежнему «ВСЁ СОВПАЛО»;
- PR создан; отчёт таблицей «требование → сделано/не сделано → доказательство».
