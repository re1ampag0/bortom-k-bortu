"""Start screen — laptop 1366x660 and phone 390x844."""
import math, random
from art import sky, moon, cloud, ridge, palm, lighthouse, sea, ship, glint_star, streak, island, island_reflection, SEA_CSS, LIGHT_CSS
from fort import fort, FORT_CSS
from common import board, ARROW, CHEV, flourish
from chart import anim_layer, CHART_CSS

IC = '../assets/icons/'


def gulls(x, y, k=1.0, n=3, col='#0b1520'):
    s = f'<g class="gulls">'
    rnd = random.Random(int(x))
    for i in range(n):
        gx, gy = x + i * 16 * k + rnd.random() * 6, y + (i % 2) * 7 * k
        s += f'<path class="gull g{i % 3 + 1}" d="M{gx - 5 * k:.1f} {gy:.1f}Q{gx - 2.4 * k:.1f} {gy - 3 * k:.1f} {gx:.1f} {gy:.1f}Q{gx + 2.4 * k:.1f} {gy - 3 * k:.1f} {gx + 5 * k:.1f} {gy:.1f}" stroke="{col}" stroke-width="{1.1 * k:.2f}" fill="none" stroke-linecap="round"/>'
    return s + '</g>'


def meteor(x, y, L=150, uid='m'):
    """A shooting star: bright head with a soft glow and a long fading tail, crossing down-left."""
    return (f'<g class="meteor"><defs><linearGradient id="mt{uid}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fffbe8" stop-opacity="0"/><stop offset=".7" stop-color="#e8f0ff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="1"/></linearGradient>'
            f'<radialGradient id="mh{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient></defs>'
            f'<path d="M{x} {y} L{x + L} {y - L * .4}" stroke="url(#mt{uid})" stroke-width="1.6" stroke-linecap="round"/>'
            f'<path d="M{x} {y} L{x + L * .55} {y - L * .22}" stroke="#fff" stroke-width=".6" stroke-linecap="round" opacity=".8"/>'
            f'<circle cx="{x}" cy="{y}" r="5" fill="url(#mh{uid})"/><circle cx="{x}" cy="{y}" r="1.3" fill="#fff"/></g>')


def bottle_svg(x, y, k=1.0):
    return (f'<g class="bottle"><g transform="translate({x} {y}) scale({k}) rotate(-14)">'
            '<defs><linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8e0c4" stop-opacity=".95"/><stop offset=".5" stop-color="#3e8a6a" stop-opacity=".85"/><stop offset="1" stop-color="#1a4a36"/></linearGradient></defs>'
            '<path d="M-14 -3.6 C -14 -5.6 -12 -6 -10 -6 L6 -6 C 8 -6 9 -4 10 -3 L14 -2 L14 2 L10 3 C 9 4 8 6 6 6 L-10 6 C -12 6 -14 5.6 -14 3.6 Z" fill="url(#bt)" stroke="#0c2a1e" stroke-width=".6"/>'
            '<rect x="-9" y="-3.4" width="13" height="6.4" rx="1" fill="#efe2c0" opacity=".9"/><path d="M-7 -1 H2 M-7 1 H0" stroke="#8e2b22" stroke-width=".5"/>'
            '<rect x="14" y="-2.2" width="3.4" height="4.4" rx=".8" fill="#8a5a32"/><path d="M-12 -4.4 H6" stroke="#e8fff4" stroke-width=".8" opacity=".7"/></g></g>')


def barrel_svg(x, y, k=1.0):
    return (f'<g class="barrel"><g transform="translate({x} {y}) scale({k})">'
            '<path d="M-8 -5 C -9 -1 -9 1 -8 5 L8 5 C 9 1 9 -1 8 -5 Z" fill="#5a361a"/><path d="M-8.6 -2 H8.6 M-8.6 2.4 H8.6" stroke="#a8822e" stroke-width="1"/>'
            '<path d="M-6 -4.4 C -6.6 -1 -6.6 1 -6 4.4" stroke="#b47c48" stroke-width=".7" fill="none" opacity=".7"/></g></g>')


def compass_rose(cx, cy, r, op=.16):
    s = f'<g opacity="{op}" fill="none" stroke="#7fb4c8">'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke-width="1"/><circle cx="{cx}" cy="{cy}" r="{r * .82}" stroke-width=".6"/>'
    ticks = ''.join(f'M{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}L{cx + r * (.93 if i % 4 else .86) * math.cos(a):.1f} {cy + r * (.93 if i % 4 else .86) * math.sin(a):.1f}' for i, a in ((i, i * math.pi / 16) for i in range(32)))
    s += f'<path d="{ticks}" stroke-width=".8"/>'
    for i in range(16):
        a = i * math.pi / 8
        s += f'<path d="M{cx} {cy}L{cx + r * 3 * math.cos(a):.1f} {cy + r * 3 * math.sin(a):.1f}" stroke-width=".4" opacity=".6"/>'
    s += '</g>'
    pts = []
    for i in range(8):
        a = i * math.pi / 4 - math.pi / 2
        L = r * (.78 if i % 2 == 0 else .45)
        pts.append((cx + L * math.cos(a), cy + L * math.sin(a)))
        a2 = a + math.pi / 8
        pts.append((cx + r * .12 * math.cos(a2), cy + r * .12 * math.sin(a2)))
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    s += f'<path d="{d}" fill="#7fb4c8" opacity="{op * .9}"/>'
    s += f'<text x="{cx}" y="{cy - r * .9}" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-size="{r * .16:.0f}" fill="#7fb4c8" opacity="{op * 1.6}">N</text>'
    return s


def serpent(x, y, k=1.0, op=.3):
    return (f'<g opacity="{op}" fill="none" stroke="#c9a048" stroke-width="1.1" stroke-linecap="round" transform="translate({x} {y}) scale({k})">'
            '<path d="M0 10 C 6 0 12 0 16 8 M22 10 C 28 -2 36 -2 40 8 M46 10 C 52 2 58 4 60 10"/>'
            '<path d="M60 10 C 64 4 70 2 74 4 L80 2 L76 7 C 74 10 68 10 64 10"/><circle cx="73" cy="4.6" r=".8" fill="#c9a048"/>'
            '<path d="M-6 12 C 0 13 4 11 8 12 M18 12 C 24 13 30 11 36 12 M44 12 C 50 13 54 11 58 12" stroke-width=".6" opacity=".7"/></g>')


def soundings(points, op=.28):
    return ''.join(f'<text x="{x}" y="{y}" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="10.5" fill="#7fb4c8" opacity="{op}">{t}</text>' for x, y, t in points)


FK = 1.75
FX = 690 - 61 * FK


def scene_laptop():
    W, SH, HOR = 1366, 340, 262
    FY = HOR + 1 - 36 - 34 * FK
    s = [f'<svg aria-hidden="true" width="{W}" height="{HOR + 2}" viewBox="0 0 {W} {HOR + 2}" style="position: absolute; left: 0; top: 0">']
    s.append(sky(W, HOR + 2, 'M', 'night', seed=5, stars=320, milky=True))
    s.append(glint_star(296, 44, 1.5, cls='tw3'))   # the Pole Star easter egg
    s.append(meteor(330, 58, 120, 'M'))
    s.append(moon(1012, 76, 25, 'M'))
    s.append(cloud(1150, 122, 300, 24, 'c1', '#0f1b29', '#a8bccc', -1, .9, seed=3, op=.7))
    s.append(cloud(1050, 46, 150, 12, 'c2', '#0e1a28', '#d8e4ee', -1, 1, seed=8, cls='clouds2', op=.7))
    s.append(cloud(170, 96, 300, 22, 'c3', '#0c1724', '#4f6476', 1, .3, seed=12, op=.6))
    s.append(cloud(330, 160, 220, 14, 'c4', '#0d1826', '#6f8496', 1, .4, seed=21, cls='clouds2', op=.6))
    s.append(cloud(1240, 196, 200, 12, 'c5', '#0d1826', '#8ea2b4', -1, .6, seed=33, op=.5))
    # far coast, two hazy ridges
    s.append(ridge(W, HOR + 1, 16, 4, '#2a4258', .8, step=12, rough=.7))
    s.append(ridge(W, HOR + 1, 9, 9, '#1c3044', 1, step=9, rough=.9))
    # the fort island in the middle, backlit by the moon
    isl, _ = island(462, 918, HOR + 1, 36, 'IM', 'night', seed=4, plateau=(FX + 4 * FK, FX + 118 * FK), light='right',
                    palms=((528, 34, -8, 1.0), (552, 42, 6, 1.1), (850, 36, 10, 1.0), (874, 28, -6, .85)), bushes=26, k=1.0, rocks=6)
    s.append(isl)
    s.append(fort(FX, FY, FK, uid='M', glow=True))
    # a small wooden pier on the beach with a rowboat tied to it
    s.append(f'<g><path d="M598 {HOR - 1.5} H632" stroke="#2a1e14" stroke-width="2.2"/><path d="M598 {HOR - 2.6} H632" stroke="#6a5a48" stroke-width=".6" opacity=".6"/>'
             f'<path d="M601 {HOR - 1} V{HOR + 3} M610 {HOR - 1} V{HOR + 3.5} M619 {HOR - 1} V{HOR + 3.5} M628 {HOR - 1} V{HOR + 3}" stroke="#1e160e" stroke-width="1.2"/>'
             f'<path d="M578 {HOR + 1} Q586 {HOR + 4.2} 596 {HOR + 1} L594 {HOR - .6} L580 {HOR - .6} Z" fill="#3a2818"/><path d="M580 {HOR - .6} H594" stroke="#8a6a4a" stroke-width=".6" opacity=".7"/>'
             f'<path d="M596 {HOR} Q598 {HOR - 2} 601 {HOR - 1.4}" stroke="#5a4a38" stroke-width=".5" fill="none"/></g>')
    # a distant sloop on the horizon
    s.append(f'<g opacity=".7"><path d="M462 {HOR - 1} L486 {HOR - 1} L482 {HOR + 2} L466 {HOR + 2} Z" fill="#0f1b26"/><path d="M474 {HOR - 2} V{HOR - 24} L486 {HOR - 4} Z M473 {HOR - 3} L463 {HOR - 3} L473 {HOR - 19} Z" fill="#1a2c3c"/><path d="M474 {HOR - 24} L486 {HOR - 4}" stroke="#6f8a9c" stroke-width=".6"/></g>')
    s.append(gulls(700, 150, 1.0, 3))
    s.append(gulls(380, 104, .8, 2))
    s.append(lighthouse(1334, HOR + 2, 1.0, 'M'))
    s.append('</svg>')
    sea_svg, sea_css = sea(W, SH - HOR, 'M', 'night', light_x=1012, light_w=1.3, seed=7, tile=480, density=1.35, glitter=1.6)
    s.append(f'<div style="position: absolute; left: 0; top: {HOR}px; width: {W}px; height: {SH - HOR}px; overflow: hidden">{sea_svg}</div>')
    # the island's dark reflection and the lights of the fort and the lighthouse on the water
    s.append(island_reflection(462, 918, 36, 'IM', 'night').replace('TOP', f'top: {HOR + 1}px'))
    for i, wx in enumerate((24.8, 47.4, 61, 74.4, 93.8)):
        s.append(streak(FX + wx * FK, HOR + 3, 34 if wx == 61 else 24, 5 if wx == 61 else 3.5, 'rgba(255,200,110,.9)', f'refl r{i % 4}', .5 if wx == 61 else .35))
    s.append(streak(1334, HOR + 3, 52, 8, 'rgba(255,236,180,.95)', 'lhWater', 1))
    # ships: pirates left (facing right), company right; stern lanterns, lit stern cabins, moonlight on the sails
    def stern(L, wy, W_, H_, flip, sx=101, sy=52, lx=103, ly=44):
        top = wy - .85 * H_
        px = (lambda x: L + (120 - x) / 120 * W_) if flip else (lambda x: L + x / 120 * W_)
        return (px(sx), top + sy / 78 * H_), (px(lx), top + ly / 78 * H_)
    warm, warm2, ghost = 'rgba(255,207,106,.6)', 'rgba(255,190,90,.75)', 'rgba(120,240,200,.6)'
    rim_moon = 'drop-shadow(1.5px -1px 0 rgba(200,220,240,.18)) drop-shadow(0 0 7px rgba(0,0,0,.4))'
    for name, L, wy, W_, H_, flip, cls, rim, col, alt, sh, k in (
            ('revenge', 270, 296, 190, 123, True, 'bob d1', rim_moon, warm, '«Месть королевы Анны»', 'right', 1),
            ('pearl', 52, 304, 220, 143, True, 'bob', rim_moon, warm, '«Чёрная жемчужина»', 'right', 0),
            ('dutch', 1114, 296, 190, 123, False, 'bob d3', 'drop-shadow(0 0 9px rgba(120,240,200,.22))', ghost, '«Летучий голландец»', 'left', 3),
            ('endeavour', 900, 304, 220, 143, False, 'bob d2', 'drop-shadow(-2px -1px 0 rgba(255,246,214,.22)) drop-shadow(0 0 8px rgba(255,240,190,.14))', warm, '«Индевор»', 'left', 2)):
        (cx, cy), (lx, ly) = stern(L, wy, W_, H_, flip)
        cab_col = 'rgba(140,255,215,.55)' if name == 'dutch' else warm2
        s.append(ship(name, L, wy, W_, H_, flip, cls, rim=rim, lantern=(lx, ly, col), alt=alt, sheen=sh, cabin=(cx, cy, W_ * .14, H_ * .12, cab_col), k=k))
    # flotsam
    s.append(f'<svg aria-hidden="true" width="{W}" height="{SH}" viewBox="0 0 {W} {SH}" style="position: absolute; left: 0; top: 0; overflow: visible">{bottle_svg(690, 314, 1.1)}</svg>')
    # fade into the chart
    s.append(f'<div style="position: absolute; left: 0; top: {SH - 26}px; width: {W}px; height: 26px; background: linear-gradient(rgba(14,27,38,0), #0e1b26)"></div>')
    return ''.join(s), sea_css


def title_block(left, top, width, size=70, sub=17, eyebrow=15, gap=6):
    return (f'<div style="position: absolute; left: {left}px; top: {top}px; width: {width}px; display: flex; flex-direction: column; align-items: center; text-align: center">'
            f'<div class="eyebrow" style="font-size: {eyebrow}px; line-height: 1">ПИРАТЫ · ПРОТИВ · КОМПАНИИ</div>'
            f'<h1 class="sc gold-text" style="margin: {gap + 4}px 0 0; font-size: {size}px; line-height: 1; font-weight: 800; white-space: nowrap; letter-spacing: .015em; filter: drop-shadow(0 2px 0 #4a3610) drop-shadow(0 8px 18px rgba(0,0,0,.65))">Бортом к борту</h1>'
            f'<div style="margin-top: {gap + 6}px; line-height: 0">{flourish(240)}</div>'
            f'<p style="margin: {gap + 2}px 0 0; font-family: Alegreya, Georgia, serif; font-style: italic; font-size: {sub}px; line-height: 1.25; color: #e6edf2; text-shadow: 0 2px 8px rgba(0,0,0,.8)">Морской бой два на два, до последнего корабля.</p>'
            '</div>')


def mode_card(cls, icon, title, text, cta, h=200, pad='20px 22px 18px'):
    return (f'<a class="plaque lift rise {cls}" href="#" style="height: {h}px; box-sizing: border-box; display: flex; flex-direction: column; padding: {pad}; text-decoration: none; color: #eef3f6">'
            f'<div style="display: flex; align-items: center; gap: 12px; min-height: 68px">'
            f'<span class="medal"><img src="{IC}{icon}.svg" alt="" width="50" height="50"></span>'
            f'<h2 class="sc" style="margin: 0; font-size: 23px; line-height: 1.08; font-weight: 800; color: #f0d27a; text-shadow: 0 2px 0 rgba(0,0,0,.5)">{title}</h2></div>'
            f'<p style="margin: 14px 0 0; font-size: 15.5px; line-height: 1.4; color: #d6e1e7">{text}</p>'
            f'<span class="go">{cta}{ARROW}</span></a>')


def laptop():
    W, H = 1366, 660
    sc, sea_css = scene_laptop()
    b = [f'<div style="width: {W}px; height: {H}px; position: relative; overflow: hidden; font-family: \'Alegreya Sans\', system-ui, sans-serif; color: #eef3f6; background: #0e1b26">']
    b.append('<div aria-hidden="true" style="position: absolute; left: 0; top: 340px; width: 1366px; height: 320px; background: url(../assets/bg/chart-main.svg)"></div>')
    al, acss = anim_layer('main', 0, 340)
    b.append(al)
    b.append(f'<div style="position: absolute; left: 0; top: 0; width: {W}px; height: 340px; overflow: hidden">{sc}</div>')
    b.append(title_block(333, 18, 700))
    # cards
    b.append('<div style="position: absolute; left: 83px; top: 356px; width: 1200px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px">')
    b.append('<div class="cream lift rise" style="height: 200px; box-sizing: border-box; display: flex; flex-direction: column; padding: 16px 18px 18px">'
             '<div style="display: flex; align-items: center; gap: 12px; padding-right: 30px">'
             f'<img src="{IC}ic_logbook.svg" alt="" width="50" height="50" style="flex: none; display: block">'
             '<div style="min-width: 0"><div class="sc" style="font-size: 12px; line-height: 1; font-weight: 700; letter-spacing: .14em; color: #8e2b22">Сохранённая партия</div>'
             '<h2 class="sc" style="margin: 6px 0 0; font-size: 25px; line-height: 1; font-weight: 800">Продолжить</h2></div></div>'
             '<button aria-label="Удалить сохранение" title="Удалить сохранение" style="position: absolute; right: 10px; top: 10px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 50%; border: 1px solid #b59a62; background: rgba(255,255,255,.45); cursor: pointer">'
             '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="#6a5434" stroke-width="1.6" stroke-linecap="round"/></svg></button>'
             '<p style="margin: 12px 0 0; font-size: 14.5px; line-height: 1.4; color: #4a3a24">Против ботов, вы за Пиратов<br>Раунд IV, ходит Компания</p>'
             '<a class="btn-gold" href="#" style="margin-top: auto; align-self: stretch">Вернуться к столу</a></div>')
    b.append(mode_card('d1', 'ic_cutlasses', 'Против ботов', 'Вы командуете одной стороной, боты другой.', 'Выбрать сторону'))
    b.append(mode_card('d2', 'ic_flags', 'Игра по сети', 'Каждый играет со своего телефона или ноутбука.', 'Комната по коду'))
    b.append(mode_card('d3', 'ic_mugs', 'На одном экране', 'Играете вдвоём, передавая устройство друг другу.', 'Сесть за стол'))
    b.append('</div>')
    # tools
    tools = [('ic_book', 'Правила', ''), ('ic_cards', 'Коллекция карт', ''), ('ic_wheel', 'Настройки', ' spin'), ('ic_spyglass', 'Матч ботов', '')]
    b.append('<nav class="rise d4" aria-label="Ещё" style="position: absolute; left: 83px; top: 578px; width: 1200px; display: flex; align-items: center; justify-content: center; gap: 52px">')
    for ic, t, x in tools:
        b.append(f'<a class="tool lift{x}" href="#"><span class="round"><img src="{IC}{ic}.svg" alt="" width="40" height="40"></span>{t}</a>')
    b.append('</nav>')
    b.append('<div style="position: absolute; right: 83px; bottom: 10px; font-size: 12px; line-height: 1; color: #7f97a5">Версия 1a2b3c4 · сборка 24.10, 18:40</div>')
    b.append('</div>')
    return board('Стартовый экран', W, H, ''.join(b), SEA_CSS + LIGHT_CSS + sea_css + FORT_CSS + CHART_CSS + acss)


def scene_phone():
    W, SH, HOR = 390, 300, 236
    s = [f'<svg aria-hidden="true" width="{W}" height="{HOR + 2}" viewBox="0 0 {W} {HOR + 2}" style="position: absolute; left: 0; top: 0">']
    s.append(sky(W, HOR + 2, 'P', 'night', seed=6, stars=110, milky=True))
    s.append(glint_star(62, 30, 1.2, cls='tw3'))
    s.append(meteor(250, 120, 110, 'P'))
    s.append(moon(340, 196, 14, 'P'))
    s.append(cloud(250, 196, 130, 10, 'pc1', '#101c2a', '#a8bccc', -1, .8, seed=3, op=.55))
    s.append(cloud(80, 150, 150, 14, 'pc2', '#0c1724', '#6f8496', 1, .35, seed=12, cls='clouds2'))
    s.append(ridge(W, HOR + 1, 10, 4, '#2a4258', .8, step=8, rough=.7))
    pfk = .92
    pfx = 210 - 61 * pfk
    isl, _ = island(138, 286, HOR + 1, 18, 'IP', 'night', seed=7, plateau=(pfx + 4 * pfk, pfx + 118 * pfk), light='right',
                    palms=((152, 22, -5, .62), (272, 24, 6, .65)), bushes=10, k=.6, rocks=3)
    s.append(isl)
    s.append(fort(pfx, HOR + 1 - 18 - 34 * pfk, pfk, uid='P', glow=True))
    s.append(gulls(110, 196, .7, 3))
    s.append('</svg>')
    sea_svg, sea_css = sea(W, SH - HOR, 'P', 'night', light_x=318, light_w=.6, seed=9, tile=390)
    s.append(f'<div style="position: absolute; left: 0; top: {HOR}px; width: {W}px; height: {SH - HOR}px; overflow: hidden">{sea_svg}</div>')
    rim = 'drop-shadow(1px -1px 0 rgba(200,220,240,.18))'
    s.append(ship('revenge', 74, 270, 100, 65, True, 'bob d1', rim=rim, alt='«Месть королевы Анны»'))
    s.append(ship('pearl', -6, 276, 114, 74, True, 'bob', rim=rim, alt='«Чёрная жемчужина»'))
    s.append(ship('dutch', 290, 270, 100, 65, False, 'bob d3', rim='drop-shadow(0 0 6px rgba(120,240,200,.22))', alt='«Летучий голландец»'))
    s.append(ship('endeavour', 200, 276, 114, 74, False, 'bob d2', rim=rim, alt='«Индевор»'))
    s.append(f'<svg aria-hidden="true" width="{W}" height="{SH}" viewBox="0 0 {W} {SH}" style="position: absolute; left: 0; top: 0; overflow: visible">{bottle_svg(186, 284, .8)}</svg>')
    s.append(f'<div style="position: absolute; left: 0; top: {SH - 40}px; width: {W}px; height: 40px; background: linear-gradient(rgba(14,27,38,0), #0e1b26)"></div>')
    return ''.join(s), sea_css


def phone():
    W, H = 390, 844
    sc, sea_css = scene_phone()
    b = [f'<div style="width: {W}px; height: {H}px; position: relative; overflow: hidden; font-family: \'Alegreya Sans\', system-ui, sans-serif; color: #eef3f6; background: #0e1b26">']
    b.append('<div aria-hidden="true" style="position: absolute; left: 0; top: 300px; width: 390px; height: 544px; background: url(../assets/bg/chart-phone-main.svg) center bottom/390px 560px no-repeat"></div>')
    al, acss = anim_layer('phone-main', 0, 284)
    b.append(al)
    b.append(f'<div style="position: absolute; left: 0; top: 0; width: {W}px; height: 300px; overflow: hidden">{sc}</div>')
    b.append(title_block(0, 26, W, size=50, sub=15, eyebrow=12, gap=4))
    b.append('<div style="position: absolute; left: 16px; top: 290px; width: 358px; display: flex; flex-direction: column; gap: 12px">')
    b.append('<div class="cream rise" style="box-sizing: border-box; height: 80px; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 20px">'
             '<div style="flex: 1; min-width: 0"><div class="sc" style="font-size: 11.5px; line-height: 1; font-weight: 700; letter-spacing: .06em; white-space: nowrap; color: #8e2b22">Сохранённая партия</div>'
             '<div style="margin-top: 7px; font-size: 14px; line-height: 1.25; color: #4a3a24">Против ботов<br>Раунд IV</div></div>'
             '<a class="btn-gold" href="#" style="min-height: 42px; padding: 0 16px; font-size: 16px">Продолжить</a>'
             '<button aria-label="Удалить сохранение" style="width: 30px; height: 30px; flex: none; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 50%; border: 1px solid #b59a62; background: rgba(255,255,255,.45)">'
             '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="#6a5434" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>')
    for i, (ic, t, d) in enumerate([('ic_cutlasses', 'Против ботов', 'Вы командуете одной стороной, боты другой'),
                                     ('ic_flags', 'Игра по сети', 'Каждый со своего телефона или ноутбука'),
                                     ('ic_mugs', 'На одном экране', 'Вдвоём, передавая устройство')]):
        b.append(f'<a class="plaque lift rise d{i + 1}" href="#" style="box-sizing: border-box; height: 92px; display: flex; align-items: center; gap: 14px; padding: 0 18px 0 22px; text-decoration: none; color: #eef3f6">'
                 f'<span class="medal" style="width: 60px; height: 60px"><img src="{IC}{ic}.svg" alt="" width="44" height="44"></span>'
                 f'<div style="flex: 1; min-width: 0"><h2 class="sc" style="margin: 0; font-size: 20px; line-height: 1.05; font-weight: 800; color: #f0d27a">{t}</h2>'
                 f'<p style="margin: 6px 0 0; font-size: 14px; line-height: 1.3; color: #d6e1e7">{d}</p></div>{CHEV}</a>')
    b.append('</div>')
    b.append('<div style="position: absolute; left: 16px; top: 706px; width: 358px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">')
    for ic, t, x in [('ic_book', 'Правила', ''), ('ic_cards', 'Карты', ''), ('ic_wheel', 'Настройки', ' spin'), ('ic_spyglass', 'Матч ботов', '')]:
        b.append(f'<a class="lift{x}" href="#" style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: #ecf1f4; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 13.5px; line-height: 1">'
                 f'<span class="round" style="width: 54px; height: 54px"><img src="{IC}{ic}.svg" alt="" width="36" height="36"></span>{t}</a>')
    b.append('</div>')
    b.append('<div style="position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-size: 12px; line-height: 1; color: #7f97a5">Версия 1a2b3c4 · сборка 24.10, 18:40</div>')
    b.append('</div>')
    return board('Стартовый экран — телефон', W, H, ''.join(b), SEA_CSS + LIGHT_CSS + sea_css + FORT_CSS + CHART_CSS + acss)


if __name__ == '__main__':
    import os
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'artboards')
    open(os.path.join(out, 'Main.dc.html'), 'w').write(laptop())
    open(os.path.join(out, 'StartPhone.dc.html'), 'w').write(phone())
    print('ok')
