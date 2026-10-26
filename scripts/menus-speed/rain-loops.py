from pathlib import Path
from PIL import Image
import json,io,hashlib
bank=Path('src/ui/game/scene-window/art')
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
p=Path('src/ui/game/ship-window/scenes.json');data=json.loads(p.read_text())
for s in data.values():
 for n in walk(s['tree']):
  if not n.get('rain')or n.get('rainClosed')==2:continue
  a=n['art'];im=Image.open(bank/a['src']).convert('RGBA');out=Image.new('RGBA',im.size);src=im.load();dst=out.load();ratio=im.width/a['w'];pw,ph=round(64*ratio),round(30*ratio)
  for y in range(im.height):
   for x in range(im.width):dst[x,y]=src[(x+round(y*8/30))%pw,y%ph]
  b=io.BytesIO();out.save(b,format='WEBP',quality=90,method=4,exact=True,lossless=True);raw=b.getvalue();name='art-'+hashlib.sha256(raw).hexdigest()[:20]+'.webp';(bank/name).write_bytes(raw);a['src']=name;n['rainClosed']=2
p.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
