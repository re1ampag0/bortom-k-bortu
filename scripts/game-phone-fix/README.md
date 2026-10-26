# game-phone-fix: кадры и доказательства интерфейса

Это скрипты кадров/геометрии, не новые тесты. Полные e2e, unit, sim и сборка не нужны.
Готовые записи партий находятся в docs/screenshots/game-phone-fix/fixtures.json.
fixtures.ts и captain.ts воспроизводят их законными действиями движка без правки состояния.

- node scripts/game-phone-fix/serve.mjs after . — Vite e2e на127.0.0.1:5363.
- node scripts/game-phone-fix/serve.mjs before <отдельный worktree main0e3adbe> —5364.
- node scripts/game-phone-fix/capture.mjs —76 кадров/геометрия; Chromium из /usr/bin/chromium.
- node scripts/game-phone-fix/extras.mjs —капитан с/без плашки, ширина Душ0/1/5.
- node scripts/game-phone-fix/settings.mjs —сохранение/немедленная смена вида и URL-only perf.
- python3 scripts/game-phone-fix/report.py —сводка/склейки из существующих кадров, Pillow.

capture.mjs принимает SIZES (размеры через запятую) и SCENES
(table,order,repair,legend,finish,plans). Повторный проход заменяет соответствующие записи,
остальные сохраняет. Состояние готовится настоящими обработчиками интерфейса, не
изменением стилей. Проверка центра кнопок идёт отдельно через elementFromPoint.
Для проверки ширины Душ extras.mjs временно меняет только видимый текст числа в DOM;
это явно отдельный аудит в extras.json, не изменение партии или движка.

Для точного сравнения используется исходный scripts/game-scale/capture.mjs с
BEFORE_PORT=5364, AFTER_PORT=5363, OUTPUT=docs/screenshots/game-phone-fix/reference,
SIZES=1366x660,430x932 и PHASE=both. Обе версии одним скриптом/часами/DPR,
со сбросом прокрутки журнала, декодированием картинок, остановкой SMIL/CSS и
подготовленных сцен. Нативным анимациям даётся применить нулевую фазу до commitStyles:
иначе движущийся блик мог попасть в предыдущей фазе только на одном из кадров.
PNG сравниваются без допуска по цвету. Сырые различия не скрываются.
