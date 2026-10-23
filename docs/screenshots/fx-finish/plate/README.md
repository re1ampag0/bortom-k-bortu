# Разбор урона — выбор А/Б

Все кадры — Chromium, DPR2, одинаковые seed, часы и события сцены `whirl`.
Размеры: `*-phone` 430×932, `*-laptop` 1366×660. Файлы `1000` — до Реакции,
`2600` — после Реакции, `4600` — тот же разбор во время попадания.
`before` — старый вид из шага4, `after` — соответствующий вариант.

- А — одна лента в зазоре моря. Слагаемые и итог обновляются в том же элементе.
- Б — метки слагаемых у цели, итог рядом с колонкой шкалы, без центральной ленты.
  Полный разбор уже записывается в игровой журнал (`engine/log.ts`, без изменений).

До выбора ни один вариант не включён в обычной сборке. Просмотр только в dev/e2e:
`?fxScene=whirl&manual=1&speed=normal&plateReview=A` (или B).

Съёмка: `node scripts/fx-finish/capture.mjs BEFORE_DIST AFTER_DIST whirl --plate=A --width=430 --height=932 --out docs/screenshots/fx-finish/plate/a-phone`.
Проверка записанной геометрии: `node scripts/fx-finish/check-plate-review.mjs`.
