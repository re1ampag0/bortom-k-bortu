# fix-main — проверки красного main после fx-smooth-c

База: db87ca5ea1fcc19b9a8149ea1e254590f5cbec5c (слияние PR #62), ветка fix-main.
CI: https://github.com/re1ampag0/bortom-k-bortu/actions/runs/39857239266
build и deploy прошли, e2e: 191 passed / 5 failed. Названия и ошибки получены
из лога пользователя; GitHub API возвращает Forbidden, страница скрывает подробный лог.

| Тест | Причина в текущем коде | Что исправлено |
|---|---|---|
| fx-motion: sink 1366×660: the effect on the table, the frame, the result | Фоновый medal-glint после fx-smooth-c — конечная WAAPI-анимация; тест исключал только CSS и считал её остатком потопления | Разрешён только именованный medal-glint на .medal-glint-clip > .gl.medal-scheduled: один на элемент, конечный, только transform. Любая другая оставшаяся native-анимация по-прежнему проваливает проверку |
| fx-motion: sink 430×932: the effect on the table, the frame, the result | Та же проверка фонового блика | Та же общая правка expectLook |
| table: iphone 430×740 / key states fit the window | Телефонный лист после ui-4 показывает эффект лентой внутри HandCard; старого .as-card .ro-effect больше нет | Проверяются видимость hcard-strip и текст «Залп» именно внутри доступной карты, которую выбирает тест |
| table: phone 390×664 / key states fit the window | Тот же устаревший селектор | Та же общая правка keyStates |
| table: iPhone 15 Pro Max: key states fit the window @iphone | Тот же keyStates и отсутствующий .ro-effect в WebKit | Та же правка; настоящий WebKit-прогон остаётся CI, браузер в среде не установлен |

Причины подтверждены исходниками: watchMedalGlints / medalIdle.ts создаёт native-анимацию
с id=medal-glint; Alarm.tsx передаёт cardAlarm.strip в HandCard, который рисует
[data-testid=hcard-strip]. Отдельный ro-effect остался только в ноутбучной панели.
Игровой код, вид, длительности, движок и данные не менялись. Остальные проверки
сцен (числа и их минимумы, классы, места, DOM-узлы, ошибки, попадание нажатий,
вписывание в окно, выбор Реакции и название кнопки) сохранены.

## Проверка

`npm run typecheck` прошёл (tsc обоих проектов, ошибок нет).
Один адресный прогон: **4 passed (1.0m)**, retries=0:
- sink 1366×660 — passed (19.8s);
- sink 430×932 — passed (22.4s);
- iphone 430×740 / key states fit the window — passed (6.0s);
- phone 390×664 / key states fit the window — passed (5.6s).

Команда (использован существующий изолированный конфиг с системным Chromium):
```sh
npx playwright test e2e/fx-motion.spec.ts e2e/table.spec.ts -g 'sink (1366×660|430×932): the effect on the table, the frame, the result$|(iphone 430×740|phone 390×664) key states fit the window$' --project=chromium --config scripts/fx-smooth-c/playwright.config.ts --retries=0
```
Перезаписанные тестами старые кадры/тайминги восстановлены, в PR они не входят.
WebKit отсутствует: проверен путь playwright.webkit.executablePath(), файла нет;
установка не предпринималась. Общая функция телефонного теста проверяется в двух
провалившихся размерах Chromium, @iphone не выдаётся за локально пройденный.
Полный e2e, unit и sim не запускались.

После push — пользователь создаёт PR, дожидается CI 2/2 и сливает. До зелёного main
fx-finish не начинать; текст следующей задачи сохранён в отдельном worktree fx-finish.
