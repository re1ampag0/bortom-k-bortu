"""Text, naming and icon fixes on the remaining boards. Reports any replacement that did not match."""
import os, sys, re
from chart import anim_layer, CHART_CSS
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'artboards')
SRC = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/in1024/меню-передача/макеты-docs-mockups-menus/artboards'

COMMON = [
    ('<button class="btn-line"><svg aria-hidden="true" width="26" height="18" viewBox="0 0 34 24"><path d="M4 7 H28 M22 2 L28 7 L22 12 M30 17 H6 M12 12 L6 17 L12 22" stroke="#f0d27a" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>Поменять местами', '<button class="btn-line"><img src="../assets/icons/ic_swap.svg" alt="" width="30" height="30" style="display: block">Переставить корабли'),
]
FIX = {
    'Placement': [
        ('Напротив — без штрафа, по диагонали — урон −1. Компания увидит расстановку только в начале партии.',
         'Напротив корабль бьёт в полную силу, по диагонали на 1 слабее. Компания увидит расстановку только в начале боя.'),
        ('Жребий: вы играете за Пиратов. Первыми ходят Пираты.', 'Монета выбрала: вы за Пиратов. Пираты ходят первыми.'),
        ('левый · в тумане', 'слева, в тумане'),
        ('правый · в тумане', 'справа, в тумане'),
    ],
    'PlacementPhone': [
        ('Кто слева, кто справа? Напротив — без штрафа, по диагонали — урон −1. Компания увидит расстановку только в начале партии.',
         'Кто встанет слева, а кто справа? Напротив корабль бьёт в полную силу, по диагонали на 1 слабее.'),
        ('Жребий: вы играете за Пиратов. Первыми ходят Пираты.', 'Монета выбрала: вы за Пиратов. Пираты ходят первыми.'),
    ],
    'Curtain': [
        ('«Индевор» — Залп по «Мести»: 3 урона по Корпусу.', '«Индевор» дал Залп по «Мести»: 3 урона по Корпусу.'),
        ('«Голландец» — Залп по Команде «Жемчужины»: 2 урона, +1 Душа.', '«Голландец» дал Залп по Команде «Жемчужины»: 2 урона, +1 Душа.'),
        ('Я — Пираты, показать карты', 'Открыть карты Пиратов'),
        ('ход Пиратов · раунд III', 'Ход Пиратов, раунд III'),
    ],
    'CurtainPhone': [
        ('Я — Компания, показать карты', 'Открыть карты Компании'),
        ('тайная расстановка', 'Тайная расстановка'),
    ],
    'NetJoin': [
        ('Вы получите код и ссылку для остальных, рассадите игроков и ботов по кораблям и начнёте партию.',
         'Вы получите код и ссылку для друзей, рассадите всех по кораблям и начнёте бой.'),
        ('position: absolute; right: 183px; bottom: 40px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #9fd2b8',
         'position: absolute; right: 92px; bottom: 44px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #9fd2b8'),
    ],
    'NetRoom': [
        ('Остальные открывают ссылку или вводят код на экране «По сети».', 'Друзья открывают ссылку или вводят код в разделе «Игра по сети».'),
        ('>свободно<', '>Свободно<'),
        ('Окно Реакций ждёт не дольше', 'Время на Реакцию'),
        ('без таймера', 'не ограничено'),
        ('<span style="font-size: 14.5px; color: #c8d6dc">Начинает создатель комнаты. На пустые места сядут боты.</span>',
         '<span style="font-size: 14.5px; color: #c8d6dc; position: relative; top: -30px">Бой начинает создатель комнаты. Пустые места займут боты.</span>'),
        ('<button class="sbtn">Встать</button>', '<button class="sbtn">Сойти</button>'),
        ('<button class="sbtn">Сесть</button><button class="sbtn">Бот</button>', '<button class="sbtn">На борт</button><button class="sbtn">Нанять бота</button>'),
        ('<button class="sbtn">Убрать бота</button>', '<button class="sbtn">Списать бота</button>'),
        ('icons/ic_bell.svg', 'icons/ic_key.svg'),
        ('icons/ic_wheel.svg', 'icons/ic_autohelm.svg'),
    ],
    'NetRoomPhone': [
        ('>свободно<', '>Свободно<'),
        ('Обычная · море · Легенды · подсказки', 'Обычная, Колода моря, Легенды, подсказки'),
        ('На пустые места сядут боты.', 'Пустые места займут боты.'),
        ('<button class="sbtn">Встать</button>', '<button class="sbtn">Сойти</button>'),
        ('<button class="sbtn">Сесть</button><button class="sbtn">Бот</button>', '<button class="sbtn">На борт</button><button class="sbtn">Нанять</button>'),
        ('<button class="sbtn">Убрать</button>', '<button class="sbtn">Списать</button>'),
        ('icons/ic_wheel.svg', 'icons/ic_autohelm.svg'),
    ],
    'Settings': [
        ('>Богатые<', '>Полные<'),
        ('Пропуск показа касанием стола', 'Касание стола пропускает показ'),
        ('«Ход окончен · Отменить» — 1 с вместо 3 с', 'Отменить «Ход окончен» можно 1 с, а не 3 с'),
        ('Фон под рукой', 'Фон'),
        ('Вид стола меняется сразу — изменения видно за окном.', 'Вид стола меняется сразу, это видно за окном.'),
        ('Сдаться (Пираты)', 'Сдаться за Пиратов'),
        ('icons/ic_spyglass.svg', 'icons/ic_lantern.svg'),
        ('icons/ic_cutlasses.svg', 'icons/ic_bell.svg'),
    ],
    'SettingsPhone': [
        ('>Богатые<', '>Полные<'),
        ('Пропуск показа касанием стола', 'Касание стола пропускает показ'),
        ('«Ход окончен · Отменить» — 1 с вместо 3 с', 'Отменить «Ход окончен» можно 1 с, а не 3 с'),
        ('Фон под рукой', 'Фон'),
        ('Сдаться (Пираты)', 'Сдаться за Пиратов'),
        ('icons/ic_spyglass.svg', 'icons/ic_lantern.svg'),
        ('icons/ic_cutlasses.svg', 'icons/ic_bell.svg'),
    ],
    'Rules': [
        ('«Подробности — в главах слева, по одной за вахту»', '«Подробности в главах слева, по одной за вахту»'),
        ('Море — откройте карту моря', 'Море: откройте карту моря'),
        ('Ход команды — оба корабля сразу', 'Ход команды: оба корабля сразу'),
        ('Действия: карт — не больше Команды, Залп — один на корабль.', 'Действия: карт не больше Команды, один Залп на корабль.'),
        ('Стоит 1 Порох. Урон = Пушки. По диагонали — на 1 меньше. Второй корабль бьёт ту же цель — на 1 больше (раз в ход). Без Заряда — по Корпусу.',
         'Стоит 1 Порох. Урон равен Пушкам, по диагонали на 1 меньше. Второй корабль по той же цели бьёт на 1 сильнее (раз в ход). Без Заряда бьёт по Корпусу.'),
        ('Реакций — не больше Парусов. Играйте, когда враг объявил Залп или карту, — до урона. Платите Порохом из своего Трюма.',
         'Реакций не больше, чем Парусов. Играйте их, когда враг объявил Залп или карту, до урона. Порох берите из своего Трюма.'),
        ('Продать карту — +1 Порох.', 'Продать карту: +1 Порох.'),
        ('Перестроение — 1 Порох', 'Перестроение: 1 Порох'),
        ('Потушить Пожар — сбросить карту.', 'Потушить Пожар: сбросить карту.'),
        ('Шкала на минимуме — остаток в Корпус.', 'Шкала на минимуме: остаток урона идёт в Корпус.'),
        ('Корпус 0 — корабль тонет.', 'При Корпусе 0 корабль тонет.'),
        ('<div style="display: grid; grid-template-columns: auto 1fr; gap: 5px 8px; align-items: center; font-size: 14px; color: #3a2a18"><span class="tag" style="background: #5f6266">ЗАРЯД</span><span>вместе с Залпом</span><span class="tag" style="background: #5b3c7a">ПРИКАЗ</span><span>в свой ход</span><span class="tag" style="background: #2f6b4f">РЕМОНТ</span><span>в свой ход</span><span class="tag" style="background: #2f5f8a">РЕАКЦИЯ</span><span>в ход противника</span></div>', '<div style="display: grid; grid-template-columns: auto auto 1fr; gap: 6px 8px; align-items: center; font-size: 14px; color: #3a2a18"><img src="../assets/icons/ic_t_charge.svg" alt="" width="24" height="24" style="display: block"><span class="tag" style="background: #5f6266">ЗАРЯД</span><span>вместе с Залпом</span><img src="../assets/icons/ic_t_order.svg" alt="" width="24" height="24" style="display: block"><span class="tag" style="background: #5b3c7a">ПРИКАЗ</span><span>в свой ход</span><img src="../assets/icons/ic_t_repair.svg" alt="" width="24" height="24" style="display: block"><span class="tag" style="background: #2f6b4f">РЕМОНТ</span><span>в свой ход</span><img src="../assets/icons/ic_t_reaction.svg" alt="" width="24" height="24" style="display: block"><span class="tag" style="background: #2f5f8a">РЕАКЦИЯ</span><span>в ход противника</span></div>'),
    ],
    'RulesPhone': [
        ('«Всё главное — здесь. Подробности — в главах выше».', '«Всё главное здесь. Подробности в главах выше».'),
        ('Море — откройте карту моря', 'Море: откройте карту моря'),
        ('Ход команды — оба корабля сразу', 'Ход команды: оба корабля сразу'),
        ('Действия: карт — не больше Команды, Залп — один на корабль.', 'Действия: карт не больше Команды, один Залп на корабль.'),
        ('Стоит 1 Порох. Урон = Пушки. По диагонали — на 1 меньше. Второй корабль бьёт ту же цель — на 1 больше (раз в ход). Без Заряда — по Корпусу.',
         'Стоит 1 Порох. Урон равен Пушкам, по диагонали на 1 меньше. Второй корабль по той же цели бьёт на 1 сильнее (раз в ход). Без Заряда бьёт по Корпусу.'),
        ('Реакций — не больше Парусов. Играйте, когда враг объявил Залп или карту, — до урона.',
         'Реакций не больше, чем Парусов. Играйте их, когда враг объявил Залп или карту, до урона.'),
    ],
    'RulesChapter': [
        ('Залп — главный способ топить врагов.', 'Залп: главный способ топить врагов.'),
        ('по диагонали — урон на 1 меньше;', 'по диагонали урон на 1 меньше;'),
        ('<strong>совместный залп</strong> — если', '<strong>совместный залп</strong>: если'),
        ('Попадать — тоже. Просто слабее', 'Попадать тоже. Просто слабее'),
        ('Заряды, Реакции и карта моря — как написано на них.', 'Заряды, Реакции и карта моря меняют урон так, как написано на них.'),
        ('Залп по кораблю напротив — 3 урона, по диагонали — 2. Если «Жемчужина» уже стреляла в ту же цель в этот ход — ещё +1.',
         'Залп по кораблю напротив нанесёт 3 урона, по диагонали 2. Если «Жемчужина» уже стреляла в ту же цель в этот ход, добавьте ещё 1.'),
    ],
}


OPTICAL = '\n/* optical centring: Alegreya SC small caps sit low in the line box, lift them */\n.btn-gold{padding-bottom:4px!important}\n'


def run():
    miss = []
    for name, reps in FIX.items():
        p = os.path.join(OUT, name + '.dc.html')
        s = open(os.path.join(SRC, name + '.dc.html')).read()   # always start from the original
        for a, b in reps + COMMON:
            if a in s:
                s = s.replace(a, b)
            elif (a, b) not in COMMON:
                miss.append((name, a[:60]))
        extra = ''
        cv = {'NetJoin': 'net', 'NetRoom': 'net', 'Placement': 'prep', 'NetRoomPhone': 'phone', 'PlacementPhone': 'phone'}.get(name)
        if cv:
            extra += f'\n.chart:not(.doc){{background:#0e1b26 url(../assets/bg/chart-{cv}.svg) center/cover no-repeat!important}}\n'
            al, acss = anim_layer(cv)
            extra += CHART_CSS + acss
            s = re.sub(r'(</helmet>\s*<div class="chart"[^>]*>)', lambda m: m.group(1) + al, s, count=1)
        if name == 'NetRoom':
            extra += ('\n/* ships sit in the water, not on it */\n.seat .berth img{top:-2px!important;filter:none!important}'
                      '.berth rect[fill^="url(#sh"]{display:none}'
                      '.seat .berth::after{content:"";position:absolute;left:16px;right:16px;top:47px;height:7px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));z-index:2}\n')
        if name == 'NetRoomPhone':
            extra += ('\n/* ships sit in the water, not on it */\n.seat img.ship{top:0!important;filter:none!important}'
                      '.berth rect[fill^="url(#sh"]{display:none}'
                      '.berth::after{content:"";position:absolute;left:12px;right:12px;top:39px;height:6px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));z-index:2}\n')
        if name.startswith('Placement'):
            extra += '\n.btn-line img{margin-left:-4px}\n.slot.own img.bob{scale:.9;transform-origin:50% 100%}\n'
            extra += '\n.stat{height:22px;padding:0 7px 0 5px;gap:4px}\n' if name == 'Placement' else ''
        if name == 'NetRoom':
            extra += '\n.seat{height:80px;padding:8px 12px 8px 8px}\n'
        if name == 'NetRoomPhone':
            extra += '\n.seat{height:66px;padding:7px 8px 7px 7px}\n'
        if name in ('SettingsPhone', 'RulesPhone'):
            extra += '\nheader:has(button[aria-label="Закрыть"]){height:60px!important}\n'
        s = re.sub(r'<svg aria-hidden="true" width="24" height="22" viewBox="0 0 24 22">(?:(?!</svg>).)*</svg>(\s*)Поднять паруса',
                   r'<img src="../assets/icons/ic_sail.svg" alt="" width="46" height="34" style="display: block; margin-top: -2px">\1Поднять паруса', s, flags=re.S)
        if name.startswith('Curtain'):
            # the medallion is the new two-sided coin: the pirate face for the Pirates, the Company face for the Company
            face = 'ic_coin.svg' if name == 'Curtain' else 'ic_coin_back.svg'
            s = re.sub(r'<svg aria-hidden="true" width="(\d+)" height="\1" viewBox="-50 -50 100 100"([^>]*)>.*?</svg>',
                       lambda m: f'<img src="../assets/icons/{face}" alt="" width="{m.group(1)}" height="{m.group(1)}"{m.group(2)} style="display: block; filter: drop-shadow(0 6px 10px rgba(0,0,0,.55))">'.replace(' style="margin-top: 14px" style="', ' style="margin-top: 14px; '),
                       s, count=1, flags=re.S)
        s = s.replace('</style>', extra + '</style>', 1)
        open(p, 'w').write(s)
    return miss


if __name__ == '__main__':
    for m in run():
        print('MISS', m)
