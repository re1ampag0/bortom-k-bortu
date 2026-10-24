# ship-window — кадры и проверки

В сравнениях слева макет, справа настоящая игра. Числа/тексты в макете демонстрационные;
в игре они из game-data.json и текущего показанного состояния. Phone дана в390px,
игра на телефоне —430px. Длинный лист снят целиком, отдельный game.png — реальный
верх экрана740px, bottom.png — низ при прокрутке.

| Корабль | Ноутбук1366×660 | Ноутбук1920×944 | Телефон430×740 |
|---|---|---|---|
| Жемчужина | [сравнение](final/Main-1366x660-comparison.png) | [сравнение](final/Main-1920x944-comparison.png) | [лист](final/Main-430x740-comparison.png), [верх](final/Main-430x740-game.png), [низ](final/Main-430x740-bottom.png) |
| Месть | [сравнение](final/Revenge-1366x660-comparison.png) | [сравнение](final/Revenge-1920x944-comparison.png) | [лист](final/Revenge-430x740-comparison.png), [верх](final/Revenge-430x740-game.png), [низ](final/Revenge-430x740-bottom.png) |
| Индевор | [сравнение](final/Endeavour-1366x660-comparison.png) | [сравнение](final/Endeavour-1920x944-comparison.png) | [лист](final/Endeavour-430x740-comparison.png), [верх](final/Endeavour-430x740-game.png), [низ](final/Endeavour-430x740-bottom.png) |
| Голландец | [сравнение](final/Dutchman-1366x660-comparison.png) | [сравнение](final/Dutchman-1920x944-comparison.png) | [лист](final/Dutchman-430x740-comparison.png), [верх](final/Dutchman-430x740-game.png), [низ](final/Dutchman-430x740-bottom.png) |

Движение: [Жемчужина3000ms](final-motion/Main-1366x660-comparison.png),
[Месть3000ms](final-motion/Revenge-1366x660-comparison.png).
Щупальца: [Кракен на телефоне](stage4/kraken-430x740-11000-comparison.png),
[на ноутбуке](stage4/kraken-1366x660-11000-comparison.png),
[арт карты](stage4/kraken-430x740-2000-comparison.png).

[Команды/выводы](checks/commands.txt), [геометрия/ошибки страницы](final/proof.json),
[замер main](checks/before-measure.json), [замер ветки](checks/after-measure.json),
[слои](checks/after-layers.json), [нажатие](checks/press.json).
Полный отчёт: [progress](../../progress/ship-window.md).

В10с открытого окна всех4 кораблей: Layout0,Paint0,Game0,больших анимированныхSVG0;
крупных слоёв3; после закрытия Paint0. Холодное открытие остаётся дорогим:
в парном замере CPU×4 худший кадр≈500ms. Проверка настоящего iPhone ещё нужна.
