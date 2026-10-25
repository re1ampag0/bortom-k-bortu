"""Team selection («Против ботов») — laptop 1366x660 and phone 390x844."""
from art import sky, sun, cloud, ridge, palm, sea, ship, island, island_reflection, SEA_CSS
from fort import fort, FORT_CSS
from main_board import gulls
from common import board, ARROW_L, flourish
from chart import anim_layer, CHART_CSS

IC = '../assets/icons/'

PREP_CSS = r'''
.tile{position:relative;display:flex;flex-direction:column;padding:0;border-radius:12px;overflow:hidden;cursor:pointer;text-align:left;font:inherit;color:inherit;border:3px solid transparent;
 background:linear-gradient(#121e29,#121e29) padding-box,linear-gradient(140deg,#e2bf62,#7a5a1e 40%,#c9a048 60%,#5c4615) border-box;box-shadow:0 12px 26px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.5)}
.tile.on{background:linear-gradient(#121e29,#121e29) padding-box,linear-gradient(140deg,#fff6d0,#f0d27a 25%,#b8862c 50%,#fff0b8 72%,#c9a048) border-box}
.tile .ring{position:absolute;inset:-3px;border-radius:12px;pointer-events:none;box-shadow:0 0 0 3px rgba(240,210,122,.45),0 0 30px 4px rgba(240,210,122,.42)}
.plate{display:flex;flex-direction:column;justify-content:center;gap:5px;padding:0 18px;flex:1;position:relative}
.plate::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,rgba(201,160,72,0),#e0bd62 20%,#fff0b8 50%,#e0bd62 80%,rgba(201,160,72,0))}
.tname{font-family:'Alegreya SC',Georgia,serif;font-size:27px;line-height:1;font-weight:800;color:#f6dd92;text-shadow:0 2px 0 rgba(0,0,0,.55)}
.tsub{font-size:14px;line-height:1.3;color:#e2d8cc}
.badge{position:absolute;right:12px;top:12px;display:flex;align-items:center;gap:6px;height:26px;padding:0 10px 1px 11px;box-sizing:border-box;border-radius:13px;
 background:linear-gradient(#fff0b8,#e2bf62 55%,#b8902e);color:#24180a;font-family:'Alegreya SC',Georgia,serif;font-size:13px;line-height:1;font-weight:800;letter-spacing:.06em;box-shadow:0 2px 6px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.7)}
.label{margin:0;font-family:'Alegreya SC',Georgia,serif;font-size:17px;line-height:1;font-weight:700;letter-spacing:.04em;color:#e0bd62}
.seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-radius:10px;overflow:hidden;border:2px solid transparent;
 background:linear-gradient(#101a23,#101a23) padding-box,linear-gradient(140deg,#e2bf62,#7a5a1e 45%,#c9a048) border-box;box-shadow:0 6px 14px rgba(0,0,0,.4)}
.seg button{display:flex;align-items:center;justify-content:center;gap:9px;height:54px;padding:0 10px;border:0;border-left:1px solid rgba(201,160,72,.4);background:none;color:#eef3f6;
 font-family:'Alegreya SC',Georgia,serif;font-weight:700;font-size:16px;line-height:1;cursor:pointer}
.seg button:first-child{border-left:0}
.seg button img{display:block;flex:none}
.seg button[aria-pressed=true]{background:radial-gradient(ellipse 90% 80% at 50% 0%,rgba(255,236,180,.22),rgba(0,0,0,0) 70%),linear-gradient(#6a4422,#3e2412);color:#f6dd92;box-shadow:inset 0 0 0 1px rgba(255,220,140,.3),inset 0 -3px 0 #e0bd62}
.sw{display:flex;align-items:center;gap:12px;min-height:34px;font-size:16px;line-height:1.2;color:#eef3f6;cursor:pointer}
.track{position:relative;width:52px;height:28px;flex:none;border-radius:14px;background:linear-gradient(#0a1218,#1a2630);box-shadow:inset 0 2px 4px rgba(0,0,0,.7),0 0 0 1.5px #7a5a1e}
.track i{position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#dfe6ea,#7d8a92 60%,#4a555c);box-shadow:0 2px 3px rgba(0,0,0,.6)}
.track.on{background:linear-gradient(#1f5a44,#2f7a5e);box-shadow:inset 0 2px 4px rgba(0,0,0,.5),0 0 0 1.5px #c9a048}
.track.on i{left:27px;background:radial-gradient(circle at 38% 32%,#fff6d0,#e2bf62 55%,#9a7020)}
.track.sm{width:46px}.track.sm.on i{left:21px}
.hint{margin:0;font-size:13.5px;line-height:1.4;color:#93a9b5}
.back{display:flex;align-items:center;gap:9px;height:44px;font-family:'Alegreya SC',Georgia,serif;font-weight:700;font-size:16.5px;line-height:1;color:#f0d27a;text-decoration:none}
'''

GO_ICON = '<img src="../assets/icons/ic_sail.svg" alt="" width="46" height="34" style="display: block; margin-top: -2px">'
CHECK = '<svg aria-hidden="true" width="12" height="10" viewBox="0 0 12 10"><path d="M1.5 5.2 L4.6 8.2 L10.5 1.8" stroke="#24180a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def pirates_scene(W, H, uid, k=1.0):
    hor = round(H * .64)
    s = [f'<svg aria-hidden="true" width="{W}" height="{hor + 1}" viewBox="0 0 {W} {hor + 1}" style="position: absolute; left: 0; top: 0">']
    s.append(sky(W, hor + 1, uid, 'sunset', seed=4, stars=14))
    s.append(sun(W * .74, hor - 6 * k, 15 * k, uid))
    s.append(cloud(W * .3, hor * .34, W * .5, 12 * k, uid + 'a', '#4a2030', '#ffb27a', 1, .9, seed=5, op=.85))
    s.append(cloud(W * .86, hor * .2, W * .3, 8 * k, uid + 'b', '#5a2434', '#ffc690', -1, 1, seed=9, cls='clouds2', op=.8))
    s.append(cloud(W * .58, hor * .62, W * .34, 6 * k, uid + 'c', '#6a2a2a', '#ffd2a0', -1, 1, seed=14, op=.7))
    s.append(ridge(W, hor + 1, 9 * k, 7, '#4a2030', .9, step=8, rough=.8))
    s.append(gulls(W * .5, hor * .4, .8 * k, 3, '#2a1018'))
    s.append('</svg>')
    sv, css = sea(W, H - hor, uid, 'sunset', light_x=W * .74, light_w=.8, seed=5, tile=360, density=1.25, glitter=1.4)
    s.append(f'<div style="position: absolute; left: 0; top: {hor}px; width: {W}px; height: {H - hor}px; overflow: hidden">{sv}</div>')
    isl, _ = island(W * .84, W + 20 * k, hor + 2, 12 * k, uid + 'i', 'sunset', seed=5, light='left',
                    palms=((W * .9, 24 * k, -6 * k, .7 * k), (W * .95, 18 * k, 5 * k, .55 * k)), bushes=6, k=.6 * k, rocks=2)
    s.append(f'<svg aria-hidden="true" width="{W}" height="{hor + 4}" viewBox="0 0 {W} {hor + 4}" style="position: absolute; left: 0; top: 0">{isl}</svg>')
    s.append(island_reflection(W * .84, W + 20 * k, 12 * k, uid + 'i', 'sunset').replace('TOP', f'top: {hor + 2}px'))
    rim = 'drop-shadow(1.5px 0 0 rgba(255,190,120,.35)) drop-shadow(0 4px 4px rgba(0,0,0,.45))'
    s.append(ship('revenge', W * .44, hor + 22 * k, 140 * k, 91 * k, True, 'bob d1', rim=rim, refl_op=.3))
    s.append(ship('pearl', W * .07, hor + 28 * k, 156 * k, 101 * k, True, 'bob', rim=rim, refl_op=.3))
    return ''.join(s), css


def company_scene(W, H, uid, k=1.0):
    hor = round(H * .64)
    s = [f'<svg aria-hidden="true" width="{W}" height="{hor + 1}" viewBox="0 0 {W} {hor + 1}" style="position: absolute; left: 0; top: 0">']
    s.append(sky(W, hor + 1, uid, 'dawn', seed=8, stars=6))
    s.append(sun(W * .82, hor + 4, 13 * k, uid, col=('#fffbe8', '#ffe6b0', '#ffb87a'), rays=True))
    s.append(cloud(W * .34, hor * .3, W * .5, 10 * k, uid + 'a', '#4a5a70', '#ffe2c4', 1, .8, seed=6, op=.75))
    s.append(cloud(W * .76, hor * .5, W * .36, 7 * k, uid + 'b', '#5a6a80', '#fff0dc', -1, .9, seed=11, cls='clouds2', op=.7))
    s.append(ridge(W, hor + 1, 7 * k, 2, '#6a7686', .7, step=8, rough=.8))
    s.append(gulls(W * .4, hor * .55, .8 * k, 2, '#3a4656'))
    s.append('</svg>')
    sv, css = sea(W, H - hor, uid, 'dawn', light_x=W * .82, light_w=.7, seed=12, tile=360, density=1.25, glitter=1.2)
    s.append(f'<div style="position: absolute; left: 0; top: {hor}px; width: {W}px; height: {H - hor}px; overflow: hidden">{sv}</div>')
    # morning mist over the far water
    s.append(f'<div aria-hidden="true" style="position: absolute; left: 0; top: {hor - 8}px; width: {W * .62:g}px; height: 18px; background: linear-gradient(rgba(255,240,220,0), rgba(255,240,220,.22), rgba(255,240,220,0)); filter: blur(2px)"></div>')
    fk = .9 * k
    fx = W * .64
    ih = 22 * k
    isl, _ = island(W * .52, W + 30 * k, hor + 2, ih, uid + 'i', 'dawn', seed=9, plateau=(fx + 4 * fk, fx + 118 * fk), light='right',
                    palms=((W * .55, 18 * k, -4 * k, .55 * k),), bushes=12, k=.7 * k, rocks=3)
    land = [isl, fort(fx, hor + 2 - ih - 34 * fk, fk, uid=uid, glow=False)]
    s.append(f'<svg aria-hidden="true" width="{W}" height="{hor + 4}" viewBox="0 0 {W} {hor + 4}" style="position: absolute; left: 0; top: 0">{"".join(land)}</svg>')
    s.append(island_reflection(W * .52, W + 30 * k, ih, uid + 'i', 'dawn').replace('TOP', f'top: {hor + 2}px'))
    rim = 'drop-shadow(-1.5px 0 0 rgba(255,240,210,.4)) drop-shadow(0 4px 4px rgba(0,0,0,.4))'
    s.append(ship('dutch', W * .44, hor + 22 * k, 140 * k, 91 * k, False, 'bob d3', rim='drop-shadow(0 0 6px rgba(120,240,200,.25))', refl_op=.3))
    s.append(ship('endeavour', W * .08, hor + 28 * k, 156 * k, 101 * k, False, 'bob d2', rim=rim, refl_op=.3))
    return ''.join(s), css


def coin_tile(h, coin=118, phone=False):
    sparks = ''.join(f'<span aria-hidden="true" class="tw{i % 3 + 1 if i % 3 else ""}" style="position: absolute; left: {x}%; top: {y}%; width: 3px; height: 3px; border-radius: 50%; background: #fff3c4; box-shadow: 0 0 6px 2px rgba(255,220,140,.6)"></span>'
                     for i, (x, y) in enumerate([(26, 22), (74, 18), (80, 52), (20, 58), (66, 34)]))
    return (f'<div aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(ellipse 60% 55% at 50% 38%, rgba(255,220,140,.16), rgba(0,0,0,0) 70%), radial-gradient(circle at 50% 40%, #233646, #0e1820 72%)"></div>'
            + (sparks if not phone else '')
            + f'<div aria-hidden="true" style="position: absolute; left: 50%; top: {h * .5 - coin * .48:.0f}px; width: {coin * 1.1:.0f}px; height: {coin * .22:.0f}px; translate: -50% 0; margin-top: {coin * .9:.0f}px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.55), rgba(0,0,0,0))"></div>')


def laptop():
    W, H = 1366, 660
    css_all = SEA_CSS + FORT_CSS + PREP_CSS
    b = [f'<div class="chart" style="width: {W}px; height: {H}px; position: relative; overflow: hidden; font-family: \'Alegreya Sans\', system-ui, sans-serif; color: #eef3f6">']
    al, acss = anim_layer('prep')
    b.append(al)
    css_all += CHART_CSS + acss
    b.append(f'<a class="back" href="#" style="position: absolute; left: 40px; top: 34px">{ARROW_L}Назад</a>')
    b.append('<div style="position: absolute; left: 283px; top: 26px; width: 800px; display: flex; flex-direction: column; align-items: center; text-align: center">'
             '<h1 class="sc gold-text" style="margin: 0; font-size: 52px; line-height: 1; font-weight: 800; filter: drop-shadow(0 2px 0 #4a3610) drop-shadow(0 6px 14px rgba(0,0,0,.6))">Против ботов</h1>'
             f'<div style="margin-top: 8px; line-height: 0">{flourish(200)}</div>'
             '<p style="margin: 6px 0 0; font-family: Alegreya, Georgia, serif; font-style: italic; font-size: 17px; line-height: 1.3; color: #d6e1e7">Вы командуете одной стороной, боты другой. Пираты всегда ходят первыми.</p></div>')
    b.append('<p class="label" style="position: absolute; left: 83px; top: 150px">Ваша сторона</p>')
    b.append('<div role="radiogroup" aria-label="Ваша сторона" class="rise" style="position: absolute; left: 83px; top: 176px; width: 1200px; display: grid; grid-template-columns: 1fr 1fr .72fr; gap: 22px">')
    tw = 436
    ps, pcss = pirates_scene(tw, 140, 'PA')
    cs, ccss = company_scene(tw, 140, 'CA')
    css_all += pcss + ccss
    b.append(f'<button class="tile on" role="radio" aria-checked="true" style="height: 212px"><span class="ring pulse" aria-hidden="true"></span>'
             f'<div style="position: relative; height: 140px; overflow: hidden">{ps}<span class="badge">{CHECK}Выбрано</span></div>'
             '<div class="plate" style="background: radial-gradient(ellipse 80% 120% at 20% 0%, rgba(255,140,80,.16), rgba(0,0,0,0) 60%), linear-gradient(#2a110c, #160807)">'
             '<div class="tname">Пираты</div><div class="tsub">«Чёрная жемчужина» и «Месть королевы Анны»</div></div></button>')
    b.append(f'<button class="tile" role="radio" aria-checked="false" style="height: 212px">'
             f'<div style="position: relative; height: 140px; overflow: hidden">{cs}</div>'
             '<div class="plate" style="background: radial-gradient(ellipse 80% 120% at 20% 0%, rgba(255,230,180,.12), rgba(0,0,0,0) 60%), linear-gradient(#1a2a28, #0e1816)">'
             '<div class="tname">Компания</div><div class="tsub">«Индевор» и «Летучий голландец»</div></div></button>')
    b.append(f'<button class="tile" role="radio" aria-checked="false" style="height: 212px; align-items: center">{coin_tile(212)}'
             f'<span class="coin" style="margin-top: 22px"><img class="front" src="{IC}ic_coin.svg" alt="" width="112" height="112"><img class="back" src="{IC}ic_coin_back.svg" alt="" width="112" height="112"></span>'
             '<div style="position: relative; margin-top: 10px; text-align: center"><div class="tname">Жребий</div>'
             '<div class="tsub" style="margin-top: 6px; color: #c8d6dc">Монета выберет сторону</div></div></button>')
    b.append('</div>')
    # options
    b.append('<div class="rise d2" style="position: absolute; left: 83px; top: 408px; width: 1200px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px">')
    b.append('<section><p class="label">Вариант партии</p>'
             '<div class="seg" role="group" aria-label="Вариант партии" style="margin-top: 14px">'
             f'<button aria-pressed="true"><img src="{IC}ic_cannon.svg" alt="" width="30" height="30">Обычная</button>'
             f'<button aria-pressed="false"><img src="{IC}ic_chart.svg" alt="" width="30" height="30">Первая партия</button>'
             f'<button aria-pressed="false"><img src="{IC}ic_bomb.svg" alt="" width="30" height="30">Быстрый бой</button></div>'
             '<p class="hint" style="margin-top: 12px; font-size: 15px; color: #c8d6dc">Все правила, Колода моря и Легенды. Бой идёт, пока у одной стороны не утонут оба корабля.</p></section>')
    b.append('<section><p class="label">Настройки стола</p>'
             '<div style="margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 24px">'
             '<label class="sw"><span class="track on"><i></i></span>Колода моря</label>'
             '<label class="sw"><span class="track on"><i></i></span>Легенды</label>'
             '<label class="sw"><span class="track"><i></i></span>Подсказки</label>'
             '<label class="sw"><span class="track"><i></i></span>Открытые руки</label></div>'
             '<p class="hint" style="margin-top: 12px">Подсказки: урон по целям и выгодные ходы. Открытые руки: все карты на виду.</p></section>')
    b.append('</div>')
    b.append('<div style="position: absolute; left: 83px; right: 83px; top: 580px; height: 1px; background: linear-gradient(90deg, rgba(201,160,72,0), rgba(201,160,72,.45) 15%, rgba(201,160,72,.45) 85%, rgba(201,160,72,0))"></div>')
    b.append('<button aria-expanded="false" style="position: absolute; left: 83px; top: 596px; display: flex; align-items: center; gap: 10px; height: 48px; padding: 0; border: 0; background: none; color: #e0bd62; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 15.5px; line-height: 1; cursor: pointer">'
             '<svg aria-hidden="true" width="8" height="12" viewBox="0 0 8 12"><path d="M1.5 1.5 L6.5 6 L1.5 10.5" stroke="#e0bd62" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Ещё: номер партии и загрузка сохранения</button>')
    b.append(f'<a class="btn-gold" href="#" style="position: absolute; right: 83px; top: 592px; min-height: 52px; min-width: 270px; padding: 0 30px;  font-size: 21px; box-sizing: border-box">{GO_ICON}Поднять паруса</a>')
    b.append('</div>')
    return board('Подготовка партии', W, H, ''.join(b), css_all)


def phone():
    W, H = 390, 844
    css_all = SEA_CSS + FORT_CSS + PREP_CSS
    b = [f'<div class="chart ph" style="width: {W}px; height: {H}px; position: relative; overflow: hidden; font-family: \'Alegreya Sans\', system-ui, sans-serif; color: #eef3f6">']
    al, acss = anim_layer('phone')
    b.append(al)
    css_all += CHART_CSS + acss
    b.append('<a href="#" aria-label="Назад" class="round" style="position: absolute; left: 16px; top: 18px; width: 44px; height: 44px">'
             '<svg aria-hidden="true" width="18" height="14" viewBox="0 0 20 14"><path d="M19 7 H2 M8 1.5 L1.5 7 L8 12.5" stroke="#f0d27a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>')
    b.append('<h1 class="sc gold-text" style="position: absolute; left: 74px; top: 18px; margin: 0; height: 44px; display: flex; align-items: center; font-size: 34px; line-height: 1; font-weight: 800; filter: drop-shadow(0 2px 0 #4a3610)">Против ботов</h1>')
    b.append('<p style="position: absolute; left: 16px; top: 76px; width: 358px; margin: 0; font-family: Alegreya, Georgia, serif; font-style: italic; font-size: 15px; line-height: 1.3; color: #d6e1e7">Вы командуете одной стороной, боты другой. Пираты ходят первыми.</p>')
    b.append('<p class="label" style="position: absolute; left: 16px; top: 132px; font-size: 15.5px">Ваша сторона</p>')
    ps, pcss = pirates_scene(150, 96, 'PP', .6)
    cs, ccss = company_scene(150, 96, 'CP', .6)
    css_all += pcss + ccss
    b.append('<div role="radiogroup" aria-label="Ваша сторона" style="position: absolute; left: 16px; top: 154px; width: 358px; display: flex; flex-direction: column; gap: 10px">')
    b.append(f'<button class="tile on" role="radio" aria-checked="true" style="height: 102px; flex-direction: row"><span class="ring pulse" aria-hidden="true"></span>'
             f'<div style="position: relative; width: 150px; height: 96px; flex: none; overflow: hidden">{ps}</div>'
             '<div class="plate" style="padding: 0 14px; gap: 6px; background: linear-gradient(#2a110c, #160807)"><div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">'
             f'<div class="tname" style="font-size: 23px">Пираты</div><span class="badge" style="position: static; height: 24px; padding: 0 8px">{CHECK}</span></div>'
             '<div class="tsub" style="font-size: 12.5px">«Чёрная жемчужина», «Месть королевы Анны»</div></div></button>')
    b.append(f'<button class="tile" role="radio" aria-checked="false" style="height: 102px; flex-direction: row">'
             f'<div style="position: relative; width: 150px; height: 96px; flex: none; overflow: hidden">{cs}</div>'
             '<div class="plate" style="padding: 0 14px; gap: 6px; background: linear-gradient(#1a2a28, #0e1816)"><div class="tname" style="font-size: 23px">Компания</div>'
             '<div class="tsub" style="font-size: 12.5px">«Индевор», «Летучий голландец»</div></div></button>')
    b.append(f'<button class="tile" role="radio" aria-checked="false" style="height: 76px; flex-direction: row; align-items: center; gap: 12px; padding: 0 14px">'
             '<div aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(ellipse 40% 90% at 15% 50%, rgba(255,220,140,.16), rgba(0,0,0,0) 70%), radial-gradient(circle at 30% 40%, #233646, #0e1820 72%)"></div>'
             f'<span class="coin" style="flex: none"><img class="front" src="{IC}ic_coin.svg" alt="" width="58" height="58"><img class="back" src="{IC}ic_coin_back.svg" alt="" width="58" height="58"></span>'
             '<div style="position: relative"><div class="tname" style="font-size: 23px">Жребий</div><div class="tsub" style="margin-top: 5px; font-size: 13.5px; color: #c8d6dc">Монета выберет сторону</div></div></button>')
    b.append('</div>')
    b.append('<p class="label" style="position: absolute; left: 16px; top: 472px; font-size: 15.5px">Вариант партии</p>')
    b.append('<div class="seg" role="group" aria-label="Вариант партии" style="position: absolute; left: 16px; top: 496px; width: 358px; box-sizing: border-box">'
             f'<button aria-pressed="true" style="flex-direction: column; gap: 4px; height: 66px; padding-bottom: 2px; font-size: 13.5px"><img src="{IC}ic_cannon.svg" alt="" width="28" height="28">Обычная</button>'
             f'<button aria-pressed="false" style="flex-direction: column; gap: 4px; height: 66px; padding-bottom: 2px; font-size: 13.5px"><img src="{IC}ic_chart.svg" alt="" width="28" height="28">Первая партия</button>'
             f'<button aria-pressed="false" style="flex-direction: column; gap: 4px; height: 66px; padding-bottom: 2px; font-size: 13.5px"><img src="{IC}ic_bomb.svg" alt="" width="28" height="28">Быстрый бой</button></div>')
    b.append('<p class="hint" style="position: absolute; left: 16px; top: 574px; width: 358px; font-size: 14px; color: #c8d6dc">Все правила, Колода моря и Легенды. До последнего корабля одной из сторон.</p>')
    b.append('<p class="label" style="position: absolute; left: 16px; top: 630px; font-size: 15.5px">Настройки стола</p>')
    b.append('<div style="position: absolute; left: 16px; top: 652px; width: 358px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px">'
             '<label class="sw" style="font-size: 14.5px; gap: 9px"><span class="track sm on"><i></i></span>Колода моря</label>'
             '<label class="sw" style="font-size: 14.5px; gap: 9px"><span class="track sm on"><i></i></span>Легенды</label>'
             '<label class="sw" style="font-size: 14.5px; gap: 9px"><span class="track sm"><i></i></span>Подсказки</label>'
             '<label class="sw" style="font-size: 14.5px; gap: 9px"><span class="track" style="width: 46px"><i></i></span><span hidden class="track"><i></i></span>Открытые руки</label></div>')
    b.append('<button aria-expanded="false" style="position: absolute; left: 16px; top: 734px; display: flex; align-items: center; gap: 9px; height: 30px; padding: 0; border: 0; background: none; color: #e0bd62; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 14.5px; line-height: 1">'
             '<svg aria-hidden="true" width="8" height="12" viewBox="0 0 8 12"><path d="M1.5 1.5 L6.5 6 L1.5 10.5" stroke="#e0bd62" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Ещё настройки</button>')
    b.append(f'<a class="btn-gold" href="#" style="position: absolute; left: 16px; top: 774px; width: 358px; min-height: 54px;  box-sizing: border-box; font-size: 20px">{GO_ICON}Поднять паруса</a>')
    b.append('</div>')
    return board('Подготовка партии — телефон', W, H, ''.join(b), css_all)


if __name__ == '__main__':
    import os
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'artboards')
    open(os.path.join(out, 'Prep.dc.html'), 'w').write(laptop())
    open(os.path.join(out, 'PrepPhone.dc.html'), 'w').write(phone())
    print('ok')
