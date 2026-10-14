Задача A2: слой анимаций на столе и Залп (объявление → окно Реакций → выстрел). Отвечай по-русски.
Нужна сделанная A1 (`src/ui/game/fx/planFx.ts`, `display.ts`).

**Сначала прочитай** `docs/mockups/anim/level1/PORTING.md` (разделы 2–5), затем `effects.js` (167 строк)
и `play-volley.js` (~380 строк). Сцены для сравнения: `plain`, `storm`, `diag`, `greek`, `joint`, `paid`,
`mark`, `both`, `overkill`, `knippel`. Переноси код примитивов и клипов как есть, меняя только способ
найти элемент (DOM-контракт) и типы.

Ветка `a2-fx-volley`. Сначала план (режим плана), потом шаги, коммит после каждого:

1. **DOM-контракт** (PORTING, раздел 3): добавь атрибуты `data-fx-*` в `Table.tsx`, `Hand.tsx`, `Game.tsx`.
   Тест (Vitest + jsdom или e2e) — что у каждого планшета есть `data-fx-ship` и 4 `data-fx-track`.
2. **Примитивы** → `src/ui/game/fx/primitives.ts` (из `effects.js`): `ms, wait, at, A, bx, mk, fxPoint,
   setTrack, shownTrack, curve, fly, pop, flash, puff, burst, splash, tag, bubbles, steam, shake, ring,
   overlayAt, whirlpool, wisp, projectile, payKegs, gainKegs, flyCard, moveTo, cardOrigin, hint, pill,
   pillAt`. Вместо глобальных `board/fx/D` — объект контекста `FxCtx { board, layer, display, speed,
   rich, run }`, который передаётся первым аргументом. CSS эффектов → `src/ui/game/fx/fx.css`.
3. **Очередь** → `src/ui/game/fx/FxLayer.tsx` + `useFxQueue` (PORTING, раздел 4): отображаемое
   состояние отстаёт от настоящего; клип играет → применяются его события → перерисовка.
   «Мгновенно», `prefers-reduced-motion`, «Сразу итог» и нажатие по столу (не по руке и не по окну
   решения) → сразу настоящее состояние, слой очищен. Скорость — множитель из P4 (1,6 / 1 / 0,6).
   Переходный период: если ВСЕ клипы действия есть в `PLAY` — действие показывает `FxLayer`;
   если хоть одного нет — всё действие показывает старый `ShowLayer` (как сейчас). Так оба слоя
   никогда не играют одно действие одновременно. A4 удалит `ShowLayer`, когда перенесено всё.
4. **Клипы Залпа** → `src/ui/game/fx/volley.ts`: `announce`, `window`, `reaction`, `shot`, `cancel`,
   `counter`, `heart` (из `play-volley.js`). Плашка разбора и карты у плашки живут между клипами одного
   Залпа (`VS`); после перерисовки возвращаются подсветка и наклоны (`afterRender`, `lean`).
   С `volley.terms` (A1) плашка при объявлении показывает разбор сразу.
5. **Вход для проверок** `?fxScene=<id>` — только в dev-сборке и e2e (в `build` для GitHub Pages его нет):
   берёт стартовое состояние и события сцены из `docs/mockups/anim/level1/scenes.js` и проигрывает их
   через `useFxQueue` без движка. Им пользуются все следующие задачи (A2b, A3, A4, S1, L1).
6. **e2e** `e2e/fx-volley.spec.ts` (через `?fxScene=plain`, `storm`, `joint`, `both`):
   - слой `.fx-layer` не перехватывает нажатия (`elementFromPoint` над планшетами и картами руки
     во время показа даёт сам элемент — как `clickthrough` в эталоне);
   - после показа числа шкал = настоящему состоянию; карта в руке открывается во время показа;
   - скриншоты в 3 момента на 1366×660 и 430×740 → `docs/screenshots/a2/`; рядом кадры эталона
     (`capture.mjs plain …`, `capture.mjs storm …`) → `docs/screenshots/a2/ref/`.

Не делай: не меняй правила и ботов; не переносить Легенды, море, смену мест (это L1, S1, A3).

Готово, когда (покажи вывод): `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e`,
`npm run sim:check` — без ошибок; скриншоты игры и эталона лежат парами; в отчёте — таблица
«сцена эталона → кадр игры → совпадает / чем отличается». PR создан.
