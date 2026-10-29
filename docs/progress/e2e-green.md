# e2e-green

Ветка `e2e-green`, база main `5f097c5866b492ed1564f4d737d09cab1d9d1784` (PR #85). Исходники и ветка fps-pass не менялись.

## Исходный main

Полный прогон собранного исходного main: **209 тестов, 169 passed, 40 failed, 0 flaky, 0 skipped, 49,6 мин**. Chromium и настоящий WebKit, один worker, CI=1.

Доказательства: `docs/measurements/e2e-green/main-e2e.json`, `main-failures.json`. Сервер baseline до конца отдавал исходную сборку main. WebKit-проверки, ещё не исполненные baseline, диагностировались временными копиями.

## Каждое исходное падение

| № / тест / проект | Причина | Исправление |
|---|---|---|
| 1. clarity.spec.ts / laptop 1366×660 / the attacker sees the Volley and «бот думает» while the Company decides on a Reaction (chromium) | Ожидание устарело, PR #84 98ae1d89 | Новая строка ожидания бота, проверки скрытых карт и паузы сохранены. |
| 2. clarity.spec.ts / laptop 1366×660 / without «Подсказки» the Reaction window: «Тревога!», the Reaction chosen in the hand says what happens now, «i» gives the full card (chromium) | Ожидание устарело, PR #84 и #85 a8f69f74 | Выбор Реакции проверяется внутри нового листа; эффект в руке по-прежнему зависит от подсказок. |
| 3. clarity.spec.ts / phone 430×740 / the Reaction window: a sheet with the Reactions as cards, a press chooses, «i» opens the card and keeps the choice, «Сыграть» from it plays (chromium) | Ожидание устарело, PR #82 12cb1944 | Текущий полный текст пояснения, наличие только с подсказками. |
| 4. clarity.spec.ts / «Жребий» on the preparation screen / without a seed each toss is new: both sides come up in 20 tosses (chromium) | Ожидание устарело, PR #84 acd72dbf / #78 | Новые формы названий сторон и плашка; сохранены 20 бросков и проверка seed. |
| 5. fx-legends.spec.ts / the four Legends play in Safari without errors @iphone (iphone) | Ошибка игры: пул Армады не готов к раннему клипу | Обязательная подготовка перед воспроизведением. |
| 6. fx-motion.spec.ts / sink: the captain rows across in the new clinker longboat (chromium) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления по текущей геометрии до первого эффекта; ожидания не менялись. |
| 7. fx-motion.spec.ts / the scenes of the ships in motion play in Safari without errors @iphone (iphone) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления по текущей геометрии до первого эффекта; ожидания не менялись. |
| 8. fx-motion.spec.ts / the ships in motion through ?fxScene / sink 1366×660: the effect on the table, the frame, the result (chromium) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления по текущей геометрии до первого эффекта; ожидания не менялись. |
| 9. fx-motion.spec.ts / the ships in motion through ?fxScene / heart 1366×660: the effect on the table, the frame, the result (chromium) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления по текущей геометрии до первого эффекта; ожидания не менялись. |
| 10. fx-motion.spec.ts / the ships in motion through ?fxScene / sink 430×932: the effect on the table, the frame, the result (chromium) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления по текущей геометрии до первого эффекта; ожидания не менялись. |
| 11. fx-sea.spec.ts / the badges explain themselves (phone 430×932) / a press on «Пожар» opens its rule during the show and does not end it; a press outside closes the window (chromium) | Ожидание устарело, PR #84 | Полный текущий текст Пожара, проверки зоны касания сохранены. |
| 12. fx-turn.spec.ts / the scenes of A4 play in Safari without errors @iphone (iphone) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления; ожидания не менялись. |
| 13. fx-turn.spec.ts / the turn, the card, repairs and statuses through ?fxScene / sink 1366×660: the effect on the table, the frame, the result (chromium) | Ошибка игры: sink-bed ещё не подготовлен | Подготовка потопления; ожидания не менялись. |
| 14. fx-turn.spec.ts / the log follows the clips (a game against the bots, 1366×660) / the lines of the action playing wait for its clips; a press on the table shows them and every status chip at once; a card in the log opens during the show (chromium) | Ожидание устарело, PR #85 | Новая фраза «бьёт»; ожидания момента результата и ссылок сохранены. |
| 15. fx-volley.spec.ts / hull impact: no debris or damage before arrival; the plate stays above wreckage (chromium) | Ошибка игры: банк частиц/пулы пропущены при занятом начальном море | Обязательная подготовка, проверка попадания и порядка слоёв без изменений. |
| 16. net.spec.ts / two tabs: a room by its code, a Volley and a Reaction, a reload brings the player back (chromium) | Ожидания устарели, PR #78 / #82 / #84 / #85 | Раскрыть Ещё для seed, принять модальное возвращение друга, актуальные строки и кнопка сдачи; видимые заблокированные кнопки больше не скрываются catch. |
| 17. perf-guard.spec.ts / perf guard: Volley, ordinary card, Legend and Armada, sinking, idle (chromium) | Ошибка игры: неподготовленный банк создаёт 101 SVG-анимацию | Обязательная подготовка; все ограничения сторожа сохранены. Ожидание полного быстрого sink 20 с: измерено 8,633 с против старого actionTimeout 8 с. |
| 18. phone.spec.ts / phone 430×932: the log, the rules, a discard, a Legend by the star, the Dutchman buttons (chromium) | Смешанная: скрытый старый cmd-short (PR #79), малая невидимая зона звезды | Проверяется видимая иконка; невидимая зона восстановлена до 28 px без увеличения рисунка. |
| 19. phone.spec.ts / laptop 1366×660: the log, the rules and a discard stay wide (chromium) | Ожидание устарело, PR #78 menus-fix2 | Ширина новых Правил 1120 px; остальные проверки окон сохранены. |
| 20. phone.spec.ts / phone 375×667: the lifted card lies whole over the table, the fan and the deck stay (chromium) | Ожидание устарело, PR #83 72f4109 | Закрытие поднятой карты нажатием по свободной части моря, а не по новой картинке карты. |
| 21. phone.spec.ts / iPhone 15 Pro Max: the log, the rules, a discard, a Legend by the star, the Dutchman buttons @iphone (iphone) | Смешанная: скрытый cmd-short (PR #79), малая зона звезды | Тот же общий helper и исправление зоны касания. |
| 22. ship-window.spec.ts / ship window 1366×660: all four ships, data, prepared motion, pause, discard and close (chromium) | Ожидание устарело, PR #82 36f10c67 | Вместо удалённых двух иконок обмена Душ проверяется полный действующий текст правила. |
| 23. ship-window.spec.ts / ship window 1920×944: all four ships, data, prepared motion, pause, discard and close (chromium) | Ожидание устарело, PR #82 36f10c67 | Вместо удалённых двух иконок обмена Душ проверяется полный действующий текст правила. |
| 24. ship-window.spec.ts / ship window 430×740: all four ships, data, prepared motion, pause, discard and close @iphone (iphone) | Нестабильный бюджет WebKit после послойного появления сцен PR #85 | Все четыре корабля и все проверки сохранены; бюджет WebKit 240 с, готовность каждой сцены 60 с (адресно 117 с). |
| 25. stage7b.spec.ts / laptop 1366×660 / start, preparation, the show of a move, the sea banner, a turn (chromium) | Ожидания устарели, PR #78 / #84 | Одна приоритетная плашка Продолжить; затем проверяется комната; новая монета. На телефонных меню допустим предусмотренный menus-scale вертикальный скролл, горизонтальный запрещён. |
| 26. stage7b.spec.ts / iphone 430×740 / start, preparation, the show of a move, the sea banner, a turn (chromium) | Ожидания устарели, PR #78 / #84 | Одна приоритетная плашка Продолжить; затем проверяется комната; новая монета. На телефонных меню допустим предусмотренный menus-scale вертикальный скролл, горизонтальный запрещён. |
| 27. stage7b.spec.ts / prefers-reduced-motion / the coin shows its side at once; the moves of the bots fly in nothing, the table is at once in the real state (chromium) | Ожидание устарело, PR #84 | Новый текст жребия; reduced-motion и мгновенный показ сохранены. |
| 28. table.spec.ts / iPhone 15 Pro Max: key states fit the window @iphone (iphone) | Ошибка игры: шторка теряет причину передачи Реакции; новый выбор в листе PR #85 | Причина Реакции снова видна; выбор внутри листа; геометрические проверки сохранены. |
| 29. table.spec.ts / laptop 1366×660 / key states fit the window (chromium) | Ошибка игры: шторка теряет причину передачи Реакции; новый выбор в листе PR #85 | Причина Реакции снова видна; выбор внутри листа; геометрические проверки сохранены. |
| 30. table.spec.ts / iphone 430×740 / key states fit the window (chromium) | Ошибка игры: шторка теряет причину передачи Реакции; новый выбор в листе PR #85 | Причина Реакции снова видна; выбор внутри листа; геометрические проверки сохранены. |
| 31. table.spec.ts / phone 390×664 / key states fit the window (chromium) | Ошибка игры: шторка теряет причину Реакции; после победы трюм отбирает высоту руки | Восстановлена причина и убрана лишняя минимальная высота только в завершённой партии; рука целиком над панелью. |
| 32. table.spec.ts / «Подсказки» / laptop: off by default — no damage before the choice, the total before «Огонь», no «Залп не дан» (chromium) | Ошибка игры: дубовая кнопка 258 px вместо минимальных 260 | Минимум контейнера с учётом рамок; проверка 260 не ослаблена. |
| 33. table.spec.ts / «Ход окончен» in 3 s; «4 → 2» with «Подсказки» / «Отменить» keeps the turn; otherwise the device goes to the other team (chromium) | Ожидание устарело, PR #78 | Регистр «Ход Компании», сохранены отмена и передача хода. |
| 34. table.spec.ts / V7: a small phone 390×664 / the list scrolls inside the sheet; the buttons stay at its foot (chromium) | Ошибка игры: после победы лишний min-height полосы Трюма | Убрана лишняя высота; прокрутка листа и закреплённые кнопки проверяются по-прежнему. |
| 35. u3-layout.spec.ts / 1366×660 / a game against the bots: the summary stays in «Последнее», the journal opens, the heads and the columns (chromium) | Ожидание устарело, PR #82 | Строка Последнее намеренно поднята: зазор 26 px на ноутбуке / 24 на телефоне; все проверки головы, колонок и журнала сохранены. |
| 36. u3-layout.spec.ts / 1920×1080 / a game against the bots: the summary stays in «Последнее», the journal opens, the heads and the columns (chromium) | Ожидание устарело, PR #82 | Строка Последнее намеренно поднята: зазор 26 px на ноутбуке / 24 на телефоне; все проверки головы, колонок и журнала сохранены. |
| 37. u3-layout.spec.ts / 430×932 / a game against the bots: the summary stays in «Последнее», the journal opens, the heads and the columns (chromium) | Смешанная: компактные кнопки PR #79, подпись отсчёта PR #82, готовность задевает имя | Актуальная компоновка проверяется строго; уголок готовности сдвинут над рисунком корабля, перекрытие имени запрещено. |
| 38. weather-window.spec.ts / weather window 1366×660: real rows, prepared motion, pause and close (chromium) | Ошибка игры: decode завершает промис уже размонтированной MenuScene | Обрабатывается только отменённый владелец; ошибки активного владельца всё ещё пробрасываются. |
| 39. weather-window.spec.ts / weather window 430×932: real rows, prepared motion, pause and close @iphone (iphone) | Смешанная: закреплённая сцена PR #82; ResizeObserver изменяет свой родитель во время доставки | Проверяется настоящая прокрутка тела и неподвижная видимая сцена; повторный замер листа вне доставки ResizeObserver. Бюджет трёх полных сцен WebKit 180 с. |
| 40. wx-composition.spec.ts / ambient maelstrom: the container pauses every weather loop and resumes its phase (chromium) | Ошибка игры: ui-polish принудительно running!important под wx-paused | Удалено противоречащее правило; оригинальный тест без изменений. |

## Проверки и доказательства

Адресно прошли: исходные sink/heart/шлюпка, строгий hull-impact, perf-guard с прежним общим лимитом 60 с (58,324 с), clarity, network (35,1 с), phone (22,6 с), все key states/V7 (4 passed), оба ноутбучных окна корабля, WebKit все четыре корабля (117,2 с), два ноутбучных summary, телефонный summary (40,7 с), исходная проверка паузы Мальстрёма. JSON адресных проверок в `docs/measurements/e2e-green/`; промежуточные красные результаты явно не являются итогом.

Детали диагностики: `decode-diagnostic.json` (валидные naturalWidth после размонтирования), `maelstrom-css-rules.json` (running!important), `phone-victory-parts.json` (лишние 12,75 px), `weather-scroll-geometry.json` (сцена закреплена, прокручивается тело).

Старое ожидание готовности по центру головы заменено на проверку настоящего углового значка: размер 10–14 px, внутри головы, без перекрытия названия. Вид звезды и планшета не увеличивался ради зоны касания.

Среда: Node 24, Playwright 1.56.1, Chromium 141 и WebKit 26. Недостающие библиотеки WebKit распакованы локально; конфигурация CI не менялась. Запуск: `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright LD_LIBRARY_PATH=/workspace/e2e-browser-deps/unpacked/usr/lib/x86_64-linux-gnu E2E_WEBKIT=1 CI=1 npm run e2e -- --reporter=list,json`.

## Итоговый полный прогон до последней правки

`E2E_WEBKIT=1 CI=1 npm run e2e -- --reporter=list,json`: **208 passed / 1 failed / 0 flaky / 0 skipped**, 44,8 мин. **Chromium 198/198, WebKit 10/11**. Все 40 первоначальных падений main устранены и прошли в этом полном прогоне. Полный JSON: `docs/measurements/e2e-green/final-e2e.json`; код завершения 1 сохранён в `final-e2e-exit.json`.

| Дополнительное падение | Причина | Последняя правка |
|---|---|---|
| fx-reactions: the Reaction scenes play in Safari without errors @iphone | Нестабильный тест: `playing()` запускается после goto/load и проверки корня сцены; короткий fast-клип dbl может уже закончиться. Таймаут 40 с в playing(), состояние уже после показа. На исходном main тест прошёл, поэтому это не одно из первоначальных 40. | Наблюдатель устанавливается через addInitScript до загрузки каждого документа и фиксирует именно прежнее условие: fxStart=1, в слое есть элемент, fxDone ещё нет. Затем по-прежнему обязательны завершение, пустой слой (кроме предусмотренного whirl) и отсутствие ошибок для каждой из 12 сцен. Игровой код, скорость и тайминги не менялись. |

**После последней правки тесты не запускались по прямому указанию пользователя.** Полностью зелёный итоговый e2e не заявляется: последняя правка ожидает проверки владельцем/CI.

## Пять итоговых команд

Все выполнены до последней правки только e2e-теста, код завершения каждой 0. После неё новые проверки не запускались.

| Команда | Результат | Доказательство |
|---|---|---|
| npm run typecheck | прошла | docs/measurements/e2e-green/final-typecheck.txt |
| npm test | 699/699, 64 файла | docs/measurements/e2e-green/final-unit.txt |
| npm run sim:check | прошла | docs/measurements/e2e-green/final-sim-check.txt |
| npm run build | прошла | docs/measurements/e2e-green/final-build.txt |
| npm run build:server | прошла | docs/measurements/e2e-green/final-build-server.txt |

Время и exitCode: `docs/measurements/e2e-green/final-checks.json`.

## Решения и границы

Движок, данные, сервер и ветка fps-pass не менялись. Ветка fps-pass по-прежнему `7b07158d8f351555c7a3e4273149eb51916f2fea`. Ожидания обновлялись только с указанной причиной и PR; исключения perf-guard не расширялись, проверки порядка/результата/доступности нажатий сохранены. Общий бюджет perf-guard остался 60 с.

PR создаёт пользователь: https://github.com/re1ampag0/bortom-k-bortu/pull/new/e2e-green . Сливать после зелёных build и e2e на GitHub. Точка продолжения: проверить последнюю правку Safari-наблюдения; новых локальных прогонов по просьбе пользователя не делать.
