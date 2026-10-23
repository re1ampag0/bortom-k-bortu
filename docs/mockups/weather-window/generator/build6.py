import json, re, sys
sys.path.insert(0, '/home/claude/gen')
import common as C
from scenes6 import SCENES, CSS, RAIN, rain, strip_old_rain

ROOT = C.ROOT
U, D, I, N = 'up', 'down', 'info', 'none'

SPEC = {
    'calm': [('Перестроение и «смена мест» — нельзя', D), ('Перестроение и «смена мест» — нельзя', D)],
    'wind': [('Перестроение и так 0 («Быстрее ветра»)', N), ('Перестроение 1 → 0', U)],
    'fog': [('бьёт только «Индевор»', I), ('бьёт только «Голландец»', I), ('бьёт только «Жемчужину»', I), ('бьёт только «Месть»', I)],
    'storm': [('Залп 2 → 1', D), ('Залп 3 → 2', D), ('Залп 3 → 2', D), ('Залп 2 → 1', D)],
    'wave': [('Паруса 3 → 2 · этот ход', D), ('Паруса 2 → 1 · этот ход', D), ('Паруса 1 → 0 · в свой ход', D), ('Паруса 3 → 2 · в свой ход', D)],
    'maelstrom': [('по диагонали 1 → 2', U), ('по диагонали 2 → 3', U), ('по диагонали 2 → 3', U), ('по диагонали 1 → 2', U)],
    'clear': [('по «Индевору» 2 → 3', U), ('по «Голландцу» 3 → 4', U), ('по «Жемчужине» 3 → 4', U), ('по «Мести» 2 → 3', U)],
    'mermaids': [('Команда 2 — не задело', N), ('Команда 2 — не задело', N), ('Команда 2 — не задело', N), ('Команда 3 → 2', D)],
    'tortuga': [('Трюм 4: до 2 Пороха — до 2 карт', I), ('Трюм 3: до 2 Пороха — до 2 карт', I)],
    'rum': [('Команда 2 → 3', U), ('Команда 2 → 3', U), ('Команда 2 — уже полная', N), ('Команда 3 — уже полная', N)],
    'caravan': [('Трюм 4 → 6', U), ('Трюм 3 → 5', U)],
    'wet': [('Трюм 4 → 2', D), ('Трюм 3 → 2', D)],
    'reefs': [('при сдвиге Корпус 7 → 6', D), ('при сдвиге Корпус 9 → 8', D), ('при сдвиге Корпус 10 → 9', D), ('при сдвиге Корпус 11 → 10', D)],
    'thunder': [('Паруса 3 → 1', D), ('Паруса 2 — мимо', N), ('Паруса 1 — мимо', N), ('Паруса 3 → 1', D)],
    'fleet': [('карт за ход 2 → 3', U), ('карт за ход 2 → 3', U), ('карт за ход 2 → 3', U), ('карт за ход 3 → 4', U)],
    'moon': [('урон по Команде −1', U), ('урон по Команде −1', U), ('урон по Команде −1', U), ('урон по Команде −1', U)],
    'current': [('«Жемчужина» ⇄ «Месть»', I), ('«Индевор» ⇄ «Голландец»', I)],
}
EXTRA = {'wave': ['ход Пиратов'], 'maelstrom': ['ход Пиратов'], 'tortuga': ['ждёт решения команд']}
NOTE = {
    'calm': 'Пары напротив не сменятся до конца раунда. Тритон, правда, плевал на штиль.',
    'wind': 'Компании перестраиваться даром. Пиратам и так даром — им просто веселее.',
    'fog': 'Бей того, кто перед носом. По диагонали в тумане попадёшь разве что в чайку.',
    'storm': 'Залп за тот же Порох бьёт слабее. Может, лучше потратить Порох на карты?',
    'wave': 'В начале своего хода Компания тоже лишится Паруса — а с ним и Реакции.',
    'maelstrom': 'Пираты уже поменялись местами. Диагональ без штрафа — бей кого удобнее.',
    'clear': 'Кто стоит напротив, получает на 1 больше. Улыбайтесь — солнце же!',
    'mermaids': 'Песню слышат команды от трёх матросов. У кого двое — те заняты делом.',
    'tortuga': 'Порох за карты — честная сделка. Главное, не пропить его до боя.',
    'rum': '«Индевору» и «Голландцу» добирать некого — им достался только запах рома.',
    'caravan': 'В Трюме максимум 8 Пороха, лишнее сгорит. Тратьте, пока купцы не уплыли.',
    'wet': 'Округление вниз: Компания из трёх бочонков спасла два, Пираты из четырёх — два.',
    'reefs': 'Любой сдвиг — минус Корпус, даже от чужих карт. Стойте, где стоите.',
    'thunder': 'Паруса по 3 у «Жемчужины» и «Голландца» — молния не выбирает, бьёт обоих.',
    'fleet': 'Каждому кораблю — лишняя карта за ход. Самое время для длинных комбинаций.',
    'moon': 'Урон по Команде на 1 меньше — абордаж сегодня бьёт вполсилы.',
    'current': 'Пары напротив те же — поменялись только стороны стола.',
}
HIST = {
    'calm': ['moon'], 'wind': ['calm', 'caravan'], 'wave': ['wind', 'storm'], 'maelstrom': ['fog', 'rum', 'current'],
    'clear': ['tortuga'], 'mermaids': ['moon', 'clear'], 'rum': ['storm', 'mermaids'], 'caravan': ['fleet'],
    'wet': ['calm', 'storm', 'wave'], 'reefs': ['current', 'wind'], 'thunder': ['clear', 'storm'], 'fleet': ['caravan'],
    'moon': ['fog', 'thunder'], 'current': ['maelstrom', 'reefs'],
    'storm': ['calm'], 'fog': ['calm', 'storm'], 'tortuga': ['calm', 'storm'],
}
FILES = {
    'calm': 'Calm', 'wind': 'Wind', 'wave': 'NinthWave', 'maelstrom': 'Maelstrom', 'clear': 'ClearSky', 'mermaids': 'Mermaids',
    'rum': 'Rum', 'caravan': 'Caravan', 'wet': 'WetPowder', 'reefs': 'Reefs', 'thunder': 'Thunder', 'fleet': 'Fleet',
    'moon': 'Moonlight', 'current': 'Current', 'tortuga': 'Tortuga',
}
TAIL = ('</x-dc>\n<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":920,"height":600}}\'>\n'
        'class Component extends DCLogic {\n  renderVals() {\n    return {};\n  }\n}\n</script>\n</body>\n</html>\n')


def selfclose(s):
    return re.sub(r'<([a-zA-Z]+)([^<>]*?)\s*/>', lambda m: f'<{m.group(1)}{m.group(2)}></{m.group(1)}>', s)


def bodyfor(key):
    return C.body2(key, SPEC[key], HIST[key], len(HIST[key]) + 1, EXTRA.get(key), NOTE.get(key))


for key, scene in SCENES.items():
    sky, inner, alt, extra_cls = scene()
    rcss = ''
    if key in RAIN:
        sl, de, col, spl, cur = RAIN[key]
        rcss, rhtml = rain(key, 920, 210, 150, 206, sl, de, col, spl, cur)
        inner = strip_old_rain(inner) + rhtml
    c = C.DATA[key]
    head = C.HEAD.replace('<title>Окно погоды — Буря</title>', f'<title>Окно погоды — {c["name"]}</title>')
    cls = ('w-scene ' + extra_cls).strip()
    doc = (head + '\n' + CSS + '\n' + rcss + '\n</style>\n</helmet>\n' + C.ROOT_OPEN + '\n'
           f'  <div class="{cls}" role="img" aria-label="{alt}" style="position: relative; height: 210px; flex: none; overflow: hidden; background: {sky}">\n'
           + inner + '\n' + C.plaque(key) + '\n' + C.CLOSE_BTN + '\n  </div>\n'
           + '  ' + C.chart_bg(920, 390, 210) + '\n' + bodyfor(key) + '\n</div>\n' + TAIL)
    open(ROOT + FILES[key] + '.dc.html', 'w', encoding='utf-8').write(selfclose(doc))
    print(FILES[key], len(doc))

# the three older laptop boards: same logic in the body, scenes untouched
for fn, key in [('Main.dc.html', 'storm'), ('Fog.dc.html', 'fog')]:
    s = open(ROOT + fn, encoding='utf-8').read()
    a = s.index('  <div style="position: relative; z-index: 1; display: flex; gap: 24px; padding: 14px 24px 16px;')
    b = s.index('\n</div>\n</x-dc>')
    s = s[:a] + bodyfor(key) + s[b:]
    if key == 'fog':
        # the ships in the fog are the game's: the «Жемчужина» and, faint across the water, the «Индевор» opposite
        n0 = s.count('/_blob/158c3bcb1a99eebbde66c1dc54ebe467')
        s = s.replace('<img class="w-ghost" src="/_blob/158c3bcb1a99eebbde66c1dc54ebe467" alt="" aria-hidden="true" style="',
                      '<img class="w-ghost" src="/_blob/57141ce866f43ae8f95e1d9685efe44a" alt="" aria-hidden="true" style="transform: scaleX(-1); ')
        s = s.replace('<img src="/_blob/158c3bcb1a99eebbde66c1dc54ebe467" alt="Корабль в туман', '<img src="/_blob/da92de2ad61e32aa7ae69311983778f1" alt="«Чёрная жемчужина» в туман')
        assert '158c3bcb' not in s, n0
    open(ROOT + fn, 'w', encoding='utf-8').write(selfclose(s))
    print('body', fn)

# new rain on the Буря boards
for fn, w, hh, st, sb in [('Main.dc.html', 920, 210, 150, 206), ('Phone.dc.html', 390, 196, 136, 192)]:
    s = open(ROOT + fn, encoding='utf-8').read()
    sl, de, col, spl, cur = RAIN['storm']
    rcss, rhtml = rain('storm', w, hh, st, sb, sl, de * (1 if w > 500 else .55), col, spl if w > 500 else 9, cur)
    s, n = re.subn(r'<div class="w-rain"[^>]*></div>', lambda m: rhtml, s, count=1)
    assert n == 1, fn
    i = s.index('</style>')
    s = s[:i] + rcss + '\n' + s[i:]
    open(ROOT + fn, 'w', encoding='utf-8').write(s)
    print('rain', fn)

# phone (Буря): status chip and the same rows, one column
fn = 'Phone.dc.html'
s = open(ROOT + fn, encoding='utf-8').read()
a = s.index('<h2 style="margin: 4px 0 0; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 16px; color: #f0d27a">Что делает</h2>')
b = s.index('<p style="margin: 2px 0 0; font-family: Alegreya')
seg = (C.head_row('Что делает', C.status('storm', 2), 4) + '\n'
       f'    <p style="margin: 0; font-size: 16px; line-height: 1.4">{C.nb(C.DATA["storm"]["text"])}</p>\n'
       f'    {C.head_row("Сейчас на столе", [], 4)}\n'
       f'    {C.rows2(SPEC["storm"], single=True)}\n'
       f'    {C.tip_html(NOTE["storm"])}\n    ')
s = s[:a] + seg + s[b:]
s = s.replace('В колоде моря 15<br>в сбросе 2', C.deck_line('storm', 2))
open(ROOT + fn, 'w', encoding='utf-8').write(s)
print('phone ok')
