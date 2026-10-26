from PIL import Image
from pathlib import Path
import hashlib,json,io
p=Path('src/ui/menus/scenes.json');d=json.loads(p.read_text());bank=Path('src/ui/game/scene-window/art')
def walk(ns):
 for n in ns:
  yield n
  yield from walk(n['children'])
for key,s in d.items():
 for n in walk(s['tree']):
  a=n.get('art');cls=n.get('cls','')
  if not a or a.get('tile')or not any(x in cls for x in ['seaDrift','seaSwell']):continue
  period=360 if key.startswith(('Pirates','Company'))else 480
  im=Image.open(bank/a['src']);ratio=im.width/a['w'];start=round(-a['x']*ratio);start=max(0,min(start,im.width-round(period*ratio)));tile=im.crop((start,0,start+round(period*ratio),im.height));out=io.BytesIO();tile.save(out,format='WEBP',quality=90,method=4,exact=True);data=out.getvalue();name='art-'+hashlib.sha256(data).hexdigest()[:20]+'.webp';(bank/name).write_bytes(data);a['src']=name;a['tile']={'period':period,'origin':(-a['x'])%period};a.pop('crop',None)
p.write_text(json.dumps(d,separators=(',',':'),ensure_ascii=False))
