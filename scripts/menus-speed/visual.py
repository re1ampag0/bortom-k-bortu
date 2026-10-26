from PIL import Image,ImageChops,ImageStat
from pathlib import Path
import json,math
rows=[];bank=Path('src/ui/game/scene-window/art');original=Path('/workspace/menus-speed-before')
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
def premultiply(im):
 im=im.convert('RGBA');a=im.getchannel('A');return Image.merge('RGB',tuple(ImageChops.multiply(c,a)for c in im.split()[:3]))
for family in ['menus','ship','weather']:
 folder=Path('src/ui/menus'if family=='menus'else f'src/ui/game/{family}-window');old=json.loads((original/folder/'scenes.json').read_text());new=json.loads((folder/'scenes.json').read_text())
 for name in (['Main','Phone','Pirates','Company','Blood']if family=='menus'else ['Ж','М','И','Г']if family=='ship'else ['storm','tortuga']):
  ids={n['id']:n for n in walk(old[name]['tree'])}
  samples=[]
  for n in walk(new[name]['tree']):
   a=n.get('art');b=ids.get(n['id'],{}).get('art')
   if not a or not b or a.get('tile')or n.get('periodicSubtree')or abs(a['w']-b['w'])>1 or abs(a['h']-b['h'])>1:continue
   before=Image.open(original/folder/'art'/b['src']);after=Image.open(bank/a['src'])
   if a.get('crop'):
    x,y,w,h,*_=a['crop'];after=after.crop((x,y,x+w,y+h))
   before=before.resize(after.size,Image.Resampling.LANCZOS);diff=ImageChops.difference(premultiply(before),premultiply(after));stat=ImageStat.Stat(diff);rms=math.sqrt(sum(v*v for v in stat.rms)/3);samples.append({'id':n['id'],'mean':sum(stat.mean)/3,'psnr':round(20*math.log10(255/rms),2)if rms else 99})
  rows.append({'family':family,'name':name,'samples':len(samples),'meanAbsoluteRGB':sum(r['mean']for r in samples)/len(samples)if samples else None,'worstPSNR':min(r['psnr']for r in samples)if samples else None,'note':'static corresponding rasters only; alpha premultiplied; G/L intentional changes excluded'})
Path('docs/measurements/menus-speed/visual.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False));print(rows)
