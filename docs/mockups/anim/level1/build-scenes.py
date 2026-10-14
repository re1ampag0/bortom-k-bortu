# scenes.js: сцены эталона — НАСТОЯЩИЕ ходы из партий ботов (games.json от tools/dump-events.ts).
# Для каждой сцены ищется первый подходящий фрагмент партии; состояние «до» — состояние после
# предыдущего действия; события — глазами выбранной стороны (после eventsFor).
import json, sys
games = json.load(open(sys.argv[1], encoding='utf-8'))
G = json.loads(open(sys.argv[2], encoding='utf-8').read().split('window.GAME = ', 1)[1].rstrip().rstrip(';'))
CARDS, SEA = G['cards'], G['sea']
name = lambda c: CARDS[c]['name'] if c in CARDS else c
SIDE = {'Ж': 'ПИРАТЫ', 'М': 'ПИРАТЫ', 'И': 'КОМПАНИЯ', 'Г': 'КОМПАНИЯ'}
VIEW = {'ПИРАТЫ': 'P', 'КОМПАНИЯ': 'C'}
OTHER = {'ПИРАТЫ': 'КОМПАНИЯ', 'КОМПАНИЯ': 'ПИРАТЫ'}

def ev(step, side): return step[VIEW[side]]
def types(evs): return [e['type'] for e in evs]
def first(evs, t): return next((e for e in evs if e['type'] == t), None)
def all_(evs, t): return [e for e in evs if e['type'] == t]
def terms(h): return [t['what'] for t in h['terms']]

def find(pred, span=lambda g, i: (i, i), lim=1, skip=0):
    """pred(g, i) → сторона-зритель или None. span → (первый, последний) шаг сцены."""
    found = []
    for g in games:
        st = g['steps']
        for i in range(1, len(st)):
            side = pred(g, i)
            if side:
                a, b = span(g, i)
                if a < 1: continue
                found.append((g, a, b, side))
                if len(found) > skip + lim - 1: return found[skip:]
    return found[skip:]

def until_hit(g, i, side, maxn=5):
    st = g['steps']
    for j in range(i, min(len(st), i + maxn)):
        if any(e['type'] in ('hit', 'volleyCancelled') for e in st[j][VIEW[side]]): return j
    return i

def volley_scene(cond, viewer='target', need_window=None):
    def pred(g, i):
        s = g['steps'][i]
        for side in ('ПИРАТЫ', 'КОМПАНИЯ'):
            evs = ev(s, side)
            v = first(evs, 'volley')
            if not v: continue
            if s['a']['type'] != 'volley' and not cond.get('allow_card'): continue
            want = SIDE[v['target']] if viewer == 'target' else SIDE[v['ship']]
            if side != want: continue
            j = until_hit(g, i, side)
            h = None
            for k in range(i, j + 1):
                h = first(ev(g['steps'][k], side), 'hit') or h
            if not h: continue
            if cond['f'](g, i, j, v, h, side): return side
        return None
    return pred

def no_react(g, i, j, side):
    return not any(first(ev(g['steps'][k], s), 'reaction') for k in range(i, j + 1) for s in (side,))

def compact_state(g, k, side, hand_seat):
    s = g['steps'][k - 1]['after'] if k - 1 >= 0 else g['start']
    out = {'round': s['round'], 'active': s['active'], 'sea': s['sea'], 'powder': s['powder'], 'ships': {}}
    for c, x in s['ships'].items():
        mine = SIDE[c] == side
        out['ships'][c] = {'pos': x['pos'], 'tracks': x['tracks'], 'fires': x['fires'], 'sunk': x['sunk'], 'submerged': x['submerged'], 'souls': x['souls'], 'legend': x['legend'],
                           'hand': x['hand'] if mine else len(x['hand'])}
    out['handSeat'] = hand_seat
    return out

SCENES = []
def add(sid, group, title, desc, hit, hand=None, extra=None):
    if not hit: print('НЕ НАЙДЕНО:', sid); return
    g, a, b, side = hit[0]
    viewer = [c for c in SIDE if SIDE[c] == side]
    acts = []
    for k in range(a, b + 1):
        st = g['steps'][k]
        acts.append({'a': st['a'], 'ev': ev(st, side)})
    hs = hand or next((e.get('seat') or e.get('ship') for x in acts for e in x['ev'] if e['type'] in ('reaction',) and SIDE[e['ship']] == side), None) \
        or next((x['a'].get('seat') or x['a'].get('ship') for x in acts if (x['a'].get('seat') or x['a'].get('ship')) in viewer), None) or viewer[0]
    sc = {'id': sid, 'group': group, 'title': title, 'desc': desc, 'viewer': viewer, 'start': compact_state(g, a, side, hs), 'actions': acts,
          'source': f"партия seed {g['seed']}, действия {g['steps'][a]['n']}–{g['steps'][b]['n']}, глазами {'Пиратов' if side == 'ПИРАТЫ' else 'Компании'}"}
    if extra: sc.update(extra)
    SCENES.append(sc)

V = lambda f, viewer='target', **k: find(volley_scene({'f': f, **k}, viewer), span=lambda g, i: (i, until_hit(g, i, SIDE['Ж'] if False else 'ПИРАТЫ')))

def vfind(f, viewer='target', skip=0):
    hits = []
    for g in games:
        st = g['steps']
        for i in range(1, len(st)):
            s = st[i]
            for side in ('ПИРАТЫ', 'КОМПАНИЯ'):
                evs = ev(s, side)
                v = first(evs, 'volley')
                if not v or s['a']['type'] != 'volley': continue
                want = SIDE[v['target']] if viewer == 'target' else SIDE[v['ship']]
                if side != want: continue
                j = until_hit(g, i, side)
                h = None
                for k in range(i, j + 1): h = first(ev(st[k], side), 'hit') or h
                c = first(ev(st[j], side), 'volleyCancelled')
                if f(g, i, j, v, h, side, c):
                    hits.append((g, i, j, side))
                    if len(hits) > skip: return hits[skip:]
    return hits[skip:]

def reacts(g, i, j, side):
    return [e for k in range(i, j + 1) for e in ev(g['steps'][k], side) if e['type'] == 'reaction']
def rnames(g, i, j, side): return [name(e['card']) for e in reacts(g, i, j, side)]
def after_counter(g, j, side, card):
    st = g['steps']
    if j + 1 < len(st):
        r = first(ev(st[j + 1], side), 'reaction')
        if r and name(r['card']) == card: return j + 1
    return None

T = lambda h: [t['what'] for t in h['terms']] if h else []

# ——— Залп ———
add('plain', 'Залп', 'Залп напротив', 'Обычный Залп по кораблю напротив без модификаторов: ядро на каждую Пушку, все попадают.',
    vfind(lambda g, i, j, v, h, s, c: h and T(h) == ['Пушки'] and not v['diagonal'] and h['damage'] >= 3 and not reacts(g, i, j, s), viewer='shooter'))
add('storm', 'Залп', 'Буря', '«Буря −1»: последнее ядро сносит ветром в волну. На фоне раунда — редкий дождь.',
    vfind(lambda g, i, j, v, h, s, c: h and 'Буря' in T(h) and len(T(h)) == 2 and not reacts(g, i, j, s)))
add('diag', 'Залп', 'Диагональ', 'Залп по диагонали: одно ядро уходит в сторону и падает в воду с меткой «диагональ −1».',
    vfind(lambda g, i, j, v, h, s, c: h and T(h) == ['Пушки', 'диагональ'] and not reacts(g, i, j, s)))
add('greek', 'Залп', 'Греческий огонь', 'Заряд «Греческий огонь»: горящее ядро со шлейфом, после попаданий на цель садится Пожар. Вид ядра — по fx.fire карты.',
    vfind(lambda g, i, j, v, h, s, c: h and v['charge'] and name(v['charge']) == 'Греческий огонь' and not reacts(g, i, j, s) and any(e['type'] == 'fireAdded' for e in ev(g['steps'][j], s))))
add('knippel', 'Залп', 'Книппели', 'Шкала Паруса: два ядра на цепи крутятся в полёте и рвут парусину.',
    vfind(lambda g, i, j, v, h, s, c: h and h['track'] == 'sails' and h['damage'] >= 1 and not reacts(g, i, j, s)))
add('kartech', 'Залп', 'Картечь', 'Шкала Команда: облачко дроби на 1 урон; если Команда на минимуме, урон уходит в Корпус (toHull).',
    vfind(lambda g, i, j, v, h, s, c: h and h['track'] == 'crew' and h['damage'] >= 2 and not reacts(g, i, j, s)))
add('guns', 'Залп', 'Прицельный огонь', 'Шкала Пушки: искры по строке Пушек; лишнее, когда Пушки кончились, уходит в Корпус.',
    vfind(lambda g, i, j, v, h, s, c: h and h['track'] == 'guns' and not reacts(g, i, j, s) and any(e['type'] == 'damage' and e['toHull'] > 0 for e in ev(g['steps'][j], s))))
add('joint', 'Залп', 'Совместный залп', 'Второй корабль бьёт ту же цель: лишнее ядро вылетает с борта союзника («совместный залп +1»).',
    vfind(lambda g, i, j, v, h, s, c: h and 'совместный залп' in T(h) and 'диагональ' not in T(h) and len(T(h)) == 2 and not reacts(g, i, j, s), viewer='shooter'))
add('paid', 'Залп', 'Оплаченный залп', 'Бочонки Пороха из Трюма превращаются в ядра («доплата Порохом»).',
    vfind(lambda g, i, j, v, h, s, c: h and 'доплата Порохом' in T(h) and not reacts(g, i, j, s), viewer='shooter'))
add('flags', 'Залп', 'Поднять флаги!', 'Командный бонус: ядро «Поднять флаги! +1».',
    vfind(lambda g, i, j, v, h, s, c: h and 'Поднять флаги!' in T(h) and not reacts(g, i, j, s)))
add('clear', 'Залп', 'Ясное небо', 'Карта моря «Ясное небо»: Залп напротив +1 — ядро с золотым бликом.',
    vfind(lambda g, i, j, v, h, s, c: h and 'Ясное небо' in T(h) and 'совместный залп' not in T(h) and not reacts(g, i, j, s)))
add('hot', 'Залп', 'Калёные ядра', 'По горящей цели: раскалённые ядра.',
    vfind(lambda g, i, j, v, h, s, c: h and v['charge'] and name(v['charge']) == 'Калёные ядра' and 'Калёные ядра' in T(h) and not reacts(g, i, j, s)))
add('ghost', 'Залп', 'Зов глубин', 'По уже раненой цели: призрачные ядра.',
    vfind(lambda g, i, j, v, h, s, c: h and v['charge'] and name(v['charge']) == 'Зов глубин' and 'Зов глубин' in T(h) and not reacts(g, i, j, s)))
add('deep', 'Залп', 'Из пучины', '«Из пучины»: без Реакций (штамп), диагональ без штрафа, лишнее ядро из-под воды.',
    vfind(lambda g, i, j, v, h, s, c: h and v['charge'] and name(v['charge']) == 'Из пучины' and v['diagonal']))
add('mark', 'Залп', 'Чёрная метка', '«Чёрная метка» на цель, затем Залп: два ядра «+2» летят точно в метку.',
    [(g, i - 1, j, s) for (g, i, j, s) in vfind(lambda g, i, j, v, h, s, c: h and 'Чёрная метка' in T(h) and not reacts(g, i, j, s) and first(ev(g['steps'][i - 1], s), 'flagSet') is not None)][:1])
add('both', 'Залп', 'Залп с обоих бортов', 'Две части: у каждой своё окно Реакций; вторая — тем же Зарядом по второму кораблю.',
    [(g, i, min(i + 4, len(g['steps']) - 1) if False else next(k for k in range(i, i + 6) if len(all_(sum((ev(g['steps'][q], s) for q in range(i, k + 1)), []), 'hit')) >= 2), s)
     for (g, i, j, s) in vfind(lambda g, i, j, v, h, s, c: v['charge'] and name(v['charge']) == 'Залп с обоих бортов' and len(all_(sum((ev(g['steps'][q], s) for q in range(i, min(i + 5, len(g['steps'])))), []), 'hit')) >= 2, viewer='shooter')][:1])
add('heart', 'Залп', 'Сердце Дейви Джонса', '«Индевор» приказывает ещё один Залп: сердце бьётся, нить к «Голландцу», у него гаснет Команда, затем Залп.',
    vfind(lambda g, i, j, v, h, s, c: h and g['steps'][i]['a'].get('heart') and not reacts(g, i, j, s), viewer='shooter'))
add('overkill', 'Залп', 'Залп топит корабль', 'Урона больше, чем осталось клеток: лишние ядра бьют по пустой шкале, затем гибель.',
    vfind(lambda g, i, j, v, h, s, c: h and h['track'] == 'hull' and any(e['type'] == 'sunk' for e in ev(g['steps'][j], s)) and h['damage'] >= 3 and not reacts(g, i, j, s), viewer='shooter'))

# ——— Реакции ———
def R(card, cancelled=False, extra=lambda g, i, j, v, h, s, c: True):
    return vfind(lambda g, i, j, v, h, s, c: card in rnames(g, i, j, s) and (c is not None if cancelled else h is not None) and extra(g, i, j, v, h, s, c))
add('dbl', 'Реакции', 'Двойная обшивка', 'reduce: вторая обшивка вспыхивает, два ядра отскакивают с искрами.', R('Двойная обшивка'))
add('wind', 'Реакции', 'Уйти по ветру', 'reduce на 3: планшет отклоняется, ядра отскакивают; урон может стать 0.', R('Уйти по ветру', extra=lambda g, i, j, v, h, s, c: len(rnames(g, i, j, s)) == 1))
add('cover', 'Реакции', 'Прикрыть бортом', 'redirect: союзник выдвигается, рамка цели и плашка переезжают, одно ядро вязнет. Урон как для исходной цели (18.1).', R('Прикрыть бортом'))
add('whirl', 'Реакции', 'Водоворот', 'reduce_all: воронка в центре до конца хода, ядро затягивает в неё.', R('Водоворот'))
add('night', 'Реакции', 'Чёрные паруса в ночи', 'cancel: цель темнеет, как в ночи, все ядра проходят мимо, штамп «Залп отменён».', R('Чёрные паруса в ночи', cancelled=True))
add('deepcancel', 'Реакции', 'Уйти на глубину', 'cancel: «Голландец» уходит под воду, ядра шлёпают по воде.', R('Уйти на глубину', cancelled=True))
add('plan', 'Реакции', 'Всё по плану', 'cancel_charge: Заряд перечёркнут чернилами, летят обычные ядра.', R('Всё по плану'))
add('zombie', 'Реакции', 'Зомби-офицеры', 'cancel_crew: заслон перед Командой, дробь вязнет. Строки в разборе нет — урон меньше суммы слагаемых.', R('Зомби-офицеры'))
add('heavy', 'Реакции', 'Тяжёлый борт', 'reduce + ответ: ответ по стрелявшему приходит ДО попадания.', R('Тяжёлый борт'))
for card, sid in [('Ответный огонь', 'counter'), ('Ответный залп', 'retaliate'), ('Огненная стена', 'firewall')]:
    hits = vfind(lambda g, i, j, v, h, s, c, card=card: h is not None and after_counter(g, j, s, card) is not None)
    add(sid, 'Реакции', card, 'counter в окне «после»: отдельным действием после попадания — ответ от защищавшегося к стрелявшему.',
        [(g, i, after_counter(g, j, s, card), s) for (g, i, j, s) in hits][:1])

# ——— Корабли и ход ———
def act_find(f, lim=1):
    out = []
    for g in games:
        st = g['steps']
        for i in range(1, len(st)):
            for side in ('ПИРАТЫ', 'КОМПАНИЯ'):
                r = f(g, i, st[i], side)
                if r:
                    end = r if (isinstance(r, int) and not isinstance(r, bool)) else i
                    out.append((g, i, end, side))
                    if len(out) >= lim: return out
    return out
add('regroup', 'Корабли', 'Перестроение', 'Смена мест по дуге (FLIP, ~0,6 с).', act_find(lambda g, i, s, side: s['a']['type'] == 'regroup' and side == s['a']['side']))
add('sword', 'Корабли', 'Меч Тритона', '«Месть» меняет вражеские корабли местами: зелёный блик над ними, затем дуга.', act_find(lambda g, i, s, side: s['a']['type'] == 'sword' and side == 'КОМПАНИЯ'))
add('dive', 'Корабли', 'Погружение', 'Планшет опускается, синее наложение, пузыри, Пожары гаснут.', act_find(lambda g, i, s, side: s['a']['type'] == 'dive' and side == 'КОМПАНИЯ' and g['steps'][i - 1]['after']['ships']['Г']['fires'] > 0) or act_find(lambda g, i, s, side: s['a']['type'] == 'dive' and side == 'КОМПАНИЯ'))
add('surface', 'Корабли', 'Всплытие и Залп', 'В начале хода «Голландец» всплывает; первый Залп +1 и без Реакций, ядро из-под воды.',
    act_find(lambda g, i, s, side: side == 'КОМПАНИЯ' and any(e['type'] == 'surfaced' for e in s['C']) and i + 1 < len(g['steps']) and any(e['type'] == 'hit' and 'всплытие' in T(e) for e in g['steps'][i + 1]['C']) and i + 1))
add('sink', 'Корабли', 'Гибель', 'Крен, воронка, планшет уходит вниз с пузырями — серый контур «Затонул».',
    act_find(lambda g, i, s, side: s['a']['type'] == 'playCard' and any(e['type'] == 'sunk' for e in ev(s, side)) and SIDE[s['a']['seat']] != side))
jk = []
for g in games:
    st = g['steps']
    for i in range(2, len(st)):
        if st[i]['a']['type'] == 'jack' and st[i]['a'].get('play') and any(e['type'] == 'jackEscaped' for e in st[i]['P']) and any(e['type'] in ('hit', 'damage') for e in st[i - 1]['P']):
            jk.append((g, i - 1, i, 'ПИРАТЫ')); break
    if jk: break
add('jack', 'Легенды', 'Джек ускользает', 'Легенда-Реакция: «Жемчужина» начинает тонуть, время замирает, роза ветров, «Ускользнул!», Корпус 2, смена мест.', jk)
add('turn', 'Ход', 'Начало хода', 'Баннер → доход бочонками → Пожар жжёт Корпус → добор: свои карты переворачиваются лицом (лицо видит только владелец).',
    act_find(lambda g, i, s, side: s['a']['type'] == 'endTurn' and any(e['type'] == 'fireDamage' for e in ev(s, side)) and first(ev(s, side), 'turnStarted') and first(ev(s, side), 'turnStarted')['side'] == side and not first(ev(s, side), 'seaRevealed')))
add('card', 'Ход', 'Приказ с уроном', 'Общая анимация карты: карта противника в центре → удар по шкале. Подписи отдельных приказов — уровень 3.',
    act_find(lambda g, i, s, side: s['a']['type'] == 'playCard' and SIDE[s['a']['seat']] != side and len(all_(ev(s, side), 'damage')) >= 1 and not first(ev(s, side), 'windowOpened') and not first(ev(s, side), 'sunk')))
add('repair', 'Ход', 'Норрингтон на борту', 'Ремонт союзника: клетки зеленеют по одной на корабле СОЮЗНИКА (P1).',
    act_find(lambda g, i, s, side: s['a']['type'] == 'playCard' and name(s['a']['card']) == 'Норрингтон на борту' and side == 'КОМПАНИЯ' and first(s['C'], 'restored')))

# ——— Легенды ———
for code, sid in [('И-Л', 'armada'), ('Г-Л', 'kraken'), ('М-Л', 'bottle')]:
    nm = CARDS[code]['name']
    want_side = lambda s: s
    add(sid, 'Легенды', nm, CARDS[code]['text'].replace('<b>', '').replace('</b>', ''),
        act_find(lambda g, i, s, side, code=code: s['a']['type'] == 'playLegend' and s['a']['seat'] == code[0] and side != SIDE[code[0]] and any(e['type'] == 'legendPlayed' for e in ev(s, side))))

# ——— Море ———
for code, c in SEA.items():
    add('sea-' + c['key'], 'Море', c['name'], f"{c['name']} ({c['when'].lower()}): {c['text'].replace('<b>', '').replace('</b>', '')}",
        act_find(lambda g, i, s, side, code=code: side == 'КОМПАНИЯ' and any(e['type'] == 'seaRevealed' and e['card'] == code for e in s['C']) and (c['key'] not in ('wave', 'maelstrom') or any(e['type'] in ('damage', 'swapped') for e in s['C']))))

# ——— Сцены, собранные вручную, но с событиями настоящего движка (tools/synth.ts) ———
try:
    SY = json.load(open(sys.argv[4], encoding='utf-8'))
    meta = {'knippel': ('Залп', 'Книппели', 'Шкала Паруса: два ядра на цепи крутятся в полёте и рвут парусину; когда Паруса кончились — остаток в Корпус.'),
            'abyss': ('Реакции', 'Ответ из пучины', 'counter в окне «после»: призрачная дробь по Команде стрелявшего, Душа «Голландцу».')}
    for k, v in SY.items():
        g, t, d = meta[k]
        SCENES.append({'id': k, 'group': g, 'title': t, 'desc': d, 'viewer': v['viewer'], 'start': v['start'], 'actions': v['actions'], 'source': 'позиция собрана вручную, события — настоящий движок (tools/synth.ts)'})
except (IndexError, FileNotFoundError):
    pass
ORDER = ['Залп', 'Реакции', 'Корабли', 'Ход', 'Легенды', 'Море', 'Интерфейс']
# ——— Интерфейс (предложения, вручную) ———
base = SCENES[0]['start']
SCENES.append({'id': 'aim', 'group': 'Интерфейс', 'title': 'Прицеливание без «Цель»', 'viewer': ['И', 'Г'],
               'desc': 'Предложение (P2): вместо кнопки «Цель» вся карточка корабля — кнопка: доступные цели обведены пунктиром и пульсируют, под курсором — сплошная рамка, выбранная — красная с прицелом.',
               'start': None, 'ui': {'what': 'aim', 'shooter': 'И', 'targets': {'Ж': '3 по Корпусу', 'М': '2 по Корпусу · диагональ −1'}, 'choose': 'М'}, 'actions': [], 'source': 'макет интерфейса'})
SCENES.append({'id': 'tia', 'group': 'Интерфейс', 'title': 'Тиа Дальма', 'viewer': ['Ж', 'М'],
               'desc': 'Предложение (P3): три верхние карты моря видны целиком; «i» открывает карту, нажатие ставит порядок 1-2-3.',
               'start': None, 'ui': {'what': 'tia', 'cards': ['С-03', 'С-01', 'С-07'], 'peek': 'С-03', 'order': ['С-07', 'С-03', 'С-01']}, 'actions': [], 'source': 'макет интерфейса'})

SCENES.sort(key=lambda x: ORDER.index(x['group']))
open(sys.argv[3], 'w', encoding='utf-8').write('/* Сгенерировано build-scenes.py: настоящие ходы из партий ботов (события после eventsFor). */\nwindow.SCENES = ' + json.dumps(SCENES, ensure_ascii=False) + ';\n')
print(len(SCENES), 'scenes')
for s in SCENES: print(s['id'], '|', s['source'], '|', len(s['actions']), 'действ.')
