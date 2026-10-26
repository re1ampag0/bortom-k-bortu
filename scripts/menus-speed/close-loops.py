"""Close sampled curves without changing their duration or intermediate story keys."""
from pathlib import Path
from PIL import Image
import json,re,hashlib,io,copy
rows=json.loads(Path('docs/measurements/menus-speed/seams-before-fix.json').read_text());bank=Path('src/ui/game/scene-window/art');changes=[]
def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
def nums(s):return [float(x)for x in re.findall(r'-?\d*\.?\d+(?:e[+-]?\d+)?',str(s))]
def blend(a,b,p):
 if isinstance(a,(int,float))or re.fullmatch(r'-?[\d.]+',str(a)):return float(a)*(1-p)+float(b)*p
 av,bv=nums(a),nums(b)
 if a=='none' and str(b).startswith('matrix('):av=[1,0,0,1,0,0]
 if b=='none' and str(a).startswith('matrix('):bv=[1,0,0,1,0,0];b='matrix(1,0,0,1,0,0)'
 if len(av)!=len(bv):return a if p<1 else b
 it=iter([x*(1-p)+y*p for x,y in zip(av,bv)]);return re.sub(r'-?\d*\.?\d+(?:e[+-]?\d+)?',lambda _:str(round(next(it),7)),str(b))
for family in ['menus','ship','weather']:
 folder=Path('src/ui/menus' if family=='menus' else f'src/ui/game/{family}-window');data=json.loads((folder/'scenes.json').read_text())
 for row in rows:
  if row['family']!=family or not row.get('seam'):continue
  n=next(n for n in walk(data[row['name']]['tree'])if n['id']==row['id']);a=next((a for a in n['anim']if a['name']==row['animation']),None)
  if not a or a.get('closedRevision'):continue
  fs=a['frames'];a.setdefault('originalFrames',copy.deepcopy(fs));first,last=fs[0],fs[-1];action='close sampled return over final 20%'
  # Static ripple strips and repeating water are textures, not returning objects.
  art=n.get('art');name=a['name'];v0=nums(first.get('transform',''));v1=nums(last.get('transform',''));dx=0
  if len(v0)==len(v1)==6:dx=v1[4]-v0[4]
  elif 'translateX' in str(last.get('transform')):dx=nums(last['transform'])[0]
  if art and abs(dx)>1 and (re.search(r'(?:^|-)(?:r\d|edge)$',name)or name.startswith(('seaDrift','seaSwell'))):
   period=abs(dx);im=Image.open(bank/art['src']).convert('RGBA')
   if art.get('crop'):im=im.crop(tuple(art['crop'][:2])+tuple(art['crop'][i]+art['crop'][i+2]for i in range(2)))
   ratio=im.width/(art['tile']['period']if art.get('tile')else art['w']);left=round((-art['x'])% (art['tile']['period']if art.get('tile')else art['w'])*ratio);pw=max(1,round(period*ratio));left=max(0,min(left,im.width-pw));tile=im.crop((left,0,left+pw,im.height));out=io.BytesIO();tile.save(out,format='WEBP',quality=90,method=4,exact=True);raw=out.getvalue();src='art-'+hashlib.sha256(raw).hexdigest()[:20]+'.webp';(bank/src).write_bytes(raw);art.update(src=src,tile={'period':period,'origin':(-art['x'])%period});art.pop('crop',None)
   # Translation stays linear and ends exactly one period away; close other channels.
   target={**first,'transform':last['transform']};action='periodic texture, exact measured travel '+str(period)
  else:target=first
  # Short-lived particles fade at both boundaries, never flash on reset.
  if 'opacity'in first and 'opacity'in last and float(last['opacity'])<=.15 and float(first['opacity'])>.3:
   fs[0]={**first,'opacity':0};target={**target,'opacity':0};action+='; transparent boundary'
  for f in fs:
   t=float(f['offset'])
   if t>=.8:
    p=(t-.8)/.2;p=p*p*(3-2*p)
    for k in ['opacity','transform']:
     if k in target and k in f:f[k]=blend(f[k],target[k],p)
  fs[-1]={**target,'offset':1};a['closedRevision']='menus-speed';changes.append({**{k:row[k]for k in ['family','name','id','animation']},'action':action})
 (folder/'scenes.json').write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
Path('docs/measurements/menus-speed/loop-fixes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2));print('closed',len(changes))
