import json, re, sys
S = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/'
A5 = S + 'perenos/repo/docs/mockups/a5/'
fx = open(S + 'exact/fx3.js', encoding='utf-8').read().split('\n')
snip = '\n'.join(fx[6:7] + fx[20:26] + fx[45:48] + fx[54:71])
t = open(A5 + 'A5Table.html', encoding='utf-8').read()
def grab(after, n=0):
    i = t.find(after); m = re.search(r'<svg[\s\S]*?</svg>', t[i:]); return m.group(0)
icons = {
    'book': grab('aria-label="Правила"'), 'gear': grab('aria-label="Настройки"'), 'undo': grab('aria-label="Отменить"'),
    'storm': grab('right:118px'), 'volley': grab('<button class="cmd">'), 'ready': grab('class="ready"'),
    'regroup': grab('Перестроение<') if False else '<svg width="20" height="18" viewBox="0 0 18 16" aria-hidden="true"><path d="M2 5 H14 L11 2 M16 11 H4 L7 14" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
}
tpl = open(S + 'phone/phone_tpl.html', encoding='utf-8').read()
out = (tpl.replace('/*__FX__*/', snip)
       .replace('__SHIPS3__', open(S + 'ships3/ships3.json').read()).replace('__SHIPS__', open(A5 + 'art/ships2.json').read())
       .replace('__CELLS__', open(A5 + 'art/cells2.json').read())
       .replace('__KEGS__', open(S + 'exact/kegs.json').read())
       .replace('__BIG__', open(S + 'gen/bigships3.json').read())
       .replace('__PANO__', json.dumps(json.load(open(S + 'pano/pano.json'))['phone'], ensure_ascii=False))
       .replace('__ICONS__', json.dumps(icons, ensure_ascii=False))
       .replace('/*__ST3__*/', open(S + 'rig/status3.js', encoding='utf-8').read()).replace('/*__ST__*/', (lambda T: T[T.find('const ST = {'):T.find('let stView')])(open(S + 'exact/template.html', encoding='utf-8').read())))
out = out.replace('</script', '<\\/script').replace('<\\/script>\n</body>', '</script>\n</body>') if False else out
open(S + 'phone/A5Phone.html', 'w', encoding='utf-8').write(out)
print(len(out) // 1024, 'KB')
fonts = open(A5 + 'fx/data/fonts.css', encoding='utf-8').read()
off = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>', '<style>' + fonts.replace('\\', '\\\\') + '</style>', out)
open(S + 'phone/A5Phone-offline.html', 'w', encoding='utf-8').write(off)
print('offline', len(off) // 1024, 'KB')

art = re.sub(r'^<!doctype html>\s*<html lang="ru">\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', '', out)
art = art.replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
open(S + 'phone/artifact/telefon-a5.html', 'w', encoding='utf-8').write(art)
print('artifact', art[:80].replace('\n',' '))
