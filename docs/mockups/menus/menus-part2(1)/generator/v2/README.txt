Вторая редакция досок меню (24.10.2026).
main_board.py, prep_board.py — собирают Main, StartPhone, Prep, PrepPhone (python3 main_board.py, python3 prep_board.py; пишут в ../../artboards).
art.py — небо, звёзды, луна, солнце, облака, берега, пальмы, маяк, море, корабль на воде.
icons2.py — новые иконки (ic_coin, ic_swap, ic_mugs, ic_cannon, ic_chart, ic_bomb, ic_autohelm, ic_lantern, ic_t_*).
fix_boards.py — правки текстов и иконок на остальных досках (берёт исходники досок из PR #77; путь SRC поправить).
ink_check.py — проверка оптической центровки по пикселям (нужен сервер в папке docs/mockups/menus на порту 8766).
В игру эти скрипты не переносить: это справочник, как собраны картинки.

icon_center.py — выравнивает иконки по центру рисунка (сдвигом viewBox). icons2.py после этого не перезапускать: он
вернёт старые viewBox, или запустить icon_center.py --fix ещё раз.
contact_check.py — ищет места, где рамки почти касаются (ближе 6 px).
loopvid.py — превью-видео с бесшовной петлёй (конец плавно переходит в начало).
Шрифты для проверок: Alegreya, Alegreya SC, Alegreya Sans, Old Standard TT должны быть установлены в системе,
иначе центровка меряется по запасному шрифту.
chart.py — фон «штурманская карта» (assets/bg/*.svg).
coin_relief.py — монета «Жребий» (рельеф и свет): после icons2.py запустить python3 coin_relief.py.
engraved.py — корабль-гравюра (карты, кнопка «Поднять паруса»).
