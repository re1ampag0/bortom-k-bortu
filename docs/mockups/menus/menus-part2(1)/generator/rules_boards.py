import re, html
S='/tmp/claude-0/-home-claude/18749616-f1c3-5828-8355-b5a8b20b366c/scratchpad'
PIPE='/_blob/cbe673742dbe676b8e3e9f1750c7944c'
md=open(f'{S}/rules/rules-novice.md').read()

TOC=[('★','Памятка'),('','За минуту'),('1','Команды и цель'),('2','Подготовка'),('3','Корабль и шкалы'),('4','Раунд'),('5','Ход команды'),('6','Порох'),('7','Карты'),('8','Залп'),('9','Реакции'),('10','Свободные действия'),('11','Урон и Ремонт'),('12','Пожары'),('13','Особенности кораблей'),('14','Легенды'),('15','Колода моря'),('16','Корабль утонул'),('17','Конец игры'),('18','Варианты'),('19','Частые вопросы')]

HEAD='''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;1,400;1,500&amp;family=Alegreya+SC:wght@500;700;800&amp;family=Alegreya+Sans:wght@400;500;700&amp;family=Old+Standard+TT:wght@400;700&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#e0bd62}}
.sc{{font-family:'Alegreya SC',Georgia,serif}}
.chart{{background-color:#0e1b26;background-image:linear-gradient(rgba(127,180,200,.07) 1px,rgba(0,0,0,0) 1px),linear-gradient(90deg,rgba(127,180,200,.07) 1px,rgba(0,0,0,0) 1px);background-size:48px 48px}}
.toc a{{display:flex;align-items:center;gap:8px;min-height:25px;padding:0 10px;border-radius:6px;color:#c8d6dc;text-decoration:none;font-size:14px;white-space:nowrap}}
.toc a b{{width:20px;flex:none;text-align:right;font-family:'Old Standard TT',Georgia,serif;font-weight:700;font-size:12.5px;color:#8fa6b3}}
.toc a.on{{background:rgba(240,210,122,.14);color:#f6dd92;box-shadow:inset 3px 0 0 #f0d27a}}
.card{{box-sizing:border-box;padding:9px 12px;border-radius:10px;background:linear-gradient(#f3ebd6,#e6d8b4);color:#2a1e12;border:1.5px solid #c9a048;box-shadow:0 4px 12px rgba(0,0,0,.35)}}
.card h3{{margin:0 0 4px;font-family:'Alegreya SC',Georgia,serif;font-weight:800;font-size:16px;color:#8e2b22;letter-spacing:.02em}}
.card p{{margin:0;font-size:13.5px;line-height:1.3;color:#3a2a18}}
.step{{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.3;color:#3a2a18}}
.step i{{flex:none;width:20px;height:20px;border-radius:50%;background:#5a3a22;color:#f6dd92;font-style:normal;font-family:'Old Standard TT',Georgia,serif;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;margin-top:1px}}
.tag{{display:inline-flex;align-items:center;padding:2px 8px;border-radius:5px;color:#fff;font-family:'Alegreya SC',Georgia,serif;font-weight:800;font-size:12px;letter-spacing:.06em}}
.bosun{{display:flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;border-radius:10px;border:1px dashed rgba(201,160,72,.6);background:rgba(201,160,72,.08);font-family:Alegreya,Georgia,serif;font-style:italic;font-size:15px;line-height:1.3;color:#f3e6c4}}
.bosun b{{font-family:'Alegreya SC',Georgia,serif;font-style:normal;color:#f0d27a}}
.doc h2{{margin:0 0 8px;font-family:'Alegreya SC',Georgia,serif;font-weight:800;font-size:24px;color:#f0d27a}}
.doc h2 small{{font-family:'Old Standard TT',Georgia,serif;color:#c9a048;margin-right:8px}}
.doc p{{margin:0 0 9px;font-size:15.5px;line-height:1.42;color:#e2eaee}}
.doc ul,.doc ol{{margin:0 0 9px;padding-left:22px;font-size:15.5px;line-height:1.42;color:#e2eaee}}
.doc li{{margin:0 0 3px}}
.doc strong{{color:#f6dd92}}
.doc table{{border-collapse:collapse;margin:0 0 12px;font-size:14px;color:#e2eaee;width:100%}}
.doc th{{text-align:left;font-family:'Alegreya SC',Georgia,serif;color:#f0d27a;border-bottom:1.5px solid rgba(201,160,72,.6);padding:5px 8px}}
.doc td{{border-bottom:1px solid rgba(201,160,72,.2);padding:5px 8px;vertical-align:top}}
.doc td:nth-child(2){{white-space:nowrap}}
.doc .bosun{{margin:4px 0 14px}}
</style>
</helmet>
'''
TAIL='''</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
def inline(s):
    s=html.escape(s,quote=False)
    s=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)
    return s
def bosun_html(text, size=None):
    return f'<div class="bosun"><img src="{PIPE}" alt="" width="38" height="38" style="flex: none"><span><b>Боцман:</b> {text}</span></div>'
def md2html(src):
    out=[]; lines=src.split('\n'); i=0
    while i<len(lines):
        l=lines[i]
        if not l.strip(): i+=1; continue
        if l.startswith('# '): i+=1; continue
        if l.startswith('## '):
            h=l[3:]; m=re.match(r'(\d+)\. (.*)',h)
            out.append(f'<h2><small>{m.group(1)}</small>{inline(m.group(2))}</h2>' if m else f'<h2>{inline(h)}</h2>'); i+=1; continue
        if l.startswith('> '):
            q=l[2:]; q=re.sub(r'^\*\*Боцман:\*\* ','',q); out.append(bosun_html(inline(q).replace('&quot;','"'))); i+=1; continue
        if l.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                rows.append([c.strip() for c in lines[i].strip('|').split('|')]); i+=1
            hdr=rows[0]; body=rows[2:]
            out.append('<table><tr>'+''.join(f'<th>{inline(c)}</th>' for c in hdr)+'</tr>'+''.join('<tr>'+''.join(f'<td>{inline(c)}</td>' for c in r)+'</tr>' for r in body)+'</table>'); continue
        if l.startswith('- '):
            items=[]
            while i<len(lines) and lines[i].startswith('- '): items.append(lines[i][2:]); i+=1
            out.append('<ul>'+''.join(f'<li>{inline(x)}</li>' for x in items)+'</ul>'); continue
        if re.match(r'\d+\. ',l):
            items=[]
            while i<len(lines) and re.match(r'\d+\. ',lines[i]): items.append(re.sub(r'^\d+\. ','',lines[i])); i+=1
            out.append('<ol>'+''.join(f'<li>{inline(x)}</li>' for x in items)+'</ol>'); continue
        out.append(f'<p>{inline(l)}</p>'); i+=1
    return '\n'.join(out)
def chapters():
    parts=re.split(r'\n(?=## )',md)
    return {re.match(r'## (?:\d+\. )?(.*)',p).group(1):p for p in parts if p.startswith('## ')}
CH=chapters()

def toc(sel, rowh=25):
    s='<nav class="toc" aria-label="Разделы правил" style="width: 236px; flex: none; box-sizing: border-box; padding: 10px 8px; border-right: 1px solid rgba(201,160,72,.35); background: rgba(8,14,20,.55); display: flex; flex-direction: column; gap: 1px; overflow: hidden; position: relative">'
    for n,tl in TOC:
        cls=' class="on"' if tl==sel else ''
        s+=f'<a href="#"{cls}><b>{n}</b>{tl}</a>'
    s+='<span aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 40px; background: linear-gradient(rgba(8,14,20,0), rgba(8,14,20,.97) 80%)"></span></nav>'
    return s
def window(inner, sel):
    return f'''<div style="width: 1366px; height: 660px; position: relative; overflow: hidden; font-family: 'Alegreya Sans', system-ui, sans-serif; color: #eef3f6; background: linear-gradient(#3a2614, #22160c)">
  <div aria-hidden="true" style="position: absolute; left: 18px; top: 72px; width: 1000px; height: 480px; border-radius: 8px; background: #234a5e; opacity: .55"></div>
  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(4,8,12,.68)"></div>
  <section role="dialog" aria-label="Правила" class="chart" style="position: absolute; left: 123px; top: 26px; width: 1120px; height: 608px; box-sizing: border-box; border: 3px solid #c9a048; border-radius: 14px; box-shadow: inset 0 0 0 1px #5c4615, 0 24px 60px rgba(0,0,0,.6); overflow: hidden; display: flex; flex-direction: column">
    <header style="flex: none; height: 64px; display: flex; align-items: center; gap: 14px; padding: 0 16px 0 18px; background: linear-gradient(#23333f, #15212b); border-bottom: 2px solid #c9a048">
      <img src="/_blob/b898c0440f8c0f2cae6d45bcfc67836e" alt="" width="40" height="40">
      <h1 class="sc" style="margin: 0; font-size: 26px; font-weight: 800; color: #f0d27a">Правила</h1>
      <label style="margin-left: 24px; flex: 1; max-width: 420px; position: relative">
        <span style="position: absolute; left: 12px; top: 12px"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><circle cx="7.5" cy="7.5" r="5.5" stroke="#c9a048" stroke-width="1.8" fill="none"></circle><path d="M11.5 11.5 L16 16" stroke="#c9a048" stroke-width="1.8" stroke-linecap="round"></path></svg></span>
        <input placeholder="Поиск по правилам…" aria-label="Поиск по правилам" style="width: 100%; box-sizing: border-box; min-height: 42px; padding: 0 12px 0 38px; border-radius: 21px; border: 1.5px solid #8a6a24; background: #0b141c; color: #f4ece2; font-size: 15px; font-family: 'Alegreya Sans', system-ui, sans-serif">
      </label>
      <span style="flex: 1"></span>
      <a href="#" style="font-family: 'Alegreya SC', Georgia, serif; font-weight: 700; font-size: 14px; text-decoration: none; color: #c9a048">Полный свод правил</a>
      <button aria-label="Закрыть" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #c9a048; background: radial-gradient(circle at 40% 32%, #f6dd92, #c9a048 60%, #8a6a24); color: #24180a; font-size: 22px; font-weight: 700; line-height: 1; cursor: pointer">×</button>
    </header>
    <div style="flex: 1; min-height: 0; display: flex">
      {toc(sel)}
      {inner}
    </div>
  </section>
</div>
'''
MEMO_CARDS='''<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
          <div class="card"><h3>Раунд</h3><div style="display: flex; flex-direction: column; gap: 5px"><div class="step"><i>1</i>Море — откройте карту моря</div><div class="step"><i>2</i>Ход Пиратов</div><div class="step"><i>3</i>Ход Компании</div></div></div>
          <div class="card" style="grid-column: span 2"><h3>Ход команды — оба корабля сразу</h3><div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px"><div style="display: flex; flex-direction: column; gap: 6px"><div class="step"><i>1</i>Трюм: +3 Пороха (больше 8 не влезет). Горящие корабли получают урон.</div><div class="step"><i>2</i>Добор до 5 карт. Планы «Жемчужины» тоже считаются.</div></div><div style="display: flex; flex-direction: column; gap: 6px"><div class="step"><i>3</i>Действия: карт — не больше Команды, Залп — один на корабль.</div><div class="step"><i>4</i>«Ход окончен».</div></div></div></div>
          <div class="card"><h3>Залп</h3><p>Стоит 1 Порох. Урон = Пушки. По диагонали — на 1 меньше. Второй корабль бьёт ту же цель — на 1 больше (раз в ход). Без Заряда — по Корпусу.</p></div>
          <div class="card"><h3>Ход противника</h3><p>Реакций — не больше Парусов. Играйте, когда враг объявил Залп или карту, — до урона. Платите Порохом из своего Трюма.</p></div>
          <div class="card"><h3>Свободные действия</h3><p>Продать карту — +1 Порох. Передать карту союзнику. Перестроение — 1 Порох (Пиратам бесплатно, пока «Жемчужина» на плаву). Потушить Пожар — сбросить карту.</p></div>
          <div class="card"><h3>Урон</h3><p>Шкала на минимуме — остаток в Корпус. Команда не ниже 1. Корпус 0 — корабль тонет.</p></div>
          <div class="card"><h3>Корабль утонул</h3><p>Капитан переходит к союзнику: 1 карта в свой ход и 1 Реакция в ход противника.</p></div>
          <div class="card"><h3>Типы карт</h3><div style="display: grid; grid-template-columns: auto 1fr; gap: 5px 8px; align-items: center; font-size: 14px; color: #3a2a18"><span class="tag" style="background: #5f6266">ЗАРЯД</span><span>вместе с Залпом</span><span class="tag" style="background: #5b3c7a">ПРИКАЗ</span><span>в свой ход</span><span class="tag" style="background: #2f6b4f">РЕМОНТ</span><span>в свой ход</span><span class="tag" style="background: #2f5f8a">РЕАКЦИЯ</span><span>в ход противника</span></div></div>
        </div>'''
# A) Rules — memo
memo_inner=f'''<div style="flex: 1; min-width: 0; padding: 10px 20px; display: flex; flex-direction: column; gap: 9px">
        <div style="display: flex; align-items: center; gap: 12px"><h2 class="sc" style="margin: 0; font-size: 22px; font-weight: 800; color: #f0d27a">Памятка</h2><span style="font-size: 14px; color: #8fa6b3">всё главное на одной странице</span><span style="flex: 1"></span><span style="display: flex; align-items: center; gap: 6px; font-family: Alegreya, Georgia, serif; font-style: italic; font-size: 14px; color: #f3e6c4"><img src="{PIPE}" alt="" width="28" height="28"><b class="sc" style="font-style: normal; color: #f0d27a">Боцман:</b> «Подробности — в главах слева, по одной за вахту»</span></div>
        {MEMO_CARDS}
      </div>'''
open(f'{S}/menus/project/Rules.dc.html','w').write(HEAD.format(title='Правила — памятка')+window(memo_inner,'Памятка')+TAIL.format(w=1366,h=660))

# B) RulesChapter — Залп
ch=CH['Залп']
body=md2html(ch)
diagram='''<div style="width: 250px; flex: none; display: flex; flex-direction: column; gap: 10px">
          <div style="border-radius: 10px; border: 1.5px solid rgba(201,160,72,.6); background: linear-gradient(#18384c, #0f2232); padding: 10px">
            <svg viewBox="0 0 230 190" width="230" height="190" aria-label="Схема: напротив и по диагонали">
              <g font-family="Alegreya SC, Georgia, serif" font-weight="700" font-size="11">
              <rect x="20" y="14" width="80" height="34" rx="6" fill="rgba(200,218,230,.1)" stroke="rgba(200,218,230,.5)" stroke-dasharray="4 3"></rect><text x="60" y="35" text-anchor="middle" fill="#dbe6ec">враг</text>
              <rect x="130" y="14" width="80" height="34" rx="6" fill="rgba(200,218,230,.1)" stroke="rgba(200,218,230,.5)" stroke-dasharray="4 3"></rect><text x="170" y="35" text-anchor="middle" fill="#dbe6ec">враг</text>
              <rect x="20" y="140" width="80" height="34" rx="6" fill="rgba(240,210,122,.14)" stroke="#f0d27a"></rect><text x="60" y="161" text-anchor="middle" fill="#f6dd92">вы</text>
              <path d="M60 140 V50" stroke="#f0d27a" stroke-width="2.4"></path><path d="M55 58 L60 48 L65 58" fill="none" stroke="#f0d27a" stroke-width="2.4"></path>
              <path d="M84 140 L162 52" stroke="#e08a6a" stroke-width="2" stroke-dasharray="6 5"></path><path d="M153 56 L163 50 L161 61" fill="none" stroke="#e08a6a" stroke-width="2"></path>
              <text x="44" y="100" text-anchor="end" fill="#f0d27a">полный</text><text x="44" y="113" text-anchor="end" fill="#f0d27a">урон</text>
              <text x="132" y="112" fill="#f0b090">−1</text>
              </g>
            </svg>
          </div>
          <div class="card"><h3>Пример</h3><p>У «Мести» 3 Пушки. Залп по кораблю напротив — 3 урона, по диагонали — 2. Если «Жемчужина» уже стреляла в ту же цель в этот ход — ещё +1.</p></div>
        </div>'''
chap_inner=f'''<div style="flex: 1; min-width: 0; padding: 16px 22px; display: flex; gap: 20px; overflow: hidden">
        <div class="doc" style="flex: 1; min-width: 0">{body}</div>
        {diagram}
      </div>'''
open(f'{S}/menus/project/RulesChapter.dc.html','w').write(HEAD.format(title='Правила — глава «Залп»')+window(chap_inner,'Залп')+TAIL.format(w=1366,h=660))

# C) RulesText — the whole text on one tall board
full=md2html(md)
H_TEXT=int(open(f'{S}/rules/textheight.txt').read()) if __import__('os').path.exists(f'{S}/rules/textheight.txt') else 6000
txt=f'''<div class="chart doc" style="width: 900px; min-height: {H_TEXT}px; box-sizing: border-box; padding: 34px 48px 40px; font-family: 'Alegreya Sans', system-ui, sans-serif; color: #eef3f6">
  <div class="sc" style="font-size: 13px; font-weight: 700; letter-spacing: .3em; color: #c9a048">ПОЛНЫЙ ТЕКСТ ДЛЯ ПРОВЕРКИ</div>
  <h1 class="sc" style="margin: 4px 0 18px; font-size: 38px; font-weight: 800; color: #f0d27a; text-shadow: 0 2px 0 #5c4615">Правила для новичка</h1>
  <div id="rulesText">{full}</div>
</div>
'''
open(f'{S}/menus/project/RulesText.dc.html','w').write(HEAD.format(title='Правила — полный текст')+txt+TAIL.format(w=900,h=H_TEXT))
print('ok')

# D) RulesPhone
chips=''.join(f'<a class="chip{" on" if i==0 else ""}">{(n+" ") if n else ""}{tl}</a>' for i,(n,tl) in enumerate(TOC[:5]))
ph=f'''<div style="width: 390px; height: 844px; position: relative; overflow: hidden; font-family: 'Alegreya Sans', system-ui, sans-serif; color: #eef3f6; background: #234a5e">
  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(4,8,12,.7)"></div>
  <section role="dialog" aria-label="Правила" class="chart" style="position: absolute; left: 0; right: 0; top: 44px; bottom: 0; box-sizing: border-box; border-top: 3px solid #c9a048; border-radius: 18px 18px 0 0; box-shadow: 0 -12px 40px rgba(0,0,0,.6); display: flex; flex-direction: column; overflow: hidden">
    <div aria-hidden="true" style="flex: none; height: 14px; display: flex; justify-content: center; align-items: center; background: #15212b"><span style="width: 44px; height: 5px; border-radius: 3px; background: #6f8796"></span></div>
    <header style="flex: none; height: 54px; display: flex; align-items: center; gap: 8px; padding: 0 12px 0 14px; background: #15212b">
      <img src="/_blob/b898c0440f8c0f2cae6d45bcfc67836e" alt="" width="34" height="34">
      <h1 class="sc" style="margin: 0; flex: 1; font-size: 23px; font-weight: 800; color: #f0d27a">Правила</h1>
      <button aria-label="Поиск" style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid rgba(201,160,72,.7); background: transparent; display: flex; align-items: center; justify-content: center"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><circle cx="7.5" cy="7.5" r="5.5" stroke="#e0bd62" stroke-width="1.8" fill="none"></circle><path d="M11.5 11.5 L16 16" stroke="#e0bd62" stroke-width="1.8" stroke-linecap="round"></path></svg></button>
      <button aria-label="Закрыть" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #c9a048; background: radial-gradient(circle at 40% 32%, #f6dd92, #c9a048 60%, #8a6a24); color: #24180a; font-size: 22px; font-weight: 700; line-height: 1">×</button>
    </header>
    <nav aria-label="Разделы правил" style="flex: none; display: flex; gap: 6px; padding: 8px 16px 10px; overflow: hidden; background: #15212b; border-bottom: 2px solid #c9a048; position: relative">
      {chips}
      <span aria-hidden="true" style="position: absolute; right: 0; top: 0; bottom: 0; width: 40px; background: linear-gradient(90deg, rgba(21,33,43,0), #15212b)"></span>
    </nav>
    <div style="flex: 1; min-height: 0; overflow: hidden; padding: 12px 16px 0; display: flex; flex-direction: column; gap: 10px; position: relative">
      {bosun_html("«Всё главное — здесь. Подробности — в главах выше».")}
      <div class="card"><h3>Раунд</h3><div style="display: flex; flex-direction: column; gap: 5px"><div class="step"><i>1</i>Море — откройте карту моря</div><div class="step"><i>2</i>Ход Пиратов</div><div class="step"><i>3</i>Ход Компании</div></div></div>
      <div class="card"><h3>Ход команды — оба корабля сразу</h3><div style="display: flex; flex-direction: column; gap: 5px"><div class="step"><i>1</i>Трюм: +3 Пороха (больше 8 не влезет). Горящие корабли получают урон.</div><div class="step"><i>2</i>Добор до 5 карт. Планы «Жемчужины» тоже считаются.</div><div class="step"><i>3</i>Действия: карт — не больше Команды, Залп — один на корабль.</div><div class="step"><i>4</i>«Ход окончен».</div></div></div>
      <div class="card"><h3>Залп</h3><p>Стоит 1 Порох. Урон = Пушки. По диагонали — на 1 меньше. Второй корабль бьёт ту же цель — на 1 больше (раз в ход). Без Заряда — по Корпусу.</p></div>
      <div class="card"><h3>Ход противника</h3><p>Реакций — не больше Парусов. Играйте, когда враг объявил Залп или карту, — до урона.</p></div>
      <span aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 40px; background: linear-gradient(rgba(14,27,38,0), #0e1b26)"></span>
    </div>
  </section>
</div>
'''
PH_CSS=".chip{{flex:none;display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border-radius:18px;border:1.5px solid rgba(201,160,72,.6);background:#0b141c;color:#c8d6dc;font-size:14px;white-space:nowrap}}.chip.on{{background:linear-gradient(#5a3a22,#3a2414);border-color:#c9a048;color:#f6dd92}}.card p,.step{{font-size:14px}}.bosun{{font-size:14.5px}}"
open(f'{S}/menus/project/RulesPhone.dc.html','w').write(HEAD.replace('</style>',PH_CSS+'</style>').format(title='Правила — телефон')+ph+TAIL.format(w=390,h=844))
