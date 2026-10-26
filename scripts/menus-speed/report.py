from pathlib import Path
import json,re,hashlib
out=Path('docs/measurements/menus-speed');shots=Path('docs/screenshots/menus-speed')
net=json.loads((out/'network.json').read_text());lat=json.loads((out/'latency.json').read_text());budgets=json.loads((out/'asset-budgets.json').read_text())
def entry(root):
 html=(root/'index.html').read_text();name=re.search(r'src="[^\"]*/assets/([^\"]+\.js)"',html)[1];p=root/'assets'/name
 return {'name':name,'bytes':p.stat().st_size,'br':(Path(str(p)+'.br').stat().st_size if Path(str(p)+'.br').exists()else None),'gzip':(Path(str(p)+'.gz').stat().st_size if Path(str(p)+'.gz').exists()else None),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
build={'before':entry(Path('/tmp/menus-speed-before-dist')),'after':entry(Path('dist'))};(out/'build.json').write_text(json.dumps(build,indent=2))
for name,file in [('typecheck','/tmp/menus-speed-typecheck.log'),('view','/tmp/menus-speed-view.log')]:
 text=Path(file).read_text();(out/(name+'.txt')).write_text(text if name=='typecheck'else '\n'.join(x for x in text.splitlines()if any(s in x for s in ['tests/view.test.ts','Test Files','Tests ','Duration'])))
raw=json.loads((out/'loops.json').read_text());source={(r['family'],r['name'],r['id'],r['animation']):r for r in json.loads((out/'source-seams.json').read_text())};nodes={}
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
for family in ['menus','ship','weather']:
 folder=Path('src/ui/menus'if family=='menus'else f'src/ui/game/{family}-window')
 for name,s in json.loads((folder/'scenes.json').read_text()).items():
  for n in walk(s['tree']):nodes[(family,name,n['id'])]=n
for r in raw:
 key=(r['family'],r['name'],r['id'],r['animation']);n=nodes.get(key[:3]);r['removed']=n is None
 if key in source:r['beforeSeam']=source[key]['seam']
 if n and n.get('periodicSubtree')or n and n.get('art',{}).get('tile'):r['action']='периодичная картинка; сдвиг на её период'
 elif n and any(a.get('twoKeyClosed')for a in n['anim']):r['action']='исходная траектория; прозрачный стык'
 elif r['removed']:r['action']='L: убран повторный клуб, осталось 6'
 elif r.get('alternate'):r['action']='alternate, без изменений'
 elif r.get('beforeSeam'):r['action']='плавно замкнуты границы кривой'
 else:r['action']='границы совпадают, без изменения цикла'
(out/'loops.json').write_text(json.dumps(raw,ensure_ascii=False,separators=(',',':')))
with(out/'loops.md').open('w')as f:
 f.write('| Сцена | Слой | Анимация | Шов до | После | Что сделано |\n|---|---:|---|---|---|---|\n')
 for r in raw:f.write(f'| {r["family"]}/{r["name"]} | {r["id"]} | {r["animation"]} | {"alternate"if r.get("alternate")else "да"if r.get("beforeSeam")else "нет"} | {"удалён дубль"if r["removed"]else "нет"if not r["seam"]else "да"} | {r["action"]} |\n')
posters=[(p.name,p.stat().st_size)for p in Path('src/ui/menus/posters').glob('*.webp')]
assetbytes=sum(p.stat().st_size for p in Path('src/ui/game/scene-window/art').iterdir());metadata=[]
for folder in ['src/ui/menus','src/ui/game/ship-window','src/ui/game/weather-window']:
 before=Path('/workspace/menus-speed-before')/folder/'scenes.json';after=Path(folder)/'scenes.json';metadata.append((folder,before.stat().st_size,after.stat().st_size,len(list((Path(folder)/'scenes').glob('*.json')))))
lines=['# menus-speed','', 'Ветка `menus-speed` от зелёного main `4f14c88` (#80). Реализация и проверки завершены; PR создаёт пользователь. Ни движок, ни игровые данные, ни сетевой протокол не менялись. Цели веса выполнены не полностью, см. ограничения ниже.','', '## Требования','', '| Пункт | Результат | Доказательство |','|---|---|---|']
req=[
('Н1','Сохранены сцены, данные и движения; G, H–M являются явными исключениями задания. Ошибка сжатия статических растров в среднем 0,08–0,25 уровня RGB из 255.','`../measurements/menus-speed/visual.json`, склейки `*-comparison.jpg`'),
('Н2','Существующие testid/классы/тексты сохранены, кроме разрешённого штампа M. E2E не переписывались и не запускались, их проверит CI.','`capture.json`; `tests/view.test.ts`: 26/26'),
('Н3','Общий PreparedScene и существующий холст частиц; новые rAF/проигрыватели в приложении не добавлены. SVG используется как неподвижная картинка. menuscale/gamescale не изменялись.','`PreparedScene.tsx`, `prepare.mjs`; кадры'),
('1','PNG3× заменены WebP2×, атласами и общей библиотекой по содержимому. Main: 35 файлов вместо сотен.','`asset-budgets.json`'),
('2','Одна декодированная картинка до готовности живой сцены, затем fade300.','`motion.json`, `network.json`'),
('3','Отдельный import нужной сцены у всех трёх семейств. Общие JSON остаются только входом офлайн-экспорта.','`sceneManifest.ts`, `scenes/`'),
('4','Статика потоком, предварительные br/gzip, ETag/304/HEAD, Vary и immutable.','`http.json`'),
('A','Механизм выполнен. Цель ≤150КБ не достигнута у 7 из 25 постеров.','`src/ui/menus/posters/`; таблица ограничений'),
('B','WebP88–92, 2×, отдельные телефонные сцены, атласы, дедупликация. Часть целевых бюджетов превышена.','`asset-budgets.json`; таблица ниже'),
('C','Ленивая загрузка по сценам, minified JSON; пиксельные размеры округлены до0,1, коэффициенты матриц не огрублялись.','Таблица манифестов'),
('D','Main/Phone сначала, Prep в последовательном простое после готовности; остальные по переходу. Окна греются по одному; saveData/2g/3g отключают прогрев.','`idle.ts`, `MenuScene.tsx`, `loadWindows.ts`'),
('E','br/gzip при build на node:zlib, без новых Docker-зависимостей; Caddy zstd gzip.','`http.json`, `scripts/compressed-assets.ts`'),
('F','Preload Alegreya SC700 и Sans400, font-display:swap.','`index.html`, `src/ui/fonts.ts`'),
('G','Инвентаризация1943 анимаций, после L остаётся1937. Проверены0/end−16,67ms/end; заметных стыков после исправлений нет. Часы при готовности/шторке не обнуляются.','`loops.md`, `motion.json`, `seams/`'),
('H','Центральный медальон использует тот же onSwap, disabled, focus-visible, hover180°/300ms; область≥48. Реальное нажатие меняет порядок.','`placement-1366.png`, `placement-390.png`, `capture.json`'),
('I','Линии заканчиваются до слотов; непрозрачный слот закрывает остаток линии. Прозрачный промежуток не перехватывает нажатие.','Склейки placement'),
('J','Неподвижные иконки; отдельный мягкий блик≤30%, раз в7,4–7,8s, с разными фазами. Simple/reduced/perf выключают его.','Кадры `ship-window-*.png`, `Decorations.tsx`'),
('K','Арты Легенд и кораблей готовятся вне документа в последовательной очереди простоя. После прогрева наблюдаемый первый кадр укладывается≤150ms. T.* не менялись.','`latency.json`; фазы ниже'),
('L','Огонь2,7–3,1s, кадры2,8s; маяк вращается от лампы; по6 клубов у горящих кораблей6,8–9,3s; реальные порты, вспышка100ms, искры10/порт и плавный дым.','`Revenge-ports-marked.png`, `Revenge-volley-after.png`, `Pearl-beam-0..3.png`'),
('M','Диагональный двойной красный штамп внутри карты. СЫГРАНА только по публичной записи розыгрыша, иначе НЕ В ИГРЕ; полный aria-label.','`ship-played-*`, `ship-unplayed-*`, `capture.json`')]
for a,b,c in req:lines.append(f'| {a} | {b} | {c} |')
lines+=['','## Вес и ограничения','', '| Сцена | Живые файлы | КБ | Цель, КБ |','|---|---:|---:|---:|']
for name,goal in [('Main',1200),('Phone',500),('Pirates',350),('Company',350),('Panel',600),('Blood',600),('Deep',600)]:
 r=next(r for r in budgets if r['family']=='src/ui/menus'and r['name']==name);lines.append(f'| {name} | {r["requests"]} | {r["bytes"]/1000:.1f} | {goal} |')
lines+=['',f'Общий банк всех семейств: {assetbytes/1e6:.2f}МБ. Постеры, превышающие150КБ: '+', '.join(f'{n}: {s/1000:.1f}КБ'for n,s in sorted(posters)if s>150000)+'.','', 'Main и шторки выше желаемого бюджета; некоторые фоновые карты превышают цель постера. Детали не удалялись, плотность не понижалась и качество живых WebP не опускалось ниже88. Эти цели **не объявлены выполненными**.','', '| Манифест | До, байт | После, байт | Отдельных сцен |','|---|---:|---:|---:|']
for folder,a,b,count in metadata:lines.append(f'| {folder} | {a} | {b} | {count} |')
lines+=['','| Главный JS | Исходный размер | br | gzip |','|---|---:|---:|---:|']
for version,v in build.items():lines.append(f'| {version} | {v["bytes"]} | {v["br"] or "нет"} | {v["gzip"] or "нет"} |')
lines+=['','## Сеть: один итоговый production-срез','', 'Chromium,1366×660 и390×844, Fast4G9Мбит/с и Slow4G1,6Мбит/с, latency150мс в обоих профилях. До: отдельный worktree4f14c88 и HTTP-сервер, после: неизменяемая копия production-сборки и отдельный сервер. Свежий browser context на сочетание версии/сети/размера; дальнейшие переходы используют его кеш. Прогрев указан отдельными строками. Время переходов отсчитывается от настоящего click-event, старта — от навигации. Байты CDP encodedDataLength включают заголовки; число загрузок включает обращения к кешу. Одиночный замер, без утверждения о скорости реального iPhone.','', 'В ячейке: **мс / КБ / загрузки**. Точные записи: `../measurements/menus-speed/network.json`.','', '| Экран | Размер | Сеть | До | После |','|---|---|---|---|---|']
labels={'start-still':'Старт: картинка','start-motion':'Старт: движение','idle-prep':'Простой: Prep','prep':'Подготовка','curtain':'Шторка','idle-game':'Простой: окна','weather-cold':'Море: первое открытие','weather-warm':'Море: повторное','ship-cold':'Корабль: первое открытие','ship-warm':'Корабль: повторное','idle-legend':'Простой: Легенды','legend-window':'Карточка Легенды','legend-first-frame':'Легенда: первые частицы','legend-card-frame':'Легенда: влёт карты'}
for width in [1366,390]:
 for network in ['Fast4G','Slow4G']:
  for screen,label in labels.items():
   cells=[]
   for version in ['before','after']:
    r=next((r for r in reversed(net)if r['version']==version and r['network']==network and r['width']==width and r.get('screen')==screen),None)
    cells.append(f'{r.get("fromClickMs")or r["ms"]} / {r["bytes"]/1000:.1f} / {r["requests"]}'if r else 'нет записи')
   lines.append(f'| {label} | {width} | {network} | {cells[0]} | {cells[1]} |')
lines+=['','## K: от события нажатия до первого кадра после прогрева','', 'Отдельно от ожиданий Playwright actionability: capture-phase click-event → DOM готов → два rAF. Для клипа это первый кадр позыва медальона с уже вставленными заготовками; видимость летящей карты начинается позже по неизменному `T.legend.cardAt`. Сетевой счётчик первых частиц в предыдущей таблице — более поздний рубеж и не подменяет начало клипа.','', '| Сеть / размер | Окно корабля, до→после | Окно Легенды, до→после | Клип, до→после |','|---|---|---|---|']
for network in ['Fast4G','Slow4G']:
 for width in [1366,390]:
  cells=[]
  for name in ['ship','legend window','legend clip DOM']:
   vals=[next(x['ms']for x in reversed(lat)if x['name']==f'{name} {v} {network} {width}')for v in ['before','after']];cells.append(' → '.join(f'{x:.1f}мс'for x in vals))
  lines.append(f'| {network} / {width} | '+' | '.join(cells)+' |')
lines+=['', 'Неизменённые фазы обычной Легенды: медальон900ms; затемнение с200ms/500ms; полосы с250ms/450ms; лучи с500ms/900ms; карта с350ms, полёт760ms и переворот1150ms; приземление с1130ms; печать с1550ms,360ms; удержание с1850ms,1700ms; сворачивание с3550ms,520ms; шар с4020ms,560ms. Это сюжет показа, не ожидание загрузки. Вариант для будущего решения пользователя: сократить удержание1700→900ms и полёт шара560→400ms; **не применён**.','', '## Швы и кадры','', '`../measurements/menus-speed/loops.md` содержит строку для каждой из1943 исходных анимаций: сцена, слой, наличие шва и решение. До общего обхода вода уже была исправлена при переносе формата; для неё дополнительно снят именно исходный main: `source-seams.json` и `seams/source-Pirates-comparison.jpg`. Для остальных сохранены первичный/повторные пиксельные протоколы. Порог заметного различия: >12 уровней канала на >100 пикселях (на крупных сценах >0,01%). Сырые остатки25 и95 пикселей на краях сохранены, пиксельная идентичность этих двух слоёв не заявляется. Дождь: конец/начало0 разных пикселей.','', 'Склейки сцены: `menus-Main-comparison.jpg`, `menus-Phone-comparison.jpg`, `menus-Pirates-comparison.jpg`, `menus-Company-comparison.jpg`, `menus-Blood-comparison.jpg`, `ship-Ж-comparison.jpg`, `ship-М-comparison.jpg`, `ship-И-comparison.jpg`, `ship-Г-comparison.jpg`, `weather-storm-comparison.jpg`, `weather-tortuga-comparison.jpg`. До использует исходный PreparedScene и ресурсы отдельного worktree main, после — текущий код, одинаковый момент1000ms.','', 'Полные окна и расстановка: `start-1366.png`, `start-390.png`, `placement-1366.png`, `placement-390.png`, `ship-window-*.png`, `ship-played-*.png`, `ship-unplayed-*.png`; метки портов и четыре положения маяка лежат рядом. Все пути от `docs/screenshots/menus-speed/`.','', '## Проверки','', '- `npm run typecheck` — успешно: `../measurements/menus-speed/typecheck.txt`.', '- `npx vitest run tests/view.test.ts` — один прогон,26/26: `../measurements/menus-speed/view.txt`.', '- `npm run build` до/после — успешно, явно разрешён пользователем; размеры и хеши: `build.json`.', '- HTTP: br200, gzip200, identity200, HEAD200 без тела, ETag304, immutable/no-cache: `http.json`.', '- Кадры: ошибок страницы нет; настоящий hit-test медальона и оба варианта штампа: `capture.json`.', '- Simple/reduced/perf-css: только постер, без живой сцены; при накрытии настроек часы стоят и продолжаются с того же места: `motion.json`.', '- Полный unit, e2e, sim, build:server не запускались; новые тесты не добавлялись.','', '## Решения','', '1. H–M и исправление стыков G — разрешённые изменения вида/движения. Остальные тексты, масштабирование и игровая логика сохранены.', '2. Пиксели округляются до0,1, но матрицы/opacity/offset остаются точными: округление их как размеров ломает вращения и прозрачность.', '3. У статичных облаков и ряби — повторяющаяся картинка с целым периодом; у одиночных корабликов/птиц — исходная траектория с коротким прозрачным стыком, без телепорта и без остановки движения. Двухключевые кривые имеют явные промежуточные ключи.', '4. Вода повторяется на своей фактической дистанции (телефон390, плитки360, большие сцены480). Дробные периоды ряби выровнены по пикселям, чтобы не менять фазу растеризации на границе.', '5. В дыме «Мести» отдельно найдены два горящих корабля: у маленького — r-farsm, у большого — r-smoke/r-rise. У каждого6 медленно растущих клубов; цвет и подготовленная текстура сохранены.', '6. Невидимые заготовки не добавляются в отрисованный документ; декодирование и кэш — detached Images. Прогрев не идёт на saveData/2g/3g.', '7. Цели веса, не достигнутые в допустимом качестве, оставлены открытыми; ради числа не удалялись детали.', '8. Начальный сетевой срез, во время которого менялась рабочая dist, отброшен; итог снимается только с отдельной неизменяемой копии. Это исправление методики, а не выбор лучшего результата.', '', '## Завершение','', 'Продолжения реализации не требуется. Открытые ограничения: цели веса A/B выше; реальная проверка Safari/iPhone и существующие e2e — в CI/у пользователя. PR: https://github.com/re1ampag0/bortom-k-bortu/compare/main...menus-speed?expand=1.']
Path('docs/progress/menus-speed.md').write_text('\n'.join(lines)+'\n')
print('report',len(lines),'lines; matrix',len(net),'rows; latencies',len(lat))
