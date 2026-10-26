from pathlib import Path
import json
unused=['backgroundColor','backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','boxShadow','filter','maskImage','maskSize','maskRepeat','mixBlendMode','right','bottom']
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
for folder in ['src/ui/menus','src/ui/game/ship-window','src/ui/game/weather-window']:
 p=Path(folder+'/scenes.json');data=json.loads(p.read_text())
 for s in data.values():
  for n in walk(s['tree']):
   for k in unused:n['style'].pop(k,None)
   for a in n['anim']:
    frames=a['frames']
    for f in frames:f.pop('computedOffset',None);f.pop('composite',None)
    # Retain the two ends of every constant run, including its hold duration.
    value=lambda f:{k:v for k,v in f.items()if k!='offset'}
    a['frames']=[f for i,f in enumerate(frames)if i==0 or i==len(frames)-1 or value(f)!=value(frames[i-1])or value(f)!=value(frames[i+1])]
 p.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
