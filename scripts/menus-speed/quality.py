"""Use the lower end of the approved WebP range for menu transfers, retaining 2x and alpha."""
from PIL import Image
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,hashlib,io
bank=Path('src/ui/game/scene-window/art');menu=json.loads(Path('src/ui/menus/scenes.json').read_text());names=set()
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
for s in menu.values():
 for n in walk(s['tree']):names.update(a['src']for a in ([n['art']]if n.get('art')else[])+n.get('frames',[]))
revision=Path('scripts/menus-speed/quality-map.json');old=json.loads(revision.read_text())if revision.exists()else{};already=set(old.values())
def convert(name):
 if not name.endswith('.webp')or name in already:return name,name
 im=Image.open(bank/name);b=io.BytesIO();im.save(b,format='WEBP',quality=88,method=4,exact=True);raw=b.getvalue()
 if len(raw)>=(bank/name).stat().st_size:return name,name
 src='art-'+hashlib.sha256(raw).hexdigest()[:20]+'.webp';(bank/src).write_bytes(raw);return name,src
mapping=dict(ThreadPoolExecutor(4).map(convert,sorted(names)));old.update(mapping);revision.write_text(json.dumps(old,separators=(',',':')))
def rewrite(v):
 if isinstance(v,dict):return {k:rewrite(x)for k,x in v.items()}
 if isinstance(v,list):return [rewrite(x)for x in v]
 return mapping.get(v,v)if isinstance(v,str)else v
for folder in ['src/ui/menus','src/ui/game/ship-window','src/ui/game/weather-window']:
 for filename in ['scenes.json','aliases.json']:
  p=Path(folder)/filename;p.write_text(json.dumps(rewrite(json.loads(p.read_text())),separators=(',',':'),ensure_ascii=False))
print('recompressed',sum(k!=v for k,v in mapping.items()))
