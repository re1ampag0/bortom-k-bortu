import json, re
S = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/'
A5 = S + 'perenos/repo/docs/mockups/a5/'
t = open(A5 + 'A5Table.html', encoding='utf-8').read()
def grab(after):
    i = t.find(after); return re.search(r'<svg[\s\S]*?</svg>', t[i:]).group(0)
icons = {'book': grab('aria-label="Правила"'), 'gear': grab('aria-label="Настройки"'), 'undo': grab('aria-label="Отменить"'), 'volley': grab('<button class="cmd">')}
tpl = open(S + 'rig/rig3_tpl.html', encoding='utf-8').read()
out = tpl.replace('/*__ST3__*/', open(S + 'rig/status3.js', encoding='utf-8').read()).replace('__SHIPS3__', open(S + 'ships3/ships3.json').read()).replace('__SHIPS__', open(A5 + 'art/ships2.json').read()).replace('__CELLS__', open(A5 + 'art/cells2.json').read()).replace('__ICONS__', json.dumps(icons, ensure_ascii=False))
open(S + 'rig/artifact/osnastka.html', 'w', encoding='utf-8').write(out)
fonts = open(A5 + 'fx/data/fonts.css', encoding='utf-8').read()
off = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>', lambda m: '<style>' + fonts + '</style>', out)
open(S + 'rig/offline.html', 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>' + off + '</body></html>')
print(len(out)//1024, 'KB')
