# data.js из data/game-data.json: корабли, карты по кодам движка (Ж-07, И-Л), карты моря (С-01) с ключами.
import json, sys
D = json.load(open(sys.argv[1], encoding='utf-8'))
ships, cards, sea = {}, {}, {}
CASES = {'Ж': ('«Жемчужины»', '«Жемчужине»', '«Жемчужину»', '«Жемчужине»'), 'М': ('«Мести»', '«Мести»', '«Месть»', '«Мести»'),
         'И': ('«Индевора»', '«Индевору»', '«Индевор»', '«Индеворе»'), 'Г': ('«Голландца»', '«Голландцу»', '«Голландца»', '«Голландце»')}
for s in D['ships']:
    g, dt, acc, pr = CASES[s['code']]
    ships[s['code']] = {'code': s['code'], 'name': s['name'], 'nick': '«' + s['nick'] + '»', 'short': s['nick'], 'captain': s.get('captain', ''), 'color': s['color'], 'side': s['side'],
                        'max': {t: s[t] for t in ('hull', 'sails', 'guns', 'crew')}, 'souls': s.get('souls'), 'gen': g, 'dat': dt, 'acc': acc, 'prep': pr}
    n = 0
    for c in D['decks'][s['code']]:
        for _ in range(c['copies']):
            n += 1
            cards[f"{s['code']}-{n:02d}"] = {k: c[k] for k in ('name', 'type', 'cost', 'soul', 'big', 'text', 'flavor', 'fx')} | {'deck': s['code']}
    L = D['legends'][s['code']]
    cards[f"{s['code']}-Л"] = {k: L[k] for k in ('name', 'type', 'cost', 'soul', 'big', 'text', 'flavor', 'fx')} | {'deck': s['code'], 'legend': True}
for i, c in enumerate(D['sea']):
    sea[f"С-{i+1:02d}"] = {k: c[k] for k in ('key', 'name', 'when', 'big', 'text', 'flavor')}
out = {'ships': ships, 'cards': cards, 'sea': sea, 'rules': {'jackHull': D['rules']['jackHull'], 'cap': D['econ']['cap']}}
open(sys.argv[2], 'w', encoding='utf-8').write('/* Сгенерировано build-data.py из data/game-data.json. Коды карт — как в движке. */\nwindow.GAME = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print(len(cards), 'cards', len(sea), 'sea')
