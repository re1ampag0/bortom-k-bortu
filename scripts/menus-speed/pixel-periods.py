from pathlib import Path
from PIL import Image
import json,re,hashlib,io
bank=Path('src/ui/game/scene-window/art')
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
for folder in ['src/ui/menus','src/ui/game/ship-window','src/ui/game/weather-window']:
 p=Path(folder+'/scenes.json');data=json.loads(p.read_text())
 for s in data.values():
  for n in walk(s['tree']):
   art=n.get('art',{});tile=art.get('tile');
   if not tile:continue
   old=tile['period'];period=round(old)
   if period==old:continue
   im=Image.open(bank/art['src']);im=im.resize((period*2,im.height),Image.Resampling.LANCZOS);out=io.BytesIO();im.save(out,format='WEBP',quality=90,method=4,exact=True);raw=out.getvalue();src='art-'+hashlib.sha256(raw).hexdigest()[:20]+'.webp';(bank/src).write_bytes(raw);art['src']=src;tile.update(period=period,origin=(-art['x'])%period)
   for a in n['anim']:
    for f in a['frames']:
     t=f.get('transform','');v=[float(x)for x in re.findall(r'-?\d*\.?\d+(?:e[+-]?\d+)?',t)]
     if len(v)==6:v[4]*=period/old;f['transform']='matrix('+','.join(str(x)for x in v)+')'
     elif t.startswith('translateX('):f['transform']=f'translateX({v[0]*period/old}px)'
 p.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
