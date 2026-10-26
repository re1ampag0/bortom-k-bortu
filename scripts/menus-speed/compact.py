"""Final shared-bank GC and sizes. Safe after any individual scene exporter."""
from pathlib import Path
import json
bank=Path('src/ui/game/scene-window/art');keep=set();rows=[]
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
for folder in [Path('src/ui/menus'),Path('src/ui/game/ship-window'),Path('src/ui/game/weather-window')]:
 data=json.loads((folder/'scenes.json').read_text());aliases=json.loads((folder/'aliases.json').read_text());aliases={k:v for k,v in aliases.items()if '-live-'not in k and '-asset-'not in k};keep.update(aliases.values());(folder/'aliases.json').write_text(json.dumps(aliases,separators=(',',':')))
 for name,s in data.items():
  s.pop('features',None);files=set()
  for n in walk(s['tree']):
   files.update([n['image']]if n.get('image')else[]);files.update(a['src']for a in ([n['art']]if n.get('art')else[])+n.get('frames',[]))
  keep.update(files);rows.append({'family':str(folder),'name':name,'requests':len(files),'bytes':sum((bank/f).stat().st_size for f in files if(bank/f).exists())})
 (folder/'scenes.json').write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
for f in bank.iterdir():
 if f.name not in keep:f.unlink()
Path('docs/measurements/menus-speed/asset-budgets.json').write_text(json.dumps(rows,indent=2));print('bank',len(list(bank.iterdir())),sum(p.stat().st_size for p in bank.iterdir()))
for r in rows:
 if r['name']in ['Main','Phone','Panel','Blood','Deep','Pirates','Company']:print(r)
